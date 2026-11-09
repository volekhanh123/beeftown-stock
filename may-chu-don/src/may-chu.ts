/**
 * MÁY CHỦ ĐƠN — mọi đường dẫn
 * ===========================
 *
 *   POST /api/don              Mini App gửi đơn (kiemDon → SoDon.taoDon). 201 đơn mới, 200 đơn cũ cùng maGui.
 *   GET  /api/don/:ma?khoa=    Khách xem trạng thái đơn của mình (sai khóa = 404, như không có đơn).
 *   GET  /api/don/:ma/qr.svg?khoa=  Ảnh mã VietQR để khách chuyển khoản (chỉ khi đơn đang chờ trả tiền).
 *   POST /sepay/tien-ve        SePay báo có tiền về (kiểm HMAC → SoDon.ghiTienVe). Trả {"success": true} khi đã ghi.
 *   GET  /suc-khoe             Số đếm cho đèn sức khỏe — không dữ liệu cá nhân.
 *   GET  /quay                 Màn hình đơn cho quầy (mật khẩu quầy → phiên 12 giờ).
 *   POST /quay/dang-nhap · /quay/dang-xuat · /quay/doi · /quay/ngon-ngu · /quay/tien-ve/da-xem;
 *        GET /quay/huy?ma= (hỏi lại trước khi hủy)
 *
 * taoXuLy nhận mọi thứ từ ngoài vào (sổ đơn, mật khẩu, đồng hồ) để kiểm thử gọi thẳng bằng Request, không cần
 * mở cổng. Câu trả lời của /api chỉ nói "đã ghi" khi giao dịch SQLite đã xong; lỗi thì nói rõ đơn CHƯA được ghi
 * (CLAUDE.md gốc, mục mat-mang) — Mini App gửi lại cùng maGui thì nhận lại đúng đơn, không ra hai đơn.
 */
import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import CSS_QUAY_FILE from './quay.css' with { type: 'text' };
import { MAU_MA_GUI, dauNoiDungGui, kiemDon } from './tao-don.ts';
import { SoDon, PHUT_CHO_THANH_TOAN, type DonDayDu } from './so-don.ts';
import { DA_NHAN, docTinTienVe, kiemChuKy } from './sepay.ts';
import { chuoiVietQr, noiDungChuyenKhoan, svgVietQr, type TaiKhoanNhan } from './viet-qr.ts';
import { NHAN, duocBam, laTrangThai } from './trang-thai.ts';
import { laCauBao, trangDangNhap, trangDanhSach, trangXacNhanHuy, type NgonNgu } from './man-quay.ts';

const CSS_QUAY = CSS_QUAY_FILE as unknown as string;

export const THAN_API_TOI_DA = 8 * 1024;
export const PHUT_PHIEN_QUAY = 12 * 60;

export interface TuyChonMayChu {
  so: SoDon;
  /** Mật khẩu quầy, ít nhất 8 ký tự (main.ts kiểm trước khi mở máy chủ). */
  matKhauQuay: string;
  bayGio?: () => number;
  /** Có thì /suc-khoe đòi ?khoa= đúng. */
  khoaSucKhoe?: string;
  /** Cookie phiên mang Secure — tắt chỉ khi thử trên mạng LAN bằng http (README, "Chạy thử trên laptop"). */
  cookieAnToan: boolean;
  /** Tài khoản nhận chuyển khoản (VietinBank của SLK Group). Chưa có: đơn vẫn ghi nhưng không có mã trả tiền. */
  taiKhoan?: TaiKhoanNhan;
  /** Khóa HMAC của webhook SePay. Chưa có: /sepay/tien-ve trả 503 (SePay gửi lại sau). */
  khoaSepay?: string;
  /** Cho hiện mã trả tiền khi bảng giá còn là giá thử — chỉ để Khánh thử chuyển khoản thật số nhỏ. */
  choTraGiaThu?: boolean;
}

/** Thông tin trả tiền gửi cho Mini App, hoặc lý do chưa trả được. */
export type ThanhToan =
  | { traDuoc: true; nganHang: string; soTaiKhoan: string; tenTaiKhoan: string; soTien: number; noiDung: string; chuoiQr: string; hetHanLuc: number }
  | { traDuoc: false; lyDo: 'chua_co_tai_khoan' | 'gia_thu' | 'khong_cho_tra' | 'tam_loi' };

/**
 * IP để đếm lượt. Sau proxy HTTPS của mình (TIN_PROXY=1): mục CUỐI của X-Forwarded-For — Caddy, nginx thêm IP thật
 * vào cuối, còn mục đầu do người gửi tự ghi được (ghi mỗi lần một IP giả là né được khóa mật khẩu quầy).
 */
export function ipKhach(xff: string | null, tinProxy: boolean, ipNoi: string | undefined): string {
  const cuoi = tinProxy ? xff?.split(',').map(s => s.trim()).filter(Boolean).at(-1) : undefined;
  return cuoi || ipNoi || '?';
}

/** Đếm số lần trong một cửa sổ thời gian, theo khóa (địa chỉ IP). */
export class GioiHan {
  private lan = new Map<string, number[]>();
  private lanDon = 0;
  constructor(private soLan: number, private msCua: number) {}
  /** Đã hết lượt trong cửa sổ (không ghi thêm lần nào). */
  dangChan(khoa: string, ms: number): boolean {
    return (this.lan.get(khoa) ?? []).filter(t => t > ms - this.msCua).length >= this.soLan;
  }
  /** Ghi một lần; false khi đã hết lượt (lần này không được làm). */
  thu(khoa: string, ms: number): boolean {
    const con = (this.lan.get(khoa) ?? []).filter(t => t > ms - this.msCua);
    if (con.length >= this.soLan) { this.lan.set(khoa, con); return false; }
    con.push(ms);
    this.lan.set(khoa, con);
    if (this.lan.size > 10_000 && ms - this.lanDon > this.msCua) {
      this.lanDon = ms;
      for (const [k, v] of this.lan) if (!v.some(t => t > ms - this.msCua)) this.lan.delete(k);
    }
    return true;
  }
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '600',
};
const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...CORS },
});
const loiApi = (status: number, ...loi: string[]) => json({ ok: false, loi }, status);

const CSP = "default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'";
const html = (chu: string, status = 200, them: Record<string, string> = {}) => new Response(chu, {
  status,
  headers: {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': CSP,
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', ...them,
  },
});
const chuyen = (den: string, them: Record<string, string | string[]> = {}) => {
  const h = new Headers({ Location: den, 'Cache-Control': 'no-store' });
  for (const [k, v] of Object.entries(them)) for (const x of Array.isArray(v) ? v : [v]) h.append(k, x);
  return new Response(null, { status: 303, headers: h });
};

/** Thân yêu cầu dưới `toiDa` byte, hoặc null. */
async function docThan(req: Request, toiDa: number): Promise<string | null> {
  if (Number(req.headers.get('content-length') ?? 0) > toiDa) return null;
  const chu = await req.text();
  return Buffer.byteLength(chu) > toiDa ? null : chu;
}

const docCookie = (req: Request, ten: string) => {
  for (const phan of (req.headers.get('cookie') ?? '').split(';')) {
    const [k, ...v] = phan.trim().split('=');
    if (k === ten) return v.join('=');
  }
  return '';
};

const bangNhau = (a: string, b: string) => {
  const x = createHash('sha256').update(a).digest(), y = createHash('sha256').update(b).digest();
  return timingSafeEqual(x, y);
};

/**
 * Form của /quay phải gửi từ chính trang này. Trình duyệt mới gửi Sec-Fetch-Site; trình duyệt cũ hơn gửi Origin
 * (so với Host — máy chủ thuê đứng sau proxy giữ nguyên Host). Không có cả hai: còn cookie SameSite=Strict chặn.
 */
export function cungNguon(req: Request): boolean {
  const site = req.headers.get('sec-fetch-site');
  if (site) return site === 'same-origin' || site === 'none';
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.get('host'); } catch { return false; }
}

// Montserrat 400 / 600 / 700 / 800, chỉ bộ latin, latin-ext, vietnamese (giấy phép OFL), lấy từ @fontsource/montserrat.
const THU_MUC_PHONG = new URL('../node_modules/@fontsource/montserrat/', import.meta.url);
const DO_DAM = [400, 600, 700, 800];
const BO_CHU = ['vietnamese', 'latin-ext', 'latin'];
const TEP_PHONG = new Set(DO_DAM.flatMap(d => BO_CHU.map(b => `montserrat-${b}-${d}-normal.woff2`)));
let cssPhong: string | null = null;
function docCssPhong(): string {
  if (cssPhong !== null) return cssPhong;
  const khoi: string[] = [];
  for (const d of DO_DAM) {
    const css = readFileSync(new URL(`${d}.css`, THU_MUC_PHONG), 'utf8');
    for (const b of BO_CHU) {
      const m = css.match(new RegExp(`/\\* montserrat-${b}-${d}-normal \\*/\\s*(@font-face \\{[\\s\\S]*?\\})`));
      if (m) khoi.push(m[1].replace(/src: [^;]+;/, `src: url(/quay/phong/montserrat-${b}-${d}-normal.woff2) format('woff2');`));
    }
  }
  return (cssPhong = khoi.join('\n'));
}

export function taoXuLy(tc: TuyChonMayChu) {
  const bayGio = tc.bayGio ?? (() => Date.now());
  const phien = new Map<string, number>();
  const gioiHanDon = new GioiHan(20, 60_000);
  // Mini App hỏi trạng thái 4 giây một lần khi chờ tiền; khách sau cùng một IP nhà mạng (NAT) dùng chung lượt. Tra một
  // dòng theo khóa chính, khóa xem 128 bit — giới hạn chỉ để chặn gửi dồn, không phải để chống đoán khóa.
  const gioiHanXem = new GioiHan(600, 60_000);
  const saiMatKhau = new GioiHan(5, 10 * 60_000);

  const coPhien = (req: Request, ms: number) => {
    const t = docCookie(req, 'phien_quay');
    const het = t ? phien.get(t) : undefined;
    if (het === undefined) return false;
    if (het < ms) { phien.delete(t); return false; }
    return true;
  };
  const ngonNgu = (req: Request): NgonNgu => (docCookie(req, 'nn_quay') === 'en' ? 'en' : 'vi');
  const cookie = (ten: string, gt: string, giay: number, them = '') =>
    `${ten}=${gt}; Path=/quay; HttpOnly; SameSite=Strict; Max-Age=${giay}${tc.cookieAnToan ? '; Secure' : ''}${them}`;

  /** Đơn còn chờ trả tiền thì có mã VietQR cho đúng số tiền còn thiếu; đơn đã có tiền, hết hạn: không. */
  const thanhToanCoTheNem = (d: DonDayDu): ThanhToan => {
    if (d.trangThai !== 'cho_thanh_toan') return { traDuoc: false, lyDo: 'khong_cho_tra' };
    if (!tc.taiKhoan) return { traDuoc: false, lyDo: 'chua_co_tai_khoan' };
    if (d.giaThu && !tc.choTraGiaThu) return { traDuoc: false, lyDo: 'gia_thu' };
    const conThieu = d.tongTien - tc.so.tienDaNhan(d.ma);
    if (conThieu <= 0) return { traDuoc: false, lyDo: 'khong_cho_tra' };
    const noiDung = noiDungChuyenKhoan(d.ma);
    return {
      traDuoc: true, nganHang: tc.taiKhoan.tenNganHang, soTaiKhoan: tc.taiKhoan.soTaiKhoan, tenTaiKhoan: tc.taiKhoan.tenTaiKhoan,
      soTien: conThieu, noiDung, chuoiQr: chuoiVietQr(tc.taiKhoan, conThieu, noiDung), hetHanLuc: d.taoLuc + PHUT_CHO_THANH_TOAN * 60_000,
    };
  };
  // Đơn đã ghi xong rồi mới dựng phần trả tiền: phần này hỏng (sổ đơn bận) thì vẫn trả đơn — câu "đơn CHƯA được ghi"
  // chỉ dành cho lúc ghi đơn hỏng. Mini App hỏi lại GET /api/don/<mã> để lấy mã trả tiền.
  const thanhToan = (d: DonDayDu): ThanhToan => {
    try { return thanhToanCoTheNem(d); }
    catch (e) { console.error('Dựng thông tin trả tiền hỏng:', e); return { traDuoc: false, lyDo: 'tam_loi' }; }
  };

  return async function xuLy(req: Request, ip: string): Promise<Response> {
    const url = new URL(req.url);
    const duong = url.pathname;
    const ms = bayGio();

    // ---------- API cho Mini App ----------
    if (duong.startsWith('/api/')) {
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

      if (duong === '/api/don' && req.method === 'POST') {
        if (!gioiHanDon.thu(ip, ms)) return loiApi(429, 'Gửi nhiều lần quá. Chờ một phút rồi thử lại.');
        const chu = await docThan(req, THAN_API_TOI_DA);
        if (chu === null) return loiApi(413, 'Đơn quá dài.');
        let than: unknown;
        try { than = JSON.parse(chu); } catch { return loiApi(400, 'Đơn gửi lên không đọc được. Mở lại Mini App rồi gửi lại.'); }
        const traDon = (d: DonDayDu, moi: boolean) => json({
          ok: true, moi, ma: d.ma, khoa: d.khoaXem, soTrongNgay: d.soTrongNgay, tongTien: d.tongTien,
          trangThai: d.trangThai, nhan: NHAN[d.trangThai].vi, thanhToan: thanhToan(d),
        }, moi ? 201 : 200);
        const trungMaGui = () => loiApi(409, 'Đơn này đã gửi với nội dung khác. Mở lại Mini App rồi đặt lại.');
        try {
          // Gửi lại một đơn đã ghi (mất câu trả lời giữa đường): trả đơn cũ TRƯỚC khi kiểm lại giờ nhận, giá — giờ
          // nhận có thể vừa qua, giá có thể vừa đổi, nhưng đơn đã ghi thì không được bắt khách đặt thành đơn thứ hai.
          const maGui = (than as { maGui?: unknown } | null)?.maGui;
          const cu = typeof maGui === 'string' && MAU_MA_GUI.test(maGui) ? tc.so.layTheoMaGui(maGui) : null;
          if (cu) return cu.dauNoiDung === dauNoiDungGui(than) ? traDon(cu.don, false) : trungMaGui();
          const kiem = kiemDon(than, ms);
          if (!kiem.ok) return loiApi(400, ...kiem.loi);
          const kq = tc.so.taoDon(kiem.don, ms);
          return kq.ok ? traDon(kq.don, kq.moi) : trungMaGui();
        } catch (e) {
          console.error('Ghi đơn hỏng:', e);
          return loiApi(500, 'Máy chủ đang lỗi, đơn CHƯA được ghi. Thử lại sau ít phút.');
        }
      }

      const m = duong.match(/^\/api\/don\/([A-Z0-9]{8})(\/qr\.svg)?$/);
      if (m && req.method === 'GET') {
        if (!gioiHanXem.thu(ip, ms)) return loiApi(429, 'Hỏi nhiều lần quá. Chờ một phút rồi thử lại.');
        const d = tc.so.layTheoKhoa(m[1], url.searchParams.get('khoa') ?? '');
        // lyDo cho máy đọc: Mini App chỉ thôi giữ đơn trên máy khi đúng là không có đơn, không phải khi sai đường.
        if (!d) return json({ ok: false, lyDo: 'khong_thay_don', loi: ['Không thấy đơn này.'] }, 404);
        const tt = thanhToan(d);
        if (m[2]) {
          if (!tt.traDuoc) return loiApi(404, 'Đơn này không còn chờ trả tiền.');
          return new Response(await svgVietQr(tt.chuoiQr), { headers: {
            'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'", ...CORS,
          } });
        }
        return json({
          ok: true, ma: d.ma, soTrongNgay: d.soTrongNgay, trangThai: d.trangThai, nhan: NHAN[d.trangThai].vi,
          ngayNhan: d.ngayNhan, gioNhan: d.gioNhan, tongTien: d.tongTien, daNhan: tc.so.tienDaNhan(d.ma), giaThu: d.giaThu,
          dong: d.dong.map(x => ({ ten: x.ten, soKhay: x.soKhay, giaMoiKhay: x.giaMoiKhay })), thanhToan: tt,
        });
      }
      return loiApi(404, 'Không có đường này.');
    }

    // ---------- SePay báo tiền về ----------
    if (duong === '/sepay/tien-ve' && req.method === 'POST') {
      const tuChoi = (status: number, ly: string) => new Response(JSON.stringify({ success: false, message: ly }),
        { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
      // Chưa đủ cấu hình: trả lỗi để SePay gửi lại sau — không ghi tiền về khi chưa biết tài khoản của quán, kẻo khoản
      // tiền thật bị ghi vĩnh viễn là "sai tài khoản" (mỗi id chỉ ghi một lần).
      if (!tc.khoaSepay || !tc.taiKhoan) return tuChoi(503, 'Chưa cấu hình khóa SePay hoặc tài khoản nhận');
      const thanGoc = await docThan(req, 16 * 1024);
      if (thanGoc === null) return tuChoi(413, 'Quá dài');
      const ky = kiemChuKy(thanGoc, req.headers.get('x-sepay-signature'), req.headers.get('x-sepay-timestamp'), tc.khoaSepay, Math.floor(ms / 1000));
      if (ky !== 'dung') return tuChoi(401, ky === 'qua_han' ? 'Request expired' : 'Invalid signature');
      let than: unknown;
      try { than = JSON.parse(thanGoc); } catch { return tuChoi(400, 'Không phải JSON'); }
      const tin = docTinTienVe(than);
      if (!tin) return tuChoi(400, 'Thiếu trường');
      try {
        const kq = tc.so.ghiTienVe(tin, tc.taiKhoan?.soTaiKhoan ?? '', ms);
        if (kq.moi) console.log(`SePay ${tin.idSepay}: ${kq.ketQua}${kq.maDon ? ` đơn ${kq.maDon}` : ''}`);
        return new Response(DA_NHAN, { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
      } catch (e) {
        // Chưa ghi được: trả lỗi để SePay gửi lại (8 lần trong 33 phút) — không bao giờ báo đã nhận khi chưa ghi.
        console.error('Ghi tiền về hỏng:', e);
        return tuChoi(500, 'Chưa ghi được');
      }
    }

    if (duong === '/suc-khoe' && req.method === 'GET') {
      if (tc.khoaSucKhoe && !bangNhau(url.searchParams.get('khoa') ?? '', tc.khoaSucKhoe)) return loiApi(403, 'Sai khóa.');
      try { return json({ ok: true, luc: ms, ...tc.so.soLieu(ms) }); }
      catch (e) { console.error('Đọc số liệu hỏng:', e); return loiApi(500, 'Không đọc được sổ đơn.'); }
    }

    // ---------- Màn hình quầy ----------
    if (duong === '/quay/quay.css') {
      return new Response(docCssPhong() + '\n' + CSS_QUAY, {
        headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' },
      });
    }
    if (duong.startsWith('/quay/phong/')) {
      const tep = duong.slice('/quay/phong/'.length);
      if (!TEP_PHONG.has(tep)) return new Response('Not found', { status: 404 });
      return new Response(Bun.file(new URL(`files/${tep}`, THU_MUC_PHONG)), {
        headers: { 'Content-Type': 'font/woff2', 'Cache-Control': 'public, max-age=31536000, immutable' },
      });
    }

    if (duong === '/quay' || duong.startsWith('/quay/')) {
      const nn = ngonNgu(req);
      if (req.method === 'POST' && !cungNguon(req)) return html('Forbidden', 403);

      if (duong === '/quay/ngon-ngu' && req.method === 'POST') {
        const chu = await docThan(req, 1024);
        const muon = new URLSearchParams(chu ?? '').get('nn') === 'en' ? 'en' : 'vi';
        return chuyen('/quay', { 'Set-Cookie': `nn_quay=${muon}; Path=/quay; SameSite=Strict; Max-Age=31536000${tc.cookieAnToan ? '; Secure' : ''}` });
      }

      if (duong === '/quay/dang-nhap' && req.method === 'POST') {
        const chu = await docThan(req, 1024);
        const matKhau = new URLSearchParams(chu ?? '').get('mat_khau') ?? '';
        // Hết lượt thì chặn trước khi so: máy dò mật khẩu không vào được kể cả khi đoán trúng ở lần thứ sáu.
        if (saiMatKhau.dangChan(ip, ms)) return html(trangDangNhap(nn, 'nhieu'), 429);
        if (!bangNhau(matKhau, tc.matKhauQuay)) {
          saiMatKhau.thu(ip, ms);
          return html(trangDangNhap(nn, saiMatKhau.dangChan(ip, ms) ? 'nhieu' : 'sai'), 401);
        }
        const t = randomBytes(32).toString('hex');
        phien.set(t, ms + PHUT_PHIEN_QUAY * 60_000);
        return chuyen('/quay', { 'Set-Cookie': cookie('phien_quay', t, PHUT_PHIEN_QUAY * 60) });
      }

      if (duong === '/quay/dang-xuat' && req.method === 'POST') {
        phien.delete(docCookie(req, 'phien_quay'));
        return chuyen('/quay', { 'Set-Cookie': cookie('phien_quay', '', 0) });
      }

      if (!coPhien(req, ms)) {
        return req.method === 'GET' && duong === '/quay' ? html(trangDangNhap(nn)) : chuyen('/quay');
      }

      if (duong === '/quay' && req.method === 'GET') {
        const ma = url.searchParams.get('ma') ?? '', den = url.searchParams.get('den'), baoMa = url.searchParams.get('bao') ?? '';
        const don = ma ? tc.so.layDon(ma) : null;
        const bao = laCauBao(baoMa) ? { ma: baoMa, maDon: don?.ma ?? '', so: don?.soTrongNgay ?? null, den: laTrangThai(den) ? den : null } : null;
        const daNhan = tc.so.tienDaNhanTheoDon();
        return html(trangDanhSach(nn, tc.so.danhSachQuay(ms), bao, tc.so.tienVeCanXem(), ma => daNhan.get(ma) ?? 0));
      }

      if (duong === '/quay/huy' && req.method === 'GET') {
        const don = tc.so.layDon(url.searchParams.get('ma') ?? '');
        return html(trangXacNhanHuy(nn, don && duocBam(don.trangThai, 'can_hoan_tien') ? don : null, !!don));
      }

      if (duong === '/quay/doi' && req.method === 'POST') {
        const f = new URLSearchParams((await docThan(req, 1024)) ?? '');
        const ma = f.get('ma') ?? '', tu = f.get('tu'), den = f.get('den');
        if (!laTrangThai(tu) || !laTrangThai(den)) return chuyen('/quay?bao=khong_duoc');
        const kq = tc.so.doiTrangThai(ma, tu, den, ms);
        return chuyen(`/quay?bao=${kq}&ma=${encodeURIComponent(ma)}&den=${den}#don-${encodeURIComponent(ma)}`);
      }
      if (duong === '/quay/tien-ve/da-xem' && req.method === 'POST') {
        const id = Number(new URLSearchParams((await docThan(req, 1024)) ?? '').get('id'));
        const kq = Number.isSafeInteger(id) && id > 0 ? tc.so.danhDauDaXem(id, ms) : 'khong_co';
        return chuyen(`/quay?bao=${kq === 'da_doi' ? 'tien_ve_da_xem' : kq === 'da_o_buoc_moi' ? 'tien_ve_xem_roi' : 'tien_ve_khong_co'}#tien-ve`);
      }
      return html('Not found', 404);
    }

    return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  };
}
