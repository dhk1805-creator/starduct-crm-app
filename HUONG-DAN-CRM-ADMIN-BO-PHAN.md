# HƯỚNG DẪN SỬ DỤNG STARDUCT CRM
## Dành cho Quản trị hệ thống & các bộ phận liên quan (Admin · BO · TCKT · QLSX · R&D · CFO)

Phiên bản tài liệu: 1.0 · 15/08/2026 · Áp dụng app từ V43 · Đọc kèm: "Hướng dẫn sử dụng CRM cho PKD và NPP"

---

## 1. BỨC TRANH LIÊN THÔNG — VÌ SAO BỘ PHẬN CỦA BẠN LIÊN QUAN

CRM Starduct và ERP NSCA (erp-nsca.pages.dev) dùng CHUNG một cơ sở dữ liệu. Mọi nghiệp vụ chảy theo một vòng duy nhất:

NPP đăng ký dự án (ERP) → BO xác nhận → Ban lãnh đạo duyệt (CRM) → dự án vào CRM → báo giá → đơn hàng/YCSX (ERP) → sản xuất → giao hàng (WMS) → doanh thu → công nợ.

Mỗi bộ phận đứng ở một khâu của vòng này. Số liệu chỉ đúng khi khâu của bạn nhập đúng — dashboard của CEO đọc trực tiếp từ dữ liệu các bạn tạo ra, không qua báo cáo tay.

## 2. DÀNH CHO ADMIN (Quản trị hệ thống — Phạm Hoài Nam)

**Tài khoản & phân quyền:** người dùng quản lý trong bảng `crm_user_roles`. Ba tầng quyền bằng 2 cờ: `quyen_phe_duyet` (hiện 4 người), `quyen_tiep_nhan` (hiện 3 người), còn lại là tầng báo cáo "của ai nấy thấy". Thêm người mới: tạo tài khoản đăng nhập + thêm dòng vai trò; KHÔNG cấp tài khoản cho NPP khi chưa hoàn tất RLS tầng database (việc mở ưu tiên số 1).

**Phát hành phiên bản (kỷ luật 5 điểm):** mỗi lần sửa app phải đồng bộ SD_VER (js/18-version.js) · CACHE+SHELL (sw.js) · version.json · APP_VER (js/00-i18n.js) · tham số ?v= trong index.html. Phiên bản đặt số tròn (V43, V44…). Chuỗi giao diện mới phải thêm cặp dịch VI/EN vào từ điển FRAG (js/00-i18n.js).

**Nghiệm thu bắt buộc:** trước mỗi lần phát hành, chạy `supabase-kiem-tra-suc-khoe.sql` (22 hạng mục) trong Supabase SQL Editor — toàn ĐẠT mới giao; CẢNH BÁO là việc tồn có chủ. File này chỉ đọc, chạy lúc nào cũng được.

**Cầu nối ERP:** hàm `crm_erp_dong_bo()` chạy mỗi lần mở dashboard (4 mạch: YCSX→PO · đăng ký→hàng chờ · giao hàng→doanh thu · đăng ký đã duyệt→tạo dự án); `crm_erp_duyet_dang_ky()` ghi quyết định duyệt ngược về ERP. CRM chỉ đọc bảng ERP qua view `v_crm_erp_*` — không sửa schema bảng ERP từ phía CRM.

**Sự cố thường gặp:** màn hình thiếu dữ liệu mới → bấm ⟳ chân trang; bảng mới tạo không đọc được từ app → kiểm tra RLS, thêm policy `select to authenticated`; số liệu nghi lệch → chạy bộ nghiệm thu trước khi soi tay. Tài liệu kỹ thuật đầy đủ: `BAN-GIAO-CRM-cho-Pham-Hoai-Nam.md` trong repo.

## 3. MỞ TÀI KHOẢN CHA–CON CHO NPP (việc của Admin)

**Mô hình hai tầng cho mỗi NPP:**

| Loại | Ai dùng | Nhìn thấy gì | Được làm gì |
|---|---|---|---|
| Tài khoản CHA (NPP Lead) | 1 người đại diện mỗi NPP (VD: Ms Hoa — GALAXYTECH) | TOÀN BỘ dữ liệu của riêng NPP mình: dự án đăng ký, báo giá, đơn hàng, công nợ, kết quả các nhân viên | Đăng ký dự án mới, phân công dự án cho tài khoản con, gửi đề xuất/yêu cầu, trả lời phản hồi |
| Tài khoản CON (sale NPP) | Nhân viên kinh doanh của NPP | CHỈ các dự án được tài khoản cha phân công cho mình | Ghi kết quả tiếp xúc hằng ngày, gửi đề xuất/yêu cầu theo dự án của mình |

Cả hai loại đều thuộc tầng "báo cáo" — không có quyền duyệt, không thấy dữ liệu của NPP khác hay của nội bộ Starduct (giá vốn, công nợ NPP khác, dữ liệu thị trường nội bộ).

**ĐIỀU KIỆN BẮT BUỘC trước khi mở tài khoản NPP đầu tiên:** triển khai xong lớp khóa dữ liệu tầng database (RLS theo `npp_org_id`) — vì NPP là người NGOÀI công ty, chặn ở giao diện là không đủ. Chưa xong RLS thì chưa phát bất kỳ tài khoản NPP nào, kể cả thí điểm.

**Các bước mở một cụm tài khoản NPP (làm một lần cho mỗi NPP):**

1. Xác định NPP và mã (VD: GLX) — lấy `id` của NPP trong bảng đối tác (crm_org).
2. Supabase → Authentication → Add user: tạo email tài khoản CHA (dùng email công ty của NPP, không dùng email cá nhân), đặt mật khẩu tạm.
3. Thêm dòng vào `crm_user_roles`: họ tên, vai trò `npp_lead`, gắn `npp_org_id` = id của NPP, hai cờ quyền để false.
4. Tạo tiếp các tài khoản CON tương tự với vai trò `npp_sale`, cùng `npp_org_id`.
5. Gửi thông tin đăng nhập qua kênh riêng (không email chung), yêu cầu đổi mật khẩu ngay lần đầu.
6. Nghiệm thu bắt buộc trước khi bàn giao: đăng nhập thử tài khoản cha — chỉ thấy dữ liệu NPP mình; tài khoản con — chỉ thấy dự án được giao; thử gọi dữ liệu NPP khác phải bị chặn.
7. Hướng dẫn NPP cài app lên điện thoại (mục 1 của tài liệu PKD & NPP).

**Vòng đời tài khoản:** nhân viên NPP nghỉ việc → khóa tài khoản con (disable, không xóa — giữ lịch sử); NPP chấm dứt hợp đồng → khóa cả cụm cha-con và chuyển phễu NPP về trạng thái tương ứng. Mọi tài khoản khóa vẫn giữ nguyên dữ liệu lịch sử để đối soát.

**Lộ trình khuyến nghị:** làm RLS → thí điểm 1 cụm cha-con với GALAXYTECH (Ms Hoa) 1–2 tuần → rà lại bằng bộ nghiệm thu → nhân rộng 5 NPP nội địa rồi 9 NPP quốc tế.

## 4. DÀNH CHO BO (Back Office)

BO là người gác cổng dữ liệu — ba nhiệm vụ trong vòng nghiệp vụ:

**a) Xác nhận đăng ký của NPP:** trên ERP → Kinh Doanh → Kanban dự án NPP. Thẻ ở cột "Cần bổ sung" là đăng ký chờ BO rà: điền các ô đang ghi "(chưa rõ)" (CĐT, địa điểm, TVTK, nhà thầu), sửa giá trị ước cho sát thực tế, rồi kéo thẻ sang "Chờ duyệt". Thẻ sang Chờ duyệt sẽ tự xuất hiện trên bàn Ban lãnh đạo trong CRM. (Hiện có 26 thẻ chuyển từ dữ liệu BO cũ đang chờ đợt rà đầu tiên.)

**b) Kỷ luật mã dự án:** mỗi dự án một mã duy nhất — không dùng lại, không để trống (dữ liệu cũ đang trùng mã D0258 hàng loạt, cần chuẩn hóa dần). Mã dự án + mã NPP ghi trong mọi email/báo giá/đơn hàng, khuyến nghị tiêu đề email: `[Mã DA] [Mã NPP] Loại việc`. Đây là điều kiện để hệ thống tự khớp đơn hàng — báo giá — dự án không cần người dò.

**c) Dữ liệu báo giá:** báo giá phát hành ghi nhận qua module Báo giá của ERP (hoặc nạp file theo mẫu LIST BG ở tab Nhập dữ liệu của CRM). Trên dashboard CRM, card "Nghiệp vụ từ ERP" có nhãn "đã/chưa có trong CRM" từng dòng — dòng nào lệch là việc của BO.

## 5. DÀNH CHO TCKT (Tài chính — Kế toán)

**Doanh thu:** bảng doanh thu CRM nhận từ 2 nguồn: (1) số kỳ đã chốt nạp từ báo cáo (H1/2026 = 89,1 tỷ đã nạp đủ theo NPP theo tháng); (2) TỰ ĐỘNG từ lệnh giao hàng ERP có mốc "đã giao" từ 01/07/2026 trở đi — kế toán không phải nhập tay phần này, nhưng cần đảm bảo bên kho bấm xác nhận giao đúng ngày và đơn giao có giá trị trước VAT chính xác.

**Công nợ NPP:** bảng `crm_cong_no` theo kỳ (đang có H1-2026: 7 kênh, nợ cuối kỳ 34,6 tỷ). Card "Công nợ NPP" trên dashboard tô đỏ nợ vượt ngưỡng cam kết (NTK 7,3/ngưỡng 6 tỷ) và nợ khó đòi (5,53 tỷ tồn trước 2022). Mỗi kỳ chốt sổ, TCKT gửi số mới cho Admin nạp (xuất HĐ · đã thanh toán · nợ cuối kỳ · nợ khó đòi theo mã NPP) — sẽ chuyển dần sang lấy thẳng từ phân hệ Tài Chính của ERP.

**Đối chiếu:** lệnh giao hàng bên ERP có trường số hóa đơn (ar_invoice_no) — đối chiếu doanh thu CRM ↔ hóa đơn phát hành theo đó. Chênh lệch báo Admin chạy bộ nghiệm thu.

## 6. DÀNH CHO QLSX (Quản lý Sản xuất)

Sản xuất chạm vào vòng nghiệp vụ ở 3 điểm:

**a) YCSX:** đơn hàng có mã YCSX trên ERP làm dự án tương ứng trong CRM tự chuyển trạng thái PO — kinh doanh và lãnh đạo nhìn thấy ngay đơn đã vào sản xuất. Vì vậy mã YCSX phải gắn đúng tên/mã dự án.

**b) Giao hàng:** khi WMS xác nhận "đã giao" (delivered), hệ thống tự ghi doanh thu về đúng NPP. Bấm xác nhận giao đúng ngày thực giao — sai ngày là sai kỳ doanh thu.

**c) Claim & tiến độ:** phản hồi claim của NPP và tiến độ đơn hàng cần trả lời sớm cho PKD (H1/2026 có 27 claim, nhiều vụ chậm phản hồi kéo dài). Thay đổi quy cách sản phẩm BẮT BUỘC thông báo PKD trước khi áp dụng — bài học dự án Copan Bắc Ninh phải sản xuất lại 102 cửa SPG vì đổi quy cách không báo.

## 7. DÀNH CHO R&D / PLM

**Giá và quy cách phục vụ báo giá:** danh mục sản phẩm, kích thước min–max và giá ban hành nằm trong phân hệ PLM của ERP — đây là nguồn để PKD/NPP báo giá. Hai yêu cầu từ thực tế H1: thống nhất kích thước công bố giữa R&D và Sản xuất (đang lệch: R&D max 1800×1200 vs SX làm được 2500×1000), và ban hành giá kịp thời cho sản phẩm mới có trong catalogue.

**Tình báo thị trường:** tab "Thị trường" của CRM có hồ sơ 16 thị trường (đặc điểm, tiêu chuẩn, đối thủ) — nguồn tham khảo khi định hướng sản phẩm. Lưu ý chiến lược đang theo dõi ở cấp CEO: VAV Box mới chiếm 4,2% doanh thu quốc tế dù là sản phẩm cốt lõi của hợp đồng phát triển thị trường.

## 8. DÀNH CHO CFO / BAN TÀI CHÍNH ĐIỀU HÀNH

Dashboard CRM là trang báo cáo điều hành đọc trực tiếp, không chờ tổng hợp tay:

- **Chọn kỳ xem số:** mặc định là toàn cảnh; bấm Tháng/Quý/Năm hoặc chọn khoảng ngày → doanh thu kỳ, báo giá phát hành kỳ, tỉ lệ chuyển đổi. Trang Quốc tế xem được từng quốc gia.
- **Phễu khai thác:** từ kho 3.617 dự án nền → đang theo dõi → tiếp cận → chỉ định → thắng, kèm giá trị từng bước — nhìn ra ngay tiền đang nằm ở khâu nào.
- **Công nợ theo kỳ:** tổng quan + từng NPP, cảnh báo đỏ vượt ngưỡng — căn cứ quyết định hạn mức tín dụng NPP (MEPCO đang thuộc diện không tăng hạn mức).
- **Chuyển đổi:** doanh thu / giá trị chào trong kỳ — theo dõi hiệu quả pipeline (toàn hệ H1: 823 báo giá 1.431,8 tỷ → 89,1 tỷ doanh thu ≈ 6,2%).
- **Chi phí phát triển thị trường:** báo cáo KPI hợp đồng Santiago (doanh thu 886tr = 11,4% mục tiêu, chi phí 982,6tr, cân đối âm 96,6tr, mốc rà soát 31/12/2026) — hiện theo dõi bằng báo cáo kỳ, card KPI trên CRM sẽ bổ sung khi Ban lãnh đạo yêu cầu.

## 9. QUY TẮC CHUNG CHO MỌI BỘ PHẬN

1. Một dữ liệu — một nguồn: không nhập tay lại số đã có trong hệ thống; thấy thiếu/sai thì sửa tại nguồn, không sửa trên báo cáo.
2. Mã dự án + mã NPP trong mọi trao đổi liên bộ phận.
3. Thay đổi ảnh hưởng bộ phận khác (quy cách, giá, lịch giao) — thông báo TRƯỚC khi áp dụng.
4. Nghi ngờ số liệu → yêu cầu Admin chạy bộ nghiệm thu 22 hạng mục thay vì đối chiếu tay từng màn hình.

## 10. HỖ TRỢ

Quản trị hệ thống: **Phạm Hoài Nam** — tài khoản, phân quyền, sự cố, đề xuất tính năng. Tài liệu kỹ thuật trong repo `starduct-crm-app`: hồ sơ bàn giao, mô hình nghiệp vụ, trạng thái hệ thống, bộ nghiệm thu.
