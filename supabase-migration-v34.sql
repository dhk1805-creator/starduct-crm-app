-- ============================================================================
-- MIGRATION v34 — SỬA VIEW TỶ LỆ WIN/TRƯỢT THEO NPP (crm_v_ty_le_npp)
-- Lỗi cũ: "win" đếm trên toàn bộ dự án có ghi NSCA cung cấp, còn "kết thúc"
-- chỉ đếm dự án KẾT THÚC → win > kết thúc, tỷ lệ 100% ảo.
-- Quy tắc mới (một mẫu số thống nhất — dự án ĐÃ ĐÓNG SỔ):
--   đóng sổ  = hiện trạng KẾT THÚC hoặc TRƯỢT
--   win      = đóng sổ  VÀ  NSCA cung cấp = "Có cung cấp"
--   trượt    = hiện trạng TRƯỢT, hoặc đóng sổ mà NSCA cung cấp = "Trượt"
--   thiếu KQ = đóng sổ còn lại (chưa ghi NSCA cung cấp?)
--   tỷ lệ win (app tính) = win / (win + trượt)
-- ============================================================================

DROP VIEW IF EXISTS crm_v_ty_le_npp;
CREATE VIEW crm_v_ty_le_npp AS
SELECT
  COALESCE(NULLIF(trim(npp_chi_dinh),''),'(chưa chỉ định)') AS npp,
  count(*) FILTER (WHERE upper(trim(COALESCE(hien_trang,''))) IN ('KẾT THÚC','TRƯỢT')) AS ket_thuc,
  count(*) FILTER (WHERE upper(trim(COALESCE(hien_trang,''))) IN ('KẾT THÚC','TRƯỢT')
                     AND nsca_cung_cap ILIKE 'Có%')                                    AS win,
  count(*) FILTER (WHERE upper(trim(COALESCE(hien_trang,''))) = 'TRƯỢT'
                      OR (upper(trim(COALESCE(hien_trang,''))) = 'KẾT THÚC'
                          AND nsca_cung_cap ILIKE 'Trượt%'))                            AS thua,
  count(*) FILTER (WHERE upper(trim(COALESCE(hien_trang,''))) IN ('KẾT THÚC','TRƯỢT')
                     AND (nsca_cung_cap IS NULL OR trim(nsca_cung_cap)=''
                          OR nsca_cung_cap ILIKE 'Chưa%'))                              AS ket_thuc_thieu_kq
FROM crm_du_an_nen
GROUP BY 1;

GRANT SELECT ON crm_v_ty_le_npp TO anon, authenticated;

-- Soi thử kết quả mới:
SELECT * FROM crm_v_ty_le_npp WHERE ket_thuc > 0 ORDER BY win DESC LIMIT 10;
