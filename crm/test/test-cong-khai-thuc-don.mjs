/**
 * BEEFTOWN — THỰC ĐƠN TRÊN TRANG CÔNG KHAI (web/src/lib/thuc-don.ts + web/THUC-DON.md)
 * ===================================================================================
 *
 *     node test/test-cong-khai-thuc-don.mjs
 *
 * Trang /thuc-don, /en/menu, /ko/menu đọc món qua thuc_don_cong_khai() (0011, 0036). Bất biến:
 *
 *   1. docThucDon() không bao giờ ném lỗi: chưa nối database → rỗng, không log; database
 *      lỗi / mạng ném lỗi → rỗng và ĐÚNG MỘT dòng log "[thuc-don]". Gọi đúng hàm, đúng ngôn ngữ.
 *   2. nhomThucDon(): giá null → không có vùng giá; nhóm "xem giá tại quầy" → KHÔNG BAO GIỜ có
 *      giá, kể cả khi database lỡ trả; món sống thiếu câu cảnh báo → bị bỏ; dòng hỏng → bị bỏ.
 *   3. Nhãn "Món sống" / "Có cồn" đủ vi, en, ko; dinhDangGia viết số kiểu Việt (125.000).
 *   4. CHẠY ĐÚNG CÁC KHỐI SQL CỦA web/THUC-DON.md trên database có đủ migration (PGlite), gọi
 *      thuc_don_cong_khai() dưới vai anon như trang thật: món hiện ra, giá vẫn rỗng, F03 có
 *      cảnh báo ở cả ba thứ tiếng; đồ uống có cồn ẩn tới khi bật công tắc; SQL thu hồi làm
 *      món biến mất; chạy lại khối bật công tắc không hỏng; hướng dẫn không đặt giá nào.
 *   5. anon gọi được hàm nhưng KHÔNG đọc thẳng được bảng mon_an, nhom_mon.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dungDatabase, taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIB = join(GOC, 'web', 'src', 'lib');
const { docThucDon, nhomThucDon, dinhDangGia, NHAN_MON, THUC_DON_RONG } =
  await import(pathToFileURL(join(LIB, 'thuc-don.ts')).href);
const { timChuoiCam } = await import(pathToFileURL(join(LIB, 'chuoi-cam.js')).href);

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — THỰC ĐƠN TRÊN TRANG CÔNG KHAI');

/** Chạy fn, gom mọi dòng console.error trong lúc đó. */
async function ghiLog(fn) {
  const cu = console.error;
  const dong = [];
  console.error = (...a) => dong.push(a.join(' '));
  try { return { kq: await fn(), dong }; } finally { console.error = cu; }
}
const laRong = td => td === THUC_DON_RONG || (td && !td.coMon && !td.boTaiQuay.length && !td.monAn.length && !td.doUong.length);

/** Một dòng thuc_don_cong_khai() — đủ 15 cột như 0036. */
const dong = (them = {}) => ({
  nhom_ma: 'salad', nhom_ten: 'Salad & khai vị', nhom_loai: 'khai_vi', xem_gia_tai_quay: false,
  mon_ma: 'F01', ten: 'Salad Caesar', mo_ta: 'Xà lách romaine.', gia: null, muc_cay: null,
  co_con: false, la_mon_song: false, canh_bao: null, khau_phan: null, phien_ban: 'v1.0', cap_nhat_ngay: '2026-10-01',
  ...them,
});
const tatCaMon = td => [...td.boTaiQuay, ...td.monAn, ...td.doUong].flatMap(n => n.mon);

// ===========================================================================
await nhom('1 · docThucDon: KHÔNG BAO GIỜ NÉM LỖI, LỖI THÌ ĐÚNG MỘT DÒNG LOG', async () => {
  let r = await ghiLog(() => docThucDon('vi', null));
  ok('Chưa nối database → thực đơn rỗng', laRong(r.kq));
  ok('Chưa nối database → không log (đó là trạng thái bình thường)', r.dong.length === 0, r.dong.join(' | '));

  const loi = { rpc: async () => ({ data: null, error: { code: 'PGRST002', message: 'Could not query the database for the schema cache' } }) };
  r = await ghiLog(() => docThucDon('en', loi));
  ok('Database trả lỗi → rỗng', laRong(r.kq));
  ok('Database trả lỗi → đúng một dòng log [thuc-don] có mã lỗi', r.dong.length === 1 && /\[thuc-don\].*PGRST002/.test(r.dong[0]), r.dong.join(' | '));

  const nem = { rpc: async () => { throw new Error('fetch failed'); } };
  r = await ghiLog(() => docThucDon('ko', nem));
  ok('Mạng ném lỗi → rỗng, không ném ra ngoài', laRong(r.kq));
  ok('Mạng ném lỗi → đúng một dòng log [thuc-don]', r.dong.length === 1 && /\[thuc-don\].*fetch failed/.test(r.dong[0]), r.dong.join(' | '));

  const nemChuoi = { rpc: async () => { throw 'ECONNRESET'; } };
  r = await ghiLog(() => docThucDon('vi', nemChuoi));
  ok('Ném thứ không phải Error → vẫn rỗng, một dòng log', laRong(r.kq) && r.dong.length === 1, r.dong.join(' | '));

  for (const nn of ['vi', 'en', 'ko']) {
    let goi = null;
    const tot = { rpc: async (ham, ts) => { goi = { ham, ts }; return { data: [dong()], error: null }; } };
    r = await ghiLog(() => docThucDon(nn, tot));
    ok(`[${nn}] Gọi đúng thuc_don_cong_khai với p_ngon_ngu = '${nn}', không tham số nào khác`,
       goi?.ham === 'thuc_don_cong_khai' && JSON.stringify(goi?.ts) === JSON.stringify({ p_ngon_ngu: nn }), JSON.stringify(goi));
    ok(`[${nn}] Database trả dữ liệu → có món, không log`, r.kq.coMon === true && r.dong.length === 0, r.dong.join(' | '));
  }

  r = await ghiLog(() => docThucDon('vi', { rpc: async () => ({ data: null, error: null }) }));
  ok('Database trả null (công tắc tắt) → rỗng, không log', laRong(r.kq) && r.dong.length === 0);
});

// ===========================================================================
await nhom('2 · nhomThucDon: GIÁ, NHÓM XEM GIÁ TẠI QUẦY, MÓN SỐNG, DÒNG HỎNG', async () => {
  let td = nhomThucDon([dong({ gia: null })]);
  ok('gia null → mon.gia null (không có vùng giá)', td.monAn[0]?.mon[0]?.gia === null, JSON.stringify(td.monAn[0]?.mon[0]));

  td = nhomThucDon([dong({ gia: '125000' })]);
  ok('Giá đã duyệt (PostgREST trả bigint dạng chuỗi) → số 125000', td.monAn[0]?.mon[0]?.gia === 125000);

  for (const g of [-1, 'abc', NaN, Infinity, undefined]) {
    td = nhomThucDon([dong({ gia: g })]);
    ok(`Giá hỏng ${String(g)} → null`, td.monAn[0]?.mon[0]?.gia === null);
  }

  td = nhomThucDon([dong({ nhom_ma: 'bo-tai-quay', nhom_ten: 'Bò tại quầy', nhom_loai: 'thit_bo', xem_gia_tai_quay: true, mon_ma: 'B01', ten: 'Thăn lưng', gia: 259000 })]);
  ok('Nhóm xem giá tại quầy mà database lỡ trả giá 259000 → vẫn null', td.boTaiQuay[0]?.mon[0]?.gia === null, JSON.stringify(td.boTaiQuay[0]?.mon[0]));
  td = nhomThucDon([dong({ nhom_ma: 'goi-them', nhom_loai: 'goi_them', xem_gia_tai_quay: true, mon_ma: 'S01', ten: 'Set sốt', gia: 69000 })]);
  ok('Bất kỳ nhóm nào có xem_gia_tai_quay → không giá (không chỉ nhóm bò)', td.boTaiQuay[0]?.mon[0]?.gia === null);

  td = nhomThucDon([
    dong({ mon_ma: 'F03', ten: 'Bò sống trộn kiểu Hàn', la_mon_song: true, canh_bao: null }),
    dong({ mon_ma: 'F03b', ten: 'Bò sống 2', la_mon_song: true, canh_bao: '   ' }),
    dong({ mon_ma: 'F03c', ten: 'Bò sống 3', la_mon_song: true, canh_bao: 'Món dùng thịt bò sống.' }),
  ]);
  const mon = tatCaMon(td);
  ok('Món sống thiếu câu cảnh báo (null hoặc toàn khoảng trắng) → bị bỏ', mon.length === 1 && mon[0].ma === 'F03c', mon.map(m => m.ma).join(','));
  ok('Món sống có cảnh báo → giữ, kèm laMonSong và câu cảnh báo', mon[0]?.laMonSong === true && mon[0]?.canhBao === 'Món dùng thịt bò sống.');

  td = nhomThucDon([
    dong({ ten: null }), dong({ ten: '   ' }), dong({ nhom_loai: 'la_lam' }), null, 'rác',
    dong({ mon_ma: 'F02', ten: 'Salad bò nướng' }),
  ]);
  ok('Dòng không tên, loại nhóm lạ, dòng rác → bị bỏ, dòng tốt vẫn giữ', tatCaMon(td).map(m => m.ma).join(',') === 'F02',
     tatCaMon(td).map(m => m.ma).join(','));

  for (const v of [null, undefined, [], 'không phải mảng', { a: 1 }]) {
    ok(`Dữ liệu ${JSON.stringify(v) ?? 'undefined'} → thực đơn rỗng`, laRong(nhomThucDon(v)));
  }

  td = nhomThucDon([
    dong({ nhom_ma: 'goi-them', nhom_ten: 'Gọi thêm', nhom_loai: 'goi_them', mon_ma: 'S01', ten: 'Set sốt gọi thêm' }),
    dong({ nhom_ma: 'bo-tai-quay', nhom_ten: 'Bò tại quầy', nhom_loai: 'thit_bo', xem_gia_tai_quay: true, mon_ma: 'B01', ten: 'Thăn lưng' }),
    dong({ mon_ma: 'F01', ten: 'Salad Caesar' }),
    dong({ nhom_ma: 'com', nhom_ten: 'Cơm', nhom_loai: 'mon_chinh', mon_ma: 'F06', ten: 'Cơm chiên kimchi' }),
    dong({ mon_ma: 'F02', ten: 'Salad bò nướng' }),
    dong({ nhom_ma: 'khong-con', nhom_ten: 'Không cồn', nhom_loai: 'do_uong', mon_ma: 'D09', ten: 'Nước cam' }),
    dong({ nhom_ma: 'highball', nhom_ten: 'Highball', nhom_loai: 'do_uong', mon_ma: 'D02', ten: 'Highball cổ điển', co_con: true }),
  ]);
  ok('Ba phần: gọi thêm + thịt bò → Bò tại quầy; khai vị + món chính → Món ăn; đồ uống → Đồ uống',
     td.boTaiQuay.map(n => n.ma).join() === 'goi-them,bo-tai-quay' && td.monAn.map(n => n.ma).join() === 'salad,com'
       && td.doUong.map(n => n.ma).join() === 'khong-con,highball',
     JSON.stringify([td.boTaiQuay, td.monAn, td.doUong].map(p => p.map(n => n.ma))));
  ok('Món cùng nhóm gom về một nhóm, giữ thứ tự database trả', td.monAn[0].mon.map(m => m.ma).join() === 'F01,F02');
  ok('coMon, coDoUongCoCon, phienBan, capNhatNgay đọc đúng',
     td.coMon && td.coDoUongCoCon && td.phienBan === 'v1.0' && td.capNhatNgay === '2026-10-01');
  ok('Không món có cồn → coDoUongCoCon = false', nhomThucDon([dong()]).coDoUongCoCon === false);
});

// ===========================================================================
await nhom('3 · NHÃN MÓN ĐỦ BA THỨ TIẾNG, SỐ KIỂU VIỆT', async () => {
  for (const [khoa, nhan] of Object.entries(NHAN_MON)) {
    ok(`Nhãn ${khoa}: đủ vi, en, ko, không rỗng`, ['vi', 'en', 'ko'].every(nn => typeof nhan[nn] === 'string' && nhan[nn].trim()),
       JSON.stringify(nhan));
    ok(`Nhãn ${khoa}: bản tiếng Hàn là chữ Hàn, bản tiếng Anh không dấu Việt`,
       /[가-힣]/.test(nhan.ko) && !/[ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ]/i.test(nhan.en), JSON.stringify(nhan));
    ok(`Nhãn ${khoa}: không chữ cấm`, timChuoiCam(Object.values(nhan).join(' | ')).length === 0);
  }
  ok('Chỉ hai nhãn có căn cứ trong database (Món sống, Có cồn) — không tự thêm chay / cay / dị ứng',
     JSON.stringify(Object.keys(NHAN_MON).sort()) === JSON.stringify(['coCon', 'monSong']), Object.keys(NHAN_MON).join(','));
  for (const [so, mong] of [[125000, '125.000'], [1000000, '1.000.000'], [999, '999'], [0, '0'], [69000, '69.000'], [1234.6, '1.235']]) {
    ok(`dinhDangGia(${so}) = "${mong}"`, dinhDangGia(so) === mong, dinhDangGia(so));
  }
});

// ===========================================================================
// web/THUC-DON.md: mỗi khối ```sql đứng ngay sau <!-- sql:tên -->.
const HUONG_DAN = readFileSync(join(GOC, 'web', 'THUC-DON.md'), 'utf8');
const KHOI = Object.fromEntries([...HUONG_DAN.matchAll(/<!--\s*sql:([a-z0-9-]+)\s*-->\s*```sql\n([\s\S]*?)```/g)].map(m => [m[1], m[2]]));
const COT_DONG_THUC_DON = [...readFileSync(join(LIB, 'thuc-don.ts'), 'utf8')
  .match(/export interface DongThucDon \{([\s\S]*?)\n\}/)?.[1].matchAll(/^\s+([a-z_]+):/gm) ?? []].map(m => m[1]);

await nhom('4 · CHẠY ĐÚNG CÁC KHỐI SQL CỦA web/THUC-DON.md (PGlite, vai anon như trang thật)', async () => {
  const CAN = ['xem', 'mo-ta', 'ten-nhom-ko', 'canh-bao', 'cong-bo-mon', 'bat-thuc-don', 'bat-do-uong-co-con',
    'tat-do-uong-co-con', 'kiem', 'thu-hoi-mon', 'tat-thuc-don'];
  const thieu = CAN.filter(k => !KHOI[k]);
  ok(`THUC-DON.md có đủ ${CAN.length} khối SQL đánh dấu <!-- sql:… -->`, thieu.length === 0, `thiếu: ${thieu.join(', ')}`);
  if (thieu.length) return;
  const tatCaSql = Object.values(KHOI).join('\n');
  ok('Hướng dẫn KHÔNG đặt giá, không duyệt giá (gia / gia_de_xuat / gia_da_duyet)',
     !/\bgia(_de_xuat|_da_duyet|_duyet_luc)?\s*=/.test(tatCaSql), tatCaSql.match(/\bgia\w*\s*=.*/)?.[0]);
  ok('Hướng dẫn không xóa dòng nào (thu hồi bằng trạng thái, giữ lại để truy vết)', !/\bdelete\b|\btruncate\b|\bdrop\b/i.test(tatCaSql));

  const { db, duoiAnon } = await dungDatabase();
  const chay = async ten => { await db.exec(KHOI[ten]); };
  const COT = 'nhom_ma, nhom_ten, nhom_loai, xem_gia_tai_quay, mon_ma, ten, mo_ta, gia, muc_cay, co_con, la_mon_song, canh_bao, khau_phan, phien_ban, cap_nhat_ngay';
  /** Đúng như trang gọi: vai anon, và ngày là chuỗi như PostgREST trả về. */
  const xem = async (nn = 'vi') => {
    const r = await duoiAnon(`select ${COT.replace('cap_nhat_ngay', 'cap_nhat_ngay::text as cap_nhat_ngay')} from thuc_don_cong_khai($1)`, [nn]);
    if (r.loi) throw new Error(`anon gọi thuc_don_cong_khai lỗi: ${r.loi}`);
    return r.rows;
  };
  const ma = rows => rows.map(r => r.mon_ma).sort().join(',');

  const tuDau = await xem();
  ok('Database vừa cài: anon gọi được thuc_don_cong_khai, thực đơn rỗng', tuDau.length === 0, `${tuDau.length} món`);

  const rXem = await db.query(KHOI.xem);
  ok('Khối "xem" chạy được, liệt kê món còn vướng kèm bản nháp và điều cần xác nhận',
     rXem.rows.length >= 31 && 'copy_nhap' in rXem.rows[0] && 'can_xac_nhan' in rXem.rows[0], `${rXem.rows.length} dòng`);

  for (const ten of ['mo-ta', 'ten-nhom-ko', 'canh-bao', 'cong-bo-mon']) await chay(ten);
  ok('Món đã công bố nhưng chưa bật hien_thuc_don → trang vẫn chưa thấy món nào', (await xem()).length === 0);

  await chay('bat-thuc-don');
  let vi = await xem('vi');
  ok('Bật thực đơn → F01, F03, D09 hiện; D02 (có cồn) còn ẩn vì công tắc rượu chưa bật', ma(vi) === 'D09,F01,F03', ma(vi));
  ok('Mọi món đều có gia = null (chưa duyệt giá)', vi.length > 0 && vi.every(r => r.gia === null), JSON.stringify(vi.map(r => r.gia)));
  ok(`thuc_don_cong_khai trả đúng ${COT_DONG_THUC_DON.length} cột của DongThucDon (web/src/lib/thuc-don.ts)`,
     COT_DONG_THUC_DON.length === 15 && JSON.stringify(Object.keys(vi[0] ?? {}).sort()) === JSON.stringify([...COT_DONG_THUC_DON].sort()),
     `${Object.keys(vi[0] ?? {}).join(',')} ↔ ${COT_DONG_THUC_DON.join(',')}`);

  const f03 = nn => xem(nn).then(rows => rows.find(r => r.mon_ma === 'F03'));
  const [f03vi, f03en, f03ko] = await Promise.all(['vi', 'en', 'ko'].map(f03));
  ok('F03 là món sống, có câu cảnh báo tiếng Việt', f03vi?.la_mon_song === true && /bò sống/i.test(f03vi?.canh_bao ?? ''), f03vi?.canh_bao);
  ok('F03 có câu cảnh báo tiếng Anh trên trang tiếng Anh', /raw/i.test(f03en?.canh_bao ?? '') && !/bò sống/i.test(f03en?.canh_bao ?? ''), f03en?.canh_bao);
  ok('F03 có câu cảnh báo tiếng Hàn trên trang tiếng Hàn', /[가-힣]/.test(f03ko?.canh_bao ?? ''), f03ko?.canh_bao);
  const ko = await xem('ko');
  ok('Trang tiếng Hàn: tên món và tên nhóm là chữ Hàn', ko.every(r => /[가-힣]/.test(r.ten) && /[가-힣]/.test(r.nhom_ten)),
     JSON.stringify(ko.map(r => [r.nhom_ten, r.ten])));
  const chuTrang = (await Promise.all(['vi', 'en', 'ko'].map(xem))).flat()
    .map(r => [r.nhom_ten, r.ten, r.mo_ta, r.canh_bao].filter(Boolean).join(' · ')).join('\n');
  const cam = timChuoiCam(chuTrang);
  ok('Mọi chữ thực đơn sau khi chạy hướng dẫn: không chữ cấm (số tiền, so sánh nhất, than…)', cam.length === 0, cam.map(c => c.tim_thay).join(' | '));

  // Dòng database → thư viện của trang: cầu nối giữa hai đầu.
  const td = nhomThucDon(vi);
  ok('Dòng thật của database qua nhomThucDon: F01, F03 ở Món ăn; D09 ở Đồ uống; mọi giá null',
     td.monAn.flatMap(n => n.mon).map(m => m.ma).join() === 'F01,F03' && td.doUong.flatMap(n => n.mon).map(m => m.ma).join() === 'D09'
       && tatCaMon(td).every(m => m.gia === null),
     JSON.stringify([td.monAn, td.doUong].map(p => p.flatMap(n => n.mon).map(m => m.ma))));
  ok('Chưa bật rượu → coDoUongCoCon = false (trang không hiện dòng luật rượu)', td.coDoUongCoCon === false);

  await chay('bat-do-uong-co-con');
  vi = await xem();
  ok('Bật hien_do_uong_co_con → D02 (Highball) hiện, đánh dấu có cồn',
     ma(vi) === 'D02,D09,F01,F03' && vi.find(r => r.mon_ma === 'D02')?.co_con === true, ma(vi));
  ok('Thư viện của trang thấy có đồ uống có cồn', nhomThucDon(vi).coDoUongCoCon === true);

  await chay('bat-do-uong-co-con');
  await chay('bat-thuc-don');
  const { rows: [{ n: soDangCongBo }] } = await db.query(
    `select count(*)::int as n from noi_dung_cong_bo where khoa in ('hien_thuc_don', 'hien_do_uong_co_con') and trang_thai = 'da_cong_bo'`);
  ok('Chạy lại khối bật công tắc lần nữa → không lỗi, mỗi khóa vẫn đúng một bản đang công bố', soDangCongBo === 2, `${soDangCongBo} bản`);
  ok('…và trang vẫn thấy đủ bốn món', ma(await xem()) === 'D02,D09,F01,F03');

  await chay('cong-bo-mon');
  ok('Chạy lại khối công bố món → không lỗi, không đổi gì', ma(await xem()) === 'D02,D09,F01,F03');

  await chay('tat-do-uong-co-con');
  ok('Tắt công tắc rượu → D02 ẩn lại, dữ liệu còn nguyên', ma(await xem()) === 'D09,F01,F03'
     && (await db.query(`select trang_thai from mon_an where ma = 'D02'`)).rows[0].trang_thai === 'da_cong_bo');

  const rKiem = await db.query(KHOI.kiem);
  ok('Khối "kiem" chạy được và cột gia rỗng ở mọi dòng', rKiem.rows.length === 3 && rKiem.rows.every(r => r.gia === null), `${rKiem.rows.length} dòng`);

  await chay('thu-hoi-mon');
  ok('SQL thu hồi một món → F03 biến mất khỏi trang, món khác còn', ma(await xem()) === 'D09,F01', ma(await xem()));
  ok('Món thu hồi vẫn còn trong database (trạng thái da_thu_hoi), không bị xóa',
     (await db.query(`select trang_thai from mon_an where ma = 'F03'`)).rows[0]?.trang_thai === 'da_thu_hoi');

  await chay('cong-bo-mon');
  ok('Công bố lại (chạy lại Bước 4) → F03 trở lại', ma(await xem()) === 'D09,F01,F03');

  await chay('tat-thuc-don');
  ok('SQL tắt thực đơn → mọi món biến mất khỏi trang (vi, en, ko)',
     (await xem('vi')).length === 0 && (await xem('en')).length === 0 && (await xem('ko')).length === 0);
  ok('Món vẫn ở trạng thái đã công bố — bật lại công tắc là hiện lại',
     (await db.query(`select count(*)::int as n from mon_an where trang_thai = 'da_cong_bo'`)).rows[0].n === 4);

  // ---- Quyền: hàm thì gọi được, bảng thì không ---------------------------
  for (const bang of ['mon_an', 'nhom_mon', 'phien_ban_thuc_don']) {
    const r = await duoiAnon(`select * from ${bang} limit 1`);
    ok(`anon select thẳng bảng ${bang} → bị từ chối`, r.loi !== null && /permission denied/i.test(r.loi), r.loi ?? `đọc được ${r.rows?.length} dòng`);
  }
  const sua = await duoiAnon(`update mon_an set trang_thai = 'da_cong_bo' where ma = 'F02'`);
  ok('anon không tự công bố được món', sua.loi !== null, sua.loi ?? 'SỬA ĐƯỢC');
});

process.exit(ketThuc('THỰC ĐƠN TRÊN TRANG CÔNG KHAI'));
