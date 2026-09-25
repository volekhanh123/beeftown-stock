/**
 * BEEFTOWN KHO — Kiểm thử đồng bộ danh mục sang cân in tem (A_000.TMS)
 * ======================================================================
 *
 *     node test/test-kho-can.mjs
 *
 * Kiểm web/src/lib/kho/can-tma.ts — không cần database. Node 22 nạp thẳng
 * file .ts, nên đây chính là mã chạy trên web.
 *
 * KHÔNG dùng file lưu từ cân thật: file đó có tên và mật khẩu WiFi của quán.
 * File giả dưới đây dựng đúng cấu trúc file thật (firmware V3.14E8): các phần
 * DWL…END, dòng PLU 69 cột, giá "mantissa,số-lẻ", Spec202 = 3 số lẻ — cùng một
 * byte không phải UTF-8 để thử nguyên tắc "dòng không đổi giữ nguyên từng byte".
 */

import { taoBoDem } from './kho-chung.mjs';
import {
  docFileCan, lapKeHoach, ghiFileCan, giaTuFile, giaVaoFile, maTimKiem, chuanMa,
  soChuSoMa, tenFileCan, sangBase64, tuBase64, LoiFileCan, GIA_TOI_DA,
} from '../../web/src/lib/kho/can-tma.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ ĐỒNG BỘ CÂN');

// Dòng hàng 69 cột như cân TM-A tự ghi — chép độc lập với can-tma.ts để hai
// bên kiểm chéo nhau.
const KHUON = 'PLU\t{1}\t{2}\t\t{4}\t{5}\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\t{15}\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\t{64}\t0\t0\t0\t';
const plu = (so, ma, cach, gia, ten, tim) => KHUON
  .replace('{1}', so).replace('{2}', ma).replace('{4}', cach).replace('{5}', gia).replace('{15}', ten).replace('{64}', tim);

// 6 món mẫu bên bán cài sẵn trên cân (y như file thật, trừ tên chủ cũ)
const HANG_MAU = [
  plu(1, '12301', '1', '60,0', 'Nạc Đùi', 'nci'),
  plu(2, '12302', '1', '45,0', 'cốc lếch làm sạch', 'cclchlmsch'),
  plu(3, '12303', '2', '22,0', 'Trứng gà hộp', 'trngghp'),
  plu(4, '12304', '1', '222,0', 'lồng bò sạch nguyên bộ', 'lngbschnguynb'),
  plu(5, '12305', '1', '1105,1', 'cá chép', 'cchp'),
  plu(6, '12306', '1', '100,0', 'THIT BO', ''),
];
// Cân sau khi nạp file Beeftown đầu tiên (25/09/2026)
const HANG_BEEFTOWN = [
  plu(1, '10001', '1', '845,0', 'Lõi vai bò Mỹ', 'loivaibomy'),
  plu(2, '10002', '1', '876,0', 'Sườn bò Hàn Quốc', 'suonbohanquoc'),
  plu(3, '10003', '1', '695,0', 'Gầu bò', 'gaubo'),
  plu(5, '10005', '1', '516,0', 'Ba chỉ bò cuộn', 'bachibocuon'),
];

/** Dựng file .TMS giả. Chuỗi "~LOI~" được thay bằng byte 0xFF (không phải UTF-8). */
function taoFile({ dongPlu, dau = 'ECS\tVER\tV3.14E8\t', mo = 'DWL', coGio = true, bom = false }) {
  const L = [dau, ''];
  const phan = (ten, dong) => L.push(`${mo}\t${ten}\t`, ...dong, `END\t${ten}\t`, '');
  phan('DPT', ['DPT\t9\tDefault\t']);
  phan('CLS', ['CLS\t9\tDefault\t9\t0\t0\t0\t0\t0\t0\t']);
  phan('PLU', dongPlu);
  phan('UNT', []);
  phan('BAR', ['BAR\t28\tQS-Item\t0\t0\t99999\t0\tB201F501J500A000A000A000\t']);
  phan('LAB', ['LAB\t28\tBEEFTOWN\t1\t58\t40\tĐơn giá\tTrọng Lượng\t\tThành Tiền\t\t\t\t\t\t\t\t\tBEEFTOWN\t\t\t\t1\tHSD\t',
    'LAS\t29\t3\t12\t0\t1\t0\t0\t1\t220\t255\t220\t50\t', 'LAE\t']);
  phan('SAL', []);
  phan('REP', ['REP\t26\t9\t25\t15\t16\t46\t29\t1\t0\t',
    'RES\t1\t16000,3\t6\t9\t9\t0,3\t16,2\t3\t0\t0,3\t\t\t\t\t100000,3\t0\tTHIT BO~LOI~\t', 'REE\t']);
  phan('SCP', ['SCP\t0\t1\t1\t', 'SCP\t0\t2\t2\t', 'SCP\t0\t3\t3\t']);
  phan('TMS', ['TMS\t0\t28\t', 'TMS\t1\t28\t', 'TMS\t2\t20\t', 'TMS\t202\t3\t', 'TMS\t203\t3\t']);
  phan('TMT', ['TMT\t0\tFactory\t', 'TMT\t3\tVND\t']);
  phan('INF', ['INF\tFactory\tFactory Device\t0\tTM-xA UA006 V3.14E8\t']);
  if (coGio) phan('TIM', ['TIM\t26\t9\t25\t16\t54\t12\t']);
  L.push('END\tECS\t', '');
  const u8 = new TextEncoder().encode(L.join('\r\n'));
  const vt = Buffer.from(u8).indexOf('~LOI~');
  const ra = Buffer.concat([
    bom ? Buffer.from([0xEF, 0xBB, 0xBF]) : Buffer.alloc(0),
    Buffer.from(u8.subarray(0, vt)), Buffer.from([0xFF]), Buffer.from(u8.subarray(vt + 5)),
  ]);
  return new Uint8Array(ra);
}

const giongHet = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0;
const TUY = { giuHangNgoaiKho: false, giuGioCan: true, soChuSoMa: 5 };
const hang = (ma, ma_can, ten, gia_ban_kg, dang_dung = true) => ({ ma, ma_can, ten, gia_ban_kg, dang_dung });

const DANH_MUC = [
  hang('LOI-VAI-BO-MY', '10001', 'Lõi vai bò Mỹ', 845000),
  hang('SUON-BO-HAN-QUOC', '10002', 'Sườn bò Hàn Quốc', 876000),
  hang('GAU-BO', '10003', 'Gầu bò', 695000),
  hang('BA-CHI-BO-CUON', '10005', 'Ba chỉ bò cuộn', 516000),
  hang('THAN-LUNG-BO-UC', '10004', 'Thăn lưng bò Úc', 1096667),   // quá 999.999 đ
  hang('MO-VUN', null, 'Mỡ vụn', null),                            // không bán ở cân
  hang('HANG-NGUNG', '10009', 'Hàng ngừng bán', 300000, false),     // ngừng dùng
  hang('MA-DAI', '123456', 'Mã sáu số', 500000),                    // mẫu 2+5+5+1 chỉ chứa 5 số
  hang('CHUA-GIA', '10006', 'Nạm bò', null),                        // chưa có giá
];

// ===========================================================================
await nhom('1 · GIÁ, MÃ, TÊN', async () => {
  ok('"845,0" với 3 số lẻ = 845.000 đ', giaTuFile('845,0', 3) === 845000);
  ok('"1105,1" với 3 số lẻ = 110.500 đ', giaTuFile('1105,1', 3) === 110500);
  ok('"60000,3" với 3 số lẻ = 60.000 đ', giaTuFile('60000,3', 3) === 60000);
  ok('Giá sai định dạng → null', giaTuFile('abc', 3) === null && giaTuFile(undefined, 3) === null);
  ok('845.000 đ ghi thành "845,0" như cân tự ghi', giaVaoFile(845000, 3) === '845,0');
  ok('109.667 đ ghi thành "109667,3"', giaVaoFile(109667, 3) === '109667,3');
  ok('0 đ ghi thành "0,0"', giaVaoFile(0, 3) === '0,0');
  ok('Đọc lại đúng giá vừa ghi', [1, 500, 845000, 999999, 110500].every(g => giaTuFile(giaVaoFile(g, 3), 3) === g));
  ok('Mã tìm kiếm "Sườn bò Hàn Quốc" = suonbohanquoc', maTimKiem('Sườn bò Hàn Quốc') === 'suonbohanquoc');
  ok('Mã tìm kiếm "Đùi gà" = duiga', maTimKiem('Đùi gà') === 'duiga');
  ok('Mã cân "012301" = "12301" (khớp ma_can lưu không số 0 đầu)', chuanMa('012301') === '12301');
  ok('Mã cân "0", rỗng, chữ → không có mã', chuanMa('0') === '' && chuanMa('') === '' && chuanMa('ab') === '' && chuanMa(null) === '');
  ok('Mẫu 2XCCCCCWWWWWK chứa 5 số mã hàng', soChuSoMa('2XCCCCCWWWWWK') === 5);
  ok('Mẫu 2CCCCCCWWWWWK chứa 6 số', soChuSoMa('2CCCCCCWWWWWK') === 6);
  ok('Chưa cài mẫu → 5 số', soChuSoMa(null) === 5 && soChuSoMa('') === 5);
  ok('Tên file "3b2b-A_001.tms" → A_001.TMS', tenFileCan('3b2b-A_001.tms') === 'A_001.TMS');
  ok('Tên file lạ → A_000.TMS', tenFileCan('du-lieu.TMS') === 'A_000.TMS' && tenFileCan(null) === 'A_000.TMS');
  ok('Giá tối đa 999.999 đ', GIA_TOI_DA === 999999);
});

// ===========================================================================
await nhom('2 · ĐỌC FILE CỦA CÂN', async () => {
  const f = docFileCan(taoFile({ dongPlu: HANG_MAU }));
  ok('Đọc phiên bản V3.14E8', f.phienBan === 'V3.14E8');
  ok('Giá 3 số lẻ (Spec202)', f.soLeGia === 3);
  ok('6 mặt hàng', f.plu.length === 6);
  ok('Giá đọc ra đồng', f.plu.map(p => p.gia).join() === '60000,45000,22000,222000,110500,100000', f.plu.map(p => p.gia).join());
  ok('Tên tiếng Việt đọc đúng', f.plu[0].ten === 'Nạc Đùi' && f.plu[3].ten === 'lồng bò sạch nguyên bộ');
  ok('Cách bán: trứng theo gói (2)', f.plu[2].cachBan === '2');

  const loi = (u8, cau) => { try { docFileCan(u8); return false; } catch (e) { return e instanceof LoiFileCan && cau.test(e.message); } };
  ok('File rỗng → báo lỗi dễ hiểu', loi(new Uint8Array(0), /rỗng/));
  ok('File không phải của cân → báo lỗi', loi(new TextEncoder().encode('Mã,Tên,Giá\n1,Bò,100'), /không phải file dữ liệu của cân/));
  ok('File thiếu phần PLU → báo lỗi', loi(new TextEncoder().encode('ECS\tVER\tV3.14E8\t\r\n\r\nEND\tECS\t\r\n'), /PLU/));
  ok('File quá 5 MB → báo lỗi', loi(new Uint8Array(5_000_001), /quá lớn/));
});

// ===========================================================================
await nhom('3 · CÂN CÒN HÀNG MẪU → ĐỒNG BỘ LẦN ĐẦU', async () => {
  const f = docFileCan(taoFile({ dongPlu: HANG_MAU }));
  const kh = lapKeHoach(f, DANH_MUC, TUY);
  ok('Thêm 4 món có giá hợp lệ', kh.dem.them === 4, JSON.stringify(kh.dem));
  ok('Xoá 6 món mẫu không có trong kho', kh.dem.xoa === 6);
  ok('Không đưa lên 3 món lỗi (quá giá, mã 6 số, chưa có giá)', kh.dem.bo_qua === 3);
  ok('Bỏ qua hàng ngừng dùng và hàng không có mã cân', !kh.dong.some(d => d.maKho === 'HANG-NGUNG' || d.maKho === 'MO-VUN'));
  const them = kh.dong.filter(d => d.loai === 'them').map(d => `${d.so}:${d.maCan}`).join(' ');
  ok('Món mới lấy PLU trống nhỏ nhất theo thứ tự mã cân: 1,2,3,4', them === '1:10001 2:10002 3:10003 4:10005', them);
  ok('Lý do "quá giá" nói rõ mức 999.999 đ', kh.dong.some(d => d.maKho === 'THAN-LUNG-BO-UC' && /999\.999/.test(d.lyDo)));

  const ra = ghiFileCan(f, kh, TUY);
  const mongDoi = taoFile({ coGio: false, dongPlu: [
    plu(1, '10001', '1', '845,0', 'Lõi vai bò Mỹ', 'loivaibomy'),
    plu(2, '10002', '1', '876,0', 'Sườn bò Hàn Quốc', 'suonbohanquoc'),
    plu(3, '10003', '1', '695,0', 'Gầu bò', 'gaubo'),
    plu(4, '10005', '1', '516,0', 'Ba chỉ bò cuộn', 'bachibocuon'),
  ] });
  ok('File ra: đúng 4 dòng hàng khuôn 69 cột, bỏ phần giờ, mọi dòng khác y nguyên từng byte (kể cả byte lỗi)', giongHet(ra, mongDoi));
});

// ===========================================================================
await nhom('4 · CÂN ĐÃ CÓ HÀNG BEEFTOWN → ĐỔI GIÁ, THÊM MÓN', async () => {
  const f = docFileCan(taoFile({ dongPlu: HANG_BEEFTOWN }));
  const dm = DANH_MUC.map(h => h.ma === 'GAU-BO' ? { ...h, gia_ban_kg: 720000 }
    : h.ma === 'THAN-LUNG-BO-UC' ? { ...h, gia_ban_kg: 999000 } : h);
  const kh = lapKeHoach(f, dm, TUY);
  const theoMa = new Map(kh.dong.map(d => [d.maCan, d]));
  ok('Gầu bò: sửa giá, giữ PLU 3', theoMa.get('10003').loai === 'sua' && theoMa.get('10003').so === 3);
  ok('Ba chỉ giữ PLU 5 (phím gọi hàng không đổi)', theoMa.get('10005').loai === 'giu' && theoMa.get('10005').so === 5);
  ok('Thăn lưng (giờ 999.000 đ) được thêm vào PLU trống 4', theoMa.get('10004').loai === 'them' && theoMa.get('10004').so === 4);
  ok('Không xoá gì', kh.dem.xoa === 0);

  const ra = ghiFileCan(f, kh, TUY);
  const mongDoi = taoFile({ coGio: false, dongPlu: [
    HANG_BEEFTOWN[0], HANG_BEEFTOWN[1],
    plu(3, '10003', '1', '720,0', 'Gầu bò', 'gaubo'),
    plu(4, '10004', '1', '999,0', 'Thăn lưng bò Úc', 'thanlungbouc'),
    HANG_BEEFTOWN[3],
  ] });
  ok('Dòng Gầu bò chỉ đổi cột giá; dòng giữ nguyên y từng byte; món mới đúng khuôn', giongHet(ra, mongDoi));
});

// ===========================================================================
await nhom('5 · CÂN ĐÃ KHỚP KHO → FILE RA Y HỆT', async () => {
  const vao = taoFile({ dongPlu: HANG_BEEFTOWN });
  const f = docFileCan(vao);
  const kh = lapKeHoach(f, DANH_MUC, TUY);
  ok('Không có thay đổi', !kh.coThayDoi && kh.dem.giu === 4, JSON.stringify(kh.dem));
  ok('Không bỏ phần giờ → file ra giống file vào từng byte', giongHet(ghiFileCan(f, kh, { giuGioCan: false }), vao));

  const coBom = taoFile({ dongPlu: HANG_BEEFTOWN, bom: true });
  const fb = docFileCan(coBom);
  ok('File có dấu BOM: đọc được và ghi lại còn BOM', giongHet(ghiFileCan(fb, lapKeHoach(fb, DANH_MUC, TUY), { giuGioCan: false }), coBom));

  const doi = taoFile({ dongPlu: HANG_MAU, dau: 'ECS\tVER\tV3.15C5\tUTF-8\t', mo: 'XD1' });
  const fd = docFileCan(doi);
  const khd = lapKeHoach(fd, [], { ...TUY, giuHangNgoaiKho: true });
  ok('File đời V3.15C5 (dấu XD1): đọc được 6 món', fd.plu.length === 6 && fd.phienBan === 'V3.15C5');
  ok('Kho trống + giữ hàng ngoài kho → file ra y hệt', giongHet(ghiFileCan(fd, khd, { giuGioCan: false }), doi));
});

// ===========================================================================
await nhom('6 · GIỮ HÀNG NGOÀI KHO, MÃ CÓ SỐ 0 ĐẦU, TRÙNG MÃ, HÀNG LỖI ĐANG TRÊN CÂN', async () => {
  const f = docFileCan(taoFile({ dongPlu: HANG_MAU }));
  const kh = lapKeHoach(f, DANH_MUC, { ...TUY, giuHangNgoaiKho: true });
  ok('Giữ 6 món mẫu', kh.dem.ngoai_kho === 6 && kh.dem.xoa === 0);
  const them = kh.dong.filter(d => d.loai === 'them').map(d => d.so).join();
  ok('Món mới lấy PLU 7, 8, 9, 10', them === '7,8,9,10', them);

  const soKhong = docFileCan(taoFile({ dongPlu: [plu(1, '010001', '1', '845,0', 'Lõi vai bò Mỹ', 'loivaibomy')] }));
  const kh0 = lapKeHoach(soKhong, DANH_MUC.slice(0, 1), TUY);
  ok('Mã "010001" trên cân khớp mã cân 10001 trong kho', kh0.dong[0].loai === 'giu' && kh0.dong[0].maCan === '10001');

  const trung = docFileCan(taoFile({ dongPlu: [
    plu(1, '10001', '1', '845,0', 'Lõi vai bò Mỹ', 'loivaibomy'),
    plu(9, '10001', '1', '845,0', 'Lõi vai (trùng)', 'loivaitrung'),
  ] }));
  const kht = lapKeHoach(trung, DANH_MUC.slice(0, 1), TUY);
  ok('Hai dòng trùng mã trên cân: giữ dòng đầu, xoá dòng sau', kht.dong.find(d => d.so === 1).loai === 'giu'
    && kht.dong.find(d => d.so === 9).loai === 'xoa');

  const theoGoi = docFileCan(taoFile({ dongPlu: [plu(1, '10001', '2', '845,0', 'Lõi vai bò Mỹ', 'loivaibomy')] }));
  const khg = lapKeHoach(theoGoi, DANH_MUC.slice(0, 1), TUY);
  const dongG = new TextDecoder().decode(ghiFileCan(theoGoi, khg, TUY)).split('\r\n').find(l => l.startsWith('PLU\t'));
  ok('Hàng đang bán theo gói trên cân → sửa về cân ký (giá kho tính theo kg)', khg.dong[0].loai === 'sua' && dongG.split('\t')[4] === '1');

  const loiTrenCan = docFileCan(taoFile({ dongPlu: [plu(4, '10004', '1', '999,0', 'Thăn lưng bò Úc', 'thanlungbouc')] }));
  const khl = lapKeHoach(loiTrenCan, DANH_MUC, TUY);
  const d4 = khl.dong.find(d => d.maCan === '10004');
  ok('Hàng kho đang lỗi giá mà đã có trên cân: để nguyên dòng cũ, báo lý do', d4.loai === 'giu' && /Để nguyên/.test(d4.lyDo));
});

// ===========================================================================
await nhom('7 · TÊN DÀI VÀ FILE MANG THEO FORM', async () => {
  const f = docFileCan(taoFile({ dongPlu: [] }));
  const dai = 'Thăn ngoại bò Úc cắt lát dày nướng than hoa loại đặc biệt';
  const kh = lapKeHoach(f, [hang('DAI', '10010', dai, 500000), hang('VUA', '10011', 'Lõi vai bò Mỹ cắt lát mỏng', 500000)], TUY);
  const d = kh.dong.find(x => x.maCan === '10010');
  ok('Tên quá 40 ký tự bị cắt còn 40 và có cảnh báo', [...d.ten].length <= 40 && /đã cắt/.test(d.canhBao));
  ok('Tên trên 24 ký tự có cảnh báo dễ bị cắt khi in', /bị cắt khi in/.test(kh.dong.find(x => x.maCan === '10011').canhBao));

  const vao = taoFile({ dongPlu: HANG_MAU });
  ok('Mang file qua base64 rồi đọc lại y hệt', giongHet(tuBase64(sangBase64(vao)), vao));
  let loi = false;
  try { tuBase64('@@@ không phải base64'); } catch (e) { loi = e instanceof LoiFileCan; }
  ok('Base64 hỏng → báo lỗi dễ hiểu', loi);
});

process.exit(ketThuc('ĐỒNG BỘ CÂN'));
