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
  // Nhận hàng chỉ kg của thủ kho (GĐ5a) — chỉ gọi các hàm _kg của 0031.
  'web/src/lib/kho/nhan-hang.ts',
  'web/src/lib/kho/ton.ts',
  'web/src/lib/kho/pha-loc.ts',
  'web/src/lib/kho/xuat.ts',
  'web/src/lib/kho/kiem-ke.ts',
  // Đếm quầy quét cộng dồn (GĐ5b) — chỉ gọi từ /noi-bo/kho/quay/dem.
  'web/src/lib/kho/dem-quay.ts',
  'web/src/lib/kho/cong-no.ts',
  'web/src/lib/kho/bao-cao.ts',
  'web/src/lib/kho/thong-bao.ts',
  // Quầy yêu cầu → mang ra → bấm nhận (GĐ5b, 0032) — không đọc cột tiền nào.
  'web/src/lib/kho/quay.ts',
  // Thẻ kho, quét đầy đủ (GĐ5c, 0033) — kho_the_kho chỉ kg / gói, không tiền.
  'web/src/lib/kho/the-kho.ts',
  // Nhân viên và máy dùng chung (GĐ5d, 0034) — chỉ gọi từ /noi-bo/kho/cai-dat,
  // bằng client của chủ / quản lý. auth.signUp đi bằng client anon riêng, không gọi rpc.
  'web/src/lib/kho/nhan-vien.ts',
  // Máy tính bảng dùng chung: đổi phiên người ↔ máy (GĐ5d, 0034) — chỉ gọi từ
  // /noi-bo/kho (moTrangKho, /noi-bo/kho/may/*), bằng phiên máy hoặc phiên người.
  'web/src/lib/kho/may-chung.ts',
  // Thiết lập có tiến độ, ngưỡng, tồn đầu kỳ dạng lưới (GĐ5e, 0035) — chỉ gọi từ
  // /noi-bo/kho/cai-dat; lưới đọc mặt hàng không có cột tiền (thủ kho cũng mở).
  'web/src/lib/kho/thiet-lap.ts',
  // Đồng bộ bán hàng iPOS (GĐ7a, 0037) — "Cập nhật ngay" ở /noi-bo/kho/cai-dat/ipos
  // bằng phiên người bấm; cron (src/worker.ts) bằng tài khoản máy may_ipos đã
  // đăng nhập (client anon riêng + signInWithPassword). Không bao giờ chạy vai anon.
  'web/src/lib/kho/ipos-dong-bo.ts',
  // Bán hàng iPOS (GĐ7a, 0037): trạng thái, cấu hình, hàng chờ, ghép mã — chỉ gọi từ
  // /noi-bo/kho (Kết nối iPOS, Bán hàng iPOS, trang chủ quản lý). Không đọc / ghi token.
  'web/src/lib/kho/ban-ipos.ts',
  // Định lượng món, đối chiếu định mức (GĐ7b, 0038) — chỉ gọi từ /noi-bo/kho/cai-dat/dinh-luong,
  // /noi-bo/kho/bao-cao/dinh-muc và file CSV của nó, bằng client của nhân sự. Không cột tiền
  // nào ở bảng món / định lượng; tiền lệch do database trả null khi không xem giá.
  'web/src/lib/kho/dinh-luong.ts',
  // Đặt hàng NCC, gợi ý, nhận theo đơn, đánh giá NCC (GĐ8a, 0039) — chỉ gọi từ
  // /noi-bo/kho/dat-hang/*, nhan-hang/moi, bao-cao/ncc và file CSV của nó, bằng client
  // của nhân sự. Giá dự kiến chỉ đọc khi xem_gia (bảng / view có RLS xem_gia).
  'web/src/lib/kho/dat-hang.ts',
  // Sửa hàng loạt mặt hàng (kho_sua_nhanh_mat_hang), vị trí + lý do một form (GĐ8c, 0041) —
  // chỉ gọi từ /noi-bo/kho/cai-dat/mat-hang/sua-nhanh và cai-dat/vi-tri-ly-do, bằng client
  // của chủ / quản lý. Bảng sửa nhanh không đọc cột giá vốn nào.
  'web/src/lib/kho/sua-nhanh.ts',
  // Công thức pha lóc dạng lưới, nhân bản, gợi ý từ phiên pha đã chốt (GĐ8c) — chỉ gọi từ
  // /noi-bo/kho/cai-dat/cong-thuc (danh_muc). Gợi ý đọc kg, không tiền.
  'web/src/lib/kho/cong-thuc.ts',
  // Một lượt đồng bộ iPOS (GĐ7a): "Cập nhật ngay" chạy bằng client của quản lý / chủ;
  // cron đăng nhập tài khoản máy may_ipos (client anon riêng → sau signIn là authenticated).
  'web/src/lib/kho/ipos-dong-bo.ts',
  // Nhận hóa đơn iPOS đẩy sang (GĐ7c, 0042): route công khai /hook/ipos/<khóa> nhưng MỌI lời gọi
  // database đi bằng tài khoản máy may_ipos đã đăng nhập (client anon riêng + signInWithPassword,
  // sau đó là authenticated) — chỉ sau khi khóa bí mật IPOS_CALLBACK_KHOA khớp. Không bao giờ chạy vai anon.
  'web/src/lib/kho/ipos-hook.ts',
  // Theo dõi theo tảng (0048): bảng ủ (kho_bang_u, sửa bằng quyền danh mục) và tảng còn tồn
  // (kho_v_tang) — chỉ gọi từ /noi-bo/kho (Thiết lập → Mặt hàng, Tảng · ủ) bằng client của nhân sự. Không tiền.
  'web/src/lib/kho/tang.ts',
  // Ô mã xoay vòng (0049): danh mục ô (kho_o_ma, quyền danh mục), ô đang giao (kho_v_o_ma_giao), số tảng
  // của lô, giao / giải phóng ô qua RPC — chỉ gọi từ /noi-bo/kho bằng client của nhân sự. Không tiền.
  'web/src/lib/kho/o-ma.ts',
  // Danh mục đưa xuống cân (GĐ3): mặt hàng + ô mã + ô đang giao — gọi từ cai-dat/can và can-app bằng
  // client của quản lý đã đăng nhập. Chỉ đọc qua o-ma.ts, không tự from() bảng nào.
  'web/src/lib/kho/danh-muc-can.ts',
  // Gửi tin Zalo ZBS (0047): cron (src/worker.ts) đăng nhập tài khoản máy may_zalo (client anon
  // riêng + signInWithPassword, sau đó là authenticated) rồi mới gọi các RPC zalo_* của máy.
  // Không bao giờ chạy vai anon: thiếu tài khoản máy thì không gọi database nào.
  'web/src/lib/zalo-gui.ts',
  // Chọn chi nhánh cho ba trang /noi-bo/zalo — chỉ gọi từ các trang đó, bằng client của nhân sự.
  'web/src/lib/zalo-trang.ts',
  // Soạn tin tuyển dụng — chỉ gọi từ /noi-bo/tin-tuyen-dung.
  'web/src/lib/tin-tuyen-dung.ts',
  // Bản dịch tự động (0036) — gọi từ màn soạn tin, màn công tắc và middleware
  // của /noi-bo, luôn bằng client của nhân sự đang đăng nhập.
  'web/src/lib/ban-dich.ts',
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
          // Bỏ NGUYÊN cụm join lồng nhau "khach_hang(ho_ten, sdt)" trước khi
          // tách dấu phẩy. Lọc theo dấu ngoặc sau khi tách thì cột ở GIỮA một
          // cụm ba cột trở lên — "vi_tri_tuyen_dung(ten_vi, ten_en, bo_phan)" —
          // không có ngoặc nào, và bị tính nhầm là cột của bảng cha.
          .replace(/[a-z0-9_:!]+\s*\([^()]*\)/gi, '')
          .split(',')
          .map(c => c.trim())
          .filter(c => c && c !== '*')
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
  //
  // ve_con_hieu_luc() anon cũng có EXECUTE (0025), nhưng là để policy tải CV
  // của storage gọi. Mã web không có lý do gọi nó qua RPC, nên nó cố ý vắng
  // mặt ở đây.
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
await nhom('8 · MÀN SOẠN TIN GHI ĐÚNG CỘT VÀ ĐÚNG ENUM', async () => {
  // Màn soạn đọc bằng select('*') và ghi bằng update({...}) — hai chỗ mà mục
  // 3 và 4 không nhìn thấy tên cột. Chỗ duy nhất tên cột hiện ra là kiểu
  // TinTuyenDung, nên đối chiếu chính kiểu đó.
  const maTin = files.find(f => f.duong.endsWith('lib/tin-tuyen-dung.ts'))?.ma ?? '';
  const khoi = maTin.match(/export interface TinTuyenDung \{([\s\S]*?)\n\}/);
  const khoa = khoi ? [...khoi[1].matchAll(/^\s{2}([a-z0-9_]+)\s*[?:]/gm)].map(m => m[1]) : [];
  ok('Đọc được khai báo kiểu TinTuyenDung', khoa.length > 20, `${khoa.length} khóa`);

  const { rows } = await db.query(`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'vi_tri_tuyen_dung'`);
  const cot = new Set(rows.map(r => r.column_name));
  const sai = khoa.filter(k => !cot.has(k));
  ok('Mọi khóa của TinTuyenDung đều là cột thật của vi_tri_tuyen_dung',
     sai.length === 0, sai.length ? `SAI: ${sai.join(', ')}` : '');

  // Bộ phận, loại hợp đồng và đơn vị lương được ghi thẳng khóa của bảng nhãn
  // xuống cột enum. Gõ nhầm "quay-thit" thì form hiện đẹp mà lưu thì hỏng.
  const maNhan = files.find(f => f.duong.endsWith('lib/tuyen-dung.ts'))?.ma ?? '';
  for (const [bang, kieu] of [
    ['BO_PHAN', 'bo_phan_tuyen'], ['LOAI_HOP_DONG', 'loai_hop_dong'], ['DON_VI_LUONG', 'don_vi_luong'],
  ]) {
    const k = maNhan.match(new RegExp(`export const ${bang} = \\{([\\s\\S]*?)\\n\\}`));
    const web = k ? [...k[1].matchAll(/^\s+([a-z_]+):/gm)].map(m => m[1]).sort() : [];
    const { rows: e } = await db.query(`
      select e.enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = $1 order by 1`, [kieu]);
    const dbGiaTri = e.map(r => r.enumlabel).sort();
    ok(`Nhãn ${bang} khớp đúng enum ${kieu}`,
       web.length > 0 && web.join(',') === dbGiaTri.join(','),
       `web: ${web.join(',')} · database: ${dbGiaTri.join(',')}`);
  }
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
