# Bot dịch Zalo (Bot Beeftown Translate)

Bot Zalo nằm trong nhóm chat: ai nhắn tiếng Việt hoặc tiếng Anh thì bot gửi bản tiếng Hàn ngay bên dưới; ai nhắn
tiếng Hàn thì bot gửi bản tiếng Việt (đổi sang tiếng Anh được, xem `DICH_TIENG_HAN_SANG`). Chạy trên Cloudflare Workers (gói miễn phí đủ dùng). Máy dịch chọn theo khóa
cài trên Worker, theo thứ tự: Claude (`ANTHROPIC_API_KEY`) → Gemini (`GEMINI_API_KEY`) → Workers AI của Cloudflare
(không cần khóa, miễn phí, chất lượng kém hơn).

```
Người trong nhóm ──tin──▶ Zalo ──webhook──▶ Worker (bot-dich) ──▶ Claude / Gemini dịch ──▶ Zalo sendMessage ──▶ nhóm
```

Tách hẳn khỏi web Beeftown: Worker riêng (`beeftown-bot-dich`), không đọc database, không dùng bí mật của web.

## Cài đặt (làm một lần)

1. **Tạo bot** ở bot.zaloplatforms.com, thêm bot vào nhóm Zalo. Ô "Webhook URL" trong trang bot để trống — bước 4 tự điền.
2. **Đưa Worker lên Cloudflare**: `cd bot-dich && npm ci && npm run deploy`. Lệnh in địa chỉ dạng
   `https://beeftown-bot-dich.<tên-tài-khoản>.workers.dev`.
3. **Cài bí mật** trong Cloudflare → Workers & Pages → `beeftown-bot-dich` → Settings → Variables and Secrets →
   Add → loại **Secret**:
   - `ZALO_BOT_TOKEN` — token ở trang bot, mục Thiết lập chung → Bot Token. **Bắt buộc.**
   - `GEMINI_API_KEY` — khóa Gemini từ aistudio.google.com (dùng lại được khóa web Beeftown đang dùng). Tùy chọn.
   - `ANTHROPIC_API_KEY` — khóa Claude từ console.anthropic.com (cần nạp tiền). Tùy chọn; có thì được dùng trước Gemini.
   - Không cài khóa nào thì bot dịch bằng Workers AI.
4. **Mở** `https://beeftown-bot-dich.<tên-tài-khoản>.workers.dev/cai-dat` trên trình duyệt. Trang báo
   "Đã đăng ký webhook …" là xong; báo "Chưa đăng ký được" thì kiểm lại token.
5. **Thử**: nhắn "hello" vào nhóm — bot trả "🇰🇷 Tên: 안녕하세요" sau vài giây.

Reset token ở trang bot thì cập nhật `ZALO_BOT_TOKEN` rồi mở lại `/cai-dat` (khóa webhook suy từ token nên đổi theo).

## Tùy chỉnh (Variables, loại Text — hoặc sửa `wrangler.jsonc` rồi deploy lại)

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `CHI_DICH_KHI_TAG` | `0` | `1`: trong nhóm chỉ dịch tin có @tag bot. Chat riêng với bot luôn dịch. |
| `DICH_TIENG_HAN_SANG` | `vi` | Tin tiếng Hàn dịch sang tiếng nào: `vi` tiếng Việt, `en` tiếng Anh. |
| `GEMINI_MODEL` | `gemini-flash-latest` | Model Gemini (bí danh luôn trỏ bản Flash mới nhất, như web). |
| `MO_HINH_CLAUDE` | `claude-opus-5-5` | Model Claude. `claude-haiku-5-5` rẻ hơn khoảng 40 lần, vẫn dịch tốt tin chat ngắn. |
| `TEN_BOT` | `Bot Beeftown Translate` | Tên hiển thị của bot — để bỏ chữ "@tên bot" trước khi dịch. Đổi tên bot thì đổi theo. |

Chi phí Claude ước tính (tin chat ngắn: ~250 token vào, ~100 token ra kể cả phần suy nghĩ): Opus 5.5
($4 / $20 mỗi triệu token) khoảng 0,3 xu Mỹ một tin — 100 tin/ngày ≈ 9 USD/tháng; Haiku 5.5 ($0,10 / $0,50) dưới
0,3 USD/tháng. Số thật xem ở console.anthropic.com → Usage. Gemini Flash có hạn mức miễn phí mỗi ngày ở
aistudio.google.com — chat bạn bè thường nằm trong hạn mức đó; vượt thì Google báo lỗi 429 và bot gửi câu
"chưa dịch được".

## Cách bot quyết định

- **Ngôn ngữ nguồn**: chữ Hàn chiếm ≥ 30% số chữ cái → tiếng Hàn; có dấu tiếng Việt → tiếng Việt; còn lại → tiếng Anh.
- **Ngôn ngữ đích**: tiếng Hàn → `DICH_TIENG_HAN_SANG`; tiếng Anh, tiếng Việt → tiếng Hàn.
- **Bỏ qua**: sticker, ảnh, tin chỉ có link / số / biểu tượng, tin do bot gửi và tin bắt đầu bằng cờ 🇰🇷 / 🇬🇧 / 🇻🇳
  như bản dịch của bot (tránh bot dịch lại bản dịch của mình nếu Zalo gửi ngược tin của bot về).
- **Dịch hỏng** (mạng, Claude / Gemini lỗi, từ chối, hết hạn mức, trả rỗng): bot gửi "⚠️ Bot chưa dịch được tin này…" bằng hai thứ tiếng —
  không bao giờ gửi bản dịch giả.

## Giới hạn và giả định (dịch vụ ngoài)

- **Zalo có gửi mọi tin trong nhóm cho bot không** — chưa có tài liệu chính thức nói rõ. Một số nguồn (OpenClaw) ghi
  bot chỉ nhận tin có @tag. Mã dịch mọi tin bot nhận được, nên chạy đúng cả hai trường hợp; thử thật ở bước 5 với
  một tin thường và một tin có @tag để biết.
- **Cấu trúc tin Zalo** (`event_name`, `message.chat.chat_type = GROUP | PRIVATE`, `message.from.is_bot`, header
  `X-Bot-Api-Secret-Token`, giới hạn 2.000 ký tự): theo bot.zaloplatforms.com/docs, đối chiếu mã nguồn
  `@openclaw/zalo`. Zalo đổi cấu trúc thì `docTinZalo` trả null và bot im lặng — xem nhật ký Worker.
- **Gửi lại webhook**: Worker trả 200 ngay rồi dịch chạy nền, và nhớ mã tin trong 10 phút để không dịch hai lần.
  Bộ nhớ nằm trong một máy chạy của Worker — Zalo gửi lại vào máy khác thì có thể ra hai bản dịch (hiếm).
- **Gemini**: gọi `generativelanguage.googleapis.com/v1beta/models/<model>:generateContent`, khóa trong header
  `x-goog-api-key`, mức suy nghĩ `LOW` — giống `web/src/lib/may-dich.ts`. Google không nhận lời gọi đi từ Hồng Kông,
  nên Worker ghim chạy ở Singapore (`placement` trong `wrangler.jsonc`).
- **Nhật ký**: Cloudflare → Workers & Pages → `beeftown-bot-dich` → Logs. Token không bao giờ được in ra.

## Lệnh

```bash
npm run thu         # kiểm thử (node --test, Zalo và Claude giả)
npm run kiem-kieu   # kiểm kiểu TypeScript
npm run chay-thu    # chạy trên máy (wrangler dev)
npm run deploy      # kiểm kiểu + kiểm thử + đưa lên Cloudflare
```
