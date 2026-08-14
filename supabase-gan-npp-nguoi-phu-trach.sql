-- ============================================================================
-- v24 — GÁN NPP & NGƯỜI PHỤ TRÁCH VÀO DỰ ÁN ĐÃ ĐĂNG KÝ / ĐƯỢC CHỈ ĐỊNH
-- Chạy SAU migration v22 + v23. An toàn chạy lại nhiều lần.
-- Nguồn dữ liệu: chính là 2 file Excel đã nạp vào hệ thống —
--   · File nội địa "CẬP NHẬT DA THEO NPP"  → crm_du_an_nen.npp_chi_dinh
--   · File phân công đối tác (nội địa + quốc tế) → crm_org.nguoi_phu_trach
-- Nguyên tắc: CHỈ ĐIỀN CHỖ TRỐNG — không ghi đè gán tay đã có; không đụng
-- dự án đã 'phe_duyet' hoặc 'khong_phe_duyet'.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$
DECLARE n1 int; n2 int; n3 int; n4 int; n5 int; n6 int; nqt text;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS bao_cao(buoc text, so_luong int) ON COMMIT DROP;

  -- ===== BƯỚC 1: điền NPP chỉ định cho deal từ CSDL nền (link ma_du_an_nen) =====
  UPDATE crm_deals d SET npp_chi_dinh = n.npp_chi_dinh, nguoi_cap_nhat = 'auto-gan-v24'
  FROM crm_du_an_nen n
  WHERE d.ma_du_an_nen = n.ma_du_an
    AND COALESCE(d.npp_chi_dinh,'') = ''
    AND COALESCE(n.npp_chi_dinh,'') <> ''
    AND COALESCE(d.trang_thai_phe_duyet,'cho_tiep_nhan') IN ('cho_tiep_nhan','da_tiep_nhan','duoc_chi_dinh');
  GET DIAGNOSTICS n1 = ROW_COUNT;
  INSERT INTO bao_cao VALUES ('1. Điền NPP chỉ định từ CSDL nền', n1);

  -- ===== BƯỚC 2: nối npp_dang_ky_id — khớp tên NPP với danh bạ crm_org =====
  UPDATE crm_deals d SET npp_dang_ky_id = o.id, nguoi_cap_nhat = 'auto-gan-v24'
  FROM LATERAL (
    SELECT o.id FROM crm_org o
    WHERE o.phan_loai = 'npp'
      AND ( lower(o.ten) LIKE '%'||lower(d.npp_chi_dinh)||'%'
         OR lower(d.npp_chi_dinh) LIKE '%'||lower(o.ten)||'%'
         OR similarity(lower(o.ten), lower(d.npp_chi_dinh)) >= 0.55 )
    ORDER BY similarity(lower(o.ten), lower(d.npp_chi_dinh)) DESC
    LIMIT 1
  ) o
  WHERE d.npp_dang_ky_id IS NULL
    AND COALESCE(d.npp_chi_dinh,'') <> ''
    AND COALESCE(d.trang_thai_phe_duyet,'cho_tiep_nhan') IN ('cho_tiep_nhan','da_tiep_nhan','duoc_chi_dinh');
  GET DIAGNOSTICS n2 = ROW_COUNT;
  INSERT INTO bao_cao VALUES ('2. Nối NPP vào danh bạ (npp_dang_ky_id)', n2);

  -- ===== BƯỚC 3: gán người phụ trách = người đang quản lý NPP đó (crm_org) =====
  UPDATE crm_deals d SET nguoi_phu_trach = o.nguoi_phu_trach, nguoi_cap_nhat = 'auto-gan-v24'
  FROM crm_org o
  WHERE o.id = d.npp_dang_ky_id
    AND COALESCE(o.nguoi_phu_trach,'') <> ''
    AND COALESCE(d.nguoi_phu_trach,'') = ''
    AND COALESCE(d.trang_thai_phe_duyet,'cho_tiep_nhan') IN ('cho_tiep_nhan','da_tiep_nhan','duoc_chi_dinh');
  GET DIAGNOSTICS n3 = ROW_COUNT;
  INSERT INTO bao_cao VALUES ('3. Gán người phụ trách theo người quản lý NPP', n3);

  -- ===== BƯỚC 4: quốc tế — nếu đúng 1 nhân sự khu vực quốc tế thì gán mặc định =====
  SELECT CASE WHEN count(*) = 1 THEN min(ho_ten) END INTO nqt
    FROM crm_user_roles WHERE khu_vuc = 'quoc_te' AND vai_tro IN ('staff','manager');
  IF nqt IS NOT NULL THEN
    UPDATE crm_deals d SET nguoi_phu_trach = nqt, nguoi_cap_nhat = 'auto-gan-v24'
    WHERE COALESCE(d.quoc_gia,'VN') <> 'VN'
      AND COALESCE(d.nguoi_phu_trach,'') = ''
      AND COALESCE(d.trang_thai_phe_duyet,'cho_tiep_nhan') IN ('cho_tiep_nhan','da_tiep_nhan','duoc_chi_dinh');
    GET DIAGNOSTICS n4 = ROW_COUNT;
  ELSE n4 := 0; END IF;
  INSERT INTO bao_cao VALUES ('4. Quốc tế → phụ trách khu vực quốc tế ('||COALESCE(nqt,'bỏ qua: 0 hoặc >1 người')||')', n4);

  -- ===== BƯỚC 5: nâng trạng thái phê duyệt cho dự án đã có NPP chỉ định =====
  -- (chỉ nâng từ 'cho_tiep_nhan' → 'duoc_chi_dinh'; không đụng mức cao hơn)
  UPDATE crm_deals d SET trang_thai_phe_duyet = 'duoc_chi_dinh', nguoi_cap_nhat = 'auto-gan-v24'
  WHERE COALESCE(d.trang_thai_phe_duyet,'cho_tiep_nhan') = 'cho_tiep_nhan'
    AND (d.npp_dang_ky_id IS NOT NULL OR COALESCE(d.npp_chi_dinh,'') <> '');
  GET DIAGNOSTICS n5 = ROW_COUNT;
  INSERT INTO bao_cao VALUES ('5. Nâng trạng thái → Được chỉ định (có NPP)', n5);

  -- ===== BƯỚC 6: owner còn trống thì đồng bộ = người phụ trách =====
  UPDATE crm_deals d SET owner = d.nguoi_phu_trach
  WHERE COALESCE(d.owner,'') = '' AND COALESCE(d.nguoi_phu_trach,'') <> '';
  GET DIAGNOSTICS n6 = ROW_COUNT;
  INSERT INTO bao_cao VALUES ('6. Đồng bộ owner = người phụ trách (chỗ trống)', n6);
END $$;

-- ============ BÁO CÁO TỔNG HỢP (kết quả hiển thị) ============
SELECT buoc, so_luong FROM bao_cao
UNION ALL
SELECT '— Deal có NPP: ' , count(*)::int FROM crm_deals WHERE npp_dang_ky_id IS NOT NULL OR COALESCE(npp_chi_dinh,'')<>''
UNION ALL
SELECT '— Deal có người phụ trách: ', count(*)::int FROM crm_deals WHERE COALESCE(nguoi_phu_trach,'')<>''
UNION ALL
SELECT '— Deal CÒN THIẾU người phụ trách: ', count(*)::int FROM crm_deals WHERE COALESCE(nguoi_phu_trach,'')=''
UNION ALL
SELECT '— NPP trong danh bạ CHƯA có người quản lý (cần bổ sung!): ', count(*)::int
  FROM crm_org WHERE phan_loai='npp' AND COALESCE(nguoi_phu_trach,'')='';

-- ============================================================================
-- TRUY VẤN SOI CHI TIẾT (chạy riêng từng câu khi cần):
--
-- a) NPP nào chưa có người quản lý → bổ sung bằng tab Đối tác → ⬆ Nhập phân công:
-- SELECT ten, quoc_gia FROM crm_org WHERE phan_loai='npp' AND COALESCE(nguoi_phu_trach,'')='' ORDER BY quoc_gia, ten;
--
-- b) Dự án còn thiếu người phụ trách:
-- SELECT ten, quoc_gia, npp_chi_dinh, stage FROM crm_deals WHERE COALESCE(nguoi_phu_trach,'')='' ORDER BY quoc_gia, ten;
--
-- c) Soát lại những gì script vừa gán:
-- SELECT ten, npp_chi_dinh, nguoi_phu_trach, trang_thai_phe_duyet FROM crm_deals WHERE nguoi_cap_nhat='auto-gan-v24' ORDER BY ten;
-- ============================================================================
