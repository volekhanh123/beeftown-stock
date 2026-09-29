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
      ├─ cân: TCP <IP cân>:33571 (src/nghiep-vu.ts → guiDenCan → guiTcp)
      │        nối không được → dò WiFi tìm cân (src/tim-can.ts), thấy một cân thì gửi lại ở đó
      │        2.2: file nhỏ chỉ có khối TMS / SCP / TIM (src/thong-so.ts fileNho) cũng qua đường này
      ├─ cân, 2.2: TCP <IP cân>:33581 hai chiều (src/giao-thuc.ts) — thông tin, giờ, đọc dữ liệu, nhật ký, xoá PLU
      │        mỗi việc một kết nối; chưa thử trên cân thật
      ├─ nhật ký bán: src/bao-cao-can.ts → Tài liệu\Beeftown Can\nhat-ky-can.tsv
      ├─ GET /huong-dan: src/huong-dan.html (cũng cần mã bí mật ?t=)
      └─ dây RS232 (thử): PowerShell System.IO.Ports.SerialPort (src/day-rs232.ts)
```

Bun tự cắt yêu cầu tới máy chủ nhỏ sau 10 giây; `may-chu.ts` tắt giới hạn đó (`timeout(req, 0)`) vì gửi qua dây,
dò WiFi hay kho chậm có thể lâu hơn.

| Nơi | Có gì |
|---|---|
| `%APPDATA%\BeeftownCan\` | `cau-hinh.json` (IP cân, cổng, cổng hai chiều `congHaiChieu`, địa chỉ kho, các lần cân đổi địa chỉ, cổng COM lần thử trước), `phien.json` (đăng nhập), `loi.txt` (lỗi) |
| `Tài liệu\Beeftown Can\` | `A_000.TMS` (file gốc = bản gần nhất đã nạp vào cân), `tren-can.tsv`, `tem-da-tat.json`, `nhat-ky-can.tsv` (nhật ký bán của cân, TSV UTF-8 có tiêu đề; có dòng không đọc được thì giữ bản sao `nhat-ky-can-ban-sao-….tsv` trước khi ghi đè), `da-gui\` (mỗi lần gửi một bản; thông số / phím / giờ: đúng file nhỏ đã gửi), `cho-usb\` |

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

- Thử bản 2.2 trên cân thật (mục "Thử bản 2.2 ở quán") và sửa `CAN-TMA.md` theo kết quả.
- Nghe cân tự báo qua UDP 33583 / 33584 (mở cổng nghe thì Windows hỏi tường lửa); giữ kết nối 33581 (hãng hỏi `UPL TIM` mỗi 30 giây).
- Nhật ký cân: ghi lịch sử bảng PLU (lúc nào số PLU nào mang mã nào) để gắn mã cân cho dòng cũ chắc hơn; đưa nhật ký lên kho.
- HSD đếm ngược: tự gửi đang dừng cả loạt khi có một hàng bật / tắt in HSD — có thể gửi phần đếm ngược và giữ riêng hàng
  bật / tắt. Hàng kho không lên được / ngoài kho mà cân đang in HSD: chưa báo riêng.
- Chữ ngoài bảng chữ của cân (ký hiệu đặc biệt) trên tem: chưa biết cân in ra sao.
- Giá từ 1.000.000 đ/kg: ô đơn giá trên cân có 6 chữ số (tối đa 999.999), nên chương trình không gửi món giá cao
  hơn. Hướng đi: món vượt mức gửi theo đơn vị **100g** (giá kho chia 10); kho vẫn giữ giá/kg, FABi không đổi vì mã
  vạch chỉ mang mã món và trọng lượng. Theo phần mềm của hãng, đơn vị 100g là `UnitID 8` ở cột 4 của dòng PLU
  (`CAN-TMA.md`, bảng cột PLU) — chưa thử trên cân thật. Còn phải thử: ô thành tiền có quá 6 chữ số không (gói trên
  999.999 đ có in được tem không), và thông số 188 (số chữ số ô đơn giá, cân quán đang để 6).
