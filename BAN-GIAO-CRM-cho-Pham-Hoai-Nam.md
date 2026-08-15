# HỒ SƠ BÀN GIAO — STARDUCT CRM → PHẠM HOÀI NAM (tác giả NSCA Platform)

Bàn giao: 15/08/2026 · Người bàn giao: CEO Đào Huy Khánh · **Bản chốt: app V44.0 · migration v36→v53 (đã chạy hết) · nghiệm thu 20/22 ĐẠT (2 cảnh báo có chủ)**

## 0. ĐỌC GÌ TRƯỚC

1. File này (kiến trúc + ràng buộc + việc mở)
2. `STARDUCT-CRM-mo-hinh-nghiep-vu.md` — thiết kế nghiệp vụ gốc, mọi tính năng mới chiếu theo đây
3. `STARDUCT-CRM-trang-thai-he-thong.md` — trạng thái chốt + toàn bộ bài học kỹ thuật
4. `huong-dan.html` (song ngữ VI/EN, nút 📘 trên header app) + 2 bản Word HDSD — góc nhìn người dùng từng vai
5. `supabase-kiem-tra-suc-khoe.sql` — bộ nghiệm thu 22 hạng mục, chạy trước MỌI lần phát hành

## 1. TỔNG QUAN

- **App**: static HTML/JS thuần (không build tool), GitHub Pages, repo `github.com/dhk1805-creator/starduct-crm-app` (main). PWA + Service Worker; mobile `?m=1` (js/16-mobile.js). Song ngữ bằng từ điển FRAG ~1.100 cặp (js/00-i18n.js) — chuỗi UI mới PHẢI thêm cặp.
- **Database**: DÙNG CHUNG Supabase `zjedibydzkojgarrfbvg` với NSCA Platform của anh. CRM sở hữu các bảng mục 3; mọi bảng khác là của ERP.
- **CRM đã là module chính thức của platform**: `erp_modules` id=`crm_starduct` (route = URL đầy đủ). Việc còn của anh: thêm ngôi sao thứ 7 vào chòm Kinh Doanh trong frontend (chòm sao đang hardcode) + cho router mở tab mới khi route bắt đầu `https://`. Gỡ module khi cần: `update erp_modules set is_active=false where id='crm_starduct';`

## 2. KỶ LUẬT PHÁT HÀNH (BẮT BUỘC)

1. Phiên bản app số tròn (V44, V45…) — độc lập số migration SQL.
2. Đồng bộ **5 điểm** mỗi lần phát hành: `SD_VER` (js/18-version.js) · `CACHE`+`SHELL` (sw.js) · version.json · `APP_VER` (js/00-i18n.js) · `?v=` (index.html).
3. Mọi thay đổi dữ liệu = 1 file `supabase-migration-vNN-*.sql` trong repo, idempotent (chạy lại không hỏng).
4. Trước khi giao: chạy bộ nghiệm thu — toàn ĐẠT mới phát hành; CẢNH BÁO ghi vào việc mở.
5. Supabase SQL Editor: chỉ hiện kết quả CÂU CUỐI; không để `;`/xuống dòng trong string; text dài = base64 `convert_from(decode(...),'UTF8')` ≤100KB; date trong VALUES phải `::date`.

## 3. BẢNG THUỘC CRM (được sửa schema/dữ liệu)

`crm_org` (ma_code, pheu_npp, quan_he, vung) · `crm_deals` (+backup _vi_20260814) · `crm_du_an_nen` · `crm_touchpoints` · `crm_events` · `crm_revenue` · `crm_cong_no` · `crm_approvals` · `crm_comments` · `crm_support_requests` · `crm_plans/plan_items/plan_objectives` · `crm_quotations` (báo giá XK của CRM — KHÁC crm_quotes của ERP) · `crm_thi_truong` · `crm_user_roles` · `crm_bci` · `crm_du_an_cap_nhat` · views `v_crm_*`, `crm_v_*`.

Ràng buộc phải nhớ: `crm_approvals` CHECK kép trên **doi_tuong** (deal/org/plan/support/erp_dang_ky — đã nới NOT VALID) và **loai** (bản ghi máy sinh dùng 'khac'); doi_tuong_id **uuid**. `crm_revenue` unique (thang,org_id,ma_nganh,kenh) — dòng máy ghi dùng `ma_nganh='ERP_GH'`, thang date 'YYYY-MM-01'. `crm_cong_no` unique (ky,ma_code). `crm_org.phan_loai` NOT NULL. Môi trường có cơ chế tự bật RLS bảng mới → bảng CRM mới luôn kèm policy `select to authenticated` (vụ crm_cong_no/v50).

## 4. CẦU NỐI CRM ↔ ERP (4 mạch — phần anh quan tâm nhất)

Nguyên tắc: CRM đọc bảng ERP qua view; ghi sang ERP CHỈ qua 2 rpc security definer, đúng enum ERP.

- **View đọc** (v46, v50): `v_crm_erp_dang_ky` (crm_dang_ky_du_an) · `v_crm_erp_don_hang` (crm_orders) · `v_crm_erp_giao_hang` (wms_delivery_orders) · `v_crm_erp_dang_ky_moi` (crm_project_registrations). Cờ `da_co_trong_crm` = khớp tên CHỨA NHAU ≥6 ký tự với crm_deals.
- **rpc `crm_erp_dong_bo()`** (bản chốt v52, gọi mỗi lần mở dashboard, idempotent):
  1. crm_orders có `ycsx_code` khớp tên deal đang mở → stage `po`.
  2. Đăng ký chưa duyệt từ CẢ 2 kho (crm_dang_ky_du_an: duyet_dang_ky trống/cho_duyet · crm_project_registrations: status cho_duyet) → crm_approvals (doi_tuong='erp_dang_ky', marker `[ERP#uuid]` trong noi_dung).
  3. wms_delivery_orders có `delivered_at ≥ 2026-07-01` (mốc chống đếm đôi với báo cáo H1) → crm_revenue ma_nganh='ERP_GH', xóa-ghi lại theo created_by='erp-giao-hang'; khớp org theo npp_name/customer_name = ten hoặc ma_code; lọc %TEST%.
  4. Đăng ký ĐÃ DUYỆT (cả 2 kho, gồm trien_khai/thang_thau) mà CRM chưa có → tự tạo crm_deals (lọc demo/TEST/Ví Dụ; giá trị chỉ nhận 1tr–500 tỷ). Đã sinh dự án đầu: Tiến Bộ Plaza.
- **rpc `crm_erp_duyet_dang_ky(p_marker, p_tt)`** (v49): duyệt/từ chối tại CRM → ghi `duyet_dang_ky` (kho BO) VÀ `status`+reviewed_by/reviewed_at (kho Kanban). Gọi từ `duyetNhanh()` trong js/08-tong-quan.js.
- **v51**: 26 đăng ký BO đã chuyển vào Kanban (`status='can_bo_sung'`, scale_desc ghi "Chuyển từ BO 15/08/2026"); nguồn cũ đánh dấu `duyet_dang_ky='chuyen_kanban'`. Luồng chuẩn: BO xác nhận thẻ → cho_duyet → hàng chờ CRM → duyệt → ghi ngược + tự tạo dự án.
- Gợi ý nâng cấp cho anh: ERP có sẵn `erp_module_capabilities` (trigger INSERT/UPDATE trên crm_orders…) — chuyển từ đồng bộ khi-mở-dashboard sang bắn sự kiện tức thời.

## 5. BÀI HỌC "XƯƠNG MÁU" KHI GHI VÀO BẢNG CỦA ANH (đêm 15/08)

Chuỗi lỗi thật khi chèn vào `crm_project_registrations`: NOT NULL hàng loạt (investor, site_address, design_unit, supervision_unit, products_of_interest, scale_desc) · CHECK trên `source` · `submitted_by` uuid · `gia_tri_nganh` bên BO là **JSONB** (ép số phải chặn ngưỡng 1tr–500 tỷ, tránh 3,58 triệu tỷ). Hàm `_v51` trong migration v51 là mẫu xử lý tổng quát: **tự quét NOT NULL từ information_schema + tự đọc CHECK từ pg_constraint** để chọn giá trị hợp lệ. Từ nay hai chiều: CRM ghi bảng ERP hay ERP ghi bảng CRM — đọc catalog trước, đừng dò bằng tay.

## 6. MÃ NPP — KHÓA NỐI HAI HỆ THỐNG

QT: ECA(TNR-KH) · EID(Sinabu-ID) · EMC(MeyFoong-MO) · EPH(AireFocus+Greentech-PH) · ETL(WindControl-TH) · EUY(Vitrilan-UY) · EAL(Plasticade-US) · EQC(QC-US). ND: NTK · GLX · VNMEP · IMP · MEPCO. Kênh tổng hợp: TT, XK. Ứng viên (không phải NPP ký HĐ): CAREZONE (đang đàm phán) · BKG (đang kết nối). Đề nghị crm_npp của ERP dùng cùng bộ mã để join thay khớp tên. Kỷ luật đi kèm: mã dự án duy nhất (dữ liệu BO trùng D0258 hàng loạt — nút thắt số 1 của tự động hóa), email `[Mã DA][Mã NPP] Loại việc`.

## 7. PHÂN QUYỀN & TÀI KHOẢN CHA–CON NPP

`crm_user_roles`: quyen_phe_duyet = Khánh, Đ.N.Ngọc, T.Tâm, T.Hồng (4) · quyen_tiep_nhan = Nam, Duẩn, V.Ngọc (3) · còn lại tầng báo cáo "của ai nấy thấy" (đang enforce ở tầng app — laStaffXem, js/01-core.js).

**Việc lớn nhất còn lại: RLS cứng tầng database theo 3 tầng + `npp_org_id`** — điều kiện BẮT BUỘC trước khi phát tài khoản NPP. Mô hình đã thiết kế (chi tiết trong HUONG-DAN-CRM-ADMIN-BO-PHAN.md mục 3): tài khoản CHA (npp_lead — thấy toàn bộ NPP mình, phân công cho con) + CON (npp_sale — chỉ dự án được giao); 7 bước mở; khóa-không-xóa; lộ trình GALAXYTECH (Ms Hoa) → 5 ND → 9 QT.

## 8. DỮ LIỆU ĐÃ NẠP & NGUỒN GỐC (không nạp trùng)

489 DA QT "cần tiếp cận" EN (v36; không bằng chứng = "Chờ phân công", v44) · 197 báo giá XK/394,4 tỷ/13 YCSX (v41, khu_vuc='quoc_te') · 120 DA đã chào hàng gộp từ báo giá (v42) · DT H1/2026 = 89,1 tỷ: created_by='bao-cao-H1-2026' (ND theo NPP theo tháng) + 'phan-bo-bc-santiago-h1' (XK: Santiago 886tr tách 5 thị trường + truyền thống 14,98 tỷ — chi tiết tháng×thị trường là PHÂN BỔ ƯỚC, CEO duyệt) · công nợ H1 7 kênh/34,6 tỷ (crm_cong_no) · pipeline H2 ND 33 DA ~77,7 tỷ (v40) · thị trường 16 nước (crm_thi_truong, v37) · vùng DA ND gán theo địa danh (v42, còn 46 thiếu).

## 9. VIỆC MỞ (ưu tiên từ trên xuống)

1. **RLS cứng 3 tầng + npp_org_id** → mở tài khoản Cha–Con NPP (thí điểm GALAXYTECH)
2. Ngôi sao CRM trong chòm Kinh Doanh (1 dòng frontend) + route https:// mở tab mới
3. BO xác nhận 26 thẻ Kanban (nhiều thẻ giá trị ước cần chỉnh — có SQL đưa >30 tỷ về 0 nếu muốn sạch trước)
4. Kỷ luật mã DA duy nhất → nâng khớp đơn/BG theo mã; cân nhắc trigger erp_module_capabilities thay polling
5. 46 DA ND chưa vùng · 749 DA chưa nối mã kho nền · phân công DA "Chờ phân công"
6. Nhãn 'ERP_GH' trong NGANH (js/06) · cảnh báo giao hàng không khớp org · card KPI Santiago (mốc 31/12/2026) · DT ND tách ngành khi có BO chi tiết · DT PH tách Dico/Greentech
7. Dọn: ~24 file CRLF working tree (Discard trong GitHub Desktop) · rác zz-rac-* trong .git (xóa tay Windows — sinh ra do git trong mount không xóa được lock)
8. Kiểm tra phân quyền nút "Gắn Module Mới" của platform (CEO Super Admin bị chặn — nghi gate nhầm ở erp_role_permissions)

## 10. GHI CHÚ CHO TRỢ LÝ AI

Toàn bộ lịch sử + bài học chi tiết lưu tại Claude Project "CRM Project". Sổ Tay Kỹ Thuật ERP có MCP endpoint (sotay-mcp) — thêm vào Connectors để AI đọc đặc tả ERP trước khi viết SQL; LINK CHỨA KEY (?k=...) — không chia sẻ công khai, không commit.
