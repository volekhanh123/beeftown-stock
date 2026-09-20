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
function cauLoi(e: { message?: string } | null, mac_dinh: string): string {
  const m = e?.message ?? '';
  if (/permission denied|violates row-level security/i.test(m)) {
    return 'Tài khoản của bạn không có quyền làm việc này.';
  }
  if (/duplicate key|unique/i.test(m)) return 'Tên này đã có rồi.';
  return m || mac_dinh;
}

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
export async function docChiNhanh(client: SupabaseClient): Promise<ChiNhanh | null> {
  const { data } = await client
    .from('chi_nhanh')
    .select('id, ma, ten, khu_vuc, dia_chi, dien_thoai, trua_bat_dau, trua_ket_thuc, toi_bat_dau, toi_ket_thuc, buoc_khung_gio_phut, thoi_luong_bua_phut, giu_ban_phut, dang_hoat_dong')
    .order('ma')
    .limit(1)
    .maybeSingle();
  return (data as ChiNhanh) ?? null;
}

export async function luuChiNhanh(
  client: SupabaseClient, form: FormData, hienCo: ChiNhanh | null,
): Promise<KetQua> {
  const ma = String(form.get('ma') ?? '').trim().toLowerCase();
  const ten = String(form.get('ten') ?? '').trim();
  if (!/^[a-z0-9-]{1,20}$/.test(ma)) {
    return { ok: false, cau: 'Mã chi nhánh chỉ gồm chữ thường, số và dấu gạch ngang.' };
  }
  if (!ten) return { ok: false, cau: 'Chưa điền tên chi nhánh.' };

  const tb = gio(form.get('trua_bat_dau')), tk = gio(form.get('trua_ket_thuc'));
  const ob = gio(form.get('toi_bat_dau')),  ok2 = gio(form.get('toi_ket_thuc'));
  if (!tb || !tk || !ob || !ok2) return { ok: false, cau: 'Giờ phải ở dạng HH:MM.' };
  // Database có ràng buộc y hệt; kiểm ở đây chỉ để câu lỗi dễ đọc hơn.
  if (tk <= tb) return { ok: false, cau: 'Giờ đóng trưa phải sau giờ mở trưa.' };
  if (ok2 <= ob) return { ok: false, cau: 'Giờ đóng tối phải sau giờ mở tối.' };

  const buoc = so(form.get('buoc_khung_gio_phut'), 15, 120);
  if (buoc === null) return { ok: false, cau: 'Khoảng cách khung giờ phải từ 15 đến 120 phút.' };
  const doDai = so(form.get('thoi_luong_bua_phut'), 30, 360);
  if (doDai === null) return { ok: false, cau: 'Một lượt ngồi phải từ 30 đến 360 phút.' };
  const giu = so(form.get('giu_ban_phut'), 0, 120);
  if (giu === null) return { ok: false, cau: 'Thời gian giữ bàn phải từ 0 đến 120 phút.' };

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

  if (error) return { ok: false, cau: cauLoi(error, 'Không lưu được chi nhánh.') };
  return {
    ok: true,
    cau: hienCo
      ? 'Đã lưu chi nhánh. Giờ phục vụ CHƯA lên trang cho tới khi bật công tắc gio_phuc_vu_da_chot ở màn Nội dung.'
      : 'Đã tạo chi nhánh. Nhớ đặt PUBLIC_CHI_NHANH trong web/.env bằng đúng mã vừa nhập.',
  };
}

// -----------------------------------------------------------------------------
// BÀN ĂN
// -----------------------------------------------------------------------------
export async function docBanAn(client: SupabaseClient, chiNhanhId: string): Promise<BanAn[]> {
  const { data } = await client
    .from('ban_an')
    .select('id, ten, so_cho, la_phong_rieng, dang_dung')
    .eq('chi_nhanh_id', chiNhanhId)
    .order('ten');
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
  client: SupabaseClient, form: FormData, chiNhanhId: string,
): Promise<KetQua> {
  const tien_to = String(form.get('tien_to') ?? 'B').trim() || 'B';
  const tu = so(form.get('tu'), 1, 999);
  const den = so(form.get('den'), 1, 999);
  const soCho = so(form.get('so_cho'), 1, 50);
  const rieng = form.get('la_phong_rieng') === 'co';

  if (tu === null || den === null) return { ok: false, cau: 'Số bắt đầu và số kết thúc phải từ 1 đến 999.' };
  if (den < tu) return { ok: false, cau: 'Số kết thúc phải lớn hơn hoặc bằng số bắt đầu.' };
  if (den - tu + 1 > 100) return { ok: false, cau: 'Một lần thêm tối đa 100 bàn.' };
  if (soCho === null) return { ok: false, cau: 'Số chỗ phải từ 1 đến 50.' };

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
  if (error) return { ok: false, cau: cauLoi(error, 'Không thêm được bàn.') };
  return { ok: true, cau: `Đã thêm ${dong.length} bàn: ${dong[0].ten}–${dong[dong.length - 1].ten}.` };
}

export async function themMotBan(
  client: SupabaseClient, form: FormData, chiNhanhId: string,
): Promise<KetQua> {
  const ten = String(form.get('ten') ?? '').trim();
  const soCho = so(form.get('so_cho'), 1, 50);
  if (!ten) return { ok: false, cau: 'Chưa điền tên bàn.' };
  if (soCho === null) return { ok: false, cau: 'Số chỗ phải từ 1 đến 50.' };

  const { error } = await client.from('ban_an').insert({
    chi_nhanh_id: chiNhanhId, ten, so_cho: soCho,
    la_phong_rieng: form.get('la_phong_rieng') === 'co',
  });
  if (error) return { ok: false, cau: cauLoi(error, 'Không thêm được bàn.') };
  return { ok: true, cau: `Đã thêm bàn ${ten}.` };
}

export async function doiTrangThaiBan(
  client: SupabaseClient, id: string, dangDung: boolean,
): Promise<KetQua> {
  const { error } = await client.from('ban_an').update({ dang_dung: dangDung }).eq('id', id);
  if (error) return { ok: false, cau: cauLoi(error, 'Không đổi được trạng thái bàn.') };
  return {
    ok: true,
    cau: dangDung
      ? 'Đã cho bàn hoạt động lại.'
      : 'Đã ngừng dùng bàn. Nó không còn được tính vào sức chứa, nhưng lịch sử đặt bàn cũ giữ nguyên.',
  };
}

export async function xoaBan(client: SupabaseClient, id: string): Promise<KetQua> {
  // dat_ban.ban_an_id là `on delete set null`, nên xóa không làm mất lượt đặt
  // nào — chỉ mất thông tin "khách ngồi bàn nào". Với bàn gõ nhầm lúc cài đặt
  // thì xóa là đúng; với bàn đã dùng thật thì nên "ngừng dùng" thay vì xóa.
  const { error } = await client.from('ban_an').delete().eq('id', id);
  if (error) return { ok: false, cau: cauLoi(error, 'Không xóa được bàn.') };
  return { ok: true, cau: 'Đã xóa bàn.' };
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
    ten: 'Ẩn danh hồ sơ đã quá hạn lưu',
    giai_thich: 'Xóa họ tên, số điện thoại, email, địa chỉ IP và file CV của các hồ sơ đã quá 6 tháng. Giữ lại dòng để số liệu tuyển dụng không bị hụt. Đây là điều Beeftown đã hứa trên trang quyền riêng tư.',
    chi_chu_so_huu: true,
  },
  {
    ham: 'don_dep_phieu_tai_len',
    ten: 'Dọn vé tải CV đã hết hạn',
    giai_thich: 'Vé chỉ sống 15 phút. Dọn định kỳ cho bảng khỏi phình.',
    chi_chu_so_huu: false,
  },
  {
    ham: 'don_dep_su_kien_web',
    ten: 'Xóa dữ liệu đo lường quá 90 ngày',
    giai_thich: 'Trang quyền riêng tư nói chỉ giữ 90 ngày. Nút này là chỗ giữ lời.',
    chi_chu_so_huu: false,
  },
] as const;

export async function chayViecDon(client: SupabaseClient, ham: string): Promise<KetQua> {
  if (!VIEC_DON.some(v => v.ham === ham)) {
    return { ok: false, cau: 'Việc dọn không hợp lệ.' };
  }
  const { data, error } = await client.rpc(ham);
  if (error) return { ok: false, cau: cauLoi(error, 'Không chạy được.') };
  const n = typeof data === 'number' ? data : 0;
  return {
    ok: true,
    cau: n === 0 ? 'Chạy xong — không có dòng nào cần dọn.' : `Chạy xong — đã xử lý ${n} dòng.`,
  };
}
