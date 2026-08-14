-- ============================================================================
-- FIX v26.2 — MỞ RỘNG RÀNG BUỘC CHECK TRÊN crm_user_roles CHO TÀI KHOẢN NPP
-- Lỗi gặp: "violates check constraint crm_user_roles_bo_phan_check" khi tạo
-- account NPP (bo_phan='npp', vai_tro='npp_lead'/'npp_staff').
-- Cách vá: với từng ràng buộc CHECK đang có trên bo_phan / vai_tro / khu_vuc,
-- dựng lại danh sách cho phép = (mọi giá trị ĐANG DÙNG trong bảng)
-- ∪ (giá trị cũ vẫn hợp lệ) ∪ (giá trị NPP mới). An toàn chạy lại nhiều lần.
-- ============================================================================

DO $$
DECLARE c record; col text; vals text[];
BEGIN
  FOR c IN SELECT conname, pg_get_constraintdef(oid) AS def
           FROM pg_constraint
           WHERE conrelid = 'crm_user_roles'::regclass AND contype = 'c' LOOP
    IF    c.def ILIKE '%bo_phan%' THEN col := 'bo_phan';
    ELSIF c.def ILIKE '%vai_tro%' THEN col := 'vai_tro';
    ELSIF c.def ILIKE '%khu_vuc%' THEN col := 'khu_vuc';
    ELSE CONTINUE;
    END IF;

    -- giá trị đang dùng thực tế trong bảng
    EXECUTE format('SELECT COALESCE(array_agg(DISTINCT %I), ''{}'') FROM crm_user_roles WHERE %I IS NOT NULL', col, col)
      INTO vals;

    -- cộng thêm giá trị chuẩn + giá trị NPP mới (không trùng lặp)
    IF col = 'bo_phan' THEN
      vals := (SELECT array_agg(DISTINCT v) FROM unnest(vals ||
        ARRAY['rd','qlsx','bo','tckt','kcs','khac','pkd','npp']) v);
    ELSIF col = 'vai_tro' THEN
      vals := (SELECT array_agg(DISTINCT v) FROM unnest(vals ||
        ARRAY['ceo','manager','staff','npp_lead','npp_staff']) v);
    ELSIF col = 'khu_vuc' THEN
      vals := (SELECT array_agg(DISTINCT v) FROM unnest(vals ||
        ARRAY['noi_dia','quoc_te']) v);
    END IF;

    EXECUTE format('ALTER TABLE crm_user_roles DROP CONSTRAINT %I', c.conname);
    EXECUTE format('ALTER TABLE crm_user_roles ADD CONSTRAINT %I CHECK (%I IS NULL OR %I = ANY (%L::text[]))',
      c.conname, col, col, vals);
    RAISE NOTICE 'Đã mở rộng %: %', c.conname, vals;
  END LOOP;
END $$;

-- Xem lại các ràng buộc sau khi vá:
SELECT conname, pg_get_constraintdef(oid) AS dinh_nghia
FROM pg_constraint
WHERE conrelid = 'crm_user_roles'::regclass AND contype = 'c'
ORDER BY conname;
