-- ============================================================
-- KIEM TRA SUC KHOE DU LIEU CRM - chay 1 lan, ra bang PASS/FAIL
-- Chay bat ky luc nao, khong sua du lieu. Moi dong 1 rang buoc.
-- Quy uoc: DAT = dung nhu thiet ke. KHONG DAT = can xu ly.
-- ============================================================
with kq as (

select 10 as stt, 'Doi tac thieu quoc gia' as hang_muc,
  count(*)::text as ket_qua, case when count(*)=0 then 'DAT' else 'KHONG DAT' end as danh_gia
from crm_org where quoc_gia is null or quoc_gia=''

union all
select 11, 'Doi tac thieu phan loai', count(*)::text,
  case when count(*)=0 then 'DAT' else 'KHONG DAT' end
from crm_org where phan_loai is null

union all
select 12, 'NPP ky HD quoc te (chuan = 9)', count(*)::text,
  case when count(*)=9 then 'DAT' else 'KHONG DAT' end
from crm_org where pheu_npp='da_ky_hd' and quoc_gia is distinct from 'VN'

union all
select 13, 'NPP ky HD noi dia (chuan = 5)', count(*)::text,
  case when count(*)=5 then 'DAT' else 'KHONG DAT' end
from crm_org where pheu_npp='da_ky_hd' and quoc_gia='VN'

union all
select 14, 'NPP ky HD chua co ma code', count(*)::text,
  case when count(*)=0 then 'DAT' else 'KHONG DAT' end
from crm_org where pheu_npp='da_ky_hd' and (ma_code is null or ma_code='')

union all
select 20, 'Bao gia XK bi trong khu_vuc (ro sang trang ND)', count(*)::text,
  case when count(*)=0 then 'DAT' else 'KHONG DAT' end
from crm_quotations
where khu_vuc is distinct from 'quoc_te'
  and upper(coalesce(quoc_gia,'')) not in ('VIETNAM','VIET NAM','VN','')

union all
select 21, 'Bao gia quoc te: so dong / ty (chuan 197 / 394.4)',
  count(*)::text || ' / ' || round(sum(gia_tri_bao_gia)/1e9,1)::text,
  case when count(*)=197 then 'DAT' else 'KHONG DAT' end
from crm_quotations where khu_vuc='quoc_te'

union all
select 22, 'Don YCSX: so don / ty (chuan 13 / 15.9)',
  count(*)::text || ' / ' || round(sum(gia_tri_bao_gia)/1e9,1)::text,
  case when count(*)=13 then 'DAT' else 'KHONG DAT' end
from crm_quotations where trang_thai='YCSX'

union all
select 23, 'Cong no NPP ky H1-2026 (chuan = 7 dong / 34.6 ty)',
  count(*)::text || ' / ' || round(sum(no_cuoi_ky)/1e9,1)::text,
  case when count(*)=7 then 'DAT' else 'KHONG DAT' end
from crm_cong_no where ky='H1-2026'

union all
select 24, 'Du an QT da chao hang co NPP (chuan >= 120)', count(*)::text,
  case when count(*)>=120 then 'DAT' else 'KHONG DAT' end
from crm_deals where quoc_gia<>'VN' and stage in ('chao_gia','po') and npp_chi_dinh is not null

union all
select 30, 'Doanh thu H1/2026 tu bao cao: ty (chuan 89.1)',
  coalesce(round(sum(so_tien)/1e9,1)::text,'0'),
  case when round(coalesce(sum(so_tien),0)/1e9,1)=89.1 then 'DAT' else 'KHONG DAT' end
from crm_revenue where created_by in ('bao-cao-H1-2026','phan-bo-bc-santiago-h1')

union all
select 25, 'DA QT gan phu trach ma khong co bang chung hoat dong', count(*)::text,
  case when count(*)=0 then 'DAT' else 'KHONG DAT' end
from crm_deals d
where d.quoc_gia is distinct from 'VN'
  and (d.nguoi_phu_trach is not null or d.owner is not null)
  and coalesce(d.stage,'tiep_can')='tiep_can'
  and not exists (select 1 from crm_touchpoints t where t.deal_id=d.id)
  and not exists (select 1 from crm_quotations q where q.khu_vuc='quoc_te' and upper(coalesce(q.ten_da,''))=upper(d.ten))

union all
select 32, 'DT Santiago 5 thi truong (chuan 886 trieu)',
  coalesce(round(sum(so_tien)/1e6,0)::text,'0'),
  case when round(coalesce(sum(so_tien),0)/1e6,0)=886 then 'DAT' else 'KHONG DAT' end
from crm_revenue where created_by='phan-bo-bc-santiago-h1' and quoc_gia<>'XK'

union all
select 31, 'Doanh thu co dong am hoac bang 0', count(*)::text,
  case when count(*)=0 then 'DAT' else 'KHONG DAT' end
from crm_revenue where coalesce(so_tien,0) <= 0

union all
select 40, 'Du an thieu quoc gia', count(*)::text,
  case when count(*)=0 then 'DAT' else 'KHONG DAT' end
from crm_deals where quoc_gia is null or quoc_gia=''

union all
select 41, 'Du an chi dinh NPP nhung NPP chua ky HD', count(*)::text,
  case when count(*)=0 then 'DAT' else 'KHONG DAT' end
from crm_deals d join crm_org o on o.id=d.npp_dang_ky_id
where coalesce(o.pheu_npp,'') <> 'da_ky_hd'

union all
select 42, 'Du an trung ten trong cung quoc gia (nghi trung lap)', count(*)::text,
  case when count(*)=0 then 'DAT' else 'CANH BAO' end
from (select upper(ten), quoc_gia from crm_deals group by 1,2 having count(*)>1) t

union all
select 43, 'Du an noi dia chua gan vung (bang Theo thi truong)', count(*)::text,
  case when count(*)=0 then 'DAT' else 'CANH BAO' end
from crm_deals where quoc_gia='VN' and (vung is null or vung='')

union all
select 44, 'Du an theo doi chua noi ma kho nen', count(*)::text,
  case when count(*)=0 then 'DAT' else 'CANH BAO' end
from crm_deals where ma_du_an_nen is null

union all
select 50, 'Kho nen thieu khu_vuc', count(*)::text,
  case when count(*)=0 then 'DAT' else 'KHONG DAT' end
from crm_du_an_nen where khu_vuc is null

union all
select 60, 'De xuat/phe duyet mo coi (doi tuong khong ton tai)', count(*)::text,
  case when count(*)=0 then 'DAT' else 'KHONG DAT' end
from crm_approvals a
where a.doi_tuong='deal' and not exists (select 1 from crm_deals d where d.id::text=a.doi_tuong_id::text)

union all
select 61, 'Nguoi co quyen phe duyet (chuan = 4)', count(*)::text,
  case when count(*)=4 then 'DAT' else 'KHONG DAT' end
from crm_user_roles where quyen_phe_duyet is true

union all
select 62, 'Nguoi co quyen tiep nhan (chuan = 3)', count(*)::text,
  case when count(*)=3 then 'DAT' else 'KHONG DAT' end
from crm_user_roles where quyen_tiep_nhan is true

)
select stt, hang_muc, ket_qua, danh_gia from kq order by stt;
