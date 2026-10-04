/**
 * BEEFTOWN CÂN — GIỮ MỘT KẾT NỐI HAI CHIỀU MỞ VỚI CÂN (2.8, CHƯA THỬ TRÊN CÂN THẬT)
 *
 * Phần mềm của hãng giữ một kết nối cổng 33581 mở với mỗi cân, hỏi giờ (UPL TIM) mỗi 30 giây để biết cân còn đó, và
 * nghe cân tự báo khi in tem (ASK REP, thông số 58 — CAN-TMA.md §10.2.7, §10.4). Trước 2.8 chương trình mở một kết nối
 * cho mỗi việc rồi đóng. Từ 2.8 mọi việc qua cổng hai chiều đi trên MỘT kết nối giữ mở: cân có nhận hai kết nối cùng
 * lúc không thì chưa biết (§10.2.9), nên không bao giờ mở kết nối thứ hai khi kết nối đang giữ còn dùng được.
 *
 * Mỗi lần dùng lại kết nối: hỏi giờ trước với hạn ngắn (CHO_HOI_NHANH_MS) — như hàng rào UPL TIM của hãng:
 *   - biết kết nối còn sống: cân tắt đột ngột không báo gì, ghi vào kết nối chết là chờ hết hạn hàng rào rồi báo "chưa
 *     chắc cân đã lưu" dù cân không nhận byte nào — không trả lời thì đóng, mở kết nối mới;
 *   - đồng bộ lại luồng: dòng thừa của việc trước (cân trả dòng lạ, trả chậm) bị bỏ khi chờ dòng TIM rồi END của hàng rào.
 * Việc nào hỏng (kể cả lỗi của chương trình, không phải của kết nối) thì bỏ kết nối: lần sau bắt tay lại từ đầu.
 *
 * File này không biết cân nào là cân nào (mã máy): nghiep-vu.ts kiểm mã máy sau mỗi lần lấy kết nối (kiemMayHaiChieu)
 * và bỏ kết nối tới cân khác.
 */
import type { KetNoiCan, TuyChonKetNoi } from './giao-thuc.ts';

/** Hỏi giờ để biết kết nối im lặng lâu còn sống không: chờ tối đa (cân trả lời UPL TIM trong vài chục ms). */
export const CHO_HOI_NHANH_MS = 4_000;

export interface TrangThaiGiu {
  /** Đang giữ một kết nối chưa đóng (cân còn nghe không: xem lucNghe). */
  dangMo: boolean;
  ip: string | null;
  cong: number | null;
  /** Lúc mở kết nối đang giữ (ISO). */
  lucMo: string | null;
  /** Lần cuối cân trả lời (ISO) — trên kết nối đang giữ hay kết nối trước. */
  lucNghe: string | null;
  /** Lần mở / dùng kết nối gần nhất hỏng: câu lỗi, lúc nào (ISO). Hết khi nói chuyện được lại. */
  loi: string | null;
  lucLoi: string | null;
  /** Số lần đã mở kết nối mới từ lúc chương trình chạy (kể cả lần đầu) — tăng nhanh là cân / WiFi hay rớt. */
  soLanMo: number;
}

export type MoKetNoiCan = (ip: string, cong: number, tuy: TuyChonKetNoi) => Promise<KetNoiCan>;

const iso = (ms: number) => (ms > 0 ? new Date(ms).toISOString() : null);
const cauCua = (e: unknown) => (e instanceof Error ? e.message : String(e));

export class GiuKetNoi {
  private kn: KetNoiCan | null = null;
  private ip: string | null = null;
  private cong: number | null = null;
  private lucMo = 0;
  private lucNghe = 0;
  private loi: string | null = null;
  private lucLoi = 0;
  private soLanMo = 0;
  private dangMoMoi: Promise<unknown> | null = null;

  constructor(private readonly mo: MoKetNoiCan, private readonly bayGio: () => number = Date.now) {}

  /**
   * Kết nối tới (ip, cong) để làm một việc. Dùng lại kết nối đang giữ nếu cùng địa chỉ, cùng cổng và còn sống; không
   * thì đóng nó, mở kết nối mới và giữ kết nối mới. `moi`: luôn mở mới (bắt tay lại — Chẩn đoán WiFi, Đọc thông tin cân).
   * Mở hỏng thì ném đúng lỗi của giao-thuc.ts (người gọi xử lý 'khong-noi' như trước).
   */
  async lay(ip: string, cong: number, tuy: TuyChonKetNoi, moi = false): Promise<KetNoiCan> {
    // Một lần mở mỗi lúc: hai việc cùng cần kết nối thì việc sau dùng kết nối việc trước vừa mở.
    while (this.dangMoMoi) { try { await this.dangMoMoi; } catch { /* việc trước tự báo lỗi của nó */ } }
    const kn = this.kn;
    if (!moi && kn && this.ip === ip && this.cong === cong && kn.dangMo) {
      try {
        await kn.docGio(CHO_HOI_NHANH_MS);
        this.daNghe(kn);
        return kn;
      } catch { /* im lặng / đứt: mở kết nối mới ở dưới */ }
    }
    this.bo();
    const p = this.mo(ip, cong, tuy);
    this.dangMoMoi = p;
    try {
      const moiMo = await p;
      this.kn = moiMo;
      this.ip = ip;
      this.cong = cong;
      this.lucMo = this.lucNghe = this.bayGio();
      this.soLanMo++;
      this.loi = null;
      return moiMo;
    } catch (e) {
      this.ghiLoi(e);
      throw e;
    } finally {
      this.dangMoMoi = null;
    }
  }

  /** Việc trên `kn` vừa xong: cân còn trả lời. */
  daNghe(kn: KetNoiCan): void {
    if (kn !== this.kn) return;
    this.lucNghe = this.bayGio();
    this.loi = null;
  }

  /**
   * Việc trên `kn` vừa hỏng: bỏ kết nối — lần sau mở mới, bắt tay lại, không còn dòng thừa nào của việc hỏng (cân trả dòng
   * lạ thì luồng có thể lệch). Kết nối đã đứt / hết giờ (giao-thuc.ts tự đóng) thì `e` vào trạng thái để trang thấy vì sao.
   */
  hong(kn: KetNoiCan, e: unknown): void {
    if (kn !== this.kn) { kn.dong(); return; }
    if (!kn.dangMo) this.ghiLoi(e);
    this.bo();
  }

  /** Đóng và quên kết nối đang giữ (hay đúng `kn` nếu truyền — kết nối tới cân khác mã máy). */
  bo(kn?: KetNoiCan): void {
    if (kn && kn !== this.kn) { kn.dong(); return; }
    this.kn?.dong();
    this.kn = null;
    this.ip = null;
    this.cong = null;
    this.lucMo = 0;
  }

  /** Lần cuối cân trả lời cách đây bao lâu (ms) — Infinity nếu chưa lần nào. */
  imLangMs(): number {
    return this.lucNghe ? this.bayGio() - this.lucNghe : Infinity;
  }

  private ghiLoi(e: unknown): void {
    this.loi = cauCua(e);
    this.lucLoi = this.bayGio();
  }

  trangThai(): TrangThaiGiu {
    const dangMo = !!this.kn && this.kn.dangMo;
    return {
      dangMo, ip: dangMo ? this.ip : null, cong: dangMo ? this.cong : null, lucMo: dangMo ? iso(this.lucMo) : null,
      lucNghe: iso(this.lucNghe), loi: this.loi, lucLoi: this.loi ? iso(this.lucLoi) : null, soLanMo: this.soLanMo,
    };
  }
}
