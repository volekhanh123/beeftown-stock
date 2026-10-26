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
| `huongDan` | id mục trong `lib/kho/huong-dan.ts` cho nút "?" — **mọi trang kho phải có** (test kiểm), xem mục 3i |
| `rong` | Nội dung rộng 1200px (bảng nhiều cột: báo cáo, công nợ, danh mục) |

Khung gồm:

- **Thanh trên**: brandmark trắng (`public/thuong-hieu/dau-bo-trang.svg`), tên chi nhánh (chủ đổi chi nhánh bằng `?cn=`; ở điện thoại ≤ 640px nút
  "Đổi chi nhánh" nằm trong menu người dùng — trên thanh trên nó đè lên chữ "Kho"), nút "?",
  chuông có số chưa đọc, menu người dùng (các màn CRM mà vai đó được vào, Hướng dẫn, Đăng xuất).
- **Màn ≥ 1024px**: cột trái — ô "Tìm chức năng" (gửi về trang Khác), rồi các mục **theo nhóm**
  (`NHOM_KHO`: Hằng ngày · Tồn kho · Mua và nhận hàng · Pha lóc, quầy, xuất · Tiền và báo cáo ·
  Thiết lập và trợ giúp) có số đỏ. Dùng chuột thì dòng cao 36px, ngón tay (iPad ngang) 44px.
  "Thao tác nhanh" (nút lập phiếu mới) chỉ ở trang chủ — từ 22/10/2026 cột trái và trang Khác không in
  lặp lại; ô tìm vẫn tìm ra chúng. Chủ / quản lý chỉ có nút lập mới (Đặt hàng, Lập phiếu nhập, Báo hủy).
- **Màn < 1024px**: thanh đáy 5 nút, nút giữa "Quét" nổi lên. Có chừa `safe-area` cho iPhone.
  Thanh nút lưu (`.kho-thanh-nut.dinh`) dính ngay trên thanh đáy.
- **Trang Khác** (`/noi-bo/kho/khac`, nút cuối thanh đáy): ô tìm, mọi ô theo
  nhóm, rồi "Phần khác của nhà hàng" (quản lý, chủ). Dữ liệu ở `lib/ban-do-chuc-nang.ts`, vẽ bằng
  `components/BanDoChucNang.astro` — dùng chung với `/noi-bo/chuc-nang` bên khung nhà hàng. Ô tìm là
  form GET, không JavaScript: chữ gõ không dấu so không dấu ("cong no" ra Công nợ), chữ có dấu so
  đúng dấu ("hùy" không ra Hủy). Máy tính bảng dùng chung: không phần nhà hàng, "Khóa máy" thay "Đăng xuất".

Dữ liệu menu ở `lib/kho/dieu-huong.ts` (file thuần, test được bằng Node):

| Vai | Thanh đáy |
|---|---|
| Thủ kho | Trang chủ · Việc · Quét · Tồn kho · Khác |
| NV quầy | Quầy · Việc · Quét · Ở quầy · Khác |
| Quản lý, Chủ | Hôm nay · Duyệt · Quét · Tồn kho · Khác |
| Kế toán | Trang chủ · Duyệt · Công nợ · Nhập hàng · Khác (Báo cáo nằm trong Khác) |

**Gọn menu (22/10/2026): 25 ô còn 15.** Trang ít mở hoặc là một góc của trang khác là **mục con**
(`cha: '<mã ô>'` trong `MUC_KHO`): không in trên cột trái và trang Khác, nhưng ô tìm vẫn ra (kèm nhóm của
ô cha), mở nó thì ô cha sáng (`dangO`: ô khớp đường dài nhất thắng), và trang cha cùng các trang con có
hàng thẻ `components/kho/TheTrangCon.astro` (lớp `.kho-the-chon`) ngay trên `h1`:

| Ô menu | Mục con (thẻ) |
|---|---|
| Tồn kho | Tảng · ủ |
| Quầy (`/quay/yeu-cau`, số đỏ = yêu cầu chờ + hàng đang mang ra) | Quầy cần hàng · Nhận hàng ra quầy |
| Báo cáo (số đỏ = Bán hàng iPOS + Định mức bếp) | Bán hàng iPOS · Định mức bếp |
| Thiết lập | Mặt hàng · Định lượng món |
| Hướng dẫn | Quy trình · Ai làm được gì (đường nằm dưới `/cai-dat` nhưng ô Thiết lập không sáng) |

Ô **Nhận hàng** có `anKhiCo: ['xem_gia']`: chủ, quản lý không thấy nó — ô **Nhập hàng** của họ gồm cả
`/nhan-hang` (`khop`). Thủ kho vẫn thấy Nhận hàng, kế toán vẫn thấy Nhập hàng. Mục con mới: thêm dòng có
`cha`, thêm `<TheTrangCon k={k} cha="…" />` vào trang (`test-kho-giao-dien.mjs` nhóm 2 kiểm đủ trang).

Mỗi ô ghi **quyền cần có** (`quyen`, cần một trong các quyền) — phải khớp với dòng chặn ở đầu
trang đó. `test-kho-giao-dien.mjs` so hai chỗ này: không vai nào thấy một ô rồi bấm vào lại
bị đá ra. Mỗi ô thuộc đúng một nhóm (`nhom`), mục con không có nhóm; từ khóa cho ô tìm ở `TU_KHOA_KHO`.
`test-noi-bo-dieu-huong.mjs` kiểm nhóm không thêm / bớt ô nào so với quyền, và ô tìm chỉ ra mục vai
được thấy. Các màn nhà hàng trong menu người dùng (`MUC_CRM`) dựng từ `lib/dieu-huong-noi-bo.ts`.

Biểu tượng: `lib/kho/bieu-tuong.ts` (đường vẽ SVG 24×24) + `components/kho/BieuTuong.astro`.
Màu và khoảng cách: `styles/kho-khung.css` (giao diện sáng, token `--kho-*` dưới `.kho-than`).
`styles/kho.css` giữ các lớp cũ của form và bảng.

**Màu** là bảng 22/10/2026 (`THUONG-HIEU.md` ở gốc repo, mục 1 và 4; kho đổi ở PR "Đổi nhận diện
website", cùng lúc với `/noi-bo`): nền trang xám nhạt `#F4F4F4`, thẻ và ô nhập trắng, thanh trên đen, đỏ
dành cho số báo việc, nút chính và trạng thái "làm ngay".

- Hai bề mặt khai trên `.nb-than` (`styles/noi-bo.css`): `--nb-nen` (xám nhạt, nền trang), `--nb-the`
  (trắng: thẻ, bảng, thanh đáy, menu thả, hộp thoại). Ô của trình duyệt — ô nhập không lớp riêng, ô
  đánh dấu, ô chọn một, nút "Chọn tệp" — đã có nền trắng sẵn; ô đánh dấu và ô chọn một tự vẽ. Trang chỉ
  đặt cỡ ô, không đặt màu, không `accent-color`.
- Token `--kho-*` không phải sắc riêng: `--kho-nen` là `--nb-nen`, `--kho-the` là `--nb-the`,
  `--kho-vach` là `--vach` (`#E2E2E2`), `--kho-vach-dam` là `--vien-o` (`#767676`).
- **Không có màu trạng thái** (Khánh bỏ xanh, vàng, đỏ nhạt ngày 25/10/2026): trạng thái vẽ bằng bảy kiểu
  K1–K7 trong `styles/noi-bo.css` (`THUONG-HIEU.md` mục 4) — đỏ đặc / viền đỏ = làm ngay, đen đặc = nháp,
  viền đen + ✓ = xong, xám + vòng tròn "!" = lưu ý, nét đứt = tắt, viền mảnh = thuộc tính.
- Trang kho **chỉ dùng biến**, không gõ mã màu, không `var()` kèm mã dự phòng. Hai trạng thái cạnh nhau
  phải khác nhau ở chữ, dấu hay nét — đỏ với `#555555` chỉ chênh 1,12 : 1. Viền ô nhập và nút phụ là
  `--vien-o`.
- `crm/test/test-noi-bo-bang-mau.mjs` gác: mã của bảng, biến chưa khai, mã cũ còn sót, chỉ mã của bảng,
  ô của trình duyệt, tương phản, viền ô nhập, bản in chỉ đen trắng, trạng thái không chỉ khác bằng màu
  (nhóm 7); `crm/test/test-noi-bo-trang-thai.mjs` gác nhãn có chữ và câu không gọi tên màu.
- Trong file này "câu vàng", "đèn đỏ / vàng / xanh / xám" là **mức** dữ liệu (`'do' | 'vang' | 'xanh' |
  'tat'` hay `'xam'`); từ PR "Đổi nhận diện website" màn hình vẽ mức bằng chữ, dấu, nét: khung lưu ý
  (vòng tròn "!"), **Xử lý ngay** (tam giác đỏ), **Xem hôm nay** (hình thoi xám), **Ổn** (chấm đen),
  **Chưa bật** (vòng rỗng).

## 2. Số đỏ, chuông, việc cần làm (migration 0030)

Một lần gọi `kho_dem_viec(chi_nhanh)` trả **mọi con số đỏ** của người đang xem. `trang.ts`
gọi nó song song với danh sách chi nhánh, nên không thêm lượt chờ nào.

- Khóa nào người xem không có quyền thì **vắng mặt** (không phải 0). Kết quả chỉ có số đếm,
  không có tiền.
- `chua_doc`: số thông báo chưa đọc (cho chuông). `khoi_tao`: chi nhánh đã bắt đầu dùng kho chưa.

Sự kiện thông báo **không lưu thành bảng**. Hàm nội bộ `kho_su_kien` suy ra sự kiện từ chính
chứng từ: phiếu bị trả về, lô hết hạn, nợ quá hạn… Nhờ vậy sự kiện không bao giờ lệch với sổ.
`kho_thong_bao` trả 30 ngày gần nhất và đánh dấu `chua_doc` theo mốc `kho_nguoi_xem`.

**Gom việc cùng loại (22/10/2026, migration 0092).** `gomSuKien` (`lib/kho/viec.ts`): khóa có ≥ `NGUONG_GOM`
(3) sự kiện thành một dòng (`cauNhomSuKien`: "9 lô hết hạn", nút dẫn tới trang danh sách đã lọc — Tồn kho
`?han=het_han`, Công nợ `?loc=qua_han`…), ít hơn thì từng dòng; `ncc_doi_tai_khoan` không bao giờ gom
(`KHOA_KHONG_GOM`). Dùng ở Việc cần làm (30 ngày), trang chủ (chỉ "Làm ngay", tối đa 5 dòng) và chuông
(`NGAY_CHUONG` = 7 ngày). Số đỏ trên chuông (`chua_doc` của `kho_dem_viec`, 0092) đếm đúng số dòng chuông có tin
chưa đọc — đổi luật gom thì viết migration mới cho khớp (`test-kho-viec.mjs` nhóm 7b, `test-kho-giao-dien.mjs`
nhóm 4 so hai bên). Cả `chua_doc` lẫn `viec_dong` chỉ đếm 300 sự kiện mới nhất của 30 ngày — đúng phần
`kho_thong_bao` trả; chuông, Việc cần làm, Trang chủ đều đọc 300. `gomSuKien` tính câu gom một lần mỗi khóa.
Báo hủy bị từ chối gom lại dẫn tới `/xuat?loc=huy_tu_choi` (lọc ẩn `LOC_AN` của `xuat/index.astro`: loại hủy và
trạng thái từ chối; thẻ lọc chỉ hiện khi đang lọc).
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
(`lib/kho/thong-bao.ts`). Form sửa: thẻ "Ngưỡng cảnh báo" (`#nguong`) trên màn Thiết lập (mục 3g).

## 3. Các trang trung tâm

| Trang | Việc |
|---|---|
| `/noi-bo/kho` | Trang chủ **theo vai**: NV quầy "Quầy hôm nay" (hết hạn phải bỏ, **xếp ra bán trước**, quầy sắp hết); thủ kho "Việc hôm nay"; quản lý/chủ "Hôm nay" có thẻ `?tab=quan-tri` (chỉ số từ `kho_chi_so_quan_tri`); kế toán: công nợ |
| `/noi-bo/kho/viec` | Việc cần làm: "Làm ngay" (viền đỏ, tam giác) và "Nên làm sớm" (vạch xám, vòng tròn "!"), mỗi việc một nút |
| `/noi-bo/kho/thong-bao` | Chuông: sự kiện 7 ngày, gom cùng loại, chia thẻ Vận hành / Nhắc nhở / Hệ thống |
| `/noi-bo/kho/duyet` | Hộp duyệt chung (quyền `duyet` hoặc `duyet_nhap`): phiếu nhập (điền giá rồi duyệt), báo hủy, kiểm kê — cũ nhất lên trước. Kế toán (`duyet_nhap`) chỉ thấy phiếu nhập. Duyệt xong quay về đây |
| `/noi-bo/kho/nhan-hang` | Nhận hàng 3 bước của thủ kho (quyền `nhap`, **chỉ kg**, migration 0031): `moi` chụp hóa đơn + chọn người giao → `<id>` cân từng món → `<id>?buoc=gui` xem lại, gửi. Người có `nhap` mà không `xem_gia` mở `/noi-bo/kho/nhap/*` bị chuyển sang đây |
| `/noi-bo/kho/nhap/<id>` | Vai xem giá. Người có `duyet_nhap` mở phiếu chờ duyệt → màn **điền giá**: ảnh hóa đơn lớn, ô đơn giá từng dòng, chip so với lần nhập trước (`kho_so_sanh_gia_nhap`, đỏ khi vượt `nguong_gia_mua_pt`), [Lưu giá] [Duyệt]. `?soan=1`: quản lý sửa cả dòng hàng |
| `/noi-bo/kho/quet` | Quét một nhãn → món gì, còn bao nhiêu ở đâu, lô nào hạn gần, nút làm tiếp (theo vai, xem 3d) |
| `/noi-bo/kho/quy-trinh` | Các bước của từng nghiệp vụ (`lib/kho/quy-trinh.ts`), bước đang có việc hiện số đỏ |
| `/noi-bo/kho/khac` | Mọi ô menu cho màn nhỏ, các màn CRM, đăng xuất |
| `/noi-bo/kho/huong-dan` | Hướng dẫn trong app, lọc theo vai `?vai=` (nút "?" trỏ tới các mục ở đây — mục 3i) |
| `/noi-bo/kho/bao-cao` | Trung tâm báo cáo (GĐ8c, mục 3n): mốc nhanh, tóm tắt kỳ, thẻ báo cáo ẩn theo quyền |
| `/noi-bo/kho/cai-dat/quyen` | Ai làm được gì — bảng vai × việc bằng lời (mục 3n) |

"Xếp ra bán trước" (`goiYXepQuay` trong `lib/kho/trang-chu.ts`): mỗi món ở quầy chỉ ra lô còn hạn gần
nhất để xếp lên trước. Từ 0054 chủ cho **giảm giá hàng cận date bằng mã cân riêng** (mục 3p) — xếp trước
vẫn là việc đầu tiên, mã giảm là thêm.

Link dùng chung giữa các trang (trang nhận phải đọc được các tham số này):

- `/noi-bo/kho/xuat/moi?loai=chuyen|xuat_bep|huy|xuat_khac&tu=<vị trí>&lo=<lô>&mh=<mặt hàng>` — mở sẵn phiếu
- `/noi-bo/kho/ton?han=het_han|sap_het` (hai lọc **riêng**, không gộp) `&duoi_muc=1&vi_tri=quay&q=…`
- `/noi-bo/kho/nhap?loc=nhap|cho_duyet|tu_choi` (vai xem giá), `/noi-bo/kho/nhan-hang?loc=nhap|cho_duyet|tu_choi|da_duyet`
  (thủ kho), `/noi-bo/kho/nhan-hang/moi?loai=ton_dau`, `/noi-bo/kho/pha-loc?loc=nhap`,
  `/noi-bo/kho/pha-loc/<id>?buoc=ket-qua|xong&ma=<mã>`, `/noi-bo/kho/the-kho/<mặt hàng>?vi_tri=&tu=&den=`
- `/noi-bo/kho/cong-no?tab=ncc|phieu|thanh-toan|theo-doi&loc=qua_han|den_han|chua_doi_chieu|gop` (`?loc=` không `tab` = thẻ Theo phiếu),
  `/noi-bo/kho/cong-no/tra-hang?lo=<lô>&vi_tri=<nơi>` (trả hàng chỉ kg), `/noi-bo/kho/cong-no/<ncc>/tra-tien?kieu=<cách trả>`

## 3b. Danh sách phiếu, trang in (GĐ4b)

- **Tìm / lọc ngày / của tôi / chia trang** ở Nhập hàng, Chuyển · Xuất · Hủy, Kiểm kê, Pha lóc:
  `lib/kho/tim-ds.ts` (thuần) + `components/kho/LocDanhSach.astro` + `PhanTrang.astro`. Mọi thứ nằm
  trên URL (`?q=&tu=&den=&cua_toi=1&trang=`) — gửi link qua Zalo là người nhận thấy đúng danh sách đó.
  Mỗi trang 30 phiếu; đọc dư 1 dòng để biết còn trang sau, không đếm tổng. Chữ tìm được làm sạch
  (`lamSachTim`) trước khi ghép vào `.or()` của PostgREST.
- Tìm theo chữ có dấu phân biệt dấu: "thit" không ra "Thịt". Gõ số phiếu là chắc nhất.
- **Danh sách đọc trọn** (tồn kho, giá trị tồn, thẻ kho, công nợ theo kỳ, MISA, sổ thanh toán, mã iPOS chưa ghép,
  nhãn đã quét): Supabase trả tối đa **1.000 dòng mỗi lần đọc**, cả bảng lẫn hàm rpc — `.limit(2000)` không vượt
  được, phần thừa mất lặng lẽ. Đọc bằng `docTungTrang` (`lib/kho/chung.ts`): `.range()` từng trang tới khi đủ tổng số
  dòng database báo — `select(…, { count: 'exact' })` / `rpc(…, …, { count: 'exact' })`, nên Max rows bị hạ dưới 1.000
  vẫn đọc đủ; truy vấn phải `.order()` đủ cột để không hai dòng ngang nhau. Quá 100.000 dòng thì báo lỗi, không cắt.
  Kiểm thử: `crm/test/test-kho-doc-het-trang-web.mjs` (client giả trần 1.000 dòng — PGlite không đi qua PostgREST).
- **Trang in**: phiếu nhập, biên bản hủy / phiếu chuyển / xuất bếp / trả NCC, biên bản kiểm kê. Đầu
  trang in (`InDau.astro`), hàng chữ ký (`KyTen.astro`) chỉ hiện khi in; `@media print` trong
  `kho-khung.css` bỏ thanh trên, menu, nút, mục gập, ô duyệt. Nút "In phiếu" (`NutIn.astro` +
  `public/kho/js/in-an.js`) chỉ hiện khi có JavaScript; không có thì in bằng menu trình duyệt.
- NV quầy xem **Tồn kho** chỉ thấy hàng ở quầy và hàng chờ hủy (`?vi_tri=kho` bị bỏ qua).
- Đăng nhập xong vào thẳng `/noi-bo/kho` (sửa 1 dòng `pages/noi-bo/dang-nhap.astro`). Vai không
  có quyền kho (thu ngân, marketing) bị `moTrangKho` đưa về `/noi-bo` như cũ.

## 3c. Quầy: yêu cầu → mang ra → bấm nhận · đếm cộng dồn · xuất khác (GĐ5b, migration 0032)

| Trang | Ai | Việc |
|---|---|---|
| `/noi-bo/kho/quay/yeu-cau` | NV quầy (quản lý gửi thay được); thủ kho xem danh sách chờ | Gửi yêu cầu: danh sách món sắp hết từ `kho_goi_y_ra_quay` có sẵn số gói nên lấy, sửa được, ghi 0 là bỏ; thêm món khác. Nhiều quầy: `?vt=<quầy>` |
| `/noi-bo/kho/quay/yeu-cau/<id>` | Thủ kho | "Mang ra quầy" = `kho_chuyen_theo_yeu_cau` (hạn gần lấy trước, sửa số được, chọn kho lấy); hủy yêu cầu khi chưa mang; hủy chuyến khi quầy chưa nhận |
| `/noi-bo/kho/quay/nhan` | NV quầy | "Đã nhận đủ" một chạm, hoặc `?thieu=<phiếu>` ghi số thực nhận. Người mang ra không thấy nút nhận. Quá `gio_nhac_chuyen` giờ thì thẻ đỏ |
| `/noi-bo/kho/quay/dem` | NV quầy (`van_hanh`) | Đếm quầy cuối ngày, quét cộng dồn (dưới đây). `?vi_tri=<quầy>` |
| `/noi-bo/kho/xuat/moi?loai=xuat_khac` | `van_hanh` | Xuất khác (dùng nội bộ, tặng khách, hàng mẫu…): bắt buộc lý do, số `XK-`, chỉ hàng còn hạn |
| `/noi-bo/kho/xuat/moi?loai=huy` | `van_hanh` | Báo hủy 3 bước trong **một form**: Hàng → Lý do (nút lớn) → Ảnh và gửi; ô ẩn `buoc` giữ bước, ảnh đã tải đi theo `anh_da_tai`, `ma_gui` giữ nguyên |
| `/noi-bo/kho/xuat/<id>` | Quản lý (`duyet`) | Phiếu chuyển `nhan_thieu`: "Trả về kho" / "Ghi mất" (`kho_xu_ly_chuyen_thieu`) |

**Hàng đi đường.** Mỗi chi nhánh có một vị trí loại `dang_chuyen` ("Đang mang ra quầy"), do
`kho_khoi_tao` tạo — không đổi loại, không tắt được (màn Vị trí coi nó như "chờ hủy"). Khi bật
công tắc **"Quầy phải bấm nhận hàng"** (`kho_cai_dat.chuyen_quay_can_nhan`, màn Cài đặt; DB mặc
định tắt) thì phiếu chuyển kho → quầy của người **không phải** NV quầy đưa hàng vào `dang_chuyen`
(phiếu trạng thái `dang_chuyen`); NV quầy bấm nhận mới vào quầy (`da_nhan`), thiếu thì `nhan_thieu`
→ quản lý trả về kho (`da_tra_ve`) hoặc ghi mất. NV quầy tự lấy ("Tự lấy hàng") vẫn vào thẳng.

- `dang_chuyen` **không phải chỗ để hàng**: trigger chặn nó làm nguồn/đích của phiếu xuất, kiểm kê,
  pha lóc; nhập hàng chỉ nhận kho/quầy. Trên web: mọi ô chọn vị trí và danh sách lô để lấy phải bỏ
  cả `cho_huy` lẫn `dang_chuyen` (`laNoiDeHang` trong `xuat.ts`); `viecVoiLo` (`ton.ts`) không cho
  nút nào với hàng đi đường. Tồn kho "Mọi nơi" vẫn hiện dòng "Đang mang ra quầy" để biết hàng ở đâu.
- Còn hàng đi đường vào một quầy thì chưa gửi / duyệt được kiểm kê quầy đó — nhận trước.
- Khóa sự kiện mới: `yeu_cau_quay` (thủ kho), `hang_dang_chuyen` (quầy; `phu = 'qua_gio'` là đỏ),
  `chuyen_nhan_thieu` (quản lý, mở `/noi-bo/kho/xuat/<id>`). Câu chữ ở `viec.ts`.

**Đếm quầy cộng dồn.** Mỗi lần bấm "Cộng vào số đếm" là một **lượt** `kho_quet_kiem_ke(p_id,
p_ma_gui, p_ma)`: web gửi **chuỗi mã thô** như máy quét gõ ra, database giải mã theo mẫu mã vạch
(như `lib/kho/ma-vach.ts`) và ghi mỗi nhãn một dòng (`kho_kiem_ke_quet`). `ma_gui` là khóa của
lượt → gửi lại (mạng chập, F5) không cộng đôi; lỗi thì trang hiện lại các mã trong ô với **cùng**
`ma_gui`. Hai máy quét cùng lúc vẫn cộng đúng (khóa phiếu). Sửa: `kho_bo_quet_kiem_ke` (`lan_cuoi`
bỏ lượt gần nhất của mình, `bot_mot` −1 gói, `xoa_mon`). "Quét xong" → món chưa thấy gói nào →
`kho_het_hang_con_lai(p_id, p_phien_ban)` ghi = 0 một chạm rồi gửi. Màn cảm ơn không có sổ/chênh.
Ở phiếu kiểm kê đầy đủ, số gõ tay **cộng thêm** vào số nhãn đã quét (`so_goi_them`).

**Báo cáo.** Xuất – nhập – tồn gọi `kho_bao_cao_xnt_v2` (thêm cột xuất khác sau xuất bếp, hao hụt
sau kiểm kê); hàm cũ giữ nguyên cho ai còn gọi.

## 3d. Thẻ kho · Quét đầy đủ · Sau pha để ở (GĐ5c, migration 0033)

| Trang | Ai | Việc |
|---|---|---|
| `/noi-bo/kho/the-kho/<mặt hàng>?vi_tri=&tu=&den=` | Mọi vai `xem` (NV quầy chỉ chọn quầy) | Sổ của một món: dòng "Tồn đầu kỳ", rồi từng lần nhập / xuất, cột tồn cộng dồn (kg, gói). Mặc định tháng này; nút nhanh Tháng này / Tháng trước / 7 ngày. Số chứng từ bấm được khi người xem mở được trang đó (`linkChungTu`). Khung hẹp mỗi dòng một thẻ; in được (InDau + KyTen) |
| `/noi-bo/kho/quet` | Mọi vai `xem` | Thêm: nút theo từng lô (`viecVoiLo`), Ra quầy mở sẵn lô kho hạn gần nhất, Báo hủy mở sẵn lô hết hạn, Thẻ kho, Đếm quầy (NV quầy), "Thêm vào phiên pha <số>" (vai `pha_loc`, có phiên nháp, món không phải tảng) — POST một lượt `kho_quet_phien_pha` với `ma_gui` riêng rồi mở phiên. Nhãn in bằng **ô mã** hiện "Ô 1 · tảng #0001", lô của tảng đó xếp lên đầu và các nút làm nhanh mở đúng lô đó; nhãn **mã giảm giá** hiện "Tem giảm 30%" (xem gạch đầu dòng dưới) |
| `/noi-bo/kho/cai-dat/mat-hang` | `danh_muc` | Ô "Sau pha để ở: Kho lạnh / Quầy" (`kho_mat_hang.noi_de_sau_pha`, trống = kho lạnh). Dán Excel có cột "Sau pha để ở" (cột thứ 9 khi không có tiêu đề) |

- `kho_the_kho` **không có tiền**. Không chọn nơi = cả chi nhánh, kể cả hàng đang mang ra quầy và
  chờ hủy → tồn cuối kỳ = tổng tồn của món ở Tồn kho; chuyển kho → quầy hiện hai dòng (đi, đến).
- Nút "Thẻ kho" có ở từng món trang Tồn kho và ở màn Quét. Ô menu "Tồn kho" sáng khi đang ở thẻ kho
  (`khop` trong `dieu-huong.ts`).
- Hàm thuần (`docBoLocTheKho`, `linkTheKho`, `khoangNhanh`, `linkChungTu`, `tongKy`) ở `lib/kho/the-kho.ts`,
  test trong `test-kho-ma-vach.mjs` nhóm 15 và `test-kho-giao-dien.mjs` nhóm 14.
- **Màn Quét với nhãn mã ô / mã giảm giá** (mã trên nhãn tra bằng `lib/kho/tra-ma-can.ts` — mục 3o): ô mã,
  mã giảm đọc một lần cùng lượt với danh mục (`docMaTrenNhan`); nhãn là mã ô thì đọc thêm ô đang giao
  (`kho_can_giao_o_ma`) song song với tồn kho.
  - Ô đang giao cho một tảng đã chốt phiên lóc: dòng "Ô 1 · tảng #0001"; lô của tảng lên đầu danh sách, có vạch
    đỏ và chữ "khay vừa quét thuộc lô này"; **Ra quầy / Đưa bếp / Báo hủy** mở đúng lô đó khi lô còn hàng ở kho
    hay quầy (NV quầy ưu tiên dòng ở quầy). Lô đó **đã hết hạn** → khung lưu ý "để riêng và báo hủy", chỉ còn nút
    Báo hủy. Sổ không còn hàng của tảng ở kho / quầy → khung lưu ý nói rõ, các nút quay về lô hạn gần như nhãn thường.
  - Ô đang giao cho phiên lóc **chưa chốt** → khung lưu ý "khay chưa vào sổ". "Thêm vào phiên pha" chỉ mời đúng
    phiên đang giữ ô (database từ chối phiên khác); nhãn mã giảm thì không mời.
  - Ô không còn gắn với tảng nào → vẫn hiện món, kèm một câu nói rõ. Mã lạ → câu cũ "chưa gắn với món nào".
  - Chữ đếm theo đơn vị của món ("Khay này: 0,312 kg", "không còn khay nào"), không viết cứng "gói".
- **Số tảng cạnh lô**: màn Quét, Tồn kho, Thẻ kho hiện "tảng #0001" ở mỗi lô thuộc một tảng (mục 3o).

### Gọn phần tồn kho (Khánh duyệt 22/10/2026)

- **Tồn kho**: mỗi món một dòng gập (`details.kho-mh`) — tên, số lô, tổng kg · gói, "Hạn dd/mm" sớm nhất; bấm mới
  thấy bảng lô và nút. Mở sẵn khi chỉ ≤ 3 món hay lọc hẹp: theo hạn (`?han=`), món quầy dưới mức (`?duoi_muc=1`,
  dòng gom "n món quầy sắp hết" — mỗi lô một nút Mang ra quầy) hoặc ô tìm. Không còn dòng mã · loại · nhóm, cột giá
  vốn/kg (tổng giá trị vẫn ở dòng đầu cho vai xem giá) và chữ "pha lóc / nhập dd/mm" dưới mã lô.
- **Tảng · ủ**: bảng tảng 5 cột (Số tảng · Món · Tuổi · Ủ xong · Kg). Chỗ để chỉ ghi dưới tên món khi khác chỗ của đa
  số tảng; ngày mổ, hạn dùng xem ở trang tảng.
- **Thẻ kho**: nhập / xuất / tồn gộp một cột "Kg ± · tồn" (và một cột gói) — 7 cột.
- **Kiểm kê**: thẻ tiến độ chỉ "Đã đếm x/y"; quét nhãn gập trong `details`; mỗi món một hàng gọn (ô số gói, ô kg,
  "Đã hết thật").
- `test-kho-giao-dien.mjs` nhóm 17 gác các điều trên.

### Gọn phần mua và nhận hàng, thẻ phiếu (Khánh duyệt 22/10/2026)

- **Thẻ phiếu hai dòng** ở mọi danh sách phiếu (Nhận hàng, Nhập hàng, Đặt hàng, Chuyển · Xuất · Hủy, Pha lóc,
  Kiểm kê): dòng 1 số phiếu · nhà cung cấp (hoặc loại / chỗ) + nhãn trạng thái; dòng 2 `p.nb-dong-tom` — ngày ·
  số món · kg (· tiền với vai xem giá). Không còn dòng người lập (nên không đọc `tenNhanSu`); chỗ nhận chỉ ghi khi
  khác chỗ của đa số phiếu (`phoBienNhat`, `lib/kho/chung.ts`).
- **Nhận hàng**: bỏ ô Ngày sản xuất, Số lô NCC (bước 2 và form soạn của phiếu nhập) và Số hóa đơn (bước 1, sửa
  đầu phiếu — kế toán ghi lúc điền giá). Dòng / phiếu đã có giá trị thì form mang theo bằng ô ẩn, sửa không mất.
  Câu giải thích dưới Ngày mổ, Kg sau repack còn một câu; bản đủ ở Hướng dẫn (`nhan-hang`).
- **Điền giá**: chip chỉ "Lần trước …"; số phiếu và ngày lần trước nằm trong `title`.
- **Số đỏ ô Việc** = `viec_dong` (0092): số dòng của trang Việc cần làm sau khi gom, không cộng từng lô / món.
- `test-kho-giao-dien.mjs` nhóm 18, `test-kho-viec.mjs` nhóm 7b gác các điều trên.

### Gọn phần pha lóc, quầy, xuất (Khánh duyệt 22–23/10/2026)

- **Chuyển · Xuất · Hủy** (`xuat/[id]`): mục chọn lô gập sẵn (quét nhãn hoặc chọn món ở trên là đủ); mở sẵn khi
  đi từ nút của một lô (`?lo=`) hay lô đã có số. Mỗi lô một hàng gọn: tên, dòng nhỏ "lô · còn · HSD", hai ô số
  cạnh nhau (`.kho-lo-chon`, `kho.css`). **Báo hủy**: lô hết hạn rồi sắp hết hạn lên đầu (hạn gần trước,
  `MUC_HAN_LO`); lô còn hạn xa trong mục gập "Xem mọi lô khác (n)" — vẫn trong form, chỉ số `l<i>_…` chạy liền
  qua hai nhóm (`so_lo` = tổng số lô).
- **Quầy cần hàng** (`quay/yeu-cau`): món kho cũng hết (số đề nghị đã là 0 — `kho_goi_y_ra_quay` không đề nghị quá
  số kho) không còn ô nhập, gom vào mục gập "n món kho cũng đã hết"; vẫn chọn được ở "Thêm món khác". Món còn ở
  kho mỗi món một hàng: tên, dòng nhỏ quầy / kho, ô số bên phải kể cả điện thoại.
- **Pha lóc bước 1**: nút chọn tảng nhỏ, nền phụ, lưới hai cột trên điện thoại (trước là nút đỏ lớn một cột).
- **Pha lóc bước 2**: chưa chọn tảng thì mục **Tảng đem pha** đứng đầu form (mở sẵn), khung ô mã xuống dưới form
  (cần đúng một tảng mới giao được); chọn rồi thì về chỗ cũ sau phần gõ kg. Các đoạn hướng dẫn (ô mã, quét, gõ kg,
  tích lô) còn một câu; bản đủ ở Hướng dẫn (`pha-loc`). Dòng phụ phẩm: máy tính một hàng Mặt hàng · Số kg · Xử lý,
  điện thoại mặt hàng một hàng, kg và xử lý cạnh nhau; "Thêm…" và "Bỏ dòng này" chung hàng chân.
- `test-kho-giao-dien.mjs` nhóm 19 gác các điều trên.

### Gọn phần tiền và báo cáo (Khánh duyệt 23/10/2026)

- **Công nợ một nhà cung cấp** (`cong-no/[id]`): mỗi phiếu một hàng gập — số phiếu · ngày · phải trả · còn nợ ·
  nhãn (hạn / đã trả đủ / nợ đầu kỳ / hóa đơn gộp / lệch / "Chưa đối chiếu"). Bấm mở ra: đã trả (và phần chia),
  hóa đơn đã đối chiếu, link trả hàng, ô đối chiếu — mở sẵn khi phiếu chưa đối chiếu. `?mo=<phiếu>` và lỗi đối
  chiếu vẫn mở đúng phiếu. Bỏ dòng "Hóa đơn: chưa đối chiếu · phiếu …" (thay bằng nhãn).
- **Xuất sang MISA**: xem trước 10 dòng (`XEM`), chữ không xuống dòng (vuốt ngang); file vẫn đủ dòng. "Mã MISA
  còn thiếu" là mục gập `#thieu-ma` ("n nhà cung cấp, m mặt hàng"), mỗi mặt hàng một hàng: tên · ô mã · Lưu mã.
  Mở sẵn khi vừa lưu mã (`?mo=thieu_ma`) hay mã gõ sai; ô "dòng thiếu mã" dẫn tới đó với `?mo=thieu_ma`.
- **Trung tâm báo cáo**: mỗi báo cáo một dòng — tên (link) — mô tả ngắn · Xem · CSV, thay cho thẻ to hai nút.
- **Bán hàng iPOS**: `gomDongIpos` (`lib/kho/ban-ipos.ts`) gom dòng cùng trạng thái + cùng món (món kho, chưa ghép
  thì mã iPOS) trên trang đang xem thành một hàng gập "tên · n dòng · tiền" + nhãn + MỘT nút Ghép món; mở ra từng
  hóa đơn, mỗi dòng vẫn đủ nút Thử lại / Bỏ qua / Hàng ngoài sổ. Món một dòng hiện như cũ.
- `test-kho-giao-dien.mjs` nhóm 20 gác các điều trên.

### Gọn phần thiết lập và hướng dẫn (Khánh duyệt 23/10/2026)

- **Thiết lập kho**: chỉ bày các bước còn lại; bước đã xong / bỏ qua gom vào mục gập "n bước đã xong hoặc bỏ
  qua" (mở sẵn khi vừa bấm Bỏ qua — `?mo=xong`, link "Về Thiết lập" của Tồn đầu kỳ cũng vậy). Mọi bước vẫn có
  `id="buoc-…"`. Danh mục mỗi mục một dòng (tên — mô tả), cả dòng là link.
- **Hướng dẫn**: mỗi mục là `<details>` (tiêu đề + câu tóm tắt; bấm mở ra bước, mẹo, ảnh). Lọc vai thì mục lục
  chỉ gồm vai đó, mục của vai khác nằm trong MỘT mục gập `#vai-khac` — mọi `#id` vẫn có trong HTML. `?mo=<id>`
  mở sẵn mục (và `#vai-khac` nếu cần): nút "?" của mọi màn (`layouts/Kho.astro`) và mục lục dùng
  `?mo=<id>#<id>`. In ra vẫn đủ bước (`::details-content` trong `@media print`).
- **Mặt hàng**: bảng bỏ cột Mã cân, Pha lóc ra (xem, sửa ở nút Sửa).
- **Tồn đầu kỳ**: mỗi nhóm (Tảng nhập, Phần cắt, Phụ phẩm) một mục gập ghi số món đã điền. Ô **Tìm món** gửi cả
  form (`viec=tim_luoi`, không JavaScript): vẽ lại chỉ món khớp, món khác thành ô ẩn mang đúng số đã gõ (chỉ số
  `O_LUOI` liền nhau cho `docLuoiTonDau`); `bo_loc` bỏ lọc. Nút Tìm đứng trước nên Enter chỉ vẽ lại, không xem trước.
- **Kết nối iPOS**: Cấu hình, Địa chỉ nhận hóa đơn (kèm việc cần nhớ), Cài lần đầu thành mục gập có tình trạng ngắn
  ở tiêu đề; Cấu hình mở sẵn khi đồng bộ tắt hay vừa lưu hỏng.
- `test-kho-giao-dien.mjs` nhóm 21 gác các điều trên.

## 3e. Pha lóc 3 bước bằng quét nhãn · báo thu hồi thấp (GĐ5c, migration 0033)

| Trang | Ai | Việc |
|---|---|---|
| `/noi-bo/kho/pha-loc/moi` | `pha_loc` | Bước 1: mỗi loại tảng đang có (trừ chờ hủy, đang mang ra quầy) là một nút kèm kg, số tảng, số lô. Bấm = tạo phiên nháp ngay (`ma_gui` riêng mỗi nút); tảng chỉ một lô thì điền sẵn lô đó, loại tảng có đúng một công thức thì gắn luôn. Phiên nháp đang dở hiện lên trước |
| `/noi-bo/kho/pha-loc/<id>` | `pha_loc` (nháp) | Bước 2 "Cân & quét": ô quét trên cùng (`QuetMa tuFocus`), mỗi lần gửi là một lượt `kho_quet_phien_pha` (như đếm quầy: cùng `ma_gui` không cộng đôi, lỗi mạng giữ mã trong ô). Danh sách món đã quét (gói, kg, để ở đâu) có −1, "Bỏ lượt vừa quét", "Bỏ hẳn một món" (`kho_bo_quet_phien_pha`). Phụ phẩm, mỡ bỏ gõ kg (điền sẵn theo công thức); lô tảng, ngày, ghi chú, công thức nằm trong mục "Thêm". `?ma=<mã>` điền sẵn ô quét |
| `/noi-bo/kho/pha-loc/<id>?buoc=ket-qua` | `pha_loc` | Bước 3: 4 số lớn — thu hồi, dự kiến (theo công thức / trung bình 30 ngày), trung bình 30 ngày, hao hụt. **Nút Chốt chỉ ở đây.** Thấp quá ngưỡng thì báo trước khi chốt (chốt vẫn được). Bảng giá vốn chỉ với `xem_gia` |
| `/noi-bo/kho/pha-loc/<id>?buoc=xong` | `pha_loc` | Sau chốt: "Chuyển N khay ra quầy ngay" (đơn vị đếm của món; các lô khác đơn vị thì chữ chung "gói" — `goiRaQuay` trả `donVi`) — mỗi lô mới còn ở kho lạnh một nút `/noi-bo/kho/xuat/moi?loai=chuyen&tu=…&lo=…` |

- **Lóc một chạm "Lóc #0142" (món theo dõi theo tảng, không migration)**: mục **Tảng lóc được** ở `/pha-loc/moi` và nút
  **Lóc** dưới số tảng ở Tảng · ủ (vai `pha_loc`) — cùng luật `tangLocDuoc`: có số tảng, không còn đang ủ, còn chỗ lóc
  được (bỏ chờ hủy, đang mang ra quầy), chưa nằm trong phiên nháp. Bấm (`viec=loc_tang`; từ Tảng · ủ thêm `ve=tang`) →
  `locMotTang` tự đọc lại tảng, chỗ lóc được, công thức, ô mã, mặt hàng ngừng dùng, phiên nháp của lô (đọc hỏng → không
  ghi gì), mở phiên với đúng lô đó ở mọi chỗ lóc được (`kho_luu_phien_pha`, `ma_gui` theo nút), gắn công thức khi loại
  tảng có một công thức và gọi `kho_giao_o_ma` khi công thức có phần cắt mang ô còn dùng (cùng luật `m.dang_dung` của hàm)
  → vào thẳng bước 2, kể cả khi giao ô hỏng (database từ chối: câu đỏ "chưa giao được ô mã"; mất mạng / ném: câu đỏ
  "Không chắc đã giao ô mã" — database có thể đã giao, xem khung Ô mã của tảng này). Nhiều công thức: không tự giao, câu
  nhắc chọn công thức. Tảng đang lóc dở bấm lại → trả phiên đó và gọi
  lại giao ô (tự lành); cùng `ma_gui` mà database báo đã có → đọc lại đúng phiên đó (đã hủy / đã chốt → "Trang đã cũ").
  Nút chỉ có sau khi phiếu nhận được duyệt (lô sinh lúc duyệt). Một lô lóc một chạm thường có hai dòng vào (kho lạnh
  và quầy), nên chỗ nào ghi "N lô" phải đếm số LÔ khác nhau: tóm tắt "Tảng đem pha" ở bước 2 đếm `loVaoPhien`, danh
  sách phiên chưa chốt in `so_lo_vao` của `kho_v_phien_pha` (0098) — `so_dau_vao` là số dòng. `test-kho-loc-tang-web.mjs`.

- **Dòng quét** (`kho_phien_pha_ra.tu_quet`): mỗi món một dòng, gói = số nhãn (món không đếm gói thì 0),
  kg = tổng kg trên nhãn, nơi để = `kho_mat_hang.noi_de_sau_pha` (trống = kho lạnh; chi nhánh không có
  quầy thì về kho lạnh — `kho_vi_tri_sau_pha`, bản web `viTriSauPha`). `kho_luu_phien_pha` chỉ thay các
  dòng **gõ tay**; gõ tay một món đã quét bị từ chối, và quét nhãn của món đã gõ tay cũng bị từ chối.
  Ô "Để ở" của dòng gõ tay bỏ trống = theo nơi để của món.
- Nhãn không cộng: nhãn không có kg, nhãn của chính tảng đem pha, món đã gõ tay, mã chưa gán món — trả
  trong `loi`, các nhãn khác vẫn cộng. Màn Quét có nút "Thêm vào phiên pha <số>" (vai `pha_loc`) — một
  lượt một nhãn rồi mở phiên, câu báo hiện qua `k.bao`.
- **Thu hồi thấp** (không duyệt, chỉ báo): lúc chốt, dự kiến = tổng `ty_le_du_kien` của công thức, không
  có thì trung bình 30 ngày của loại tảng; thu hồi < dự kiến − `nguong_thu_hoi_diem` → `thu_hoi_thap`.
  Sự kiện `thu_hoi_thap` (quản lý, chủ — `duyet`; số đỏ ở ô Pha lóc và quy trình) tới khi quản lý bấm
  **"Đã xem"** trên phiên (`kho_xac_nhan_phien_pha`, có ghi chú). Mở lại / chốt lại thì xóa cờ và
  trạng thái đã xem. Luật so ở web (`soSanhThuHoi`) phải khớp thân `kho_chot_phien_pha` (test so thẳng).
- **Một form cho cả bước 2 (GĐ5e)**: ô quét, −1 / bỏ lượt / bỏ món và các ô gõ kg chung một `<form>`.
  Với `VIEC_LUU_GO_TAY_TRUOC` (`quet`, `bo_luot`, `bot_mot`, `xoa_mon`) máy chủ chạy `luuPhienPha` **trước**
  rồi mới quét / sửa — gõ kg phụ phẩm xong quét nhãn ngay thì số vừa gõ không mất. Phần gõ tay lỗi → chưa quét,
  hiện lại chữ đã gõ, giữ mã trong ô và `ma_gui`. −1 / bỏ món gửi món qua `formaction ?mon=<id>`, lệnh sửa
  có `ma_gui_sua` riêng. Enter trong ô kg = nút quét (nút đầu form) với ô quét trống → chỉ lưu.
- **Tảng đem pha có số tảng, ngày mổ, tình trạng ủ**: mục chọn tảng ở bước 2 ghi "Lô … · tảng #0002", dòng dưới
  "mổ 01/10/2026 · Đang ủ còn 13 ngày" / "Sẵn sàng lóc" / "Chưa có bảng ủ" (`docNgayUTang` đọc `kho_lo`,
  `tinhTrangU` tính ở web theo `homNayVn()` — cùng luật với view `kho_v_tang`, test so thẳng). Tảng đã chọn mà
  hôm nay còn đang ủ: khung lưu ý "Tảng #0001 còn đang ủ — ủ xong ngày 18/10/2026 (còn 7 ngày)." ở bước 2 và
  bước 3 (`cauTangConU`). **Chỉ nhắc, không chặn** — nút Chốt vẫn bấm được. Màn xem phiên: bảng "Tảng đem
  pha" và cột "Lô mới" có số tảng. Không cái nào phụ thuộc quyền xem giá. Test: `test-kho-so-tang-lo.mjs`.
- Nút −1 và câu "Đã bớt 1 khay." theo đơn vị của món (`doiDonViCau`, mục 3o).
- Thủ kho chỉ thấy kg, gói, %: bước 2, 3 và màn xem đọc `kho_xem_thu_phien_pha_kg`; hàm có tiền
  `kho_xem_thu_phien_pha` chỉ gọi khi `xem_gia`. Hàm thuần của 3 bước ở `lib/kho/pha-loc.ts`, test ở
  `test-kho-pha-web.mjs`; database ở `test-kho-pha-loc-quet.mjs`.

## 3f. Máy tính bảng dùng chung · Chủ tự tạo tài khoản (GĐ5d, migration 0034)

Tablet ở quầy/bếp dùng chung 1–2 máy: đổi người bằng **PIN**, **tự khóa sau 5 phút** không dùng.
Việc ai làm vẫn ghi đúng người đó, vì mọi thao tác chạy bằng **phiên của chính người đó** — PIN chỉ
là cách lấy lại phiên đã cất, không phải một lối đăng nhập mới.

**Supabase bận** (`lib/qua-tai.ts`): mỗi lần mở khóa, khóa máy, gắn người là một lượt đổi token ở Supabase
Auth — cửa có hạn mức chung cho cả quán. Bị từ chối vì bận / mất mạng thì token vẫn còn: mở bằng PIN báo
"PIN đúng … đợi vài giây rồi nhập lại" và **giữ** đăng nhập đã cất; bấm Khóa máy báo "máy CHƯA khóa";
hết giờ tự khóa mà chưa khóa được thì mọi trang kho trả trang "đang bận" (tự tải lại) — không ai dùng tiếp
dưới tên người trước, không token máy nào bị bỏ. Chỉ khi token bị TỪ CHỐI (hết hạn, thu hồi) mới như cũ:
bắt gắn lại / đăng ký lại máy.

| Trang | Ai | Việc |
|---|---|---|
| `/noi-bo/kho/may` | Máy (vai `may_chung`) | "Ai đang dùng máy?": nút tên người đã gắn → ô PIN → đổi phiên sang người đó |
| `/noi-bo/kho/may/dang-ky` | Quản lý, trên tablet | Nhập email + mật khẩu của **tài khoản máy** → `kho_dang_ky_may` → cookie `bt_may_tb` |
| `/noi-bo/kho/may/gan` | Từng nhân viên, trên tablet | Đăng nhập đầy đủ một lần, đặt PIN 4–6 số → `kho_may_gan_nguoi` |
| `/noi-bo/kho/cai-dat/nhan-vien` | Chủ (phần nhân viên); quản lý, chủ (phần máy — `duyet`) | Thêm nhân viên, khóa / mở lại; máy: người đã gắn, mở khóa máy / người, khóa hẳn, tắt máy, gỡ người |
| `/noi-bo/kho/cai-dat` | Quản lý, chủ | Thẻ "Máy dùng chung": đã bật chưa + cách bật |

**Tài khoản máy thay cho RPC mở cho anon.** Mỗi tablet có login riêng — dòng `nhan_su` vai `may_chung`
(quyền `may_chung` chỉ có ở vai này). Máy chỉ gọi được `kho_may_ds_nguoi` (liệt kê người đã gắn) và
`kho_may_kiem_pin`; không đọc được dữ liệu kho/CRM (test-kho-quyen, test-kho-may-chung). Vai `may_*`
chỉ vào được `/noi-bo/kho/may/*` (chặn trong `moTrangKho`). Không sửa `middleware.ts`, `phien.ts`.

**Mã hóa ở Worker** (`lib/kho/may-chung-ma-hoa.ts`, thuần — Web Crypto, chạy cả Node): bí mật Worker
`KHO_MAY_KHOA` → HKDF ra 4 khóa riêng: `token` (AES-GCM, AAD = `may_id|nhan_su_id`), `pin` (HMAC —
`pin_bam` = HMAC(`may_id|nhan_su_id|pin`); database chỉ thấy `pin_bam`, lộ bảng cũng không dò được
PIN 4–6 số), `moc` (ký mốc hoạt động), `ten` (tên cookie). Database không bao giờ nhận PIN thô.

**Cookie** (httpOnly, secure, sameSite=lax):

| Cookie | Chứa |
|---|---|
| `bt_may_tb` | Refresh token của **máy**, mã hóa |
| `bt_may_s_<8 hex>` | Refresh token của **một người đã gắn**, mã hóa (tên cookie là HMAC, không lộ id) |
| `bt_may_hd` | Mốc hoạt động (máy, người, lúc) + HMAC — sửa tay là hỏng → khóa |
| `bt_phien` | Phiên đang dùng, **đúng định dạng của `phien.ts`** (JSON `access_token`, `refresh_token`) |

**Mỗi refresh token chỉ tồn tại 1 bản**: hoặc ở `bt_phien` khi người đó đang dùng, hoặc cất trong
cookie riêng khi máy khóa. Test-kho-may-chung nhóm 14 kiểm file `lib/kho` nào ghi `bt_phien` cũng giữ
đúng định dạng của `phien.ts`.

**Tự khóa** kiểm ở máy chủ trong `moTrangKho`: GET quá `phut_khoa` (mặc định 5) → cất token người,
đưa phiên về máy, chuyển `/noi-bo/kho/may`. POST quá giờ được ân hạn 2× `phut_khoa`; quá nữa thì báo
"Máy đã khóa — phiếu chưa được ghi, mở khóa rồi làm lại" (`daQuaGioKhoa`). `public/kho/js/may-chung.js`
chỉ đếm giờ phía trình duyệt rồi chuyển `/noi-bo/kho/may?khoa=1` — tắt JS vẫn an toàn.
POST trong ân hạn được ghi nhưng **không dời mốc**: mở trang ngay sau đó là máy khóa (người đến sau
cầm máy đang mở trang của người trước chỉ gửi lọt được một phiếu, không dùng tiếp dưới tên người đó).
Máy không còn giữ phiên của một người thì màn khóa từ chối **trước** khi kiểm PIN. Phiên nào rời máy
mà không được cất (đăng ký máy đè lên phiên quản lý, token máy cũ, gắn lại, tự gỡ) đều bị thu hồi.
Trang CRM ngoài `/noi-bo/kho` (và file CSV báo cáo) **không** qua `moTrangKho` nên không tự khóa —
menu ở chế độ máy đã ẩn CRM; quản lý/chủ đừng mở CRM trên tablet dùng chung.
Chế độ máy: menu người dùng đổi "Đăng xuất" thành "Khóa máy" và "Gỡ tôi khỏi máy này".

**Sai PIN**: 5 lần liền → khóa người đó 15 phút; 15 lần / 30 phút hoặc 30 lần / 24 giờ (chặn dò chậm) trên một máy (mọi người cộng lại) →
khóa máy, quản lý mở ở màn Nhân viên & máy. Mọi sự kiện ghi `kho_may_nhat_ky`. `kho_may_nguoi`
**không có policy SELECT** — PIN băm không đọc được kể cả bằng quyền quản lý.

### Chủ tự tạo tài khoản (`lib/kho/nhan-vien.ts`)

1. Kiểm form trước (`docFormNhanVien`) — tạo xong tài khoản đăng nhập mà bước 3 hỏng thì email bị chiếm.
2. `auth.signUp` bằng **client anon riêng** (`persistSession: false`), mật khẩu tạm `taoMatKhauTam()`
   (`crypto.getRandomValues`, 12 chữ không dễ nhầm, dạng `Xk7m-4Rtq-9wPa`). Phiên của người mới
   **không bao giờ vào cookie** (chủ không bị đăng xuất) và bị thu hồi ngay.
3. `kho_them_nhan_su(p_auth_uid, p_ho_ten, p_vai_tro, p_chi_nhanh_id)` bằng **client của chủ** — chỉ chủ;
   chỉ vai `thu_kho | nhan_vien_quay | ke_toan | may_chung | may_ipos` (web không cho chọn `may_ipos`
   tới GĐ7a); uid phải có trong `auth.users` và chưa gắn nhân sự nào.
4. Mật khẩu tạm hiện **một lần** trên màn trả lời POST (không chuyển hướng, `Cache-Control: no-store`),
   không lưu ở đâu. F5 gửi lại → `ma_gui` trùng cookie `bt_kho_nv_gui` (chỉ chứa `ma_gui`) → không tạo lần hai.

Khóa = `kho_khoa_nhan_su` (`dang_lam = false`, gỡ khỏi mọi máy); không khóa được chính mình. Lỗi
Supabase (đăng ký bị tắt, email đã có, cần xác nhận email, giới hạn gửi thư, captcha…) thành câu tiếng
Việt kèm chỗ bấm để sửa: `cauLoiDangKy`. Không có khóa `service_role` ở bất kỳ bước nào.

### Việc cần bật một lần

**Supabase** (Authentication → Sign In / Providers):
- Bật **Allow new users to sign up** — để máy chủ tạo được tài khoản bằng khóa anon. Chỉ bật SAU khi
  database đã chạy `0045`. Người lạ tự đăng ký được tài khoản Supabase thì vào `/noi-bo` không thấy gì
  (không có dòng `nhan_su`, `layPhien` trả null), nhưng vẫn gọi thẳng được REST của database bằng khóa
  anon công khai: bảng thì RLS chặn, hàm `SECURITY DEFINER` phải tự kiểm vai. Hàm kho kiểm bằng
  `kho_duoc` / `kho_cn_duoc`; ba hàm CRM `ghi_luot_ghe`, `tim_hoac_tao_khach`, `xep_hang_gui_tin` kiểm
  từ `0045` (trước đó tài khoản lạ tra được hồ sơ khách theo số điện thoại). Hàm definer mới mà
  `authenticated` gọi được thì phải có bước kiểm vai như vậy — `test-quyen-ham-crm.mjs` là mẫu.
- Email → tắt **Confirm email** — nếu không, người mới phải bấm link trong thư trước khi đăng nhập, và máy
  gửi thư có sẵn của Supabase chỉ gửi cho thành viên dự án (email nhân viên sẽ bị từ chối).
- Không bật captcha cho đăng ký (máy chủ không giải được captcha).

**Cloudflare** — bí mật Worker `KHO_MAY_KHOA` (≥ 32 ký tự, `openssl rand -base64 32`):
`npx wrangler secret put KHO_MAY_KHOA`, hoặc Workers & Pages → beeftown → Settings → Variables and
Secrets → Add → **Secret**. Đọc bằng `import { env } from 'cloudflare:workers'` (dev/test: `process.env`).
**Không** đặt trong `wrangler.toml [vars]`, không commit giá trị. Thiếu bí mật → máy dùng chung tắt, màn
Cài đặt báo cách bật, mọi thứ khác chạy bình thường. Đổi bí mật = mọi cookie máy và mọi PIN cũ hỏng —
mọi người gắn lại (cách "thu hồi tất cả" khi nghi lộ).

## 3g. Thiết lập có tiến độ · tồn đầu kỳ dạng lưới (GĐ5e, migration 0035)

| Trang | Ai | Việc |
|---|---|---|
| `/noi-bo/kho/cai-dat` | `danh_muc`, `ncc` hoặc `cai_dat_goc` (ô menu "Thiết lập") | Thanh tiến độ "Còn N bước" + 10 thẻ bước (`kho_tien_do_thiet_lap`): tên, Xong / Chưa xong / Bỏ qua, câu còn thiếu gì, nút "Làm bước này", nút "Bỏ qua" (`kho_danh_dau_thiet_lap`). Bên dưới giữ các cài đặt cũ, mỗi phần một neo: `#gia-von`, `#nguong`, `#may-chung`; thẻ bước là `#buoc-<khóa>` |
| `/noi-bo/kho/cai-dat/ton-dau?vt=<vị trí>` | `nhap` (thủ kho cũng vào; cột giá chỉ `xem_gia`) | Tồn đầu kỳ: bảng món của một kho / quầy, hoặc dán Excel nhiều nơi một lượt → xem trước → "Xác nhận" (`kho_luu_ton_dau_ky`, mỗi nơi một phiếu TD-) |

**Bước và luật "xong"** ở comment của `kho_tien_do_thiet_lap` (0035). Thứ tự và tên: `BUOC_THIET_LAP`
(`lib/kho/chung.ts`); câu chữ (`moTaBuoc`), nút (`LINK_BUOC` — mỗi nút ghi quyền của dòng chặn trang đích),
luật ẩn nút Bỏ qua (`coTheBoQua`: `danh_muc`; `ncc_no_dau` thêm kế toán — nút "Không có nợ đầu kỳ";
`gia_von` chỉ chủ) ở `lib/kho/thiet-lap.ts`. Kết quả **chỉ số đếm**, không tiền. Chi nhánh & nhân viên và
Mặt hàng không bỏ qua được.

- "Giá vốn" xong khi chủ bấm Lưu ở `#gia-von`, "Ngưỡng" xong khi bấm Lưu ở `#nguong` — **kể cả không đổi gì**
  (trigger ghi `goc_xem_luc` / `nguong_luu_luc`). Form ngưỡng gọi `luuNguong` của `thong-bao.ts`.
  Công tắc "Quầy phải bấm nhận" cũng đi qua `kho_luu_nguong`; lượt chỉ gạt công tắc (không gửi ngưỡng nào)
  trả `nguong_luu_luc` về như cũ — không tính là đã xem ngưỡng (0035 dựng lại hàm).
- Ô menu đổi chữ "Cài đặt" → "Thiết lập" (mã `cai_dat`, link giữ nguyên). Chưa có số đỏ: `kho_dem_viec`
  không đếm bước thiết lập — số bước còn lại hiện ngay trên màn.
- Tiến độ đọc riêng: lỗi đọc tiến độ chỉ hiện một dòng báo, các phần cài đặt vẫn dùng được.

**Tồn đầu kỳ dạng lưới.** Hàm thuần `xemTruocDanTonDau` (ô dán) và `docLuoiTonDau` (bảng món) cho ra cùng
một bản xem trước:

- Cột dán: Mã / Tên / Mã-hoặc-Tên, Nơi, Gói, Kg, Đơn giá, HSD. Có dòng tiêu đề (từ 2 tiêu đề hiểu được, phải có
  Mã hoặc Tên, và Kg) thì cột xếp tùy ý; không có thì theo thứ tự `Mã/Tên, Nơi, Gói, Kg, Đơn giá, HSD`.
  Tab hoặc `;` (một kiểu cho cả bảng). **Không** tách bằng `,` — "12,5" kg sẽ bị cắt làm hai.
  Không tiêu đề mà bảng bỏ cột Đơn giá: ngày (có `/` hoặc `-`) rơi vào chỗ cột giá được hiểu là HSD.
- Món khớp theo **Mã** trước, rồi **Tên bỏ dấu** (như dán Mặt hàng GĐ4a); hai món cùng tên không dấu → bảo ghi Mã.
  Nơi khớp theo tên kho / quầy; "kho" / "quầy" được khi chi nhánh chỉ có một chỗ loại đó; trống = nơi chọn
  ở ô "Nơi để khi dòng không ghi Nơi". Không nhận chỗ chờ hủy / đang mang ra quầy.
- HSD: `25/10/2026`, `25-10-26`, `2026-10-25`…; trống = ngày tồn đầu kỳ + hạn mặc định của món (thiếu cả hai → lỗi).
  Ngày tồn đầu kỳ: không sau hôm nay, không quá 90 ngày trước (như database).
- Người không xem giá: cột Đơn giá bị bỏ qua (có ghi trong "Bỏ qua cột"), bảng món không có ô giá.
- Câu lỗi xem trước ghi "Dòng N (tên món)" với N là **dòng trong ô dán**; bảng xem trước đánh số 1..n đúng
  thứ tự gửi, trùng "Dòng N" trong câu lỗi của database.
- "Xác nhận" gửi các dòng ở ô ẩn (JSON, `docDongGuiTonDau` chỉ kiểm hình dạng — database kiểm luật) cùng
  `ma_gui` tạo lúc xem trước. Database từ chối → trang dựng lại bảng từ ô ẩn (`dongTuGui`), **giữ `ma_gui`**.
- Lưới đọc `kho_mat_hang` không có cột tiền nào (thủ kho mở được). Test: `test-kho-thiet-lap-web.mjs` (không
  cần database); database ở `test-kho-dau-ky.mjs`.

## 3h. Nợ đầu kỳ nhà cung cấp (GĐ5e, migration 0035)

| Trang | Ai | Việc |
|---|---|---|
| `/noi-bo/kho/cong-no/no-dau` | `ke_toan` | Lưới mỗi NCC đang dùng một dòng: số tiền, hạn trả (trống = hôm nay + số ngày nợ của NCC), số hóa đơn, ghi chú. Dán Excel (Tab hoặc `;`; NCC khớp theo mã số thuế rồi tên không dấu) → xem trước → "Ghi nợ đầu kỳ" (`kho_ghi_no_dau_ky`, `ma_gui`). Danh sách phiếu ND- đã ghi, hủy khi chưa trả tiền (bắt buộc lý do). Nút "Không có nợ đầu kỳ" (đánh dấu bước Thiết lập) khi chưa có phiếu ND- nào |

- Nợ đầu kỳ = phiếu nhập loại `no_dau`, số `ND-`: không vị trí, không dòng hàng, không lô, không sổ kho — tồn,
  báo cáo hàng, giá vốn không thấy nó. Số tiền ở `tien_no_dau`, chép sang `tien_hoa_don` (đã đối chiếu), nên
  công nợ, thanh toán tự chia (hạn sớm nhất trước) chạy như phiếu mua. Mỗi NCC một phiếu còn hiệu lực / chi nhánh.
- View công nợ không có cột loại: web nhận phiếu ND- theo tiền tố số phiếu (`laNoDau`, `tenLoaiCongNo` trong
  `lib/kho/cong-no.ts`). Số phiếu ND- trỏ về trang công nợ của NCC (`linkPhieuCongNo` → `/noi-bo/kho/cong-no/<ncc>#p-<id>`),
  không vào `/noi-bo/kho/nhap/`; mở `/noi-bo/kho/nhap/<id>` của phiếu ND- cũng bị chuyển về đó. Không đối chiếu,
  không trả hàng. File `cong-no.csv` có cột "Loại" (Nhập mua / Nợ đầu kỳ).
- Thủ kho không thấy phiếu ND- ở đâu cả: `kho_v_phieu_nhap` và ba hàm đọc chỉ kg bỏ `no_dau`; bảng phiếu nhập đã
  khóa với vai không xem giá (0031). Test: `test-kho-cong-no-web.mjs`, `test-kho-dau-ky.mjs`, `test-kho-thu-kho.mjs`.

## 3i. Hướng dẫn sử dụng (GĐ6)

**Nội dung ở một chỗ: `lib/kho/huong-dan.ts`** (file thuần, không gọi database). Trang trong app
`/noi-bo/kho/huong-dan` và trang chia sẻ gửi nhóm qua Zalo đều dựng từ file này.

| Xuất | Là gì |
|---|---|
| `MUC_HUONG_DAN` | Mỗi mục một việc: `{ id, vai[], tieuDe, tomTat, buoc[], meo?, anh?, link? }` — mọi câu là cặp `{ vi, en }` |
| `NHOM_VAI` | Thứ tự, tên nhóm: Bắt đầu · Thủ kho · Nhân viên quầy & bếp · Quản lý · Kế toán · Chủ quán (`ten: { vi, en }`) |
| `CAU_HOI` | Câu hỏi thường gặp `{ id: 'hoi-…', hoi, dap }` (≥ 15 câu, `hoi` / `dap` là `{ vi, en }`) |
| `dinhDang(s)` | Escape HTML rồi đổi `**x**` → `<strong>x</strong>` — dùng với `set:html` |
| `vaiHuongDan(vaiTro)` | Vai tài khoản → nhóm mặc định (vai lạ → Bắt đầu) |

Trang Hướng dẫn: chip chọn vai là link `?vai=thu_kho…` (mặc định vai người xem, `?vai=tat-ca` xem hết),
mục lục, mỗi mục một thẻ `nb-the` có `id`, câu hỏi dùng `<details>` — không JavaScript. Lọc vai **không
ẩn** mục nào: mục của vai mình lên trước ("Việc của …"), còn lại nằm dưới "Việc của vai khác". Nhờ vậy
mọi `#id` luôn có trong HTML, nút "?" của màn nào cũng tới đúng chỗ.

**Thêm một mục**

1. Thêm object vào `MUC_HUONG_DAN`, đặt cạnh các mục cùng nhóm. Nhóm hiển thị = vai **đầu tiên** trong
   `vai`; các vai sau chỉ để hiện trong "Việc của tôi" của vai đó.
2. Câu chữ: ngắn, động từ trước, **đúng chữ trên nút** (đọc trang thật: `bấm **Gửi duyệt**`). Không thuật
   ngữ kỹ thuật. Mục có vai `thu_kho` / `nhan_vien_quay` **không nhắc tiền** (giá nhập, giá vốn, đơn giá,
   thành tiền, lãi, công nợ — test quét, ở cả hai thứ tiếng).
   Mỗi câu viết hai thứ tiếng cạnh nhau: `tieuDe: { vi: '…', en: '…' }`, trang đọc `[nn]`. Bản tiếng Anh
   dùng đúng chữ trên nút của màn tiếng Anh (tên menu, thao tác nhanh ở `dieu-huong.ts`). Tên do database
   giữ (lý do, chỗ để) không dịch; ảnh chụp vẫn là màn tiếng Việt, chỉ `anh.chu` có hai thứ tiếng.
   `lib/kho/quy-trinh.ts` cùng cách: tên, bước, lời dặn đều là `{ vi, en }`.
3. `link.href` phải là trang có thật (test dùng bảng đường dẫn như nhóm 1).
4. Trang kho mới: truyền `huongDan="<id>"` cho `<Kho>`. Trang nhiều vai / nhiều bước thì dùng biểu thức
   (`huongDan={laQuay ? 'yeu-cau' : 'ra-quay'}`) hoặc `const huongDan = … ;` — test đọc các chuỗi
   đứng sau `?`, `:`, `=`.

**Quy ước id**: chỉ `[a-z0-9-]`, không trùng giữa mục và câu hỏi (câu hỏi bắt đầu `hoi-`), không dùng
`muc-luc`, `cau-hoi`, `viec-cua-toi`, `vai-khac`, `nhom-*` (neo riêng của trang). **Không đổi / xóa id đã
dùng** — link đã lưu, nút "?" và trang chia sẻ trỏ vào đó. Các id cũ từ trước GĐ6 (`menu`, `thu-kho`,
`nv-quay`, `may-chung`, `mo-may-pin`, `gan-may`, `quan-ly-duyet`, `ke-toan`, `viec-can-lam`, `thong-bao`,
`tao-tai-khoan`, `quy-trinh`, `quet-nhan`) được test giữ.

**Ảnh** `public/kho/hd-<tên>.png` (thư mục phẳng — `.gitignore` chỉ mở `/web/public/kho/*.png`). Trường
`anh: { file, chu, rong, cao }`; `rong`/`cao` phải khớp cỡ file thật (để `<img width height>` không nhảy
trang). Chụp từ **Supabase giả** (không bao giờ dữ liệu thật) bằng Playwright: `astro dev` trỏ vào một
Supabase giả chạy cục bộ (máy chủ HTTP giả, để ngoài repo), đăng nhập `chu@test`, `ql@test`, `tk@test`, `nv@test`, `kt@test` / `matkhau`, viewport
390×844, `deviceScaleFactor: 1`, chụp khung nhìn (không `fullPage`) hoặc crop phần chính; mỗi ảnh
≤ 120KB. Script chụp để ngoài repo (scratchpad `chup-huong-dan.mjs` của phiên GĐ6); chụp lại khi giao
diện màn đó đổi nhiều. Danh sách tên: `hd-trang-chu-thu-kho`, `hd-nhan-hang`, `hd-nhan-hang-dong`,
`hd-pha-loc`, `hd-quet`, `hd-quay-hom-nay`, `hd-yeu-cau`, `hd-dem-quay`, `hd-bao-huy`, `hd-hom-nay`,
`hd-duyet`, `hd-dien-gia`, `hd-cong-no`, `hd-thiet-lap`, `hd-menu` (thanh đáy, 390×69).

> **Cả 15 ảnh còn giao diện bảng màu cũ, thẻ trắng.** Kho đổi bảng màu hai lần — ngày 12/10/2026 và ở PR
> "Đổi nhận diện website" (bộ 21/10/2026); ảnh chụp trước cả hai lần và chưa chụp lại. Trang hướng dẫn vì vậy đang hiện ảnh màu cũ cạnh giao diện màu
> mới — chụp lại cả bộ (cùng cỡ file, cùng tên) rồi xóa ghi chú này và dòng tương ứng ở
> `THUONG-HIEU.md` mục 5.

**Test**: `crm/test/test-kho-giao-dien.mjs` nhóm 5 — mọi trang kho (trừ Hướng dẫn) có `huongDan` trỏ
mục có thật; id không trùng, đúng dạng, giữ id cũ; ≥ 15 câu hỏi; ảnh có file, là PNG đúng cỡ, ≤ 120KB;
link có thật; phần thủ kho / NV quầy không nhắc tiền; `dinhDang` escape đúng.

## 3j. Đồng bộ bán hàng iPOS (GĐ7a 0037 · GĐ7c 0042: iPOS tự đẩy hóa đơn sang)

Tài liệu thật của iPOS (Postman "IPOS HUB API INTERGRATION FOR MERCHANT") khác giả định của GĐ7a:
**không có API kéo danh sách hóa đơn**. Khi thu ngân in hóa đơn, iPOS Hub **POST** JSON thô tới
`callback_url` HTTPS của mình (cấu hình trong CMS partner.foodbook.vn). Web chỉ nhận rồi chuyển tiếp;
khớp món, đổi số lượng ra kg / gói, FEFO, thiếu hàng, bắn trùng, sửa HĐ đều nằm trong SQL (0037, 0042,
test trên PGlite).

```
iPOS Hub ─POST─► https://beeftown.vn/hook/ipos/<IPOS_CALLBACK_KHOA>
  └ src/worker.ts fetch: /hook/ipos/* chặn TRƯỚC Astro ─► lib/kho/ipos-hook.ts xuLyHookIpos
       (web/src/pages/hook/ipos/[khoa].ts gọi cùng hàm — cho astro dev)
       1. khóa so sánh thời gian hằng (sai 404, thiếu bí mật 503), body ≤ 256KB (413), JSON (400)
       2. lib/kho/ipos.ts phanTichCallback (THUẦN): Event 11 → HĐ chuẩn hóa, bỏ thông tin khách
          Event 12 item_changed → cờ thực đơn đổi · event khác → 200 bỏ qua
       3. đăng nhập tài khoản máy may_ipos (client anon riêng, không ghi phiên ra đâu cả; dangNhapMayIposNho
          giữ phiên trong BỘ NHỚ isolate tới 2 phút trước khi hết hạn — mỗi hóa đơn một lần đăng nhập sẽ
          chạm giới hạn đăng nhập của Supabase Auth giờ cao điểm)
       4. kho_ipos_tim_chi_nhanh(pos_parent, pos_id)   (không khớp → 202 + log, Hub không bắn lại mãi)
       5. kho_ipos_nhan_callback(cn, HĐ) → 200 {"ok":true} CHỈ khi đã vào hộp thư; lỗi database → 500
          (Event 12: kho_ipos_bao_menu_doi)

Cron */5 (wrangler.toml [triggers]) ─► src/worker.ts scheduled() ─► dongBoTatCa(env)
  └ lib/kho/ipos-dong-bo.ts: đăng nhập máy → kho_cn_duoc('dong_bo_ban') → mỗi chi nhánh dongBoIpos():
       1. kho_ipos_bat_dau(cn, 'cron'|'tay')           → api_url, pos, menu_luc, menu_can_lam_moi
       2. kho_ipos_nhan(cn, lan_id, [], null)          → THỬ LẠI hàng chờ (chưa khớp, thiếu hàng)
       3. tới hạn (iPOS báo đổi / quá 60 phút / bấm tay): GET {api_url}/v2/items?access_token&pos_parent
          &pos_id&menu_type=DELI → phanTichMenu (không lấy giá) → kho_ipos_luu_menu
       4. kho_ipos_ket_thuc(lan_id, lỗi đã xóa token | null)
```

Payload HĐ (Event 11 → `kho_ipos_nhan_callback`): `{ ma_hd: "<pos_id>:<tran_id>", thoi_diem_ban:
tran_date + "+07:00", da_huy, raw, dong: [{ khoa_dong: chỉ số (từ 0), ma_ipos: item_id, ten_ipos:
item_name, so_luong: quantity, thanh_tien: amount }] }`. Dòng hàng iPOS **không có mã vạch, không kg
từng nhãn**; hai dòng cùng item_id là hai dòng. `raw` bỏ `membership_*`, `delivery_info`,
`payment_info`, `sale_note`, mọi khóa có phone / email / address / token (database có lưới thứ hai,
`kho_ipos_bo_pii`). Bắn trùng (Hub có thể bắn double): cùng `ma_hd` cùng nội dung → bỏ; nội dung khác →
đảo ngược rồi ghi lại.

| Chỗ | Việc |
|---|---|
| `lib/kho/ipos.ts` | Thuần, không import gì. `TRUONG_IPOS` (mọi điều về API, ghi nguồn tài liệu), `phanTichCallback`, `phanTichMenu`, `taoUrlMenu`, `docThoiDiem`, `xoaToken`, `bangNhauHang`, `boThongTinKhach` |
| `lib/kho/ipos-hook.ts` | `xuLyHookIpos(request, khoa, { env?, taoClient?, ghiLog? })` → `Response` (không bao giờ ném lỗi), `khoaTuDuong` |
| `lib/kho/ipos-dong-bo.ts` | `dongBoIpos({ supabase, chiNhanhId, nguon, env?, fetchFn?, docMenu? })`, `dongBoTatCa(env)`, `dangNhapMayIpos`, `layBiMatIpos`, `trangThaiBiMatIpos` (chỉ có / không), `layKhoaCallback` (chỉ cho chủ) |
| `src/worker.ts` | `fetch`: `/hook/ipos/*` → `xuLyHookIpos`, còn lại = `handle` của `@astrojs/cloudflare/handler`; `scheduled` |
| `/noi-bo/kho/cai-dat/ipos` | Kết nối iPOS: đèn, **lần nhận hóa đơn gần nhất**, **địa chỉ nhận hóa đơn** (chủ thấy đủ khóa, người khác thấy che), 4 việc nhờ iPOS, "Cập nhật ngay" (= thử lại hàng chờ + đọc lại thực đơn, phiên người bấm, `dong_bo_ban`, giới hạn 60 giây), cấu hình (không còn ô đường dẫn hóa đơn; có "báo mất kết nối sau … giờ"), chuyển nguồn số bán |
| `/noi-bo/kho/ban-ipos` | Hàng đợi: Chưa khớp → Ghép món; Thiếu hàng → Thử lại / Hàng ngoài sổ / Bỏ qua (`kho_ipos_xu_ly_dong`) |
| `/noi-bo/kho/ban-ipos/ghep` | Ghép món + **Bán theo** kg / gói (+ "mỗi gói = … kg") / suất (món chế biến) → `kho_ipos_gan_ma_v2`; **Thực đơn iPOS** (`kho_ipos_menu`, tìm + chia trang GĐ4b) để ghép trước khi bán |
| `/noi-bo/kho/ban-ipos/mon-fabi.csv` | Danh sách món cần có trên FABi (`danh_muc`) — `taoTepMonFabi` (`lib/kho/thu-ngan.ts`) |

**Tại sao chặn /hook/ipos ở worker.ts.** Astro bật `security.checkOrigin`: POST có `content-type`
kiểu form (`text/plain`, `x-www-form-urlencoded`, `multipart/form-data`) hoặc không có `content-type` mà
`Origin` khác tên miền → 403. Tài liệu nói Hub gửi "RAW data" — có thể là `text/plain` không `Origin`.
Hook không đọc cookie nên không có gì để CSRF; chặn trước Astro là đúng chỗ. Route
`src/pages/hook/ipos/[khoa].ts` giữ lại cho `astro dev` (gửi `application/json` là qua được chốt).

**"Bán theo" (0042, `kho_ipos_ma_hang.don_vi_ban`).** iPOS chỉ gửi `quantity`. Database đổi:
`kg` → kg bán = quantity (món đếm gói: lấy gói nguyên theo hạn gần nhất cho tổng kg gần nhất, lệch ghi hao
hụt); `goi` → số gói = quantity (món theo kg thì kg = quantity × "mỗi gói = … kg"); `suat` → món chế biến,
dòng `bo_qua`, kho không trừ, định lượng GĐ7b đếm suất từ `so_luong`; trống → theo món kho.

**Mất kết nối / chặn đếm quầy (0042).** Không có hóa đơn ≠ mất kết nối (quán vắng). Đèn đỏ + chuông
`ipos_mat_ket_noi` khi: lượt cập nhật cuối lỗi (thử lại / đọc thực đơn), hoặc TRONG giờ mở cửa quá
`gio_mat_ket_noi` giờ (mặc định 3, chủ đổi 1–12) không nhận hóa đơn nào. Gửi đếm quầy chỉ bị chặn khi hộp
thư chưa được xử lý trong 10 phút (`hop_thu_luc` — cron 5 phút cập nhật), không còn theo watermark.

**Worker có `main` riêng.** `wrangler.toml` khai `main = "./src/worker.ts"` — adapter
`@astrojs/cloudflare` v14 chỉ tự điền `main` khi nó vắng mặt và build chính file nguồn này thành
`dist/server/entry.mjs`. Sau `npm run build` phải thấy: `dist/server/wrangler.json` có
`"triggers":{"crons":["*/5 * * * *"]}` và `entry.mjs` có `scheduled(` (test-kho-ipos-web nhóm 7 kiểm).
Cron giờ chỉ thử lại hàng chờ + đọc thực đơn — lượt rất nhẹ.

**Bí mật** (bí mật Worker — **không** đặt trong `wrangler.toml [vars]`, `.env`, README, không commit giá trị):

| Tên | Là gì |
|---|---|
| `IPOS_CALLBACK_KHOA` | Khóa bí mật trong địa chỉ nhận hóa đơn — chuỗi ngẫu nhiên **≥ 32 ký tự** (`openssl rand -hex 24`). Thiếu / ngắn → hook trả 503. Lộ → đặt khóa mới, gửi lại địa chỉ cho iPOS |
| `KHO_IPOS_EMAIL`, `KHO_IPOS_MAT_KHAU` | Tài khoản máy vai `may_ipos` (chủ tạo ở Cài đặt → Nhân viên & máy, mỗi chi nhánh một máy). Hook và cron đều dùng — thiếu thì hook trả 503 |
| `IPOS_ACCESS_TOKEN` | Token API iPOS — **chỉ để đọc thực đơn** `/v2/items`. Thiếu → không có thực đơn, hóa đơn vẫn nhận. (Token bản thử từng bị dán vào chat / nằm trong tài liệu mẫu — coi như đã lộ, xin token mới cho bản chạy thật) |

```bash
cd web
npx wrangler secret put IPOS_CALLBACK_KHOA
npx wrangler secret put KHO_IPOS_EMAIL
npx wrangler secret put KHO_IPOS_MAT_KHAU
npx wrangler secret put IPOS_ACCESS_TOKEN
```

Đọc theo thứ tự: tham số `env` (của `fetch` / `scheduled`) → `import { env } from 'cloudflare:workers'` →
`process.env` (chạy thử bằng Node). Chạy thử cục bộ: đặt bí mật trong `web/.dev.vars` (bị `.gitignore` chặn).

**Token / khóa không bao giờ lộ:** `kho_ipos_bat_dau` không trả token; URL có token chỉ nằm trong lời gọi
`fetch`; mọi câu lỗi đi qua `xoaToken` trước khi về trang / log / `kho_ipos_ket_thuc` (database có thêm một
lưới nữa và `kho_ipos_luu_cau_hinh` từ chối mọi thứ có chữ "token"). Hook **không log body**; câu log bị xóa
khóa, token, mật khẩu. Khóa callback chỉ đưa ra trang cho chủ (`cai_dat_goc`). Test quét cả repo tìm chuỗi
giống token (kể cả kiểu 32 ký tự in hoa + số như token mẫu trong tài liệu iPOS).

### Việc phải nhờ iPOS

1. Cấu hình `callback_url` của điểm bán = địa chỉ trên màn Kết nối iPOS (`https://beeftown.vn/hook/ipos/<khóa>`).
2. **Bật bắn MỌI hóa đơn của điểm bán** — mặc định Hub chỉ bắn đơn "liên quan partner" (voucher, đơn
   giao hàng / đặt bàn do partner tạo, ví partner…). Thiếu bước này kho không trừ đủ.
3. Cấp `access_token` bản thật (đặt bí mật Worker) và địa chỉ API thật (`api.foodbook.vn` — hiện mạng máy
   thử chỉ mở tới `apitest.foodbook.vn`).
4. Cho biết món thịt ở quầy bán theo **kg** hay theo **gói** trên máy iPOS → chọn "Bán theo" ở Ghép món.

### Câu hỏi còn mở (chưa có trong tài liệu)

1. **Hủy hóa đơn** báo thế nào? Tài liệu không có event hủy. Bộ đọc nhận mềm `is_cancel` / `status`
   (CHƯA XÁC NHẬN); HĐ bắn lại cùng `tran_id` mà nội dung khác thì database đảo ngược rồi ghi lại.
2. Món thịt ở quầy bán theo kg hay theo gói (quyết định "Bán theo" mặc định).
3. Hub có **thử lại** khi mình trả 500 / 503 không, thử mấy lần, cách nhau bao lâu? (Nếu không, hóa đơn
   lúc database lỗi bị mất — cần iPOS gửi lại hoặc đối chiếu tay.)
4. `Content-Type` Hub gửi (JSON hay text/plain) và Hub có ký / gửi header xác thực nào không (hiện chỉ dựa
   vào khóa bí mật trong đường dẫn).
5. `pos_id` trong callback có đúng là số điểm bán cấu hình ở màn Kết nối iPOS (`kho_ipos_tim_chi_nhanh`
   so `pos_parent` không phân biệt hoa thường).

**Chạy thử cục bộ:**

```bash
cd web && npm run build
npx wrangler dev --config dist/server/wrangler.json      # đọc bí mật từ web/.dev.vars
curl "http://localhost:8787/cdn-cgi/handler/scheduled"   # gọi scheduled một lần, log "[iPOS] …"
curl "http://localhost:8787/cdn-cgi/handler/scheduled?cron=2-59%2F5+*+*+*+*"   # cron báo động, log "[bao-dong] …"
curl -X POST -H 'content-type: text/plain' --data @event11.json "http://localhost:8787/hook/ipos/<khóa>"
```

(`/__scheduled` của `--test-scheduled` bị router Astro trả 404 — dùng `/cdn-cgi/handler/scheduled`.)

## 3k. Định lượng món · đối chiếu định mức bếp (GĐ7b, migration 0038)

Chủ quán đã chốt: **định lượng món chỉ để đối chiếu**. Bếp vẫn nhận thịt bằng phiếu Xuất bếp; bếp
không phải vị trí tồn; kho **không** tự trừ theo định lượng.

| Trang | Ai | Việc |
|---|---|---|
| `/noi-bo/kho/cai-dat/dinh-luong` | `danh_muc` | Danh sách món (tìm tên / mã iPOS không dấu, chip "Chưa có định lượng", "Ngừng bán", 30 món một trang — mọi thứ trên URL). `?mon=<id>` mở lưới mặt hàng × gram. Nút "Lấy món từ iPOS", "+ Thêm một món", "Dán định lượng từ Excel" → Xem trước → Áp dụng |
| `/noi-bo/kho/bao-cao/dinh-muc?tu=&den=` | `xem` (cột "Tiền lệch" chỉ `xem_gia`) | Theo mặt hàng: bếp nhận kg, lẽ ra dùng kg, lệch kg / %, số suất bán; mức (`mucLech`, tên mức giữ) in bằng nhãn chữ `TEN_MUC_LECH_NB` (`lib/kho/dinh-luong.ts`): **Vượt ngưỡng** (nền đỏ, "!"), **Gần ngưỡng** (nền xám `#E2E2E2`), **Trong ngưỡng** (viền đen, ✓), **Chưa so được** (chữ xám, không nền). Mốc nhanh như trang Báo cáo. CSV `bao-cao/dinh-muc.csv` |

**Dữ liệu** (0038, chi tiết trong comment đầu migration): `kho_mon` theo **chi nhánh** (mã món iPOS riêng từng
máy), `kho_dinh_luong` (món × mặt hàng × gram, 0 < gram ≤ 10.000). Hai bảng không có cột tiền.

- **Bếp nhận** = dòng sổ `xuat_bep` trong kỳ: phiếu Xuất bếp **và** phần "chuyển bếp" khi chốt pha lóc
  (mở lại phiên pha thì trừ lại) — **trừ** phiếu Xuất bếp có lý do `kho_ly_do.tinh_dinh_muc = false` (0044, xem dưới).
- **Lẽ ra dùng** = số suất × gram. Số suất = dòng iPOS có mã khớp `kho_mon.ma_ipos`; bỏ hóa đơn hủy, dòng `da_huy`,
  và dòng `da_ghi` (hàng bán thẳng từ quầy, đã trừ kho — bếp không nhận). Món ăn thường ghép kiểu `bo_qua` ở
  Bán hàng iPOS → vẫn được đếm.
- "Lấy món từ iPOS" (`kho_mon_tu_ipos`) lấy mã ghép kiểu `bo_qua` + mã bán chưa ghép; **không** lấy kiểu `mon` /
  `goi_can` (hàng kho bán nguyên gói). `kho_luu_mon` cũng từ chối mã đang ghép hai kiểu đó.
- Lệch % = (bếp nhận − lẽ ra dùng) ÷ lẽ ra dùng; `vuot_nguong` khi |lệch| **>** `nguong_dinh_muc_pt` (sửa ở
  Thiết lập → Ngưỡng cảnh báo). Chưa có suất bán nào khớp món → `chua_co_ban`, không đánh giá.
- Tiền lệch = kg lệch × giá vốn trung bình phần bếp nhận trong kỳ (kỳ bếp không nhận mặt hàng đó: giá vốn TB
  mọi lô của mặt hàng ở chi nhánh); database trả null cho vai không xem giá,
  web bỏ hẳn cột ở bảng và CSV (`cotDinhMuc(coGia)`).

**Web** (`lib/kho/dinh-luong.ts`): hàm thuần `tachDanDinhLuong` (Tab hoặc `;`, ô trong ngoặc kép giữ dấu ngăn,
tiêu đề Món / Mặt hàng / Gram xếp tùy ý, `dong` = số dòng trong ô dán — câu lỗi của database dùng số này),
`docLuoiDinhLuong` (ô `mh_<i>`, `gram_<i>`, `bo_<i>`, `so_dong`), `phienBanDinhLuong`, `locMon`, `mucLech`,
`cotDinhMuc` / `dinhNghiaDinhMuc` (dùng `taoCsv` / `tinhTong` của `bao-cao.ts`; dòng tổng không tính % chung).
Khớp món / mặt hàng, kiểm gram, tạo món mới khi áp dụng: **database** (`kho_nhap_dinh_luong`), không lặp ở web.

- Lưới một món: lưu = **thay toàn bộ** (`kho_luu_dinh_luong`); dòng trống / tích "Bỏ" là không có. Nút "Thêm dòng"
  (cùng form, `viec=them_dong`) dựng lại lưới với 3 dòng trống, không lưu. Form mang `phien_ban` = chuỗi
  mặt hàng:gram lúc mở; lưu mà database đã khác thì từ chối, không đè.
- Dán Excel áp dụng chỉ thêm / sửa gram, không xóa mặt hàng vắng mặt trong bảng dán; còn dòng lỗi thì từ chối cả
  bảng (trang hiện lại bản xem trước). Áp dụng lại cùng bảng không đổi gì — không cần `ma_gui`.
- **Cơm nhân viên không tính định mức** (chủ chốt 26/09, migration 0044): cột `kho_ly_do.tinh_dinh_muc` (mặc định
  `true`; lý do dùng chung toàn thương hiệu). Lý do Xuất bếp tên "Cơm nhân viên" (so tên chuẩn hóa: NFC, chữ thường,
  gộp khoảng trắng) được đặt `false` — cả dòng đã có lẫn dòng thêm sau (trigger BEFORE INSERT
  `kho_ly_do_dinh_muc_mac_dinh`; chỉ khi thêm, quản lý bật lại được). `kho_dinh_muc_tinh` bỏ dòng sổ có dòng gốc
  (dòng đảo ngược xét qua `dao_cua`) thuộc phiếu xuất có lý do `false`; chuyển bếp khi pha lóc giữ nguyên. Kho vẫn
  trừ đủ kg — chỉ báo cáo định mức và cảnh báo `dinh_muc_lech` không cộng. Web: ô tích "Tính vào định mức bếp" ở
  Vị trí và lý do (chỉ bảng Xuất bếp), một câu dưới tiêu đề báo cáo định mức (link chỉ hiện với `danh_muc`).
  Lý do khác như "Gần hết hạn" vẫn tính — muốn bỏ thì quản lý bỏ tích.
- Ô menu "Định mức bếp" / "Định lượng món" nằm dưới đường của Báo cáo / Thiết lập: `dangO` chỉ cho ô cụ thể nhất sáng.
- Cảnh báo `dinh_muc_lech` (quản lý, chủ): 7 ngày gần nhất, mỗi mặt hàng lệch một dòng; nút "Xem" mở báo cáo đúng
  7 ngày đó. Số đỏ ở ô menu "Định mức bếp" (`quyen: duyet`). Ô "Định lượng món" (`danh_muc`) nằm trong Khác và
  trong phần danh mục của Thiết lập. Bước Thiết lập `dinh_muc` là **định mức tồn quầy** — không liên quan.
- Hướng dẫn: mục `dinh-luong` (quản lý, chủ), nút "?" của cả hai trang.
- Chưa làm: cờ "món không dùng thịt" (đồ uống lấy từ iPOS nằm ở "Chưa có định lượng" tới khi chọn "Ngừng bán /
  không dùng thịt").

Test: `test-kho-dinh-luong.mjs` (database), `test-kho-dinh-luong-web.mjs` (hàm thuần, trang), nhóm 10c của
`test-kho-thu-kho.mjs` (thủ kho / NV quầy không thấy tiền lệch).

## 3l. Đặt hàng nhà cung cấp · nhận theo đơn · đánh giá NCC (GĐ8a, migration 0039)

Chủ quán đã chốt: quán lập đơn đặt hàng NCC ngay trong phần mềm, có **gợi ý số kg**; in / lưu PDF gửi
Zalo; hàng về thì nhận theo đơn; cuối kỳ xem đánh giá NCC.

| Trang | Ai | Việc |
|---|---|---|
| `/noi-bo/kho/dat-hang` | `nhap` hoặc `xem_gia` | Danh sách đơn: chip `?loc=nhap\|dang_cho\|da_nhan\|huy` (`dang_cho` = đã gửi + nhận một phần), tìm / ngày / của tôi / trang như GĐ4b. Vai xem giá thấy thêm tiền dự kiến (`kho_v_don_dat`) |
| `/noi-bo/kho/dat-hang/moi?ncc=<id>` | `nhap` | Chọn NCC (nút lớn như màn nhận hàng) → bảng gợi ý `kho_goi_y_dat_hang` điền sẵn số kg (+ số gói nếu món đếm gói), lý do một dòng nhỏ; sửa được, trống / 0 = không đặt; "+ Thêm dòng" món khác. **Lưu nháp**, hoặc **Lưu và gửi →** (nhap + duyet_nhap) → mở trang in |
| `/noi-bo/kho/dat-hang/<id>` | `nhap` hoặc `xem_gia` | Nháp: sửa món / kg / ngày giao / ghi chú (`phien_ban`), **Lưu và gửi cho nhà cung cấp**, bỏ đơn. Đã gửi: **Nhận hàng theo đơn này** (`kho_tao_phieu_nhap_tu_don`, `ma_gui`) → `/noi-bo/kho/nhan-hang/<phiếu>`; hủy đơn (quản lý / chủ, bắt buộc lý do). Bảng đặt / đã nhận / còn thiếu; phiếu nhận hàng đã gắn |
| `/noi-bo/kho/dat-hang/<id>/in` | `nhap` hoặc `xem_gia` | Tờ A4: logo, quán, số đơn, ngày đặt / giao, NCC (liên hệ chỉ vai xem giá — bảng NCC có RLS xem_gia), món, kg, gói, ghi chú, chỗ ký. Giá chỉ khi xem giá **và** tích "In kèm giá dự kiến" (`?gia=1`). Nút **In / Lưu PDF**, **Chia sẻ (Zalo…)** (Web Share, `in-an.js`), ô chép tin nhắn (`tinNhanDon`) |
| `/noi-bo/kho/bao-cao/ncc?tu=&den=` | `nhap` hoặc `xem_gia` | Đánh giá NCC (`kho_bao_cao_ncc`): lần giao, kg, đơn thiếu / trễ, thu hồi pha TB, kg trả, điểm sao; vai xem giá thêm giá TB/kg, lệch hóa đơn, ngày trả tiền TB. CSV `bao-cao/ncc.csv` (cùng quyền) |

- **Ai làm gì** (database chặn — đầu 0039): lập / sửa **nháp** = `nhap` (thủ kho cũng lập, chỉ kg); giá dự kiến =
  `nhap + xem_gia`; **gửi** và hủy đơn đã gửi = `nhap + duyet_nhap` (quản lý, chủ — kế toán chỉ xem). Web ẩn nút
  theo đúng luật đó (`guiDuoc`, `huyDuoc`).
- **Thủ kho không thấy tiền**: danh sách, đơn, gợi ý đọc bằng `kho_ds_don_dat_kg`, `kho_doc_don_dat_kg`,
  `kho_goi_y_dat_hang` (không cột tiền). Giá dự kiến đọc thẳng `kho_don_dat_dong` / `kho_v_don_dat` (RLS xem_gia) **chỉ khi**
  `k.duoc('xem_gia')`. `docFormDonDat(form, mon, { coGia })`: không xem giá thì **không dòng nào có khóa**
  `don_gia_du_kien` (database từ chối nếu có; dòng thiếu khóa giữ giá cũ theo mặt hàng); xem giá thì mọi dòng có khóa,
  ô trống = null (xóa giá).
- **Form đơn** (một dạng cho lập và sửa): dòng có sẵn = ô ẩn `mh` lặp lại + `kg_<mặt hàng>`, `goi_<…>`, `gia_<…>`;
  dòng thêm = `t<i>_mh`, `t<i>_kg`, `t<i>_goi`, `t<i>_gia`, số dòng `so_dong` (≤ 30). Lỗi thì hiện lại đúng chữ đã gõ
  (`chuFormDonDat`), giữ `ma_gui`.
- **Gợi ý** (công thức ở comment `kho_goi_y_dat_hang`): nên đặt = mức cần − (tồn kho + quầy còn hạn + đang mang ra quầy +
  đã đặt chưa về); mức cần = `kho_toi_da_kg` của món, chưa cài thì dùng TB/ngày 28 ngày × (số ngày giao + 3). Món của NCC
  = món NCC đó giao gần nhất. Trang chỉ hiện số và `ly_do` database trả — không tính lại ở web.
- **Nhận theo đơn**: `nhan-hang/moi` có phần "Nhận theo đơn đặt" (đơn `dang_cho`, `docDonChoNhan`) — bấm là tạo phiếu
  nháp điền sẵn món / kg còn thiếu (món đã đủ — ≥ 95% kg hoặc đủ gói — không điền lại) rồi mở bước 2 (ảnh hóa đơn chụp bằng "Thêm ảnh"). `nhan-hang/<id>` đọc khóa
  `don_dat` của `kho_doc_phieu_nhap_kg`: mỗi dòng nhãn "Đặt N kg" (món không có trong đơn: "Ngoài đơn"), form thêm món
  nhắc món trong đơn chưa cân. Trạng thái đơn tự đổi khi phiếu được gửi / duyệt / trả về (trigger 0039).
- **Cài đặt**: NCC có ô "Số ngày giao hàng" (0–60, trống = 1) và "Thứ giao hàng" (ô tích `thu_giao`; không tích / tích
  đủ 7 = ngày nào cũng giao → null) — ghi thẳng bảng như các cột NCC khác. Mặt hàng có "Kho lạnh tối thiểu / tối đa
  (kg)" — `luuMatHang` ghi qua `kho_luu_muc_dat_hang` sau khi lưu mặt hàng (chỉ khi đổi).
- Menu: ô "Đặt hàng" (`quyen: nhap`, số đỏ `don_dat_tre` — chỉ quản lý / chủ nhận), thao tác nhanh "Đặt hàng" của quản
  lý / chủ, bước đầu quy trình Nhận hàng. Kế toán vào qua link (Báo cáo → Đánh giá NCC → Đơn đặt hàng).
- Hướng dẫn: `dat-hang` (quản lý, chủ, kế toán — có nhắc giá), `danh-gia-ncc`, `nhan-theo-don` (thủ kho — không nhắc
  tiền), câu hỏi `hoi-goi-y-dat-hang`.
- Chưa làm: cột "NCC chính" của mặt hàng (gợi ý theo NCC giao gần nhất); gửi PDF thật qua Zalo (Web Share chỉ gửi chữ —
  file PDF lưu bằng hộp in của trình duyệt).

Test: `test-kho-dat-hang.mjs` (database), `test-kho-dat-hang-web.mjs` (hàm thuần, các hàm của `dat-hang.ts` chạy thật trên
PGlite qua client giả, mã nguồn trang), nhóm 10d của `test-kho-thu-kho.mjs`.

## 3m. Công nợ kiểu iPOS · hóa đơn gộp · bù trừ / hoàn tiền · trả hàng hai bước · MISA (GĐ8b, migration 0040)

Chủ quán đã chốt: hóa đơn NCC có **cả hai kiểu** (mỗi lần giao một hóa đơn, hoặc gộp nhiều lần giao);
kế toán dùng **MISA** nhưng chưa có file mẫu. Chỉ vai `ke_toan` (chủ, quản lý, kế toán) thấy các màn
tiền ở giai đoạn này; thủ kho chỉ làm phần **kg** của trả hàng.

| Trang | Ai | Việc |
|---|---|---|
| `/noi-bo/kho/cong-no` | `ke_toan` | Dải công thức **Nợ đầu kỳ + Mua − Đã trả − Giảm trừ = Còn phải trả** (`congThucCongNo`, "Xem ví dụ" là `<details>`), 4 ô số (quá hạn, đến hạn 7 ngày, chưa đối chiếu, trả hàng chờ tiền), thẻ `?tab=ncc\|phieu\|thanh-toan\|theo-doi`, chip `?loc=qua_han\|den_han\|chua_doi_chieu\|gop`, tìm + ngày + trang như GĐ4b, dòng tổng cuối bảng. Link cũ `?loc=…` không có `tab` mở thẻ Theo phiếu |
| `/noi-bo/kho/cong-no/<ncc>` | `ke_toan` | Số dư, phiếu còn việc, nút **Trả tiền** / **Đối chiếu hóa đơn gộp** / **In biên bản đối chiếu**, mục "Hóa đơn gộp" (bỏ đối chiếu, bắt buộc lý do), dòng đỏ khi số tài khoản vừa đổi ≤ 30 ngày (`doiTaiKhoanGanDay`). Phiếu trong hóa đơn gộp không có form đối chiếu lẻ |
| `/noi-bo/kho/cong-no/<ncc>/tra-tien` | `ke_toan` | Bước 1: cách trả (`KIEU_TRA`: chuyển khoản, tiền mặt, bù trừ, NCC hoàn tiền, giảm trừ) + số tiền → **Xem trước cách chia** hoặc **Trả đủ** (`kho_xem_truoc_thanh_toan`, `p_so_tien` null). Bước 2: bảng chia sửa được, ngày, ghi chú, ảnh → `kho_ghi_thanh_toan_v2` (`ma_gui`) |
| `/noi-bo/kho/cong-no/<ncc>/hoa-don-gop` | `ke_toan` | Tích phiếu (chưa đối chiếu tích sẵn; `?tu=&den=` lọc ngày nhập), số HĐ, ngày, tổng, thuế → **Xem trước** (`xemTruocHoaDonGop`) → **Lưu đối chiếu** (`kho_doi_chieu_hoa_don_gop`, `ma_gui`); lệch tổng phiếu bắt buộc lý do |
| `/noi-bo/kho/cong-no/<ncc>/doi-chieu?tu=&den=` | `ke_toan` | Biên bản đối chiếu công nợ A4 (`kho_cong_no_theo_ky`): đầu kỳ, từng chứng từ, số dư chạy, cuối kỳ, câu xác nhận, chỗ ký. `InDau` + `KyTen` + `NutIn` |
| `/noi-bo/kho/cong-no/tra-hang` | `nhap` hoặc `ke_toan` | Không tham số: danh sách lô **nhập mua** ở kho / quầy (tìm, trang) → **Trả lô này**; kế toán thấy thêm `#cho-tien`. `?lo=&vi_tri=`: ghi **kg** (`kho_tra_hang_ghi_kg`, ảnh vào thư mục `huy`). `?phieu=` (kế toán): trả một bước có tiền như GĐ3 |
| `/noi-bo/kho/cong-no/misa` | `ke_toan` | Kỳ + loại (`mua_hang` / `thanh_toan`) + dấu ngăn → xem trước 50 dòng (đúng cột file), số dòng thiếu mã (link sửa NCC, ô mã MISA mặt hàng ngay tại chỗ — `kho_luu_ma_misa_mat_hang`), mã tài khoản mặc định (`kho_luu_misa_tk`). Tải: `/noi-bo/kho/cong-no/misa.csv?tu=&den=&loai=&ngan=phay` |

**Thanh toán bốn loại.** View giữ công thức cũ: `da_tra` = tiền trả + bù trừ − NCC hoàn tiền, nên
còn nợ = phải trả − đã trả − giảm trừ không đổi và mọi chỗ cũ chạy đúng. Chi tiết ở cột cuối view
(`tien_tra`, `bu_tru`, `hoan_tien`, `hoa_don_gop_id`; view NCC thêm `so_phieu_hoa_don_gop`,
`no_den_han_7_ngay`). Bù trừ bắt buộc ghi chú; NCC hoàn tiền chỉ chia vào phiếu đang âm, không vượt 0.
Form Trả tiền: bảng chia có ô ẩn `pb<i>_goi_y` (số database gợi ý). Không ô nào khác gợi ý →
`docFormTraTien` gửi `p_phan_bo` rỗng, database tự chia lại lúc ghi; sửa bất kỳ ô nào → gửi đủ phần chia,
tổng phải bằng số tiền. Hàm database cũ `kho_ghi_thanh_toan` còn đó (không trang nào gọi nữa); hàm web v1
`ghiThanhToan` / `docFormThanhToan` đã xóa 12/10/2026 — kiểm thử của nó chuyển sang `docFormTraTien`.

**Hóa đơn gộp.** Web xếp phiếu theo ngày nhập rồi số phiếu và chia bằng `chiaSoDuLonNhat` — y như
database; test so từng đồng với `kho_hoa_don_phieu`. Chỉ phiếu mua (không gộp nợ đầu kỳ), ≥ 2 phiếu.
Bỏ đối chiếu gộp chỉ khi các phiếu chưa có khoản tiền nào. Cài đặt NCC có "Kiểu hóa đơn" (chỉ để
nhớ — không chặn gì) và "Mã MISA".

**Trả hàng hai bước.** Thủ kho: Tồn kho (link nhỏ **Trả NCC** ở lô `nguon = 'nhap'`, người có `nhap`),
thao tác nhanh **Trả hàng NCC**, hoặc trang trả hàng → ghi kg một lô. Phiếu XT- `cho_xac_nhan_tien`
(nhãn "Chờ kế toán xác nhận"). Kế toán: số đỏ `tra_hang_cho_tien` trên ô Công nợ (`KHOA_CONG_NO`) và
bước "Trả hàng nhà cung cấp" của quy trình; câu ở `viec.ts` trỏ `/noi-bo/kho/cong-no/tra-hang#cho-tien`.
Ô tiền trống = số tự tính (`so_tien_goi_y`), 0 = không trừ. Ghi xong thủ kho sang trang phiếu XT-.
Phiếu còn chờ tiền hủy được (`kho_huy_tra_hang_cho_tien`, bắt buộc lý do): người ghi phiếu ở trang
phiếu (`xuat/<id>`), kế toán / quản lý ở hàng chờ `#cho-tien` — đảo sổ `tra_ncc` (hàng về lại đúng lô,
đúng chỗ), phiếu `da_huy`. Đã xác nhận tiền thì không hủy được (như trả một bước 0024).

**Đổi số tài khoản NCC.** Trigger ghi `kho_ncc_tk_nhat_ky`; sự kiện `ncc_doi_tai_khoan` cho chủ (link
`cai-dat/nha-cung-cap?sua=<id>`, màn sửa hiện các lần đổi). Chỉ báo khi đã có số cũ và số (bỏ dấu
cách) hoặc ngân hàng thật sự khác; lưu NCC như vậy → câu báo nhắc gọi hỏi lại (`canhBaoDoiTaiKhoan`,
`doiTaiKhoanGanDay` — cùng luật với database; điền lần đầu, gõ thêm dấu cách không báo).

### MISA — chỉnh `COT_MISA` khi có file mẫu

`lib/kho/misa.ts` là file **thuần** (không import, không gọi database). Mọi giả định nằm ở hai hằng đầu
file ghi "CHỈNH KHI CÓ FILE MẪU": `COT_MISA` (thứ tự, tên cột của hai loại file) và `DINH_DANG_MISA`
(ngày `dd/MM/yyyy`; dấu ngăn `;` thì số lẻ dùng `,`, dấu `,` thì số lẻ dùng `.`). CSV: BOM UTF-8, CRLF,
ô có dấu ngăn / nháy / xuống dòng bọc `"…"`, tiền là số nguyên **không** phân cách nghìn, ô chữ bắt đầu
bằng `= + - @` thêm `'` (Excel không chạy công thức), cột cuối "Thiếu mã MISA" = `x`. Không xuất
`.xlsx` — Excel mở CSV rồi lưu lại nếu MISA đòi. Dữ liệu (TK nợ / có, mã thay thế khi thiếu, thuế
chia từng dòng) do `kho_du_lieu_misa` quyết định. Có file mẫu thì: sửa hai hằng, sửa test nhóm 1 của
`test-kho-cong-no-v2-web.mjs`. Mã số thuế / số hóa đơn có số 0 ở đầu vẫn ghi nguyên trong CSV, nhưng
Excel mở thẳng sẽ bỏ số 0 — trang MISA dặn kế toán mở bằng "Từ văn bản/CSV" và chọn kiểu Văn bản; khi
có file mẫu, xem MISA nhận cột đó dạng nào rồi mới đổi cách ghi (không tự thêm `="…"`).

Test: `test-kho-cong-no-v2.mjs` (database), `test-kho-cong-no-v2-web.mjs` (misa.ts, hàm thuần của
cong-no.ts, vòng thật trên PGlite: chia hóa đơn gộp web = database, form Trả tiền → v2, sổ theo kỳ khớp
view, CSV từ dữ liệu MISA thật; mã nguồn trang), nhóm 10e của `test-kho-thu-kho.mjs`.

## 3n. Sửa hàng loạt · công thức dạng lưới · vị trí + lý do một form · ai làm được gì · trung tâm báo cáo (GĐ8c, migration 0041)

| Trang | Ai | Việc |
|---|---|---|
| `/noi-bo/kho/cai-dat/mat-hang/sua-nhanh?loai=&nhom=&tim=` | `danh_muc` | Bảng mọi món, mỗi ô một input: giá bán, HSD, mã cân, quầy tối thiểu / tối đa (gói), quầy tối thiểu (kg), kho lạnh tối thiểu / tối đa, sau pha để ở, đang dùng. Một nút **Lưu tất cả** (form POST) → `kho_sua_nhanh_mat_hang`. Chip loại / nhóm, ô tìm (bỏ dấu) — trên URL. Điện thoại: cuộn ngang, cột tên món `position: sticky` |
| `/noi-bo/kho/cai-dat/cong-thuc?sua=<id>[&goi_y=1]` | `danh_muc` | Mỗi công thức một **lưới** phần ra × tỷ lệ % × xử lý × thứ tự × Bỏ; nút **Tính lại** (đầu form = phím Enter, không lưu), **Thêm dòng**, **Lưu công thức**; **Nhân bản công thức**; **Gợi ý từ thực tế** |
| `/noi-bo/kho/cai-dat/vi-tri-ly-do` | `danh_muc` | Vị trí + bốn bảng lý do trong **một** form, 2 dòng trống mỗi bảng để thêm, **Lưu tất cả** |
| `/noi-bo/kho/cai-dat/quyen` | `xem` (mọi vai) | "Ai làm được gì": một câu mỗi vai (`tomTatVai` — "Thủ kho: …; KHÔNG thấy giá tiền.") + bảng việc × vai. Ô menu "Ai làm được gì" (`quyen: xem`) |
| `/noi-bo/kho/bao-cao?tu=&den=` | `xem` | **Trung tâm báo cáo** (làm lại): mốc nhanh, thẻ tóm tắt (chỉ `xem_gia`), thẻ báo cáo theo nhóm ẩn theo quyền. Link cũ `?bao_cao=<tên>` → 301 sang `bao-cao/<tên>` |
| `/noi-bo/kho/bao-cao/<xuat-nhap-ton\|thu-hoi\|hao-hut\|ban>` | `xem_gia` | Trang `[loai].astro` (tách từ trang Báo cáo cũ, cùng `docBaoCao`) |
| `/noi-bo/kho/bao-cao/theo-thang?nam=` | `xem` (cột tiền chỉ `xem_gia`) | `kho_bao_cao_theo_thang` — mỗi tháng một dòng |
| `/noi-bo/kho/bao-cao/mua-hang?nhom=ncc\|mat_hang&tu=&den=` | `xem_gia` | `kho_bao_cao_mua_hang` |
| `/noi-bo/kho/bao-cao/so-thanh-toan?tu=&den=` | `ke_toan` | `kho_so_thanh_toan` — khoản đã hủy mờ, tiền 0; in có chỗ ký |

**Sửa nhanh** (`lib/kho/sua-nhanh.ts`). Form mỗi dòng: `id` (lặp), `pb_<id>` = `updated_at` lúc đọc (chuỗi nguyên văn
từ PostgREST — database ép lại `timestamptz` rồi so), `<ô>_<id>` chữ gõ, `cu_<ô>_<id>` giá trị lúc mở (ô ẩn).
`docFormSuaNhanh` chỉ gửi dòng có ô đổi và chỉ các ô đó:

- **Ô để trống = GIỮ** (đúng đặc tả). Muốn xóa hẳn một ô thì gõ **`-`** (`CHU_XOA`) → gửi `null`. Ô vốn trống mà gõ `-` → không gửi.
- So "đổi chưa" trên dạng chuẩn: `650.000` = `650000` (tiền), `1.5` = `1,5` (kg), `0101` = `101` (mã cân). Gửi số khi
  đọc được; chữ sai gửi nguyên văn để **database** báo đúng ô (web không lặp luật).
- Database lưu **tất cả hoặc không**, trả `loi[{dong,id,ten,truong,cau}]`: trang tô đỏ ô `truong`, hiện câu dưới dòng
  đó, giữ chữ đã gõ ở mọi dòng (`chuGo`). Dòng lỗi "vừa được người khác sửa" (`laLoiPhienBan`) bỏ chữ gõ, hiện số mới.
- Bảng đọc `kho_mat_hang` bằng `docMonSuaNhanh` (không cột giá vốn nào). Ô "Sau pha để ở" không hiện ở món loại tảng.
  Thêm món, đổi tên / loại / mã / đơn vị: vẫn ở trang Mặt hàng.

**Công thức dạng lưới** (`lib/kho/cong-thuc.ts`). Ô `mh_<i>`, `tl_<i>`, `xl_<i>`, `tt_<i>`, `bo_<i>`, `so_dong`.
Tổng chạy tính **ở máy chủ** (`tongChu`) khi bấm Tính lại / Thêm dòng / lỗi: 95–100% là ổn; dưới 95% câu tổng ghi "dưới 95%"
(phần còn lại coi là hao hụt); vượt 100% câu tổng ghi "vượt 100%" (`cauTong`; `mauTong` giữ tên mức `xanh` / `vang` / `do`). Lưu = thay toàn bộ phần ra: upsert
(`cong_thuc_id, mat_hang_ra_id`) rồi xóa dòng không còn — không có hàm database riêng, `phien_ban` = chuỗi phần ra
(`phienBanCongThuc`) so với bản đọc lại. "Gợi ý từ thực tế" (`docGoiYThucTe`): phiên `kho_phien_pha` đã chốt
(`da_chot`) của đúng loại tảng, chi nhánh đang chọn, `ngay_pha` trong 30 ngày → Σ kg ra từng món ÷ Σ `tong_kg_vao`
(`tinhGoiY`) — chỉ kg; cột "Gợi ý" để người dùng tự chép, không tự điền đè.

**Vị trí + lý do** (`docFormViTriLyDo` → `luuViTriLyDo`): ô `vt_ten_<id>`, `vt_loai_<id>`, `vt_thu_tu_<id>`,
`vt_dang_dung_<id>`, `ld_*_<id>` (lý do hủy có ô ẩn `ld_co_anh_<id>` để biết ô tích có trên form; lý do Xuất bếp
có ô ẩn `ld_co_dm_<id>` + ô tích `ld_tinh_dm_<id>` = cột `tinh_dinh_muc`, 0044), dòng mới
`vt_moi_*_<i>`, `ld_moi_*_<loại>_<i>` (Xuất bếp mới: `ld_moi_co_dm_xuat_bep_<i>` + `ld_moi_tinh_dm_xuat_bep_<i>`, mặc định tích). Kiểm hết trước khi ghi (tên trống ở dòng có sẵn = lỗi, nhắc "Ngừng dùng");
chỉ dòng đổi mới ghi, từng lệnh một (không có hàm gộp — lỗi giữa chừng báo "Đã lưu N dòng, chưa lưu được …").
`phien_ban` = băm FNV của hai bảng (`phienBanViTriLyDo`). Vị trí hệ thống: không đổi loại, không tắt.

**Ai làm được gì.** `MO_TA_VIEC: Record<ViecKho, {ten, moTa}>`, `VAI_BANG_QUYEN`, `TEN_VAI_DAY`, `viecCuaVai`,
`tomTatVai` ở `lib/kho/chung.ts` (thuần). Thêm việc mới vào `QUYEN_KHO` mà quên câu mô tả → lỗi kiểu +
test-kho-giao-dien nhóm 16 đỏ.

**Trung tâm báo cáo** (`lib/kho/bao-cao.ts`):

- `kyNhanh` thêm **Quý này**, **Năm nay**; component `ChonKy.astro` (mốc nhanh + hai ô ngày + Xem + nút CSV
  `formaction`) và `BangBaoCao.astro` (bảng theo `DinhNghiaBaoCao` + dòng tổng `tinhTong`) dùng chung các trang báo cáo.
- Thẻ tóm tắt (vai xem giá): cộng `kho_bao_cao_xnt_v2` (`tomTatXnt`: hao hụt = mất khi ra quầy + kiểm kê thiếu − thừa;
  chi phí thịt = bán + xuất bếp + xuất khác + hủy + hao hụt — như `kho_bao_cao_theo_thang`). Doanh thu iPOS lấy từ
  `kho_bao_cao_theo_thang` **chỉ khi kỳ trùng trọn tháng** (`doanhThuKy`; kỳ lẻ ngày → không có doanh thu).
- `THE_BAO_CAO`: `{ma, nhom, ten, moTa, link, quyen, ky: ngay|nam|khong, csv}`; `theBaoCaoCuaVai`, `linkTheBaoCao`.
  `quyen` phải khớp dòng chặn trang đích — test so từng vai (thấy thẻ ⇔ vào được). Thủ kho thấy Theo tháng, Định mức
  bếp, Đánh giá NCC; NV quầy thấy Theo tháng, Định mức bếp. Ô menu "Báo cáo" vẫn `xem_gia` (thủ kho tới qua link).
- Định nghĩa cột: `dinhNghiaTheoThang(coGia)` (không xem giá = bỏ hẳn cột tiền; dòng tổng không cộng tồn đầu / tồn cuối),
  `dinhNghiaMuaHang(nhom)`, `DN_SO_THANH_TOAN`. Đọc: `docTheoThang`, `docMuaHang`, `docSoThanhToan`.
- CSV (`bao-cao/[ten].csv.ts`): thêm `theo-thang.csv?nam=` (`xem`), `mua-hang.csv?nhom=` (`xem_gia`), `so-thanh-toan.csv`
  (`ke_toan`). Mọi trang báo cáo in được: `InDau` + `NutIn` (thêm cho `dinh-muc`, `ncc`); sổ thanh toán có `KyTen`.
- Link cũ `bao-cao?bao_cao=…` trong `index.astro` (thẻ quản trị) và `quy-trinh.ts` đã đổi sang `bao-cao/<tên>`.

Hướng dẫn: mục mới `sua-nhanh`, `quyen` (nhóm Bắt đầu); viết lại `bao-cao`, `cong-thuc`, `vi-tri-ly-do`.

Test: `test-kho-sua-nhanh.mjs` (database), `test-kho-sua-nhanh-web.mjs` (hàm thuần; cột web ⊂ cột hàm; vòng thật
form → `kho_sua_nhanh_mat_hang` trên PGlite; báo cáo theo quyền; mã nguồn trang), `test-kho-giao-dien.mjs` nhóm 16
(trang quyền phủ đủ việc, thẻ báo cáo ẩn theo quyền = dòng chặn trang, CSV có nhánh).

## 3o. Theo dõi theo tảng · bảng ủ · repack · truy vết · bán theo ô (migration 0048–0051)

Thịt ủ (ribeye, striploin…) phải truy tới **từng tảng**: mỗi tảng có ngày mổ riêng → số ngày ủ, hạn
dùng khác nhau; có sự cố thì huỷ đúng miếng của tảng đó. Chỉ với món bật `kho_mat_hang.theo_tang`
(Thiết lập → Mặt hàng, món loại Tảng) — món khác không đổi gì.

- **Nhận hàng**: mỗi dòng là **một tảng** (`so_goi = 1`), cân riêng, có `ngay_mo`. Vẫn giữ luật
  "một dòng phiếu nhập = một lô", nên duyệt, huỷ, trả NCC, công nợ, kiểm kê không phải sửa. Thêm một tảng
  xong, form điền sẵn món và ngày mổ cho tảng sau (`?tiep=&mo=`).
- **Số tảng cấp lúc lưu dòng (0097, Khánh chốt 25/10/2026)**: `kho_ghi_dong_phieu_nhap` cấp số (bộ đếm
  `kho_so_thu_tu` loại `T`, tăng dần theo chi nhánh, hiện "#0142") cho dòng tảng ngay khi thủ kho lưu — túi
  có số trước khi vào tủ ủ. Số ghi ở `kho_phieu_nhap_dong.so_tang` và sổ `kho_so_tang_cap` (số → phiếu, người
  cấp, lúc cấp). Hai hàm lưu xoá hết dòng rồi ghi lại, nên số đi theo **khóa `so_tang`** của từng dòng: web
  gửi lại số database đã cấp (`dongLuuTuPhieu`, `ghepDongNhan`, ô ẩn `d{i}_so_tang` của màn Phiếu nhập) —
  database chỉ nhận số của chính phiếu đó, chưa bỏ, không trùng dòng; không gửi thì cấp số mới. Thêm tảng
  xong chuyển về `?tiep=&mo=&vua=<chỉ số dòng>&pb=<phien_ban của chính lần lưu>`: form hiện to số để viết lên
  túi (`soTangVuaThem` — chỉ khi phiếu đọc lại đúng phiên bản đó). Bấm đúp "+ Thêm dòng": nhánh "đã thêm từ
  lần bấm trước" chỉ nhận dòng cuối khi số của nó do chính tài khoản này cấp (`so_tang_toi_cap` của
  `kho_doc_phieu_nhap_kg`), không hiện to số, câu chỉ số ở dòng cuối; tảng giống hệt mà tài khoản khác vừa thêm
  thì báo "máy khác" như thường. Lần bấm trước nhận ra theo **form** (phiếu đọc lại hơn form đúng một phiên bản, và
  đúng một dòng hơn số dòng lúc form hiện — lấy từ ô ẩn `so_dong` của form, `docSoDongForm`), không theo phiếu mà lần
  bấm sau đọc — lần sau có thể đọc phiếu khi lần trước đã ghi xong. Không suy số dòng lúc form hiện từ phiếu đọc lúc
  bấm: máy khác lưu chen mà không thêm dòng (sửa đầu phiếu, thêm ảnh, sửa / bỏ dòng khác) cũng làm phiếu lên đúng
  một phiên bản, rồi dòng mới giống hệt dòng cuối sẽ bị báo "đã thêm" khi database không ghi gì. Thiếu ô `so_dong`
  (form mở trước khi có ô) thì chỉ nhận khi phiếu đọc lúc bấm cùng phiên bản form; không thì "máy khác". Sửa dòng: câu và chuyển hướng do `ketQuaSauSuaDong` chọn (tảng chưa số → tảng: "Tảng
  này vừa được cấp số", khác món thường → tảng: "Dòng này giờ là một tảng"). Bấm đúp "Lưu dòng này": id dòng đổi sau
  mỗi lần lưu nên lần sau không còn `dong_id` — trang chuyển về form thêm **trống** với câu `ketQuaDongSuaKhongCon`
  ("có thể đã được lưu ở lần bấm trước" khi phiếu hơn form đúng một phiên bản), không hiện lại chữ đã gõ (form sẽ
  thành form thêm điền sẵn, bấm nữa là thêm tảng thừa có số mới). Bản in phiếu nhập in số của dòng khi chưa có lô.
- **Tảng lưu trước 0097** (chưa có số, hay món bật theo tảng sau khi lưu): lần lưu nào đầu tiên (thêm ảnh, sửa
  đầu phiếu, thêm / sửa / bỏ dòng) cũng cấp số cho mọi tảng đó. `luuPhieuNhan` đọc lại phiếu và câu báo kể các
  số vừa cấp (`soTangMoiCap`, `noiCauTangMoi`) để viết lên túi; đọc lại hỏng thì vẫn báo đã lưu, kèm câu "có thể
  vừa được cấp số — tải lại trang".
- **Số bỏ trống**: dòng tảng bị bỏ, đổi sang món thường, web cũ không gửi lại số → `bo_luc` trong sổ, không
  bao giờ cấp lại; màn nhận hàng báo "gạch số trên túi" (`cauSoTangBo`) và liệt kê `so_tang_bo` của
  `kho_doc_phieu_nhap_kg` dưới "Hàng đã cân" (gồm số của phiếu đã hủy mà chưa thành lô). Người duyệt cũng
  thấy: màn Phiếu nhập / điền giá (`nhap/[id]`, cả bản in) hiện "Số tảng đã bỏ" dưới dòng trạng thái
  (`docSoTangBo`) — từ 0097 `kho_doc_phieu_nhap_kg` nhận quyền `nhap` **hoặc** `duyet_nhap` (kế toán; hàm không
  trả tiền). Chỉ ghi sổ, không chuông. Dãy số lô vì thế có chỗ hở — sổ giải thích từng chỗ.
- **Duyệt**: lô tảng mang đúng `so_tang` của dòng (bộ đếm không tăng lúc duyệt), `ngay_mo`,
  `ngay_u_xong = ngày nhận + kho_so_ngay_u(món, ngày nhận − ngày mổ)`; dòng đã duyệt mang đúng số của lô.
  Dòng chưa có số (tồn đầu kỳ dạng lưới, phiếu lưu trước 0097, món bật theo tảng sau khi lưu) thì duyệt
  sinh như cũ và ghi sổ; dòng có số mà món đã tắt theo tảng thì số ghi bỏ, lô không số. Phiếu mua có dòng
  tảng chưa tách / thiếu ngày mổ (ví dụ tạo từ đơn đặt hàng) thì chưa duyệt được — tách thành từng tảng (lưu)
  là có số.
- **Bảng ủ** `kho_bang_u` (dùng chung toàn thương hiệu, sửa bằng quyền danh mục): gõ dạng
  `5:18, 10:14, 10` ở form mặt hàng (`docChuBangU` / `chuBangU` trong `lib/kho/tang.ts`; `soNgayU` cùng
  luật với `kho_so_ngay_u`, test so từng tuổi).
- **Màn Tảng · ủ** (`/noi-bo/kho/tang`, view `kho_v_tang`): tảng còn tồn — sẵn sàng lóc / đang ủ còn
  mấy ngày / chưa có bảng ủ. Không có tiền.
- **Ô mã xoay vòng (0049)**: phần cắt của món theo tảng có vài ô mã cố định (`kho_o_ma`, form mặt hàng
  gõ `10011-10019`; tạo một lần trên FABi cùng giá). Mã ô không trùng mã cân món đang dùng (trigger hai
  phía). Phiên lóc món theo tảng chỉ **một tảng**; bấm **Giao ô mã cho phần cắt** (`kho_giao_o_ma`, quyền
  pha_loc) → mỗi phần cắt có ô trong công thức của tảng nhận một ô trống ở chi nhánh. Nhãn in bằng mã ô
  phải thuộc ô của chính phiên. Chốt → ô gắn lô ra (`kho_o_ma_giao.lo_id`); mở lại → bỏ; huỷ phiên → trả
  ô. Lô ra hết tồn thì lần giao sau tự đóng ô cũ; quản lý giải phóng tay được (`kho_giai_phong_o_ma`).
  Quét kiểm kê cũng nhận nhãn mã ô (`kho_mat_hang_theo_ma_can`). View `kho_v_o_ma_giao`.
- **Một ô, một lô — lô có khay mang nhãn (0088)**: ô chỉ nhớ được một lô, còn chốt phiên sinh một lô cho mỗi
  dòng ra giữ lại. Trigger `kho_phien_pha_ra_o_ma` vì vậy chỉ cho ô theo lô của dòng **nhập kho**; dòng
  **chuyển thẳng bếp** của cùng phần cắt (lô sinh ra rồi xuất hết ngay) không đụng tới ô. Trước 0088 dòng
  chốt sau cùng thắng: ô rơi vào lô chuyển bếp, sổ coi ô trống, tảng sau lấy lại đúng ô đó và mọi khay của
  tảng trước bị trừ vào tảng sau (phiếu quét nhãn lẫn hóa đơn iPOS). **Hai dòng nhập kho** của cùng phần cắt
  đang giữ ô (4 khay → Quầy + 6 khay → Kho lạnh) thì **chốt bị từ chối**, câu bảo gộp thành một dòng, chốt
  xong rồi chuyển ra quầy. Chỉ gặp khi gõ tay: món đã quét nhãn thì database không cho dòng thứ hai (0033).
  Phiên không giao ô mã không đổi gì. **Chốt phiên mà phần cắt giữ ô không có dòng nhập kho nào** (chỉ chuyển
  thẳng bếp, hoặc không cắt ra — `kho_giao_o_ma` giao ô cho mọi phần cắt có ô trong công thức) → trigger
  `kho_phien_pha_chot_tra_o_ma` trả ô ngay lúc chốt. Trước đây ô nằm lại không lô với phiên đã chốt: Beeftown
  Cân hiện "Đang lóc", phiếu và màn Quét nói "phiên lóc chưa chốt". Mở lại phiên rồi cần lại ô thì bấm "Giao ô
  mã" lần nữa. Test: `test-kho-o-ma-mot-lo.mjs`.
- **Tra mã trên nhãn ở web — một bộ tra chung** (`lib/kho/tra-ma-can.ts`, file thuần): `taoBangTraMaCan` +
  `traMaCan` soi đúng `kho_mat_hang_theo_ma_can` (món đang dùng có mã đó → ô mã của món đang dùng → mã giảm
  giá, mà không ô nào mang mã đó; bỏ số 0 đầu), trả món kèm lý do khớp: mã món / ô mã + số ô / mã giảm + %.
  `test-kho-tra-ma-can.mjs` so từng mã với hàm SQL trên cùng dữ liệu và giữ một bản chép thân hàm — **đổi
  luật trong SQL thì sửa file này cùng PR**. Bốn chỗ dùng: màn Quét nhãn, quét nhãn vào phiếu chuyển / xuất
  bếp / xuất khác / báo hủy (`dongTuQuet`), kiểm kê dán nhãn (`apDungQuet`), "Thử một nhãn" ở Mã vạch cân. Ô
  mã và mã giảm đọc **một lần mỗi yêu cầu** (`docMaTrenNhan`), cùng `Promise.all` với danh mục.
- **Quét nhãn mã ô vào phiếu → đúng lô của tảng** (`dongTuQuet` với `datLo`): một món được ghi ở phần **chọn
  lô**, vào dòng lô của tảng trên nhãn, khi mọi nhãn của món trong lượt quét đều là nhãn mã ô, ô nào cũng
  đang giao cho một tảng có lô ở nơi lấy hàng, lô đủ tồn (tính cả số đã ghi ở dòng lô đó) và món chưa có
  số ở dòng theo món. Thiếu một điều → cả món ghi theo món (database lấy hàng hạn gần trước như nhãn
  thường), có khung lưu ý nói vì sao: sổ chỉ còn N khay của tảng, tảng không còn hàng ở nơi lấy, phiên lóc
  chưa chốt, ô không còn gắn với tảng. Trộn nhãn mã ô với nhãn mã món / mã giảm của cùng món thì ghi theo
  món, không câu báo. Form vẫn giữ luật "một món chỉ ghi một phần" nên một lượt quét không bao giờ tách một
  món ra hai phần — không khay nào bị tính hai lần. Nhãn của lô **đã hết hạn** trên phiếu chỉ nhận hàng
  còn hạn thì **không ghi vào đâu**, khung lưu ý bảo để riêng và báo hủy — kể cả khi sổ không còn lô đó ở nơi
  lấy (sổ lệch với kệ, lô đã sang chờ hủy): lúc đó so hạn dùng của lô mà ô đang gắn
  (`kho_can_giao_o_ma.han_dung`) với hôm nay giờ Việt Nam (`datLo.homNay` = `homNayVn()`); hạn đúng hôm nay
  thì chưa hết hạn. Lô hết hạn đó không ở nơi lấy thì chặn ở **mọi loại phiếu, kể cả báo hủy** (hủy theo món là
  hủy nhầm một lô còn hạn, hoặc hủy lần hai khay đã báo); câu nói sổ đang để lô đó ở đâu (`datLo.tonKhac` = tồn
  mọi nơi): "sổ ghi lô đó ở Kho lạnh… Báo hủy từ Kho lạnh", "đang ở Hàng chờ hủy… hỏi quản lý trước khi báo lại",
  hoặc "sổ không còn khay nào của lô đó… báo quản lý". Trang gộp kết quả quét vào form bằng `gopKetQuaQuet`: món vừa vào lô mà form còn một
  dòng theo món **chưa có số** của chính món đó (phiếu mở từ "Lấy thêm", "Lấy ra quầy", món nhanh) thì bỏ
  dòng trống ấy — để lại là "Ghi phiếu" bị chặn "chưa nhập số khay". Kiểm kê dán nhãn: mọi mã của cùng
  một món cộng vào một số đếm (theo món là đủ).
- **Màn Quét nhãn — nút cho khay cầm trên tay** (`lib/kho/quet-nhan.ts` `viecChoNhan`, hàm thuần): nhãn mã ô
  thì Ra quầy / Đưa bếp / Báo hủy mở đúng lô của tảng trên nhãn (NV quầy ưu tiên dòng ở quầy, người khác
  dòng trong kho); không có lô hợp thì lô hạn gần trước. Lô của nhãn **đã hết hạn** — theo dòng tồn, hoặc
  theo hạn dùng của lô mà ô đang gắn khi sổ không còn dòng nào ở kho / quầy — thì chỉ còn Báo hủy, không
  mời Ra quầy / Đưa bếp bằng một lô khác còn hạn. Câu lưu ý: phiên lóc chưa chốt · lô đã hết hạn · sổ
  không còn khay nào của tảng. Test chạy thật: `test-kho-tra-ma-can.mjs` nhóm 7.
- **Số tảng cạnh mã lô**: số tảng là thứ ghi trên túi và in trên tem; mã lô không có ở đâu ngoài đời. Lô là
  một tảng hoặc cắt ra từ một tảng thì hiện "tảng #0001" (`chuTang`) ở: phần chọn lô, "Lô chỉ định", "Lô
  đã lấy" của phiếu chuyển / xuất / hủy; kiểm kê theo lô và bảng chênh lệch; Tồn kho; Thẻ kho; màn Quét; trả
  hàng nhà cung cấp; cột Lô của phiếu nhập; phiên lóc. `docLoTang(client, loIds)` đọc `kho_v_lo_tang` theo
  **đúng các lô đang hiện** (150 lô một lượt, song song) — một lượt đọc mỗi trang, không mỗi lô một lượt; đọc
  hỏng thì trang vẫn hiện mã lô như cũ. (`docSoTangCuaLo` đọc cả chi nhánh, không chia trang — trang chủ
  quầy và màn Nhận hàng còn dùng; quá 1.000 lô thuộc tảng thì PostgREST cắt bớt.)
- **Đơn vị đếm trong câu**: câu nói về số gói của một phiếu / yêu cầu dùng đơn vị của món khi mọi món đếm
  cùng một đơn vị (`donViChung` — "10 khay"), khác nhau thì chữ chung "gói". Câu database trả về viết "N
  gói" **không sửa trong SQL**: `doiDonViCau` đổi ở web, cả bản tiếng Việt lẫn tiếng Anh (nhận hàng ra
  quầy, trả về kho / ghi mất, hủy chuyến, duyệt kiểm kê, −1). Danh sách đọc đơn vị cho cả trang bằng một
  lượt (`docDonViPhieuXuat`, `docDonViYeuCau`). Test: `test-kho-cau-don-vi.mjs`.
- **Cân theo tảng (GĐ3)**: `lib/kho/danh-muc-can.ts` (`hangChoCan`) — nguồn chung của màn Đồng bộ cân và
  Beeftown Cân: mỗi ô mã một dòng, cùng giá món, tên kèm số tảng đang giữ ô ("… #0142", cắt tên cho vừa
  24 ký tự, không cắt số tảng); ô trống vẫn ở trên cân nên PLU không đổi. Beeftown Cân có tuỳ chọn **Tự gửi
  xuống cân khi kho đổi** (mỗi phút khi cửa sổ mở, chỉ khi có thêm / sửa). Hạn dùng trên tem (cách b,
  29/09/2026): **số ngày còn lại của lô** = hạn − hôm nay giờ VN — ô mã giữ tảng theo lô lóc ra, món và ô trống
  theo lô sớm nhất còn tồn (`kho_v_ton`, `ton.ts` `docLoConTon`), chưa có lô theo `han_dung_ngay`, hạn đã qua và
  mã giảm giá không in. Cân tính HSD từ ngày in tem nên số này phải gửi lại mỗi ngày: Beeftown Cân tự gửi đếm
  ngược và báo đỏ khi HSD trên cân tính cho ngày cũ; màn Đồng bộ cân ghi "HSD tính cho ngày xuất file — nạp vào
  cân trong ngày". Chưa thử trên cân thật — chi tiết ở `can-app/README.md` (bản 2.2).
- **Repack (0050)**: quy trình Nhập → repack cả tảng (mở túi, bỏ nước rỉ) → cân → ủ → lóc. Dòng phiếu nhập
  có `so_kg_thuc` (kg sau repack); `so_kg` **giữ nghĩa kg nhà cung cấp** — `thanh_tien`, công nợ,
  `kho_v_phieu_nhap`, đơn đặt không đổi. Duyệt: lô và dòng sổ kho `nhap` theo `coalesce(so_kg_thuc, so_kg)`,
  giá trị lô vẫn là tiền hàng (+ chi phí, thuế) → giá vốn/kg tự chia lại (12 kg × 450.000 → 11,8 kg =
  457.627 đ/kg). Món theo tảng thiếu kg sau repack: lưu nháp được, **gửi / duyệt bị chặn**. Tối đa kg NCC
  + 1% (sai số cân). Form nhận hàng: ô "Kg sau repack" (món theo tảng hiện ngay, món khác trong "Thêm chi
  tiết"); màn điền giá hiện kg NCC → sau repack (hao %) và giá vốn/kg dự kiến (`xemTruocGiaVon` chia theo
  kg sau repack). Form phiếu nhập đầy đủ giữ ngày mổ và kg sau repack khi lưu lại. Hao ủ, phần bỏ khi lóc
  vẫn như 0022: giá trị tảng dồn hết vào thịt giữ lại. `kho_bao_cao_ncc` thêm `kg_repack_ncc`,
  `kg_repack_thuc`, `hao_repack_pt` (trang Đánh giá NCC có cột Hao repack).
- **Tảng gốc của lô cắt (0050)**: `kho_lo.tang_goc_id` gán lúc tạo lô ra (trigger `kho_lo_gan_tang_goc`,
  lô vẫn bất biến; file 0050 gán một lần cho lô đã có). View `kho_v_lo_tang` (lô → số tảng, không tiền).
- **Truy vết một tảng** (`/noi-bo/kho/tang/<lo_id>`, `kho_truy_vet_tang`, quyền xem, tiền chỉ vai xem giá):
  kg NCC → sau repack → vào lóc → thịt / phụ phẩm / bỏ / hao hụt; giá NCC → giá vốn sau repack → giá vốn
  thịt ra; các lô cắt ra (ô mã, đã bán, bếp, huỷ, còn ở đâu); phiếu huỷ của tảng. Mở bằng lô tảng hoặc
  bất kỳ lô cắt ra. Màn Tảng · ủ: số tảng là link, ô **Tìm tảng theo số** (`?tim=142` / `#0142`), mục
  **Đã lóc** (tảng nhận trong 90 ngày). Ô tìm chỉ tìm trong lô (có sau khi duyệt); số cấp lúc nhận hàng (0097) mà
  phiếu chưa duyệt thì câu `cauKhongThayTang` nói rõ số đó chỉ hiện ở đây sau khi phiếu nhận được duyệt (chỉ vai
  `nhap` được chỉ sang Nhận hàng, cả câu lẫn link — màn đó chuyển hướng vai khác như kế toán, nhân viên quầy) — không đọc dòng phiếu để tìm thêm, vì thủ kho / thợ lóc không đọc được dòng phiếu (có giá). Từ 0089, đã bán / bếp / huỷ của tảng và của từng lô cắt là **số ròng**:
  dòng sổ `dao_nguoc` (hoá đơn iPOS sửa / huỷ, phiên lóc mở lại) xét theo dòng nó đảo nên tự triệt; ngày bán cuối
  của lô là lần bán còn hiệu lực.
- **Huỷ cả tảng** (`kho_huy_ca_tang`, quyền van_hanh): mỗi vị trí còn hàng của tảng (kể cả tảng chưa lóc
  hết) một phiếu `XH` qua `kho_ghi_phieu_xuat`, lý do bắt buộc, ảnh như phiếu huỷ thường, chờ duyệt như
  cũ. `kho_huy_tang` giữ lần bấm (`ma_gui` — bấm lại không thêm phiếu), `kho_phieu_xuat.huy_tang_id`.
  Hàng đang chờ huỷ bỏ qua; hàng đang mang ra quầy báo lại số kg. Duyệt xong ô mã tự trống.
- **Báo cáo theo tảng** (`/noi-bo/kho/bao-cao/theo-tang` + CSV, `kho_bao_cao_tang`, quyền xem, cột tiền
  chỉ vai xem giá): mỗi tảng nhận trong kỳ — hao repack, thu hồi, bán / bếp / huỷ / còn, số ngày từ lóc
  tới bán hết, tình trạng chưa lóc / đang bán / đã hết. Từ 0089 bán / bếp / huỷ là số ròng (đã trừ dòng
  `dao_nguoc`): tảng đã lóc hết thì kg thịt + phụ phẩm khớp với bán + bếp + huỷ + còn, chênh đúng bằng dòng lệch
  cân / kiểm kê của các lô cắt; ngày hết là ngày của dòng sổ còn hiệu lực cuối cùng (`test-kho-tang-dao-nguoc.mjs`).
- **Xếp quầy**: `goiYXepQuay(ton, nn, soTang)` — câu dặn nói số tảng trên tem ("tảng #0142").
- **Bán qua iPOS theo ô mã (0051)**: iPOS gửi `item_id` riêng cho từng món, nên mỗi ô là một món FABi.
  Dòng bán biết ô khi: ghép món với ô (màn Ghép món, nhóm "Ô mã" — `kho_ipos_gan_o_ma`, mặc định bán theo
  kg); mã món iPOS trùng mã ô (chưa ghép — tự nhận); hoặc nhãn cân in bằng mã ô. Có ô → lấy lô gắn với ô
  **lúc bán** (`kho_ipos_lo_cua_o`) và trừ đúng lô đó ở quầy (`kho_ipos_lay_lo_cua_lo`); lô không đủ / ô chưa
  gắn lô → trừ theo hạn gần nhất như cũ, `kho_ipos_dong.lech_o` + câu lý do, màn Bán hàng iPOS hiện "Lệch ô".
  Ghép lại bằng `kho_ipos_gan_ma_v2` bỏ ô. `kho_v_ipos_dong` thêm `so_o`, `ma_can_o`, `so_tang`, `lech_o`.
- **Thu ngân / FABi** (chỉ web, `lib/kho/thu-ngan.ts`, không migration; `test-kho-ipos-fabi.mjs`): kho chỉ biết tảng
  khi dòng hóa đơn mang mã ô. (1) Ghép món → **Món cần có trên FABi** (`#mon-fabi`, `danh_muc`): mỗi ô mã của món đang
  dùng + mỗi mã giảm đang bật một món — tên gợi ý "<tên món> ô <số>" (mã giảm: tên như trên cân), mã món = mã vạch
  (đệm đủ số chữ `C` của mẫu) = mã ô / mã giảm, bán theo kg, giá/kg = giá kho (mã giảm: `giaGiam`). Đối chiếu
  `kho_ipos_menu` (chỉ có mã món — nhãn "có" nói mã vạch phải thử bằng một tem; ô ghép tay mã khác cũng tính);
  thực đơn rỗng → "Chưa đọc được thực đơn iPOS", không kết luận; kèm giờ đọc thực đơn; mã dài hơn số chữ `C` của mẫu
  → cảnh báo cân không in được tem; nội dung mục chọn bằng `mucMonFabi` (thuần). Tải
  `/noi-bo/kho/ban-ipos/mon-fabi.csv` (link thường, không `download` — 403 / 500 mở trang có câu lỗi) (`taoTepMonFabi`: `taoCsv`, không lách bằng "=", tên file ASCII giờ VN; vai khác
  403; đọc lỗi 500 kèm câu, không file rỗng). (2) Bán hàng iPOS → hộp **Bán không biết tảng · 7 ngày** (`xem_gia`,
  `docBanKhongBietTang`): dòng `da_ghi` của món có ô mà không ô, không mã giảm (`khong_qua_o` — không xét "lúc bán ô
  có giữ tảng không": ô không tự đóng khi tảng bán hết) và dòng `lech_o` — lọc ở database (hai lần đọc, `is null` /
  `lech_o = true`, `thoi_diem_ban >=` 00:00 giờ VN ngày đầu; dòng bán qua ô không về web); hôm nay / 7 ngày theo
  `ngay_ban`, đếm dòng và hóa đơn, mỗi loại kèm nguyên nhân có thể và chỗ sửa; nội dung hộp chọn bằng
  `hopKhongBietTang` (thuần): đọc lỗi → chỉ câu lỗi, không số. (3) Chặn ghép sai trước khi gọi database (`kiemGhep`,
  `laMaKhoTuNhan`, `oThucDon` trong `lib/kho/ban-ipos.ts`, đọc ô mã + mã giảm ngay trước khi ghép, đọc lỗi thì không
  ghép): mã trùng mã giảm (kể cả đã tắt) / mã ô không ghép được như món kho (mã ô chỉ với đúng ô đó) — trừ khi món của
  mã giảm / ô đã ngừng dùng: database không tự nhận mã đó (dòng chưa khớp), nên web coi là mã thường; ghép "Không phải
  hàng kho" / suất / hàng cân nhãn phải tích "Mã này là món khác trên FABi" (lối thoát khi FABi có món khác trùng mã);
  ghép món có ô mà không chọn ô phải tích "Vẫn ghép món chung". Thực đơn iPOS hiện "Mã giảm — kho tự nhận" /
  "Ô n — kho tự nhận" thay nút Ghép. **Mã giảm cận date giữ trừ theo hạn gần nhất** (không theo ô): lô cận date ở quầy
  gần như luôn là lô lóc sớm nhất, nên vẫn trúng tảng; mã giảm theo ô sẽ nhân số mã, số PLU và số món FABi phải sửa giá.

## 3p. Máy quầy — Beeftown Cân: bảng quầy · mã giảm giá cận date · tảng & ô · báo cáo (migration 0054)

Beeftown Cân (`can-app/`) thành phần mềm của quầy: đăng nhập bằng **mọi vai kho** (quyền `xem`), thẻ hiện
theo vai. Gửi xuống cân, sửa tem, tạo mã giảm: quản lý / chủ (`danh_muc`); báo cáo doanh thu: `xem_gia`.

- **Mã giảm giá (`kho_ma_giam`)**: FABi không đọc giá trên tem (mã vạch chỉ có mã hàng + trọng lượng), nên mỗi
  mức giảm của một món là **một mã cân riêng**. `kho_luu_ma_giam(món, %, mã?)` (danh_muc; mã trống → mã
  trống nhỏ nhất từ 90001), `kho_bat_ma_giam`. Giá = `kho_gia_giam` / `giaGiam` (`lib/kho/ma-giam.ts`) — làm
  tròn 1.000 đ, hai bản phải giống nhau. Mã không trùng mã món / ô mã (trigger ba phía). `hangChoCan` thêm
  mỗi mã đang bật một dòng "<tên> -30%" giá đã giảm; tắt → bỏ khỏi cân. Trên FABi tạo món **mã = mã cân,
  giá = giá đã giảm**. Bán: `kho_ipos_ghi_dong` nhận mã giảm như ô mã (mã món iPOS chưa ghép trùng mã giảm,
  hoặc nhãn in bằng mã giảm) → trừ đúng món theo hạn gần nhất, ghi `kho_ipos_dong.ma_giam_id`; mã đã tắt vẫn
  nhận (tem cũ). `kho_mat_hang_theo_ma_can` nhận cả mã giảm (quét đếm quầy / kiểm kê).
  `kho_v_ipos_dong` thêm `ma_giam_id`, `giam_pt`, `ma_can_giam`.
- **Bảng quầy** `kho_bang_quay(cn)` (quyền xem, một lần gọi, không giá vốn): lô ở quầy (hạn, số tảng), món,
  gợi ý mang ra (`kho_goi_y_ra_quay`), mã giảm đang bật, yêu cầu chưa xong, hàng đang mang ra, phiếu huỷ chờ
  duyệt, lý do huỷ. Máy gộp ở `can-app/src/quay.ts`: hết hạn → phiếu huỷ (ảnh tải lên `kho-chung-tu`, rồi
  `kho_tao_phieu_xuat`); cận date → xếp trước + "cân lại bằng PLU n · mã 90001"; dưới mức → `kho_tao_yeu_cau`.
- **Tảng & ô** `kho_can_o_ma(cn)` (quyền xem — NV quầy không đọc được phiên lóc nên hàm SECURITY DEFINER):
  mỗi ô — tảng đang giữ, lóc ra / bán / huỷ / còn, số lần bán đúng ô và lệch ô. Máy so tên trên cân với tên
  kho muốn → báo "cân chưa đổi tên theo tảng". Từ 0089 bán / huỷ / khác là số ròng (đã trừ dòng `dao_nguoc` của
  hoá đơn iPOS sửa / huỷ).
- **Báo cáo bán theo giờ** `kho_bao_cao_ban_gio(cn, từ, đến)` (xem_gia): ngày × giờ × món từ dòng iPOS đã trừ
  kho; phần bán giảm giá (kg, doanh thu, tiền đã giảm ước theo giá hiện tại) và **giảm sớm** — lô đã trừ còn hạn
  xa hơn mức cảnh báo (bắt giảm giá gói còn tươi; từ 0089 chỉ xét lô của dòng sổ bán còn hiệu lực); lệch ô. Máy
  thêm bảng theo tảng (`kho_bao_cao_tang`).

## 3q. Beeftown Cân báo về kho · Cân sẵn sàng · đối chiếu tem in / quét (migration 0061, Beeftown Cân 2.9)

- **Danh mục cân cho mọi vai xem**: `kho_can_giao_o_ma(cn)` (SECURITY DEFINER, quyền xem) trả đúng các dòng của
  `kho_v_o_ma_giao` — NV quầy đọc view thì rỗng (không đọc được phiên lóc), tên ô mất số tảng. `hangChoCan` đọc qua
  hàm này (`docGiaoOMaCan`). Beeftown Cân 2.9: TỰ GỬI mở cho mọi vai xem; gửi tay, xem trước, gỡ hàng vẫn `danh_muc`.
  Máy hỏi kho các ô đang giao mỗi 15 giây — vừa "Giao ô mã" là tự gửi ngay.
- **Máy quầy báo trạng thái** `kho_may_can_bao(cn, mã máy, báo)` (quyền xem; mỗi phút): bảng `kho_may_can`, một dòng
  mỗi máy (`ma_may` = mã cài đặt Beeftown Cân). Lần báo (đồng hồ database), cân trả lời lần cuối, giữ kết nối, tự gửi,
  số hàng lệch kho (`lech_tu` do database ghi lần đầu thấy lệch), tự gửi hỏng, và `tren_can` — chỉ giữ dòng **mã ô**
  (số PLU, tên, phím tắt). Không câu lỗi (chữ tự do, một thứ tiếng — máy quầy tự hiện). Máy gửi "cân trả lời / gửi được
  cách đây bao nhiêu giây" (`can_tra_loi_giay`, `gui_giay`), database lấy now() trừ đi — đồng hồ máy quầy sai không làm đèn
  sai; mốc không lùi. Tự gửi tắt thì máy vẫn so kho với cân mỗi 5 phút để báo số hàng lệch. Không ai đọc / ghi thẳng bảng.
  **0090 (Beeftown Cân 2.9.3):** `tren_can` là thứ cân ĐÃ XÁC NHẬN (đọc lại khớp — trước 2.9.3 cả lần gửi chưa đọc lại được
  cân); máy báo thêm `chua_xac_nhan` (lần gửi gần nhất chưa đọc lại được / đọc lại lệch, hay xoá qua WiFi hỏng), database
  ghi `chua_xac_nhan_tu` lần đầu thấy cờ bật (như `lech_tu`); mỗi dòng `tren_can` cũng có cờ riêng — cân có thể đang khác
  dòng đó (lần gửi chờ xác nhận khác dòng đã xác nhận; đọc lại lệch / xoá hỏng thì mọi dòng). Máy trước 2.9.3 không gửi cờ → false.
- **Tem cân đã in** `kho_may_can_nhat_ky(cn, mã máy, dòng)` (quyền xem): bảng `kho_can_tem` — chỉ dòng bán (loại 0) mang
  mã ô; khoá (chi nhánh, MAC cân, FID, dòng, giờ in) nên gửi lại không trùng. Giờ in là đồng hồ cân, giờ VN
  (`kho_luc_can_vn`; ngày không có thật → bỏ). Tối đa 2000 dòng một lần; quá 90 ngày tự dọn (chỉ mục theo giờ in).
  Đối chiếu tính tem từ lúc giao ô tới lúc chốt hay lúc ô được trả, cái nào sớm hơn. Máy quầy không gửi dòng có giờ cân ở
  tương lai (mốc không nhảy tới đó).
- **Trang pha lóc** `kho_phien_pha_can(phiên)` (pha_loc hoặc xem_gia): mỗi ô của phiên — đang giữ không, trên cân ở máy
  quầy nào (PLU, tên, phím), số nhãn đã quét bằng mã ô, số tem cân in bằng mã ô từ lúc giao tới lúc chốt; nhãn **mã
  thường** (mã món, mã giảm) của phần cắt có ô trong phiên theo tảng; các máy báo trong 14 ngày. `tomTatCanPhien`
  (`lib/kho/danh-muc-can.ts`) soạn câu: "Cân sẵn sàng: <tên + số tảng> = PLU · phím" CHỈ khi cân có đúng tên mới
  (`tenTheoTang`, như danh mục gửi); 0090: dòng đúng tên mang cờ `chua_xac_nhan` → "chưa chắc cân đã có … — chưa in tem"
  (khung lưu ý; dòng khác đúng tên không cờ thì vẫn sẵn sàng theo nó); "còn tên cũ" / "chưa lên cân" (chưa in tem); chưa máy nào báo → "không biết". Bước
  Kết quả và màn Xem: "Cân in N tem mã …, phiên quét M". Nhãn mã thường vẫn cộng vào phiên như trước (`test-kho-o-ma`),
  chỉ cảnh báo — bán ra thì kho không biết thuộc tảng nào.
- **Đèn "Beeftown Cân"** (`/noi-bo`, ô `can` của `suc_khoe_so_lieu`): **Chưa bật** khi chưa máy nào báo trong 14 ngày; **Xử lý ngay** khi
  trong giờ mở cửa (giờ ở Kết nối iPOS, mặc định 10–23) KHÔNG máy nào của chi nhánh báo quá 30 phút — tính từ lúc mở cửa
  hôm nay; **Xem hôm nay** (chỉ trong giờ mở cửa) khi một máy khác im (im quá 48 giờ mà máy khác vẫn báo → coi như đã thôi dùng), cân
  không trả lời quá 10 phút (giữ kết nối bật), kho đổi mà cân chưa nhận quá 15 phút (tính từ lúc mở cửa), 0090: lần gửi
  gần nhất cân chưa xác nhận quá 15 phút (kể cả khi không lệch kho), lần tự gửi gần nhất hỏng. Nhóm `he_thong` của báo động.
- Kho chưa chạy 0061 mà Beeftown Cân 2.9 đã cập nhật: `docGiaoOMaCan` đọc view như 2.8 (quản lý vẫn gửi đủ tên ô).
- So "cân đã có tên này chưa" bằng `chuanTenCan` (`can-tma.ts`: NFC, bỏ tab, cắt như lúc gửi) ở cả hai phía; `tenTheoTang`
  chuẩn NFC trước khi cắt 24 ký tự.

## 3r. Còn hàng cho Mini App Zalo (migration 0093)

Mini App Zalo (`mini-app/`) hiện "Tạm hết" theo số khay ở quầy (`sap_het` hiện như còn hàng: không viết câu khan hiếm). Kho không mở bảng nào cho khách: Mini App hỏi
`/mini-app/con-hang.json` (`src/pages/mini-app/con-hang.json.ts`, `src/lib/mini-app.ts`), website gọi `mini_app_con_hang(chi nhánh)`
bằng vai anon, hàm chỉ trả `het` / `sap_het` / `con` của từng phần thịt — không số khay, như đặt bàn không trả số bàn.

- **Gắn mặt hàng:** màn mặt hàng → ô thông tin thêm **"Phần thịt trên Mini App Zalo"** (0093 tạo sẵn, kiểu chọn, 6 mã của
  `mini-app/src/san-pham.ts`). Chọn trên mặt hàng phần cắt đếm theo khay; nhiều mặt hàng cùng một phần thịt thì cộng khay.
  Thêm phần thịt mới trên Mini App: sửa lựa chọn của ô ở màn cài đặt ô thông tin thêm.
- **Đếm gì:** `kho_ton.so_goi` ở vị trí loại `quay` của chi nhánh (`PUBLIC_CHI_NHANH`), chỉ lô còn hạn theo giờ VN. Hàng trong kho,
  đang chuyển ra quầy, chờ hủy không tính. 0 khay → `het`, 1–2 → `sap_het`, từ 3 → `con`.
- **Công tắc:** `mini_app_hien_con_hang` ở màn Nội dung (chỉ chủ), **mặc định tắt**. Tắt, ô bị tắt, chi nhánh ngừng hoạt động →
  hàm trả rỗng và Mini App hiện mọi phần như trước khi nối kho. Chỉ bật khi quầy quét khay ra vào kho đúng lúc.
- Website lưu đệm 60 giây; hỏng bất kỳ cách nào (chưa có database, chưa chạy 0093, lỗi, hết giờ) đều trả `{}` — không bao giờ tự
  ra "hết". Kiểm thử: `crm/test/test-mini-app-con-hang.mjs` (database), `test-mini-app-con-hang-web.mjs` (thư viện, đường JSON).
- **Trang Mua thịt về của website** (migration 0101) có công tắc riêng cùng điều kiện: `mua_thit_hien_tam_het` ở màn Nội dung
  (chỉ chủ), **mặc định tắt**. Bật thì gói hết ở quầy (`con_hang = 'het'` của menu bán lẻ, lô còn hạn theo giờ VN) ghi "Tạm hết ở
  quầy" và khách không chọn được gói đó — chỉ khi số tồn ở quầy tin được (chi nhánh trừ kho theo iPOS). Chỉ bật khi chi nhánh đã
  trừ kho theo iPOS và quầy ghi hàng ra vào đúng lúc: kho ghi thiếu thì khách thấy "tạm hết" khi quầy còn hàng. Tắt hay hỏng bất kỳ
  cách nào thì không gói nào bị ghi tạm hết. Kiểm thử: `crm/test/test-mua-thit-ve.mjs`.

## 4. Cài như app (PWA)

`public/kho/manifest.json`: mở `/noi-bo/kho?nguon=app`, trong phạm vi `/noi-bo/`, chạy như app riêng
(không thanh địa chỉ). Có lối tắt Quét / Việc / Tồn kho khi nhấn giữ biểu tượng trên Android.
`theme_color` là đen `#000000` (màu thanh trên, cùng thẻ `theme-color` của `layouts/Kho.astro`),
`background_color` là xám nhạt `#F4F4F4` (nền trang kho; hiện ở màn chờ lúc mở app) —
`test-noi-bo-bang-mau.mjs` nhóm 6 gác.

- **Android (Chrome)**: menu ⋮ → "Cài đặt ứng dụng" / "Thêm vào màn hình chính".
- **iPhone/iPad (Safari)**: nút Chia sẻ → "Thêm vào MH chính".

Biểu tượng `public/kho/bieu-tuong-{180,192,512,maskable-512}.png` dựng từ brandmark bộ 21/10/2026
(`public/thuong-hieu/dau-bo-do.svg` và riêng đầu bò `public/thuong-hieu/net-dau-bo.svg` — path gốc của PDF
guideline, tách bằng `cong-cu/thuong-hieu/tach-logo.mjs`) bằng Chromium:

```bash
python3 -I web/cong-cu/thuong-hieu/tao-bieu-tuong.py web/public   # đọc SVG đã tách, không cần PDF
```

- **192, 512**: y hệt `public/bieu-tuong.svg` — brandmark đỏ (ô đỏ bo góc, đầu bò trắng), góc trong suốt.
- **180** (iPhone): đầu bò trắng cao 66 % cạnh trên nền đỏ phủ kín, không điểm trong suốt. iPhone tự bo góc và
  tô đen chỗ trong suốt.
  Cùng file đó ghi luôn vào `public/thuong-hieu/bieu-tuong-180.png` cho trang công khai.
- **maskable-512**: nền đỏ phủ kín, đầu bò trắng. Cả khung bao của đầu bò nằm trong hình tròn 78% cạnh, tức trong
  vùng an toàn 80%, để Android cắt tròn không mất sừng.

Test (`test-kho-giao-dien.mjs`, nhóm 7) đọc cỡ ảnh và từng điểm ảnh: phủ kín và vùng an toàn.
`.gitignore` chặn mọi `*.png` và chỉ mở đúng `/web/public/kho/*.png` và `/web/public/thuong-hieu/*.png`.

Bản 192 còn là biểu tượng `BeeftownCan.exe` (`can-app/scripts/dong-goi.ts` bọc vào `.ico`). Bun chỉ gắn
biểu tượng khi đóng gói **trên Windows**. Bản `dong-goi-can.yml` đóng gói trên Ubuntu nên không có biểu tượng.

**Chưa có service worker** — mất mạng thì app báo lỗi như trang web thường. Chế độ ngoại tuyến
cần hàng đợi phiếu phía máy và xử lý trùng; chưa làm.

## 5. JavaScript: chỉ để tăng cường

Mọi trang kho **chạy đủ khi tắt JavaScript**: form POST, lưu xong chuyển hướng 303 (F5 không
gửi lại), `ma_gui` chống bấm hai lần, `phien_ban` chống hai máy đè nhau. JavaScript chỉ được
dùng ở:

| Chỗ | Để làm gì |
|---|---|
| `components/kho/QuetMa.astro` (script trong file) | Camera đọc mã (`BarcodeDetector` trên Chrome Android; không có thì nạp `ean13.js`), đếm gói trùng mã, bấm "Xong" tự gửi form |
| `public/kho/js/ean13.js` | (GĐ5b) Giải mã EAN-13 bằng JS thuần cho iPhone — Safari không có `BarcodeDetector` |
| `public/kho/js/may-chung.js` | (GĐ5d) Đếm giờ tự khóa máy dùng chung |
| `public/kho/js/in-an.js` | Hiện nút "In phiếu" và gọi `window.print()` (GĐ4b); nút "Chia sẻ" `[data-chia-se]` của đơn đặt hàng gọi Web Share API khi máy có (GĐ8a) |

Không thêm thư viện npm cho phía trình duyệt. `test-kho-giao-dien.mjs` hỏng nếu có `<script>`,
`onclick=…` hay file JS ngoài danh sách này.

**Chưa làm:** thu nhỏ ảnh hóa đơn trước khi tải (≤ 1600px). Bảng này từng ghi file `anh-nho.js` (GĐ5a)
nhưng file chưa bao giờ được viết — ảnh chụp bằng điện thoại vẫn lên nguyên cỡ (tối đa 10 MB mỗi ảnh).

## 6. Vai máy (dành chỗ sẵn, migration 0029)

`may_chung` (tablet dùng chung ở quầy/bếp, đổi người bằng PIN — GĐ5d) và `may_ipos` (tài khoản
đồng bộ bán hàng iPOS — GĐ7a). Hai giá trị enum được thêm ở **file riêng chạy một mình** vì
Postgres không cho dùng giá trị enum mới trong cùng giao dịch vừa thêm nó. Hai vai này
**không đọc được dữ liệu kho/CRM** (test-kho-quyen kiểm); từ 0034 vai `may_chung` gọi được các hàm
`kho_may_*` của máy (mục 3f); từ 0037 vai `may_ipos` chỉ có việc `dong_bo_ban` — gọi được
`kho_ipos_bat_dau / _nhan / _ket_thuc`, `kho_ipos_nhan_callback`, `kho_ipos_tim_chi_nhanh`, `kho_ipos_luu_menu`,
`kho_ipos_bao_menu_doi` và `kho_cn_duoc`, không đọc được bảng nào (mục 3j).

## 7. Thêm một trang kho mới — danh sách kiểm

1. Đầu trang: `const k = await moTrangKho(Astro); if (k instanceof Response) return k;`
   rồi một dòng chặn quyền `if (!k.duoc('…')) return Astro.redirect('/noi-bo/kho', 302);`.
2. Bọc trong `<Kho k={k} tieuDe="…" huongDan="…">`, có `<h1>` và `<BaoKho>`. Chưa có mục hướng dẫn
   hợp thì thêm vào `lib/kho/huong-dan.ts` (mục 3i).
3. Form: POST + ô ẩn `viec`; đọc thân bằng `docFormGui(Astro)`; thành công → `chuyenHuong(Astro, url, kq)`.
   Form tạo chứng từ có `ma_gui`; form sửa có `phien_ban`. Không đọc được thân (mạng đứt giữa chừng):
   `docFormGui` trả null và đánh dấu lượt xem, `<BaoKho>` tự hiện câu "Không đọc được dữ liệu gửi lên…"
   (`CAU_DOC_FORM_HONG`, `lib/gui-noi-bo.ts`) — trang không tự đặt câu đó (`crm/test/test-kho-doc-form.mjs`).
4. Chữ cho nhân viên: tiếng Việt đơn giản, không thuật ngữ ("hạn gần bán trước", không "FEFO").
   Nút ≥ 48px, ô nhập cỡ chữ 16px (iPhone không tự phóng to).
5. Nếu có ô menu: thêm vào `MUC_KHO` với đúng quyền của dòng chặn; nếu có số đỏ thì ghi `dem`.
6. File `lib/kho/*.ts` mới gọi database → thêm vào `CHAY_DA_DANG_NHAP` trong
   `crm/test/test-hop-dong-web.mjs`. Gọi RPC bằng object viết thẳng `.rpc('x', { p_… })`,
   `.select('…')` nháy đơn và không ép kiểu `::`.
7. Bẫy của Astro (`compressHTML: 'jsx'`, mặc định của Astro 7): khoảng trắng có xuống dòng giữa hai nút
   bị bỏ hẳn — `{t.cau1}⏎{t.cau2}` hiện "Câu một.Câu hai.", `chữ⏎{t.x}` cũng dính. Viết hai mẩu trên cùng
   dòng, cách một dấu cách, hoặc thêm `{' '}`. `crm/test/dinh-chu.mjs` bắt chỗ này (test-kho-tieng-anh
   nhóm 4). `{soLuong && <x/>}` in ra số 0 — viết `soLuong > 0 && …`.
8. Hai thứ tiếng: chữ của trang viết `{ vi, en }` qua `dichNB(k.nn, …)`; câu báo trả `kqHai(ok, { vi, en })`;
   số truyền `nn` (`dinhDangKg(x, nn)`…); câu từ database hiện qua `dichCau(nn, …)`. Cách làm và các bảng
   dùng chung: `web/README.md`, mục "Tiếng Anh ở giao diện nội bộ". File mới tự vào bộ quét của
   `crm/test/test-kho-tieng-anh.mjs` — chữ Việt sót ngoài `{ vi, en }` là test đỏ.

## 8. Kiểm thử

```bash
cd crm && npm test                    # toàn bộ; phần kho chạy qua test/chay-kho.mjs
node test/chay-kho.mjs                # chỉ kho: tự tìm mọi test-kho-*.mjs
node test/test-kho-giao-dien.mjs      # menu, link, hướng dẫn, manifest, JavaScript (không cần database)
node test/test-noi-bo-bang-mau.mjs    # bảng màu của /noi-bo và kho: mã, biến, mã cũ còn sót, chỉ mã của bảng, trạng thái không chỉ khác màu, tương phản
node test/test-kho-viec.mjs           # số đỏ, thông báo, ngưỡng, chỉ số quản trị
node test/test-kho-ipos.mjs           # đồng bộ iPOS: phần database
node test/test-kho-ipos-callback.mjs  # iPOS đẩy hóa đơn (0042): bán theo kg / gói / suất, bắn trùng, mất kết nối — database
node test/test-kho-ipos-web.mjs       # đồng bộ iPOS: phanTichCallback, hook /hook/ipos, dongBoIpos, cron, quét token (build web để kiểm dist)
node test/test-kho-dinh-luong.mjs     # định lượng món, đối chiếu định mức: phần database
node test/test-kho-dinh-luong-web.mjs # định lượng: dán Excel, lưới gram, màu lệch, cột tiền, trang
node test/test-kho-dat-hang.mjs       # đặt hàng NCC, gợi ý, nhận theo đơn, đánh giá NCC: phần database
node test/test-kho-dat-hang-web.mjs   # đặt hàng: form (thủ kho không gửi giá), dat-hang.ts trên PGlite, trang
node test/test-kho-cong-no-v2.mjs     # công nợ v2: bù trừ, hoàn tiền, hóa đơn gộp, trả hàng 2 bước, sổ kỳ, MISA — database
node test/test-kho-cong-no-v2-web.mjs # công nợ v2: misa.ts, form Trả tiền, hóa đơn gộp web = database, trang
node test/test-kho-sua-nhanh.mjs      # sửa hàng loạt, báo cáo tháng, mua hàng, sổ thanh toán — database (0041)
node test/test-kho-sua-nhanh-web.mjs  # sửa nhanh, lưới công thức, vị trí + lý do, trung tâm báo cáo — web
node test/test-kho-tieng-anh.mjs      # tiếng Anh: chữ Việt ngoài { vi, en }, trang quên truyền nn, câu database, chữ dính khi xuống dòng
node test/test-kho-so-tang-luc-nhap.mjs # số tảng cấp lúc lưu dòng nhận hàng (0097): giữ số, số bỏ, duyệt dùng số của dòng, quyền, web
cd ../web && npm run kiem-tra && npm run quet && npm run build
```

Test database chạy trên PGlite (Postgres trong Node), **không bao giờ** chạm Supabase thật.
Thêm file `test-kho-<tên>.mjs` là `chay-kho.mjs` tự chạy — không sửa `package.json`.
