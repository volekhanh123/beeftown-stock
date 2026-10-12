# Beeftown Cân — máy quầy: cân in tem, quầy, giảm giá cận date, tảng & ô, báo cáo

Chương trình Windows (`BeeftownCan.exe`) cho máy tính ở quầy, thay phần mềm của hãng cân. Đăng nhập bằng
**tài khoản kho của mình** (NV quầy, thủ kho, kế toán, quản lý, chủ) — thẻ hiện theo vai.

Máy quầy (từ 2.0.0, cần migration 0054):

- **Quầy** (mọi vai) — việc cần làm ngay: gói **hết hạn** → chọn lô, chụp ảnh, **tạo phiếu huỷ** (chờ quản lý
  duyệt); gói **cận date** → "xếp ra trước" và "cân lại bằng PLU n · mã 90001 · −30%"; món **dưới mức** →
  sửa số, **gửi yêu cầu lấy hàng** cho thủ kho. Tồn quầy từng món, yêu cầu đang chờ, hàng đang mang ra. Tự
  tải lại mỗi phút.
- **Tảng & ô mã** (mọi vai) — mỗi ô đang giữ tảng nào, lóc ra / đã bán / huỷ / còn, % bán, số lần lệch ô;
  báo **cân chưa đổi tên theo tảng** (so tên trên cân với tên kho muốn).
- **Giảm giá cận date** — FABi không đọc giá trên tem, nên mỗi mức giảm là **một mã cân riêng**. Quản lý / chủ
  tạo mã (món + mức, mã tự lấy từ 90001), bật / tắt; tải danh sách để tạo món trên FABi (mã món = mã cân,
  giá = giá đã giảm); mã lên cân ở lần gửi sau. Bán ra kho tự ghi là bán giảm giá.
- **Báo cáo** (chủ, quản lý, kế toán) — doanh thu / kg theo giờ, theo ngày, món bán chạy; bán giảm giá (tiền
  đã giảm, **giảm sớm** — gói còn hạn xa mà bán giảm); lệch ô; theo tảng (thu hồi, % bán). Tải Excel.

Với cân (quản lý, chủ):

- **Gửi giá từ kho** — đăng nhập kho Beeftown, lấy **mã cân, tên, giá bán/kg** từ Mặt hàng, xem trước thay đổi, bấm **Gửi xuống cân**. Không cần USB.
- **Tất cả hàng (SKU)** — mọi hàng đang có trên cân: số PLU, phím tắt, mã cân, **mã FABi** (5 số trong mã vạch), tên, giá, và đối chiếu với kho (khớp / khác kho / kho không có / còn nằm lại / chưa lên cân / không lên được). Có tìm kiếm, lọc, tải về Excel (CSV). Xem được cả khi chưa đăng nhập kho.
- **Mẫu tem** — sơ đồ tem đang dùng; chọn ô nào được in (tên hàng, số PLU, trọng lượng, đơn giá, thành tiền, mã vạch, ngày đóng gói, hạn dùng…) và sửa chữ cố định (tên quán, "Đơn giá", "HSD"…), rồi gửi xuống cân hoặc lưu file nạp USB.
- **Cân đổi địa chỉ** (từ 2.1.0) — nối cân không được thì chương trình tự dò WiFi tìm cân, dùng địa chỉ mới và gửi lại (xem mục bên dưới).

Từ 2.2.0 (quản lý, chủ — **chưa thử trên cân thật**, xem mục "Bản 2.2" bên dưới):

- **Cân & thông số** — hỏi cân qua cổng hai chiều 33581 (mã máy, loại máy, giờ trên cân: *chỉ đọc*), chỉnh giờ cân theo
  máy tính, **đọc dữ liệu từ cân qua WiFi** thay bước USB "Bắt đầu", **xoá hẳn hàng còn nằm lại qua WiFi** (thử), và
  vài thông số an toàn có tả tiếng Việt (kiểu ngày in, HSD chung, cách in tem mỗi lần cân, độ đậm…; thông số khác chỉ xem).
- **Phím tắt** — phím chữ nào (tầng 1 và tầng Shift) gọi hàng nào, đổi phím, gửi xuống cân.
- **Nhật ký cân** — nhật ký bán của cân (mỗi lần in tem, cả lần cân mà không in) đọc từ file lưu ra USB hoặc qua WiFi,
  gộp vào `nhat-ky-can.tsv` không trùng dòng; tóm tắt theo ngày / theo hàng, lọc, tải Excel (CSV).
- **Mẫu tem** sửa kỹ hơn — bấm chọn ô, kéo để dời (bước 1 mm), kéo góc để đổi cỡ, cỡ chữ, canh, xoay, khi nào in, thêm ô
  (ngày in, HSD, chữ cố định…), nút **Chỉ in HSD khi hàng có hạn dùng**; sơ đồ vẽ theo cỡ chữ, xoay, canh của cân.
- **HSD = số ngày còn lại của lô** (cách b, Khánh chọn 29/09/2026 — `web/src/lib/kho/danh-muc-can.ts`): cân in HSD = ngày in
  + số ngày, nên chương trình gửi **hạn của lô − hôm nay (giờ VN)** và phải gửi lại **mỗi ngày**. Ô mã đang giữ tảng theo lô
  lóc ra; món và ô trống theo lô sớm nhất còn tồn ở chi nhánh; chưa có lô thì theo hạn dùng của món; lô đã hết hạn và mã
  giảm giá không in HSD. Cột HSD ở Gửi giá từ kho và Tất cả hàng kèm nguồn ("lô L0012 hết hạn 03/10", "tảng #0142 · …").
  **Khung đỏ** ở ô Cân / Gửi giá / Tất cả hàng khi cân in HSD mà HSD trên cân tính cho ngày trước hôm nay. In HSD: chưa
  thử trên cân thật.
- Nút **Hướng dẫn** ở đầu trang: hướng dẫn dùng cân TM-A và chương trình (`src/huong-dan.html`, in được khổ A4).

Tên và giá hàng chỉ sửa ở kho (kho là gốc); chương trình không sửa tay SKU.

**Truy vết theo tảng:** phần cắt có **ô mã** (ví dụ 10011–10019) thì mỗi ô là một PLU trên cân. Khi bếp lóc
một tảng và bấm "Giao ô mã" trong kho, ô đó đổi tên thành "Thăn ngoại cắt lát #0142" ở lần gửi sau — tem in
ra có số tảng, FABi bán theo mã ô. Bật **Tự gửi xuống cân khi kho đổi** (Cài đặt) để chương trình tự gửi
mỗi phút khi kho có thêm / sửa (chỉ khi cửa sổ đang mở). Danh mục lấy từ `web/src/lib/kho/danh-muc-can.ts`,
dùng chung với màn Đồng bộ cân.

Phần tính "thêm / sửa / bỏ" là **đúng code của màn Đồng bộ cân** (`web/src/lib/kho/can-tma.ts`), nên hai nơi luôn ra cùng một kết quả.

## Tải BeeftownCan.exe về (không cần gõ lệnh)

**Từ bản 2.5 chỉ cần làm việc này một lần**: sau đó chương trình tự báo có bản mới và cập nhật bằng một nút (mục
"Bản 2.5 — tự cập nhật" bên dưới). Bản 2.4 trở về trước chưa có nút — cài 2.5 bằng tay theo các bước dưới đây.

GitHub tự đóng gói chương trình mỗi khi main có thay đổi cho Beeftown Cân. Cần đăng nhập GitHub bằng tài khoản vào
được repo này. File tải về là **file zip** (~39 MB): chuột phải → **Extract All…** (Giải nén tất cả) → được
`BeeftownCan.exe` (~83 MB), rồi làm tiếp như mục **Dùng** bên dưới.

**Bản dùng ở quán — Releases** (mỗi phiên bản một bản, giữ mãi):

1. Trang repo trên GitHub → cột bên phải, mục **Releases** → bấm bản mới nhất, ví dụ **Beeftown Cân 2.0.0**.
2. Mục **Assets** → bấm file zip mang số phiên bản, ví dụ **BeeftownCan-2.0.0.zip**. Không bấm "Source code" — đó là mã nguồn, không chạy được.

Release chỉ có thêm khi số phiên bản tăng.

**Bản mới nhất trên main — tab Actions** (có cả những sửa đổi chưa lên số phiên bản):

1. Tab **Actions** → cột trái bấm **Đóng gói Beeftown Cân**.
2. Bấm lượt chạy trên cùng có dấu ✓ xanh và nhánh **main** — bỏ qua lượt tên **🧪 Bản thử PR …** (bản thử, xem dưới).
3. Trang **Summary**: bấm dòng **⬇ Tải BeeftownCan-…** (ví dụ `BeeftownCan-2.0.0`), hoặc kéo xuống mục **Artifacts** → bấm tên đó.

Tab Actions chỉ giữ **một** bản chính thức, bản mới nhất: repo private có hạn mức dung lượng nên bản cũ tự xoá.
Dấu ✗ đỏ nghĩa là kiểm thử hoặc đóng gói hỏng, lượt đó không có file — báo người làm, tạm dùng bản ở Releases.

**Bản thử của một PR, trước khi gộp:**

1. Tab **Actions** → **Đóng gói Beeftown Cân** → nút **Run workflow** (bên phải).
2. Ô **Số PR muốn lấy bản thử** gõ số của PR (số sau dấu `#`, ví dụ `31`) → bấm nút xanh **Run workflow**.
3. Chờ chừng 1–2 phút, bấm lượt chạy mới, tải như bản trên main. Tên bản thử có chữ `thu` và số PR, ví dụ
   `BeeftownCan-2.0.0-thu-PR31-a1b2c3d`; giữ 7 ngày. Thử xong thì quay về bản ở Releases.

**Thay bản cũ ở quán:** đóng cửa sổ Beeftown Cân, chờ chừng 10 giây cho chương trình tắt hẳn, rồi chép file mới đè
lên file cũ. Cài đặt, đăng nhập, file gốc của cân không mất — chúng nằm ở `%APPDATA%` và `Tài liệu`, không nằm cạnh file .exe.

## Dùng

1. Chép `BeeftownCan.exe` (tải ở mục trên) vào máy tính ở quán (máy phải cùng WiFi với cân). Nháy đúp để mở.
   File không ký số: lần đầu Windows có thể báo *"Windows protected your PC"* → **More info** → **Run anyway**.
2. **Đăng nhập kho** bằng tài khoản kho (NV quầy dùng thẻ Quầy, Tảng & ô; gửi giá xuống cân, tem, mã giảm: quản lý hoặc chủ). Máy nhớ đăng nhập.
3. **Bắt đầu** (một lần): trên cân lưu dữ liệu ra USB (`Prog → ↓ V3 tới P4 → Accu/Confirm → Accu/Confirm → Amend`), chọn file `JHSCALE\A_000.TMS`.
4. Mỗi lần đổi giá / thêm món trong kho: mở chương trình → xem bảng thay đổi → **Gửi xuống cân** → gọi thử một hàng trên cân.
5. Đổi tem: thẻ **Mẫu tem** → bỏ chọn / chọn ô, sửa chữ → **Gửi tem xuống cân** → cân thử một món, in một tem xem đã đổi chưa. Nếu chưa đổi: **Lưu file nạp USB**.
6. Việc mới của 2.2: thử theo thứ tự ở mục **"Thử bản 2.2 ở quán"** bên dưới — bắt đầu bằng việc chỉ đọc.

## Bản 2.2 — cổng hai chiều, thông số, phím, nhật ký, HSD, sửa tem

Dựng lại từ phần mềm TM-xA của hãng (đọc mã dịch ngược, không chạy). Tài liệu kỹ thuật đầy đủ (định dạng file,
giao thức, bảng mã tem, bảng "đã thử / chưa thử"): **`CAN-TMA.md`**.

**2.2.1** (sửa sau rà soát, PR #34): không gửi lại khối giờ cũ (đồng hồ cân không bị lùi); hàng mới không thừa hưởng
HSD của món khác; nhật ký qua WiFi đọc tiếp từ giao dịch mới nhất sau khi cân đếm lại số; một giao dịch đọc qua USB
rồi WiFi không bị lưu hai lần; ô cổng hai chiều để trống thì về 33581. Bản **2.2.0** ở Releases chưa có các sửa này.

| Việc | Đường | Mã | Đã thử trên cân thật? |
|---|---|---|---|
| Gửi giá / tên (2.1) | TCP 33571, file như USB | `nghiep-vu.ts` `guiTcp` | **Đã thử** (26/09/2026): chỉ thêm / sửa, không xoá |
| Thông tin cân, giờ cân (chỉ đọc) | TCP 33581 — bắt tay MAC / INF, `UPL TIM` | `giao-thuc.ts` | Chưa thử |
| Đọc dữ liệu từ cân qua WiFi | 33581 — `UPL TMS…LAB`, ghép thành file như USB | `docTuCan` | Chưa thử |
| Chỉnh giờ cân | 33581 `DWL TIM` + đọc lại giờ; hỏng thì khối giờ qua 33571 | `chinhGioCan` | Chưa thử (cả hai đường) |
| Xoá hẳn hàng còn nằm lại | 33581 — đọc PLU (kiểm: không rỗng, không có PLU lạ), bản sao vào `da-gui`, `CLR PLU` + gửi lại cả danh sách, đọc lại để so | `xoaQuaWifi` | Chưa thử |
| Nhật ký bán | phần `REP` của file USB; hoặc 33581 `UPL REP -N` (đọc hai lần cho khớp) | `bao-cao-can.ts` | File USB: đã đối chiếu file thật; WiFi: chưa thử |
| Thông số, phím tắt | file nhỏ chỉ có khối `TMS` / `SCP` đổi, qua 33571 | `thong-so.ts` | Chưa thử |
| Chữ cài đặt chung (2.4) | file nhỏ chỉ có khối `TMT` đổi, qua 33571 | `thong-so.ts` `suaChuChung` | Chưa thử |
| Sửa / thêm ô tem | cả file như 2.1, qua 33571 | `tem.ts` | Chưa thử (tắt / bật ô, sửa chữ: như 2.1) |
| HSD trên dòng PLU | cột 27 / 32 (`web/src/lib/kho/can-tma.ts`) — số ngày còn lại của lô, tính mỗi ngày (`danh-muc-can.ts`) | `lapKeHoach`, `hangChoCan` | Chưa thử |

Quy tắc:

- **Không báo "đã đổi" khi cân chưa xác nhận.** Qua 33571 cân không trả lời → trang nói "đã gửi", chỉ cách kiểm trên cân
  và nút **Lưu file nạp USB**. Qua 33581 chương trình đọc lại (giờ, danh sách PLU) rồi mới báo xong.
- **Mọi lần gửi xuống cân bỏ phần `REP` (nhật ký bán) và `INF` (thông tin máy)** (`boPhanChiDoc`): TM-xA không bao giờ
  gửi hai phần này, và gửi lại nhật ký cũ có thể đè nhật ký mới trên cân. Vì vậy file USB có nhật ký thì chương trình
  gộp nhật ký vào `nhat-ky-can.tsv` **ngay lúc ghi nhận file** — file gốc sau lần gửi đầu không còn nhật ký.
- Việc ghi xuống cân và mọi việc qua 33581 chạy **lần lượt** qua hàng đợi của 2.1. Mỗi việc mở một kết nối 33581 rồi
  đóng (không giữ kết nối). Nối 33581 không được mà cân đã đổi địa chỉ (cổng 33571 ở địa chỉ mới) thì thử lại ở đó.
- Không bao giờ gửi qua 33581 (`kiemKhoiGhi`): `CLR` phần nào khác PLU, thông số mạng, tên / mật khẩu WiFi (TMT 15/16/19),
  `REP`, `INF`, `TIM`. Xoá cả danh sách PLU chỉ khi danh sách mới không rỗng.
- **Không file nào gửi xuống cân mang dòng `CLR`**: `ghiFileCan` bỏ mọi dòng `CLR` (33571, USB, dây, trang web); file của
  TM-xA tích "Clear Data" (có `CLR TMS` / `TMT`…) bị từ chối lúc đọc, và file gốc không nhận file có dòng `CLR` nào.
- Đường 33571 gửi **cả file gốc**: các dòng TMS / TMT trong file gốc (kể cả TMT 15/16/19 và thông số mạng nếu file lưu từ
  cân ra USB có) đi lại xuống cân mỗi lần gửi — `kiemKhoiGhi` không chặn đường này (CAN-TMA §8). File đọc qua WiFi
  (`docTuCan`) thì bỏ hẳn các dòng mạng: giá trị cân trả qua cổng chưa thử không được thành cài đặt gửi ngược xuống cân.
- **Xoá qua WiFi chỉ chạy khi chắc**: đúng kế hoạch đã xem trước (dấu `dauVan`), không kèm bật / tắt in HSD (HSD đếm ngược
  thì được — cả danh sách gửi lại mang số ngày tính hôm nay), cân đã biết mã máy
  (bấm **Đọc thông tin cân** trước; cân ở địa chỉ đó mà khác mã máy thì mọi việc 33581 dừng), danh sách đọc trước không rỗng
  và không có PLU chương trình không biết. Hỏng sau khi đã gửi lệnh xoá → `can-chua-ro.json`: tự gửi, Tất cả hàng, Xem trước
  không coi cân là "khớp kho", tự gửi gửi lại cả danh sách qua 33571, tới khi gửi đủ / nạp USB.
- **Đọc dữ liệu từ cân qua WiFi** không ghi nhận khi cân trả 0 hàng / 0 thông số, hay thiếu PLU đang có trên cân — dùng USB.
- **Tự gửi gửi HSD đếm ngược, không tự bật / tắt in HSD**: đổi số ngày (số → số: sang ngày mới, đổi lô) tự gửi gửi như đổi
  giá; bật / tắt in HSD của hàng trên cân (không in ↔ có số — lô hết hạn, món mới có hạn), hay bật HSD cho hàng mới khi cân
  chưa in HSD hàng nào, thì tự gửi **không gửi gì** và báo ở ô Cân — quản lý xem trước rồi bấm Gửi. Tự gửi kiểm và gửi trên
  cùng một lần đọc kho.
- **HSD = số ngày còn lại của lô** (`danh-muc-can.ts`): cân in HSD = ngày in tem (đồng hồ cân) + số ngày ở cột 32. Kho biết
  hạn của lô (`kho_lo.han_dung`, đọc từ `kho_v_ton` của chi nhánh bằng tài khoản đã đăng nhập), nên gửi hạn − hôm nay:
  ô mã đang giữ tảng → lô lóc ra (phiên lóc còn nháp: không muộn hơn hạn tảng); món, ô trống → lô **sớm nhất** còn tồn (mọi
  vị trí); chưa có lô → `han_dung_ngay` của món (không có → không in); hạn đã qua → không in + cảnh báo "xem thẻ Quầy";
  quá 999 ngày → không in; mã giảm giá → không in. Số này chỉ đúng **trong ngày tính**: mỗi sáng mở Beeftown Cân và gửi
  (hay bật tự gửi) **trước khi đóng gói**, đồng hồ cân phải đúng ngày.
- **Ngày tính HSD trên cân** — `Tài liệu › Beeftown Can › hsd-tinh-ngay.txt` (một dòng `YYYY-MM-DD`, ghi file tạm rồi đổi
  tên): ghi khi gửi đủ danh sách thành công (bấm Gửi, tự gửi), xoá qua WiFi đọc lại khớp, "đã nạp USB" file lưu từ thẻ Gửi
  giá (ngày lúc **lưu file**, ở `cho-usb/hsd-tinh-ngay.txt`), hay khi xem trước / tự gửi / Tất cả hàng thấy HSD trên cân
  đã đúng số tính hôm nay. Gửi hỏng thì không ghi. Cập nhật file gốc từ cân có HSD khác bản đã gửi → quên ngày (chưa
  biết). `/api/trang-thai` và `/api/can` trả `hsd: { homNay, tinhNgay, coInHsd, cu }` (hôm nay giờ VN của chương trình —
  trang không dùng đồng hồ trình duyệt); `cu` → khung đỏ "HSD trên cân tính cho ngày dd/mm — mỗi ngày chưa gửi lại là HSD
  in ra muộn thêm 1 ngày. Gửi xuống cân trước khi đóng gói." Hàng kho không đưa lên được (thiếu giá…) và hàng giữ lại
  ngoài kho: HSD trên cân của các hàng đó không được đếm ngược.
- **Nhật ký cân: tên hàng là tên trên cân lúc đọc**, không phải lúc bán; mã cân chỉ gắn khi đơn giá và cách bán của dòng
  khớp hàng đang ở số PLU đó (bảng PLU của cùng file USB, hoặc đọc qua WiFi ngay sau nhật ký). Đọc thường xuyên, và trước
  khi gửi giá / hàng mới. Gộp giữ bản đọc sớm nhất (khoá: mã máy + số giao dịch + giờ + dòng).

Quyền (phía máy chủ, `kiemQuyenCan`): mọi việc mới của 2.2 theo quy tắc thẻ Mẫu tem — chưa đăng nhập kho thì làm được
(máy của quản lý chạy không cần kho; không đọc được kho vì mất mạng cũng coi như chưa đăng nhập), đã đăng nhập mà vai
không có `danh_muc` (NV quầy, thủ kho, kế toán) thì bị từ chối. Ba thẻ mới chỉ hiện cho quản lý, chủ (hoặc khi chưa đăng nhập).

### Thử bản 2.2 ở quán (theo thứ tự — dừng ở bước nào hỏng thì dùng USB như 2.1)

Trước khi thử: **đóng TM-xA** trên mọi máy; quầy vắng; có sẵn USB và file lưu từ cân ra USB gần nhất.

1. **Chỉ đọc:** thẻ Cân & thông số → **Đọc thông tin cân**. Đúng khi hiện mã máy `0023F019CFCA`, loại máy
   `TM-xA UA006 V3.14E8` và giờ cân (chương trình nhớ mã máy này; xoá qua WiFi cần bước này). Không được: ghi lại câu báo
   nguyên văn (cổng 33581 có mở không — Spec166 = 33581, Spec43 = 1).
2. **Chỉ đọc:** **Đọc giờ cân** — so với màn hình cân (bấm **Time**).
3. **Chỉ đọc (cân), thay file gốc (máy tính):** **Đọc dữ liệu từ cân qua WiFi** — số hàng ở ô "Trên cân" khớp; thẻ Tất cả
   hàng đúng tên, giá. Không ghi gì xuống cân.
4. **Chỉ đọc:** thẻ Nhật ký cân → **Đọc qua WiFi (thử)** — so vài dòng với tem đã in hôm nay.
5. **Ghi, đổi lại được:** **Chỉnh giờ cân theo máy tính** — xem trang báo đường nào (33581: cân báo lại giờ; 33571: chưa
   xác nhận), rồi bấm **Time** trên cân.
6. **Ghi, đổi lại được:** đổi một thông số nhẹ (ví dụ Độ đậm khi in tem 9 → 10), gửi, in thử một tem; đổi lại.
7. **Ghi:** đổi một phím ít dùng ở tầng Shift, gửi, bấm thử trên cân; đổi lại.
8. **HSD, với một PLU thử** (CAN-TMA §13 — số PLU và mã cân không món thật nào dùng; **không** dùng "Gửi giá từ kho" cho
   việc này): trên cân đặt PLU thử PS-UD = 1, PC-UD = 3 (sửa nhanh `F-Prog` + `PLU`), hoặc bằng file USB. In một tem: HSD =
   hôm nay + 3, đúng kiểu ngày của cân (Spec104).
9. **Ghi:** thẻ Mẫu tem → **Chỉ in HSD khi hàng có hạn dùng** (ô Hạn dùng và chữ "HSD" sang "chỉ khi có HSD") → gửi → in
   PLU thử (có HSD) và một món thật (không HSD): món thật không còn chữ "HSD" lẻ loi.
10. **Rủi ro nhất, làm sau cùng:** khi có hàng "còn nằm lại", **Xoá hẳn qua WiFi (thử)** (cần bước 1 trước). Chương trình
    kiểm danh sách trên cân trước khi xoá, đọc lại để so; lệch hay hỏng thì nạp USB ngay (khung đỏ có nút **Lưu file để nạp USB**).
11. **Ngoài giờ bán, sau các bước trên:** bấm **Gửi giá từ kho** lần đầu với bản 2.2 — xem các dòng "Sửa" trước khi bấm Gửi:
    lần đầu này bật in HSD (số ngày còn lại của lô) cho các món có lô / hạn dùng, và tắt HSD của mã giảm giá. Để sẵn file USB
    lưu từ cân trước khi thử. Gửi xong in một tem món có lô: HSD trên tem phải đúng hạn của lô (thẻ Quầy / Tồn kho). Hôm sau
    (chưa gửi): ô Cân có khung đỏ; gửi (hay tự gửi) → số ngày giảm 1, HSD trên tem vẫn đúng hạn của lô.

Ghi lại bước nào được / không được (và câu báo nguyên văn) để sửa `CAN-TMA.md` mục "đã thử / chưa thử".

## Bản 2.9.2 — chỉ ghi nhận khi đọc lại cân khớp; không đọc lại được thì tự thử lại

**Lỗi (rà soát nợ kỹ thuật 11/10/2026, tái hiện trên cân giả — `test/thu.ts` 6g6–6g8):** cổng hai chiều 33581 bận chốc lát
(phần mềm của hãng TM-xA đang mở, cân đang lưu) → lần gửi rơi về cổng 33571 (cân của quán bỏ qua cổng này từ 02/10/2026) →
đọc lại cân không được (`khong-doc`). Bản 2.6–2.9.1 vẫn ghi `tren-can.tsv`, `A_000.TMS`, `hsd-tinh-ngay.txt` như cân đã nhận:
phút sau kế hoạch thấy "không có thay đổi", tự gửi không thử lại, báo kho `lech_so = 0` và tên ô MỚI → trang pha lóc hiện
**"Cân sẵn sàng"** xanh trong khi cân vẫn tên cũ (tem in sai số tảng); khung đỏ HSD cũ cũng bị giấu. Gốc: `tren-can.tsv` thiết kế
là "có thể đã trên cân" (2.6 / 2.7), từ 2.9 lại được báo kho như "chắc chắn trên cân".

Từ 2.9.2 (`nghiep-vu.ts` `guiKeHoach`, `tuGuiMotLan`, `baoKhoMotLan`):
- **Trạng thái "trên cân" chỉ đổi khi đọc lại khớp**: `tren-can.tsv`, file gốc `A_000.TMS`, `hsd-tinh-ngay.txt` là thứ cân ĐÃ XÁC
  NHẬN (đọc lại khớp, file từ cân / nạp USB, xoá qua WiFi đọc lại khớp). Không đọc lại được → không ghi nhận gì: bảng vẫn "Thêm" /
  "Sửa", khung đỏ HSD cũ vẫn hiện, thẻ Tảng & ô vẫn "cân chưa đổi tên".
- **Kế hoạch đang chờ tách riêng**: hàng vừa gửi mà cân chưa xác nhận nằm ở `Tài liệu\Beeftown Can\cho-xac-nhan.tsv` ("có thể đã
  trên cân" — chỉ để tính hàng còn nằm lại). Kho bỏ món trước khi cân được kiểm thì món đó vẫn báo "có thể còn nằm lại", gỡ / xoá
  qua WiFi nhận ra nó; lần đọc lại khớp sau đưa dòng nào cân thật sự có vào `tren-can.tsv`, dòng cân không có thì bỏ.
- **Tự thử lại có lùi giờ** (`THU_LAI_KHONG_DOC_MS`): lần gửi không đọc lại được thứ 1, 2, 3, 4+ liên tiếp → tự gửi thử lại cả
  danh sách sau 1, 2, 5, 10 phút (`chua-xac-nhan.json` ghi `soLanThu`, `thuLaiLuc`) — kể cả khi kế hoạch thấy kho không đổi (cân
  có thể đang giữ bản chưa xác nhận). Chưa tới giờ: ô Cân "… chưa ghi nhận; tự gửi thử lại lúc 10:03". Bấm Gửi xuống cân không
  phải chờ. Dấu kiểu 2.9.1 (chưa có giờ) → thử lại ngay lượt đầu sau khi cập nhật.
- **Báo kho cờ chưa xác nhận** (migration `0066_kho_can_chua_xac_nhan.sql`): `kho_may_can_bao` nhận `chua_xac_nhan` (lần gửi gần
  nhất chưa đọc lại được / đọc lại lệch, hay xoá qua WiFi hỏng); `tren_can` chỉ còn dòng đã xác nhận. Trang pha lóc
  (`web/src/lib/kho/danh-muc-can.ts`) không nói "Cân sẵn sàng" theo dòng của máy chưa xác nhận — vàng "Chưa chắc cân đã có … —
  chưa in tem". Kho chưa chạy 0066 thì cờ bị bỏ qua, phần còn lại vẫn đúng (tren_can đã là thứ cân xác nhận).
- Kiểm thử: các cân giả kiểu 2.1 (chỉ cổng 33571) đọc lại thẳng dữ liệu của chúng (`phu.docLaiPlu`) — từ bản này không đọc lại
  được là không ghi nhận. Gửi thông số / chữ chung / phím / tem không đọc lại được vẫn ghi nhận như 2.7 (khung vàng) — chưa đổi.

**Thử ở quán (2.9.2)** — ngoài giờ bán, đã đóng TM-xA, Tự gửi bật:
1. Sửa giá một món ít bán trong kho → trong 1 phút ô Cân "Đã tự gửi … cân đã nhận (đọc lại khớp)" như trước.
2. Cài đặt → **Cổng hai chiều** gõ `33599` (sai cố ý — giả cổng hai chiều bận) → Lưu. Sửa giá món đó lần nữa → trong 1 phút ô
   Cân: "… chưa đọc lại được cân để kiểm, chương trình chưa ghi nhận; tự gửi thử lại lúc …". Thẻ Gửi giá từ kho: món đó vẫn
   **"Sửa"**, khung vàng "Lần gửi lúc … chưa được cân xác nhận … Tự gửi thử lại lúc …". `/noi-bo` → đèn "Beeftown Cân" không xanh
   sau ~15 phút (kho đổi mà cân chưa nhận). Gọi PLU món đó trên cân: giá cũ (cân bỏ qua cổng 33571).
3. Xoá ô **Cổng hai chiều** (về 33581) → Lưu. Tới giờ thử lại (1–2 phút) ô Cân "Thử lại lần 2: đã gửi lại cả danh sách … cân đã
   nhận (đọc lại khớp)"; bảng "Giữ nguyên"; gọi PLU trên cân: giá mới.
4. (Khi có phiên lóc thật, kho đã chạy 0066) Lặp bước 2 ngay sau khi bấm "Giao ô mã": trang pha lóc → Xem lại cân → **không**
   có dòng xanh "Cân sẵn sàng" (vàng "Cân còn tên cũ" hay "Chưa chắc cân đã có …"); làm bước 3 → Xem lại cân → xanh.
5. (Tuỳ chọn) Mở TM-xA, cho nó nối cân, rồi sửa giá: ra khung vàng như bước 2 là đúng kịch bản rà soát; ra khung xanh thì cân
   nhận hai kết nối cùng lúc — ghi lại để sửa `CAN-TMA.md` §10.2.9.

## Bản 2.9.1 — internet treo không làm đứng việc với cân; ghi file an toàn khi mất điện

Rà lại cả đường đọc / ghi / xoá / ghi đè với cân (05/10/2026, trên cân giả): cổng hai chiều 33581, đường lui 33571, giữ kết
nối, đọc lại sau khi gửi, gỡ bằng ghi đè, xoá hẳn và tự phục hồi. Cách nói chuyện với cân không đổi. Hai chỗ hỏng thật,
đều nằm NGOÀI đường WiFi tới cân (`test/thu-ben-vung.ts`):

- **Internet treo làm đứng mọi việc với cân.** Tự gửi (mỗi phút), bấm Gửi, gỡ / xoá hàng đọc kho bên trong hàng đợi việc với
  cân (`motLuc`), không hạn. Mạng nhà mạng treo (WiFi trong quán vẫn tốt, ra internet thì không trả lời): `fetch` của Bun chờ
  khoảng 6 phút mới bỏ (đo 05/10/2026: 360 giây), thư viện kho còn tự thử lại lần đọc 3 lần — nhịp 30 giây, tự đọc nhật ký khi
  in tem, Đọc giờ cân, Gửi xuống cân… đứng chờ cả chục phút. Từ 2.9.1:
  - **tự gửi và báo kho đọc kho NGOÀI hàng đợi** (`docKhoChoCan`) — việc với cân không chờ kho. Trong hàng đợi chỉ dùng lần đọc
    đó khi chưa có lần gửi nào xen giữa (`soLanApKho`): người bấm Gửi giá mới trong lúc tự gửi đang đọc kho thì tự gửi không
    đem lần đọc cũ đè giá cũ lên cân — lượt sau đọc lại;
  - đọc danh mục kho tối đa 30 giây (`HAN_DOC_KHO_MS`) — quá hạn: "Kho không trả lời sau 30 giây … chưa gửi gì xuống cân";
    bấm Gửi, gỡ / xoá vẫn đọc trong hàng đợi (người bấm chờ kết quả) nhưng không quá hạn này; kho trả lời muộn thì bỏ;
  - mỗi yêu cầu tới kho có hạn (`fetchCoHan`): đọc và đăng nhập 20 giây; gọi hàm kho (báo cáo cả tháng, ghi), tải ảnh phiếu huỷ
    120 giây (ghi xong mà báo quá hạn thì người dùng bấm lại oan). Quá hạn là huỷ hẳn; thư viện kho không tự thử lại nữa
    (`db.retry: false` — mất mạng thì mỗi lần đọc đỡ chờ 7 giây; tự gửi, báo kho tự thử lại mỗi phút);
  - nút việc với cân hỏi kho "ai đang đăng nhập" tối đa 8 giây (`HAN_HOI_QUYEN_MS`); không đọc được kịp (mất mạng, kho chậm) thì
    theo người đọc được lần gần nhất — NV quầy vẫn bị từ chối việc của quản lý; chưa đọc được lần nào (vừa mở máy lúc mất mạng)
    thì như chưa đăng nhập, đúng quy tắc sẵn có của `kiemQuyenCan`;
  - mất mạng nói đúng là mất mạng: đăng nhập không báo "Sai email hoặc mật khẩu"; đọc nhân sự hỏng mạng ngay sau khi đăng nhập
    không còn đăng xuất người dùng với câu "không phải nhân viên kho"; tự gửi không bảo "Đăng nhập lại" (`nguoiDung` ném lỗi mạng,
    không trả "chưa đăng nhập"); lỗi kho dạng đối tượng (PostgREST) không còn ra "Có lỗi: [object Object]".
- **Ghi đè giữa chừng để lại file dở.** File gốc `A_000.TMS`, `tren-can.tsv`, `cau-hinh.json`, `phien.json`, file nạp USB ghi
  đè thẳng: mất điện / đầy ổ đúng lúc ghi → file gốc đọc không được (làm lại "Bắt đầu"); `cau-hinh.json` hỏng thì chương trình
  âm thầm về cài đặt mặc định (địa chỉ cân 192.168.1.22, tắt tự gửi, quên mã máy cân); file nạp USB dở thì cân nạp thiếu hàng.
  Từ 2.9.1 mọi file đó ghi qua `ghiFileAnToan`: file tạm `.tam` → đẩy xuống đĩa (fsync) → đổi tên đè; hỏng giữa chừng thì file
  cũ còn nguyên. File dấu, `hsd-tinh-ngay.txt`, nhật ký cân vốn đã ghi kiểu này, nay thêm fsync. Đổi cả hai file thì
  `tren-can.tsv` ghi TRƯỚC file gốc: hỏng giữa hai lần ghi thì danh sách "có thể đang trên cân" thừa (chỉ thêm cảnh báo còn nằm
  lại), không bao giờ thiếu (hàng nằm lại mà không ai biết).

Đã xem, không phải sửa: Bun mở kết nối TCP sẵn `TCP_NODELAY` — đọc nhiều phần liền (Đọc dữ liệu từ cân) không bị trễ kiểu
Nagle (đo trên cân giả); mọi việc qua cổng hai chiều đều đi qua hàng đợi `motLuc` trên một kết nối, không chồng lệnh.

**Thử ở quán (2.9.1)** — sau khi cài:
1. Mở chương trình: địa chỉ cân, tự gửi, đăng nhập, ô Cân như trước. Gửi vài lần: trong `Tài liệu\Beeftown Can` và
   `%APPDATA%\BeeftownCan` không còn file `.tam` nào.
2. Rút dây internet của modem (WiFi trong quán vẫn bật): bấm **Đọc giờ cân** (thẻ Cân & thông số) → có giờ trong vài giây; ô
   Cân vẫn xanh; tự gửi báo mất mạng / kho không trả lời, không gửi gì. Cắm lại → trong 1–2 phút tự gửi chạy lại.
3. (Tuỳ chọn) Lúc rút dây: đăng xuất rồi đăng nhập → "Mất kết nối mạng: không nối được kho…", không phải "Sai email hoặc mật
   khẩu".

## Bản 2.9 — báo về kho; NV quầy tự gửi; vừa "Giao ô mã" là cân đổi tên trong 15 giây

Giai đoạn 3 của kế hoạch 03/10/2026 (web + database: migration `0061_kho_can_quay.sql`). Cần kho đã chạy 0061; kho chưa có
0061 thì 2.9 vẫn chạy như 2.8 (báo kho hỏng, tự thử lại mỗi phút — ô Cân nói rõ).

- **NV quầy tự gửi được** (`layDanhMuc(tuDong)`): danh mục cân đọc ô đang giao bằng `kho_can_giao_o_ma` (mọi vai xem — NV
  quầy đọc view `kho_v_o_ma_giao` thì rỗng, tên ô mất số tảng). Chỉ TỰ GỬI (`tuGuiMotLan`) mở cho mọi vai xem; bấm Gửi xuống
  cân, xem trước, file USB, gỡ / xoá hàng vẫn chỉ quản lý / chủ.
- **Hỏi kho 15 giây** (`khoDoiO`, `HOI_KHO_MS`, khi bật Tự gửi): dấu vân tay các ô đang giao đổi (vừa "Giao ô mã", chốt
  phiên, tảng bán hết) → tự gửi ngay, không đợi lượt mỗi phút. Mất mạng → thôi, lần sau hỏi lại.
- **Báo về kho mỗi phút** (`baoKhoMotLan`, `BAO_KHO_MS`, `src/bao-kho.ts`): `kho_may_can_bao` — mã máy quầy
  (`%APPDATA%\BeeftownCan\ma-may.txt`, sinh một lần), phiên bản, MAC cân, giữ kết nối, cân trả lời lần cuối, tự gửi, số hàng
  lệch kho, tự gửi hỏng, lần gửi được, và các dòng đang trên cân kèm phím tắt (chỉ gửi khi đổi, hay 10 phút một lần; kho
  chỉ giữ dòng mã ô). Rồi nhật ký tem (`kho_may_can_nhat_ky`): dòng bán có mã, theo ký, từ mốc của chi nhánh
  (`nhat-ky-da-gui.json`; lần đầu: 3 ngày) — mốc chỉ tiến SAU khi kho trả lời, gửi lại an toàn (kho bỏ dòng trùng). "Đã báo"
  chỉ khi kho đã trả lời; ô Cân hiện lần báo gần nhất.
- Kho dùng các báo đó cho: dòng **"Cân sẵn sàng: Ribeye #0142 = PLU 23 · phím E"** trên trang pha lóc (chỉ khi cân có đúng
  TÊN MỚI), đối chiếu "cân in 12 tem ô 10011, phiên quét 11", và đèn **"Beeftown Cân"** của chi nhánh ở `/noi-bo` (đỏ khi
  máy quầy không báo quá 30 phút trong giờ mở cửa).

**Thử ở quán (2.9)** — sau khi 2.8 đạt, kho đã chạy 0061:
1. Đăng nhập bằng tài khoản NV quầy, bật "Tự gửi" ở Cài đặt → trong 1 phút ô Cân "Báo về kho · … — Đã báo trạng thái cân về
   kho"; `/noi-bo` (chủ) đèn "Beeftown Cân" của chi nhánh xanh.
2. Lóc một tảng theo dõi theo tảng: bấm "Giao ô mã cho phần cắt" → trong khoảng 15–30 giây cân đổi tên phím (bấm phím trên
   cân thấy tên kèm số tảng); tải lại trang pha lóc → dòng "Cân sẵn sàng" xanh, đúng số PLU và phím.
3. In vài tem bằng phím ô, quét vào phiên → bước Kết quả: "Cân in N tem mã …, phiên quét N — khớp" (nhật ký cân gửi lên mỗi
   phút; ô Cân nói số dòng đã gửi).
4. Tắt Beeftown Cân trong giờ mở cửa → sau 30 phút đèn "Beeftown Cân" đỏ (và báo động nếu đã có kênh).

## Bản 2.8 — giữ kết nối với cân; tự đọc nhật ký khi cân báo in tem; tự chỉnh giờ cân; nghe cân phát UDP

Giai đoạn 2 của kế hoạch 03/10/2026: làm như phần mềm của hãng khi nối cân (`CAN-TMA.md` §10.2.7, §10.3, §10.4). **Chưa thử
trên cân thật** — làm theo "Thử ở quán (2.8)" bên dưới, sau khi bản 2.7 đã thử đạt.

- **Giữ một kết nối hai chiều mở** (`src/giu-ket-noi.ts`, cài đặt `giuKetNoi`, mặc định bật): mọi việc qua cổng 33581 đi trên
  MỘT kết nối, không mở-làm-đóng mỗi việc như 2.7 (cân có nhận hai kết nối cùng lúc không: chưa biết — §10.2.9 — nên không
  bao giờ mở kết nối thứ hai khi kết nối đang giữ còn dùng được). Trước mỗi lần dùng lại: hỏi giờ với hạn ngắn (`docGio(4000)`,
  như hàng rào `UPL TIM`) — biết kết nối còn sống (không bao giờ ghi vào kết nối chết rồi chờ hết hạn hàng rào) và bỏ dòng thừa
  của việc trước. Việc nào hỏng thì bỏ kết nối, lần sau bắt tay lại. "Đọc thông tin cân" và bước bắt tay của Chẩn đoán WiFi
  luôn bắt tay lại trên kết nối mới. Kiểm mã máy (`kiemMayHaiChieu`) mỗi lần lấy kết nối; cân khác mã → bỏ kết nối. Tắt ở Cài
  đặt → như 2.7.
- **Nhịp 30 giây** (`nhipCan`, `main.ts`): hỏi giờ cân như hãng → đèn ô Cân tự xanh / đỏ, dòng "cân trả lời lúc …, giờ cân
  đúng / nhanh / chậm" (`trangThaiNen`, `/api/can`; trang làm mới mỗi 15 giây). Nhịp không bao giờ dò WiFi.
- **Nghe cân tự báo in tem** (`ASK REP`, thông số 58 = 1 — phần mềm hãng bật sẵn trên cân của quán): `giao-thuc.ts` đưa dòng
  `ASK…` cho người nghe (`khiCanBao`) thay vì chỉ bỏ. Cân báo → chờ 5 giây (in liền nhiều tem thì đọc một lần) → đọc nhật ký
  từ giao dịch cuối đã lưu (`docNhatKyNen` → `docNhatKyWifi`, cùng cách với nút "Đọc qua WiFi") → gộp vào `nhat-ky-can.tsv`.
  Vừa nối (lại) được cân → đọc bù. Không kiểm vai (chỉ đọc cân, lưu trên máy này — xem vẫn chỉ quản lý / chủ), không dò WiFi.
  Ô Cân báo khi file gốc có thông số 58 chưa bật tự báo.
- **Tự chỉnh giờ cân** (`tuDatGioNeuCan`, cài đặt `tuDatGio`, mặc định bật): giờ cân lệch giờ **Việt Nam** (`gio-vn.ts`, không
  theo múi giờ của máy) quá 30 giây → `DWL TIM` theo giờ VN, cân đọc lại trong hàng rào (`datGio`). Mỗi ngày (giờ VN) tối đa 3
  lần, cách nhau ít nhất 10 phút. Trước khi gửi: giờ máy tính phải khớp giờ mạng (trường `Date` của máy chủ kho) trong 2 phút —
  không khớp / mất mạng thì không chỉnh, ghi lý do. Các lần trong ngày: `%APPDATA%\BeeftownCan\tu-dat-gio.json`.
- **Nghe cân phát UDP** (`src/udp-can.ts`, cài đặt `ngheUdp`, mặc định **tắt** — lần đầu Windows hỏi tường lửa): nghe cổng
  33584 (`reuseAddr`: TM-xA cùng máy vẫn nghe được). Nhịp không nối được địa chỉ cũ mà nghe thấy ĐÚNG MỘT cân phát ở địa chỉ
  khác → nối cổng hai chiều ở đó, mã máy phải đúng `macHaiChieu` → dùng địa chỉ mới (`theoUdp`). "Tìm cân" hỏi như hãng (5 gói
  `UDP⇥␍␊` tới cổng 33583) rồi dùng các máy trả lời lần hỏi này, không dò cả WiFi bằng TCP; không ra cân dùng được thì dò như
  trước. Gói UDP không mang mã máy, ai trong WiFi cũng phát được: mỗi máy trả lời phải qua `xacMinhMayUdp` — đã nhớ mã máy cổng
  hai chiều thì bắt tay ở đó, mã phải đúng; chỉ nhớ mã ARP thì nối thử rồi đọc bảng ARP, không đọc được thì không tin.
- Cập nhật: đổi file xong thì đóng kết nối đang giữ (`dongNen`) trước khi bản mới mở.

**Thử ở quán (2.8)** — sau khi 2.7 đạt; ngoài giờ bán, đã đóng TM-xA:
1. Mở chương trình → trong 30 giây ô Cân xanh, "Đang nối cân (cổng hai chiều) · cân trả lời lúc …"; tắt cân → trong chừng 1
   phút ô Cân đỏ; bật lại → xanh lại.
2. Gửi giá một món (thẻ Gửi giá từ kho) → vẫn khung xanh "cân đã nhận". Nếu gửi hỏng mà 2.7 thì được: bỏ "Giữ kết nối với cân"
   ở Cài đặt, báo lại.
3. In một tem → trong chừng 10 giây ô Cân: "Nhật ký cân: tự đọc lúc … (cân báo vừa in tem), 1 dòng mới"; thẻ Nhật ký cân có dòng.
4. Giờ cân: chỉnh tay giờ cân lệch vài phút (Prog, mục 6 của Hướng dẫn) → trong 30 giây ô Cân: "Đã tự chỉnh giờ cân theo giờ
   Việt Nam …"; bấm `Time` trên cân thấy đúng.
5. (Tuỳ chọn) Bật "Nghe tín hiệu cân phát" → Windows hỏi tường lửa → Cho phép → ô Cân "Nghe tín hiệu cân: 192.168.1.… lúc …".

## Bản 2.7 — mọi việc ghi qua cổng hai chiều rồi đọc lại; gỡ hàng bằng ghi đè; tự phục hồi; Chẩn đoán WiFi

Ở quán từ 02/10/2026 cân bỏ qua mọi lần gửi qua cổng 33571, còn đọc qua cổng hai chiều 33581 thì được (mục "Bản 2.6.1").
2.6.1 mới chuyển phần **gửi giá**; 2.7 chuyển nốt mọi việc ghi và thêm cách xoá an toàn. **Chưa thử trên cân thật** — làm
theo "Thử ở quán (2.7)" bên dưới.

- **Thông số, chữ cài đặt chung, phím tắt, mẫu tem** đi như gửi giá (`ghiHoacLui`, rút từ `guiPlu`): khối đổi (`DWL TMS` /
  `TMT` / `SCP`, hay `DWL LAB` chỉ mẫu tem đang dùng — `dongMauTemDangDung`) qua cổng hai chiều + hàng rào; không nối được thì
  lui về 33571 (file nhỏ như trước; tem: cả file). Xong **đọc lại đúng phần đó** (`docLaiCaiDat`, so bằng `lechCaiDat`):
  - khớp → ghi nhận, khung xanh "Cân đã nhận …";
  - lệch → **không ghi nhận gì**, khung đỏ nêu đúng thông số / chữ / phím / ô tem chưa đổi. Trước 2.7 gửi qua 33571 là ghi
    nhận luôn: cân bỏ qua thì file gốc lệch cân, lần sửa sau báo "chưa có gì thay đổi";
  - không đọc lại được → ghi nhận như trước, khung vàng "chưa kiểm được" (`xacNhan: false`, `cauXacNhan`).
- **Gửi qua 33571 không bao giờ mang cài đặt mạng** (`boDongMang`, ở `guiDenCan`): bỏ TMS 43–53, 150–173, 430–441 và
  TMT 15, 16, 19. Giá trị y như cân đang có cũng có thể làm mạng cân khởi động lại giữa lúc nhận (thông số 45 = 1). File gốc và
  file USB vẫn giữ các dòng đó.
- **Gỡ hàng còn nằm lại bằng ghi đè** (`goHangConLai`, nút "Gỡ khỏi cân qua WiFi (ghi đè)"): cân không có lệnh xoá một hàng,
  nhưng ghi theo số PLU — mỗi số còn nằm lại nhận một **dòng trống** mã `99999`, giá 0, "KHÔNG DÙNG (PLU trống)", không in
  HSD (`dongPluRieng`, `MA_CAN_TRONG` trong `web/src/lib/kho/can-tma.ts`); phím tắt gọi số đó được bỏ (`SCP … 0`). Chạy đúng
  kế hoạch đã xem (`dauVan`), chỉ với cân đã biết mã máy (như xoá hẳn), chỉ qua cổng hai chiều. **Đọc PLU trên cân trước**:
  số nào giờ là hàng khác (thêm trên bàn phím, phần mềm hãng) → không gửi gì; số đã là dòng trống / cân không còn → không
  ghi số đó. Gửi xong đọc lại PLU (và SCP) để kiểm. Không lúc nào cân thiếu hàng. Dòng trống
  không phải hàng: không "còn nằm lại", thẻ Tất cả hàng ghi "PLU trống", hàng mới dùng lại số đó (bộ lập danh sách cấp số
  trống nhỏ nhất). Kho không được dùng mã `99999` / `99998` (`MA_CAN_DANH_RIENG` — món mang mã đó "không đưa lên cân").
- **Xoá hẳn hỏng giữa chừng thì tự phục hồi** (`phucHoiSauXoa`): sau `CLR PLU`, đọc lại lệch / đứt / hết giờ → gửi lại ngay cả
  danh sách của kế hoạch (`DWL PLU`, không `CLR`), đọc lại; chưa đủ thì chờ 3 rồi 8 giây làm lại. Đủ → ghi nhận đúng thứ cân
  đang có (đọc lại), không dấu "chưa rõ". Chỉ khi hết lượt mới ghi dấu và báo "nạp USB ngay".
- **Chẩn đoán WiFi** (`chanDoanWifi`, đầu thẻ Cân & thông số): các phép thử an toàn của `CAN-TMA.md` §13, mỗi bước Đạt / Hỏng /
  Bỏ qua + kết luận, lưu `Tài liệu\Beeftown Can\chan-doan\chan-doan-<ngày giờ>.txt` (không có tên / mật khẩu WiFi — không đọc
  TMT). Mặc định **chỉ đọc**: bắt tay, giờ cân, danh sách hàng so với chương trình. **"Thử cả ghi"** (ngoài giờ bán): ghi lại y
  hệt một hàng; thêm / sửa hàng thử PLU 9999 (mã `99998`); gửi file nhỏ chỉ có hàng thử qua 33571 rồi đọc lại qua cổng hai
  chiều (cổng 33571 còn nhận không); gỡ hàng thử (PLU 9999 thành dòng trống). PLU 9999 có hàng thật thì bỏ qua các bước ghi thử.

**Thử ở quán (2.7)** — ngoài giờ bán, có người ở cân, đã đóng TM-xA, có USB lưu sẵn dữ liệu cân:
1. Cân & thông số → **Chẩn đoán WiFi** (chỉ đọc) → 3 bước Đạt.
2. Tích **Thử cả ghi** → Chẩn đoán lại. Gửi file `chan-doan-….txt` cho người sửa chương trình, dù kết quả thế nào.
3. Kết luận "Cân NHẬN ghi": sửa giá một món ít bán trong kho → Gửi xuống cân → khung xanh; gọi PLU trên cân thấy giá mới. Đổi
   **Ghi chú cân 1** → khung xanh; in thử một tem có ô đó. Gán một phím tắt → khung xanh; bấm thử phím.
4. Có hàng còn nằm lại: **Gỡ khỏi cân qua WiFi (ghi đè)** → khung xanh; gọi số PLU đó ra "KHÔNG DÙNG (PLU trống)", giá 0.
5. Kết luận "Cân CHƯA nhận ghi" / "cổng hai chiều không trả lời": dùng USB như trước, gửi file kết quả.

## Bản 2.6.1 — gửi qua cổng hai chiều; nút Cập nhật chạy thử trước

**Thấy ở quán chiều 03/10/2026, với bản 2.6.0:**
- Đọc cân qua cổng hai chiều 33581 chạy được trên cân thật.
- Cân **bỏ qua mọi lần gửi qua cổng 33571**: lần đầu cả 69 hàng mới, lần sau chỉ sửa giá 4 dòng (Brisket 580.000 → 590.000
  đ). Bản 2.6.0 đọc lại thấy lệch nên báo đỏ đúng 4 dòng đó.
- Nạp USB thì cân nhận đủ.

Vì sao cân bỏ qua 33571 (ngày 26/09 cổng này còn nhận hàng thử "THU WIFI") thì chưa biết.

Từ 2.6.1, `guiPlu` (nút **Gửi xuống cân** và tự gửi) ghi khối `DWL PLU` qua cổng hai chiều, như phần mềm của hãng:
- Chờ hàng rào `UPL TIM` (`giao-thuc.ts` `ghi`) rồi đọc lại để kiểm như 2.6.
- Chỉ gửi các dòng **thêm / sửa**. Gửi **cả danh sách** khi còn dấu "chưa rõ" / "chưa xác nhận", hay khi không có gì đổi
  (người bấm Gửi để gửi lại và kiểm).
- Không có lệnh xoá (`CLR`): cân chỉ thêm / sửa theo số PLU.
- Cổng hai chiều hỏng (không nối, hết giờ, bảng mã khác…) → gửi cả file qua 33571 như trước. Câu báo lệch nói rõ đã
  phải đi đường này.
- Cân ở địa chỉ đó **khác mã máy** chương trình nhớ → không gửi gì (`LoiKhacMay`), vì có thể là cân thứ hai.
- Ghi qua cổng hai chiều **chưa thử trên cân thật**: lần gửi đầu ở quán là lần thử.

**Nút Cập nhật** (2.5 → 2.6 ở quán: bản mới không trả lời trong 90 giây nên tự quay về; mở tay thì được):
- Tải và kiểm xong thì **chạy thử** bản mới một lần, lúc bản cũ còn chạy (`chayThuBanMoi`):
  - Bản mới (từ 2.6.1) thấy biến `BEEFTOWN_CAN_THU_CHAY` thì chỉ ghi phiên bản vào `BeeftownCan.chay-thu.json` rồi thoát.
  - Chạy thử bị chặn hay quá 3 phút → báo ngay, **chưa đổi gì**, file mới để ở `.loi.exe`.
  - Chạy thử được thì phần mềm diệt virus đã quét xong file, nên lần mở thật sau đó nhanh.
- Chờ bản mới trả lời **3 phút** (trước: 90 giây).
- Lý do không mở được ghi vào `%APPDATA%\BeeftownCan\loi.txt`: tiến trình còn chạy hay đã tắt, chạy thử mất bao lâu.

Chạy thử chỉ có từ lần cập nhật **sau** 2.6.1. Lần cập nhật 2.6.0 → 2.6.1 vẫn do bản 2.6.0 làm theo cách cũ (90 giây): không
được thì cài tay.

**Thử ở quán (2.6.1):**
1. Đọc dữ liệu từ cân qua WiFi → đúng số hàng.
2. Sửa giá một món trong kho → Gửi xuống cân → khung xanh "Cân đã nhận. Vừa gửi 1 hàng qua cổng hai chiều…". Gọi PLU trên
   cân: đúng giá mới.
3. Khung đỏ "cân CHƯA nhận … (cổng hai chiều)": cân cũng bỏ qua ghi qua cổng hai chiều. Chụp câu báo, nạp USB.

## Bản 2.6 — gửi xong đọc lại cân để kiểm

**Lỗi thấy ở quán (02–03/10/2026):** chương trình ghi "Giữ nguyên" / "Khớp kho 69" cho 69 hàng kho, nhưng cân thật (lưu ra
USB) chỉ có 7 hàng cũ. Gọi PLU 12 trên cân thì cân kêu tít tít rồi về 0, vì cân không có hàng đó. Nguyên nhân: gửi qua cổng
33571 thì cân không trả lời gì. Bản cũ (`guiTcp`) gửi hết byte là coi như xong, rồi ghi luôn file gốc và `tren-can.tsv`.
Vì sao lần gửi trước cân không nhận thì chưa biết (cân ở menu, gửi nhầm địa chỉ…).

Từ 2.6, mỗi lần gửi danh sách hàng (nút **Gửi xuống cân** và tự gửi), `guiKeHoach` gọi `xacNhanSauGui`. Hàm này đọc danh
sách PLU qua cổng hai chiều ở đúng địa chỉ vừa gửi (không dò WiFi), rồi so số PLU, mã cân, giá, HSD và tên
(`soPluVuaGui`). HSD phải so vì tự gửi mỗi đêm có khi chỉ đổi số ngày HSD. Lần đầu chưa khớp, hay chưa đọc được, thì chờ
3 giây rồi 5 giây và đọc lại, vì cân có thể còn đang lưu.

| Đọc lại | Chương trình làm gì | Trang báo |
|---|---|---|
| Khớp | Ghi nhận như cũ, xoá dấu | Khung xanh "Cân đã nhận." |
| Lệch: cân thiếu, hay khác mã / giá | **Không ghi nhận gì.** Ghi dấu `lech` vào `chua-xac-nhan.json`, tự gửi tạm dừng | Khung đỏ nêu tối đa 5 PLU ("PLU 1 trên cân vẫn là … 845.000 đ (gửi … 780.000 đ)") |
| Không đọc được: cổng đóng, đứt giữa chừng, trả rỗng, cân khác mã máy (2.6.1: khác mã máy thì không gửi gì cả) | Ghi nhận như trước 2.6, kèm dấu `khong-doc` — **từ 2.9.2 không ghi nhận gì**, tự gửi thử lại có lùi giờ (mục "Bản 2.9.2") | Khung vàng "chưa kiểm được cân đã nhận chưa"; nhãn "Giữ nguyên (chưa xác nhận)", "Khớp kho, chưa xác nhận" |

Dấu hết khi một lần gửi đọc lại khớp, khi ghi nhận file từ cân (USB hay đọc qua WiFi), hoặc khi xoá qua WiFi đọc lại khớp.
Chữ có dấu qua cổng hai chiều chưa thử trên cân thật. Nếu lần thử đầu báo lệch chỉ vì tên (khung đỏ cho thấy tên đọc
về bị vỡ chữ), thì phải xem lại bảng mã.

Gửi tem, thông số, chữ chung, phím qua 33571 chưa đọc lại. Trang vẫn nói "đã gửi — chưa thử trên cân thật".

**Thử ở quán:**
1. Cân ở màn hình bán hàng → Gửi xuống cân → phải ra khung xanh "Cân đã nhận".
2. Gọi thử 2–3 PLU vừa gửi: đúng giá.
3. Để cân trong menu `Prog` rồi gửi: xem cân có bỏ qua không. Nếu bỏ qua thì phải ra khung đỏ, và bảng vẫn "Thêm" / "Sửa".
4. Tắt cân rồi gửi: lỗi nối cân, không ghi nhận gì.

## Bản 2.5 — tự cập nhật

Mỗi lần mở, chương trình hỏi kho **công khai** `volekhanh123/beeftown-can-ban-cai` (chỉ chứa file cài — mã nguồn vẫn ở
repo riêng này) có bản mới hơn không; có thì đầu trang hiện nút vàng **"Có bản mới x.y.z — Cập nhật"** (cũng ở Cài đặt →
Phiên bản). Bấm → tải `BeeftownCan.exe` về cạnh file đang chạy → kiểm → đổi file → tự mở lại. Mã: `src/cap-nhat.ts`.

- **Kiểm gì trước khi thay:** phiếu `phien-ban.json` (`dang: 1`, phiên bản, SHA-256, cỡ) do CI tạo từ đúng file đã phát
  hành; chỉ nhận phiên bản MỚI HƠN (không bao giờ hạ); đường tải dựng từ khuôn cố định (không dùng đường nào ghi trong
  phiếu); file tải về phải đúng cỡ, đúng SHA-256, là file chạy Windows 64-bit giao diện (như CI kiểm). Sai một điều → xoá
  file tải, "Chưa đổi gì".
- **Đổi file:** Windows cho đổi tên file đang chạy (không cho ghi đè): `BeeftownCan.exe` → `BeeftownCan.cu.exe`, file mới
  vào chỗ. Việc đang ghi xuống cân (hàng đợi) chạy xong trước. Thư mục không ghi được (Program Files, USB chỉ đọc) → báo
  trước khi tải.
- **Khởi động lại:** dừng máy chủ, xoá `dang-chay.json` (còn trỏ tới máy chủ cũ thì bản mới tưởng "đang có bản chạy" rồi
  thoát), mở bản mới qua PowerShell bằng `[Diagnostics.Process]::Start` (tách khỏi chương trình cũ; không dùng `Start-Process`
  vì nó hỏng với thư mục tên có `[ ]`; đường dẫn chỉ đi qua biến môi trường), **chờ bản mới trả lời** (ghi
  `dang-chay.json` với phiên bản mới). 90 giây không trả lời → tắt nó, bản mới thành `BeeftownCan.loi.exe`, bản cũ về chỗ,
  mở lại bản cũ với dòng đỏ. Trang mới báo "Đã cập nhật lên x (trước là y)".
- **Quay về bằng tay:** đóng chương trình → đổi `BeeftownCan.exe` thành `BeeftownCan.moi.exe` → đổi `BeeftownCan.cu.exe`
  thành `BeeftownCan.exe` → mở. Chỉ giữ một bản cũ (lần cập nhật sau thay nó).
- **Ai bấm được:** mọi vai (máy quầy thường chỉ NV quầy đăng nhập) — chỉ cài bản chính thức, không đụng dữ liệu.
- **Không ký số:** token đưa file lên kho công khai và khoá ký (nếu có) đều nằm trong Secrets của GitHub — lộ một là lộ cả
  hai, chữ ký không thêm được gì. Giữ an toàn bằng: token fine-grained chỉ ghi được kho công khai, chỉ ở một bước của job
  `phat-hanh` (không ở job chạy mã PR), hạn 1 năm; bật email báo mỗi Release của kho công khai (Watch → Releases). Bản lỗi
  đã phát hành: xoá Release đó (hoặc đánh dấu pre-release) ở kho công khai — "mới nhất" lùi về bản trước.
- **Đường đi của bản cài:** `dong-goi-can.yml` job `phat-hanh`, bước "Bản cài công khai…": lấy `.exe` từ Release riêng,
  kiểm PE, tạo `phien-ban.json`, tạo Release nháp ở kho công khai rồi công bố (`--latest`, trừ khi đang chạy bù bản cũ).
  Chưa có secret → cảnh báo ở Summary, Release riêng vẫn đủ. Thêm secret muộn: Actions → Đóng gói Beeftown Cân → Run
  workflow trên main để đưa bù phiên bản hiện tại.

**Việc làm một lần (chủ repo):**
1. Tạo kho công khai `volekhanh123/beeftown-can-ban-cai` (có README, không mã nguồn).
2. GitHub → Settings → Developer settings → Fine-grained tokens → token mới: chỉ kho `beeftown-can-ban-cai`, quyền
   **Contents: Read and write**, hạn 1 năm (đặt lịch gia hạn).
3. Repo `beeftown-stock` → Settings → Secrets and variables → Actions → New repository secret `TOKEN_BAN_CAI_CAN` = token.
4. Gộp PR có `PHIEN_BAN` mới → Summary của lượt "Đóng gói Beeftown Cân" có dòng "Đã đưa bản cài … lên …".
5. Cài 2.5.0 bằng tay một lần ở mỗi máy quầy, để ở Desktop (không Program Files).

**Thử trên Windows thật** (CI không thử được: đổi tên file đang chạy, tiến trình mới sống sót, Defender): trước khi gộp
dùng kho giả `test/may-cap-nhat-gia.ts` (xem đầu file) + biến `BEEFTOWN_CAN_NGUON_CAP_NHAT` (chỉ nhận 127.0.0.1) để thử
tải, kiểm, đổi file và tự quay về; sau khi gộp thử trọn vòng 2.5.0 → 2.5.1 trên máy của chủ trước khi báo quầy. Kiểm:
bản mới còn sống sau 2 phút, chỉ một tiến trình BeeftownCan; cửa sổ cũ tự đóng; đường dẫn có dấu, dấu cách; rút mạng giữa
chừng → "Chưa đổi gì"; đang gửi xuống cân thì cập nhật chờ.

## Bản 2.4 — chữ cài đặt chung (TMT)

Thẻ Cân & thông số, **mục 6**: sửa các dòng chữ lưu trong cân (phần `TMT` của file .TMS, "Global Text" / `Prog → 1 → 3`
trên cân) — tên quán, tên cân, chữ trước / sau số tiền, Ghi chú cân 1–8 (in trên tem khi mẫu tem có ô đó; thẻ Mẫu tem
thêm được ô "Ghi chú cân 1–8"), chữ tuỳ ý 1–8 (màn hình lúc chờ). Chữ dự phòng 12, 13, 17, 18 và dấu ngành hàng 14 chỉ xem.

- **Tên WiFi, mật khẩu WiFi, tên miền (TMT 15, 16, 19) không bao giờ đọc ra trang, không bao giờ ghi**: `docChuChung` bỏ
  qua, `kiemChuChung` từ chối (kể cả viết "016"), `fileNho` từ chối dòng đó. Dòng của chúng trong file gốc giữ y nguyên byte.
- Chữ ghi dạng UTF-8 như tên hàng; tab / xuống dòng thành dấu cách, bỏ ký tự điều khiển, NFC; tối đa 40 ký tự (chữ trước /
  sau số tiền, dấu ngành hàng: 8); biểu tượng cảm xúc bị từ chối. Tên quán, tên cân không để trống.
- Gửi như thông số: sửa đúng dòng trong file gốc, file nhỏ chỉ có khối `TMT` đổi qua 33571, gửi xong mới thay file gốc;
  cân không trả lời → trang nói "đã gửi", chỉ cách kiểm (in thử một tem có ô chữ đó) và nút **Lưu file nạp USB** (file mang
  cả chữ và thông số đang sửa). **Chưa thử trên cân thật**: cân có nhận khối `TMT` gửi riêng qua 33571, cân chứa được bao
  nhiêu ký tự, phông của cân in được chữ có dấu ở các ô này.
- Quyền như thông số (`kiemQuyenCan`). Đường API: `/api/chu-chung`, `/api/chu-chung/gui`, `/api/tao-usb-goc` (`chuChung`).

Thử ở quán (sau bước 6 ở trên): đổi **Ghi chú cân 1** thành số điện thoại của quán, gửi; thẻ Mẫu tem → thêm ô
"Ghi chú cân 1" vào một mẫu tem thử (không phải mẫu 28 đang bán), in thử — dòng chữ đúng, có dấu. Tên quán: gửi rồi bấm
**Đọc thông tin cân** (mục 1) — "Tên quán trên cân" đổi theo.

## Cân đổi địa chỉ — chương trình tự tìm cân (từ 2.1.0)

Router tự phát địa chỉ cho cân, nên sau khi cân hay router khởi động lại cân có thể mang địa chỉ khác
(192.168.1.22 → 192.168.1.37…). Chương trình tự xử lý (`src/tim-can.ts`):

- Nối cân không được (lúc mở chương trình, bấm **Kiểm tra kết nối**, **Gửi xuống cân**, **Gửi tem**, tự gửi) →
  **dò WiFi tìm cân**: thử nối cổng 33571 ở mọi địa chỉ trong mạng của máy tính — trong WiFi của quán chỉ cân mở
  cổng này. Mỗi địa chỉ chỉ mở rồi đóng kết nối, không gửi gì. Dải /24 (254 địa chỉ) mất chừng 4 giây.
- Thấy **đúng một cân** → dùng địa chỉ mới, lưu vào Cài đặt, gửi lại; trang báo "Cân đã đổi địa chỉ (cũ → mới)".
- **Chắc là đúng cân**: chương trình nhớ mã máy (MAC) của cân lần đầu nối được (bảng ARP của Windows,
  `arp -a`). Máy vừa thấy khác mã máy (quán có cân thứ hai, vừa thay cân) → không tự chuyển, không gửi danh mục
  sang; trang hiện nút "Dùng cân …". Chọn cân khác bằng tay thì chương trình quên mã cũ, nhớ mã cân mới.
  Không đọc được mã máy thì vẫn tự theo (không biết thì không chặn).
- Thấy **nhiều cân** → không tự chọn: trang hiện nút "Dùng cân …" từng địa chỉ (xem trên cân: `Prog → 4 → 2`).
- Không thấy cân → báo đã dò bao nhiêu địa chỉ, và các việc cần xem (cân bật chưa, cùng WiFi không…).
- Gửi hỏng giữa chừng (đã nối được) thì không tự gửi lại — người bấm quyết.
- Tự gửi mỗi phút: vừa dò mà không thấy cân (tối, cân tắt) thì 5 phút sau mới dò lại; lần dò trước thấy cân
  mà cân lại đổi địa chỉ thì dò ngay.
- Việc ghi xuống cân (tự gửi, bấm Gửi, gửi tem, gửi thử qua dây) chạy **lần lượt**, không chồng nhau; việc sau
  lập kế hoạch từ file gốc việc trước vừa ghi.
- Đang dò mà người gõ địa chỉ khác ở Cài đặt → kiểm lại theo địa chỉ mới, không tự đổi đè lên. Ô địa chỉ ở
  Cài đặt chỉ gửi khi người gõ vào đó, nên lưu cài đặt khác không đè địa chỉ chương trình vừa tự tìm ra; ô Cân
  tự làm mới mỗi phút.
- Nút **Tìm cân trong WiFi** (Cài đặt) dò bất cứ lúc nào. Mạng lớn hơn /22 chỉ dò dải /24 quanh máy tính và quanh
  địa chỉ cũ của cân.

Chương trình nhớ 10 lần đổi gần nhất (`cau-hinh.json`, `doiDiaChi`); cân đổi từ 2 lần trong 30 ngày thì ô Cân
nhắc **giữ cố định địa chỉ cho cân trong router** (DHCP Reservation / Static Lease / Address Binding) — cách chắc
nhất, làm một lần là xong.

Không nghe tiếng cân tự phát mỗi ~15 giây (UDP 33584): mở cổng nghe thì Windows hiện hộp hỏi tường lửa với nhân
viên quầy. Dò bằng kết nối ra ngoài thì không.

## Dây RS232 (thử, từ 2.1.0; làm như phần mềm hãng từ 2.3.0)

Mới chắc cân nhận danh mục qua **USB** và **WiFi**. Qua dây RS232 thì **chưa thử trên cân thật**. Cân của quán có menu
`Prog → 4 → 3` (P43 RS-232), tức có cổng RS232. Thẻ Cài đặt có phần thử (`src/day-rs232.ts`): mở cổng COM bằng
PowerShell có sẵn trong Windows, cài **đúng như phần mềm TM-xA của hãng**: 8 bit, không chẵn lẻ, 1 bit dừng, điều
khiển luồng **XOn/XOff**, không bật DTR / RTS. Chi tiết: `CAN-TMA.md` mục 10.6.

1. Cắm dây từ máy tính vào cổng RS232 của cân (dây USB–RS232 hiện thành COM3, COM4…; cần driver CH340 / PL2303 /
   FTDI — Windows thường tự cài). **Cài đặt → Tìm cổng COM** → chọn cổng. Tốc độ phải khớp **thông số 41** của cân
   (mặc định 9600); file gốc có thông số 41 thì trang ghi "Cân đang để …" và chọn sẵn tốc độ đó.
2. **Trên cân bấm `Prog → 4 → 3`** và để cân ở màn hình đó — cân chỉ nghe dây khi đang ở đây (sách hướng dẫn V3.04A,
   mục 5.6.3). Mỗi lần dùng dây đều phải vào lại.
3. **Kiểm tra dây**: hỏi giờ cân qua dây (`UPL TIM`, như hãng bắt tay). Cân trả lời giờ = dây, cổng, tốc độ, màn hình
   P43 đều đúng. Không trả lời trong 5 giây: trang chỉ lần lượt P43, thông số 41 (`Prog → 1 → 2`, SP.041: 5 = 9600),
   rồi đầu chuyển null-modem (sách của hãng không ghi dây thẳng hay dây chéo). Nghe thấy chữ lộn xộn: có lẽ sai tốc độ.
4. **Gửi thử qua dây** (quản lý, chủ; lúc kho có thay đổi chưa lên cân): bắt tay như trên (cân không trả lời thì
   **không gửi gì**), một dòng trống, rồi đúng nội dung như gửi WiFi (giữ cả hàng ngoài kho). Gửi xong hỏi giờ thêm một
   lần: cân trả lời = cân đã đọc hết (hãng không làm bước này; chương trình làm như hàng rào của đường mạng). Rồi trang
   chỉ một hàng để gọi thử trên cân — ưu tiên hàng đổi giá; chỉ có hàng đổi tên (tảng) thì in thử một tem xem tên.
   Chương trình **không ghi nhận** lần gửi thử — lần gửi WiFi sau vẫn gửi lại.

9600 bit/giây là khoảng 1 KB mỗi giây: file cân 100 KB mất gần 2 phút. Dây chỉ nên là **đường dự phòng** khi WiFi
hỏng. Cân nhận qua dây thì làm tiếp: chọn dây hay WiFi ở Cài đặt; qua dây đọc lại dữ liệu và nhật ký bán (hãng có
`UPL` qua dây như qua mạng).

- PowerShell chỉ làm đường ống theo kịch bản (ghi byte, ghi file, đọc dòng tới `END` sau dòng `TIM`); trình tự và cách
  đọc kết quả nằm trong TypeScript, kiểm thử bằng PowerShell giả đóng vai cân (`test/thu.ts` mục 6c). Đoạn lệnh
  PowerShell mới **chưa chạy** trên Windows PowerShell 5.1 và dây thật.

## Điều đã thử trên cân thật (26/09/2026, TM-xA V3.14E8)

- Cân nhận ở **cổng TCP 33571**, nội dung y như file USB `A_000.TMS`; gửi xong đóng chiều gửi, cân không trả lời.
- **Qua WiFi cân chỉ thêm và sửa hàng, không xoá.** Nạp USB thì cân thay cả danh sách.
  → Chương trình nhớ các hàng đang nằm trên cân (`Tài liệu\Beeftown Can\tren-can.tsv`). Hàng đã bỏ khỏi kho mà còn trên cân được báo đỏ, kèm nút **Lưu file để nạp USB** và **Tôi đã nạp USB xong**.

- **Chưa thử trên cân thật:** đổi mẫu tem qua WiFi. Cân nhận chắc chắn khi nạp USB (thay cả file); qua WiFi cân có nhận phần LAB hay không thì phải in thử một tem để biết.
- **Chưa thử trên cân thật:** mọi việc của bản 2.2 (bảng ở mục "Bản 2.2").
- **Thấy 02–03/10/2026:** chương trình ghi nhận đã gửi 69 hàng kho, cân thật chỉ có 7 hàng cũ. "Gửi hết byte qua 33571"
  không có nghĩa là cân đã lưu. Từ 2.6 chương trình đọc lại cân để kiểm (mục "Bản 2.6").

## Menu `Prog` trên cân (chép từ cân thật 29/09/2026, TM-xA V3.14E8)

Bấm `Prog`, đi bằng `↓ V3` / `↑ V1` hoặc bấm thẳng số mục (`Prog → 4 → 2`), `Accu/Confirm` để vào, `Sale` để về màn bán hàng.

| Mục | Mục con |
|---|---|
| P1 Parameter | 1 Time · 2 Spec · 3 String · 4 Shortcut of PLU · 5 Shortcut of Func |
| P2 Database | 1 Dept · 2 Class · 3 PLU · 5 Barcode · 6 Print Format · 7 Salesman |
| P3 Data Asst | có Delete — **không vào**; cân hỏi mã 9958 là sắp xoá dữ liệu: bấm `Cancel` |
| P4 Communication | USB: `Accu/Confirm` hai lần là nạp file, thêm `Amend` là lưu ra USB · mục 2: địa chỉ cân trong mạng |
| P5 Hardware Asst | **không vào** |

- Sửa một hàng ngay trên cân: `Prog → 2 → 3` (P2 Database › PLU).
- P2 **không có mục 4**. Thứ tự P2 trùng thứ tự các phần trong file .TMS (DPT, CLS, PLU, **UNT**, BAR, LAB, SAL),
  nên mục 4 nhiều khả năng là **Unit** (đơn vị tính) mà cân ẩn đi — sổ tay TM-xA ghi cân ẩn bớt phần sửa đơn vị.
  Chưa kiểm trên cân.

## Mẫu tem trong file .TMS (`src/tem.ts`)

- Phần `LAB`: mỗi mẫu tem là một dòng `LAB`, các dòng `LAS` (mỗi dòng một ô in), rồi `LAE`. Phần `TMS` dòng số 0 cho biết cân đang dùng mẫu số mấy.
- Dòng `LAB`: cột 1 số mẫu · 2 tên · 4–5 rộng × cao (mm) · từ cột 6 là chữ cố định (cột 22 là cờ).
- Dòng `LAS`: cột 1 số thứ tự ô (0–99) · 2 loại ô (0 mã vạch · 1 dữ liệu hàng · 2 thông tin lúc in · 3 chữ cố định · 5 phân vùng…) · 3–4 ô nào · 5 điều kiện in · 6 xoay · 7 canh chữ (4 bit thấp; bit cao giữ nguyên) · 8 cỡ chữ (0–9) · 9–12 vị trí và khung (chấm, 8 chấm/mm). Bản 2.1 đọc nhầm cột 7 là cỡ chữ.
- **Tắt ô** = bỏ dòng `LAS`; dòng bỏ được nhớ trong `Tài liệu\Beeftown Can\tem-da-tat.json` để **bật lại** đúng chỗ. Dòng không sửa giữ y nguyên từng byte.
- **Sửa ô** (2.2) chỉ đổi đúng cột có giá trị mới; **thêm ô** lấy số thứ tự lớn nhất + 1 (tối đa 99, tối đa 100 ô), ô chữ mới
  lấy ô chữ trống đầu tiên của dòng `LAB`. Ô ra ngoài mép tem chỉ cảnh báo. Mẫu tem có ô Phân vùng thì chỉ sửa chữ và tắt / bật.

## Cách chạy bên trong

```
BeeftownCan.exe ── máy chủ nhỏ 127.0.0.1:<cổng ngẫu nhiên>/?t=<mã bí mật>
      │                (src/main.ts, src/may-chu.ts; giao diện src/giao-dien.html)
      ├─ mở cửa sổ Edge dạng ứng dụng trỏ vào đó; đóng cửa sổ → chương trình tắt
      ├─ kho: https://beeftown.vn/kho-can.json → địa chỉ Supabase + khóa anon (công khai theo thiết kế)
      │        đăng nhập Supabase Auth; phiên lưu ở %APPDATA%\BeeftownCan\phien.json
      │        mọi vai kho (xem); gửi cân / tem / mã giảm cần danh_muc, báo cáo cần xem_gia
      │        máy quầy: kho_bang_quay, kho_can_o_ma, kho_bao_cao_ban_gio, kho_luu_ma_giam… (src/quay.ts)
      ├─ cân, đường chính (2.6.1 giá; 2.7 thông số, chữ, phím, tem, gỡ hàng): TCP <IP cân>:33581 hai chiều
      │        (src/giao-thuc.ts) — ghi khối DWL + hàng rào, rồi đọc lại phần đó để kiểm (nghiep-vu.ts ghiHoacLui,
      │        docLaiCaiDat / xacNhanSauGui); cũng: thông tin, giờ, đọc dữ liệu, nhật ký, xoá / gỡ PLU, chẩn đoán WiFi.
      │        Mỗi việc một kết nối. Đọc đã chạy trên cân thật (03/10/2026); ghi chưa thử
      ├─ cân, đường lui: TCP <IP cân>:33571 một chiều (guiDenCan → guiTcp) khi cổng hai chiều không nối được —
      │        cả file (giá, tem) hay file nhỏ (thông số, chữ, phím, giờ — thong-so.ts fileNho); 2.7: bỏ dòng mạng
      │        (boDongMang). Nối không được → dò WiFi tìm cân (src/tim-can.ts), thấy một cân thì gửi lại ở đó
      ├─ nhật ký bán: src/bao-cao-can.ts → Tài liệu\Beeftown Can\nhat-ky-can.tsv
      ├─ GET /huong-dan: src/huong-dan.html (cũng cần mã bí mật ?t=)
      └─ dây RS232 (thử): PowerShell System.IO.Ports.SerialPort (src/day-rs232.ts)
```

Bun tự cắt yêu cầu tới máy chủ nhỏ sau 10 giây; `may-chu.ts` tắt giới hạn đó (`timeout(req, 0)`) vì gửi qua dây,
dò WiFi hay kho chậm có thể lâu hơn.

| Nơi | Có gì |
|---|---|
| `%APPDATA%\BeeftownCan\` | `cau-hinh.json` (IP cân, cổng, cổng hai chiều `congHaiChieu`, địa chỉ kho, các lần cân đổi địa chỉ, cổng COM lần thử trước; 2.8: `giuKetNoi`, `tuDatGio`, `ngheUdp`), `phien.json` (đăng nhập), `loi.txt` (lỗi), `tu-dat-gio.json` (2.8: các lần tự chỉnh giờ cân trong ngày), `ma-may.txt` (2.9: mã máy quầy báo kho), `nhat-ky-da-gui.json` (2.9: mốc nhật ký tem đã gửi kho, theo chi nhánh) |
| `Tài liệu\Beeftown Can\` | `A_000.TMS` (file gốc = bản gần nhất cân đã xác nhận), `tren-can.tsv` (2.7: dòng mã `99999` là PLU trống — đã gỡ bằng ghi đè; 2.9.2: chỉ hàng cân đã xác nhận), `cho-xac-nhan.tsv` + `chua-xac-nhan.json` (2.9.2: lần gửi cân chưa xác nhận, giờ tự thử lại), `tem-da-tat.json`, `nhat-ky-can.tsv` (nhật ký bán của cân, TSV UTF-8 có tiêu đề; có dòng không đọc được thì giữ bản sao `nhat-ky-can-ban-sao-….tsv` trước khi ghi đè), `da-gui\` (mỗi lần gửi một bản; thông số / phím / giờ: đúng file nhỏ đã gửi), `cho-usb\`, `chan-doan\` (2.7: kết quả Chẩn đoán WiFi) |

Thư mục `Tài liệu\Beeftown Can` dùng chung với `web/public/kho/can-wifi/Nap-Can-WiFi.ps1`.
**File .TMS có tên và mật khẩu WiFi của quán** — chỉ nằm trên máy này và gửi tới cân, không lên kho, không commit.

Máy chủ chỉ nghe `127.0.0.1` và mọi yêu cầu phải mang đúng mã bí mật (`?t=`), nên trang web lạ mở trên cùng máy không gọi được.

## Phát triển

```bash
cd can-app && npm ci
npx bun test/thu.ts              # cân giả, kho giả (test/kho-gia.ts), tem, danh sách hàng, tự gửi, máy quầy,
                                 # cân đổi địa chỉ (cân giả ở 127.0.0.37, .38…), dây RS232 (PowerShell giả),
                                 # 2.2: cân giả hai chiều (test/can-gia-hai-chieu.ts) + cân giả 33571 — nhật ký, xoá qua WiFi,
                                 # thông số, giờ, phím, sửa tem, quyền, /huong-dan; rồi kiểm thử từng module
                                 # (thu-giao-thuc, thu-tem, thu-bao-cao-can, thu-thong-so — mỗi file cũng chạy riêng được);
                                 # cuối cùng chạy src/main.ts thật với BEEFTOWN_CAN_DU_LIEU trỏ vào thư mục tạm
npx bun test/xem-giao-dien.ts    # mở giao diện với dữ liệu giả để xem / chụp màn hình (--vai nhan_vien_quay để xem như NV quầy;
                                 # --can-doi-dia-chi: lúc mở tự dò ra cân; --hai-can: WiFi có hai cân, hiện nút chọn;
                                 # --chua-co-goc: chưa có file gốc). Có cân giả hai chiều, nhật ký 7 ngày, thông số, phím, HSD.
npx bun scripts/dong-goi.ts      # ra dist/BeeftownCan.exe (~87 MB), đóng gói được từ Linux
```

- Cần bản web có `/kho-can.json` (`web/src/pages/kho-can.json.ts`) đã triển khai.
- Đóng gói trên Linux thì file .exe chưa có biểu tượng riêng (Bun chỉ gắn biểu tượng khi đóng gói trên Windows).
- `dist/` và `node_modules/` không vào repo. File .exe quá lớn để để trong repo hoặc trên web (Cloudflare giới hạn 25 MB một file) — GitHub đóng gói và giữ nó (mục **Tải BeeftownCan.exe về** ở trên).
- `.github/workflows/dong-goi-can.yml`: main đổi `can-app/` hoặc `web/src/lib/` (.exe gói cả mã dùng chung ở đó) →
  `npx bun test/thu.ts` → đóng gói → artifact `BeeftownCan-<PHIEN_BAN>`, xoá artifact chính thức cũ; phiên bản chưa có
  Release thì tạo Release, tag `can-v<PHIEN_BAN>`. PR đụng cùng những chỗ đó chỉ đóng gói thử, không tải lên. Chạy tay: gõ số
  PR, hoặc để trống và chọn nhánh ở *Use workflow from* (nhánh đó phải có file workflow này). Muốn Release mới thì tăng
  `PHIEN_BAN` trong `src/main.ts`, giữ đúng dạng `const PHIEN_BAN = '2.1.0';` — workflow đọc dòng này (`test-quy-trinh.mjs` kiểm).

## Chưa làm

- Thử bản 2.7 trên cân thật (mục "Thử ở quán (2.7)") và sửa `CAN-TMA.md` theo file kết quả Chẩn đoán WiFi.
- Thử bản 2.8 trên cân thật (mục "Thử ở quán (2.8)").
- Thử bản 2.9 trên cân thật (mục "Thử ở quán (2.9)"), rồi 2.9.1 (mục "Thử ở quán (2.9.1)"), rồi 2.9.2 (mục "Thử ở quán (2.9.2)").
- Gửi thông số / chữ chung / phím / mẫu tem mà không đọc lại được vẫn ghi nhận vào file gốc (2.7, khung vàng) — chưa tách "đang chờ"
  như gửi giá (2.9.2). Đèn "Beeftown Cân" chưa có câu riêng cho cờ `chua_xac_nhan` (vàng theo lệch kho như trước).
- Tự gửi dừng hẳn sau một lần đọc lại thấy cân CHƯA nhận (cân đang ở menu Prog lúc gửi…) tới khi người bấm Gửi — tên ô mã theo
  tảng không lên cân trong lúc đó. Có thể tự gửi lại cả danh sách sau 10 phút (bấm Gửi cũng chỉ làm vậy): chủ quyết.
- Phím tắt cố định cho từng ô: trang pha lóc mới HIỆN phím; gán phím vẫn bằng tay ở thẻ Phím tắt.
- Tự gửi chưa tự gỡ hàng còn nằm lại (cần người xem trước rồi bấm).
- Mã `99999` / `99998` mới chỉ được chặn ở bộ lập danh sách (món mang mã đó không lên cân); database chưa chặn.
- Thử bản 2.2 trên cân thật (mục "Thử bản 2.2 ở quán") và sửa `CAN-TMA.md` theo kết quả.
- Nhật ký cân: ghi lịch sử bảng PLU (lúc nào số PLU nào mang mã nào) để gắn mã cân cho dòng cũ chắc hơn. (2.9 đưa dòng bán
  mã ô lên kho để đối chiếu phiên lóc; trừ kho vẫn theo iPOS.)
- HSD đếm ngược: tự gửi đang dừng cả loạt khi có một hàng bật / tắt in HSD — có thể gửi phần đếm ngược và giữ riêng hàng
  bật / tắt. Hàng kho không lên được / ngoài kho mà cân đang in HSD: chưa báo riêng.
- Chữ ngoài bảng chữ của cân (ký hiệu đặc biệt) trên tem: chưa biết cân in ra sao.
- Giá từ 1.000.000 đ/kg: ô đơn giá trên cân có 6 chữ số (tối đa 999.999), nên chương trình không gửi món giá cao
  hơn. Hướng đi: món vượt mức gửi theo đơn vị **100g** (giá kho chia 10); kho vẫn giữ giá/kg, FABi không đổi vì mã
  vạch chỉ mang mã món và trọng lượng. Theo phần mềm của hãng, đơn vị 100g là `UnitID 8` ở cột 4 của dòng PLU
  (`CAN-TMA.md`, bảng cột PLU) — chưa thử trên cân thật. Còn phải thử: ô thành tiền có quá 6 chữ số không (gói trên
  999.999 đ có in được tem không), và thông số 188 (số chữ số ô đơn giá, cân quán đang để 6).
