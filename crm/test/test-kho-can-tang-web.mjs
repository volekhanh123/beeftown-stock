/**
 * BEEFTOWN KHO — Kiểm thử danh mục đưa xuống cân theo tảng (GĐ3 truy vết tảng)
 * ============================================================================
 *
 *     node test/test-kho-can-tang-web.mjs
 *
 * lib/kho/danh-muc-can.ts: mỗi ô mã một dòng cho cân, tên kèm số tảng đang giữ
 * ô, cắt tên cho vừa 24 ký tự mà không cắt số tảng; rồi lapKeHoach của màn Đồng
 * bộ cân đưa đúng ô xuống cân.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { ghepHangChoCan, tenTheoTang, TEN_CAN_TOI_DA } from '../../web/src/lib/kho/danh-muc-can.ts';
import { docFileCan, lapKeHoach } from '../../web/src/lib/kho/can-tma.ts';

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

await nhom('3 · NƠI DÙNG', async () => {
  ok('Màn Đồng bộ cân dùng hangChoCan', /hangChoCan\(k\.client, k\.chiNhanh\.id, matHang\)/.test(doc('web/src/pages/noi-bo/kho/cai-dat/can.astro')));
  ok('Beeftown Cân dùng hangChoCan', /hangChoCan\(c, nd\.chiNhanh\.id, matHang\)/.test(doc('can-app/src/nghiep-vu.ts')));
});

process.exit(ketThuc('DANH MỤC CÂN THEO TẢNG'));
