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
 * `--chua-co-goc`: chưa có file gốc (thấy bước Bắt đầu, có nút đọc từ cân qua WiFi).
 * Dây RS232 dùng PowerShell giả: có cổng COM3, cân ở đầu dây luôn trả lời giờ (kiểm tra dây, gửi thử đều được).
 *
 * Bản 2.2: cân giả hai chiều (test/can-gia-hai-chieu.ts) trên 127.0.0.1 cho thẻ Cân & thông số, Nhật ký
 * cân (đọc qua WiFi), xoá qua WiFi; file gốc có nhật ký bán (REP) 7 ngày gần đây, đủ thông số và phím tắt;
 * kho có hạn dùng (HSD) để thấy cột HSD. Dữ liệu giả, không có tên / WiFi thật.
 */
import * as fs from 'node:fs';
import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import { UngDung, quyenCuaVai } from '../src/nghiep-vu.ts';
import { LENH_DS, type ChayPs } from '../src/day-rs232.ts';
import { taoKhoGia } from './kho-gia.ts';
import { moMayChu } from '../src/may-chu.ts';
import { chuoiByte, moCanGia } from './can-gia-hai-chieu.ts';
import { congNgay, homNayVn } from '../../web/src/lib/gio-vn.ts';

const KHUON = 'PLU\t{1}\t{2}\t\t1\t{5}\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\t{15}\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\tx\t0\t0\t0\t';
const plu = (so: number, ma: string, gia: string, ten: string) => KHUON.replace('{1}', String(so)).replace('{2}', ma).replace('{5}', gia).replace('{15}', ten);
// Mẫu tem 58×40 mm giống test/thu.ts; cỡ chữ (cột 8) và canh (cột 7) đặt cho sơ đồ trông như tem thật.
const CO = [2, 1, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 4];
const LAS = [
  [1,0,0,1,0,0,408,43],[1,0,6,1,408,1,54,34],[3,3,0,1,281,52,152,26],[3,1,0,2,6,55,115,26],
  [3,0,0,1,137,56,107,26],[1,0,1,1,4,90,116,26],[1,0,4,1,131,90,111,25],[2,27,0,1,260,108,204,35],
  [0,0,0,1,3,120,257,74],[3,4,0,1,2,198,112,21],[2,3,0,1,121,198,156,20],[1,0,15,1,114,220,200,26],
  [3,16,0,1,1,224,94,23],[3,12,0,1,220,255,220,50],
].map(([loai, chu, du, dk, x, y, w, h], i) => `LAS\t${[0, 1, 4, 5, 10, 12, 15, 16, 17, 20, 26, 27, 28, 29][i]}\t${loai}\t${chu}\t${du}\t${dk}\t0\t5\t${CO[i]}\t${x}\t${y}\t${w}\t${h}\t`);
const MAU_TEM = ['LAB\t28\tBEEFTOWN\t1\t58\t40\tĐơn giá\tTrọng Lượng\t\tThành Tiền\tNgày đóng gói\t\t\t\t\t\t\t\tBEEFTOWN\t\t\t\t1\tHSD\t', ...LAS, 'LAE\t'];
/** Dòng PLU có HSD n ngày (cột 27 = 1, cột 32 = n). */
const coHsd = (dong: string, n: number) => { const c = dong.split('\t'); c[27] = '1'; c[32] = String(n); return c.join('\t'); };
// Gầu bò đang in HSD 6 ngày, tính từ hôm qua (hsd-tinh-ngay.txt bên dưới) — thấy khung đỏ "HSD trên cân tính cho ngày …".
const PLU = [plu(1, '10001', '845,0', 'Lõi vai bò Mỹ'), plu(2, '10002', '876,0', 'Sườn bò Hàn Quốc'),
  coHsd(plu(3, '10003', '695,0', 'Gầu bò'), 6), plu(5, '10005', '516,0', 'Ba chỉ bò cuộn'),
  plu(6, '90001', '945,0', 'Steak Ribeye Angus -30%'), plu(7, '10071', '1350,0', 'Steak Ribeye Angus #0142'),
  plu(8, '10072', '1350,0', 'Steak Ribeye Angus')];
// Thông số: các mục THONG_SO của thong-so.ts, giá trị như cân của quán (chỉ số, không có tên / WiFi).
const TMS = Object.entries({ 0: 28, 1: 28, 2: 20, 5: 0, 21: 1, 22: 9, 42: 1, 43: 1, 104: 0, 105: 0, 106: 0, 131: 1, 166: 33581,
  188: 6, 202: 3, 203: 3, 208: 3, 209: 2, 250: 1, 265: 0, 266: 0, 283: 1 }).map(([id, v]) => `TMS\t${id}\t${v}\t`);
// Phím tắt: tầng 0 phím 1–73 (64–73 là phím chức năng), tầng 1 và 2 phím 1–63.
const SCP = [
  ...Array.from({ length: 73 }, (_, i) => `SCP\t0\t${i + 1}\t${[1, 2, 3, 5, 6, 7, 8][i] ?? 0}\t`),
  ...Array.from({ length: 63 }, (_, i) => `SCP\t1\t${i + 1}\t${i === 0 ? 3 : 0}\t`),
  ...Array.from({ length: 63 }, (_, i) => `SCP\t2\t${i + 1}\t0\t`),
];
// Nhật ký bán giả: 7 ngày gần đây, vài lần bán, một lần cân chưa in tem, một lần bán hàng cân tạm.
const hai = (n: number) => String(n).padStart(2, '0');
const NHAT_KY: string[] = [];
const MUON = [[1, '845000'], [2, '876000'], [3, '695000'], [5, '516000'], [6, '945000'], [7, '1350000']] as const;
for (let fid = 1, i = 0; i < 28; i++, fid++) {
  const d = new Date(Date.now() - (6 - Math.floor(i / 4)) * 86400000);
  const [so, gia] = MUON[i % MUON.length];
  const sl = 150 + (i * 37) % 400, loai = i === 9 ? 2 : 0;
  const tien = Math.round(Number(gia) * sl / 1000);
  NHAT_KY.push(`REP\t${d.getFullYear() % 100}\t${d.getMonth() + 1}\t${d.getDate()}\t${9 + (i % 10)}\t${hai(i)}\t${hai(i * 2 % 60)}\t${fid}\t${fid}\t0\t`,
    i === 14
      ? `RES\t1\t50000,3\t9999999\t9\t9\t0,3\t500,3\t3\t0\t0,3\t\t\t\t\t100000,3\t0\tT-Weight PLU\t`
      : `RES\t1\t${tien},3\t${so}\t9\t9\t0,3\t${sl},3\t3\t${loai}\t0,3\t\t\t\t\t${gia},3\t0\t${PLU.find(p => p.startsWith(`PLU\t${so}\t`))!.split('\t')[15]}\t`,
    'REE\t');
}
const file = new TextEncoder().encode(['ECS\tVER\tV3.14E8\t', '', 'DWL\tPLU\t', ...PLU, 'END\tPLU\t', '',
  'DWL\tLAB\t', ...MAU_TEM, 'END\tLAB\t', '',
  'DWL\tSCP\t', ...SCP, 'END\tSCP\t', '',
  'DWL\tTMS\t', ...TMS, 'END\tTMS\t', '',
  // Chữ cài đặt chung (2.4) — chữ giả; tên / mật khẩu WiFi giả để thấy trang không hiện chúng.
  'DWL\tTMT\t', 'TMT\t0\tBEEFTOWN THU\t', 'TMT\t1\tCân quầy 1\t', 'TMT\t2\t\t', 'TMT\t3\tVND\t', 'TMT\t8\tThank You\t', 'TMT\t14\t*\t',
  'TMT\t15\tWIFI-GIA\t', 'TMT\t16\tmat-khau-gia\t', 'END\tTMT\t', '',
  'DWL\tREP\t', ...NHAT_KY, 'END\tREP\t', '',
  'DWL\tINF\t', 'INA\t0\tUTF-8\t0\t0\t8388608\t7\t7\t', 'INM\t0023F01AECB1\t0023F01AECB1\t0\t', 'END\tINF\t', '',
  'END\tECS\t', ''].join('\r\n'));

const can = net.createServer(s => { s.on('data', () => {}); s.on('end', () => s.end()); });
await new Promise<void>(x => can.listen(0, '127.0.0.1', () => x()));
const haiCan = process.argv.includes('--hai-can');
if (haiCan) {
  const can2 = net.createServer(s => { s.on('data', () => {}); s.on('end', () => s.end()); });
  await new Promise<void>(x => can2.listen((can.address() as net.AddressInfo).port, '127.0.0.5', () => x()));
}
// Cân giả hai chiều (cổng 33581 của hãng), cùng dữ liệu với file gốc, thêm 2 lần bán mới chưa đọc.
const canHaiChieu = await moCanGia({ du: {
  phan: { PLU: PLU.map(chuoiByte), TMS, SCP, LAB: MAU_TEM.map(chuoiByte), TMT: ['TMT\t0\tQUAN THU\t', 'TMT\t15\tWIFI-GIA\t', 'TMT\t16\tmat-khau-gia\t'] },
  baoCao: [...NHAT_KY.map(chuoiByte), ...[29, 30].flatMap(fid => {
    const d = new Date();
    return [`REP\t${d.getFullYear() % 100}\t${d.getMonth() + 1}\t${d.getDate()}\t${hai(d.getHours())}\t0\t0\t${fid}\t${fid}\t0\t`,
      `RES\t1\t253500,3\t1\t9\t9\t0,3\t300,3\t3\t0\t0,3\t\t\t\t\t845000,3\t0\t${chuoiByte('Lõi vai bò Mỹ')}\t`, 'REE\t'];
  })],
} });

const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'beeftown-can-xem-'));
const iVai = process.argv.indexOf('--vai');
const vai = iVai > 0 ? process.argv[iVai + 1] : 'quan_ly';
const cn = { id: 'cn1', ma: 'q1', ten: 'Beeftown Hàm Nghi' };
const doiDiaChi = haiCan || process.argv.includes('--can-doi-dia-chi');
const chayPs: ChayPs = async (lenh, bien) => {
  await Bun.sleep(600);
  if (lenh === LENH_DS) return 'COM\tCOM1\r\nCOM\tCOM3\r\nTEN\tCổng Giao tiếp (COM1)\r\nTEN\tUSB-SERIAL CH340 (COM3)\r\nOK\r\n';
  // Cân ở đầu dây trả lời mỗi lần hỏi giờ (bước DOC của kịch bản).
  const b64 = (chu: string) => Buffer.from(chu, 'latin1').toString('base64');
  const ra = (bien.BT_KICH_BAN ?? '').split(';').flatMap((b, i) => (b.startsWith('DOC:')
    ? [`DONG\t${i}\t${b64('TIM\t26\t9\t29\t17\t5\t40\t')}`, `DONG\t${i}\t${b64('END\tTIM\t')}`] : []));
  return [...ra, 'OK\t4096', ''].join('\r\n');
};
const ud = new UngDung({ cauHinh: path.join(tam, 'a'), duLieu: path.join(tam, 'd') }, {
  // Dò mạng giả 127.0.0.0/24 (máy "ở" .254) — cân giả nằm ở 127.0.0.1.
  mang: [{ ip: '127.0.0.254', mask: '255.255.255.0' }],
  mac: async () => null,
  chayPs,
  kho: taoKhoGia().kho,
  nguoi: { email: vai + '@beeftown.vn', hoTen: vai === 'quan_ly' ? 'Quản lý (xem thử)' : 'Nhân viên (xem thử)', vaiTro: vai,
           chiNhanh: cn, cacChiNhanh: [cn], quyen: quyenCuaVai(vai) },
  danhMuc: async () => ({ mauMaVach: '2XCCCCCWWWWWK', matHang: [
    // HSD và nguồn HSD như danh-muc-can.ts đưa ra (số ngày còn lại của lô, tính cho hôm nay).
    { ma: 'LOI-VAI', ma_can: '10001', ten: 'Lõi vai bò Mỹ', gia_ban_kg: 850000, dang_dung: true, han_dung_ngay: 3,
      nguon_hsd: { vi: 'lô L0012 hết hạn trong 3 ngày', en: 'lot L0012' } },
    { ma: 'GAU-BO', ma_can: '10003', ten: 'Gầu bò', gia_ban_kg: 695000, dang_dung: true, han_dung_ngay: 5,
      nguon_hsd: { vi: 'lô L0007 hết hạn trong 5 ngày', en: 'lot L0007' } },
    { ma: 'BA-CHI', ma_can: '10005', ten: 'Ba chỉ bò cuộn', gia_ban_kg: 516000, dang_dung: true, han_dung_ngay: null,
      nguon_hsd: { vi: 'lô L0003 hết hạn hôm qua', en: 'lot L0003' },
      canh_bao_hsd: { vi: 'Lô L0003 đã hết hạn — không in HSD lên tem. Xem thẻ Quầy: huỷ hay bán giảm giá lô này.', en: 'Lot L0003 expired.' } },
    { ma: 'THAN-LUNG', ma_can: '10004', ten: 'Thăn lưng bò Úc', gia_ban_kg: 990000, dang_dung: true, han_dung_ngay: 4,
      nguon_hsd: { vi: 'theo hạn dùng của món (chưa có lô)', en: 'from the item shelf life (no lot yet)' } },
    { ma: 'NAM-BO', ma_can: '10006', ten: 'Nạm bò', gia_ban_kg: null, dang_dung: true },
  ] }),
});
ud.luuCauHinh({ ipCan: doiDiaChi ? '127.0.0.2' : '127.0.0.1', congCan: (can.address() as net.AddressInfo).port, congHaiChieu: canHaiChieu.cong });
if (!process.argv.includes('--chua-co-goc')) {
  ud.ghiNhanFileTuCan(file);
  fs.writeFileSync(ud.fileHsdNgay, congNgay(homNayVn(), -1) + '\r\n');   // HSD trên cân tính cho hôm qua
}
const ma = 'xem';
const mc = moMayChu(ud, { ma, phienBan: 'xem thử', khiCoNhip: () => {}, khiDong: () => {} });
console.log(`Mở: http://127.0.0.1:${mc.port}/?t=${ma}`);
