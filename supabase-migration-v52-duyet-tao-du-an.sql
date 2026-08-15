-- ============================================================
-- MIGRATION v52: MACH 4 - dang ky DA DUYET -> tu tao du an CRM
-- Nguyen tac CEO: dang ky cua NPP chi vao danh muc theo doi CRM
-- SAU KHI duoc duyet (o CRM hoac tren Kanban ERP). Khong tu them
-- ban ghi chua duyet. Don hang demo/TEST khong dua vao.
-- Thay the ham crm_erp_dong_bo (giu mach 1-2-3). An toan chay lai.
-- ============================================================
begin;

create or replace function crm_erp_dong_bo()
returns table(viec text, so_luong int)
language plpgsql security definer as $f$
declare n_po int; n_dk int := 0; n_gh int; n_da int := 0; v_id uuid; r record;
        o_id crm_org.id%type; o_ten text; v_gt numeric;
begin
  -- MACH 1: don hang co YCSX khop ten du an CRM dang mo -> PO
  update crm_deals d set stage='po'
  from crm_orders o
  where o.ycsx_code is not null and btrim(o.ycsx_code) <> ''
    and upper(coalesce(o.project_name,'')) = upper(d.ten)
    and d.stage in ('tiep_can','spec_in','chao_gia','dam_phan');
  get diagnostics n_po = row_count;

  -- MACH 2a: kho BO chua duyet -> hang cho phe duyet CRM
  for r in select id, npp, du_an, cdt, ma_da, khu_vuc from crm_dang_ky_du_an
            where coalesce(btrim(duyet_dang_ky),'') in ('','cho_duyet') loop
    if not exists (select 1 from crm_approvals a where a.doi_tuong='erp_dang_ky'
                    and position('[ERP#'||r.id::text||']' in coalesce(a.noi_dung,''))>0) then
      insert into crm_approvals (doi_tuong, doi_tuong_id, loai, cap_duyet, nguoi_de_xuat, noi_dung, trang_thai)
      values ('erp_dang_ky', r.id, 'khac', 'ceo', coalesce(r.npp,'NPP'),
        '[ERP#'||r.id::text||'] '||coalesce(r.npp,'?')||' đăng ký: '||coalesce(r.du_an,'?')
          ||coalesce(' — CĐT '||nullif(r.cdt,''),''), 'cho_duyet');
      n_dk := n_dk + 1;
    end if;
  end loop;

  -- MACH 2b: kho Kanban cho_duyet -> hang cho phe duyet CRM
  for r in select id, npp_name_snapshot as npp, project_name as du_an, investor as cdt
             from crm_project_registrations where status='cho_duyet' loop
    if not exists (select 1 from crm_approvals a where a.doi_tuong='erp_dang_ky'
                    and position('[ERP#'||r.id::text||']' in coalesce(a.noi_dung,''))>0) then
      insert into crm_approvals (doi_tuong, doi_tuong_id, loai, cap_duyet, nguoi_de_xuat, noi_dung, trang_thai)
      values ('erp_dang_ky', r.id, 'khac', 'ceo', coalesce(r.npp,'NPP'),
        '[ERP#'||r.id::text||'] '||coalesce(r.npp,'?')||' đăng ký (Kanban): '||coalesce(r.du_an,'?')
          ||coalesce(' — CĐT '||nullif(r.cdt,''),''), 'cho_duyet');
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
  where w.delivered_at is not null and w.delivered_at >= '2026-07-01'::date
    and coalesce(w.total_value,0) > 0
    and coalesce(w.customer_name,'') not ilike '%TEST%'
  group by 1, 2, 3;
  get diagnostics n_gh = row_count;

  -- MACH 4: dang ky DA DUYET (Kanban hoac kho BO) ma CRM chua co du an -> tu tao
  for r in
    select project_name as du_an, npp_name_snapshot as npp, investor as cdt, estimated_value as gt
      from crm_project_registrations where status in ('da_duyet','trien_khai','thang_thau')
    union all
    select du_an, npp, cdt, null::numeric
      from crm_dang_ky_du_an where duyet_dang_ky='da_duyet'
  loop
    if r.du_an is null or char_length(btrim(r.du_an)) < 6 then continue; end if;
    if r.du_an ilike '%TEST%' or r.du_an ilike '%Ví Dụ%' or r.du_an ilike '%vi du%' then continue; end if;
    if exists (select 1 from crm_deals d
                where upper(d.ten) like '%'||upper(btrim(r.du_an))||'%'
                   or upper(btrim(r.du_an)) like '%'||upper(d.ten)||'%') then continue; end if;
    select id, ten into o_id, o_ten from crm_org
     where quoc_gia='VN' and pheu_npp='da_ky_hd'
       and (upper(coalesce(ma_code,''))=upper(coalesce(r.npp,'~')) or ten ilike '%'||coalesce(r.npp,'~~~')||'%')
     limit 1;
    v_gt := case when r.gt between 1000000 and 500000000000 then r.gt else null end;
    insert into crm_deals (ten, quoc_gia, stage, uu_tien, gia_tri_uoc, npp_dang_ky_id, npp_chi_dinh)
    values (btrim(r.du_an), 'VN', 'tiep_can', '3', v_gt, o_id, coalesce(o_ten, r.npp));
    n_da := n_da + 1;
  end loop;

  return query values ('ycsx_sang_po'::text, n_po), ('dang_ky_vao_hang_cho'::text, n_dk),
                      ('giao_hang_ghi_doanh_thu'::text, n_gh), ('duyet_tao_du_an'::text, n_da);
end $f$;
grant execute on function crm_erp_dong_bo() to authenticated;

commit;

-- NGHIEM THU: duyet_tao_du_an >= 1 (Tien Bo Plaza da duyet -> tao du an dau tien):
select * from crm_erp_dong_bo();
