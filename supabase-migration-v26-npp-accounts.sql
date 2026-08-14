-- ============================================================================
-- MIGRATION v26 — TÀI KHOẢN NPP: ACCOUNT CHA (LEAD) & ACCOUNT CON (STAFF)
-- Chạy SAU v22–v25. An toàn chạy lại nhiều lần.
-- Mô hình (PRD): NSCA admin tạo account cha cho mỗi NPP (npp_lead, gắn
-- npp_org_id). NPP Lead tự tạo tối đa 5 account con (npp_staff) trong NPP
-- của mình. Mật khẩu băm bcrypt — CÙNG công thức crypt/gen_salt('bf') với
-- crm_login / crm_doi_mat_khau hiện có, nên đăng nhập tương thích 100%.
-- Mọi RPC đều yêu cầu user_name + mật khẩu của NGƯỜI GỌI để xác thực.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===== Hàm nội bộ: xác thực người gọi (không cấp quyền ra ngoài) =====
CREATE OR REPLACE FUNCTION crm_xac_thuc_nb(p_user text, p_pass text)
RETURNS crm_user_roles LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE u crm_user_roles;
BEGIN
  SELECT * INTO u FROM crm_user_roles
   WHERE user_name = lower(trim(p_user))
     AND mat_khau_hash = crypt(p_pass, mat_khau_hash) LIMIT 1;
  RETURN u; -- NULL nếu sai
END $$;
REVOKE ALL ON FUNCTION crm_xac_thuc_nb(text,text) FROM PUBLIC, anon, authenticated;

-- ===== 1. TẠO TÀI KHOẢN NPP (cha hoặc con) =====
-- Admin NSCA: tạo được npp_lead & npp_staff cho bất kỳ NPP (p_npp_org_id bắt buộc).
-- NPP Lead: chỉ tạo được npp_staff trong NPP của chính mình, tối đa 5 người.
CREATE OR REPLACE FUNCTION crm_tao_tai_khoan_npp(
  p_user_goi text, p_pass_goi text,
  p_ho_ten text, p_user_name text, p_mat_khau_tam text,
  p_vai_tro text DEFAULT 'npp_staff',
  p_npp_org_id uuid DEFAULT NULL,
  p_chuc_danh text DEFAULT NULL, p_email text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE goi crm_user_roles; org_id uuid; org_qg text; so_staff int; un text;
BEGIN
  goi := crm_xac_thuc_nb(p_user_goi, p_pass_goi);
  IF goi.id IS NULL THEN RETURN '❌ Sai tài khoản hoặc mật khẩu người tạo'; END IF;
  IF p_vai_tro NOT IN ('npp_lead','npp_staff') THEN RETURN '❌ Vai trò phải là npp_lead hoặc npp_staff'; END IF;
  un := lower(trim(p_user_name));
  IF un = '' OR p_ho_ten IS NULL OR trim(p_ho_ten) = '' THEN RETURN '❌ Thiếu họ tên hoặc user name'; END IF;
  IF length(COALESCE(p_mat_khau_tam,'')) < 6 THEN RETURN '❌ Mật khẩu tạm tối thiểu 6 ký tự'; END IF;
  IF EXISTS (SELECT 1 FROM crm_user_roles WHERE user_name = un) THEN RETURN '❌ User name đã tồn tại: '||un; END IF;

  -- phân quyền người gọi
  IF goi.quyen_admin IN ('admin','super_admin') THEN
    org_id := p_npp_org_id;
    IF org_id IS NULL THEN RETURN '❌ Admin tạo tài khoản NPP phải chọn NPP (npp_org_id)'; END IF;
  ELSIF goi.vai_tro = 'npp_lead' THEN
    IF p_vai_tro <> 'npp_staff' THEN RETURN '❌ NPP Lead chỉ được tạo tài khoản nhân viên (npp_staff)'; END IF;
    org_id := goi.npp_org_id;
    IF org_id IS NULL THEN RETURN '❌ Tài khoản Lead của bạn chưa gắn NPP — liên hệ admin NSCA'; END IF;
    SELECT count(*) INTO so_staff FROM crm_user_roles
      WHERE npp_org_id = org_id AND vai_tro = 'npp_staff';
    IF so_staff >= 5 THEN RETURN '❌ NPP đã đủ 5 tài khoản nhân viên — liên hệ admin NSCA nếu cần thêm'; END IF;
  ELSE
    RETURN '❌ Bạn không có quyền tạo tài khoản NPP';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM crm_org WHERE id = org_id AND phan_loai = 'npp') THEN
    RETURN '❌ npp_org_id không phải một NPP trong danh bạ'; END IF;
  SELECT quoc_gia INTO org_qg FROM crm_org WHERE id = org_id;

  INSERT INTO crm_user_roles(ho_ten, chuc_danh, email, vai_tro, khu_vuc, bo_phan,
    user_name, mat_khau_hash, phai_doi_mk, quyen_admin, ngon_ngu, npp_org_id)
  VALUES (trim(p_ho_ten), COALESCE(p_chuc_danh, CASE WHEN p_vai_tro='npp_lead' THEN 'Trưởng nhóm NPP' ELSE 'Nhân viên NPP' END),
    p_email, p_vai_tro,
    CASE WHEN COALESCE(org_qg,'VN')='VN' THEN 'noi_dia' ELSE 'quoc_te' END,
    'npp', un, crypt(p_mat_khau_tam, gen_salt('bf')), true, NULL,
    CASE WHEN COALESCE(org_qg,'VN')='VN' THEN 'vi' ELSE 'en' END, org_id);
  RETURN '✓ Đã tạo '||CASE WHEN p_vai_tro='npp_lead' THEN 'ACCOUNT CHA (Lead)' ELSE 'account nhân viên' END
    ||' "'||un||'" cho NPP — mật khẩu tạm sẽ bắt đổi khi đăng nhập lần đầu';
END $$;

-- ===== 2. DANH SÁCH TÀI KHOẢN NPP trong phạm vi người gọi =====
CREATE OR REPLACE FUNCTION crm_ds_tai_khoan_npp(p_user_goi text, p_pass_goi text)
RETURNS TABLE(ho_ten text, user_name text, vai_tro text, chuc_danh text,
              npp_ten text, phai_doi_mk boolean, lan_dang_nhap_cuoi timestamptz)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE goi crm_user_roles;
BEGIN
  goi := crm_xac_thuc_nb(p_user_goi, p_pass_goi);
  IF goi.id IS NULL THEN RETURN; END IF;
  IF goi.quyen_admin IN ('admin','super_admin') OR goi.vai_tro IN ('ceo','manager') THEN
    RETURN QUERY SELECT u.ho_ten, u.user_name, u.vai_tro, u.chuc_danh, o.ten,
        u.phai_doi_mk, u.lan_dang_nhap_cuoi
      FROM crm_user_roles u LEFT JOIN crm_org o ON o.id = u.npp_org_id
      WHERE u.vai_tro IN ('npp_lead','npp_staff') ORDER BY o.ten, u.vai_tro DESC, u.ho_ten;
  ELSIF goi.vai_tro = 'npp_lead' THEN
    RETURN QUERY SELECT u.ho_ten, u.user_name, u.vai_tro, u.chuc_danh, o.ten,
        u.phai_doi_mk, u.lan_dang_nhap_cuoi
      FROM crm_user_roles u LEFT JOIN crm_org o ON o.id = u.npp_org_id
      WHERE u.npp_org_id = goi.npp_org_id AND u.vai_tro IN ('npp_lead','npp_staff')
      ORDER BY u.vai_tro DESC, u.ho_ten;
  END IF;
END $$;

-- ===== 3. KHÓA / CẤP LẠI MẬT KHẨU =====
-- Khóa = đặt mật khẩu ngẫu nhiên (không ai biết) → đăng nhập fail sạch.
-- Mở lại = cấp mật khẩu tạm mới. Admin: mọi tài khoản NPP; Lead: chỉ staff NPP mình.
CREATE OR REPLACE FUNCTION crm_cap_mk_npp(p_user_goi text, p_pass_goi text,
  p_user_dich text, p_mat_khau_moi text DEFAULT NULL) -- NULL = KHÓA
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE goi crm_user_roles; dich crm_user_roles;
BEGIN
  goi := crm_xac_thuc_nb(p_user_goi, p_pass_goi);
  IF goi.id IS NULL THEN RETURN '❌ Sai tài khoản hoặc mật khẩu người thao tác'; END IF;
  SELECT * INTO dich FROM crm_user_roles WHERE user_name = lower(trim(p_user_dich)) LIMIT 1;
  IF dich.id IS NULL THEN RETURN '❌ Không tìm thấy tài khoản: '||p_user_dich; END IF;
  IF dich.vai_tro NOT IN ('npp_lead','npp_staff') THEN RETURN '❌ RPC này chỉ quản lý tài khoản NPP'; END IF;
  IF NOT ( goi.quyen_admin IN ('admin','super_admin')
        OR (goi.vai_tro = 'npp_lead' AND dich.vai_tro = 'npp_staff'
            AND dich.npp_org_id = goi.npp_org_id) ) THEN
    RETURN '❌ Bạn không có quyền thao tác tài khoản này'; END IF;
  IF p_mat_khau_moi IS NULL THEN
    UPDATE crm_user_roles SET mat_khau_hash = crypt(gen_random_uuid()::text, gen_salt('bf')),
      phai_doi_mk = true WHERE id = dich.id;
    RETURN '🔒 Đã khóa tài khoản '||dich.user_name||' (cấp lại mật khẩu để mở)';
  ELSE
    IF length(p_mat_khau_moi) < 6 THEN RETURN '❌ Mật khẩu tạm tối thiểu 6 ký tự'; END IF;
    UPDATE crm_user_roles SET mat_khau_hash = crypt(p_mat_khau_moi, gen_salt('bf')),
      phai_doi_mk = true WHERE id = dich.id;
    RETURN '🔑 Đã cấp mật khẩu tạm cho '||dich.user_name||' — bắt đổi khi đăng nhập';
  END IF;
END $$;

-- ===== 4. QUYỀN GỌI =====
GRANT EXECUTE ON FUNCTION crm_tao_tai_khoan_npp(text,text,text,text,text,text,uuid,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION crm_ds_tai_khoan_npp(text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION crm_cap_mk_npp(text,text,text,text) TO anon, authenticated;

SELECT 'v26 OK — RPC tài khoản NPP đã sẵn sàng' AS ket_qua;
