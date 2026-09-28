/**
 * KHO — NHỮNG THỨ DÙNG CHUNG, THUẦN TÚY
 *
 * File này KHÔNG import gì lúc chạy (chỉ `import type`), để các bài test ở
 * crm/test nạp thẳng được bằng Node mà không cần dựng Astro. Mọi thứ ở đây là
 * hàm thuần: đọc số, định dạng số, bảng tra quyền.
 *
 * Câu mô tả từng việc (MO_TA_VIEC, GĐ8c) cho trang "Ai làm được gì".
 *
 * BẢNG TRA QUYỀN Ở ĐÂY CHỈ LÀ GƯƠNG
 *
 * Luật thật nằm ở hàm kho_vai_duoc() trong migration 0018 — database mới là
 * nơi chặn. Bản ở đây chỉ để ẩn nút cho gọn mắt, và test-kho-quyen.mjs so hai
 * bản từng dòng: lệch một vai là test đỏ.
 *
 * HAI THỨ TIẾNG (lib/ngon-ngu-noi-bo.ts)
 *
 * Bảng nhãn có bản hai thứ tiếng tên `…_NB` ({ vi, en }); bảng tên cũ (chỉ
 * tiếng Việt) dựng lại từ đó cho code và test cũ. Trang đọc nhãn bằng
 * nhanKho(BANG_NB, ma, nn). Câu báo KetQua mang thêm cauEn khi thư viện có
 * sẵn bản tiếng Anh; câu đến từ database thì trang tra dichCau() lúc hiện.
 */

import type { HaiThuTieng, NgonNguNB } from '../ngon-ngu-noi-bo.ts';

export type { HaiThuTieng, NgonNguNB };

/** Nhãn của một mã theo ngôn ngữ đang xem; mã lạ thì trả nguyên mã. */
export function nhanKho(
  bang: Readonly<Record<string, HaiThuTieng>>, ma: string | null | undefined, nn: NgonNguNB = 'vi',
): string {
  if (!ma) return '';
  return bang[ma]?.[nn] ?? ma;
}

/** Bảng hai thứ tiếng → bảng chỉ tiếng Việt (tên cũ, giữ cho code và test cũ). */
function chiVi<K extends string>(bang: Readonly<Record<K, HaiThuTieng>>): Record<K, string> {
  const ra = {} as Record<K, string>;
  for (const k in bang) ra[k] = bang[k].vi;
  return ra;
}

export type VaiTro =
  | 'chu_so_huu' | 'quan_ly' | 'thu_ngan' | 'marketing'
  | 'thu_kho' | 'nhan_vien_quay' | 'ke_toan'
  // Hai vai máy (0029): tablet dùng chung (GĐ5d) và máy đồng bộ iPOS (GĐ7a).
  | 'may_chung' | 'may_ipos';

export type ViecKho =
  | 'xem' | 'xem_gia' | 'nhap' | 'duyet' | 'duyet_nhap' | 'pha_loc' | 'van_hanh'
  | 'ke_toan' | 'danh_muc' | 'ncc' | 'cai_dat_goc' | 'may_chung' | 'dong_bo_ban';

export const QUYEN_KHO: Record<ViecKho, readonly VaiTro[]> = {
  xem:         ['chu_so_huu', 'quan_ly', 'thu_kho', 'nhan_vien_quay', 'ke_toan'],
  // Thủ kho không thấy tiền (0031): chỉ chụp hóa đơn, cân, đếm.
  xem_gia:     ['chu_so_huu', 'quan_ly', 'ke_toan'],
  nhap:        ['chu_so_huu', 'quan_ly', 'thu_kho'],
  duyet:       ['chu_so_huu', 'quan_ly'],
  // Điền giá, duyệt / từ chối phiếu nhập — kế toán cũng làm được (0031).
  duyet_nhap:  ['chu_so_huu', 'quan_ly', 'ke_toan'],
  pha_loc:     ['chu_so_huu', 'quan_ly', 'thu_kho'],
  van_hanh:    ['chu_so_huu', 'quan_ly', 'thu_kho', 'nhan_vien_quay'],
  ke_toan:     ['chu_so_huu', 'quan_ly', 'ke_toan'],
  danh_muc:    ['chu_so_huu', 'quan_ly'],
  ncc:         ['chu_so_huu', 'quan_ly', 'ke_toan'],
  cai_dat_goc: ['chu_so_huu'],
  // Tài khoản của máy tính bảng dùng chung (0034): chỉ gọi được hàm kho_may_*,
  // không đọc được gì trong kho. Không vai người nào có quyền này.
  may_chung:   ['may_chung'],
  // Đồng bộ bán hàng iPOS (0037): cron chạy bằng tài khoản máy may_ipos (chỉ có
  // đúng việc này), quản lý / chủ bấm "Cập nhật ngay" bằng phiên của mình.
  dong_bo_ban: ['chu_so_huu', 'quan_ly', 'may_ipos'],
};

/** Vai này có được làm việc này trong kho không (để ẩn/hiện nút). */
export function duoc(vai: string | null | undefined, viec: ViecKho): boolean {
  return !!vai && (QUYEN_KHO[viec] as readonly string[]).includes(vai);
}

/** Vai chỉ dùng kho, không dùng CRM — trang /noi-bo chuyển họ thẳng vào kho. */
export const VAI_CHI_KHO: readonly VaiTro[] = ['thu_kho', 'nhan_vien_quay', 'ke_toan'];

export const TEN_VAI_KHO_NB: Record<string, HaiThuTieng> = {
  thu_kho: { vi: 'Thủ kho', en: 'Storekeeper' },
  nhan_vien_quay: { vi: 'NV quầy/bếp', en: 'Counter/kitchen staff' },
  ke_toan: { vi: 'Kế toán', en: 'Accountant' },
};
export const TEN_VAI_KHO: Record<string, string> = chiVi(TEN_VAI_KHO_NB);

// -----------------------------------------------------------------------------
// MA TRẬN QUYỀN BẰNG LỜI (GĐ8c) — trang /noi-bo/kho/cai-dat/quyen
// -----------------------------------------------------------------------------
// Mỗi việc trong QUYEN_KHO một tên và một câu nói việc đó cho làm gì. Kiểu
// Record<ViecKho, …> bắt buộc đủ mọi việc (thêm việc mới mà quên câu là lỗi
// kiểu); test-kho-giao-dien nhóm 16 kiểm thêm lần nữa.
export const MO_TA_VIEC_NB: Record<ViecKho, { ten: HaiThuTieng; moTa: HaiThuTieng }> = {
  xem: {
    ten: { vi: 'Xem kho', en: 'View stock' },
    moTa: { vi: 'Mở phần kho: tồn kho, thẻ kho, quét nhãn, danh sách phiếu — số kg, số gói, hạn dùng.',
            en: 'Open the stock area: stock on hand, stock cards, label scanning, document lists — kg, packs, use-by dates.' },
  },
  xem_gia: {
    ten: { vi: 'Xem giá tiền', en: 'See prices' },
    moTa: { vi: 'Thấy giá nhập, giá vốn, tiền hàng và các báo cáo có tiền.',
            en: 'See purchase prices, costs, stock value and the reports that show money.' },
  },
  nhap: {
    ten: { vi: 'Nhận hàng', en: 'Receive goods' },
    moTa: { vi: 'Lập phiếu nhận hàng (chụp hóa đơn, cân từng món), đơn đặt hàng nháp, tồn đầu kỳ, ghi kg khi trả hàng nhà cung cấp.',
            en: 'Create receiving notes (photograph the invoice, weigh each item), draft purchase orders, opening stock, record the kg when goods go back to a supplier.' },
  },
  duyet: {
    ten: { vi: 'Duyệt', en: 'Approve' },
    moTa: { vi: 'Duyệt báo hủy và kiểm kê, xử lý hàng ra quầy bị thiếu, hủy phiếu đã duyệt, xem cảnh báo thu hồi thấp.',
            en: 'Approve write-offs and stocktakes, handle short deliveries to the counter, cancel approved documents, review low-yield alerts.' },
  },
  duyet_nhap: {
    ten: { vi: 'Điền giá, duyệt phiếu nhập', en: 'Price and approve goods receipts' },
    moTa: { vi: 'Điền đơn giá theo hóa đơn rồi duyệt hoặc trả phiếu nhận hàng về cho người lập.',
            en: 'Enter unit prices from the invoice, then approve the receiving note or send it back to the person who made it.' },
  },
  pha_loc: {
    ten: { vi: 'Pha lóc', en: 'Butchery' },
    moTa: { vi: 'Tạo phiên pha lóc, quét nhãn các phần cắt ra, chốt phiên.',
            en: 'Start butchery sessions, scan the labels of the cuts, close the session.' },
  },
  van_hanh: {
    ten: { vi: 'Việc ở quầy, bếp', en: 'Counter and kitchen work' },
    moTa: { vi: 'Mang hàng ra quầy, nhận hàng ở quầy, xuất bếp, xuất khác, báo hủy, kiểm kê, đếm quầy cuối ngày.',
            en: 'Bring goods to the counter, receive them at the counter, issue to the kitchen, other issues, report write-offs, stocktakes, end-of-day counter count.' },
  },
  ke_toan: {
    ten: { vi: 'Công nợ, thanh toán', en: 'Payables and payments' },
    moTa: { vi: 'Đối chiếu hóa đơn, trả tiền nhà cung cấp, sổ thanh toán, biên bản đối chiếu, xuất file MISA.',
            en: 'Reconcile invoices, pay suppliers, payment ledger, reconciliation statements, MISA export file.' },
  },
  danh_muc: {
    ten: { vi: 'Danh mục', en: 'Catalog' },
    moTa: { vi: 'Sửa mặt hàng (cả sửa nhanh nhiều món), công thức pha lóc, vị trí, lý do, định lượng món, ngưỡng cảnh báo.',
            en: 'Edit items (including quick edit of many items), butchery recipes, locations, reasons, dish recipes, alert thresholds.' },
  },
  ncc: {
    ten: { vi: 'Nhà cung cấp', en: 'Suppliers' },
    moTa: { vi: 'Thêm, sửa nhà cung cấp: mã số thuế, tài khoản ngân hàng, số ngày được nợ.',
            en: 'Add and edit suppliers: tax code, bank account, credit days.' },
  },
  cai_dat_goc: {
    ten: { vi: 'Cài đặt gốc', en: 'Core settings' },
    moTa: { vi: 'Cách tính giá vốn, nguồn số bán, tạo và khóa tài khoản nhân viên.',
            en: 'Costing method, source of sales figures, create and lock staff accounts.' },
  },
  may_chung: {
    ten: { vi: 'Máy dùng chung', en: 'Shared tablet' },
    moTa: { vi: 'Chỉ tài khoản của máy tính bảng: hiện danh sách người đã gắn và kiểm PIN. Không đọc được gì trong kho.',
            en: 'Only the shared tablet account: shows who is linked to the tablet and checks PINs. Cannot read anything in stock.' },
  },
  dong_bo_ban: {
    ten: { vi: 'Đồng bộ iPOS', en: 'iPOS sync' },
    moTa: { vi: 'Ghi hóa đơn bán iPOS gửi sang để trừ kho ở quầy, thử lại dòng chờ và đọc thực đơn iPOS (máy iPOS tự chạy; quản lý, chủ bấm "Cập nhật ngay").',
            en: 'Record the iPOS sales invoices sent over to deduct counter stock, retry waiting lines and read the iPOS menu (the iPOS device runs it; managers and the owner can press "Update now").' },
  },
};
export const MO_TA_VIEC: Record<ViecKho, { ten: string; moTa: string }> = Object.fromEntries(
  Object.entries(MO_TA_VIEC_NB).map(([k, v]) => [k, { ten: v.ten.vi, moTa: v.moTa.vi }]),
) as Record<ViecKho, { ten: string; moTa: string }>;

/** Vai hiện trên trang quyền, đúng thứ tự cột. Hai vai máy để cuối. */
export const VAI_BANG_QUYEN: readonly VaiTro[] = [
  'chu_so_huu', 'quan_ly', 'ke_toan', 'thu_kho', 'nhan_vien_quay', 'may_chung', 'may_ipos',
];

export const TEN_VAI_DAY_NB: Record<string, HaiThuTieng> = {
  chu_so_huu: { vi: 'Chủ quán', en: 'Owner' },
  quan_ly: { vi: 'Quản lý', en: 'Manager' },
  ke_toan: { vi: 'Kế toán', en: 'Accountant' },
  thu_kho: { vi: 'Thủ kho', en: 'Storekeeper' },
  nhan_vien_quay: { vi: 'NV quầy/bếp', en: 'Counter/kitchen staff' },
  may_chung: { vi: 'Máy dùng chung', en: 'Shared tablet' },
  may_ipos: { vi: 'Máy đồng bộ iPOS', en: 'iPOS sync device' },
  thu_ngan: { vi: 'Thu ngân', en: 'Cashier' },
  marketing: { vi: 'Marketing', en: 'Marketing' },
};
export const TEN_VAI_DAY: Record<string, string> = chiVi(TEN_VAI_DAY_NB);

/** Các việc vai này làm được, theo thứ tự của QUYEN_KHO. */
export function viecCuaVai(vai: string): ViecKho[] {
  return (Object.keys(QUYEN_KHO) as ViecKho[]).filter(v => duoc(vai, v));
}

const CAU_TOM_TAT: Record<'khongDung' | 'khongGia' | 'coGia', HaiThuTieng> = {
  khongDung: { vi: 'không dùng kho.', en: 'does not use stock.' },
  khongGia: { vi: ' KHÔNG thấy giá tiền.', en: ' Does NOT see prices.' },
  coGia: { vi: ' Thấy giá tiền.', en: ' Sees prices.' },
};

/**
 * Một câu cho mỗi vai: "Thủ kho: xem kho, nhận hàng, pha lóc, việc ở quầy, bếp.
 * KHÔNG thấy giá tiền." Vai không có việc kho nào: "không dùng kho".
 */
export function tomTatVai(vai: string, nn: NgonNguNB = 'vi'): string {
  const ten = TEN_VAI_DAY_NB[vai]?.[nn] ?? vai;
  const ds = viecCuaVai(vai);
  if (ds.length === 0) return `${ten}: ${CAU_TOM_TAT.khongDung[nn]}`;
  const lam = ds.filter(v => v !== 'xem_gia').map(v => MO_TA_VIEC_NB[v].ten[nn].toLowerCase());
  const gia = duoc(vai, 'xem') && !duoc(vai, 'xem_gia') ? CAU_TOM_TAT.khongGia[nn] : '';
  const tien = duoc(vai, 'xem_gia') ? CAU_TOM_TAT.coGia[nn] : '';
  return `${ten}: ${lam.join(', ')}.${gia}${tien}`;
}

/**
 * Kết quả một thao tác, để hiện câu báo. cau là tiếng Việt (test và code cũ đọc
 * nó); cauEn là bản tiếng Anh khi thư viện có sẵn — không có thì trang tra
 * dichCau(cau) lúc hiện (câu từ database đi đường này).
 */
export interface KetQua { ok: boolean; cau: string; cauEn?: string }

/** Câu hai thứ tiếng → KetQua. */
export function kqHai(ok: boolean, c: HaiThuTieng): KetQua {
  return { ok, cau: c.vi, cauEn: c.en };
}

/**
 * Lỗi → KetQua. Có câu từ database / mạng thì dùng câu đó (trang dịch lúc hiện);
 * không có thì dùng câu mặc định hai thứ tiếng.
 */
export function kqLoi(e: unknown, macDinh: HaiThuTieng = LOI_KHO_CHUNG.macDinh): KetQua {
  const cau = cauLoiKho(e, macDinh.vi);
  return cau === macDinh.vi ? { ok: false, cau, cauEn: macDinh.en } : { ok: false, cau };
}

// -----------------------------------------------------------------------------
// ĐỌC SỐ TỪ Ô NHẬP
// -----------------------------------------------------------------------------
// Người Việt gõ "1,5" kg; bàn phím điện thoại tiếng Anh gõ "1.5". Cả hai đều
// là một ký rưỡi. Một mẻ thịt ở quán không bao giờ tới nghìn kg, nên dấu chấm
// hay phẩy trong ô KG luôn là dấu thập phân — không có chuyện "1.250" nghĩa là
// một nghìn hai trăm năm mươi ký.
//
// Ô TIỀN thì ngược lại: đồng không có số lẻ, nên chấm, phẩy, khoảng trắng và
// chữ "đ" đều là dấu phân cách hàng nghìn và bị bỏ đi: "450.000đ" = 450000.
// -----------------------------------------------------------------------------

/** "1,5" | "1.5" | "12" → số kg, tối đa 3 số lẻ. Trống → null. Sai → NaN. */
export function docKg(v: unknown): number | null {
  const s = String(v ?? '').trim().replace(/\s+/g, '').replace(/kg$/i, '');
  if (s === '') return null;
  if (!/^\d{1,6}([.,]\d{1,3})?$/.test(s)) return NaN;
  return Number(s.replace(',', '.'));
}

/** "450.000đ" | "450,000" | "450000" → 450000. Trống → null. Sai → NaN. */
export function docTien(v: unknown): number | null {
  const s = String(v ?? '').trim().replace(/[\s.,]/g, '').replace(/đ$|d$|vnd$/i, '');
  if (s === '') return null;
  if (!/^\d{1,13}$/.test(s)) return NaN;
  return Number(s);
}

/** Số nguyên trong khoảng. Trống → null. Sai → NaN. */
export function docSoNguyen(v: unknown, min: number, max: number): number | null {
  const s = String(v ?? '').trim().replace(/[\s.]/g, '');
  if (s === '') return null;
  if (!/^-?\d{1,9}$/.test(s)) return NaN;
  const n = Number(s);
  return n >= min && n <= max ? n : NaN;
}

/** Số thập phân bất kỳ (cho ô thông tin kiểu số): "1,5" → 1.5. */
export function docSoThapPhan(v: unknown): number | null {
  const s = String(v ?? '').trim().replace(/\s+/g, '');
  if (s === '') return null;
  if (!/^-?\d{1,12}([.,]\d{1,6})?$/.test(s)) return NaN;
  return Number(s.replace(',', '.'));
}

/** Ngày dạng YYYY-MM-DD có thật. Trống → null. Sai → undefined. */
export function docNgay(v: unknown): string | null | undefined {
  const s = String(v ?? '').trim();
  if (s === '') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s ? s : undefined;
}

export function laUuid(v: unknown): v is string {
  return typeof v === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

// -----------------------------------------------------------------------------
// ĐỊNH DẠNG ĐỂ HIỂN THỊ
// -----------------------------------------------------------------------------
// Tiếng Anh: dấu chấm thập phân, phẩy ngăn nghìn ("1.25", "450,000 ₫") — người
// đọc tiếng Anh thấy "1,25" dễ hiểu nhầm thành một trăm hai lăm.
const VUNG_SO: Record<NgonNguNB, string> = { vi: 'vi-VN', en: 'en-US' };
const KY_HIEU_DONG: Record<NgonNguNB, string> = { vi: ' đ', en: ' ₫' };

/** 1.25 → "1,25" · 12 → "12" · 0.3456 → "0,346" (tiếng Anh: "1.25", "0.346") */
export function dinhDangKg(n: number | string | null | undefined, nn: NgonNguNB = 'vi'): string {
  if (n === null || n === undefined || n === '') return '—';
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return x.toLocaleString(VUNG_SO[nn], { maximumFractionDigits: 3 });
}

/** 450000 → "450.000 đ" (tiếng Anh: "450,000 ₫") */
export function dinhDangTien(n: number | string | null | undefined, nn: NgonNguNB = 'vi'): string {
  if (n === null || n === undefined || n === '') return '—';
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return Math.round(x).toLocaleString(VUNG_SO[nn]) + KY_HIEU_DONG[nn];
}

/** 70.4567 → "70,5%" (tiếng Anh: "70.5%") */
export function dinhDangPhanTram(n: number | null | undefined, soLe = 1, nn: NgonNguNB = 'vi'): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return n.toLocaleString(VUNG_SO[nn], { maximumFractionDigits: soLe, minimumFractionDigits: soLe }) + '%';
}

/** "2026-09-25" → "25/09/2026" */
export function dinhDangNgay(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [nam, thang, ngay] = iso.slice(0, 10).split('-');
  return nam && thang && ngay ? `${ngay}/${thang}/${nam}` : iso;
}

/** "2026-09-25" → "25/09" */
export function dinhDangNgayNgan(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [, thang, ngay] = iso.slice(0, 10).split('-');
  return thang && ngay ? `${ngay}/${thang}` : iso;
}

/**
 * Thời điểm (timestamptz từ database) → "25/09 14:30" giờ Việt Nam.
 * Worker chạy giờ UTC, nên cộng 7 tiếng bằng tay — cùng cách với hom_nay_vn().
 */
export function dinhDangThoiDiem(ts: string | null | undefined): string {
  if (!ts) return '—';
  const t = new Date(ts);
  if (Number.isNaN(t.getTime())) return '—';
  const vn = new Date(t.getTime() + 7 * 60 * 60 * 1000).toISOString();
  return `${vn.slice(8, 10)}/${vn.slice(5, 7)} ${vn.slice(11, 16)}`;
}

/** Ngày hôm nay theo giờ Việt Nam (YYYY-MM-DD) và cộng ngày — một chỗ duy nhất ở gio-vn.ts. */
export { homNayVn, congNgay } from '../gio-vn.ts';

// -----------------------------------------------------------------------------
// CHIA TIỀN KHÔNG LỆCH MỘT ĐỒNG — bản soi gương của kho_chia_so_du_lon_nhat()
// -----------------------------------------------------------------------------
/**
 * Chia `tong` (số nguyên) theo trọng số; tổng các phần luôn đúng bằng `tong`.
 * Chỉ dùng để XEM TRƯỚC trên trang — con số thật do database tính lúc duyệt.
 */
export function chiaSoDuLonNhat(tong: number, trongSo: number[]): number[] {
  const n = trongSo.length;
  if (n === 0) return [];
  let ts = trongSo.map(x => (Number.isFinite(x) && x > 0 ? x : 0));
  let tongTs = ts.reduce((a, b) => a + b, 0);
  if (tongTs === 0) { ts = ts.map(() => 1); tongTs = n; }
  const phan = ts.map(x => (tong * x) / tongTs);
  const ra = phan.map(p => Math.floor(p));
  const du = tong - ra.reduce((a, b) => a + b, 0);
  const thuTu = phan
    .map((p, i) => ({ i, le: p - Math.floor(p) }))
    .sort((a, b) => b.le - a.le || a.i - b.i);
  for (let k = 0; k < du && k < n; k++) ra[thuTu[k].i] += 1;
  return ra;
}

// -----------------------------------------------------------------------------
// TÊN MÁY TỪ TÊN TIẾNG VIỆT
// -----------------------------------------------------------------------------
/** "Thăn ngoại cắt lát" → "than ngoai cat lat" */
export function boDau(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

/** Gợi ý mã mặt hàng: "Thăn ngoại cắt lát" → "THAN-NGOAI-CAT-LAT" (tối đa 30 ký tự). */
export function goiYMa(ten: string): string {
  const s = boDau(ten).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s.slice(0, 30).replace(/-+$/, '') || 'MH';
}

// -----------------------------------------------------------------------------
// NHÃN HIỂN THỊ
// -----------------------------------------------------------------------------
export const TEN_LOAI_MAT_HANG_NB: Record<string, HaiThuTieng> = {
  tang: { vi: 'Tảng nhập', en: 'Primal (bought in)' },
  phan_cat: { vi: 'Phần cắt', en: 'Cut' },
  phu_pham: { vi: 'Phụ phẩm', en: 'By-product' },
};
export const TEN_LOAI_MAT_HANG: Record<string, string> = chiVi(TEN_LOAI_MAT_HANG_NB);

export const TEN_LOAI_VI_TRI_NB: Record<string, HaiThuTieng> = {
  kho: { vi: 'Kho', en: 'Store' },
  quay: { vi: 'Quầy', en: 'Counter' },
  cho_huy: { vi: 'Chờ hủy', en: 'Awaiting write-off' },
  // 0032: hàng thủ kho đang mang ra, quầy chưa bấm nhận — không phải chỗ để hàng.
  dang_chuyen: { vi: 'Đang mang ra quầy', en: 'On the way to the counter' },
};
export const TEN_LOAI_VI_TRI: Record<string, string> = chiVi(TEN_LOAI_VI_TRI_NB);

export const TEN_XU_LY_NB: Record<string, HaiThuTieng> = {
  nhap_kho: { vi: 'Nhập kho', en: 'Into stock' },
  chuyen_bep: { vi: 'Chuyển bếp', en: 'To the kitchen' },
  bo: { vi: 'Bỏ', en: 'Discard' },
};
export const TEN_XU_LY: Record<string, string> = chiVi(TEN_XU_LY_NB);

export const TEN_KIEU_TRUONG_NB: Record<string, HaiThuTieng> = {
  chu: { vi: 'Chữ', en: 'Text' },
  so: { vi: 'Số', en: 'Number' },
  ngay: { vi: 'Ngày', en: 'Date' },
  chon: { vi: 'Chọn trong danh sách', en: 'Pick from a list' },
  co_khong: { vi: 'Có / Không', en: 'Yes / No' },
};
export const TEN_KIEU_TRUONG: Record<string, string> = chiVi(TEN_KIEU_TRUONG_NB);

export const TEN_DOI_TUONG_TRUONG_NB: Record<string, HaiThuTieng> = {
  mat_hang: { vi: 'Mặt hàng', en: 'Item' },
  nha_cung_cap: { vi: 'Nhà cung cấp', en: 'Supplier' },
  phieu_nhap: { vi: 'Phiếu nhập', en: 'Goods receipt' },
  lo_hang: { vi: 'Từng dòng hàng nhập (lô)', en: 'Each received line (lot)' },
};
export const TEN_DOI_TUONG_TRUONG: Record<string, string> = chiVi(TEN_DOI_TUONG_TRUONG_NB);

/** Trạng thái chứng từ → [nhãn, lớp CSS của nb-nhan]. */
export const TRANG_THAI_CHUNG_TU_NB: Record<string, [HaiThuTieng, string]> = {
  nhap: [{ vi: 'Nháp', en: 'Draft' }, 'nhap'],
  cho_duyet: [{ vi: 'Chờ duyệt', en: 'Awaiting approval' }, 'cho'],
  da_duyet: [{ vi: 'Đã duyệt', en: 'Approved' }, 'song'],
  tu_choi: [{ vi: 'Bị từ chối', en: 'Rejected' }, 'tat'],
  da_huy: [{ vi: 'Đã hủy', en: 'Cancelled' }, 'tat'],
  da_chot: [{ vi: 'Đã chốt', en: 'Closed' }, 'song'],
  da_ghi: [{ vi: 'Đã ghi', en: 'Recorded' }, 'song'],
  dang_dem: [{ vi: 'Đang đếm', en: 'Counting' }, 'nhap'],
  // Phiếu chuyển ra quầy khi quầy phải bấm nhận (0032)
  dang_chuyen: [{ vi: 'Đang mang ra', en: 'On the way' }, 'cho'],
  da_nhan: [{ vi: 'Quầy đã nhận', en: 'Received at counter' }, 'song'],
  nhan_thieu: [{ vi: 'Nhận thiếu', en: 'Received short' }, 'cho'],
  da_tra_ve: [{ vi: 'Đã trả về kho', en: 'Returned to store' }, 'tat'],
  // Trả hàng NCC hai bước (0040): thủ kho đã ghi kg, chờ kế toán xác nhận số tiền
  cho_xac_nhan_tien: [{ vi: 'Chờ kế toán xác nhận', en: 'Awaiting accountant' }, 'cho'],
  // Yêu cầu của quầy (0032)
  cho: [{ vi: 'Chờ mang ra', en: 'Waiting' }, 'cho'],
  dang_lam: [{ vi: 'Đang mang ra', en: 'On the way' }, 'nhap'],
  xong: [{ vi: 'Xong', en: 'Done' }, 'song'],
  huy: [{ vi: 'Đã hủy', en: 'Cancelled' }, 'tat'],
};
export const TRANG_THAI_CHUNG_TU: Record<string, [string, string]> = Object.fromEntries(
  Object.entries(TRANG_THAI_CHUNG_TU_NB).map(([k, [ten, lop]]) => [k, [ten.vi, lop]]),
);

/** Nhãn và lớp CSS của một trạng thái chứng từ theo ngôn ngữ; trạng thái lạ → [mã, ''] . */
export function trangThaiKho(ma: string | null | undefined, nn: NgonNguNB = 'vi'): [string, string] {
  const t = ma ? TRANG_THAI_CHUNG_TU_NB[ma] : undefined;
  return t ? [t[0][nn], t[1]] : [ma ?? '', ''];
}

export const TEN_LOAI_SO_CAI_NB: Record<string, HaiThuTieng> = {
  nhap: { vi: 'Nhập', en: 'Received' },
  pha_loc_vao: { vi: 'Đem pha lóc', en: 'Into butchery' },
  pha_loc_ra: { vi: 'Pha lóc ra', en: 'From butchery' },
  chuyen_di: { vi: 'Chuyển đi', en: 'Transfer out' },
  chuyen_den: { vi: 'Chuyển đến', en: 'Transfer in' },
  ban: { vi: 'Bán', en: 'Sale' },
  xuat_bep: { vi: 'Xuất bếp', en: 'To kitchen' },
  huy: { vi: 'Hủy', en: 'Write-off' },
  kiem_ke: { vi: 'Chênh lệch kiểm kê', en: 'Stocktake difference' },
  hao_hut: { vi: 'Hao hụt cân', en: 'Weight loss' },
  dao_nguoc: { vi: 'Đảo ngược', en: 'Reversal' },
  tra_ncc: { vi: 'Trả nhà cung cấp', en: 'Returned to supplier' },
  xuat_khac: { vi: 'Xuất khác', en: 'Other issue' },
  dau_ky: { vi: 'Tồn đầu kỳ', en: 'Opening stock' },   // dòng đầu của thẻ kho (kho_the_kho, 0033) — không phải loại sổ
};
export const TEN_LOAI_SO_CAI: Record<string, string> = chiVi(TEN_LOAI_SO_CAI_NB);

/** Loại phiếu nhập (kho_phieu_nhap.loai). no_dau (0035): nợ đầu kỳ — chỉ số tiền, không hàng. */
export const TEN_LOAI_PHIEU_NHAP_NB: Record<string, HaiThuTieng> = {
  mua: { vi: 'Nhập mua', en: 'Purchase' },
  ton_dau: { vi: 'Tồn đầu kỳ', en: 'Opening stock' },
  no_dau: { vi: 'Nợ đầu kỳ', en: 'Opening balance' },
};
export const TEN_LOAI_PHIEU_NHAP: Record<string, string> = chiVi(TEN_LOAI_PHIEU_NHAP_NB);

/**
 * Các bước màn Thiết lập, đúng thứ tự hiện (khóa = khóa trong kết quả
 * kho_tien_do_thiet_lap, 0035). boQua: bước có nút "Bỏ qua" — khớp
 * duoc_bo_qua của database.
 */
export const BUOC_THIET_LAP_NB: readonly { khoa: string; ten: HaiThuTieng; boQua: boolean }[] = [
  { khoa: 'chi_nhanh_nhan_vien', ten: { vi: 'Chi nhánh & nhân viên', en: 'Branch & staff' }, boQua: false },
  { khoa: 'mat_hang', ten: { vi: 'Mặt hàng', en: 'Items' }, boQua: false },
  { khoa: 'cong_thuc', ten: { vi: 'Công thức pha lóc', en: 'Butchery recipes' }, boQua: true },
  { khoa: 'ncc_no_dau', ten: { vi: 'Nhà cung cấp & nợ đầu kỳ', en: 'Suppliers & opening balances' }, boQua: true },
  { khoa: 'ton_dau', ten: { vi: 'Tồn đầu kỳ', en: 'Opening stock' }, boQua: true },
  { khoa: 'gia_von', ten: { vi: 'Cách tính giá vốn', en: 'Costing method' }, boQua: true },
  { khoa: 'dinh_muc', ten: { vi: 'Định mức tồn ở quầy', en: 'Counter stock levels' }, boQua: true },
  { khoa: 'vi_tri_ly_do_ma_vach', ten: { vi: 'Vị trí, lý do, mã vạch', en: 'Locations, reasons, barcodes' }, boQua: true },
  { khoa: 'nguong', ten: { vi: 'Ngưỡng cảnh báo', en: 'Alert thresholds' }, boQua: true },
  { khoa: 'may_chung', ten: { vi: 'Máy dùng chung', en: 'Shared tablet' }, boQua: true },
];
export const BUOC_THIET_LAP: readonly { khoa: string; ten: string; boQua: boolean }[] =
  BUOC_THIET_LAP_NB.map(b => ({ ...b, ten: b.ten.vi }));

/** Sau pha lóc, gói quét nhãn của món để ở đâu (kho_mat_hang.noi_de_sau_pha, 0033). null = kho lạnh. */
export const TEN_NOI_DE_SAU_PHA_NB: Record<string, HaiThuTieng> = {
  kho: { vi: 'Kho lạnh', en: 'Cold store' },
  quay: { vi: 'Quầy', en: 'Counter' },
};
export const TEN_NOI_DE_SAU_PHA: Record<string, string> = chiVi(TEN_NOI_DE_SAU_PHA_NB);

/** Câu lỗi chung của kho — cauLoiKho() dùng; bản tiếng Anh cho dichCau() (cau-kho-en.ts). */
export const LOI_KHO_CHUNG = {
  macDinh: { vi: 'Chưa ghi được. Thử lại sau ít phút.', en: 'Not saved. Please try again in a few minutes.' },
  quyen: { vi: 'Tài khoản của bạn không có quyền làm việc này.', en: 'Your account is not allowed to do this.' },
  trung: { vi: 'Đã có một mục trùng tên hoặc trùng mã.', en: 'Something with the same name or code already exists.' },
  khongHopLe: { vi: 'Dữ liệu chưa hợp lệ — kiểm tra lại các ô vừa nhập.', en: 'Some data is not valid — check the fields you just filled in.' },
  mang: {
    vi: 'Không kết nối được database. Chưa chắc đã ghi hay chưa — tải lại trang để kiểm tra.',
    en: 'Could not reach the database. It may or may not have been saved — reload the page to check.',
  },
} as const satisfies Record<string, HaiThuTieng>;

/**
 * Câu lỗi cho nhân viên đọc.
 *
 * Hàm kho trong database báo lỗi bằng tiếng Việt, viết cho người đọc — dùng
 * nguyên văn (màn tiếng Anh tra dichCau lúc hiện). Chỉ những lỗi kỹ thuật tiếng
 * Anh (quyền, trùng khóa, mất mạng) mới được đổi thành câu dễ hiểu.
 */
export function cauLoiKho(e: unknown, macDinh: string = LOI_KHO_CHUNG.macDinh.vi): string {
  const m = typeof e === 'object' && e !== null && 'message' in e
    ? String((e as { message: unknown }).message ?? '') : String(e ?? '');
  if (/permission denied|row-level security|insufficient_privilege/i.test(m)) {
    return LOI_KHO_CHUNG.quyen.vi;
  }
  if (/duplicate key|unique constraint/i.test(m)) {
    return LOI_KHO_CHUNG.trung.vi;
  }
  if (/violates check constraint/i.test(m)) {
    return LOI_KHO_CHUNG.khongHopLe.vi;
  }
  if (/fetch failed|network|timeout|ECONN/i.test(m)) {
    return LOI_KHO_CHUNG.mang.vi;
  }
  return m || macDinh;
}
