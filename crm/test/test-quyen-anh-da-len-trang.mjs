/**
 * BEEFTOWN CRM — Kiểm thử: ảnh của nội dung đã lên trang chỉ người được công bố khóa đó mới sửa được (0124)
 * =========================================================================================================
 *
 *     node test/test-quyen-anh-da-len-trang.mjs
 *
 * Vòng bốn rà soát của 0122 (PR #188) ghi một chỗ ngoài phạm vi PR đó. Nội dung kiểu ảnh — khóa anh_chia_se, ảnh
 * og:image của trang công khai — trỏ tới một dòng tep_anh qua gia_tri_tep_id. Trigger của 0010 / 0122 khóa CỘT
 * gia_tri_tep_id của dòng đã công bố, nhưng noi_dung_cong_khai() đọc thẳng DÒNG tep_anh được trỏ tới (đường dẫn, kho,
 * mô tả thay thế, chú thích, nguồn ảnh, kích thước), mà policy tep_anh_sua (0009, 0070) cho chủ, quản lý và marketing
 * sửa mọi cột của mọi dòng tep_anh. Tức là đổi được ảnh khách thấy mà không qua dat_noi_dung / thu_hoi_noi_dung.
 *
 * Mỗi dòng "RÀ SOÁT VÒNG BỐN" đỏ trước 0124, xanh từ 0124. Các dòng còn lại giữ những việc hợp lệ vẫn làm được:
 * marketing tải ảnh mới và gắn vào bản nháp; chủ / quản lý thay ảnh bằng đường công bố bản mới.
 */

import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — ẢNH CỦA NỘI DUNG ĐÃ LÊN TRANG (0124)');
const { db, cnA, nsId, duoi, duoiAnon } = await dungDatabase();

const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];
const CAU_CHU = ma => `Khóa ${ma} chỉ chủ sở hữu mới được sửa ảnh của nội dung đã công bố hoặc đã gỡ`;
const CAU = 'Không có quyền sửa ảnh của nội dung đã công bố hoặc đã gỡ';
const ketQua = r => (r.loi ? `LỖI ${r.ma ?? ''}: ${r.loi.slice(0, 150)}` : `${r.rows.length} dòng ${JSON.stringify(r.rows).slice(0, 120)}`);
// Câu đúng VÀ mã insufficient_privilege (42501) — màn hình nội bộ dịch câu theo chữ, PostgREST trả 403 theo mã.
const biChan = (r, cau) => typeof r.loi === 'string' && r.loi.includes(cau) && r.ma === '42501';
const duocMot = r => r.loi === null && r.rows.length === 1;
const khongDong = r => r.loi === null && r.rows.length === 0;
const loiKhongPhien = async (sql, p = []) => {
  try { await db.query(sql, p); return null; } catch (e) { return String(e?.message ?? e); }
};

// Hai kiểu người khung dùng chung chưa có: marketing đã nghỉ, tài khoản đăng nhập không có dòng nhân sự.
const UID_MKT_NGHI = '00000000-0000-4000-8000-0000000000c1';
const UID_LA = '00000000-0000-4000-8000-0000000000c2';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam)
                values ($1, $2, 'Marketing đã nghỉ', 'marketing', false)`, [UID_MKT_NGHI, cnA.id]);

// Ảnh tải lên như ngoài đời: Supabase Studio (không phiên), đúng khung ảnh chia sẻ 1200 × 630, ảnh thật.
const taoAnh = async ten => (await mot(
  `insert into tep_anh (bucket, duong_dan, khung_ma, loai, nguon_that, alt_vi, rong, cao, trang_thai)
   values ('beeftown-cong-khai', $1, 'og-chia-se', 'chia_se', 'anh_that', $2, 1200, 630, 'da_cong_bo') returning id`,
  [`chia-se/${ten}.png`, `Mặt tiền Beeftown, ảnh ${ten}`])).id;
/** Thứ khách thấy: khóa anh_chia_se của noi_dung_cong_khai() ở cả ba thứ tiếng. */
const trang = async (khoa = 'anh_chia_se') => JSON.stringify(await Promise.all(['vi', 'en', 'ko'].map(nn =>
  mot(`select noi_dung_cong_khai($1) -> $2 as a`, [nn, khoa]).then(r => r.a))));
const urlTrenTrang = async () => (await mot(`select noi_dung_cong_khai('vi') -> 'anh_chia_se' ->> 'url' as u`)).u;
/** Cả dòng ảnh trừ updated_at (trigger tep_anh_updated_at ghi giờ thật mỗi lần update, kể cả update không đổi gì). */
const dongAnh = id => mot(`select to_jsonb(t) - 'updated_at' as d from tep_anh t where id = $1`, [id]).then(r => JSON.stringify(r?.d));
/** Một mục cho ghi_ban_dich (máy dịch) — bam là bam_nguon của câu gốc hiện tại, như lib/ban-dich.ts gửi. */
const mucDich = async (id, ngonNgu, noiDung) => {
  const { b } = await mot(`select bam_nguon(alt_vi) as b from tep_anh where id = $1`, [id]);
  return JSON.stringify([{ cot: 'alt', ngon_ngu: ngonNgu, bam: b, tt: 'ok', noi_dung: noiDung }]);
};
const suaAlt = (uid, id, chu) => duoi(uid, `update tep_anh set alt_vi = $2 where id = $1 returning id`, [id, chu]);

const anhA = await taoAnh('a');
let anhB = null;

// ===========================================================================
await nhom('1 · Tiền đề: quản lý công bố ảnh chia sẻ; trang công khai đọc thẳng dòng tep_anh được trỏ tới', async () => {
  const k = await mot(`select kieu, chi_chu_so_huu from khoa_cong_bo where khoa = 'anh_chia_se'`);
  ok('anh_chia_se là khóa kiểu ảnh, khóa thường (chủ hoặc quản lý công bố)', k?.kieu === 'tep' && k.chi_chu_so_huu === false, JSON.stringify(k));
  const cb = await duoi(UID.qlA, `select dat_noi_dung('anh_chia_se', p_tep_id => $1, p_ly_do => 'Ảnh chia sẻ đầu tiên', p_cong_bo => true) as id`, [anhA]);
  ok('Quản lý công bố ảnh chia sẻ qua dat_noi_dung (đường của màn Nội dung)', cb.loi === null, ketQua(cb));
  const a = (await mot(`select noi_dung_cong_khai('vi') -> 'anh_chia_se' as a`)).a;
  ok('Trang công khai trả đúng ảnh vừa công bố: đường dẫn, kho, nguồn, mô tả thay thế, kích thước',
     a?.url === 'chia-se/a.png' && a.bucket === 'beeftown-cong-khai' && a.nguon === 'anh_that'
       && a.alt === 'Mặt tiền Beeftown, ảnh a' && a.rong === 1200 && a.cao === 630, JSON.stringify(a));
});

// ===========================================================================
await nhom('2 · Ảnh ĐANG CÔNG BỐ: marketing gọi thẳng database không đổi được thứ khách thấy', async () => {
  const truocTrang = await trang();
  const truocDong = await dongAnh(anhA);

  for (const [ten, cau, them] of [
    ['trỏ ảnh sang một file khác', `duong_dan = 'chia-se/khac.png'`, []],
    ['chuyển ảnh sang kho khác', `bucket = 'beeftown-noi-bo'`, []],
    ['khai lại nguồn ảnh (ảnh thật thành ảnh minh họa)', `nguon_that = 'anh_minh_hoa', chu_thich = 'Ảnh minh họa, không chụp tại Beeftown'`, []],
    ['viết lại mô tả thay thế', `alt_vi = 'Mô tả khác'`, []],
    ['viết bản tiếng Anh và tiếng Hàn của mô tả thay thế', `alt_en = 'Another description', alt_ko = '다른 설명'`, []],
    ['viết chú thích tiếng Anh và tiếng Hàn', `chu_thich_en = 'A caption', chu_thich_ko = '캡션'`, []],
    ['đổi kích thước khai cho thẻ chia sẻ', `rong = 4000, cao = 4000`, []],
    ['bỏ khung ảnh, đổi loại ảnh', `khung_ma = null, loai = 'noi_bo'`, []],
    ['đổi trạng thái của dòng ảnh', `trang_thai = 'da_thu_hoi'`, []],
    ['ghi tên mình vào ô người duyệt ảnh', `nguoi_duyet = $2`, [nsId[UID.mktA]]],
    ['đánh dấu bản dịch "bị chặn" trong sổ bản dịch (trang tiếng Anh thôi dịch)', `ban_dich = '{"alt": {"en": {"cach": "may", "tt": "bi_chan", "ly_do": "x"}}}'::jsonb`, []],
    ['lùi giờ công bố và ngày tạo của ảnh', `cong_bo_luc = '2001-01-01', created_at = '2001-01-01'`, []],
  ]) {
    const r = await duoi(UID.mktA, `update tep_anh set ${cau} where id = $1 returning id`, [anhA, ...them]);
    ok(`RÀ SOÁT VÒNG BỐN: marketing ${ten} của ảnh đang công bố → bị từ chối`, biChan(r, CAU), ketQua(r));
  }

  // PostgREST upsert (Prefer: resolution=merge-duplicates) là insert … on conflict do update: cùng trigger update.
  const upsert = await duoi(UID.mktA,
    `insert into tep_anh (id, bucket, duong_dan, loai, nguon_that, alt_vi) values ($1, 'beeftown-cong-khai', 'chia-se/upsert.png', 'chia_se', 'anh_that', 'x')
     on conflict (id) do update set duong_dan = excluded.duong_dan returning id`, [anhA]);
  ok('RÀ SOÁT VÒNG BỐN: marketing ghi đè ảnh đang công bố bằng upsert → bị từ chối', biChan(upsert, CAU), ketQua(upsert));

  // Máy dịch (lib/ban-dich.ts → ghi_ban_dich) chạy dưới phiên người đang mở /noi-bo, và nội dung bản dịch do người gọi gửi.
  const may = await duoi(UID.mktA, `select ghi_ban_dich('tep_anh', $1, $2::jsonb) as n`, [anhA, await mucDich(anhA, 'en', 'Beeftown storefront')]);
  ok('RÀ SOÁT VÒNG BỐN: ghi_ban_dich dưới phiên marketing không ghi được bản dịch của ảnh đang công bố', biChan(may, CAU), ketQua(may));

  // Cột thêm vào bảng sau này: luật xét cả dòng, không theo danh sách cột — quên thêm cột không thành hở.
  await db.query(`alter table tep_anh add column thu_cot_them_sau text`);
  const cotMoi = await duoi(UID.mktA, `update tep_anh set thu_cot_them_sau = 'x' where id = $1 returning id`, [anhA]);
  ok('RÀ SOÁT VÒNG BỐN: cột thêm vào tep_anh sau này cũng bị khóa ở ảnh đang công bố', biChan(cotMoi, CAU), ketQua(cotMoi));
  await db.query(`alter table tep_anh drop column thu_cot_them_sau`);

  ok('…trang công khai vẫn đúng ảnh cũ ở cả ba thứ tiếng', await trang() === truocTrang, `${truocTrang} → ${await trang()}`);
  ok('…dòng ảnh không đổi một chữ nào', await dongAnh(anhA) === truocDong);

  // Trình duyệt hay công cụ gửi lại nguyên các cột không đổi: không phải là sửa.
  const guiLai = await duoi(UID.mktA, `update tep_anh set duong_dan = duong_dan, alt_vi = alt_vi, nguon_that = nguon_that where id = $1 returning id`, [anhA]);
  ok('Marketing gửi lại dòng ảnh với giá trị KHÔNG đổi → không bị chặn (như 0122)', duocMot(guiLai), ketQua(guiLai));
});

// ===========================================================================
await nhom('3 · Việc của marketing vẫn làm được: tải ảnh mới, sửa ảnh chưa lên trang, gắn vào bản nháp', async () => {
  const moi = await duoi(UID.mktA,
    `insert into tep_anh (bucket, duong_dan, khung_ma, loai, nguon_that, alt_vi, rong, cao)
     values ('beeftown-cong-khai', 'chia-se/b.png', 'og-chia-se', 'chia_se', 'anh_that', 'Quầy chọn bò', 1200, 630) returning id`);
  ok('Marketing tải lên (thêm dòng) một ảnh mới', duocMot(moi), ketQua(moi));
  anhB = moi.rows?.[0]?.id ?? null;

  const sua = await duoi(UID.mktA, `update tep_anh set alt_vi = 'Quầy chọn bò, khay đã dán nhãn', alt_en = 'The beef counter', rong = 1600, cao = 840 where id = $1 returning id`, [anhB]);
  ok('Marketing sửa ảnh chưa lên trang (mô tả, bản tiếng Anh, kích thước)', duocMot(sua), ketQua(sua));

  const nhap = await duoi(UID.mktA, `select dat_noi_dung('anh_chia_se', p_tep_id => $1, p_ly_do => 'Đề xuất ảnh mới') as id`, [anhB]);
  ok('Marketing gắn ảnh mới vào bản NHÁP của anh_chia_se (dat_noi_dung, chưa công bố)', nhap.loi === null, ketQua(nhap));
  const suaSauNhap = await suaAlt(UID.mktA, anhB, 'Quầy chọn bò, bản sửa lần hai');
  ok('…ảnh chỉ nằm trong bản nháp: marketing vẫn sửa được (bản nháp không khóa, như 0122)', duocMot(suaSauNhap), ketQua(suaSauNhap));
  const may = await duoi(UID.mktA, `select ghi_ban_dich('tep_anh', $1, $2::jsonb) as n`, [anhB, await mucDich(anhB, 'ko', '정육 코너')]);
  ok('…máy dịch dưới phiên marketing vẫn ghi bản dịch cho ảnh chưa lên trang', may.loi === null && may.rows?.[0]?.n === 1, ketQua(may));

  // Cổng công bố không đổi: marketing công bố bản mới thì bước "gỡ bản cũ" của dat_noi_dung bị câu cũ chặn.
  const tuCongBo = await duoi(UID.mktA, `select dat_noi_dung('anh_chia_se', p_tep_id => $1, p_cong_bo => true) as id`, [anhB]);
  ok('Marketing tự công bố ảnh mới → vẫn câu cũ "Không có quyền gỡ nội dung khỏi trang"', tuCongBo.loi?.includes('Không có quyền gỡ nội dung khỏi trang') === true, ketQua(tuCongBo));
  ok('…trang công khai vẫn ảnh A', await urlTrenTrang() === 'chia-se/a.png', await urlTrenTrang());
});

// ===========================================================================
await nhom('4 · Thay ảnh đang công bố theo đường công bố bản mới: quản lý làm được', async () => {
  const idCu = (await mot(`select id from noi_dung_cong_bo where khoa = 'anh_chia_se' and trang_thai = 'da_cong_bo'`))?.id;
  const ql = await duoi(UID.qlA, `select dat_noi_dung('anh_chia_se', p_tep_id => $1, p_ly_do => 'Thay ảnh chia sẻ', p_cong_bo => true) as id`, [anhB]);
  ok('Quản lý công bố bản mới trỏ tới ảnh B (marketing đã tải) → được', ql.loi === null, ketQua(ql));
  ok('…trang công khai đổi sang ảnh B', await urlTrenTrang() === 'chia-se/b.png', await urlTrenTrang());
  const cu = await mot(`select trang_thai, gia_tri_tep_id from noi_dung_cong_bo where id = $1`, [idCu]);
  ok('…bản trỏ tới ảnh A thành dòng ĐÃ GỠ', cu?.trang_thai === 'da_thu_hoi' && cu.gia_tri_tep_id === anhA, JSON.stringify(cu));
});

// ===========================================================================
await nhom('5 · Ảnh của dòng ĐÃ GỠ và ảnh mới lên trang: marketing không sửa được; chủ, quản lý sửa được', async () => {
  const truocTrang = await trang();
  const truocA = await dongAnh(anhA);
  const truocB = await dongAnh(anhB);
  const gA = await suaAlt(UID.mktA, anhA, 'Viết lại lịch sử');
  ok('RÀ SOÁT VÒNG BỐN: marketing sửa ảnh của dòng ĐÃ GỠ (sổ ghi vết: ảnh nào đã từng lên trang) → bị từ chối', biChan(gA, CAU), ketQua(gA));
  const gB = await duoi(UID.mktA, `update tep_anh set duong_dan = 'chia-se/b-doi.png' where id = $1 returning id`, [anhB]);
  ok('RÀ SOÁT VÒNG BỐN: marketing đổi file của ảnh B vừa lên trang (chính ảnh mình tải) → bị từ chối', biChan(gB, CAU), ketQua(gB));
  const mayB = await duoi(UID.mktA, `select ghi_ban_dich('tep_anh', $1, $2::jsonb) as n`, [anhB, await mucDich(anhB, 'en', 'Counter')]);
  ok('RÀ SOÁT VÒNG BỐN: máy dịch dưới phiên marketing không ghi được bản dịch của ảnh B vừa lên trang', biChan(mayB, CAU), ketQua(mayB));
  ok('…trang công khai và hai dòng ảnh không đổi',
     await trang() === truocTrang && await dongAnh(anhA) === truocA && await dongAnh(anhB) === truocB);
  const nghiA = await suaAlt(UID_MKT_NGHI, anhA, 'x');
  ok('Marketing đã nghỉ việc sửa ảnh → 0 dòng (RLS, như trước)', khongDong(nghiA), ketQua(nghiA));

  // Người được công bố khóa thường: chủ và quản lý (mọi chi nhánh — nội dung công khai dùng chung toàn thương hiệu,
  // đúng luật của dat_noi_dung / thu_hoi_noi_dung).
  const qlA = await suaAlt(UID.qlA, anhA, 'Mặt tiền Beeftown, ảnh a (quản lý ghi rõ)');
  ok('Quản lý sửa ảnh của dòng đã gỡ (khóa thường) → được', duocMot(qlA), ketQua(qlA));
  const qlB = await duoi(UID.qlA, `update tep_anh set alt_vi = 'Quầy chọn bò, khay đã dán nhãn giá' where id = $1 returning id`, [anhB]);
  ok('Quản lý sửa ảnh đang công bố (khóa thường) → được', duocMot(qlB), ketQua(qlB));
  const q7 = await duoi(UID.qlB, `update tep_anh set alt_en = 'The beef counter, labelled trays' where id = $1 returning id`, [anhB]);
  ok('Quản lý chi nhánh khác (Q7) sửa ảnh đang công bố → được (công bố được khóa thường như quản lý Q1)', duocMot(q7), ketQua(q7));
  const chu = await duoi(UID.chu, `update tep_anh set rong = 1200, cao = 630 where id = $1 returning id`, [anhB]);
  ok('Chủ sửa ảnh đang công bố → được', duocMot(chu), ketQua(chu));
  const mayQl = await duoi(UID.qlA, `select ghi_ban_dich('tep_anh', $1, $2::jsonb) as n`, [anhB, await mucDich(anhB, 'ko', '정육 코너, 라벨 붙은 트레이')]);
  ok('Máy dịch dưới phiên quản lý ghi được bản dịch của ảnh đang công bố', mayQl.loi === null && mayQl.rows?.[0]?.n === 1, ketQua(mayQl));
  const a = (await mot(`select noi_dung_cong_khai('ko') -> 'anh_chia_se' as a`)).a;
  ok('…trang tiếng Hàn đọc đúng bản dịch quản lý vừa ghi', a?.alt === '정육 코너, 라벨 붙은 트레이', JSON.stringify(a));
  const khongDoi = await duoi(UID.mktA, `update tep_anh set alt_vi = alt_vi where id = $1 returning id`, [anhB]);
  ok('Marketing gửi lại ảnh đang công bố với giá trị KHÔNG đổi → không bị chặn', duocMot(khongDoi), ketQua(khongDoi));
});

// ===========================================================================
await nhom('6 · Khóa chỉ chủ sở hữu: chỉ chủ sửa được ảnh của nó, kể cả khi ảnh cũng nằm ở một khóa thường', async () => {
  // Sổ đăng ký chưa có khóa ảnh nào chỉ chủ: thêm một khóa thử, như một migration sau này sẽ thêm.
  await db.query(`insert into khoa_cong_bo (khoa, kieu, nhom, mo_ta, chi_chu_so_huu, thu_tu)
                  values ('thu_anh_chi_chu', 'tep', 'chia_se', 'Khóa ảnh thử, chỉ chủ công bố.', true, 999)`);
  const anhD = await taoAnh('d');
  const cb = await duoi(UID.chu, `select dat_noi_dung('thu_anh_chi_chu', p_tep_id => $1, p_cong_bo => true) as id`, [anhD]);
  ok('Chủ công bố ảnh D ở khóa chỉ chủ', cb.loi === null, ketQua(cb));
  const truocTrang = await trang('thu_anh_chi_chu');
  const ql = await suaAlt(UID.qlA, anhD, 'Quản lý sửa');
  ok('RÀ SOÁT VÒNG BỐN: quản lý sửa ảnh của khóa chỉ chủ đang công bố → bị từ chối, câu nêu tên khóa', biChan(ql, CAU_CHU('thu_anh_chi_chu')), ketQua(ql));
  const mkt = await suaAlt(UID.mktA, anhD, 'Marketing sửa');
  ok('RÀ SOÁT VÒNG BỐN: marketing sửa ảnh của khóa chỉ chủ → bị từ chối, câu về khóa chỉ chủ', biChan(mkt, CAU_CHU('thu_anh_chi_chu')), ketQua(mkt));
  ok('…ảnh của khóa chỉ chủ trên trang không đổi', await trang('thu_anh_chi_chu') === truocTrang);
  const chu = await suaAlt(UID.chu, anhD, 'Mặt tiền Beeftown, ảnh d (chủ ghi rõ)');
  ok('Chủ sửa ảnh của khóa chỉ chủ → được', duocMot(chu), ketQua(chu));

  // Chủ dùng ảnh B (đang ở khóa thường anh_chia_se) cho cả khóa chỉ chủ: D thành ảnh của dòng đã gỡ của khóa chỉ chủ.
  const cbB = await duoi(UID.chu, `select dat_noi_dung('thu_anh_chi_chu', p_tep_id => $1, p_cong_bo => true) as id`, [anhB]);
  ok('Chủ công bố ảnh B ở khóa chỉ chủ (B vẫn đang ở anh_chia_se)', cbB.loi === null, ketQua(cbB));
  const qlHaiKhoa = await suaAlt(UID.qlA, anhB, 'Quản lý sửa ảnh hai khóa');
  ok('RÀ SOÁT VÒNG BỐN: ảnh nằm ở CẢ khóa thường lẫn khóa chỉ chủ → quản lý bị từ chối (phải được công bố MỌI khóa trỏ tới ảnh)',
     biChan(qlHaiKhoa, CAU_CHU('thu_anh_chi_chu')), ketQua(qlHaiKhoa));
  const qlD = await suaAlt(UID.qlA, anhD, 'Quản lý sửa ảnh đã gỡ');
  ok('RÀ SOÁT VÒNG BỐN: ảnh D thuộc dòng ĐÃ GỠ của khóa chỉ chủ → quản lý vẫn bị từ chối', biChan(qlD, CAU_CHU('thu_anh_chi_chu')), ketQua(qlD));
  const chuB = await suaAlt(UID.chu, anhB, 'Quầy chọn bò, khay đã dán nhãn giá');
  ok('Chủ sửa ảnh hai khóa → được', duocMot(chuB), ketQua(chuB));

  // Ảnh A chỉ thuộc khóa thường: quản lý vẫn sửa được — luật xét đúng các khóa trỏ tới TỪNG ảnh.
  const qlA = await suaAlt(UID.qlA, anhA, 'Mặt tiền Beeftown, ảnh a');
  ok('…ảnh A (chỉ khóa thường) quản lý vẫn sửa được', duocMot(qlA), ketQua(qlA));
});

// ===========================================================================
await nhom('7 · Vai khác vẫn không sửa được ảnh nào (như trước); không phiên (SQL Editor) thì sửa được', async () => {
  const anhE = await taoAnh('e');   // ảnh chưa lên trang
  for (const [ten, uid] of [['Thu ngân', UID.thuNganA], ['Thủ kho', UID.thuKhoA], ['Thủ kho đã nghỉ', UID.nghiViec],
                            ['Marketing đã nghỉ', UID_MKT_NGHI], ['Tài khoản đăng nhập không có dòng nhân sự', UID_LA]]) {
    const r = await duoi(uid, `update tep_anh set alt_vi = 'x' where id = any($1::uuid[]) returning id`, [[anhB, anhE]]);
    ok(`${ten} sửa ảnh (đang công bố hay chưa) → 0 dòng (RLS, như trước)`, khongDong(r), ketQua(r));
  }
  const anon = await duoiAnon(`update tep_anh set alt_vi = 'x' where id = $1 returning id`, [anhB]);
  ok('anon sửa ảnh → lỗi quyền', anon.loi !== null, ketQua(anon));
  const khongPhien = await loiKhongPhien(`update tep_anh set alt_vi = 'Sửa trong SQL Editor', duong_dan = 'chia-se/b-sql.png' where id = $1`, [anhB]);
  ok('Không phiên (SQL Editor, Table Editor của Supabase Studio) vẫn sửa được ảnh đang công bố', khongPhien === null, khongPhien ?? '');
  ok('…trang công khai đọc đúng bản vừa sửa', await urlTrenTrang() === 'chia-se/b-sql.png', await urlTrenTrang());
});

// ===========================================================================
await nhom('8 · Không ai xóa được ảnh đã lên trang — kể cả chủ, kể cả SQL Editor', async () => {
  for (const [ten, uid] of [['Marketing', UID.mktA], ['Quản lý', UID.qlA], ['Chủ', UID.chu]]) {
    const r = await duoi(uid, `delete from tep_anh where id = any($1::uuid[]) returning id`, [[anhA, anhB]]);
    ok(`${ten} xóa ảnh đang công bố và ảnh của dòng đã gỡ → 0 dòng (tep_anh không có policy xóa, 0009)`, khongDong(r), ketQua(r));
  }
  const loiA = await loiKhongPhien(`delete from tep_anh where id = $1`, [anhA]);
  ok('Không phiên xóa ảnh của dòng đã gỡ → khóa ngoại on delete restrict của gia_tri_tep_id chặn', /foreign key/i.test(loiA ?? ''), loiA ?? 'XÓA ĐƯỢC');
  const loiB = await loiKhongPhien(`delete from tep_anh where id = $1`, [anhB]);
  ok('Không phiên xóa ảnh đang công bố → khóa ngoại chặn', /foreign key/i.test(loiB ?? ''), loiB ?? 'XÓA ĐƯỢC');
  ok('…cả hai ảnh vẫn còn', (await mot(`select count(*)::int as n from tep_anh where id = any($1::uuid[])`, [[anhA, anhB]])).n === 2);
});

// ===========================================================================
await nhom('9 · Hàm trigger: không ai gọi thẳng; thấy mọi dòng nội dung trỏ tới ảnh, bất kể người gọi đọc được gì', async () => {
  const h = await mot(`select p.prosecdef, p.proconfig::text as cau_hinh,
                              has_function_privilege('anon', p.oid, 'execute') as anon,
                              has_function_privilege('authenticated', p.oid, 'execute') as dang_nhap
                         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                        where n.nspname = 'public' and p.proname = 'tep_anh_da_len_trang_kiem_tra'`);
  ok('RÀ SOÁT VÒNG BỐN: có hàm trigger tep_anh_da_len_trang_kiem_tra', !!h);
  ok('…security definer, đặt search_path; anon và authenticated không gọi thẳng được',
     h?.prosecdef === true && /search_path=public/.test(h.cau_hinh ?? '') && h.anon === false && h.dang_nhap === false, JSON.stringify(h));
  const tg = (await db.query(`select tgname from pg_trigger where tgrelid = 'tep_anh'::regclass and not tgisinternal order by tgname`)).rows.map(r => r.tgname);
  ok('…trigger anh_da_len_trang_trigger chạy TRƯỚC mọi trigger khác của tep_anh (thứ tự tên): thấy đúng dòng người gọi gửi lên',
     tg[0] === 'anh_da_len_trang_trigger', tg.join(', '));

  // Một migration sau này thu hẹp quyền ĐỌC noi_dung_cong_bo (ví dụ marketing chỉ thấy bản nháp): khóa không được
  // mở theo. Hàm security invoker sẽ thấy 0 dòng trỏ tới ảnh và cho sửa. Ảnh A: chỉ dòng đã gỡ của khóa thường trỏ tới.
  const { qual } = await mot(`select qual from pg_policies where tablename = 'noi_dung_cong_bo' and policyname = 'noi_dung_doc'`);
  let r;
  try {
    await db.query(`alter policy noi_dung_doc on noi_dung_cong_bo using (la_chu_so_huu())`);
    const thay = await duoi(UID.mktA, `select count(*)::int as n from noi_dung_cong_bo`);
    ok('(tiền đề: marketing giờ không đọc được dòng nội dung nào)', thay.rows?.[0]?.n === 0, ketQua(thay));
    r = await suaAlt(UID.mktA, anhA, 'Marketing không đọc được sổ nội dung');
  } finally {
    await db.query(`alter policy noi_dung_doc on noi_dung_cong_bo using (${qual})`);
  }
  ok('RÀ SOÁT VÒNG BỐN: marketing không còn quyền đọc noi_dung_cong_bo → vẫn bị chặn sửa ảnh của dòng đã gỡ', biChan(r, CAU), ketQua(r));
  ok('…policy noi_dung_doc trả về như cũ', (await mot(`select qual from pg_policies where tablename = 'noi_dung_cong_bo' and policyname = 'noi_dung_doc'`)).qual === qual);
});

process.exit(ketThuc('ảnh của nội dung đã lên trang'));
