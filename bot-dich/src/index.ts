/**
 * Bot Beeftown Translate — Worker Cloudflare nhận tin Zalo Bot qua webhook, dịch Anh/Việt ↔ Hàn, gửi bản dịch
 * vào đúng nhóm (hoặc chat riêng) đó.
 *
 * Đường dẫn:
 *   GET  /         — kiểm Worker còn sống (không gọi Zalo).
 *   GET  /cai-dat  — đăng ký webhook của bot về Worker này. Mở một lần sau khi deploy hoặc sau khi Reset token.
 *   POST /zalo     — Zalo gửi tin về đây; header X-Bot-Api-Secret-Token phải khớp khóa suy ra từ token.
 */
import { dichTin, LoiDich, type WorkersAi } from './dich.ts';
import {
  BoNhoTinDaNhan,
  boTagBot,
  CAU_DICH_HONG,
  canDich,
  chiaDoan,
  docNgonNguDichTiengHan,
  docTinZalo,
  doanNgonNgu,
  dungCauTraLoi,
  khoaWebhook,
  laTinCuaBot,
  ngonNguDich,
  soBiMat,
  type TinZalo,
} from './xu-ly.ts';
import { baoDangGo, dangKyWebhook, guiTin, LoiZalo, thongTinBot, type HamFetch } from './zalo.ts';

export interface Env {
  /** Bí mật: token bot từ bot.zaloplatforms.com (Thiết lập chung → Bot Token). */
  ZALO_BOT_TOKEN?: string;
  /** Bí mật, tùy chọn: khóa API Claude. Không có thì dịch bằng Workers AI. */
  ANTHROPIC_API_KEY?: string;
  /** Tùy chọn: model Claude, ví dụ claude-haiku-5-5 cho rẻ hơn. */
  MO_HINH_CLAUDE?: string;
  /** Tên hiển thị của bot — để bỏ chữ "@tên bot" khỏi tin trước khi dịch. */
  TEN_BOT?: string;
  /** "1": trong nhóm chỉ dịch tin có @tag bot. Mặc định dịch mọi tin bot nhận được. */
  CHI_DICH_KHI_TAG?: string;
  /** "en" (mặc định) hoặc "vi": tin tiếng Hàn dịch sang tiếng nào. */
  DICH_TIENG_HAN_SANG?: string;
  AI?: WorkersAi;
}

interface NguCanh {
  waitUntil(viec: Promise<unknown>): void;
}

const TEN_BOT_MAC_DINH = 'Bot Beeftown Translate';
const boNho = new BoNhoTinDaNhan();

function traChu(noiDung: string, trangThai = 200): Response {
  return new Response(noiDung, { status: trangThai, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

/** Dịch một tin rồi gửi bản dịch. Trả kết quả để kiểm thử và nhật ký đọc được. */
export async function xuLyTin(
  tin: TinZalo,
  env: Env,
  fetchFn: HamFetch = fetch,
): Promise<'bo-qua' | 'da-dich' | 'dich-hong' | 'gui-hong'> {
  const token = env.ZALO_BOT_TOKEN?.trim();
  if (!token || tin.laBot || laTinCuaBot(tin.noiDung)) return 'bo-qua';
  const { conLai, coTag } = boTagBot(tin.noiDung, env.TEN_BOT?.trim() || TEN_BOT_MAC_DINH);
  if (tin.laNhom && env.CHI_DICH_KHI_TAG?.trim() === '1' && !coTag) return 'bo-qua';
  if (!canDich(conLai)) return 'bo-qua';

  const nguon = doanNgonNgu(conLai);
  const dich = ngonNguDich(nguon, docNgonNguDichTiengHan(env.DICH_TIENG_HAN_SANG));
  baoDangGo(token, tin.maChat, fetchFn).catch(() => {});

  let banDich: string;
  try {
    banDich = await dichTin(conLai, nguon, dich, {
      khoaClaude: env.ANTHROPIC_API_KEY,
      moHinhClaude: env.MO_HINH_CLAUDE,
      ai: env.AI,
      fetchFn: fetchFn === fetch ? undefined : fetchFn,
    });
  } catch (loi) {
    console.error('Dịch hỏng:', loi instanceof LoiDich ? loi.message : 'lỗi không rõ');
    try {
      await guiTin(token, tin.maChat, CAU_DICH_HONG, fetchFn);
    } catch (loiGui) {
      console.error('Gửi câu báo hỏng cũng lỗi:', loiGui instanceof LoiZalo ? loiGui.message : 'lỗi không rõ');
    }
    return 'dich-hong';
  }

  try {
    for (const doan of chiaDoan(dungCauTraLoi(tin.tenNguoiGui, dich, banDich))) {
      await guiTin(token, tin.maChat, doan, fetchFn);
    }
  } catch (loi) {
    console.error('Gửi bản dịch lỗi:', loi instanceof LoiZalo ? loi.message : 'lỗi không rõ');
    return 'gui-hong';
  }
  return 'da-dich';
}

export async function xuLyYeuCau(yeuCau: Request, env: Env, nguCanh: NguCanh, fetchFn: HamFetch = fetch): Promise<Response> {
  const url = new URL(yeuCau.url);
  const token = env.ZALO_BOT_TOKEN?.trim();

  if (url.pathname === '/' && yeuCau.method === 'GET') {
    return traChu(token ? 'Bot dịch đang chạy.' : 'Bot dịch đang chạy nhưng CHƯA có ZALO_BOT_TOKEN.');
  }

  if (url.pathname === '/cai-dat' && yeuCau.method === 'GET') {
    if (!token) return traChu('Thiếu ZALO_BOT_TOKEN: thêm bí mật này trong Cloudflare rồi mở lại trang.', 500);
    const diaChi = `${url.origin}/zalo`;
    try {
      await dangKyWebhook(token, diaChi, await khoaWebhook(token), fetchFn);
      const bot = await thongTinBot(token, fetchFn);
      // Tên trường của getMe chưa thấy tài liệu ghi rõ — thử các tên hay gặp, không có thì bỏ trống.
      const ketQua = (bot.result ?? {}) as Record<string, unknown>;
      const ten = [ketQua.account_name, ketQua.display_name, ketQua.name].find(t => typeof t === 'string') ?? '';
      return traChu(
        `Đã đăng ký webhook ${diaChi}${ten ? ` cho bot ${String(ten)}` : ''}.\n` +
          `Máy dịch: ${env.ANTHROPIC_API_KEY?.trim() ? 'Claude' : env.AI ? 'Workers AI (chưa có ANTHROPIC_API_KEY)' : 'CHƯA CÓ'}.\n` +
          'Giờ nhắn thử vào nhóm có bot.',
      );
    } catch (loi) {
      const lyDo = loi instanceof LoiZalo ? loi.message : 'lỗi không rõ';
      return traChu(`Chưa đăng ký được webhook: ${lyDo}. Kiểm token rồi mở lại trang.`, 502);
    }
  }

  if (url.pathname === '/zalo' && yeuCau.method === 'POST') {
    if (!token) return traChu('Chưa cài token', 503);
    const khoaGui = yeuCau.headers.get('x-bot-api-secret-token') ?? '';
    if (!soBiMat(khoaGui, await khoaWebhook(token))) return traChu('Sai khóa', 401);
    let than: unknown;
    try {
      than = await yeuCau.json();
    } catch {
      return traChu('Thân không phải JSON', 400);
    }
    const tin = docTinZalo(than);
    // Trả 200 ngay, dịch chạy nền: dịch mất vài giây, trả chậm thì Zalo tưởng lỗi và gửi lại tin.
    if (tin && boNho.nhanLanDau(tin.maTin)) nguCanh.waitUntil(xuLyTin(tin, env, fetchFn));
    return traChu('ok');
  }

  return traChu('Không có trang này', 404);
}

export default {
  fetch(yeuCau: Request, env: Env, nguCanh: NguCanh): Promise<Response> {
    return xuLyYeuCau(yeuCau, env, nguCanh);
  },
};
