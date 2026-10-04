/**
 * CÂN GIẢ HAI CHIỀU — nói giao thức cổng 33581 của hãng (net-protocol.md) trên
 * 127.0.0.1, để kiểm thử src/giao-thuc.ts không cần cân thật.
 *
 * Làm như đặc tả suy ra: trả lời UPL MAC / INF / TIM / REP / <phần> bằng các dòng
 * rồi một dòng END; im lặng khi được ghi (DWL, CLR); xử lý dòng theo thứ tự nhận.
 * Ghi lại mọi byte nhận được (từng kết nối) và mọi khối được ghi. Dữ liệu (các
 * phần, nhật ký bán, giờ) cho sẵn và sửa được giữa các lần thử; khối DWL được áp
 * vào dữ liệu (PLU thêm / sửa theo số PLU, CLR xoá cả phần, DWL TIM đặt giờ) để
 * đọc lại kiểm được.
 *
 * Chế độ hỏng (thuộc tính `hong`): im lặng · đóng giữa chừng · MAC sai · không có
 * MAC · nhật ký tăng dần / không bao giờ khớp / lệch một lần · hàng rào chậm · END
 * thừa trước TIM · mẫu tem thiếu LAE · bỏ qua lệnh đặt giờ · chèn dòng lạ.
 *
 * Dữ liệu giả, không có tên hàng thật hay WiFi thật.
 */
import * as net from 'node:net';

export interface GioGia { nam: number; thang: number; ngay: number; gio: number; phut: number; giay: number }

export interface DuLieuCanGia {
  /** 6 số của dòng MAC (thập phân). */
  mac: (number | string)[];
  /** Dòng INF (chuỗi byte); null = không trả dòng INF. */
  inf: string | null;
  /** Dòng INA; null = không trả. */
  ina: string | null;
  /** Dòng INM; null = không trả. */
  inm: string | null;
  /** Các dòng của từng phần (chuỗi byte). LAB gồm LAB, LAS…, LAE của từng mẫu tem. */
  phan: Record<string, string[]>;
  /** Nhật ký bán: dòng REP / RES / REE. */
  baoCao: string[];
  gio: GioGia;
}

export type CheDoHong =
  /** Nhận kết nối, nhận hết byte, không trả lời gì. */
  | { loai: 'im-lang' }
  /** Nhận UPL <khi> (MAC, INF, PLU, TIM, REP…) thì trả nửa dòng đầu rồi đóng kết nối. */
  | { loai: 'dong-giua-chung'; khi: string }
  /** Dòng MAC có số không phải thập phân. */
  | { loai: 'mac-sai' }
  /** UPL MAC chỉ trả END. */
  | { loai: 'khong-mac' }
  /** Mỗi lần đọc nhật ký xong thì có thêm một giao dịch mới (có người đang bán). */
  | { loai: 'bao-cao-tang' }
  /** Mỗi lần đọc nhật ký ra một nội dung khác, cùng số dòng RES — không bao giờ khớp. */
  | { loai: 'bao-cao-khac' }
  /** Lần đọc nhật ký đầu thiếu dòng cuối, các lần sau đủ. */
  | { loai: 'bao-cao-lech-mot-lan' }
  /** Chờ `ms` rồi mới trả lời UPL TIM. */
  | { loai: 'hang-rao-cham'; ms: number }
  /** Trả "END\t<PHẦN>\t" sau mỗi khối DWL nhận được; trả lời UPL TIM chậm `tim` ms. */
  | { loai: 'end-thua'; tim?: number }
  /** Mẫu tem cuối cùng không có dòng LAE. */
  | { loai: 'lab-thieu-lae' }
  /** Nhận DWL TIM nhưng không đổi giờ. */
  | { loai: 'bo-qua-gio' }
  /** Chèn các dòng này trước câu trả lời mỗi UPL <phần>. */
  | { loai: 'chen-dong'; dong: string[] }
  /** Dòng TIM ghi năm đủ 4 số ("2026") thay vì 2 số ("26") như hãng đọc. */
  | { loai: 'nam-4-so' };

export interface KetNoiGia {
  /** Các đoạn byte nhận được, theo thứ tự. */
  nhan: Buffer[];
  daDong: boolean;
}

export interface CanGia {
  readonly cong: number;
  du: DuLieuCanGia;
  hong: CheDoHong | null;
  /** Xuống dòng khi trả lời: '\r\n' (mặc định), '\n' hay '\r'. */
  xuongDong: string;
  /** Trả BOM trước câu trả lời đầu tiên của mỗi kết nối. */
  bom: boolean;
  /** Bọc trả lời UPL <phần> trong "DWL\t<PHẦN>\t" … "END\t<PHẦN>\t" như file USB. */
  bocKhoi: boolean;
  readonly ketNoi: KetNoiGia[];
  /** Mọi dòng UPL nhận được, theo thứ tự. */
  readonly yeuCau: string[];
  /** Mọi khối được ghi (DWL, CLR), theo thứ tự. */
  readonly khoi: { lenh: 'DWL' | 'CLR'; ten: string; dong: string[] }[];
  /** Date.now() lúc vừa trả dòng TIM gần nhất (0 nếu chưa). */
  lucTraTim: number;
  /**
   * 2.6.1: thay cách cân áp một khối DWL vừa nhận (trừ TIM) — `ap(dong)` áp đúng các dòng đó. Không đặt: áp cả khối
   * ngay. Kiểm thử đặt `() => {}` (cân nhận, qua hàng rào, mà không lưu), áp chậm, hay áp một phần.
   */
  chanGhi: ((ten: string, dong: string[], ap: (dong: string[]) => void) => void) | null;
  /** Byte nhận trên kết nối i (mặc định kết nối cuối). */
  nhanTu(i?: number): Buffer;
  /** Chờ tới khi dk() đúng, tối đa ms. */
  choNhan(dk: () => boolean, ms?: number): Promise<boolean>;
  /**
   * 2.8 — cắt mọi kết nối đang mở, vẫn nghe kết nối mới (cân khởi động lại, router phát địa chỉ này cho máy khác: kết nối
   * TCP cũ không còn). Kết nối giữ mở của chương trình thấy đứt và phải bắt tay lại.
   */
  ngatKetNoi(): void;
  /** 2.8 — cân tự đẩy một dòng (vd "ASK\tREP\t" khi in tem, thông số 58) tới mọi kết nối đang mở. Trả số kết nối đã đẩy. */
  day(dong: string): number;
  /** 2.8 — số kết nối đang mở. */
  soDangMo(): number;
  dong(): Promise<void>;
}

const BOM = '\xEF\xBB\xBF';
const PHAN = ['TMS', 'TMT', 'SCP', 'DPT', 'CLS', 'PLU', 'BAR', 'LAB', 'SAL'];

/** Chữ → chuỗi byte UTF-8 (như ghi tên vào file cân). */
export const chuoiByte = (t: string) => Buffer.from(t, 'utf8').toString('latin1');

export function duLieuMacDinh(): DuLieuCanGia {
  return {
    mac: [0, 35, 240, 26, 236, 177],                           // → 0023F01AECB1 (ví dụ trong đặc tả)
    inf: `INF\t${chuoiByte('Quán thử')}\t${chuoiByte('Cân quầy thử')}\t0\tTM-xA UA006 V3.14E8\t`,
    ina: 'INA\t\tUTF-8\t0\t8388608\t8388608\t7\t7\t',
    inm: null,
    phan: {},
    baoCao: [],
    gio: { nam: 2026, thang: 9, ngay: 25, gio: 16, phut: 54, giay: 12 },
  };
}

const nghi = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Nhóm dòng LAB thành từng mẫu tem (LAB, LAS…, LAE). */
function nhomTem(dong: string[]): string[][] {
  const ra: string[][] = [];
  let dang: string[] | null = null;
  for (const d of dong) {
    const f0 = d.split('\t')[0];
    if (f0 === 'LAB') { dang = [d]; ra.push(dang); } else if (dang) { dang.push(d); if (f0 === 'LAE') dang = null; }
  }
  return ra;
}

/** Áp khối DWL vào dữ liệu: thêm / sửa theo số (SCP theo trang + phím, LAB theo mẫu tem). */
function apKhoi(du: DuLieuCanGia, ten: string, dong: string[]): void {
  if (!PHAN.includes(ten)) return;
  const cu = du.phan[ten] ?? [];
  if (ten === 'LAB') {
    const nhom = nhomTem(cu);
    for (const moi of nhomTem(dong)) {
      const id = moi[0].split('\t')[1];
      const i = nhom.findIndex(n => n[0].split('\t')[1] === id);
      if (i >= 0) nhom[i] = moi; else nhom.push(moi);
    }
    du.phan[ten] = nhom.flat();
    return;
  }
  const khoa = (d: string) => { const f = d.split('\t'); return ten === 'SCP' ? `${f[1]}\t${f[2]}` : f[1]; };
  const ra = cu.slice();
  for (const d of dong) {
    if (d.split('\t')[0] !== ten) continue;
    const i = ra.findIndex(x => khoa(x) === khoa(d));
    if (i >= 0) ra[i] = d; else ra.push(d);
  }
  du.phan[ten] = ra;
}

/** Giao dịch có FID ≥ n (REP ở cột 7), kèm các dòng RES / REE theo sau. */
function locBaoCao(dong: string[], n: number): string[] {
  const ra: string[] = [];
  let lay = false;
  for (const d of dong) {
    const f = d.split('\t');
    if (f[0] === 'REP') lay = parseInt(f[7], 10) >= n;
    if (lay) ra.push(d);
  }
  return ra;
}

function giaoDichMoi(du: DuLieuCanGia): string[] {
  const fid = Math.max(0, ...du.baoCao.filter(d => d.startsWith('REP\t')).map(d => parseInt(d.split('\t')[7], 10))) + 1;
  return [`REP\t26\t9\t29\t10\t0\t${fid % 60}\t${fid}\t1\t0\t`,
    `RES\t1\t50000,3\t1\t9\t9\t0,3\t500,3\t1\t0\t0,3\t\t\t\t\t100000,3\t0\t${chuoiByte('Hàng thử mới')}\t`, 'REE\t'];
}

/** `diaChi`: địa chỉ nghe (mặc định 127.0.0.1; 2.8 thử cân đổi địa chỉ — 127.0.0.2). */
export async function moCanGia(tuy: { du?: Partial<DuLieuCanGia>; hong?: CheDoHong | null; diaChi?: string } = {}): Promise<CanGia> {
  const sockets = new Set<net.Socket>();
  const can: CanGia = {
    cong: 0,
    du: { ...duLieuMacDinh(), ...tuy.du },
    hong: tuy.hong ?? null,
    xuongDong: '\r\n',
    bom: false,
    bocKhoi: false,
    ketNoi: [],
    yeuCau: [],
    khoi: [],
    lucTraTim: 0,
    chanGhi: null,
    nhanTu(i?: number) { const k = can.ketNoi[i ?? can.ketNoi.length - 1]; return k ? Buffer.concat(k.nhan) : Buffer.alloc(0); },
    async choNhan(dk, ms = 2000) {
      const het = Date.now() + ms;
      while (!dk()) { if (Date.now() > het) return false; await nghi(5); }
      return true;
    },
    ngatKetNoi() { for (const s of sockets) s.destroy(); },
    day(dong: string) {
      let n = 0;
      for (const s of sockets) if (!s.destroyed && s.writable) { s.write(Buffer.from(dong + can.xuongDong, 'latin1')); n++; }
      return n;
    },
    soDangMo() { return [...sockets].filter(s => !s.destroyed).length; },
    dong: () => new Promise<void>((xong) => { for (const s of sockets) s.destroy(); may.close(() => xong()); }),
  };

  const may = net.createServer((s) => {
    sockets.add(s);
    const kn: KetNoiGia = { nhan: [], daDong: false };
    can.ketNoi.push(kn);
    s.on('close', () => { kn.daDong = true; sockets.delete(s); });
    s.on('error', () => {});

    let du = '';
    const hang: string[] = [];
    let dangXuLy = false, daTraBom = false, lanBaoCao = 0;
    let khoiDang: { ten: string; dong: string[] } | null = null;
    let choClrEnd: string | null = null;

    const tra = (dong: string[]) => {
      if (s.destroyed) return;
      let chu = dong.map(d => d + can.xuongDong).join('');
      if (can.bom && !daTraBom) { chu = BOM + chu; daTraBom = true; }
      s.write(Buffer.from(chu, 'latin1'));
    };

    const traPhan = (ten: string) => {
      let dong = (can.du.phan[ten] ?? []).slice();
      if (can.hong?.loai === 'lab-thieu-lae' && ten === 'LAB') {
        const i = dong.lastIndexOf('LAE\t');
        if (i >= 0) dong.splice(i, 1);
      }
      if (can.hong?.loai === 'chen-dong') dong = [...can.hong.dong, ...dong];
      tra(can.bocKhoi ? [`DWL\t${ten}\t`, ...dong, `END\t${ten}\t`] : [...dong, `END\t${ten}\t`]);
    };

    const motDong = async (d: string) => {
      while (d.startsWith(BOM)) d = d.slice(3);
      if (d === '') return;
      const f = d.split('\t');
      if (khoiDang) {
        if (f[0] === 'END' && f[1] === khoiDang.ten) {
          const k = khoiDang;
          khoiDang = null;
          can.khoi.push({ lenh: 'DWL', ten: k.ten, dong: k.dong });
          if (k.ten === 'TIM') {
            const t = k.dong.find(x => x.startsWith('TIM\t'))?.split('\t').map(Number);
            if (t && can.hong?.loai !== 'bo-qua-gio') can.du.gio = { nam: 2000 + t[1], thang: t[2], ngay: t[3], gio: t[4], phut: t[5], giay: t[6] };
          } else if (can.chanGhi) can.chanGhi(k.ten, k.dong, (dong) => apKhoi(can.du, k.ten, dong));
          else apKhoi(can.du, k.ten, k.dong);
          if (can.hong?.loai === 'end-thua') tra([`END\t${k.ten}\t`]);
        } else khoiDang.dong.push(d);
        return;
      }
      if (choClrEnd !== null) {
        if (d === 'CLR\tEND\t') { can.du.phan[choClrEnd] = []; can.khoi.push({ lenh: 'CLR', ten: choClrEnd, dong: [] }); }
        choClrEnd = null;
        return;
      }
      if (f[0] === 'DWL') { khoiDang = { ten: f[1], dong: [] }; return; }
      if (f[0] === 'CLR') { choClrEnd = f[1]; return; }
      if (f[0] !== 'UPL') return;
      can.yeuCau.push(d);
      const ten = f[1];
      if (ten === 'END') return;
      const h = can.hong;
      if (h?.loai === 'dong-giua-chung' && h.khi === ten) {
        s.write(Buffer.from(ten === 'MAC' ? 'MAC\t0\t35' : `${ten}\t1\t`, 'latin1'));
        await nghi(20);
        s.destroy();
        return;
      }
      if (ten === 'MAC') {
        if (h?.loai === 'khong-mac') tra(['END\tMAC\t']);
        else if (h?.loai === 'mac-sai') tra(['MAC\t0\t35\tF0\t26\t236\t177\t', 'END\tMAC\t']);
        else tra([`MAC\t${can.du.mac.join('\t')}\t`, 'END\tMAC\t']);
        return;
      }
      if (ten === 'INF') {
        const { ina, inm, inf } = can.du;
        tra([ina, inm, inf].filter((x): x is string => x !== null).concat('END\tINF\t'));
        return;
      }
      if (ten === 'TIM') {
        if (h?.loai === 'hang-rao-cham') await nghi(h.ms);
        if (h?.loai === 'end-thua' && h.tim) await nghi(h.tim);
        const g = can.du.gio;
        tra([`TIM\t${h?.loai === 'nam-4-so' ? g.nam : g.nam % 100}\t${g.thang}\t${g.ngay}\t${g.gio}\t${g.phut}\t${g.giay}\t`, 'END\tTIM\t']);
        can.lucTraTim = Date.now();
        return;
      }
      if (ten === 'REP') {
        lanBaoCao++;
        const n = Math.abs(parseInt(f[2] ?? '1', 10)) || 1;
        let dong = locBaoCao(can.du.baoCao, n);
        if (h?.loai === 'bao-cao-lech-mot-lan' && lanBaoCao === 1) dong = dong.slice(0, -1);
        if (h?.loai === 'bao-cao-khac') {
          dong = dong.map((x, i) => (i === 0 ? x.replace(/\t[^\t]*\t$/, `\t${lanBaoCao}\t`) : x));
        }
        tra([...dong, 'END\tREP\t']);
        if (h?.loai === 'bao-cao-tang') can.du.baoCao.push(...giaoDichMoi(can.du));
        return;
      }
      if (PHAN.includes(ten)) { traPhan(ten); return; }
      tra(['END\t']);
    };

    const xuLy = async () => {
      if (dangXuLy) return;
      dangXuLy = true;
      while (hang.length && !s.destroyed) await motDong(hang.shift()!);
      dangXuLy = false;
    };

    s.on('data', (b: Buffer) => {
      kn.nhan.push(b);
      if (can.hong?.loai === 'im-lang') return;
      du += b.toString('latin1');
      const cat = du.split(/\r\n|\r|\n/);
      du = cat.pop() ?? '';
      hang.push(...cat);
      void xuLy();
    });
  });

  await new Promise<void>((xong) => may.listen(0, tuy.diaChi ?? '127.0.0.1', () => xong()));
  (can as { cong: number }).cong = (may.address() as net.AddressInfo).port;
  return can;
}
