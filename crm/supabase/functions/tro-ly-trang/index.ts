// tro-ly-trang — Edge Function của Supabase (project Beeftown, bzfzutyuqwxjarlsmgjt): khung chat Trang ở trang Mua thịt
// về. Phần xử lý nằm ở xu-ly.ts (Node chạy được trong kiểm thử); file này chỉ nối Deno, SDK của Anthropic và database.
//
// Bí mật (Supabase → Edge Functions → Secrets — Khánh tự đặt, không ghi vào repo, chat hay log):
//   ANTHROPIC_API_KEY   khóa API Anthropic của Khánh (khóa cấp tổ chức).
// Supabase tự cấp: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Tùy chọn: ANTHROPIC_WORKSPACE_ID (mặc định workspace của Khánh), TRO_LY_MO_HINH (mặc định claude-haiku-5-5),
//           TRO_LY_NGUON (danh sách nguồn được gọi, cách nhau dấu phẩy; mặc định https://beeftown.vn, https://www.beeftown.vn).
// Deploy với verify_jwt = false (như zalo-translate): trình duyệt gửi text/plain, không cần khóa — công tắc và giới hạn
// lượt nằm ở database (tro_ly_mo_luot, 0126). Cách deploy: web/README.md, mục "Trợ lý Trang".
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Anthropic from 'npm:@anthropic-ai/sdk@1.8.0';
import { NGUON_MAC_DINH, WORKSPACE_MAC_DINH, xuLyYeuCau, type Rpc } from './xu-ly.ts';

const khoa = Deno.env.get('ANTHROPIC_API_KEY')?.trim() ?? '';
const urlDb = Deno.env.get('SUPABASE_URL')?.trim() ?? '';
/** Khóa service_role: bản JWT cũ (SUPABASE_SERVICE_ROLE_KEY), không có thì khóa bí mật mới (SUPABASE_SECRET_KEYS). */
function khoaDichVu(): string {
  const cu = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
  if (cu) return cu;
  try {
    const moi = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}') as Record<string, unknown>;
    const k = Object.values(moi).find(v => typeof v === 'string' && v.trim());
    return typeof k === 'string' ? k.trim() : '';
  } catch { return ''; }
}
const khoaDb = khoaDichVu();
const nguon = (Deno.env.get('TRO_LY_NGUON') ?? '').split(',').map(s => s.trim()).filter(Boolean);

const claude = khoa
  ? new Anthropic({
      apiKey: khoa,
      defaultHeaders: { 'anthropic-workspace-id': Deno.env.get('ANTHROPIC_WORKSPACE_ID')?.trim() || WORKSPACE_MAC_DINH },
      // Khách đang chờ: 20 giây mỗi lần, thử lại một lần (lỗi mạng, 429, 5xx).
      timeout: 20_000,
      maxRetries: 1,
    })
  : null;

/** PostgREST /rest/v1/rpc bằng khóa service_role (chỉ hai hàm của Trang và menu công khai). */
const rpc: Rpc | null = urlDb && khoaDb
  ? async (ten, thamSo) => {
      const res = await fetch(`${urlDb}/rest/v1/rpc/${ten}`, {
        method: 'POST',
        // Khóa JWT cũ đi cả hai đầu; khóa bí mật mới (sb_secret_…) chỉ đi ở apikey.
        headers: { 'Content-Type': 'application/json', apikey: khoaDb, ...(khoaDb.startsWith('eyJ') ? { Authorization: `Bearer ${khoaDb}` } : {}) },
        body: JSON.stringify(thamSo),
        signal: AbortSignal.timeout(8_000),
      });
      const data = await res.json().catch(() => null);
      return res.ok ? { data, error: null } : { data: null, error: { message: `${res.status} ${data?.code ?? ''} ${data?.message ?? ''}`.trim() } };
    }
  : null;

Deno.serve(req => xuLyYeuCau(req, {
  goiClaude: claude ? thamSo => claude.messages.create(thamSo as unknown as Anthropic.MessageCreateParamsNonStreaming) : null,
  rpc,
  moHinh: Deno.env.get('TRO_LY_MO_HINH')?.trim() || undefined,
  nguonDuoc: nguon.length ? nguon : NGUON_MAC_DINH,
}));
