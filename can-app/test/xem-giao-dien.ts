/**
 * Mở giao diện với kho giả và cân giả để xem / chụp màn hình — không cần
 * kho thật, không cần cân thật:
 *
 *     cd can-app && npx bun test/xem-giao-dien.ts
 *
 * In ra đường dẫn; mở bằng trình duyệt. Ctrl+C để tắt.
 */
import * as fs from 'node:fs';
import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import { UngDung } from '../src/nghiep-vu.ts';
import { moMayChu } from '../src/may-chu.ts';

const KHUON = 'PLU\t{1}\t{2}\t\t1\t{5}\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\t{15}\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\tx\t0\t0\t0\t';
const plu = (so: number, ma: string, gia: string, ten: string) => KHUON.replace('{1}', String(so)).replace('{2}', ma).replace('{5}', gia).replace('{15}', ten);
const file = new TextEncoder().encode(['ECS\tVER\tV3.14E8\t', '', 'DWL\tPLU\t',
  plu(1, '10001', '845,0', 'Lõi vai bò Mỹ'), plu(2, '10002', '876,0', 'Sườn bò Hàn Quốc'),
  plu(3, '10003', '695,0', 'Gầu bò'), plu(5, '10005', '516,0', 'Ba chỉ bò cuộn'),
  'END\tPLU\t', '', 'END\tECS\t', ''].join('\r\n'));

const can = net.createServer(s => { s.on('data', () => {}); s.on('end', () => s.end()); });
await new Promise<void>(x => can.listen(0, '127.0.0.1', () => x()));

const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'beeftown-can-xem-'));
const ud = new UngDung({ cauHinh: path.join(tam, 'a'), duLieu: path.join(tam, 'd') }, {
  danhMuc: async () => ({ mauMaVach: '2XCCCCCWWWWWK', matHang: [
    { ma: 'LOI-VAI', ma_can: '10001', ten: 'Lõi vai bò Mỹ', gia_ban_kg: 850000, dang_dung: true },
    { ma: 'GAU-BO', ma_can: '10003', ten: 'Gầu bò', gia_ban_kg: 695000, dang_dung: true },
    { ma: 'BA-CHI', ma_can: '10005', ten: 'Ba chỉ bò cuộn', gia_ban_kg: 516000, dang_dung: true },
    { ma: 'THAN-LUNG', ma_can: '10004', ten: 'Thăn lưng bò Úc', gia_ban_kg: 990000, dang_dung: true },
    { ma: 'NAM-BO', ma_can: '10006', ten: 'Nạm bò', gia_ban_kg: null, dang_dung: true },
  ] }),
});
ud.luuCauHinh({ ipCan: '127.0.0.1', congCan: (can.address() as net.AddressInfo).port });
if (!process.argv.includes('--chua-co-goc')) ud.ghiNhanFileTuCan(file);
const ma = 'xem';
const mc = moMayChu(ud, { ma, phienBan: 'xem thử', khiCoNhip: () => {}, khiDong: () => {} });
console.log(`Mở: http://127.0.0.1:${mc.port}/?t=${ma}`);
