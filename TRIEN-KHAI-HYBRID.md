# TRIỂN KHAI v22 — HYBRID WEB-APP (PRD crm.starduct.online)

Bản v22 bổ sung phương án trong tài liệu "Hybrid Webapp CRM" (PRD) lên nền code v21.
Nguyên tắc: **không sửa logic cũ** — toàn bộ tính năng mới nằm trong `js/12-hybrid.js`
(nạp cuối cùng, ghi đè có kiểm soát) + migration SQL riêng.

## Soát PRD — cái gì ĐÃ CÓ từ trước (không làm lại)

Quy tắc nâng phủ ≥2 đòi cấp ra quyết định (Coverage Rule) đã chạy trong form Tiếp xúc.
Batch import file CẬP NHẬT DA THEO NPP + LIST BG → `crm_quotations` đã có ở tab Dự án nền.
Hệ phê duyệt phân cấp Manager/CEO/CFO kèm bắt buộc lý do khi bác (quy tắc L4) đã có.
Yêu cầu hỗ trợ liên phòng ban BO/R&D/QLSX/KCS kèm hạn SLA và bảng điểm nghẽn đã có.
Bộ lọc theo NPP, quốc gia, stage trên tab Dự án đã có.

## Cái gì MỚI trong v22

1. **PWA**: `manifest.webmanifest` + `sw.js` + icon → cài shortcut ra màn hình chính
   điện thoại/máy tính; vỏ app mở được khi mất mạng ngoài công trường.
2. **Mobile hiện trường** (≤767px): thanh 3 nút cố định đáy màn hình — *Việc hôm nay*,
   *Tiếp xúc nhanh*, *Hỗ trợ* — đúng 3 tác nghiệp chính trong PRD; nav cuộn ngang.
3. **Luồng phê duyệt dự án 5 trạng thái** (`cho_tiep_nhan → da_tiep_nhan → duoc_chi_dinh
   → phe_duyet / khong_phe_duyet`): chọn trong hộp thoại Sửa dự án (chỉ Quản lý/CEO đổi
   được), bác bắt buộc ghi `ly_do_tu_choi`, duyệt bắt buộc đã có **minh chứng**.
4. **Minh chứng Spec-in / ảnh hiện trạng**: upload thẳng lên Supabase Storage
   (bucket `minh-chung`), lưu link vào `file_minh_chung_url`, xem lại trong Workspace.
5. **Khóa độc quyền & chống dẫm chân**: dự án đã `phe_duyet` thì khóa NPP — cảnh báo đỏ
   trên UI và **trigger chặn ở DB** (chỉ manager/ceo nhượng quyền được).
6. **Loss Reason bắt buộc**: chuyển stage sang Đóng là bật popup chọn nguyên nhân
   (giá, spec, tiến độ, CĐT dừng, đối thủ…) — có trigger DB chặn nếu thiếu.
7. **Cảnh báo dự án đứng yên >21 ngày**: tô đỏ dòng trong tab Dự án + checkbox lọc riêng
   + card 🛑 trên Tổng quan + view `v_crm_deals_dung_yen` để truy vấn.
8. **Deal Workspace** (Project-Centric): nút 🗂 trong hộp thoại dự án mở không gian 5 tab
   — Tổng quan · Tiếp xúc (timeline theo dự án) · Báo giá (tự khớp LIST BG ≥75% tên)
   · Hỗ trợ · Minh chứng.
9. **Tiếp xúc gắn dự án**: ô "Dự án liên quan" trong form Tiếp xúc → ghi `deal_id`
   vào `crm_touchpoints`, nuôi timeline Workspace.
10. **Bộ lọc mới tab Dự án**: theo trạng thái phê duyệt + theo người phụ trách
    (đến từng nhân viên NPP) + lọc đứng yên.
11. **Phân quyền nội bộ NPP**: `crm_user_roles` thêm `npp_org_id`; vai trò `npp_lead`
    (thấy toàn bộ dự án NPP mình) / `npp_staff` (chỉ thấy dự án mình phụ trách) —
    hiện lọc phía client, cưỡng chế cứng bằng RLS ở giai đoạn 2 (xem Lưu ý).

## Trình tự triển khai (3 bước)

**Bước 1 — Chạy migration:** Supabase Dashboard → SQL Editor → dán toàn bộ
`supabase-migration-v22.sql` → Run. Chạy lại nhiều lần không sao (idempotent).
Chưa chạy migration thì app v22 vẫn hoạt động như v21 (tự ẩn tính năng mới khi thiếu cột).

**Bước 2 — Đẩy code:** push repo lên GitHub như thường lệ. File mới:
`js/12-hybrid.js`, `manifest.webmanifest`, `sw.js`, `icons/`, cùng `index.html`,
`css/app.css` đã cập nhật.

**Bước 3 — Domain crm.starduct.online:** PWA đòi hỏi HTTPS. Cách nhanh nhất:
GitHub Pages (Settings → Pages → deploy from branch `main`) rồi trong DNS của
starduct.online thêm CNAME `crm` → `dhk1805-creator.github.io`, và điền custom domain
trong GitHub Pages (tự cấp SSL). Service worker chỉ kích hoạt trên HTTPS.

## Phân vai trò NPP (làm bằng tay sau migration)

Trong bảng `crm_user_roles`: đặt `vai_tro = 'npp_lead'` hoặc `'npp_staff'` và
`npp_org_id` = id của NPP trong `crm_org` cho từng tài khoản nhân sự NPP.
NPP Staff chỉ thấy dự án có `owner`/`nguoi_phu_trach` là mình; NPP Lead thấy mọi
dự án gắn `npp_dang_ky_id` của NPP mình.

## Lưu ý bảo mật (giai đoạn 2 nên làm)

App đang đăng nhập bằng RPC `crm_login` trên anon key, nên phân quyền NPP ở client
là "soft" — đủ chống nhầm lẫn, chưa chống cố tình. Muốn cưỡng chế cứng theo PRD cần
chuyển tài khoản NPP sang Supabase Auth thật + RLS theo `npp_org_id`. Trigger DB
(khóa độc quyền, bắt buộc lý do) thì đã cưỡng chế cứng ngay từ v22.

## v23 — Hợp nhất tab Dự án ↔ Dự án nền (bổ sung 14/08)

Tab "Dự án nền" đã được gộp vào tab **Dự án** thành một nguồn CSDL duy nhất, với
3 chế độ xem: **🎯 Đang theo dõi** (pipeline crm_deals — có phê duyệt, stage, giá trị,
dùng để lập kế hoạch/theo dõi/đánh giá), **🗺 Nền — chưa theo dõi** (danh mục
crm_du_an_nen đã TRỪ các dự án đã vào pipeline — khử trùng lặp hiển thị; mỗi dòng
có nút 📌 Theo dõi để chuyển vào pipeline kèm liên kết `ma_du_an_nen`, không nhập
tay lại), và **🧹 Trùng lặp nền** (chỉ Quản lý/CEO — quét cặp bản ghi tên giống ≥85%
cùng tỉnh giữa dữ liệu tình báo và dữ liệu có sẵn, bấm Gộp để hợp nhất: chuyển
nhật ký + BCI + liên kết pipeline về bản giữ rồi xóa bản thừa).

Chạy `supabase-migration-v23.sql` (sau v22) để kích hoạt: cột liên kết
`crm_deals.ma_du_an_nen`, hàm nối tự động khớp tên ≥75% `crm_lien_ket_nen_deals()`,
hàm quét trùng `crm_tim_nen_trung_lap()` và hàm gộp `crm_gop_nen(giữ, bỏ)`.
Workspace của dự án đã nối sẽ hiện thẳng khối "🗺 CSDL nền" (NPP chỉ định, hiện
trạng, BCI, nhật ký) — người lập kế hoạch không phải nhảy qua lại giữa hai kho.

## Kiểm thử đã chạy

Syntax check 13 module JS + sw.js + manifest: đạt. Chromium headless desktop 1280px
và mobile 390px: không lỗi JS; khối phê duyệt hiện trong hộp thoại dự án; thanh tác
nghiệp mobile hiển thị đúng. Chưa test được với dữ liệu Supabase thật từ sandbox —
sau khi chạy migration nên mở thử 1 dự án, đổi trạng thái phê duyệt và upload 1 ảnh.
