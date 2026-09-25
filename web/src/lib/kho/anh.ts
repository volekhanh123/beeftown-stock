/**
 * KHO — ẢNH CHỨNG TỪ
 *
 * Ảnh hóa đơn khi nhập hàng, ảnh hàng hỏng khi báo hủy, ảnh ủy nhiệm chi khi
 * thanh toán. Lưu ở kho file riêng `kho-chung-tu` (migration 0021):
 *
 *     <chi_nhanh_id>/<nhap|huy|thanh_toan>/<ma_gui>/<số thứ tự>.<đuôi>
 *
 * Đoạn đầu và đoạn hai là thứ policy storage kiểm: ai được tải vào đâu, ai
 * được xem gì. ma_gui là mã của lần gửi form, nên bấm gửi lại không đè ảnh cũ.
 *
 * Ảnh đi qua Worker rồi mới tới Supabase (form không dùng JavaScript). Ảnh
 * điện thoại 3–5 MB là bình thường; giới hạn 10 MB mỗi ảnh khớp giới hạn kho.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { laUuid } from './chung.ts';

export const KHO_ANH = 'kho-chung-tu';
const TOI_DA = 10 * 1024 * 1024;
const DUOI: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/heic': 'heic', 'image/heif': 'heif', 'application/pdf': 'pdf',
};

/** Lấy các file ảnh thật sự được chọn (trình duyệt gửi một File rỗng khi không chọn gì). */
export function layTepAnh(form: FormData, ten = 'anh'): File[] {
  return form.getAll(ten).filter((f): f is File => typeof f === 'object' && f !== null && 'size' in f && f.size > 0);
}

/**
 * Tải ảnh lên. Trả về đường dẫn các ảnh đã lên và câu lỗi cho ảnh không lên
 * được — một ảnh lỗi không làm hỏng cả chứng từ.
 */
export async function taiAnh(
  client: SupabaseClient,
  chiNhanhId: string,
  loai: 'nhap' | 'huy' | 'thanh_toan',
  maGui: string,
  tep: File[],
  batDau = 1,
): Promise<{ duongDan: string[]; loi: string[] }> {
  const duongDan: string[] = [];
  const loi: string[] = [];
  let so = batDau;
  for (const f of tep.slice(0, 8)) {
    const duoi = DUOI[f.type];
    if (!duoi) { loi.push(`"${f.name}" không phải ảnh JPG/PNG/WEBP/HEIC hay PDF`); continue; }
    if (f.size > TOI_DA) { loi.push(`"${f.name}" nặng quá 10 MB`); continue; }
    const duong = `${chiNhanhId}/${loai}/${maGui}/${so}.${duoi}`;
    so += 1;
    const { error } = await client.storage.from(KHO_ANH).upload(duong, f, { contentType: f.type, upsert: false });
    if (error) { loi.push(`"${f.name}" chưa tải lên được (${error.message})`); continue; }
    duongDan.push(duong);
  }
  if (tep.length > 8) loi.push('Mỗi lần gửi tối đa 8 ảnh — các ảnh sau bị bỏ qua.');
  return { duongDan, loi };
}

// -----------------------------------------------------------------------------
// ẢNH ĐÃ TẢI Ở LẦN GỬI TRƯỚC — giữ qua các lần gửi lại form
// -----------------------------------------------------------------------------
// Ô chọn file không điền lại được khi trang hiện lại (gõ sai, bấm "Đọc mã"),
// nên form tải ảnh ngay rồi giữ đường dẫn trong ô ẩn "anh_da_tai", cùng ma_gui
// cũ. Phiếu nhập và báo hủy dùng chung hai hàm dưới (hàm thuần — test được).

/** Tên file taiAnh đặt: "<số thứ tự>.<đuôi>". */
const TEN_TEP_ANH = /^(\d{1,4})\.(jpg|png|webp|heic|heif|pdf)$/;

/**
 * Đọc ô ẩn "anh_da_tai". Ô ẩn sửa được bằng tay, nên chỉ nhận đường dẫn đúng
 * chỗ của LẦN GỬI NÀY: `<chi nhánh>/<loại>/<ma_gui>/<số>.<đuôi>` — form không
 * gắn được ảnh của phiếu khác, loại khác hay chi nhánh khác. Bỏ trùng, tối đa
 * `toiDa` ảnh.
 */
export function docAnhDaTai(
  form: FormData, chiNhanhId: string, loai: 'nhap' | 'huy' | 'thanh_toan', maGui: string, toiDa: number,
): string[] {
  if (!laUuid(chiNhanhId) || !laUuid(maGui)) return [];
  const dau = `${chiNhanhId}/${loai}/${maGui}/`;
  const ra: string[] = [];
  for (const v of form.getAll('anh_da_tai')) {
    const d = typeof v === 'string' ? v.trim() : '';
    if (!d.startsWith(dau) || !TEN_TEP_ANH.test(d.slice(dau.length)) || ra.includes(d)) continue;
    ra.push(d);
    if (ra.length >= toiDa) break;
  }
  return ra;
}

/** Số thứ tự lớn nhất trong các ảnh đã tải ("…/3.jpg" → 3); không có → 0. Ảnh mới đánh số tiếp — kho file không cho ghi đè. */
export function soThuTuCuoi(duongDan: string[]): number {
  return duongDan.reduce((m, d) => Math.max(m, Number(TEN_TEP_ANH.exec(d.slice(d.lastIndexOf('/') + 1))?.[1] ?? 0)), 0);
}

/** Link xem ảnh có hạn 1 giờ. Ảnh người đang xem không đủ quyền: không có link. */
export async function linkAnh(client: SupabaseClient, duongDan: string[]): Promise<Map<string, string>> {
  const ra = new Map<string, string>();
  if (duongDan.length === 0) return ra;
  try {
    const { data } = await client.storage.from(KHO_ANH).createSignedUrls(duongDan, 3600);
    for (const r of data ?? []) {
      if (r.path && r.signedUrl) ra.set(r.path, r.signedUrl);
    }
  } catch { /* không có link thì trang hiện tên ảnh, không hiện ảnh */ }
  return ra;
}
