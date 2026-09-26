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
 */

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

export const TEN_VAI_KHO: Record<string, string> = {
  thu_kho: 'Thủ kho',
  nhan_vien_quay: 'NV quầy/bếp',
  ke_toan: 'Kế toán',
};

// -----------------------------------------------------------------------------
// MA TRẬN QUYỀN BẰNG LỜI (GĐ8c) — trang /noi-bo/kho/cai-dat/quyen
// -----------------------------------------------------------------------------
// Mỗi việc trong QUYEN_KHO một tên và một câu nói việc đó cho làm gì. Kiểu
// Record<ViecKho, …> bắt buộc đủ mọi việc (thêm việc mới mà quên câu là lỗi
// kiểu); test-kho-giao-dien nhóm 16 kiểm thêm lần nữa.
export const MO_TA_VIEC: Record<ViecKho, { ten: string; moTa: string }> = {
  xem:         { ten: 'Xem kho', moTa: 'Mở phần kho: tồn kho, thẻ kho, quét nhãn, danh sách phiếu — số kg, số gói, hạn dùng.' },
  xem_gia:     { ten: 'Xem giá tiền', moTa: 'Thấy giá nhập, giá vốn, tiền hàng và các báo cáo có tiền.' },
  nhap:        { ten: 'Nhận hàng', moTa: 'Lập phiếu nhận hàng (chụp hóa đơn, cân từng món), đơn đặt hàng nháp, tồn đầu kỳ, ghi kg khi trả hàng nhà cung cấp.' },
  duyet:       { ten: 'Duyệt', moTa: 'Duyệt báo hủy và kiểm kê, xử lý hàng ra quầy bị thiếu, hủy phiếu đã duyệt, xem cảnh báo thu hồi thấp.' },
  duyet_nhap:  { ten: 'Điền giá, duyệt phiếu nhập', moTa: 'Điền đơn giá theo hóa đơn rồi duyệt hoặc trả phiếu nhận hàng về cho người lập.' },
  pha_loc:     { ten: 'Pha lóc', moTa: 'Tạo phiên pha lóc, quét nhãn các phần cắt ra, chốt phiên.' },
  van_hanh:    { ten: 'Việc ở quầy, bếp', moTa: 'Mang hàng ra quầy, nhận hàng ở quầy, xuất bếp, xuất khác, báo hủy, kiểm kê, đếm quầy cuối ngày.' },
  ke_toan:     { ten: 'Công nợ, thanh toán', moTa: 'Đối chiếu hóa đơn, trả tiền nhà cung cấp, sổ thanh toán, biên bản đối chiếu, xuất file MISA.' },
  danh_muc:    { ten: 'Danh mục', moTa: 'Sửa mặt hàng (cả sửa nhanh nhiều món), công thức pha lóc, vị trí, lý do, định lượng món, ngưỡng cảnh báo.' },
  ncc:         { ten: 'Nhà cung cấp', moTa: 'Thêm, sửa nhà cung cấp: mã số thuế, tài khoản ngân hàng, số ngày được nợ.' },
  cai_dat_goc: { ten: 'Cài đặt gốc', moTa: 'Cách tính giá vốn, nguồn số bán, tạo và khóa tài khoản nhân viên.' },
  may_chung:   { ten: 'Máy dùng chung', moTa: 'Chỉ tài khoản của máy tính bảng: hiện danh sách người đã gắn và kiểm PIN. Không đọc được gì trong kho.' },
  dong_bo_ban: { ten: 'Đồng bộ iPOS', moTa: 'Lấy hóa đơn bán từ iPOS để trừ kho ở quầy (máy iPOS tự chạy 5 phút một lần; quản lý, chủ bấm "Cập nhật ngay").' },
};

/** Vai hiện trên trang quyền, đúng thứ tự cột. Hai vai máy để cuối. */
export const VAI_BANG_QUYEN: readonly VaiTro[] = [
  'chu_so_huu', 'quan_ly', 'ke_toan', 'thu_kho', 'nhan_vien_quay', 'may_chung', 'may_ipos',
];

export const TEN_VAI_DAY: Record<string, string> = {
  chu_so_huu: 'Chủ quán',
  quan_ly: 'Quản lý',
  ke_toan: 'Kế toán',
  thu_kho: 'Thủ kho',
  nhan_vien_quay: 'NV quầy/bếp',
  may_chung: 'Máy dùng chung',
  may_ipos: 'Máy đồng bộ iPOS',
  thu_ngan: 'Thu ngân',
  marketing: 'Marketing',
};

/** Các việc vai này làm được, theo thứ tự của QUYEN_KHO. */
export function viecCuaVai(vai: string): ViecKho[] {
  return (Object.keys(QUYEN_KHO) as ViecKho[]).filter(v => duoc(vai, v));
}

/**
 * Một câu cho mỗi vai: "Thủ kho: xem kho, nhận hàng, pha lóc, việc ở quầy, bếp.
 * KHÔNG thấy giá tiền." Vai không có việc kho nào: "không dùng kho".
 */
export function tomTatVai(vai: string): string {
  const ten = TEN_VAI_DAY[vai] ?? vai;
  const ds = viecCuaVai(vai);
  if (ds.length === 0) return `${ten}: không dùng kho.`;
  const lam = ds.filter(v => v !== 'xem_gia').map(v => MO_TA_VIEC[v].ten.toLowerCase());
  const gia = duoc(vai, 'xem') && !duoc(vai, 'xem_gia') ? ' KHÔNG thấy giá tiền.' : '';
  const tien = duoc(vai, 'xem_gia') ? ' Thấy giá tiền.' : '';
  return `${ten}: ${lam.join(', ')}.${gia}${tien}`;
}

export interface KetQua { ok: boolean; cau: string }

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
/** 1.25 → "1,25" · 12 → "12" · 0.3456 → "0,346" */
export function dinhDangKg(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === '') return '—';
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return x.toLocaleString('vi-VN', { maximumFractionDigits: 3 });
}

/** 450000 → "450.000 đ" */
export function dinhDangTien(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === '') return '—';
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return Math.round(x).toLocaleString('vi-VN') + ' đ';
}

/** 70.4567 → "70,5%" */
export function dinhDangPhanTram(n: number | null | undefined, soLe = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return n.toLocaleString('vi-VN', { maximumFractionDigits: soLe, minimumFractionDigits: soLe }) + '%';
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

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD. */
export function homNayVn(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Cộng số ngày vào một ngày YYYY-MM-DD. */
export function congNgay(iso: string, soNgay: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + soNgay);
  return d.toISOString().slice(0, 10);
}

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
export const TEN_LOAI_MAT_HANG: Record<string, string> = {
  tang: 'Tảng nhập',
  phan_cat: 'Phần cắt',
  phu_pham: 'Phụ phẩm',
};

export const TEN_LOAI_VI_TRI: Record<string, string> = {
  kho: 'Kho',
  quay: 'Quầy',
  cho_huy: 'Chờ hủy',
  // 0032: hàng thủ kho đang mang ra, quầy chưa bấm nhận — không phải chỗ để hàng.
  dang_chuyen: 'Đang mang ra quầy',
};

export const TEN_XU_LY: Record<string, string> = {
  nhap_kho: 'Nhập kho',
  chuyen_bep: 'Chuyển bếp',
  bo: 'Bỏ',
};

export const TEN_KIEU_TRUONG: Record<string, string> = {
  chu: 'Chữ',
  so: 'Số',
  ngay: 'Ngày',
  chon: 'Chọn trong danh sách',
  co_khong: 'Có / Không',
};

export const TEN_DOI_TUONG_TRUONG: Record<string, string> = {
  mat_hang: 'Mặt hàng',
  nha_cung_cap: 'Nhà cung cấp',
  phieu_nhap: 'Phiếu nhập',
  lo_hang: 'Từng dòng hàng nhập (lô)',
};

/** Trạng thái chứng từ → [nhãn, lớp CSS của nb-nhan]. */
export const TRANG_THAI_CHUNG_TU: Record<string, [string, string]> = {
  nhap: ['Nháp', 'nhap'],
  cho_duyet: ['Chờ duyệt', 'cho'],
  da_duyet: ['Đã duyệt', 'song'],
  tu_choi: ['Bị từ chối', 'tat'],
  da_huy: ['Đã hủy', 'tat'],
  da_chot: ['Đã chốt', 'song'],
  da_ghi: ['Đã ghi', 'song'],
  dang_dem: ['Đang đếm', 'nhap'],
  // Phiếu chuyển ra quầy khi quầy phải bấm nhận (0032)
  dang_chuyen: ['Đang mang ra', 'cho'],
  da_nhan: ['Quầy đã nhận', 'song'],
  nhan_thieu: ['Nhận thiếu', 'cho'],
  da_tra_ve: ['Đã trả về kho', 'tat'],
  // Trả hàng NCC hai bước (0040): thủ kho đã ghi kg, chờ kế toán xác nhận số tiền
  cho_xac_nhan_tien: ['Chờ kế toán xác nhận', 'cho'],
  // Yêu cầu của quầy (0032)
  cho: ['Chờ mang ra', 'cho'],
  dang_lam: ['Đang mang ra', 'nhap'],
  xong: ['Xong', 'song'],
  huy: ['Đã hủy', 'tat'],
};

export const TEN_LOAI_SO_CAI: Record<string, string> = {
  nhap: 'Nhập',
  pha_loc_vao: 'Đem pha lóc',
  pha_loc_ra: 'Pha lóc ra',
  chuyen_di: 'Chuyển đi',
  chuyen_den: 'Chuyển đến',
  ban: 'Bán',
  xuat_bep: 'Xuất bếp',
  huy: 'Hủy',
  kiem_ke: 'Chênh lệch kiểm kê',
  hao_hut: 'Hao hụt cân',
  dao_nguoc: 'Đảo ngược',
  tra_ncc: 'Trả nhà cung cấp',
  xuat_khac: 'Xuất khác',
  dau_ky: 'Tồn đầu kỳ',   // dòng đầu của thẻ kho (kho_the_kho, 0033) — không phải loại sổ
};

/** Loại phiếu nhập (kho_phieu_nhap.loai). no_dau (0035): nợ đầu kỳ — chỉ số tiền, không hàng. */
export const TEN_LOAI_PHIEU_NHAP: Record<string, string> = {
  mua: 'Nhập mua',
  ton_dau: 'Tồn đầu kỳ',
  no_dau: 'Nợ đầu kỳ',
};

/**
 * Các bước màn Thiết lập, đúng thứ tự hiện (khóa = khóa trong kết quả
 * kho_tien_do_thiet_lap, 0035). boQua: bước có nút "Bỏ qua" — khớp
 * duoc_bo_qua của database.
 */
export const BUOC_THIET_LAP: readonly { khoa: string; ten: string; boQua: boolean }[] = [
  { khoa: 'chi_nhanh_nhan_vien', ten: 'Chi nhánh & nhân viên', boQua: false },
  { khoa: 'mat_hang', ten: 'Mặt hàng', boQua: false },
  { khoa: 'cong_thuc', ten: 'Công thức pha lóc', boQua: true },
  { khoa: 'ncc_no_dau', ten: 'Nhà cung cấp & nợ đầu kỳ', boQua: true },
  { khoa: 'ton_dau', ten: 'Tồn đầu kỳ', boQua: true },
  { khoa: 'gia_von', ten: 'Cách tính giá vốn', boQua: true },
  { khoa: 'dinh_muc', ten: 'Định mức tồn ở quầy', boQua: true },
  { khoa: 'vi_tri_ly_do_ma_vach', ten: 'Vị trí, lý do, mã vạch', boQua: true },
  { khoa: 'nguong', ten: 'Ngưỡng cảnh báo', boQua: true },
  { khoa: 'may_chung', ten: 'Máy dùng chung', boQua: true },
];

/** Sau pha lóc, gói quét nhãn của món để ở đâu (kho_mat_hang.noi_de_sau_pha, 0033). null = kho lạnh. */
export const TEN_NOI_DE_SAU_PHA: Record<string, string> = {
  kho: 'Kho lạnh',
  quay: 'Quầy',
};

/**
 * Câu lỗi cho nhân viên đọc.
 *
 * Hàm kho trong database báo lỗi bằng tiếng Việt, viết cho người đọc — dùng
 * nguyên văn. Chỉ những lỗi kỹ thuật tiếng Anh (quyền, trùng khóa, mất mạng)
 * mới được dịch.
 */
export function cauLoiKho(e: unknown, macDinh = 'Chưa ghi được. Thử lại sau ít phút.'): string {
  const m = typeof e === 'object' && e !== null && 'message' in e
    ? String((e as { message: unknown }).message ?? '') : String(e ?? '');
  if (/permission denied|row-level security|insufficient_privilege/i.test(m)) {
    return 'Tài khoản của bạn không có quyền làm việc này.';
  }
  if (/duplicate key|unique constraint/i.test(m)) {
    return 'Đã có một mục trùng tên hoặc trùng mã.';
  }
  if (/violates check constraint/i.test(m)) {
    return 'Dữ liệu chưa hợp lệ — kiểm tra lại các ô vừa nhập.';
  }
  if (/fetch failed|network|timeout|ECONN/i.test(m)) {
    return 'Không kết nối được database. Chưa chắc đã ghi hay chưa — tải lại trang để kiểm tra.';
  }
  return m || macDinh;
}
