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
 *   4. CHẠY ĐÚNG CÁC KHỐI SQL CỦA web/THUC-DON.md, theo thứ tự trong file, trên database có đủ
 *      migration (PGlite, danh mục cuốn menu bản sáng của 0091), gọi thuc_don_cong_khai() dưới
 *      vai anon như trang thật: đúng 22 món ăn theo thứ tự nhóm và món của cuốn; tên, mô tả
 *      đúng từng chữ (mô tả trùng chữ của cuốn mà 0091 giữ ở copy_nhap / nguyen_van_nguon);
 *      giá và độ cay rỗng; F03, F19 có cảnh báo ba thứ tiếng; ba ly signature chỉ hiện khi bật
 *      công tắc rượu; 17 đồ uống dạng danh sách và 10 món thu hồi không bao giờ hiện; chạy lại
 *      mọi khối lần hai không đổi gì; SQL thu hồi làm món biến mất; hướng dẫn không đặt giá nào.
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
// web/THUC-DON.md: mỗi khối ```sql đứng ngay sau <!-- sql:tên -->. Thứ tự khối trong file = thứ tự Khánh chạy.
const HUONG_DAN = readFileSync(join(GOC, 'web', 'THUC-DON.md'), 'utf8');
const KHOI = Object.fromEntries([...HUONG_DAN.matchAll(/<!--\s*sql:([a-z0-9-]+)\s*-->\s*```sql\n([\s\S]*?)```/g)].map(m => [m[1], m[2]]));
const COT_DONG_THUC_DON = [...readFileSync(join(LIB, 'thuc-don.ts'), 'utf8')
  .match(/export interface DongThucDon \{([\s\S]*?)\n\}/)?.[1].matchAll(/^\s+([a-z_]+):/gm) ?? []].map(m => m[1]);

// Danh mục cuốn menu bản sáng (migration 0091): tám nhóm món ăn theo thứ tự trang, mỗi nhóm theo thứ tự món.
const NHOM_AN = [
  ['dac-trung', ['F03', 'F19']], ['lau', ['F15', 'F16', 'F20']], ['set-sot', ['S01']], ['salad', ['F21', 'F01', 'F10']],
  ['mon-them', ['F22', 'F23', 'F18']], ['canh', ['F12', 'F14', 'F13']], ['com', ['F06', 'F05', 'F04']], ['mi', ['F11', 'F08', 'F07', 'F09']],
];
const SIGNATURE = ['D13', 'D01', 'D14'];
// Thứ tự trang in (thuc_don_cong_khai xếp theo thứ tự nhóm rồi thứ tự món): Set 4 sốt (nhóm goi-them, thứ tự 3) đứng trước.
const THU_TU_MON_AN = ['S01', 'F03', 'F19', 'F15', 'F16', 'F20', 'F21', 'F01', 'F10', 'F22', 'F23', 'F18',
  'F12', 'F14', 'F13', 'F06', 'F05', 'F04', 'F11', 'F08', 'F07', 'F09'];
const DANH_SACH_UONG = ['D02', 'D15', 'D16', 'D17', 'D18', 'D19', 'D20', 'D21', 'D09', 'D22', 'D10', 'D23', 'D24', 'D25', 'D26', 'D27', 'D28'];
const THU_HOI = ['F02', 'F17', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D11', 'D12'];
const CANH_BAO = {
  vi: 'Món có bò sống và lòng đỏ trứng sống. Người đang mang thai, trẻ nhỏ, người lớn tuổi nên hỏi nhân viên trước khi gọi.',
  en: 'Contains raw beef and raw egg yolk. If you are pregnant, or ordering for a child or an older guest, please ask our staff first.',
  ko: '생소고기와 날계란 노른자가 들어간 메뉴예요. 임산부, 어린이, 어르신은 주문 전에 직원에게 문의해 주세요.',
};
/** Chữ mẫu chép tay từ cuốn (danh mục 11/10/2026) — sai một chữ trong THUC-DON.md hay migration là đỏ. */
const MAU = [
  ['vi', 'F15', 'Lẩu', 'Lẩu kim chi', 'Nấu từ kimchi nhà làm, với thịt heo, đậu hũ và nấm. Nước dùng chua, cay.'],
  ['vi', 'S01', 'Gọi thêm tùy chọn', 'Set 4 sốt', '4 sốt hâm nóng ngay trên vỉ: phô mai, tare, ssamjang, sốt cay Tứ Xuyên. Kèm kimchi nhà làm và rau cuốn. Thêm 1 lần.'],
  ['vi', 'F14', 'Canh', 'Đậu phụ hầm', 'Đậu hũ non mềm trong nước dùng cay, nóng.'],
  ['en', 'F01', 'Salads', 'Caesar salad', 'Romaine, croutons, shaved parmesan and Caesar dressing.'],
  ['en', 'F11', 'Noodles & pasta', 'Signature spicy cold noodles', 'Spicy cold noodles with icy broth. With rice, about 70% of a regular bowl.'],
  ['en', 'F03', 'Signature', 'Snow flower flank tartare', 'Flank, for its clear grain and deep beef flavour, arranged like petals under grated Grana Padano or Parmigiano. Mix in the yolk and our sweet-savoury Korean seasoning.'],
  ['ko', 'F12', '찌개', '김치찌개', '직접 담근 김치에 돼지고기와 두부를 넣어 끓였어요. 새콤하고 매콤해요.'],
  ['ko', 'F18', '사이드 메뉴', '치즈 인절미 튀김', '겉은 바삭하고 속에는 치즈가 쭉 늘어나요. 볶은 콩가루를 뿌렸어요.'],
  ['ko', 'F09', '면·파스타', '비프 토마토 파스타', '다진 소고기를 넣고 진하게 끓인 토마토소스 파스타예요.'],
];

await nhom('4 · CHẠY ĐÚNG CÁC KHỐI SQL CỦA web/THUC-DON.md (PGlite, vai anon như trang thật)', async () => {
  const CAN = ['kiem-danh-muc', 'xem',
    ...NHOM_AN.map(([n]) => `mo-ta-${n}`), 'mo-ta-signature', 'canh-bao',
    ...NHOM_AN.map(([n]) => `cong-bo-${n}`), 'cong-bo-signature',
    'bat-thuc-don', 'phien-ban', 'bat-do-uong-co-con', 'tat-do-uong-co-con', 'kiem', 'thu-hoi-mon', 'tat-thuc-don'];
  ok(`THUC-DON.md có đúng ${CAN.length} khối SQL đánh dấu <!-- sql:… -->, đúng thứ tự chạy`,
     JSON.stringify(Object.keys(KHOI)) === JSON.stringify(CAN),
     `thiếu: ${CAN.filter(k => !KHOI[k]).join(', ')} · thừa: ${Object.keys(KHOI).filter(k => !CAN.includes(k)).join(', ')}`);
  if (CAN.some(k => !KHOI[k])) return;
  const tatCaSql = Object.values(KHOI).join('\n');
  ok('Hướng dẫn KHÔNG đặt giá, không duyệt giá (gia / gia_de_xuat / gia_da_duyet)',
     !/\bgia(_de_xuat|_da_duyet|_duyet_luc)?\s*=/.test(tatCaSql), tatCaSql.match(/\bgia\w*\s*=.*/)?.[0]);
  ok('Hướng dẫn không duyệt độ cay (muc_cay / muc_cay_da_duyet)', !/\bmuc_cay(_da_duyet)?\s*=/.test(tatCaSql));
  ok('Hướng dẫn không xóa dòng nào (thu hồi bằng trạng thái, giữ lại để truy vết)', !/\bdelete\b|\btruncate\b|\bdrop\b/i.test(tatCaSql));
  const maCongBo = Object.entries(KHOI).filter(([k]) => k.startsWith('cong-bo-'))
    .flatMap(([, sql]) => [...sql.matchAll(/'([FDS]\d\d)'/g)].map(m => m[1]));
  ok('Khối công bố chỉ gồm 22 món ăn và 3 ly signature — không đồ uống dạng danh sách, không món đã thu hồi',
     JSON.stringify([...maCongBo].sort()) === JSON.stringify([...THU_TU_MON_AN, ...SIGNATURE].sort()), maCongBo.join(','));
  for (const [n, ma] of NHOM_AN) {
    const trongKhoi = [...KHOI[`mo-ta-${n}`].matchAll(/where ma = '([FDS]\d\d)'/g)].map(m => m[1]);
    ok(`Khối mo-ta-${n} và cong-bo-${n} nói về đúng các món ${ma.join(', ')}`,
       JSON.stringify(trongKhoi) === JSON.stringify(ma) && ma.every(m => KHOI[`cong-bo-${n}`].includes(`'${m}'`)), trongKhoi.join(','));
  }

  const { db, duoiAnon } = await dungDatabase();
  const chay = async ten => { await db.exec(KHOI[ten]); };
  const COT = 'nhom_ma, nhom_ten, nhom_loai, xem_gia_tai_quay, mon_ma, ten, mo_ta, gia, muc_cay, co_con, la_mon_song, canh_bao, khau_phan, phien_ban, cap_nhat_ngay';
  /** Đúng như trang gọi: vai anon, và ngày là chuỗi như PostgREST trả về. */
  const xem = async (nn = 'vi') => {
    const r = await duoiAnon(`select ${COT.replace('cap_nhat_ngay', 'cap_nhat_ngay::text as cap_nhat_ngay')} from thuc_don_cong_khai($1)`, [nn]);
    if (r.loi) throw new Error(`anon gọi thuc_don_cong_khai lỗi: ${r.loi}`);
    return r.rows;
  };
  const ma = rows => rows.map(r => r.mon_ma).join(',');
  const trangThai = async m => (await db.query(`select trang_thai from mon_an where ma = $1`, [m])).rows[0]?.trang_thai;

  const tuDau = await xem();
  ok('Database vừa cài (đủ migration, có 0091): anon gọi được thuc_don_cong_khai, thực đơn rỗng', tuDau.length === 0, `${tuDau.length} món`);

  // ---- Bước 0 · Bước 1 -------------------------------------------------------
  const { rows: [dm] } = await db.query(KHOI['kiem-danh-muc']);
  ok('Khối "kiem-danh-muc" ra đúng 17 nhóm dùng · 3 nhóm tắt · 42 món còn dùng · 10 món thu hồi · 0 món công bố',
     [dm.nhom_dang_dung, dm.nhom_da_tat, dm.mon_con_dung, dm.mon_da_thu_hoi, dm.mon_da_cong_bo].map(Number).join() === '17,3,42,10,0',
     JSON.stringify(dm));

  const maXem = rows => rows.map(r => r.ma).join(',');
  let rXem = (await db.query(KHOI.xem)).rows;
  ok('Khối "xem": 42 món còn dùng, theo thứ tự của cuốn, đều "Chưa có mô tả", kèm bản nháp và điều cần xác nhận',
     maXem(rXem) === [...THU_TU_MON_AN, ...SIGNATURE, ...DANH_SACH_UONG].join() && rXem.every(r => r.vuong_gi === 'Chưa có mô tả')
       && 'copy_nhap' in rXem[0] && 'can_xac_nhan' in rXem[0],
     maXem(rXem));
  ok('Khối "xem" không liệt kê món đã thu hồi', !rXem.some(r => THU_HOI.includes(r.ma)));

  // ---- Bước 2 · mô tả theo nhóm --------------------------------------------
  for (const [n] of NHOM_AN) await chay(`mo-ta-${n}`);
  await chay('mo-ta-signature');
  const { rows: moTa } = await db.query(`
    select ma, mo_ta_vi, mo_ta_en, mo_ta_ko, copy_nhap, nguyen_van_nguon from mon_an where mo_ta_vi is not null order by ma`);
  ok('Sau Bước 2: đúng 25 món có mô tả (22 món ăn, 3 ly signature)',
     JSON.stringify(moTa.map(r => r.ma)) === JSON.stringify([...THU_TU_MON_AN, ...SIGNATURE].sort()), moTa.map(r => r.ma).join(','));
  const lechVi = moTa.filter(r => r.mo_ta_vi !== r.copy_nhap).map(r => r.ma);
  const lechEn = moTa.filter(r => r.mo_ta_en !== r.nguyen_van_nguon).map(r => r.ma);
  ok('Mô tả tiếng Việt của hướng dẫn trùng từng chữ với chữ của cuốn trong migration 0091 (copy_nhap)', lechVi.length === 0, lechVi.join(','));
  ok('Mô tả tiếng Anh của hướng dẫn trùng từng chữ với chữ của cuốn trong migration 0091 (nguyen_van_nguon)', lechEn.length === 0, lechEn.join(','));
  ok('Mô tả tiếng Hàn có đủ cho 25 món và là chữ Hàn', moTa.every(r => /[가-힣]/.test(r.mo_ta_ko ?? '')));

  rXem = (await db.query(KHOI.xem)).rows;
  const vuong = Object.fromEntries(rXem.map(r => [r.ma, r.vuong_gi]));
  ok('Sau Bước 2, khối "xem": F03, F19 "Món sống nhưng chưa có cảnh báo"; 17 đồ uống dạng danh sách vẫn "Chưa có mô tả"',
     vuong.F03 === 'Món sống nhưng chưa có cảnh báo' && vuong.F19 === 'Món sống nhưng chưa có cảnh báo'
       && rXem.filter(r => r.vuong_gi === 'Chưa có mô tả').map(r => r.ma).join() === DANH_SACH_UONG.join(),
     JSON.stringify(vuong));
  const loiSong = await db.query(KHOI['cong-bo-dac-trung']).then(() => null, e => e.message);
  ok('Công bố nhóm Món đặc trưng TRƯỚC Bước 3 → database từ chối cả khối, không món nào đổi',
     /mon_an_cong_bo_phai_sach/.test(loiSong ?? '') && (await trangThai('F03')) === 'nhap' && (await trangThai('F19')) === 'nhap', loiSong ?? 'CÔNG BỐ ĐƯỢC');

  // ---- Bước 3 · cảnh báo món sống -------------------------------------------
  await chay('canh-bao');
  const { rows: song } = await db.query(`select ma, canh_bao, canh_bao_en, canh_bao_ko from mon_an where la_mon_song order by ma`);
  ok('Đúng hai món sống (F03, F19), câu cảnh báo đúng từng chữ ở ba thứ tiếng',
     song.map(r => r.ma).join() === 'F03,F19'
       && song.every(r => r.canh_bao === CANH_BAO.vi && r.canh_bao_en === CANH_BAO.en && r.canh_bao_ko === CANH_BAO.ko),
     JSON.stringify(song));

  // ---- Bước 4 · công bố từng nhóm -------------------------------------------
  for (const [n] of NHOM_AN) await chay(`cong-bo-${n}`);
  await chay('cong-bo-signature');
  ok('Đã công bố 25 món nhưng chưa bật hien_thuc_don → trang vẫn chưa thấy món nào', (await xem()).length === 0);
  const loiDanhSach = await db.query(`update mon_an set trang_thai = 'da_cong_bo' where ma = 'D02'`).then(() => null, e => e.message);
  ok('Đồ uống dạng danh sách (D02, chưa có mô tả) KHÔNG công bố được — database đòi mo_ta_vi',
     /mon_an_cong_bo_phai_sach/.test(loiDanhSach ?? '') && (await trangThai('D02')) === 'nhap', loiDanhSach ?? 'CÔNG BỐ ĐƯỢC');

  // ---- Bước 5 · bật thực đơn, phiên bản ---------------------------------------
  await chay('bat-thuc-don');
  const trang = {};
  for (const nn of ['vi', 'en', 'ko']) trang[nn] = await xem(nn);
  for (const nn of ['vi', 'en', 'ko']) {
    ok(`[${nn}] Bật thực đơn → đúng 22 món ăn, theo thứ tự nhóm và món của cuốn; ba ly signature (có cồn) còn ẩn`,
       ma(trang[nn]) === THU_TU_MON_AN.join(), ma(trang[nn]));
  }
  const vi = trang.vi;
  ok('Mọi món đều có gia = null và muc_cay = null (chưa duyệt giá, chưa duyệt độ cay)',
     vi.length > 0 && vi.every(r => r.gia === null && r.muc_cay === null), JSON.stringify(vi.map(r => [r.gia, r.muc_cay])));
  ok(`thuc_don_cong_khai trả đúng ${COT_DONG_THUC_DON.length} cột của DongThucDon (web/src/lib/thuc-don.ts)`,
     COT_DONG_THUC_DON.length === 15 && JSON.stringify(Object.keys(vi[0] ?? {}).sort()) === JSON.stringify([...COT_DONG_THUC_DON].sort()),
     `${Object.keys(vi[0] ?? {}).join(',')} ↔ ${COT_DONG_THUC_DON.join(',')}`);
  for (const [nn, m, nhomTen, ten, moTaMau] of MAU) {
    const r = trang[nn].find(x => x.mon_ma === m);
    ok(`[${nn}] ${m}: tên nhóm, tên món, mô tả đúng từng chữ của cuốn`,
       r?.nhom_ten === nhomTen && r?.ten === ten && r?.mo_ta === moTaMau, JSON.stringify([r?.nhom_ten, r?.ten, r?.mo_ta]));
  }
  for (const nn of ['vi', 'en', 'ko']) {
    const s = trang[nn].filter(r => r.la_mon_song);
    ok(`[${nn}] Đúng F03, F19 là món sống, câu cảnh báo đúng thứ tiếng của trang`,
       ma(s) === 'F03,F19' && s.every(r => r.canh_bao === CANH_BAO[nn]), JSON.stringify(s.map(r => [r.mon_ma, r.canh_bao])));
  }
  ok('Trang tiếng Hàn: tên nhóm, tên món, mô tả đều là chữ Hàn',
     trang.ko.every(r => /[가-힣]/.test(r.ten) && /[가-힣]/.test(r.nhom_ten) && /[가-힣]/.test(r.mo_ta)),
     JSON.stringify(trang.ko.filter(r => !/[가-힣]/.test(r.ten + r.nhom_ten + r.mo_ta)).map(r => r.mon_ma)));
  // Chỉ chữ riêng của tiếng Việt (ă â đ ê ô ơ ư và khối dấu chồng U+1EA0–U+1EF9): "soufflé" của cuốn là chữ Pháp, hợp lệ.
  const chuViet = /[ăâđêôơưĂÂĐÊÔƠƯ\u1EA0-\u1EF9]/;
  const lotViet = trang.en.filter(r => chuViet.test([r.nhom_ten, r.ten, r.mo_ta, r.canh_bao].join(' ')));
  ok('Trang tiếng Anh: không còn chữ Việt có dấu', lotViet.length === 0, lotViet.map(r => r.mon_ma).join(','));
  const chuTrang = Object.values(trang).flat()
    .map(r => [r.nhom_ten, r.ten, r.mo_ta, r.canh_bao].filter(Boolean).join(' · ')).join('\n');
  const cam = timChuoiCam(chuTrang);
  ok('Mọi chữ thực đơn sau khi chạy hướng dẫn: không chữ cấm (số tiền, so sánh nhất, than…)', cam.length === 0, cam.map(c => c.tim_thay).join(' | '));

  // Dòng database → thư viện của trang: cầu nối giữa hai đầu.
  const td = nhomThucDon(vi);
  ok('Dòng thật của database qua nhomThucDon: đủ 22 món ăn đúng thứ tự, không đồ uống, mọi giá null',
     tatCaMon(td).map(m => m.ma).join() === THU_TU_MON_AN.join() && td.doUong.length === 0 && tatCaMon(td).every(m => m.gia === null),
     tatCaMon(td).map(m => m.ma).join());
  ok('Chưa bật rượu → coDoUongCoCon = false (trang không hiện dòng luật rượu)', td.coDoUongCoCon === false);

  await chay('phien-ban');
  const pb = (await xem())[0];
  ok('Khối "phien-ban" → trang có phiên bản v2.0, ngày cập nhật 11/10/2026', pb?.phien_ban === 'v2.0' && pb?.cap_nhat_ngay === '2026-10-11',
     JSON.stringify([pb?.phien_ban, pb?.cap_nhat_ngay]));

  await chay('bat-do-uong-co-con');
  let rows = await xem();
  ok('Bật hien_do_uong_co_con → ba ly signature hiện sau món ăn, đánh dấu có cồn',
     ma(rows) === [...THU_TU_MON_AN, ...SIGNATURE].join() && rows.filter(r => r.co_con).map(r => r.mon_ma).join() === SIGNATURE.join(), ma(rows));
  ok('Thư viện của trang thấy có đồ uống có cồn', nhomThucDon(rows).coDoUongCoCon === true);
  ok('Mọi công tắc bật: 17 đồ uống dạng danh sách và 10 món thu hồi vẫn không hiện',
     !rows.some(r => DANH_SACH_UONG.includes(r.mon_ma) || THU_HOI.includes(r.mon_ma)));

  // ---- Chạy lại từng khối lần hai: không lỗi, không đổi gì --------------------
  const chup = async () => JSON.stringify(await Promise.all(['vi', 'en', 'ko'].map(xem)));
  const truoc = await chup();
  const GHI = CAN.filter(k => !['tat-do-uong-co-con', 'thu-hoi-mon', 'tat-thuc-don'].includes(k));
  const loiChayLai = [];
  for (const k of GHI) await chay(k).catch(e => loiChayLai.push(`${k}: ${e.message}`));
  ok(`Chạy lại ${GHI.length} khối (mọi khối trừ ba khối gỡ) lần hai → không khối nào lỗi`, loiChayLai.length === 0, loiChayLai.join(' | '));
  ok('…và ba trang ra y hệt lần đầu (từng món, từng chữ)', (await chup()) === truoc);
  const { rows: [{ n: soDangCongBo }] } = await db.query(
    `select count(*)::int as n from noi_dung_cong_bo where khoa in ('hien_thuc_don', 'hien_do_uong_co_con') and trang_thai = 'da_cong_bo'`);
  ok('…mỗi công tắc vẫn đúng một bản đang công bố', soDangCongBo === 2, `${soDangCongBo} bản`);
  const { rows: [{ n: soPhienBan }] } = await db.query(`select count(*)::int as n from phien_ban_thuc_don where dang_dung`);
  ok('…và đúng một phiên bản thực đơn đang dùng', soPhienBan === 1, `${soPhienBan}`);

  // ---- Gỡ -------------------------------------------------------------------
  await chay('tat-do-uong-co-con');
  ok('Tắt công tắc rượu → ba ly signature ẩn lại, dữ liệu còn nguyên', ma(await xem()) === THU_TU_MON_AN.join()
     && (await trangThai('D01')) === 'da_cong_bo');

  const rKiem = await db.query(KHOI.kiem);
  ok('Khối "kiem" chạy được: 22 dòng, cột gia rỗng ở mọi dòng', rKiem.rows.length === 22 && rKiem.rows.every(r => r.gia === null), `${rKiem.rows.length} dòng`);

  await chay('thu-hoi-mon');
  ok('SQL thu hồi một món → F03 biến mất khỏi trang, món khác còn',
     ma(await xem()) === THU_TU_MON_AN.filter(m => m !== 'F03').join(), ma(await xem()));
  ok('Món thu hồi vẫn còn trong database (trạng thái da_thu_hoi), không bị xóa', (await trangThai('F03')) === 'da_thu_hoi');
  ok('Món vừa thu hồi rời khối "xem" (không thành "món còn vướng")', !(await db.query(KHOI.xem)).rows.some(r => r.ma === 'F03'));

  await chay('cong-bo-dac-trung');
  ok('Công bố lại (chạy lại khối công bố của nhóm) → F03 trở lại đúng chỗ', ma(await xem()) === THU_TU_MON_AN.join());

  await chay('tat-thuc-don');
  ok('SQL tắt thực đơn → mọi món biến mất khỏi trang (vi, en, ko)',
     (await xem('vi')).length === 0 && (await xem('en')).length === 0 && (await xem('ko')).length === 0);
  ok('Món vẫn ở trạng thái đã công bố — bật lại công tắc là hiện lại',
     (await db.query(`select count(*)::int as n from mon_an where trang_thai = 'da_cong_bo'`)).rows[0].n === 25);
  ok('Mười món không có trong cuốn vẫn ở da_thu_hoi sau mọi khối',
     (await db.query(`select count(*)::int as n from mon_an where ma = any($1) and trang_thai = 'da_thu_hoi'`, [THU_HOI])).rows[0].n === 10);

  // ---- Quyền: hàm thì gọi được, bảng thì không ---------------------------
  for (const bang of ['mon_an', 'nhom_mon', 'phien_ban_thuc_don']) {
    const r = await duoiAnon(`select * from ${bang} limit 1`);
    ok(`anon select thẳng bảng ${bang} → bị từ chối`, r.loi !== null && /permission denied/i.test(r.loi), r.loi ?? `đọc được ${r.rows?.length} dòng`);
  }
  const sua = await duoiAnon(`update mon_an set trang_thai = 'da_cong_bo' where ma = 'D02'`);
  ok('anon không tự công bố được món', sua.loi !== null, sua.loi ?? 'SỬA ĐƯỢC');
});

process.exit(ketThuc('THỰC ĐƠN TRÊN TRANG CÔNG KHAI'));
