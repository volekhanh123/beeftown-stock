# crm/ — database và kiểm thử

Phiên Claude tự nạp file này khi đọc file trong `crm/`. Quy trình chung (9 mục "xong", trước khi mở PR) ở `CLAUDE.md`
gốc. File này chỉ nói: **sửa gì thì đụng những chỗ nào** — để khỏi lục gần trăm migration và hơn trăm file test.
Lý do của từng quy tắc: `crm/README.md` (cây migration, bốn quyết định thiết kế, thứ tự chạy có ràng buộc).

## Tra trước, đừng lục

```bash
npm run tim -- kho_duyet_phieu_nhap           # hàm: các lần viết lại, bản cuối ở đâu, web gọi ở đâu, test nào nhắc, danh sách quyền
npm run tim -- kho_duyet_phieu_nhap --than    # in NGUYÊN VĂN bản cuối — chép cái này khi viết migration thay thân
npm run tim -- kho_duyet_phieu_nhap --khac    # bản cuối khác bản trước chỗ nào (rà soát migration thay thân)
npm run tim -- kho_phieu_nhap_dong            # bảng: tạo, thêm cột, policy, trigger, chỉ mục, ai đọc
npm run tim -- nhan-hang.ts                   # file: ai import, test nào nhắc
npm run tom-tat-pr                            # nhánh đang mở so với origin/main: khu đã đụng, cỡ, việc sau khi gộp
```

## Viết migration

1. Số: `npm run so-migration` (tính trên mọi nhánh `origin/*`). Tên `00NN_chu_thuong.sql`.
2. Không sửa migration đã có trên main — viết file mới (`npm run kiem-migration` chặn).
3. Thay thân một hàm: `npm run tim -- <hàm> --than` → chép nguyên văn → vá. Chỗ vá ghi chú thích `-- 00NN · lý do`
   để `--khac` và người rà soát thấy ngay chỗ đổi.
4. Giờ Việt Nam: `hom_nay_vn()`, `bay_gio_vn()`, `gio_vn()`, cắt ngày cột timestamptz bằng `ngay_vn()`.
   Không `current_date`, `now()::date`, `created_at::date` (`kiem-migration.mjs` chặn).
5. Thêm giá trị enum (`alter type … add value`): file đó **chạy RIÊNG** — thêm dòng "**`00NN` phải chạy RIÊNG**" vào
   `crm/README.md`, mục "Thứ tự chạy có ràng buộc".
6. Thêm tên file vào cây migration của `crm/README.md` (mục "Cấu trúc") — `test-quy-trinh.mjs` nhóm 5 đỏ nếu thiếu.
7. Câu `delete` trong file: ghi ở mô tả PR — Supabase MCP không chạy được khi không có người bấm xác nhận.

## Hàm mới — đủ bốn chỗ, quên chỗ nào là một test đỏ

| Hàm | Phải có |
|---|---|
| `security definer` | Kiểm vai ngay đầu thân (`kho_duoc(chi_nhanh, 'viec')`, `kho_vai_duoc(…)` hay kiểm `nhan_su` như hàm cùng khu) và `set search_path = public` |
| Ai được gọi | Revoke khỏi `public`, `anon` (và `authenticated` nếu là hàm nội bộ), như cuối `0103_kho_ipos_tu_nhan_ma_can.sql`. Xếp tên hàm vào một danh sách: `DUOC_PHEP` (`test-an-toan.mjs`, anon gọi được); `GOI_DUOC` / `NOI_BO` của `test-kho-quyen.mjs` (kho), `test-zalo.mjs`, `test-messenger.mjs` |
| Kiểm thử | Ít nhất một file test nhắc tên hàm (`test-quy-trinh.mjs` nhóm 1). Thử quyền bằng `duoi()` / `duoiAnon()` cho anon, vai khác, chi nhánh khác, `UID.nghiViec`, tài khoản không có `nhan_su` |
| Câu `raise exception` | Bản tiếng Anh: kho ở `web/src/lib/kho/cau-kho-en.ts` (`CAU_DB` câu cố định, `MAU_KHO_EN` câu có `%`), phần khác ở `web/src/lib/cau-noi-bo.ts`. Không đổi chữ câu cũ — test khớp theo chữ |

Việc chạy nền hay dịch vụ ngoài mới: đèn sức khỏe (`suc_khoe_so_lieu()` + `web/src/lib/suc-khoe.ts` +
`test-suc-khoe.mjs` danh sách `KHOA` + `web/src/lib/bao-dong-chinh-sach.ts` `NHOM`) — `CLAUDE.md` gốc, mục 9.

## Viết kiểm thử

- File mới `test/test-<khu>-<ten>.mjs` tự chạy trong `npm test` (khu: `kho`, `cong-khai`, `noi-bo`, `zalo`,
  `messenger`, `ban-le`, `tuyen-dung`, `quyen`, `suc-khoe`…). Kho thêm `test-kho-*.mjs` là `chay-kho.mjs` tự thấy.
- Khung chung `test/kho-chung.mjs`:

  ```js
  import { dungDatabase, taoBoDem, UID, maGui, taoClientPg, datGioDatabase, traGioDatabase } from './kho-chung.mjs';
  const { ok, nhom, ketThuc } = taoBoDem('TIÊU ĐỀ');
  const { db, cnA, cnB, nsId, duoi, duoiAnon, phaiLoi } = await dungDatabase();   // 2 chi nhánh, đủ vai, UID.nghiViec
  await nhom('1 · …', async () => {
    const r = await duoi(UID.thuKhoA, `select kho_x($1) as kq`, [cnA.id]);         // { rows, loi }
    ok('Thủ kho Q1 làm được', r.loi === null, r.loi ?? '');
  });
  process.exit(ketThuc('…'));
  ```

  `taoClientPg` cho client Supabase giả để gọi thẳng hàm của `web/src/lib/kho/*.ts` dưới một vai.
  Giờ giả: `datGioDatabase(db, '2026-10-01T23:50:00+07:00')` / `traGioDatabase(db)`; phía web `test/dong-ho-gia.mjs`.
- Mọi kiểm thử kho kết thúc bằng `kho_doi_soat_ton()` rỗng.
- Sửa lỗi: viết kiểm thử tái hiện trước, thấy đỏ, rồi mới sửa. Lỗi từ issue `loi-that`: tên `HỒI QUY #<số>`.
- File mẫu gần nhất cho mỗi kiểu: database `test-kho-ipos-huy-del.mjs`, database + web `test-kho-dem-cai.mjs`,
  quyền `test-kho-quyen.mjs`, giờ `test-gio-vn-database.mjs`.

## Lệnh

```bash
npm test                         # toàn bộ, song song, ~2 phút — luôn chạy trước khi mở PR
node test/test-kho-nhap.mjs      # một file
node test/chay-kho.mjs           # chỉ kho
npm run kiem-migration           # số migration, migration cũ không bị sửa, giờ VN
npm run doi-chieu                # CHỈ CHẠY TAY sau khi chạy migration lên production (README gốc)
```

`npm run thu-tai` và `npm run doi-chieu` chạm database thật — không nằm trong `npm test`, không chạy trong phiên tự động.
