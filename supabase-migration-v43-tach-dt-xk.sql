-- ============================================================
-- MIGRATION v43: TACH DOANH THU XUAT KHAU H1/2026 THEO THI TRUONG
-- Nguon: BC tong hop doanh thu International Market H1/2026 (Santiago)
-- + duong cong thang tu bao cao PKD noi dia (XK theo thang).
-- Tong theo THANG va tong theo THI TRUONG deu dung 100% so bao cao,
-- chi tiet thang x thi truong la PHAN BO UOC theo ty trong thang
-- (CEO chot phuong an 15/08). created_by='phan-bo-bc-santiago-h1'.
-- Thay the 6 dong XK tong (created_by='bao-cao-H1-2026', ma XK).
-- Luu y: doanh thu PH ghi vao org Greentech (gom ca khach cu Dico -
-- bao cao khong tach; chinh lai khi co so lieu BO chi tiet).
-- An toan chay lai.
-- ============================================================
begin;

-- xoa 6 dong XK tong hop cu (thay bang phan tach ben duoi)
delete from crm_revenue r using crm_org o
 where r.org_id=o.id and o.ma_code='XK' and r.created_by='bao-cao-H1-2026';

create or replace function _v43r(p_orgpat text, p_ma text, p_qg text, p_t numeric[]) returns text as $f$
declare o_id crm_org.id%type; i int; n int := 0;
begin
  if p_orgpat is not null then
    select id into o_id from crm_org where ten ilike p_orgpat and quoc_gia is distinct from 'VN' limit 1;
  end if;
  if o_id is null then select id into o_id from crm_org where ma_code=p_ma limit 1; end if;
  if o_id is null then return p_ma || ' -> KHONG TIM THAY ORG'; end if;
  for i in 1..6 loop
    if coalesce(p_t[i],0) > 0 then
      insert into crm_revenue (thang, org_id, quoc_gia, ma_nganh, kenh, so_tien, created_by)
      values (make_date(2026,i,1), o_id, p_qg, 'KHAC', 'npp', p_t[i], 'phan-bo-bc-santiago-h1')
      on conflict (thang,org_id,ma_nganh,kenh) do update set so_tien=excluded.so_tien, created_by=excluded.created_by;
      n := n + 1;
    end if;
  end loop;
  return p_ma || ' -> ' || n || ' thang';
end $f$ language plpgsql;

select _v43r('%Greentech%', 'EPH', 'PH', array[32781000,7783000,39385000,86552000,116503000,91268674]);
select _v43r('%TNR%', 'ECA', 'KH', array[30616000,7269000,36784000,80836000,108809000,85240960]);
select _v43r('%Vitrilan%', 'EUY', 'UY', array[10687000,2537000,12840000,28216000,37981000,29753300]);
select _v43r('%Wind Control%', 'ETL', 'TH', array[1963000,466000,2359000,5184000,6977000,5466490]);
select _v43r('%Sinabu%', 'EID', 'ID', array[1552000,369000,1865000,4099000,5517000,4321000]);
select _v43r(null, 'XK', 'XK', array[1312401000,311576000,1576767000,3465113000,4664213000,3653949576]);  -- khoi truyen thong EAL/EQC/Macao (14,98 ty)

drop function _v43r(text,text,text,numeric[]);
commit;

-- NGHIEM THU:
-- 1) Tong XK van phai = 15.87 ty:
select round(sum(so_tien)/1e9,2) from crm_revenue where created_by='phan-bo-bc-santiago-h1';
-- 2) Santiago 5 thi truong = 0.886 ty (886tr):
select round(sum(so_tien)/1e6,1) from crm_revenue where created_by='phan-bo-bc-santiago-h1' and quoc_gia<>'XK';
-- 3) Tong doanh thu H1 toan he thong van = 89.1 ty:
select round(sum(so_tien)/1e9,1) from crm_revenue where created_by in ('bao-cao-H1-2026','phan-bo-bc-santiago-h1');