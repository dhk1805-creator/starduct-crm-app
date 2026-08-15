-- ============================================================
-- MIGRATION v48: BUOC 2 - MACH 2 + MACH 3 cua cau noi ERP
-- Mach 2: Dang ky chi dinh tren ERP (duyet_dang_ky trong/cho_duyet)
--   -> do vao hang cho phe duyet CRM (crm_approvals, marker [ERP#id]).
--   Duyet/Tu choi tai CRM -> ghi nguoc duyet_dang_ky ve ERP
--   (theo dung chuan enum ERP: da_duyet / tu_choi).
-- Mach 3: Giao hang da GIAO (delivered_at) tu 01/07/2026 tro di
--   -> tu ghi doanh thu (crm_revenue, ma_nganh='ERP_GH' de khong
--   dung hang voi so bao cao H1; xoa-ghi lai moi lan = idempotent).
--   Moc 01/07 vi doanh thu den 30/06 da vao tu bao cao H1.
-- Thay the ham crm_erp_dong_bo cua v47 (giu mach 1 YCSX->PO).
-- ============================================================
begin;

-- Noi check constraint doi_tuong de nhan them 'erp_dang_ky'
-- (NOT VALID: chi ap cho dong moi, khong dong cham dong cu)
alter table crm_approvals drop constraint if exists crm_approvals_doi_tuong_check;
alter table crm_approvals add constraint crm_approvals_doi_tuong_check
  check (doi_tuong in ('deal','org','plan','support','erp_dang_ky')) not valid;

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

  -- MACH 2: dang ky ERP chua duyet -> hang cho phe duyet CRM
  for r in select * from crm_dang_ky_du_an
            where coalesce(btrim(duyet_dang_ky),'') in ('','cho_duyet') loop
    if not exists (select 1 from crm_approvals a
                    where a.doi_tuong='erp_dang_ky'
                      and position('[ERP#'||r.id::text||']' in coalesce(a.noi_dung,''))>0) then
      v_id := r.id; -- id dang ky ERP da la uuid
      insert into crm_approvals (doi_tuong, doi_tuong_id, loai, cap_duyet, nguoi_de_xuat, noi_dung, trang_thai)
      values ('erp_dang_ky', v_id, 'khac', 'ceo', coalesce(r.npp,'NPP'),
        '[ERP#'||r.id::text||'] '||coalesce(r.npp,'?')||' đăng ký: '||coalesce(r.du_an,'?')
          ||coalesce(' — CĐT '||nullif(r.cdt,''),'')||coalesce(' — mã '||nullif(r.ma_da,''),'')
          ||coalesce(' — '||nullif(r.khu_vuc,''),''),
        'cho_duyet');
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

-- Ghi nguoc quyet dinh duyet tu CRM ve ERP (dung chuan enum cua ERP)
create or replace function crm_erp_duyet_dang_ky(p_marker text, p_tt text)
returns int language plpgsql security definer as $f$
declare n int;
begin
  update crm_dang_ky_du_an
     set duyet_dang_ky = case when p_tt='da_duyet' then 'da_duyet' else 'tu_choi' end
   where id::text = p_marker;
  get diagnostics n = row_count;
  return n;
end $f$;

grant execute on function crm_erp_duyet_dang_ky(text,text) to authenticated;

commit;

-- NGHIEM THU: chay ham - lan dau phai ra dang_ky_vao_hang_cho = 26:
select * from crm_erp_dong_bo();
