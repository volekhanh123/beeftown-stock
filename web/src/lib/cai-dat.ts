/**
 * CÀI ĐẶT NHÀ HÀNG — đặt bàn (bật / tắt, giờ mở cửa), bàn ăn, dọn dữ liệu
 *
 * VÌ SAO MÀN NÀY TỒN TẠI
 *
 * Bản đầu để mấy việc này ở dạng SQL. Nhưng đổi giờ theo mùa, bật tắt nhận
 * đặt bàn, thêm bàn là nhập liệu mà chủ nhà hàng làm nhiều lần — bắt mở SQL
 * Editor mỗi lần là bắt họ phụ thuộc vào một lập trình viên.
 *
 * GỌN 26/10/2026 (Khánh: "nhiều câu hỏi quá, cứ kích hoạt đi"): màn chỉ còn thứ
 * cần để nhận đặt bàn. Lưu giờ là giờ lên trang luôn (tự công bố
 * gio_phuc_vu_da_chot), nút bật / tắt nhận đặt bàn nằm ngay đây (công bố
 * form_dat_ban_dang_mo) — không phải sang màn Nội dung bật thêm công tắc. Bàn
 * ăn không bắt buộc: chi nhánh chưa nhập bàn nào thì database không tính sức
 * chứa (0100).
 * Bỏ khỏi form: khu vực, địa chỉ, điện thoại nội bộ, bước khung giờ, độ dài lượt
 * ngồi, giữ bàn — giữ giá trị đang có trong database (bước 30, lượt 120, giữ 15
 * phút). Lưu giờ chỉ ghi bốn cột giờ, mấy cột kia không bị xóa. Địa chỉ và số
 * điện thoại khách đọc là dia_chi_hien_thi, hotline ở màn Nội dung; bot Messenger
 * chỉ lùi về dia_chi, dien_thoai của dòng chi_nhanh khi hai khóa đó chưa công bố
 * (lib/messenger-anon.ts) — muốn đổi thì công bố hai khóa đó, không sửa ở đây.
 *
 * QUYỀN Ở ĐÂY DO DATABASE QUYẾT ĐỊNH, KHÔNG PHẢI DO FILE NÀY
 *
 * chi_nhanh_sua và hai công tắc đòi la_chu_so_huu(); ban_an_sua đòi quản lý trở
 * lên và đúng chi nhánh. Giao diện chỉ ẩn nút cho gọn mắt — ai gọi thẳng vẫn bị
 * RLS chặn.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { dichNB, type HaiThuTieng, type NgonNguNB } from './ngon-ngu-noi-bo.ts';
import { dichCau } from './cau-noi-bo.ts';
import { CAU_MAT_MANG_GHI, laLoiMang } from './qua-tai.ts';
import { anDanhHoSoHetHan, donCvMoCoiVaVe } from './xoa-cv.ts';

/** Câu của file này ở hai thứ tiếng giao diện nội bộ (lib/ngon-ngu-noi-bo.ts). */
const CAU = {
  khongQuyen:   { vi: 'Tài khoản của bạn không có quyền làm việc này.', en: 'Your account is not allowed to do this.' },
  trungTen:     { vi: 'Tên này đã có rồi.', en: 'That name already exists.' },
  maSai:        { vi: 'Mã chi nhánh chỉ gồm chữ thường, số và dấu gạch ngang.', en: 'The branch code may only contain lowercase letters, digits and hyphens.' },
  chuaTenCN:    { vi: 'Chưa điền tên chi nhánh.', en: 'The branch has no name.' },
  gioSai:       { vi: 'Giờ phải ở dạng HH:MM.', en: 'Times must be in HH:MM format.' },
  truaSai:      { vi: 'Giờ đóng trưa phải sau giờ mở trưa.', en: 'Lunch closing time must be after lunch opening time.' },
  toiSai:       { vi: 'Giờ đóng tối phải sau giờ mở tối.', en: 'Dinner closing time must be after dinner opening time.' },
  khongLuuCN:   { vi: 'Không lưu được giờ mở cửa.', en: 'Could not save the opening hours.' },
  daLuuGio:     { vi: 'Đã lưu giờ mở cửa. Trang công khai và khung giờ đặt bàn đổi ngay.',
                  en: 'Opening hours saved. The public site and the booking time slots change right away.' },
  // Giờ đã ghi vào chi_nhanh nhưng công tắc gio_phuc_vu_da_chot chưa công bố được: nói đúng cả hai nửa.
  gioChuaLen:   { vi: (loi: string) => `Đã lưu giờ mở cửa, nhưng CHƯA đưa giờ lên trang được: ${loi} Bấm Lưu giờ mở cửa lần nữa.`,
                  en: (loi: string) => `Opening hours saved, but they could NOT be put on the site: ${loi} Press Save opening hours again.` },
  daTaoCN:      { vi: 'Đã tạo chi nhánh và lưu giờ mở cửa. Nhớ đặt PUBLIC_CHI_NHANH trong web/.env bằng đúng mã vừa nhập.',
                  en: 'Branch created and opening hours saved. Remember to set PUBLIC_CHI_NHANH in web/.env to exactly the code you entered.' },
  khongDoiNhan: { vi: 'Không đổi được việc nhận đặt bàn.', en: 'Could not change whether bookings are taken.' },
  daBatNhan:    { vi: 'Đã bật nhận đặt bàn trên web.', en: 'Online bookings are on.' },
  daTatNhan:    { vi: 'Đã tắt nhận đặt bàn trên web. Trang Hỏi bàn không còn form.',
                  en: 'Online bookings are off. The Ask for a table page no longer shows the form.' },
  batSai:       { vi: 'Không rõ bật hay tắt. Chưa đổi gì.', en: 'Unclear whether to turn on or off. Nothing changed.' },
  lyDo:         { vi: 'Bấm ở màn Cài đặt', en: 'Set on the Settings screen' },
  soSai:        { vi: 'Số bắt đầu và số kết thúc phải từ 1 đến 999.', en: 'The start and end numbers must be 1 to 999.' },
  denNho:       { vi: 'Số kết thúc phải lớn hơn hoặc bằng số bắt đầu.', en: 'The end number must be greater than or equal to the start number.' },
  toiDa100:     { vi: 'Một lần thêm tối đa 100 bàn.', en: 'You can add at most 100 tables at once.' },
  soChoSai:     { vi: 'Số chỗ phải từ 1 đến 50.', en: 'Seats must be 1 to 50.' },
  khongThemBan: { vi: 'Không thêm được bàn.', en: 'Could not add the table.' },
  daThemNhieu:  { vi: (n: number, a: string, b: string) => `Đã thêm ${n} bàn: ${a}–${b}.`, en: (n: number, a: string, b: string) => `Added ${n} tables: ${a}–${b}.` },
  chuaTenBan:   { vi: 'Chưa điền tên bàn.', en: 'The table has no name.' },
  daThemMot:    { vi: (ten: string) => `Đã thêm bàn ${ten}.`, en: (ten: string) => `Added table ${ten}.` },
  // Lần hai của cú bấm đúp / F5 sau khi thêm: bàn đã có đúng như vừa gửi. Nói trạng thái, không báo lỗi.
  daCoMot:      { vi: (ten: string) => `Bàn ${ten} đã có trong danh sách.`, en: (ten: string) => `Table ${ten} is already in the list.` },
  daCoNhieu:    { vi: (a: string, b: string) => `Các bàn ${a}–${b} đã có trong danh sách.`, en: (a: string, b: string) => `Tables ${a}–${b} are already in the list.` },
  khongDoiBan:  { vi: 'Không đổi được trạng thái bàn.', en: 'Could not change the table status.' },
  banDungLai:   { vi: 'Đã cho bàn hoạt động lại.', en: 'The table is in use again.' },
  banNgung:     { vi: 'Đã ngừng dùng bàn. Nó không còn được tính vào sức chứa, nhưng lịch sử đặt bàn cũ giữ nguyên.',
                  en: 'Table taken out of use. It no longer counts toward capacity, but its booking history is kept.' },
  khongXoaBan:  { vi: 'Không xóa được bàn.', en: 'Could not delete the table.' },
  daXoaBan:     { vi: 'Đã xóa bàn.', en: 'Table deleted.' },
  viecDonSai:   { vi: 'Việc dọn không hợp lệ.', en: 'Invalid clean-up job.' },
  khongChay:    { vi: 'Không chạy được.', en: 'Could not run it.' },
  xongKhongCo:  { vi: 'Chạy xong — không có dòng nào cần dọn.', en: 'Done — nothing needed cleaning.' },
  xongN:        { vi: (n: number) => `Chạy xong — đã xử lý ${n} dòng.`, en: (n: number) => `Done — processed ${n} rows.` },
} satisfies Record<string, HaiThuTieng<unknown>>;

export interface ChiNhanh {
  id: string;
  ma: string;
  ten: string;
  trua_bat_dau: string;
  trua_ket_thuc: string;
  toi_bat_dau: string;
  toi_ket_thuc: string;
  dang_hoat_dong: boolean;
}

/** Hai công tắc của đặt bàn, như đang sống trên trang công khai. */
export interface CongTacDatBan {
  /** form_dat_ban_dang_mo đã công bố và đang bật. */
  nhanDatBan: boolean;
  /** gio_phuc_vu_da_chot đã công bố và đang bật — giờ mở cửa hiện trên trang. */
  gioDaLen: boolean;
}

export interface BanAn {
  id: string;
  ten: string;
  so_cho: number;
  la_phong_rieng: boolean;
  dang_dung: boolean;
}

export interface KetQua { ok: boolean; cau: string }

/** Câu lỗi của database viết bằng tiếng Việt và tính cho người đọc. Dùng nguyên văn. */
function cauLoi(e: { message?: string } | null, mac_dinh: string, nn: NgonNguNB): string {
  const m = e?.message ?? '';
  if (laLoiMang(m)) return CAU_MAT_MANG_GHI[nn];
  if (/permission denied|violates row-level security/i.test(m)) return CAU.khongQuyen[nn];
  if (/duplicate key|unique/i.test(m)) return CAU.trungTen[nn];
  return m ? dichCau(nn, m) : mac_dinh;
}

/**
 * Thêm bàn bị chặn vì trùng tên: các bàn đó có ĐÚNG như vừa gửi không (lần hai của cú bấm đúp,
 * F5 sau khi thêm — lần một đã thêm). Đúng hết → true. Một bàn khác số chỗ / loại, hay chưa có,
 * hay đọc không được → false, và câu "Tên này đã có rồi" giữ nguyên.
 */
async function daCoDungNhuGui(
  client: SupabaseClient, chiNhanhId: string, dong: { ten: string; so_cho: number; la_phong_rieng: boolean }[],
): Promise<boolean> {
  const { data, error } = await client
    .from('ban_an')
    .select('ten, so_cho, la_phong_rieng, dang_dung')
    .eq('chi_nhanh_id', chiNhanhId)
    .in('ten', dong.map(d => d.ten));
  if (error || !Array.isArray(data)) return false;
  const co = new Map((data as BanAn[]).map(b => [b.ten, b]));
  return dong.every(d => {
    const b = co.get(d.ten);
    return !!b && b.dang_dung && b.so_cho === d.so_cho && b.la_phong_rieng === d.la_phong_rieng;
  });
}

const laTrungTen = (e: { code?: string; message?: string }) => e.code === '23505' || /duplicate key/i.test(e.message ?? '');

function gio(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? '').trim();
  return /^\d{2}:\d{2}$/.test(s) ? s : null;
}

function so(v: FormDataEntryValue | null, min: number, max: number): number | null {
  const n = Number(String(v ?? '').trim());
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

// -----------------------------------------------------------------------------
// CHI NHÁNH
// -----------------------------------------------------------------------------
/** Đọc lỗi → ném: trả null là trang nói "Chưa có chi nhánh nào" và POST lưu chi nhánh thành INSERT thay vì UPDATE. */
export async function docChiNhanh(client: SupabaseClient): Promise<ChiNhanh | null> {
  const { data, error } = await client
    .from('chi_nhanh')
    .select('id, ma, ten, trua_bat_dau, trua_ket_thuc, toi_bat_dau, toi_ket_thuc, dang_hoat_dong')
    .order('ma')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as ChiNhanh) ?? null;
}

/**
 * Lưu giờ mở cửa — chưa có chi nhánh thì tạo luôn (mã, tên, giờ).
 *
 * Có chi nhánh: chỉ ghi bốn cột giờ. Rồi đưa giờ lên trang nếu công tắc
 * gio_phuc_vu_da_chot chưa bật — chủ nhà hàng vừa gõ giờ là đã chốt giờ, bắt
 * sang màn Nội dung bật thêm một công tắc là một câu hỏi thừa.
 */
export async function luuChiNhanh(
  client: SupabaseClient, form: FormData, hienCo: ChiNhanh | null, nn: NgonNguNB = 'vi',
): Promise<KetQua> {
  const t = dichNB(nn, CAU);
  const tb = gio(form.get('trua_bat_dau')), tk = gio(form.get('trua_ket_thuc'));
  const ob = gio(form.get('toi_bat_dau')),  ok2 = gio(form.get('toi_ket_thuc'));
  if (!tb || !tk || !ob || !ok2) return { ok: false, cau: t.gioSai };
  // Database có ràng buộc y hệt; kiểm ở đây chỉ để câu lỗi dễ đọc hơn.
  if (tk <= tb) return { ok: false, cau: t.truaSai };
  if (ok2 <= ob) return { ok: false, cau: t.toiSai };
  const gioMoi = { trua_bat_dau: tb, trua_ket_thuc: tk, toi_bat_dau: ob, toi_ket_thuc: ok2 };

  let error;
  if (hienCo) {
    // RLS chặn update thì PostgREST không báo lỗi, chỉ sửa 0 dòng: hỏi lại dòng đã sửa, không có thì không nói "đã lưu".
    const { data, error: loi } = await client.from('chi_nhanh').update(gioMoi).eq('id', hienCo.id).select('id');
    if (!loi && (!Array.isArray(data) || data.length === 0)) return { ok: false, cau: t.khongQuyen };
    error = loi;
  } else {
    const ma = String(form.get('ma') ?? '').trim().toLowerCase();
    const ten = String(form.get('ten') ?? '').trim();
    if (!/^[a-z0-9-]{1,20}$/.test(ma)) return { ok: false, cau: t.maSai };
    if (!ten) return { ok: false, cau: t.chuaTenCN };
    ({ error } = await client.from('chi_nhanh').insert({ ma, ten, ...gioMoi }));
  }
  if (error) return { ok: false, cau: cauLoi(error, t.khongLuuCN, nn) };

  // Đọc không được → coi như chưa bật: công bố lại một bản cũng vô hại.
  const gioDaLen = () => docCongTacDatBan(client).then(c => c.gioDaLen, () => false);
  if (!await gioDaLen()) {
    const { error: loiCongBo } = await client.rpc('dat_noi_dung', {
      p_khoa: 'gio_phuc_vu_da_chot', p_bool: true, p_cong_bo: true, p_ly_do: t.lyDo,
    });
    // Hai lượt lưu cùng lúc: lượt sau vấp bản lượt trước vừa công bố (một bản sống mỗi khóa). Giờ đã lên
    // thật thì là "đã lưu" — hỏi lại database, không đoán từ câu lỗi.
    if (loiCongBo && !await gioDaLen()) return { ok: false, cau: t.gioChuaLen(cauLoi(loiCongBo, t.khongLuuCN, nn)) };
  }
  return { ok: true, cau: hienCo ? t.daLuuGio : t.daTaoCN };
}

// -----------------------------------------------------------------------------
// HAI CÔNG TẮC CỦA ĐẶT BÀN
// -----------------------------------------------------------------------------
/** Đọc lỗi → ném (cai-dat.astro hiện "không đọc được"), không trả "đang tắt" để chủ nhà hàng bấm bật lần nữa. */
export async function docCongTacDatBan(client: SupabaseClient): Promise<CongTacDatBan> {
  const { data, error } = await client
    .from('v_bang_cong_tac')
    .select('khoa, dang_song, gia_tri_bool')
    .in('khoa', ['form_dat_ban_dang_mo', 'gio_phuc_vu_da_chot']);
  if (error) throw error;
  const bat = (khoa: string) => ((data ?? []) as { khoa: string; dang_song: boolean; gia_tri_bool: boolean | null }[])
    .some(h => h.khoa === khoa && h.dang_song && h.gia_tri_bool === true);
  return { nhanDatBan: bat('form_dat_ban_dang_mo'), gioDaLen: bat('gio_phuc_vu_da_chot') };
}

/**
 * Bật / tắt nhận đặt bàn: công bố form_dat_ban_dang_mo bằng dat_noi_dung (như màn Nội dung).
 * Form gửi giá trị ĐÍCH (bat = co / khong), không gửi "đảo" — bấm đúp hay F5 ra cùng một kết quả.
 */
export async function datNhanDatBan(
  client: SupabaseClient, form: FormData, nn: NgonNguNB = 'vi',
): Promise<KetQua> {
  const t = dichNB(nn, CAU);
  const giaTri = form.get('bat');
  if (giaTri !== 'co' && giaTri !== 'khong') return { ok: false, cau: t.batSai };
  const bat = giaTri === 'co';
  const { error } = await client.rpc('dat_noi_dung', {
    p_khoa: 'form_dat_ban_dang_mo', p_bool: bat, p_cong_bo: true, p_ly_do: t.lyDo,
  });
  if (error) return { ok: false, cau: cauLoi(error, t.khongDoiNhan, nn) };
  return { ok: true, cau: bat ? t.daBatNhan : t.daTatNhan };
}

// -----------------------------------------------------------------------------
// BÀN ĂN
// -----------------------------------------------------------------------------
/** Đọc lỗi → ném (cai-dat.astro hiện "không đọc được"), không trả "chưa có bàn" để chủ nhà hàng thêm bàn lần nữa. */
export async function docBanAn(client: SupabaseClient, chiNhanhId: string): Promise<BanAn[]> {
  const { data, error } = await client
    .from('ban_an')
    .select('id, ten, so_cho, la_phong_rieng, dang_dung')
    .eq('chi_nhanh_id', chiNhanhId)
    .order('ten');
  if (error) throw error;
  return (data ?? []) as BanAn[];
}

/**
 * Thêm nhiều bàn một lượt.
 *
 * Nhà hàng có 25–30 bàn. Bắt nhập từng cái một là bắt người ta bấm 30 lần
 * cho một việc mà máy làm được — và chính sự tẻ nhạt đó là thứ khiến bảng
 * ban_an bị bỏ trống, mà bảng đó trống thì form đặt bàn báo "hết bàn" với
 * mọi khách.
 */
export async function themNhieuBan(
  client: SupabaseClient, form: FormData, chiNhanhId: string, nn: NgonNguNB = 'vi',
): Promise<KetQua> {
  const t = dichNB(nn, CAU);
  const tien_to = String(form.get('tien_to') ?? 'B').trim() || 'B';
  const tu = so(form.get('tu'), 1, 999);
  const den = so(form.get('den'), 1, 999);
  const soCho = so(form.get('so_cho'), 1, 50);
  const rieng = form.get('la_phong_rieng') === 'co';

  if (tu === null || den === null) return { ok: false, cau: t.soSai };
  if (den < tu) return { ok: false, cau: t.denNho };
  if (den - tu + 1 > 100) return { ok: false, cau: t.toiDa100 };
  if (soCho === null) return { ok: false, cau: t.soChoSai };

  const rong = String(den).length >= 2 ? String(den).length : 2;
  const dong = [];
  for (let i = tu; i <= den; i++) {
    dong.push({
      chi_nhanh_id: chiNhanhId,
      ten: `${tien_to}${String(i).padStart(rong, '0')}`,
      so_cho: soCho,
      la_phong_rieng: rieng,
    });
  }

  const { error } = await client.from('ban_an').insert(dong);
  if (error && laTrungTen(error) && await daCoDungNhuGui(client, chiNhanhId, dong)) {
    return { ok: true, cau: t.daCoNhieu(dong[0].ten, dong[dong.length - 1].ten) };
  }
  if (error) return { ok: false, cau: cauLoi(error, t.khongThemBan, nn) };
  return { ok: true, cau: t.daThemNhieu(dong.length, dong[0].ten, dong[dong.length - 1].ten) };
}

export async function themMotBan(
  client: SupabaseClient, form: FormData, chiNhanhId: string, nn: NgonNguNB = 'vi',
): Promise<KetQua> {
  const t = dichNB(nn, CAU);
  const ten = String(form.get('ten') ?? '').trim();
  const soCho = so(form.get('so_cho'), 1, 50);
  if (!ten) return { ok: false, cau: t.chuaTenBan };
  if (soCho === null) return { ok: false, cau: t.soChoSai };

  const dong = { chi_nhanh_id: chiNhanhId, ten, so_cho: soCho, la_phong_rieng: form.get('la_phong_rieng') === 'co' };
  const { error } = await client.from('ban_an').insert(dong);
  if (error && laTrungTen(error) && await daCoDungNhuGui(client, chiNhanhId, [dong])) {
    return { ok: true, cau: t.daCoMot(ten) };
  }
  if (error) return { ok: false, cau: cauLoi(error, t.khongThemBan, nn) };
  return { ok: true, cau: t.daThemMot(ten) };
}

export async function doiTrangThaiBan(
  client: SupabaseClient, id: string, dangDung: boolean, nn: NgonNguNB = 'vi',
): Promise<KetQua> {
  const t = dichNB(nn, CAU);
  const { error } = await client.from('ban_an').update({ dang_dung: dangDung }).eq('id', id);
  if (error) return { ok: false, cau: cauLoi(error, t.khongDoiBan, nn) };
  return { ok: true, cau: dangDung ? t.banDungLai : t.banNgung };
}

export async function xoaBan(client: SupabaseClient, id: string, nn: NgonNguNB = 'vi'): Promise<KetQua> {
  const t = dichNB(nn, CAU);
  // dat_ban.ban_an_id là `on delete set null`, nên xóa không làm mất lượt đặt
  // nào — chỉ mất thông tin "khách ngồi bàn nào". Với bàn gõ nhầm lúc cài đặt
  // thì xóa là đúng; với bàn đã dùng thật thì nên "ngừng dùng" thay vì xóa.
  const { error } = await client.from('ban_an').delete().eq('id', id);
  if (error) return { ok: false, cau: cauLoi(error, t.khongXoaBan, nn) };
  return { ok: true, cau: t.daXoaBan };
}

// -----------------------------------------------------------------------------
// DỌN DỮ LIỆU
// -----------------------------------------------------------------------------
// Migration 0012 cố ý KHÔNG gắn ba hàm này vào pg_cron, với lý do "một công
// việc chạy ngầm âm thầm hủy dữ liệu cá nhân thì nên do người bấm". Lý do đó
// đúng — nhưng rồi không có nút nào để bấm, nên trên thực tế chúng chưa bao
// giờ chạy. Trong đó don_dep_ho_so_het_han() là nghĩa vụ theo Nghị định
// 13/2023 và là lời hứa đang nằm trên trang quyền riêng tư.
//
// Từ 0074 hai việc đầu có `chay` riêng (lib/xoa-cv.ts): database không xóa
// được file trong kho CV, nên web xóa file trước rồi mới gọi database. `ham`
// vẫn là tên hàm database quyết quyền của nút (test-quyen-ghi-thang-crm.mjs so
// chi_chu_so_huu với quyền thật); `chay: null` = gọi thẳng hàm đó. Đèn "Dọn dữ
// liệu cá nhân" ở /noi-bo nói khi nào phải bấm.
// -----------------------------------------------------------------------------
type ChayViecDon = (client: SupabaseClient, nn: NgonNguNB, laChu: boolean) => Promise<KetQua>;

export const VIEC_DON = [
  {
    ham: 'don_dep_ho_so_het_han',
    ten: { vi: 'Ẩn danh hồ sơ đã quá hạn lưu', en: 'Anonymise applications past their retention period' },
    giai_thich: { vi: 'Hồ sơ đã quá 6 tháng: xóa file CV khỏi kho trước, rồi mới xóa họ tên, số điện thoại, email, địa chỉ IP. Hồ sơ nào chưa xóa được file thì giữ nguyên cho lần bấm sau. Giữ lại dòng để số liệu tuyển dụng không bị hụt. Đây là điều Beeftown đã hứa trên trang quyền riêng tư.',
                  en: 'Applications older than 6 months: the CV file is deleted from the store first, then the name, phone, email and IP address. An application whose file could not be deleted stays as it is until the next run. The rows stay so hiring numbers do not drop. This is what Beeftown promised on the privacy page.' },
    chi_chu_so_huu: true,
    chay: ((client, nn) => anDanhHoSoHetHan(client, nn)) as ChayViecDon,
  },
  {
    ham: 'don_dep_phieu_tai_len',
    ten: { vi: 'Xóa CV mồ côi và dọn vé tải CV', en: 'Delete orphaned CVs and clean up CV upload tickets' },
    giai_thich: { vi: 'CV mồ côi là file trong kho CV mà không hồ sơ nào trỏ tới — thường là lượt nộp bị từ chối sau khi file đã tải lên. Nút này xóa chúng trước, kho sạch rồi mới dọn vé (vé chỉ sống 15 phút). Chỉ chủ nhà hàng xóa được file trong kho CV: quản lý bấm thì chỉ dọn vé khi kho không còn CV mồ côi.',
                  en: 'An orphaned CV is a file in the CV store that no application points to — usually an application that was rejected after its file was uploaded. This button deletes them first, and only cleans up tickets (which live 15 minutes) once the store is clean. Only the owner can delete files in the CV store: when a manager presses it, tickets are only cleaned up if no orphaned CV is left.' },
    chi_chu_so_huu: false,
    chay: ((client, nn, laChu) => donCvMoCoiVaVe(client, laChu, nn)) as ChayViecDon,
  },
  {
    ham: 'don_dep_su_kien_web',
    ten: { vi: 'Xóa dữ liệu đo lường quá 90 ngày', en: 'Delete analytics data older than 90 days' },
    giai_thich: { vi: 'Trang quyền riêng tư nói chỉ giữ 90 ngày. Nút này là chỗ giữ lời.',
                  en: 'The privacy page says data is kept only 90 days. This button keeps that promise.' },
    // don_dep_su_kien_web() (0013) chỉ cho chủ sở hữu — quản lý bấm sẽ chỉ nhận câu từ chối.
    chi_chu_so_huu: true,
    chay: null,
  },
] as const;

export async function chayViecDon(
  client: SupabaseClient, ham: string, nn: NgonNguNB = 'vi', laChu = false,
): Promise<KetQua> {
  const t = dichNB(nn, CAU);
  const viec = VIEC_DON.find(v => v.ham === ham);
  if (!viec) return { ok: false, cau: t.viecDonSai };
  if (viec.chay) return viec.chay(client, nn, laChu);
  const { data, error } = await client.rpc(ham);
  if (error) return { ok: false, cau: cauLoi(error, t.khongChay, nn) };
  const n = typeof data === 'number' ? data : 0;
  return { ok: true, cau: n === 0 ? t.xongKhongCo : t.xongN(n) };
}
