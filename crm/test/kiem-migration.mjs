/**
 * BEEFTOWN — GÁC SỐ MIGRATION
 * ===========================
 *
 *     node test/kiem-migration.mjs                  kiểm tĩnh + so với origin/main
 *     node test/kiem-migration.mjs --so-voi <ref>   so với một ref khác (CI: nhánh gốc của PR)
 *     node test/kiem-migration.mjs --nhanh <ref>    kiểm migration của một nhánh khác thay vì thư mục đang mở
 *     node test/kiem-migration.mjs --so-tiep        chỉ in số migration kế tiếp (tính trên mọi nhánh origin/*)
 *     node test/kiem-migration.mjs --canh-bao-nhanh-khac   báo khi nhánh khác đang dùng cùng số
 *
 * Chỉ cần node và git — không cần npm ci, nên CI chạy được trong vài giây mỗi lần đẩy nhánh.
 *
 * Vì sao có file này: từ 25 đến 27/09/2026 phải đánh lại số migration SÁU lần sau khi
 * gộp nhánh (d1d212c, 2b07aee, fc3c5ea, d1dfaab, 7a89a1a, 9561d51), hai lần trong đó
 * file đã chạy lên production dưới số cũ. Quy tắc "lấy số sau số lớn nhất trên mọi
 * nhánh" (README của crm) đúng nhưng phải có người nhớ. File này nhớ thay.
 *
 * Kiểm tĩnh (luôn chạy):
 *   · tên file đúng mẫu 0000_chu_thuong.sql (chữ ASCII — Supabase CLI đọc phần số);
 *   · không trùng số, số liền mạch từ 0001;
 *   · mọi hàm security definer có set search_path (cả 313 hàm hiện có đều có);
 *   · từ sau 0008 (vá múi giờ): không dùng current_date / current_time / localtime /
 *     now()::date — dùng hom_nay_vn() / gio_hien_tai_vn().
 *
 * So với ref (mặc định origin/main; ref không có thì bỏ qua, có báo):
 *   · migration đã có trên ref phải giống TỪNG BYTE — nó đã (hoặc sắp) chạy trên
 *     production, sửa file không sửa được database. Muốn đổi thì viết migration mới.
 *     Ngoại lệ ghi vào DUOC_SUA kèm lý do, để ngoại lệ hiện ra trong diff của PR;
 *   · migration đã có ở điểm rẽ nhánh không được xóa hay đổi tên;
 *   · migration mới phải có số LỚN HƠN số lớn nhất trên ref.
 */

import { readdirSync, readFileSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const THU_MUC = 'crm/supabase/migrations';

/** Migration đã có trên main nhưng được phép sửa — { tep, ly_do }. Để trống là đúng. */
const DUOC_SUA = [];

/** Từ sau số này mới cấm current_date… (0004, 0005 dùng; 0008 vá và giải thích bằng chữ). */
const MOC_GIO_VN = 8;

const TEN_HOP_LE = /^(\d{4})_[a-z0-9_]+\.sql$/;

// ---------------------------------------------------------------------------
// Tham số
// ---------------------------------------------------------------------------
const thamSo = process.argv.slice(2);
const giaTri = ten => { const i = thamSo.indexOf(ten); return i >= 0 ? thamSo[i + 1] : undefined; };
const co = ten => thamSo.includes(ten);

const TRONG_CI = !!process.env.GITHUB_ACTIONS;

// ---------------------------------------------------------------------------
// git
// ---------------------------------------------------------------------------
function git(args, opts = {}) {
  return execFileSync('git', args, { cwd: GOC, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 << 20, ...opts });
}
function coRef(ref) {
  if (!ref || /^0+$/.test(ref)) return false;
  try { git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]); return true; } catch { return false; }
}
/** Tên file migration tại một ref (null = thư mục đang mở). Ref không có thư mục → []. */
function dsTep(ref) {
  if (ref === null) return readdirSync(join(GOC, THU_MUC)).filter(f => f.endsWith('.sql')).sort();
  try {
    return git(['ls-tree', '--name-only', `${ref}:${THU_MUC}`]).split('\n').filter(f => f.endsWith('.sql')).sort();
  } catch { return []; }
}
/** Nội dung một file tại một ref, dạng byte. */
function docTep(ref, ten) {
  if (ref === null) return readFileSync(join(GOC, THU_MUC, ten));
  return execFileSync('git', ['show', `${ref}:${THU_MUC}/${ten}`], { cwd: GOC, maxBuffer: 64 << 20 });
}
const so = ten => Number(ten.slice(0, 4));
const soLonNhat = ds => ds.reduce((m, f) => (TEN_HOP_LE.test(f) ? Math.max(m, so(f)) : m), 0);
const bonSo = n => String(n).padStart(4, '0');

/** Số lớn nhất trên mọi nhánh origin/* và thư mục đang mở → số kế tiếp. */
function soTiep() {
  let lon = soLonNhat(dsTep(null));
  let refs = [];
  try { refs = git(['for-each-ref', '--format=%(refname)', 'refs/remotes/origin']).split('\n').filter(Boolean); } catch { /* không có remote */ }
  for (const r of refs) {
    if (r.endsWith('/HEAD')) continue;
    try { lon = Math.max(lon, soLonNhat(dsTep(r))); } catch { /* nhánh không có thư mục migration */ }
  }
  return { so: lon + 1, soNhanh: refs.length };
}

if (co('--so-tiep')) {
  const { so: n, soNhanh } = soTiep();
  console.log(bonSo(n));
  if (!soNhanh) console.error('(chưa có nhánh origin/* nào — chạy git fetch origin --prune để tính đúng)');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Bộ đếm — cùng kiểu các file test khác, dòng tổng để chay-tat-ca.mjs đọc
// ---------------------------------------------------------------------------
let dat = 0, hong = 0;
const loi = [];
const canhBao = [];
function ok(ten, dieuKien, chiTiet = '') {
  if (dieuKien) { dat++; console.log(`  \x1b[32m✓\x1b[0m ${ten}`); }
  else {
    hong++; loi.push(ten + (chiTiet ? ` — ${chiTiet}` : ''));
    console.log(`  \x1b[31m✗ ${ten}\x1b[0m${chiTiet ? ` — ${chiTiet}` : ''}`);
  }
}
function bao(cau) {
  canhBao.push(cau);
  console.log(`  \x1b[33m! ${cau}\x1b[0m`);
  if (TRONG_CI) console.log(`::warning title=Migration::${cau}`);
}

const NHANH = giaTri('--nhanh') ?? null;       // null = thư mục đang mở
const TEN_NGUON = NHANH ?? 'thư mục đang mở';

console.log(`\x1b[1m\nBEEFTOWN — GÁC SỐ MIGRATION (${TEN_NGUON})\x1b[0m`);
console.log('='.repeat(60));

if (NHANH !== null && !coRef(NHANH)) {
  console.log(`\x1b[31mKhông thấy ref ${NHANH}\x1b[0m`);
  process.exit(1);
}
const H = dsTep(NHANH);
const SO_VOI = giaTri('--so-voi') ?? 'origin/main';
const CO_SO_VOI = coRef(SO_VOI);

// ===========================================================================
console.log('\n\x1b[1m1 · TÊN VÀ SỐ\x1b[0m');
{
  const sai = H.filter(f => !TEN_HOP_LE.test(f));
  ok(`${H.length} file đúng mẫu 0000_chu_thuong.sql`, sai.length === 0, sai.join(', '));

  const theoSo = new Map();
  for (const f of H.filter(f => TEN_HOP_LE.test(f))) theoSo.set(so(f), [...(theoSo.get(so(f)) ?? []), f]);
  const trung = [...theoSo.values()].filter(ds => ds.length > 1);
  ok('Không có hai file cùng số', trung.length === 0,
     trung.map(ds => ds.join(' = ')).join(' · ') + (trung.length ? ` — đổi số file mới thành ${bonSo(soTiep().so)}` : ''));

  const lon = soLonNhat(H);
  const thieu = [];
  for (let i = 1; i <= lon; i++) if (!theoSo.has(i)) thieu.push(bonSo(i));
  const trenGoc = CO_SO_VOI ? new Set(dsTep(SO_VOI).map(so)) : new Set();
  const doCham = thieu.length > 0 && thieu.every(s => trenGoc.has(Number(s)));
  ok(`Số liền mạch 0001–${bonSo(lon)}`, thieu.length === 0,
     `thiếu ${thieu.join(', ')}` + (doCham ? ` — các số này có trên ${SO_VOI}: gộp ${SO_VOI} vào nhánh` : ''));
}

// ===========================================================================
console.log('\n\x1b[1m2 · QUY ƯỚC TRONG FILE\x1b[0m');
{
  const thieuPath = [], gioUtc = [];
  for (const f of H.filter(f => TEN_HOP_LE.test(f))) {
    const sql = docTep(NHANH, f).toString('utf8').replace(/--[^\n]*/g, '');
    // Tách theo từng câu create function; phần thuộc tính nằm trước thân $…$ hoặc sau nó.
    for (const khoi of sql.split(/(?=create\s+(?:or\s+replace\s+)?function)/i)) {
      if (!/^create/i.test(khoi)) continue;
      const the = khoi.match(/\bas\s+(\$[a-z_]*\$)/i);
      let thuocTinh = khoi;
      if (the) {
        const dau = khoi.indexOf(the[1]);
        const cuoi = khoi.indexOf(the[1], dau + the[1].length);
        thuocTinh = khoi.slice(0, dau) + (cuoi >= 0 ? khoi.slice(cuoi + the[1].length).split(';')[0] : '');
      }
      if (/security\s+definer/i.test(thuocTinh) && !/set\s+search_path/i.test(thuocTinh)) {
        thieuPath.push(`${f}: ${khoi.slice(0, 70).replace(/\s+/g, ' ')}…`);
      }
    }
    if (so(f) > MOC_GIO_VN && /\b(current_date|current_time|localtime|localtimestamp)\b|now\(\)\s*::\s*date/i.test(sql)) {
      gioUtc.push(f);
    }
  }
  ok('Mọi hàm security definer có set search_path', thieuPath.length === 0, thieuPath.slice(0, 5).join(' | '));
  ok(`Sau ${bonSo(MOC_GIO_VN)} không dùng current_date / current_time / now()::date (UTC trên Supabase) — dùng hom_nay_vn()`,
     gioUtc.length === 0, gioUtc.join(', '));
}

// ===========================================================================
console.log(`\n\x1b[1m3 · SO VỚI ${SO_VOI}\x1b[0m`);
let tomTat = '';
if (!CO_SO_VOI) {
  bao(`Không có ref ${SO_VOI} — bỏ qua phần so sánh (chạy git fetch origin để kiểm đủ)`);
} else {
  const M = dsTep(SO_VOI);
  const dauNhanh = NHANH ?? 'HEAD';
  let B = M;
  try { B = dsTep(git(['merge-base', dauNhanh, SO_VOI]).trim()); }
  catch { bao(`Không tìm được điểm rẽ nhánh giữa ${dauNhanh} và ${SO_VOI} — coi như rẽ từ ${SO_VOI}`); }

  const tapH = new Set(H), tapM = new Set(M), tapB = new Set(B);
  const gon = ds => (ds.length > 4 ? [...ds.slice(0, 3), `… ${ds.at(-1)}`] : ds).join(', ');
  const choSua = new Set(DUOC_SUA.map(x => x.tep));

  const daSua = M.filter(f => tapH.has(f) && !choSua.has(f) && !docTep(SO_VOI, f).equals(docTep(NHANH, f)));
  ok(`Không sửa migration đã có trên ${SO_VOI} (${M.length} file)`, daSua.length === 0,
     daSua.length ? `${daSua.join(', ')} — file này đã/sắp chạy trên production; muốn đổi thì viết migration MỚI` : '');

  const daXoa = B.filter(f => !tapH.has(f));
  ok('Không xóa hay đổi tên migration đã có từ điểm rẽ nhánh', daXoa.length === 0, gon(daXoa));

  const chamHon = M.filter(f => !tapB.has(f) && !tapH.has(f));
  if (chamHon.length) bao(`Nhánh chậm hơn ${SO_VOI} ${chamHon.length} migration (${gon(chamHon)}) — gộp ${SO_VOI} vào nhánh trước khi mở PR`);

  const lonM = soLonNhat(M);
  const moi = H.filter(f => !tapM.has(f));
  const soNho = moi.filter(f => TEN_HOP_LE.test(f) && so(f) <= lonM);
  ok(`Migration mới (${moi.length ? moi.join(', ') : 'không có'}) có số lớn hơn ${bonSo(lonM)} của ${SO_VOI}`,
     soNho.length === 0,
     soNho.length ? `${soNho.join(', ')} — đổi thành ${bonSo(Math.max(lonM, soLonNhat(H.filter(f => !soNho.includes(f)))) + 1)} trở đi` : '');

  tomTat = moi.length ? `Migration mới: ${moi.join(', ')}` : 'Không có migration mới';
}

// ===========================================================================
if (co('--canh-bao-nhanh-khac') && CO_SO_VOI) {
  console.log('\n\x1b[1m4 · NHÁNH KHÁC ĐANG DÙNG CÙNG SỐ?\x1b[0m');
  const M = new Set(dsTep(SO_VOI));
  const cuaTa = new Map(H.filter(f => !M.has(f) && TEN_HOP_LE.test(f)).map(f => [so(f), f]));
  let hienTai = '';
  try { hienTai = git(['rev-parse', '--abbrev-ref', 'HEAD']).trim(); } catch { /* HEAD rời */ }
  let refs = [];
  try { refs = git(['for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin']).split('\n').filter(Boolean); } catch { /* không có remote */ }
  let dung = 0;
  for (const r of refs) {
    if (r.endsWith('/HEAD') || r === SO_VOI || r === `origin/${hienTai}` || (NHANH && r === NHANH)) continue;
    let ds = [];
    try { ds = dsTep(r); } catch { continue; }
    for (const f of ds) {
      if (M.has(f) || !TEN_HOP_LE.test(f)) continue;
      const ta = cuaTa.get(so(f));
      if (ta && ta !== f) { dung++; bao(`${r} cũng dùng số ${bonSo(so(f))} (${f}) — nhánh nào gộp sau phải đổi số`); }
    }
  }
  if (!dung) console.log('  \x1b[32m✓\x1b[0m Không nhánh nào khác dùng cùng số');
}

// ===========================================================================
const tiep = bonSo(soTiep().so);
console.log(`\nSố migration kế tiếp (tính trên mọi nhánh origin/*): ${tiep}`);
if (process.env.GITHUB_STEP_SUMMARY) {
  const dong = [`### Migration (${TEN_NGUON})`, '',
    hong ? `❌ ${hong} lỗi:` : '✅ Số và nội dung migration hợp lệ.',
    ...loi.map(l => `- ${l}`), ...canhBao.map(c => `- ⚠️ ${c}`),
    tomTat && `- ${tomTat}`, `- **Số migration kế tiếp: \`${tiep}\`**`, ''];
  try { appendFileSync(process.env.GITHUB_STEP_SUMMARY, dong.filter(Boolean).join('\n') + '\n'); } catch { /* không ghi được tóm tắt thì thôi */ }
}
if (TRONG_CI) for (const l of loi) console.log(`::error title=Migration::${l}`);

console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA MIGRATION ĐỀU ĐẠT\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA\x1b[0m`);
  for (const l of loi) console.log(`  \x1b[31m· ${l}\x1b[0m`);
}
process.exit(hong === 0 ? 0 : 1);
