-- ============================================================
-- MIGRATION v50: sua 3 loi phat hien khi test V41
-- A) crm_cong_no: them policy doc cho nguoi da dang nhap
--    (bang bi RLS chan nen card Cong no trong du DB co 7 dong)
-- B) View ERP: khop ten kieu CHUA NHAU (47 Pham Van Dong nam trong
--    TRU SO BO CONG AN 47 PHAM VAN DONG) thay vi bang tuyet doi
-- An toan chay lai.
-- ============================================================
begin;

alter table crm_cong_no enable row level security;
drop policy if exists crm_cong_no_doc on crm_cong_no;
create policy crm_cong_no_doc on crm_cong_no for select to authenticated using (true);

create or replace view v_crm_erp_dang_ky as
select r.id, r.npp, r.du_an, r.cdt, r.ma_da, r.khu_vuc, r.duyet_dang_ky,
       r.tinh_hinh, r.gia_tri_nganh, r.tong_cong, r.created_at,
       exists (select 1 from crm_deals d
                where char_length(coalesce(r.du_an,'')) >= 6
                  and (upper(d.ten) like '%'||upper(r.du_an)||'%'
                    or upper(r.du_an) like '%'||upper(d.ten)||'%')) as da_co_trong_crm
from crm_dang_ky_du_an r;

create or replace view v_crm_erp_don_hang as
select o.id, o.order_no, o.ycsx_code, o.customer_name, o.npp_name,
       o.project_name, o.project_code, o.total_value, o.pre_vat_value,
       o.status, o.delivery_date, o.created_at,
       exists (select 1 from crm_deals d
                where char_length(coalesce(o.project_name,'')) >= 6
                  and (upper(d.ten) like '%'||upper(o.project_name)||'%'
                    or upper(o.project_name) like '%'||upper(d.ten)||'%')) as da_co_trong_crm
from crm_orders o;

grant select on v_crm_erp_dang_ky, v_crm_erp_don_hang to authenticated;

commit;

-- NGHIEM THU:
-- 1) Cong no doc duoc boi app (7 dong):
select count(*) from crm_cong_no;
-- 2) 47 Pham Van Dong / Hyatt Sapa phai da_co_trong_crm = true:
select du_an, da_co_trong_crm from v_crm_erp_dang_ky
 where du_an ilike '%Phạm Văn Đồng%' or du_an ilike '%Hyatt Sapa%';
