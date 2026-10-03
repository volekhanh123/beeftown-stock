# Cân TM-A — tài liệu kỹ thuật cho người sửa code

File `.TMS`, cổng mạng 33571 / 33581, mẫu tem, mã vạch, phím tắt, thông số và nhật ký bán của cân in tem
TM-A ở quán (dòng TM-xA, firmware V3.14E8). Viết cho người sửa `can-app/` và `web/src/lib/kho/can-tma.ts`.
Hướng dẫn cho nhân viên và quản lý nằm ở `src/huong-dan.html`, không phải ở đây.

## 0. Đọc trước

### 0.1 Nguồn và nhãn độ chắc

Tài liệu này viết lại bằng lời của mình từ ba nguồn:

1. **Dịch ngược phần mềm của hãng** — "TM-xA Management Program" v3.10 (gói JHScale), sách hướng dẫn cân
   V2.50A / V3.04A, các file XML và cơ sở dữ liệu đi kèm. Chỉ đọc, không chạy. Đặc tả tiếng Anh có dẫn chứng
   từng dòng mã nằm ngoài repo (phiên làm việc 29/09/2026); ở đây không chép mã của hãng.
2. **File cân thật** — bản cân của quán tự lưu ra USB (`A_000.TMS`, V3.14E8, lưu 26/09/2026 20:25). Chỉ dùng
   **cấu trúc**; tên hàng, tên quán, tên và mật khẩu WiFi không chép vào đây.
3. **Thử trên cân thật của nhóm trước** (25–26/09/2026) — ghi trong `README.md` gốc, `web/README.md` mục
   "Đồng bộ cân", `can-app/README.md` và `web/public/kho/can-wifi/Nap-Can-WiFi.ps1`.

| Nhãn | Nghĩa |
|---|---|
| **[đã thử]** | Đã thấy trên cân thật của quán (có ngày). |
| **[file thật]** | Thấy trong file cân thật tự lưu — cân tạo ra đúng như vậy; chưa chắc cân nhận lại đúng như vậy. |
| **[hãng]** | Thấy trong mã, dữ liệu hay sách của hãng. Chương trình của mình **chưa thử trên cân thật**. |
| **[suy luận]** | Đoán từ chứng cứ gián tiếp. **Chưa thử trên cân thật.** |
| **[chưa biết]** | Chưa có chứng cứ. Xem §13 để thử an toàn. |

Mọi điều không mang nhãn **[đã thử]** đều là **chưa thử trên cân thật**: câu trên giao diện không được báo
"thành công" cho những việc đó khi chưa có xác nhận từ cân (xem `mat-mang`, `cau-chu` trong `CLAUDE.md`).

### 0.2 Quy ước

- **Cột** = chỉ số sau khi tách dòng theo tab: `dong.split('\t')[i]`. Cột 0 là thẻ đầu dòng (`PLU`, `LAB`…).
  Mọi dòng kết thúc bằng một tab, nên phần tử cuối luôn là chuỗi rỗng. Sách hướng dẫn cân đánh số bước
  `PLU.nn` thì `nn` = cột − 1.
- `⇥` trong ví dụ là tab, `␍␊` là CRLF.
- "Số lẻ" = số chữ số sau dấu thập phân.

### 0.3 Code trong repo

| Việc | File |
|---|---|
| Đọc / ghi file `.TMS`, dòng PLU, cột ngày và hạn sử dụng, lập kế hoạch đồng bộ | `web/src/lib/kho/can-tma.ts` (kiểm: `crm/test/test-kho-can.mjs`, `test-kho-can-tang-web.mjs`) |
| Ghép danh mục kho thành hàng cho cân | `web/src/lib/kho/danh-muc-can.ts` |
| Đọc mã vạch nhãn cân (kho) | `web/src/lib/kho/ma-vach.ts` |
| Mẫu tem: đọc, xem, sửa, thêm ô; bảng mã tiếng Việt | `can-app/src/tem.ts` |
| Thông số (phần TMS) và phím tắt (phần SCP) | `can-app/src/thong-so.ts` |
| Nhật ký bán (REP / RES / REE) | `can-app/src/bao-cao-can.ts` |
| Giao thức hai chiều của hãng, cổng 33581 | `can-app/src/giao-thuc.ts` (cân giả: `test/can-gia-hai-chieu.ts`) |
| Gửi một chiều cổng 33571, tìm cân trong WiFi | `can-app/src/nghiep-vu.ts` (`guiTcp`), `can-app/src/tim-can.ts` |

---

## 1. Cân của quán — những gì đã biết

Từ file cân thật (26/09/2026) và thử của nhóm trước:

| Mục | Giá trị |
|---|---|
| Model / firmware | `TM-xA UA006 V3.14E8` (dòng `INF`, cột 4) |
| MAC | `0023F019CFCA` (dòng `INM`) |
| Mạng | WiFi (thông số 50 = 1), địa chỉ tự cấp (DHCP) nên hay đổi IP; lần thử 26/09 là `192.168.1.22` |
| Bảng mã chữ | UTF-8 (dòng `INA`), file không có BOM |
| Mẫu tem đang dùng | số 28, 58 × 40 mm (thông số 0 = 28) |
| Mã vạch | kiểu 28 `B201F501J500…`, số đầu 20 (thông số 1 = 28, 2 = 20) → EAN-13 2+5+5+1, §6 |
| Giá | đơn giá và thành tiền 3 số lẻ (202 = 203 = 3): giá ghi theo **nghìn đồng**, `845,0` hiện `845.000` = 845.000 đ |
| Ngày in | thông số 104 = 0 → `YYYY.MM.DD`; 105 = 106 = 0 (hạn sử dụng theo từng PLU) |
| Cách in | 250 = 1 (mỗi lần cân in một tem), 283 = 1 (ghi cả lần cân chưa in tem vào nhật ký) |
| Phím tắt | trang 0 có 73 phím, trang 1 và 2 mỗi trang 63 → bàn phím có cột (63 phím chữ + SC64–SC73), §7 |
| Nhật ký | 41 giao dịch, FID 2…42 |
| Hàng | 6 dòng PLU; mọi PLU có cột 27 (in hạn sử dụng) = 0 → tem chưa in ngày hạn sử dụng thật |

Hai lối vào qua mạng:

- **Cổng 33571** — gửi một chiều, **[đã thử]** 26/09/2026. Không có trong phần mềm hay sách của hãng; nhóm
  trước tìm ra bằng thử. §10.1.
- **Cổng 33581** — giao thức hai chiều của hãng (thông số 43 = 1 máy chủ, 166 = 33581). Nhật ký của phần mềm
  hãng cho thấy **chính cân này** đã được TM-xA nối qua 33581 ngày 17/06/2024 và đọc được nhật ký bán (FID 2–6).
  Nhóm trước gửi thẳng cả file vào 33581 thì cân **không** nạp. Mọi việc của chương trình mình qua 33581:
  **chưa thử trên cân thật**. §10.2.

---

## 2. File `.TMS`

### 2.1 Bản chất

File `.TMS` là **bản ghi lại một luồng lệnh**: đúng các dòng chữ mà phần mềm hãng nói với cân qua mạng và
qua dây RS-232. Mỗi dòng một bản ghi, tách cột bằng tab, xuống dòng CRLF, bảng mã UTF-8. Không có độ dài,
mã kiểm hay khung nhị phân. Vì vậy hiểu file là hiểu luôn giao thức (§10).

### 2.2 Thẻ đầu dòng

| Dòng | Nghĩa | Hướng |
|---|---|---|
| `DWL⇥<PHẦN>⇥` | mở một phần: "tải xuống" dữ liệu phần đó vào cân | máy tính → cân |
| `END⇥<PHẦN>⇥` | đóng phần | cả hai |
| `CLR⇥<PHẦN>⇥` rồi `CLR⇥END⇥` | **xoá cả bảng** đó trên cân | máy tính → cân |
| `UPL⇥<PHẦN>⇥` | máy tính hỏi cân phần đó; cân trả các dòng rồi một dòng `END…`; máy tính đáp `UPL⇥END⇥` | máy tính → cân (hỏi) |
| `ECS⇥VER⇥<bản>⇥` | đầu file (chỉ có trong file) | file |
| `END⇥ECS⇥` | cuối file | file |
| `LAE⇥` | hết một mẫu tem trong phần LAB | cả hai |
| `ASK⇥REP⇥…` / `ASK⇥PLU⇥…` | cân tự báo (chỉ qua mạng, §10.2.7) | cân → máy tính |
| `XD1⇥<PHẦN>⇥` | **không có chứng cứ thật**: chỉ có trong một file mẫu tự dựng của nhóm trước. Cân V3.14E8 tự lưu dùng `DWL` cho cả 13 phần; phần mềm hãng không có chữ này. Đọc thì chấp nhận, **không bao giờ ghi**. | — |

`PHẦN` là một trong: `TMS TMT SCP DPT CLS PLU UNT BAR LAB SAL REP INF TIM` (có trong file cân), và
`FNT BMP VIP PAS VER MAC` (chỉ phần mềm hãng gửi, §3.9).

### 2.3 Vỏ file: cân tự lưu và phần mềm hãng lưu khác nhau

**Cân tự lưu (V3.14E8)** — [file thật]:

```
ECS⇥VER⇥V3.14E8⇥␍␊          ← dòng 1, không BOM; VER = firmware
␍␊                           ← dòng trống
DWL⇥DPT⇥␍␊ … END⇥DPT⇥␍␊     ← mỗi phần rồi một dòng trống
␍␊
… CLS, PLU, UNT (rỗng), BAR, LAB, SAL (rỗng), REP, SCP, TMS, TMT, INF, TIM …
END⇥ECS⇥␍␊
```

39.142 byte, 1.514 CRLF, không LF lẻ, không byte `0x0B`; **mọi** dòng khác rỗng kết thúc bằng tab.

**Phần mềm hãng lưu (TM-xA)** — [hãng]:

```
EF BB BF ␍␊                  ← BOM UTF-8 rồi MỘT DÒNG TRỐNG
ECS⇥VER⇥100⇥␍␊              ← VER luôn là 100
[CLR⇥<PHẦN>⇥ / CLR⇥END⇥]    ← chỉ khi tích "Clear Data"
DWL⇥TMS⇥ … END⇥TMS⇥          ← các phần liền nhau, không dòng trống
… TMT, SCP, DPT, CLS, PLU, BAR, LAB, SAL, FNT, BMP, VIP …
END⇥ECS⇥␍␊
```

- Chỉ ghi những dòng thông số / chữ chung đã tích "Import/Export" trong cơ sở dữ liệu của phần mềm.
- Mặc định tích sẵn "Boot File", nên tên file là `JHSCALE\A_xxx.TMS` (§2.7).
- `VER` phân biệt được file do cân lưu (`V3.14E8`) với file do máy tính lưu (`100`).

**File mẫu gốc của hãng** (`Config\<ngôn ngữ>\_ECS.TMS`, dùng để khởi tạo cơ sở dữ liệu phần mềm) có BOM +
dòng trống như phần mềm lưu, nhưng có dòng trống giữa các phần, phần `UNT` rỗng và dòng `CLS` kiểu cũ 3 cột.
Nó **không** giống file cân lưu (so với file thật: cân không có BOM, `CLS` đủ 9 cột, có REP / SCP / INF / TIM).

**Quy tắc đọc của repo** (`docFileCan`): bỏ BOM; dòng đầu tiên **khác rỗng** là dòng đầu file (chấp nhận file
của phần mềm hãng); chỉ `DWL` / `XD1` mở một phần — `CLR⇥PLU⇥` hay `UPL⇥PLU⇥` **không** mở phần; mọi dòng
khác giữ nguyên.

### 2.4 Cách ghi giá trị trong ô

| Loại | Ghi | Đọc |
|---|---|---|
| Số nguyên | chữ số thập phân, có thể âm | không đọc được hay rỗng → 0. **Mất số 0 đầu**: `01234` thành 1234 |
| Số thập phân | `mantissa,số lẻ` (dưới đây) | `m,n` = m ÷ 10ⁿ; không có dấu phẩy = số nguyên; hỏng → 0 |
| Chữ | nguyên văn UTF-8; xuống dòng = byte `0x0B` (`\v`) ở những ô cho phép | `\v` → xuống dòng |
| Giờ | `TIM⇥yy⇥M⇥d⇥H⇥m⇥s⇥` — năm 2 số cuối, **không đệm số 0** | năm + 2000 |
| Nhị phân (phông, firmware, hình) | mỗi byte thành 2 ký tự: `'@'` + nửa byte cao, `'@'` + nửa byte thấp (`@`…`O`) | — |

**Số thập phân "mantissa,số lẻ"** — [hãng], cân của quán nhận và trả lại đúng như vậy [file thật].
Dấu phẩy ở đây là **dấu tách trong ô**, không phải dấu thập phân kiểu Việt. Cách phần mềm hãng ghi một giá trị d:

1. Làm tròn d tới số lẻ cấu hình trong phần mềm (giá 2, trọng lượng 3), kiểu "nửa về số chẵn".
2. |d| > 9.999.999 → ghi `0,0` (giá **mất âm thầm**).
3. Nhân d với 10, đếm số lần, cho tới khi được số nguyên, hoặc |d| > 999.999,9, hoặc đã nhân 7 lần.
4. Ghi `<d làm tròn nửa về số chẵn>,<số lần>`.

Kết quả là dạng **ngắn nhất**: 845 → `845,0`; 110,5 → `1105,1`; 12,30 → `123,1`; 0 → `0,0`; −0,5 → `-5,1`;
1234,565 → `123456,2`; mantissa giữ được khoảng 7 chữ số (123456,789 → `1234568,1`).

- Phần mềm hãng làm tròn giá tới **2** số lẻ (trừ khi đã bấm "Update software" trong trình cài đặt). Chương
  trình mình tự ghi giá, không làm tròn kiểu đó (`giaVaoFile`).
- Cân tự sinh (dòng `RES`) ghi tiền với **3 số lẻ cố định** (`28800,3`) nhưng lượng ở dạng ngắn nhất (`48,2`
  = 0,48 kg) → khi đọc phải nhận mọi số lẻ.
- **Đổi sang đồng** ở cân của quán: `đồng = m × 10^(S − n)` với S = thông số 202 (đơn giá) hoặc 203 (thành
  tiền, giá vốn, thuế), cả hai = 3. `845,0` → 845.000 đ; `59150,3` → 59.150 đ. (`giaTuFile`.)

**Chữ và `\v`** — [hãng]:

- Phần mềm hãng chỉ đổi cặp CR LF thành `0x0B` ở: tên hàng và chữ 1–7 của PLU, chữ 1–32 của LAB.
- Ghi **nguyên văn** (không đổi xuống dòng): tên mẫu tem (LAB cột 2), tên DPT / CLS / BAR / SAL, chữ chung TMT,
  mã vạch ngoài (PLU cột 3), khoá tìm (PLU cột 64). Một CR hay LF lẻ bị ghi thẳng → **gãy dòng**.
- **Tab trong chữ không bao giờ được thoát** → lệch mọi cột sau. Mọi chỗ ghi chữ phải bỏ tab; xuống dòng đổi
  thành `\v` (ô cho phép) hoặc bỏ.
- Chuỗi mẫu mã vạch (`BAR` cột 7) có thể chứa `0x0B` thật (§6.2) → giữ nguyên byte.
- Chữ ghi mới nên chuẩn hoá NFC (bảng chữ in được của cân có chữ Việt dựng sẵn U+1EA0–U+1EF9).

### 2.5 Quy tắc bắt buộc khi code ghi file

1. Giữ cả file ở dạng **chuỗi byte** (`sangChuoiByte` / `tuChuoiByte`): dòng không sửa ghi lại **y nguyên từng
   byte**. Chỉ đổi sang UTF-8 khi hiện chữ hoặc ghi chữ mới.
2. Mỗi dòng giữ tab cuối và CRLF.
3. Không lặp một số (PLU, số mẫu tem, số thông số…) trong một file: phần mềm hãng nhập file có số lặp thì
   **hỏng cả lần nhập**; cân xử lý thế nào thì [chưa biết].
4. Không ghi `XD1`, `UNT`, `CLR` vào file USB (xem §2.6). `ghiFileCan` bỏ mọi dòng `CLR` ở mọi đường (33571, USB, dây,
   trang web); `docFileCan` từ chối file có `CLR` bảng khác PLU (TM-xA tích "Clear Data"); file gốc của Beeftown Cân
   không nhận file có dòng `CLR` nào (`ghiNhanFileTuCan`).
5. Bỏ `TIM` khi gửi xuống cân (đặt lùi đồng hồ → sai ngày in và hạn sử dụng). Bỏ `REP` và `INF` khi xuất file
   danh mục (`boPhanChiDoc`): phần mềm hãng không bao giờ gửi hai phần này.
6. Rộng / cao mẫu tem phải là bội của 8 chấm (§5.1).

### 2.6 Thứ tự phần; nạp thì thêm hay thay

- Thứ tự phần không quan trọng với phần mềm hãng (nó đọc theo thẻ từng dòng). Cân xử lý luồng **tuần tự**
  [suy luận]: trình cài đặt của hãng đóng rồi mở lại `TMS` để đặt một thông số hai lần. Một phần có thể xuất
  hiện nhiều lần; khi đọc, khối sau thắng (`docThongSo`).
- Thứ tự an toàn khi tự dựng: `TMS → TMT → DPT → CLS → BAR → LAB → PLU → SCP` (tham chiếu bằng số, nên giữ
  thứ tự của file gốc cũng được).
- **Nạp USB thay cả danh sách PLU** — hàng không có trong file biến mất khỏi cân. **[đã thử]** 26/09/2026.
- **Gửi qua cổng 33571 chỉ thêm và sửa PLU**, hàng vắng mặt vẫn nằm lại. **[đã thử]** 26/09/2026.
- Nạp USB có thay luôn LAB, SCP, BAR, DPT / CLS hay không, và thay theo từng phần hay cả file: [chưa biết].
  An toàn nhất: phần nào có trong file USB thì phần đó phải **đầy đủ**.
- `CLR` trong file USB: phần mềm hãng có ghi (khi tích "Clear Data"), cân V3.14E8 có làm theo không:
  [chưa biết] — và không cần, vì nạp USB đã thay danh sách PLU.

### 2.7 Tên file trên USB

- Thư mục `JHSCALE` trên USB định dạng FAT (không NTFS). Hai loại tên:
  - `A_000.TMS` … `A_999.TMS`: file đánh số; số gõ ở menu **P41** (mặc định `000`). Không liên quan số máy.
  - `A_xxx.TMS` (chữ "xxx" thật): **file tự nạp**. Thông số 42 = 1 (cân quán = 1) thì cân **tự nạp file này
    lúc bật máy** nếu USB đang cắm. Phần mềm hãng lưu ra tên này theo mặc định; trên cân, bấm `×` ở P41 trước
    khi Amend cũng tạo ra nó.
- → Chương trình **không bao giờ** đặt tên file xuất là `A_xxx.TMS`. Cảnh báo cũ "cân tự nạp A_000.TMS lúc bật"
  sai lý do: rủi ro thật là một file `A_xxx.TMS` còn sót trên USB.
- Trên cân: `Prog → 4 → 1` ra `000`; **Amend** = lưu dữ liệu cân ra file; **Accu/Confirm** = nạp file vào
  cân; phím **PLU** = lưu nhật ký bán chưa tải; **F-Prog + PLU** = lưu mọi nhật ký còn giữ. Màn nạp hiện số
  dòng lỗi / số dòng đúng / số byte: **số dòng lỗi phải bằng 0** — dùng làm phép thử sau mỗi lần nạp USB.

---

## 3. Từng phần của file

### 3.1 `TMS` — thông số (500 dòng, số 0–499)

`TMS⇥<số>⇥<giá trị>⇥` — giá trị luôn là số nguyên. File cân lưu có đủ 500 dòng. Gửi một phần (vài dòng)
là bình thường: số không gửi giữ giá trị cũ trên cân [suy luận — trình cài đặt của hãng làm vậy].
Không bao giờ gửi `CLR⇥TMS⇥` (đặt lại **mọi** thông số, kể cả mạng [suy luận]). Bảng thông số quan trọng: §8.

Riêng thông số **297** có kiểu "số thập phân nén": giá trị = mantissa × 8 + số lẻ. Số 58 không có trong
danh mục của hãng nhưng phần mềm ghi nó (cờ "cân tự báo", §10.2.7). Số 499 (= 1522729470 trên cân quán, giống
file mẫu 2018) chưa rõ nghĩa — không bao giờ sửa.

### 3.2 `TMT` — chữ chung (28 dòng, số 0–27)

`TMT⇥<số>⇥<chữ>⇥`, ghi nguyên văn (§2.4).

| Số | Nghĩa | Số | Nghĩa |
|---|---|---|---|
| 0 | Tên quán (in được, ô "Thông tin lúc in" 0) | 12–13 | Chữ dự phòng |
| 1 | Tên cân | 14 | Dấu ngành hàng |
| 2 | Chữ trước số tiền | **15** | **Tên WiFi** |
| 3 | Chữ sau số tiền (ví dụ `VND`) | **16** | **Mật khẩu WiFi — chữ thường, không mã hoá** |
| 4–11 | Ghi chú cân 1–8 (in trên phiếu; ô "Thông tin lúc in" 17–24) | 17–18 | Dự phòng |
| | | 19 | Tên miền máy chủ (chế độ máy khách) |
| | | 20–27 | Chữ tuỳ biến 1–8 |

**File cân nào cũng có tên và mật khẩu WiFi của quán.** Không commit, không đưa vào kiểm thử, không in ra,
không gửi lên kho (`.gitignore` chặn `*.TMS`; server web không lưu file). `kiemKhoiGhi` chỉ chặn đường ghi 33581
(`KetNoiCan.ghi`): không ghi TMT 15, 16, 19, không thông số mạng. Đường 33571 gửi cả file (`guiXuongCan`, tự gửi,
`guiTem`, file web + `Nap-Can-WiFi.ps1`) và file nạp USB mang lại nguyên văn từng byte các dòng TMS / TMT của file gốc,
kể cả TMT 15/16/19 và TMS 43, 50, 150–165 nếu file gốc có. File gốc cũ hơn cài đặt mạng đang có trên cân thì có thể ghi
đè cài đặt mới (§10.1). File gốc đọc qua WiFi (`docTuCan`) không giữ các dòng mạng này — giá trị cân trả qua cổng chưa
thử không được thành cài đặt gửi ngược xuống cân.

**Beeftown Cân 2.4 sửa chữ chung** (`thong-so.ts` `CHU_CHUNG`, `suaChuChung`; thẻ Cân & thông số mục 6): sửa được 0–11
và 20–27, chỉ xem 12, 13, 14, 17, 18; 15, 16, 19 không đọc ra, không ghi (`fileNho` cũng chặn). Chữ ghi UTF-8 (cân quán
báo `INA … UTF-8`), một dòng, tối đa 40 ký tự — [suy luận] từ tên hàng; phần mềm hãng cho 255 (`String.Value`), giới hạn
của cân chưa biết. Gửi: file nhỏ `DWL TMT` … `END TMT` qua 33571 — **chưa thử trên cân thật**. Ô tem in chữ chung:
"Thông tin lúc in" 0 → TMT 0, 1 → 1, 17–24 → 4–11, 36–43 → 12–19 (`WizardForm.cs` của hãng); chữ trước / sau số tiền
(TMT 2, 3) có lẽ in ở ô 16 "Đơn vị tiền" khi thông số 186 / 187 = 1 [suy luận].

### 3.3 `SCP` — phím tắt

`SCP⇥<trang>⇥<phím>⇥<PLU>⇥`. Chi tiết ở §7.

### 3.4 `DPT` — bộ phận, `CLS` — nhóm hàng

- `DPT⇥<số>⇥<tên>⇥`. Số 1–9 của hệ thống (1 hàng cân tạm, 2 hàng đếm tạm, 3 phí dịch vụ, 4 giảm giá và làm
  tròn, 5 trả không bằng tiền mặt, 9 mặc định; 6–8 dự phòng); người dùng 10–99.
- `CLS⇥<số>⇥<tên>⇥<bộ phận>⇥<mẫu tem 1>⇥<mã vạch 1>⇥<số đầu mã vạch 1>⇥<mẫu tem 2>⇥<mã vạch 2>⇥<số đầu mã vạch 2>⇥`
  — 9 cột dữ liệu (11 phần tử khi tách). Cân quán có nhóm 1–9; mọi PLU thuộc nhóm 9 "mặc định".
  Mẫu tem / mã vạch của nhóm chỉ dùng khi thông số 54 chọn "theo nhóm".

### 3.5 `PLU` — hàng

`PLU⇥` + 67 cột dữ liệu + `⇥`: tách ra **69 phần tử**. Bảng đủ 67 cột ở §4.

### 3.6 `UNT` — đơn vị

Phần rỗng trong cả file cân lẫn file hãng; phần mềm hãng v3.10 không ghi. Đơn vị cố định trong firmware
(bảng ở §4, cột 4). Cách ghi dòng `UNT` chỉ đoán được từ sách (`UNT⇥số⇥tên⇥?⇥?⇥loại⇥gói⇥`) — **không ghi**.

### 3.7 `BAR` — kiểu mã vạch; `LAB` / `LAS` / `LAE` — mẫu tem

Xem §6 và §5.

### 3.8 `SAL` — người bán

`SAL⇥<số>⇥<tên>⇥<mật khẩu>⇥<giảm thấp nhất>⇥<giảm cao nhất>⇥<quyền cấm>⇥<mã>⇥` — mật khẩu chữ thường.
Phần này **rỗng** trên cân quán (thông số 135 = 0: không đăng nhập người bán).

### 3.9 Phần chỉ phần mềm hãng gửi — không bao giờ gửi từ chương trình mình

| Phần | Dòng | Vì sao không gửi |
|---|---|---|
| `FNT` | `FNT⇥<phông mã hoá nửa byte>⇥` (một dòng ~2,5 MB) | Sai phông là hỏng chữ Việt trên màn và tem. `CLR⇥FNT⇥` xoá phông. |
| `BMP` | `BMP⇥<số>⇥<đầu 96 byte + ảnh 1 bit>⇥` | Hình (logo). Không cần; không đọc lại được từ cân. |
| `VER` | `VER⇥<firmware mã hoá nửa byte>⇥` | **Nạp firmware**. Phần mềm hãng không kiểm gì — file sai là hỏng cân. |
| `PAS` | `PAS⇥<0 quản trị, 1 bán, 2 cài đặt, 3 báo cáo, 4 ngăn kéo, 5 sửa giá nhanh>⇥<mật khẩu>⇥` | Đặt mật khẩu cân → khoá người dùng. |
| `MAC` | `MAC⇥0⇥35⇥240⇥255⇥x⇥y⇥` | Đổi địa chỉ MAC → nhật ký tách thành máy khác. Không có cách đổi lại. |
| `VIP` | thẻ khách | Không dùng. |
| `INF` | `INF⇥<tên quán>⇥<tên cân>⇥<số máy>⇥xxx⇥` | Đổi tên quán / tên cân / số máy. Số máy −1 làm phần mềm hãng bỏ kết nối mãi. |

### 3.10 `REP` / `RES` / `REE` — nhật ký bán

Chỉ cân ghi ra. §9.

### 3.11 `INF` / `INA` / `INM` — thông tin máy (trong `DWL⇥INF⇥`, thứ tự INA, INM, INF) — [file thật]

| Dòng | Cột | Cân quán |
|---|---|---|
| `INA` | 1 bảng mã 1 · 2 bảng mã 2 · 3 số (chưa rõ) · 4 bộ nhớ dữ liệu · 5 bộ nhớ phông · 6, 7 chưa rõ | `INA⇥⇥UTF-8⇥0⇥8388608⇥8388608⇥7⇥7⇥` (7 cột) |
| `INM` | 1 MAC · 2 MAC gốc (đường mạng của hãng lấy cột này làm MAC) · 3 giao diện mạng (1 chính, 2 phụ; 0 = không nói) | `INM⇥0023F019CFCA⇥0023F019CFCA⇥0⇥` |
| `INF` | 1 tên quán (TMT 0) · 2 tên cân (TMT 1) · 3 số máy (thông số 40) · 4 model + firmware | cột 3 = `0`, cột 4 = `TM-xA UA006 V3.14E8` |

Model tách theo dấu cách: từ đầu = dòng máy, từ áp chót = mã khách hàng (`UA006`), từ cuối = firmware.
Bảng mã dùng: cột 2 nếu cột 1 rỗng hoặc bằng cột 2, không thì cột 1.

### 3.12 `TIM` — giờ

`TIM⇥26⇥9⇥26⇥20⇥25⇥43⇥` = 2026-09-26 20:25:43, lúc cân lưu file. Gửi lại khối này = đặt đồng hồ cân về giờ
cũ [suy luận] → luôn bỏ. Đặt giờ đúng cách: §10.2.5.

### 3.13 Phần mềm hãng đọc file của mình thế nào (khi quản lý mở file bằng TM-xA)

[hãng] — chỉ quan trọng nếu có người nhập file do chương trình mình tạo vào TM-xA:

- Bỏ qua mọi dòng mở / đóng phần (`ECS`, `DWL`, `END`, `LAE`, `CLR`, `XD1`, `UPL`), dòng trống, `UNT`, `REP`,
  `INF`, `TIM`; chỉ xử lý theo thẻ của từng dòng dữ liệu.
- Dòng thiếu cột: cột thiếu **đầu tiên** nhận 0 / rỗng (do tab cuối sinh phần tử rỗng), các cột sau nhận giá
  trị mặc định của bảng. Thừa cột: bỏ qua.
- Gộp theo khoá (thêm hoặc đè), không xoá gì — trừ mẫu tem cùng số thì thay cả mẫu. Thông số / chữ chung chỉ
  đè những dòng đã tích "Import/Export".
- PLU lặp trong file: dòng đầu thắng. Số lặp ở bảng khác, hoặc khoá tìm (PLU cột 64) dài hơn 16 ký tự: **hỏng
  cả lần nhập**.

---

## 4. Dòng PLU — 67 cột

Thứ tự này giống hệt ở mọi đường của hãng (file, RS-232, mạng) và trùng thứ tự menu `P23 PLU.nn` trên cân
(cột = nn + 1). Không có công tắc theo firmware. Cân quán lưu và trả lại dòng PLU do chương trình mình ghi
**đúng từng cột** [file thật]. "Mặc định" = giá trị phần mềm hãng ghi cho hàng mới = khuôn `KHUON_PLU` của
`can-tma.ts`. Tên hằng trong repo: `COT` (1, 2, 4, 5, 15, 64) và `COT_NGAY` (23–32).

| Cột | Tên của hãng | Nghĩa | Kiểu | Mặc định | Giới hạn / ghi chú |
|---|---|---|---|---|---|
| 1 | PLUID | Số PLU (số gõ trên cân để gọi hàng) | nguyên | — | Người dùng 1–9.999.990; từ 9.999.981 trở lên là PLU hệ thống hoặc bị nhật ký coi là thanh toán (§9.3) → giữ dưới 9.999.981. Chương trình dùng 1–9.999 |
| 2 | Remark | **Mã hàng** = mã cân = mã FABi; in trong mã vạch | nguyên | 0 | 0–99.999.999; mã vạch 28 lấy 5 chữ số. Mất số 0 đầu. Nên ≥ 1 (mã 0 có nghĩa riêng, §6.4). Không bắt buộc duy nhất. |
| 3 | Index | Mã vạch ngoài (EAN quét để gọi hàng) | chữ nguyên văn | rỗng | ≤ 255 |
| 4 | UnitID | Đơn vị | nguyên | 1 | 1 = cân theo đơn vị cân mặc định (kg) · 2 = cái · 3 = kg · 4 = g · 5 = tấn · 6 = lb · 7 = 500 g · 8 = 100 g (· 9 = ¼ lb, chỉ phần mềm). Đơn giá tính theo đơn vị này. Quán dùng 1 (cân ký) và 2 (theo cái). |
| 5 | Price | Đơn giá | thập phân | `0,0` | Quán: nghìn đồng, 3 số lẻ → tối đa `999.999` trên màn (thông số 188 = 6) = 999.999 đ/kg (`GIA_TOI_DA`). |
| 6 | Cost | Giá vốn | thập phân | `0,0` | |
| 7 | Tare | Bì đặt sẵn (kg); hàng cân có cờ 2 → trọng lượng cố định | thập phân | `0,0` | 0–9.999 |
| 8 | LabelID1 | Mẫu tem hoá đơn 1 | nguyên | 0 | 0 = theo thông số 0 (tem một hàng) / 5 (tem cộng dồn), §5.9 |
| 9 | BarT1 | Kiểu mã vạch hoá đơn 1 | nguyên | 0 | 0 = theo thông số 1 / 6 |
| 10 | BarF1 | Số đầu mã vạch hoá đơn 1 | nguyên | 0 | 0 = theo thông số 2 / 7; phần mềm cho 0–9.999 |
| 11 | LabelID2 | Mẫu tem hoá đơn 2 | nguyên | 0 | "Hoá đơn 2" là bản in thứ hai (ví dụ phiếu giấy thường), không phải mặt sau |
| 12 | BarT2 | Kiểu mã vạch hoá đơn 2 | nguyên | 0 | |
| 13 | BarF2 | Số đầu mã vạch hoá đơn 2 | nguyên | 0 | |
| 14 | ClassID | Nhóm hàng | nguyên | **9** | 9 = nhóm mặc định |
| 15 | Name | Tên hàng | chữ, xuống dòng = `\v` | rỗng | Phần mềm không giới hạn; giới hạn của cân [chưa biết] (§4.3) |
| 16–22 | Text1–Text7 | Chữ thêm 1–7 của hàng (in khi tem có ô "Chữ n của hàng") | chữ, `\v` | rỗng | ≤ 255. Chữ 7 là từ đơn vị (ví dụ "hộp") khi hàng đếm có cờ 1 |
| **23** | PS_SD | In ngày bán | 0 / 1 | 0 | `COT_NGAY.IN_NGAY_BAN` |
| **24** | PS_ST | In giờ bán: 0 không · 1 giờ đặt sẵn (cột 29) · 2 giờ lúc in | nguyên | 0 | `IN_GIO_BAN` |
| **25** | PS_PD | In ngày đóng gói | 0 / 1 | 0 | `IN_NGAY_DONG_GOI` — **không đụng** (§4.2) |
| **26** | PS_PT | In giờ đóng gói: 0 / 1 / 2 như cột 24 | nguyên | 0 | `IN_GIO_DONG_GOI` |
| **27** | **PS_UD** | **In hạn sử dụng** | 0 / 1 | 0 | `IN_HSD` |
| **28** | PC_SD | Ngày bán = ngày in + n | 0–999 | 0 | `NGAY_BAN` |
| **29** | PC_ST | Giờ bán đặt sẵn, dạng HHMM | 0–2359 | 0 | `GIO_BAN` |
| **30** | PC_PD | Ngày đóng gói = ngày in + n | 0–999 | 0 | `NGAY_DONG_GOI` — **không đụng** |
| **31** | PC_PT | Giờ đóng gói đặt sẵn HHMM | 0–2359 | 0 | `GIO_DONG_GOI` |
| **32** | **PC_UD** | **Số ngày hạn sử dụng**: hạn = ngày in + n; 0 = hết hạn trong ngày | 0–999 | 0 | `SO_NGAY_HSD`, `HSD_TOI_DA` = 999. Bỏ qua khi cột 27 = 0 |
| 33 | DF_D | Giới hạn dưới khi giảm giá tay: 0 theo hệ thống · 1 không giới hạn · 2 giá gốc · 3 theo cột 35 | nguyên | 0 | |
| 34 | DF_U | Giới hạn trên: 0 · 1 · 2 đơn giá gốc · 3 theo cột 36 | nguyên | 0 | |
| 35 | DF_DN | Giá trị giới hạn dưới | thập phân | `0,0` | |
| 36 | DF_UN | Giá trị giới hạn trên | thập phân | `0,0` | |
| 37 | DA_Sort1 | Giảm giá tự động 1: 0 tắt · 1 theo lượng · 2 theo giờ · 3 cấm theo tổng 1 · 4–7 khách VIP A–D · 8, 9 cấm theo lượng · 10 cấm theo tổng 2 | nguyên | 0 | |
| 38 | DA_Day1 | Ngày áp dụng (cộng bit: CN 1, T2 2, T3 4, T4 8, T5 16, T6 32, T7 64) | nguyên | **127** | 127 = mọi ngày |
| 39 | DA_Dn1 | Từ (lượng; hoặc giờ HHMM khi giảm theo giờ) | thập phân | `0,0` | |
| 40 | DA_Up1 | Đến (không gồm) | thập phân | `0,0` | |
| 41 | DA_Num1 | Giá giảm: > 0 thay đơn giá, < 0 trừ vào đơn giá | thập phân | `0,0` | |
| 42 | DA_Sort2 | Giảm giá tự động 2: kiểu (như cột 37) | nguyên | 0 | |
| 43 | DA_Day2 | Giảm giá tự động 2: ngày áp dụng | nguyên | **127** | |
| 44 | DA_Dn2 | Giảm giá tự động 2: từ | thập phân | `0,0` | |
| 45 | DA_Up2 | Giảm giá tự động 2: đến | thập phân | `0,0` | |
| 46 | DA_Num2 | Giảm giá tự động 2: giá giảm | thập phân | `0,0` | |
| 47 | DA_Sort3 | Giảm giá tự động 3: kiểu | nguyên | 0 | |
| 48 | DA_Day3 | Giảm giá tự động 3: ngày áp dụng | nguyên | **127** | |
| 49 | DA_Dn3 | Giảm giá tự động 3: từ | thập phân | `0,0` | |
| 50 | DA_Up3 | Giảm giá tự động 3: đến | thập phân | `0,0` | |
| 51 | DA_Num3 | Giảm giá tự động 3: giá giảm | thập phân | `0,0` | |
| 52 | DA_Sort4 | Giảm giá tự động 4: kiểu | nguyên | 0 | |
| 53 | DA_Day4 | Giảm giá tự động 4: ngày áp dụng | nguyên | **127** | |
| 54 | DA_Dn4 | Giảm giá tự động 4: từ | thập phân | `0,0` | |
| 55 | DA_Up4 | Giảm giá tự động 4: đến | thập phân | `0,0` | |
| 56 | DA_Num4 | Giảm giá tự động 4: giá giảm | thập phân | `0,0` | |
| 57 | TaxType | Kiểu thuế: 0 không (theo thông số 116–117) · 1 chưa gồm · 2 chưa gồm, giá sau thuế · 3 đã gồm | nguyên | 0 | |
| 58 | Tax | Thuế suất theo 0,01 % (1700 = 17 %) | nguyên | 0 | |
| 59–62 | SspValue1–4 | Liên kết "thông tin tuỳ biến" 1–4 | nguyên | 0 | không dùng |
| 63 | SType | Chế độ đặc biệt: 0 thường · 1 chỉ trừ bì · 2–5 thông tin tuỳ biến 1–4 · 6 chung | nguyên | 0 | |
| 64 | ALPHA | Khoá tìm hàng bằng phím chữ | chữ nguyên văn | rỗng | ≤ 16 ký tự (§4.3) |
| 65 | Flag | Cờ cộng: 1 từ đơn vị (hàng đếm, chữ 7) · 2 lưu như hàng cân (hàng đếm) / trọng lượng cố định (hàng cân) · 4 bì theo % | nguyên | 0 | |
| 66 | Flag_Value | Phần trăm bì khi có cờ 4 | 0–99 | 0 | |
| 67 | Bitmap | Số hình in kèm hàng (ô tem "Hình của hàng") | nguyên | 0 | |
| 68 | — | rỗng sau tab cuối | | | |

Ví dụ một dòng (hàng thử, 845.000 đ/kg, **hạn sử dụng 3 ngày** — cột 27 = 1, cột 32 = 3; còn lại đúng khuôn):

```
PLU⇥1⇥10001⇥⇥1⇥845,0⇥0,0⇥0,0⇥0⇥0⇥0⇥0⇥0⇥0⇥9⇥Sườn bò thử⇥⇥⇥⇥⇥⇥⇥⇥0⇥0⇥0⇥0⇥1⇥0⇥0⇥0⇥0⇥3⇥0⇥0⇥0,0⇥0,0⇥0⇥127⇥0,0⇥0,0⇥0,0⇥0⇥127⇥0,0⇥0,0⇥0,0⇥0⇥127⇥0,0⇥0,0⇥0,0⇥0⇥127⇥0,0⇥0,0⇥0,0⇥0⇥0⇥0⇥0⇥0⇥0⇥0⇥suonbothu⇥0⇥0⇥0⇥
```

### 4.1 Hạn sử dụng (HSD)

[hãng] — **chưa thử trên cân thật**.

- Cột 27 là **công tắc in**, cột 32 là **số ngày tương đối** tính từ ngày cân in tem (đồng hồ cân). Không bao
  giờ là ngày tuyệt đối. Hạn in ra = ngày in + cột 32. Cột 27 = 1, cột 32 = 0 → in ngày hôm nay. Cột 27 = 0 →
  không in, cột 32 bị bỏ qua.
- Ngày bán (23 / 28) và ngày đóng gói (25 / 30) cùng kiểu. Giờ (24 / 29, 26 / 31) là HHMM.
- **Mẫu tem phải có ô** "Dữ liệu của hàng" mã 15 "Hạn dùng" (§5.3). Tem 28 của quán có ô này và chữ cố định
  "HSD", **cả hai điều kiện in = 1 (luôn in)**; mọi PLU hiện có cột 27 = 0 → với hàng không có hạn, cân in gì ở
  ô đó (trống? ngày hôm nay?) [chưa biết]. Đổi điều kiện in của hai ô sang **9** ("chỉ khi hàng có hạn dùng")
  thì hàng không có hạn không in dòng "HSD" treo lơ lửng — `goiYHsd` trong `tem.ts` gợi ý việc này.
- Thông số chung: **105** (0 theo từng PLU — cân quán; 1 dùng 106 nếu PLU không đặt; 2 luôn dùng 106; 3 không
  in hạn; 4–6 như 0–2 nhưng in **số ngày** thay cho ngày [suy luận]); **106** số ngày chung 0–999. "PLU không
  đặt" nghĩa là cột 27 = 0 hay cột 32 = 0: [chưa biết].
- Định dạng ngày: thông số **104** (§8). Hạn sử dụng chỉ đúng khi **đồng hồ cân đúng**.
- Kho → cân (`can-tma.ts`): `HangKho.han_dung_ngay` `undefined` = không quản (giữ cột cân); `null` = không in
  (27 = 0, 32 = 0); n = in (27 = 1, 32 = n); n > 999 → không in, kèm cảnh báo.
- Danh mục kho (`danh-muc-can.ts`, cách b — 29/09/2026) gửi **số ngày còn lại của lô** = `kho_lo.han_dung` − hôm nay
  (giờ VN, `homNayVn`): ô mã đang giữ tảng → lô lóc ra (phiên còn nháp: không muộn hơn hạn tảng); món và ô trống → lô
  **sớm nhất** còn tồn ở chi nhánh (`kho_v_ton`, mọi vị trí); chưa có lô → `han_dung_ngay` của món (null → không in);
  hạn đã qua → `null` + cảnh báo; mã giảm giá cận date → `null`. `HangKho.nguon_hsd` / `canh_bao_hsd` đi tới
  `DongKeHoach.hsdNguon` / `canhBao` (chỉ để hiện, không ghi file). Vì cột 32 là số **tương đối**, số gửi hôm nay in
  ngày mai là HSD muộn thêm 1 ngày: phải gửi lại **mỗi ngày** trước khi đóng gói. Beeftown Cân ghi ngày tính
  (`hsd-tinh-ngay.txt`) và báo đỏ khi cũ; tự gửi gửi được đếm ngược (số → số), không tự bật / tắt in (null ↔ số);
  màn Đồng bộ cân ghi "HSD tính cho ngày xuất file — nạp vào cân trong ngày". Đồng hồ cân sai ngày → HSD sai theo.
- Phần mềm hãng có cột Excel "Shelf date data(+print)": nhập n ≥ 1 thì bật in, nhập 0 thì **tắt** in (không
  diễn tả được "hết hạn trong ngày"). Nhập Excel của hãng đè **mọi** cột của PLU đã có, kể cả hạn sử dụng.

### 4.2 Ngày đóng gói trên tem 28

Tem 28 in "Ngày đóng gói" bằng ô **"Thông tin lúc in" mã 3 — Ngày in** (luôn là hôm nay), không phải ô
"Ngày đóng gói" của hàng. Vì vậy chương trình **không đụng cột 25 / 30**.

### 4.3 Tên hàng, khoá tìm, giới hạn

- Phần mềm hãng không giới hạn độ dài tên. Cân: thông số 249 chia bộ nhớ mỗi PLU (tên + chữ 1–7 dùng chung
  khoảng "tổng − 150 byte"; chữ Việt 2–3 byte/ký tự); cân quán 249 = 0. Giới hạn thật [chưa biết]; tên dài
  nhất trên cân quán hiện là 22 ký tự. Repo cắt ở 40 (`TEN_TOI_DA`) và cảnh báo từ 24 (`TEN_DAI`).
- Khoá tìm (cột 64): phần mềm hãng tạo từ tên — giữ chữ Latin không dấu, **bỏ hẳn** chữ có dấu, bỏ dấu cách,
  tối đa 14, chữ thường ("Sườn bò thử" → `snbth`). Repo (`maTimKiem`) bỏ dấu nhưng giữ chữ gốc
  (`suonbothu`), ≤ 16 — dễ tìm hơn và vẫn trong giới hạn 16 của phần mềm hãng. Cân không tự tạo khoá cho hàng
  nhập tay trên cân [suy luận: PLU 6 của cân quán có khoá rỗng].
- Mã hàng là số nguyên: `01234` thành 1234.

---

## 5. Mẫu tem — `LAB` / `LAS` / `LAE`

Một mẫu tem = một dòng `LAB` + 0–100 dòng `LAS` (mỗi dòng một ô in) + một dòng `LAE`, trong `DWL⇥LAB⇥` …
`END⇥LAB⇥`. Trên cân là menu **P26**; sửa trên cân rất khó, nên dùng máy tính.

### 5.1 Dòng `LAB` (40 phần tử)

| Cột | Nghĩa |
|---|---|
| 1 | Số mẫu tem |
| 2 | Tên mẫu — ghi **nguyên văn** (phần mềm hãng không đổi xuống dòng ở đây) → bỏ tab / CR / LF. Nên ≤ 48 byte [suy luận: một tên bị cân cắt còn 49 ký tự] |
| 3 | Loại: 1 tem một hàng · 2 tem cộng dồn · 3 phiếu (giấy thường) · 4 danh sách bếp. Phần mềm hãng không rẽ nhánh theo cột này; cân có dùng không [chưa biết] |
| 4 | Rộng, **mm** (= chấm ÷ 8) |
| 5 | Cao, mm |
| 6–21 | Chữ cố định số 0–15 (`\v` = xuống dòng) |
| 22 | Kiểu phông: 1 = "phông mới (V2.xx)" — **không phải chữ**, giữ nguyên |
| 23–38 | Chữ cố định số 16–31 |
| 39 | rỗng |

Ô chữ số t nằm ở cột `t < 16 ? 6 + t : 7 + t` (`cotChu`). Bên trong, phần mềm hãng lưu rộng / cao bằng chấm
(8 chấm/mm, 203 dpi); ghi file thì chia 8 lấy nguyên, đọc thì nhân 8. Kích thước không phải bội của 8 thì
mỗi lần qua lại mất tới 7 chấm → **làm tròn lên bội của 8 trước khi chia**. "60 × 40" của hãng thật ra là vùng
in 54 × 37 mm; tem 28 của quán là 58 × 40 mm (464 × 320 chấm).

### 5.2 Dòng `LAS` (14 phần tử)

| Cột | Tên của hãng | Nghĩa |
|---|---|---|
| 1 | SubID | Số thứ tự ô 0–99 = **thứ tự in**; không cần liền nhau (tem 28: 0, 1, 4, 5, 10, 12, 15, 16, 17, 20, 26, 27, 28, 29); duy nhất trong một mẫu |
| 2 | Flag1 | **Loại ô** (§5.3) |
| 3 | Flag2 | Mã phụ 1 — nghĩa theo loại ô |
| 4 | Flag3 | Mã phụ 2 — nghĩa theo loại ô |
| 5 | Print | **Điều kiện in** (§5.4) |
| 6 | Angle | Góc xoay 0–3 × 90° theo chiều kim đồng hồ, quanh góc (x, y) |
| 7 | Align | Canh chữ: 4 bit thấp 0–9 (§5.6); bit cao (0x40, 0x80 — thấy 192, 198 ở phiếu gốc của cân) chưa rõ nghĩa → **giữ nguyên**, so sánh bằng `canh & 0x0F` |
| 8 | Font | **Cỡ chữ** 0–9 (§5.5) |
| 9–12 | Left, Top, Width, Height | x, y, rộng, cao — **chấm**, gốc ở góc trên trái, y hướng xuống |
| 13 | — | rỗng |

Công cụ HTML cũ `Beeftown_Can_TMA.html` đọc nhầm cột 7 là cỡ chữ; đúng là cột 8.

Khung thật trên giấy khi xoay (x, y, rộng w, cao h): 0° → (x, y, w, h); 90° → (x − h, y, h, w);
180° → (x − w, y − h, w, h); 270° → (x, y − w, h, w) (`khungThat`).

`LAE⇥` không có dữ liệu, luôn phải có sau mỗi mẫu (kể cả mẫu không có ô). Khi đọc qua mạng, thiếu `LAE` thì
các dòng của mẫu sau bị nuốt vào mẫu trước.

### 5.3 Loại ô (cột 2) và ý nghĩa cột 3 / 4

| Cột 2 | Loại ô (`LOAI_O`) | Cột 3 | Cột 4 | Dùng cỡ chữ? |
|---|---|---|---|---|
| 0 | Mã vạch | 0 có số dưới vạch · 1 không số | 0 = kiểu mã vạch theo PLU / thông số 1 (10–29 "ép kiểu đó" [suy luận]; sách V3.04A nói cột này không tác dụng — **luôn ghi 0**) | không |
| 1 | Dữ liệu của hàng | **hàng thứ mấy**: 0 = hàng đang in; 1–31 = hàng thứ n đã cộng dồn (tem cộng dồn) | **mã trường** (bảng dưới) | có |
| 2 | Thông tin lúc in | **mã trường** (bảng dưới) | 0; riêng mã 50 và 61–64 là lựa chọn phụ | có |
| 3 | Chữ cố định | số ô chữ 0–31 → chữ ở cột `cotChu(n)` của dòng LAB | 0 | có |
| 4 | Khung viền | độ dày 1–24 (đơn vị chấm [suy luận]) | 0 | không |
| 5 | Phân vùng | 0 cờ vùng · 1 in hết trang · 2 in ngay | số mm đẩy giấy thêm (0–32) | không |
| 6 | Hình (logo) | số hình 1–255 | 0 | không |
| 7 | In riêng của hãng | không có mã nào được định nghĩa | | — |

Khung viền và "In riêng" chưa từng xuất hiện trong dữ liệu nào → cách cân in [chưa biết].

**Mã trường của "Dữ liệu của hàng" (loại 1, cột 4)** — `TRUONG_HANG`:

| Mã | Trường | Mã | Trường |
|---|---|---|---|
| 0 | Tên hàng | 19 | Chữ 4 của hàng |
| 1 | Trọng lượng / số lượng | 20 | Chữ 5 của hàng |
| 2 | Bì | 21 | Chữ 6 của hàng |
| 3 | Đơn giá gốc (trước khi giảm) | 22 | Chữ 7 của hàng |
| 4 | **Đơn giá** (tem dùng mã này) | 23 | Tổng trọng lượng (cả bì) |
| 5 | Thành tiền của hàng (tem một hàng thường dùng "Thông tin lúc in" 27) | 24 | Đơn vị tính (kg / cái) [suy luận] |
| 6 | Số PLU | 25 | Đơn vị của đơn giá ("/kg") [suy luận] |
| 7 | Số nhóm hàng | 26 | Giá chưa thuế |
| 8 | Số bộ phận | 27 | Thuế |
| 9 | Mã vạch ngoài (cột 3 của PLU) | 28 | Phí dịch vụ của hàng |
| 10 | Mã hàng (cột 2 của PLU) | 29 | Thuế suất |
| 11 | Ngày bán | 30 | Số PLU và tên hàng |
| 12 | Giờ bán | 31 | Đơn giá trước khi giảm |
| 13 | Ngày đóng gói | 32 | Trọng lượng của hàng đếm cái |
| 14 | Giờ đóng gói | 33 | Hình của hàng (cột 67 của PLU) |
| **15** | **Hạn dùng (HSD)** | 34 | Bì theo bao bì |
| 16 | Chữ 1 của hàng | 35 | Bì theo phần trăm |
| 17 | Chữ 2 của hàng | 36 | Phần trăm bì |
| 18 | Chữ 3 của hàng | 38 | [chưa biết] — chỉ thấy trong phiếu gốc của cân |

**Mã trường của "Thông tin lúc in" (loại 2, cột 3)** — `TRUONG_BAN`:

| Mã | Trường | Mã | Trường |
|---|---|---|---|
| 0 | Tên quán (TMT 0) | 34 | Số người phục vụ |
| 1 | Tên cân (TMT 1) | 35 | Tên người phục vụ |
| 2 | Số cân | 36–37 | Chữ dự phòng 1–2 (TMT 12–13) |
| **3** | **Ngày in** (tem 28 dùng làm ngày đóng gói) | 38 | Dấu ngành hàng (TMT 14) |
| 4 | Giờ in | 39 | **Tên WiFi (TMT 15) — không bao giờ in** |
| 5 | Số lần cộng dồn | 40 | **Mật khẩu WiFi (TMT 16) — không bao giờ in** |
| 6 | Tổng số cái | 41–42 | Chữ dự phòng 6–7 (TMT 17–18) |
| 7 | Tổng trọng lượng | 43 | Tên miền máy chủ (TMT 19) |
| 8 | Tổng tiền (trước làm tròn) | 44 | Phí dịch vụ |
| 9 | Tiền khách trả | 45 | Thuế của phí dịch vụ |
| 10 | Tiền thối | 46 | Phí dịch vụ chưa thuế |
| 11 | Tiền làm tròn | 47 | Số bàn |
| 12 | Đơn vị trọng lượng | 48 | Số dư thẻ |
| 13 | Đơn vị giá theo trọng lượng | 49 | Số dư thẻ ban đầu |
| 14 | Đơn vị đếm | 50 | Thông tin thẻ (cột 4: 0 số thẻ, 1–15 chữ 1–15) |
| 15 | Đơn vị giá theo cái | 51 | Trả bằng thẻ |
| 16 | Đơn vị tiền | 52–54 | Thanh toán 1–3 |
| 17–24 | Ghi chú cân 1–8 (TMT 4–11) | 55 | Loại giao dịch |
| 25 | Số giao dịch (FID) — cột 4: số chữ số cuối | 56–57 | Mã chính / mã phụ khách VIP |
| 26 | Số phiếu (SID) | 58–59 | Giảm giá / điểm VIP |
| **27** | **Thành tiền** (tem một hàng dùng mã này) | 60 | Thành tiền theo loại tiền thứ hai |
| 28 | Tổng cộng dồn (trước giảm và làm tròn) | 61–64 | Thông tin tuỳ biến 1–4 (cột 4: 0 gốc, 1 tên, 2–8 chữ 1–7) |
| 29 | Tiền giảm và làm tròn | 65 | Địa chỉ MAC |
| 30 | Số người bán | 66 | Tiền giảm và làm tròn (có thuế) |
| 31 | Tên người bán | 67–69 | Thanh toán qua mạng: kiểu / số tiền / mã |
| 32 | Tổng tiền chưa thuế | 70–72 | [chưa biết] — chỉ có trong phiếu gốc của cân |
| 33 | Tổng thuế | | |

### 5.4 Điều kiện in (cột 5) — `DIEU_KIEN_IN`

| Mã | Điều kiện | Mã | Điều kiện |
|---|---|---|---|
| 0 | Không in | 17 | Chỉ khi dùng thanh toán 1 |
| 1 | **Luôn in** | 18 | Chỉ khi dùng thanh toán 2 |
| 2 | **Chỉ hàng cân ký** | 19 | Chỉ khi dùng thanh toán 3 |
| 3 | **Chỉ hàng đếm cái** | 20 | Chỉ khách VIP |
| 4 | Chỉ hàng bán tạm (không gọi PLU) | 21 | Chỉ lần in thường (không in lại / in trước) [suy luận] |
| 5 | Chỉ hàng có trừ bì | 22 | Chỉ khi in lại |
| 6 | Chỉ hàng tặng | 23 | Chỉ khi in trước |
| 7 | Chỉ khi hàng có ngày bán | 24 | Chỉ hàng đúng 1 cái |
| 8 | Chỉ khi hàng có ngày đóng gói | 25 | Chỉ hàng không phải bán tạm |
| **9** | **Chỉ khi hàng có hạn dùng** | 26 | Chỉ hàng không trừ bì |
| 10 | Chỉ khi không phải đúng 1 cái | 27 | Chỉ hàng không phải hàng tặng |
| 11 | Chỉ hàng có phí dịch vụ | 28 | Chỉ hàng miễn thuế |
| 12 | Chỉ khi có phí dịch vụ | 29 | Chỉ khách không phải VIP |
| 13 | Chỉ hàng có thuế | 30 | Chỉ hàng có bì mặc định |
| 14 | Chỉ khi trả tiền mặt | 31 | Chỉ khi in thông tin thẻ |
| 15 | Chỉ khi trả bằng thẻ | 32 | Chỉ khi thanh toán qua mạng |
| 16 | Chỉ khi có giảm giá tổng | 33 | Chỉ hàng không có bì mặc định |

- 34, 35, 36 chỉ thấy trong phiếu gốc của cân (đi với "tổng gốc / tiết kiệm", một kiểu thanh toán, số dư
  thẻ) — nghĩa [chưa biết].
- "Hàng cân ký / đếm cái" theo **loại đơn vị** của PLU (đơn vị 2 là đếm, các đơn vị khác là cân) [suy luận].
- 7 / 8 / 9 xét công tắc in của PLU (cột 23 / 25 / 27); có xét luôn thông số 105 hay không [chưa biết].
  Mẫu gốc của hãng đặt 9 cho cả chữ "Shelf Date" lẫn ô hạn dùng.

### 5.5 Cỡ chữ (cột 8) — `CO_CHU`

Rộng một chữ Latin × cao dòng, tính bằng chấm. Không có in đậm, in ngược hay gạch chân: nhấn mạnh chỉ bằng
cỡ chữ hoặc khung viền.

| Mã | Rộng × cao | Cỡ | Mã | Rộng × cao | Cỡ |
|---|---|---|---|---|---|
| 0 | 10 × 18 | nhỏ | 5 | 18 × 68 | lớn, cao gấp đôi |
| 1 | 14 × 26 | vừa | 6 | 28 × 52 | vừa, to gấp đôi |
| 2 | 18 × 34 | lớn | 7 | 36 × 68 | lớn, to gấp đôi |
| 3 | 10 × 36 | nhỏ, cao gấp đôi | 8 | 36 × 136 | lớn, rộng gấp đôi, cao gấp bốn |
| 4 | 14 × 52 | vừa, cao gấp đôi | 9 | 54 × 102 | lớn, to gấp ba |

Chữ số dưới mã vạch theo thông số 33, không theo cột 8. Chữ quá khung thì cắt / xuống dòng / thu nhỏ:
[chưa biết] (thông số 35 "tự xuống dòng").

### 5.6 Canh chữ (cột 7, 4 bit thấp) và góc xoay (cột 6)

| Mã | Canh | Mã | Canh |
|---|---|---|---|
| 0 | Mặc định (phần mềm hãng vẽ ở giữa; cân in thế nào [chưa biết]) | 5 | Giữa |
| 1 | Trên, trái | 6 | Giữa, phải |
| 2 | Trên, giữa | 7 | Dưới, trái |
| 3 | Trên, phải | 8 | Dưới, giữa |
| 4 | Giữa, trái | 9 | Dưới, phải |

Góc xoay: 0 không · 1 = 90° · 2 = 180° · 3 = 270°, theo chiều kim đồng hồ.

### 5.7 Phân vùng (loại 5)

- **Cờ vùng** (cột 3 = 0): chia mẫu thành vùng; các ô sau một phân vùng bị trừ y bằng Top của phân vùng. Vùng
  có ô "dữ liệu của hàng" với cột 3 = 0 được **lặp lại cho từng hàng** đã cộng dồn (dòng phiếu). Cột 4 = mm
  đẩy giấy thêm.
- **In hết trang** (1): đẩy qua khe tem (giấy tem) hoặc một đoạn (giấy thường).
- **In ngay** (2): in phần đã có rồi đẩy cột 4 mm.
- Vì vùng xác định theo **thứ tự số ô**, phần mềm hãng xếp lại số ô theo vị trí dọc mỗi khi mẫu có phân
  vùng: giữ nguyên tập số (kể cả chỗ trống), chỉ hoán vị. Khoá xếp: Top × 10.000 + (Left + 1); phân vùng đúng
  Top × 10.000; ô xoay 180° / 270° là Top × 10.000 − (Left + 1).
- Left / Width / Height của phân vùng là rác của giao diện → giữ nguyên khi ghi.
- `tem.ts`: mẫu có phân vùng thì **không cho thêm / di chuyển ô** (`CAU_PHAN_VUNG`).

### 5.8 Số mẫu tem

| Số | Nghĩa |
|---|---|
| 0 | "Mặc định hệ thống" (rỗng); PLU cột 8 = 0 nghĩa là "theo thông số" |
| 1–9 | **Mẫu gốc trong firmware** "PF-1"…"PF-9": 1 tem một hàng 58 × 40, 2 là 40 × 30, 3 là 58 × 30; 4–6 tem cộng dồn cùng cỡ; 7–9 phiếu giấy thường 58 / 40 / 48 mm. File cân quán **có** LAB 1–9 [file thật]. |
| **10–29** | **Mẫu của người dùng** (sách cân: 10–29; phần mềm hãng ghi được 10–99 nhưng 30–99 có thể bị cân từ chối [chưa biết]) — dùng 10–29. |
| 26–29 | Trình cài đặt của hãng sao mẫu vào đây: 28 tem một hàng, 29 tem cộng dồn, 27 phiếu, 26 khác |
| 10.000–19.999 | Mẫu khuôn trên máy tính (không gửi xuống cân) |
| 90.000–90.099 | Thùng rác của trình cài đặt |

Cân quán có LAB 1–9, 10, 11, 27, 28.

### 5.9 Tem nào được in

- Bán một hàng: PLU cột 8 ≠ 0 → mẫu đó; không thì **thông số 0**. Cộng dồn từ hai hàng: **thông số 5**.
- Thông số 54 (hai chữ số: hàng chục = nguồn mã vạch, hàng đơn vị = nguồn mẫu tem; 0 mặc định, 1 theo thông
  số, 2 theo nhóm) có thể đổi nguồn; nghĩa đúng của "mặc định" [suy luận]. Cân quán 54 = 0.
- Hoá đơn 2 như trên với PLU cột 11 và thông số 10 / 15. Thông số 3 = số bản in (0 = không tự in).
- → Cân quán: mọi PLU cột 8 = 0, thông số 0 = 28 → **mọi tem in bằng mẫu 28**.

### 5.10 Tem 28 của quán (cấu trúc, không chép chữ)

58 × 40 mm, 14 ô [file thật]:

| Số ô | Ô | Điều kiện in | Cỡ | Vị trí x, y, rộng × cao (chấm) |
|---|---|---|---|---|
| 0 | Tên hàng | 1 | 5 | 0, 0, 408 × 43 |
| 1 | Số PLU | 1 | 0 | 408, 1, 54 × 34 |
| 4 | Chữ cố định 3 | 1 | 5 | 281, 52, 152 × 26 |
| 5 | Chữ cố định 1 (chữ cho hàng cân) | **2** | 3 | 6, 55, 115 × 26 |
| 10 | Chữ cố định 0 | 1 | 3 | 137, 56, 107 × 26 |
| 12 | Trọng lượng / số lượng | 1 | 3 | 4, 90, 116 × 26 |
| 15 | Đơn giá | 1 | 3 | 131, 90, 111 × 25 |
| 16 | Thành tiền (thông tin lúc in 27) | 1 | 5 | 260, 108, 204 × 35 |
| 17 | Mã vạch (có số, kiểu theo thông số) | 1 | — | 3, 120, 257 × 74 |
| 20 | Chữ cố định 4 (chữ "ngày đóng gói") | 1 | 0 | 2, 198, 112 × 21 |
| 26 | Ngày in (thông tin lúc in 3) | 1 | 0 | 121, 198, 156 × 20 |
| 27 | **Hạn dùng** (dữ liệu hàng 15) | **1** | 0 | 114, 220, 200 × 26 |
| 28 | Chữ cố định 16 ("HSD") | **1** | 0 | 1, 224, 94 × 23 |
| 29 | Chữ cố định 12 | 1 | 1 | 220, 255, 220 × 50 |

### 5.11 Bất biến khi sửa tem

Số ô duy nhất 0–99, tối đa 100 ô; số mẫu 10–29 khi gửi xuống cân; rộng / cao bội của 8; chữ ≤ 255, không tab,
xuống dòng = `\v`, NFC; giữ cột 22 và bit cao của cột 7; luôn có `LAE`; không bao giờ gửi mẫu 0. Trình cài đặt
của hãng từ chối ô có khung thật ra ngoài tem hoặc rộng / cao < 1 — kiểm khi sửa, nhưng không từ chối file khi
đọc (mẫu gốc của hãng có ô chạm y = −1). Dòng `LAS` không sửa giữ y nguyên byte.

---

## 6. Mã vạch — `BAR` và chuỗi mẫu `TChar`

### 6.1 Dòng `BAR` (9 phần tử)

`BAR⇥<số>⇥<tên>⇥<kiểu>⇥<số kiểm>⇥<hằng 1>⇥<hằng 2>⇥<TChar>⇥`

| Cột | Nghĩa |
|---|---|
| 1 | Số kiểu mã vạch: 0 "mặc định hệ thống" · 1–9 của hãng · 10–99 người dùng (28 / 29 do trình cài đặt tạo) |
| 2 | Tên (không in) |
| 3 | **Kiểu ký hiệu**: 0 tự chọn theo số chữ số (12 → EAN-13, 7 → EAN-8, 11 → UPC-A, 6 → UPC-E) · 1 EAN-13 · 2 EAN-8 · 3 UPC-A · 4 UPC-E · 5 EAN-128C (số) · 6 Code-128C (số) · 7 ITF25 · 8 PDF417 · 9 EAN-128 (chữ) · 10 Code-128 (chữ) · 11 QR · 12 Code39 thường · 13 Code39 mở rộng · 14 Code93. Không có "EAN-18". |
| 4 | Số kiểm: 0 thêm nếu cần · 3 không bao giờ thêm |
| 5, 6 | Hằng số 1, 2 (nguồn C, D) |
| 7 | **TChar** — chuỗi mẫu (§6.2); có thể chứa byte `0x0B` thật → giữ nguyên |

Cân quán có BAR 1–9 và 28 [file thật]:

| Số | TChar | Nghĩa |
|---|---|---|
| 1 | `B201E500K500…` | 2 số đầu + 5 số PLU + 5 số thành tiền |
| 2 | `B201F501K500…` | 2 số đầu + 5 số mã hàng + 5 số thành tiền (mặc định gốc của hãng) |
| 3 | `F701K500…` | 7 mã hàng + 5 thành tiền |
| 4, 5, 6 | `B201E400K600`, `B201F401K600`, `F601K600` | như trên, thành tiền 6 số |
| 7, 8, 9 | `B701L500`, `B601L600`, `B501L700` | tem cộng dồn: số đầu + tổng tiền giao dịch |
| **28** | **`B201F501J500A000A000A000`** (tên QS-Item, hằng 1 = 99999) | **2 số đầu + 5 số mã hàng + 5 số trọng lượng** — đang dùng |

### 6.2 Ngữ pháp `TChar`

Chuỗi gồm 6–32 **phần tử** nối liền:

| Ký tự đầu | Phần tử | Dạng |
|---|---|---|
| `A`…`Z` | **Nguồn số** | `<chữ nguồn><độ dài 0–9><dịch 0–9><tràn 0–9>` — 4 ký tự (5 với nguồn ≥ 26) |
| `>` | Chữ cố định | `>` + chữ + byte `0x0B` kết thúc |
| `?` | Tuỳ biến | `?` + 3 chữ số |
| `@` | Chữ | `@` + nhóm 1 chữ số + mục 2 chữ số (nhóm 0: tên / chữ 1–7 / mã vạch ngoài của PLU; 1: chữ chung TMT; 2: chữ của mẫu tem; 3: khác) |
| `=` | Ký hiệu | `=` + nhóm + mục (0 phân vùng / vòng lặp · 1 số kiểm EAN tại chỗ · 2 xuống dòng) — dùng cho QR liệt kê cả phiếu |

Chữ nguồn là số hệ 26 với A = 0: `A`…`Z` = 0–25, `BA` = 26 … `BP` = 41.

| Chữ | Nguồn | Chữ | Nguồn |
|---|---|---|---|
| A | Không in (ô trống) | P | Số người bán |
| B | Số đầu (thông số 2 với tem một hàng, 7 với tem cộng dồn) | Q, R, S | Ngày in: năm, tháng, ngày |
| C, D | Hằng số 1, 2 | T, U, V | Giờ in: giờ, phút, giây |
| E | Số PLU | W | Số phiếu (SID) |
| **F** | **Mã hàng (PLU cột 2)** | X | Số máy (thông số 40) |
| G | Mã vạch ngoài (PLU cột 3) | Y, Z | Thuế của hàng / của giao dịch |
| H | Số đầu riêng của PLU (cột 10) [suy luận] | BA | Số ngày hạn sử dụng |
| I | Đơn giá | BB, BC, BD | Hạn sử dụng: năm, tháng, ngày |
| **J** | **Trọng lượng / số lượng** | BE…BL | Như I, J, K, L, M, N, Y, Z nhưng có dấu thập phân (độ dài thay đổi) |
| **K** | **Thành tiền của hàng** | BM | Số giao dịch (FID) |
| L | Tổng tiền giao dịch | BN | Ký tự "cân / đếm" |
| M, N | Tổng số cái / tổng trọng lượng | BO, BP | Giá chưa thuế / tổng chưa thuế |
| O | Số lần cộng dồn | | |

- **Độ dài**: số chữ số in, đệm 0 bên trái [suy luận].
- **Dịch**: bỏ bấy nhiêu chữ số bên phải (chia 10^dịch).
- **Tràn** (giá trị nhiều chữ số hơn độ dài): 0 không in · 1 cắt bớt · 2 điền 0 · 3 điền 9 · 4 mở rộng.
  Mã 0 bỏ cả mã vạch hay chỉ phần đó, mã 1 giữ chữ số nào: [chưa biết].
- Đổi giá trị thành số nguyên trước khi xếp: tiền × 10^(thông số 209), trọng lượng × 10^(thông số 208), số cái
  × 10^(thông số 196). Làm tròn hay cắt phần lẻ: [chưa biết].
- Hơn 6 phần tử, nguồn ≥ 26, hay `>` / `=` cần firmware ≥ V2.38A (cân quán đủ).

### 6.3 Tem nào dùng mã vạch nào

PLU cột 9 (kiểu) và 10 (số đầu) ≠ 0 thì dùng; không thì thông số 1 / 2 (tem một hàng), 6 / 7 (tem cộng dồn).
Thông số 54 có thể đổi nguồn. Cân quán: mọi PLU cột 9 = 10 = 0; thông số 1 = 28, 2 = 20, 208 = 3, 209 = 2.
Ô mã vạch trên tem (loại 0) cột 4 = 0 → dùng kiểu đã chọn. Kiểu 1–9 có thể khác nhau theo vùng / firmware →
muốn chắc thì dùng kiểu người dùng 10–99 (như 28).

### 6.4 Đọc mã 2+5+5+1 của quán (cho FABi và kho)

Với BAR 28, kiểu 0 → 12 chữ số dữ liệu → EAN-13. Cấu hình lấy từ file thật; kho đọc nhãn theo đúng mẫu
này (`web/src/lib/kho/ma-vach.ts`, mặc định `2XCCCCCWWWWWK`, có ô "Thử một nhãn" để so với nhãn thật):

```
 2 0 C C C C C W W W W W K
 └┬┘ └───┬───┘ └───┬───┘ └ số kiểm EAN-13
 số đầu  mã hàng   trọng lượng tính bằng gram (thông số 208 = 3)
 (thông số 2)  (PLU cột 2, 5 chữ số)
```

Cách đọc:

1. Đúng 13 chữ số; chữ số đầu "2" (mã nội bộ 20–29).
2. Số kiểm: nhân 12 chữ số đầu lần lượt với 1, 3, 1, 3… (từ trái), cộng lại; số kiểm = (10 − tổng mod 10)
   mod 10 (`tinhSoKiemTra`).
3. Hai số đầu `20` = thông số 2.
4. Chữ số 3–7 = **mã hàng** = mã cân = mã món trên FABi.
5. Chữ số 8–12 = trọng lượng gram → kg = số ÷ 1000.

Ví dụ: mã 10001, 0,215 kg → `201000100215` + `4` = `2010001002154`; 0,070 kg → `2010001000709`.

FABi đọc mã hàng và trọng lượng, tự tính tiền theo giá của nó — **không đọc giá trên tem**. Vì vậy mỗi mức
giảm giá cận date là **một mã hàng riêng** (từ 90001) trên cả cân lẫn FABi.

Giới hạn và bẫy:

- Trọng lượng tối đa 99,999 kg; vượt thì theo tràn mã 0 → không in mã vạch [suy luận].
- Mã hàng tối đa 5 chữ số; mã 6 chữ số bị **cắt** (tràn mã 1) [suy luận] → repo chặn mã dài hơn số chữ `C` của
  mẫu (`soChuSoMa`).
- Mã hàng 0: thông số 121 (cân quán = 1) coi mã 0 là "hàng cân tạm" khi cân đọc lại mã của chính nó → giữ mã
  ≥ 1.
- **Hàng đếm cái** (đơn vị 2): ô J in số cái × 10^(thông số 196 = 3) → 1 cái in `01000`, FABi sẽ đọc thành
  1,000 kg [suy luận, **chưa thử trên cân thật**] — thử bằng một tem hàng đếm trước khi bán theo cái.
- Nhật ký bán không có chuỗi mã vạch; dựng lại được bằng công thức trên (§9.6).
- Thông số 209 (số lẻ tiền trong mã vạch) không ảnh hưởng BAR 28 (không có ô tiền).

---

## 7. Phím tắt — `SCP`

`SCP⇥<trang>⇥<phím>⇥<PLU>⇥` (5 phần tử).

| Cột | Nghĩa |
|---|---|
| 1 | **Trang (tầng)**: 0 = bấm thẳng · 1 = Shift + phím · 2 = tầng thứ ba (cách bấm trên cân chưa có tài liệu) |
| 2 | **Số phím** in trên phím (SC1, SC2…); phím 0 là phím giả của phần mềm, bỏ qua |
| 3 | > 0: **số PLU** (không phải mã hàng) · 0: phím trống · < 0: **phím chức năng** (−mã chức năng) |

- Cân quán: trang 0 phím 1–73, trang 1 và 2 phím 1–63 [file thật]. Phần mềm hãng mặc định chỉ tạo 2 × 64 dòng
  — không được giả định.
- **Bàn phím có cột** (loại KA / KAB): 63 phím chữ SC1–SC63, thêm **SC64–SC73 là phím chức năng in sẵn**: Shift,
  Auto Mode, Manual Weight, Paper Type, Re-Print, −%, −Num, @Price, T-Sale, Drawer. Bàn phím không cột (KAD):
  SC1–SC40 + SC41–SC48 (@Price, T-Sale, ±%, Auto Mode, CCard, Drawer, Shift, Re-Print). Trang 0 của cân quán
  có 73 phím → bàn phím có cột [suy luận]. **Không bao giờ ghi trang 0 phím 64–73** (đè Shift, ngăn kéo…);
  `thong-so.ts`: `PHIM_CHU_TOI_DA = 63`, `PHIM_TANG_0_TOI_DA = 73`.
- Chữ in trên phím (KA / KAB): 1–26 = a…z, 27 dấu cách, 28 `<`, 29 `=`, 30 `>`, 31 `!`, 32 `?`, 33 `.`, 34 `,`,
  35 `;`, 36 `+`, 37 `-`, 38 `*`, 39 `/`, 40 `(`, 41 `)`, 42 `{`, 43 `}`, 44 `[`, 45 `]`, 46 `‘`, 47 `“`, 48 `@`,
  49 `#`, 50 `&`, 51 `$`, 52 `%`, 53 `^`, 54 dấu huyền `` ` ``, 55 `:`, 56 gạch đứng, 57 `\`, **58 `_`**
  (công cụ HTML cũ ghi nhầm là gạch dài), 59 `~`, 60 End, 61 Delete, 62 Insert, 63 IME (`NHAN_PHIM`).
  Bàn phím 40, 30, 10 phím có chữ khác.
- **Xoá phím**: file và mạng của hãng **không có** `CLR⇥SCP⇥` (chỉ dây RS-232 có); dòng không gửi giữ giá trị
  cũ → muốn bỏ phím phải ghi **tường minh** `SCP⇥p⇥k⇥0⇥`.
- Mã chức năng (giá trị âm, `CHUC_NANG_PHIM`): 1–10 số 0–9 · 11 "00" · 68 "000" · 12 Clear · 13 Cancel ·
  14 Accu/Confirm · 15 Cash/Print · 16 PLU · 17 F-Prog · 18–21 V1–V4 · 22 Amend · 23 × · 24 Feed · 25 về 0 ·
  26 trừ bì · 27 Sale · 28 Prog · 29 Account · 30 Time · 31 −% · 32 −Num · 33 @Price · 34 T-Sale · 35 ngăn kéo ·
  38 cân tay · 39 loại giấy · 40 in lại / in trước · 41 Shift · 44 in hoá đơn 2 · 45 thẻ · … · 52–57 các chế độ ·
  62 bật / tắt · 63–65 thanh toán 1–3 · 66 VIP · 69 trả hàng theo FID · 76–79 thông tin tuỳ biến 1–4.
  Chương trình không ghi phím chức năng.
- Trên cân: `P14 scPLU` gán PLU, `P15 scFuc` gán chức năng; thông số 81 cho phép F-Prog + phím. Thông số 88
  (cân quán 0) là cách gán tự động theo số học (SC1 → PLU 101…).

---

## 8. Thông số quan trọng

"Cân quán" = giá trị trong file thật 26/09/2026. Menu đầy đủ trong chương trình: `THONG_SO` (`thong-so.ts`).
Danh mục của hãng ghi phạm vi không phải lúc nào cũng đúng (ví dụ thông số 30 gốc = 270 dù ghi "0~255") —
**không ép giá trị theo chữ phạm vi**.

| Số | Nghĩa | Các giá trị | Cân quán | Ghi chú |
|---|---|---|---|---|
| 0 | Mẫu tem một hàng (hoá đơn 1) | 0 không in, 1–99 | **28** | chỉ xem |
| 1 | Kiểu mã vạch tem một hàng | 0–99 | **28** | chỉ xem |
| 2 | Số đầu mã vạch | 0–9.999.999 | **20** | chỉ xem |
| 3 | Số bản in mỗi lần | 0–99 (0 = không tự in) | 1 | |
| 5 / 6 / 7 | Tem / mã vạch / số đầu của tem cộng dồn | như 0 / 1 / 2 | 4 / 7 / 2099999 | |
| 21 | Loại giấy | 0 giấy thường · 1 giấy tem có khe | 1 | bàn phím không có phím Paper Type thì đổi ở đây |
| 22 / 23 | Độ đậm in (giấy tem / giấy thường) | 0–15 | 9 / 9 | |
| 40 | Số máy | 0–9.999.999 | 0 | |
| **42** | Tự nạp USB lúc bật (`A_xxx.TMS`) | 0 / 1 | 1 | chỉ xem + cảnh báo (§2.7) |
| 43 | Kết nối mạng | 0 tắt · 1 cân là máy chủ · 2 cân là máy khách | 1 | **không sửa** (sửa thông số / `kiemKhoiGhi` chặn; gửi cả file qua 33571 mang lại nguyên giá trị trong file gốc) |
| 45 | Áp cài đặt mạng ngay | 0 / 1 | 1 | đổi thông số mạng là mạng cân khởi động lại |
| 48 | Quá giờ mạng (giây) | 0–31 | 10 | [suy luận] quá 5 lần thì cân ngắt |
| 49 | Cho phép thao tác qua đường truyền | 0 chỉ tại chỗ · 1 cho phép | 1 | ảnh hưởng mật khẩu qua mạng [suy luận] |
| 50 | Kiểu mạng | 0 dây · 1 WiFi · … 7 | 1 | **không sửa** (như 43) |
| 54 | Nguồn mẫu tem / mã vạch | 0, 1, 2, 10, 11, 12, 20, 21, 22 | 0 | §5.9 |
| 58 | Cân tự báo (+1 nhật ký mới, +2 hỏi PLU) | | 1 | phần mềm hãng ghi mỗi lần nối (§10.2.7) |
| 69 | Phải về 0 giữa hai lần cân | 0–4 | 1 | |
| 74 | Trả hàng | cộng bit | 0 | tắt → không có loại 1 |
| 92 | Dải số PLU | | 1 | sách cân: 1 = PLU người dùng từ 1 (0 = 10–5.999); danh mục mới của hãng gọi khác ("Dummy Number") → nghĩa trên V3.14E8 [suy luận] |
| 100 / 101 | Làm tròn tiền một hàng / tổng | 0–11 (với 3 số lẻ: 2 = tròn 100 đ) | 0 / 0 | |
| **104** | **Kiểu ngày giờ** | 0 `YYYY.MM.DD` · 1 `YY.MM.DD` · 2 `MM/DD/YY` · 3 `MM-DD-YY` · **4 `DD/MM/YY`** · 5 `DD-MM-YY` · 6–10 lịch Ba Tư · +100 = đồng hồ 12 giờ | **0** | Không có `DD/MM/YYYY`. Trên cân: `Prog 1 2 × 104 Confirm`. Màn cân chỉ theo 104 khi 266 = 1 |
| **105** | Cách in hạn sử dụng | 0–6 (§4.1) | 0 | |
| **106** | Số ngày hạn sử dụng chung | 0–999 | 0 | |
| 118 | Xoá hàng khỏi phiếu | 0–3 | 3 (có ghi nhật ký → loại 3) | |
| 120 / 121 | Cân đọc mã vạch của chính nó / cách xử lý mã hàng 0 | | 3 / 1 | §6.4 |
| 131 | Tự làm gì khi về 0 | 0–6 | 1 (tự ghi lần cân chưa in) | trình cài đặt hãng đặt 1 do sơ suất |
| 140 | Tự đặt lại số phiếu (SID) | 0 không · 2 mỗi ngày… | 2 | |
| 143 | Số chữ số FID / SID in | | 6 | |
| 166–169 | Cổng 33581 / 33582 / 33583 / 33584 | | 33581… | **không bao giờ sửa** |
| 150–165, 430–441 | Địa chỉ IP, cổng mạng, mặt nạ (chính / phụ) | 153 = 0 là tự cấp | | **không sửa** (như 43) — sai là cân rời mạng tới khi sửa tay |
| 180 / 181 | Dấu thập phân / dấu nghìn khi in | | 0 / 0 | giữ 0: dấu chấm đọc như dấu nghìn kiểu Việt |
| 185–187 | In đơn vị sau trọng lượng / đơn giá / tiền | 0 / 1 | 1 / 1 / 1 | |
| 188 / 189 | Số chữ số đơn giá / thành tiền trên màn | 0 tự, 1–7 | 6 / 7 | → đơn giá tối đa 999.999 đ/kg; 188 = 7 có dùng được không [chưa biết] |
| 196 / 208 / 209 | Số lẻ số cái / trọng lượng / tiền trong mã vạch | 0–5 | 3 / 3 / 2 | chỉ xem (§6) |
| 201 | Số lẻ trọng lượng | | 3 | |
| **202 / 203** | **Số lẻ đơn giá / thành tiền** | 0–5 | **3 / 3** | chỉ xem — đổi là sai hết giá |
| 249 | Bộ nhớ mỗi PLU | 0–4 | 0 | §4.3 |
| 250 | Cộng dồn | 0 thường · 1 Accu như Print · 2 cộng một lần | 1 | |
| 264 | Bán ở chế độ tự động ghi loại 5 | cộng bit | 0 | |
| 265 / 266 | Tháng in bằng chữ / màn theo 104 | 0 / 1 | 0 / 0 | |
| **283** | Ghi cả lần cân chưa in tem | 0 / 1 | **1** | → loại 2 trong nhật ký |
| 290–293 | Ô chữ 1–4 của dòng nhật ký | 0 rỗng · 1 tên · 2–8 chữ 1–7 · **9 mã hàng** · … | 0 | đặt 290 = 9 để nhật ký có mã hàng [chưa thử] |
| 499 | (chưa rõ) | | 1522729470 | **không bao giờ sửa** |

`suaThongSo` chỉ cho sửa những số trong `THONG_SO` không có cờ `chiXem`; `kiemKhoiGhi` (`giao-thuc.ts`) chặn
thông số mạng 43–53, 150–173, 430–441 — **chỉ trên đường ghi 33581**. Gửi cả file qua 33571 (danh mục, tự gửi, tem,
file web) và file USB mang lại nguyên văn các dòng mạng có trong file gốc (§3.2); file gốc đọc qua WiFi (`docTuCan`)
không giữ các dòng này.

---

## 9. Nhật ký bán — `REP` / `RES` / `REE`

### 9.1 Dạng dòng

```
REP⇥yy⇥M⇥d⇥H⇥m⇥s⇥<FID>⇥<SID>⇥<người bán>⇥                      (đầu giao dịch, 11 phần tử)
RES⇥<SubID>⇥<thành tiền>⇥<PLU>⇥<nhóm>⇥<bộ phận>⇥<giá vốn>⇥<số lượng>⇥<đơn vị>⇥<loại>⇥<thuế>⇥
   <chữ 1>⇥<chữ 2>⇥<chữ 3>⇥<chữ 4>⇥<đơn giá>⇥<FID liên quan>⇥<tên hàng>⇥   (một dòng, 19 phần tử)
REE⇥                                                                (cuối giao dịch)
```

- REP cần ≥ 10 cột, RES ≥ 18 cột; thiếu thì phần mềm hãng bỏ **cả lần nhập**.
- **FID** = số giao dịch của cân, tăng dần, mỗi lần cân (in tem hay không, kể cả sự kiện) một số. **SID** =
  số phiếu trong ngày (0 với dòng không phải bán đã xác nhận). Người bán = 0 trên cân quán.
- SubID ≥ 1 = dòng hàng, đánh số liền 1, 2, 3…; SubID 0 = dòng thanh toán / giảm giá (loại 0, 1, 10, 11) hoặc
  sự kiện (loại ≥ 255).
- Số lượng: kg hay cái theo đơn vị (cân quán ghi 3 = kg, 2 = cái). Tiền: §2.4 (đơn giá theo thông số 202,
  thành tiền / giá vốn / thuế theo 203).

### 9.2 Loại (cột 9 của RES) — `TEN_LOAI`

| Loại | Nghĩa | Tính kho? |
|---|---|---|
| 0 | **Bán** (đã in tem) | **có** (trừ) |
| 1 | **Trả hàng** (cân quán tắt: thông số 74 = 0) | **có** (theo dấu cân gửi) |
| 2 | **Cân chưa in tem** (do thông số 283 = 1); lượng có thể âm | không |
| 3 | Đã xoá khỏi phiếu (thông số 118) | không |
| 4 | Treo phiếu | không |
| 5 | Bán ở chế độ tự động (khi thông số 264 ≠ 0) | không (phần mềm hãng cũng bỏ) |
| 6–9, 15 | Dự phòng | không |
| 10 / 11 / 12 / 13 / 14 | Nhập kho / xuất kho / kiểm kê / đặt hàng / hao hụt | không |
| 252–254 | Sản xuất / tách thùng (phần mềm máy tính tự sinh) | không |
| 255, 256 | Lỗi / lỗi không rõ | sự kiện |
| 257 / 258 / 259 | Mất FID / trùng FID / khởi động lại bất thường | sự kiện |
| 308 | A52 — xoá toàn bộ báo cáo | sự kiện; FID có thể đếm lại [suy luận] |
| 777–780 | P521–P524 — khôi phục cài đặt gốc | sự kiện; FID có thể đếm lại [suy luận] |
| 1249 / 1253 / 1254 | E9.93 / E9.97 khởi tạo lại bộ nhớ / **E9.98 nâng cấp firmware** (chữ 1 = firmware) | sự kiện |

Quy tắc sự kiện: **loại = 256 + mã** → mã chưa có tên hiện thành `E<mã ÷ 100>.<mã mod 100>` (`tenLoai`).

### 9.3 PLU hệ thống

9.999.999 hàng cân tạm · 9.999.998 hàng đếm tạm · 9.999.997 phí dịch vụ · 9.999.996 giảm giá và làm tròn ·
9.999.995 thẻ · 9.999.994 / 93 / 92 thanh toán 1–3 · 9.999.991 thanh toán tại cửa hàng · 9.999.981 Alipay ·
9.999.982 WeChat · 9.999.983–88 ví điện tử 2–7. Từ 9.999.981 trở lên **không** phải hàng (`PLU_HE_THONG`).

### 9.4 Tên hàng là tên LÚC ĐỌC — bẫy lớn nhất

- Cột 17 (tên hàng) do cân **tra bảng PLU hiện tại lúc xuất nhật ký**, không phải lúc bán. Số lượng, đơn vị,
  đơn giá, thành tiền là của lúc bán. Chứng cứ [file thật]: FID 2–6 của cân quán, phần mềm hãng đọc năm 2024 và
  file USB năm 2026 — mọi con số giống hệt, chỉ tên khác.
- **Mã hàng không có trong nhật ký** (trừ khi thông số 290–293 = 9; cân quán 0).
- Số PLU đã bị dùng lại cho hàng khác: nối thẳng "PLU → mã hàng hôm nay" thì 20 / 36 dòng hàng thường trong
  file thật **không khớp** đơn giá / đơn vị.
- → `bao-cao-can.ts`: chỉ gắn mã hàng khi đơn giá và cách bán của dòng khớp dòng PLU lúc đọc (`pluLucDoc`);
  không khớp thì để trống; gộp theo khoá MAC + FID + giờ + SubID và **giữ bản đọc sớm nhất** (`gopNhatKy`);
  đọc thường xuyên, nhất là **ngay trước** khi gửi giá / hàng mới xuống cân.

### 9.5 Tính kho

Chỉ loại 0 và 1, SubID ≥ 1, PLU < 9.999.981 (`tinhKho`). Phần mềm hãng: biến động kho = −số lượng cho cả loại
0 lẫn 1, không đảo dấu → trả hàng chỉ cộng lại kho nếu cân gửi số lượng âm [suy luận; chưa có mẫu].

File thật (FID 2–42, mỗi FID một dòng RES): 1 sự kiện (FID 2, loại 1254), **21 loại 0**, **19 loại 2**, không
có loại 1 / 3. Trong 21 dòng bán, 4 dòng là PLU hệ thống 9.999.998 / 9.999.999 (FID 3, 4: thử của nhà máy;
FID 29: 9 cái giá 455; FID 30: 9,000 kg giá 0) → chỉ **17 dòng bán hàng thật**.

### 9.6 Đọc ở đâu, xoá thế nào

- **USB**: phần `DWL⇥REP⇥` … `END⇥REP⇥` của file lưu bằng Amend (mọi giao dịch còn trong bộ nhớ). Phím
  **PLU** ở P41 lưu nhật ký "chưa tải", **F-Prog + PLU** lưu mọi nhật ký còn giữ.
- **Mạng**: `UPL⇥REP⇥-N⇥` qua cổng 33581 (§10.2.6) — **chưa thử trên cân thật** với chương trình mình.
- Đọc **không xoá** gì trên cân. Không có lệnh mạng nào xoá nhật ký. Chỉ bàn phím xoá: **A52 + mã 9958**
  (không hoàn tác, để lại sự kiện 308), hoặc khôi phục gốc P52x. Bộ nhớ giữ khoảng 6.000–10.000 giao dịch, đầy
  thì bỏ cái cũ nhất (E7.30 = đầy).
- FID 1 không bao giờ được trả: bản ghi đầu tiên của mọi cân thấy được là FID 2, sự kiện 1254.
- Đếm lại FID sau A52 / P52x / E9.97 [suy luận] → khoá gộp có cả giờ nên không lẫn; đọc qua WiFi tự nhận ra (§10.2.6).
- Dựng lại mã vạch của một dòng bán: `EAN13("20" + mã hàng 5 số + gram 5 số)` [suy luận mạnh; so với một nhãn
  thật trước khi tin].
- **Không bao giờ gửi lại phần REP xuống cân.** Lần nạp lại 25/09/2026 có mang REP mà file sau đó vẫn không
  trùng FID — không có hại thấy được, nhưng chưa chứng minh cân bỏ qua.

---

## 10. Mạng LAN

### 10.1 Cổng 33571 — một chiều — [đã thử] 26/09/2026, V3.14E8

- Không có trong phần mềm TM-xA v3.10 hay trong sách của hãng (tìm cả mã dịch ngược lẫn chữ trong sách: không
  có); thông số nào quy định cổng này: [chưa biết].
- Cách gửi (`guiTcp`, `Nap-Can-WiFi.ps1`): mở TCP tới `<IP cân>:33571`, gửi **nguyên nội dung file dạng USB**
  (đã bỏ `TIM`), đóng chiều gửi. **Cân không trả lời gì.**
- Kết quả: cân nạp dòng PLU — **chỉ thêm và sửa, không xoá** hàng vắng mặt. → Hàng "còn nằm lại" phải xoá bằng
  nạp USB (file đủ danh sách) hoặc trên cân (P33, mã 9958).
- "Gửi hết byte" ≠ "cân đã lưu": không có xác nhận → kiểm bằng cách gọi thử một hàng trên cân / in một tem.
  **[đã thấy] 02–03/10/2026:** chương trình (2.5) ghi nhận đã gửi 69 hàng kho, file gốc và `tren-can.tsv` ghi "khớp kho".
  Cân thật lưu ra USB ngày 03/10 chỉ có 7 hàng: PLU 1–6 cũ và PLU 99 (hàng thử ngày 26/09). Gọi số PLU kho trên cân thì cân
  báo lỗi (tít tít, về 0). Vì sao lần gửi đó cân không lưu: [chưa biết]. → Từ 2.6, gửi xong chương trình đọc lại PLU qua
  33581 để kiểm (`xacNhanSauGui`, README mục "Bản 2.6").
- **[đã thấy] 03/10/2026 (2.6.0):** cân bỏ qua MỌI lần gửi qua 33571 — cả 69 hàng mới, cả lần chỉ sửa giá 4 dòng; đọc
  lại qua 33581 thấy cân vẫn giá cũ; nạp USB thì nhận. → Từ 2.6.1 gửi hàng qua 33581 (`DWL PLU` + hàng rào, như hãng),
  33571 chỉ còn là đường lui (README mục "Bản 2.6.1").
- Trong WiFi của quán chỉ cân mở cổng này → `tim-can.ts` tìm cân đổi địa chỉ bằng cách thử nối 33571 cả dải
  /24 (không gửi gì).
- **Chưa thử trên cân thật qua 33571**: phần LAB (đổi tem qua WiFi), file nhỏ chỉ có TMS / SCP (`fileNho`),
  `CLR`, BOM ở đầu luồng. Luồng gửi của 2.1 mang cả TMS (500 dòng), TMT, REP, INF (chỉ bỏ `TIM`): chưa thấy hại
  gì, nhưng cân làm gì với các phần đó qua cổng này thì [chưa biết].

### 10.2 Cổng 33581 — giao thức hai chiều của hãng — [hãng], **chưa thử trên cân thật với chương trình mình**

Code: `giao-thuc.ts` (`moKetNoi`, `docTuCan`, `KetNoiCan`), cân giả `test/can-gia-hai-chieu.ts`. Mọi câu lỗi chỉ
đường lui USB.

#### 10.2.1 Đường truyền

- Cân là **máy chủ TCP** ở cổng thông số 166 (= 33581) khi thông số 43 = 1 (cân quán = 1). Thông số 43 = 2 thì
  ngược lại: cân nối tới máy tính ở cổng 33582.
- Chỉ là các dòng chữ như file (§2): UTF-8 (theo `INA`), CRLF, tab cuối dòng. Không khung nhị phân, không độ
  dài, không mã kiểm, không ACK / NAK từng dòng, **không đăng nhập**. Độ tin cậy nhờ TCP.
- Dòng từ cân: đọc tới LF, bỏ CR, bỏ dòng trống. Mọi vòng đọc của hãng dừng ở dòng có **cột 0 đúng bằng**
  `END` (không phải "bắt đầu bằng END"). Trong câu trả lời `UPL⇥LAB⇥`, sau mỗi `LAB` đọc `LAS` tới `LAE` (bỏ qua
  `END` ở giữa).
- Hãng chờ mỗi lần đọc / ghi tối đa 30 giây rồi bỏ kết nối.

#### 10.2.2 Bắt tay khi mở kết nối

1. Máy tính ghi một dòng trống. Bộ ghi của hãng gần chắc chắn đặt BOM trước đó: byte đầu là `EF BB BF 0D 0A`
   [suy luận mạnh, theo cách .NET ghi luồng mạng].
2. `UPL⇥MAC⇥` → cân trả `MAC⇥<b0>⇥<b1>⇥…⇥<b5>⇥` (6 byte **thập phân**, ví dụ `0⇥35⇥240⇥…` → `0023F0…`) rồi
   dòng `END`. Hãng hỏi lại tới khi có dòng MAC; sau MAC **không** gửi `UPL⇥END⇥`.
3. `UPL⇥INF⇥` → cân trả `INF`, `INA`, `INM` (thứ tự bất kỳ) rồi `END`; máy tính đáp `UPL⇥END⇥`. Cột 3 của INF
   (số máy) phải là số nguyên khác −1, không thì hãng bỏ kết nối. INM cột 2 (nếu có) thay cho MAC ở bước 2.
4. Cân báo bảng mã khác bảng mã đang dùng → hãng dựng lại bộ đọc / ghi và bắt tay lại.

#### 10.2.3 Đọc một phần: `UPL`

```
máy tính → UPL⇥<PHẦN>⇥
cân      → các dòng của phần …          (hãng chỉ giữ dòng có cột 0 = <PHẦN>; LAB giữ LAB/LAS/LAE)
cân      → END…
máy tính → UPL⇥END⇥
```

Phần đọc được: TMS, TMT, SCP, DPT, CLS, PLU, BAR, LAB, SAL (VIP, thẻ tuỳ biến). Cân có bọc câu trả lời bằng
`DWL…END`, có BOM, dùng CRLF hay LF: [chưa biết] → code chấp nhận mọi dạng. `docTuCan` ghép các phần đọc
được thành file dạng USB (`ghepFileUsb`, thứ tự như file cân tự lưu, không BOM).

#### 10.2.4 Ghi: `DWL` / `CLR` rồi **hàng rào**

```
máy tính → ␍␊
máy tính → [CLR⇥PLU⇥ / CLR⇥END⇥]          ← xoá cả bảng — chỉ khi thật sự muốn
máy tính → DWL⇥<PHẦN>⇥ / các dòng … / END⇥<PHẦN>⇥
          (cân không trả lời gì)
máy tính → ␍␊ UPL⇥TIM⇥                    ← hàng rào
cân      → TIM⇥yy⇥M⇥d⇥H⇥m⇥s⇥ rồi END…
máy tính → UPL⇥END⇥
```

- Hàng rào chỉ chứng minh **thứ tự** ("cân đã xử lý tới đây"), **không** kiểm nội dung: hãng đọc dòng giờ rồi
  bỏ đi. Muốn chắc cân đã lưu đúng → `UPL` phần đó và so.
- Hãng dừng ở dòng `END` **đầu tiên** trong hàng đợi — nếu cân có xác nhận từng khối bằng một dòng `END`, hàng
  rào của hãng dừng sớm mà không biết. Code mình chờ dòng `TIM` **rồi mới** tới `END` của nó.
- Hãng chờ 30 giây sau byte cuối; nạp nhiều PLU có thể cần lâu hơn → code chờ 60 giây (`choHangRaoMs`).
- Hãng có nút "Cancel" giữa chừng: vẫn ghi `END` của khối nhưng bỏ hàng rào → sau `CLR` là bảng thiếu. Code
  mình không cho dừng giữa `CLR` và hết khối `DWL`.
- `kiemKhoiGhi` chỉ cho: khối DWL của TMS, TMT, SCP, DPT, CLS, PLU, BAR, LAB, SAL; `CLR` chỉ với PLU; không
  thông số mạng, không TMT 15 / 16 / 19; mọi dòng đã là chuỗi byte, không CR / LF ở giữa.

#### 10.2.5 Giờ

- Đọc: `UPL⇥TIM⇥` → `TIM⇥yy⇥M⇥d⇥H⇥m⇥s⇥`, `END`; đáp `UPL⇥END⇥`.
- Đặt: `␍␊ DWL⇥TIM⇥ / TIM⇥26⇥9⇥29⇥14⇥5⇥9⇥ / END⇥TIM⇥` (2026-09-29 14:05:09; không đệm 0, năm 2 số), không có
  trả lời → hàng rào (đọc lại giờ luôn). `datGio` coi là chưa nhận nếu giờ đọc lại lệch quá 2 phút.
- Trên cân: `Prog 1 1`.

#### 10.2.6 Nhật ký bán qua mạng

- `UPL⇥REP⇥-N⇥` — N = **FID đầu tiên muốn lấy, gồm cả N** (dữ liệu của hãng chứng minh cho dạng có dấu trừ).
  Firmware ≥ 2.38 (cân quán V3.14) dùng dấu trừ; nghĩa của chính dấu trừ và của dạng không dấu: [chưa biết].
  Hãng hỏi từ FID đã có + 1; "gửi hết" hỏi từ 1. Beeftown Cân hỏi **từ chính FID cuối đã lưu** (`nhatKyCan`): còn thấy
  giao dịch đó (cùng FID, cùng giờ) thì cân chưa đếm lại; không thấy (đếm lại sau A52 / P52x / E9.97, hay giao dịch cũ
  đã bị đẩy ra) thì đọc lại từ 1 trên cùng kết nối và báo — không phải nhớ tích "Đọc lại từ đầu".
- Cân trả các dòng REP / RES / REE rồi `END`; máy tính đáp `UPL⇥END⇥`.
- **Đọc cho tới khi hai lần liền khớp nhau**: lần đọc mới giống hệt lần trước (cùng số dòng RES), hoặc lần mới
  nhiều RES hơn và bắt đầu đúng bằng toàn bộ lần trước (có bán thêm trong lúc đọc — so theo nguyên dòng) → nhận
  **bản cũ hơn**. Tối đa 11 lần, lần thứ n nghỉ n × 100 ms. Câu trả lời rỗng nhận ngay. Xong gửi thêm một
  `UPL⇥END⇥`. (`docBaoCao`.)
- Hãng chỉ hỏi khi cân đã gắn vào nhóm kho trong cơ sở dữ liệu báo cáo — đó là quy tắc của phần mềm, không phải
  của cân.

#### 10.2.7 Cân tự báo — `ASK`

- Thông số 58: +1 = cân tự gửi `ASK⇥REP…` khi có nhật ký mới; +2 = cân gửi `ASK⇥PLU⇥<PLU>⇥<mã>⇥<mã vạch ngoài>⇥`
  để hỏi một PLU.
- Phần mềm hãng ghi `DWL⇥TMS⇥ / TMS⇥58⇥1⇥ / END⇥TMS⇥` **mỗi lần nối** → cân quán đang 58 = 1 và giữ mãi (tắt
  bên phần mềm không đặt lại trên cân). Cân vì thế có thể đẩy `ASK` tới bất kỳ ai đang nối, kể cả chương
  trình mình → **bộ đọc phải bỏ qua mọi dòng bắt đầu bằng `ASK⇥`**. Muốn tắt: ghi `TMS⇥58⇥0⇥` [chưa thử].

#### 10.2.8 Không có

- **Không có lệnh xoá một PLU.** Xoá = `CLR⇥PLU⇥` + `CLR⇥END⇥` + `DWL⇥PLU⇥` **cả danh sách** + `END⇥PLU⇥`
  (`khoiXoaVaNapPlu`, chặn danh sách rỗng) — **chưa thử trên cân thật**; hoặc nạp USB (đã thử), hoặc P33 trên cân.
- Không có lệnh xoá nhật ký, không có lệnh khởi động lại cân (đổi thông số mạng khi 45 = 1 là cách duy nhất làm
  mạng cân khởi động lại), không có mật khẩu, không có mã kiểm.
- Không có lệnh đặt IP theo MAC qua UDP: đặt IP cần một kết nối TCP sẵn có.

#### 10.2.9 Đồng thời

Mỗi cân chỉ chạy một việc một lúc (hãng cũng vậy). Cân có nhận hai máy tính cùng nối không: [chưa biết] →
**đóng TM-xA trên mọi máy** trước khi chương trình mình nối.

### 10.3 UDP 33583 / 33584 — tìm cân

- Hãng: máy tính mở UDP ở cổng **33584**, gửi 5 lần 6 byte `UDP⇥␍␊` (`55 44 50 09 0D 0A`) tới
  `255.255.255.255:33583`. Cân trả `UDP⇥<cổng TCP>⇥…` tới cổng **33584** của máy tính (cổng đích cố định theo
  thông số 169, không theo cổng nguồn); máy tính nối TCP tới địa chỉ gửi, cổng đó.
- **Quan sát ở quán** [đã thử, nhóm trước]: cân **tự phát** `UDP⇥33581⇥⇥␍␊` khoảng mỗi 15 giây, từ UDP 33583
  tới `255.255.255.255:33584`.
- UDP không mang MAC, model hay firmware → lấy qua TCP (`UPL⇥MAC⇥`, `UPL⇥INF⇥`). Nhận diện cân bằng **MAC**, không
  bằng IP (DHCP đổi IP).
- Nghe cổng 33584 trên Windows làm hiện hộp hỏi tường lửa với nhân viên quầy; TM-xA chạy cùng máy có thể giành
  mất gói → bản 2.1 tìm cân bằng dò TCP 33571 thay vì nghe UDP.

### 10.4 Phần mềm hãng (TM-xA) tự làm gì khi nối cân

Nếu TM-xA đang chạy trên một máy trong quán, nó tự:

1. Lúc mở: thử nối từng địa chỉ đã lưu (`IP:33581`), phát UDP tìm cân, nghe UDP 33584 suốt, mở cổng 33582
   cho cân ở chế độ máy khách.
2. Mỗi kết nối mới: bắt tay (§10.2.2).
3. Chuỗi việc "khi online" (file `AutoTask.xml` đi kèm):
   - **Đặt đồng hồ cân theo giờ máy tính** (`DWL TIM`) — máy tính sai giờ là cân sai giờ, sai ngày in và hạn
     sử dụng.
   - Kéo nhật ký bán (`UPL REP`) nếu cân đã gắn nhóm kho và có dưới 16 cân online.
   - Ghi **thông số 58 = 1**.
4. Nghe nền: `ASK REP` → kéo nhật ký ngay.
5. **Thử kết nối mỗi 30 giây** bằng `UPL TIM` (chỉ với cân có đủ tên quán, tên cân, số máy, model).
6. Việc hẹn giờ "Download data" dùng **các ô đang tích trên cửa sổ**, kể cả "Clear old data" → một TM-xA bị bỏ
   quên có thể định kỳ **xoá rồi gửi lại** các bảng sau lưng chương trình mình. Kiểm `AutoTask.xml` trên máy có
   TM-xA.

→ Trước khi chương trình mình nối 33581: **đóng TM-xA trên mọi máy**; nếu quán vẫn dùng TM-xA thì đồng hồ máy
đó phải đúng và không có việc hẹn giờ "Download data".

### 10.5 Lệnh nguy hiểm — không bao giờ gửi từ chương trình mình

| Lệnh | Hậu quả |
|---|---|
| `CLR⇥TMS⇥`, `CLR⇥TMT⇥` | Đặt lại mọi thông số / chữ chung, kể cả mạng [suy luận] → cân có thể rời WiFi |
| `CLR` bảng khác ngoài PLU | Mất cả bảng; không hoàn tác, không xác nhận; đứt mạng giữa chừng là bảng thiếu |
| TMS 43–53, 150–173, 430–441 | Cân rời mạng tới khi sửa bằng tay / USB (45 = 1: áp ngay) |
| TMT 15 / 16 / 19 | Sai tên / mật khẩu WiFi → cân rời mạng |
| `DWL⇥TIM⇥` từ file cũ | Đặt lùi đồng hồ → sai ngày in, hạn sử dụng, thứ tự nhật ký |
| `DWL⇥REP⇥`, `DWL⇥INF⇥` | [chưa biết] (trùng nhật ký? đổi tên / số máy) |
| `DWL⇥MAC⇥` | Đổi danh tính cân, không đổi lại được |
| `DWL⇥VER⇥` | Nạp firmware, không kiểm gì → có thể hỏng cân |
| `DWL⇥FNT⇥`, `CLR⇥FNT⇥` | Hỏng phông → chữ Việt sai trên màn và tem |
| `DWL⇥PAS⇥` | Đổi mật khẩu cân → khoá người dùng |
| SCP trang 0 phím 64–73 | Đè phím chức năng in sẵn (Shift, ngăn kéo…) |

---

### 10.6 Dây RS-232 — [hãng], **chưa thử trên cân thật với chương trình mình**

Cùng văn bản như file và mạng (mục 2), đi qua cổng COM. Nguồn: `SaveForm.cs` `SaveToSerial` / `OpenFromSerial`,
`ReportForm.cs` (nhật ký qua dây), `TM-xA.exe.Config`, sách hướng dẫn V3.04A mục 5.6.3.

- **Cổng**: tốc độ theo thông số 41 của cân (0 = 300, 1 = 600, 2 = 1200, 3 = 2400, 4 = 4800, 5 = 9600 mặc định,
  6 = 19200, 7 = 38400, 8 = 57600, 9 = 115200); 8 bit dữ liệu, không chẵn lẻ, 1 bit dừng, **điều khiển luồng XOn/XOff**
  (cài mặc định của hãng); hãng không bật DTR / RTS. Bảng mã như đường mạng (UTF-8 ở máy của quán), xuống dòng CRLF.
- **Trên cân**: phải vào `Prog → 4 → 3` (P43 RS-232) trước — cân chỉ nghe dây khi đang ở màn hình đó. Sách ghi máy bản
  cơ bản chỉ có P41 (USB); cân của quán có P43 (Khánh xem 29/09/2026).
- **Gửi (hãng)**: `UPL⇥TIM⇥` → chờ tối đa 3 giây cho hơn 10 byte → đọc dòng tới dòng có cột 0 là `END` → `UPL⇥END⇥` →
  một dòng trống → các khối `DWL … END` (có `CLR⇥SCP⇥` khi tích xoá — chỉ đường dây có). **Không** có hàng rào cuối.
- **Đọc (hãng)**: `UPL⇥<PHẦN>⇥` như mạng; nhật ký bán `UPL⇥REP⇥<FID>⇥` (không có dấu `-`, không +1; `-1` = tất cả).
- **Chương trình mình** (`src/day-rs232.ts`): bắt tay như hãng nhưng chờ 5 giây và đọc tới `END` đứng **sau** dòng `TIM`;
  gửi nội dung file như đường 33571; rồi hỏi `UPL⇥TIM⇥` thêm một lần (chờ 30 giây) làm hàng rào như đường mạng —
  cân trả lời là đã đọc hết dữ liệu trước đó, không trả lời thì "chưa chắc đã nhận".

## 11. Rủi ro tổng hợp

1. **File cân chứa tên và mật khẩu WiFi dạng chữ thường** (TMT 15 / 16). Không commit, không đưa vào kiểm thử,
   không log, không gửi lên kho.
2. **"Đã gửi" không phải "đã lưu"**: 33571 không trả lời; 33581 chỉ có hàng rào thứ tự. Câu báo phải nói đúng
   mức (xem `cau-chu`). Việc quan trọng thì kiểm lại (`UPL`, gọi hàng trên cân, in thử).
3. **Xoá hàng**: 33571 không xoá. `CLR PLU` qua 33581 chưa thử — đứt mạng sau `CLR` là cân thiếu hàng giữa giờ
   bán. Luôn có bản lưu USB trước, thử lúc vắng khách, đường lui = nạp USB.
4. **Đồng hồ cân** quyết định ngày in và hạn sử dụng: không gửi `TIM` cũ; TM-xA tự đặt giờ theo máy của nó.
5. **Hạn sử dụng trên tem 28**: ô hạn dùng và chữ "HSD" đang "luôn in" trong khi mọi PLU chưa bật hạn — bật hạn
   cho một số hàng mà không đổi điều kiện in thì hàng còn lại vẫn in chữ "HSD" [chưa biết in gì kèm].
6. **Ngày dạng `YYYY.MM.DD`** (104 = 0): khách Việt đọc nhầm; 104 = 4 chỉ có năm 2 số.
7. **Mã vạch**: mã hàng > 5 số bị cắt; hàng đếm cái in số cái × 1000 vào ô trọng lượng; trọng lượng ≥ 100 kg
   không in mã vạch [suy luận]. FABi đọc sai là tính tiền sai.
8. **Nhật ký**: tên hàng là tên lúc đọc; số PLU dùng lại; FID có thể đếm lại; 19 / 41 dòng là "cân chưa in" —
   chỉ loại 0 / 1 tính kho.
9. **`A_xxx.TMS`** còn sót trên USB sẽ tự nạp lúc bật cân (42 = 1).
10. **TM-xA chạy song song** có thể: đặt giờ, ghi 58 = 1, kéo nhật ký, và (nếu có việc hẹn giờ) xoá / gửi lại
    bảng.
11. **Thông số 58 = 1** giữ mãi → cân đẩy `ASK` tới mọi kết nối.
12. **Giới hạn âm thầm**: giá > 9.999.999 thành `0,0`; tab / xuống dòng trong tên làm lệch cột; mẫu tem số 30–99
    có thể bị từ chối; tên dài có thể bị cắt.
13. **Bàn phím cân**: A51 (xoá báo cáo theo kỳ) và A54 (đặt lại số phiếu) chạy ngay, **không hỏi mã**; P33, A52,
    A53, P52x hỏi mã 9958; P5 hỏi mật khẩu quản trị (giá trị mặc định in trong sách của hãng — không ghi vào
    repo).
14. **Xuất thông số từ TM-xA mặc định** chỉ gửi 104 / 105 / 106 = 0 → đặt lại ngày về `YYYY.MM.DD`.

---

## 12. Đã thử trên cân thật / Chưa thử

| Việc | Trạng thái | Ghi chú |
|---|---|---|
| Nạp file USB do chương trình ghi (dòng PLU 69 cột, giá `m,n`) | **Đã thử** 25–26/09/2026 | Cân lưu và trả lại đúng từng cột |
| Nạp USB thay cả danh sách PLU (hàng vắng mặt bị xoá) | **Đã thử** 26/09/2026 | |
| Gửi cả file dạng USB vào **TCP 33571**: cân nạp, thêm / sửa PLU, không xoá, không trả lời | **Đã thử** 26/09/2026 | Chỉ phần PLU được xác nhận |
| Chương trình ghi nhận đã gửi qua 33571 mà cân thật không có hàng đó | **Đã thấy** 02–03/10/2026 | Chưa rõ vì sao; 2.6 đọc lại qua 33581 để kiểm |
| Cân bỏ qua gửi qua 33571 — cả 69 hàng mới, cả sửa giá 4 dòng; nạp USB thì nhận | **Đã thấy** 03/10/2026 (2.6.0) | Ngày 26/09 cổng này còn nhận; vì sao: chưa biết. 2.6.1 gửi qua 33581 |
| Đọc danh sách PLU qua **33581** (`UPL PLU`, bắt tay MAC / INF) | **Đã thử** 03/10/2026 (2.6.0) | Đọc ra đúng 7 hàng như file USB; đọc lại sau gửi chạy được |
| Nạp lại file có REP / INF / TMS 500 dòng / TMT | **Đã thử** 25/09/2026 | Không hại thấy được; chưa chứng minh cân bỏ qua |
| Cân tự phát UDP `UDP⇥33581⇥⇥` mỗi ~15 giây tới 33584 | **Đã thấy** (nhóm trước) | |
| Gửi thẳng cả file vào **33581** | **Đã thử — cân KHÔNG nạp** | Có lẽ vì thiếu trình tự của hãng |
| TM-xA của hãng nối cân này qua 33581 và đọc nhật ký (FID 2–6) | **Hãng đã làm** 17/06/2024 | Không phải chương trình mình |
| Dạng file cân tự lưu (thứ tự phần, số cột, INA / INM, LAB 1–9, SCP 73 / 63 / 63) | **File thật** 26/09/2026 | |
| Tìm cân bằng dò TCP 33571 (`tim-can.ts`) | Chưa có ghi chép thử ở quán | Chạy với cân giả |
| Việc khác qua **33581**: ghi + hàng rào (`DWL PLU` của 2.6.1), `UPL REP`, `DWL TIM` / `datGio` | **Chưa thử trên cân thật** | Chỉ với cân giả |
| `CLR PLU` + nạp lại cả danh sách qua 33581 (`khoiXoaVaNapPlu`) | **Chưa thử trên cân thật** | Nguy hiểm nhất |
| Đổi mẫu tem (LAB) qua 33571 hoặc 33581 | **Chưa thử trên cân thật** | USB thì cân nhận chắc |
| File nhỏ chỉ TMS / SCP qua 33571 (`fileNho`) | **Chưa thử trên cân thật** | |
| In hạn sử dụng (cột 27 = 1, cột 32 = n) | **Chưa thử trên cân thật** | |
| HSD đếm ngược theo lô, gửi mỗi ngày (`danh-muc-can.ts` cách b) | **Chưa thử trên cân thật** | Chỉ kiểm bằng kiểm thử |
| Điều kiện in 9 trên ô hạn dùng / chữ "HSD" | **Chưa thử trên cân thật** | |
| Thông số 104 = 4 (`DD/MM/YY`) trên tem | **Chưa thử trên cân thật** | |
| Thêm / di chuyển ô, đổi cỡ chữ trên tem (`suaTem`) | **Chưa thử trên cân thật** | |
| Sửa phím tắt (`suaPhim`), sửa thông số (`suaThongSo`) rồi nạp | **Chưa thử trên cân thật** | |
| Mã vạch hàng đếm cái; mã vạch khi tràn | **Chưa thử trên cân thật** | |
| Thông số 290 = 9 đưa mã hàng vào nhật ký | **Chưa thử trên cân thật** | |
| `XD1`, `CLR` trong file USB, dòng `UNT` | **Chưa thử** — và không cần | Không bao giờ ghi |
| Nạp USB cần bấm Accu/Confirm lần thứ ba | **Chưa thử trên cân thật** | Theo sách |

## 13. Chưa biết — và cách thử an toàn

**Trước mọi lần thử:**

1. Trên cân lưu dữ liệu ra USB (`Prog → 4 → 1`, giữ `000`, **Amend**) → giữ file này làm bản lưu (có mật khẩu
   WiFi: chỉ để trên máy ở quán).
2. Đóng TM-xA trên mọi máy.
3. Thử sau giờ bán, có người đứng ở cân.
4. Dùng **một PLU thử** (số và mã hàng không trùng hàng thật), không đụng hàng đang bán.
5. Mỗi lần chỉ đổi một thứ; kiểm bằng cách **gọi hàng trên cân / in một tem / lưu lại ra USB** — không tin câu
   báo của chương trình.
6. Đường lui: nạp lại bản lưu bằng USB sau khi bỏ phần `TIM` (và nên bỏ cả REP / INF) — kiểm file nạp không
   còn dòng `DWL⇥TIM⇥`. Sau khi nạp, màn cân phải báo **0 dòng lỗi**.
7. Thử được điều gì thì sửa bảng §12 (ghi ngày, firmware), `can-app/README.md` và `huong-dan.html`.

| Chưa biết | Cách thử an toàn |
|---|---|
| Bắt tay 33581 với chương trình mình có chạy không; cân có nhận BOM ở đầu luồng không | **Chỉ đọc**: mở kết nối, `UPL MAC`, `UPL INF`, `UPL END`, đóng. So MAC với `0023F019CFCA`, model với `TM-xA UA006 V3.14E8`. Không ghi gì. Cân im lặng → thử lại không gửi BOM. |
| Câu trả lời `UPL` có bọc `DWL…END`, BOM, CRLF hay LF | **Chỉ đọc** `UPL PLU` / `UPL LAB`; so với phần tương ứng của file USB lưu cùng lúc. |
| Cân có nhận ghi qua 33581 + hàng rào không | Ghi lại **đúng một dòng PLU y hệt** dòng đang có trên cân (không đổi gì), qua hàng rào, rồi `UPL PLU` so. Sau đó đổi giá của PLU thử, gọi hàng trên cân xem giá. |
| `CLR PLU` qua 33581 có xoá rồi nạp lại đủ không | Chỉ sau khi hai bước trên đạt. Có bản lưu USB; thêm trước một PLU thử; gửi `CLR` + **toàn bộ** danh sách hiện có **trừ PLU thử**; `UPL PLU` đếm lại: PLU thử phải mất, mọi hàng khác còn đủ và đúng giá; gọi vài hàng trên cân. Hỏng → nạp USB ngay. |
| `UPL REP -N` trả đúng nhật ký không | **Chỉ đọc** với N = FID cuối trong file USB mới lưu − 5; so với phần REP của file. |
| Đặt giờ qua 33581 | Đặt đúng giờ hiện tại (không đổi gì thật), đọc lại `UPL TIM`, xem màn cân. |
| Tắt `ASK` (58 = 0) | Không cần trừ khi `ASK` gây rối: ghi `TMS 58 0` qua 33581, đọc lại `UPL TMS`. |
| Đổi tem qua WiFi (LAB qua 33571 / 33581) | Đổi **một chữ cố định** của tem 28, gửi, in thử một tem PLU thử. Không đổi → nạp bằng USB. |
| In hạn sử dụng; cân in gì ở ô hạn khi PLU không bật hạn | PLU thử với cột 27 = 1, cột 32 = 3 → in tem, xem ngày = hôm nay + 3. PLU thử khác cột 27 = 0 → in tem xem ô hạn. |
| HSD đếm ngược theo lô đúng hạn của lô | Sau lần gửi đầu: in một tem món có lô, so HSD với hạn của lô sớm nhất trong kho. Hôm sau gửi lại, in lại: số ngày giảm 1, ngày in ra không đổi. |
| Điều kiện in 9 | Đổi ô hạn dùng và chữ "HSD" của tem 28 sang 9, in hai PLU thử (có / không hạn). |
| 104 = 4 đổi ngày trên tem | Đổi trên cân (`Prog 1 2`, `×`, `104`, Confirm, 4, Amend), in một tem, đổi lại nếu không ưng. |
| Thông số 105 chế độ "số ngày" (4–6), "PLU không đặt" | Không cần cho quán. Nếu cần: đổi 105 sau giờ bán, in PLU thử, trả 105 = 0. |
| Mã vạch hàng đếm cái; trọng lượng tràn | In tem PLU thử theo cái, quét bằng máy quét / FABi xem 5 số trọng lượng. Không thử tràn (không cân được 100 kg). |
| Làm tròn hay cắt khi đổi trọng lượng ra số trong mã vạch | Cân vài gói, so số trên tem với 5 số trong mã vạch. |
| 290 = 9 đưa mã hàng vào nhật ký | Đặt 290 = 9, in một tem PLU thử, lưu USB, xem ô chữ 1 của dòng RES. Rồi đổi mã PLU thử, lưu lại, xem dòng cũ có giữ mã cũ không. |
| Giới hạn độ dài tên | PLU thử tên 40 ký tự có dấu → xem màn và tem; lưu USB xem tên còn đủ không. |
| Nạp USB cần mấy lần Accu/Confirm | Quan sát ở lần nạp USB tới; ghi vào `huong-dan.html`. |
| Cân có nhận hai kết nối cùng lúc | **Không thử** — luôn đóng TM-xA. |
| Cân làm gì với `DWL REP` / `DWL INF`; `CLR TMS` / `TMT` về đâu | **Không thử** trên cân của quán — luôn bỏ các phần này. |
| FID có đếm lại sau A52 / P52x | **Không thử** (mất dữ liệu). Khoá gộp có giờ nên không cần biết. |
| Nghĩa bit cao của canh chữ, ô 38, thông tin lúc in 70–72, điều kiện 34–36 | Không cần — giữ nguyên byte. |
| Mẫu tem số 30–99, `XD1`, `UNT` | Không cần — dùng 10–29, không ghi hai thứ còn lại. |
