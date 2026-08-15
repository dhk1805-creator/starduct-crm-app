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
        v_cols text; v_vals text; extra record; v_def text; v_src text;
begin
  -- Cot source co CHECK constraint -> tu doc dinh nghia va chon gia tri hop le
  select pg_get_constraintdef(oid) into v_def from pg_constraint
   where conrelid='crm_project_registrations'::regclass
     and conname='crm_project_registrations_source_chk';
  if v_def is not null then
    if v_def like '%''admin''%' then v_src := 'admin';
    else v_src := (regexp_match(v_def, '''([^'']+)'''))[1];
    end if;
  end if;
  v_src := coalesce(v_src, 'admin');
  -- Tu quet cac cot BAT BUOC (not null, khong default) ngoai bo cot minh chu dong dien
  -- va tu dong dien placeholder theo kieu du lieu -> khong con lo sot cot nao
  v_cols := ''; v_vals := '';
  for extra in
    select column_name, data_type from information_schema.columns
     where table_schema='public' and table_name='crm_project_registrations'
       and is_nullable='NO' and column_default is null
       and column_name not in ('id','npp_id','npp_name_snapshot','project_name','investor',
                               'design_unit','mep_contractor','estimated_value','status','source','created_at','scale_desc')
  loop
    v_cols := v_cols || ', ' || quote_ident(extra.column_name);
    v_vals := v_vals || ', ' ||
      case when extra.data_type in ('text','character varying') then quote_literal('(chưa rõ)')
           when extra.data_type in ('numeric','integer','bigint','smallint','double precision','real') then '0'
           when extra.data_type like 'timestamp%' or extra.data_type='date' then 'now()'
           when extra.data_type='boolean' then 'false'
           when extra.data_type='jsonb' then quote_literal('{}') || '::jsonb'
           else 'null' end;
  end loop;
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
    -- gia_tri_nganh la JSONB (gia tri tach theo nganh hang) -> cong don cac so trong do
    v_gt := null;
    begin
      if jsonb_typeof(to_jsonb(r.gia_tri_nganh)) = 'number' then
        v_gt := to_jsonb(r.gia_tri_nganh)::text::numeric;
      elsif jsonb_typeof(to_jsonb(r.gia_tri_nganh)) = 'object' then
        select sum(regexp_replace(value,'[^0-9]','','g')::numeric) into v_gt
          from jsonb_each_text(to_jsonb(r.gia_tri_nganh))
         where length(regexp_replace(value,'[^0-9]','','g')) between 6 and 12;
      end if;
    exception when others then v_gt := null;
    end;
    if v_gt is null or v_gt = 0 then
      begin
        if length(regexp_replace(r.tong_cong::text,'[^0-9]','','g')) >= 6 then
          v_gt := regexp_replace(r.tong_cong::text,'[^0-9]','','g')::numeric;
        end if;
      exception when others then v_gt := null;
      end;
    end if;
    if v_gt is not null and (v_gt < 1000000 or v_gt > 500000000000) then v_gt := null; end if; -- nguong hop ly: 1 trieu .. 500 ty
    v_st := case when r.duyet_dang_ky='da_duyet' then 'da_duyet'
                 when r.duyet_dang_ky='tu_choi' then 'tu_choi'
                 else 'can_bo_sung' end;
    execute 'insert into crm_project_registrations '
      || '(npp_id, npp_name_snapshot, project_name, investor, design_unit, mep_contractor, '
      || 'estimated_value, status, source, created_at, scale_desc' || v_cols || ') '
      || 'values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11' || v_vals || ')'
      using v_npp_id, coalesce(r.npp,'NPP'), coalesce(r.du_an,'(chưa rõ tên)'),
            coalesce(nullif(r.cdt,''),'(chưa rõ CĐT)'),
            coalesce(nullif(r.tvtk,''),'(chưa rõ)'), coalesce(nullif(r.nha_thau,''),'(chưa rõ)'),
            coalesce(v_gt,0), v_st, v_src, coalesce(r.created_at, now()),
            'Chuyển từ BO 15/08/2026 — chờ BO xác nhận, bổ sung thông tin';
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
 where scale_desc like 'Chuyển từ BO%' group by status;
-- 2) NPP ky HD noi dia phai ve dung 5 (CAREZONE/BKG da ha pheu):
select count(*) from crm_org where pheu_npp='da_ky_hd' and quoc_gia='VN';
-- 3) Hang cho CRM chi con de xuat khong thuoc kho BO da chuyen:
select count(*) from crm_approvals where doi_tuong='erp_dang_ky' and trang_thai='cho_duyet';
