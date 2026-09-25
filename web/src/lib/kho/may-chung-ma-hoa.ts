/**
 * KHO — MÁY DÙNG CHUNG: MÃ HÓA, BĂM PIN, MỐC HOẠT ĐỘNG (GĐ5d, migration 0034)
 *
 * File THUẦN: chỉ dùng Web Crypto (`crypto.subtle`), `TextEncoder`, `btoa` /
 * `atob` — có sẵn ở cả Cloudflare Worker lẫn Node 22, nên crm/test nạp thẳng
 * được bằng Node. Không import gì lúc chạy, không đọc biến môi trường: bí mật
 * `KHO_MAY_KHOA` do nơi gọi đọc (`cloudflare:workers`) rồi truyền vào.
 *
 * MỘT BÍ MẬT, NHIỀU KHÓA
 *
 * Từ `KHO_MAY_KHOA` dẫn ra một khóa riêng cho TỪNG mục đích bằng HKDF-SHA256
 * (info khác nhau). Lộ một khóa con không lộ các khóa kia, và không bao giờ
 * dùng cùng một khóa cho hai việc:
 *
 *   token  AES-GCM 256 — mã hóa refresh token cất trong cookie bt_may_s_* /
 *          bt_may_tb. AAD = "may_id|nhan_su_id": cookie của người này bê sang
 *          người khác hay máy khác là giải mã hỏng.
 *   pin    HMAC-SHA256 — pin_bam = HMAC(may_id|nhan_su_id|pin). Database chỉ
 *          thấy pin_bam; thiếu khóa thì không dò được PIN 4–6 số dù có đủ bảng.
 *   moc    HMAC-SHA256 — ký mốc hoạt động (cookie bt_may_hd) để không ai sửa
 *          tay mốc đó mà kéo dài giờ tự khóa.
 *   ten    HMAC-SHA256 — tên cookie bt_may_s_<8 hex> của từng người (không lộ
 *          id nhân sự trong tên cookie).
 *
 * Đổi bí mật = mọi cookie máy cũ giải mã hỏng + mọi PIN cũ không khớp: mọi
 * người phải gắn lại vào máy. Đó là cách "thu hồi tất cả" khi nghi lộ.
 */

// -----------------------------------------------------------------------------
// HẰNG SỐ
// -----------------------------------------------------------------------------
/** Phút không dùng thì máy tự khóa, khi máy chưa có phut_khoa (kho_may.phut_khoa mặc định 5). */
export const PHUT_KHOA_MAC_DINH = 5;
/** POST quá giờ khóa vẫn được ghi nếu chưa quá AN_HAN_POST × phut_khoa (đang gõ dở phiếu dài). */
export const AN_HAN_POST = 2;
/** Mốc hoạt động "ở tương lai" quá chừng này (đồng hồ lệch) thì coi như hỏng → khóa. */
export const LECH_DONG_HO_MS = 60_000;
/** Bí mật KHO_MAY_KHOA tối thiểu (ký tự). Tạo bằng: openssl rand -base64 32 */
export const BI_MAT_TOI_THIEU = 32;

export const COOKIE_MAY_TB = 'bt_may_tb';
export const COOKIE_MAY_HD = 'bt_may_hd';
export const COOKIE_MAY_NGUOI_TIEN_TO = 'bt_may_s_';

const MUOI_HKDF = 'beeftown/kho/may-chung/v1';
const TIEN_TO_MA = 'v1.';

export type MucDich = 'token' | 'pin' | 'moc' | 'ten';

/** Bộ khóa dẫn xuất từ KHO_MAY_KHOA — tạo một lần mỗi request bằng danKhoaMay(). */
export interface KhoaMay {
  token: CryptoKey;
  pin: CryptoKey;
  moc: CryptoKey;
  ten: CryptoKey;
}

/** Mốc hoạt động trong cookie bt_may_hd. nhanSuId null = máy đang khóa (không ai dùng). */
export interface MocHoatDong {
  mayId: string;
  nhanSuId: string | null;
  /** Lúc hoạt động gần nhất, mili giây kể từ 1970 (Date.now()). */
  luc: number;
}

// -----------------------------------------------------------------------------
// TIỆN ÍCH
// -----------------------------------------------------------------------------
const maHoaChu = new TextEncoder();
const giaiMaChu = new TextDecoder('utf-8', { fatal: true });

function chuSangByte(s: string): Uint8Array<ArrayBuffer> {
  return maHoaChu.encode(s) as Uint8Array<ArrayBuffer>;
}

/** Byte → base64url không dấu "=" (an toàn trong cookie và URL). */
export function sangBase64Url(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** base64url → byte. Sai dạng → null. */
export function tuBase64Url(s: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]*$/.test(s) || s.length % 4 === 1) return null;
  try {
    const nhi = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
    const b = new Uint8Array(nhi.length);
    for (let i = 0; i < nhi.length; i++) b[i] = nhi.charCodeAt(i);
    return b;
  } catch { return null; }
}

function sangHex(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0');
  return s;
}

/** Bí mật đủ dài để dùng. Thiếu / ngắn → tính năng máy dùng chung TẮT. */
export function biMatHopLe(biMat: unknown): biMat is string {
  return typeof biMat === 'string' && biMat.trim().length >= BI_MAT_TOI_THIEU;
}

/** PIN 4–6 chữ số. */
export function pinHopLe(pin: unknown): pin is string {
  return typeof pin === 'string' && /^\d{4,6}$/.test(pin);
}

/** AAD của token người / token máy: "may_id|nhan_su_id". */
export function aadToken(mayId: string, nhanSuId: string): string {
  return `${mayId}|${nhanSuId}`;
}

// -----------------------------------------------------------------------------
// DẪN KHÓA
// -----------------------------------------------------------------------------
async function khoaGoc(biMat: string): Promise<CryptoKey> {
  if (!biMatHopLe(biMat)) throw new Error(`KHO_MAY_KHOA phải dài ít nhất ${BI_MAT_TOI_THIEU} ký tự`);
  return crypto.subtle.importKey('raw', chuSangByte(biMat), 'HKDF', false, ['deriveKey']);
}

function thamSoHkdf(mucDich: MucDich): HkdfParams {
  return {
    name: 'HKDF', hash: 'SHA-256',
    salt: chuSangByte(MUOI_HKDF),
    info: chuSangByte(`beeftown/kho/may-chung/${mucDich}`),
  };
}

/** Dẫn một khóa theo mục đích. token → AES-GCM 256; pin | moc | ten → HMAC-SHA256. */
export async function danKhoa(biMat: string, mucDich: MucDich): Promise<CryptoKey> {
  const goc = await khoaGoc(biMat);
  if (mucDich === 'token') {
    return crypto.subtle.deriveKey(thamSoHkdf(mucDich), goc,
      { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  return crypto.subtle.deriveKey(thamSoHkdf(mucDich), goc,
    { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, ['sign', 'verify']);
}

/** Cả bộ khóa. Bí mật thiếu / ngắn → ném lỗi (kiểm bằng biMatHopLe trước). */
export async function danKhoaMay(biMat: string): Promise<KhoaMay> {
  const [token, pin, moc, ten] = await Promise.all(
    (['token', 'pin', 'moc', 'ten'] as const).map(m => danKhoa(biMat, m)));
  return { token, pin, moc, ten };
}

async function hmac(khoa: CryptoKey, noiDung: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.sign('HMAC', khoa, chuSangByte(noiDung)));
}

// -----------------------------------------------------------------------------
// TOKEN — AES-GCM có AAD
// -----------------------------------------------------------------------------
/**
 * Mã hóa một token. Ra "v1.<base64url(iv 12 byte ‖ bản mã ‖ thẻ 16 byte)>".
 * Mỗi lần gọi một iv ngẫu nhiên mới, nên cùng token hai lần ra hai chuỗi khác.
 */
export async function maHoaToken(khoa: KhoaMay, banRo: string, aad: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ma = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: chuSangByte(aad), tagLength: 128 },
    khoa.token, chuSangByte(banRo)));
  const goi = new Uint8Array(iv.length + ma.length);
  goi.set(iv, 0);
  goi.set(ma, iv.length);
  return TIEN_TO_MA + sangBase64Url(goi);
}

/** Giải mã. Sai khóa, sai AAD, bị sửa, sai dạng → null (không bao giờ ném lỗi). */
export async function giaiMaToken(khoa: KhoaMay, chuoi: string | null | undefined, aad: string): Promise<string | null> {
  if (typeof chuoi !== 'string' || !chuoi.startsWith(TIEN_TO_MA)) return null;
  const goi = tuBase64Url(chuoi.slice(TIEN_TO_MA.length));
  if (!goi || goi.length < 12 + 16) return null;
  try {
    const ro = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: goi.slice(0, 12), additionalData: chuSangByte(aad), tagLength: 128 },
      khoa.token, goi.slice(12));
    return giaiMaChu.decode(ro);
  } catch { return null; }
}

// -----------------------------------------------------------------------------
// PIN — HMAC, gửi database thay cho PIN thô
// -----------------------------------------------------------------------------
/**
 * pin_bam = HMAC-SHA256(khóa pin, "may_id|nhan_su_id|pin"), 64 ký tự hex
 * thường — đúng dạng CHECK của kho_may_nguoi.pin_bam (0034). Cùng PIN ở máy
 * khác hay người khác ra giá trị khác. PIN sai dạng → ném lỗi (kiểm bằng
 * pinHopLe trước).
 */
export async function bamPin(khoa: KhoaMay, mayId: string, nhanSuId: string, pin: string): Promise<string> {
  if (!pinHopLe(pin)) throw new Error('PIN phải là 4 đến 6 chữ số');
  return sangHex(await hmac(khoa.pin, `${mayId}|${nhanSuId}|${pin}`));
}

/** Tên cookie cất token của một người trên một máy: bt_may_s_<8 hex>. */
export async function tenCookieNguoi(khoa: KhoaMay, mayId: string, nhanSuId: string): Promise<string> {
  return COOKIE_MAY_NGUOI_TIEN_TO + sangHex(await hmac(khoa.ten, `${mayId}|${nhanSuId}`)).slice(0, 8);
}

// -----------------------------------------------------------------------------
// MỐC HOẠT ĐỘNG — cookie bt_may_hd có chữ ký
// -----------------------------------------------------------------------------
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function noiDungMoc(m: MocHoatDong): string {
  return `${m.mayId}.${m.nhanSuId ?? '-'}.${m.luc}`;
}

/** Ký mốc: "v1.<may_id>.<nhan_su_id | ->.<luc>.<chữ ký base64url>". */
export async function kyMoc(khoa: KhoaMay, moc: MocHoatDong): Promise<string> {
  if (!UUID.test(moc.mayId) || (moc.nhanSuId !== null && !UUID.test(moc.nhanSuId))
      || !Number.isSafeInteger(moc.luc) || moc.luc < 0) {
    throw new Error('Mốc hoạt động sai dạng');
  }
  const nd = noiDungMoc(moc);
  return `${TIEN_TO_MA}${nd}.${sangBase64Url(await hmac(khoa.moc, nd))}`;
}

/** Kiểm chữ ký mốc. Sai chữ ký, sai dạng → null. */
export async function kiemMoc(khoa: KhoaMay, chuoi: string | null | undefined): Promise<MocHoatDong | null> {
  if (typeof chuoi !== 'string' || !chuoi.startsWith(TIEN_TO_MA) || chuoi.length > 300) return null;
  const phan = chuoi.slice(TIEN_TO_MA.length).split('.');
  if (phan.length !== 4) return null;
  const [mayId, ns, lucChu, ky] = phan;
  if (!UUID.test(mayId) || (ns !== '-' && !UUID.test(ns)) || !/^\d{1,16}$/.test(lucChu)) return null;
  const chuKy = tuBase64Url(ky);
  if (!chuKy) return null;
  const moc: MocHoatDong = { mayId, nhanSuId: ns === '-' ? null : ns, luc: Number(lucChu) };
  if (!Number.isSafeInteger(moc.luc)) return null;
  // verify so sánh thời gian hằng — không lộ chữ ký đúng qua thời gian trả lời.
  const dung = await crypto.subtle.verify('HMAC', khoa.moc, chuKy, chuSangByte(noiDungMoc(moc)));
  return dung ? moc : null;
}

// -----------------------------------------------------------------------------
// TỰ KHÓA — hàm thuần theo mốc hoạt động (moTrangKho + may-chung.js dùng chung luật)
// -----------------------------------------------------------------------------
function phutHopLe(phutKhoa: unknown): number {
  const n = Number(phutKhoa);
  return Number.isInteger(n) && n >= 1 && n <= 60 ? n : PHUT_KHOA_MAC_DINH;
}

/**
 * Đã quá giờ tự khóa chưa.
 *
 *   GET  : quá phut_khoa phút kể từ lúc hoạt động → khóa.
 *   POST : được ân hạn tới AN_HAN_POST × phut_khoa (người đang gõ dở một
 *          phiếu dài vẫn lưu được); quá nữa → "Máy đã khóa — phiếu chưa được ghi".
 *
 * Đúng bằng giờ khóa là ĐÃ khóa. Mốc hỏng (không phải số, ở tương lai quá
 * LECH_DONG_HO_MS) → coi như đã khóa: sai thì khóa, không bao giờ sai thì mở.
 * phut_khoa ngoài 1–60 → PHUT_KHOA_MAC_DINH.
 */
export function daQuaGioKhoa(lucHoatDong: number, bayGio: number, phutKhoa: number, laPost = false): boolean {
  if (!Number.isFinite(lucHoatDong) || !Number.isFinite(bayGio)) return true;
  const troiQua = bayGio - lucHoatDong;
  if (troiQua < -LECH_DONG_HO_MS) return true;
  const han = phutHopLe(phutKhoa) * 60_000 * (laPost ? AN_HAN_POST : 1);
  return troiQua >= han;
}

/** Còn bao nhiêu giây trước khi tự khóa (cho GET). 0 = đã khóa. */
export function giayConLai(lucHoatDong: number, bayGio: number, phutKhoa: number): number {
  if (daQuaGioKhoa(lucHoatDong, bayGio, phutKhoa)) return 0;
  return Math.max(0, Math.ceil((lucHoatDong + phutHopLe(phutKhoa) * 60_000 - bayGio) / 1000));
}
