/**
 * Mở giao diện với kho giả và cân giả để xem / chụp màn hình — không cần
 * kho thật, không cần cân thật:
 *
 *     cd can-app && npx bun test/xem-giao-dien.ts
 *
 * In ra đường dẫn; mở bằng trình duyệt. Ctrl+C để tắt.
 * `--vai nhan_vien_quay` (hoặc ke_toan, thu_kho…) để xem như vai đó; mặc định quản lý.
 * `--can-doi-dia-chi`: cân giả "đổi địa chỉ" — lúc mở trang, Kiểm tra kết nối tự dò ra cân.
 * `--hai-can`: như trên nhưng WiFi có hai cân (127.0.0.1 và .5) — trang hiện nút chọn cân.
 * Dây RS232 dùng PowerShell giả: có cổng COM3, gửi thử luôn được, nghe ra chữ của cân.
 */
import * as fs from 'node:fs';
import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import { UngDung, quyenCuaVai } from '../src/nghiep-vu.ts';
import { LENH_DS, LENH_NGHE, type ChayPs } from '../src/day-rs232.ts';
import { taoKhoGia } from './kho-gia.ts';
import { moMayChu } from '../src/may-chu.ts';

const KHUON = 'PLU\t{1}\t{2}\t\t1\t{5}\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\t{15}\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\tx\t0\t0\t0\t';
const plu = (so: number, ma: string, gia: string, ten: string) => KHUON.replace('{1}', String(so)).replace('{2}', ma).replace('{5}', gia).replace('{15}', ten);
// Mẫu tem 58×40 mm giống test/thu.ts.
const LAS = [
  [1,0,0,1,0,0,408,43,5],[1,0,6,1,408,1,54,34,5],[3,3,0,1,281,52,152,26,4],[3,1,0,2,6,55,115,26,5],
  [3,0,0,1,137,56,107,26,5],[1,0,1,1,4,90,116,26,5],[1,0,4,1,131,90,111,25,0],[2,27,0,1,260,108,204,35,5],
  [0,0,0,1,3,120,257,74,0],[3,4,0,1,2,198,112,21,5],[2,3,0,1,121,198,156,20,5],[1,0,15,1,114,220,200,26,0],
  [3,16,0,1,1,224,94,23,0],[3,12,0,1,220,255,220,50,0],
].map(([loai, chu, du, dk, x, y, w, h, co]) => `LAS\t29\t${loai}\t${chu}\t${du}\t${dk}\t0\t${co}\t1\t${x}\t${y}\t${w}\t${h}\t`);
const file = new TextEncoder().encode(['ECS\tVER\tV3.14E8\t', '', 'DWL\tPLU\t',
  plu(1, '10001', '845,0', 'Lõi vai bò Mỹ'), plu(2, '10002', '876,0', 'Sườn bò Hàn Quốc'),
  plu(3, '10003', '695,0', 'Gầu bò'), plu(5, '10005', '516,0', 'Ba chỉ bò cuộn'),
  plu(6, '90001', '945,0', 'Steak Ribeye Angus -30%'), plu(7, '10071', '1350,0', 'Steak Ribeye Angus #0142'),
  plu(8, '10072', '1350,0', 'Steak Ribeye Angus'),
  'END\tPLU\t', '',
  'DWL\tLAB\t', 'LAB\t28\tBEEFTOWN\t1\t58\t40\tĐơn giá\tTrọng Lượng\t\tThành Tiền\tNgày đóng gói\t\t\t\t\t\t\t\tBEEFTOWN\t\t\t\t1\tHSD\t', ...LAS, 'LAE\t', 'END\tLAB\t', '',
  'DWL\tSCP\t', 'SCP\t0\t1\t1\t', 'SCP\t0\t2\t2\t', 'SCP\t0\t3\t3\t', 'SCP\t0\t5\t5\t', 'END\tSCP\t', '',
  'DWL\tTMS\t', 'TMS\t0\t28\t', 'TMS\t202\t3\t', 'END\tTMS\t', '',
  'END\tECS\t', ''].join('\r\n'));

const can = net.createServer(s => { s.on('data', () => {}); s.on('end', () => s.end()); });
await new Promise<void>(x => can.listen(0, '127.0.0.1', () => x()));
const haiCan = process.argv.includes('--hai-can');
if (haiCan) {
  const can2 = net.createServer(s => { s.on('data', () => {}); s.on('end', () => s.end()); });
  await new Promise<void>(x => can2.listen((can.address() as net.AddressInfo).port, '127.0.0.5', () => x()));
}

const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'beeftown-can-xem-'));
const iVai = process.argv.indexOf('--vai');
const vai = iVai > 0 ? process.argv[iVai + 1] : 'quan_ly';
const cn = { id: 'cn1', ma: 'q1', ten: 'Beeftown Hàm Nghi' };
const doiDiaChi = haiCan || process.argv.includes('--can-doi-dia-chi');
const chayPs: ChayPs = async (lenh) => {
  await Bun.sleep(600);
  if (lenh === LENH_DS) return 'COM\tCOM1\r\nCOM\tCOM3\r\nTEN\tCổng Giao tiếp (COM1)\r\nTEN\tUSB-SERIAL CH340 (COM3)\r\nOK\r\n';
  if (lenh === LENH_NGHE) return `OK\t${Buffer.from('ST,GS,+0000.215kg\r\n'.repeat(12)).toString('base64')}\r\n`;
  return 'OK\t4096\r\n';
};
const ud = new UngDung({ cauHinh: path.join(tam, 'a'), duLieu: path.join(tam, 'd') }, {
  // Dò mạng giả 127.0.0.0/24 (máy "ở" .254) — cân giả nằm ở 127.0.0.1.
  mang: [{ ip: '127.0.0.254', mask: '255.255.255.0' }],
  chayPs,
  kho: taoKhoGia().kho,
  nguoi: { email: vai + '@beeftown.vn', hoTen: vai === 'quan_ly' ? 'Quản lý (xem thử)' : 'Nhân viên (xem thử)', vaiTro: vai,
           chiNhanh: cn, cacChiNhanh: [cn], quyen: quyenCuaVai(vai) },
  danhMuc: async () => ({ mauMaVach: '2XCCCCCWWWWWK', matHang: [
    { ma: 'LOI-VAI', ma_can: '10001', ten: 'Lõi vai bò Mỹ', gia_ban_kg: 850000, dang_dung: true },
    { ma: 'GAU-BO', ma_can: '10003', ten: 'Gầu bò', gia_ban_kg: 695000, dang_dung: true },
    { ma: 'BA-CHI', ma_can: '10005', ten: 'Ba chỉ bò cuộn', gia_ban_kg: 516000, dang_dung: true },
    { ma: 'THAN-LUNG', ma_can: '10004', ten: 'Thăn lưng bò Úc', gia_ban_kg: 990000, dang_dung: true },
    { ma: 'NAM-BO', ma_can: '10006', ten: 'Nạm bò', gia_ban_kg: null, dang_dung: true },
  ] }),
});
ud.luuCauHinh({ ipCan: doiDiaChi ? '127.0.0.2' : '127.0.0.1', congCan: (can.address() as net.AddressInfo).port });
if (!process.argv.includes('--chua-co-goc')) ud.ghiNhanFileTuCan(file);
const ma = 'xem';
const mc = moMayChu(ud, { ma, phienBan: 'xem thử', khiCoNhip: () => {}, khiDong: () => {} });
console.log(`Mở: http://127.0.0.1:${mc.port}/?t=${ma}`);
