-- ============================================================
-- MIGRATION v40: BAO CAO H1/2026 NOI DIA + MA CODE NPP
-- Nguon: "Bao cao chi tiet danh gia NPP va ke hoach 6 thang cuoi
-- nam 2026 V3" (Phong Kinh Doanh - Dao Nguyen Ngoc, 15/08/2026)
-- Gom 4 phan:
--   1) crm_org.ma_code  - ma code cho 9 NPP quoc te + 5 NPP noi dia
--   2) 5 NPP noi dia (NTK, GLX, VNMEP, IMP, MEPCO) = da ky HD
--   3) Doanh thu H1/2026 theo NPP theo thang (89,1 ty) -> crm_revenue
--   4) Pipeline H2/2026 (GLX 14 + VNMEP 3 + NTK 16 du an, ~77,7 ty)
--      -> crm_deals (khop ten thi CAP NHAT, khong khop thi TAO MOI)
-- An toan chay lai (idempotent).
-- ============================================================
begin;

-- ---------- PHAN 1: cot ma_code + ma cho NPP quoc te ----------
alter table crm_org add column if not exists ma_code text;

update crm_org set ma_code='ECA' where quoc_gia='KH' and ten ilike '%TNR%' and phan_loai='npp';
update crm_org set ma_code='EID' where quoc_gia='ID' and ten ilike '%Sinabu%' and phan_loai='npp';
update crm_org set ma_code='EMC' where quoc_gia='MO' and ten ilike '%Mey Foong%' and phan_loai='npp';
update crm_org set ma_code='EPH' where quoc_gia='PH' and (ten ilike '%Aire Focus%' or ten ilike '%Greentech%') and phan_loai='npp';
update crm_org set ma_code='ETL' where quoc_gia='TH' and ten ilike '%Wind Control%' and phan_loai='npp';
update crm_org set ma_code='EUY' where quoc_gia='UY' and ten ilike '%Vitrilan%' and phan_loai='npp';
update crm_org set ma_code='EAL' where quoc_gia='US' and ten ilike '%Plasticade%' and phan_loai='npp';
update crm_org set ma_code='EQC' where quoc_gia='US' and ten ilike '%QC Manufacturing%' and phan_loai='npp';

-- ---------- PHAN 2: 5 NPP noi dia da ky HD (tim theo ten, khong co thi tao) ----------
create or replace function _v40npp(p_pat text, p_ten text, p_ma text) returns text as $f$
declare keep_id crm_org.id%type;
begin
  select id into keep_id from crm_org
   where quoc_gia='VN' and (ten ilike p_pat or ma_code=p_ma)
   order by (phan_loai='npp') desc, ten limit 1;
  if keep_id is null then
    insert into crm_org (ten, quoc_gia, phan_loai, pheu_npp, quan_he, ma_code, nguon)
    values (p_ten, 'VN', 'npp', 'da_ky_hd', 'npp_hien_huu', p_ma, 'bao-cao-H1-2026')
    returning id into keep_id;
    return p_ten || ' -> TAO MOI';
  end if;
  update crm_org set phan_loai='npp', pheu_npp='da_ky_hd', quan_he='npp_hien_huu', ma_code=p_ma
   where id=keep_id;
  return p_ten || ' -> CAP NHAT';
end $f$ language plpgsql;

select _v40npp('%NTK%',        'NTK',        'NTK');
select _v40npp('%GALAXY%',     'GALAXYTECH', 'GLX');
select _v40npp('%VNMEP%',      'VNMEP',      'VNMEP');
select _v40npp('%MEPCO%',      'MEPCO',      'MEPCO');
select _v40npp('IMP',          'IMP',        'IMP');

-- 2 kenh tong hop (khong phai NPP): Truc tiep + Xuat khau
create or replace function _v40kenh(p_ten text, p_qg text, p_ma text) returns text as $f$
declare keep_id crm_org.id%type;
begin
  select id into keep_id from crm_org where ma_code=p_ma limit 1;
  if keep_id is null then
    insert into crm_org (ten, quoc_gia, phan_loai, loai_ban_ghi, ma_code, ghi_chu, nguon)
    values (p_ten, p_qg, 'khac', 'tinh_bao', p_ma, 'Kenh tong hop de ghi nhan doanh thu - khong phai doi tac thuc', 'bao-cao-H1-2026');
    return p_ten || ' -> TAO MOI';
  end if;
  return p_ten || ' -> DA CO';
end $f$ language plpgsql;

select _v40kenh('Kenh Truc tiep (NSCA)', 'VN', 'TT');
select _v40kenh('Kenh Xuat khau (tong hop)', 'XK', 'XK');

-- ---------- PHAN 3: DOANH THU H1/2026 theo NPP theo thang (ty dong) ----------
-- Nguon: muc 2.1 cua bao cao. Tong 89,1 ty = 16,01+4,35+16,42+13,87+20,03+18,42
create or replace function _v40rev(p_ma text, p_kenh text, p_qg text, p_t numeric[]) returns text as $f$
declare o_id crm_org.id%type; i int; n int := 0;
begin
  select id into o_id from crm_org where ma_code=p_ma limit 1;
  if o_id is null then return p_ma || ' -> KHONG TIM THAY ORG'; end if;
  for i in 1..6 loop
    if coalesce(p_t[i],0) > 0 then
      insert into crm_revenue (thang, org_id, quoc_gia, ma_nganh, kenh, so_tien, created_by)
      values (make_date(2026,i,1), o_id, p_qg, 'KHAC', p_kenh, round(p_t[i]*1000000000), 'bao-cao-H1-2026')
      on conflict (thang,org_id,ma_nganh,kenh) do update set so_tien=excluded.so_tien;
      n := n + 1;
    end if;
  end loop;
  return p_ma || ' -> ' || n || ' thang';
end $f$ language plpgsql;

select _v40rev('GLX',   'npp',       'VN', array[2.91,0.52,3.96,2.87,3.14,4.01]);
select _v40rev('NTK',   'npp',       'VN', array[2.24,1.35,5.30,4.93,7.62,8.45]);
select _v40rev('IMP',   'npp',       'VN', array[6.06,0.72,2.80,0.83,2.60,0.61]);
select _v40rev('MEPCO', 'npp',       'VN', array[0.61,0.23,0.56,0.56,0.51,0.09]);
select _v40rev('VNMEP', 'npp',       'VN', array[2.77,1.11,2.03,0.90,1.23,0.95]);
select _v40rev('TT',    'truc_tiep', 'VN', array[0.03,0.09,0.11,0.12,0,0.43]);
select _v40rev('XK',    'npp',       'XK', array[1.39,0.33,1.67,3.67,4.94,3.87]);

-- ---------- PHAN 4: PIPELINE H2/2026 -> crm_deals ----------
-- Khop ten (ilike) thi cap nhat NPP + gia tri uoc (chi khi dang trong), khong khop thi tao moi.
-- p_dh > 0 = du an da co dat hang -> stage po khi tao moi.
create or replace function _v40d(p_pat text, p_ten text, p_ma text, p_gt numeric, p_dh numeric) returns text as $f$
declare d_id crm_deals.id%type; o_id crm_org.id%type; o_ten text;
begin
  select id, ten into o_id, o_ten from crm_org where ma_code=p_ma and quoc_gia='VN' limit 1;
  select id into d_id from crm_deals where quoc_gia='VN' and ten ilike p_pat order by ten limit 1;
  if d_id is null then
    insert into crm_deals (ten, quoc_gia, stage, uu_tien, gia_tri_uoc, npp_dang_ky_id, npp_chi_dinh)
    values (p_ten, 'VN', case when p_dh>0 then 'po' else 'chao_gia' end, '1', p_gt, o_id, o_ten);
    return p_ten || ' -> TAO MOI';
  end if;
  update crm_deals set
    npp_dang_ky_id = coalesce(npp_dang_ky_id, o_id),
    npp_chi_dinh   = coalesce(npp_chi_dinh, o_ten),
    gia_tri_uoc    = case when coalesce(gia_tri_uoc,0)=0 then p_gt else gia_tri_uoc end
  where id=d_id;
  return p_ten || ' -> CAP NHAT';
end $f$ language plpgsql;

-- GALAXYTECH (14 du an, tong 25,57 ty)
select _v40d('%BẢN MÒNG%',          'BẢN MÒNG',                          'GLX', 841160000, 140022000);
select _v40d('%MONBAY%',            'MONBAY - QUẢNG NINH',               'GLX', 3762579850, 202000);
select _v40d('%TTTM HẢI DƯƠNG%',    'TTTM HẢI DƯƠNG',                    'GLX', 594987000, 0);
select _v40d('%JADE SQUARE%',       'CHUNG CƯ JADE SQUARE',              'GLX', 7303827400, 810375000);
select _v40d('%ICCK%',              'ICCK (B2-CC4)',                     'GLX', 5767280500, 3957583800);
select _v40d('%SPECTRE%',           'NHÀ MÁY SPECTRE THÁI BÌNH',         'GLX', 570888300, 464278400);
select _v40d('%HILTON BRG%',        'KHÁCH SẠN HILTON BRG',              'GLX', 3451100000, 643133000);
select _v40d('%KTX%PHENIKAA%',      'KTX D4 D5 ĐẠI HỌC PHENIKAA',        'GLX', 598135400, 0);
select _v40d('%NAM HƯNG%',          'KHÁCH SẠN NAM HƯNG PHENIKAA',       'GLX', 1875912000, 331533000);
select _v40d('%SONASEA%NHA TRANG%', 'SONASEA NHA TRANG',                 'GLX', 2227699000, 1071409000);
select _v40d('%KEPLER%',            'KEPLER LAND',                       'GLX', 661974800, 725049000);
select _v40d('%LUMI%',              'LUMI',                              'GLX', 2835131300, 3349233770);
select _v40d('%LEGEND BAY%',        'LEGEND BAY',                        'GLX', 6115891900, 501275500);
select _v40d('%ITOWER%',            'ITOWER',                            'GLX', 960594000, 0);

-- VNMEP (3 du an, tong 16,61 ty theo dong du an)
select _v40d('%CRYSTAL RIVER%',     'SUNSHINE NOBEL CRYSTAL RIVER',      'VNMEP', 6922085400, 2103741700);
select _v40d('%TÂY MỖ%',            'MIK TÂY MỖ (SOLA PARK)',            'VNMEP', 3185208000, 111767800);
select _v40d('%MATRIX ONE%',        'THE MATRIX ONE',                    'VNMEP', 6501939000, 331814300);

-- NTK (21 dong bao cao gop thanh 16 du an, tong 38,11 ty)
select _v40d('%TRIỂN LÃM QUỐC GIA%','TT HỘI CHỢ TRIỂN LÃM QUỐC GIA ĐÔNG ANH', 'NTK', 1244726500, 0);
select _v40d('%VIETTEL ĐÀ NẴNG%',   'TÒA NHÀ VIETTEL ĐÀ NẴNG',           'NTK', 1500933650, 0);
select _v40d('%TIMESQUARE%',        'TIMESQUARE ĐÀ NẴNG',                'NTK', 636071300, 0);
select _v40d('%SUNSEA%',            'SUNSEA TOWERS VƯƠNG THỪA VŨ',       'NTK', 3814345220, 550638000);
select _v40d('%SENIQUE%',           'THE SENIQUE HÀ NỘI B6-CT02 CT03',   'NTK', 470379200, 0);
select _v40d('%DƯỢC PHẨM PHENIKAA%','NM DƯỢC PHẨM PHENIKAA HÀ NỘI',      'NTK', 526919215, 208208255);
select _v40d('%THAI MAI%',          'NHÀ KHÁCH TÂY HỒ 43 ĐẶNG THAI MAI', 'NTK', 6355177338, 1004299900);
select _v40d('%TASECO%',            'TASECO LONG BIÊN CENTRAL A3/CT2',   'NTK', 3496247240, 465484000);
select _v40d('%VẠN QUỲNH%',         'KHÁCH SẠN VẠN QUỲNH',               'NTK', 983969620, 0);
select _v40d('%LÀNG TÂY%',          'HÒN THƠM - KS LÀNG TÂY PHÚ QUỐC',   'NTK', 9828837050, 151351200);
select _v40d('%HYATT SAPA%',        'HYATT SAPA LÀO CAI',                'NTK', 971440700, 248351587);
select _v40d('%PHẠM VĂN ĐỒNG%',     'TRỤ SỞ BỘ CÔNG AN 47 PHẠM VĂN ĐỒNG','NTK', 2923522950, 330154000);
select _v40d('%HOÀNG HUY%',         'HOÀNG HUY COMMERCE HẢI PHÒNG',      'NTK', 3743919170, 0);
select _v40d('%HOA SEN YÊN BÁI%',   'TTTM DV KS HOA SEN YÊN BÁI',        'NTK', 518932050, 0);
select _v40d('%HỒ TRÀM%',           'HYATT REGENCY HỒ TRÀM RESORT & SPA','NTK', 3165146350, 704000);
select _v40d('%TRƯƠNG ĐÌNH%',       'TRƯƠNG ĐÌNH TOWER',                 'NTK', 884789600, 374000);

drop function _v40npp(text,text,text);
drop function _v40kenh(text,text,text);
drop function _v40rev(text,text,text,numeric[]);
drop function _v40d(text,text,text,numeric,numeric);
commit;

-- ============================================================
-- NGHIEM THU (chay tung cau, xem ket qua):
-- 1) Ma code NPP: PHAI co 9 QT + 5 ND + 2 kenh
select ma_code, ten, quoc_gia, pheu_npp from crm_org where ma_code is not null order by quoc_gia, ma_code;
-- 2) Doanh thu H1: PHAI ra 89.1 (ty)
select round(sum(so_tien)/1e9,1) as tong_ty, count(*) as so_dong from crm_revenue where created_by='bao-cao-H1-2026';
-- 3) Doanh thu theo NPP: NTK 29.9 / GLX 17.4 / XK 15.9 / IMP 13.6 / VNMEP 9.0 / MEPCO 2.6 / TT 0.8
select o.ma_code, round(sum(r.so_tien)/1e9,1) as ty from crm_revenue r join crm_org o on o.id=r.org_id
 where r.created_by='bao-cao-H1-2026' group by o.ma_code order by ty desc;
-- 4) Pipeline H2 da gan NPP:
select o.ma_code, count(*) as so_da, round(sum(d.gia_tri_uoc)/1e9,1) as ty
 from crm_deals d join crm_org o on o.id=d.npp_dang_ky_id
 where o.ma_code in ('NTK','GLX','VNMEP') and d.quoc_gia='VN' group by o.ma_code;
