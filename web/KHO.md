# Kho Beeftown — ghi chú kỹ thuật

Tài liệu cho người sửa mã phần kho (`/noi-bo/kho`). Hướng dẫn dùng cho nhân viên nằm
**trong app** ở `/noi-bo/kho/huong-dan`. Mục "Kho" trong `web/README.md` là bản tóm tắt cũ;
chỗ nào hai file nói khác nhau thì **file này đúng** (README dùng chung với phần website nên
kho không sửa nó).

---

## 1. Khung giao diện

Mọi trang kho bọc trong `layouts/Kho.astro`:

```astro
<Kho k={k} tieuDe="Tồn kho" huongDan="thu-kho" rong>
  <h1>Tồn kho</h1>
  <BaoKho bao={bao} loiDoc={loiDoc} />
  …
</Kho>
```

| Prop | Nghĩa |
|---|---|
| `k` | Kết quả `moTrangKho(Astro)` — người đang xem, chi nhánh, quyền, số đỏ (`k.viec`) |
| `tieuDe` | Chữ trên tab trình duyệt |
| `huongDan` | Mục neo trong trang Hướng dẫn cho nút "?" (bỏ trống = đầu trang) |
| `rong` | Nội dung rộng 1200px (bảng nhiều cột: báo cáo, công nợ, danh mục) |

Khung gồm:

- **Thanh trên**: logo, tên chi nhánh (chủ đổi chi nhánh bằng `?cn=`), nút "?", chuông có số
  chưa đọc, menu người dùng (các màn CRM mà vai đó được vào, Hướng dẫn, Đăng xuất).
- **Màn ≥ 1024px**: cột trái gồm các ô biểu tượng có số đỏ, và danh sách "Thao tác nhanh" bên dưới.
- **Màn < 1024px**: thanh đáy 5 nút, nút giữa "Quét" nổi lên. Có chừa `safe-area` cho iPhone.
  Thanh nút lưu (`.kho-thanh-nut.dinh`) dính ngay trên thanh đáy.

Dữ liệu menu ở `lib/kho/dieu-huong.ts` (file thuần, test được bằng Node):

| Vai | Thanh đáy |
|---|---|
| Thủ kho | Trang chủ · Việc · Quét · Tồn kho · Khác |
| NV quầy | Quầy · Việc · Quét · Ở quầy · Khác |
| Quản lý, Chủ | Hôm nay · Duyệt · Quét · Tồn kho · Khác |
| Kế toán | Trang chủ · Công nợ · Nhập hàng · Báo cáo · Khác |

Mỗi ô ghi **quyền cần có** (`quyen`, cần một trong các quyền) — phải khớp với dòng chặn ở đầu
trang đó. `test-kho-giao-dien.mjs` so hai chỗ này: không vai nào thấy một ô rồi bấm vào lại
bị đá ra.

Biểu tượng: `lib/kho/bieu-tuong.ts` (đường vẽ SVG 24×24) + `components/kho/BieuTuong.astro`.
Màu và khoảng cách: `styles/kho-khung.css` (giao diện sáng, token `--kho-*` dưới `.kho-than`).
`styles/kho.css` giữ các lớp cũ của form và bảng.

## 2. Số đỏ, chuông, việc cần làm (migration 0030)

Một lần gọi `kho_dem_viec(chi_nhanh)` trả **mọi con số đỏ** của người đang xem. `trang.ts`
gọi nó song song với danh sách chi nhánh, nên không thêm lượt chờ nào.

- Khóa nào người xem không có quyền thì **vắng mặt** (không phải 0). Kết quả chỉ có số đếm,
  không có tiền.
- `chua_doc`: số thông báo chưa đọc (cho chuông). `khoi_tao`: chi nhánh đã bắt đầu dùng kho chưa.

Sự kiện thông báo **không lưu thành bảng**. Hàm nội bộ `kho_su_kien` suy ra sự kiện từ chính
chứng từ: phiếu bị trả về, lô hết hạn, nợ quá hạn… Nhờ vậy sự kiện không bao giờ lệch với sổ.
`kho_thong_bao` trả 30 ngày gần nhất và đánh dấu `chua_doc` theo mốc `kho_nguoi_xem`.
`kho_da_xem_thong_bao` dời mốc đó (mở trang chuông là đã đọc).

Câu chữ và link "làm ngay" của từng khóa nằm ở `lib/kho/viec.ts` — sửa câu không cần viết
migration.

**Thêm một loại sự kiện mới:**
1. Viết migration mới dựng lại `kho_su_kien`, thêm nhánh `select '<khóa>', '<nhóm>', …`
   (có kiểm quyền như các nhánh khác). Nếu cần số đỏ thì thêm khóa vào `kho_dem_viec`.
2. Thêm `case '<khóa>'` vào `cauSuKien` và thêm khóa vào `KHOA_SU_KIEN` (`viec.ts`).
3. Nếu có số đỏ: gắn khóa vào `dem` của ô menu (`dieu-huong.ts`) hoặc của bước quy trình
   (`quy-trinh.ts`).
4. `test-kho-giao-dien.mjs` báo hỏng nếu thiếu bước 2 hoặc dùng một khóa đếm không có thật.

**Ngưỡng cảnh báo** (cột trên `kho_cai_dat`, lưu bằng `kho_luu_nguong`, cần quyền `danh_muc`):
`nguong_gia_mua_pt` (5%), `nguong_thu_hoi_diem` (3 điểm), `gio_nhac_chuyen` (2 giờ),
`gio_chot_ngay` (6 giờ sáng), `nguong_dinh_muc_pt` (10%). Tên tiếng Việt ở `TEN_NGUONG`
(`lib/kho/thong-bao.ts`).

## 3. Các trang trung tâm

| Trang | Việc |
|---|---|
| `/noi-bo/kho` | Trang chủ **theo vai**: NV quầy "Quầy hôm nay" (hết hạn phải bỏ, **xếp ra bán trước**, quầy sắp hết); thủ kho "Việc hôm nay"; quản lý/chủ "Hôm nay" có thẻ `?tab=quan-tri` (chỉ số từ `kho_chi_so_quan_tri`); kế toán: công nợ |
| `/noi-bo/kho/viec` | Việc cần làm: "Làm ngay" (đỏ) và "Nên làm sớm" (vàng), mỗi việc một nút |
| `/noi-bo/kho/thong-bao` | Chuông: mọi sự kiện 30 ngày, chia thẻ Vận hành / Nhắc nhở / Hệ thống |
| `/noi-bo/kho/duyet` | Hộp duyệt chung (quyền `duyet`): phiếu nhập, báo hủy, kiểm kê — cũ nhất lên trước. Duyệt xong quay về đây |
| `/noi-bo/kho/quet` | Quét một nhãn → món gì, còn bao nhiêu ở đâu, lô nào hạn gần, nút làm tiếp |
| `/noi-bo/kho/quy-trinh` | Các bước của từng nghiệp vụ (`lib/kho/quy-trinh.ts`), bước đang có việc hiện số đỏ |
| `/noi-bo/kho/khac` | Mọi ô menu cho màn nhỏ, các màn CRM, đăng xuất |
| `/noi-bo/kho/huong-dan` | Hướng dẫn trong app (nút "?" trỏ tới các mục ở đây) |

"Xếp ra bán trước" (`goiYXepQuay` trong `lib/kho/trang-chu.ts`): Beeftown **không giảm giá**
hàng sắp hết hạn. Thay vào đó, mỗi món ở quầy chỉ ra lô còn hạn gần nhất để xếp lên trước.

Link dùng chung giữa các trang (trang nhận phải đọc được các tham số này):

- `/noi-bo/kho/xuat/moi?loai=chuyen|xuat_bep|huy&tu=<vị trí>&lo=<lô>&mh=<mặt hàng>` — mở sẵn phiếu
- `/noi-bo/kho/ton?han=het_han|sap_het` (hai lọc **riêng**, không gộp) `&duoi_muc=1&vi_tri=quay&q=…`
- `/noi-bo/kho/nhap?loc=nhap|cho_duyet|tu_choi`, `/noi-bo/kho/pha-loc?loc=nhap`
- `/noi-bo/kho/cong-no?loc=qua_han|den_han|chua_doi_chieu`

## 3b. Danh sách phiếu, trang in (GĐ4b)

- **Tìm / lọc ngày / của tôi / chia trang** ở Nhập hàng, Chuyển · Xuất · Hủy, Kiểm kê, Pha lóc:
  `lib/kho/tim-ds.ts` (thuần) + `components/kho/LocDanhSach.astro` + `PhanTrang.astro`. Mọi thứ nằm
  trên URL (`?q=&tu=&den=&cua_toi=1&trang=`) — gửi link qua Zalo là người nhận thấy đúng danh sách đó.
  Mỗi trang 30 phiếu; đọc dư 1 dòng để biết còn trang sau, không đếm tổng. Chữ tìm được làm sạch
  (`lamSachTim`) trước khi ghép vào `.or()` của PostgREST.
- Tìm theo chữ có dấu phân biệt dấu: "thit" không ra "Thịt". Gõ số phiếu là chắc nhất.
- **Trang in**: phiếu nhập, biên bản hủy / phiếu chuyển / xuất bếp / trả NCC, biên bản kiểm kê. Đầu
  trang in (`InDau.astro`), hàng chữ ký (`KyTen.astro`) chỉ hiện khi in; `@media print` trong
  `kho-khung.css` bỏ thanh trên, menu, nút, mục gập, ô duyệt. Nút "In phiếu" (`NutIn.astro` +
  `public/kho/js/in-an.js`) chỉ hiện khi có JavaScript; không có thì in bằng menu trình duyệt.
- NV quầy xem **Tồn kho** chỉ thấy hàng ở quầy và hàng chờ hủy (`?vi_tri=kho` bị bỏ qua).
- Đăng nhập xong vào thẳng `/noi-bo/kho` (sửa 1 dòng `pages/noi-bo/dang-nhap.astro`). Vai không
  có quyền kho (thu ngân, marketing) bị `moTrangKho` đưa về `/noi-bo` như cũ.

## 4. Cài như app (PWA)

`public/kho/manifest.json`: mở `/noi-bo/kho?nguon=app`, trong phạm vi `/noi-bo/`, chạy như app riêng
(không thanh địa chỉ). Có lối tắt Quét / Việc / Tồn kho khi nhấn giữ biểu tượng trên Android.

- **Android (Chrome)**: menu ⋮ → "Cài đặt ứng dụng" / "Thêm vào màn hình chính".
- **iPhone/iPad (Safari)**: nút Chia sẻ → "Thêm vào MH chính".

Biểu tượng `public/kho/bieu-tuong-{180,192,512,maskable-512}.png` dựng từ đầu bò trong
`public/bieu-tuong.svg` bằng Chromium (180 cho iPhone; maskable thu nhỏ vào vùng an toàn 80%
để Android bo tròn không cắt mất sừng). `.gitignore` chặn mọi `*.png` và chỉ mở đúng
`/web/public/kho/*.png`. Khi designer giao logo chính thức: dựng lại 4 file, giữ đúng cỡ
(test đọc cỡ ảnh trong file PNG).

**Chưa có service worker** — mất mạng thì app báo lỗi như trang web thường. Chế độ ngoại tuyến
cần hàng đợi phiếu phía máy và xử lý trùng; chưa làm.

## 5. JavaScript: chỉ để tăng cường

Mọi trang kho **chạy đủ khi tắt JavaScript**: form POST, lưu xong chuyển hướng 303 (F5 không
gửi lại), `ma_gui` chống bấm hai lần, `phien_ban` chống hai máy đè nhau. JavaScript chỉ được
dùng ở:

| Chỗ | Để làm gì |
|---|---|
| `components/kho/QuetMa.astro` (script trong file) | Camera đọc mã (Chrome Android), đếm gói trùng mã, bấm "Xong" tự gửi form |
| `public/kho/js/ean13.js` | (GĐ5b) Giải mã EAN-13 bằng JS thuần cho iPhone — Safari không có `BarcodeDetector` |
| `public/kho/js/anh-nho.js` | (GĐ5a) Thu ảnh hóa đơn ≤ 1600px trước khi tải |
| `public/kho/js/may-chung.js` | (GĐ5d) Đếm giờ tự khóa máy dùng chung |
| `public/kho/js/in-an.js` | Hiện nút "In phiếu" và gọi `window.print()` (GĐ4b); sau này in đơn đặt hàng (GĐ8a) |

Không thêm thư viện npm cho phía trình duyệt. `test-kho-giao-dien.mjs` hỏng nếu có `<script>`,
`onclick=…` hay file JS ngoài danh sách này.

## 6. Vai máy (dành chỗ sẵn, migration 0029)

`may_chung` (tablet dùng chung ở quầy/bếp, đổi người bằng PIN — GĐ5d) và `may_ipos` (tài khoản
đồng bộ bán hàng iPOS — GĐ7a). Hai giá trị enum được thêm ở **file riêng chạy một mình** vì
Postgres không cho dùng giá trị enum mới trong cùng giao dịch vừa thêm nó. Hiện hai vai này
**không đọc được gì** (test-kho-quyen kiểm).

## 7. Thêm một trang kho mới — danh sách kiểm

1. Đầu trang: `const k = await moTrangKho(Astro); if (k instanceof Response) return k;`
   rồi một dòng chặn quyền `if (!k.duoc('…')) return Astro.redirect('/noi-bo/kho', 302);`.
2. Bọc trong `<Kho k={k} tieuDe="…">`, có `<h1>` và `<BaoKho>`.
3. Form: POST + ô ẩn `viec`; thành công → `chuyenHuong(Astro, url, kq)`. Form tạo chứng từ có
   `ma_gui`; form sửa có `phien_ban`.
4. Chữ cho nhân viên: tiếng Việt đơn giản, không thuật ngữ ("hạn gần bán trước", không "FEFO").
   Nút ≥ 48px, ô nhập cỡ chữ 16px (iPhone không tự phóng to).
5. Nếu có ô menu: thêm vào `MUC_KHO` với đúng quyền của dòng chặn; nếu có số đỏ thì ghi `dem`.
6. File `lib/kho/*.ts` mới gọi database → thêm vào `CHAY_DA_DANG_NHAP` trong
   `crm/test/test-hop-dong-web.mjs`. Gọi RPC bằng object viết thẳng `.rpc('x', { p_… })`,
   `.select('…')` nháy đơn và không ép kiểu `::`.
7. Bẫy của Astro: khoảng trắng giữa `{biểu thức}` và chữ ở dòng sau bị nuốt — viết `{' '}`;
   `{soLuong && <x/>}` in ra số 0 — viết `soLuong > 0 && …`.

## 8. Kiểm thử

```bash
cd crm && npm test                    # toàn bộ; phần kho chạy qua test/chay-kho.mjs
node test/chay-kho.mjs                # chỉ kho: tự tìm mọi test-kho-*.mjs
node test/test-kho-giao-dien.mjs      # menu, link, manifest, JavaScript (không cần database)
node test/test-kho-viec.mjs           # số đỏ, thông báo, ngưỡng, chỉ số quản trị
cd ../web && npm run kiem-tra && npm run quet && npm run build
```

Test database chạy trên PGlite (Postgres trong Node), **không bao giờ** chạm Supabase thật.
Thêm file `test-kho-<tên>.mjs` là `chay-kho.mjs` tự chạy — không sửa `package.json`.
