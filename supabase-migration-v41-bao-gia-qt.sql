-- ============================================================
-- MIGRATION v41: BAO GIA QUOC TE - sua khu_vuc + bo sung 13 YCSX
-- 1) 184 dong bao gia XK dang trong khu_vuc -> gan 'quoc_te'
--    (day la ly do dashboard NOI DIA hien 378 ty bao gia XK)
-- 2) Chuan hoa quoc gia ISAREL -> ISRAEL
-- 3) Bo sung 13 don YCSX cua Plasticade + QC Manufacturing (15,87 ty)
--    tu Quotation LIST goc - CRM dang thieu nen '0 YCSX'
-- An toan chay lai.
-- ============================================================
begin;

update crm_quotations set khu_vuc='quoc_te'
 where (khu_vuc is null or khu_vuc='noi_dia')
   and quoc_gia is not null and upper(quoc_gia) not in ('VIETNAM','VIET NAM','VN');

update crm_quotations set quoc_gia='ISRAEL' where upper(quoc_gia)='ISAREL';

do $b$
declare _stt int;
begin
  select coalesce(max(stt),0) into _stt from crm_quotations;
  insert into crm_quotations (stt, ten_sheet_bg, link_bg, ngay_update, thang, nam, trang_thai, ma_da, ten_da, ten_khach, quoc_gia, kh_cua_santiago, so_danh_muc, gia_tri_bao_gia, cua_gio, van_gio_ei, van_gio_co_khi, vav_cav, tam_nan, thang_mang_cap, hang_hoa_khac, khu_vuc)
  select * from (values (_stt+1, 'ĐH EAL 98- PO 18079', 'ĐH EAL 98- PO 48079', '2026-03-06'::date, 3, 2026, 'YCSX', 'EQC 98', null, 'Plasticade Products Corporation( American Louver Company )', 'USA', 'SANTIAGO', 27, 1357942000, 437204000, 0, 0, 0, 920738000, 0, 0, 'quoc_te')) v where not exists (select 1 from crm_quotations x where x.ngay_update='2026-03-06' and x.gia_tri_bao_gia=1357942000 and x.trang_thai='YCSX');
  insert into crm_quotations (stt, ten_sheet_bg, link_bg, ngay_update, thang, nam, trang_thai, ma_da, ten_da, ten_khach, quoc_gia, kh_cua_santiago, so_danh_muc, gia_tri_bao_gia, cua_gio, van_gio_ei, van_gio_co_khi, vav_cav, tam_nan, thang_mang_cap, hang_hoa_khac, khu_vuc)
  select * from (values (_stt+2, 'ĐH EQC 24- PO 14859', 'BG EQC 24- PO 14859', '2026-03-17'::date, 3, 2026, 'YCSX', 'EQC 24', null, 'QC Manufacturing', 'USA', 'SANTIAGO', 1, 310500000, 310500000, 0, 0, 0, 0, 0, 0, 'quoc_te')) v where not exists (select 1 from crm_quotations x where x.ngay_update='2026-03-17' and x.gia_tri_bao_gia=310500000 and x.trang_thai='YCSX');
  insert into crm_quotations (stt, ten_sheet_bg, link_bg, ngay_update, thang, nam, trang_thai, ma_da, ten_da, ten_khach, quoc_gia, kh_cua_santiago, so_danh_muc, gia_tri_bao_gia, cua_gio, van_gio_ei, van_gio_co_khi, vav_cav, tam_nan, thang_mang_cap, hang_hoa_khac, khu_vuc)
  select * from (values (_stt+3, 'ĐH EQC 25- PO 14941', 'BG EQC 25- PO 14941', '2026-04-15'::date, 4, 2026, 'YCSX', 'EQC 25', null, 'QC Manufacturing', 'USA', 'SANTIAGO', 2, 635925000, 635925000, 0, 0, 0, 0, 0, 0, 'quoc_te')) v where not exists (select 1 from crm_quotations x where x.ngay_update='2026-04-15' and x.gia_tri_bao_gia=635925000 and x.trang_thai='YCSX');
  insert into crm_quotations (stt, ten_sheet_bg, link_bg, ngay_update, thang, nam, trang_thai, ma_da, ten_da, ten_khach, quoc_gia, kh_cua_santiago, so_danh_muc, gia_tri_bao_gia, cua_gio, van_gio_ei, van_gio_co_khi, vav_cav, tam_nan, thang_mang_cap, hang_hoa_khac, khu_vuc)
  select * from (values (_stt+4, 'ĐH EAL 100- PO 48848', 'ĐH EAL 100- PO 48848', '2026-04-21'::date, 4, 2026, 'YCSX', 'EAL 100', null, 'Plasticade Products Corporation( American Louver Company )', 'USA', 'SANTIAGO', 26, 1432990000, 622652000, 0, 0, 0, 810338000, 0, 0, 'quoc_te')) v where not exists (select 1 from crm_quotations x where x.ngay_update='2026-04-21' and x.gia_tri_bao_gia=1432990000 and x.trang_thai='YCSX');
  insert into crm_quotations (stt, ten_sheet_bg, link_bg, ngay_update, thang, nam, trang_thai, ma_da, ten_da, ten_khach, quoc_gia, kh_cua_santiago, so_danh_muc, gia_tri_bao_gia, cua_gio, van_gio_ei, van_gio_co_khi, vav_cav, tam_nan, thang_mang_cap, hang_hoa_khac, khu_vuc)
  select * from (values (_stt+5, 'ĐH EAL 99- PO 48847', 'ĐH EAL 99- PO 48847', '2026-04-21'::date, 4, 2026, 'YCSX', 'EAL 99', null, 'Plasticade Products Corporation( American Louver Company )', 'USA', 'SANTIAGO', 3, 1494172000, 0, 0, 0, 0, 1494172000, 0, 0, 'quoc_te')) v where not exists (select 1 from crm_quotations x where x.ngay_update='2026-04-21' and x.gia_tri_bao_gia=1494172000 and x.trang_thai='YCSX');
  insert into crm_quotations (stt, ten_sheet_bg, link_bg, ngay_update, thang, nam, trang_thai, ma_da, ten_da, ten_khach, quoc_gia, kh_cua_santiago, so_danh_muc, gia_tri_bao_gia, cua_gio, van_gio_ei, van_gio_co_khi, vav_cav, tam_nan, thang_mang_cap, hang_hoa_khac, khu_vuc)
  select * from (values (_stt+6, 'ĐH EAL 101- PO 49251', 'ĐH EAL 101- PO 49251', '2026-05-09'::date, 5, 2026, 'YCSX', 'EAL 101', null, 'Plasticade Products Corporation( American Louver Company )', 'USA', 'SANTIAGO', 22, 1350231000, 819540000, 0, 0, 0, 530691000, 0, 0, 'quoc_te')) v where not exists (select 1 from crm_quotations x where x.ngay_update='2026-05-09' and x.gia_tri_bao_gia=1350231000 and x.trang_thai='YCSX');
  insert into crm_quotations (stt, ten_sheet_bg, link_bg, ngay_update, thang, nam, trang_thai, ma_da, ten_da, ten_khach, quoc_gia, kh_cua_santiago, so_danh_muc, gia_tri_bao_gia, cua_gio, van_gio_ei, van_gio_co_khi, vav_cav, tam_nan, thang_mang_cap, hang_hoa_khac, khu_vuc)
  select * from (values (_stt+7, 'ĐH EQC 26', 'ĐH EQC 26 ', '2026-05-09'::date, 5, 2026, 'YCSX', 'EQC 26', null, 'QC Manufacturing', 'USA', 'SANTIAGO', 5, 671685200, 671685200, 0, 0, 0, 0, 0, 0, 'quoc_te')) v where not exists (select 1 from crm_quotations x where x.ngay_update='2026-05-09' and x.gia_tri_bao_gia=671685200 and x.trang_thai='YCSX');
  insert into crm_quotations (stt, ten_sheet_bg, link_bg, ngay_update, thang, nam, trang_thai, ma_da, ten_da, ten_khach, quoc_gia, kh_cua_santiago, so_danh_muc, gia_tri_bao_gia, cua_gio, van_gio_ei, van_gio_co_khi, vav_cav, tam_nan, thang_mang_cap, hang_hoa_khac, khu_vuc)
  select * from (values (_stt+8, 'ĐH EAL 102- PO 49408', 'ĐH EAL 102- PO 49408', '2026-05-19'::date, 5, 2026, 'YCSX', 'EAL 102', null, 'Plasticade Products Corporation( American Louver Company )', 'USA', 'SANTIAGO', 13, 1464447000, 609276000, 0, 0, 0, 855171000, 0, 0, 'quoc_te')) v where not exists (select 1 from crm_quotations x where x.ngay_update='2026-05-19' and x.gia_tri_bao_gia=1464447000 and x.trang_thai='YCSX');
  insert into crm_quotations (stt, ten_sheet_bg, link_bg, ngay_update, thang, nam, trang_thai, ma_da, ten_da, ten_khach, quoc_gia, kh_cua_santiago, so_danh_muc, gia_tri_bao_gia, cua_gio, van_gio_ei, van_gio_co_khi, vav_cav, tam_nan, thang_mang_cap, hang_hoa_khac, khu_vuc)
  select * from (values (_stt+9, 'ĐH EAL 103- PO 49457', 'ĐH EAL 103- PO 49457', '2026-05-21'::date, 5, 2026, 'YCSX', 'EAL 103', null, 'Plasticade Products Corporation( American Louver Company )', 'USA', 'SANTIAGO', 13, 1444697000, 1209975000, 0, 0, 0, 234722000, 0, 0, 'quoc_te')) v where not exists (select 1 from crm_quotations x where x.ngay_update='2026-05-21' and x.gia_tri_bao_gia=1444697000 and x.trang_thai='YCSX');
  insert into crm_quotations (stt, ten_sheet_bg, link_bg, ngay_update, thang, nam, trang_thai, ma_da, ten_da, ten_khach, quoc_gia, kh_cua_santiago, so_danh_muc, gia_tri_bao_gia, cua_gio, van_gio_ei, van_gio_co_khi, vav_cav, tam_nan, thang_mang_cap, hang_hoa_khac, khu_vuc)
  select * from (values (_stt+10, 'ĐH EAL 97 - PO 47250', 'ĐH EAL 97 - PO 47250', '2026-01-07'::date, 1, 2026, 'YCSX', 'EAL 97', null, 'Plasticade Products Corporation( American Louver Company )', 'USA', 'SANTIAGO', 14, 1371654000, 108029000, 0, 0, 0, 1263625000, 0, 0, 'quoc_te')) v where not exists (select 1 from crm_quotations x where x.ngay_update='2026-01-07' and x.gia_tri_bao_gia=1371654000 and x.trang_thai='YCSX');
  insert into crm_quotations (stt, ten_sheet_bg, link_bg, ngay_update, thang, nam, trang_thai, ma_da, ten_da, ten_khach, quoc_gia, kh_cua_santiago, so_danh_muc, gia_tri_bao_gia, cua_gio, van_gio_ei, van_gio_co_khi, vav_cav, tam_nan, thang_mang_cap, hang_hoa_khac, khu_vuc)
  select * from (values (_stt+11, 'ĐH EAL 104 - PO 49862', 'ĐH EAL 104 - PO 49862', '2026-06-18'::date, 6, 2026, 'YCSX', 'EAL 104', null, 'Plasticade Products Corporation( American Louver Company )', 'USA', 'SANTIAGO', 25, 1428428000, 946197000, 0, 0, 0, 482231000, 0, 0, 'quoc_te')) v where not exists (select 1 from crm_quotations x where x.ngay_update='2026-06-18' and x.gia_tri_bao_gia=1428428000 and x.trang_thai='YCSX');
  insert into crm_quotations (stt, ten_sheet_bg, link_bg, ngay_update, thang, nam, trang_thai, ma_da, ten_da, ten_khach, quoc_gia, kh_cua_santiago, so_danh_muc, gia_tri_bao_gia, cua_gio, van_gio_ei, van_gio_co_khi, vav_cav, tam_nan, thang_mang_cap, hang_hoa_khac, khu_vuc)
  select * from (values (_stt+12, 'ĐH EAL 105- PO 50132', 'ĐH EAL 105- PO 50132', '2026-07-11'::date, 7, 2026, 'YCSX', 'EAL 105', null, 'Plasticade Products Corporation( American Louver Company )', 'USA', 'SANTIAGO', 25, 1507166210, 1024308730, 0, 0, 0, 482857480, 0, 0, 'quoc_te')) v where not exists (select 1 from crm_quotations x where x.ngay_update='2026-07-11' and x.gia_tri_bao_gia=1507166210 and x.trang_thai='YCSX');
  insert into crm_quotations (stt, ten_sheet_bg, link_bg, ngay_update, thang, nam, trang_thai, ma_da, ten_da, ten_khach, quoc_gia, kh_cua_santiago, so_danh_muc, gia_tri_bao_gia, cua_gio, van_gio_ei, van_gio_co_khi, vav_cav, tam_nan, thang_mang_cap, hang_hoa_khac, khu_vuc)
  select * from (values (_stt+13, 'ĐH EAL 106- PO 50204', 'ĐH EAL 106- PO 50204', '2026-07-16'::date, 7, 2026, 'YCSX', 'EAL 106', null, 'Plasticade Products Corporation( American Louver Company )', 'USA', 'SANTIAGO', 29, 1397734540, 311197380, 0, 0, 0, 1086537160, 0, 0, 'quoc_te')) v where not exists (select 1 from crm_quotations x where x.ngay_update='2026-07-16' and x.gia_tri_bao_gia=1397734540 and x.trang_thai='YCSX');
end $b$;

commit;

-- NGHIEM THU:
-- 1) Khong con bao gia XK nao thieu khu_vuc (phai = 0):
select count(*) from crm_quotations where khu_vuc is distinct from 'quoc_te' and upper(coalesce(quoc_gia,'')) not in ('VIETNAM','VIET NAM','VN','');
-- 2) YCSX phai = 13, tong 15.9 ty:
select count(*), round(sum(gia_tri_bao_gia)/1e9,1) from crm_quotations where trang_thai='YCSX';
-- 3) Tong bao gia quoc te phai ~ 394.4 ty / 197 dong:
select count(*), round(sum(gia_tri_bao_gia)/1e9,1) from crm_quotations where khu_vuc='quoc_te';