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
| Kế toán | Trang chủ · Duyệt · Công nợ · Nhập hàng · Khác (Báo cáo nằm trong Khác) |

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
(`lib/kho/thong-bao.ts`). Form sửa: thẻ "Ngưỡng cảnh báo" (`#nguong`) trên màn Thiết lập (mục 3g).

## 3. Các trang trung tâm

| Trang | Việc |
|---|---|
| `/noi-bo/kho` | Trang chủ **theo vai**: NV quầy "Quầy hôm nay" (hết hạn phải bỏ, **xếp ra bán trước**, quầy sắp hết); thủ kho "Việc hôm nay"; quản lý/chủ "Hôm nay" có thẻ `?tab=quan-tri` (chỉ số từ `kho_chi_so_quan_tri`); kế toán: công nợ |
| `/noi-bo/kho/viec` | Việc cần làm: "Làm ngay" (đỏ) và "Nên làm sớm" (vàng), mỗi việc một nút |
| `/noi-bo/kho/thong-bao` | Chuông: mọi sự kiện 30 ngày, chia thẻ Vận hành / Nhắc nhở / Hệ thống |
| `/noi-bo/kho/duyet` | Hộp duyệt chung (quyền `duyet` hoặc `duyet_nhap`): phiếu nhập (điền giá rồi duyệt), báo hủy, kiểm kê — cũ nhất lên trước. Kế toán (`duyet_nhap`) chỉ thấy phiếu nhập. Duyệt xong quay về đây |
| `/noi-bo/kho/nhan-hang` | Nhận hàng 3 bước của thủ kho (quyền `nhap`, **chỉ kg**, migration 0031): `moi` chụp hóa đơn + chọn người giao → `<id>` cân từng món → `<id>?buoc=gui` xem lại, gửi. Người có `nhap` mà không `xem_gia` mở `/noi-bo/kho/nhap/*` bị chuyển sang đây |
| `/noi-bo/kho/nhap/<id>` | Vai xem giá. Người có `duyet_nhap` mở phiếu chờ duyệt → màn **điền giá**: ảnh hóa đơn lớn, ô đơn giá từng dòng, chip so với lần nhập trước (`kho_so_sanh_gia_nhap`, đỏ khi vượt `nguong_gia_mua_pt`), [Lưu giá] [Duyệt]. `?soan=1`: quản lý sửa cả dòng hàng |
| `/noi-bo/kho/quet` | Quét một nhãn → món gì, còn bao nhiêu ở đâu, lô nào hạn gần, nút làm tiếp (theo vai, xem 3d) |
| `/noi-bo/kho/quy-trinh` | Các bước của từng nghiệp vụ (`lib/kho/quy-trinh.ts`), bước đang có việc hiện số đỏ |
| `/noi-bo/kho/khac` | Mọi ô menu cho màn nhỏ, các màn CRM, đăng xuất |
| `/noi-bo/kho/huong-dan` | Hướng dẫn trong app (nút "?" trỏ tới các mục ở đây) |

"Xếp ra bán trước" (`goiYXepQuay` trong `lib/kho/trang-chu.ts`): Beeftown **không giảm giá**
hàng sắp hết hạn. Thay vào đó, mỗi món ở quầy chỉ ra lô còn hạn gần nhất để xếp lên trước.

Link dùng chung giữa các trang (trang nhận phải đọc được các tham số này):

- `/noi-bo/kho/xuat/moi?loai=chuyen|xuat_bep|huy|xuat_khac&tu=<vị trí>&lo=<lô>&mh=<mặt hàng>` — mở sẵn phiếu
- `/noi-bo/kho/ton?han=het_han|sap_het` (hai lọc **riêng**, không gộp) `&duoi_muc=1&vi_tri=quay&q=…`
- `/noi-bo/kho/nhap?loc=nhap|cho_duyet|tu_choi` (vai xem giá), `/noi-bo/kho/nhan-hang?loc=nhap|cho_duyet|tu_choi|da_duyet`
  (thủ kho), `/noi-bo/kho/nhan-hang/moi?loai=ton_dau`, `/noi-bo/kho/pha-loc?loc=nhap`,
  `/noi-bo/kho/pha-loc/<id>?buoc=ket-qua|xong&ma=<mã>`, `/noi-bo/kho/the-kho/<mặt hàng>?vi_tri=&tu=&den=`
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
| `/noi-bo/kho/quet` | Mọi vai `xem` | Thêm: nút theo từng lô (`viecVoiLo`), Ra quầy mở sẵn lô kho hạn gần nhất, Báo hủy mở sẵn lô hết hạn, Thẻ kho, Đếm quầy (NV quầy), "Thêm vào phiên pha <số>" (vai `pha_loc`, có phiên nháp, món không phải tảng) — POST một lượt `kho_quet_phien_pha` với `ma_gui` riêng rồi mở phiên |
| `/noi-bo/kho/cai-dat/mat-hang` | `danh_muc` | Ô "Sau pha để ở: Kho lạnh / Quầy" (`kho_mat_hang.noi_de_sau_pha`, trống = kho lạnh). Dán Excel có cột "Sau pha để ở" (cột thứ 9 khi không có tiêu đề) |

- `kho_the_kho` **không có tiền**. Không chọn nơi = cả chi nhánh, kể cả hàng đang mang ra quầy và
  chờ hủy → tồn cuối kỳ = tổng tồn của món ở Tồn kho; chuyển kho → quầy hiện hai dòng (đi, đến).
- Nút "Thẻ kho" có ở từng món trang Tồn kho và ở màn Quét. Ô menu "Tồn kho" sáng khi đang ở thẻ kho
  (`khop` trong `dieu-huong.ts`).
- Hàm thuần (`docBoLocTheKho`, `linkTheKho`, `khoangNhanh`, `linkChungTu`, `tongKy`) ở `lib/kho/the-kho.ts`,
  test trong `test-kho-ma-vach.mjs` nhóm 15 và `test-kho-giao-dien.mjs` nhóm 14.

## 3e. Pha lóc 3 bước bằng quét nhãn · báo thu hồi thấp (GĐ5c, migration 0033)

| Trang | Ai | Việc |
|---|---|---|
| `/noi-bo/kho/pha-loc/moi` | `pha_loc` | Bước 1: mỗi loại tảng đang có (trừ chờ hủy, đang mang ra quầy) là một nút lớn kèm kg, số tảng, số lô. Bấm = tạo phiên nháp ngay (`ma_gui` riêng mỗi nút); tảng chỉ một lô thì điền sẵn lô đó, loại tảng có đúng một công thức thì gắn luôn. Phiên nháp đang dở hiện lên trước |
| `/noi-bo/kho/pha-loc/<id>` | `pha_loc` (nháp) | Bước 2 "Cân & quét": ô quét trên cùng (`QuetMa tuFocus`), mỗi lần gửi là một lượt `kho_quet_phien_pha` (như đếm quầy: cùng `ma_gui` không cộng đôi, lỗi mạng giữ mã trong ô). Danh sách món đã quét (gói, kg, để ở đâu) có −1, "Bỏ lượt vừa quét", "Bỏ hẳn một món" (`kho_bo_quet_phien_pha`). Phụ phẩm, mỡ bỏ gõ kg (điền sẵn theo công thức); lô tảng, ngày, ghi chú, công thức nằm trong mục "Thêm". `?ma=<mã>` điền sẵn ô quét |
| `/noi-bo/kho/pha-loc/<id>?buoc=ket-qua` | `pha_loc` | Bước 3: 4 số lớn — thu hồi, dự kiến (theo công thức / trung bình 30 ngày), trung bình 30 ngày, hao hụt. **Nút Chốt chỉ ở đây.** Thấp quá ngưỡng thì báo trước khi chốt (chốt vẫn được). Bảng giá vốn chỉ với `xem_gia` |
| `/noi-bo/kho/pha-loc/<id>?buoc=xong` | `pha_loc` | Sau chốt: "Chuyển N gói ra quầy ngay" — mỗi lô mới còn ở kho lạnh một nút `/noi-bo/kho/xuat/moi?loai=chuyen&tu=…&lo=…` |

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
- Thủ kho chỉ thấy kg, gói, %: bước 2, 3 và màn xem đọc `kho_xem_thu_phien_pha_kg`; hàm có tiền
  `kho_xem_thu_phien_pha` chỉ gọi khi `xem_gia`. Hàm thuần của 3 bước ở `lib/kho/pha-loc.ts`, test ở
  `test-kho-pha-web.mjs`; database ở `test-kho-pha-loc-quet.mjs`.

## 3f. Máy tính bảng dùng chung · Chủ tự tạo tài khoản (GĐ5d, migration 0034)

Tablet ở quầy/bếp dùng chung 1–2 máy: đổi người bằng **PIN**, **tự khóa sau 5 phút** không dùng.
Việc ai làm vẫn ghi đúng người đó, vì mọi thao tác chạy bằng **phiên của chính người đó** — PIN chỉ
là cách lấy lại phiên đã cất, không phải một lối đăng nhập mới.

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
- Bật **Allow new users to sign up** — để máy chủ tạo được tài khoản bằng khóa anon. An toàn: người lạ tự
  đăng ký được tài khoản Supabase thì vẫn không thấy gì, vì không có dòng `nhan_su` (`layPhien` trả null).
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
| `components/kho/QuetMa.astro` (script trong file) | Camera đọc mã (`BarcodeDetector` trên Chrome Android; không có thì nạp `ean13.js`), đếm gói trùng mã, bấm "Xong" tự gửi form |
| `public/kho/js/ean13.js` | (GĐ5b) Giải mã EAN-13 bằng JS thuần cho iPhone — Safari không có `BarcodeDetector` |
| `public/kho/js/anh-nho.js` | (GĐ5a) Thu ảnh hóa đơn ≤ 1600px trước khi tải |
| `public/kho/js/may-chung.js` | (GĐ5d) Đếm giờ tự khóa máy dùng chung |
| `public/kho/js/in-an.js` | Hiện nút "In phiếu" và gọi `window.print()` (GĐ4b); sau này in đơn đặt hàng (GĐ8a) |

Không thêm thư viện npm cho phía trình duyệt. `test-kho-giao-dien.mjs` hỏng nếu có `<script>`,
`onclick=…` hay file JS ngoài danh sách này.

## 6. Vai máy (dành chỗ sẵn, migration 0029)

`may_chung` (tablet dùng chung ở quầy/bếp, đổi người bằng PIN — GĐ5d) và `may_ipos` (tài khoản
đồng bộ bán hàng iPOS — GĐ7a). Hai giá trị enum được thêm ở **file riêng chạy một mình** vì
Postgres không cho dùng giá trị enum mới trong cùng giao dịch vừa thêm nó. Hai vai này
**không đọc được dữ liệu kho/CRM** (test-kho-quyen kiểm); từ 0034 vai `may_chung` gọi được các hàm
`kho_may_*` của máy (mục 3f). `may_ipos` vẫn chưa làm được gì.

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
