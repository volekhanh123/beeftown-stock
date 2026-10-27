/**
 * BEEFTOWN — CÀI ĐẶT BÁN LẺ: THƯ VIỆN WEB VÀ TRANG (/noi-bo/ban-le/cai-dat, 0102)
 * ==============================================================================
 *
 *     node test/test-ban-le-cai-dat-web.mjs
 *
 * Database của cài đặt (bảng ban_le_co_goi, ban_le_cai_dat, ban_le_luu_co_goi, p_so_gam của ban_le_tao_san_pham) kiểm
 * ở test-ban-le-cai-dat.mjs (nhóm 1 – 4, 8). File này kiểm phần web nối vào đó — TypeScript THẬT của
 * web/src/lib/ban-le-noi-bo.ts chạy trên database thật (PGlite, RLS thật, client giả taoClientPg), cùng khuôn với
 * test-ban-le-web.mjs. Bất biến:
 *
 *   5. Thư viện web:
 *      · docCaiDat: khóa trả về = khóa của kiểu CaiDatBanLe / CoGoi = khóa JSON của ban_le_cai_dat(); vai không xem
 *        được menu → ném, cauLoiDoc ra đúng câu của database (vi, en).
 *      · docFormCoGoi (hàm thuần): bỏ dòng "Bỏ khỏi danh sách", dòng mới trống bỏ qua, "1.000" là một nghìn
 *        (1000 g), "1,5" / "abc" / "49" / "5001" bị từ chối bằng một câu vi / en; trùng cỡ → "Cỡ gói N g nhập hai
 *        lần." (cùng chữ với câu của database, gam không dấu ngăn nghìn); form hỏng (thiếu số dòng, việc lạ, ô ẩn bị
 *        sửa) → "Danh sách cỡ gói không hợp lệ — tải lại trang."; lỗi của người gõ không bao giờ tới database.
 *      · luuCoGoi: "Đã lưu cỡ gói." chỉ khi database trả ok; lưu mà không đổi gì → "Không có gì thay đổi."; bấm đúp
 *        (lần hai mang phiên bản cũ, database đã đúng như gửi) → "Đã lưu cỡ gói.", không "người khác sửa"; người
 *        khác vừa sửa khác đi → câu người khác sửa, KHÔNG BAO GIỜ "Đã lưu"; thu ngân, marketing → câu của database.
 *      · taoSanPham: thịt có co_goi_ds → p_so_gam = các cỡ chọn "Bán" (kể cả rỗng, kể cả cỡ vừa tắt); cỡ lạ bỏ qua;
 *        kim chi và form cũ không có co_goi_ds → không gửi p_so_gam (database dùng cài đặt). Bấm hai lần cùng
 *        ma_gui với lựa chọn khác → một sản phẩm, gói theo lần đầu.
 *      · Không còn GOI_MAC_DINH; nhãn kiểu thịt không liệt kê cỡ.
 *   6. mat-mang: client ném TypeError('fetch failed') hay trả lỗi đó, dịch vụ trả 500, trả rỗng → không bao giờ
 *      "Đã lưu"; mất mạng → CAU_MAT_MANG_GHI (vi, en).
 *   7. Trang (đọc mã nguồn): cai-dat.astro, index.astro, [id].astro — không JavaScript, không ô đánh dấu / chọn một,
 *      không type="number"; một Astro.redirect('/noi-bo', 302) sau kiểm VAI_XEM_BAN_LE; POST qua docFormNoiBo, ghi
 *      được thì chuyenHuongNoiBo; ô ẩn phiên bản từ lần đọc mới; một select "Bán / Không bán" cho mỗi cỡ; link Cài
 *      đặt bán lẻ; mọi chữ là cặp { vi, en } qua dichNB; trang mới có trong sổ đăng ký của các kiểm thử chung.
 *   8. ton-kho: cuối file kho_doi_soat_ton() rỗng.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dungDatabase, taoBoDem, taoClientPg, UID, maGui } from './kho-chung.mjs';
import { quetChuViet } from './quet-chu-viet.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
/** Mã nguồn một file (tính từ web/src hay từ gốc repo); chưa có file thì chuỗi rỗng — kiểm thử đỏ, không sập. */
const docNguon = (f, goc = SRC) => (existsSync(join(goc, f)) ? readFileSync(join(goc, f), 'utf8') : '');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — CÀI ĐẶT BÁN LẺ: THƯ VIỆN WEB VÀ TRANG');

const BL = await nap('ban-le-noi-bo.ts');
const { CAU_MAT_MANG_GHI } = await nap('qua-tai.ts');
const { dichCau } = await nap('cau-noi-bo.ts');
const { db, duoi, duoiAnon } = await dungDatabase();
const clientCua = await taoClientPg({ db, duoi, duoiAnon });

const CHU = clientCua(UID.chu);
const QL = clientCua(UID.qlA);
const TN = clientCua(UID.thuNganA);
const MKT = clientCua(UID.mktA);
const KT = clientCua(UID.keToanA);
const ANON = clientCua('anon');

const CAU = {
  daLuu:     { vi: 'Đã lưu cỡ gói.', en: 'Pack sizes saved.' },
  khongDoi:  { vi: 'Không có gì thay đổi.', en: 'Nothing changed.' },
  daDung:    { vi: 'Danh sách cỡ gói đã đúng như bạn chọn.', en: 'The pack sizes already match your choices.' },
  nguoiKhac: { vi: 'Người khác vừa sửa cỡ gói — xem danh sách mới rồi lưu lại.',
               en: 'Someone else just changed the pack sizes — check the new list, then save again.' },
  coSai:     { vi: 'Cỡ gói phải là số gam từ 50 đến 5.000.', en: 'A pack size must be a whole number of grams from 50 to 5,000.' },
  trung:     { vi: n => `Cỡ gói ${n} g nhập hai lần.`, en: n => `Pack size ${n} g is entered twice.` },
  dsHong:    { vi: 'Danh sách cỡ gói không hợp lệ — tải lại trang.', en: 'Invalid pack size list — reload the page.' },
  sua:       { vi: 'Chỉ chủ và quản lý được sửa menu bán lẻ.', en: 'Only the owner and managers can edit the retail menu.' },
  xem:       { vi: 'Tài khoản này không xem được menu bán lẻ.', en: 'This account cannot view the retail menu.' },
  quaDangDung: { vi: 'Tối đa 20 cỡ gói đang dùng — một sản phẩm có tối đa 20 gói.',
                 en: 'At most 20 pack sizes can be in use — a product can have at most 20 packs.' },
};

const giongNhau = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sapXep = a => JSON.stringify([...a].sort());
const co = (soGam, dangDung = true) => ({ so_gam: soGam, dang_dung: dangDung });
/** Có chữ "Đã lưu" ở đầu câu — câu không bao giờ được nói khi database chưa trả ok. */
const noiDaLuu = cau => /^(Đã lưu|Saved|Pack sizes saved)/i.test(String(cau ?? ''));

/** Form tự dựng từ một FormData phẳng. */
function formTu(o) {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v == null ? '' : String(v));
  return f;
}

/**
 * Form Cài đặt bán lẻ đúng như cai-dat.astro dựng từ một lần đọc (phien_ban, so_dong_cg, cg_i_so_gam ẩn, select
 * cg_i_viec theo trạng thái, các ô cỡ mới trống — không quá SO_CO_GOI_TOI_DA dòng), rồi đè những ô trong `doi`.
 */
function formCaiDat(cd, doi = {}) {
  const o = { viec: 'luu', phien_ban: cd.phien_ban, so_dong_cg: cd.co_goi.length };
  cd.co_goi.forEach((c, i) => {
    o[`cg_${i}_so_gam`] = c.so_gam;
    o[`cg_${i}_viec`] = o[`cg_${i}_viec_goc`] = c.dang_dung ? 'dung' : 'tat';
  });
  const soMoi = Math.max(0, Math.min(BL.SO_DONG_CO_GOI_MOI, BL.SO_CO_GOI_TOI_DA - cd.co_goi.length));
  for (let j = 0; j < soMoi; j++) o[`cg_moi_${j}`] = '';
  return formTu({ ...o, ...doi });
}
/** Ô việc của một cỡ đang có trong form (theo số gam). */
const viecCua = (cd, soGam, viec) => ({ [`cg_${cd.co_goi.findIndex(c => c.so_gam === soGam)}_viec`]: viec });

/** Client giả ghi lại mọi lời gọi rpc — để biết thư viện có gọi database không, và gửi gì. */
function clientGhi(traVe = { data: null, error: { message: 'không được gọi tới đây' } }) {
  const goi = [];
  return { goi, rpc: async (ten, tham) => { goi.push({ ten, tham }); return typeof traVe === 'function' ? traVe(ten, tham) : traVe; } };
}

const bangCo = async () => (await db.query(`select so_gam, dang_dung, nguoi_sua, updated_at::text as u from ban_le_co_goi order by so_gam`)).rows;
const coCua = rows => rows.map(r => co(r.so_gam, r.dang_dung));
const goiCua = async id => (await db.query(`select so_gam from ban_le_goi where san_pham_id = $1 order by so_gam`, [id])).rows.map(r => r.so_gam);
const demSanPham = async () => (await db.query(`select count(*)::int n from ban_le_san_pham`)).rows[0].n;

/** Khóa của một interface (nhiều dòng hoặc một dòng) trong lib/ban-le-noi-bo.ts, bỏ dấu ? của khóa tùy chọn. */
const NGUON_LIB = docNguon('lib/ban-le-noi-bo.ts');
const khoaKieu = ten => {
  const than = NGUON_LIB.match(new RegExp(`export interface ${ten} \\{([^}]*)\\}`))?.[1] ?? '';
  return [...than.matchAll(/(?:^|[\s;{])([a-z_]+)\??:/g)].map(m => m[1]);
};

// ===========================================================================
await nhom('5a · Thư viện: không còn GOI_MAC_DINH, nhãn kiểu thịt không liệt kê cỡ, docCaiDat khớp database', async () => {
  ok('Không còn hằng GOI_MAC_DINH (cỡ gói mặc định nằm ở Cài đặt bán lẻ, không làm cứng ở web)',
     !('GOI_MAC_DINH' in BL) && !/GOI_MAC_DINH/.test(NGUON_LIB));
  const thit = BL.KIEU_SAN_PHAM.find(k => k.ma === 'thit|theo_can');
  ok('Nhãn kiểu thịt: "Thịt bò — quầy cân theo gram, online bán theo gói" (vi), "Beef — weighed by the gram at the counter, sold online in packs" (en)',
     thit?.ten.vi === 'Thịt bò — quầy cân theo gram, online bán theo gói'
     && thit?.ten.en === 'Beef — weighed by the gram at the counter, sold online in packs', JSON.stringify(thit?.ten));
  ok('…không nhãn kiểu nào còn số gam (200 g / 400 g)', BL.KIEU_SAN_PHAM.every(k => !/\d+\s*g\b/.test(k.ten.vi) && !/\d+\s*g\b/.test(k.ten.en)));
  ok('Chú thích đầu thư viện không còn "gói cố định 200 g / 400 g"', !/200 g \/ 400 g/.test(NGUON_LIB));
  ok('Hằng giới hạn của form cài đặt: 3 ô cỡ mới, tối đa 30 dòng (cùng database)', BL.SO_DONG_CO_GOI_MOI === 3 && BL.SO_CO_GOI_TOI_DA === 30);

  const cd = await BL.docCaiDat(TN);
  ok('Thu ngân đọc được cài đặt: 200 g, 400 g đang dùng (gieo của 0102), phiên bản là chuỗi',
     giongNhau(cd?.co_goi, [co(200), co(400)]) && typeof cd?.phien_ban === 'string' && cd.phien_ban.length > 0, JSON.stringify(cd));
  const tho = (await duoi(UID.chu, `select ban_le_cai_dat() as r`)).rows[0]?.r;
  ok('Khóa của CaiDatBanLe = khóa JSON của ban_le_cai_dat() = khóa docCaiDat trả về',
     sapXep(khoaKieu('CaiDatBanLe')) === sapXep(Object.keys(tho ?? {})) && sapXep(Object.keys(cd ?? {})) === sapXep(Object.keys(tho ?? {})),
     `${khoaKieu('CaiDatBanLe')} · ${Object.keys(tho ?? {})}`);
  ok('Khóa của CoGoi = khóa mỗi cỡ của ban_le_cai_dat()',
     (tho?.co_goi ?? []).length > 0 && tho.co_goi.every(x => sapXep(khoaKieu('CoGoi')) === sapXep(Object.keys(x))),
     `${khoaKieu('CoGoi')} · ${JSON.stringify(tho?.co_goi?.[0])}`);
  ok('…so_gam là số (không chuỗi), dang_dung là boolean', cd?.co_goi?.every(x => typeof x.so_gam === 'number' && typeof x.dang_dung === 'boolean'));

  for (const [ai, client, cau] of [['Kế toán', KT, CAU.xem], ['Chưa đăng nhập (anon)', ANON, null]]) {
    let loi = null;
    try { await BL.docCaiDat(client); } catch (e) { loi = e; }
    const vi = BL.cauLoiDoc(loi, 'vi'), en = BL.cauLoiDoc(loi, 'en');
    ok(`${ai} đọc cài đặt → ném; cauLoiDoc ra câu ${cau ? 'của database' : '"không có quyền"'} (vi, en)`,
       loi !== null && (cau ? vi === cau.vi && en === cau.en
                            : vi === 'Tài khoản của bạn không có quyền làm việc này.' && en === 'Your account is not allowed to do this.'),
       `${vi} · ${en}`);
  }
});

// ===========================================================================
await nhom('5b · docFormCoGoi: bỏ dòng "Bỏ", dòng trống bỏ qua, "1.000" là một nghìn, sai / trùng → câu vi / en', async () => {
  const cd = { phien_ban: 'pb', co_goi: [co(200), co(400)] };
  const doc = (doi, nn = 'vi') => BL.docFormCoGoi(formCaiDat(cd, doi), nn);

  const giu = doc({});
  ok('Form không sửa gì → đúng danh sách đang có, không lỗi', giu.loi === null && giongNhau(giu.coGoi, [co(200), co(400)]), JSON.stringify(giu));
  const doi = doc({ ...viecCua(cd, 200, 'bo'), ...viecCua(cd, 400, 'tat'), cg_moi_0: '1.000', cg_moi_1: '', cg_moi_2: ' 300 ' });
  ok('Bỏ 200, tắt 400, thêm "1.000" và " 300 " (ô giữa trống) → 300 (dùng), 400 (tắt), 1000 (dùng), theo gam tăng dần',
     doi.loi === null && giongNhau(doi.coGoi, [co(300), co(400, false), co(1000)]), JSON.stringify(doi));
  ok('"1.000" là một nghìn gam (1000), "1 000" cũng vậy',
     giongNhau(doc({ cg_moi_0: '1.000' }).coGoi, [co(200), co(400), co(1000)])
     && giongNhau(doc({ cg_moi_0: '1 000' }).coGoi, [co(200), co(400), co(1000)]));
  ok('Ô cỡ mới chỉ có khoảng trắng → bỏ qua như ô trống', giongNhau(doc({ cg_moi_0: '   ', cg_moi_2: '' }).coGoi, [co(200), co(400)]));
  ok('Bỏ hết cỡ → danh sách rỗng (được phép: thịt mới chưa có gói)',
     giongNhau(doc({ ...viecCua(cd, 200, 'bo'), ...viecCua(cd, 400, 'bo') }).coGoi, []));
  ok('Danh sách đang rỗng, thêm 500 → [500]', giongNhau(BL.docFormCoGoi(formCaiDat({ phien_ban: 'x', co_goi: [] }, { cg_moi_0: '500' }), 'vi').coGoi, [co(500)]));
  ok('Hai biên 50 g và 5000 g nhận', giongNhau(doc({ cg_moi_0: '50', cg_moi_1: '5000' }).coGoi, [co(50), co(200), co(400), co(5000)]));

  for (const x of ['1,5', 'abc', '49', '5001', '1.5', '-200', '0', '300g', '1kg']) {
    const vi = doc({ cg_moi_1: x }), en = doc({ cg_moi_1: x }, 'en');
    ok(`Cỡ mới "${x}" → "${CAU.coSai.vi}" / "${CAU.coSai.en}", không danh sách`,
       vi.loi === CAU.coSai.vi && en.loi === CAU.coSai.en && vi.coGoi === null, `${vi.loi} · ${en.loi}`);
  }
  for (const [ten, d, n] of [['dòng mới trùng cỡ đang có (200)', { cg_moi_0: '200' }, 200],
                             ['dòng mới trùng cỡ đang có dù cỡ đó chọn "Bỏ" (400)', { ...viecCua(cd, 400, 'bo'), cg_moi_2: '400' }, 400],
                             ['hai dòng mới trùng nhau (300, 300)', { cg_moi_0: '300', cg_moi_1: '300' }, 300],
                             ['"1000" và "1.000"', { cg_moi_0: '1000', cg_moi_2: '1.000' }, 1000]]) {
    const vi = doc(d), en = doc(d, 'en');
    ok(`Trùng — ${ten} → "${CAU.trung.vi(n)}" / "${CAU.trung.en(n)}" (gam không dấu ngăn nghìn)`,
       vi.loi === CAU.trung.vi(n) && en.loi === CAU.trung.en(n) && vi.coGoi === null, `${vi.loi} · ${en.loi}`);
  }
  ok('Câu trùng của web là đúng câu của database (dichCau vi / en ra cùng chữ)',
     CAU.trung.vi(1000) === dichCau('vi', 'Cỡ gói 1000 g nhập hai lần.') && CAU.trung.en(1000) === dichCau('en', 'Cỡ gói 1000 g nhập hai lần.'));

  // Form hỏng: chỉ xảy ra khi trang cũ / bị sửa tay — không đoán, bảo tải lại trang.
  for (const [ten, f] of [
    ['thiếu ô số dòng (so_dong_cg)', (() => { const x = formCaiDat(cd); x.delete('so_dong_cg'); return x; })()],
    ['số dòng không phải số', formCaiDat(cd, { so_dong_cg: 'hai' })],
    ['số dòng quá 40', formCaiDat(cd, { so_dong_cg: '41' })],
    ['việc lạ ("xoa")', formCaiDat(cd, viecCua(cd, 200, 'xoa'))],
    ['thiếu ô việc', (() => { const x = formCaiDat(cd); x.delete('cg_1_viec'); return x; })()],
    ['ô ẩn số gam bị sửa thành chữ', formCaiDat(cd, { cg_0_so_gam: 'abc' })],
    ['ô ẩn số gam ngoài khoảng', formCaiDat(cd, { cg_0_so_gam: '9000' })],
    ['hai dòng đang có cùng số gam', formCaiDat(cd, { cg_1_so_gam: '200' })],
  ]) {
    const vi = BL.docFormCoGoi(f, 'vi'), en = BL.docFormCoGoi(f, 'en');
    ok(`Form hỏng — ${ten} → "${CAU.dsHong.vi}" (vi, en)`, vi.loi === CAU.dsHong.vi && en.loi === CAU.dsHong.en && vi.coGoi === null,
       `${vi.loi} · ${en.loi}`);
  }

  // Lỗi của người gõ không bao giờ tới database
  const gian = clientGhi();
  const r1 = await BL.luuCoGoi(gian, formCaiDat(cd, { cg_moi_0: '1,5' }), 'vi');
  const r2 = await BL.luuCoGoi(gian, formCaiDat(cd, { phien_ban: '' }), 'vi');
  const r3 = await BL.luuCoGoi(gian, formCaiDat(cd, { cg_moi_0: '200' }), 'en');
  ok('luuCoGoi: cỡ sai, thiếu phiên bản, trùng cỡ → báo lỗi, KHÔNG gọi database',
     gian.goi.length === 0 && r1.ok === false && r1.cau === CAU.coSai.vi && r2.ok === false && r2.cau === CAU.dsHong.vi
     && r3.ok === false && r3.cau === CAU.trung.en(200), `${JSON.stringify([r1, r2, r3])} · gọi ${gian.goi.length}`);
});

// ===========================================================================
await nhom('5c · luuCoGoi trên database thật: đã lưu, không đổi, bấm đúp, người khác sửa, quyền', async () => {
  const v0 = await BL.docCaiDat(QL);
  const form0 = formCaiDat(v0, { cg_moi_0: '300' });
  const a = await BL.luuCoGoi(QL, form0, 'vi');
  ok('Quản lý thêm 300 g → "Đã lưu cỡ gói."', a.ok === true && a.cau === CAU.daLuu.vi, JSON.stringify(a));
  ok('…database: 200, 300, 400 đang dùng', giongNhau(coCua(await bangCo()), [co(200), co(300), co(400)]));
  const sauLan1 = await bangCo();

  const b = await BL.luuCoGoi(QL, formCaiDat(v0, { cg_moi_0: '300' }), 'vi');
  ok('Bấm Lưu lần hai (cùng form, phiên bản CŨ — database đã đúng như gửi) → "Danh sách cỡ gói đã đúng như bạn chọn.", không "người khác sửa", không nói lần này đã lưu',
     b.ok === true && b.cau === CAU.daDung.vi && !noiDaLuu(b.cau), JSON.stringify(b));
  ok('…không ghi lần nữa: mọi dòng giữ nguyên (người sửa, updated_at)', giongNhau(await bangCo(), sauLan1));

  const v1 = await BL.docCaiDat(QL);
  const c = await BL.luuCoGoi(QL, formCaiDat(v1), 'vi');
  const cEn = await BL.luuCoGoi(QL, formCaiDat(v1), 'en');
  ok('Mở lại trang, bấm Lưu mà không đổi gì → "Không có gì thay đổi." / "Nothing changed." (không nói đã lưu)',
     c.ok === true && c.cau === CAU.khongDoi.vi && cEn.ok === true && cEn.cau === CAU.khongDoi.en, `${JSON.stringify(c)} · ${JSON.stringify(cEn)}`);
  ok('…không ghi gì', giongNhau(await bangCo(), sauLan1));

  // Người khác sửa khác đi giữa lúc quản lý mở trang và lúc bấm Lưu
  const d = await BL.luuCoGoi(CHU, formCaiDat(v1, viecCua(v1, 300, 'bo')), 'vi');
  ok('Chủ bỏ 300 g → "Đã lưu cỡ gói."', d.ok === true && d.cau === CAU.daLuu.vi, JSON.stringify(d));
  const sauChu = await bangCo();
  const e = await BL.luuCoGoi(QL, formCaiDat(v1, { cg_moi_0: '500' }), 'vi');
  const eEn = await BL.luuCoGoi(QL, formCaiDat(v1, { cg_moi_0: '500' }), 'en');
  ok('Quản lý lưu bằng trang cũ (thêm 500 g) → ok false, câu người khác vừa sửa (vi, en), maLoi nguoi_khac_sua',
     e.ok === false && e.cau === CAU.nguoiKhac.vi && e.maLoi === 'nguoi_khac_sua' && eEn.ok === false && eEn.cau === CAU.nguoiKhac.en,
     `${JSON.stringify(e)} · ${JSON.stringify(eEn)}`);
  ok('…KHÔNG BAO GIỜ "Đã lưu" khi người khác vừa sửa', !noiDaLuu(e.cau) && !noiDaLuu(eEn.cau));
  ok('…database không ghi gì: không có 500 g, 300 g không quay lại', giongNhau(await bangCo(), sauChu));

  // Quyền: thu ngân, marketing xem được nhưng không lưu
  const v2 = await BL.docCaiDat(TN);
  for (const [ai, client] of [['Thu ngân', TN], ['Marketing', MKT]]) {
    const vi = await BL.luuCoGoi(client, formCaiDat(v2, { cg_moi_0: '700' }), 'vi');
    const en = await BL.luuCoGoi(client, formCaiDat(v2, { cg_moi_0: '700' }), 'en');
    ok(`${ai} lưu → từ chối bằng đúng câu của database (vi, en)`, vi.ok === false && vi.cau === CAU.sua.vi && en.ok === false && en.cau === CAU.sua.en,
       `${JSON.stringify(vi)} · ${JSON.stringify(en)}`);
  }
  const kt = await BL.luuCoGoi(KT, formCaiDat(v2, { cg_moi_0: '700' }), 'vi');
  ok('Kế toán lưu → từ chối, không "Đã lưu"', kt.ok === false && !noiDaLuu(kt.cau), JSON.stringify(kt));
  ok('…không ai trong số đó ghi được', giongNhau(await bangCo(), sauChu));

  // Câu lỗi của database đi qua dichCau: quá 20 cỡ đang dùng (form khai 18 dòng + 3 ô mới)
  const muoiTam = { phien_ban: v2.phien_ban, co_goi: Array.from({ length: 18 }, (_, i) => co(1000 + i * 100)) };
  const qua = await BL.luuCoGoi(QL, formCaiDat(muoiTam, { cg_moi_0: '100', cg_moi_1: '150', cg_moi_2: '250' }), 'vi');
  const quaEn = await BL.luuCoGoi(QL, formCaiDat(muoiTam, { cg_moi_0: '100', cg_moi_1: '150', cg_moi_2: '250' }), 'en');
  ok('21 cỡ đang dùng → câu của database "Tối đa 20 cỡ gói đang dùng — …" (vi, en), không ghi',
     qua.ok === false && qua.cau === CAU.quaDangDung.vi && quaEn.ok === false && quaEn.cau === CAU.quaDangDung.en
     && giongNhau(await bangCo(), sauChu), `${JSON.stringify(qua)} · ${JSON.stringify(quaEn)}`);

  // Gửi đúng hai khóa mỗi cỡ, gam là số
  const gian = clientGhi({ data: { ok: true, khong_doi: false, phien_ban: 'moi', co_goi: [] }, error: null });
  await BL.luuCoGoi(gian, formCaiDat({ phien_ban: 'pb', co_goi: [co(200), co(400)] }, { cg_moi_0: '1.000', cg_1_viec: 'tat' }), 'vi');
  ok('luuCoGoi gửi ban_le_luu_co_goi { p_phien_ban, p_co_goi: [{so_gam số, dang_dung}] } theo gam tăng dần',
     gian.goi.length === 1 && gian.goi[0].ten === 'ban_le_luu_co_goi' && gian.goi[0].tham.p_phien_ban === 'pb'
     && giongNhau(gian.goi[0].tham.p_co_goi, [co(200), co(400, false), co(1000)]), JSON.stringify(gian.goi));

  // Hai người cùng mở trang, cùng tắt 400 g: người lưu sau KHÔNG được nghe "Đã lưu" (yêu cầu của họ không ghi gì)
  const v3 = await BL.docCaiDat(QL);
  const chuTat = await BL.luuCoGoi(CHU, formCaiDat(v3, viecCua(v3, 400, 'tat')), 'vi');
  const sauTat = await bangCo();
  const qlTat = await BL.luuCoGoi(QL, formCaiDat(v3, viecCua(v3, 400, 'tat')), 'vi');
  const qlTatEn = await BL.luuCoGoi(QL, formCaiDat(v3, viecCua(v3, 400, 'tat')), 'en');
  ok('Chủ và quản lý cùng mở trang, cùng tắt 400 g: người lưu sau nghe "Danh sách cỡ gói đã đúng như bạn chọn." (vi, en), không "Đã lưu"',
     chuTat.ok === true && qlTat.ok === true && qlTat.cau === CAU.daDung.vi && qlTatEn.cau === CAU.daDung.en
     && !noiDaLuu(qlTat.cau) && !noiDaLuu(qlTatEn.cau), `${JSON.stringify(qlTat)} · ${JSON.stringify(qlTatEn)}`);
  ok('…không ghi lần nữa', giongNhau(await bangCo(), sauTat));
  const bat = await BL.docCaiDat(QL);
  await BL.luuCoGoi(CHU, formCaiDat(bat, viecCua(bat, 400, 'dung')), 'vi');
  ok('…bật lại 400 g cho các ca sau', giongNhau(coCua(await bangCo()).find(c => c.so_gam === 400), co(400)));
});

// ===========================================================================
await nhom('5e · Dựng lại form Cài đặt sau lỗi: không phủ lựa chọn cũ lên cỡ người khác vừa sửa, không điền lại cỡ đã lưu', async () => {
  ok('Thư viện có viecDaChon, coMoiDaGo, VIEC_CO_GOI, SO_DONG_CG_TOI_DA',
     typeof BL.viecDaChon === 'function' && typeof BL.coMoiDaGo === 'function'
     && giongNhau(BL.VIEC_CO_GOI, ['dung', 'tat', 'bo']) && BL.SO_DONG_CG_TOI_DA === 40);
  if (typeof BL.viecDaChon !== 'function' || typeof BL.coMoiDaGo !== 'function') return;

  // A mở trang lúc 200 g, 400 g đang dùng; gõ sai ô cỡ mới ("abc") nên form bị trả lại. Trong lúc đó B tắt 200 g.
  const cuA = { phien_ban: 'v1', co_goi: [co(200), co(400)] };
  const daGoA = formCaiDat(cuA, { cg_moi_0: 'abc' });
  ok('Cỡ A không đụng tới (200 g, việc = việc gốc "dung"), database mới đọc: Tạm tắt → hiện "tat" (theo database, không phủ lựa chọn cũ)',
     BL.viecDaChon(daGoA, 200, false) === 'tat');
  ok('…cỡ A không đụng tới mà database vẫn đang dùng → "dung"', BL.viecDaChon(daGoA, 400, true) === 'dung');
  const daGoB = formCaiDat(cuA, { ...viecCua(cuA, 400, 'bo'), cg_moi_0: 'abc' });
  ok('Cỡ A đã đổi việc (400 g: "dung" → "bo") → giữ "bo" khi dựng lại', BL.viecDaChon(daGoB, 400, true) === 'bo');
  ok('…cỡ không có trên form vừa gửi (người khác vừa thêm 300 g) → theo database', BL.viecDaChon(daGoB, 300, true) === 'dung'
     && BL.viecDaChon(daGoB, 300, false) === 'tat');
  ok('…người khác vừa sửa (bỏ qua chữ đã gõ) → theo database', BL.viecDaChon(daGoB, 400, true, true) === 'dung');
  ok('…không có form vừa gửi → theo database', BL.viecDaChon(null, 400, false) === 'tat');
  const thieuGoc = formTu({ so_dong_cg: 1, cg_0_so_gam: 200, cg_0_viec: 'bo' });
  ok('…form thiếu ô việc gốc (trang mở trước bản này) → theo database, không đoán', BL.viecDaChon(thieuGoc, 200, true) === 'dung');
  const viecLa = formTu({ so_dong_cg: 1, cg_0_so_gam: 200, cg_0_viec: 'xoa-het', cg_0_viec_goc: 'dung' });
  ok('…việc lạ → theo database', BL.viecDaChon(viecLa, 200, true) === 'dung');

  // Mất mạng sau khi database đã ghi 300 g: dựng lại không điền "300" vào ô cỡ mới (bấm Lưu lại sẽ báo trùng oan)
  const moi = { phien_ban: 'v2', co_goi: [co(200), co(300), co(400)] };
  const daGoC = formCaiDat(cuA, { cg_moi_0: '300', cg_moi_1: '1.000', cg_moi_2: 'abc' });
  ok('Ô cỡ mới "300" mà database mới đọc đã có 300 g → để trống', BL.coMoiDaGo(daGoC, 0, moi) === '');
  ok('…"1.000" (1000 g, chưa có) → giữ chữ đã gõ', BL.coMoiDaGo(daGoC, 1, moi) === '1.000');
  ok('…"abc" (sai) → giữ chữ đã gõ để người dùng sửa', BL.coMoiDaGo(daGoC, 2, moi) === 'abc');
  ok('…không có form vừa gửi, hay đọc cài đặt lỗi → không đoán', BL.coMoiDaGo(null, 0, moi) === '' && BL.coMoiDaGo(daGoC, 1, null) === '1.000');
});

await nhom('5d · taoSanPham: chọn cỡ Bán / Không bán, kim chi, form cũ, cỡ lạ, bấm hai lần', async () => {
  // Cài đặt cho nhóm này: 300 (dùng), 400 (tắt), 1000 (dùng) — khác 200 / 400 để thấy rõ gói lấy từ đâu.
  const v = await BL.docCaiDat(CHU);
  const dat = await BL.luuCoGoi(CHU, formCaiDat(v, { ...viecCua(v, 200, 'bo'), ...viecCua(v, 400, 'tat'), cg_moi_0: '300', cg_moi_1: '1000' }), 'vi');
  ok('Tiền đề: cài đặt 300 (dùng), 400 (tắt), 1000 (dùng)', dat.ok === true
     && giongNhau(coCua(await bangCo()), [co(300), co(400, false), co(1000)]), JSON.stringify(dat));

  const tao = async (o, client = QL) => BL.taoSanPham(client, formTu({ viec: 'tao', ma_gui: maGui(), ma: '', ...o }), 'vi');
  for (const [ten, o, phai] of [
    ['Thịt, co_goi_ds "300,1000", 300 Bán, 1000 Không bán → gói 300 g', { ten_vi: 'Chọn một cỡ', kieu: 'thit|theo_can', co_goi_ds: '300,1000', goi_300: 'ban', goi_1000: 'khong' }, [300]],
    ['Thịt, cả hai Bán → 300 g, 1000 g', { ten_vi: 'Chọn hai cỡ', kieu: 'thit|theo_can', co_goi_ds: '300,1000', goi_300: 'ban', goi_1000: 'ban' }, [300, 1000]],
    ['Thịt, cả hai Không bán → không gói nào (p_so_gam rỗng, không rơi về cài đặt)', { ten_vi: 'Không cỡ nào', kieu: 'thit|theo_can', co_goi_ds: '300,1000', goi_300: 'khong', goi_1000: 'khong' }, []],
    ['Thịt, co_goi_ds rỗng (cài đặt không có cỡ đang dùng lúc mở form) → không gói nào', { ten_vi: 'Danh sách rỗng', kieu: 'thit|theo_can', co_goi_ds: '' }, []],
    ['Thịt, cỡ 400 vừa bị tắt sau khi mở form, vẫn chọn Bán → nhận 400 g (người dùng đã chọn rõ)', { ten_vi: 'Cỡ vừa tắt', kieu: 'thit|theo_can', co_goi_ds: '400', goi_400: 'ban' }, [400]],
    ['Thịt, co_goi_ds lẫn cỡ lạ "300,abc,10,9000,1.000,,300" → chỉ 300 g', { ten_vi: 'Cỡ lạ', kieu: 'thit|theo_can', co_goi_ds: '300,abc,10,9000,1.000,,300', goi_300: 'ban', goi_abc: 'ban', goi_10: 'ban', goi_9000: 'ban', 'goi_1.000': 'ban' }, [300]],
    ['Thịt, goi_500 "Bán" nhưng 500 không có trong co_goi_ds → bỏ qua', { ten_vi: 'Ngoài danh sách', kieu: 'thit|theo_can', co_goi_ds: '300', goi_300: 'khong', goi_500: 'ban' }, []],
    ['Thịt, giá trị lạ ("co") ở ô chọn → không bán cỡ đó', { ten_vi: 'Giá trị lạ', kieu: 'thit|theo_can', co_goi_ds: '300,1000', goi_300: 'co', goi_1000: 'ban' }, [1000]],
    ['Kim chi kèm co_goi_ds, 300 Bán → không gói nào (kim chi bán theo hộp)', { ten_vi: 'Kim chi chọn cỡ', kieu: 'kim_chi|theo_hop', co_goi_ds: '300,1000', goi_300: 'ban', goi_1000: 'ban' }, []],
    ['Form cũ không có co_goi_ds (thịt) → các cỡ đang dùng của cài đặt: 300 g, 1000 g', { ten_vi: 'Form cũ', kieu: 'thit|theo_can' }, [300, 1000]],
  ]) {
    const r = await tao(o);
    const g = r.ok ? await goiCua(r.id) : null;
    ok(ten, r.ok === true && r.daCo === false && giongNhau(g, phai), `${JSON.stringify(r)} · gói ${JSON.stringify(g)}`);
  }

  // Thư viện gửi gì
  const gian = clientGhi({ data: { id: '00000000-0000-4000-8000-00000000c0de', da_co: false }, error: null });
  await BL.taoSanPham(gian, formTu({ ma_gui: maGui(), ten_vi: 'A', kieu: 'thit|theo_can', co_goi_ds: '1000,300', goi_1000: 'ban', goi_300: 'ban' }), 'vi');
  await BL.taoSanPham(gian, formTu({ ma_gui: maGui(), ten_vi: 'B', kieu: 'thit|theo_can', co_goi_ds: '300', goi_300: 'khong' }), 'vi');
  await BL.taoSanPham(gian, formTu({ ma_gui: maGui(), ten_vi: 'C', kieu: 'kim_chi|theo_hop', co_goi_ds: '300', goi_300: 'ban' }), 'vi');
  await BL.taoSanPham(gian, formTu({ ma_gui: maGui(), ten_vi: 'D', kieu: 'thit|theo_can' }), 'vi');
  const [gA, gB, gC, gD] = gian.goi.map(x => x.tham);
  ok('Thịt có co_goi_ds → p_so_gam là mảng số theo gam tăng dần: [300, 1000]', giongNhau(gA?.p_so_gam, [300, 1000]), JSON.stringify(gA));
  ok('…không chọn cỡ nào → p_so_gam là mảng rỗng (không vắng: vắng là "dùng cài đặt")', 'p_so_gam' in (gB ?? {}) && giongNhau(gB.p_so_gam, []), JSON.stringify(gB));
  ok('Kim chi → KHÔNG gửi p_so_gam', gC && !('p_so_gam' in gC), JSON.stringify(gC));
  ok('Form cũ không có co_goi_ds → KHÔNG gửi p_so_gam (database dùng cài đặt)', gD && !('p_so_gam' in gD), JSON.stringify(gD));

  // Bấm hai lần cùng ma_gui với lựa chọn khác
  const gui = maGui();
  const n0 = await demSanPham();
  const t1 = await tao({ ma_gui: gui, ten_vi: 'Hai lần chọn cỡ', kieu: 'thit|theo_can', co_goi_ds: '300,1000', goi_300: 'ban', goi_1000: 'khong' });
  const t2 = await tao({ ma_gui: gui, ten_vi: 'Hai lần chọn cỡ', kieu: 'thit|theo_can', co_goi_ds: '300,1000', goi_300: 'khong', goi_1000: 'ban' });
  ok('Bấm "Thêm sản phẩm" lần hai (cùng ma_gui, lựa chọn khác) → cùng sản phẩm, daCo', t1.ok && t2.ok && t2.id === t1.id && t2.daCo === true,
     `${JSON.stringify(t1)} · ${JSON.stringify(t2)}`);
  ok('…đúng một sản phẩm mới, gói theo LẦN ĐẦU (300 g)', (await demSanPham()) === n0 + 1 && giongNhau(await goiCua(t1.id), [300]));

  // Quyền
  const m = await tao({ ten_vi: 'Marketing thêm', kieu: 'thit|theo_can', co_goi_ds: '300', goi_300: 'ban' }, MKT);
  ok('Marketing thêm (có chọn cỡ) → câu của database, không tạo', m.ok === false && m.cau === CAU.sua.vi, JSON.stringify(m));
  const q = await tao({ ten_vi: 'Hai mươi mốt cỡ', kieu: 'thit|theo_can',
                        co_goi_ds: Array.from({ length: 21 }, (_, i) => 100 + i * 100).join(','),
                        ...Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`goi_${100 + i * 100}`, 'ban'])) });
  ok('21 cỡ chọn Bán → câu cũ "Một sản phẩm có tối đa 20 gói.", không tạo', q.ok === false && q.cau === 'Một sản phẩm có tối đa 20 gói.', JSON.stringify(q));

  // Gõ thẳng số gam khi thêm món (Khánh 27/10/2026): ô "Cỡ khác (gam)" goi_khac_0 … goi_khac_2, cạnh các cỡ có sẵn
  ok('Thư viện có SO_O_GOI_KHAC = 3 (số ô "Cỡ khác" trên form Thêm sản phẩm)', BL.SO_O_GOI_KHAC === 3);
  for (const [ten, o, phai] of [
    ['Thịt, 300 Bán, 1000 Không bán, gõ thêm "350" và "1.500" → 300, 350, 1500 g',
     { ten_vi: 'Gõ thêm gram', kieu: 'thit|theo_can', co_goi_ds: '300,1000', goi_300: 'ban', goi_1000: 'khong', goi_khac_0: '350', goi_khac_1: '1.500' }, [300, 350, 1500]],
    ['Thịt, cài đặt không có cỡ nào (co_goi_ds rỗng), gõ "250", " 500 " → 250, 500 g',
     { ten_vi: 'Chỉ gõ gram', kieu: 'thit|theo_can', co_goi_ds: '', goi_khac_0: '250', goi_khac_2: ' 500 ' }, [250, 500]],
    ['Thịt, gõ trùng cỡ có sẵn đang chọn Bán ("300") và trùng nhau ("350", "350") → mỗi cỡ một gói',
     { ten_vi: 'Gõ trùng', kieu: 'thit|theo_can', co_goi_ds: '300', goi_300: 'ban', goi_khac_0: '300', goi_khac_1: '350', goi_khac_2: '350' }, [300, 350]],
    ['Thịt, cỡ có sẵn chọn Không bán nhưng gõ lại đúng cỡ đó → gõ là muốn bán: 1000 g',
     { ten_vi: 'Gõ cỡ không bán', kieu: 'thit|theo_can', co_goi_ds: '300,1000', goi_300: 'khong', goi_1000: 'khong', goi_khac_0: '1000' }, [1000]],
    ['Kim chi gõ "500" → không gói nào (kim chi bán theo hộp)',
     { ten_vi: 'Kim chi gõ gram', kieu: 'kim_chi|theo_hop', co_goi_ds: '300', goi_300: 'ban', goi_khac_0: '500' }, []],
  ]) {
    const r = await tao(o);
    const g = r.ok ? await goiCua(r.id) : null;
    ok(ten, r.ok === true && r.daCo === false && giongNhau(g, phai), `${JSON.stringify(r)} · gói ${JSON.stringify(g)}`);
  }
  for (const xau of ['1,5', 'abc', '49', '5001', '300g', '1kg', '-200']) {
    const n0b = await demSanPham();
    const ghi = clientGhi();
    const vi = await BL.taoSanPham(ghi, formTu({ ma_gui: maGui(), ten_vi: 'Gõ sai', kieu: 'thit|theo_can', co_goi_ds: '300', goi_300: 'ban', goi_khac_1: xau }), 'vi');
    const en = await BL.taoSanPham(ghi, formTu({ ma_gui: maGui(), ten_vi: 'Gõ sai', kieu: 'thit|theo_can', co_goi_ds: '300', goi_300: 'ban', goi_khac_1: xau }), 'en');
    ok(`Ô "Cỡ khác" gõ "${xau}" → "${CAU.coSai.vi}" / en, KHÔNG gọi database, không tạo`,
       vi.ok === false && vi.cau === CAU.coSai.vi && en.ok === false && en.cau === CAU.coSai.en && ghi.goi.length === 0
       && (await demSanPham()) === n0b, `${JSON.stringify(vi)} · ${JSON.stringify(en)} · gọi ${ghi.goi.length}`);
  }
  const gian2 = clientGhi({ data: { id: '00000000-0000-4000-8000-00000000c0de', da_co: false }, error: null });
  await BL.taoSanPham(gian2, formTu({ ma_gui: maGui(), ten_vi: 'E', kieu: 'thit|theo_can', co_goi_ds: '300', goi_300: 'ban', goi_khac_0: '1.000', goi_khac_2: '150' }), 'vi');
  await BL.taoSanPham(gian2, formTu({ ma_gui: maGui(), ten_vi: 'F', kieu: 'thit|theo_can', goi_khac_0: '700' }), 'vi');
  const [gE, gF] = gian2.goi.map(x => x.tham);
  ok('Thư viện gửi p_so_gam gồm cỡ chọn Bán và cỡ gõ thêm, theo gam tăng dần: [150, 300, 1000]', giongNhau(gE?.p_so_gam, [150, 300, 1000]), JSON.stringify(gE));
  ok('Form không có co_goi_ds (đọc cài đặt lỗi — trang không dựng ô Cỡ khác) → vẫn không gửi p_so_gam', gF && !('p_so_gam' in gF), JSON.stringify(gF));
  const q2 = await tao({ ten_vi: 'Hai mươi mốt cỡ gõ', kieu: 'thit|theo_can',
                         co_goi_ds: Array.from({ length: 18 }, (_, i) => 100 + i * 100).join(','),
                         ...Object.fromEntries(Array.from({ length: 18 }, (_, i) => [`goi_${100 + i * 100}`, 'ban'])),
                         goi_khac_0: '1950', goi_khac_1: '1960', goi_khac_2: '1970' });
  ok('18 cỡ Bán + 3 cỡ gõ = 21 → "Một sản phẩm có tối đa 20 gói.", không tạo', q2.ok === false && q2.cau === 'Một sản phẩm có tối đa 20 gói.', JSON.stringify(q2));

  // Trả cài đặt về như gieo
  const v3 = await BL.docCaiDat(CHU);
  const ve = await BL.luuCoGoi(CHU, formCaiDat(v3, { ...viecCua(v3, 300, 'bo'), ...viecCua(v3, 1000, 'bo'), ...viecCua(v3, 400, 'dung'), cg_moi_0: '200' }), 'vi');
  ok('Trả cài đặt về 200 g, 400 g đang dùng', ve.ok === true && giongNhau(coCua(await bangCo()), [co(200), co(400)]), JSON.stringify(ve));
});

// ===========================================================================
await nhom('6 · MẤT MẠNG — không bao giờ "Đã lưu"', async () => {
  const nem = { rpc() { throw new TypeError('fetch failed'); }, from() { throw new TypeError('fetch failed'); } };
  const traLoi = { rpc: async () => ({ data: null, error: { message: 'TypeError: fetch failed' } }) };
  const cd = await BL.docCaiDat(QL);
  for (const [ten, client] of [['client ném TypeError("fetch failed")', nem], ['client trả lỗi "TypeError: fetch failed"', traLoi]]) {
    for (const nn of ['vi', 'en']) {
      const l = await BL.luuCoGoi(client, formCaiDat(cd, { cg_moi_0: '600' }), nn);
      ok(`${ten}: lưu cỡ gói (${nn}) → CAU_MAT_MANG_GHI, không "Đã lưu"`, l.ok === false && l.cau === CAU_MAT_MANG_GHI[nn] && !noiDaLuu(l.cau), JSON.stringify(l));
      const t = await BL.taoSanPham(client, formTu({ ma_gui: maGui(), ten_vi: 'Mới', kieu: 'thit|theo_can', co_goi_ds: '200,400', goi_200: 'ban', goi_400: 'ban' }), nn);
      ok(`${ten}: thêm sản phẩm có chọn cỡ (${nn}) → CAU_MAT_MANG_GHI`, t.ok === false && t.cau === CAU_MAT_MANG_GHI[nn], JSON.stringify(t));
    }
    let loi = null;
    try { await BL.docCaiDat(client); } catch (e) { loi = e; }
    ok(`${ten}: đọc cài đặt → ném, cauLoiDoc ra CAU_MAT_MANG_GHI (vi, en)`,
       loi !== null && BL.cauLoiDoc(loi, 'vi') === CAU_MAT_MANG_GHI.vi && BL.cauLoiDoc(loi, 'en') === CAU_MAT_MANG_GHI.en, String(loi?.message));
  }
  for (const [ten, traVe] of [
    ['dịch vụ trả 500', { data: null, error: { message: 'Internal Server Error', code: '500' } }],
    ['hết giờ (504, "upstream request timeout")', { data: null, error: { message: 'upstream request timeout', code: '504' } }],
    ['trả rỗng (data null, error null)', { data: null, error: null }],
    ['trả đối tượng lạ (không có ok)', { data: { khong_phai: true }, error: null }],
  ]) {
    const l = await BL.luuCoGoi(clientGhi(traVe), formCaiDat(cd, { cg_moi_0: '600' }), 'vi');
    ok(`${ten} → ok false, không "Đã lưu"`, l.ok === false && !noiDaLuu(l.cau) && l.cau.length > 0, JSON.stringify(l));
  }
  ok('Database không nhận 600 g từ lần nào', !(await bangCo()).some(r => r.so_gam === 600));
});

// ===========================================================================
await nhom('7 · TRANG: cai-dat.astro, index.astro, [id].astro — đọc mã nguồn', async () => {
  const cd = docNguon('pages/noi-bo/ban-le/cai-dat.astro');
  const ds = docNguon('pages/noi-bo/ban-le/index.astro');
  const sua = docNguon('pages/noi-bo/ban-le/[id].astro');
  ok('Trang /noi-bo/ban-le/cai-dat có file (web/src/pages/noi-bo/ban-le/cai-dat.astro)', cd.length > 0);

  for (const [ten, s] of [['cai-dat.astro', cd], ['index.astro', ds], ['[id].astro', sua]]) {
    ok(`${ten}: không <script>, không onclick`, s.length > 0 && !/<script|onclick=/i.test(s));
    ok(`${ten}: không ô đánh dấu, không ô chọn một (Bán / Không bán là select)`, s.length > 0 && !/type="(checkbox|radio)"/.test(s));
    ok(`${ten}: không type="number"`, s.length > 0 && !/type="number"/.test(s));
    const chuyen = [...s.matchAll(/Astro\.redirect\([^)]*\)/g)].map(m => m[0]);
    ok(`${ten}: đúng một Astro.redirect('/noi-bo', 302), ngay sau kiểm VAI_XEM_BAN_LE`,
       chuyen.length === 1 && chuyen[0] === "Astro.redirect('/noi-bo', 302)"
       && /if \(!\(VAI_XEM_BAN_LE as readonly string\[\]\)\.includes\(nhanSu\.vai_tro\)\) return Astro\.redirect\('\/noi-bo', 302\);/.test(s),
       chuyen.join(' · '));
  }

  // cai-dat.astro: POST, phiên bản, ô của từng dòng
  ok('cai-dat.astro: đọc form bằng docFormNoiBo(Astro.request), báo CAU_DOC_FORM_HONG[nn] khi thân hỏng',
     /docFormNoiBo\(Astro\.request\)/.test(cd) && /CAU_DOC_FORM_HONG\[nn\]/.test(cd) && !/request\.formData\(\)/.test(cd));
  ok('cai-dat.astro: lưu bằng luuCoGoi, ghi được thì return chuyenHuongNoiBo (303), đọc câu báo bằng docBaoNoiBo(Astro.cookies, Astro.url.pathname)',
     /luuCoGoi\(client, form, nn\)/.test(cd) && /return chuyenHuongNoiBo\(/.test(cd) && /docBaoNoiBo\(Astro\.cookies, Astro\.url\.pathname\)/.test(cd));
  ok('cai-dat.astro: đọc bằng docCaiDat, lỗi đọc → nb-bao loi với cauLoiDoc',
     /docCaiDat\(client\)/.test(cd) && /cauLoiDoc\(e, nn\)/.test(cd) && /<div class="nb-bao loi"><p>\{loiDoc\}<\/p><\/div>/.test(cd));
  ok('cai-dat.astro: ô ẩn phiên bản và số gam LUÔN từ lần đọc mới (caiDat), không từ chữ đã gõ',
     /<input type="hidden" name="phien_ban" value=\{caiDat\.phien_ban\} \/>/.test(cd)
     && /<input type="hidden" name="so_dong_cg" value=\{caiDat\.co_goi\.length\} \/>/.test(cd)
     && /caiDat\.co_goi\.map\(\(c, i\) =>/.test(cd) && /name=\{`cg_\$\{i\}_so_gam`\} value=\{c\.so_gam\}/.test(cd));
  ok('cai-dat.astro: mỗi cỡ một select việc "Đang dùng / Tạm tắt / Bỏ khỏi danh sách" (dung / tat / bo)',
     /<select name=\{`cg_\$\{i\}_viec`\}>/.test(cd) && ['value="dung"', 'value="tat"', 'value="bo"'].every(v => cd.includes(v))
     && ["'Đang dùng'", "'Tạm tắt'", "'Bỏ khỏi danh sách'"].every(c => cd.includes(c)));
  ok('cai-dat.astro: trạng thái hiện bằng nhãn có chữ nb-nhan song "Đang dùng" / nb-nhan tat "Tạm tắt" (K4 / K6, không màu, không độ mờ)',
     /nb-nhan \$\{c\.dang_dung \? 'song' : 'tat'\}/.test(cd) && !/opacity/.test(cd));
  ok('cai-dat.astro: ô cỡ mới là text + inputmode numeric, số ô theo SO_DONG_CO_GOI_MOI / SO_CO_GOI_TOI_DA của thư viện',
     /name=\{`cg_moi_\$\{j\}`\}/.test(cd) && /type="text" name=\{`cg_moi_\$\{j\}`\} inputmode="numeric"/.test(cd)
     && /SO_DONG_CO_GOI_MOI/.test(cd) && /SO_CO_GOI_TOI_DA/.test(cd));
  ok('cai-dat.astro: vai chỉ xem — fieldset disabled, nút Lưu chỉ cho người sửa, câu "Chỉ chủ và quản lý sửa được cài đặt bán lẻ."',
     /<fieldset disabled=\{!duocSua\}>/.test(cd) && /const duocSua = \(VAI_SUA_BAN_LE as readonly string\[\]\)\.includes\(nhanSu\.vai_tro\);/.test(cd)
     && /\{duocSua && \(\s*<div class="bl-nut">\s*<button type="submit" class="nb-nut">\{t\.luu\}<\/button>/.test(cd)
     && cd.includes("'Chỉ chủ và quản lý sửa được cài đặt bán lẻ.'") && /\{!duocSua && <div class="nb-bao luu-y"><p>\{t\.chiDoc\}<\/p><\/div>\}/.test(cd));
  ok('cai-dat.astro: lưu hỏng thì dựng lại với chữ đã gõ ở ô cỡ mới (coMoiDaGo trên daGo), người khác sửa thì hiện danh sách mới',
     /daGo = form;/.test(cd) && /value=\{coMoiDaGo\(daGo, j, caiDat\)\}/.test(cd) && /maLoi === 'nguoi_khac_sua'/.test(cd)
     && /viecDaChon\(daGo, soGam, dangDung, nguoiKhacSua\)/.test(cd));
  const CHU_CAI_DAT = [
    ["tieuDe", "'Cài đặt bán lẻ'", "'Retail settings'"],
    ['h2', "'Cỡ gói thịt bò'", "'Beef pack sizes'"],
    ['dẫn', "'Cỡ gói online dùng chung cho thịt bò. Cỡ Đang dùng hiện sẵn ở form Thêm sản phẩm thịt — chọn Bán hay Không bán cho từng cỡ. Sản phẩm đã có giữ nguyên gói của nó; sửa gói ở trang từng sản phẩm. Kim chi bán theo hộp, không dùng danh sách này.'", null],
    ['FABi', "'Mỗi cỡ mới cần một món tương ứng trong FABi — xem Đối chiếu FABi sau khi thêm sản phẩm.'", null],
    ['ô mới', "'Cỡ mới (gam)'", null],
    ['gợi ý', "'Từ 50 đến 5000 g — ví dụ 300, hoặc 1000 cho 1 kg.", null],
    ['rỗng', "'Chưa có cỡ gói nào — sản phẩm thịt mới sẽ chưa có gói; thêm cỡ ở dưới.'", null],
    ['nút', "'Lưu cỡ gói'", "'Save pack sizes'"],
    ['lùi', "'← Menu bán lẻ'", "'← Retail menu'"],
  ];
  for (const [ten, vi, en] of CHU_CAI_DAT) ok(`cai-dat.astro: chữ ${ten} đúng câu đã duyệt (${vi.slice(0, 40)}…)`, cd.includes(vi) && (!en || cd.includes(en)));
  ok('cai-dat.astro: link lùi về /noi-bo/ban-le', /<p class="bl-lui"><a href="\/noi-bo\/ban-le">\{t\.lui\}<\/a><\/p>/.test(cd));
  ok('cai-dat.astro: gam in không dấu ngăn nghìn ("1000 g", không dinhDangKg / toLocaleString)',
     /`\$\{n\} g`/.test(cd) && !/toLocaleString|dinhDangKg/.test(cd));
  ok('cai-dat.astro: mọi chữ qua dichNB(nn, { … { vi, en } }) — không chữ Việt ngoài cặp { vi, en }',
     /const t = dichNB\(nn, \{/.test(cd) && quetChuViet(cd).length === 0, quetChuViet(cd).slice(0, 3).map(([n, d]) => `dòng ${n}: ${d.slice(0, 80)}`).join(' | '));
  ok('cai-dat.astro: không viết {n && …} với số đếm', !/\{\s*[a-zA-Z.]*(length|size|so[A-Z][a-zA-Z]*)\s*&&/.test(cd));

  // index.astro: nút Cài đặt, ô chọn cỡ của form Thêm sản phẩm
  ok('index.astro: nút "Cài đặt bán lẻ" (/noi-bo/ban-le/cai-dat) ở hàng nút của người sửa, cạnh Đối chiếu FABi',
     /\{duocSua && \(\s*<div class="bl-hang-nut">\s*<a href="\/noi-bo\/ban-le\/doi-chieu" class="nb-nut phu">\{t\.doiChieu\}<\/a>\s*<a href="\/noi-bo\/ban-le\/cai-dat" class="nb-nut phu">\{t\.caiDat\}<\/a>/.test(ds)
     && ds.includes("caiDat:     { vi: 'Cài đặt bán lẻ', en: 'Retail settings' }"));
  const viTriKieu = ds.indexOf('<select name="kieu" required>');
  const viTriCo = ds.indexOf('<fieldset class="nb-o bl-co-goi">');
  ok('index.astro: fieldset "Gói online cho thịt bò" ngay sau ô "Bán thế nào", trước ô mã',
     viTriKieu > 0 && viTriCo > viTriKieu && viTriCo < ds.indexOf('<details class="bl-goi-y"')
     && ds.includes("'Gói online cho thịt bò'") && ds.includes("'Online packs for beef'")
     && ds.includes("'Chỉ dùng khi chọn Thịt bò. Cỡ có sẵn lấy từ Cài đặt bán lẻ; cỡ khác thì gõ số gam bên dưới.'"));
  ok('index.astro: ô ẩn co_goi_ds = các cỡ đang dùng nối dấu phẩy', /<input type="hidden" name="co_goi_ds" value=\{coDangDung\.join\(','\)\} \/>/.test(ds));
  ok('index.astro: mỗi cỡ một select goi_N "Bán" / "Không bán" (ban / khong), giữ lựa chọn đã gõ khi dựng lại',
     /<select name=\{`goi_\$\{n\}`\}>/.test(ds) && /<option value="ban" selected=\{/.test(ds) && /<option value="khong" selected=\{/.test(ds)
     && /ban:\s+\{ vi: 'Bán', en: 'Sell' \}/.test(ds) && /khongBan:\s+\{ vi: 'Không bán', en: "Don't sell" \}/.test(ds) && /go\(`goi_\$\{n\}`\)/.test(ds));
  ok('index.astro: cài đặt không có cỡ đang dùng → câu chỉ sang ô Cỡ khác, nói rõ để trống thì thịt mới chưa có gói',
     ds.includes("'Cài đặt bán lẻ chưa có cỡ gói nào đang dùng — gõ số gam ở ô Cỡ khác; để trống thì sản phẩm thịt mới chưa có gói.'"));
  ok('index.astro: đọc cài đặt lỗi → bỏ fieldset (không gửi co_goi_ds), không chặn form (lỗi thành { caiDat: null, loi: true })',
     /docCaiDat\(client\)\.then\(caiDat => \(\{ caiDat, loi: false \}\), \(\) => \(\{ caiDat: null, loi: true \}\)\)/.test(ds)
     && /\{caiDat && \(\s*<fieldset class="nb-o bl-co-goi">/.test(ds));
  ok('index.astro: chỉ người sửa mới đọc cài đặt (form Thêm chỉ cho người sửa)',
     /const caiDatHua[^=]*= duocSua\s*\?\s*docCaiDat\(client\)/.test(ds));

  // [id].astro: chỉ thêm dòng gợi ý
  ok('[id].astro: dòng gợi ý "Cỡ trong Cài đặt bán lẻ: …" (vi, en) dưới goiDan, chỉ khi không phải hộp, đọc lỗi thì bỏ dòng',
     sua.includes("'Cỡ trong Cài đặt bán lẻ: '") || /Cỡ trong Cài đặt bán lẻ: \$\{/.test(sua));
  ok('…có câu khi cài đặt không có cỡ đang dùng, bản tiếng Anh',
     sua.includes("'Cài đặt bán lẻ chưa có cỡ nào đang dùng'") && /Sizes in Retail settings: /.test(sua) && sua.includes('Retail settings have no pack size in use'));
  ok('…đọc cài đặt lỗi thì null (không chặn trang), chỉ khi sản phẩm không theo hộp',
     /= sp && sp\.cach_ban !== 'theo_hop'\s*\?\s*docCaiDat\(client\)\.then\([\s\S]{0,160}, \(\) => null\)/.test(sua)
     && /\{coCaiDat && <p class="bl-phu bl-dan">/.test(sua));
  ok('[id].astro: form sửa giữ nguyên hình (hai dòng gói mới, tên ô goi_N_so_gam) — formTuSanPham của test-ban-le-web không đổi',
     /Math\.min\(2, SO_GOI_TOI_DA - sp\.goi\.length\)/.test(sua) && /name=\{`\$\{p\}so_gam`\} inputmode="numeric"/.test(sua));

  // Các nơi khác nhắc 200 / 400
  const dh = docNguon('lib/dieu-huong-noi-bo.ts');
  ok('Từ khóa tìm của mục Menu bán lẻ: bỏ "200g 400g", có "cỡ gói gram cài đặt"', !/200g 400g/.test(dh) && dh.includes('cỡ gói gram cài đặt')
     && dh.includes('pack size gram settings'));
  const readme = docNguon('web/README.md', GOC);
  ok('web/README.md: đoạn Menu bán lẻ không còn "gói cố định 200 g / 400 g", nói cỡ gói ở Cài đặt bán lẻ',
     !/gói cố định 200 g \/ 400 g/.test(readme) && readme.includes('/noi-bo/ban-le/cai-dat'));

  // Sổ đăng ký của các kiểm thử chung
  const tiengAnh = docNguon('crm/test/test-noi-bo-tieng-anh.mjs', GOC);
  const guiLai = docNguon('crm/test/test-noi-bo-gui-lai.mjs', GOC);
  const banLe = docNguon('crm/test/test-noi-bo-ban-le.mjs', GOC);
  ok('Trang mới có trong TEP (test-noi-bo-tieng-anh), TRANG (test-noi-bo-gui-lai), BA (test-noi-bo-ban-le)',
     tiengAnh.includes("'pages/noi-bo/ban-le/cai-dat.astro'") && guiLai.includes("'pages/noi-bo/ban-le/cai-dat.astro'")
     && /\['cai-dat\.astro', cd\]/.test(banLe));
  const kyNang = docNguon('.claude/skills/thiet-ke-beeftown/tham-khao/kiem-thu.md', GOC);
  ok('Skill kiem-thu.md có dòng cho hai file kiểm thử của cài đặt bán lẻ',
     kyNang.includes('test-ban-le-cai-dat.mjs') && kyNang.includes('test-ban-le-cai-dat-web.mjs'));

  ok('Chuỗi "đặt bàn thành công" không có trong trang và thư viện', !/đặt bàn thành công/i.test([cd, ds, sua, NGUON_LIB].join('\n')));
});

// ===========================================================================
await nhom('7b · TRANG: dựng lại sau lỗi, đọc cài đặt hỏng, đọc song song', async () => {
  const cd = docNguon('pages/noi-bo/ban-le/cai-dat.astro');
  const ds = docNguon('pages/noi-bo/ban-le/index.astro');
  const sua = docNguon('pages/noi-bo/ban-le/[id].astro');
  ok('cai-dat.astro: mỗi cỡ có ô ẩn cg_i_viec_goc (việc lúc mở trang) — để dựng lại chỉ giữ cỡ người dùng đã đổi',
     /name=\{`cg_\$\{i\}_viec_goc`\}/.test(cd));
  ok('cai-dat.astro: dựng lại bằng viecDaChon / coMoiDaGo của thư viện, không tự đọc lại form (không Number(...) || 0, không số 40, không danh sách việc viết tay)',
     /viecDaChon\(/.test(cd) && /coMoiDaGo\(/.test(cd) && !/\|\|\s*0/.test(cd) && !/\b40\b/.test(cd) && !/\['dung',\s*'tat',\s*'bo'\]/.test(cd));
  ok('index.astro: đọc Cài đặt bán lẻ lỗi → có câu báo (không im lặng), vi và en',
     /caiDatLoi:\s*\{\s*vi:\s*'Chưa đọc được Cài đặt bán lẻ[^']*',\s*en:\s*'[^']+'/.test(ds) && /\{t\.caiDatLoi\}/.test(ds));
  ok('index.astro: đọc cài đặt chạy song song với đọc menu (không await docCaiDat( đứng riêng)',
     /docCaiDat\(client\)\.then\(/.test(ds) && !/await docCaiDat\(/.test(ds));
  ok('[id].astro: đọc cài đặt chạy song song (không await docCaiDat( đứng riêng)', /docCaiDat\(client\)\.then\(/.test(sua) && !/await docCaiDat\(/.test(sua));
});

await nhom('7c · TRANG: form Thêm sản phẩm có ô gõ gram ("Cỡ khác")', async () => {
  const ds = docNguon('pages/noi-bo/ban-le/index.astro');
  ok('index.astro: dựng SO_O_GOI_KHAC ô goi_khac_N trong fieldset cỡ gói, ô chữ inputmode numeric (không type="number")',
     /Array\.from\(\{ length: SO_O_GOI_KHAC \}/.test(ds) && /name=\{`goi_khac_\$\{j\}`\}/.test(ds)
     && /name=\{`goi_khac_\$\{j\}`\}[^>]*inputmode="numeric"/.test(ds) && !/type="number"/.test(ds));
  ok('index.astro: dựng lại form hỏng giữ chữ đã gõ ở ô Cỡ khác', /value=\{go\(`goi_khac_\$\{j\}`\)\}/.test(ds));
  ok('index.astro: có cỡ ở trên thì gợi ý nói rõ cỡ gõ CỘNG THÊM vào các cỡ chọn Bán (muốn riêng cỡ gõ thì chọn Không bán); không có cỡ thì không nói câu đó',
     /goiKhacCong:\s*\{\s*vi:\s*'Cộng thêm vào các cỡ chọn Bán ở trên[^']*Không bán[^']*',\s*en:\s*"[^"]+"/.test(ds)
     && /\{coDangDung\.length > 0 \? `\$\{t\.goiKhacCong\} \$\{t\.goiKhacGoiY\}` : t\.goiKhacGoiY\}/.test(ds));
  ok('index.astro: nhãn và gợi ý ô Cỡ khác có vi và en',
     /goiKhac:\s*\{\s*vi:\s*'Cỡ khác \(gam\)',\s*en:\s*'[^']+'/.test(ds) && /goiKhacGoiY:\s*\{\s*vi:\s*'[^']+',\s*en:\s*'[^']+'/.test(ds));
});

await nhom('8 · SỔ KHO KHỚP', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('kho_doi_soat_ton() rỗng', rows.length === 0, JSON.stringify(rows.slice(0, 3)));
});

await db.close();
process.exit(ketThuc('CÀI ĐẶT BÁN LẺ: THƯ VIỆN WEB VÀ TRANG'));
