-- ============================================================
-- MIGRATION v44: DU AN QUOC TE VE DUNG TRANG THAI THUC TE
-- Nguyen tac (CEO 15/08): du an KHONG co bang chung hoat dong
-- (khong co bao gia khop ten, khong co tiep xuc, khong co de xuat)
-- thi KHONG duoc tinh da tiep can va KHONG gan nguoi phu trach
-- -> ve "Cho phan cong" (owner trong) + stage tiep_can.
-- Cac du an DA CHAO HANG (120, stage chao_gia/po tu v42) giu nguyen.
-- An toan chay lai.
-- ============================================================
begin;

update crm_deals d set nguoi_phu_trach=null, owner=null
 where d.quoc_gia is distinct from 'VN'
   and coalesce(d.stage,'tiep_can')='tiep_can'
   and not exists (select 1 from crm_touchpoints t where t.deal_id=d.id)
   and not exists (select 1 from crm_approvals a where a.doi_tuong='deal' and a.doi_tuong_id::text=d.id::text)
   and not exists (select 1 from crm_quotations q where q.khu_vuc='quoc_te' and upper(coalesce(q.ten_da,''))=upper(d.ten));

commit;

-- NGHIEM THU:
-- 1) DA QT gan phu trach ma khong co bang chung (phai = 0):
select count(*) from crm_deals d
 where d.quoc_gia is distinct from 'VN'
   and (d.nguoi_phu_trach is not null or d.owner is not null)
   and coalesce(d.stage,'tiep_can')='tiep_can'
   and not exists (select 1 from crm_touchpoints t where t.deal_id=d.id)
   and not exists (select 1 from crm_quotations q where q.khu_vuc='quoc_te' and upper(coalesce(q.ten_da,''))=upper(d.ten));
-- 2) Buc tranh QT sau don dep: cho phan cong / da chao hang / tong
select
  count(*) filter (where nguoi_phu_trach is null and owner is null) as cho_phan_cong,
  count(*) filter (where stage in ('chao_gia','po')) as da_chao_hang,
  count(*) as tong
from crm_deals where quoc_gia is distinct from 'VN';
