/**
 * BEEFTOWN KHO — Kiểm thử: đọc danh sách qua giới hạn 1.000 dòng mỗi lần của Supabase
 * ===================================================================================
 *
 *     node test/test-kho-doc-het-trang-web.mjs
 *
 * PostgREST trả tối đa 1.000 dòng mỗi lần đọc (Max rows của project Supabase) — cả bảng / view lẫn
 * hàm rpc trả nhiều dòng. `.limit(2000)` hay `.limit(5000)` KHÔNG vượt được. Đọc thiếu thì lặng lẽ:
 *
 *   · docTon xếp hạn dùng tăng dần → lô MỚI NHẤT bị bỏ: quét gói vừa đóng thấy "không có tồn", chọn
 *     lô để xuất / pha lóc / trả NCC thiếu lô, danh sách "dưới mức" ở quầy sai;
 *   · docGiaTon không xếp thứ tự và bỏ qua lỗi → tổng giá trị tồn thấp hơn thật, không cảnh báo;
 *   · docMaChuaGhep: sau một đợt iPOS dồn, mã chưa ghép cũ nhất không bao giờ lên màn ghép;
 *   · docTheKho: "mọi dòng sổ, số dư chạy" — mất dòng cuối và SỐ DƯ CUỐI;
 *   · docDuLieuMisa: file MISA một quý thiếu chứng từ; docCongNoTheoKy, docSoThanhToan tương tự;
 *   · số nhãn đã quét (đếm quầy, pha lóc) thiếu nhãn sau thứ 1.000.
 *
 * Client Supabase giả ở đây giữ đúng luật đó: mỗi lần đọc tối đa 1.000 dòng, bất kể .limit().
 * Kiểm thử trên PGlite không thấy lỗi này — PGlite không đi qua PostgREST.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { docTungTrang, CAU_QUA_NHIEU_DONG, CO_TRANG_DOC } from '../../web/src/lib/kho/chung.ts';
import { docTon, docGiaTon } from '../../web/src/lib/kho/ton.ts';
import { docMaChuaGhep } from '../../web/src/lib/kho/ban-ipos.ts';
import { docTheKho } from '../../web/src/lib/kho/the-kho.ts';
import { docCongNoTheoKy, docDuLieuMisa } from '../../web/src/lib/kho/cong-no.ts';
import { docSoThanhToan } from '../../web/src/lib/kho/bao-cao.ts';
import { docSoNhanQuet } from '../../web/src/lib/kho/kiem-ke.ts';
import { docNhanQuet } from '../../web/src/lib/kho/pha-loc.ts';
import { CAU_KHO_EN } from '../../web/src/lib/kho/cau-kho-en.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — ĐỌC QUA GIỚI HẠN 1.000 DÒNG');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, 'web', 'src', 'lib', 'kho', p), 'utf8');

const TRAN = 1000;   // Max rows mặc định của Supabase
const CN = '11111111-1111-4111-8111-111111111111';
const UUID = i => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;

/**
 * Client giả: bang[tên bảng / view / hàm rpc] = mảng dòng. Mỗi lần đọc trả tối đa TRAN dòng (sau .range()).
 * `loi[tên]` = lỗi trả về; `loiTrang[tên]` = lỗi trả về từ lần đọc thứ mấy (0 = lần đầu). Ghi lại mọi lần gọi.
 */
function clientGia(bang, { loi = {}, loiTu = {}, tran = TRAN } = {}) {
  const goi = [];
  const dem = {};
  const tao = (ten, rpc, thamSo, tuyChon) => {
    const q = { ten, rpc, thamSo, loc: [], thuTu: [], khoang: null, gioiHan: null, demTong: !!tuyChon?.count };
    goi.push(q);
    const b = {
      select(_cot, tc) { if (tc?.count) q.demTong = true; return b; },
      eq(k, v) { q.loc.push([k, v]); return b; },
      in() { return b; },
      order(cot, tuyChon) { q.thuTu.push(cot + (tuyChon?.ascending === false ? ' desc' : '')); return b; },
      limit(n) { q.gioiHan = n; return b; },
      range(a, z) { q.khoang = [a, z]; return b; },
      then(xong, hong) {
        const lan = dem[ten] = (dem[ten] ?? -1) + 1;
        if (loi[ten] && lan >= (loiTu[ten] ?? 0)) return Promise.resolve({ data: null, error: loi[ten] }).then(xong, hong);
        let ds = (bang[ten] ?? []).filter(r => q.loc.every(([k, v]) => !(k in r) || r[k] === v));
        const tong = ds.length;
        const [a, z] = q.khoang ?? [0, Infinity];
        ds = ds.slice(a, Math.min(z + 1, a + (q.gioiHan ?? Infinity), a + tran));
        // Như PostgREST: chỉ trả tổng số dòng khi được xin (count: 'exact').
        return Promise.resolve({ data: ds, error: null, count: q.demTong ? tong : null }).then(xong, hong);
      },
    };
    return b;
  };
  return { client: { from: ten => tao(ten, false), rpc: (ten, thamSo, tc) => tao(ten, true, thamSo, tc) }, goi };
}

const lan = (goi, ten) => goi.filter(q => q.ten === ten);

// ===========================================================================
await nhom('1 · docTungTrang — đọc tới trang chưa đầy, lỗi giữa chừng không bị nuốt', async () => {
  ok('Một trang đúng 1.000 dòng mỗi lần (Max rows Supabase)', CO_TRANG_DOC === TRAN);
  const ds = Array.from({ length: 2500 }, (_, i) => ({ i }));
  const khoang = [];
  const ra = await docTungTrang((a, z) => { khoang.push([a, z]); return Promise.resolve({ data: ds.slice(a, Math.min(z + 1, a + TRAN)), error: null }); });
  ok('2.500 dòng → đọc đủ 2.500, đúng thứ tự', ra.length === 2500 && ra.every((r, i) => r.i === i));
  ok('Ba lần đọc 0–999, 1000–1999, 2000–2999', JSON.stringify(khoang) === JSON.stringify([[0, 999], [1000, 1999], [2000, 2999]]),
     JSON.stringify(khoang));

  const vua = await docTungTrang((a, z) => Promise.resolve({ data: Array.from({ length: a < 1000 ? 1000 : 0 }, () => ({})), error: null }));
  ok('Đúng 1.000 dòng → đọc thêm một trang rỗng rồi dừng', vua.length === 1000);

  let loi = null;
  try { await docTungTrang((a) => Promise.resolve(a === 0 ? { data: ds.slice(0, 1000), error: null } : { data: null, error: { message: 'fetch failed' } })); }
  catch (e) { loi = e; }
  ok('Trang 2 hỏng mạng → ném lỗi, KHÔNG trả 1.000 dòng như thể đủ', loi?.message === 'fetch failed', String(loi?.message));

  const hetDong = await docTungTrang((a) => Promise.resolve(a === 0
    ? { data: ds.slice(0, 1000), error: null } : { data: null, error: { code: 'PGRST103', message: 'Requested range not satisfiable' } }));
  ok('Trang sau báo PGRST103 (dòng vừa bị xoá giữa hai lần đọc) → trả phần đã đọc', hetDong.length === 1000);

  // Max rows của project bị hạ xuống dưới 1.000 (Supabase cho chỉnh): trang đầu ngắn hơn 1.000 mà CHƯA hết. Có tổng
  // số dòng (count) thì đọc tiếp tới đủ; không có tổng thì như trước (trang ngắn = trang cuối).
  const ngan = Array.from({ length: 1300 }, (_, i) => ({ i }));
  const theoTong = await docTungTrang((a, z) => Promise.resolve({ data: ngan.slice(a, Math.min(z + 1, a + 500)), error: null, count: ngan.length }));
  ok('Max rows 500, có tổng 1.300 → vẫn đọc đủ 1.300, đúng thứ tự', theoTong.length === 1300 && theoTong.every((r, i) => r.i === i),
     `đọc ${theoTong.length}`);

  let qua = null;
  try { await docTungTrang(() => Promise.resolve({ data: Array.from({ length: TRAN }, () => ({})), error: null })); }
  catch (e) { qua = e; }
  ok('Không bao giờ hết → dừng ở 100.000 dòng và báo lỗi, không cắt cụt lặng lẽ', qua?.message === CAU_QUA_NHIEU_DONG.vi, String(qua?.message));
  ok('Câu "quá nhiều dòng" có bản tiếng Anh cho dichCau()', CAU_KHO_EN[CAU_QUA_NHIEU_DONG.vi] === CAU_QUA_NHIEU_DONG.en);
});

// ===========================================================================
await nhom('2 · docTon / docGiaTon — tồn kho đủ mọi lô, giá trị tồn không lặng lẽ thiếu', async () => {
  const ton = Array.from({ length: 2300 }, (_, i) => ({
    chi_nhanh_id: CN, lo_id: UUID(i), ma_lo: `L${String(i).padStart(5, '0')}`, mat_hang_id: UUID(9000 + (i % 7)),
    vi_tri_id: UUID(8000 + (i % 3)), han_dung: `2026-${String(10 + Math.floor(i / 1000)).padStart(2, '0')}-15`,
    so_kg: '1.250', so_goi: 1, so_ngay_con: 5,
  }));
  const { client, goi } = clientGia({ kho_v_ton: ton });
  const ds = await docTon(client, CN);
  ok('2.300 dòng tồn → đọc đủ 2.300 (trước đây dừng ở 1.000: mất lô hạn xa nhất)', ds.length === 2300, `đọc ${ds.length}`);
  ok('Lô hạn xa nhất (cuối danh sách) có mặt', ds.some(d => d.ma_lo === 'L02299'));
  const q = lan(goi, 'kho_v_ton');
  ok('Đọc theo trang .range(), không .limit()', q.length === 3 && q.every(x => x.khoang && x.gioiHan === null), JSON.stringify(q.map(x => x.khoang)));
  ok('…xin tổng số dòng (count: exact) để không dừng sớm khi Max rows < 1.000', q.every(x => x.demTong));
  const t500 = clientGia({ kho_v_ton: ton }, { tran: 500 });
  const ds500 = await docTon(t500.client, CN);
  ok('Project hạ Max rows xuống 500 → docTon vẫn đọc đủ 2.300 dòng', ds500.length === 2300, `đọc ${ds500.length}`);
  ok('Thứ tự xác định (đủ cột để hai dòng không ngang nhau): han_dung, ma_lo, lo_id, vi_tri_id',
     q[0].thuTu.join(',') === 'han_dung,ma_lo,lo_id,vi_tri_id', q[0].thuTu.join(','));

  const gia = ton.map(r => ({ chi_nhanh_id: CN, lo_id: r.lo_id, vi_tri_id: r.vi_tri_id, gia_von_kg: '400000', gia_tri: '500000' }));
  const g = clientGia({ kho_v_ton_gia: gia });
  const map = await docGiaTon(g.client, CN);
  ok('Giá trị tồn 2.300 dòng → Map đủ 2.300', map.size === 2300, `có ${map.size}`);
  ok('…tổng giá trị đúng (không thiếu 1.300 dòng)', [...map.values()].reduce((s, x) => s + x.gia_tri, 0) === 2300 * 500000);
  ok('…đọc có thứ tự lo_id, vi_tri_id', lan(g.goi, 'kho_v_ton_gia')[0].thuTu.join(',') === 'lo_id,vi_tri_id');

  const h = clientGia({}, { loi: { kho_v_ton_gia: { message: 'fetch failed' } } });
  let loi = null;
  try { await docGiaTon(h.client, CN); } catch (e) { loi = e; }
  ok('Đọc giá trị tồn lỗi → ném lỗi (trang báo "không đọc được"), không trả Map rỗng như vai không xem giá',
     loi?.message === 'fetch failed', String(loi?.message));
});

// ===========================================================================
await nhom('3 · docMaChuaGhep — mã iPOS chưa ghép cũ nhất vẫn lên màn ghép', async () => {
  const dong = Array.from({ length: 1500 }, (_, i) => ({
    chi_nhanh_id: CN, trang_thai: 'chua_khop', id: UUID(i), ma_ipos: i < 1499 ? 'NUOC' : 'MA-CU-NHAT',
    ten_ipos: i < 1499 ? 'Nước suối' : 'Món cũ', ma_can: null,
    thoi_diem_ban: new Date(Date.UTC(2026, 9, 10) - i * 60000).toISOString(),
  }));
  const { client, goi } = clientGia({ kho_v_ipos_dong: dong });
  const ma = await docMaChuaGhep(client, CN);
  ok('Mã chỉ có ở dòng thứ 1.500 (cũ nhất) vẫn có trong danh sách', ma.some(m => m.ma_ipos === 'MA-CU-NHAT'),
     JSON.stringify(ma.map(m => m.ma_ipos)));
  const q = lan(goi, 'kho_v_ipos_dong');
  ok('Đọc theo trang, thứ tự xác định (thoi_diem_ban desc, id)', q.length === 2 && q[0].thuTu.join(',') === 'thoi_diem_ban desc,id',
     q.map(x => x.thuTu.join(',')).join(' | '));
});

// ===========================================================================
await nhom('4 · Hàm rpc nhiều dòng — thẻ kho, công nợ theo kỳ, MISA, sổ thanh toán', async () => {
  const theKho = Array.from({ length: 1800 }, (_, i) => ({ ngay: '2026-10-01', loai: 'nhap', ten_loai: 'Nhập', ton_kg: String(i + 1) }));
  const a = clientGia({ kho_the_kho: theKho });
  const tk = await docTheKho(a.client, CN, UUID(1), { viTri: '', tu: '2026-01-01', den: '2026-12-31' });
  ok('Thẻ kho 1.800 dòng → đủ, SỐ DƯ CUỐI là của dòng cuối thật (1.800 kg, không phải 1.000)',
     tk.length === 1800 && tk.at(-1).ton_kg === 1800, `${tk.length} dòng, dư cuối ${tk.at(-1)?.ton_kg}`);
  ok('…đọc rpc theo trang', lan(a.goi, 'kho_the_kho').length === 2 && lan(a.goi, 'kho_the_kho').every(x => x.rpc && x.khoang));
  // Mọi hàm đọc dùng docTungTrang đều xin tổng số dòng — kiểm trên mã nguồn từng file.
  for (const f of ['ton.ts', 'ban-ipos.ts', 'the-kho.ts', 'cong-no.ts', 'bao-cao.ts', 'kiem-ke.ts', 'dem-quay.ts', 'pha-loc.ts']) {
    const nguon = doc(f);
    const lanGoi = [...nguon.matchAll(/docTungTrang\(\([^)]*\) =>[\s\S]*?\.range\(/g)].map(m => m[0]);
    ok(`${f}: mọi lần docTungTrang xin count: 'exact'`, lanGoi.length > 0 && lanGoi.every(x => /count: 'exact'/.test(x)),
       lanGoi.filter(x => !/count: 'exact'/.test(x)).map(x => x.slice(0, 80)).join(' | '));
  }

  const so = Array.from({ length: 1200 }, (_, i) => ({ thu_tu: i + 1, loai: 'nhap', so_du: String(i), tang: '1', giam: null }));
  const b = clientGia({ kho_cong_no_theo_ky: so });
  const cn = await docCongNoTheoKy(b.client, CN, null, '2026-01-01', '2026-12-31');
  ok('Sổ công nợ theo kỳ 1.200 dòng → đủ', cn.length === 1200 && cn.at(-1).thu_tu === 1200, `${cn.length} dòng`);

  const misa = Array.from({ length: 3100 }, (_, i) => ({ thu_tu: i + 1, so_chung_tu: `PN${i}`, so_luong: '1', don_gia: '1000', thanh_tien: '1000' }));
  const c = clientGia({ kho_du_lieu_misa: misa });
  const m = await docDuLieuMisa(c.client, CN, '2026-07-01', '2026-09-30', 'mua_hang');
  ok('File MISA một quý 3.100 dòng → đủ 3.100 (không mất chứng từ cuối quý)', m.length === 3100 && m.at(-1).so_chung_tu === 'PN3099',
     `${m.length} dòng`);

  const tt = Array.from({ length: 1001 }, (_, i) => ({ id: UUID(i), ngay: '2026-10-01', loai: 'thanh_toan', hinh_thuc: 'tien_mat', trang_thai: 'hieu_luc', so_tien: '1000' }));
  const d = clientGia({ kho_so_thanh_toan: tt });
  const st = await docSoThanhToan(d.client, CN, '2026-01-01', '2026-12-31');
  ok('Sổ thanh toán 1.001 khoản → đủ 1.001', st.loi === null && st.dong.length === 1001, `${st.dong.length} dòng, lỗi ${st.loi}`);

  const e = clientGia({ kho_so_thanh_toan: tt }, { loi: { kho_so_thanh_toan: { message: 'fetch failed' } }, loiTu: { kho_so_thanh_toan: 1 } });
  const st2 = await docSoThanhToan(e.client, CN, '2026-01-01', '2026-12-31');
  ok('Sổ thanh toán: trang 2 mất mạng → báo lỗi, không hiện 1.000 khoản như thể đủ', st2.loi !== null && st2.dong.length === 0,
     `lỗi ${st2.loi}, ${st2.dong.length} dòng`);
});

// ===========================================================================
await nhom('5 · Số nhãn đã quét — đếm quầy và pha lóc', async () => {
  const quet = Array.from({ length: 1300 }, (_, i) => ({ kiem_ke_id: UUID(1), mat_hang_id: i < 1299 ? 'a' : 'b', thu_tu: i + 1 }));
  const a = clientGia({ kho_kiem_ke_quet: quet });
  const sl = await docSoNhanQuet(a.client, UUID(1));
  ok('Đếm quầy 1.300 nhãn → đủ (món quét sau cùng có mặt)', sl.get('a') === 1299 && sl.get('b') === 1, JSON.stringify([...sl]));
  ok('…thứ tự thu_tu', lan(a.goi, 'kho_kiem_ke_quet')[0].thuTu.join(',') === 'thu_tu');

  const pha = Array.from({ length: 1100 }, (_, i) => ({ phien_pha_id: UUID(2), mat_hang_id: 'x', thu_tu: i + 1 }));
  const b = clientGia({ kho_phien_pha_quet: pha });
  const nq = await docNhanQuet(b.client, UUID(2));
  ok('Pha lóc 1.100 nhãn → đủ, nhãn sau cùng có mặt', nq.length === 1100 && nq.at(-1).thu_tu === 1100, `${nq.length}`);
});

// ===========================================================================
await nhom('6 · MÃ NGUỒN — không còn .limit() vượt 1.000 trong lib/kho', async () => {
  const tep = ['ton.ts', 'ban-ipos.ts', 'kiem-ke.ts', 'dem-quay.ts', 'pha-loc.ts', 'the-kho.ts', 'cong-no.ts', 'bao-cao.ts'];
  for (const f of tep) {
    const vuot = [...doc(f).matchAll(/\.limit\((\d+)\)/g)].filter(m => Number(m[1]) > TRAN);
    ok(`${f}: không .limit() lớn hơn 1.000 (Supabase chỉ trả 1.000)`, vuot.length === 0, vuot.map(m => m[0]).join(', '));
  }
  ok('dem-quay.ts docMonDaQuet đọc nhãn quét bằng docTungTrang', /docTungTrang\(/.test(doc('dem-quay.ts')));
});

process.exit(ketThuc('ĐỌC QUA GIỚI HẠN 1.000 DÒNG'));
