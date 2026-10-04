/**
 * BEEFTOWN CÂN — NGHE CÂN TỰ PHÁT QUA UDP (2.8; chương trình này CHƯA THỬ trên cân thật)
 *
 * CAN-TMA.md §10.3: cân tự phát "UDP⇥33581⇥⇥␍␊" khoảng mỗi 15 giây, từ UDP 33583 tới 255.255.255.255:33584 (nhóm trước
 * đã thấy ở quán). Phần mềm của hãng còn hỏi: gửi 5 lần "UDP⇥␍␊" tới 255.255.255.255:33583, cân trả "UDP⇥<cổng TCP>⇥…"
 * tới cổng 33584 của máy tính. Gói không mang mã máy → chỉ là GỢI Ý địa chỉ; nghiep-vu.ts nhận cân bằng mã máy qua cổng
 * hai chiều trước khi đổi địa chỉ.
 *
 * Nghe cổng 33584 trên Windows: lần đầu Windows hỏi tường lửa (có máy cần quyền quản trị để cho phép) — vì thế mặc định
 * TẮT, quản lý bật ở Cài đặt. Bị tường lửa chặn thì không nghe thấy gì: chương trình vẫn dò WiFi bằng TCP như trước.
 * reuseAddr: phần mềm của hãng chạy cùng máy vẫn nghe được (gói phát rộng tới mọi socket cùng cổng).
 */
import * as dgram from 'node:dgram';

/** Cân nghe lời hỏi ở cổng này. */
export const CONG_UDP_CAN = 33583;
/** Máy tính nghe cân phát / trả lời ở cổng này (thông số 169 của cân). */
export const CONG_UDP_MAY = 33584;
/** Lời hỏi của hãng: "UDP⇥␍␊" (55 44 50 09 0D 0A). */
export const GOI_HOI = Buffer.from('UDP\t\r\n', 'latin1');
/** Phát rộng: 255.255.255.255 như hãng. */
const DIA_CHI_PHAT = '255.255.255.255';

/** Gói cân phát / trả: "UDP⇥<cổng TCP>⇥…" → cổng. Gói khác (kể cả lời hỏi "UDP⇥␍␊" của máy khác) → null. */
export function docGoiUdp(b: Uint8Array): number | null {
  const s = Buffer.from(b).toString('latin1');
  for (const dong of s.split(/\r\n|\r|\n/)) {
    const f = dong.split('\t');
    if (f[0] !== 'UDP' || !/^\d{1,5}$/.test(f[1] ?? '')) continue;
    const c = Number(f[1]);
    if (c >= 1 && c <= 65535) return c;
  }
  return null;
}

/** Một máy vừa phát / trả gói của cân. */
export interface CanNghe {
  ip: string;
  /** Số thứ tự gói (tăng dần, mỗi gói nhận được một số) — tuMoc lấy các máy trả lời sau một mốc. */
  stt: number;
  /** Cổng TCP hai chiều cân báo trong gói (thường 33581). */
  cong: number;
  /** Lần nghe gần nhất (ms). */
  luc: number;
  soGoi: number;
}

export interface TuyChonUdp {
  /** Cổng nghe — mặc định 33584. Kiểm thử: 0 (cổng bất kỳ). */
  congNghe?: number;
  /** Địa chỉ nghe — mặc định mọi địa chỉ. Kiểm thử: 127.0.0.1. */
  diaChiNghe?: string;
  /** Hỏi cân: gửi tới địa chỉ / cổng này — mặc định 255.255.255.255:33583. */
  diaChiHoi?: string;
  congHoi?: number;
  bayGio?: () => number;
}

export class NgheUdp {
  private s: dgram.Socket | null = null;
  private thay = new Map<string, CanNghe>();
  private dangBat: { lan: number; p: Promise<void> } | null = null;
  /** Tăng mỗi lần bật / tắt: lần bật đang dở mà đã tắt thì bỏ cổng vừa mở, không nghe. */
  private lanBat = 0;
  private stt = 0;
  /** Bật không được (cổng bị giữ, không có quyền…): câu báo; null khi đang nghe. */
  loi: string | null = null;
  /** Lúc bắt đầu nghe (ms), 0 nếu không nghe. */
  lucBat = 0;

  constructor(private readonly tuy: TuyChonUdp = {}) {}

  private bayGio(): number { return (this.tuy.bayGio ?? Date.now)(); }

  get dangNghe(): boolean { return this.s !== null && this.lucBat > 0; }
  /** Cổng đang nghe (kiểm thử dùng khi congNghe = 0). */
  get cong(): number | null { try { return this.s ? this.s.address().port : null; } catch { return null; } }

  /** Bắt đầu nghe. Đã nghe thì thôi. Không ném: hỏng thì ghi `loi`. */
  bat(): Promise<void> {
    if (this.s && this.lucBat) return Promise.resolve();
    // Đang mở cổng (chưa bị tắt giữa chừng): dùng chung lần đó.
    if (this.dangBat && this.dangBat.lan === this.lanBat) return this.dangBat.p;
    const congNghe = this.tuy.congNghe ?? CONG_UDP_MAY;
    const lan = ++this.lanBat;
    const p = new Promise<void>((xong) => {
      let s: dgram.Socket;
      try { s = dgram.createSocket({ type: 'udp4', reuseAddr: true }); } catch (e) {
        this.loi = `Không mở được cổng UDP ${congNghe}: ${(e as Error)?.message ?? e}.`;
        xong();
        return;
      }
      const hong = (e: Error) => {
        if (lan !== this.lanBat) { try { s.close(); } catch { /* đã đóng */ } xong(); return; }   // đã tắt: không báo lỗi cũ
        this.loi = `Không nghe được cổng UDP ${congNghe} (${(e as { code?: string }).code ?? e.message}) — chương trình khác có thể đang giữ cổng. `
          + 'Tìm cân vẫn dò WiFi như trước.';
        try { s.close(); } catch { /* đã đóng */ }
        if (this.s === s) { this.s = null; this.lucBat = 0; }
        xong();
      };
      s.once('error', hong);
      s.on('message', (b, r) => {
        const cong = docGoiUdp(b);
        if (cong === null) return;
        const cu = this.thay.get(r.address);
        this.thay.set(r.address, { ip: r.address, stt: ++this.stt, cong, luc: this.bayGio(), soGoi: (cu?.soGoi ?? 0) + 1 });
      });
      s.bind(congNghe, this.tuy.diaChiNghe, () => {
        s.removeListener('error', hong);
        if (lan !== this.lanBat) {   // đã tắt (hay bật lại) trong lúc mở cổng: không giữ cổng này
          try { s.close(); } catch { /* đã đóng */ }
          xong();
          return;
        }
        s.on('error', () => { /* lỗi gửi lẻ (mạng tắt): bỏ qua, lần sau gửi lại */ });
        try { s.setBroadcast(true); } catch { /* không phát rộng được: vẫn nghe */ }
        this.s = s;
        this.lucBat = this.bayGio();
        this.loi = null;
        xong();
      });
    }).finally(() => { if (this.dangBat?.p === p) this.dangBat = null; });
    this.dangBat = { lan, p };
    return p;
  }

  /** Thôi nghe, quên các máy đã nghe. */
  tat(): void {
    this.lanBat++;
    try { this.s?.close(); } catch { /* đã đóng */ }
    this.s = null;
    this.lucBat = 0;
    this.thay.clear();
  }

  /** Hỏi như hãng: gửi `soLan` lần lời hỏi, cách nhau `cachMs`. Chưa nghe → không gửi (trả lời sẽ không ai nhận). */
  async hoi(soLan = 5, cachMs = 100): Promise<void> {
    const s = this.s;
    if (!s) return;
    const ip = this.tuy.diaChiHoi ?? DIA_CHI_PHAT, cong = this.tuy.congHoi ?? CONG_UDP_CAN;
    for (let i = 0; i < soLan; i++) {
      await new Promise<void>((xong) => { try { s.send(GOI_HOI, cong, ip, () => xong()); } catch { xong(); } });
      if (i < soLan - 1 && cachMs > 0) await new Promise(r => setTimeout(r, cachMs));
    }
  }

  /** Mốc hiện tại (số thứ tự gói cuối) — truyền cho tuMoc sau khi hỏi. */
  moc(): number { return this.stt; }
  /** Các máy phát / trả gói SAU mốc `moc` (trả lời lần hỏi này), mới nhất trước — không lẫn máy chỉ còn trong danh sách cũ. */
  tuMoc(moc: number): CanNghe[] {
    return [...this.thay.values()].filter(c => c.stt > moc).sort((a, b) => b.stt - a.stt);
  }

  /** Các máy phát gói của cân trong `trongMs` vừa qua, mới nhất trước. */
  ganDay(trongMs: number): CanNghe[] {
    const tu = this.bayGio() - trongMs;
    return [...this.thay.values()].filter(c => c.luc >= tu).sort((a, b) => b.luc - a.luc);
  }
}
