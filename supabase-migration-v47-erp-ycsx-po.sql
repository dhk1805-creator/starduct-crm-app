-- ============================================================
-- MIGRATION v47: BUOC 2 - MACH 1: YCSX tren ERP -> du an CRM tu sang PO
-- Ham dong bo idempotent, CRM goi moi lan mo dashboard (rpc).
-- Chi GHI vao crm_deals (phia CRM) - KHONG dung den bang ERP.
-- Khop don hang ERP voi du an CRM theo ten (project_name = ten deal).
-- ============================================================
begin;

create or replace function crm_erp_dong_bo()
returns table(viec text, so_luong int)
language plpgsql security definer as $f$
declare n_po int;
begin
  -- Don hang ERP co ma YCSX + khop ten du an CRM dang mo -> chuyen PO
  update crm_deals d set stage='po'
  from crm_orders o
  where o.ycsx_code is not null and btrim(o.ycsx_code) <> ''
    and upper(coalesce(o.project_name,'')) = upper(d.ten)
    and d.stage in ('tiep_can','spec_in','chao_gia','dam_phan');
  get diagnostics n_po = row_count;
  return query select 'ycsx_sang_po'::text, n_po;
end $f$;

grant execute on function crm_erp_dong_bo() to authenticated;

commit;

-- NGHIEM THU: chay thu ham (lan 2 tro di so_luong = 0 vi da dong bo):
select * from crm_erp_dong_bo();
