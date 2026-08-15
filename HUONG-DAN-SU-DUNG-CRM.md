# HƯỚNG DẪN SỬ DỤNG STARDUCT CRM
## Dành cho Phòng Kinh Doanh (PKD) và Nhà Phân Phối (NPP)

Phiên bản tài liệu: 1.0 · 15/08/2026 · Áp dụng app từ V43 · Quản trị hệ thống: Phạm Hoài Nam

---

## 1. TRUY CẬP HỆ THỐNG

**Máy tính:** mở https://dhk1805-creator.github.io/starduct-crm-app/ bằng Chrome/Edge, bấm "Đăng nhập" góc phải, nhập email công ty và mật khẩu được cấp.

**Điện thoại:** mở cùng đường dẫn trên bằng Chrome (Android) hoặc Safari (iPhone). Giao diện tự chuyển sang bản mobile. Để cài thành app trên màn hình chính: Android bấm menu ⋮ → "Thêm vào màn hình chính"; iPhone bấm nút Chia sẻ → "Thêm vào MH chính". Không cần tải từ App Store.

**Trong ERP NSCA:** CRM là module "CRM Starduct 🌏" của NSCA Platform (erp-nsca.pages.dev) — cùng tài khoản, cùng dữ liệu.

**Ngôn ngữ:** nút EN/VI góc phải trên. Quy tắc: dữ liệu thị trường Quốc tế nhập bằng TIẾNG ANH; thị trường Nội địa nhập tiếng Việt.

**Cập nhật phiên bản:** khi chân trang báo "Có bản mới", bấm "⟳ Cập nhật bản mới nhất". Không cần gỡ cài lại.

## 2. PHÂN QUYỀN — AI LÀM GÌ

Hệ thống có 3 tầng quyền, gắn theo tên từng người:

| Tầng | Ai | Được làm gì |
|---|---|---|
| Phê duyệt | Đào Huy Khánh, Đào Nguyên Ngọc, Nguyễn Thị Thanh Tâm, Nguyễn Thị Thúy Hồng | Duyệt/Từ chối mọi đề xuất kèm ý kiến; gán người phụ trách và NPP cho dự án; xem toàn bộ dữ liệu và báo cáo |
| Tiếp nhận | Phạm Hoài Nam, Nguyễn Tiến Duẩn, Nguyễn Văn Ngọc | Chấp nhận/Từ chối yêu cầu hỗ trợ, xử lý và đánh dấu Đã xong; xem toàn bộ dữ liệu |
| Báo cáo | Santiago, Hải, Đức, các NPP | Ghi kết quả hành động, gửi đề xuất, gửi yêu cầu hỗ trợ; nhận và trả lời phản hồi. CHỈ thấy dữ liệu của chính mình |

Nguyên tắc chung: "của ai nấy thấy" — nhân viên và NPP chỉ thấy việc của mình; lãnh đạo thấy tất cả. Không con số nào vào hệ thống mà không qua người có quyền.

## 3. DÀNH CHO NHÂN VIÊN PKD — CÔNG VIỆC HẰNG NGÀY (MOBILE)

Mở app mỗi sáng, màn hình Home hiện sẵn KẾ HOẠCH HÀNH ĐỘNG HÔM NAY — đổ tự động từ kế hoạch tháng/quý đã duyệt. Ba việc trong ngày:

**a) Ghi kết quả tiếp xúc:** bấm "Ghi kết quả" → chọn đúng dự án/khách hàng từ danh sách của mình (bắt buộc chọn, không nhập tên tự do — tránh nhầm dự án) → ghi kết quả, bước tiếp theo và hạn.

**b) Gửi đề xuất:** bấm "Đề xuất" → chọn dự án/khách hàng liên quan → nêu nội dung (xin giá, xin chính sách, xin chỉ định…). Đề xuất bay thẳng lên dashboard của Ban duyệt — có kết quả sẽ báo về máy kèm ý kiến, bấm 💬 để trao đổi tiếp.

**c) Yêu cầu hỗ trợ:** bấm "Request" → chọn bộ phận nhận và nội dung. Người tiếp nhận bấm Chấp nhận là yêu cầu chuyển sang "Đang xử lý", xong việc họ đánh dấu Đã xong.

Lưu ý: dự án quốc tế ghi bằng tiếng Anh. Mọi tiếp xúc nên kết thúc bằng một "bước tiếp theo" có hạn — dashboard nhắc hạn tự động.

## 4. DÀNH CHO NHÂN VIÊN PKD — TRÊN MÁY TÍNH

- Tab **Đối tác**: danh mục khách hàng/NPP của mình; mở từng đối tác để cập nhật trạng thái phủ (0→5), người liên hệ, ghi chú.
- Tab **Dự án**: dự án mình phụ trách; mở dự án xem Overview, Tiếp xúc, Báo giá, Hỗ trợ. Dự án ghi "⏳ Chờ phân công" nghĩa là chưa có người phụ trách — lãnh đạo sẽ gán.
- Tab **Tiếp xúc**: nhật ký làm việc, lọc theo dự án/thời gian.
- Tab **Thị trường** (trang Quốc tế): hồ sơ tình báo từng nước — đặc điểm thị trường, NPP đã ký HĐ, đối tác tham khảo.
- Chuyển **Nội địa 🇻🇳 / Quốc tế 🌏** bằng ô chọn trên cùng. Hai không gian tách biệt hoàn toàn.

## 5. DÀNH CHO NGƯỜI TIẾP NHẬN (Nam, Duẩn, V.Ngọc)

Chuông 🔔 trên header báo "N yêu cầu đang mở". Vào Tổng quan → Hàng chờ: bấm **Chấp nhận** (yêu cầu rời hàng chờ, vào mục "Đang xử lý của tôi") hoặc **Từ chối** (bắt buộc ghi lý do). Xử lý xong bấm **Đã xong** — người gửi nhận được kết quả trên mobile ngay.

## 6. DÀNH CHO BAN DUYỆT & CEO

**Đọc dashboard như một trang báo cáo:** mở Tổng quan là bức tranh toàn cảnh (mặc định toàn bộ dữ liệu). Muốn xem theo kỳ: bấm Tháng này / Quý này / Năm nay, hoặc chọn khoảng ngày rồi "Xem báo cáo". Trang Quốc tế chọn được từng quốc gia.

Các khối chính trên dashboard:
- **Bộ KPI đầu trang**: tổng đối tác/dự án, đã tiếp cận, đã chỉ định, giá trị khai thác, tỷ lệ win.
- **Phễu khai thác từ kho nền**: Kho dự án nền (CSDL tổng) → Đưa vào theo dõi → Đã tiếp cận → Đã chỉ định → Đóng sổ → Thắng, kèm % từng bước.
- **NPP đã ký HĐ**: từng NPP đang theo bao nhiêu dự án, giá trị, thắng/thua, tỷ lệ win.
- **Công nợ NPP theo kỳ**: xuất HĐ, đã thanh toán, nợ cuối kỳ (đỏ khi vượt ngưỡng), nợ khó đòi.
- **Nghiệp vụ từ ERP**: đăng ký chỉ định của NPP, đơn hàng/YCSX, giao hàng — dữ liệu sống từ ERP, kèm nhãn "đã/chưa có trong CRM".

**Duyệt đề xuất:** chuông 🔔 báo "Có N đề xuất chưa phê duyệt" → bấm vào là tới Hàng chờ → mỗi dòng có ô Ý kiến + nút ✔ Duyệt / ✘ Từ chối (từ chối bắt buộc ghi lý do). Duyệt trên desktop hay mobile đều đồng bộ tức thì. Riêng dòng loại "Đăng ký chỉ định (ERP)": quyết định của bạn tự ghi ngược về ERP, và khi DUYỆT thì dự án tự sinh trong CRM gắn đúng NPP.

**Gán người phụ trách + NPP:** mở bất kỳ dự án nào → khối "👥 Gán người phụ trách & NPP" → chọn người, chọn NPP (dropdown hiện mã: GLX · GALAXYTECH…) → Lưu.

## 7. DÀNH CHO NHÀ PHÂN PHỐI (NPP)

**Quy trình đăng ký và theo đuổi dự án (một vòng duy nhất):**

1. NPP đăng ký dự án muốn theo đuổi trên **ERP NSCA** (Kanban Kinh Doanh / Portal NPP) — ghi rõ tên dự án, CĐT, địa điểm, giá trị ước.
2. Bộ phận BO xác nhận thông tin (thẻ "Cần bổ sung" → "Chờ duyệt").
3. Ban lãnh đạo Starduct duyệt trên CRM — kết quả hiện ngược lại trên ERP cho NPP thấy.
4. Được duyệt = dự án vào danh mục CRM, NPP được quyền bảo vệ dự án; tiếp theo là báo giá → đặt hàng (YCSX) → giao hàng → doanh thu, tất cả tự chảy về hệ thống.

**Mã NPP** là định danh trong toàn hệ thống: Nội địa NTK · GLX · VNMEP · IMP · MEPCO; Quốc tế ECA (TNR) · EID (Sinabu) · EMC (Mey Foong) · EPH (Aire Focus/Greentech) · ETL (Wind Control) · EUY (Vitrilan) · EAL (Plasticade) · EQC (QC Manufacturing). Đề nghị ghi mã này trong mọi văn bản, email trao đổi.

**App mobile cho NPP:** giao diện báo cáo hằng ngày (như mục 3) sẽ được kích hoạt cho từng NPP sau khi công ty hoàn tất lớp bảo mật dữ liệu tầng database và cấp tài khoản (thí điểm đầu tiên: GALAXYTECH). Khi được cấp, NPP cài app theo hướng dẫn mục 1 và chỉ nhìn thấy dự án/dữ liệu của chính mình.

## 8. QUY TẮC VÀNG VỀ DỮ LIỆU

1. **Mã dự án duy nhất** — mọi trao đổi (email, báo giá, đơn hàng) ghi kèm mã dự án + mã NPP. Khuyến nghị tiêu đề email: `[Mã DA] [Mã NPP] Loại việc`.
2. **Chọn từ danh mục, không gõ tên tự do** — tránh một dự án hai ba tên.
3. **Quốc tế nhập tiếng Anh** — dữ liệu và trao đổi thị trường quốc tế dùng English.
4. **Mọi thứ qua duyệt** — đăng ký, đề xuất, chỉ định đều đi qua hàng chờ phê duyệt; không có đường tắt.
5. **Kết thúc tiếp xúc bằng bước tiếp theo có hạn** — hệ thống tự nhắc, sếp tự thấy, không cần báo cáo miệng.

## 9. HỖ TRỢ

- Quên mật khẩu / cần tài khoản: liên hệ quản trị hệ thống **Phạm Hoài Nam**.
- Lỗi hiển thị: bấm "⟳ Cập nhật bản mới nhất" ở chân trang trước, còn lỗi thì chụp màn hình gửi quản trị.
- Tài liệu kỹ thuật (dành cho quản trị): `BAN-GIAO-CRM-cho-Pham-Hoai-Nam.md`, `STARDUCT-CRM-mo-hinh-nghiep-vu.md`, `STARDUCT-CRM-trang-thai-he-thong.md` trong repo starduct-crm-app.
