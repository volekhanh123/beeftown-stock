/**
 * SOẠN THỰC ĐƠN — đọc, lưu, công bố, gỡ món (màn /noi-bo/thuc-don)
 *
 * Trước đây món chỉ sửa được bằng các khối SQL trong web/THUC-DON.md. Nhưng
 * viết mô tả, sửa bản dịch, công bố một món là việc của người làm nội dung,
 * không phải của người mở được SQL Editor (cùng lý do với lib/tin-tuyen-dung.ts).
 *
 * QUYỀN DO DATABASE QUYẾT ĐỊNH, KHÔNG PHẢI FILE NÀY
 *
 *   · policy mon_an_doc (0011, 0070): bốn vai CRM đọc được món.
 *   · policy mon_an_sua: chủ nhà hàng, quản lý và marketing sửa được. Vai khác
 *     gửi UPDATE thì database lọc mất dòng (0 dòng), không báo lỗi — nên lưu
 *     xong 0 dòng phải đọc lại mới biết vì sao.
 *   · CHECK mon_an_cong_bo_phai_sach (0011): món chỉ công bố được khi tên và mô
 *     tả tiếng Việt đã viết xong (không rỗng, không còn [ngoặc vuông]), và món
 *     sống phải có câu cảnh báo.
 *
 * Giao diện chỉ ẩn nút cho gọn mắt — ai gọi thẳng vẫn bị database chặn.
 *
 * KHÔNG ĐỤNG GIÁ, MỨC CAY, MÓN SỐNG, CÓ CỒN, NHÓM. Giá và mức cay có luồng
 * duyệt riêng, và website chặn mọi số tiền chưa duyệt (lib/chuoi-cam.js). Cờ
 * món sống và có cồn là nghĩa vụ pháp lý: bỏ tích "món sống" là bỏ được yêu
 * cầu cảnh báo, nên màn này chỉ hiện chúng. Câu UPDATE dựng ở docForm() chỉ
 * có các cột trong COT_SUA và COT_DICH — kiểm ở crm/test/test-noi-bo-thuc-don.mjs.
 *
 * KHÔNG CÓ NÚT XÓA, KHÔNG CÓ NÚT THÊM MÓN. Bảng không có policy DELETE; món
 * không dùng nữa thì gỡ xuống. Thêm món mới cần chọn nhóm, mã và hai cờ pháp
 * lý — để sau, khi có món mới thật.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SoBanDich } from './ban-dich';
import { dichNB, type HaiThuTieng, type NgonNguNB } from './ngon-ngu-noi-bo.ts';
import { dichCau } from './cau-noi-bo.ts';
import { CAU_MAT_MANG_GHI, laLoiMang } from './qua-tai.ts';

const CAU = {
  chuaTen:      { vi: 'Chưa điền tên món.', en: 'The dish has no name.' },
  thuTuSai:     { vi: 'Thứ tự phải là số từ 0 đến 999.', en: 'The order must be a number from 0 to 999.' },
  chuaSach:     { vi: 'Chưa công bố được: tên và mô tả tiếng Việt phải viết xong — không để trống, không còn chữ trong ngoặc vuông kiểu [chờ duyệt]. Món sống còn phải có câu cảnh báo.',
                  en: 'Cannot publish yet: the Vietnamese name and description must be finished — nothing empty, no bracketed text like [chờ duyệt] left. A raw dish also needs a warning.' },
  dangHienPhaiSach: { vi: 'Món đang công bố nên không lưu được bản viết dở: tên và mô tả tiếng Việt phải còn đủ, món sống phải có câu cảnh báo. Muốn sửa dở dang thì gỡ món khỏi trang trước.',
                      en: 'The dish is live, so an unfinished version cannot be saved: the Vietnamese name and description must stay filled in, and a raw dish needs its warning. To work on it unfinished, take the dish off the page first.' },
  khongQuyen:   { vi: 'Tài khoản của bạn không có quyền làm việc này.', en: 'Your account is not allowed to do this.' },
  daLuu:        { vi: 'Đã lưu.', en: 'Saved.' },
  daLuuCongBo:  { vi: 'Đã lưu và công bố lên trang Thực đơn.', en: 'Saved and published on the Menu page.' },
  viecSai:      { vi: 'Việc không hợp lệ.', en: 'Invalid action.' },
  khongLuu:     { vi: 'Không lưu được.', en: 'Could not save.' },
  nguoiKhacSua: { vi: 'Món vừa được người khác sửa. Bạn đang thấy bản mình vừa gõ, CHƯA được lưu — bấm lưu lần nữa sẽ ghi đè bản của họ.',
                  en: 'Someone else just edited this dish. You are seeing what you typed, NOT saved yet — saving again will overwrite their version.' },
  khongSuaDuoc: { vi: 'Tài khoản của bạn không sửa được món này.', en: 'Your account cannot edit this dish.' },
  khongGo:      { vi: 'Không gỡ được món.', en: 'Could not take the dish down.' },
  khongConDang: { vi: 'Món không còn đang công bố — có thể người khác vừa gỡ. Tải lại trang để xem.',
                  en: 'The dish is no longer published — someone may have just taken it down. Reload to check.' },
  daGo:         { vi: 'Đã gỡ món khỏi trang Thực đơn. Nội dung vẫn còn nguyên, công bố lại lúc nào cũng được.',
                  en: 'Took the dish off the Menu page. Its text is kept, and you can publish it again any time.' },
  // Lần hai của cú bấm đúp / F5: món ĐÃ gỡ — có thể chính lần một, có thể người khác. Nói đúng trạng thái.
  daGoRoi:      { vi: 'Món đã được gỡ khỏi trang Thực đơn. Nội dung vẫn còn nguyên.', en: 'The dish is already off the Menu page. Its text is kept.' },
} satisfies Record<string, HaiThuTieng<unknown>>;

export type TrangThaiMon = 'nhap' | 'da_duyet' | 'da_cong_bo' | 'da_thu_hoi';

/** Vai sửa được món — đúng bộ ba của policy mon_an_sua (test-noi-bo-thuc-don.mjs so với pg_policy). */
export const VAI_SUA_MON = ['chu_so_huu', 'quan_ly', 'marketing'] as const;

/** Một dòng mon_an mà màn soạn cần. test-noi-bo-thuc-don.mjs kiểm mọi khóa ở đây là cột thật. */
export interface MonAn {
  id: string;
  nhom_mon_id: string;
  ma: string;
  thu_tu: number;
  ten_vi: string | null;
  ten_en: string | null;
  ten_ko: string | null;
  mo_ta_vi: string | null;
  mo_ta_en: string | null;
  mo_ta_ko: string | null;
  canh_bao: string | null;
  canh_bao_en: string | null;
  canh_bao_ko: string | null;
  khau_phan: string | null;
  khau_phan_en: string | null;
  khau_phan_ko: string | null;
  co_con: boolean;
  la_mon_song: boolean;
  di_ung: string[] | null;
  /** Bản nháp mô tả có sẵn từ bảng nội dung menu (0011) — nội bộ, không lên trang. */
  copy_nhap: string | null;
  /** Điều đang chặn món này — nội bộ (0011). */
  can_xac_nhan: string | null;
  trang_thai: TrangThaiMon;
  cong_bo_luc: string | null;
  updated_at: string;
  /** Sổ bản dịch — trigger ghi_so_ban_dich() giữ, web chỉ đọc. */
  ban_dich: SoBanDich;
}

/** Một dòng nhom_mon. */
export interface NhomMon {
  id: string;
  ma: string;
  ten_vi: string;
  ten_en: string | null;
  thu_tu: number;
  dang_dung: boolean;
  khong_niem_yet_gia: boolean;
}

/** Một thẻ trong danh sách món. */
export interface DongMon {
  id: string;
  ma: string;
  ten_vi: string | null;
  ten_en: string | null;
  thu_tu: number;
  trang_thai: TrangThaiMon;
  co_con: boolean;
  la_mon_song: boolean;
  nhom_mon_id: string;
  /** Lý do chưa công bố được (v_mon_con_vuong.vuong_gi); null = món đang công bố. */
  vuong: string | null;
}

export interface NhomCoMon { nhom: NhomMon; mon: DongMon[] }

export interface KetQua { ok: boolean; cau: string }

/** Lưu hỏng thì trả kèm những gì người dùng vừa gõ, để màn hình không bắt gõ lại. */
export interface KetQuaLuu extends KetQua { daGo?: Partial<MonAn> }

// 0008 có nấc da_duyet; màn này không dùng tới, nên nó hiện như một bản nháp.
export const TRANG_THAI_MON: Record<TrangThaiMon, { ten: HaiThuTieng; lop: string }> = {
  nhap:       { ten: { vi: 'Nháp',          en: 'Draft' },      lop: 'nhap' },
  da_duyet:   { ten: { vi: 'Nháp',          en: 'Draft' },      lop: 'nhap' },
  da_cong_bo: { ten: { vi: 'Đang công bố',  en: 'Live' },       lop: 'song' },
  da_thu_hoi: { ten: { vi: 'Đã gỡ',         en: 'Taken down' }, lop: 'tat' },
};

/**
 * Các ô có bản dịch, theo thứ tự hiện trên màn hình. Khớp các dòng mon_an trong
 * cot_ban_dich() của 0036: câu gốc ở cột `nguon`, bản dịch ở <cot>_en và <cot>_ko.
 * `chiMonSong`: ô chỉ hiện với món sống (cảnh báo).
 */
export const O_DICH_MON = [
  { cot: 'ten',       nguon: 'ten_vi',    ten: { vi: 'Tên món',   en: 'Dish name' },   dong: 1, chiMonSong: false },
  { cot: 'mo_ta',     nguon: 'mo_ta_vi',  ten: { vi: 'Mô tả',     en: 'Description' }, dong: 4, chiMonSong: false },
  { cot: 'khau_phan', nguon: 'khau_phan', ten: { vi: 'Khẩu phần', en: 'Portion' },     dong: 1, chiMonSong: false },
  { cot: 'canh_bao',  nguon: 'canh_bao',  ten: { vi: 'Cảnh báo',  en: 'Warning' },     dong: 2, chiMonSong: true },
] as const;

/** Cột tiếng Việt và thứ tự màn soạn được ghi. Ngoài các cột này và bản dịch, UPDATE không có cột nào khác. */
export const COT_SUA = ['ten_vi', 'mo_ta_vi', 'khau_phan', 'canh_bao', 'thu_tu'] as const;
/** Cột bản dịch màn soạn được ghi (khi người dùng sửa tay). */
export const COT_DICH = O_DICH_MON.flatMap(o => [`${o.cot}_en`, `${o.cot}_ko`]);

/** Cột màn soạn đọc — danh sách tường minh, không '*': nguyen_van_nguon (câu chưa kiểm chứng) không cần ra màn hình. */
const COT_MON = 'id, nhom_mon_id, ma, thu_tu, ten_vi, ten_en, ten_ko, mo_ta_vi, mo_ta_en, mo_ta_ko, canh_bao, canh_bao_en, canh_bao_ko, khau_phan, khau_phan_en, khau_phan_ko, co_con, la_mon_song, di_ung, copy_nhap, can_xac_nhan, trang_thai, cong_bo_luc, updated_at, ban_dich';
const COT_NHOM = 'id, ma, ten_vi, ten_en, thu_tu, dang_dung, khong_niem_yet_gia';

/** Giống la_van_ban_tam() của 0008: rỗng, null, hoặc còn [ngoặc vuông]. */
export function laChuTam(t: string | null | undefined): boolean {
  return t == null || t.trim() === '' || /\[.*\]/.test(t);
}

/** Câu lỗi cho người đọc. */
function cauLoi(e: { message?: string } | null, macDinh: string, nn: NgonNguNB): string {
  const m = e?.message ?? '';
  if (laLoiMang(m)) return CAU_MAT_MANG_GHI[nn];
  if (/mon_an_cong_bo_phai_sach/.test(m)) return CAU.chuaSach[nn];
  if (/violates row-level security|permission denied for table/i.test(m)) return CAU.khongQuyen[nn];
  return m ? dichCau(nn, m) : macDinh;
}

function chu(form: FormData, ten: string): string | null {
  const s = String(form.get(ten) ?? '').trim();
  return s || null;
}

/** So hai bản chữ như database so (chuan_ban_dich): bỏ \r và khoảng trắng hai đầu. */
function giongNhau(a: string | null, b: string | null): boolean {
  const c = (x: string | null) => (x ?? '').replace(/\r/g, '').trim();
  return c(a) === c(b);
}

/** Một ô của dòng đang lưu có đúng giá trị form vừa gửi không (số so như số, chữ bỏ \r). */
function cungGiaTri(a: unknown, b: unknown): boolean {
  if (a == null || b == null) return a == null && b == null;
  if (typeof a === 'number' || typeof b === 'number') return Number(a) === Number(b);
  if (typeof a === 'string' && typeof b === 'string') return giongNhau(a, b);
  return JSON.stringify(a) === JSON.stringify(b);
}

// -----------------------------------------------------------------------------
// ĐỌC
// -----------------------------------------------------------------------------
/** Mọi nhóm đang dùng, mỗi nhóm kèm món của nó, theo thứ tự trên trang Thực đơn. */
export async function docDanhSach(client: SupabaseClient): Promise<NhomCoMon[]> {
  const [nhom, mon, vuong] = await Promise.all([
    client.from('nhom_mon').select(COT_NHOM).order('thu_tu'),
    client.from('mon_an').select('id, ma, ten_vi, ten_en, thu_tu, trang_thai, co_con, la_mon_song, nhom_mon_id').order('thu_tu'),
    client.from('v_mon_con_vuong').select('ma, vuong_gi'),
  ]);
  if (nhom.error) throw new Error(nhom.error.message);
  if (mon.error) throw new Error(mon.error.message);
  // Lý do vướng chỉ để chú thích: đọc hỏng thì thẻ không có dòng lý do, danh sách vẫn hiện.
  const lyDo = new Map(((vuong.data ?? []) as { ma: string; vuong_gi: string }[]).map(v => [v.ma, v.vuong_gi]));

  const dsMon = ((mon.data ?? []) as Omit<DongMon, 'vuong'>[])
    .map(m => ({ ...m, vuong: m.trang_thai === 'da_cong_bo' ? null : lyDo.get(m.ma) ?? null }))
    .sort((a, b) => a.thu_tu - b.thu_tu || a.ma.localeCompare(b.ma));
  // Nhóm ngừng dùng vẫn liệt kê (đứng cuối) nếu còn món: không thì món đang công bố trong đó không còn đường
  // nào để mở ra mà gỡ.
  return ((nhom.data ?? []) as NhomMon[])
    .sort((a, b) => Number(b.dang_dung) - Number(a.dang_dung) || a.thu_tu - b.thu_tu)
    .map(g => ({ nhom: g, mon: dsMon.filter(m => m.nhom_mon_id === g.id) }))
    .filter(g => g.mon.length > 0);
}

export async function docMon(client: SupabaseClient, id: string): Promise<{ mon: MonAn; nhom: NhomMon | null } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await client.from('mon_an').select(COT_MON).eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const mon = data as unknown as MonAn;
  const { data: nhom } = await client.from('nhom_mon').select(COT_NHOM).eq('id', mon.nhom_mon_id).maybeSingle();
  return { mon, nhom: (nhom as NhomMon | null) ?? null };
}

/** Lý do một món chưa công bố được (v_mon_con_vuong.vuong_gi). null = đang công bố, hoặc đọc hỏng — chỉ là chú thích. */
export async function docVuong(client: SupabaseClient, ma: string): Promise<string | null> {
  const { data } = await client.from('v_mon_con_vuong').select('vuong_gi').eq('ma', ma).maybeSingle();
  return (data as { vuong_gi: string } | null)?.vuong_gi ?? null;
}

// -----------------------------------------------------------------------------
// LƯU — một câu UPDATE cho mọi nút trong form soạn
// -----------------------------------------------------------------------------
export function docForm(form: FormData, nn: NgonNguNB = 'vi'): { dong: Partial<MonAn>; loi: string | null } {
  const t = dichNB(nn, CAU);
  const thuTuChu = String(form.get('thu_tu') ?? '').trim();
  const thuTu = /^\d{1,3}$/.test(thuTuChu) ? Number(thuTuChu) : undefined;

  const dong: Partial<MonAn> = {
    ten_vi: chu(form, 'ten_vi'),
    mo_ta_vi: chu(form, 'mo_ta_vi'),
    khau_phan: chu(form, 'khau_phan'),
  };
  if (thuTu !== undefined) dong.thu_tu = thuTu;
  // Ô cảnh báo chỉ có trên form của món sống. Không có ô thì không đụng cột (null là xóa mất câu cảnh báo).
  if (form.get('canh_bao') !== null) dong.canh_bao = chu(form, 'canh_bao');

  // Ô dịch chỉ vào câu UPDATE khi người dùng THẬT SỰ sửa nó so với lúc mở màn
  // hình (ô ẩn goc_…). Máy dịch chạy nền có thể đã ghi bản mới trong lúc form
  // còn mở; gửi lại nguyên chữ cũ của form là đè mất bản đó — và trigger còn
  // ghi nhận chữ cũ ấy là "bản sửa tay" của câu gốc mới, sai hẳn.
  for (const ten of COT_DICH) {
    if (form.get(ten) === null) continue;
    const moi = chu(form, ten);
    if (!giongNhau(moi, chu(form, `goc_${ten}`))) (dong as Record<string, unknown>)[ten] = moi;
  }

  let loi: string | null = null;
  if (!dong.ten_vi) loi = t.chuaTen;
  else if (thuTu === undefined) loi = t.thuTuSai;
  return { dong, loi };
}

const CAU_XONG = { luu: 'daLuu', luu_cong_bo: 'daLuuCongBo' } as const;

/**
 * Lưu mọi ô của form soạn; nút "Lưu và công bố" thì công bố luôn trong CÙNG câu
 * UPDATE, để nội dung và trạng thái không bao giờ lệch nhau.
 */
export async function luuMon(
  client: SupabaseClient, id: string, form: FormData, nn: NgonNguNB = 'vi',
): Promise<KetQuaLuu> {
  const t = dichNB(nn, CAU);
  const viec = String(form.get('viec') ?? 'luu');
  if (!(viec in CAU_XONG)) return { ok: false, cau: t.viecSai };
  const xong = t[CAU_XONG[viec as keyof typeof CAU_XONG]];

  const { dong, loi } = docForm(form, nn);
  if (loi) return { ok: false, cau: loi, daGo: dong };
  if (viec === 'luu_cong_bo') {
    // Hỏi trước điều database sẽ hỏi, cho câu báo rõ. Món sống thiếu cảnh báo thì để database chặn:
    // cờ món sống không nằm trong form, và database mới là luật.
    if (laChuTam(dong.ten_vi) || laChuTam(dong.mo_ta_vi)) return { ok: false, cau: t.chuaSach, daGo: dong };
    dong.trang_thai = 'da_cong_bo';
  }

  // Chống hai người cùng sửa: chỉ ghi khi dòng còn đúng phiên bản lúc mở màn hình.
  const phienBan = String(form.get('phien_ban') ?? '');
  const { data, error } = await client
    .from('mon_an')
    .update(dong)
    .eq('id', id)
    .eq('updated_at', phienBan)
    .select('id');

  if (error) {
    // Món ĐANG công bố mà lưu bản thiếu: CHECK cũng chặn, nhưng câu "chưa công bố được" sai hoàn cảnh.
    const dangHien = viec === 'luu' && /mon_an_cong_bo_phai_sach/.test(error.message ?? '');
    return { ok: false, cau: dangHien ? t.dangHienPhaiSach : cauLoi(error, t.khongLuu, nn), daGo: dong };
  }
  if (!data || data.length === 0) {
    // Đọc lại đúng các ô vừa gửi. Database đang giữ ĐÚNG bản này (lần hai của cú bấm đúp, F5
    // sau khi lưu — lần một đã ghi và đổi phiên bản) thì nó ĐÃ được lưu: nói "Đã lưu", không
    // nói "người khác sửa … CHƯA được lưu".
    const { data: hienTai } = await client
      .from('mon_an')
      .select(['updated_at', ...Object.keys(dong)].join(', '))
      .eq('id', id)
      .maybeSingle();
    const dangGiu = hienTai as Record<string, unknown> | null;
    if (dangGiu && Object.entries(dong).every(([k, v]) => cungGiaTri(dangGiu[k], v))) {
      return { ok: true, cau: xong };
    }
    return {
      ok: false,
      daGo: dong,
      cau: dangGiu && dangGiu.updated_at !== phienBan ? t.nguoiKhacSua : t.khongSuaDuoc,
    };
  }
  return { ok: true, cau: xong };
}

/** Gỡ món khỏi trang. Không đụng nội dung, nên không cần kiểm phiên bản. */
export async function goMon(client: SupabaseClient, id: string, nn: NgonNguNB = 'vi'): Promise<KetQua> {
  const t = dichNB(nn, CAU);
  const { data, error } = await client
    .from('mon_an')
    .update({ trang_thai: 'da_thu_hoi' })
    .eq('id', id)
    .eq('trang_thai', 'da_cong_bo')
    .select('id');
  if (error) return { ok: false, cau: cauLoi(error, t.khongGo, nn) };
  if (!data || data.length === 0) {
    // Lần hai của cú bấm đúp / F5: món đã gỡ thì việc đã xong — nói trạng thái, không nói lỗi.
    const { data: hienTai } = await client.from('mon_an').select('trang_thai').eq('id', id).maybeSingle();
    if (hienTai?.trang_thai === 'da_thu_hoi') return { ok: true, cau: t.daGoRoi };
    return { ok: false, cau: t.khongConDang };
  }
  return { ok: true, cau: t.daGo };
}
