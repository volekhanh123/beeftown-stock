/**
 * NGÀY GIỜ VIỆT NAM — MỘT CHỖ DUY NHẤT
 * ====================================
 *
 * Việt Nam không đổi giờ mùa hè: giờ VN luôn là UTC + 7 tiếng. Cái khó không phải phép
 * cộng mà là nó nằm rải rác — và chỉ lộ lỗi trong khung 0h–7h giờ VN, khi ngày UTC còn là
 * hôm qua (máy chủ Cloudflare và Supabase đều chạy UTC). Mã mới lấy ngày / năm / giờ VN ở
 * đây; crm/test/test-gio-vn.mjs kiểm mọi hàm "hôm nay" khớp hom_nay_vn() của database và
 * chặn mã tự cộng 7 tiếng hay lấy năm theo máy.
 *
 * Ngày giờ NGƯỜI NHẬP / MÁY NGOÀI GỬI (không kèm múi) phải qua docGioVnDiaPhuong / isoGioVn:
 * JS tự "lăn" 31/02 thành 03/03 mà không báo, còn Postgres thì từ chối — hóa đơn iPOS giờ
 * sai từng thành lỗi 500 và iPOS Hub gửi lại mãi đúng hóa đơn đó.
 */

const LECH_VN_MS = 7 * 60 * 60 * 1000;
const hai = (n: number) => String(n).padStart(2, '0');

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD. Cùng cách tính với hom_nay_vn() trong database. */
export function homNayVn(ms: number = Date.now()): string {
  return new Date(ms + LECH_VN_MS).toISOString().slice(0, 10);
}

/** Năm theo giờ Việt Nam — 00:30 ngày 01/01 giờ VN đã là năm mới dù UTC còn năm cũ. */
export function namVn(ms: number = Date.now()): number {
  return Number(homNayVn(ms).slice(0, 4));
}

/** Cộng số ngày vào một ngày YYYY-MM-DD. */
export function congNgay(iso: string, soNgay: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + soNgay);
  return d.toISOString().slice(0, 10);
}

/** Ngày có thật trên lịch: 31/02, 31/04, 29/02 năm thường → false. */
export function laNgayCoThat(nam: number, thang: number, ngay: number): boolean {
  if (![nam, thang, ngay].every(Number.isInteger)) return false;
  if (nam < 1900 || nam > 9999 || thang < 1 || thang > 12 || ngay < 1) return false;
  return ngay <= new Date(Date.UTC(nam, thang, 0)).getUTCDate();
}

/**
 * Giờ Việt Nam dạng số → ISO có múi +07:00 ("2026-09-28T18:30:00+07:00"), hoặc null nếu ngày
 * không có thật, giờ ngoài 0–23, phút / giây ngoài 0–59. `le` là phần lẻ của giây (".123").
 */
export function isoGioVn(
  nam: number, thang: number, ngay: number, gio: number, phut: number, giay = 0, le = '',
): string | null {
  if (!laNgayCoThat(nam, thang, ngay)) return null;
  if (![gio, phut, giay].every(Number.isInteger)) return null;
  if (gio < 0 || gio > 23 || phut < 0 || phut > 59 || giay < 0 || giay > 59) return null;
  return `${nam}-${hai(thang)}-${hai(ngay)}T${hai(gio)}:${hai(phut)}:${hai(giay)}${le}+07:00`;
}

/**
 * Ô datetime-local (giờ Việt Nam: "2026-09-25T08:30" hoặc "2026-09-25T08:30:15") → ISO có múi
 * +07:00. Sai dạng hoặc không có thật trên lịch → null.
 */
export function docGioVnDiaPhuong(v: unknown): string | null {
  const m = String(v ?? '').trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  return isoGioVn(+m[1], +m[2], +m[3], +m[4], +m[5], m[6] === undefined ? 0 : +m[6]);
}
