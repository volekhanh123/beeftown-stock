/**
 * BEEFTOWN CRM — Kiểm thử dat_noi_dung() / thu_hoi_noi_dung() (0015)
 * ==================================================================
 * Hai hàm này tồn tại vì MỘT lý do: gộp bốn câu lệnh thành một giao dịch, để
 * một chiếc điện thoại mất sóng giữa chừng không bỏ trang chủ ở trạng thái
 * lưng chừng.
 *
 *     node test/test-dat-noi-dung.mjs
 *
 * Nên bài test quan trọng nhất ở đây là mục 3: người KHÔNG đủ quyền công bố
 * gọi hàm với p_cong_bo = true, và sau khi hàm ném lỗi thì giá trị ĐANG SỐNG
 * phải còn nguyên. Nếu giao dịch không cuốn ngược, câu lệnh thu hồi ở đầu
 * hàm đã kịp gỡ dữ kiện cũ xuống — và cả file này mất lý do tồn tại.
 */

import { dungDatabaseTrong } from './kho-chung.mjs';

let dat = 0, hong = 0;
const loi = [];

function ok(ten, dieuKien, chiTiet = '') {
  if (dieuKien) { dat++; console.log(`  \x1b[32m✓\x1b[0m ${ten}`); }
  else {
    hong++; loi.push(ten + (chiTiet ? ` — ${chiTiet}` : ''));
    console.log(`  \x1b[31m✗ ${ten}\x1b[0m${chiTiet ? ` — ${chiTiet}` : ''}`);
  }
}

async function nhom(ten, fn) {
  console.log(`\n\x1b[1m${ten}\x1b[0m`);
  try { await fn(); }
  catch (e) { ok(`${ten} chạy được đến cuối`, false, e.message); }
}

console.log('\x1b[1m\nBEEFTOWN CRM — KIỂM THỬ ĐẶT NỘI DUNG\x1b[0m');
console.log('='.repeat(60));

// Mô phỏng Supabase (schema auth, ba vai, quyền mặc định đặt TRƯỚC khi nạp migration — thiếu nó thì mọi
// khẳng định "anon không làm được X" đều đúng một cách rỗng) rồi nạp migration: dungDatabaseTrong() của kho-chung.mjs.
const { db } = await dungDatabaseTrong();

const { rows: [cn] } = await db.query(
  `insert into chi_nhanh (ma, ten) values ('q1','Beeftown Quận 1') returning *`);

const uidChu = '33333333-3333-3333-3333-333333333333';
const uidQl  = '11111111-1111-1111-1111-111111111111';
const uidMkt = '22222222-2222-2222-2222-222222222222';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,null,'Chủ sở hữu','chu_so_huu')`, [uidChu]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,$2,'Quản lý Q1','quan_ly')`, [uidQl, cn.id]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,$2,'Bạn Marketing','marketing')`, [uidMkt, cn.id]);

// Quyền của authenticated đúng như Supabase: quyền mặc định đặt trước khi nạp migration, trừ những gì
// migration đã thu hồi. Không cấp hàng loạt ở đây — nó xoá trắng các revoke (test-quy-trinh.mjs, mục 6).

async function duoiDanhNghia(uid, sql, params = []) {
  await db.query(`delete from auth._phien`);
  if (uid) await db.query(`insert into auth._phien (uid) values ($1)`, [uid]);
  await db.exec(`set role authenticated`);
  try { return { rows: (await db.query(sql, params)).rows, loi: null }; }
  catch (e) { return { rows: null, loi: e.message }; }
  finally { await db.exec(`reset role`); }
}

async function duoiDanhNghiaAnon(sql, params = []) {
  await db.query(`delete from auth._phien`);
  await db.exec(`set role anon`);
  try { return { rows: (await db.query(sql, params)).rows, loi: null }; }
  catch (e) { return { rows: null, loi: e.message }; }
  finally { await db.exec(`reset role`); }
}

/** Giá trị đang được công bố cho một khóa, đọc qua đúng cửa mà website dùng. */
async function trenTrang(khoa) {
  const { rows: [r] } = await db.query(`select noi_dung_cong_khai('vi') -> $1 as v`, [khoa]);
  return r.v;
}

// ===========================================================================
await nhom('1 · ĐẶT MỘT DỮ KIỆN', async () => {
  const r = await duoiDanhNghia(uidChu,
    `select dat_noi_dung('dia_chi_hien_thi', p_text := $1, p_cong_bo := true) as id`,
    ['40–42 Nguyễn Thái Học']);
  ok('Chủ sở hữu công bố được địa chỉ trong một lần gọi', r.loi === null, r.loi ?? '');
  ok('Địa chỉ hiện ra trên trang công khai',
     (await trenTrang('dia_chi_hien_thi')) === '40–42 Nguyễn Thái Học');

  const { rows } = await db.query(
    `select trang_thai, nguoi_tao, nguoi_duyet, cong_bo_luc, duyet_luc
     from noi_dung_cong_bo where khoa='dia_chi_hien_thi'`);
  ok('Chỉ tạo đúng một dòng', rows.length === 1, `${rows.length} dòng`);
  ok('Dòng ở trạng thái da_cong_bo', rows[0]?.trang_thai === 'da_cong_bo');
  ok('Có ghi ai soạn và ai duyệt',
     rows[0]?.nguoi_tao !== null && rows[0]?.nguoi_duyet !== null);
  ok('Có đủ mốc thời gian duyệt và công bố',
     rows[0]?.duyet_luc !== null && rows[0]?.cong_bo_luc !== null);

  // Kiểu 'ngay' phải vào đúng cột ngày, không phải cột text.
  await duoiDanhNghia(uidChu,
    `select dat_noi_dung('ngay_khai_truong', p_ngay := $1::date, p_cong_bo := true)`,
    ['2026-12-01']);
  const { rows: [ng] } = await db.query(
    `select gia_tri_ngay, gia_tri_text from noi_dung_cong_bo
     where khoa='ngay_khai_truong' and trang_thai='da_cong_bo'`);
  ok('Khóa kiểu ngày lưu vào cột ngày, cột text để trống',
     ng?.gia_tri_ngay !== null && ng?.gia_tri_text === null);
});

// ===========================================================================
await nhom('2 · LƯU NHÁP KHÔNG LÊN TRANG', async () => {
  const r = await duoiDanhNghia(uidMkt,
    `select dat_noi_dung('dong_trang_thai', p_text := $1, p_text_en := $2) as id`,
    ['Beeftown sắp mở cửa', 'Beeftown is opening soon']);
  ok('Marketing lưu được bản nháp', r.loi === null, r.loi ?? '');
  ok('Bản nháp KHÔNG xuất hiện trên trang công khai',
     (await trenTrang('dong_trang_thai')) === null);

  const { rows: [d] } = await db.query(
    `select trang_thai, gia_tri_text_en from noi_dung_cong_bo where khoa='dong_trang_thai'`);
  ok('Trạng thái là nhap', d?.trang_thai === 'nhap');
  ok('Bản tiếng Anh được lưu kèm', d?.gia_tri_text_en === 'Beeftown is opening soon');
});

// ===========================================================================
await nhom('3 · GIAO DỊCH CUỐN NGƯỢC — lý do tồn tại của 0015', async () => {
  // Trước khi thử: địa chỉ đang sống và đang hiện trên trang.
  const truoc = await trenTrang('dia_chi_hien_thi');
  ok('Điểm xuất phát: địa chỉ đang hiện trên trang', truoc === '40–42 Nguyễn Thái Học');

  // Marketing KHÔNG có quyền công bố (trigger của 0010 chặn ở nấc
  // da_duyet → da_cong_bo). Hàm sẽ ném lỗi — nhưng trước đó nó đã chạy câu
  // lệnh thu hồi bản cũ. Không có giao dịch thì địa chỉ đã biến mất.
  const r = await duoiDanhNghia(uidMkt,
    `select dat_noi_dung('dia_chi_hien_thi', p_text := $1, p_cong_bo := true)`,
    ['Địa chỉ do marketing tự đổi']);
  ok('Marketing KHÔNG công bố được', r.loi !== null && /quyền/i.test(r.loi ?? ''),
     r.loi ?? 'không có lỗi');

  const sau = await trenTrang('dia_chi_hien_thi');
  ok('ĐỊA CHỈ CŨ CÒN NGUYÊN TRÊN TRANG sau khi hàm ném lỗi', sau === truoc,
     `trước: ${truoc} · sau: ${sau}`);

  const { rows } = await db.query(
    `select count(*) as n from noi_dung_cong_bo where khoa='dia_chi_hien_thi'`);
  ok('Không để lại dòng rác nào', Number(rows[0].n) === 1, `${rows[0].n} dòng`);

  // Khóa không có trong sổ đăng ký: lỗi ngay, không âm thầm bỏ qua.
  const rSai = await duoiDanhNghia(uidChu,
    `select dat_noi_dung('khoa_khong_ton_tai', p_text := 'x', p_cong_bo := true)`);
  ok('Gõ sai tên khóa là lỗi ngay lúc ghi',
     rSai.loi !== null && /không có khóa/i.test(rSai.loi ?? ''), rSai.loi ?? '');
});

// ===========================================================================
await nhom('4 · ĐỔI GIÁ TRỊ — bản cũ tự thu hồi', async () => {
  const r = await duoiDanhNghia(uidChu,
    `select dat_noi_dung('ngay_khai_truong', p_ngay := $1::date, p_ly_do := $2, p_cong_bo := true)`,
    ['2026-12-15', 'Nội thất chậm hai tuần']);
  ok('Đổi được ngày khai trương', r.loi === null, r.loi ?? '');
  ok('Trang hiện ngày MỚI', (await trenTrang('ngay_khai_truong')) === '2026-12-15');

  const { rows } = await db.query(
    `select trang_thai, gia_tri_ngay, ly_do from noi_dung_cong_bo
     where khoa='ngay_khai_truong' order by created_at`);
  ok('Có hai dòng — bản cũ vẫn còn để đối chiếu', rows.length === 2, `${rows.length} dòng`);
  ok('Bản cũ chuyển sang da_thu_hoi', rows[0]?.trang_thai === 'da_thu_hoi');
  ok('Chỉ một bản đang sống',
     rows.filter(x => x.trang_thai === 'da_cong_bo').length === 1);
  ok('Lý do đổi được lưu lại', rows[1]?.ly_do === 'Nội thất chậm hai tuần');
});

// ===========================================================================
await nhom('5 · THU HỒI — một nút khi có sự cố', async () => {
  const r = await duoiDanhNghia(uidChu,
    `select thu_hoi_noi_dung('ngay_khai_truong', 'Chưa có giấy ATTP') as xong`);
  ok('Thu hồi chạy được', r.loi === null, r.loi ?? '');
  ok('Trả về true vì có bản đang sống để gỡ', r.rows?.[0]?.xong === true);
  ok('NGÀY BIẾN MẤT KHỎI TRANG ngay lập tức',
     (await trenTrang('ngay_khai_truong')) === null);

  const r2 = await duoiDanhNghia(uidChu,
    `select thu_hoi_noi_dung('ngay_khai_truong') as xong`);
  ok('Thu hồi lần hai trả về false, không ném lỗi',
     r2.loi === null && r2.rows?.[0]?.xong === false);

  // Thu hồi rồi vẫn công bố lại được — đây là đường quay lui khi báo động nhầm.
  const r3 = await duoiDanhNghia(uidChu,
    `select dat_noi_dung('ngay_khai_truong', p_ngay := $1::date, p_cong_bo := true)`,
    ['2026-12-15']);
  ok('Công bố lại được sau khi thu hồi', r3.loi === null, r3.loi ?? '');
  ok('Ngày quay lại trên trang', (await trenTrang('ngay_khai_truong')) === '2026-12-15');
});

// ===========================================================================
await nhom('6 · GỠ KHỎI TRANG PHẢI QUA CÙNG MỘT CỬA (0016 mục 2)', async () => {
  // Cờ chi_chu_so_huu nghĩa là "chỉ chủ nhà hàng được công bố". Trước 0016,
  // trigger chỉ kiểm quyền ở nhánh da_cong_bo — nên marketing GỠ ĐƯỢC những
  // dữ kiện mà họ không đặt lên được, kể cả công tắc form đặt bàn và hotline.
  // Giao diện chỉ giấu nút, và giấu nút không phải là phân quyền.
  await duoiDanhNghia(uidChu,
    `select dat_noi_dung('hotline', p_text := '0901234567', p_cong_bo := true)`);
  ok('Điểm xuất phát: hotline đang trên trang',
     (await trenTrang('hotline')) === '0901234567');

  const rMkt = await duoiDanhNghia(uidMkt, `select thu_hoi_noi_dung('hotline') as x`);
  ok('Marketing KHÔNG gỡ được khóa chỉ-chủ-sở-hữu',
     rMkt.loi !== null && /chủ sở hữu/i.test(rMkt.loi ?? ''), rMkt.loi ?? 'không có lỗi');
  ok('Hotline còn nguyên trên trang', (await trenTrang('hotline')) === '0901234567');

  const rQl = await duoiDanhNghia(uidQl, `select thu_hoi_noi_dung('hotline') as x`);
  ok('Quản lý cũng KHÔNG gỡ được khóa chỉ-chủ-sở-hữu',
     rQl.loi !== null && /chủ sở hữu/i.test(rQl.loi ?? ''), rQl.loi ?? 'không có lỗi');

  // Khóa thường thì quản lý gỡ được — nếu không thì đã vá quá tay.
  await duoiDanhNghia(uidChu,
    `select dat_noi_dung('facebook_url', p_text := 'https://facebook.com/beeftown', p_cong_bo := true)`);
  const rTh = await duoiDanhNghia(uidQl, `select thu_hoi_noi_dung('facebook_url') as x`);
  ok('Quản lý VẪN gỡ được khóa thường', rTh.loi === null && rTh.rows?.[0]?.x === true,
     rTh.loi ?? '');

  const rMkt2 = await duoiDanhNghia(uidMkt, `select thu_hoi_noi_dung('dia_chi_hien_thi') as x`);
  ok('Marketing KHÔNG gỡ được cả khóa thường',
     rMkt2.loi !== null && /quyền/i.test(rMkt2.loi ?? ''), rMkt2.loi ?? 'không có lỗi');

  // Chủ sở hữu vẫn làm được mọi thứ.
  const rChu = await duoiDanhNghia(uidChu, `select thu_hoi_noi_dung('hotline') as x`);
  ok('Chủ nhà hàng gỡ được', rChu.loi === null && rChu.rows?.[0]?.x === true, rChu.loi ?? '');
});

// ===========================================================================
await nhom('7 · VÉ TẢI CV (0016 mục 1, 0025)', async () => {
  // Policy storage của 0014 kiểm vé bằng một câu select vào phieu_tai_len,
  // chạy dưới quyền anon — mà anon không có GRANT và bị RLS chặn trên chính
  // bảng đó. Kết quả: MỌI lượt tải CV bị từ chối, im lặng, 100% số lần.
  // 0016 bọc câu đó vào một hàm definer nhưng không cấp cho anon quyền GỌI
  // hàm, nên lỗi vẫn y nguyên, chỉ đổi câu báo — 0025 cấp nốt quyền đó.
  // Phần storage không chạy trên PGlite nên không test nào bắt được. Ở đây
  // test cái có thể test: hàm bọc mà policy mới gọi.
  // xin_phieu_tai_cv() kiểm cong_tac_bat('hien_tuyen_dung') trước tiên — vé
  // tải CV chỉ tồn tại khi cổng tuyển dụng đang mở.
  await duoiDanhNghia(uidChu,
    `select dat_noi_dung('hien_tuyen_dung', p_bool := true, p_cong_bo := true)`);

  const { rows: [ve] } = await db.query(
    `select xin_phieu_tai_cv(null::inet) as id`);
  ok('Xin được vé', typeof ve.id === 'string');

  const hoi = async (doan) => {
    const { rows: [r] } = await db.query(`select ve_con_hieu_luc($1) as x`, [doan]);
    return r.x;
  };

  ok('Vé vừa cấp là hợp lệ', (await hoi(ve.id)) === true);
  ok('Đoạn đường dẫn tự bịa bị từ chối', (await hoi('test')) === false);
  ok('Chuỗi rỗng bị từ chối', (await hoi('')) === false);
  ok('null bị từ chối', (await hoi(null)) === false);
  ok('uuid không tồn tại bị từ chối',
     (await hoi('00000000-0000-0000-0000-000000000000')) === false);

  // Quan trọng nhất: đoạn không phải uuid KHÔNG được ném lỗi. Ném lỗi trong
  // một policy thì storage trả về thông báo khó hiểu thay vì "bị từ chối".
  let nem = null;
  try { await db.query(`select ve_con_hieu_luc($1)`, ["'; drop table phieu_tai_len; --"]); }
  catch (e) { nem = e.message; }
  ok('Đoạn rác KHÔNG làm hàm ném lỗi', nem === null, nem ?? '');

  await db.query(`update phieu_tai_len set da_dung = true where id = $1`, [ve.id]);
  ok('Vé đã dùng bị từ chối', (await hoi(ve.id)) === false);

  const { rows: [ve2] } = await db.query(`select xin_phieu_tai_cv(null::inet) as id`);
  await db.query(`update phieu_tai_len set het_han = now() - interval '1 minute' where id = $1`,
                 [ve2.id]);
  ok('Vé hết hạn bị từ chối', (await hoi(ve2.id)) === false);

  // Hàm phải là security definer — nếu không thì nó thừa hưởng đúng vấn đề
  // mà nó sinh ra để giải quyết.
  const { rows: [p] } = await db.query(
    `select prosecdef from pg_proc where proname = 've_con_hieu_luc'`);
  ok('ve_con_hieu_luc là security definer', p?.prosecdef === true);

  // Và anon PHẢI gọi được nó. Policy storage chạy dưới vai của request — với
  // khóa anon là anon — và quyền EXECUTE được kiểm với chính vai đó, definer
  // hay không. Bản trước của khẳng định này nói điều ngược lại; kiểm tay trên
  // Supabase thử cho thấy mọi lượt tải CV lỗi "permission denied for function
  // ve_con_hieu_luc".
  const { rows: [q] } = await db.query(`
    select has_function_privilege('anon', p.oid, 'execute') as duoc
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 've_con_hieu_luc'`);
  ok('anon gọi được ve_con_hieu_luc', q?.duoc === true);

  // Bằng hành vi, đúng phần việc policy làm: dưới vai anon, hỏi về một vé thật.
  const { rows: [ve3] } = await db.query(`select xin_phieu_tai_cv(null::inet) as id`);
  const r = await duoiDanhNghiaAnon(`select public.ve_con_hieu_luc($1) as x`, [ve3.id]);
  ok('Dưới vai anon, hàm chạy được và nhận ra vé thật',
     r.loi === null && r.rows?.[0]?.x === true, r.loi ?? '');
});

// ===========================================================================
await nhom('8 · VIEW BẢNG CÔNG TẮC', async () => {
  const r = await duoiDanhNghia(uidChu, `select * from v_bang_cong_tac order by thu_tu`);
  ok('Quản trị đọc được bảng công tắc', r.loi === null, r.loi ?? '');
  ok('Trả về ĐỦ mọi khóa trong sổ đăng ký, kể cả khóa chưa công bố',
     (r.rows?.length ?? 0) >= 20, `${r.rows?.length} khóa`);

  const diaChi = r.rows?.find(x => x.khoa === 'dia_chi_hien_thi');
  ok('Khóa đã công bố có dang_song = true và kèm giá trị',
     diaChi?.dang_song === true && diaChi?.gia_tri_text === '40–42 Nguyễn Thái Học');

  const chuaCo = r.rows?.find(x => x.khoa === 'hotline');
  ok('Khóa chưa công bố có dang_song = false', chuaCo?.dang_song === false);
  ok('Mỗi khóa kèm mô tả cho người không rành kỹ thuật',
     r.rows?.every(x => typeof x.mo_ta === 'string' && x.mo_ta.length > 0));

  // View phải chạy dưới quyền người gọi, nếu không nó là một đường vòng qua RLS.
  const { rows: [v] } = await db.query(`
    select coalesce((select option_value from pg_options_to_table(c.reloptions)
                     where option_name = 'security_invoker'), 'false') as si
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relname='v_bang_cong_tac'`);
  ok('v_bang_cong_tac chạy dưới quyền người gọi', v?.si === 'true', `security_invoker=${v?.si}`);
});

// ===========================================================================
console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA ĐẶT NỘI DUNG ĐỀU ĐẠT\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA\x1b[0m`);
  loi.forEach(l => console.log(`  \x1b[31m· ${l}\x1b[0m`));
}
await db.close();
process.exit(hong === 0 ? 0 : 1);
