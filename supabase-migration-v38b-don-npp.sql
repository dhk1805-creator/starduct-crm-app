-- ============================================================
-- MIGRATION v38b: DON TRUNG LAP NPP DA KY HD -> dung 9 ban ghi
-- Moi NPP: giu 1 ban ghi chuan (uu tien dung quoc gia ky HD),
-- chuan hoa ten + quoc_gia (ISO); cac ban trung/sai thi truong
-- ha xuong pheu tiem nang (pheu_npp=null, quan_he='npp_moi').
-- Khong xoa ban ghi nao (an toan voi du an/tiep xuc dang tro toi).
-- An toan chay lai.
-- ============================================================
begin;

create or replace function _v38b(p_pat text, p_ten text, p_iso text, p_cty text[]) returns text as $f$
declare keep_id crm_org.id%type; n int;
begin
  -- ha tat ca ban ghi khop ten xuong tiem nang
  update crm_org set pheu_npp=null, quan_he='npp_moi'
   where quoc_gia is distinct from 'VN' and ten ilike p_pat;
  get diagnostics n = row_count;
  -- chon 1 ban ghi giu lai: uu tien dung quoc gia ky HD, roi theo ten
  select id into keep_id from crm_org
   where quoc_gia is distinct from 'VN' and ten ilike p_pat
   order by (upper(coalesce(quoc_gia,'')) = any(p_cty)) desc, ten limit 1;
  if keep_id is null then
    insert into crm_org (ten, quoc_gia, phan_loai, pheu_npp, quan_he, nguon)
    values (p_ten, p_iso, 'npp', 'da_ky_hd', 'npp_hien_huu', 'distributor-list-14/08/2026');
    return p_ten || ' -> TAO MOI';
  end if;
  update crm_org set ten=p_ten, quoc_gia=p_iso, phan_loai='npp',
    pheu_npp='da_ky_hd', quan_he='npp_hien_huu' where id=keep_id;
  return p_ten || ' -> giu 1 / ' || n || ' ban ghi khop';
end $f$ language plpgsql;

select _v38b('%TNR%',             'TNR Industries Co., Ltd',         'KH', array['KH','CAMBODIA']);
select _v38b('%SINABU%',          'PT. Sinabu Nusaindo',             'ID', array['ID','INDONESIA']);
select _v38b('%MEY FOONG%',       'Mey Foong Technologies Co., Ltd', 'MO', array['MO','MACAO','MACAU']);
select _v38b('%AIRE FOCUS%',      'Aire Focus Corporation',          'PH', array['PH','PHILIPPINES']);
select _v38b('%GREENTECH%',       'Greentech Indl Inc',              'PH', array['PH','PHILIPPINES']);
select _v38b('%WIND CONTROL%',    'Wind Control Co., Ltd',           'TH', array['TH','THAILAND']);
select _v38b('%VITRILAN%',        'Vitrilan S.A',                    'UY', array['UY','URUGUAY']);
select _v38b('%PLASTICADE%',      'Plasticade Products Corporation (American Louver Company)', 'US', array['US','USA']);
select _v38b('%AMERICAN LOUVER%', 'Plasticade Products Corporation (American Louver Company)', 'US', array['US','USA']);
select _v38b('%QC MANUFACTURING%','QC Manufacturing',                'US', array['US','USA']);

drop function _v38b(text,text,text,text[]);
commit;

-- NGHIEM THU: PHAI DUNG 9 dong, moi cong ty 1 dong, dung quoc gia
select ten, quoc_gia, pheu_npp, quan_he from crm_org
where quoc_gia is distinct from 'VN' and pheu_npp='da_ky_hd' order by quoc_gia, ten;
