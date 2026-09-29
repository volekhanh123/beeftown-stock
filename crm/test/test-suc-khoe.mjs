/**
 * BEEFTOWN — SỨC KHỎE HỆ THỐNG (0055 · suc_khoe_he_thong)
 * =======================================================
 *
 *     node test/test-suc-khoe.mjs
 *
 * suc_khoe_he_thong() trả SỐ LIỆU cho bảng đèn xanh / vàng / đỏ ở /noi-bo — màu và câu
 * chữ do web/src/lib/suc-khoe.ts quyết (test-suc-khoe-web.mjs). Ở đây kiểm phần database:
 *
 *   1. Chỉ chủ (mọi chi nhánh) và quản lý (chi nhánh của mình) đọc được. Vai khác, người
 *      đã nghỉ, tài khoản máy, tài khoản không có dòng nhan_su, anon → bị từ chối.
 *   2. Database mới, chưa dùng gì: mọi số bằng 0 / tắt — không báo nhầm.
 *   3. Từng nguồn đếm đúng, đúng chi nhánh: đặt bàn chờ lâu / quá giờ hẹn, hồ sơ nằm im,
 *      tin Zalo hỏng / kẹt, lỗi bot Messenger, việc dịch chờ / lỗi, iPOS (đèn giống hệt
 *      màn Kết nối iPOS + nhịp tim của việc chạy nền 5 phút), sổ kho lệch tồn.
 *   4. Không lộ dữ liệu cá nhân hay bí mật: chỉ có số đếm và mốc giờ.
 *   5. 0057 tách phần kiểm quyền khỏi phần tính (kho_ipos_trang_thai_goc, suc_khoe_so_lieu)
 *      cho máy báo động: thân hàm đúng nguyên văn, người xem thấy y hệt trước khi tách, hàm
 *      nội bộ không ai đăng nhập gọi thẳng được. Phần báo động: test-bao-dong.mjs.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, UID, themMayIpos, UID_MAY_IPOS } from './kho-chung.mjs';

const LIB_SUC_KHOE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'web', 'src', 'lib', 'suc-khoe.ts');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — SỨC KHỎE HỆ THỐNG');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
await themMayIpos(db, cnA, cnB);

/** Đọc suc_khoe_he_thong() dưới danh nghĩa một người. */
async function doc(uid) {
  const r = await duoi(uid, `select suc_khoe_he_thong() as k`);
  return { k: r.rows?.[0]?.k ?? null, loi: r.loi, ma: r.ma };
}
const cua = (k, cn) => k?.chi_nhanh?.find(c => c.id === cn.id);
const phutTruoc = iso => (Date.now() - Date.parse(iso)) / 60000;
const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;

// ===========================================================================
await nhom('1 · AI XEM ĐƯỢC', async () => {
  const chu = await doc(UID.chu);
  ok('Chủ đọc được', chu.loi === null && !!chu.k, chu.loi ?? '');
  ok('Chủ thấy mọi chi nhánh (Q1 và Q7)', !!cua(chu.k, cnA) && !!cua(chu.k, cnB) && chu.k.chi_nhanh.length === 2,
     JSON.stringify(chu.k?.chi_nhanh?.map(c => c.ten)));
  ok('Mỗi chi nhánh có tên để hiện tiêu đề và mã để mở trang kho (?cn=)',
     cua(chu.k, cnA)?.ten === cnA.ten && cua(chu.k, cnA)?.ma === cnA.ma, JSON.stringify(cua(chu.k, cnA)?.ma));

  // Chi nhánh đã ngừng hoạt động: không nhận đặt bàn, không có gì để báo.
  await db.query(`update chi_nhanh set dang_hoat_dong = false where id = $1`, [cnB.id]);
  const ngung = await doc(UID.chu);
  ok('Chi nhánh đã ngừng hoạt động không có trong bảng', ngung.k?.chi_nhanh?.length === 1 && !cua(ngung.k, cnB),
     JSON.stringify(ngung.k?.chi_nhanh?.map(c => c.ten)));
  await db.query(`update chi_nhanh set dang_hoat_dong = true where id = $1`, [cnB.id]);

  const qlA = await doc(UID.qlA);
  ok('Quản lý Q1 chỉ thấy Q1', qlA.loi === null && qlA.k?.chi_nhanh?.length === 1 && !!cua(qlA.k, cnA),
     qlA.loi ?? JSON.stringify(qlA.k?.chi_nhanh?.map(c => c.ten)));
  const qlB = await doc(UID.qlB);
  ok('Quản lý Q7 chỉ thấy Q7', qlB.loi === null && qlB.k?.chi_nhanh?.length === 1 && !!cua(qlB.k, cnB),
     qlB.loi ?? '');

  for (const [ten, uid] of [
    ['Thủ kho', UID.thuKhoA], ['Nhân viên quầy', UID.nvQuayA], ['Kế toán', UID.keToanA],
    ['Thu ngân', UID.thuNganA], ['Marketing', UID.mktA], ['Người đã nghỉ', UID.nghiViec],
    ['Tài khoản máy iPOS', UID_MAY_IPOS.mayIposA], ['Tài khoản không có dòng nhan_su', null],
  ]) {
    const r = await doc(uid);
    ok(`${ten} bị từ chối`, r.loi !== null && /Chỉ chủ sở hữu hoặc quản lý/.test(r.loi), r.loi ?? 'ĐỌC ĐƯỢC');
  }
  const tk = await doc(UID.thuKhoA);
  ok('Từ chối bằng mã insufficient_privilege (web hiện 403, không phải 500)', tk.ma === '42501', tk.ma);

  const anon = await duoiAnon(`select suc_khoe_he_thong()`);
  ok('anon không gọi được', anon.loi !== null, anon.loi ?? 'GỌI ĐƯỢC');
});

// ===========================================================================
await nhom('2 · DATABASE MỚI, CHƯA DÙNG GÌ → KHÔNG BÁO NHẦM', async () => {
  const { k } = await doc(UID.chu);
  const a = cua(k, cnA);
  ok('Có mốc giờ của database để web tính "bao lâu rồi"', typeof k?.luc === 'string' && Math.abs(phutTruoc(k.luc)) < 5, k?.luc);
  ok('Zalo: chưa bật', k?.zalo?.dang_bat === false, JSON.stringify(k?.zalo));
  ok('Messenger: chưa bật, 0 lỗi', k?.messenger?.dang_bat === false && k?.messenger?.loi_7_ngay === 0,
     JSON.stringify(k?.messenger));
  ok('iPOS Q1: chưa có cấu hình, chưa bật', a?.ipos?.co_cau_hinh === false && a?.ipos?.bat === false,
     JSON.stringify(a?.ipos));
  ok('Đặt bàn Q1: không có yêu cầu chờ', a?.dat_ban?.cho === 0 && a?.dat_ban?.qua_gio_hen === 0,
     JSON.stringify(a?.dat_ban));
  ok('Tuyển dụng Q1: không có hồ sơ mới', a?.tuyen_dung?.moi === 0, JSON.stringify(a?.tuyen_dung));
  ok('Sổ kho Q1: chưa dùng kho, không lệch', a?.so_kho?.co_kho === false && a?.so_kho?.lech === 0,
     JSON.stringify(a?.so_kho));
  ok('Zalo Q1: không có tin hỏng / kẹt', a?.tin_zalo?.that_bai_24h === 0 && a?.tin_zalo?.cho_qua_han === 0,
     JSON.stringify(a?.tin_zalo));
  ok('Báo động (0057): chưa chạy lần nào, chưa có kênh, không lỗi, chưa gửi tin nào',
     k?.bao_dong?.lan_chay_cuoi === null && k?.bao_dong?.kenh === 'khong' && k?.bao_dong?.co_loi === false
     && k?.bao_dong?.lan_gui_cuoi === null, JSON.stringify(k?.bao_dong));
});

// ===========================================================================
// Dữ liệu dùng chung: một khách (có SĐT, tên — không được lọt ra), bàn ăn Q1.
const { rows: [khach] } = await db.query(`select * from tim_hoac_tao_khach('0912345678', 'Khách Bí Mật')`);
await db.query(`insert into ban_an (chi_nhanh_id, ten) values ($1, 'Bàn 1')`, [cnA.id]);

await nhom('3 · ĐẶT BÀN CHỜ GỌI LẠI', async () => {
  const them = (cn, trangThai, ngayCach, taoTruoc, ma) => db.query(
    `insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach, trang_thai, ma_dat_ban, created_at)
     values ($1, $2, $3::date + $4::int, '19:00', 2, $5, $6, now() - $7::interval)`,
    [cn.id, khach.id, homNay, ngayCach, trangThai, ma, taoTruoc]);
  await them(cnA, 'cho_xac_nhan', 2, '10 minutes', 'BT-SK-01');   // mới — chỉ đếm vào "chờ"
  await them(cnA, 'cho_xac_nhan', 2, '3 hours', 'BT-SK-02');      // chờ quá 2 giờ
  await them(cnA, 'cho_xac_nhan', 2, '30 hours', 'BT-SK-03');     // chờ quá 24 giờ
  await them(cnA, 'cho_xac_nhan', -1, '50 minutes', 'BT-SK-04');  // hẹn hôm qua — đã qua giờ hẹn
  await them(cnA, 'da_xac_nhan', 2, '40 hours', 'BT-SK-05');      // đã xử lý — không đếm
  await them(cnB, 'cho_xac_nhan', 2, '30 hours', 'BT-SK-06');     // chi nhánh khác
  await them(cnA, 'cho_xac_nhan', -1, '30 hours', 'BT-SK-07');    // vừa quá hẹn VỪA chờ quá 24 giờ — chỉ đếm quá hẹn

  const { k } = await doc(UID.chu);
  const a = cua(k, cnA)?.dat_ban, b = cua(k, cnB)?.dat_ban;
  ok('Q1: 5 yêu cầu chờ (không đếm yêu cầu đã xác nhận)', a?.cho === 5, JSON.stringify(a));
  ok('Q1: 2 yêu cầu đã qua giờ hẹn mà chưa ai xử lý (theo giờ Việt Nam)', a?.qua_gio_hen === 2, JSON.stringify(a));
  ok('Q1: 1 yêu cầu chưa tới hẹn mà chờ quá 24 giờ (yêu cầu đã quá hẹn không đếm lại)', a?.cho_qua_24_gio === 1,
     JSON.stringify(a));
  ok('Q1: 1 yêu cầu chờ 2–24 giờ (yêu cầu đã quá 24 giờ không đếm lại)', a?.cho_qua_2_gio === 1, JSON.stringify(a));
  ok('Ba nhóm không chồng nhau: cộng lại không vượt số yêu cầu đang chờ',
     a?.qua_gio_hen + a?.cho_qua_24_gio + a?.cho_qua_2_gio <= a?.cho, JSON.stringify(a));
  ok('Q1: form đặt bàn đang mở, có 1 bàn', a?.form_mo === true && a?.so_ban === 1, JSON.stringify(a));
  ok('Q7: chỉ đếm yêu cầu của Q7; chưa có bàn nào', b?.cho === 1 && b?.cho_qua_24_gio === 1 && b?.so_ban === 0,
     JSON.stringify(b));
  const ql = cua((await doc(UID.qlA)).k, cnA)?.dat_ban;
  ok('Quản lý Q1 thấy đúng số như chủ', JSON.stringify(ql) === JSON.stringify(a), JSON.stringify(ql));
});

// ===========================================================================
// CLAUDE.md mục gio-vn. "Đã qua giờ hẹn" so ngày + giờ hẹn (giờ VN, không múi) với bay_gio_vn().
// Đồng hồ giả chỉ giả được Date của JS, không giả được now() của database — nên đặt giờ hẹn cách
// giờ VN hiện tại ±1–2 phút, tính ngay trong SQL. Dùng nhầm now() / current_date (UTC) thì lệch
// 7 tiếng và kiểm tra này đỏ ở BẤT KỲ giờ nào trong ngày (CI chạy TZ=UTC); lượt CI đêm (00:30
// giờ VN, TZ=Asia/Ho_Chi_Minh) phủ thêm khung qua nửa đêm, khi ngày UTC vẫn là hôm qua.
await nhom('3b · QUA GIỜ HẸN TÍNH THEO GIỜ VIỆT NAM (±1 phút quanh bây giờ)', async () => {
  const { rows: [q9] } = await db.query(`insert into chi_nhanh (ma, ten) values ('q9', 'Beeftown Quận 9') returning *`);
  const hen = (lech, ma) => db.query(
    `insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach, trang_thai, ma_dat_ban)
     select $1, $2, (bay_gio_vn() + $3::interval)::date, (bay_gio_vn() + $3::interval)::time, 2, 'cho_xac_nhan', $4`,
    [q9.id, khach.id, lech, ma]);
  await hen('-1 minute', 'BT-SK-91');     // hẹn 1 phút trước (giờ VN) — đã qua
  await hen('2 minutes', 'BT-SK-92');     // hẹn 2 phút nữa — chưa qua
  const d = cua((await doc(UID.chu)).k, q9)?.dat_ban;
  ok('Hẹn 1 phút trước theo giờ VN → đã qua giờ hẹn; hẹn 2 phút nữa → chưa', d?.cho === 2 && d?.qua_gio_hen === 1,
     JSON.stringify(d));
  await db.query(`update chi_nhanh set dang_hoat_dong = false where id = $1`, [q9.id]);   // các nhóm sau: chỉ Q1, Q7
});

// ===========================================================================
await nhom('4 · HỒ SƠ ỨNG TUYỂN NẰM IM', async () => {
  // Mã tin mẫu là duy nhất cả thương hiệu: gọi lần hai cho Q7 không tạo thêm gì — tự thêm một tin cho Q7.
  await db.query(`select tao_tin_tuyen_dung_mau($1)`, [cnA.id]);
  await db.query(`insert into vi_tri_tuyen_dung (chi_nhanh_id, ma, ten_vi, bo_phan)
                  values ($1, 'suc-khoe-q7', 'Nhân viên sảnh Q7', 'sanh')`, [cnB.id]);
  const viTri = async cn => (await db.query(
    `select id from vi_tri_tuyen_dung where chi_nhanh_id = $1 limit 1`, [cn.id])).rows[0].id;
  const vA = await viTri(cnA), vB = await viTri(cnB);
  const them = (cn, vt, trangThai, taoTruoc, ma) => db.query(
    `insert into ho_so_ung_tuyen (ma_ho_so, vi_tri_id, chi_nhanh_id, ho_ten, sdt, email, dong_y_noi_dung,
                                  luu_den, trang_thai, created_at, ngay_nop)
     values ($1, $2, $3, 'Ứng Viên Bí Mật', '0987654321', 'bimat@example.com', 'Đồng ý',
             $4::date + 365, $5, now() - $6::interval,
             ((now() - $6::interval) at time zone 'utc' + interval '7 hours')::date)`,
    [ma, vt, cn.id, homNay, trangThai, taoTruoc]);
  await them(cnA, vA, 'moi', '1 day', 'BT-UV-SK-1');
  await them(cnA, vA, 'moi', '3 days', 'BT-UV-SK-2');
  await them(cnA, vA, 'moi', '8 days', 'BT-UV-SK-3');
  await them(cnA, vA, 'dang_xem', '10 days', 'BT-UV-SK-4');   // đã có người xem — không đếm
  await them(cnB, vB, 'moi', '8 days', 'BT-UV-SK-5');

  const { k } = await doc(UID.chu);
  const a = cua(k, cnA)?.tuyen_dung, b = cua(k, cnB)?.tuyen_dung;
  ok('Q1: 3 hồ sơ mới chưa ai mở', a?.moi === 3, JSON.stringify(a));
  ok('Q1: 1 hồ sơ nằm im quá 7 ngày, 1 hồ sơ 2–7 ngày (hồ sơ quá 7 ngày không đếm lại)',
     a?.moi_qua_2_ngay === 1 && a?.moi_qua_7_ngay === 1,
     JSON.stringify(a));
  ok('Q7: đếm riêng', b?.moi === 1 && b?.moi_qua_7_ngay === 1 && b?.moi_qua_2_ngay === 0, JSON.stringify(b));
});

// ===========================================================================
await nhom('5 · TIN ZALO: BỘ GỬI CÓ CHẠY, TIN HỎNG, TIN KẸT', async () => {
  await db.query(`
    update zalo_cau_hinh set app_id = '123', oa_id = '456',
           refresh_token_ma_hoa = 'v1.' || repeat('BANMABIMAT', 5), dang_bat = true, che_do = 'that',
           lan_chay_cuoi = now() - interval '45 minutes', loi_cuoi = 'Lỗi thử của lượt gửi'
     where id = 1`);
  const them = (cn, ketQua, loai, cot) => db.query(
    `insert into nhat_ky_tin (chi_nhanh_id, khach_hang_id, sdt_gui, ket_qua, loai_tin, gui_luc, created_at, gui_sau, thu_lai_luc)
     values ($1, $2, '0912345678', $3, $4, $5::timestamptz, coalesce($6::timestamptz, now()), $7::timestamptz, $8::timestamptz)`,
    [cn.id, khach.id, ketQua, loai, cot.gui ?? null, cot.tao ?? null, cot.sau ?? null, cot.thuLai ?? null]);
  const truoc = p => new Date(Date.now() - p * 60000).toISOString();
  const sau = p => new Date(Date.now() + p * 60000).toISOString();
  await them(cnA, 'that_bai', 'giao_dich', { gui: truoc(60) });                     // hỏng trong 24 giờ
  await them(cnA, 'bi_tu_choi', 'giao_dich', { gui: truoc(120) });                  // bị Zalo từ chối trong 24 giờ
  await them(cnA, 'that_bai', 'giao_dich', { gui: truoc(30 * 60), tao: truoc(30 * 60) }); // quá 24 giờ — không đếm
  // Tin nhắc hẹn xếp từ 3 ngày trước, đến hạn 2 giờ trước rồi hỏng hẳn: tin hỏng không bao giờ có gui_luc,
  // nên "hỏng lúc nào" phải tính theo giờ đến hạn (gui_sau), không theo lúc tạo — vẫn đếm.
  await them(cnA, 'that_bai', 'giao_dich', { tao: truoc(3 * 24 * 60), sau: truoc(120) });
  await them(cnA, 'cho_gui', 'giao_dich', { tao: truoc(120) });                     // KẸT: đến hạn 2 giờ mà chưa gửi
  await them(cnA, 'cho_gui', 'cham_soc', { tao: truoc(120) });                      // tin chăm sóc chờ khung giờ — không kẹt
  await them(cnA, 'cho_gui', 'giao_dich', { sau: sau(60) });                        // hẹn giờ sau — chưa đến hạn
  await them(cnA, 'cho_gui', 'giao_dich', { tao: truoc(120), thuLai: sau(10) });    // chờ thử lại — chưa đến hạn
  await them(cnA, 'da_gui', 'giao_dich', { gui: truoc(60) });                       // gửi được — không đếm
  await them(cnB, 'that_bai', 'giao_dich', { gui: truoc(60) });                     // chi nhánh khác

  const { k } = await doc(UID.chu);
  ok('Zalo đang bật, chế độ thật', k?.zalo?.dang_bat === true && k?.zalo?.che_do === 'that', JSON.stringify(k?.zalo));
  ok('Lượt gửi gần nhất ~45 phút trước (web dùng làm nhịp tim của việc chạy nền)',
     Math.abs(phutTruoc(k?.zalo?.lan_chay_cuoi) - 45) < 2, k?.zalo?.lan_chay_cuoi);
  ok('Vừa bật → bat_luc = bây giờ (trigger ghi_luc_bat) — web không báo "bộ gửi không chạy" khi lượt đầu chưa tới',
     phutTruoc(k?.zalo?.bat_luc) < 2, k?.zalo?.bat_luc);
  ok('Lượt gửi gần nhất có lỗi → co_loi (không trả nguyên câu lỗi)', k?.zalo?.co_loi === true
     && !JSON.stringify(k).includes('Lỗi thử của lượt gửi'), JSON.stringify(k?.zalo));
  const a = cua(k, cnA)?.tin_zalo, b = cua(k, cnB)?.tin_zalo;
  ok('Q1: 3 tin hỏng / bị từ chối trong 24 giờ (tính cả tin xếp từ lâu, đến hạn và hỏng trong 24 giờ)',
     a?.that_bai_24h === 3, JSON.stringify(a));
  ok('Q1: 1 tin giao dịch kẹt quá 30 phút (không đếm tin chăm sóc, tin hẹn giờ, tin chờ thử lại)',
     a?.cho_qua_han === 1, JSON.stringify(a));
  ok('Q7: đếm riêng', b?.that_bai_24h === 1 && b?.cho_qua_han === 0, JSON.stringify(b));

  // bat_luc chỉ đổi khi tắt → bật. Mỗi lượt gửi làm mới updated_at (trigger của 0047) — dùng nó
  // làm mốc thì bộ gửi mà lượt nào cũng chết giữa chừng vẫn trông như đang chạy.
  const batLuc = async () => (await db.query(`select bat_luc::text as b from zalo_cau_hinh where id = 1`)).rows[0].b;
  await db.query(`update zalo_cau_hinh set bat_luc = now() - interval '2 days' where id = 1`);
  const cu = await batLuc();
  await db.query(`update zalo_cau_hinh set dang_chay_tu = now() where id = 1`);            // một lượt bắt đầu
  await db.query(`update zalo_cau_hinh set dang_bat = true, lan_chay_cuoi = now() where id = 1`);  // lưu lại khi đang bật
  ok('Lượt gửi bắt đầu / lưu cấu hình khi đang bật: bat_luc giữ nguyên', await batLuc() === cu, `${cu} → ${await batLuc()}`);
  await db.query(`update zalo_cau_hinh set dang_bat = false where id = 1`);
  await db.query(`update zalo_cau_hinh set dang_bat = true where id = 1`);
  ok('Tắt rồi bật lại → bat_luc mới', phutTruoc(await batLuc()) < 2, await batLuc());
  await db.query(`update zalo_cau_hinh set dang_chay_tu = null, lan_chay_cuoi = now() - interval '45 minutes',
                         bat_luc = now() - interval '2 days' where id = 1`);
});

// ===========================================================================
await nhom('6 · BOT MESSENGER', async () => {
  await db.query(`
    update mess_cau_hinh set dang_bat = true, loi_cuoi = 'Lỗi bí mật 0901234567',
           loi_cuoi_luc = now() - interval '20 minutes', lan_nhan_cuoi = now() - interval '5 minutes'
     where id = 1`);
  const batLucMoi = (await db.query(`select bat_luc from mess_cau_hinh where id = 1`)).rows[0].bat_luc;
  await db.query(`update mess_cau_hinh set bat_luc = now() - interval '3 days' where id = 1`);
  // Chủ sửa lời chào (lưu cấu hình khi bot đang bật): cap_nhat đổi, bat_luc KHÔNG đổi — sửa lời
  // chào không làm một webhook đã chết sống lại, nên không được xóa cảnh báo "im lặng 72 giờ".
  const luu = await duoi(UID.chu, `select mess_luu_cau_hinh(p_dang_bat => true, p_loi_chao => 'Chào anh/chị, Beeftown đây ạ!')`);
  ok('(chuẩn bị) Chủ lưu cấu hình Messenger', luu.loi === null, luu.loi ?? '');
  await db.query(`
    insert into mess_thong_ke_ngay (ngay, loai, dem) values
      (hom_nay_vn(), 'loi', 3), (hom_nay_vn() - 3, 'loi', 2), (hom_nay_vn() - 10, 'loi', 7),
      (hom_nay_vn() - 6, 'loi', 1), (hom_nay_vn() - 7, 'loi', 4),
      (hom_nay_vn(), 'dat_ban', 5)`);
  const { k } = await doc(UID.qlA);
  ok('Quản lý thấy bot đang bật', k?.messenger?.dang_bat === true, JSON.stringify(k?.messenger));
  ok('Vừa bật → bat_luc = bây giờ (trigger ghi_luc_bat)', phutTruoc(batLucMoi) < 2, String(batLucMoi));
  ok('Lưu cấu hình khi đang bật (sửa lời chào) KHÔNG đổi bat_luc', Math.abs(phutTruoc(k?.messenger?.bat_luc) - 3 * 24 * 60) < 2,
     k?.messenger?.bat_luc);
  ok('6 lỗi trong 7 ngày theo ngày VN: tính hôm nay … hôm nay − 6, không tính hôm nay − 7, không tính loại khác',
     k?.messenger?.loi_7_ngay === 6,
     JSON.stringify(k?.messenger));
  ok('Lỗi gần nhất ~20 phút trước', Math.abs(phutTruoc(k?.messenger?.loi_cuoi_luc) - 20) < 2, k?.messenger?.loi_cuoi_luc);
  ok('Tin gần nhất nhận ~5 phút trước', Math.abs(phutTruoc(k?.messenger?.lan_nhan_cuoi) - 5) < 2, JSON.stringify(k?.messenger));
  ok('Không trả nguyên câu lỗi (có thể chứa SĐT khách)', !JSON.stringify(k).includes('Lỗi bí mật'));
});

// ===========================================================================
await nhom('7 · BẢN DỊCH TỰ ĐỘNG', async () => {
  // Tin tuyển dụng mẫu ở mục 4 chưa có bản Anh / Hàn → đang chờ dịch.
  const { rows: [v] } = await db.query(`select id, ten_vi from vi_tri_tuyen_dung where chi_nhanh_id = $1 limit 1`, [cnA.id]);
  await db.query(`select ghi_ban_dich('vi_tri_tuyen_dung', $1, $2::jsonb)`, [v.id, JSON.stringify([
    { cot: 'ten', ngon_ngu: 'en', bam: (await db.query(`select bam_nguon($1) as b`, [v.ten_vi])).rows[0].b,
      tt: 'loi', ly_do: 'Gemini 503' }])]);
  await db.query(`update vi_tri_tuyen_dung set ban_dich = jsonb_set(ban_dich, '{ten,en,luc}',
                  to_jsonb(now() - interval '20 minutes')) where id = $1`, [v.id]);
  // Một dữ kiện đã công bố mà bản dịch lỗi (en, ko) từ 20 phút trước. Dữ kiện chỉ dịch lại khi có
  // người bấm Công bố lại — lỗi của nó đứng yên mãi, không nói gì về máy dịch bây giờ.
  const cau = 'Câu thử sức khỏe hệ thống';
  await db.query(`set session_replication_role = replica`);
  await db.query(`
    insert into noi_dung_cong_bo (khoa, kieu, gia_tri_text, trang_thai, ban_dich)
    values ('suc_khoe.thu', 'van_ban', $1, 'da_cong_bo', jsonb_build_object('gia_tri_text', jsonb_build_object(
      'en', jsonb_build_object('tt', 'loi', 'bam', bam_nguon($1), 'luc', now() - interval '20 minutes'),
      'ko', jsonb_build_object('tt', 'loi', 'bam', bam_nguon($1), 'luc', now() - interval '20 minutes'))))`, [cau]);
  await db.query(`set session_replication_role = origin`);

  const { rows: [dem] } = await db.query(`
    select count(*) filter (where ly_do in ('thieu', 'cu') and bang <> 'noi_dung_cong_bo')::int as cho,
           count(*) filter (where ly_do = 'thu_lai' and bang <> 'noi_dung_cong_bo')::int as loi,
           count(*) filter (where ly_do = 'thu_lai' and bang = 'noi_dung_cong_bo')::int as loi_du_kien from v_viec_dich`);
  const { k } = await doc(UID.chu);
  ok('Có việc chờ máy tự dịch (tin mẫu chưa dịch)', dem.cho > 0 && k?.dich?.cho === dem.cho, `${k?.dich?.cho} / ${dem.cho}`);
  ok('1 ô dịch lỗi đã quá 15 phút', dem.loi === 1 && k?.dich?.loi === 1, `${k?.dich?.loi} / ${dem.loi}`);
  ok('Lỗi dịch của dữ kiện công bố KHÔNG tính (trang Tổng quan có dòng việc riêng; máy không tự dịch lại nó)',
     dem.loi_du_kien === 2 && k?.dich?.loi === 1, `view: ${dem.loi_du_kien} ô dữ kiện lỗi`);
});

// ===========================================================================
await nhom('8 · iPOS: ĐÈN GIỐNG MÀN KẾT NỐI iPOS, NHỊP TIM VIỆC CHẠY NỀN', async () => {
  const khoiTao = await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  ok('(chuẩn bị) Quản lý Q1 khởi tạo kho', khoiTao.loi === null, khoiTao.loi ?? '');
  const { rows: [quay] } = await db.query(
    `select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'quay'`, [cnA.id]);
  const bat = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb) as v`,
    [cnA.id, JSON.stringify({ bat: true, pos_parent: 'BT', pos_id: '1', vi_tri_ban_id: quay.id })]);
  ok('(chuẩn bị) Chủ bật iPOS ở Q1', bat.loi === null, bat.loi ?? '');
  await db.query(`insert into kho_ipos_lan_chay (chi_nhanh_id, nguon, bat_dau_luc, ket_thuc_luc, loi) values
      ($1, 'cron', now() - interval '40 minutes', now() - interval '40 minutes' + interval '5 seconds', null),
      ($1, 'cron', now() - interval '20 minutes', now() - interval '9 minutes', 'Quá 10 phút không xong — coi như hỏng'),
      ($1, 'cron', now() - interval '1 minute', null, null),
      ($1, 'callback', now() - interval '2 minutes', now() - interval '2 minutes', null),
      ($1, 'tay', now() - interval '1 minute', now() - interval '1 minute', null)`, [cnA.id]);

  const { k } = await doc(UID.chu);
  const a = cua(k, cnA)?.ipos, b = cua(k, cnB)?.ipos;
  const goc = (await duoi(UID.chu, `select kho_ipos_trang_thai($1) as t`, [cnA.id])).rows[0].t;
  ok('Q1: đã bật, cấu hình đủ', a?.co_cau_hinh === true && a?.bat === true && a?.cau_hinh_du === true, JSON.stringify(a));
  ok('Q1: đèn giống hệt kho_ipos_trang_thai (màn Kết nối iPOS)', a?.den === goc.den && a?.mat_ket_noi === goc.mat_ket_noi,
     `${a?.den} / ${goc.den}`);
  ok('Q1: có mốc bật iPOS', typeof a?.bat_luc === 'string', a?.bat_luc);
  ok('Q1: nhịp tim = lượt CRON TỰ CHẠY XONG gần nhất ~40 phút trước (không tính lượt đang chạy, lượt chết bị lượt sau '
     + 'đóng hộ, lượt bấm tay, lượt iPOS đẩy sang)',
     Math.abs(phutTruoc(a?.cron_cuoi) - 40) < 2, a?.cron_cuoi);
  ok('Q7: chưa có cấu hình', b?.co_cau_hinh === false && b?.cron_cuoi === null, JSON.stringify(b));
});

// ===========================================================================
await nhom('9 · SỔ KHO LỆCH TỒN', async () => {
  await db.query(`insert into kho_vi_tri (chi_nhanh_id, ten, loai) values ($1, 'Kho lạnh', 'kho')`, [cnB.id]);
  let { k } = await doc(UID.chu);
  ok('Có kho, tồn khớp sổ: lệch 0', cua(k, cnA)?.so_kho?.co_kho === true && cua(k, cnA)?.so_kho?.lech === 0
     && cua(k, cnB)?.so_kho?.co_kho === true, JSON.stringify(cua(k, cnA)?.so_kho));

  // Giả một dòng sổ kho không có tồn tương ứng ở Q1. Bảng sổ kho chặn ghi tay (trigger) — tắt trigger
  // và khóa ngoại cho phiên này như script dữ liệu thử làm (crm/supabase/thu).
  const { rows: [vt] } = await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 limit 1`, [cnA.id]);
  await db.exec(`set session_replication_role = replica`);
  try {
    await db.query(`insert into kho_so_cai (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg,
                                            chung_tu_loai, chung_tu_id)
                    values ($1, gen_random_uuid(), $2, gen_random_uuid(), 'nhap', 1.5, 'phieu_nhap', gen_random_uuid())`,
                   [cnA.id, vt.id]);
  } finally { await db.exec(`set session_replication_role = origin`); }

  ({ k } = await doc(UID.chu));
  ok('Q1: 1 lô lệch sổ kho', cua(k, cnA)?.so_kho?.lech === 1, JSON.stringify(cua(k, cnA)?.so_kho));
  ok('Q7: không bị tính lệch của Q1', cua(k, cnB)?.so_kho?.lech === 0, JSON.stringify(cua(k, cnB)?.so_kho));
  const ql = await doc(UID.qlB);
  ok('Quản lý Q7 không thấy chi nhánh Q1 (nên không thấy lệch của Q1)', !cua(ql.k, cnA), JSON.stringify(ql.k?.chi_nhanh?.map(c => c.ten)));
});

// ===========================================================================
await nhom('10 · KHÔNG LỘ DỮ LIỆU CÁ NHÂN HAY BÍ MẬT', async () => {
  const { k } = await doc(UID.chu);
  const chu = JSON.stringify(k);
  const lo = ['0912345678', 'Khách Bí Mật', 'Ứng Viên Bí Mật', '0987654321', 'bimat@example.com',
              'BANMABIMAT', 'Lỗi bí mật', '0901234567', 'Gemini 503', 'Lỗi thử của lượt gửi']
    .filter(s => chu.includes(s));
  ok('Không có SĐT, tên, email khách / ứng viên, bản mã token, câu lỗi thô', lo.length === 0, lo.join(', '));
  const khoa = new Set();
  const duyet = v => { if (v && typeof v === 'object') for (const [kk, x] of Object.entries(v)) { khoa.add(kk); duyet(x); } };
  duyet(k);
  const khoaNhayCam = [...khoa].filter(x => /sdt|ho_ten|email|token|mat_khau|noi_dung|khach/.test(x));
  ok('Không có khóa nào mang dữ liệu cá nhân', khoaNhayCam.length === 0, khoaNhayCam.join(', '));
});

// ===========================================================================
// Web đọc từng ô bằng tên, thiếu ô thì coi là 0 / chưa bật (để không vỡ trang). Cái giá của
// sự dễ dãi đó: đổi tên một ô ở database mà quên web → đèn đó KHÔNG BAO GIỜ đỏ nữa, không ai
// hay. Nhóm này khóa tên ô hai chiều và chạy lib/suc-khoe.ts trên số liệu thật ở trên.
await nhom('11 · WEB ĐỌC ĐÚNG TÊN TỪNG Ô (database thật → lib/suc-khoe.ts)', async () => {
  const { danhGiaSucKhoe, laSucKhoeTho } = await import(LIB_SUC_KHOE);
  const nguon = readFileSync(LIB_SUC_KHOE, 'utf8');
  const { k } = await doc(UID.chu);
  ok('Số liệu đúng dạng web chờ', laSucKhoeTho(k));

  const KHOA = {
    goc:        ['luc', 'zalo', 'messenger', 'dich', 'bao_dong', 'chi_nhanh'],
    zalo:       ['dang_bat', 'che_do', 'bat_luc', 'lan_chay_cuoi', 'co_loi'],
    messenger:  ['dang_bat', 'bat_luc', 'lan_nhan_cuoi', 'loi_cuoi_luc', 'loi_7_ngay'],
    dich:       ['cho', 'loi'],
    bao_dong:   ['lan_chay_cuoi', 'kenh', 'co_loi', 'lan_gui_cuoi'],
    chi_nhanh:  ['id', 'ma', 'ten', 'ipos', 'tin_zalo', 'dat_ban', 'tuyen_dung', 'so_kho'],
    ipos:       ['co_cau_hinh', 'bat', 'cau_hinh_du', 'den', 'mat_ket_noi', 'loi_tu_luc', 'nhan_hd_luc', 'gio_mat_ket_noi',
                 'dang_tru_kho', 'cho_xu_ly', 'dong_loi', 'bat_luc', 'cron_cuoi'],
    tin_zalo:   ['that_bai_24h', 'cho_qua_han'],
    dat_ban:    ['form_mo', 'so_ban', 'cho', 'cho_qua_2_gio', 'cho_qua_24_gio', 'qua_gio_hen'],
    tuyen_dung: ['moi', 'moi_qua_2_ngay', 'moi_qua_7_ngay'],
    so_kho:     ['co_kho', 'lech'],
  };
  const a = cua(k, cnA);
  const thuc = { goc: k, zalo: k?.zalo, messenger: k?.messenger, dich: k?.dich, bao_dong: k?.bao_dong, chi_nhanh: a,
                 ipos: a?.ipos, tin_zalo: a?.tin_zalo, dat_ban: a?.dat_ban, tuyen_dung: a?.tuyen_dung, so_kho: a?.so_kho };
  for (const [phan, ds] of Object.entries(KHOA)) {
    const co = Object.keys(thuc[phan] ?? {}).sort();
    ok(`${phan}: database trả đúng ${ds.length} ô`, JSON.stringify(co) === JSON.stringify([...ds].sort()), co.join(', '));
    const khongDoc = ds.filter(o => !new RegExp(`\\b${o}\\b`).test(nguon));
    ok(`${phan}: lib/suc-khoe.ts đọc đúng những ô đó`, khongDoc.length === 0, khongDoc.join(', '));
  }

  const sk = danhGiaSucKhoe(k, 'vi', true);
  const den = (khoi, ma) => sk.khoi.find(x => x.ma === khoi)?.den.find(d => d.ma === ma);
  const q1 = ma => den(cnA.id, ma), q7 = ma => den(cnB.id, ma), th = ma => den('thuong_hieu', ma);
  const tom = d => `${d?.mau} — ${d?.cau}`;
  ok('Q1 đặt bàn đỏ: 2 qua giờ hẹn, 1 chờ quá 24 giờ, 1 chờ quá 2 giờ — mỗi yêu cầu đếm một lần', q1('dat_ban')?.mau === 'do'
     && /^2 yêu cầu đã qua giờ hẹn/.test(q1('dat_ban')?.cau) && /1 yêu cầu chờ quá 24 giờ/.test(q1('dat_ban')?.cau)
     && /1 yêu cầu chờ quá 2 giờ/.test(q1('dat_ban')?.cau), tom(q1('dat_ban')));
  ok('Q7 đặt bàn đỏ: form mở mà chi nhánh chưa có bàn', q7('dat_ban')?.mau === 'do' && /chưa có bàn nào/.test(q7('dat_ban')?.cau),
     tom(q7('dat_ban')));
  ok('Q1 hồ sơ đỏ: 1 hồ sơ quá 7 ngày, 1 hồ sơ quá 2 ngày', q1('tuyen_dung')?.mau === 'do'
     && /^1 hồ sơ chưa ai mở quá 7 ngày/.test(q1('tuyen_dung')?.cau) && /1 hồ sơ chưa ai mở quá 2 ngày/.test(q1('tuyen_dung')?.cau),
     tom(q1('tuyen_dung')));
  ok('Q1 tin Zalo đỏ: 1 tin giao dịch kẹt', q1('tin_zalo')?.mau === 'do' && /^1 tin giao dịch/.test(q1('tin_zalo')?.cau),
     tom(q1('tin_zalo')));
  ok('Q7 tin Zalo vàng: 1 tin hỏng trong 24 giờ', q7('tin_zalo')?.mau === 'vang', tom(q7('tin_zalo')));
  ok('Q1 sổ kho đỏ (1 lô lệch), Q7 xanh', q1('so_kho')?.mau === 'do' && q7('so_kho')?.mau === 'xanh',
     `${tom(q1('so_kho'))} | ${tom(q7('so_kho'))}`);
  ok('Q1 iPOS vàng như màn Kết nối iPOS: nhận hóa đơn mà chưa trừ kho (vừa bật nên lượt cron cũ chưa tính là dừng)',
     a?.ipos?.den === 'vang' && q1('ipos')?.mau === 'vang' && /CHƯA trừ kho/.test(q1('ipos')?.cau), tom(q1('ipos')));
  ok('Q7 iPOS xám: chưa cấu hình', q7('ipos')?.mau === 'tat', tom(q7('ipos')));
  ok('Bộ gửi Zalo đỏ: bật 2 ngày mà lượt chạy xong gần nhất 45 phút trước (đã dừng), lượt đó bị lỗi',
     th('zalo')?.mau === 'do' && /Bộ gửi đã dừng \(lượt gần nhất 45 phút trước\)/.test(th('zalo')?.cau)
     && /Lượt gửi gần nhất bị lỗi/.test(th('zalo')?.cau), tom(th('zalo')));
  ok('Messenger vàng: có tin đến sau lỗi, 6 lỗi trong 7 ngày', th('messenger')?.mau === 'vang'
     && /^6 lỗi trong 7 ngày/.test(th('messenger')?.cau), tom(th('messenger')));
  ok('Máy dịch vàng: 1 ô lỗi', th('dich')?.mau === 'vang' && /^1 ô dịch bị lỗi/.test(th('dich')?.cau), tom(th('dich')));
});

// ===========================================================================
// 0057 tách phần KIỂM QUYỀN khỏi phần TÍNH của hai hàm, để máy báo động đọc được số liệu mà
// không mở quyền kho / CRM nào. Nhóm này dựng lại hai hàm CŨ đúng nguyên văn 0042 / 0055 (đổi
// tên thành *_cu) trên cùng database rồi so: ai xem cũng thấy y hệt, chỉ thêm ô bao_dong.
await nhom('12 · 0057 TÁCH KIỂM QUYỀN KHỎI SỐ LIỆU — Y HỆT TRƯỚC KHI TÁCH', async () => {
  const MIG = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'migrations');
  const tep = dau => readFileSync(join(MIG, readdirSync(MIG).find(f => f.startsWith(dau))), 'utf8');
  /** Nguyên văn một hàm: từ "create or replace function <ten>(" tới dòng "$$;" đầu tiên sau đó. */
  const ham = (s, ten) => {
    const i = s.indexOf(`create or replace function ${ten}(`);
    const j = i < 0 ? -1 : s.indexOf('\n$$;', i);
    return j < 0 ? '' : s.slice(i, j + 4);
  };
  /** Dòng đầu tiên khác nhau — để biết lệch ở đâu khi hỏng. */
  const lech = (a, b) => {
    const x = a.split('\n'), y = b.split('\n');
    const i = x.findIndex((d, n) => d !== y[n]);
    return i < 0 ? (x.length === y.length ? '' : `số dòng ${x.length} ≠ ${y.length}`) : `dòng ${i + 1}: «${x[i]}» ≠ «${y[i]}»`;
  };
  const m42 = tep('0042_'), m55 = tep('0055_'), m57 = tep('0057_');

  const KIEM_KHO = "  if not kho_duoc(p_chi_nhanh_id, 'xem') then\n"
    + "    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này' using errcode = 'insufficient_privilege';\n"
    + "  end if;\n";
  const cu42 = ham(m42, 'kho_ipos_trang_thai');
  ok('0042: kho_ipos_trang_thai có đúng một đoạn kiểm kho_duoc', cu42.split(KIEM_KHO).length === 2);
  const goc = ham(m57, 'kho_ipos_trang_thai_goc');
  const gocDung = cu42.replace('function kho_ipos_trang_thai(', 'function kho_ipos_trang_thai_goc(')
    .replace('\nsecurity definer\n', '\nsecurity invoker\n').replace(KIEM_KHO, '');
  ok('kho_ipos_trang_thai_goc = thân 0042 NGUYÊN VĂN, trừ đúng ba dòng kiểm kho_duoc (và là security invoker)',
     goc !== '' && goc === gocDung, lech(goc, gocDung));
  const vo = ham(m57, 'kho_ipos_trang_thai');
  ok('kho_ipos_trang_thai (0057) vẫn là definer, vẫn kiểm kho_duoc với đúng câu từ chối cũ, rồi gọi phần tính',
     vo.includes('\nsecurity definer\nset search_path = public\n') && vo.includes(KIEM_KHO)
     && vo.indexOf(KIEM_KHO) < vo.indexOf('return kho_ipos_trang_thai_goc(p_chi_nhanh_id);'), vo.slice(0, 300));

  const cu55 = ham(m55, 'suc_khoe_he_thong');
  const KIEM_VAI = "  v_ns := nhan_su_hien_tai();\n"
    + "  if v_ns.id is null or v_ns.vai_tro not in ('chu_so_huu', 'quan_ly') then\n"
    + "    raise exception 'Chỉ chủ sở hữu hoặc quản lý mới xem được sức khỏe hệ thống'\n"
    + "      using errcode = 'insufficient_privilege';\n"
    + "  end if;\n\n";
  // Mọi chỗ sửa so với 0055 — ngoài danh sách này (và ô bao_dong bên dưới) phải nguyên văn.
  const SUA = [
    ['create or replace function suc_khoe_he_thong()', 'create or replace function suc_khoe_so_lieu(p_chi_nhanh_ids uuid[])'],
    ['stable\nsecurity definer\n', 'stable\nsecurity invoker\n'],
    ['  v_ns   nhan_su;\n', ''],
    ["  v_ds   jsonb := '[]'::jsonb;\n", "  v_bd   bao_dong_trang_thai;\n  v_ds   jsonb := '[]'::jsonb;\n"],
    [KIEM_VAI, ''],
    ["      and (v_ns.vai_tro = 'chu_so_huu' or c.id = v_ns.chi_nhanh_id)\n", '      and c.id = any(p_chi_nhanh_ids)\n'],
    ['    v_ipos := kho_ipos_trang_thai(v_cn.id);', '    v_ipos := kho_ipos_trang_thai_goc(v_cn.id);'],
    ['  select * into v_m from mess_cau_hinh where id = 1;\n',
     '  select * into v_m from mess_cau_hinh where id = 1;\n  select * into v_bd from bao_dong_trang_thai where id = 1;\n'],
  ];
  let soLieuDung = cu55;
  const khongThay = [];
  for (const [a, b] of SUA) {
    if (soLieuDung.split(a).length !== 2) khongThay.push(a.slice(0, 50));
    soLieuDung = soLieuDung.replace(a, b);
  }
  ok('0055: mỗi chỗ sửa xuất hiện đúng một lần trong suc_khoe_he_thong', khongThay.length === 0, khongThay.join(' | '));
  const soLieu = ham(m57, 'suc_khoe_so_lieu');
  const iO = soLieu.indexOf('    -- 0057:'), jO = soLieu.indexOf("    'chi_nhanh', v_ds);");
  const oBaoDong = iO > 0 && jO > iO ? soLieu.slice(iO, jO) : '';
  ok('suc_khoe_so_lieu thêm đúng một ô bao_dong gồm lan_chay_cuoi, kenh, co_loi, lan_gui_cuoi',
     /'bao_dong', jsonb_build_object\(/.test(oBaoDong)
     && ['lan_chay_cuoi', 'kenh', 'co_loi', 'lan_gui_cuoi'].every(o => oBaoDong.includes(`'${o}'`))
     && (oBaoDong.match(/'[a-z_]+',/g) ?? []).length === 5, oBaoDong);
  const soLieuKhongO = soLieu.slice(0, iO) + soLieu.slice(jO);
  ok('suc_khoe_so_lieu = thân 0055 NGUYÊN VĂN, trừ bỏ kiểm vai, lọc theo danh sách chi nhánh, gọi phần tính iPOS',
     soLieu !== '' && soLieuKhongO === soLieuDung, lech(soLieuKhongO, soLieuDung));
  const vo55 = ham(m57, 'suc_khoe_he_thong');
  ok('suc_khoe_he_thong (0057) vẫn là definer, vẫn kiểm vai với đúng câu từ chối cũ, rồi gọi suc_khoe_so_lieu',
     vo55.includes('\nsecurity definer\nset search_path = public\n') && vo55.includes(KIEM_VAI.trimEnd())
     && vo55.indexOf(KIEM_VAI.trimEnd()) < vo55.indexOf('return suc_khoe_so_lieu(v_ids);'), vo55);

  // Dựng lại hai hàm CŨ (nguyên văn, đổi tên) và so kết quả trên cùng dữ liệu.
  await db.exec(cu42.replace('function kho_ipos_trang_thai(', 'function kho_ipos_trang_thai_cu('));
  await db.exec(cu55.replace('function suc_khoe_he_thong()', 'function suc_khoe_he_thong_cu()')
                    .replace('kho_ipos_trang_thai(v_cn.id)', 'kho_ipos_trang_thai_cu(v_cn.id)'));
  const bo = (k, ...khoa) => { if (!k || typeof k !== 'object') return k; const c = { ...k }; for (const x of khoa) delete c[x]; return c; };
  const NGUOI = [['Chủ', UID.chu], ['Quản lý Q1', UID.qlA], ['Quản lý Q7', UID.qlB], ['Thủ kho Q1', UID.thuKhoA],
                 ['Kế toán Q1', UID.keToanA], ['Marketing Q1', UID.mktA], ['Người đã nghỉ', UID.nghiViec],
                 ['Máy iPOS Q1', UID_MAY_IPOS.mayIposA], ['Tài khoản không có dòng nhan_su', null]];
  const lechSk = [], lechIpos = [];
  let skDuoc = 0, skTuChoi = 0, iposDuoc = 0, iposTuChoi = 0;
  for (const [ten, uid] of NGUOI) {
    const moi = await duoi(uid, `select suc_khoe_he_thong() as k`);
    const cu = await duoi(uid, `select suc_khoe_he_thong_cu() as k`);
    if (moi.loi !== cu.loi || moi.ma !== cu.ma
        || JSON.stringify(bo(moi.rows?.[0]?.k, 'luc', 'bao_dong')) !== JSON.stringify(bo(cu.rows?.[0]?.k, 'luc'))) {
      lechSk.push(`${ten}: ${moi.loi ?? 'đọc được'} / ${cu.loi ?? 'đọc được'}`);
    }
    moi.loi ? skTuChoi++ : skDuoc++;
    for (const cn of [cnA, cnB]) {
      const m = await duoi(uid, `select kho_ipos_trang_thai($1) as k`, [cn.id]);
      const c = await duoi(uid, `select kho_ipos_trang_thai_cu($1) as k`, [cn.id]);
      if (m.loi !== c.loi || m.ma !== c.ma || JSON.stringify(m.rows?.[0]?.k) !== JSON.stringify(c.rows?.[0]?.k)) {
        lechIpos.push(`${ten} × ${cn.ten}: ${m.loi ?? 'đọc được'} / ${c.loi ?? 'đọc được'}`);
      }
      m.loi ? iposTuChoi++ : iposDuoc++;
    }
  }
  ok(`suc_khoe_he_thong(): ${NGUOI.length} người — số liệu và câu từ chối y hệt trước khi tách (trừ ô bao_dong mới)`,
     lechSk.length === 0 && skDuoc >= 3 && skTuChoi >= 5, lechSk.join(' | ') || `${skDuoc} đọc được, ${skTuChoi} bị từ chối`);
  ok(`kho_ipos_trang_thai(): ${NGUOI.length} người × 2 chi nhánh — kết quả và câu từ chối y hệt trước khi tách`,
     lechIpos.length === 0 && iposDuoc >= 4 && iposTuChoi >= 4,
     lechIpos.join(' | ') || `${iposDuoc} đọc được, ${iposTuChoi} bị từ chối`);
  await db.exec(`drop function suc_khoe_he_thong_cu(); drop function kho_ipos_trang_thai_cu(uuid);`);

  // Phần tính nhận danh sách chi nhánh từ hàm gọi, và chỉ tính chi nhánh đang hoạt động.
  const { rows: [{ k: chu }] } = await duoi(UID.chu, `select suc_khoe_he_thong() as k`);
  const { rows: [{ k: tatCa }] } = await db.query(`select suc_khoe_so_lieu(array[$1, $2]::uuid[]) as k`, [cnA.id, cnB.id]);
  ok('suc_khoe_so_lieu(mọi chi nhánh) = đúng số liệu chủ thấy', JSON.stringify(bo(tatCa, 'luc')) === JSON.stringify(bo(chu, 'luc')));
  const { rows: [{ k: rong }] } = await db.query(`select suc_khoe_so_lieu('{}'::uuid[]) as k`);
  ok('Danh sách rỗng → không chi nhánh nào (phần cả thương hiệu vẫn có)',
     Array.isArray(rong?.chi_nhanh) && rong.chi_nhanh.length === 0 && typeof rong?.zalo === 'object', JSON.stringify(rong?.chi_nhanh));
  await db.query(`update chi_nhanh set dang_hoat_dong = false where id = $1`, [cnB.id]);
  const { rows: [{ k: ngung }] } = await db.query(`select suc_khoe_so_lieu(array[$1, $2]::uuid[]) as k`, [cnA.id, cnB.id]);
  await db.query(`update chi_nhanh set dang_hoat_dong = true where id = $1`, [cnB.id]);
  ok('Chi nhánh đã ngừng hoạt động không được tính, kể cả khi có trong danh sách',
     ngung?.chi_nhanh?.length === 1 && ngung.chi_nhanh[0].id === cnA.id, JSON.stringify(ngung?.chi_nhanh?.map(c => c.ten)));

  // Hai hàm nội bộ: không ai đăng nhập gọi thẳng được — chỉ chạy bên trong hàm definer đã kiểm vai.
  for (const [ten, sql] of [['kho_ipos_trang_thai_goc', `select kho_ipos_trang_thai_goc($1)`],
                            ['suc_khoe_so_lieu', `select suc_khoe_so_lieu(array[$1]::uuid[])`]]) {
    const c = await duoi(UID.chu, sql, [cnA.id]);
    ok(`Chủ cũng KHÔNG gọi thẳng được ${ten} (nội bộ)`, c.loi !== null && /permission denied/.test(c.loi), c.loi ?? 'GỌI ĐƯỢC');
    const a = await duoiAnon(sql, [cnA.id]);
    ok(`anon không gọi được ${ten}`, a.loi !== null, a.loi ?? 'GỌI ĐƯỢC');
  }
  const { rows: [q] } = await db.query(`
    select has_function_privilege('authenticated', 'kho_ipos_trang_thai_goc(uuid)', 'execute') as goc,
           has_function_privilege('authenticated', 'suc_khoe_so_lieu(uuid[])', 'execute') as so_lieu,
           (select prosecdef from pg_proc where oid = 'kho_ipos_trang_thai_goc(uuid)'::regprocedure) as goc_definer,
           (select prosecdef from pg_proc where oid = 'suc_khoe_so_lieu(uuid[])'::regprocedure) as so_lieu_definer`);
  ok('Hai hàm nội bộ là security invoker và authenticated không có quyền execute',
     !q.goc && !q.so_lieu && !q.goc_definer && !q.so_lieu_definer, JSON.stringify(q));
});

process.exit(ketThuc('SỨC KHỎE HỆ THỐNG'));
