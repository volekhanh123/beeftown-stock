/**
 * ĐỒNG HỒ GIẢ cho kiểm thử ngày giờ
 * =================================
 *
 *     import { datGio, traGio } from './dong-ho-gia.mjs';
 *     datGio('2026-12-31T17:00:00Z');   // 00:00 ngày 01/01/2027 giờ Việt Nam
 *     … gọi mã web …                     // Date.now() và new Date() đều trả thời điểm trên
 *     traGio();
 *
 * Mã web gọi `Date` toàn cục lúc chạy, nên thay `globalThis.Date` là đủ — không phải
 * sửa mã để nhận đồng hồ. `new Date(x)` có tham số vẫn chạy như thật.
 */

const DATE_THAT = globalThis.Date;

export function datGio(thoiDiem) {
  const ms = typeof thoiDiem === 'number' ? thoiDiem : DATE_THAT.parse(thoiDiem);
  if (!Number.isFinite(ms)) throw new Error(`datGio: thời điểm không hợp lệ ${thoiDiem}`);
  class DateGia extends DATE_THAT {
    constructor(...thamSo) { if (thamSo.length === 0) super(ms); else super(...thamSo); }
    static now() { return ms; }
  }
  globalThis.Date = DateGia;
}

export function traGio() { globalThis.Date = DATE_THAT; }
