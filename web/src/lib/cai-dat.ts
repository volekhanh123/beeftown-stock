/**
 * CÀI ĐẶT NHÀ HÀNG — chi nhánh, bàn ăn, dọn dữ liệu
 *
 * VÌ SAO MÀN NÀY TỒN TẠI
 *
 * Bản đầu để ba việc này ở dạng SQL, với lý do ghi trong màn tổng quan là
 * "cần giấy tờ, tài khoản công ty, hoặc người thật xác nhận". Lý do đó đúng
 * với việc tạo tài khoản nhân sự — nó phải đi qua Supabase Auth. Nhưng với
 * NHẬP BÀN và CHỐT GIỜ thì nó là lý do yếu: hai cái đó chỉ là nhập liệu.
 *
 * Và chúng không phải việc làm một lần. Thêm bàn, bỏ bàn hỏng, đổi giờ theo
 * mùa, mở phòng riêng — chủ nhà hàng sẽ sửa nhiều lần. Bắt người ta mở SQL
 * Editor mỗi lần là bắt họ phụ thuộc vào một lập trình viên để làm một việc
 * mà bản chất là điền vào ô.
 *
 * QUYỀN Ở ĐÂY DO DATABASE QUYẾT ĐỊNH, KHÔNG PHẢI DO FILE NÀY
 *
 * chi_nhanh_sua đòi la_chu_so_huu(); ban_an_sua đòi quản lý trở lên và đúng
 * chi nhánh. Giao diện chỉ ẩn nút cho gọn mắt — ai gọi thẳng vẫn bị RLS chặn.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { dichNB, type HaiThuTieng, type NgonNguNB } from './ngon-ngu-noi-bo.ts';
import { dichCau } from './cau-noi-bo.ts';
import { CAU_MAT_MANG_GHI, laLoiMang } from './qua-tai.ts';

/** Câu của file này ở hai thứ tiếng giao diện nội bộ (lib/ngon-ngu-noi-bo.ts). */
const CAU = {
  khongQuyen:   { vi: 'Tài khoản của bạn không có quyền làm việc này.', en: 'Your account is not allowed to do this.' },
  trungTen:     { vi: 'Tên này đã có rồi.', en: 'That name already exists.' },
  maSai:        { vi: 'Mã chi nhánh chỉ gồm chữ thường, số và dấu gạch ngang.', en: 'The branch code may only contain lowercase letters, digits and hyphens.' },
  chuaTenCN:    { vi: 'Chưa điền tên chi nhánh.', en: 'The branch has no name.' },
  gioSai:       { vi: 'Giờ phải ở dạng HH:MM.', en: 'Times must be in HH:MM format.' },
  truaSai:      { vi: 'Giờ đóng trưa phải sau giờ mở trưa.', en: 'Lunch closing time must be after lunch opening time.' },
  toiSai:       { vi: 'Giờ đóng tối phải sau giờ mở tối.', en: 'Dinner closing time must be after dinner opening time.' },
  buocSai:      { vi: 'Khoảng cách khung giờ phải từ 15 đến 120 phút.', en: 'The time-slot interval must be 15 to 120 minutes.' },
  luotSai:      { vi: 'Một lượt ngồi phải từ 30 đến 360 phút.', en: 'A seating must last 30 to 360 minutes.' },
  giuSai:       { vi: 'Thời gian giữ bàn phải từ 0 đến 120 phút.', en: 'The table hold time must be 0 to 120 minutes.' },
  khongLuuCN:   { vi: 'Không lưu được chi nhánh.', en: 'Could not save the branch.' },
  daLuuCN:      { vi: 'Đã lưu chi nhánh. Giờ phục vụ CHƯA lên trang cho tới khi bật công tắc gio_phuc_vu_da_chot ở màn Nội dung.',
                  en: 'Branch saved. Opening hours are NOT on the site until you turn on the gio_phuc_vu_da_chot switch on the Content screen.' },
  daTaoCN:      { vi: 'Đã tạo chi nhánh. Nhớ đặt PUBLIC_CHI_NHANH trong web/.env bằng đúng mã vừa nhập.',
                  en: 'Branch created. Remember to set PUBLIC_CHI_NHANH in web/.env to exactly the code you entered.' },
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
  khu_vuc: string | null;
  dia_chi: string | null;
  dien_thoai: string | null;
  trua_bat_dau: string;
  trua_ket_thuc: string;
  toi_bat_dau: string;
  toi_ket_thuc: string;
  buoc_khung_gio_phut: number;
  thoi_luong_bua_phut: number;
  giu_ban_phut: number;
  dang_hoat_dong: boolean;
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
    .select('id, ma, ten, khu_vuc, dia_chi, dien_thoai, trua_bat_dau, trua_ket_thuc, toi_bat_dau, toi_ket_thuc, buoc_khung_gio_phut, thoi_luong_bua_phut, giu_ban_phut, dang_hoat_dong')
    .order('ma')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as ChiNhanh) ?? null;
}

export async function luuChiNhanh(
  client: SupabaseClient, form: FormData, hienCo: ChiNhanh | null, nn: NgonNguNB = 'vi',
): Promise<KetQua> {
  const t = dichNB(nn, CAU);
  const ma = String(form.get('ma') ?? '').trim().toLowerCase();
  const ten = String(form.get('ten') ?? '').trim();
  if (!/^[a-z0-9-]{1,20}$/.test(ma)) {
    return { ok: false, cau: t.maSai };
  }
  if (!ten) return { ok: false, cau: t.chuaTenCN };

  const tb = gio(form.get('trua_bat_dau')), tk = gio(form.get('trua_ket_thuc'));
  const ob = gio(form.get('toi_bat_dau')),  ok2 = gio(form.get('toi_ket_thuc'));
  if (!tb || !tk || !ob || !ok2) return { ok: false, cau: t.gioSai };
  // Database có ràng buộc y hệt; kiểm ở đây chỉ để câu lỗi dễ đọc hơn.
  if (tk <= tb) return { ok: false, cau: t.truaSai };
  if (ok2 <= ob) return { ok: false, cau: t.toiSai };

  const buoc = so(form.get('buoc_khung_gio_phut'), 15, 120);
  if (buoc === null) return { ok: false, cau: t.buocSai };
  const doDai = so(form.get('thoi_luong_bua_phut'), 30, 360);
  if (doDai === null) return { ok: false, cau: t.luotSai };
  const giu = so(form.get('giu_ban_phut'), 0, 120);
  if (giu === null) return { ok: false, cau: t.giuSai };

  const dong = {
    ma, ten,
    khu_vuc: String(form.get('khu_vuc') ?? '').trim() || null,
    dia_chi: String(form.get('dia_chi') ?? '').trim() || null,
    dien_thoai: String(form.get('dien_thoai') ?? '').trim() || null,
    trua_bat_dau: tb, trua_ket_thuc: tk, toi_bat_dau: ob, toi_ket_thuc: ok2,
    buoc_khung_gio_phut: buoc, thoi_luong_bua_phut: doDai, giu_ban_phut: giu,
  };

  const { error } = hienCo
    ? await client.from('chi_nhanh').update(dong).eq('id', hienCo.id)
    : await client.from('chi_nhanh').insert(dong);

  if (error) return { ok: false, cau: cauLoi(error, t.khongLuuCN, nn) };
  return { ok: true, cau: hienCo ? t.daLuuCN : t.daTaoCN };
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
// -----------------------------------------------------------------------------
export const VIEC_DON = [
  {
    ham: 'don_dep_ho_so_het_han',
    ten: { vi: 'Ẩn danh hồ sơ đã quá hạn lưu', en: 'Anonymise applications past their retention period' },
    giai_thich: { vi: 'Xóa họ tên, số điện thoại, email, địa chỉ IP và file CV của các hồ sơ đã quá 6 tháng. Giữ lại dòng để số liệu tuyển dụng không bị hụt. Đây là điều Beeftown đã hứa trên trang quyền riêng tư.',
                  en: 'Deletes the name, phone, email, IP address and CV file of applications older than 6 months. The rows stay so hiring numbers do not drop. This is what Beeftown promised on the privacy page.' },
    chi_chu_so_huu: true,
  },
  {
    ham: 'don_dep_phieu_tai_len',
    ten: { vi: 'Dọn vé tải CV đã hết hạn', en: 'Clean up expired CV upload tickets' },
    giai_thich: { vi: 'Vé chỉ sống 15 phút. Dọn định kỳ cho bảng khỏi phình.',
                  en: 'Tickets live only 15 minutes. Clean up regularly so the table does not grow.' },
    chi_chu_so_huu: false,
  },
  {
    ham: 'don_dep_su_kien_web',
    ten: { vi: 'Xóa dữ liệu đo lường quá 90 ngày', en: 'Delete analytics data older than 90 days' },
    giai_thich: { vi: 'Trang quyền riêng tư nói chỉ giữ 90 ngày. Nút này là chỗ giữ lời.',
                  en: 'The privacy page says data is kept only 90 days. This button keeps that promise.' },
    // don_dep_su_kien_web() (0013) chỉ cho chủ sở hữu — quản lý bấm sẽ chỉ nhận câu từ chối.
    chi_chu_so_huu: true,
  },
] as const;

export async function chayViecDon(client: SupabaseClient, ham: string, nn: NgonNguNB = 'vi'): Promise<KetQua> {
  const t = dichNB(nn, CAU);
  if (!VIEC_DON.some(v => v.ham === ham)) return { ok: false, cau: t.viecDonSai };
  const { data, error } = await client.rpc(ham);
  if (error) return { ok: false, cau: cauLoi(error, t.khongChay, nn) };
  const n = typeof data === 'number' ? data : 0;
  return { ok: true, cau: n === 0 ? t.xongKhongCo : t.xongN(n) };
}
