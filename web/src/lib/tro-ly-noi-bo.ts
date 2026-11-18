/**
 * TRỢ LÝ TRANG — SỔ HỌC Ở /noi-bo/tro-ly (migration 0126)
 * ======================================================
 * Câu Trang chưa biết (Edge Function tự ghi khi phải mời khách liên hệ quán) nằm ở "Chờ trả lời"; chủ hoặc quản lý viết
 * câu trả lời rồi bấm "Lưu và duyệt" — từ tin nhắn kế tiếp, Trang dùng câu đó như dữ liệu (tro_ly_mo_luot đọc các dòng
 * da_duyet). Không bao giờ học thẳng từ lời khách: chỉ câu người duyệt mới vào lời dặn.
 *
 * QUYỀN do database quyết định (policy tro_ly_so_hoc_*): chủ, quản lý, marketing xem; chủ, quản lý thêm, sửa, duyệt,
 * xóa. Hai danh sách dưới đây chỉ để trang đưa vai khác đi và ẩn ô sửa với marketing, và phải khớp policy
 * (crm/test/test-noi-bo-tro-ly.mjs).
 *
 * CÂU TRẢ LỜI phải qua đúng máy kiểm của Trang (tieng-viet-trang.ts): còn chữ không phải tiếng Việt, chữ cấm của web,
 * số tiền thì không lưu được — vì Trang sẽ nói lại câu đó với khách.
 *
 * CÂU BÁO nói đúng điều database đã xác nhận (khuôn lib/video-dao-tao.ts): sửa chỉ ghi khi dòng còn đúng phiên bản lúc
 * mở trang (updated_at); không khớp thì đọc lại — đã đúng như vừa gửi (lần hai của cú bấm đúp) là "đã lưu", khác là
 * "người khác vừa sửa", mất là "đã bị xóa". Lỗi mạng, hết giờ, 500 không bao giờ thành "đã …".
 *
 * File thuần (chỉ `import type` ngoài máy kiểm), để test nạp thẳng bằng Node.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { HaiThuTieng, NgonNguNB } from './ngon-ngu-noi-bo.ts';
import { chuCam, chuNgoai } from './tieng-viet-trang.ts';

/** Vai mở được trang — đúng policy tro_ly_so_hoc_doc (0126). */
export const VAI_XEM_SO_HOC: readonly string[] = ['chu_so_huu', 'quan_ly', 'marketing'];
/** Vai thấy ô viết, duyệt, xóa — đúng policy tro_ly_so_hoc_them / _sua / _xoa. */
export const VAI_SUA_SO_HOC: readonly string[] = ['chu_so_huu', 'quan_ly'];

/** Khớp ràng buộc của bảng (char_length — đếm theo ký tự). */
export const DAI_HOI = 300;
export const DAI_DAP = 1000;

export type TrangThaiSoHoc = 'cho_tra_loi' | 'cho_duyet' | 'da_duyet';
export const THU_TU_NHOM: readonly TrangThaiSoHoc[] = ['cho_tra_loi', 'cho_duyet', 'da_duyet'];

export interface CauSoHoc {
  id: string;
  hoi: string;
  dap: string | null;
  trang_thai: TrangThaiSoHoc;
  nguon: string | null;
  so_lan_hoi: number;
  hoi_lan_cuoi: string;
  duyet_luc: string | null;
  /** Phiên bản của dòng — form gửi lại để hai máy không ghi đè nhau. */
  updated_at: string;
}

export interface BaoSoHoc { ok: boolean; cau: string; banMoi?: true }

const MA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const TEN_NHOM: Readonly<Record<TrangThaiSoHoc, HaiThuTieng>> = {
  cho_tra_loi: { vi: 'Chờ trả lời', en: 'Waiting for an answer' },
  cho_duyet: { vi: 'Chờ duyệt', en: 'Waiting for approval' },
  da_duyet: { vi: 'Đã học', en: 'Learned' },
};

export const CAU = {
  viecSai: { vi: 'Không hiểu yêu cầu vừa gửi. Tải lại trang rồi thử lại.', en: 'The request was not understood. Reload the page and try again.' },
  khongQuyen: { vi: 'Tài khoản này chỉ xem được sổ học, không sửa được.', en: 'This account can view the learning book but not change it.' },
  chuaLuu: { vi: 'Chưa lưu được — mạng có thể vừa chập. Thử lại sau ít phút.', en: 'Not saved — the connection may have dropped. Try again in a few minutes.' },
  chuaChac: { vi: 'Không chắc đã lưu — tải lại trang để xem.', en: 'Not sure it was saved — reload the page to check.' },
  nguoiKhacSua: { vi: 'Người khác vừa sửa câu này. Trang hiện bản mới nhất — xem lại rồi sửa tiếp.', en: 'Someone else just changed this question. The page shows the latest version — check it, then edit again.' },
  daBiXoa: { vi: 'Câu này vừa bị xóa khỏi sổ học.', en: 'This question was just deleted from the learning book.' },
  thieuDap: { vi: 'Viết câu trả lời trước rồi mới duyệt.', en: 'Write the answer before approving.' },
  thieuHoi: { vi: 'Chưa có câu hỏi.', en: 'The question is empty.' },
  dapDai: { vi: `Câu trả lời dài quá ${DAI_DAP} ký tự.`, en: `The answer is longer than ${DAI_DAP} characters.` },
  hoiDai: { vi: `Câu hỏi dài quá ${DAI_HOI} ký tự.`, en: `The question is longer than ${DAI_HOI} characters.` },
  daCo: { vi: 'Câu hỏi này đã có trong sổ học.', en: 'This question is already in the learning book.' },
  chuNgoai: {
    vi: (ds: string) => `Còn chữ không phải tiếng Việt: ${ds}. Trang chỉ nói tiếng Việt có dấu — viết lại rồi lưu.`,
    en: (ds: string) => `Contains non-Vietnamese words: ${ds}. Trang only speaks Vietnamese with diacritics — rewrite, then save.`,
  },
  chuCam: {
    vi: (ly: string) => `Có chữ Trang không được nói: ${ly} Sửa rồi lưu.`,
    en: (ly: string) => `Contains something Trang must not say: ${ly} Edit, then save.`,
  },
} as const;

const CAU_XONG = {
  duyet: { vi: 'Đã lưu và duyệt — Trang dùng câu này từ tin nhắn kế tiếp.', en: 'Saved and approved — Trang uses it from the next message.' },
  nhap: { vi: 'Đã lưu nháp — câu ở mục Chờ duyệt, Trang chưa dùng.', en: 'Draft saved — it is under Waiting for approval; Trang does not use it yet.' },
  boHoc: { vi: 'Đã bỏ học — câu về mục Chờ duyệt, Trang thôi dùng từ tin nhắn kế tiếp.', en: 'Unlearned — it is back under Waiting for approval; Trang stops using it from the next message.' },
  xoa: { vi: 'Đã xóa câu khỏi sổ học.', en: 'Deleted from the learning book.' },
  them: { vi: 'Đã thêm câu vào sổ học.', en: 'Added to the learning book.' },
} satisfies Record<string, HaiThuTieng>;

const loi = (nn: NgonNguNB, c: HaiThuTieng): BaoSoHoc => ({ ok: false, cau: c[nn] });
const laKhongQuyen = (e: { code?: string } | null | undefined) => e?.code === '42501';
const gon = (v: unknown): string => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim() : '');
const cungThoiDiem = (a: unknown, b: string) => typeof a === 'string' && Date.parse(a) === Date.parse(b);

/** Máy kiểm của Trang cho một câu trả lời: chữ nước ngoài, chữ cấm, số tiền. null = sạch. */
export function kiemCauTraLoi(dap: string, nn: NgonNguNB): BaoSoHoc | null {
  if (!dap) return loi(nn, CAU.thieuDap);
  if ([...dap].length > DAI_DAP) return loi(nn, CAU.dapDai);
  const ngoai = chuNgoai(dap);
  if (ngoai.length) return { ok: false, cau: CAU.chuNgoai[nn](ngoai.join(', ')) };
  const cam = chuCam(dap);
  if (cam.length) return { ok: false, cau: CAU.chuCam[nn](cam.join(' ')) };
  return null;
}

/** Mọi câu của sổ học: chờ trả lời (hỏi nhiều trước), chờ duyệt, đã học. Ném lỗi khi không đọc được (trang báo). */
export async function docSoHoc(client: SupabaseClient): Promise<CauSoHoc[]> {
  const { data, error } = await client
    .from('tro_ly_so_hoc')
    .select('id, hoi, dap, trang_thai, nguon, so_lan_hoi, hoi_lan_cuoi, duyet_luc, updated_at')
    .order('so_lan_hoi', { ascending: false })
    .order('hoi_lan_cuoi', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as CauSoHoc[];
}

/**
 * Đổi một câu (ô id, phien_ban): viec = 'duyet' (lưu câu trả lời và duyệt), 'nhap' (lưu nháp — chờ duyệt), 'bo_hoc'
 * (bỏ học — giữ câu trả lời, về chờ duyệt). Chỉ ghi khi dòng còn đúng phiên bản lúc mở trang.
 */
export async function suaCau(client: SupabaseClient, form: FormData, nn: NgonNguNB): Promise<BaoSoHoc> {
  const viec = String(form.get('viec') ?? '');
  const id = String(form.get('id') ?? '');
  const phienBan = String(form.get('phien_ban') ?? '');
  if (!['duyet', 'nhap', 'bo_hoc'].includes(viec) || !MA_UUID.test(id) || Number.isNaN(Date.parse(phienBan))) return loi(nn, CAU.viecSai);
  const dap = viec === 'bo_hoc' ? null : gon(form.get('dap'));
  if (viec !== 'bo_hoc') {
    const sai = kiemCauTraLoi(dap ?? '', nn);
    if (sai) return sai;
  }
  const thay: Record<string, unknown> = viec === 'duyet' ? { dap, trang_thai: 'da_duyet' }
    : viec === 'nhap' ? { dap, trang_thai: 'cho_duyet' } : { trang_thai: 'cho_duyet' };
  const daLuu: BaoSoHoc = { ok: true, cau: (viec === 'duyet' ? CAU_XONG.duyet : viec === 'nhap' ? CAU_XONG.nhap : CAU_XONG.boHoc)[nn] };
  try {
    const { data, error } = await client.from('tro_ly_so_hoc').update(thay).eq('id', id).eq('updated_at', phienBan).select('id');
    if (laKhongQuyen(error)) return loi(nn, CAU.khongQuyen);
    if (error) return loi(nn, CAU.chuaLuu);
    if (Array.isArray(data) && data.length > 0) return daLuu;
    // Không dòng nào khớp: đổi phiên bản, đã xóa, hoặc RLS chặn (vai chỉ xem: 0 dòng, không lỗi).
    const { data: hienTai, error: loiDoc } = await client
      .from('tro_ly_so_hoc').select('id, dap, trang_thai, updated_at').eq('id', id).maybeSingle();
    if (loiDoc) return loi(nn, CAU.chuaChac);
    const dong = hienTai as { dap?: string | null; trang_thai?: string; updated_at?: string } | null;
    if (!dong) return { ...loi(nn, CAU.daBiXoa), banMoi: true };
    if (dong.trang_thai === thay.trang_thai && (viec === 'bo_hoc' || dong.dap === dap)) return daLuu;
    if (cungThoiDiem(dong.updated_at, phienBan)) return loi(nn, CAU.khongQuyen);
    return { ...loi(nn, CAU.nguoiKhacSua), banMoi: true };
  } catch {
    return loi(nn, CAU.chuaLuu);
  }
}

/** Xóa một câu. Xóa rồi đọc lại: chỉ báo "đã xóa" khi database xác nhận dòng không còn. */
export async function xoaCau(client: SupabaseClient, form: FormData, nn: NgonNguNB): Promise<BaoSoHoc> {
  const id = String(form.get('id') ?? '');
  if (!MA_UUID.test(id)) return loi(nn, CAU.viecSai);
  try {
    const { error } = await client.from('tro_ly_so_hoc').delete().eq('id', id);
    if (laKhongQuyen(error)) return loi(nn, CAU.khongQuyen);
    if (error) return loi(nn, CAU.chuaLuu);
    const { data: con, error: loiDoc } = await client.from('tro_ly_so_hoc').select('id').eq('id', id).maybeSingle();
    if (loiDoc) return loi(nn, CAU.chuaChac);
    return con ? loi(nn, CAU.khongQuyen) : { ok: true, cau: CAU_XONG.xoa[nn] };
  } catch {
    return loi(nn, CAU.chuaLuu);
  }
}

/** Thêm một câu tay (ô hoi, dap): có câu trả lời thì vào thẳng "Đã học", không thì "Chờ trả lời". */
export async function themCau(client: SupabaseClient, form: FormData, nn: NgonNguNB): Promise<BaoSoHoc> {
  const hoi = gon(form.get('hoi')).replace(/\s+/g, ' ');
  const dap = gon(form.get('dap'));
  if (!hoi) return loi(nn, CAU.thieuHoi);
  if ([...hoi].length > DAI_HOI) return loi(nn, CAU.hoiDai);
  if (dap) {
    const sai = kiemCauTraLoi(dap, nn);
    if (sai) return sai;
  }
  try {
    const { error } = await client.from('tro_ly_so_hoc')
      .insert({ hoi, dap: dap || null, trang_thai: dap ? 'da_duyet' : 'cho_tra_loi', nguon: 'Thêm tay ở Nội bộ' });
    if (laKhongQuyen(error)) return loi(nn, CAU.khongQuyen);
    // Bấm đúp: lần hai vướng ràng buộc câu trùng — đúng sự thật, lần một đã thêm.
    if ((error as { code?: string } | null)?.code === '23505') return loi(nn, CAU.daCo);
    if (error) return loi(nn, CAU.chuaLuu);
    return { ok: true, cau: CAU_XONG.them[nn] };
  } catch {
    return loi(nn, CAU.chuaLuu);
  }
}
