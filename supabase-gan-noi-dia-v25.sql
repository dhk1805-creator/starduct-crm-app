-- ============================================================================
-- v25 — GÁN NGƯỜI PHỤ TRÁCH DỰ ÁN NỘI ĐỊA (theo file CẬP NHẬT DA THEO NPP)
-- Quy tắc đã chốt với CEO 14/08:
--   1. Theo từng dự án: người phụ trách = NGƯỜI CẬP NHẬT của dự án đó trong
--      danh mục nền (crm_du_an_nen.nguoi_cap_nhat — đã nạp từ file).
--   2. Mặc định theo NPP (khi thiếu tín hiệu dòng): NTK→Đức · GALAXYTECH→Cúc
--      · MEPCO→Cúc · VNMEP→Cúc · IMP→Cúc — đồng thời ghi vào danh bạ crm_org.
--   3. 137 dự án chưa có NPP: ĐỂ TRỐNG chờ phân công tay.
-- Kèm dọn dữ liệu: giá trị "Xác nhận lại với NSCA" / "Các NPP cùng tham gia"
-- không phải tên NPP → hạ lại trạng thái Chờ tiếp nhận (v24 lỡ nâng nhầm),
-- gán người theo dõi xác minh theo thống kê (Cúc / Đức).
-- Chỉ điền chỗ trống. An toàn chạy lại nhiều lần.
-- ============================================================================

-- ===== 0. BẢNG QUY ĐỔI TÊN GỌN → HỌ TÊN ĐẦY ĐỦ (khớp danh bạ nhân sự) =====
DROP TABLE IF EXISTS map_ns;
CREATE TEMP TABLE map_ns(ten_gon text PRIMARY KEY, ho_ten text);
INSERT INTO map_ns(ten_gon) VALUES ('Nam'),('Đức'),('LQA'),('Thịnh'),('Cúc'),('Duy');

-- khớp theo chứa-tên (chỉ nhận khi khớp DUY NHẤT 1 nhân sự)
UPDATE map_ns m SET ho_ten = (
  SELECT min(u.ho_ten) FROM crm_user_roles u
  WHERE lower(u.ho_ten) LIKE '%'||lower(m.ten_gon)||'%')
WHERE (SELECT count(*) FROM crm_user_roles u
       WHERE lower(u.ho_ten) LIKE '%'||lower(m.ten_gon)||'%') = 1;

-- LQA = viết tắt chữ cái đầu (VD: Lê Quang Anh) — chỉ nhận khi duy nhất
UPDATE map_ns m SET ho_ten = (
  SELECT min(u.ho_ten) FROM crm_user_roles u
  WHERE upper((SELECT string_agg(upper(left(w,1)),'')
               FROM regexp_split_to_table(u.ho_ten,'\s+') w)) = upper(m.ten_gon))
WHERE m.ho_ten IS NULL AND length(m.ten_gon) >= 2
  AND (SELECT count(*) FROM crm_user_roles u
       WHERE upper((SELECT string_agg(upper(left(w,1)),'')
                    FROM regexp_split_to_table(u.ho_ten,'\s+') w)) = upper(m.ten_gon)) = 1;

-- không khớp được thì tạm dùng chính tên gọn (soát tay sau)
UPDATE map_ns SET ho_ten = ten_gon WHERE ho_ten IS NULL;

-- hàm tra: lấy tên đầu tiên nếu ô ghi "Nam, Đức"
CREATE OR REPLACE FUNCTION pg_temp.tra_ns(x text) RETURNS text LANGUAGE sql AS $$
  SELECT COALESCE((SELECT ho_ten FROM map_ns WHERE lower(ten_gon)=lower(trim(split_part(x,',',1)))),
                  trim(split_part(x,',',1)))
$$;

DROP TABLE IF EXISTS bao_cao;
CREATE TEMP TABLE bao_cao(buoc text, so_luong int);

DO $$
DECLARE n1 int; n2 int; n3 int; n4 int; n5 int; n6 int;
BEGIN
  -- ===== 1. THEO TỪNG DỰ ÁN: người phụ trách = người cập nhật trong nền =====
  UPDATE crm_deals d SET
    nguoi_phu_trach = pg_temp.tra_ns(n.nguoi_cap_nhat),
    nguoi_cap_nhat  = 'auto-gan-v25'
  FROM crm_du_an_nen n
  WHERE d.ma_du_an_nen = n.ma_du_an
    AND COALESCE(d.nguoi_phu_trach,'') = ''
    AND COALESCE(n.nguoi_cap_nhat,'') <> ''
    AND COALESCE(d.trang_thai_phe_duyet,'cho_tiep_nhan') IN ('cho_tiep_nhan','da_tiep_nhan','duoc_chi_dinh');
  GET DIAGNOSTICS n1 = ROW_COUNT;
  INSERT INTO bao_cao VALUES ('1. Gán theo NGƯỜI CẬP NHẬT của từng dự án (nền)', n1);

  -- ===== 2. MẶC ĐỊNH THEO NPP: NTK→Đức · GALAXYTECH/MEPCO/VNMEP/IMP→Cúc =====
  UPDATE crm_deals d SET
    nguoi_phu_trach = pg_temp.tra_ns(CASE
      WHEN upper(d.npp_chi_dinh) LIKE 'NTK%'        THEN 'Đức'
      WHEN upper(d.npp_chi_dinh) LIKE 'GALAXY%'     THEN 'Cúc'
      WHEN upper(d.npp_chi_dinh) LIKE 'MEPCO%'      THEN 'Cúc'
      WHEN upper(d.npp_chi_dinh) LIKE 'VNMEP%'      THEN 'Cúc'
      WHEN upper(d.npp_chi_dinh) LIKE 'IMP%'        THEN 'Cúc' END),
    nguoi_cap_nhat = 'auto-gan-v25'
  WHERE COALESCE(d.nguoi_phu_trach,'') = ''
    AND upper(COALESCE(d.npp_chi_dinh,'')) SIMILAR TO '(NTK|GALAXY|MEPCO|VNMEP|IMP)%'
    AND COALESCE(d.trang_thai_phe_duyet,'cho_tiep_nhan') IN ('cho_tiep_nhan','da_tiep_nhan','duoc_chi_dinh');
  GET DIAGNOSTICS n2 = ROW_COUNT;
  INSERT INTO bao_cao VALUES ('2. Gán mặc định theo NPP (NTK→Đức, còn lại→Cúc)', n2);

  -- ===== 3. GHI PHÂN CÔNG VÀO DANH BẠ NPP (crm_org) — chỉ chỗ trống =====
  UPDATE crm_org o SET nguoi_phu_trach = pg_temp.tra_ns(CASE
      WHEN upper(o.ten) LIKE '%NTK%'        THEN 'Đức'
      WHEN upper(o.ten) LIKE '%GALAXYTECH%' THEN 'Cúc'
      WHEN upper(o.ten) LIKE '%MEPCO%'      THEN 'Cúc'
      WHEN upper(o.ten) LIKE '%VNMEP%'      THEN 'Cúc'
      WHEN upper(o.ten) = 'IMP' OR upper(o.ten) LIKE 'IMP %' THEN 'Cúc' END)
  WHERE o.phan_loai = 'npp'
    AND COALESCE(o.nguoi_phu_trach,'') = ''
    AND ( upper(o.ten) LIKE '%NTK%' OR upper(o.ten) LIKE '%GALAXYTECH%'
       OR upper(o.ten) LIKE '%MEPCO%' OR upper(o.ten) LIKE '%VNMEP%'
       OR upper(o.ten) = 'IMP' OR upper(o.ten) LIKE 'IMP %');
  GET DIAGNOSTICS n3 = ROW_COUNT;
  INSERT INTO bao_cao VALUES ('3. Ghi người quản lý vào danh bạ NPP', n3);

  -- ===== 4. DỌN GIÁ TRỊ KHÔNG PHẢI NPP: hạ trạng thái v24 lỡ nâng =====
  UPDATE crm_deals d SET trang_thai_phe_duyet = 'cho_tiep_nhan', nguoi_cap_nhat = 'auto-gan-v25'
  WHERE d.trang_thai_phe_duyet = 'duoc_chi_dinh'
    AND d.nguoi_phe_duyet IS NULL
    AND ( d.npp_chi_dinh IN ('Xác nhận lại với NSCA','Các NPP cùng tham gia')
       OR d.npp_chi_dinh LIKE 'Chỉ định theo%' OR d.npp_chi_dinh LIKE 'Duyệt theo%' );
  GET DIAGNOSTICS n4 = ROW_COUNT;
  INSERT INTO bao_cao VALUES ('4. Hạ lại Chờ tiếp nhận (giá trị NPP là ghi chú)', n4);

  -- ===== 5. GÁN NGƯỜI THEO DÕI XÁC MINH cho nhóm ghi chú =====
  UPDATE crm_deals d SET
    nguoi_phu_trach = pg_temp.tra_ns(CASE
      WHEN d.npp_chi_dinh = 'Xác nhận lại với NSCA'  THEN 'Cúc'
      WHEN d.npp_chi_dinh = 'Các NPP cùng tham gia'  THEN 'Đức' END),
    nguoi_cap_nhat = 'auto-gan-v25'
  WHERE COALESCE(d.nguoi_phu_trach,'') = ''
    AND d.npp_chi_dinh IN ('Xác nhận lại với NSCA','Các NPP cùng tham gia');
  GET DIAGNOSTICS n5 = ROW_COUNT;
  INSERT INTO bao_cao VALUES ('5. Gán người theo dõi xác minh (Cúc/Đức)', n5);

  -- ===== 6. ĐỒNG BỘ owner = người phụ trách (chỗ trống) =====
  UPDATE crm_deals d SET owner = d.nguoi_phu_trach
  WHERE COALESCE(d.owner,'') = '' AND COALESCE(d.nguoi_phu_trach,'') <> '';
  GET DIAGNOSTICS n6 = ROW_COUNT;
  INSERT INTO bao_cao VALUES ('6. Đồng bộ owner = người phụ trách', n6);
END $$;

-- ============ BÁO CÁO ============
SELECT buoc, so_luong FROM bao_cao
UNION ALL
SELECT '— Quy đổi tên: '||ten_gon||' → '||ho_ten||
       CASE WHEN ten_gon = ho_ten THEN '  (⚠ chưa khớp danh bạ nhân sự)' ELSE '' END, NULL
  FROM map_ns
UNION ALL
SELECT '— Deal có người phụ trách: ', count(*)::int FROM crm_deals WHERE COALESCE(nguoi_phu_trach,'')<>''
UNION ALL
SELECT '— Deal CÒN THIẾU (để trống chờ phân công tay): ', count(*)::int
  FROM crm_deals WHERE COALESCE(nguoi_phu_trach,'')='';

-- Soi danh sách còn thiếu (chạy riêng khi cần):
-- SELECT ten, quoc_gia, dia_diem, stage FROM crm_deals
--   WHERE COALESCE(nguoi_phu_trach,'')='' ORDER BY quoc_gia, dia_diem, ten;
-- Soi những gì v25 vừa gán:
-- SELECT ten, npp_chi_dinh, nguoi_phu_trach, trang_thai_phe_duyet
--   FROM crm_deals WHERE nguoi_cap_nhat='auto-gan-v25' ORDER BY nguoi_phu_trach, ten;
