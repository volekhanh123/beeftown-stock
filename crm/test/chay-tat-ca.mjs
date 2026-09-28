/**
 * BEEFTOWN — CHẠY MỌI FILE KIỂM THỬ
 * =================================
 *
 *     npm test                                  (= node test/chay-tat-ca.mjs)
 *     node test/chay-tat-ca.mjs --tat-ca        chạy hết rồi mới báo, kể cả khi có file hỏng (CI dùng)
 *     node test/chay-tat-ca.mjs --song-song 1   chạy lần lượt từng file
 *     node test/chay-tat-ca.mjs --chi-tiet      in toàn bộ từng dòng ✓ của mọi file
 *
 * Tự tìm chay-test.mjs và mọi test-*.mjs trong thư mục này. Thêm file test mới
 * KHÔNG phải sửa package.json — file mới tự được chạy, ở máy lẫn trên CI.
 *
 * Mỗi file chạy trong một tiến trình riêng với database PGlite riêng, nên chạy
 * song song được. Mặc định: ở máy dừng nhận file mới ngay khi có file hỏng (như
 * chuỗi && cũ); --tat-ca chạy hết để một lượt CI báo được mọi chỗ hỏng.
 *
 * Cuối cùng in tổng số kiểm tra của cả bộ — README không ghi số đếm tay nữa, vì
 * số đếm tay luôn cũ (README từng ghi 1374 khi bộ thật đã hơn 4.000).
 */

import { readdirSync, appendFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { availableParallelism } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const THU_MUC = dirname(fileURLToPath(import.meta.url));

/** File .mjs trong thư mục test mà KHÔNG phải bài test — thư viện dùng chung và bộ chạy. */
const THU_VIEN = new Set([
  'chay-tat-ca.mjs', 'chay-kho.mjs', 'kho-chung.mjs', 'dinh-chu.mjs', 'kiem-nn.mjs',
  'quet-chu-viet.mjs', 'dong-ho-gia.mjs',
]);

/** Chạy trước: rẻ nhất và hay hỏng nhất khi gộp nhánh; rồi thứ tự của chuỗi && cũ. */
const TRUOC = [
  'kiem-migration.mjs', 'test-quy-trinh.mjs',
  // Chạy lâu nhất (~75 giây: tạo rồi xoá 5 tuần dữ liệu kho) — bắt đầu sớm để không kéo dài cả lượt.
  'test-kho-du-lieu-thu.mjs',
  'chay-test.mjs', 'test-phan-quyen.mjs', 'test-an-toan.mjs', 'test-cong-bo.mjs', 'test-thuc-don.mjs',
  'test-tuyen-dung.mjs', 'test-cong-khai.mjs', 'test-dat-noi-dung.mjs', 'test-ban-dich.mjs',
  'test-hop-dong-web.mjs', 'test-noi-bo-tieng-anh.mjs',
  ...['quyen', 'nhap', 'ma-vach', 'pha-loc', 'xuat-kiem-ke', 'cong-no', 'can'].map(t => `test-kho-${t}.mjs`),
];

const thamSo = process.argv.slice(2);
const TAT_CA = thamSo.includes('--tat-ca');
const CHI_TIET = thamSo.includes('--chi-tiet');
const iSs = thamSo.indexOf('--song-song');
const SONG_SONG = Math.max(1, iSs >= 0 ? Number(thamSo[iSs + 1]) || 1 : Math.min(4, availableParallelism()));
const TRONG_CI = !!process.env.GITHUB_ACTIONS;
const GIOI_HAN_MS = 10 * 60 * 1000;

const boMau = s => s.replace(/\x1b\[[0-9;]*m/g, '');
const giay = ms => (ms / 1000).toFixed(1).replace('.', ',');

// ---------------------------------------------------------------------------
// Tìm file
// ---------------------------------------------------------------------------
const tatCaMjs = readdirSync(THU_MUC).filter(f => f.endsWith('.mjs'));
const la = f => f === 'chay-test.mjs' || f === 'kiem-migration.mjs' || /^test-.+\.mjs$/.test(f);
const lac = tatCaMjs.filter(f => !la(f) && !THU_VIEN.has(f));
if (lac.length) {
  console.error(`\x1b[31m\x1b[1mFile .mjs không rõ vai trò: ${lac.join(', ')}\x1b[0m`);
  console.error('Bài test phải tên test-*.mjs để được chạy; thư viện dùng chung thì thêm vào THU_VIEN trong chay-tat-ca.mjs.');
  process.exit(1);
}
const coFile = tatCaMjs.filter(la);
const thuTu = [...TRUOC.filter(f => coFile.includes(f)), ...coFile.filter(f => !TRUOC.includes(f)).sort()];

// ---------------------------------------------------------------------------
// Chạy
// ---------------------------------------------------------------------------
/** Đọc dòng tổng mà mọi file in ra ở cuối. */
function docTong(ra) {
  const s = boMau(ra);
  const dat = [...s.matchAll(/TẤT CẢ (\d+) KIỂM TRA/g)].pop();
  if (dat) return { soKiem: Number(dat[1]), soHong: 0 };
  const hong = [...s.matchAll(/(\d+) HỎNG \/ (\d+) KIỂM TRA/g)].pop();
  if (hong) return { soKiem: Number(hong[2]), soHong: Number(hong[1]) };
  return { soKiem: null, soHong: null };
}

function chayMot(f) {
  return new Promise(xong => {
    const batDau = Date.now();
    const con = spawn(process.execPath, [join(THU_MUC, f)], {
      cwd: join(THU_MUC, '..'), env: { ...process.env, FORCE_COLOR: '1' },
    });
    let ra = '';
    con.stdout.on('data', d => { ra += d; });
    con.stderr.on('data', d => { ra += d; });
    const hen = setTimeout(() => { ra += `\nQUÁ ${GIOI_HAN_MS / 60000} PHÚT — dừng file này.\n`; con.kill('SIGKILL'); }, GIOI_HAN_MS);
    con.on('close', (ma, tinHieu) => {
      clearTimeout(hen);
      xong({ f, ma: ma ?? tinHieu, dat: ma === 0, ms: Date.now() - batDau, ra, ...docTong(ra) });
    });
  });
}

function inKetQua(kq) {
  const so = kq.soKiem === null ? '? kiểm tra' : `${kq.soKiem} kiểm tra`;
  const dong = `${kq.dat ? '\x1b[32m✓' : '\x1b[31m✗'} ${kq.f.padEnd(34)}\x1b[0m ${so.padStart(14)}  ${giay(kq.ms).padStart(6)} giây`;
  if (TRONG_CI) {
    console.log(`::group::${boMau(dong)}`);
    console.log(kq.ra.trimEnd());
    console.log('::endgroup::');
    if (!kq.dat) console.log(dong);
  } else {
    console.log(dong);
    if (CHI_TIET || !kq.dat) console.log(kq.ra.trimEnd().split('\n').map(l => '    ' + l).join('\n') + '\n');
  }
  if (TRONG_CI && !kq.dat) {
    const hong = boMau(kq.ra).split('\n').filter(l => /^\s*✗/.test(l));
    for (const l of (hong.length ? hong : [`${kq.f} dừng với mã ${kq.ma}`]).slice(0, 20)) {
      console.log(`::error file=crm/test/${kq.f},title=${kq.f}::${l.trim().replace(/^✗\s*/, '').slice(0, 900)}`);
    }
  }
}

const batDau = Date.now();
const ketQua = [];
const hang = [...thuTu];
let dungNhan = false;

console.log(`\x1b[1mBEEFTOWN — CHẠY ${thuTu.length} FILE KIỂM THỬ (song song ${SONG_SONG}${TAT_CA ? ', chạy hết' : ''})\x1b[0m\n`);

async function tho() {
  while (hang.length && !dungNhan) {
    const kq = await chayMot(hang.shift());
    ketQua.push(kq);
    inKetQua(kq);
    if (!kq.dat && !TAT_CA) dungNhan = true;
  }
}
await Promise.all(Array.from({ length: SONG_SONG }, tho));

// ---------------------------------------------------------------------------
// Tổng kết
// ---------------------------------------------------------------------------
const hong = ketQua.filter(k => !k.dat);
const tongKiem = ketQua.reduce((t, k) => t + (k.soKiem ?? 0), 0);
const chuaChay = thuTu.length - ketQua.length;
const tongMs = Date.now() - batDau;

// Giờ Việt Nam sang ngày mới lúc 17:00 UTC. Test tính "hôm nay" ở đầu lượt rồi so ở cuối
// lượt có thể hỏng oan nếu lượt chạy vắt qua mốc đó.
const vn = ms => new Date(ms + 7 * 3600e3).toISOString().slice(0, 10);
const vatNuaDem = vn(batDau) !== vn(Date.now());

console.log('\n' + '='.repeat(60));
if (!hong.length && !chuaChay) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${tongKiem} KIỂM TRA TRÊN ${ketQua.length} FILE ĐỀU ĐẠT\x1b[0m (${giay(tongMs)} giây)`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong.length} FILE HỎNG / ${ketQua.length} FILE ĐÃ CHẠY\x1b[0m (${tongKiem} kiểm tra, ${giay(tongMs)} giây)`);
  for (const k of hong) console.log(`  \x1b[31m· ${k.f}${k.soHong ? ` — ${k.soHong} kiểm tra hỏng` : ` — dừng với mã ${k.ma}`}\x1b[0m`);
  if (chuaChay) console.log(`  ${chuaChay} file chưa chạy vì dừng ở file hỏng đầu tiên (chạy hết: --tat-ca)`);
}
if (vatNuaDem) {
  console.log('\x1b[33mLượt chạy vắt qua nửa đêm giờ Việt Nam — nếu hỏng ở kiểm tra ngày giờ, chạy lại một lần để phân biệt.\x1b[0m');
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const dong = [
    `### Kiểm thử database, kho, Zalo, Messenger (${process.env.TZ || 'TZ máy'})`, '',
    hong.length ? `❌ **${hong.length} file hỏng** / ${ketQua.length} file` : `✅ **${tongKiem} kiểm tra trên ${ketQua.length} file đều đạt**`,
    `(${giay(tongMs)} giây, song song ${SONG_SONG})`, '',
    '| File | Kết quả | Số kiểm tra | Giây |', '|---|---|---:|---:|',
    ...[...ketQua].sort((a, b) => Number(a.dat) - Number(b.dat) || a.f.localeCompare(b.f))
      .map(k => `| \`${k.f}\` | ${k.dat ? '✅' : `❌ ${k.soHong ?? ''}`} | ${k.soKiem ?? '?'} | ${giay(k.ms)} |`),
    '',
  ];
  try { appendFileSync(process.env.GITHUB_STEP_SUMMARY, dong.join('\n') + '\n'); } catch { /* không ghi được tóm tắt thì thôi */ }
}

process.exit(hong.length || chuaChay ? 1 : 0);
