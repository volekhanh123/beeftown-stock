/**
 * BEEFTOWN CRM — Kiểm thử: ai được duyệt giá, đổi cờ món và đổi lịch hiện của nội dung đã công bố (0122)
 * =====================================================================================================
 *
 *     node test/test-quyen-duyet-thuc-don-noi-dung.mjs
 *
 * Rà soát bảo mật 14/11/2026 — hai chỗ giao diện không cho làm nhưng gọi thẳng database thì làm được
 * (cùng khuôn lỗi 0027 đã vá cho lương của tin tuyển dụng):
 *
 *   1. mon_an: policy mon_an_sua cho marketing sửa MỌI cột. Màn /noi-bo/thuc-don chỉ gửi tên, mô tả, khẩu
 *      phần, thứ tự, trạng thái (web/src/lib/thuc-don-noi-bo.ts: "KHÔNG ĐỤNG GIÁ, MỨC CAY, MÓN SỐNG, CÓ CỒN,
 *      NHÓM"), nhưng tài khoản marketing gọi thẳng thì tự duyệt được giá, bỏ được cờ món sống (kèm cảnh báo
 *      bắt buộc) và cờ có cồn (công tắc đồ uống có cồn chỉ chủ bật).
 *   2. noi_dung_cong_bo: thu_hoi_noi_dung (0016) chỉ cho chủ gỡ khóa "chỉ chủ sở hữu", nhưng trigger
 *      noi_dung_cong_bo_kiem_tra không nhìn hai cột hien_tu / hien_den mà cong_tac_bat và noi_dung_cong_khai
 *      đều tôn trọng — marketing hay quản lý đặt hien_den = now() là form đặt bàn đóng với khách.
 *
 *   3. (vòng hai của rà soát, Khánh bảo sửa nốt) Cùng trigger đó cũng không nhìn các cột GHI CHÚ và GHI VẾT của
 *      dòng đã công bố (ly_do, nguoi_duyet, cong_bo_luc…), và không khóa gì ở dòng đã gỡ: marketing viết lại được
 *      "ai duyệt, lúc nào, vì sao" của công tắc chỉ chủ đang chạy, và cả giá trị của bản đã gỡ. Không đổi được thứ
 *      khách thấy, nhưng sổ ghi vết là thứ chủ đọc khi cần biết ai đã làm gì. Nhóm 4b.
 *
 * Mỗi dòng "RÀ SOÁT 14/11" đỏ trước 0122, xanh từ 0122. Các dòng còn lại giữ những việc hợp lệ vẫn làm được.
 */

import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — DUYỆT GIÁ, CỜ MÓN VÀ LỊCH HIỆN CỦA NỘI DUNG (0122)');
const { db, duoi, nsId } = await dungDatabase();

const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];
const CAU_MON = 'Chỉ chủ nhà hàng hoặc quản lý mới thêm được món, duyệt được giá, mức cay, đổi cờ món sống, có cồn, nhóm và các ô khác ngoài phần chữ, thứ tự, trạng thái và đề xuất của món';
const CAU_LICH_CHU = ma => `Khóa ${ma} chỉ chủ sở hữu mới được đổi lịch hiện trên trang`;
const CAU_LICH = 'Không có quyền đổi lịch hiện của nội dung đã công bố';
const CAU_SUA_CHU = ma => `Khóa ${ma} chỉ chủ sở hữu mới được sửa dòng đã công bố hoặc đã gỡ`;
const CAU_SUA = 'Không có quyền sửa nội dung đã công bố hoặc đã gỡ';
const ketQua = r => (r.loi ? `LỖI: ${r.loi.slice(0, 150)}` : `${r.rows.length} dòng ${JSON.stringify(r.rows).slice(0, 120)}`);
const biChan = (r, cau) => typeof r.loi === 'string' && r.loi.includes(cau);
const duocMot = r => r.loi === null && r.rows.length === 1;

// Món mẫu lấy từ chính database (seed 0011, 0096): một món thường, một món có cồn, một món sống.
const thuong = await mot(`select ma, nhom_mon_id from mon_an where not co_con and not la_mon_song and not gia_da_duyet order by ma limit 1`);
const coCon = await mot(`select ma from mon_an where co_con order by ma limit 1`);
const song = await mot(`select ma from mon_an where la_mon_song order by ma limit 1`);
const nhomKhac = await mot(`select id from nhom_mon where id <> $1 order by ma limit 1`, [thuong.nhom_mon_id]);
const docMon = ma => mot(`select ma, gia, gia_da_duyet, gia_de_xuat, muc_cay, muc_cay_da_duyet, co_con, la_mon_song, nhom_mon_id, trang_thai from mon_an where ma = $1`, [ma]);

// ===========================================================================
await nhom('1 · Marketing gọi thẳng không tự duyệt được giá, mức cay, không đổi được cờ và nhóm của món', async () => {
  ok('Có đủ món mẫu: món thường, món có cồn, món sống', !!thuong?.ma && !!coCon?.ma && !!song?.ma && !!nhomKhac?.id,
     JSON.stringify({ thuong: thuong?.ma, coCon: coCon?.ma, song: song?.ma }));

  const gia = await duoi(UID.mktA, `update mon_an set gia = 1000, gia_da_duyet = true where ma = $1 returning ma`, [thuong.ma]);
  ok('RÀ SOÁT 14/11: marketing tự đặt giá đã duyệt → bị từ chối', biChan(gia, CAU_MON), ketQua(gia));
  const cay = await duoi(UID.mktA, `update mon_an set muc_cay = 2, muc_cay_da_duyet = true where ma = $1 returning ma`, [thuong.ma]);
  ok('RÀ SOÁT 14/11: marketing tự duyệt mức cay → bị từ chối', biChan(cay, CAU_MON), ketQua(cay));
  const con = await duoi(UID.mktA, `update mon_an set co_con = false where ma = $1 returning ma`, [coCon.ma]);
  ok('RÀ SOÁT 14/11: marketing bỏ cờ có cồn → bị từ chối', biChan(con, CAU_MON), ketQua(con));
  const s = await duoi(UID.mktA, `update mon_an set la_mon_song = false, canh_bao = null where ma = $1 returning ma`, [song.ma]);
  ok('RÀ SOÁT 14/11: marketing bỏ cờ món sống → bị từ chối', biChan(s, CAU_MON), ketQua(s));
  const nhomMoi = await duoi(UID.mktA, `update mon_an set nhom_mon_id = $2 where ma = $1 returning ma`, [thuong.ma, nhomKhac.id]);
  ok('RÀ SOÁT 14/11: marketing chuyển món sang nhóm khác → bị từ chối', biChan(nhomMoi, CAU_MON), ketQua(nhomMoi));
  const them = await duoi(UID.mktA,
    `insert into mon_an (ma, nhom_mon_id, ten_vi, mo_ta_vi, trang_thai) values ('X99', $1, 'Món thêm thẳng', 'Mô tả đủ dùng.', 'da_cong_bo') returning ma`,
    [nhomKhac.id]);
  ok('RÀ SOÁT 14/11: marketing thêm thẳng một món đã công bố (tự chọn nhóm và cờ) → bị từ chối', biChan(them, CAU_MON), ketQua(them));

  // Rà soát mã 14/11: bản đầu của 0122 liệt kê cột BỊ CẤM, nên cột nào màn hình không gửi mà không nằm trong danh
  // sách thì marketing vẫn ghi được. Giờ là danh sách cột ĐƯỢC SỬA — mọi cột khác, kể cả cột thêm sau này, bị chặn.
  for (const [ten, cau, gt] of [
    ['giả người duyệt và giờ duyệt giá', `gia_nguoi_duyet = $2, gia_duyet_luc = now()`, [nsId[UID.chu]]],
    ['sửa danh sách dị ứng', `di_ung = array['không có gì']`, []],
    ['đổi mã món', `ma = 'X77'`, []],
    ['giả người duyệt công bố', `nguoi_duyet = $2`, [nsId[UID.chu]]],
    ['sửa ghi chú nội bộ "điều gì đang chặn món"', `can_xac_nhan = null, copy_nhap = 'x'`, []],
    ['đổi ngày tạo', `created_at = now() - interval '1 year'`, []],
    // Vòng hai 14/11, Khánh bảo sửa nốt: giờ công bố do database tự điền lúc công bố — không phải ô người biên tập ghi.
    ['tự ghi giờ công bố của món', `cong_bo_luc = '2001-01-01'`, []],
  ]) {
    const r = await duoi(UID.mktA, `update mon_an set ${cau} where ma = $1 returning ma`, [thuong.ma, ...gt]);
    ok(`RÀ SOÁT 14/11: marketing ${ten} → bị từ chối`, biChan(r, CAU_MON), ketQua(r));
  }
  await db.query(`alter table mon_an add column thu_cot_them_sau text`);
  const cotMoi = await duoi(UID.mktA, `update mon_an set thu_cot_them_sau = 'x' where ma = $1 returning ma`, [thuong.ma]);
  ok('RÀ SOÁT 14/11: cột thêm vào bảng sau này mặc định bị chặn với marketing (không phải nhớ thêm vào danh sách cấm)', biChan(cotMoi, CAU_MON), ketQua(cotMoi));
  const qlCotMoi = await duoi(UID.qlA, `update mon_an set thu_cot_them_sau = 'quản lý ghi' where ma = $1 returning ma`, [thuong.ma]);
  ok('…quản lý thì ghi được cột đó', duocMot(qlCotMoi), ketQua(qlCotMoi));
  await db.query(`update mon_an set thu_cot_them_sau = null`);

  const sau = await docMon(thuong.ma);
  ok('Món thường không đổi gì: chưa có giá, chưa có mức cay, vẫn nhóm cũ',
     sau.gia === null && !sau.gia_da_duyet && sau.muc_cay === null && !sau.muc_cay_da_duyet && sau.nhom_mon_id === thuong.nhom_mon_id, JSON.stringify(sau));
  ok('Món có cồn vẫn có cồn, món sống vẫn là món sống', (await docMon(coCon.ma)).co_con === true && (await docMon(song.ma)).la_mon_song === true);
});

// ===========================================================================
await nhom('2 · Việc của marketing ở màn Thực đơn vẫn làm được', async () => {
  const chu = await duoi(UID.mktA,
    `update mon_an set ten_vi = 'Tên viết lại', mo_ta_vi = 'Mô tả viết lại, đủ dài.', khau_phan = '2 người', thu_tu = 7 where ma = $1 returning ma`, [thuong.ma]);
  ok('Marketing sửa tên, mô tả, khẩu phần, thứ tự', duocMot(chu), ketQua(chu));
  // Mọi cột màn Thực đơn gửi (COT_SUA, COT_DICH của web/src/lib/thuc-don-noi-bo.ts) và sổ bản dịch máy dịch ghi.
  for (const cot of ['ten_en', 'ten_ko', 'mo_ta_en', 'mo_ta_ko', 'khau_phan_en', 'khau_phan_ko', 'canh_bao', 'canh_bao_en', 'canh_bao_ko']) {
    const r = await duoi(UID.mktA, `update mon_an set ${cot} = 'Chữ thử cho ${cot}' where ma = $1 returning ma`, [thuong.ma]);
    ok(`Marketing sửa ô ${cot}`, duocMot(r), ketQua(r));
  }
  const so = await duoi(UID.mktA, `update mon_an set ban_dich = ban_dich || '{"thu": {"en": {"cach": "tay"}}}'::jsonb where ma = $1 returning ma`, [thuong.ma]);
  ok('Marketing (và máy dịch chạy dưới phiên marketing) ghi được sổ bản dịch', duocMot(so), ketQua(so));
  const deXuat = await duoi(UID.mktA, `update mon_an set gia_de_xuat = 185000, muc_cay_de_xuat = 1 where ma = $1 returning ma`, [thuong.ma]);
  ok('Marketing đề xuất giá và mức cay (chưa duyệt)', duocMot(deXuat), ketQua(deXuat));
  const congBo = await duoi(UID.mktA, `update mon_an set trang_thai = 'da_cong_bo' where ma = $1 returning ma`, [thuong.ma]);
  ok('Marketing công bố món đã viết xong', duocMot(congBo), ketQua(congBo));
  // Giờ công bố và giờ sửa do hai trigger khác của bảng tự ghi — trigger 0122 chạy trước chúng nên không chặn nhầm.
  const gio = await mot(`select cong_bo_luc > now() - interval '1 minute' as vua_cong_bo, updated_at > now() - interval '1 minute' as vua_sua from mon_an where ma = $1`, [thuong.ma]);
  ok('…giờ công bố của món do database tự điền (vừa xong)', gio?.vua_cong_bo === true && gio?.vua_sua === true, JSON.stringify(gio));
  const giaGioSua = await duoi(UID.mktA, `update mon_an set thu_tu = 8, updated_at = '2001-01-01' where ma = $1 returning (updated_at > now() - interval '1 minute') as that`, [thuong.ma]);
  ok('Marketing gửi kèm giờ sửa tự chọn → lưu được, nhưng database vẫn ghi giờ thật', giaGioSua.loi === null && giaGioSua.rows?.[0]?.that === true, ketQua(giaGioSua));
  // Trình duyệt hay công cụ gửi lại nguyên các cột không đổi: không phải là "đổi cờ".
  const m = await docMon(thuong.ma);
  const guiLai = await duoi(UID.mktA,
    `update mon_an set ten_vi = 'Tên viết lại lần hai', co_con = $2, la_mon_song = $3, nhom_mon_id = $4, gia = $5, gia_da_duyet = $6 where ma = $1 returning ma`,
    [thuong.ma, m.co_con, m.la_mon_song, m.nhom_mon_id, m.gia, m.gia_da_duyet]);
  ok('Marketing gửi kèm các cột được bảo vệ với giá trị KHÔNG đổi → vẫn lưu', duocMot(guiLai), ketQua(guiLai));
  const go = await duoi(UID.mktA, `update mon_an set trang_thai = 'da_thu_hoi' where ma = $1 returning ma`, [thuong.ma]);
  ok('Marketing gỡ món khỏi trang', duocMot(go), ketQua(go));
  const thuNgan = await duoi(UID.thuNganA, `update mon_an set ten_vi = 'Thu ngân sửa' where ma = $1 returning ma`, [thuong.ma]);
  ok('Thu ngân vẫn không sửa được món (0 dòng, như trước)', thuNgan.loi === null && thuNgan.rows.length === 0, ketQua(thuNgan));
});

// ===========================================================================
await nhom('3 · Quản lý, chủ và người chạy SQL (không phiên) vẫn duyệt giá và đổi cờ được', async () => {
  const ql = await duoi(UID.qlA, `update mon_an set gia = 185000, gia_da_duyet = true, muc_cay = 1, muc_cay_da_duyet = true where ma = $1 returning ma`, [thuong.ma]);
  ok('Quản lý duyệt giá và mức cay', duocMot(ql), ketQua(ql));
  const qlB = await duoi(UID.qlB, `update mon_an set co_con = true where ma = $1 returning ma`, [thuong.ma]);
  ok('Quản lý chi nhánh khác đổi cờ có cồn (thực đơn dùng chung toàn thương hiệu)', duocMot(qlB), ketQua(qlB));
  const chu = await duoi(UID.chu, `update mon_an set co_con = false, nhom_mon_id = $2 where ma = $1 returning ma`, [thuong.ma, nhomKhac.id]);
  ok('Chủ đổi cờ và chuyển nhóm', duocMot(chu), ketQua(chu));
  const chuThem = await duoi(UID.chu, `insert into mon_an (ma, nhom_mon_id, ten_vi) values ('X98', $1, 'Món chủ thêm') returning ma`, [nhomKhac.id]);
  ok('Chủ thêm món mới', duocMot(chuThem), ketQua(chuThem));
  let loi = null;
  try { await db.query(`update mon_an set la_mon_song = true, canh_bao = 'Món có thịt bò sống.' where ma = $1`, [thuong.ma]); } catch (e) { loi = String(e?.message ?? e); }
  ok('Không phiên (khối SQL của web/THUC-DON.md chạy trong SQL Editor) vẫn đổi cờ được', loi === null, loi ?? '');
});

// ===========================================================================
await nhom('4 · Lịch hiện của nội dung ĐÃ CÔNG BỐ: chỉ người được công bố khóa đó mới đổi được', async () => {
  // Khóa thường (quản lý công bố và gỡ được): hien_thuc_don. Khóa chỉ chủ: form_dat_ban_dang_mo (đã công bố sẵn từ seed).
  if (!(await mot(`select 1 as co from noi_dung_cong_bo where khoa = 'hien_thuc_don' and trang_thai = 'da_cong_bo'`))) {
    await db.query(`insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai) values ('hien_thuc_don', 'bool', true, 'da_cong_bo')`);
  }
  const cu = await mot(`select k.chi_chu_so_huu as chi_chu, (select count(*) from noi_dung_cong_bo n where n.khoa = k.khoa and n.trang_thai = 'da_cong_bo')::int as so
                          from khoa_cong_bo k where k.khoa = 'form_dat_ban_dang_mo'`);
  const thuongKhoa = await mot(`select chi_chu_so_huu as chi_chu from khoa_cong_bo where khoa = 'hien_thuc_don'`);
  ok('form_dat_ban_dang_mo là khóa chỉ chủ và đang công bố; hien_thuc_don là khóa thường', cu?.chi_chu === true && cu.so === 1 && thuongKhoa?.chi_chu === false, JSON.stringify({ cu, thuongKhoa }));
  const bat = async khoa => (await mot(`select cong_tac_bat($1) as bat`, [khoa])).bat;

  const mkt = await duoi(UID.mktA, `update noi_dung_cong_bo set hien_den = now() where khoa = 'form_dat_ban_dang_mo' and trang_thai = 'da_cong_bo' returning khoa`);
  ok('RÀ SOÁT 14/11: marketing đặt hien_den cho khóa chỉ chủ → bị từ chối', biChan(mkt, CAU_LICH_CHU('form_dat_ban_dang_mo')), ketQua(mkt));
  const ql = await duoi(UID.qlA, `update noi_dung_cong_bo set hien_tu = '2099-01-01' where khoa = 'form_dat_ban_dang_mo' and trang_thai = 'da_cong_bo' returning khoa`);
  ok('RÀ SOÁT 14/11: quản lý dời hien_tu của khóa chỉ chủ → bị từ chối', biChan(ql, CAU_LICH_CHU('form_dat_ban_dang_mo')), ketQua(ql));
  ok('…form đặt bàn vẫn đang mở với khách', await bat('form_dat_ban_dang_mo') === true);

  const mktThuong = await duoi(UID.mktA, `update noi_dung_cong_bo set hien_den = now() where khoa = 'hien_thuc_don' and trang_thai = 'da_cong_bo' returning khoa`);
  ok('RÀ SOÁT 14/11: marketing đặt hien_den cho khóa thường đã công bố → bị từ chối', biChan(mktThuong, CAU_LICH), ketQua(mktThuong));
  ok('…thực đơn vẫn đang hiện', await bat('hien_thuc_don') === true);

  // Hai cửa còn lại để đóng form đặt bàn — đổi giá trị và thu hồi — trigger cũ noi_dung_cong_bo_kiem_tra (0010,
  // 0016) đã giữ. Kiểm ở đây để cả ba cửa đứng cạnh nhau: sửa một cửa mà hở cửa khác là lỗi 14/11 lặp lại.
  const doiGiaTri = await duoi(UID.mktA, `update noi_dung_cong_bo set gia_tri_bool = false where khoa = 'form_dat_ban_dang_mo' and trang_thai = 'da_cong_bo' returning khoa`);
  ok('Marketing đổi GIÁ TRỊ của khóa chỉ chủ đã công bố → trigger cũ từ chối', biChan(doiGiaTri, 'Không sửa được giá trị đã công bố. Hãy thu hồi rồi thêm dòng mới.'), ketQua(doiGiaTri));
  const thuHoi = await duoi(UID.mktA, `update noi_dung_cong_bo set trang_thai = 'da_thu_hoi' where khoa = 'form_dat_ban_dang_mo' and trang_thai = 'da_cong_bo' returning khoa`);
  ok('Marketing THU HỒI khóa chỉ chủ → trigger cũ từ chối', biChan(thuHoi, 'Khóa form_dat_ban_dang_mo chỉ chủ sở hữu mới được gỡ khỏi trang'), ketQua(thuHoi));
  ok('…sau cả ba cửa, form đặt bàn vẫn mở với khách', await bat('form_dat_ban_dang_mo') === true);

  const qlThuong = await duoi(UID.qlA, `update noi_dung_cong_bo set hien_den = now() + interval '30 days' where khoa = 'hien_thuc_don' and trang_thai = 'da_cong_bo' returning khoa`);
  ok('Quản lý đặt lịch cho khóa thường (khóa quản lý được công bố và gỡ)', duocMot(qlThuong), ketQua(qlThuong));
  const chu = await duoi(UID.chu, `update noi_dung_cong_bo set hien_den = now() + interval '30 days' where khoa = 'form_dat_ban_dang_mo' and trang_thai = 'da_cong_bo' returning khoa`);
  ok('Chủ đặt lịch cho khóa chỉ chủ', duocMot(chu), ketQua(chu));
  let loi = null;
  try { await db.query(`update noi_dung_cong_bo set hien_tu = null, hien_den = null where trang_thai = 'da_cong_bo'`); } catch (e) { loi = String(e?.message ?? e); }
  ok('Không phiên (SQL Editor) vẫn đổi lịch được', loi === null, loi ?? '');

  // Bản nháp chưa công bố: marketing soạn lịch thoải mái — chỉ dòng đang sống trên trang mới bị giữ.
  const nhap = await duoi(UID.mktA, `insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai, hien_tu) values ('hien_thuc_don', 'bool', false, 'nhap', now()) returning id`);
  const suaNhap = nhap.loi ? nhap : await duoi(UID.mktA, `update noi_dung_cong_bo set hien_tu = now() + interval '1 day' where id = $1 returning id`, [nhap.rows[0].id]);
  ok('Marketing vẫn đặt lịch cho bản NHÁP của mình', duocMot(suaNhap), ketQua(suaNhap));
});

// ===========================================================================
await nhom('4b · Dòng ĐÃ CÔNG BỐ hoặc ĐÃ GỠ: người không được công bố khóa đó không sửa được cột nào', async () => {
  const dongSong = khoa => mot(`select id, ly_do, nguoi_duyet, cong_bo_luc, created_at, gia_tri_bool, hien_tu, hien_den from noi_dung_cong_bo where khoa = $1 and trang_thai = 'da_cong_bo'`, [khoa]);
  const truocChu = await dongSong('form_dat_ban_dang_mo');
  const truocThuong = await dongSong('hien_thuc_don');

  // a) Cột ghi chú và ghi vết của dòng ĐANG CÔNG BỐ.
  for (const [ten, uid, sql, tham] of [
    ['marketing viết lại lý do', UID.mktA, `ly_do = 'marketing ghi đè lý do'`, []],
    ['marketing lùi giờ công bố', UID.mktA, `cong_bo_luc = '2001-01-01'`, []],
    ['marketing ghi tên mình vào ô người duyệt', UID.mktA, `nguoi_duyet = $1`, [nsId[UID.mktA]]],
    ['marketing đổi ngày tạo dòng', UID.mktA, `created_at = '2000-01-01'`, []],
    ['quản lý viết lại lý do', UID.qlA, `ly_do = 'quản lý ghi đè lý do'`, []],
  ]) {
    const r = await duoi(uid, `update noi_dung_cong_bo set ${sql} where khoa = 'form_dat_ban_dang_mo' and trang_thai = 'da_cong_bo' returning khoa`, tham);
    ok(`RÀ SOÁT 14/11 (vòng hai): ${ten} của khóa chỉ chủ đang công bố → bị từ chối`, biChan(r, CAU_SUA_CHU('form_dat_ban_dang_mo')), ketQua(r));
  }
  const mktThuong = await duoi(UID.mktA, `update noi_dung_cong_bo set ly_do = 'ghi chú thêm' where khoa = 'hien_thuc_don' and trang_thai = 'da_cong_bo' returning khoa`);
  ok('RÀ SOÁT 14/11 (vòng hai): marketing viết lại lý do của khóa thường đang công bố → bị từ chối', biChan(mktThuong, CAU_SUA), ketQua(mktThuong));
  ok('…hai dòng đang công bố không đổi một chữ nào',
     JSON.stringify(await dongSong('form_dat_ban_dang_mo')) === JSON.stringify(truocChu) && JSON.stringify(await dongSong('hien_thuc_don')) === JSON.stringify(truocThuong));
  // Đổi lịch vẫn nhận đúng câu về lịch (nhóm 4), kể cả khi kèm cột khác.
  const lichKemLyDo = await duoi(UID.mktA, `update noi_dung_cong_bo set hien_den = now(), ly_do = 'x' where khoa = 'hien_thuc_don' and trang_thai = 'da_cong_bo' returning khoa`);
  ok('Marketing đổi lịch kèm lý do → vẫn câu về lịch hiện', biChan(lichKemLyDo, CAU_LICH), ketQua(lichKemLyDo));

  // b) Người được công bố khóa đó thì sửa được (ghi thêm lý do cho bản đang chạy là việc hợp lệ của họ).
  const qlSua = await duoi(UID.qlA, `update noi_dung_cong_bo set ly_do = 'quản lý ghi thêm' where khoa = 'hien_thuc_don' and trang_thai = 'da_cong_bo' returning khoa`);
  ok('Quản lý ghi lý do cho khóa thường đang công bố → được', duocMot(qlSua), ketQua(qlSua));
  const chuSua = await duoi(UID.chu, `update noi_dung_cong_bo set ly_do = 'chủ ghi thêm' where khoa = 'form_dat_ban_dang_mo' and trang_thai = 'da_cong_bo' returning khoa`);
  ok('Chủ ghi lý do cho khóa chỉ chủ đang công bố → được', duocMot(chuSua), ketQua(chuSua));
  const khongDoi = await duoi(UID.mktA, `update noi_dung_cong_bo set ly_do = ly_do where khoa = 'hien_thuc_don' and trang_thai = 'da_cong_bo' returning khoa`);
  ok('Marketing gửi lại dòng với giá trị KHÔNG đổi → không bị chặn', duocMot(khongDoi), ketQua(khongDoi));
  let loi = null;
  try { await db.query(`update noi_dung_cong_bo set ly_do = 'sửa từ SQL Editor' where khoa = 'hien_thuc_don' and trang_thai = 'da_cong_bo'`); } catch (e) { loi = String(e?.message ?? e); }
  ok('Không phiên (SQL Editor) vẫn sửa được', loi === null, loi ?? '');

  // c) Bản nháp: marketing vẫn soạn và sửa thoải mái — chỉ dòng đã lên trang (đang chạy hoặc đã gỡ) mới bị giữ.
  const nhap = await duoi(UID.mktA, `insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai) values ('hien_thuc_don', 'bool', false, 'nhap') returning id`);
  const suaNhap = nhap.loi ? nhap : await duoi(UID.mktA, `update noi_dung_cong_bo set gia_tri_bool = true, ly_do = 'bản nháp của marketing' where id = $1 returning id`, [nhap.rows[0].id]);
  ok('Marketing vẫn sửa giá trị và lý do của bản NHÁP', duocMot(suaNhap), ketQua(suaNhap));

  // d) Đường chuyển trạng thái giữ nguyên câu cũ của trigger noi_dung_cong_bo_kiem_tra — kể cả khi kèm lý do.
  const mktGo = await duoi(UID.mktA, `select thu_hoi_noi_dung('form_dat_ban_dang_mo', 'marketing muốn gỡ') as kq`);
  ok('Marketing gỡ khóa chỉ chủ kèm lý do (thu_hoi_noi_dung) → vẫn câu cũ "chỉ chủ sở hữu mới được gỡ khỏi trang"',
     biChan(mktGo, 'Khóa form_dat_ban_dang_mo chỉ chủ sở hữu mới được gỡ khỏi trang'), ketQua(mktGo));
  const mktCongBo = await duoi(UID.mktA, `select dat_noi_dung('hien_thuc_don', p_bool => false, p_ly_do => 'marketing tự công bố', p_cong_bo => true) as id`);
  ok('Marketing công bố bản mới của khóa thường (dat_noi_dung) → vẫn câu cũ "Không có quyền gỡ nội dung khỏi trang"',
     biChan(mktCongBo, 'Không có quyền gỡ nội dung khỏi trang'), ketQua(mktCongBo));
  ok('…thực đơn vẫn đang hiện, form đặt bàn vẫn mở', await mot(`select cong_tac_bat('hien_thuc_don') as a, cong_tac_bat('form_dat_ban_dang_mo') as b`).then(r => r.a === true && r.b === true));

  // e) Quản lý công bố bản mới của khóa thường: bước "gỡ bản cũ" bên trong dat_noi_dung (đổi trạng thái kèm lý do) vẫn chạy.
  const idCu = (await dongSong('hien_thuc_don')).id;
  const qlBanMoi = await duoi(UID.qlA, `select dat_noi_dung('hien_thuc_don', p_bool => true, p_ly_do => 'bản mới của quản lý', p_cong_bo => true) as id`);
  const cu = await mot(`select trang_thai, ly_do, thu_hoi_luc is not null as co_gio_go from noi_dung_cong_bo where id = $1`, [idCu]);
  ok('Quản lý công bố bản mới của khóa thường → được; bản cũ thành đã gỡ, có giờ gỡ',
     qlBanMoi.loi === null && cu?.trang_thai === 'da_thu_hoi' && cu.co_gio_go === true && (await dongSong('hien_thuc_don'))?.id === qlBanMoi.rows?.[0]?.id,
     `${ketQua(qlBanMoi)} · bản cũ: ${JSON.stringify(cu)}`);

  // f) Dòng ĐÃ GỠ là sổ ghi vết: người không được công bố khóa đó không đổi được giá trị, lý do hay giờ gỡ.
  for (const [ten, sql] of [['đổi giá trị', `gia_tri_bool = not gia_tri_bool`], ['viết lại lý do', `ly_do = 'đã sửa'`], ['lùi giờ gỡ', `thu_hoi_luc = '2001-01-01'`]]) {
    const r = await duoi(UID.mktA, `update noi_dung_cong_bo set ${sql} where id = $1 returning id`, [idCu]);
    ok(`RÀ SOÁT 14/11 (vòng hai): marketing ${ten} của dòng ĐÃ GỠ → bị từ chối`, biChan(r, CAU_SUA), ketQua(r));
  }
  const sauGo = await mot(`select trang_thai, ly_do, thu_hoi_luc is not null as co_gio_go from noi_dung_cong_bo where id = $1`, [idCu]);
  ok('…dòng đã gỡ không đổi', JSON.stringify(sauGo) === JSON.stringify(cu), JSON.stringify(sauGo));
  const qlSuaGo = await duoi(UID.qlA, `update noi_dung_cong_bo set ly_do = 'quản lý ghi chú thêm cho bản đã gỡ' where id = $1 returning id`, [idCu]);
  ok('Quản lý ghi chú thêm cho dòng đã gỡ của khóa thường → được', duocMot(qlSuaGo), ketQua(qlSuaGo));
  const moLai = await duoi(UID.mktA, `update noi_dung_cong_bo set trang_thai = 'da_cong_bo' where id = $1 returning id`, [idCu]);
  ok('Marketing đưa dòng đã gỡ trở lại trang → vẫn câu cũ "Không chuyển được trạng thái…"', biChan(moLai, 'Không chuyển được trạng thái từ da_thu_hoi sang da_cong_bo'), ketQua(moLai));

  // g) Dòng đã gỡ đổi được cả cột KHÓA (trigger cũ không giữ gì ở dòng đã gỡ), nên quyền phải xét theo CẢ khóa cũ lẫn
  //    khóa mới: quản lý được công bố khóa thường, nhưng không được nhét một dòng vào sổ của khóa chỉ chủ — hay kéo
  //    một dòng ra khỏi sổ đó. Vòng ba 14/11: bản đầu chỉ xét khóa cũ.
  const soCuaChu = () => mot(`select count(*)::int as so from noi_dung_cong_bo where khoa = 'form_dat_ban_dang_mo'`).then(r => r.so);
  const truocSo = await soCuaChu();
  const qlNhet = await duoi(UID.qlA, `update noi_dung_cong_bo set khoa = 'form_dat_ban_dang_mo', ly_do = 'quản lý nhét vào sổ của khóa chỉ chủ' where id = $1 returning id`, [idCu]);
  ok('RÀ SOÁT 14/11 (vòng ba): quản lý chuyển dòng đã gỡ của khóa thường sang khóa CHỈ CHỦ → bị từ chối',
     biChan(qlNhet, CAU_SUA_CHU('form_dat_ban_dang_mo')), ketQua(qlNhet));
  ok('…sổ của khóa chỉ chủ không thêm dòng nào', await soCuaChu() === truocSo, `${truocSo} → ${await soCuaChu()}`);
  // Chủ công bố bản mới của khóa chỉ chủ → bản cũ thành dòng đã gỡ của khóa đó.
  const idChuCu = (await dongSong('form_dat_ban_dang_mo')).id;
  const chuBanMoi = await duoi(UID.chu, `select dat_noi_dung('form_dat_ban_dang_mo', p_bool => true, p_ly_do => 'bản mới của chủ', p_cong_bo => true) as id`);
  ok('Chủ công bố bản mới của khóa chỉ chủ → được; bản cũ thành đã gỡ',
     chuBanMoi.loi === null && (await mot(`select trang_thai from noi_dung_cong_bo where id = $1`, [idChuCu]))?.trang_thai === 'da_thu_hoi', ketQua(chuBanMoi));
  const qlKeo = await duoi(UID.qlA, `update noi_dung_cong_bo set khoa = 'hien_thuc_don' where id = $1 returning id`, [idChuCu]);
  ok('Quản lý kéo dòng đã gỡ của khóa chỉ chủ sang khóa thường → bị từ chối', biChan(qlKeo, CAU_SUA_CHU('form_dat_ban_dang_mo')), ketQua(qlKeo));
  // Không phải "cột khóa bất biến": giữa hai khóa quản lý đều được công bố thì chuyển được, và chủ thì chuyển được cả hai chiều.
  const qlHaiThuong = await duoi(UID.qlA, `update noi_dung_cong_bo set khoa = 'hien_tiec_nhom' where id = $1 returning khoa`, [idCu]);
  ok('Quản lý chuyển dòng đã gỡ giữa hai khóa THƯỜNG → được', duocMot(qlHaiThuong) && qlHaiThuong.rows[0].khoa === 'hien_tiec_nhom', ketQua(qlHaiThuong));
  const chuNhet = await duoi(UID.chu, `update noi_dung_cong_bo set khoa = 'form_dat_ban_dang_mo' where id = $1 returning khoa`, [idCu]);
  ok('Chủ chuyển dòng đã gỡ sang khóa chỉ chủ → được', duocMot(chuNhet) && chuNhet.rows[0].khoa === 'form_dat_ban_dang_mo', ketQua(chuNhet));
});

// ===========================================================================
await nhom('5 · Hai hàm trigger mới không ai gọi thẳng được', async () => {
  const ham = await db.query(
    `select p.proname, has_function_privilege('anon', p.oid, 'execute') as anon,
            has_function_privilege('authenticated', p.oid, 'execute') as dang_nhap, p.proconfig::text as cau_hinh
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname in ('mon_an_kiem_duyet', 'noi_dung_cong_bo_da_len_trang_kiem_tra') order by 1`);
  ok('RÀ SOÁT 14/11: có đủ hai hàm trigger mon_an_kiem_duyet và noi_dung_cong_bo_da_len_trang_kiem_tra', ham.rows.length === 2, JSON.stringify(ham.rows));
  ok('…anon và authenticated không có quyền gọi; đều đặt search_path',
     ham.rows.length === 2 && ham.rows.every(r => !r.anon && !r.dang_nhap && /search_path=public/.test(r.cau_hinh ?? '')), JSON.stringify(ham.rows));
});

process.exit(ketThuc('duyệt giá, cờ món và lịch hiện của nội dung'));
