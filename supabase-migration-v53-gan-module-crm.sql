-- ============================================================
-- MIGRATION v53: GAN CRM STARDUCT LAM MODULE CUA NSCA PLATFORM
-- Dang ky vao erp_modules (schema: id, display_name, icon, route,
-- phase, is_active, sort_order, is_public). Route dung URL day du -
-- CRM chay tren GitHub Pages, chung Supabase nen dang nhap chung.
-- is_public=true: ai vao ERP cung thay nut, con quyen xem du lieu
-- do chinh CRM kiem soat (3 tang quyen).
-- Go bo khi can: update erp_modules set is_active=false where id='crm_starduct';
-- An toan chay lai (upsert).
-- ============================================================
begin;

insert into erp_modules (id, display_name, icon, route, phase, is_active, sort_order, is_public)
values ('crm_starduct', 'CRM Starduct', '🌏',
        'https://dhk1805-creator.github.io/starduct-crm-app/', 1, true, 99, true)
on conflict (id) do update
  set display_name=excluded.display_name, icon=excluded.icon, route=excluded.route,
      is_active=true, is_public=true, sort_order=excluded.sort_order;

commit;

-- NGHIEM THU: phai thay dong crm_starduct trong danh sach module:
select id, display_name, icon, route, is_active, is_public from erp_modules order by sort_order;
