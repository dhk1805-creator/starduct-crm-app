-- ============================================================
-- MIGRATION v37b: Tach QT/ND cho kho du an nen (crm_du_an_nen)
-- Danh dau khu_vuc cho du lieu nen: dong cu (tu file CAP NHAT DA
-- THEO NPP - toan noi dia) chua co khu_vuc -> gan 'noi_dia'.
-- App v35.4 loc kho nen theo khu_vuc: trang Quoc te chi hien 'quoc_te'.
-- An toan chay lai.
-- ============================================================
begin;
alter table crm_du_an_nen add column if not exists khu_vuc text;
update crm_du_an_nen set khu_vuc='noi_dia' where khu_vuc is null;
commit;
select khu_vuc, count(*) from crm_du_an_nen group by khu_vuc;
