/**
 * Kiểm thử Beeftown Cân — không cần cân thật, không cần kho thật:
 *
 *     cd can-app && npx bun test/thu.ts
 *
 * Cân giả: một máy chủ TCP cục bộ ghi lại mọi byte nhận được, và làm đúng
 * như cân thật đã thử (26/09/2026): chỉ THÊM / SỬA dòng PLU, không xoá.
 * Kho giả: danh mục cho sẵn, đưa qua tuỳ chọn `danhMuc` của UngDung; máy
 * quầy (0054) qua tuỳ chọn `kho` (ghi lại mọi lần gọi hàm kho) và `nguoi`.
 * Phần cuối chạy src/main.ts thật và gọi máy chủ của nó.
 */
import * as fs from 'node:fs';
import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import { LoiCan, LoiKhongNoi, UngDung, cauLoi, guiTcp, quyenCuaVai, thuKetNoi, type DanhMucKho, type NguoiDung } from '../src/nghiep-vu.ts';
import { daiCanDo } from '../src/tim-can.ts';
import { docDsCom, docKetQua, type ChayPs } from '../src/day-rs232.ts';
import { moMayChu } from '../src/may-chu.ts';
import { taoKhoGia } from './kho-gia.ts';
import { docFileCan } from '../../web/src/lib/kho/can-tma.ts';
import type { HangKho } from '../../web/src/lib/kho/can-tma.ts';
import { docThongSo } from '../src/thong-so.ts';
import { chuoiByte, moCanGia } from './can-gia-hai-chieu.ts';
import type { ThayDoiTem } from '../src/tem.ts';
import { thuGiaoThuc } from './thu-giao-thuc.ts';
import { thuTem } from './thu-tem.ts';
import { thuBaoCaoCan } from './thu-bao-cao-can.ts';
import { thuThongSo } from './thu-thong-so.ts';

let dat = 0, hong = 0;
const ok = (ten: string, dieuKien: boolean, chiTiet = '') => {
  if (dieuKien) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten} ${chiTiet}`); }
};
/** Thay đổi tem kèm dấu của mẫu tem đang có (như trang gửi lên — tem() trả `dau`). */
const voiDau = (u: UngDung, t: ThayDoiTem): ThayDoiTem => ({ ...t, dau: u.tem().dau });

// ---- File cân giả (cấu trúc như file thật, firmware V3.14E8) ---------------
const KHUON = 'PLU\t{1}\t{2}\t\t{4}\t{5}\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\t{15}\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\t{64}\t0\t0\t0\t';
const plu = (so: number, ma: string, gia: string, ten: string) => KHUON.replace('{1}', String(so)).replace('{2}', ma)
  .replace('{4}', '1').replace('{5}', gia).replace('{15}', ten).replace('{64}', 'x');
// Mẫu tem 58×40 mm như trên cân của quán: dòng LAB, 14 ô LAS, LAE.
const LAS = [
  [1,0,0,1,0,0,408,43,5],[1,0,6,1,408,1,54,34,5],[3,3,0,1,281,52,152,26,4],[3,1,0,2,6,55,115,26,5],
  [3,0,0,1,137,56,107,26,5],[1,0,1,1,4,90,116,26,5],[1,0,4,1,131,90,111,25,0],[2,27,0,1,260,108,204,35,5],
  [0,0,0,1,3,120,257,74,0],[3,4,0,1,2,198,112,21,5],[2,3,0,1,121,198,156,20,5],[1,0,15,1,114,220,200,26,0],
  [3,16,0,1,1,224,94,23,0],[3,12,0,1,220,255,220,50,0],
].map(([loai, chu, du, dk, x, y, w, h, co]) => `LAS\t29\t${loai}\t${chu}\t${du}\t${dk}\t0\t${co}\t1\t${x}\t${y}\t${w}\t${h}\t`);
const MAU_TEM = ['LAB\t28\tBEEFTOWN\t1\t58\t40\tĐơn giá\tTrọng Lượng\t\tThành Tiền\tNgày đóng gói\t\t\t\t\t\t\t\tBEEFTOWN\t\t\t\t1\tHSD\t', ...LAS, 'LAE\t'];

function fileCan(dong: string[]): Uint8Array {
  const L = ['ECS\tVER\tV3.14E8\t', '', 'DWL\tPLU\t', ...dong, 'END\tPLU\t', '',
    'DWL\tLAB\t', ...MAU_TEM, 'END\tLAB\t', '',
    'DWL\tSCP\t', 'SCP\t0\t1\t1\t', 'SCP\t0\t2\t2\t', 'SCP\t0\t3\t3\t', 'END\tSCP\t', '',
    'DWL\tTMS\t', 'TMS\t0\t28\t', 'TMS\t202\t3\t', 'END\tTMS\t', '',
    'DWL\tTIM\t', 'TIM\t26\t9\t25\t16\t54\t12\t', 'END\tTIM\t', '', 'END\tECS\t', ''];
  const u = new TextEncoder().encode(L.join('\r\n'));
  const ra = new Uint8Array(u.length + 1); ra.set(u); ra[u.length] = 0xFF;   // byte không phải UTF-8 ở cuối
  return ra;
}

// ---- Cân giả ------------------------------------------------------------------
const nhan: Buffer[] = [];
const trenCanGia = new Map<number, string>();   // số PLU → dòng
const mayCan = net.createServer((s) => {
  const phan: Buffer[] = [];
  s.on('data', (d) => phan.push(d));
  s.on('end', () => {
    const du = Buffer.concat(phan);
    if (du.length) {
      nhan.push(du);
      for (const d of du.toString('latin1').split('\r\n')) if (d.startsWith('PLU\t')) trenCanGia.set(Number(d.split('\t')[1]), d);
    }
    s.end();
  });
});
await new Promise<void>((xong) => mayCan.listen(0, '127.0.0.1', () => xong()));
const congCan = (mayCan.address() as net.AddressInfo).port;

const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'beeftown-can-'));
const dd = { cauHinh: path.join(tam, 'appdata'), duLieu: path.join(tam, 'tai-lieu') };

const hang = (ma: string, ma_can: string | null, ten: string, gia_ban_kg: number | null, dang_dung = true): HangKho =>
  ({ ma, ma_can, ten, gia_ban_kg, dang_dung });
let danhMuc: DanhMucKho = { mauMaVach: '2XCCCCCWWWWWK', matHang: [
  hang('LOI-VAI', '10001', 'Lõi vai bò Mỹ', 850000),
  hang('GAU-BO', '10003', 'Gầu bò', 695000),
  hang('THAN-LUNG', '10004', 'Thăn lưng bò Úc', 990000),
] };
const ud = new UngDung(dd, { danhMuc: async () => danhMuc });
ud.luuCauHinh({ ipCan: '127.0.0.1', congCan: congCan });

// =============================================================================
console.log('1 · Bắt đầu: ghi nhận file lưu từ cân');
const fileUsb = fileCan([plu(1, '10001', '845,0', 'Lõi vai bò Mỹ'), plu(2, '10002', '876,0', 'Sườn bò Hàn Quốc'), plu(3, '10003', '695,0', 'Gầu bò')]);
let loi = '';
try { await ud.xemTruoc(); } catch (e) { loi = (e as Error).message; }
ok('Chưa có file gốc thì báo làm bước Bắt đầu', /Bắt đầu/.test(loi), loi);
try { ud.ghiNhanFileTuCan(new TextEncoder().encode('khong phai file can')); loi = ''; } catch (e) { loi = (e as Error).message; }
ok('File lạ bị từ chối', loi !== '', loi);
const g = ud.ghiNhanFileTuCan(fileUsb);
ok('Ghi nhận 3 hàng, phiên bản V3.14E8', g.soHang === 3 && g.phienBan === 'V3.14E8', JSON.stringify(g));
ok('tren-can.tsv có 3 dòng', ud.docTrenCan().size === 3);
ok('File gốc giữ nguyên từng byte', Buffer.compare(fs.readFileSync(ud.fileGoc), Buffer.from(fileUsb)) === 0);

// =============================================================================
console.log('2 · Xem trước: đúng kế hoạch của màn Đồng bộ cân');
const x = await ud.xemTruoc();
ok('1 sửa (giá lõi vai), 1 thêm (thăn lưng), 1 bỏ (sườn), 1 giữ', x.dem.sua === 1 && x.dem.them === 1 && x.dem.xoa === 1 && x.dem.giu === 1, JSON.stringify(x.dem));
ok('Hàng thêm lấy PLU trống nhỏ nhất (2 — chỗ của sườn)', x.dong.find(d => d.loai === 'them')?.so === 2, JSON.stringify(x.dong.map(d => [d.loai, d.so])));
ok('Không trả dòng gốc của file (có mật khẩu WiFi) về trang', x.dong.every(d => !('goc' in d)));
ok('Chưa gửi nên chưa có hàng "còn nằm lại"', x.conLai.length === 0, JSON.stringify(x.conLai));

// =============================================================================
console.log('3 · Gửi xuống cân');
const k = await ud.guiXuongCan();
ok('Cân giả nhận đúng 1 lần', nhan.length === 1);
const guiDi = nhan[0];
ok('Không gửi phần giờ (TIM)', !guiDi.includes(Buffer.from('DWL\tTIM')));
ok('Giữ phần khác của cân (mẫu tem LAB, TMS)', guiDi.includes(Buffer.from('LAB\t28\tBEEFTOWN')) && guiDi.includes(Buffer.from('TMS\t202\t3')));
ok('Giữ byte không phải UTF-8', guiDi[guiDi.length - 1] === 0xFF);
const fGui = docFileCan(new Uint8Array(guiDi));
ok('File gửi có 3 hàng: 10001 giá mới, 10003, 10004 ở PLU 2',
  fGui.plu.map(p => `${p.so}:${p.ma}:${p.gia}`).sort().join() === ['1:10001:850000', '2:10004:990000', '3:10003:695000'].join(), fGui.plu.map(p => `${p.so}:${p.ma}:${p.gia}`).join());
ok('Sườn (PLU 2) bị hàng mới ghi đè — không còn nằm lại', k.conLai.length === 0, JSON.stringify(k.conLai));
ok('File gốc = đúng bản vừa gửi', Buffer.compare(fs.readFileSync(ud.fileGoc), guiDi) === 0);
ok('Có bản lưu trong da-gui', fs.readdirSync(ud.thuMucDaGui).length >= 1);

// =============================================================================
console.log('4 · Bỏ một hàng khỏi kho: WiFi không xoá được → báo "còn nằm lại"');
danhMuc = { ...danhMuc, matHang: danhMuc.matHang.filter(h => h.ma !== 'GAU-BO') };
const x2 = await ud.xemTruoc();
ok('Kế hoạch: gầu bò bỏ khỏi cân', x2.dong.some(d => d.loai === 'xoa' && d.maCan === '10003'));
ok('Và báo gầu bò sẽ còn nằm trên cân', x2.conLai.length === 1 && x2.conLai[0].ma === '10003', JSON.stringify(x2.conLai));
const k2 = await ud.guiXuongCan();
ok('Gửi xong vẫn báo còn nằm lại', k2.conLai.length === 1 && k2.conLai[0].so === 3, JSON.stringify(k2.conLai));
ok('Cân giả (chỉ thêm/sửa) đúng là vẫn còn PLU 3', trenCanGia.has(3));
const x3 = await ud.xemTruoc();
ok('Lần xem sau vẫn nhớ hàng còn nằm lại (dù file gốc không còn nó)', x3.conLai.length === 1 && x3.conLai[0].so === 3, JSON.stringify(x3.conLai));

console.log('4b · Tất cả hàng (SKU)');
const dmCu = danhMuc;
danhMuc = { ...danhMuc, matHang: [
  ...danhMuc.matHang.map(h => (h.ma === 'LOI-VAI' ? { ...h, gia_ban_kg: 860000 } : h)),
  hang('BA-CHI', '10005', 'Ba chỉ bò cuộn', 516000), hang('NAM-BO', '10006', 'Nạm bò', null),
] };
const tc1 = await ud.tatCaHang();
const theoMa = (ma: string) => tc1.hang.find(h => h.maCan === ma);
ok('Đối chiếu được với kho', tc1.coKho && tc1.loiKho === null);
ok('Lõi vai: trên cân, giá khác kho (850.000 ≠ 860.000)', theoMa('10001')?.tinhTrang === 'lech' && theoMa('10001')?.gia === 850000 && theoMa('10001')?.giaKho === 860000, JSON.stringify(theoMa('10001')));
ok('Thăn lưng: khớp kho, PLU 2, phím B', theoMa('10004')?.tinhTrang === 'khop' && theoMa('10004')?.so === 2 && theoMa('10004')?.phim === 'B', JSON.stringify(theoMa('10004')));
ok('Gầu bò: còn nằm lại trên cân (PLU 3)', theoMa('10003')?.tinhTrang === 'con_lai' && theoMa('10003')?.so === 3 && theoMa('10003')?.gia === 695000, JSON.stringify(theoMa('10003')));
ok('Ba chỉ: kho có, chưa lên cân', theoMa('10005')?.tinhTrang === 'chua_len' && theoMa('10005')?.so === null);
ok('Nạm bò: không lên được, có lý do', theoMa('10006')?.tinhTrang === 'khong_len' && /giá/.test(theoMa('10006')?.ghiChu ?? ''));
ok('Mã FABi đủ 5 số', tc1.hang.every(h => /^\d{5}$/.test(h.maFabi)), tc1.hang.map(h => h.maFabi).join());
ok('Xếp theo số PLU, hàng chưa lên cân ở cuối', tc1.hang.map(h => h.so ?? 99).join() === '1,2,3,99,99', tc1.hang.map(h => h.so).join());
const udKhongKho = new UngDung(dd, { danhMuc: async () => { throw new LoiCan('Chưa đăng nhập kho.'); } });
const tc2 = await udKhongKho.tatCaHang();
ok('Chưa đăng nhập kho: vẫn xem được hàng trên cân', !tc2.coKho && /Chưa đăng nhập/.test(tc2.loiKho ?? '')
  && tc2.hang.filter(h => h.tinhTrang === 'tren_can').length === 2 && tc2.hang.some(h => h.tinhTrang === 'con_lai'), JSON.stringify(tc2));
danhMuc = dmCu;

console.log('5 · Nạp USB để xoá');
let loiUsb = '';
try { ud.daNapUsb(); } catch (e) { loiUsb = (e as Error).message; }
ok('Chưa lưu file USB mà bấm "đã nạp" → báo', /Chưa có file nạp USB/.test(loiUsb), loiUsb);
const u = await ud.taoFileUsb();
ok('Lưu file USB: 2 hàng', u.soHang === 2 && fs.existsSync(u.duongDan));
ud.daNapUsb();
ok('Sau khi nạp USB: trên cân còn 2 hàng, hết hàng nằm lại', ud.docTrenCan().size === 2 && (await ud.xemTruoc()).conLai.length === 0);
ok('File USB đã dọn', !fs.existsSync(ud.fileChoUsb));

// =============================================================================
console.log('5b · Mẫu tem');
const t0 = ud.tem();
ok('Đọc mẫu tem 28 "BEEFTOWN" 58×40, 14 ô đang in', t0.tem?.id === '28' && t0.tem.ten === 'BEEFTOWN' && t0.tem.rong === 58 && t0.tem.o.length === 14 && t0.tem.o.every(o => o.bat), JSON.stringify(t0.tem?.o.length));
ok('Chữ cố định đọc đúng (Đơn giá, HSD, BEEFTOWN)', t0.tem?.chu[6] === 'Đơn giá' && t0.tem.chu[23] === 'HSD' && t0.tem.chu[18] === 'BEEFTOWN', JSON.stringify(t0.tem?.chu));
ok('Gọi tên ô: mã vạch, thành tiền, hạn dùng', ['Mã vạch', 'Thành tiền', 'Hạn dùng', 'Tên hàng'].every(t => t0.tem?.o.some(o => o.ten === t)));
ok('Hàng mẫu để vẽ tem là PLU 1', t0.hangMau?.so === 1 && t0.hangMau.ten === 'Lõi vai bò Mỹ');
const khoaVach = t0.tem!.o.find(o => o.ten === 'Mã vạch')!.khoa;
const pluTruocTem = docFileCan(new Uint8Array(fs.readFileSync(ud.fileGoc))).plu.map(p => p.tho).join('\n');
let loiTem = '';
try { await ud.guiTem(voiDau(ud, {})); } catch (e) { loiTem = (e as Error).message; }
ok('Chưa đổi gì mà bấm gửi → báo', /chưa có gì thay đổi/.test(loiTem), loiTem);
try { await ud.guiTem(voiDau(ud, { tat: ['o:99'] })); loiTem = ''; } catch (e) { loiTem = (e as Error).message; }
ok('Ô không có → báo mở lại thẻ Tem', /Mở lại thẻ Tem/.test(loiTem), loiTem);
try { await ud.guiTem(voiDau(ud, { chu: { 23: 'x'.repeat(41) } })); loiTem = ''; } catch (e) { loiTem = (e as Error).message; }
ok('Chữ quá 40 ký tự → báo', /dài quá 40/.test(loiTem), loiTem);
try { await ud.guiTem(voiDau(ud, { chu: { 11: 'lạ' } })); loiTem = ''; } catch (e) { loiTem = (e as Error).message; }
ok('Cột chữ không có trên tem → báo', /không có trên tem/.test(loiTem), loiTem);
const soGuiTruocTem = nhan.length;
await ud.guiTem(voiDau(ud, { chu: { 23: 'Hạn dùng' }, tat: [khoaVach] }));
const guiTem = nhan[nhan.length - 1];
ok('Gửi tem: cân giả nhận thêm 1 lần', nhan.length === soGuiTruocTem + 1);
const fTem = docFileCan(new Uint8Array(guiTem));
const dongLab = fTem.dong.find(d => d.startsWith('LAB\t'))!;
ok('Dòng LAB có chữ mới "Hạn dùng" (UTF-8), chữ khác giữ nguyên', new TextDecoder().decode(Buffer.from(dongLab, 'latin1')).split('\t')[23] === 'Hạn dùng'
  && new TextDecoder().decode(Buffer.from(dongLab, 'latin1')).split('\t')[6] === 'Đơn giá');
ok('Bỏ đúng ô mã vạch: còn 13 ô LAS', fTem.dong.filter(d => d.startsWith('LAS\t')).length === 13 && !fTem.dong.includes(LAS[8]));
ok('Phần hàng (PLU) giữ nguyên từng byte', fTem.plu.map(p => p.tho).join('\n') === pluTruocTem);
ok('Không gửi phần giờ, giữ byte không phải UTF-8', !guiTem.includes(Buffer.from('DWL\tTIM')) && guiTem[guiTem.length - 1] === 0xFF);
ok('File gốc = bản tem vừa gửi', Buffer.compare(fs.readFileSync(ud.fileGoc), guiTem) === 0);
const t1 = ud.tem();
ok('Thẻ Tem: 13 ô đang in + mã vạch đã tắt (bật lại được)', t1.tem!.o.filter(o => o.bat).length === 13 && t1.tem!.o.some(o => !o.bat && o.ten === 'Mã vạch' && o.khoa === 't:0'), JSON.stringify(t1.tem!.o.filter(o => !o.bat)));
await ud.guiTem(voiDau(ud, { bat: ['t:0'], chu: { 23: 'HSD' } }));
const fTem2 = docFileCan(new Uint8Array(nhan[nhan.length - 1]));
ok('Bật lại mã vạch + trả chữ HSD: mẫu tem y như lúc đầu', fTem2.dong.slice(fTem2.dong.findIndex(d => d.startsWith('LAB\t')), fTem2.dong.indexOf('LAE\t') + 1).join('\n')
  === MAU_TEM.map(d => Buffer.from(d, 'utf8').toString('latin1')).join('\n'));
ok('Hết ô đã tắt', ud.tem().tem!.o.every(o => o.bat));
const soGuiTruocUsb = nhan.length;
const uTem = await ud.taoFileUsbTem(voiDau(ud, { tat: [khoaVach] }));
ok('Tem qua USB: lưu file, không gửi WiFi', fs.existsSync(uTem.duongDan) && nhan.length === soGuiTruocUsb && uTem.soHang === 2);
ok('Chưa nạp USB: thẻ Tem vẫn như cân đang có', ud.tem().tem!.o.every(o => o.bat));
ud.daNapUsb();
ok('Nạp USB xong: mã vạch thành ô đã tắt', ud.tem().tem!.o.filter(o => !o.bat).map(o => o.ten).join() === 'Mã vạch');
await ud.guiTem(voiDau(ud, { bat: ['t:0'] }));
ok('Bật lại qua WiFi', ud.tem().tem!.o.length === 14 && ud.tem().tem!.o.every(o => o.bat));

// =============================================================================
console.log('5c · Tự gửi khi kho đổi (GĐ3)');
{
  const soGui0 = nhan.length;
  const t1 = await ud.tuGuiMotLan();
  ok('Kho không đổi → không gửi', !t1.daGui && nhan.length === soGui0 && /khớp/.test(t1.cau), JSON.stringify(t1));
  danhMuc = { ...danhMuc, matHang: danhMuc.matHang.map(h => (h.ma === 'LOI-VAI' ? { ...h, gia_ban_kg: 870000 } : h)) };
  const t2 = await ud.tuGuiMotLan();
  ok('Đổi giá lõi vai → tự gửi 1 sửa', t2.daGui && nhan.length === soGui0 + 1 && /1 sửa/.test(t2.cau), JSON.stringify(t2));
  ok('Cân giả nhận giá mới 870', docFileCan(new Uint8Array(nhan[nhan.length - 1])).plu.some(p => p.ma === '10001' && p.gia === 870000));
  const t3 = await ud.tuGuiMotLan();
  ok('Gửi xong lần sau không gửi lại', !t3.daGui && nhan.length === soGui0 + 1);
  ok('Trạng thái nhớ lần tự gửi gần nhất', ud.lanTuGui?.cau === t3.cau);
  ud.luuCauHinh({ tuGui: true });
  ok('Lưu cài đặt bật tự gửi', ud.cauHinh().tuGui === true);
  ud.luuCauHinh({ ipCan: '127.0.0.1' });
  ok('Lưu cài đặt khác không tắt tự gửi', ud.cauHinh().tuGui === true);
  ud.luuCauHinh({ tuGui: false });
}

// =============================================================================
console.log('5d · Máy quầy (0054) — kho giả');
{
  const { kho, goiKho, anhDaTai, MH, Q1, LD, L } = taoKhoGia();
  const cn = { id: 'cn1', ma: 'q1', ten: 'Hàm Nghi' };
  const nguoi = (vai: string): NguoiDung => ({ email: vai + '@b', hoTen: vai, vaiTro: vai, chiNhanh: cn, cacChiNhanh: [cn], quyen: quyenCuaVai(vai) });
  const dd3 = { cauHinh: path.join(tam, 'appdata3'), duLieu: path.join(tam, 'tai-lieu3') };
  const nv = new UngDung(dd3, { kho, nguoi: nguoi('nhan_vien_quay') });
  const ql = new UngDung(dd3, { kho, nguoi: nguoi('quan_ly') });
  const kt = new UngDung(dd3, { kho, nguoi: nguoi('ke_toan') });
  // Cân đang có: mã giảm 90001 ở PLU 5; ô 1 in tên cũ (tảng #0142), ô 2 tên món.
  nv.ghiNhanFileTuCan(fileCan([plu(1, '107', '1350,0', 'Steak Ribeye Angus'), plu(5, '90001', '945,0', 'Steak Ribeye Angus -30%'),
    plu(6, '10071', '1350,0', 'Steak Ribeye Angus #0142'), plu(7, '10072', '1350,0', 'Steak Ribeye Angus')]));
  const loiCua = async (f: () => Promise<unknown>) => { try { await f(); return ''; } catch (e) { return (e as Error).message; } };

  ok('Quyền theo vai: NV quầy vận hành, không danh mục / giá; kế toán xem giá', nguoi('nhan_vien_quay').quyen.vanHanh && !nguoi('nhan_vien_quay').quyen.danhMuc
    && !nguoi('nhan_vien_quay').quyen.xemGia && nguoi('ke_toan').quyen.xemGia && !nguoi('ke_toan').quyen.vanHanh);

  const q = await nv.bangQuay();
  ok('Bảng quầy: 1 lô hết hạn, 2 lô cận date, 2 món dưới mức', q.dem.hetHan === 1 && q.dem.canDate === 2 && q.dem.canLay === 2, JSON.stringify(q.dem));
  const rib = q.canDate.find(l => l.lo_id === L.can)!;
  ok('Lô Ribeye cận date: xếp ra trước (quầy có lô hạn xa hơn), gợi ý mã giảm 90001 ở PLU 5',
    rib.xepTruoc && rib.maGiam.length === 1 && rib.maGiam[0].ma_can === '90001' && rib.maGiam[0].plu === 5 && rib.maGiam[0].gia_giam_kg === 945000, JSON.stringify(rib));
  ok('Lô bắp cận date: không có lô khác → không "xếp trước", không mã giảm', !q.canDate.find(l => l.lo_id === L.q2)!.xepTruoc
    && q.canDate.find(l => l.lo_id === L.q2)!.maGiam.length === 0);
  ok('Lô hết hạn có số tảng #0142', q.hetHan[0].so_tang === '#0142');
  const tonRib = q.ton.find(t => t.mat_hang_id === MH.rib)!;
  ok('Tồn Ribeye: 7 gói còn hạn (không tính gói hết hạn), có gói hết hạn', tonRib.soGoi === 7 && tonRib.soGoiHetHan === 2 && tonRib.tinhTrang === 'co_het_han'
    && tonRib.hanGanNhat === '2026-09-29', JSON.stringify(tonRib));
  ok('Tồn xúc xích: hết ở quầy', q.ton.find(t => t.mat_hang_id === MH.xx)!.tinhTrang === 'het');
  ok('Trả quyền cho trang', q.quyen.vanHanh && !q.quyen.danhMuc);

  const mg = crypto.randomUUID();
  const yc = await nv.taoYeuCau({ maGui: mg, nguon: 'goi_y', ghiChu: '  Ca tối ', dong: [{ mat_hang_id: MH.rib, so_goi: 9 }] });
  const gYc = goiKho.find(x => x.ten === 'kho_tao_yeu_cau')!;
  ok('NV quầy gửi yêu cầu lấy hàng: đúng quầy đầu tiên, nguồn gợi ý, ghi chú gọn', yc.soPhieu === 'YC-0001' && gYc.thamSo.p_vi_tri_id === Q1
    && gYc.thamSo.p_nguon === 'goi_y' && gYc.thamSo.p_ghi_chu === 'Ca tối' && gYc.thamSo.p_ma_gui === mg, JSON.stringify(gYc));
  ok('Yêu cầu: số gói không nguyên → báo', /số nguyên/.test(await loiCua(() => nv.taoYeuCau({ maGui: crypto.randomUUID(), dong: [{ mat_hang_id: MH.rib, so_goi: 1.5 }] }))));
  ok('Yêu cầu: không có ma_gui → báo', /Mở lại form/.test(await loiCua(() => nv.taoYeuCau({ dong: [{ mat_hang_id: MH.rib, so_goi: 1 }] }))));
  ok('Kế toán không tạo được yêu cầu', /không tạo được/.test(await loiCua(() => kt.taoYeuCau({ maGui: crypto.randomUUID(), dong: [] }))));

  const mgH = crypto.randomUUID();
  ok('Huỷ lý do cần ảnh mà không có ảnh → báo', /cần ảnh/.test(await loiCua(() => nv.taoPhieuHuy({ maGui: mgH, lyDoId: LD.han, dong: [{ lo_id: L.het }] }))));
  ok('Huỷ quá số gói → báo', /từ 1 đến 2/.test(await loiCua(() => nv.taoPhieuHuy({ maGui: mgH, lyDoId: LD.khac, dong: [{ lo_id: L.het, so_goi: 3 }] }))));
  ok('Huỷ hai quầy một phiếu → báo', /một quầy/.test(await loiCua(() => nv.taoPhieuHuy({ maGui: mgH, lyDoId: LD.khac, dong: [{ lo_id: L.het }, { lo_id: L.q2 }] }))));
  const anh = { ten: 'hang.jpg', loai: 'image/jpeg', base64: Buffer.from('anh-gia').toString('base64') };
  const h = await nv.taoPhieuHuy({ maGui: mgH, lyDoId: LD.han, ghiChu: 'bỏ', dong: [{ lo_id: L.het }, { lo_id: L.can, so_goi: 1 }], anh: [anh] });
  const gH = goiKho.find(x => x.ten === 'kho_tao_phieu_xuat')!;
  ok('Phiếu huỷ: tải ảnh trước, gọi kho loại huy ở quầy, đủ dòng lô', h.soPhieu === 'PX-0009' && anhDaTai.length === 1
    && gH.thamSo.p_loai === 'huy' && gH.thamSo.p_vi_tri_id === Q1 && (gH.thamSo.p_anh as string[])[0] === anhDaTai[0]
    && JSON.stringify(gH.thamSo.p_dong) === JSON.stringify([{ mat_hang_id: MH.rib, lo_id: L.het, so_goi: 2 }, { mat_hang_id: MH.rib, lo_id: L.can, so_goi: 1 }]),
    JSON.stringify(gH.thamSo));

  ok('NV quầy không gửi được xuống cân (danh mục)', /quản lý hoặc chủ/.test(await loiCua(() => nv.xemTruoc())));
  ok('NV quầy không tạo được mã giảm', /quản lý hoặc chủ/.test(await loiCua(() => nv.luuMaGiam({ matHangId: MH.rib, phanTram: 30 }))));
  ok('NV quầy không xem được báo cáo doanh thu', /chủ, quản lý, kế toán/.test(await loiCua(() => nv.baoCao({ tu: '2026-09-22', den: '2026-09-28' }))));

  const to = await nv.tangVaO();
  const o1 = to.nhom[0].o.find(o => o.so_o === 1)!, o2 = to.nhom[0].o.find(o => o.so_o === 2)!;
  ok('Tảng & ô: ô 1 đang bán tảng #0150, bán 25%, lệch 2', o1.tinhTrang === 'dang_ban' && o1.soTang === '#0150' && o1.banPt === 25 && o1.so_lech_o === 2
    && to.nhom[0].lech === 2 && to.nhom[0].dangBan === 1, JSON.stringify(o1));
  ok('Ô 1: cân chưa đổi tên (đang in #0142, kho muốn #0150)', !o1.canDaDoi && o1.tenTrenCan === 'Steak Ribeye Angus #0142' && o1.tenMuon === 'Steak Ribeye Angus #0150');
  ok('Ô 2 trống: tên món, cân đúng', o2.tinhTrang === 'trong' && o2.canDaDoi);

  const gv = await nv.maGiam();
  ok('Mã giảm (NV xem được, không sửa): -30% đã lên cân, giá 945.000', !gv.sua && gv.ds.find(g => g.ma_can === '90001')?.daLenCan === true
    && gv.ds.find(g => g.ma_can === '90001')?.giaGiam === 945000 && gv.ds.find(g => g.ma_can === '90003')?.dang_dung === false, JSON.stringify(gv.ds));
  ok('Món tạo được mã giảm: có mã cân và giá (không tảng, không món thiếu mã)', gv.monTaoDuoc.map(m => m.ma).join() === 'C-BAP,C-RIB', gv.monTaoDuoc.map(m => m.ma).join());

  ok('Quản lý: mức 3% → báo', /5% đến 90%/.test(await loiCua(() => ql.luuMaGiam({ matHangId: MH.rib, phanTram: 3 }))));
  const tao = await ql.luuMaGiam({ matHangId: MH.rib, phanTram: 50, maCan: '' });
  ok('Quản lý tạo mã giảm -50%: gọi kho, mã tự lấy', tao.maCan === '90002' && goiKho.some(x => x.ten === 'kho_luu_ma_giam' && x.thamSo.p_ma_can === null && x.thamSo.p_phan_tram === 50));
  ok('Quản lý tắt mã giảm', /Đã tắt/.test((await ql.batMaGiam({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001', bat: false })).cau));
  ok('Quản lý thấy nút sửa mã giảm', (await ql.maGiam()).sua);

  ok('Báo cáo: khoảng ngày ngược → báo', /trước ngày kết thúc/.test(await loiCua(() => kt.baoCao({ tu: '2026-09-28', den: '2026-09-01' }))));
  const bc = await kt.baoCao({ tu: '2026-09-22', den: '2026-09-28' });
  ok('Báo cáo (kế toán): tổng doanh thu, kg, giảm giá, giảm sớm, lệch ô', bc.tong.doanhThu === 2505000 && bc.tong.kg === 2.5 && bc.tong.tienGiam === 202500
    && bc.tong.soDongGiamSom === 1 && bc.tong.soDongLechO === 1 && bc.tong.soNgay === 2, JSON.stringify(bc.tong));
  ok('Báo cáo: theo giờ 11h, 18h; món chạy nhất Ribeye; có tảng', bc.theoGio.map(g => g.gio).join() === '11,18' && bc.theoMon[0].mat_hang_id === MH.rib && bc.tang.length === 1);
}

// =============================================================================
console.log('6 · Kết nối cân');
ok('Thử kết nối cân giả: thông', (await ud.thuCan()).thongCan);
const congDong = await new Promise<number>((xong) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = (s.address() as net.AddressInfo).port; s.close(() => xong(p)); }); });
ok('Thử kết nối cổng đóng: không thông', !(await thuKetNoi('127.0.0.1', congDong)));
let loiGui: unknown = null;
try { await guiTcp('127.0.0.1', congDong, new Uint8Array([1, 2, 3])); } catch (e) { loiGui = e; }
ok('Gửi vào cổng đóng: câu lỗi chỉ cách xử lý', /Không kết nối được cân.*Prog → 4 → 2/.test(cauLoi(loiGui)), cauLoi(loiGui));
ok('… và là lỗi "chưa nối được" (dò tìm cân rồi gửi lại được)', loiGui instanceof LoiKhongNoi);
let loiCauHinh = '';
try { ud.luuCauHinh({ ipCan: 'abc' }); } catch (e) { loiCauHinh = (e as Error).message; }
ok('Địa chỉ cân sai dạng bị từ chối', /192\.168/.test(loiCauHinh), loiCauHinh);
try { ud.luuCauHinh({ ipCan: '192.168.1.300' }); loiCauHinh = ''; } catch (e) { loiCauHinh = (e as Error).message; }
ok('Địa chỉ quá 255 bị từ chối', /192\.168/.test(loiCauHinh), loiCauHinh);

// =============================================================================
console.log('6b · Cân đổi địa chỉ: tự dò WiFi tìm cân');
{
  const tom = (ds: ReturnType<typeof daiCanDo>) => ds.map(d => `${d.ten}:${d.ds.length}`).join();
  ok('Dải cần dò: mạng /24 dò đủ 253 địa chỉ (bỏ chính máy)', tom(daiCanDo([{ ip: '192.168.1.5', mask: '255.255.255.0' }], '192.168.1.22')) === '192.168.1.0/24:253'
    && !daiCanDo([{ ip: '192.168.1.5', mask: '255.255.255.0' }])[0].ds.includes('192.168.1.5'));
  ok('Mạng to (/16): chỉ dò dải /24 của địa chỉ cũ rồi dải /24 của máy', tom(daiCanDo([{ ip: '10.0.5.7', mask: '255.255.0.0' }], '10.0.9.3')) === '10.0.9.0/24:254,10.0.5.0/24:253');
  ok('Mạng /22 dò hết; mạng có địa chỉ cũ dò trước', tom(daiCanDo([{ ip: '172.16.1.9', mask: '255.255.252.0' }, { ip: '192.168.56.1', mask: '255.255.255.0' }], '192.168.56.20'))
    === '192.168.56.0/24:253,172.16.0.0/22:1021');

  // Mạng giả 127.0.0.0/24: trên Linux cả dải 127.x là chính máy, mở cân giả ở địa chỉ nào cũng được.
  const nhanMoi: Buffer[] = [];
  const canTai = (ip: string, cong: number) => new Promise<net.Server | null>((xong) => {
    const s = net.createServer((c) => {
      const phan: Buffer[] = [];
      c.on('data', (d) => phan.push(d as Buffer));
      c.on('end', () => { if (phan.length) nhanMoi.push(Buffer.concat(phan)); c.end(); });
    });
    s.once('error', () => xong(null));
    s.listen(cong, ip, () => xong(s));
  });
  const dong = (s: net.Server | null) => new Promise<void>((xong) => (s ? s.close(() => xong()) : xong()));
  const can37 = await canTai('127.0.0.37', 0);
  if (!can37) console.log('  – bỏ qua: máy này không mở được địa chỉ 127.0.0.37 (Mac chỉ có 127.0.0.1)');
  else {
    const cong = (can37.address() as net.AddressInfo).port;
    const dd4 = { cauHinh: path.join(tam, 'appdata4'), duLieu: path.join(tam, 'tai-lieu4') };
    const ud4 = new UngDung(dd4, { danhMuc: async () => danhMuc, mang: [{ ip: '127.0.0.1', mask: '255.255.255.0' }] });
    ud4.ghiNhanFileTuCan(fileUsb);
    ud4.luuCauHinh({ ipCan: '127.0.0.22', congCan: cong });
    const g4 = await ud4.guiXuongCan();
    ok('Gửi: địa chỉ cũ không nối được → tự dò thấy cân ở 127.0.0.37, gửi lại', g4.doiDiaChi?.tu === '127.0.0.22' && g4.doiDiaChi.den === '127.0.0.37'
      && nhanMoi.length === 1, JSON.stringify(g4.doiDiaChi));
    ok('Lưu địa chỉ mới và nhớ lần đổi', ud4.cauHinh().ipCan === '127.0.0.37' && ud4.cauHinh().doiDiaChi?.length === 1);
    ok('Gửi xong: file gốc = bản cân giả nhận', Buffer.compare(fs.readFileSync(ud4.fileGoc), nhanMoi[0]) === 0);
    const t1 = await ud4.thuCan();
    ok('Kiểm tra kết nối: thông ngay, không dò', t1.thongCan && t1.daThu === 0 && t1.doi === null);

    await dong(can37);
    const can38 = await canTai('127.0.0.38', cong);
    const t2 = await ud4.thuCan();
    ok('Cân lại đổi sang .38: nút Kiểm tra kết nối tự tìm ra, lưu', t2.thongCan && t2.doi?.den === '127.0.0.38' && t2.daThu === 253 && t2.dai.join() === '127.0.0.0/24'
      && ud4.cauHinh().ipCan === '127.0.0.38' && ud4.cauHinh().doiDiaChi?.map(d => d.den).join() === '127.0.0.38,127.0.0.37', JSON.stringify(t2));

    const can39 = await canTai('127.0.0.39', cong);
    const t3 = await ud4.timCan();
    ok('Tìm cân: thấy 2 cân, địa chỉ đang dùng vẫn thông → giữ nguyên', t3.thay.join() === '127.0.0.38,127.0.0.39' && t3.thongCan && t3.doi === null
      && ud4.cauHinh().ipCan === '127.0.0.38', JSON.stringify(t3));
    await dong(can38);
    const can40 = await canTai('127.0.0.40', cong);
    const soNhan = nhanMoi.length;
    let loi4 = '';
    try { await ud4.guiTem(voiDau(ud4, { chu: { 23: 'Hạn dùng' } })); } catch (e) { loi4 = (e as Error).message; }
    ok('Mất cân đang dùng, thấy 2 cân khác → không tự chọn, chỉ cách chọn', /Thấy 2 cân trong WiFi \(127\.0\.0\.39, 127\.0\.0\.40\).*Tìm cân/.test(loi4)
      && ud4.cauHinh().ipCan === '127.0.0.38' && nhanMoi.length === soNhan, loi4);
    const t4 = await ud4.thuCan();
    ok('Kiểm tra kết nối: không thông, trả 2 cân để chọn', !t4.thongCan && t4.thay.length === 2 && t4.doi === null);
    await dong(can39); await dong(can40);

    try { await ud4.guiXuongCan(); loi4 = ''; } catch (e) { loi4 = (e as Error).message; }
    ok('Không thấy cân nào: báo đã dò 253 địa chỉ và cách xử lý', /dò cả 253 địa chỉ.*\(127\.0\.0\.0\/24\).*Prog → 4 → 2/.test(loi4), loi4);
    ok('Không ghi lần đổi nào khi không thấy cân', ud4.cauHinh().doiDiaChi?.length === 2);
    try { await new UngDung(dd4, { danhMuc: async () => danhMuc, mang: [] }).guiXuongCan(); loi4 = ''; } catch (e) { loi4 = (e as Error).message; }
    ok('Máy tính chưa vào mạng nào → nói thẳng', /chưa vào mạng nào/.test(loi4), loi4);

    danhMuc = { ...danhMuc, matHang: danhMuc.matHang.map(h => (h.ma === 'LOI-VAI' ? { ...h, gia_ban_kg: 880000 } : h)) };
    const tg1 = await ud4.tuGuiMotLan();
    ok('Tự gửi khi cân tắt: vừa dò không thấy cân thì chưa dò lại (5 phút một lần)', !tg1.daGui && ud4.lanDoHong > 0
      && /Không kết nối được cân ở 127\.0\.0\.38/.test(tg1.cau) && !/dò cả/.test(tg1.cau), tg1.cau);
    const can41 = await canTai('127.0.0.41', cong);
    ud4.lanDoHong = Date.now() - 6 * 60_000;
    const tg2 = await ud4.tuGuiMotLan();
    ok('Tự gửi quá 5 phút: dò lại, thấy cân ở .41, gửi', tg2.daGui && /1 sửa.*đã tìm thấy ở 127\.0\.0\.41/.test(tg2.cau) && ud4.cauHinh().ipCan === '127.0.0.41'
      && ud4.lanDoHong === 0 && docFileCan(new Uint8Array(nhanMoi[nhanMoi.length - 1])).plu.some(p => p.ma === '10001' && p.gia === 880000), tg2.cau);
    await dong(can41);
    const can43 = await canTai('127.0.0.43', cong);
    danhMuc = { ...danhMuc, matHang: danhMuc.matHang.map(h => (h.ma === 'LOI-VAI' ? { ...h, gia_ban_kg: 890000 } : h)) };
    const tg3 = await ud4.tuGuiMotLan();
    ok('Lần dò trước thấy cân mà cân lại đổi địa chỉ: tự gửi dò ngay, không chờ 5 phút', tg3.daGui && ud4.cauHinh().ipCan === '127.0.0.43', tg3.cau);

    await dong(can43);
    const can44 = await canTai('127.0.0.44', cong);
    const soDoi = ud4.cauHinh().doiDiaChi?.length;
    const dangTim = ud4.timCan();
    ud4.luuCauHinh({ ipCan: '127.0.0.44' });
    const t5 = await dangTim;
    ok('Đang dò mà người gõ địa chỉ tay: kiểm lại theo địa chỉ mới, không tự đổi đè lên', t5.thongCan && t5.doi === null && t5.ipCan === '127.0.0.44'
      && ud4.cauHinh().ipCan === '127.0.0.44' && ud4.cauHinh().doiDiaChi?.length === soDoi, JSON.stringify(t5));
    const dangTim2 = ud4.timCan();
    ud4.luuCauHinh({ ipCan: '127.0.0.99' });
    const t6 = await dangTim2;
    ok('Đang dò mà người gõ nhầm địa chỉ: kiểm lại theo địa chỉ mới, vẫn tìm ra cân ở .44', t6.thongCan && t6.ipCan === '127.0.0.44'
      && t6.doi?.tu === '127.0.0.99' && t6.loi === null, JSON.stringify(t6));

    let lanGui = 0;
    const ud5 = new UngDung(dd4, { danhMuc: async () => danhMuc, mang: [{ ip: '127.0.0.1', mask: '255.255.255.0' }],
      gui: async () => { lanGui++; throw new LoiCan('Cân đóng kết nối trước khi nhận hết. Gửi lại.'); } });
    try { await ud5.guiXuongCan(); loi4 = ''; } catch (e) { loi4 = (e as Error).message; }
    ok('Hỏng khi đang gửi dở: không dò, không tự gửi lại', /trước khi nhận hết/.test(loi4) && lanGui === 1 && ud5.lanDoHong === 0, loi4);

    const mc = moMayChu(ud4, { ma: 'thu', phienBan: 'thu', khiCoNhip: () => {}, khiDong: () => {} });
    const goiApi = async (d: string) => (await fetch(`http://127.0.0.1:${mc.port}${d}?t=thu`, { method: 'POST' })).json() as Promise<Record<string, unknown>>;
    await dong(can44);
    const can45 = await canTai('127.0.0.45', cong);
    const a1 = await goiApi('/api/tim-can');
    ok('API tìm cân: thấy .45, tự dùng', a1.ok === true && a1.thongCan === true && (a1.doi as { den: string })?.den === '127.0.0.45' && a1.ipCan === '127.0.0.45', JSON.stringify(a1));
    const a2 = await goiApi('/api/trang-thai');
    ok('API trạng thái: có lịch sử đổi địa chỉ', ((a2.cauHinh as { doiDiaChi: unknown[] }).doiDiaChi).length === 6, JSON.stringify(a2.cauHinh));
    const a3 = await goiApi('/api/can');
    ok('API ô Cân (trang làm mới mỗi phút): địa chỉ mới, lần tự gửi', a3.ok === true && (a3.cauHinh as { ipCan: string }).ipCan === '127.0.0.45'
      && /đã tìm thấy ở 127\.0\.0\.43/.test((a3.lanTuGui as { cau: string }).cau), JSON.stringify(a3.lanTuGui));
    mc.stop(true);
    await dong(can45);

    console.log('6b2 · Máy khác (khác mã máy) mở cổng cân: không tự chuyển sang');
    const macCua: Record<string, string> = {};
    const dd7 = { cauHinh: path.join(tam, 'appdata7'), duLieu: path.join(tam, 'tai-lieu7') };
    const ud7 = new UngDung(dd7, { danhMuc: async () => danhMuc, mang: [{ ip: '127.0.0.1', mask: '255.255.255.0' }], mac: async (ip) => macCua[ip] ?? null });
    ud7.ghiNhanFileTuCan(fileUsb);
    const can51 = await canTai('127.0.0.51', cong);
    macCua['127.0.0.51'] = 'aa:aa:aa:00:00:01';
    ud7.luuCauHinh({ ipCan: '127.0.0.51', congCan: cong });
    ok('Nối được cân: nhớ mã máy', (await ud7.thuCan()).thongCan && ud7.cauHinh().macCan === 'aa:aa:aa:00:00:01');
    await dong(can51);
    const can52 = await canTai('127.0.0.52', cong);
    macCua['127.0.0.52'] = 'aa:aa:aa:00:00:01';
    const m1 = await ud7.thuCan();
    ok('Cân đổi địa chỉ, cùng mã máy → tự theo', m1.thongCan && m1.doi?.den === '127.0.0.52' && ud7.cauHinh().macCan === 'aa:aa:aa:00:00:01', JSON.stringify(m1));
    await dong(can52);
    const can53 = await canTai('127.0.0.53', cong);
    macCua['127.0.0.53'] = 'bb:bb:bb:00:00:02';
    const m2 = await ud7.thuCan();
    ok('Chỉ thấy một cân nhưng khác mã máy (cân khác) → không tự chuyển, trả địa chỉ để chọn', !m2.thongCan && m2.doi === null
      && m2.thay.join() === '127.0.0.53' && /không phải cân vẫn dùng/.test(m2.loi ?? '') && ud7.cauHinh().ipCan === '127.0.0.52', JSON.stringify(m2));
    const soNhan7 = nhanMoi.length;
    let loi7 = '';
    try { await ud7.guiXuongCan(); } catch (e) { loi7 = (e as Error).message; }
    ok('Gửi lúc đó: không gửi danh mục sang cân khác', /không phải cân vẫn dùng/.test(loi7) && nhanMoi.length === soNhan7, loi7);
    ud7.luuCauHinh({ ipCan: '127.0.0.53' });
    ok('Người chọn cân .53: quên mã máy cũ', ud7.cauHinh().macCan === undefined);
    ok('… nối được thì nhớ mã máy mới', (await ud7.thuCan()).thongCan && ud7.cauHinh().macCan === 'bb:bb:bb:00:00:02');
    await dong(can53);
    const can54 = await canTai('127.0.0.54', cong);
    const m3 = await ud7.thuCan();
    ok('Không đọc được mã máy của máy mới → vẫn tự theo (không biết thì không chặn), giữ mã máy cũ', m3.thongCan && m3.doi?.den === '127.0.0.54'
      && ud7.cauHinh().macCan === 'bb:bb:bb:00:00:02', JSON.stringify(m3));
    await dong(can54);
  }

  console.log('6b3 · Việc ghi xuống cân chạy lần lượt');
  {
    let dangGui = 0, nhieuNhat = 0, soLan = 0;
    const dd8 = { cauHinh: path.join(tam, 'appdata8'), duLieu: path.join(tam, 'tai-lieu8') };
    const ud8 = new UngDung(dd8, { danhMuc: async () => danhMuc,
      gui: async () => { dangGui++; soLan++; nhieuNhat = Math.max(nhieuNhat, dangGui); await Bun.sleep(40); dangGui--; } });
    ud8.ghiNhanFileTuCan(fileUsb);
    await Promise.all([ud8.guiXuongCan(), ud8.tuGuiMotLan(), ud8.guiTem(voiDau(ud8, { chu: { 23: 'Hạn dùng' } }))]);
    const goc8 = docFileCan(new Uint8Array(fs.readFileSync(ud8.fileGoc)));
    ok('Tự gửi + bấm Gửi + gửi tem cùng lúc: lần lượt, không chồng nhau', nhieuNhat === 1 && soLan >= 2, `${nhieuNhat} cùng lúc, ${soLan} lần`);
    const giaLoiVai = danhMuc.matHang.find(h => h.ma === 'LOI-VAI')!.gia_ban_kg;
    ok('Việc sau làm trên kết quả việc trước: file gốc có cả giá kho lẫn tem mới', goc8.plu.some(p => p.ma === '10001' && p.gia === giaLoiVai)
      && new TextDecoder().decode(Buffer.from(goc8.dong.find(d => d.startsWith('LAB\t'))!, 'latin1')).split('\t')[23] === 'Hạn dùng');
  }
}

// =============================================================================
console.log('6c · Dây RS232 (thử) — PowerShell giả');
{
  ok('Danh sách cổng: COM1, COM3, COM10 kèm tên dễ đọc, bỏ ký tự lạ', (() => {
    const ds = docDsCom('COM\tCOM3\r\nCOM\tCOM10\r\nCOM\tCOM1\u0000x\r\nTEN\tUSB-SERIAL CH340 (COM3)\r\nTEN\tCổng Giao tiếp (COM1)\r\nOK\r\n');
    return ds.map(c => c.ten).join() === 'COM1,COM3,COM10' && ds[1].moTa === 'USB-SERIAL CH340 (COM3)' && ds[0].moTa === 'Cổng Giao tiếp (COM1)' && ds[2].moTa === 'COM10';
  })());
  const loiDoc = (ra: string) => { try { docKetQua(ra, 'COM3'); return ''; } catch (e) { return (e as Error).message; } };
  ok('Lỗi cổng đang bị dùng → câu dễ hiểu', /COM3 đang bị chương trình khác dùng/.test(loiDoc("LOI\tUnauthorizedAccessException\tAccess to the port 'COM3' is denied.\r\n")));
  ok('Lỗi không có cổng → câu dễ hiểu', /Không thấy cổng COM3/.test(loiDoc("LOI\tIOException\tThe port 'COM3' does not exist.\r\n")));
  ok('Lỗi quá giờ → câu dễ hiểu', /quá giờ/.test(loiDoc('LOI\tTimeoutException\tThe write timed out.\r\n')));
  ok('PowerShell không in dòng OK → báo', /không trả kết quả/.test(loiDoc('Windows PowerShell\r\n')));
  ok('Dòng OK trống (không nghe được gì) đọc được', loiDoc('OK\t\r\n') === '' && docKetQua('OK\t\r\n', 'COM3') === '');
  const khongNem = <T>(f: () => T): T | string => { try { return f(); } catch (e) { return `ném lỗi: ${(e as Error).message}`; } };
  const bom = [khongNem(() => docKetQua('\uFEFFOK\t3000\r\n', 'COM3')), khongNem(() => docDsCom('\uFEFFCOM\tCOM3\r\nOK\r\n').map(c => c.ten).join())];
  ok('Dấu BOM đầu dòng (Windows PowerShell 5.1) không làm hỏng kết quả', bom[0] === '3000' && bom[1] === 'COM3'
    && /COM3 đang bị/.test(loiDoc("\uFEFFLOI\tUnauthorizedAccessException\tdenied\r\n")), JSON.stringify(bom));

  const goiPs: { lenh: string; bien: Record<string, string>; tep: Buffer | null }[] = [];
  let traLoi: (bien: Record<string, string>) => string = () => 'OK\r\n';
  const chayPs: ChayPs = async (lenh, bien) => {
    goiPs.push({ lenh, bien, tep: bien.BT_TEP ? fs.readFileSync(bien.BT_TEP) : null });
    return traLoi(bien);
  };
  const dd6 = { cauHinh: path.join(tam, 'appdata6'), duLieu: path.join(tam, 'tai-lieu6') };
  const ud6 = new UngDung(dd6, { danhMuc: async () => danhMuc, chayPs });
  ud6.ghiNhanFileTuCan(fileUsb);
  const loiCua = async (f: () => Promise<unknown>) => { try { await f(); return ''; } catch (e) { return cauLoi(e); } };
  ok('Gửi thử: cổng sai dạng → báo', /Chọn cổng COM/.test(await loiCua(() => ud6.guiThuQuaDay({ com: 'abc', baud: 9600 }))));
  ok('Gửi thử: tốc độ lạ → báo', /Chọn tốc độ/.test(await loiCua(() => ud6.guiThuQuaDay({ com: 'COM3', baud: 1234 }))));
  danhMuc = { mauMaVach: '2XCCCCCWWWWWK', matHang: [hang('LOI-VAI', '10001', 'Lõi vai bò Mỹ', 845000), hang('SUON', '10002', 'Sườn bò Hàn Quốc', 876000), hang('GAU-BO', '10003', 'Gầu bò', 695000)] };
  ok('Gửi thử: kho và cân đang khớp → báo, không gửi', /đang khớp/.test(await loiCua(() => ud6.guiThuQuaDay({ com: 'COM3', baud: 9600 }))) && goiPs.length === 0);

  danhMuc = { mauMaVach: '2XCCCCCWWWWWK', matHang: [hang('LOI-VAI', '10001', 'Lõi vai bò Mỹ', 860000), hang('GAU-BO', '10003', 'Gầu bò', 695000)] };
  const gocTruoc = fs.readFileSync(ud6.fileGoc), trenTruoc = fs.readFileSync(ud6.fileTrenCan);
  traLoi = (b) => `OK\t${fs.statSync(b.BT_TEP).size}\r\n`;
  const g6 = await ud6.guiThuQuaDay({ com: 'COM3', baud: 9600 });
  const lan = goiPs[goiPs.length - 1];
  ok('Gửi thử: cổng, tốc độ, file tạm qua biến môi trường; đẩy từng 1 KB', lan.bien.BT_COM === 'COM3' && lan.bien.BT_BAUD === '9600'
    && /\$p\.Write\(\$b, \$i,/.test(lan.lenh) && Number(lan.bien.BT_CHO_KHOI) >= 5000, JSON.stringify(lan.bien));
  const fDay = docFileCan(new Uint8Array(lan.tep!));
  ok('Gửi thử: nội dung như gửi WiFi, giữ cả hàng ngoài kho (sườn), không có phần giờ', fDay.plu.map(p => `${p.so}:${p.ma}:${p.gia}`).join() === '1:10001:860000,2:10002:876000,3:10003:695000'
    && !lan.tep!.includes(Buffer.from('DWL\tTIM')), fDay.plu.map(p => `${p.so}:${p.ma}:${p.gia}`).join());
  ok('Gửi thử: trả hàng để gọi thử trên cân (PLU 1, 845.000 → 860.000)', g6.hang.so === 1 && g6.hang.gia === 860000 && g6.hang.giaCu === 845000 && g6.soByte === lan.tep!.length, JSON.stringify(g6));
  ok('Gửi thử: xoá file tạm (có mật khẩu WiFi)', !fs.existsSync(lan.bien.BT_TEP));
  ok('Gửi thử: không ghi nhận gì (file gốc, tren-can giữ nguyên); nhớ cổng và tốc độ', Buffer.compare(fs.readFileSync(ud6.fileGoc), gocTruoc) === 0
    && Buffer.compare(fs.readFileSync(ud6.fileTrenCan), trenTruoc) === 0 && ud6.cauHinh().com === 'COM3' && ud6.cauHinh().baud === 9600);

  traLoi = () => `OK\t${Buffer.from([...Buffer.from('ST,GS,+0001.234kg\r\n'), 0x00, 0xff]).toString('base64')}\r\n`;
  const n6 = await ud6.ngheQuaDay({ com: 'COM3', baud: 9600, giay: 5 });
  ok('Nghe cân: đếm byte, phần trăm đọc được, đoạn đầu', n6.soByte === 21 && n6.docDuoc === 90 && n6.chu === 'ST,GS,+0001.234kg↵↵··'
    && goiPs[goiPs.length - 1].bien.BT_CHO === '5000', JSON.stringify(n6));
  traLoi = () => "LOI\tUnauthorizedAccessException\tAccess to the port 'COM3' is denied.\r\n";
  ok('Lỗi PowerShell tới trang thành câu dễ hiểu', /đang bị chương trình khác dùng/.test(await loiCua(() => ud6.ngheQuaDay({ com: 'COM3', baud: 9600 }))));
  traLoi = () => 'COM\tCOM4\r\nTEN\tProlific USB-to-Serial Comm Port (COM4)\r\nOK\r\n';
  const d6 = await ud6.dsCom();
  ok('Danh sách cổng + nhớ cổng, tốc độ lần trước', d6.cong.length === 1 && d6.cong[0].moTa.startsWith('Prolific') && d6.com === 'COM3' && d6.baud === 9600);

  traLoi = (b) => `OK\t${fs.statSync(b.BT_TEP).size}\r\n`;
  danhMuc = { mauMaVach: '2XCCCCCWWWWWK', matHang: [hang('LOI-VAI', '10001', 'Lõi vai bò Mỹ #0142', 845000), hang('GAU-BO', '10003', 'Gầu bò', 700000)] };
  const g7 = await ud6.guiThuQuaDay({ com: 'COM3', baud: 9600 });
  ok('Gửi thử: hàng chỉ đổi tên (tảng) đứng trước → vẫn chọn hàng đổi giá để gọi thử', g7.hang.so === 3 && g7.hang.gia === 700000 && g7.hang.giaCu === 695000, JSON.stringify(g7.hang));
  danhMuc = { mauMaVach: '2XCCCCCWWWWWK', matHang: [hang('LOI-VAI', '10001', 'Lõi vai bò Mỹ #0142', 845000), hang('GAU-BO', '10003', 'Gầu bò', 695000)] };
  const g8 = await ud6.guiThuQuaDay({ com: 'COM3', baud: 9600 });
  ok('Gửi thử: chỉ có hàng đổi tên → trả tên cũ, tên mới (xem trên tem)', g8.hang.so === 1 && g8.hang.tenCu === 'Lõi vai bò Mỹ'
    && g8.hang.ten === 'Lõi vai bò Mỹ #0142' && g8.hang.gia === g8.hang.giaCu, JSON.stringify(g8.hang));
  danhMuc = dmCu;
}

// =============================================================================
// BẢN 2.2 — cân giả hai chiều (test/can-gia-hai-chieu.ts, cổng 33581 của hãng) cùng cân giả 33571 ở trên.
// Mọi thứ chỉ trên 127.0.0.1; `mang: []` để không bao giờ dò WiFi thật.
// =============================================================================
console.log('6d · Bản 2.2: cổng hai chiều, nhật ký cân, thông số, giờ, phím, sửa tem, quyền');
{
  const loiCua = async (f: () => unknown) => { try { await f(); return ''; } catch (e) { return cauLoi(e); } };
  const dongGui = (b: Buffer) => b.toString('latin1').split('\r\n');
  const cuoi = () => nhan[nhan.length - 1];
  // File cân có nhật ký bán (REP) và thông tin máy (INF, MAC ở dòng INM) — như file lưu ra USB bằng Amend.
  const rep22 = (fid: number, ngay: number, gio: number) => `REP\t26\t9\t${ngay}\t${gio}\t0\t0\t${fid}\t${fid}\t0\t`;
  const res22 = (so: number, sl: string, tien: string, donGia: string, loai = 0) =>
    `RES\t1\t${tien}\t${so}\t9\t9\t0,3\t${sl}\t3\t${loai}\t0,3\t\t\t\t\t${donGia}\t0\tHàng thử ${so}\t`;
  const NHAT_KY_22 = [
    rep22(1, 27, 10), res22(1, '215,3', '181675,3', '845000,3'), 'REE\t',
    rep22(2, 28, 11), res22(3, '500,3', '347500,3', '695000,3'), 'REE\t',
    rep22(3, 28, 12), res22(1, '300,3', '253500,3', '845000,3', 2), 'REE\t',
  ];
  const PLU_22 = [plu(1, '10001', '845,0', 'Lõi vai bò Mỹ'), plu(2, '10002', '876,0', 'Sườn bò Hàn Quốc'), plu(3, '10003', '695,0', 'Gầu bò')];
  const SCP_22 = ['SCP\t0\t1\t1\t', 'SCP\t0\t2\t2\t', 'SCP\t0\t3\t3\t', 'SCP\t0\t64\t0\t', 'SCP\t1\t1\t0\t'];
  const TMS_22 = ['TMS\t0\t28\t', 'TMS\t104\t0\t', 'TMS\t202\t3\t', 'TMS\t203\t3\t'];
  const fileCoRep = new TextEncoder().encode(['ECS\tVER\tV3.14E8\t', '', 'DWL\tPLU\t', ...PLU_22, 'END\tPLU\t', '',
    'DWL\tLAB\t', ...MAU_TEM, 'END\tLAB\t', '', 'DWL\tSCP\t', ...SCP_22, 'END\tSCP\t', '', 'DWL\tTMS\t', ...TMS_22, 'END\tTMS\t', '',
    'DWL\tREP\t', ...NHAT_KY_22, 'END\tREP\t', '',
    'DWL\tINF\t', 'INA\t0\tUTF-8\t0\t0\t8388608\t7\t7\t', 'INM\t0023F01AECB1\t0023F01AECB1\t0\t', 'END\tINF\t', '',
    'DWL\tTIM\t', 'TIM\t26\t9\t25\t16\t54\t12\t', 'END\tTIM\t', '', 'END\tECS\t', ''].join('\r\n'));

  const can2 = await moCanGia({ du: {
    phan: { PLU: PLU_22.map(chuoiByte), TMS: TMS_22, SCP: SCP_22, LAB: MAU_TEM.map(chuoiByte),
            TMT: ['TMT\t0\tQUAN THU\t', 'TMT\t15\tWIFI-GIA\t', 'TMT\t16\tmat-khau-gia\t'] },
    baoCao: [...NHAT_KY_22.map(chuoiByte), chuoiByte(rep22(4, 29, 9)), chuoiByte(res22(1, '100,3', '84500,3', '845000,3')), 'REE\t'],
  } });
  const tuyHaiChieu = { choMs: 2000, choHangRaoMs: 2000, nghiBaoCaoMs: 1 };
  const dd9 = { cauHinh: path.join(tam, 'appdata9'), duLieu: path.join(tam, 'tai-lieu9') };
  let danhMuc9: DanhMucKho = { mauMaVach: '2XCCCCCWWWWWK', matHang: [
    hang('LOI-VAI', '10001', 'Lõi vai bò Mỹ', 845000), hang('SUON', '10002', 'Sườn bò Hàn Quốc', 876000), hang('GAU-BO', '10003', 'Gầu bò', 695000)] };
  const ud9 = new UngDung(dd9, { danhMuc: async () => danhMuc9, mang: [], mac: async () => null, tuyHaiChieu });
  ud9.luuCauHinh({ ipCan: '127.0.0.1', congCan, congHaiChieu: can2.cong });
  const mc9 = moMayChu(ud9, { ma: 'thu', phienBan: 'thu', khiCoNhip: () => {}, khiDong: () => {} });
  const goc9 = `http://127.0.0.1:${mc9.port}`;
  const api9 = async (d: string, than?: unknown) =>
    (await fetch(`${goc9}${d}?t=thu`, { method: 'POST', body: JSON.stringify(than ?? {}), headers: { 'Content-Type': 'application/json' } })).json() as Promise<Record<string, unknown>>;
  ok('Lưu cài đặt cổng hai chiều; cổng sai bị từ chối', ud9.cauHinh().congHaiChieu === can2.cong
    && /Cổng hai chiều/.test(await loiCua(() => ud9.luuCauHinh({ congHaiChieu: 70000 }))));

  console.log('6d1 · Thông tin cân, đọc dữ liệu từ cân qua WiFi (cổng 33581)');
  const tt9 = await ud9.thongTinCanHaiChieu();
  ok('Thông tin cân: mã máy, model, phiên bản, giờ cân', tt9.thongTin.mac === '0023F01AECB1' && tt9.thongTin.phienBan === 'V3.14E8'
    && tt9.gio.nam === 2026 && tt9.gio.thang === 9 && tt9.gio.ngay === 25 && tt9.ip === '127.0.0.1' && tt9.cong === can2.cong
    && typeof tt9.lechGiay === 'number', JSON.stringify(tt9));
  ok('Thông tin cân chỉ đọc: cân giả không nhận khối ghi nào, kết nối đã đóng', can2.khoi.length === 0
    && await can2.choNhan(() => can2.ketNoi.every(k => k.daDong)));
  can2.hong = { loai: 'dong-giua-chung', khi: 'PLU' };
  const loiDoc = await loiCua(() => ud9.docTuCanQuaWifi());
  ok('Đọc từ cân hỏng giữa chừng → câu chỉ đường USB, chưa ghi nhận gì', /USB/.test(loiDoc) && /chưa thử trên cân thật/.test(loiDoc) && !ud9.coFileGoc(), loiDoc);
  can2.hong = null;
  const dw = await ud9.docTuCanQuaWifi();
  const gocWifi = fs.readFileSync(ud9.fileGoc);
  ok('Đọc từ cân qua WiFi = bước Bắt đầu: 3 hàng, tren-can.tsv 3 dòng, không ghi gì xuống cân', dw.soHang === 3 && dw.phienBan === 'V3.14E8'
    && ud9.docTrenCan().size === 3 && can2.khoi.length === 0 && dw.thongTin.mac === '0023F01AECB1', JSON.stringify(dw));
  ok('File gốc đọc qua WiFi: có TMT (giữ trên máy), không có REP / INF / TIM', gocWifi.includes(Buffer.from('DWL\tTMT\t'))
    && !gocWifi.includes(Buffer.from('DWL\tREP')) && !gocWifi.includes(Buffer.from('DWL\tINF')) && !gocWifi.includes(Buffer.from('DWL\tTIM')));

  console.log('6d2 · Nhật ký cân: gộp từ file và WiFi, không trùng; CSV');
  const g9 = ud9.ghiNhanFileTuCan(fileCoRep);
  ok('Ghi nhận file USB có nhật ký: gộp ngay 3 dòng vào nhat-ky-can.tsv', g9.soHang === 3 && g9.nhatKy?.soDong === 3 && g9.nhatKy.soMoi === 3
    && fs.existsSync(ud9.fileNhatKy), JSON.stringify(g9));
  const nk1 = await ud9.nhatKyCan({ nguon: 'luu' });
  ok('Tóm tắt: 2 gói bán (0,715 kg, 529.175 đ), 1 lần cân chưa in tem', nk1.tongDaLuu === 3 && nk1.tomTat.tong.soGoi === 2
    && nk1.tomTat.tong.kg === 0.715 && nk1.tomTat.tong.tien === 529175 && nk1.tomTat.chuaIn === 1, JSON.stringify(nk1.tomTat.tong));
  ok('Mã cân gắn theo bảng PLU lúc đọc (giá khớp), dòng mới nhất trước, có ghi chú dòng không tính kho',
    nk1.dong[nk1.dong.length - 1].fid === 1 && nk1.dong[nk1.dong.length - 1].maCan === '10001' && nk1.dong[0].fid === 3
    && /chưa in tem/.test(nk1.dong[0].ghiChu), JSON.stringify(nk1.dong.map(d => [d.fid, d.maCan, d.ghiChu])));
  const nk2 = await ud9.nhatKyCan({ nguon: 'file' });
  ok('Đọc lại từ file gốc: không thêm dòng trùng', nk2.doc?.soDong === 3 && nk2.doc.soMoi === 0 && nk2.tongDaLuu === 3, JSON.stringify(nk2.doc));
  const soYc = can2.yeuCau.length;
  const nk3 = await ud9.nhatKyCan({ nguon: 'wifi' });
  ok('Đọc qua WiFi: hỏi từ giao dịch cuối đã lưu (UPL REP -3, để kiểm cân chưa đếm lại số), thêm đúng 1 dòng', nk3.doc?.tuFid === 3 && nk3.doc.soMoi === 1
    && nk3.tongDaLuu === 4 && can2.yeuCau.slice(soYc).includes('UPL\tREP\t-3\t') && !can2.yeuCau.slice(soYc).includes('UPL\tREP\t-1\t')
    && nk3.doc.mac === '0023F01AECB1', JSON.stringify(nk3.doc));
  const nk4 = await ud9.nhatKyCan({ nguon: 'wifi', tuDau: true });
  ok('Đọc lại từ đầu qua WiFi: 4 dòng, cùng mã máy với file USB nên không trùng', nk4.doc?.soDong === 4 && nk4.doc.soMoi === 0 && nk4.tongDaLuu === 4
    && can2.yeuCau.includes('UPL\tREP\t-1\t'), JSON.stringify(nk4.doc));
  const nk5 = await ud9.nhatKyCan({ tu: '2026-09-28', den: '2026-09-28' });
  ok('Khoảng ngày: 28/09 có 2 dòng; ngày ngược / không có thật → báo', nk5.soDongTrongKhoang === 2 && nk5.tomTat.tong.soGoi === 1
    && /trước ngày kết thúc/.test(await loiCua(() => ud9.nhatKyCan({ tu: '2026-09-29', den: '2026-09-28' })))
    && /không phải ngày có thật/.test(await loiCua(() => ud9.nhatKyCan({ tu: '2026-02-30' }))), JSON.stringify(nk5.tomTat));
  can2.hong = { loai: 'bao-cao-khac' };
  const loiNk = await loiCua(() => ud9.nhatKyCan({ nguon: 'wifi', tuDau: true }));
  can2.hong = null;
  ok('Nhật ký qua WiFi đọc mãi không khớp → báo, nhật ký đã lưu giữ nguyên', /không khớp/.test(loiNk) && (await ud9.nhatKyCan()).tongDaLuu === 4, loiNk);
  const csv = await fetch(`${goc9}/api/nhat-ky-can.csv?t=thu&tu=2026-09-28`);
  const csvByte = Buffer.from(await csv.arrayBuffer());
  const csvChu = csvByte.subarray(3).toString('utf8');
  ok('Tải CSV nhật ký (GET, có mã bí mật): UTF-8 có BOM, tiêu đề tiếng Việt, 3 dòng từ 28/09', csv.status === 200
    && /text\/csv/.test(csv.headers.get('content-type') ?? '') && /attachment/.test(csv.headers.get('content-disposition') ?? '')
    && csvByte[0] === 0xEF && csvByte[1] === 0xBB && csvByte[2] === 0xBF
    && csvChu.startsWith('Ngày giờ (giờ cân)') && csvChu.trim().split('\r\n').length === 4, csvChu.slice(0, 120));
  ok('Tải CSV không có / sai mã bí mật → 403', (await fetch(`${goc9}/api/nhat-ky-can.csv`)).status === 403
    && (await fetch(`${goc9}/api/nhat-ky-can.csv?t=sai`)).status === 403);
  const nkApi = await api9('/api/nhat-ky-can', { nguon: 'luu' });
  ok('API nhật ký cân', nkApi.ok === true && nkApi.tongDaLuu === 4, JSON.stringify(nkApi).slice(0, 200));

  console.log('6d3 · Mọi lần gửi xuống cân bỏ phần REP / INF (boPhanChiDoc)');
  const soNhan9 = nhan.length;
  await ud9.guiXuongCan();
  ok('Gửi danh mục: file gửi không có nhật ký bán (REP), thông tin máy (INF), giờ (TIM)', nhan.length === soNhan9 + 1
    && !cuoi().includes(Buffer.from('DWL\tREP')) && !cuoi().includes(Buffer.from('REP\t')) && !cuoi().includes(Buffer.from('DWL\tINF'))
    && !cuoi().includes(Buffer.from('DWL\tTIM')) && cuoi().includes(Buffer.from('DWL\tSCP')));
  const nk6 = await ud9.nhatKyCan({ nguon: 'file' });
  ok('File gốc sau khi gửi không còn REP: đọc từ file báo rõ, nhật ký đã lưu không mất', /không có nhật ký bán/.test(nk6.doc?.loi.join(' ') ?? '')
    && nk6.tongDaLuu === 4, JSON.stringify(nk6.doc));
  ud9.ghiNhanFileTuCan(fileCoRep);
  await ud9.guiTem(voiDau(ud9, { chu: { 23: 'Hạn dùng' } }));
  ok('Gửi tem: cũng bỏ REP / INF', !cuoi().includes(Buffer.from('REP\t')) && !cuoi().includes(Buffer.from('DWL\tINF')));
  await ud9.guiTem(voiDau(ud9, { chu: { 23: 'HSD' } }));
  ud9.ghiNhanFileTuCan(fileCoRep);
  const uGoc = await ud9.taoFileUsbGoc();
  const fUsbGoc = fs.readFileSync(uGoc.duongDan);
  ok('File nạp USB từ file gốc (đường lui cho thông số / phím): bỏ REP, INF, TIM; giữ PLU, LAB, SCP, TMS', uGoc.soHang === 3
    && !fUsbGoc.includes(Buffer.from('REP\t')) && !fUsbGoc.includes(Buffer.from('DWL\tINF')) && !fUsbGoc.includes(Buffer.from('DWL\tTIM'))
    && ['DWL\tPLU', 'DWL\tLAB', 'DWL\tSCP', 'DWL\tTMS'].every(k => fUsbGoc.includes(Buffer.from(k))));
  fs.rmSync(ud9.fileChoUsb, { force: true });

  console.log('6d4 · HSD từ kho: cột HSD, tự gửi không tự bật in HSD');
  danhMuc9 = { ...danhMuc9, matHang: [{ ...hang('LOI-VAI', '10001', 'Lõi vai bò Mỹ', 845000), han_dung_ngay: 3 },
    hang('SUON', '10002', 'Sườn bò Hàn Quốc', 876000), { ...hang('GAU-BO', '10003', 'Gầu bò', 695000), han_dung_ngay: null }] };
  const xh = await ud9.xemTruoc();
  const d10001 = xh.dong.find(d => d.maCan === '10001'), d10003 = xh.dong.find(d => d.maCan === '10003'), d10002 = xh.dong.find(d => d.maCan === '10002');
  ok('Xem trước: lõi vai "sửa" HSD không in → 3 ngày; gầu bò giữ (không in HSD); sườn không quản HSD', d10001?.loai === 'sua' && d10001.hsd === 3
    && d10001.hsdCu === null && d10003?.loai === 'giu' && d10003.hsd === null && d10002 !== undefined && !('hsd' in d10002), JSON.stringify(xh.dong));
  const tcH = await ud9.tatCaHang();
  const h10001 = tcH.hang.find(h => h.maCan === '10001'), h10002 = tcH.hang.find(h => h.maCan === '10002');
  ok('Tất cả hàng: cột HSD trên cân / kho', h10001?.tinhTrang === 'lech' && h10001.hsd === null && h10001.hsdKho === 3
    && h10002?.hsd === null && !('hsdKho' in h10002), JSON.stringify([h10001, h10002]));
  const soTruocTuGui = nhan.length;
  const tgH = await ud9.tuGuiMotLan();
  ok('Tự gửi thấy kho đổi HSD → không gửi, báo mở thẻ Gửi giá từ kho', !tgH.daGui && nhan.length === soTruocTuGui
    && /hạn dùng \(HSD\) của 1 hàng/.test(tgH.cau) && /chưa thử trên cân thật/.test(tgH.cau), tgH.cau);
  await ud9.guiXuongCan();
  const pluHsd = docFileCan(new Uint8Array(cuoi())).plu.find(p => p.so === 1)!;
  ok('Bấm Gửi: dòng PLU 1 ghi HSD 3 ngày (cột 27 = 1, cột 32 = 3)', pluHsd.hsd === 3 && pluHsd.cot[27] === '1' && pluHsd.cot[32] === '3', pluHsd.tho);
  const tgH2 = await ud9.tuGuiMotLan();
  const h2 = (await ud9.tatCaHang()).hang.find(h => h.maCan === '10001');
  ok('Gửi xong: tự gửi thấy khớp; Tất cả hàng HSD 3 ngày; hàng mẫu của tem có HSD', !tgH2.daGui && /khớp/.test(tgH2.cau)
    && h2?.tinhTrang === 'khop' && h2.hsd === 3 && h2.hsdKho === 3 && ud9.tem().hangMau?.hsd === 3, JSON.stringify([tgH2, h2]));

  console.log('6d5 · Xoá hẳn qua WiFi (CLR + gửi lại cả danh sách, đọc lại để xác nhận)');
  const soKhoi0 = can2.khoi.length;
  const xv0 = await ud9.xemTruoc();
  ok('Không có hàng còn nằm lại → báo, không nối cân', /Không có hàng nào còn nằm lại/.test(await loiCua(() => ud9.xoaQuaWifi(false, xv0.dauVan)))
    && can2.khoi.length === soKhoi0);
  danhMuc9 = { ...danhMuc9, matHang: danhMuc9.matHang.filter(h => h.ma !== 'SUON') };
  const gX = await ud9.guiXuongCan();
  ok('Bỏ sườn khỏi kho, gửi WiFi 33571: sườn (PLU 2) còn nằm lại', gX.conLai.length === 1 && gX.conLai[0].so === 2, JSON.stringify(gX.conLai));
  const soYcX = can2.yeuCau.length;
  const xw = await ud9.xoaQuaWifi(false, (await ud9.xemTruoc()).dauVan);
  const khoiX = can2.khoi.slice(soKhoi0);
  ok('Xoá qua WiFi: đọc PLU → CLR PLU → DWL cả danh sách (2 hàng) → đọc lại', xw.soHang === 2 && xw.daXoa.map(h => h.so).join() === '2'
    && khoiX.map(k => `${k.lenh} ${k.ten} ${k.dong.length}`).join() === 'CLR PLU 0,DWL PLU 2'
    && can2.yeuCau.slice(soYcX).filter(y => y === 'UPL\tPLU\t').length === 2, JSON.stringify(khoiX.map(k => [k.lenh, k.ten, k.dong.length])));
  ok('Cân giả chỉ còn PLU 1, 3; tren-can.tsv 2 dòng; hết hàng còn nằm lại; file gốc = bản vừa gửi',
    can2.du.phan.PLU.map(d => d.split('\t')[1]).join() === '1,3' && ud9.docTrenCan().size === 2 && (await ud9.xemTruoc()).conLai.length === 0
    && docFileCan(new Uint8Array(fs.readFileSync(ud9.fileGoc))).plu.map(p => p.so).join() === '1,3');
  fs.appendFileSync(ud9.fileTrenCan, '9\t10009\t100,0\tHàng thử cũ\r\n');
  const gocTruocX = fs.readFileSync(ud9.fileGoc);
  can2.hong = { loai: 'chen-dong', dong: ['PLU\t9\t10009\t\t1\t100,0\t'] };
  const dauX = (await ud9.xemTruoc()).dauVan;
  const loiX = await loiCua(() => ud9.xoaQuaWifi(false, dauX));
  can2.hong = null;
  ok('Đọc lại không khớp (cân còn PLU 9) → báo thừa 1 hàng, chỉ nạp USB, không ghi nhận gì', /thừa 1 hàng \(PLU 9\)/.test(loiX) && /nạp USB ngay/.test(loiX)
    && Buffer.compare(fs.readFileSync(ud9.fileGoc), gocTruocX) === 0 && ud9.docTrenCan().has(9), loiX);
  const tcX = await ud9.tatCaHang(), xX = await ud9.xemTruoc();
  ok('HỒI QUY: xoá qua WiFi hỏng sau khi đã gửi lệnh xoá → Tất cả hàng và Xem trước báo "cân có thể thiếu hàng", không coi là khớp kho',
    !!tcX.canChuaRo && /nạp USB/.test(tcX.canChuaRo.cau) && !!xX.canChuaRo, JSON.stringify(tcX.canChuaRo ?? null));
  const soTgX = nhan.length;
  const tgX = await ud9.tuGuiMotLan();
  ok('HỒI QUY: tự gửi sau lần xoá hỏng không báo "khớp kho": gửi lại cả danh sách qua 33571, xong mới bỏ dấu "chưa rõ"',
    tgX.daGui && !/khớp/.test(tgX.cau) && /gửi lại cả danh sách/.test(tgX.cau) && nhan.length === soTgX + 1
    && (await ud9.tatCaHang()).canChuaRo === null, tgX.cau);

  console.log('6d6 · Thông số: sửa file gốc, gửi file nhỏ chỉ có khối TMS qua 33571');
  const ts0 = await ud9.thongSo();
  ok('Đọc thông số: kiểu ngày 104 = 0; có nhóm, có mục chỉ xem', ts0.muc.find(m => m.id === 104)?.giaTri === '0' && ts0.nhom.length > 0
    && ts0.muc.some(m => m.chiXem) && ts0.phienBan === 'V3.14E8');
  const soTs = nhan.length;
  const ts1 = await ud9.suaThongSo({ thay: { 104: '4' } });
  ok('Gửi 104 = 4: cân giả 33571 nhận đúng một file nhỏ chỉ có khối TMS', ts1.doi.join() === '104' && nhan.length === soTs + 1
    && JSON.stringify(dongGui(cuoi())) === JSON.stringify(['ECS\tVER\tV3.14E8\t', '', 'DWL\tTMS\t', 'TMS\t104\t4\t', 'END\tTMS\t', '', 'END\tECS\t', '']),
    JSON.stringify(dongGui(cuoi())));
  ok('File gốc có 104 = 4; bản lưu da-gui là file nhỏ vừa gửi', docThongSo(docFileCan(new Uint8Array(fs.readFileSync(ud9.fileGoc)))).get(104) === '4'
    && fs.readdirSync(ud9.thuMucDaGui).some(t => Buffer.compare(fs.readFileSync(path.join(ud9.thuMucDaGui, t)), cuoi()) === 0));
  ok('Không đổi gì → báo, không gửi', /chưa có gì thay đổi/.test(await loiCua(() => ud9.suaThongSo({ thay: { 104: '4' } }))) && nhan.length === soTs + 1);
  ok('Thông số chỉ xem (202) → báo, không gửi', /chỉ được xem/.test(await loiCua(() => ud9.suaThongSo({ thay: { 202: '2' } }))) && nhan.length === soTs + 1);
  ok('Giá trị lạ → báo, không gửi', /không có lựa chọn/.test(await loiCua(() => ud9.suaThongSo({ thay: { 104: '9' } }))) && nhan.length === soTs + 1);

  console.log('6d7 · Giờ cân: qua 33581 (cân báo lại), hỏng thì gửi khối giờ qua 33571');
  const soGio = nhan.length;
  const cg1 = await ud9.chinhGioCan({ luc: '2026-10-01T08:30' });
  ok('Chỉnh giờ qua 33581: cân báo lại đúng giờ mới, không gửi gì qua 33571', cg1.cach === '33581' && cg1.daXacNhan && cg1.loiHaiChieu === null
    && JSON.stringify(can2.du.gio) === JSON.stringify({ nam: 2026, thang: 10, ngay: 1, gio: 8, phut: 30, giay: 0 }) && nhan.length === soGio, JSON.stringify(cg1));
  const gc = await ud9.gioCan();
  ok('Đọc giờ cân', gc.gio.thang === 10 && gc.gio.gio === 8 && gc.gio.phut === 30 && /^\d{4}-\d{2}-\d{2} /.test(gc.gioMay), JSON.stringify(gc));
  ud9.luuCauHinh({ congHaiChieu: congDong });
  const cg2 = await ud9.chinhGioCan({ luc: '2026-10-01T09:00' });
  ok('Cổng 33581 đóng → gửi khối giờ qua 33571 (chưa xác nhận), nói rõ vì sao', cg2.cach === '33571' && !cg2.daXacNhan
    && /Không kết nối được cân/.test(cg2.loiHaiChieu ?? '') && nhan.length === soGio + 1
    && JSON.stringify(dongGui(cuoi())) === JSON.stringify(['ECS\tVER\tV3.14E8\t', '', 'DWL\tTIM\t', 'TIM\t26\t10\t1\t9\t0\t0\t', 'END\tTIM\t', '', 'END\tECS\t', '']),
    JSON.stringify(cg2));
  ud9.luuCauHinh({ congHaiChieu: can2.cong });
  can2.hong = { loai: 'bo-qua-gio' };
  const cg3 = await ud9.chinhGioCan({ luc: '2027-01-02T03:04' });
  can2.hong = null;
  ok('Cân nhận nhưng không đổi giờ (đọc lại lệch) → cũng gửi qua 33571', cg3.cach === '33571' && /chưa nhận giờ mới/.test(cg3.loiHaiChieu ?? '')
    && can2.du.gio.nam === 2026 && dongGui(cuoi())[3] === 'TIM\t27\t1\t2\t3\t4\t0\t', JSON.stringify(cg3));
  const soKn = can2.ketNoi.length, soGio2 = nhan.length;
  ok('Ngày không có thật / sai dạng → báo, không nối cân', /không hợp lệ/.test(await loiCua(() => ud9.chinhGioCan({ luc: '2026-02-30T10:00' })))
    && /dạng ngày và giờ/.test(await loiCua(() => ud9.chinhGioCan({ luc: 'abc' }))) && can2.ketNoi.length === soKn && nhan.length === soGio2);

  console.log('6d8 · Phím tắt: tầng 1 và Shift, gửi khối SCP qua 33571');
  const ph0 = await ud9.phim();
  const phim1 = ph0.phim.find(k => k.trang === 0 && k.phim === 1), phim64 = ph0.phim.find(k => k.trang === 0 && k.phim === 64);
  ok('Đọc phím: phím A gọi PLU 1 (tên hàng); phím 64 (Shift) không sửa được; danh sách hàng để chọn', phim1?.plu === 1 && phim1.ten === 'Lõi vai bò Mỹ'
    && phim1.nhan === 'A' && phim64?.suaDuoc === false && ph0.hang.map(h => h.so).join() === '1,3', JSON.stringify([phim1, phim64]));
  const soPh = nhan.length;
  await ud9.suaPhim({ thay: [{ trang: 1, phim: 1, plu: 3 }] });
  ok('Gán Shift + A → PLU 3: cân giả nhận file nhỏ chỉ có khối SCP', nhan.length === soPh + 1
    && JSON.stringify(dongGui(cuoi())) === JSON.stringify(['ECS\tVER\tV3.14E8\t', '', 'DWL\tSCP\t', 'SCP\t1\t1\t3\t', 'END\tSCP\t', '', 'END\tECS\t', '']),
    JSON.stringify(dongGui(cuoi())));
  ok('Đọc lại phím: Shift + A gọi Gầu bò', (await ud9.phim()).phim.find(k => k.trang === 1 && k.phim === 1)?.ten === 'Gầu bò');
  ok('Phím chức năng / PLU không có trên cân → báo, không gửi', /phím chức năng/.test(await loiCua(() => ud9.suaPhim({ thay: [{ trang: 0, phim: 64, plu: 1 }] })))
    && /không có hàng PLU 2/.test(await loiCua(() => ud9.suaPhim({ thay: [{ trang: 0, phim: 5, plu: 2 }] }))) && nhan.length === soPh + 1);

  console.log('6d9 · Sửa tem qua API: di chuyển, thêm ô, "Chỉ in HSD khi hàng có hạn dùng"');
  const tA = await api9('/api/tem') as { ok: boolean; tem: { o: { khoa: string; x: number }[] }; danhMuc: { oThem: unknown[]; coChu: unknown[] }; goiYHsd: string[]; kieuNgay: number; dau: string };
  ok('API tem: danh mục ô thêm được, cỡ chữ, gợi ý HSD (ô Hạn dùng + chữ HSD đang "Luôn in")', tA.ok && tA.tem.o.length === 14 && tA.danhMuc.oThem.length > 5
    && tA.danhMuc.coChu.length === 10 && tA.goiYHsd.length === 2, JSON.stringify(tA.goiYHsd));
  const soTem = nhan.length;
  const gt9 = await api9('/api/tem/gui', { sua: [{ khoa: 'o:0', x: 16 }], them: [{ mau: 'chu', x: 16, y: 280, chu: 'Thử 2.2' }], tat: [], bat: [], dau: tA.dau });
  const t9 = ud9.tem();
  const labMoi = new TextDecoder().decode(Buffer.from(docFileCan(new Uint8Array(cuoi())).dong.find(d => d.startsWith('LAB\t'))!, 'latin1'));
  ok('Gửi tem có sửa + thêm ô: cân giả nhận; ô 0 dời sang x = 16; ô chữ mới "Thử 2.2"', gt9.ok === true && Array.isArray(gt9.canhBao) && nhan.length === soTem + 1
    && t9.tem!.o.find(o => o.khoa === 'o:0')?.x === 16 && t9.tem!.o.some(o => o.ten === 'Chữ "Thử 2.2"') && labMoi.includes('Thử 2.2')
    && !cuoi().includes(Buffer.from('REP\t')), JSON.stringify(gt9));
  await ud9.guiTem(voiDau(ud9, { sua: t9.goiYHsd.map(khoa => ({ khoa, inKhi: 9 })) }));
  const t9b = ud9.tem();
  ok('Nút "Chỉ in HSD khi hàng có hạn dùng": hai ô chuyển sang điều kiện 9, hết gợi ý', t9b.goiYHsd.length === 0
    && t9b.tem!.o.filter(o => o.inKhi === 9).length === 2, JSON.stringify(t9b.tem!.o.map(o => o.inKhi)));
  const uT = await ud9.taoFileUsbTem(voiDau(ud9, { sua: [{ khoa: 'o:0', x: 400 }] }));
  ok('Ô ra ngoài mép tem → cảnh báo (không chặn)', uT.canhBao.length === 1 && /ngoài tem/.test(uT.canhBao[0]), JSON.stringify(uT.canhBao));
  fs.rmSync(ud9.fileChoUsb, { force: true }); fs.rmSync(ud9.fileDaTatChoUsb, { force: true });

  console.log('6d10 · Quyền: NV quầy đăng nhập không làm được việc nào của cân 2.2; chưa đăng nhập (mất mạng) thì được');
  const cnT = { id: 'cn1', ma: 'q1', ten: 'Chi nhánh thử' };
  const nvQuay = new UngDung(dd9, { mang: [], mac: async () => null, tuyHaiChieu,
    nguoi: { email: 'nv@b', hoTen: 'NV', vaiTro: 'nhan_vien_quay', chiNhanh: cnT, cacChiNhanh: [cnT], quyen: quyenCuaVai('nhan_vien_quay') } });
  const soN = nhan.length, soK = can2.ketNoi.length;
  const tuChoi = await Promise.all([
    () => nvQuay.thongTinCanHaiChieu(), () => nvQuay.docTuCanQuaWifi(), () => nvQuay.xoaQuaWifi(), () => nvQuay.nhatKyCan({ nguon: 'wifi' }),
    () => nvQuay.taiNhatKyCsv(), () => nvQuay.thongSo(), () => nvQuay.suaThongSo({ thay: { 104: '0' } }), () => nvQuay.gioCan(),
    () => nvQuay.chinhGioCan(), () => nvQuay.phim(), () => nvQuay.suaPhim({ thay: [{ trang: 0, phim: 5, plu: 1 }] }),
    () => nvQuay.guiTem({ sua: [{ khoa: 'o:0', x: 24 }] }),
    () => nvQuay.taoFileUsbTem(voiDau(nvQuay, { sua: [{ khoa: 'o:0', x: 24 }] })), () => nvQuay.taoFileUsbGoc({ thongSo: { 104: '4' } }),
  ].map(f => loiCua(f)));
  ok('NV quầy: 14 việc đều bị từ chối "chỉ dành cho quản lý hoặc chủ" (kể cả lưu file nạp USB tem / thông số), không nối cân, không gửi, không ghi file USB',
    tuChoi.length === 14 && tuChoi.every(l => /quản lý hoặc chủ/.test(l)) && nhan.length === soN && can2.ketNoi.length === soK
    && !fs.existsSync(nvQuay.fileChoUsb), JSON.stringify(tuChoi));
  const mcNv = moMayChu(nvQuay, { ma: 'nv', phienBan: 'thu', khiCoNhip: () => {}, khiDong: () => {} });
  const temUsbNv = await (await fetch(`http://127.0.0.1:${mcNv.port}/api/tem/usb?t=nv`, { method: 'POST',
    body: JSON.stringify({ sua: [{ khoa: 'o:0', x: 24 }], dau: nvQuay.tem().dau }) })).json() as { ok: boolean; loi: string };
  ok('HỒI QUY: NV quầy gọi thẳng /api/tem/usb → từ chối, không ghi file USB', !temUsbNv.ok && /quản lý hoặc chủ/.test(temUsbNv.loi ?? '')
    && !fs.existsSync(nvQuay.fileChoUsb), JSON.stringify(temUsbNv));
  const apiNv = await (await fetch(`http://127.0.0.1:${mcNv.port}/api/thong-so/gui?t=nv`, { method: 'POST', body: JSON.stringify({ thay: { 104: '0' } }) })).json() as { ok: boolean; loi: string };
  const csvNv = await fetch(`http://127.0.0.1:${mcNv.port}/api/nhat-ky-can.csv?t=nv`);
  ok('Qua API cũng vậy (gửi thông số, tải CSV nhật ký)', !apiNv.ok && /quản lý hoặc chủ/.test(apiNv.loi) && csvNv.status === 400
    && /quản lý hoặc chủ/.test(await csvNv.text()) && nhan.length === soN);
  mcNv.stop(true);
  const udMatMang = new UngDung(dd9, { mang: [], mac: async () => null, tuyHaiChieu, fetch: (async () => { throw new Error('mất mạng'); }) as unknown as typeof fetch });
  ok('Chưa đăng nhập / mất mạng (như máy quản lý không dùng kho): xem thông số được', (await udMatMang.thongSo()).muc.length > 0);

  console.log('6d11 · Trang hướng dẫn /huong-dan');
  const hd = await fetch(`${goc9}/huong-dan?t=thu`);
  const hdChu = await hd.text();
  ok('GET /huong-dan có mã bí mật: trang HTML tiếng Việt', hd.status === 200 && /text\/html/.test(hd.headers.get('content-type') ?? '')
    && hdChu.includes('KHÔNG BAO GIỜ BẤM') && hdChu.includes('Điều chưa thử trên cân thật'));
  ok('Trang hướng dẫn tự chứa: không tải gì từ mạng; mọi liên kết #… có đích', !/(src|href)\s*=\s*["']?(https?:)?\/\//i.test(hdChu)
    && [...hdChu.matchAll(/href="#([^"]+)"/g)].every(m => hdChu.includes(`id="${m[1]}"`)));
  ok('/huong-dan thiếu hoặc sai mã bí mật → 403', (await fetch(`${goc9}/huong-dan`)).status === 403 && (await fetch(`${goc9}/huong-dan?t=sai`)).status === 403);

  mc9.stop(true);
  await can2.dong();
}

// =============================================================================
// SỬA SAU RÀ SOÁT 2.2 — mỗi kiểm tra "HỒI QUY" tái hiện một lỗi rà soát tìm ra (đỏ trên mã trước khi sửa).
// Mọi thứ chỉ trên 127.0.0.1; `mang: []` để không bao giờ dò WiFi thật.
// =============================================================================
console.log('6f · Sửa sau rà soát 2.2');
{
  const loiCua = async (f: () => unknown) => { try { await f(); return ''; } catch (e) { return cauLoi(e); } };
  /** Chạy, lỗi thì in ra và trả null (để kiểm tra sau báo đỏ, không làm dừng cả bộ kiểm thử). */
  const thu = async <T>(f: () => Promise<T> | T): Promise<T | null> => { try { return await f(); } catch (e) { console.log(`    (lỗi: ${cauLoi(e)})`); return null; } };
  const tuyHC = { choMs: 2000, choHangRaoMs: 2000, nghiBaoCaoMs: 1 };
  let soDd = 0;
  const ddMoi = () => { soDd++; return { cauHinh: path.join(tam, `appdata-f${soDd}`), duLieu: path.join(tam, `tai-lieu-f${soDd}`) }; };
  const PLU_F = [plu(1, '10001', '845,0', 'Loi vai bo My'), plu(2, '10002', '876,0', 'Suon bo Han Quoc'), plu(3, '10003', '695,0', 'Gau bo')];
  const TMS_F = ['TMS\t0\t28\t', 'TMS\t104\t0\t', 'TMS\t202\t3\t', 'TMS\t203\t3\t'];
  const dmF = (...ma: string[]): DanhMucKho => ({ mauMaVach: '2XCCCCCWWWWWK', matHang: [
    hang('LOI-VAI', '10001', 'Loi vai bo My', 845000), hang('SUON', '10002', 'Suon bo Han Quoc', 876000), hang('GAU-BO', '10003', 'Gau bo', 695000),
  ].filter(h => ma.includes(h.ma_can!)) });
  const docGocF = (u: UngDung) => fs.readFileSync(u.fileGoc);
  const docTrenF = (u: UngDung) => fs.readFileSync(u.fileTrenCan);
  /** Chương trình + cân giả hai chiều có `pluCan` (mặc định PLU_F); file gốc = PLU_F; kho = dm(). */
  const moF = async (dm: () => DanhMucKho, pluCan: string[] = PLU_F) => {
    const can = await moCanGia({ du: { phan: { PLU: pluCan.map(chuoiByte), TMS: TMS_F, LAB: MAU_TEM.map(chuoiByte) } } });
    const u = new UngDung(ddMoi(), { danhMuc: async () => dm(), mang: [], mac: async () => null, tuyHaiChieu: tuyHC });
    u.luuCauHinh({ ipCan: '127.0.0.1', congCan, congHaiChieu: can.cong });
    u.ghiNhanFileTuCan(fileCan(PLU_F));
    return { can, u };
  };
  const repF = (fid: number, ngay: number, gio: number) => `REP\t26\t9\t${ngay}\t${gio}\t0\t0\t${fid}\t${fid}\t0\t`;
  const resF = (so: number, sl: string, tien: string, donGia: string) =>
    `RES\t1\t${tien}\t${so}\t9\t9\t0,3\t${sl}\t3\t0\t0,3\t\t\t\t\t${donGia}\t0\tHang thu ${so}\t`;
  const GD_F = [repF(1, 27, 10), resF(1, '215,3', '181675,3', '845000,3'), 'REE\t', repF(2, 27, 11), resF(3, '500,3', '347500,3', '695000,3'), 'REE\t',
    repF(3, 28, 9), resF(1, '100,3', '84500,3', '845000,3'), 'REE\t'];
  /** File lưu từ cân ra USB bằng Amend: có nhật ký (REP) các giao dịch `gd`, MAC ở dòng INM. */
  const fileRepF = (gd: string[]) => new TextEncoder().encode(['ECS\tVER\tV3.14E8\t', '', 'DWL\tPLU\t', ...PLU_F, 'END\tPLU\t', '',
    'DWL\tTMS\t', ...TMS_F, 'END\tTMS\t', '', 'DWL\tREP\t', ...gd, 'END\tREP\t', '',
    'DWL\tINF\t', 'INM\t0023F01AECB1\t0023F01AECB1\t0\t', 'END\tINF\t', '', 'END\tECS\t', ''].join('\r\n'));

  console.log('6f1 · Xoá qua WiFi: kiểm danh sách đọc trước khi xoá, lưu bản sao');
  {
    const { can, u } = await moF(() => dmF('10001', '10003'), [...PLU_F, plu(50, '10050', '100,0', 'Hang them tren can')]);
    await thu(() => u.thongTinCanHaiChieu());
    const x = await u.xemTruoc();
    const goc0 = docGocF(u), tren0 = docTrenF(u);
    const loi = await loiCua(() => u.xoaQuaWifi(false, x.dauVan));
    ok('HỒI QUY: cân có PLU chương trình không biết (PLU 50, thêm trên bàn phím) → không xoá, nêu PLU 50; cân không nhận CLR; bảng PLU của cân, file gốc, tren-can.tsv y nguyên',
      /PLU 50/.test(loi) && /[Cc]hưa gửi gì/.test(loi) && can.khoi.length === 0 && can.du.phan.PLU.length === 4
      && Buffer.compare(docGocF(u), goc0) === 0 && Buffer.compare(docTrenF(u), tren0) === 0, loi);
    can.du.phan.PLU = PLU_F.map(chuoiByte);
    can.hong = { loai: 'chen-dong', dong: ['END\t'] };
    const loiRong = await loiCua(() => u.xoaQuaWifi(false, x.dauVan));
    can.hong = null;
    ok('HỒI QUY: cân trả danh sách hàng rỗng khi đọc trước → không xoá (không kiểm được), cân không nhận CLR',
      /không trả danh sách hàng/.test(loiRong) && can.khoi.length === 0 && can.du.phan.PLU.length === 3, loiRong);
    const xw = await thu(() => u.xoaQuaWifi(false, x.dauVan));
    const saoLuu = fs.existsSync(u.thuMucDaGui) ? fs.readdirSync(u.thuMucDaGui).filter(t => /^truoc-xoa-wifi-\d+\.TMS$/.test(t)) : [];
    ok('HỒI QUY: xoá qua WiFi đúng đường: lưu bản sao danh sách trên cân (cả PLU 2 sắp xoá) vào da-gui TRƯỚC lệnh xoá',
      xw?.daXoa.map(h => h.so).join() === '2' && saoLuu.length === 1
      && docFileCan(new Uint8Array(fs.readFileSync(path.join(u.thuMucDaGui, saoLuu[0])))).plu.map(p => p.so).join() === '1,2,3', saoLuu.join());
    await can.dong();
  }

  console.log('6f2 · Cổng hai chiều chỉ làm việc với đúng cân (mã máy)');
  {
    const { can, u } = await moF(() => dmF('10001', '10003'));
    const x = await u.xemTruoc();
    const soKn = can.ketNoi.length;
    const loiChuaBiet = await loiCua(() => u.xoaQuaWifi(false, x.dauVan));
    ok('HỒI QUY: chưa biết mã máy của cân (chưa bấm Đọc thông tin cân) → không xoá, chưa nối cân', /[Đđ]ọc thông tin cân/.test(loiChuaBiet)
      && can.ketNoi.length === soKn && can.khoi.length === 0, loiChuaBiet);
    const tt = await thu(() => u.thongTinCanHaiChieu());
    ok('Đọc thông tin cân: nhớ mã máy báo qua cổng hai chiều', !!tt && u.cauHinh().macHaiChieu === '0023F01AECB1', JSON.stringify(u.cauHinh()));
    can.du.mac = [1, 2, 3, 4, 5, 6];   // router phát địa chỉ này cho cân khác
    const goc0 = docGocF(u), tren0 = docTrenF(u), soYc = can.yeuCau.length;
    const loiKhac = await loiCua(() => u.xoaQuaWifi(false, x.dauVan));
    const yc = can.yeuCau.slice(soYc);
    ok('HỒI QUY: cân ở địa chỉ đó báo mã máy khác → không đọc PLU, không xoá, không gửi (không CLR / DWL / TIM); file gốc, tren-can.tsv y nguyên',
      /mã máy 010203040506/.test(loiKhac) && can.khoi.length === 0 && !yc.some(y => /^UPL\t(PLU|TIM)\t/.test(y))
      && Buffer.compare(docGocF(u), goc0) === 0 && Buffer.compare(docTrenF(u), tren0) === 0, `${loiKhac} ${JSON.stringify(yc)}`);
    const loiDoc = await loiCua(() => u.docTuCanQuaWifi());
    ok('HỒI QUY: đọc dữ liệu qua WiFi từ cân khác mã máy → không ghi nhận (file gốc, tren-can.tsv y nguyên)', /mã máy/.test(loiDoc)
      && Buffer.compare(docGocF(u), goc0) === 0 && Buffer.compare(docTrenF(u), tren0) === 0, loiDoc);
    u.luuCauHinh({ ipCan: '127.0.0.1' });
    ok('Người gõ lại địa chỉ cân ở Cài đặt rồi Lưu (vừa thay cân) → quên mã máy cổng hai chiều', u.cauHinh().macHaiChieu === undefined);
    await can.dong();
  }

  console.log('6f3 · Xoá qua WiFi chạy đúng kế hoạch đã xem trước');
  {
    let dm = dmF('10001', '10003');
    const { can, u } = await moF(() => dm);
    await thu(() => u.thongTinCanHaiChieu());
    const x = await u.xemTruoc();
    ok('Xem trước trả dấu kế hoạch (dauVan) và số dòng đổi HSD (doiHsd)', typeof x.dauVan === 'string' && x.dauVan.length > 0 && x.doiHsd === 0,
      JSON.stringify({ dauVan: x.dauVan, doiHsd: x.doiHsd }));
    dm = dmF('10001');   // kho vừa bỏ thêm gầu bò: kế hoạch lúc bấm xoá khác cái người đã xem
    const soKn = can.ketNoi.length;
    const loiCu = await loiCua(() => u.xoaQuaWifi(false, x.dauVan));
    ok('HỒI QUY: kho / cân đổi sau lúc xem trước → không xoá, không nối cân', /đã đổi từ lúc xem trước/.test(loiCu) && can.ketNoi.length === soKn
      && can.khoi.length === 0, loiCu);
    const loiThieu = await loiCua(() => u.xoaQuaWifi(false));
    ok('HỒI QUY: xoá không kèm dấu kế hoạch → từ chối, không nối cân', /[Xx]em lại/.test(loiThieu) && can.ketNoi.length === soKn, loiThieu);
    dm = { ...dmF('10001', '10003'), matHang: dmF('10001', '10003').matHang.map(h => (h.ma_can === '10001' ? { ...h, han_dung_ngay: 3 } : h)) };
    const xH = await u.xemTruoc();
    const loiH = await loiCua(() => u.xoaQuaWifi(false, xH.dauVan));
    ok('HỒI QUY: kho có thay đổi HSD chưa gửi → xoá qua WiFi không mang theo, từ chối, không nối cân', xH.doiHsd === 1 && /hạn dùng \(HSD\)/.test(loiH)
      && can.ketNoi.length === soKn && can.khoi.length === 0, `${xH.doiHsd} ${loiH}`);
    await can.dong();
  }

  console.log('6f4 · Tự gửi: kiểm HSD và gửi trên cùng một lần đọc kho');
  {
    let lan = 0;
    const gia = (hsd?: number) => ({ mauMaVach: '2XCCCCCWWWWWK', matHang: [
      { ...hang('LOI-VAI', '10001', 'Loi vai bo My', 900000), ...(hsd !== undefined ? { han_dung_ngay: hsd } : {}) },
      hang('SUON', '10002', 'Suon bo Han Quoc', 876000), hang('GAU-BO', '10003', 'Gau bo', 695000)] });
    const u = new UngDung(ddMoi(), { danhMuc: async () => { lan++; return lan === 1 ? gia() : gia(3); }, mang: [], mac: async () => null });
    u.luuCauHinh({ ipCan: '127.0.0.1', congCan });
    u.ghiNhanFileTuCan(fileCan(PLU_F));
    const soNhan = nhan.length;
    const t = await u.tuGuiMotLan();
    const p1 = nhan.length > soNhan ? docFileCan(new Uint8Array(nhan[nhan.length - 1])).plu.find(p => p.so === 1) : undefined;
    ok('HỒI QUY: kho bật HSD giữa lúc kiểm và lúc gửi → tự gửi đọc kho đúng một lần: gửi giá mới, KHÔNG gửi HSD chưa ai xem',
      lan === 1 && t.daGui && p1?.gia === 900000 && p1.hsd === null && p1.cot[27] === '0', `${lan} lần đọc kho; ${t.cau}; ${p1?.hsd}`);
  }

  console.log('6f5 · Tự gửi không tự bật in HSD cho hàng mới');
  {
    const dm: DanhMucKho = { mauMaVach: '2XCCCCCWWWWWK', matHang: [
      { ...hang('LOI-VAI', '10001', 'Loi vai bo My', 845000), han_dung_ngay: null }, { ...hang('SUON', '10002', 'Suon bo Han Quoc', 876000), han_dung_ngay: null },
      { ...hang('GAU-BO', '10003', 'Gau bo', 695000), han_dung_ngay: null }, { ...hang('THAN', '10004', 'Than lung bo Uc', 990000), han_dung_ngay: 3 }] };
    const u = new UngDung(ddMoi(), { danhMuc: async () => dm, mang: [], mac: async () => null });
    u.luuCauHinh({ ipCan: '127.0.0.1', congCan });
    u.ghiNhanFileTuCan(fileCan(PLU_F));
    const soNhan = nhan.length;
    const t = await u.tuGuiMotLan();
    ok('HỒI QUY: cân chưa in HSD hàng nào, kho thêm hàng mới có HSD 3 ngày → tự gửi không gửi (quản lý xem trước rồi bấm Gửi)',
      !t.daGui && nhan.length === soNhan && /hạn dùng \(HSD\)/.test(t.cau) && (await u.xemTruoc()).doiHsd === 1, t.cau);
  }

  console.log('6f6 · File có lệnh CLR (phần mềm hãng tích "Clear Data")');
  {
    let dm = dmF('10001', '10002', '10003');
    const u = new UngDung(ddMoi(), { danhMuc: async () => dm, mang: [], mac: async () => null });
    u.luuCauHinh({ ipCan: '127.0.0.1', congCan });
    const pc = (L: string[]) => new Uint8Array(Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(['', 'ECS\tVER\t100\t', ...L, 'END\tECS\t', ''].join('\r\n'), 'utf8')]));
    const khoiPlu = ['DWL\tPLU\t', ...PLU_F, 'END\tPLU\t', 'DWL\tLAB\t', ...MAU_TEM, 'END\tLAB\t'];
    const xoaHet = pc(['CLR\tTMS\t', 'CLR\tEND\t', 'DWL\tTMS\t', ...TMS_F, 'END\tTMS\t', 'CLR\tTMT\t', 'CLR\tEND\t', 'DWL\tTMT\t', 'END\tTMT\t',
      'CLR\tPLU\t', 'CLR\tEND\t', 'CLR\tLAB\t', 'CLR\tEND\t', ...khoiPlu]);
    const loiPc = await loiCua(() => u.ghiNhanFileTuCan(xoaHet));
    ok('HỒI QUY: file TM-xA có CLR TMS / TMT / LAB / PLU → không nhận làm file gốc', /Clear Data/.test(loiPc) && !u.coFileGoc(), loiPc);
    const chiClrPlu = pc(['DWL\tTMS\t', ...TMS_F, 'END\tTMS\t', 'CLR\tPLU\t', 'CLR\tEND\t', ...khoiPlu]);
    const loiPlu = await loiCua(() => u.ghiNhanFileTuCan(chiClrPlu));
    ok('HỒI QUY: file có CLR PLU cũng không nhận làm file gốc (file gốc phải là dữ liệu cân tự lưu)', /CLR/.test(loiPlu) && !u.coFileGoc(), loiPlu);
    // File gốc lỡ có CLR PLU (ghi từ bản trước): mọi đường gửi / file USB đều không mang dòng CLR.
    fs.mkdirSync(u.dd.duLieu, { recursive: true });
    fs.writeFileSync(u.fileGoc, chiClrPlu);
    dm = { ...dm, matHang: dm.matHang.map(h => (h.ma_can === '10001' ? { ...h, gia_ban_kg: 850000 } : h)) };
    const soNhan = nhan.length;
    await thu(() => u.guiXuongCan());
    await thu(() => u.guiTem(voiDau(u, { chu: { 23: 'Hạn dùng' } })));
    const usb = await thu(() => u.taoFileUsb());
    const cacBan = [...nhan.slice(soNhan), ...(usb ? [fs.readFileSync(usb.duongDan)] : [])];
    ok('HỒI QUY: file gốc có CLR PLU → gửi danh mục, gửi tem (33571) và file nạp USB đều không có dòng CLR',
      cacBan.length === 3 && cacBan.every(b => !b.toString('latin1').split('\r\n').some(d => d.startsWith('CLR\t'))), String(cacBan.length));
  }

  console.log('6f7 · Nhật ký qua WiFi: cân đếm lại số giao dịch');
  {
    const { can, u } = await moF(() => dmF('10001', '10002', '10003'));
    can.du.baoCao = GD_F.slice();
    const n1 = await thu(() => u.nhatKyCan({ nguon: 'wifi' }));
    ok('Đọc nhật ký qua WiFi lần đầu (chưa lưu gì: từ giao dịch 1): 3 dòng', n1?.doc?.soMoi === 3 && n1.doc.tuFid === 1, JSON.stringify(n1?.doc));
    // Xoá báo cáo trên cân (A52): cân đếm lại từ giao dịch 1, giờ mới.
    can.du.baoCao = [repF(1, 29, 9), resF(3, '250,3', '173750,3', '695000,3'), 'REE\t', repF(2, 29, 10), resF(1, '300,3', '253500,3', '845000,3'), 'REE\t'];
    const n2 = await thu(() => u.nhatKyCan({ nguon: 'wifi' }));
    ok('HỒI QUY: cân đếm lại số giao dịch → tự đọc lại từ giao dịch 1: thêm đủ 2 dòng mới, có câu báo "đếm lại"',
      n2?.doc?.soMoi === 2 && n2.tongDaLuu === 5 && n2.doc.tuFid === 1 && n2.doc.loi.some(l => /đếm lại/.test(l)), JSON.stringify(n2?.doc));
    // Bán thêm giao dịch 3 sau khi đếm lại. Đã lưu có giao dịch 3 CŨ (28/9) — số lớn nhất không phải giao dịch mới nhất.
    can.du.baoCao = [...can.du.baoCao, repF(3, 29, 11), resF(2, '400,3', '350400,3', '876000,3'), 'REE\t'];
    const n3 = await thu(() => u.nhatKyCan({ nguon: 'wifi' }));
    ok('HỒI QUY: sau khi cân đếm lại, lần đọc sau hỏi từ giao dịch MỚI NHẤT đã lưu (số 2 lúc 29/9 10:00), không đọc lại từ 1 và không báo "đếm lại"',
      n3?.doc?.soMoi === 1 && n3.tongDaLuu === 6 && n3.doc.tuFid === 2 && !n3.doc.loi.some(l => /đếm lại/.test(l)), JSON.stringify(n3?.doc));
    await can.dong();
  }

  console.log('6f7b · Nhật ký: cùng giao dịch đọc qua USB rồi qua WiFi không bị lưu hai lần');
  {
    const { can, u } = await moF(() => dmF('10001', '10002', '10003'));
    // Dòng INM có mã hiện tại ([1]) khác mã gốc ([2]) — như sau "New MAC". Đường WiFi dùng [2] như hãng.
    const INM_LECH = 'INM\t0023F01AECB2\t0023F01AECB1\t1\t';
    can.du.inm = INM_LECH;
    can.du.baoCao = GD_F.slice();
    const usb = new TextEncoder().encode(new TextDecoder().decode(fileRepF(GD_F)).replace('INM\t0023F01AECB1\t0023F01AECB1\t0\t', INM_LECH));
    const g = await thu(() => u.ghiNhanFileTuCan(usb));
    ok('Ghi nhận file USB: 3 dòng nhật ký', (g?.nhatKy as { soMoi?: number } | null)?.soMoi === 3, JSON.stringify(g?.nhatKy));
    const w = await thu(() => u.nhatKyCan({ nguon: 'wifi', tuDau: true }));
    ok('HỒI QUY: đọc lại đúng các giao dịch đó qua WiFi → 0 dòng mới, vẫn 3 dòng (cùng MAC gốc ở cột 2 của INM, không cộng đôi doanh số)',
      w?.doc?.soMoi === 0 && w.tongDaLuu === 3 && w.dong.every(d => d.mac === '0023F01AECB1'), JSON.stringify({ doc: w?.doc, mac: w?.dong.map(d => d.mac) }));
    await can.dong();
  }

  console.log('6f8 · Nhật ký trong file USB: gộp hỏng thì báo, dòng trùng khoá không nuốt dòng mới');
  {
    const u = new UngDung(ddMoi(), { danhMuc: async () => dmF('10001', '10002', '10003'), mang: [], mac: async () => null });
    fs.mkdirSync(u.fileNhatKy, { recursive: true });   // nhat-ky-can.tsv không ghi được (như đang mở trong Excel)
    const g = await thu(() => u.ghiNhanFileTuCan(fileRepF(GD_F)));
    const nk = g?.nhatKy as { loi?: string } | null | undefined;
    ok('HỒI QUY: gộp nhật ký hỏng lúc ghi nhận file → file vẫn ghi nhận, nhưng trả câu lỗi nhật ký (không im lặng)',
      g?.soHang === 3 && u.coFileGoc() && !!nk && typeof nk.loi === 'string' && /nhat-ky-can\.tsv/.test(nk.loi), JSON.stringify(g));
    const u2 = new UngDung(ddMoi(), { danhMuc: async () => dmF('10001', '10002', '10003'), mang: [], mac: async () => null });
    u2.ghiNhanFileTuCan(fileRepF(GD_F));
    // Dòng trùng khoá trong nhat-ky-can.tsv (dán tay trong Excel, hai bản chương trình cùng ghi).
    const chu = fs.readFileSync(u2.fileNhatKy, 'utf8').split('\r\n').filter(Boolean);
    fs.writeFileSync(u2.fileNhatKy, [...chu, chu[1]].join('\r\n') + '\r\n');
    const g2 = u2.ghiNhanFileTuCan(fileRepF([...GD_F, repF(4, 29, 8), resF(3, '120,3', '83400,3', '695000,3'), 'REE\t']));
    const ds = (await u2.nhatKyCan()).dong;
    ok('HỒI QUY: nhat-ky-can.tsv có dòng trùng khoá → giao dịch mới vẫn được lưu, đếm đúng 1 dòng mới',
      (g2.nhatKy as { soMoi?: number } | null)?.soMoi === 1 && ds.some(d => d.fid === 4), JSON.stringify(g2.nhatKy));
  }

  console.log('6f9 · Đọc qua WiFi không giữ cài đặt mạng của cân');
  {
    const can = await moCanGia({ du: { phan: { PLU: PLU_F.map(chuoiByte), LAB: MAU_TEM.map(chuoiByte),
      TMS: ['TMS\t0\t28\t', 'TMS\t43\t1\t', 'TMS\t104\t0\t', 'TMS\t150\t192\t', 'TMS\t202\t3\t', 'TMS\t203\t3\t'],
      TMT: ['TMT\t0\tQUAN THU\t', 'TMT\t15\tWIFI-GIA\t', 'TMT\t16\t\t', 'TMT\t19\tmay-chu.gia\t'] } } });
    let dm = dmF('10001', '10002', '10003');
    const u = new UngDung(ddMoi(), { danhMuc: async () => dm, mang: [], mac: async () => null, tuyHaiChieu: tuyHC });
    u.luuCauHinh({ ipCan: '127.0.0.1', congCan, congHaiChieu: can.cong });
    await thu(() => u.docTuCanQuaWifi());
    const laMang = (id: number) => (id >= 43 && id <= 53) || (id >= 150 && id <= 173) || (id >= 430 && id <= 441);
    const coMang = (b: Buffer) => b.toString('latin1').split('\r\n').some(d => { const c = d.split('\t');
      return (c[0] === 'TMT' && [15, 16, 19].includes(Number(c[1]))) || (c[0] === 'TMS' && laMang(Number(c[1]))); });
    const goc = u.coFileGoc() ? docGocF(u) : Buffer.alloc(0);
    ok('HỒI QUY: đọc qua WiFi → file gốc không giữ tên / mật khẩu WiFi, tên miền (TMT 15, 16, 19) và thông số mạng (TMS 43, 150); còn TMT 0, TMS 104',
      goc.length > 0 && !coMang(goc) && goc.includes(Buffer.from('TMT\t0\tQUAN THU')) && goc.includes(Buffer.from('TMS\t104\t0')),
      goc.toString('latin1').split('\r\n').filter(d => /^TM[ST]\t/.test(d)).join('|'));
    dm = { ...dm, matHang: dm.matHang.map(h => (h.ma_can === '10001' ? { ...h, gia_ban_kg: 850000 } : h)) };
    const soNhan = nhan.length;
    await thu(() => u.guiXuongCan());
    await thu(() => u.guiTem(voiDau(u, { chu: { 23: 'Hạn dùng' } })));
    const gui = nhan.slice(soNhan);
    ok('HỒI QUY: sau đó gửi danh mục và tem qua 33571 không mang dòng mạng nào', gui.length === 2 && gui.every(b => !coMang(b)), String(gui.length));
    await can.dong();
  }

  console.log('6f10 · Đọc qua WiFi: không ghi nhận danh sách rỗng / thiếu');
  {
    const can = await moCanGia({ du: { phan: { PLU: [], TMS: TMS_F, LAB: MAU_TEM.map(chuoiByte) } } });
    const u = new UngDung(ddMoi(), { danhMuc: async () => dmF('10001', '10002', '10003'), mang: [], mac: async () => null, tuyHaiChieu: tuyHC });
    u.luuCauHinh({ ipCan: '127.0.0.1', congCan, congHaiChieu: can.cong });
    const loiRong = await loiCua(() => u.docTuCanQuaWifi());
    ok('HỒI QUY: cân trả 0 hàng qua WiFi → không ghi nhận (không có file gốc, không có tren-can.tsv)', /0 hàng/.test(loiRong) && !u.coFileGoc()
      && !fs.existsSync(u.fileTrenCan), loiRong);
    can.du.phan.PLU = PLU_F.map(chuoiByte);
    can.hong = { loai: 'chen-dong', dong: ['END\t'] };
    const loiEnd = await loiCua(() => u.docTuCanQuaWifi());
    can.hong = null;
    ok('HỒI QUY: cân trả END lạc trước mỗi phần (mọi phần đọc ra rỗng) → không ghi nhận', loiEnd !== '' && !u.coFileGoc(), loiEnd);
    u.ghiNhanFileTuCan(fileCan(PLU_F));
    const goc0 = docGocF(u), tren0 = docTrenF(u);
    can.du.phan.PLU = [chuoiByte(PLU_F[0])];
    const loiThieu = await loiCua(() => u.docTuCanQuaWifi());
    ok('HỒI QUY: đọc qua WiFi thiếu PLU đang có trên cân (1 / 3 hàng) → không ghi nhận, file gốc và tren-can.tsv y nguyên', /PLU 2, 3/.test(loiThieu)
      && Buffer.compare(docGocF(u), goc0) === 0 && Buffer.compare(docTrenF(u), tren0) === 0, loiThieu);
    await can.dong();
  }

  console.log('6f11 · Mẫu tem: bấm gửi hai lần với cùng thay đổi');
  {
    const u = new UngDung(ddMoi(), { danhMuc: async () => dmF('10001', '10002', '10003'), mang: [], mac: async () => null });
    u.luuCauHinh({ ipCan: '127.0.0.1', congCan });
    u.ghiNhanFileTuCan(fileCan(PLU_F));
    ok('tem() trả dấu mẫu tem (dau)', typeof u.tem().dau === 'string' && u.tem().dau.length === 40, String(u.tem().dau));
    const thay = voiDau(u, { tat: ['o:2'], sua: [{ khoa: 'o:5', x: 100 }] });
    await thu(() => u.guiTem(thay));
    const goc1 = docGocF(u), soNhan = nhan.length;
    const loi2 = await loiCua(() => u.guiTem(thay));
    ok('HỒI QUY: gửi lại đúng thay đổi cũ sau khi tem đã đổi (bấm hai lần) → từ chối, không gửi, file gốc y nguyên',
      /Tem trên máy đã đổi/.test(loi2) && nhan.length === soNhan && Buffer.compare(docGocF(u), goc1) === 0, loi2);
    const loi3 = await loiCua(() => u.guiTem({ tat: ['o:2'] }));
    ok('HỒI QUY: thay đổi tem không kèm dấu mẫu tem → từ chối, không gửi', /Tem trên máy đã đổi/.test(loi3) && nhan.length === soNhan, loi3);
    const loiUsb = await loiCua(() => u.taoFileUsbTem(thay));
    ok('HỒI QUY: lưu file USB tem với thay đổi cũ → từ chối, không ghi file USB', /Tem trên máy đã đổi/.test(loiUsb) && !fs.existsSync(u.fileChoUsb), loiUsb);
  }

  console.log('6f12 · Lưu file nạp USB kèm thông số / phím đang sửa');
  {
    const u = new UngDung(ddMoi(), { danhMuc: async () => dmF('10001', '10002', '10003'), mang: [], mac: async () => null });
    u.luuCauHinh({ ipCan: '127.0.0.1', congCan });
    u.ghiNhanFileTuCan(fileCan(PLU_F));
    const goc0 = docGocF(u);
    const k = await thu(() => u.taoFileUsbGoc({ thongSo: { 104: '4' }, phim: [{ trang: 0, phim: 5, plu: 1 }] }));
    const f = k && fs.existsSync(k.duongDan) ? docFileCan(new Uint8Array(fs.readFileSync(k.duongDan))) : null;
    ok('HỒI QUY: file nạp USB có thay đổi đang sửa (thông số 104 = 4, phím 5 → PLU 1); file gốc chưa đổi (chờ "đã nạp USB")',
      !!f && docThongSo(f).get(104) === '4' && f.dong.includes('SCP\t0\t5\t1\t') && Buffer.compare(docGocF(u), goc0) === 0
      && k?.thongSo?.join() === '104' && k.phim?.length === 1, JSON.stringify(k));
    const loiTs = await loiCua(() => u.taoFileUsbGoc({ thongSo: { 202: '2' } }));
    ok('Thông số chỉ xem trong file USB → báo, như gửi WiFi', /chỉ được xem/.test(loiTs), loiTs);
  }

  // ===========================================================================
  // HSD = SỐ NGÀY CÒN LẠI CỦA LÔ (cách b, 29/09/2026): kho gửi hạn lô − hôm nay, đổi mỗi ngày.
  // ===========================================================================
  console.log('6f14 · HSD đếm ngược theo lô: tự gửi, ngày tính HSD trên cân');
  {
    let ngay = '2026-09-29';
    /** Dòng PLU có HSD n ngày (cột 27 = 1, cột 32 = n); n undefined = không in. */
    const pluH = (so: number, ma: string, gia: string, ten: string, n?: number) => {
      const c = plu(so, ma, gia, ten).split('\t');
      if (n !== undefined) { c[27] = '1'; c[32] = String(n); }
      return c.join('\t');
    };
    const PLU_H = [pluH(1, '10001', '845,0', 'Loi vai bo My', 3), pluH(2, '10002', '876,0', 'Suon bo Han Quoc', 5), pluH(3, '10003', '695,0', 'Gau bo')];
    /** Kho: HSD từng món (null = không in) + nguồn HSD như danh-muc-can.ts đưa ra. */
    const dmH = (a: number | null, b: number | null, c: number | null): DanhMucKho => ({ mauMaVach: '2XCCCCCWWWWWK', matHang: [
      { ...hang('LOI-VAI', '10001', 'Loi vai bo My', 845000), han_dung_ngay: a, nguon_hsd: { vi: 'lô L-1 hết hạn 02/10', en: 'lot L-1, use-by 02/10' } },
      { ...hang('SUON', '10002', 'Suon bo Han Quoc', 876000), han_dung_ngay: b, nguon_hsd: { vi: 'lô L-2 hết hạn 04/10', en: 'lot L-2, use-by 04/10' } },
      { ...hang('GAU-BO', '10003', 'Gau bo', 695000), han_dung_ngay: c, nguon_hsd: { vi: 'theo hạn dùng của món (chưa có lô)', en: 'x' } }] });
    let dm = dmH(3, 5, null);
    const dd = ddMoi();
    const u = new UngDung(dd, { danhMuc: async () => dm, mang: [], mac: async () => null, homNay: () => ngay });
    u.luuCauHinh({ ipCan: '127.0.0.1', congCan });
    u.ghiNhanFileTuCan(fileCan(PLU_H));
    const hsd0 = u.hsdTrenCan?.();
    ok('Cân in HSD mà chưa biết HSD đó tính cho ngày nào → trạng thái báo cũ (chưa có hsd-tinh-ngay.txt)',
      !!hsd0 && hsd0.coInHsd && hsd0.tinhNgay === null && hsd0.cu && hsd0.homNay === '2026-09-29', JSON.stringify(hsd0));
    const soNhan0 = nhan.length;
    const t0 = await u.tuGuiMotLan();
    ok('29/09: HSD trên cân đúng số tính hôm nay → tự gửi không gửi ("khớp"), ghi ngày tính 29/09, hết báo cũ',
      !t0.daGui && /khớp/.test(t0.cau) && nhan.length === soNhan0 && u.hsdTrenCan?.().tinhNgay === '2026-09-29' && u.hsdTrenCan?.().cu === false
      && fs.readFileSync(path.join(dd.duLieu, 'hsd-tinh-ngay.txt'), 'utf8').trim() === '2026-09-29', `${t0.cau} ${JSON.stringify(u.hsdTrenCan?.())}`);

    ngay = '2026-09-30'; dm = dmH(2, 4, null);   // qua ngày: lô còn 2 và 4 ngày
    ok('30/09, chưa gửi: HSD trên cân tính cho 29/09 → báo cũ (so với "hôm nay" giờ VN của chương trình)',
      u.hsdTrenCan?.().cu === true && u.hsdTrenCan?.().tinhNgay === '2026-09-29' && u.hsdTrenCan?.().homNay === '2026-09-30');
    const x1 = await u.xemTruoc();
    const d1 = x1.dong.find(d => d.maCan === '10001');
    ok('Xem trước: đếm ngược 3 → 2 và 5 → 4 là đổi số ngày (demNguocHsd 2), không phải bật / tắt (doiHsd 0); tính cho 30/09; nguồn HSD hiện ở dòng',
      x1.doiHsd === 0 && x1.demNguocHsd === 2 && x1.ngayHsd === '2026-09-30' && d1?.hsd === 2 && d1.hsdCu === 3
      && d1.hsdNguon === 'lô L-1 hết hạn 02/10' && x1.hsdTrenCan?.cu === true, JSON.stringify({ doiHsd: x1.doiHsd, demNguocHsd: x1.demNguocHsd, d1, h: x1.hsdTrenCan }));
    const soNhan1 = nhan.length;
    const t1 = await u.tuGuiMotLan();
    const f1 = nhan.length > soNhan1 ? docFileCan(new Uint8Array(nhan[nhan.length - 1])) : null;
    ok('Tự gửi GỬI HSD đếm ngược (số → số): cân nhận PLU 1 = 2 ngày, PLU 2 = 4 ngày; câu báo nói tính cho ngày 30/09',
      t1.daGui && !!f1 && f1.plu.find(p => p.so === 1)?.hsd === 2 && f1.plu.find(p => p.so === 2)?.hsd === 4 && f1.plu.find(p => p.so === 3)?.hsd === null
      && /HSD đếm ngược 2 hàng — tính cho ngày 30\/09/.test(t1.cau), t1.cau);
    ok('Gửi xong: ghi ngày tính HSD 30/09 (hsd-tinh-ngay.txt), hết báo cũ', u.hsdTrenCan?.().tinhNgay === '2026-09-30' && u.hsdTrenCan?.().cu === false);

    ngay = '2026-10-01'; dm = dmH(1, 3, null);
    const uHong = new UngDung(dd, { danhMuc: async () => dm, mang: [], mac: async () => null, homNay: () => ngay,
      gui: async () => { throw new LoiCan('Mất kết nối với cân khi đang gửi (thử). Gửi lại.'); } });
    const tHong = await uHong.tuGuiMotLan();
    const loiHong = await loiCua(() => uHong.guiXuongCan());
    ok('Gửi hỏng (tự gửi và bấm Gửi) → không ghi ngày tính: vẫn 30/09, trang báo cũ ngày 01/10',
      !tHong.daGui && /Mất kết nối/.test(tHong.cau) && /Mất kết nối/.test(loiHong)
      && uHong.hsdTrenCan?.().tinhNgay === '2026-09-30' && uHong.hsdTrenCan?.().cu === true, `${tHong.cau} ${JSON.stringify(uHong.hsdTrenCan?.())}`);

    dm = dmH(null, 3, 7);   // lô lõi vai hết hạn (tắt HSD), gầu bò bắt đầu có hạn (bật HSD)
    const soNhan2 = nhan.length;
    const t2 = await u.tuGuiMotLan();
    const x2 = await u.xemTruoc();
    ok('HỒI QUY: bật / tắt in HSD (số → không in, không in → số) → tự gửi KHÔNG gửi gì (cả HSD đếm ngược của hàng khác), báo mở Gửi giá từ kho',
      !t2.daGui && nhan.length === soNhan2 && /bật \/ tắt in hạn dùng \(HSD\) của 2 hàng/.test(t2.cau) && /chưa thử trên cân thật/.test(t2.cau)
      && x2.doiHsd === 2 && x2.demNguocHsd === 1 && u.hsdTrenCan?.().tinhNgay === '2026-09-30', `${t2.cau} ${x2.doiHsd}/${x2.demNguocHsd}`);
    await u.guiXuongCan();
    const f2 = docFileCan(new Uint8Array(nhan[nhan.length - 1]));
    ok('Bấm Gửi (đã xem trước): bật / tắt HSD xuống cân, ghi ngày tính 01/10', f2.plu.find(p => p.so === 1)?.hsd === null
      && f2.plu.find(p => p.so === 3)?.hsd === 7 && u.hsdTrenCan?.().tinhNgay === '2026-10-01' && u.hsdTrenCan?.().cu === false);

    const mc = moMayChu(u, { ma: 'hsd', phienBan: 'thu', khiCoNhip: () => {}, khiDong: () => {} });
    try {
      ngay = '2026-10-02';
      const goiMc = async (d: string) => (await fetch(`http://127.0.0.1:${mc.port}${d}?t=hsd`, { method: 'POST' })).json() as Promise<Record<string, unknown>>;
      const tt = await goiMc('/api/trang-thai'), oc = await goiMc('/api/can');
      const h = tt.hsd as { homNay: string; tinhNgay: string | null; coInHsd: boolean; cu: boolean } | undefined;
      ok('/api/trang-thai và /api/can (ô Cân làm mới mỗi phút) trả ngày tính HSD trên cân, hôm nay giờ VN, cân có in HSD, có cũ không',
        h?.homNay === '2026-10-02' && h.tinhNgay === '2026-10-01' && h.coInHsd === true && h.cu === true
        && JSON.stringify(oc.hsd) === JSON.stringify(h), JSON.stringify([tt.hsd, oc.hsd]));
    } finally { mc.stop(true); }

    // USB: file làm từ kho mang ngày tính HSD lúc lưu file, không phải lúc bấm "đã nạp USB".
    ngay = '2026-10-02'; dm = dmH(null, 2, 6);
    const usb = await u.taoFileUsb();
    ngay = '2026-10-03';
    u.daNapUsb();
    ok('Nạp USB file lưu hôm qua (02/10) → ngày tính HSD là 02/10, hôm nay 03/10 vẫn báo cũ',
      usb.ngayHsd === '2026-10-02' && u.hsdTrenCan?.().tinhNgay === '2026-10-02' && u.hsdTrenCan?.().cu === true, JSON.stringify(u.hsdTrenCan?.()));
    await u.taoFileUsbGoc();
    u.daNapUsb();
    ok('Nạp USB file gốc (thông số / phím / tem — PLU không đổi) → ngày tính HSD giữ nguyên', u.hsdTrenCan?.().tinhNgay === '2026-10-02');
    u.ghiNhanFileTuCan(fs.readFileSync(u.fileGoc));
    ok('Cập nhật file gốc từ cân, HSD như bản đã gửi → giữ ngày tính', u.hsdTrenCan?.().tinhNgay === '2026-10-02');
    u.ghiNhanFileTuCan(fileCan([pluH(1, '10001', '845,0', 'Loi vai bo My'), pluH(2, '10002', '876,0', 'Suon bo Han Quoc', 9), pluH(3, '10003', '695,0', 'Gau bo', 6)]));
    ok('Cập nhật file gốc từ cân có HSD khác (đặt trên cân) → quên ngày tính: chưa biết, báo cũ', u.hsdTrenCan?.().tinhNgay === null
      && u.hsdTrenCan?.().cu === true && !fs.existsSync(path.join(dd.duLieu, 'hsd-tinh-ngay.txt')));
  }

  console.log('6f15 · Xoá qua WiFi mang được HSD đếm ngược');
  {
    let ngay = '2026-09-29';
    const pluH = (so: number, ma: string, gia: string, ten: string, n?: number) => {
      const c = plu(so, ma, gia, ten).split('\t');
      if (n !== undefined) { c[27] = '1'; c[32] = String(n); }
      return c.join('\t');
    };
    const PLU_H = [pluH(1, '10001', '845,0', 'Loi vai bo My', 3), pluH(2, '10002', '876,0', 'Suon bo Han Quoc', 5), pluH(3, '10003', '695,0', 'Gau bo')];
    const can = await moCanGia({ du: { phan: { PLU: PLU_H.map(chuoiByte), TMS: TMS_F, LAB: MAU_TEM.map(chuoiByte) } } });
    try {
      // Kho bỏ sườn (còn nằm lại trên cân), lõi vai sang ngày mới còn 2 ngày.
      const dm: DanhMucKho = { mauMaVach: '2XCCCCCWWWWWK', matHang: [
        { ...hang('LOI-VAI', '10001', 'Loi vai bo My', 845000), han_dung_ngay: 2 }, { ...hang('GAU-BO', '10003', 'Gau bo', 695000), han_dung_ngay: null }] };
      const u = new UngDung(ddMoi(), { danhMuc: async () => dm, mang: [], mac: async () => null, tuyHaiChieu: tuyHC, homNay: () => ngay });
      u.luuCauHinh({ ipCan: '127.0.0.1', congCan, congHaiChieu: can.cong });
      u.ghiNhanFileTuCan(fileCan(PLU_H));
      await thu(() => u.thongTinCanHaiChieu());
      ngay = '2026-09-30';
      const x = await u.xemTruoc();
      const xw = await thu(() => u.xoaQuaWifi(false, x.dauVan));
      const khoiPlu = can.khoi.filter(k => k.lenh === 'DWL' && k.ten === 'PLU').at(-1)?.dong ?? [];
      const p1 = khoiPlu.map(d => d.split('\t')).find(c => c[0] === 'PLU' && c[1] === '1');
      ok('Kho chỉ đếm ngược HSD (3 → 2) → xoá qua WiFi được (gửi lại cả danh sách mang HSD 2 ngày), ghi ngày tính 30/09',
        x.doiHsd === 0 && x.demNguocHsd === 1 && xw?.daXoa.map(h => h.so).join() === '2' && p1?.[27] === '1' && p1?.[32] === '2'
        && u.hsdTrenCan?.().tinhNgay === '2026-09-30', JSON.stringify({ doiHsd: x.doiHsd, dem: x.demNguocHsd, xw, p1: p1?.slice(26, 33) }));
    } finally { await can.dong(); }
  }

  console.log('6f16 · Giao diện: HSD trên cân cũ, nguồn HSD, hướng dẫn buổi sáng');
  {
    const gd = fs.readFileSync(path.join(import.meta.dir, '..', 'src', 'giao-dien.html'), 'utf8');
    const hd = fs.readFileSync(path.join(import.meta.dir, '..', 'src', 'huong-dan.html'), 'utf8');
    const than = /function baoHsdCu\(h\) \{([\s\S]*?)\n {2}\}/.exec(gd)?.[1] ?? '';
    ok('Khung đỏ HSD cũ: đúng câu, theo trạng thái của chương trình (h.cu, h.tinhNgay, h.homNay) — không dùng đồng hồ trình duyệt',
      /if \(!h \|\| !h\.cu\) return '';/.test(than) && /HSD trên cân tính cho ngày \$\{ngayChu\(h\.tinhNgay\)\}/.test(than)
      && than.includes(' — mỗi ngày chưa gửi lại là HSD in ra muộn thêm 1 ngày. Gửi xuống cân trước khi đóng gói.')
      && !/new Date|Date\.now/.test(than), than.slice(0, 200));
    ok('Khung đỏ ở ô Cân (cả lần làm mới mỗi phút), thẻ Gửi giá từ kho và Tất cả hàng',
      /<div id="bao-hsd"><\/div>/.test(gd) && /\$\('bao-hsd'\)\.innerHTML = baoHsdCu\(trangThai\.hsd\)/.test(gd) && /trangThai\.hsd = s\.hsd; veOCan\(\)/.test(gd)
      && /let h = baoHsdCu\(x\.hsdTrenCan\)/.test(gd) && /baoHsdCu\(d\.hsdTrenCan\) \+ baoCanChuaRo\(d\.canChuaRo\)/.test(gd));
    ok('Xem trước và Tất cả hàng hiện nguồn HSD; bật / tắt HSD báo riêng với HSD đếm ngược; CSV có cột Nguồn HSD',
      /d\.hsdNguon \? `<div class="phu">\$\{e\(d\.hsdNguon\)\}<\/div>`/.test(gd) && /x\.hsdNguon \? `<div class="phu">\$\{e\(x\.hsdNguon\)\}<\/div>`/.test(gd)
      && /if \(x\.doiHsd\)/.test(gd) && /if \(x\.demNguocHsd\)/.test(gd) && /'Nguồn HSD'/.test(gd));
    ok('Hướng dẫn: sáng mở Beeftown Cân, gửi (hay tự gửi) TRƯỚC khi đóng gói, đồng hồ cân đúng ngày; không còn nói kho không đưa HSD xuống cân',
      /Mỗi sáng, trước khi đóng gói/.test(hd) && /Trước khi đóng gói, in tem:/.test(hd) && /số ngày còn lại của lô/.test(hd)
      && /Đồng hồ cân sai một ngày là HSD sai một ngày/.test(hd) && !/Kho <b>không<\/b> đưa hạn dùng/.test(hd)
      && !/Hạn dùng của món trong kho <b>không<\/b>/.test(hd) && !/Kho không đưa hạn dùng/i.test(hd)
      && /<span class="nhan chua">Chưa thử trên cân thật<\/span> Cân in HSD ra sao/.test(hd));
  }

  console.log('6f13 · Giao diện (mã trang)');
  {
    const gd = fs.readFileSync(path.join(import.meta.dir, '..', 'src', 'giao-dien.html'), 'utf8');
    const hd = fs.readFileSync(path.join(import.meta.dir, '..', 'src', 'huong-dan.html'), 'utf8');
    const kichBan = /<script>([\s\S]*)<\/script>/.exec(gd)?.[1] ?? '';
    let cuPhap = '';
    try { new Function(kichBan); } catch (e) { cuPhap = (e as Error).message; }
    ok('Mã trang đọc được (không lỗi cú pháp)', kichBan.length > 1000 && cuPhap === '', cuPhap);
    ok('HỒI QUY: Mẫu tem — đang gửi thì Gửi / Bỏ / USB không bật lại, sơ đồ và danh sách ô khoá; trang gửi kèm dấu mẫu tem',
      /let temDL = null, temSua = moiTemSua\(\), chonO = null, keo = null, dangGuiTem = false/.test(gd) && /\$\('nut-gui-tem'\)\.disabled = dangGuiTem \|\| n === 0/.test(gd)
      && /if \(dangGuiTem\) return;\s+const nut = \$\('nut-gui-tem'\)/.test(gd) && /\.inert = dangGuiTem/.test(gd) && /dau: temDL\.dau/.test(gd));
    ok('HỒI QUY: Mẫu tem — "Lưu file nạp USB" bật khi có mẫu tem (kể cả chưa sửa gì); chưa sửa gì thì lấy file gốc (/api/tao-usb-goc)',
      /\$\('nut-usb-tem'\)\.disabled = dangGuiTem \|\| !\(temDL && temDL\.tem\)/.test(gd)
      && /demThayDoiTem\(td\) \? await goi\('\/api\/tem\/usb', td\) : await goi\('\/api\/tao-usb-goc'\)/.test(gd));
    ok('HỒI QUY: câu "tem chưa đổi" không còn bảo sửa lại như vừa rồi (trang và hướng dẫn §19, §25, §27)',
      !/sửa lại như vừa rồi/.test(gd) && !/sửa lại như vừa rồi/.test(hd) && (hd.match(/không cần sửa lại/g) ?? []).length >= 3 && /không cần sửa lại/.test(gd));
    ok('HỒI QUY: Lưu file nạp USB ở thẻ Cân & thông số / Phím tắt gửi kèm thay đổi đang sửa',
      /goi\('\/api\/tao-usb-goc', \{ thongSo: tsSua \}\)/.test(gd) && /goi\('\/api\/tao-usb-goc', \{ phim: thayPhim\(\) \}\)/.test(gd));
    ok('HỒI QUY: thẻ Cân — lamCan không bật lại nút của mục Thông số; ô số cập nhật khi gõ, không vẽ lại',
      /querySelectorAll\('button'\)\]\.filter\(b => !b\.closest\('#can-thong-so'\)\)/.test(gd) && /else i\.oninput = \(\) => \{ capNhat\(\);/.test(gd));
    ok('HỒI QUY: Phím tắt / Thông số — đang gửi thì nút Gửi không bật lại, gửi xong bỏ thay đổi đã gửi',
      /\$\('nut-gui-phim'\)\.disabled = dangGuiPhim \|\| n === 0/.test(gd) && /phimSua = \{\};   \/\/ đã gửi/.test(gd)
      && /\$\('nut-gui-ts'\)\.disabled = dangGuiTs \|\| !n/.test(gd) && /tsSua = \{\};   \/\/ đã gửi/.test(gd));
    ok('HỒI QUY: Mẫu tem — bấm ô trên sơ đồ bỏ focus nút / ô đánh dấu để phím mũi tên dời được ô',
      /if \(suaDuoc\(o\)\) \{[\s\S]{0,400}document\.activeElement\.blur\(\)/.test(gd));
    ok('HỒI QUY: xoá qua WiFi — trang gửi kèm dấu kế hoạch của lần xem trước và lựa chọn lúc xem', /goi\('\/api\/can\/xoa-wifi', \{ giuHangNgoaiKho: giu, dauVan: x\.dauVan \}\)/.test(gd)
      && /xoaQuaWifi\(\$\('khung-usb'\), x, giu, \$\('nut-xoa-wifi'\)\)/.test(gd) && /await xoaQuaWifi\(noi, x, giu, nut\)/.test(gd));
    ok('HỒI QUY: "Hàng trên cân chưa rõ" hiện ở Xem trước và Tất cả hàng; "Khớp kho" đổi thành "Chưa rõ trên cân"',
      /baoCanChuaRo\(x\.canChuaRo\)/.test(gd) && /baoCanChuaRo\(d\.canChuaRo\)/.test(gd) && /'Chưa rõ trên cân'/.test(gd));
    ok('HỒI QUY: file từ cân có nhật ký mà gộp hỏng → trang báo, không im', /k\.nhatKy && k\.nhatKy\.loi/.test(gd));
    ok('HỒI QUY: khung nạp USB có lần bấm Accu/Confirm thứ ba (màn 000) và chờ Finish', /Accu\/Confirm<\/b> lần thứ ba/.test(gd) && /Finish/.test(gd));
    ok('HỒI QUY: hướng dẫn §21 tả đúng cách gán phím (chọn trong danh sách, "— trống —"), không còn "Gõ 0"', !/Gõ 0 = bỏ trống phím/.test(hd)
      && /Chọn <b>— trống —<\/b> để bỏ trống phím/.test(hd));
  }
}

// =============================================================================
console.log('6e · Kiểm thử từng module của bản 2.2');
await thuGiaoThuc(ok);
await thuTem(ok);
await thuBaoCaoCan(ok);
await thuThongSo(ok);

// =============================================================================
console.log('7 · Chạy src/main.ts thật');
const tam2 = fs.mkdtempSync(path.join(os.tmpdir(), 'beeftown-can-main-'));
// Cài đặt có sẵn TRƯỚC khi chạy: địa chỉ kho là 127.0.0.1:1 (không có gì nghe) — kiểm thử không bao giờ gọi
// https://beeftown.vn thật (trạng thái, tất cả hàng, quầy, quyền sửa tem đều hỏi kho). Gọi /api/cau-hinh sau thì
// muộn: /api/trang-thai đã hỏi kho trước đó.
fs.mkdirSync(path.join(tam2, 'appdata', 'BeeftownCan'), { recursive: true });
fs.writeFileSync(path.join(tam2, 'appdata', 'BeeftownCan', 'cau-hinh.json'),
  JSON.stringify({ ipCan: '192.168.1.22', congCan: 33571, diaChiKho: 'http://127.0.0.1:1' }));
const p = Bun.spawn([process.execPath, path.join(import.meta.dir, '..', 'src', 'main.ts'), '--khong-mo'], {
  env: { ...process.env, APPDATA: path.join(tam2, 'appdata'), HOME: tam2, USERPROFILE: tam2, BEEFTOWN_CAN_DU_LIEU: path.join(tam2, 'tai-lieu') },
  stdout: 'pipe', stderr: 'pipe',
});
const doc = p.stdout.getReader();
let chu = '';
while (!/Mở: (\S+)/.test(chu)) { const { value, done } = await doc.read(); if (done) break; chu += new TextDecoder().decode(value); }
const duong = /Mở: (\S+)/.exec(chu)?.[1] ?? '';
ok('In ra đường dẫn 127.0.0.1 có mã bí mật', /^http:\/\/127\.0\.0\.1:\d+\/\?t=[0-9a-f]{36}$/.test(duong), duong);
const goc = new URL(duong);
const ma = goc.searchParams.get('t');
const api = (d: string, than?: BodyInit, loai = 'application/json') =>
  fetch(`${goc.origin}${d}?t=${ma}`, { method: 'POST', body: than, headers: { 'Content-Type': loai } });
ok('Trang giao diện mở được', (await fetch(duong)).status === 200);
ok('Thiếu mã bí mật → 403', (await fetch(`${goc.origin}/api/trang-thai`, { method: 'POST' })).status === 403);
ok('Sai mã bí mật → 403', (await fetch(`${goc.origin}/api/trang-thai?t=sai`, { method: 'POST' })).status === 403);
const tt = await (await api('/api/trang-thai')).json() as { ok: boolean; goc: unknown; cauHinh: { ipCan: string }; thuMuc: string };
// Trên Windows thư mục Tài liệu hỏi thẳng Windows (không theo USERPROFILE): nếu
// chương trình không ghi vào thư mục tạm thì DỪNG ngay — các bước sau ghi file giả
// đè lên file gốc thật của máy đang chạy kiểm thử (đã xảy ra 29/09/2026).
const thuMucTam = path.resolve(tt.thuMuc ?? '').startsWith(path.resolve(tam2) + path.sep);
ok('HỒI QUY: dữ liệu của chương trình nằm trong thư mục tạm, không phải Tài liệu thật', thuMucTam, tt.thuMuc);
if (!thuMucTam) {
  p.kill();
  mayCan.close();
  fs.rmSync(tam, { recursive: true, force: true });
  fs.rmSync(tam2, { recursive: true, force: true });
  console.log(`\nDỪNG: chương trình đang dùng thư mục thật ${tt.thuMuc} — không chạy tiếp để khỏi ghi đè dữ liệu thật.`);
  process.exit(1);
}
ok('Trạng thái: chưa có file gốc, cân mặc định 192.168.1.22', tt.ok && tt.goc === null && tt.cauHinh.ipCan === '192.168.1.22', JSON.stringify(tt));
ok('Phiên bản 2.2.0', (tt as unknown as { phienBan: string }).phienBan === '2.2.0');
ok('Trang hướng dẫn của chương trình thật: có mã bí mật mới mở được', (await fetch(`${goc.origin}/huong-dan?t=${ma}`)).status === 200
  && (await fetch(`${goc.origin}/huong-dan`)).status === 403);
const ch = await (await api('/api/cau-hinh', JSON.stringify({ ipCan: '127.0.0.1', congCan: congCan }))).json() as { ok: boolean };
ok('Lưu cài đặt cân', ch.ok);
const chHc = await (await api('/api/cau-hinh', JSON.stringify({ congHaiChieu: 33582 }))).json() as { cauHinh?: { congHaiChieu?: number } };
const chRong = await (await api('/api/cau-hinh', JSON.stringify({ congHaiChieu: null }))).json() as { cauHinh?: { congHaiChieu?: number } };
const chKhong = await (await api('/api/cau-hinh', JSON.stringify({ ipCan: '127.0.0.1' }))).json() as { cauHinh?: { congHaiChieu?: number } };
ok('HỒI QUY: xoá trống ô cổng hai chiều rồi Lưu → về mặc định (33581), không giữ cổng gõ sai; không gửi ô đó thì giữ nguyên',
  chHc.cauHinh?.congHaiChieu === 33582 && chRong.cauHinh?.congHaiChieu === undefined && chKhong.cauHinh?.congHaiChieu === undefined,
  JSON.stringify([chHc.cauHinh?.congHaiChieu, chRong.cauHinh?.congHaiChieu]));
const fc = await (await api('/api/file-tu-can', Buffer.from(fileUsb), 'application/octet-stream')).json() as { ok: boolean; soHang: number };
ok('Tải file từ cân lên chương trình', fc.ok && fc.soHang === 3, JSON.stringify(fc));
const hApi = await (await api('/api/hang')).json() as { ok: boolean; hang: unknown[]; coKho: boolean };
ok('API tất cả hàng: 3 hàng, chưa đăng nhập kho', hApi.ok && hApi.hang.length === 3 && !hApi.coKho, JSON.stringify(hApi).slice(0, 200));
const tApi = await (await api('/api/tem')).json() as { ok: boolean; tem: { o: { khoa: string }[] } };
ok('API mẫu tem: 14 ô', tApi.ok && tApi.tem.o.length === 14);
const dauApi = (await (await api('/api/tem')).json() as { dau: string }).dau;
const guiTemApi = await (await api('/api/tem/gui', JSON.stringify({ chu: { 23: 'Hạn dùng' }, tat: 'khong-phai-mang', dau: dauApi }))).json() as { ok: boolean };
ok('API gửi tem qua cân giả', guiTemApi.ok, JSON.stringify(guiTemApi));
const tApi2 = await (await api('/api/tem')).json() as { tem: { chu: Record<string, string> } };
ok('API mẫu tem sau khi gửi: chữ mới', tApi2.tem.chu[23] === 'Hạn dùng');
const qApi = await (await api('/api/quay')).json() as { ok: boolean; loi?: string };
ok('API quầy khi chưa đăng nhập kho → báo đăng nhập (không sập)', !qApi.ok && /Không mở được http:\/\/127\.0\.0\.1:1/.test(qApi.loi ?? ''), JSON.stringify(qApi));
ok('HỒI QUY: kiểm thử không gọi kho thật (địa chỉ kho của chương trình là 127.0.0.1:1)', tt.cauHinh !== undefined
  && (tt as unknown as { cauHinh: { diaChiKho: string } }).cauHinh.diaChiKho === 'http://127.0.0.1:1');
const tc = await (await api('/api/thu-can')).json() as { thongCan: boolean };
ok('Nút kiểm tra kết nối cân', tc.thongCan === true);
const dong = await (await api('/api/dong')).json() as { ok: boolean };
ok('Đóng cửa sổ → chương trình tự tắt', dong.ok && await Promise.race([p.exited.then(() => true), Bun.sleep(8000).then(() => false)]));

mayCan.close();
fs.rmSync(tam, { recursive: true, force: true });
fs.rmSync(tam2, { recursive: true, force: true });
console.log(hong === 0 ? `\nTẤT CẢ ${dat} KIỂM TRA BEEFTOWN CÂN ĐỀU ĐẠT` : `\n${hong} KIỂM TRA HỎNG / ${dat + hong}`);
process.exit(hong === 0 ? 0 : 1);
