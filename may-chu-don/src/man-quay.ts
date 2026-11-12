/**
 * MÀN HÌNH ĐƠN CHO QUẦY — dựng HTML ở máy chủ, không JavaScript
 * =============================================================
 *
 * Như /noi-bo: mọi thao tác là form POST rồi chuyển hướng 303 (F5 không gửi lại). Danh sách tự tải lại 20 giây
 * một lần, về /quay trơn (câu báo của lần bấm trước không hiện lại mãi), để đơn mới hiện ra mà không ai phải bấm.
 * Câu báo sau khi bấm nằm ngay trong thẻ đơn vừa bấm — trang cuộn tới thẻ đó (#don-<mã>), người bấm thấy ngay. Mỗi nút mang trạng thái đơn lúc trang dựng (`tu`): bấm đúp,
 * hay hai máy tính bảng cùng bấm, máy chủ chỉ đi đúng một bước (so-don.ts).
 *
 * Chữ đủ vi / en như nội bộ (CLAUDE.md gốc, mục cau-chu). Tên phần thịt là tên tiếng Anh của quầy, giữ nguyên.
 */
import { chuoiSangNgay, dinhDangTien, hienSoDienThoai, ngayDayDu } from '../../mini-app/src/don.ts';
import type { DonDayDu, TienVeCanXem } from './so-don.ts';
import { BUOC_QUAY, NHAN, NHAN_TAI_QUAN, NUT_TAI_QUAN, type TrangThai } from './trang-thai.ts';

export type NgonNgu = 'vi' | 'en';

export const CHU = {
  tieuDe: { vi: 'Đơn Mini App', en: 'Mini App orders' },
  quanPhu: { vi: 'Beeftown · quầy thịt mang về', en: 'Beeftown · take-home counter' },
  dangNhap: { vi: 'Đăng nhập quầy', en: 'Counter sign-in' },
  matKhau: { vi: 'Mật khẩu quầy', en: 'Counter password' },
  vao: { vi: 'Vào', en: 'Sign in' },
  saiMatKhau: { vi: 'Sai mật khẩu.', en: 'Wrong password.' },
  thuNhieu: { vi: 'Sai nhiều lần quá. Chờ 10 phút rồi thử lại.', en: 'Too many wrong tries. Wait 10 minutes and try again.' },
  dangXuat: { vi: 'Đăng xuất', en: 'Sign out' },
  doiTieng: { vi: 'English', en: 'Tiếng Việt' },
  conViec: { vi: 'Còn phải làm', en: 'To do' },
  khongCoViec: { vi: 'Chưa có đơn nào phải làm.', en: 'No orders to do.' },
  xongHomNay: { vi: 'Đã xong hôm nay', en: 'Done today' },
  nhan: { vi: 'Nhận', en: 'Pickup' },
  giao: { vi: 'Giao', en: 'Deliver' },
  diaChiGiao: { vi: 'Giao tới', en: 'Deliver to' },
  khay: { vi: 'khay', en: 'tray(s)' },
  dongLanh: { vi: 'đông lạnh', en: 'frozen' },
  mat: { vi: 'thịt mát', en: 'chilled' },
  tong: { vi: 'Tổng đã trả', en: 'Total paid' },
  tongChuaTra: { vi: 'Tổng', en: 'Total' },
  giaThu: { vi: 'Giá thử', en: 'Test price' },
  ghiChu: { vi: 'Ghi chú', en: 'Note' },
  xacNhanHuy: { vi: 'Hủy đơn này?', en: 'Cancel this order?' },
  giaiThichHuy: {
    vi: 'Khách đã trả tiền cho đơn này. Hủy thì đơn vào mục “Đã hủy, cần hoàn tiền”: người hoàn tiền cho khách bấm “Đã hoàn tiền cho khách” khi xong.',
    en: 'The customer has paid for this order. Cancelling moves the order to “Cancelled, refund due”: whoever sends the refund taps “Refund sent” when done.',
  },
  coHuy: { vi: 'Hủy đơn, cần hoàn tiền', en: 'Cancel, refund due' },
  khongHuy: { vi: 'Không hủy, quay lại', en: 'Keep the order' },
  khongThay: { vi: 'Không thấy đơn này.', en: 'Order not found.' },
  khongHuyDuoc: { vi: 'Đơn này không hủy được ở bước hiện tại.', en: 'This order cannot be cancelled at its current status.' },
  daNhanChuyenKhoan: { vi: 'Đã nhận tiền', en: 'Payment received' },
  tienVeCanXem: { vi: 'Tiền về cần xem', en: 'Transfers to check' },
  daXuLy: { vi: 'Đã xử lý xong', en: 'Handled' },
  maThamChieu: { vi: 'Mã giao dịch ngân hàng', en: 'Bank reference' },
  maGiaoDichVnpay: { vi: 'Mã giao dịch VNPay', en: 'VNPay transaction ID' },
  maThanhToanZalo: { vi: 'Mã thanh toán Zalo', en: 'Zalo payment ID' },
  tienVeKhongKhopVnpay: {
    vi: 'VNPay báo đã trừ tiền nhưng không ra đơn nào. Tra lần trả này ở Mini App Center → Checkout SDK theo mã thanh toán Zalo, rồi hoàn tiền cho khách.',
    en: 'VNPay reports a payment that matches no order. Look it up in Mini App Center → Checkout SDK by the Zalo payment ID, then refund the customer.',
  },
  tienVeSaiPhuongThuc: {
    vi: 'Khách trả tiền thật qua VNPay trong lúc máy chủ đang ở môi trường thử, nên tiền chưa được tính cho đơn. Xem đơn liên quan: soạn đơn hoặc hoàn tiền.',
    en: 'A customer paid real money via VNPay while the server is in test mode, so the payment was not applied to the order. Check the related order: prepare it or refund.',
  },
  vnpayTienThu: { vi: 'Tiền thử VNPay (sandbox)', en: 'VNPay test payment (sandbox)' },
  vnpayThuNghiemDauTrang: {
    vi: 'VNPay đang ở môi trường thử (sandbox): tiền khách trả trong app là tiền thử, không phải tiền thật. Đơn mang nhãn “Tiền thử VNPay” thì đừng giao. Đổi sang VNPAY trước khi mở bán.',
    en: 'VNPay is in test mode (sandbox): in-app payments are test money, not real money. Do not deliver orders labelled “VNPay test payment”. Switch to VNPAY before opening sales.',
  },
  tienVeThieu: {
    vi: 'Chuyển thiếu: đơn #{so} cần {tong}, mới nhận {nhan}. Đơn chưa soạn được — gọi khách chuyển nốt, hoặc hoàn lại.',
    en: 'Underpaid: order #{so} needs {tong}, received {nhan}. The order cannot be prepared yet — ask the customer to pay the rest, or refund.',
  },
  tienVeThua: {
    vi: 'Chuyển dư cho đơn #{so}: đơn {tong}, đã nhận {nhan}. Hoàn phần dư cho khách.',
    en: 'Overpaid for order #{so}: order {tong}, received {nhan}. Refund the extra to the customer.',
  },
  tienVeSaiTaiKhoan: {
    vi: 'Tiền mang mã đơn của quán nhưng vào tài khoản khác với tài khoản máy chủ đang nhận. Kiểm cấu hình tài khoản và đơn liên quan.',
    en: 'This transfer carries a shop order code but went to a different account than the one the server expects. Check the account settings and the related order.',
  },
  tienVeKhongKhop: {
    vi: 'Có mã đơn trong nội dung nhưng không có đơn nào khớp. Xem lần chuyển này trong app ngân hàng theo mã giao dịch.',
    en: 'The transfer note has an order code but no order matches. Look up this transfer in the banking app by its reference.',
  },
  demoDauTrang: {
    vi: 'Chế độ demo: mã QR dùng tài khoản giả, tiền về là giả lập — không có tiền thật. Tắt chế độ này trước khi mở bán.',
    en: 'Demo mode: QR codes use a fake account and payments are simulated — no real money. Turn this mode off before opening sales.',
  },
  demoChoChuyenKhoan: { vi: 'Đơn chờ khách chuyển khoản (demo)', en: 'Orders awaiting transfer (demo)' },
  demoKhongCoDonCho: { vi: 'Không có đơn nào đang chờ chuyển khoản.', en: 'No orders are awaiting transfer.' },
  demoGiaLap: { vi: 'Giả lập khách đã chuyển khoản', en: 'Simulate customer payment' },
  demoTienGiaLap: { vi: 'Tiền giả lập (demo)', en: 'Simulated payment (demo)' },
} as const satisfies Record<string, { vi: string; en: string }>;

/** Câu báo sau khi bấm một bước (mã trong ?bao= của trang danh sách). */
export const CAU_BAO = {
  da_doi: { vi: 'Đã chuyển đơn #{so} sang “{den}”.', en: 'Order #{so} moved to “{den}”.', loi: false },
  da_o_buoc_moi: { vi: 'Đơn #{so} đã ở bước “{den}” rồi.', en: 'Order #{so} was already at “{den}”.', loi: false },
  lech: {
    vi: 'Đơn #{so} vừa được đổi ở máy khác, chưa chuyển. Xem lại trạng thái trên thẻ.',
    en: 'Order #{so} was just changed on another device and was not moved. Check its status.', loi: true,
  },
  khong_co: { vi: 'Không thấy đơn này.', en: 'Order not found.', loi: true },
  khong_duoc: { vi: 'Bước này không làm được từ trạng thái hiện tại.', en: 'That step is not allowed from the current status.', loi: true },
  tien_ve_da_xem: { vi: 'Đã ghi: lần chuyển này đã xử lý xong.', en: 'Saved: this transfer is marked as handled.', loi: false },
  tien_ve_xem_roi: { vi: 'Lần chuyển này đã được đánh dấu xử lý xong từ trước.', en: 'This transfer was already marked as handled.', loi: false },
  tien_ve_khong_co: { vi: 'Không thấy lần chuyển này trong mục cần xem.', en: 'This transfer is not in the list to check.', loi: true },
  demo_da_tra: {
    vi: 'Đã giả lập: khách chuyển đủ tiền cho đơn #{so}. Đơn đã vào “Còn phải làm”.',
    en: 'Simulated: the customer paid order #{so} in full. The order is now in “To do”.', loi: false,
  },
  demo_da_tra_roi: { vi: 'Đơn #{so} đã có tiền giả lập từ trước.', en: 'Order #{so} already has a simulated payment.', loi: false },
  demo_khong_cho: {
    vi: 'Đơn này không còn chờ chuyển khoản (đã có tiền, đã hết hạn hoặc không có).',
    en: 'This order is no longer awaiting transfer (already paid, expired, or not found).', loi: true,
  },
} as const satisfies Record<string, { vi: string; en: string; loi: boolean }>;
export type MaCauBao = keyof typeof CAU_BAO;
/** Mã trong ?bao= là một câu có thật — không lấy "constructor", "__proto__" của Object. */
export const laCauBao = (v: unknown): v is MaCauBao => typeof v === 'string' && Object.hasOwn(CAU_BAO, v);

export const thoat = (s: unknown) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Khung chung của mọi trang quầy (đầu trang đen, phông, CSS). Trang thử VNPay (vnpay-thu.ts) cũng dùng. */
export function khung(nn: NgonNgu, than: string, { taiLai = false, coDangXuat = false } = {}): string {
  const c = (k: keyof typeof CHU) => thoat(CHU[k][nn]);
  return `<!doctype html>
<html lang="${nn}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${taiLai ? '<meta http-equiv="refresh" content="20; url=/quay">' : ''}
<meta name="robots" content="noindex, nofollow">
<title>${c('tieuDe')} · Beeftown</title>
<link rel="stylesheet" href="/quay/quay.css">
</head>
<body>
<header class="qd-dau">
  <div><h1>${c('tieuDe')}</h1><div class="qd-phu">${c('quanPhu')}</div></div>
  <div class="qd-dau-nut">
    <form method="post" action="/quay/ngon-ngu"><input type="hidden" name="nn" value="${nn === 'vi' ? 'en' : 'vi'}">
      <button class="qd-nut tren-den" type="submit" lang="${nn === 'vi' ? 'en' : 'vi'}">${c('doiTieng')}</button></form>
    ${coDangXuat ? `<form method="post" action="/quay/dang-xuat"><button class="qd-nut tren-den" type="submit">${c('dangXuat')}</button></form>` : ''}
  </div>
</header>
<main class="qd-khung">
${than}
</main>
</body>
</html>`;
}

export function trangDangNhap(nn: NgonNgu, loi: '' | 'sai' | 'nhieu' = ''): string {
  const c = (k: keyof typeof CHU) => thoat(CHU[k][nn]);
  const cauLoi = loi === 'sai' ? c('saiMatKhau') : loi === 'nhieu' ? c('thuNhieu') : '';
  return khung(nn, `<form class="qd-dang-nhap qd-the" method="post" action="/quay/dang-nhap">
  <h2>${c('dangNhap')}</h2>
  <label for="mat-khau">${c('matKhau')}</label>
  <input id="mat-khau" name="mat_khau" type="password" autocomplete="current-password" required
    ${cauLoi ? 'aria-invalid="true" aria-describedby="loi-mat-khau"' : ''}>
  ${cauLoi ? `<p class="qd-loi-o" id="loi-mat-khau">${cauLoi}</p>` : ''}
  <button class="qd-nut chinh" type="submit">${c('vao')}</button>
</form>`);
}

const THU_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** "Thứ Sáu 13/11" / "Fri 13/11" */
export function ngayTheoTieng(ngay: string, nn: NgonNgu): string {
  if (nn === 'vi') return ngayDayDu(ngay);
  const d = chuoiSangNgay(ngay);
  return `${THU_EN[d.getDay()]} ${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`;
}

const nhanTrangThai = (tt: TrangThai, nn: NgonNgu, taiQuan = false) =>
  `<span class="qd-nhan ${NHAN[tt].kieu}">${thoat((taiQuan && NHAN_TAI_QUAN[tt]) ? NHAN_TAI_QUAN[tt]![nn] : NHAN[tt][nn])}</span>`;

/** `tienGia`: tiền giả lập của chế độ demo, hay tiền thử VNPay sandbox — nhãn để quầy không tưởng là tiền thật. */
function theDon(don: DonDayDu, nn: NgonNgu, coNut: boolean, baoHtml = '', daNhan = 0, tienGia: '' | 'demo' | 'vnpay_thu' = ''): string {
  const c = (k: keyof typeof CHU) => thoat(CHU[k][nn]);
  const dong = don.dong.map(d => `<li>${thoat(d.ten)} · ${d.baoQuan === 'dong-lanh' ? c('dongLanh') : c('mat')}, ~${d.soGamKhay} g · <b>${d.soKhay} ${c('khay')}</b></li>`).join('');
  const nut = !coNut ? '' : BUOC_QUAY.filter(b => b.tu === don.trangThai).map(b => b.den === 'can_hoan_tien'
    ? `<a class="qd-nut phu" href="/quay/huy?ma=${encodeURIComponent(don.ma)}">${thoat(b[nn])}</a>`
    : `<form method="post" action="/quay/doi">
        <input type="hidden" name="ma" value="${thoat(don.ma)}"><input type="hidden" name="tu" value="${b.tu}"><input type="hidden" name="den" value="${b.den}">
        <button class="qd-nut ${b.chinh ? 'chinh' : 'phu'}" type="submit">${thoat((don.cachNhan === 'tai-quan' && NUT_TAI_QUAN[b.den]) ? NUT_TAI_QUAN[b.den]![nn] : b[nn])}</button></form>`).join('');
  const tong = don.trangThai === 'cho_thanh_toan' || don.trangThai === 'het_han' ? c('tongChuaTra') : c('tong');
  return `<article class="qd-the" id="don-${thoat(don.ma)}">
  <div class="qd-the-dau"><span class="qd-so">#${don.soTrongNgay}</span>
    <span class="qd-gio">${c(don.cachNhan === 'giao-hang' ? 'giao' : 'nhan')} ${thoat(don.gioNhan)}, ${thoat(ngayTheoTieng(don.ngayNhan, nn))}</span>${nhanTrangThai(don.trangThai, nn, don.cachNhan === 'tai-quan')}</div>
  <p>${thoat(don.ten)} · <a href="tel:${thoat(don.dienThoai)}">${thoat(hienSoDienThoai(don.dienThoai))}</a></p>
  ${don.cachNhan === 'giao-hang' ? `<p class="qd-dia-chi">${c('diaChiGiao')}: ${thoat(don.diaChi)}</p>` : ''}
  <ul>${dong}</ul>
  <p class="qd-tong">${tong}: ${thoat(dinhDangTien(don.tongTien))}${don.giaThu ? ` <span class="qd-nhan k3">${c('giaThu')}</span>` : ''}${tienGia ? ` <span class="qd-nhan k3">${c(tienGia === 'demo' ? 'demoTienGiaLap' : 'vnpayTienThu')}</span>` : ''}</p>
  ${daNhan > 0 ? `<p>${c('daNhanChuyenKhoan')}: ${thoat(dinhDangTien(daNhan))}</p>` : ''}
  ${don.ghiChu ? `<p class="qd-ghi-chu">${c('ghiChu')}: ${thoat(don.ghiChu)}</p>` : ''}
  ${baoHtml}
  ${nut ? `<div class="qd-hang-nut">${nut}</div>` : ''}
</article>`;
}

/** "2026-11-13 09:05:00" (giờ VN, như SePay gửi) → "09:05, 13/11/2026"; dạng lạ thì để nguyên. */
export function gioNgayVn(chu: string): string {
  const m = chu.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);
  return m ? `${m[4]}:${m[5]}, ${m[3]}/${m[2]}/${m[1]}` : chu;
}

/** Một lần tiền về cần người xem: số tiền, giờ, mã giao dịch ngân hàng, việc phải làm, nút "Đã xử lý xong". */
function theTienVe(t: TienVeCanXem, nn: NgonNgu): string {
  const c = (k: keyof typeof CHU) => thoat(CHU[k][nn]);
  const vnpay = t.nguon === 'vnpay';
  const mau = t.ketQua === 'thieu' ? CHU.tienVeThieu[nn] : t.ketQua === 'thua' ? CHU.tienVeThua[nn]
    : t.ketQua === 'sai_tai_khoan' ? CHU.tienVeSaiTaiKhoan[nn] : t.ketQua === 'sai_phuong_thuc' ? CHU.tienVeSaiPhuongThuc[nn]
    : vnpay ? CHU.tienVeKhongKhopVnpay[nn] : CHU.tienVeKhongKhop[nn];
  const cau = mau.replace('{so}', String(t.soTrongNgay ?? '')).replace('{tong}', dinhDangTien(t.tongTienDon ?? 0))
    .replace('{nhan}', dinhDangTien(t.tongDaNhan ?? 0));
  return `<article class="qd-the">
  <div class="qd-the-dau"><span class="qd-so">${thoat(dinhDangTien(t.soTien))}</span>
    <span class="qd-gio">${thoat(gioNgayVn(t.ngayGiaoDich))}</span><span class="qd-nhan k1">${c('tienVeCanXem')}</span></div>
  <p>${thoat(cau)}</p>
  ${t.maThamChieu ? `<p>${c(vnpay ? 'maGiaoDichVnpay' : 'maThamChieu')}: ${thoat(t.maThamChieu)}</p>` : ''}
  ${vnpay && t.maZalo ? `<p>${c('maThanhToanZalo')}: ${thoat(t.maZalo)}</p>` : ''}
  <div class="qd-hang-nut"><form method="post" action="/quay/tien-ve/da-xem">${vnpay
    ? `<input type="hidden" name="zalo" value="${thoat(t.maZalo ?? '')}">` : `<input type="hidden" name="id" value="${t.idSepay}">`}
    <button class="qd-nut phu" type="submit">${c('daXuLy')}</button></form></div>
</article>`;
}

export function trangDanhSach(
  nn: NgonNgu,
  ds: { conViec: DonDayDu[]; xongHomNay: DonDayDu[] },
  bao: { ma: MaCauBao; maDon: string; so: number | null; den: TrangThai | null } | null,
  tienVe: TienVeCanXem[] = [],
  tienDaNhan: (maDon: string) => number = () => 0,
  /** Đơn có tiền giả lập của chế độ demo — gắn nhãn kể cả khi đã tắt demo, kẻo quầy tưởng đơn đã trả tiền thật. */
  daGiaLap: Set<string> = new Set(),
  /** Chế độ demo đang bật: đơn chờ chuyển khoản (có nút giả lập). Không có: màn quầy như thường. */
  choTienDemo?: DonDayDu[],
  /** VNPay: đơn có tiền thử sandbox (nhãn, kể cả khi đã đổi sang tiền thật), máy chủ đang ở sandbox (dòng cảnh báo). */
  vnpay: { donTienThu: Set<string>; dangThuNghiem: boolean } = { donTienThu: new Set(), dangThuNghiem: false },
): string {
  const c = (k: keyof typeof CHU) => thoat(CHU[k][nn]);
  const cau = bao ? CAU_BAO[bao.ma] : undefined;
  // Câu cần số đơn hay tên bước mà thiếu (đơn không còn, form lạ): không in câu có lỗ hổng.
  const chu = !cau || !bao ? '' : cau[nn].includes('{so}') && bao.so === null || cau[nn].includes('{den}') && !bao.den ? ''
    : cau[nn].replace('{so}', String(bao.so)).replace('{den}', bao.den ? NHAN[bao.den][nn] : '');
  const baoHtml = !chu ? '' : `<p class="qd-bao${cau!.loi ? ' loi' : ''}" role="status">${thoat(chu)}</p>`;
  // Thẻ vừa bấm còn trong "Còn phải làm" thì câu báo nằm trong thẻ; đơn đã khép (vào mục đã gập) thì nằm đầu trang.
  const trongThe = !!bao && ds.conViec.some(d => d.ma === bao.maDon);
  const tienGia = (ma: string) => daGiaLap.has(ma) ? 'demo' as const : vnpay.donTienThu.has(ma) ? 'vnpay_thu' as const : '' as const;
  const nutGiaLap = (d: DonDayDu) => `<div class="qd-hang-nut"><form method="post" action="/quay/demo/tien-ve">
    <input type="hidden" name="ma" value="${thoat(d.ma)}"><button class="qd-nut chinh" type="submit">${c('demoGiaLap')}</button></form></div>`;
  const phanDemo = !choTienDemo ? '' : `<p class="qd-bao loi" role="note">${c('demoDauTrang')}</p>
<h2 id="cho-chuyen-khoan">${c('demoChoChuyenKhoan')} (${choTienDemo.length})</h2>
${choTienDemo.length ? choTienDemo.map(d => theDon(d, nn, false, nutGiaLap(d))).join('\n') : `<p class="qd-trong">${c('demoKhongCoDonCho')}</p>`}`;
  return khung(nn, `${vnpay.dangThuNghiem ? `<p class="qd-bao loi" role="note">${c('vnpayThuNghiemDauTrang')}</p>\n` : ''}${phanDemo}
${trongThe ? '' : baoHtml}
${tienVe.length ? `<h2 id="tien-ve">${c('tienVeCanXem')} (${tienVe.length})</h2>\n${tienVe.map(t => theTienVe(t, nn)).join('\n')}` : ''}
<h2>${c('conViec')} (${ds.conViec.length})</h2>
${ds.conViec.length ? ds.conViec.map(d => theDon(d, nn, true, trongThe && d.ma === bao!.maDon ? baoHtml : '', tienDaNhan(d.ma), tienGia(d.ma))).join('\n') : `<p class="qd-trong">${c('khongCoViec')}</p>`}
${ds.xongHomNay.length ? `<details class="qd-xong"><summary>${c('xongHomNay')} (${ds.xongHomNay.length})</summary>
${ds.xongHomNay.map(d => theDon(d, nn, false, '', 0, tienGia(d.ma))).join('\n')}</details>` : ''}`, { taiLai: true, coDangXuat: true });
}

/** `don` null: không có đơn (coDon false), hoặc đơn không còn hủy được (coDon true) — không in câu "khách đã trả tiền". */
export function trangXacNhanHuy(nn: NgonNgu, don: DonDayDu | null, coDon = false): string {
  const c = (k: keyof typeof CHU) => thoat(CHU[k][nn]);
  if (!don) return khung(nn, `<p class="qd-bao loi">${coDon ? c('khongHuyDuoc') : c('khongThay')}</p><p><a class="qd-nut phu" href="/quay">${c('khongHuy')}</a></p>`, { coDangXuat: true });
  return khung(nn, `<h2>${c('xacNhanHuy')}</h2>
${theDon(don, nn, false)}
<p>${c('giaiThichHuy')}</p>
<div class="qd-hang-nut">
  <form method="post" action="/quay/doi">
    <input type="hidden" name="ma" value="${thoat(don.ma)}"><input type="hidden" name="tu" value="${don.trangThai}"><input type="hidden" name="den" value="can_hoan_tien">
    <button class="qd-nut chinh" type="submit">${c('coHuy')}</button></form>
  <a class="qd-nut phu" href="/quay">${c('khongHuy')}</a>
</div>`, { coDangXuat: true });
}
