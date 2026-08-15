-- ============================================================
-- MIGRATION v49: hang cho CRM phu CA HAI kho dang ky cua ERP
-- Kho 1: crm_dang_ky_du_an (26 ban ghi that tu BO) - da noi o v48
-- Kho 2: crm_project_registrations (module Kanban crm-npp-projects,
--   enum cho_duyet/da_duyet) - noi them o day.
-- Duyet tai CRM -> ghi nguoc dung chuan tung kho.
-- Thay the 2 ham cua v48. An toan chay lai.
-- ============================================================
begin;

create or replace function crm_erp_dong_bo()
returns table(viec text, so_luong int)
language plpgsql security definer as $f$
declare n_po int; n_dk int := 0; n_gh int; v_id uuid; r record;
begin
  -- MACH 1: don hang co YCSX khop ten du an CRM dang mo -> PO
  update crm_deals d set stage='po'
  from crm_orders o
  where o.ycsx_code is not null and btrim(o.ycsx_code) <> ''
    and upper(coalesce(o.project_name,'')) = upper(d.ten)
    and d.stage in ('tiep_can','spec_in','chao_gia','dam_phan');
  get diagnostics n_po = row_count;

  -- MACH 2a: kho 1 - crm_dang_ky_du_an (BO)
  for r in select id, npp, du_an, cdt, ma_da, khu_vuc from crm_dang_ky_du_an
            where coalesce(btrim(duyet_dang_ky),'') in ('','cho_duyet') loop
    if not exists (select 1 from crm_approvals a where a.doi_tuong='erp_dang_ky'
                    and position('[ERP#'||r.id::text||']' in coalesce(a.noi_dung,''))>0) then
      insert into crm_approvals (doi_tuong, doi_tuong_id, loai, cap_duyet, nguoi_de_xuat, noi_dung, trang_thai)
      values ('erp_dang_ky', r.id, 'khac', 'ceo', coalesce(r.npp,'NPP'),
        '[ERP#'||r.id::text||'] '||coalesce(r.npp,'?')||' đăng ký: '||coalesce(r.du_an,'?')
          ||coalesce(' — CĐT '||nullif(r.cdt,''),'')||coalesce(' — mã '||nullif(r.ma_da,''),'')
          ||coalesce(' — '||nullif(r.khu_vuc,''),''), 'cho_duyet');
      n_dk := n_dk + 1;
    end if;
  end loop;

  -- MACH 2b: kho 2 - crm_project_registrations (module Kanban)
  for r in select id, npp_name_snapshot as npp, project_name as du_an, investor as cdt, estimated_value
             from crm_project_registrations where status='cho_duyet' loop
    if not exists (select 1 from crm_approvals a where a.doi_tuong='erp_dang_ky'
                    and position('[ERP#'||r.id::text||']' in coalesce(a.noi_dung,''))>0) then
      insert into crm_approvals (doi_tuong, doi_tuong_id, loai, cap_duyet, nguoi_de_xuat, noi_dung, trang_thai)
      values ('erp_dang_ky', r.id, 'khac', 'ceo', coalesce(r.npp,'NPP'),
        '[ERP#'||r.id::text||'] '||coalesce(r.npp,'?')||' đăng ký (Kanban): '||coalesce(r.du_an,'?')
          ||coalesce(' — CĐT '||nullif(r.cdt,''),'')
          ||coalesce(' — ước '||nullif(round(coalesce(r.estimated_value,0)/1e9,2)::text,'0')||' tỷ',''), 'cho_duyet');
      n_dk := n_dk + 1;
    end if;
  end loop;

  -- MACH 3: giao hang da giao tu 01/07/2026 -> doanh thu (xoa-ghi lai, idempotent)
  delete from crm_revenue where created_by='erp-giao-hang';
  insert into crm_revenue (thang, org_id, quoc_gia, ma_nganh, kenh, so_tien, created_by)
  select date_trunc('month', w.delivered_at)::date,
         o2.id, coalesce(nullif(o2.quoc_gia,''),'VN'), 'ERP_GH', 'npp',
         sum(coalesce(w.total_value,0)), 'erp-giao-hang'
  from wms_delivery_orders w
  left join crm_orders co on co.order_no = w.order_no
  join crm_org o2 on upper(o2.ten) = upper(coalesce(nullif(co.npp_name,''), w.customer_name))
                  or upper(coalesce(o2.ma_code,'')) = upper(coalesce(nullif(co.npp_name,''), w.customer_name))
  where w.delivered_at is not null
    and w.delivered_at >= '2026-07-01'::date
    and coalesce(w.total_value,0) > 0
  group by 1, 2, 3;
  get diagnostics n_gh = row_count;

  return query values ('ycsx_sang_po'::text, n_po), ('dang_ky_vao_hang_cho'::text, n_dk), ('giao_hang_ghi_doanh_thu'::text, n_gh);
end $f$;
grant execute on function crm_erp_dong_bo() to authenticated;

create or replace function crm_erp_duyet_dang_ky(p_marker text, p_tt text)
returns int language plpgsql security definer as $f$
declare n1 int; n2 int;
begin
  update crm_dang_ky_du_an
     set duyet_dang_ky = case when p_tt='da_duyet' then 'da_duyet' else 'tu_choi' end
   where id::text = p_marker;
  get diagnostics n1 = row_count;
  update crm_project_registrations
     set status = case when p_tt='da_duyet' then 'da_duyet' else 'tu_choi' end,
         reviewed_by = 'CRM Starduct', reviewed_at = now(), stage_updated_at = now()
   where id::text = p_marker and status='cho_duyet';
  get diagnostics n2 = row_count;
  return n1 + n2;
end $f$;
grant execute on function crm_erp_duyet_dang_ky(text,text) to authenticated;

commit;

-- NGHIEM THU: dang_ky_vao_hang_cho = 1 (them ban ghi Kanban cho_duyet; 26 ban cu da vao tu v48)
select * from crm_erp_dong_bo();
