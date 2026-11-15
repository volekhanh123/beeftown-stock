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
  // Khớp đúng enum vai_tro: bốn vai CRM ở 0001, ba vai kho ở 0017 và học viên
  // ở 0118 (chỉ mở được /noi-bo/dao-tao — middleware.ts). Bản trước khai thêm
  // 'phuc_vu' và 'bep' — hai vai KHÔNG TỒN TẠI trong database.
  vai_tro: 'chu_so_huu' | 'quan_ly' | 'thu_ngan' | 'marketing'
         | 'thu_kho' | 'nhan_vien_quay' | 'ke_toan' | 'hoc_vien';
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

/**
 * DẤU PHIÊN — cookie bt_dau_phien. KHÔNG httpOnly (JavaScript của trang phải đọc được), chỉ mang một chuỗi ngẫu
 * nhiên, không mang gì của phiên: lộ ra cũng không mở được gì.
 *
 * Trình duyệt giữ trang vừa rời trong bộ nhớ quay lại (bfcache) và đưa nó trở lại mà không hỏi máy chủ — trang của
 * người vừa đăng xuất hiện lại cho người đến sau. Trang không tự biết phiên đã kết thúc, nên máy chủ phải để lại
 * một tín hiệu đọc được: dấu này đổi mỗi lần cookie phiên bị xóa (đăng xuất, phiên bị Supabase từ chối, máy dùng
 * chung mất phiên máy, tài khoản bị khóa — mọi đường đều qua xoaToken). Mỗi trang nội bộ mang dấu máy chủ thấy lúc
 * dựng nó (components/SauDangXuat.astro) và so lại khi trang hiện lại từ bộ nhớ, và lúc tải khi trình duyệt dựng lại
 * trang từ bản lưu đệm cũ vì bấm Quay lại; dấu đã khác thì trang được xin lại từ máy chủ (lib/sau-dang-xuat.js).
 *
 * Làm mới token (ghiToken) và đăng nhập KHÔNG đổi dấu: phiên vẫn là phiên đó, đổi dấu là bắt mọi trang đang mở xin
 * lại từ máy chủ ở lần Quay lại kế tiếp — mất chữ đang gõ.
 *
 * Path=/ chứ không phải /noi-bo (vòng bốn 14/11): trang nội bộ còn mở được qua địa chỉ viết khác — //noi-bo/…,
 * /noi%2Dbo/… — mà trình duyệt so Path của cookie với đường dẫn THÔ. Cookie đặt Path=/noi-bo thì ở các địa chỉ đó cả
 * máy chủ lẫn đoạn mã đều không thấy dấu, hai bên cùng đọc ra chuỗi rỗng và luôn "khớp". Dấu không mang gì của phiên,
 * nên gửi kèm cả trang công khai cũng không lộ gì.
 *
 * Cái giá, cố ý: phiên bị Supabase từ chối giữa lúc đang gõ một form thì sau khi đăng nhập lại, bấm Quay lại về form
 * đó là form được xin lại từ máy chủ — chữ đang gõ mất. Máy chủ không phân biệt được người đăng nhập lại là người cũ hay người
 * khác, nên trang của phiên đã kết thúc không được hiện lại cho ai. (Cookie tự hết hạn sau 7 ngày thì không qua
 * xoaToken, dấu không đổi, form còn nguyên.)
 */
export const COOKIE_DAU_PHIEN = 'bt_dau_phien';

function doiDauPhien(cookies: AstroCookies) {
  try {
    cookies.set(COOKIE_DAU_PHIEN, crypto.randomUUID(), {
      httpOnly: false,
      secure: (import.meta.env as { PROD?: boolean } | undefined)?.PROD === true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  } catch { /* không đặt được dấu thì việc xóa cookie phiên vẫn phải xong */ }
}

/**
 * Các hộp cookie (mỗi lượt xin trang một hộp) mà xoaToken đã chạy: lượt trả lời đó vừa KẾT THÚC một phiên. middleware.ts
 * hỏi qua phienVuaKetThuc để gắn Clear-Site-Data: "cache" vào đúng những trả lời như vậy — không chỉ trả lời của nút
 * Đăng xuất (vòng bốn 14/11: phiên bị Supabase từ chối hay tài khoản bị khóa thì bản lưu đệm của trình duyệt còn nguyên).
 */
const DA_KET_THUC = new WeakSet<object>();

export function phienVuaKetThuc(cookies: AstroCookies): boolean {
  return DA_KET_THUC.has(cookies);
}

export function xoaToken(cookies: AstroCookies) {
  cookies.delete(COOKIE_PHIEN, { path: '/' });
  doiDauPhien(cookies);
  DA_KET_THUC.add(cookies);
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
  // Hỏi được database (không lỗi) và KHÔNG có dòng nhân sự đang làm: tài khoản bị khóa (dang_lam = false) giữa lúc
  // đang đăng nhập, hoặc một tài khoản lạ. Với người dùng thì phiên này đã hết — xóa cookie và đổi dấu phiên như mọi
  // lần phiên kết thúc, để trang cũ của họ không hiện lại khi bấm Quay lại, kể cả cho người đăng nhập sau (vòng bốn
  // 14/11: bản trước chỉ trả null, cookie còn, dấu không đổi). Mở khóa lại thì người đó đăng nhập lại. Database báo
  // lỗi thì KHÔNG xóa: chưa biết gì về tài khoản này.
  if (!error && !ns) xoaToken(cookies);
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

/** Đăng xuất không được treo theo Supabase: đợi lượt thu hồi tối đa chừng này rồi trả lời. */
const HAN_THU_HOI_MS = 4000;

/** Client anon riêng, không lưu phiên — cho việc thu hồi phiên lúc đăng xuất. null = chưa nối database. */
function taoClientThuHoi(): SupabaseClient | null {
  if (!coDatabase()) return null;
  return createClient(layBien('PUBLIC_SUPABASE_URL')!, layBien('PUBLIC_SUPABASE_ANON_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Đợi `viec` (không bao giờ ném lỗi), nhưng không quá `ms` mili-giây. Trả true khi `viec` xong trong hạn. */
async function doiCoHan(viec: Promise<void>, ms: number): Promise<boolean> {
  let hen: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      viec.then(() => true),
      new Promise<boolean>(xong => { hen = setTimeout(() => xong(false), ms); }),
    ]);
  } finally {
    clearTimeout(hen);
  }
}

/**
 * Thu hồi ở Supabase phiên mà cookie đang giữ. Không bao giờ ném lỗi: không thu hồi được thì người gọi vẫn xóa
 * cookie (đăng xuất trên máy này luôn xong).
 *
 *   · Access token còn hạn: một lượt /logout, phạm vi "local" — chỉ phiên này, máy khác của cùng người không bị
 *     đá ra. Không đụng cửa /token (hạn mức đăng nhập chung, lib/qua-tai.ts).
 *   · Access token hết hạn (Supabase TỪ CHỐI /logout): đổi refresh token lấy phiên mới rồi thu hồi phiên đó —
 *     refresh token trong bản cookie đã bị chép cũng chết theo.
 *   · Phiên đã mất ở Supabase (AuthSessionMissingError): không còn gì để thu hồi.
 *   · Supabase bận / mất mạng: chưa biết token có hỏng không — không đổi refresh token (đổi lúc này là tiêu thêm
 *     đúng cái hạn mức đang cạn). Phiên ở Supabase còn sống (mặc định Supabase không cho phiên một hạn nào — 7 ngày
 *     chỉ là tuổi của cookie); ghi một dòng nhật ký "[qua-tai] đăng xuất · thu hồi phiên" để chủ thấy.
 *   · Lượt /logout CUỐI của đường "token hết hạn" hỏng cũng ghi dòng đó (vòng hai 14/11: bản đầu bỏ qua kết quả —
 *     phiên còn sống với refresh token vừa xoay mà không ai biết).
 */
async function thuHoiPhien(t: Token, tam: SupabaseClient): Promise<void> {
  try {
    const { error } = await tam.auth.admin.signOut(t.access_token, 'local');
    if (!error || error.name === 'AuthSessionMissingError') return;
    if (phanLoaiLoiAuth(error) !== 'tu_choi') { ghiQuaTai('đăng xuất · thu hồi phiên', error); return; }
    const { data, error: loiDoi } = await tam.auth.refreshSession({ refresh_token: t.refresh_token });
    if (data.session) {
      const { error: loiRa } = await tam.auth.signOut({ scope: 'local' });
      if (loiRa && phanLoaiLoiAuth(loiRa) !== 'tu_choi') ghiQuaTai('đăng xuất · thu hồi phiên', loiRa);
    } else if (loiDoi && phanLoaiLoiAuth(loiDoi) !== 'tu_choi') ghiQuaTai('đăng xuất · thu hồi phiên', loiDoi);
  } catch (e) { ghiQuaTai('đăng xuất · thu hồi phiên', e); }
}

/**
 * Đăng xuất: thu hồi phiên ở Supabase, rồi xóa cookie.
 *
 * Rà soát 14/11/2026: bản trước chỉ xóa cookie trên trình duyệt đang bấm. Phiên ở Supabase vẫn sống (mặc định
 * Supabase không cho phiên một hạn nào; 7 ngày chỉ là tuổi của cookie, bản cookie đã bị chép không theo), nên ai đã
 * chép được cookie bt_phien từ trước vẫn vào được /noi-bo dưới tên người vừa đăng xuất.
 *
 * Còn lại, không đóng được ở đây: access token (JWT) đã cấp vẫn được PostgREST nhận tới khi tự hết hạn (tối đa
 * một giờ) nếu ai đó cầm nó gọi thẳng database; qua website thì không, vì layPhien hỏi Supabase ở mỗi lần mở trang.
 *
 * Không treo theo Supabase: lượt thu hồi chỉ được đợi tối đa HAN_THU_HOI_MS. Máy chủ đăng nhập không trả lời thì
 * trang vẫn trả lời — không thì người bấm Đăng xuất rồi đóng tab sẽ không bao giờ nhận được lệnh xóa cookie.
 *
 * Quá hạn đợi KHÔNG được thành bỏ dở (vòng hai 14/11, thử trên workerd): Worker cắt mọi việc còn dở ngay khi trang
 * đã trả lời — lượt /logout đang đi bị đóng kết nối, phiên không bị thu hồi. Nên lượt thu hồi được giao cho
 * `chayNen` ngay từ đầu (trang thật: waitUntil của Worker, cho việc chạy tiếp tới khoảng 30 giây sau khi trả lời),
 * và quá hạn thì ghi một dòng nhật ký. Không truyền `chayNen`, hoặc nơi chạy không có waitUntil, thì việc vẫn chạy,
 * chỉ là không ai giữ cho nó chạy hết.
 *
 * Đăng xuất trên máy này LUÔN xong (vòng ba 14/11): không lỗi bất ngờ nào ở bước thu hồi thành trang 500, và cookie
 * vẫn bị xóa ở khối finally — trang 500 ở đây là người bấm Đăng xuất không nhận được lệnh xóa cookie. Mỗi kiểu hỏng
 * để lại MỘT dòng nhật ký riêng: dựng client hỏng → "thu hồi phiên"; giao việc chạy nền ném lỗi → "không giao được
 * việc chạy nền" (lượt thu hồi vẫn được đợi trong hạn; quá hạn thì không ai giữ cho nó chạy hết — vòng bốn 14/11:
 * bản trước nuốt lỗi này không một dòng nào).
 *
 * Tham số thứ hai: `chayNen` do trang truyền; `taoTam` và `hanMs` là chỗ kiểm thử thay vào
 * (crm/test/test-noi-bo-dang-xuat.mjs — client nối vào Supabase Auth giả, hạn đợi ngắn).
 */
export async function dangXuat(
  cookies: AstroCookies,
  { taoTam = taoClientThuHoi, hanMs = HAN_THU_HOI_MS, chayNen }:
    { taoTam?: () => SupabaseClient | null; hanMs?: number; chayNen?: (viec: Promise<unknown>) => void } = {},
): Promise<void> {
  try {
    const t = docToken(cookies);
    const tam = t ? taoTam() : null;
    if (t && tam) {
      const viec = thuHoiPhien(t, tam);   // không bao giờ ném lỗi
      // Giao việc mà hỏng (không có ngữ cảnh Worker hợp lệ): việc vẫn chạy, đăng xuất vẫn phải xong — lỗi lọt ra
      // ngoài là trang trả 500 và lệnh xóa cookie không về tới trình duyệt. Không ai giữ cho việc chạy hết nữa, nên
      // ghi một dòng để chủ biết; hạn đợi bên dưới vẫn áp dụng.
      try { chayNen?.(viec); } catch (e) { ghiQuaTai('đăng xuất · không giao được việc chạy nền', e); }
      if (!(await doiCoHan(viec, hanMs))) ghiQuaTai('đăng xuất · thu hồi phiên chưa xong trong hạn đợi', 408);
    }
  } catch (e) {
    // Phiên ở Supabase CHƯA được thu hồi — chủ phải thấy trong nhật ký. ghiQuaTai chỉ ghi loại lỗi và mã HTTP, không
    // ghi chữ của lỗi (chữ đó có thể mang địa chỉ hay token).
    ghiQuaTai('đăng xuất · thu hồi phiên', e);
  } finally {
    xoaToken(cookies);
  }
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
  /** Form nào ghi kết quả này. Đơn mua thịt (0113) ghi 'dat_hang' — trang Mua thịt về bỏ qua kết quả của form khác. */
  loai?: 'dat_hang';
  /** Đơn mua thịt (0115): website có VNPay mà chưa mở được trang trả tiền — loi mang lý do; trang mời trả lại. */
  choTra?: boolean;
  /** Đơn mua thịt (0115): đơn này đã trả đủ qua VNPay (gửi lại form của đơn đã trả). */
  daTra?: boolean;
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
