-- ============================================================================
-- MIGRATION v23 — HỢP NHẤT DỰ ÁN ↔ DỰ ÁN NỀN (một nguồn CSDL duy nhất)
-- Chạy SAU migration v22. An toàn chạy lại nhiều lần (idempotent).
-- Mục tiêu: nối mỗi dự án đang theo dõi (crm_deals) với bản ghi gốc trong danh
-- mục nền (crm_du_an_nen) qua ma_du_an_nen; phát hiện + gộp bản ghi nền trùng
-- lặp (tình báo thu thập chồng lên dữ liệu có sẵn).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============ 1. KHÓA LIÊN KẾT deals ↔ nền ============
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS ma_du_an_nen TEXT;
CREATE INDEX IF NOT EXISTS idx_deals_nen ON crm_deals(ma_du_an_nen);
CREATE INDEX IF NOT EXISTS idx_nen_ten_trgm ON crm_du_an_nen USING gin (ten_du_an gin_trgm_ops);

-- Nối tự động theo khớp tên >= 75% (chỉ điền chỗ còn trống, không ghi đè link tay)
CREATE OR REPLACE FUNCTION crm_lien_ket_nen_deals() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE n integer := 0; r record; ma text;
BEGIN
  FOR r IN SELECT id, ten FROM crm_deals WHERE ma_du_an_nen IS NULL LOOP
    SELECT dn.ma_du_an INTO ma FROM crm_du_an_nen dn
      WHERE similarity(lower(dn.ten_du_an), lower(r.ten)) >= 0.75
      ORDER BY similarity(lower(dn.ten_du_an), lower(r.ten)) DESC LIMIT 1;
    IF ma IS NOT NULL THEN
      UPDATE crm_deals SET ma_du_an_nen = ma WHERE id = r.id;
      n := n + 1;
    END IF;
  END LOOP;
  RETURN n;
END $$;

-- ============ 2. PHÁT HIỆN BẢN GHI NỀN TRÙNG LẶP ============
-- Cặp nghi trùng: tên giống >= 85% và cùng tỉnh (hoặc một bên thiếu tỉnh).
-- Trả về tối đa 200 cặp, giống nhất xếp trước. Mã nhỏ hơn đề xuất GIỮ.
CREATE OR REPLACE FUNCTION crm_tim_nen_trung_lap()
RETURNS TABLE(ma_giu text, ten_giu text, ma_bo text, ten_bo text,
              tinh text, do_giong numeric, npp_giu text, npp_bo text)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT a.ma_du_an, a.ten_du_an, b.ma_du_an, b.ten_du_an,
         COALESCE(a.tinh, b.tinh),
         round(similarity(lower(a.ten_du_an), lower(b.ten_du_an))::numeric, 2),
         a.npp_chi_dinh, b.npp_chi_dinh
  FROM crm_du_an_nen a
  JOIN crm_du_an_nen b
    ON a.ma_du_an < b.ma_du_an
   AND (a.tinh = b.tinh OR a.tinh IS NULL OR b.tinh IS NULL)
   AND similarity(lower(a.ten_du_an), lower(b.ten_du_an)) >= 0.85
  ORDER BY 6 DESC
  LIMIT 200;
END $$;

-- ============ 3. GỘP BẢN GHI NỀN TRÙNG (giữ 1, chuyển hết dữ liệu con) ============
-- Chuyển BCI + nhật ký cập nhật + link deals từ bản BỎ sang bản GIỮ,
-- điền bù các trường còn trống của bản GIỮ, rồi xóa bản BỎ.
CREATE OR REPLACE FUNCTION crm_gop_nen(p_ma_giu text, p_ma_bo text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE g record; b record;
BEGIN
  SELECT * INTO g FROM crm_du_an_nen WHERE ma_du_an = p_ma_giu LIMIT 1;
  SELECT * INTO b FROM crm_du_an_nen WHERE ma_du_an = p_ma_bo  LIMIT 1;
  IF g IS NULL OR b IS NULL THEN RETURN 'Không tìm thấy mã ' || COALESCE(p_ma_giu,'?') || ' hoặc ' || COALESCE(p_ma_bo,'?'); END IF;

  -- điền bù trường trống của bản giữ từ bản bỏ
  UPDATE crm_du_an_nen SET
    cdt              = COALESCE(cdt, b.cdt),
    tinh             = COALESCE(tinh, b.tinh),
    quan_huyen       = COALESCE(quan_huyen, b.quan_huyen),
    npp_chi_dinh     = COALESCE(npp_chi_dinh, b.npp_chi_dinh),
    ngay_cap_nhat_npp= COALESCE(ngay_cap_nhat_npp, b.ngay_cap_nhat_npp),
    kh_da_bao_gia    = COALESCE(kh_da_bao_gia, b.kh_da_bao_gia),
    nha_thau_cua_npp = COALESCE(nha_thau_cua_npp, b.nha_thau_cua_npp),
    spec_in          = COALESCE(spec_in, b.spec_in),
    hien_trang       = COALESCE(hien_trang, b.hien_trang),
    nsca_cung_cap    = COALESCE(nsca_cung_cap, b.nsca_cung_cap),
    ghi_chu          = CASE WHEN b.ghi_chu IS NULL THEN ghi_chu
                            WHEN ghi_chu IS NULL THEN b.ghi_chu
                            ELSE ghi_chu || ' | [gộp ' || p_ma_bo || '] ' || b.ghi_chu END
  WHERE ma_du_an = p_ma_giu;

  -- chuyển nhật ký cập nhật (khóa thang+ma): dòng đụng khóa thì bỏ (đã có bản giữ)
  UPDATE crm_du_an_cap_nhat c SET ma_du_an = p_ma_giu
    WHERE c.ma_du_an = p_ma_bo
      AND NOT EXISTS (SELECT 1 FROM crm_du_an_cap_nhat x
                      WHERE x.ma_du_an = p_ma_giu AND x.thang = c.thang);
  DELETE FROM crm_du_an_cap_nhat WHERE ma_du_an = p_ma_bo;

  -- chuyển BCI (khóa ma+ten): tương tự
  UPDATE crm_bci c SET ma_du_an = p_ma_giu
    WHERE c.ma_du_an = p_ma_bo
      AND NOT EXISTS (SELECT 1 FROM crm_bci x
                      WHERE x.ma_du_an = p_ma_giu AND x.ten_du_an = c.ten_du_an);
  DELETE FROM crm_bci WHERE ma_du_an = p_ma_bo;

  -- chuyển link từ deals
  UPDATE crm_deals SET ma_du_an_nen = p_ma_giu WHERE ma_du_an_nen = p_ma_bo;

  DELETE FROM crm_du_an_nen WHERE ma_du_an = p_ma_bo;
  RETURN 'OK: đã gộp ' || p_ma_bo || ' vào ' || p_ma_giu;
END $$;

-- ============ 4. QUYỀN ============
GRANT EXECUTE ON FUNCTION crm_lien_ket_nen_deals()          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION crm_tim_nen_trung_lap()           TO anon, authenticated;
GRANT EXECUTE ON FUNCTION crm_gop_nen(text, text)           TO anon, authenticated;

-- ============ 5. CHẠY NỐI LẦN ĐẦU ============
SELECT crm_lien_ket_nen_deals() AS so_du_an_da_noi_voi_nen;
