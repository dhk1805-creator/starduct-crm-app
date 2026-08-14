# CRM Starduct — Tách file v20 → v20.1

Bản này **giữ nguyên 100% logic** của `index.html` v20 (2.856 dòng).
Đã kiểm chứng: ghép ngược 12 file JS theo thứ tự nạp cho ra **chuỗi ký tự trùng khít** với khối `<script>` gốc.

## Người dùng cuối
Không đổi gì. Vẫn mở `index.html`.

## Cấu trúc

```
index.html                 470   ← HTML + 12 thẻ <script>
css/app.css                 62
js/00-i18n.js              547   Từ điển VI/EN + bộ dịch 2 chiều
js/01-core.js              129   State · hằng số chung · kết nối Supabase · tự đăng nhập · loadAll · nav
js/02-du-an-nen.js         169   Tab Dự án nền + nạp file DA / BCI / LIST BG
js/03-auth.js               60   fillFilters · renderAll · đăng nhập cá nhân · đổi mật khẩu
js/04-ke-hoach.js          549   Tab Kế hoạch kỳ (mẫu, mục tiêu, kinh phí, trình/duyệt)
js/05-nhan-su.js            61   Tab Nhân sự
js/06-doanh-thu-kpi.js     193   Hằng số ngành hàng/stage/kênh + Tab Doanh thu + Tab KPI kỳ
js/07-ho-tro-duyet.js      157   Tab Hỗ trợ + thảo luận & phê duyệt phân cấp
js/08-tong-quan.js         125   Tab Tổng quan (lớp nền, phễu NPP, win/loss)
js/09-doi-tac.js           187   Tab Đối tác + phân công Excel + hộp thoại đối tác
js/10-du-an-tiep-xuc.js    120   Tab Dự án · Tiếp xúc · Sự kiện
js/11-import.js            103   Tab Nhập dữ liệu
```

Không file nào vượt 600 dòng (ngưỡng an toàn). Lớn nhất: 549.

## 3 quy tắc bất di bất dịch

1. **Không đổi thứ tự thẻ `<script>`** trong `index.html`.
2. **Không thêm `defer` / `async` / `type="module"`.** Toàn bộ là script cổ điển —
   hàm và biến vẫn ở phạm vi toàn cục, nên 69 handler `onclick=` trong HTML chạy y nguyên.
   Đổi sang module là phải viết lại toàn bộ 69 handler đó.
3. **Dòng gắn sự kiện phải nằm cùng file với hàm nó trỏ tới.**
   Ví dụ `for(const el of [fdtQ,...]) el.oninput=renderDT;` chạy ngay lúc nạp,
   nên `renderDT` bắt buộc ở cùng `09-doi-tac.js`.

## Thay đổi duy nhất so với bản gốc

`const nv` và `const fmtB` (gốc dòng 2849–2852) được chuyển từ **cuối** file lên
`01-core.js`, vì `renderKPI` và `renderTQ` ở các file nạp trước có dùng chúng.
Không đổi nội dung, chỉ đổi vị trí.

## Từ nay khi sửa

| Cần sửa gì | Mở file nào |
|---|---|
| Thêm/sửa bản dịch EN | `js/00-i18n.js` |
| Đổi bảng màu, khoảng cách, font | `css/app.css` |
| Đổi kết nối Supabase, quy tắc lọc Nội địa/Quốc tế | `js/01-core.js` |
| Logic win/loss, phễu NPP, card Tổng quan | `js/08-tong-quan.js` |
| Luồng phê duyệt phân cấp | `js/07-ho-tro-duyet.js` |
| Form kế hoạch kỳ | `js/04-ke-hoach.js` |
| Thêm ô lọc / cột mới ở tab nào | file `js/` mang tên tab đó |

Chỉ dán **1 file** vào Claude khi nhờ sửa — không dán cả bộ.

## Checklist test sau khi thay (bắt buộc chạy đủ)

- [ ] Mở `index.html` → Console (F12) không có dòng đỏ, thấy `CRM build v20 · 14/08/2026`
- [ ] Tự đăng nhập chạy — góc phải hiện tên, chấm xanh "Đã kết nối"
- [ ] Bấm lần lượt cả 12 tab, tab nào cũng có dữ liệu
- [ ] Đổi 🇻🇳 → 🌏: toàn bộ chữ chuyển sang EN, bấm nút VI về lại tiếng Việt
- [ ] Tab Dự án nền: gõ từ khoá → Tìm → phân trang Trước/Sau
- [ ] Tab Đối tác: gõ vào ô tìm → danh sách lọc theo từng ký tự (kiểm tra `oninput`)
- [ ] Tab Dự án: đổi bộ lọc Stage → danh sách đổi theo
- [ ] Mở 1 đối tác → sửa → Lưu → tải lại trang thấy dữ liệu mới
- [ ] Tab Kế hoạch: mở form lập kế hoạch, bấm Trình duyệt
- [ ] Tab Hỗ trợ: tạo 1 yêu cầu, mở hộp thảo luận 💬
- [ ] Tab Nhập dữ liệu: nạp thử 1 file .xlsx nhỏ

## Cách đưa lên GitHub

1. Trước khi thay: GitHub Desktop → commit `STABLE: v20 truoc khi tach file`
2. Chép `index.html`, `css/`, `js/` đè vào thư mục repo local
3. Commit: `refactor: tach index.html 2856 dong -> 14 file, khong doi logic`
4. Push → chờ GitHub Pages build → mở link, chạy hết checklist trên
5. Nếu hỏng: GitHub Desktop → History → chuột phải commit STABLE → Revert
