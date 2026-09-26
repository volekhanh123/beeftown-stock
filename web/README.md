# Beeftown — Website

Trang công khai của Beeftown. Astro 7 chạy trên Cloudflare Workers, đọc dữ liệu từ Supabase.

> **Khác với phần còn lại của repo, thư mục này CÓ bước build.** `Beeftown_Website/index.html` cũ mở thẳng bằng trình duyệt là chạy; thư mục này thì không. Đổi lại, trang biết đọc database nên nội dung đổi được mà không cần deploy lại.

---

## Ý tưởng duy nhất cần hiểu

**Trang này phải đúng và đủ ngay cả khi chưa có database nào.**

Chạy thử mà không cấu hình gì cả: trang vẫn hiện tên, khẩu hiệu, descriptor, một câu giới thiệu, dòng trạng thái và khối tuyển dụng. Không số điện thoại giả, không địa chỉ `[số nhà]`, không ảnh kho, không nút dẫn đi đâu cả.

Đó **không phải** cách xử lý lỗi. Đó là trạng thái mặc định của thiết kế, và là phép thử của cả hệ thống.

Mỗi dữ kiện Khánh công bố trong giao diện nội bộ sẽ **thêm** vào trang. Không công tắc nào trừ đi được phần nền.

Hệ quả cụ thể:

| Khi chưa công bố | Trang làm gì |
|---|---|
| Facebook | Không hiện nút "Theo dõi Beeftown". Nút dẫn tới hư không tệ hơn không có nút. |
| Địa chỉ | Chỉ hiện "Quận 1, TP.HCM". Không bịa số nhà. |
| Hotline | Không hiện nút gọi, và JSON-LD không khai `telephone`. |
| Giờ phục vụ | Không hiện giờ, và không khai `openingHoursSpecification` — Google đưa giờ này lên kết quả tìm kiếm, khai sai là dẫn khách tới cửa đóng. |
| Ảnh chia sẻ | **Không đặt thẻ `og:image`.** Thẻ trỏ tới ảnh hỏng còn tệ hơn không có thẻ, vì Facebook nhớ kết quả hỏng đó trong bộ nhớ đệm. |

---

## Chạy trên máy

```bash
cd web && npm install && npm run dev
```

Mở http://localhost:4321. Không cần Supabase.

| Lệnh | Làm gì |
|---|---|
| `npm run dev` | Chạy thử trên máy |
| `npm run build` | Dựng bản deploy vào `dist/` |
| `npm run kiem-tra` | Kiểm tra kiểu dữ liệu (`astro check`) |
| `npm run deploy` | Build rồi đẩy lên Cloudflare |

---

## Cấu trúc

```
web/
├─ kiem-tra/quet-chuoi-cam.mjs  ← quét chuỗi cấm trên trang ĐÃ RENDER
├─ src/
│  ├─ middleware.ts    ← chặn cửa /noi-bo. Một chỗ duy nhất.
│  ├─ lib/
│  │  ├─ noi-dung.ts   ← ĐỌC CỔNG NỘI DUNG. Đọc file này trước.
│  │  ├─ chu.ts        ← câu chữ cố định + bảng đường dẫn Việt–Anh–Hàn
│  │  ├─ chuoi-cam.js  ← danh sách chữ cấm, dùng chung cho máy quét và máy dịch
│  │  ├─ may-dich.ts   ← gọi Gemini, quy tắc dịch — không biết gì về database
│  │  ├─ ban-dich.ts   ← nối máy dịch với database: đọc việc, dịch, ghi
│  │  ├─ phien.ts      ← phiên đăng nhập nội bộ, cookie, IP, kết quả form
│  │  ├─ cong-tac.ts   ← đọc/ghi bảng công tắc nội dung
│  │  ├─ nop-ho-so.ts  ← nhận hồ sơ ứng tuyển + tải CV
│  │  ├─ dat-ban.ts    ← lịch trống và gửi yêu cầu đặt bàn
│  │  ├─ xu-ly-form.ts ← POST → chuyển hướng → GET, dùng chung hai ngôn ngữ
│  │  ├─ tuyen-dung.ts
│  │  └─ kho/          ← PHẦN MỀM KHO — xem mục "Kho" bên dưới
│  ├─ layouts/
│  │  ├─ Trang.astro   ← thẻ mô tả, JSON-LD, đầu và chân trang
│  │  └─ NoiBo.astro   ← khung giao diện nội bộ
│  ├─ components/
│  │  ├─ TrangRaMat.astro · TrangTuyenDung.astro
│  │  ├─ TrangDatBan.astro · FormUngTuyen.astro
│  ├─ pages/
│  │  ├─ (tiếng Việt ở gốc, tiếng Anh dưới /en, tiếng Hàn dưới /ko)
│  │  └─ noi-bo/       ← giao diện nội bộ, có middleware canh cửa
│  │     └─ kho/       ← các màn kho
│  └─ styles/chung.css · noi-bo.css · kho.css
└─ public/bieu-tuong.svg
```

Tên file và biến đặt bằng tiếng Việt, khớp với tên cột trong database. Người đọc `dat_ban.trang_thai` rồi đọc tiếp mã nguồn không phải dịch qua lại.

---

## Giao diện nội bộ

`/noi-bo` cần một project Supabase đã chạy migration. Chưa nối thì trang đăng nhập nói thẳng là chưa nối và **không hiện ô đăng nhập** — một ô không đăng nhập được là lời nói dối có thêm bước.

**Không có khóa `service_role` ở đâu trong thư mục này, và sẽ không bao giờ có.** Cách hiển nhiên cho một trang quản trị là dùng khóa đó vì nó đi xuyên qua mọi RLS — và đó chính là lý do không dùng: một lỗi lập trình trong `/noi-bo` sẽ đi xuyên qua toàn bộ hệ thống phân quyền, trên cùng một Worker đang phục vụ trang công khai.

Thay vào đó nhân viên đăng nhập bằng Supabase Auth, access token của **họ** nằm trong cookie HttpOnly, và mọi truy vấn chạy dưới vai `authenticated` với đúng `auth.uid()` của người đó. RLS ở `0007`/`0010`/`0012` là luật duy nhất.

Hệ quả cụ thể: một người vai `marketing` đăng nhập sẽ soạn được bản nháp nhưng **không** công bố được, và giao diện không cần biết luật đó — chính trigger trong database từ chối, y như khi họ gõ SQL bằng tay.

**Tài khoản do chủ nhà hàng tạo trong Supabase Studio**, rồi nối `auth_uid` vào một dòng trong bảng `nhan_su`. Đăng nhập Supabase thành công mà không có dòng `nhan_su` thì vẫn bị từ chối — Supabase Auth trả lời "ai", bảng `nhan_su` trả lời "có phải nhân viên không".

### Tiếng Anh ở giao diện nội bộ

Mọi trang nội bộ có nút **English / Tiếng Việt** ở đầu trang. Lựa chọn là của **trình duyệt** (cookie `nb_ngon_ngu`, sống dưới `/noi-bo`), không nằm trong đường dẫn như trang công khai: một link `/noi-bo/tin-tuyen-dung/<id>` phải mở đúng tin đó dù người mở đọc tiếng gì. Chưa chọn thì là tiếng Việt.

Viết thêm chữ cho giao diện nội bộ theo hai đường:

- **Chữ của trang** (tiêu đề, nhãn, nút, câu dẫn) nằm ngay trong trang, dạng `{ vi, en }`, đọc qua `dichNB(nn, …)` — `nn` lấy bằng `nnCua(Astro)`. Thư viện trả câu cho người đọc (`lib/cong-tac.ts`, `lib/tin-tuyen-dung.ts`, `lib/cai-dat.ts`…) nhận thêm tham số `nn`, mặc định `'vi'`.
- **Câu thông báo trang không tự viết** — lỗi `raise exception` của database, lý do máy dịch hỏng lưu trong sổ bản dịch — đi qua `dichCau(nn, câu)` ở `lib/cau-noi-bo.ts`: tra đúng câu tiếng Việt, rồi tới mẫu có `%`. Thêm một `raise exception` mới ở migration phần CRM thì thêm bản tiếng Anh vào đó.

`crm/test/test-noi-bo-tieng-anh.mjs` giữ hai điều này: câu lỗi database mới chưa có bản tiếng Anh, hoặc chữ Việt mới nằm ngoài cặp `{ vi, en }` ở màn CRM, là test đỏ.

**Bẫy khi tách câu:** Astro 7 (`compressHTML: 'jsx'`) bỏ hẳn khoảng trắng có xuống dòng giữa hai nút. Câu cũ viết liền trong một đoạn chữ thì xuống dòng thành dấu cách, nhưng tách thành `{t.cau1}` ⏎ `{t.cau2}` thì hiện "Câu một.Câu hai.". Viết hai mẩu trên cùng dòng cách một dấu cách, hoặc thêm `{' '}`. `crm/test/dinh-chu.mjs` đọc template bằng bộ đọc của Astro và báo những chỗ này cho cả hai thứ tiếng — cả hai test tiếng Anh đều chạy nó.

**Phần kho** dùng cùng nút, cùng cookie, cùng hai đường trên, thêm ba chỗ riêng:

- **Câu báo sau khi ghi** (`KetQua` trong `lib/kho/chung.ts`, đi qua cookie `bt_kho_bao` sang trang sau) mang cả bản tiếng Anh: thư viện trả `kqHai(ok, { vi, en })` hoặc `{ ok, cau, cauEn }`; lỗi thì `kqLoi(error, { vi, en })`. `BaoKho` hiện `cauEn` ở màn tiếng Anh, không có thì tra `dichCau`. Hàm kiểm dữ liệu trả `loi` kèm `loiEn` cùng thứ tự.
- **Bảng nhãn** có bản hai thứ tiếng tên `…_NB` (`TRANG_THAI_CHUNG_TU_NB`, `TEN_LOAI_SO_CAI_NB`…); bảng tên cũ chỉ tiếng Việt dựng lại từ đó cho code và test cũ. Trang đọc bằng `nhanKho(BANG_NB, ma, nn)` hoặc `trangThaiKho(ma, nn)`. Số: `dinhDangKg/Tien/PhanTram(x, …, nn)` — tiếng Anh viết `1.25`, `450,000 ₫`.
- **Câu lỗi database của kho** nằm ở `lib/kho/cau-kho-en.ts`: câu cố định đúng từng chữ, câu có `%` viết nguyên câu `raise` và bản tiếng Anh đặt `{1}`, `{2}`… vào chỗ từng giá trị.

Mỗi trang kho lấy ngôn ngữ từ `k.nn` (`moTrangKho`). `crm/test/test-kho-tieng-anh.mjs` giữ các luật này cho kho: chữ Việt ngoài `{ vi, en }` (bộ quét `crm/test/quet-chu-viet.mjs`), trang gọi hàm có tham số `nn` mà không truyền (`crm/test/kiem-nn.mjs`), câu `raise exception` của migration kho chưa có bản tiếng Anh, và chữ dính nhau vì xuống dòng (`crm/test/dinh-chu.mjs`) — đều là test đỏ. Chỗ cố ý giữ tiếng Việt (file MISA, đơn vị lưu trong database như "gói", "khay") ghi ở `CO_Y` / `KHONG_QUET` trong test đó, kèm lý do.

---

## Bản dịch tự động (tiếng Anh và tiếng Hàn)

Tiếng Việt là bản gốc duy nhất người ta soạn. Bản tiếng Anh và tiếng Hàn do **Gemini** dịch mỗi khi câu tiếng Việt đổi, rồi lên trang ngay — sau khi qua **đúng bộ lọc chữ cấm** mà `npm run quet` dùng (`src/lib/chuoi-cam.js`). Bộ lọc có cả mẫu tiếng Anh và tiếng Hàn: máy dịch rất hay biến "nướng tại bàn" thành 숯불구이 (nướng than), trong khi nhà hàng nướng vỉ gas.

| Sửa ở đâu | Khi nào dịch |
|---|---|
| Màn soạn tin tuyển dụng | Ngay sau khi bấm Lưu, chạy nền — tải lại trang sau vài giây là thấy. Nút **Dịch ngay** để chờ và xem kết quả tại chỗ. |
| Màn công tắc nội dung | Trước khi lưu, trong cùng lần bấm (chờ vài giây). Dòng đã công bố là bất biến (`0010`), nên bản dịch phải đi cùng phiên bản. |
| Supabase Studio (thực đơn, chú thích ảnh…) | Lần kế tiếp chủ nhà hàng, quản lý hoặc marketing mở một trang `/noi-bo` — tối đa một lượt mỗi phút. |

**Ba luật**, nằm ở database (`0036`) nên đúng bất kể sửa bằng đường nào:

- Bản dịch là bản dịch của **một** câu tiếng Việt cụ thể. Câu gốc đổi là bản dịch hết hiệu lực — kể cả bản sửa tay.
- **Sửa tay thắng máy**, cho tới khi câu gốc đổi. Xóa trắng một ô dịch là nhờ máy dịch lại ô đó.
- Bản dịch dính chữ cấm **không lên trang**: ô để trống, trang lùi về thứ tiếng kế tiếp (Hàn → Anh → Việt), màn nội bộ hiện lý do.

### Cài khóa Gemini — làm một lần

1. Vào [Google AI Studio](https://aistudio.google.com/apikey), đăng nhập bằng tài khoản Google của nhà hàng, bấm **Create API key**. Gói Gemini dùng trong app **không** thay được khóa này.
2. Dashboard Cloudflare → **Workers & Pages** → `beeftown` → **Settings** → **Variables and Secrets** → **Add** → kiểu **Secret**, tên `GEMINI_API_KEY`, dán khóa, rồi bấm **Deploy**. Hoặc từ máy, trong thư mục `web/`: `npx wrangler secret put GEMINI_API_KEY`.
3. Không dán khóa vào `.env`, vào chat hay vào repo. Secret của Worker không đi vào bản build, và `wrangler deploy` không xóa nó.

**Phải chọn kiểu Secret, không phải Text.** Biến kiểu Text hiện nguyên giá trị trên dashboard và trong API. Tệ hơn, `wrangler deploy` **xóa** nó ở lần deploy kế tiếp: wrangler xóa mọi biến không khai trong `wrangler.toml` rồi mới đặt biến theo file. Lỡ thêm dạng Text thì xóa biến đó rồi thêm lại dạng Secret. Trong lúc chưa đổi, deploy bằng `npx wrangler deploy --keep-vars` — và lưu ý bảng so sánh cấu hình wrangler in ra trước khi tải lên sẽ in cả giá trị của biến Text.

Chưa có khóa thì web vẫn chạy: ô dịch để trống, trang lùi về thứ tiếng kế tiếp, màn soạn tin báo "Chưa có khóa GEMINI_API_KEY". Chạy thử trên máy thì đặt khóa trong `web/.dev.vars` (`GEMINI_API_KEY=...`) — file này bị `.gitignore` chặn.

**Đừng gỡ `[placement]` trong `wrangler.toml`.** Mục này ghim Worker vào trạm Cloudflare gần AWS Singapore (`region = "aws:ap-southeast-1"`, cùng vùng với Supabase). Không ghim thì người dùng ở Việt Nam hay được đưa vào trạm Hồng Kông, mà Google từ chối mọi lời gọi Gemini đi từ Hồng Kông: sổ bản dịch ghi lỗi "User location is not supported for the API use" cho mọi ô. Ảnh và file tĩnh vẫn phát từ trạm gần người xem. Muốn biết một trang chạy ở đâu thì xem header `cf-placement` của phản hồi.

**Mẫu máy:** mặc định `gemini-flash-latest`, bí danh Google tự trỏ tới bản Flash mới nhất — để không phải sửa code mỗi lần Google khai tử một phiên bản. Muốn chọn khác thì thêm vào `wrangler.toml`:

```toml
[vars]
GEMINI_MODEL = "gemini-flash-lite-latest"   # hoặc tên một phiên bản cụ thể
```

**Mỗi lời gọi phải xong dưới 25 giây** vì việc chạy nền của Worker bị cắt ở khoảng 30 giây. Vì thế máy dịch làm hai việc:
- Gửi kèm mức suy nghĩ `LOW`. Gemini 3.x mặc định nghĩ ở mức vừa trước khi viết, và dịch theo quy tắc sẵn thì không cần thế.
- Chia mỗi lượt thành các lời gọi tối đa 2000 chữ, chạy song song. Máy viết cả bản Anh lẫn bản Hàn, nên chữ ra gấp đôi chữ vào.

Thiếu hai việc này, lời gọi 6000 chữ đầu tiên (26/09/2026) đã hết giờ, và sổ bản dịch ghi "Gemini trả lời quá lâu". Nếu đổi `GEMINI_MODEL` sang một mẫu không nhận mức suy nghĩ, máy tự gọi lại không kèm tham số đó.

**Gửi đi những gì:** chỉ chữ sắp lên trang công khai — tin tuyển dụng, thực đơn, chú thích ảnh, dữ kiện công bố. Không bao giờ có tên, số điện thoại hay hồ sơ của khách và ứng viên. Điều này quan trọng vì ở gói miễn phí, Google được dùng dữ liệu gửi lên để cải thiện sản phẩm.

**Thứ tự triển khai:** chạy migration `0036` **trước**, rồi mới deploy web. Làm ngược thì màn soạn tin lỗi vì thiếu cột, và trang `/ko` hiện tiếng Việt.

Đổi sang dịch vụ dịch khác: chỉ viết lại `src/lib/may-dich.ts`.

---

## Kho (`/noi-bo/kho`)

Phần mềm quản lý kho thịt: nhập tảng, pha lóc, quầy thịt, hạn dùng, kiểm kê, công nợ nhà cung cấp. Nằm **trong** giao diện nội bộ, dùng chung đăng nhập — không phải một ứng dụng riêng. Database ở `crm/supabase/migrations/0017_*` trở đi.

| Màn | Việc |
|---|---|
| `/noi-bo/kho` | Tổng quan: lô hết hạn / sắp hết hạn (bán trước — FEFO), phiếu chờ duyệt, quầy dưới mức tối thiểu |
| `/noi-bo/kho/ton` | Tồn theo mặt hàng → từng lô, lọc theo vị trí, hạn, loại |
| `/noi-bo/kho/nhap` | Phiếu nhập và tồn đầu kỳ: thủ kho lập, quản lý duyệt. **Tồn chỉ cộng khi duyệt.** |
| `/noi-bo/kho/pha-loc` | Phiên pha lóc: tảng vào → phần cắt, phụ phẩm, phần bỏ. Xem thử **tỉ lệ thu hồi** và **giá vốn thật/kg** trước khi chốt; thu hồi bình quân 30 ngày theo loại tảng |
| `/noi-bo/kho/xuat` | Chuyển kho ⇄ quầy, xuất bếp, báo hủy (ảnh + quản lý duyệt). Lấy lô hết hạn sớm nhất trước; hàng hết hạn không lên quầy, không vào bếp |
| `/noi-bo/kho/kiem-ke` | Kiểm kê quầy (theo mặt hàng, quét nhãn được) và kho lạnh (từng lô). Đếm mù, gửi, quản lý duyệt. Chưa nối iPOS: thiếu ở quầy = đã bán |
| `/noi-bo/kho/cong-no` | Công nợ nhà cung cấp: đang nợ, quá hạn, đến hạn 7 ngày; đối chiếu hóa đơn, ghi thanh toán / giảm trừ (tự chia theo hạn), trả hàng NCC |
| `/noi-bo/kho/bao-cao` | Xuất – nhập – tồn, thu hồi theo tảng × NCC, hủy / xuất bếp / chênh lệch, bán ước tính. Tải CSV cho Excel (`/noi-bo/kho/bao-cao/<tên>.csv`) |
| `/noi-bo/kho/cai-dat` | Mặt hàng (dán từ Excel được), nhà cung cấp, vị trí, lý do, công thức pha lóc, **ô thông tin tự tạo**, mã vạch cân, **đồng bộ cân** |

**Vai trò.** Ba vai mới trong `nhan_su.vai_tro`: `thu_kho`, `nhan_vien_quay` (nhân viên quầy/bếp), `ke_toan`. Bảng tra "vai nào làm được gì" nằm ở hàm `kho_vai_duoc()` (migration `0018`); `lib/kho/chung.ts` giữ một bản soi gương chỉ để ẩn nút, và `crm/test/test-kho-quyen.mjs` so hai bản từng dòng. Nhân viên quầy/bếp **không thấy giá nhập, giá vốn** — không phải vì giao diện giấu, mà vì database không trả những cột đó cho họ.

Vai kho **không** thấy dữ liệu CRM (khách hàng, đặt bàn, điểm) — `0018` dựng tường ngăn. Đăng nhập bằng vai kho thì `/noi-bo` chuyển thẳng vào `/noi-bo/kho`.

**Tạo tài khoản vai kho** giống mọi tài khoản khác: tạo user trong Supabase Studio, rồi thêm một dòng `nhan_su` với `vai_tro` là `thu_kho`, `nhan_vien_quay` hoặc `ke_toan` và `chi_nhanh_id` của quán.

**Không JavaScript.** Mọi màn là form POST, lưu xong chuyển hướng 303 (F5 không gửi lại lệnh). Form dài như phiếu nhập được **lưu nháp phía máy chủ** ở mỗi lần bấm; mỗi form mang một `ma_gui` để bấm hai lần vẫn chỉ ra một phiếu, và `phien_ban` để hai máy không đè lên nhau.

**Nhãn cân.** Cân Dahua TM-A in mã EAN-13 kiểu 2+5+5+1 (hai số đầu, năm số mã hàng, năm số trọng lượng gram, một số kiểm tra). Mẫu đọc cài được ở Cài đặt → Mã vạch cân, có ô thử một nhãn thật. Mã hàng trên cân khớp cột "mã cân" của mặt hàng.

**Quét nhãn** (`components/kho/QuetMa.astro`): máy quét cầm tay USB/Bluetooth gõ mã như bàn phím — mỗi nhãn một dòng trong ô quét, rồi bấm "Đọc mã". Nút "Quét bằng camera" là phần thêm, chỉ hiện khi trình duyệt đọc được EAN-13 (Chrome Android); iPhone không thấy nút, vẫn dùng máy quét được. Đây là đoạn JavaScript DUY NHẤT của khu kho — tắt đi trang vẫn chạy đủ.

**Đồng bộ cân** (`/noi-bo/kho/cai-dat/can`, quyền `danh_muc`). **Kho là gốc**: mã cân, tên, giá bán/kg chỉ sửa ở Mặt hàng, rồi đưa sang cân qua USB. Cân không nối mạng với kho, nên người dùng lưu dữ liệu từ cân ra USB (`JHSCALE/A_000.TMS`), tải file lên màn này, xem trước thêm/sửa/xoá, rồi tải file mới về nạp lại vào cân. Các bước bấm trên cân có ghi ngay trên màn.

- Khớp theo mã cân. Hàng đã có trên cân giữ nguyên số PLU (phím gọi hàng không đổi); hàng mới lấy số PLU trống nhỏ nhất. Hàng trên cân không có trong kho bị xoá, trừ khi tích "giữ lại".
- Hàng kho thiếu giá, giá quá 999.999 đ/kg (cân chỉ hiện 6 chữ số) hay mã dài hơn số chữ `C` trong mẫu mã vạch thì không đưa lên cân, và màn xem trước ghi rõ lý do.
- **Máy chủ không lưu file**: file có tên và mật khẩu WiFi của quán. Bước xem trước mang file theo form dưới dạng base64; bấm tải là dựng lại từ danh mục mới nhất. Không ghi gì vào database.
- Đọc/ghi file ở `lib/kho/can-tma.ts` (cách đọc file ghi ở đầu file đó), kiểm bằng `crm/test/test-kho-can.mjs`. Dòng không đổi được ghi lại y nguyên từng byte.
- Hạn dùng chưa đưa sang cân được: chưa biết cân lưu số ngày hạn dùng ở cột nào của dòng PLU.

**Ảnh chứng từ** (hóa đơn, hàng hỏng) lưu ở kho file riêng `kho-chung-tu` (`0021`) và đi qua Worker — ảnh điện thoại vài MB có thể vượt giới hạn CPU của gói Cloudflare Workers miễn phí. Nếu tải ảnh hay lỗi, chuyển sang gói trả phí.

---

## Cấu hình

Chép `.env.example` thành `.env`:

| Biến | Ý nghĩa |
|---|---|
| `PUBLIC_SUPABASE_URL` | Địa chỉ project Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | Khóa anon |
| `SITE_URL` | Tên miền thật |
| `PUBLIC_CHI_NHANH` | Mã chi nhánh, khớp `chi_nhanh.ma` |

**Khóa anon là khóa công khai theo thiết kế** — nó nằm sẵn trong mã trang web mà ai cũng xem được. An toàn nằm ở RLS và ở danh sách 12 hàm mà `anon` được phép gọi (migration `0013`), **không** nằm ở việc giấu khóa này.

Khóa `service_role` thì ngược lại: **không bao giờ** đặt vào thư mục này.

**Build chạy trên MÁY CỦA BẠN, không phải trên Cloudflare.** `npm run deploy` chạy `astro build` ở đây rồi `wrangler deploy` chỉ đẩy bản đã build lên. Cloudflare không tham gia bước build, nên dashboard của nó **không có chỗ** đặt biến `PUBLIC_*` — biến phải nằm trong `web/.env` lúc bạn chạy build.

Làm sai chỗ này không gây lỗi: trang vẫn deploy, vẫn trả 200, chỉ là `taoClient()` trả `null` nên `/noi-bo` không hiện ô đăng nhập và hai form công khai biến mất. Một trang chết lâm sàng trông y hệt một trang đang chờ nội dung.

Phép thử một dòng sau khi build:

```bash
grep -rq "$(grep PUBLIC_SUPABASE_URL .env | cut -d= -f2 | sed 's|https://||;s|\..*||')" dist/ && echo "biến đã vào bản build" || echo "CHƯA VÀO"
```

`SITE_URL` được Astro **nướng vào bản build** — nó thành canonical, `og:url`, `url` trong JSON-LD và mọi `<loc>` trong sitemap. Sai thì Facebook không hiện ảnh khi chia sẻ link. Web chạy ở `https://beeftown.vn` (tên miền riêng gắn vào Worker trên dashboard Cloudflare), nên `SITE_URL=https://beeftown.vn`. Địa chỉ `workers.dev` và link xem trước cố ý tắt bằng `workers_dev = false` và `preview_urls = false` trong `wrangler.toml` — thiếu hai dòng đó, mỗi lần `wrangler deploy` Cloudflare tự bật lại cả hai.

---

## Ba quyết định kỹ thuật, và lý do

**Astro chứ không phải Next.js.** Cloudflare mua lại Astro tháng 1/2026, nên adapter Workers là deploy target hạng nhất — không có lớp phiên dịch. Next.js trên Cloudflare phải đi qua OpenNext, mà OpenNext không đảm bảo hỗ trợ đầy đủ Windows. Đổi lại: ít lập trình viên Việt biết Astro hơn. Bù lại, file `.astro` đọc gần như HTML thuần.

**Dựng ở phía máy chủ (`output: 'server'`).** Thẻ mô tả và JSON-LD là **hàm của trạng thái database**, mà trình quét link của Facebook và Zalo không chạy JavaScript. Trang tĩnh thì hoặc thẻ mô tả bị đóng cứng (và lạc hậu ngay khi Khánh bật một công tắc), hoặc do JS viết ra và trình quét không thấy. Không có đường thứ ba.

**Không dùng phông hiển thị nào cả.** Trang 1 của PDF nhận diện ghi Hypo-me Bold, trang 6 ghi NVN Beloved Bold; cả hai **chưa có bản quyền**, và chính tài liệu cũng chưa rõ đó có phải một phông hay không. Tên thương hiệu đặt bằng Montserrat ExtraBold siết chữ — giấy phép OFL, không rủi ro. Quan trọng hơn: nó sẽ không bao giờ bị nhầm là phông thương hiệu thật, nên không ai ở khâu sau tưởng câu chuyện phông đã xong.

---

## Đã làm và chưa làm

**Trang công khai — 12 đường dẫn, ba thứ tiếng:**
ra mắt · tuyển dụng · **đặt bàn** · quyền riêng tư, mỗi trang một bản Việt, một bản Anh (`/en`) và một bản Hàn (`/ko`), cộng `robots.txt` và `sitemap.xml`. Chữ lấy từ database được máy dịch — xem mục "Bản dịch tự động".

**Giao diện nội bộ `/noi-bo`:**
đăng nhập · tổng quan (danh sách việc còn thiếu, đọc thẳng từ bốn view trong database) · **công tắc nội dung** · hộp thư đặt bàn · hộp thư hồ sơ ứng tuyển.

**Hai form công khai**, đều là form HTML thuần không JavaScript:

| Form | Hiện khi nào |
|---|---|
| Ứng tuyển | Có ít nhất một `vi_tri_tuyen_dung` ở trạng thái `da_cong_bo`. Chưa có thì hiện khối "nhắn Facebook". |
| Đặt bàn | Công tắc `form_dat_ban_dang_mo` bật **và** database thật sự còn chỗ trong 14 ngày tới. Xem lý do ở đầu `lib/dat-ban.ts`. |

**Chưa làm, theo đúng kế hoạch:**

| Phần | Vì sao chưa |
|---|---|
| Email báo về khi có hồ sơ / yêu cầu mới | **Việc quan trọng nhất còn lại.** Rủi ro lớn nhất không phải hệ thống hỏng mà là hồ sơ nằm im không ai mở. Cần một dịch vụ gửi mail và một hộp thư có người đọc. |
| Màn hình chọn ảnh | Ô ảnh trong `/noi-bo` đang nhận mã dòng `tep_anh` gõ tay. Tải ảnh làm trong Supabase Studio. |
| Duyệt giá thực đơn | Database đã có 31 món (`0011`), không một giá nào được duyệt |
| Trang thực đơn công khai | Chờ giá và ảnh |
| Tra cứu / hủy đặt bàn cho khách | Database đã có `tra_cuu_dat_ban()` và `huy_dat_ban()` từ `0013` |
| Màn hình CRM: khách, phân nhóm, điểm | Cần có khách thật |

---

## Trước khi phát hành

```bash
npm run quet
```

Lệnh này tải từng trang qua HTTP và đọc **phần chữ khách nhìn thấy** — thân trang, tiêu đề, thẻ mô tả, JSON-LD — rồi đối chiếu với danh sách cấm. Mỗi lần đỏ nó in kèm **lý do** câu đó bị cấm, để không ai chỉ xóa từ rồi viết lại cùng ý bằng chữ khác.

Nó tự bật `astro dev` nếu chưa có server nào chạy, và `npm run deploy` gọi nó trước khi build — nên không có đường deploy vòng qua nó.

**Vì sao không grep mã nguồn.** Bản đầu tiên của phép thử này là một lệnh `grep` vào `src/`. Nó sai theo hai hướng:

- **Báo nhầm** — nó tìm thấy chính những dòng chú thích ghi *"cấm dùng từ này"*. Một phép thử báo động về tài liệu của chính nó sẽ dạy người ta bỏ qua nó, mà một phép thử bị bỏ qua thì tệ hơn không có, vì nó vẫn tạo cảm giác đã kiểm rồi.
- **Bỏ sót**, nặng hơn nhiều — từ migration `0010`, nội dung trang đến **từ database**. Gõ *"rẻ hơn 30%"* vào ô dòng trạng thái trong `/noi-bo` rồi bấm công bố là câu đó lên trang chủ ngay, còn lệnh grep mã nguồn thì xanh mãi mãi. Nó đang canh một cánh cửa không còn ai đi qua.

**Chỗ lệnh này vẫn không với tới:** nó chỉ thấy nội dung **đang được công bố lúc chạy**. Vì vậy nó thuộc về hai thời điểm — trước khi deploy, và **sau mỗi lần bật công tắc nội dung**.

**Danh sách cấm nằm ở `src/lib/chuoi-cam.js`** và máy dịch dùng chung nó: bản dịch dính chữ cấm bị giữ lại, không lên trang. Nên phần lớn lỗi của bản dịch máy bị chặn ngay lúc lưu, trước khi lệnh này kịp thấy. Thêm một mẫu cấm là thêm cho cả hai, kèm bản tiếng Anh và tiếng Hàn nếu ý đó có cách nói riêng ở hai thứ tiếng kia.

Phần nghiệm thu bằng hai điện thoại thật và phép thử ảnh chia sẻ nằm ở `../README.md`.
