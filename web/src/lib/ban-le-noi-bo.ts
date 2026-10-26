/**
 * MENU BÁN LẺ — đọc, thêm, lưu, xác nhận giá, đối chiếu FABi (màn /noi-bo/ban-le)
 *
 * Thịt bò mang về và kim chi (0097). Quầy cân thịt theo gram ở giá mỗi kg của mặt hàng kho
 * (kho_mat_hang.gia_ban_kg — Beeftown Cân tự gửi xuống cân); online bán gói cố định 200 g / 400 g; kim
 * chi bán theo hộp, giá cố định. Mini App Zalo và website sẽ đọc menu này ở bước sau (PR riêng) — màn
 * này và mọi câu của nó không bao giờ nói hai nơi đó đã đọc.
 *
 * QUYỀN DO DATABASE QUYẾT ĐỊNH, KHÔNG PHẢI FILE NÀY
 *
 *   · Đọc: policy ban_le_san_pham_doc / ban_le_goi_doc và ban_le_danh_sach — bốn vai CRM (VAI_XEM_BAN_LE).
 *     Thu ngân, marketing thấy tên, mã cân, giá mỗi kg của mặt hàng gắn với sản phẩm (giá cân là giá công
 *     khai ở quầy), không bao giờ thấy tồn hay giá vốn.
 *   · Thêm, lưu: ban_le_tao_san_pham / ban_le_luu_san_pham — chủ và quản lý (VAI_SUA_BAN_LE), kể cả mô tả.
 *     Marketing có quyền ghi thẳng các ô dịch en / ko, nhưng chỉ để máy dịch (ghi_ban_dich) chạy dưới
 *     phiên của họ — màn này không mở form cho marketing.
 *   · Xác nhận giá (bỏ chữ "Giá thử"): ban_le_chot_gia — chỉ chủ (VAI_CHOT_GIA).
 *   · Đối chiếu FABi: ban_le_doi_chieu — quyền danh mục kho của chi nhánh đó (chủ; quản lý chi nhánh mình).
 *
 * Giao diện chỉ ẩn nút cho gọn mắt — ai gọi thẳng vẫn bị database chặn (42501, câu tiếng Việt có bản
 * tiếng Anh ở cau-noi-bo.ts).
 *
 * KHÔNG BAO GIỜ "ĐÃ LƯU" KHI HÀM LƯU CHƯA TRẢ ok. Mất mạng, hết giờ, database lỗi → câu "chưa chắc đã ghi"
 * (CAU_MAT_MANG_GHI) hoặc đúng câu lỗi. Gửi lần hai (bấm đúp, F5): hàm lưu trả nguoi_khac_sua vì phiên bản
 * đã đổi — đọc lại, database đang giữ đúng bản vừa gửi thì đó là "Đã lưu.", không phải "người khác sửa".
 *
 * Kiểm thử: crm/test/test-ban-le-web.mjs (thư viện trên database thật), test-noi-bo-ban-le.mjs (hợp đồng
 * với database, trang). Database: crm/supabase/migrations/0097_ban_le_menu.sql, test-ban-le.mjs.
 */

import type { AstroCookies } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SoBanDich } from './ban-dich';
import { dichNB, type HaiThuTieng, type NgonNguNB } from './ngon-ngu-noi-bo.ts';
import { dichCau } from './cau-noi-bo.ts';
import { CAU_MAT_MANG_GHI, laLoiMang } from './qua-tai.ts';
import { boDau, dinhDangKg, dinhDangTien, docSoNguyen, docTien, laUuid } from './kho/chung.ts';
import { GIA_TOI_DA } from './kho/can-tma.ts';
import { timChuoiCam } from './chuoi-cam.js';

/** Vai xem menu — đúng bộ bốn của policy ban_le_san_pham_doc (test-noi-bo-ban-le.mjs so với pg_policy). */
export const VAI_XEM_BAN_LE = ['chu_so_huu', 'quan_ly', 'thu_ngan', 'marketing'] as const;
/** Vai thêm / sửa sản phẩm — đúng mảng vai trong thân ban_le_luu_san_pham (so với prosrc). */
export const VAI_SUA_BAN_LE = ['chu_so_huu', 'quan_ly'] as const;
/** Vai bỏ chữ "Giá thử" — ban_le_chot_gia chỉ nhận la_chu_so_huu(). */
export const VAI_CHOT_GIA = ['chu_so_huu'] as const;
/** Hai cỡ gói online mặc định của một phần thịt (ban_le_tao_san_pham tạo sẵn). */
export const GOI_MAC_DINH = [200, 400] as const;
/** Một sản phẩm có tối đa chừng này gói — cùng giới hạn với ban_le_luu_san_pham. */
export const SO_GOI_TOI_DA = 20;
/** Giá mỗi kg cân TMA nhận được — dùng lại hằng của kho/can-tma.ts, không chép số. */
export { GIA_TOI_DA };

const CAU = {
  daLuu:        { vi: 'Đã lưu.', en: 'Saved.' },
  khongQuyen:   { vi: 'Tài khoản của bạn không có quyền làm việc này.', en: 'Your account is not allowed to do this.' },
  khongThay:    { vi: 'Không thấy sản phẩm này — tải lại trang.', en: 'Product not found — reload the page.' },
  khongLuu:     { vi: 'Không lưu được.', en: 'Could not save.' },
  khongTao:     { vi: 'Không thêm được sản phẩm.', en: 'Could not add the product.' },
  khongChot:    { vi: 'Không xác nhận được giá.', en: 'Could not confirm the prices.' },
  khongDoc:     { vi: 'Không đọc được menu bán lẻ.', en: 'Could not read the retail menu.' },
  nguoiKhacSua: { vi: 'Sản phẩm vừa được người khác sửa. Bạn đang thấy bản mình vừa gõ, CHƯA được lưu — bấm Lưu lần nữa sẽ ghi đè bản của họ.',
                  en: 'Someone else just edited this product. You are seeing what you typed, NOT saved yet — saving again will overwrite their version.' },
  giaKhoVuaDoi: { vi: (gia: string) => `Giá ở Kho vừa đổi thành ${gia}/kg — xem lại rồi lưu. Chưa có gì được lưu.`,
                  en: (gia: string) => `The price in Stock just changed to ${gia}/kg — check it, then save again. Nothing was saved.` },
  chuaTen:      { vi: 'Chưa điền tên sản phẩm.', en: 'The product name is empty.' },
  maSai:        { vi: 'Mã sản phẩm chỉ gồm chữ thường không dấu, số và dấu gạch ngang — sửa mã hoặc đổi tên.',
                  en: 'A product code may only contain lowercase letters without accents, digits and hyphens — edit the code or the name.' },
  kieuSai:      { vi: 'Chọn thịt bò hay kim chi.', en: 'Choose beef or kimchi.' },
  maGuiSai:     { vi: 'Thiếu mã chống gửi hai lần — tải lại trang.', en: 'The double-submit guard code is missing — reload the page.' },
  coKhongSai:   { vi: 'Ô kênh bán phải là Có hoặc Không — tải lại trang.', en: 'A sales channel must be Yes or No — reload the page.' },
  matHangSai:   { vi: 'Mặt hàng kho không hợp lệ — tải lại trang.', en: 'The stock item is not valid — reload the page.' },
  giaKgTrong:   { vi: 'Chưa điền giá mỗi kg. Muốn bỏ giá thì sửa ở Kho → Mặt hàng.',
                  en: 'The price per kg is empty. To remove the price, edit it in Stock → Items.' },
  giaKgSai:     { vi: 'Giá mỗi kg không đọc được — gõ số đồng, ví dụ 950.000.',
                  en: 'The price per kg could not be read — type a whole number of dong, e.g. 950,000.' },
  oTrong:       { vi: (g: string) => `Ô trọng lượng gói ${g} g đang trống — điền lại, hoặc chọn "Bỏ gói này".`,
                  en: (g: string) => `The weight of the ${g} g pack is empty — fill it in again, or choose "Remove this pack".` },
  goiMoiTrong:  { vi: 'Gói mới chưa có trọng lượng — điền số gam, hoặc để trống cả dòng.',
                  en: 'The new pack has no weight — enter the grams, or leave the whole row empty.' },
  trongLuongSai:{ vi: 'Trọng lượng gói phải là số gam từ 50 đến 5.000.', en: 'A pack weight must be a whole number of grams from 50 to 5,000.' },
  giaGoiSai:    { vi: (g: number) => `Giá gói ${g} g không đọc được — gõ số đồng, ví dụ 190.000.`,
                  en: (g: number) => `The price of the ${g} g pack could not be read — type a whole number of dong, e.g. 190,000.` },
  giaGoiKhoang: { vi: (g: number) => `Giá gói ${g} g phải từ 1.000 đ đến 100.000.000 đ.`,
                  en: (g: number) => `The price of the ${g} g pack must be between 1,000 and 100,000,000 ₫.` },
  giaTronNghin: { vi: (g: number) => `Giá gói ${g} g phải tròn nghìn đồng (ví dụ 190.000).`,
                  en: (g: number) => `The price of the ${g} g pack must be a whole thousand dong (e.g. 190,000).` },
  quaNhieuGoi:  { vi: 'Một sản phẩm có tối đa 20 gói.', en: 'A product can have at most 20 packs.' },
  dichDai:      { vi: (o: string, n: number) => `${o} dài quá ${n} ký tự.`, en: (o: string, n: number) => `${o} is longer than ${n} characters.` },
  giaDaXemSai:  { vi: 'Không đọc được giá trên trang — tải lại trang rồi xác nhận lại.',
                  en: 'Could not read the prices on the page — reload, then confirm again.' },
  daChot:       { vi: 'Đã xác nhận giá — bỏ chữ Giá thử.', en: 'Prices confirmed — the Trial price label is gone.' },
  daChotRoi:    { vi: 'Giá này đã được xác nhận rồi.', en: 'These prices were already confirmed.' },
  giaVuaDoi:    { vi: 'Giá vừa đổi (Kho → Mặt hàng hoặc người khác sửa) — xem lại giá dưới đây rồi xác nhận.',
                  en: 'The prices just changed (Stock → Items, or someone else edited) — check the prices below, then confirm.' },
  chotNguoiKhac:{ vi: 'Sản phẩm vừa được người khác sửa — xem lại giá dưới đây rồi xác nhận.',
                  en: 'Someone else just edited this product — check the prices below, then confirm.' },
  beeftownCan:  { vi: 'Beeftown Cân gửi giá mới xuống cân trong khoảng 1 phút nếu đang bật Tự gửi.',
                  en: 'Beeftown Scale sends the new price to the scale within about a minute if Auto-send is on.' },
  quaCan:       { vi: (gia: string, ma: string) => `Cân quầy chỉ nhận tối đa ${gia}/kg: cân VẪN IN GIÁ CŨ cho mã ${ma}.`,
                  en: (gia: string, ma: string) => `The counter scale accepts at most ${gia}/kg: it STILL PRINTS THE OLD PRICE for code ${ma}.` },
  fabiSuaTay:   { vi: 'FABi phải sửa tay — xem Đối chiếu FABi.', en: 'FABi must be updated by hand — see FABi check.' },
  daBoGoiMa:    { vi: (g: number, ma: string) => `Đã bỏ gói ${g} g (mã FABi ${ma}) — nhớ tắt món này trên FABi.`,
                  en: (g: number, ma: string) => `Removed the ${g} g pack (FABi code ${ma}) — remember to turn this item off in FABi.` },
  daBoGoi:      { vi: (g: number) => `Đã bỏ gói ${g} g.`, en: (g: number) => `Removed the ${g} g pack.` },
  chuCam:       { vi: (tim: string, lyDo: string) => `Câu này dính chữ cấm: «${tim}» (${lyDo}) — sửa trước khi bán online.`,
                  en: (tim: string, lyDo: string) => `This text has a forbidden phrase: «${tim}» (${lyDo}) — fix it before selling online.` },
} satisfies Record<string, HaiThuTieng<unknown>>;

// -----------------------------------------------------------------------------
// KIỂU — đúng hình JSON ban_le_danh_sach trả về (test-noi-bo-ban-le.mjs so khóa với database)
// -----------------------------------------------------------------------------
export type LoaiBanLe = 'thit' | 'kim_chi';
export type CachBan = 'theo_can' | 'theo_hop';
export type BaoQuan = 'mat' | 'dong_lanh' | 'giu_lanh';
export type NguonGoi = 'cat_tai_quay' | 'dong_san';
export type TrangThaiBanLe = 'dang_ban' | 'tam_ngung';

/** Mặt hàng kho gắn với sản phẩm / gói — không giá vốn, không tồn. */
export interface MatHangBanLe {
  id: string;
  ma: string;
  ten: string;
  loai: string;
  gia_ban_kg: number | null;
  ma_can: string | null;
  dem_goi: boolean;
  don_vi_goi: string | null;
  dang_dung: boolean;
}

/** Ảnh chụp giá: {"kg": giá mỗi kg | null, "goi": {"<số gam>": giá}} — khóa là chữ. */
export interface AnhChupGia {
  kg: number | null;
  goi: Record<string, number>;
}

export interface GoiBanLe {
  id: string;
  so_gam: number;
  gia_rieng: number | null;
  gia_tu_tinh: number | null;
  /** Giá đang bán: giá riêng, không thì tự tính. 0 không bao giờ là giá (null). */
  gia: number | null;
  /** Giá khác ảnh chụp chủ đã xác nhận (không bao giờ null). */
  gia_thu: boolean;
  ma_fabi: string | null;
  ma_vach: string | null;
  dang_ban: boolean;
  thu_tu: number;
  mat_hang: MatHangBanLe | null;
  mat_hang_mat: boolean;
  mat_hang_ngung: boolean;
  /** Chỉ khi số tồn ở quầy tin được và người xem có quyền xem kho chi nhánh đó. */
  con_hang: 'con' | 'het' | null;
}

export interface TonQuay {
  so_kg: number;
  so_goi: number;
  /** Chi nhánh trừ kho theo iPOS — ở chế độ kiểm kê, quầy chưa trừ hàng đã bán. */
  tin_duoc: boolean;
}

export interface SanPhamBanLe {
  id: string;
  ma: string;
  loai: LoaiBanLe;
  cach_ban: CachBan;
  ten_vi: string;
  ten_en: string | null;
  ten_ko: string | null;
  mo_ta_vi: string | null;
  mo_ta_en: string | null;
  mo_ta_ko: string | null;
  cach_dung_vi: string | null;
  cach_dung_en: string | null;
  cach_dung_ko: string | null;
  bao_quan: BaoQuan;
  mat_hang_id: string | null;
  nguon_goi: NguonGoi;
  trang_thai: TrangThaiBanLe;
  kenh_mini_app: boolean;
  kenh_web: boolean;
  thu_tu: number;
  gia_chot: AnhChupGia | null;
  gia_chot_luc: string | null;
  gia_chot_boi: string | null;
  created_at: string;
  updated_at: string;
  /** Sổ bản dịch (0036) — chỉ có khi đọc một sản phẩm (docSanPham). */
  ban_dich?: SoBanDich;
  mat_hang: MatHangBanLe | null;
  mat_hang_mat: boolean;
  mat_hang_ngung: boolean;
  gia_chot_boi_ten: string | null;
  /** Đúng ảnh chụp ban_le_chot_gia sẽ ghi — trang gửi lại nguyên văn khi chủ xác nhận. */
  gia_de_chot: AnhChupGia;
  gia_thu: boolean;
  goi: GoiBanLe[];
  canh_bao: string[];
  ton: TonQuay | null;
}

export interface GhepFabi {
  kieu: string | null;
  mat_hang_ten: string | null;
  don_vi_ban: string | null;
  kg_moi_don_vi: number | null;
}

export interface DongDoiChieu {
  loai_dong: 'can' | 'o_ma' | 'ma_giam' | 'goi' | 'kiem_tra';
  ma_fabi: string | null;
  ma_can: string | null;
  so_o: number | null;
  phan_tram: number | null;
  ten_san_pham: string | null;
  san_pham_id: string | null;
  so_gam: number | null;
  gia_phai_dat: number | null;
  tren_fabi: { co: boolean; ma: string | null; ten: string | null; dang_ban: boolean | null } | null;
  ghep: GhepFabi | null;
  mong_doi: GhepFabi | null;
  viec: string[];
}

export interface DoiChieuFabi {
  menu_luc: string | null;
  menu_can_lam_moi: boolean;
  bat: boolean;
  so_mon_menu: number;
  /** Thực đơn FABi chưa đọc được / đọc đã cũ / đồng bộ tắt — không bao giờ nói "chưa có trên FABi". */
  menu_cu: boolean;
  dong: DongDoiChieu[];
}

export interface ChiNhanhBanLe { id: string; ma: string; ten: string }

export interface KetQua { ok: boolean; cau: string }

/** Kết quả lưu. maLoi: hai trường hợp hàm lưu trả ok:false mà không lỗi — để kiểm thử biết đi nhánh nào. */
export interface KetQuaLuu extends KetQua { maLoi?: 'nguoi_khac_sua' | 'gia_kho_vua_doi' }

/** Kết quả ban_le_luu_san_pham khi ok. */
export interface KetQuaHamLuu {
  ok: true;
  updated_at: string;
  gia_kho_doi: boolean;
  da_bo: { so_gam: number; ma_fabi: string | null }[];
  canh_bao: string[];
  mat_hang: MatHangBanLe | null;
}

/** Dữ liệu gửi ban_le_luu_san_pham: ô nào vắng = giữ nguyên. */
export type DuLieuLuu = Record<string, unknown> & { goi?: Record<string, unknown>[] };

// -----------------------------------------------------------------------------
// NHÃN HAI THỨ TIẾNG
// -----------------------------------------------------------------------------
export const TEN_LOAI_BAN_LE: Record<LoaiBanLe, HaiThuTieng> = {
  thit:    { vi: 'Thịt bò', en: 'Beef' },
  kim_chi: { vi: 'Kim chi', en: 'Kimchi' },
};

export const TEN_BAO_QUAN: Record<BaoQuan, HaiThuTieng> = {
  mat:       { vi: 'Mát', en: 'Chilled' },
  giu_lanh:  { vi: 'Giữ lạnh', en: 'Keep cold' },
  dong_lanh: { vi: 'Đông lạnh', en: 'Frozen' },
};

export const TRANG_THAI_BAN_LE: Record<TrangThaiBanLe, { ten: HaiThuTieng; lop: string }> = {
  dang_ban:  { ten: { vi: 'Đang bán', en: 'On sale' }, lop: 'song' },
  tam_ngung: { ten: { vi: 'Tạm ngưng', en: 'Paused' }, lop: 'tat' },
};

export const NGUON_GOI: Record<NguonGoi, { ten: HaiThuTieng; giai: HaiThuTieng }> = {
  cat_tai_quay: {
    ten: { vi: 'Cắt tại quầy khi có đơn', en: 'Cut at the counter per order' },
    giai: { vi: 'Cắt từ hàng ở quầy khi có đơn — mỗi gói trừ đúng trọng lượng gói.',
            en: 'Cut from the counter stock when an order comes in — each pack deducts exactly its weight.' },
  },
  dong_san: {
    ten: { vi: 'Đóng gói sẵn', en: 'Pre-packed' },
    giai: { vi: 'Đóng gói sẵn — mỗi cỡ gói là một mặt hàng kho, đếm theo gói.',
            en: 'Pre-packed — each pack size is its own stock item, counted by pack.' },
  },
};

/**
 * Kiểu sản phẩm = loại + cách bán, một ô chọn duy nhất (giá trị "loai|cach_ban"): hai ô riêng cho ra những
 * cặp chủ không cần phải hiểu. Database vẫn nhận mọi cặp hợp lệ — sản phẩm lỡ mang cặp khác vẫn hiện được.
 */
export const KIEU_SAN_PHAM = [
  { ma: 'thit|theo_can', ten: { vi: `Thịt bò — quầy cân theo gram, online gói ${GOI_MAC_DINH.join(' g / ')} g`,
                                 en: `Beef — weighed by the gram at the counter, online packs of ${GOI_MAC_DINH.join(' g / ')} g` } },
  { ma: 'kim_chi|theo_hop', ten: { vi: 'Kim chi — giá cố định mỗi hộp', en: 'Kimchi — fixed price per box' } },
] as const;

/** Nhãn của một cặp loại / cách bán bất kỳ (cặp ngoài KIEU_SAN_PHAM ghép từ hai nhãn). */
export function tenKieu(loai: string, cachBan: string, nn: NgonNguNB = 'vi'): string {
  const co = KIEU_SAN_PHAM.find(k => k.ma === `${loai}|${cachBan}`);
  if (co) return co.ten[nn];
  const cach: Record<string, HaiThuTieng> = { theo_can: { vi: 'theo cân', en: 'by weight' }, theo_hop: { vi: 'theo hộp', en: 'by box' } };
  return `${TEN_LOAI_BAN_LE[loai as LoaiBanLe]?.[nn] ?? loai} — ${cach[cachBan]?.[nn] ?? cachBan}`;
}

/**
 * Các ô có bản dịch, theo thứ tự trên màn hình — khớp ba dòng ban_le_san_pham của cot_ban_dich() (0097).
 * toiDa: giới hạn độ dài bản en / ko người GÕ TAY (database không giới hạn cột en / ko — máy dịch ghi từng ô
 * trong một vòng lặp, một bản quá dài sẽ kẹt mãi; nên giới hạn nằm ở form này).
 */
export const O_DICH_BAN_LE = [
  { cot: 'ten',       nguon: 'ten_vi',       ten: { vi: 'Tên', en: 'Name' },             dong: 1, toiDa: 120 },
  { cot: 'mo_ta',     nguon: 'mo_ta_vi',     ten: { vi: 'Mô tả', en: 'Description' },    dong: 3, toiDa: 500 },
  { cot: 'cach_dung', nguon: 'cach_dung_vi', ten: { vi: 'Cách dùng', en: 'How to use' }, dong: 3, toiDa: 500 },
] as const;
const COT_DICH = O_DICH_BAN_LE.flatMap(o => [`${o.cot}_en`, `${o.cot}_ko`]);
const COT_CHU_VI = ['ten_vi', 'mo_ta_vi', 'cach_dung_vi'] as const;

/** Cảnh báo của sản phẩm (canh_bao của ban_le_danh_sach / ban_le_luu_san_pham). nang = hiện đỏ. */
export const CANH_BAO_BAN_LE: Record<string, { cau: HaiThuTieng; nang: boolean }> = {
  gia_qua_can: { nang: true, cau: {
    vi: `Cân quầy chỉ nhận tối đa ${dinhDangTien(GIA_TOI_DA, 'vi')}/kg — cân vẫn in giá cũ.`,
    en: `The counter scale accepts at most ${dinhDangTien(GIA_TOI_DA, 'en')}/kg — it still prints the old price.` } },
  thieu_gia: { nang: false, cau: {
    vi: 'Đang bán mà chưa gói nào có giá.', en: 'On sale, but no pack has a price yet.' } },
  khay_nguyen: { nang: true, cau: {
    vi: 'Mặt hàng kho đếm theo khay: FABi sẽ trừ nguyên một khay cho mỗi gói online. Chọn "Đóng gói sẵn" hoặc đổi mặt hàng sang cân theo kg.',
    en: 'The stock item is counted by tray: FABi would deduct a whole tray for every online pack. Choose "Pre-packed" or change the item to weigh by kg.' } },
  chua_gan_kho: { nang: false, cau: {
    vi: 'Chưa gắn mặt hàng kho — chưa có giá cân, mã cân, tồn ở quầy.',
    en: 'No stock item linked yet — no scale price, scale code or counter stock.' } },
  mat_hang_mat: { nang: true, cau: {
    vi: 'Mặt hàng kho đã gắn không còn trong kho — gắn lại mặt hàng khác.',
    en: 'The linked stock item no longer exists — link another item.' } },
  mat_hang_ngung: { nang: true, cau: {
    vi: 'Mặt hàng kho đã ngừng dùng — cân quầy đã gỡ mã này; bán online không trừ kho đúng.',
    en: 'The stock item is no longer in use — the counter scale has dropped this code; online sales would not deduct stock correctly.' } },
  goi_khong_dem_goi: { nang: false, cau: {
    vi: 'Mặt hàng kho của gói / hộp chưa đếm theo gói — đổi ở Kho → Mặt hàng.',
    en: 'The stock item of a pack / box is not counted by pack — change it in Stock → Items.' } },
  hop_chua_co_kho: { nang: false, cau: {
    vi: 'Hộp đang bán chưa gắn mặt hàng kho — bán ra kho không trừ.',
    en: 'A box on sale has no stock item — sales would not deduct stock.' } },
  goi_chua_co_kho: { nang: false, cau: {
    vi: 'Gói đóng sẵn đang bán chưa gắn mặt hàng kho — bán ra kho không trừ.',
    en: 'A pre-packed pack on sale has no stock item — sales would not deduct stock.' } },
};

/** Câu của một mã cảnh báo; mã lạ (database mới hơn web) thì hiện nguyên mã. */
export function cauCanhBao(ma: string, nn: NgonNguNB = 'vi'): string {
  return CANH_BAO_BAN_LE[ma]?.cau[nn] ?? ma;
}

// -----------------------------------------------------------------------------
// HÀM THUẦN
// -----------------------------------------------------------------------------
/**
 * Giá gói từ giá mỗi kg, tròn tới 1.000 đ; 0 → null (0 đ không bao giờ là giá). Bản sinh đôi của
 * ban_le_gia_goi (0097) — sửa thì sửa cả hai; test-ban-le-web.mjs so hai bản trên một bảng ca.
 */
export function giaGoi(giaKg: number | null | undefined, soGam: number | null | undefined): number | null {
  if (giaKg == null || soGam == null || !Number.isFinite(giaKg) || !Number.isFinite(soGam)) return null;
  const gia = Math.round((giaKg * soGam) / 1_000_000) * 1000;
  return gia === 0 ? null : gia;
}

/** Mã sản phẩm từ tên (hoặc từ mã người gõ): "Kim chi cải thảo" → "kim-chi-cai-thao", tối đa 40 ký tự. */
export function maTuTen(ten: string | null | undefined): string {
  return boDau(String(ten ?? '')).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 40).replace(/-+$/, '');
}

/** Câu lỗi cho người đọc, sau một lần GHI. */
function cauLoi(e: { message?: string } | null, macDinh: string, nn: NgonNguNB): string {
  const m = e?.message ?? '';
  if (laLoiMang(m)) return CAU_MAT_MANG_GHI[nn];
  if (/violates row-level security|permission denied for/i.test(m)) return CAU.khongQuyen[nn];
  return m ? dichCau(nn, m) : macDinh;
}

/** Câu lỗi cho người đọc, sau một lần ĐỌC (các hàm doc… ném; trang bắt rồi gọi hàm này). */
export function cauLoiDoc(e: unknown, nn: NgonNguNB = 'vi'): string {
  const m = e instanceof Error ? e.message : '';
  if (laLoiMang(m)) return CAU_MAT_MANG_GHI[nn];
  if (/violates row-level security|permission denied for/i.test(m)) return CAU.khongQuyen[nn];
  return m ? dichCau(nn, m) : CAU.khongDoc[nn];
}

type TraLoi<T> = { data: T | null; error: { message?: string; code?: string } | null };

/**
 * Một lời gọi database không bao giờ ném: supabase-js trả error khi mất mạng, nhưng fetch tự viết hay thư
 * viện đổi bản có thể ném TypeError('fetch failed') — đổi thành error cùng câu, để nhánh mất mạng là một.
 */
async function chacChan<T>(viec: () => PromiseLike<TraLoi<T>>): Promise<TraLoi<T>> {
  try {
    return await viec();
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? `${e.name}: ${e.message}` : String(e) } };
  }
}

function chuCua(form: FormData, ten: string): string | null {
  const v = form.get(ten);
  if (v === null) return null;
  const s = String(v).replace(/\r/g, '').trim();
  return s || null;
}

/** So hai bản chữ như database chuẩn hóa (ban_le_doc_chu): bỏ \r, bỏ khoảng trắng hai đầu, rỗng = null. */
function cungChu(a: unknown, b: unknown): boolean {
  const c = (x: unknown) => (x == null ? '' : String(x).replace(/\r/g, '').trim());
  return c(a) === c(b);
}

const soHoacNull = (x: unknown): number | null => (x == null || x === '' ? null : Number(x));
const doDai = (s: string) => [...s].length;

// -----------------------------------------------------------------------------
// CHI NHÁNH ĐANG XEM (chỉ để tính tồn ở quầy và đối chiếu FABi)
// -----------------------------------------------------------------------------
/** Cookie RIÊNG của màn này — không dùng chung bt_zalo_cn / bt_kho_cn: chọn ở đây không đổi chỗ khác. */
export const COOKIE_CN_BAN_LE = 'bt_ban_le_cn';
const DUONG_BAN_LE = '/noi-bo/ban-le';

/** Bản chạy thật (HTTPS) thì cookie chỉ đi qua HTTPS. Ngoài Astro (kiểm thử) import.meta.env không có. */
const banThat = () => (import.meta.env as Record<string, unknown> | undefined)?.PROD === true;

/**
 * Chi nhánh đang xem — chỉ những chi nhánh đang hoạt động. Nhân sự có chi nhánh → chi nhánh đó (đã ngừng
 * hoạt động thì null). Chủ (không gắn chi nhánh) → ?cn=<mã>, rồi cookie bt_ban_le_cn, rồi chi nhánh đầu.
 * cacChiNhanh chỉ có phần tử khi người xem được chọn (chủ).
 */
export async function chonChiNhanhBanLe(
  client: SupabaseClient, nhanSu: { chi_nhanh_id: string | null }, url: URL, cookies: AstroCookies,
): Promise<{ chiNhanh: ChiNhanhBanLe | null; cacChiNhanh: ChiNhanhBanLe[]; loi: string | null }> {
  const { data, error } = await chacChan(() => client.from('chi_nhanh').select('id, ma, ten, dang_hoat_dong').order('ma'));
  if (error) return { chiNhanh: null, cacChiNhanh: [], loi: error.message ?? '' };
  const ds = ((data ?? []) as (ChiNhanhBanLe & { dang_hoat_dong: boolean })[])
    .filter(c => c.dang_hoat_dong)
    .map(({ id, ma, ten }) => ({ id, ma, ten }));
  if (nhanSu.chi_nhanh_id) {
    return { chiNhanh: ds.find(c => c.id === nhanSu.chi_nhanh_id) ?? null, cacChiNhanh: [], loi: null };
  }
  const thamSo = url.searchParams.get('cn');
  const chon = thamSo ?? cookies.get(COOKIE_CN_BAN_LE)?.value;
  const cn = ds.find(c => c.ma === chon) ?? ds[0] ?? null;
  if (thamSo && cn && cn.ma === thamSo) {
    cookies.set(COOKIE_CN_BAN_LE, cn.ma, {
      httpOnly: true, secure: banThat(), sameSite: 'lax', path: DUONG_BAN_LE, maxAge: 60 * 60 * 24 * 60,
    });
  }
  return { chiNhanh: cn, cacChiNhanh: ds, loi: null };
}

// -----------------------------------------------------------------------------
// ĐỌC — ném lỗi; trang bắt rồi hiện cauLoiDoc()
// -----------------------------------------------------------------------------
/** Cả menu, thịt trước kim chi. chiNhanhId: chi nhánh để tính tồn ở quầy (database chỉ tính khi xem được kho ở đó). */
export async function docDanhSach(client: SupabaseClient, chiNhanhId: string | null): Promise<SanPhamBanLe[]> {
  const { data, error } = await client.rpc('ban_le_danh_sach', { p_chi_nhanh_id: chiNhanhId, p_id: null });
  if (error) throw new Error(error.message);
  return (Array.isArray(data) ? data : []) as SanPhamBanLe[];
}

/** Một sản phẩm, kèm sổ bản dịch. null = id sai dạng hoặc không thấy. */
export async function docSanPham(
  client: SupabaseClient, id: string, chiNhanhId: string | null,
): Promise<SanPhamBanLe | null> {
  if (!laUuid(id)) return null;
  const { data, error } = await client.rpc('ban_le_danh_sach', { p_chi_nhanh_id: chiNhanhId, p_id: id });
  if (error) throw new Error(error.message);
  return ((Array.isArray(data) ? data : [])[0] as SanPhamBanLe | undefined) ?? null;
}

/**
 * Mặt hàng kho để chọn: những mặt hàng đang dùng, cộng mặt hàng đang gắn (đã ngừng thì vẫn hiện, để lần lưu
 * không lặng lẽ gỡ nó). Chủ và quản lý xem được kho (RLS kho_mat_hang); vai khác đọc 0 dòng.
 */
export async function docMatHangChon(client: SupabaseClient, dangGan: readonly (string | null)[] = []): Promise<MatHangBanLe[]> {
  const { data, error } = await client
    .from('kho_mat_hang')
    .select('id, ma, ten, loai, gia_ban_kg, ma_can, dem_goi, don_vi_goi, dang_dung')
    .order('ten');
  if (error) throw new Error(error.message);
  return ((data ?? []) as MatHangBanLe[]).filter(m => m.dang_dung || dangGan.includes(m.id));
}

/** Đối chiếu FABi của một chi nhánh. */
export async function docDoiChieu(client: SupabaseClient, chiNhanhId: string): Promise<DoiChieuFabi> {
  const { data, error } = await client.rpc('ban_le_doi_chieu', { p_chi_nhanh_id: chiNhanhId });
  if (error) throw new Error(error.message);
  return data as DoiChieuFabi;
}

// -----------------------------------------------------------------------------
// FORM SỬA — đọc trước khi gọi database; lỗi của người gõ không bao giờ tới database
// -----------------------------------------------------------------------------
/** Một dòng gói như form gửi lên (chữ thô) — trang dùng để dựng lại đúng chữ đã gõ khi lưu hỏng. */
export interface DongGoiDaGo {
  id: string | null;
  so_gam: string;
  gia_rieng: string;
  ma_fabi: string;
  ma_vach: string;
  mat_hang_id: string;
  viec: string;
}

/** Số dòng gói form khai (ô ẩn so_dong_goi), tối đa 40 — giới hạn thật nằm ở SO_GOI_TOI_DA. */
function soDongGoi(form: FormData): number {
  const n = docSoNguyen(form.get('so_dong_goi'), 0, 40);
  return n === null || Number.isNaN(n) ? 0 : n;
}

export function dongGoiDaGo(form: FormData): DongGoiDaGo[] {
  const ra: DongGoiDaGo[] = [];
  for (let i = 0; i < soDongGoi(form); i++) {
    const o = (ten: string) => String(form.get(`goi_${i}_${ten}`) ?? '');
    ra.push({
      id: laUuid(o('id')) ? o('id') : null,
      so_gam: o('so_gam'), gia_rieng: o('gia_rieng'), ma_fabi: o('ma_fabi'), ma_vach: o('ma_vach'),
      mat_hang_id: o('mat_hang_id'), viec: o('viec') || 'giu',
    });
  }
  return ra;
}

/**
 * Form sửa → dữ liệu cho ban_le_luu_san_pham. Ô nào form không có thì không gửi (giữ nguyên).
 *   · Chữ: luôn gửi (database bỏ \r, khoảng trắng hai đầu, rỗng = null). Bản en / ko CHỈ gửi khi khác ô
 *     ẩn goc_… (chữ lúc mở trang): máy dịch chạy nền có thể vừa ghi bản mới — gửi lại chữ cũ là đè mất nó,
 *     và trigger còn ghi nhận chữ cũ đó là bản sửa tay.
 *   · Giá mỗi kg: chỉ gửi khi khác gia_ban_kg_cu (giá kho lúc mở trang), luôn kèm gia_ban_kg_cu — database so
 *     với giá đang có trong kho, khác thì không ghi gì (gia_kho_vua_doi).
 *   · Gói: dòng đang có mang goi_N_id và ô chọn Giữ / Ngưng bán / Bỏ gói này — bỏ gói luôn phải nói rõ
 *     (xoa: true), ô trọng lượng trống là lỗi, không phải bỏ. Chỉ dòng mới được để trống cả dòng.
 * doiFabi: lần lưu này đổi thứ FABi phải sửa tay theo (gói, giá gói, mã FABi, trạng thái, cách làm gói,
 * mặt hàng kho, cách bán) — so với các ô ẩn …_cu của chính form.
 */
export function docForm(form: FormData, nn: NgonNguNB = 'vi'): { duLieu: DuLieuLuu; loi: string | null; doiFabi: boolean } {
  const t = dichNB(nn, CAU);
  const duLieu: DuLieuLuu = {};
  let loi: string | null = null;
  const baoLoi = (cau: string) => { loi ??= cau; };
  let doiFabi = false;
  const coO = (ten: string) => form.get(ten) !== null;
  const cu = (ten: string) => String(form.get(`${ten}_cu`) ?? '');

  // Chữ tiếng Việt
  if (coO('ten_vi')) {
    duLieu.ten_vi = chuCua(form, 'ten_vi');
    if (!duLieu.ten_vi) baoLoi(t.chuaTen);
  }
  for (const k of ['mo_ta_vi', 'cach_dung_vi'] as const) if (coO(k)) duLieu[k] = chuCua(form, k);

  // Bản en / ko: chỉ ô người dùng thật sự sửa
  for (const o of O_DICH_BAN_LE) {
    for (const l of ['en', 'ko'] as const) {
      const k = `${o.cot}_${l}`;
      if (!coO(k)) continue;
      const moi = chuCua(form, k);
      if (cungChu(moi, form.get(`goc_${k}`))) continue;
      duLieu[k] = moi;
      if (moi && doDai(moi) > o.toiDa) baoLoi(t.dichDai(`${o.ten[nn]} (${l.toUpperCase()})`, o.toiDa));
    }
  }

  // Kiểu sản phẩm (loại + cách bán)
  if (coO('kieu')) {
    const [loai, cachBan] = String(form.get('kieu')).split('|');
    if (!(loai in TEN_LOAI_BAN_LE) || !['theo_can', 'theo_hop'].includes(cachBan ?? '')) baoLoi(t.kieuSai);
    else {
      duLieu.loai = loai;
      duLieu.cach_ban = cachBan;
      if (coO('kieu_cu') && String(form.get('kieu')) !== cu('kieu')) doiFabi = true;
    }
  }

  // Ô chọn chữ: database kiểm giá trị (câu tiếng Việt có bản tiếng Anh)
  for (const k of ['bao_quan', 'trang_thai', 'nguon_goi'] as const) {
    if (!coO(k)) continue;
    duLieu[k] = String(form.get(k));
    if (k !== 'bao_quan' && coO(`${k}_cu`) && duLieu[k] !== cu(k)) doiFabi = true;
  }

  // Có / Không
  for (const k of ['kenh_mini_app', 'kenh_web'] as const) {
    if (!coO(k)) continue;
    const v = String(form.get(k));
    if (v === 'co' || v === 'khong') duLieu[k] = v === 'co';
    else baoLoi(t.coKhongSai);
  }

  // Mặt hàng kho của sản phẩm
  if (coO('mat_hang_id')) {
    const v = String(form.get('mat_hang_id')).trim();
    if (v !== '' && !laUuid(v)) baoLoi(t.matHangSai);
    else {
      duLieu.mat_hang_id = v || null;
      if (coO('mat_hang_id_cu') && (v || '') !== cu('mat_hang_id')) doiFabi = true;
    }
  }

  // Giá mỗi kg — ô của Kho → Mặt hàng
  if (coO('gia_ban_kg')) {
    const go = docTien(form.get('gia_ban_kg'));
    const giaCu = soHoacNull(cu('gia_ban_kg'));
    if (go === null) {
      if (giaCu !== null) baoLoi(t.giaKgTrong);
    } else if (Number.isNaN(go)) {
      baoLoi(t.giaKgSai);
    } else if (go !== giaCu) {
      duLieu.gia_ban_kg = go;
      duLieu.gia_ban_kg_cu = giaCu;
    }
  }

  // Gói / hộp
  if (coO('so_dong_goi')) {
    const goi: Record<string, unknown>[] = [];
    let conLai = 0;
    for (let i = 0; i < soDongGoi(form); i++) {
      const o = (ten: string) => String(form.get(`goi_${i}_${ten}`) ?? '').trim();
      const co = (ten: string) => form.get(`goi_${i}_${ten}`) !== null;
      const id = laUuid(o('id')) ? o('id') : null;
      const viec = o('viec') || 'giu';

      if (id && viec === 'bo') {
        goi.push({ id, xoa: true });
        doiFabi = true;
        continue;
      }
      const trong = o('so_gam') === '' && o('gia_rieng') === '' && o('ma_fabi') === '' && o('ma_vach') === ''
        && o('mat_hang_id') === '';
      if (!id && (viec === 'bo' || trong)) continue;
      if (o('so_gam') === '') {
        baoLoi(id ? t.oTrong(o('so_gam_cu') || '?') : t.goiMoiTrong);
        continue;
      }
      const soGam = docSoNguyen(o('so_gam'), 50, 5000);
      if (soGam === null || Number.isNaN(soGam)) { baoLoi(t.trongLuongSai); continue; }

      let giaRieng: number | null = null;
      if (o('gia_rieng') !== '') {
        const g = docTien(o('gia_rieng'));
        if (g === null || Number.isNaN(g)) baoLoi(t.giaGoiSai(soGam));
        else if (g < 1000 || g > 100_000_000) baoLoi(t.giaGoiKhoang(soGam));
        else if (g % 1000 !== 0) baoLoi(t.giaTronNghin(soGam));
        else giaRieng = g;
      }

      const dong: Record<string, unknown> = {
        so_gam: soGam, gia_rieng: giaRieng, ma_fabi: o('ma_fabi') || null, dang_ban: viec !== 'ngung',
      };
      if (id) dong.id = id;
      if (co('ma_vach')) dong.ma_vach = o('ma_vach') || null;
      // "giu": gói đang gắn một mặt hàng không còn trong kho — JSON của gói không mang id của nó, nên trang
      // không chọn lại được; giữ nguyên = không gửi ô này.
      if (co('mat_hang_id') && o('mat_hang_id') !== 'giu') {
        if (o('mat_hang_id') !== '' && !laUuid(o('mat_hang_id'))) baoLoi(t.matHangSai);
        else dong.mat_hang_id = o('mat_hang_id') || null;
      }
      goi.push(dong);
      conLai++;

      if (!id) doiFabi = true;
      else if (String(soGam) !== o('so_gam_cu') || String(giaRieng ?? '') !== o('gia_rieng_cu')
               || (dong.ma_fabi ?? '') !== o('ma_fabi_cu') || String(dong.dang_ban) !== o('dang_ban_cu')
               || ('mat_hang_id' in dong && (dong.mat_hang_id ?? '') !== o('mat_hang_id_cu'))) doiFabi = true;
    }
    if (conLai > SO_GOI_TOI_DA) baoLoi(t.quaNhieuGoi);
    duLieu.goi = goi;
  }

  return { duLieu, loi, doiFabi };
}

/**
 * Database đang giữ ĐÚNG bản vừa gửi chưa — lần hai của cú bấm đúp, F5 sau khi lưu: lần một đã ghi và đổi
 * phiên bản, nên lần hai nhận nguoi_khac_sua. Giữ đúng thì nói "Đã lưu.", không nói "người khác sửa".
 */
export function daGiuDung(sp: SanPhamBanLe, duLieu: DuLieuLuu): boolean {
  const spMo = sp as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(duLieu)) {
    if (k === 'goi' || k === 'gia_ban_kg_cu') continue;
    if (k === 'gia_ban_kg') {
      if (soHoacNull(sp.mat_hang?.gia_ban_kg) !== v) return false;
    } else if (typeof v === 'boolean' || typeof spMo[k] === 'boolean') {
      if (spMo[k] !== v) return false;
    } else if (!cungChu(spMo[k], v)) return false;
  }
  for (const g of duLieu.goi ?? []) {
    const dangCo = g.id ? sp.goi.find(x => x.id === g.id) : sp.goi.find(x => x.so_gam === g.so_gam);
    if (g.xoa === true) {
      if (dangCo) return false;
      continue;
    }
    if (!dangCo) return false;
    const coMo = dangCo as unknown as Record<string, unknown>;
    for (const k of ['so_gam', 'gia_rieng', 'ma_fabi', 'ma_vach', 'mat_hang_id', 'dang_ban']) {
      if (!(k in g)) continue;
      // JSON của gói không có mat_hang_id — id nằm trong mat_hang (null khi mặt hàng đã mất).
      const a = k === 'mat_hang_id' ? (dangCo.mat_hang?.id ?? null) : coMo[k];
      const b = g[k];
      if (typeof b === 'number' || typeof a === 'number' ? soHoacNull(a) !== soHoacNull(b) : !cungChu(a, b)) return false;
    }
  }
  return true;
}

/**
 * Câu sau một lần lưu được, dựng từ chính kết quả của database — chỉ nói điều đã xảy ra:
 *   · luôn "Đã lưu.";
 *   · giá mỗi kg vừa đổi, trong khoảng cân nhận, mặt hàng có mã cân và đang dùng → câu Beeftown Cân;
 *   · giá quá cửa sổ 6 chữ số của cân → cân VẪN IN GIÁ CŨ (không bao giờ câu "gửi giá mới");
 *   · đổi thứ FABi phải theo → "FABi phải sửa tay";
 *   · mỗi gói vừa bỏ một câu (có mã FABi thì nhắc tắt món);
 *   · cảnh báo của sản phẩm; chữ cấm trong câu vừa lưu (sẽ là chữ cho khách khi bán online).
 */
export function cauDaLuu(r: KetQuaHamLuu, duLieu: DuLieuLuu, doiFabi: boolean, nn: NgonNguNB = 'vi'): string {
  const t = dichNB(nn, CAU);
  const phan: string[] = [t.daLuu];
  const mh = r.mat_hang;
  const canh = Array.isArray(r.canh_bao) ? r.canh_bao : [];
  const gia = soHoacNull(mh?.gia_ban_kg);

  if (canh.includes('gia_qua_can') && mh?.ma_can) phan.push(t.quaCan(dinhDangTien(GIA_TOI_DA, nn), mh.ma_can));
  else if (r.gia_kho_doi && mh?.dang_dung && mh.ma_can && gia !== null && gia >= 1 && gia <= GIA_TOI_DA) phan.push(t.beeftownCan);

  if (doiFabi || r.gia_kho_doi) phan.push(t.fabiSuaTay);
  for (const b of Array.isArray(r.da_bo) ? r.da_bo : []) {
    phan.push(b.ma_fabi ? t.daBoGoiMa(b.so_gam, b.ma_fabi) : t.daBoGoi(b.so_gam));
  }
  for (const c of canh) if (c !== 'gia_qua_can') phan.push(cauCanhBao(c, nn));

  const daThay = new Set<string>();
  for (const k of [...COT_CHU_VI, ...COT_DICH]) {
    const v = duLieu[k];
    if (typeof v !== 'string') continue;
    for (const c of timChuoiCam(v)) {
      if (daThay.has(c.tim_thay)) continue;
      daThay.add(c.tim_thay);
      phan.push(t.chuCam(c.tim_thay, dichCau(nn, c.vi_sao)));
    }
  }
  return phan.join(' ');
}

// -----------------------------------------------------------------------------
// GHI
// -----------------------------------------------------------------------------
/** Thêm sản phẩm. Cùng ma_gui (bấm đúp, F5) → database trả sản phẩm đã có, không tạo thêm. */
export async function taoSanPham(
  client: SupabaseClient, form: FormData, nn: NgonNguNB = 'vi',
): Promise<{ ok: true; id: string; daCo: boolean } | { ok: false; cau: string }> {
  const t = dichNB(nn, CAU);
  const maGui = String(form.get('ma_gui') ?? '');
  if (!laUuid(maGui)) return { ok: false, cau: t.maGuiSai };
  const ten = chuCua(form, 'ten_vi');
  if (!ten) return { ok: false, cau: t.chuaTen };
  const [loai, cachBan] = String(form.get('kieu') ?? '').split('|');
  if (!KIEU_SAN_PHAM.some(k => k.ma === `${loai}|${cachBan}`)) return { ok: false, cau: t.kieuSai };
  // Mã gõ tay (trong ô "Mã") cũng đi qua maTuTen: chữ hoa, dấu, khoảng trắng thành mã hợp lệ.
  const ma = maTuTen(chuCua(form, 'ma') ?? ten);
  if (!ma) return { ok: false, cau: t.maSai };

  const { data, error } = await chacChan(() => client.rpc('ban_le_tao_san_pham', {
    p_ma_gui: maGui, p_ma: ma, p_ten_vi: ten, p_loai: loai, p_cach_ban: cachBan,
  }));
  if (error) return { ok: false, cau: cauLoi(error, t.khongTao, nn) };
  const kq = data as { id?: string; da_co?: boolean } | null;
  if (!kq?.id) return { ok: false, cau: t.khongTao };
  return { ok: true, id: kq.id, daCo: kq.da_co === true };
}

/**
 * Lưu form sửa. Không bao giờ "Đã lưu" khi hàm lưu chưa trả ok:
 *   · nguoi_khac_sua → đọc lại; database đang giữ đúng bản vừa gửi (bấm đúp, F5) → "Đã lưu.", không thì câu
 *     người khác sửa (trang giữ chữ đã gõ, phiên bản mới lấy từ lần đọc lại);
 *   · gia_kho_vua_doi (hàm lưu chưa ghi gì) → giá kho hiện tại đúng bằng giá vừa gõ (người khác vừa đặt cùng
 *     giá ở Kho) thì gửi lại phần còn lại không kèm giá mỗi kg — hàm lưu trả ok mới nói "Đã lưu."; khác thì
 *     câu "Giá ở Kho vừa đổi thành X đ/kg".
 */
export async function luuSanPham(
  client: SupabaseClient, id: string, form: FormData, nn: NgonNguNB = 'vi',
): Promise<KetQuaLuu> {
  const t = dichNB(nn, CAU);
  if (!laUuid(id)) return { ok: false, cau: t.khongThay };
  const { duLieu, loi, doiFabi } = docForm(form, nn);
  if (loi) return { ok: false, cau: loi };
  const phienBan = String(form.get('phien_ban') ?? '');

  const guiLuu = (duLieuGui: DuLieuLuu) => chacChan(() => client.rpc('ban_le_luu_san_pham', {
    p_id: id, p_phien_ban: phienBan, p_du_lieu: duLieuGui,
  }));

  let duLieuGui = duLieu;
  let { data, error } = await guiLuu(duLieuGui);
  const lanMot = data as { ok?: boolean; ly_do?: string; gia_ban_kg?: number | null } | null;
  if (!error && lanMot?.ok === false && lanMot.ly_do === 'gia_kho_vua_doi'
      && 'gia_ban_kg' in duLieu && soHoacNull(lanMot.gia_ban_kg) === duLieu.gia_ban_kg) {
    duLieuGui = { ...duLieu };
    delete duLieuGui.gia_ban_kg;
    delete duLieuGui.gia_ban_kg_cu;
    ({ data, error } = await guiLuu(duLieuGui));
  }

  if (error) return { ok: false, cau: cauLoi(error, t.khongLuu, nn) };
  const r = data as (KetQuaHamLuu | { ok: false; ly_do: string; gia_ban_kg?: number | null }) | null;
  if (r?.ok === true) return { ok: true, cau: cauDaLuu(r, duLieuGui, doiFabi, nn) };

  if (r?.ly_do === 'nguoi_khac_sua') {
    let hienTai: SanPhamBanLe | null = null;
    try { hienTai = await docSanPham(client, id, null); } catch { /* không đọc lại được: không đoán là đã lưu */ }
    if (hienTai && daGiuDung(hienTai, duLieuGui)) return { ok: true, cau: t.daLuu };
    return { ok: false, cau: t.nguoiKhacSua, maLoi: 'nguoi_khac_sua' };
  }
  if (r?.ly_do === 'gia_kho_vua_doi') {
    return { ok: false, cau: t.giaKhoVuaDoi(dinhDangTien(r.gia_ban_kg ?? null, nn)), maLoi: 'gia_kho_vua_doi' };
  }
  return { ok: false, cau: t.khongLuu };
}

/** Ảnh chụp giá từ ô ẩn gia_da_xem (JSON). Sai dạng → null. */
export function docAnhChupGia(v: unknown): AnhChupGia | null {
  let o: unknown = v;
  if (typeof v === 'string') {
    try { o = JSON.parse(v); } catch { return null; }
  }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  const { kg, goi } = o as { kg?: unknown; goi?: unknown };
  if (!(kg === null || (typeof kg === 'number' && Number.isFinite(kg)))) return null;
  if (!goi || typeof goi !== 'object' || Array.isArray(goi)) return null;
  const ra: Record<string, number> = {};
  for (const [k, g] of Object.entries(goi as Record<string, unknown>)) {
    if (!/^\d+$/.test(k) || typeof g !== 'number' || !Number.isFinite(g)) return null;
    ra[k] = g;
  }
  return { kg, goi: ra };
}

function cungAnhChup(a: AnhChupGia | null | undefined, b: AnhChupGia | null | undefined): boolean {
  if (!a || !b) return false;
  const ka = Object.keys(a.goi ?? {}).sort();
  const kb = Object.keys(b.goi ?? {}).sort();
  return soHoacNull(a.kg) === soHoacNull(b.kg) && ka.join() === kb.join()
    && ka.every(k => Number(a.goi[k]) === Number(b.goi[k]));
}

/**
 * Chủ xác nhận đúng những giá trang đã hiện (gia_de_chot gửi lại nguyên văn). Giá đổi ở Kho → Mặt hàng mà
 * không đụng dòng sản phẩm, nên database so cả ảnh chụp lẫn phiên bản.
 * nguoi_khac_sua (máy dịch vừa ghi bản dịch, hay lần hai của cú bấm đúp): đọc lại — giá vẫn đúng những giá
 * chủ đã thấy thì gửi lại một lần với phiên bản mới (xác nhận giá chỉ phụ thuộc giá); khác thì báo, không ghi.
 */
export async function chotGia(
  client: SupabaseClient, id: string, phienBan: string, giaDaXem: unknown, nn: NgonNguNB = 'vi',
): Promise<KetQua> {
  const t = dichNB(nn, CAU);
  if (!laUuid(id)) return { ok: false, cau: t.khongThay };
  const gia = docAnhChupGia(giaDaXem);
  if (!gia) return { ok: false, cau: t.giaDaXemSai };

  const guiChot = (pb: string) => chacChan(() => client.rpc('ban_le_chot_gia', {
    p_id: id, p_phien_ban: pb, p_gia_da_xem: gia,
  }));
  let { data, error } = await guiChot(phienBan);
  const lanMot = data as { ok?: boolean; ly_do?: string } | null;
  if (!error && lanMot?.ok === false && lanMot.ly_do === 'nguoi_khac_sua') {
    let hienTai: SanPhamBanLe | null = null;
    try { hienTai = await docSanPham(client, id, null); } catch { /* không đọc lại được: không gửi lại */ }
    if (!hienTai || !cungAnhChup(hienTai.gia_de_chot, gia)) return { ok: false, cau: t.chotNguoiKhac };
    ({ data, error } = await guiChot(hienTai.updated_at));
  }

  if (error) return { ok: false, cau: cauLoi(error, t.khongChot, nn) };
  const r = data as { ok?: boolean; ly_do?: string; da_chot_roi?: boolean } | null;
  if (r?.ok === true) return { ok: true, cau: r.da_chot_roi ? t.daChotRoi : t.daChot };
  if (r?.ly_do === 'gia_vua_doi') return { ok: false, cau: t.giaVuaDoi };
  if (r?.ly_do === 'nguoi_khac_sua') return { ok: false, cau: t.chotNguoiKhac };
  return { ok: false, cau: t.khongChot };
}

// -----------------------------------------------------------------------------
// ĐỐI CHIẾU FABi — câu cho từng việc
// -----------------------------------------------------------------------------
const CAU_VIEC = {
  khop:              { vi: 'Khớp — không cần làm gì.', en: 'Matches — nothing to do.' },
  menu_cu:           { vi: 'Chưa rõ: thực đơn FABi đọc đã cũ — cập nhật thực đơn rồi xem lại.',
                       en: 'Unknown: the FABi menu read is out of date — refresh it, then check again.' },
  tao_mon:           { vi: (ma: string, gia: string) => `Tạo món mã ${ma} trên FABi, giá ${gia}.`,
                       en: (ma: string, gia: string) => `Create item ${ma} in FABi, price ${gia}.` },
  bat_mon:           { vi: 'Món đang tắt trên FABi — bật lại.', en: 'The item is turned off in FABi — turn it back on.' },
  ghep:              { vi: (x: string) => `Chưa ghép món trong kho — mở Ghép món, chọn: ${x}.`,
                       en: (x: string) => `Not matched in stock yet — open Match dishes and choose: ${x}.` },
  sua_ghep:          { vi: (dang: string, can: string) => `Ghép món đang sai (${dang}) — sửa ở Ghép món thành: ${can}.`,
                       en: (dang: string, can: string) => `The match is wrong (${dang}) — change it in Match dishes to: ${can}.` },
  dat_gia:           { vi: (gia: string) => `Giá chưa chốt hoặc đã đổi sau lần chốt — chốt giá rồi đặt ${gia} trên FABi.`,
                       en: (gia: string) => `The price is not confirmed or changed after confirmation — confirm it, then set ${gia} in FABi.` },
  thieu_gia:         { vi: 'Gói đang bán chưa có giá — điền giá ở menu bán lẻ trước.',
                       en: 'A pack on sale has no price — fill in the price in the retail menu first.' },
  gia_qua_can:       { vi: `Giá quá ${dinhDangTien(GIA_TOI_DA, 'vi')}/kg — cân quầy không nhận, vẫn in giá cũ.`,
                       en: `The price is above ${dinhDangTien(GIA_TOI_DA, 'en')}/kg — the counter scale refuses it and keeps the old price.` },
  khay_nguyen:       { vi: 'Mặt hàng kho đếm theo khay: FABi sẽ trừ nguyên một khay cho mỗi gói — chọn "Đóng gói sẵn" hoặc đổi mặt hàng sang cân theo kg.',
                       en: 'The stock item is counted by tray: FABi would deduct a whole tray per pack — choose "Pre-packed" or change the item to weigh by kg.' },
  thieu_mat_hang:    { vi: 'Chưa gắn mặt hàng kho đang dùng — gắn ở menu bán lẻ.',
                       en: 'No active stock item linked — link one in the retail menu.' },
  goi_khong_dem_goi: { vi: 'Mặt hàng kho của gói chưa đếm theo gói — đổi ở Kho → Mặt hàng.',
                       en: 'The stock item of the pack is not counted by pack — change it in Stock → Items.' },
  chua_co_ma:        { vi: 'Chưa có mã FABi — điền mã FABi cho gói ở menu bán lẻ.',
                       en: 'No FABi code yet — fill in the FABi code for the pack in the retail menu.' },
  tat_mon:           { vi: 'Tắt món này trên FABi — menu bán lẻ không còn bán.',
                       en: 'Turn this item off in FABi — the retail menu no longer sells it.' },
  kiem_tra_mon:      { vi: 'FABi đang bán mã này, trừ cùng mặt hàng, nhưng menu bán lẻ không có — tắt trên FABi nếu không còn bán.',
                       en: 'FABi sells this code and deducts the same stock item, but the retail menu does not have it — turn it off in FABi if it is no longer sold.' },
} satisfies Record<string, HaiThuTieng<unknown>>;

const CAU_GHEP = {
  theoKg:    { vi: (ten: string) => `bán theo kg, trừ ${ten}`, en: (ten: string) => `sold by kg, deducts ${ten}` },
  theoGoiKg: { vi: (kg: string, ten: string) => `bán theo gói, mỗi gói = ${kg} kg, trừ ${ten}`,
               en: (kg: string, ten: string) => `sold by pack, each pack = ${kg} kg, deducts ${ten}` },
  theoGoi:   { vi: (ten: string) => `bán theo gói, trừ ${ten}`, en: (ten: string) => `sold by pack, deducts ${ten}` },
  theoMon:   { vi: (ten: string) => `theo món kho, trừ ${ten}`, en: (ten: string) => `as the stock item, deducts ${ten}` },
  theoSuat:  { vi: 'bán theo suất', en: 'sold by portion' },
  canNhan:   { vi: 'hàng cân nhãn, chưa chọn mặt hàng', en: 'scale-labelled goods, no stock item chosen' },
  khongKho:  { vi: 'không phải hàng kho', en: 'not a stock item' },
  chuaRo:    { vi: 'mặt hàng chưa rõ', en: 'unknown stock item' },
} satisfies Record<string, HaiThuTieng<unknown>>;

/** "bán theo gói, mỗi gói = 0,2 kg, trừ Ribeye Mỹ" — cùng chữ với màn Ghép món. */
export function moTaGhep(g: GhepFabi | null, nn: NgonNguNB = 'vi'): string {
  const t = dichNB(nn, CAU_GHEP);
  if (!g) return '—';
  if (g.kieu === 'bo_qua') return t.khongKho;
  if (g.kieu === 'goi_can' && !g.mat_hang_ten) return t.canNhan;
  const ten = g.mat_hang_ten ?? t.chuaRo;
  if (g.don_vi_ban === 'kg') return t.theoKg(ten);
  if (g.don_vi_ban === 'suat') return t.theoSuat;
  if (g.don_vi_ban === 'goi') return g.kg_moi_don_vi != null ? t.theoGoiKg(dinhDangKg(g.kg_moi_don_vi, nn), ten) : t.theoGoi(ten);
  return t.theoMon(ten);
}

/** Giá phải đặt trên FABi của một dòng: dòng cân, ô mã, mã giảm là giá mỗi kg. */
export function giaPhaiDat(d: DongDoiChieu, nn: NgonNguNB = 'vi'): string {
  if (d.gia_phai_dat == null) return '—';
  return d.loai_dong === 'goi' || d.loai_dong === 'kiem_tra' ? dinhDangTien(d.gia_phai_dat, nn) : `${dinhDangTien(d.gia_phai_dat, nn)}/kg`;
}

/** Một câu cho mỗi việc của dòng đối chiếu; mã lạ (database mới hơn web) thì hiện nguyên mã. */
export function cauViecDoiChieu(d: DongDoiChieu, nn: NgonNguNB = 'vi'): string[] {
  const t = dichNB(nn, CAU_VIEC);
  return d.viec.map(v => {
    switch (v) {
      case 'tao_mon': return t.tao_mon(d.ma_fabi ?? d.ma_can ?? '—', giaPhaiDat(d, nn));
      case 'ghep': return t.ghep(moTaGhep(d.mong_doi, nn));
      case 'sua_ghep': return t.sua_ghep(moTaGhep(d.ghep, nn), moTaGhep(d.mong_doi, nn));
      case 'dat_gia': return t.dat_gia(giaPhaiDat(d, nn));
      default: {
        const c = (t as Record<string, unknown>)[v];
        return typeof c === 'string' ? c : v;
      }
    }
  });
}

/** Dòng có việc phải làm (không phải "khớp"). */
export const coViec = (d: DongDoiChieu) => d.viec.some(v => v !== 'khop');
