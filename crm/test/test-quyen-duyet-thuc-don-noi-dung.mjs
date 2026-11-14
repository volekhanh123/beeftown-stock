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
 * Mỗi dòng "RÀ SOÁT 14/11" đỏ trước 0122, xanh từ 0122. Các dòng còn lại giữ những việc hợp lệ vẫn làm được.
 */

import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — DUYỆT GIÁ, CỜ MÓN VÀ LỊCH HIỆN CỦA NỘI DUNG (0122)');
const { db, duoi, nsId } = await dungDatabase();

const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];
const CAU_MON = 'Chỉ chủ nhà hàng hoặc quản lý mới thêm được món, duyệt được giá, mức cay, đổi cờ món sống, có cồn, nhóm và các ô khác ngoài phần chữ, thứ tự, trạng thái và đề xuất của món';
const CAU_LICH_CHU = ma => `Khóa ${ma} chỉ chủ sở hữu mới được đổi lịch hiện trên trang`;
const CAU_LICH = 'Không có quyền đổi lịch hiện của nội dung đã công bố';
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
  // Sửa cột khác của dòng đã công bố mà không đụng lịch: trigger mới không can thiệp (trigger cũ quyết).
  const lyDo = await duoi(UID.mktA, `update noi_dung_cong_bo set ly_do = 'ghi chú thêm' where khoa = 'hien_thuc_don' and trang_thai = 'da_cong_bo' returning khoa`);
  ok('Marketing sửa cột không phải lịch của dòng đã công bố: không bị trigger MỚI chặn', !biChan(lyDo, CAU_LICH) && !biChan(lyDo, 'đổi lịch hiện'), ketQua(lyDo));
});

// ===========================================================================
await nhom('5 · Hai hàm trigger mới không ai gọi thẳng được', async () => {
  const ham = await db.query(
    `select p.proname, has_function_privilege('anon', p.oid, 'execute') as anon,
            has_function_privilege('authenticated', p.oid, 'execute') as dang_nhap, p.proconfig::text as cau_hinh
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname in ('mon_an_kiem_duyet', 'noi_dung_cong_bo_khung_gio_kiem_tra') order by 1`);
  ok('RÀ SOÁT 14/11: có đủ hai hàm trigger mon_an_kiem_duyet và noi_dung_cong_bo_khung_gio_kiem_tra', ham.rows.length === 2, JSON.stringify(ham.rows));
  ok('…anon và authenticated không có quyền gọi; đều đặt search_path',
     ham.rows.length === 2 && ham.rows.every(r => !r.anon && !r.dang_nhap && /search_path=public/.test(r.cau_hinh ?? '')), JSON.stringify(ham.rows));
});

process.exit(ketThuc('duyệt giá, cờ món và lịch hiện của nội dung'));
