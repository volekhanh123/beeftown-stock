/**
 * SỨC KHỎE HỆ THỐNG — đèn xanh / vàng / đỏ trên trang Tổng quan (/noi-bo)
 * =====================================================================
 *
 * Database (suc_khoe_he_thong, migration 0055; suc_khoe_sao_luu, 0058) chỉ trả SỐ LIỆU: số đếm và mốc giờ. File này
 * quyết định MÀU và CÂU hai thứ tiếng; crm/test/test-suc-khoe-web.mjs thử từng ngưỡng bằng dữ
 * liệu giả, không cần database.
 *
 * Hai loại ngưỡng, ở hai chỗ:
 *   · so với MỐC GIỜ (nhịp tim việc chạy nền, lỗi Messenger mới, Messenger im lặng) — ở đây,
 *     đổi không cần migration;
 *   · ĐẾM (yêu cầu chờ quá 2 / 24 giờ, hồ sơ quá 2 / 7 ngày, tin kẹt quá 30 phút, tin hỏng
 *     24 giờ, lỗi Messenger 7 ngày) — trong SQL của 0055. Câu chữ ở đây phải nói đúng con số
 *     đó; PHUT_TIN_KET được test đối chiếu với file migration.
 *
 * Nghĩa của màu (người đọc là chủ / quản lý, không phải lập trình viên):
 *   đỏ   — cần xử lý NGAY: có thứ đang hỏng, hoặc khách đang bị bỏ quên.
 *   vàng — cần xem trong hôm nay.
 *   xanh — ổn.
 *   xám  — chưa bật / chưa dùng: không có gì để hỏng.
 *
 * Không đọc được số liệu thì KHÔNG BAO GIỜ hiện "mọi thứ đang chạy tốt" — bảng nói thẳng là
 * không đọc được (xem docSucKhoe). Im lặng khi hỏng chính là thứ bảng này sinh ra để chặn.
 *
 * Thêm một việc chạy nền hay một dịch vụ ngoài mới: thêm số liệu của nó vào
 * suc_khoe_he_thong() (migration mới) và một đèn ở đây, kèm kiểm thử ở cả hai file test.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { HaiThuTieng, NgonNguNB } from './ngon-ngu-noi-bo';
import { gioVnTuMs } from './gio-vn.ts';

// -----------------------------------------------------------------------------
// NGƯỠNG
// -----------------------------------------------------------------------------
/** Cron chạy 5 phút một lần: 30 phút không có lượt nào = đã lỡ 6 lượt, không còn là chậm nữa. */
export const PHUT_NHIP_TIM = 30;
/** Bot Messenger: lỗi của tin gần nhất trong khoảng này mới coi là "đang hỏng". */
export const PHUT_LOI_MOI = 60;
/** Bot Messenger bật mà chừng này giờ không nhận được tin nào → xem lại webhook. */
export const GIO_KHONG_CO_TIN = 72;
/** Tin giao dịch kẹt: đến hạn quá chừng này phút mà chưa gửi. PHẢI bằng interval của cho_qua_han trong 0055. */
export const PHUT_TIN_KET = 30;
/**
 * Sao lưu chạy mỗi đêm (.github/workflows/sao-luu.yml): quá chừng này giờ không có bản DÙNG ĐƯỢC nào
 * (khôi phục thử đạt) = đã lỡ ít nhất một đêm — dữ liệu từ đó tới giờ chưa có bản sao dùng được.
 */
export const GIO_SAO_LUU = 36;

// -----------------------------------------------------------------------------
// SỐ LIỆU THÔ — đúng dạng suc_khoe_he_thong() trả về
// -----------------------------------------------------------------------------
export interface IposTho {
  co_cau_hinh: boolean; bat: boolean; cau_hinh_du: boolean;
  /** Đèn của màn Kết nối iPOS (kho_ipos_trang_thai): 'xanh' | 'vang' | 'do'. */
  den: string; mat_ket_noi: boolean; loi_tu_luc: string | null;
  nhan_hd_luc: string | null; gio_mat_ket_noi: number;
  dang_tru_kho: boolean; cho_xu_ly: number; dong_loi: number;
  bat_luc: string | null; cron_cuoi: string | null;
}

export interface ChiNhanhTho {
  id: string; ma: string; ten: string;
  ipos: IposTho;
  tin_zalo: { that_bai_24h: number; cho_qua_han: number };
  /** Ba nhóm KHÔNG chồng nhau: qua giờ hẹn; chưa tới hẹn mà chờ quá 24 giờ; chưa tới hẹn, chờ 2–24 giờ. */
  dat_ban: { form_mo: boolean; so_ban: number; cho: number; cho_qua_2_gio: number; cho_qua_24_gio: number; qua_gio_hen: number };
  /** Hai nhóm KHÔNG chồng nhau: quá 7 ngày; 2–7 ngày. */
  tuyen_dung: { moi: number; moi_qua_2_ngay: number; moi_qua_7_ngay: number };
  so_kho: { co_kho: boolean; lech: number };
}

/** suc_khoe_sao_luu() (0058). Mốc = lúc lượt bắt đầu (dữ liệu trong bản sao là của lúc đó). */
export interface SaoLuuTho {
  /** Lượt gần nhất, bất kể kết quả; lan_cuoi_thu: khôi phục thử của lượt đó — 'dat' | 'hong' | 'chua_thu'. */
  lan_cuoi: string | null; lan_cuoi_ok: boolean | null; lan_cuoi_thu: string | null;
  /** Bản DÙNG ĐƯỢC gần nhất: sao lưu xong VÀ khôi phục thử đạt. */
  dung_duoc_cuoi: string | null; kich_thuoc: number | null;
}

export interface SucKhoeTho {
  /** now() của database — mọi phép "bao lâu trước" tính theo mốc này, không theo đồng hồ Worker. */
  luc: string;
  /** bat_luc: lần gần nhất chuyển từ tắt sang bật (0055) — không đổi khi lưu cấu hình hay khi gửi. */
  zalo: { dang_bat: boolean; che_do: string | null; bat_luc: string | null; lan_chay_cuoi: string | null; co_loi: boolean };
  messenger: { dang_bat: boolean; bat_luc: string | null; lan_nhan_cuoi: string | null; loi_cuoi_luc: string | null; loi_7_ngay: number };
  dich: { cho: number; loi: number };
  /** Gắn thêm từ suc_khoe_sao_luu() (docSucKhoeVaSaoLuu). undefined: database chưa chạy 0058; null: không đọc được. */
  sao_luu?: SaoLuuTho | null;
  chi_nhanh: ChiNhanhTho[];
}

export type KetQuaDoc =
  | { ok: true; tho: SucKhoeTho }
  /** chuaCoHam: database chưa chạy migration 0055 — không phải lỗi mạng. */
  | { ok: false; chuaCoHam: boolean };

function laDoiTuong(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Đủ khung để đánh giá; từng ô thiếu thì danhGiaSucKhoe tự coi là 0 / tắt. */
export function laSucKhoeTho(v: unknown): v is SucKhoeTho {
  return laDoiTuong(v) && typeof v.luc === 'string' && Number.isFinite(Date.parse(v.luc))
    && laDoiTuong(v.zalo) && laDoiTuong(v.messenger) && laDoiTuong(v.dich)
    && Array.isArray(v.chi_nhanh) && v.chi_nhanh.every(c => laDoiTuong(c) && typeof c.id === 'string');
}

/**
 * Chính hàm `ten` chưa có (database chưa chạy migration của nó): PGRST202 của PostgREST hoặc 42883
 * của Postgres, VÀ câu lỗi nhắc đúng tên hàm. Chỉ xét mã thì một hàm CON bị đổi / xóa (42883
 * "function kho_ipos_trang_thai(uuid) does not exist") thành "chưa chạy migration" màu vàng,
 * không log — hỏng thật bị giấu đi.
 */
export function laThieuHam(e: { code?: string | null; message?: string | null } | null | undefined,
                           ten: 'suc_khoe_he_thong' | 'suc_khoe_sao_luu' = 'suc_khoe_he_thong'): boolean {
  if (!e) return false;
  return (e.code === 'PGRST202' || e.code === '42883') && new RegExp(`\\b${ten}\\b`).test(e.message ?? '');
}

/**
 * Gọi suc_khoe_he_thong(). Không bao giờ ném lỗi: mạng hỏng / database lỗi / dạng lạ → ok:false,
 * ghi một dòng log (không kèm dữ liệu — hàm không trả dữ liệu cá nhân, câu lỗi Supabase thì có thể
 * kèm tên bảng nên chỉ ghi mã và câu).
 */
export async function docSucKhoe(client: Pick<SupabaseClient, 'rpc'>): Promise<KetQuaDoc> {
  try {
    const { data, error } = await client.rpc('suc_khoe_he_thong');
    if (error) {
      const thieu = laThieuHam(error);
      if (!thieu) console.error('[suc-khoe] rpc suc_khoe_he_thong failed:', error.code ?? '', error.message ?? '');
      return { ok: false, chuaCoHam: thieu };
    }
    if (!laSucKhoeTho(data)) {
      console.error('[suc-khoe] rpc suc_khoe_he_thong returned an unexpected shape');
      return { ok: false, chuaCoHam: false };
    }
    return { ok: true, tho: data };
  } catch (e) {
    console.error('[suc-khoe] rpc suc_khoe_he_thong threw:', e instanceof Error ? e.message : String(e));
    return { ok: false, chuaCoHam: false };
  }
}

/**
 * Gọi suc_khoe_sao_luu() (0058). Không bao giờ ném lỗi. undefined = database chưa chạy 0058 (không có
 * hàm); null = không đọc được lúc này (mạng, lỗi, dạng lạ) — đèn nói rõ, không bao giờ xanh.
 */
export async function docSaoLuu(client: Pick<SupabaseClient, 'rpc'>): Promise<SaoLuuTho | null | undefined> {
  try {
    const { data, error } = await client.rpc('suc_khoe_sao_luu');
    if (error) {
      if (laThieuHam(error, 'suc_khoe_sao_luu')) return undefined;
      console.error('[suc-khoe] rpc suc_khoe_sao_luu failed:', error.code ?? '', error.message ?? '');
      return null;
    }
    if (!laDoiTuong(data)) {
      console.error('[suc-khoe] rpc suc_khoe_sao_luu returned an unexpected shape');
      return null;
    }
    return data as unknown as SaoLuuTho;
  } catch (e) {
    console.error('[suc-khoe] rpc suc_khoe_sao_luu threw:', e instanceof Error ? e.message : String(e));
    return null;
  }
}

/**
 * Thứ trang Tổng quan gọi: hai hàm song song, số liệu sao lưu gắn vào tho.sao_luu. Hai hàm riêng (không một)
 * để migration sao lưu không phải định nghĩa lại suc_khoe_he_thong() — xem đầu 0058.
 */
export async function docSucKhoeVaSaoLuu(client: Pick<SupabaseClient, 'rpc'>): Promise<KetQuaDoc> {
  const [kq, saoLuu] = await Promise.all([docSucKhoe(client), docSaoLuu(client)]);
  return kq.ok ? { ok: true, tho: { ...kq.tho, sao_luu: saoLuu } } : kq;
}

// -----------------------------------------------------------------------------
// ĐÁNH GIÁ
// -----------------------------------------------------------------------------
export type MauDen = 'xanh' | 'vang' | 'do' | 'tat';
export type MaDen = 'dat_ban' | 'ipos' | 'so_kho' | 'tin_zalo' | 'tuyen_dung' | 'zalo' | 'messenger' | 'dich' | 'sao_luu';

export interface Den {
  ma: MaDen;
  ten: string;
  mau: MauDen;
  /** Một câu: vì sao màu này, và làm gì. */
  cau: string;
  /** Màn xử lý; null khi không có màn nào (việc của người quản trị kỹ thuật). */
  di: string | null;
}

export interface KhoiDen {
  /** 'thuong_hieu' hoặc id chi nhánh. */
  ma: string;
  ten: string;
  den: Den[];
}

export interface SucKhoe {
  khoi: KhoiDen[];
  soDo: number;
  soVang: number;
  /** Giờ VN "HH:MM" của số liệu. */
  gio: string;
}

type Cau = HaiThuTieng<string>;
interface VanDe { muc: 'do' | 'vang'; cau: Cau }

const TEN: Record<MaDen, Cau> = {
  dat_ban:    { vi: 'Đặt bàn', en: 'Bookings' },
  ipos:       { vi: 'iPOS', en: 'iPOS' },
  so_kho:     { vi: 'Sổ kho', en: 'Stock ledger' },
  tin_zalo:   { vi: 'Tin Zalo', en: 'Zalo messages' },
  tuyen_dung: { vi: 'Hồ sơ ứng tuyển', en: 'Job applications' },
  zalo:       { vi: 'Bộ gửi tin Zalo', en: 'Zalo sender' },
  messenger:  { vi: 'Bot Messenger', en: 'Messenger bot' },
  dich:       { vi: 'Máy dịch', en: 'Machine translation' },
  sao_luu:    { vi: 'Sao lưu dữ liệu', en: 'Data backup' },
};

export const TEN_THUONG_HIEU: Cau = { vi: 'Toàn thương hiệu', en: 'Whole brand' };

const so = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const ms = (v: unknown): number | null => {
  if (typeof v !== 'string') return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
};
const s = (n: number) => (n === 1 ? '' : 's');

/** "45 phút", "3 giờ", "2 ngày" — một khoảng thời gian, làm tròn cho dễ đọc. */
export function khoangThoiGian(phut: number): Cau {
  const p = Math.max(1, Math.round(phut));
  if (p < 60) return { vi: `${p} phút`, en: `${p} min` };
  const g = Math.round(p / 60);
  if (g < 48) return { vi: `${g} giờ`, en: `${g} hour${s(g)}` };
  const d = Math.round(g / 24);
  return { vi: `${d} ngày`, en: `${d} days` };
}

/** "45 phút trước"; dưới một phút → "vừa xong". Mốc ở tương lai (lệch đồng hồ) cũng là "vừa xong". */
export function tuTruoc(bayGio: number, moc: number): Cau {
  const phut = (bayGio - moc) / 60000;
  if (phut < 1) return { vi: 'vừa xong', en: 'just now' };
  const k = khoangThoiGian(phut);
  return { vi: `${k.vi} trước`, en: `${k.en} ago` };
}

/** Màu = vấn đề nặng nhất; câu = các vấn đề, đỏ trước. Không có vấn đề → xanh với câu khiTot. */
function denTu(ma: MaDen, vanDe: VanDe[], khiTot: Cau, di: string | null, nn: NgonNguNB): Den {
  const doTruoc = [...vanDe.filter(v => v.muc === 'do'), ...vanDe.filter(v => v.muc === 'vang')];
  return {
    ma, ten: TEN[ma][nn], di,
    mau: doTruoc.length === 0 ? 'xanh' : doTruoc[0].muc,
    cau: doTruoc.length === 0 ? khiTot[nn] : doTruoc.map(v => v.cau[nn]).join(' · '),
  };
}

function denTat(ma: MaDen, cau: Cau, di: string | null, nn: NgonNguNB): Den {
  return { ma, ten: TEN[ma][nn], mau: 'tat', cau: cau[nn], di };
}

// --- Đặt bàn -----------------------------------------------------------------
function denDatBan(d: Partial<ChiNhanhTho['dat_ban']> | undefined, nn: NgonNguNB): Den {
  const formMo = d?.form_mo === true, soBan = so(d?.so_ban), cho = so(d?.cho);
  const qua2 = so(d?.cho_qua_2_gio), qua24 = so(d?.cho_qua_24_gio), quaHen = so(d?.qua_gio_hen);
  const di = '/noi-bo/dat-ban';
  if (!formMo && cho === 0) return denTat('dat_ban', { vi: 'Form đặt bàn đang đóng.', en: 'The booking form is closed.' }, di, nn);
  const v: VanDe[] = [];
  if (formMo && soBan === 0) v.push({ muc: 'do', cau: {
    vi: 'Form đặt bàn đang mở nhưng chi nhánh chưa có bàn nào — mọi yêu cầu đều bị báo hết bàn. Thêm bàn ở màn Cài đặt.',
    en: 'The booking form is open but this branch has no tables — every request is told it is fully booked. Add tables on the Settings screen.' } });
  if (quaHen > 0) v.push({ muc: 'do', cau: {
    vi: `${quaHen} yêu cầu đã qua giờ hẹn mà chưa ai xác nhận`,
    en: `${quaHen} request${s(quaHen)} past the booked time with nobody confirming` } });
  if (qua24 > 0) v.push({ muc: 'do', cau: {
    vi: `${qua24} yêu cầu chờ quá 24 giờ chưa ai gọi lại`,
    en: `${qua24} request${s(qua24)} waiting over 24 hours for a call back` } });
  if (qua2 > 0) v.push({ muc: 'vang', cau: {
    vi: `${qua2} yêu cầu chờ quá 2 giờ`,
    en: `${qua2} request${s(qua2)} waiting over 2 hours` } });
  const khiTot: Cau = cho > 0
    ? { vi: `${cho} yêu cầu mới đang chờ gọi lại (chưa quá 2 giờ).`, en: `${cho} new request${s(cho)} waiting for a call back (under 2 hours).` }
    : { vi: 'Không có yêu cầu nào đang chờ.', en: 'No request is waiting.' };
  return denTu('dat_ban', v, khiTot, formMo && soBan === 0 && v.length === 1 ? '/noi-bo/cai-dat' : di, nn);
}

// --- Hồ sơ ứng tuyển ---------------------------------------------------------
function denTuyenDung(d: Partial<ChiNhanhTho['tuyen_dung']> | undefined, nn: NgonNguNB): Den {
  const moi = so(d?.moi), qua2 = so(d?.moi_qua_2_ngay), qua7 = so(d?.moi_qua_7_ngay);
  const v: VanDe[] = [];
  if (qua7 > 0) v.push({ muc: 'do', cau: {
    vi: `${qua7} hồ sơ chưa ai mở quá 7 ngày — ứng viên có thể đã nhận việc chỗ khác`,
    en: `${qua7} application${s(qua7)} unopened for over 7 days — the candidate may have taken another job` } });
  if (qua2 > 0) v.push({ muc: 'vang', cau: {
    vi: `${qua2} hồ sơ chưa ai mở quá 2 ngày`,
    en: `${qua2} application${s(qua2)} unopened for over 2 days` } });
  const khiTot: Cau = moi > 0
    ? { vi: `${moi} hồ sơ mới (chưa quá 2 ngày).`, en: `${moi} new application${s(moi)} (under 2 days).` }
    : { vi: 'Không có hồ sơ nào nằm chờ.', en: 'No application is waiting.' };
  return denTu('tuyen_dung', v, khiTot, '/noi-bo/tuyen-dung', nn);
}

// --- iPOS ----------------------------------------------------------------------
function denIpos(d: Partial<IposTho> | undefined, maCn: string, bayGio: number, nn: NgonNguNB): Den {
  const cn = `?cn=${encodeURIComponent(maCn)}`;
  const diCaiDat = `/noi-bo/kho/cai-dat/ipos${cn}`;
  if (d?.co_cau_hinh !== true || d?.bat !== true) {
    return denTat('ipos', { vi: 'Chưa bật đồng bộ iPOS.', en: 'iPOS sync is not turned on.' }, diCaiDat, nn);
  }
  if (d.cau_hinh_du !== true) {
    return denTu('ipos', [{ muc: 'vang', cau: {
      vi: 'Đã bật nhưng chưa cấu hình đủ (mã cửa hàng iPOS, quầy bán) — kho chưa nhận được hóa đơn.',
      en: 'Turned on but not fully configured (iPOS store codes, selling counter) — no invoice reaches the stock yet.' } }],
      { vi: '', en: '' }, diCaiDat, nn);
  }
  // Nhịp tim: lượt cron gần nhất, hoặc lúc vừa bật (cron chưa kịp chạy lượt đầu).
  const cron = ms(d.cron_cuoi), batLuc = ms(d.bat_luc);
  const moc = Math.max(cron ?? -Infinity, batLuc ?? -Infinity);
  if (!Number.isFinite(moc) || bayGio - moc > PHUT_NHIP_TIM * 60000) {
    return denTu('ipos', [{ muc: 'do', cau: cron === null
      ? { vi: 'Việc tự đồng bộ 5 phút một lần chưa chạy lượt nào — báo người quản trị kỹ thuật kiểm tra Cron và bí mật iPOS của Worker.',
          en: 'The 5-minute automatic sync has never run — ask the technical admin to check the Cron trigger and the Worker iPOS secrets.' }
      : { vi: `Việc tự đồng bộ 5 phút một lần đã dừng — lượt gần nhất ${tuTruoc(bayGio, cron).vi}. Báo người quản trị kỹ thuật kiểm tra Cron và bí mật iPOS của Worker.`,
          en: `The 5-minute automatic sync has stopped — last run ${tuTruoc(bayGio, cron).en}. Ask the technical admin to check the Cron trigger and the Worker iPOS secrets.` } }],
      { vi: '', en: '' }, diCaiDat, nn);
  }
  if (d.den === 'do') {
    const loiTu = ms(d.loi_tu_luc);
    return denTu('ipos', [{ muc: 'do', cau: d.mat_ket_noi && loiTu !== null
      ? { vi: `Lần cập nhật gần nhất bị lỗi (lỗi từ ${tuTruoc(bayGio, loiTu).vi}) — mở Kết nối iPOS, bấm "Cập nhật ngay".`,
          en: `The latest update failed (failing since ${tuTruoc(bayGio, loiTu).en}) — open iPOS connection and press "Update now".` }
      : { vi: `Hơn ${so(d.gio_mat_ket_noi)} giờ trong giờ mở cửa không nhận được hóa đơn nào từ iPOS — kiểm tra máy iPOS và địa chỉ nhận hóa đơn.`,
          en: `No iPOS invoice for over ${so(d.gio_mat_ket_noi)} opening hours — check the iPOS machine and the invoice address.` } }],
      { vi: '', en: '' }, diCaiDat, nn);
  }
  const hd = ms(d.nhan_hd_luc);
  const khiTot: Cau = hd === null
    ? { vi: 'Kho đang tự trừ theo iPOS.', en: 'Stock is deducted from iPOS automatically.' }
    : { vi: `Kho đang tự trừ theo iPOS — hóa đơn gần nhất ${tuTruoc(bayGio, hd).vi}.`,
        en: `Stock is deducted from iPOS automatically — last invoice ${tuTruoc(bayGio, hd).en}.` };
  if (d.den === 'vang') {
    if (d.dang_tru_kho !== true) {
      return denTu('ipos', [{ muc: 'vang', cau: {
        vi: 'Đang nhận hóa đơn iPOS nhưng CHƯA trừ kho — còn dùng đếm quầy làm số bán.',
        en: 'iPOS invoices arrive but stock is NOT deducted yet — counter counts are still used as sales.' } }],
        khiTot, diCaiDat, nn);
    }
    const n = so(d.cho_xu_ly) + so(d.dong_loi);
    return denTu('ipos', [{ muc: 'vang', cau: {
      vi: `${n} dòng bán chưa trừ được kho — mở Bán hàng iPOS để xử lý.`,
      en: `${n} sales line${s(n)} could not be deducted — open iPOS sales to resolve.` } }],
      khiTot, `/noi-bo/kho/ban-ipos${cn}`, nn);
  }
  // Giá trị đèn lạ (database đổi mà web chưa theo kịp): không rõ thì không được xanh.
  if (d.den !== 'xanh') {
    return denTu('ipos', [{ muc: 'vang', cau: {
      vi: 'Không rõ trạng thái iPOS — mở Kết nối iPOS để xem.',
      en: 'Unknown iPOS status — open iPOS connection to check.' } }], khiTot, diCaiDat, nn);
  }
  return denTu('ipos', [], khiTot, diCaiDat, nn);
}

// --- Sổ kho --------------------------------------------------------------------
function denSoKho(d: Partial<ChiNhanhTho['so_kho']> | undefined, maCn: string, nn: NgonNguNB): Den {
  const di = `/noi-bo/kho?cn=${encodeURIComponent(maCn)}`;
  if (d?.co_kho !== true) return denTat('so_kho', { vi: 'Chưa dùng kho.', en: 'Stock is not in use.' }, di, nn);
  const lech = so(d.lech);
  return denTu('so_kho', lech > 0 ? [{ muc: 'do', cau: {
    vi: `${lech} lô có tồn lệch sổ kho — dữ liệu kho đã sai. Báo ngay người quản trị kỹ thuật, đừng sửa tay.`,
    en: `${lech} lot${s(lech)} with stock that does not match the ledger — the stock data is wrong. Tell the technical admin now; do not fix it by hand.` } }] : [],
    { vi: 'Tồn kho khớp sổ kho.', en: 'Stock matches the ledger.' }, di, nn);
}

// --- Tin Zalo của chi nhánh ------------------------------------------------------
function denTinZalo(d: Partial<ChiNhanhTho['tin_zalo']> | undefined, zaloBat: boolean, nn: NgonNguNB): Den {
  const di = '/noi-bo/zalo';
  if (!zaloBat) return denTat('tin_zalo', { vi: 'Gửi tin Zalo chưa bật.', en: 'Zalo messaging is not turned on.' }, di, nn);
  const ket = so(d?.cho_qua_han), hong = so(d?.that_bai_24h);
  const v: VanDe[] = [];
  if (ket > 0) v.push({ muc: 'do', cau: {
    vi: `${ket} tin giao dịch đến hạn quá ${PHUT_TIN_KET} phút mà chưa gửi`,
    en: `${ket} transactional message${s(ket)} due over ${PHUT_TIN_KET} min ago and still not sent` } });
  if (hong > 0) v.push({ muc: 'vang', cau: {
    vi: `${hong} tin đến hạn trong 24 giờ qua đã hỏng hoặc bị Zalo từ chối`,
    en: `${hong} message${s(hong)} due in the last 24 hours failed or ${hong === 1 ? 'was' : 'were'} rejected by Zalo` } });
  return denTu('tin_zalo', v, { vi: 'Tin gửi bình thường.', en: 'Messages go out normally.' }, di, nn);
}

// --- Bộ gửi Zalo (cả thương hiệu) --------------------------------------------------
function denZalo(z: Partial<SucKhoeTho['zalo']>, laChu: boolean, bayGio: number, nn: NgonNguNB): Den {
  const di = laChu ? '/noi-bo/zalo/cai-dat' : '/noi-bo/zalo';
  if (z.dang_bat !== true) return denTat('zalo', { vi: 'Chưa bật.', en: 'Not turned on.' }, di, nn);
  // Lượt chạy TỪ KHI BẬT: lượt cũ trước một lần tắt / bật lại không nói gì về bộ gửi bây giờ.
  const batLuc = ms(z.bat_luc), chayCu = ms(z.lan_chay_cuoi);
  const chay = chayCu !== null && (batLuc === null || chayCu >= batLuc) ? chayCu : null;
  const moc = Math.max(chay ?? -Infinity, batLuc ?? -Infinity);
  const v: VanDe[] = [];
  if (!Number.isFinite(moc) || bayGio - moc > PHUT_NHIP_TIM * 60000) v.push({ muc: 'do', cau: chay === null
    ? { vi: 'Bộ gửi chưa chạy lượt nào kể từ khi bật — báo người quản trị kỹ thuật kiểm tra Cron và bí mật Zalo của Worker',
        en: 'The sender has not run once since it was turned on — ask the technical admin to check the Cron trigger and the Worker Zalo secrets' }
    : { vi: `Bộ gửi đã dừng (lượt gần nhất ${tuTruoc(bayGio, chay).vi}) — báo người quản trị kỹ thuật kiểm tra Cron và bí mật Zalo của Worker`,
        en: `The sender has stopped (last run ${tuTruoc(bayGio, chay).en}) — ask the technical admin to check the Cron trigger and the Worker Zalo secrets` } });
  // Cả hai cùng hiện: lỗi của lượt cuối thường là lý do bộ gửi dừng (token hỏng, thiếu bí mật).
  if (z.co_loi === true) v.push({ muc: 'do', cau: {
    vi: 'Lượt gửi gần nhất bị lỗi — mở màn Zalo để xem lỗi',
    en: 'The latest sending run failed — open the Zalo screen to see the error' } });
  if (z.che_do === 'thu') v.push({ muc: 'vang', cau: {
    vi: 'Đang ở chế độ thử: chỉ tài khoản quản trị của Zalo OA nhận được tin, khách thật chưa nhận gì',
    en: 'Test mode: only admin accounts of the Zalo OA receive messages, real customers receive nothing' } });
  return denTu('zalo', v, chay === null
    ? { vi: 'Bộ gửi vừa bật, đang chờ lượt đầu.', en: 'Just turned on, waiting for the first run.' }
    : { vi: `Bộ gửi chạy bình thường — lượt gần nhất ${tuTruoc(bayGio, chay).vi}.`,
        en: `The sender runs normally — last run ${tuTruoc(bayGio, chay).en}.` }, di, nn);
}

// --- Bot Messenger (cả thương hiệu) ------------------------------------------------
function denMessenger(m: Partial<SucKhoeTho['messenger']>, bayGio: number, nn: NgonNguNB): Den {
  const di = '/noi-bo/messenger';
  if (m.dang_bat !== true) return denTat('messenger', { vi: 'Chưa bật.', en: 'Not turned on.' }, di, nn);
  const loiLuc = ms(m.loi_cuoi_luc), nhan = ms(m.lan_nhan_cuoi), batLuc = ms(m.bat_luc), loi7 = so(m.loi_7_ngay);
  const v: VanDe[] = [];
  // Lỗi mới VÀ không có tin nào đến sau lỗi đó: tin gần nhất của khách chưa được trả lời.
  // (Tin đến sau mà trả lời được thì bot đã chạy lại — chỉ còn là "có lỗi trong tuần".)
  if (loiLuc !== null && bayGio - loiLuc <= PHUT_LOI_MOI * 60000 && (nhan === null || loiLuc >= nhan)) {
    v.push({ muc: 'do', cau: {
      vi: `Tin gần nhất của khách bị lỗi (${tuTruoc(bayGio, loiLuc).vi}), bot có thể đang không trả lời được — mở màn Messenger để xem lỗi`,
      en: `The latest customer message failed (${tuTruoc(bayGio, loiLuc).en}), the bot may not be replying — open the Messenger screen to see the error` } });
  } else if (loi7 > 0) {
    v.push({ muc: 'vang', cau: {
      vi: `${loi7} lỗi trong 7 ngày qua`,
      en: `${loi7} error${s(loi7)} in the last 7 days` } });
  }
  // Im lặng tính từ tin gần nhất, hoặc từ lúc bật nếu từ khi bật chưa có tin nào. KHÔNG tính từ
  // lần lưu cấu hình: sửa lời chào không làm webhook sống lại.
  const nhanTuKhiBat = nhan !== null && (batLuc === null || nhan >= batLuc) ? nhan : null;
  const moc = Math.max(nhanTuKhiBat ?? -Infinity, batLuc ?? -Infinity);
  if (Number.isFinite(moc) && bayGio - moc > GIO_KHONG_CO_TIN * 3600000) v.push({ muc: 'vang', cau: nhanTuKhiBat === null
    ? { vi: 'Chưa nhận được tin nào từ Facebook kể từ khi bật — nhắn thử vào Trang để kiểm tra webhook',
        en: 'No message from Facebook since it was turned on — send a test message to the Page to check the webhook' }
    : { vi: `Không nhận được tin nào từ Facebook ${khoangThoiGian((bayGio - nhanTuKhiBat) / 60000).vi} nay — nhắn thử vào Trang để kiểm tra webhook`,
        en: `No message from Facebook for ${khoangThoiGian((bayGio - nhanTuKhiBat) / 60000).en} — send a test message to the Page to check the webhook` } });
  return denTu('messenger', v, nhan === null
    ? { vi: 'Bot đang bật, chưa có tin nào.', en: 'The bot is on, no message yet.' }
    : { vi: `Bot trả lời bình thường — tin gần nhất ${tuTruoc(bayGio, nhan).vi}.`,
        en: `The bot replies normally — last message ${tuTruoc(bayGio, nhan).en}.` }, di, nn);
}

// --- Máy dịch (cả thương hiệu) ------------------------------------------------------
function denDich(d: Partial<SucKhoeTho['dich']>, nn: NgonNguNB): Den {
  const loi = so(d.loi), cho = so(d.cho);
  return denTu('dich', loi > 0 ? [{ muc: 'vang', cau: {
    vi: `${loi} ô dịch bị lỗi quá 15 phút — máy dịch có thể đang hỏng. Kéo dài quá một ngày thì báo người quản trị kỹ thuật (khóa Gemini).`,
    en: `${loi} field${s(loi)} failed to translate for over 15 min — the translator may be down. If it lasts over a day, tell the technical admin (Gemini key).` } }] : [],
    cho > 0
      ? { vi: `Máy dịch chạy bình thường — ${cho} ô đang chờ dịch.`, en: `The translator works — ${cho} field${s(cho)} waiting.` }
      : { vi: 'Máy dịch chạy bình thường.', en: 'The translator works.' },
    null, nn);
}

// --- Sao lưu dữ liệu (cả thương hiệu) ----------------------------------------------
/** "85,3 MB" / "85.3 MB"; "1.234,5 MB" / "1,234.5 MB". */
function moTaMb(byte: number): Cau {
  const mb = byte / 1048576;
  const kieu = { minimumFractionDigits: 1, maximumFractionDigits: 1 };
  return { vi: `${mb.toLocaleString('vi-VN', kieu)} MB`, en: `${mb.toLocaleString('en-US', kieu)} MB` };
}

const XEM_SAO_LUU: Cau = {
  vi: 'Báo người quản trị kỹ thuật xem GitHub → Actions → "Sao lưu database" (README gốc, mục Sao lưu và khôi phục).',
  en: 'Ask the technical admin to check the backup workflow in GitHub Actions (root README, backup and restore section).',
};

/**
 * "Dùng được" = sao lưu xong VÀ khôi phục thử đạt: bản sao không khôi phục được thì coi như không có.
 * Không bao giờ xám — sao lưu không phải thứ "chưa bật": chưa có bản dùng được nào là dữ liệu đang không có
 * bản sao, và đó là đỏ. Database chưa chạy 0058 (undefined) / không đọc được (null) → vàng, nói rõ.
 */
function denSaoLuu(d: Partial<SaoLuuTho> | null | undefined, bayGio: number, nn: NgonNguNB): Den {
  const vang = (cau: Cau) => denTu('sao_luu', [{ muc: 'vang', cau }], { vi: '', en: '' }, null, nn);
  const do_ = (cau: Cau) => denTu('sao_luu', [{ muc: 'do', cau }], { vi: '', en: '' }, null, nn);
  if (d === undefined) {
    return vang({ vi: 'Chưa có số liệu sao lưu — database chưa chạy migration 0058. Báo người quản trị kỹ thuật.',
                  en: 'No backup data — the database has not run migration 0058 yet. Tell the technical admin.' });
  }
  if (d === null) {
    return vang({ vi: 'Không đọc được số liệu sao lưu lúc này — tải lại trang sau ít phút. Điều này KHÔNG có nghĩa là sao lưu đang ổn.',
                  en: 'Backup data could not be read right now — reload the page in a few minutes. This does NOT mean backups are fine.' });
  }
  const dung = ms(d.dung_duoc_cuoi), cuoi = ms(d.lan_cuoi);
  if (dung === null) {
    if (cuoi === null) {
      return do_({ vi: 'Chưa có bản sao lưu nào — dữ liệu đang không có bản sao. Người quản trị kỹ thuật cần thêm hai bí mật SAO_LUU_DB_URL và SAO_LUU_MAT_KHAU cho GitHub (README gốc, mục Sao lưu và khôi phục).',
                   en: 'No backup exists yet — the data has no copy. The technical admin needs to add the two GitHub secrets SAO_LUU_DB_URL and SAO_LUU_MAT_KHAU (root README, backup and restore section).' });
    }
    return do_(d.lan_cuoi_ok === false
      ? { vi: `Chưa có bản sao lưu nào dùng được — lượt gần nhất (${tuTruoc(bayGio, cuoi).vi}) bị lỗi. ${XEM_SAO_LUU.vi}`,
          en: `No usable backup yet — the latest run (${tuTruoc(bayGio, cuoi).en}) failed. ${XEM_SAO_LUU.en}` }
      : { vi: `Chưa có bản sao lưu nào được xác nhận khôi phục được (bản gần nhất: ${tuTruoc(bayGio, cuoi).vi}). ${XEM_SAO_LUU.vi}`,
          en: `No backup has been confirmed restorable yet (latest copy: ${tuTruoc(bayGio, cuoi).en}). ${XEM_SAO_LUU.en}` });
  }
  if (bayGio - dung > GIO_SAO_LUU * 3600000) {
    return do_({
      vi: `Bản sao lưu dùng được gần nhất đã ${tuTruoc(bayGio, dung).vi} — sao lưu hằng đêm đang không chạy hoặc bản sao không khôi phục được. ${XEM_SAO_LUU.vi}`,
      en: `The latest usable backup is from ${tuTruoc(bayGio, dung).en} — the nightly backup is not running or its copies cannot be restored. ${XEM_SAO_LUU.en}` });
  }
  const v: VanDe[] = [];
  if (cuoi !== null && cuoi > dung) {
    v.push({ muc: 'vang', cau: d.lan_cuoi_ok === false
      ? { vi: `Lượt sao lưu gần nhất (${tuTruoc(bayGio, cuoi).vi}) bị lỗi — bản dùng được gần nhất: ${tuTruoc(bayGio, dung).vi}`,
          en: `The latest backup run (${tuTruoc(bayGio, cuoi).en}) failed — latest usable backup: ${tuTruoc(bayGio, dung).en}` }
      : { vi: `Bản sao lưu gần nhất (${tuTruoc(bayGio, cuoi).vi}) không khôi phục thử được — bản dùng được gần nhất: ${tuTruoc(bayGio, dung).vi}`,
          en: `The latest backup (${tuTruoc(bayGio, cuoi).en}) failed its test restore — latest usable backup: ${tuTruoc(bayGio, dung).en}` } });
  }
  const co = so(d.kich_thuoc) > 0 ? moTaMb(so(d.kich_thuoc)) : null;
  return denTu('sao_luu', v, {
    vi: `Sao lưu hằng đêm bình thường — bản gần nhất ${tuTruoc(bayGio, dung).vi}${co ? ` (${co.vi})` : ''}, đã khôi phục thử đủ dữ liệu.`,
    en: `Nightly backup works — latest copy ${tuTruoc(bayGio, dung).en}${co ? ` (${co.en})` : ''}, test restore complete.` }, null, nn);
}

// -----------------------------------------------------------------------------
// CẢ BẢNG — thứ component vẽ
// -----------------------------------------------------------------------------
export type BangSucKhoe =
  | { loai: 'so_lieu'; mau: MauDen; tom: string; sk: SucKhoe }
  /** Không có số liệu: không bao giờ mang màu xanh hay câu "đang chạy tốt". */
  | { loai: 'chua_co_ham' | 'khong_doc'; mau: 'vang' | 'do'; tom: string; sk: null };

const CAU_BANG = {
  tot:       { vi: 'Mọi thứ đang chạy tốt', en: 'Everything is running well' },
  chuaCoHam: { vi: 'Bảng này cần migration 0055 (suc_khoe_he_thong) — database chưa chạy nó. Báo người quản trị kỹ thuật.',
               en: 'This panel needs migration 0055 (suc_khoe_he_thong) — the database has not run it yet. Tell the technical admin.' },
  khongDoc:  { vi: 'Không đọc được sức khỏe hệ thống lúc này — tải lại trang sau ít phút. Điều này KHÔNG có nghĩa là mọi thứ đang ổn.',
               en: 'System health could not be read right now — reload the page in a few minutes. This does NOT mean everything is fine.' },
} as const;

/** "2 mục cần xử lý ngay · 1 mục cần xem hôm nay" / "Mọi thứ đang chạy tốt". */
export function cauTomTat(sk: Pick<SucKhoe, 'soDo' | 'soVang'>, nn: NgonNguNB): string {
  const phan: Cau[] = [];
  if (sk.soDo > 0) phan.push({ vi: `${sk.soDo} mục cần xử lý ngay`, en: `${sk.soDo} item${s(sk.soDo)} to act on now` });
  if (sk.soVang > 0) phan.push({ vi: `${sk.soVang} mục cần xem hôm nay`, en: `${sk.soVang} item${s(sk.soVang)} to check today` });
  return phan.length === 0 ? CAU_BANG.tot[nn] : phan.map(c => c[nn]).join(' · ');
}

/** Kết quả đọc → thứ component vẽ. Đây là chỗ DUY NHẤT chọn câu tóm tắt. */
export function bangSucKhoe(kq: KetQuaDoc, nn: NgonNguNB, laChu = false): BangSucKhoe {
  if (!kq.ok) {
    return kq.chuaCoHam
      ? { loai: 'chua_co_ham', mau: 'vang', tom: CAU_BANG.chuaCoHam[nn], sk: null }
      : { loai: 'khong_doc', mau: 'do', tom: CAU_BANG.khongDoc[nn], sk: null };
  }
  const sk = danhGiaSucKhoe(kq.tho, nn, laChu);
  return {
    loai: 'so_lieu', sk, tom: cauTomTat(sk, nn),
    mau: sk.soDo > 0 ? 'do' : sk.soVang > 0 ? 'vang' : 'xanh',
  };
}

/**
 * Số liệu thô → các khối đèn. Khối đầu là "Toàn thương hiệu" (sao lưu, Zalo, Messenger, máy dịch — cấu
 * hình chung), sau đó mỗi chi nhánh một khối theo thứ tự database trả (theo tên).
 * laChu: chủ sở hữu được mở màn cài đặt Zalo; quản lý chỉ mở màn Zalo chung.
 */
export function danhGiaSucKhoe(tho: SucKhoeTho, nn: NgonNguNB, laChu = false): SucKhoe {
  const bayGio = ms(tho.luc) ?? Date.now();
  const zaloBat = tho.zalo?.dang_bat === true;
  const khoi: KhoiDen[] = [
    {
      ma: 'thuong_hieu', ten: TEN_THUONG_HIEU[nn],
      den: [
        denSaoLuu(tho.sao_luu, bayGio, nn),
        denZalo(tho.zalo ?? {}, laChu, bayGio, nn),
        denMessenger(tho.messenger ?? {}, bayGio, nn),
        denDich(tho.dich ?? {}, nn),
      ],
    },
    ...tho.chi_nhanh.map(c => ({
      ma: c.id, ten: c.ten ?? '',
      den: [
        denDatBan(c.dat_ban, nn),
        denIpos(c.ipos, c.ma ?? '', bayGio, nn),
        denSoKho(c.so_kho, c.ma ?? '', nn),
        denTinZalo(c.tin_zalo, zaloBat, nn),
        denTuyenDung(c.tuyen_dung, nn),
      ],
    })),
  ];
  const tatCa = khoi.flatMap(k => k.den);
  return {
    khoi,
    soDo: tatCa.filter(d => d.mau === 'do').length,
    soVang: tatCa.filter(d => d.mau === 'vang').length,
    gio: gioVnTuMs(bayGio).slice(11, 16),
  };
}
