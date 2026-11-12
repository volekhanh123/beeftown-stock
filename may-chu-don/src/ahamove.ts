/**
 * AHAMOVE — GỌI XE GIAO ĐƠN TỪ MÁY CHỦ ĐƠN, phần thuần: cấu hình, thân đơn gửi Ahamove, đọc trạng thái, đọc lỗi
 * ========================================================================================================
 *
 * Khánh 12/11/2026: đơn trả trước giao tận nơi, giá khay đã gồm phí giao — gọi xe "gần như tự động". Chọn Ahamove (API
 * tự xin, cam kết 60 phút, công ty Việt Nam). Quầy bấm "Soạn xong, chờ giao" là máy chủ xếp một chuyến (so-don.ts);
 * goi-xe.ts gọi Ahamove, Ahamove báo trạng thái về POST /ahamove/trang-thai (may-chu.ts).
 *
 * Nguồn: tài liệu API v3 của Ahamove, developers.ahamove.com/docs (đọc 12/11/2026: Lấy token, Tạo đơn, Hủy đơn, Lấy
 * chi tiết đơn hàng, Lấy danh sách đơn hàng của mã đơn hàng nội bộ, Dòng trạng thái đơn hàng, Webhook, Data Model,
 * Hỏi đáp). Giả định chưa thử với Ahamove thật — thử trên môi trường Staging rồi mới đổi sang mã thật:
 *   · thân yêu cầu là JSON (ví dụ cURL của từng API). Trang giới thiệu lại ghi "POST dùng URL-encoded": Staging trả 400
 *     thì đổi ở dungYeuCau.
 *   · câu lỗi Ahamove trả có mã ở một trong các trường code / title / message / description / error (tài liệu chỉ
 *     liệt kê mã, không ghi dạng thân lỗi) — docLoiAhamove đọc cả năm.
 *   · webhook xác thực bằng header "apikey" do quán đặt ở Partner Portal (Tích hợp → Webhook); nhận cả
 *     "Authorization: Bearer". Thân webhook mang cả api_key của quán (mẫu callback): KHÔNG BAO GIỜ ghi thân thô ra
 *     nhật ký hay sổ đơn.
 *   · mỗi lần gọi xe một mã theo dõi riêng (mã đơn-lần): mất mạng giữa lúc tạo đơn thì tra lại theo mã đó trước khi
 *     gọi lại (goi-xe.ts) — không ra hai xe. Ahamove chặn trùng mã trong 60 giây (nhật ký cập nhật 07/11/2019); bật
 *     chặn trùng hẳn (409 DUPLICATE_TRACKING_NUMBER) là việc của Ahamove, Khánh đã hỏi trong form đăng ký.
 *   · token: tạo token mới thì token cũ hết hạn — máy chủ giữ một token trong bộ nhớ, chỉ tạo lại khi Ahamove báo 401.
 *
 * Dữ liệu khách gửi Ahamove: tên, số điện thoại, địa chỉ giao, ghi chú của khách, tên phần thịt và giá — đúng phần
 * tài xế cần để giao. Ahamove lưu ở đâu: Khánh đã hỏi (form đăng ký, câu 1), chờ trả lời trước khi chạy mã thật.
 */
import { CAU_HINH } from '../../mini-app/src/cau-hinh.ts';
import type { DonDayDu } from './so-don.ts';

export interface CauHinhAhamove {
  /** 'thu': Staging (partner-apistg) — không có tài xế thật. 'that': Production. */
  moiTruong: 'thu' | 'that';
  /** Gốc API, không "/" cuối. */
  goc: string;
  /** API key Ahamove cấp. Không bao giờ ghi ra nhật ký. */
  apiKey: string;
  /** Số điện thoại tài khoản đối tác, dạng 84xxxxxxxxx (Lấy token). */
  soDienThoai: string;
  /** Khóa quán tự đặt ở Partner Portal cho webhook (header apikey). */
  khoaWebhook: string;
  /** Số tài xế gọi khi tới lấy hàng (quầy). Mặc định: số tài khoản đối tác. */
  sdtLayHang: string;
  /** Mã dịch vụ, mặc định SGN-BIKE ("Lấy hàng ngay, giao hỏa tốc"). */
  dichVu: string;
}

export const GOC_AHAMOVE = { thu: 'https://partner-apistg.ahamove.com', that: 'https://partner-api.ahamove.com' } as const;

/** "0961 245 124", "+84961245124", "84961245124" → "84961245124"; sai dạng → null. */
export function soDangAhamove(s: string): string | null {
  let so = s.replace(/[\s.\-()]/g, '');
  if (so.startsWith('+')) so = so.slice(1);
  if (so.startsWith('0')) so = `84${so.slice(1)}`;
  return /^84\d{9}$/.test(so) ? so : null;
}

/**
 * Cấu hình từ biến môi trường. AHAMOVE_API_KEY, AHAMOVE_SO_DIEN_THOAI, AHAMOVE_KHOA_WEBHOOK: đủ cả ba hoặc không biến
 * nào (không gọi xe). AHAMOVE_MOI_TRUONG "thu" (mặc định) hoặc "that". AHAMOVE_SDT_LAY_HANG, AHAMOVE_DICH_VU: tùy chọn.
 */
export function docCauHinhAhamove(env: Record<string, string | undefined>):
  { ok: true; cauHinh: CauHinhAhamove | null } | { ok: false; loi: string } {
  const g = (k: string) => (env[k] ?? '').trim();
  const ba = { apiKey: g('AHAMOVE_API_KEY'), soDienThoai: g('AHAMOVE_SO_DIEN_THOAI'), khoaWebhook: g('AHAMOVE_KHOA_WEBHOOK') };
  const phu = { moiTruong: g('AHAMOVE_MOI_TRUONG'), sdtLayHang: g('AHAMOVE_SDT_LAY_HANG'), dichVu: g('AHAMOVE_DICH_VU') };
  if (Object.values(ba).every(v => v === '')) {
    if (Object.values(phu).some(v => v !== '')) {
      return { ok: false, loi: 'Đã đặt AHAMOVE_MOI_TRUONG / AHAMOVE_SDT_LAY_HANG / AHAMOVE_DICH_VU mà chưa đặt AHAMOVE_API_KEY, AHAMOVE_SO_DIEN_THOAI, AHAMOVE_KHOA_WEBHOOK.' };
    }
    return { ok: true, cauHinh: null };
  }
  const loi: string[] = [];
  if (!/^[A-Za-z0-9_\-]{10,200}$/.test(ba.apiKey)) loi.push('AHAMOVE_API_KEY');
  const so = soDangAhamove(ba.soDienThoai);
  if (!so) loi.push('AHAMOVE_SO_DIEN_THOAI (số đăng ký với Ahamove, ví dụ 84912345678)');
  if (!/^[A-Za-z0-9_\-]{16,200}$/.test(ba.khoaWebhook)) loi.push('AHAMOVE_KHOA_WEBHOOK (ít nhất 16 ký tự, chỉ chữ, số, - và _)');
  const moiTruong = (phu.moiTruong || 'thu') as CauHinhAhamove['moiTruong'];
  if (moiTruong !== 'thu' && moiTruong !== 'that') loi.push('AHAMOVE_MOI_TRUONG ("thu" hoặc "that")');
  const sdtLayHang = phu.sdtLayHang ? soDangAhamove(phu.sdtLayHang) : so;
  if (phu.sdtLayHang && !sdtLayHang) loi.push('AHAMOVE_SDT_LAY_HANG (số điện thoại của quầy)');
  const dichVu = phu.dichVu || 'SGN-BIKE';
  if (!/^SGN-[A-Z0-9-]{2,30}$/.test(dichVu)) loi.push('AHAMOVE_DICH_VU (mã dịch vụ TP.HCM, ví dụ SGN-BIKE)');
  if (loi.length) return { ok: false, loi: `Ahamove chưa đủ hoặc sai: ${loi.join(', ')}. Đặt đủ ba biến đầu, hoặc bỏ cả ba.` };
  return {
    ok: true,
    cauHinh: { moiTruong, goc: GOC_AHAMOVE[moiTruong], apiKey: ba.apiKey, soDienThoai: so!, khoaWebhook: ba.khoaWebhook, sdtLayHang: sdtLayHang!, dichVu },
  };
}

// ---------- Thân đơn gửi Ahamove ----------

/**
 * Điểm lấy hàng. Địa chỉ theo dạng Ahamove đòi ("[Số nhà] [Tên đường], [Phường], [Tỉnh/Thành], Việt Nam" — từ
 * 01/07/2025 không còn cấp quận). Cùng địa chỉ CAU_HINH.diaChi của Mini App (kiểm thử nhóm 24 so). Ghi chú cho tài xế
 * dùng câu chỉ đường của Mini App (CAU_HINH.chiDuong), không ghi số tầng: giấy chứng nhận ghi Tầng 4, website ghi
 * tầng 3 — chưa khớp (mini-app/CLAUDE.md, "Quy tắc chữ và thương hiệu").
 */
export const DIEM_LAY = {
  diaChi: '63 Hồ Tùng Mậu, Phường Sài Gòn, Thành phố Hồ Chí Minh, Việt Nam',
  ten: 'Beeftown',
};
export const DIA_CHI_QUAN_MINI_APP = CAU_HINH.diaChi;

/** Mã theo dõi (tracking_number) của một lần gọi xe: mã đơn + số lần. */
export const maTheoDoiXe = (maDon: string, lan: number) => `${maDon}-${lan}`;
/** Đọc lại mã đơn và lần từ mã theo dõi; mã không phải của máy chủ đơn → null. */
export function docMaTheoDoiXe(s: unknown): { maDon: string; lan: number } | null {
  const m = typeof s === 'string' ? s.match(/^([A-Z0-9]{8})-(\d{1,2})$/) : null;
  return m ? { maDon: m[1], lan: Number(m[2]) } : null;
}

const boDau = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

/** Địa chỉ khách gõ + thành phố và "Việt Nam" khi khách chưa ghi (quán chỉ giao trong TP.HCM). */
export function diaChiGiaoAhamove(diaChi: string): string {
  let s = diaChi.trim().replace(/[\s,]+$/, '');
  const k = boDau(s);
  if (!/ho chi minh|\bhcm\b|tphcm|tp\.? ?hcm/.test(k)) s += ', Thành phố Hồ Chí Minh';
  if (!/viet nam|vietnam/.test(k)) s += ', Việt Nam';
  return s;
}

const cat = (s: string, toiDa: number) => (Array.from(s).length <= toiDa ? s : Array.from(s).slice(0, toiDa - 1).join('') + '…');

export type DonChoXe = Pick<DonDayDu, 'ma' | 'soTrongNgay' | 'ten' | 'dienThoai' | 'diaChi' | 'ghiChu' | 'tongTien' | 'dong'>;

/** Khối lượng gói (kg): thịt theo số gam khoảng của khay, cộng 0,5 kg túi giữ lạnh và đá gel. */
export const khoiLuongKg = (d: DonChoXe) =>
  Math.round((d.dong.reduce((t, x) => t + x.soKhay * x.soGamKhay, 0) / 1000 + 0.5) * 10) / 10;

/**
 * Thân POST /v3/orders. Giao ngay (order_time 0), trả bằng tài khoản quán (BALANCE), không thu hộ (khách đã trả
 * trước). item_value = tổng tiền đơn (cho bảo hiểm hàng hóa nếu sau này bật INSURANCE). price của items là tiền cả
 * dòng (Hỏi đáp: "price trong items đã bao gồm số lượng").
 */
export function thanTaoChuyen(d: DonChoXe, lan: number, ch: CauHinhAhamove): Record<string, unknown> {
  const ma = maTheoDoiXe(d.ma, lan);
  return {
    order_time: 0,
    path: [
      {
        address: DIEM_LAY.diaChi, name: DIEM_LAY.ten, mobile: ch.sdtLayHang,
        remarks: `${CAU_HINH.chiDuong} Lấy hàng ở quầy thịt mang về Beeftown, đọc mã đơn ${d.ma} (số ${d.soTrongNgay}).`,
      },
      {
        address: diaChiGiaoAhamove(d.diaChi), name: cat(d.ten, 60), mobile: d.dienThoai, tracking_number: ma, item_value: d.tongTien,
        remarks: cat(`Thịt tươi giữ lạnh, giao ngay. Gọi khách trước khi tới.${d.ghiChu ? ` Ghi chú của khách: ${d.ghiChu}` : ''}`, 250),
      },
    ],
    service_id: ch.dichVu,
    requests: [],
    payment_method: 'BALANCE',
    remarks: `Beeftown đơn ${d.ma}`,
    items: d.dong.map(x => ({ _id: `${d.ma}-${x.maPhan}`, name: `${x.ten} (${x.soKhay} khay)`, price: x.soKhay * x.giaMoiKhay, num: x.soKhay })),
    package_detail: [{ weight: khoiLuongKg(d), description: 'Thịt bò tươi, giữ lạnh' }],
  };
}

export interface YeuCauAhamove { url: string; init: { method: string; headers: Record<string, string>; body?: string } }

/** Một yêu cầu tới Ahamove. token null: chỉ cho Lấy token. */
export function dungYeuCau(ch: CauHinhAhamove, method: string, duong: string, token: string | null, than?: unknown): YeuCauAhamove {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (than !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return { url: `${ch.goc}${duong}`, init: { method, headers, ...(than !== undefined ? { body: JSON.stringify(than) } : {}) } };
}

export const yeuCauToken = (ch: CauHinhAhamove) =>
  dungYeuCau(ch, 'POST', '/v3/accounts/token', null, { mobile: ch.soDienThoai, api_key: ch.apiKey });

// ---------- Đọc trạng thái chuyến (câu trả lời Tạo đơn, Lấy chi tiết, Tra theo mã theo dõi, webhook) ----------

/** Trạng thái đơn của Ahamove (Dòng trạng thái đơn hàng). CONFIRMING, PAYING: Hủy đơn có nhắc, tài liệu không tả. */
export const TRANG_THAI_CUOI = ['COMPLETED', 'CANCELLED'] as const;
export const laTrangThaiCuoi = (t: string | null | undefined) => t === 'COMPLETED' || t === 'CANCELLED';
/**
 * Chuyến khép hẳn, không đổi nữa: CANCELLED, hay COMPLETED đã biết điểm giao (giao được / không được). COMPLETED mà
 * chưa có path[1].status thì còn hỏi lại — tài liệu: COMPLETED "không có nghĩa là đã giao tới người nhận".
 */
export const daKhepHan = (t: string | null | undefined, diemGiao: string | null | undefined) =>
  t === 'CANCELLED' || (t === 'COMPLETED' && !!diemGiao);

export interface TinChuyen {
  /** Mã đơn Ahamove, đã bỏ đuôi "-<điểm giao>" của callback đơn 1-N. */
  maAha: string;
  /** Trạng thái đơn Ahamove, viết hoa, ví dụ "ASSIGNING", "IN PROCESS". */
  trangThai: string;
  trangThaiPhu: string;
  /** path[1].status: COMPLETED (giao được) · FAILED (giao không được) · '' (chưa tới). */
  diemGiao: '' | 'COMPLETED' | 'FAILED';
  /** cancel_by_user: true người dùng (quán) hủy, false tài xế / hệ thống hủy, null không có. */
  huyBoiNguoiDung: boolean | null;
  /** Lý do hủy (cancel_comment) hay giao không được (fail_comment), đã bỏ dãy số dài. */
  lyDo: string;
  taiXeTen: string;
  /** supplier_id: số điện thoại tài xế (Data Model). */
  taiXeSdt: string;
  /** shared_link — chỉ nhận đường https của ahamove.com. */
  link: string;
  /** total_price (đồng); null khi không có. */
  phi: number | null;
  /** path[1].tracking_number. */
  maTheoDoi: string;
}

const chuoi = (v: unknown, toiDa = 120) => (typeof v === 'string' ? v.trim().slice(0, toiDa) : '');
/** Bỏ dãy từ 8 chữ số (số điện thoại, số tài khoản) khỏi câu Ahamove trả, trước khi lưu hay ghi nhật ký. */
export const boDaySo = (s: string) => s.replace(/\+?\d[\d\s.\-]{7,}\d/g, '…');

/**
 * Đọc một đơn Ahamove từ bất kỳ câu trả lời nào: dạng Tạo đơn ({order_id, status, shared_link, order: {...}}) hay dạng
 * đơn trơn (Lấy chi tiết, callback). Thiếu mã đơn → null. Không giữ gì ngoài các trường của TinChuyen (thân webhook
 * có api_key của quán).
 */
export function docTinChuyen(v: unknown): TinChuyen | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const goc = v as Record<string, unknown>;
  const o = goc.order && typeof goc.order === 'object' && !Array.isArray(goc.order) ? { ...goc.order as Record<string, unknown>, ...goc } : goc;
  const id = chuoi(o.order_id) || chuoi(o._id);
  const maAha = id.replace(/^([A-Za-z0-9]{4,20})-\d{1,2}$/, '$1');
  if (!/^[A-Za-z0-9]{4,20}$/.test(maAha)) return null;
  const path = Array.isArray(o.path) ? o.path as unknown[] : [];
  const giao = (path[1] && typeof path[1] === 'object' ? path[1] : {}) as Record<string, unknown>;
  const tt = chuoi(o.status, 20).toUpperCase();
  const diem = chuoi(giao.status, 20).toUpperCase();
  const link = chuoi(o.shared_link, 300);
  const phi = typeof o.total_price === 'number' && Number.isFinite(o.total_price) ? Math.round(o.total_price)
    : typeof o.total_pay === 'number' && Number.isFinite(o.total_pay) ? Math.round(o.total_pay) : null;
  const lyDo = tt === 'CANCELLED' ? chuoi(o.cancel_comment, 200) : diem === 'FAILED' ? chuoi(giao.fail_comment, 200) : '';
  return {
    maAha,
    trangThai: /^[A-Z ]{3,20}$/.test(tt) ? tt : '',
    trangThaiPhu: /^[A-Z_]{2,20}$/.test(chuoi(o.sub_status, 20).toUpperCase()) ? chuoi(o.sub_status, 20).toUpperCase() : '',
    diemGiao: diem === 'COMPLETED' || diem === 'FAILED' ? diem : '',
    huyBoiNguoiDung: typeof o.cancel_by_user === 'boolean' ? o.cancel_by_user : null,
    lyDo: boDaySo(lyDo),
    taiXeTen: chuoi(o.supplier_name, 80),
    taiXeSdt: /^\+?\d{9,12}$/.test(chuoi(o.supplier_id, 20)) ? chuoi(o.supplier_id, 20) : '',
    link: /^https:\/\/([a-z0-9-]+\.)*ahamove\.com\/[\w\-./?=&%]*$/i.test(link) ? link : '',
    phi,
    maTheoDoi: chuoi(giao.tracking_number, 40),
  };
}

// ---------- Lỗi ----------

/** Mã lỗi Ahamove (danh sách "Các lỗi thường gặp") hoặc HTTP_<số>, và câu đã bỏ dãy số. */
export interface LoiAhamove { ma: string; cau: string }

export function docLoiAhamove(status: number, json: unknown): LoiAhamove {
  const o = json && typeof json === 'object' && !Array.isArray(json) ? json as Record<string, unknown> : {};
  const chu = ['code', 'title', 'error', 'message', 'description'].map(k => chuoi(o[k], 200)).filter(Boolean);
  const ma = chu.find(c => /^[A-Z][A-Z_]{3,40}$/.test(c)) ?? `HTTP_${status}`;
  const cau = boDaySo(chu.find(c => c !== ma) ?? '');
  return { ma, cau };
}

/**
 * Lỗi khi tạo đơn: token (401: tạo token mới rồi gửi lại) · trung (409: Ahamove đã có đơn mang mã này — tra lại) ·
 * tu_choi (400, 403, 404, 406: Ahamove không nhận đơn này, gửi lại cũng vậy) · bao_tri (503: chưa tạo, gửi lại sau) ·
 * khong_ro (500 và câu lạ: Ahamove có thể đã tạo, cũng có thể "không định vị được địa chỉ" — tra lại rồi mới gửi).
 */
export type KieuLoiTao = 'token' | 'trung' | 'tu_choi' | 'bao_tri' | 'khong_ro';
export function phanLoaiLoiTao(status: number): KieuLoiTao {
  if (status === 401) return 'token';
  if (status === 409) return 'trung';
  if (status === 400 || status === 403 || status === 404 || status === 406) return 'tu_choi';
  if (status === 503) return 'bao_tri';
  return 'khong_ro';
}

/**
 * Webhook đúng của quán: header apikey (cách "API Key" của tài liệu) hay Authorization: Bearer bằng
 * AHAMOVE_KHOA_WEBHOOK. `bangNhau` so không lộ thời gian (may-chu.ts).
 */
export function khoaWebhookTrongYeuCau(h: Headers): string {
  const k = h.get('apikey') ?? h.get('x-api-key');
  if (k) return k.trim();
  const a = h.get('authorization') ?? '';
  return a.toLowerCase().startsWith('bearer ') ? a.slice(7).trim() : '';
}

// ---------- Một chuyến xe trong sổ đơn (bảng chuyen_xe) và bước quầy thấy ----------

/**
 * Việc máy chủ còn phải làm với chuyến: tao (gửi Tạo đơn) · kiem_lai (đã gửi mà không rõ kết quả — mất mạng, hết giờ,
 * 500, 409, máy chủ tắt giữa chừng: tra theo mã theo dõi trước khi gửi lại) · huy (quầy hủy đơn: hủy chuyến) · null.
 */
export type ViecXe = 'tao' | 'kiem_lai' | 'huy';

export interface ChuyenXe {
  maDon: string;
  /** Lần gọi xe thứ mấy của đơn (1, 2…): mã theo dõi = mã đơn-lần. */
  lan: number;
  viec: ViecXe | null;
  viecSau: number;
  soLan: number;
  maAha: string | null;
  trangThaiAha: string | null;
  trangThaiPhu: string | null;
  diemGiao: string | null;
  lyDo: string | null;
  taiXeTen: string | null;
  taiXeSdt: string | null;
  link: string | null;
  phi: number | null;
  /** Mã lỗi khi Ahamove không nhận đơn (tạo hỏng hẳn), hay QUA_SO_LAN. */
  maLoi: string | null;
  /** Câu lỗi lần gần nhất (đã bỏ dãy số) — cho nhật ký và người sửa máy, quầy thấy câu dịch theo maLoi. */
  loi: string | null;
  /** Quầy đã hủy đơn: chuyến phải hủy (và đã hủy, khi viec hết 'huy'). */
  huyYeuCau: boolean;
  /** Hủy không được (tài xế đã lấy hàng, hay Ahamove không trả lời) — quầy gọi tài xế / Ahamove. */
  loiHuy: string | null;
  /** Quầy bấm "tự xử lý": thôi báo chuyến này. */
  tuGoiLuc: number | null;
  taoLuc: number;
  capNhatLuc: number;
  /** Lần cuối Ahamove báo (webhook) hay máy chủ hỏi được trạng thái. */
  ahaLuc: number | null;
}

/** Ahamove không nhận đơn hay không trả lời quá chừng này lần thì thôi, báo quầy. */
export const SO_LAN_TAO_TOI_DA = 4;
/** Hủy chuyến hỏng (mất mạng, 5xx) quá chừng này lần thì báo quầy. */
export const SO_LAN_HUY_TOI_DA = 5;
/** Gửi Tạo đơn rồi mà không rõ kết quả: chờ chừng này mới tra lại (Ahamove chặn trùng mã trong 60 giây). */
export const MS_CHO_KIEM_LAI = 60_000;
/** Webhook im quá chừng này thì máy chủ tự hỏi trạng thái chuyến. */
export const MS_HOI_LAI = 3 * 60_000;
/** Chuyến tạo quá chừng này giờ mà chưa khép thì thôi hỏi (Ahamove đã có cổng đối tác để tra). */
export const MS_THOI_HOI = 6 * 3600_000;
/** Đang gọi xe (chưa có đơn Ahamove) quá chừng này: báo quầy, không chờ mãi. */
export const MS_GOI_LAU = 5 * 60_000;

export type BuocXe =
  | 'dang_goi' | 'tim_tai_xe' | 'tai_xe_toi' | 'dang_giao' | 'da_giao' | 'giao_hong' | 'aha_huy' | 'khong_goi_duoc'
  | 'dang_huy' | 'quan_huy' | 'huy_khong_duoc' | 'tu_goi';

/**
 * Bước quầy thấy của một chuyến, và chuyến có cần người làm không (canXem): Ahamove không nhận đơn, Ahamove hủy (không
 * có tài xế…), giao không được, hủy không được, gọi lâu chưa xong. choGoiLai: quầy được bấm "Gọi lại xe".
 */
export function buocXe(c: ChuyenXe, ms: number): { buoc: BuocXe; canXem: boolean; choGoiLai: boolean } {
  const r = (buoc: BuocXe, canXem = false, choGoiLai = false) => ({ buoc, canXem, choGoiLai });
  if (c.loiHuy) return r('huy_khong_duoc', c.tuGoiLuc === null);
  if (c.tuGoiLuc !== null) return r('tu_goi');
  if (c.viec === 'huy') return r('dang_huy');
  // Quầy đã hủy đơn: chuyến đã hủy hay chưa từng có. Ahamove báo đã giao (giao xong trước khi kịp hủy) thì nói thật.
  if (c.huyYeuCau && c.trangThaiAha !== 'COMPLETED') return r('quan_huy');
  if (c.trangThaiAha === 'CANCELLED') return r('aha_huy', true, true);
  if (!c.maAha) {
    if (c.viec === null && c.maLoi) return r('khong_goi_duoc', true, true);
    return r('dang_goi', ms - c.taoLuc > MS_GOI_LAU);
  }
  if (c.trangThaiAha === 'COMPLETED') {
    if (c.diemGiao === 'FAILED' || c.trangThaiPhu === 'IN_RETURN' || c.trangThaiPhu === 'RETURNED') return r('giao_hong', true, true);
    // Chưa rõ điểm giao: máy chủ hỏi lại (chuyenCanHoi) — chưa nói "đã giao".
    return c.diemGiao === 'COMPLETED' ? r('da_giao') : r('dang_giao');
  }
  if (c.trangThaiAha === 'IN PROCESS') return r('dang_giao');
  if (c.trangThaiAha === 'ACCEPTED' || c.trangThaiAha === 'CONFIRMING' || c.trangThaiAha === 'PAYING') return r('tai_xe_toi');
  return r('tim_tai_xe');
}
