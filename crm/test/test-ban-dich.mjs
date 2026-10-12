/**
 * BEEFTOWN CRM — Kiểm thử tiếng Hàn và bản dịch tự động (0036)
 * ============================================================
 *
 *     node test/test-ban-dich.mjs
 *
 * Bản dịch máy lên trang KHÔNG qua mắt người, nên mọi luật giữ nó đúng phải
 * nằm ở database và phải có phép thử. Hai mục quan trọng nhất:
 *
 *   · Mục 5 — bản dịch về TRỄ cho một câu gốc vừa bị sửa phải KHÔNG được ghi.
 *     Gọi máy dịch mất vài giây; người ta sửa câu gốc trong vài giây đó là
 *     chuyện thường. Ghi nhầm thì trang tiếng Anh nói một đằng, tiếng Việt
 *     một nẻo, và không còn tín hiệu nào báo là cần dịch lại.
 *   · Mục 4 — sửa tay phải thắng máy, và mở form rồi bấm Lưu (trình duyệt đổi
 *     \n thành \r\n) KHÔNG được tính là sửa tay.
 *
 * Mục 1 nạp mọi migration trước 0036, thêm dữ liệu kiểu cũ, RỒI mới chạy 0036 — vì
 * phần khởi tạo sổ chỉ kiểm được trên một database đã có sẵn bản tiếng Anh.
 */

import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations');

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

const db = new PGlite();

console.log('\x1b[1m\nBEEFTOWN CRM — KIỂM THỬ BẢN DỊCH VÀ TIẾNG HÀN\x1b[0m');
console.log('='.repeat(60));

await db.exec(`
  create schema if not exists auth;
  create table if not exists auth._phien (uid uuid);
  create or replace function auth.uid() returns uuid
    language sql stable as $$ select uid from auth._phien limit 1 $$;

  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema public to anon, authenticated;

  alter default privileges in schema public grant all on tables    to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`);

const tatCa = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
for (const f of tatCa.filter(f => f < '0036')) {
  await db.exec(readFileSync(join(MIGRATIONS_DIR, f), 'utf8'));
}

// ---------------------------------------------------------------------------
// Dữ liệu KIỂU CŨ — có trước 0036, bản tiếng Anh do người gõ tay
// ---------------------------------------------------------------------------
const { rows: [cn] } = await db.query(
  `insert into chi_nhanh (ma, ten) values ('q1','Beeftown Quận 1') returning *`);

const { rows: [tinCu] } = await db.query(`
  insert into vi_tri_tuyen_dung (chi_nhanh_id, ma, ten_vi, ten_en, bo_phan,
                                 mo_ta_vi, mo_ta_en, yeu_cau_vi)
  values ($1, 'bep-cu', 'Nhân viên bếp', 'Kitchen staff', 'bep',
          'Sơ chế và nấu theo công thức.', 'Prep and cook to our recipes.',
          'Cẩn thận, sạch sẽ.')
  returning id`, [cn.id]);

await db.query(`
  insert into noi_dung_cong_bo (khoa, kieu, gia_tri_text, gia_tri_text_en, trang_thai)
  values ('dong_trang_thai', 'van_ban', 'Beeftown đang chuẩn bị', 'Beeftown is getting ready',
          'da_cong_bo')`);

for (const f of tatCa.filter(f => f >= '0036')) {
  await db.exec(readFileSync(join(MIGRATIONS_DIR, f), 'utf8'));
}

// ---------------------------------------------------------------------------
// Nhân sự và quyền — cùng khuôn với test-dat-noi-dung.mjs
// ---------------------------------------------------------------------------
const uidChu = '33333333-3333-3333-3333-333333333333';
const uidQl  = '11111111-1111-1111-1111-111111111111';
const uidMkt = '22222222-2222-2222-2222-222222222222';
const uidTn  = '44444444-4444-4444-4444-444444444444';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,null,'Chủ sở hữu','chu_so_huu')`, [uidChu]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,$2,'Quản lý Q1','quan_ly')`, [uidQl, cn.id]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,$2,'Bạn Marketing','marketing')`, [uidMkt, cn.id]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,$2,'Thu ngân','thu_ngan')`, [uidTn, cn.id]);

// Quyền của authenticated đúng như Supabase: quyền mặc định đặt trước khi nạp migration, trừ những gì
// migration đã thu hồi. Không cấp hàng loạt ở đây — nó xoá trắng các revoke (test-quy-trinh.mjs, mục 6).

await db.query(`
  insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai)
  values ('hien_tuyen_dung', 'bool', true, 'da_cong_bo')`);

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

async function bam(t) {
  const { rows: [r] } = await db.query(`select bam_nguon($1) as b`, [t]);
  return r.b;
}

async function so(id, cot, l) {
  const { rows: [r] } = await db.query(
    `select ban_dich -> $2 -> $3 as s from vi_tri_tuyen_dung where id = $1`, [id, cot, l]);
  return r?.s ?? null;
}

async function viec(id) {
  const { rows } = await db.query(
    `select cot || '/' || ngon_ngu as o, ly_do from v_viec_dich where dong_id = $1 order by 1`, [id]);
  return Object.fromEntries(rows.map(r => [r.o, r.ly_do]));
}

async function taoTin(ma, cot = {}) {
  const { rows: [r] } = await db.query(`
    insert into vi_tri_tuyen_dung (chi_nhanh_id, ma, ten_vi, bo_phan, mo_ta_vi, yeu_cau_vi)
    values ($1, $2, $3, 'sanh', $4, $5) returning id`,
    [cn.id, ma, cot.ten ?? 'Nhân viên sảnh', cot.mo_ta ?? 'Đón khách và hỗ trợ nướng.',
     cot.yeu_cau ?? null]);
  return r.id;
}

async function ghi(uid, id, muc) {
  return duoiDanhNghia(uid,
    `select ghi_ban_dich('vi_tri_tuyen_dung', $1, $2::jsonb) as n`, [id, JSON.stringify(muc)]);
}

// ===========================================================================
await nhom('1 · BẢN TIẾNG ANH CÓ SẴN ĐƯỢC GHI NHẬN LÀ BẢN TAY', async () => {
  const s = await so(tinCu.id, 'ten', 'en');
  ok('Tên tiếng Anh có sẵn được ghi là bản tay', s?.cach === 'tay' && s?.tt === 'ok',
     JSON.stringify(s));
  ok('…và là bản dịch của ĐÚNG câu tiếng Việt đang có',
     s?.bam === await bam('Nhân viên bếp'));
  ok('Ô chưa có tiếng Anh thì không có sổ', (await so(tinCu.id, 'yeu_cau', 'en')) === null);

  const v = await viec(tinCu.id);
  ok('Máy KHÔNG dịch đè lên bản tiếng Anh người ta đã gõ',
     !('ten/en' in v) && !('mo_ta/en' in v), JSON.stringify(v));
  ok('Máy dịch những ô còn thiếu — tiếng Hàn và yêu cầu tiếng Anh',
     v['ten/ko'] === 'thieu' && v['mo_ta/ko'] === 'thieu'
       && v['yeu_cau/en'] === 'thieu' && v['yeu_cau/ko'] === 'thieu', JSON.stringify(v));

  const { rows: [nd] } = await db.query(`
    select ban_dich -> 'gia_tri_text' -> 'en' ->> 'cach' as c
    from noi_dung_cong_bo where khoa = 'dong_trang_thai' and trang_thai = 'da_cong_bo'`);
  ok('Dữ kiện đang sống cũng được ghi sổ bản tay', nd?.c === 'tay');
});

// ===========================================================================
await nhom('2 · DANH SÁCH Ô DỊCH KHỚP VỚI CỘT THẬT', async () => {
  const { rows: ds } = await db.query(`select * from cot_ban_dich()`);
  const { rows: cot } = await db.query(`
    select table_name, column_name, data_type
    from information_schema.columns where table_schema = 'public'`);
  const co = new Set(cot.map(c => `${c.table_name}.${c.column_name}`));

  const thieu = [];
  for (const d of ds) {
    for (const c of [d.nguon, `${d.cot}_en`, `${d.cot}_ko`]) {
      if (!co.has(`${d.bang}.${c}`)) thieu.push(`${d.bang}.${c}`);
    }
  }
  ok(`Mọi cột của ${ds.length} ô dịch đều có thật`, thieu.length === 0, thieu.join(', '));

  const bang = [...new Set(ds.map(d => d.bang))];
  const khongSo = bang.filter(b =>
    !cot.some(c => c.table_name === b && c.column_name === 'ban_dich' && c.data_type === 'jsonb'));
  ok('Mọi bảng có ô dịch đều có cột ban_dich kiểu jsonb', khongSo.length === 0, khongSo.join(', '));

  const { rows: tg } = await db.query(`
    select c.relname from pg_trigger t join pg_class c on c.oid = t.tgrelid
    where t.tgname = 'so_ban_dich_trigger'`);
  const coTrigger = new Set(tg.map(r => r.relname));
  const thieuTg = bang.filter(b => !coTrigger.has(b));
  ok('Mọi bảng có ô dịch đều có trigger giữ sổ', thieuTg.length === 0, thieuTg.join(', '));
});

// ===========================================================================
await nhom('3 · TRANG CÔNG KHAI CHỌN ĐÚNG THỨ TIẾNG', async () => {
  const { rows: [t] } = await db.query(`
    insert into vi_tri_tuyen_dung (chi_nhanh_id, ma, bo_phan, trang_thai,
      ten_vi, ten_en, ten_ko,
      mo_ta_vi, mo_ta_en, mo_ta_ko,
      yeu_cau_vi, yeu_cau_en, yeu_cau_ko,
      cap_bac, cap_bac_ko,
      ca_lam, ca_lam_en)
    values ($1, 'tu-van', 'quay_thit', 'da_cong_bo',
      'Tư vấn quầy thịt', 'Meat counter assistant', '정육 코너 상담 직원',
      'Tư vấn khách chọn thịt.', 'Help guests choose beef.', '고객의 고기 선택을 도와요.',
      'Thích trò chuyện.', 'Enjoys talking to guests.', '대화를 좋아해요.',
      'Kiêm thao tác POS tại quầy', '매장 POS 업무 겸임',
      '10:00–14:00', '10:00–14:00 (Mon–Fri)')
    returning id`, [cn.id]);

  const cua = async (l) => (await duoiDanhNghiaAnon(
    `select * from tin_tuyen_dung_cong_khai($1) where ma = 'tu-van'`, [l])).rows?.[0];

  const ko = await cua('ko');
  ok('Trang tiếng Hàn hiện tên tiếng Hàn', ko?.ten === '정육 코너 상담 직원', ko?.ten);
  ok('Cấp bậc có bản Hàn thì hiện bản Hàn', ko?.cap_bac === '매장 POS 업무 겸임', ko?.cap_bac);
  ok('Ca làm thiếu bản Hàn thì lùi về bản Anh, không phải tiếng Việt',
     ko?.ca_lam === '10:00–14:00 (Mon–Fri)', ko?.ca_lam);

  const en = await cua('en');
  ok('Trang tiếng Anh hiện tên tiếng Anh', en?.ten === 'Meat counter assistant');
  ok('Trang tiếng Anh KHÔNG lấy bản Hàn khi thiếu bản Anh — lùi về tiếng Việt',
     en?.cap_bac === 'Kiêm thao tác POS tại quầy', en?.cap_bac);

  const vi = await cua('vi');
  ok('Trang tiếng Việt giữ nguyên tiếng Việt', vi?.ten === 'Tư vấn quầy thịt' && vi?.ca_lam === '10:00–14:00');

  // Ô toàn khoảng trắng là ô trống — bản cũ dùng coalesce nên chuỗi '' lọt qua.
  await db.query(`update vi_tri_tuyen_dung set ten_ko = '   ' where id = $1`, [t.id]);
  ok('Ô tiếng Hàn chỉ có khoảng trắng tính là thiếu → lùi về bản Anh',
     (await cua('ko'))?.ten === 'Meat counter assistant');

  const { rows: [nd] } = await db.query(`
    select noi_dung_cong_khai('ko') ->> 'dong_trang_thai' as ko,
           noi_dung_cong_khai('en') ->> 'dong_trang_thai' as en`);
  ok('Dữ kiện chưa có bản Hàn: trang tiếng Hàn hiện bản Anh',
     nd.ko === 'Beeftown is getting ready', nd.ko);

  const { rows: [x] } = await db.query(`select chon_ngon_ngu('fr', 'Việt', 'English', '한국어') as c`);
  ok('Ngôn ngữ lạ thì trả tiếng Việt, không trả rỗng', x.c === 'Việt');
});

// ===========================================================================
await nhom('4 · SỔ BẢN DỊCH: SỬA TAY THẮNG MÁY, CHO TỚI KHI CÂU GỐC ĐỔI', async () => {
  const id = await taoTin('sanh-4', { yeu_cau: 'Thân thiện.' });
  let v = await viec(id);
  ok('Tin mới chỉ có tiếng Việt: mọi ô đều cần dịch sang cả hai thứ tiếng',
     Object.keys(v).length === 6 && Object.values(v).every(x => x === 'thieu'), JSON.stringify(v));

  await duoiDanhNghia(uidMkt, `update vi_tri_tuyen_dung set ten_en = 'Hall staff' where id = $1`, [id]);
  let s = await so(id, 'ten', 'en');
  ok('Gõ tay ô tiếng Anh → sổ ghi bản tay của câu gốc hiện tại',
     s?.cach === 'tay' && s?.bam === await bam('Nhân viên sảnh'), JSON.stringify(s));
  ok('Máy không còn định dịch ô đó', !('ten/en' in await viec(id)));

  // Máy dịch mô tả, rồi người ta mở form và bấm Lưu mà không sửa gì:
  // trình duyệt gửi \r\n, còn thêm khoảng trắng cuối.
  const bMoTa = await bam('Đón khách và hỗ trợ nướng.');
  await ghi(uidMkt, id, [{ cot: 'mo_ta', ngon_ngu: 'en', bam: bMoTa, tt: 'ok',
                           noi_dung: 'Welcome guests.\nHelp them grill.' }]);
  await duoiDanhNghia(uidMkt,
    `update vi_tri_tuyen_dung set mo_ta_en = $2 where id = $1`,
    [id, 'Welcome guests.\r\nHelp them grill.  ']);
  s = await so(id, 'mo_ta', 'en');
  ok('Bấm Lưu lại (\\r\\n, khoảng trắng thừa) KHÔNG biến bản máy thành bản tay',
     s?.cach === 'may', JSON.stringify(s));

  await duoiDanhNghia(uidMkt,
    `update vi_tri_tuyen_dung set ten_vi = 'Nhân viên phục vụ sảnh' where id = $1`, [id]);
  v = await viec(id);
  ok('Câu gốc đổi → bản tay cũng hết hiệu lực, máy dịch lại', v['ten/en'] === 'cu', JSON.stringify(v));

  await duoiDanhNghia(uidMkt,
    `update vi_tri_tuyen_dung set ten_en = 'Floor server' where id = $1`, [id]);
  ok('Gõ tay lại cho câu gốc mới → hết cần dịch', !('ten/en' in await viec(id)));

  await duoiDanhNghia(uidMkt, `update vi_tri_tuyen_dung set ten_en = '' where id = $1`, [id]);
  ok('Xóa trắng ô tiếng Anh → sổ xóa theo, máy dịch lại',
     (await so(id, 'ten', 'en')) === null && (await viec(id))['ten/en'] === 'thieu');

  await db.query(`update vi_tri_tuyen_dung
                  set cap_bac = 'Bậc trên nhân viên sảnh', cap_bac_en = 'Above hall staff',
                      cap_bac_ko = '홀 직원 상위 직급'
                  where id = $1`, [id]);
  await db.query(`update vi_tri_tuyen_dung set cap_bac = null where id = $1`, [id]);
  const { rows: [cb] } = await db.query(
    `select cap_bac_en, cap_bac_ko, ban_dich ? 'cap_bac' as co_so from vi_tri_tuyen_dung where id = $1`, [id]);
  ok('Xóa câu gốc → bản dịch và sổ đi theo (trang Hàn không còn hiện cấp bậc cũ)',
     cb.cap_bac_en === null && cb.cap_bac_ko === null && cb.co_so === false, JSON.stringify(cb));

  const idTam = await taoTin('sanh-4b', { mo_ta: '[Chờ mô tả sau khi duyệt]' });
  ok('Câu còn [ngoặc vuông] là ghi chú biên tập — không đem đi dịch',
     !Object.keys(await viec(idTam)).some(o => o.startsWith('mo_ta/')));
});

// ===========================================================================
await nhom('5 · MÁY DỊCH GHI BẢN DỊCH — VÀ KHÔNG GHI BẢN CỦA CÂU CŨ', async () => {
  const id = await taoTin('sanh-5');
  const b = await bam('Đón khách và hỗ trợ nướng.');

  let r = await ghi(uidMkt, id, [{ cot: 'mo_ta', ngon_ngu: 'ko', bam: b, tt: 'ok',
                                   noi_dung: '  손님을 맞이하고 굽는 것을 도와요.  ' }]);
  const { rows: [t] } = await db.query(`select mo_ta_ko from vi_tri_tuyen_dung where id = $1`, [id]);
  ok('Ghi được, trả về 1 ô', r.rows?.[0]?.n === 1, r.loi ?? JSON.stringify(r.rows));
  ok('Bản dịch được cắt khoảng trắng hai đầu', t.mo_ta_ko === '손님을 맞이하고 굽는 것을 도와요.', t.mo_ta_ko);
  const s = await so(id, 'mo_ta', 'ko');
  ok('Sổ ghi bản máy, trạng thái ok, của đúng câu gốc',
     s?.cach === 'may' && s?.tt === 'ok' && s?.bam === b, JSON.stringify(s));

  // Câu gốc bị sửa trong lúc máy đang dịch.
  const bCu = await bam('Đón khách và hỗ trợ nướng.');
  await duoiDanhNghia(uidMkt,
    `update vi_tri_tuyen_dung set mo_ta_vi = 'Đón khách, hướng dẫn chọn bò.' where id = $1`, [id]);
  r = await ghi(uidMkt, id, [{ cot: 'mo_ta', ngon_ngu: 'en', bam: bCu, tt: 'ok',
                               noi_dung: 'Welcome guests and help them grill.' }]);
  const { rows: [t2] } = await db.query(`select mo_ta_en from vi_tri_tuyen_dung where id = $1`, [id]);
  ok('Bản dịch về trễ cho câu gốc CŨ bị từ chối (0 ô)', r.rows?.[0]?.n === 0, r.loi ?? JSON.stringify(r.rows));
  ok('…và ô tiếng Anh vẫn trống, không mang bản dịch của câu cũ', t2.mo_ta_en === null, t2.mo_ta_en);
  ok('Ô đó vẫn nằm trong danh sách cần dịch', (await viec(id))['mo_ta/en'] === 'thieu');

  const bMoi = await bam('Đón khách, hướng dẫn chọn bò.');
  await ghi(uidMkt, id, [{ cot: 'mo_ta', ngon_ngu: 'en', bam: bMoi, tt: 'bi_chan',
                           ly_do: 'Dính chữ cấm: "best"' }]);
  const sc = await so(id, 'mo_ta', 'en');
  ok('Bản bị chặn không lên cột', (await db.query(
       `select mo_ta_en from vi_tri_tuyen_dung where id = $1`, [id])).rows[0].mo_ta_en === null);
  ok('Sổ ghi bị chặn kèm lý do', sc?.tt === 'bi_chan' && sc?.ly_do?.includes('best'), JSON.stringify(sc));
  ok('Bị chặn với đúng câu gốc này thì không dịch lại vô ích', !('mo_ta/en' in await viec(id)));

  await duoiDanhNghia(uidMkt,
    `update vi_tri_tuyen_dung set mo_ta_vi = 'Đón khách, hướng dẫn chọn bò tại quầy.' where id = $1`, [id]);
  ok('Sửa câu gốc → ô bị chặn được dịch lại', (await viec(id))['mo_ta/en'] === 'cu');

  const bLoi = await bam('Nhân viên sảnh');
  await ghi(uidMkt, id, [{ cot: 'ten', ngon_ngu: 'en', bam: bLoi, tt: 'loi',
                           ly_do: 'Gemini 503' }]);
  ok('Vừa lỗi thì chờ, không thử lại ngay', !('ten/en' in await viec(id)));
  await db.query(`
    update vi_tri_tuyen_dung
       set ban_dich = jsonb_set(ban_dich, '{ten,en,luc}', to_jsonb(now() - interval '20 minutes'))
     where id = $1`, [id]);
  ok('Lỗi đã quá 15 phút → thử lại', (await viec(id))['ten/en'] === 'thu_lai');

  await ghi(uidMkt, id, [{ cot: 'ten', ngon_ngu: 'ko', bam: bLoi, tt: 'ok', noi_dung: '   ' }]);
  const sr = await so(id, 'ten', 'ko');
  ok('Máy trả chuỗi rỗng → ghi là lỗi, không ghi là bản dịch', sr?.tt === 'loi' && !!sr?.ly_do,
     JSON.stringify(sr));

  // Màn soạn chống hai người cùng sửa bằng updated_at. Bản dịch chạy nền mà
  // đẩy updated_at lên thì lần Lưu kế tiếp bị báo "người khác vừa sửa".
  // So bằng chuỗi của chính Postgres (tới micro giây): Date của JavaScript chỉ
  // giữ tới mili giây, và String(Date) chỉ tới giây — hai lần ghi cách nhau
  // vài chục mili giây trông như một.
  const moc = async () => (await db.query(
    `select updated_at::text as t, ten_ko from vi_tri_tuyen_dung where id = $1`, [id])).rows[0];
  const truoc = await moc();
  await ghi(uidMkt, id, [{ cot: 'ten', ngon_ngu: 'ko', bam: bLoi, tt: 'ok', noi_dung: '홀 직원' }]);
  const sau = await moc();
  ok('Máy ghi bản dịch KHÔNG đổi updated_at (không làm hỏng khóa phiên bản của form)',
     sau.ten_ko === '홀 직원' && sau.t === truoc.t, `${truoc.t} → ${sau.t}`);
  const r2 = await duoiDanhNghia(uidMkt, `update vi_tri_tuyen_dung set so_luong = 3 where id = $1`, [id]);
  const sau2 = await moc();
  ok('Người sửa thì updated_at vẫn đổi như cũ', r2.loi === null && sau2.t !== truoc.t,
     r2.loi ?? `${truoc.t} → ${sau2.t}`);
});

// ===========================================================================
await nhom('6 · GHI_BAN_DICH TỪ CHỐI THỨ NGOÀI DANH SÁCH', async () => {
  const id = await taoTin('sanh-6');
  const b = await bam('Đón khách và hỗ trợ nướng.');
  const muc = (m) => [{ cot: 'mo_ta', ngon_ngu: 'en', bam: b, tt: 'ok', noi_dung: 'x', ...m }];

  let r = await duoiDanhNghia(uidChu,
    `select ghi_ban_dich('noi_dung_cong_bo', $1, $2::jsonb)`, [id, JSON.stringify(muc({}))]);
  ok('Từ chối noi_dung_cong_bo — bản dịch của nó đi cùng phiên bản', r.loi !== null);

  r = await ghi(uidChu, id, muc({ cot: 'mo_ta_vi' }));
  ok('Từ chối ô không có trong danh sách (không cho ghi đè câu gốc)', r.loi !== null);

  r = await ghi(uidChu, id, muc({ cot: 'mo_ta"; drop table nhan_su; --' }));
  const { rows: [ns] } = await db.query(`select count(*)::int as n from nhan_su`);
  ok('Tên ô là chuỗi độc thì bị từ chối, bảng còn nguyên', r.loi !== null && ns.n === 4);

  r = await ghi(uidChu, id, muc({ ngon_ngu: 'fr' }));
  ok('Từ chối ngôn ngữ ngoài en/ko', r.loi !== null);

  r = await ghi(uidChu, id, muc({ bam: null }));
  ok('Từ chối lời gọi không kèm bam của câu gốc', r.loi !== null);

  r = await ghi(uidTn, id, muc({}));
  const { rows: [t] } = await db.query(`select mo_ta_en from vi_tri_tuyen_dung where id = $1`, [id]);
  ok('Thu ngân (không sửa được tin) ghi được 0 ô — RLS vẫn là luật',
     r.rows?.[0]?.n === 0 && t.mo_ta_en === null, r.loi ?? JSON.stringify(r.rows));

  r = await duoiDanhNghiaAnon(`select ghi_ban_dich('vi_tri_tuyen_dung', $1, $2::jsonb)`,
    [id, JSON.stringify(muc({}))]);
  ok('Anon không gọi được ghi_ban_dich', r.loi !== null);

  r = await duoiDanhNghiaAnon(`select * from v_viec_dich limit 1`);
  ok('Anon không đọc được v_viec_dich', r.loi !== null);
});

// ===========================================================================
await nhom('7 · NỘI DUNG CÔNG BỐ: BẢN DỊCH ĐI CÙNG PHIÊN BẢN', async () => {
  const soMay = JSON.stringify({ gia_tri_text: {
    en: { cach: 'may', tt: 'ok' }, ko: { cach: 'may', tt: 'ok' } } });
  let r = await duoiDanhNghia(uidChu, `
    select dat_noi_dung('dong_trang_thai', p_text := $1, p_text_en := $2, p_text_ko := $3,
                        p_ban_dich := $4::jsonb, p_cong_bo := true) as id`,
    ['Beeftown sắp mở cửa', 'Beeftown is opening soon', 'Beeftown이 곧 문을 열어요', soMay]);
  ok('Chủ nhà hàng công bố dữ kiện kèm hai bản dịch máy', r.loi === null, r.loi ?? '');

  const { rows: [n] } = await db.query(`
    select gia_tri_text_ko, ban_dich from noi_dung_cong_bo
    where khoa = 'dong_trang_thai' and trang_thai = 'da_cong_bo'`);
  ok('Bản tiếng Hàn nằm trong phiên bản đang sống', n?.gia_tri_text_ko === 'Beeftown이 곧 문을 열어요');
  const sKo = n?.ban_dich?.gia_tri_text?.ko;
  ok('Sổ ghi bản máy, database tự điền bam và thời điểm',
     sKo?.cach === 'may' && sKo?.bam === await bam('Beeftown sắp mở cửa') && !!sKo?.luc,
     JSON.stringify(sKo));
  const { rows: [pub] } = await db.query(`select noi_dung_cong_khai('ko') ->> 'dong_trang_thai' as t`);
  ok('Trang tiếng Hàn hiện bản Hàn', pub.t === 'Beeftown이 곧 문을 열어요', pub.t);

  r = await duoiDanhNghia(uidChu, `
    update noi_dung_cong_bo set gia_tri_text_ko = 'Sửa lén'
    where khoa = 'dong_trang_thai' and trang_thai = 'da_cong_bo'`);
  ok('Không sửa được bản Hàn của dòng đã công bố', r.loi !== null && /Không sửa được/.test(r.loi), r.loi ?? '');
  r = await duoiDanhNghia(uidChu, `
    update noi_dung_cong_bo set ban_dich = '{}'
    where khoa = 'dong_trang_thai' and trang_thai = 'da_cong_bo'`);
  ok('Không viết lại được sổ bản dịch của dòng đã công bố', r.loi !== null);

  // Máy dịch bị chặn tiếng Hàn: không có bản Hàn, sổ ghi lý do, trang lùi về bản Anh.
  const soChan = JSON.stringify({ gia_tri_text: {
    en: { cach: 'may', tt: 'ok' },
    ko: { cach: 'may', tt: 'bi_chan', ly_do: 'Dính chữ cấm: "최고"' } } });
  r = await duoiDanhNghia(uidChu, `
    select dat_noi_dung('dong_trang_thai', p_text := $1, p_text_en := $2,
                        p_ban_dich := $3::jsonb, p_cong_bo := true)`,
    ['Beeftown mở cửa tháng 12', 'Beeftown opens in December', soChan]);
  const { rows: [n2] } = await db.query(`
    select gia_tri_text_ko, ban_dich -> 'gia_tri_text' -> 'ko' as s,
           noi_dung_cong_khai('ko') ->> 'dong_trang_thai' as trang
    from noi_dung_cong_bo where khoa = 'dong_trang_thai' and trang_thai = 'da_cong_bo'`);
  ok('Bản Hàn bị chặn: không có chữ, sổ ghi lý do, trang lùi về bản Anh',
     r.loi === null && n2.gia_tri_text_ko === null && n2.s?.tt === 'bi_chan'
       && n2.trang === 'Beeftown opens in December', r.loi ?? JSON.stringify(n2));

  r = await duoiDanhNghia(uidChu, `
    select dat_noi_dung('dong_trang_thai', p_text := $1, p_text_en := $2, p_cong_bo := true)`,
    ['Beeftown mở cửa tháng 12!', 'Beeftown opens in December!']);
  const { rows: [n3] } = await db.query(`
    select ban_dich -> 'gia_tri_text' -> 'en' ->> 'cach' as c from noi_dung_cong_bo
    where khoa = 'dong_trang_thai' and trang_thai = 'da_cong_bo'`);
  ok('Gọi không kèm sổ (người gõ tay) → bản tiếng Anh ghi là bản tay', n3?.c === 'tay', r.loi ?? n3?.c);

  const { rows: vn } = await db.query(`
    select ngon_ngu, ly_do from v_viec_dich where bang = 'noi_dung_cong_bo' and cot = 'gia_tri_text'`);
  ok('Dữ kiện đang sống thiếu bản Hàn có mặt trong danh sách việc (để màn nội bộ đếm)',
     vn.some(v => v.ngon_ngu === 'ko' && v.ly_do === 'thieu'), JSON.stringify(vn));

  r = await duoiDanhNghia(uidChu, `
    select dat_noi_dung('facebook_url', p_text := $1, p_text_ko := $2, p_cong_bo := true)`,
    ['https://facebook.com/beeftown', 'không được lưu']);
  const { rows: [fb] } = await db.query(`
    select gia_tri_text_ko from noi_dung_cong_bo
    where khoa = 'facebook_url' and trang_thai = 'da_cong_bo'`);
  ok('Khóa kiểu URL bỏ qua bản Hàn, không vi phạm ràng buộc kiểu',
     r.loi === null && fb?.gia_tri_text_ko === null, r.loi ?? '');
});

// ===========================================================================
console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA BẢN DỊCH ĐỀU ĐẠT\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA\x1b[0m`);
  loi.forEach(l => console.log(`  \x1b[31m· ${l}\x1b[0m`));
}
await db.close();
process.exit(hong === 0 ? 0 : 1);
