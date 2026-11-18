/**
 * ĐƠN MUA THỊT VỀ — GIỎ VÀ TẠM TÍNH (hàm thuần, chạy cả ở máy chủ lẫn trong trình duyệt)
 * =====================================================================================
 *
 * Trang /mua-thit-ve (en, ko: /buy-meat) dựng "Đơn của bạn" hai lần bằng CÙNG các hàm này:
 *   · máy chủ — component đọc giỏ từ địa chỉ trang (database vừa từ chối đơn: lib/xu-ly-form.ts đưa khách về trang
 *     kèm giỏ trên địa chỉ, để không phải chọn lại);
 *   · trình duyệt — script của trang đọc giỏ từ form mỗi lần khách đổi số gói.
 * Tiền chỉ để khách xem trước: database tự tính lại đơn từ giá đã chốt khi khách bấm Đặt hàng (tao_don_mua_thit,
 * 0113), và từ chối nếu giá khách đã thấy khác giá hiện tại.
 *
 * Vì chạy trong trình duyệt, file này chỉ nạp kiểu (import type, bị xóa khi dựng): không kéo supabase-js, không đọc
 * database, không chạm DOM, không gọi mạng, không đọc đồng hồ. crm/test/test-mua-thit-ve-web.mjs giữ những điều đó.
 *
 * Luật đã chốt:
 *   · Giá là giá gói quán đã công bố (giá chủ đã chốt, Khánh 26/10/2026 — quyết định 1).
 *   · Gói thịt ghi "khoảng 200 g" (quyết định 2); số gam không dấu ngăn ở mọi thứ tiếng ("1000 g" — "1.000 g" ở
 *     trang tiếng Anh đọc thành một gam). Hộp kim chi ghi khối lượng tịnh ("Hộp 500 g").
 *   · Chỉ giao tận nơi (Khánh 03/11/2026) — không còn cách nhận "tại quầy" trên website.
 *   · Số tiền chỉ ở dạng "400.000 đ" (dấu cách thường), và trên trang chỉ in trong phần tử có data-tien — bộ quét
 *     chữ cấm miễn đúng chỗ đó. CHU_DON không chứa số tiền: trang ghép chữ + <span data-tien> riêng.
 */
import type { NgonNgu } from './noi-dung.ts';

export type DonVi = 'goi' | 'hop';
export type BaoQuan = 'mat' | 'giu_lanh' | 'dong_lanh';

/** Một gói khách chọn được. `khoa` là tên ô chọn trong form và trong địa chỉ trang (khoaGoi). */
export interface GoiMua { khoa: string; soGam: number; gia: number; tamHet: boolean }

/** Một sản phẩm của menu mua thịt về; gói theo thứ tự database (số gam tăng dần). */
export interface SanPhamMua {
  ma: string;
  loai: 'thit' | 'kim_chi';
  donVi: DonVi;
  baoQuan: BaoQuan;
  /** Tên theo thứ tiếng của trang (bản dịch còn hiệu lực, không thì tên tiếng Việt). */
  ten: string;
  /** Tên tiếng Việt hiện tại (database chụp lại tên này vào đơn). */
  tenVi: string;
  moTa: string | null;
  cachDung: string | null;
  goi: GoiMua[];
}

/** Số gói tối đa mỗi ô chọn (0–10) — cùng giới hạn của tao_don_mua_thit (0113). Cần nhiều hơn: ghi vào ô Ghi chú. */
export const SO_GOI_TOI_DA = 10;

type BaTieng<T> = Readonly<Record<NgonNgu, T>>;
const LA_NGON_NGU: ReadonlySet<string> = new Set(['vi', 'en', 'ko']);
/** Thứ tiếng lạ (data-nn bị sửa tay) → tiếng Việt, không bao giờ undefined. */
const nnHopLe = (nn: string): NgonNgu => (LA_NGON_NGU.has(nn) ? (nn as NgonNgu) : 'vi');

/** Tên ô chọn của một gói: `ribeye-cap_200`. Mã sản phẩm chỉ có [a-z0-9-] nên "_" tách được, và tên có dấu không bao giờ thành tên ô. */
export function khoaGoi(ma: string, soGam: number): string {
  return `${ma}_${soGam}`;
}

/** 1250000 → "1.250.000" — số kiểu Việt, dấu chấm ngăn nghìn. Không dùng Intl (trình duyệt nào cũng ra một kiểu). */
export function dinhDangSo(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * 400000 → "400.000 đ" (dấu cách thường U+0020) ở MỌI thứ tiếng: tiền đồng trả ở Việt Nam, khách thấy đúng con số
 * đó ở quầy và trong tin. Cùng kiểu với dinhDangTien của kho (toLocaleString('vi-VN') + ' đ') — file kho không nạp
 * được từ trang công khai. Trang in kết quả trong phần tử có data-tien, kèm white-space: nowrap.
 */
export function dinhDangTien(n: number): string {
  return `${dinhDangSo(n)} đ`;
}

/**
 * CHỮ CÓ SỐ CỦA KHỐI ĐƠN — máy chủ (component) và script của trang dùng chung, để hai bản dựng ra cùng một chữ.
 * Mỗi khóa đủ vi / en / ko. Không câu nào chứa số tiền.
 */
/** "3 gói · 1 hộp" — dùng chung cho CHU_DON.dem và CHU_DON.daChon (một chỗ giữ số ít / số nhiều). */
const DEM = {
  vi: (soGoi: number, soHop: number) => noi([soGoi && `${soGoi} gói`, soHop && `${soHop} hộp`]),
  en: (soGoi: number, soHop: number) =>
    noi([soGoi && `${soGoi} ${soGoi === 1 ? 'pack' : 'packs'}`, soHop && `${soHop} ${soHop === 1 ? 'box' : 'boxes'}`]),
  ko: (soGoi: number, soHop: number) => noi([soGoi && `${soGoi}팩`, soHop && `${soHop}통`]),
};

export const CHU_DON = {
  /** Nhãn cỡ gói: thịt "khoảng" (quyết định 2), hộp ghi khối lượng tịnh. Số gam không dấu ngăn. */
  // Khánh 16/11/2026 (hồ sơ thông báo website thương mại điện tử): bỏ chữ "khoảng" — gói ghi đúng số gam, khách trả
  // đúng giá ghi trên web (trang Chính sách giá, lib/chinh-sach.ts). Mỗi gói phải cân đủ số gam ghi trên nhãn.
  goiChu: {
    vi: (donVi: DonVi, n: number) => (donVi === 'hop' ? `Hộp ${n} g` : `Gói ${n} g`),
    en: (donVi: DonVi, n: number) => (donVi === 'hop' ? `${n} g box` : `${n} g pack`),
    ko: (donVi: DonVi, n: number) => (donVi === 'hop' ? `${n} g 통` : `${n} g 팩`),
  },
  /** "3 gói · 1 hộp"; vế bằng 0 bỏ; cả hai bằng 0 → chuỗi rỗng (trang hiện câu giỏ rỗng). */
  dem: DEM,
  /** Đầu một dòng đơn; trang ghép ngay sau nó <span data-tien>thành tiền</span> (vì vậy kết bằng "= "). */
  dongDau: {
    vi: (ten: string, goi: string, n: number) => `${ten} · ${goi} × ${n} = `,
    en: (ten: string, goi: string, n: number) => `${ten} · ${goi} × ${n} = `,
    ko: (ten: string, goi: string, n: number) => `${ten} · ${goi} × ${n} = `,
  },
  /** Dòng "Đã chọn: 2 gói" trên thẻ sản phẩm và ở chân hộp chọn gói (MuaThitThe.astro; script của trang đổi). */
  daChon: {
    vi: (soGoi: number, soHop: number) => `Đã chọn: ${DEM.vi(soGoi, soHop)}`,
    en: (soGoi: number, soHop: number) => `Chosen: ${DEM.en(soGoi, soHop)}`,
    ko: (soGoi: number, soHop: number) => `고른 수량: ${DEM.ko(soGoi, soHop)}`,
  },
  tamTinh: { vi: 'Tạm tính', en: 'Subtotal', ko: '소계' },
  donTrong: { vi: 'Bạn chưa chọn gói nào', en: 'You have not chosen any packs yet', ko: '아직 고른 팩이 없어요' },
  /** Mẩu ẩn đọc cho trình đọc màn hình sau mỗi lần bấm −/+ (vùng aria-live của tạm tính). */
  vuaDoi: {
    vi: (ten: string, goi: string, n: number) => `${ten}, ${goi}: ${n}.`,
    en: (ten: string, goi: string, n: number) => `${ten}, ${goi}: ${n}.`,
    ko: (ten: string, goi: string, n: number) => `${ten} ${goi}: ${n}개.`,
  },
} as const satisfies Record<string, BaTieng<unknown>>;

function noi(phan: ReadonlyArray<string | 0 | false>): string {
  return phan.filter(Boolean).join(' · ');
}

/** Nhãn gói theo thứ tiếng của trang: "Gói 200 g", "200 g pack", "200 g 팩"; hộp "Hộp 500 g"… */
export function nhanGoi(donVi: DonVi, soGam: number, nn: NgonNgu): string {
  return CHU_DON.goiChu[nnHopLe(nn)](donVi, soGam);
}

export interface DongDon { sanPham: SanPhamMua; goi: GoiMua; soLuong: number; thanhTien: number }

export interface Don {
  /** Theo thứ tự menu, không theo thứ tự khách chọn — cùng giỏ thì cùng tin. */
  dong: DongDon[];
  soGoi: number;
  soHop: number;
  tamTinh: number;
  /** Số gói khách chọn mà đang "Tạm hết ở quầy" — bị bỏ khỏi đơn, trang báo một câu. */
  boTamHet: number;
}

/** Ô số gói: đúng "0" … "10" — "01", "1.000", "1,5", " 2", "-1" không phải số gói. */
function docSoGoi(v: unknown): number | null {
  if (typeof v !== 'string' || !/^(?:0|[1-9][0-9]?)$/.test(v)) return null;
  const n = Number(v);
  return n <= SO_GOI_TOI_DA ? n : null;
}

const laSoGoi = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= SO_GOI_TOI_DA;

/**
 * Giỏ từ các cặp [tên ô, giá trị] — địa chỉ trang (máy chủ: [...Astro.url.searchParams]) hoặc FormData (script).
 * Chỉ đọc ô có trong menu; giá trị sai kiểu bị bỏ (không bao giờ thành 1000 gói); ô lặp lại thì lấy lần đầu. Gói
 * "Tạm hết ở quầy" mà khách chọn > 0 → bỏ và đếm vào boTamHet. Ô khác của form (họ tên, giá đã thấy…) bị bỏ qua.
 */
export function docGio(
  thamSo: Iterable<readonly [string, unknown]>, menu: readonly SanPhamMua[],
): { gio: Map<string, number>; boTamHet: number } {
  const theoKhoa = new Map<string, GoiMua>();
  for (const sp of menu) for (const g of sp.goi) theoKhoa.set(g.khoa, g);

  const gio = new Map<string, number>();
  const daDoc = new Set<string>();
  let boTamHet = 0;
  for (const [ten, giaTri] of thamSo) {
    const g = theoKhoa.get(ten);
    if (!g || daDoc.has(ten)) continue;
    daDoc.add(ten);
    const n = docSoGoi(giaTri);
    if (!n) continue;
    if (g.tamHet) { boTamHet++; continue; }
    gio.set(ten, n);
  }
  return { gio, boTamHet };
}

/**
 * Đơn từ giỏ: thành tiền = số gói × giá gói; tạm tính = tổng. Dòng theo thứ tự menu. Giỏ không qua docGio cũng an
 * toàn: số ngoài 1–10 bị bỏ, gói tạm hết bị bỏ và đếm vào boTamHet.
 */
export function tinhDon(gio: ReadonlyMap<string, number>, menu: readonly SanPhamMua[], boTamHet = 0): Don {
  const dong: DongDon[] = [];
  let soGoi = 0, soHop = 0, tamTinh = 0, bo = boTamHet;
  for (const sanPham of menu) {
    for (const goi of sanPham.goi) {
      const soLuong = gio.get(goi.khoa);
      if (!laSoGoi(soLuong)) continue;
      if (goi.tamHet) { bo++; continue; }
      const thanhTien = soLuong * goi.gia;
      dong.push({ sanPham, goi, soLuong, thanhTien });
      tamTinh += thanhTien;
      if (sanPham.donVi === 'hop') soHop += soLuong; else soGoi += soLuong;
    }
  }
  return { dong, soGoi, soHop, tamTinh, boTamHet: bo };
}

/**
 * Giỏ thành chuỗi truy vấn "ribeye-cap_200=2&kim-chi_500=1" (theo thứ tự của giỏ) — lib/xu-ly-form.ts đưa khách về
 * trang với chuỗi này khi database từ chối đơn, để trang chọn sẵn đúng giỏ. Chỉ khóa gói và số gói: không bao giờ
 * họ tên, số điện thoại, địa chỉ (địa chỉ trang nằm trong lịch sử trình duyệt và header Referer).
 */
export function gioThanhDiaChi(gio: ReadonlyMap<string, number>): string {
  return [...gio].filter(([k, n]) => /^[a-z0-9]+(?:-[a-z0-9]+)*_[0-9]{2,4}$/.test(k) && laSoGoi(n))
    .map(([k, n]) => `${k}=${n}`).join('&');
}

/**
 * Menu gọn cho thuộc tính data-menu của form (script đọc để tính đơn): bỏ mô tả và cách dùng — script không cần,
 * trang đỡ nặng. Không sửa menu gốc (máy chủ còn dùng mô tả để dựng thẻ).
 */
export function rutGonMenu(menu: readonly SanPhamMua[]): SanPhamMua[] {
  return menu.map(sp => ({ ...sp, moTa: null, cachDung: null, goi: sp.goi.map(g => ({ ...g })) }));
}

// -----------------------------------------------------------------------------
// HÓA ĐƠN ĐỎ (0125, Khánh 18/11/2026) — khách chọn "Cần xuất hóa đơn đỏ" thì điền tên đơn vị, mã số thuế, địa chỉ
// đơn vị, email nhận hóa đơn. Cùng luật với tao_don_mua_thit và ràng buộc don_mua_thit_hoa_don của
// crm/supabase/migrations/0125_mua_thit_hoa_don_do.sql — crm/test/test-mua-thit-hoa-don.mjs chạy cả hai bên trên cùng
// một bảng chữ. Máy chủ (lib/dat-hang-mua-thit.ts) chặn sớm; script của trang báo lỗi sát ô trước khi gửi.
// -----------------------------------------------------------------------------

/** Độ dài tối đa — như tao_don_mua_thit (0125) và maxlength của ô. Mã số thuế: 20 ký tự gõ (còn dấu cách). */
export const HOA_DON_TOI_DA = { tenDonVi: 200, maSoThue: 20, diaChi: 300, email: 200 } as const;

/** Mọi kiểu gạch ngang khách gõ / dán (bàn phím điện thoại, Word, PDF): U+2010–U+2015, U+2212 → "-". */
const GACH_NGANG = /[‐-―−]/g;
/** Bỏ khỏi mã số thuế: dấu cách (cả cách không ngắt U+00A0, cách hẹp U+202F, ký tự rộng 0 U+200B, U+FEFF), tab, xuống dòng, dấu chấm. */
const BO_KHOI_MA_SO_THUE = /[ \t\r\n  ​﻿.]/g;
/** Mã số thuế đã chuẩn hóa: 10 số (doanh nghiệp, tổ chức), hoặc 10 số - 3 số (đơn vị phụ thuộc, chi nhánh). */
export const MAU_MA_SO_THUE = /^[0-9]{10}(?:-[0-9]{3})?$/;
/** Email nhận hóa đơn: phần trước @ chữ không dấu, số, . _ % + -; tên miền có ít nhất một dấu chấm, đuôi từ hai chữ. */
export const MAU_EMAIL_HOA_DON = /^[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/;

/**
 * Mã số thuế như database lưu: mọi kiểu gạch ngang thành "-"; bỏ dấu cách, dấu chấm; 13 số liền nhau thành
 * "0123456789-001". Không đoán thêm gì — chuỗi khác để nguyên cho MAU_MA_SO_THUE từ chối.
 */
export function chuanHoaMaSoThue(v: string): string {
  const s = v.replace(GACH_NGANG, '-').replace(BO_KHOI_MA_SO_THUE, '');
  return /^[0-9]{13}$/.test(s) ? `${s.slice(0, 10)}-${s.slice(10)}` : s;
}

/** Lỗi của ô hóa đơn (null = đúng). Chỉ gọi khi khách đã chọn "Cần xuất hóa đơn đỏ". Địa chỉ đơn vị không bắt buộc. */
export type LoiHoaDon = 'thieuTenDonVi' | 'saiMaSoThue' | 'thieuEmailHoaDon' | 'saiEmailHoaDon';
export function loiOHoaDon(o: 'tenDonVi' | 'maSoThue' | 'email', giaTri: string): LoiHoaDon | null {
  const v = giaTri.trim();
  if (o === 'tenDonVi') return v ? null : 'thieuTenDonVi';
  if (o === 'maSoThue') return MAU_MA_SO_THUE.test(chuanHoaMaSoThue(v)) ? null : 'saiMaSoThue';
  if (!v) return 'thieuEmailHoaDon';
  return v.length <= HOA_DON_TOI_DA.email && MAU_EMAIL_HOA_DON.test(v) ? null : 'saiEmailHoaDon';
}

/** Câu lỗi của ô hóa đơn, ba thứ tiếng — máy chủ (chặn sớm) và script của trang (lỗi sát ô) dùng chung. */
export const CAU_HOA_DON = {
  thieuTenDonVi: {
    vi: 'Vui lòng điền tên đơn vị để xuất hóa đơn đỏ.',
    en: 'Please enter the company name for the VAT invoice.',
    ko: '세금계산서에 들어갈 회사 이름을 입력해 주세요.',
  },
  saiMaSoThue: {
    vi: 'Mã số thuế gồm 10 số, hoặc 10 số - 3 số với chi nhánh. Vui lòng kiểm tra lại.',
    en: 'The tax code is 10 digits, or 10 digits - 3 digits for a branch. Please check it.',
    ko: '세금 코드는 숫자 10자리, 지점은 10자리-3자리예요. 다시 확인해 주세요.',
  },
  thieuEmailHoaDon: {
    vi: 'Vui lòng điền email nhận hóa đơn.',
    en: 'Please enter the email address for the VAT invoice.',
    ko: '세금계산서를 받을 이메일 주소를 입력해 주세요.',
  },
  saiEmailHoaDon: {
    vi: 'Email nhận hóa đơn chưa đúng dạng. Vui lòng kiểm tra lại.',
    en: 'The email address for the VAT invoice does not look right. Please check it.',
    ko: '세금계산서를 받을 이메일 주소 형식이 맞지 않아요. 다시 확인해 주세요.',
  },
} as const satisfies Record<LoiHoaDon, BaTieng<string>>;
