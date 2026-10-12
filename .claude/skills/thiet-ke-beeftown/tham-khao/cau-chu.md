# Câu chữ — giọng văn, sự thật, chữ cấm

Áp dụng cho mọi chữ người khác đọc: trang, nút, câu báo, tin nhắn, bài đăng, alt ảnh. Nguồn: `README.md`
gốc mục "Giọng văn", `CLAUDE.md` mục 7 `cau-chu`, `web/src/lib/chuoi-cam.js`.

## Giọng

Ấm áp, thẳng thắn, như một người bán thịt lành nghề. Thân thiện với gia đình, chuyên nghiệp với khách
công ty. Nói rõ cả điều kiện lẫn quyền lợi.

**Nên:** nói về chất lượng tương xứng giá tiền · giải thích trải nghiệm chọn phần bò tại quầy · nêu
con số cụ thể **khi con số đã được xác nhận**.

**Không nên:**

- Chữ **"rẻ"** — thay bằng *hợp lý*, *xứng đáng*, *giá thật*. (Máy chỉ chặn "rẻ hơn"; chữ trơn "rẻ"
  thì người viết tự giữ.)
- Tiếng lóng giới trẻ, chiêu câu tương tác, giọng fine dining xa cách.
- Hứa mâm banchan đầy đủ kiểu Hàn — Beeftown tập trung vào bò. Không gọi là "Korean BBQ".
- Guideline 09/10/2026 (`THUONG-HIEU.md`) cấm thêm: **buffet, cao cấp, nướng Hàn**, grade khi chưa có
  chứng nhận, số ngày ủ khi chưa có hồ sơ, chữ về **than, lửa, khói**, số phần trăm khi chưa có phép
  thử. Máy chỉ chặn phần có trong `chuoi-cam.js` — phần còn lại người viết tự giữ.
- Ngôi xưng: trang web nói "bạn"; bot Messenger xưng "mình", gọi "bạn", nói về Beeftown ở ngôi thứ
  ba (`CAU_BOT` trong `web/src/lib/messenger.ts`).

## Đúng sự thật trước, hay sau

- **Thứ ghi dữ liệu và thứ quyết định câu thông báo là cùng một biểu thức `await`.** Ghi hỏng thì nói
  hỏng và chỉ đường khác (Facebook); hết giờ chờ thì nói **không chắc** đã ghi nhận chưa và đừng gửi
  lại; chỉ khi database xác nhận mới nói đã nhận.
- Yêu cầu hỏi bàn **khác** bàn đã giữ: câu kết quả là "**đã nhận yêu cầu**" — nhà hàng kiểm tra rồi
  liên hệ xác nhận. Trang hỏi bàn, form ứng tuyển, tuyển dụng không chứa "thành công" / "success" /
  "성공" (có kiểm thử).
- **Đọc lỗi khác không có.** Mạng đứt, hết giờ chờ database: nói "chưa đọc được …" / "chưa kiểm được …"
  ngay chỗ đó (khối `.nb-bao.luu-y`), không hiện như danh sách rỗng hay "không tìm thấy". Ví dụ: đơn đặt
  đang chờ ở màn nhận hàng, nhật ký đổi tài khoản ở `CanhBaoTaiKhoan` trước khi chuyển tiền.
- Form, nút, ô đăng nhập chưa dùng được thì **ẩn hẳn** — một form bị vô hiệu hóa là lời nói dối có thêm
  bước.
- Không nhắc chuyện sản xuất với khách: không "đang cập nhật", "sắp ra mắt", "chờ duyệt", "coming
  soon", "TBD", "lorem" (kiểm thử chặn). Chưa có thì không hiện.

## Không claim chưa xác nhận

| Nhóm | Ví dụ bị chặn | Vì sao |
|---|---|---|
| Ảnh kho | unsplash, pexels, shutterstock | Mọi ảnh phải là ảnh thật hoặc ảnh minh họa có ghi |
| Chỗ trống lọt ra trang | hotline mẫu `0900 000`, `[số nhà]`, `[placeholder]` | Chưa có thì ẩn |
| Grade, giống bò | Wagyu, A5, MB9 | Chưa xác nhận |
| Số ngày ủ | "ủ 43 ngày", "aged 30 days" | Chưa xác nhận số ngày, phương pháp |
| Nướng than | than hoa, than củi, charcoal, 숯 | Beeftown nướng **vỉ gas** |
| Phòng riêng | phòng riêng, private room, 별실 | Tiện ích chưa xác nhận |
| Lấy giá làm mồi câu | rẻ hơn, giá tốt hơn, tiết kiệm N%, best value, 가성비 | Thương hiệu cấm |
| So sánh nhất | số một, ngon nhất, the best, #1, 최고 | Không chứng minh được, vi phạm quảng cáo |
| Báo giữ bàn | câu xác nhận đặt bàn, "booking confirmed", 예약 확정 | Chỉ nói "đã nhận yêu cầu" |
| Khan hiếm | "còn 2 bàn", "only 3 seats left" | Số bàn trống không bao giờ tới trình duyệt |
| Số tiền | `125.000đ`, `450,000 ₫` | Chưa món nào có giá đã duyệt |

Danh sách thật, kèm mẫu tiếng Anh, tiếng Hàn: `web/src/lib/chuoi-cam.js`. Máy quét chạy trên trang đã
dựng (`npm run quet`), trên bản dịch máy, và trong các kiểm thử câu chữ — không quét file `.md`. Thêm
một luật mới: thêm vào đó **kèm lý do** và bản tiếng Anh của lý do.

Ngoài danh sách máy chặn, cũng **không viết**: giờ mở cửa, ngày khai trương, giá, ưu đãi, đếm ngược,
số bàn, "Thịt chuẩn - Giá thật", ghế trẻ em, món ngoài thực đơn đã công bố — khi chưa được công bố
trong `/noi-bo`.

## Dữ kiện cố định

- Tên: **Beeftown**. Descriptor: *Beef Specialty Restaurant*. Tagline: *Pick it. Grill it. Love it.*
  (có dấu chấm; `THUONG_HIEU` trong `web/src/lib/chu.ts`). Câu chính cho khách: *Không cần rành bò.
  Chọn theo gu, thấy giá trước.*
- Địa điểm: **Tầng 3, 63 Hồ Tùng Mậu** (tiếng Anh "Floor 3, 63 Hồ Tùng Mậu", tiếng Hàn "Hồ Tùng Mậu
  63, 3층"). Bản ngắn không có tầng: "63 Hồ Tùng Mậu, TP.HCM" / "63 Hồ Tùng Mậu, Ho Chi Minh City" /
  "호치민시 Hồ Tùng Mậu 63" (`diaChiNgan`). Mã đã ghi đúng như vậy: `DIA_CHI_PHAN`, `DIA_CHI_NHA_HANG`
  trong `web/src/lib/chu.ts`.
  - **Khánh đã quyết** (điều đã biết): địa điểm là 63 Hồ Tùng Mậu (07/10/2026); quán ở tầng 3, khách vào
    bằng **lối vào riêng ngay cạnh GS25** (09/10/2026). Địa điểm **có thang máy**: Khánh xác nhận ngày
    11/10/2026.
  - **Chưa biết:** nút thang máy ghi số mấy cho tầng của quán — không viết số nút, chỉ "tầng 3" /
    "Floor 3" / "3층".
  - **Câu chỉ đường ba thứ tiếng là Claude đề xuất, đang chờ Khánh duyệt chữ** (`loiLen` trong
    `chu.ts`). Dùng đúng câu đang có, không tự viết bản khác:
    - vi: "Lối vào riêng ngay cạnh GS25, đi thang máy lên tầng 3."
    - en: "Use our own entrance, right next to GS25, and take the lift to Floor 3."
    - ko: "GS25 바로 옆 전용 입구로 들어와 엘리베이터로 3층까지 올라오세요."

    Khánh duyệt chữ khác thì sửa `loiLen` cùng lúc với ba bản chép tay trong
    `crm/test/test-cong-khai-cau-chu.mjs`, `crm/test/test-cong-khai-dia-diem.mjs`,
    `web/kiem-tra/trinh-duyet.mjs` và ba dòng trên.
  - **Chỉ nói những điều đó.** Không ghi tên phường hay quận — chưa có giấy xác nhận (JSON-LD vì thế
    không có `addressLocality`). Không gọi 63 Hồ Tùng Mậu là "tòa nhà" / "the building" / "건물". Không
    kể chuyện đổi địa điểm, không chữ "địa chỉ mới". Lối lên chỉ là thang máy — không nhắc cách lên nào
    khác. Không chỗ gửi xe, lối cho xe lăn, mốc gần đó, số phút, số mét, số bước — chưa ai xác nhận, chưa
    ai đo.
  - **Dòng địa chỉ pháp nhân ở chân trang** (`PHAP_NHAN.diaChi` trong `chu.ts`) là địa chỉ trên giấy
    đăng ký của công ty, **khác** địa chỉ nhà hàng. Giữ nguyên từng ký tự — nó khớp giấy đăng ký đang
    dùng cho hồ sơ xác minh trên Meta; đổi hay không là việc Khánh quyết. Đừng "sửa cho khớp" với địa chỉ quán, và đừng chép dòng đó
    ra chỗ khác.
  - Địa chỉ trên trang có hai nguồn: bản công bố trong `/noi-bo` (khóa `dia_chi_hien_thi`, nhóm "Liên
    hệ") thắng bản trong mã. Tên chi nhánh và địa chỉ trong `/noi-bo/cai-dat` là thứ bot Messenger đọc.
    Đổi địa điểm trong mã mà không xem lại hai nơi đó thì khách vẫn thấy chữ cũ.
  - Luật vẫn giữ: trang nói về đường đến hay hỏi bàn phải nói cách lên tầng 3 **trước** khi khách gửi
    yêu cầu.
  - Kiểm thử gác: `crm/test/test-cong-khai-dia-diem.mjs` (mã nguồn), `test-cong-khai-cau-chu.mjs` nhóm 7
    (chữ khách đọc), `web/kiem-tra/trinh-duyet.mjs` (trang đã dựng); mẫu dùng chung ở
    `web/kiem-tra/mau-dia-diem.mjs`.
- Nút / link tới trang hỏi bàn: **"Hỏi bàn" / "Ask for a table" / "테이블 문의"** — không "Đặt bàn
  ngay", không "Book now".
- Nhãn khay: tên phần cắt, giá mỗi 100g, trọng lượng, giá cuối (đã gồm VAT), ngày đóng gói. "Đã gồm
  VAT" chỉ nói về giá trên nhãn khay, không bao giờ mở rộng thành cam kết cho cả hóa đơn.
- Nhãn món chỉ có hai: **Món sống** (luôn kèm câu cảnh báo) và **Có cồn**. Không tự thêm nhãn chay, dị
  ứng, độ cay, khẩu phần, combo.
- Pháp nhân ở chân trang giữ nguyên từng ký tự — kiểm thử trình duyệt đọc đúng dòng đó.

## Chữ và số kiểu Việt

- "1.000" là một nghìn, "1,5" là một phẩy năm. Tiếng Anh ở nội bộ / kho viết `1.25`, `450,000 ₫` — dùng
  hàm định dạng có sẵn, không tự ghép chuỗi. Guideline: giá dạng `000.000 đ`, ngày dạng `dd/mm/yyyy`.
- Ngày giờ theo **giờ Việt Nam**: web dùng `web/src/lib/gio-vn.ts` (`homNayVn`, `namVn`, `congNgay`),
  không tự cộng 7 tiếng.
- So khớp chữ có dấu phải đúng dấu ("Đúng" không phải "dừng").
- Tên file người dùng thấy hay tải về: ASCII không dấu, gạch nối.

## Đủ thứ tiếng

- Trang công khai: **vi / en / ko** cho mọi câu; câu nào có `vi` và `en` thì phải có `ko`. Chữ en và ko
  không chứa dấu tiếng Việt, trừ tên riêng trong `TEN_RIENG` của `crm/test/test-cong-khai-cau-chu.mjs`
  (tên đường "Hồ Tùng Mậu", tên thành phố, pháp nhân) — tên riêng mới thì thêm vào đó.
- Nội bộ và kho: **vi / en**. Câu `raise exception` mới của database có bản tiếng Anh trong
  `web/src/lib/cau-noi-bo.ts` (CRM) hoặc `web/src/lib/kho/cau-kho-en.ts` (kho). **Không đổi chữ của câu
  `raise exception` cũ** — kiểm thử khớp theo chữ tiếng Việt.
- Tiếng Anh, tiếng Hàn viết theo nghĩa, không dịch từng chữ; tiếng Hàn không dùng 숯불 (nướng than)
  cho "nướng".
- Alt ảnh: tả món, ba thứ tiếng, không nói đây là ảnh chụp tại quán.
