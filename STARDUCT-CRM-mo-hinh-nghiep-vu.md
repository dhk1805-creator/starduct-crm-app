# STARDUCT CRM — MÔ HÌNH NGHIỆP VỤ CHUẨN (bản chốt 15/08/2026)

Tài liệu này là "bản thiết kế gốc": mọi màn hình, con số, quyền hạn trong CRM phải chiếu theo đây. Khi bổ sung tính năng hay dữ liệu mới, đối chiếu tài liệu này trước — không vá lẻ.

## 1. Dòng chảy dữ liệu duy nhất (một mối, không nhánh phụ)

**Kho dự án nền (CSDL tổng)** → chọn lọc → **Dự án theo dõi** → hành động (tiếp xúc, spec-in) → **Chỉ định NPP + người phụ trách** → **Báo giá** → **Đơn hàng (YCSX/PO)** → **Doanh thu** → **Công nợ**.

Nguyên tắc bất di bất dịch:
- Mọi con số trên dashboard phải truy ngược được về đúng một bảng nguồn. Không có số nào "tự nhiên mà có".
- Bước sau là tập con của bước trước (chỉ định ⊂ tiếp cận ⊂ theo dõi ⊂ kho nền). Máy tự kiểm bằng file `supabase-kiem-tra-suc-khoe.sql`.
- Nội địa và Quốc tế là hai không gian tách biệt tuyệt đối (khu_vuc/quoc_gia bắt buộc trên mọi bảng). Quốc tế nhập tiếng Anh.
- Mỗi NPP có một mã code duy nhất (ND: NTK, GLX, VNMEP, IMP, MEPCO · QT: ECA, EID, EMC, EPH, ETL, EUY, EAL, EQC) — mã là khóa nối báo giá, doanh thu, dự án, công nợ.

## 2. Nhịp làm việc theo vai trò

**Sale/BD/NPP — hàng ngày (mobile):** mở app thấy ngay kế hoạch hành động hôm nay (đổ tự động từ kế hoạch tháng/quý). Ba việc duy nhất: ghi kết quả tiếp xúc, gửi đề xuất, gửi yêu cầu hỗ trợ — luôn gắn đúng dự án/khách hàng từ danh sách của mình. Không thấy dữ liệu người khác.

**Manager (Nam, Duẩn, V.Ngọc) — hàng ngày/tuần:** hàng chờ yêu cầu hiện ngay trên dashboard; Chấp nhận là biến khỏi hàng chờ, xử lý xong bấm Đã xong. Hàng tuần rà: dự án quá hạn bước tiếp theo, đề xuất tồn, công nợ NPP vượt ngưỡng.

**Ban duyệt (Khánh, Đ.N.Ngọc, T.Tâm, T.Hồng) — khi có việc + định kỳ:** chuông báo "Có N đề xuất chưa phê duyệt" → duyệt/từ chối kèm ý kiến ngay tại dashboard, mobile và desktop là một.

**CEO — tháng/quý/năm:** mở Tổng quan là bản báo cáo: mặc định toàn cảnh, chọn kỳ để xem theo tháng/quý/năm, trang Quốc tế chọn từng nước. Câu hỏi CEO cần trả lời được trong 30 giây: phủ được bao nhiêu thị trường, khai thác được bao nhiêu % kho nền, NPP nào đang làm ăn ra sao (dự án theo, win rate, doanh thu, công nợ), báo giá phát hành bao nhiêu, chuyển đổi ra đơn bao nhiêu.

## 3. Bảng số liệu chuẩn trên dashboard (nguồn của từng số)

| Con số | Bảng nguồn | Ghi chú |
|---|---|---|
| Kho nền | crm_du_an_nen | CSDL tổng, đáy phễu |
| Theo dõi / tiếp cận / chỉ định | crm_deals + crm_touchpoints | chỉ định ⊂ tiếp cận |
| Báo giá, YCSX | crm_quotations | khu_vuc bắt buộc |
| Doanh thu | crm_revenue | thang + org_id (mã NPP) |
| Đề xuất/duyệt | crm_approvals | vòng khép kín mobile↔desktop |
| Độ phủ đối tác | crm_org.trang_thai_phu | chỉ tính nhóm mục tiêu |

## 4. Kỷ luật phát hành (để hết cảnh "em mới phát hiện")

1. Mọi thay đổi dữ liệu = 1 file SQL đánh số, chạy lại được nhiều lần không hỏng.
2. Trước khi giao: chạy `supabase-kiem-tra-suc-khoe.sql` — tất cả DAT mới phát hành. CẢNH BÁO là việc tồn có chủ, ghi vào mục "Việc còn mở".
3. Nhập dữ liệu mới (file Excel/báo cáo) phải đối chiếu với dữ liệu đang có trước khi ghi — ra biên bản: bao nhiêu dòng mới, bao nhiêu trùng, bao nhiêu lệch.
4. Phiên bản app số tròn (V37, V38…), đồng bộ 5 điểm, test theo checklist vai trò (CEO / Manager / Sale / NPP) chứ không test theo màn hình.

## 5. Việc còn mở có chủ (không phải lỗi mới)

- Gán vùng cho dự án nội địa; nối 137 dự án theo dõi về mã kho nền
- Nạp 127 dự án đã chào hàng quốc tế vào crm_deals (gắn NPP theo mã)
- RLS cứng theo 3 tầng quyền; tài khoản email cho 11 nhân sự + NPP
- Công nợ NPP (từ báo cáo H1) — chưa có bảng trong CRM, làm khi CEO chốt cần theo dõi trong CRM hay để kế toán
