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
import { COT_NGAY, HSD_TOI_DA, dongHsd, datHsd } from '../../web/src/lib/kho/can-tma.ts';

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

/**
 * Dựng file .TMS giả. Chuỗi "~LOI~" được thay bằng byte 0xFF (không phải UTF-8).
 * bo: tên các phần không đưa vào file (mặc định không bỏ phần nào — file như cũ).
 */
function taoFile({ dongPlu, dau = 'ECS\tVER\tV3.14E8\t', mo = 'DWL', coGio = true, bom = false, bo = [] }) {
  const L = [dau, ''];
  const phan = (ten, dong) => { if (!bo.includes(ten)) L.push(`${mo}\t${ten}\t`, ...dong, `END\t${ten}\t`, ''); };
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
  if (vt < 0) return new Uint8Array(Buffer.concat([bom ? Buffer.from([0xEF, 0xBB, 0xBF]) : Buffer.alloc(0), Buffer.from(u8)]));
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

// ===========================================================================
// Beeftown Cân 2.2 — theo dịch ngược phần mềm TM-xA v3.10 của hãng (chưa thử
// trên cân thật). Số cột ghi tay (27, 32, 25, 30), độc lập với COT_NGAY của
// can-tma.ts, để hai bên kiểm chéo nhau.
// ===========================================================================

/** Dòng PLU với vài cột đặt tay: datCot(dong, { 27: 1, 32: 3 }). */
const datCot = (dong, thay) => {
  const c = dong.split('\t');
  for (const [i, v] of Object.entries(thay)) c[Number(i)] = String(v);
  return c.join('\t');
};
const theoMaCan = kh => new Map(kh.dong.map(d => [d.maCan, d]));

await nhom('8 · HẠN DÙNG (HSD) — CỘT 27 / 32 CỦA DÒNG PLU', async () => {
  ok('COT_NGAY đúng cột của hãng: 23–27 công tắc in, 28–32 số liệu', COT_NGAY.IN_NGAY_BAN === 23 && COT_NGAY.IN_GIO_BAN === 24
     && COT_NGAY.IN_NGAY_DONG_GOI === 25 && COT_NGAY.IN_GIO_DONG_GOI === 26 && COT_NGAY.IN_HSD === 27 && COT_NGAY.NGAY_BAN === 28
     && COT_NGAY.GIO_BAN === 29 && COT_NGAY.NGAY_DONG_GOI === 30 && COT_NGAY.GIO_DONG_GOI === 31 && COT_NGAY.SO_NGAY_HSD === 32);
  ok('HSD tối đa 999 ngày', HSD_TOI_DA === 999);

  const khuon = plu(1, '10001', '1', '845,0', 'Lõi vai bò Mỹ', 'loivaibomy');
  ok('Dòng khuôn (cột 27 = 0) → không in HSD (null)', dongHsd(khuon.split('\t')) === null);
  ok('Cột 27 = 1, cột 32 = 3 → HSD 3 ngày', dongHsd(datCot(khuon, { 27: 1, 32: 3 }).split('\t')) === 3);
  ok('Cột 27 = 1, cột 32 = 0 → HSD trong ngày (0)', dongHsd(datCot(khuon, { 27: 1, 32: 0 }).split('\t')) === 0);
  ok('Cột 27 = 0 thì cột 32 bị bỏ qua → null', dongHsd(datCot(khuon, { 27: 0, 32: 5 }).split('\t')) === null);
  ok('Dòng thiếu cột 32 → null', dongHsd(['PLU', '1', '10001', '']) === null);

  const c = khuon.split('\t');
  datHsd(c, 7);
  ok('datHsd(7): cột 27 = "1", cột 32 = "7", cột khác y nguyên', c.join('\t') === datCot(khuon, { 27: 1, 32: 7 }));
  datHsd(c, null);
  ok('datHsd(null): cột 27 = "0", cột 32 = "0" — y như khuôn', c.join('\t') === khuon);
  datHsd(c, 7); datHsd(c, 1000);
  ok('datHsd(1000) — cân không nhận quá 999 → ghi là không in', c.join('\t') === khuon);
  const ngan = ['PLU', '1', '10001', ''];
  datHsd(ngan, 3);
  ok('datHsd trên dòng thiếu cột: không nối thêm cột', ngan.join('\t') === 'PLU\t1\t10001\t');

  // Cân: Lõi vai không in HSD nhưng có ngày đóng gói đặt tay (cột 25/30); Gầu bò HSD 3; Ba chỉ HSD 5.
  const loiVai = datCot(HANG_BEEFTOWN[0], { 25: 1, 30: 2 });
  const vao = [loiVai, HANG_BEEFTOWN[1], datCot(HANG_BEEFTOWN[2], { 27: 1, 32: 3 }), datCot(HANG_BEEFTOWN[3], { 27: 1, 32: 5 })];
  const f = docFileCan(taoFile({ dongPlu: vao }));
  ok('Đọc HSD từng dòng trên cân: null, null, 3, 5', f.plu.map(p => String(p.hsd)).join() === 'null,null,3,5', f.plu.map(p => p.hsd).join());

  const dm = DANH_MUC.map(h => h.ma === 'LOI-VAI-BO-MY' ? { ...h, han_dung_ngay: 3 }   // thêm HSD
    : h.ma === 'GAU-BO' ? { ...h, han_dung_ngay: 4 }                                    // 3 → 4
    : h.ma === 'BA-CHI-BO-CUON' ? { ...h, han_dung_ngay: null }                          // 5 → không in
    : h);                                                                               // Sườn: không quản HSD
  const kh = lapKeHoach(f, dm, TUY);
  const t = theoMaCan(kh);
  ok('Thêm HSD cho món đang không in → sửa, HSD không in → 3', t.get('10001').loai === 'sua' && t.get('10001').hsdCu === null && t.get('10001').hsd === 3);
  ok('Đổi HSD 3 → 4 → sửa (tên, giá như cũ)', t.get('10003').loai === 'sua' && t.get('10003').hsdCu === 3 && t.get('10003').hsd === 4
     && t.get('10003').ten === t.get('10003').tenCu && t.get('10003').gia === t.get('10003').giaCu);
  ok('Kho không có hạn dùng (null) → sửa, 5 → không in', t.get('10005').loai === 'sua' && t.get('10005').hsdCu === 5 && t.get('10005').hsd === null);
  ok('Hàng kho không có khoá han_dung_ngay: giữ nguyên, kế hoạch không có hsd / hsdCu',
     t.get('10002').loai === 'giu' && !('hsd' in t.get('10002')) && !('hsdCu' in t.get('10002')));
  const mongDoi = taoFile({ coGio: false, dongPlu: [
    datCot(loiVai, { 27: 1, 32: 3 }), HANG_BEEFTOWN[1], datCot(HANG_BEEFTOWN[2], { 27: 1, 32: 4 }), HANG_BEEFTOWN[3],
  ] });
  ok('File ra: chỉ cột 27/32 đổi, cột ngày đóng gói 25/30 giữ nguyên, dòng khác y nguyên từng byte', giongHet(ghiFileCan(f, kh, TUY), mongDoi));

  const giong = lapKeHoach(f, DANH_MUC.map(h => h.ma === 'GAU-BO' ? { ...h, han_dung_ngay: 3 } : h.ma === 'BA-CHI-BO-CUON' ? { ...h, han_dung_ngay: 5 } : h), TUY);
  ok('HSD kho trùng HSD trên cân → giữ nguyên, không có thay đổi', !giong.coThayDoi && theoMaCan(giong).get('10003').loai === 'giu'
     && theoMaCan(giong).get('10003').hsd === 3 && theoMaCan(giong).get('10003').hsdCu === 3, JSON.stringify(giong.dem));
});

await nhom('9 · KHÔNG QUẢN HSD (undefined) → CỘT NGÀY TRÊN CÂN Y NGUYÊN', async () => {
  // HSD và ngày đóng gói đặt tay trên cân; kho chưa gửi han_dung_ngay (như trước 2.2).
  const tay = [datCot(HANG_BEEFTOWN[0], { 25: 1, 27: 1, 30: 1, 32: 7 }), ...HANG_BEEFTOWN.slice(1)];
  const vao = taoFile({ dongPlu: tay });
  const f = docFileCan(vao);
  const kh = lapKeHoach(f, DANH_MUC, TUY);
  ok('Không có khoá han_dung_ngay: không có thay đổi, file ra giống file vào từng byte',
     !kh.coThayDoi && giongHet(ghiFileCan(f, kh, { giuGioCan: false }), vao), JSON.stringify(kh.dem));
  const khU = lapKeHoach(f, DANH_MUC.map(h => ({ ...h, han_dung_ngay: undefined })), TUY);
  ok('han_dung_ngay: undefined viết rõ cũng là không quản', !khU.coThayDoi && giongHet(ghiFileCan(f, khU, { giuGioCan: false }), vao)
     && !khU.dong.some(d => 'hsd' in d || 'hsdCu' in d));
  const khGia = lapKeHoach(f, DANH_MUC.map(h => h.ma === 'LOI-VAI-BO-MY' ? { ...h, gia_ban_kg: 850000 } : h), TUY);
  ok('Đổi giá món không quản HSD: dòng chỉ đổi cột giá, HSD 7 ngày và ngày đóng gói giữ nguyên',
     giongHet(ghiFileCan(f, khGia, TUY), taoFile({ coGio: false, dongPlu: [datCot(tay[0], { 5: '850,0' }), ...HANG_BEEFTOWN.slice(1)] })));
  const moi = lapKeHoach(docFileCan(taoFile({ dongPlu: [] })), DANH_MUC.slice(0, 1), TUY);
  ok('Món mới không quản HSD: dòng khuôn (không in HSD), kế hoạch không có hsd',
     !('hsd' in moi.dong[0]) && giongHet(ghiFileCan(docFileCan(taoFile({ dongPlu: [] })), moi, TUY),
       taoFile({ coGio: false, dongPlu: [plu(1, '10001', '1', '845,0', 'Lõi vai bò Mỹ', 'loivaibomy')] })));
});

await nhom('10 · HSD MÓN MỚI, TRONG NGÀY, QUÁ 999, KHÔNG HỢP LỆ', async () => {
  const rong = () => docFileCan(taoFile({ dongPlu: [] }));
  const f = rong();
  const kh = lapKeHoach(f, [{ ...DANH_MUC[0], han_dung_ngay: 3 }, { ...DANH_MUC[1], han_dung_ngay: 0 }], TUY);
  ok('Món mới có HSD 3 → thêm, hsd 3', kh.dong[0].loai === 'them' && kh.dong[0].hsd === 3 && !('hsdCu' in kh.dong[0]));
  ok('Món mới HSD 0 → thêm, hsd 0 (hết hạn trong ngày)', kh.dong[1].loai === 'them' && kh.dong[1].hsd === 0);
  ok('File ra: dòng khuôn với cột 27 = 1 và cột 32 = số ngày (0 vẫn bật in)', giongHet(ghiFileCan(f, kh, TUY), taoFile({ coGio: false, dongPlu: [
    datCot(plu(1, '10001', '1', '845,0', 'Lõi vai bò Mỹ', 'loivaibomy'), { 27: 1, 32: 3 }),
    datCot(plu(2, '10002', '1', '876,0', 'Sườn bò Hàn Quốc', 'suonbohanquoc'), { 27: 1, 32: 0 }),
  ] })));

  // Quá 999: cân không nhận → không in, có cảnh báo; cân đang HSD 3 thì tắt đi.
  const f9 = docFileCan(taoFile({ dongPlu: [datCot(HANG_BEEFTOWN[2], { 27: 1, 32: 3 }), HANG_BEEFTOWN[3]] }));
  const dm9 = DANH_MUC.filter(h => h.ma === 'GAU-BO' || h.ma === 'BA-CHI-BO-CUON')
    .map(h => h.ma === 'GAU-BO' ? { ...h, han_dung_ngay: 1000 } : { ...h, han_dung_ngay: 3650 });
  const t9 = theoMaCan(lapKeHoach(f9, dm9, TUY));
  ok('HSD 1000 ngày, cân đang 3 → sửa thành không in, cảnh báo nói rõ mức 999 ngày',
     t9.get('10003').loai === 'sua' && t9.get('10003').hsd === null && t9.get('10003').hsdCu === 3
     && /vượt mức cân nhận \(999 ngày\)/.test(t9.get('10003').canhBao) && /không in HSD/.test(t9.get('10003').canhBao), t9.get('10003').canhBao);
  ok('HSD 3.650 ngày, cân đang không in → giữ nguyên, vẫn cảnh báo (số kiểu Việt)', t9.get('10005').loai === 'giu' && t9.get('10005').hsd === null
     && /3\.650 ngày/.test(t9.get('10005').canhBao), t9.get('10005').canhBao);
  const e9 = theoMaCan(lapKeHoach(f9, dm9, TUY, 'en'));
  ok('Cảnh báo HSD bằng tiếng Anh khi nn = en', /more than the scale accepts \(999 days\)/.test(e9.get('10003').canhBao)
     && /3,650 days/.test(e9.get('10005').canhBao) && !/ngày/.test(e9.get('10005').canhBao), e9.get('10005').canhBao);
  ok('File ra: dòng Gầu bò về cột 27 = 0, 32 = 0; Ba chỉ y nguyên', giongHet(ghiFileCan(f9, lapKeHoach(f9, dm9, TUY), TUY),
     taoFile({ coGio: false, dongPlu: [HANG_BEEFTOWN[2], HANG_BEEFTOWN[3]] })));

  const khSai = lapKeHoach(rong(), [{ ...DANH_MUC[0], han_dung_ngay: -2 }, { ...DANH_MUC[1], han_dung_ngay: 2.5 }], TUY);
  ok('HSD âm hay số lẻ → không in, cảnh báo không hợp lệ', khSai.dong.every(d => d.hsd === null && /không hợp lệ/.test(d.canhBao)));
  const dai = 'Thăn ngoại bò Úc cắt lát dày để nướng tại bàn loại đặc biệt';
  const khHai = lapKeHoach(rong(), [{ ...hang('DAI', '10010', dai, 500000), han_dung_ngay: 1000 }], TUY);
  ok('Tên quá dài và HSD quá 999: cả hai cảnh báo cùng hiện', /đã cắt/.test(khHai.dong[0].canhBao) && /999 ngày/.test(khHai.dong[0].canhBao), khHai.dong[0].canhBao);
});

/**
 * File do phần mềm TM-xA của hãng ghi (SaveForm): BOM, một dòng trống, rồi
 * "ECS VER 100"; các phần liền nhau không có dòng trống; truocPlu là các dòng
 * chen trước "DWL PLU" (vd. lệnh xoá bảng CLR khi tích "Clear Data").
 */
function taoFilePc({ dongPlu, truocPlu = [], them = [] }) {
  const L = ['', 'ECS\tVER\t100\t'];
  const phan = (ten, dong) => L.push(`DWL\t${ten}\t`, ...dong, `END\t${ten}\t`);
  phan('TMS', ['TMS\t202\t3\t', 'TMS\t203\t3\t']);
  phan('TMT', ['TMT\t3\tVND\t']);
  phan('SCP', ['SCP\t0\t1\t1\t', 'SCP\t0\t2\t2\t']);
  phan('DPT', ['DPT\t9\tDefault\t']);
  phan('CLS', ['CLS\t9\tDefault\t9\t0\t0\t0\t0\t0\t0\t']);
  L.push(...truocPlu);
  phan('PLU', dongPlu);
  phan('BAR', ['BAR\t28\tQS-Item\t0\t0\t99999\t0\tB201F501J500A000A000A000\t']);
  for (const [ten, dong] of them) phan(ten, dong);
  L.push('END\tECS\t', '');
  return new Uint8Array(Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(L.join('\r\n'), 'utf8')]));
}

await nhom('11 · FILE CỦA PHẦN MỀM HÃNG: BOM + DÒNG TRỐNG ĐẦU, CLR KHÔNG MỞ PHẦN', async () => {
  const vao = taoFilePc({ dongPlu: HANG_BEEFTOWN });
  const f = docFileCan(vao);
  ok('BOM + dòng trống trước "ECS VER 100": đọc được, phiên bản 100, 4 món', f.coBom && f.dong[0] === '' && f.phienBan === '100' && f.plu.length === 4);
  ok('Giá 3 số lẻ đọc từ phần TMS đứng đầu file', f.soLeGia === 3 && f.plu[2].gia === 695000);
  ok('Không thay đổi → file ra giống file vào từng byte (giữ BOM và dòng trống đầu)',
     giongHet(ghiFileCan(f, lapKeHoach(f, DANH_MUC, TUY), TUY), vao));
  const dm = DANH_MUC.map(h => h.ma === 'GAU-BO' ? { ...h, gia_ban_kg: 720000 } : h);
  ok('Đổi giá: đúng dòng Gầu bò đổi, các phần liền nhau vẫn liền nhau', giongHet(ghiFileCan(f, lapKeHoach(f, dm, TUY), TUY),
     taoFilePc({ dongPlu: [HANG_BEEFTOWN[0], HANG_BEEFTOWN[1], plu(3, '10003', '1', '720,0', 'Gầu bò', 'gaubo'), HANG_BEEFTOWN[3]] })));
  ok('Hai dòng trống trước "ECS VER" (không BOM) cũng đọc được',
     docFileCan(new TextEncoder().encode('\r\n\r\nECS\tVER\t100\t\r\nDWL\tPLU\t\r\n' + HANG_BEEFTOWN[0] + '\r\nEND\tPLU\t\r\n')).plu.length === 1);
  const chiDongTrong = (() => { try { docFileCan(new TextEncoder().encode('\r\n\r\n\r\n')); return false; }
    catch (e) { return e instanceof LoiFileCan && /không phải file dữ liệu của cân/.test(e.message); } })();
  ok('File chỉ có dòng trống → báo không phải file của cân', chiDongTrong);

  const CLR = ['CLR\tPLU\t', 'CLR\tEND\t'];
  const vc = taoFilePc({ dongPlu: HANG_BEEFTOWN, truocPlu: CLR });
  const fc = docFileCan(vc);
  ok('Dòng "CLR PLU" không mở phần PLU: phần PLU bắt đầu ở "DWL PLU"', fc.dong[fc.phan.PLU.dau] === 'DWL\tPLU\t'
     && fc.dong[fc.phan.PLU.dau - 1] === 'CLR\tEND\t' && fc.plu.length === 4);
  ok('HỒI QUY: file có CLR: đổi giá → hàng mới nằm sau "DWL PLU", hai dòng CLR bị bỏ (không gửi lại lệnh xoá bảng)',
     giongHet(ghiFileCan(fc, lapKeHoach(fc, dm, TUY), TUY),
       taoFilePc({ dongPlu: [HANG_BEEFTOWN[0], HANG_BEEFTOWN[1], plu(3, '10003', '1', '720,0', 'Gầu bò', 'gaubo'), HANG_BEEFTOWN[3]] })));
  ok('HỒI QUY: file có CLR, không thay đổi → y nguyên từng byte, chỉ trừ hai dòng CLR',
     giongHet(ghiFileCan(fc, lapKeHoach(fc, DANH_MUC, TUY), TUY), taoFilePc({ dongPlu: HANG_BEEFTOWN })));
  // File TM-xA tích "Clear Data": CLR trước mọi phần (TMS, TMT, LAB…) — gửi lại là xoá thông số, chữ cài đặt, WiFi của cân.
  const xoaHet = (() => {
    const L = ['', 'ECS\tVER\t100\t', 'CLR\tTMS\t', 'CLR\tEND\t', 'DWL\tTMS\t', 'TMS\t104\t0\t', 'END\tTMS\t', 'CLR\tTMT\t', 'CLR\tEND\t',
      'DWL\tTMT\t', 'END\tTMT\t', ...CLR, 'DWL\tPLU\t', ...HANG_BEEFTOWN, 'END\tPLU\t', 'END\tECS\t', ''];
    return new Uint8Array(Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(L.join('\r\n'), 'utf8')]));
  })();
  const loiXoaHet = (() => { try { docFileCan(xoaHet); return null; } catch (e) { return e; } })();
  ok('HỒI QUY: file TM-xA có CLR TMS / TMT ("Clear Data") → từ chối (LoiFileCan, câu vi và en chỉ đường lưu từ cân ra USB)',
     loiXoaHet instanceof LoiFileCan && /Clear Data/.test(loiXoaHet.message) && /Amend/.test(loiXoaHet.message) && /Clear Data/.test(loiXoaHet.en),
     String(loiXoaHet?.message));
  const cacDuong = [ghiFileCan(fc, lapKeHoach(fc, dm, TUY), TUY), ghiFileCan(fc, lapKeHoach(fc, DANH_MUC, TUY), { giuGioCan: true, boPhanChiDoc: true }),
    ghiFileCan(fc, { dong: [], dem: { them: 0, sua: 0, giu: 0, xoa: 0, ngoai_kho: 0, bo_qua: 0 }, coThayDoi: false }, { giuGioCan: true })];
  ok('HỒI QUY: mọi cách ghi file (đổi giá, không đổi, bỏ phần chỉ đọc) đều không có dòng CLR',
     cacDuong.every(u8 => !Buffer.from(u8).toString('latin1').split('\r\n').some(d => d.startsWith('CLR\t'))));
  const fu = docFileCan(taoFilePc({ dongPlu: HANG_BEEFTOWN, truocPlu: ['UPL\tPLU\t'] }));
  ok('Dòng "UPL PLU" (hỏi cân) cũng không mở phần', fu.dong[fu.phan.PLU.dau] === 'DWL\tPLU\t' && fu.plu.length === 4);
});

await nhom('12 · BỎ PHẦN CHỈ ĐỌC (REP, INF) KHI boPhanChiDoc', async () => {
  const vao = taoFile({ dongPlu: HANG_BEEFTOWN });
  const f = docFileCan(vao);
  const kh = lapKeHoach(f, DANH_MUC, TUY);
  ok('boPhanChiDoc: bỏ hẳn REP và INF (kể cả dòng trống sau), mọi dòng khác y nguyên từng byte',
     giongHet(ghiFileCan(f, kh, { giuGioCan: false, boPhanChiDoc: true }), taoFile({ dongPlu: HANG_BEEFTOWN, bo: ['REP', 'INF'] })));
  ok('boPhanChiDoc: false → file như cũ (còn REP, INF)', giongHet(ghiFileCan(f, kh, { giuGioCan: false, boPhanChiDoc: false }), vao));
  const dm = DANH_MUC.map(h => h.ma === 'GAU-BO' ? { ...h, gia_ban_kg: 720000, han_dung_ngay: 3 } : h);
  ok('boPhanChiDoc + bỏ giờ + sửa hàng: chỉ dòng sửa đổi, ba phần REP/INF/TIM biến mất',
     giongHet(ghiFileCan(f, lapKeHoach(f, dm, TUY), { giuGioCan: true, boPhanChiDoc: true }), taoFile({ coGio: false, bo: ['REP', 'INF'], dongPlu: [
       HANG_BEEFTOWN[0], HANG_BEEFTOWN[1], datCot(plu(3, '10003', '1', '720,0', 'Gầu bò', 'gaubo'), { 27: 1, 32: 3 }), HANG_BEEFTOWN[3],
     ] })));
  const coBom = taoFile({ dongPlu: HANG_BEEFTOWN, bom: true });
  const fb = docFileCan(coBom);
  ok('File có BOM: vẫn giữ BOM khi bỏ REP/INF', giongHet(ghiFileCan(fb, lapKeHoach(fb, DANH_MUC, TUY), { giuGioCan: false, boPhanChiDoc: true }),
     taoFile({ dongPlu: HANG_BEEFTOWN, bom: true, bo: ['REP', 'INF'] })));

  // File liền (kiểu phần mềm hãng) có hai khối REP và một khối INF ở cuối.
  const REP = ['REP\t26\t9\t25\t15\t16\t46\t29\t1\t0\t', 'RES\t1\t16000,3\t6\t9\t9\t0,3\t16,2\t3\t0\t0,3\t\t\t\t\t100000,3\t0\tX\t', 'REE\t'];
  const vp = taoFilePc({ dongPlu: HANG_BEEFTOWN, them: [['REP', REP], ['INF', ['INF\tA\tB\t0\tTM-xA UA006 V3.14E8\t']], ['REP', REP]] });
  const fp = docFileCan(vp);
  ok('Hai khối REP và khối INF đều bị bỏ; file liền không mất thêm dòng nào',
     giongHet(ghiFileCan(fp, lapKeHoach(fp, DANH_MUC, TUY), { giuGioCan: true, boPhanChiDoc: true }), taoFilePc({ dongPlu: HANG_BEEFTOWN })));
  ok('Không bật boPhanChiDoc: hai khối REP và khối INF còn nguyên', giongHet(ghiFileCan(fp, lapKeHoach(fp, DANH_MUC, TUY), TUY), vp));
});

// HSD = số ngày còn lại của lô (danh-muc-can.ts, cách b): hàng kho mang nguồn HSD và cảnh báo của nơi tính HSD — chỉ để
// xem trước hiện, không ghi vào file.
await nhom('13 · NGUỒN HSD (nguon_hsd) VÀ CẢNH BÁO CỦA NƠI TÍNH HSD (canh_bao_hsd)', async () => {
  const f = docFileCan(taoFile({ dongPlu: [datCot(HANG_BEEFTOWN[2], { 27: 1, 32: 4 }), HANG_BEEFTOWN[3]] }));
  const NGUON = { vi: 'lô L-7 hết hạn 02/10', en: 'lot L-7, use-by 02/10' };
  const HET = { vi: 'Lô L-9 đã hết hạn (28/09).', en: 'Lot L-9 expired on 28/09.' };
  const dm = [{ ...DANH_MUC[2], han_dung_ngay: 3, nguon_hsd: NGUON },                              // Gầu bò 4 → 3 (đếm ngược)
              { ...DANH_MUC[3], han_dung_ngay: null, nguon_hsd: { vi: 'lô L-9', en: 'lot L-9' }, canh_bao_hsd: HET },
              { ...DANH_MUC[0], han_dung_ngay: 2, nguon_hsd: { vi: 'tảng #0142', en: 'primal #0142' } }];   // hàng mới
  const t = theoMaCan(lapKeHoach(f, dm, TUY));
  ok('Hàng quản HSD mang nguồn HSD (hsdNguon) theo ngôn ngữ — dòng sửa và dòng mới', t.get('10003')?.loai === 'sua'
     && t.get('10003').hsd === 3 && t.get('10003').hsdCu === 4 && t.get('10003').hsdNguon === 'lô L-7 hết hạn 02/10'
     && t.get('10001')?.loai === 'them' && t.get('10001').hsdNguon === 'tảng #0142', JSON.stringify([t.get('10003'), t.get('10001')]));
  ok('Cảnh báo của nơi tính HSD (lô hết hạn) nằm trong canhBao, HSD không in', t.get('10005')?.hsd === null
     && t.get('10005').canhBao === 'Lô L-9 đã hết hạn (28/09).', JSON.stringify(t.get('10005')));
  const e = theoMaCan(lapKeHoach(f, dm, TUY, 'en'));
  ok('nn = en: nguồn và cảnh báo tiếng Anh', e.get('10003')?.hsdNguon === 'lot L-7, use-by 02/10' && e.get('10005')?.canhBao === 'Lot L-9 expired on 28/09.');
  const hai = theoMaCan(lapKeHoach(f, [{ ...dm[1], han_dung_ngay: 1200 }], TUY));
  ok('Cảnh báo nơi tính HSD đứng trước cảnh báo quá 999 ngày', /^Lô L-9 đã hết hạn \(28\/09\)\. Hạn dùng 1\.200 ngày vượt mức cân nhận/.test(hai.get('10005')?.canhBao ?? ''),
     hai.get('10005')?.canhBao);
  const khong = theoMaCan(lapKeHoach(f, [{ ...DANH_MUC[2], nguon_hsd: NGUON, canh_bao_hsd: HET }], TUY));
  ok('Không quản HSD (han_dung_ngay undefined): bỏ qua nguồn và cảnh báo HSD — dòng như cũ', khong.get('10003')?.loai === 'giu'
     && !('hsdNguon' in khong.get('10003')) && !('hsd' in khong.get('10003')) && !khong.get('10003').canhBao, JSON.stringify(khong.get('10003')));
  const khongNguon = lapKeHoach(f, dm.map(({ nguon_hsd: _n, canh_bao_hsd: _c, ...h }) => h), TUY);
  ok('Nguồn HSD không ghi vào file: file ra y hệt khi không có nguồn', giongHet(ghiFileCan(f, lapKeHoach(f, dm, TUY), TUY), ghiFileCan(f, khongNguon, TUY)));
});

process.exit(ketThuc('ĐỒNG BỘ CÂN'));
