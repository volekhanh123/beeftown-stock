/**
 * BEEFTOWN — MUA THỊT VỀ: KHÁCH CẦN XUẤT HÓA ĐƠN ĐỎ (0125)
 * ========================================================
 *
 *     node test/test-mua-thit-hoa-don.mjs
 *
 * Khánh 18/11/2026: quán có xuất hóa đơn đỏ, cần một mẫu để khách nhập thông tin. Trang Mua thịt về có ô "Cần xuất hóa
 * đơn đỏ"; chọn thì khách điền tên đơn vị, mã số thuế, địa chỉ đơn vị, email nhận hóa đơn. File này kiểm database (0125:
 * tao_don_mua_thit nhận p_hoa_don, hai ràng buộc của bảng, hộp thư trả năm cột), thư viện của trang
 * (web/src/lib/dat-hang-mua-thit.ts, don-mua-thit.ts) và luật mã số thuế / email chạy ở cả hai bên trên cùng một bảng
 * chữ. Component: test-cong-khai-mua-thit-ve.mjs nhóm 12; màn nhân viên: test-noi-bo-don-mua-thit.mjs nhóm 4.
 * Theo 9 mục "xong":
 *
 *   1. quyen — anon tạo được đơn có hóa đơn mà không đọc lại được gì ngoài mã đơn; authenticated không gọi được hàm
 *      đặt hàng; chỉ còn MỘT tao_don_mua_thit (bản mười tham số đã bỏ); hộp thư trả năm cột hóa đơn cho chủ, quản lý,
 *      thu ngân chi nhánh mình — quản lý chi nhánh khác, marketing, anon thì không.
 *   2. bam-hai-lan — cùng ma_gui gửi lại (kể cả đổi hay bỏ thông tin hóa đơn) → đơn cũ, thông tin hóa đơn cũ.
 *   3. gio-vn — không áp dụng: thông tin hóa đơn không có ngày giờ; hộp thư in giờ đặt như trước (gioVnTuMs).
 *   4. chu-va-so — mã số thuế: dấu cách, dấu chấm, mọi kiểu gạch ngang, 13 số liền → cùng một dạng ở web và database;
 *      9 / 11 / 12 số, 10 số - 2 số, chữ cái bị từ chối ở cả hai bên; email đúng / sai giống nhau ở hai bên; tên đơn
 *      vị, địa chỉ có dấu nguyên vẹn, khoảng trắng gộp lại.
 *   5. mat-mang — supabase-js thật trên fetch giả: mất mạng khi gửi đơn có hóa đơn → KHÔNG CHẮC; database chưa chạy 0125
 *      (PGRST202) → CHƯA ghi, không "đã nhận"; database từ chối mã số thuế → CHƯA ghi, đúng câu từng thứ tiếng.
 *   6. ton-kho — kho_doi_soat_ton() rỗng.
 *   7. cau-chu — câu raise mới của 0125 có bản en, ko (trang) và en (nội bộ); câu chặn sớm ba thứ tiếng, không chữ cấm.
 *   8. migration — không câu delete, không current_date; ràng buộc chặn cả đường ghi thẳng (superuser); đơn không chọn
 *      hóa đơn không giữ chữ nào của hóa đơn; lỗi hóa đơn không tốn lượt giới hạn tần suất.
 *   9. dich-vu-ngoai — không áp dụng: database và trang không gọi dịch vụ hóa đơn điện tử nào (nhân viên tự xuất).
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { dungDatabase, taoBoDem, maGui, UID } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIB = join(GOC, 'web', 'src', 'lib');
const nap = f => import(pathToFileURL(join(LIB, f)).href);
const TEP_0125 = join(GOC, 'crm', 'supabase', 'migrations', '0125_mua_thit_hoa_don_do.sql');

const DH = await nap('dat-hang-mua-thit.ts');
const DMT = await nap('don-mua-thit.ts');
const XL = await nap('xu-ly-form.ts');
const { cauLoiDatabase } = await nap('chu.ts');
const { dichCau } = await nap('cau-noi-bo.ts');
const { timChuoiCam } = await nap('chuoi-cam.js');
const requireWeb = createRequire(join(GOC, 'web', 'package.json'));
const { createClient } = await import(pathToFileURL(requireWeb.resolve('@supabase/supabase-js')).href);

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — MUA THỊT VỀ: KHÁCH CẦN XUẤT HÓA ĐƠN ĐỎ (0125)');
const { db, duoi, duoiAnon } = await dungDatabase();

const NGON_NGU = ['vi', 'en', 'ko'];
const VIET = /[ạảãàáâậầấẩẫăắằẳẵặẹẻẽèéêệềếểễịỉĩìíọỏõòóôộồốổỗơợờớởỡụủũùúưựừứửữỵỷỹỳýđĐ]/;
const vi = r => (r.loi ? `${r.ma}: ${r.loi}` : JSON.stringify(r.kq ?? r.rows));
const goi = async (uid, sql, p = []) => {
  const r = await (uid === 'anon' ? duoiAnon(sql, p) : duoi(uid, sql, p));
  return { ...r, kq: r.rows?.[0]?.r };
};
const nghi = () => new Promise(xong => setTimeout(xong, 3));

// ---------------------------------------------------------------------------
// Menu bán lẻ — qua các hàm ban_le_* dưới vai chủ (khuôn test-mua-thit-dat-hang.mjs)
// ---------------------------------------------------------------------------
async function matHang(ma, gia) {
  const { rows: [r] } = await db.query(
    `insert into kho_mat_hang (ma, ten, loai, dem_goi, gia_ban_kg) values ($1, $1, 'phan_cat', false, $2) returning id`, [ma, gia]);
  return r.id;
}
const docSanPham = async id => (await goi(UID.chu, `select ban_le_danh_sach(null, $1) as r`, [id])).kq?.[0];
async function luu(id, duLieu) {
  await nghi();
  const sp = await docSanPham(id);
  const r = await goi(UID.chu, `select ban_le_luu_san_pham($1, $2::timestamptz, $3::jsonb) as r`,
                      [id, sp.updated_at, JSON.stringify(duLieu)]);
  if (r.loi || r.kq?.ok !== true) throw new Error(`không lưu được ${sp?.ma}: ${vi(r)}`);
}
async function chot(id) {
  await nghi();
  const sp = await docSanPham(id);
  const r = await goi(UID.chu, `select ban_le_chot_gia($1, $2::timestamptz, $3::jsonb) as r`,
                      [id, sp.updated_at, JSON.stringify(sp.gia_de_chot)]);
  if (r.loi || r.kq?.ok !== true) throw new Error(`không chốt được giá: ${vi(r)}`);
}
async function tao(ma, ten) {
  const r = await goi(UID.chu, `select ban_le_tao_san_pham($1, $2, $3, 'thit', 'theo_can') as r`, [maGui(), ma, ten]);
  if (r.loi || !r.kq?.id) throw new Error(`không tạo được ${ma}: ${vi(r)}`);
  return r.kq.id;
}

// ---------------------------------------------------------------------------
// Đặt hàng như trang gọi: mỗi lần một mã chống gửi hai lần, một số điện thoại, một IP. Thông tin hóa đơn mẫu là dữ
// liệu giả (mã số thuế đúng dạng, tên miền example.com dành riêng cho ví dụ).
// ---------------------------------------------------------------------------
const HOA_DON = {
  ten_don_vi: 'CÔNG TY TNHH THỬ NGHIỆM BÒ TƯƠI',
  ma_so_thue: '0123456789',
  dia_chi: 'Số 1 Đường Thử, Phường Thử Nghiệm, Thành phố Hồ Chí Minh',
  email: 'ketoan@example.com',
};
let thuTu = 0;
const sdtMoi = () => `09${String(30000000 + ++thuTu).slice(-8)}`;
const ipMoi = () => `198.51.100.${(thuTu % 250) + 1}`;
let GIA = {};
const SQL_DAT = `select tao_don_mua_thit($1::uuid, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10::inet, $11::jsonb) as r`;
/** hoaDon: object (gửi dạng JSON), null (không cần hóa đơn), hay chuỗi JSON thô qua hoaDonTho ('"abc"', '[1]', 'null'). */
async function datHang(them = {}, uid = 'anon') {
  const p = { maGui: maGui(), cn: 'q1', hoTen: 'Nguyễn Thị Hoa', sdt: sdtMoi(), diaChi: '12 Nguyễn Huệ, phường Sài Gòn',
              ghiChu: null, gio: { 'ribeye-uc_200': 1 }, gia: GIA, nn: 'vi', ip: ipMoi(), hoaDon: HOA_DON, ...them };
  const hoaDon = 'hoaDonTho' in them ? them.hoaDonTho : p.hoaDon === null ? null : JSON.stringify(p.hoaDon);
  return goi(uid, SQL_DAT, [p.maGui, p.cn, p.hoTen, p.sdt, p.diaChi, p.ghiChu, JSON.stringify(p.gio), JSON.stringify(p.gia),
                            p.nn, p.ip, hoaDon]);
}
const dongDon = async ma => (await db.query(`select * from don_mua_thit where ma_don = $1`, [ma])).rows[0];
const demDon = async () => Number((await db.query(`select count(*) n from don_mua_thit`)).rows[0].n);
// Bảng chữ ở nhóm 4 đặt nhiều đơn liền: trả lại lượt giới hạn tần suất của chi nhánh (30 đơn mỗi giờ) giữa các nhóm.
const traLuot = () => db.query(`delete from gioi_han_luot where viec = 'tao_don_mua_thit'`);
const hopThu = uid => goi(uid, `select coalesce(jsonb_agg(x), '[]') as r from don_mua_thit_danh_sach('tat_ca') x`);

// ===========================================================================
await nhom('0 · DỰNG MENU: một phần thịt đã chốt giá, công tắc bật', async () => {
  const mh = await matHang('RIBEYE-UC', 950000);
  const id = await tao('ribeye-uc', 'Ribeye Úc');
  await luu(id, { mat_hang_id: mh, trang_thai: 'dang_ban', thu_tu: 1, bao_quan: 'mat' });
  await chot(id);
  const r = await goi(UID.chu, `select dat_noi_dung('hien_mua_thit_ve', p_bool := true, p_cong_bo := true) as r`);
  ok('Công bố công tắc hien_mua_thit_ve', r.loi === null, vi(r));
  const { rows } = await duoiAnon(`select * from mua_thit_ve_cong_khai('vi', 'q1')`);
  GIA = Object.fromEntries((rows ?? []).map(d => [`${d.san_pham_ma}_${d.so_gam}`, Number(d.gia)]));
  ok('Menu công khai có gói ribeye 200 g', GIA['ribeye-uc_200'] > 0, JSON.stringify(GIA));
});

// ===========================================================================
let MA_CO_HOA_DON = '';
await nhom('1 · QUYỀN', async () => {
  const r = await datHang();
  ok('anon tạo được đơn có hóa đơn đỏ; trả lời chỉ có {ma_don, tam_tinh, da_co} — không đọc lại thông tin hóa đơn',
     r.loi === null && JSON.stringify(Object.keys(r.kq ?? {}).sort()) === '["da_co","ma_don","tam_tinh"]', vi(r));
  MA_CO_HOA_DON = r.kq?.ma_don ?? '';
  const d = await dongDon(MA_CO_HOA_DON);
  ok('Đơn ghi đủ năm cột hóa đơn đúng như khách điền',
     d?.xuat_hoa_don === true && d.hoa_don_ten_don_vi === HOA_DON.ten_don_vi && d.hoa_don_ma_so_thue === HOA_DON.ma_so_thue
       && d.hoa_don_dia_chi === HOA_DON.dia_chi && d.hoa_don_email === HOA_DON.email, JSON.stringify(d));

  const docThang = await duoiAnon(`select hoa_don_ma_so_thue, hoa_don_email from don_mua_thit`);
  ok('anon KHÔNG đọc được cột hóa đơn của bảng', docThang.loi !== null && /permission denied/i.test(docThang.loi), vi(docThang));
  const tuTao = await datHang({}, UID.qlA);
  ok('authenticated KHÔNG gọi được tao_don_mua_thit bản mới (chỉ website, dưới anon)',
     tuTao.loi !== null && /permission denied/i.test(tuTao.loi), vi(tuTao));

  const { rows: ham } = await db.query(
    `select p.oid::regprocedure::text as ky, has_function_privilege('anon', p.oid, 'execute') as anon,
            has_function_privilege('authenticated', p.oid, 'execute') as dang_nhap,
            has_function_privilege('public', p.oid, 'execute') as cong
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'tao_don_mua_thit'`);
  ok('Chỉ còn MỘT tao_don_mua_thit: mười một tham số, p_hoa_don jsonb cuối; anon gọi được, authenticated và PUBLIC không',
     ham.length === 1 && /,jsonb,jsonb,text,inet,jsonb\)$/.test(ham[0].ky) && ham[0].anon === true && ham[0].dang_nhap === false
       && ham[0].cong === false, JSON.stringify(ham));
  const { rows: ds } = await db.query(
    `select has_function_privilege('anon', 'don_mua_thit_danh_sach(text)', 'execute') as anon,
            has_function_privilege('authenticated', 'don_mua_thit_danh_sach(text)', 'execute') as dang_nhap,
            has_function_privilege('public', 'don_mua_thit_danh_sach(text)', 'execute') as cong`);
  ok('Hộp thư tạo lại: authenticated gọi được (hàm tự kiểm vai), anon và PUBLIC không',
     ds[0].anon === false && ds[0].dang_nhap === true && ds[0].cong === false, JSON.stringify(ds));

  for (const [ten, uid] of [['Chủ', UID.chu], ['Quản lý Q1', UID.qlA], ['Thu ngân Q1', UID.thuNganA]]) {
    const x = await hopThu(uid);
    const dong = (x.kq ?? []).find(o => o.ma_don === MA_CO_HOA_DON);
    ok(`${ten} thấy đủ năm cột hóa đơn trong hộp thư`,
       dong?.xuat_hoa_don === true && dong.hoa_don_ten_don_vi === HOA_DON.ten_don_vi && dong.hoa_don_ma_so_thue === HOA_DON.ma_so_thue
         && dong.hoa_don_dia_chi === HOA_DON.dia_chi && dong.hoa_don_email === HOA_DON.email, vi(x));
  }
  const qlB = await hopThu(UID.qlB);
  ok('Quản lý Q7 KHÔNG thấy đơn có hóa đơn của Q1', qlB.loi === null && !(qlB.kq ?? []).some(o => o.ma_don === MA_CO_HOA_DON), vi(qlB));
  const mkt = await hopThu(UID.mktA);
  ok('Marketing KHÔNG xem được hộp thư (thông tin hóa đơn đi cùng đơn)', mkt.loi !== null && /Không có quyền xem đơn mua thịt/.test(mkt.loi), vi(mkt));
  const anon = await duoiAnon(`select * from don_mua_thit_danh_sach('tat_ca')`);
  ok('anon KHÔNG gọi được hộp thư', anon.loi !== null && /permission denied/i.test(anon.loi), vi(anon));

  const { rows: dinh } = await db.query(
    `select proname, prosecdef, coalesce(array_to_string(proconfig, ','), '') as cau_hinh
     from pg_proc where proname in ('tao_don_mua_thit', 'don_mua_thit_danh_sach')`);
  ok('Hai hàm tạo lại vẫn security definer, set search_path = public',
     dinh.length === 2 && dinh.every(h => h.prosecdef && /search_path=public/.test(h.cau_hinh)), JSON.stringify(dinh));
});

// ===========================================================================
await nhom('2 · BẤM HAI LẦN', async () => {
  const ma = maGui();
  const truoc = await demDon();
  const lan1 = await datHang({ maGui: ma });
  const lan2 = await datHang({ maGui: ma, hoaDon: { ...HOA_DON, ten_don_vi: 'CÔNG TY KHÁC', email: 'khac@example.com' } });
  const lan3 = await datHang({ maGui: ma, hoaDon: null });
  ok('Gửi lại cùng mã (đổi thông tin hóa đơn, hay bỏ chọn hóa đơn) → cùng mã đơn, da_co, chỉ một dòng',
     lan1.loi === null && [lan2, lan3].every(l => l.loi === null && l.kq?.da_co === true && l.kq?.ma_don === lan1.kq?.ma_don)
       && (await demDon()) === truoc + 1, [lan1, lan2, lan3].map(vi).join(' | '));
  const d = await dongDon(lan1.kq?.ma_don);
  ok('Đơn giữ thông tin hóa đơn của lần gửi đầu', d?.xuat_hoa_don === true && d.hoa_don_ten_don_vi === HOA_DON.ten_don_vi
     && d.hoa_don_email === HOA_DON.email, JSON.stringify(d));
});

// ===========================================================================
// Mã số thuế: [khách gõ, dạng database lưu | null = từ chối]. Cùng một chuỗi vào cả hai bên.
const BANG_MA_SO_THUE = [
  ['0123456789', '0123456789'],
  [' 0123 456 789 ', '0123456789'],
  ['0123.456.789', '0123456789'],
  ['0123456789-001', '0123456789-001'],
  ['0123456789 - 001', '0123456789-001'],
  ['0123456789\u2013001', '0123456789-001'],   // gạch ngắn (Word tự đổi)
  ['0123456789\u2014001', '0123456789-001'],   // gạch dài
  ['0123456789\u2212001', '0123456789-001'],   // dấu trừ
  ['0123456789\u2011001', '0123456789-001'],   // gạch không ngắt
  ['0123456789001', '0123456789-001'],         // 13 số liền: bàn phím số của điện thoại không có dấu gạch
  ['0123456789\u00a0', '0123456789'],          // cách không ngắt (dán từ Word)
  ['\u200b0123456789', '0123456789'],          // ký tự rộng 0 (dán từ PDF)
  ['\t0123456789\n', '0123456789'],
  ['012345678', null],                         // 9 số
  ['01234567890', null],                       // 11 số
  ['012345678901', null],                      // 12 số (số định danh cá nhân) — chưa nhận
  ['0123456789-01', null],                     // 10 số - 2 số
  ['0123456789-0001', null],
  ['0123456789--001', null],
  ['0123456789/001', null],
  ['MST0123456789', null],
  ['０１２３４５６７８９', null],                // số toàn khổ — không đoán
  ['', null],
];
// Email: [chuỗi web gửi (đã bỏ khoảng trắng hai đầu), database nhận?].
const BANG_EMAIL = [
  ['ketoan@example.com', true],
  ['Ke.Toan+hoadon@cong-ty.example.vn', true],
  ['a_b%c-d@x.example.co', true],
  ['KETOAN@EXAMPLE.COM', true],
  [`${'a'.repeat(188)}@example.com`, true],    // 200 ký tự
  ['ketoan', false],
  ['ketoan@example', false],
  ['ketoan@example.', false],
  ['ketoan@.vn', false],
  ['ketoan@example.c', false],
  ['ketoan@example..com', false],
  ['ke toan@example.com', false],
  ['kế.toán@example.vn', false],
  ['ketoan@@example.com', false],
  ['@example.com', false],
  ['ketoan@exam_ple.com', false],
  ['ketoan@example.com,khac@example.com', false],
  [`${'a'.repeat(189)}@example.com`, false],   // 201 ký tự
];

await nhom('4 · CHỮ VÀ SỐ: MÃ SỐ THUẾ, EMAIL, TÊN ĐƠN VỊ — WEB VÀ DATABASE CÙNG MỘT LUẬT', async () => {
  await traLuot();
  for (const [vao, ra] of BANG_MA_SO_THUE) {
    const r = await datHang({ hoaDon: { ...HOA_DON, ma_so_thue: vao } });
    const d = r.kq?.ma_don ? await dongDon(r.kq.ma_don) : null;
    const web = DMT.chuanHoaMaSoThue(vao);
    const loiWeb = DMT.loiOHoaDon('maSoThue', vao);
    const ten = JSON.stringify(vao);
    if (ra === null) {
      ok(`Mã số thuế ${ten} bị từ chối ở database ("Mã số thuế phải gồm 10 số…") VÀ ở web (saiMaSoThue)`,
         r.loi !== null && /^Mã số thuế phải gồm 10 số, hoặc 10 số - 3 số/.test(r.loi) && loiWeb === 'saiMaSoThue', `${vi(r)} · web: ${loiWeb}`);
    } else {
      ok(`Mã số thuế ${ten} → database lưu "${ra}", web chuẩn hóa ra cùng chuỗi`,
         r.loi === null && d?.hoa_don_ma_so_thue === ra && web === ra && loiWeb === null, `${vi(r)} · db: ${d?.hoa_don_ma_so_thue} · web: ${web}`);
    }
  }
  ok('Mẫu mã số thuế của web trùng từng ký tự mẫu trong 0125 (hàm và ràng buộc)',
     DMT.MAU_MA_SO_THUE.source === '^[0-9]{10}(?:-[0-9]{3})?$'
       && (readFileSync(TEP_0125, 'utf8').match(/'\^\[0-9\]\{10\}\(-\[0-9\]\{3\}\)\?\$'/g) ?? []).length === 2);

  await traLuot();
  for (const [email, nhan] of BANG_EMAIL) {
    const r = await datHang({ hoaDon: { ...HOA_DON, email } });
    const loiWeb = DMT.loiOHoaDon('email', email);
    ok(`Email "${email.length > 40 ? `${email.slice(0, 12)}… (${email.length} ký tự)` : email}": database ${nhan ? 'nhận' : 'từ chối'}, web cũng vậy`,
       nhan ? r.loi === null && loiWeb === null : r.loi !== null && /Email (nhận hóa đơn không đúng dạng|dài quá 200 ký tự)/.test(r.loi) && loiWeb === 'saiEmailHoaDon',
       `${vi(r)} · web: ${loiWeb}`);
  }
  const mauEmail = readFileSync(TEP_0125, 'utf8').match(/'\^\[A-Za-z0-9\._%\+-\]\+@\(\[A-Za-z0-9-\]\+\\\.\)\+\[A-Za-z\]\{2,\}\$'/g) ?? [];
  ok('Mẫu email của web và của 0125 (hàm và ràng buộc) cùng một luật',
     DMT.MAU_EMAIL_HOA_DON.source === '^[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\\.)+[A-Za-z]{2,}$' && mauEmail.length === 2, `${mauEmail.length} chỗ trong 0125`);

  await traLuot();
  const tenVao = '  CÔNG TY TNHH   THƯƠNG MẠI\n ĐÔNG Á  ';
  const diaChiVao = '  Tầng 5,\n 12 Lê Lợi, Phường Bến Thành  ';
  const r = await datHang({ hoaDon: { ...HOA_DON, ten_don_vi: tenVao, dia_chi: diaChiVao } });
  const d = await dongDon(r.kq?.ma_don);
  const f = new FormData();
  for (const [k, v] of Object.entries({ xuat_hoa_don: 'co', hoa_don_ten_don_vi: tenVao, hoa_don_dia_chi: diaChiVao, hoa_don_ma_so_thue: '0123456789', hoa_don_email: 'ketoan@example.com' })) f.append(k, v);
  const web = DH.docDonGui(f).hoaDon;
  ok('Tên đơn vị, địa chỉ đơn vị có dấu nguyên vẹn, khoảng trắng và xuống dòng gộp thành một dấu cách — database và web như nhau',
     d?.hoa_don_ten_don_vi === 'CÔNG TY TNHH THƯƠNG MẠI ĐÔNG Á' && d.hoa_don_dia_chi === 'Tầng 5, 12 Lê Lợi, Phường Bến Thành'
       && web?.tenDonVi === d.hoa_don_ten_don_vi && web?.diaChi === d.hoa_don_dia_chi, `${JSON.stringify(d)} · ${JSON.stringify(web)}`);
  // Cách không ngắt (U+00A0, U+202F — dán từ Word): database đổi thành dấu cách như \s của web.
  const [nbsp, hep] = [String.fromCharCode(0xa0), String.fromCharCode(0x202f)];
  const tenDan = `CÔNG TY${nbsp}TNHH${hep}${nbsp}ĐÔNG Á${nbsp}`;
  const dan = await datHang({ hoaDon: { ...HOA_DON, ten_don_vi: tenDan, dia_chi: `Tầng${nbsp}5` } });
  const dd = await dongDon(dan.kq?.ma_don);
  const fd = new FormData();
  for (const [k, v] of Object.entries({ xuat_hoa_don: 'co', hoa_don_ten_don_vi: tenDan, hoa_don_dia_chi: `Tầng${nbsp}5`, hoa_don_ma_so_thue: '0123456789', hoa_don_email: 'ketoan@example.com' })) fd.append(k, v);
  const webDan = DH.docDonGui(fd).hoaDon;
  ok('Tên, địa chỉ đơn vị có cách không ngắt (dán từ Word) → database và web cùng lưu dấu cách thường',
     dd?.hoa_don_ten_don_vi === 'CÔNG TY TNHH ĐÔNG Á' && dd.hoa_don_dia_chi === 'Tầng 5'
       && webDan?.tenDonVi === dd.hoa_don_ten_don_vi && webDan?.diaChi === dd.hoa_don_dia_chi, `${JSON.stringify(dd)} · ${JSON.stringify(webDan)}`);
  const trong = await datHang({ hoaDon: { ...HOA_DON, dia_chi: '   \n ' } });
  const dt = await dongDon(trong.kq?.ma_don);
  ok('Địa chỉ đơn vị không bắt buộc: để trống (chỉ khoảng trắng) → null, đơn vẫn ghi', trong.loi === null && dt?.hoa_don_dia_chi === null, vi(trong));
  const thieuDiaChi = await datHang({ hoaDon: { ten_don_vi: HOA_DON.ten_don_vi, ma_so_thue: HOA_DON.ma_so_thue, email: HOA_DON.email } });
  ok('Thiếu hẳn khóa dia_chi → null, đơn vẫn ghi', thieuDiaChi.loi === null && (await dongDon(thieuDiaChi.kq?.ma_don))?.hoa_don_dia_chi === null, vi(thieuDiaChi));
});

// ===========================================================================
await nhom('5 · LUẬT CỦA HÀM: BẮT BUỘC, ĐỘ DÀI, DẠNG p_hoa_don; LỖI KHÔNG TỐN LƯỢT', async () => {
  await traLuot();
  const truoc = await demDon();
  const luotTruoc = Number((await db.query(`select count(*) n from gioi_han_luot where viec = 'tao_don_mua_thit'`)).rows[0].n);
  const CA = [
    ['Tên đơn vị trống', { hoaDon: { ...HOA_DON, ten_don_vi: '  \n ' } }, /^Chưa điền tên đơn vị xuất hóa đơn/],
    ['Thiếu khóa ten_don_vi', { hoaDon: { ma_so_thue: HOA_DON.ma_so_thue, email: HOA_DON.email } }, /^Chưa điền tên đơn vị xuất hóa đơn/],
    ['Tên đơn vị 201 ký tự', { hoaDon: { ...HOA_DON, ten_don_vi: 'Đ'.repeat(201) } }, /^Tên đơn vị dài quá 200 ký tự/],
    ['Mã số thuế 9 số', { hoaDon: { ...HOA_DON, ma_so_thue: '012345678' } }, /^Mã số thuế phải gồm 10 số/],
    ['Mã số thuế là số JSON (mất số 0 đầu)', { hoaDonTho: '{"ten_don_vi":"Công ty A","ma_so_thue":123456789,"email":"a@example.com"}' }, /^Mã số thuế phải gồm 10 số/],
    ['Địa chỉ đơn vị 301 ký tự', { hoaDon: { ...HOA_DON, dia_chi: 'đ'.repeat(301) } }, /^Địa chỉ đơn vị dài quá 300 ký tự/],
    ['Email trống', { hoaDon: { ...HOA_DON, email: '   ' } }, /^Chưa điền email nhận hóa đơn/],
    ['Email sai dạng', { hoaDon: { ...HOA_DON, email: 'ketoan@' } }, /^Email nhận hóa đơn không đúng dạng/],
    ['p_hoa_don là chuỗi', { hoaDonTho: '"0123456789"' }, /^Thông tin xuất hóa đơn không đúng dạng/],
    ['p_hoa_don là mảng', { hoaDonTho: '["CÔNG TY A", "0123456789"]' }, /^Thông tin xuất hóa đơn không đúng dạng/],
  ];
  for (const [ten, them, mau] of CA) {
    const r = await datHang(them);
    ok(`${ten} → không ghi, đúng câu`, r.loi !== null && mau.test(r.loi), vi(r));
  }
  ok('Không ca sai nào thêm dòng', (await demDon()) === truoc);
  const luotSau = Number((await db.query(`select count(*) n from gioi_han_luot where viec = 'tao_don_mua_thit'`)).rows[0].n);
  ok('Đơn sai thông tin hóa đơn không tốn lượt giới hạn tần suất (kiểm trước giới hạn)', luotSau === luotTruoc, `${luotTruoc} → ${luotSau}`);

  const khongCan = await datHang({ hoaDon: null });
  const d0 = await dongDon(khongCan.kq?.ma_don);
  ok('Không gửi p_hoa_don (null) → đơn ghi, xuat_hoa_don = false, bốn cột hóa đơn trống',
     khongCan.loi === null && d0?.xuat_hoa_don === false && [d0.hoa_don_ten_don_vi, d0.hoa_don_ma_so_thue, d0.hoa_don_dia_chi, d0.hoa_don_email].every(v => v === null), vi(khongCan));
  const jsonNull = await datHang({ hoaDonTho: 'null' });
  ok('p_hoa_don là JSON null → như không cần hóa đơn', jsonNull.loi === null && (await dongDon(jsonNull.kq?.ma_don))?.xuat_hoa_don === false, vi(jsonNull));
  const muoiThamSo = await goi('anon', `select tao_don_mua_thit($1::uuid, 'q1', 'Trần Văn Bình', $2, '45 Lê Lợi, phường Bến Thành', null,
                                        $3::jsonb, $4::jsonb, 'vi', $5::inet) as r`,
                             [maGui(), sdtMoi(), JSON.stringify({ 'ribeye-uc_200': 1 }), JSON.stringify(GIA), ipMoi()]);
  ok('Lời gọi mười tham số của web cũ (trước 0125) vẫn chạy: p_hoa_don mặc định null', muoiThamSo.loi === null
     && (await dongDon(muoiThamSo.kq?.ma_don))?.xuat_hoa_don === false, vi(muoiThamSo));
});

// ===========================================================================
await nhom('7 · CÂU CHỮ', async () => {
  const sql = readFileSync(TEP_0125, 'utf8').replace(/--[^\n]*/g, '');
  const cau = [...new Set([...sql.matchAll(/raise exception '([^']+)'/g)].map(m => m[1]))];
  const MOI = ['Thông tin xuất hóa đơn không đúng dạng', 'Chưa điền tên đơn vị xuất hóa đơn', 'Tên đơn vị dài quá 200 ký tự',
               'Mã số thuế phải gồm 10 số, hoặc 10 số - 3 số', 'Địa chỉ đơn vị dài quá 300 ký tự', 'Chưa điền email nhận hóa đơn',
               'Email nhận hóa đơn không đúng dạng'];
  ok('0125 có đúng bảy câu raise mới (cùng câu cũ của 0113 và "Email dài quá 200 ký tự" của 0121)',
     MOI.every(c => cau.includes(c)) && cau.includes('Email dài quá 200 ký tự') && cau.includes('Chưa điền họ tên'), cau.join(' | '));
  for (const c of MOI) {
    const en = cauLoiDatabase(c, 'en', '__CHUNG__');
    const ko = cauLoiDatabase(c, 'ko', '__CHUNG__');
    ok(`Câu mới có bản en, ko cho trang (cauLoiDatabase): "${c}"`, en !== '__CHUNG__' && ko !== '__CHUNG__' && !VIET.test(en) && !VIET.test(ko), `${en} | ${ko}`);
    const nb = dichCau('en', c);
    ok(`Câu mới có bản en cho nội bộ (dichCau): "${c}"`, nb !== c && !VIET.test(nb), nb);
  }
  ok('Trang tiếng Việt dùng nguyên văn câu của database', cauLoiDatabase(MOI[3], 'vi', 'x') === MOI[3]);

  const C = DMT.CAU_HOA_DON;
  const moi = Object.entries(C).flatMap(([k, v]) => NGON_NGU.map(nn => [k, nn, v[nn]]));
  ok('Câu lỗi hóa đơn (chặn sớm và lỗi sát ô) đủ vi, en, ko; không chữ cấm; bản en, ko không lẫn chữ Việt',
     Object.keys(C).sort().join() === 'saiEmailHoaDon,saiMaSoThue,thieuEmailHoaDon,thieuTenDonVi'
       && moi.every(([, , c]) => typeof c === 'string' && c.length > 10 && timChuoiCam(c).length === 0)
       && moi.filter(([, nn]) => nn !== 'vi').every(([, , c]) => !VIET.test(c)), moi.map(([k, nn, c]) => `${k}.${nn}: ${c}`).join(' | '));
  ok('CAU_DAT_HANG mang đúng bốn câu đó (máy chủ và trang cùng chữ)',
     Object.keys(C).every(k => JSON.stringify(DH.CAU_DAT_HANG[k]) === JSON.stringify(C[k])));
});

// ===========================================================================
// Thư viện của trang: đọc form, chặn sớm, tham số gửi database, mất mạng (khuôn test-mua-thit-dat-hang-web.mjs)
// ===========================================================================
const MA_GUI = '0b7f9d3e-2c1a-4e8b-9f00-1234567890ab';
function formMau(them = {}) {
  const f = new FormData();
  const o = {
    ma_gui: MA_GUI, 'ribeye-cap_200': '2', 'gia_ribeye-cap_200': '400000', ho_ten: 'Nguyễn Thị Hoa', sdt: '0912 345 678',
    dia_chi: '12 Nguyễn Huệ, phường Sài Gòn', ghi_chu: '',
    xuat_hoa_don: 'co', hoa_don_ten_don_vi: ' Công ty TNHH  Thử Nghiệm ', hoa_don_ma_so_thue: '0123 456 789 – 001',
    hoa_don_dia_chi: '', hoa_don_email: ' ketoan@example.com ', ...them,
  };
  for (const [k, v] of Object.entries(o)) if (v !== undefined) f.append(k, v);
  return f;
}
const yeuCau = form => new Request('https://beeftown.vn/mua-thit-ve', {
  method: 'POST', body: new URLSearchParams([...form].map(([k, v]) => [k, String(v)])),
  headers: { 'content-type': 'application/x-www-form-urlencoded', 'cf-connecting-ip': '203.0.113.9' },
});
function clientGia(traLoi) {
  const goiDb = [];
  return { goiDb, client: { rpc: async (ham, ts) => { goiDb.push({ ham, ts }); return traLoi; } } };
}
async function imLog(fn) {
  const cu = console.error;
  const dong = [];
  console.error = (...a) => dong.push(a.join(' '));
  try { return { kq: await fn(), dong }; } finally { console.error = cu; }
}
const MUOI_THAM_SO = ['p_chi_nhanh_ma', 'p_dia_chi', 'p_ghi_chu', 'p_gia_da_xem', 'p_gio', 'p_ho_ten', 'p_ip', 'p_ma_gui', 'p_ngon_ngu', 'p_sdt'];

await nhom('8 · THƯ VIỆN CỦA TRANG: ĐỌC FORM, CHẶN SỚM, THAM SỐ (chu-va-so, cau-chu, migration)', async () => {
  const d = DH.docDonGui(formMau());
  ok('Chọn "Cần xuất hóa đơn đỏ" (xuat_hoa_don=co): đọc bốn ô, chuẩn hóa như database (mã số thuế "0123456789-001", địa chỉ trống → null, email bỏ khoảng trắng)',
     JSON.stringify(d.hoaDon) === JSON.stringify({ tenDonVi: 'Công ty TNHH Thử Nghiệm', maSoThue: '0123456789-001', diaChi: null, email: 'ketoan@example.com' }),
     JSON.stringify(d.hoaDon));
  for (const giaTri of [undefined, '', 'on', '1', 'CO', 'có']) {
    ok(`xuat_hoa_don = ${JSON.stringify(giaTri)} → không cần hóa đơn: bốn ô (dù có chữ) bị bỏ qua`, DH.docDonGui(formMau({ xuat_hoa_don: giaTri })).hoaDon === null);
  }

  const CA = [
    ['tên đơn vị trống', { hoa_don_ten_don_vi: '   ' }, 'thieuTenDonVi'],
    ['mã số thuế 9 số', { hoa_don_ma_so_thue: '012345678' }, 'saiMaSoThue'],
    ['mã số thuế trống', { hoa_don_ma_so_thue: '' }, 'saiMaSoThue'],
    ['email trống', { hoa_don_email: '  ' }, 'thieuEmailHoaDon'],
    ['email thiếu tên miền', { hoa_don_email: 'ketoan@' }, 'saiEmailHoaDon'],
  ];
  for (const [ten, them, khoa] of CA) {
    for (const nn of NGON_NGU) {
      const { goiDb, client } = clientGia({ data: null, error: null });
      const kq = await DH.guiDonMuaThit(client, DH.docDonGui(formMau(them)), null, nn);
      ok(`[${nn}] ${ten} → chưa ghi, câu CAU_HOA_DON.${khoa}, database KHÔNG được gọi`,
         kq.ok === false && kq.cau === DMT.CAU_HOA_DON[khoa][nn] && goiDb.length === 0, JSON.stringify(kq));
    }
  }
  const boChon = clientGia({ data: { ma_don: 'B3G9PW', tam_tinh: 800000, da_co: false }, error: null });
  await DH.guiDonMuaThit(boChon.client, DH.docDonGui(formMau({ xuat_hoa_don: undefined, hoa_don_ma_so_thue: 'sai' })), null, 'vi');
  ok('Không chọn hóa đơn: gọi đúng mười tham số cũ, không có p_hoa_don (database chưa chạy 0125 vẫn nhận đơn) — ô hóa đơn sai không chặn',
     boChon.goiDb.length === 1 && Object.keys(boChon.goiDb[0].ts).sort().join() === MUOI_THAM_SO.join(), JSON.stringify(boChon.goiDb[0]?.ts));
  const coChon = clientGia({ data: { ma_don: 'B3G9PW', tam_tinh: 800000, da_co: false }, error: null });
  const kq = await DH.guiDonMuaThit(coChon.client, DH.docDonGui(formMau()), '203.0.113.9', 'en');
  ok('Chọn hóa đơn: thêm đúng p_hoa_don {ten_don_vi, ma_so_thue, dia_chi, email} đã chuẩn hóa; database trả mã → đã nhận',
     kq.ok === true && kq.ma === 'B3G9PW' && Object.keys(coChon.goiDb[0].ts).sort().join() === [...MUOI_THAM_SO, 'p_hoa_don'].sort().join()
       && JSON.stringify(coChon.goiDb[0].ts.p_hoa_don) === JSON.stringify({ ten_don_vi: 'Công ty TNHH Thử Nghiệm', ma_so_thue: '0123456789-001', dia_chi: null, email: 'ketoan@example.com' }),
     JSON.stringify(coChon.goiDb[0]?.ts));

  for (const nn of NGON_NGU) {
    const tuChoi = await DH.guiDonMuaThit(clientGia({ data: null, error: { code: 'P0001', message: 'Mã số thuế phải gồm 10 số, hoặc 10 số - 3 số' } }).client,
                                          DH.docDonGui(formMau()), null, nn);
    ok(`[${nn}] Database từ chối mã số thuế (P0001) → chưa ghi, câu của database đúng thứ tiếng`,
       tuChoi.ok === false && !tuChoi.khongChac && (nn === 'vi' ? /^Mã số thuế phải gồm/.test(tuChoi.cau)
         : !VIET.test(tuChoi.cau) && tuChoi.cau !== DH.CAU_DAT_HANG.chuaGhi[nn]), JSON.stringify(tuChoi));
  }

  const ve = await XL.luotDatHang(yeuCau(formMau({ hoa_don_ma_so_thue: '01234' })), clientGia({ data: null, error: null }).client, '/mua-thit-ve', 'vi');
  ok('Chặn sớm vì mã số thuế → về trang kèm giỏ; địa chỉ trang không mang tên đơn vị, mã số thuế, email',
     ve.ketQua.ok === false && ve.ketQua.loi === DMT.CAU_HOA_DON.saiMaSoThue.vi && ve.ve === '/mua-thit-ve?ribeye-cap_200=2#dat-hang'
       && !/Thử|0123|01234|ketoan|example|hoa_don|xuat_hoa_don/.test(decodeURIComponent(ve.ve)), JSON.stringify(ve));
});

// ===========================================================================
await nhom('9 · MẤT MẠNG: supabase-js THẬT TRÊN FETCH GIẢ (mat-mang)', async () => {
  let traLoiGia = () => { throw new Error('chưa đặt'); };
  const goiFetch = [];
  const clientThat = () => createClient('https://thu-khong-that.supabase.co', 'khoa-anon-gia', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (url, init) => { goiFetch.push({ url: String(url), than: init?.body }); return traLoiGia(init); } },
  });
  const duong = nn => (nn === 'vi' ? '/mua-thit-ve' : `/${nn}/buy-meat`);

  for (const nn of NGON_NGU) {
    traLoiGia = () => { throw new TypeError('fetch failed', { cause: Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }) }); };
    goiFetch.length = 0;
    const r = await imLog(() => XL.luotDatHang(yeuCau(formMau()), clientThat(), duong(nn), nn));
    ok(`[${nn}] Đơn có hóa đơn, mất mạng → KHÔNG CHẮC (không "đã nhận", không "chưa ghi"), về #dat-hang không mang giỏ`,
       r.kq.ketQua.ok === false && r.kq.ketQua.khongChac === true && r.kq.ve === `${duong(nn)}#dat-hang` && goiFetch.length === 1
         && JSON.parse(goiFetch[0].than ?? '{}').p_hoa_don?.ma_so_thue === '0123456789-001', `${JSON.stringify(r.kq)} · ${r.dong.join(' | ')}`);
  }

  // Database chưa chạy 0125 mà web mới đã deploy: PostgREST không thấy hàm có p_hoa_don (404 PGRST202).
  traLoiGia = () => new Response(JSON.stringify({
    code: 'PGRST202', details: 'Searched for the function public.tao_don_mua_thit with parameters p_chi_nhanh_ma, p_hoa_don, …',
    hint: null, message: 'Could not find the function public.tao_don_mua_thit(p_chi_nhanh_ma, p_hoa_don) in the schema cache',
  }), { status: 404, headers: { 'content-type': 'application/json' } });
  const chua0125 = await imLog(() => XL.luotDatHang(yeuCau(formMau()), clientThat(), '/mua-thit-ve', 'vi'));
  ok('Database chưa chạy 0125 (PGRST202) → CHƯA ghi nhận, câu chung "CHƯA được ghi nhận" — không "đã nhận", không "không chắc"',
     chua0125.kq.ketQua.ok === false && !chua0125.kq.ketQua.khongChac && chua0125.kq.ketQua.loi === DH.CAU_DAT_HANG.chuaGhi.vi, JSON.stringify(chua0125.kq));

  traLoiGia = () => new Response(JSON.stringify({ code: 'P0001', message: 'Chưa điền email nhận hóa đơn', details: null, hint: null }),
                                 { status: 400, headers: { 'content-type': 'application/json' } });
  const tuChoi = await imLog(() => XL.luotDatHang(yeuCau(formMau()), clientThat(), '/ko/buy-meat', 'ko'));
  ok('Database từ chối (400 P0001, câu hóa đơn) → CHƯA ghi, câu tiếng Hàn, về trang kèm giỏ, không log',
     tuChoi.kq.ketQua.ok === false && !tuChoi.kq.ketQua.khongChac && tuChoi.kq.ketQua.loi === cauLoiDatabase('Chưa điền email nhận hóa đơn', 'ko', '')
       && tuChoi.kq.ve === '/ko/buy-meat?ribeye-cap_200=2#dat-hang' && tuChoi.dong.length === 0, JSON.stringify(tuChoi.kq));
});

// ===========================================================================
await nhom('10 · MIGRATION: RÀNG BUỘC CỦA BẢNG CHẶN MỌI ĐƯỜNG GHI', async () => {
  const sql = readFileSync(TEP_0125, 'utf8');
  ok('Không câu delete, không current_date / now()::date trong 0125',
     !/^\s*delete\s/im.test(sql) && !/current_date|now\(\)::date/i.test(sql.replace(/--[^\n]*/g, '')));
  ok('Hai lệnh drop function đều tạo lại ngay trong file', /drop function if exists tao_don_mua_thit\(uuid, text, text, text, text, text, jsonb, jsonb, text, inet\);\s*\n\s*create or replace function tao_don_mua_thit\(/.test(sql)
     && /drop function if exists don_mua_thit_danh_sach\(text\);\s*\n\s*create or replace function don_mua_thit_danh_sach\(/.test(sql));

  // Ghi thẳng bằng superuser (khung kiểm thử) — như một hàm viết sau này quên kiểm.
  const { rows: [cn] } = await db.query(`select id from chi_nhanh where lower(ma) = 'q1'`);
  const ghiThang = (cot, giaTri) => db.query(
    `insert into don_mua_thit (ma_don, ma_gui, chi_nhanh_id, ho_ten, sdt, dia_chi, dong, tam_tinh${cot.map(c => `, ${c}`).join('')})
     values (sinh_ma_don_mua_thit(), gen_random_uuid(), $1, 'Khách thử', '0912345678', '12 Nguyễn Huệ, phường Sài Gòn',
             '[{"khoa":"ribeye-uc_200"}]', 190000${cot.map((_, i) => `, $${i + 2}`).join('')})`, [cn.id, ...giaTri])
    .then(() => null, e => e.message);
  const COT = ['xuat_hoa_don', 'hoa_don_ten_don_vi', 'hoa_don_ma_so_thue', 'hoa_don_dia_chi', 'hoa_don_email'];
  const CA = [
    ['chọn hóa đơn mà thiếu tên đơn vị', [true, null, '0123456789', null, 'ketoan@example.com'], 'don_mua_thit_hoa_don'],
    ['chọn hóa đơn, tên đơn vị chỉ khoảng trắng', [true, '   ', '0123456789', null, 'ketoan@example.com'], 'don_mua_thit_hoa_don'],
    ['chọn hóa đơn, mã số thuế chưa chuẩn hóa (có dấu cách)', [true, 'Công ty A', '0123 456 789', null, 'ketoan@example.com'], 'don_mua_thit_hoa_don'],
    ['chọn hóa đơn, mã số thuế 13 số liền (chưa có gạch)', [true, 'Công ty A', '0123456789001', null, 'ketoan@example.com'], 'don_mua_thit_hoa_don'],
    ['chọn hóa đơn mà thiếu email', [true, 'Công ty A', '0123456789', null, null], 'don_mua_thit_hoa_don'],
    ['chọn hóa đơn, email sai dạng', [true, 'Công ty A', '0123456789', null, 'ketoan@example'], 'don_mua_thit_hoa_don'],
    ['chọn hóa đơn, địa chỉ đơn vị chuỗi rỗng', [true, 'Công ty A', '0123456789', '', 'ketoan@example.com'], 'don_mua_thit_hoa_don'],
    ['KHÔNG chọn hóa đơn mà vẫn giữ mã số thuế', [false, null, '0123456789', null, null], 'don_mua_thit_khong_hoa_don'],
    ['KHÔNG chọn hóa đơn mà vẫn giữ email', [false, null, null, null, 'ketoan@example.com'], 'don_mua_thit_khong_hoa_don'],
  ];
  for (const [ten, giaTri, rangBuoc] of CA) {
    const loi = await ghiThang(COT, giaTri);
    ok(`Ghi thẳng: ${ten} → bị ràng buộc ${rangBuoc} chặn`, loi !== null && loi.includes(rangBuoc), loi ?? 'ghi được');
  }
  ok('Ghi thẳng một đơn đủ thông tin hóa đơn (mã 10 số - 3 số, không địa chỉ) → ghi được',
     (await ghiThang(COT, [true, 'Công ty A', '0123456789-001', null, 'ketoan@example.com'])) === null);
  ok('Ghi thẳng một đơn kiểu cũ (không nhắc cột hóa đơn nào) → ghi được: xuat_hoa_don mặc định false', (await ghiThang([], [])) === null);
  const sua = await db.query(`update don_mua_thit set hoa_don_ma_so_thue = '01234' where ma_don = $1`, [MA_CO_HOA_DON]).then(() => null, e => e.message);
  ok('Sửa thẳng mã số thuế của đơn đã có thành sai dạng → bị chặn', sua !== null && sua.includes('don_mua_thit_hoa_don'), sua ?? 'sửa được');
  const boChon = await db.query(`update don_mua_thit set xuat_hoa_don = false where ma_don = $1`, [MA_CO_HOA_DON]).then(() => null, e => e.message);
  ok('Bỏ cờ xuat_hoa_don mà còn thông tin hóa đơn → bị chặn (muốn bỏ thì xóa cả bốn cột)',
     boChon !== null && boChon.includes('don_mua_thit_khong_hoa_don'), boChon ?? 'sửa được');
});

// ===========================================================================
await nhom('11 · SỔ KHO', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('kho_doi_soat_ton() rỗng', rows.length === 0, JSON.stringify(rows.slice(0, 3)));
});

process.exit(ketThuc('MUA THỊT VỀ — HÓA ĐƠN ĐỎ'));
