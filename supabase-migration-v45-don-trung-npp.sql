-- ============================================================
-- MIGRATION v45: don 2 hang muc KHONG DAT cua bo nghiem thu
-- A) Gop ban trung TAOYUAN INTERNATIONAL AIRPORT TERMINAL 3 (TW):
--    giu ban ghi co nhieu thong tin nhat, xoa ban trung CHI KHI
--    ban trung khong co du lieu con (tiep xuc/bao gia/de xuat).
-- B) 2 du an dang tro vao NPP CHUA ky HD:
--    1) neu co NPP da ky ten tuong dong (cung tu dau + cung quoc gia)
--       -> tro lai dung NPP da ky (truong hop ban ghi NPP bi ha cap v38b)
--    2) con lai -> giu ten NPP dang chu (npp_chi_dinh), bo lien ket cung
-- An toan chay lai.
-- ============================================================
begin;

-- A) gop trung Taoyuan T3
delete from crm_deals d
 where d.quoc_gia='TW' and upper(d.ten)='TAOYUAN INTERNATIONAL AIRPORT TERMINAL 3'
   and d.id <> (select x.id from crm_deals x
                 where x.quoc_gia='TW' and upper(x.ten)='TAOYUAN INTERNATIONAL AIRPORT TERMINAL 3'
                 order by (x.npp_dang_ky_id is not null) desc,
                          (coalesce(x.gia_tri_uoc,0)>0) desc,
                          (x.nguoi_phu_trach is not null or x.owner is not null) desc,
                          x.id limit 1)
   and not exists (select 1 from crm_touchpoints t where t.deal_id=d.id)
   and not exists (select 1 from crm_quotations q where q.deal_id=d.id)
   and not exists (select 1 from crm_approvals a where a.doi_tuong='deal' and a.doi_tuong_id::text=d.id::text);

-- B1) tro lai NPP da ky ten tuong dong
update crm_deals d set npp_dang_ky_id=k.id, npp_chi_dinh=k.ten
from crm_org o, crm_org k
where o.id=d.npp_dang_ky_id and coalesce(o.pheu_npp,'')<>'da_ky_hd'
  and k.pheu_npp='da_ky_hd'
  and upper(split_part(k.ten,' ',1))=upper(split_part(o.ten,' ',1))
  and coalesce(k.quoc_gia,'')=coalesce(o.quoc_gia,'');

-- B2) con lai: giu ten dang chu, bo lien ket cung
update crm_deals d set npp_chi_dinh=coalesce(d.npp_chi_dinh,o.ten), npp_dang_ky_id=null
from crm_org o
where o.id=d.npp_dang_ky_id and coalesce(o.pheu_npp,'')<>'da_ky_hd';

commit;

-- NGHIEM THU (ca 2 phai = 0):
select count(*) as con_tro_npp_chua_ky from crm_deals d join crm_org o on o.id=d.npp_dang_ky_id
 where coalesce(o.pheu_npp,'')<>'da_ky_hd';
select count(*)-count(distinct (upper(ten),quoc_gia)) as so_ban_trung from crm_deals;
