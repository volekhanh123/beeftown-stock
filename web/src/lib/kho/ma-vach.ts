/**
 * KHO — ĐỌC MÃ VẠCH NHÃN CÂN
 *
 * Cân Dahua TM-A in mã EAN-13 kiểu 2+5+5+1: hai số đầu, năm số mã hàng, năm
 * số trọng lượng tính bằng gram, một số kiểm tra. iPOS đọc chính dãy số này
 * lúc tính tiền. Phần mềm kho đọc nó để biết gói thịt trong tay là phần gì,
 * nặng bao nhiêu — không cần nối dây gì vào cân.
 *
 * MẪU MÃ VẠCH — 13 ký tự, khớp CHECK kho_cai_dat_ma_vach_hop_le ở 0019:
 *   0-9 : chữ số cố định        X : chữ số bất kỳ
 *   C   : mã hàng               W : trọng lượng      P : thành tiền
 *   K   : số kiểm tra (luôn ở cuối)
 * Mặc định '2XCCCCCWWWWWK'. Cân cài kiểu khác thì chủ nhà hàng đổi mẫu trong
 * Cài đặt kho, và thử ngay với một nhãn thật ở ô "Thử một nhãn".
 *
 * File thuần, không import gì — test Node nạp thẳng được, và trang web dùng
 * lại được cả phía máy chủ lẫn trình duyệt.
 */

export const MAU_MAC_DINH = '2XCCCCCWWWWWK';

const MAU_HOP_LE = /^[0-9X]*C{1,6}[0-9X]*(W{3,6}|P{3,7})[0-9X]*K$/;

export function kiemTraMau(mau: string): boolean {
  return mau.length === 13 && MAU_HOP_LE.test(mau);
}

/** Số kiểm tra EAN-13 của 12 chữ số đầu. */
export function tinhSoKiemTra(muoiHaiSo: string): number {
  let tong = 0;
  for (let i = 0; i < 12; i++) {
    const so = muoiHaiSo.charCodeAt(i) - 48;
    tong += i % 2 === 0 ? so : so * 3;
  }
  return (10 - (tong % 10)) % 10;
}

export function laEan13HopLe(ma: string): boolean {
  return /^\d{13}$/.test(ma) && tinhSoKiemTra(ma.slice(0, 12)) === ma.charCodeAt(12) - 48;
}

export type KetQuaDoc =
  | { hopLe: true; ma: string; maCan: string; soKg: number | null; thanhTien: number | null }
  /** loi: tiếng Việt, loiEn: cùng câu bằng tiếng Anh. */
  | { hopLe: false; ma: string; loi: string; loiEn: string };

/** Vì sao một mã không đọc được — hai thứ tiếng. */
const LOI_DOC = {
  mau: { vi: 'Mẫu mã vạch trong Cài đặt không hợp lệ', en: 'The barcode pattern in Settings is not valid' },
  khongPhai13: { vi: 'Không phải mã 13 số', en: 'Not a 13-digit code' },
  soKiemTra: { vi: 'Sai số kiểm tra — quét lại', en: 'Wrong check digit — scan again' },
  khongPhaiNhan: { vi: 'Không phải nhãn cân (đầu mã không khớp mẫu)', en: 'Not a scale label (the start of the code does not match the pattern)' },
  maBang0: { vi: 'Mã hàng trên nhãn bằng 0', en: 'The item code on the label is 0' },
  kgBang0: { vi: 'Trọng lượng trên nhãn bằng 0', en: 'The weight on the label is 0' },
} as const;
const hong = (ma: string, c: { vi: string; en: string }): KetQuaDoc => ({ hopLe: false, ma, loi: c.vi, loiEn: c.en });

/**
 * Đọc một mã vạch theo mẫu.
 *  - maCan: mã hàng đã bỏ số 0 đầu ("00012" → "12"), khớp kho_mat_hang.ma_can
 *  - soKg: khi mẫu có W — W đọc thành số nguyên rồi chia 10^soLeKg
 *  - thanhTien: khi mẫu có P
 */
export function docMaVach(ma: string, mau: string = MAU_MAC_DINH, soLeKg = 3): KetQuaDoc {
  const s = ma.trim();
  if (!kiemTraMau(mau)) return hong(s, LOI_DOC.mau);
  if (!/^\d{13}$/.test(s)) return hong(s, LOI_DOC.khongPhai13);
  if (!laEan13HopLe(s)) return hong(s, LOI_DOC.soKiemTra);

  let c = '', w = '', p = '';
  for (let i = 0; i < 13; i++) {
    const k = mau[i];
    const so = s[i];
    if (k >= '0' && k <= '9') {
      if (so !== k) return hong(s, LOI_DOC.khongPhaiNhan);
    } else if (k === 'C') c += so;
    else if (k === 'W') w += so;
    else if (k === 'P') p += so;
  }

  const maCan = c.replace(/^0+/, '');
  if (maCan === '') return hong(s, LOI_DOC.maBang0);

  const soKg = w ? Number(w) / 10 ** soLeKg : null;
  const thanhTien = p ? Number(p) : null;
  if (soKg !== null && soKg <= 0) return hong(s, LOI_DOC.kgBang0);

  return { hopLe: true, ma: s, maCan, soKg, thanhTien };
}

/**
 * Tách nội dung ô dán mã: máy quét cầm tay gõ mã rồi Enter, nên mỗi mã một
 * dòng; dán tay thì có thể cách nhau bằng dấu phẩy hay khoảng trắng.
 */
export function tachDanhSachMa(noiDung: string): string[] {
  return noiDung.split(/[\s,;]+/).map(x => x.trim()).filter(Boolean);
}

export interface GomTheoMa {
  /** mã cân → số gói, tổng kg (hoặc tổng tiền nếu nhãn in tiền) */
  theoMa: Map<string, { soGoi: number; soKg: number; thanhTien: number }>;
  loi: { ma: string; loi: string }[];
}

/**
 * Gom nhiều nhãn thành số gói và tổng kg theo từng mã hàng. Tổng kg cộng
 * theo GRAM rồi mới chia, để 0,1 + 0,2 không thành 0,30000000000000004.
 */
export function gomTheoMaCan(danhSach: string[], mau: string = MAU_MAC_DINH, soLeKg = 3): GomTheoMa {
  const gram = new Map<string, { soGoi: number; don: number; thanhTien: number }>();
  const loi: { ma: string; loi: string }[] = [];
  const heSo = 10 ** soLeKg;

  for (const ma of danhSach) {
    const kq = docMaVach(ma, mau, soLeKg);
    if (!kq.hopLe) { loi.push({ ma: kq.ma, loi: kq.loi }); continue; }
    const cu = gram.get(kq.maCan) ?? { soGoi: 0, don: 0, thanhTien: 0 };
    cu.soGoi += 1;
    cu.don += kq.soKg !== null ? Math.round(kq.soKg * heSo) : 0;
    cu.thanhTien += kq.thanhTien ?? 0;
    gram.set(kq.maCan, cu);
  }

  const theoMa = new Map<string, { soGoi: number; soKg: number; thanhTien: number }>();
  for (const [maCan, g] of gram) {
    theoMa.set(maCan, { soGoi: g.soGoi, soKg: g.don / heSo, thanhTien: g.thanhTien });
  }
  return { theoMa, loi };
}
