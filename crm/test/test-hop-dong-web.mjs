/**
 * BEEFTOWN — HỢP ĐỒNG GIỮA WEBSITE VÀ DATABASE
 * ============================================
 *
 *     node test/test-hop-dong-web.mjs
 *
 * VẤN ĐỀ NÀY GIẢI
 *
 * Mã website gọi database qua PostgREST bằng tên chuỗi: rpc('tao_dat_ban',
 * { p_so_khach: 4 }), from('dat_ban').select('ma_dat_ban'). Không có bước
 * biên dịch nào đối chiếu những chuỗi đó với database thật.
 *
 * Gõ sai một tên tham số thì PostgREST không báo "sai tên". Nó báo "không
 * tìm thấy hàm phù hợp" — hoặc tệ hơn, nó tìm thấy một phiên bản khác của
 * hàm nhờ tham số mặc định và chạy với giá trị mặc định mà không ai biết.
 * Cả hai đều chỉ lộ ra khi có khách thật đang điền form.
 *
 * `astro check` không bắt được lớp lỗi này, vì với TypeScript thì
 * { p_so_kach: 4 } là một object hoàn toàn hợp lệ.
 *
 * CÁCH LÀM
 *
 * Đọc mã nguồn web, rút ra mọi tên hàm, tên tham số, tên bảng và tên cột mà
 * nó nhắc tới, rồi đối chiếu với pg_proc và information_schema của một
 * database đã nạp đủ migration.
 *
 * Phép thử này KHÔNG chứng minh website chạy đúng. Nó chứng minh website và
 * database đang nói cùng một thứ tiếng — đó là điều duy nhất kiểm được mà
 * không cần dựng một project Supabase thật.
 */

import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations');
const WEB_SRC = join(__dirname, '..', '..', 'web', 'src');

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

console.log('\x1b[1m\nBEEFTOWN — HỢP ĐỒNG WEB ↔ DATABASE\x1b[0m');
console.log('='.repeat(60));

if (!existsSync(WEB_SRC)) {
  console.log('\n\x1b[31mKhông tìm thấy web/src — bỏ qua.\x1b[0m\n');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Nạp database
// ---------------------------------------------------------------------------
const db = new PGlite();
await db.exec(`
  create schema if not exists auth;
  create table if not exists auth._phien (uid uuid);
  create or replace function auth.uid() returns uuid
    language sql stable as $$ select uid from auth._phien limit 1 $$;
`);
for (const f of readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort()) {
  await db.exec(readFileSync(join(MIGRATIONS_DIR, f), 'utf8'));
}

// ---------------------------------------------------------------------------
// Đọc mã nguồn web
// ---------------------------------------------------------------------------
function moiFile(thuMuc) {
  const ra = [];
  for (const m of readdirSync(thuMuc, { withFileTypes: true })) {
    const d = join(thuMuc, m.name);
    if (m.isDirectory()) ra.push(...moiFile(d));
    else if (/\.(ts|astro)$/.test(m.name)) ra.push(d);
  }
  return ra;
}

const files = moiFile(WEB_SRC).map(f => ({
  duong: relative(join(__dirname, '..', '..'), f).replace(/\\/g, '/'),
  ma: readFileSync(f, 'utf8'),
}));

console.log(`\nĐọc ${files.length} file trong web/src\n`);

// ---------------------------------------------------------------------------
// FILE NÀO CHẠY DƯỚI VAI NÀO
// ---------------------------------------------------------------------------
// Phân loại theo THƯ MỤC thì sai: lib/phien.ts nằm ngoài /noi-bo/ nhưng đọc
// bảng nhan_su bằng client mang access token của người đã đăng nhập, nên nó
// chạy dưới vai authenticated.
//
// Nên liệt kê tường minh. Danh sách ngắn, và quan trọng hơn: một file mới đọc
// bảng sẽ làm phép thử ĐỎ cho tới khi có người phân loại nó — đúng lúc cần
// suy nghĩ về việc file đó chạy dưới quyền ai.
const CHAY_DA_DANG_NHAP = [
  // Đổi access token trong cookie lấy dòng nhan_su tương ứng. Client ở đây
  // luôn mang header Authorization của người dùng.
  'web/src/lib/phien.ts',
  // Đọc và ghi cổng nội dung, chỉ được gọi từ /noi-bo sau middleware.
  'web/src/lib/cong-tac.ts',
  // Chi nhánh, bàn ăn, dọn dữ liệu — cũng chỉ gọi từ /noi-bo.
  'web/src/lib/cai-dat.ts',
  // Kho — mọi file chỉ được gọi từ /noi-bo/kho, sau middleware, bằng client
  // mang access token của nhân sự. Liệt kê từng file: file kho mới đọc bảng
  // sẽ làm phép thử đỏ cho tới khi có người phân loại nó.
  'web/src/lib/kho/trang.ts',
  'web/src/lib/kho/danh-muc.ts',
  'web/src/lib/kho/nhap.ts',
  'web/src/lib/kho/ton.ts',
];

function laAnon(g) {
  return !g.duong.includes('/noi-bo/') && !CHAY_DA_DANG_NHAP.includes(g.duong);
}

/** Cắt lấy object literal cân bằng ngoặc sau vị trí bắt đầu. */
function catObject(ma, tu) {
  const i = ma.indexOf('{', tu);
  if (i < 0) return null;
  let sau = 0;
  for (let j = i; j < ma.length; j++) {
    if (ma[j] === '{') sau++;
    else if (ma[j] === '}') { sau--; if (sau === 0) return ma.slice(i, j + 1); }
  }
  return null;
}

// --- rpc('ten', { p_x: ..., p_y: ... }) -------------------------------------
const goiRpc = [];
for (const { duong, ma } of files) {
  for (const m of ma.matchAll(/\.rpc\(\s*'([a-z0-9_]+)'/g)) {
    const obj = catObject(ma, m.index + m[0].length);
    const tham = obj
      ? [...obj.matchAll(/(?:^|[{,\s])(p_[a-z0-9_]+)\s*:/g)].map(x => x[1])
      : [];
    goiRpc.push({ duong, ham: m[1], tham });
  }
}

// --- from('bang').select('a, b, c') ----------------------------------------
const goiBang = [];
for (const { duong, ma } of files) {
  // Lookahead (?=...) để không "nuốt" 400 ký tự sau mỗi from(): hai from()
  // đứng gần nhau (hai truy vấn liền trong một hàm) thì from() thứ hai vẫn
  // được kiểm. Đoạn đuôi cắt ở from() kế tiếp để không lấy nhầm select của nó.
  for (const m of ma.matchAll(/\.from\(\s*'([a-z0-9_-]+)'\s*\)(?=([\s\S]{0,400}))/g)) {
    const bang = m[1];
    // Bỏ qua Storage: .from('ho-so-ung-tuyen') là tên kho, không phải bảng.
    if (bang.includes('-')) continue;
    const duoi = m[2].split(/\.from\(/)[0];
    const sel = duoi.match(/\.select\(\s*'([^']*)'/);
    const cot = sel
      ? sel[1]
          .split(',')
          .map(c => c.trim())
          // Bỏ phần join lồng nhau "khach_hang(ho_ten, sdt)" và ký tự *
          .filter(c => c && c !== '*' && !c.includes('(') && !c.includes(')'))
          .map(c => c.split(':').pop().trim())
      : [];
    goiBang.push({ duong, bang, cot });
  }
}

// ===========================================================================
await nhom('1 · MỌI HÀM WEB GỌI ĐỀU TỒN TẠI', async () => {
  const { rows } = await db.query(`
    select p.proname from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'`);
  const co = new Set(rows.map(r => r.proname));

  const tenDaXet = new Set();
  for (const g of goiRpc) {
    if (tenDaXet.has(g.ham)) continue;
    tenDaXet.add(g.ham);
    ok(`${g.ham}() có trong database`, co.has(g.ham), g.duong);
  }
  ok('Có tìm thấy lời gọi RPC nào đó để kiểm', goiRpc.length > 0,
     `tìm thấy ${goiRpc.length}`);
});

// ===========================================================================
await nhom('2 · MỌI THAM SỐ WEB TRUYỀN ĐỀU ĐÚNG TÊN', async () => {
  // Một tên hàm có thể có nhiều phiên bản nạp chồng. Gộp mọi tham số hợp lệ:
  // PostgREST chọn phiên bản theo bộ tên tham số nó nhận được.
  const { rows } = await db.query(`
    select p.proname,
           coalesce(p.proargnames, array[]::text[]) as ten_tham
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'`);

  const thamHopLe = new Map();
  for (const r of rows) {
    const bo = thamHopLe.get(r.proname) ?? new Set();
    for (const t of r.ten_tham ?? []) if (t?.startsWith('p_')) bo.add(t);
    thamHopLe.set(r.proname, bo);
  }

  for (const g of goiRpc) {
    if (g.tham.length === 0) continue;
    const hopLe = thamHopLe.get(g.ham) ?? new Set();
    const sai = g.tham.filter(t => !hopLe.has(t));
    ok(`${g.ham}(): ${g.tham.length} tham số đều đúng tên`,
       sai.length === 0,
       sai.length ? `SAI: ${sai.join(', ')} · hàm nhận: ${[...hopLe].join(', ')}` : '');
  }
});

// ===========================================================================
await nhom('3 · MỌI BẢNG VÀ VIEW WEB ĐỌC ĐỀU TỒN TẠI', async () => {
  const { rows } = await db.query(`
    select table_name from information_schema.tables where table_schema = 'public'`);
  const co = new Set(rows.map(r => r.table_name));

  const daXet = new Set();
  for (const g of goiBang) {
    if (daXet.has(g.bang)) continue;
    daXet.add(g.bang);
    ok(`bảng/view ${g.bang} có trong database`, co.has(g.bang), g.duong);
  }
});

// ===========================================================================
await nhom('4 · MỌI CỘT WEB CHỌN ĐỀU TỒN TẠI', async () => {
  const { rows } = await db.query(`
    select table_name, column_name
    from information_schema.columns where table_schema = 'public'`);
  const cot = new Map();
  for (const r of rows) {
    if (!cot.has(r.table_name)) cot.set(r.table_name, new Set());
    cot.get(r.table_name).add(r.column_name);
  }

  for (const g of goiBang) {
    if (g.cot.length === 0) continue;
    const co = cot.get(g.bang);
    if (!co) continue;   // mục 3 đã báo bảng không tồn tại
    const sai = g.cot.filter(c => !co.has(c));
    ok(`${g.bang}: ${g.cot.length} cột đều tồn tại`,
       sai.length === 0,
       sai.length ? `SAI: ${sai.join(', ')}` : '');
  }
});

// ===========================================================================
await nhom('5 · WEB KHÔNG GỌI HÀM NGOÀI DANH SÁCH CHO PHÉP', async () => {
  // Trang công khai chạy dưới vai anon. Nó chỉ được gọi 12 hàm đã duyệt
  // (0013). Gọi hàm ngoài danh sách sẽ lỗi 403 trên production — nhưng chạy
  // ngon lành ở máy lập trình viên nếu người đó đang dùng khóa service_role.
  const CONG_KHAI = [
    'noi_dung_cong_khai', 'tin_tuyen_dung_cong_khai', 'thuc_don_cong_khai',
    'chi_nhanh_cong_khai', 'lich_trong_theo_ma', 'tao_dat_ban',
    'tra_cuu_dat_ban', 'huy_dat_ban', 'ghi_nhat_ky_tra_cuu',
    'nop_ho_so_ung_tuyen', 'xin_phieu_tai_cv', 'ghi_su_kien_web',
  ];

  for (const g of goiRpc.filter(laAnon)) {
    ok(`${g.ham}() nằm trong danh sách anon gọi được`,
       CONG_KHAI.includes(g.ham),
       `${g.duong} gọi một hàm anon KHÔNG có quyền`);
  }
});

// ===========================================================================
await nhom('6 · WEB KHÔNG ĐỌC THẲNG BẢNG DƯỚI VAI ANON', async () => {
  // anon bị revoke quyền trên MỌI bảng (0007 + 0008). Một câu
  // from('dat_ban') trong mã chạy dưới vai anon sẽ luôn lỗi trên production.
  const cuaAnon = goiBang.filter(laAnon);

  ok('Mã chạy dưới vai anon không gọi from() vào bảng nào',
     cuaAnon.length === 0,
     cuaAnon.map(g => `${g.duong} → ${g.bang}`).join(' · '));
});

// ===========================================================================
await nhom('7 · KHÓA CÔNG BỐ WEB DÙNG ĐỀU CÓ TRONG SỔ ĐĂNG KÝ', async () => {
  const { rows } = await db.query(`select khoa from khoa_cong_bo`);
  const co = new Set(rows.map(r => r.khoa));

  // Kiểu NoiDung trong lib/noi-dung.ts phải khớp sổ đăng ký: hàm
  // noi_dung_cong_khai() trả về đúng các khóa đó, nên một tên thừa trong
  // TypeScript là một thuộc tính mãi mãi undefined.
  const maNoiDung = files.find(f => f.duong.endsWith('lib/noi-dung.ts'))?.ma ?? '';
  const khoi = maNoiDung.match(/export interface NoiDung \{([\s\S]*?)\n\}/);
  const khaiBao = khoi
    ? [...khoi[1].matchAll(/^\s{2}([a-z0-9_]+)\s*[?:]/gm)].map(m => m[1])
    : [];

  ok('Đọc được khai báo kiểu NoiDung', khaiBao.length > 0, `${khaiBao.length} khóa`);

  const thua = khaiBao.filter(k => !co.has(k));
  ok('Mọi khóa khai trong TypeScript đều có trong khoa_cong_bo',
     thua.length === 0, thua.length ? `THỪA: ${thua.join(', ')}` : '');

  const thieu = [...co].filter(k => !khaiBao.includes(k));
  ok('Mọi khóa trong sổ đăng ký đều được khai trong TypeScript',
     thieu.length === 0, thieu.length ? `THIẾU: ${thieu.join(', ')}` : '');
});

// ===========================================================================
console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA HỢP ĐỒNG WEB ↔ DB ĐỀU ĐẠT\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA\x1b[0m`);
  loi.forEach(l => console.log(`  \x1b[31m· ${l}\x1b[0m`));
}
await db.close();
process.exit(hong === 0 ? 0 : 1);
