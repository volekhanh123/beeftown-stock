/**
 * BEEFTOWN — /noi-bo/ban-le: HỢP ĐỒNG VỚI DATABASE VÀ BA TRANG
 * =============================================================
 *
 *     node test/test-noi-bo-ban-le.mjs
 *
 * Màn Menu bán lẻ (web/src/lib/ban-le-noi-bo.ts, web/src/pages/noi-bo/ban-le/) chỉ ẩn nút cho gọn mắt; database
 * (0097) mới là luật. File này giữ hai bên nói cùng một thứ tiếng (thư viện chạy trên database thật ở
 * test-ban-le-web.mjs). Bất biến:
 *
 *   1. Vai: VAI_SUA_BAN_LE = mảng vai trong thân ban_le_luu_san_pham / ban_le_tao_san_pham (KHÔNG so với policy
 *      UPDATE ban_le_san_pham_dich — policy đó có marketing, chỉ để máy dịch ghi); VAI_XEM_BAN_LE = policy SELECT
 *      của hai bảng = vai của mục menu "Bán lẻ"; VAI_CHOT_GIA = la_chu_so_huu(); đối chiếu = quyền danh mục kho.
 *   2. Hình JSON: mọi khóa của kiểu TypeScript (SanPhamBanLe, GoiBanLe, MatHangBanLe, AnhChupGia, TonQuay,
 *      DoiChieuFabi, DongDoiChieu, GhepFabi) đúng là khóa database trả về, không thừa không thiếu.
 *   3. Ô dịch khớp cot_ban_dich(); mọi mã cảnh báo và mã việc database trả về đều có câu vi / en.
 *   4. Trang: đọc form bằng docFormNoiBo, ghi được thì return chuyenHuongNoiBo (303), đọc câu báo đúng trang;
 *      Astro.redirect chỉ dùng cho dòng chặn vai ở đầu trang; fieldset disabled cho vai chỉ xem; nút Lưu là nút
 *      submit đầu tiên; form xác nhận giá nằm ngoài form sửa; ô ẩn phiên bản luôn từ lần đọc mới; không
 *      JavaScript, không ô đánh dấu, không type="number"; không câu nào nói Mini App / website đã đọc menu.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const docNguon = f => readFileSync(join(SRC, f), 'utf8');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — /noi-bo/ban-le: HỢP ĐỒNG VỚI DATABASE VÀ TRANG');

const BL = await nap('ban-le-noi-bo.ts');
const NB = await nap('dieu-huong-noi-bo.ts');
const { QUYEN_KHO } = await nap('kho/chung.ts');
const { db, cnA, duoi } = await dungDatabase();

const VIET = /[ạảãàáâậầấẩẫăắằẳẵặẹẻẽèéêệềếểễịỉĩìíọỏõòóôộồốổỗơợờớởỡụủũùúưựừứửữỵỷỹỳýđĐ]/;
const sapXep = a => JSON.stringify([...a].sort());
const prosrc = async ten => (await db.query(`select prosrc from pg_proc where proname = $1`, [ten])).rows[0]?.prosrc ?? '';
/** Mảng vai của lời gọi co_vai_tro(array[…]) ĐẦU TIÊN trong thân hàm. */
const vaiDau = src => [...(src.match(/co_vai_tro\(array\[([^\]]*)\]/)?.[1] ?? '').matchAll(/'([a-z_]+)'/g)].map(m => m[1]);
const vaiPolicy = async (ten, bang) => {
  const { rows: [r] } = await db.query(
    `select coalesce(pg_get_expr(polqual, polrelid), '') || coalesce(pg_get_expr(polwithcheck, polrelid), '') as bt, polcmd
       from pg_policy where polname = $1 and polrelid = $2::regclass`, [ten, bang]);
  return { vai: [...new Set([...(r?.bt ?? '').matchAll(/'([a-z_]+)'/g)].map(m => m[1]))], lenh: r?.polcmd ?? null };
};
/** Khóa của một interface trong lib/ban-le-noi-bo.ts (bỏ dấu ? của khóa tùy chọn). */
const NGUON_LIB = docNguon('lib/ban-le-noi-bo.ts');
const khoaKieu = ten => [...(NGUON_LIB.match(new RegExp(`export interface ${ten}(?: extends [A-Za-z]+)? \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? '')
  .matchAll(/^\s{2}([a-z_]+)\??:/gm)].map(m => m[1]);
const khoaKieuMotDong = ten => [...(NGUON_LIB.match(new RegExp(`${ten}: \\{([^}]*)\\}`))?.[1] ?? '').matchAll(/([a-z_]+)\??:/g)].map(m => m[1]);

// ===========================================================================
await nhom('1 · Vai: thư viện = database = menu', async () => {
  const luu = vaiDau(await prosrc('ban_le_luu_san_pham'));
  ok('VAI_SUA_BAN_LE = vai trong thân ban_le_luu_san_pham', sapXep(BL.VAI_SUA_BAN_LE) === sapXep(luu), luu.join(', '));
  const tao = vaiDau(await prosrc('ban_le_tao_san_pham'));
  ok('VAI_SUA_BAN_LE = vai trong thân ban_le_tao_san_pham', sapXep(BL.VAI_SUA_BAN_LE) === sapXep(tao), tao.join(', '));
  const xem = vaiDau(await prosrc('ban_le_danh_sach'));
  ok('VAI_XEM_BAN_LE = vai trong thân ban_le_danh_sach', sapXep(BL.VAI_XEM_BAN_LE) === sapXep(xem), xem.join(', '));
  for (const [ten, bang] of [['ban_le_san_pham_doc', 'ban_le_san_pham'], ['ban_le_goi_doc', 'ban_le_goi']]) {
    const p = await vaiPolicy(ten, bang);
    ok(`VAI_XEM_BAN_LE = vai của policy SELECT ${ten}`, p.lenh === 'r' && sapXep(BL.VAI_XEM_BAN_LE) === sapXep(p.vai), p.vai.join(', '));
  }
  // Policy UPDATE chỉ để máy dịch ghi ô en / ko dưới phiên của vai biên tập — KHÔNG phải vai sửa của màn này.
  const dich = await vaiPolicy('ban_le_san_pham_dich', 'ban_le_san_pham');
  ok('Policy UPDATE ban_le_san_pham_dich có marketing (máy dịch) — VAI_SUA_BAN_LE cố ý không theo nó',
     dich.lenh === 'w' && dich.vai.includes('marketing') && !BL.VAI_SUA_BAN_LE.includes('marketing'), dich.vai.join(', '));
  const chot = await prosrc('ban_le_chot_gia');
  ok('VAI_CHOT_GIA = chỉ chủ: ban_le_chot_gia kiểm la_chu_so_huu() ở câu đầu',
     sapXep(BL.VAI_CHOT_GIA) === sapXep(['chu_so_huu']) && /^\s*declare[\s\S]*?begin\s+if not la_chu_so_huu\(\) then/.test(chot));
  const dc = await prosrc('ban_le_doi_chieu');
  ok("Đối chiếu: ban_le_doi_chieu kiểm kho_duoc(p_chi_nhanh_id, 'danh_muc') ở câu đầu; vai danh mục kho = VAI_SUA_BAN_LE (trang đối chiếu chặn theo nó)",
     /begin\s+if not kho_duoc\(p_chi_nhanh_id, 'danh_muc'\) then/.test(dc) && sapXep(QUYEN_KHO.danh_muc) === sapXep(BL.VAI_SUA_BAN_LE));
  ok("Sửa giá mỗi kg (kho_co_quyen('danh_muc')): mọi vai sửa menu đều có quyền danh mục kho",
     /kho_co_quyen\('danh_muc'\)/.test(luu.length ? await prosrc('ban_le_luu_san_pham') : '') && BL.VAI_SUA_BAN_LE.every(v => QUYEN_KHO.danh_muc.includes(v)));
  const muc = NB.MUC_NOI_BO.find(m => m.ma === 'ban_le');
  ok('Mục menu "Bán lẻ" có trên menu nhà hàng, trỏ /noi-bo/ban-le, biểu tượng mat_hang', muc?.link === '/noi-bo/ban-le' && muc?.bieuTuong === 'mat_hang');
  ok('Vai của mục menu "Bán lẻ" = VAI_XEM_BAN_LE (policy SELECT)', sapXep(muc?.vai ?? []) === sapXep(BL.VAI_XEM_BAN_LE));
  ok('Mục "Bán lẻ" đứng ngay sau "Thực đơn"', NB.MUC_NOI_BO.findIndex(m => m.ma === 'ban_le') === NB.MUC_NOI_BO.findIndex(m => m.ma === 'thuc_don') + 1);
  ok('Tên ngắn "Bán lẻ" / "Retail" ≤ 10 ký tự', muc && muc.ngan.vi.length <= 10 && muc.ngan.en.length <= 10);
  ok('GIA_TOI_DA của thư viện là hằng của Beeftown Cân (999.999), không chép số', BL.GIA_TOI_DA === 999999
     && /import \{ GIA_TOI_DA \} from '\.\/kho\/can-tma\.ts'/.test(NGUON_LIB) && !/999999|999_999/.test(NGUON_LIB));
});

// ===========================================================================
await nhom('2 · Hình JSON: khóa của kiểu TypeScript = khóa database trả về', async () => {
  // Một sản phẩm thịt theo cân gắn mặt hàng có mã cân; một hộp kim chi Đang bán (dòng gói của đối chiếu chỉ có khi đang bán).
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  const { rows: [mh] } = await db.query(
    `insert into kho_mat_hang (ma, ten, loai, dem_goi, gia_ban_kg, ma_can) values ('HD-RIB', 'Ribeye hợp đồng', 'phan_cat', false, 950000, '1201') returning id`);
  const { rows: [hop] } = await db.query(
    `insert into kho_mat_hang (ma, ten, loai, dem_goi, don_vi_goi) values ('HD-HOP', 'Kim chi hộp hợp đồng', 'phan_cat', true, 'hộp') returning id`);
  const tao = async (ma, ten, loai, cach) => (await duoi(UID.chu, `select ban_le_tao_san_pham($1, $2, $3, $4, $5) as r`, [maGui(), ma, ten, loai, cach])).rows[0].r.id;
  const idThit = await tao('hd-ribeye', 'Ribeye hợp đồng', 'thit', 'theo_can');
  const idHop = await tao('hd-kim-chi', 'Kim chi hợp đồng', 'kim_chi', 'theo_hop');
  const pb = async id => (await duoi(UID.chu, `select ban_le_danh_sach(null, $1) as r`, [id])).rows[0].r[0].updated_at;
  await duoi(UID.chu, `select ban_le_luu_san_pham($1, $2::timestamptz, $3::jsonb)`,
             [idThit, await pb(idThit), JSON.stringify({ mat_hang_id: mh.id })]);
  await duoi(UID.chu, `select ban_le_luu_san_pham($1, $2::timestamptz, $3::jsonb)`,
             [idHop, await pb(idHop), JSON.stringify({ trang_thai: 'dang_ban', goi: [{ so_gam: 500, gia_rieng: 120000, mat_hang_id: hop.id, ma_fabi: 'KIM-500' }] })]);

  const { rows: [{ r: motSp }] } = await duoi(UID.chu, `select ban_le_danh_sach($1, $2) as r`, [cnA.id, idThit]);
  const sp = motSp[0];
  const { rows: [{ r: ca }] } = await duoi(UID.chu, `select ban_le_danh_sach($1) as r`, [cnA.id]);
  const khoaSp = khoaKieu('SanPhamBanLe');
  ok('Đọc được khóa của interface SanPhamBanLe', khoaSp.length > 30, String(khoaSp.length));
  ok('SanPhamBanLe = khóa của một sản phẩm (đọc một sản phẩm, có ban_dich)', sapXep(khoaSp) === sapXep(Object.keys(sp)),
     `thừa: ${khoaSp.filter(k => !(k in sp)).join(', ')} · thiếu: ${Object.keys(sp).filter(k => !khoaSp.includes(k)).join(', ')}`);
  const spCa = ca.find(x => x.id === idThit);
  ok('Đọc cả menu: không ban_dich, còn lại đúng các khóa đó', !('ban_dich' in spCa)
     && sapXep(khoaSp.filter(k => k !== 'ban_dich')) === sapXep(Object.keys(spCa)));
  ok('ban_dich là khóa tùy chọn trong TypeScript (chỉ có khi đọc một sản phẩm)', /^\s{2}ban_dich\?:/m.test(NGUON_LIB));
  ok('GoiBanLe = khóa của một gói', sapXep(khoaKieu('GoiBanLe')) === sapXep(Object.keys(sp.goi[0])), Object.keys(sp.goi[0]).join(', '));
  ok('MatHangBanLe = khóa của mặt hàng kho kèm theo', sapXep(khoaKieu('MatHangBanLe')) === sapXep(Object.keys(sp.mat_hang)), Object.keys(sp.mat_hang).join(', '));
  ok('AnhChupGia = khóa của gia_de_chot', sapXep(khoaKieu('AnhChupGia')) === sapXep(Object.keys(sp.gia_de_chot)));
  ok('TonQuay = khóa của tồn ở quầy (chủ, có chi nhánh)', sp.ton && sapXep(khoaKieu('TonQuay')) === sapXep(Object.keys(sp.ton)), JSON.stringify(sp.ton));

  const { rows: [{ r: dc }] } = await duoi(UID.chu, `select ban_le_doi_chieu($1) as r`, [cnA.id]);
  ok('DoiChieuFabi = khóa đầu của ban_le_doi_chieu', sapXep(khoaKieu('DoiChieuFabi')) === sapXep(Object.keys(dc)), Object.keys(dc).join(', '));
  const can = dc.dong.find(d => d.loai_dong === 'can');
  const goi = dc.dong.find(d => d.loai_dong === 'goi');
  ok('Có dòng mã cân và dòng gói để so', !!can && !!goi, JSON.stringify(dc.dong.map(d => d.loai_dong)));
  ok('DongDoiChieu = khóa của một dòng (mã cân và gói)', sapXep(khoaKieu('DongDoiChieu')) === sapXep(Object.keys(can))
     && sapXep(Object.keys(can)) === sapXep(Object.keys(goi)), Object.keys(can).join(', '));
  ok('GhepFabi = khóa của mong_doi', sapXep(khoaKieu('GhepFabi')) === sapXep(Object.keys(can.mong_doi)));
  ok('tren_fabi của DongDoiChieu: co, ma, ten, dang_ban', sapXep(khoaKieuMotDong('tren_fabi')) === sapXep(['co', 'ma', 'ten', 'dang_ban']));
  ok('loai_dong của TypeScript đủ năm loại của database',
     ['can', 'o_ma', 'ma_giam', 'goi', 'kiem_tra'].every(l => NGUON_LIB.includes(`'${l}'`)) && /'kiem_tra'/.test(await prosrc('ban_le_doi_chieu')));
  ok('Kiểu KetQuaHamLuu = khóa ban_le_luu_san_pham trả khi ok', await (async () => {
    const r = (await duoi(UID.chu, `select ban_le_luu_san_pham($1, $2::timestamptz, '{}'::jsonb) as r`, [idThit, await pb(idThit)])).rows[0].r;
    return r.ok === true && sapXep(khoaKieu('KetQuaHamLuu')) === sapXep(Object.keys(r));
  })());
});

// ===========================================================================
await nhom('3 · Ô dịch, mã cảnh báo, mã việc: khớp database, đủ hai thứ tiếng', async () => {
  const { rows } = await db.query(`select cot, nguon from cot_ban_dich() where bang = 'ban_le_san_pham'`);
  const tuDB = rows.map(d => `${d.cot}<-${d.nguon}`).sort().join();
  const tuWeb = BL.O_DICH_BAN_LE.map(o => `${o.cot}<-${o.nguon}`).sort().join();
  ok('O_DICH_BAN_LE khớp đúng các ô dịch của ban_le_san_pham trong cot_ban_dich()', tuDB === tuWeb, `${tuDB} | ${tuWeb}`);
  const { rows: cot } = await db.query(`select column_name from information_schema.columns where table_name = 'ban_le_san_pham'`);
  const coCot = new Set(cot.map(c => c.column_name));
  ok('Mọi ô dịch của form là cột thật (<ô>_en, <ô>_ko)', BL.O_DICH_BAN_LE.every(o => coCot.has(`${o.cot}_en`) && coCot.has(`${o.cot}_ko`)));

  const json = await prosrc('ban_le_san_pham_json');
  const maCanh = [...json.matchAll(/v_canh := v_canh \|\| '([a-z_]+)'::text/g)].map(m => m[1]);
  ok('Đọc được các mã cảnh báo của ban_le_san_pham_json', maCanh.length >= 9, maCanh.join(', '));
  const thieuCanh = maCanh.filter(m => !BL.CANH_BAO_BAN_LE[m]);
  ok('Mọi mã cảnh báo database trả về đều có câu', thieuCanh.length === 0, thieuCanh.join(', '));
  const enCanh = maCanh.map(m => BL.cauCanhBao(m, 'en'));
  ok('Câu cảnh báo đủ tiếng Anh', enCanh.every(c => !VIET.test(c)), enCanh.filter(c => VIET.test(c)).join(' | '));

  const dc = await prosrc('ban_le_doi_chieu');
  const maViec = [...new Set([
    ...[...dc.matchAll(/v_viec \|\| '([a-z_]+)'::text/g)].map(m => m[1]),
    ...[...dc.matchAll(/then '([a-z_]+)' else '([a-z_]+)' end/g)].flatMap(m => [m[1], m[2]]),
    ...[...dc.matchAll(/array\['([a-z_]+)'\]/g)].map(m => m[1]),
    ...[...dc.matchAll(/jsonb_build_array\('([a-z_]+)'\)/g)].map(m => m[1]),
  ])];
  ok('Đọc được các mã việc của ban_le_doi_chieu', maViec.length >= 14, maViec.join(', '));
  const dong = { loai_dong: 'goi', ma_fabi: 'RIB-200', ma_can: null, so_o: null, phan_tram: null, ten_san_pham: 'Ribeye', san_pham_id: null,
    so_gam: 200, gia_phai_dat: 190000, tren_fabi: null, ghep: null, mong_doi: { kieu: 'mon', mat_hang_ten: 'Ribeye', don_vi_ban: 'goi', kg_moi_don_vi: 0.2 }, viec: maViec };
  const vi = BL.cauViecDoiChieu(dong, 'vi');
  const en = BL.cauViecDoiChieu(dong, 'en');
  ok('Mọi mã việc database trả về đều có câu tiếng Việt (không còn mã thô)', vi.every((c, i) => c !== maViec[i]), vi.filter((c, i) => c === maViec[i]).join(', '));
  ok('…và câu tiếng Anh', en.every(c => !VIET.test(c) && !/^[a-z_]+$/.test(c)), en.filter(c => VIET.test(c) || /^[a-z_]+$/.test(c)).join(' | '));
  ok('Việc "đặt giá" nói đúng câu đã duyệt, kèm giá phải đặt',
     vi[maViec.indexOf('dat_gia')] === 'Giá chưa chốt hoặc đã đổi sau lần chốt — chốt giá rồi đặt 190.000 đ trên FABi.');
  ok('Việc "kiểm tra món" là câu xem lại, không phải lệnh tắt',
     vi[maViec.indexOf('kiem_tra_mon')] === 'FABi đang bán mã này, trừ cùng mặt hàng, nhưng menu bán lẻ không có — tắt trên FABi nếu không còn bán.');
  ok('Giá phải đặt: dòng gói là giá gói, dòng cân là giá mỗi kg',
     BL.giaPhaiDat(dong, 'vi') === '190.000 đ' && BL.giaPhaiDat({ ...dong, loai_dong: 'can', gia_phai_dat: 950000 }, 'vi') === '950.000 đ/kg');
});

// ===========================================================================
await nhom('4 · Ba trang: form an toàn, chuyển hướng 303, không JavaScript, câu đúng sự thật', async () => {
  const ds = docNguon('pages/noi-bo/ban-le/index.astro');
  const sua = docNguon('pages/noi-bo/ban-le/[id].astro');
  const dc = docNguon('pages/noi-bo/ban-le/doi-chieu.astro');
  const BA = [['index.astro', ds], ['[id].astro', sua], ['doi-chieu.astro', dc]];

  for (const [ten, s] of [['index.astro', ds], ['[id].astro', sua]]) {
    ok(`${ten}: đọc form bằng docFormNoiBo(Astro.request), không request.formData() trần`,
       /docFormNoiBo\(Astro\.request\)/.test(s) && !/request\.formData\(\)/.test(s));
    ok(`${ten}: ghi được thì return chuyenHuongNoiBo(…) (303)`, /return chuyenHuongNoiBo\(/.test(s));
    ok(`${ten}: đọc câu báo bằng đúng docBaoNoiBo(Astro.cookies, Astro.url.pathname)`, /docBaoNoiBo\(Astro\.cookies, Astro\.url\.pathname\)/.test(s));
    ok(`${ten}: báo CAU_DOC_FORM_HONG khi thân form hỏng`, /CAU_DOC_FORM_HONG\[nn\]/.test(s));
    ok(`${ten}: giữ ?cn= khi gửi form (action = pathname + search)`, /const duongDan = Astro\.url\.pathname \+ Astro\.url\.search;/.test(s) && /action=\{duongDan\}/.test(s));
  }
  for (const [ten, s] of BA) {
    const chuyen = [...s.matchAll(/Astro\.redirect\([^)]*\)/g)].map(m => m[0]);
    ok(`${ten}: Astro.redirect chỉ ở dòng chặn vai đầu trang (thành công đi qua chuyenHuongNoiBo)`,
       chuyen.length === 1 && chuyen[0] === "Astro.redirect('/noi-bo', 302)"
       && /if \(!\(VAI_XEM_BAN_LE as readonly string\[\]\)\.includes\(nhanSu\.vai_tro\)\) return Astro\.redirect\('\/noi-bo', 302\);/.test(s), chuyen.join(' · '));
    ok(`${ten}: không <script>, không onclick (không JavaScript)`, !/<script|onclick=/i.test(s));
    ok(`${ten}: không ô đánh dấu, không ô chọn một (có / không là select)`, !/type="(checkbox|radio)"/.test(s));
    ok(`${ten}: không type="number" (ô số là text + inputmode)`, !/type="number"/.test(s));
    ok(`${ten}: không viết {n && …} với số đếm (in ra chữ "0")`, !/\{\s*[a-zA-Z.]*(length|size|so[A-Z][a-zA-Z]*)\s*&&/.test(s));
  }

  ok('index.astro: thêm được thì chuyển 303 sang trang sửa với câu "Đã tạo — điền giá, gói rồi bấm Lưu."',
     /return chuyenHuongNoiBo\(Astro, \{ ok: true, cau: t\.daTao \}, `\/noi-bo\/ban-le\/\$\{kq\.id\}`\)/.test(ds)
     && ds.includes("daTao:      { vi: 'Đã tạo — điền giá, gói rồi bấm Lưu.'"));
  ok('index.astro: ma_gui ẩn, giữ nguyên khi dựng lại form hỏng', /<input type="hidden" name="ma_gui" value=\{maGui\} \/>/.test(ds)
     && /const maGui = laUuid\(maGuiCu\) \? maGuiCu : crypto\.randomUUID\(\);/.test(ds));
  ok('index.astro: ô mã không tự viết hoa, không soát chính tả', /name="ma" maxlength="40"[^>]*autocapitalize="none" spellcheck="false"/.test(ds));
  ok('index.astro: một ô "Bán thế nào" (loại + cách bán), ô mã nằm trong <details>', /<select name="kieu" required>/.test(ds)
     && /<details class="bl-goi-y"[^>]*>\s*<summary>\{t\.maTom\}<\/summary>/.test(ds));
  ok('index.astro: thẻ sản phẩm là a.nb-dong, không link lồng trong thẻ',
     (() => { const the = ds.match(/<a href=\{`\/noi-bo\/ban-le\/\$\{sp\.id\}`\} class="nb-dong bl-the">([\s\S]*?)\n {6}<\/a>/); return !!the && !/<a[\s>]/.test(the[1]); })());
  ok('index.astro: câu dẫn đúng câu đã duyệt (Mini App, website ở bước sau)', ds.includes(
    "vi: 'Thịt và kim chi bán mang về. Giá mỗi kg ở đây là giá cân quầy (cùng ô với Kho → Mặt hàng). Mini App Zalo và website sẽ đọc menu này ở bước sau. FABi sửa tay theo danh sách Đối chiếu FABi.'"));
  ok('index.astro: vai chỉ xem thấy "Chỉ chủ và quản lý sửa được menu bán lẻ, kể cả mô tả."',
     ds.includes("'Chỉ chủ và quản lý sửa được menu bán lẻ, kể cả mô tả.'") && /\{!duocSua && <div class="nb-bao luu-y"><p>\{t\.chiDoc\}<\/p><\/div>\}/.test(ds));

  ok('[id].astro: form sửa bọc trong <fieldset disabled={!duocSua}>', /<fieldset disabled=\{!duocSua\}>/.test(sua));
  const formSua = sua.slice(sua.indexOf('class="bl-soan"'), sua.indexOf('</form>', sua.indexOf('class="bl-soan"')));
  const nutDau = formSua.match(/<button type="submit"[^>]*>/)?.[0] ?? '';
  ok('[id].astro: nút submit đầu tiên của form sửa là Lưu (Enter trong ô chữ chỉ lưu)', /name="viec" value="luu"/.test(nutDau), nutDau);
  ok('[id].astro: "Hủy" là link, không phải nút submit', /<a href="\/noi-bo\/ban-le" class="nb-nut phu">\{t\.huy\}<\/a>/.test(formSua));
  ok('[id].astro: form xác nhận giá nằm NGOÀI form sửa, gửi kèm đúng giá đang hiện (gia_de_chot) và phiên bản',
     !formSua.includes('value="chot"') && /name="viec" value="chot"/.test(sua)
     && /name="gia_da_xem" value=\{JSON\.stringify\(sp\.gia_de_chot\)\}/.test(sua));
  ok('[id].astro: nút xác nhận ghi việc ngoài đời "Giá này đúng — bỏ chữ Giá thử", chỉ cho chủ',
     sua.includes("'Giá này đúng — bỏ chữ Giá thử'") && /\{duocChot && coGia && sp\.gia_thu && \(/.test(sua));
  ok('[id].astro: ô ẩn phiên bản luôn từ lần đọc mới (sp), không từ chữ đã gõ',
     /name="phien_ban" value=\{sp\.updated_at\}/.test(sua) && /name="gia_ban_kg_cu" value=\{sp\.mat_hang\.gia_ban_kg/.test(sua)
     && /name=\{`goc_\$\{k\}`\} value=\{String\(\(sp as unknown as Record<string, unknown>\)\[k\]/.test(sua)
     && /name="mat_hang_id_cu" value=\{sp\.mat_hang_id/.test(sua) && /name=\{`\$\{p\}so_gam_cu`\} value=\{g\.so_gam\}/.test(sua));
  ok('[id].astro: lưu xong thì dịch nền đúng sản phẩm (bang ban_le_san_pham)',
     /chayNen\(Astro\.locals, dichBu\(client, \{ bang: 'ban_le_san_pham', dongId: id \}\)\)/.test(sua)
     && /oDangCho\(client, 'ban_le_san_pham', id\)/.test(sua) && /viec === 'dich' \? cauTomTat\(await dichBu\(client, \{ bang: 'ban_le_san_pham', dongId: id \}\), nn\)/.test(sua));
  ok('[id].astro: ô tiền là text + inputmode numeric', /name="gia_ban_kg" inputmode="numeric"/.test(sua) && /name=\{`\$\{p\}gia_rieng`\} inputmode="numeric"/.test(sua));
  ok('[id].astro: mã FABi không soát chính tả, không tự viết hoa (phân biệt hoa thường); mã vạch inputmode numeric',
     /name=\{`\$\{p\}ma_fabi`\} maxlength="40" spellcheck="false" autocapitalize="none"/.test(sua) && /name=\{`\$\{p\}ma_vach`\} inputmode="numeric"/.test(sua));
  ok('[id].astro: lựa chọn mặt hàng kho ghi tên, mã nằm trong title, nhóm theo loại (optgroup)',
     /<option value=\{m\.id\} title=\{m\.ma\}/.test(sua) && /<optgroup label=\{g\.ten\}>/.test(sua));
  ok('[id].astro: mỗi gói một fieldset (không bảng trên điện thoại); gói đang có có Giữ / Ngưng bán / Bỏ gói này',
     /<fieldset class="bl-goi">/.test(sua) && !/<table/.test(sua) && /value="bo"/.test(sua) && /value="ngung"/.test(sua));
  ok('[id].astro: báo đỏ trước khi lưu khi giá mỗi kg quá cửa sổ cân (GIA_TOI_DA)', /const quaCan = [^\n]*> GIA_TOI_DA;/.test(sua)
     && sua.includes('Lưu giá này thì cân VẪN IN GIÁ CŨ cho mã'));
  ok('[id].astro: xem trước ghi rõ là khi Mini App đọc menu (bước sau)', sua.includes("'Xem trước — khi Mini App đọc menu này (bước sau)'"));
  ok('[id].astro: nhãn tiếng Anh của ô chỉ có tiếng Việt ghi "(in Vietnamese)"',
     ['Product name (in Vietnamese)', 'Short description (in Vietnamese)', 'How to use or grill (in Vietnamese)'].every(c => sua.includes(c)));

  ok('doi-chieu.astro: không xử lý POST (chỉ đọc)', !/request\.method === 'POST'/.test(dc) && !/method="POST"/.test(dc));
  ok('doi-chieu.astro: chỉ đọc đối chiếu cho VAI_SUA_BAN_LE, vai khác thấy câu chỉ đọc',
     /const duocSua = \(VAI_SUA_BAN_LE as readonly string\[\]\)\.includes\(nhanSu\.vai_tro\);/.test(dc) && /if \(duocSua\) \{/.test(dc));
  ok('doi-chieu.astro: thực đơn FABi cũ → luu-y dẫn sang /noi-bo/kho/cai-dat/ipos', /<a href="\/noi-bo\/kho\/cai-dat\/ipos">/.test(dc));
  ok('doi-chieu.astro: link Ghép món mang ?ma=<mã FABi>&cn=<mã chi nhánh>',
     /\/noi-bo\/kho\/ban-ipos\/ghep\?ma=\$\{encodeURIComponent\(d\.ma_fabi!\)\}&cn=\$\{encodeURIComponent\(chiNhanh!\.ma\)\}/.test(dc));
  ok('doi-chieu.astro: thẻ dòng là article (link Ghép món không lồng trong link)', /<article class="nb-dong">/.test(dc) && !/<a [^>]*class="nb-dong/.test(dc));

  // CLAUDE.md mục 7: Mini App và website CHƯA đọc menu này — không câu nào được nói như đã đọc.
  const tatCa = [ds, sua, dc, NGUON_LIB].join('\n');
  const SAI = [/tự nhận/, /Mini App (Zalo )?và website (tự )?nhận/, /đọc từ đây/, /Khách thấy trên Mini App/, /Mini App (Zalo )?(đang|đã) đọc/,
    /nhận trong khoảng 1 phút/];
  const thay = SAI.filter(r => r.test(tatCa)).map(String);
  ok('Không câu nào nói Mini App / website đã đọc menu bán lẻ', thay.length === 0, thay.join(', '));
  ok('Chuỗi "đặt bàn thành công" không có trong ba trang và thư viện', !/đặt bàn thành công/i.test(tatCa));
});

await db.close();
process.exit(ketThuc('/noi-bo/ban-le'));
