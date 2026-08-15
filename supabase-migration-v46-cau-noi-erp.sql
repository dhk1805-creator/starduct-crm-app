-- ============================================================
-- MIGRATION v46: CAU NOI CRM <- ERP (chung database, CHI DOC)
-- ERP (erp-nsca.pages.dev) la noi NPP dang ky du an, dat hang,
-- giao hang. CRM doc qua 3 view duoi day - khong ghi gi vao ERP.
-- View thuoc so huu postgres nen doc duoc du RLS cua bang goc;
-- chi cap quyen cho nguoi da dang nhap (authenticated).
-- An toan chay lai.
-- ============================================================
begin;

create or replace view v_crm_erp_dang_ky as
select r.id, r.npp, r.du_an, r.cdt, r.ma_da, r.khu_vuc, r.duyet_dang_ky,
       r.tinh_hinh, r.gia_tri_nganh, r.tong_cong, r.created_at,
       exists (select 1 from crm_deals d where upper(d.ten)=upper(r.du_an)) as da_co_trong_crm
from crm_dang_ky_du_an r;

create or replace view v_crm_erp_don_hang as
select o.id, o.order_no, o.ycsx_code, o.customer_name, o.npp_name,
       o.project_name, o.project_code, o.total_value, o.pre_vat_value,
       o.status, o.delivery_date, o.created_at,
       exists (select 1 from crm_deals d where upper(d.ten)=upper(coalesce(o.project_name,''))) as da_co_trong_crm
from crm_orders o;

create or replace view v_crm_erp_giao_hang as
select * from wms_delivery_orders;

create or replace view v_crm_erp_dang_ky_moi as
select r.id, r.npp_name_snapshot as npp, r.project_name as du_an, r.investor as cdt,
       r.estimated_value, r.status, r.protected_until, r.created_at
from crm_project_registrations r;

grant select on v_crm_erp_dang_ky, v_crm_erp_don_hang, v_crm_erp_giao_hang, v_crm_erp_dang_ky_moi to authenticated;

commit;

-- NGHIEM THU: 4 cau phai chay ra so dong (26 / 5 / 4 / 2):
select count(*) from v_crm_erp_dang_ky;
select count(*) from v_crm_erp_don_hang;
select count(*) from v_crm_erp_giao_hang;
select count(*) from v_crm_erp_dang_ky_moi;
