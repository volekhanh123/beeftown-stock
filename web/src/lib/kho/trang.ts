/**
 * KHO — KHUNG CHUNG CỦA MỌI TRANG /noi-bo/kho
 *
 * Mỗi trang kho mở đầu bằng moTrangKho(Astro): lấy phiên đăng nhập, chọn chi
 * nhánh đang làm việc, biết kho đã khởi tạo chưa, và đọc câu báo từ lần
 * chuyển hướng trước.
 *
 * Chi nhánh: nhân sự thường làm ở đúng chi nhánh của mình. Chủ nhà hàng không
 * gắn chi nhánh nào — mặc định chi nhánh đầu tiên, đổi được bằng ?cn=<mã>
 * (nhớ bằng cookie). Hiện chỉ có một quán nên chủ sẽ không phải chọn.
 *
 * Quyền ở đây chỉ để ẩn nút. Database (kho_cn_duoc, kho_duoc) mới là nơi chặn.
 */

import type { AstroGlobal } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { NhanSu } from '../phien';
import { duoc as vaiDuoc, cauLoiKho, type KetQua, type ViecKho } from './chung.ts';
import { docBao, ghiBao } from './bao.ts';

export interface ChiNhanhKho { id: string; ma: string; ten: string }

export interface TrangKho {
  client: SupabaseClient;
  nhanSu: NhanSu;
  chiNhanh: ChiNhanhKho | null;
  cacChiNhanh: ChiNhanhKho[];
  /** Chi nhánh đã bấm "Bắt đầu dùng kho" chưa (có dòng kho_cai_dat). */
  daKhoiTao: boolean;
  loiDoc: string | null;
  /** Câu báo từ lần chuyển hướng trước, nếu có. */
  bao: KetQua | null;
  duoc: (viec: ViecKho) => boolean;
}

const COOKIE_CN = 'bt_kho_cn';

export async function moTrangKho(Astro: AstroGlobal): Promise<TrangKho | Response> {
  const phien = Astro.locals.phien;
  if (!phien) return Astro.redirect('/noi-bo/dang-nhap', 302);
  const { client, nhanSu } = phien;

  // Thu ngân, marketing: không dùng kho. Trả về trang chủ nội bộ thay vì một
  // trang toàn ô trống.
  if (!vaiDuoc(nhanSu.vai_tro, 'xem')) return Astro.redirect('/noi-bo', 302);

  let cacChiNhanh: ChiNhanhKho[] = [];
  let loiDoc: string | null = null;
  try {
    const { data, error } = await client.from('chi_nhanh').select('id, ma, ten').order('ma');
    if (error) throw error;
    cacChiNhanh = (data ?? []) as ChiNhanhKho[];
  } catch (e) {
    loiDoc = cauLoiKho(e, 'Không đọc được danh sách chi nhánh.');
  }

  let chiNhanh: ChiNhanhKho | null = null;
  if (nhanSu.chi_nhanh_id) {
    chiNhanh = cacChiNhanh.find(c => c.id === nhanSu.chi_nhanh_id) ?? null;
  } else {
    const thamSo = Astro.url.searchParams.get('cn');
    const chon = thamSo ?? Astro.cookies.get(COOKIE_CN)?.value;
    chiNhanh = cacChiNhanh.find(c => c.ma === chon) ?? cacChiNhanh[0] ?? null;
    if (thamSo && chiNhanh) {
      Astro.cookies.set(COOKIE_CN, chiNhanh.ma, {
        httpOnly: true, secure: import.meta.env.PROD, sameSite: 'lax',
        path: '/noi-bo/kho', maxAge: 60 * 60 * 24 * 60,
      });
    }
  }

  let daKhoiTao = false;
  if (chiNhanh) {
    try {
      const { data } = await client
        .from('kho_cai_dat').select('chi_nhanh_id').eq('chi_nhanh_id', chiNhanh.id).maybeSingle();
      daKhoiTao = !!data;
    } catch { /* coi như chưa khởi tạo — trang sẽ hiện nút khởi tạo */ }
  }

  return {
    client, nhanSu, chiNhanh, cacChiNhanh, daKhoiTao, loiDoc,
    bao: docBao(Astro.cookies),
    duoc: (viec: ViecKho) => vaiDuoc(nhanSu.vai_tro, viec),
  };
}

/** Đọc form gửi lên. Mạng đứt giữa chừng thì trả null thay vì ném lỗi. */
export async function docFormGui(Astro: AstroGlobal): Promise<FormData | null> {
  if (Astro.request.method !== 'POST') return null;
  try { return await Astro.request.formData(); } catch { return null; }
}

/** Ghi câu báo rồi chuyển hướng 303 sang GET — F5 không gửi lại lệnh cũ. */
export function chuyenHuong(Astro: AstroGlobal, url: string, bao: KetQua): Response {
  ghiBao(Astro.cookies, bao);
  return Astro.redirect(url, 303);
}

/** Họ tên người lập / duyệt chứng từ. Không đọc được thì trả Map rỗng. */
export async function tenNhanSu(client: SupabaseClient, ids: (string | null | undefined)[]): Promise<Map<string, string>> {
  const ds = [...new Set(ids.filter((x): x is string => !!x))];
  const ra = new Map<string, string>();
  if (ds.length === 0) return ra;
  try {
    const { data } = await client.rpc('kho_ten_nhan_su', { p_ids: ds });
    for (const r of (data ?? []) as { id: string; ho_ten: string }[]) ra.set(r.id, r.ho_ten);
  } catch { /* tên chỉ để hiển thị — thiếu thì hiện "—" */ }
  return ra;
}

/** Khởi tạo kho cho chi nhánh (ba vị trí, cài đặt, lý do mặc định). */
export async function khoiTaoKho(client: SupabaseClient, chiNhanhId: string): Promise<KetQua> {
  const { data, error } = await client.rpc('kho_khoi_tao', { p_chi_nhanh_id: chiNhanhId });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: Number(data) > 0
    ? 'Đã bắt đầu dùng kho: tạo Kho lạnh, Quầy thịt, chỗ Hàng chờ hủy và các lý do mặc định. Đổi tên được trong Cài đặt kho.'
    : 'Kho đã được khởi tạo từ trước — không có gì cần tạo thêm.' };
}
