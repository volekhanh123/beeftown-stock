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
import { UngDung, guiTcp, thuKetNoi, type DanhMucKho } from '../src/nghiep-vu.ts';
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
function fileCan(dong: string[]): Uint8Array {
  const L = ['ECS\tVER\tV3.14E8\t', '', 'DWL\tPLU\t', ...dong, 'END\tPLU\t', '',
    'DWL\tLAB\t', 'LAB\t28\tBEEFTOWN\t1\t58\t40\t', 'END\tLAB\t', '',
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
const tc = await (await api('/api/thu-can')).json() as { thongCan: boolean };
ok('Nút kiểm tra kết nối cân', tc.thongCan === true);
const dong = await (await api('/api/dong')).json() as { ok: boolean };
ok('Đóng cửa sổ → chương trình tự tắt', dong.ok && await Promise.race([p.exited.then(() => true), Bun.sleep(8000).then(() => false)]));

mayCan.close();
fs.rmSync(tam, { recursive: true, force: true });
fs.rmSync(tam2, { recursive: true, force: true });
console.log(hong === 0 ? `\nTẤT CẢ ${dat} KIỂM TRA BEEFTOWN CÂN ĐỀU ĐẠT` : `\n${hong} KIỂM TRA HỎNG / ${dat + hong}`);
process.exit(hong === 0 ? 0 : 1);
