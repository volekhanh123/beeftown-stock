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
 *   5. (0058) Sao lưu hằng đêm: bảng he_thong_sao_luu không ai đọc / ghi được qua API; câu SQL mà
 *      workflow dùng để ghi lượt (crm/sao-luu/ghi-luot.sql) chạy đúng trên database thật; mỗi lượt
 *      một dòng; suc_khoe_sao_luu() (chủ + quản lý) trả lượt gần nhất và bản DÙNG ĐƯỢC gần nhất
 *      (khôi phục thử đạt).
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, UID, themMayIpos, UID_MAY_IPOS } from './kho-chung.mjs';

const LIB_SUC_KHOE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'web', 'src', 'lib', 'suc-khoe.ts');
const GHI_LUOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'sao-luu', 'ghi-luot.sql');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — SỨC KHỎE HỆ THỐNG');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
await themMayIpos(db, cnA, cnB);

/** Đọc suc_khoe_he_thong() dưới danh nghĩa một người. */
async function doc(uid) {
  const r = await duoi(uid, `select suc_khoe_he_thong() as k`);
  return { k: r.rows?.[0]?.k ?? null, loi: r.loi, ma: r.ma };
}
/** Đọc suc_khoe_sao_luu() (0058) dưới danh nghĩa một người. */
async function docSl(uid) {
  const r = await duoi(uid, `select suc_khoe_sao_luu() as k`);
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
  const sl = (await docSl(UID.chu)).k;
  ok('Sao lưu (suc_khoe_sao_luu): chưa có lượt nào — mọi ô null (web báo đỏ "chưa có bản sao lưu nào")',
     sl && Object.values(sl).length === 5 && Object.values(sl).every(v => v === null), JSON.stringify(sl));
  ok('suc_khoe_he_thong() không đổi ở 0058 (không có ô sao_lưu — hàm đọc riêng)', !('sao_luu' in (k ?? {})));
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
    goc:        ['luc', 'zalo', 'messenger', 'dich', 'chi_nhanh'],
    sao_luu:    ['lan_cuoi', 'lan_cuoi_ok', 'lan_cuoi_thu', 'dung_duoc_cuoi', 'kich_thuoc'],
    zalo:       ['dang_bat', 'che_do', 'bat_luc', 'lan_chay_cuoi', 'co_loi'],
    messenger:  ['dang_bat', 'bat_luc', 'lan_nhan_cuoi', 'loi_cuoi_luc', 'loi_7_ngay'],
    dich:       ['cho', 'loi'],
    chi_nhanh:  ['id', 'ma', 'ten', 'ipos', 'tin_zalo', 'dat_ban', 'tuyen_dung', 'so_kho'],
    ipos:       ['co_cau_hinh', 'bat', 'cau_hinh_du', 'den', 'mat_ket_noi', 'loi_tu_luc', 'nhan_hd_luc', 'gio_mat_ket_noi',
                 'dang_tru_kho', 'cho_xu_ly', 'dong_loi', 'bat_luc', 'cron_cuoi'],
    tin_zalo:   ['that_bai_24h', 'cho_qua_han'],
    dat_ban:    ['form_mo', 'so_ban', 'cho', 'cho_qua_2_gio', 'cho_qua_24_gio', 'qua_gio_hen'],
    tuyen_dung: ['moi', 'moi_qua_2_ngay', 'moi_qua_7_ngay'],
    so_kho:     ['co_kho', 'lech'],
  };
  const a = cua(k, cnA);
  const saoLuu = (await docSl(UID.chu)).k;
  const thuc = { goc: k, zalo: k?.zalo, messenger: k?.messenger, dich: k?.dich, sao_luu: saoLuu, chi_nhanh: a,
                 ipos: a?.ipos, tin_zalo: a?.tin_zalo, dat_ban: a?.dat_ban, tuyen_dung: a?.tuyen_dung, so_kho: a?.so_kho };
  for (const [phan, ds] of Object.entries(KHOA)) {
    const co = Object.keys(thuc[phan] ?? {}).sort();
    ok(`${phan}: database trả đúng ${ds.length} ô`, JSON.stringify(co) === JSON.stringify([...ds].sort()), co.join(', '));
    const khongDoc = ds.filter(o => !new RegExp(`\\b${o}\\b`).test(nguon));
    ok(`${phan}: lib/suc-khoe.ts đọc đúng những ô đó`, khongDoc.length === 0, khongDoc.join(', '));
  }

  const sk = danhGiaSucKhoe({ ...k, sao_luu: saoLuu }, 'vi', true);
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
  ok('Sao lưu đỏ: database chưa có lượt sao lưu nào', th('sao_luu')?.mau === 'do'
     && /^Chưa có bản sao lưu nào/.test(th('sao_luu')?.cau), tom(th('sao_luu')));
});

// ===========================================================================
// 0058. Workflow .github/workflows/sao-luu.yml ghi lượt bằng psql -v … -f crm/sao-luu/ghi-luot.sql.
// PGlite không có psql: thay :'ten' bằng chuỗi SQL đúng như psql làm (nháy đơn, nháy trong nhân đôi)
// rồi chạy CHÍNH file đó — đổi tên cột ở migration mà quên file này thì đỏ ở đây, không đợi đêm.
await nhom('12 · SAO LƯU HẰNG ĐÊM (0058 · he_thong_sao_luu)', async () => {
  // psql không thay biến trong chú thích — bỏ các dòng "--" như psql.
  const ghiLuot = readFileSync(GHI_LUOT, 'utf8').split('\n').filter(l => !l.trimStart().startsWith('--')).join('\n');
  const ghi = bien => {
    const sql = ghiLuot.replace(/:'([a-z_]+)'/g, (_, ten) => {
      if (!(ten in bien)) throw new Error(`ghi-luot.sql cần biến ${ten}`);
      return `'${String(bien[ten]).replaceAll("'", "''")}'`;
    });
    return db.query(sql);
  };
  const luot = (sua = {}) => ({ bat_dau_luc: new Date(Date.now() - 5 * 60000).toISOString(), ok: 'true', kich_thuoc: '829275',
                                so_bang: '118', so_dong: '10325', thu_khoi_phuc: 'dat', loi: '', luot_chay: '1001-1', ...sua });
  const dem = async () => Number((await db.query(`select count(*) n from he_thong_sao_luu`)).rows[0].n);

  const bienTrongFile = [...new Set([...ghiLuot.matchAll(/:'([a-z_]+)'/g)].map(m => m[1]))].sort();
  ok('ghi-luot.sql dùng đúng tám biến workflow truyền (-v …)', JSON.stringify(bienTrongFile) === JSON.stringify(
     ['bat_dau_luc', 'kich_thuoc', 'loi', 'luot_chay', 'ok', 'so_bang', 'so_dong', 'thu_khoi_phuc']), bienTrongFile.join(', '));

  await ghi(luot());
  const dong = (await db.query(`select * from he_thong_sao_luu`)).rows[0];
  ok('Lượt tốt: ghi đủ cỡ, số bảng, số dòng, khôi phục thử đạt; ô lỗi trống → null',
     dong?.ok === true && Number(dong.kich_thuoc) === 829275 && dong.so_bang === 118 && Number(dong.so_dong) === 10325
     && dong.thu_khoi_phuc === 'dat' && dong.loi === null, JSON.stringify(dong));
  await ghi(luot());
  ok('bam-hai-lan: chạy lại bước ghi của cùng một lượt (run_id-attempt) → vẫn một dòng', await dem() === 1, String(await dem()));

  const loiThu = `Bước hỏng'); drop table he_thong_sao_luu; --`;
  await ghi(luot({ luot_chay: '1002-1', ok: 'false', kich_thuoc: '', so_bang: '', so_dong: '', thu_khoi_phuc: 'chua_thu',
                   loi: loiThu, bat_dau_luc: new Date(Date.now() - 60000).toISOString() }));
  const hong = (await db.query(`select * from he_thong_sao_luu where luot_chay = '1002-1'`)).rows[0];
  ok('Lượt hỏng: ô số trống → null; câu lỗi có dấu nháy ghi nguyên văn, không thành lệnh SQL',
     hong?.ok === false && hong.kich_thuoc === null && hong.loi === loiThu && await dem() === 2, JSON.stringify(hong));
  const dai = 'x'.repeat(500);
  await ghi(luot({ luot_chay: '1003-1', ok: 'false', kich_thuoc: '', so_bang: '', so_dong: '', thu_khoi_phuc: 'chua_thu', loi: dai,
                   bat_dau_luc: new Date(Date.now() - 2 * 3600000).toISOString() }));
  ok('Câu lỗi quá dài bị cắt còn 300 ký tự (không làm hỏng lượt ghi)',
     (await db.query(`select char_length(loi) n from he_thong_sao_luu where luot_chay = '1003-1'`)).rows[0]?.n === 300);

  const phaiLoi = async (sua, ten) => {
    let e = null;
    try { await ghi(luot(sua)); } catch (x) { e = x.message; }
    ok(`Database từ chối: ${ten}`, e !== null, e ?? 'GHI ĐƯỢC');
  };
  await phaiLoi({ luot_chay: '1004-1', kich_thuoc: '' }, 'lượt "tốt" mà không có cỡ file');
  await phaiLoi({ luot_chay: '1004-2', so_dong: '' }, 'lượt "tốt" mà không có số dòng');
  await phaiLoi({ luot_chay: '1005-1', ok: 'false', kich_thuoc: '', so_bang: '', so_dong: '' }, 'lượt hỏng mà ghi "đã khôi phục thử"');
  await phaiLoi({ luot_chay: 'abc; drop' }, 'mã lượt không đúng dạng run_id-attempt');
  await phaiLoi({ luot_chay: '1006-1', thu_khoi_phuc: 'gia' }, 'kết quả khôi phục thử lạ');

  const sl = (await docSl(UID.chu)).k;
  ok('suc_khoe_sao_luu: lượt gần nhất là lượt hỏng 1 phút trước; bản dùng được gần nhất là lượt 5 phút trước',
     sl?.lan_cuoi_ok === false && sl.lan_cuoi_thu === 'chua_thu' && Math.abs(phutTruoc(sl.lan_cuoi) - 1) < 1
     && Math.abs(phutTruoc(sl.dung_duoc_cuoi) - 5) < 1 && sl.kich_thuoc === 829275, JSON.stringify(sl));
  const ql = (await docSl(UID.qlA)).k;
  ok('Quản lý thấy cùng số liệu sao lưu (cấp thương hiệu)', JSON.stringify(ql) === JSON.stringify(sl), JSON.stringify(ql));
  const { danhGiaSucKhoe } = await import(LIB_SUC_KHOE);
  const tho = { ...(await doc(UID.chu)).k, sao_luu: sl };
  const d = danhGiaSucKhoe(tho, 'vi', true).khoi[0].den.find(x => x.ma === 'sao_luu');
  ok('Đèn trên số liệu thật: vàng — lượt gần nhất hỏng, còn bản dùng được 5 phút trước', d?.mau === 'vang'
     && /^Lượt sao lưu gần nhất \(1 phút trước\) bị lỗi — bản dùng được gần nhất: 5 phút trước/.test(d.cau), `${d?.mau} — ${d?.cau}`);

  // Lượt mới hơn sao lưu được nhưng khôi phục thử HỎNG: không phải bản dùng được — mốc bản dùng được giữ nguyên.
  await ghi(luot({ luot_chay: '1007-1', thu_khoi_phuc: 'hong', loi: 'Khôi phục thử không đạt', kich_thuoc: '900000',
                   bat_dau_luc: new Date(Date.now() - 30000).toISOString() }));
  const sl2 = (await docSl(UID.chu)).k;
  ok('Bản sao khôi phục thử hỏng KHÔNG thành "bản dùng được"; lượt gần nhất ghi đúng "hong"',
     sl2?.lan_cuoi_ok === true && sl2.lan_cuoi_thu === 'hong' && sl2.dung_duoc_cuoi === sl.dung_duoc_cuoi && sl2.kich_thuoc === 829275,
     JSON.stringify(sl2));

  for (const [ten, uid] of [
    ['Thủ kho', UID.thuKhoA], ['Nhân viên quầy', UID.nvQuayA], ['Kế toán', UID.keToanA], ['Thu ngân', UID.thuNganA],
    ['Marketing', UID.mktA], ['Người đã nghỉ', UID.nghiViec], ['Tài khoản máy iPOS', UID_MAY_IPOS.mayIposA],
    ['Tài khoản không có dòng nhan_su', null],
  ]) {
    const r = await docSl(uid);
    ok(`suc_khoe_sao_luu: ${ten} bị từ chối (insufficient_privilege, cùng câu với suc_khoe_he_thong)`,
       r.loi !== null && /Chỉ chủ sở hữu hoặc quản lý/.test(r.loi) && r.ma === '42501', r.loi ?? 'ĐỌC ĐƯỢC');
  }
  const anonSl = await duoiAnon(`select suc_khoe_sao_luu()`);
  ok('suc_khoe_sao_luu: anon không gọi được', anonSl.loi !== null, anonSl.loi ?? 'GỌI ĐƯỢC');

  for (const [ten, uid] of [['Chủ', UID.chu], ['Quản lý', UID.qlA], ['Kế toán', UID.keToanA]]) {
    const r = await duoi(uid, `select count(*) from he_thong_sao_luu`);
    ok(`${ten} không đọc thẳng được bảng (chỉ qua suc_khoe_he_thong)`, r.loi !== null, r.loi ?? 'ĐỌC ĐƯỢC');
  }
  const ghiChu = await duoi(UID.chu, `insert into he_thong_sao_luu (bat_dau_luc, ok, luot_chay) values (now(), false, '9-1')`);
  ok('Chủ không tự ghi được một lượt "sao lưu" giả qua API', ghiChu.loi !== null, ghiChu.loi ?? 'GHI ĐƯỢC');
  const anon = await duoiAnon(`insert into he_thong_sao_luu (bat_dau_luc, ok, luot_chay) values (now(), true, '9-2')`);
  ok('anon không ghi được', anon.loi !== null, anon.loi ?? 'GHI ĐƯỢC');
  const rls = (await db.query(`select relrowsecurity r from pg_class where relname = 'he_thong_sao_luu'`)).rows[0]?.r;
  ok('RLS bật, không có policy nào', rls === true
     && Number((await db.query(`select count(*) n from pg_policies where tablename = 'he_thong_sao_luu'`)).rows[0].n) === 0);
});

process.exit(ketThuc('SỨC KHỎE HỆ THỐNG'));
