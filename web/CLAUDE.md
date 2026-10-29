# web/ — website, /noi-bo, kho, webhook

Phiên Claude tự nạp file này khi đọc file trong `web/`. Quy trình chung ở `CLAUDE.md` gốc; file này là **bản đồ**:
việc gì thì đọc mục nào, sửa file nào. Đọc đúng mục, đừng đọc cả `README.md` (680 dòng) hay `KHO.md` (1.500 dòng).
Kiểm thử của web nằm ở `crm/test/` (`test-*-web.mjs`, `test-cong-khai-*.mjs`, `test-noi-bo-*.mjs`): chúng import
thẳng file `.ts` của `src/lib/`. Tìm test của một file: `cd crm && npm run tim -- <tên-file>.ts`.

## Việc gì đọc gì

| Việc | Đọc | Sửa chủ yếu |
|---|---|---|
| Giao diện, màu, chữ, ảnh trang công khai | skill `thiet-ke-beeftown` (tự nạp), `THIET-KE.md` | `src/components/`, `src/styles/cong-khai.css`, `src/lib/chu.ts` (câu cố định vi/en/ko, đường dẫn) |
| Nội dung chủ bật / tắt trên trang | `README.md`, "Ý tưởng duy nhất cần hiểu" | `src/lib/noi-dung.ts`, `src/lib/cong-tac.ts` |
| Thực đơn công khai | `THUC-DON.md` | `src/lib/thuc-don.ts`, `src/lib/thuc-don-noi-bo.ts` |
| Mua thịt về | `README.md`, "Mua thịt về" | `src/lib/mua-thit-ve.ts`, `src/lib/don-mua-thit.ts`, `src/lib/dich-dat-hang.ts` |
| Đặt bàn, tuyển dụng | `README.md`, "Cấu trúc" | `src/lib/dat-ban.ts`, `src/lib/nop-ho-so.ts`, `src/lib/xu-ly-form.ts` |
| Màn `/noi-bo` (CRM) | `README.md`, "Giao diện nội bộ", "Tiếng Anh ở giao diện nội bộ" | `src/pages/noi-bo/`, `src/lib/gui-noi-bo.ts`, `src/lib/cau-noi-bo.ts` |
| Kho | bảng "Kho" bên dưới | `src/pages/noi-bo/kho/`, `src/lib/kho/` |
| Zalo OA | `README.md`, "Zalo" | `src/lib/zalo.ts`, `src/lib/zalo-gui.ts`, `src/pages/noi-bo/zalo/` |
| Messenger | `README.md`, "Messenger" | `src/pages/hook/messenger.ts`, `src/lib/messenger.ts` |
| iPOS / FABi | `KHO.md` mục 3j | `src/pages/hook/ipos/`, `src/lib/kho/ipos.ts`, `src/lib/kho/ipos-hook.ts`, `src/lib/kho/ipos-dong-bo.ts`; file nhập món `mon-fabi.xlsx.ts` (`?da_co=` của extension `mo-rong-fabi/README.md`) |
| Sức khỏe hệ thống, báo động | `README.md`, "Sức khỏe hệ thống", "Báo động" | `src/lib/suc-khoe.ts`, `src/lib/bao-dong-chinh-sach.ts`, `src/components/SucKhoeHeThong.astro` |
| Việc chạy theo giờ (cron) | `wrangler.toml` | `src/worker.ts` (hàm `scheduled`) |
| Bản dịch tự động Anh / Hàn | `README.md`, "Bản dịch tự động" | `src/lib/may-dich.ts`, `src/lib/ban-dich.ts` |
| Meta Pixel | `README.md`, "Meta Pixel" | `src/lib/meta-pixel.ts` |

## Kho

Mỗi màn: thư mục trang dưới `src/pages/noi-bo/kho/`, file logic chính dưới `src/lib/kho/`, mục giải thích trong `KHO.md`.

| Màn | Trang | Logic | `KHO.md` |
|---|---|---|---|
| Trang chủ theo vai, việc cần làm, chuông | `index.astro`, `viec.astro`, `thong-bao.astro` | `trang-chu.ts`, `viec.ts`, `thong-bao.ts` | 2, 3 |
| Nhận hàng (thủ kho, chỉ kg) | `nhan-hang/` | `nhan-hang.ts` | 3, 3d "Gọn phần mua và nhận hàng" |
| Điền giá, duyệt phiếu nhập | `nhap/`, `duyet.astro` | `nhap.ts` | 3, 3b |
| Tồn kho, thẻ kho, quét nhãn | `ton.astro`, `the-kho/`, `quet.astro` | `ton.ts`, `the-kho.ts`, `quet-nhan.ts` | 3d |
| Quầy: yêu cầu, nhận, đếm | `quay/` | `quay.ts`, `dem-quay.ts` | 3c |
| Chuyển, xuất bếp, hủy | `xuat/` | `xuat.ts` | 3c, 3d "Gọn phần pha lóc, quầy, xuất" |
| Kiểm kê | `kiem-ke/` | `kiem-ke.ts` | 3c, 3d |
| Pha lóc | `pha-loc/` | `pha-loc.ts` | 3e |
| Theo tảng, ủ, repack, truy vết | `tang/` | `tang.ts` | 3o |
| Đặt hàng nhà cung cấp (theo NCC, hoặc theo món — `theo-mon.astro`) | `dat-hang/` | `dat-hang.ts`, `ncc-mat-hang.ts` | 3l, 3t |
| NCC nào bán món nào (tự học + sửa tay), nhận hàng chọn món trước | `nhan-hang/`, `cai-dat/nha-cung-cap.astro` | `ncc-mat-hang.ts` | 3t |
| Công nợ, trả hàng, MISA | `cong-no/` | `cong-no.ts`, `misa.ts` | 3h, 3m |
| Báo cáo | `bao-cao/` | `bao-cao.ts` | 3n |
| Bán qua iPOS, ghép món FABi | `ban-ipos/`, `cai-dat/ipos.astro` | `ban-ipos.ts`, `thu-ngan.ts` | 3j |
| Mặt hàng, công thức, NCC, tồn đầu, sửa hàng loạt | `cai-dat/` | `danh-muc.ts`, `cong-thuc.ts`, `thiet-lap.ts`, `sua-nhanh.ts`, `truong-them.ts` | 3g, 3n |
| Định lượng món, định mức bếp | `cai-dat/dinh-luong.astro`, `bao-cao/dinh-muc.astro` | `dinh-luong.ts` | 3k |
| Cân TMA, mã vạch, mã giảm giá | `cai-dat/can.astro`, `cai-dat/ma-vach.astro` | `can-tma.ts`, `danh-muc-can.ts`, `ma-vach.ts`, `ma-giam.ts` | 3p, 3q |
| Máy tính bảng dùng chung, tài khoản nhân viên | `may/`, `cai-dat/nhan-vien.astro` | `may-chung.ts`, `nhan-vien.ts` | 3f |
| Hướng dẫn trong app | `huong-dan.astro` | `huong-dan.ts` | 3i |
| Sốt, gia vị, đồ uống (đếm theo cái) | (nhiều màn) | (nhiều file) | 3s |
| Còn hàng cho Mini App Zalo | `src/pages/mini-app/con-hang.json.ts` | `src/lib/mini-app.ts` | 3r |

Thêm một trang kho: làm đủ 8 bước của `KHO.md` mục 7. Câu database hiện tiếng Anh qua `src/lib/kho/cau-kho-en.ts`.

## Quy tắc riêng của web — mỗi dòng là một lỗi đã xảy ra

- Trang công khai đúng và đủ **khi chưa có database** (CI build không có `.env`): đọc database thì không bao giờ ném
  lỗi ra trang công khai, thiếu dữ liệu thì ẩn khối (mẫu: `src/lib/thuc-don.ts`).
- Chữ cố định: trang công khai đủ vi / en / ko; `/noi-bo` và kho viết `{ vi, en }` qua `dichNB` (`KHO.md` mục 7, bước 8).
  Chữ cấm: `src/lib/chuoi-cam.js` (`npm run quet` quét bản build).
- `compressHTML`: hai mẩu chữ cách nhau bằng xuống dòng bị dính ("Câu một.Câu hai.") — viết cùng dòng hoặc thêm `{' '}`
  (`KHO.md` mục 7, bước 7). `{so && <x/>}` in ra số 0.
- Giờ Việt Nam: `src/lib/gio-vn.ts` (`homNayVn`, `namVn`, `congNgay`, `docGioVnDiaPhuong`). Không tự cộng 7 tiếng.
- Ghi dữ liệu và câu báo là **cùng một `await`**: mất mạng, hết giờ, lỗi 500 không bao giờ thành câu "đã lưu".
- File `src/lib` mới đọc bảng: xếp vào `CHAY_DA_DANG_NHAP` (`crm/test/test-hop-dong-web.mjs`).
- `/noi-bo` và kho: trạng thái phân biệt bằng chữ, dấu, nét — không màu xanh hay vàng (skill thiết kế).
- Beeftown Cân đóng gói cả `src/lib/gio-vn.ts` và một số file `src/lib/kho/` (`can-tma.ts`, `chung.ts`, `danh-muc.ts`,
  `danh-muc-can.ts`, `ma-giam.ts`, `tang.ts`, `anh.ts`): sửa chúng thì chạy cả kiểm thử của `can-app/` (`can-app/CLAUDE.md`).

## Lệnh

```bash
npx astro check                              # kiểu
npm run quet                                 # build KHÔNG database rồi quét chữ cấm
npm run thu-trinh-duyet -- --khong-build     # trình duyệt thật, không database (sau npm run quet)
npm run thu-day-du                           # trình duyệt thật, Supabase giả (đã nối database)
```

Không chạy `npm run deploy` trong phiên làm việc: Khánh deploy sau khi PR gộp và CI của main xanh.
