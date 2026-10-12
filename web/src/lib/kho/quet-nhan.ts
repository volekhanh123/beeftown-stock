/**
 * KHO — MÀN QUÉT NHÃN: LÀM ĐƯỢC GÌ VỚI KHAY CẦM TRÊN TAY
 *
 * Màn Quét nhãn (pages/noi-bo/kho/quet.astro) hiện ba nút lớn — Ra quầy · Đưa bếp · Báo hủy — và các câu lưu ý về
 * chính khay vừa quét. Luật chọn nằm ở đây, là hàm thuần, để chạy thử được (crm/test/test-kho-tra-ma-can.mjs nhóm 7)
 * thay vì chỉ dò chữ trong trang.
 *
 * Nhãn in bằng Ô MÃ mang theo tảng nó cắt ra (o-ma.ts, tra-ma-can.ts oDangGiao): các nút mở ĐÚNG lô của tảng đó khi lô
 * còn hàng ở nơi làm được việc (kho, quầy — ton.ts viecVoiLo). Nhãn khác (mã của món, mã giảm giá, ô đang trống) thì
 * lấy lô hạn gần trước như cũ.
 *
 * LÔ CỦA TẢNG TRÊN NHÃN ĐÃ HẾT HẠN → khay cầm trên tay cũng hết hạn: chỉ còn Báo hủy, không mời Ra quầy / Đưa bếp
 * bằng một lô khác còn hạn. Biết hết hạn bằng HAI đường: dòng tồn của lô đó (kho_v_ton.tinh_trang_han), hoặc — khi sổ
 * không còn dòng nào của lô ở kho / quầy (sổ lệch với kệ, lô đã sang chờ hủy) — hạn dùng của lô mà ô đang gắn
 * (kho_can_giao_o_ma.han_dung) so với hôm nay giờ Việt Nam. Hạn dùng đúng hôm nay thì chưa hết hạn, như kho_v_ton.
 */

import { viecVoiLo, type DongTon } from './ton.ts';

/** Phần của ô đang giao mà màn Quét nhãn cần (o-ma.ts GiaoOMa). `lo_id` null = phiên lóc của tảng chưa chốt. */
export interface OCuaNhan { lo_id: string | null; han_dung?: string | null }

/** Câu lưu ý về khay cầm trên tay — trang viết thành chữ, theo đúng thứ tự trong mảng. */
export type LuuYNhan =
  /** Phiên lóc của tảng chưa chốt nên khay chưa vào sổ. */
  | 'chua_chot'
  /** Khay thuộc lô đã hết hạn — để riêng, báo hủy. */
  | 'het_han'
  /** Sổ không còn khay nào của tảng này ở kho hay quầy. */
  | 'het_tang';

export interface ViecChoNhan {
  /** Các dòng tồn thuộc lô của tảng in trên nhãn (trang đưa lên đầu và đánh dấu). */
  loCuaNhan: DongTon[];
  /** Khay cầm trên tay thuộc lô ĐÃ HẾT HẠN: trang chỉ còn mời Báo hủy. */
  nhanHetHan: boolean;
  /** Hạn dùng (YYYY-MM-DD) của lô đã hết hạn đó — để viết câu; null khi khay chưa hết hạn. */
  hanHet: string | null;
  /** Lô mở sẵn cho nút Ra quầy — undefined: không hiện nút (không có lô trong kho, hoặc khay đã hết hạn). */
  loRaQuay: DongTon | undefined;
  /** Lô mở sẵn cho nút Đưa bếp — undefined: mở phiếu theo món. Trang không hiện nút này khi `nhanHetHan`. */
  loDuaBep: DongTon | undefined;
  /** Lô mở sẵn cho nút Báo hủy — undefined: mở phiếu theo món. */
  loBaoHuy: DongTon | undefined;
  luuY: LuuYNhan[];
}

/**
 * `ton`: các dòng tồn của MÓN trên nhãn, đã bỏ chỗ chờ hủy, xếp hạn gần trước (ton.ts docTon).
 * `oCuaNhan`: ô của nhãn đang giao cho tảng nào — null khi nhãn không phải mã ô, hoặc ô đang trống.
 * `laQuay`: NV quầy ưu tiên dòng ở quầy, người khác ưu tiên dòng trong kho.
 * `homNay`: hôm nay theo giờ Việt Nam (gio-vn.ts homNayVn, YYYY-MM-DD).
 */
export function viecChoNhan(
  ton: readonly DongTon[], oCuaNhan: OCuaNhan | null, tuy: { laQuay: boolean; homNay: string },
): ViecChoNhan {
  const loNhan = oCuaNhan?.lo_id ?? null;
  const loCuaNhan = loNhan ? ton.filter(l => l.lo_id === loNhan) : [];
  const daHetHan = (l: DongTon) => l.tinh_trang_han === 'het_han';

  const dongHetHan = loCuaNhan.find(daHetHan);
  const hetHanTheoO = !!loNhan && loCuaNhan.length === 0 && !!oCuaNhan?.han_dung && oCuaNhan.han_dung < tuy.homNay;
  const nhanHetHan = !!dongHetHan || hetHanTheoO;
  const hanHet = dongHetHan?.han_dung ?? (hetHanTheoO ? oCuaNhan?.han_dung ?? null : null);

  // Không có lô hợp của tảng trên nhãn thì lấy lô hạn gần trước: Ra quầy lấy trong kho, Đưa bếp lấy ở kho hoặc quầy,
  // Báo hủy lấy lô đã hết hạn (nếu có).
  const oKhoHayQuay = (l: DongTon) => l.loai_vi_tri === 'kho' || l.loai_vi_tri === 'quay';
  const loKhoGan = ton.find(l => l.loai_vi_tri === 'kho' && !daHetHan(l));
  const loBepGan = ton.find(l => oKhoHayQuay(l) && !daHetHan(l));
  const loHetHan = ton.find(l => oKhoHayQuay(l) && daHetHan(l));

  const noiUuTien = tuy.laQuay ? 'quay' : 'kho';
  const loNhanLam = loCuaNhan.filter(l => viecVoiLo(l).length > 0)
    .sort((a, b) => Number(b.loai_vi_tri === noiUuTien) - Number(a.loai_vi_tri === noiUuTien));

  const luuY: LuuYNhan[] = [];
  if (oCuaNhan && !loNhan) luuY.push('chua_chot');
  else {
    if (nhanHetHan) luuY.push('het_han');
    if (loNhan && loCuaNhan.length === 0) luuY.push('het_tang');
  }

  return {
    loCuaNhan,
    nhanHetHan,
    hanHet,
    loRaQuay: nhanHetHan ? undefined : (loNhanLam.find(l => l.loai_vi_tri === 'kho') ?? loKhoGan),
    loDuaBep: loNhanLam[0] ?? loBepGan,
    loBaoHuy: loNhanLam[0] ?? loHetHan,
    luuY,
  };
}
