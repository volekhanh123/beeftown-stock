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
| `npm run deploy` | **Cổng kiểm thử** (`kiem-tra/truoc-deploy.mjs`: chỉ commit đã có CI xanh) → quét chữ cấm → build → đẩy lên Cloudflare |
| `npm run deploy:khan-cap` | Như trên nhưng bỏ qua cổng kiểm thử — chỉ khi khẩn cấp |
| `npm run thu-trinh-duyet` | Kiểm thử bằng trình duyệt thật (Chromium): trang công khai ở ba cỡ màn hình, form không bao giờ báo thành công khi chưa ghi được |

**Cổng deploy.** `npm run deploy` chỉ đưa lên commit mà GitHub Actions đã chạy xanh: nó hỏi kết quả
workflow "Kiểm thử" của commit đang deploy bằng lệnh `gh`. Cài một lần trên máy deploy:
`winget install GitHub.cli`, rồi `gh auth login`. Chưa cài `gh` (hoặc mất mạng) thì cổng tự chạy
`astro check` và toàn bộ kiểm thử database ngay trên máy — cần `npm ci` trong `crm/` — mất vài phút.
Thư mục `web/` có thay đổi chưa commit thì cổng từ chối: bản deploy phải đúng là bản CI đã kiểm.

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

**Supabase bận không phải là hết phiên** (`src/lib/qua-tai.ts`). Đăng nhập, gia hạn phiên và mở máy tính bảng bằng PIN đi qua một cửa của Supabase Auth có hạn mức chung cho cả quán (Worker gọi từ Cloudflare nên cả quán là một IP). Bị từ chối vì bận (429), vì Supabase trục trặc (5xx) hay mất mạng thì token vẫn còn nguyên: `layPhien` trả `QUA_TAI` thay vì `null`, middleware trả trang 503 "hệ thống đang bận" (GET tự tải lại sau 5–10 giây, ngẫu nhiên để các máy không thử lại cùng lúc; POST nói rõ thao tác CHƯA được ghi), cookie giữ nguyên. Chỉ khi Supabase TỪ CHỐI token (hết hạn, bị thu hồi) mới đăng xuất. Đăng nhập bị 429 báo "nhiều người đăng nhập cùng lúc — không phải do sai mật khẩu". Mỗi lần gặp lỗi tạm thời ghi một dòng `[qua-tai]` vào nhật ký Worker (không token, không email). Nâng hạn mức và các việc hạ tầng khác: README gốc, mục "Hạ tầng cho 100 người dùng cùng lúc".

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
- Đọc/ghi file ở `lib/kho/can-tma.ts` (cách đọc file ghi ở đầu file đó), kiểm bằng `crm/test/test-kho-can.mjs`. Dòng PLU không đổi được ghi lại y nguyên từng byte; dòng khác cũng vậy, trừ các phần bỏ đi dưới đây.
- Hạn dùng (HSD): cân in HSD = ngày in tem + số ngày ở cột 32 của dòng PLU (cột 27 bật in) — chưa thử trên cân thật. Kho **không** đưa `kho_mat_hang.han_dung_ngay` lên cân: kho tính từ ngày nhập / ngày lóc (lô phần cắt còn bị chặn bởi hạn của tảng), cân tính từ ngày in, nên tem sẽ in hạn muộn hơn hạn của lô. Món giữ nguyên cột ngày trên cân; ô mã và mã giảm giá (gói cận date) luôn ghi `null` = tắt HSD (`lib/kho/danh-muc-can.ts`). Bảng xem trước có cột HSD (cũ → mới). Nạp xong in thử một tem, xem dòng HSD.
- File tải về luôn bỏ phần `REP` (nhật ký bán) và `INF` (thông tin máy) — `boPhanChiDoc`, như phần mềm TM-xA của hãng. Chưa thử trên cân thật.
- `docFileCan` đọc được cả file do phần mềm TM-xA của hãng tạo (BOM và dòng trống trước `ECS`). File TM-xA tích "Clear Data" có `CLR TMS` / `TMT`… thì bị từ chối (gửi lại là xoá thông số, chữ cài đặt, WiFi của cân); dòng `CLR PLU` thì `ghiFileCan` bỏ đi — không file nào tải về mang lệnh xoá bảng.
- **Nạp qua WiFi** (`public/kho/can-wifi/Nap-Can-WiFi.ps1`, tải ở màn Đồng bộ cân): chương trình PowerShell chạy trên máy tính Windows ở quán, gửi file vừa tải về thẳng xuống cân. Đã thử trên cân thật (26/09/2026, V3.14E8):
  - Cân nhận ở **cổng TCP 33571**, nội dung **y như file USB**; gửi xong đóng chiều gửi (`Shutdown(Send)`), cân không trả lời gì. Cân tự phát `UDP<tab>33581<tab><tab>\r\n` mỗi ~15 giây từ cổng UDP 33583 tới 255.255.255.255:33584, nhưng gửi vào cổng 33581 thì cân không nạp.
  - **Qua WiFi cân chỉ thêm và sửa hàng, không xoá.** Nạp bằng USB thì cân thay cả danh sách. Chương trình nhớ hàng đang nằm trên cân (`Tài liệu › Beeftown Can › tren-can.tsv`) và báo khi có hàng cần xoá; màn Đồng bộ cân cũng báo khi kế hoạch có dòng "Xoá khỏi cân".
  - Bỏ phần `TIM` trước khi gửi, và giữ bản vừa gửi ở `Tài liệu › Beeftown Can › A_000.TMS` để lần sau tải lên màn Đồng bộ cân thay cho bước lưu ra USB.
  - Trang web không gửi thẳng được: cân nằm trong WiFi của quán, trình duyệt không mở được kết nối TCP. Muốn bấm một nút trên web là xong thì cần một chương trình chạy nền ở quán làm cầu nối — chưa làm.
  - Kiểm tra cú pháp và chạy thử với cân giả: `pwsh` dot-source file (`. ./Nap-Can-WiFi.ps1` chỉ nạp các hàm, không chạy).
- **Beeftown Cân** (`can-app/`, file .exe): như chương trình trên nhưng lấy danh mục thẳng từ kho (đăng nhập tài khoản quản lý), dùng đúng `lapKeHoach` / `ghiFileCan`. Nó lấy địa chỉ Supabase và khóa anon ở `/kho-can.json` (`src/pages/kho-can.json.ts` — hai giá trị công khai theo thiết kế, không trả gì khác).

**Ảnh chứng từ** (hóa đơn, hàng hỏng) lưu ở kho file riêng `kho-chung-tu` (`0021`) và đi qua Worker — ảnh điện thoại vài MB có thể vượt giới hạn CPU của gói Cloudflare Workers miễn phí. Nếu tải ảnh hay lỗi, chuyển sang gói trả phí.

---

## Zalo (`/noi-bo/zalo`)

Gửi tin Zalo ZBS cho khách: **ZBS-01** xác nhận đặt bàn (ngay khi khách đặt trên web), **ZBS-02** nhắc lịch (trước giờ hẹn 2 tiếng), và tin chăm sóc gửi theo **chiến dịch** bấm tay. Database ở `crm/supabase/migrations/0046_*`, `0047_*` (đầu file 0047 liệt kê mọi RPC).

| Màn | Ai | Việc |
|---|---|---|
| `/noi-bo/zalo` | chủ, quản lý, marketing | Đèn kết nối, lần chạy cuối, quota, số chờ / đã gửi / thất bại, hàng chờ + nhật ký (SĐT che giữa, nút **Thử lại**), danh sách chiến dịch (nút **Dừng**) |
| `/noi-bo/zalo/chien-dich/moi` | chủ, quản lý, marketing | Chọn mẫu chăm sóc → nhóm khách → xem trước số người nhận và lý do bị loại → gửi ngay / hẹn giờ |
| `/noi-bo/zalo/cai-dat` | chỉ chủ | App ID, OA ID, dán refresh token, chế độ thử / thật, bật gửi, khung giờ, trần tin/tháng, mã mẫu Zalo + đã duyệt + tự động; hộp "4 bước chuẩn bị với Zalo"; bí mật nào đã cài |

**Ai gửi:** Cron 5 phút (`src/worker.ts`, cùng cron với iPOS, chạy song song — việc này hỏng không chặn việc kia) gọi `guiZaloTatCa` trong `src/lib/zalo-gui.ts`: đăng nhập tài khoản máy `may_zalo` → `zalo_bat_dau_luot` (khóa lượt, lấy lô tin đến hạn — database đã kiểm lại đồng ý, trần tháng, khung giờ) → làm mới access token khi còn dưới 1 giờ → gửi → `zalo_ghi_ket_qua` → `zalo_ket_thuc_luot`. Chi tiết API Zalo (địa chỉ, tên trường, mã lỗi) nằm trong **một** hằng `ZALO_API` đầu `src/lib/zalo.ts`.

> **Chưa đối chiếu tài liệu Zalo.** Lúc viết, proxy mạng chặn `developers.zalo.me`, `business.openapi.zalo.me`, `oauth.zaloapp.com`. Code làm theo chuẩn ZNS/ZBS đã biết (làm mới token: OAuth v4 `refresh_token` + header `secret_key`; gửi: `POST /message/template`, header `access_token`, `phone` dạng `84…`, `tracking_id` = id nhật ký, `mode: "development"` khi chế độ thử). Bảng mã lỗi → cách xử lý là **giả định**. Khi mở được tài liệu, chỉ sửa hằng `ZALO_API` (và `XU_LY_LOI` ngay dưới nó), chạy `node crm/test/test-zalo-web.mjs`.

### Bốn bí mật Worker

Đặt như `GEMINI_API_KEY` ở trên: dashboard Cloudflare → Workers & Pages → `beeftown` → Settings → Variables and Secrets → kiểu **Secret**; hoặc `npx wrangler secret put <TÊN>` trong `web/`. **Không** ghi vào `wrangler.toml`, `.env`, `.env.example`, chat hay repo.

| Bí mật | Là gì |
|---|---|
| `ZALO_SECRET_KEY` | Secret key của App Zalo (developers.zalo.me → App → Cài đặt). Chỉ dùng để làm mới token. App ID **không** bí mật — chủ nhập ở màn Cài đặt Zalo |
| `ZALO_KHOA` | Khóa mã hóa token trong database, ít nhất 32 ký tự: `openssl rand -base64 32`. Đổi khóa = token cũ hết dùng được, chủ phải dán lại refresh token (cũng là cách thu hồi khi nghi lộ) |
| `ZALO_MAY_EMAIL`, `ZALO_MAY_MAT_KHAU` | Tài khoản máy vai `may_zalo` (bên dưới) |

Thiếu bí mật nào thì cron chỉ ghi một dòng log "chưa cài …" và bỏ qua; web vẫn chạy. Màn Cài đặt Zalo hiện **đã cài / chưa cài** cho từng cái — không bao giờ hiện giá trị. Chạy thử trên máy: đặt trong `web/.dev.vars` (bị `.gitignore` chặn).

### Tạo tài khoản máy `may_zalo` — một lần

1. Supabase Studio → **Authentication → Users → Add user**: email riêng (vd. `may-zalo@<tên miền của quán>`), mật khẩu dài ngẫu nhiên, tích **Auto confirm**. Chép `User UID`.
2. SQL Editor (chi nhánh nào cũng được — máy gửi cho cả thương hiệu, nhưng bảng `nhan_su` bắt vai khác chủ phải có chi nhánh):
   ```sql
   insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
   values ('<User UID>', (select id from chi_nhanh order by ma limit 1), 'Máy gửi Zalo', 'may_zalo');
   ```
3. Đặt `ZALO_MAY_EMAIL`, `ZALO_MAY_MAT_KHAU` bằng đúng email / mật khẩu đó.

Vai `may_zalo` **không** đọc được bảng khách nào; nó chỉ gọi được bốn RPC máy (`zalo_bat_dau_luot`, `zalo_ghi_ket_qua`, `zalo_luu_token`, `zalo_ket_thuc_luot`). Cả tên, SĐT khách đều không vào log.

### Lấy refresh token đầu tiên

Refresh token của Zalo **dùng một lần**: mỗi lần làm mới, Zalo trả một cái mới và cái cũ chết ngay. Máy lưu cái mới (mã hóa) vào database **trước** khi gửi tin, và làm mới ít nhất mỗi ngày (access token sống ~25 giờ) nên refresh token (~3 tháng) không bao giờ hết hạn khi cron còn chạy. Chỉ cần lấy tay **một lần** (hoặc khi màn Tin Zalo báo "Zalo từ chối refresh token"):

1. developers.zalo.me → App của quán → **Official Account** → mục cấp quyền: đặt *Callback URL* (vd. `https://beeftown.vn/`), bật các quyền gửi tin ZBS/ZNS.
2. Chủ OA (đang đăng nhập Zalo) mở `https://oauth.zaloapp.com/v4/oa/permission?app_id=<APP_ID>&redirect_uri=<Callback URL>` → **Cho phép**. Trình duyệt chuyển về Callback URL kèm `?code=…&oa_id=…` — chép `code` (sống vài phút) và `oa_id`.
3. Đổi `code` lấy token (trên máy của người kỹ thuật, không dán secret key vào đâu khác):
   ```bash
   curl -s -X POST https://oauth.zaloapp.com/v4/oa/access_token \
     -H "secret_key: <SECRET_KEY của App>" \
     -d app_id=<APP_ID> -d grant_type=authorization_code -d code=<code>
   ```
   Kết quả có `refresh_token`. (Công cụ *API Explorer* trên developers.zalo.me cũng cấp được cặp token cho OA — cách nào cũng được.)
4. Chủ vào **/noi-bo/zalo/cai-dat**, dán vào ô **Refresh token** → Lưu. Trang mã hóa bằng `ZALO_KHOA` rồi mới gửi database; database từ chối mọi chuỗi không phải bản mã `v1.…`. Không bao giờ hiện lại. Xóa token khỏi lịch sử terminal / ghi chú sau khi dán.

### Chế độ thử → thật

Mặc định `zalo_cau_hinh.che_do = 'thu'`: mọi tin gửi kèm `mode: "development"` — Zalo chỉ giao cho **tài khoản quản trị của OA / App**, khách thật không nhận gì và (theo chuẩn ZNS) không tính phí. Thử: bật gửi ở chế độ thử, duyệt + bật tự động ZBS-01, đặt một bàn trên web bằng SĐT của một quản trị viên OA → trong 5 phút phải nhận tin, và `/noi-bo/zalo` ghi "Đã gửi". Ổn rồi mới chuyển **Chế độ → Thật**. Tin lỗi mã `-126` ở chế độ thử thường nghĩa là số nhận không phải quản trị viên.

Kiểm thử: `node crm/test/test-zalo.mjs` (database) và `node crm/test/test-zalo-web.mjs` (phần web, fetch giả — không gọi Zalo thật).

---

## Messenger (`/noi-bo/messenger`)

Bot trả lời tin nhắn Trang Facebook: **đặt bàn** (ngày → giờ còn nhận → số khách 1–8 → tên → SĐT → xác nhận), **tra / hủy đặt bàn** (mã + SĐT), **giờ mở cửa & địa chỉ**, **thực đơn**, **gặp nhân viên** (bot im một lúc cho nhân viên trả lời). Lệnh `menu`, `bắt đầu lại`, `hủy` dùng được mọi lúc. Database ở `crm/supabase/migrations/0051_*`, `0052_*` (đầu file 0052 liệt kê mọi RPC).

| Màn | Ai | Việc |
|---|---|---|
| `/noi-bo/messenger` | chủ sửa, quản lý xem | Bật / tắt bot (mặc định **tắt**), lời chào, số phút bot im khi khách gặp nhân viên; số liệu 7 ngày (chỉ đếm); bí mật nào đã cài; địa chỉ webhook; nút **Cài nút Bắt đầu + menu Messenger**; hộp "Các bước với Meta" |

**Luồng:** Meta gọi `https://beeftown.vn/hook/messenger` (`src/worker.ts` chặn trước Astro như `/hook/ipos`; `src/pages/hook/messenger.ts` cho `astro dev`). `src/lib/messenger-hook.ts` kiểm chữ ký `X-Hub-Signature-256`, trả 200 ngay, rồi trong `ctx.waitUntil`: băm PSID (HMAC với `MESS_KHOA_BAM` — database không bao giờ thấy PSID thô, không lưu nội dung tin) → `mess_lay_phien` → máy trạng thái thuần `buocTiep` (`src/lib/messenger.ts`) → việc cần làm (đặt bàn, lịch trống, tra / hủy, nội dung công khai — `src/lib/messenger-anon.ts`, **client anon không phiên**, đúng các hàm website dùng; đặt bàn ghi `utm_source = messenger`, `utm_medium = chatbot`) → `mess_luu_phien` → Send API. Bot nói "Beeftown **đã nhận yêu cầu**", không bao giờ "đặt bàn thành công". Tin nhân viên gõ trên Trang (echo không mang `metadata: beeftown_bot`) làm bot im cho khách đó.

> **Chưa đối chiếu tài liệu Meta.** Lúc viết, proxy chặn developers.facebook.com. Mọi chi tiết API (Graph `v21.0`, `/me/messages`, `/me/messenger_profile`, quick reply `user_phone_number`, giới hạn 13 quick reply / 20 ký tự / 640 ký tự / 3 nút / lời chào 160 ký tự, `metadata` để nhận ra echo của bot) nằm trong **một** hằng `META_API` đầu `src/lib/messenger.ts` ("CHỈNH KHI CÓ TÀI LIỆU"). Sửa ở đó rồi chạy `node crm/test/test-messenger-web.mjs`.

### Sáu bí mật Worker

Đặt như các bí mật khác (dashboard Cloudflare → Workers & Pages → `beeftown` → Settings → Variables and Secrets → **Secret**, hoặc `npx wrangler secret put <TÊN>` trong `web/`). **Không** ghi vào `wrangler.toml`, `.env`, `.env.example`, chat hay repo.

| Bí mật | Là gì |
|---|---|
| `META_APP_SECRET` | App Secret của App Meta (App → App settings → Basic). Dùng kiểm chữ ký webhook |
| `META_PAGE_TOKEN` | Page Access Token của Trang (App → Messenger → Messenger API settings → Generate token; nên dùng token **không hết hạn** của System User trong Business Portfolio, quyền `pages_messaging`) |
| `META_VERIFY_TOKEN` | Chuỗi ngẫu nhiên ≥ 32 ký tự bạn tự đặt (`openssl rand -hex 24`) — dán đúng chuỗi này vào ô *Verify token* khi khai webhook |
| `MESS_MAY_EMAIL`, `MESS_MAY_MAT_KHAU` | Tài khoản máy vai `may_messenger` (bên dưới) |
| `MESS_KHOA_BAM` | Khóa băm PSID ≥ 32 ký tự (`openssl rand -base64 32`). Đổi khóa = mọi hội thoại dở dang bắt đầu lại, không mất gì khác |

Tùy chọn, không bí mật: `META_APP_ID` (nhận ra echo của App mình — không đặt cũng được, bot đã gắn `metadata`). Thiếu bí mật nào thì `/hook/messenger` trả **503** và ghi **một** dòng log nêu tên bí mật thiếu; web khác vẫn chạy. Màn `/noi-bo/messenger` hiện **đã cài / chưa cài** — không bao giờ hiện giá trị. Chạy thử trên máy: đặt trong `web/.dev.vars` (bị `.gitignore` chặn).

### Tạo tài khoản máy `may_messenger` — một lần

1. Supabase Studio → **Authentication → Users → Add user**: email riêng (vd. `may-messenger@<tên miền của quán>`), mật khẩu dài ngẫu nhiên, tích **Auto confirm**. Chép `User UID`.
2. SQL Editor:
   ```sql
   insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
   values ('<User UID>', (select id from chi_nhanh order by ma limit 1), 'Máy bot Messenger', 'may_messenger');
   ```
3. Đặt `MESS_MAY_EMAIL`, `MESS_MAY_MAT_KHAU` bằng đúng email / mật khẩu đó.

Vai `may_messenger` **không** đọc / ghi được bảng CRM hay kho nào; nó chỉ gọi năm RPC máy (`mess_lay_phien`, `mess_luu_phien`, `mess_ghi_tra_cuu`, `mess_xin_dat_ban`, `mess_ghi_su_kien`). Trước mỗi `tao_dat_ban` bot gọi `mess_xin_dat_ban`: chặn gửi trùng trong 5 giây (Meta giao lặp / bấm hai lần) và tối đa 5 lần gửi đặt bàn mỗi khách mỗi ngày. Đặt bàn, tra / hủy đi bằng client anon như website.

### Nối với Meta

1. Trang Facebook nằm trong Business Portfolio của chủ. **Tắt** "Trả lời tự động" / "Tin nhắn vắng mặt" / câu hỏi thường gặp tự động trong Meta Business Suite — tin tự động của Meta đến như tin nhân viên và làm bot im.
2. developers.facebook.com → tạo App loại **Business** → thêm sản phẩm **Messenger** → nối App với Trang, tạo Page Access Token → cài `META_APP_SECRET`, `META_PAGE_TOKEN`, `META_VERIFY_TOKEN` (và đủ các bí mật còn lại — thiếu cái nào thì bước xác minh nhận 503).
3. App → Messenger → **Webhooks**: *Callback URL* `https://beeftown.vn/hook/messenger` (màn `/noi-bo/messenger` in sẵn), *Verify token* = `META_VERIFY_TOKEN` → **Verify and save**. Đăng ký cho Trang ba trường: **`messages`**, **`messaging_postbacks`**, **`message_echoes`**.
4. Chủ vào `/noi-bo/messenger`: bật bot, sửa lời chào, bấm **Cài nút Bắt đầu + menu Messenger** (gọi Messenger Profile API: `get_started`, `greeting` ≤ 160 ký tự, `persistent_menu` = 5 mục của menu chính). Bấm lại mỗi lần đổi lời chào.
5. Nhắn thử Trang bằng tài khoản có vai trò trong App (trước khi được duyệt, chỉ những người này nhắn được với bot): đặt một bàn, tra rồi hủy nó, bấm Gặp nhân viên. Đặt bàn qua bot hiện ở `/noi-bo/dat-ban` như đặt trên web; tin Zalo ZBS-01 tự gửi như thường.

### Xin quyền `pages_messaging` (App Review)

App → **App Review → Permissions and features** → `pages_messaging` → Request. Meta cần:

- **Video quay màn hình** (1–3 phút): mở Messenger, nhắn Trang → bấm Bắt đầu → Đặt bàn từng bước tới lúc bot báo "đã nhận yêu cầu" + mã → Tra/hủy đặt bàn → Gặp nhân viên. Quay cả màn `/noi-bo/dat-ban` hiện đặt bàn vừa tạo.
- Mô tả ngắn: bot giúp khách đặt bàn / tra / hủy và hỏi giờ mở cửa; chỉ trả lời khi khách nhắn trước, trong 24 giờ (`messaging_type: RESPONSE`), không gửi quảng cáo.
- **Privacy Policy URL**: `https://beeftown.vn/quyen-rieng-tu` (có bản `/en/privacy`).
- **Data Deletion Instructions URL**: `https://beeftown.vn/xoa-du-lieu` (có bản `/en/data-deletion`). Khách nhắn "xóa dữ liệu" thì bot xóa phần đang lưu dở và gọi nhân viên xử lý phần đặt bàn; phiên bot tự xóa sau 30 ngày.
- App ở chế độ **Live** sau khi được duyệt.

Kiểm thử: `node crm/test/test-messenger.mjs` (database) và `node crm/test/test-messenger-web.mjs` (phần web: chữ ký, hội thoại trọn vòng với client giả + một vòng thật trên PGlite; `IN_HOI_THOAI=1` in bản hội thoại mẫu). Không gọi Meta thật.

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
