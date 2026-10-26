/**
 * ĐƠN MUA THỊT VỀ — GIỎ, TẠM TÍNH VÀ TIN ĐƠN (hàm thuần, chạy cả ở máy chủ lẫn trong trình duyệt)
 * ==============================================================================================
 *
 * Trang /mua-thit-ve (en, ko: /buy-meat) dựng "Đơn của bạn" và tin đơn hai lần bằng CÙNG các hàm này:
 *   · máy chủ — component đọc giỏ từ địa chỉ trang (form GET, chạy được cả khi tắt JavaScript);
 *   · trình duyệt — script của trang đọc giỏ từ form mỗi lần khách đổi số gói.
 * Một nguồn sự thật cho cả hai đường nên tin khách chép luôn khớp số trên trang.
 *
 * Vì chạy trong trình duyệt, file này chỉ nạp kiểu (import type, bị xóa khi dựng) và gioVnTuMs của gio-vn.ts
 * (file đó không nạp gì): không kéo supabase-js, không đọc database, không chạm DOM, không gọi mạng — và không
 * đọc đồng hồ: giờ soạn tin là tham số (msSoan), nên kiểm thử cho ra đúng từng chữ ở mọi mốc giờ.
 * crm/test/test-mua-thit-ve-web.mjs giữ những điều đó.
 *
 * Luật đã chốt:
 *   · Giá là giá gói quán đã công bố (giá chủ đã chốt, Khánh 26/10/2026 — quyết định 1). Tin đơn vẫn ghi "Tạm tính
 *     theo giá trên web" và nhờ quán xác nhận tổng tiền: khách sửa được tin trước khi gửi, nhân viên trực Zalo OA
 *     luôn tính lại theo FABi.
 *   · Gói thịt ghi "khoảng 200 g" (quyết định 2); số gam không dấu ngăn ở mọi thứ tiếng ("1000 g" — "1.000 g" ở
 *     trang tiếng Anh đọc thành một gam). Hộp kim chi ghi khối lượng tịnh ("Hộp 500 g").
 *   · Tin đơn luôn tiếng Việt, tên tiếng Việt (nhân viên trực OA đọc tiếng Việt); trang en / ko thêm một dòng cho
 *     nhân viên biết khách đọc tiếng gì. Không mã đơn: gửi hai lần là hai tin giống hệt từng chữ (cùng dòng giờ
 *     soạn), nhân viên nhận ra. Tiêu đề không mở đầu bằng chữ "đặt" (bot Messenger đưa tin "ĐẶT…" vào luồng đặt bàn).
 *   · Số tiền chỉ ở dạng "400.000 đ" (dấu cách thường), và trên trang chỉ in trong phần tử có data-tien — bộ quét
 *     chữ cấm miễn đúng chỗ đó. CHU_DON không chứa số tiền: trang ghép chữ + <span data-tien> riêng.
 *
 * Luồng chép tin rồi dán vào chat Zalo là TẠM (quyết định 4 — sau này đặt thẳng trong Mini App): link và cách
 * chuyển giỏ nằm ở dich-dat-hang.ts, không ở đây. File này chỉ tính đơn và soạn chữ.
 */
import type { NgonNgu } from './noi-dung.ts';
import { gioVnTuMs } from './gio-vn.ts';

export type DonVi = 'goi' | 'hop';
export type BaoQuan = 'mat' | 'giu_lanh' | 'dong_lanh';
export type CachNhan = 'quay' | 'giao';

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
  /** Tên tiếng Việt hiện tại — cho tin đơn. */
  tenVi: string;
  moTa: string | null;
  cachDung: string | null;
  goi: GoiMua[];
}

/** Số gói tối đa mỗi ô chọn (0–10). Cần nhiều hơn thì khách ghi thêm vào tin (hỏi đáp của trang). */
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
export const CHU_DON = {
  /** Nhãn cỡ gói: thịt "khoảng" (quyết định 2), hộp ghi khối lượng tịnh. Số gam không dấu ngăn. */
  goiChu: {
    vi: (donVi: DonVi, n: number) => (donVi === 'hop' ? `Hộp ${n} g` : `Gói khoảng ${n} g`),
    en: (donVi: DonVi, n: number) => (donVi === 'hop' ? `${n} g box` : `Pack of about ${n} g`),
    ko: (donVi: DonVi, n: number) => (donVi === 'hop' ? `${n} g 통` : `약 ${n} g 팩`),
  },
  /** "3 gói · 1 hộp"; vế bằng 0 bỏ; cả hai bằng 0 → chuỗi rỗng (trang hiện câu giỏ rỗng). */
  dem: {
    vi: (soGoi: number, soHop: number) => noi([soGoi && `${soGoi} gói`, soHop && `${soHop} hộp`]),
    en: (soGoi: number, soHop: number) =>
      noi([soGoi && `${soGoi} ${soGoi === 1 ? 'pack' : 'packs'}`, soHop && `${soHop} ${soHop === 1 ? 'box' : 'boxes'}`]),
    ko: (soGoi: number, soHop: number) => noi([soGoi && `${soGoi}팩`, soHop && `${soHop}통`]),
  },
  /** Đầu một dòng đơn; trang ghép ngay sau nó <span data-tien>thành tiền</span> (vì vậy kết bằng "= "). */
  dongDau: {
    vi: (ten: string, goi: string, n: number) => `${ten} · ${goi} × ${n} = `,
    en: (ten: string, goi: string, n: number) => `${ten} · ${goi} × ${n} = `,
    ko: (ten: string, goi: string, n: number) => `${ten} · ${goi} × ${n} = `,
  },
  tamTinh: { vi: 'Tạm tính', en: 'Subtotal', ko: '소계' },
  donTrong: { vi: 'Chọn gói để soạn đơn', en: 'Choose packs to start your order', ko: '팩을 고르면 주문이 만들어져요' },
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

/** Nhãn gói theo thứ tiếng của trang: "Gói khoảng 200 g", "Pack of about 200 g", "약 200 g 팩"; hộp "Hộp 500 g"… */
export function nhanGoi(donVi: DonVi, soGam: number, nn: NgonNgu): string {
  return CHU_DON.goiChu[nnHopLe(nn)](donVi, soGam);
}

export interface DongDon { sanPham: SanPhamMua; goi: GoiMua; soLuong: number; thanhTien: number }

export interface Don {
  /** Theo thứ tự menu, không theo thứ tự khách chọn — cùng giỏ thì cùng tin. */
  dong: DongDon[];
  cachNhan: CachNhan;
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
 * "Tạm hết ở quầy" mà khách chọn > 0 → bỏ và đếm vào boTamHet. `nhan=giao` chỉ được nhận khi trang đang nhận giao
 * (choGiao — khóa mua_thit_giao_hang đã công bố); thiếu, lạ hay chưa nhận giao → nhận tại quầy.
 */
export function docGio(
  thamSo: Iterable<readonly [string, unknown]>, menu: readonly SanPhamMua[], choGiao: boolean,
): { gio: Map<string, number>; cachNhan: CachNhan; boTamHet: number } {
  const theoKhoa = new Map<string, GoiMua>();
  for (const sp of menu) for (const g of sp.goi) theoKhoa.set(g.khoa, g);

  const gio = new Map<string, number>();
  const daDoc = new Set<string>();
  let cachNhan: CachNhan = 'quay';
  let daDocNhan = false;
  let boTamHet = 0;
  for (const [ten, giaTri] of thamSo) {
    if (ten === 'nhan') {
      if (!daDocNhan) { daDocNhan = true; cachNhan = choGiao && giaTri === 'giao' ? 'giao' : 'quay'; }
      continue;
    }
    const g = theoKhoa.get(ten);
    if (!g || daDoc.has(ten)) continue;
    daDoc.add(ten);
    const n = docSoGoi(giaTri);
    if (!n) continue;
    if (g.tamHet) { boTamHet++; continue; }
    gio.set(ten, n);
  }
  return { gio, cachNhan, boTamHet };
}

/**
 * Đơn từ giỏ: thành tiền = số gói × giá gói; tạm tính = tổng. Dòng theo thứ tự menu. Giỏ không qua docGio cũng an
 * toàn: số ngoài 1–10 bị bỏ, gói tạm hết bị bỏ và đếm vào boTamHet.
 */
export function tinhDon(
  gio: ReadonlyMap<string, number>, cachNhan: CachNhan, menu: readonly SanPhamMua[], boTamHet = 0,
): Don {
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
  return { dong, cachNhan: cachNhan === 'giao' ? 'giao' : 'quay', soGoi, soHop, tamTinh, boTamHet: bo };
}

/** Mốc ms → "23:50 ngày 13/11/2026" theo giờ Việt Nam (gioVnTuMs, không tự cộng giờ). Mốc không hợp lệ → "". */
export function gioSoanVn(ms: number): string {
  const s = gioVnTuMs(ms);
  return s ? `${s.slice(11, 16)} ngày ${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : '';
}

/** Dòng đầu của tin đơn website — nhân viên trực Zalo OA nhận tin đơn bằng dòng này (web/README.md, mục Mua thịt về). */
export const TIEU_DE_TIN = 'MUA THỊT VỀ – BEEFTOWN · beeftown.vn';

/** Câu của tin đơn: luôn tiếng Việt, nhân viên trực OA đọc. */
const TIN = {
  soanLuc: (gio: string) => `Soạn lúc ${gio} (giờ Việt Nam)`,
  coGoi: (donVi: DonVi, soGam: number) => (donVi === 'hop' ? `hộp ${soGam} g` : `gói khoảng ${soGam} g`),
  dongLanh: ' (đông lạnh)',
  tamTinhQuay: (tien: string) => `Tạm tính theo giá trên web: ${tien}.`,
  tamTinhGiao: (tien: string) => `Tạm tính theo giá trên web: ${tien}, chưa gồm phí giao.`,
  nhanQuay: 'Nhận: tại quầy Beeftown.',
  nhanGiao: 'Nhận: giao tận nơi (mình gửi địa chỉ trong tin tiếp theo).',
  thuTieng: { en: 'Khách đọc trang tiếng Anh.', ko: 'Khách đọc trang tiếng Hàn.' } as Partial<Record<NgonNgu, string>>,
  nhoQuay: 'Nhờ quán liên hệ lại xác nhận tổng tiền và giờ nhận giúp mình.',
  nhoGiao: 'Nhờ quán liên hệ lại xác nhận tổng tiền, phí giao và giờ giao giúp mình.',
} as const;

/**
 * Tin đơn khách chép rồi gửi qua Zalo OA. Luôn tiếng Việt, xuống dòng bằng "\n", không thông tin cá nhân, không mã
 * đơn. Giỏ rỗng → "". msSoan là giờ soạn (ms) — người gọi truyền Date.now() lúc dựng; mốc không hợp lệ thì tin
 * không có dòng "Soạn lúc".
 */
export function taoTinDon(don: Don, ngonNguTrang: NgonNgu, msSoan: number): string {
  if (don.dong.length === 0) return '';
  const giao = don.cachNhan === 'giao';
  const gio = gioSoanVn(msSoan);
  const dong: string[] = [TIEU_DE_TIN];
  if (gio) dong.push(TIN.soanLuc(gio));
  for (const d of don.dong) {
    const coGoi = TIN.coGoi(d.sanPham.donVi, d.goi.soGam) + (d.sanPham.baoQuan === 'dong_lanh' ? TIN.dongLanh : '');
    dong.push(`• ${d.sanPham.tenVi}, ${coGoi}: ${d.soLuong} × ${dinhDangTien(d.goi.gia)} = ${dinhDangTien(d.thanhTien)}`);
  }
  dong.push(giao ? TIN.tamTinhGiao(dinhDangTien(don.tamTinh)) : TIN.tamTinhQuay(dinhDangTien(don.tamTinh)));
  dong.push(giao ? TIN.nhanGiao : TIN.nhanQuay);
  const thuTieng = TIN.thuTieng[nnHopLe(ngonNguTrang)];
  if (thuTieng) dong.push(thuTieng);
  dong.push(giao ? TIN.nhoGiao : TIN.nhoQuay);
  return dong.join('\n');
}

/**
 * Menu gọn cho thuộc tính data-menu của form (script đọc để tính đơn): bỏ mô tả và cách dùng — script không cần,
 * trang đỡ nặng. Không sửa menu gốc (máy chủ còn dùng mô tả để dựng thẻ).
 */
export function rutGonMenu(menu: readonly SanPhamMua[]): SanPhamMua[] {
  return menu.map(sp => ({ ...sp, moTa: null, cachDung: null, goi: sp.goi.map(g => ({ ...g })) }));
}
