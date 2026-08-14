-- ============================================================================
-- MIGRATION v22 — HYBRID WEB-APP CRM STARDUCT (crm.starduct.online)
-- Chạy trong Supabase Dashboard → SQL Editor → Run.
-- An toàn chạy lại nhiều lần (idempotent: IF NOT EXISTS / OR REPLACE).
-- Theo PRD "Hybrid Webapp CRM" — Phần 2, 3 và mô hình Project-Centric Workspace.
-- ============================================================================

-- ============ 1. MỞ RỘNG crm_deals — NPP, Spec-in & Phê duyệt minh chứng ============
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS npp_chi_dinh   TEXT; -- NPP được chỉ định (NTK, Galaxy, VNMEP, NPP quốc tế…)
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS kh_da_bg       TEXT; -- Khách hàng đã báo giá
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS nt_cua_npp     TEXT; -- Nhà thầu của NPP tại công trường
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS spec_in_status TEXT; -- Đang xử lý, Van-Cửa, ALL…
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS hien_trang_da  TEXT; -- Thiết kế, Đấu thầu, Thi công thô, Thi công MEP, Kết thúc…
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS nguoi_cap_nhat TEXT; -- Nhân sự cập nhật gần nhất
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS nguoi_phu_trach TEXT; -- Người phụ trách chính (lọc theo nhân sự NPP)

-- Cơ chế phê duyệt & minh chứng
DO $$ BEGIN
  ALTER TABLE crm_deals ADD COLUMN trang_thai_phe_duyet TEXT
    CHECK (trang_thai_phe_duyet IN ('cho_tiep_nhan','da_tiep_nhan','duoc_chi_dinh','phe_duyet','khong_phe_duyet'))
    DEFAULT 'cho_tiep_nhan';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS file_minh_chung_url TEXT; -- ảnh hiện trạng / file Spec-in (Supabase Storage)
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS ly_do_tu_choi       TEXT; -- bắt buộc khi khong_phe_duyet
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS loss_reason         TEXT; -- bắt buộc khi stage = 'dong' (thua/hủy)
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS ngay_phe_duyet      TIMESTAMPTZ;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS nguoi_phe_duyet     TEXT;

-- ============ 2. TOUCHPOINTS NEO THEO DỰ ÁN (Project-Centric Workspace) ============
ALTER TABLE crm_touchpoints ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tp_deal ON crm_touchpoints(deal_id);

-- ============ 3. LIÊN KẾT BÁO GIÁ ↔ DỰ ÁN (crm_quotations có sẵn từ LIST BG) ============
ALTER TABLE crm_quotations ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL;
ALTER TABLE crm_quotations ADD COLUMN IF NOT EXISTS org_id  UUID REFERENCES crm_org(id)  ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_q_deal ON crm_quotations(deal_id);

-- Nối tự động báo giá → dự án đang theo (khớp tên ≥ 75%, cùng triết lý crm_dong_bo_nen_sang_deals)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE OR REPLACE FUNCTION crm_noi_bao_gia_vao_deals() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE n integer := 0; r record; did uuid;
BEGIN
  FOR r IN SELECT stt, ten_da, ten_khach FROM crm_quotations WHERE deal_id IS NULL AND ten_da IS NOT NULL LOOP
    SELECT id INTO did FROM crm_deals d
      WHERE similarity(lower(d.ten), lower(r.ten_da)) >= 0.75
      ORDER BY similarity(lower(d.ten), lower(r.ten_da)) DESC LIMIT 1;
    IF did IS NOT NULL THEN
      UPDATE crm_quotations SET deal_id = did WHERE stt = r.stt;
      n := n + 1;
    END IF;
  END LOOP;
  RETURN n;
END $$;

-- ============ 4. VIEW DỰ ÁN ĐỨNG YÊN > 21 NGÀY (Stalled Deal Alert) ============
CREATE OR REPLACE VIEW v_crm_deals_dung_yen AS
SELECT d.*,
       GREATEST(
         COALESCE(d.lan_cap_nhat_cuoi, 'epoch'::timestamptz),
         COALESCE((SELECT max(t.ngay)::timestamptz FROM crm_touchpoints t WHERE t.deal_id = d.id), 'epoch'::timestamptz)
       ) AS tuong_tac_cuoi,
       (now()::date - GREATEST(
         COALESCE(d.lan_cap_nhat_cuoi, 'epoch'::timestamptz),
         COALESCE((SELECT max(t.ngay)::timestamptz FROM crm_touchpoints t WHERE t.deal_id = d.id), 'epoch'::timestamptz)
       )::date) AS so_ngay_dung
FROM crm_deals d
WHERE d.stage NOT IN ('dong','po')
  AND (now()::date - GREATEST(
         COALESCE(d.lan_cap_nhat_cuoi, 'epoch'::timestamptz),
         COALESCE((SELECT max(t.ngay)::timestamptz FROM crm_touchpoints t WHERE t.deal_id = d.id), 'epoch'::timestamptz)
       )::date) > 21;

-- ============ 5. KHÓA ĐỘC QUYỀN & CHỐNG DẪM CHÂN (Anti-Conflict, cưỡng chế phía DB) ============
-- Khi dự án đã 'phe_duyet' và có NPP giữ quyền: không cho đổi NPP/owner trừ khi
-- người cập nhật có vai trò manager/ceo (truyền qua tham số nguoi_cap_nhat đối chiếu crm_user_roles).
CREATE OR REPLACE FUNCTION crm_chan_doi_npp_da_khoa() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE vt text;
BEGIN
  IF OLD.trang_thai_phe_duyet = 'phe_duyet'
     AND (COALESCE(NEW.npp_dang_ky_id::text,'') <> COALESCE(OLD.npp_dang_ky_id::text,'')
          OR COALESCE(NEW.npp_chi_dinh,'') <> COALESCE(OLD.npp_chi_dinh,'')) THEN
    SELECT vai_tro INTO vt FROM crm_user_roles
      WHERE ho_ten = COALESCE(NEW.nguoi_cap_nhat,'') LIMIT 1;
    IF COALESCE(vt,'') NOT IN ('manager','ceo') THEN
      RAISE EXCEPTION 'DU_AN_DA_KHOA: Dự án đã được phê duyệt bảo vệ cho NPP "%" — cần Quản lý/CEO nhượng quyền.', OLD.npp_chi_dinh;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_chan_doi_npp ON crm_deals;
CREATE TRIGGER trg_chan_doi_npp BEFORE UPDATE ON crm_deals
  FOR EACH ROW EXECUTE FUNCTION crm_chan_doi_npp_da_khoa();

-- Bắt buộc lý do khi từ chối phê duyệt hoặc đóng-thua
CREATE OR REPLACE FUNCTION crm_bat_buoc_ly_do() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.trang_thai_phe_duyet = 'khong_phe_duyet' AND COALESCE(trim(NEW.ly_do_tu_choi),'') = '' THEN
    RAISE EXCEPTION 'THIEU_LY_DO: Không phê duyệt bắt buộc ghi ly_do_tu_choi (quy tắc L4).';
  END IF;
  IF NEW.stage = 'dong' AND COALESCE(OLD.stage,'') <> 'dong' AND COALESCE(trim(NEW.loss_reason),'') = '' THEN
    RAISE EXCEPTION 'THIEU_LY_DO: Chuyển sang Thua/Hủy bắt buộc chọn loss_reason.';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_bat_buoc_ly_do ON crm_deals;
CREATE TRIGGER trg_bat_buoc_ly_do BEFORE UPDATE ON crm_deals
  FOR EACH ROW EXECUTE FUNCTION crm_bat_buoc_ly_do();

-- ============ 6. PHÂN QUYỀN NỘI BỘ NPP (Parent account → NPP Lead / NPP Staff) ============
ALTER TABLE crm_user_roles ADD COLUMN IF NOT EXISTS npp_org_id UUID REFERENCES crm_org(id) ON DELETE SET NULL;
-- vai_tro mở rộng: 'npp_lead' (thấy toàn bộ dự án của NPP mình, phân bổ cho nhân viên)
--                  'npp_staff' (chỉ thấy dự án mình được giao nguoi_phu_trach/owner)
-- Ứng dụng lọc phía client theo ME.vai_tro + ME.npp_org_id (xem js/12-hybrid.js).
-- LƯU Ý BẢO MẬT: app đang dùng anon key + đăng nhập rpc crm_login, nên phân quyền cứng
-- bằng RLS theo NPP đòi hỏi chuyển sang Supabase Auth cho tài khoản NPP (giai đoạn 2).

-- ============ 7. STORAGE MINH CHỨNG (ảnh hiện trạng / file Spec-in) ============
INSERT INTO storage.buckets (id, name, public)
  VALUES ('minh-chung','minh-chung', true)
  ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "minh_chung_doc"  ON storage.objects;
DROP POLICY IF EXISTS "minh_chung_ghi"  ON storage.objects;
CREATE POLICY "minh_chung_doc" ON storage.objects FOR SELECT
  USING (bucket_id = 'minh-chung');
CREATE POLICY "minh_chung_ghi" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'minh-chung' AND (storage.foldername(name))[1] = 'deals');

-- ============ 8. QUYỀN TRUY CẬP VIEW/FUNCTION MỚI ============
GRANT SELECT ON v_crm_deals_dung_yen TO anon, authenticated;
GRANT EXECUTE ON FUNCTION crm_noi_bao_gia_vao_deals() TO anon, authenticated;

-- Chạy nối báo giá lần đầu:
SELECT crm_noi_bao_gia_vao_deals() AS so_bao_gia_da_noi;
