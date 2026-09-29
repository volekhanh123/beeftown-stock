/**
 * BÁO ĐỘNG — LUẬT BÁO (thuần: không mạng, không database, không đồng hồ máy)
 * ==========================================================================
 *
 * Việc chạy nền (bao-dong.ts) mỗi 5 phút đọc số liệu bảng sức khỏe, ghi màu mọi đèn vào sổ sự
 * cố (0057, bao_dong_ghi_luot), rồi hỏi file này: lượt này báo gì, đóng gì. Database giữ TRẠNG
 * THÁI (mỗi đèn một sự cố đang mở, dấu "đã báo"); file này giữ LUẬT. Mọi mốc giờ tính theo `luc`
 * — now() của DATABASE — nên máy chạy Worker lệch giờ không đổi một quyết định nào, và
 * crm/test/test-bao-dong-web.mjs thử được từng phút giờ Việt Nam.
 *
 * LUẬT (chủ nhà hàng chọn, 29/09/2026):
 *   · Đèn đỏ đủ PHUT_XAC_NHAN phút (hai lượt 5 phút) mới báo — đỏ một lượt rồi tự hết thì im.
 *   · Ban đêm (22:00–07:00 giờ VN) chỉ đèn HỆ THỐNG báo ngay. Đèn KHÁCH (đặt bàn, hồ sơ, tin
 *     Zalo kẹt) đợi tới 07:00: lượt đầu sau 07:00 gửi gộp một tin nếu vẫn đỏ.
 *   · Hết đỏ PHUT_CHO_HET_DO phút liền mới đóng sự cố; đỏ lại trong lúc chờ vẫn là sự cố cũ,
 *     không báo lại. Sự cố đã báo thì báo hết đỏ theo màu mới; đèn không còn trên bảng (chi
 *     nhánh ngừng hoạt động — "mat") đóng im lặng; đèn khách hết đỏ ban đêm đợi 07:00.
 *   · Mỗi đèn tối đa TIN_TOI_DA_MOI_DEN tin "mới đỏ" từ 8 giờ sáng tới 8 giờ sáng hôm sau;
 *     tin cuối nói rõ là sẽ không nhắn riêng nữa tới bản tóm tắt.
 *   · 8 giờ sáng MỖI NGÀY gửi tóm tắt, kể cả khi mọi thứ xanh: không thấy tin sáng nghĩa là
 *     việc báo động đang hỏng. Lỡ 8 giờ thì gửi bù tới 22 giờ.
 *   · Vừa có kênh (kênh đổi sau lần tóm tắt gần nhất): gửi ngay tin "đã nối kênh" liệt kê mọi
 *     mục đang đỏ — không dồn tin cũ.
 *   · Không đọc được số liệu (mu): KHÔNG đóng sự cố nào và không báo gì khác ngoài đèn giả
 *     doc_so_lieu ("báo động đang mù") — không bao giờ có "đã ổn lại" giả.
 *   · Chưa có kênh ('khong'): không gửi, không đánh dấu "đã báo"; vẫn đóng các sự cố đã hết
 *     đỏ đủ lâu. Ngày có kênh, tin "đã nối kênh" nói tình hình lúc đó.
 *   · Mỗi lượt gộp thành MỘT tin (bao-dong-tin.ts soạn).
 */

import { gioVnTuMs, homNayVn, isoGioVn } from './gio-vn.ts';
import type { MaDen } from './suc-khoe.ts';

// -----------------------------------------------------------------------------
// NHÓM ĐÈN
// -----------------------------------------------------------------------------
export type NhomDen = 'he_thong' | 'khach';
/** Mã đèn trong sổ sự cố: mọi đèn của bảng sức khỏe + đèn giả doc_so_lieu (không đọc được số liệu). */
export type MaDenBaoDong = MaDen | 'doc_so_lieu';

/**
 * Nhóm của từng đèn. Kiểu Record bắt buộc đủ mọi mã đèn của suc-khoe.ts: thêm đèn mới mà quên
 * xếp ở đây thì `astro check` báo lỗi. Mã lạ lúc chạy (database mới hơn web) coi là hệ thống —
 * thà báo đêm còn hơn im.
 */
export const NHOM: Readonly<Record<MaDenBaoDong, NhomDen>> = {
  zalo: 'he_thong',
  messenger: 'he_thong',
  ipos: 'he_thong',
  so_kho: 'he_thong',
  dich: 'he_thong',
  bao_dong: 'he_thong',
  doc_so_lieu: 'he_thong',
  dat_ban: 'khach',
  tuyen_dung: 'khach',
  tin_zalo: 'khach',
};

export function nhomCua(maDen: string): NhomDen {
  return Object.prototype.hasOwnProperty.call(NHOM, maDen) ? NHOM[maDen as MaDenBaoDong] : 'he_thong';
}

// -----------------------------------------------------------------------------
// NGƯỠNG
// -----------------------------------------------------------------------------
/** Ban đêm: từ GIO_DEM_TU giờ tới trước GIO_DEM_DEN giờ (giờ VN). */
export const GIO_DEM_TU = 22;
export const GIO_DEM_DEN = 7;
/** Tóm tắt mỗi sáng; cũng là mốc đầu chu kỳ đếm trần tin của từng đèn. */
export const GIO_TOM_TAT = 8;
/** Lỡ lượt 8 giờ (Worker hỏng, mất mạng) thì gửi bù tóm tắt tới trước giờ này. */
export const GIO_TOM_TAT_BU_DEN = 22;
/** Đỏ đủ chừng này phút mới báo: cron 5 phút → lượt thứ hai. Nhỏ hơn 5 để chịu được lệch vài giây. */
export const PHUT_XAC_NHAN = 4;
/** Hết đỏ chừng này phút liền mới đóng sự cố (đèn chập chờn không thành nhiều tin). */
export const PHUT_CHO_HET_DO = 15;
/** Tối đa chừng này tin "mới đỏ" cho một đèn trong một chu kỳ 8 giờ sáng → 8 giờ sáng. */
export const TIN_TOI_DA_MOI_DEN = 5;

const PHUT = 60_000;
const NGAY = 24 * 60 * PHUT;

// -----------------------------------------------------------------------------
// ĐẦU VÀO — đúng dạng các RPC của 0057 trả
// -----------------------------------------------------------------------------
export type MauSau = 'xanh' | 'vang' | 'tat' | 'mat';

/** Một sự cố đang mở (bao_dong_ghi_luot trả sau khi ghi màu của lượt). */
export interface SuCo {
  id: string;
  /** ma_den, hoặc ma_den:<id chi nhánh>. */
  khoa: string;
  ma_den: string;
  chi_nhanh_id: string | null;
  bat_dau_luc: string;
  /** Lần đầu thấy hết đỏ; null = đang đỏ. */
  het_do_tu: string | null;
  /** Màu gần nhất từ lúc hết đỏ; 'mat' = đèn không còn trên bảng. */
  mau_sau: MauSau | null;
  bao_mo_luc: string | null;
  bao_mo_kenh: string | null;
  bao_het_luc: string | null;
}

/** Một lần báo "mới đỏ" trong 48 giờ qua, kể cả của sự cố đã đóng (bao_dong_bat_dau_luot). */
export interface DaBao {
  khoa: string;
  bao_mo_luc: string;
}

export interface DauVaoKeHoach {
  /** now() của database lúc ghi lượt. */
  luc: string;
  /** Mã kênh Worker đang dùng; 'khong' = chưa chọn kênh. */
  kenh: string;
  /** Lần đổi kênh gần nhất (bao_dong_trang_thai.kenh_tu_luc). */
  kenhTuLuc: string | null;
  /** Lần gửi tóm tắt gần nhất (sáng hoặc nối kênh). */
  tomTatLuc: string | null;
  /** Sự cố đang mở SAU khi ghi lượt. */
  suCo: SuCo[];
  daBao48Gio: DaBao[];
  /** Lượt này không đọc được số liệu: chỉ có đèn giả doc_so_lieu. */
  mu: boolean;
}

export type LoaiTomTat = 'sang' | 'noi_kenh';

export interface KeHoach {
  /** Báo "mới đỏ": đỏ đủ lâu, chưa báo, được báo giờ này, chưa chạm trần. Cũ trước. */
  moiDo: SuCo[];
  /** Khóa của các mục trong moiDo vừa tới trần — câu ghi "sẽ không nhắn riêng nữa". */
  chamTran: string[];
  /** Báo hết đỏ — bao_dong_da_gui đóng sự cố CÙNG câu lệnh đánh dấu, sau khi tin tới kênh. */
  hetDo: SuCo[];
  /** id sự cố đóng im lặng: chưa từng báo, đã báo hết đỏ, đèn không còn, hoặc chưa có kênh. */
  dongIm: string[];
  /** Tóm tắt lượt này, nếu có — liệt kê MỌI mục đang đỏ. */
  tomTat: LoaiTomTat | null;
  /** Mọi sự cố đang đỏ đã đủ PHUT_XAC_NHAN phút, cũ trước (cho tóm tắt). */
  dangDo: SuCo[];
  /** id đánh dấu "đã báo" sau khi gửi được: moiDo, và khi tóm tắt thì mọi mục đang đỏ chưa báo. */
  danhDauMo: string[];
  /** Lượt này có tin để gửi. */
  coTin: boolean;
}

// -----------------------------------------------------------------------------
// GIỜ VIỆT NAM
// -----------------------------------------------------------------------------
const ms = (v: unknown): number | null => {
  if (typeof v !== 'string') return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
};

/** Giờ Việt Nam (0–23) của một mốc ms. */
export function gioVn(t: number): number {
  return Number(gioVnTuMs(t).slice(11, 13));
}

/** 22:00–06:59 giờ Việt Nam. */
export function laBanDem(t: number): boolean {
  const g = gioVn(t);
  return g >= GIO_DEM_TU || g < GIO_DEM_DEN;
}

/** Mốc GIO_TOM_TAT giờ (giờ VN) gần nhất không sau t: đầu chu kỳ đếm trần tin và mốc tóm tắt sáng. */
export function dauChuKy(t: number): number {
  const [nam, thang, ngay] = homNayVn(t).split('-').map(Number);
  const moc = Date.parse(isoGioVn(nam, thang, ngay, GIO_TOM_TAT, 0) ?? '');
  // Việt Nam không đổi giờ mùa hè: lùi một ngày luôn đúng 24 giờ.
  return t >= moc ? moc : moc - NGAY;
}

// -----------------------------------------------------------------------------
// KẾ HOẠCH MỘT LƯỢT
// -----------------------------------------------------------------------------
const KE_HOACH_RONG: KeHoach = Object.freeze({
  moiDo: [], chamTran: [], hetDo: [], dongIm: [], tomTat: null, dangDo: [], danhDauMo: [], coTin: false,
}) as KeHoach;

export function lapKeHoach(v: DauVaoKeHoach): KeHoach {
  const t = ms(v.luc);
  // Không biết bây giờ là mấy giờ thì không quyết gì: không gửi, không đóng.
  if (t === null) return { ...KE_HOACH_RONG };

  const coKenh = v.kenh !== 'khong';
  const dem = laBanDem(t);
  const chuKy = dauChuKy(t);
  const duocBaoLucNay = (s: SuCo) => nhomCua(s.ma_den) === 'he_thong' || !dem;
  const conDo = (s: SuCo) => s.het_do_tu === null;
  const daXacNhan = (s: SuCo) => {
    const b = ms(s.bat_dau_luc);
    return b !== null && t - b >= PHUT_XAC_NHAN * PHUT;
  };
  const theoLuc = (a: SuCo, b: SuCo) =>
    (ms(a.bat_dau_luc) ?? 0) - (ms(b.bat_dau_luc) ?? 0) || (a.khoa < b.khoa ? -1 : a.khoa > b.khoa ? 1 : 0);

  // Số lần đã báo "mới đỏ" của từng đèn trong chu kỳ này (kể cả sự cố đã đóng).
  const soLanBao = new Map<string, number>();
  for (const d of v.daBao48Gio) {
    const m = ms(d.bao_mo_luc);
    if (m !== null && m >= chuKy) soLanBao.set(d.khoa, (soLanBao.get(d.khoa) ?? 0) + 1);
  }

  // Mù: số liệu lượt này không tin được — chỉ xét đèn giả doc_so_lieu, mọi sự cố khác giữ nguyên.
  const xet = (v.mu ? v.suCo.filter(s => s.ma_den === 'doc_so_lieu') : [...v.suCo]).sort(theoLuc);
  const dangDo = xet.filter(s => conDo(s) && daXacNhan(s));

  const moiDo: SuCo[] = [];
  const chamTran: string[] = [];
  if (coKenh) {
    for (const s of dangDo) {
      if (s.bao_mo_luc !== null || !duocBaoLucNay(s)) continue;
      const n = soLanBao.get(s.khoa) ?? 0;
      if (n >= TIN_TOI_DA_MOI_DEN) continue;
      moiDo.push(s);
      if (n + 1 >= TIN_TOI_DA_MOI_DEN) chamTran.push(s.khoa);
    }
  }

  const hetDo: SuCo[] = [];
  const dongIm: string[] = [];
  if (!v.mu) {
    for (const s of xet) {
      if (conDo(s)) continue;
      const h = ms(s.het_do_tu);
      if (h === null || t - h < PHUT_CHO_HET_DO * PHUT) continue;
      const canBaoHet = coKenh && s.bao_mo_luc !== null && s.bao_het_luc === null && s.mau_sau !== 'mat';
      if (!canBaoHet) { dongIm.push(s.id); continue; }
      if (!duocBaoLucNay(s)) continue;              // đèn khách hết đỏ ban đêm: giữ mở tới 07:00
      hetDo.push(s);
    }
  }

  let tomTat: LoaiTomTat | null = null;
  if (coKenh && !v.mu) {
    const kenhTu = ms(v.kenhTuLuc), tomTu = ms(v.tomTatLuc);
    const g = gioVn(t);
    if (kenhTu !== null && (tomTu === null || tomTu < kenhTu)) tomTat = 'noi_kenh';
    else if (g >= GIO_TOM_TAT && g < GIO_TOM_TAT_BU_DEN && (tomTu === null || tomTu < chuKy)) tomTat = 'sang';
  }

  const danhDauMo = [...new Set([
    ...moiDo.map(s => s.id),
    ...(tomTat ? dangDo.filter(s => s.bao_mo_luc === null).map(s => s.id) : []),
  ])];
  return {
    moiDo, chamTran, hetDo, dongIm, tomTat, dangDo, danhDauMo,
    coTin: moiDo.length > 0 || hetDo.length > 0 || tomTat !== null,
  };
}
