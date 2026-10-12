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
 *   · không trùng số;
 *   · số bị hở chỉ CẢNH BÁO (kèm nhánh nào đang giữ số đó) — lấy số bằng --so-tiep khi nhánh
 *     khác đang giữ số nhỏ hơn thì hở là đúng, Supabase CLI chỉ cần thứ tự;
 *   · file mới / đã đổi: mọi hàm security definer có set search_path (cả 313 hàm hiện có
 *     đều có); từ sau 0008 (vá múi giờ) không dùng current_date / current_time / localtime /
 *     now()::date — dùng hom_nay_vn() / bay_gio_vn() / gio_vn() — và không cắt ngày một cột /
 *     biến timestamptz theo UTC (`thoi_diem::date`, `date(created_at)`… — dùng ngay_vn(), 0068;
 *     bộ dò ở gio-utc.mjs).
 *
 * So với ref (mặc định origin/main; ref không có thì bỏ qua, có báo):
 *   · migration đã có trên ref phải GIỐNG HỆT — nó đã (hoặc sắp) chạy trên production, sửa
 *     file không sửa được database. Muốn đổi thì viết migration mới. Ngoại lệ ghi vào
 *     DUOC_SUA kèm lý do, để ngoại lệ hiện ra trong diff của PR;
 *   · migration đã có ở điểm rẽ nhánh không được xóa hay đổi tên;
 *   · migration mới phải có số LỚN HƠN số lớn nhất trên ref.
 *
 * "Giống hệt" so bằng mã blob của git, không so byte trên đĩa: máy Windows (Git for Windows
 * mặc định core.autocrlf=true) lưu file với CRLF, byte khác nhưng nội dung trong git y nguyên.
 */

import { readdirSync, readFileSync, appendFileSync } from 'node:fs';
import { tenTimestamptz, timNgayUtc } from './gio-utc.mjs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const THU_MUC = 'crm/supabase/migrations';

/** Migration đã có trên main nhưng được phép sửa — { tep, ly_do }. Để trống là đúng. */
const DUOC_SUA = [];

/**
 * Số hở ĐÃ BIẾT, không còn nhánh nào giữ — không cảnh báo nữa. Một cảnh báo hiện ở MỌI lượt CI thì người ta
 * quen bỏ qua, đúng lúc nó cần nói "nhánh khác đang giữ số này". Mỗi số kèm lý do; số nào có file thì bỏ khỏi đây.
 */
const HO_DA_BIET = [
  { so: 56, lyDo: 'báo động viết với 0056–0057, đánh lại thành 0059–0060 khi gộp (30/09/2026, crm/README.md)' },
  { so: 57, lyDo: 'như 0056' },
];

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
function git(args) {
  return execFileSync('git', args, { cwd: GOC, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 << 20 });
}
function coRef(ref) {
  if (!ref || /^0+$/.test(ref)) return false;
  try { git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]); return true; } catch { return false; }
}
/** Migration tại một ref: Map tên file → mã blob. Ref không có thư mục → Map rỗng. Một lệnh git cho cả thư mục. */
function blobTaiRef(ref) {
  try {
    return new Map(git(['ls-tree', '-r', ref, '--', THU_MUC]).split('\n').filter(Boolean)
      .map(dong => { const [dau, duong] = dong.split('\t'); return [duong.split('/').pop(), dau.split(' ')[2]]; })
      .filter(([ten]) => ten.endsWith('.sql')));
  } catch { return new Map(); }
}
/** Migration trong thư mục đang mở: Map tên file → mã blob, tính QUA git (áp core.autocrlf như lúc commit). */
function blobDangMo() {
  const ds = readdirSync(join(GOC, THU_MUC)).filter(f => f.endsWith('.sql')).sort();
  if (!ds.length) return new Map();
  const ma = git(['hash-object', '--', ...ds.map(f => `${THU_MUC}/${f}`)]).split('\n').filter(Boolean);
  return new Map(ds.map((f, i) => [f, ma[i]]));
}
/** Nội dung một file (thư mục đang mở, hoặc tại một ref). */
function docTep(ref, ten) {
  if (ref === null) return readFileSync(join(GOC, THU_MUC, ten), 'utf8');
  return git(['show', `${ref}:${THU_MUC}/${ten}`]);
}
const so = ten => Number(ten.slice(0, 4));
const soLonNhat = ds => [...ds].reduce((m, f) => (TEN_HOP_LE.test(f) ? Math.max(m, so(f)) : m), 0);
const bonSo = n => String(n).padStart(4, '0');
const gon = ds => (ds.length > 4 ? [...ds.slice(0, 3), `… ${ds.at(-1)}`] : ds).join(', ');

/** Mọi nhánh origin/* (bỏ HEAD) → Map nhánh → tên file migration. Tính một lần. */
let _nhanhKhac = null;
function nhanhKhac() {
  if (_nhanhKhac) return _nhanhKhac;
  let refs = [];
  try { refs = git(['for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin']).split('\n').filter(Boolean); } catch { /* không có remote */ }
  _nhanhKhac = new Map(refs.filter(r => !r.endsWith('/HEAD') && r !== 'origin').map(r => [r, [...blobTaiRef(r).keys()]]));
  return _nhanhKhac;
}
/** Số lớn nhất trên mọi nhánh origin/* và thư mục đang mở → số kế tiếp. */
function soTiep() {
  let lon = soLonNhat(readdirSync(join(GOC, THU_MUC)));
  for (const ds of nhanhKhac().values()) lon = Math.max(lon, soLonNhat(ds));
  return lon + 1;
}

if (co('--so-tiep')) {
  console.log(bonSo(soTiep()));
  if (!nhanhKhac().size) console.error('(chưa có nhánh origin/* nào — chạy git fetch origin --prune để tính đúng)');
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
const SO_VOI = giaTri('--so-voi') ?? 'origin/main';

console.log(`\x1b[1m\nBEEFTOWN — GÁC SỐ MIGRATION (${TEN_NGUON})\x1b[0m`);
console.log('='.repeat(60));

if (NHANH !== null && !coRef(NHANH)) {
  console.log(`\x1b[31mKhông thấy ref ${NHANH}\x1b[0m`);
  process.exit(1);
}
const blobH = NHANH === null ? blobDangMo() : blobTaiRef(NHANH);
const H = [...blobH.keys()].sort();
const CO_SO_VOI = coRef(SO_VOI);
const blobM = CO_SO_VOI ? blobTaiRef(SO_VOI) : new Map();

// ===========================================================================
console.log('\n\x1b[1m1 · TÊN VÀ SỐ\x1b[0m');
{
  const sai = H.filter(f => !TEN_HOP_LE.test(f));
  ok(`${H.length} file đúng mẫu 0000_chu_thuong.sql`, sai.length === 0, sai.join(', '));

  const theoSo = new Map();
  for (const f of H.filter(f => TEN_HOP_LE.test(f))) theoSo.set(so(f), [...(theoSo.get(so(f)) ?? []), f]);
  const trung = [...theoSo.values()].filter(ds => ds.length > 1);
  ok('Không có hai file cùng số', trung.length === 0,
     trung.map(ds => ds.join(' = ')).join(' · ') + (trung.length ? ` — đổi số file mới thành ${bonSo(soTiep())}` : ''));

  // Số hở: chỉ cảnh báo. Lấy số bằng --so-tiep khi nhánh khác đang giữ số nhỏ hơn thì hở là ĐÚNG.
  const daBiet = new Set(HO_DA_BIET.map(x => x.so));
  const coFile = HO_DA_BIET.filter(x => theoSo.has(x.so)).map(x => bonSo(x.so));
  ok('HO_DA_BIET chỉ giữ số thật sự hở', coFile.length === 0, `${coFile.join(', ')} đã có file — bỏ khỏi HO_DA_BIET`);
  const hoi = [];
  for (let i = 1; i <= soLonNhat(H); i++) if (!theoSo.has(i) && !daBiet.has(i)) hoi.push(i);
  if (hoi.length) {
    const giu = i => (blobM.size && [...blobM.keys()].some(f => so(f) === i) ? SO_VOI
      : [...nhanhKhac()].find(([, ds]) => ds.some(f => so(f) === i))?.[0]);
    const coChu = hoi.map(i => (giu(i) ? `${bonSo(i)} (${giu(i)} giữ)` : bonSo(i)));
    const trenGoc = hoi.every(i => giu(i) === SO_VOI);
    bao(`Số bị hở: ${gon(coChu)}` + (trenGoc ? ` — các số này có trên ${SO_VOI}: gộp ${SO_VOI} vào nhánh` : ''));
  } else {
    console.log(`  \x1b[32m✓\x1b[0m Số liền mạch 0001–${bonSo(soLonNhat(H))}${daBiet.size ? ` (trừ số hở đã biết: ${[...daBiet].map(bonSo).join(', ')})` : ''}`);
  }
}

// ===========================================================================
// File đã có y nguyên trên SO_VOI thì đã được kiểm ở lượt của SO_VOI — chỉ đọc file mới / đã đổi.
const canDoc = H.filter(f => TEN_HOP_LE.test(f) && blobM.get(f) !== blobH.get(f));
console.log(`\n\x1b[1m2 · QUY ƯỚC TRONG FILE (${canDoc.length} file mới hoặc đã đổi so với ${CO_SO_VOI ? SO_VOI : 'không có gì'})\x1b[0m`);
{
  const thieuPath = [], gioUtc = [];
  // Tên cột / biến timestamptz khai ở MỌI migration của nguồn đang kiểm (file mới dùng cột của file cũ).
  const tenTs = tenTimestamptz(H.filter(f => TEN_HOP_LE.test(f)).map(f => docTep(NHANH, f)));
  for (const f of canDoc) {
    const sql = docTep(NHANH, f).replace(/--[^\n]*/g, '');
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
    const thay = so(f) > MOC_GIO_VN ? timNgayUtc(sql, tenTs) : [];
    if (thay.length) gioUtc.push(`${f}: ${[...new Set(thay)].slice(0, 3).join(', ')}`);
  }
  ok('Mọi hàm security definer có set search_path', thieuPath.length === 0, thieuPath.slice(0, 5).join(' | '));
  ok(`Sau ${bonSo(MOC_GIO_VN)} không cắt ngày theo UTC (current_date, now()::date, <cột timestamptz>::date — Supabase chạy UTC) — dùng hom_nay_vn() / ngay_vn()`,
     gioUtc.length === 0, gioUtc.join(' | '));
}

// ===========================================================================
console.log(`\n\x1b[1m3 · SO VỚI ${SO_VOI}\x1b[0m`);
let tomTat = '';
if (!CO_SO_VOI) {
  bao(`Không có ref ${SO_VOI} — bỏ qua phần so sánh (chạy git fetch origin để kiểm đủ)`);
} else {
  const M = [...blobM.keys()].sort();
  const dauNhanh = NHANH ?? 'HEAD';
  let B = new Set(M);
  try { B = new Set(blobTaiRef(git(['merge-base', dauNhanh, SO_VOI]).trim()).keys()); }
  catch { bao(`Không tìm được điểm rẽ nhánh giữa ${dauNhanh} và ${SO_VOI} — coi như rẽ từ ${SO_VOI}`); }
  const choSua = new Set(DUOC_SUA.map(x => x.tep));

  const daSua = M.filter(f => blobH.has(f) && !choSua.has(f) && blobH.get(f) !== blobM.get(f));
  ok(`Không sửa migration đã có trên ${SO_VOI} (${M.length} file)`, daSua.length === 0,
     daSua.length ? `${gon(daSua)} — file này đã/sắp chạy trên production; muốn đổi thì viết migration MỚI` : '');

  const daXoa = [...B].filter(f => !blobH.has(f)).sort();
  ok('Không xóa hay đổi tên migration đã có từ điểm rẽ nhánh', daXoa.length === 0, gon(daXoa));

  const chamHon = M.filter(f => !B.has(f) && !blobH.has(f));
  if (chamHon.length) bao(`Nhánh chậm hơn ${SO_VOI} ${chamHon.length} migration (${gon(chamHon)}) — gộp ${SO_VOI} vào nhánh trước khi mở PR`);

  const lonM = soLonNhat(M);
  const moi = H.filter(f => !blobM.has(f));
  const soNho = moi.filter(f => TEN_HOP_LE.test(f) && so(f) <= lonM);
  ok(`Migration mới (${moi.length ? gon(moi) : 'không có'}) có số lớn hơn ${bonSo(lonM)} của ${SO_VOI}`,
     soNho.length === 0,
     soNho.length ? `${soNho.join(', ')} — đổi thành ${bonSo(soTiep())} trở đi (npm run so-migration)` : '');

  tomTat = moi.length ? `Migration mới: ${moi.join(', ')}` : 'Không có migration mới';
}

// ===========================================================================
if (co('--canh-bao-nhanh-khac') && CO_SO_VOI) {
  console.log('\n\x1b[1m4 · NHÁNH KHÁC ĐANG DÙNG CÙNG SỐ?\x1b[0m');
  const cuaTa = new Map(H.filter(f => !blobM.has(f) && TEN_HOP_LE.test(f)).map(f => [so(f), f]));
  let hienTai = '';
  try { hienTai = git(['rev-parse', '--abbrev-ref', 'HEAD']).trim(); } catch { /* HEAD rời */ }
  let dung = 0;
  for (const [r, ds] of nhanhKhac()) {
    if (r === SO_VOI || r === `origin/${hienTai}` || (NHANH && r === NHANH)) continue;
    for (const f of ds) {
      if (blobM.has(f) || !TEN_HOP_LE.test(f)) continue;
      const ta = cuaTa.get(so(f));
      if (ta && ta !== f) { dung++; bao(`${r} cũng dùng số ${bonSo(so(f))} (${f}) — nhánh nào gộp sau phải đổi số`); }
    }
  }
  if (!dung) console.log('  \x1b[32m✓\x1b[0m Không nhánh nào khác dùng cùng số');
}

// ===========================================================================
const tiep = bonSo(soTiep());
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
