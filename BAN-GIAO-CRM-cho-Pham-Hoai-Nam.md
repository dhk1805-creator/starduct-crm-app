# HỒ SƠ BÀN GIAO — STARDUCT CRM → PHẠM HOÀI NAM (tác giả NSCA Platform)

Ngày bàn giao: 15/08/2026 · Người bàn giao: CEO Đào Huy Khánh · Phiên bản: **V42.0** · Migration: đến **v51**

## 1. Tổng quan hệ thống

- **App**: static HTML/JS (không build tool), GitHub Pages — repo `github.com/dhk1805-creator/starduct-crm-app` (main). PWA + Service Worker. Mobile = `?m=1` (16-mobile.js).
- **Database**: DÙNG CHUNG Supabase `zjedibydzkojgarrfbvg` với NSCA Platform. CRM chỉ sở hữu các bảng tiền tố `crm_` liệt kê ở mục 3 — mọi bảng khác là của ERP.
- **Tài liệu nghiệp vụ gốc**: `STARDUCT-CRM-mo-hinh-nghiep-vu.md` (trong repo). Mọi tính năng mới chiếu theo dòng chảy: Kho nền → Theo dõi → Tiếp cận → Chỉ định → Báo giá → Đơn (YCSX) → Doanh thu → Công nợ.
- **Nghiệm thu**: `supabase-kiem-tra-suc-khoe.sql` — 22 hạng mục ĐẠT/KHÔNG ĐẠT/CẢNH BÁO, chạy read-only bất kỳ lúc nào. **Quy tắc: trước mỗi lần phát hành phải chạy, toàn ĐẠT mới giao.**

## 2. Kỷ luật phát hành (BẮT BUỘC theo)

1. Phiên bản app số tròn (V42, V43…) — độc lập với số migration SQL.
2. Mỗi lần phát hành đồng bộ **5 điểm**: `SD_VER` (js/18-version.js) · `CACHE`+`SHELL` (sw.js) · version.json · `APP_VER` (js/00-i18n.js) · `?v=` trong index.html.
3. Mọi thay đổi dữ liệu = 1 file SQL đánh số `supabase-migration-vNN-*.sql`, commit vào repo, **an toàn chạy lại** (idempotent).
4. Song ngữ VI/EN: từ điển FRAG trong 00-i18n.js (~1.100 cặp), dịch một lượt regex dài-trước-ngắn + chặn biên từ + guard 2 chiều. Chuỗi UI mới phải thêm cặp FRAG.
5. Supabase SQL Editor: chỉ hiện kết quả CÂU CUỐI; không để dấu `;` hay xuống dòng trong string literal; text dài nạp bằng base64 `convert_from(decode(...,'base64'),'UTF8')` (file ≤100KB).

## 3. Bảng thuộc CRM (được phép sửa schema/dữ liệu)

`crm_org` (ma_code, pheu_npp, quan_he, vung…) · `crm_deals` (+backup crm_deals_backup_vi_20260814) · `crm_du_an_nen` · `crm_touchpoints` · `crm_events` · `crm_revenue` · `crm_cong_no` · `crm_approvals` · `crm_comments` · `crm_support_requests` · `crm_plans/plan_items/plan_objectives` · `crm_quotations` (bảng báo giá XK của CRM — KHÁC crm_quotes của ERP) · `crm_thi_truong` · `crm_user_roles` · `crm_bci` · `crm_du_an_cap_nhat` · views `v_crm_*`, `crm_v_*`.

Ràng buộc đáng nhớ: `crm_approvals` có CHECK trên **doi_tuong** (deal/org/plan/support/erp_dang_ky — đã nới NOT VALID) và **loai** (dùng 'khac' cho bản ghi máy sinh); doi_tuong_id là **uuid**. `crm_revenue` unique (thang,org_id,ma_nganh,kenh) — dòng máy ghi dùng `ma_nganh='ERP_GH'`, thang là date 'YYYY-MM-01'. `crm_cong_no` unique (ky,ma_code). `crm_org.phan_loai` NOT NULL.

## 4. CẦU NỐI CRM ↔ ERP (phần Nam quan tâm nhất)

Nguyên tắc: **CRM chỉ đọc bảng ERP qua view**; ngoại lệ ghi duy nhất là rpc duyệt đăng ký (bên dưới).

- **View đọc** (v46, v50): `v_crm_erp_dang_ky` (crm_dang_ky_du_an) · `v_crm_erp_don_hang` (crm_orders) · `v_crm_erp_giao_hang` (wms_delivery_orders) · `v_crm_erp_dang_ky_moi` (crm_project_registrations). Cờ `da_co_trong_crm` = khớp tên CHỨA NHAU (≥6 ký tự) với crm_deals. Owner postgres → vượt RLS bảng gốc; grant select to authenticated.
- **rpc `crm_erp_dong_bo()`** (v47→v49, security definer, gọi mỗi lần mở dashboard, idempotent):
  - Mạch 1: crm_orders có `ycsx_code` khớp tên deal đang mở → deal sang stage `po`.
  - Mạch 2: đăng ký chưa duyệt từ CẢ 2 kho (crm_dang_ky_du_an: duyet_dang_ky trống/cho_duyet · crm_project_registrations: status='cho_duyet') → chèn crm_approvals (doi_tuong='erp_dang_ky', loai='khac', marker `[ERP#<uuid>]` trong noi_dung để truy ngược).
  - Mạch 3: wms_delivery_orders có `delivered_at ≥ 2026-07-01` → gộp theo (tháng, org) ghi crm_revenue `ma_nganh='ERP_GH'`, created_by='erp-giao-hang', kiểu XÓA-GHI LẠI toàn bộ mỗi lần chạy (idempotent). Mốc 01/07 vì doanh thu đến 30/06 đã nạp từ báo cáo H1 (tránh đếm đôi). Khớp org theo npp_name/customer_name = crm_org.ten hoặc ma_code — đơn không khớp bị bỏ qua lặng lẽ (việc mở: cảnh báo).
- **rpc `crm_erp_duyet_dang_ky(p_marker, p_tt)`** (v48→v49): CRM duyệt/từ chối → ghi ngược `crm_dang_ky_du_an.duyet_dang_ky` = da_duyet/tu_choi VÀ `crm_project_registrations.status` (+reviewed_by='CRM Starduct', reviewed_at, stage_updated_at). Gọi từ `duyetNhanh()` trong js/08-tong-quan.js.
- **v51 (chuyển kho)**: 26 đăng ký BO đã chuyển vào crm_project_registrations với `status='can_bo_sung'` (chờ BO xác nhận, source='chuyen-tu-BO-15/08/2026'); bản gốc đánh dấu `duyet_dang_ky='chuyen_kanban'` để không vào hàng chờ nữa. **Luồng chuẩn từ giờ: BO xác nhận trên Kanban → cho_duyet → hàng chờ CRM → CEO duyệt → ghi ngược.**
- Lưu ý môi trường: có cơ chế (nghi là housekeeping của ERP) tự bật RLS trên bảng mới → bảng CRM tạo mới phải kèm policy `select to authenticated` (vụ crm_cong_no, v50).

## 5. Mã code NPP (khóa nối 2 hệ thống)

QT: ECA(TNR-KH) · EID(Sinabu-ID) · EMC(MeyFoong-MO) · EPH(AireFocus+Greentech-PH) · ETL(WindControl-TH) · EUY(Vitrilan-UY) · EAL(Plasticade-US) · EQC(QC-US). ND: NTK · GLX · VNMEP · IMP · MEPCO. Kênh tổng hợp: TT (trực tiếp), XK. Ứng viên: CAREZONE (đang đàm phán), BKG (đang kết nối). Đề nghị ERP dùng cùng bộ mã này trong crm_npp để join thay vì khớp tên.

## 6. Phân quyền

`crm_user_roles`: quyen_phe_duyet = Đào Huy Khánh, Đào Nguyên Ngọc, Nguyễn Thị Thanh Tâm, Nguyễn Thị Thúy Hồng (4). quyen_tiep_nhan = Phạm Hoài Nam, Nguyễn Tiến Duẩn, Nguyễn Văn Ngọc (3). Còn lại (Santiago, Hải, Đức, NPP) = báo cáo, "của ai nấy thấy" (laStaffXem trong 01-core.js). RLS cứng theo 3 tầng ở mức database: CHƯA làm — đang enforce ở tầng app (việc mở ưu tiên cao khi mở tài khoản cho NPP).

## 7. Dữ liệu đã nạp & nguồn gốc (để không nạp trùng)

- 489 DA QT "cần tiếp cận" (EN, v36) — không bằng chứng hoạt động thì owner trống = "Chờ phân công" (v44)
- 197 báo giá XK / 394,4 tỷ / 13 YCSX (v41, khu_vuc='quoc_te') · 120 DA đã chào hàng gộp từ báo giá (v42, YCSX→po)
- Doanh thu H1/2026 = 89,1 tỷ: created_by='bao-cao-H1-2026' (ND theo NPP theo tháng) + 'phan-bo-bc-santiago-h1' (XK tách 5 thị trường + khối truyền thống; chi tiết tháng×thị trường là PHÂN BỔ ƯỚC theo tỷ trọng tháng — CEO đã duyệt cách này)
- Công nợ H1 7 kênh / 34,6 tỷ (crm_cong_no, ky='H1-2026') · Pipeline H2 ND 33 dự án ~77,7 tỷ (v40) · Thị trường/tình báo 16 nước (crm_thi_truong, v37)

## 8. Việc còn mở (ưu tiên từ trên xuống)

1. BO xác nhận 26 thẻ "Cần bổ sung" trên Kanban (luồng mới bắt đầu chạy)
2. Kỷ luật MÃ DỰ ÁN duy nhất (dữ liệu BO trùng D0258 hàng loạt) — điều kiện để đơn hàng/báo giá khớp tự động theo mã thay vì theo tên
3. RLS cứng 3 tầng + npp_org_id; tài khoản email 11 nhân sự + NPP (GALAXYTECH Lead: Ms Hoa)
4. 46 DA VN chưa gán vùng · 750 DA chưa nối mã kho nền · phân công các DA "Chờ phân công"
5. Cảnh báo giao hàng không khớp org; nhãn ngành 'ERP_GH' trong tab Doanh thu (NGANH dict, js/06)
6. Card KPI hợp đồng Santiago (mốc Phụ lục III 31/12/2026 — hiện 11,4% mục tiêu, VAV Box 4,2%)
7. Hợp nhất crm_quotations (CRM) với module Báo giá ERP khi BO chuyển hẳn sang ERP
8. Dọn: ~24 file CRLF working tree (Discard) · rác zz-rac-* trong .git (xóa tay trên Windows — git trong môi trường mount không xóa được file)

## 9. Ghi chú vận hành cho AI assistant

Sổ tay kỹ thuật ERP đã có MCP endpoint (sotay-mcp) — thêm vào Connectors của trợ lý AI để tra cứu trực tiếp. LƯU Ý: đường link chứa khóa truy cập (`?k=...`) — không chia sẻ công khai, không commit vào repo. Toàn bộ lịch sử xây CRM + bài học kỹ thuật chi tiết lưu tại Claude Project "CRM Project" (doc `starduct-crm-trang-thai-he-thong.md` + `mo-hinh-nghiep-vu-crm.md`).
