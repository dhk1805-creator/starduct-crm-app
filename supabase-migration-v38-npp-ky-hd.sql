-- ============================================================
-- MIGRATION v38: Danh dau 9 NPP DA KY HOP DONG trong crm_org
-- pheu_npp='da_ky_hd' + nhom_quan_he='npp_hien_huu'.
-- Neu chua co trong crm_org thi tao moi. An toan chay lai.
-- Bo loc/gan NPP trang Quoc te (app v35.5) chi hien cac NPP nay.
-- ============================================================
begin;

create or replace function _v38_mark(p_pat text, p_ten text, p_qg text) returns text as $f$
declare n int;
begin
  update crm_org set phan_loai='npp', pheu_npp='da_ky_hd', nhom_quan_he='npp_hien_huu'
   where quoc_gia is distinct from 'VN' and ten ilike p_pat;
  get diagnostics n = row_count;
  if n = 0 then
    insert into crm_org (ten, quoc_gia, phan_loai, pheu_npp, nhom_quan_he, nguon)
    values (p_ten, p_qg, 'npp', 'da_ky_hd', 'npp_hien_huu', 'distributor-list-14/08/2026');
    return p_ten || ' -> TAO MOI';
  end if;
  return p_ten || ' -> cap nhat ' || n || ' dong';
end $f$ language plpgsql;

select _v38_mark('%TNR%',            'TNR Industries Co., Ltd',        'KH');
select _v38_mark('%SINABU%',         'PT. Sinabu Nusaindo',            'ID');
select _v38_mark('%MEY FOONG%',      'Mey Foong Technologies Co., Ltd','MO');
select _v38_mark('%AIRE FOCUS%',     'Aire Focus Corporation',         'PH');
select _v38_mark('%GREENTECH%',      'Greentech Indl Inc',             'PH');
select _v38_mark('%WIND CONTROL%',   'Wind Control Co., Ltd',          'TH');
select _v38_mark('%VITRILAN%',       'Vitrilan S.A',                   'UY');
select _v38_mark('%PLASTICADE%',     'Plasticade Products Corporation (American Louver Company)', 'US');
select _v38_mark('%AMERICAN LOUVER%','Plasticade Products Corporation (American Louver Company)', 'US');
select _v38_mark('%QC MANUFACTURING%','QC Manufacturing',              'US');

drop function _v38_mark(text,text,text);
commit;

-- NGHIEM THU: danh sach NPP da ky HD ngoai VN (phai ~9-10 dong, du 7 quoc gia)
select ten, quoc_gia, pheu_npp from crm_org
where quoc_gia is distinct from 'VN' and phan_loai='npp' and pheu_npp='da_ky_hd' order by quoc_gia, ten;
