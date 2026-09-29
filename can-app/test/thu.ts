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
    try { await ud4.guiTem({ chu: { 23: 'Hạn dùng' } }); } catch (e) { loi4 = (e as Error).message; }
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
    await Promise.all([ud8.guiXuongCan(), ud8.tuGuiMotLan(), ud8.guiTem({ chu: { 23: 'Hạn dùng' } })]);
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
const qApi = await (await api('/api/quay')).json() as { ok: boolean; loi?: string };
ok('API quầy khi chưa đăng nhập kho → báo đăng nhập (không sập)', !qApi.ok && /[Đđ]ăng nhập|kết nối|mạng|mở được/i.test(qApi.loi ?? ''), JSON.stringify(qApi));
const tc = await (await api('/api/thu-can')).json() as { thongCan: boolean };
ok('Nút kiểm tra kết nối cân', tc.thongCan === true);
const dong = await (await api('/api/dong')).json() as { ok: boolean };
ok('Đóng cửa sổ → chương trình tự tắt', dong.ok && await Promise.race([p.exited.then(() => true), Bun.sleep(8000).then(() => false)]));

mayCan.close();
fs.rmSync(tam, { recursive: true, force: true });
fs.rmSync(tam2, { recursive: true, force: true });
console.log(hong === 0 ? `\nTẤT CẢ ${dat} KIỂM TRA BEEFTOWN CÂN ĐỀU ĐẠT` : `\n${hong} KIỂM TRA HỎNG / ${dat + hong}`);
process.exit(hong === 0 ? 0 : 1);
