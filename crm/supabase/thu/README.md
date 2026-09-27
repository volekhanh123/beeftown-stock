# Dữ liệu thử cho kho (chỉ project Beeftown-thu)

Hai file SQL để có sẵn một kho "đang chạy" mà bấm thử, và xoá đi khi xong. **Không phải migration** — đừng chép vào `migrations/`.

| File | Làm gì |
|---|---|
| `xoa-du-lieu-kho.sql` | Xoá sạch kho: mặt hàng, NCC, phiếu, lô, sổ kho, tồn, bán iPOS, công nợ, số phiếu, cấu hình iPOS. Giữ vị trí, lý do, cài đặt kho, máy cân. |
| `tao-du-lieu-kho.sql` | 73 mặt hàng (14 tảng theo từng tảng có bảng ủ và ô mã, tảng thùng, phần cắt, phụ phẩm, hàng đóng gói), 6 NCC "Thử A–F", rồi mô phỏng ~5 tuần: nhập + repack → ủ → lóc 1 tảng, giao ô → bán qua iPOS → huỷ hàng quá hạn → trả nợ. |

**Chạy:** Supabase → project **Beeftown-thu** → SQL Editor → dán cả file **xoá** → Run → dán cả file **tạo** → Run (khoảng nửa phút). Hoặc nhắn Claude "xoá dữ liệu thử" / "tạo lại dữ liệu thử".

**An toàn:** cả hai file dừng ngay nếu database có chi nhánh nào tên không chứa "BẢN THỬ" (project thật). File tạo dừng nếu kho chưa trống.

**Cách tạo:** mọi phiếu đi qua đúng hàm nghiệp vụ như trên web, đóng vai các tài khoản "(tập)": thủ kho lập, kế toán điền giá và duyệt, quản lý duyệt huỷ, chủ nối iPOS. Chỉ ngày giờ của phiếu chuyển/huỷ, lúc giao ô và giờ tạo phiếu được dời về ngày mô phỏng; số lượng và tiền không bị sửa tay.

Kiểm thử: `node test/test-kho-du-lieu-thu.mjs`.
