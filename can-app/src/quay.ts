/**
 * BEEFTOWN CÂN — MÁY QUẦY (0054): phần tính cho thẻ Quầy (cả Tảng & ô mã ở
 * cuối thẻ — 2.11), Giảm giá, Báo cáo. Hàm thuần — kiểm thử bằng test/thu.ts.
 *
 * Dữ liệu lấy từ kho bằng một lần gọi mỗi mục (kho_bang_quay, kho_can_o_ma,
 * kho_bao_cao_ban_gio, kho_bao_cao_tang); ở đây chỉ gộp, xếp, gợi ý:
 *   · Quầy: việc cần làm ngay — gói HẾT HẠN phải huỷ; gói CẬN DATE thì cân
 *     lại bằng mã giảm (nếu món có) và xếp ra trước; món DƯỚI MỨC thì gửi yêu
 *     cầu lấy hàng. Rồi tồn quầy từng món.
 *   · Tảng & ô: mỗi ô đang giữ tảng nào, bán được bao nhiêu phần trăm, cân đã
 *     đổi tên theo tảng chưa (so tên trên cân với tên kho muốn).
 *   · Báo cáo: gộp theo ngày / giờ / món, phần bán giảm giá.
 */
import { tenTheoTang } from '../../web/src/lib/kho/danh-muc-can.ts';
import { chuanTenCan } from '../../web/src/lib/kho/can-tma.ts';
import { giaGiam, tenGiam } from '../../web/src/lib/kho/ma-giam.ts';
import { soTangChu } from '../../web/src/lib/kho/tang.ts';

// -----------------------------------------------------------------------------
// DỮ LIỆU TỪ KHO (hình dạng jsonb của kho_bang_quay — 0054)
// -----------------------------------------------------------------------------
export type TinhTrangHan = 'het_han' | 'sap_het' | 'con_han';
export interface LoQuay {
  lo_id: string; ma_lo: string; mat_hang_id: string; vi_tri_id: string;
  so_goi: number; so_kg: number; han_dung: string | null; so_ngay_con: number | null;
  tinh_trang: TinhTrangHan; ngay_dong_goi: string | null; so_tang: number | null;
}
export interface MonQuay {
  id: string; ma: string; ten: string; nhom: string | null; loai: string; dem_goi: boolean;
  don_vi_goi: string | null; ma_can: string | null; gia_ban_kg: number | null;
  quay_toi_thieu_goi: number | null; quay_toi_da_goi: number | null; ton_toi_thieu_kg: number | null;
}
export interface GoiYQuay {
  mat_hang_id: string; so_goi_quay: number; so_kg_quay: number; so_goi_dang_mang: number;
  so_goi_kho: number; so_kg_kho: number; so_goi_de_nghi: number | null; so_kg_de_nghi: number | null;
}
export interface MaGiamQuay { id: string; mat_hang_id: string; phan_tram: number; ma_can: string; gia_giam_kg: number | null }
export interface YeuCauQuay {
  id: string; so_phieu: string; trang_thai: string; created_at: string; ghi_chu: string | null; nguoi: string | null;
  dong: { ten: string; so_goi: number; so_kg: number | null; don_vi_goi: string | null }[];
}
export interface BangQuay {
  hom_nay: string;
  canh_bao_truoc_ngay: number;
  vi_tri: { id: string; ten: string }[];
  lo: LoQuay[];
  mon: MonQuay[];
  goi_y: GoiYQuay[];
  ma_giam: MaGiamQuay[];
  yeu_cau: YeuCauQuay[];
  dang_mang: { id: string; so_phieu: string; created_at: string; so_goi: number }[];
  cho_duyet_huy: { id: string; so_phieu: string; created_at: string; ghi_chu: string | null }[];
  ly_do_huy: { id: string; ten: string; can_anh: boolean }[];
}

// -----------------------------------------------------------------------------
// THẺ QUẦY
// -----------------------------------------------------------------------------
export interface LoCanXuLy {
  lo_id: string; ma_lo: string; mat_hang_id: string; ten: string; vi_tri_id: string;
  so_goi: number; so_kg: number; han_dung: string | null; so_ngay_con: number | null;
  so_tang: string; dem_goi: boolean; don_vi_goi: string;
  /** Có lô khác cùng món còn hạn xa hơn ở quầy → xếp lô này ra trước. */
  xepTruoc: boolean;
  /** Mã giảm của món (chỉ với gói cận date); plu = số PLU trên cân nếu đã lên cân. */
  maGiam: { ma_can: string; phan_tram: number; gia_giam_kg: number | null; plu?: number | null }[];
}
export interface MonCanLay {
  mat_hang_id: string; ten: string; dem_goi: boolean; don_vi_goi: string;
  soQuay: number; kgQuay: number; dangMang: number; khoCon: number; kgKho: number;
  toiThieu: number | null; deNghi: number | null; deNghiKg: number | null;
}
export type TinhTrangMon = 'het' | 'duoi_muc' | 'co_het_han' | 'du';
export interface TonMon {
  mat_hang_id: string; ten: string; nhom: string | null; ma_can: string | null; dem_goi: boolean; don_vi_goi: string;
  soGoi: number; soKg: number; soLo: number; hanGanNhat: string | null; soNgayCon: number | null;
  toiThieu: number | null; tinhTrang: TinhTrangMon; soGoiHetHan: number;
}
export interface XemQuay {
  homNay: string;
  viTri: { id: string; ten: string }[];
  hetHan: LoCanXuLy[];
  canDate: LoCanXuLy[];
  canLay: MonCanLay[];
  ton: TonMon[];
  yeuCau: YeuCauQuay[];
  dangMang: BangQuay['dang_mang'];
  choDuyetHuy: BangQuay['cho_duyet_huy'];
  lyDoHuy: BangQuay['ly_do_huy'];
  dem: { hetHan: number; canDate: number; canLay: number; yeuCau: number };
}

const so = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

export function tomTatQuay(b: BangQuay): XemQuay {
  const mon = new Map(b.mon.map(m => [m.id, m]));
  const tenMon = (id: string) => mon.get(id)?.ten ?? '(món đã ngừng)';
  const dvi = (id: string) => mon.get(id)?.don_vi_goi || 'gói';
  const giamCua = new Map<string, MaGiamQuay[]>();
  for (const g of b.ma_giam) giamCua.set(g.mat_hang_id, [...(giamCua.get(g.mat_hang_id) ?? []), g]);

  // Hạn xa nhất còn hạn ở quầy của mỗi món — để biết lô nào nên xếp trước.
  const hanXaNhat = new Map<string, string>();
  for (const l of b.lo) {
    if (l.tinh_trang === 'het_han' || !l.han_dung) continue;
    const c = hanXaNhat.get(l.mat_hang_id);
    if (!c || l.han_dung > c) hanXaNhat.set(l.mat_hang_id, l.han_dung);
  }
  const lo = (l: LoQuay, coGiam: boolean): LoCanXuLy => ({
    lo_id: l.lo_id, ma_lo: l.ma_lo, mat_hang_id: l.mat_hang_id, ten: tenMon(l.mat_hang_id), vi_tri_id: l.vi_tri_id,
    so_goi: so(l.so_goi), so_kg: so(l.so_kg), han_dung: l.han_dung, so_ngay_con: l.so_ngay_con === null ? null : so(l.so_ngay_con),
    so_tang: soTangChu(l.so_tang), dem_goi: mon.get(l.mat_hang_id)?.dem_goi ?? true, don_vi_goi: dvi(l.mat_hang_id),
    xepTruoc: !!l.han_dung && (hanXaNhat.get(l.mat_hang_id) ?? '') > l.han_dung,
    maGiam: coGiam ? (giamCua.get(l.mat_hang_id) ?? []).map(g => ({ ma_can: g.ma_can, phan_tram: g.phan_tram, gia_giam_kg: g.gia_giam_kg })) : [],
  });
  const hetHan = b.lo.filter(l => l.tinh_trang === 'het_han').map(l => lo(l, false));
  const canDate = b.lo.filter(l => l.tinh_trang === 'sap_het').map(l => lo(l, true))
    .sort((x, y) => (x.so_ngay_con ?? 99) - (y.so_ngay_con ?? 99) || x.ten.localeCompare(y.ten, 'vi'));

  const canLay: MonCanLay[] = b.goi_y.map(g => {
    const m = mon.get(g.mat_hang_id);
    return {
      mat_hang_id: g.mat_hang_id, ten: tenMon(g.mat_hang_id), dem_goi: m?.dem_goi ?? true, don_vi_goi: dvi(g.mat_hang_id),
      soQuay: so(g.so_goi_quay), kgQuay: so(g.so_kg_quay), dangMang: so(g.so_goi_dang_mang),
      khoCon: so(g.so_goi_kho), kgKho: so(g.so_kg_kho),
      toiThieu: m?.quay_toi_thieu_goi ?? null,
      deNghi: g.so_goi_de_nghi === null ? null : so(g.so_goi_de_nghi),
      deNghiKg: g.so_kg_de_nghi === null ? null : so(g.so_kg_de_nghi),
    };
  }).sort((x, y) => x.ten.localeCompare(y.ten, 'vi'));
  const duoiMuc = new Set(canLay.map(c => c.mat_hang_id));

  const ton: TonMon[] = b.mon.map(m => {
    const cac = b.lo.filter(l => l.mat_hang_id === m.id);
    const conHan = cac.filter(l => l.tinh_trang !== 'het_han');
    const soGoi = conHan.reduce((s, l) => s + so(l.so_goi), 0);
    const soKg = conHan.reduce((s, l) => s + so(l.so_kg), 0);
    const gan = conHan.filter(l => l.han_dung).sort((x, y) => (x.han_dung! < y.han_dung! ? -1 : 1))[0];
    const soGoiHetHan = cac.filter(l => l.tinh_trang === 'het_han').reduce((s, l) => s + so(l.so_goi), 0);
    const tinhTrang: TinhTrangMon = soGoiHetHan > 0 ? 'co_het_han'
      : soGoi === 0 && soKg === 0 ? 'het'
      : duoiMuc.has(m.id) ? 'duoi_muc' : 'du';
    return {
      mat_hang_id: m.id, ten: m.ten, nhom: m.nhom, ma_can: m.ma_can, dem_goi: m.dem_goi, don_vi_goi: m.don_vi_goi || 'gói',
      soGoi, soKg: Math.round(soKg * 1000) / 1000, soLo: conHan.length, hanGanNhat: gan?.han_dung ?? null,
      soNgayCon: gan?.so_ngay_con === null || gan?.so_ngay_con === undefined ? null : so(gan.so_ngay_con),
      toiThieu: m.quay_toi_thieu_goi, tinhTrang, soGoiHetHan,
    };
  });

  return {
    homNay: b.hom_nay, viTri: b.vi_tri, hetHan, canDate, canLay, ton,
    yeuCau: b.yeu_cau, dangMang: b.dang_mang, choDuyetHuy: b.cho_duyet_huy, lyDoHuy: b.ly_do_huy,
    dem: { hetHan: hetHan.length, canDate: canDate.length, canLay: canLay.length, yeuCau: b.yeu_cau.length },
  };
}

/** Dòng gửi cho kho_tao_yeu_cau / kho_tao_phieu_xuat — kiểm số trước khi gọi kho. */
export class LoiQuay extends Error {}

export function dongYeuCau(ds: unknown, monCo: Map<string, { dem_goi: boolean; ten: string }>): { mat_hang_id: string; so_goi?: number; so_kg?: number }[] {
  if (!Array.isArray(ds) || ds.length === 0) throw new LoiQuay('Chưa chọn món nào để lấy thêm.');
  const ra: { mat_hang_id: string; so_goi?: number; so_kg?: number }[] = [];
  for (const d of ds as Record<string, unknown>[]) {
    const id = String(d.mat_hang_id ?? '');
    const m = monCo.get(id);
    if (!m) throw new LoiQuay('Có món không còn trong danh sách — tải lại thẻ Quầy.');
    if (m.dem_goi) {
      const g = Number(d.so_goi);
      if (!Number.isInteger(g) || g <= 0 || g > 10000) throw new LoiQuay(`"${m.ten}": số gói là số nguyên lớn hơn 0.`);
      ra.push({ mat_hang_id: id, so_goi: g });
    } else {
      const kg = Number(d.so_kg);
      if (!(kg > 0) || kg > 10000) throw new LoiQuay(`"${m.ten}": số kg phải lớn hơn 0.`);
      ra.push({ mat_hang_id: id, so_kg: Math.round(kg * 1000) / 1000 });
    }
  }
  return ra;
}

export function dongHuy(ds: unknown, lo: Map<string, LoQuay>, monCo: Map<string, { dem_goi: boolean; ten: string }>):
  { viTriId: string; dong: { mat_hang_id: string; lo_id: string; so_goi?: number; so_kg?: number }[] } {
  if (!Array.isArray(ds) || ds.length === 0) throw new LoiQuay('Chưa chọn gói nào để huỷ.');
  const dong: { mat_hang_id: string; lo_id: string; so_goi?: number; so_kg?: number }[] = [];
  let viTriId = '';
  for (const d of ds as Record<string, unknown>[]) {
    const l = lo.get(String(d.lo_id ?? ''));
    if (!l) throw new LoiQuay('Có lô không còn ở quầy — tải lại thẻ Quầy.');
    if (viTriId && viTriId !== l.vi_tri_id) throw new LoiQuay('Mỗi phiếu huỷ chỉ một quầy — chọn các lô cùng quầy.');
    viTriId = l.vi_tri_id;
    const m = monCo.get(l.mat_hang_id);
    if (m?.dem_goi ?? true) {
      const g = d.so_goi === undefined ? so(l.so_goi) : Number(d.so_goi);
      if (!Number.isInteger(g) || g <= 0 || g > so(l.so_goi)) throw new LoiQuay(`Lô ${l.ma_lo}: số gói huỷ từ 1 đến ${so(l.so_goi)}.`);
      dong.push({ mat_hang_id: l.mat_hang_id, lo_id: l.lo_id, so_goi: g });
    } else {
      const kg = d.so_kg === undefined ? so(l.so_kg) : Number(d.so_kg);
      if (!(kg > 0) || kg > so(l.so_kg) + 1e-9) throw new LoiQuay(`Lô ${l.ma_lo}: số kg huỷ phải lớn hơn 0 và không quá ${so(l.so_kg)}.`);
      dong.push({ mat_hang_id: l.mat_hang_id, lo_id: l.lo_id, so_kg: Math.round(kg * 1000) / 1000 });
    }
  }
  return { viTriId, dong };
}

// -----------------------------------------------------------------------------
// MỤC TẢNG & Ô Ở CUỐI THẺ QUẦY (kho_can_o_ma — 0054; 2.11)
// -----------------------------------------------------------------------------
export interface OMaKho {
  o_ma_id: string; mat_hang_id: string; ten: string; so_o: number; ma_can: string;
  giao_id: string | null; tu_luc: string | null; so_phieu_loc: string | null; trang_thai_phien: string | null;
  lo_id: string | null; ma_lo: string | null; han_dung: string | null; so_tang: number | null; ma_lo_tang: string | null;
  kg_ra: number | null; goi_ra: number | null; con_kg: number; con_goi: number;
  kg_ban: number; goi_ban: number; kg_huy: number; kg_khac: number;
  so_ban_dung_o: number; so_lech_o: number; con_giu: boolean;
}
export type TinhTrangO = 'trong' | 'dang_loc' | 'dang_ban' | 'het_hang';
export interface OXem extends Omit<OMaKho, 'so_tang'> {
  soTang: string;
  tinhTrang: TinhTrangO;
  /** Phần trăm đã bán trên kg lóc ra. */
  banPt: number | null;
  /** Tên kho muốn in trên tem của ô. */
  tenMuon: string;
  /** Tên đang nằm trên cân (theo file gốc / tren-can.tsv) — null: ô chưa lên cân. */
  tenTrenCan: string | null;
  canDaDoi: boolean;
}
export interface NhomO { mat_hang_id: string; ten: string; o: OXem[]; dangBan: number; trong: number; lech: number }

export function tomTatO(ds: OMaKho[], tenTrenCan: Map<string, string>): NhomO[] {
  const nhom = new Map<string, NhomO>();
  for (const x of ds) {
    const tinhTrang: TinhTrangO = !x.giao_id ? 'trong'
      : !x.lo_id ? 'dang_loc'
      : x.con_giu ? 'dang_ban' : 'het_hang';
    const kgRa = x.kg_ra === null ? null : so(x.kg_ra);
    const tenMuon = tenTheoTang(x.ten, x.con_giu ? x.so_tang : null);
    const tren = tenTrenCan.get(x.ma_can) ?? null;
    const o: OXem = {
      ...x, kg_ra: kgRa, con_kg: so(x.con_kg), con_goi: so(x.con_goi), kg_ban: so(x.kg_ban), goi_ban: so(x.goi_ban),
      kg_huy: so(x.kg_huy), kg_khac: so(x.kg_khac), so_ban_dung_o: so(x.so_ban_dung_o), so_lech_o: so(x.so_lech_o),
      soTang: soTangChu(x.so_tang), tinhTrang,
      banPt: kgRa && kgRa > 0 ? Math.round(so(x.kg_ban) / kgRa * 100) : null,
      // So bằng chuanTenCan ở cả hai phía (NFC, bỏ tab, cắt như lúc gửi) — tên dán từ Excel (NFD) vẫn khớp.
      tenMuon, tenTrenCan: tren, canDaDoi: tren !== null && chuanTenCan(tren) === chuanTenCan(tenMuon),
    };
    const n = nhom.get(x.mat_hang_id) ?? { mat_hang_id: x.mat_hang_id, ten: x.ten, o: [], dangBan: 0, trong: 0, lech: 0 };
    n.o.push(o);
    if (tinhTrang === 'dang_ban' || tinhTrang === 'dang_loc') n.dangBan++;
    if (tinhTrang === 'trong' || tinhTrang === 'het_hang') n.trong++;
    n.lech += o.so_lech_o;
    nhom.set(x.mat_hang_id, n);
  }
  const ra = [...nhom.values()].sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
  for (const n of ra) n.o.sort((a, b) => a.so_o - b.so_o);
  return ra;
}

// -----------------------------------------------------------------------------
// THẺ GIẢM GIÁ
// -----------------------------------------------------------------------------
export interface MonGiam { id: string; ma: string; ten: string; ma_can: string | null; gia_ban_kg: number | null; dang_dung: boolean; coO: boolean }
export interface DongGiamXem {
  id: string; mat_hang_id: string; ten: string; phan_tram: number; ma_can: string; dang_dung: boolean;
  giaGoc: number | null; giaGiam: number | null; tenTrenCan: string; daLenCan: boolean;
}

/** Danh sách mã giảm để xem / xuất cho FABi, và các món tạo được mã giảm. */
export function tomTatGiam(
  maGiam: { id: string; mat_hang_id: string; phan_tram: number; ma_can: string; dang_dung: boolean }[],
  mon: MonGiam[], trenCan: Map<string, string>,
): { ds: DongGiamXem[]; monTaoDuoc: MonGiam[] } {
  const theoId = new Map(mon.map(m => [m.id, m]));
  const ds = maGiam.map(g => {
    const m = theoId.get(g.mat_hang_id);
    const gia = m?.gia_ban_kg ?? null;
    return {
      id: g.id, mat_hang_id: g.mat_hang_id, ten: m?.ten ?? '(món đã ngừng)', phan_tram: g.phan_tram, ma_can: g.ma_can,
      dang_dung: g.dang_dung && !!m?.dang_dung, giaGoc: gia, giaGiam: gia === null ? null : giaGiam(gia, g.phan_tram),
      tenTrenCan: m ? tenGiam(m.ten, g.phan_tram) : '', daLenCan: trenCan.has(g.ma_can),
    };
  }).sort((a, b) => a.ten.localeCompare(b.ten, 'vi') || a.phan_tram - b.phan_tram);
  const monTaoDuoc = mon.filter(m => m.dang_dung && (m.gia_ban_kg ?? 0) > 0 && (m.ma_can || m.coO))
    .sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
  return { ds, monTaoDuoc };
}

// -----------------------------------------------------------------------------
// THẺ BÁO CÁO
// -----------------------------------------------------------------------------
export interface DongBanGio {
  ngay: string; gio: number; mat_hang_id: string; ma: string; ten: string; nhom: string | null;
  so_dong: number; so_kg: number; so_goi: number; doanh_thu: number;
  so_dong_giam: number; so_kg_giam: number; doanh_thu_giam: number; tien_giam: number; so_dong_giam_som: number;
  so_dong_lech_o: number;
}
export interface DongTang {
  lo_id: string; so_tang: number | null; ma_lo: string; ten_hang: string; ten_ncc: string | null;
  ngay_nhan: string | null; ngay_loc: string | null; kg_ncc: number | null; kg_repack: number | null;
  kg_vao_loc: number | null; kg_thit: number | null; thu_hoi_pt: number | null;
  kg_ban: number | null; kg_huy: number | null; kg_con: number | null; ban_pt: number | null;
  so_ngay_ban: number | null; tinh_trang: string;
}
export interface BaoCao {
  tu: string; den: string;
  tong: { doanhThu: number; kg: number; soDong: number; soNgay: number;
          doanhThuGiam: number; kgGiam: number; tienGiam: number; soDongGiam: number; soDongGiamSom: number; soDongLechO: number };
  theoNgay: { ngay: string; doanhThu: number; kg: number; soDong: number; doanhThuGiam: number }[];
  theoGio: { gio: number; doanhThu: number; kg: number; soDong: number }[];
  theoMon: { mat_hang_id: string; ten: string; nhom: string | null; doanhThu: number; kg: number; soGoi: number; soDong: number;
             kgGiam: number; tienGiam: number; soDongGiamSom: number; soDongLechO: number }[];
  tang: DongTang[];
}

const ngayChu = (v: unknown) => String(v ?? '').slice(0, 10);

export function tomTatBaoCao(tu: string, den: string, dong: DongBanGio[], tang: DongTang[]): BaoCao {
  const tong = { doanhThu: 0, kg: 0, soDong: 0, soNgay: 0, doanhThuGiam: 0, kgGiam: 0, tienGiam: 0, soDongGiam: 0, soDongGiamSom: 0, soDongLechO: 0 };
  const ngay = new Map<string, BaoCao['theoNgay'][number]>();
  const gio = new Map<number, BaoCao['theoGio'][number]>();
  const mon = new Map<string, BaoCao['theoMon'][number]>();
  for (const d of dong) {
    const dt = so(d.doanh_thu), kg = so(d.so_kg), sd = so(d.so_dong);
    tong.doanhThu += dt; tong.kg += kg; tong.soDong += sd;
    tong.doanhThuGiam += so(d.doanh_thu_giam); tong.kgGiam += so(d.so_kg_giam); tong.tienGiam += so(d.tien_giam);
    tong.soDongGiam += so(d.so_dong_giam); tong.soDongGiamSom += so(d.so_dong_giam_som); tong.soDongLechO += so(d.so_dong_lech_o);
    const n = ngayChu(d.ngay);
    const a = ngay.get(n) ?? { ngay: n, doanhThu: 0, kg: 0, soDong: 0, doanhThuGiam: 0 };
    a.doanhThu += dt; a.kg += kg; a.soDong += sd; a.doanhThuGiam += so(d.doanh_thu_giam);
    ngay.set(n, a);
    const g = gio.get(so(d.gio)) ?? { gio: so(d.gio), doanhThu: 0, kg: 0, soDong: 0 };
    g.doanhThu += dt; g.kg += kg; g.soDong += sd;
    gio.set(g.gio, g);
    const m = mon.get(d.mat_hang_id) ?? { mat_hang_id: d.mat_hang_id, ten: d.ten, nhom: d.nhom, doanhThu: 0, kg: 0, soGoi: 0, soDong: 0,
                                         kgGiam: 0, tienGiam: 0, soDongGiamSom: 0, soDongLechO: 0 };
    m.doanhThu += dt; m.kg += kg; m.soGoi += so(d.so_goi); m.soDong += sd;
    m.kgGiam += so(d.so_kg_giam); m.tienGiam += so(d.tien_giam); m.soDongGiamSom += so(d.so_dong_giam_som); m.soDongLechO += so(d.so_dong_lech_o);
    mon.set(d.mat_hang_id, m);
  }
  const lam = (x: number) => Math.round(x * 1000) / 1000;
  tong.kg = lam(tong.kg); tong.kgGiam = lam(tong.kgGiam); tong.soNgay = ngay.size;
  return {
    tu, den, tong,
    theoNgay: [...ngay.values()].map(x => ({ ...x, kg: lam(x.kg) })).sort((a, b) => a.ngay.localeCompare(b.ngay)),
    theoGio: [...gio.values()].map(x => ({ ...x, kg: lam(x.kg) })).sort((a, b) => a.gio - b.gio),
    theoMon: [...mon.values()].map(x => ({ ...x, kg: lam(x.kg), kgGiam: lam(x.kgGiam) })).sort((a, b) => b.doanhThu - a.doanhThu),
    tang,
  };
}

/** Kiểm khoảng ngày của báo cáo (YYYY-MM-DD). */
export function khoangNgay(tu: unknown, den: unknown): { tu: string; den: string } {
  const la = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
  if (!la(tu) || !la(den)) throw new LoiQuay('Chọn ngày bắt đầu và ngày kết thúc.');
  if ((tu as string) > (den as string)) throw new LoiQuay('Ngày bắt đầu phải trước ngày kết thúc.');
  if ((Date.parse(den as string) - Date.parse(tu as string)) / 86400000 > 366) throw new LoiQuay('Khoảng ngày tối đa 1 năm.');
  return { tu: tu as string, den: den as string };
}
