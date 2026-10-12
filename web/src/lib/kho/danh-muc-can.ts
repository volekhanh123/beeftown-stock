/**
 * KHO — DANH MỤC ĐƯA XUỐNG CÂN (truy vết tảng GĐ3)
 *
 * Nguồn chung cho màn Đồng bộ cân (cai-dat/can.astro) và chương trình Beeftown
 * Cân (can-app): danh sách hàng {mã cân, tên, giá bán/kg, hạn dùng} để
 * lapKeHoach so với file của cân.
 *
 *   · Món thường: một dòng theo mã cân của món, như trước.
 *   · Phần cắt có ô mã (0049): thêm MỖI Ô một dòng, cùng giá với món. Ô đang
 *     giao cho một tảng còn hàng thì tên kèm số tảng — "Thăn ngoại cắt lát
 *     #0142" — để tem in ra có số tảng; ô trống thì tên món. Ô trống vẫn nằm
 *     trên cân, nên số PLU của ô không đổi qua các lần lóc.
 *
 *   · Mã giảm giá (0054): mỗi mức giảm đang bật của món một dòng — "Steak
 *     Ribeye Angus -30%", giá đã giảm (ma-giam.ts). Mã giảm tắt / món ngừng
 *     dùng → dòng không dùng (bỏ khỏi cân).
 *
 * Tên + số tảng giữ trong 24 ký tự (dài hơn dễ bị cắt khi in): cắt bớt tên món,
 * không bao giờ cắt số tảng.
 *
 * HẠN DÙNG (HSD) TRÊN TEM = SỐ NGÀY CÒN LẠI CỦA LÔ (Khánh chọn 29/09/2026, cách b).
 * Cân in HSD = NGÀY IN TEM (đồng hồ cân) + số ngày ở cột 32. Hạn trong kho là
 * một NGÀY (kho_lo.han_dung — tính từ ngày nhập / ngày lóc, lô phần cắt còn bị
 * chặn bởi hạn của tảng), nên chương trình gửi xuống hạn của lô − hôm nay (giờ
 * VN), và số đó phải gửi lại MỖI NGÀY: số tính hôm qua mà in hôm nay là HSD
 * muộn thêm 1 ngày. Beeftown Cân ghi ngày tính và báo đỏ khi cũ (nghiep-vu.ts);
 * màn Đồng bộ cân ghi "HSD tính cho ngày xuất file — nạp vào cân trong ngày".
 * Từng dòng (tinhHsdMon, tinhHsdO — hàm thuần, test bằng node):
 *   1. Ô mã có tảng đang giữ và lô đầu ra đã có (GiaoOMa.con_giu + han_dung):
 *      han_dung − hôm nay. Phiên lóc còn nháp (chưa có lô đầu ra): như ô trống,
 *      nhưng không muộn hơn hạn của tảng đang lóc nếu lô tảng còn tồn — lô ra
 *      sẽ có hạn least(ngày lóc + hạn của món, hạn tảng) (0022 / 0033).
 *   2. Món thường và ô trống: các lô của món còn tồn ở chi nhánh (kho_v_ton —
 *      so_kg > 0 hoặc so_goi > 0, mọi vị trí) → hạn SỚM NHẤT: HSD in ra không
 *      bao giờ muộn hơn lô cũ nhất còn trong kho.
 *   3. Không lô nào còn tồn: han_dung_ngay của món (hàng về hôm nay có hạn tối
 *      đa ngần ấy ngày); món không có han_dung_ngay → null (không in HSD).
 *   4. Hạn đã qua (số ngày < 0): null — không in ngày đã qua — và cảnh báo
 *      "lô đã hết hạn, xem thẻ Quầy". Quá 999 ngày: lapKeHoach (can-tma.ts)
 *      không in, kèm cảnh báo, như trước.
 *   5. Mã giảm giá (gói cận date): null — HSD thật của gói ngắn hơn hạn của
 *      món và không biết gói đã qua bao nhiêu ngày; in sai hạn còn tệ hơn không in.
 * Mỗi dòng mang nguồn HSD (nguon_hsd) để xem trước hiện: "lô L0012 hết hạn
 * 03/10", "tảng #0142 · hết hạn 03/10", "theo hạn dùng của món (chưa có lô)".
 * In HSD: chưa thử trên cân thật.
 *
 * ghepHangChoCan không kèm dữ liệu lô (tham số hsd) thì như trước bản này:
 * món không mang HSD (undefined — cân giữ nguyên cột ngày), ô mã và mã giảm
 * tắt HSD (null). hangChoCan luôn kèm.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { chuanTenCan, type HangKho } from './can-tma.ts';
import { dinhDangKg, type HaiThuTieng } from './chung.ts';
import type { MatHang } from './danh-muc.ts';
import { congNgay, gioVnTuMs, homNayVn, laNgayCoThat } from '../gio-vn.ts';
import { khoangThoiGian, tuTruoc } from '../suc-khoe.ts';
import { docGiaoOMaCan, docOMa, type CanPhien, type DongOMa, type GiaoOMa, type TrenCanO } from './o-ma.ts';
import { docMaGiam, giaGiam, tenGiam, type DongMaGiam } from './ma-giam.ts';
import { soTangChu } from './tang.ts';
import { docLoConTon, type LoTon } from './ton.ts';

export type { LoTon };

export const TEN_CAN_TOI_DA = 24;

/** "Thăn ngoại cắt lát" + 142 → "Thăn ngoại cắt lát #0142", cắt tên cho vừa 24 ký tự. */
export function tenTheoTang(ten: string, soTang: number | null | undefined): string {
  const duoi = soTangChu(soTang);
  if (!duoi) return ten;
  // NFC trước khi đếm: tên dán từ Excel / macOS (NFD — dấu là ký tự riêng) không bị cắt ngắn hơn tên gõ tay.
  const chu = [...ten.normalize('NFC').trim()];
  const toiDa = Math.max(TEN_CAN_TOI_DA - duoi.length - 1, 1);
  const goc = chu.length > toiDa ? chu.slice(0, toiDa).join('').trimEnd() : chu.join('');
  return `${goc} ${duoi}`;
}

// -----------------------------------------------------------------------------
// HẠN DÙNG TỪNG DÒNG (xem đầu file)
// -----------------------------------------------------------------------------
/** Dữ liệu để tính HSD: hôm nay theo giờ VN ('YYYY-MM-DD' — homNayVn()) và các lô còn tồn ở chi nhánh của cân. */
export interface DuLieuHsd { homNay: string; lo: LoTon[] }

/** HSD của một dòng lên cân: số ngày (null = không in), lấy từ đâu, cảnh báo (lô đã hết hạn). */
export interface HsdDong { soNgay: number | null; nguon: HaiThuTieng; canhBao?: HaiThuTieng }

/** 'YYYY-MM-DD' (phần đầu) → số ngày kể từ 01/01/1970, tính trên lịch (không múi giờ). Sai dạng / ngày không có thật → null. */
function soNgayLich(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ''));
  if (!m || !laNgayCoThat(+m[1], +m[2], +m[3])) return null;
  return Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86_400_000);
}

/** Số ngày từ homNay tới hanDung (cả hai 'YYYY-MM-DD'); âm = hạn đã qua. Ngày sai dạng → null. */
export function soNgayConLai(hanDung: string, homNay: string): number | null {
  const a = soNgayLich(homNay), b = soNgayLich(hanDung);
  return a === null || b === null ? null : b - a;
}

/** '2026-10-03' → '03/10'. */
export const ngayNgan = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

const THEO_MON: HaiThuTieng = { vi: 'theo hạn dùng của món (chưa có lô)', en: 'from the item\'s shelf life (no lot yet)' };
const KHONG_HAN: HaiThuTieng = { vi: 'món không có hạn dùng, chưa có lô — không in HSD', en: 'the item has no shelf life and no lot — no use-by printed' };
const NGUON_GIAM: HaiThuTieng = { vi: 'mã giảm giá cận date — không in HSD', en: 'near-date discount code — no use-by printed' };
/** Lỗi lập trình: "hôm nay" không phải 'YYYY-MM-DD' (hangChoCan luôn truyền homNayVn()). */
const LOI_HOM_NAY: HaiThuTieng = { vi: 'ghepHangChoCan: hôm nay phải có dạng YYYY-MM-DD.', en: 'ghepHangChoCan: today must be YYYY-MM-DD.' };

/** Một hạn có thể dùng cho dòng: ngày hạn, câu nguồn, và tên để nói "… đã hết hạn". */
interface UngVien { han: string; nguon: HaiThuTieng; ten: HaiThuTieng }

const ungVienLo = (l: LoTon): UngVien => ({
  han: l.han_dung,
  nguon: { vi: `lô ${l.ma_lo} hết hạn ${ngayNgan(l.han_dung)}`, en: `lot ${l.ma_lo}, use-by ${ngayNgan(l.han_dung)}` },
  ten: { vi: `Lô ${l.ma_lo}`, en: `Lot ${l.ma_lo}` },
});

/** Hạn → số ngày còn lại tính cho homNay; hạn đã qua → null + cảnh báo. Không tính được (ngày sai dạng) → null: không in. */
function tuUngVien(u: UngVien, homNay: string): HsdDong {
  const n = soNgayConLai(u.han, homNay);
  if (n === null) return { soNgay: null, nguon: u.nguon };
  if (n >= 0) return { soNgay: n, nguon: u.nguon };
  return { soNgay: null, nguon: u.nguon, canhBao: {
    vi: `${u.ten.vi} đã hết hạn (${ngayNgan(u.han)}) — không in HSD lên tem. Xem thẻ Quầy: huỷ hay bán giảm giá lô này.`,
    en: `${u.ten.en} expired on ${ngayNgan(u.han)} — no use-by is printed on the label. See the Counter tab: dispose of or discount this lot.`,
  } };
}

/** Lô còn tồn có hạn SỚM NHẤT của mỗi món (bỏ dòng hạn không đọc được). */
export function loSomNhatTheoMon(lo: LoTon[]): Map<string, LoTon> {
  const ra = new Map<string, LoTon>();
  for (const l of lo) {
    if (soNgayLich(l.han_dung) === null) continue;
    const cu = ra.get(l.mat_hang_id);
    if (!cu || l.han_dung.slice(0, 10) < cu.han_dung.slice(0, 10)) ra.set(l.mat_hang_id, l);
  }
  return ra;
}

/**
 * HSD của món thường, hay ô mã trống (quy tắc 2, 3, 4): lô sớm nhất của món còn tồn (loSom) → hạn − homNay;
 * không lô nào → han_dung_ngay của món; không có → null.
 */
export function tinhHsdMon(m: Pick<MatHang, 'han_dung_ngay'>, loSom: LoTon | undefined, homNay: string): HsdDong {
  if (loSom) return tuUngVien(ungVienLo(loSom), homNay);
  if (m.han_dung_ngay === null || m.han_dung_ngay === undefined) return { soNgay: null, nguon: KHONG_HAN };
  return { soNgay: m.han_dung_ngay, nguon: THEO_MON };
}

/**
 * HSD của một ô mã (quy tắc 1): tảng đang giữ ô và lô đầu ra đã có → hạn lô đó − homNay. Còn lại như món
 * (tinhHsdMon); phiên lóc còn nháp thì không muộn hơn hạn của tảng đang lóc (lô vào, tìm trong loTheoId).
 */
export function tinhHsdO(m: Pick<MatHang, 'han_dung_ngay'>, giu: GiaoOMa | undefined, loSom: LoTon | undefined,
                         loTheoId: Map<string, LoTon>, homNay: string): HsdDong {
  const tang = (g: GiaoOMa): HaiThuTieng => (g.so_tang !== null && g.so_tang !== undefined
    ? { vi: `tảng ${soTangChu(g.so_tang)}`, en: `primal ${soTangChu(g.so_tang)}` }
    : { vi: `tảng lô ${g.ma_lo_tang ?? '?'}`, en: `primal lot ${g.ma_lo_tang ?? '?'}` });
  if (giu && giu.han_dung && soNgayLich(giu.han_dung) !== null) {
    const t = tang(giu), dm = ngayNgan(giu.han_dung);
    return tuUngVien({ han: giu.han_dung, nguon: { vi: `${t.vi} · hết hạn ${dm}`, en: `${t.en} · use-by ${dm}` },
                       ten: { vi: `Lô của ${t.vi}`, en: `The lot from ${t.en}` } }, homNay);
  }
  const mon = tinhHsdMon(m, loSom, homNay);
  const loTang = giu && !giu.lo_id && giu.lo_vao_id ? loTheoId.get(giu.lo_vao_id) : undefined;
  if (giu && loTang && soNgayLich(loTang.han_dung) !== null && soNgayLich(homNay) !== null) {
    // Hạn của món tính theo ngày: lô sớm nhất, hay hôm nay + han_dung_ngay; món không hạn thì lô ra lấy hạn tảng.
    const hanMon = loSom ? loSom.han_dung : m.han_dung_ngay === null || m.han_dung_ngay === undefined ? null : congNgay(homNay, m.han_dung_ngay);
    if (hanMon === null || loTang.han_dung.slice(0, 10) < hanMon.slice(0, 10)) {
      const t = tang(giu), dm = ngayNgan(loTang.han_dung);
      return tuUngVien({ han: loTang.han_dung, nguon: { vi: `${t.vi} đang lóc · hết hạn ${dm}`, en: `${t.en} being broken down · use-by ${dm}` },
                         ten: { vi: `${t.vi[0].toUpperCase()}${t.vi.slice(1)} đang lóc`, en: `${t.en[0].toUpperCase()}${t.en.slice(1)} being broken down` } }, homNay);
    }
  }
  return mon;
}

/** HSD → các trường của HangKho. */
const theoHsd = (x: HsdDong): Pick<HangKho, 'han_dung_ngay' | 'nguon_hsd' | 'canh_bao_hsd'> =>
  ({ han_dung_ngay: x.soNgay, nguon_hsd: x.nguon, ...(x.canhBao ? { canh_bao_hsd: x.canhBao } : {}) });

// -----------------------------------------------------------------------------
// GHÉP DANH MỤC
// -----------------------------------------------------------------------------
/**
 * Ghép danh sách hàng cho cân (hàm thuần — test bằng node).
 * giao: ô đang giao ở CHI NHÁNH của cân (kho_v_o_ma_giao).
 * hsd: hôm nay (giờ VN) + lô còn tồn ở chi nhánh — tính HSD từng dòng (xem đầu file). Không có thì như trước bản
 * này: món không mang HSD, ô mã và mã giảm tắt HSD.
 */
export function ghepHangChoCan(matHang: MatHang[], oMa: Map<string, DongOMa[]>, giao: GiaoOMa[],
                               maGiam: DongMaGiam[] = [], hsd?: DuLieuHsd): HangKho[] {
  if (hsd && soNgayLich(hsd.homNay) === null) throw new Error(LOI_HOM_NAY.vi);
  const giu = giao.filter(g => g.con_giu);
  const tangCuaO = new Map(giu.map(g => [g.o_ma_id, g.so_tang]));
  const giuCuaO = new Map(giu.map(g => [g.o_ma_id, g]));
  const loSom = hsd ? loSomNhatTheoMon(hsd.lo) : new Map<string, LoTon>();
  const loTheoId = new Map((hsd?.lo ?? []).map(l => [l.lo_id, l]));

  const ra: HangKho[] = matHang.map(m => ({
    ma: m.ma, ma_can: m.ma_can, ten: m.ten, gia_ban_kg: m.gia_ban_kg, dang_dung: m.dang_dung,
    // Không có dữ liệu lô: không có khoá han_dung_ngay — cân giữ nguyên cột ngày (như trước).
    ...(hsd ? theoHsd(tinhHsdMon(m, loSom.get(m.id), hsd.homNay)) : {}),
  }));
  for (const m of matHang) {
    for (const o of oMa.get(m.id) ?? []) {
      ra.push({
        ma: `${m.ma}#${o.so_o}`,
        ma_can: o.ma_can,
        ten: tenTheoTang(m.ten, tangCuaO.get(o.id)),
        gia_ban_kg: m.gia_ban_kg,
        dang_dung: m.dang_dung,
        // Không có dữ liệu lô: null = tắt HSD — không số nào tính từ ngày in chắc không vượt hạn của lô lóc.
        ...(hsd ? theoHsd(tinhHsdO(m, giuCuaO.get(o.id), loSom.get(m.id), loTheoId, hsd.homNay)) : { han_dung_ngay: null }),
      });
    }
  }
  const theoId = new Map(matHang.map(m => [m.id, m]));
  for (const g of maGiam) {
    const m = theoId.get(g.mat_hang_id);
    if (!m) continue;
    ra.push({
      ma: `${m.ma}~G${g.phan_tram}`,
      ma_can: g.ma_can,
      ten: tenGiam(m.ten, g.phan_tram, TEN_CAN_TOI_DA),
      gia_ban_kg: m.gia_ban_kg === null || m.gia_ban_kg === undefined ? m.gia_ban_kg : giaGiam(m.gia_ban_kg, g.phan_tram),
      dang_dung: m.dang_dung && g.dang_dung,
      // Gói cận date được dán lại tem giảm giá: HSD thật của gói ngắn hơn hạn
      // dùng của món (đã qua bao nhiêu ngày thì không biết), nên KHÔNG in HSD
      // mới tính từ hôm nay — in sai hạn còn tệ hơn không in. null = tắt HSD.
      han_dung_ngay: null,
      ...(hsd ? { nguon_hsd: NGUON_GIAM } : {}),
    });
  }
  return ra;
}

/**
 * Đọc từ kho rồi ghép — dùng ở màn Đồng bộ cân và Beeftown Cân, bằng client của người đã đăng nhập (mọi vai xem từ 0061:
 * ô đang giao đọc qua kho_can_giao_o_ma — NV quầy ở máy quầy đọc view kho_v_o_ma_giao thì rỗng, tên ô mất số tảng).
 * "Hôm nay" (giờ VN) lấy SAU khi đọc xong: đọc vắt qua nửa đêm thì số ngày tính cho ngày mới (ngắn hơn), không
 * tính cho hôm qua (HSD in ra muộn thêm 1 ngày).
 */
export async function hangChoCan(client: SupabaseClient, chiNhanhId: string, matHang: MatHang[]): Promise<HangKho[]> {
  const [oMa, giao, maGiam, lo] = await Promise.all([
    docOMa(client), docGiaoOMaCan(client, chiNhanhId), docMaGiam(client), docLoConTon(client, chiNhanhId),
  ]);
  return ghepHangChoCan(matHang, oMa, giao, maGiam, { homNay: homNayVn(), lo });
}

// -----------------------------------------------------------------------------
// TRANG PHA LÓC: Ô ĐÃ LÊN CÂN CHƯA, TEM IN / NHÃN QUÉT, NHÃN MÃ THƯỜNG (0061)
// -----------------------------------------------------------------------------
/** Máy quầy báo quá chừng này phút trước thì "trên cân" có thể đã cũ — nói rõ lần báo cuối. */
export const PHUT_BAO_CAN_CU = 5;

/** chua_xac_nhan (0080): đúng tên mới, nhưng máy quầy báo cân có thể đang khác dòng đó (lần gửi chưa xác nhận) — không xanh. */
export type MucCan = 'san_sang' | 'chua_xac_nhan' | 'ten_cu' | 'chua_len' | 'khong_biet';
export interface DongCanO {
  giao_id: string; ten_hang: string; so_o: number; ma_can: string;
  /** Tên kho muốn in trên tem của ô (tên + số tảng) — đúng tên hangChoCan gửi xuống cân. */
  tenMuon: string;
  /** Chỉ ô ĐANG GIỮ mới xét trên cân; ô đã trả (tảng bán hết, phiên huỷ) thì null. */
  muc: MucCan | null;
  cau: HaiThuTieng | null;
  /** Đối chiếu tem cân in bằng mã ô (từ lúc giao tới lúc chốt) với nhãn đã quét bằng mã ô. */
  soIn: number; soQuet: number;
  doiChieu: HaiThuTieng;
}
export interface TomTatCan {
  dong: DongCanO[];
  /** Câu chung về máy quầy (tự gửi, lần báo cuối) — null khi không có ô nào đang giữ. */
  may: HaiThuTieng | null;
  /** Một câu cho mỗi phần cắt có nhãn mã thường trong phiên theo tảng. */
  nhanThuong: HaiThuTieng[];
  /** Có nhật ký cân để đối chiếu không, và lần gửi gần nhất. */
  nhatKy: HaiThuTieng;
}

const msCua = (iso: string | null | undefined): number | null => {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : null;
};
const gioPhut = (iso: string | null | undefined): string => {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? gioVnTuMs(t).slice(11, 16) : '—';
};

/**
 * Số liệu kho_phien_pha_can → các dòng trang pha lóc hiện (hàm thuần — test bằng node). Không bao giờ nói "Cân sẵn
 * sàng" khi chưa máy quầy nào báo đúng TÊN MỚI (tên + số tảng) cho mã ô: tên cũ trên cân = tem in ra sai tảng. 0080: dòng
 * máy quầy đánh dấu chua_xac_nhan (Beeftown Cân 2.9.3 — cân có thể đang khác dòng đó: lần gửi chưa đọc lại được, đọc lại lệch)
 * chưa đủ để nói "sẵn sàng" (rà soát 11/10/2026: 2.9.2 báo tên mới sau một lần gửi cân bỏ qua).
 */
export function tomTatCanPhien(cp: CanPhien): TomTatCan {
  const bayGio = Date.parse(cp.luc);
  const coMay = cp.may.length > 0;
  const dong: DongCanO[] = cp.o.map(o => {
    const tenMuon = tenTheoTang(o.ten_hang, o.dang_giu ? o.so_tang : null);
    let muc: MucCan | null = null;
    let cau: HaiThuTieng | null = null;
    if (o.dang_giu) {
      const muon = chuanTenCan(tenMuon);
      const dungTen = (t: TrenCanO) => chuanTenCan(String(t.ten ?? '')) === muon;
      // Dòng cân đã xác nhận trước; chỉ dòng mang cờ chưa xác nhận có đúng tên thì "chưa chắc".
      const dung = o.tren_can.find(t => dungTen(t) && t.chua_xac_nhan !== true);
      const chuaChac = dung ? undefined : o.tren_can.find(dungTen);
      const cu = o.tren_can[0];
      if (dung) {
        muc = 'san_sang';
        const phim = (dung.phim ?? []).filter(Boolean);
        const p = phim.length
          ? { vi: ` · phím ${phim.join(', ')}`, en: ` · key ${phim.join(', ')}` }
          : { vi: ' · chưa gán phím tắt (gán ở thẻ Phím tắt của Beeftown Cân)', en: ' · no shortcut key yet (set it on the Keys tab of Beeftown Scale)' };
        const bao = msCua(dung.bao_luc);
        const cuQua = bao !== null && bayGio - bao > PHUT_BAO_CAN_CU * 60000
          ? { vi: ` (máy quầy báo ${tuTruoc(bayGio, bao).vi})`, en: ` (counter computer reported ${tuTruoc(bayGio, bao).en})` } : { vi: '', en: '' };
        cau = { vi: `Cân sẵn sàng: ${tenMuon} = PLU ${dung.plu}${p.vi}${cuQua.vi}`,
                en: `Scale ready: ${tenMuon} = PLU ${dung.plu}${p.en}${cuQua.en}` };
      } else if (chuaChac) {
        muc = 'chua_xac_nhan';
        const p = chuaChac.plu;
        cau = {
          vi: `Chưa chắc cân đã có ${tenMuon} (PLU ${p}): lần gửi gần nhất của Beeftown Cân chưa được cân xác nhận — chưa in tem; chờ Beeftown Cân gửi lại rồi bấm Xem lại cân, hoặc gọi PLU ${p} trên cân thấy đúng tên mới in`,
          en: `Not sure the scale has ${tenMuon} (PLU ${p}): Beeftown Scale's latest send has not been confirmed by the scale — do not print yet; wait for Beeftown Scale to resend and press Check the scale again, or call PLU ${p} on the scale and print only if the name is right`,
        };
      } else if (cu) {
        muc = 'ten_cu';
        cau = { vi: `Cân còn tên cũ "${cu.ten}" (PLU ${cu.plu}) — chưa in tem; chờ Beeftown Cân gửi tên ${tenMuon}`,
                en: `The scale still shows the old name "${cu.ten}" (PLU ${cu.plu}) — do not print yet; wait for Beeftown Scale to send ${tenMuon}` };
      } else if (coMay) {
        muc = 'chua_len';
        cau = { vi: `Chưa lên cân: mã ô ${o.ma_can} chưa có trên cân — chưa in tem; chờ Beeftown Cân gửi ${tenMuon}`,
                en: `Not on the scale yet: slot code ${o.ma_can} is not on the scale — do not print yet; wait for Beeftown Scale to send ${tenMuon}` };
      } else {
        muc = 'khong_biet';
        cau = { vi: `Không biết cân đã có ${tenMuon} chưa — chưa máy quầy nào báo về kho (cần Beeftown Cân 2.9). Quản lý mở Beeftown Cân bấm Gửi xuống cân, xem trên cân đúng tên rồi mới in tem`,
                en: `Unknown whether the scale has ${tenMuon} — no counter computer has reported (needs Beeftown Scale 2.9). A manager opens Beeftown Scale and presses Send to scale; check the name on the scale before printing` };
      }
    }
    const soIn = Number(o.in) || 0, soQuet = Number(o.quet) || 0;
    const doiChieu: HaiThuTieng = soIn === soQuet
      ? { vi: `Cân in ${soIn} tem mã ${o.ma_can}, phiên quét ${soQuet} — khớp`, en: `Scale printed ${soIn} labels with code ${o.ma_can}, session scanned ${soQuet} — match` }
      : soIn > soQuet
        ? { vi: `Cân in ${soIn} tem mã ${o.ma_can}, phiên quét ${soQuet} — ${soIn - soQuet} tem chưa quét (in lại, in hỏng, hay quên quét?)`,
            en: `Scale printed ${soIn} labels with code ${o.ma_can}, session scanned ${soQuet} — ${soIn - soQuet} not scanned (reprinted, misprinted, or missed?)` }
        : { vi: `Cân in ${soIn} tem mã ${o.ma_can}, phiên quét ${soQuet} — nhật ký cân chưa đủ (máy quầy chưa gửi, hay in ở cân khác)`,
            en: `Scale printed ${soIn} labels with code ${o.ma_can}, session scanned ${soQuet} — the scale log is incomplete (not sent yet, or printed on another scale)` };
    return { giao_id: o.giao_id, ten_hang: o.ten_hang, so_o: o.so_o, ma_can: o.ma_can, tenMuon, muc, cau, soIn, soQuet, doiChieu };
  });

  let may: HaiThuTieng | null = null;
  if (cp.o.some(o => o.dang_giu)) {
    if (!coMay) {
      may = { vi: 'Chưa máy quầy nào chạy Beeftown Cân 2.9 báo về kho — trang không biết cân đã đổi tên chưa.',
              en: 'No counter computer running Beeftown Scale 2.9 has reported — this page cannot tell whether the scale has the new names.' };
    } else {
      const bao = msCua(cp.may[0].bao_luc);
      const lanCuoi = bao === null ? { vi: '', en: '' } : { vi: ` (báo ${tuTruoc(bayGio, bao).vi})`, en: ` (reported ${tuTruoc(bayGio, bao).en})` };
      may = cp.may.some(x => x.tu_gui)
        ? { vi: `Beeftown Cân ở quầy tự gửi tên mới xuống cân sau khoảng 15–60 giây${lanCuoi.vi} — bấm Xem lại cân để thấy cân đã nhận chưa.`,
            en: `Beeftown Scale at the counter sends new names to the scale within about 15–60 seconds${lanCuoi.en} — press Check the scale again to see whether it has them.` }
        : { vi: `Tự gửi đang tắt ở máy quầy${lanCuoi.vi} — quản lý mở Beeftown Cân, bấm Gửi xuống cân (hay bật Tự gửi ở Cài đặt).`,
            en: `Automatic sending is off on the counter computer${lanCuoi.en} — a manager opens Beeftown Scale and presses Send to scale (or turns on automatic sending in Settings).` };
      // 0080: máy quầy báo lần gửi gần nhất cân chưa xác nhận (chưa đọc lại được cân, đọc lại lệch, xoá qua WiFi hỏng).
      const chuaXn = cp.may.filter(x => x.chua_xac_nhan === true);
      if (chuaXn.length) {
        const tuMs = chuaXn.map(x => msCua(x.chua_xac_nhan_tu)).filter((t): t is number => t !== null);
        const k = tuMs.length ? khoangThoiGian((bayGio - Math.min(...tuMs)) / 60000) : null;
        const tu = k ? { vi: ` (đã ${k.vi})`, en: ` (for ${k.en})` } : { vi: '', en: '' };
        may = { vi: `${may.vi} Lần gửi gần nhất của Beeftown Cân chưa được cân xác nhận${tu.vi} — xem câu báo ở ô Cân của Beeftown Cân (phần mềm của hãng đang mở thì đóng lại).`,
                en: `${may.en} Beeftown Scale's latest send has not been confirmed by the scale${tu.en} — read the Scale box in Beeftown Scale (close the manufacturer's software if it is open).` };
      }
    }
  }

  const tenO = new Map(dong.filter(d => d.muc !== null).map(d => [cp.o.find(o => o.giao_id === d.giao_id)?.mat_hang_id, d.tenMuon]));
  const nhanThuong = cp.theo_tang ? cp.nhan_thuong.map(n => {
    const o = tenO.get(n.mat_hang_id);
    const kg = dinhDangKg(n.so_kg, 'vi'), kgEn = dinhDangKg(n.so_kg, 'en');
    const lam: HaiThuTieng = o
      ? { vi: ` In lại bằng phím ô của phiên (${o}), bấm −1 để bỏ nhãn cũ.`,
          en: ` Reprint with this session's slot key (${o}) and press −1 to drop the old ones.` }
      : { vi: ' Giao ô mã rồi in lại bằng phím ô, bấm −1 để bỏ nhãn cũ.',
          en: ' Assign rotating codes, reprint with the slot key and press −1 to drop the old ones.' };
    return {
      vi: `${n.so_nhan} nhãn ${n.ten} (${kg} kg) in bằng mã thường ${n.ma_can} — tem không có số tảng, khi bán kho không biết thuộc tảng nào.${lam.vi}`,
      en: `${n.so_nhan} ${n.ten} label${n.so_nhan === 1 ? '' : 's'} (${kgEn} kg) printed with the regular code ${n.ma_can} — no primal number on the label, so sales cannot be traced to this primal.${lam.en}`,
    };
  }) : [];

  const nhatKyLuc = cp.may.map(m => m.nhat_ky_luc).filter((x): x is string => !!x).sort().at(-1) ?? null;
  const nhatKy: HaiThuTieng = nhatKyLuc
    ? { vi: `Nhật ký cân gửi lên kho lần cuối lúc ${gioPhut(nhatKyLuc)} — tem in sau đó chưa tính.`,
        en: `The scale log last reached the stock system at ${gioPhut(nhatKyLuc)} — labels printed after that are not counted yet.` }
    : { vi: 'Chưa có nhật ký cân nào gửi lên kho (cần Beeftown Cân 2.9) — số tem cân in là 0 không có nghĩa cân chưa in.',
        en: 'No scale log has reached the stock system yet (needs Beeftown Scale 2.9) — 0 printed labels does not mean nothing was printed.' };
  return { dong, may, nhanThuong, nhatKy };
}
