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
 *
 * Máy tính bảng dùng chung (GĐ5d, lib/kho/may-chung.ts): kiểm TRƯỚC mọi thứ
 * khác — quá giờ thì khóa máy và chuyển về /noi-bo/kho/may (POST quá ân hạn:
 * "phiếu chưa được ghi"). Tài khoản máy (vai may_*) chỉ vào được
 * /noi-bo/kho/may/*: trang kho khác chuyển về đó, không đọc gì thêm.
 */

import type { APIContext, AstroGlobal } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { NhanSu } from '../phien';
import { duoc as vaiDuoc, cauLoiKho, kqHai, kqLoi, type KetQua, type ViecKho, type HaiThuTieng, type NgonNguNB } from './chung.ts';
import { docBao, ghiBao } from './bao.ts';
import type { SoViec } from './dieu-huong.ts';
import { kiemMayChung, laVaiMay, laDuongMay, DUONG_MAY, type CheDoMay } from './may-chung.ts';

export interface ChiNhanhKho { id: string; ma: string; ten: string }

export interface TrangKho {
  client: SupabaseClient;
  nhanSu: NhanSu;
  chiNhanh: ChiNhanhKho | null;
  cacChiNhanh: ChiNhanhKho[];
  /** Chi nhánh đã bấm "Bắt đầu dùng kho" chưa (có dòng kho_cai_dat). */
  daKhoiTao: boolean;
  /** Số đỏ trên menu (kho_dem_viec, 0030). null = chưa đọc được — menu hiện không có số. */
  viec: SoViec | null;
  loiDoc: string | null;
  /** Câu báo từ lần chuyển hướng trước, nếu có. */
  bao: KetQua | null;
  duoc: (viec: ViecKho) => boolean;
  /** Đang ở máy tính bảng dùng chung (GĐ5d). null = máy thường. */
  may: CheDoMay | null;
  /** Ngôn ngữ giao diện của lượt xem (cookie nb_ngon_ngu, middleware đặt). */
  nn: NgonNguNB;
}

const CAU_TRANG = {
  docChiNhanh: { vi: 'Không đọc được danh sách chi nhánh.', en: 'Could not read the list of branches.' },
  docCaiDat: {
    vi: 'Không đọc được cài đặt kho — mạng có thể đang chập. Tải lại trang sau ít giây.',
    en: 'Could not read the stock settings — the connection may be unstable. Reload the page in a few seconds.',
  },
  khoiTaoXong: {
    vi: 'Đã bắt đầu dùng kho: tạo Kho lạnh, Quầy thịt, chỗ Hàng chờ hủy và các lý do mặc định. Đổi tên được trong Thiết lập kho.',
    en: 'Stock is ready: created the Cold store, the Meat counter, an Awaiting write-off area and the default reasons. You can rename them in Stock setup.',
  },
  khoiTaoRoi: {
    vi: 'Kho đã được khởi tạo từ trước — không có gì cần tạo thêm.',
    en: 'Stock was already set up — nothing more to create.',
  },
} satisfies Record<string, HaiThuTieng>;

const COOKIE_CN = 'bt_kho_cn';

export async function moTrangKho(Astro: AstroGlobal): Promise<TrangKho | Response> {
  const phien = Astro.locals.phien;
  if (!phien) return Astro.redirect('/noi-bo/dang-nhap', 302);
  const { client, nhanSu } = phien;
  const nn: NgonNguNB = Astro.locals.nn ?? 'vi';

  // Máy dùng chung: tự khóa khi quá giờ, dời mốc hoạt động khi còn giờ.
  const may = await kiemMayChung(Astro, nhanSu);
  if (may instanceof Response) return may;

  // Tài khoản máy không đọc được gì trong kho — chỉ màn "Ai đang dùng máy?".
  if (laVaiMay(nhanSu.vai_tro)) {
    if (!laDuongMay(Astro.url.pathname)) return Astro.redirect(DUONG_MAY, 302);
    return {
      client, nhanSu, chiNhanh: null, cacChiNhanh: [], daKhoiTao: false, viec: null, loiDoc: null,
      bao: docBao(Astro.cookies), duoc: (viec: ViecKho) => vaiDuoc(nhanSu.vai_tro, viec), may, nn,
    };
  }

  // Thu ngân, marketing: không dùng kho. Trả về trang chủ nội bộ thay vì một
  // trang toàn ô trống.
  if (!vaiDuoc(nhanSu.vai_tro, 'xem')) return Astro.redirect('/noi-bo', 302);

  let cacChiNhanh: ChiNhanhKho[] = [];
  let loiDoc: string | null = null;
  const docChiNhanh = async () => {
    try {
      const { data, error } = await client.from('chi_nhanh').select('id, ma, ten').order('ma');
      if (error) throw error;
      cacChiNhanh = (data ?? []) as ChiNhanhKho[];
    } catch (e) {
      loiDoc = cauLoiKho(e, CAU_TRANG.docChiNhanh[nn]);
    }
  };

  // Số đỏ trên menu và "đã khởi tạo kho chưa" cùng một lần gọi (kho_dem_viec).
  // Nhân sự thường đã biết chi nhánh của mình, nên chạy SONG SONG với việc đọc
  // danh sách chi nhánh — không thêm lượt chờ nào so với trước.
  let viec: SoViec | null = null;
  const docViec = async (cn: string) => {
    try {
      const { data, error } = await client.rpc('kho_dem_viec', { p_chi_nhanh_id: cn });
      if (!error && data && typeof data === 'object') viec = data as SoViec;
    } catch { /* số đỏ chỉ để nhắc — thiếu thì menu không có số */ }
  };

  let chiNhanh: ChiNhanhKho | null = null;
  if (nhanSu.chi_nhanh_id) {
    await Promise.all([docChiNhanh(), docViec(nhanSu.chi_nhanh_id)]);
    chiNhanh = cacChiNhanh.find(c => c.id === nhanSu.chi_nhanh_id) ?? null;
  } else {
    await docChiNhanh();
    const thamSo = Astro.url.searchParams.get('cn');
    const chon = thamSo ?? Astro.cookies.get(COOKIE_CN)?.value;
    chiNhanh = cacChiNhanh.find(c => c.ma === chon) ?? cacChiNhanh[0] ?? null;
    if (thamSo && chiNhanh) {
      Astro.cookies.set(COOKIE_CN, chiNhanh.ma, {
        httpOnly: true, secure: import.meta.env.PROD, sameSite: 'lax',
        path: '/noi-bo/kho', maxAge: 60 * 60 * 24 * 60,
      });
    }
    if (chiNhanh) await docViec(chiNhanh.id);
  }

  let daKhoiTao = !!chiNhanh && (viec as SoViec | null)?.khoi_tao === true;
  if (chiNhanh && viec === null) {
    // kho_dem_viec không trả lời (database chưa chạy 0030, mạng chập chờn):
    // hỏi thẳng bảng cài đặt như trước, để trang không đòi "Bắt đầu dùng kho" lần nữa.
    try {
      const { data, error } = await client
        .from('kho_cai_dat').select('chi_nhanh_id').eq('chi_nhanh_id', chiNhanh.id).maybeSingle();
      if (error) throw error;
      daKhoiTao = !!data;
    } catch {
      // Cả hai lần hỏi đều lỗi: KHÔNG kết luận "chưa khởi tạo" — trang sẽ mời "Bắt đầu dùng kho" và
      // nhap/[id] chuyển hướng bỏ mất form đang gõ. Báo lỗi đọc; trang đọc tiếp và tự báo lỗi của nó.
      daKhoiTao = true;
      loiDoc ??= CAU_TRANG.docCaiDat[nn];
    }
  }

  return {
    client, nhanSu, chiNhanh, cacChiNhanh, daKhoiTao, viec, loiDoc,
    bao: docBao(Astro.cookies),
    duoc: (viec: ViecKho) => vaiDuoc(nhanSu.vai_tro, viec),
    may,
    nn,
  };
}

const CAU_TAI = {
  chuaDangNhap: { vi: 'Chưa đăng nhập', en: 'Not logged in' },
  khongXemKho: { vi: 'Tài khoản không xem được kho', en: 'This account cannot view inventory' },
  docChiNhanh: {
    vi: 'Không đọc được danh sách chi nhánh — mạng có thể đang chập. Thử tải lại sau ít giây.',
    en: 'Could not read the list of branches — the connection may be unstable. Try downloading again in a few seconds.',
  },
  chuaCoCn: { vi: 'Chưa có chi nhánh', en: 'No branch yet' },
} satisfies Record<string, HaiThuTieng>;

export interface KhoTai { client: SupabaseClient; nhanSu: NhanSu; chiNhanh: ChiNhanhKho; nn: NgonNguNB }

/**
 * Mở một đường TẢI FILE của kho (pages/noi-bo/kho/**\/*.csv.ts) — phần moTrangKho làm cho trang: phiên, tự khóa
 * máy tính bảng dùng chung (quá giờ thì khóa và chuyển về màn khóa — không tải số liệu dưới tên người trước), vai
 * máy về màn máy, chi nhánh (cùng cách chọn, kể cả ?cn=). Đọc chi nhánh lỗi → 503, không phải "chưa có chi nhánh".
 * Quyền xem từng file (xem_gia, ke_toan…) route tự kiểm sau đó; database (RLS) vẫn là nơi chặn.
 */
export async function moKhoTai(ctx: APIContext): Promise<KhoTai | Response> {
  const nn: NgonNguNB = ctx.locals.nn ?? 'vi';
  const phien = ctx.locals.phien;
  if (!phien) return new Response(CAU_TAI.chuaDangNhap[nn], { status: 401 });
  const { client, nhanSu } = phien;

  // kiemMayChung viết cho trang (Astro.response.headers); đường tải đã tự đặt cache-control: no-store.
  const may = await kiemMayChung({ ...ctx, response: { headers: new Headers() } } as unknown as AstroGlobal, nhanSu);
  if (may instanceof Response) return may;
  if (laVaiMay(nhanSu.vai_tro)) return ctx.redirect(DUONG_MAY, 302);
  if (!vaiDuoc(nhanSu.vai_tro, 'xem')) return new Response(CAU_TAI.khongXemKho[nn], { status: 403 });

  const { data, error } = await client.from('chi_nhanh').select('id, ma, ten').order('ma');
  if (error) return new Response(CAU_TAI.docChiNhanh[nn], { status: 503 });
  const cacCn = (data ?? []) as ChiNhanhKho[];
  const chon = ctx.url.searchParams.get('cn') ?? ctx.cookies.get(COOKIE_CN)?.value;
  const chiNhanh = nhanSu.chi_nhanh_id
    ? cacCn.find(c => c.id === nhanSu.chi_nhanh_id)
    : cacCn.find(c => c.ma === chon) ?? cacCn[0];
  if (!chiNhanh) return new Response(CAU_TAI.chuaCoCn[nn], { status: 404 });
  return { client, nhanSu, chiNhanh, nn };
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
  if (error) return kqLoi(error);
  return kqHai(true, Number(data) > 0 ? CAU_TRANG.khoiTaoXong : CAU_TRANG.khoiTaoRoi);
}
