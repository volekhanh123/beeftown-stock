/**
 * Kiểm thử Beeftown Cân — không cần cân thật, không cần kho thật:
 *
 *     cd can-app && npx bun test/thu.ts
 *
 * Cân giả: một máy chủ TCP cục bộ ghi lại mọi byte nhận được, và làm đúng
 * như cân thật đã thử (26/09/2026): chỉ THÊM / SỬA dòng PLU, không xoá.
 * Kho giả: danh mục cho sẵn, đưa qua tuỳ chọn `danhMuc` của UngDung.
 * Phần cuối chạy src/main.ts thật và gọi máy chủ của nó.
 */
import * as fs from 'node:fs';
import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import { LoiCan, UngDung, guiTcp, thuKetNoi, type DanhMucKho } from '../src/nghiep-vu.ts';
import { docFileCan } from '../../web/src/lib/kho/can-tma.ts';
import type { HangKho } from '../../web/src/lib/kho/can-tma.ts';

let dat = 0, hong = 0;
const ok = (ten: string, dieuKien: boolean, chiTiet = '') => {
  if (dieuKien) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten} ${chiTiet}`); }
};

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
try { await ud.guiTem({}); } catch (e) { loiTem = (e as Error).message; }
ok('Chưa đổi gì mà bấm gửi → báo', /chưa có gì thay đổi/.test(loiTem), loiTem);
try { await ud.guiTem({ tat: ['o:99'] }); loiTem = ''; } catch (e) { loiTem = (e as Error).message; }
ok('Ô không có → báo mở lại thẻ Tem', /Mở lại thẻ Tem/.test(loiTem), loiTem);
try { await ud.guiTem({ chu: { 23: 'x'.repeat(41) } }); loiTem = ''; } catch (e) { loiTem = (e as Error).message; }
ok('Chữ quá 40 ký tự → báo', /dài quá 40/.test(loiTem), loiTem);
try { await ud.guiTem({ chu: { 11: 'lạ' } }); loiTem = ''; } catch (e) { loiTem = (e as Error).message; }
ok('Cột chữ không có trên tem → báo', /không có trên tem/.test(loiTem), loiTem);
const soGuiTruocTem = nhan.length;
await ud.guiTem({ chu: { 23: 'Hạn dùng' }, tat: [khoaVach] });
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
await ud.guiTem({ bat: ['t:0'], chu: { 23: 'HSD' } });
const fTem2 = docFileCan(new Uint8Array(nhan[nhan.length - 1]));
ok('Bật lại mã vạch + trả chữ HSD: mẫu tem y như lúc đầu', fTem2.dong.slice(fTem2.dong.findIndex(d => d.startsWith('LAB\t')), fTem2.dong.indexOf('LAE\t') + 1).join('\n')
  === MAU_TEM.map(d => Buffer.from(d, 'utf8').toString('latin1')).join('\n'));
ok('Hết ô đã tắt', ud.tem().tem!.o.every(o => o.bat));
const soGuiTruocUsb = nhan.length;
const uTem = ud.taoFileUsbTem({ tat: [khoaVach] });
ok('Tem qua USB: lưu file, không gửi WiFi', fs.existsSync(uTem.duongDan) && nhan.length === soGuiTruocUsb && uTem.soHang === 2);
ok('Chưa nạp USB: thẻ Tem vẫn như cân đang có', ud.tem().tem!.o.every(o => o.bat));
ud.daNapUsb();
ok('Nạp USB xong: mã vạch thành ô đã tắt', ud.tem().tem!.o.filter(o => !o.bat).map(o => o.ten).join() === 'Mã vạch');
await ud.guiTem({ bat: ['t:0'] });
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
console.log('6 · Kết nối cân');
ok('Thử kết nối cân giả: thông', await ud.thuCan());
const congDong = await new Promise<number>((xong) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = (s.address() as net.AddressInfo).port; s.close(() => xong(p)); }); });
ok('Thử kết nối cổng đóng: không thông', !(await thuKetNoi('127.0.0.1', congDong)));
let loiGui = '';
try { await guiTcp('127.0.0.1', congDong, new Uint8Array([1, 2, 3])); } catch (e) { loiGui = (e as Error).message; }
ok('Gửi vào cổng đóng: câu lỗi chỉ cách xử lý', /Không kết nối được cân.*Prog → 4 → 2/.test(loiGui), loiGui);
let loiCauHinh = '';
try { ud.luuCauHinh({ ipCan: 'abc' }); } catch (e) { loiCauHinh = (e as Error).message; }
ok('Địa chỉ cân sai dạng bị từ chối', /192\.168/.test(loiCauHinh), loiCauHinh);

// =============================================================================
console.log('7 · Chạy src/main.ts thật');
const tam2 = fs.mkdtempSync(path.join(os.tmpdir(), 'beeftown-can-main-'));
const p = Bun.spawn([process.execPath, path.join(import.meta.dir, '..', 'src', 'main.ts'), '--khong-mo'], {
  env: { ...process.env, APPDATA: path.join(tam2, 'appdata'), HOME: tam2, USERPROFILE: tam2 }, stdout: 'pipe', stderr: 'pipe',
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
const tt = await (await api('/api/trang-thai')).json() as { ok: boolean; goc: unknown; cauHinh: { ipCan: string } };
ok('Trạng thái: chưa có file gốc, cân mặc định 192.168.1.22', tt.ok && tt.goc === null && tt.cauHinh.ipCan === '192.168.1.22', JSON.stringify(tt));
const ch = await (await api('/api/cau-hinh', JSON.stringify({ ipCan: '127.0.0.1', congCan: congCan }))).json() as { ok: boolean };
ok('Lưu cài đặt cân', ch.ok);
const fc = await (await api('/api/file-tu-can', Buffer.from(fileUsb), 'application/octet-stream')).json() as { ok: boolean; soHang: number };
ok('Tải file từ cân lên chương trình', fc.ok && fc.soHang === 3, JSON.stringify(fc));
const hApi = await (await api('/api/hang')).json() as { ok: boolean; hang: unknown[]; coKho: boolean };
ok('API tất cả hàng: 3 hàng, chưa đăng nhập kho', hApi.ok && hApi.hang.length === 3 && !hApi.coKho, JSON.stringify(hApi).slice(0, 200));
const tApi = await (await api('/api/tem')).json() as { ok: boolean; tem: { o: { khoa: string }[] } };
ok('API mẫu tem: 14 ô', tApi.ok && tApi.tem.o.length === 14);
const guiTemApi = await (await api('/api/tem/gui', JSON.stringify({ chu: { 23: 'Hạn dùng' }, tat: 'khong-phai-mang' }))).json() as { ok: boolean };
ok('API gửi tem qua cân giả', guiTemApi.ok, JSON.stringify(guiTemApi));
const tApi2 = await (await api('/api/tem')).json() as { tem: { chu: Record<string, string> } };
ok('API mẫu tem sau khi gửi: chữ mới', tApi2.tem.chu[23] === 'Hạn dùng');
const tc = await (await api('/api/thu-can')).json() as { thongCan: boolean };
ok('Nút kiểm tra kết nối cân', tc.thongCan === true);
const dong = await (await api('/api/dong')).json() as { ok: boolean };
ok('Đóng cửa sổ → chương trình tự tắt', dong.ok && await Promise.race([p.exited.then(() => true), Bun.sleep(8000).then(() => false)]));

mayCan.close();
fs.rmSync(tam, { recursive: true, force: true });
fs.rmSync(tam2, { recursive: true, force: true });
console.log(hong === 0 ? `\nTẤT CẢ ${dat} KIỂM TRA BEEFTOWN CÂN ĐỀU ĐẠT` : `\n${hong} KIỂM TRA HỎNG / ${dat + hong}`);
process.exit(hong === 0 ? 0 : 1);
