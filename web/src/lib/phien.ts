/**
 * PHIÊN ĐĂNG NHẬP NỘI BỘ
 * ======================
 *
 * KHÔNG CÓ KHÓA service_role Ở ĐÂY, VÀ SẼ KHÔNG BAO GIỜ CÓ.
 *
 * Cách làm hiển nhiên cho một trang quản trị là dùng khóa service_role: nó đi
 * xuyên qua mọi RLS, nên mọi thứ chạy ngay. Đó cũng là lý do không dùng — một
 * lỗi lập trình trong /noi-bo sẽ đi xuyên qua toàn bộ hệ thống phân quyền, và
 * khóa đó nằm trong biến môi trường của cùng một Worker phục vụ trang công
 * khai.
 *
 * Thay vào đó: nhân viên đăng nhập bằng Supabase Auth, ta giữ access token
 * của HỌ trong cookie, và mọi truy vấn chạy dưới vai `authenticated` với
 * đúng auth.uid() của người đó. RLS ở migration 0007/0010/0012 quyết định họ
 * thấy gì. Cùng một bộ luật cho giao diện và cho người gọi database trực
 * tiếp — không có đường vòng.
 *
 * Hệ quả cụ thể và đáng giá: một người vai `thu_ngan` đăng nhập vào /noi-bo
 * sẽ KHÔNG thấy ô công tắc nội dung, vì chính sách noi_dung_them chỉ cho
 * chu_so_huu/quan_ly/marketing. Ta không phải viết lại luật đó trong
 * JavaScript, nên nó không thể lệch.
 *
 * COOKIE
 * HttpOnly nên JavaScript trang không đọc được; SameSite=Lax nên trình duyệt
 * không gửi kèm request POST từ site khác — đó là lớp chống CSRF thứ nhất,
 * lớp thứ hai là kiểm tra Origin của Astro (bật trong astro.config.mjs).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';
import { phanLoaiLoiAuth, laTraLoiTamThoi, ghiQuaTai, QUA_TAI } from './qua-tai.ts';

const COOKIE_PHIEN = 'bt_phien';
const COOKIE_KET_QUA = 'bt_kq';

function layBien(ten: string): string | undefined {
  const v = (import.meta.env as Record<string, unknown>)?.[ten];
  return typeof v === 'string' && v ? v : undefined;
}

export function coDatabase(): boolean {
  return !!(layBien('PUBLIC_SUPABASE_URL') && layBien('PUBLIC_SUPABASE_ANON_KEY'));
}

interface Token {
  access_token: string;
  refresh_token: string;
}

/** Nhân sự đang đăng nhập, đọc qua RLS nên chính database quyết định nội dung. */
export interface NhanSu {
  id: string;
  ho_ten: string;
  // Khớp đúng enum vai_tro: bốn vai CRM ở 0001 và ba vai kho ở 0017. Bản
  // trước khai thêm 'phuc_vu' và 'bep' — hai vai KHÔNG TỒN TẠI trong database.
  vai_tro: 'chu_so_huu' | 'quan_ly' | 'thu_ngan' | 'marketing'
         | 'thu_kho' | 'nhan_vien_quay' | 'ke_toan';
  chi_nhanh_id: string | null;
  email: string;
}

export interface Phien {
  client: SupabaseClient;
  nhanSu: NhanSu;
}

function docToken(cookies: AstroCookies): Token | null {
  const raw = cookies.get(COOKIE_PHIEN)?.value;
  if (!raw) return null;
  try {
    const t = JSON.parse(raw);
    return typeof t?.access_token === 'string' && typeof t?.refresh_token === 'string'
      ? t : null;
  } catch { return null; }
}

function ghiToken(cookies: AstroCookies, t: Token) {
  cookies.set(COOKIE_PHIEN, JSON.stringify(t), {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function xoaToken(cookies: AstroCookies) {
  cookies.delete(COOKIE_PHIEN, { path: '/' });
}

function taoClientVoiToken(accessToken: string): SupabaseClient {
  return createClient(layBien('PUBLIC_SUPABASE_URL')!, layBien('PUBLIC_SUPABASE_ANON_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/**
 * Lấy phiên hiện tại, tự làm mới token nếu hết hạn.
 *
 * Trả về null cho MỌI trường hợp không đăng nhập được — chưa có database,
 * chưa có cookie, token hỏng, hoặc đã đăng nhập Supabase nhưng KHÔNG có dòng
 * trong bảng nhan_su. Trường hợp cuối quan trọng: một tài khoản Supabase Auth
 * tự đăng ký được thì cũng chỉ là một tài khoản trống, không phải nhân viên.
 *
 * Trả về QUA_TAI khi KHÔNG KIỂM ĐƯỢC vì Supabase bận hoặc mất mạng (xem
 * lib/qua-tai.ts). Khi đó cookie còn nguyên — token chưa bị đụng tới, nên
 * không có lý do gì bắt người ta đăng nhập lại.
 */
export async function layPhien(cookies: AstroCookies): Promise<Phien | null | typeof QUA_TAI> {
  if (!coDatabase()) return null;
  const t = docToken(cookies);
  if (!t) return null;

  let client = taoClientVoiToken(t.access_token);
  let uid: string | null = null;
  let email = '';

  const { data: u, error: loiUser } = await client.auth.getUser(t.access_token);
  if (u?.user) {
    uid = u.user.id;
    email = u.user.email ?? '';
  } else if (loiUser && phanLoaiLoiAuth(loiUser) !== 'tu_choi') {
    // Supabase bận / mất mạng — access token có thể vẫn còn hạn. Làm mới lúc
    // này là tiêu thêm một lượt của hạn mức chung, và làm mới hỏng thì mất phiên.
    ghiQuaTai('kiểm phiên', loiUser);
    return QUA_TAI;
  } else {
    // Access token hết hạn — thử refresh token. Bị TỪ CHỐI thì coi như đăng
    // xuất. Supabase bận / mất mạng thì refresh token vẫn còn: giữ cookie.
    try {
      const tam = createClient(layBien('PUBLIC_SUPABASE_URL')!, layBien('PUBLIC_SUPABASE_ANON_KEY')!,
        { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await tam.auth.refreshSession({ refresh_token: t.refresh_token });
      if (error && phanLoaiLoiAuth(error) !== 'tu_choi') { ghiQuaTai('gia hạn phiên', error); return QUA_TAI; }
      if (error || !data.session) { xoaToken(cookies); return null; }
      ghiToken(cookies, {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      client = taoClientVoiToken(data.session.access_token);
      uid = data.session.user.id;
      email = data.session.user.email ?? '';
    } catch (e) { ghiQuaTai('gia hạn phiên', e); return QUA_TAI; }
  }

  // Ai là nhân viên do bảng nhan_su quyết định, không do Supabase Auth.
  const { data: ns, error, status } = await client
    .from('nhan_su')
    .select('id, ho_ten, vai_tro, chi_nhanh_id')
    .eq('auth_uid', uid)
    .eq('dang_lam', true)
    .maybeSingle();

  // Database bận / mất mạng: chưa biết có phải nhân viên không — đừng trả null
  // (null là "không phải nhân viên", đưa về trang đăng nhập).
  if (error && laTraLoiTamThoi(status)) { ghiQuaTai('đọc nhân sự', status); return QUA_TAI; }
  if (error || !ns) return null;

  return { client, nhanSu: { ...(ns as Omit<NhanSu, 'email'>), email } };
}

/** Đăng nhập. Trả về câu lỗi tiếng Việt, hoặc null nếu thành công. */
export async function dangNhap(
  cookies: AstroCookies, email: string, matKhau: string,
): Promise<string | null> {
  if (!coDatabase()) return 'Chưa nối database. Xem hướng dẫn trong web/README.md.';

  const tam = createClient(layBien('PUBLIC_SUPABASE_URL')!, layBien('PUBLIC_SUPABASE_ANON_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } });

  const { data, error } = await tam.auth.signInWithPassword({ email, password: matKhau });
  if (error || !data.session) {
    // Bận / mất mạng KHÔNG phải sai mật khẩu. Báo "sai mật khẩu" ở đây thì
    // người ta gõ lại liên tục — mỗi lần gõ lại là thêm một lượt vào đúng cái
    // hạn mức đang cạn (lib/qua-tai.ts). Câu lấy từ CAU_DANG_NHAP_TAM.
    const loai = error ? phanLoaiLoiAuth(error) : 'mat_ket_noi';
    if (loai !== 'tu_choi') ghiQuaTai('đăng nhập', error);
    if (loai === 'qua_tai') {
      return 'Đang có nhiều người đăng nhập cùng lúc. Đợi khoảng một phút rồi thử lại — không phải do sai mật khẩu.';
    }
    if (loai === 'mat_ket_noi') {
      return 'Chưa kết nối được máy chủ đăng nhập. Đợi vài phút rồi thử lại — không phải do sai mật khẩu.';
    }
    // Cố ý không nói "email này không tồn tại" — đó là một đường dò tài khoản.
    return 'Email hoặc mật khẩu không đúng.';
  }

  ghiToken(cookies, {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  // Đăng nhập Supabase thành công vẫn chưa đủ. Nếu không có dòng nhan_su thì
  // xóa cookie ngay, để không ai ở trạng thái "đã đăng nhập mà không thấy gì"
  // rồi tưởng giao diện hỏng.
  const phien = await layPhien(cookies);
  // Đăng nhập đã xong nhưng database bận nên chưa kiểm được nhân sự: giữ
  // phiên, cho vào — middleware kiểm lại ở MỌI trang sau, bận thì trang tự
  // tải lại. Xóa cookie ở đây là bắt người ta đăng nhập thêm một lượt nữa.
  if (phien === QUA_TAI) return null;
  if (!phien) {
    xoaToken(cookies);
    return 'Tài khoản này chưa được nối với nhân sự nào. Liên hệ chủ nhà hàng.';
  }
  return null;
}

// -----------------------------------------------------------------------------
// KẾT QUẢ SAU KHI GỬI FORM
// -----------------------------------------------------------------------------
// Form gửi xong thì chuyển hướng sang GET, để bấm F5 không gửi lại lần nữa —
// khách dùng 4G chập chờn rất hay bấm lại.
//
// Kết quả đi qua COOKIE DÙNG MỘT LẦN, không qua tham số URL. Mã hồ sơ và mã
// đặt bàn đi vào URL là đi vào lịch sử trình duyệt, vào Referer gửi sang
// Google Fonts, và vào ảnh chụp màn hình khách gửi cho nhau.
// -----------------------------------------------------------------------------
export interface KetQua {
  ok: boolean;
  ma?: string;
  loi?: string;
  /** Không nghe được trả lời: KHÔNG CHẮC database đã ghi hay chưa (xu-ly-form.ts). */
  khongChac?: boolean;
}

export function ghiKetQua(cookies: AstroCookies, kq: KetQua) {
  cookies.set(COOKIE_KET_QUA, JSON.stringify(kq), {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 300,
  });
}

export function docKetQua(cookies: AstroCookies): KetQua | null {
  const raw = cookies.get(COOKIE_KET_QUA)?.value;
  if (!raw) return null;
  cookies.delete(COOKIE_KET_QUA, { path: '/' });
  try { return JSON.parse(raw) as KetQua; } catch { return null; }
}

/**
 * IP thật của khách, để database đếm số lần gửi.
 *
 * Chỉ tin CF-Connecting-IP: Cloudflare tự đặt header này và ghi đè mọi giá
 * trị khách tự gửi lên. X-Forwarded-For thì khách giả được, mà một header
 * giả được dùng để chống spam thì chỉ là trang trí.
 */
export function layIp(request: Request): string | null {
  const ip = request.headers.get('cf-connecting-ip');
  return ip && ip.length < 64 ? ip : null;
}

/**
 * Đổi lỗi từ database thành câu khách đọc được.
 *
 * Các hàm trong 0012/0013 raise exception bằng tiếng Việt và đã tính tới
 * việc câu đó hiện thẳng cho khách. Nên ưu tiên dùng nguyên văn; chỉ khi
 * không nhận ra mới dùng câu chung.
 */
export function loiTiengViet(e: unknown): string {
  const msg =
    typeof e === 'object' && e !== null && 'message' in e
      ? String((e as { message: unknown }).message) : '';
  // PostgREST bọc câu lỗi của Postgres nguyên văn trong .message.
  if (msg && /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(msg)) {
    return msg;
  }
  return 'Chưa gửi được. Thông tin của bạn CHƯA được ghi nhận. Vui lòng thử lại hoặc nhắn cho Beeftown qua Facebook.';
}
