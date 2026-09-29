/**
 * BEEFTOWN CÂN — TÌM CÂN TRONG WIFI CỦA QUÁN
 *
 * Router tự phát địa chỉ cho cân (DHCP): cân hay router khởi động lại là cân
 * có thể mang địa chỉ khác, và gửi vào địa chỉ cũ sẽ hỏng. Cân nhận dữ liệu ở
 * cổng TCP 33571 — trong WiFi của quán chỉ cân mở cổng này — nên thử nối cổng
 * đó ở mọi địa chỉ trong mạng của máy tính là thấy cân. Mỗi địa chỉ chỉ mở rồi
 * đóng kết nối, không gửi gì (như nút "Kiểm tra kết nối").
 *
 * Không nghe tiếng cân tự phát mỗi ~15 giây (UDP 33584, xem web/README.md): mở
 * cổng nghe thì Windows hiện hộp hỏi tường lửa với nhân viên quầy.
 *
 * Thấy một máy mở cổng 33571 chưa chắc là cân vẫn dùng (quán có hai cân, vừa
 * thay cân): layMac đọc mã máy (MAC) trong bảng ARP của máy tính để so.
 */
import * as fs from 'node:fs';
import * as net from 'node:net';
import * as os from 'node:os';
import { execFile } from 'node:child_process';

/** Một mạng IPv4 của máy tính (WiFi, dây mạng…). */
export interface MangMay { ip: string; mask: string }

/** Một dải địa chỉ cần dò, ví dụ 192.168.1.0/24. */
export interface DaiDo { ten: string; ds: string[] }

export interface KetQuaTim {
  /** Địa chỉ mở cổng cân, xếp tăng dần. */
  thay: string[];
  /** Số địa chỉ đã thử. */
  daThu: number;
  /** Các dải đã dò. */
  dai: string[];
}

export const LA_IP = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const soIp = (ip: string) => ip.split('.').reduce((n, x) => n * 256 + Number(x), 0);
const ipSo = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');

/** Mạng IPv4 của máy tính — bỏ 127.x (chính máy) và 169.254.x (máy chưa nhận được địa chỉ từ router). */
export function mangCuaMay(): MangMay[] {
  const kq: MangMay[] = [];
  for (const ds of Object.values(os.networkInterfaces())) {
    for (const a of ds ?? []) {
      if (a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.')) kq.push({ ip: a.address, mask: a.netmask });
    }
  }
  return kq;
}

/**
 * Các dải cần dò, dải có địa chỉ cũ của cân lên trước. Mạng từ /22 trở xuống
 * (≤ 1022 địa chỉ) dò hết; mạng to hơn chỉ dò dải /24 quanh máy tính và quanh
 * địa chỉ cũ. Bỏ địa chỉ mạng, địa chỉ phát và chính máy tính.
 */
export function daiCanDo(mang: MangMay[], ipCu?: string): DaiDo[] {
  const cu = ipCu && LA_IP.test(ipCu) ? soIp(ipCu) : null;
  const cuaMay = new Set(mang.filter(m => LA_IP.test(m.ip)).map(m => soIp(m.ip)));
  const kq: (DaiDo & { coCu: boolean })[] = [];
  const them = (dau: number, soBit: number) => {
    const ten = `${ipSo(dau)}/${soBit}`;
    if (kq.some(d => d.ten === ten)) return;
    const cuoi = dau + 2 ** (32 - soBit) - 1;
    const ds: string[] = [];
    for (let n = dau + 1; n < cuoi; n++) if (!cuaMay.has(n)) ds.push(ipSo(n));
    kq.push({ ten, ds, coCu: cu !== null && cu > dau && cu < cuoi });
  };
  for (const m of mang) {
    if (!LA_IP.test(m.ip) || !LA_IP.test(m.mask)) continue;
    const ip = soIp(m.ip), mask = soIp(m.mask);
    const soBit = mask.toString(2).replace(/0/g, '').length;
    if (soBit > 30) continue;
    const dau = (ip & mask) >>> 0;
    if (soBit >= 22) { them(dau, soBit); continue; }
    if (cu !== null && ((cu & mask) >>> 0) === dau) them((cu & 0xFFFFFF00) >>> 0, 24);
    them((ip & 0xFFFFFF00) >>> 0, 24);
  }
  // Cân thường chỉ đổi địa chỉ trong cùng mạng: dò dải có địa chỉ cũ trước.
  return kq.sort((a, b) => Number(b.coCu) - Number(a.coCu)).map(({ ten, ds }) => ({ ten, ds }));
}

const LA_MAC = /^([0-9a-f]{2}[-:]){5}[0-9a-f]{2}$/i;

/**
 * Mã máy (MAC) của một địa chỉ trong WiFi, đọc từ bảng ARP của máy tính — vừa
 * nối tới địa chỉ đó là bảng có. Windows: `arp -a <ip>`; Linux: /proc/net/arp.
 * Không đọc được thì null (không biết, không phải "khác máy").
 */
export async function layMac(ip: string): Promise<string | null> {
  if (!LA_IP.test(ip)) return null;
  let bang = '';
  try {
    bang = process.platform === 'win32'
      ? await new Promise<string>((xong) => execFile('arp', ['-a', ip], { windowsHide: true, timeout: 5000, encoding: 'utf8' }, (_loi, ra) => xong(ra ?? '')))
      : fs.readFileSync('/proc/net/arp', 'utf8');
  } catch { return null; }
  for (const dong of bang.split(/\r?\n/)) {
    const cot = dong.trim().split(/\s+/);
    if (cot[0] !== ip) continue;
    const mac = cot.find(c => LA_MAC.test(c))?.toLowerCase().replace(/-/g, ':');
    // Dòng chưa xong (00:00…) hay địa chỉ phát (ff:ff…) không phải mã máy.
    if (mac && mac !== '00:00:00:00:00:00' && mac !== 'ff:ff:ff:ff:ff:ff') return mac;
  }
  return null;
}

/** Chỉ mở rồi đóng kết nối — không gửi gì. */
export function thuKetNoi(ip: string, cong: number, choMs = 4000): Promise<boolean> {
  return new Promise((kq) => {
    const s = net.createConnection({ host: ip, port: cong });
    const hen = setTimeout(() => { s.destroy(); kq(false); }, choMs);
    s.once('connect', () => { clearTimeout(hen); s.destroy(); kq(true); });
    s.once('error', () => { clearTimeout(hen); kq(false); });
  });
}

/** Thử nối cổng ở nhiều địa chỉ, `dongThoi` địa chỉ một lúc — trả những địa chỉ nối được. */
export async function thuNhieu(ds: string[], cong: number, dongThoi = 128, choMs = 2000): Promise<string[]> {
  const thay: string[] = [];
  let i = 0;
  const lam = async () => {
    while (i < ds.length) {
      const ip = ds[i++];
      if (await thuKetNoi(ip, cong, choMs)) thay.push(ip);
    }
  };
  await Promise.all(Array.from({ length: Math.min(dongThoi, ds.length) }, lam));
  return thay.sort((a, b) => soIp(a) - soIp(b));
}

/**
 * Dò từng dải; dải nào thấy cân thì thôi — máy tính có nhiều mạng (dây, WiFi,
 * mạng ảo) thì không mất thời gian dò hết. Một dải /24 mất chừng 4 giây.
 */
export async function timCan(cong: number, ipCu?: string, mang: MangMay[] = mangCuaMay()): Promise<KetQuaTim> {
  const kq: KetQuaTim = { thay: [], daThu: 0, dai: [] };
  const daThu = new Set<string>();
  for (const d of daiCanDo(mang, ipCu)) {
    const ds = d.ds.filter(ip => !daThu.has(ip));
    for (const ip of ds) daThu.add(ip);
    kq.dai.push(d.ten);
    kq.daThu += ds.length;
    kq.thay = await thuNhieu(ds, cong);
    if (kq.thay.length) break;
  }
  return kq;
}
