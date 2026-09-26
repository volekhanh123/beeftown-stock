/**
 * KHO — CHUYỂN QUẦY, XUẤT BẾP, XUẤT KHÁC, BÁO HỦY
 *
 * Một phiếu ghi sổ ngay (chuyển, xuất bếp, xuất khác) hoặc chờ quản lý duyệt
 * (hủy). Xuất khác (0032): dùng nội bộ, tặng khách, hàng mẫu... — bắt buộc lý
 * do, chỉ hàng còn hạn, không kèm ảnh. Lô
 * nào bị lấy do database chọn theo FEFO (kho_phan_bo, 0023) — trừ khi người
 * dùng chọn đích danh một lô. Với nhân viên thì gọi là "tự lấy hàng hạn gần
 * trước", không dùng chữ FEFO.
 *
 * FORM (không JavaScript) — hai kiểu dòng, gửi chung:
 *   Theo mặt hàng: d{i}_mat_hang, d{i}_so_goi, d{i}_so_kg   (FEFO)
 *   Theo lô:       l{i}_lo, l{i}_mat_hang (ẩn), l{i}_so_goi, l{i}_so_kg
 *   Quét nhãn: ô "ma_quet" — mỗi mã một dòng; gom thành dòng theo mặt hàng.
 * Một món KHÔNG được ghi ở cả hai kiểu dòng: kho sẽ bị trừ hai lần.
 *
 * ẢNH BÁO HỦY: tải lên MỘT lần, ngay lần gửi đầu tiên có chọn ảnh (kể cả bấm
 * "Đọc mã" hay gửi bị lỗi). Đường dẫn giữ trong ô ẩn "anh_da_tai" và ma_gui
 * giữ nguyên qua các lần gửi lại — nên ảnh không mất, không phải chụp lại, và
 * không nằm mồ côi trong kho file khi database từ chối phiếu.
 *
 * BÁO HỦY 3 BƯỚC (GĐ5b): Hàng → lý do (nút lớn) → ảnh rồi gửi. Vẫn MỘT form:
 * sang bước sau thì hàng đã ghi và ảnh đã tải đi theo dưới dạng ô ẩn, ma_gui
 * giữ nguyên — bấm lui bấm tới không mất gì, gửi hai lần vẫn một phiếu.
 * Bước nào hiện là do buocHuySau() quyết (hàm thuần, có test).
 *
 * HÀNG ĐI ĐƯỜNG (0032): khi cài đặt "quầy phải bấm nhận" bật, phiếu chuyển
 * kho → quầy do thủ kho lập nằm ở trạng thái dang_chuyen tới khi quầy bấm
 * nhận (lib/kho/quay.ts). Quầy nhận thiếu → nhan_thieu → quản lý trả về kho
 * (da_tra_ve) hoặc ghi mất (da_nhan). Người lập hủy được chuyến khi quầy chưa
 * nhận (da_huy, hàng về lại kho).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, dinhDangKg, docKg, docSoNguyen, laUuid, type KetQua } from './chung.ts';
import { gomTheoMaCan, tachDanhSachMa } from './ma-vach.ts';
import { docAnhDaTai, layTepAnh, soThuTuCuoi, taiAnh } from './anh.ts';
import { apDungTim, type TimDs } from './tim-ds.ts';

/** tra_ncc chỉ lập từ trang Công nợ (kho_tra_nha_cung_cap), không lập ở đây. */
export type LoaiXuat = 'chuyen' | 'xuat_bep' | 'huy' | 'tra_ncc' | 'xuat_khac';

export const TEN_LOAI_XUAT: Record<LoaiXuat, string> = {
  chuyen: 'Chuyển hàng',
  xuat_bep: 'Xuất bếp',
  huy: 'Báo hủy',
  tra_ncc: 'Trả nhà cung cấp',
  xuat_khac: 'Xuất khác',
};

/** Các loại phiếu lập được ở /noi-bo/kho/xuat/moi?loai=… (theo thứ tự trên thanh chọn). */
export const LOAI_LAP_DUOC = ['chuyen', 'xuat_bep', 'xuat_khac', 'huy'] as const;

export type TrangThaiXuat =
  | 'da_ghi' | 'cho_duyet' | 'da_duyet' | 'tu_choi'
  // Hàng đi đường (0032) — chỉ phiếu chuyển
  | 'dang_chuyen' | 'da_nhan' | 'nhan_thieu' | 'da_tra_ve' | 'da_huy'
  // Trả hàng NCC hai bước (0040): thủ kho đã ghi kg, chờ kế toán xác nhận tiền
  // (hủy được khi còn chờ → da_huy).
  | 'cho_xac_nhan_tien';

/**
 * Vị trí chọn được làm nơi lấy / nơi nhận: kho hoặc quầy đang dùng. "Hàng chờ
 * hủy" và "Đang mang ra quầy" là một phần của quy trình, không phải chỗ để
 * hàng — database cũng từ chối (0032).
 */
export function laNoiDeHang(v: { loai: string; dang_dung: boolean }): boolean {
  return v.dang_dung && v.loai !== 'cho_huy' && v.loai !== 'dang_chuyen';
}

export interface PhieuXuatTom {
  id: string;
  so_phieu: string;
  loai: LoaiXuat;
  trang_thai: TrangThaiXuat;
  ngay: string;
  ten_vi_tri: string;
  ten_vi_tri_den: string | null;
  ten_ly_do: string | null;
  so_dong: number;
  tong_goi: number;
  tong_kg: number;
  nguoi_tao: string | null;
  created_at: string;
}

export interface PhieuXuat extends PhieuXuatTom {
  chi_nhanh_id: string;
  vi_tri_id: string;
  loai_vi_tri: string;
  vi_tri_den_id: string | null;
  ly_do_id: string | null;
  ghi_chu: string | null;
  anh: string[];
  ly_do_tu_choi: string | null;
  nguoi_duyet: string | null;
  duyet_luc: string | null;
  /** Phiếu trả hàng: phiếu nhập của lô được trả. */
  phieu_nhap_id: string | null;
  // Hàng đi đường (0032)
  yeu_cau_id: string | null;
  so_yeu_cau: string | null;
  nguoi_nhan: string | null;
  nhan_luc: string | null;
  tong_goi_nhan: number | null;
  tong_kg_nhan: number | null;
  xu_ly_thieu: 'tra_ve' | 'mat' | null;
  ly_do_xu_ly: string | null;
  nguoi_xu_ly: string | null;
  xu_ly_luc: string | null;
}

export interface DongXuat {
  thu_tu: number;
  mat_hang_id: string;
  lo_id: string | null;
  so_goi: number;
  so_kg: number;
  so_kg_do: number | null;
  /** Hàng đi đường: số quầy xác nhận đã nhận. null = chưa nhận / không đi đường. */
  so_goi_nhan: number | null;
  so_kg_nhan: number | null;
}

export interface DongSoCai {
  loai: string;
  lo_id: string;
  vi_tri_id: string;
  so_kg: number;
  so_goi: number;
  created_at: string;
}

// -----------------------------------------------------------------------------
// ĐỌC
// -----------------------------------------------------------------------------
export async function docDanhSachPhieuXuat(
  client: SupabaseClient, chiNhanhId: string,
  // trangThai nhiều giá trị: "Đang mang ra" gồm cả chuyến quầy nhận thiếu chờ quản lý xử lý.
  loc: { loai?: string | null; trangThai?: string | readonly string[] | null },
  // Có tim: tìm / lọc ngày / của tôi / đọc đúng một trang (lib/kho/tim-ds.ts).
  tim?: { tim: TimDs; nhanSuId: string | null },
): Promise<PhieuXuatTom[]> {
  let q = client
    .from('kho_v_phieu_xuat')
    .select('id, so_phieu, loai, trang_thai, ngay, ten_vi_tri, ten_vi_tri_den, ten_ly_do, so_dong, tong_goi, tong_kg, nguoi_tao, created_at')
    .eq('chi_nhanh_id', chiNhanhId)
    .order('created_at', { ascending: false });
  if (loc.loai) q = q.eq('loai', loc.loai);
  if (typeof loc.trangThai === 'string') q = q.eq('trang_thai', loc.trangThai);
  else if (loc.trangThai?.length) q = q.in('trang_thai', [...loc.trangThai]);
  q = tim
    ? apDungTim(q, tim.tim, { cotTim: ['so_phieu', 'ten_vi_tri', 'ten_vi_tri_den', 'ten_ly_do'], cotNgay: 'ngay', nhanSuId: tim.nhanSuId })
    : q.limit(150);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(r => ({ ...r, tong_kg: Number(r.tong_kg) })) as PhieuXuatTom[];
}

export async function demPhieuHuyCho(client: SupabaseClient, chiNhanhId: string): Promise<number | null> {
  const { count, error } = await client
    .from('kho_phieu_xuat').select('id', { count: 'exact', head: true })
    .eq('chi_nhanh_id', chiNhanhId).eq('trang_thai', 'cho_duyet');
  return error ? null : (count ?? 0);
}

export async function docPhieuXuat(
  client: SupabaseClient, id: string,
): Promise<{ phieu: PhieuXuat; dong: DongXuat[]; soCai: DongSoCai[] } | null> {
  if (!laUuid(id)) return null;
  const { data: phieu, error } = await client
    .from('kho_v_phieu_xuat')
    .select('id, chi_nhanh_id, so_phieu, loai, trang_thai, ngay, vi_tri_id, ten_vi_tri, loai_vi_tri, vi_tri_den_id, ten_vi_tri_den, ly_do_id, ten_ly_do, ghi_chu, anh, ly_do_tu_choi, nguoi_tao, nguoi_duyet, duyet_luc, created_at, so_dong, tong_goi, tong_kg, yeu_cau_id, so_yeu_cau, nguoi_nhan, nhan_luc, tong_goi_nhan, tong_kg_nhan, xu_ly_thieu, ly_do_xu_ly, nguoi_xu_ly, xu_ly_luc')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  if (!phieu) return null;

  const [{ data: dong, error: e1 }, { data: soCai, error: e2 }, { data: goc }] = await Promise.all([
    client.from('kho_phieu_xuat_dong').select('thu_tu, mat_hang_id, lo_id, so_goi, so_kg, so_kg_do, so_goi_nhan, so_kg_nhan')
      .eq('phieu_xuat_id', id).order('thu_tu'),
    client.from('kho_so_cai').select('loai, lo_id, vi_tri_id, so_kg, so_goi, created_at')
      .eq('chung_tu_id', id).order('created_at'),
    client.from('kho_phieu_xuat').select('phieu_nhap_id').eq('id', id).maybeSingle(),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return {
    phieu: {
      ...phieu, tong_kg: Number(phieu.tong_kg), anh: phieu.anh ?? [], phieu_nhap_id: goc?.phieu_nhap_id ?? null,
      tong_kg_nhan: phieu.tong_kg_nhan === null ? null : Number(phieu.tong_kg_nhan),
    } as PhieuXuat,
    dong: (dong ?? []).map(d => ({
      ...d, so_kg: Number(d.so_kg), so_kg_do: d.so_kg_do === null ? null : Number(d.so_kg_do),
      so_kg_nhan: d.so_kg_nhan === null ? null : Number(d.so_kg_nhan),
    })) as DongXuat[],
    soCai: (soCai ?? []).map(s => ({ ...s, so_kg: Number(s.so_kg) })) as DongSoCai[],
  };
}

// -----------------------------------------------------------------------------
// FORM → DỮ LIỆU (hàm thuần)
// -----------------------------------------------------------------------------
export interface DongXuatForm { mat_hang_id: string; so_goi: string; so_kg: string }
export interface DongLoForm { lo_id: string; mat_hang_id: string; so_goi: string; so_kg: string }

export interface KetQuaDocXuat {
  dong: DongXuatForm[];
  theoLo: DongLoForm[];
  loi: string[];
  payload: Record<string, unknown>[];
}

export function docFormPhieuXuat(form: FormData, matHang: { id: string; ten: string; dem_goi: boolean }[]): KetQuaDocXuat {
  const loi: string[] = [];
  const payload: Record<string, unknown>[] = [];
  const mh = new Map(matHang.map(m => [m.id, m]));

  const dong: DongXuatForm[] = [];
  const soDong = docSoNguyen(form.get('so_dong'), 0, 200) ?? 0;
  for (let i = 0; i < (Number.isNaN(soDong) ? 0 : soDong); i++) {
    const g = (ten: string) => String(form.get(`d${i}_${ten}`) ?? '').trim();
    const d: DongXuatForm = { mat_hang_id: g('mat_hang'), so_goi: g('so_goi'), so_kg: g('so_kg') };
    if (!d.mat_hang_id && !d.so_goi && !d.so_kg) continue;
    dong.push(d);
    const thu = dong.length;
    const m = mh.get(d.mat_hang_id);
    if (!laUuid(d.mat_hang_id) || !m) { loi.push(`Dòng ${thu}: chưa chọn mặt hàng`); continue; }
    const p = docDong(m, d.so_goi, d.so_kg, `Dòng ${thu} (${m.ten})`, loi);
    if (p) payload.push({ mat_hang_id: d.mat_hang_id, ...p });
  }

  const theoLo: DongLoForm[] = [];
  const soLo = docSoNguyen(form.get('so_lo'), 0, 500) ?? 0;
  for (let i = 0; i < (Number.isNaN(soLo) ? 0 : soLo); i++) {
    const g = (ten: string) => String(form.get(`l${i}_${ten}`) ?? '').trim();
    const l: DongLoForm = { lo_id: g('lo'), mat_hang_id: g('mat_hang'), so_goi: g('so_goi'), so_kg: g('so_kg') };
    theoLo.push(l);
    if (!l.so_goi && !l.so_kg) continue;
    const m = mh.get(l.mat_hang_id);
    if (!laUuid(l.lo_id) || !m) { loi.push('Một dòng lô không hợp lệ — tải lại trang'); continue; }
    const p = docDong(m, l.so_goi, l.so_kg, `Lô của "${m.ten}"`, loi);
    if (p) payload.push({ mat_hang_id: l.mat_hang_id, lo_id: l.lo_id, ...p });
  }

  // Cùng một món vừa ghi "theo mặt hàng" vừa ghi ở lô: database trừ CẢ HAI
  // (lô hạn gần nhất + lô đã chọn) — quét 2 gói rồi gõ thêm 2 ở lô là 4 gói
  // rời kho. Không đoán người dùng muốn chỗ nào: chặn và nói rõ.
  const coSo = (x: { so_goi: string; so_kg: string }) => !!(x.so_goi || x.so_kg);
  const theoMh = new Set(dong.filter(d => coSo(d) && mh.has(d.mat_hang_id)).map(d => d.mat_hang_id));
  const trung = new Set(theoLo.filter(l => coSo(l) && theoMh.has(l.mat_hang_id)).map(l => l.mat_hang_id));
  loi.unshift(...[...trung].map(id => `${mh.get(id)!.ten} được ghi ở cả hai phần — chỉ ghi một chỗ`));

  return { dong, theoLo, loi, payload };
}

function docDong(
  m: { dem_goi: boolean }, goiChu: string, kgChu: string, nhan: string, loi: string[],
): Record<string, unknown> | null {
  const goi = docSoNguyen(goiChu, 0, 100000);
  const kg = docKg(kgChu);
  if (Number.isNaN(goi)) { loi.push(`${nhan}: số gói là số nguyên`); return null; }
  if (Number.isNaN(kg) || (kg !== null && kg <= 0)) { loi.push(`${nhan}: số kg chưa đúng (ví dụ 1,25)`); return null; }
  if (m.dem_goi) {
    if (!goi) { loi.push(`${nhan}: chưa nhập số gói`); return null; }
    return kg !== null ? { so_goi: goi, so_kg: kg } : { so_goi: goi };
  }
  if (kg === null) { loi.push(`${nhan}: chưa nhập số kg`); return null; }
  return { so_kg: kg };
}

export interface KetQuaQuet {
  dong: DongXuatForm[];
  /** Câu cho nhân viên, chữ thường ngày — không có mã, không có "Cài đặt". */
  loi: string[];
  /** Tổng số mã trong ô quét. */
  soMa: number;
  /** Số nhãn đã thành dòng hàng. */
  soDoc: number;
  /** Nhãn không đọc được: mã hỏng, sai số kiểm tra, không phải nhãn cân. */
  soNhanHong: number;
  /** Gói đọc được mã nhưng mã cân chưa gắn với món nào. */
  soGoiLa: number;
  /** Các mã cân lạ — chỉ để hiện cho người sửa được danh mục. */
  maCanLa: string[];
}

/**
 * Đọc ô dán mã vạch → dòng theo mặt hàng (số gói, tổng kg). Mã cân không
 * khớp mặt hàng nào, mã hỏng → báo, không đoán. Câu báo viết cho nhân viên
 * quầy: đếm số nhãn hỏng, số gói lạ, và nói phải làm gì với gói đó.
 */
export function dongTuQuet(
  noiDung: string,
  matHang: { id: string; ten: string; ma_can: string | null; dang_dung: boolean }[],
  mau?: string | null,
  soLeKg = 3,
): KetQuaQuet {
  const ds = tachDanhSachMa(noiDung);
  const gom = gomTheoMaCan(ds, mau || undefined, soLeKg);
  const theoCan = new Map(matHang.filter(m => m.dang_dung && m.ma_can).map(m => [m.ma_can!, m]));
  const dong: DongXuatForm[] = [];
  const maCanLa: string[] = [];
  let soDoc = 0;
  let soGoiLa = 0;
  for (const [maCan, g] of gom.theoMa) {
    const m = theoCan.get(maCan);
    if (!m) { soGoiLa += g.soGoi; maCanLa.push(maCan); continue; }
    soDoc += g.soGoi;
    dong.push({
      mat_hang_id: m.id,
      so_goi: String(g.soGoi),
      so_kg: g.soKg > 0 ? String(g.soKg).replace('.', ',') : '',
    });
  }
  const soNhanHong = gom.loi.length;
  const loi: string[] = [];
  if (soNhanHong > 0) loi.push(`${soNhanHong} nhãn không đọc được — quét lại ${soNhanHong > 1 ? 'các gói' : 'gói'} đó`);
  if (soGoiLa > 0) loi.push(`${soGoiLa} gói không nhận ra món — để riêng, báo quản lý`);
  return { dong, loi, soMa: ds.length, soDoc, soNhanHong, soGoiLa, maCanLa };
}

/**
 * Tóm tắt hàng bằng chữ thường: "3 gói Thăn ngoại cắt lát (1,52 kg), 0,8 kg
 * Thịt vụn". Dùng cho câu báo sau khi quét và sau khi ghi phiếu. Cùng món ở
 * nhiều dòng thì cộng lại. Nhiều món quá thì "… và N món khác".
 */
export function tomTatHang(
  dong: { mat_hang_id?: unknown; so_goi?: unknown; so_kg?: unknown }[],
  matHang: { id: string; ten: string; dem_goi: boolean; don_vi_goi?: string | null }[],
  toiDa = 3,
): string {
  const mh = new Map(matHang.map(m => [m.id, m]));
  const so = (v: unknown, kg: boolean) => {
    const n = typeof v === 'number' ? v : kg ? docKg(v) : docSoNguyen(v, 0, 100000);
    return n === null || Number.isNaN(n) ? 0 : n;
  };
  const cong = new Map<string, { goi: number; gram: number }>();
  for (const d of dong) {
    const id = String(d.mat_hang_id ?? '');
    if (!mh.has(id)) continue;
    const c = cong.get(id) ?? { goi: 0, gram: 0 };
    c.goi += so(d.so_goi, false);
    c.gram += Math.round(so(d.so_kg, true) * 1000);
    cong.set(id, c);
  }
  const cau = [...cong].map(([id, c]) => {
    const m = mh.get(id)!;
    const kg = c.gram / 1000;
    if (m.dem_goi) return `${c.goi} ${m.don_vi_goi || 'gói'} ${m.ten}${kg > 0 ? ` (${dinhDangKg(kg)} kg)` : ''}`;
    return `${dinhDangKg(kg)} kg ${m.ten}`;
  });
  if (cau.length <= toiDa) return cau.join(', ');
  return `${cau.slice(0, toiDa).join(', ')} và ${cau.length - toiDa} món khác`;
}

/** Gộp dòng quét vào các dòng đang có: cùng mặt hàng thì cộng dồn. */
export function gopDong(cu: DongXuatForm[], moi: DongXuatForm[]): DongXuatForm[] {
  const ra = cu.filter(d => d.mat_hang_id || d.so_goi || d.so_kg).map(d => ({ ...d }));
  for (const d of moi) {
    const co = ra.find(x => x.mat_hang_id === d.mat_hang_id);
    if (!co) { ra.push({ ...d }); continue; }
    const goi = (docSoNguyen(co.so_goi, 0, 100000) || 0) + (docSoNguyen(d.so_goi, 0, 100000) || 0);
    const kgCu = docKg(co.so_kg), kgMoi = docKg(d.so_kg);
    co.so_goi = goi ? String(goi) : '';
    if (kgMoi !== null && !Number.isNaN(kgMoi)) {
      const tong = Math.round(((kgCu !== null && !Number.isNaN(kgCu) ? kgCu : 0) + kgMoi) * 1000) / 1000;
      co.so_kg = String(tong).replace('.', ',');
    }
  }
  return ra;
}

// -----------------------------------------------------------------------------
// GHI
// -----------------------------------------------------------------------------
export interface KetQuaXuat extends KetQua {
  id?: string;
  doc?: KetQuaDocXuat;
  /** Ảnh báo hủy đã lên kho file — trang giữ lại trong ô ẩn khi phải gửi lại. */
  anh?: string[];
}

// -----------------------------------------------------------------------------
// ẢNH BÁO HỦY — giữ qua các lần gửi
// -----------------------------------------------------------------------------
/** Phiếu báo hủy nhận tối đa 8 ảnh (kho_tao_phieu_xuat, 0023). */
const TOI_DA_ANH = 8;

/**
 * Ảnh cũ (ô ẩn) + tải ảnh vừa chọn. Gọi ở MỌI lần gửi của form báo hủy có
 * chọn ảnh — "Đọc mã", "Thêm dòng", ghi bị lỗi — vì ô chọn file không điền
 * lại được: không tải ngay thì ảnh mất. Số thứ tự nối tiếp ảnh cũ, không đè.
 */
export async function giuAnhHuy(
  client: SupabaseClient, chiNhanhId: string, form: FormData, maGui: string,
): Promise<{ duongDan: string[]; loi: string[] }> {
  const cu = docAnhDaTai(form, chiNhanhId, 'huy', maGui, TOI_DA_ANH);
  const tep = layTepAnh(form);
  if (tep.length === 0 || !laUuid(maGui)) return { duongDan: cu, loi: [] };
  const con = TOI_DA_ANH - cu.length;
  if (con <= 0) return { duongDan: cu, loi: [`Đã đủ ${TOI_DA_ANH} ảnh — ảnh mới không được thêm.`] };
  const batDau = soThuTuCuoi(cu) + 1;
  const tai = await taiAnh(client, chiNhanhId, 'huy', maGui, tep.slice(0, con), batDau);
  const loi = [...tai.loi];
  if (tep.length > con) loi.push(`Mỗi phiếu tối đa ${TOI_DA_ANH} ảnh — ${tep.length - con} ảnh sau bị bỏ qua.`);
  return { duongDan: [...cu, ...tai.duongDan], loi };
}

export async function taoPhieuXuat(
  client: SupabaseClient, chiNhanhId: string, form: FormData,
  ctx: {
    loai: LoaiXuat;
    viTriId: string;
    matHang: { id: string; ten: string; dem_goi: boolean; don_vi_goi?: string | null }[];
    /** Lý do đang dùng — để biết lý do nào cần ảnh TRƯỚC khi tải ảnh, gọi database. */
    lyDo?: { id: string; ten: string; can_anh: boolean }[];
    /** Nơi nhận của phiếu chuyển — để câu báo nói "ra Quầy thịt". */
    den?: { ten: string; loai: string } | null;
  },
): Promise<KetQuaXuat> {
  const doc = docFormPhieuXuat(form, ctx.matHang);
  const maGui = String(form.get('ma_gui') ?? '');
  if (!laUuid(maGui)) return { ok: false, cau: 'Form đã cũ — tải lại trang rồi nhập lại.', doc };
  const den = String(form.get('vi_tri_den_id') ?? '');
  const lyDo = String(form.get('ly_do_id') ?? '');
  const loi = [...doc.loi];

  let anh: string[] = [];
  let cauAnh = '';
  if (ctx.loai === 'huy') {
    // Kiểm lý do cần ảnh NGAY Ở ĐÂY, trước khi tải ảnh và gọi database: phiếu
    // chắc chắn bị từ chối thì báo luôn, bằng câu dễ hiểu.
    const ld = ctx.lyDo?.find(l => l.id === lyDo) ?? null;
    const coAnh = docAnhDaTai(form, chiNhanhId, 'huy', maGui, TOI_DA_ANH).length > 0 || layTepAnh(form).length > 0;
    if (!laUuid(lyDo)) loi.push('Chưa chọn lý do hủy');
    else if (ld?.can_anh && !coAnh) loi.push(`Lý do "${ld.ten}" cần ảnh chụp hàng — chụp ít nhất một ảnh`);
    // Có ảnh thì tải và giữ luôn, kể cả khi form còn lỗi — sửa lỗi xong không phải chụp lại.
    const tai = await giuAnhHuy(client, chiNhanhId, form, maGui);
    anh = tai.duongDan;
    if (tai.loi.length) cauAnh = ` Lưu ý ảnh: ${tai.loi.join(' · ')}`;
    if (ld?.can_anh && coAnh && anh.length === 0) loi.push(`Lý do "${ld.ten}" cần ảnh chụp hàng — ảnh chưa tải lên được, chụp lại`);
  }
  // Xuất khác: database bắt buộc lý do (0032) — báo trước bằng câu dễ hiểu.
  if (ctx.loai === 'xuat_khac' && !laUuid(lyDo)) loi.push('Chưa chọn lý do xuất (dùng nội bộ, tặng khách…)');
  if (loi.length) return { ok: false, cau: loi.join(' · ') + cauAnh, doc, anh };
  if (doc.payload.length === 0) {
    return { ok: false, cau: 'Chưa có dòng hàng nào — chọn mặt hàng hoặc ghi số gói ở lô cần lấy.' + cauAnh, doc, anh };
  }

  const { data, error } = await client.rpc('kho_tao_phieu_xuat', {
    p_chi_nhanh_id: chiNhanhId,
    p_ma_gui: maGui,
    p_loai: ctx.loai,
    p_vi_tri_id: ctx.viTriId,
    p_vi_tri_den_id: ctx.loai === 'chuyen' && laUuid(den) ? den : null,
    p_ly_do_id: laUuid(lyDo) ? lyDo : null,
    p_ghi_chu: String(form.get('ghi_chu') ?? '').trim() || null,
    p_anh: anh,
    p_dong: doc.payload,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) + cauAnh, doc, anh };
  const kq = (Array.isArray(data) ? data[0] : data) as { phieu_id: string; so_phieu: string; da_co: boolean } | undefined;
  if (!kq) return { ok: false, cau: 'Không chắc đã ghi hay chưa — xem danh sách phiếu để kiểm tra.', doc, anh };
  const hang = tomTatHang(doc.payload, ctx.matHang) || 'hàng';
  // Phiếu chuyển ra quầy có thể thành hàng đi đường (cài đặt + vai người lập
  // do database quyết) — đọc lại trạng thái để câu báo nói đúng.
  let diDuong = false;
  if (ctx.loai === 'chuyen' && !kq.da_co) {
    const { data: tt } = await client.from('kho_phieu_xuat').select('trang_thai').eq('id', kq.phieu_id).maybeSingle();
    diDuong = tt?.trang_thai === 'dang_chuyen';
  }
  const tenLyDo = ctx.lyDo?.find(l => l.id === lyDo)?.ten;
  const cau = kq.da_co
    ? `Phiếu ${kq.so_phieu} đã được ghi từ lần bấm trước.`
    : ctx.loai === 'huy'
      ? `Đã báo hủy ${hang} — hàng đã để riêng ở "Hàng chờ hủy", chờ quản lý duyệt.`
      : ctx.loai === 'xuat_bep'
        ? `Đã đưa bếp ${hang}.`
        : ctx.loai === 'xuat_khac'
          ? `Đã xuất ${hang}${tenLyDo ? ` (${tenLyDo})` : ''}.`
          : diDuong
            ? `Đang mang ${hang} ra ${ctx.den?.ten ?? 'quầy'} — quầy kiểm hàng rồi bấm "Đã nhận" thì hàng mới vào quầy.`
            : ctx.den
              ? `Đã chuyển ${hang} ${ctx.den.loai === 'quay' ? 'ra' : 'về'} ${ctx.den.ten}.`
              : `Đã chuyển ${hang}.`;
  return { ok: true, id: kq.phieu_id, cau: cau + cauAnh };
}

/**
 * Phiếu trả nhà cung cấp: nhà cung cấp của phiếu nhập gốc — để nút quay lại
 * đưa về trang công nợ của đúng nhà cung cấp đó. Vai không xem giá không đọc
 * được phiếu nhập (RLS) → null.
 */
export async function docNhaCungCapCuaPhieuNhap(client: SupabaseClient, phieuNhapId: string | null): Promise<string | null> {
  if (!laUuid(phieuNhapId)) return null;
  try {
    const { data } = await client.from('kho_phieu_nhap').select('nha_cung_cap_id').eq('id', phieuNhapId).maybeSingle();
    return (data?.nha_cung_cap_id as string | null | undefined) ?? null;
  } catch {
    return null;
  }
}

async function cauTraVe(ham: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<KetQua> {
  const { data, error } = await ham;
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: String(data ?? 'Xong.') };
}

export function duyetHuy(client: SupabaseClient, id: string) {
  return cauTraVe(client.rpc('kho_duyet_phieu_huy', { p_id: id }));
}
export function tuChoiHuy(client: SupabaseClient, id: string, lyDo: string) {
  return cauTraVe(client.rpc('kho_tu_choi_phieu_huy', { p_id: id, p_ly_do: lyDo }));
}

// -----------------------------------------------------------------------------
// HÀNG ĐI ĐƯỜNG — xử lý thiếu, hủy chuyến (0032)
// -----------------------------------------------------------------------------
/**
 * Quầy nhận thiếu → quản lý chọn: hàng còn ở kho thì trả về kho, rơi vỡ /
 * thất lạc thì ghi mất. Web bắt ghi lý do cả hai cách (database chỉ bắt khi
 * ghi mất) — sau này đọc lại còn biết vì sao.
 */
export function xuLyChuyenThieu(client: SupabaseClient, id: string, cach: 'tra_ve' | 'mat', lyDo: string) {
  if (!lyDo.trim()) return Promise.resolve<KetQua>({ ok: false, cau: 'Ghi lý do trước (vd. còn ở kho, rơi vỡ, thất lạc…)' });
  return cauTraVe(client.rpc('kho_xu_ly_chuyen_thieu', { p_id: id, p_cach: cach, p_ly_do: lyDo.trim() }));
}

/** Người lập (hoặc quản lý) hủy chuyến khi quầy chưa bấm nhận: hàng về lại chỗ cũ. */
export function huyChuyenDiDuong(client: SupabaseClient, id: string, lyDo: string) {
  return cauTraVe(client.rpc('kho_huy_chuyen', { p_id: id, p_ly_do: lyDo.trim() || null }));
}

/**
 * Nút nào hiện trên một phiếu chuyển đi đường (hàm thuần). Database vẫn kiểm
 * lại quyền — đây chỉ để không hiện nút mà bấm vào chắc chắn bị từ chối.
 *   · huyChuyen: phiếu đang mang ra, người xem là người lập hoặc có quyền duyệt.
 *   · xuLyThieu: phiếu nhận thiếu, người xem có quyền duyệt.
 *   · diNhan:    phiếu đang mang ra, người xem không phải người lập (thường là
 *                NV quầy) — chỉ đường sang màn Nhận hàng.
 */
export function nutPhieuChuyen(
  p: { loai: string; trang_thai: string; nguoi_tao: string | null },
  nguoiXem: { id: string | null; duyet: boolean; vanHanh: boolean },
): { huyChuyen: boolean; xuLyThieu: boolean; diNhan: boolean } {
  if (p.loai !== 'chuyen') return { huyChuyen: false, xuLyThieu: false, diNhan: false };
  const laNguoiLap = !!nguoiXem.id && nguoiXem.id === p.nguoi_tao;
  const dangMang = p.trang_thai === 'dang_chuyen';
  return {
    huyChuyen: dangMang && nguoiXem.vanHanh && (laNguoiLap || nguoiXem.duyet),
    xuLyThieu: p.trang_thai === 'nhan_thieu' && nguoiXem.duyet,
    diNhan: dangMang && nguoiXem.vanHanh && !laNguoiLap,
  };
}

// -----------------------------------------------------------------------------
// BÁO HỦY 3 BƯỚC — hàm thuần
// -----------------------------------------------------------------------------
export type BuocHuy = 'hang' | 'ly_do' | 'anh';

/**
 * Sau một lần gửi form báo hủy, hiện bước nào.
 *   viec: quet | them_dong | them_mh | buoc_hang   → ở lại / quay về bước Hàng
 *         buoc_ly_do                                → sang bước Lý do (nếu hàng ổn)
 *         chon_ly_do                                → sang bước Ảnh (nếu đã có lý do)
 *         ghi (bị từ chối)                          → về đúng bước còn thiếu
 * hangXong: đã có ít nhất một dòng hàng và không dòng nào lỗi.
 * Luôn lùi về bước sớm nhất còn thiếu — không để người dùng ở bước Ảnh khi
 * chưa có hàng.
 */
export function buocHuySau(viec: string, t: { hangXong: boolean; coLyDo: boolean }): BuocHuy {
  if (viec === 'quet' || viec === 'them_dong' || viec === 'them_mh' || viec === 'buoc_hang' || !t.hangXong) return 'hang';
  if (viec === 'buoc_ly_do' || !t.coLyDo) return 'ly_do';
  return 'anh';
}

// -----------------------------------------------------------------------------
// XUẤT BẾP NHANH — món hay dùng
// -----------------------------------------------------------------------------
/**
 * Các món hay đưa bếp nhất (hàm thuần): đếm số PHIẾU có món đó (một phiếu ghi
 * món hai dòng vẫn tính một), nhiều lần hơn đứng trước; bằng nhau thì món
 * dùng gần đây hơn đứng trước. dong: dòng của các phiếu, phiếu mới nhất trước.
 */
export function monHayDung(dong: { phieu_id: string; mat_hang_id: string }[], toiDa = 6): string[] {
  const dem = new Map<string, { lan: Set<string>; thuTu: number }>();
  dong.forEach((d, i) => {
    const c = dem.get(d.mat_hang_id) ?? { lan: new Set<string>(), thuTu: i };
    c.lan.add(d.phieu_id);
    dem.set(d.mat_hang_id, c);
  });
  return [...dem]
    .sort(([, a], [, b]) => b.lan.size - a.lan.size || a.thuTu - b.thuTu)
    .slice(0, toiDa)
    .map(([id]) => id);
}

/** 6 món hay đưa bếp nhất trong 40 phiếu xuất bếp gần đây của chi nhánh. Lỗi đọc → không có nút nhanh. */
export async function docMonHayDungBep(client: SupabaseClient, chiNhanhId: string, toiDa = 6): Promise<string[]> {
  try {
    const { data: phieu } = await client
      .from('kho_phieu_xuat').select('id')
      .eq('chi_nhanh_id', chiNhanhId).eq('loai', 'xuat_bep')
      .order('created_at', { ascending: false }).limit(40);
    const ids = (phieu ?? []).map(p => p.id as string);
    if (ids.length === 0) return [];
    const { data: dong } = await client
      .from('kho_phieu_xuat_dong').select('phieu_xuat_id, mat_hang_id')
      .in('phieu_xuat_id', ids);
    const thuTu = new Map(ids.map((id, i) => [id, i]));
    const ds = (dong ?? [])
      .map(d => ({ phieu_id: d.phieu_xuat_id as string, mat_hang_id: d.mat_hang_id as string }))
      .sort((a, b) => (thuTu.get(a.phieu_id) ?? 0) - (thuTu.get(b.phieu_id) ?? 0));
    return monHayDung(ds, toiDa);
  } catch {
    return [];
  }
}
