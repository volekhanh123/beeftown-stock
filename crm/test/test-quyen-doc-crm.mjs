/**
 * BEEFTOWN CRM — Kiểm thử: policy ĐỌC chỉ cho nhân sự CRM đang làm, và mọi policy tính hàm
 * phân quyền MỘT LẦN cho cả câu truy vấn (migration 0070)
 * ========================================================================================
 *
 *     node test/test-quyen-doc-crm.mjs
 *
 * Rà soát nợ kỹ thuật 11/10/2026:
 *
 *   · Tám policy đọc chỉ kiểm "có đăng nhập" (co_phien_dang_nhap() / auth.uid() is not null —
 *     0007, 0009, 0010, 0011): nhân sự ĐÃ NGHỈ, tài khoản không có dòng nhan_su, thủ kho, tài khoản
 *     máy đọc được nội dung chưa công bố (noi_dung_cong_bo), giá đề xuất của món (mon_an), mẫu tin
 *     Zalo (mau_tin)… Giờ: bốn vai CRM đang làm (đúng những vai mở các trang dùng chúng — Tổng quan
 *     là VAI_CRM, có thu ngân).
 *   · Policy ở 0007, 0009–0013, 0047 gọi duoc_truy_cap_chi_nhanh() / co_vai_tro() / la_chu_so_huu()
 *     MỖI DÒNG — hàm definer SQL không inline được. 5.000 khách: quản lý đếm khach_hang 339–456 ms
 *     (superuser 2–3 ms), v_phan_nhom_khach 756–1.243 ms. Viết lại kiểu kho (0018): hàm không phụ
 *     thuộc dòng bọc trong (select …) — Postgres tính một lần (InitPlan); điều kiện chi nhánh thành
 *     chi_nhanh_id = any((select crm_cn_duoc())::uuid[]).
 *
 * Mục 2 là phép thử TƯƠNG ĐƯƠNG: biểu thức policy cũ (chép nguyên văn từ pg_policies trước 0070,
 * trong CU) và biểu thức mới (đọc từ pg_policies sau 0070) phải cho CÙNG kết quả trên từng dòng của
 * từng bảng, với từng kiểu người — chủ, quản lý hai chi nhánh, thu ngân, marketing, vai kho, đã
 * nghỉ, không có nhan_su, tài khoản máy, không phiên. Chỉ tám policy của mục 1 được đổi nghĩa, và
 * đổi đúng theo SPEC_CRM.
 *
 * Mục 3 là cổng cho lần sau: không policy nào ở schema public gọi hàm phân quyền mà không bọc
 * (select …), và không policy nào gọi duoc_truy_cap_chi_nhanh() / kho_duoc() (tham số là cột của
 * dòng — bọc cũng vẫn chạy mỗi dòng).
 *
 * Storage (policy noi_bo_nhan_su_xem của kho file beeftown-noi-bo): PGlite không có schema storage —
 * thử tay trên project Beeftown-thu (các bước ở đầu 0070 và trong mô tả PR).
 */

import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — POLICY ĐỌC ĐÚNG NGƯỜI, TÍNH MỘT LẦN (0070)');
const { db, cnA, cnB, nsId, duoi } = await dungDatabase();

const UID_LA = '00000000-0000-4000-8000-0000000000aa';
const UID_TN_NGHI = '00000000-0000-4000-8000-0000000000ac';
const UID_MAY_ZALO = '00000000-0000-4000-8000-0000000000e1';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam) values
                ($1, $2, 'Thu ngân đã nghỉ', 'thu_ngan', false),
                ($3, $2, 'Máy Zalo', 'may_zalo', true)`, [UID_TN_NGHI, cnA.id, UID_MAY_ZALO]);

const vi = r => (r.loi ? `${r.ma}: ${r.loi}` : 'CHẠY ĐƯỢC');

/** Mọi kiểu người. uid null = có vai authenticated nhưng không phiên (auth.uid() null). */
const MOI_NGUOI = [
  ['Chủ sở hữu', UID.chu], ['Quản lý Q1', UID.qlA], ['Thu ngân Q1', UID.thuNganA], ['Marketing Q1', UID.mktA],
  ['Quản lý Q7', UID.qlB], ['Thủ kho Q1', UID.thuKhoA], ['NV quầy Q1', UID.nvQuayA], ['Kế toán Q1', UID.keToanA],
  ['Thủ kho đã nghỉ', UID.nghiViec], ['Thu ngân đã nghỉ', UID_TN_NGHI], ['Tài khoản không có nhan_su', UID_LA],
  ['Máy Zalo', UID_MAY_ZALO], ['Không phiên', null],
];
const CRM = new Set([UID.chu, UID.qlA, UID.thuNganA, UID.mktA, UID.qlB]);

// ---------------------------------------------------------------------------
// Dữ liệu ở cả hai chi nhánh cho mọi bảng có policy
// ---------------------------------------------------------------------------
for (const cn of [cnA, cnB]) {
  await db.query(`insert into cau_hinh_tich_diem (chi_nhanh_id, dang_bat) values ($1, true)`, [cn.id]);
  await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1, 'B01', 4), ($1, 'B02', 4)`, [cn.id]);
}
const khach = {};
for (const [cn, sdt] of [[cnA, '0901000001'], [cnA, '0901000002'], [cnB, '0907000001'], [cnB, '0907000002']]) {
  const { rows: [g] } = await db.query(`select * from ghi_luot_ghe($1, $2, 300000::bigint)`, [cn.id, sdt]);
  khach[sdt] = g.khach_hang_id;
  await db.query(`insert into nhat_ky_dong_y (khach_hang_id, dong_y, kenh, noi_dung) values ($1, true, 'quay', 'đồng ý')`, [g.khach_hang_id]);
}
// Khách chỉ đặt bàn (chưa ghé) ở Q7, và một khách mồ côi.
const { rows: [kDat] } = await db.query(`select * from tim_hoac_tao_khach('0907000009', 'Khách đặt bàn Q7')`);
await db.query(`insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach) values ($1, $2, hom_nay_vn() + 3, '19:00', 2),
                ($3, $4, hom_nay_vn() + 3, '19:00', 2)`, [cnB.id, kDat.id, cnA.id, khach['0901000001']]);
await db.query(`select * from tim_hoac_tao_khach('0988000000', 'Khách mồ côi')`);
const { rows: [m4] } = await db.query(`select id from mau_tin where ma = 'ZBS-04'`);
for (const cn of [cnA, cnB]) {
  const { rows: [cd] } = await db.query(`insert into chien_dich (chi_nhanh_id, mau_tin_id, ten) values ($1, $2, 'Chiến dịch') returning id`, [cn.id, m4.id]);
  await db.query(`insert into nhat_ky_tin (chi_nhanh_id, khach_hang_id, mau_tin_id, chien_dich_id, sdt_gui, noi_dung, ket_qua)
                  values ($1, $2, $3, $4, '0900000000', 'x', 'da_gui')`,
                 [cn.id, cn === cnA ? khach['0901000001'] : khach['0907000001'], m4.id, cd.id]);
  await db.query(`select tao_tin_tuyen_dung_mau($1)`, [cn.id]);
  await db.query(`insert into su_kien_web (loai, chi_nhanh_id) values ('xem_trang', $1)`, [cn.id]);
}
// Mã vị trí là duy nhất toàn hệ thống: tin mẫu chỉ vào Q1 — thêm một tin cho Q7.
await db.query(`insert into vi_tri_tuyen_dung (chi_nhanh_id, ma, ten_vi, bo_phan, loai_hop_dong)
                values ($1, 'q7-bep', 'Bếp Q7', 'bep', 'toan_thoi_gian')`, [cnB.id]);
for (const cn of [cnA, cnB]) {
  const { rows: [vt] } = await db.query(`select id from vi_tri_tuyen_dung where chi_nhanh_id = $1 limit 1`, [cn.id]);
  const { rows: [hs] } = await db.query(`insert into ho_so_ung_tuyen (ma_ho_so, vi_tri_id, chi_nhanh_id, dong_y_noi_dung, luu_den, ho_ten, sdt)
                                          values ($1, $2, $3, 'đồng ý', hom_nay_vn() + 180, 'Ứng viên', '0912000000') returning id`,
                                         [`HS-${cn.ma}`, vt.id, cn.id]);
  await db.query(`insert into nhat_ky_ho_so (ho_so_id, den_trang_thai) values ($1, 'dang_xem')`, [hs.id]);
}
await db.query(`insert into phieu_tai_len (het_han) values (now() + interval '1 hour')`);
await db.query(`insert into nhat_ky_tra_cuu (ip, ma_thu, thanh_cong) values ('1.2.3.4', 'ABC123', false)`);
await db.query(`insert into tep_anh (bucket, duong_dan, loai, nguon_that)
                values ('beeftown-noi-bo', 'thu/anh.jpg', enum_first(null::loai_tep), enum_first(null::anh_thuc_te))`);
await db.query(`insert into phien_ban_thuc_don (ma, ngay_hieu_luc) values ('v-thu', hom_nay_vn())`);
// Hai dữ kiện nháp (chưa công bố) — đúng thứ không được lộ cho người đã nghỉ / vai kho. Hỏng thì ném: bảng
// thiếu dòng làm phép thử của mục 1–2 thành rỗng.
await db.query(`insert into noi_dung_cong_bo (khoa, kieu, gia_tri_text)
                select khoa, kieu, 'nháp chưa công bố' from khoa_cong_bo
                where kieu = 'van_ban' and khoa in ('dia_chi_hien_thi', 'dong_trang_thai')`);

/** Đặt phiên của một người để chạy biểu thức policy bằng superuser (không RLS). */
async function datPhien(uid) {
  await db.query(`delete from auth._phien`);
  if (uid) await db.query(`insert into auth._phien (uid) values ($1)`, [uid]);
}

// ===========================================================================
// Biểu thức policy TRƯỚC 0070 — chép nguyên văn pg_policies (bỏ xuống dòng). [USING, WITH CHECK]
// ===========================================================================
const CU = {
  'ban_an.ban_an_doc': ["duoc_truy_cap_chi_nhanh(chi_nhanh_id)", null],
  'ban_an.ban_an_sua': ["(duoc_truy_cap_chi_nhanh(chi_nhanh_id) AND co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro]))", null],
  'cau_hinh_tich_diem.cau_hinh_doc': ["duoc_truy_cap_chi_nhanh(chi_nhanh_id)", null],
  'cau_hinh_tich_diem.cau_hinh_sua': ["la_chu_so_huu()", "la_chu_so_huu()"],
  'chi_nhanh.chi_nhanh_doc': ["duoc_truy_cap_chi_nhanh(id)", null],
  'chi_nhanh.chi_nhanh_sua': ["la_chu_so_huu()", "la_chu_so_huu()"],
  'chien_dich.chien_dich_doc': ["duoc_truy_cap_chi_nhanh(chi_nhanh_id)", null],
  'chien_dich.chien_dich_sua': ["(duoc_truy_cap_chi_nhanh(chi_nhanh_id) AND co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro, 'marketing'::vai_tro]))", null],
  'dat_ban.dat_ban_doc': ["duoc_truy_cap_chi_nhanh(chi_nhanh_id)", null],
  'dat_ban.dat_ban_sua': ["duoc_truy_cap_chi_nhanh(chi_nhanh_id)", null],
  'dat_ban.dat_ban_them': [null, "duoc_truy_cap_chi_nhanh(chi_nhanh_id)"],
  'ho_so_ung_tuyen.ho_so_doc': ["(duoc_truy_cap_chi_nhanh(chi_nhanh_id) AND co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro]))", null],
  'ho_so_ung_tuyen.ho_so_sua': ["(duoc_truy_cap_chi_nhanh(chi_nhanh_id) AND co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro]))", null],
  'khach_hang.khach_hang_doc': ["(la_chu_so_huu() OR (EXISTS ( SELECT 1 FROM luot_ghe lg WHERE ((lg.khach_hang_id = khach_hang.id) AND duoc_truy_cap_chi_nhanh(lg.chi_nhanh_id)))) OR (EXISTS ( SELECT 1 FROM dat_ban db WHERE ((db.khach_hang_id = khach_hang.id) AND duoc_truy_cap_chi_nhanh(db.chi_nhanh_id)))))", null],
  'khoa_cong_bo.khoa_cong_bo_doc': ["co_phien_dang_nhap()", null],
  'khoa_cong_bo.khoa_cong_bo_sua': ["la_chu_so_huu()", "la_chu_so_huu()"],
  'khung_anh.khung_anh_doc': ["co_phien_dang_nhap()", null],
  'khung_anh.khung_anh_sua': ["la_chu_so_huu()", "la_chu_so_huu()"],
  'luot_ghe.luot_ghe_doc': ["duoc_truy_cap_chi_nhanh(chi_nhanh_id)", null],
  'mau_tin.mau_tin_doc': ["(auth.uid() IS NOT NULL)", null],
  'mau_tin.mau_tin_sua': ["la_chu_so_huu()", "la_chu_so_huu()"],
  'mon_an.mon_an_doc': ["co_phien_dang_nhap()", null],
  'mon_an.mon_an_sua': ["co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro, 'marketing'::vai_tro])", null],
  'mon_an.mon_an_them': [null, "co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro, 'marketing'::vai_tro])"],
  'nhan_su.nhan_su_doc': ["(la_chu_so_huu() OR (auth_uid = auth.uid()) OR duoc_truy_cap_chi_nhanh(chi_nhanh_id))", null],
  'nhan_su.nhan_su_sua': ["la_chu_so_huu()", "la_chu_so_huu()"],
  'nhat_ky_dong_y.dong_y_doc': ["(la_chu_so_huu() OR (EXISTS ( SELECT 1 FROM khach_hang kh WHERE (kh.id = nhat_ky_dong_y.khach_hang_id))))", null],
  'nhat_ky_ho_so.nhat_ky_ho_so_doc': ["(EXISTS ( SELECT 1 FROM ho_so_ung_tuyen h WHERE (h.id = nhat_ky_ho_so.ho_so_id)))", null],
  'nhat_ky_ho_so.nhat_ky_ho_so_them': [null, "false"],
  'nhat_ky_tin.nhat_ky_tin_doc': ["duoc_truy_cap_chi_nhanh(chi_nhanh_id)", null],
  'nhat_ky_tra_cuu.nhat_ky_tra_cuu_doc': ["co_vai_tro(ARRAY['chu_so_huu'::vai_tro])", null],
  'nhom_mon.nhom_mon_doc': ["co_phien_dang_nhap()", null],
  'nhom_mon.nhom_mon_sua': ["co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro])", "co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro])"],
  'noi_dung_cong_bo.noi_dung_doc': ["co_phien_dang_nhap()", null],
  'noi_dung_cong_bo.noi_dung_sua': ["co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro, 'marketing'::vai_tro])", null],
  'noi_dung_cong_bo.noi_dung_them': [null, "(co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro, 'marketing'::vai_tro]) AND (trang_thai = 'nhap'::trang_thai_cong_bo))"],
  'noi_dung_cong_bo.noi_dung_xoa': ["((trang_thai = 'nhap'::trang_thai_cong_bo) AND co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro, 'marketing'::vai_tro]))", null],
  'phien_ban_thuc_don.phien_ban_doc': ["co_phien_dang_nhap()", null],
  'phien_ban_thuc_don.phien_ban_sua': ["co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro])", "co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro])"],
  'phieu_tai_len.phieu_tai_len_doc': ["co_vai_tro(ARRAY['chu_so_huu'::vai_tro])", null],
  'so_cai_diem.so_cai_doc': ["duoc_truy_cap_chi_nhanh(chi_nhanh_id)", null],
  'su_kien_web.su_kien_web_doc': ["co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro, 'marketing'::vai_tro])", null],
  'tep_anh.tep_anh_doc': ["co_phien_dang_nhap()", null],
  'tep_anh.tep_anh_sua': ["co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro, 'marketing'::vai_tro])", null],
  'tep_anh.tep_anh_them': [null, "co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro, 'marketing'::vai_tro])"],
  'vi_tri_tuyen_dung.vi_tri_doc': ["duoc_truy_cap_chi_nhanh(chi_nhanh_id)", null],
  'vi_tri_tuyen_dung.vi_tri_sua': ["(duoc_truy_cap_chi_nhanh(chi_nhanh_id) AND co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro, 'marketing'::vai_tro]))", null],
  'vi_tri_tuyen_dung.vi_tri_them': [null, "(duoc_truy_cap_chi_nhanh(chi_nhanh_id) AND co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro, 'marketing'::vai_tro]))"],
  'zalo_cau_hinh.zalo_cau_hinh_doc': ["la_chu_so_huu()", null],
};

/** Tám policy đọc của mục 1: nghĩa MỚI có chủ đích — bốn vai CRM đang làm. */
const SPEC_CRM = "co_vai_tro(ARRAY['chu_so_huu'::vai_tro, 'quan_ly'::vai_tro, 'thu_ngan'::vai_tro, 'marketing'::vai_tro])";
const DOI_NGHIA = ['khoa_cong_bo.khoa_cong_bo_doc', 'khung_anh.khung_anh_doc', 'mau_tin.mau_tin_doc', 'mon_an.mon_an_doc',
                   'nhom_mon.nhom_mon_doc', 'noi_dung_cong_bo.noi_dung_doc', 'phien_ban_thuc_don.phien_ban_doc', 'tep_anh.tep_anh_doc'];

const { rows: MOI_PL } = await db.query(`
  select tablename || '.' || policyname as ten, tablename, qual, with_check
  from pg_policies where schemaname = 'public' and tablename !~ '^kho_' and policyname <> 'chi_nhanh_doc_kho'`);

// ===========================================================================
await nhom('1 · TÁM BẢNG NỘI DUNG — chỉ bốn vai CRM đang làm đọc được', async () => {
  const BANG = ['khoa_cong_bo', 'khung_anh', 'mau_tin', 'mon_an', 'nhom_mon', 'noi_dung_cong_bo', 'phien_ban_thuc_don', 'tep_anh'];
  for (const bang of BANG) {
    const { rows: [{ n: tong }] } = await db.query(`select count(*)::int n from ${bang}`);
    const sai = [];
    for (const [ai, uid] of MOI_NGUOI) {
      if (uid === null) continue;
      const r = await duoi(uid, `select count(*)::int n from ${bang}`);
      const thay = r.loi ? -1 : r.rows[0].n;
      const phai = CRM.has(uid) ? tong : 0;
      if (thay !== phai) sai.push(`${ai}: thấy ${thay}/${tong}, phải ${phai}`);
    }
    ok(`${bang} (${tong} dòng): chủ, quản lý, thu ngân, marketing thấy đủ; đã nghỉ, không nhan_su, vai kho, máy thấy 0`,
       tong > 0 && sai.length === 0, sai.join(' · ') || `${tong} dòng`);
    if (bang === 'noi_dung_cong_bo') ok('…kể cả dữ kiện NHÁP chưa công bố (2 dòng thêm ở đầu bài)', tong >= 3, `${tong} dòng`);
  }

  // Trang Tổng quan (VAI_CRM, có thu ngân) đọc ba view này: thu ngân phải thấy như chủ — không thì
  // dòng việc "còn thiếu" thành xanh giả.
  for (const view of ['v_cong_bo_con_thieu', 'v_anh_con_thieu', 'v_mon_con_vuong']) {
    const chu = await duoi(UID.chu, `select count(*)::int n from ${view}`);
    const tn = await duoi(UID.thuNganA, `select count(*)::int n from ${view}`);
    const kho = await duoi(UID.thuKhoA, `select count(*)::int n from ${view}`);
    ok(`${view}: thu ngân thấy đúng như chủ (${chu.rows?.[0]?.n}); thủ kho thấy 0`,
       chu.loi === null && tn.loi === null && chu.rows[0].n > 0 && tn.rows[0].n === chu.rows[0].n && kho.rows?.[0]?.n === 0,
       `${vi(chu)} · thu ngân ${tn.rows?.[0]?.n} · thủ kho ${kho.rows?.[0]?.n}`);
  }
});

// ===========================================================================
await nhom('2 · TƯƠNG ĐƯƠNG — biểu thức mới cho cùng kết quả như biểu thức cũ, từng dòng, từng người', async () => {
  const moi = new Map(MOI_PL.map(p => [p.ten, p]));
  ok(`Đủ ${Object.keys(CU).length} policy, không thêm không bớt`,
     moi.size === Object.keys(CU).length && Object.keys(CU).every(t => moi.has(t)),
     `thiếu: ${Object.keys(CU).filter(t => !moi.has(t)).join(', ')} · thừa: ${[...moi.keys()].filter(t => !(t in CU)).join(', ')}`);

  for (const [ten, [dung, kiem]] of Object.entries(CU)) {
    const p = moi.get(ten);
    if (!p) continue;
    const bang = p.tablename;
    const doiNghia = DOI_NGHIA.includes(ten);
    const sai = [];
    for (const [phan, cu, bieuThucMoi] of [['USING', dung, p.qual], ['WITH CHECK', kiem, p.with_check]]) {
      if ((cu === null) !== (bieuThucMoi === null)) { sai.push(`${phan} ${cu === null ? 'thừa' : 'mất'}`); continue; }
      if (cu === null) continue;
      const chuan = doiNghia ? SPEC_CRM : cu;
      for (const [ai, uid] of MOI_NGUOI) {
        await datPhien(uid);
        const { rows: [{ n }] } = await db.query(
          // coalesce: với policy, NULL = không cho (như false) — vd. dòng của chủ sở hữu có chi_nhanh_id null.
          `select count(*)::int n from ${bang} where coalesce((${chuan}), false) is distinct from coalesce((${bieuThucMoi}), false)`);
        if (n > 0) sai.push(`${phan} · ${ai}: ${n} dòng khác`);
      }
    }
    await datPhien(null);
    const { rows: [{ n: soDong }] } = await db.query(`select count(*)::int n from ${bang}`);
    ok(`${ten}${doiNghia ? ' (đổi nghĩa có chủ đích → bốn vai CRM)' : ''}: giống từng dòng với ${MOI_NGUOI.length} kiểu người (${soDong} dòng)`,
       soDong > 0 && sai.length === 0, sai.slice(0, 4).join(' · ') || 'bảng rỗng — phép thử rỗng');
  }

  // Thêm một lớp: đếm thật dưới RLS (policy + RLS lồng của bảng con) khớp đếm bằng biểu thức cũ.
  const DEM = {
    khach_hang: CU['khach_hang.khach_hang_doc'][0], luot_ghe: CU['luot_ghe.luot_ghe_doc'][0],
    dat_ban: CU['dat_ban.dat_ban_doc'][0], nhan_su: CU['nhan_su.nhan_su_doc'][0],
    // chi_nhanh còn policy chi_nhanh_doc_kho (vai kho thấy chi nhánh của mình, 0018) — hai policy OR với nhau.
    chi_nhanh: `(${CU['chi_nhanh.chi_nhanh_doc'][0]} OR id = any(kho_cn_duoc('xem')))`,
  };
  for (const [bang, cu] of Object.entries(DEM)) {
    const sai = [];
    for (const [ai, uid] of MOI_NGUOI) {
      if (uid === null) continue;
      await datPhien(uid);
      const { rows: [{ n: phai }] } = await db.query(`select count(*)::int n from ${bang} where ${cu}`);
      await datPhien(null);
      const r = await duoi(uid, `select count(*)::int n from ${bang}`);
      if (r.loi || r.rows[0].n !== phai) sai.push(`${ai}: ${r.loi ?? r.rows[0].n} ≠ ${phai}`);
    }
    ok(`${bang}: số dòng mỗi người thấy qua RLS = số dòng biểu thức cũ cho`, sai.length === 0, sai.join(' · '));
  }
});

// ===========================================================================
await nhom('3 · CỔNG — không policy nào gọi hàm phân quyền mỗi dòng', async () => {
  const HAM = ['duoc_truy_cap_chi_nhanh', 'co_vai_tro', 'la_chu_so_huu', 'co_phien_dang_nhap', 'nhan_su_hien_tai',
               'la_nhan_su_ngoai_crm', 'crm_cn_duoc', 'kho_co_quyen', 'kho_cn_duoc', 'kho_duoc', 'auth.uid'];
  const { rows } = await db.query(`select tablename || '.' || policyname as ten, coalesce(qual, '') || ' ' || coalesce(with_check, '') as bt
                                   from pg_policies where schemaname = 'public'`);
  const moiDong = [], theoDong = [];
  for (const { ten, bt } of rows) {
    for (const h of HAM) {
      for (const m of bt.matchAll(new RegExp(`(?<![\\w.])${h.replace('.', '\\.')}\\(`, 'g'))) {
        if (!/SELECT \(?$/i.test(bt.slice(Math.max(0, m.index - 8), m.index))) moiDong.push(`${ten}: ${h}()`);
      }
    }
    if (/\b(duoc_truy_cap_chi_nhanh|kho_duoc)\(/.test(bt)) theoDong.push(ten);
  }
  ok(`${rows.length} policy: mọi lời gọi hàm phân quyền đều bọc (select …) — Postgres tính một lần`,
     moiDong.length === 0, `${moiDong.length} chỗ: ${moiDong.slice(0, 8).join(', ')}`);
  ok('Không policy nào gọi duoc_truy_cap_chi_nhanh() / kho_duoc() (tham số theo dòng) — dùng crm_cn_duoc() / kho_cn_duoc()',
     theoDong.length === 0, theoDong.join(', '));

  // crm_cn_duoc() trả đúng tập mà duoc_truy_cap_chi_nhanh() trả lời "có", với từng người.
  const sai = [];
  for (const [ai, uid] of MOI_NGUOI) {
    await datPhien(uid);
    const { rows: [r] } = await db.query(`
      select coalesce(array_agg(id order by id) filter (where duoc_truy_cap_chi_nhanh(id)), '{}') as cu,
             (select coalesce(array_agg(x order by x), '{}') from unnest(crm_cn_duoc()) x) as moi
      from chi_nhanh`);
    if (JSON.stringify(r.cu) !== JSON.stringify(r.moi)) sai.push(`${ai}: ${JSON.stringify(r.cu)} ≠ ${JSON.stringify(r.moi)}`);
  }
  await datPhien(null);
  ok('crm_cn_duoc() = đúng các chi nhánh duoc_truy_cap_chi_nhanh() cho, với từng kiểu người', sai.length === 0, sai.join(' · '));
});

// ===========================================================================
await nhom('4 · ĐO — 5.000 khách, quản lý đếm khách và nhóm khách', async () => {
  await db.query(`insert into khach_hang (sdt, ho_ten, chi_nhanh_dau_tien)
                  select '096' || lpad(i::text, 7, '0'), 'Khách ' || i, case when i % 2 = 0 then $1::uuid else $2::uuid end
                  from generate_series(1, 5000) i`, [cnA.id, cnB.id]);
  await db.query(`insert into luot_ghe (chi_nhanh_id, khach_hang_id, tong_hoa_don)
                  select chi_nhanh_dau_tien, id, 300000 from khach_hang where sdt like '096%'`);
  await db.query('analyze');
  const doThoiGian = async (uid, sql) => {
    let tot = Infinity, r = null;
    for (let i = 0; i < 3; i++) {
      const t0 = performance.now();
      r = await duoi(uid, sql);
      tot = Math.min(tot, performance.now() - t0);
    }
    return { ms: Math.round(tot), n: r.rows?.[0]?.n, loi: r.loi };
  };
  const { rows: [{ n: phaiQ1 }] } = await db.query(
    `select count(distinct khach_hang_id)::int n from (select khach_hang_id from luot_ghe where chi_nhanh_id = $1
     union select khach_hang_id from dat_ban where chi_nhanh_id = $1) x`, [cnA.id]);
  const kh = await doThoiGian(UID.qlA, `select count(*)::int n from khach_hang`);
  const nhomKh = await doThoiGian(UID.qlA, `select count(*)::int n from v_phan_nhom_khach`);
  const luot = await doThoiGian(UID.qlA, `select count(*)::int n from luot_ghe`);
  console.log(`    (quản lý Q1: khach_hang ${kh.ms} ms · v_phan_nhom_khach ${nhomKh.ms} ms · luot_ghe ${luot.ms} ms — trước 0070 trên máy viết test: 339 / 756 / 134 ms)`);
  ok(`Quản lý Q1 đếm khach_hang: đúng ${phaiQ1} khách của Q1`, kh.loi === null && kh.n === phaiQ1, `${kh.loi ?? kh.n}`);
  ok('…v_phan_nhom_khach cùng số khách', nhomKh.loi === null && nhomKh.n === phaiQ1, `${nhomKh.loi ?? nhomKh.n}`);
  // Ngưỡng rộng (gấp vài lần số đo sau 0070) để máy CI chậm không đỏ oan; bản cũ vượt xa cả ngưỡng này.
  ok(`Đếm khach_hang dưới 150 ms (${kh.ms} ms)`, kh.ms < 150);
  ok(`Đếm v_phan_nhom_khach dưới 400 ms (${nhomKh.ms} ms)`, nhomKh.ms < 400);
});

process.exit(ketThuc('POLICY ĐỌC CRM'));
