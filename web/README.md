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
├─ src/
│  ├─ lib/
│  │  ├─ noi-dung.ts   ← ĐỌC CỔNG NỘI DUNG. Đọc file này trước.
│  │  ├─ chu.ts        ← toàn bộ câu chữ cố định, hai thứ tiếng
│  │  └─ tuyen-dung.ts
│  ├─ layouts/Trang.astro     ← thẻ mô tả, JSON-LD, đầu và chân trang
│  ├─ components/
│  │  ├─ TrangRaMat.astro
│  │  └─ TrangTuyenDung.astro
│  ├─ pages/           ← tiếng Việt ở gốc, tiếng Anh dưới /en
│  └─ styles/chung.css
└─ public/bieu-tuong.svg
```

Tên file và biến đặt bằng tiếng Việt, khớp với tên cột trong database. Người đọc `dat_ban.trang_thai` rồi đọc tiếp mã nguồn không phải dịch qua lại.

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

**Khi deploy lên Cloudflare, đặt các biến `PUBLIC_*` ở phần BUILD**, không phải phần biến môi trường lúc chạy — Vite nhúng chúng vào bản build.

`SITE_URL` mà sai hoặc thiếu thì thẻ `og:image` thành đường dẫn tương đối và Facebook không hiện ảnh. Đây là lỗi phổ biến nhất của phần này.

---

## Ba quyết định kỹ thuật, và lý do

**Astro chứ không phải Next.js.** Cloudflare mua lại Astro tháng 1/2026, nên adapter Workers là deploy target hạng nhất — không có lớp phiên dịch. Next.js trên Cloudflare phải đi qua OpenNext, mà OpenNext không đảm bảo hỗ trợ đầy đủ Windows. Đổi lại: ít lập trình viên Việt biết Astro hơn. Bù lại, file `.astro` đọc gần như HTML thuần.

**Dựng ở phía máy chủ (`output: 'server'`).** Thẻ mô tả và JSON-LD là **hàm của trạng thái database**, mà trình quét link của Facebook và Zalo không chạy JavaScript. Trang tĩnh thì hoặc thẻ mô tả bị đóng cứng (và lạc hậu ngay khi Khánh bật một công tắc), hoặc do JS viết ra và trình quét không thấy. Không có đường thứ ba.

**Không dùng phông hiển thị nào cả.** Trang 1 của PDF nhận diện ghi Hypo-me Bold, trang 6 ghi NVN Beloved Bold; cả hai **chưa có bản quyền**, và chính tài liệu cũng chưa rõ đó có phải một phông hay không. Tên thương hiệu đặt bằng Montserrat ExtraBold siết chữ — giấy phép OFL, không rủi ro. Quan trọng hơn: nó sẽ không bao giờ bị nhầm là phông thương hiệu thật, nên không ai ở khâu sau tưởng câu chuyện phông đã xong.

---

## Đã làm và chưa làm

**Giai đoạn 1 — xong, deploy được ngay:**
trang ra mắt · trang tuyển dụng tĩnh · trang quyền riêng tư · song ngữ Việt–Anh · thẻ mô tả và JSON-LD chỉ khai dữ kiện đã công bố · `robots.txt` · `sitemap.xml` · biểu tượng trình duyệt.

**Chưa làm, theo đúng kế hoạch:**

| Phần | Vì sao chưa |
|---|---|
| Giao diện nội bộ `/noi-bo` | Cần Supabase chạy thật trước |
| Form ứng tuyển | Database đã sẵn sàng (`0012`); cần Supabase và một hộp thư có người đọc |
| Form đặt bàn | **Chặn bởi thực tế, không phải bởi code.** Giờ phục vụ chưa chốt và bảng `ban_an` chưa có dữ liệu. Bật lúc này thì khách sẽ nhận được câu *"đã hết bàn"* — một lời nói sai về một nhà hàng chưa mở. |
| Thực đơn | Database đã có 31 món (`0011`), tất cả ở trạng thái nháp, không một giá nào được duyệt |
| Ảnh | Tám trong mười khuôn hình bắt buộc cần phòng đã hoàn thiện và biển đã sáng |

---

## Trước khi phát hành

Rà danh sách chuỗi cấm — mỗi chuỗi tương ứng một điều tài liệu thương hiệu cấm:

```bash
cd web && grep -rniE "unsplash|0900|\[số nhà\]|thịt chuẩn|MB9|229\.000|199\.000|wagyu|43 ngày|than hoa|phòng riêng|rẻ hơn|số một|duy nhất|đặt bàn thành công" src/ public/
```

Không có kết quả nào là đạt.

Phần nghiệm thu bằng hai điện thoại thật và phép thử ảnh chia sẻ nằm ở `../README.md`.
