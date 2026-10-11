/**
 * BEEFTOWN — SKILL THIẾT KẾ (.claude/skills/thiet-ke-beeftown) KHỚP VỚI MÃ
 * =========================================================================
 *
 *     node test/test-ky-nang-thiet-ke.mjs
 *
 * Skill thiết kế là bản đồ mọi phiên Claude đọc trước khi làm giao diện. Một bản đồ sai còn tệ hơn
 * không có: phiên sau sẽ tin mã màu, tên lớp, tên biểu tượng ghi trong đó. Bất biến:
 *
 *   1. Mọi file .md của skill được git thấy — .gitignore chặn .claude/ ở mọi cấp và mở TỪNG skill
 *      (chỉ .md). Cấu hình máy (settings.local.json), skill khác chưa mở, .claude/ ở thư mục con vẫn
 *      bị chặn. (File không phải .md trong skill thì test-quy-trinh.mjs nhắc.)
 *   2. Phần đầu SKILL.md đúng luật skill và đọc được bằng YAML: name trùng tên thư mục, chữ thường và
 *      gạch nối, ≤ 64 ký tự; description có chữ, ≤ 1024 ký tự; cả hai là chuỗi YAML trơn một dòng
 *      (không ": ", không " #", không mở bằng ký tự đặc biệt). Mọi link tương đối trong mọi file .md
 *      của skill có file; mọi file tham-khao/ được SKILL.md link tới.
 *   3. Mã màu ghi cạnh tên token (`--kem` … `#FBF4E1`) đúng giá trị khai trong web/src/styles; mọi
 *      biến `--…` nhắc tới có khai ở đâu đó trong web/src.
 *      Một tên biến có HAI giá trị: trang công khai khai lại trong khối `.ck` đầu tiên của
 *      cong-khai.css (bảng màu chốt 09/10/2026), /noi-bo và kho đọc `:root` của chung.css (bảng cũ).
 *      Nên SKILL.md có hai bảng token, và mỗi bảng được so với ĐÚNG nguồn của nó, hai chiều; cặp
 *      token–mã ghi ngoài hai bảng cũng phải đúng khu. Tên màu thương hiệu (Beef Red, Cream…) đứng
 *      trước một mã thì mã đó là của bảng chốt.
 *   4. Mọi đường dẫn trong dấu `…` bắt đầu bằng web/, crm/, can-app/, .github/ hoặc là file ở gốc repo
 *      đều có thật.
 *   5. Hai danh sách biểu tượng trong skill khớp đúng bộ trong mã (công khai: TenBieuTuong của
 *      BieuTuong.astro; nội bộ, kho: khóa của BIEU_TUONG). Lớp trong "Danh mục" có trong
 *      cong-khai.css; lớp bề mặt .be-… khớp hai chiều. Danh sách loại của KhungAnh khớp LoaiKhung.
 *   6. Địa điểm: skill chép đúng từng chữ địa chỉ và ba câu chỉ đường đang dùng trong chu.ts; không
 *      file nào của skill nhắc tên một địa chỉ khác hay cầu thang bộ (cùng bộ mẫu với các phép thử
 *      gác địa điểm, web/kiem-tra/mau-dia-diem.mjs) — dòng pháp nhân thì gọi bằng tên trong mã.
 *
 * KHÔNG kiểm: số đo (cỡ chữ, khoảng cách, bo góc), tên hàm, câu chữ ngoài mục 6 — người sửa mã tự
 * sửa skill.
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
// Bỏ \r: máy Windows lấy repo với core.autocrlf thì file có CRLF — đừng đỏ oan.
const doc = p => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
// CSS bỏ chú thích: chú thích đầu cong-khai.css nhắc tên các bề mặt (.be-kem, .be-do…) — xóa hẳn quy
// tắc mà chú thích còn thì lớp đó KHÔNG còn, đừng để kiểm thử thấy nó trong chú thích mà xanh.
const docCss = p => doc(p).replace(/\/\*[\s\S]*?\*\//g, '');

/** git check-ignore theo luật (--no-index: kể cả file đã có trong git). Mã 0 = bị chặn. */
function biChan(duongDan) {
  try { execFileSync('git', ['check-ignore', '-q', '--no-index', duongDan], { cwd: GOC }); return true; }
  catch { return false; }
}

// Chỉ file .md: rác của máy (.DS_Store, file tạm của trình soạn) đã bị chặn, không vào git, không đáng đỏ.
const tepMd = moiFile(KY_NANG).filter(f => f.endsWith('.md'));
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
  const bi = tepMd.map(tuGoc).filter(biChan);
  ok(`${tepMd.length} file .md của skill không bị .gitignore chặn`, tepMd.length > 0 && bi.length === 0,
     bi.length ? `${bi.join(', ')} — mở bằng dòng !/.claude/skills/${TEN_KY_NANG}/… đứng sau **/.claude/**` : '');
  for (const f of ['.claude/settings.local.json', '.claude/settings.json', 'web/.claude/settings.local.json',
                   '.claude/skills/rieng-cua-may/SKILL.md', 'crm/.claude/skills/x/SKILL.md',
                   `.claude/skills/${TEN_KY_NANG}/anh.png`]) {
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
  // Chuỗi YAML trơn: ": " biến nửa sau thành khóa khác (YAML hỏng, skill không nạp), " #" cắt phần
  // sau thành chú thích, ký tự mở đầu đặc biệt đổi nghĩa cả dòng. Có những chữ đó thì đổi cách viết.
  const loiYaml = s => [
    s.includes(': ') && 'có ": "', / #/.test(s) && 'có " #"', /:$/.test(s) && 'kết thúc bằng ":"',
    /^[-?:,[\]{}#&*!|>'"%@`]/.test(s) && 'mở bằng ký tự đặc biệt của YAML',
  ].filter(Boolean).join(', ');
  for (const khoa of ['name', 'description']) {
    const loi = loiYaml(truong[khoa] ?? '');
    ok(`${khoa} là chuỗi YAML trơn một dòng — trình nạp skill đọc được`, !loi, loi);
  }

  // Link tương đối trong mọi file .md của skill (bỏ phần #neo) phải có file.
  const thieu = [], tuSkill = new Set();
  for (const f of tepMd) {
    for (const [, dich] of doc(f).matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^(https?:|mailto:|#)/.test(dich)) continue;
      const tep = join(dirname(f), dich.split('#')[0]);
      if (!existsSync(tep)) thieu.push(`${tuGoc(f)} → ${dich}`);
      if (f === join(KY_NANG, 'SKILL.md')) tuSkill.add(tuGoc(tep));
    }
  }
  ok(`mọi link tương đối trong ${tepMd.length} file .md của skill đều có file`, tuSkill.size > 0 && thieu.length === 0,
     thieu.join(', '));
  const moCoi = tepMd.map(tuGoc).filter(f => f.includes('/tham-khao/') && !tuSkill.has(f));
  ok('mọi file tham-khao/ đều được SKILL.md link tới (không file mồ côi)', moCoi.length === 0, moCoi.join(', '));
});

// ===========================================================================
await nhom('3 · MÃ MÀU VÀ BIẾN CSS GHI TRONG SKILL CÓ THẬT, ĐÚNG GIÁ TRỊ', async () => {
  const tepMa = moiFile(SRC).filter(f => /\.(css|astro)$/.test(f));
  const maNguon = tepMa.map(doc).join('\n');
  /** Giá trị hex khai cho mỗi biến, gom từ mọi file CSS (một biến có thể khai ở nhiều bề mặt). */
  const giaTri = new Map();
  for (const f of tepMa.filter(f => f.endsWith('.css'))) {
    for (const [, ten, hex] of docCss(f).matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\b/g)) {
      if (!giaTri.has(ten)) giaTri.set(ten, new Set());
      giaTri.get(ten).add(hex.toUpperCase());
    }
  }
  // Hai cách ghi một cặp: dòng bảng mở bằng token (| `--kem` | `#FBF4E1` |), hoặc liền nhau trong câu
  // (`--kho-nen` `#FFFCF6`). Bảng màu trạng thái có token chữ và mã nền ở hai ô cạnh nhau — không
  // phải một cặp, nên ô token phải là ô ĐẦU của dòng.
  // \s+ ở cách thứ hai: cặp bị ngắt dòng trong đoạn văn (`--kho-vach` ⏎ `#EFE4D2`) vẫn được kiểm.
  const CAP = /^\|\s*`(--[a-z0-9-]+)`\s*\|\s*`(#[0-9a-fA-F]{6})`|`(--[a-z0-9-]+)`\s+`(#[0-9a-fA-F]{6})`/gm;
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

  // ---- Hai bảng token, mỗi bảng so với ĐÚNG nguồn của nó ----------------------------------------
  // Phép so ở trên gom giá trị từ mọi file CSS: `--do` `#B23A2C` (:root, bảng cũ) và `--do` `#A70C0C`
  // (.ck, trang công khai) đều qua, dù skill ghi ở bảng nào. Skill dạy "khu này dùng mã này" — ghi mã
  // của khu kia là sai mà phép so trên không thấy. Các kiểm tra dưới đây buộc từng cặp vào nguồn của
  // khu mà skill đang nói tới.
  /** Khai báo màu trong một khối CSS (hex 6 số hoặc rgb()/rgba()): tên biến → giá trị, bỏ khoảng trắng. */
  const mauTrongKhoi = khoi => new Map([...khoi.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)]
    .map(([, ten, giaTri]) => [ten, giaTri.trim()])
    .filter(([, v]) => /^#[0-9a-fA-F]{6}$/.test(v) || /^rgba?\(/i.test(v))
    .map(([ten, v]) => [ten, v.startsWith('#') ? v.toUpperCase() : v.replace(/\s+/g, '').toLowerCase()]));
  const khoiCk = docCss(join(SRC, 'styles', 'cong-khai.css')).match(/(?<=^|\})\s*\.ck\s*\{([^{}]*)\}/)?.[1] ?? '';
  // Chỉ khối `:root { … }` trơn — `:root:lang(ko)` không khai màu và không phải của mọi trang.
  const khoiRoot = [...docCss(join(SRC, 'styles', 'chung.css')).matchAll(/(?<=^|\})\s*:root\s*\{([^{}]*)\}/g)].map(m => m[1]).join('\n');
  const NGUON = {
    'cong-khai': { mau: mauTrongKhoi(khoiCk), ten: 'khối .ck đầu tiên của cong-khai.css' },
    'noi-bo': { mau: mauTrongKhoi(khoiRoot), ten: 'các khối :root của chung.css' },
  };
  ok('Đọc được màu của khối .ck đầu tiên (cong-khai.css) và của :root (chung.css)',
     NGUON['cong-khai'].mau.size >= 10 && NGUON['noi-bo'].mau.size >= 10,
     `.ck ${NGUON['cong-khai'].mau.size} biến màu · :root ${NGUON['noi-bo'].mau.size} biến màu`);

  /** Phần của một file .md dưới tiêu đề ### mở đầu bằng `tieuDe`, tới tiêu đề ## / ### kế tiếp. */
  const mucCua = (md, tieuDe) => {
    const m = md.match(new RegExp(`^### ${tieuDe.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}[^\\n]*\\n`, 'm'));
    if (!m) return null;
    const dau = m.index + m[0].length;
    const cuoi = md.slice(dau).search(/^#{2,3} /m);
    return { dau, cuoi: cuoi < 0 ? md.length : dau + cuoi, chu: md.slice(dau, cuoi < 0 ? md.length : dau + cuoi) };
  };
  const rgbCua = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  /**
   * Ô "Mã" của một dòng bảng → giá trị CSS mong đợi. Hai cách ghi: `#RRGGBB`, hoặc "than 68 %" /
   * "kem 22 %" — màu gốc của CHÍNH khu đó với độ trong ấy (--muc-nhat, --vach, --vach-kem).
   */
  const giaTriMongDoi = (o, mau) => {
    const hex = o.match(/^`(#[0-9a-fA-F]{6})`$/)?.[1];
    if (hex) return hex.toUpperCase();
    const pha = o.match(/^(than|kem) (\d{1,2}) %$/);
    const goc = pha && mau.get(`--${pha[1]}`);
    return goc?.startsWith('#') ? `rgba(${rgbCua(goc).join(',')},.${pha[2].padStart(2, '0')})` : null;
  };
  const BANG_TOKEN = [
    ['Token của trang công khai', 'cong-khai'],
    ['Token của `/noi-bo` và kho', 'noi-bo'],
  ];
  const vungBang = {};
  for (const [tieuDe, khu] of BANG_TOKEN) {
    const { mau, ten } = NGUON[khu];
    const muc = mucCua(skillMd, tieuDe);
    vungBang[khu] = muc;
    const dong = [...(muc?.chu ?? '').matchAll(/^\|\s*`(--[a-z0-9-]+)`\s*\|\s*([^|]+?)\s*\|/gm)];
    ok(`SKILL.md có mục "### ${tieuDe}" với bảng token`, dong.length >= 10, muc ? `${dong.length} dòng` : 'không thấy tiêu đề');
    for (const [, bien, o] of dong) {
      const mong = giaTriMongDoi(o, mau);
      ok(`SKILL.md, bảng "${tieuDe}": ${bien} = ${o.replace(/`/g, '')} đúng như ${ten}`,
         !!mong && mau.get(bien) === mong,
         mau.has(bien) ? `${ten} khai ${mau.get(bien)}${mong ? '' : ' · ô "Mã" phải là `#RRGGBB` hoặc "than N %" / "kem N %"'}` : `${ten} không khai biến màu này`);
    }
    const coTrongBang = new Set(dong.map(m => m[1]));
    const thieu = [...mau.keys()].filter(b => !coTrongBang.has(b));
    ok(`SKILL.md, bảng "${tieuDe}": có đủ ${mau.size} biến màu của ${ten}`, dong.length > 0 && thieu.length === 0,
       thieu.length ? `chưa ghi: ${thieu.join(', ')}` : '');
  }

  // Cặp token–mã ghi NGOÀI hai bảng: file của trang công khai thì theo .ck, file nội bộ / kho thì theo
  // :root. Chỗ khác (phần còn lại của SKILL.md, các file tham khảo chung) không nói rõ khu nào — biến
  // có hai giá trị thì không được ghi kèm mã ở đó.
  const KHU_CUA_TEP = { 'tham-khao/trang-cong-khai.md': 'cong-khai', 'tham-khao/noi-bo-va-kho.md': 'noi-bo' };
  const haiGiaTri = new Set([...NGUON['cong-khai'].mau.keys()]
    .filter(b => NGUON['noi-bo'].mau.has(b) && NGUON['noi-bo'].mau.get(b) !== NGUON['cong-khai'].mau.get(b)));
  ok('Có biến mang hai giá trị (trang công khai khác /noi-bo, kho) — lý do skill cần hai bảng',
     haiGiaTri.size >= 5, [...haiGiaTri].join(', '));
  const saiKhu = [];
  for (const [tep, md] of Object.entries(vanBan)) {
    const laSkill = tep.endsWith('/SKILL.md');
    const khuTep = Object.entries(KHU_CUA_TEP).find(([duoi]) => tep.endsWith(duoi))?.[1] ?? null;
    for (const m of md.matchAll(CAP)) {
      const ten = m[1] ?? m[3], hex = (m[2] ?? m[4]).toUpperCase();
      const khu = laSkill
        ? Object.keys(vungBang).find(k => vungBang[k] && m.index >= vungBang[k].dau && m.index < vungBang[k].cuoi) ?? null
        : khuTep;
      if (laSkill && khu) continue;                       // trong hai bảng: đã so từng dòng ở trên
      if (!khu) { if (haiGiaTri.has(ten)) saiKhu.push(`${tep}: ${ten} ${hex} ghi ngoài hai bảng token — không rõ của khu nào`); continue; }
      const dung = NGUON[khu].mau.get(ten);
      if (dung && dung !== hex) saiKhu.push(`${tep}: ${ten} ${hex}, nhưng ${NGUON[khu].ten} khai ${dung}`);
    }
  }
  ok('Cặp token–mã ghi ngoài hai bảng đúng khu của file (trang-cong-khai.md theo .ck, noi-bo-va-kho.md theo :root); chỗ không rõ khu thì không ghi mã cho biến hai giá trị',
     saiKhu.length === 0, saiKhu.join(' | '));

  // Skill ghi trang công khai đã theo bảng màu thương hiệu: năm tên màu của guideline, đứng trước
  // một mã ở bất kỳ file nào của skill, phải đúng mã của token tương ứng trong khối .ck.
  const TEN_MAU = { 'Beef Red': '--do', 'Cream': '--kem', 'Charcoal': '--than', 'Marigold': '--cuc-vang', 'Warm Stone': '--da' };
  const saiTen = [], thayTen = new Set();
  for (const [tep, md] of Object.entries(vanBan)) {
    for (const [, ten, hex] of md.matchAll(/(Beef Red|Cream|Charcoal|Marigold|Warm Stone)\s*\|?\s*`(#[0-9a-fA-F]{6})`/g)) {
      thayTen.add(ten);
      const dung = NGUON['cong-khai'].mau.get(TEN_MAU[ten]);
      if (dung !== hex.toUpperCase()) saiTen.push(`${tep}: ${ten} ${hex}, nhưng ${TEN_MAU[ten]} trong khối .ck là ${dung}`);
    }
  }
  ok('Năm màu thương hiệu (Beef Red, Cream, Charcoal, Marigold, Warm Stone) ghi kèm mã đều đúng mã của khối .ck',
     thayTen.size === 5 && saiTen.length === 0, saiTen.length ? saiTen.join(' | ') : `thấy ${[...thayTen].join(', ') || 'không tên nào'}`);

  // Bộ ba số RGB skill ghi cho rgba() của trang công khai phải là số của một mã trong khối .ck.
  const boBaDung = new Set([...NGUON['cong-khai'].mau.values()].filter(v => v.startsWith('#')).map(h => rgbCua(h).join(', ')));
  const boBa = [...(vungBang['cong-khai']?.chu ?? '').matchAll(/(?<![\d,.] ?)\b(\d{1,3}), (\d{1,3}), (\d{1,3})\b(?! ?[,\d])/g)].map(m => m.slice(1).join(', '));
  const boBaSai = boBa.filter(b => !boBaDung.has(b));
  ok(`SKILL.md, mục "Token của trang công khai": ${boBa.length} bộ ba số RGB đều là số của một mã trong khối .ck`,
     boBa.length > 0 && boBaSai.length === 0, boBaSai.join(' · '));
});

// ===========================================================================
await nhom('4 · ĐƯỜNG DẪN GHI TRONG SKILL CÓ THẬT', async () => {
  const fileGoc = new Set(readdirSync(GOC).filter(f => statSync(join(GOC, f)).isFile()));
  const duongDan = new Set(Object.values(vanBan).flatMap(trongDauHuyen)
    .map(s => s.trim())
    // Beeftown_….html / .svg / .gs là tài liệu trong repo; Beeftown_Brand_Assets_… (thư mục trên máy
    // Khánh, không đuôi) thì không.
    .filter(s => /^(web|crm|can-app|\.github)\/[^\s<>*]+$/.test(s) || fileGoc.has(s) || /^Beeftown_[^\s*]+\.(html|svg|gs)$/.test(s)));
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

  const css = docCss(join(SRC, 'styles', 'cong-khai.css'));
  const coLop = lop => new RegExp(`\\.${lop}(?![a-z0-9-])`).test(css);
  const congKhai = vanBan[`.claude/skills/${TEN_KY_NANG}/tham-khao/trang-cong-khai.md`] ?? '';
  const danhMuc = (congKhai.match(/Danh mục:([\s\S]*?)\.\n/)?.[1] ?? '');
  const lopChung = [...danhMuc.matchAll(/`([a-z][a-z0-9-]*)`/g)].map(m => m[1]);
  const thieuLop = lopChung.filter(l => !coLop(l));
  ok(`trang-cong-khai.md: ${lopChung.length} lớp trong "Danh mục" đều có trong cong-khai.css`,
     lopChung.length >= 20 && thieuLop.length === 0, thieuLop.join(', '));
  // Lớp bề mặt khớp hai chiều: thêm một bề mặt vào CSS mà bảng "Màu theo bề mặt" chưa có cũng đỏ.
  const beMatSkill = [...new Set([...skillMd.matchAll(/`\.(be-[a-z-]+)`/g)].map(m => m[1]))];
  const beMatCss = [...new Set([...css.matchAll(/\.(be-[a-z-]+)(?![a-z0-9-])/g)].map(m => m[1]))];
  soSanh('SKILL.md: bảng "Màu theo bề mặt" có đúng các lớp .be-… của cong-khai.css', beMatSkill, beMatCss);

  // Loại của <KhungAnh loai="…">: tên trong dòng `KhungAnh` của bảng "Component có sẵn" đúng bằng kiểu LoaiKhung.
  const loaiMa = [...(doc(join(SRC, 'components', 'KhungAnh.astro')).match(/export type LoaiKhung =([^;]+);/)?.[1] ?? '')
    .matchAll(/'([a-z0-9-]+)'/g)].map(m => m[1]);
  const loaiSkill = [...(congKhai.match(/^\| `KhungAnh` \| `loai` \(([^)]*)\)/m)?.[1] ?? '').matchAll(/`([a-z0-9-]+)`/g)].map(m => m[1]);
  soSanh('trang-cong-khai.md: các loại của KhungAnh đúng bằng kiểu LoaiKhung (KhungAnh.astro)', loaiSkill, loaiMa);
});

// ===========================================================================
// Skill là thứ phiên sau đọc để viết chữ cho khách: một câu trong skill ghi địa chỉ khác, hay nói khách
// đi cầu thang bộ, sẽ quay lại trang web qua tay người đọc nó. Chữ mong đợi đọc từ chu.ts (chữ đó đã
// có test-cong-khai-cau-chu.mjs và test-cong-khai-dia-diem.mjs chép tay giữ từng ký tự).
await nhom('6 · ĐỊA ĐIỂM TRONG SKILL ĐÚNG NHƯ MÃ; KHÔNG ĐỊA CHỈ KHÁC, KHÔNG CẦU THANG BỘ', async () => {
  const { chu, NGON_NGU, DIA_CHI_PHAN } = await import(pathToFileURL(join(SRC, 'lib', 'chu.ts')).href);
  const { TEN_DIA_CHI_KHAC, CAU_THANG } = await import(pathToFileURL(join(GOC, 'web', 'kiem-tra', 'mau-dia-diem.mjs')).href);
  const cauChu = vanBan[`.claude/skills/${TEN_KY_NANG}/tham-khao/cau-chu.md`] ?? '';

  ok(`SKILL.md và cau-chu.md ghi địa điểm đúng như DIA_CHI_PHAN.duong của chu.ts ("${DIA_CHI_PHAN.duong}")`,
     DIA_CHI_PHAN.duong.length > 0 && skillMd.includes(DIA_CHI_PHAN.duong) && cauChu.includes(DIA_CHI_PHAN.duong));
  for (const nn of NGON_NGU) {
    const cau = chu(nn).loiLen;
    ok(`cau-chu.md chép đúng từng chữ câu chỉ đường [${nn}] đang dùng trong chu.ts`, !!cau && cauChu.includes(cau), cau);
  }

  // Bộ mẫu dùng chung với test-cong-khai-dia-diem.mjs. Dòng địa chỉ pháp nhân ở chân trang vẫn là chữ
  // trên giấy đăng ký: skill nói tới nó bằng tên trong mã (PHAP_NHAN), không chép lại chữ của nó.
  for (const [luat, ten] of [[TEN_DIA_CHI_KHAC, 'tên đường hay tên phường của một địa chỉ khác'], [CAU_THANG, 'cầu thang bộ hay câu "không có thang máy"']]) {
    const thay = Object.entries(vanBan).flatMap(([tep, md]) => md.split('\n')
      .map((dong, i) => (luat.tim(dong) ? `${tep}:${i + 1} «${luat.tim(dong)}»` : null)).filter(Boolean));
    ok(`Không file nào của skill nhắc ${ten}`, tepMd.length > 0 && thay.length === 0, thay.join(' | '));
  }
});

process.exit(ketThuc('SKILL THIẾT KẾ'));
