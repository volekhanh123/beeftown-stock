/**
 * BEEFTOWN CRM — Kiểm thử: hàm CRM giới hạn ĐÚNG CHI NHÁNH, xếp tin không gửi hai lần,
 * đặt bàn chỉ đổi theo đúng bước (migration 0066)
 * ===================================================================================
 *
 *     node test/test-quyen-chi-nhanh-crm.mjs
 *
 * Rà soát nợ kỹ thuật 11/10/2026, phần quyền còn lại sau 0065:
 *
 *   · tim_hoac_tao_khach() kiểm VAI nhưng không kiểm CHI NHÁNH: thu ngân Q1 biết số điện thoại
 *     là nhận nguyên dòng khach_hang của khách chỉ ăn ở Q7 (ghi chú, ngày sinh), điền được tên cho
 *     khách Q7 chưa có tên; tra không thấy thì tạo dòng mới cho chi nhánh bất kỳ, hay không chi
 *     nhánh nào (dòng mồ côi không ai thấy).
 *   · phieu_do_launch() nhận mã chi nhánh bất kỳ, hoặc null — số liệu MỌI chi nhánh; mã gõ sai
 *     cũng thành "mọi chi nhánh".
 *   · tao_tin_tuyen_dung_mau() nhận p_chi_nhanh_id bất kỳ: quản lý Q1 tạo tin nháp vào Q7.
 *   · xep_hang_gui_tin() không đặt khoa_gui: bấm đúp = hai tin ZBS có tính phí; không kiểm khách
 *     thuộc chi nhánh — tin (và chi phí) của khách Q7 ghi vào sổ Q1.
 *   · dat_ban_sua (0007) cho nhân viên chi nhánh sửa MỌI cột, MỌI bước: đã hủy → đã xác nhận (nảy
 *     tin Zalo), đổi khách, đổi mã đặt bàn, sửa "khách đồng ý nhận tin", ghi tên người khác vào
 *     nguoi_xu_ly. Chú thích ở /noi-bo/dat-ban nói "RLS vẫn chặn" — không đúng.
 *
 * Mỗi nhóm thử bằng duoi() (đúng quyền authenticated của Supabase — kho-chung.mjs không cấp
 * EXECUTE hàng loạt), và thử luôn đường ghi thật (ghi_luot_ghe, tao_dat_ban của website, huy_dat_ban,
 * hộp thư đặt bàn) vẫn chạy.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — HÀM CRM ĐÚNG CHI NHÁNH, XẾP TIN MỘT LẦN, ĐẶT BÀN ĐÚNG BƯỚC (0066)');
const { db, cnA, cnB, nsId, duoi, duoiAnon } = await dungDatabase();

const UID_LA = '00000000-0000-4000-8000-0000000000aa';
const UID_TN_NGHI = '00000000-0000-4000-8000-0000000000ac';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam)
                values ($1, $2, 'Thu ngân đã nghỉ', 'thu_ngan', false)`, [UID_TN_NGHI, cnA.id]);
for (const cn of [cnA, cnB]) {
  await db.query(`insert into cau_hinh_tich_diem (chi_nhanh_id, dang_bat) values ($1, true)`, [cn.id]);
  for (let i = 1; i <= 3; i++) {
    await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1, $2, 4)`, [cn.id, `B0${i}`]);
  }
}

const biChan = r => r.loi !== null && r.ma === '42501';
const vi = r => (r.loi ? `${r.ma}: ${r.loi}` : 'CHẠY ĐƯỢC');
const dem = async (sql, p = []) => Number((await db.query(sql, p)).rows[0].n);
const ngayKia = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
// Ngày khác cho đặt bàn của website ở mục 5: mục 5 tạo hai chục đặt bàn 19:00 ngayKia, khung 18:00 hôm đó hết bàn.
const ngayXa = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);

/** Khách đã ăn ở một chi nhánh (ghi_luot_ghe không phiên — như máy POS), kèm dữ liệu riêng tư. */
async function khachAnO(cn, sdt, hoTen, ghiChu) {
  const { rows: [g] } = await db.query(`select * from ghi_luot_ghe($1, $2, 300000::bigint)`, [cn.id, sdt]);
  await db.query(`update khach_hang set ho_ten = $2, ghi_chu = $3, ngay_sinh_ngay = 12, ngay_sinh_thang = 5
                  where id = $1`, [g.khach_hang_id, hoTen, ghiChu]);
  return g.khach_hang_id;
}
const khQ1 = await khachAnO(cnA, '0901000001', 'Khách Q1', 'Dị ứng tôm');
const khQ7 = await khachAnO(cnB, '0907000001', 'Khách Q7', 'Hay đi cùng sếp, không nhắc vợ');
const { rows: [{ khach_hang_id: khQ7KhongTen }] } = await db.query(
  `select khach_hang_id from ghi_luot_ghe($1, '0907000002', 200000::bigint)`, [cnB.id]);
// Chỉ ăn ở Q7 suốt bài (khách 0907000002 đặt bàn web ở Q1 trong mục 1, nên thành khách Q1).
const khChiQ7 = await khachAnO(cnB, '0907000003', 'Khách chỉ Q7', 'Khách quen Q7');

// ===========================================================================
await nhom('1 · tim_hoac_tao_khach() — khách chi nhánh khác không lộ, khách mới chỉ cho chi nhánh mình', async () => {
  const TIM = `select * from tim_hoac_tao_khach($1)`;
  for (const [ai, uid] of [['Thu ngân Q1', UID.thuNganA], ['Quản lý Q1', UID.qlA]]) {
    const r = await duoi(uid, TIM, ['0907000001']);
    const k = r.rows?.[0];
    ok(`${ai} tra SĐT khách chỉ ăn ở Q7 → vẫn nhận id (ghi lượt ghé cần), nhưng KHÔNG thấy ghi chú, ngày sinh, tên`,
       r.loi === null && k?.id === khQ7 && k.ghi_chu === null && k.ngay_sinh_ngay === null && k.ho_ten === null,
       r.loi ? vi(r) : JSON.stringify({ ho_ten: k?.ho_ten, ghi_chu: k?.ghi_chu, ngay_sinh_ngay: k?.ngay_sinh_ngay }));
  }
  const chu = await duoi(UID.chu, TIM, ['0907000001']);
  ok('Chủ sở hữu tra được nguyên hồ sơ khách Q7',
     chu.loi === null && chu.rows?.[0]?.ghi_chu === 'Hay đi cùng sếp, không nhắc vợ', vi(chu));
  const q7 = await duoi(UID.qlB, TIM, ['0907000001']);
  ok('Quản lý Q7 tra được nguyên hồ sơ khách của mình', q7.loi === null && q7.rows?.[0]?.ho_ten === 'Khách Q7', vi(q7));
  const q1 = await duoi(UID.thuNganA, TIM, ['0901000001']);
  ok('Thu ngân Q1 tra được nguyên hồ sơ khách đã ăn ở Q1',
     q1.loi === null && q1.rows?.[0]?.ghi_chu === 'Dị ứng tôm' && q1.rows[0].ngay_sinh_thang === 5, vi(q1));
  const { rows: [{ ghi_chu: k0 }] } = await db.query(`select * from tim_hoac_tao_khach('0907000001')`);
  ok('Không phiên đăng nhập (SQL Editor, máy POS) vẫn nhận nguyên hồ sơ như cũ', k0 === 'Hay đi cùng sếp, không nhắc vợ');

  const ten = await duoi(UID.thuNganA, `select * from tim_hoac_tao_khach('0907000002', 'Tên do Q1 đặt')`);
  const { rows: [{ ho_ten }] } = await db.query(`select ho_ten from khach_hang where id = $1`, [khQ7KhongTen]);
  ok('Thu ngân Q1 KHÔNG điền được tên cho khách Q7 chưa có tên (tin Zalo của Q7 gọi khách bằng tên đó)',
     ten.loi === null && ho_ten === null, `${vi(ten)} · tên giờ là ${JSON.stringify(ho_ten)}`);

  const truoc = await dem(`select count(*) n from khach_hang`);
  for (const [ai, cn] of [['cho chi nhánh Q7', cnB.id], ['không gắn chi nhánh (dòng mồ côi)', null]]) {
    const r = await duoi(UID.thuNganA, `select * from tim_hoac_tao_khach('0988000001', 'Khách mới', $1)`, [cn]);
    ok(`Thu ngân Q1 tạo khách mới ${ai} → bị từ chối`,
       biChan(r) && /Chỉ tạo được hồ sơ khách mới cho chi nhánh của bạn/.test(r.loi), vi(r));
  }
  ok('Không dòng khách nào được tạo', (await dem(`select count(*) n from khach_hang`)) === truoc);

  const moi = await duoi(UID.thuNganA, `select * from tim_hoac_tao_khach('0988000001', 'Khách mới', $1)`, [cnA.id]);
  ok('Thu ngân Q1 tạo khách mới cho Q1 → được, nhận lại đúng thứ vừa gõ',
     moi.loi === null && moi.rows?.[0]?.ho_ten === 'Khách mới' && moi.rows[0].chi_nhanh_dau_tien === cnA.id, vi(moi));
  const chuMoi = await duoi(UID.chu, `select * from tim_hoac_tao_khach('0988000002', 'Khách chủ tạo')`);
  ok('Chủ sở hữu tạo khách không gắn chi nhánh được như cũ', chuMoi.loi === null && chuMoi.rows?.length === 1, vi(chuMoi));
  for (const [ai, uid] of [['Marketing Q1', UID.mktA], ['Thu ngân đã nghỉ', UID_TN_NGHI], ['Tài khoản không có nhan_su', UID_LA]]) {
    const r = await duoi(uid, TIM, ['0901000001']);
    ok(`${ai} → vẫn bị từ chối như 0045`, biChan(r) && r.rows === null, vi(r));
  }

  // Đường ghi thật: khách Q7 lần đầu ghé Q1.
  const ghe = await duoi(UID.thuNganA, `select * from ghi_luot_ghe($1, '0907000001', 400000::bigint)`, [cnA.id]);
  ok('Thu ngân Q1 vẫn ghi được lượt ghé (có điểm) cho khách Q7 lần đầu ghé Q1',
     ghe.loi === null && ghe.rows?.[0]?.khach_hang_id === khQ7 && Number(ghe.rows[0].diem_tich_duoc) > 0, vi(ghe));
  const sau = await duoi(UID.thuNganA, TIM, ['0907000001']);
  ok('…từ lúc đó khách đã là khách của Q1: thu ngân Q1 thấy nguyên hồ sơ (đúng như khach_hang_doc)',
     sau.loi === null && sau.rows?.[0]?.ghi_chu === 'Hay đi cùng sếp, không nhắc vợ', vi(sau));
  const dat = await duoiAnon(
    `select * from tao_dat_ban('q1', '0907000002', 'Khách Q7 đặt web', $1::date, '18:00'::time, 2::smallint)`, [ngayKia]);
  ok('Website (anon) vẫn đặt bàn được cho khách đang có ở chi nhánh khác', dat.loi === null && dat.rows?.length === 1, dat.loi ?? '');
});

// ===========================================================================
await nhom('2 · phieu_do_launch() — chỉ chi nhánh của người xem', async () => {
  for (const [cn, so] of [[cnA, 2], [cnB, 3]]) {
    for (let i = 0; i < so; i++) {
      await db.query(`insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach)
                      values ($1, $2, hom_nay_vn(), '19:00', 2)`, [cn.id, khQ1]);
      await db.query(`insert into su_kien_web (loai, chi_nhanh_id) values ('xem_trang', $1)`, [cn.id]);
    }
  }
  const SO = `select gia_tri from phieu_do_launch(hom_nay_vn() - 30, hom_nay_vn() + 30, $1) where chi_so = $2`;
  const so = async (uid, ma, chiSo = 'yeu_cau_dat_ban') => {
    const r = await duoi(uid, SO, [ma, chiSo]);
    return r.loi ? r : Number(r.rows[0].gia_tri);
  };
  const datQ1 = await dem(`select count(*) n from dat_ban where chi_nhanh_id = $1 and ngay between hom_nay_vn() - 30 and hom_nay_vn() + 30`, [cnA.id]);
  const datQ7 = await dem(`select count(*) n from dat_ban where chi_nhanh_id = $1 and ngay between hom_nay_vn() - 30 and hom_nay_vn() + 30`, [cnB.id]);

  const q7 = await duoi(UID.mktA, SO, ['q7', 'yeu_cau_dat_ban']);
  ok('Marketing Q1 xin phiếu đo của Q7 → bị từ chối', biChan(q7) && /Chỉ xem được phiếu đo của chi nhánh của bạn/.test(q7.loi), vi(q7));
  ok('Marketing Q1 để trống chi nhánh → chỉ số của Q1 (không cộng Q7)', (await so(UID.mktA, null)) === datQ1, `${JSON.stringify(await so(UID.mktA, null))} ≠ ${datQ1}`);
  ok('…kể cả số lượt xem trang', (await so(UID.mktA, null, 'luot_xem_trang')) === 2);
  ok('Quản lý Q7 để trống → chỉ số của Q7', (await so(UID.qlB, null)) === datQ7);
  ok('Quản lý Q1 ghi đúng mã của mình (Q1, chữ hoa) → được', (await so(UID.qlA, 'Q1')) === datQ1);
  ok('Chủ sở hữu để trống → mọi chi nhánh', (await so(UID.chu, null)) === datQ1 + datQ7);
  ok('Chủ sở hữu chọn Q7 → đúng Q7', (await so(UID.chu, 'q7')) === datQ7);
  const sai = await duoi(UID.chu, SO, ['q9', 'yeu_cau_dat_ban']);
  ok('Mã chi nhánh gõ sai → báo không tìm thấy (trước đây thành "mọi chi nhánh")',
     sai.loi !== null && /Không tìm thấy chi nhánh q9/.test(sai.loi), vi(sai));
  for (const [ai, uid] of [['Thu ngân Q1', UID.thuNganA], ['Thu ngân đã nghỉ', UID_TN_NGHI], ['Thủ kho Q1', UID.thuKhoA]]) {
    const r = await duoi(uid, SO, [null, 'yeu_cau_dat_ban']);
    ok(`${ai} → vẫn bị từ chối`, biChan(r), vi(r));
  }
});

// ===========================================================================
await nhom('3 · tao_tin_tuyen_dung_mau() — quản lý chỉ cho chi nhánh mình', async () => {
  const r = await duoi(UID.qlA, `select tao_tin_tuyen_dung_mau($1) as n`, [cnB.id]);
  ok('Quản lý Q1 tạo tin mẫu vào Q7 → bị từ chối',
     biChan(r) && /Chỉ khởi tạo được tin mẫu cho chi nhánh của bạn/.test(r.loi), vi(r));
  ok('Q7 không có tin nào', (await dem(`select count(*) n from vi_tri_tuyen_dung where chi_nhanh_id = $1`, [cnB.id])) === 0);
  const ql = await duoi(UID.qlB, `select tao_tin_tuyen_dung_mau($1) as n`, [cnB.id]);
  ok('Quản lý Q7 tạo tin mẫu cho Q7 → 8 tin', ql.loi === null && Number(ql.rows?.[0]?.n) === 8, vi(ql));
  const chu = await duoi(UID.chu, `select tao_tin_tuyen_dung_mau($1) as n`, [cnA.id]);
  ok('Chủ sở hữu tạo cho chi nhánh bất kỳ được (mã tin đã có thì 0 tin mới, như cũ)', chu.loi === null, vi(chu));
  const mkt = await duoi(UID.mktA, `select tao_tin_tuyen_dung_mau($1) as n`, [cnA.id]);
  ok('Marketing vẫn bị từ chối như 0012', biChan(mkt), vi(mkt));
});

// ===========================================================================
await nhom('4 · xep_hang_gui_tin() — bấm đúp không thành hai tin, không xếp tin cho khách chi nhánh khác', async () => {
  await db.query(`update mau_tin set da_duyet = true, ma_zalo = 'zbs-kiem-thu-' || lower(ma) where ma in ('ZBS-01', 'ZBS-04')`);
  const XEP = `select xep_hang_gui_tin($1, $2, $3) as id`;
  const soTin = (kh, ma) => dem(`select count(*) n from nhat_ky_tin t join mau_tin m on m.id = t.mau_tin_id
                                 where t.khach_hang_id = $1 and m.ma = $2`, [kh, ma]);

  const lan1 = await duoi(UID.mktA, XEP, [cnA.id, khQ1, 'ZBS-04']);
  const lan2 = await duoi(UID.mktA, XEP, [cnA.id, khQ1, 'ZBS-04']);
  ok('Marketing Q1 bấm "Gửi" lần đầu → xếp được', lan1.loi === null && !!lan1.rows?.[0]?.id, vi(lan1));
  ok('Bấm lần hai (bấm đúp, mạng chậm bấm lại) → trả lại ĐÚNG tin đã xếp', lan2.loi === null && lan2.rows?.[0]?.id === lan1.rows?.[0]?.id, vi(lan2));
  ok('…hàng chờ chỉ có MỘT tin ZBS-04 cho khách này', (await soTin(khQ1, 'ZBS-04')) === 1, `${await soTin(khQ1, 'ZBS-04')} tin`);
  const ql = await duoi(UID.qlA, XEP, [cnA.id, khQ1, 'ZBS-04']);
  ok('Quản lý Q1 bấm cùng tin đó → vẫn là tin cũ', ql.loi === null && ql.rows?.[0]?.id === lan1.rows?.[0]?.id, vi(ql));
  if (lan1.rows?.[0]?.id) {
    await db.query(`update nhat_ky_tin set ket_qua = 'da_gui', gui_luc = now() where id = $1`, [lan1.rows[0].id]);
  }
  const sauGui = await duoi(UID.mktA, XEP, [cnA.id, khQ1, 'ZBS-04']);
  ok('Tin đã gửi đi rồi, bấm lại trong ngày → không gửi thêm', sauGui.loi === null && sauGui.rows?.[0]?.id === lan1.rows?.[0]?.id
     && (await soTin(khQ1, 'ZBS-04')) === 1, vi(sauGui));
  const mauKhac = await duoi(UID.mktA, XEP, [cnA.id, khQ1, 'ZBS-01']);
  ok('Mẫu KHÁC cho cùng khách → tin mới (khoá theo mẫu, không chặn nhầm)',
     mauKhac.loi === null && mauKhac.rows?.[0]?.id && mauKhac.rows[0].id !== lan1.rows?.[0]?.id, vi(mauKhac));
  const { rows: [{ khoa_gui }] } = await db.query(`select khoa_gui from nhat_ky_tin where id = $1`, [lan1.rows?.[0]?.id]);
  const { rows: [{ d: homNayVn }] } = await db.query(`select to_char(hom_nay_vn(), 'YYYY-MM-DD') d`);
  ok('khoa_gui ghi theo ngày giờ Việt Nam', khoa_gui === `TAY:ZBS-04:${khQ1}:${homNayVn}`, khoa_gui);

  // Hôm qua đã gửi tay: hôm nay gửi lại là một lần gửi mới, có chủ đích.
  const hqua = await db.query(`select to_char(hom_nay_vn() - 1, 'YYYY-MM-DD') d`);
  await db.query(`update nhat_ky_tin set khoa_gui = $2 where id = $1`, [lan1.rows?.[0]?.id, `TAY:ZBS-04:${khQ1}:${hqua.rows[0].d}`]);
  const homNay = await duoi(UID.mktA, XEP, [cnA.id, khQ1, 'ZBS-04']);
  ok('Đã gửi tay hôm qua → hôm nay xếp được tin mới', homNay.loi === null && homNay.rows?.[0]?.id !== lan1.rows?.[0]?.id, vi(homNay));

  const truoc = await dem(`select count(*) n from nhat_ky_tin`);
  for (const [ai, uid] of [['Marketing Q1', UID.mktA], ['Quản lý Q1', UID.qlA], ['Chủ sở hữu', UID.chu]]) {
    const r = await duoi(uid, XEP, [cnA.id, khChiQ7, 'ZBS-04']);
    ok(`${ai} xếp tin cho khách chỉ có ở Q7 vào sổ Q1 → bị từ chối`,
       biChan(r) && /Khách này chưa từng ghé hay đặt bàn ở chi nhánh này/.test(r.loi), vi(r));
  }
  ok('…không tin nào được thêm', (await dem(`select count(*) n from nhat_ky_tin`)) === truoc);
  const dung = await duoi(UID.chu, XEP, [cnB.id, khChiQ7, 'ZBS-04']);
  ok('Chủ sở hữu xếp tin cho khách Q7 vào sổ Q7 → được', dung.loi === null && !!dung.rows?.[0]?.id, vi(dung));

  // Chiến dịch: tin xếp tay vào một chiến dịch dùng CÙNG khoá với zalo_tao_chien_dich (CD:<chiến dịch>:<khách>).
  const { rows: [m4] } = await db.query(`select id from mau_tin where ma = 'ZBS-04'`);
  const { rows: [cd] } = await db.query(`insert into chien_dich (chi_nhanh_id, mau_tin_id, ten, trang_thai)
                                          values ($1, $2, 'Tri ân', 'dang_chay') returning id`, [cnA.id, m4.id]);
  const { rows: [daCo] } = await db.query(`insert into nhat_ky_tin (chi_nhanh_id, khach_hang_id, mau_tin_id, chien_dich_id, sdt_gui,
                                             noi_dung, ket_qua, khoa_gui)
                                           values ($1, $2, $3, $4, '0901000001', 'x', 'cho_gui', $5) returning id`,
                                          [cnA.id, khQ1, m4.id, cd.id, `CD:${cd.id}:${khQ1}`]);
  const cdLai = await duoi(UID.mktA, `select xep_hang_gui_tin($1, $2, 'ZBS-04', null, $3) as id`, [cnA.id, khQ1, cd.id]);
  ok('Xếp tay vào chiến dịch đã xếp khách này → trả lại tin của chiến dịch, không thêm tin',
     cdLai.loi === null && cdLai.rows?.[0]?.id === daCo.id, vi(cdLai));
  const { rows: [cd7] } = await db.query(`insert into chien_dich (chi_nhanh_id, mau_tin_id, ten, trang_thai)
                                           values ($1, $2, 'Của Q7', 'dang_chay') returning id`, [cnB.id, m4.id]);
  const cdSai = await duoi(UID.mktA, `select xep_hang_gui_tin($1, $2, 'ZBS-04', null, $3) as id`, [cnA.id, khQ1, cd7.id]);
  ok('Gắn tin Q1 vào chiến dịch của Q7 → bị từ chối', cdSai.loi !== null && /Chiến dịch không thuộc chi nhánh này/.test(cdSai.loi), vi(cdSai));

  const tn = await duoi(UID.thuNganA, XEP, [cnA.id, khQ1, 'ZBS-04']);
  ok('Thu ngân vẫn bị từ chối như 0045', biChan(tn), vi(tn));
});

// ===========================================================================
await nhom('5 · dat_ban — nhân viên chỉ đổi theo đúng bước của hộp thư đặt bàn', async () => {
  const TRANG_THAI = ['cho_xac_nhan', 'da_xac_nhan', 'da_den', 'khong_den', 'da_huy'];
  const taoDat = async (tt, cn = cnA, kh = khQ1) => (await db.query(
    `insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach, trang_thai)
     values ($1, $2, $3::date, '19:00', 2, $4) returning *`, [cn.id, kh, ngayKia, tt])).rows[0];

  // Bước hộp thư cho phép — đọc thẳng từ trang, để trang và database không lệch nhau.
  const trang = readFileSync(join(GOC, 'web', 'src', 'pages', 'noi-bo', 'dat-ban.astro'), 'utf8');
  const khoi = trang.slice(trang.indexOf('const CHUYEN_DUOC'), trang.indexOf('};', trang.indexOf('const CHUYEN_DUOC')));
  const BUOC = new Set();
  for (const m of khoi.matchAll(/^\s*(\w+): \[([\s\S]*?)^\s*\],/gm)) {
    for (const t of m[2].matchAll(/toi: '(\w+)'/g)) BUOC.add(`${m[1]}>${t[1]}`);
  }
  ok('Đọc được bước chuyển của hộp thư (5 bước)', BUOC.size === 5, [...BUOC].join(' '));

  const sai = [];
  for (const tu of TRANG_THAI) {
    for (const toi of TRANG_THAI) {
      if (tu === toi) continue;
      const d = await taoDat(tu);
      const r = await duoi(UID.qlA, `update dat_ban set trang_thai = $2 where id = $1 returning trang_thai`, [d.id, toi]);
      const duoc = r.loi === null && r.rows?.length === 1;
      if (duoc !== BUOC.has(`${tu}>${toi}`)) sai.push(`${tu}→${toi}: ${duoc ? 'đổi được' : vi(r)}`);
    }
  }
  ok('Quản lý Q1: đúng 5 bước của hộp thư đổi được, 15 bước còn lại bị chặn (đã hủy → đã xác nhận, đã tới → chờ gọi…)',
     sai.length === 0, sai.join(' · '));

  const d0 = await taoDat('da_huy');
  const nTin = await dem(`select count(*) n from nhat_ky_tin where dat_ban_id = $1`, [d0.id]);
  const hoiSinh = await duoi(UID.mktA, `update dat_ban set trang_thai = 'da_xac_nhan' where id = $1`, [d0.id]);
  ok('Marketing Q1 "hồi sinh" đặt bàn đã hủy → bị chặn, có câu báo',
     hoiSinh.loi !== null && /Bước chuyển trạng thái đặt bàn không hợp lệ/.test(hoiSinh.loi), vi(hoiSinh));
  ok('…đặt bàn vẫn đã hủy, không tin Zalo nào nảy ra',
     (await db.query(`select trang_thai from dat_ban where id = $1`, [d0.id])).rows[0].trang_thai === 'da_huy'
     && (await dem(`select count(*) n from nhat_ky_tin where dat_ban_id = $1`, [d0.id])) === nTin);

  const d1 = await taoDat('cho_xac_nhan');
  const xn = await duoi(UID.thuNganA, `update dat_ban set trang_thai = 'da_xac_nhan' where id = $1 and trang_thai = 'cho_xac_nhan' returning nguoi_xu_ly`, [d1.id]);
  ok('Thu ngân Q1 bấm "Đã gọi xác nhận" (không gửi người xử lý) → được, người xử lý = chính thu ngân',
     xn.loi === null && xn.rows?.[0]?.nguoi_xu_ly === nsId[UID.thuNganA], vi(xn));
  const d2 = await taoDat('cho_xac_nhan');
  const mao = await duoi(UID.qlA, `update dat_ban set trang_thai = 'da_xac_nhan', nguoi_xu_ly = $2 where id = $1`, [d2.id, nsId[UID.thuNganA]]);
  ok('Quản lý ghi tên thu ngân vào người xử lý → bị chặn',
     biChan(mao) && /Người xử lý phải là chính người đang đăng nhập/.test(mao.loi), vi(mao));
  const minh = await duoi(UID.qlA, `update dat_ban set trang_thai = 'da_xac_nhan', nguoi_xu_ly = $2 where id = $1 returning id`, [d2.id, nsId[UID.qlA]]);
  ok('…ghi tên chính mình (như /noi-bo/dat-ban gửi) → được', minh.loi === null && minh.rows?.length === 1, vi(minh));

  const { rows: [luotKhac] } = await db.query(`select id from luot_ghe where khach_hang_id = $1 limit 1`, [khQ7]);
  const { rows: [luotDung] } = await db.query(`select id from luot_ghe where khach_hang_id = $1 and chi_nhanh_id = $2 limit 1`, [khQ1, cnA.id]);
  const { rows: [banQ7] } = await db.query(`select id from ban_an where chi_nhanh_id = $1 limit 1`, [cnB.id]);
  const { rows: [banQ1] } = await db.query(`select id from ban_an where chi_nhanh_id = $1 limit 1`, [cnA.id]);
  const d3 = await taoDat('da_xac_nhan');
  for (const [ai, set, p, cau] of [
    ['đổi sang khách khác', 'khach_hang_id = $2', khQ7, /Không sửa được khách, chi nhánh, mã đặt bàn/],
    ['đổi mã đặt bàn', `ma_dat_ban = 'ABC123'`, null, /Không sửa được khách, chi nhánh, mã đặt bàn/],
    ['sửa "khách đồng ý nhận tin" (bằng chứng Nghị định 13)', 'dong_y_nhan_tin = true', null, /Không sửa được khách, chi nhánh, mã đặt bàn/],
    ['sửa nguồn quảng cáo', `utm_source = 'gia'`, null, /Không sửa được khách, chi nhánh, mã đặt bàn/],
    ['sửa giờ tạo yêu cầu', `created_at = now() - interval '3 days'`, null, /Không sửa được khách, chi nhánh, mã đặt bàn/],
    ['xếp bàn của Q7', 'ban_an_id = $2', banQ7?.id, /Bàn này không thuộc chi nhánh của đặt bàn/],
    ['nối lượt ghé của khách khác', 'luot_ghe_id = $2', luotKhac?.id, /Lượt ghé phải của đúng khách và đúng chi nhánh/],
  ]) {
    const r = await duoi(UID.qlA, `update dat_ban set ${set} where id = $1`, p ? [d3.id, p] : [d3.id]);
    ok(`Quản lý Q1 ${ai} → bị chặn`, r.loi !== null && cau.test(r.loi), vi(r));
  }
  const chuDoi = await duoi(UID.chu, `update dat_ban set chi_nhanh_id = $2 where id = $1`, [d3.id, cnB.id]);
  ok('Chủ sở hữu chuyển đặt bàn sang Q7 bằng một câu update → bị chặn (lịch bàn Q7 không biết)',
     chuDoi.loi !== null && /Không sửa được khách, chi nhánh/.test(chuDoi.loi), vi(chuDoi));
  const { rows: [nguyen] } = await db.query(`select * from dat_ban where id = $1`, [d3.id]);
  ok('Đặt bàn giữ nguyên khách, chi nhánh, mã, đồng ý, nguồn',
     nguyen.khach_hang_id === khQ1 && nguyen.chi_nhanh_id === cnA.id && nguyen.ma_dat_ban === d3.ma_dat_ban
     && nguyen.dong_y_nhan_tin === false && nguyen.utm_source === null);

  const doiGio = await duoi(UID.qlA, `update dat_ban set gio = '20:30', so_khach = 4, ban_an_id = $2, luot_ghe_id = $3,
                                      ghi_chu = 'khách gọi đổi giờ' where id = $1 returning gio`, [d3.id, banQ1.id, luotDung.id]);
  ok('Khách gọi đổi giờ, số khách; xếp bàn Q1, nối lượt ghé của chính khách → được',
     doiGio.loi === null && doiGio.rows?.[0]?.gio === '20:30:00', vi(doiGio));
  const d4 = await taoDat('da_den');
  const doiXong = await duoi(UID.qlA, `update dat_ban set ngay = ngay + 1 where id = $1`, [d4.id]);
  ok('Đặt bàn đã kết thúc (khách đã tới) → không đổi ngày được',
     doiXong.loi !== null && /Đặt bàn đã kết thúc — không đổi được ngày, giờ, số khách hay bàn/.test(doiXong.loi), vi(doiXong));
  const ghiChu = await duoi(UID.qlA, `update dat_ban set ghi_chu = 'khách quên áo' where id = $1 returning id`, [d4.id]);
  ok('…nhưng vẫn ghi chú được', ghiChu.loi === null && ghiChu.rows?.length === 1, vi(ghiChu));

  // Đường không phiên: website hủy, SQL Editor sửa tay.
  const dat = await duoiAnon(`select * from tao_dat_ban('q1', '0912300000', 'Khách web', $1::date, '18:00'::time, 2::smallint)`, [ngayXa]);
  const huy = await duoiAnon(`select huy_dat_ban($1, '0912300000', 'bận') as ok`, [dat.rows?.[0]?.ma_dat_ban]);
  ok('Khách tự hủy trên website (anon, huy_dat_ban) → vẫn được', huy.loi === null && huy.rows?.[0]?.ok === true, vi(huy));
  const tay = await db.query(`update dat_ban set trang_thai = 'da_xac_nhan' where id = $1 returning id`, [d0.id]).then(r => r.rows.length, e => e.message);
  ok('Không phiên đăng nhập (SQL Editor, sửa nhầm) → sửa được như cũ', tay === 1, String(tay));

  const kho = await duoi(UID.thuKhoA, `update dat_ban set ghi_chu = 'x' where id = $1 returning id`, [d4.id]);
  ok('Thủ kho không sửa được đặt bàn (RLS không cho thấy dòng — như cũ)', kho.loi !== null || kho.rows.length === 0, vi(kho));
  ok('Chú thích ở /noi-bo/dat-ban không còn nói "RLS vẫn chặn" (RLS không kiểm bước) mà nói đúng chỗ chặn',
     !/nếu lọt thì RLS vẫn chặn/.test(trang) && /dat_ban_kiem_sua/.test(trang));
});

process.exit(ketThuc('HÀM CRM ĐÚNG CHI NHÁNH'));
