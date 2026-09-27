/**
 * ZALO — MÃ HÓA TOKEN TRƯỚC KHI CẤT VÀO DATABASE
 * ==============================================
 *
 * Refresh token và access token của Zalo chỉ nằm trong database dưới dạng
 * BẢN MÃ "v1.<base64url(iv 12 byte ‖ bản mã ‖ thẻ 16 byte)>" — đúng dạng mà
 * CHECK của zalo_cau_hinh (0047) đòi, và đúng khuôn của
 * lib/kho/may-chung-ma-hoa.ts (dùng lại hai hàm base64url của nó).
 *
 * Khóa: AES-GCM 256 dẫn từ bí mật Worker `ZALO_KHOA` (≥ 32 ký tự, tạo bằng
 * `openssl rand -base64 32`) bằng HKDF-SHA256 với muối / info RIÊNG của Zalo —
 * không bao giờ trùng khóa nào của phần kho dù ai đó lỡ đặt cùng một bí mật.
 * AAD gắn MỤC ĐÍCH ("zalo|refresh" / "zalo|access"): bản mã của access token
 * bê sang ô refresh token là giải mã hỏng.
 *
 * Đổi ZALO_KHOA thì bản mã cũ giải mã hỏng → người gửi báo "dán lại refresh
 * token". Đó cũng là cách thu hồi khi nghi lộ.
 *
 * File THUẦN: chỉ Web Crypto — chạy được ở Worker lẫn Node (test).
 */

import { sangBase64Url, tuBase64Url } from './kho/may-chung-ma-hoa.ts';

/** ZALO_KHOA tối thiểu (ký tự). */
export const ZALO_KHOA_TOI_THIEU = 32;

const TIEN_TO = 'v1.';
const MUOI = 'beeftown/zalo/v1';
const INFO = 'beeftown/zalo/token';

/** Dạng bản mã database nhận (CHECK zalo_cau_hinh_*_la_ban_ma). */
export const MAU_BAN_MA = /^v1\.[A-Za-z0-9_-]+$/;
export const BAN_MA_DAI = { toiThieu: 41, toiDa: 8192 } as const;

export type LoaiToken = 'refresh' | 'access';

const chuSangByte = (s: string) => new TextEncoder().encode(s) as Uint8Array<ArrayBuffer>;

export function khoaZaloHopLe(biMat: unknown): biMat is string {
  return typeof biMat === 'string' && biMat.trim().length >= ZALO_KHOA_TOI_THIEU;
}

/** Chuỗi có đúng dạng bản mã database nhận không. */
export function banMaHopLe(s: unknown): s is string {
  return typeof s === 'string' && MAU_BAN_MA.test(s) && s.length >= BAN_MA_DAI.toiThieu && s.length <= BAN_MA_DAI.toiDa;
}

export function aadZalo(loai: LoaiToken): string {
  return `zalo|${loai}`;
}

/** Dẫn khóa AES-GCM từ ZALO_KHOA. Bí mật thiếu / ngắn → ném lỗi (kiểm bằng khoaZaloHopLe trước). */
export async function danKhoaZalo(biMat: string): Promise<CryptoKey> {
  if (!khoaZaloHopLe(biMat)) throw new Error(`ZALO_KHOA phải dài ít nhất ${ZALO_KHOA_TOI_THIEU} ký tự`);
  const goc = await crypto.subtle.importKey('raw', chuSangByte(biMat.trim()), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: chuSangByte(MUOI), info: chuSangByte(INFO) },
    goc, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

/** Mã hóa một token. Mỗi lần một iv ngẫu nhiên — cùng token hai lần ra hai chuỗi khác. */
export async function maHoaTokenZalo(khoa: CryptoKey, banRo: string, loai: LoaiToken): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ma = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: chuSangByte(aadZalo(loai)), tagLength: 128 },
    khoa, chuSangByte(banRo)));
  const goi = new Uint8Array(iv.length + ma.length);
  goi.set(iv, 0);
  goi.set(ma, iv.length);
  return TIEN_TO + sangBase64Url(goi);
}

/** Giải mã. Sai khóa, sai loại (AAD), bị sửa, sai dạng → null. Không bao giờ ném lỗi. */
export async function giaiMaTokenZalo(khoa: CryptoKey, chuoi: unknown, loai: LoaiToken): Promise<string | null> {
  if (typeof chuoi !== 'string' || !chuoi.startsWith(TIEN_TO)) return null;
  const goi = tuBase64Url(chuoi.slice(TIEN_TO.length));
  if (!goi || goi.length < 12 + 16) return null;
  try {
    const ro = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: goi.slice(0, 12), additionalData: chuSangByte(aadZalo(loai)), tagLength: 128 },
      khoa, goi.slice(12));
    return new TextDecoder('utf-8', { fatal: true }).decode(ro);
  } catch { return null; }
}
