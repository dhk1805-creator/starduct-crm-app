-- ============================================================================
-- MIGRATION v27 — ĐĂNG NHẬP HỢP NHẤT: MỘT TÀI KHOẢN EMAIL DUY NHẤT CHO MỌI USER
-- Chạy SAU v22–v26. An toàn chạy lại nhiều lần.
--
-- Mô hình mới: mỗi người (NSCA + NPP) có MỘT tài khoản Supabase Auth
-- (email + mật khẩu). Đăng nhập một lần duy nhất; quyền hạn tra theo email
-- trong crm_user_roles. Lần đầu đăng nhập bằng mật khẩu tạm → app bắt tự đổi.
-- Người gọi RPC được xác minh bằng auth.email() — KHÔNG cần nhập lại mật khẩu.
--
-- ⚠ VIỆC CẦN LÀM TAY TRONG DASHBOARD (một lần):
--   Authentication → Sign In / Providers → Email: bật; TẮT "Confirm email"
--   (để tài khoản cấp bằng mật khẩu tạm dùng được ngay, không chờ xác nhận).
-- ============================================================================

-- ===== 0. CỘT BỔ SUNG =====
ALTER TABLE crm_user_roles ADD COLUMN IF NOT EXISTS khoa boolean DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ur_email ON crm_user_roles(lower(email)) WHERE email IS NOT NULL;

-- ===== Hàm nội bộ: hồ sơ người gọi theo phiên đăng nhập =====
CREATE OR REPLACE FUNCTION crm_toi_nb() RETURNS crm_user_roles
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT u.* FROM crm_user_roles u
  WHERE lower(u.email) = lower(COALESCE(auth.email(),'')) LIMIT 1
$$;
REVOKE ALL ON FUNCTION crm_toi_nb() FROM PUBLIC, anon;

-- ===== 1. HỒ SƠ CỦA TÔI (app gọi sau đăng nhập) =====
CREATE OR REPLACE FUNCTION crm_ho_so_cua_toi()
RETURNS TABLE(ho_ten text, chuc_danh text, vai_tro text, khu_vuc text, bo_phan text,
              quyen_admin text, ngon_ngu text, npp_org_id uuid, user_name text,
              phai_doi_mk boolean, khoa boolean)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT u.ho_ten, u.chuc_danh, u.vai_tro, u.khu_vuc, u.bo_phan, u.quyen_admin,
         u.ngon_ngu, u.npp_org_id, u.user_name, u.phai_doi_mk, u.khoa
  FROM crm_user_roles u WHERE lower(u.email) = lower(COALESCE(auth.email(),''))
$$;

-- ===== 2. XÁC NHẬN ĐÃ ĐỔI MẬT KHẨU LẦN ĐẦU =====
CREATE OR REPLACE FUNCTION crm_doi_mk_xong() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE crm_user_roles SET phai_doi_mk = false
  WHERE lower(email) = lower(COALESCE(auth.email(),''));
  RETURN FOUND;
END $$;

-- ===== 3. DANH SÁCH HỒ SƠ theo phạm vi người gọi =====
CREATE OR REPLACE FUNCTION crm_ds_ho_so()
RETURNS TABLE(email text, ho_ten text, vai_tro text, chuc_danh text, npp_ten text,
              phai_doi_mk boolean, khoa boolean, lan_dang_nhap_cuoi timestamptz)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE toi crm_user_roles;
BEGIN
  toi := crm_toi_nb();
  IF toi.id IS NULL OR COALESCE(toi.khoa,false) THEN RETURN; END IF;
  IF toi.quyen_admin IN ('admin','super_admin') OR toi.vai_tro IN ('ceo','manager') THEN
    RETURN QUERY SELECT u.email, u.ho_ten, u.vai_tro, u.chuc_danh, o.ten,
        u.phai_doi_mk, u.khoa, u.lan_dang_nhap_cuoi
      FROM crm_user_roles u LEFT JOIN crm_org o ON o.id = u.npp_org_id
      ORDER BY (u.vai_tro IN ('npp_lead','npp_staff')), o.ten, u.ho_ten;
  ELSIF toi.vai_tro = 'npp_lead' THEN
    RETURN QUERY SELECT u.email, u.ho_ten, u.vai_tro, u.chuc_danh, o.ten,
        u.phai_doi_mk, u.khoa, u.lan_dang_nhap_cuoi
      FROM crm_user_roles u LEFT JOIN crm_org o ON o.id = u.npp_org_id
      WHERE u.npp_org_id = toi.npp_org_id ORDER BY u.vai_tro DESC, u.ho_ten;
  END IF;
END $$;

-- ===== 4. TẠO HỒ SƠ NGƯỜI DÙNG MỚI (phần quyền hạn — app tạo Auth user riêng) =====
CREATE OR REPLACE FUNCTION crm_tao_ho_so(p_email text, p_ho_ten text,
  p_vai_tro text, p_chuc_danh text DEFAULT NULL, p_npp_org_id uuid DEFAULT NULL,
  p_khu_vuc text DEFAULT 'noi_dia')
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE toi crm_user_roles; em text; org_qg text; so_staff int; un text; n int := 0;
BEGIN
  toi := crm_toi_nb();
  IF toi.id IS NULL OR COALESCE(toi.khoa,false) THEN RETURN '❌ Phiên đăng nhập không hợp lệ'; END IF;
  em := lower(trim(p_email));
  IF em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RETURN '❌ Email không hợp lệ: '||em; END IF;
  IF EXISTS (SELECT 1 FROM crm_user_roles WHERE lower(email) = em) THEN
    RETURN '❌ Email đã có hồ sơ: '||em; END IF;
  IF p_ho_ten IS NULL OR trim(p_ho_ten) = '' THEN RETURN '❌ Thiếu họ tên'; END IF;

  -- phân quyền người tạo
  IF toi.quyen_admin IN ('admin','super_admin') OR toi.vai_tro IN ('ceo','manager') THEN
    IF p_vai_tro NOT IN ('staff','manager','npp_lead','npp_staff') THEN
      RETURN '❌ Vai trò phải là staff / manager / npp_lead / npp_staff'; END IF;
    IF p_vai_tro IN ('npp_lead','npp_staff') AND p_npp_org_id IS NULL THEN
      RETURN '❌ Tài khoản NPP phải chọn NPP'; END IF;
  ELSIF toi.vai_tro = 'npp_lead' THEN
    IF p_vai_tro <> 'npp_staff' THEN RETURN '❌ NPP Lead chỉ tạo được tài khoản nhân viên NPP'; END IF;
    p_npp_org_id := toi.npp_org_id;
    IF p_npp_org_id IS NULL THEN RETURN '❌ Tài khoản Lead chưa gắn NPP — liên hệ admin'; END IF;
    SELECT count(*) INTO so_staff FROM crm_user_roles
      WHERE npp_org_id = p_npp_org_id AND vai_tro = 'npp_staff' AND NOT COALESCE(khoa,false);
    IF so_staff >= 5 THEN RETURN '❌ NPP đã đủ 5 tài khoản nhân viên'; END IF;
  ELSE
    RETURN '❌ Bạn không có quyền tạo tài khoản';
  END IF;

  IF p_npp_org_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM crm_org WHERE id = p_npp_org_id AND phan_loai='npp') THEN
      RETURN '❌ npp_org_id không phải NPP trong danh bạ'; END IF;
    SELECT quoc_gia INTO org_qg FROM crm_org WHERE id = p_npp_org_id;
    p_khu_vuc := CASE WHEN COALESCE(org_qg,'VN')='VN' THEN 'noi_dia' ELSE 'quoc_te' END;
  END IF;

  -- user_name kế thừa từ email (đảm bảo duy nhất, giữ tương thích đăng nhập nội bộ cũ)
  un := lower(split_part(em,'@',1));
  WHILE EXISTS (SELECT 1 FROM crm_user_roles WHERE user_name = un) LOOP
    n := n + 1; un := lower(split_part(em,'@',1)) || n::text;
  END LOOP;

  INSERT INTO crm_user_roles(ho_ten, chuc_danh, email, vai_tro, khu_vuc, bo_phan,
    user_name, phai_doi_mk, ngon_ngu, npp_org_id, khoa)
  VALUES (trim(p_ho_ten),
    COALESCE(p_chuc_danh, CASE p_vai_tro WHEN 'npp_lead' THEN 'Trưởng nhóm NPP'
                                         WHEN 'npp_staff' THEN 'Nhân viên NPP' ELSE NULL END),
    em, p_vai_tro, p_khu_vuc,
    CASE WHEN p_vai_tro IN ('npp_lead','npp_staff') THEN 'npp' ELSE NULL END,
    un, true, CASE WHEN p_khu_vuc='quoc_te' THEN 'en' ELSE 'vi' END, p_npp_org_id, false);
  RETURN '✓ Đã tạo hồ sơ '||em||' ('||p_vai_tro||') — app sẽ cấp đăng nhập email kèm mật khẩu tạm';
END $$;

-- ===== 5. KHÓA / MỞ HỒ SƠ =====
CREATE OR REPLACE FUNCTION crm_khoa_ho_so(p_email text, p_khoa boolean)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE toi crm_user_roles; dich crm_user_roles;
BEGIN
  toi := crm_toi_nb();
  IF toi.id IS NULL THEN RETURN '❌ Phiên đăng nhập không hợp lệ'; END IF;
  SELECT * INTO dich FROM crm_user_roles WHERE lower(email)=lower(trim(p_email)) LIMIT 1;
  IF dich.id IS NULL THEN RETURN '❌ Không tìm thấy hồ sơ: '||p_email; END IF;
  IF dich.id = toi.id THEN RETURN '❌ Không tự khóa chính mình'; END IF;
  IF NOT ( toi.quyen_admin IN ('admin','super_admin') OR toi.vai_tro IN ('ceo','manager')
        OR (toi.vai_tro='npp_lead' AND dich.vai_tro='npp_staff' AND dich.npp_org_id = toi.npp_org_id) ) THEN
    RETURN '❌ Bạn không có quyền'; END IF;
  UPDATE crm_user_roles SET khoa = p_khoa WHERE id = dich.id;
  RETURN CASE WHEN p_khoa THEN '🔒 Đã khóa ' ELSE '🔓 Đã mở ' END || dich.email ||
    CASE WHEN p_khoa THEN ' (app sẽ từ chối phiên đăng nhập của hồ sơ này)' ELSE '' END;
END $$;

-- ===== 6. QUYỀN GỌI: chỉ người ĐÃ đăng nhập (authenticated), KHÔNG cấp anon =====
GRANT EXECUTE ON FUNCTION crm_ho_so_cua_toi() TO authenticated;
GRANT EXECUTE ON FUNCTION crm_doi_mk_xong() TO authenticated;
GRANT EXECUTE ON FUNCTION crm_ds_ho_so() TO authenticated;
GRANT EXECUTE ON FUNCTION crm_tao_ho_so(text,text,text,text,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION crm_khoa_ho_so(text,boolean) TO authenticated;
REVOKE EXECUTE ON FUNCTION crm_ho_so_cua_toi() FROM anon;
REVOKE EXECUTE ON FUNCTION crm_doi_mk_xong() FROM anon;
REVOKE EXECUTE ON FUNCTION crm_ds_ho_so() FROM anon;
REVOKE EXECUTE ON FUNCTION crm_tao_ho_so(text,text,text,text,uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION crm_khoa_ho_so(text,boolean) FROM anon;

SELECT 'v27 OK — RPC đăng nhập hợp nhất sẵn sàng. Nhớ TẮT "Confirm email" trong Authentication → Providers.' AS ket_qua;
