/**
 * BÁO ĐỘNG — SOẠN TIN (thuần)
 * ===========================
 *
 * Một lượt = MỘT tin. Câu của từng đèn lấy NGUYÊN từ danhGiaSucKhoe() (suc-khoe.ts): đúng câu
 * chủ thấy trên bảng, chỉ có số đếm và mốc giờ — không tên khách, không số điện thoại, không
 * câu lỗi thô. Tên chi nhánh lấy từ số liệu. Tin dài quá giới hạn của kênh thì bỏ bớt mục cuối
 * và ghi "và N mục khác — mở bảng sức khỏe để xem đủ".
 *
 * Tiếng Việt mặc định; tiếng Anh khi chọn. Mọi câu nằm trong { vi, en } —
 * crm/test/test-noi-bo-tieng-anh.mjs quét file này.
 */

import { gioVnTuMs } from './gio-vn.ts';
import type { HaiThuTieng, NgonNguNB } from './ngon-ngu-noi-bo';
import type { Den, SucKhoe } from './suc-khoe.ts';
import { TIN_TOI_DA_MOI_DEN, type KeHoach, type SuCo } from './bao-dong-chinh-sach.ts';

export type LoaiMuc = 'moi_do' | 'dang_do' | 'het_do';

export interface MucTin {
  khoa: string;
  loai: LoaiMuc;
  /** Một dòng của tin, bắt đầu bằng "• ". */
  dong: string;
}

export interface Tin {
  /** Dòng đầu. */
  tieuDe: string;
  /** Mọi mục của kế hoạch, kể cả mục bị bỏ vì quá dài. */
  muc: MucTin[];
  /** Cả tin, đã cắt cho vừa kênh, chữ có dấu dạng NFC. */
  vanBan: string;
  /** Số mục bị bỏ vì tin quá dài. */
  soMucBoBot: number;
}

export interface DauVaoTin {
  keHoach: KeHoach;
  /** Đánh giá của lượt này; null khi không đọc được số liệu. */
  sk: SucKhoe | null;
  nn: NgonNguNB;
  /** Tên kênh (cho tin "đã nối kênh"). */
  tenKenh: string;
  gioiHanKyTu: number;
  /** Gốc website, không có "/" cuối — link mở bảng sức khỏe. */
  web: string;
  /** now() của database — giờ ghi trong tin. */
  luc: string;
}

type Cau = HaiThuTieng<string>;
const s = (n: number) => (n === 1 ? '' : 's');
const so = (n: number, nn: NgonNguNB) => n.toLocaleString(nn === 'vi' ? 'vi-VN' : 'en-US');

const CAU = {
  dangDo:     { vi: 'Đang đỏ:', en: 'Red now:' },
  moiDo:      { vi: 'Mới đỏ:', en: 'Newly red:' },
  hetDo:      { vi: 'Hết đỏ:', en: 'No longer red:' },
  khongDo:    { vi: 'Không có mục nào đỏ.', en: 'Nothing is red.' },
  khongDoNoi: { vi: 'Hiện không có mục nào đỏ.', en: 'Nothing is red right now.' },
  daOn:       { vi: 'đã ổn lại.', en: 'back to normal.' },
  daTat:      { vi: 'đã tắt.', en: 'turned off.' },
  conVang:    { vi: 'hết đỏ, còn cần xem hôm nay', en: 'no longer red, still to check today' },
  khongRo:    { vi: 'đang đỏ — mở bảng sức khỏe để xem vì sao.', en: 'red — open the health panel to see why.' },
  chiNhanh:   { vi: 'Chi nhánh', en: 'Branch' },
  muTen:      { vi: 'Báo động', en: 'Alerts' },
  mu:         { vi: 'không đọc được số liệu sức khỏe hệ thống — đèn nào chuyển đỏ lúc này sẽ không được báo. Báo người quản trị kỹ thuật.',
                en: 'the system health data cannot be read — lights turning red now will not be reported. Tell the technical admin.' },
  tranTin:    { vi: `đã báo mục này ${TIN_TOI_DA_MOI_DEN} lần từ 8 giờ sáng — sẽ không nhắn riêng nữa tới bản tóm tắt 8 giờ sáng`,
                en: `reported ${TIN_TOI_DA_MOI_DEN} times since 8 AM — no more separate messages about it until the 8 AM summary` },
  cuoiSang:   { vi: 'Không thấy tin này lúc 8 giờ sáng nghĩa là hệ thống báo động đang hỏng.',
                en: 'No message like this at 8 AM means the alert system itself is broken.' },
  cuoiNoi:    { vi: 'Từ giờ, đèn sức khỏe chuyển đỏ sẽ được báo ở đây. 8 giờ sáng mỗi ngày có một tin tóm tắt — không thấy tin đó nghĩa là hệ thống báo động đang hỏng.',
                en: 'From now on, health lights turning red are reported here. A summary comes at 8 AM every day — no summary means the alert system itself is broken.' },
} as const satisfies Record<string, Cau>;

/** Tên khối + đèn cho một sự cố: "Beeftown Quận 1 · Sổ kho", hoặc chỉ tên đèn nếu là đèn cả thương hiệu. */
function tenMuc(sc: SuCo, sk: SucKhoe | null, nn: NgonNguNB): { ten: string; den: Den | null } {
  if (sc.ma_den === 'doc_so_lieu') return { ten: CAU.muTen[nn], den: null };
  const khoi = sk?.khoi.find(k => k.ma === (sc.chi_nhanh_id ?? 'thuong_hieu')) ?? null;
  const den = khoi?.den.find(d => d.ma === sc.ma_den) ?? null;
  const tenDen = den?.ten ?? sc.ma_den;
  if (sc.chi_nhanh_id === null) return { ten: tenDen, den };
  return { ten: `${khoi?.ten || CAU.chiNhanh[nn]} · ${tenDen}`, den };
}

function dongDo(sc: SuCo, sk: SucKhoe | null, nn: NgonNguNB, chamTran: boolean): string {
  const { ten, den } = tenMuc(sc, sk, nn);
  const cau = sc.ma_den === 'doc_so_lieu' ? CAU.mu[nn] : den && den.mau === 'do' ? den.cau : CAU.khongRo[nn];
  return `• ${ten}: ${cau}${chamTran ? ` (${CAU.tranTin[nn]})` : ''}`;
}

function dongHet(sc: SuCo, sk: SucKhoe | null, nn: NgonNguNB): string {
  const { ten, den } = tenMuc(sc, sk, nn);
  if (sc.mau_sau === 'vang') return `• ${ten}: ${CAU.conVang[nn]}${den && den.mau === 'vang' ? ` — ${den.cau}` : '.'}`;
  if (sc.mau_sau === 'tat') return `• ${ten}: ${CAU.daTat[nn]}`;
  return `• ${ten}: ${CAU.daOn[nn]}`;
}

function tieuDe(v: DauVaoTin, soDo: number): string {
  const { keHoach: kh, nn } = v;
  const gio = gioVnTuMs(Date.parse(v.luc));
  const ngay = `${gio.slice(8, 10)}/${gio.slice(5, 7)}`;
  if (kh.tomTat === 'noi_kenh') {
    return { vi: `Beeftown — đã nối kênh báo động (${v.tenKenh})`, en: `Beeftown — alert channel connected (${v.tenKenh})` }[nn];
  }
  if (kh.tomTat === 'sang') {
    return soDo === 0
      ? { vi: `Beeftown — tóm tắt 8 giờ sáng ${ngay}: mọi thứ ổn`, en: `Beeftown — 8 AM summary ${ngay}: all good` }[nn]
      : { vi: `Beeftown — tóm tắt 8 giờ sáng ${ngay}: ${so(soDo, nn)} mục đang đỏ`,
          en: `Beeftown — 8 AM summary ${ngay}: ${so(soDo, nn)} red item${s(soDo)}` }[nn];
  }
  const phan: string[] = [];
  const m = kh.moiDo.length, h = kh.hetDo.length;
  if (m > 0) phan.push({ vi: `${so(m, nn)} mục mới đỏ`, en: `${so(m, nn)} new red item${s(m)}` }[nn]);
  if (h > 0) phan.push({ vi: `${so(h, nn)} mục hết đỏ`, en: `${so(h, nn)} item${s(h)} no longer red` }[nn]);
  return `Beeftown ${gio.slice(11, 16)} — ${phan.join(' · ')}`;
}

/**
 * Kế hoạch của lượt → một tin. Gọi khi keHoach.coTin. Không bao giờ ném lỗi; tin luôn vừa
 * gioiHanKyTu (giới hạn quá nhỏ thì cắt cứng, kết thúc bằng "…").
 */
export function soanTin(v: DauVaoTin): Tin {
  const { keHoach: kh, sk, nn } = v;
  const chamTran = new Set(kh.chamTran);
  const tomTat = kh.tomTat !== null;

  // Các phần: [tiêu đề phần, mục…]. Tóm tắt liệt kê MỌI mục đang đỏ; tin thường chỉ mục mới.
  const phan: { dau: string; muc: MucTin[] }[] = [];
  const doMuc: MucTin[] = (tomTat ? kh.dangDo : kh.moiDo).map(sc => ({
    khoa: sc.khoa, loai: tomTat ? 'dang_do' : 'moi_do',
    dong: dongDo(sc, sk, nn, !tomTat && chamTran.has(sc.khoa)),
  }));
  if (doMuc.length > 0) phan.push({ dau: (tomTat ? CAU.dangDo : CAU.moiDo)[nn], muc: doMuc });
  const hetMuc: MucTin[] = kh.hetDo.map(sc => ({ khoa: sc.khoa, loai: 'het_do', dong: dongHet(sc, sk, nn) }));
  if (hetMuc.length > 0) phan.push({ dau: CAU.hetDo[nn], muc: hetMuc });

  const dau = tieuDe(v, kh.dangDo.length);
  const giua: string[] = [];
  if (kh.tomTat !== null && doMuc.length === 0) giua.push((kh.tomTat === 'noi_kenh' ? CAU.khongDoNoi : CAU.khongDo)[nn]);
  const soVang = sk ? sk.soVang : 0;
  if (tomTat && soVang > 0) {
    giua.push({ vi: `${so(soVang, nn)} mục vàng cần xem hôm nay.`, en: `${so(soVang, nn)} yellow item${s(soVang)} to check today.` }[nn]);
  }
  const cuoi: string[] = [];
  if (kh.tomTat === 'sang') cuoi.push(CAU.cuoiSang[nn]);
  if (kh.tomTat === 'noi_kenh') cuoi.push(CAU.cuoiNoi[nn]);
  cuoi.push({ vi: `Mở bảng sức khỏe: ${v.web}/noi-bo`, en: `Open the health panel: ${v.web}/noi-bo` }[nn]);

  const tatCa = phan.flatMap(p => p.muc);
  const dung = (giu: number) => {
    const dong: string[] = [dau];
    let con = giu;
    for (const p of phan) {
      const lay = p.muc.slice(0, Math.max(0, con));
      con -= lay.length;
      if (lay.length > 0) dong.push(p.dau, ...lay.map(m => m.dong));
    }
    const bo = tatCa.length - giu;
    if (bo > 0) {
      dong.push({ vi: `… và ${so(bo, nn)} mục khác — mở bảng sức khỏe để xem đủ.`,
                  en: `… and ${so(bo, nn)} more item${s(bo)} — open the health panel to see all.` }[nn]);
    }
    return [...dong, ...giua, ...cuoi].join('\n').normalize('NFC');
  };

  const gioiHan = Math.max(0, Math.floor(v.gioiHanKyTu));
  let giu = tatCa.length;
  let vanBan = dung(giu);
  while (vanBan.length > gioiHan && giu > 0) vanBan = dung(--giu);
  if (vanBan.length > gioiHan) vanBan = gioiHan > 0 ? `${vanBan.slice(0, gioiHan - 1)}…` : '';
  return { tieuDe: dau, muc: tatCa, vanBan, soMucBoBot: tatCa.length - giu };
}
