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
import * as dgram from 'node:dgram';
import * as fs from 'node:fs';
import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  LoiCan, LoiKhongNoi, PLU_THU, UngDung, boDongMang, cauLoi, gioVnLuc, guiTcp, laPluTrong, lechCaiDat, lechGiayVn, quyenCuaVai, thuKetNoi,
  type DanhMucKho, type NguoiDung,
} from '../src/nghiep-vu.ts';
import { daiCanDo } from '../src/tim-can.ts';
import { GUI_FILE, LENH_KICH_BAN, chuoiKichBan, docDsCom, docKetQua, docKichBan, gioTrongBuoc, tocDoTuThongSo, type ChayPs } from '../src/day-rs232.ts';
import { moMayChu } from '../src/may-chu.ts';
import { taoKhoGia } from './kho-gia.ts';
import { MA_CAN_THU, MA_CAN_TRONG, TEN_PLU_TRONG, docFileCan, dongPluRieng } from '../../web/src/lib/kho/can-tma.ts';
import type { HangKho } from '../../web/src/lib/kho/can-tma.ts';
import { docThongSo } from '../src/thong-so.ts';
import { chuoiByte, moCanGia } from './can-gia-hai-chieu.ts';
import type { ThayDoiTem } from '../src/tem.ts';
import { thuGiaoThuc } from './thu-giao-thuc.ts';
import { thuTem } from './thu-tem.ts';
import { thuBaoCaoCan } from './thu-bao-cao-can.ts';
import { thuThongSo } from './thu-thong-so.ts';
import { thuCapNhat } from './thu-cap-nhat.ts';
import { thuGiuKetNoi } from './thu-giu-ket-noi.ts';

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

/**
 * Cân giả hai chiều nhận các dòng PLU của một lần gửi qua cổng 33571 như cân thật: thêm / sửa theo số PLU, không xoá
 * (chiMot: chỉ dòng PLU đầu tiên). 2.6 đọc lại cân sau khi gửi — hai cân giả phải cùng là một cân.
 */
function apPluVaoCanGia(can: { du: { phan: Record<string, string[]> } }, du: Uint8Array, chiMot = false): void {
  const theoSo = new Map((can.du.phan.PLU ?? []).map(d => [Number(d.split('\t')[1]), d]));
  let n = 0;
  for (const d of Buffer.from(du).toString('latin1').split(/\r?\n/)) {
    if (!d.startsWith('PLU\t') || (chiMot && n > 0)) continue;
    theoSo.set(Number(d.split('\t')[1]), d); n++;
  }
  can.du.phan.PLU = [...theoSo.entries()].sort((a, b) => a[0] - b[0]).map(x => x[1]);
}

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

  // Cổng và trình tự như phần mềm TM-xA của hãng (SaveForm.cs SaveToSerial).
  ok('Cổng như phần mềm hãng: 8 bit, không chẵn lẻ, 1 bit dừng, điều khiển luồng XOn/XOff, không bật DTR / RTS',
    /Parity\]::None, 8, \[System\.IO\.Ports\.StopBits\]::One/.test(LENH_KICH_BAN) && /Handshake\]::XOnXOff/.test(LENH_KICH_BAN)
    && !/DtrEnable|RtsEnable/.test(LENH_KICH_BAN));
  const kbChu = chuoiKichBan(GUI_FILE).split(';').map(b => (b.startsWith('GHI:') ? 'GHI:' + Buffer.from(b.slice(4), 'base64').toString('latin1') : b));
  ok('Trình tự gửi như hãng: hỏi giờ, đọc tới END, UPL END, dòng trống, file; rồi hỏi giờ thêm một lần để xác nhận',
    JSON.stringify(kbChu) === JSON.stringify(['GHI:UPL\tTIM\t\r\n', 'DOC:5000:0', 'GHI:UPL\tEND\t\r\n', 'GHI:\r\n', 'GHITEP',
      'GHI:\r\nUPL\tTIM\t\r\n', 'DOC:30000:1', 'GHI:UPL\tEND\t\r\n']), JSON.stringify(kbChu));
  ok('HỒI QUY: đoạn PowerShell so chữ phân biệt hoa thường (-ceq, như TypeScript), quá giờ thì in cả phần dòng dở '
    + '(chữ lộn xộn thường không có CR / LF) và vẫn gửi UPL END để đóng lượt hỏi',
    /\$dau -ceq 'TIM'/.test(LENH_KICH_BAN) && /\$dau -ceq 'END'/.test(LENH_KICH_BAN) && !/\$dau -eq/.test(LENH_KICH_BAN)
    && /if \(-not \$xong\) \{\s*if \(\$dong\.Count -gt 0\) \{ 'DONG'/.test(LENH_KICH_BAN)
    && /'HET' \+ \[char\]9 \+ \$i[\s\S]{0,80}\$dung = \$true[\s\S]{0,120}'UPL' \+ \[char\]9 \+ 'END'/.test(LENH_KICH_BAN));
  const TIM_DAY = 'TIM\t26\t9\t25\t16\t54\t12\t';
  const b64 = (chu: string) => Buffer.from(chu, 'latin1').toString('base64');
  const kqMau = docKichBan(`DONG\t1\t${b64(TIM_DAY)}\r\nDONG\t1\t${b64('END\tTIM\t')}\r\nOK\t42\r\n`, 'COM3');
  ok('Đọc kết quả kịch bản: dòng theo bước, số byte đã ghi, giờ trên cân', kqMau.soByte === 42 && kqMau.hetGio === null && kqMau.dong.length === 2
    && JSON.stringify(gioTrongBuoc(kqMau, 1)) === JSON.stringify({ nam: 2026, thang: 9, ngay: 25, gio: 16, phut: 54, giay: 12 }), JSON.stringify(kqMau));
  ok('Đọc kết quả kịch bản: quá giờ ở bước 1 → hetGio 1; BOM đầu dòng không sao', docKichBan('\uFEFFHET\t1\r\nOK\t10\r\n', 'COM3').hetGio === 1);
  ok('Thông số 41 → tốc độ (0 = 300, 5 = 9600, 9 = 115200; lạ → không biết)', tocDoTuThongSo('5') === 9600 && tocDoTuThongSo('9') === 115200
    && tocDoTuThongSo('0') === 300 && tocDoTuThongSo('10') === null && tocDoTuThongSo('x') === null && tocDoTuThongSo(undefined) === null);

  // PowerShell giả = cân giả ở đầu dây: chạy kịch bản BT_KICH_BAN như LENH_KICH_BAN.
  type CheDoDay = 'tra-loi' | 'im-lang' | 'lon-xon' | 'khong-xac-nhan' | 'chi-end' | 'chu-sach';
  let cheDo: CheDoDay = 'tra-loi';
  let traLoiKhac: ((bien: Record<string, string>) => string) | null = null;
  const goiPs: { lenh: string; bien: Record<string, string>; tep: Buffer | null }[] = [];
  const chayPs: ChayPs = async (lenh, bien) => {
    goiPs.push({ lenh, bien, tep: bien.BT_TEP ? fs.readFileSync(bien.BT_TEP) : null });
    if (traLoiKhac) return traLoiKhac(bien);
    const ra: string[] = [];
    let tong = 0, lanDoc = 0;
    for (const [i, b] of (bien.BT_KICH_BAN ?? '').split(';').entries()) {
      const [loai, gt = ''] = b.split(':');
      if (loai === 'GHI') tong += Buffer.from(gt, 'base64').length;
      else if (loai === 'GHITEP') tong += fs.statSync(bien.BT_TEP).size;
      else if (loai === 'DOC') {
        lanDoc++;
        if (cheDo === 'im-lang' || (cheDo === 'khong-xac-nhan' && lanDoc === 2)) { ra.push(`HET\t${i}`); break; }
        if (cheDo === 'lon-xon') { ra.push(`DONG\t${i}\t${b64('\u00f8\u00e6x\u0012\u00e0')}`, `HET\t${i}`); break; }
        if (cheDo === 'chu-sach') { ra.push(`DONG\t${i}\t${b64('ASK\tREP\t')}`, `HET\t${i}`); break; }
        // Cân chỉ trả END (không có dòng TIM): bước bắt tay (canTim 0) nhận như hãng; bước xác nhận (canTim 1) thì không.
        if (cheDo === 'chi-end') {
          ra.push(`DONG\t${i}\t${b64('END\tTIM\t')}`);
          if (b.endsWith(':1')) { ra.push(`HET\t${i}`); break; }
          continue;
        }
        ra.push(`DONG\t${i}\t${b64(TIM_DAY)}`, `DONG\t${i}\t${b64('END\tTIM\t')}`);
      }
    }
    return [...ra, `OK\t${tong}`, ''].join('\r\n');
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
  const g6 = await ud6.guiThuQuaDay({ com: 'COM3', baud: 9600 });
  const lan = goiPs[goiPs.length - 1];
  ok('Gửi thử: cổng, tốc độ, kịch bản, file tạm qua biến môi trường; mỗi lần ghi chờ được lâu (cân báo XOFF khi bận)',
    lan.bien.BT_COM === 'COM3' && lan.bien.BT_BAUD === '9600' && lan.bien.BT_KICH_BAN === chuoiKichBan(GUI_FILE) && lan.lenh === LENH_KICH_BAN
    && Number(lan.bien.BT_CHO_KHOI) >= 30000, JSON.stringify(lan.bien));
  const fDay = docFileCan(new Uint8Array(lan.tep!));
  ok('Gửi thử: nội dung như gửi WiFi, giữ cả hàng ngoài kho (sườn), không có phần giờ', fDay.plu.map(p => `${p.so}:${p.ma}:${p.gia}`).join() === '1:10001:860000,2:10002:876000,3:10003:695000'
    && !lan.tep!.includes(Buffer.from('DWL\tTIM')), fDay.plu.map(p => `${p.so}:${p.ma}:${p.gia}`).join());
  ok('Gửi thử: cân trả lời sau khi nhận → daXacNhan, giờ trên cân; trả hàng để gọi thử (PLU 1, 845.000 → 860.000)',
    g6.daXacNhan && g6.gio?.nam === 2026 && g6.hang.so === 1 && g6.hang.gia === 860000 && g6.hang.giaCu === 845000
    && g6.soByte === lan.tep!.length, JSON.stringify(g6));
  ok('Gửi thử: xoá file tạm (có mật khẩu WiFi)', !fs.existsSync(lan.bien.BT_TEP));
  ok('Gửi thử: không ghi nhận gì (file gốc, tren-can giữ nguyên); nhớ cổng và tốc độ', Buffer.compare(fs.readFileSync(ud6.fileGoc), gocTruoc) === 0
    && Buffer.compare(fs.readFileSync(ud6.fileTrenCan), trenTruoc) === 0 && ud6.cauHinh().com === 'COM3' && ud6.cauHinh().baud === 9600);

  cheDo = 'im-lang';
  const loiIm = await loiCua(() => ud6.guiThuQuaDay({ com: 'COM3', baud: 9600 }));
  ok('Gửi thử: cân không trả lời lần hỏi đầu → báo lỗi chỉ Prog → 4 → 3, tốc độ, dây; nói rõ chưa gửi gì',
    /không trả lời qua COM3/.test(loiIm) && /Prog → 4 → 3/.test(loiIm) && /SP\.041/.test(loiIm) && /chưa gửi gì/.test(loiIm), loiIm);
  ok('Gửi thử hỏng: file gốc, tren-can giữ nguyên', Buffer.compare(fs.readFileSync(ud6.fileGoc), gocTruoc) === 0
    && Buffer.compare(fs.readFileSync(ud6.fileTrenCan), trenTruoc) === 0);
  cheDo = 'khong-xac-nhan';
  const gKhong = await ud6.guiThuQuaDay({ com: 'COM3', baud: 9600 });
  ok('Gửi thử: cân không trả lời lần hỏi sau khi nhận → daXacNhan false (chưa chắc), không báo lỗi, không ghi nhận',
    gKhong.daXacNhan === false && gKhong.gio === null && Buffer.compare(fs.readFileSync(ud6.fileTrenCan), trenTruoc) === 0, JSON.stringify(gKhong));

  cheDo = 'tra-loi';
  const soGoi = goiPs.length;
  const k6 = await ud6.kiemTraDay({ com: 'COM4', baud: 19200 });
  const lanKiem = goiPs[goiPs.length - 1];
  ok('Kiểm tra dây: chỉ hỏi giờ (UPL TIM … UPL END), không gửi file; trả giờ trên cân; nhớ cổng và tốc độ',
    goiPs.length === soGoi + 1 && !lanKiem.bien.BT_KICH_BAN.includes('GHITEP') && lanKiem.bien.BT_TEP === ''
    && k6.gio?.gio === 16 && k6.gio.phut === 54 && ud6.cauHinh().com === 'COM4' && ud6.cauHinh().baud === 19200, JSON.stringify(k6));
  cheDo = 'im-lang';
  ok('Kiểm tra dây: cân im lặng → câu chỉ Prog → 4 → 3', /Prog → 4 → 3/.test(await loiCua(() => ud6.kiemTraDay({ com: 'COM4', baud: 9600 }))));
  cheDo = 'lon-xon';
  const loiLon = await loiCua(() => ud6.kiemTraDay({ com: 'COM4', baud: 9600 }));
  ok('Kiểm tra dây: nghe thấy chữ lộn xộn → báo có lẽ sai tốc độ, chỉ thông số 41', /sai tốc độ/.test(loiLon) && /SP\.041/.test(loiLon), loiLon);
  cheDo = 'chu-sach';
  const loiSach = await loiCua(() => ud6.kiemTraDay({ com: 'COM4', baud: 9600 }));
  ok('HỒI QUY: nghe thấy chữ rõ mà không trọn câu → không đổ cho tốc độ (dây và tốc độ có vẻ đúng)',
    /không trọn câu/.test(loiSach) && !/sai tốc độ/.test(loiSach), loiSach);
  cheDo = 'chi-end';
  const kEnd = await ud6.kiemTraDay({ com: 'COM4', baud: 9600 });
  ok('Kiểm tra dây: cân chỉ trả END (không có dòng giờ) → vẫn là dây thông, như hãng; giờ null', kEnd.gio === null, JSON.stringify(kEnd));
  const gEnd = await ud6.guiThuQuaDay({ com: 'COM3', baud: 9600 });
  ok('Gửi thử: lần hỏi sau khi nhận chỉ có END mà không có dòng giờ → chưa xác nhận (daXacNhan false)', gEnd.daXacNhan === false, JSON.stringify(gEnd));
  cheDo = 'tra-loi';
  traLoiKhac = () => "LOI\tUnauthorizedAccessException\tAccess to the port 'COM3' is denied.\r\n";
  ok('Lỗi PowerShell tới trang thành câu dễ hiểu', /đang bị chương trình khác dùng/.test(await loiCua(() => ud6.kiemTraDay({ com: 'COM3', baud: 9600 }))));
  traLoiKhac = () => 'COM\tCOM4\r\nTEN\tProlific USB-to-Serial Comm Port (COM4)\r\nOK\r\n';
  const d6 = await ud6.dsCom();
  ok('Danh sách cổng + nhớ cổng, tốc độ lần trước; file gốc không có thông số 41 → không biết tốc độ của cân',
    d6.cong.length === 1 && d6.cong[0].moTa.startsWith('Prolific') && d6.com === 'COM3' && d6.baud === 9600 && d6.baudCan === null, JSON.stringify(d6));
  const dd6b = { cauHinh: path.join(tam, 'appdata6b'), duLieu: path.join(tam, 'tai-lieu6b') };
  const ud6b = new UngDung(dd6b, { danhMuc: async () => danhMuc, chayPs });
  ud6b.ghiNhanFileTuCan(new Uint8Array(Buffer.from(Buffer.from(fileUsb).toString('latin1').replace('TMS\t202\t3\t', 'TMS\t41\t6\t\r\nTMS\t202\t3\t'), 'latin1')));
  const d6b = await ud6b.dsCom();
  ok('Thông số 41 của cân = 6 → gợi ý tốc độ 19200 khi chưa thử lần nào', d6b.baudCan === 19200 && d6b.baud === 19200 && d6b.com === null, JSON.stringify(d6b));
  traLoiKhac = null;

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
  // Cổng 33571 thật (cân giả mayCan ghi lại byte) và cân hai chiều can2 nhận PLU như cân thật: 2.6 đọc lại can2 sau khi gửi.
  const ud9 = new UngDung(dd9, { danhMuc: async () => danhMuc9, mang: [], mac: async () => null, tuyHaiChieu, choPhucHoiMs: [0, 10], choXacNhanMs: [0, 10],
    gui: async (ip, cong, du) => { await guiTcp(ip, cong, du); apPluVaoCanGia(can2, du); } });
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
  // 2.8: kết nối không đóng sau việc (giữ mở như hãng) — nhưng chỉ MỘT: "Đọc thông tin cân" bắt tay lại thì đóng kết nối cũ.
  ok('Thông tin cân chỉ đọc: cân giả không nhận khối ghi nào; 2.8: chương trình giữ đúng một kết nối mở', can2.khoi.length === 0
    && await can2.choNhan(() => can2.soDangMo() === 1, 4000), `${can2.soDangMo()} kết nối mở`);   // đóng: FIN, 2 giây sau huỷ hẳn
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
  const soNhan9 = nhan.length, soKhoi9 = can2.khoi.length;
  const guiDanhMuc9 = await ud9.guiXuongCan();
  const khoi9 = can2.khoi.slice(soKhoi9);
  ok('2.6.1: gửi danh mục qua cổng hai chiều — đúng một khối DWL PLU (chỉ dòng PLU), không gửi gì qua 33571, cân đã nhận',
    guiDanhMuc9.cachGui === 'hai-chieu' && guiDanhMuc9.xacNhan && nhan.length === soNhan9 && khoi9.length === 1 && khoi9[0].lenh === 'DWL'
    && khoi9[0].ten === 'PLU' && khoi9[0].dong.every(d => d.startsWith('PLU\t')), JSON.stringify(khoi9.map(k => [k.lenh, k.ten, k.dong.length])));
  // Đường lui: cổng hai chiều không nối được → cả file qua 33571 như trước 2.6.1.
  const svDong9 = net.createServer(); await new Promise<void>(r => svDong9.listen(0, '127.0.0.1', () => r()));
  const congDong9 = (svDong9.address() as net.AddressInfo).port; await new Promise<void>(r => svDong9.close(() => r()));
  ud9.luuCauHinh({ congHaiChieu: congDong9 });
  const gLui = await ud9.guiXuongCan();
  ud9.luuCauHinh({ congHaiChieu: can2.cong });
  ok('2.6.1: cổng hai chiều không nối được → gửi cả file qua 33571 (đường lui), chưa kiểm được cân', gLui.cachGui === 'mot-chieu' && !gLui.xacNhan
    && nhan.length === soNhan9 + 1 && /chưa đọc lại được cân/.test(gLui.cauXacNhan ?? ''), JSON.stringify(gLui));
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
  const soKhoiHsd = can2.khoi.length;
  const gHsd = await ud9.guiXuongCan();
  const khoiHsd = can2.khoi.slice(soKhoiHsd).filter(k => k.lenh === 'DWL' && k.ten === 'PLU');
  const pluHsd = (khoiHsd.at(-1)?.dong.find(d => d.startsWith('PLU\t1\t')) ?? '').split('\t');
  ok('Bấm Gửi: dòng PLU 1 ghi HSD 3 ngày (cột 27 = 1, cột 32 = 3); 2.6.1 chỉ gửi dòng đổi (1 dòng), cân đã nhận',
    pluHsd[27] === '1' && pluHsd[32] === '3' && khoiHsd.length === 1 && khoiHsd[0].dong.length === 1 && gHsd.soHangGui === 1 && gHsd.xacNhan,
    JSON.stringify([pluHsd.slice(0, 6), khoiHsd.map(k => k.dong.length)]));
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
  ok('Bỏ sườn khỏi kho, gửi qua WiFi (cân chỉ thêm / sửa): sườn (PLU 2) còn nằm lại', gX.conLai.length === 1 && gX.conLai[0].so === 2, JSON.stringify(gX.conLai));
  const soYcX = can2.yeuCau.length, soKhoiX = can2.khoi.length;
  const xw = await ud9.xoaQuaWifi(false, (await ud9.xemTruoc()).dauVan);
  const khoiX = can2.khoi.slice(soKhoiX);
  ok('Xoá qua WiFi: đọc PLU → CLR PLU → DWL cả danh sách (2 hàng) → đọc lại', xw.soHang === 2 && xw.daXoa.map(h => h.so).join() === '2'
    && khoiX.map(k => `${k.lenh} ${k.ten} ${k.dong.length}`).join() === 'CLR PLU 0,DWL PLU 2'
    && can2.yeuCau.slice(soYcX).filter(y => y === 'UPL\tPLU\t').length === 2, JSON.stringify(khoiX.map(k => [k.lenh, k.ten, k.dong.length])));
  ok('Cân giả chỉ còn PLU 1, 3; tren-can.tsv 2 dòng; hết hàng còn nằm lại; file gốc = bản vừa gửi',
    can2.du.phan.PLU.map(d => d.split('\t')[1]).join() === '1,3' && ud9.docTrenCan().size === 2 && (await ud9.xemTruoc()).conLai.length === 0
    && docFileCan(new Uint8Array(fs.readFileSync(ud9.fileGoc))).plu.map(p => p.so).join() === '1,3');
  fs.appendFileSync(ud9.fileTrenCan, '9\t10009\t100,0\tHàng thử cũ\r\n');
  can2.hong = { loai: 'chen-dong', dong: ['PLU\t9\t10009\t\t1\t100,0\t'] };
  const dauX = (await ud9.xemTruoc()).dauVan;
  const soKhoiPh = can2.khoi.length;
  const loiX = await loiCua(() => ud9.xoaQuaWifi(false, dauX));
  can2.hong = null;
  const khoiPh = can2.khoi.slice(soKhoiPh).map(k => `${k.lenh} ${k.ten} ${k.dong.length}`).join();
  ok('2.7: đọc lại sau lệnh xoá thấy thừa PLU 9 → tự gửi lại ngay cả danh sách (DWL PLU, không CLR lần hai), đọc lại đủ 2 hàng: '
    + 'báo "cân không thiếu hàng", PLU 9 vẫn còn — không bảo nạp USB ngay',
    /chưa xong \(đọc lại thấy cân chưa đúng: thừa 1 hàng \(PLU 9\)\)/.test(loiX) && /cân không thiếu hàng/.test(loiX) && /vẫn còn \(PLU 9\)/.test(loiX)
    && !/nạp USB ngay/.test(loiX) && khoiPh === 'CLR PLU 0,DWL PLU 2,DWL PLU 2', `${loiX} | ${khoiPh}`);
  ok('2.7: phục hồi được → không có dấu "chưa rõ"; tren-can.tsv đúng như cân đọc lại (PLU 1, 3, 9); file gốc = kế hoạch (PLU 1, 3)',
    (await ud9.tatCaHang()).canChuaRo === null && [...ud9.docTrenCan().keys()].sort().join() === '1,3,9'
    && docFileCan(new Uint8Array(fs.readFileSync(ud9.fileGoc))).plu.map(p => p.so).join() === '1,3' && (await ud9.xemTruoc()).conLai.map(h => h.so).join() === '9');
  // Cân nhận lệnh xoá nhưng bỏ qua mọi khối DWL PLU sau đó — cả các lần tự gửi lại: cân trống hàng.
  const gocTruocX = fs.readFileSync(ud9.fileGoc);
  can2.chanGhi = (ten, dong, ap) => { if (ten !== 'PLU') ap(dong); };
  const dauY = (await ud9.xemTruoc()).dauVan;
  const soKhoiY = can2.khoi.length;
  const loiY = await loiCua(() => ud9.xoaQuaWifi(false, dauY));
  can2.chanGhi = null;
  ok('2.7: tự gửi lại cả danh sách vẫn không được (cân bỏ qua khối PLU) → báo thiếu hàng, đã thử 2 lần, nạp USB ngay; không ghi nhận gì',
    /thiếu 2 hàng/.test(loiY) && /tự gửi lại cả danh sách 2 hàng 2 lần/.test(loiY) && /nạp USB ngay/.test(loiY)
    && can2.khoi.slice(soKhoiY).map(k => `${k.lenh} ${k.ten}`).join() === 'CLR PLU,DWL PLU,DWL PLU,DWL PLU'
    && Buffer.compare(fs.readFileSync(ud9.fileGoc), gocTruocX) === 0 && ud9.docTrenCan().has(9), loiY);
  const tcX = await ud9.tatCaHang(), xX = await ud9.xemTruoc();
  ok('HỒI QUY: xoá qua WiFi hỏng sau khi đã gửi lệnh xoá → Tất cả hàng và Xem trước báo "cân có thể thiếu hàng", không coi là khớp kho',
    !!tcX.canChuaRo && /nạp USB/.test(tcX.canChuaRo.cau) && !!xX.canChuaRo, JSON.stringify(tcX.canChuaRo ?? null));
  const soTgX = can2.khoi.length;
  const tgX = await ud9.tuGuiMotLan();
  const khoiTgX = can2.khoi.slice(soTgX);
  ok('HỒI QUY: tự gửi sau lần xoá hỏng không báo "khớp kho": gửi lại CẢ danh sách (2.6.1: khối DWL PLU qua cổng hai chiều), xong mới bỏ dấu "chưa rõ"',
    tgX.daGui && !/khớp/.test(tgX.cau) && /gửi lại cả danh sách/.test(tgX.cau) && khoiTgX.length === 1 && khoiTgX[0].ten === 'PLU'
    && khoiTgX[0].dong.length === 2   // cả danh sách của kho lúc này: PLU 1, 3 (kế hoạch không có gì thêm / sửa)
    && (await ud9.tatCaHang()).canChuaRo === null, tgX.cau);

  console.log('6d6 · Thông số: sửa file gốc, gửi khối TMS qua cổng hai chiều rồi đọc lại (2.7); lui về file nhỏ qua 33571');
  const ts0 = await ud9.thongSo();
  ok('Đọc thông số: kiểu ngày 104 = 0; có nhóm, có mục chỉ xem', ts0.muc.find(m => m.id === 104)?.giaTri === '0' && ts0.nhom.length > 0
    && ts0.muc.some(m => m.chiXem) && ts0.phienBan === 'V3.14E8');
  const soTs = nhan.length, soKhoiTs = can2.khoi.length;
  const ts1 = await ud9.suaThongSo({ thay: { 104: '4' } });
  const khoiTs = can2.khoi.slice(soKhoiTs);
  const FILE_NHO_104 = (v: string) => ['ECS\tVER\tV3.14E8\t', '', 'DWL\tTMS\t', `TMS\t104\t${v}\t`, 'END\tTMS\t', '', 'END\tECS\t', ''];
  ok('2.7: gửi 104 = 4 qua cổng hai chiều — đúng một khối DWL TMS chỉ có dòng đổi, không gì qua 33571; đọc lại khớp → "cân đã nhận"',
    ts1.doi.join() === '104' && ts1.cachGui === 'hai-chieu' && ts1.xacNhan && ts1.cauXacNhan === null && nhan.length === soTs
    && khoiTs.length === 1 && khoiTs[0].ten === 'TMS' && JSON.stringify(khoiTs[0].dong) === JSON.stringify(['TMS\t104\t4\t'])
    && can2.du.phan.TMS.includes('TMS\t104\t4\t'), JSON.stringify([ts1, khoiTs]));
  ok('File gốc có 104 = 4; bản lưu da-gui là file nhỏ của khối vừa gửi', docThongSo(docFileCan(new Uint8Array(fs.readFileSync(ud9.fileGoc)))).get(104) === '4'
    && fs.readdirSync(ud9.thuMucDaGui).some(t => JSON.stringify(dongGui(fs.readFileSync(path.join(ud9.thuMucDaGui, t)))) === JSON.stringify(FILE_NHO_104('4'))));
  ok('Không đổi gì → báo, không gửi', /chưa có gì thay đổi/.test(await loiCua(() => ud9.suaThongSo({ thay: { 104: '4' } })))
    && nhan.length === soTs && can2.khoi.length === soKhoiTs + 1);
  ok('Thông số chỉ xem (202) → báo, không gửi', /chỉ được xem/.test(await loiCua(() => ud9.suaThongSo({ thay: { 202: '2' } })))
    && nhan.length === soTs && can2.khoi.length === soKhoiTs + 1);
  ok('Giá trị lạ → báo, không gửi', /không có lựa chọn/.test(await loiCua(() => ud9.suaThongSo({ thay: { 104: '9' } })))
    && nhan.length === soTs && can2.khoi.length === soKhoiTs + 1);
  // Cân nhận khối TMS, qua hàng rào, mà không lưu (như cân của quán bỏ qua 33571 ngày 03/10/2026).
  can2.chanGhi = (ten, dong, ap) => { if (ten !== 'TMS') ap(dong); };
  const gocTs = fs.readFileSync(ud9.fileGoc);
  const loiTs = await loiCua(() => ud9.suaThongSo({ thay: { 104: '0' } }));
  can2.chanGhi = null;
  ok('2.7 HỒI QUY: cân không lưu khối TMS (đọc lại vẫn 4) → báo cân CHƯA nhận, nêu đúng thông số; file gốc giữ nguyên nên gửi lại được '
    + '(trước 2.7 file gốc ghi luôn 104 = 0, lần sau báo "chưa có gì thay đổi" dù cân vẫn 4)',
    /CHƯA nhận/.test(loiTs) && /thông số 104: cân vẫn là 4 \(gửi 0\)/.test(loiTs) && /chưa ghi nhận gì/.test(loiTs)
    && Buffer.compare(fs.readFileSync(ud9.fileGoc), gocTs) === 0 && (await ud9.thongSo()).muc.find(m => m.id === 104)?.giaTri === '4', loiTs);
  // Cổng hai chiều đóng: đường lui file nhỏ qua 33571 (như trước 2.7) — không đọc lại được.
  ud9.luuCauHinh({ congHaiChieu: congDong });
  const ts2 = await ud9.suaThongSo({ thay: { 104: '0' } });
  ud9.luuCauHinh({ congHaiChieu: can2.cong });
  ok('Cổng hai chiều đóng → file nhỏ chỉ có khối TMS qua 33571; chưa kiểm được → xacNhan false kèm vì sao (không nói "cân đã nhận"); '
    + 'file gốc theo thứ đã gửi như trước 2.7',
    ts2.cachGui === 'mot-chieu' && !ts2.xacNhan && /chưa đọc lại được cân/.test(ts2.cauXacNhan ?? '') && /Không kết nối được cân/.test(ts2.cauXacNhan ?? '')
    && nhan.length === soTs + 1 && JSON.stringify(dongGui(cuoi())) === JSON.stringify(FILE_NHO_104('0'))
    && docThongSo(docFileCan(new Uint8Array(fs.readFileSync(ud9.fileGoc)))).get(104) === '0', JSON.stringify(ts2));

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

  console.log('6d8 · Phím tắt: tầng 1 và Shift, gửi khối SCP qua cổng hai chiều rồi đọc lại (2.7)');
  const ph0 = await ud9.phim();
  const phim1 = ph0.phim.find(k => k.trang === 0 && k.phim === 1), phim64 = ph0.phim.find(k => k.trang === 0 && k.phim === 64);
  ok('Đọc phím: phím A gọi PLU 1 (tên hàng); phím 64 (Shift) không sửa được; danh sách hàng để chọn', phim1?.plu === 1 && phim1.ten === 'Lõi vai bò Mỹ'
    && phim1.nhan === 'A' && phim64?.suaDuoc === false && ph0.hang.map(h => h.so).join() === '1,3', JSON.stringify([phim1, phim64]));
  const soPh = nhan.length, soKhoiPhim = can2.khoi.length;
  const ph1 = await ud9.suaPhim({ thay: [{ trang: 1, phim: 1, plu: 3 }] });
  const khoiPhim = can2.khoi.slice(soKhoiPhim);
  ok('2.7: gán Shift + A → PLU 3 qua cổng hai chiều — một khối DWL SCP chỉ có phím đổi, đọc lại khớp; không gì qua 33571',
    ph1.xacNhan && ph1.cachGui === 'hai-chieu' && nhan.length === soPh && khoiPhim.length === 1 && khoiPhim[0].ten === 'SCP'
    && JSON.stringify(khoiPhim[0].dong) === JSON.stringify(['SCP\t1\t1\t3\t']) && can2.du.phan.SCP.includes('SCP\t1\t1\t3\t'), JSON.stringify([ph1, khoiPhim]));
  ok('Đọc lại phím: Shift + A gọi Gầu bò', (await ud9.phim()).phim.find(k => k.trang === 1 && k.phim === 1)?.ten === 'Gầu bò');
  ok('Phím chức năng / PLU không có trên cân → báo, không gửi', /phím chức năng/.test(await loiCua(() => ud9.suaPhim({ thay: [{ trang: 0, phim: 64, plu: 1 }] })))
    && /không có hàng PLU 2/.test(await loiCua(() => ud9.suaPhim({ thay: [{ trang: 0, phim: 5, plu: 2 }] }))) && nhan.length === soPh
    && can2.khoi.length === soKhoiPhim + 1);
  can2.chanGhi = (ten, dong, ap) => { if (ten !== 'SCP') ap(dong); };
  const loiPhim = await loiCua(() => ud9.suaPhim({ thay: [{ trang: 0, phim: 5, plu: 1 }] }));
  can2.chanGhi = null;
  ok('2.7: cân không lưu khối SCP → báo phím E chưa đổi trên cân, không ghi nhận (thẻ Phím tắt vẫn như cân)',
    /CHƯA nhận/.test(loiPhim) && /phím E: cân không trả dòng này \(gửi PLU 1\)/.test(loiPhim)
    && !(await ud9.phim()).phim.some(k => k.trang === 0 && k.phim === 5 && k.plu === 1), loiPhim);

  console.log('6d9 · Sửa tem qua API: di chuyển, thêm ô, "Chỉ in HSD khi hàng có hạn dùng"');
  const tA = await api9('/api/tem') as { ok: boolean; tem: { o: { khoa: string; x: number }[] }; danhMuc: { oThem: unknown[]; coChu: unknown[] }; goiYHsd: string[]; kieuNgay: number; dau: string };
  ok('API tem: danh mục ô thêm được, cỡ chữ, gợi ý HSD (ô Hạn dùng + chữ HSD đang "Luôn in")', tA.ok && tA.tem.o.length === 14 && tA.danhMuc.oThem.length > 5
    && tA.danhMuc.coChu.length === 10 && tA.goiYHsd.length === 2, JSON.stringify(tA.goiYHsd));
  const soTem = nhan.length, soKhoiTem = can2.khoi.length;
  const gt9 = await api9('/api/tem/gui', { sua: [{ khoa: 'o:0', x: 16 }], them: [{ mau: 'chu', x: 16, y: 280, chu: 'Thử 2.2' }], tat: [], bat: [], dau: tA.dau });
  const t9 = ud9.tem();
  const khoiTem = can2.khoi.slice(soKhoiTem);
  const dongTem = khoiTem[0]?.dong ?? [];
  const labMoi = new TextDecoder().decode(Buffer.from(dongTem.find(d => d.startsWith('LAB\t')) ?? '', 'latin1'));
  ok('2.7: gửi tem có sửa + thêm ô qua cổng hai chiều — một khối DWL LAB chỉ có mẫu tem đang dùng (LAB 28, 15 ô, LAE), đọc lại khớp; '
    + 'ô 0 dời sang x = 16; ô chữ mới "Thử 2.2"; không gì qua 33571',
    gt9.ok === true && gt9.xacNhan === true && gt9.cachGui === 'hai-chieu' && Array.isArray(gt9.canhBao) && nhan.length === soTem
    && khoiTem.length === 1 && khoiTem[0].ten === 'LAB' && dongTem[0].startsWith('LAB\t28\t') && dongTem[dongTem.length - 1] === 'LAE\t'
    && dongTem.filter(d => d.startsWith('LAS\t')).length === 15 && dongTem.every(d => /^(LAB|LAS|LAE)\t/.test(d))
    && t9.tem!.o.find(o => o.khoa === 'o:0')?.x === 16 && t9.tem!.o.some(o => o.ten === 'Chữ "Thử 2.2"') && labMoi.includes('Thử 2.2'), JSON.stringify(gt9));
  can2.chanGhi = (ten, dong, ap) => { if (ten !== 'LAB') ap(dong); };
  const gocTem9 = fs.readFileSync(ud9.fileGoc);
  const loiTem9 = await loiCua(() => ud9.guiTem(voiDau(ud9, { sua: [{ khoa: 'o:1', x: 20 }] })));
  can2.chanGhi = null;
  ok('2.7: cân không lưu khối LAB → báo mẫu tem 28 chưa đổi trên cân; file gốc (thẻ Tem) giữ nguyên',
    /CHƯA nhận/.test(loiTem9) && /mẫu tem 28: ô thứ 2 trên cân khác bản vừa gửi/.test(loiTem9)
    && Buffer.compare(fs.readFileSync(ud9.fileGoc), gocTem9) === 0, loiTem9);
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
    () => nvQuay.kiemTraDay({ com: 'COM3', baud: 9600 }),
  ].map(f => loiCua(f)));
  ok('NV quầy: 15 việc đều bị từ chối "chỉ dành cho quản lý hoặc chủ" (kể cả lưu file nạp USB tem / thông số, kiểm tra dây RS232), không nối cân, không gửi, không ghi file USB',
    tuChoi.length === 15 && tuChoi.every(l => /quản lý hoặc chủ/.test(l)) && nhan.length === soN && can2.ketNoi.length === soK
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
    can.ngatKetNoi();                  // … nên kết nối TCP tới cân cũ (2.8: kết nối giữ mở) không còn
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
    // Cổng 33571 thật (cân giả mayCan ghi lại byte) và cân hai chiều nhận PLU như cân thật (2.6 đọc lại để kiểm).
    const u = new UngDung(ddMoi(), { danhMuc: async () => dm, mang: [], mac: async () => null, tuyHaiChieu: tuyHC,
      gui: async (ip, cong, du) => { await guiTcp(ip, cong, du); apPluVaoCanGia(can, du); } });
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
    const soNhan = nhan.length, soKhoi = can.khoi.length;
    await thu(() => u.guiXuongCan());   // 2.6.1: khối DWL PLU qua cổng hai chiều
    // Đường lui của 2.6.1: cổng hai chiều không nối được → cả file qua 33571.
    const svDong = net.createServer(); await new Promise<void>(r => svDong.listen(0, '127.0.0.1', () => r()));
    const congDong = (svDong.address() as net.AddressInfo).port; await new Promise<void>(r => svDong.close(() => r()));
    u.luuCauHinh({ congHaiChieu: congDong });
    await thu(() => u.guiXuongCan());
    u.luuCauHinh({ congHaiChieu: can.cong });
    await thu(() => u.guiTem(voiDau(u, { chu: { 23: 'Hạn dùng' } })));
    const gui = nhan.slice(soNhan), khoiGui = can.khoi.slice(soKhoi);
    ok('HỒI QUY: sau đó gửi danh mục (qua cổng hai chiều, và đường lui 33571) và tem (2.7: khối LAB qua cổng hai chiều) không mang dòng mạng nào',
      gui.length === 1 && gui.every(b => !coMang(b)) && khoiGui.some(k => k.ten === 'PLU') && khoiGui.some(k => k.ten === 'LAB')
      && khoiGui.every(k => ['PLU', 'LAB'].includes(k.ten) && !coMang(Buffer.from(k.dong.join('\r\n'), 'latin1'))), `${gui.length} ${khoiGui.map(k => k.ten)}`);
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
    ok('Khung đỏ ở ô Cân (cả lần tự làm mới — 2.8: mỗi 15 giây), thẻ Gửi giá từ kho và Tất cả hàng',
      /<div id="bao-hsd"><\/div>/.test(gd) && /\$\('bao-hsd'\)\.innerHTML = baoHsdCu\(trangThai\.hsd\)/.test(gd)
      && /trangThai\.hsd = s\.hsd;[^\n]*veOCan\(\)/.test(gd)
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

  console.log('6f17 · Chữ cài đặt chung (2.4): không lộ WiFi, gửi khối TMT (2.7: không có cổng hai chiều → lui về 33571), bấm hai lần, mất mạng, file USB, quyền');
  {
    // File lưu từ cân ra USB có chữ chung, kể cả tên / mật khẩu WiFi và tên miền giả (15, 16, 19), và một mẫu tem có ô "Ghi chú cân 1".
    const MAU_GHI_CHU = ['LAB\t5\tTEM GHI CHU\t0\t58\t40\t', 'LAS\t0\t2\t17\t0\t1\t0\t0\t1\t8\t8\t300\t24\t', 'LAE\t'];
    const fileTmt = new TextEncoder().encode(['ECS\tVER\tV3.14E8\t', '', 'DWL\tPLU\t', ...PLU_F, 'END\tPLU\t', '',
      'DWL\tLAB\t', ...MAU_TEM, ...MAU_GHI_CHU, 'END\tLAB\t', '', 'DWL\tTMS\t', ...TMS_F, 'END\tTMS\t', '',
      'DWL\tTMT\t', 'TMT\t0\tQuán thử\t', 'TMT\t1\tCân quầy\t', 'TMT\t3\tVND\t', 'TMT\t8\tThank You\t',
      'TMT\t15\tWIFI-GIA\t', 'TMT\t16\tmat-khau-gia\t', 'TMT\t19\tmay-chu.gia\t', 'END\tTMT\t', '', 'END\tECS\t', ''].join('\r\n'));
    const MANG = ['WIFI-GIA', 'mat-khau-gia', 'may-chu.gia'];
    const dongGuiF = (b: Buffer) => b.toString('latin1').split('\r\n');
    const u = new UngDung(ddMoi(), { danhMuc: async () => dmF('10001', '10002', '10003'), mang: [], mac: async () => null, choXacNhanMs: [0] });
    u.luuCauHinh({ ipCan: '127.0.0.1', congCan, congHaiChieu: congDong });   // cổng hai chiều đóng: đi đường lui 33571
    u.ghiNhanFileTuCan(fileTmt);

    const cc = await u.chuChung();
    const gt = (id: number) => cc.muc.find(m => m.id === id);
    ok('Đọc chữ chung: tên quán, tên cân (UTF-8), chữ sau số tiền, ghi chú 5; số chưa có dòng → null',
      gt(0)?.giaTri === 'Quán thử' && gt(1)?.giaTri === 'Cân quầy' && gt(3)?.giaTri === 'VND' && gt(8)?.giaTri === 'Thank You'
      && gt(4)?.giaTri === null && cc.muc.every(m => m.docDuoc), JSON.stringify(cc.muc.map(m => [m.id, m.giaTri])));
    ok('Không bao giờ trả tên / mật khẩu WiFi, tên miền (15, 16, 19) — cả số lẫn chữ', !cc.muc.some(m => [15, 16, 19].includes(m.id))
      && MANG.every(t => !JSON.stringify(cc).includes(t)));
    ok('Chữ nào đang in trên mẫu tem nào: Ghi chú cân 1 → mẫu 5; tên quán không mẫu nào in',
      JSON.stringify(gt(4)?.trenTem) === JSON.stringify(['Mẫu 5 "TEM GHI CHU"']) && gt(0)?.trenTem.length === 0, JSON.stringify(gt(4)?.trenTem));
    const mc = moMayChu(u, { ma: 'cc', phienBan: 'thu', khiCoNhip: () => {}, khiDong: () => {} });
    const apiCc = async (d: string, than?: unknown) => (await fetch(`http://127.0.0.1:${mc.port}${d}?t=cc`, { method: 'POST',
      body: JSON.stringify(than ?? {}), headers: { 'Content-Type': 'application/json' } })).text();
    const chuApi = await apiCc('/api/chu-chung');
    ok('API /api/chu-chung: có tên quán, không có chữ mạng nào', /"ok":true/.test(chuApi) && chuApi.includes('Quán thử') && MANG.every(t => !chuApi.includes(t)));

    const goc0 = docGocF(u), soNhan = nhan.length;
    const k1 = await thu(() => u.suaChuChung({ thay: { 0: '  Beeftown\tQuận 1 ', 4: 'ĐT 0909 000 000' } }));
    const b = (t: string) => Buffer.from(t, 'utf8').toString('latin1');
    ok('Gửi tên quán + ghi chú 1: cổng hai chiều đóng → cân giả 33571 nhận đúng một file nhỏ chỉ có khối TMT (UTF-8, tab và cách thừa đã gọn); '
      + '2.7: chưa đọc lại được → xacNhan false, không nói "cân đã nhận"',
      k1?.doi.join() === '0,4' && k1.cachGui === 'mot-chieu' && !k1.xacNhan && /chưa đọc lại được cân/.test(k1.cauXacNhan ?? '') && nhan.length === soNhan + 1 && JSON.stringify(dongGuiF(nhan[nhan.length - 1])) === JSON.stringify(['ECS\tVER\tV3.14E8\t', '',
        'DWL\tTMT\t', `TMT\t0\t${b('Beeftown Quận 1')}\t`, `TMT\t4\t${b('ĐT 0909 000 000')}\t`, 'END\tTMT\t', '', 'END\tECS\t', '']),
      JSON.stringify(dongGuiF(nhan[nhan.length - 1] ?? Buffer.alloc(0))));
    const goc1 = docGocF(u).toString('latin1');
    ok('File gốc đã có chữ mới; dòng WiFi, tên miền y nguyên; file nhỏ vừa gửi không mang dòng mạng',
      (await u.chuChung()).muc.find(m => m.id === 0)?.giaTri === 'Beeftown Quận 1' && goc1.includes('TMT\t16\tmat-khau-gia\t')
      && goc1.includes('TMT\t15\tWIFI-GIA\t') && goc1.includes('TMT\t19\tmay-chu.gia\t') && MANG.every(t => !nhan[nhan.length - 1].toString('latin1').includes(t))
      && Buffer.compare(docGocF(u), goc0) !== 0);

    const soN1 = nhan.length, goc2 = docGocF(u);
    const tuChoi = [
      ['Chữ như cũ → "chưa có gì thay đổi"', { 0: 'Beeftown Quận 1' }, /chưa có gì thay đổi/],
      ['Mật khẩu WiFi (16) → từ chối, rời WiFi', { 16: 'abc' }, /rời WiFi/],
      ['Tên WiFi viết "015" → vẫn từ chối', { '015': 'abc' }, /rời WiFi/],
      ['Tên miền (19) kèm một chữ đúng → từ chối cả lần gửi', { 5: 'Được', 19: 'x.vn' }, /rời WiFi/],
      ['Dấu ngành hàng (14) chỉ xem', { 14: '#' }, /chỉ được xem/],
      ['Tên quán trống', { 0: '   ' }, /không được để trống/],
      ['Dài quá 40 ký tự', { 5: 'ư'.repeat(41) }, /dài quá 40/],
      ['Biểu tượng cảm xúc', { 5: 'Bò 🐄' }, /không in được/],
      ['Giá trị không phải chữ (null) → báo, không lặng lẽ bỏ', { 0: null }, /phải là chữ/],
    ] as const;
    const kqTuChoi = await Promise.all(tuChoi.map(([, thay]) => loiCua(() => u.suaChuChung({ thay }))));
    ok('Từ chối trước khi nối cân: ' + tuChoi.map(t => t[0]).join('; '), kqTuChoi.every((l, i) => tuChoi[i][2].test(l))
      && nhan.length === soN1 && Buffer.compare(docGocF(u), goc2) === 0, JSON.stringify(kqTuChoi));
    ok('Qua API cũng từ chối mật khẩu WiFi, không gửi', /rời WiFi/.test(await apiCc('/api/chu-chung/gui', { thay: { 16: 'abc' } })) && nhan.length === soN1);

    const [h1, h2] = await Promise.all([loiCua(() => u.suaChuChung({ thay: { 9: 'Cảm ơn quý khách' } })), loiCua(() => u.suaChuChung({ thay: { 9: 'Cảm ơn quý khách' } }))]);
    ok('Bấm gửi hai lần cùng lúc: chạy lần lượt, chỉ một lần gửi xuống cân, lần sau báo chưa có gì thay đổi',
      [h1, h2].filter(l => l === '').length === 1 && [h1, h2].some(l => /chưa có gì thay đổi/.test(l)) && nhan.length === soN1 + 1, JSON.stringify([h1, h2]));

    u.luuCauHinh({ congCan: congDong });
    const goc3 = docGocF(u), soN2 = nhan.length;
    const loiMat = await loiCua(() => u.suaChuChung({ thay: { 10: 'Giữ lạnh 0–4 độ' } }));
    ok('Cân không nhận (cổng đóng): báo lỗi, không nói "đã gửi", file gốc y nguyên (lần sau gửi lại được)',
      loiMat !== '' && !/[Đđ]ã gửi/.test(loiMat) && nhan.length === soN2 && Buffer.compare(docGocF(u), goc3) === 0
      && (await u.chuChung()).muc.find(m => m.id === 10)?.giaTri === null, loiMat);
    u.luuCauHinh({ congCan });

    const k = await thu(() => u.taoFileUsbGoc({ chuChung: { 10: 'Giữ lạnh 0–4 độ' }, thongSo: { 104: '4' } }));
    const fu = k && fs.existsSync(k.duongDan) ? fs.readFileSync(k.duongDan).toString('latin1') : '';
    ok('Lưu file nạp USB kèm chữ đang sửa (và thông số đang sửa); file gốc chưa đổi', k?.chuChung?.join() === '10' && k.thongSo.join() === '104'
      && fu.includes(`TMT\t10\t${b('Giữ lạnh 0–4 độ')}\t`) && fu.includes('TMS\t104\t4\t') && Buffer.compare(docGocF(u), goc3) === 0, JSON.stringify(k));
    ok('File nạp USB với chữ WiFi → từ chối', /rời WiFi/.test(await loiCua(() => u.taoFileUsbGoc({ chuChung: { 15: 'x' } }))));
    fs.rmSync(u.fileChoUsb, { force: true });

    const cnC = { id: 'cn1', ma: 'q1', ten: 'Chi nhánh thử' };
    const nv = new UngDung(ddMoi(), { mang: [], mac: async () => null,
      nguoi: { email: 'nv@b', hoTen: 'NV', vaiTro: 'nhan_vien_quay', chiNhanh: cnC, cacChiNhanh: [cnC], quyen: quyenCuaVai('nhan_vien_quay') } });
    const soN3 = nhan.length;
    const loiNv = await Promise.all([() => nv.chuChung(), () => nv.suaChuChung({ thay: { 0: 'Quán khác' } }), () => nv.taoFileUsbGoc({ chuChung: { 0: 'Quán khác' } })]
      .map(f => loiCua(f)));
    ok('NV quầy: xem, gửi, lưu file USB chữ chung đều bị từ chối "chỉ dành cho quản lý hoặc chủ", không gửi gì',
      loiNv.every(l => /quản lý hoặc chủ/.test(l)) && nhan.length === soN3 && !fs.existsSync(nv.fileChoUsb), JSON.stringify(loiNv));
    mc.stop(true);
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
    ok('Chữ cài đặt chung (2.4): lamCan không bật lại nút của mục; đang gửi thì Gửi / Bỏ không bật lại, gửi xong bỏ thay đổi đã gửi; tải lại giữ thay đổi đang sửa của mục khác',
      /\.filter\(b => !b\.closest\('#can-thong-so'\)\)\.filter\(b => !b\.closest\('#can-chu-chung'\)\)/.test(gd)
      && /\$\('nut-gui-cc'\)\.disabled = dangGuiCc \|\| !n/.test(gd) && /ccSua = \{\};   \/\/ đã gửi/.test(gd) && /\.inert = dangGuiCc/.test(gd)
      && /tsSua = giu \? giuThayDoi\(tsSua, tsTruoc, moi\) : \{\}/.test(gd) && /ccSua = giu \? giuThayDoi\(ccSua, ccDL, moi\) : \{\}/.test(gd)
      && (gd.match(/await taiLaiSauKhiGui\(\);/g) ?? []).length === 2 && /if \(lan !== lanTaiCan\) return;/.test(gd)
      && /goi\('\/api\/chu-chung\/gui', \{ thay: ccSua \}\)/.test(gd) && /CHƯA THỬ TRÊN CÂN THẬT/.test(gd));
    ok('Chữ cài đặt chung: "Lưu file nạp USB" của mục chỉ mang chữ đang sửa (thông số sai không chặn đường USB, và ngược lại)',
      /goi\('\/api\/tao-usb-goc', \{ chuChung: ccSua \}\)/.test(gd) && !/thongSo: tsSua, chuChung/.test(gd));
    ok('HỒI QUY: Phím tắt / Thông số — đang gửi thì nút Gửi không bật lại, gửi xong bỏ thay đổi đã gửi',
      /\$\('nut-gui-phim'\)\.disabled = dangGuiPhim \|\| n === 0/.test(gd) && /phimSua = \{\};   \/\/ đã gửi/.test(gd)
      && /\$\('nut-gui-ts'\)\.disabled = dangGuiTs \|\| !n/.test(gd) && /tsSua = \{\};   \/\/ đã gửi/.test(gd));
    ok('HỒI QUY: Mẫu tem — bấm ô trên sơ đồ bỏ focus nút / ô đánh dấu để phím mũi tên dời được ô',
      /if \(suaDuoc\(o\)\) \{[\s\S]{0,400}document\.activeElement\.blur\(\)/.test(gd));
    ok('HỒI QUY: xoá / gỡ qua WiFi (2.7) — trang gửi kèm dấu kế hoạch của lần xem trước và lựa chọn lúc xem, ở cả thẻ Gửi giá lẫn thẻ Cân',
      /goi\('\/api\/can\/xoa-wifi', \{ giuHangNgoaiKho: giu, dauVan: x\.dauVan \}\)/.test(gd) && /goi\('\/api\/can\/go-con-lai', \{ giuHangNgoaiKho: giu, dauVan: x\.dauVan \}\)/.test(gd)
      && /xoaQuaWifi\(\$\('khung-usb'\), x, giu, \$\('nut-xoa-wifi'\)\)/.test(gd) && /goQuaWifi\(\$\('khung-usb'\), x, giu, \$\('nut-go-wifi'\)\)/.test(gd)
      && /\.go'\)\.onclick = \(ev\) => goQuaWifi\(kq, x, giu, ev\.currentTarget\)/.test(gd) && /\.xoa'\)\.onclick = \(ev\) => xoaQuaWifi\(kq, x, giu, ev\.currentTarget\)/.test(gd));
    ok('HỒI QUY: "Hàng trên cân chưa rõ" hiện ở Xem trước và Tất cả hàng; "Khớp kho" đổi thành "Chưa rõ trên cân"',
      /baoCanChuaRo\(x\.canChuaRo\)/.test(gd) && /baoCanChuaRo\(d\.canChuaRo\)/.test(gd) && /'Chưa rõ trên cân'/.test(gd));
    ok('HỒI QUY: file từ cân có nhật ký mà gộp hỏng → trang báo, không im', /k\.nhatKy && k\.nhatKy\.loi/.test(gd));
    ok('HỒI QUY: khung nạp USB có lần bấm Accu/Confirm thứ ba (màn 000) và chờ Finish', /Accu\/Confirm<\/b> lần thứ ba/.test(gd) && /Finish/.test(gd));
    ok('HỒI QUY: hướng dẫn §21 tả đúng cách gán phím (chọn trong danh sách, "— trống —"), không còn "Gõ 0"', !/Gõ 0 = bỏ trống phím/.test(hd)
      && /Chọn <b>— trống —<\/b> để bỏ trống phím/.test(hd));
  }
}

// =============================================================================
// 2.6: GỬI XONG ĐỌC LẠI CÂN ĐỂ KIỂM (xacNhanSauGui). Lỗi thấy ở quán 02–03/10/2026: chương trình ghi nhận đã gửi 69 hàng
// kho ("Giữ nguyên", "Khớp kho 69"), cân thật (lưu ra USB) chỉ có 7 hàng cũ — gửi qua 33571 cân không trả lời, chương
// trình coi "gửi hết byte" là xong. Cân giả hai chiều đóng vai cân thật; cổng 33571 giả (phu.gui) nhận / bỏ qua / nhận một
// phần. Mọi thứ chỉ trên 127.0.0.1, `mang: []`.
// =============================================================================
console.log('6g · 2.6: gửi xong đọc lại cân để kiểm');
{
  const loiCua = async (f: () => unknown) => { try { await f(); return ''; } catch (e) { return cauLoi(e); } };
  const tuyHC = { choMs: 2000, choHangRaoMs: 2000, nghiBaoCaoMs: 1 };
  let soDd = 0;
  const ddMoi = () => { soDd++; return { cauHinh: path.join(tam, `appdata-g${soDd}`), duLieu: path.join(tam, `tai-lieu-g${soDd}`) }; };
  // Cân thật của quán lúc thấy lỗi: hàng cũ ở PLU 1–3 (mã 1000x), kho có hàng mới mã 110, 112.
  const PLU_CU = [plu(1, '10001', '845,0', 'Lõi vai bò Mỹ'), plu(2, '10002', '876,0', 'Sườn bò Hàn Quốc'), plu(3, '10003', '695,0', 'Gầu bò')];
  const TMS_G = ['TMS\t0\t28\t', 'TMS\t202\t3\t', 'TMS\t203\t3\t'];
  let giaStriploin = 780000, tenChuck = 'Steak Chuck eye';
  let hsdGauBo: number | null | undefined;   // undefined: kho không quản HSD món này
  const dmG = (): DanhMucKho => ({ mauMaVach: '2XCCCCCWWWWWK', matHang: [
    hang('STRIPLOIN', '110', 'Bò lúc lắc Striploin', giaStriploin), hang('CHUCK', '112', tenChuck, 890000),
    { ...hang('GAU-BO', '10003', 'Gầu bò', 695000), ...(hsdGauBo !== undefined ? { han_dung_ngay: hsdGauBo } : {}) },
  ] });
  /** Cổng 33571 giả: 'nhan' — cân thêm / sửa PLU theo số như cân thật; 'bo-qua' — nhận hết byte rồi không làm gì (lỗi ở
   *  quán); 'mot-phan' — chỉ dòng PLU đầu; 'cham' — lưu sau `cham` ms (lần đọc ngay sau khi gửi còn thấy hàng cũ). */
  const congGia = (can: { du: { phan: Record<string, string[]> } }) => {
    const c = { cheDo: 'nhan' as 'nhan' | 'bo-qua' | 'mot-phan' | 'cham' | 'tat', cham: 0, soLan: 0 };
    const ap = (du: Uint8Array, chiMot: boolean) => apPluVaoCanGia(can, du, chiMot);
    const gui = async (_ip: string, _cong: number, du: Uint8Array) => {
      c.soLan++;
      if (c.cheDo === 'nhan') ap(du, false);
      else if (c.cheDo === 'mot-phan') ap(du, true);
      else if (c.cheDo === 'cham') setTimeout(() => ap(du, false), c.cham);
      else if (c.cheDo === 'tat') throw new LoiKhongNoi('cổng 33571 tắt (thử)');   // cân tắt: chưa nối được, chưa gửi byte nào
    };
    return { c, gui };
  };
  const mo = async (choXacNhanMs = [0, 20, 400]) => {
    const can = await moCanGia({ du: { phan: { PLU: PLU_CU.map(chuoiByte), TMS: TMS_G, LAB: MAU_TEM.map(chuoiByte) } } });
    const congGiaCan = congGia(can);
    const u = new UngDung(ddMoi(), { danhMuc: async () => dmG(), mang: [], mac: async () => null, tuyHaiChieu: tuyHC, gui: congGiaCan.gui, choXacNhanMs });
    u.luuCauHinh({ ipCan: '127.0.0.1', congCan, congHaiChieu: can.cong });
    u.ghiNhanFileTuCan(fileCan(PLU_CU));
    return { can, u, c: congGiaCan.c };
  };
  const soLanDocPlu = (can: { yeuCau: readonly string[] }) => can.yeuCau.filter(d => d.startsWith('UPL\tPLU\t')).length;
  const tenTrenCan = (can: { du: { phan: Record<string, string[]> } }) =>
    (can.du.phan.PLU ?? []).map(d => d.split('\t')).map(c => `${c[1]}:${c[2]}`).join(' ');

  console.log('6g1 · Cân bỏ qua lần gửi — không ghi nhận, nói rõ hàng nào, tự gửi tạm dừng');
  {
    const { can, u, c } = await mo();
    // Cân bỏ qua mọi đường gửi: 33571 (như ở quán) và cả khối DWL qua cổng hai chiều (nhận, qua hàng rào, không lưu).
    c.cheDo = 'bo-qua'; can.chanGhi = () => {};
    const goc0 = fs.readFileSync(u.fileGoc), tren0 = fs.readFileSync(u.fileTrenCan);
    const loi = await loiCua(() => u.guiXuongCan());
    ok('HỒI QUY 03/10: cân bỏ qua lần gửi → báo cân CHƯA nhận, nêu PLU 1 trên cân vẫn là "Lõi vai bò Mỹ" 845.000 đ (gửi Bò lúc lắc 780.000 đ)',
      /CHƯA nhận/.test(loi) && /PLU 1 trên cân vẫn là "Lõi vai bò Mỹ" mã 10001 845\.000 đ \(gửi "Bò lúc lắc Striploin" mã 110 780\.000 đ\)/.test(loi), loi);
    ok('HỒI QUY 03/10: cân bỏ qua lần gửi → file gốc và tren-can.tsv y nguyên (không thành "Giữ nguyên" / "Khớp kho")',
      Buffer.compare(fs.readFileSync(u.fileGoc), goc0) === 0 && Buffer.compare(fs.readFileSync(u.fileTrenCan), tren0) === 0);
    const soKhoiPlu = () => can.khoi.filter(k => k.lenh === 'DWL' && k.ten === 'PLU').length;
    ok('Đọc lại cân: chưa khớp thì chờ rồi đọc lại (đủ 3 lần đọc PLU), không gửi lại (một khối DWL qua cổng hai chiều, không qua 33571)',
      soLanDocPlu(can) === 3 && soKhoiPlu() === 1 && c.soLan === 0 && /qua WiFi \(cổng hai chiều\)/.test(loi), `đọc ${soLanDocPlu(can)}, khối ${soKhoiPlu()}, 33571 ${c.soLan}`);
    ok('Câu báo chỉ đường: màn hình bán hàng, gửi lại một lần, Lưu file để nạp USB; không có chữ "thành công"',
      /màn hình bán hàng/.test(loi) && /Lưu file để nạp USB/.test(loi) && /chưa ghi nhận/.test(loi) && !/thành công/i.test(loi));
    const dau = u.chuaXacNhan();
    ok('Ghi dấu "lech" (chua-xac-nhan.json) kèm số hàng và câu báo', dau?.loai === 'lech' && dau.soHang === 3 && dau.cau === loi && !!Date.parse(dau.luc));
    const x = await u.xemTruoc();
    ok('Xem trước sau lần gửi cân bỏ qua: vẫn "Thêm" hàng mới (không "Giữ nguyên"), kèm dấu chưa xác nhận',
      x.dong.filter(d => d.loai === 'them').length === 2 && !x.dong.some(d => d.loai === 'giu' && d.maCan === '110') && x.chuaXacNhan?.loai === 'lech');
    const th = await u.tatCaHang();
    ok('Tất cả hàng: mã 110, 112 vẫn "Chưa lên cân"; trả dấu chưa xác nhận', th.hang.filter(h => h.tinhTrang === 'chua_len').length === 2 && th.chuaXacNhan?.loai === 'lech');
    u.luuCauHinh({ tuGui: true });
    const lanTuGui = await u.tuGuiMotLan();
    ok('HỒI QUY 03/10: tự gửi tạm dừng sau lần cân chưa nhận — không gửi lại mỗi phút', !lanTuGui.daGui && /Tự gửi tạm dừng/.test(lanTuGui.cau)
      && soKhoiPlu() === 1 && c.soLan === 0, lanTuGui.cau);
    fs.writeFileSync(u.fileCanChuaRo, JSON.stringify({ luc: new Date().toISOString(), cau: 'Xoá qua WiFi hỏng (thử).' }));
    const lanCoXoaHong = await u.tuGuiMotLan();
    fs.rmSync(u.fileCanChuaRo);
    ok('Tự gửi tạm dừng mà lần xoá qua WiFi trước cũng hỏng → vẫn nhắc "nạp USB ngay"', /nạp USB ngay/.test(lanCoXoaHong.cau) && /Tự gửi tạm dừng/.test(lanCoXoaHong.cau)
      && soKhoiPlu() === 1 && c.soLan === 0, lanCoXoaHong.cau);

    console.log('6g2 · Cân nhận đủ → "Cân đã nhận", hết dấu, tự gửi chạy lại');
    c.cheDo = 'nhan'; can.chanGhi = null;
    const k = await u.guiXuongCan();
    ok('Cân nhận đủ → xacNhan, không câu chưa kiểm, hết dấu; còn dấu "lech" nên gửi CẢ danh sách (3 dòng)', k.xacNhan && k.cauXacNhan === null
      && u.chuaXacNhan() === null && tenTrenCan(can) === '1:110 2:112 3:10003' && k.soHangGui === 3 && k.cachGui === 'hai-chieu', tenTrenCan(can));
    const x2 = await u.xemTruoc();
    ok('Sau khi cân nhận: Xem trước "Giữ nguyên" cả 3 hàng, không dấu', x2.dong.every(d => d.loai === 'giu') && x2.chuaXacNhan === null);
    giaStriploin = 790000;
    const lanSauKhiHetDau = await u.tuGuiMotLan();
    ok('Tự gửi chạy lại sau khi hết dấu; câu nói "cân đã nhận (đọc lại khớp)"', lanSauKhiHetDau.daGui && /1 sửa/.test(lanSauKhiHetDau.cau)
      && /cân đã nhận \(đọc lại khớp\)/.test(lanSauKhiHetDau.cau), lanSauKhiHetDau.cau);
    giaStriploin = 780000;
    u.luuCauHinh({ tuGui: false });

    console.log('6g2b · Lần gửi chỉ đổi HSD hay chỉ đổi tên mà cân bỏ qua → vẫn bắt được');
    hsdGauBo = 3;
    await u.guiXuongCan();   // cân nhận: bật in HSD 3 ngày cho Gầu bò
    c.cheDo = 'bo-qua'; can.chanGhi = () => {}; hsdGauBo = 2;   // sang ngày mới: HSD đếm ngược 3 → 2, chỉ cột HSD đổi
    const loiHsd = await loiCua(() => u.guiXuongCan());
    ok('Chỉ HSD đổi (đếm ngược qua đêm) mà cân bỏ qua → "CHƯA nhận", nêu HSD trên cân và HSD đã gửi',
      /CHƯA nhận 1 hàng/.test(loiHsd) && /PLU 3 trên cân vẫn là "Gầu bò" mã 10003 695\.000 đ, HSD 3 ngày \(gửi "Gầu bò" mã 10003 695\.000 đ, HSD 2 ngày\)/.test(loiHsd), loiHsd);
    c.cheDo = 'nhan'; can.chanGhi = null;
    await u.guiXuongCan();
    c.cheDo = 'bo-qua'; can.chanGhi = () => {}; tenChuck = 'Steak Chuck eye Úc';
    const loiTen = await loiCua(() => u.guiXuongCan());
    ok('Chỉ tên đổi mà cân bỏ qua → "CHƯA nhận", nêu tên trên cân và tên đã gửi',
      /PLU 2 trên cân vẫn là "Steak Chuck eye" mã 112 890\.000 đ \(gửi "Steak Chuck eye Úc" mã 112 890\.000 đ\)/.test(loiTen), loiTen);
    c.cheDo = 'nhan'; can.chanGhi = null; tenChuck = 'Steak Chuck eye'; hsdGauBo = undefined;

    console.log('6g3 · Cân nhận một phần, cân lưu chậm');
    c.cheDo = 'mot-phan'; can.chanGhi = (_ten, dong, ap) => ap(dong.slice(0, 1));   // cân chỉ lưu dòng đầu
    can.du.phan.PLU = PLU_CU.map(chuoiByte);
    u.ghiNhanFileTuCan(fileCan(PLU_CU));
    const loiMp = await loiCua(() => u.guiXuongCan());
    ok('Cân chỉ nhận dòng PLU đầu → báo 1 hàng lệch: PLU 2 (Sườn bò Hàn Quốc vẫn còn), không nhắc PLU 1',
      /CHƯA nhận 1 hàng/.test(loiMp) && /PLU 2 trên cân vẫn là "Sườn bò Hàn Quốc"/.test(loiMp) && !/PLU 1 /.test(loiMp) && u.chuaXacNhan()?.loai === 'lech', loiMp);
    c.cheDo = 'cham'; c.cham = 10; can.chanGhi = (_ten, dong, ap) => { setTimeout(() => ap(dong), 10); };   // cân lưu chậm
    can.du.phan.PLU = PLU_CU.map(chuoiByte);
    u.ghiNhanFileTuCan(fileCan(PLU_CU));
    const truoc = soLanDocPlu(can);
    const ketQuaCham = await u.guiXuongCan();
    ok('Cân lưu chậm (lần đọc ngay sau khi gửi còn hàng cũ) → chờ, đọc lại thấy khớp → cân đã nhận', ketQuaCham.xacNhan
      && soLanDocPlu(can) - truoc === 2 && u.chuaXacNhan() === null, `đọc ${soLanDocPlu(can) - truoc}`);
    c.cheDo = 'nhan'; can.chanGhi = null;
    can.du.phan.PLU = PLU_CU.map(chuoiByte);
    u.ghiNhanFileTuCan(fileCan(PLU_CU));
    // Cân đang lưu nên lần đọc ngay sau khi gửi hỏng (đóng kết nối giữa chừng); lần đọc sau được.
    can.hong = { loai: 'dong-giua-chung', khi: 'PLU' };
    setTimeout(() => { can.hong = null; }, 200);
    const truocHong = soLanDocPlu(can);
    const ketQuaDocHong = await u.guiXuongCan();
    ok('Lần đọc lại đầu hỏng (cân đang lưu) → chờ rồi đọc lại, không vội báo "chưa kiểm được"', ketQuaDocHong.xacNhan && u.chuaXacNhan() === null
      && soLanDocPlu(can) - truocHong >= 2, ketQuaDocHong.cauXacNhan ?? '');
    await can.dong();
  }

  console.log('6g3b · 2.6.1: cân bỏ qua cổng 33571 nhưng nhận khối DWL qua cổng hai chiều (như ở quán 03/10)');
  {
    const { can, u, c } = await mo();
    c.cheDo = 'bo-qua';   // như cân của quán: mọi lần gửi qua 33571 đều bị bỏ qua
    const k = await u.guiXuongCan();
    const khoi = can.khoi.filter(x => x.lenh === 'DWL' && x.ten === 'PLU');
    ok('HỒI QUY 03/10 (2.6.1): cân bỏ qua 33571 → gửi qua cổng hai chiều, cân đã nhận (đọc lại khớp), không dùng 33571',
      k.xacNhan && k.cachGui === 'hai-chieu' && c.soLan === 0 && tenTrenCan(can) === '1:110 2:112 3:10003' && u.chuaXacNhan() === null,
      JSON.stringify({ k: { ...k, conLai: k.conLai.length }, tren: tenTrenCan(can) }));
    ok('2.6.1: chỉ gửi các hàng thêm / sửa (PLU 1, 2 — mã 110, 112), không gửi dòng giữ nguyên; không có lệnh xoá (CLR)',
      khoi.length === 1 && khoi[0].dong.map(d => d.split('\t').slice(1, 3).join(':')).join(' ') === '1:110 2:112' && k.soHangGui === 2
      && !can.khoi.some(x => x.lenh === 'CLR'), JSON.stringify(khoi.map(x => x.dong.length)));
    giaStriploin = 790000;
    const lan = await u.tuGuiMotLan();
    const khoiSau = can.khoi.filter(x => x.lenh === 'DWL' && x.ten === 'PLU');
    ok('2.6.1: tự gửi một lần sửa giá → một khối DWL đúng 1 dòng (PLU 1, 790.000 đ), cân đã nhận; vẫn không dùng 33571; câu nói gửi 1 hàng',
      lan.daGui && /cân đã nhận/.test(lan.cau) && /\(gửi 1 hàng qua cổng hai chiều\)/.test(lan.cau) && khoiSau.length === 2 && khoiSau[1].dong.length === 1
      && khoiSau[1].dong[0].split('\t')[1] === '1' && c.soLan === 0, lan.cau);
    giaStriploin = 780000;

    // Như máy quầy lên 2.6.1 từ 2.5: file gốc ghi nhận hàng kho (lần gửi cũ không kiểm) mà cân thật vẫn là hàng cũ, không dấu.
    await u.guiXuongCan();   // về 780.000 trên cân và file gốc
    can.du.phan.PLU = PLU_CU.map(chuoiByte);   // cân thật "quay về" hàng cũ mà chương trình không biết
    giaStriploin = 781000;
    const loiCu = await loiCua(() => u.guiXuongCan());
    ok('2.6.1: chỉ gửi 1 hàng đổi mà cân còn hàng cũ khác kho từ trước → câu tách rõ: không nói "chưa nhận" hàng chưa gửi',
      /Đã gửi 1 hàng qua WiFi \(cổng hai chiều\) nhưng đọc lại thấy cân còn 1 hàng khác kho từ trước/.test(loiCu) && !/CHƯA nhận/.test(loiCu)
      && /lần gửi sau chương trình gửi cả danh sách/.test(loiCu) && u.chuaXacNhan()?.loai === 'lech', loiCu);
    const kCa = await u.guiXuongCan();
    ok('2.6.1: lần gửi sau (còn dấu "lech") gửi cả danh sách → cân về đúng kho, hết dấu', kCa.xacNhan && kCa.soHangGui === 3
      && tenTrenCan(can) === '1:110 2:112 3:10003' && u.chuaXacNhan() === null, JSON.stringify({ ...kCa, conLai: kCa.conLai.length }));
    giaStriploin = 780000;
    await u.guiXuongCan();

    // Ghi xong khối DWL mà cân trả hàng rào chậm quá giờ (daGhi): không gửi chồng qua 33571 lúc cân còn đang lưu.
    giaStriploin = 785000;
    can.hong = { loai: 'hang-rao-cham', ms: 2600 };
    const kCham = await u.guiXuongCan();
    can.hong = null;
    ok('2.6.1: hàng rào quá giờ SAU khi đã ghi khối → không gửi thêm qua 33571; đọc lại quyết định (ở đây cân đã lưu → cân đã nhận)',
      kCham.xacNhan && kCham.cachGui === 'hai-chieu' && c.soLan === 0, JSON.stringify({ ...kCham, conLai: kCham.conLai.length }));
    giaStriploin = 780000;
    await u.guiXuongCan();
    const gd = fs.readFileSync(path.join(import.meta.dir, '../src/giao-dien.html'), 'utf8');
    ok('Trang: câu "Cân đã nhận" nói vừa gửi mấy hàng và qua cổng nào', /k\.cachGui === 'hai-chieu' \? 'qua cổng hai chiều'/.test(gd) && /k\.soHangGui/.test(gd));
    await can.dong();
  }

  console.log('6g3c · 2.6.1: cân đổi địa chỉ → dò một lượt, ghi qua cổng hai chiều ở địa chỉ mới (không gửi chồng qua 33571)');
  {
    const can = await moCanGia({ du: { phan: { PLU: PLU_CU.map(chuoiByte), TMS: TMS_G, LAB: MAU_TEM.map(chuoiByte) } } });
    const cg = congGia(can);
    // Cổng "33571" riêng cho lần thử này, chỉ ở 127.0.0.1: dò dải 127.0.0.0/24 chỉ thấy đúng một cân.
    const may33571 = net.createServer(s => { s.on('data', () => {}); s.on('end', () => s.end()); });
    await new Promise<void>(r => may33571.listen(0, '127.0.0.1', () => r()));
    const cong33571 = (may33571.address() as net.AddressInfo).port;
    const u = new UngDung(ddMoi(), { danhMuc: async () => dmG(), mang: [{ ip: '127.0.0.254', mask: '255.255.255.0' }], mac: async () => null,
      tuyHaiChieu: tuyHC, gui: cg.gui, choXacNhanMs: [0, 20] });
    u.luuCauHinh({ ipCan: '127.0.0.2', congCan: cong33571, congHaiChieu: can.cong });   // cân "đã chuyển" sang 127.0.0.1
    u.ghiNhanFileTuCan(fileCan(PLU_CU));
    let k: Awaited<ReturnType<typeof u.guiXuongCan>> | null = null;
    const loiDoi = await loiCua(async () => { k = await u.guiXuongCan(); });
    if (loiDoi) console.log(`    (lỗi: ${loiDoi})`);
    ok('2.6.1: cân đổi địa chỉ → tìm thấy ở 127.0.0.1, ghi qua cổng hai chiều ở đó, cân đã nhận; không gửi gì qua 33571; báo đổi địa chỉ',
      !!k && k.xacNhan && k.cachGui === 'hai-chieu' && k.doiDiaChi?.den === '127.0.0.1' && cg.c.soLan === 0 && u.cauHinh().ipCan === '127.0.0.1'
      && tenTrenCan(can) === '1:110 2:112 3:10003', JSON.stringify(k && { ...k, conLai: k.conLai.length }));
    // Không thấy cân nào (cả cổng 33571 cũng tắt): câu của lần dò, như trước 2.6.1 — không phải câu lỗi cổng hai chiều.
    u.luuCauHinh({ ipCan: '127.0.0.3' });
    await new Promise<void>(r => may33571.close(() => r()));
    await can.dong();
    cg.c.cheDo = 'tat';
    const gocTruocTat = fs.readFileSync(u.fileGoc);
    const loiTat = await loiCua(() => u.guiXuongCan());
    ok('2.6.1: cân tắt hẳn → câu của lần dò WiFi ("dò cả … địa chỉ … cũng không thấy cân"), không phải câu của 33571; chưa ghi nhận gì',
      /dò cả \d+ địa chỉ/.test(loiTat) && /không thấy cân/.test(loiTat) && !/cổng 33571 tắt \(thử\)/.test(loiTat)
      && Buffer.compare(fs.readFileSync(u.fileGoc), gocTruocTat) === 0, loiTat);
  }

  console.log('6g4 · Không đọc lại được cân → ghi nhận như cũ, kèm dấu "chưa xác nhận"');
  {
    const { can, u, c } = await mo();
    const congMo = can.cong;
    const sv = net.createServer(); await new Promise<void>(r => sv.listen(0, '127.0.0.1', () => r()));
    const congDong = (sv.address() as net.AddressInfo).port; await new Promise<void>(r => sv.close(() => r()));
    u.luuCauHinh({ congHaiChieu: congDong });
    const goc0 = fs.readFileSync(u.fileGoc);
    const k = await u.guiXuongCan();
    const dau = u.chuaXacNhan();
    ok('Cổng hai chiều đóng → gửi qua 33571 (đường lui), vẫn ghi nhận lần gửi (file gốc mới), nhưng xacNhan = false và câu nói chưa đọc lại được cân',
      !k.xacNhan && k.cachGui === 'mot-chieu' && c.soLan === 1 && /chưa đọc lại được cân để kiểm/.test(k.cauXacNhan ?? '')
      && /nên đã gửi qua cổng 33571; ở quán cân từng bỏ qua cổng này/.test(k.cauXacNhan ?? '') && Buffer.compare(fs.readFileSync(u.fileGoc), goc0) !== 0
      && dau?.loai === 'khong-doc' && dau.cau === k.cauXacNhan && !/thành công/i.test(k.cauXacNhan ?? ''), k.cauXacNhan ?? '');
    const x = await u.xemTruoc(), th = await u.tatCaHang();
    ok('Dấu "khong-doc" đi kèm Xem trước và Tất cả hàng (trang đổi "Khớp kho" thành "Khớp kho, chưa xác nhận")',
      x.chuaXacNhan?.loai === 'khong-doc' && th.chuaXacNhan?.loai === 'khong-doc' && th.hang.some(h => h.tinhTrang === 'khop'));
    u.luuCauHinh({ tuGui: true });
    const lanTuGui = await u.tuGuiMotLan();
    ok('Tự gửi khi kho không đổi mà lần gửi trước chưa xác nhận → không nói "Cân đã khớp kho"', !lanTuGui.daGui && !/Cân đã khớp kho/.test(lanTuGui.cau)
      && /chưa đọc lại được cân/.test(lanTuGui.cau), lanTuGui.cau);
    u.luuCauHinh({ tuGui: false });
    u.luuCauHinh({ congHaiChieu: congMo });
    can.hong = { loai: 'dong-giua-chung', khi: 'PLU' };
    const k2 = await u.guiXuongCan();
    can.hong = null;
    ok('Cân đóng kết nối giữa lúc trả danh sách → "khong-doc", không bao giờ báo cân đã nhận', !k2.xacNhan && u.chuaXacNhan()?.loai === 'khong-doc', k2.cauXacNhan ?? '');
    const pluCan = can.du.phan.PLU;
    can.du.phan.PLU = []; c.cheDo = 'bo-qua'; can.chanGhi = () => {};
    const k3 = await u.guiXuongCan();
    ok('Cân trả danh sách hàng rỗng → "khong-doc" (không tin được), không coi là khớp', !k3.xacNhan && /rỗng/.test(k3.cauXacNhan ?? ''), k3.cauXacNhan ?? '');
    can.du.phan.PLU = pluCan; c.cheDo = 'nhan'; can.chanGhi = null;
    const ch = JSON.parse(fs.readFileSync(u.fileCauHinh, 'utf8'));
    fs.writeFileSync(u.fileCauHinh, JSON.stringify({ ...ch, macHaiChieu: 'AABBCCDDEEFF' }));
    const soKetNoi = can.ketNoi.length, soGui33571 = c.soLan, gocTruocKhacMay = fs.readFileSync(u.fileGoc);
    const loiKhacMay = await loiCua(() => u.guiXuongCan());
    ok('2.6.1: cân ở địa chỉ đó khác mã máy chương trình nhớ → không gửi gì (cả 33571 — có thể là cân thứ hai), không ghi nhận gì',
      // 2.8: dùng lại kết nối đang giữ (0 kết nối mới) hay mở một — không bao giờ hơn, và không giữ kết nối tới cân khác mã máy.
      /không phải cân chương trình vẫn dùng/.test(loiKhacMay) && can.ketNoi.length - soKetNoi <= 1 && c.soLan === soGui33571
      && Buffer.compare(fs.readFileSync(u.fileGoc), gocTruocKhacMay) === 0 && !u.trangThaiNen().giu.dangMo, loiKhacMay);
    fs.writeFileSync(u.fileCauHinh, JSON.stringify(ch));
    await u.docTuCanQuaWifi();
    ok('Đọc dữ liệu từ cân qua WiFi (cân thật) → hết dấu chưa xác nhận', u.chuaXacNhan() === null);
    fs.writeFileSync(u.fileChuaXacNhan, '{hỏng');
    ok('File dấu hỏng (sửa tay) → vẫn coi là còn dấu, không báo khớp', u.chuaXacNhan()?.loai === 'khong-doc');
    u.ghiNhanFileTuCan(fileCan(PLU_CU));
    ok('Ghi nhận file lưu từ cân ra USB → hết dấu', u.chuaXacNhan() === null && !fs.existsSync(u.fileChuaXacNhan + '.tam'));
    await can.dong();
  }

  console.log('6g5 · Trang và tài liệu');
  {
    const gd = fs.readFileSync(path.join(import.meta.dir, '../src/giao-dien.html'), 'utf8');
    const hd = fs.readFileSync(path.join(import.meta.dir, '../src/huong-dan.html'), 'utf8');
    ok('Trang: sau khi gửi chỉ nói "Cân đã nhận" khi k.xacNhan; không thì khung vàng "chưa kiểm được"',
      /baoChung\(k\.xacNhan \? 'xong' : 'luu-y'/.test(gd) && /<b>Cân đã nhận\.<\/b>/.test(gd) && /cân có đủ \$\{k\.soHang\} hàng/.test(gd) && /chưa kiểm được cân đã nhận chưa/.test(gd));
    const thanGui = gd.slice(gd.indexOf('async function gui()'), gd.indexOf('async function taoUsb()'));
    ok('Trang: gửi hỏng → câu lỗi ở đầu trang (baoChung), không ở #ket-qua-gui mà taiTrangThai dựng lại bảng sẽ xoá',
      /catch \(err\) \{[\s\S]*baoChung\('loi', e\(err\.message\)\)[\s\S]*await taiTrangThai\(\)/.test(thanGui) && !/\$\('ket-qua-gui'\)/.test(thanGui));
    ok('Trang: lần gửi trước cân chưa nhận → nút Gửi nói tự gửi đang tạm dừng (không "không cần gửi")',
      /canChuaNhan \? 'Lần gửi trước cân chưa nhận — tự gửi đang tạm dừng/.test(gd));
    ok('Trang: khung dấu chưa xác nhận ở Xem trước và Tất cả hàng; nhãn "Giữ nguyên (chưa xác nhận)", "Khớp kho, chưa xác nhận"',
      /baoChuaXacNhan\(x\.chuaXacNhan\)/.test(gd) && /baoChuaXacNhan\(d\.chuaXacNhan\)/.test(gd) && /'Giữ nguyên \(chưa xác nhận\)'/.test(gd)
      && /'Khớp kho, chưa xác nhận'/.test(gd) && /s\.chuaXacNhan/.test(gd));
    ok('Trang: giờ của dấu hiện theo giờ Việt Nam (lucNgan có timeZone Asia/Ho_Chi_Minh)', /const lucNgan = [^\n]*timeZone: 'Asia\/Ho_Chi_Minh'/.test(gd));
    ok('Hướng dẫn: mục Gửi giá từ kho nói chương trình đọc lại cân sau khi gửi (Mới 2.6)', /Mới 2\.6/.test(hd) && /đọc lại cân/.test(hd));
  }
}

// =============================================================================
// 2.7: GHI CÀI ĐẶT QUA CỔNG HAI CHIỀU RỒI ĐỌC LẠI · GỠ BẰNG GHI ĐÈ · TỰ PHỤC HỒI SAU XOÁ HỎNG · CHẨN ĐOÁN WIFI
// Thấy ở quán 02–03/10/2026: cân bỏ qua mọi lần gửi qua 33571, đọc qua cổng hai chiều thì được. Mọi thứ chỉ trên 127.0.0.1.
// =============================================================================
console.log('6h · 2.7: so khối vừa gửi với bản đọc lại, bỏ dòng mạng khi gửi 33571, gỡ bằng ghi đè, tự phục hồi, chẩn đoán WiFi');
{
  const loiCua = async (f: () => unknown) => { try { await f(); return ''; } catch (e) { return cauLoi(e); } };
  const thu = async <T>(f: () => Promise<T> | T): Promise<T | null> => { try { return await f(); } catch (e) { console.log(`    (lỗi: ${cauLoi(e)})`); return null; } };
  const tuyHC = { choMs: 2000, choHangRaoMs: 2000, nghiBaoCaoMs: 1 };
  let soDd = 0;
  const ddMoi = () => { soDd++; return { cauHinh: path.join(tam, `appdata-h${soDd}`), duLieu: path.join(tam, `tai-lieu-h${soDd}`) }; };
  const PLU_H = [plu(1, '10001', '845,0', 'Loi vai bo My'), plu(2, '10002', '876,0', 'Suon bo Han Quoc'), plu(3, '10003', '695,0', 'Gau bo')];
  const TMS_H = ['TMS\t0\t28\t', 'TMS\t202\t3\t', 'TMS\t203\t3\t'];
  // Phím B (tầng 1) và Shift + E gọi PLU 2 — gỡ PLU 2 thì hai phím này phải bỏ.
  const SCP_H = ['SCP\t0\t1\t1\t', 'SCP\t0\t2\t2\t', 'SCP\t1\t5\t2\t', 'SCP\t0\t3\t3\t'];
  const fileH = (pluDong: string[] = PLU_H, themTms: string[] = []) => new TextEncoder().encode(['ECS\tVER\tV3.14E8\t', '',
    'DWL\tPLU\t', ...pluDong, 'END\tPLU\t', '', 'DWL\tLAB\t', ...MAU_TEM, 'END\tLAB\t', '', 'DWL\tSCP\t', ...SCP_H, 'END\tSCP\t', '',
    'DWL\tTMS\t', ...TMS_H, ...themTms, 'END\tTMS\t', '', 'END\tECS\t', ''].join('\r\n'));
  const DM_H = (): DanhMucKho => ({ mauMaVach: '2XCCCCCWWWWWK', matHang: [
    hang('LOI-VAI', '10001', 'Loi vai bo My', 845000), hang('SUON', '10002', 'Suon bo Han Quoc', 876000), hang('GAU-BO', '10003', 'Gau bo', 695000)] });
  const boSuon = (dm: DanhMucKho): DanhMucKho => ({ ...dm, matHang: dm.matHang.filter(h => h.ma !== 'SUON') });
  type GuiCan = (ip: string, cong: number, du: Uint8Array) => Promise<void>;
  /**
   * Chương trình + cân giả hai chiều (PLU_H, SCP_H, mẫu tem, TMT có tên / mật khẩu WiFi giả); file gốc = fileH(); kho = dm().
   * taoGui(can): cổng 33571 giả — mặc định cân nhận PLU như cân thật (apPluVaoCanGia).
   */
  const moH = async (dm: () => DanhMucKho, tuy: { pluCan?: string[]; taoGui?: (can: Awaited<ReturnType<typeof moCanGia>>) => GuiCan; nguoi?: NguoiDung } = {}) => {
    const can = await moCanGia({ du: { phan: { PLU: (tuy.pluCan ?? PLU_H).map(chuoiByte), TMS: TMS_H, SCP: SCP_H, LAB: MAU_TEM.map(chuoiByte),
      TMT: ['TMT\t0\tQUAN THU\t', 'TMT\t15\tWIFI-GIA\t', 'TMT\t16\tmat-khau-gia\t'] } } });
    const gui: GuiCan = tuy.taoGui ? tuy.taoGui(can) : async (ip, cong, du) => { await guiTcp(ip, cong, du); apPluVaoCanGia(can, du); };
    const u = new UngDung(ddMoi(), { danhMuc: async () => dm(), mang: [], mac: async () => null, tuyHaiChieu: tuyHC,
      choXacNhanMs: [0, 10], choPhucHoiMs: [0, 10], cho33571Ms: 20, gui, ...(tuy.nguoi ? { nguoi: tuy.nguoi } : {}) });
    u.luuCauHinh({ ipCan: '127.0.0.1', congCan, congHaiChieu: can.cong });
    u.ghiNhanFileTuCan(fileH());
    return { can, u };
  };
  const dongCan = (can: { du: { phan: Record<string, string[]> } }, so: number) => (can.du.phan.PLU ?? []).find(d => d.split('\t')[1] === String(so))?.split('\t') ?? [];
  const chuCot = (c: string | undefined) => Buffer.from(c ?? '', 'latin1').toString('utf8');
  const docGocH = (u: UngDung) => fs.readFileSync(u.fileGoc).toString('latin1');
  const cnH = { id: 'cn1', ma: 'q1', ten: 'Chi nhánh thử' };
  const NV_QUAY: NguoiDung = { email: 'nv@b', hoTen: 'NV', vaiTro: 'nhan_vien_quay', chiNhanh: cnH, cacChiNhanh: [cnH], quyen: quyenCuaVai('nhan_vien_quay') };

  console.log('6h1 · Hàm thuần: lechCaiDat (so khối vừa gửi với bản đọc lại), boDongMang (bỏ dòng mạng khi gửi 33571)');
  {
    ok('TMS: số so theo giá trị ("04" = "4"); lệch nói cân vẫn là gì; cân không trả dòng đó cũng là lệch',
      lechCaiDat('TMS', ['DWL\tTMS\t', 'TMS\t104\t4\t', 'END\tTMS\t'], ['TMS\t104\t04\t']).length === 0
      && lechCaiDat('TMS', ['TMS\t104\t4\t'], ['TMS\t104\t0\t'])[0] === 'thông số 104: cân vẫn là 0 (gửi 4)'
      && lechCaiDat('TMS', ['TMS\t105\t1\t'], ['TMS\t104\t0\t'])[0] === 'thông số 105: cân không trả dòng này (gửi 1)');
    const lTmt = lechCaiDat('TMT', [`TMT\t0\t${chuoiByte('Quán mới')}\t`], [`TMT\t0\t${chuoiByte('Quán cũ')}\t`, 'TMT\t16\tmat-khau-gia\t']);
    ok('TMT: so y nguyên byte, hiện chữ UTF-8; câu báo không bao giờ nhắc dòng cân có mà lần gửi không có (mật khẩu WiFi)',
      lTmt.length === 1 && lTmt[0] === 'chữ số 0: cân vẫn là "Quán cũ" (gửi "Quán mới")' && !lTmt.join().includes('mat-khau'), JSON.stringify(lTmt));
    ok('SCP: theo tầng + phím; tên phím theo chữ in trên phím, tầng 2 = Shift',
      lechCaiDat('SCP', ['SCP\t1\t5\t3\t'], ['SCP\t1\t5\t0\t'])[0] === 'phím E (tầng 2): cân vẫn gọi không gì (gửi PLU 3)'
      && lechCaiDat('SCP', ['SCP\t0\t1\t1\t'], ['SCP\t0\t1\t1\t', 'SCP\t1\t1\t9\t']).length === 0);
    const dTrong = dongPluRieng(docFileCan(fileH()), { so: 2, ma: MA_CAN_TRONG, ten: 'KHÔNG DÙNG (PLU trống)', gia: 0 });
    const lPlu = lechCaiDat('PLU', [dTrong], [chuoiByte(PLU_H[1])]);
    ok('PLU: so mã, cách bán, giá theo giá trị ("0,0" = "0,3"), tên, HSD; nói hàng đang trên cân',
      lechCaiDat('PLU', [dTrong], [dTrong.replace('\t0,0\t', '\t0,3\t')]).length === 0
      && lPlu[0] === 'PLU 2: cân vẫn là "Suon bo Han Quoc" mã 10002 (gửi "KHÔNG DÙNG (PLU trống)" mã 99999)'
      && /^PLU 2: cân không có/.test(lechCaiDat('PLU', [dTrong], [chuoiByte(PLU_H[0])])[0] ?? ''), JSON.stringify(lPlu));
    const tem = MAU_TEM.map(chuoiByte);
    ok('LAB: cả mẫu tem cùng số; bỏ ô trống cuối dòng và số 0 đầu; nói ô thứ mấy khác, thiếu ô, không có mẫu',
      lechCaiDat('LAB', tem, tem.map(d => d + '\t')).length === 0
      && lechCaiDat('LAB', tem, tem.map((d, i) => (i === 2 ? d.replace('LAS\t29\t', 'LAS\t029\t') : d))).length === 0
      && lechCaiDat('LAB', tem, tem.map((d, i) => (i === 3 ? d.replace(/^(LAS\t29\t3\t3\t0\t)1\t/, '$19\t') : d)))[0] === 'mẫu tem 28: ô thứ 3 trên cân khác bản vừa gửi'
      && lechCaiDat('LAB', tem, tem.filter((_, i) => i !== 5))[0] === 'mẫu tem 28: cân có 13 ô (gửi 14 ô)'
      && lechCaiDat('LAB', tem, [])[0] === 'mẫu tem 28: cân không có mẫu này');
    const coMang = new TextEncoder().encode(['﻿ECS\tVER\tV3.14E8\t', 'DWL\tTMS\t', 'TMS\t0\t28\t', 'TMS\t43\t1\t', 'TMS\t45\t1\t', 'TMS\t150\t192\t',
      'TMS\t166\t33581\t', 'TMS\t435\t1\t', 'TMS\t104\t0\t', 'END\tTMS\t', 'DWL\tTMT\t', 'TMT\t0\tQuan\t', 'TMT\t15\tWIFI-GIA\t', 'TMT\t16\tmat-khau-gia\t',
      'TMT\t19\tmay-chu.gia\t', 'END\tTMT\t', 'END\tECS\t', ''].join('\r\n'));
    const bo = Buffer.from(boDongMang(coMang)).toString('latin1');
    ok('boDongMang: bỏ TMS 43–53, 150–173, 430–441 và TMT 15, 16, 19; giữ BOM, CRLF, các dòng khác y nguyên',
      !/TMS\t(43|45|150|166|435)\t/.test(bo) && !/WIFI-GIA|mat-khau-gia|may-chu\.gia/.test(bo) && bo.startsWith('\xEF\xBB\xBFECS\tVER')
      && bo.includes('TMS\t0\t28\t\r\nTMS\t104\t0\t\r\nEND\tTMS\t') && bo.includes('TMT\t0\tQuan\t\r\nEND\tTMT\t'), bo);
    const khongMang = fileH();
    ok('boDongMang: file không có dòng mạng → trả lại đúng mảng byte đó', boDongMang(khongMang) === khongMang);
  }

  console.log('6h2 · Đường lui 33571 không bao giờ mang dòng mạng; file gốc vẫn giữ');
  {
    let dm = DM_H();
    const { can, u } = await moH(() => dm);
    u.ghiNhanFileTuCan(fileH(PLU_H, ['TMS\t43\t1\t', 'TMS\t150\t192\t', 'TMS\t166\t33581\t']));   // file USB thật có thông số mạng
    dm = { ...dm, matHang: dm.matHang.map(h => (h.ma === 'GAU-BO' ? { ...h, gia_ban_kg: 700000 } : h)) };
    u.luuCauHinh({ congHaiChieu: congDong });
    const soN = nhan.length;
    const g = await thu(() => u.guiXuongCan());
    u.luuCauHinh({ congHaiChieu: can.cong });
    const gui = nhan.slice(soN).map(b => b.toString('latin1'));
    ok('Cổng hai chiều đóng → cả file qua 33571 (như trước) nhưng không có TMS 43, 150, 166; vẫn có PLU, TMS 0',
      g?.cachGui === 'mot-chieu' && gui.length === 1 && !/TMS\t(43|150|166)\t/.test(gui[0]) && gui[0].includes('DWL\tPLU\t') && gui[0].includes('TMS\t0\t28\t'),
      gui.join('|').split('\r\n').filter(d => d.startsWith('TMS')).join(' '));
    ok('File gốc vẫn giữ các dòng mạng (file USB làm từ file gốc phải đủ phần TMS)', docGocH(u).includes('TMS\t43\t1\t') && docGocH(u).includes('TMS\t150\t192\t'));
    await can.dong();
  }
  {
    // Cổng hai chiều đóng: thông số lui về 33571 rồi chỉ đọc lại MỘT lần (không chờ đủ các lượt đọc lại — trang không treo).
    const { can, u } = await moH(DM_H);
    u.ghiNhanFileTuCan(fileH(PLU_H, ['TMS\t104\t0\t']));
    const uLui = new UngDung(u.dd, { danhMuc: async () => DM_H(), mang: [], mac: async () => null, tuyHaiChieu: tuyHC, choXacNhanMs: [0, 3000],
      gui: async (ip, cong, du) => { await guiTcp(ip, cong, du); } });
    uLui.luuCauHinh({ congHaiChieu: congDong });
    const bd = Date.now();
    const k = await thu(() => uLui.suaThongSo({ thay: { 104: '4' } }));
    const ms = Date.now() - bd;
    ok('Thông số lui về 33571 (cổng hai chiều đóng) → đọc lại một lần rồi báo chưa kiểm được (xacNhan false), không chờ lượt đọc lại 3 giây',
      k?.cachGui === 'mot-chieu' && !k.xacNhan && /chưa đọc lại được cân/.test(k.cauXacNhan ?? '') && ms < 2000, `${ms} ms · ${JSON.stringify(k)}`);
    await can.dong();
  }

  console.log('6h3 · Gỡ hàng còn nằm lại bằng ghi đè: dòng trống, bỏ phím, hàng mới dùng lại số PLU');
  {
    let dm = DM_H();
    const { can, u } = await moH(() => dm);
    dm = boSuon(dm);
    await thu(() => u.guiXuongCan());
    const x0 = await u.xemTruoc();
    ok('Bỏ sườn khỏi kho, gửi → PLU 2 còn nằm lại (cân chỉ thêm / sửa)', x0.conLai.map(h => h.so).join() === '2', JSON.stringify(x0.conLai));
    const soKn = can.ketNoi.length;
    ok('Thiếu dấu kế hoạch / dấu của lần xem khác → từ chối, chưa nối cân',
      /Thiếu danh sách đã xem trước/.test(await loiCua(() => u.goHangConLai(false))) && /đã đổi từ lúc xem trước/.test(await loiCua(() => u.goHangConLai(false, 'dau-cu')))
      && can.ketNoi.length === soKn);
    const nv = new UngDung(u.dd, { danhMuc: async () => dm, mang: [], mac: async () => null, tuyHaiChieu: tuyHC, nguoi: NV_QUAY });
    ok('NV quầy → "chỉ dành cho quản lý hoặc chủ", chưa nối cân', /quản lý hoặc chủ/.test(await loiCua(() => nv.goHangConLai(false, x0.dauVan))) && can.ketNoi.length === soKn);

    // Cân không lưu khối PLU: đọc lại thấy PLU 2 vẫn là sườn → báo, không ghi nhận gì; gửi lại được.
    can.chanGhi = (ten, dong, ap) => { if (ten !== 'PLU') ap(dong); };
    const tren0 = fs.readFileSync(u.fileTrenCan), goc0 = docGocH(u);
    const loiLech = await loiCua(() => u.goHangConLai(false, x0.dauVan));
    can.chanGhi = null;
    ok('Cân không lưu dòng trống → báo cân CHƯA nhận (nêu PLU 2 vẫn là sườn), không ghi nhận gì (tren-can.tsv, file gốc y nguyên)',
      /CHƯA nhận/.test(loiLech) && /PLU 2: cân vẫn là "Suon bo Han Quoc"/.test(loiLech) && /ghi đè lần nữa không hại gì/.test(loiLech)
      && Buffer.compare(fs.readFileSync(u.fileTrenCan), tren0) === 0 && docGocH(u) === goc0, loiLech);
    // Cổng hai chiều đóng: chưa gửi gì → báo, không ghi nhận, không gửi qua 33571.
    u.luuCauHinh({ congHaiChieu: congDong });
    const soN = nhan.length;
    const loiDong = await loiCua(() => u.goHangConLai(false, x0.dauVan));
    u.luuCauHinh({ congHaiChieu: can.cong });
    ok('Cổng hai chiều đóng → báo không kết nối được, không gửi gì qua 33571 (không kiểm được), không ghi nhận',
      /Không kết nối được cân/.test(loiDong) && nhan.length === soN && Buffer.compare(fs.readFileSync(u.fileTrenCan), tren0) === 0, loiDong);

    const soKhoi = can.khoi.length;
    const go = await thu(() => u.goHangConLai(false, x0.dauVan));
    const khoi = can.khoi.slice(soKhoi);
    const c2 = dongCan(can, 2);
    ok('Gỡ PLU 2: một lần ghi gồm khối PLU (dòng trống) và khối SCP bỏ đúng 2 phím gọi PLU 2 (B, Shift + E); đọc lại khớp',
      go?.daGo.map(h => h.so).join() === '2' && go.boPhim === 2 && go.loiPhim === null && khoi.map(k => `${k.ten}:${k.dong.length}`).join() === 'PLU:1,SCP:2'
      && JSON.stringify(khoi[1]?.dong) === JSON.stringify(['SCP\t0\t2\t0\t', 'SCP\t1\t5\t0\t']), JSON.stringify([go, khoi]));
    ok('Trên cân: PLU 2 là dòng trống mã 99999, giá 0, "KHÔNG DÙNG (PLU trống)", không in HSD; PLU 1, 3 và phím A, C không đổi',
      c2[2] === MA_CAN_TRONG && c2[5] === '0,0' && chuCot(c2[15]) === TEN_PLU_TRONG && c2[27] === '0'
      && dongCan(can, 1)[2] === '10001' && dongCan(can, 3)[2] === '10003' && can.du.phan.SCP.includes('SCP\t0\t1\t1\t') && can.du.phan.SCP.includes('SCP\t0\t3\t3\t'),
      c2.join('|'));
    const ph = await u.phim();
    ok('Ghi nhận: tren-can.tsv PLU 2 là dòng trống, Xem trước hết hàng còn nằm lại; file gốc có hai phím đã bỏ',
      laPluTrong(u.docTrenCan().get(2)!) && (await u.xemTruoc()).conLai.length === 0
      && ph.phim.find(k => k.trang === 0 && k.phim === 2)?.plu === 0 && ph.phim.find(k => k.trang === 1 && k.phim === 5)?.plu === 0);
    const tc = await u.tatCaHang();
    const h2 = tc.hang.find(h => h.so === 2);
    ok('Tất cả hàng: PLU 2 là "PLU trống" (không phải "còn nằm lại"), không có mã FABi', h2?.tinhTrang === 'trong' && h2.maFabi === ''
      && !tc.hang.some(h => h.tinhTrang === 'con_lai'), JSON.stringify(h2));

    // HỒI QUY (thấy khi chụp màn hình 03/10): hàng còn nằm lại vẫn có trong file gốc (file USB / đọc từ cân chưa gửi lần nào)
    // → gỡ xong, Tất cả hàng vẫn hiện "Kho không có" và đếm là hàng.
    {
      let dm2 = boSuon(DM_H());
      const { can: c2, u: u2 } = await moH(() => dm2);   // file gốc = PLU_H (có sườn), chưa gửi lần nào
      const x = await u2.xemTruoc();
      const soKn2 = c2.ketNoi.length;
      const loiMac = await loiCua(() => u2.goHangConLai(false, x.dauVan));
      ok('Chưa biết mã máy của cân (chưa nối cổng hai chiều lần nào) → từ chối như xoá hẳn, chưa nối cân',
        /Chưa biết mã máy của cân/.test(loiMac) && /Chưa gửi gì/.test(loiMac) && c2.ketNoi.length === soKn2, loiMac);
      await u2.thongTinCanHaiChieu();
      const g2 = await thu(() => u2.goHangConLai(false, x.dauVan));
      const tc2 = await u2.tatCaHang();
      ok('HỒI QUY: hàng còn nằm lại có trong file gốc → gỡ xong, file gốc bỏ dòng PLU 2 (tren-can.tsv giữ dòng trống); Tất cả hàng: PLU 2 '
        + 'là "PLU trống", không còn "Kho không có"',
        x.conLai.map(h => h.so).join() === '2' && g2?.daGo.length === 1 && !docFileCan(new Uint8Array(fs.readFileSync(u2.fileGoc))).plu.some(p => p.so === 2)
        && docFileCan(new Uint8Array(fs.readFileSync(u2.fileGoc))).plu.map(p => p.so).join() === '1,3'
        && tc2.hang.find(h => h.so === 2)?.tinhTrang === 'trong' && !tc2.hang.some(h => h.tinhTrang === 'ngoai_kho')
        && tc2.hang.filter(h => h.so === 2).length === 1, JSON.stringify(tc2.hang.map(h => [h.so, h.tinhTrang])));
      dm2 = DM_H();
      await c2.dong();
    }
    {
      // Đọc cân trước khi gỡ: số PLU còn nằm lại giờ là hàng khác trên cân (thêm trên bàn phím cân) → không gỡ gì.
      const { can: c3, u: u3 } = await moH(() => boSuon(DM_H()), { pluCan: [PLU_H[0], plu(2, '10050', '500,0', 'Hang them tren ban phim'), PLU_H[2]] });
      await u3.thongTinCanHaiChieu();
      const x3 = await u3.xemTruoc();
      const soKhoi3 = c3.khoi.length, tren3 = fs.readFileSync(u3.fileTrenCan), goc3 = docGocH(u3);
      const loi3 = await loiCua(() => u3.goHangConLai(false, x3.dauVan));
      ok('Đọc cân trước: PLU 2 trên cân giờ là hàng khác (mã 10050) → không gửi khối nào, nêu hàng đó; tren-can.tsv, file gốc y nguyên; hàng 10050 còn',
        x3.conLai.map(h => h.so).join() === '2' && /giờ là hàng khác/.test(loi3) && /PLU 2: "Hang them tren ban phim" mã 10050/.test(loi3) && /chưa gửi gì/.test(loi3)
        && c3.khoi.length === soKhoi3 && Buffer.compare(fs.readFileSync(u3.fileTrenCan), tren3) === 0 && docGocH(u3) === goc3 && dongCan(c3, 2)[2] === '10050', loi3);
      await c3.dong();
    }
    {
      // Kho chỉ còn lõi vai: PLU 2, 3 còn nằm lại. Cân đã có PLU 2 là dòng trống, không còn PLU 3 (đã nạp USB) → không ghi khối PLU.
      const chiLoiVai = (): DanhMucKho => ({ ...DM_H(), matHang: DM_H().matHang.filter(h => h.ma === 'LOI-VAI') });
      const { can: c4, u: u4 } = await moH(chiLoiVai, { pluCan: [PLU_H[0], plu(2, MA_CAN_TRONG, '0,0', 'KHONG DUNG')] });
      await u4.thongTinCanHaiChieu();
      const x4 = await u4.xemTruoc();
      const soKhoi4 = c4.khoi.length;
      const g4 = await thu(() => u4.goHangConLai(false, x4.dauVan));
      const khoi4 = c4.khoi.slice(soKhoi4);
      ok('Cân đã có PLU 2 là dòng trống, không còn PLU 3 → không gửi khối PLU nào, chỉ bỏ 3 phím gọi PLU 2, 3; báo PLU 3 cân không còn',
        x4.conLai.map(h => h.so).join() === '2,3' && g4?.daGo.map(h => h.so).join() === '2,3' && g4.khongCoTrenCan.join() === '3' && g4.boPhim === 3
        && khoi4.map(k => `${k.ten}:${k.dong.length}`).join() === 'SCP:3', JSON.stringify([g4, khoi4]));
      ok('Ghi nhận: tren-can.tsv PLU 2 là dòng trống, không còn PLU 3; Xem trước hết hàng còn nằm lại; file gốc chỉ còn PLU 1',
        laPluTrong(u4.docTrenCan().get(2)!) && !u4.docTrenCan().has(3) && (await u4.xemTruoc()).conLai.length === 0
        && docFileCan(new Uint8Array(fs.readFileSync(u4.fileGoc))).plu.map(p => p.so).join() === '1');
      await c4.dong();
    }
    // Hàng mới dùng lại số PLU 2 của dòng trống.
    dm = { ...dm, matHang: [...dm.matHang, hang('NAM', '10007', 'Nam bo', 400000)] };
    const x1 = await u.xemTruoc();
    const g1 = await thu(() => u.guiXuongCan());
    ok('Hàng mới (mã 10007) dùng lại số PLU 2: gửi đè lên dòng trống, cân đọc lại khớp; tren-can PLU 2 là hàng mới',
      x1.dong.some(d => d.loai === 'them' && d.maCan === '10007' && d.so === 2) && !!g1?.xacNhan && dongCan(can, 2)[2] === '10007'
      && u.docTrenCan().get(2)?.ma === '10007', JSON.stringify(x1.dong.filter(d => d.loai === 'them')));

    // Phím không đổi được (cân bỏ qua khối SCP): hàng vẫn đã gỡ, báo riêng phím.
    dm = { ...dm, matHang: dm.matHang.filter(h => h.ma !== 'GAU-BO') };
    await thu(() => u.guiXuongCan());
    const x2 = await u.xemTruoc();
    can.chanGhi = (ten, dong, ap) => { if (ten !== 'SCP') ap(dong); };
    const go2 = await thu(() => u.goHangConLai(false, x2.dauVan));
    can.chanGhi = null;
    ok('Gỡ PLU 3 mà cân không lưu khối SCP: hàng đã gỡ (ghi nhận), phím C vẫn gọi PLU 3 — báo riêng, file gốc giữ phím cũ',
      x2.conLai.map(h => h.so).join() === '3' && go2?.daGo.map(h => h.so).join() === '3' && go2.boPhim === 0 && /phím C: cân vẫn gọi PLU 3/.test(go2.loiPhim ?? '')
      && laPluTrong(u.docTrenCan().get(3)!) && (await u.phim()).phim.find(k => k.trang === 0 && k.phim === 3)?.plu === 3, JSON.stringify(go2));
    await can.dong();
  }

  console.log('6h4 · Xoá hẳn qua WiFi hỏng giữa chừng → tự gửi lại cả danh sách, đọc lại đủ → xoá xong');
  {
    let dm = DM_H();
    const { can, u } = await moH(() => dm);
    dm = boSuon(dm);
    await thu(() => u.guiXuongCan());
    let lan = 0;
    can.chanGhi = (ten, dong, ap) => { if (ten === 'PLU' && lan++ === 0) return; ap(dong); };   // lần nạp lại đầu sau CLR bị bỏ qua
    const x = await u.xemTruoc();
    const soKhoi = can.khoi.length;
    const kq = await thu(() => u.xoaQuaWifi(false, x.dauVan));
    can.chanGhi = null;
    ok('Lần nạp lại đầu bị bỏ qua (cân trống hàng) → tự gửi lại ngay, đọc lại đủ 2 hàng: xoá xong, báo rõ đã tự gửi lại',
      kq?.soHang === 2 && kq.daXoa.map(h => h.so).join() === '2' && /chưa xong \(đọc lại thấy cân chưa đúng: thiếu 2 hàng/.test(kq.phucHoi ?? '')
      && /tự gửi lại cả danh sách/.test(kq.phucHoi ?? '') && can.khoi.slice(soKhoi).map(k => `${k.lenh} ${k.ten}`).join() === 'CLR PLU,DWL PLU,DWL PLU',
      JSON.stringify(kq));
    ok('Cân có đúng PLU 1, 3; không dấu "chưa rõ"; tren-can.tsv = cân; Xem trước hết hàng còn nằm lại',
      (can.du.phan.PLU ?? []).map(d => d.split('\t')[1]).join() === '1,3' && (await u.tatCaHang()).canChuaRo === null
      && [...u.docTrenCan().keys()].join() === '1,3' && (await u.xemTruoc()).conLai.length === 0);
    await can.dong();
  }

  {
    // Cân rớt hẳn ngay khi nhận khối nạp lại sau lệnh xoá (mất điện, rớt WiFi): tự gửi lại không nối được lần nào.
    let dm = DM_H();
    const { can, u } = await moH(() => dm);
    dm = boSuon(dm);
    await thu(() => u.guiXuongCan());
    const x = await u.xemTruoc();
    const goc0 = docGocH(u);
    can.chanGhi = (ten, dong, ap) => { if (ten === 'PLU') void can.dong(); else ap(dong); };
    const loi = await loiCua(() => u.xoaQuaWifi(false, x.dauVan));
    ok('Cân rớt ngay sau lệnh xoá, tự gửi lại không nối được lần nào → câu báo nói đúng "định gửi lại … không nối lại được cân" (không nói '
      + 'đã gửi lại), nạp USB ngay; dấu "chưa rõ"; không ghi nhận gì',
      /định gửi lại cả danh sách nhưng không nối lại được cân/.test(loi) && !/đã tự gửi lại/.test(loi) && /nạp USB ngay/.test(loi)
      && !!(await u.tatCaHang()).canChuaRo && docGocH(u) === goc0, loi);
  }

  console.log('6h5 · Chẩn đoán WiFi: chỉ đọc; ghi thử 8 bước; cân bỏ qua 33571; cân không lưu lệnh ghi; cổng đóng; PLU 9999 có hàng thật');
  {
    const { can, u } = await moH(DM_H);
    const soKhoi = can.khoi.length;
    const cd = await thu(() => u.chanDoanWifi({}));
    ok('Chỉ đọc: bắt tay, giờ, danh sách hàng (3/3 khớp) đều đạt; không ghi gì xuống cân; kết luận bảo thử cả ghi',
      cd?.buoc.map(b => `${b.ma}:${b.ketQua}`).join() === 'bat-tay:dat,gio:dat,doc-plu:dat' && can.khoi.length === soKhoi && !cd.ghiThu
      && /3\/3 hàng của chương trình khớp/.test(cd.buoc[2].cau) && /Thử cả ghi/.test(cd.ketLuan.join(' ')), JSON.stringify(cd));
    const tep = cd && fs.existsSync(cd.duongDan) ? fs.readFileSync(cd.duongDan, 'utf8') : '';
    ok('File kết quả ở Tài liệu\\Beeftown Can\\chan-doan: mã máy, từng bước, kết luận; không đọc / không ghi chữ cài đặt (tên, mật khẩu WiFi)',
      !!cd && cd.duongDan.startsWith(path.join(u.dd.duLieu, 'chan-doan') + path.sep) && tep.includes('0023F01AECB1') && tep.includes('[ĐẠT] 1. Bắt tay')
      && tep.includes('KẾT LUẬN') && !/WIFI-GIA|mat-khau-gia/.test(tep) && !can.yeuCau.some(y => y.startsWith('UPL\tTMT')), tep);

    const soKhoi2 = can.khoi.length, soN = nhan.length;
    const cd2 = await thu(() => u.chanDoanWifi({ ghiThu: true }));
    ok('Ghi thử: 8 bước đều đạt', cd2?.buoc.map(b => `${b.ma}:${b.ketQua}`).join()
      === 'bat-tay:dat,gio:dat,doc-plu:dat,ghi-y-het:dat,them-thu:dat,sua-thu:dat,33571:dat,go-thu:dat', JSON.stringify(cd2?.buoc));
    const fileNho = nhan.slice(soN).map(b => b.toString('latin1'));
    ok('Ghi thử: cân giả nhận 4 khối DWL PLU (y hệt PLU 1, thêm, sửa, gỡ PLU 9999) và một file nhỏ qua 33571 chỉ có PLU 9999; hàng thật không đổi',
      can.khoi.slice(soKhoi2).map(k => `${k.ten}:${k.dong.map(d => d.split('\t')[1]).join('+')}`).join() === 'PLU:1,PLU:9999,PLU:9999,PLU:9999'
      && fileNho.length === 1 && fileNho[0].split('\r\n').filter(d => d.startsWith('PLU\t')).map(d => d.split('\t')[1]).join() === '9999'
      && ['10001', '10002', '10003'].every((ma, i) => dongCan(can, i + 1)[2] === ma), JSON.stringify(can.khoi.slice(soKhoi2).map(k => k.ten)));
    ok('Sau chẩn đoán: PLU 9999 trên cân là dòng trống; tren-can.tsv cũng vậy (không thành "còn nằm lại"); kết luận: cân nhận ghi, gỡ được, 33571 nhận',
      dongCan(can, PLU_THU)[2] === MA_CAN_TRONG && laPluTrong(u.docTrenCan().get(PLU_THU)!) && (await u.xemTruoc()).conLai.length === 0
      && /NHẬN ghi qua cổng hai chiều/.test(cd2!.ketLuan.join(' ')) && /Gỡ hàng bằng ghi đè/.test(cd2!.ketLuan.join(' '))
      && /33571 nhận file nhỏ/.test(cd2!.ketLuan.join(' ')), JSON.stringify(cd2?.ketLuan));

    // Cổng 33571 nhận byte mà cân không làm gì (như ở quán 03/10/2026).
    const u33 = new UngDung(u.dd, { danhMuc: async () => DM_H(), mang: [], mac: async () => null, tuyHaiChieu: tuyHC, choXacNhanMs: [0, 10], cho33571Ms: 20,
      gui: async (ip, cong, du) => { await guiTcp(ip, cong, du); } });
    const cd3 = await thu(() => u33.chanDoanWifi({ ghiThu: true }));
    const b7 = cd3?.buoc.find(b => b.ma === '33571');
    ok('Cân bỏ qua file nhỏ qua 33571: bước 7 hỏng ("bỏ qua", đọc lại vẫn "THỬ WIFI 2"), bước 8 vẫn gỡ; kết luận nói 33571 không nhận',
      b7?.ketQua === 'hong' && /bỏ qua file nhỏ/.test(b7.cau) && /THỬ WIFI 2/.test(b7.cau) && cd3!.buoc.find(b => b.ma === 'go-thu')?.ketQua === 'dat'
      && /33571 không nhận/.test(cd3!.ketLuan.join(' ')) && dongCan(can, PLU_THU)[2] === MA_CAN_TRONG, JSON.stringify(cd3?.buoc));

    const nv = new UngDung(u.dd, { mang: [], mac: async () => null, tuyHaiChieu: tuyHC, nguoi: NV_QUAY });
    const soKn = can.ketNoi.length;
    ok('NV quầy → từ chối, chưa nối cân', /quản lý hoặc chủ/.test(await loiCua(() => nv.chanDoanWifi({ ghiThu: true }))) && can.ketNoi.length === soKn);

    u.luuCauHinh({ congHaiChieu: congDong });
    const cd5 = await thu(() => u.chanDoanWifi({ ghiThu: true }));
    u.luuCauHinh({ congHaiChieu: can.cong });
    ok('Cổng hai chiều đóng: bắt tay hỏng, mọi bước sau bỏ qua (có lý do); kết luận: cổng hai chiều không trả lời, dùng USB',
      cd5?.buoc.map(b => `${b.ma}:${b.ketQua}`).join() === 'bat-tay:hong,gio:bo-qua,doc-plu:bo-qua,ghi-y-het:bo-qua,them-thu:bo-qua,sua-thu:bo-qua,33571:bo-qua,go-thu:bo-qua'
      && /không trả lời/.test(cd5.ketLuan.join(' ')) && /USB/.test(cd5.ketLuan.join(' ')), JSON.stringify(cd5?.buoc));
    await can.dong();
  }
  {
    // Cân nhận lệnh ghi (qua hàng rào) mà không lưu hàng nào.
    const { can, u } = await moH(DM_H);
    can.chanGhi = (ten, dong, ap) => { if (ten !== 'PLU') ap(dong); };
    const cd4 = await thu(() => u.chanDoanWifi({ ghiThu: true }));
    can.chanGhi = null;
    ok('Cân không lưu lệnh ghi: bước 4 đạt (ghi y hệt không đổi gì — nói rõ chưa chứng minh cân lưu), bước 5 hỏng "CHƯA nhận", 6–7 bỏ qua, '
      + 'bước 8 hỏng; kết luận: cân chưa nhận ghi, dùng USB; cân không có PLU 9999 nên không ghi nhận hàng thử',
      cd4?.buoc.slice(3).map(b => `${b.ma}:${b.ketQua}`).join() === 'ghi-y-het:dat,them-thu:hong,sua-thu:bo-qua,33571:bo-qua,go-thu:hong'
      && /chưa chứng minh|cân có LƯU không/.test(cd4.buoc[3].cau) && /CHƯA nhận/.test(cd4.buoc[4].cau) && /CHƯA nhận ghi/.test(cd4.ketLuan.join(' '))
      && !u.docTrenCan().has(PLU_THU), JSON.stringify(cd4?.buoc));
    await can.dong();
  }
  {
    // PLU 9999 trên cân là hàng thật: không ghi đè.
    const { can, u } = await moH(DM_H, { pluCan: [...PLU_H, plu(PLU_THU, '10099', '100,0', 'Hang that o 9999')] });
    const cd6 = await thu(() => u.chanDoanWifi({ ghiThu: true }));
    ok('PLU 9999 đang có hàng thật: bước 5–8 bỏ qua (nói rõ), hàng đó không bị đụng',
      !!cd6 && cd6.buoc.slice(4).every(b => b.ketQua === 'bo-qua' && /hàng thật/.test(b.cau)) && dongCan(can, PLU_THU)[2] === '10099', JSON.stringify(cd6?.buoc));
    await can.dong();
  }

  {
    // Cân lưu chậm: nhận khối PLU, vài chục ms sau mới có trong danh sách đọc ra (như cân thật đang ghi bộ nhớ).
    const { can, u } = await moH(DM_H);
    const uCham = new UngDung(u.dd, { danhMuc: async () => DM_H(), mang: [], mac: async () => null, tuyHaiChieu: tuyHC, choXacNhanMs: [0, 150],
      cho33571Ms: 20, gui: async (ip, cong, du) => { await guiTcp(ip, cong, du); apPluVaoCanGia(can, du); } });
    can.chanGhi = (ten, dong, ap) => { if (ten === 'PLU') setTimeout(() => ap(dong), 40); else ap(dong); };
    const soYc = can.yeuCau.length;
    const cd7 = await thu(() => uCham.chanDoanWifi({ ghiThu: true }));
    can.chanGhi = null;
    ok('Cân lưu chậm (đọc ngay chưa thấy): chẩn đoán chờ rồi đọc lại như khi gửi giá — 8 bước đều đạt, không báo nhầm "CHƯA nhận"',
      cd7?.buoc.map(b => `${b.ma}:${b.ketQua}`).join() === 'bat-tay:dat,gio:dat,doc-plu:dat,ghi-y-het:dat,them-thu:dat,sua-thu:dat,33571:dat,go-thu:dat'
      && can.yeuCau.slice(soYc).filter(y => y === 'UPL\tPLU\t').length > 6 && dongCan(can, PLU_THU)[2] === MA_CAN_TRONG, JSON.stringify(cd7?.buoc));
    await can.dong();
  }
  {
    // Cân 0 số lẻ giá; cân rớt ngay khi nhận lệnh gỡ hàng thử → không đọc lại được: nhớ đúng bản cuối đã gửi.
    const { can, u } = await moH(DM_H);
    u.ghiNhanFileTuCan(new TextEncoder().encode(new TextDecoder().decode(fileH()).replace('TMS\t202\t3\t', 'TMS\t202\t0\t').replace('TMS\t203\t3\t', 'TMS\t203\t0\t')));
    can.chanGhi = (ten, dong, ap) => { if (ten === 'PLU' && dong.some(d => d.split('\t')[2] === MA_CAN_TRONG)) void can.dong(); else ap(dong); };
    const cd8 = await thu(() => u.chanDoanWifi({ ghiThu: true }));
    const h = u.docTrenCan().get(PLU_THU);
    ok('Gỡ hàng thử hỏng, không đọc lại được (cân rớt) → nhớ bản cuối đã gửi ("THỬ 33571" — cân đã nhận 33571), giá đúng cột giá theo số lẻ '
      + 'của cân (0 số lẻ: 3.000 đ là "3000,0", không phải "3,0")',
      cd8?.buoc.find(b => b.ma === 'go-thu')?.ketQua === 'hong' && h?.ma === MA_CAN_THU && h.ten === 'THỬ 33571' && h.gia === '3000,0',
      JSON.stringify([h, cd8?.buoc.slice(3)]));
  }

  console.log('6h6 · Trang, máy chủ, hướng dẫn');
  {
    const gd = fs.readFileSync(path.join(import.meta.dir, '..', 'src', 'giao-dien.html'), 'utf8');
    const hd = fs.readFileSync(path.join(import.meta.dir, '..', 'src', 'huong-dan.html'), 'utf8');
    const mc = fs.readFileSync(path.join(import.meta.dir, '..', 'src', 'may-chu.ts'), 'utf8');
    ok('Trang: nút Chẩn đoán WiFi; "Thử cả ghi" phải hỏi lại trước khi chạy; mở được thư mục kết quả',
      gd.includes('id="nut-chan-doan"') && gd.includes('id="chan-doan-ghi"') && /goi\('\/api\/can\/chan-doan', \{ ghiThu \}\)/.test(gd)
      && /if \(ghiThu && !confirm\(/.test(gd) && /goi\('\/api\/mo-thu-muc', \{ cho: 'chan-doan' \}\)/.test(gd));
    ok('Trang: nút "Gỡ khỏi cân qua WiFi (ghi đè)" có hỏi lại; nhãn "PLU trống" ở Tất cả hàng',
      gd.includes('Gỡ khỏi cân qua WiFi (ghi đè)') && /async function goQuaWifi[\s\S]{0,300}if \(!confirm\(/.test(gd) && gd.includes("trong: ['PLU trống'"));
    ok('Trang: thông số / chữ / phím / tem chỉ nói "Cân đã nhận" khi chương trình đọc lại khớp (k.xacNhan); không còn câu "qua cổng 33571" cũ',
      /if \(k\.xacNhan\) \{\s*baoChung\('xong', `<p><b>Cân đã nhận/.test(gd) && (gd.match(/baoCaiDat\(/g) ?? []).length === 5
      && !/qua cổng 33571\. Chưa thử trên cân thật: cân không trả lời/.test(gd));
    ok('Máy chủ: /api/can/go-con-lai (kèm dấu kế hoạch), /api/can/chan-doan', mc.includes("case '/api/can/go-con-lai'")
      && /goHangConLai\(b\.giuHangNgoaiKho === true, typeof b\.dauVan === 'string' \? b\.dauVan : undefined\)/.test(mc) && mc.includes("case '/api/can/chan-doan'"));
    ok('Hướng dẫn: mục Chẩn đoán WiFi, Gỡ khỏi cân (ghi đè), PLU trống', hd.includes('Chẩn đoán WiFi') && hd.includes('Gỡ khỏi cân') && hd.includes('PLU trống'));
  }
}

// =============================================================================
console.log('6i · 2.8: giữ kết nối hai chiều mở, nhịp, nghe cân báo in tem, tự chỉnh giờ, nghe UDP');
{
  const loiCua = async (f: () => unknown) => { try { await f(); return ''; } catch (e) { return cauLoi(e); } };
  const choDk = async (dk: () => boolean, ms = 3000) => { const het = Date.now() + ms; while (!dk()) { if (Date.now() > het) return false; await new Promise(r => setTimeout(r, 5)); } return true; };
  const tuyHC = { choMs: 1500, choHangRaoMs: 1500, nghiBaoCaoMs: 1 };
  let soDd = 0;
  const ddMoi = () => { soDd++; return { cauHinh: path.join(tam, `appdata-i${soDd}`), duLieu: path.join(tam, `tai-lieu-i${soDd}`) }; };
  // Giờ trên cân giả lúc mở: 16:54:12 ngày 25/09/2026 = 09:54:12 UTC — giờ VN đúng giờ cân (lệch 0).
  const VN_CAN_GIA = Date.UTC(2026, 8, 25, 9, 54, 12);
  const PLU_I = [plu(1, '10001', '845,0', 'Loi vai bo My'), plu(2, '10002', '876,0', 'Suon bo Han Quoc')];
  const TMS_I = ['TMS\t0\t28\t', 'TMS\t202\t3\t', 'TMS\t203\t3\t', 'TMS\t58\t1\t'];
  const fileI = (tms = TMS_I) => new TextEncoder().encode(['ECS\tVER\tV3.14E8\t', '', 'DWL\tPLU\t', ...PLU_I, 'END\tPLU\t', '',
    'DWL\tLAB\t', ...MAU_TEM, 'END\tLAB\t', '', 'DWL\tTMS\t', ...tms, 'END\tTMS\t', '', 'END\tECS\t', ''].join('\r\n'));
  const repI = (fid: number, gio: number) => `REP\t26\t9\t25\t${gio}\t0\t0\t${fid}\t${fid}\t0\t`;
  const resI = (so: number, sl: string, tien: string, donGia: string) =>
    `RES\t1\t${tien}\t${so}\t9\t9\t0,3\t${sl}\t3\t0\t0,3\t\t\t\t\t${donGia}\t0\tHang thu ${so}\t`;
  const cnI = { id: 'cn1', ma: 'q1', ten: 'Chi nhánh thử' };
  const NV_QUAY_I: NguoiDung = { email: 'nv@b', hoTen: 'NV', vaiTro: 'nhan_vien_quay', chiNhanh: cnI, cacChiNhanh: [cnI], quyen: quyenCuaVai('nhan_vien_quay') };
  type PhuI = ConstructorParameters<typeof UngDung>[1];
  /** Chương trình + cân giả hai chiều; đồng hồ của chương trình chỉnh được (dat), giờ mạng = đồng hồ đó (máy tính đúng giờ). */
  const moI = async (them: Partial<NonNullable<PhuI>> = {}, diaChiCan?: string) => {
    const can = await moCanGia({ du: { phan: { PLU: PLU_I.map(chuoiByte), TMS: TMS_I }, baoCao: [] }, ...(diaChiCan ? { diaChi: diaChiCan } : {}) });
    let ms = VN_CAN_GIA;
    const u = new UngDung(ddMoi(), { danhMuc: async () => ({ mauMaVach: '2XCCCCCWWWWWK', matHang: [] }), mang: [], mac: async () => null,
      tuyHaiChieu: tuyHC, choXacNhanMs: [0], bayGio: () => ms, gioMang: async () => ms, nhatKyMs: { cho: 5, khoang: 0 }, ...them });
    u.luuCauHinh({ ipCan: diaChiCan ?? '127.0.0.1', congCan, congHaiChieu: can.cong });
    u.ghiNhanFileTuCan(fileI());
    return { can, u, dat: (m: number) => { ms = m; } };
  };
  const demYc = (can: { yeuCau: string[] }, tu: number, y: string) => can.yeuCau.slice(tu).filter(x => x === y).length;
  const khoiTim = (can: { khoi: { ten: string }[] }) => can.khoi.filter(k => k.ten === 'TIM').length;

  console.log('6i1 · Giờ Việt Nam: lệch giờ cân, giờ đặt cho cân');
  {
    ok('lechGiayVn: giờ cân 16:54:12 ngày 25/09 đúng bằng 09:54:12 UTC → 0; chậm 3 phút → -180',
      lechGiayVn({ nam: 2026, thang: 9, ngay: 25, gio: 16, phut: 54, giay: 12 }, VN_CAN_GIA) === 0
      && lechGiayVn({ nam: 2026, thang: 9, ngay: 25, gio: 16, phut: 51, giay: 12 }, VN_CAN_GIA) === -180);
    const g = gioVnLuc(Date.UTC(2026, 9, 4, 17, 10, 0));
    ok('gioVnLuc: 17:10 UTC ngày 04/10 là 00:10 ngày 05/10 giờ VN (ngày UTC còn là hôm trước)', g.nam === 2026 && g.thang === 10 && g.ngay === 5
      && g.gio === 0 && g.phut === 10 && g.giay === 0, JSON.stringify(g));
  }

  console.log('6i2 · Nhịp 30 giây: một kết nối giữ mở, nối lại khi cân khởi động lại, đèn đỏ khi không nối được, tắt được');
  {
    let soThu = 0;
    const { can, u } = await moI({ thu: async () => { soThu++; return false; } });
    await u.nhipCan();
    const n1 = u.trangThaiNen();
    ok('Nhịp đầu: mở MỘT kết nối, bắt tay, đọc giờ cân (lệch giờ VN 0 giây), không ghi gì; trạng thái: đang nối, có lần nghe',
      n1.giu.bat && n1.giu.dangMo && !!n1.giu.lucNghe && n1.loi === null && n1.gio?.lechGiay === 0 && can.ketNoi.length === 1
      && can.khoi.length === 0 && n1.tuBao58 === true, JSON.stringify(n1));
    const soYc = can.yeuCau.length;
    await u.nhipCan();
    ok('Nhịp sau: dùng lại đúng kết nối đó (không bắt tay lại), hỏi giờ', can.ketNoi.length === 1 && can.soDangMo() === 1
      && demYc(can, soYc, 'UPL\tTIM\t') >= 1 && demYc(can, soYc, 'UPL\tMAC\t') === 0, JSON.stringify(can.yeuCau.slice(soYc)));
    await u.gioCan();
    await u.docTuCanQuaWifi();
    ok('Việc của người dùng (Đọc giờ cân, Đọc dữ liệu từ cân) đi trên kết nối đang giữ — không mở kết nối thứ hai',
      can.ketNoi.length === 1 && can.soDangMo() === 1);
    await u.chanDoanWifi({});
    ok('Chẩn đoán WiFi bắt tay lại trên kết nối mới, đóng kết nối cũ — vẫn chỉ một kết nối mở',
      can.ketNoi.length === 2 && await can.choNhan(() => can.soDangMo() === 1, 4000), `${can.ketNoi.length} / ${can.soDangMo()}`);
    can.ngatKetNoi();
    await can.choNhan(() => can.soDangMo() === 0);
    const soMo = u.trangThaiNen().giu.soLanMo;
    await u.nhipCan();
    const n2 = u.trangThaiNen();
    ok('Cân khởi động lại (cắt kết nối) → nhịp sau nối lại, bắt tay lại, hết lỗi', n2.giu.soLanMo === soMo + 1 && n2.giu.dangMo && n2.loi === null
      && can.soDangMo() === 1, JSON.stringify(n2.giu));
    u.luuCauHinh({ congHaiChieu: congDong });
    const soN = nhan.length;
    await u.nhipCan();
    const n3 = u.trangThaiNen();
    ok('Cổng hai chiều không mở → nhịp ghi lỗi "Không kết nối được" (đèn đỏ), không gửi gì qua 33571, không dò WiFi',
      /Không kết nối được/.test(n3.loi?.cau ?? '') && !n3.giu.dangMo && nhan.length === soN && soThu === 0, JSON.stringify(n3.loi));
    await u.docNhatKyNen('bao');
    ok('HỒI QUY: tự đọc nhật ký (chạy nền) lúc không nối được cân → ghi lỗi vào trạng thái, KHÔNG dò WiFi (chỉ nút bấm mới dò)',
      soThu === 0 && /Không kết nối được/.test(u.trangThaiNen().nhatKy?.loi ?? ''), `${soThu} lần dò · ${u.trangThaiNen().nhatKy?.loi}`);
    u.luuCauHinh({ congHaiChieu: can.cong });
    await u.nhipCan();
    ok('Cổng mở lại → nhịp sau nối được, hết lỗi', u.trangThaiNen().loi === null && u.trangThaiNen().giu.dangMo);
    u.luuCauHinh({ giuKetNoi: false });
    const tatNgay = await can.choNhan(() => can.soDangMo() === 0, 4000);   // đóng: FIN, cân không đóng theo thì 2 giây sau huỷ hẳn
    const soKn = can.ketNoi.length;
    await u.nhipCan();
    await u.gioCan();
    ok('Tắt giữ kết nối → đóng kết nối ngay; nhịp không nối cân; việc người dùng mở rồi đóng kết nối như 2.7',
      tatNgay && !u.trangThaiNen().giu.bat && can.ketNoi.length === soKn + 1 && await can.choNhan(() => can.soDangMo() === 0, 4000),
      JSON.stringify([tatNgay, u.trangThaiNen().giu.bat, can.ketNoi.length - soKn, can.soDangMo()]));
    u.dongNen();
    await can.dong();
  }

  console.log('6i3 · Nghe cân báo in tem (ASK REP) → tự đọc nhật ký; nối lại → đọc bù; quyền xem không đổi');
  {
    const { can, u } = await moI();
    can.du.baoCao = [repI(1, 10), resI(1, '215,3', '181675,3', '845000,3'), 'REE\t'];
    await u.nhipCan();
    const coBu = await choDk(() => u.trangThaiNen().nhatKy !== null);
    const nk0 = u.trangThaiNen().nhatKy;
    ok('Vừa nối được cân → tự đọc nhật ký bù (những tem in lúc chương trình tắt): 1 dòng mới, lý do "vừa nối được"', coBu && nk0?.lyDo === 'noi'
      && nk0.soMoi === 1 && nk0.loi === null && fs.existsSync(u.fileNhatKy), JSON.stringify(nk0));
    can.du.baoCao.push(repI(2, 11), resI(2, '300,3', '262800,3', '876000,3'), 'REE\t');
    const soYc = can.yeuCau.length;
    const soDay = can.day('ASK\tREP\t2\t') + can.day('ASK\tREP\t2\t') + can.day('ASK\tREP\t2\t');
    const coBao = await choDk(() => u.trangThaiNen().nhatKy?.lyDo === 'bao');
    await new Promise(r => setTimeout(r, 60));
    const nk1 = u.trangThaiNen().nhatKy;
    ok('Cân báo in tem 3 lần liền (ASK REP trên kết nối giữ mở) → đọc nhật ký MỘT lượt từ giao dịch cuối đã lưu, thêm đúng 1 dòng; ghi lúc cân báo',
      soDay === 3 && coBao && nk1?.soMoi === 1 && !!u.trangThaiNen().lucCanBao && demYc(can, soYc, 'UPL\tPLU\t') === 1
      && can.yeuCau.slice(soYc).includes('UPL\tREP\t-1\t') && can.khoi.length === 0, JSON.stringify([nk1, can.yeuCau.slice(soYc)]));
    const nkLuu = await u.nhatKyCan({ nguon: 'luu' });
    ok('Hai dòng nằm trong nhat-ky-can.tsv, xem được ở thẻ Nhật ký cân', nkLuu.tongDaLuu === 2, String(nkLuu.tongDaLuu));
    const soYc2 = can.yeuCau.length;
    can.day('ASK\tPLU\t1\t10001\t\t');
    await new Promise(r => setTimeout(r, 80));
    ok('Cân hỏi một hàng (ASK PLU, thông số 58 +2) → không đọc gì', demYc(can, soYc2, 'UPL\tPLU\t') === 0 && demYc(can, soYc2, 'UPL\tTMS\t') === 0);
    can.hong = { loai: 'bao-cao-khac' };
    can.day('ASK\tREP\t3\t');
    const coLoi = await choDk(() => !!u.trangThaiNen().nhatKy?.loi, 5000);
    can.hong = null;
    ok('Đọc nhật ký hỏng (hai lần đọc liền không khớp) → ghi lỗi vào trạng thái, không ném, chương trình chạy tiếp',
      coLoi && /không khớp/.test(u.trangThaiNen().nhatKy?.loi ?? ''), JSON.stringify(u.trangThaiNen().nhatKy));
    await u.nhipCan();
    ok('Sau lần đọc hỏng: nhịp sau nối lại được (kết nối hỏng đã bỏ)', u.trangThaiNen().loi === null && u.trangThaiNen().giu.dangMo);
    u.dongNen();
    await can.dong();
  }
  {
    // NV quầy đăng nhập: nhật ký vẫn tự đọc về máy (chỉ đọc cân, lưu trên máy này), nhưng NV quầy không xem được.
    const { can, u } = await moI({ nguoi: NV_QUAY_I });
    can.du.baoCao = [repI(1, 10), resI(1, '215,3', '181675,3', '845000,3'), 'REE\t'];
    await u.nhipCan();
    await choDk(() => u.trangThaiNen().nhatKy !== null);
    ok('NV quầy đăng nhập: nhật ký vẫn tự đọc về máy; NV quầy xem / đọc nhật ký → "chỉ dành cho quản lý hoặc chủ"',
      u.trangThaiNen().nhatKy?.soMoi === 1 && /quản lý hoặc chủ/.test(await loiCua(() => u.nhatKyCan({ nguon: 'luu' }))));
    u.dongNen();
    await can.dong();
  }

  console.log('6i4 · Tự chỉnh giờ cân mỗi ngày (giờ VN): khi lệch quá 30 giây, giờ máy tính phải khớp giờ mạng, tối đa 3 lần / ngày');
  {
    const { can, u, dat } = await moI();
    const SANG = Date.UTC(2026, 9, 4, 0, 0, 0);   // 07:00 sáng 04/10/2026 giờ VN
    dat(SANG);
    await u.nhipCan();
    const td1 = u.docTuDatGio();
    const g1 = can.du.gio;
    ok('Sáng 04/10, cân còn ở 25/09 → tự chỉnh theo giờ VN: cân nhận 07:00:00 ngày 04/10/2026, đọc lại khớp; ghi lần chỉnh của ngày 04/10',
      g1.nam === 2026 && g1.thang === 10 && g1.ngay === 4 && g1.gio === 7 && g1.phut === 0 && td1?.ngay === '2026-10-04' && td1.lan.length === 1
      && td1.lan[0].ok && td1.lan[0].daGui && td1.lan[0].lechTruoc < 0 && /Đã tự chỉnh giờ cân theo giờ Việt Nam/.test(td1.lan[0].cau)
      && u.trangThaiNen().gio?.lechGiay === 0 && khoiTim(can) === 1, JSON.stringify([g1, td1]));
    dat(SANG + 30_000);
    await u.nhipCan();
    ok('Nhịp sau: giờ cân lệch 30 giây (không quá ngưỡng) → không chỉnh', khoiTim(can) === 1 && u.docTuDatGio()?.lan.length === 1);
    const MAT_DIEN = { nam: 2000, thang: 1, ngay: 1, gio: 0, phut: 0, giay: 0 };
    can.du.gio = { ...MAT_DIEN };
    dat(SANG + 5 * 60_000);
    await u.nhipCan();
    ok('Cân mất điện (về năm 2000) 5 phút sau lần chỉnh → chưa chỉnh lại (hai lần cách nhau ít nhất 10 phút)', khoiTim(can) === 1);
    dat(SANG + 11 * 60_000);
    await u.nhipCan();
    can.du.gio = { ...MAT_DIEN };
    dat(SANG + 22 * 60_000);
    await u.nhipCan();
    can.du.gio = { ...MAT_DIEN };
    dat(SANG + 33 * 60_000);
    await u.nhipCan();
    ok('Mỗi ngày tối đa 3 lần: lần 2, 3 chỉnh được; lần thứ 4 trong ngày không gửi', khoiTim(can) === 3 && u.docTuDatGio()?.lan.length === 3
      && can.du.gio.nam === 2000, JSON.stringify(u.docTuDatGio()));
    dat(Date.UTC(2026, 9, 4, 16, 50, 0));   // 23:50 giờ VN ngày 04/10
    await u.nhipCan();
    ok('23:50 giờ VN vẫn là ngày 04/10 (đã đủ 3 lần) → không chỉnh', khoiTim(can) === 3 && u.docTuDatGio()?.ngay === '2026-10-04');
    dat(Date.UTC(2026, 9, 4, 17, 10, 0));   // 00:10 giờ VN ngày 05/10 — ngày UTC vẫn là 04/10
    await u.nhipCan();
    const g2 = can.du.gio, td2 = u.docTuDatGio();
    ok('00:10 giờ VN là ngày mới 05/10 → chỉnh; giờ đặt cho cân là 00:10 ngày 05/10 (không phải ngày UTC 04/10)', khoiTim(can) === 4
      && g2.ngay === 5 && g2.thang === 10 && g2.gio === 0 && g2.phut === 10 && td2?.ngay === '2026-10-05' && td2.lan.length === 1, JSON.stringify([g2, td2]));
    u.luuCauHinh({ tuDatGio: false });
    can.du.gio = { ...MAT_DIEN };
    dat(Date.UTC(2026, 9, 5, 3, 0, 0));
    await u.nhipCan();
    ok('Tắt tự chỉnh giờ ở Cài đặt → lệch bao nhiêu cũng không gửi; vẫn hiện giờ cân lệch', khoiTim(can) === 4
      && (u.trangThaiNen().gio?.lechGiay ?? 0) < -1000 && !u.trangThaiNen().tuDatGio.bat);
    u.dongNen();
    await can.dong();
  }
  {
    // Giờ máy tính nhanh hơn giờ mạng 10 phút; rồi mất mạng: không chỉnh theo máy tính.
    let mang: number | null = 0;
    const { can, u, dat } = await moI({ gioMang: async () => mang });
    const SANG = Date.UTC(2026, 9, 4, 0, 0, 0);
    dat(SANG);
    mang = SANG - 10 * 60_000;
    await u.nhipCan();
    const l1 = u.docTuDatGio()?.lan[0];
    ok('Giờ máy tính nhanh hơn giờ mạng 10 phút → không gửi giờ xuống cân; ghi lý do, chỉ cách chỉnh giờ máy tính',
      khoiTim(can) === 0 && l1?.daGui === false && !l1.ok && /giờ máy tính nhanh 10 phút/.test(l1.cau) && /Đặt giờ tự động/.test(l1.cau), JSON.stringify(l1));
    mang = null;
    dat(SANG + 11 * 60_000);
    await u.nhipCan();
    const l2 = u.docTuDatGio()?.lan[1];
    ok('Không lấy được giờ mạng (mất mạng) → không gửi; ghi lý do', khoiTim(can) === 0 && l2?.daGui === false && /không lấy được giờ mạng/.test(l2.cau),
      JSON.stringify(l2));
    dat(SANG + 22 * 60_000);
    await u.nhipCan();
    mang = SANG + 33 * 60_000;
    dat(SANG + 33 * 60_000);
    await u.nhipCan();
    const td = u.docTuDatGio();
    ok('HỒI QUY: 3 lần chưa gửi (máy tính sai giờ, mất mạng) không tính vào giới hạn 3 lần / ngày → mạng có lại thì vẫn tự chỉnh',
      khoiTim(can) === 1 && td?.lan.length === 4 && td.lan[3].daGui && td.lan[3].ok, JSON.stringify(td));
    u.dongNen();
    await can.dong();
  }
  {
    // Cân nhận lệnh đặt giờ mà không đổi giờ.
    const { can, u, dat } = await moI({}, undefined);
    can.hong = { loai: 'bo-qua-gio' };
    dat(Date.UTC(2026, 9, 4, 0, 0, 0));
    await u.nhipCan();
    const l = u.docTuDatGio()?.lan[0];
    ok('Cân không nhận giờ mới (đọc lại vẫn giờ cũ) → ghi "chưa được", đã gửi; không gửi lại trong 10 phút', khoiTim(can) === 1 && l?.daGui === true
      && !l.ok && /cân chưa nhận giờ mới/.test(l.cau), JSON.stringify(l));
    await u.nhipCan();
    ok('… nhịp ngay sau không gửi lại', khoiTim(can) === 1);
    can.hong = null;
    u.dongNen();
    await can.dong();
  }

  console.log('6i5 · Nghe cân phát UDP: theo cân sang địa chỉ mới khi mã máy khớp; Tìm cân không cần dò cả WiFi');
  {
    // Cân (TCP + UDP) ở 127.0.0.2; chương trình nhớ 127.0.0.3 (không có gì nghe) — cân vừa đổi địa chỉ.
    const congUdp = await new Promise<number>((xong) => { const t = dgram.createSocket('udp4'); t.bind(0, '127.0.0.1', () => { const c = t.address().port; t.close(() => xong(c)); }); });
    const canUdp = dgram.createSocket('udp4');
    await new Promise<void>(r => canUdp.bind(0, '127.0.0.2', () => r()));
    let soHoi = 0;
    canUdp.on('message', (m, r) => { if (m.toString('latin1') === 'UDP\t\r\n') { soHoi++; canUdp.send(Buffer.from('UDP\t33581\t\t\r\n', 'latin1'), r.port, r.address); } });
    const phat = () => new Promise<void>(r => canUdp.send(Buffer.from('UDP\t33581\t\t\r\n', 'latin1'), congUdp, '127.0.0.1', () => r()));
    const udp = { congNghe: congUdp, diaChiNghe: '127.0.0.1', diaChiHoi: '127.0.0.2', congHoi: canUdp.address().port };
    const { can, u, dat } = await moI({ udp, choUdpMs: 200 }, '127.0.0.2');
    const datCauHinh = (them: Record<string, unknown>) => fs.writeFileSync(u.fileCauHinh, JSON.stringify({ ...u.cauHinh(), ...them }));
    u.luuCauHinh({ ipCan: '127.0.0.3', ngheUdp: true });
    datCauHinh({ macHaiChieu: '0023F01AECB1' });
    await u.capNhatUdp();
    await phat();
    const nghe = await choDk(() => u.trangThaiNen().udp.thay.some(c => c.ip === '127.0.0.2'));
    ok('Bật nghe UDP ở Cài đặt → nghe thấy cân tự phát ở 127.0.0.2 (trạng thái: đang nghe, địa chỉ, giờ)', nghe && u.trangThaiNen().udp.bat
      && u.trangThaiNen().udp.dangNghe && u.trangThaiNen().udp.loi === null, JSON.stringify(u.trangThaiNen().udp));
    await u.nhipCan();
    const ch = u.cauHinh();
    ok('Nhịp không nối được 127.0.0.3; nghe UDP thấy đúng một cân ở 127.0.0.2, mã máy qua cổng hai chiều khớp → tự dùng địa chỉ mới, ghi lần đổi, hết lỗi',
      ch.ipCan === '127.0.0.2' && ch.doiDiaChi?.[0]?.tu === '127.0.0.3' && ch.doiDiaChi?.[0]?.den === '127.0.0.2' && u.trangThaiNen().loi === null
      && u.trangThaiNen().giu.dangMo && can.khoi.length === 0, JSON.stringify([ch.ipCan, ch.doiDiaChi, u.trangThaiNen().loi]));
    // Mã máy khác (cân thứ hai trong quán): không theo.
    u.dongNen();
    await u.capNhatUdp();
    datCauHinh({ ipCan: '127.0.0.3', macHaiChieu: 'AABBCCDDEEFF', doiDiaChi: [] });
    await phat();
    await choDk(() => u.trangThaiNen().udp.thay.length > 0);
    await u.nhipCan();
    ok('Cân phát UDP nhưng mã máy khác mã đã nhớ → không đổi địa chỉ, không giữ kết nối tới cân đó, đèn đỏ',
      u.cauHinh().ipCan === '127.0.0.3' && !u.trangThaiNen().giu.dangMo && u.trangThaiNen().loi !== null && can.khoi.length === 0
      && await can.choNhan(() => can.soDangMo() === 0, 4000));
    datCauHinh({ macHaiChieu: undefined });
    dat(VN_CAN_GIA + 10 * 60_000);   // qua lúc lùi của nhịp vừa hỏng
    await phat();
    await u.nhipCan();
    ok('Chưa nhớ mã máy của cân → không theo UDP (không đoán)', u.cauHinh().ipCan === '127.0.0.3' && can.ketNoi.length > 0);
    // Nút Tìm cân: hỏi như hãng, cân trả lời → thấy cân, không dò cả WiFi bằng TCP.
    const { can: c2, u: u2 } = await moI({ udp: { ...udp, congNghe: 0 }, choUdpMs: 200, thu: async () => false }, '127.0.0.2');
    u2.luuCauHinh({ ipCan: '127.0.0.3', ngheUdp: true });
    await u2.capNhatUdp();
    const soHoiTruoc = soHoi;
    const kq = await u2.thuCan();
    ok('Nút Tìm cân khi nghe UDP: hỏi 5 gói như hãng, cân trả lời → thấy cân ở 127.0.0.2, đổi địa chỉ — không dò cả WiFi bằng TCP',
      soHoi - soHoiTruoc === 5 && kq.dai[0] === 'tín hiệu cân phát (UDP)' && kq.daThu === 0 && kq.doi?.den === '127.0.0.2' && u2.cauHinh().ipCan === '127.0.0.2',
      JSON.stringify(kq));
    u2.luuCauHinh({ ngheUdp: false });
    await u2.capNhatUdp();
    u2.luuCauHinh({ ipCan: '127.0.0.3' });
    const kq2 = await u2.thuCan();
    ok('Tắt nghe UDP → thôi nghe; Tìm cân dò WiFi bằng TCP như trước', !u2.trangThaiNen().udp.dangNghe && kq2.dai[0] !== 'tín hiệu cân phát (UDP)',
      JSON.stringify(kq2));
    u.dongNen(); u2.dongNen();
    canUdp.close();
    await can.dong(); await c2.dong();
  }

  console.log('6i7 · Sửa sau rà soát 2.8');
  {
    // Cân trả nhật ký không bao giờ khớp: tự đọc hỏng → bỏ kết nối → nhịp nối lại → hẹn đọc bù.
    const { can, u, dat } = await moI({ nhatKyMs: { cho: 5, khoang: 0, luiHong: 60_000 } });
    let t = VN_CAN_GIA;
    can.du.baoCao = [repI(1, 10), resI(1, '215,3', '181675,3', '845000,3'), 'REE\t'];
    can.hong = { loai: 'bao-cao-khac' };
    await u.nhipCan();
    const daHong = await choDk(() => !!u.trangThaiNen().nhatKy?.loi, 5000);
    const soRep = () => can.yeuCau.filter(y => y.startsWith('UPL\tREP\t')).length;
    const rep0 = soRep(), mo0 = u.trangThaiNen().giu.soLanMo;
    for (let i = 0; i < 3; i++) { t += 30_000; dat(t); await u.nhipCan(); await new Promise(r => setTimeout(r, 40)); }
    ok('HỒI QUY: tự đọc nhật ký hỏng → bỏ kết nối; nhịp nối lại nhưng KHÔNG đọc lại ngay (lùi) — không lặp đọc hỏng mỗi 30 giây',
      daHong && soRep() === rep0 && u.trangThaiNen().giu.soLanMo > mo0 && u.trangThaiNen().loi === null,
      `${soRep() - rep0} lần đọc thêm · mở ${mo0}→${u.trangThaiNen().giu.soLanMo} · ${JSON.stringify(u.trangThaiNen().loi)} · ${JSON.stringify(u.trangThaiNen().giu)}`);
    can.hong = null;
    u.dongNen();
    await can.dong();
  }
  {
    // Cân nhận TCP mà không trả lời: mỗi nhịp hỏng giữ hàng đợi việc tới hết hạn chờ — lùi dần.
    const { can, u, dat } = await moI({ tuyHaiChieu: { choMs: 300, choHangRaoMs: 300, nghiBaoCaoMs: 1 } });
    let t = VN_CAN_GIA;
    await u.nhipCan();
    await choDk(() => u.trangThaiNen().nhatKy !== null);   // lượt đọc bù lúc vừa nối xong rồi mới cho cân treo
    can.hong = { loai: 'im-lang' };
    const lan: number[] = [];
    for (let i = 0; i < 8; i++) { const n = can.ketNoi.length; t += 30_000; dat(t); await u.nhipCan(); lan.push(can.ketNoi.length - n); }
    ok('HỒI QUY: cân treo (nhận TCP, không trả lời) → nhịp lùi dần 30 giây, 1 phút, 2 phút… (không thử mỗi 30 giây)',
      lan.join() === '1,1,0,1,0,0,0,1', lan.join());
    can.hong = null;
    t += 1_000; dat(t);
    await u.gioCan();
    const n = can.ketNoi.length;
    t += 30_000; dat(t);
    const soYc = can.yeuCau.length;
    await u.nhipCan();
    ok('… cân trả lời lại (một việc của người dùng nói chuyện được) → hết lùi, nhịp sau chạy ngay', can.yeuCau.length > soYc && can.ketNoi.length === n
      && u.trangThaiNen().loi === null);
    u.dongNen();
    await can.dong();
  }
  {
    // Tìm cân qua UDP: gói cũ của địa chỉ cũ còn trong danh sách 60 giây.
    const congUdp = await new Promise<number>((xong) => { const x = dgram.createSocket('udp4'); x.bind(0, '127.0.0.1', () => { const c = x.address().port; x.close(() => xong(c)); }); });
    const moiCan = dgram.createSocket('udp4');
    await new Promise<void>(r => moiCan.bind(0, '127.0.0.2', () => r()));
    moiCan.on('message', (m, r) => { if (m.toString('latin1') === 'UDP\t\r\n') moiCan.send(Buffer.from('UDP\t33581\t\t\r\n', 'latin1'), r.port, r.address); });
    const cuCan = dgram.createSocket('udp4');
    await new Promise<void>(r => cuCan.bind(0, '127.0.0.3', () => r()));
    const { can, u } = await moI({ udp: { congNghe: congUdp, diaChiNghe: '127.0.0.1', diaChiHoi: '127.0.0.2', congHoi: moiCan.address().port },
      choUdpMs: 200, thu: async () => false }, '127.0.0.2');
    u.luuCauHinh({ ipCan: '127.0.0.3', ngheUdp: true });
    await u.capNhatUdp();
    await new Promise<void>(r => cuCan.send(Buffer.from('UDP\t33581\t\t\r\n', 'latin1'), congUdp, '127.0.0.1', () => r()));
    await choDk(() => u.trangThaiNen().udp.thay.some(c => c.ip === '127.0.0.3'));
    const kq = await u.thuCan();
    ok('HỒI QUY: cân vừa đổi 127.0.0.3 → 127.0.0.2, gói cũ của 127.0.0.3 còn trong 60 giây → Tìm cân chỉ tính máy trả lời lần hỏi này: theo cân sang 127.0.0.2',
      kq.thongCan && kq.doi?.den === '127.0.0.2' && u.cauHinh().ipCan === '127.0.0.2', JSON.stringify(kq));
    // UDP chỉ thấy một cân khác mã máy (cân của quầy bị chặn gói): dò WiFi bằng TCP như trước, không dừng ở "khác máy".
    const { can: c2, u: u2 } = await moI({ udp: { congNghe: 0, diaChiNghe: '127.0.0.1', diaChiHoi: '127.0.0.2', congHoi: moiCan.address().port },
      choUdpMs: 200, thu: async () => false, mac: async () => 'aa:aa:aa:aa:aa:aa' }, '127.0.0.2');
    u2.luuCauHinh({ ipCan: '127.0.0.3', ngheUdp: true });
    fs.writeFileSync(u2.fileCauHinh, JSON.stringify({ ...u2.cauHinh(), macCan: 'bb:bb:bb:bb:bb:bb' }));
    await u2.capNhatUdp();
    const kq2 = await u2.thuCan();
    ok('HỒI QUY: UDP chỉ thấy một cân khác mã máy → không dừng ở đó: dò WiFi bằng TCP như trước; không đổi địa chỉ',
      kq2.dai[0] !== 'tín hiệu cân phát (UDP)' && u2.cauHinh().ipCan === '127.0.0.3', JSON.stringify(kq2));
    u.dongNen(); u2.dongNen();
    moiCan.close(); cuCan.close();
    await can.dong(); await c2.dong();
  }
  {
    // Kiểm tra kết nối / Chẩn đoán bước 7 khi đang giữ kết nối hai chiều: không mở thêm kết nối tới cùng cân.
    let soThu = 0;
    const giu: { u: UngDung | null; moKhiGui: boolean | null } = { u: null, moKhiGui: null };
    const { can, u } = await moI({ thu: async () => { soThu++; return true; },
      gui: async (ip, cong, du) => { giu.moKhiGui = giu.u?.trangThaiNen().giu.dangMo ?? null; await guiTcp(ip, cong, du); } });
    giu.u = u;
    await u.nhipCan();
    const k = await u.thuCan();
    ok('HỒI QUY: Kiểm tra kết nối khi đang giữ kết nối hai chiều → hỏi trên kết nối đó, không thử cổng 33571 (không mở kết nối thứ hai)',
      k.thongCan && soThu === 0 && can.ketNoi.length === 1, `${soThu} · ${can.ketNoi.length}`);
    await u.chanDoanWifi({ ghiThu: true });
    ok('HỒI QUY: Chẩn đoán bước 7 (file nhỏ qua 33571) đóng kết nối đang giữ trước khi gửi', giu.moKhiGui === false, String(giu.moKhiGui));
    u.dongNen();
    await can.dong();
  }
  {
    // Lưu cài đặt lúc một việc đang chờ cân trả lời trên kết nối đang giữ.
    const { can, u } = await moI();
    await u.nhipCan();
    can.hong = { loai: 'hang-rao-cham', ms: 300 };
    const viec = loiCua(() => u.gioCan());
    await new Promise(r => setTimeout(r, 60));
    u.luuCauHinh({ giuKetNoi: false });
    const loi = await viec;
    can.hong = null;
    ok('HỒI QUY: lưu cài đặt (tắt giữ kết nối) lúc "Đọc giờ cân" đang chờ cân → việc đó vẫn xong; kết nối đóng sau đó',
      loi === '' && await can.choNhan(() => can.soDangMo() === 0, 4000), loi);
    u.dongNen();
    await can.dong();
  }
  {
    // Mỗi nhịp một lần hỏi giờ; việc ngay sau một lần nói chuyện được không hỏi trước.
    const { can, u, dat } = await moI();
    await u.nhipCan();
    dat(VN_CAN_GIA + 30_000);
    const soYc = can.yeuCau.length;
    await u.nhipCan();
    ok('HỒI QUY: nhịp dùng lại kết nối → đúng MỘT lần hỏi giờ (UPL TIM) mỗi nhịp (giờ của lần hỏi trước khi dùng lại)',
      demYc(can, soYc, 'UPL\tTIM\t') === 1, JSON.stringify(can.yeuCau.slice(soYc)));
    ok('Thông số 58: file gốc bật → true; ghi nhận file không có dòng 58 → không biết (null), đọc lại theo file mới',
      u.trangThaiNen().tuBao58 === true && (u.ghiNhanFileTuCan(fileI(TMS_I.filter(d => !d.startsWith('TMS\t58\t')))), u.trangThaiNen().tuBao58 === null));
    u.dongNen();
    await can.dong();
  }

  console.log('6i6 · Trang, máy chủ, main.ts, hướng dẫn');
  {
    const gd = fs.readFileSync(path.join(import.meta.dir, '..', 'src', 'giao-dien.html'), 'utf8');
    const hd = fs.readFileSync(path.join(import.meta.dir, '..', 'src', 'huong-dan.html'), 'utf8');
    const mc = fs.readFileSync(path.join(import.meta.dir, '..', 'src', 'may-chu.ts'), 'utf8');
    const mn = fs.readFileSync(path.join(import.meta.dir, '..', 'src', 'main.ts'), 'utf8');
    const nv = fs.readFileSync(path.join(import.meta.dir, '..', 'src', 'nghiep-vu.ts'), 'utf8');
    const ve = /function veKetNoi\(n\) \{([\s\S]*?)\n {2}\}/.exec(gd)?.[1] ?? '';
    ok('Trang: ba công tắc ở Cài đặt (giữ kết nối, tự chỉnh giờ, nghe UDP) — đọc và lưu đúng mặc định (giữ, tự chỉnh: bật; UDP: tắt)',
      gd.includes('name="giuKetNoi"') && gd.includes('name="tuDatGio"') && gd.includes('name="ngheUdp"') && gd.includes('f.giuKetNoi.checked = ch.giuKetNoi !== false')
      && gd.includes('f.tuDatGio.checked = ch.tuDatGio !== false') && gd.includes('f.ngheUdp.checked = ch.ngheUdp === true')
      && /giuKetNoi: f\.giuKetNoi\.checked, tuDatGio: f\.tuDatGio\.checked, ngheUdp: f\.ngheUdp\.checked/.test(gd));
    ok('Trang: ô Cân hiện kết nối / nhật ký / giờ / UDP; mọi câu từ chương trình (lỗi, câu chỉnh giờ, địa chỉ) qua e(); làm mới mỗi 15 giây',
      gd.includes('id="o-ket-noi"') && /e\(n\.loi\.cau\)/.test(ve) && /e\(n\.nhatKy\.loi\)/.test(ve) && /e\(cuoi\.cau\)/.test(ve) && /e\(n\.udp\.loi\)/.test(ve)
      && /e\(c\.ip\)/.test(ve) && /trangThai\.nen = s\.nen; veOCan\(\);[\s\S]{0,80}\}, 15000\);/.test(gd), ve.slice(0, 120));
    ok('Máy chủ: /api/can và /api/trang-thai trả trạng thái nền; /api/cau-hinh chỉ nhận true / false cho ba công tắc',
      mc.includes("nen: ud.trangThaiNen()") && /case '\/api\/can': return json\(\{[^\n]*nen: ud\.trangThaiNen\(\)/.test(mc)
      && mc.includes("giuKetNoi: typeof b.giuKetNoi === 'boolean' ? b.giuKetNoi : undefined") && mc.includes("ngheUdp: typeof b.ngheUdp === 'boolean' ? b.ngheUdp : undefined"));
    ok('main.ts: nhịp mỗi NHIP_CAN_MS (dừng khi đang cập nhật), bật UDP theo cài đặt lúc mở; phiên bản 2.8.0',
      /setInterval\(\(\) => \{ if \(!dangCapNhat\(\)\) void ud\.nhipCan\(\); \}, NHIP_CAN_MS\)/.test(mn) && mn.includes('void ud.capNhatUdp();')
      && mn.includes("const PHIEN_BAN = '2.8.0';"));
    ok('Cập nhật: đổi file xong thì đóng kết nối đang giữ trước khi bản mới mở (cân có thể chỉ nhận một kết nối)',
      /this\.dangKhoiDongLai = true;[\s\S]{0,200}this\.dongNen\(\);/.test(nv));
    ok('Hướng dẫn: giữ kết nối, tự đọc nhật ký khi cân báo, tự chỉnh giờ, nghe UDP và hộp hỏi tường lửa',
      hd.includes('Giữ kết nối với cân') && hd.includes('Tự chỉnh giờ cân') && hd.includes('tường lửa') && hd.includes('thông số 58'));
  }
}

// =============================================================================
console.log('6e · Kiểm thử từng module của bản 2.2');
await thuGiaoThuc(ok);
await thuTem(ok);
await thuBaoCaoCan(ok);
await thuThongSo(ok);
await thuCapNhat(ok);
await thuGiuKetNoi(ok);

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
ok('Phiên bản 2.8.0', (tt as unknown as { phienBan: string }).phienBan === '2.8.0');
{
  // 2.8: chương trình thật có nhịp giữ kết nối; cân 192.168.1.22 không có ở đây → trạng thái nền có, chưa nối được, không lỗi chết.
  const n = (tt as unknown as { nen?: { giu?: { bat?: boolean; dangMo?: boolean }; udp?: { bat?: boolean } } }).nen;
  ok('2.8: /api/trang-thai có trạng thái nền: giữ kết nối bật (mặc định), chưa nối cân, nghe UDP tắt (mặc định)',
    !!n && n.giu?.bat === true && n.giu.dangMo === false && n.udp?.bat === false, JSON.stringify(n));
}
{
  // 2.5: dang-chay.json ghi phiên bản (lúc cập nhật, bản cũ chờ bản mới ghi phiên bản của nó). Chạy bằng bun (không phải
  // BeeftownCan.exe) → không cập nhật được, và KHÔNG hỏi mạng (không bao giờ gọi github.com trong kiểm thử).
  const dangChay = JSON.parse(fs.readFileSync(path.join(tam2, 'appdata', 'BeeftownCan', 'dang-chay.json'), 'utf8')) as { phienBan?: string };
  const bm = await (await api('/api/ban-moi', JSON.stringify({ hoiLai: true }))).json() as { ok: boolean; coTheCapNhat: boolean; cau: string };
  const cnApi = await (await api('/api/cap-nhat')).json() as { ok: boolean; loi?: string };
  const ttCn = (tt as unknown as { capNhat?: { coTheCapNhat: boolean; vuaCapNhatTu: string | null } }).capNhat;
  ok('2.5: dang-chay.json có phiên bản; chạy bằng bun → không cập nhật được, không hỏi mạng; /api/cap-nhat từ chối',
    dangChay.phienBan === '2.8.0' && bm.ok && !bm.coTheCapNhat && /Chỉ cập nhật được bản BeeftownCan\.exe/.test(bm.cau)
    && !cnApi.ok && /Chỉ cập nhật được/.test(cnApi.loi ?? '') && ttCn?.coTheCapNhat === false && ttCn.vuaCapNhatTu === null,
    JSON.stringify([dangChay, bm, cnApi, ttCn]));
}
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
