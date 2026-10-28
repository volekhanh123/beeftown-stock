## Tóm tắt cho Khánh

<!--
Khánh đọc mục này (và mục thử ngay dưới) để quyết gộp hay không. Viết cho người không đọc code, mỗi dòng một hai câu,
không tên hàm, không tên file. Mọi bằng chứng kỹ thuật để trong phần gập "Chi tiết cho người rà soát" bên dưới.
Workflow "Mô tả PR" kiểm bốn dòng này có chữ; comment "Máy tóm tắt PR" trên PR tự liệt kê việc sau khi gộp.
-->

- **Thay đổi:** <!-- ai dùng, ở màn nào, khác gì so với trước -->
- **Rủi ro:** <!-- Thấp / Vừa / Cao — vì sao. Cao khi đụng tiền, tồn kho, quyền, tin gửi khách, trang công khai -->
- **Cần Khánh quyết:** <!-- câu hỏi cụ thể kèm đề xuất, hoặc "không" -->
- **Sau khi gộp:** <!-- chép mục "Sau khi gộp" của `cd crm && npm run tom-tat-pr`, thêm việc riêng (bật công tắc, thêm bí mật…); "không cần làm gì" nếu chỉ đổi kiểm thử / tài liệu -->

## Khánh tự thử thế nào

<!-- Các bước bấm cụ thể trên web / máy quầy / cân để thấy thay đổi. "Không cần thử" nếu chỉ đổi phía trong. -->

<details>
<summary><b>Chi tiết cho người rà soát</b> — thay đổi kỹ thuật, migration, 9 mục "xong", kiểm thử</summary>

## Thay đổi chi tiết

<!-- Phần trong: cách lưu, hàm / bảng / trang nào đổi, việc để PR sau. -->

## Migration

- Số migration mới: <!-- 00NN_ten.sql, lấy từ `cd crm && npm run so-migration`; "không có" nếu không đổi database -->
- Đã chạy trên project Beeftown-thu: <!-- có / chưa / không cần -->
- Thứ tự triển khai: <!-- ví dụ: chạy migration trước, deploy web sau; migration nào phải chạy RIÊNG -->

## Định nghĩa "xong" — 9 mục

<!-- Mỗi mục: tên kiểm tra chứng minh (tên trong ok(...)), hoặc "không áp dụng vì …". Giải thích từng mục ở CLAUDE.md. -->

- [ ] `quyen` — anon / vai khác / chi nhánh khác / người đã nghỉ bị từ chối:
- [ ] `bam-hai-lan` — gửi hai lần chỉ ra một bản ghi:
- [ ] `gio-vn` — đúng giờ Việt Nam, kể cả 0h–7h và ngày không có thật:
- [ ] `chu-va-so` — chữ có dấu, số kiểu "1.000" / "1,5":
- [ ] `mat-mang` — mất mạng / hết giờ / lỗi 500 không bao giờ báo thành công:
- [ ] `ton-kho` — `kho_doi_soat_ton()` rỗng:
- [ ] `cau-chu` — câu đúng sự thật, đủ tiếng Anh (và Hàn ở trang công khai), không chữ cấm:
- [ ] `migration` — số từ `npm run so-migration`, không sửa migration đã có trên main:
- [ ] `dich-vu-ngoai` — giả định về dịch vụ ngoài, kiểm thử giả cho từng kiểu hỏng, việc phải thử thật:

## Kiểm thử

- File kiểm thử mới / sửa: <!-- tên file + số kiểm tra -->
- `cd crm && npm test`: <!-- dán dòng tổng, ví dụ "TẤT CẢ 5900 KIỂM TRA TRÊN 58 FILE ĐỀU ĐẠT" -->
- Kết quả `/code-review`: <!-- phát hiện gì, đã sửa gì -->

</details>

## Sửa lỗi thật?

<!-- "Sửa #<số issue>" và tên kiểm tra "HỒI QUY #<số>" — kiểm thử đó phải đỏ trước khi sửa. Không phải thì xoá mục này. -->
