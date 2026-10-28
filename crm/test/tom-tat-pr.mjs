/**
 * BEEFTOWN — TÓM TẮT MỘT NHÁNH CHO MÔ TẢ PR
 * =========================================
 *
 *     npm run tom-tat-pr                        so nhánh đang mở với origin/main (từ điểm rẽ nhánh)
 *     node test/tom-tat-pr.mjs --so-voi <ref>   so với ref khác
 *     node test/tom-tat-pr.mjs --den <ref>      tóm tắt ref khác thay vì HEAD (CI: commit gộp của PR)
 *
 * In Markdown: khu đã đụng và cỡ thay đổi, migration mới (chạy riêng? có câu delete?), hàm SQL mới / thay
 * thân và chỗ còn thiếu, kiểm thử mới, và VIỆC SAU KHI GỘP (chạy migration, deploy web, Beeftown Cân, Mini
 * App). Chỉ cần node và git.
 *
 * Dùng hai chỗ:
 *   · phiên làm PR chép mục "Sau khi gộp" vào "Tóm tắt cho Khánh" của mẫu PR — không phải tự nhớ thứ tự;
 *   · workflow .github/workflows/mo-ta-pr.yml đăng nguyên bản in ra thành MỘT comment trên PR, sửa lại mỗi
 *     lần đẩy commit. Mô tả PR viết tay có thể cũ đi (đánh lại số migration sau khi gộp main); comment này
 *     luôn khớp commit mới nhất.
 *
 * Mọi điều in ra là ĐỌC TỪ DIFF, không đoán ý người viết: "Sau khi gộp" chỉ liệt kê việc mà loại file đã đổi
 * bắt buộc phải làm. Việc riêng của từng PR (bật công tắc, thêm bí mật Worker…) vẫn phải viết trong mô tả.
 */

import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { banCuoiTheoTen, soHaiBan } from './doc-sql.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const THU_MUC_MIGRATION = 'crm/supabase/migrations/';

/** PR đổi nhiều hơn chừng này dòng mã + SQL (không tính kiểm thử, tài liệu) thì nhắc tách — CLAUDE.md, "Chia việc". */
export const NGUONG_PR_LON = 1500;

/** Dấu để workflow tìm lại đúng comment của mình mà sửa, không đăng thêm. */
export const DAU_COMMENT = '<!-- tom-tat-pr -->';

// ---------------------------------------------------------------------------
// git
// ---------------------------------------------------------------------------

function git(args, { im = false } = {}) {
  try {
    return execFileSync('git', args, { cwd: GOC, encoding: 'utf8', maxBuffer: 256 << 20, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    if (im) return '';
    throw e;
  }
}

const thamSo = process.argv.slice(2);
const giaTri = ten => { const i = thamSo.indexOf(ten); return i >= 0 ? thamSo[i + 1] : undefined; };

// ---------------------------------------------------------------------------
// Xếp file vào khu
// ---------------------------------------------------------------------------

/** [khu, mẫu đường dẫn, loại] — loại: ma (mã chạy thật), sql, test, tai-lieu. Mẫu đầu tiên khớp thì thắng. */
export const KHU = [
  ['Database (migration)', /^crm\/supabase\/migrations\//, 'sql'],
  ['Kiểm thử', /^(crm\/test|can-app\/test|web\/kiem-tra)\//, 'test'],
  ['Tài liệu, skill, mẫu', /(\.md$|^\.claude\/|^\.github\/(?!workflows\/))/, 'tai-lieu'],
  ['Kho (web)', /^web\/(src\/(pages\/noi-bo\/kho|lib\/kho|components\/kho)|public\/kho)\//, 'ma'],
  ['Webhook (iPOS, Zalo, Messenger)', /^web\/src\/pages\/hook\//, 'ma'],
  ['Nội bộ /noi-bo', /^web\/src\/pages\/noi-bo\//, 'ma'],
  ['Trang công khai', /^web\/src\/pages\//, 'ma'],
  ['Web — thư viện dùng chung', /^web\/src\/lib\//, 'ma'],
  ['Web — giao diện (component, layout, CSS)', /^web\/src\/(components|layouts|styles)\//, 'ma'],
  ['Web — ảnh, file tĩnh', /^web\/public\//, 'ma'],
  ['Web — cấu hình, công cụ', /^web\//, 'ma'],
  ['Beeftown Cân', /^can-app\/(src|scripts)\//, 'ma'],
  ['Mini App Zalo', /^mini-app\/(src|scripts|app-config\.json|index\.html|vite\.config)/, 'ma'],
  ['Sao lưu', /^crm\/sao-luu\//, 'ma'],
  ['CI (GitHub Actions)', /^\.github\/workflows\//, 'ma'],
  ['Khác', /./, 'ma'],
];

export function xepKhu(tep) {
  for (const [ten, mau, loai] of KHU) if (mau.test(tep)) return { ten, loai };
  return { ten: 'Khác', loai: 'ma' };
}

// ---------------------------------------------------------------------------
// Đọc migration mới
// ---------------------------------------------------------------------------

/** Bỏ chú thích -- và chuỗi '…' để tìm câu lệnh thật (delete trong chú thích hay trong chữ không tính). */
const boChuThichVaChuoi = s => s.replace(/'(?:[^']|'')*'/g, "''").replace(/--[^\n]*/g, '');

export function docMigrationMoi(tep, s) {
  const sach = boChuThichVaChuoi(s);
  return {
    tep,
    so: tep.slice(0, 4),
    themEnum: /alter\s+type\s+\w+\s+add\s+value/i.test(sach),
    coDelete: /\bdelete\s+from\b/i.test(sach),
    coDrop: [...sach.matchAll(/\bdrop\s+(table|column|function|view|type|policy|trigger|index)\s+(?:if\s+exists\s+)?([\w.]+)/gi)]
      .map(m => `${m[1].toLowerCase()} ${m[2]}`),
    bangMoi: [...sach.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?(\w+)/gi)].map(m => m[1]),
    cotMoi: [...sach.matchAll(/alter\s+table\s+(?:only\s+)?(?:public\.)?(\w+)\s+add\s+column\s+(?:if\s+not\s+exists\s+)?(\w+)/gi)]
      .map(m => `${m[1]}.${m[2]}`),
    soDong: s.split('\n').length,
    // Bản cuối trong file (hàm thay hai lần trong cùng file thì tính lần sau).
    ham: [...banCuoiTheoTen(s).values()],
  };
}

// ---------------------------------------------------------------------------
// Tóm tắt
// ---------------------------------------------------------------------------

/**
 * Dựng tóm tắt từ dữ liệu đã đọc (tách khỏi git để kiểm thử được).
 * @param tep        [{ tep, trangThai: 'A'|'M'|'D'|'R', them, bot }]
 * @param migMoi     kết quả docMigrationMoi cho từng migration THÊM MỚI
 * @param hamDaCo    Map tên hàm → bản cuối ở điểm rẽ nhánh ({ cau }) — hàm mới hay thay thân, thay đổi bao nhiêu dòng
 * @param nhacTrongTest  (tenHam) => true nếu file kiểm thử ở commit mới nhắc tên
 * @param phienBanCan    { cu, moi } — PHIEN_BAN của Beeftown Cân ở hai đầu (null nếu không đọc được)
 * @param tepCan     Set file ngoài can-app/ mà Beeftown Cân import (đóng gói vào .exe)
 * @param soBan      (cũ, mới) => { them, bot } — mặc định git diff --no-index
 */
export function tomTat({ tep, migMoi, hamDaCo, nhacTrongTest, phienBanCan, tepCan = new Set(), soVoi, soBan = soHaiBan }) {
  const dong = [];
  // Migration thay thân chép nguyên văn bản cũ rồi vá: đếm phần THẬT SỰ đổi so với bản trước của từng hàm.
  for (const m of migMoi) {
    let sqlThat = m.soDong;
    for (const h of m.ham) {
      const cu = hamDaCo.get(h.ten);
      if (!cu) continue;
      const { them, bot } = soBan(cu.cau, h.cau);
      h.doi = { them, bot };
      sqlThat += them + bot - h.cau.split('\n').length;
    }
    m.sqlThat = Math.max(0, sqlThat);
  }
  const khu = new Map();
  const cong = { ma: 0, sql: 0, test: 0, 'tai-lieu': 0 };
  for (const f of tep) {
    const { ten, loai } = xepKhu(f.tep);
    if (!khu.has(ten)) khu.set(ten, { so: 0, them: 0, bot: 0 });
    const k = khu.get(ten);
    k.so++; k.them += f.them; k.bot += f.bot;
    cong[loai] += f.them + f.bot;
  }
  const co = ten => khu.has(ten);
  const doiWeb = [...khu.keys()].some(k => k.startsWith('Web') || ['Kho (web)', 'Nội bộ /noi-bo', 'Trang công khai',
    'Webhook (iPOS, Zalo, Messenger)'].includes(k));
  // Beeftown Cân đóng gói cả file web/src/lib mà nó import (can-tma.ts, gio-vn.ts…): đổi những file đó là đổi .exe.
  const libCanDoi = tep.filter(f => tepCan.has(f.tep)).map(f => f.tep);
  const doiCan = co('Beeftown Cân') || libCanDoi.length > 0;
  const doiMini = co('Mini App Zalo');
  const suaMigCu = tep.filter(f => f.tep.startsWith(THU_MUC_MIGRATION) && f.trangThai !== 'A');

  dong.push(DAU_COMMENT);
  dong.push(`### 🧾 Máy tóm tắt PR`);
  dong.push('');
  dong.push(`So với \`${soVoi}\`. Đọc từ diff bằng \`cd crm && npm run tom-tat-pr\` — comment này tự sửa lại mỗi lần đẩy commit, không cần trả lời.`);
  dong.push('');
  if (!tep.length) {
    dong.push('Nhánh chưa có thay đổi nào.');
    return dong.join('\n');
  }

  // ---- Sau khi gộp ----
  const sau = [];
  if (migMoi.length) {
    const ds = migMoi.map(m => `\`${m.tep}\``).join(', ');
    sau.push(`**Chạy migration** ${ds} lên project Beeftown — theo thứ tự số, nguyên cả file, ở SQL Editor`
      + ` (README gốc, mục "Chạy migration lên production"). Xong chạy \`npm run doi-chieu\`: phải báo KHỚP.`);
    for (const m of migMoi.filter(x => x.themEnum)) {
      sau.push(`\`${m.so}\` thêm giá trị enum: **chạy RIÊNG**, một mình, rồi mới chạy file sau nó (crm/README.md, "Thứ tự chạy có ràng buộc").`);
    }
    for (const m of migMoi.filter(x => x.coDelete)) {
      sau.push(`\`${m.so}\` có câu \`delete\`: đừng chạy qua Supabase MCP khi không có người bấm xác nhận — dùng SQL Editor hoặc psql.`);
    }
  }
  if (doiWeb) {
    sau.push(`**Deploy web** khi CI của main xanh: \`cd web && npm run deploy\`${migMoi.length ? ' — SAU khi chạy migration (web mới gọi hàm mới)' : ''}.`);
  }
  const nangBanCan = !!(phienBanCan?.moi && phienBanCan.cu !== phienBanCan.moi);
  if (nangBanCan) {
    sau.push(`**Beeftown Cân ${phienBanCan.moi}** (trước: ${phienBanCan.cu ?? '?'}): CI của main tự đóng gói và tạo Release; máy quầy bấm Cập nhật.`);
  }
  if (doiMini) {
    sau.push('**Mini App Zalo**: Khánh đưa bản mới lên (bấm đúp `mini-app/dua-len-zalo.cmd` trên máy Windows) — CI không đưa lên Zalo.');
  }
  dong.push('#### Sau khi gộp');
  dong.push('');
  if (sau.length) sau.forEach((s, i) => dong.push(`${i + 1}. ${s}`));
  else dong.push('Không cần làm gì: PR chỉ đổi kiểm thử, tài liệu hoặc CI.');
  dong.push('');

  // ---- Cần chú ý ----
  const chuY = [];
  if (suaMigCu.length) {
    chuY.push(`**Sửa migration đã có trên main:** ${suaMigCu.map(f => `\`${f.tep}\``).join(', ')} — không được (CLAUDE.md mục 8). Viết migration mới.`);
  }
  for (const m of migMoi) {
    for (const d of m.coDrop) chuY.push(`\`${m.so}\` xoá \`${d}\` — mô tả PR phải nói vì sao, và thứ gì còn dùng nó.`);
    for (const h of m.ham.filter(h => h.definer && !h.searchPath)) {
      chuY.push(`\`${h.ten}\` (\`${m.so}\`) là security definer nhưng thiếu \`set search_path\`.`);
    }
    for (const h of m.ham.filter(h => h.doi && h.doi.them + h.doi.bot === 0)) {
      chuY.push(`\`${h.ten}\` (\`${m.so}\`) chép lại y hệt bản trước — không đổi gì, bỏ khỏi migration cho gọn.`);
    }
    for (const h of m.ham.filter(h => !hamDaCo.has(h.ten) && !nhacTrongTest(h.ten))) {
      chuY.push(`Hàm mới \`${h.ten}\` (\`${m.so}\`) chưa file kiểm thử nào nhắc tên (test-quy-trinh.mjs sẽ đỏ).`);
    }
  }
  if (!nangBanCan && co('Beeftown Cân')) {
    chuY.push(`Mã Beeftown Cân đổi nhưng \`PHIEN_BAN\` (can-app/src/main.ts) vẫn ${phienBanCan?.moi ?? '?'}: CI không tạo Release,`
      + ' máy quầy không thấy bản mới. Cố ý thì ghi lý do trong mô tả.');
  } else if (!nangBanCan && libCanDoi.length) {
    chuY.push(`Beeftown Cân đóng gói cả ${libCanDoi.map(f => `\`${f.replace('web/src/lib/', '')}\``).join(', ')} (web/src/lib) — PR này đổi`
      + ` các file đó nhưng \`PHIEN_BAN\` vẫn ${phienBanCan?.moi ?? '?'}, máy quầy giữ bản cũ. Chỉ cần nâng bản khi máy quầy cần thay đổi này.`);
  }
  const sqlThat = migMoi.reduce((t, m) => t + m.sqlThat, 0) + tep.filter(f => xepKhu(f.tep).loai === 'sql' && f.trangThai !== 'A')
    .reduce((t, f) => t + f.them + f.bot, 0);
  const maVaSql = cong.ma + sqlThat;
  if (maVaSql > NGUONG_PR_LON) {
    chuY.push(`**PR lớn:** ${maVaSql.toLocaleString('vi-VN')} dòng mã + SQL thật sự đổi (ngưỡng ${NGUONG_PR_LON.toLocaleString('vi-VN')};`
      + ' không tính kiểm thử, tài liệu, phần thân hàm chép lại nguyên văn). Tách được thì tách (CLAUDE.md, "Chia việc thành PR").');
  }
  if (chuY.length) {
    dong.push('#### Cần chú ý');
    dong.push('');
    for (const c of chuY) dong.push(`- ${c}`);
    dong.push('');
  }

  // ---- Khu đã đụng ----
  dong.push('#### Khu đã đụng');
  dong.push('');
  dong.push('| Khu | File | Dòng thêm / bớt |');
  dong.push('|---|---:|---:|');
  for (const [ten, k] of [...khu].sort((a, b) => (b[1].them + b[1].bot) - (a[1].them + a[1].bot))) {
    dong.push(`| ${ten} | ${k.so} | +${k.them.toLocaleString('vi-VN')} / −${k.bot.toLocaleString('vi-VN')} |`);
  }
  dong.push('');
  dong.push(`Cỡ: ${cong.ma.toLocaleString('vi-VN')} dòng mã, ${cong.sql.toLocaleString('vi-VN')} dòng SQL`
    + (sqlThat < cong.sql ? ` (thật sự đổi ${sqlThat.toLocaleString('vi-VN')} — còn lại là thân hàm chép nguyên văn)` : '') + ','
    + ` ${cong.test.toLocaleString('vi-VN')} dòng kiểm thử, ${cong['tai-lieu'].toLocaleString('vi-VN')} dòng tài liệu.`);
  dong.push('');

  // ---- Migration ----
  if (migMoi.length) {
    dong.push('#### Migration mới');
    dong.push('');
    for (const m of migMoi) {
      const moi = m.ham.filter(h => !hamDaCo.has(h.ten)).map(h => h.ten);
      const thay = m.ham.filter(h => hamDaCo.has(h.ten)).map(h => `${h.ten}\` (+${h.doi.them} / −${h.doi.bot})`);
      const phan = [];
      if (m.bangMoi.length) phan.push(`bảng mới ${m.bangMoi.map(b => `\`${b}\``).join(', ')}`);
      if (m.cotMoi.length) phan.push(`cột mới ${m.cotMoi.map(c => `\`${c}\``).join(', ')}`);
      if (moi.length) phan.push(`hàm mới ${moi.map(h => `\`${h}\``).join(', ')}`);
      if (thay.length) phan.push(`thay thân ${thay.map(h => `\`${h}`).join(', ')}`);
      dong.push(`- \`${m.tep}\`${phan.length ? ': ' + phan.join('; ') : ''}`);
    }
    if (migMoi.some(m => m.ham.some(h => h.doi))) {
      dong.push('');
      dong.push('Hàm thay thân đổi gì so với bản trước: `cd crm && npm run tim -- <tên hàm> --khac`.');
    }
    dong.push('');
  }

  // ---- Kiểm thử mới ----
  const testMoi = tep.filter(f => f.trangThai === 'A' && xepKhu(f.tep).loai === 'test');
  if (testMoi.length) {
    dong.push('#### Kiểm thử mới');
    dong.push('');
    for (const f of testMoi) dong.push(`- \`${f.tep}\` (+${f.them.toLocaleString('vi-VN')} dòng)`);
    dong.push('');
  }
  return dong.join('\n');
}

// ---------------------------------------------------------------------------
// Chạy
// ---------------------------------------------------------------------------

/** File ngoài can-app/ mà mã Beeftown Cân import, tính cả import lồng nhau (đọc ở ref `den`). */
function tepCanImport(den) {
  const ra = new Set();
  const hang = git(['ls-tree', '--name-only', `${den}:can-app/src`], { im: true }).split('\n')
    .filter(f => f.endsWith('.ts')).map(f => `can-app/src/${f}`);
  const daDoc = new Set();
  while (hang.length) {
    const f = hang.pop();
    if (daDoc.has(f)) continue;
    daDoc.add(f);
    const s = git(['show', `${den}:${f}`], { im: true });
    for (const m of s.matchAll(/\bfrom\s+'(\.{1,2}\/[^']+)'/g)) {
      const dich = join(dirname(f), m[1]).replace(/\\/g, '/');
      if (dich.startsWith('can-app/')) continue;
      ra.add(dich);
      hang.push(dich);
    }
  }
  return ra;
}

const laFileChinh = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (laFileChinh) {
  const soVoi = giaTri('--so-voi') ?? 'origin/main';
  const den = giaTri('--den') ?? 'HEAD';
  if (!git(['rev-parse', '--verify', '--quiet', soVoi], { im: true }).trim()) {
    console.error(`Không có ref "${soVoi}". Chạy: git fetch origin main`);
    process.exit(2);
  }
  const goc = git(['merge-base', soVoi, den]).trim();

  const trangThai = new Map(git(['diff', '--name-status', '--no-renames', goc, den]).split('\n').filter(Boolean)
    .map(d => { const [tt, f] = d.split('\t'); return [f, tt[0]]; }));
  const tep = git(['diff', '--numstat', '--no-renames', goc, den]).split('\n').filter(Boolean).map(d => {
    const [them, bot, f] = d.split('\t');
    // File nhị phân (ảnh): numstat ghi "-".
    return { tep: f, trangThai: trangThai.get(f) ?? 'M', them: them === '-' ? 0 : Number(them), bot: bot === '-' ? 0 : Number(bot) };
  });

  const migMoi = tep.filter(f => f.tep.startsWith(THU_MUC_MIGRATION) && f.trangThai === 'A' && f.tep.endsWith('.sql'))
    .map(f => docMigrationMoi(f.tep.slice(THU_MUC_MIGRATION.length), git(['show', `${den}:${f.tep}`])))
    .sort((a, b) => a.tep.localeCompare(b.tep));

  // Hàm đã có ở điểm rẽ nhánh: đọc mọi migration ở đó.
  const hamDaCo = new Map();
  const dsCu = git(['ls-tree', '--name-only', `${goc}:${THU_MUC_MIGRATION}`], { im: true }).split('\n').filter(f => f.endsWith('.sql'));
  if (dsCu.length) {
    // git cat-file --batch: đọc 100+ file một lần thay vì 100+ lần gọi git show.
    const vao = dsCu.map(f => `${goc}:${THU_MUC_MIGRATION}${f}`).join('\n') + '\n';
    const ra = execFileSync('git', ['cat-file', '--batch'], { cwd: GOC, input: vao, maxBuffer: 256 << 20 }).toString('utf8');
    for (const [ten, h] of banCuoiTheoTen(ra)) hamDaCo.set(ten, h);
  }

  const nhacTrongTest = ten => {
    try { execFileSync('git', ['grep', '-q', '-w', '-F', '-e', ten, den, '--', 'crm/test', 'can-app/test'], { cwd: GOC, stdio: 'ignore' }); return true; }
    catch { return false; }   // git grep -q: mã 1 khi không thấy
  };

  const phienBan = ref => git(['show', `${ref}:can-app/src/main.ts`], { im: true }).match(/const PHIEN_BAN = '([^']+)'/)?.[1] ?? null;
  const phienBanCan = { cu: phienBan(goc), moi: phienBan(den) };

  console.log(tomTat({ tep, migMoi, hamDaCo, nhacTrongTest, phienBanCan, tepCan: tepCanImport(den), soVoi }));
}
