# STARDUCT CRM — TRẠNG THÁI HỆ THỐNG (V43.0 · 15/08/2026 — bản chốt bàn giao)

App: https://dhk1805-creator.github.io/starduct-crm-app/ · Mobile: `?m=1`
Repo: github.com/dhk1805-creator/starduct-crm-app (main) · DB: Supabase `zjedibydzkojgarrfbvg` — CHUNG với ERP NSCA (erp-nsca.pages.dev)
Đọc kèm: `BAN-GIAO-CRM-cho-Pham-Hoai-Nam.md` (bàn giao kỹ thuật) · `STARDUCT-CRM-mo-hinh-nghiep-vu.md` (thiết kế nghiệp vụ gốc) · `supabase-kiem-tra-suc-khoe.sql` (nghiệm thu 22 hạng mục — chạy trước mỗi lần phát hành).

## KẾT QUẢ NGHIỆM THU CHỐT (CEO chạy 15/08)
**20/22 ĐẠT · 0 KHÔNG ĐẠT** · 2 CẢNH BÁO tồn có chủ: #43 (46 DA nội địa chưa gán vùng) · #44 (749 DA chưa nối mã kho nền). Số lõi: 9 NPP QT + 5 ND đủ mã code · 197 báo giá QT/394,4 tỷ/13 YCSX · doanh thu H1 89,1 tỷ (Santiago 886tr/5 thị trường) · công nợ 7 kênh/34,6 tỷ · 120 DA chào hàng gắn NPP · quyền 4 phê duyệt + 3 tiếp nhận · không trùng lặp, không mồ côi, không rò dữ liệu ND↔QT.

## HỆ THỐNG ĐANG CHẠY (app V43.0, migration v36→v52 đã chạy hết)
- Dashboard = trang báo cáo: mặc định Tổng quan toàn bộ; chọn kỳ (Tháng/Quý/Năm/lịch) mọi chỉ số theo kỳ; trang Quốc tế chọn từng quốc gia. Phễu khai thác quy từ kho nền (3.617 → theo dõi → tiếp cận → chỉ định → thắng). Card Công nợ NPP theo kỳ. Card Nghiệp vụ từ ERP. Mã NPP trong mọi dropdown. DA không bằng chứng hoạt động = "⏳ Chờ phân công".
- Mobile: nhập theo kế hoạch ngày, 3 form gắn dự án bắt buộc, vòng duyệt 2 chiều với desktop.
- **Cầu ERP↔CRM khép kín 4 mạch** (rpc `crm_erp_dong_bo()` chạy mỗi lần mở dashboard + `crm_erp_duyet_dang_ky()` khi duyệt):
  1. Đơn ERP có YCSX khớp tên deal → tự chuyển PO
  2. Đăng ký chưa duyệt (2 kho: crm_dang_ky_du_an + crm_project_registrations) → hàng chờ phê duyệt CRM; duyệt/từ chối ghi ngược ERP đúng enum từng kho
  3. Giao hàng delivered_at ≥ 01/07/2026 → doanh thu (ma_nganh='ERP_GH', xóa-ghi lại idempotent; mốc 01/07 tránh đếm đôi với báo cáo H1)
  4. Đăng ký ĐÃ DUYỆT mà CRM chưa có → tự tạo dự án (lọc demo/TEST/Ví Dụ; giá trị ước chỉ nhận 1tr–500 tỷ) — đã sinh dự án đầu tiên: Tiến Bộ Plaza
- 26 đăng ký thật của BO đã chuyển lên Kanban ERP (crm-npp-projects) nấc "Cần bổ sung" — BO xác nhận từng thẻ (điền các ô "(chưa rõ)", chỉnh giá trị ước) rồi kéo sang Chờ duyệt → tự vào hàng chờ CRM.
- CAREZONE (đang đàm phán) · BKG (đang kết nối) = ứng viên NPP, không nằm trong danh sách ký HĐ.

## LUỒNG NGHIỆP VỤ SỐNG (một vòng duy nhất)
NPP đăng ký trên ERP → BO xác nhận (Kanban) → CEO/ban duyệt một nút trên CRM → dự án tự vào CRM đúng NPP đúng phễu → báo giá/YCSX → PO → giao hàng → doanh thu → công nợ. Không nhập tay lại, không số nào vào hệ thống mà chưa qua người có quyền.

## VIỆC MỞ (ưu tiên từ trên xuống — cho Nam)
1. BO xác nhận 26 thẻ Kanban · theo dõi mạch 4 sinh dự án khi duyệt
2. Kỷ luật MÃ DỰ ÁN duy nhất (dữ liệu BO trùng D0258 hàng loạt) → nâng khớp đơn hàng/báo giá theo mã thay vì tên
3. RLS cứng theo 3 tầng quyền + npp_org_id · mở tài khoản email 11 nhân sự + NPP (GALAXYTECH: Ms Hoa)
4. 46 DA nội địa chưa gán vùng · 749 DA chưa nối mã kho nền · phân công các DA "Chờ phân công"
5. Cảnh báo giao hàng không khớp org · nhãn ngành 'ERP_GH' trong tab Doanh thu (NGANH dict, js/06)
6. Card KPI hợp đồng Santiago (886tr = 11,4% mục tiêu 300k USD · VAV Box 4,2% · mốc Phụ lục III 31/12/2026)
7. DT H1 nội địa đang ma_nganh='KHAC' (tách ngành cần BO chi tiết) · DT Philippines tách Dico/Greentech khi có số
8. Dọn: ~24 file CRLF working tree (Discard) · rác zz-rac-* trong .git (xóa tay trên Windows)

## BÀI HỌC KỸ THUẬT (đọc trước khi sửa bất cứ gì)
- Phát hành đồng bộ 5 điểm: SD_VER (js/18) · CACHE+SHELL (sw.js) · version.json · APP_VER (js/00) · ?v= (index.html). App số tròn, độc lập số migration.
- Supabase SQL Editor: chỉ hiện kết quả CÂU CUỐI; không để `;` hay xuống dòng trong string; text dài = base64 `convert_from(decode(...),'UTF8')` ≤100KB; date trong VALUES phải `::date`.
- Ghi vào bảng hệ khác: ĐỌC SCHEMA TRƯỚC (information_schema + pg_constraint) — crm_project_registrations có hàng loạt NOT NULL + CHECK trên source; crm_approvals có CHECK kép (doi_tuong + loai), doi_tuong_id uuid; gia_tri_nganh của BO là JSONB (chặn ngưỡng 1tr–500 tỷ khi ép số); submitted_by là uuid. Hàm v51 mẫu: tự quét NOT NULL + tự đọc constraint để chọn giá trị hợp lệ.
- Môi trường có cơ chế tự bật RLS trên bảng mới → bảng CRM mới phải kèm policy `select to authenticated` (vụ crm_cong_no).
- crm_revenue unique (thang,org_id,ma_nganh,kenh) → dòng máy ghi dùng ma_nganh riêng; đồng bộ máy = xóa-ghi lại theo created_by (idempotent). crm_cong_no unique (ky,ma_code).
- JS: `let sb` không có window.sb — dùng bare + typeof guard; ngày dùng hàm _d10 (giờ địa phương), KHÔNG toISOString (lệch múi giờ); khớp tên 2 hệ = chứa nhau ≥6 ký tự; giá trị từ BO có thể là chữ/json — ép số an toàn tránh NaN/[object Object].
- Nhập dữ liệu hàng loạt: KHÔNG gán mặc định owner/stage (để "Chờ phân công"); xóa bản trùng chỉ khi không có dữ liệu con; mọi đợt nhập phải đối chiếu dữ liệu đang có trước khi ghi.
- Song ngữ: từ điển FRAG (js/00-i18n.js, ~1.100 cặp) — chuỗi UI mới phải thêm cặp; dịch một lượt, chặn biên từ, guard 2 chiều.
- Git trong thư mục mount: mv các file .git/*.lock thành zz-rac-* trước mỗi lệnh; commit local → CEO push bằng GitHub Desktop.

## PHÂN QUYỀN & TÀI KHOẢN
crm_user_roles: quyen_phe_duyet = Đào Huy Khánh, Đào Nguyên Ngọc, Nguyễn Thị Thanh Tâm, Nguyễn Thị Thúy Hồng · quyen_tiep_nhan = Phạm Hoài Nam, Nguyễn Tiến Duẩn, Nguyễn Văn Ngọc · còn lại báo cáo "của ai nấy thấy". CEO: dhk@nsca.vn (nội bộ: khanh).

## LỊCH SỬ MIGRATION (tất cả trong repo, đã chạy hết)
v36 dịch dữ liệu QT sang EN · v37(+B64) thị trường/tình báo + báo giá · v37b khu_vuc kho nền · v38+v38b 9 NPP QT khử trùng · v39 3 tầng quyền · v40 doanh thu H1 + pipeline H2 + mã NPP · v41 khu_vuc báo giá + 13 YCSX · v42 120 DA chào hàng + công nợ + vùng · v43 tách DT XK theo thị trường · v44 Chờ phân công · v45 dọn trùng · v46 view cầu ERP · v47 YCSX→PO · v48 đăng ký→hàng chờ + duyệt ghi ngược · v49 phủ 2 kho đăng ký · v50 RLS công nợ + khớp chứa nhau · v51 ứng viên NPP + chuyển 26 đăng ký lên Kanban · v52 duyệt→tự tạo dự án.
