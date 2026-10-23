// Còn hàng ở quầy, đọc từ website (beeftown.vn/mini-app/con-hang.json, migration 0093 của repo).
// File này không dùng React hay Zalo để chạy kiểm tra được bằng node (npm run kiem-tra).
//
// Không bao giờ đoán "hết": website chưa có đường này, mất mạng, hết giờ, trả lỗi hay dữ liệu lạ đều ra {} —
// app hiện mọi phần như trước khi nối kho. Báo "tạm hết" khi không chắc là làm mất đơn của khay còn ở quầy.

export type TrangThaiKho = "con" | "sap_het" | "het";

const TRANG_THAI = new Set<string>(["con", "sap_het", "het"]);
const MA_PHAN_THIT = /^[a-z0-9-]{1,40}$/;

/** fetch tối thiểu mà docConHang cần — để kiểm tra truyền fetch giả. */
export type HamFetch = (
  url: string,
  init: { signal: AbortSignal; cache: "no-store" },
) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

/** Đọc trạng thái còn hàng. Hỏng bất kỳ cách nào cũng trả {} (không biết). */
export async function docConHang(
  url: string,
  hamFetch: HamFetch,
  msHetGio = 5000,
): Promise<Record<string, TrangThaiKho>> {
  if (!url) return {};
  const huy = new AbortController();
  const hen = setTimeout(() => huy.abort(), msHetGio);
  try {
    const tra = await Promise.race([
      hamFetch(url, { signal: huy.signal, cache: "no-store" }),
      new Promise<never>((_, tuChoi) => huy.signal.addEventListener("abort", () => tuChoi(new Error("hết giờ")))),
    ]);
    if (!tra.ok) return {};
    const duLieu = (await tra.json()) as { phanThit?: unknown };
    const phanThit = duLieu?.phanThit;
    if (!phanThit || typeof phanThit !== "object" || Array.isArray(phanThit)) return {};
    const ra: Record<string, TrangThaiKho> = {};
    for (const [ma, tt] of Object.entries(phanThit as Record<string, unknown>)) {
      if (MA_PHAN_THIT.test(ma) && typeof tt === "string" && TRANG_THAI.has(tt)) ra[ma] = tt as TrangThaiKho;
    }
    return ra;
  } catch {
    return {};
  } finally {
    clearTimeout(hen);
  }
}

/**
 * Trạng thái hiện cho khách: tạm ngưng trong cau-hinh (conHang: false) thắng kho; kho nói "het" thì tạm hết;
 * kho không biết (không có khóa) thì coi như còn — như trước khi nối kho.
 */
export function trangThaiPhan(conHangCauHinh: boolean, tuKho: TrangThaiKho | undefined): TrangThaiKho {
  if (!conHangCauHinh) return "het";
  return tuKho ?? "con";
}
