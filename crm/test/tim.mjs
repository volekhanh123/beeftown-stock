/**
 * BEEFTOWN — TRA MỘT TÊN TRONG TOÀN REPO
 * ======================================
 *
 *     npm run tim -- kho_duyet_phieu_nhap           hàm SQL: định nghĩa ở migration nào, ai gọi, test nào nhắc
 *     npm run tim -- kho_duyet_phieu_nhap --than    in NGUYÊN VĂN bản cuối của hàm (để chép khi viết migration thay thân)
 *     npm run tim -- kho_duyet_phieu_nhap --khac    bản cuối khác bản trước chỗ nào (rà soát migration thay thân)
 *     npm run tim -- kho_phieu_nhap_dong            bảng / view / kiểu: tạo, sửa, policy, trigger, ai đọc
 *     npm run tim -- nhan-hang.ts                   file: ai import, test nào nhắc, tài liệu nào nói tới
 *
 * Chỉ cần node và git (không cần npm ci, không dựng database): đọc file migration và `git grep`.
 *
 * Vì sao có file này (28/10/2026): 91 migration, hơn 56.000 dòng SQL, 28 hàm được viết lại từ 3 đến 10 lần. Mỗi phiên
 * sửa một hàm phải tự lục ra bản cuối (quy ước: "chép bản cuối nguyên văn rồi vá"), rồi tìm chỗ web gọi,
 * file test nhắc tên, danh sách quyền phải xếp hàm vào (DUOC_PHEP, GOI_DUOC, NOI_BO…). Lục tay vừa tốn
 * vừa dễ chép nhầm một bản cũ. File này lục thay.
 */

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cacCauHam, soDong, soHaiBan, thoat, trongChuThich } from './doc-sql.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const THU_MUC_MIGRATION = join(GOC, 'crm', 'supabase', 'migrations');

/** Chỗ chứa mã chạy thật (ai gọi), kiểm thử, tài liệu — đường dẫn tính từ gốc repo. */
const CHO_MA = ['web/src', 'can-app/src', 'mini-app/src', 'web/kiem-tra', 'crm/sao-luu', '.github'];
const CHO_TEST = ['crm/test', 'can-app/test'];

/** File test có danh sách xếp loại hàm / file — thêm hàm mới thì phải xếp nó vào một danh sách ở đây. */
const FILE_DANH_SACH = [
  'crm/test/test-an-toan.mjs', 'crm/test/test-kho-quyen.mjs', 'crm/test/test-zalo.mjs',
  'crm/test/test-messenger.mjs', 'crm/test/test-hop-dong-web.mjs', 'crm/test/test-quy-trinh.mjs',
];

// ---------------------------------------------------------------------------
// Đọc migration
// ---------------------------------------------------------------------------

function docMigration() {
  return readdirSync(THU_MUC_MIGRATION).filter(f => /^\d{4}_.+\.sql$/.test(f)).sort()
    .map(tep => ({ tep, s: readFileSync(join(THU_MUC_MIGRATION, tep), 'utf8') }));
}

/** Mọi lần tạo / thay / xoá / cấp quyền hàm `ten`, theo thứ tự migration. */
function timHam(ten, migration) {
  const xoa = new RegExp(`drop\\s+function\\s+(?:if\\s+exists\\s+)?(?:public\\.)?"?${thoat(ten)}"?\\b[^;]*;`, 'gi');
  const quyen = new RegExp(`(?:grant|revoke)\\s+[^;]*?\\bfunction\\s+[^;]*?\\b${thoat(ten)}\\b[^;]*;`, 'gi');
  const lan = [];
  for (const { tep, s } of migration) {
    if (!s.includes(ten)) continue;
    for (const h of cacCauHam(s)) {
      if (h.ten === ten) lan.push({ ...h, loai: 'tao', tep, dong: soDong(s, h.viTri) });
    }
    for (const m of s.matchAll(xoa)) {
      if (!trongChuThich(s, m.index)) lan.push({ loai: 'xoa', tep, dong: soDong(s, m.index), cau: m[0].replace(/\s+/g, ' ') });
    }
    for (const m of s.matchAll(quyen)) {
      if (!trongChuThich(s, m.index)) lan.push({ loai: 'quyen', tep, dong: soDong(s, m.index), cau: m[0].replace(/\s+/g, ' ') });
    }
  }
  return lan.sort((a, b) => a.tep.localeCompare(b.tep) || a.dong - b.dong);
}

/** Bảng, view, kiểu tên `ten`: câu tạo, sửa, policy, trigger, chỉ mục. */
function timBang(ten, migration) {
  const t = thoat(ten);
  const MAU = [
    ['tạo bảng', new RegExp(`create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?(?:public\\.)?"?${t}"?\\s*\\(`, 'gi')],
    ['tạo view', new RegExp(`create\\s+(?:or\\s+replace\\s+)?(?:materialized\\s+)?view\\s+(?:public\\.)?"?${t}"?\\b`, 'gi')],
    ['tạo kiểu', new RegExp(`create\\s+type\\s+(?:public\\.)?"?${t}"?\\b`, 'gi')],
    ['sửa kiểu', new RegExp(`alter\\s+type\\s+(?:public\\.)?"?${t}"?\\b`, 'gi')],
    ['sửa bảng', new RegExp(`alter\\s+table\\s+(?:if\\s+exists\\s+)?(?:only\\s+)?(?:public\\.)?"?${t}"?\\b`, 'gi')],
    ['xoá', new RegExp(`drop\\s+(?:table|view|materialized\\s+view|type)\\s+(?:if\\s+exists\\s+)?(?:public\\.)?"?${t}"?\\b`, 'gi')],
    ['policy', new RegExp(`create\\s+policy\\s+(?:"[^"]*"|\\w+)\\s+on\\s+(?:public\\.)?"?${t}"?\\b`, 'gi')],
    ['trigger', new RegExp(`create\\s+(?:or\\s+replace\\s+)?(?:constraint\\s+)?trigger\\s+\\w+[^;]*?\\bon\\s+(?:public\\.)?"?${t}"?\\b`, 'gi')],
    ['chỉ mục', new RegExp(`create\\s+(?:unique\\s+)?index\\s+(?:concurrently\\s+)?(?:if\\s+not\\s+exists\\s+)?\\w*\\s*on\\s+(?:only\\s+)?(?:public\\.)?"?${t}"?\\b`, 'gi')],
  ];
  const lan = [];
  for (const { tep, s } of migration) {
    for (const [loai, re] of MAU) {
      for (const m of s.matchAll(re)) {
        if (trongChuThich(s, m.index)) continue;
        const dau = s.lastIndexOf('\n', m.index) + 1;
        const het = s.indexOf('\n', m.index);
        lan.push({ loai, tep, dong: soDong(s, m.index), cau: s.slice(dau, het < 0 ? s.length : het).trim() });
      }
    }
  }
  return lan.sort((a, b) => a.tep.localeCompare(b.tep) || a.dong - b.dong);
}

// ---------------------------------------------------------------------------
// git grep
// ---------------------------------------------------------------------------

/** Dòng nhắc `mau` (chuỗi cố định, nguyên từ) trong các thư mục `cho`: [{ tep, dong, chu }]. */
function gitGrep(mau, cho, { nguyenTu = true } = {}) {
  try {
    const ra = execFileSync('git', ['grep', '-n', '-I', '-F', ...(nguyenTu ? ['-w'] : []), '-e', mau, '--', ...cho],
      { cwd: GOC, encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] });
    return ra.split('\n').filter(Boolean).map(d => {
      const m = d.match(/^([^:]+):(\d+):(.*)$/);
      return m ? { tep: m[1], dong: Number(m[2]), chu: m[3] } : null;
    }).filter(Boolean);
  } catch { return []; }   // git grep trả mã 1 khi không thấy
}

/**
 * Gom theo file: "tep:dong,dong,…" — tối đa `toiDa` dòng mỗi file. Có `soFile`: file nhắc nhiều nhất lên đầu
 * (thường là file test chính của khu đó), chỉ in `soFile` file.
 */
function gomTheoFile(dong, toiDa = 6, soFile = Infinity) {
  const theo = new Map();
  for (const d of dong) {
    if (!theo.has(d.tep)) theo.set(d.tep, []);
    theo.get(d.tep).push(d.dong);
  }
  let ds = [...theo];
  if (soFile < ds.length) ds = ds.sort((a, b) => b[1].length - a[1].length);
  const ra = ds.slice(0, soFile).map(([tep, so]) =>
    `${tep}:${so.slice(0, toiDa).join(',')}${so.length > toiDa ? ` (+${so.length - toiDa})` : ''}`);
  if (ds.length > soFile) ra.push(MO(`… và ${ds.length - soFile} file nữa`));
  return ra;
}

/** Danh sách (const TEN = [ … ]) nào trong các file test xếp loại đang chứa 'ten'. */
function timTrongDanhSach(ten) {
  const ra = [];
  for (const f of FILE_DANH_SACH) {
    let s;
    try { s = readFileSync(join(GOC, f), 'utf8'); } catch { continue; }
    const dong = s.split('\n');
    dong.forEach((d, i) => {
      if (!new RegExp(`['"\`]${thoat(ten)}['"\`]`).test(d)) return;
      for (let k = i; k >= 0 && k > i - 400; k--) {
        const m = dong[k].match(/const\s+([A-Z_]+)\s*=\s*(?:new Set\()?\[/);
        if (m) { ra.push(`${m[1]} — ${f}:${i + 1}`); return; }
      }
    });
  }
  return [...new Set(ra)];
}

// ---------------------------------------------------------------------------
// In
// ---------------------------------------------------------------------------

const DAM = s => `\x1b[1m${s}\x1b[0m`;
const MO = s => `\x1b[2m${s}\x1b[0m`;
const DO = s => `\x1b[31m${s}\x1b[0m`;

function inNhom(tieuDe, dong) {
  console.log(`\n${DAM(tieuDe)}`);
  if (!dong.length) { console.log(MO('  (không có)')); return; }
  for (const d of dong) console.log(`  ${d}`);
}

const thamSo = process.argv.slice(2);
const ten = thamSo.find(t => !t.startsWith('--'));
const inThan = thamSo.includes('--than');
const inKhac = thamSo.includes('--khac');

if (!ten) {
  console.log('Cách dùng: npm run tim -- <tên hàm SQL | tên bảng | tên file> [--than | --khac]');
  process.exit(2);
}

const migration = docMigration();
const laFile = /\.(ts|tsx|mjs|js|astro|css|sql|md)$/.test(ten);

if (laFile) {
  // ---- Một file: ai import, test nào nhắc, tài liệu nào nói tới ----
  const goc = basename(ten);
  const khongDuoi = goc.replace(/\.(ts|tsx|mjs|js)$/, '');
  const coThat = execFileSync('git', ['ls-files'], { cwd: GOC, encoding: 'utf8' }).split('\n')
    .filter(f => f === ten || f.endsWith('/' + goc));
  console.log(`${DAM(ten)}`);
  inNhom('File trong repo', coThat);
  const nhapTu = gitGrep(`/${khongDuoi}`, CHO_MA, { nguyenTu: false })
    .filter(d => /\bfrom\s+['"]|import\(\s*['"]|require\(/.test(d.chu) && !coThat.includes(d.tep));
  inNhom('Ai import', gomTheoFile(nhapTu));
  inNhom('Kiểm thử nhắc tên', gomTheoFile(gitGrep(goc, CHO_TEST, { nguyenTu: false }), 3, 12));
  inNhom('Tài liệu nhắc tên', gomTheoFile(gitGrep(goc, ['*.md'], { nguyenTu: false }), 3));
  process.exit(0);
}

const ham = timHam(ten, migration);
const banTao = ham.filter(l => l.loai === 'tao');

if (inKhac) {
  // Hai bản cuối của hàm: đúng phần một migration thay thân đã đổi — thứ người rà soát cần đọc,
  // thay vì cả trăm dòng chép lại nguyên văn.
  if (banTao.length < 2) { console.error(DO(`"${ten}" có ${banTao.length} bản — không có gì để so.`)); process.exit(1); }
  const [truoc, sau] = banTao.slice(-2);
  const { them, bot, chu } = soHaiBan(truoc.cau, sau.cau, { inChu: true, mau: process.stdout.isTTY,
    nhanCu: `${truoc.tep.slice(0, 4)}-${ten}.sql`, nhanMoi: `${sau.tep.slice(0, 4)}-${ten}.sql` });
  console.log(DAM(`${ten}: ${truoc.tep}:${truoc.dong} → ${sau.tep}:${sau.dong} (+${them} / −${bot} dòng)`));
  console.log(chu.split('\n').slice(4).join('\n'));
  process.exit(0);
}
const bang = timBang(ten, migration);
const taoHam = banTao;

if (inThan) {
  if (!taoHam.length) { console.error(DO(`Không thấy "create function ${ten}" trong migration nào.`)); process.exit(1); }
  const cuoi = taoHam.at(-1);
  const chuKy = [...new Set(taoHam.map(l => l.thamSo))];
  console.log(`-- Bản cuối của ${ten}: crm/supabase/migrations/${cuoi.tep}:${cuoi.dong}`);
  if (chuKy.length > 1) {
    console.log(`-- CHÚ Ý: hàm có ${chuKy.length} bộ tham số trong lịch sử — xem "npm run tim -- ${ten}" trước khi chép.`);
  }
  console.log(cuoi.cau);
  process.exit(0);
}

console.log(DAM(ten));

if (taoHam.length) {
  const cuoi = taoHam.at(-1);
  const xoaSau = ham.filter(l => l.loai === 'xoa' && l.tep >= cuoi.tep);
  console.log(`\n${DAM('Hàm SQL')} — viết ${taoHam.length} lần; bản cuối ${DAM(`crm/supabase/migrations/${cuoi.tep}:${cuoi.dong}`)}`);
  console.log(`  ${cuoi.ngonNgu} · ${cuoi.definer ? 'security definer' : 'security invoker'}`
    + (cuoi.definer ? (cuoi.searchPath ? ' · có set search_path' : DO(' · THIẾU set search_path')) : '')
    + ` · tham số ${cuoi.thamSo.length > 120 ? cuoi.thamSo.slice(0, 117) + '…' : cuoi.thamSo}`);
  if (xoaSau.length) console.log(DO(`  Có lệnh xoá sau bản cuối: ${xoaSau.map(l => `${l.tep}:${l.dong}`).join(', ')}`));
  if (cuoi.raise.length) {
    console.log(`  ${cuoi.raise.length} câu raise exception — bản tiếng Anh ở web/src/lib/kho/cau-kho-en.ts hoặc web/src/lib/cau-noi-bo.ts:`);
    for (const r of cuoi.raise.slice(0, 8)) console.log(MO(`    "${r.length > 100 ? r.slice(0, 97) + '…' : r}"`));
    if (cuoi.raise.length > 8) console.log(MO(`    … và ${cuoi.raise.length - 8} câu nữa`));
  }
  inNhom('Lịch sử (tạo / xoá / cấp quyền)', ham.map(l =>
    `${l.tep}:${l.dong}  ${l.loai === 'tao' ? `tạo/thay ${l.thamSo.length > 70 ? l.thamSo.slice(0, 67) + '…' : l.thamSo}`
      : l.cau.length > 110 ? l.cau.slice(0, 107) + '…' : l.cau}`));
  console.log(MO(`  Chép bản cuối: npm run tim -- ${ten} --than${taoHam.length > 1 ? ` · bản cuối đổi gì so với bản trước: npm run tim -- ${ten} --khac` : ''}`));
} else if (ham.length) {
  inNhom('Hàm SQL — chỉ thấy lệnh xoá / cấp quyền', ham.map(l => `${l.tep}:${l.dong}  ${l.cau}`));
}

if (bang.length) {
  inNhom('Bảng / view / kiểu', bang.map(l => `${l.loai.padEnd(8)} ${l.tep}:${l.dong}  ${l.cau.length > 100 ? l.cau.slice(0, 97) + '…' : l.cau}`));
}

if (!ham.length && !bang.length) {
  const nhac = gitGrep(ten, ['crm/supabase/migrations']);
  inNhom('Không phải hàm hay bảng — migration nhắc tên', gomTheoFile(nhac, 4));
}

const goi = gitGrep(ten, CHO_MA);
const goiRpc = goi.filter(d => new RegExp(`\\.(rpc|from)\\(\\s*['"\`]${thoat(ten)}['"\`]`).test(d.chu));
inNhom('Mã gọi qua .rpc() / .from()', gomTheoFile(goiRpc));
inNhom('Mã nhắc tên ở chỗ khác', gomTheoFile(goi.filter(d => !goiRpc.includes(d))));
inNhom('Kiểm thử nhắc tên (nhắc nhiều nhất trước)', gomTheoFile(gitGrep(ten, CHO_TEST), 4, 12));
inNhom('Danh sách xếp loại (quyền, hàm nội bộ…)', timTrongDanhSach(ten));
if (taoHam.length && !timTrongDanhSach(ten).length) {
  console.log(MO('  Hàm mới gọi được từ ngoài (anon / authenticated) phải nằm trong DUOC_PHEP (test-an-toan.mjs),'
    + ' GOI_DUOC / NOI_BO (test-kho-quyen.mjs, test-zalo.mjs, test-messenger.mjs) — xem crm/CLAUDE.md.'));
}
inNhom('Tài liệu nhắc tên', gomTheoFile(gitGrep(ten, ['*.md']), 3, 12));
