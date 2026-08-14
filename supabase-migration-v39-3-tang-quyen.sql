-- ============================================================
-- MIGRATION v39: MO HINH 3 TANG QUYEN (app v35.9)
-- T1 quyen_phe_duyet=true : phe duyet de xuat + y kien
--    (Dao Huy Khanh, Dao Nguyen Ngoc, Nguyen Thi Thanh Tam, Nguyen Thi Thuy Hong)
-- T2 quyen_tiep_nhan=true : Chap nhan/Tu choi yeu cau ho tro + bo sung y kien
--    (Pham Hoai Nam, Nguyen Tien Duan, Nguyen Van Ngoc)
-- T3 con lai (Santiago, Hai, Duc, NPP...): bao cao, nhap KQ, gui de xuat,
--    request, nhan & tra loi phan hoi. An toan chay lai.
-- ============================================================
begin;
alter table crm_user_roles add column if not exists quyen_phe_duyet boolean default false;
alter table crm_user_roles add column if not exists quyen_tiep_nhan boolean default false;

-- reset roi gan lai theo danh sach CEO chot 15/08
update crm_user_roles set quyen_phe_duyet=false, quyen_tiep_nhan=false;

update crm_user_roles set quyen_phe_duyet=true
 where ho_ten ilike '%Đào Huy Khánh%' or ho_ten ilike '%Đào Nguyên Ngọc%'
    or ho_ten ilike '%Nguyễn Thị Thanh Tâm%' or ho_ten ilike '%Nguyễn Thị Thúy Hồng%';

update crm_user_roles set quyen_tiep_nhan=true
 where ho_ten ilike '%Phạm Hoài Nam%' or ho_ten ilike '%Nguyễn Tiến Duẩn%'
    or ho_ten ilike '%Nguyễn Văn Ngọc%';
commit;

-- NGHIEM THU: 4 dong phe duyet + 3 dong tiep nhan
select ho_ten, vai_tro, quyen_phe_duyet, quyen_tiep_nhan from crm_user_roles
where quyen_phe_duyet or quyen_tiep_nhan order by quyen_phe_duyet desc, ho_ten;
