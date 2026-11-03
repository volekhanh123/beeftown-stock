/**
 * BEEFTOWN — MUA THỊT VỀ: KHÁCH ĐẶT THẲNG TRÊN WEBSITE (0113)
 * ===========================================================
 *
 *     node test/test-mua-thit-dat-hang.mjs
 *
 * Khánh 03/11/2026: bỏ bước gửi tin qua Zalo OA, chỉ giao tận nơi. tao_don_mua_thit (anon) ghi đơn vào bảng khóa kín
 * don_mua_thit; nhân viên đọc và đổi trạng thái qua don_mua_thit_danh_sach / don_mua_thit_chuyen. Theo 9 mục "xong":
 *
 *   1. quyen — anon chỉ tạo đơn (không đọc bảng, không gọi hàm hộp thư); authenticated không đọc / ghi bảng thẳng,
 *      không tạo đơn; chủ thấy mọi chi nhánh, quản lý và thu ngân chỉ chi nhánh mình; marketing, thủ kho, quản lý đã
 *      nghỉ, tài khoản không có dòng nhan_su bị từ chối; quản lý chi nhánh khác không đổi được đơn.
 *   2. bam-hai-lan — cùng mã chống gửi hai lần → một đơn, cùng mã đơn; bấm đúp nút của hộp thư → da_o_san; người
 *      khác đã đổi → nguoi_khac.
 *   3. gio-vn — không áp dụng ở database: đơn không có ngày giờ giao (quán hẹn khi gọi); lọc "xong" 30 ngày tính
 *      theo mốc tuyệt đối (now()), không cắt ngày.
 *   4. chu-va-so — số điện thoại kiểu Việt ("0912 345 678", "+84 912 345 678") về một dạng; số gói "1.000", "1,5",
 *      "-1", "11" bị từ chối; tên, địa chỉ có dấu nguyên vẹn, khoảng trắng thừa gộp lại; tiền là số nguyên.
 *   5. mat-mang — ở test-mua-thit-dat-hang-web.mjs (lib của trang).
 *   6. ton-kho — kho_doi_soat_ton() rỗng.
 *   7. cau-chu — mọi câu raise mới có bản tiếng Anh, tiếng Hàn (trang công khai) hoặc tiếng Anh (nội bộ); mô tả sáu
 *      khóa không còn nói gửi đơn qua Zalo, hai thứ tiếng.
 *   8. migration — kênh mở không còn đòi link Zalo; không câu delete.
 *   9. dich-vu-ngoai — không áp dụng: database không gọi dịch vụ ngoài.
 *
 * Luật đơn: database tự tính từ menu công khai (giá đã chốt); giá khách đã thấy khác giá hiện tại → không ghi;
 * gói ngừng bán → không ghi; ảnh chụp dòng đơn giữ tên và giá lúc đặt.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, maGui, UID } from './kho-chung.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOC = join(__dirname, '..', '..');
const WEB = join(GOC, 'web', 'src');
const TEP_0113 = join(GOC, 'crm', 'supabase', 'migrations', '0113_mua_thit_dat_hang_web.sql');

const { cauLoiDatabase } = await import(join(WEB, 'lib', 'chu.ts'));
const { dichCau, MO_TA_KHOA_EN } = await import(join(WEB, 'lib', 'cau-noi-bo.ts'));

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — MUA THỊT VỀ: KHÁCH ĐẶT THẲNG TRÊN WEBSITE (0113)');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();

// Người khung dùng chung chưa có: quản lý ĐÃ NGHỈ và tài khoản không có dòng nhan_su.
const UID_LA = '00000000-0000-4000-8000-0000000000aa';
const UID_QL_NGHI = '00000000-0000-4000-8000-0000000000ad';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam)
                values ($1, $2, 'Quản lý đã nghỉ', 'quan_ly', false)`, [UID_QL_NGHI, cnA.id]);

const vi = r => (r.loi ? `${r.ma}: ${r.loi}` : JSON.stringify(r.kq ?? r.rows));
const goi = async (uid, sql, p = []) => {
  const r = await (uid === 'anon' ? duoiAnon(sql, p) : duoi(uid, sql, p));
  return { ...r, kq: r.rows?.[0]?.r };
};
const nghi = () => new Promise(xong => setTimeout(xong, 3));

// ---------------------------------------------------------------------------
// Menu bán lẻ — qua các hàm ban_le_* dưới vai chủ (khuôn test-mua-thit-ve.mjs)
// ---------------------------------------------------------------------------
async function matHang(ma, gia) {
  const { rows: [r] } = await db.query(
    `insert into kho_mat_hang (ma, ten, loai, dem_goi, gia_ban_kg) values ($1, $1, 'phan_cat', false, $2) returning id`, [ma, gia]);
  return r.id;
}
const doc = async id => (await goi(UID.chu, `select ban_le_danh_sach(null, $1) as r`, [id])).kq?.[0];
async function luu(id, duLieu) {
  await nghi();
  const sp = await doc(id);
  const r = await goi(UID.chu, `select ban_le_luu_san_pham($1, $2::timestamptz, $3::jsonb) as r`,
                      [id, sp.updated_at, JSON.stringify(duLieu)]);
  if (r.loi || r.kq?.ok !== true) throw new Error(`không lưu được ${sp?.ma}: ${vi(r)}`);
}
async function chot(id) {
  await nghi();
  const sp = await doc(id);
  const r = await goi(UID.chu, `select ban_le_chot_gia($1, $2::timestamptz, $3::jsonb) as r`,
                      [id, sp.updated_at, JSON.stringify(sp.gia_de_chot)]);
  if (r.loi || r.kq?.ok !== true) throw new Error(`không chốt được giá: ${vi(r)}`);
}
async function tao(ma, ten, loai = 'thit', cach = 'theo_can') {
  const r = await goi(UID.chu, `select ban_le_tao_san_pham($1, $2, $3, $4, $5) as r`, [maGui(), ma, ten, loai, cach]);
  if (r.loi || !r.kq?.id) throw new Error(`không tạo được ${ma}: ${vi(r)}`);
  return r.kq.id;
}
const congBo = (khoa, giaTri, uid = UID.chu) => goi(uid, typeof giaTri === 'boolean'
  ? `select dat_noi_dung($1, p_bool := $2::boolean, p_cong_bo := true) as r`
  : `select dat_noi_dung($1, p_text := $2, p_cong_bo := true) as r`, [khoa, giaTri]);
const thuHoi = khoa => goi(UID.chu, `select thu_hoi_noi_dung($1) as r`, [khoa]);

/** Menu công khai như trang đọc, và bảng giá {khoa: giá} khách đã thấy. */
async function menu(cn = 'q1') {
  const { rows } = await duoiAnon(`select * from mua_thit_ve_cong_khai('vi', $1)`, [cn]);
  return rows ?? [];
}
const giaThay = dong => Object.fromEntries(dong.map(d => [`${d.san_pham_ma}_${d.so_gam}`, Number(d.gia)]));

// ---------------------------------------------------------------------------
// Đặt hàng như trang gọi: mỗi lần một mã chống gửi hai lần, một số điện thoại, một IP — trừ khi kiểm thử đặt riêng
// ---------------------------------------------------------------------------
let thuTu = 0;
const sdtMoi = () => `09${String(10000000 + ++thuTu).slice(-8)}`;
const ipMoi = () => `203.0.113.${(thuTu % 250) + 1}`;
let GIA = {};
const SQL_DAT = `select tao_don_mua_thit($1::uuid, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10::inet) as r`;
async function datHang(them = {}, uid = 'anon') {
  const p = { maGui: maGui(), cn: 'q1', hoTen: 'Nguyễn Thị Hoa', sdt: sdtMoi(), diaChi: '12 Nguyễn Huệ, phường Sài Gòn',
              ghiChu: null, gio: { 'ribeye-uc_200': 1 }, gia: GIA, nn: 'vi', ip: ipMoi(), ...them };
  return goi(uid, SQL_DAT, [p.maGui, p.cn, p.hoTen, p.sdt, p.diaChi, p.ghiChu,
                            p.gio === undefined ? null : JSON.stringify(p.gio),
                            p.gia === undefined ? null : JSON.stringify(p.gia), p.nn, p.ip]);
}
const dongDon = async ma => (await db.query(`select * from don_mua_thit where ma_don = $1`, [ma])).rows[0];
const demDon = async () => Number((await db.query(`select count(*) n from don_mua_thit`)).rows[0].n);
const danhSach = (uid, loc = 'tat_ca') => goi(uid, `select coalesce(jsonb_agg(x), '[]') as r from don_mua_thit_danh_sach($1) x`, [loc]);
const chuyen = (uid, id, tu, toi) => goi(uid, `select don_mua_thit_chuyen($1::uuid, $2, $3) as r`, [id, tu, toi]);

const id = {};

// ===========================================================================
await nhom('0 · DỰNG MENU: hai phần thịt và một hộp kim chi đã chốt giá; công tắc bật, KHÔNG có link Zalo', async () => {
  const mhRibeye = await matHang('RIBEYE-UC', 950000);
  id.ribeye = await tao('ribeye-uc', 'Ribeye Úc');
  await luu(id.ribeye, { mat_hang_id: mhRibeye, trang_thai: 'dang_ban', thu_tu: 1, bao_quan: 'mat' });
  await chot(id.ribeye);

  const mhBaChi = await matHang('BA-CHI', 420000);
  id.baChi = await tao('ba-chi-bo', 'Ba chỉ bò');
  await luu(id.baChi, { mat_hang_id: mhBaChi, trang_thai: 'dang_ban', thu_tu: 2, bao_quan: 'dong_lanh' });
  await chot(id.baChi);

  id.kimChi = await tao('kim-chi', 'Kim chi cải thảo', 'kim_chi', 'theo_hop');
  await luu(id.kimChi, { trang_thai: 'dang_ban', thu_tu: 3, goi: [{ so_gam: 500, gia_rieng: 79000 }] });
  await chot(id.kimChi);

  const r = await congBo('hien_mua_thit_ve', true);
  ok('Công bố công tắc hien_mua_thit_ve', r.loi === null, vi(r));
  const coZalo = (await db.query(`select 1 from noi_dung_cong_bo where khoa = 'zalo_oa_url' and trang_thai = 'da_cong_bo'`)).rows.length;
  ok('Chưa công bố link Zalo OA nào', coZalo === 0);

  const dong = await menu();
  GIA = giaThay(dong);
  ok('Menu công khai có 5 gói dù chưa có link Zalo (0113: kênh mở chỉ cần công tắc)', dong.length === 5, JSON.stringify(dong));
  const nd = (await duoiAnon(`select noi_dung_cong_khai('vi') as j`)).rows?.[0]?.j;
  ok('noi_dung_cong_khai().hien_mua_thit_ve = true khi chưa có link Zalo', nd?.hien_mua_thit_ve === true);
  ok('Giá ribeye 200 g = giá chốt (950.000 đ/kg × 200 g = 190.000 đ)', GIA['ribeye-uc_200'] === 190000, JSON.stringify(GIA));
});

// ===========================================================================
await nhom('1 · QUYỀN', async () => {
  const r = await datHang({ hoTen: 'Khách Q1', gio: { 'ribeye-uc_200': 2, 'kim-chi_500': 1 } });
  ok('anon tạo được đơn, nhận mã đơn 6 ký tự', r.loi === null && /^[2-9A-HJ-KMNP-Z]{6}$/.test(r.kq?.ma_don ?? ''), vi(r));
  id.donA = (await dongDon(r.kq.ma_don)).id;
  id.maA = r.kq.ma_don;

  // Đơn ở chi nhánh B (website của chi nhánh khác).
  const rB = await datHang({ cn: 'q7', hoTen: 'Khách Q7', gio: { 'ribeye-uc_200': 1 }, gia: giaThay(await menu('q7')) });
  ok('anon tạo được đơn ở chi nhánh q7', rB.loi === null, vi(rB));
  id.donB = (await dongDon(rB.kq.ma_don)).id;

  const doc = await duoiAnon(`select * from don_mua_thit`);
  ok('anon KHÔNG đọc được bảng don_mua_thit', doc.loi !== null && /permission denied/i.test(doc.loi), vi(doc));
  const ghi = await duoiAnon(`insert into don_mua_thit (ma_don, ma_gui, chi_nhanh_id, ho_ten, sdt, dia_chi, dong, tam_tinh)
                              values ('AAAAAA', gen_random_uuid(), $1, 'x', '0912345678', '12 Lê Lợi Q1', '[{}]', 1)`, [cnA.id]);
  ok('anon KHÔNG ghi thẳng được vào bảng', ghi.loi !== null, vi(ghi));
  for (const [ten, sql] of [['don_mua_thit_danh_sach', `select * from don_mua_thit_danh_sach('tat_ca')`],
                            ['don_mua_thit_chuyen', `select don_mua_thit_chuyen('${id.donA}', 'cho_xac_nhan', 'da_huy')`],
                            ['don_mua_thit_duoc_xem', `select don_mua_thit_duoc_xem()`],
                            ['sinh_ma_don_mua_thit', `select sinh_ma_don_mua_thit()`]]) {
    const x = await duoiAnon(sql);
    ok(`anon KHÔNG gọi được ${ten}()`, x.loi !== null && /permission denied/i.test(x.loi), vi(x));
  }

  for (const uid of [UID.chu, UID.qlA, UID.thuNganA]) {
    const x = await duoi(uid, `select * from don_mua_thit`);
    ok(`authenticated (${uid.slice(-2)}) KHÔNG đọc thẳng được bảng`, x.loi !== null && /permission denied/i.test(x.loi), vi(x));
    const y = await duoi(uid, `update don_mua_thit set trang_thai = 'da_huy'`);
    ok(`authenticated (${uid.slice(-2)}) KHÔNG sửa thẳng được bảng`, y.loi !== null, vi(y));
  }
  const tuTao = await datHang({}, UID.qlA);
  ok('authenticated KHÔNG gọi được tao_don_mua_thit (chỉ website, dưới anon)', tuTao.loi !== null && /permission denied/i.test(tuTao.loi), vi(tuTao));

  const chu = await danhSach(UID.chu);
  ok('Chủ thấy đơn của cả hai chi nhánh', chu.kq?.some(d => d.id === id.donA) && chu.kq?.some(d => d.id === id.donB), vi(chu));
  const ql = await danhSach(UID.qlA);
  ok('Quản lý Q1 thấy đơn Q1, KHÔNG thấy đơn Q7',
     ql.kq?.some(d => d.id === id.donA) && !ql.kq?.some(d => d.id === id.donB), vi(ql));
  const tn = await danhSach(UID.thuNganA);
  ok('Thu ngân Q1 thấy đơn Q1', tn.kq?.some(d => d.id === id.donA), vi(tn));
  const qlB = await danhSach(UID.qlB);
  ok('Quản lý Q7 thấy đơn Q7, KHÔNG thấy đơn Q1',
     qlB.kq?.some(d => d.id === id.donB) && !qlB.kq?.some(d => d.id === id.donA), vi(qlB));
  for (const [ten, uid] of [['Marketing', UID.mktA], ['Thủ kho', UID.thuKhoA], ['Nhân viên quầy', UID.nvQuayA],
                            ['Kế toán', UID.keToanA], ['Quản lý đã nghỉ', UID_QL_NGHI],
                            ['Tài khoản không có dòng nhan_su', UID_LA]]) {
    const x = await danhSach(uid);
    ok(`${ten} KHÔNG xem được hộp thư đơn`, x.loi !== null && /Không có quyền xem đơn mua thịt/.test(x.loi), vi(x));
    const y = await chuyen(uid, id.donA, 'cho_xac_nhan', 'da_huy');
    ok(`${ten} KHÔNG đổi được trạng thái đơn`, y.loi !== null && /Không có quyền xử lý đơn mua thịt/.test(y.loi), vi(y));
  }
  const khac = await chuyen(UID.qlB, id.donA, 'cho_xac_nhan', 'da_huy');
  ok('Quản lý Q7 KHÔNG đổi được đơn của Q1 ("Không thấy đơn này")', khac.loi !== null && /Không thấy đơn này/.test(khac.loi), vi(khac));
  ok('Đơn Q1 vẫn chờ gọi sau lần thử của Q7', (await dongDon(id.maA)).trang_thai === 'cho_xac_nhan');

  const hamMoi = ['tao_don_mua_thit', 'don_mua_thit_danh_sach', 'don_mua_thit_chuyen', 'don_mua_thit_duoc_xem'];
  const { rows: dinh } = await db.query(
    `select proname, prosecdef, coalesce(array_to_string(proconfig, ','), '') as cau_hinh
     from pg_proc where proname = any($1)`, [hamMoi]);
  ok('Bốn hàm definer mới đều có set search_path',
     dinh.length === 4 && dinh.every(h => h.prosecdef && /search_path=public/.test(h.cau_hinh)), JSON.stringify(dinh));
});

// ===========================================================================
await nhom('2 · BẤM HAI LẦN', async () => {
  const ma = maGui();
  const truoc = await demDon();
  const lan1 = await datHang({ maGui: ma, sdt: '0911000001', gio: { 'ba-chi-bo_400': 2 } });
  const lan2 = await datHang({ maGui: ma, sdt: '0911000001', gio: { 'ba-chi-bo_400': 2 } });
  ok('Lần 1 tạo đơn', lan1.loi === null && lan1.kq?.da_co === false, vi(lan1));
  ok('Lần 2 cùng mã trả lại ĐÚNG đơn đó (da_co = true, cùng mã đơn, cùng tạm tính)',
     lan2.loi === null && lan2.kq?.da_co === true && lan2.kq?.ma_don === lan1.kq?.ma_don
     && Number(lan2.kq?.tam_tinh) === Number(lan1.kq?.tam_tinh), vi(lan2));
  ok('Chỉ thêm đúng một dòng', (await demDon()) === truoc + 1);
  const lan3 = await datHang({ maGui: ma, sdt: '0911000001', gio: { 'kim-chi_500': 5 } });
  ok('Gửi lại cùng mã mà giỏ khác (F5 sau khi sửa) vẫn trả đơn cũ, không tạo đơn thứ hai',
     lan3.kq?.ma_don === lan1.kq?.ma_don && (await demDon()) === truoc + 1, vi(lan3));

  const don = await dongDon(lan1.kq.ma_don);
  const a = await chuyen(UID.qlA, don.id, 'cho_xac_nhan', 'da_xac_nhan');
  const b = await chuyen(UID.qlA, don.id, 'cho_xac_nhan', 'da_xac_nhan');
  ok('Bấm "Đã gọi xác nhận" lần 1 → da_chuyen', a.kq === 'da_chuyen', vi(a));
  ok('Bấm đúp → da_o_san, không lỗi', b.kq === 'da_o_san', vi(b));
  const nguoiXuLy = (await db.query(`select n.ho_ten from don_mua_thit d join nhan_su n on n.id = d.nguoi_xu_ly where d.id = $1`, [don.id])).rows[0];
  ok('nguoi_xu_ly là người đã bấm (Quản lý Q1)', nguoiXuLy?.ho_ten === 'Quản lý Q1', JSON.stringify(nguoiXuLy));
  const c = await chuyen(UID.thuNganA, don.id, 'cho_xac_nhan', 'da_huy');
  ok('Người khác bấm "Khách hủy" trên trang cũ (đơn đã xác nhận) → nguoi_khac, đơn giữ nguyên',
     c.kq === 'nguoi_khac' && (await dongDon(lan1.kq.ma_don)).trang_thai === 'da_xac_nhan', vi(c));
  const d = await chuyen(UID.qlA, don.id, 'da_xac_nhan', 'da_giao');
  ok('Đã xác nhận → Đã giao', d.kq === 'da_chuyen', vi(d));
  const e = await chuyen(UID.qlA, don.id, 'da_giao', 'cho_xac_nhan');
  ok('Đã giao → chờ gọi: bước không hợp lệ', e.loi !== null && /Bước chuyển trạng thái đơn không hợp lệ/.test(e.loi), vi(e));
  const f = await chuyen(UID.qlA, don.id, 'cho_xac_nhan', 'da_giao');
  ok('Chờ gọi → đã giao (bỏ bước gọi): không hợp lệ', f.loi !== null && /không hợp lệ/.test(f.loi), vi(f));
});

// ===========================================================================
await nhom('4 · CHỮ VÀ SỐ', async () => {
  // Mỗi dạng một số khác: cùng một số thì đơn chờ thứ tư bị giới hạn tần suất chặn (nhóm 6).
  for (const [vao, ra] of [['0912 345 671', '0912345671'], ['+84 912 345 672', '0912345672'], ['84912345673', '0912345673'],
                           ['0912.345.674', '0912345674'], ['028 3822 1234', '02838221234']]) {
    const r = await datHang({ sdt: vao, hoTen: `Khách số ${vao}` });
    const d = r.kq?.ma_don ? await dongDon(r.kq.ma_don) : null;
    ok(`Số "${vao}" → ${ra}`, d?.sdt === ra, vi(r));
  }
  for (const sai of ['12345', 'abc', '', '091234567890123']) {
    const r = await datHang({ sdt: sai });
    ok(`Số "${sai}" bị từ chối`, r.loi !== null && /Số điện thoại không hợp lệ/.test(r.loi), vi(r));
  }
  const r = await datHang({ hoTen: '  Trần   Thị   Ánh  ', diaChi: ' Tầng 3,  63 Hồ Tùng Mậu,\n phường Sài Gòn ',
                            ghiChu: 'Gọi trước khi giao.\r\nCảm ơn!' });
  const d = await dongDon(r.kq?.ma_don);
  ok('Họ tên có dấu nguyên vẹn, khoảng trắng thừa gộp lại', d?.ho_ten === 'Trần Thị Ánh', d?.ho_ten);
  ok('Địa chỉ có dấu nguyên vẹn, xuống dòng thành một dấu cách', d?.dia_chi === 'Tầng 3, 63 Hồ Tùng Mậu, phường Sài Gòn', d?.dia_chi);
  ok('Ghi chú giữ xuống dòng, bỏ \\r', d?.ghi_chu === 'Gọi trước khi giao.\nCảm ơn!', JSON.stringify(d?.ghi_chu));

  for (const so of ['1.000', '1,5', '-1', '11', '1e1', ' 2']) {
    const x = await datHang({ gio: { 'ribeye-uc_200': so } });
    ok(`Số gói "${so}" bị từ chối`, x.loi !== null && /Số gói mỗi loại phải từ 0 đến 10/.test(x.loi), vi(x));
  }
  const chuoi = await datHang({ gio: { 'ribeye-uc_200': '3', 'ba-chi-bo_200': 0 } });
  const dc = await dongDon(chuoi.kq?.ma_don);
  ok('Số gói dạng chuỗi chữ số ("3", như ô chọn của form) được nhận; 0 bị bỏ khỏi đơn',
     dc?.dong?.length === 1 && dc.dong[0].so_luong === 3, JSON.stringify(dc?.dong));
  ok('Tạm tính là số nguyên đúng = 3 × 190.000', Number(dc?.tam_tinh) === 570000 && Number.isInteger(dc.dong[0].gia), String(dc?.tam_tinh));
  ok('Dòng đơn chụp lại tên, cỡ gói, giá lúc đặt',
     dc?.dong?.[0]?.ten_vi === 'Ribeye Úc' && dc.dong[0].so_gam === 200 && dc.dong[0].gia === 190000
     && dc.dong[0].thanh_tien === 570000 && dc.dong[0].don_vi === 'goi' && dc.dong[0].khoa === 'ribeye-uc_200',
     JSON.stringify(dc?.dong?.[0]));

  const thuTuMenu = await datHang({ gio: { 'kim-chi_500': 1, 'ribeye-uc_400': 1, 'ribeye-uc_200': 1 } });
  const dt = await dongDon(thuTuMenu.kq?.ma_don);
  ok('Dòng đơn theo thứ tự menu, không theo thứ tự khách chọn',
     dt?.dong?.map(x => x.khoa).join(',') === 'ribeye-uc_200,ribeye-uc_400,kim-chi_500', JSON.stringify(dt?.dong?.map(x => x.khoa)));
  ok('Ngôn ngữ lạ ghi thành vi', (await dongDon((await datHang({ nn: 'fr' })).kq?.ma_don))?.ngon_ngu === 'vi');
});

// ===========================================================================
await nhom('5 · LUẬT ĐƠN: giỏ, giá, ô liên hệ, kênh', async () => {
  const truoc = await demDon();
  const ca = [
    ['Giỏ rỗng', { gio: {} }, /Đơn chưa có gói nào/],
    ['Giỏ chỉ có số 0', { gio: { 'ribeye-uc_200': 0 } }, /Đơn chưa có gói nào/],
    ['Giỏ không phải object', { gio: [1, 2] }, /Đơn chưa có gói nào/],
    ['Gói không có trên menu', { gio: { 'wagyu_200': 1 } }, /không còn bán/],
    ['Thiếu giá đã thấy', { gia: undefined }, /Giá vừa đổi/],
    ['Giá đã thấy sai', { gia: { ...GIA, 'ribeye-uc_200': 150000 } }, /Giá vừa đổi/],
    ['Chưa điền họ tên', { hoTen: '   ' }, /Chưa điền họ tên/],
    ['Họ tên quá dài', { hoTen: 'A'.repeat(121) }, /Họ tên dài quá 120 ký tự/],
    ['Địa chỉ quá ngắn', { diaChi: 'Q1' }, /Địa chỉ giao hàng quá ngắn/],
    ['Địa chỉ quá dài', { diaChi: 'Đường '.repeat(60) }, /Địa chỉ giao hàng dài quá 300 ký tự/],
    ['Ghi chú quá dài', { ghiChu: 'x'.repeat(501) }, /Ghi chú dài quá 500 ký tự/],
    ['Thiếu mã chống gửi hai lần', { maGui: null }, /Thiếu mã chống gửi hai lần/],
    ['Chi nhánh lạ', { cn: 'khong-co' }, /Không tìm thấy chi nhánh/],
  ];
  for (const [ten, them, mau] of ca) {
    const r = await datHang(them);
    ok(`${ten} → không ghi, đúng câu`, r.loi !== null && mau.test(r.loi), vi(r));
  }
  ok('Không ca sai nào thêm dòng', (await demDon()) === truoc);

  // Chủ chốt lại giá giữa lúc khách mở trang và lúc bấm Đặt hàng.
  const giaCu = { ...GIA };
  const mh = (await db.query(`select mat_hang_id from ban_le_san_pham where id = $1`, [id.ribeye])).rows[0].mat_hang_id;
  await db.query(`update kho_mat_hang set gia_ban_kg = 1000000 where id = $1`, [mh]);
  const chuaChot = await datHang({ gia: giaCu });
  ok('Giá kg đổi nhưng chủ CHƯA chốt lại: giá đã thấy vẫn đúng giá chốt → ghi được', chuaChot.loi === null, vi(chuaChot));
  await chot(id.ribeye);
  const sauChot = await datHang({ gia: giaCu });
  ok('Chủ chốt giá mới: giá khách đã thấy (cũ) → "Giá vừa đổi", không ghi', sauChot.loi !== null && /Giá vừa đổi/.test(sauChot.loi), vi(sauChot));
  GIA = giaThay(await menu());
  const giaMoi = await datHang();
  ok('Tải lại trang (giá mới) → ghi được, đúng giá mới 200.000 đ', giaMoi.loi === null && Number(giaMoi.kq?.tam_tinh) === 200000, vi(giaMoi));

  // Ảnh chụp đơn cũ không đổi khi chủ đổi tên sản phẩm.
  const donCu = await dongDon(chuaChot.kq.ma_don);
  await luu(id.ribeye, { ten_vi: 'Ribeye Úc thái dày' });
  ok('Đổi tên sản phẩm sau khi đặt: đơn cũ giữ tên và giá lúc đặt',
     (await dongDon(chuaChot.kq.ma_don)).dong[0].ten_vi === 'Ribeye Úc' && donCu.dong[0].gia === 190000);

  // Sản phẩm ngừng bán giữa chừng.
  await luu(id.baChi, { trang_thai: 'tam_ngung' });
  const ngung = await datHang({ gio: { 'ba-chi-bo_200': 1 } });
  ok('Sản phẩm vừa Tạm ngưng → "không còn bán", không ghi', ngung.loi !== null && /không còn bán/.test(ngung.loi), vi(ngung));
  await luu(id.baChi, { trang_thai: 'dang_ban' });

  // Kênh đóng.
  await thuHoi('hien_mua_thit_ve');
  const dong = await datHang();
  ok('Công tắc thu hồi → "Mua thịt về qua website đang tạm đóng"', dong.loi !== null && /đang tạm đóng/.test(dong.loi), vi(dong));
  ok('Công tắc thu hồi → menu công khai rỗng', (await menu()).length === 0);
  await congBo('hien_mua_thit_ve', true);
  ok('Bật lại → đặt được', (await datHang()).loi === null);
});

// ===========================================================================
await nhom('6 · GIỚI HẠN TẦN SUẤT (khuôn tao_dat_ban, 0084)', async () => {
  const sdt = '0933000111';
  const kq = [];
  for (let i = 0; i < 4; i++) kq.push(await datHang({ sdt }));
  ok('Ba đơn chờ cùng số → ghi được', kq.slice(0, 3).every(r => r.loi === null), kq.map(vi).join(' | '));
  ok('Đơn chờ thứ tư cùng số → từ chối, đúng câu',
     kq[3].loi !== null && /Số điện thoại này đã có nhiều đơn đang chờ quán gọi xác nhận/.test(kq[3].loi), vi(kq[3]));
  const dau = await dongDon(kq[0].kq.ma_don);
  await chuyen(UID.qlA, dau.id, 'cho_xac_nhan', 'da_xac_nhan');
  ok('Quán gọi xác nhận một đơn → số đó đặt thêm được', (await datHang({ sdt })).loi === null);

  const ip = '198.51.100.7';
  const theoIp = [];
  for (let i = 0; i < 6; i++) theoIp.push(await datHang({ ip }));
  ok('Năm đơn mỗi giờ từ một IP → ghi được', theoIp.slice(0, 5).every(r => r.loi === null), theoIp.map(vi).join(' | '));
  ok('Đơn thứ sáu từ cùng IP → từ chối, đúng câu',
     theoIp[5].loi !== null && /Mạng bạn đang dùng đã gửi quá nhiều đơn/.test(theoIp[5].loi), vi(theoIp[5]));

  const gui = await datHang({ ip, maGui: theoIp[0].kq ? (await dongDon(theoIp[0].kq.ma_don)).ma_gui : maGui() });
  ok('Gửi lại đơn cũ (cùng mã) khi IP đã hết lượt → vẫn trả đơn cũ, không tốn lượt', gui.loi === null && gui.kq?.da_co === true, vi(gui));

  // Chi nhánh: 30 đơn mỗi giờ. Đếm số đã ghi ở q1 trong giờ này rồi đẩy tới ngưỡng.
  const daCo = Number((await db.query(
    `select count(*) n from gioi_han_luot where viec = 'tao_don_mua_thit' and khoa = $1`, [`cn:${cnA.id}`])).rows[0].n);
  let cuoi = null;
  for (let i = daCo; i <= 30; i++) cuoi = await datHang();
  ok('Đơn thứ 31 trong giờ của chi nhánh → từ chối, đúng câu',
     cuoi?.loi !== null && /Hệ thống đang nhận quá nhiều đơn/.test(cuoi?.loi ?? ''), vi(cuoi ?? {}));
});

// ===========================================================================
await nhom('7 · CÂU CHỮ', async () => {
  const sql = readFileSync(TEP_0113, 'utf8');
  const cauMoi = [...sql.matchAll(/raise exception '([^']+)'/g)].map(m => m[1]);
  ok('Đọc được các câu raise của 0113', cauMoi.length >= 17, String(cauMoi.length));
  const congKhai = cauMoi.filter(c => !/quyền|Không thấy đơn này|Bước chuyển|Không sinh được mã đơn/.test(c));
  for (const cau of congKhai) {
    const mau = cau.replace(/%/g, 'q1');
    const en = cauLoiDatabase(mau, 'en', '__CHUNG__');
    const ko = cauLoiDatabase(mau, 'ko', '__CHUNG__');
    ok(`Câu công khai có bản en, ko: "${cau}"`, en !== '__CHUNG__' && ko !== '__CHUNG__' && !/[ăâđêôơư]/i.test(en), `${en} | ${ko}`);
  }
  for (const cau of cauMoi.filter(c => !congKhai.includes(c))) {
    const en = dichCau('en', cau);
    ok(`Câu nội bộ có bản en: "${cau}"`, en !== cau && !/[ăâđêôơư]/i.test(en), en);
  }
  ok('Câu tiếng Việt của trang giữ nguyên (cauLoiDatabase vi)',
     cauLoiDatabase('Giá vừa đổi, vui lòng tải lại trang để xem giá mới', 'vi', 'x') === 'Giá vừa đổi, vui lòng tải lại trang để xem giá mới');

  const { rows } = await db.query(
    `select khoa, mo_ta from khoa_cong_bo where khoa = any($1)`,
    [['hien_mua_thit_ve', 'mua_thit_giao_hang', 'mua_thit_gio_nhan', 'mua_thit_hang_loi', 'mua_thit_doi_huy', 'zalo_oa_url']]);
  ok('Sáu khóa có mô tả', rows.length === 6);
  for (const { khoa, mo_ta } of rows) {
    ok(`Mô tả ${khoa} không còn nói gửi đơn / chép đơn qua Zalo`, !/gửi qua Zalo|chép đơn|soạn tin đơn|tin đơn|cùng khung chat Zalo|chỉ nhận tại quầy/i.test(mo_ta), mo_ta);
    const en = MO_TA_KHOA_EN[khoa] ?? '';
    ok(`Mô tả ${khoa} có bản tiếng Anh cùng ý (không nói order message / Zalo chat)`,
       en.length > 0 && !/order message|copying the order|same Zalo chat|pickup only/i.test(en), en);
  }
  ok('hien_mua_thit_ve nói rõ: chỉ giao tận nơi, website không thu tiền, hộp thư /noi-bo',
     /Chỉ giao tận nơi/.test(rows.find(r => r.khoa === 'hien_mua_thit_ve')?.mo_ta ?? '')
     && /website không thu tiền/.test(rows.find(r => r.khoa === 'hien_mua_thit_ve')?.mo_ta ?? '')
     && /Đơn mua thịt/.test(rows.find(r => r.khoa === 'hien_mua_thit_ve')?.mo_ta ?? ''));
});

// ===========================================================================
await nhom('8 · MIGRATION', async () => {
  const sql = readFileSync(TEP_0113, 'utf8');
  const thanKenh = (await db.query(`select prosrc from pg_proc where proname = 'mua_thit_ve_kenh_mo'`)).rows[0]?.prosrc ?? '';
  ok('mua_thit_ve_kenh_mo không còn đọc zalo_oa_url', !/zalo/i.test(thanKenh.replace(/--.*$/gm, '')), thanKenh);
  ok('Không câu delete trong 0113', !/^\s*delete\s/im.test(sql));
  ok('Không current_date trong 0113', !/current_date|now\(\)::date/i.test(sql));
  const loc = await danhSach(UID.chu, 'xong');
  ok('Lọc "xong" chạy được (đơn đã giao trong 30 ngày)', loc.loi === null && loc.kq.some(d => d.trang_thai === 'da_giao'), vi(loc));
  const la = await danhSach(UID.chu, 'linh-tinh');
  ok('Lọc lạ → như "cho" (chỉ đơn chờ gọi)', la.loi === null && la.kq.length > 0 && la.kq.every(d => d.trang_thai === 'cho_xac_nhan'), vi(la));
  ok('Hộp thư trả tên người xử lý, không trả mã chống gửi hai lần hay chi nhánh',
     loc.kq.every(d => !('ma_gui' in d) && !('chi_nhanh_id' in d)) && loc.kq.some(d => d.nguoi_xu_ly === 'Quản lý Q1'));
});

// ===========================================================================
await nhom('9 · SỔ KHO', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('kho_doi_soat_ton() rỗng', rows.length === 0, JSON.stringify(rows.slice(0, 3)));
});

process.exit(ketThuc('MUA THỊT VỀ — ĐẶT HÀNG TRÊN WEBSITE'));
