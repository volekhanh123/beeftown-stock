/**
 * XÓA FILE CV TRONG KHO — ẩn danh hồ sơ hết hạn, quét CV mồ côi
 * =============================================================
 *
 * Database không xóa được file trong Supabase Storage (bảng storage.objects chặn DELETE thẳng — phải đi
 * qua API Storage), nên mọi việc xóa CV đi qua file này, chạy bằng client của người bấm ở
 * /noi-bo/cai-dat. Quyền do database và policy Storage quyết: chỉ chủ sở hữu xóa được file trong kho
 * ho-so-ung-tuyen (0014); quản lý đọc được kho, không xóa được.
 *
 * HAI VIỆC (migration 0066)
 *
 *   anDanhHoSoHetHan — đọc đường dẫn CV của hồ sơ quá hạn (ho_so_cv_het_han) → xóa trong kho → KIỂM LẠI
 *     file đã không còn → an_danh_ho_so_het_han(những đường dẫn đã chắc chắn xóa). Hồ sơ còn file thì
 *     database giữ nguyên, kể cả đường dẫn: mất đường dẫn là mất dấu file. Lần bấm sau làm tiếp.
 *   donCvMoCoiVaVe — liệt kê thư mục gốc của kho → database chỉ ra thư mục mồ côi
 *     (ho_so_thu_muc_cv_mo_coi) → xóa mọi file trong đó → kho sạch rồi mới dọn vé
 *     (don_dep_phieu_tai_len). Quét theo KHO, không theo vé: CV mồ côi mà vé đã bị xóa từ trước vẫn tìm ra.
 *
 * ĐÚNG SỰ THẬT TRƯỚC (CLAUDE.md mục 5, 7)
 *
 * "Đã xóa N file" chỉ đếm file kho xác nhận đã xóa, hoặc kiểm lại thấy không còn. "Đã ẩn danh N hồ sơ" chỉ
 * khi database trả về con số. Mất trả lời ở bất kỳ bước nào → nói KHÔNG CHẮC và bảo bấm lại: mọi bước
 * làm lại được mà không hỏng gì (xóa file đã không còn = không làm gì; ẩn danh hồ sơ đã ẩn danh = 0).
 *
 * GIẢ ĐỊNH VỀ SUPABASE STORAGE (storage-js 2.x, storage-api; kiểm bằng supabase-js thật trong
 * crm/test/test-tuyen-dung-xoa-cv.mjs nhóm 10, thử thật trên Beeftown-thu — cuối migration 0066):
 *   · remove(khóa[]) trả các dòng ĐÃ xóa, `name` là khóa đầy đủ. Khóa không còn, hoặc bị policy chặn,
 *     KHÔNG báo lỗi — chỉ vắng mặt trong danh sách trả về. Nên khóa vắng mặt phải được liệt kê lại.
 *   · list(tiền tố) trả một cấp; thư mục có id null. Lỗi mạng / cổng / thân hỏng thành { error },
 *     không ném — vẫn bọc try vì một lỗi khác loại thì storage-js ném lại.
 *   · Workers gói Free cho 50 lời gọi ra ngoài mỗi lượt. Mỗi lần bấm dùng tối đa NGAN_SACH_GOI lời gọi
 *     (đếm thật, không chỉ ước lượng) — chừa phần còn lại cho middleware (phiên, nhan_su) và phần trang
 *     đọc lại sau khi bấm. Hết lượt giữa chừng thì dừng, nói "bấm lại"; làm lại không hỏng gì.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { dichNB, type HaiThuTieng, type NgonNguNB } from './ngon-ngu-noi-bo.ts';
import { dichCau } from './cau-noi-bo.ts';
import { laLoiDatabase } from './chu.ts';

/** Tên kho CV (0014). Cột duong_dan_cv lưu kèm tên kho ở đầu: 'ho-so-ung-tuyen/<mã vé>/<tên file>'. */
export const KHO_CV = 'ho-so-ung-tuyen';
const TIEN_TO = `${KHO_CV}/`;
const MA_VE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Lời gọi ra ngoài (Storage + database) tối đa của một lần bấm. */
export const NGAN_SACH_GOI = 40;
/** Khóa mỗi lần gọi xóa (API Storage nhận tới 1.000). */
const LO_XOA = 500;
/** Khóa vắng mặt trong trả lời xóa được liệt kê lại tối đa chừng này lần mỗi lượt. */
const KIEM_LAI_TOI_DA = 10;
/** Thư mục mồ côi dọn trong một lượt bấm — mỗi thư mục là một lần liệt kê. Còn thì bấm lại. */
export const THU_MUC_TOI_DA = 25;
/** Phần ngân sách giữ lại cho sau bước liệt kê thư mục mồ côi: một lần xóa, kiểm lại, một lần dọn vé. */
const DU_TRU_SAU_LIET_KE = 1 + KIEM_LAI_TOI_DA + 1;
/** Mục mỗi trang khi liệt kê; thư mục gốc đọc tối đa TRANG_GOC_TOI_DA trang (5.000 thư mục — nhiều năm CV). */
const TRANG = 1000;
const TRANG_GOC_TOI_DA = 5;
/** Đường dẫn do nopHoSo tạo chỉ có một cấp thư mục; sâu hơn chừng này thì không đoán, coi là chưa dọn được. */
const SAU_TOI_DA = 3;

export interface KetQua { ok: boolean; cau: string }

export type LyDoChuaXoa = 'loi_kho' | 'van_con' | 'het_luot';
export interface KetQuaXoa {
  /** Khóa chắc chắn không còn trong kho: kho xác nhận đã xóa, hoặc liệt kê lại không thấy. */
  daXoa: string[];
  chuaXoa: string[];
  /** null khi chuaXoa rỗng. */
  lyDo: LyDoChuaXoa | null;
}

type ClientKho = Pick<SupabaseClient, 'rpc' | 'storage'>;
type Kho = ReturnType<SupabaseClient['storage']['from']>;
/** Số lời gọi ra ngoài còn được dùng trong lần bấm này. */
interface NganSach { con: number }
const taoNganSach = (): NganSach => ({ con: NGAN_SACH_GOI });
/** Lấy một lời gọi; hết thì false. */
const dung = (ns: NganSach) => (ns.con > 0 ? (ns.con--, true) : false);
type Cau = HaiThuTieng<string>;
const s = (n: number) => (n === 1 ? '' : 's');

const LY_DO: Record<LyDoChuaXoa, Cau> = {
  loi_kho:  { vi: 'kho file không trả lời hoặc báo lỗi', en: 'the file store did not answer or returned an error' },
  van_con:  { vi: 'file vẫn còn sau khi xóa — tài khoản này không xóa được trong kho CV',
              en: 'the file is still there after deleting — this account cannot delete from the CV store' },
  het_luot: { vi: 'lần bấm này đã dùng hết số lần gọi kho cho phép', en: 'this run used up its allowed calls to the store' },
};

const CAU = {
  khongKetNoi:   { vi: 'Không kết nối được database.', en: 'Could not reach the database.' },
  traLoiLa:      { vi: 'Database trả lời không đúng dạng.', en: 'The database answer was not in the expected form.' },
  khongQuyen:    { vi: 'Tài khoản của bạn không có quyền làm việc này.', en: 'Your account is not allowed to do this.' },
  // --- Ẩn danh hồ sơ hết hạn
  chuaLamGi:     { vi: 'Chưa xóa file nào, chưa ẩn danh hồ sơ nào.', en: 'No file was deleted and no application was anonymised.' },
  khongCo:       { vi: 'Chạy xong — không có hồ sơ nào quá hạn lưu.', en: 'Done — no application is past its retention period.' },
  daAnDanh:      { vi: (n: number) => `Đã ẩn danh ${n} hồ sơ quá hạn lưu.`,
                   en: (n: number) => `Anonymised ${n} application${s(n)} past the retention period.` },
  daXoaCv:       { vi: (n: number) => `Đã xóa ${n} file CV khỏi kho.`,
                   en: (n: number) => `Deleted ${n} CV file${s(n)} from the store.` },
  saiDang:       { vi: (n: number) => `${n} hồ sơ có đường dẫn CV không đúng dạng nên CHƯA ẩn danh — báo người quản trị kỹ thuật.`,
                   en: (n: number) => `${n} application${s(n)} with a malformed CV path ${n === 1 ? 'is' : 'are'} NOT anonymised — tell the technical admin.` },
  conCv:         { vi: (n: number, lyDo: string) => `${n} hồ sơ còn file CV chưa xóa được (${lyDo}) nên CHƯA ẩn danh — bấm lại sau ít phút.`,
                   en: (n: number, lyDo: string) => `${n} application${s(n)} still ${n === 1 ? 'has' : 'have'} a CV file that could not be deleted (${lyDo}), so ${n === 1 ? 'it is' : 'they are'} NOT anonymised yet — press again in a few minutes.` },
  anDanhKhongChac: { vi: 'Không nghe được database trả lời — KHÔNG CHẮC hồ sơ đã được ẩn danh. Bấm lại để chắc chắn: lần sau chỉ làm phần còn sót.',
                     en: 'No answer from the database — it is NOT CERTAIN the applications were anonymised. Press again to make sure: the next run only does what is left.' },
  anDanhBiTuChoi:  { vi: (cau: string) => `Database không ẩn danh hồ sơ nào: ${cau} Họ tên, số điện thoại vẫn còn.`,
                     en: (cau: string) => `The database did not anonymise any application: ${cau} Names and phone numbers are still stored.` },
  // --- CV mồ côi và vé
  chuaDonGi:     { vi: 'Chưa xóa file nào, chưa dọn vé nào.', en: 'No file was deleted and no ticket was cleaned up.' },
  khongDocKho:   { vi: 'Không đọc được kho CV — kho file không trả lời hoặc báo lỗi. Chưa xóa file nào, chưa dọn vé nào; thử lại sau ít phút.',
                   en: 'Could not read the CV store — the file store did not answer or returned an error. No file was deleted and no ticket was cleaned up; try again in a few minutes.' },
  canChu:        { vi: (n: number) => `Kho CV còn ${n} thư mục CV mồ côi — chỉ chủ nhà hàng xóa được file trong kho CV. Chưa dọn vé: nhờ chủ nhà hàng bấm nút này.`,
                   en: (n: number) => `The CV store still has ${n} orphaned CV folder${s(n)} — only the owner can delete files in the CV store. Tickets were not cleaned up: ask the owner to press this button.` },
  khongMoCoi:    { vi: 'Kho CV không có CV mồ côi.', en: 'The CV store has no orphaned CVs.' },
  daXoaMoCoi:    { vi: (n: number) => `Đã xóa ${n} file CV mồ côi.`, en: (n: number) => `Deleted ${n} orphaned CV file${s(n)}.` },
  khoQuaLon:     { vi: `Kho CV có hơn ${(TRANG * TRANG_GOC_TOI_DA).toLocaleString('vi-VN')} thư mục — mới quét chừng đó, chưa dọn vé. Báo người quản trị kỹ thuật.`,
                   en: `The CV store has more than ${(TRANG * TRANG_GOC_TOI_DA).toLocaleString('en-US')} folders — only that many were scanned and no ticket was cleaned up. Tell the technical admin.` },
  conMoCoi:      { vi: (n: number, lyDo: string) => `Còn ${n} thư mục CV mồ côi chưa xóa xong${lyDo ? ` (${lyDo})` : ''} — bấm lại để làm tiếp. Chưa dọn vé.`,
                   en: (n: number, lyDo: string) => `${n} orphaned CV folder${s(n)} not fully deleted yet${lyDo ? ` (${lyDo})` : ''} — press again to continue. Tickets were not cleaned up.` },
  daDonVe:       { vi: (n: number) => `Đã dọn ${n} vé tải CV hết hạn.`, en: (n: number) => `Cleaned up ${n} expired CV upload ticket${s(n)}.` },
  khongCoVe:     { vi: 'Không có vé nào cần dọn.', en: 'No ticket needed cleaning up.' },
  veKhongChac:   { vi: 'Không nghe được database trả lời — chưa chắc vé đã được dọn; bấm lại (bấm lại không làm hỏng gì).',
                   en: 'No answer from the database — the tickets may or may not have been cleaned up; press again (pressing again does no harm).' },
  veBiTuChoi:    { vi: (cau: string) => `Không dọn được vé: ${cau}`, en: (cau: string) => `Could not clean up the tickets: ${cau}` },
} satisfies Record<string, HaiThuTieng<unknown>>;

/** Các câu nối nhau, bỏ phần trống. */
const noi = (...cau: string[]) => cau.filter(Boolean).join(' ');
/** Câu của database thường không có dấu chấm cuối. */
const coCham = (c: string) => (/[.!?…]$/.test(c) ? c : `${c}.`);

/**
 * Câu cho một lỗi DATABASE thật (có mã SQLSTATE / PGRST): câu tiếng Việt của raise exception, dịch khi
 * cần. Không phải lỗi database (mất mạng, cổng 502, thân hỏng) → null: không biết database đã làm gì.
 */
function cauDatabase(e: { code?: unknown; message?: unknown } | null | undefined, nn: NgonNguNB): string | null {
  if (!laLoiDatabase(e)) return null;
  const m = typeof e?.message === 'string' ? e.message.trim() : '';
  if (!m || /permission denied/i.test(m)) return CAU.khongQuyen[nn];
  return coCham(dichCau(nn, m));
}

/** Kết quả một lần gọi rpc mà không bao giờ ném. */
async function anToan<T>(p: PromiseLike<T>): Promise<T | null> {
  try { return await p; } catch { return null; }
}

/** 'ho-so-ung-tuyen/<mã vé>/<tên file>' (cột duong_dan_cv) → '<mã vé>/<tên file>' (khóa trong kho). Sai dạng → null. */
export function khoaTrongKho(duongDan: unknown): string | null {
  if (typeof duongDan !== 'string' || !duongDan.startsWith(TIEN_TO)) return null;
  const khoa = duongDan.slice(TIEN_TO.length);
  const cat = khoa.indexOf('/');
  if (cat < 0 || cat === khoa.length - 1 || !MA_VE.test(khoa.slice(0, cat))) return null;
  return khoa;
}

const laMuc = (m: unknown): m is { name: string; id: unknown } =>
  typeof m === 'object' && m !== null && typeof (m as { name?: unknown }).name === 'string' && (m as { name: string }).name !== '';

/** Khóa còn trong kho không: true / false; null = không biết (liệt kê hỏng). Gọi sau khi đã lấy ngân sách. */
async function conTrongKho(kho: Kho, khoa: string): Promise<boolean | null> {
  const cat = khoa.lastIndexOf('/');
  const ten = khoa.slice(cat + 1);
  const tra = await anToan(kho.list(khoa.slice(0, cat), { limit: TRANG, search: ten }));
  if (!tra || tra.error || !Array.isArray(tra.data)) return null;
  return tra.data.some(m => laMuc(m) && m.name === ten && m.id !== null);
}

/**
 * Xóa các khóa trong kho CV rồi xác minh. Không bao giờ ném. Khóa nào không chắc đã hết thì nằm trong
 * chuaXoa — gọi lại sau là an toàn.
 */
export async function xoaTrongKho(
  client: ClientKho, khoa: readonly string[], ns: NganSach = taoNganSach(),
): Promise<KetQuaXoa> {
  const can = [...new Set(khoa)];
  const kho = client.storage.from(KHO_CV);
  const daXoa = new Set<string>();
  let lyDo: LyDoChuaXoa | null = null;
  let kiemLai = 0;
  for (let i = 0; i < can.length; i += LO_XOA) {
    const lo = can.slice(i, i + LO_XOA);
    if (!dung(ns)) { lyDo = 'het_luot'; break; }
    const tra = await anToan(kho.remove(lo));
    // Lỗi hay mất trả lời: kho có thể đã xóa rồi mới đứt. Không tính là đã xóa; lần bấm sau kiểm lại.
    if (!tra || tra.error || !Array.isArray(tra.data)) { lyDo = 'loi_kho'; break; }
    const traVe = new Set(tra.data.filter(laMuc).map(m => m.name));
    for (const k of lo) {
      if (traVe.has(k)) { daXoa.add(k); continue; }
      // Vắng mặt: đã không còn từ trước (lần trước xóa xong mà mất trả lời), hoặc policy chặn im lặng.
      // Hết lượt kiểm lại thì chưa biết — không phải kho hỏng.
      if (kiemLai >= KIEM_LAI_TOI_DA || !dung(ns)) { lyDo ??= 'het_luot'; continue; }
      kiemLai++;
      const con = await conTrongKho(kho, k);
      if (con === false) daXoa.add(k);
      else lyDo = con === true ? 'van_con' : (lyDo === 'van_con' ? lyDo : 'loi_kho');
    }
  }
  const chuaXoa = can.filter(k => !daXoa.has(k));
  return { daXoa: can.filter(k => daXoa.has(k)), chuaXoa, lyDo: chuaXoa.length === 0 ? null : (lyDo ?? 'loi_kho') };
}

// -----------------------------------------------------------------------------
// ẨN DANH HỒ SƠ HẾT HẠN
// -----------------------------------------------------------------------------
export async function anDanhHoSoHetHan(client: ClientKho, nn: NgonNguNB = 'vi'): Promise<KetQua> {
  const t = dichNB(nn, CAU);
  const ns = taoNganSach();

  // 1 · Đường dẫn CV sắp ẩn danh. Hỏng thì chưa làm gì cả.
  dung(ns);
  const doc = await anToan(client.rpc('ho_so_cv_het_han'));
  if (!doc || doc.error) {
    return { ok: false, cau: noi(cauDatabase(doc?.error, nn) ?? t.khongKetNoi, t.chuaLamGi) };
  }
  if (!Array.isArray(doc.data) || !doc.data.every(d => typeof d === 'string')) {
    return { ok: false, cau: noi(t.traLoiLa, t.chuaLamGi) };
  }
  const duongDan: string[] = doc.data;

  // 2 · Xóa trong kho (khóa không có tiền tố tên kho), rồi kiểm lại.
  const theoKhoa = new Map<string, string>();
  for (const d of duongDan) {
    const k = khoaTrongKho(d);
    if (k) theoKhoa.set(k, d);
  }
  ns.con -= 1;   // giữ một lời gọi cho bước 3
  const xoa: KetQuaXoa = theoKhoa.size > 0
    ? await xoaTrongKho(client, [...theoKhoa.keys()], ns)
    : { daXoa: [], chuaXoa: [], lyDo: null };
  const daXoa = xoa.daXoa.map(k => theoKhoa.get(k) as string);
  // Database tự dựng đường dẫn ('ho-so-ung-tuyen/' || mã vé || '/' || tên), nên sai dạng là dữ liệu hỏng —
  // bấm lại không chữa được, nói riêng.
  const soSai = duongDan.length - theoKhoa.size;
  const phanXoa = daXoa.length > 0 ? t.daXoaCv(daXoa.length) : '';
  const phanCon = noi(xoa.chuaXoa.length > 0 ? t.conCv(xoa.chuaXoa.length, LY_DO[xoa.lyDo ?? 'loi_kho'][nn]) : '',
                      soSai > 0 ? t.saiDang(soSai) : '');
  const soChua = xoa.chuaXoa.length + soSai;

  // 3 · Ẩn danh: hồ sơ không CV + hồ sơ có CV đã chắc chắn xóa. Database nhận đường dẫn NGUYÊN DẠNG cột.
  const an = await anToan(client.rpc('an_danh_ho_so_het_han', { p_cv_da_xoa: daXoa }));
  if (!an) return { ok: false, cau: noi(phanXoa, t.anDanhKhongChac, phanCon) };
  if (an.error) {
    const cauDb = cauDatabase(an.error, nn);
    return { ok: false, cau: noi(phanXoa, cauDb ? t.anDanhBiTuChoi(cauDb) : t.anDanhKhongChac, phanCon) };
  }
  // Không lỗi mà không có con số (thân rỗng, thân hỏng): database chưa xác nhận gì.
  if (typeof an.data !== 'number' || !Number.isInteger(an.data) || an.data < 0) {
    return { ok: false, cau: noi(phanXoa, t.anDanhKhongChac, phanCon) };
  }
  const n = an.data;
  if (n === 0 && duongDan.length === 0) return { ok: true, cau: t.khongCo };
  return { ok: soChua === 0, cau: noi(n > 0 ? t.daAnDanh(n) : '', phanXoa, phanCon) || t.khongCo };
}

// -----------------------------------------------------------------------------
// CV MỒ CÔI, RỒI VÉ
// -----------------------------------------------------------------------------
/** Tên các thư mục ở gốc kho CV. null = không đọc được; conNua = còn trang chưa đọc (quá TRANG_GOC_TOI_DA). */
async function thuMucGoc(kho: Kho, ns: NganSach): Promise<{ ten: string[]; conNua: boolean } | null> {
  const ten: string[] = [];
  for (let trang = 0; trang < TRANG_GOC_TOI_DA; trang++) {
    if (!dung(ns)) return null;
    const tra = await anToan(kho.list('', { limit: TRANG, offset: trang * TRANG, sortBy: { column: 'name', order: 'asc' } }));
    if (!tra || tra.error || !Array.isArray(tra.data)) return null;
    for (const m of tra.data) if (laMuc(m) && m.id === null) ten.push(m.name);
    if (tra.data.length < TRANG) return { ten, conNua: false };
  }
  return { ten, conNua: true };
}

/** Mọi khóa file dưới một thư mục (cả thư mục con, tới SAU_TOI_DA cấp), hoặc vì sao chưa đọc hết. */
async function fileTrongThuMuc(kho: Kho, thuMuc: string, ns: NganSach): Promise<string[] | LyDoChuaXoa> {
  const ra: string[] = [];
  const hang: [string, number][] = [[thuMuc, 0]];
  for (let viec = hang.shift(); viec; viec = hang.shift()) {
    const [tienTo, sau] = viec;
    for (let tu = 0; ; tu += TRANG) {
      if (ns.con <= DU_TRU_SAU_LIET_KE || !dung(ns)) return 'het_luot';
      const tra = await anToan(kho.list(tienTo, { limit: TRANG, offset: tu, sortBy: { column: 'name', order: 'asc' } }));
      if (!tra || tra.error || !Array.isArray(tra.data)) return 'loi_kho';
      for (const m of tra.data) {
        if (!laMuc(m)) continue;
        if (m.id !== null) { ra.push(`${tienTo}/${m.name}`); continue; }
        if (sau >= SAU_TOI_DA) return 'loi_kho';
        hang.push([`${tienTo}/${m.name}`, sau + 1]);
      }
      if (tra.data.length < TRANG) break;
    }
  }
  return ra;
}

/**
 * laChu: chỉ chủ sở hữu xóa được file trong kho CV (policy 0014). Quản lý bấm thì chỉ biết có bao nhiêu
 * thư mục mồ côi, và chỉ dọn vé khi kho đã sạch.
 */
export async function donCvMoCoiVaVe(client: ClientKho, laChu: boolean, nn: NgonNguNB = 'vi'): Promise<KetQua> {
  const t = dichNB(nn, CAU);
  const kho = client.storage.from(KHO_CV);
  const ns = taoNganSach();

  // 1 · Liệt kê kho, hỏi database thư mục nào mồ côi. Hỏng thì chưa làm gì cả.
  const docGoc = await thuMucGoc(kho, ns);
  if (docGoc === null) return { ok: false, cau: t.khongDocKho };
  const goc = docGoc.ten;
  let moCoi: string[] = [];
  if (goc.length > 0) {
    dung(ns);
    const hoi = await anToan(client.rpc('ho_so_thu_muc_cv_mo_coi', { p_thu_muc: goc }));
    if (!hoi || hoi.error) return { ok: false, cau: noi(cauDatabase(hoi?.error, nn) ?? t.khongKetNoi, t.chuaDonGi) };
    if (!Array.isArray(hoi.data) || !hoi.data.every(x => typeof x === 'string')) {
      return { ok: false, cau: noi(t.traLoiLa, t.chuaDonGi) };
    }
    // Chỉ xóa thư mục vừa liệt kê được — không tin một tên lạ trong trả lời.
    const daLietKe = new Set(goc);
    moCoi = (hoi.data as string[]).filter(x => daLietKe.has(x));
  }
  if (moCoi.length > 0 && !laChu) return { ok: false, cau: t.canChu(moCoi.length) };

  // 2 · Xóa mọi file trong các thư mục mồ côi của lượt này.
  const lan = moCoi.slice(0, THU_MUC_TOI_DA);
  let conLai = moCoi.length - lan.length;
  let lyDo: LyDoChuaXoa | null = null;
  const fileCua = new Map<string, string[]>();
  for (const tm of lan) {
    const f = await fileTrongThuMuc(kho, tm, ns);
    if (typeof f === 'string') { conLai++; lyDo ??= f; continue; }
    fileCua.set(tm, f);
  }
  let soDaXoa = 0;
  const tatCa = [...fileCua.values()].flat();
  if (tatCa.length > 0) {
    ns.con -= 1;   // giữ một lời gọi cho bước dọn vé
    const xoa = await xoaTrongKho(client, tatCa, ns);
    soDaXoa = xoa.daXoa.length;
    if (xoa.chuaXoa.length > 0) {
      lyDo ??= xoa.lyDo;
      const chua = new Set(xoa.chuaXoa);
      for (const f of fileCua.values()) if (f.some(k => chua.has(k))) conLai++;
    }
  }
  const phanXoa = soDaXoa > 0 ? t.daXoaMoCoi(soDaXoa) : moCoi.length === 0 ? t.khongMoCoi : '';
  // Quét theo kho nên xóa vé không làm mất dấu CV mồ côi nào. Vẫn chỉ dọn vé khi kho đã sạch, vì số vé chưa
  // dùng đã cũ là thứ đèn "Dọn dữ liệu cá nhân" (ô ve_qua_han) dựa vào để nói "có thể còn CV mồ côi": dọn vé
  // khi kho còn CV mồ côi thì đèn xanh mà file vẫn nằm đó.
  if (conLai > 0) return { ok: false, cau: noi(phanXoa, t.conMoCoi(conLai, lyDo ? LY_DO[lyDo][nn] : '')) };
  if (docGoc.conNua) return { ok: false, cau: noi(phanXoa, t.khoQuaLon) };

  // 3 · Kho sạch → dọn vé.
  const ve = await anToan(client.rpc('don_dep_phieu_tai_len'));
  if (!ve) return { ok: false, cau: noi(phanXoa, t.veKhongChac) };
  if (ve.error) {
    const cauDb = cauDatabase(ve.error, nn);
    return { ok: false, cau: noi(phanXoa, cauDb ? t.veBiTuChoi(cauDb) : t.veKhongChac) };
  }
  if (typeof ve.data !== 'number' || !Number.isInteger(ve.data) || ve.data < 0) {
    return { ok: false, cau: noi(phanXoa, t.veKhongChac) };
  }
  return { ok: true, cau: noi(phanXoa, ve.data > 0 ? t.daDonVe(ve.data) : t.khongCoVe) };
}
