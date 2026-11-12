/**
 * ĐẶT HÀNG MUA THỊT VỀ — GỬI ĐƠN LÊN DATABASE (tao_don_mua_thit, migration 0113)
 * ===========================================================================
 *
 * Khánh 03/11/2026: khách đặt thẳng trên website, chỉ giao tận nơi. Form của trang /mua-thit-ve (en, ko: /buy-meat)
 * là form POST: các ô chọn số gói (tên ô = khoaGoi), giá khách đã thấy của từng gói (ô ẩn gia_<khoa>), mã chống gửi
 * hai lần (ô ẩn ma_gui, mỗi lần dựng form một mã), họ tên, số điện thoại, địa chỉ giao, ghi chú.
 * lib/xu-ly-form.ts đọc thân POST rồi gọi guiDonMuaThit; trang đọc kết quả qua cookie sau khi chuyển hướng.
 *
 * Database quyết định đơn: tự tính từ giá đã chốt, từ chối gói ngừng bán / tạm hết, từ chối khi giá khách đã thấy
 * khác giá hiện tại, cùng ma_gui thì trả lại đơn cũ. File này chỉ đọc form, chặn sớm những ô thiếu (câu ba thứ
 * tiếng, không tốn lượt giới hạn tần suất của database) và nói đúng kết quả:
 *   · CHƯA được ghi nhận — chặn ở đây, hoặc database từ chối (exception = cả giao dịch hủy);
 *   · KHÔNG CHẮC — gọi rồi mà không nghe trả lời (ném lỗi: xu-ly-form.ts nói "không chắc", trang không mời đặt lại);
 *   · Đã nhận — database trả mã đơn. Câu "đã nhận" khác "đã xác nhận": quán gọi khách rồi mới giao.
 *
 * Chỉ chạy ở máy chủ. Kiểm thử: crm/test/test-mua-thit-dat-hang-web.mjs.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { maChiNhanh, type NgonNgu } from './noi-dung.ts';
import { cauLoiDatabase, laLoiDatabase, dich, type BaThuTieng } from './chu.ts';
import { SO_GOI_TOI_DA } from './don-mua-thit.ts';

/** Câu trả lời sau khi đặt, ba thứ tiếng. "Đã nhận" — không bao giờ "thành công" hay "đã xác nhận". */
export const CAU_DAT_HANG = {
  thieuGio: {
    vi: 'Bạn chưa chọn gói nào.',
    en: 'You have not chosen any packs yet.',
    ko: '아직 고른 팩이 없어요.',
  },
  thieuHoTen: {
    vi: 'Vui lòng điền họ tên.',
    en: 'Please enter your full name.',
    ko: '이름을 입력해 주세요.',
  },
  thieuSdt: {
    vi: 'Vui lòng điền số điện thoại để quán gọi xác nhận đơn.',
    en: 'Please enter a phone number so we can call to confirm your order.',
    ko: '주문 확인 전화를 드릴 수 있도록 전화번호를 입력해 주세요.',
  },
  thieuDiaChi: {
    vi: 'Vui lòng điền địa chỉ giao: số nhà, tên đường và khu vực.',
    en: 'Please enter the delivery address: house number, street and area.',
    ko: '배달 주소를 입력해 주세요. 번지, 거리 이름, 지역까지 적어 주세요.',
  },
  chuaGhi: {
    vi: 'Chưa đặt được hàng. Đơn của bạn CHƯA được ghi nhận.',
    en: 'Your order could not be placed. It has NOT been recorded.',
    ko: '주문하지 못했어요. 주문은 아직 접수되지 않았어요.',
  },
  daNhan: {
    vi: 'Beeftown đã nhận đơn của bạn.',
    en: 'Beeftown has received your order.',
    ko: 'Beeftown에 주문이 접수되었어요.',
  },
  // 0115 · trả trước qua VNPay
  chuaMoTraTien: {
    vi: 'Chưa mở được trang trả tiền VNPay. Đơn đã ghi nhận nhưng CHƯA được trả tiền.',
    en: 'We could not open the VNPay payment page. Your order is recorded but has NOT been paid.',
    ko: 'VNPay 결제 페이지를 열지 못했어요. 주문은 접수되었지만 아직 결제되지 않았어요.',
  },
} as const satisfies Record<string, BaThuTieng>;

/** Kết quả mở một lần trả VNPay (mua_thit_mo_vnpay, 0115). */
export type MoTraTien =
  | { ok: true; maDon: string; soTien: number; daTra: true }
  | { ok: true; maDon: string; soTien: number; daTra: false; maGiaoDich: string }
  /** Database từ chối (đơn đã hủy, quá số lần…): câu khách đọc, đúng thứ tiếng. */
  | { ok: false; cau: string };

/**
 * Mở một lần trả VNPay cho đơn có ma_gui này — client anon, như tao_don_mua_thit. Database chốt số tiền (tạm tính
 * của đơn — giá gói đã gồm phí giao). Ném khi không nghe được trả lời (lần trả có thể đã mở: không sao, chỉ là một
 * dòng "chờ" — khách bấm lại thì mở lần mới).
 */
export async function moTraTienVnpay(
  client: Pick<SupabaseClient, 'rpc'>, maGui: string, ngonNgu: NgonNgu,
): Promise<MoTraTien> {
  const cau = dich(ngonNgu, CAU_DAT_HANG);
  const { data, error } = await client.rpc('mua_thit_mo_vnpay', { p_ma_gui: maGui });
  if (error) {
    if (!laLoiDatabase(error)) throw new Error(`mua_thit_mo_vnpay: không nghe được trả lời — ${error.message ?? ''}`);
    return { ok: false, cau: cauLoiDatabase(error.message ?? '', ngonNgu, cau.chuaMoTraTien) };
  }
  const d = data && typeof data === 'object' && !Array.isArray(data) ? data as Record<string, unknown> : {};
  const maDon = d.ma_don, soTien = Number(d.so_tien);
  if (typeof maDon !== 'string' || !/^[0-9A-Z]{6}$/.test(maDon) || !Number.isSafeInteger(soTien) || soTien <= 0) {
    throw new Error('mua_thit_mo_vnpay: trả lời không có mã đơn / số tiền');
  }
  if (d.da_tra === true) return { ok: true, maDon, soTien, daTra: true };
  const maGiaoDich = d.ma_giao_dich;
  if (typeof maGiaoDich !== 'string' || !/^[0-9A-Z]{6}[0-9]{2}$/.test(maGiaoDich)) {
    throw new Error('mua_thit_mo_vnpay: trả lời không có mã giao dịch');
  }
  return { ok: true, maDon, soTien, daTra: false, maGiaoDich };
}

export interface KetQuaDatHang {
  ok: boolean;
  ma?: string;
  cau: string;
  /** Không nghe được trả lời của database: đơn CÓ THỂ đã ghi. Trang không dựng lại form. */
  khongChac?: boolean;
  /** 0115 · website có VNPay mà chưa mở được trang trả tiền: đơn đã ghi, CHƯA trả. loiTra: vì sao. */
  choTra?: boolean;
  loiTra?: string;
  /** 0115 · đơn đã trả đủ qua VNPay. */
  daTra?: boolean;
}

/** Đơn đọc từ thân POST — chưa kiểm với menu (database làm việc đó). */
export interface DonGui {
  maGui: string | null;
  hoTen: string;
  sdt: string;
  diaChi: string;
  ghiChu: string | null;
  /** khoa → số gói (1–10), theo thứ tự ô trong form. */
  gio: Map<string, number>;
  /** khoa → giá khách đã thấy, chỉ cho gói có trong giỏ. */
  giaDaXem: Record<string, number>;
}

/** khoaGoi của don-mua-thit.ts: mã sản phẩm (0099: chữ thường không dấu, số, gạch nối) + "_" + số gam. */
const MAU_KHOA = /^[a-z0-9]+(?:-[a-z0-9]+)*_[0-9]{2,4}$/;
const MAU_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Một đơn có tối đa 60 dòng (ràng buộc don_mua_thit_dong của 0113). */
const SO_DONG_TOI_DA = 60;

const chu = (v: FormDataEntryValue | null): string => (typeof v === 'string' ? v : '');
/** Một dòng: gộp mọi khoảng trắng (xuống dòng, tab) thành một dấu cách — như database làm với họ tên, địa chỉ. */
const motDong = (v: string) => v.replace(/\s+/g, ' ').trim();

/**
 * Đọc đơn từ form. Không ném. Ô số gói chỉ nhận đúng "1"…"10" (giá trị của ô chọn) — "01", "1.000", "1,5" bị bỏ,
 * không bao giờ thành 1000 gói. Ô gói lặp lại: lấy lần đầu. Giá đã thấy: chuỗi chữ số của ô ẩn gia_<khoa>.
 */
export function docDonGui(form: FormData): DonGui {
  const gio = new Map<string, number>();
  for (const [ten, giaTri] of form) {
    if (!MAU_KHOA.test(ten) || gio.has(ten) || gio.size >= SO_DONG_TOI_DA) continue;
    if (typeof giaTri !== 'string' || !/^(?:[1-9]|10)$/.test(giaTri)) continue;
    const n = Number(giaTri);
    if (n >= 1 && n <= SO_GOI_TOI_DA) gio.set(ten, n);
  }
  const giaDaXem: Record<string, number> = {};
  for (const khoa of gio.keys()) {
    const v = chu(form.get(`gia_${khoa}`));
    if (/^[1-9][0-9]{0,11}$/.test(v)) giaDaXem[khoa] = Number(v);
  }
  const maGui = chu(form.get('ma_gui')).trim();
  const ghiChu = chu(form.get('ghi_chu')).replace(/\r/g, '').trim();
  return {
    maGui: MAU_UUID.test(maGui) ? maGui.toLowerCase() : null,
    hoTen: motDong(chu(form.get('ho_ten'))),
    sdt: chu(form.get('sdt')).trim(),
    diaChi: motDong(chu(form.get('dia_chi'))),
    ghiChu: ghiChu || null,
    gio,
    giaDaXem,
  };
}

/** Chặn sớm ô thiếu (câu ba thứ tiếng). Database vẫn kiểm lại mọi thứ. null = gửi được. */
export function kiemDonGui(d: DonGui, ngonNgu: NgonNgu): string | null {
  const cau = dich(ngonNgu, CAU_DAT_HANG);
  if (d.gio.size === 0) return cau.thieuGio;
  if (!d.hoTen) return cau.thieuHoTen;
  if (d.sdt.replace(/[^0-9]/g, '').length < 9) return cau.thieuSdt;
  if (d.diaChi.length < 8) return cau.thieuDiaChi;
  return null;
}

/**
 * Gửi đơn. "Đã nhận" nghĩa là DATABASE ĐÃ GHI, không hơn: đơn chờ quán gọi xác nhận tổng tiền, phí giao, giờ giao.
 * Ném khi không nghe được trả lời (mất mạng, hết giờ, cổng 502–504, thân rỗng) — đơn có thể đã ghi; xu-ly-form.ts
 * nói "không chắc".
 */
export async function guiDonMuaThit(
  client: Pick<SupabaseClient, 'rpc'>, d: DonGui, ip: string | null, ngonNgu: NgonNgu,
): Promise<KetQuaDatHang> {
  const cau = dich(ngonNgu, CAU_DAT_HANG);
  const loiSom = kiemDonGui(d, ngonNgu);
  if (loiSom) return { ok: false, cau: loiSom };

  const { data, error } = await client.rpc('tao_don_mua_thit', {
    p_ma_gui: d.maGui,
    p_chi_nhanh_ma: maChiNhanh(),
    p_ho_ten: d.hoTen,
    p_sdt: d.sdt,
    p_dia_chi: d.diaChi,
    p_ghi_chu: d.ghiChu,
    p_gio: Object.fromEntries(d.gio),
    p_gia_da_xem: d.giaDaXem,
    p_ngon_ngu: ngonNgu,
    p_ip: ip,
  });

  if (error) {
    // Không có mã SQLSTATE / PGRST: lời gọi có thể đã tới nơi rồi mới đứt — xem laLoiDatabase() (lib/chu.ts).
    if (!laLoiDatabase(error)) {
      throw new Error(`tao_don_mua_thit: không nghe được trả lời — ${error.message ?? ''}`);
    }
    // Câu của database là tiếng Việt: trang tiếng Việt dùng nguyên văn, trang khác nhận bản dịch.
    return { ok: false, cau: cauLoiDatabase(error.message ?? '', ngonNgu, cau.chuaGhi) };
  }

  // Ghi được thì LUÔN có mã. Không lỗi mà cũng không mã (thân rỗng, 204): database chưa xác nhận gì.
  const ma = data && typeof data === 'object' && !Array.isArray(data) ? (data as { ma_don?: unknown }).ma_don : null;
  if (typeof ma !== 'string' || !/^[0-9A-Z]{6}$/.test(ma)) throw new Error('tao_don_mua_thit: trả lời không có mã đơn');
  return { ok: true, ma, cau: cau.daNhan };
}
