/**
 * BEEFTOWN — CHỈ CHẠY VÀI NHÓM CỦA KIỂM THỬ TRÌNH DUYỆT (--chi)
 * =============================================================
 *
 *     node test/test-web-chon-nhom.mjs
 *
 * web/kiem-tra/chon-nhom.mjs đọc `--chi 5,7` cho trinh-duyet.mjs và thu-day-du.mjs: sửa nhanh một chỗ thì chạy riêng
 * nhóm đó, khỏi chờ cả bộ. Bất biến:
 *   1. Không có --chi → mọi nhóm chạy, không ghi chú gì. `--chi 5,7` (hay `--chi=5,7`) → chỉ nhóm 5 và 7 (không nhầm
 *      5 với 15), cộng nhóm luôn chạy (thu-day-du nhóm 0: biến môi trường tới được trang); dòng tổng ghi rõ chỉ chạy
 *      một phần — dán vào mô tả PR không bị đọc nhầm thành cả bộ đã đạt.
 *   2. Gõ sai thì đỏ, không bao giờ "TẤT CẢ 0 KIỂM TRA ĐỀU ĐẠT": --chi thiếu số, có mục không phải số → lỗi trước khi
 *      chạy; số không ứng với nhóm nào đã chạy (gõ nhầm, nhóm bị --url bỏ qua) → khongCo() trả đúng số đó.
 *   3. Hai bộ thử dùng đúng bộ chọn này; CI (kiem-thu.yml) và lệnh npm của web không truyền --chi — CI luôn chạy hết.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const KIEM_TRA = join(GOC, 'web', 'kiem-tra');
const { taoChonNhom } = await import(pathToFileURL(join(KIEM_TRA, 'chon-nhom.mjs')).href);
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — CHỈ CHẠY VÀI NHÓM CỦA KIỂM THỬ TRÌNH DUYỆT (--chi)');

/** process.argv giả của một lần chạy bộ thử. */
const lenh = (...thamSo) => ['node', 'kiem-tra/bo-thu.mjs', ...thamSo];
/** Tên nhóm như trong bộ thử: số, dấu ·, rồi tiêu đề. */
const ten = so => `${so} · NHÓM THỬ ${so}`;
/** Các số nhóm (trong danh sách) mà bộ chọn cho chạy. */
const choChay = (chon, cacSo) => cacSo.filter(so => chon.chay(ten(so)));
const MUOI_HAI = Array.from({ length: 12 }, (_, i) => String(i + 1));

await nhom('1 · KHÔNG CÓ --chi: CHẠY HẾT', async () => {
  const chon = taoChonNhom(lenh('--khong-build'));
  ok('mọi nhóm 1–12 chạy, không lỗi, không ghi chú, không báo nhóm nào thiếu',
     chon.loi === null && choChay(chon, MUOI_HAI).length === 12 && chon.ghiChu === '' && chon.khongCo().length === 0,
     JSON.stringify({ loi: chon.loi, ghiChu: chon.ghiChu }));
  ok('nhóm không mang số (nếu có) cũng chạy', chon.chay('NHÓM KHÔNG SỐ'));
});

await nhom('2 · --chi 5,7: CHỈ ĐÚNG CÁC NHÓM ĐÓ', async () => {
  const chon = taoChonNhom(lenh('--khong-build', '--chi', '5,7'));
  const chay = choChay(chon, [...MUOI_HAI, '15', '17', '57']);
  ok('chỉ nhóm 5 và 7 — không nhầm 5 với 15, 7 với 17, "5,7" với 57', chon.loi === null && JSON.stringify(chay) === '["5","7"]', JSON.stringify(chay));
  ok('cả hai nhóm đã xin đều chạy → không báo nhóm nào thiếu', chon.khongCo().length === 0, JSON.stringify(chon.khongCo()));
  ok('dòng tổng ghi rõ chỉ chạy nhóm 5, 7 (--chi)', /5, 7/.test(chon.ghiChu) && chon.ghiChu.includes('--chi'), chon.ghiChu);
  ok('nhóm không mang số không chạy khi đã chọn nhóm', !chon.chay('NHÓM KHÔNG SỐ'));

  const dauBang = taoChonNhom(lenh('--chi=5,7'));
  ok('--chi=5,7 cũng đọc được, cùng kết quả', dauBang.loi === null && JSON.stringify(choChay(dauBang, MUOI_HAI)) === '["5","7"]');
  const coCach = taoChonNhom(lenh('--chi', ' 5 , 7 '));
  ok('khoảng trắng quanh số được bỏ', coCach.loi === null && JSON.stringify(choChay(coCach, MUOI_HAI)) === '["5","7"]');
});

await nhom('3 · NHÓM LUÔN CHẠY (thu-day-du nhóm 0)', async () => {
  const chon = taoChonNhom(lenh('--chi', '12'), { luonChay: ['0'] });
  ok('--chi 12 với nhóm 0 luôn chạy → nhóm 0 và 12 chạy, nhóm 1–11 không', JSON.stringify(choChay(chon, ['0', ...MUOI_HAI])) === '["0","12"]');
  ok('nhóm 0 không bị báo là "đã xin mà không chạy" (không ai xin nó)', chon.khongCo().length === 0, JSON.stringify(chon.khongCo()));
  const chiCo0 = taoChonNhom(lenh('--chi', '12'), { luonChay: ['0'] });
  chiCo0.chay(ten('0'));
  ok('chỉ nhóm 0 chạy (nhóm 12 bị bỏ qua) → báo 12', JSON.stringify(chiCo0.khongCo()) === '["12"]', JSON.stringify(chiCo0.khongCo()));
});

await nhom('4 · GÕ SAI THÌ ĐỎ, KHÔNG BAO GIỜ ĐẠT SUÔNG', async () => {
  const sai = [
    ['--chi đứng cuối, thiếu số', lenh('--khong-build', '--chi')],
    ['--chi theo sau là tham số khác', lenh('--chi', '--khong-build')],
    ['--chi= rỗng', lenh('--chi=')],
    ['--chi chỉ có dấu phẩy', lenh('--chi', ',')],
    ['--chi có mục không phải số', lenh('--chi', '5,x')],
    ['--chi số âm', lenh('--chi', '-5')],
  ];
  for (const [mo, argv] of sai) {
    const chon = taoChonNhom(argv);
    ok(`${mo} → lỗi kèm ví dụ cách viết, nêu đúng thứ đã gõ`, typeof chon.loi === 'string' && chon.loi.includes('--chi 5,7'), String(chon.loi));
  }
  const goNham = taoChonNhom(lenh('--chi', '5,13'));
  for (const so of MUOI_HAI) goNham.chay(ten(so));
  ok('--chi 5,13 trên bộ chỉ có nhóm 1–12 → khongCo() trả ["13"] (bộ thử in một dòng ✗)', JSON.stringify(goNham.khongCo()) === '["13"]',
     JSON.stringify(goNham.khongCo()));
  const boQua = taoChonNhom(lenh('--chi', '3', '--url', 'https://beeftown.vn'));
  for (const so of ['1', '5', '6']) boQua.chay(ten(so));   // --url bỏ qua nhóm 2–4: nhóm 3 không bao giờ được gọi
  ok('nhóm đã xin mà bộ thử bỏ qua (--url bỏ nhóm 2–4) → cũng báo', JSON.stringify(boQua.khongCo()) === '["3"]', JSON.stringify(boQua.khongCo()));
});

await nhom('5 · HAI BỘ THỬ DÙNG BỘ CHỌN NÀY; CI VÀ LỆNH npm KHÔNG TRUYỀN --chi', async () => {
  for (const [tep, luonChay] of [['trinh-duyet.mjs', false], ['thu-day-du.mjs', true]]) {
    const ma = readFileSync(join(KIEM_TRA, tep), 'utf8');
    const dungChung = /import \{[^}]*\btaoChonNhom\b[^}]*\} from '\.\/chon-nhom\.mjs'/.test(ma);
    const loc = /async function nhom\(ten, fn\) \{\s*if \(!CHON_NHOM\.chay\(ten\)\) return;/.test(ma);
    const cuoi = /CHON_NHOM\.khongCo\(\)/.test(ma) && /CHON_NHOM\.ghiChu/.test(ma) && /CHON_NHOM\.loi/.test(ma);
    const nhom0 = !luonChay || /taoChonNhom\(process\.argv, \{ luonChay: \['0'\] \}\)/.test(ma);
    ok(`${tep}: đọc --chi bằng chon-nhom.mjs (nhom() lọc, sai tham số thì dừng, cuối bộ báo nhóm thiếu và ghi chú chạy một phần)${luonChay ? ', nhóm 0 luôn chạy' : ''}`,
       dungChung && loc && cuoi && nhom0 && !ma.includes("process.argv.indexOf('--chi')"),
       JSON.stringify({ dungChung, loc, cuoi, nhom0 }));
  }
  const yml = readFileSync(join(GOC, '.github', 'workflows', 'kiem-thu.yml'), 'utf8');
  const dongChay = yml.split('\n').filter(d => /\brun:/.test(d) && /thu-trinh-duyet|thu-day-du/.test(d));
  ok(`kiem-thu.yml: ${dongChay.length} lệnh chạy bộ thử trình duyệt, không lệnh nào có --chi (CI chạy hết)`,
     dongChay.length >= 2 && dongChay.every(d => !d.includes('--chi')), dongChay.join(' | '));
  const goi = JSON.parse(readFileSync(join(GOC, 'web', 'package.json'), 'utf8'));
  const coChi = Object.entries(goi.scripts ?? {}).filter(([, l]) => l.includes('--chi'));
  ok('web/package.json: không lệnh npm nào tự gắn --chi', coChi.length === 0, coChi.map(([t]) => t).join(', '));
});

process.exit(ketThuc('CHỈ CHẠY VÀI NHÓM (--chi)'));
