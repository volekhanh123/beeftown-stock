/**
 * ZALO ZBS — PHẦN THUẦN (không I/O)
 * =================================
 *
 * Dựng yêu cầu gọi Zalo, đọc câu trả lời, phân loại lỗi, xóa bí mật khỏi câu
 * log. Không đọc biến môi trường, không gọi mạng — lib/zalo-gui.ts lo phần đó.
 * crm/test/test-zalo-web.mjs nạp thẳng file này bằng Node.
 *
 * Viết 27/09/2026 khi proxy chặn tài liệu Zalo, theo chuẩn ZNS/ZBS đã biết. ĐÃ ĐỐI CHIẾU tài liệu thật ngày
 * 23/10/2026 (đọc từ máy của Khánh). Mọi chi tiết API — địa chỉ, tên trường, tên header, mã lỗi — gom vào MỘT
 * hằng ZALO_API ngay dưới đây; Zalo đổi API thì chỉ sửa hằng đó.
 */

// =============================================================================
// CHỈNH KHI CÓ TÀI LIỆU — mọi chi tiết API Zalo nằm trong hằng này
// =============================================================================
/**
 * ĐÃ ĐỐI CHIẾU 23/10/2026 với tài liệu Zalo (nguồn từng mục: web/README.md, mục Zalo). ZNS gộp vào "ZBS Template
 * Message" từ 01/01/2026: cùng địa chỉ, cùng trường. Zalo trả expires_in và quota dạng chuỗi (đọc bằng Number);
 * chế độ development không trả quota; không gửi sending_mode (mặc định 1).
 * Như tài liệu:
 *
 *  · Làm mới token: POST oauth.zaloapp.com/v4/oa/access_token, header
 *    `secret_key`, thân dạng form (app_id, grant_type=refresh_token,
 *    refresh_token) → JSON { access_token, refresh_token, expires_in }.
 *    access token sống ~25 giờ (expires_in ~90000 giây). Refresh token MỚI
 *    mỗi lần làm mới, cái cũ hết dùng được ngay (dùng một lần), sống ~3 tháng.
 *    Lỗi: JSON { error: <số âm>, error_name, error_description } — dạng lỗi của
 *    đường này tài liệu không ghi; còn là giả định.
 *  · Gửi tin: POST business.openapi.zalo.me/message/template, header
 *    `access_token`, JSON { phone: "84…", template_id, template_data,
 *    tracking_id, mode? } — mode "development" chỉ khi gửi thử (chỉ quản trị
 *    viên của OA / App nhận được). → { error: 0, message, data: { msg_id,
 *    sent_time, quota: { dailyQuota, remainingQuota } } }; lỗi → error ≠ 0.
 *  · Bảng mã lỗi `maLoi`: theo bảng mã lỗi ZBS đã đối chiếu. Mã không có trong
 *    bảng coi là lỗi tạm thời (thử lại sau) — an toàn hơn là bỏ tin.
 */
export const ZALO_API = {
  token: {
    url: 'https://oauth.zaloapp.com/v4/oa/access_token',
    headerBiMat: 'secret_key',
    truong: { appId: 'app_id', grantType: 'grant_type', refreshToken: 'refresh_token' },
    grantType: 'refresh_token',
    tra: { accessToken: 'access_token', refreshToken: 'refresh_token', hetHanGiay: 'expires_in' },
    /** Zalo không báo expires_in thì coi là chừng này giây. */
    hetHanMacDinhGiay: 90_000,
  },
  gui: {
    url: 'https://business.openapi.zalo.me/message/template',
    headerToken: 'access_token',
    truong: {
      sdt: 'phone', mauId: 'template_id', duLieu: 'template_data', theoDoi: 'tracking_id', cheDo: 'mode',
    },
    /** Giá trị `mode` khi zalo_cau_hinh.che_do = 'thu'. Chế độ thật thì không gửi trường này. */
    modeThu: 'development',
    tra: { maLoi: 'error', cau: 'message', duLieu: 'data', msgId: 'msg_id', quota: 'quota', conLai: 'remainingQuota' },
  },
  /** Một lời gọi Zalo chờ tối đa chừng này. */
  timeoutMs: 15_000,
  /** Access token còn ít hơn chừng này giây thì làm mới trước khi gửi. */
  lamMoiKhiConGiay: 3_600,
  /**
   * Mã lỗi Zalo → cách xử lý (xem XU_LY_LOI), theo bảng mã lỗi đã đối chiếu 23/10/2026. Mã không có ở đây
   * → 'thu_lai' (an toàn hơn bỏ tin). Bản giả định 27/09 xếp nhầm -126 (ví chế độ thử hết tiền) vào người
   * nhận và -110 (máy người nhận dùng Zalo quá cũ) vào cấu hình — dừng cả lượt 1 giờ vì một khách.
   */
  maLoi: [
    { loai: 'token',      ma: [-124, -216],                       ghiChu: 'access token sai / hết hạn' },
    { loai: 'gioi_han',   ma: [-32],                              ghiChu: 'App / OA gọi quá giới hạn mỗi phút' },
    { loai: 'het_quota',  ma: [-115, -126, -137, -144, -1441, -147],
      ghiChu: 'ví ZBS hết tiền / trừ tiền hỏng / ví chế độ thử hết tiền / hết quota ngày của OA, tháng (khuyến mãi), ngày của mẫu' },
    { loai: 'ngoai_gio',  ma: [-133],                             ghiChu: 'loại tin này không gửi được 22:00–07:00' },
    { loai: 'nguoi_nhan', ma: [-108, -110, -114, -118, -119, -127, -139, -140, -141, -1471, -1472],
      ghiChu: 'số sai / không có Zalo / Zalo quá cũ / không nhận được / từ chối tin / không đủ điều kiện / quá giới hạn tin khuyến mãi cho người này / chế độ thử: không phải quản trị viên' },
    { loai: 'mau',        ma: [-109, -111, -112, -113, -1121, -1122, -1123, -1124, -1131, -116, -117, -121, -122, -130, -131, -132, -145],
      ghiChu: 'mã mẫu sai / chưa duyệt / không có quyền dùng / tham số thiếu, sai dạng, quá dài / nút, liên kết sai / OA không được gửi loại nội dung này' },
    { loai: 'cau_hinh',   ma: [-101, -102, -103, -104, -105, -106, -120, -1202, -1241, -125, -135, -1351, -136, -138, -1381],
      ghiChu: 'App / OA / secret key sai, App chưa bật hay chưa nối OA, OA chưa mua gói, chưa xác thực hay bị chặn gửi tin SĐT, chưa nối ZBS Account, không có quyền' },
  ],
} as const;

// =============================================================================
// PHÂN LOẠI LỖI → KẾT QUẢ GHI VÀO nhat_ky_tin
// =============================================================================
export type LoaiLoiZalo =
  | 'token' | 'thu_lai' | 'gioi_han' | 'het_quota' | 'ngoai_gio' | 'nguoi_nhan' | 'mau' | 'cau_hinh';

export interface XuLyLoi {
  /** Gửi zalo_ghi_ket_qua với kết quả này. */
  ketQua: 'that_bai' | 'bi_tu_choi';
  /** Giây chờ trước khi thử lại (p_thu_lai_sau); null = không thử lại. */
  thuLaiSau: number | null;
  /** Ngừng gửi phần còn lại của lượt (lỗi chung, không phải của riêng tin này). */
  dungLuot: boolean;
}

/** Cách xử lý từng loại lỗi. Dữ liệu — sửa ở đây, không rải if khắp nơi. */
export const XU_LY_LOI: Readonly<Record<LoaiLoiZalo, XuLyLoi>> = {
  // Token: người gửi làm mới MỘT lần rồi gửi lại; vẫn hỏng thì dừng lượt.
  token:      { ketQua: 'that_bai',   thuLaiSau: 600,      dungLuot: true },
  thu_lai:    { ketQua: 'that_bai',   thuLaiSau: 300,      dungLuot: false },
  gioi_han:   { ketQua: 'that_bai',   thuLaiSau: 900,      dungLuot: true },
  het_quota:  { ketQua: 'that_bai',   thuLaiSau: 6 * 3600, dungLuot: true },
  ngoai_gio:  { ketQua: 'that_bai',   thuLaiSau: 3600,     dungLuot: true },
  nguoi_nhan: { ketQua: 'bi_tu_choi', thuLaiSau: null,     dungLuot: false },
  mau:        { ketQua: 'that_bai',   thuLaiSau: null,     dungLuot: false },
  cau_hinh:   { ketQua: 'that_bai',   thuLaiSau: 3600,     dungLuot: true },
};

/** Mã lỗi Zalo → loại. Mã lạ → 'thu_lai'. */
export function loaiCuaMa(ma: number): LoaiLoiZalo {
  for (const d of ZALO_API.maLoi) if ((d.ma as readonly number[]).includes(ma)) return d.loai;
  return 'thu_lai';
}

/** Loại của một lỗi HTTP không có JSON đọc được. */
export function loaiCuaHttp(status: number): LoaiLoiZalo {
  if (status === 429) return 'gioi_han';
  if (status === 401) return 'token';
  return 'thu_lai';
}

// =============================================================================
// CÂU CỦA PHẦN GỬI — hai thứ tiếng (database chỉ giữ tiếng Việt; trang dịch lại
// bằng dichLoiZalo)
// =============================================================================
type Hai = { vi: string; en: string };
type CauMau = { vi: (x: string) => string; en: (x: string) => string };

export const CAU_GUI = {
  loiMa: {
    vi: (x: string) => `Zalo báo lỗi ${x}`,
    en: (x: string) => `Zalo returned error ${x}`,
  },
  loiHttp: { vi: (x: string) => `Zalo trả lỗi HTTP ${x}`, en: (x: string) => `Zalo returned an HTTP ${x} error` },
  khongTraLoi: {
    vi: (x: string) => `Zalo không trả lời sau ${x} giây`,
    en: (x: string) => `Zalo did not answer within ${x} seconds`,
  },
  mang: { vi: (x: string) => `Không gọi được Zalo: ${x}`, en: (x: string) => `Could not reach Zalo: ${x}` },
  khongJson: { vi: 'Zalo trả về nội dung không phải JSON', en: 'Zalo returned something that is not JSON' },
  sdtSai: { vi: 'Số điện thoại không dùng được cho Zalo', en: 'The phone number cannot be used for Zalo' },
  thieuMau: { vi: 'Mẫu tin chưa có mã mẫu Zalo', en: 'The template has no Zalo template ID' },
  chuaGui: { vi: (x: string) => `Chưa gửi — ${x}`, en: (x: string) => `Not sent — ${x}` },
  tokenHong: {
    vi: 'Không giải mã được token Zalo (ZALO_KHOA đã đổi?) — chủ nhà hàng dán lại refresh token ở Cài đặt Zalo',
    en: 'Could not decrypt the Zalo token (was ZALO_KHOA changed?) — the owner should paste the refresh token again in Zalo settings',
  },
  chuaCoToken: {
    vi: 'Chưa có refresh token Zalo — chủ nhà hàng dán ở Cài đặt Zalo',
    en: 'No Zalo refresh token yet — the owner pastes it in Zalo settings',
  },
  lamMoiLoi: {
    vi: (x: string) => `Không làm mới được token Zalo: ${x}`,
    en: (x: string) => `Could not refresh the Zalo token: ${x}`,
  },
  lamMoiTuChoi: {
    vi: (x: string) => `Zalo từ chối refresh token (${x}) — chủ nhà hàng lấy refresh token mới và dán lại ở Cài đặt Zalo`,
    en: (x: string) => `Zalo rejected the refresh token (${x}) — the owner should get a new refresh token and paste it in Zalo settings`,
  },
  luuTokenLoi: {
    vi: (x: string) => `Đã làm mới token Zalo nhưng không lưu được (${x}) — chủ nhà hàng nên dán lại refresh token`,
    en: (x: string) => `The Zalo token was refreshed but could not be saved (${x}) — the owner should paste the refresh token again`,
  },
  tokenVanHong: {
    vi: 'Zalo vẫn từ chối access token sau khi làm mới',
    en: 'Zalo still rejects the access token after refreshing it',
  },
  hetGio: {
    vi: 'Hết thời gian của lượt — phần còn lại gửi ở lượt sau',
    en: 'The run ran out of time — the rest is sent in the next run',
  },
  dungChuaGhi: {
    vi: (x: string) => `Database không ghi được kết quả tin ${x} — dừng gửi lượt này, phần còn lại gửi ở lượt sau`,
    en: (x: string) => `The database could not record the result of message ${x} — sending stopped for this run, the rest is sent in the next run`,
  },
  daToiChuaGhi: {
    vi: (x: string) => `Tin ${x} đã tới Zalo nhưng chưa ghi được vào database — có thể bị gửi lần hai cho khách`,
    en: (x: string) => `Message ${x} reached Zalo but could not be recorded in the database — the customer may get it twice`,
  },
} satisfies Record<string, CauMau | Hai>;

const CHO = '\u0000';

/**
 * Câu của phần gửi (lưu trong database bằng tiếng Việt: nhat_ky_tin.loi,
 * zalo_cau_hinh.loi_cuoi) → ngôn ngữ đang xem. Câu không phải của file này
 * (câu của database) → `duPhong` (trang truyền dichCau vào).
 */
export function dichLoiZalo(cau: string | null | undefined, nn: 'vi' | 'en', duPhong: (s: string) => string = s => s): string {
  if (!cau) return '';
  if (nn === 'vi') return cau;
  const dich = (s: string): string => {
    for (const c of Object.values(CAU_GUI)) {
      if (typeof c.vi === 'string') { if (s === c.vi) return c.en as string; continue; }
      const m = c as CauMau;
      const [dau, cuoi = ''] = m.vi(CHO).split(CHO);
      if (s.length >= dau.length + cuoi.length && s.startsWith(dau) && s.endsWith(cuoi)) {
        return m.en(dich(s.slice(dau.length, s.length - cuoi.length)));
      }
    }
    return duPhong(s);
  };
  return dich(cau);
}

// =============================================================================
// SỐ ĐIỆN THOẠI, THAM SỐ MẪU
// =============================================================================
/**
 * '0912345678' → '84912345678' (Zalo cần mã nước, không dấu +). Nhận cả
 * '+84…', '84…', có dấu cách / chấm / gạch. Không phải số di động VN 10 số → null.
 */
export function sdtZalo(sdt: string | null | undefined): string | null {
  const s = String(sdt ?? '').replace(/[\s.\-()]/g, '');
  let noi: string;
  if (/^\+84\d{9}$/.test(s)) noi = s.slice(3);
  else if (/^84\d{9}$/.test(s)) noi = s.slice(2);
  else if (/^0\d{9}$/.test(s)) noi = s.slice(1);
  else return null;
  if (!/^[35789]/.test(noi)) return null;
  return '84' + noi;
}

/** Tên tham số trong <...> của nội dung mẫu, theo thứ tự, không lặp — cùng luật với zalo_rut_tham_so (0047). */
export function thamSo(noiDung: string | null | undefined): string[] {
  const ra: string[] = [];
  for (const m of String(noiDung ?? '').matchAll(/<([A-Za-z_][A-Za-z0-9_]*)>/g)) {
    if (!ra.includes(m[1])) ra.push(m[1]);
  }
  return ra;
}

/** Điền tham số vào nội dung mẫu để xem trước. Thiếu giá trị thì giữ nguyên <tên>. */
export function dienNoiDung(noiDung: string, duLieu: Record<string, unknown> | null | undefined): string {
  return String(noiDung ?? '').replace(/<([A-Za-z_][A-Za-z0-9_]*)>/g, (goc, ten: string) => {
    const v = duLieu?.[ten];
    return v === undefined || v === null || v === '' ? goc : String(v);
  });
}

/** template_data: chỉ giữ giá trị chuỗi / số (đổi thành chuỗi). */
export function duLieuMau(duLieu: unknown): Record<string, string> {
  const ra: Record<string, string> = {};
  if (!duLieu || typeof duLieu !== 'object' || Array.isArray(duLieu)) return ra;
  for (const [k, v] of Object.entries(duLieu as Record<string, unknown>)) {
    if (typeof v === 'string') ra[k] = v;
    else if (typeof v === 'number' && Number.isFinite(v)) ra[k] = String(v);
  }
  return ra;
}

// =============================================================================
// DỰNG YÊU CẦU
// =============================================================================
export interface YeuCau {
  url: string;
  init: { method: 'POST'; headers: Record<string, string>; body: string };
}

export interface ThamSoGui {
  /** Đã đổi sang 84… bằng sdtZalo. */
  sdt84: string;
  templateId: string;
  duLieu: unknown;
  /** id của dòng nhat_ky_tin — Zalo trả lại trong báo cáo. */
  trackingId: string;
  cheDo: 'thu' | 'that';
}

/** Thân JSON gửi tin (tách riêng để test đọc). mode chỉ có khi chế độ thử. */
export function thanGui(t: ThamSoGui): Record<string, unknown> {
  const f = ZALO_API.gui.truong;
  const than: Record<string, unknown> = {
    [f.sdt]: t.sdt84,
    [f.mauId]: t.templateId,
    [f.duLieu]: duLieuMau(t.duLieu),
    [f.theoDoi]: t.trackingId,
  };
  if (t.cheDo === 'thu') than[f.cheDo] = ZALO_API.gui.modeThu;
  return than;
}

export function dungYeuCauGui(t: ThamSoGui, accessToken: string): YeuCau {
  return {
    url: ZALO_API.gui.url,
    init: {
      method: 'POST',
      headers: { 'content-type': 'application/json', [ZALO_API.gui.headerToken]: accessToken },
      body: JSON.stringify(thanGui(t)),
    },
  };
}

export function dungYeuCauToken(o: { appId: string; refreshToken: string; secretKey: string }): YeuCau {
  const t = ZALO_API.token;
  const than = new URLSearchParams();
  than.set(t.truong.appId, o.appId);
  than.set(t.truong.grantType, t.grantType);
  than.set(t.truong.refreshToken, o.refreshToken);
  return {
    url: t.url,
    init: {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', [t.headerBiMat]: o.secretKey },
      body: than.toString(),
    },
  };
}

// =============================================================================
// ĐỌC CÂU TRẢ LỜI
// =============================================================================
export type PhanHoiGui =
  | { ok: true; msgId: string | null; quotaConLai: number | null }
  | { ok: false; loai: LoaiLoiZalo; ma: number | null; cau: string };

const laObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const chuNgan = (x: unknown, n = 160) => String(x ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

/**
 * Câu trả lời của lệnh gửi tin → kết quả. `json` là thân đã parse (hoặc
 * undefined khi không phải JSON). Không bao giờ ném lỗi.
 */
export function docPhanHoi(status: number, json: unknown): PhanHoiGui {
  const r = ZALO_API.gui.tra;
  if (laObj(json) && r.maLoi in json) {
    const ma = Number(json[r.maLoi]);
    if (ma === 0) {
      const d = laObj(json[r.duLieu]) ? json[r.duLieu] as Record<string, unknown> : {};
      const q = laObj(d[r.quota]) ? d[r.quota] as Record<string, unknown> : {};
      const con = Number(q[r.conLai]);
      const msg = d[r.msgId];
      return {
        ok: true,
        msgId: msg === undefined || msg === null || msg === '' ? null : String(msg).slice(0, 200),
        quotaConLai: Number.isFinite(con) && q[r.conLai] !== null && q[r.conLai] !== '' ? Math.trunc(con) : null,
      };
    }
    if (Number.isFinite(ma)) {
      const moTa = chuNgan(json[r.cau]);
      return { ok: false, loai: loaiCuaMa(ma), ma, cau: CAU_GUI.loiMa.vi(moTa ? `${ma}: ${moTa}` : String(ma)) };
    }
  }
  if (status < 200 || status >= 300) {
    return { ok: false, loai: loaiCuaHttp(status), ma: null, cau: CAU_GUI.loiHttp.vi(String(status)) };
  }
  return { ok: false, loai: 'thu_lai', ma: null, cau: CAU_GUI.khongJson.vi };
}

export type PhanHoiToken =
  | { ok: true; accessToken: string; refreshToken: string | null; hetHanGiay: number }
  | { ok: false; /** Lỗi mạng / 5xx — lượt sau thử lại; false = Zalo từ chối refresh token. */ tamThoi: boolean; cau: string };

/** Câu trả lời của lệnh làm mới token → kết quả. Không bao giờ ném lỗi. */
export function docPhanHoiToken(status: number, json: unknown): PhanHoiToken {
  const t = ZALO_API.token.tra;
  if (laObj(json) && typeof json[t.accessToken] === 'string' && (json[t.accessToken] as string).length > 0) {
    const het = Number(json[t.hetHanGiay]);
    const moi = json[t.refreshToken];
    return {
      ok: true,
      accessToken: json[t.accessToken] as string,
      refreshToken: typeof moi === 'string' && moi.length > 0 ? moi : null,
      hetHanGiay: Number.isFinite(het) && het > 0 ? het : ZALO_API.token.hetHanMacDinhGiay,
    };
  }
  if (status >= 500 || status === 429) return { ok: false, tamThoi: true, cau: CAU_GUI.loiHttp.vi(String(status)) };
  if (laObj(json)) {
    const ma = json.error ?? json.error_code;
    const moTa = chuNgan(json.error_description ?? json.error_reason ?? json.error_name ?? json.message);
    const ct = [ma !== undefined && ma !== null ? String(ma) : '', moTa].filter(Boolean).join(': ');
    return { ok: false, tamThoi: false, cau: ct || CAU_GUI.loiHttp.vi(String(status)) };
  }
  if (status < 200 || status >= 300) return { ok: false, tamThoi: status >= 500, cau: CAU_GUI.loiHttp.vi(String(status)) };
  return { ok: false, tamThoi: true, cau: CAU_GUI.khongJson.vi };
}

// =============================================================================
// XÓA BÍ MẬT KHỎI CÂU LOG / CÂU LỖI
// =============================================================================
/**
 * Xóa khỏi một câu: đúng các chuỗi bí mật truyền vào (token thô, secret key —
 * cả dạng mã hóa URL), mọi "access_token=…" / "refresh_token: …" /
 * "secret_key=…", và số điện thoại (0…, 84…, +84…). Câu log và câu lỗi ghi vào
 * database đều đi qua đây.
 */
export function xoaBiMatZalo(cau: unknown, ...biMat: Array<string | null | undefined>): string {
  let s = String(cau ?? '');
  for (const b of biMat) {
    if (!b || b.length < 4) continue;
    for (const t of new Set([b, encodeURIComponent(b)])) s = s.split(t).join('***');
  }
  s = s.replace(/(access_token|refresh_token|secret_key|token|code)(["']?\s*[=:]\s*["']?)[^&\s"',;}]+/gi, '$1$2***');
  s = s.replace(/(?<![\w])(?:\+?84|0)\d{8,10}(?![\w])/g, '***');
  return s;
}
