/**
 * VIDEO ĐÀO TẠO — /noi-bo/dao-tao (migration 0117, học viên 0119)
 * ================================================================
 *
 * Video training để trên YouTube ở chế độ "Không công khai", nhúng vào trang nội bộ. Mã video nằm trong bảng
 * video_dao_tao, không nằm trong mã nguồn: repo công khai, và RLS chỉ cho người đang đăng nhập đọc bảng đó.
 *
 * Giới hạn (Khánh đã chọn, 14/11/2026): cổng đăng nhập giấu link, không khóa video — người đang xem vẫn chép được
 * link YouTube. Nội dung training không nhạy cảm nên chấp nhận.
 *
 * THÊM VIDEO không làm trên trang (Khánh 14/11/2026 bỏ mục "Thêm video": "Không cần mục này"): video mới thêm thẳng
 * vào bảng — web/README.md, mục "Video đào tạo". Trang chỉ còn sửa tên / mô tả và xóa.
 *
 * QUYỀN do database quyết định (policy video_dao_tao_*): bảy vai người đang làm và học viên (0119 — tài khoản demo
 * của buổi đào tạo) xem; chủ và quản lý sửa / xóa. Hai danh sách dưới đây chỉ để trang đưa vai khác đi chỗ khác và
 * ẩn form với người không sửa được, và phải khớp policy (crm/test/test-noi-bo-video-dao-tao.mjs so với pg_policies).
 *
 * CÂU BÁO luôn nói đúng điều database đã xác nhận:
 *   · sửa: chỉ ghi khi dòng còn đúng phiên bản lúc mở trang (updated_at). Không khớp thì đọc lại — dòng đã mang đúng
 *     chữ vừa gửi (lần hai của cú bấm đúp) là "đã lưu", khác thì "người khác vừa sửa", mất thì "đã bị xóa";
 *   · xóa: xóa rồi đọc lại — còn dòng là "chưa xóa được", không đọc được là "chưa chắc", hết dòng mới là "đã xóa";
 *   · lỗi mạng, hết giờ, 500: không bao giờ thành câu "đã …".
 *
 * File thuần (chỉ `import type` ngoài danh sách vai và đường dẫn), để test nạp thẳng bằng Node.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { HaiThuTieng, NgonNguNB } from './ngon-ngu-noi-bo.ts';
import { VAI_DAO_TAO } from './dieu-huong-noi-bo.ts';

export { DUONG_DAO_TAO } from './dieu-huong-noi-bo.ts';

/** Vai mở được trang — đúng policy video_dao_tao_doc (0119): bảy vai người và học viên. */
export const VAI_XEM_DAO_TAO: readonly string[] = VAI_DAO_TAO;
/** Vai thấy form sửa / xóa — đúng policy video_dao_tao_sua / _xoa (và _them: thêm thẳng bảng cũng chỉ hai vai này). */
export const VAI_SUA_DAO_TAO: readonly string[] = ['chu_so_huu', 'quan_ly'];

/** Khớp ràng buộc của bảng (char_length — đếm theo ký tự, không theo đơn vị UTF-16). */
export const DAI_TIEU_DE = 150;
export const DAI_MO_TA = 1000;

export interface VideoDaoTao {
  id: string;
  youtube_id: string;
  tieu_de: string;
  mo_ta: string | null;
  /** Phiên bản của dòng — form sửa gửi lại để hai máy không ghi đè nhau. */
  updated_at: string;
}

/** Câu báo. `banMoi`: dòng vừa đổi dưới tay người khác — trang hiện bản trong database, không điền lại chữ đã gõ. */
export interface BaoVideo { ok: boolean; cau: string; banMoi?: true }

const MA_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;
const MA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Các đường dẫn của youtube.com có mã video ở đoạn thứ hai: /embed/MÃ, /shorts/MÃ, /live/MÃ, /v/MÃ, /e/MÃ. */
const DOAN_CO_MA = new Set(['embed', 'shorts', 'live', 'v', 'e']);
const TEN_MIEN_YOUTUBE = new Set([
  'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com',
]);

/**
 * Tách mã video từ thứ người ta dán vào: link youtu.be, youtube.com/watch?v=…, /shorts/, /embed/, /live/, link của
 * YouTube Studio (studio.youtube.com/video/MÃ/edit), link thiếu "https://", hoặc chính mã 11 ký tự. Link
 * danh sách phát, kênh, trang khác (Google Drive…) → null.
 *
 * Trang không còn gọi hàm này (bỏ form "Thêm video"). Giữ làm luật tách mã khi thêm video thẳng vào bảng — cột
 * youtube_id nhận đúng mã hàm này trả, và kiểm thử nhóm 3 giữ mọi kiểu link YouTube hay gặp (web/README.md).
 */
export function layMaYoutube(nhap: unknown): string | null {
  const s = typeof nhap === 'string' ? nhap.trim() : '';
  if (!s || s.length > 500) return null;
  if (MA_YOUTUBE.test(s)) return s;

  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : `https://${s}`);
  } catch { return null; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const tenMien = url.hostname.toLowerCase();
  const doan = url.pathname.split('/').filter(Boolean);
  let ma: string | null = null;
  if (tenMien === 'youtu.be' || tenMien === 'www.youtu.be') {
    ma = doan[0] ?? null;
  } else if (tenMien === 'studio.youtube.com') {
    ma = doan[0] === 'video' ? doan[1] ?? null : null;
  } else if (TEN_MIEN_YOUTUBE.has(tenMien)) {
    if (doan[0] === 'watch') ma = url.searchParams.get('v');
    else if (doan[0] && DOAN_CO_MA.has(doan[0])) ma = doan[1] ?? null;
  }
  return ma && MA_YOUTUBE.test(ma) ? ma : null;
}

/** Link nhúng: tên miền không cookie của YouTube; rel=0 — hết video chỉ gợi ý video cùng kênh. */
export function linkNhungYoutube(ma: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(ma)}?rel=0`;
}

/** Số ký tự như char_length của Postgres (emoji là một ký tự, không phải hai). */
function soKyTu(s: string): number {
  return [...s].length;
}

/** Tên: một dòng, NFC (bàn phím macOS gõ ra dạng tách dấu), dấu cách thừa gom lại. */
export function lamSachTieuDe(nhap: unknown): string {
  return (typeof nhap === 'string' ? nhap : '').normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** Mô tả: giữ xuống dòng, NFC, bỏ khoảng trắng hai đầu. Rỗng → null. */
export function lamSachMoTa(nhap: unknown): string | null {
  const s = (typeof nhap === 'string' ? nhap : '').normalize('NFC').replace(/\r\n?/g, '\n').trim();
  return s ? s : null;
}

/** Câu báo của thư viện — trang dùng lại khongQuyen, viecSai cho khỏi viết hai bản. */
export const CAU = {
  thieuTen: { vi: 'Ghi tên video.', en: 'Enter a title for the video.' },
  tenDai: {
    vi: `Tên video dài quá ${DAI_TIEU_DE} ký tự.`,
    en: `The title is longer than ${DAI_TIEU_DE} characters.`,
  },
  moTaDai: {
    vi: `Mô tả dài quá ${DAI_MO_TA} ký tự.`,
    en: `The description is longer than ${DAI_MO_TA} characters.`,
  },
  khongQuyen: {
    vi: 'Chỉ chủ nhà hàng và quản lý sửa hay xóa được video.',
    en: 'Only the owner and managers can edit or delete videos.',
  },
  chuaLuu: {
    vi: 'Chưa lưu được — mạng hoặc máy chủ đang trục trặc. Tải lại trang xem tên và mô tả hiện giờ rồi thử lại.',
    en: 'Not saved — the connection or the server is having trouble. Reload the page to see the current title and description, then try again.',
  },
  nguoiKhacSua: {
    vi: 'Người khác vừa sửa video này. Chữ của bạn chưa được lưu — xem bản mới bên dưới rồi sửa lại nếu cần.',
    en: 'Someone else has just edited this video. Your text was not saved — check the new version below and edit again if needed.',
  },
  daBiXoa: {
    vi: 'Video này đã bị xóa khỏi danh sách.',
    en: 'This video has been removed from the list.',
  },
  chuaXoa: {
    vi: 'Chưa xóa được video này.',
    en: 'The video was not deleted.',
  },
  chuaChacXoa: {
    vi: 'Chưa chắc đã xóa — mạng hoặc máy chủ đang trục trặc. Tải lại trang để kiểm.',
    en: 'Not sure the video was deleted — the connection or the server is having trouble. Reload the page to check.',
  },
  daXoa: { vi: 'Đã xóa video khỏi danh sách.', en: 'Removed the video from the list.' },
  viecSai: { vi: 'Việc không hợp lệ.', en: 'Invalid action.' },
} satisfies Record<string, HaiThuTieng>;

/** Câu báo đã xong — mang tên video người dùng vừa gõ (tên do database giữ, không dịch). */
const CAU_XONG = {
  sua: {
    vi: (ten: string) => `Đã lưu tên và mô tả của "${ten}".`,
    en: (ten: string) => `Saved the title and description of "${ten}".`,
  },
  xoa: {
    vi: (ten: string) => `Đã xóa video "${ten}" khỏi danh sách.`,
    en: (ten: string) => `Removed the video "${ten}" from the list.`,
  },
} satisfies Record<string, HaiThuTieng<(ten: string) => string>>;

const loi = (nn: NgonNguNB, cau: HaiThuTieng): BaoVideo => ({ ok: false, cau: cau[nn] });

/** Lỗi do RLS / quyền cột: Postgres 42501. */
const laKhongQuyen = (e: { code?: string } | null | undefined) => e?.code === '42501';

/**
 * Danh sách video, thứ tự thêm vào (bài 1 trước). Ném lỗi khi không đọc được — trang báo "chưa đọc được", không
 * bao giờ nói "chưa có video nào" khi thật ra là mất mạng.
 */
export async function docDanhSachVideo(client: SupabaseClient): Promise<VideoDaoTao[]> {
  const { data, error } = await client
    .from('video_dao_tao')
    .select('id, youtube_id, tieu_de, mo_ta, updated_at')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw new Error(error.message ?? 'video_dao_tao');
  return (data ?? []) as VideoDaoTao[];
}

/** Hai dấu thời gian là một thời điểm — PostgREST và form có thể viết khác nhau (múi giờ, số chữ số sau giây). */
function cungThoiDiem(a: string | undefined, b: string): boolean {
  if (a === undefined) return false;
  if (a === b) return true;
  const x = Date.parse(a), y = Date.parse(b);
  return !Number.isNaN(x) && x === y;
}

/** Kiểm tên và mô tả. Trả câu lỗi đầu tiên, hoặc null. */
function kiemChu(tieuDe: string, moTa: string | null, nn: NgonNguNB): BaoVideo | null {
  if (!tieuDe) return loi(nn, CAU.thieuTen);
  if (soKyTu(tieuDe) > DAI_TIEU_DE) return loi(nn, CAU.tenDai);
  if (moTa && soKyTu(moTa) > DAI_MO_TA) return loi(nn, CAU.moTaDai);
  return null;
}

/** Sửa tên và mô tả của một video, chỉ khi dòng còn đúng phiên bản lúc mở trang (ô phien_ban = updated_at). */
export async function suaVideo(client: SupabaseClient, form: FormData, nn: NgonNguNB): Promise<BaoVideo> {
  const id = String(form.get('id') ?? '');
  const phienBan = String(form.get('phien_ban') ?? '');
  if (!MA_UUID.test(id) || !phienBan || Number.isNaN(Date.parse(phienBan))) return loi(nn, CAU.viecSai);
  const tieuDe = lamSachTieuDe(form.get('tieu_de'));
  const moTa = lamSachMoTa(form.get('mo_ta'));
  const sai = kiemChu(tieuDe, moTa, nn);
  if (sai) return sai;
  const daLuu: BaoVideo = { ok: true, cau: CAU_XONG.sua[nn](tieuDe) };

  try {
    const { data, error } = await client
      .from('video_dao_tao')
      .update({ tieu_de: tieuDe, mo_ta: moTa })
      .eq('id', id)
      .eq('updated_at', phienBan)
      .select('id');
    if (laKhongQuyen(error)) return loi(nn, CAU.khongQuyen);
    if (error) return loi(nn, CAU.chuaLuu);
    if (Array.isArray(data) && data.length > 0) return daLuu;

    // Không dòng nào khớp: dòng đã đổi phiên bản, đã bị xóa — hoặc RLS chặn (vai không sửa được: 0 dòng, không lỗi).
    const { data: hienTai, error: loiDoc } = await client
      .from('video_dao_tao')
      .select('id, tieu_de, mo_ta, updated_at')
      .eq('id', id)
      .maybeSingle();
    if (loiDoc) return loi(nn, CAU.chuaLuu);
    const dong = hienTai as { tieu_de?: string; mo_ta?: string | null; updated_at?: string } | null;
    if (!dong) return { ...loi(nn, CAU.daBiXoa), banMoi: true };
    // Lần hai của cú bấm đúp: lần một đã ghi đúng chữ này.
    if (dong.tieu_de === tieuDe && (dong.mo_ta ?? null) === moTa) return daLuu;
    // Dòng vẫn đúng phiên bản đã gửi mà không sửa được: không phải người khác sửa — là RLS không cho.
    if (cungThoiDiem(dong.updated_at, phienBan)) return loi(nn, CAU.khongQuyen);
    return { ...loi(nn, CAU.nguoiKhacSua), banMoi: true };
  } catch {
    return loi(nn, CAU.chuaLuu);
  }
}

/** Xóa một video (ô id). Xóa rồi đọc lại: chỉ báo "đã xóa" khi database xác nhận dòng không còn. */
export async function xoaVideo(client: SupabaseClient, form: FormData, nn: NgonNguNB): Promise<BaoVideo> {
  const id = String(form.get('id') ?? '');
  if (!MA_UUID.test(id)) return loi(nn, CAU.viecSai);
  const tieuDe = lamSachTieuDe(form.get('tieu_de'));

  try {
    const { error } = await client.from('video_dao_tao').delete().eq('id', id);
    if (laKhongQuyen(error)) return loi(nn, CAU.khongQuyen);
    if (error) return loi(nn, CAU.chuaChacXoa);
    const { data: conLai, error: loiDoc } = await client
      .from('video_dao_tao')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    if (loiDoc) return loi(nn, CAU.chuaChacXoa);
    if (conLai) return loi(nn, CAU.chuaXoa);
  } catch {
    return loi(nn, CAU.chuaChacXoa);
  }
  return tieuDe ? { ok: true, cau: CAU_XONG.xoa[nn](tieuDe) } : { ok: true, cau: CAU.daXoa[nn] };
}
