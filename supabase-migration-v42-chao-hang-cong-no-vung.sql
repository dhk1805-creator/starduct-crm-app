-- ============================================================
-- MIGRATION v42: 3 dau muc CEO 15/08 (dem 2)
-- A) 120 du an DA CHAO HANG quoc te -> crm_deals (gop tu 197 bao gia
--    theo ten + quoc gia; gia_tri_uoc = tong gia tri bao gia cua du an;
--    co YCSX -> stage po + uu tien 1; nguoi phu trach Santiago;
--    gan NPP ky HD theo ma; doi tac tham khao chi ghi ten)
-- B) Bang CONG NO NPP theo ky (crm_cong_no) + so lieu H1/2026 tu bao
--    cao PKD (den 26/06/2026, gom VAT)
-- C) Gan VUNG cho du an noi dia theo tu khoa dia danh trong ten
-- An toan chay lai (khong tao trung).
-- ============================================================
begin;

-- ---------- A) DU AN DA CHAO HANG QUOC TE ----------
create or replace function _v42d(p_ten text, p_qg text, p_orgpat text, p_npp text, p_gt numeric, p_ycsx boolean) returns text as $f$
declare o_id crm_org.id%type; o_ten text;
begin
  if p_orgpat is not null then
    select id, ten into o_id, o_ten from crm_org
     where quoc_gia is distinct from 'VN' and pheu_npp='da_ky_hd' and ten ilike p_orgpat limit 1;
  end if;
  if exists (select 1 from crm_deals where quoc_gia=p_qg and upper(ten)=upper(p_ten)) then
    update crm_deals set
      npp_dang_ky_id=coalesce(npp_dang_ky_id,o_id),
      npp_chi_dinh=coalesce(npp_chi_dinh,coalesce(o_ten,p_npp)),
      gia_tri_uoc=case when coalesce(gia_tri_uoc,0)=0 then p_gt else gia_tri_uoc end,
      stage=case when p_ycsx and stage in ('tiep_can','spec_in','chao_gia') then 'po' else stage end
     where quoc_gia=p_qg and upper(ten)=upper(p_ten);
    return p_ten || ' -> CAP NHAT';
  end if;
  insert into crm_deals (ten, quoc_gia, stage, uu_tien, gia_tri_uoc, npp_dang_ky_id, npp_chi_dinh, nguoi_phu_trach)
  values (p_ten, p_qg, case when p_ycsx then 'po' else 'chao_gia' end,
          case when p_ycsx then '1' else '3' end, p_gt, o_id, coalesce(o_ten,p_npp), 'Santiago de los Reyes');
  return p_ten || ' -> TAO MOI';
end $f$ language plpgsql;

select _v42d('MEDICINE FACTORY', 'ID', '%Sinabu%', null, 884933100, false);
select _v42d('DATA CENTRE', 'ID', '%Sinabu%', null, 646534800, false);
select _v42d('CGK4', 'ID', '%Sinabu%', null, 252551400, false);
select _v42d('EDGNEX JKT02', 'ID', '%Sinabu%', null, 227290100, false);
select _v42d('JAPFA', 'ID', '%Sinabu%', null, 133781500, false);
select _v42d('BANK INDONESIA', 'ID', '%Sinabu%', null, 88540700, false);
select _v42d('MENARA RAVINDO', 'ID', '%Sinabu%', null, 52342100, false);
select _v42d('DATA CENTER', 'ID', '%Sinabu%', null, 33362500, false);
select _v42d('HEJO PROJECT', 'ID', '%Sinabu%', null, 20092900, false);
select _v42d('CABLE TRAY', 'IL', null, 'QUAMOR', 1688013200, false);
select _v42d('FAIRFIELD MARRIOTT POIPET', 'KH', '%TNR%', null, 6443055100, false);
select _v42d('BOENG REANG', 'KH', '%TNR%', null, 3112480540, false);
select _v42d('A1 FACTORY', 'KH', '%TNR%', null, 807464800, false);
select _v42d('CAMBODIA AIR CATERING SERVICE (CACS)', 'KH', '%TNR%', null, 708596300, false);
select _v42d('CAMBODIA AIRPORT CATERING SERVICE AT TECHO INTERNATIONAL AIRPORT.', 'KH', '%TNR%', null, 336786500, false);
select _v42d('NPH', 'KH', '%TNR%', null, 99619000, false);
select _v42d('NPH PROJECT', 'KH', '%TNR%', null, 91060900, false);
select _v42d('A1P ASR', 'KH', '%TNR%', null, 68201900, false);
select _v42d('ASR PROJECT', 'KH', '%TNR%', null, 32250000, false);
select _v42d('WYNN EHT', 'MO', '%Mey Foong%', null, 17500667080, false);
select _v42d('B5 PROJECT', 'MO', '%Mey Foong%', null, 15015079820, false);
select _v42d('HOTEL & PODIUM', 'MO', '%Mey Foong%', null, 14348761440, false);
select _v42d('WP EHT HOTEL', 'MO', '%Mey Foong%', null, 11806060240, false);
select _v42d('THE LIGHT RAIL', 'MO', '%Mey Foong%', null, 9960740300, false);
select _v42d('LIBSOA - EAST WING TOWER AND PODIUM PHASE 2', 'MO', '%Mey Foong%', null, 8027477380, false);
select _v42d('ES5 STATION', 'MO', '%Mey Foong%', null, 5247442200, false);
select _v42d('ORGANIC WASTE TREATMENT CENTER', 'MO', '%Mey Foong%', null, 4514725020, false);
select _v42d('1D OFFICE', 'MO', '%Mey Foong%', null, 3727153950, false);
select _v42d('ES6 STATION', 'MO', '%Mey Foong%', null, 3346125120, false);
select _v42d('ES4 STATION', 'MO', '%Mey Foong%', null, 2616130660, false);
select _v42d('GRAND LISBOA PALACE', 'MO', '%Mey Foong%', null, 349876830, false);
select _v42d('MACAU POWER SUB-STATION', 'MO', '%Mey Foong%', null, 268241895, false);
select _v42d('MONETARY DATA CENTER', 'MO', '%Mey Foong%', null, 209578200, false);
select _v42d('MARIA IMMACULADA CONCEPCION MEDICAL CENTER (MALVAR)', 'PH', '%Greentech%', null, 10672914100, false);
select _v42d('NSCR EDSA STATION', 'PH', '%Greentech%', null, 10241920200, false);
select _v42d('METROBANK', 'PH', '%Greentech%', null, 9907903100, false);
select _v42d('JUPITER', 'PH', '%Aire Focus%', null, 6099808820, false);
select _v42d('HOTEL CLARK', 'PH', '%Greentech%', null, 4563653190, false);
select _v42d('NEW SENATE BUILDING PROJECT PHASE III', 'PH', '%Greentech%', null, 3739401800, false);
select _v42d('GREENTECH', 'PH', '%Greentech%', null, 3215043600, false);
select _v42d('BANGKO SENTRAL NG PILIPINAS PROJECT', 'PH', '%Aire Focus%', null, 2502048400, false);
select _v42d('SD-50 ORTIGAS NORTH STATION', 'PH', '%Greentech%', null, 2421068520, false);
select _v42d('MARIA IMMACULADA', 'PH', '%Aire Focus%', null, 2239460600, false);
select _v42d('CHINA BANK TOWER BUILDING', 'PH', '%Aire Focus%', null, 2204471700, false);
select _v42d('SD-51 SHAW STATION', 'PH', '%Greentech%', null, 2027189100, false);
select _v42d('BANGKO SENTRAL', 'PH', '%Aire Focus%', null, 1911362800, false);
select _v42d('SD-24 (MANDURRIAO)', 'PH', '%Greentech%', null, 1743762800, false);
select _v42d('AYALA MALL SIPIT', 'PH', '%Aire Focus%', null, 1692767300, false);
select _v42d('SD-49', 'PH', '%Greentech%', null, 1578799400, false);
select _v42d('SD-63 VILLA PROJECT', 'PH', '%Greentech%', null, 1538167800, false);
select _v42d('DFA BLDG', 'PH', '%Aire Focus%', null, 1421407600, false);
select _v42d('TRYNE RESIDENCE', 'PH', '%Greentech%', null, 1335057300, false);
select _v42d('SHANGRILA PROJECT', 'PH', '%Greentech%', null, 1250008500, false);
select _v42d('BALINTAWAK PROJECT', 'PH', '%Greentech%', null, 1247162500, false);
select _v42d('SD-38 MINDANAO', 'PH', '%Greentech%', null, 1150872100, false);
select _v42d('B2F FLOOR', 'PH', '%Greentech%', null, 998510600, false);
select _v42d('SD-69', 'PH', '%Greentech%', null, 984778100, false);
select _v42d('QUIRINO', 'PH', '%Greentech%', null, 859107200, false);
select _v42d('NEW NAIA T4', 'PH', '%Aire Focus%', null, 743568800, false);
select _v42d('NATIONAL PEDIATRIC HOSPITAL CAMBODIA', 'PH', '%Greentech%', null, 735276500, false);
select _v42d('NAIA T4', 'PH', '%Greentech%', null, 730548800, false);
select _v42d('ARUP', 'PH', '%Greentech%', null, 668862000, false);
select _v42d('SUBWAY NORTH AVE STATION', 'PH', '%Greentech%', null, 491622000, false);
select _v42d('VAV COMPACT', 'PH', '%Greentech%', null, 448715100, false);
select _v42d('NDA BINAN LAGUNA', 'PH', '%Greentech%', null, 414808300, false);
select _v42d('OREAN RESIDENCES TOWER 3', 'PH', '%Aire Focus%', null, 403451800, false);
select _v42d('TRYNE RESIDENCES PROJECT (ELITEAIR)', 'PH', '%Aire Focus%', null, 388945600, false);
select _v42d('LIMA NEW FACTORY', 'PH', '%Aire Focus%', null, 374143500, false);
select _v42d('SD-74', 'PH', '%Greentech%', null, 359463000, false);
select _v42d('NDA', 'PH', '%Greentech%', null, 355844700, false);
select _v42d('SD-55', 'PH', '%Greentech%', null, 350288500, false);
select _v42d('PROJECT SD 24', 'PH', '%Greentech%', null, 347857800, false);
select _v42d('IE&E', 'PH', '%Greentech%', null, 341035000, false);
select _v42d('SD-14 CEBU', 'PH', '%Greentech%', null, 337765300, false);
select _v42d('GARDEN CITY RESIDENTIAL', 'PH', '%Aire Focus%', null, 337210200, false);
select _v42d('SOUTHLINKS ESTATE PARADISE CLUBHOUSE', 'PH', '%Aire Focus%', null, 289331900, false);
select _v42d('GREENBELT 1 REDEVELOPMENT', 'PH', '%Aire Focus%', null, 288577800, false);
select _v42d('O PROJECT', 'PH', '%Aire Focus%', null, 272761900, false);
select _v42d('NKTI OPD', 'PH', '%Aire Focus%', null, 256370600, false);
select _v42d('NAGA', 'PH', '%Greentech%', null, 252441500, false);
select _v42d('THE NAUTILUS', 'PH', '%Aire Focus%', null, 227738000, false);
select _v42d('GOVERNMENT PROJECT', 'PH', '%Greentech%', null, 222247319, false);
select _v42d('MMSP CP101', 'PH', '%Aire Focus%', null, 209508500, false);
select _v42d('NDA OFFICE TOWER', 'PH', '%Greentech%', null, 200155900, false);
select _v42d('MARCEL OFFICE', 'PH', '%Aire Focus%', null, 198189300, false);
select _v42d('STA ROSA LAGUNA', 'PH', '%Greentech%', null, 163702404, false);
select _v42d('SD-25-R1', 'PH', '%Greentech%', null, 162700700, false);
select _v42d('SD-61', 'PH', '%Greentech%', null, 154257100, false);
select _v42d('HIGHLAND RESIDENCE', 'PH', '%Aire Focus%', null, 136592200, false);
select _v42d('SD-18', 'PH', '%Greentech%', null, 133050400, false);
select _v42d('BRITISH EMBASSY', 'PH', '%Aire Focus%', null, 132426100, false);
select _v42d('JAE FACTORY', 'PH', '%Aire Focus%', null, 114866100, false);
select _v42d('MANILA POLO CLUB', 'PH', '%Aire Focus%', null, 112509200, false);
select _v42d('BDO. MISSOURI', 'PH', '%Greentech%', null, 109665000, false);
select _v42d('SD-100', 'PH', '%Greentech%', null, 100654500, false);
select _v42d('SOUTH 2', 'PH', '%Greentech%', null, 90133000, false);
select _v42d('SD-48 LGU MAKATI CITY', 'PH', '%Greentech%', null, 80434500, false);
select _v42d('MAXICARE SANTA ROSA LAGUNA', 'PH', '%Aire Focus%', null, 80389500, false);
select _v42d('NAIA - T2', 'PH', '%Greentech%', null, 73707920, false);
select _v42d('SCRP CPS02', 'PH', '%Aire Focus%', null, 72125200, false);
select _v42d('NU-MAN', 'PH', '%Aire Focus%', null, 68796300, false);
select _v42d('SD-25-R2', 'PH', '%Greentech%', null, 68177600, false);
select _v42d('COMMON BUILDING', 'PH', '%Greentech%', null, 52160300, false);
select _v42d('SD-70', 'PH', '%Greentech%', null, 48991600, false);
select _v42d('SD-41 MAKATI', 'PH', '%Greentech%', null, 43293100, false);
select _v42d('SD-39 SCHOOL', 'PH', '%Greentech%', null, 27561100, false);
select _v42d('SD 59', 'PH', '%Greentech%', null, 24308900, false);
select _v42d('NUVEO TOWER 2', 'PH', '%Aire Focus%', null, 19073100, false);
select _v42d('SD 67 SOUTH 2 PROJECT', 'PH', '%Greentech%', null, 15769900, false);
select _v42d('INFINIVAN BALER CLS', 'PH', '%Aire Focus%', null, 15604500, false);
select _v42d('KAKAO FARM CAFÉ', 'PH', '%Greentech%', null, 12075500, false);
select _v42d('PICE HEADQUARTERS PROJECT', 'PH', '%Aire Focus%', null, 4424300, false);
select _v42d('SUFA RUSIA', 'RU', null, 'CÔNG TY TNHH THƯƠNG MẠI VÀ XUẤT NHẬP KHẨU VĨNH GIA', 91251589000, false);
select _v42d('GLUFF POWER', 'TH', '%Wind Control%', null, 2893018900, false);
select _v42d('DATA CENTER', 'TH', '%Wind Control%', null, 1330480900, false);
select _v42d('GCS TIDC', 'TH', '%Wind Control%', null, 405049500, false);
select _v42d('INFRA KING OIL', 'TH', '%Wind Control%', null, 156044900, false);
select _v42d('MCO IMPROVEMENT', 'TH', '%Wind Control%', null, 33441300, false);
select _v42d('SHOEMAKER SEIHO', 'US', null, 'THE RECTORSEAL CORPORATION', 37325758600, false);
select _v42d('ALUMINUM EGG CRATE', 'US', null, 'THE RECTORSEAL CORPORATION', 1959980000, false);

drop function _v42d(text,text,text,text,numeric,boolean);

-- ---------- B) CONG NO NPP THEO KY ----------
create table if not exists crm_cong_no (
  id uuid primary key default gen_random_uuid(),
  ky text not null,
  org_id uuid references crm_org(id),
  ma_code text,
  xuat_hd numeric default 0,
  da_tt numeric default 0,
  no_cuoi_ky numeric default 0,
  no_kho_doi numeric default 0,
  ghi_chu text,
  cap_nhat date default current_date,
  unique (ky, ma_code)
);

create or replace function _v42n(p_ma text, p_xhd numeric, p_tt numeric, p_no numeric, p_kd numeric, p_gc text) returns text as $f$
declare o_id crm_org.id%type;
begin
  select id into o_id from crm_org where ma_code=p_ma limit 1;
  insert into crm_cong_no (ky, org_id, ma_code, xuat_hd, da_tt, no_cuoi_ky, no_kho_doi, ghi_chu, cap_nhat)
  values ('H1-2026', o_id, p_ma, round(p_xhd*1e9), round(p_tt*1e9), round(p_no*1e9), round(p_kd*1e9), p_gc, '2026-06-26'::date)
  on conflict (ky, ma_code) do update set org_id=excluded.org_id, xuat_hd=excluded.xuat_hd,
    da_tt=excluded.da_tt, no_cuoi_ky=excluded.no_cuoi_ky, no_kho_doi=excluded.no_kho_doi,
    ghi_chu=excluded.ghi_chu, cap_nhat=excluded.cap_nhat;
  return p_ma;
end $f$ language plpgsql;

select _v42n('NTK',   25.69, 28.62, 7.30, 0,    'Vuot nguong cam ket 6 ty - cho phuong an cua Ban Lanh dao');
select _v42n('IMP',   15.72, 15.83, 10.26, 0,   'No cuoi ky cao nhat he thong - don doc thanh toan gap');
select _v42n('GLX',   17.69, 23.61, 2.11, 0,    'Thanh toan tot');
select _v42n('VNMEP', 11.85, 15.19, 2.09, 0,    'Kiem soat tot');
select _v42n('MEPCO',  3.60,  5.23, 0.10, 0,    'Thuong xuyen tre han - khong tang han muc tin dung');
select _v42n('TT',     3.88,  5.78, 9.06, 5.53, 'No kho doi phan lon ton dong truoc 2022 - cho phuong an xu ly');
select _v42n('XK',    11.87, 13.04, 3.68, 0,    'Xuat khau');

drop function _v42n(text,numeric,numeric,numeric,numeric,text);

-- ---------- C) GAN VUNG DU AN NOI DIA THEO DIA DANH ----------
create or replace function _v42v(p_vung text, p_pats text[]) returns int as $f$
declare n int;
begin
  update crm_deals set vung=p_vung
   where quoc_gia='VN' and (vung is null or vung='')
     and exists (select 1 from unnest(p_pats) pat where ten ilike pat);
  get diagnostics n = row_count;
  return n;
end $f$ language plpgsql;

select 'mien_bac: ' || _v42v('mien_bac', array['%HÀ NỘI%','%HA NOI%','% HN%','%QUẢNG NINH%','%HẠ LONG%','%MONBAY%','%HẢI PHÒNG%','%HOÀNG HUY%','%HƯNG YÊN%','%BẮC GIANG%','%BẮC NINH%','%PHÚ THỌ%','%LÀO CAI%','%SAPA%','%SA PA%','%THÁI BÌNH%','%NINH BÌNH%','%HẢI DƯƠNG%','%YÊN BÁI%','%VĨNH PHÚC%','%THÁI NGUYÊN%','%LONG BIÊN%','%TÂY HỒ%','%TÂY MỖ%','%ĐÔNG ANH%','%STARLAKE%','%TÂY HỒ TÂY%','%LUMI%','%MATRIX ONE%','%PHENIKAA%','%JADE SQUARE%','%HILTON%OPERA%','%PHẠM VĂN ĐỒNG%','%ĐẶNG THAI MAI%','%NGUYỄN TUÂN%','%XUÂN PHƯƠNG%','%SMART CITY%','%SOLA PARK%','%LÁNG HẠ%','%GIẢNG VÕ%','%HOÀ LẠC%','%HÒA LẠC%','%NỘI BÀI%','%TRƯƠNG ĐÌNH%','%KEPLER%','%ICCK%','%LEGEND BAY%','%HẠ LONG%','%SPECTRE%','%GANG THÉP%','%COPAN%']);
select 'mien_trung: ' || _v42v('mien_trung', array['%ĐÀ NẴNG%','%DA NANG%','%HỘI AN%','%QUẢNG NAM%','%HUẾ%','%NHA TRANG%','%KHÁNH HÒA%','%CAM RANH%','%QUY NHƠN%','%BÌNH ĐỊNH%','%PHÚ YÊN%','%BÀ NÀ%','%NGHỆ AN%','%VINH%','%HÀ TĨNH%','%QUẢNG TRỊ%','%QUẢNG BÌNH%','%SONASEA%','%OLALANI%','%TIMESQUARE%','%VIETTEL ĐÀ NẴNG%','%ASTA%','%THANH HÓA%','%SẦM SƠN%']);
select 'mien_nam: ' || _v42v('mien_nam', array['%HCM%','%HỒ CHÍ MINH%','%SÀI GÒN%','%SAI GON%','%THỦ ĐỨC%','%BÌNH DƯƠNG%','%ĐỒNG NAI%','%LONG THÀNH%','%VŨNG TÀU%','%HỒ TRÀM%','%PHÚ QUỐC%','%CẦN THƠ%','%KIÊN GIANG%','%AN GIANG%','%TÂY NINH%','%LONG AN%','%BÌNH PHƯỚC%','%CỦ CHI%','%QUẬN 1%','%QUẬN 7%','%BÌNH THẠNH%','%HÒN THƠM%','%LÀNG TÂY%','%NAM PHƯƠNG HOÀNG HẬU%','%BẾN LỨC%','%NHƠN TRẠCH%']);

drop function _v42v(text,text[]);
commit;

-- NGHIEM THU:
-- 1) Du an QT da chao hang (phai >= 120 du an co NPP hoac ten NPP):
select count(*) from crm_deals where quoc_gia<>'VN' and stage in ('chao_gia','po') and npp_chi_dinh is not null;
-- 2) Cong no H1-2026 (phai 7 dong, tong no cuoi ky 34.6 ty):
select count(*), round(sum(no_cuoi_ky)/1e9,1) from crm_cong_no where ky='H1-2026';
-- 3) Du an VN con thieu vung (cang it cang tot):
select count(*) from crm_deals where quoc_gia='VN' and (vung is null or vung='');
