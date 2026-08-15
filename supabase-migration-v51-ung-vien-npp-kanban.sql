-- ============================================================
-- MIGRATION v51: 2 quyet dinh CEO 15/08
-- A) CAREZONE = ung vien dang xin bao gia -> pheu 'dang_dam_phan'
--    BKG (Bach Khoa Group) = ha pheu ve tiem nang -> 'dang_ket_noi'
--    (ca hai khong con 'da_ky_hd' -> khoi danh sach NPP chinh thuc)
-- B) Chuyen 26 dang ky that cua BO vao module Kanban ERP
--    (crm_project_registrations) voi status='can_bo_sung'
--    = CHO BO XAC NHAN (dung nac 15% cua Kanban). BO xac nhan xong
--    keo sang 'cho_duyet' -> tu do vao hang cho phe duyet CRM (mach 2b).
--    Ban ghi CEO DA DUYET truoc do -> chuyen thang 'da_duyet'.
--    Nguon BO danh dau duyet_dang_ky='chuyen_kanban' (thoi vao hang cho);
--    cac de xuat may sinh con treo cho cac ban ghi nay -> xoa (se tai
--    sinh tu Kanban khi BO xac nhan). An toan chay lai.
-- ============================================================
begin;

-- A) hai ung vien NPP
update crm_org set pheu_npp='dang_dam_phan', quan_he='npp_moi'
 where quoc_gia='VN' and ten ilike '%CAREZONE%';
update crm_org set pheu_npp='dang_ket_noi', quan_he='npp_moi'
 where quoc_gia='VN' and (ten ilike '%Bách Khoa%' or ten ilike '%BKG%');

-- B) chuyen kho dang ky BO -> Kanban
create or replace function _v51() returns text as $f$
declare r record; n int := 0; v_npp_id crm_npp.id%type; v_gt numeric; v_st text;
begin
  for r in select * from crm_dang_ky_du_an
            where coalesce(duyet_dang_ky,'') in ('','cho_duyet','da_duyet','tu_choi') loop
    -- da co trong Kanban (theo NPP + ten du an) thi bo qua
    if exists (select 1 from crm_project_registrations p
                where upper(coalesce(p.npp_name_snapshot,''))=upper(coalesce(r.npp,''))
                  and upper(coalesce(p.project_name,''))=upper(coalesce(r.du_an,''))) then
      update crm_dang_ky_du_an set duyet_dang_ky='chuyen_kanban' where id=r.id and coalesce(duyet_dang_ky,'') in ('','cho_duyet');
      continue;
    end if;
    select id into v_npp_id from crm_npp where name ilike '%'||coalesce(r.npp,'~~~')||'%' limit 1;
    v_gt := null;
    if r.gia_tri_nganh ~ '^[0-9., ]+$' and length(regexp_replace(r.gia_tri_nganh,'[^0-9]','','g')) >= 6 then
      v_gt := regexp_replace(r.gia_tri_nganh,'[^0-9]','','g')::numeric;
    elsif r.tong_cong ~ '^[0-9., ]+$' and length(regexp_replace(r.tong_cong,'[^0-9]','','g')) >= 6 then
      v_gt := regexp_replace(r.tong_cong,'[^0-9]','','g')::numeric;
    end if;
    v_st := case when r.duyet_dang_ky='da_duyet' then 'da_duyet'
                 when r.duyet_dang_ky='tu_choi' then 'tu_choi'
                 else 'can_bo_sung' end;
    insert into crm_project_registrations
      (npp_id, npp_name_snapshot, project_name, investor, design_unit, mep_contractor,
       estimated_value, status, source, submitted_by, created_at)
    values (v_npp_id, coalesce(r.npp,'NPP'), coalesce(r.du_an,'(chưa rõ tên)'), nullif(r.cdt,''),
       nullif(r.tvtk,''), nullif(r.nha_thau,''), v_gt, v_st,
       'chuyen-tu-BO-15/08/2026', 'BO', coalesce(r.created_at, now()));
    update crm_dang_ky_du_an set duyet_dang_ky='chuyen_kanban'
     where id=r.id and coalesce(duyet_dang_ky,'') in ('','cho_duyet');
    n := n + 1;
  end loop;
  -- don cac de xuat may sinh con treo cua kho BO (se tai sinh tu Kanban khi BO xac nhan)
  delete from crm_approvals a
   where a.doi_tuong='erp_dang_ky' and a.trang_thai='cho_duyet'
     and exists (select 1 from crm_dang_ky_du_an r2
                  where position('[ERP#'||r2.id::text||']' in coalesce(a.noi_dung,''))>0
                    and r2.duyet_dang_ky='chuyen_kanban');
  return n || ' dang ky da chuyen vao Kanban';
end $f$ language plpgsql;

select _v51();
drop function _v51();
commit;

-- NGHIEM THU:
-- 1) Kanban phai co ~26 ban ghi moi nguon chuyen-tu-BO:
select status, count(*) from crm_project_registrations
 where source='chuyen-tu-BO-15/08/2026' group by status;
-- 2) NPP ky HD noi dia phai ve dung 5 (CAREZONE/BKG da ha pheu):
select count(*) from crm_org where pheu_npp='da_ky_hd' and quoc_gia='VN';
-- 3) Hang cho CRM chi con de xuat khong thuoc kho BO da chuyen:
select count(*) from crm_approvals where doi_tuong='erp_dang_ky' and trang_thai='cho_duyet';
