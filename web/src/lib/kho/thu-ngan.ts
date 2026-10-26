/**
 * KHO — THU NGÂN / FABi: MÓN CẦN CÓ TRÊN FABi, BÁN KHÔNG BIẾT TẢNG (chỉ web, không migration)
 *
 * Kho chỉ biết một khay bán ra thuộc tảng nào khi dòng hóa đơn iPOS mang MÃ Ô (FABi bán món
 * "<món> ô <số>", mã món = mã ô) — hoặc mã giảm giá (trừ theo hạn gần nhất, có chủ ý: lô cận
 * date ở quầy gần như luôn là lô lóc sớm nhất). Thu ngân chọn tay món chung, tem in bằng mã
 * chung, món ô chưa có trên FABi: tổng tồn vẫn đúng, đèn vẫn xanh, nhưng truy vết tảng hỏng
 * âm thầm. File này cho hai màn thấy chỗ hỏng:
 *
 *   · Ghép món (/noi-bo/kho/ban-ipos/ghep, vai danh_muc): "Món cần có trên FABi" — mỗi ô mã và
 *     mỗi mã giảm đang bật cần một món FABi; đối chiếu thực đơn iPOS (kho_ipos_menu, chỉ có mã
 *     món — mã vạch phải thử bằng một tem). Thực đơn rỗng / chưa đọc → KHÔNG kết luận.
 *     Tải CSV: /noi-bo/kho/ban-ipos/mon-fabi.csv (taoTepMonFabi).
 *   · Bán hàng iPOS (/noi-bo/kho/ban-ipos, vai duyet + xem_gia): "Bán không biết tảng · 7 ngày"
 *     — dòng đã trừ kho của món có ô mà không qua ô, không mã giảm; và dòng lệch ô.
 *
 * Chỉ đọc. Gọi từ /noi-bo/kho bằng client mang token của nhân sự: RLS quyết định (kho_v_ipos_dong
 * chỉ trả dòng cho vai xem_gia, đúng chi nhánh). Đọc lỗi thì NÉM lỗi — không bao giờ trả danh sách
 * rỗng như thể không có gì (trang in câu lỗi, không in số 0; CSV trả 500, không file rỗng).
 * Hàm thuần (phân loại, tóm tắt, dựng danh sách món, chọn nội dung hộp / mục cho trang: hopKhongBietTang,
 * mucMonFabi) test bằng Node: crm/test/test-kho-ipos-fabi.mjs.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, docTungTrang, duoc, LOI_KHO_CHUNG, type HaiThuTieng, type NgonNguNB } from './chung.ts';
import { congNgay, docGioVnDiaPhuong, gioVnTuMs, homNayVn } from '../gio-vn.ts';
import { docOMa, type DongOMa } from './o-ma.ts';
import { docMaGiam, giaGiam, tenGiam, type DongMaGiam } from './ma-giam.ts';
import { soChuSoMa } from './can-tma.ts';
import { docMatHang } from './danh-muc.ts';
import { docMaDaGhep } from './ban-ipos.ts';
import { taoCsv, type CotBaoCao } from './bao-cao.ts';
import { dichCau } from '../cau-noi-bo.ts';

const bo0 = (x: string | null | undefined) => String(x ?? '').trim().replace(/^0+/, '');

// =============================================================================
// BÁN KHÔNG BIẾT TẢNG — 7 NGÀY
// =============================================================================
export type LoaiKhongBietTang = 'khong_qua_o' | 'lech_o';
export const LOAI_KHONG_BIET_TANG: readonly LoaiKhongBietTang[] = ['khong_qua_o', 'lech_o'];

/** Một dòng kho_v_ipos_dong — đủ cột cho hộp này (không tiền). */
export interface DongBanTang {
  id: string;
  hoa_don_id: string;
  thoi_diem_ban: string;
  ngay_ban: string;
  ma_ipos: string | null;
  ten_ipos: string | null;
  mat_hang_id: string | null;
  ten_mat_hang: string | null;
  o_ma_id: string | null;
  so_o: number | null;
  lech_o: boolean;
  ma_giam_id: string | null;
  so_kg: number | null;
}

/**
 * Dòng đã trừ kho này thuộc loại nào (null = biết tảng, hoặc không phải món theo tảng):
 *   · lech_o — mang mã ô nhưng lô của tảng không đủ / ô chưa gắn tảng: đã trừ theo hạn gần nhất;
 *   · khong_qua_o — món có ô mã mà dòng không qua ô, không mã giảm (mã giảm trừ theo hạn gần
 *     nhất là CÓ CHỦ Ý). Không xét "lúc bán ô có đang giữ tảng không": ô không tự đóng khi tảng
 *     bán hết (0049 — lần giao sau mới đóng), nên điều kiện đó gần như luôn đúng.
 */
export function loaiKhongBietTang(d: DongBanTang, monCoO: ReadonlySet<string>): LoaiKhongBietTang | null {
  if (d.lech_o) return 'lech_o';
  if (!d.o_ma_id && !d.ma_giam_id && d.mat_hang_id && monCoO.has(d.mat_hang_id)) return 'khong_qua_o';
  return null;
}

/** Bảy ngày tính tới hôm nay (giờ Việt Nam), cũ nhất trước. */
export function bayNgayQua(homNay: string): string[] {
  return Array.from({ length: 7 }, (_, i) => congNgay(homNay, i - 6));
}

export interface DemKhongBietTang { dong: number; hoaDon: number }
export interface NhomKhongBietTang {
  loai: LoaiKhongBietTang;
  mat_hang_id: string | null;
  /** Tên món kho (dữ liệu, không dịch). */
  ten: string;
  /** Mã món FABi đã dùng — người xem tìm lại được dòng ở thẻ Đã ghi. */
  maIpos: string[];
  soDong: number;
  soHoaDon: number;
  kg: number;
  lanCuoi: string;
}
export interface TomTatKhongBietTang {
  homNay: string;
  tuNgay: string;
  /** Có món nào có ô mã không — chưa có thì kho chưa theo tảng ở quầy, hộp nói vậy thay cho số 0. */
  coMonO: boolean;
  dem: Record<'homNay' | 'bayNgay', Record<LoaiKhongBietTang, DemKhongBietTang>>;
  nhom: NhomKhongBietTang[];
}

/** Đếm dòng và hóa đơn theo loại, tách hôm nay / 7 ngày; gom theo loại + món. Dòng ngoài 7 ngày bị bỏ. */
export function tomTatKhongBietTang(
  dong: readonly DongBanTang[], monCoO: ReadonlySet<string>, homNay: string,
): TomTatKhongBietTang {
  const ngay = bayNgayQua(homNay);
  const trong = new Set(ngay);
  const tap = () => ({ khong_qua_o: { dong: 0, hd: new Set<string>() }, lech_o: { dong: 0, hd: new Set<string>() } });
  const dem = { homNay: tap(), bayNgay: tap() };
  const nhom = new Map<string, NhomKhongBietTang & { hd: Set<string>; ma: Set<string> }>();
  for (const d of dong) {
    if (!trong.has(String(d.ngay_ban).slice(0, 10))) continue;
    const loai = loaiKhongBietTang(d, monCoO);
    if (!loai) continue;
    for (const k of String(d.ngay_ban).slice(0, 10) === homNay ? ['homNay', 'bayNgay'] as const : ['bayNgay'] as const) {
      dem[k][loai].dong++;
      dem[k][loai].hd.add(d.hoa_don_id);
    }
    const khoa = `${loai}|${d.mat_hang_id ?? d.ma_ipos ?? d.id}`;
    let n = nhom.get(khoa);
    if (!n) {
      n = { loai, mat_hang_id: d.mat_hang_id, ten: d.ten_mat_hang ?? d.ten_ipos ?? d.ma_ipos ?? '', maIpos: [], soDong: 0,
            soHoaDon: 0, kg: 0, lanCuoi: d.thoi_diem_ban, hd: new Set(), ma: new Set() };
      nhom.set(khoa, n);
    }
    n.soDong++;
    n.hd.add(d.hoa_don_id);
    if (d.ma_ipos) n.ma.add(d.ma_ipos);
    n.kg += Number(d.so_kg ?? 0) || 0;
    if (Date.parse(d.thoi_diem_ban) > Date.parse(n.lanCuoi)) n.lanCuoi = d.thoi_diem_ban;
  }
  const xong = (x: ReturnType<typeof tap>) => ({
    khong_qua_o: { dong: x.khong_qua_o.dong, hoaDon: x.khong_qua_o.hd.size },
    lech_o: { dong: x.lech_o.dong, hoaDon: x.lech_o.hd.size },
  });
  return {
    homNay, tuNgay: ngay[0], coMonO: monCoO.size > 0,
    dem: { homNay: xong(dem.homNay), bayNgay: xong(dem.bayNgay) },
    nhom: [...nhom.values()]
      .map(({ hd, ma, ...n }) => ({ ...n, soHoaDon: hd.size, maIpos: [...ma].sort((a, b) => a.localeCompare(b)), kg: Math.round(n.kg * 1000) / 1000 }))
      .sort((a, b) => LOAI_KHONG_BIET_TANG.indexOf(a.loai) - LOAI_KHONG_BIET_TANG.indexOf(b.loai)
        || b.soDong - a.soDong || a.ten.localeCompare(b.ten, 'vi')),
  };
}

/**
 * 00:00 giờ Việt Nam của một ngày ("YYYY-MM-DD", từ congNgay — luôn có thật) dạng ISO UTC — mốc lọc cột
 * thoi_diem_ban. Lỡ ngày hỏng thì mốc là 1970: đọc dư, tomTatKhongBietTang vẫn bỏ dòng ngoài 7 ngày.
 */
function dauNgayVnUtc(ngay: string): string {
  return new Date(docGioVnDiaPhuong(`${ngay}T00:00`) ?? 0).toISOString();
}

/**
 * Đọc hộp "Bán không biết tảng" của chi nhánh, hôm nay theo giờ Việt Nam (homNayVn). Lọc ở database,
 * chỉ dòng cần đếm — dòng bán bình thường qua ô không về web: dòng đã trừ kho của món có ô mã, từ
 * 00:00 giờ VN của ngày đầu (cột thoi_diem_ban — không lọc cột tính ngay_ban của view), hoặc không ô
 * + không mã giảm, hoặc lệch ô (hai lần đọc, đủ trang). Lỗi ở bất kỳ lần đọc nào → ném.
 */
export async function docBanKhongBietTang(client: SupabaseClient, chiNhanhId: string): Promise<TomTatKhongBietTang> {
  const homNay = homNayVn();
  const oMa = await docOMa(client);
  const monCoO = new Set(oMa.keys());
  if (monCoO.size === 0) return tomTatKhongBietTang([], monCoO, homNay);
  const tuLuc = dauNgayVnUtc(bayNgayQua(homNay)[0]);
  const doc = (loc: 'khong_qua_o' | 'lech_o') => docTungTrang<Record<string, unknown>>((tu, den) => {
    const q = client.from('kho_v_ipos_dong')
      .select('id, hoa_don_id, thoi_diem_ban, ngay_ban, ma_ipos, ten_ipos, mat_hang_id, ten_mat_hang, o_ma_id, so_o, lech_o, ma_giam_id, so_kg', { count: 'exact' })
      .eq('chi_nhanh_id', chiNhanhId)
      .eq('trang_thai', 'da_ghi')
      .in('mat_hang_id', [...monCoO])
      .gte('thoi_diem_ban', tuLuc);
    return (loc === 'lech_o' ? q.eq('lech_o', true) : q.is('o_ma_id', null).is('ma_giam_id', null))
      .order('thoi_diem_ban', { ascending: false })
      .order('id')
      .range(tu, den);
  });
  const [khongO, lech] = await Promise.all([doc('khong_qua_o'), doc('lech_o')]);
  // Một dòng không thể vừa không ô vừa lệch ô (lệch ô luôn mang ô) — vẫn gộp theo id cho chắc.
  const dong = [...new Map([...khongO, ...lech].map(r => [String(r.id), r])).values()];
  return tomTatKhongBietTang(dong.map(r => ({
    ...(r as unknown as DongBanTang),
    lech_o: r.lech_o === true,
    so_kg: r.so_kg === null || r.so_kg === undefined ? null : Number(r.so_kg),
  })), monCoO, homNay);
}

/** Một khối của hộp: một loại có dòng trong 7 ngày, số hôm nay / 7 ngày và các món. */
export interface KhoiKhongBietTang {
  loai: LoaiKhongBietTang;
  homNay: DemKhongBietTang;
  bayNgay: DemKhongBietTang;
  nhom: NhomKhongBietTang[];
}

/**
 * Hộp "Bán không biết tảng" in gì — chọn ở đây (thuần, có kiểm thử), trang chỉ vẽ theo `kieu`, `lop` là
 * lớp nb-bao. Đọc lỗi → 'loi' chỉ mang câu lỗi, KHÔNG mang số (không có số 0 nào để lỡ in). null = không
 * vẽ hộp (vai không xem giá: trang không đọc).
 */
export type HopKhongBietTang =
  | { kieu: 'loi'; lop: 'loi'; cau: string }
  | { kieu: 'chua_co_o'; lop: 'xong' }
  | { kieu: 'khong_co'; lop: 'xong'; tuNgay: string; homNay: string }
  | { kieu: 'co_dong'; lop: 'luu-y'; tuNgay: string; homNay: string; loai: KhoiKhongBietTang[] };

export function hopKhongBietTang(tang: TomTatKhongBietTang | null, loi: string | null): HopKhongBietTang | null {
  if (loi) return { kieu: 'loi', lop: 'loi', cau: loi };
  if (!tang) return null;
  if (!tang.coMonO) return { kieu: 'chua_co_o', lop: 'xong' };
  const loai = LOAI_KHONG_BIET_TANG.filter(l => tang.dem.bayNgay[l].dong > 0).map(l => ({
    loai: l, homNay: tang.dem.homNay[l], bayNgay: tang.dem.bayNgay[l], nhom: tang.nhom.filter(x => x.loai === l),
  }));
  return loai.length === 0
    ? { kieu: 'khong_co', lop: 'xong', tuNgay: tang.tuNgay, homNay: tang.homNay }
    : { kieu: 'co_dong', lop: 'luu-y', tuNgay: tang.tuNgay, homNay: tang.homNay, loai };
}

/** Mỗi loại: tên, nghĩa, nguyên nhân có thể và chỗ sửa — không loại nào là "lỗi thu ngân" chắc chắn. */
export const NGUYEN_NHAN_KHONG_BIET_TANG: Record<LoaiKhongBietTang, {
  ten: HaiThuTieng; giai: HaiThuTieng; nguyenNhan: HaiThuTieng[]; sua: HaiThuTieng;
}> = {
  khong_qua_o: {
    ten: { vi: 'Phần cắt theo tảng bán không qua ô', en: 'Per-primal cuts sold without a rotating code' },
    giai: {
      vi: 'Dòng là món có ô mã mà không mang mã ô, cũng không phải mã giảm — kho đã trừ theo hạn gần nhất, không biết khay thuộc tảng nào.',
      en: 'The line is an item that has rotating codes, but it carries neither a slot code nor a discount code — stock was deducted by nearest expiry, and the primal of the tray is unknown.',
    },
    nguyenNhan: [
      { vi: 'Thu ngân chọn tay món chung trên FABi thay vì quét tem.',
        en: 'The cashier picked the general dish by hand on FABi instead of scanning the label.' },
      { vi: 'Tem in bằng mã chung của món, không phải phím ô (màn pha lóc có báo "in bằng mã thường").',
        en: 'The label was printed with the item\'s general code, not the slot key (the butchery screen reports "printed with the regular code").' },
      { vi: 'Món ô chưa có trên FABi nên quét tem không ra món, thu ngân phải chọn tay.',
        en: 'The slot dish is not on FABi yet, so scanning the label finds nothing and the cashier has to pick by hand.' },
    ],
    sua: {
      vi: 'Ghép món → "Món cần có trên FABi": tạo đủ món ô. Dặn thu ngân luôn quét tem; quét không được thì gõ 13 số dưới mã vạch. Tem in bằng mã chung: in lại bằng phím ô.',
      en: 'Match dishes → "Dishes needed on FABi": create every slot dish. Tell cashiers to always scan the label; if it will not scan, type the 13 digits under the barcode. Labels printed with the general code: reprint with the slot key.',
    },
  },
  lech_o: {
    ten: { vi: 'Lệch ô', en: 'Code mismatch' },
    giai: {
      vi: 'Dòng mang mã ô nhưng lô của tảng giữ ô không đủ, hoặc ô chưa gắn tảng lúc bán — kho đã trừ theo hạn gần nhất.',
      en: 'The line carries a slot code, but the lot of the primal holding the slot was short, or the slot had no primal at the time of sale — stock was deducted by nearest expiry.',
    },
    nguyenNhan: [
      { vi: 'Phiên pha lóc chưa chốt lúc bán (ô chưa gắn tảng).',
        en: 'The butchery session was not closed yet at the time of sale (the slot had no primal).' },
      { vi: 'Sổ quầy thiếu lô của tảng: hàng mang ra quầy chưa bấm nhận.',
        en: 'The counter books were missing the primal\'s lot: goods brought to the counter were not confirmed.' },
      { vi: 'Khay còn mang tem cũ của ô đã giao cho tảng khác, hoặc in nhầm phím ô.',
        en: 'A tray still carries an old label of a slot now given to another primal, or the wrong slot key was printed.' },
    ],
    sua: {
      vi: 'Chốt phiên pha lóc trước khi bán; bấm nhận hàng mang ra quầy; kiểm tem ở quầy (Beeftown Cân → thẻ Tảng & ô).',
      en: 'Close the butchery session before selling; confirm goods brought to the counter; check the labels at the counter (Beeftown Scale → Primals & slots tab).',
    },
  },
};

// =============================================================================
// MÓN CẦN CÓ TRÊN FABi
// =============================================================================
/** 'chua_doc' = thực đơn iPOS rỗng / chưa đọc: không kết luận gì. */
export type TrenFabi = 'co' | 'ngung_ban' | 'chua_thay' | 'chua_doc';

export interface DongMonFabi {
  loai: 'o' | 'giam';
  mat_hang_id: string;
  tenMonKho: string;
  so_o: number | null;
  phan_tram: number | null;
  /** Tên món trên FABi — dữ liệu tiếng Việt cố ý (thu ngân đọc), không đổi theo ngôn ngữ màn hình. */
  tenGoiY: string;
  /** Mã món FABi = mã ô / mã giảm (kho tự nhận khi chưa ghép). */
  maMon: string;
  /** Mã vạch = mã món đệm đủ số chữ C của mẫu mã vạch (2XCCCCCWWWWWK). */
  maVach: string;
  giaKg: number | null;
  trenFabi: TrenFabi;
  /** Mã iPOS khác đã ghép tay với đúng ô này (FABi tự sinh mã) — null nếu không có. */
  maDaGhep: string | null;
  canhBao: HaiThuTieng[];
}

/** Tên món FABi cho một ô: "<tên món> ô <số>". Không ghi số tảng — ô xoay vòng, số tảng đã in trên tem. */
export function tenMonFabiO(ten: string, soO: number): string {
  return `${ten.trim()} ô ${soO}`.normalize('NFC');
}

/** Mã vạch cân của một mã món: đệm số 0 cho đủ `soChuSo` chữ số (mẫu 2XCCCCCWWWWWK → 5). */
export function maVachFabi(ma: string, soChuSo: number): string {
  return bo0(ma).padStart(soChuSo, '0');
}

export interface DuLieuMonFabi {
  matHang: readonly { id: string; ten: string; gia_ban_kg: number | null; dang_dung: boolean }[];
  oMa: readonly DongOMa[];
  maGiam: readonly DongMaGiam[];
  /** Thực đơn iPOS ĐỦ trang của chi nhánh — rỗng = chưa đọc. */
  menu: readonly { ma_ipos: string; dang_ban: boolean }[];
  daGhep: readonly { ma_ipos: string; kieu: string; mat_hang_id: string | null; o_ma_id?: string | null }[];
  soChuSo: number;
}

const BO_GHEP_GIAM: HaiThuTieng = {
  vi: 'Mã giảm này đang ghép ở Ghép món — bấm Bỏ ghép để kho tự nhận (ghép rồi thì báo cáo mất dấu giảm giá).',
  en: 'This discount code is matched in Match dishes — press Unmatch so stock recognises it by itself (while matched, reports lose the discount).',
};
const BO_GHEP_O: HaiThuTieng = {
  vi: 'Mã ô này đang ghép như món thường hoặc với ô khác — bấm Bỏ ghép (kho tự nhận) hoặc ghép lại với đúng ô.',
  en: 'This slot code is matched as a regular dish or with another slot — press Unmatch (stock recognises it by itself) or match it again with the right slot.',
};
/** Mã đã ghép "Không phải hàng kho" / suất / hàng cân nhãn — người ghép đã xác nhận FABi có món KHÁC mang mã này. */
const MA_LA_MON_KHAC: Record<'o' | 'giam', HaiThuTieng> = {
  o: {
    vi: 'Mã ô này đang ghép là món khác trên FABi (Không phải hàng kho, suất hoặc hàng cân nhãn) — món ô cần mã riêng: đổi mã ô trong Mặt hàng rồi tạo món FABi theo mã mới.',
    en: 'This slot code is matched as a different FABi dish (not a stock item, portion or scale-labelled goods) — the slot dish needs its own code: change the slot code under Items, then create the FABi dish with the new code.',
  },
  giam: {
    vi: 'Mã giảm này đang ghép là món khác trên FABi (Không phải hàng kho, suất hoặc hàng cân nhãn) — món giảm cần mã riêng: đổi mã giảm ở Beeftown Cân → thẻ Giảm giá rồi tạo món FABi theo mã mới.',
    en: 'This discount code is matched as a different FABi dish (not a stock item, portion or scale-labelled goods) — the discount dish needs its own code: change the discount code in Beeftown Scale → Discounts tab, then create the FABi dish with the new code.',
  },
};
/** Mã dài hơn số chữ C của mẫu mã vạch: cân từ chối in (can-tma.ts — "Mã cân … dài quá … số"). */
const maDaiQua = (loai: 'o' | 'giam', ma: string, n: number): HaiThuTieng => ({
  vi: `Mã ${ma} dài quá ${n} số — cân không in được tem mang mã này (mẫu mã vạch chỉ chứa ${n} số). ${
    loai === 'o' ? 'Đổi mã ô trong Mặt hàng.' : 'Đổi mã giảm ở Beeftown Cân → thẻ Giảm giá.'}`,
  en: `Code ${ma} is longer than ${n} digits — the scale cannot print a label with it (the barcode pattern holds only ${n} digits). ${
    loai === 'o' ? 'Change the slot code under Items.' : 'Change the discount code in Beeftown Scale → Discounts tab.'}`,
});

/**
 * Mỗi ô mã của món đang dùng và mỗi mã giảm đang bật của món đang dùng → một món cần có trên FABi.
 * Xếp theo tên món, ô trước (theo số ô), mã giảm sau (theo mức giảm). "Trên FABi": có trong thực
 * đơn (so sau khi bỏ số 0 đầu) hoặc — với ô — một mã khác đã ghép tay đúng ô và có trong thực đơn.
 */
export function monCanCoTrenFabi(du: DuLieuMonFabi): DongMonFabi[] {
  const mon = new Map(du.matHang.filter(m => m.dang_dung).map(m => [m.id, m]));
  const menu = new Map<string, boolean>();
  for (const m of du.menu) {
    const k = bo0(m.ma_ipos);
    if (k) menu.set(k, (menu.get(k) ?? false) || m.dang_ban);
  }
  const daDoc = du.menu.length > 0;
  const trangThai = (ma: string): TrenFabi => !daDoc ? 'chua_doc'
    : menu.has(bo0(ma)) ? (menu.get(bo0(ma)) ? 'co' : 'ngung_ban') : 'chua_thay';
  const ghepTheoMa = new Map(du.daGhep.map(g => [bo0(g.ma_ipos), g]));
  const dai = (loai: 'o' | 'giam', ma: string) => bo0(ma).length > du.soChuSo ? [maDaiQua(loai, bo0(ma), du.soChuSo)] : [];
  /** Mã ô / mã giảm đang ghép: như món kho (sai) → bảo Bỏ ghép; kiểu khác (đã xác nhận món khác) → bảo đổi mã. */
  const ghepCanhBao = (loai: 'o' | 'giam', g: DuLieuMonFabi['daGhep'][number] | undefined) =>
    !g ? [] : g.kieu === 'mon' ? [loai === 'o' ? BO_GHEP_O : BO_GHEP_GIAM] : [MA_LA_MON_KHAC[loai]];

  const ra: DongMonFabi[] = [];
  for (const o of [...du.oMa].sort((a, b) => a.so_o - b.so_o)) {
    const m = mon.get(o.mat_hang_id);
    if (!m) continue;
    let tt = trangThai(o.ma_can);
    const tay = du.daGhep.find(g => g.o_ma_id === o.id && bo0(g.ma_ipos) !== bo0(o.ma_can)) ?? null;
    if (daDoc && tt !== 'co' && tay && menu.has(bo0(tay.ma_ipos))) tt = menu.get(bo0(tay.ma_ipos)) ? 'co' : 'ngung_ban';
    const ghep = ghepTheoMa.get(bo0(o.ma_can));
    ra.push({
      loai: 'o', mat_hang_id: m.id, tenMonKho: m.ten, so_o: o.so_o, phan_tram: null,
      tenGoiY: tenMonFabiO(m.ten, o.so_o), maMon: o.ma_can, maVach: maVachFabi(o.ma_can, du.soChuSo),
      giaKg: m.gia_ban_kg, trenFabi: tt, maDaGhep: tay?.ma_ipos ?? null,
      canhBao: [...dai('o', o.ma_can), ...(ghep && ghep.o_ma_id !== o.id ? ghepCanhBao('o', ghep) : [])],
    });
  }
  for (const g of [...du.maGiam].sort((a, b) => a.phan_tram - b.phan_tram)) {
    const m = mon.get(g.mat_hang_id);
    if (!m || !g.dang_dung) continue;
    ra.push({
      loai: 'giam', mat_hang_id: m.id, tenMonKho: m.ten, so_o: null, phan_tram: g.phan_tram,
      tenGoiY: tenGiam(m.ten, g.phan_tram).normalize('NFC'), maMon: g.ma_can, maVach: maVachFabi(g.ma_can, du.soChuSo),
      giaKg: m.gia_ban_kg === null ? null : giaGiam(m.gia_ban_kg, g.phan_tram), trenFabi: trangThai(g.ma_can), maDaGhep: null,
      canhBao: [...dai('giam', g.ma_can), ...ghepCanhBao('giam', ghepTheoMa.get(bo0(g.ma_can)))],
    });
  }
  const thuTu = new Map([...mon.values()].map(m => [m.id, m.ten]));
  return ra.sort((a, b) => (thuTu.get(a.mat_hang_id) ?? '').localeCompare(thuTu.get(b.mat_hang_id) ?? '', 'vi')
    || (a.loai === b.loai ? 0 : a.loai === 'o' ? -1 : 1));
}

/** Nhãn và lớp nb-nhan của cột "Trên FABi". */
export function nhanTrenFabi(tt: TrenFabi): [HaiThuTieng, string] {
  switch (tt) {
    case 'co': return [{ vi: 'Mã món có trên FABi (mã vạch phải thử bằng một tem)',
                         en: 'Dish code is on FABi (check the barcode with one test label)' }, 'song'];
    case 'ngung_ban': return [{ vi: 'Có trên FABi nhưng ngừng bán', en: 'On FABi but no longer sold' }, 'nhap'];
    case 'chua_thay': return [{ vi: 'Chưa thấy trên FABi', en: 'Not seen on FABi' }, 'nhap'];
    default: return [{ vi: 'Chưa đọc được thực đơn iPOS', en: 'iPOS menu not read yet' }, 'tat'];
  }
}

/** Phần đọc thêm cho mục "Món cần có trên FABi" (trang Ghép món đã có món, ô, mã đã ghép). */
export interface ThemMonFabi {
  menu: { ma_ipos: string; dang_ban: boolean }[];
  /** Lần đọc thực đơn gần nhất (cap_nhat_luc mới nhất); null khi thực đơn rỗng. */
  menuLuc: string | null;
  maGiam: DongMaGiam[];
  soChuSo: number;
}

/** Thực đơn iPOS đủ trang, mã giảm, số chữ số mã trong mẫu mã vạch. Lỗi → ném. */
export async function docThemMonFabi(client: SupabaseClient, chiNhanhId: string): Promise<ThemMonFabi> {
  const [menu, maGiam, caiDat] = await Promise.all([
    docTungTrang<{ ma_ipos: string; dang_ban: boolean; cap_nhat_luc: string }>((tu, den) => client.from('kho_ipos_menu')
      .select('ma_ipos, dang_ban, cap_nhat_luc', { count: 'exact' })
      .eq('chi_nhanh_id', chiNhanhId)
      .order('ma_ipos')
      .range(tu, den)),
    docMaGiam(client),
    client.from('kho_cai_dat').select('mau_ma_vach').eq('chi_nhanh_id', chiNhanhId).maybeSingle(),
  ]);
  if (caiDat.error) throw caiDat.error;
  const menuLuc = menu.reduce<string | null>((x, m) => (!x || Date.parse(m.cap_nhat_luc) > Date.parse(x) ? m.cap_nhat_luc : x), null);
  return {
    menu: menu.map(m => ({ ma_ipos: m.ma_ipos, dang_ban: m.dang_ban !== false })),
    menuLuc,
    maGiam,
    soChuSo: soChuSoMa((caiDat.data as { mau_ma_vach?: string | null } | null)?.mau_ma_vach ?? null),
  };
}

/**
 * Mục "Món cần có trên FABi" ở trang Ghép món in gì — chọn ở đây (thuần, có kiểm thử), trang chỉ vẽ theo
 * `kieu`. 'loi': chỉ câu lỗi; 'an': phần chính của trang chưa đọc được (trang đã báo lỗi ở đầu) — không
 * số, không kết luận; 'co': số món cần có (tiêu đề "· N" chỉ khi này), thực đơn rỗng thì chuaDocMenu.
 */
export type MucMonFabi =
  | { kieu: 'loi'; cau: string }
  | { kieu: 'an' }
  | { kieu: 'co'; soMon: number; chuaDocMenu: boolean; menuLuc: string | null; soMonMenu: number };

export function mucMonFabi(them: ThemMonFabi | null, loi: string | null, soMon: number): MucMonFabi {
  if (loi) return { kieu: 'loi', cau: loi };
  if (!them) return { kieu: 'an' };
  return { kieu: 'co', soMon, chuaDocMenu: them.menu.length === 0, menuLuc: them.menuLuc, soMonMenu: them.menu.length };
}

/** Đủ dữ liệu cho file CSV: món, ô, mã đã ghép, thực đơn, mã giảm. Lỗi → ném. */
export async function docMonFabi(client: SupabaseClient, chiNhanhId: string): Promise<{
  dong: DongMonFabi[]; menuLuc: string | null; soMonMenu: number;
}> {
  const [matHang, oMa, daGhep, them] = await Promise.all([
    docMatHang(client), docOMa(client), docMaDaGhep(client, chiNhanhId), docThemMonFabi(client, chiNhanhId),
  ]);
  return {
    dong: monCanCoTrenFabi({ matHang, oMa: [...oMa.values()].flat(), maGiam: them.maGiam, menu: them.menu, daGhep, soChuSo: them.soChuSo }),
    menuLuc: them.menuLuc,
    soMonMenu: them.menu.length,
  };
}

// -----------------------------------------------------------------------------
// FILE CSV CHO FABi
// -----------------------------------------------------------------------------
const CAU_TEP = {
  cot: {
    loai: { vi: 'Loại', en: 'Kind' },
    tenGoiY: { vi: 'Tên món trên FABi (gợi ý)', en: 'Dish name on FABi (suggested)' },
    maMon: { vi: 'Mã món', en: 'Dish code' },
    maVach: { vi: 'Mã vạch', en: 'Barcode' },
    banTheo: { vi: 'Bán theo', en: 'Sold by' },
    giaKg: { vi: 'Giá/kg', en: 'Price/kg' },
    monKho: { vi: 'Món kho', en: 'Stock item' },
    muc: { vi: 'Ô / mức giảm', en: 'Slot / discount' },
    trenFabi: { vi: 'Trên FABi', en: 'On FABi' },
    ghiChu: { vi: 'Ghi chú', en: 'Note' },
  },
  loaiO: { vi: 'Ô mã', en: 'Rotating code' },
  loaiGiam: { vi: 'Mã giảm', en: 'Discount code' },
  o: { vi: (n: number) => `ô ${n}`, en: (n: number) => `slot ${n}` },
  // Không mở đầu bằng "-": taoCsv thêm dấu ' trước ô chữ mở đầu bằng - (chặn công thức Excel).
  giam: { vi: (pt: number) => `giảm ${pt}%`, en: (pt: number) => `${pt}% off` },
  chuaGia: { vi: 'Món kho chưa có giá bán/kg — điền giá trong Mặt hàng trước.', en: 'The stock item has no price per kg yet — fill it in under Items first.' },
  maVachDem: {
    vi: (mv: string) => `Mã vạch đủ số là ${mv} — Excel có thể bỏ số 0 đầu, gõ đúng như vậy trên FABi.`,
    en: (mv: string) => `The full barcode is ${mv} — Excel may drop the leading zeros; type it exactly like that on FABi.`,
  },
  khongQuyen: {
    vi: 'Tài khoản không tải được danh sách món cho FABi (cần quyền danh mục).',
    en: 'This account is not allowed to download the FABi dish list (catalogue rights needed).',
  },
  khongDoc: {
    vi: 'Không đọc được danh sách món cho FABi — chưa tạo file. Thử lại sau ít phút.',
    en: 'Could not read the FABi dish list — no file was created. Try again in a few minutes.',
  },
} as const;

/** Cột của file CSV món FABi (taoCsv: BOM, dấu chấm phẩy). Mã món / mã vạch là chữ — không lách bằng "=". */
export function cotMonFabi(nn: NgonNguNB = 'vi'): CotBaoCao[] {
  const c = CAU_TEP.cot;
  return [
    { khoa: 'loai', ten: c.loai[nn], kieu: 'chu' },
    { khoa: 'tenGoiY', ten: c.tenGoiY[nn], kieu: 'chu' },
    { khoa: 'maMon', ten: c.maMon[nn], kieu: 'chu' },
    { khoa: 'maVach', ten: c.maVach[nn], kieu: 'chu' },
    { khoa: 'banTheo', ten: c.banTheo[nn], kieu: 'chu' },
    { khoa: 'giaKg', ten: c.giaKg[nn], kieu: 'tien' },
    { khoa: 'monKho', ten: c.monKho[nn], kieu: 'chu' },
    { khoa: 'muc', ten: c.muc[nn], kieu: 'chu' },
    { khoa: 'trenFabi', ten: c.trenFabi[nn], kieu: 'chu' },
    { khoa: 'ghiChu', ten: c.ghiChu[nn], kieu: 'chu' },
  ];
}

/** Dòng CSV theo ngôn ngữ người tải (tên món FABi, mã: giữ nguyên). */
export function dongCsvMonFabi(ds: readonly DongMonFabi[], nn: NgonNguNB = 'vi'): Record<string, unknown>[] {
  return ds.map(d => {
    const ghiChu = [
      ...(d.giaKg === null ? [CAU_TEP.chuaGia[nn]] : []),
      ...(d.maVach !== d.maMon ? [CAU_TEP.maVachDem[nn](d.maVach)] : []),
      ...d.canhBao.map(c => c[nn]),
    ].join(' ');
    return {
      loai: (d.loai === 'o' ? CAU_TEP.loaiO : CAU_TEP.loaiGiam)[nn],
      tenGoiY: d.tenGoiY, maMon: d.maMon, maVach: d.maVach, banTheo: 'kg', giaKg: d.giaKg,
      monKho: d.tenMonKho,
      muc: d.loai === 'o' ? CAU_TEP.o[nn](d.so_o ?? 0) : CAU_TEP.giam[nn](d.phan_tram ?? 0),
      trenFabi: nhanTrenFabi(d.trenFabi)[0][nn],
      ghiChu,
    };
  });
}

/**
 * Nội dung tải về của /noi-bo/kho/ban-ipos/mon-fabi.csv — route chỉ mở phiên (moKhoTai) rồi gọi hàm
 * này. Vai không có quyền danh mục → 403. Đọc lỗi → 500 kèm câu, KHÔNG BAO GIỜ trả file rỗng.
 * Tên file ASCII theo giờ Việt Nam: mon-fabi-<mã chi nhánh>-<YYYYMMDD>-<HHMM>.csv.
 */
export async function taoTepMonFabi(
  client: SupabaseClient, tuy: { vai: string | null | undefined; chiNhanh: { id: string; ma: string }; nn: NgonNguNB },
): Promise<{ status: number; noiDung: string; tenTep: string | null }> {
  const { vai, chiNhanh, nn } = tuy;
  if (!duoc(vai, 'danh_muc')) return { status: 403, noiDung: CAU_TEP.khongQuyen[nn], tenTep: null };
  let dong: DongMonFabi[];
  try {
    dong = (await docMonFabi(client, chiNhanh.id)).dong;
  } catch (e) {
    // Câu lỗi quyền / dữ liệu của database thì kèm theo (dịch); lỗi mạng đã nói ở câu chính.
    const chiTiet = cauLoiKho(e, '');
    const them = chiTiet && chiTiet !== LOI_KHO_CHUNG.mang.vi ? ` ${dichCau(nn, chiTiet)}` : '';
    return { status: 500, noiDung: CAU_TEP.khongDoc[nn] + them, tenTep: null };
  }
  const vn = gioVnTuMs(Date.now());
  const moc = `${vn.slice(0, 10).replace(/-/g, '')}-${vn.slice(11, 16).replace(':', '')}`;
  const tenTep = `mon-fabi-${chiNhanh.ma}-${moc}.csv`.replace(/[^a-zA-Z0-9._-]/g, '_');
  return { status: 200, noiDung: taoCsv(cotMonFabi(nn), dongCsvMonFabi(dong, nn)), tenTep };
}
