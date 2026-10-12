/**
 * ĐỌC THÂN REQUEST CÓ GIỚI HẠN — một bộ đọc cho mọi chỗ nhận POST từ bên ngoài
 *
 * request.formData() / arrayBuffer() đọc HẾT thân vào bộ nhớ rồi mới trả về. Một Worker
 * có 128 MB; một lượt gửi 100 MB (cố ý, hay chỉ là file chọn nhầm) làm hỏng cả isolate,
 * kéo theo những người đang gửi cùng lúc. Kiểm "CV tối đa 5 MB" SAU khi đã đọc hết thì
 * chậm một bước. Nên mọi chỗ nhận thân từ bên ngoài đọc qua đây:
 *
 *   · content-length khai lớn hơn ngưỡng → từ chối trước khi đọc byte nào;
 *   · không khai (gửi dạng dòng chảy) → đọc từng mẩu, vượt ngưỡng thì hủy dòng chảy ngay.
 *
 * Dùng ở: form hỏi bàn và form nộp hồ sơ (lib/xu-ly-form.ts), webhook iPOS
 * (lib/kho/ipos-hook.ts), webhook Messenger (lib/messenger-hook.ts — giữ nguyên từng byte
 * vì chữ ký tính trên thân thô). Kiểm thử: crm/test/test-cong-khai-gui-lai.mjs nhóm 4, 5, 7.
 */

/**
 * Đọc thân tối đa `toiDa` byte. Quá ngưỡng → null. Dòng chảy hỏng giữa chừng (mạng đứt)
 * → ném: người gọi tự quyết câu trả lời (webhook trả 400, form nói "chưa ghi nhận").
 */
export async function docThanGioiHan(req: Request, toiDa: number): Promise<Uint8Array<ArrayBuffer> | null> {
  const dai = Number(req.headers.get('content-length') ?? '');
  if (Number.isFinite(dai) && dai > toiDa) return null;
  if (!req.body) return new Uint8Array(0);
  const r = req.body.getReader();
  const phan: Uint8Array[] = [];
  let tong = 0;
  for (;;) {
    const { done, value } = await r.read();
    if (done) break;
    tong += value.byteLength;
    if (tong > toiDa) { try { await r.cancel(); } catch { /* bỏ qua */ } return null; }
    phan.push(value);
  }
  const gop = new Uint8Array(tong);
  let i = 0;
  for (const p of phan) { gop.set(p, i); i += p.byteLength; }
  return gop;
}

export type KetQuaDocForm =
  | { form: FormData; loi?: undefined }
  /** qua_lon: thân vượt ngưỡng. khong_doc_duoc: mạng đứt giữa chừng, thân cụt, không phải form. */
  | { form?: undefined; loi: 'qua_lon' | 'khong_doc_duoc' };

/**
 * Đọc form (multipart hoặc urlencoded) tối đa `toiDa` byte. Không bao giờ ném: chưa đọc
 * được form thì database chưa được gọi — người gọi nói "CHƯA được ghi nhận", không phải
 * "không chắc".
 */
export async function docFormGioiHan(req: Request, toiDa: number): Promise<KetQuaDocForm> {
  let than: Uint8Array<ArrayBuffer> | null;
  try { than = await docThanGioiHan(req, toiDa); } catch { return { loi: 'khong_doc_duoc' }; }
  if (than === null) return { loi: 'qua_lon' };
  try {
    const form = await new Response(than, {
      headers: { 'content-type': req.headers.get('content-type') ?? '' },
    }).formData();
    return { form };
  } catch {
    return { loi: 'khong_doc_duoc' };
  }
}
