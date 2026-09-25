/**
 * KHO — NHÂN VIÊN VÀ MÁY DÙNG CHUNG (GĐ5d, migration 0034)
 *
 * Trang /noi-bo/kho/cai-dat/nhan-vien:
 *   · CHỦ tự tạo tài khoản cho thủ kho, NV quầy/bếp, kế toán và cho tablet
 *     dùng chung — không phải nhờ người rành kỹ thuật vào Supabase.
 *   · Chủ khóa / mở lại tài khoản (nghỉ việc thì khóa, không xóa).
 *   · Quản lý và chủ xem máy dùng chung: ai đã gắn, ai đang bị khóa vì sai
 *     PIN; mở khóa, khóa hẳn, tắt máy, gỡ người.
 *
 * TẠO TÀI KHOẢN — HAI BƯỚC, HAI CLIENT KHÁC NHAU
 *
 *   1. auth.signUp bằng một client anon RIÊNG, dùng xong bỏ
 *      (persistSession: false). Phiên của người mới KHÔNG bao giờ được ghi
 *      vào cookie — ghi vào là chủ bị đăng xuất và thành người mới.
 *      Vẫn không có khóa service_role nào ở đây: đăng ký bằng khóa anon là
 *      việc ai cũng làm được với Supabase, nên an toàn không nằm ở bước này.
 *   2. kho_them_nhan_su bằng client của CHỦ (mang access token của chủ).
 *      Chính bước này biến một tài khoản trống thành nhân viên — và database
 *      chỉ cho chủ làm. Người lạ tự đăng ký được tài khoản Supabase thì vẫn
 *      không thấy gì, vì không có dòng nhan_su (xem layPhien trong phien.ts).
 *
 * Mật khẩu tạm sinh ở máy chủ bằng crypto.getRandomValues, hiện MỘT lần trên
 * màn ngay sau khi tạo. Không lưu ở đâu cả: không database, không cookie báo,
 * không URL.
 *
 * Hàm thuần (taoMatKhauTam, cauLoiDangKy, docFormNhanVien, trangThaiMayChung)
 * không gọi mạng — test được bằng Node.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, laUuid, type KetQua } from './chung.ts';
import { biMatHopLe, BI_MAT_TOI_THIEU } from './may-chung-ma-hoa.ts';

// -----------------------------------------------------------------------------
// VAI
// -----------------------------------------------------------------------------
/**
 * Vai chủ tạo được ở màn này — khớp danh sách trong kho_them_nhan_su (0034),
 * trừ may_ipos: máy đồng bộ iPOS chưa dùng tới (GĐ7a), để trong danh sách
 * chỉ làm rối. Vai CRM (quản lý, thu ngân, marketing) KHÔNG tạo ở đây vì họ
 * thấy dữ liệu khách hàng.
 */
export const VAI_TAO_DUOC = ['thu_kho', 'nhan_vien_quay', 'ke_toan', 'may_chung'] as const;
export type VaiTaoDuoc = typeof VAI_TAO_DUOC[number];

export const TEN_VAI_NHAN_VIEN: Record<string, string> = {
  quan_ly: 'Quản lý',
  thu_kho: 'Thủ kho',
  nhan_vien_quay: 'NV quầy/bếp',
  ke_toan: 'Kế toán',
  may_chung: 'Máy tính bảng dùng chung',
  may_ipos: 'Máy đồng bộ iPOS',
};

// -----------------------------------------------------------------------------
// KIỂU DỮ LIỆU
// -----------------------------------------------------------------------------
/** Một dòng kho_ds_nhan_su_kho (chủ). */
export interface NhanVienKho {
  id: string; ho_ten: string; email: string | null; vai_tro: string;
  chi_nhanh_id: string | null; ten_chi_nhanh: string | null;
  dang_lam: boolean; created_at: string;
  /** Số máy dùng chung người này đã gắn vào. */
  so_may: number;
}

/** Người đã gắn vào một máy (kho_ds_may → nguoi). Không có PIN. */
export interface NguoiTrenMay {
  nhan_su_id: string; ho_ten: string; vai_tro: string; dang_lam: boolean;
  sai_lien_tiep: number;
  /** Đang bị khóa vì sai PIN tới lúc này; null = không bị khóa. */
  khoa_den: string | null;
  gan_luc: string; dung_lan_cuoi: string | null;
}

/** Một dòng kho_ds_may (quyền duyet). */
export interface MayDungChung {
  id: string; chi_nhanh_id: string; ten_chi_nhanh: string; ten: string;
  phut_khoa: number;
  /** false = đã tắt: phiên máy hết tác dụng, phải đăng ký lại. */
  dang_dung: boolean;
  /** Khóa hẳn (15 lần sai PIN / 30 phút hoặc 30 lần / 24 giờ, hoặc quản lý khóa) — quản lý mở. */
  bi_khoa: boolean; bi_khoa_luc: string | null;
  tai_khoan_nhan_su_id: string; tai_khoan_ho_ten: string; tai_khoan_dang_lam: boolean;
  nguoi_dang_dung: string | null; ten_nguoi_dang_dung: string | null; dung_tu: string | null;
  created_at: string;
  /** Số lần sai PIN trên máy trong 30 phút (tính từ lần mở khóa gần nhất). */
  sai_30_phut: number;
  nguoi: NguoiTrenMay[];
}

/** Kết quả tạo tài khoản: có mật khẩu tạm để hiện MỘT lần. */
export interface KetQuaTaoNhanVien extends KetQua {
  moi?: {
    ho_ten: string; email: string; vai_tro: string; ten_chi_nhanh: string;
    mat_khau: string;
    /** Supabase đang bật "Confirm email": phải bấm link trong thư trước khi đăng nhập được. */
    can_xac_nhan: boolean;
  };
}

// -----------------------------------------------------------------------------
// MÁY DÙNG CHUNG CÓ BẬT KHÔNG — bí mật Worker KHO_MAY_KHOA
// -----------------------------------------------------------------------------
/**
 * Đọc bí mật KHO_MAY_KHOA. Trên Worker: `env` của `cloudflare:workers` (bí mật
 * đặt bằng `wrangler secret put`, KHÔNG đặt trong wrangler.toml). Chạy thử
 * bằng Node thì đọc process.env. Không có → undefined, không bao giờ ném lỗi.
 */
export async function docBiMatMay(): Promise<string | undefined> {
  try {
    // @ts-ignore — dự án không cài kiểu của workerd; module này chỉ có trên Worker.
    const m = await import('cloudflare:workers');
    const v = (m as { env?: Record<string, unknown> })?.env?.KHO_MAY_KHOA;
    if (typeof v === 'string' && v) return v;
  } catch { /* không chạy trên Worker — thử process.env */ }
  const p = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.KHO_MAY_KHOA;
  return typeof p === 'string' && p ? p : undefined;
}

export interface TrangThaiMayChung {
  bat: boolean;
  /** Câu cho màn Cài đặt. */
  cau: string;
}

/** Bí mật đủ dài thì tính năng bật; thiếu / ngắn thì tắt và nói cách bật. */
export function trangThaiMayChung(biMat: unknown): TrangThaiMayChung {
  if (biMatHopLe(biMat)) {
    return { bat: true, cau: 'Đã bật. Máy tính bảng ở quầy/bếp đổi người bằng PIN và tự khóa khi không dùng.' };
  }
  const ngan = typeof biMat === 'string' && biMat.length > 0;
  return {
    bat: false,
    cau: ngan
      ? `Chưa bật: bí mật KHO_MAY_KHOA quá ngắn (cần ít nhất ${BI_MAT_TOI_THIEU} ký tự).`
      : 'Chưa bật: Cloudflare chưa có bí mật KHO_MAY_KHOA.',
  };
}

// -----------------------------------------------------------------------------
// MẬT KHẨU TẠM
// -----------------------------------------------------------------------------
// Bỏ các chữ dễ nhầm khi đọc cho nhau nghe: 0/O/o, 1/l/I, 5/S/s, 2/Z/z.
const CHU_THUONG = 'abcdefghijkmnpqrtuvwxy';
const CHU_HOA = 'ABCDEFGHJKLMNPQRTUVWXY';
const CHU_SO = '346789';
const BANG_CHU = CHU_THUONG + CHU_HOA + CHU_SO;

/** Một chữ ngẫu nhiên trong bảng, không lệch (bỏ byte rơi vào phần dư). */
function chuNgauNhien(bang: string): string {
  const tran = 256 - (256 % bang.length);
  const b = new Uint8Array(1);
  for (;;) {
    crypto.getRandomValues(b);
    if (b[0] < tran) return bang[b[0] % bang.length];
  }
}

/**
 * Mật khẩu tạm dạng "Xk7m-4Rtq-9wPa": 12 chữ ngẫu nhiên (~69 bit) chia 3
 * nhóm cho dễ đọc và dễ gõ trên điện thoại. Luôn có chữ thường, chữ hoa, chữ
 * số và dấu "-" — qua được mọi mức "mật khẩu mạnh" Supabase cho chọn.
 */
export function taoMatKhauTam(): string {
  for (;;) {
    let s = '';
    for (let i = 0; i < 12; i++) s += chuNgauNhien(BANG_CHU);
    if (/[a-z]/.test(s) && /[A-Z]/.test(s) && /[0-9]/.test(s)) {
      return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
    }
  }
}

// -----------------------------------------------------------------------------
// LỖI ĐĂNG KÝ CỦA SUPABASE → CÂU TIẾNG VIỆT CÓ CÁCH SỬA
// -----------------------------------------------------------------------------
const CHO_EMAIL = 'Supabase → Authentication → Sign In / Providers → Email';

/**
 * Lỗi của auth.signUp. Supabase trả mã (`code`) ở bản mới, câu tiếng Anh ở
 * bản cũ — xét cả hai. Mỗi câu nói rõ chủ phải bấm gì ở đâu.
 */
export function cauLoiDangKy(e: unknown): string {
  const o = (typeof e === 'object' && e !== null ? e : {}) as { code?: unknown; message?: unknown; status?: unknown };
  const ma = String(o.code ?? '');
  const m = String(o.message ?? e ?? '');
  const la = (cacMa: string[], re: RegExp) => cacMa.includes(ma) || re.test(m);

  if (la(['signup_disabled'], /signups? not allowed|signup.*disabled/i)) {
    return 'Supabase đang tắt đăng ký tài khoản mới. Cách sửa: vào Supabase → Authentication → Sign In / Providers, '
      + 'bật "Allow new users to sign up", rồi bấm tạo lại. Bật cũng không sao: người lạ tự đăng ký được tài khoản '
      + 'thì vẫn không vào được app, vì chỉ chủ mới nối tài khoản với nhân viên.';
  }
  if (la(['email_provider_disabled'], /email (logins|signups|provider).*disabled/i)) {
    return `Supabase đang tắt đăng nhập bằng email. Cách sửa: vào ${CHO_EMAIL}, bật "Enable Email provider", rồi tạo lại.`;
  }
  if (la(['user_already_exists', 'email_exists', 'identity_already_exists'], /already (been )?registered|already exists/i)) {
    return 'Email này đã có tài khoản đăng nhập. Dùng email khác. Nếu là nhân viên cũ bị khóa thì bấm "Mở lại" ở danh sách bên dưới.';
  }
  if (la(['email_address_not_authorized'], /not authorized/i)) {
    return 'Supabase không gửi được thư xác nhận tới email này (máy gửi thư có sẵn của Supabase chỉ gửi cho thành viên dự án). '
      + `Cách sửa: vào ${CHO_EMAIL}, tắt "Confirm email", rồi tạo lại.`;
  }
  if (la(['over_email_send_rate_limit'], /email rate limit|rate limit.*email/i)) {
    return 'Supabase đã gửi quá số thư xác nhận cho phép trong một giờ. '
      + `Cách sửa: vào ${CHO_EMAIL}, tắt "Confirm email", rồi tạo lại (hoặc chờ một giờ).`;
  }
  if (la(['over_request_rate_limit'], /rate limit|too many requests/i) || o.status === 429) {
    return 'Tạo quá nhiều tài khoản liền nhau — chờ vài phút rồi thử lại.';
  }
  if (la(['email_address_invalid', 'validation_failed'], /invalid.*email|email.*invalid|unable to validate email/i)) {
    return 'Supabase không nhận email này. Kiểm tra lại (ví dụ ten@gmail.com), không có khoảng trắng hay dấu tiếng Việt.';
  }
  if (la(['weak_password'], /password/i)) {
    return 'Supabase đòi mật khẩu mạnh hơn mật khẩu tạm. Bấm tạo lại (mỗi lần một mật khẩu mới), '
      + 'hoặc xem mức yêu cầu ở Supabase → Authentication → Sign In / Providers → Email → Password requirements.';
  }
  if (la(['captcha_failed'], /captcha/i)) {
    return 'Supabase đang bật captcha cho đăng ký nên máy chủ không tạo hộ được. '
      + 'Cách sửa: vào Supabase → Authentication → Attack Protection, tắt captcha, rồi tạo lại.';
  }
  if (/fetch failed|network|timeout|ECONN/i.test(m)) return cauLoiKho(e);
  return `Supabase chưa tạo được tài khoản${m ? `: ${m}` : '.'}`;
}

// -----------------------------------------------------------------------------
// ĐỌC FORM "THÊM NHÂN VIÊN"
// -----------------------------------------------------------------------------
export interface FormNhanVien { ho_ten: string; email: string; vai_tro: VaiTaoDuoc; chi_nhanh_id: string }

/**
 * Kiểm trước khi gọi Supabase: tạo xong tài khoản đăng nhập mà bước nối nhân
 * sự hỏng thì email đó bị chiếm — nên chặn mọi lỗi đoán được TRƯỚC signUp.
 */
export function docFormNhanVien(form: FormData, chiNhanhHopLe: string[]): FormNhanVien | string {
  const ho_ten = String(form.get('ho_ten') ?? '').trim().replace(/\s+/g, ' ');
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const vai = String(form.get('vai_tro') ?? '');
  const cn = String(form.get('chi_nhanh_id') ?? '');
  if (!ho_ten) return 'Cần họ tên (với máy dùng chung: tên máy, ví dụ "Máy quầy Q1").';
  if (ho_ten.length > 100) return 'Họ tên dài quá 100 chữ.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return 'Email chưa đúng dạng (ví dụ ten@gmail.com).';
  }
  if (!(VAI_TAO_DUOC as readonly string[]).includes(vai)) return 'Chọn vai.';
  if (!laUuid(cn) || !chiNhanhHopLe.includes(cn)) return 'Chọn chi nhánh.';
  return { ho_ten, email, vai_tro: vai as VaiTaoDuoc, chi_nhanh_id: cn };
}

// -----------------------------------------------------------------------------
// GỌI DATABASE — NHÂN VIÊN (chủ)
// -----------------------------------------------------------------------------
function layBien(ten: string): string | undefined {
  const v = (import.meta.env as Record<string, unknown>)?.[ten];
  return typeof v === 'string' && v ? v : undefined;
}

/**
 * Tạo tài khoản đăng nhập rồi nối thành nhân viên.
 * `client` là client của CHỦ; signUp đi bằng client anon riêng tạo ở đây.
 */
export async function themNhanVien(
  client: SupabaseClient, form: FormData, chiNhanh: { id: string; ten: string }[],
): Promise<KetQuaTaoNhanVien> {
  const f = docFormNhanVien(form, chiNhanh.map(c => c.id));
  if (typeof f === 'string') return { ok: false, cau: f };

  const url = layBien('PUBLIC_SUPABASE_URL');
  const anon = layBien('PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !anon) return { ok: false, cau: 'Chưa nối database. Xem hướng dẫn trong web/README.md.' };

  // Client riêng, không lưu phiên, không tự làm mới: phiên của người mới chỉ
  // sống trong biến này rồi bị bỏ — không đụng tới cookie bt_phien của chủ.
  const tam = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const matKhau = taoMatKhauTam();

  let uid: string;
  let canXacNhan: boolean;
  try {
    const { data, error } = await tam.auth.signUp({
      email: f.email, password: matKhau, options: { data: { ho_ten: f.ho_ten } },
    });
    if (error) return { ok: false, cau: cauLoiDangKy(error) };
    if (!data.user) return { ok: false, cau: 'Supabase không trả về tài khoản vừa tạo. Thử lại sau ít phút.' };
    // Khi bật "Confirm email", Supabase không báo lỗi với email đã có — nó
    // trả một tài khoản giả không có identity nào (để người ngoài không dò
    // được email). Đó chính là trường hợp "email đã có".
    if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { ok: false, cau: cauLoiDangKy({ code: 'user_already_exists' }) };
    }
    uid = data.user.id;
    canXacNhan = !data.session;
    // Thu hồi luôn phiên Supabase vừa cấp cho người mới — không ai dùng nó.
    if (data.session) { try { await tam.auth.signOut({ scope: 'local' }); } catch { /* bỏ qua */ } }
  } catch (e) {
    return { ok: false, cau: cauLoiDangKy(e) };
  }

  const { error } = await client.rpc('kho_them_nhan_su', {
    p_auth_uid: uid, p_ho_ten: f.ho_ten, p_vai_tro: f.vai_tro, p_chi_nhanh_id: f.chi_nhanh_id,
  });
  if (error) {
    return { ok: false, cau: `Đã tạo tài khoản đăng nhập cho ${f.email} nhưng CHƯA nối được thành nhân viên: `
      + `${cauLoiKho(error)} Email này giờ đã bị chiếm — vào Supabase → Authentication → Users, xóa ${f.email}, rồi tạo lại.` };
  }

  const tenCn = chiNhanh.find(c => c.id === f.chi_nhanh_id)?.ten ?? '';
  return {
    ok: true,
    cau: canXacNhan
      ? `Đã tạo tài khoản cho ${f.ho_ten}. Supabase đang bật "Confirm email": người này phải mở thư và bấm link xác nhận `
        + `rồi mới đăng nhập được. Muốn bỏ bước này: vào ${CHO_EMAIL}, tắt "Confirm email".`
      : `Đã tạo tài khoản cho ${f.ho_ten}. Đưa email và mật khẩu tạm dưới đây cho người đó.`,
    moi: {
      ho_ten: f.ho_ten, email: f.email, vai_tro: f.vai_tro, ten_chi_nhanh: tenCn,
      mat_khau: matKhau, can_xac_nhan: canXacNhan,
    },
  };
}

/** Quản lý, nhân viên kho và tài khoản máy của mọi chi nhánh (chỉ chủ). */
export async function docDsNhanVien(client: SupabaseClient): Promise<NhanVienKho[]> {
  const { data, error } = await client.rpc('kho_ds_nhan_su_kho', { p_chi_nhanh_id: null });
  if (error) throw error;
  return (data ?? []) as NhanVienKho[];
}

/** Khóa (nghỉ việc) — database gỡ luôn người đó khỏi mọi máy dùng chung. */
export async function khoaNhanVien(client: SupabaseClient, id: string): Promise<KetQua> {
  if (!laUuid(id)) return { ok: false, cau: 'Không rõ nhân viên nào.' };
  const { data, error } = await client.rpc('kho_khoa_nhan_su', { p_nhan_su_id: id });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const soMay = Number((data as { so_may_go?: number } | null)?.so_may_go ?? 0);
  return { ok: true, cau: 'Đã khóa tài khoản — người này không đăng nhập được nữa.'
    + (soMay > 0 ? ` Đã gỡ khỏi ${soMay} máy dùng chung.` : '') };
}

export async function moNhanVien(client: SupabaseClient, id: string): Promise<KetQua> {
  if (!laUuid(id)) return { ok: false, cau: 'Không rõ nhân viên nào.' };
  const { error } = await client.rpc('kho_mo_nhan_su', { p_nhan_su_id: id });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: 'Đã mở lại tài khoản. Đăng nhập bằng mật khẩu cũ; máy dùng chung thì phải gắn lại.' };
}

// -----------------------------------------------------------------------------
// GỌI DATABASE — MÁY DÙNG CHUNG (quản lý, chủ: quyền duyet)
// -----------------------------------------------------------------------------
/** Máy của mọi chi nhánh người xem được duyệt (chi nhánh null) hoặc một chi nhánh. */
export async function docDsMay(client: SupabaseClient, chiNhanhId: string | null): Promise<MayDungChung[]> {
  const { data, error } = await client.rpc('kho_ds_may', { p_chi_nhanh_id: chiNhanhId });
  if (error) throw error;
  return (data ?? []) as MayDungChung[];
}

/** Mở khóa cả máy (nsId null) hoặc một người bị khóa vì sai PIN. */
export async function moKhoaMay(client: SupabaseClient, mayId: string, nsId: string | null): Promise<KetQua> {
  if (!laUuid(mayId) || (nsId !== null && !laUuid(nsId))) return { ok: false, cau: 'Không rõ máy nào.' };
  const { error } = await client.rpc('kho_may_mo_khoa', { p_may_id: mayId, p_nhan_su_id: nsId });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: nsId ? 'Đã mở khóa người này — nhập lại PIN được ngay.' : 'Đã mở khóa máy.' };
}

/** Khóa hẳn máy (mất máy, nghi có người dò PIN) — quản lý mở lại. */
export async function khoaHanMay(client: SupabaseClient, mayId: string): Promise<KetQua> {
  if (!laUuid(mayId)) return { ok: false, cau: 'Không rõ máy nào.' };
  const { error } = await client.rpc('kho_may_khoa', { p_may_id: mayId, p_cach: 'quan_ly' });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: 'Đã khóa máy. Không ai mở được bằng PIN cho tới khi quản lý bấm "Mở khóa máy".' };
}

/** Tắt máy: gỡ mọi người, phiên máy hết tác dụng. Dùng lại phải đăng ký lại. */
export async function tatMay(client: SupabaseClient, mayId: string): Promise<KetQua> {
  if (!laUuid(mayId)) return { ok: false, cau: 'Không rõ máy nào.' };
  const { data, error } = await client.rpc('kho_may_tat', { p_may_id: mayId });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const soNguoi = Number((data as { so_nguoi_go?: number } | null)?.so_nguoi_go ?? 0);
  return { ok: true, cau: `Đã tắt máy, gỡ ${soNguoi} người. Muốn dùng lại: đăng ký lại máy trên tablet đó.` };
}

/** Quản lý gỡ một người khỏi máy (người đó muốn dùng lại thì gắn lại, đặt PIN mới). */
export async function goNguoiKhoiMay(client: SupabaseClient, mayId: string, nsId: string): Promise<KetQua> {
  if (!laUuid(mayId) || !laUuid(nsId)) return { ok: false, cau: 'Không rõ máy hoặc người nào.' };
  const { error } = await client.rpc('kho_may_go', { p_may_id: mayId, p_nhan_su_id: nsId });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: 'Đã gỡ người này khỏi máy.' };
}
