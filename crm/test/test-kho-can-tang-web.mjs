/**
 * BEEFTOWN KHO — Kiểm thử danh mục đưa xuống cân theo tảng (GĐ3 truy vết tảng)
 * ============================================================================
 *
 *     node test/test-kho-can-tang-web.mjs
 *
 * lib/kho/danh-muc-can.ts: mỗi ô mã một dòng cho cân, tên kèm số tảng đang giữ
 * ô, cắt tên cho vừa 24 ký tự mà không cắt số tảng; rồi lapKeHoach của màn Đồng
 * bộ cân đưa đúng ô xuống cân. Mã giảm giá (0054): mỗi mức giảm đang bật một
 * dòng "<tên> -30%" giá đã giảm; tắt → bỏ khỏi cân.
 *
 * HSD = số ngày còn lại của lô (cách b, 29/09/2026): ô đang giữ tảng → hạn lô ra − hôm nay; món và ô trống → lô
 * sớm nhất còn tồn; không lô → han_dung_ngay; hạn đã qua → không in + cảnh báo; mã giảm → không in. "Hôm nay" giờ
 * VN — mốc 23:50 và 00:10 bằng đồng hồ giả (dong-ho-gia.mjs), hangChoCan chạy trên client giả.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { ghepHangChoCan, tenTheoTang, TEN_CAN_TOI_DA } from '../../web/src/lib/kho/danh-muc-can.ts';
import * as DMC from '../../web/src/lib/kho/danh-muc-can.ts';
import { datGio, traGio } from './dong-ho-gia.mjs';
import { docFileCan, lapKeHoach } from '../../web/src/lib/kho/can-tma.ts';
import { ghiFileCan } from '../../web/src/lib/kho/can-tma.ts';
import { giaGiam, tenGiam } from '../../web/src/lib/kho/ma-giam.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — DANH MỤC CÂN THEO TẢNG');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');

const mh = (id, ma, ten, ma_can, gia) => ({ id, ma, ten, ma_can, gia_ban_kg: gia, dang_dung: true, loai: 'phan_cat' });
const MH = [mh('a', 'C-THANNGOAI', 'Thăn ngoại cắt lát', '301', 900000), mh('b', 'C-THANNOI', 'Thăn nội', '302', 1200000)];
const O = new Map([['a', [1, 2, 3].map(n => ({ id: `o${n}`, mat_hang_id: 'a', so_o: n, ma_can: String(10010 + n) }))]]);
const g = (o, so, conGiu = true) => ({ o_ma_id: o, so_tang: so, con_giu: conGiu });

await nhom('1 · TÊN THEO TẢNG', async () => {
  ok('Thêm số tảng', tenTheoTang('Thăn ngoại cắt lát', 142) === 'Thăn ngoại cắt lát #0142');
  ok('Không số tảng → giữ tên', tenTheoTang('Thăn ngoại', null) === 'Thăn ngoại');
  const dai = tenTheoTang('Thăn ngoại bò Úc Black Angus cắt lát dày', 7);
  ok(`Tên dài: cắt tên, giữ số tảng, ≤ ${TEN_CAN_TOI_DA} ký tự`, [...dai].length <= TEN_CAN_TOI_DA && dai.endsWith(' #0007'), dai);
  ok('Tên dạng NFD (dán từ Excel / macOS) → cắt như tên gõ tay (đếm sau khi chuẩn NFC)',
     tenTheoTang('Thăn ngoại cắt lát'.normalize('NFD'), 142) === 'Thăn ngoại cắt lát #0142', tenTheoTang('Thăn ngoại cắt lát'.normalize('NFD'), 142));
});

await nhom('2 · GHÉP DANH MỤC CÂN', async () => {
  const ds = ghepHangChoCan(MH, O, [g('o1', 142), g('o2', 150, false)]);
  ok('2 món + 3 ô = 5 dòng', ds.length === 5);
  const o1 = ds.find(x => x.ma_can === '10011');
  ok('Ô 1 đang giữ tảng #142: tên kèm số tảng, cùng giá món', o1?.ten === 'Thăn ngoại cắt lát #0142' && o1.gia_ban_kg === 900000);
  ok('Ô 2 (tảng đã hết) và ô 3 (trống): tên món', ds.find(x => x.ma_can === '10012')?.ten === 'Thăn ngoại cắt lát'
     && ds.find(x => x.ma_can === '10013')?.ten === 'Thăn ngoại cắt lát');
  ok('Mã kho của ô: MÃ#số ô', ds.find(x => x.ma_can === '10013')?.ma === 'C-THANNGOAI#3');

  // Qua lapKeHoach: cân đang có 301, 302 → thêm 3 ô.
  const K = 'PLU\t{1}\t{2}\t\t1\t{5}\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\t{15}\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\tx\t0\t0\t0\t';
  const plu = (so, ma, gia, ten) => K.replace('{1}', so).replace('{2}', ma).replace('{5}', gia).replace('{15}', ten);
  const file = docFileCan(new TextEncoder().encode(['ECS\tVER\tV3.14E8\t', '', 'DWL\tPLU\t',
    plu(1, '301', '900,0', 'Thăn ngoại cắt lát'), plu(2, '302', '1200,0', 'Thăn nội'),
    'END\tPLU\t', '', 'DWL\tTMS\t', 'TMS\t202\t3\t', 'END\tTMS\t', '', 'END\tECS\t', ''].join('\r\n')));
  const kh = lapKeHoach(file, ds, { giuHangNgoaiKho: false, giuGioCan: true, soChuSoMa: 5 });
  ok('Kế hoạch: thêm 3 ô, giữ 2 món', kh.dem.them === 3 && kh.dem.giu === 2, JSON.stringify(kh.dem));
  ok('Ô 1 lên cân với tên có số tảng', kh.dong.some(d => d.loai === 'them' && d.maCan === '10011' && d.ten.endsWith('#0142')));
  const lan2 = lapKeHoach(file, ghepHangChoCan(MH, O, [g('o1', 143)]), { giuHangNgoaiKho: false, giuGioCan: true, soChuSoMa: 5 });
  ok('Tảng khác giữ ô → đổi tên cùng PLU (không đổi phím)', lan2.dong.find(d => d.maCan === '10011')?.ten.endsWith('#0143'));
});

await nhom('3 · MÃ GIẢM GIÁ (0054)', async () => {
  ok('Giá giảm làm tròn 1.000 đ', giaGiam(900000, 30) === 630000 && giaGiam(1150000, 25) === 863000 && giaGiam(1234567, 20) === 988000);
  const t = tenGiam('Thăn ngoại bò Úc Black Angus cắt lát dày', 30);
  ok('Tên giảm: cắt tên, giữ "-30%", ≤ 24 ký tự', [...t].length <= TEN_CAN_TOI_DA && t.endsWith(' -30%'), t);
  const G = [{ id: 'g1', mat_hang_id: 'a', phan_tram: 30, ma_can: '90001', dang_dung: true },
             { id: 'g2', mat_hang_id: 'a', phan_tram: 50, ma_can: '90002', dang_dung: false },
             { id: 'g3', mat_hang_id: 'khong-co', phan_tram: 20, ma_can: '90003', dang_dung: true }];
  const ds = ghepHangChoCan(MH, O, [], G);
  const g1 = ds.find(x => x.ma_can === '90001');
  ok('Mã giảm -30%: tên "… -30%", giá 630.000, mã kho MÃ~G30', g1?.ten === 'Thăn ngoại cắt lát -30%' && g1.gia_ban_kg === 630000
     && g1.ma === 'C-THANNGOAI~G30' && g1.dang_dung === true, JSON.stringify(g1));
  ok('Mã giảm đã tắt → dòng không dùng; món không có → bỏ', ds.find(x => x.ma_can === '90002')?.dang_dung === false
     && !ds.some(x => x.ma_can === '90003'));
  const K = 'PLU\t{1}\t{2}\t\t1\t{5}\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\t{15}\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\tx\t0\t0\t0\t';
  const plu = (so, ma, gia, ten) => K.replace('{1}', so).replace('{2}', ma).replace('{5}', gia).replace('{15}', ten);
  const file = docFileCan(new TextEncoder().encode(['ECS\tVER\tV3.14E8\t', '', 'DWL\tPLU\t',
    plu(1, '301', '900,0', 'Thăn ngoại cắt lát'), plu(2, '302', '1200,0', 'Thăn nội'), plu(3, '90002', '450,0', 'Thăn ngoại cắt lát -50%'),
    'END\tPLU\t', '', 'DWL\tTMS\t', 'TMS\t202\t3\t', 'END\tTMS\t', '', 'END\tECS\t', ''].join('\r\n')));
  const kh = lapKeHoach(file, ds, { giuHangNgoaiKho: false, giuGioCan: true, soChuSoMa: 5 });
  ok('Kế hoạch: thêm mã giảm 90001 giá 630.000; mã đã tắt 90002 bỏ khỏi cân',
     kh.dong.some(d => d.loai === 'them' && d.maCan === '90001' && d.gia === 630000)
     && kh.dong.some(d => d.loai === 'xoa' && d.maCan === '90002'), JSON.stringify(kh.dong.filter(d => d.maCan.startsWith('900'))));
});

await nhom('4 · NƠI DÙNG', async () => {
  ok('Màn Đồng bộ cân dùng hangChoCan', /hangChoCan\(k\.client, k\.chiNhanh\.id, matHang\)/.test(doc('web/src/pages/noi-bo/kho/cai-dat/can.astro')));
  ok('Beeftown Cân dùng hangChoCan', /hangChoCan\(c, nd\.chiNhanh\.id, matHang\)/.test(doc('can-app/src/nghiep-vu.ts')));
});

// Hạn dùng (HSD) trên tem: cân tính từ NGÀY IN, kho tính han_dung_ngay từ ngày nhập / ngày lóc (hạn lô phần cắt
// còn bị chặn bởi hạn của tảng) — đưa han_dung_ngay của kho lên cân thì tem in HSD muộn hơn hạn của lô. Nhóm này
// gọi ghepHangChoCan KHÔNG kèm dữ liệu lô (tham số hsd): như trước cách (b) — món không mang HSD (cân giữ nguyên
// cột ngày), ô mã và mã giảm luôn tắt HSD. Cách (b) — số ngày còn lại của lô — ở nhóm 7–9.
await nhom('5 · HẠN DÙNG (HSD) KHÔNG LẤY TỪ han_dung_ngay CỦA KHO', async () => {
  // Thăn nội 950.000 đ (giá 1.200.000 của MH vượt mức cân → không đưa lên, không xét HSD).
  const MHH = [{ ...MH[0], han_dung_ngay: 3 }, { ...MH[1], gia_ban_kg: 950000, han_dung_ngay: null }];
  const G = [{ id: 'g1', mat_hang_id: 'a', phan_tram: 30, ma_can: '90001', dang_dung: true }];
  const ds = ghepHangChoCan(MHH, O, [g('o1', 142)], G);
  ok('HỒI QUY: món có hạn dùng 3 ngày trong kho (tính từ ngày nhập) → không mang HSD xuống cân (undefined: cột ngày trên cân giữ nguyên)',
     ds.filter(x => x.ma_can === '301' || x.ma_can === '302').every(x => x.han_dung_ngay === undefined && !('han_dung_ngay' in x)),
     JSON.stringify(ds.filter(x => x.ma_can === '301' || x.ma_can === '302')));
  ok('HỒI QUY: ba ô mã (kể cả ô đang giữ tảng #0142, hạn lô bị chặn bởi hạn tảng) → null: tắt HSD, không in ngày in + N',
     ['10011', '10012', '10013'].every(m => ds.find(x => x.ma_can === m)?.han_dung_ngay === null));
  ok('Mã giảm giá (gói cận date) luôn null — không in HSD mới tính từ hôm nay', ds.find(x => x.ma_can === '90001')?.han_dung_ngay === null);
  const cu = ghepHangChoCan(MH, O, [], G);
  ok('Món không có cột han_dung_ngay → vẫn undefined; ô mã và mã giảm null',
     cu.every(x => (x.ma_can === '90001' || x.ma_can.startsWith('1001') ? x.han_dung_ngay === null : x.han_dung_ngay === undefined)));

  // Qua lapKeHoach + ghiFileCan: cân có 301 (không in HSD) và 302 (HSD 5 đặt tay trên cân).
  const K = 'PLU\t{1}\t{2}\t\t1\t{5}\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\t{15}\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\tx\t0\t0\t0\t';
  const plu = (so, ma, gia, ten) => K.replace('{1}', so).replace('{2}', ma).replace('{5}', gia).replace('{15}', ten);
  const hsd5 = plu(2, '302', '950,0', 'Thăn nội').split('\t');
  hsd5[27] = '1'; hsd5[32] = '5';
  const file = docFileCan(new TextEncoder().encode(['ECS\tVER\tV3.14E8\t', '', 'DWL\tPLU\t',
    plu(1, '301', '900,0', 'Thăn ngoại cắt lát'), hsd5.join('\t'),
    'END\tPLU\t', '', 'DWL\tTMS\t', 'TMS\t202\t3\t', 'END\tTMS\t', '', 'END\tECS\t', ''].join('\r\n')));
  const kh = lapKeHoach(file, ds, { giuHangNgoaiKho: false, giuGioCan: true, soChuSoMa: 5 });
  const theo = new Map(kh.dong.map(d => [d.maCan, d]));
  ok('HỒI QUY: kế hoạch — 301 và 302 giữ nguyên (kho không đổi HSD trên cân), 3 ô + mã giảm thêm với HSD tắt',
     theo.get('301')?.loai === 'giu' && !('hsd' in theo.get('301')) && theo.get('302')?.loai === 'giu' && !('hsd' in theo.get('302'))
     && kh.dem.them === 4 && kh.dong.filter(d => d.loai === 'them').every(d => d.hsd === null), JSON.stringify(kh.dem));
  const ra = docFileCan(ghiFileCan(file, kh, { giuGioCan: true }));
  const hsdTheoMa = Object.fromEntries(ra.plu.map(p => [p.ma, p.hsd]));
  ok('HỒI QUY: file ra — 301 không in HSD như cũ, 302 giữ HSD 5 đặt tay trên cân; ba ô và mã giảm không in HSD',
     hsdTheoMa['301'] === null && hsdTheoMa['302'] === 5 && hsdTheoMa['10011'] === null && hsdTheoMa['10012'] === null
     && hsdTheoMa['10013'] === null && hsdTheoMa['90001'] === null, JSON.stringify(hsdTheoMa));
  const dong302 = ra.plu.find(p => p.ma === '302').cot;
  ok('Dòng 302 y nguyên cột ngày (cột 27 = 1, cột 32 = 5)', dong302[27] === '1' && dong302[32] === '5');
});

await nhom('6 · MÀN ĐỒNG BỘ CÂN (2.2)', async () => {
  const can = doc('web/src/pages/noi-bo/kho/cai-dat/can.astro');
  ok('Tải file: bỏ phần REP / INF (boPhanChiDoc: true)', /ghiFileCan\(file, kh, \{ \.\.\.tuy, boPhanChiDoc: true \}\)/.test(can));
  ok('Bảng xem trước có cột HSD hai thứ tiếng và dòng "trước:" khi HSD đổi',
     /cotHsd: \{ vi: 'HSD', en: 'Use-by' \}/.test(can) && /oHsd\(d\)\.cu !== null/.test(can) && /hsdKhongIn: \{ vi: 'không in', en: 'not printed' \}/.test(can));
  ok('Câu về HSD và REP/INF trên màn ghi rõ chưa thử trên cân thật (vi và en)',
     (can.match(/Chưa thử trên cân thật/g) ?? []).length >= 2 && (can.match(/Not yet tested on the real scale/g) ?? []).length >= 2);
  ok('HỒI QUY: ghi chú HSD không còn hứa "món không có hạn dùng thì tem không in HSD" (tem 28 đang "Luôn in" chữ HSD), không hứa HSD = ngày in + hạn dùng kho',
     !/tem không in HSD/.test(can) && !/print no use-by date/.test(can) && /Luôn in/.test(can) && /Always print/.test(can)
     && !/ngày in tem \+ số ngày ở Mặt hàng/.test(can));
  ok('HỒI QUY: bước nạp USB có lần bấm Accu/Confirm thứ ba (màn hình 000) và chờ Finish, vi và en',
     /lần thứ ba/.test(can) && /a third time/.test(can) && /Finish/.test(can));
});

// =============================================================================
// HSD = SỐ NGÀY CÒN LẠI CỦA LÔ (cách b, Khánh chọn 29/09/2026)
// =============================================================================
const HOM_NAY = '2026-09-29';
const lo = (lo_id, mat_hang_id, ma_lo, han_dung) => ({ lo_id, mat_hang_id, ma_lo, han_dung });
// Món: a = phần cắt có 3 ô (hạn 3 ngày); b = Thăn nội (hạn 5); c = Gầu bò (không hạn, không lô); d = Lõi vai (hạn 4,
// chưa có lô); e = Ba chỉ (lô đã hết hạn); f = Mỡ (lô hạn quá 999 ngày).
const MH7 = [
  { ...MH[0], han_dung_ngay: 3 }, { ...MH[1], gia_ban_kg: 950000, han_dung_ngay: 5 },
  { ...mh('c', 'GAU-BO', 'Gầu bò', '303', 700000), han_dung_ngay: null }, { ...mh('d', 'LOI-VAI', 'Lõi vai', '304', 800000), han_dung_ngay: 4 },
  { ...mh('e', 'BA-CHI', 'Ba chỉ', '305', 500000), han_dung_ngay: 3 }, { ...mh('f', 'MO', 'Mỡ bò', '306', 100000), han_dung_ngay: null },
];
const LO7 = [
  lo('lb1', 'b', 'L-B1', '2026-10-05'), lo('lb1', 'b', 'L-B1', '2026-10-05'),   // cùng lô, hai vị trí
  lo('lb2', 'b', 'L-B2', '2026-10-02'),                                          // sớm nhất của Thăn nội
  lo('la9', 'a', 'L-A9', '2026-10-04'),                                          // lô phần cắt của tảng trước, còn tồn
  lo('lo-o1', 'a', 'L-O1', '2026-10-01'),                                        // lô ra của tảng #0142 (ô 1)
  lo('lt150', 'tang-x', 'L-T150', '2026-09-30'),                                 // tảng #0150 đang lóc (ô 2, phiên nháp)
  lo('le1', 'e', 'L-E1', '2026-09-28'),                                          // Ba chỉ: hết hạn hôm qua
  lo('lf1', 'f', 'L-F1', '2029-12-31'),                                          // Mỡ: 1.189 ngày
];
const giu = (o, so, x) => ({ o_ma_id: o, so_tang: so, con_giu: true, lo_id: null, lo_vao_id: null, han_dung: null, ma_lo_tang: null, ...x });
const GIAO7 = [giu('o1', 142, { lo_id: 'lo-o1', han_dung: '2026-10-01' }), giu('o2', 150, { lo_vao_id: 'lt150', ma_lo_tang: 'L-T150' })];
const G7 = [{ id: 'g1', mat_hang_id: 'a', phan_tram: 30, ma_can: '90001', dang_dung: true }];
const K7 = 'PLU\t{1}\t{2}\t\t1\t{5}\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\t{15}\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\tx\t0\t0\t0\t';
const plu7 = (so, ma, gia, ten, hsd) => {
  const c = K7.replace('{1}', so).replace('{2}', ma).replace('{5}', gia).replace('{15}', ten).split('\t');
  if (hsd !== undefined) { c[27] = '1'; c[32] = String(hsd); }
  return c.join('\t');
};
const file7 = (dong) => docFileCan(new TextEncoder().encode(['ECS\tVER\tV3.14E8\t', '', 'DWL\tPLU\t', ...dong,
  'END\tPLU\t', '', 'DWL\tTMS\t', 'TMS\t202\t3\t', 'END\tTMS\t', '', 'END\tECS\t', ''].join('\r\n')));
const TUY7 = { giuHangNgoaiKho: false, giuGioCan: true, soChuSoMa: 5 };

await nhom('7 · HSD = SỐ NGÀY CÒN LẠI CỦA LÔ (hàm thuần)', async () => {
  ok('Có hàm tính HSD từng dòng (soNgayConLai, tinhHsdMon, tinhHsdO)', typeof DMC.soNgayConLai === 'function'
     && typeof DMC.tinhHsdMon === 'function' && typeof DMC.tinhHsdO === 'function');
  ok('Số ngày còn lại theo lịch: 02/10 − 29/09 = 3; qua tháng, qua năm; 29/09 − 29/09 = 0; hạn đã qua âm; ngày không có thật → null',
     typeof DMC.soNgayConLai === 'function' && DMC.soNgayConLai('2026-10-02', HOM_NAY) === 3 && DMC.soNgayConLai('2027-01-01', '2026-12-31') === 1
     && DMC.soNgayConLai('2026-09-29', HOM_NAY) === 0 && DMC.soNgayConLai('2026-09-28', HOM_NAY) === -1
     && DMC.soNgayConLai('2026-02-31', HOM_NAY) === null && DMC.soNgayConLai('2026-10-02', '29/09/2026') === null);

  const ds = ghepHangChoCan(MH7, O, GIAO7, G7, { homNay: HOM_NAY, lo: LO7 });
  const x = ma => ds.find(h => h.ma_can === ma);
  ok('Ô 1 giữ tảng #0142, lô ra hết hạn 01/10 → 2 ngày, nguồn "tảng #0142 · hết hạn 01/10"',
     x('10011')?.han_dung_ngay === 2 && x('10011').nguon_hsd?.vi === 'tảng #0142 · hết hạn 01/10' && /primal #0142/.test(x('10011').nguon_hsd?.en),
     JSON.stringify(x('10011')));
  ok('Ô 2 giữ tảng #0150 còn lóc (chưa có lô ra): không muộn hơn hạn tảng 30/09 → 1 ngày, nguồn "tảng #0150 đang lóc"',
     x('10012')?.han_dung_ngay === 1 && /^tảng #0150 đang lóc · hết hạn 30\/09$/.test(x('10012').nguon_hsd?.vi), JSON.stringify(x('10012')));
  ok('Ô 3 trống và dòng món phần cắt: lô SỚM NHẤT còn tồn của món (L-O1 01/10, sớm hơn L-A9 04/10) → 2 ngày',
     x('10013')?.han_dung_ngay === 2 && x('301')?.han_dung_ngay === 2 && x('301').nguon_hsd?.vi === 'lô L-O1 hết hạn 01/10',
     JSON.stringify([x('10013'), x('301')]));
  ok('Thăn nội: lô sớm nhất L-B2 (02/10, không phải L-B1 05/10) → 3 ngày, nguồn "lô L-B2 hết hạn 02/10" (en "lot L-B2, use-by 02/10")',
     x('302')?.han_dung_ngay === 3 && x('302').nguon_hsd?.vi === 'lô L-B2 hết hạn 02/10' && x('302').nguon_hsd?.en === 'lot L-B2, use-by 02/10'
     && !('canh_bao_hsd' in x('302')), JSON.stringify(x('302')));
  ok('Chưa có lô: Lõi vai theo hạn dùng của món (4 ngày) — "theo hạn dùng của món (chưa có lô)"; Gầu bò không hạn → null',
     x('304')?.han_dung_ngay === 4 && x('304').nguon_hsd?.vi === 'theo hạn dùng của món (chưa có lô)'
     && x('303')?.han_dung_ngay === null && /không có hạn dùng/.test(x('303').nguon_hsd?.vi), JSON.stringify([x('303'), x('304')]));
  ok('Lô đã hết hạn (Ba chỉ, 28/09) → null (không in ngày đã qua) + cảnh báo vi/en "đã hết hạn … xem thẻ Quầy"',
     x('305')?.han_dung_ngay === null && /L-E1 đã hết hạn \(28\/09\)/.test(x('305').canh_bao_hsd?.vi) && /thẻ Quầy/.test(x('305').canh_bao_hsd?.vi)
     && /L-E1 expired on 28\/09/.test(x('305').canh_bao_hsd?.en) && /Counter tab/.test(x('305').canh_bao_hsd?.en), JSON.stringify(x('305')));
  ok('Mã giảm giá cận date → null, nguồn "mã giảm giá cận date"', x('90001')?.han_dung_ngay === null && /mã giảm giá cận date/.test(x('90001').nguon_hsd?.vi));
  ok('Mỡ bò: lô hạn 31/12/2029 → 1.189 ngày (lapKeHoach sẽ không in vì quá 999); lô tảng đang lóc (món khác) không kéo HSD của món khác',
     x('306')?.han_dung_ngay === 1189 && x('303')?.han_dung_ngay === null, JSON.stringify(x('306')));

  // Qua lapKeHoach: cân đang có 301 không in HSD, 302 HSD 5 (tính hôm trước), 305 HSD 1, 306 không in.
  const f = file7([plu7(1, '301', '900,0', 'Thăn ngoại cắt lát'), plu7(2, '302', '950,0', 'Thăn nội', 5),
    plu7(3, '305', '500,0', 'Ba chỉ', 1), plu7(4, '306', '100,0', 'Mỡ bò')]);
  const kh = lapKeHoach(f, ds, TUY7);
  const t = new Map(kh.dong.map(d => [d.maCan, d]));
  ok('Kế hoạch: 302 đếm ngược 5 → 3 là "sửa", kèm nguồn HSD cho xem trước', t.get('302')?.loai === 'sua' && t.get('302').hsdCu === 5
     && t.get('302').hsd === 3 && t.get('302').hsdNguon === 'lô L-B2 hết hạn 02/10', JSON.stringify(t.get('302')));
  ok('Kế hoạch: lô hết hạn → 305 tắt HSD (1 → không in), cảnh báo hết hạn nằm trong canhBao', t.get('305')?.loai === 'sua'
     && t.get('305').hsd === null && t.get('305').hsdCu === 1 && /đã hết hạn/.test(t.get('305').canhBao ?? ''), JSON.stringify(t.get('305')));
  ok('Kế hoạch: quá 999 ngày → không in + cảnh báo mức cân nhận (luật cũ của lapKeHoach)', t.get('306')?.hsd === null
     && /vượt mức cân nhận \(999 ngày\)/.test(t.get('306').canhBao ?? ''), JSON.stringify(t.get('306')));
  ok('Kế hoạch tiếng Anh: nguồn HSD và cảnh báo hết hạn bằng tiếng Anh',
     (() => { const e = new Map(lapKeHoach(f, ds, TUY7, 'en').dong.map(d => [d.maCan, d]));
              return e.get('302')?.hsdNguon === 'lot L-B2, use-by 02/10' && /expired on 28\/09/.test(e.get('305')?.canhBao ?? '') && !/hết hạn/.test(e.get('305')?.canhBao ?? ''); })());
  const ra = docFileCan(ghiFileCan(f, kh, { giuGioCan: true }));
  const h = Object.fromEntries(ra.plu.map(p => [p.ma, p.hsd]));
  ok('File ra: 301 → 2, 302 → 3, ô 1/2/3 → 2/1/2, 305 và mã giảm không in; nguồn HSD không ghi vào file',
     h['301'] === 2 && h['302'] === 3 && h['10011'] === 2 && h['10012'] === 1 && h['10013'] === 2 && h['305'] === null && h['90001'] === null
     && !ra.dong.some(d => /L-B2|hết hạn|use-by/.test(d)), JSON.stringify(h));
  ok('Không kèm dữ liệu lô → như trước (món không có khoá HSD, không nguồn HSD)',
     ghepHangChoCan(MH7, O, GIAO7, G7).every(x => !('nguon_hsd' in x)) && !('han_dung_ngay' in ghepHangChoCan(MH7, O, GIAO7, G7)[0]));
});

/** Client Supabase giả: from(bang).select().eq().order().range() — ghi lại mọi lần gọi; `loi[bang]` = bảng đó trả lỗi. */
function clientGia(bang, loi = {}) {
  const goi = [];
  const client = {
    // 0061: ô đang giao đọc bằng RPC kho_can_giao_o_ma (mọi vai xem) — bang[tên hàm] là kết quả.
    rpc(ten, thamSo) {
      goi.push({ ten, thamSo, rpc: true });
      if (loi[ten]) return Promise.resolve({ data: null, error: loi[ten] });
      return Promise.resolve({ data: bang[ten] ?? [], error: null });
    },
    from(ten) {
      const q = { ten, cot: '', loc: [], khoang: null };
      goi.push(q);
      const b = {
        select(cot) { q.cot = cot; return b; },
        eq(k, v) { q.loc.push([k, v]); return b; },
        order() { return b; },
        range(a, z) { q.khoang = [a, z]; return b; },
        then(xong, hong) {
          if (loi[ten]) return Promise.resolve({ data: null, error: loi[ten] }).then(xong, hong);
          let ds = (bang[ten] ?? []).filter(r => q.loc.every(([k, v]) => !(k in r) || r[k] === v));
          if (q.khoang) ds = ds.slice(q.khoang[0], q.khoang[1] + 1);
          return Promise.resolve({ data: ds, error: null }).then(xong, hong);
        },
      };
      return b;
    },
  };
  return { client, goi };
}
const BANG8 = () => ({
  kho_o_ma: [...O.values()].flat(),
  kho_can_giao_o_ma: [],
  kho_ma_giam: [],
  // 1.000 dòng lô của món khác (trang 1) rồi lô Thăn nội ở trang 2; một lô cùng món ở chi nhánh khác (sớm hơn) phải bị lọc.
  kho_v_ton: [
    ...Array.from({ length: 1000 }, (_, i) => ({ chi_nhanh_id: 'cn-1', lo_id: `z${i}`, mat_hang_id: 'khac', ma_lo: `Z${i}`, han_dung: '2026-12-31', vi_tri_id: 'v1' })),
    { chi_nhanh_id: 'cn-1', lo_id: 'lb2', mat_hang_id: 'b', ma_lo: 'L-B2', han_dung: '2026-10-02', vi_tri_id: 'v1' },
    { chi_nhanh_id: 'cn-1', lo_id: 'le9', mat_hang_id: 'e', ma_lo: 'L-E9', han_dung: '2026-09-29', vi_tri_id: 'quay' },
    { chi_nhanh_id: 'cn-2', lo_id: 'lx', mat_hang_id: 'b', ma_lo: 'L-X', han_dung: '2026-09-30', vi_tri_id: 'v9' },
  ],
});

await nhom('8 · hangChoCan: ĐỌC LÔ CÒN TỒN, "HÔM NAY" GIỜ VIỆT NAM (mốc 23:50 / 00:10)', async () => {
  try {
    const { client, goi } = clientGia(BANG8());
    datGio('2026-09-29T16:50:00Z');   // 23:50 ngày 29/09 giờ VN
    const truoc = await DMC.hangChoCan(client, 'cn-1', MH7);
    datGio('2026-09-29T17:10:00Z');   // 00:10 ngày 30/09 giờ VN — ngày UTC vẫn là 29/09
    const sau = await DMC.hangChoCan(client, 'cn-1', MH7);
    traGio();
    const x = (ds, ma) => ds.find(h => h.ma_can === ma);
    const ton = goi.filter(q => q.ten === 'kho_v_ton');
    ok('Đọc kho_v_ton của đúng chi nhánh (lọc chi_nhanh_id), có mã lô và hạn dùng, từng trang 1.000 dòng tới hết',
       ton.length === 4 && ton.every(q => q.loc.some(([k, v]) => k === 'chi_nhanh_id' && v === 'cn-1')) && /ma_lo/.test(ton[0].cot)
       && /han_dung/.test(ton[0].cot) && /mat_hang_id/.test(ton[0].cot) && ton[0].khoang?.join() === '0,999' && ton[1].khoang?.join() === '1000,1999',
       JSON.stringify(ton.map(q => [q.loc, q.khoang])));
    ok('23:50 giờ VN (29/09): Thăn nội lô L-B2 hạn 02/10 → 3 ngày (lô ở trang 2 vẫn được tính, lô chi nhánh khác không)',
       x(truoc, '302')?.han_dung_ngay === 3 && x(truoc, '302').nguon_hsd?.vi === 'lô L-B2 hết hạn 02/10', JSON.stringify(x(truoc, '302')));
    ok('00:10 giờ VN (30/09, ngày UTC còn 29/09): Thăn nội → 2 ngày — tính theo ngày VN, không theo UTC',
       x(sau, '302')?.han_dung_ngay === 2, JSON.stringify(x(sau, '302')));
    ok('Lô hạn 29/09: 23:50 → 0 ngày (hết hạn trong ngày, vẫn in); 00:10 → hết hạn: không in + cảnh báo',
       x(truoc, '305')?.han_dung_ngay === 0 && !x(truoc, '305').canh_bao_hsd
       && x(sau, '305')?.han_dung_ngay === null && /L-E9 đã hết hạn \(29\/09\)/.test(x(sau, '305').canh_bao_hsd?.vi ?? ''),
       JSON.stringify([x(truoc, '305'), x(sau, '305')]));
    ok('Chưa có lô: theo hạn dùng của món, không đổi qua nửa đêm (Lõi vai 4 ngày cả hai lần)',
       x(truoc, '304')?.han_dung_ngay === 4 && x(sau, '304')?.han_dung_ngay === 4);
    const { client: hong } = clientGia(BANG8(), { kho_v_ton: { message: 'mất mạng', code: '08006' } });
    let loi = '';
    try { await DMC.hangChoCan(hong, 'cn-1', MH7); } catch (e) { loi = e.message; }
    ok('Đọc lô hỏng → hangChoCan báo lỗi (không gửi HSD thiếu lô)', loi === 'mất mạng', loi);
    ok('Ô đang giao đọc bằng RPC kho_can_giao_o_ma của đúng chi nhánh (NV quầy đọc được) — không đọc view kho_v_o_ma_giao',
       goi.some(q => q.rpc && q.ten === 'kho_can_giao_o_ma' && q.thamSo?.p_chi_nhanh_id === 'cn-1') && !goi.some(q => q.ten === 'kho_v_o_ma_giao'),
       JSON.stringify(goi.filter(q => q.rpc)));
    const { client: hongO } = clientGia(BANG8(), { kho_can_giao_o_ma: { message: 'Tài khoản của bạn không xem được kho của chi nhánh này', code: '42501' } });
    let loiO = '';
    try { await DMC.hangChoCan(hongO, 'cn-1', MH7); } catch (e) { loiO = e.message; }
    ok('Đọc ô đang giao hỏng → hangChoCan báo lỗi (không gửi tên ô thiếu số tảng)', /không xem được kho/.test(loiO), loiO);
  } finally { traGio(); }
});

await nhom('9 · MÀN ĐỒNG BỘ CÂN VÀ PHÂN LOẠI QUYỀN (cách b)', async () => {
  const can = doc('web/src/pages/noi-bo/kho/cai-dat/can.astro');
  ok('Màn Đồng bộ cân ghi "HSD tính cho ngày xuất file — nạp vào cân trong ngày" (vi và en)',
     /HSD tính cho ngày xuất file — nạp vào cân trong ngày/.test(can) && /use-by is worked out for the day the file is downloaded — load it into the scale the same day/i.test(can));
  ok('Bảng xem trước hiện nguồn HSD (d.hsdNguon)', /d\.hsdNguon/.test(can));
  ok('Ghi chú HSD không còn nói kho không đưa hạn dùng lên cân', !/Kho không đưa Mặt hàng › Hạn dùng/.test(can) && !/Inventory does not send Items › Use-by/.test(can));
  const hd = doc('crm/test/test-hop-dong-web.mjs');
  ok('Đọc kho_v_ton nằm ở ton.ts (đã phân loại chạy đã đăng nhập); danh-muc-can.ts không tự from() bảng nào',
     /'web\/src\/lib\/kho\/ton\.ts'/.test(hd) && /'web\/src\/lib\/kho\/danh-muc-can\.ts'/.test(hd)
     && !/\.from\(/.test(doc('web/src/lib/kho/danh-muc-can.ts')) && /from\('kho_v_ton'\)/.test(doc('web/src/lib/kho/ton.ts')));
});

process.exit(ketThuc('DANH MỤC CÂN THEO TẢNG'));
