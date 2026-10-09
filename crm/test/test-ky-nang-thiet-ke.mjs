/**
 * BEEFTOWN — SKILL THIẾT KẾ (.claude/skills/thiet-ke-beeftown) KHỚP VỚI MÃ
 * =========================================================================
 *
 *     node test/test-ky-nang-thiet-ke.mjs
 *
 * Skill thiết kế là bản đồ mọi phiên Claude đọc trước khi làm giao diện. Một bản đồ sai còn tệ hơn
 * không có: phiên sau sẽ tin mã màu, tên lớp, tên biểu tượng ghi trong đó. Bất biến:
 *
 *   1. Mọi file của skill được git thấy — .gitignore chặn .claude/ ở mọi cấp và chỉ mở .md của
 *      .claude/skills/ ở gốc; test-quy-trinh.mjs không quét .claude/, nên file bị chặn sẽ lặng lẽ chỉ
 *      nằm trên máy người viết. Cấu hình máy (settings.local.json) vẫn bị chặn.
 *   2. Phần đầu SKILL.md đúng luật skill: name trùng tên thư mục, chữ thường và gạch nối, ≤ 64 ký tự;
 *      description có chữ, ≤ 1024 ký tự. Mọi link tới tham-khao/ có file, mọi file tham-khao/ được
 *      SKILL.md link tới.
 *   3. Mã màu ghi cạnh tên token (`--kem` … `#FBF4E1`) đúng giá trị khai trong web/src/styles; mọi
 *      biến `--…` nhắc tới có khai ở đâu đó trong web/src.
 *   4. Mọi đường dẫn trong dấu `…` bắt đầu bằng web/, crm/, can-app/, .github/ hoặc là file ở gốc repo
 *      đều có thật.
 *   5. Hai danh sách biểu tượng trong skill khớp đúng bộ trong mã (công khai: TenBieuTuong của
 *      BieuTuong.astro; nội bộ, kho: khóa của BIEU_TUONG). Danh mục lớp dùng chung và lớp bề mặt có
 *      trong cong-khai.css.
 *
 * Đỏ ở đây nghĩa là mã đã đổi mà skill chưa theo: sửa skill trong cùng PR, đừng nới kiểm thử.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const TEN_KY_NANG = 'thiet-ke-beeftown';
const KY_NANG = join(GOC, '.claude', 'skills', TEN_KY_NANG);

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — SKILL THIẾT KẾ KHỚP VỚI MÃ');

/** Mọi file dưới một thư mục (đường dẫn đầy đủ). Thư mục không có → []. */
function moiFile(thuMuc) {
  if (!existsSync(thuMuc)) return [];
  return readdirSync(thuMuc, { withFileTypes: true }).flatMap(d =>
    d.isDirectory() ? moiFile(join(thuMuc, d.name)) : [join(thuMuc, d.name)]);
}
const tuGoc = p => relative(GOC, p).split(sep).join('/');
const doc = p => readFileSync(p, 'utf8');

/** git check-ignore theo luật (--no-index: kể cả file đã có trong git). Mã 0 = bị chặn. */
function biChan(duongDan) {
  try { execFileSync('git', ['check-ignore', '-q', '--no-index', duongDan], { cwd: GOC }); return true; }
  catch { return false; }
}

const tepKyNang = moiFile(KY_NANG);
const tepMd = tepKyNang.filter(f => f.endsWith('.md'));
const vanBan = Object.fromEntries(tepMd.map(f => [tuGoc(f), doc(f)]));
const skillMd = vanBan[`.claude/skills/${TEN_KY_NANG}/SKILL.md`] ?? '';

/** Chữ nằm trong dấu `…` một dòng, bỏ khối mã ``` (khối mã có chỗ giữ chỗ như <file>). */
function trongDauHuyen(md) {
  const ngoaiKhoiMa = md.replace(/```[\s\S]*?```/g, '');
  return [...ngoaiKhoiMa.matchAll(/`([^`\n]+)`/g)].map(m => m[1]);
}

// ===========================================================================
await nhom('1 · GIT THẤY MỌI FILE CỦA SKILL; CẤU HÌNH MÁY VẪN BỊ CHẶN', async () => {
  ok(`.claude/skills/${TEN_KY_NANG}/SKILL.md có mặt`, existsSync(join(KY_NANG, 'SKILL.md')));
  ok('skill chỉ gồm file .md (.gitignore chỉ mở .md của .claude/skills/)',
     tepKyNang.length > 0 && tepKyNang.length === tepMd.length,
     tepKyNang.filter(f => !f.endsWith('.md')).map(tuGoc).join(', '));
  const bi = tepKyNang.map(tuGoc).filter(biChan);
  ok(`${tepKyNang.length} file của skill không bị .gitignore chặn`, tepKyNang.length > 0 && bi.length === 0,
     bi.length ? `${bi.join(', ')} — mở bằng dòng !/.claude/skills/… đứng sau **/.claude/**` : '');
  for (const f of ['.claude/settings.local.json', '.claude/settings.json', 'web/.claude/settings.local.json',
                   'crm/.claude/skills/x/SKILL.md', `.claude/skills/${TEN_KY_NANG}/anh.png`]) {
    ok(`${f} vẫn bị .gitignore chặn`, biChan(f));
  }
});

// ===========================================================================
await nhom('2 · PHẦN ĐẦU SKILL.md, LINK TỚI tham-khao/', async () => {
  const dau = skillMd.match(/^---\n([\s\S]*?)\n---\n/);
  ok('SKILL.md mở đầu bằng khối --- name / description ---', !!dau);
  const truong = Object.fromEntries((dau?.[1] ?? '').split('\n')
    .map(d => d.match(/^([a-z_-]+):\s*(.*)$/)).filter(Boolean).map(m => [m[1], m[2].trim()]));
  ok(`name là "${TEN_KY_NANG}" — trùng tên thư mục`, truong.name === TEN_KY_NANG, truong.name);
  ok('name chỉ chữ thường, số, gạch nối, ≤ 64 ký tự', /^[a-z0-9-]{1,64}$/.test(truong.name ?? ''));
  ok('description có chữ, ≤ 1024 ký tự', !!truong.description && truong.description.length <= 1024,
     `${truong.description?.length ?? 0} ký tự`);

  const thamKhao = tepMd.map(tuGoc).filter(f => f.includes('/tham-khao/'));
  const link = new Set([...skillMd.matchAll(/\]\((tham-khao\/[^)\s#]+)\)/g)].map(m => m[1]));
  const thieu = [...link].filter(l => !existsSync(join(KY_NANG, l)));
  ok(`${link.size} link trong SKILL.md tới tham-khao/ đều có file`, link.size > 0 && thieu.length === 0, thieu.join(', '));
  const moCoi = thamKhao.filter(f => !link.has(f.split(`${TEN_KY_NANG}/`)[1]));
  ok(`${thamKhao.length} file tham-khao/ đều được SKILL.md link tới (không file mồ côi)`, moCoi.length === 0, moCoi.join(', '));
});

// ===========================================================================
await nhom('3 · MÃ MÀU VÀ BIẾN CSS GHI TRONG SKILL CÓ THẬT, ĐÚNG GIÁ TRỊ', async () => {
  const tepMa = moiFile(SRC).filter(f => /\.(css|astro)$/.test(f));
  const maNguon = tepMa.map(doc).join('\n');
  /** Giá trị hex khai cho mỗi biến, gom từ mọi file CSS (một biến có thể khai ở nhiều bề mặt). */
  const giaTri = new Map();
  for (const f of tepMa.filter(f => f.endsWith('.css'))) {
    for (const [, ten, hex] of doc(f).matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\b/g)) {
      if (!giaTri.has(ten)) giaTri.set(ten, new Set());
      giaTri.get(ten).add(hex.toUpperCase());
    }
  }
  // Hai cách ghi một cặp: dòng bảng mở bằng token (| `--kem` | `#FBF4E1` |), hoặc liền nhau trong câu
  // (`--kho-nen` `#FFFCF6`). Bảng màu trạng thái có token chữ và mã nền ở hai ô cạnh nhau — không
  // phải một cặp, nên ô token phải là ô ĐẦU của dòng.
  const CAP = /^\|\s*`(--[a-z0-9-]+)`\s*\|\s*`(#[0-9a-fA-F]{6})`|`(--[a-z0-9-]+)` `(#[0-9a-fA-F]{6})`/gm;
  let soCap = 0;
  for (const [tep, md] of Object.entries(vanBan)) {
    for (const m of md.matchAll(CAP)) {
      const ten = m[1] ?? m[3], hex = m[2] ?? m[4];
      soCap++;
      const co = giaTri.get(ten);
      ok(`${tep}: ${ten} = ${hex.toUpperCase()} đúng như khai trong web/src/styles`, !!co && co.has(hex.toUpperCase()),
         co ? `CSS khai ${[...co].join(' / ')}` : 'không file CSS nào khai biến này bằng mã hex');
    }
  }
  ok('skill có ghi mã màu cạnh token (ít nhất mười cặp)', soCap >= 10, `${soCap} cặp`);

  // Biến là cả một mẩu `--ten` (hoặc nằm trong var(…)). Bỏ qua cờ dòng lệnh trong một câu lệnh
  // (`git status --short`) và ký hiệu đại diện (`--k-*`).
  const bien = new Set(Object.values(vanBan).flatMap(trongDauHuyen).flatMap(s => [
    ...(/^--[a-z][a-z0-9-]*[a-z0-9]$/.test(s) ? [s] : []),
    ...[...s.matchAll(/var\((--[a-z][a-z0-9-]*)/g)].map(m => m[1]),
  ]));
  const khongKhai = [...bien].filter(b => !new RegExp(`${b}\\s*:`).test(maNguon));
  ok(`${bien.size} biến CSS nhắc trong skill đều có khai trong web/src`, bien.size > 0 && khongKhai.length === 0,
     khongKhai.join(', '));
});

// ===========================================================================
await nhom('4 · ĐƯỜNG DẪN GHI TRONG SKILL CÓ THẬT', async () => {
  const fileGoc = new Set(readdirSync(GOC).filter(f => statSync(join(GOC, f)).isFile()));
  const duongDan = new Set(Object.values(vanBan).flatMap(trongDauHuyen)
    .map(s => s.trim())
    .filter(s => /^(web|crm|can-app|\.github)\/[^\s<>*]+$/.test(s) || fileGoc.has(s) || /^Beeftown_[^\s/*]+$/.test(s)));
  const khongCo = [...duongDan].filter(d => !existsSync(join(GOC, d)));
  ok(`${duongDan.size} đường dẫn trong skill đều có thật`, duongDan.size >= 20 && khongCo.length === 0,
     khongCo.length ? khongCo.join(', ') : `${duongDan.size} đường dẫn`);
});

// ===========================================================================
await nhom('5 · BIỂU TƯỢNG VÀ LỚP DÙNG CHUNG KHỚP MÃ', async () => {
  const soSanh = (ten, trongSkill, trongMa) => {
    const thua = trongSkill.filter(x => !trongMa.includes(x));
    const thieu = trongMa.filter(x => !trongSkill.includes(x));
    ok(ten, trongSkill.length > 0 && thua.length === 0 && thieu.length === 0,
       [thua.length && `skill ghi mà mã không có: ${thua.join(', ')}`,
        thieu.length && `mã có mà skill chưa ghi: ${thieu.join(', ')}`].filter(Boolean).join(' · '));
  };

  const bieuTuong = doc(join(SRC, 'components', 'BieuTuong.astro'));
  const kieu = bieuTuong.match(/export type TenBieuTuong =([\s\S]*?);/)?.[1] ?? '';
  const congKhaiMa = [...kieu.matchAll(/'([a-z-]+)'/g)].map(m => m[1]);
  const congKhaiSkill = (skillMd.match(/\(nét 1,5px\) —([^.]+)\./)?.[1] ?? '')
    .split(',').map(s => s.trim()).filter(Boolean);
  soSanh('SKILL.md: danh sách biểu tượng trang công khai đúng bằng TenBieuTuong (BieuTuong.astro)', congKhaiSkill, congKhaiMa);

  const { BIEU_TUONG } = await import(pathToFileURL(join(SRC, 'lib', 'kho', 'bieu-tuong.ts')).href);
  const noiBo = vanBan[`.claude/skills/${TEN_KY_NANG}/tham-khao/noi-bo-va-kho.md`] ?? '';
  const dongKho = noiBo.split('\n').find(d => d.startsWith('| Nội bộ, kho |')) ?? '';
  const khoSkill = (dongKho.split('|').filter(o => o.trim()).at(-1) ?? '')
    .split(',').map(s => s.trim()).filter(Boolean);
  soSanh('noi-bo-va-kho.md: danh sách biểu tượng nội bộ, kho đúng bằng khóa BIEU_TUONG (lib/kho/bieu-tuong.ts)',
         khoSkill, Object.keys(BIEU_TUONG));

  const css = doc(join(SRC, 'styles', 'cong-khai.css'));
  const coLop = lop => new RegExp(`\\.${lop}(?![a-z0-9-])`).test(css);
  const congKhai = vanBan[`.claude/skills/${TEN_KY_NANG}/tham-khao/trang-cong-khai.md`] ?? '';
  const danhMuc = (congKhai.match(/Danh mục:([\s\S]*?)\.\n/)?.[1] ?? '');
  const lopChung = [...danhMuc.matchAll(/`([a-z][a-z0-9-]*)`/g)].map(m => m[1]);
  const thieuLop = lopChung.filter(l => !coLop(l));
  ok(`trang-cong-khai.md: ${lopChung.length} lớp trong "Danh mục" đều có trong cong-khai.css`,
     lopChung.length >= 20 && thieuLop.length === 0, thieuLop.join(', '));
  const beMat = [...new Set([...skillMd.matchAll(/`\.(be-[a-z-]+)`/g)].map(m => m[1]))];
  ok(`SKILL.md: ${beMat.length} lớp bề mặt (.be-…) đều có trong cong-khai.css`,
     beMat.length === 5 && beMat.every(coLop), beMat.filter(l => !coLop(l)).join(', '));
});

process.exit(ketThuc('SKILL THIẾT KẾ'));
