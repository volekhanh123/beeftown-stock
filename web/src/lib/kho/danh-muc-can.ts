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
 *      han_dung − hôm nay. Phiên lóc còn nháp (chưa có lô đầu ra — cân in tem
 *      mã ô trong lúc lóc, quét vào phiên sau): hạn của lô phần cắt SẼ sinh ra
 *      lúc chốt, đúng công thức 0033 — coalesce(ra.han_dung, least(ngày lóc +
 *      hạn của món, hạn sớm nhất của tảng vào)) (hanLoRaDuKien). Không lấy lô
 *      cũ của món (gói này không thuộc lô đó) hay hôm nay + hạn của món (ngày
 *      lóc ≤ hôm nay). Ngày lóc, dòng ra, hạn tảng đọc thẳng (docPhienLocHsd,
 *      o-ma.ts — tảng đã hết tồn vẫn chặn); không đọc được → không in HSD.
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
 * 03/10", "tảng #0142 · hết hạn 03/10", "tảng #0150 đang lóc · phiên PL0012
 * lóc 28/09 + 3 ngày · hết hạn 01/10", "theo hạn dùng của món (chưa có lô)".
 * In HSD: chưa thử trên cân thật.
 *
 * ghepHangChoCan không kèm dữ liệu lô (tham số hsd) thì như trước bản này:
 * món không mang HSD (undefined — cân giữ nguyên cột ngày), ô mã và mã giảm
 * tắt HSD (null). hangChoCan luôn kèm.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { HangKho } from './can-tma.ts';
import type { HaiThuTieng } from './chung.ts';
import type { MatHang } from './danh-muc.ts';
import { congNgay, homNayVn, laNgayCoThat } from '../gio-vn.ts';
import { docGiaoOMa, docOMa, docPhienLocHsd, type DongOMa, type GiaoOMa, type PhienLocHsd } from './o-ma.ts';
import { docMaGiam, giaGiam, tenGiam, type DongMaGiam } from './ma-giam.ts';
import { soTangChu } from './tang.ts';
import { docLoConTon, type LoTon } from './ton.ts';

export type { LoTon, PhienLocHsd };

export const TEN_CAN_TOI_DA = 24;

/** "Thăn ngoại cắt lát" + 142 → "Thăn ngoại cắt lát #0142", cắt tên cho vừa 24 ký tự. */
export function tenTheoTang(ten: string, soTang: number | null | undefined): string {
  const duoi = soTangChu(soTang);
  if (!duoi) return ten;
  const chu = [...ten.trim()];
  const toiDa = Math.max(TEN_CAN_TOI_DA - duoi.length - 1, 1);
  const goc = chu.length > toiDa ? chu.slice(0, toiDa).join('').trimEnd() : chu.join('');
  return `${goc} ${duoi}`;
}

// -----------------------------------------------------------------------------
// HẠN DÙNG TỪNG DÒNG (xem đầu file)
// -----------------------------------------------------------------------------
/**
 * Dữ liệu để tính HSD: hôm nay theo giờ VN ('YYYY-MM-DD' — homNayVn()), các lô còn tồn ở chi nhánh của cân, và phiên
 * lóc còn nháp của các ô đang giữ (theo id — docPhienLocHsd). Thiếu phiên của một ô → ô đó không in HSD.
 */
export interface DuLieuHsd { homNay: string; lo: LoTon[]; phien?: Map<string, PhienLocHsd> }

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

/** Hạn dự kiến của lô ra, và nó đến từ đâu: dòng ra (ra.han_dung), hạn tảng, hay ngày lóc + hạn của món. */
export interface HanLoRa { han: string; theo: 'ra' | 'tang' | 'ngay_pha' }

/**
 * Hạn của lô phần cắt `matHangId` mà phiên lóc còn nháp `p` SẼ sinh ra lúc chốt — đúng công thức kho_chot_phien_pha
 * (0033): coalesce(ra.han_dung, least(ngay_pha + han_dung_ngay, hạn sớm nhất của tảng vào)). Món không có hạn dùng: bỏ
 * vế ngày lóc (0033 coi là 3.650 ngày). Nhiều dòng ra cùng món (mỗi dòng một lô) → hạn SỚM NHẤT; dòng "bỏ" không sinh lô,
 * không tính; chưa có dòng ra nào (tem in trước, quét vào sau) → công thức với ngày lóc. Thiếu phiên, ngày lóc hay hạn
 * tảng → null (không in HSD — không đoán).
 */
export function hanLoRaDuKien(p: PhienLocHsd | undefined, matHangId: string, hanDungNgay: number | null | undefined): HanLoRa | null {
  if (!p || soNgayLich(p.ngay_pha) === null) return null;
  const macDinh = (): HanLoRa | null => {
    if (p.han_tang === null || soNgayLich(p.han_tang) === null) return null;
    const tang = p.han_tang.slice(0, 10);
    if (hanDungNgay === null || hanDungNgay === undefined || !Number.isInteger(hanDungNgay)) return { han: tang, theo: 'tang' };
    const theoNgay = congNgay(p.ngay_pha.slice(0, 10), hanDungNgay);
    return theoNgay < tang ? { han: theoNgay, theo: 'ngay_pha' } : { han: tang, theo: 'tang' };
  };
  const dong = p.ra.filter(r => r.mat_hang_id === matHangId && r.xu_ly !== 'bo');
  if (!dong.length) return macDinh();
  let som: HanLoRa | null = null;
  for (const r of dong) {
    const h: HanLoRa | null = r.han_dung && soNgayLich(r.han_dung) !== null ? { han: r.han_dung.slice(0, 10), theo: 'ra' } : macDinh();
    if (!h) return null;
    if (!som || h.han < som.han) som = h;
  }
  return som;
}

/**
 * HSD của một ô mã (quy tắc 1): tảng đang giữ ô và lô đầu ra đã có → hạn lô đó − homNay. Phiên lóc còn nháp (ô giữ mà
 * chưa có lô ra) → hạn của lô sẽ sinh ra lúc chốt (hanLoRaDuKien, phiên tìm trong `phien`) − homNay; không đọc được →
 * không in. Ô trống như món (tinhHsdMon).
 */
export function tinhHsdO(m: Pick<MatHang, 'id' | 'han_dung_ngay'>, giu: GiaoOMa | undefined, loSom: LoTon | undefined,
                         phien: Map<string, PhienLocHsd>, homNay: string): HsdDong {
  const tang = (g: GiaoOMa): HaiThuTieng => (g.so_tang !== null && g.so_tang !== undefined
    ? { vi: `tảng ${soTangChu(g.so_tang)}`, en: `primal ${soTangChu(g.so_tang)}` }
    : { vi: `tảng lô ${g.ma_lo_tang ?? '?'}`, en: `primal lot ${g.ma_lo_tang ?? '?'}` });
  if (giu && giu.han_dung && soNgayLich(giu.han_dung) !== null) {
    const t = tang(giu), dm = ngayNgan(giu.han_dung);
    return tuUngVien({ han: giu.han_dung, nguon: { vi: `${t.vi} · hết hạn ${dm}`, en: `${t.en} · use-by ${dm}` },
                       ten: { vi: `Lô của ${t.vi}`, en: `The lot from ${t.en}` } }, homNay);
  }
  if (giu && !giu.lo_id) {
    // Phiên còn nháp (con_giu mà chưa có lô ra): gói in lúc này thuộc lô SẼ sinh ra lúc chốt.
    const t = tang(giu);
    const p = phien.get(giu.phien_pha_id);
    const du = hanLoRaDuKien(p, m.id, m.han_dung_ngay);
    if (!p || !du) {
      return { soNgay: null, nguon: { vi: `${t.vi} đang lóc · không đọc được phiên lóc — không in HSD`,
                                      en: `${t.en} being broken down · the breakdown session could not be read — no use-by printed` },
               canhBao: { vi: `Không đọc được phiên lóc của ${t.vi} (ngày lóc, hạn tảng) — ô này không in HSD. Mở phiên lóc xem còn tảng vào, rồi xem lại.`,
                          en: `Could not read the breakdown session of ${t.en} (cutting date, primal use-by) — this slot prints no use-by. Open the session, check it still has its primal, then preview again.` } };
    }
    const dm = ngayNgan(du.han), pha = ngayNgan(p.ngay_pha);
    const nguon: HaiThuTieng = du.theo === 'tang'
      ? { vi: `${t.vi} đang lóc · hết hạn ${dm}`, en: `${t.en} being broken down · use-by ${dm}` }
      : du.theo === 'ngay_pha'
        ? { vi: `${t.vi} đang lóc · phiên ${p.so_phieu} lóc ${pha} + ${m.han_dung_ngay} ngày · hết hạn ${dm}`,
            en: `${t.en} being broken down · session ${p.so_phieu} cut on ${pha} + ${m.han_dung_ngay} days · use-by ${dm}` }
        : { vi: `${t.vi} đang lóc · hạn ghi ở phiên ${p.so_phieu} · hết hạn ${dm}`,
            en: `${t.en} being broken down · use-by set on session ${p.so_phieu} · ${dm}` };
    const ten: HaiThuTieng = du.theo === 'tang'
      ? { vi: `${t.vi[0].toUpperCase()}${t.vi.slice(1)} đang lóc`, en: `${t.en[0].toUpperCase()}${t.en.slice(1)} being broken down` }
      : { vi: `Lô lóc từ ${t.vi}`, en: `The lot cut from ${t.en}` };
    return tuUngVien({ han: du.han, nguon, ten }, homNay);
  }
  return tinhHsdMon(m, loSom, homNay);
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
 * hsd: hôm nay (giờ VN) + lô còn tồn ở chi nhánh + phiên lóc nháp của ô đang giữ — tính HSD từng dòng (xem đầu file).
 * Không có thì như trước bản này: món không mang HSD, ô mã và mã giảm tắt HSD.
 */
export function ghepHangChoCan(matHang: MatHang[], oMa: Map<string, DongOMa[]>, giao: GiaoOMa[],
                               maGiam: DongMaGiam[] = [], hsd?: DuLieuHsd): HangKho[] {
  if (hsd && soNgayLich(hsd.homNay) === null) throw new Error(LOI_HOM_NAY.vi);
  const giu = giao.filter(g => g.con_giu);
  const tangCuaO = new Map(giu.map(g => [g.o_ma_id, g.so_tang]));
  const giuCuaO = new Map(giu.map(g => [g.o_ma_id, g]));
  const loSom = hsd ? loSomNhatTheoMon(hsd.lo) : new Map<string, LoTon>();
  const phien = hsd?.phien ?? new Map<string, PhienLocHsd>();

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
        ...(hsd ? theoHsd(tinhHsdO(m, giuCuaO.get(o.id), loSom.get(m.id), phien, hsd.homNay)) : { han_dung_ngay: null }),
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
 * Đọc từ kho rồi ghép — dùng ở màn Đồng bộ cân và Beeftown Cân, bằng client của người đã đăng nhập (quản lý / chủ).
 * Ô đang giữ mà chưa có lô ra (phiên lóc còn nháp): đọc thêm phiên đó (docPhienLocHsd). "Hôm nay" (giờ VN) lấy SAU khi
 * đọc xong: đọc vắt qua nửa đêm thì số ngày tính cho ngày mới (ngắn hơn), không tính cho hôm qua (HSD in ra muộn thêm
 * 1 ngày).
 */
export async function hangChoCan(client: SupabaseClient, chiNhanhId: string, matHang: MatHang[]): Promise<HangKho[]> {
  const [oMa, giao, maGiam, lo] = await Promise.all([
    docOMa(client), docGiaoOMa(client, chiNhanhId), docMaGiam(client), docLoConTon(client, chiNhanhId),
  ]);
  const phien = await docPhienLocHsd(client, giao.filter(g => g.con_giu && !g.lo_id).map(g => g.phien_pha_id));
  return ghepHangChoCan(matHang, oMa, giao, maGiam, { homNay: homNayVn(), lo, phien });
}
