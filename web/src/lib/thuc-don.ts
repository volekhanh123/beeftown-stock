/**
 * THỰC ĐƠN CÔNG KHAI — đọc qua đúng một cửa: thuc_don_cong_khai() (0011, 0036)
 * ===========================================================================
 * Database quyết định món nào được hiện: công tắc hien_thuc_don, món đã công bố
 * (da_cong_bo — mô tả đã duyệt, món sống có câu cảnh báo), đồ uống có cồn sau
 * công tắc hien_do_uong_co_con. Trang chỉ trình bày, và thêm vài lớp chặn:
 *
 *  · KHÔNG BAO GIỜ hiện giá chưa duyệt: database trả gia = null khi chưa duyệt;
 *    ở đây còn bỏ giá của nhóm "xem giá tại quầy" (bò tại quầy cân theo khay).
 *  · Món sống mà thiếu câu cảnh báo thì không hiện — database đã chặn ở CHECK,
 *    đây là lớp thứ hai.
 *  · Không ném lỗi: chưa nối database, database lỗi, mạng ném lỗi đều cho thực đơn
 *    rỗng, và trang thực đơn vẫn đủ phần "Bò tại quầy" (giải thích cố định).
 *    Đã nối database mà lỗi thì ghi ĐÚNG MỘT dòng log "[thuc-don]".
 *
 * Quy tắc chữ cấm (chuoi-cam.js) chặn mọi số tiền trên trang công khai, vì CHƯA
 * món nào có giá duyệt. PR nào duyệt giá đầu tiên phải sửa luôn quy tắc đó.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { taoClient, type NgonNgu } from './noi-dung.ts';
import type { BaThuTieng } from './chu.ts';

export type LoaiNhom = 'khai_vi' | 'mon_chinh' | 'do_uong' | 'goi_them' | 'thit_bo';

/** Một dòng thuc_don_cong_khai() trả về (0036). */
export interface DongThucDon {
  nhom_ma: string;
  nhom_ten: string | null;
  nhom_loai: LoaiNhom;
  xem_gia_tai_quay: boolean | null;
  mon_ma: string;
  ten: string | null;
  mo_ta: string | null;
  gia: number | string | null;
  muc_cay: number | null;
  co_con: boolean | null;
  la_mon_song: boolean | null;
  canh_bao: string | null;
  khau_phan: string | null;
  phien_ban: string | null;
  cap_nhat_ngay: string | null;
}

export interface Mon {
  ma: string;
  ten: string;
  moTa: string | null;
  /** null = không hiện vùng giá. */
  gia: number | null;
  coCon: boolean;
  laMonSong: boolean;
  canhBao: string | null;
  khauPhan: string | null;
}

export interface NhomMon {
  ma: string;
  ten: string;
  loai: LoaiNhom;
  mon: Mon[];
}

export interface ThucDon {
  /** Nhóm "Bò tại quầy" và phần gọi thêm cho bữa nướng (set sốt). */
  boTaiQuay: NhomMon[];
  monAn: NhomMon[];
  doUong: NhomMon[];
  phienBan: string | null;
  capNhatNgay: string | null;
  /** Có ít nhất một món được hiện. */
  coMon: boolean;
  coDoUongCoCon: boolean;
}

export const THUC_DON_RONG: ThucDon = Object.freeze({
  boTaiQuay: [], monAn: [], doUong: [], phienBan: null, capNhatNgay: null, coMon: false, coDoUongCoCon: false,
}) as ThucDon;

const VE_PHAN: Record<LoaiNhom, keyof Pick<ThucDon, 'boTaiQuay' | 'monAn' | 'doUong'>> = {
  thit_bo: 'boTaiQuay',
  goi_them: 'boTaiQuay',
  khai_vi: 'monAn',
  mon_chinh: 'monAn',
  do_uong: 'doUong',
};

const chuoi = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** Gom các dòng của database thành ba phần của trang. Thứ tự giữ như database trả. */
export function nhomThucDon(dong: readonly DongThucDon[] | null | undefined): ThucDon {
  if (!Array.isArray(dong) || dong.length === 0) return THUC_DON_RONG;
  const phan: Pick<ThucDon, 'boTaiQuay' | 'monAn' | 'doUong'> = { boTaiQuay: [], monAn: [], doUong: [] };
  const theoMa = new Map<string, NhomMon>();
  let phienBan: string | null = null;
  let capNhatNgay: string | null = null;
  let coMon = false;
  let coDoUongCoCon = false;

  for (const d of dong) {
    const ten = chuoi(d?.ten);
    const loai = d?.nhom_loai as LoaiNhom;
    if (!ten || !Object.hasOwn(VE_PHAN, loai)) continue;
    const laMonSong = d.la_mon_song === true;
    const canhBao = chuoi(d.canh_bao);
    if (laMonSong && !canhBao) continue;           // lớp chặn thứ hai, sau CHECK của database

    const soGia = d.gia === null || d.gia === undefined ? NaN : Number(d.gia);
    const gia = d.xem_gia_tai_quay !== true && Number.isFinite(soGia) && soGia >= 0 ? soGia : null;

    let nhom = theoMa.get(d.nhom_ma);
    if (!nhom) {
      nhom = { ma: d.nhom_ma, ten: chuoi(d.nhom_ten) ?? d.nhom_ma, loai, mon: [] };
      theoMa.set(d.nhom_ma, nhom);
      phan[VE_PHAN[loai]].push(nhom);
    }
    nhom.mon.push({
      ma: d.mon_ma, ten, moTa: chuoi(d.mo_ta), gia,
      coCon: d.co_con === true, laMonSong, canhBao, khauPhan: chuoi(d.khau_phan),
    });
    coMon = true;
    coDoUongCoCon ||= d.co_con === true;
    phienBan ??= chuoi(d.phien_ban);
    capNhatNgay ??= chuoi(d.cap_nhat_ngay);
  }
  return { ...phan, phienBan, capNhatNgay, coMon, coDoUongCoCon };
}

/**
 * Đọc thực đơn đã công bố. Không ném lỗi — xem đầu file.
 */
export async function docThucDon(
  ngonNgu: NgonNgu = 'vi',
  client: Pick<SupabaseClient, 'rpc'> | null = taoClient(),
): Promise<ThucDon> {
  if (!client) return THUC_DON_RONG;
  try {
    const { data, error } = await client.rpc('thuc_don_cong_khai', { p_ngon_ngu: ngonNgu });
    if (error) {
      console.error('[thuc-don] không đọc được thực đơn công khai:', error.code ?? '', error.message);
      return THUC_DON_RONG;
    }
    return nhomThucDon(data as DongThucDon[] | null);
  } catch (e) {
    console.error('[thuc-don] không gọi được database:', e instanceof Error ? e.message : String(e));
    return THUC_DON_RONG;
  }
}

/** 125000 → "125.000" — số kiểu Việt: dấu chấm ngăn nghìn. */
export function dinhDangGia(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Câu dưới tên nhóm — chép NGUYÊN VĂN câu dưới tiêu đề trang của cuốn menu bản sáng (Khánh chốt
 * 11/10/2026; tiếng Hàn do Claude dịch, sửa 13/10/2026 theo rà soát, chưa có người đọc tiếng Hàn xem).
 * crm/test/test-cong-khai-thuc-don.mjs chép tay lại từng chữ và kiểm mọi khóa là mã nhóm đang dùng của
 * migration 0096 — sửa ở đây thì sửa cả ở đó. Database không có cột này
 * nên câu nằm ở đây, khóa là MÃ NHÓM (nhom_mon.ma). Nhóm không có ở đây (Món đặc trưng, Gọi thêm, các
 * nhóm đồ uống, nhóm mới sau này) thì trang không in câu nào. Không câu nào được có giá: câu "Ba ly
 * signature, mỗi ly 69.000đ." của cuốn không dùng.
 */
export const CAU_NHOM: Readonly<Record<string, BaThuTieng>> = {
  lau: { vi: 'Chỉ buổi trưa, gọi theo combo.', en: 'Lunch only, as part of a combo.', ko: '점심에만 세트로 주문하실 수 있어요.' },
  salad: { vi: 'Ăn xen giữa các lượt bò.', en: 'Between rounds of beef.', ko: '고기 사이사이에 곁들여 드세요.' },
  'mon-them': { vi: 'Gọi cùng bò cho đủ bữa.', en: 'Order with your beef.', ko: '고기와 함께 주문해 보세요.' },
  canh: { vi: 'Ăn kèm bò nướng.', en: 'To go with your grilled beef.', ko: '구운 고기와 함께 드세요.' },
  com: { vi: 'Kết bữa bằng một món cơm.', en: 'Finish with a rice dish.', ko: '식사는 밥 요리로 마무리해 보세요.' },
  'mi-y': {
    vi: 'Mì Ý cho cả bàn, mì lạnh để kết bữa.',
    en: 'Pasta to share, cold noodles to finish.',
    ko: '파스타는 함께 나눠 드시고, 냉면으로 식사를 마무리해 보세요.',
  },
};

/** Nhãn món: chỉ hai nhãn có căn cứ trong database — không tự thêm chay, cay, dị ứng. */
export const NHAN_MON: Readonly<Record<'monSong' | 'coCon', BaThuTieng>> = {
  monSong: { vi: 'Món sống', en: 'Raw dish', ko: '날음식' },
  coCon: { vi: 'Có cồn', en: 'Contains alcohol', ko: '알코올 포함' },
};
