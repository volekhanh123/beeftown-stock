/**
 * Kiểm thử 2.11 — Beeftown Cân gọn còn 5 thẻ (chủ duyệt 25/10/2026), phần đọc mã:
 *   - thanh thẻ: Quầy · Cân · Giảm giá · Báo cáo · Thiết lập cân; mười mục cũ (id the-…) vẫn còn, mỗi mục thuộc đúng một thẻ;
 *     Tảng & ô mã, Tất cả hàng, Mẫu tem, Cân & thông số, Phím tắt, Nhật ký cân là mục gập (<details>);
 *   - luật thẻ theo vai: chạy thật khối "THẺ THEO VAI" của trang (new Function) cho mọi vai × có / chưa có file gốc, so với bảng
 *     đã duyệt — NV quầy, thủ kho chỉ thẻ Quầy; kế toán thêm Báo cáo; quản lý, chủ đủ năm thẻ; chưa đăng nhập kho thấy các mục
 *     làm với cân như 2.10. Quyền thật vẫn ở máy chủ (không đổi);
 *   - không còn câu chỉ tới thẻ cũ trong trang, hướng dẫn, mã nguồn (trừ "Mở lại thẻ Tem" — câu lỗi cũ kiểm thử khoá chữ);
 *   - README, hướng dẫn, câu web "chưa gán phím tắt" theo chỗ mới; mọi câu web (web/src/lib, web/src/pages/noi-bo) không chỉ
 *     tới thẻ cũ, vi và en.
 * Lỗi lúc chạy (biến còn dùng mà bị xoá, mục không tải) do test/thu-trinh-duyet.ts bắt — file đó mở trang trong Chromium.
 *
 *     cd can-app && npx bun test/thu-giao-dien-gon.ts
 *
 * test/thu.ts gọi `thuGiaoDienGon(ok)`.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { quyenCuaVai } from '../src/nghiep-vu.ts';

type Ok = (ten: string, dieuKien: boolean, chiTiet?: string) => void;

const GOC = path.join(import.meta.dir, '..');
const doc = (f: string) => fs.readFileSync(path.join(GOC, f), 'utf8');

/** Năm thẻ đã duyệt, theo thứ tự trên thanh thẻ. */
export const NAM_THE = ['Quầy', 'Cân', 'Giảm giá', 'Báo cáo', 'Thiết lập cân'];
/** Mục (id the-<mục>) của từng thẻ — Tảng & ô mã nằm cuối thẻ Quầy; Gửi giá và Tất cả hàng ở thẻ Cân. */
export const MUC_CUA_THE: Record<string, string[]> = {
  'Quầy': ['quay', 'tang-o'], 'Cân': ['dong-bo', 'hang'], 'Giảm giá': ['giam'], 'Báo cáo': ['bao-cao'],
  'Thiết lập cân': ['tem', 'can', 'phim', 'nhat-ky'],
};
export const MUC_GAP = ['tang-o', 'hang', 'tem', 'can', 'phim', 'nhat-ky'];

/**
 * Bảng đã duyệt: vai → các mục thấy được (có file gốc / chưa có). null = chưa đăng nhập kho. Chủ là vai chu_so_huu.
 * Chưa đăng nhập: đúng các mục 2.10 hiện cho máy chưa đăng nhập (Gửi giá chỉ khung đăng nhập, Tất cả hàng, Mẫu tem, Cân &
 * thông số, Phím tắt, Nhật ký cân; Tất cả hàng, Gửi giá, Mẫu tem, Phím tắt cần file gốc).
 */
export const MUC_THEO_VAI: { vai: string | null; coGoc: string[]; chuaGoc: string[] }[] = [
  { vai: null, coGoc: ['dong-bo', 'hang', 'tem', 'can', 'phim', 'nhat-ky'], chuaGoc: ['can', 'nhat-ky'] },
  { vai: 'nhan_vien_quay', coGoc: ['quay', 'tang-o'], chuaGoc: ['quay', 'tang-o'] },
  { vai: 'thu_kho', coGoc: ['quay', 'tang-o'], chuaGoc: ['quay', 'tang-o'] },
  { vai: 'ke_toan', coGoc: ['quay', 'tang-o', 'bao-cao'], chuaGoc: ['quay', 'tang-o', 'bao-cao'] },
  { vai: 'quan_ly', coGoc: ['quay', 'tang-o', 'giam', 'bao-cao', 'dong-bo', 'hang', 'tem', 'can', 'phim', 'nhat-ky'],
    chuaGoc: ['quay', 'tang-o', 'giam', 'bao-cao', 'can', 'nhat-ky'] },
  { vai: 'chu_so_huu', coGoc: ['quay', 'tang-o', 'giam', 'bao-cao', 'dong-bo', 'hang', 'tem', 'can', 'phim', 'nhat-ky'],
    chuaGoc: ['quay', 'tang-o', 'giam', 'bao-cao', 'can', 'nhat-ky'] },
];

/** Câu chỉ tới thẻ cũ (2.10). "thẻ Tem" chỉ còn trong câu lỗi cũ "Mở lại thẻ Tem" — kiểm thử khoá chữ (thu-tem.ts, thu.ts). */
const THE_CU = /thẻ\s+(?:<b>)?["“]?(?:Gửi giá|Tất cả hàng|Mẫu tem|Cân\s*&(?:amp;)?\s*thông số|Phím tắt|Nhật ký cân|Tảng\s*&(?:amp;)?\s*ô|Giảm giá cận date|Tem\b)/giu;
const NGOAI_LE = /Mở lại thẻ Tem/g;

export async function thuGiaoDienGon(ok: Ok): Promise<void> {
  console.log('6n · 2.11 — Beeftown Cân gọn còn 5 thẻ: thanh thẻ, luật thẻ theo vai, câu chữ, tài liệu');
  const gd = doc('src/giao-dien.html');
  const hd = doc('src/huong-dan.html');
  const rd = doc('README.md');

  // Thanh thẻ.
  const thanh = /<nav class="thanh-tab an" id="thanh-tab">([\s\S]*?)<\/nav>/.exec(gd)?.[1] ?? '';
  const nut = [...thanh.matchAll(/<button data-tab="([^"]+)">([^<]*)<\/button>/g)].map(m => ({ khoa: m[1], chu: m[2].replace(/&amp;/g, '&') }));
  ok('2.11 Thanh thẻ có đúng 5 thẻ theo thứ tự: Quầy, Cân, Giảm giá, Báo cáo, Thiết lập cân',
    JSON.stringify(nut.map(n => n.chu)) === JSON.stringify(NAM_THE), JSON.stringify(nut));

  // Khối luật thẻ theo vai — chạy thật, như khối GIỜ VIỆT NAM ở thu-no-ky-thuat.ts.
  const khoi = /\/\/ ---- THẺ THEO VAI[^\n]*\n([\s\S]*?)\/\/ ---- HẾT THẺ THEO VAI/.exec(gd)?.[1] ?? '';
  let luat: { THE_MUC: Record<string, string[]>; mucDuocThay: (q: unknown, coGoc: boolean) => Record<string, boolean> } | null = null;
  let loiKhoi = '';
  try { luat = new Function(`${khoi}; return { THE_MUC, mucDuocThay };`)(); } catch (e) { loiKhoi = String(e); }
  ok('2.11 Trang có khối luật thẻ theo vai (THE_MUC, mucDuocThay) giữa "// ---- THẺ THEO VAI" và "// ---- HẾT THẺ THEO VAI"',
    !!luat && typeof luat.mucDuocThay === 'function', loiKhoi || khoi.slice(0, 200));
  if (!luat) return;
  const theCuaKhoa = Object.fromEntries(nut.map(n => [n.khoa, n.chu]));
  const mucTheoThe = Object.fromEntries(Object.entries(luat.THE_MUC).map(([k, ds]) => [theCuaKhoa[k] ?? k, ds]));
  const moiMuc = Object.values(luat.THE_MUC).flat();
  const motLan = (id: string) => (gd.match(new RegExp(`id="the-${id}"`, 'g')) ?? []).length === 1;
  ok('2.11 Mười mục cũ vẫn còn (the-quay … the-nhat-ky), mỗi mục thuộc đúng một thẻ, đúng chỗ đã duyệt; thẻ của THE_MUC trùng thanh thẻ',
    JSON.stringify(mucTheoThe) === JSON.stringify(MUC_CUA_THE) && moiMuc.length === 10 && new Set(moiMuc).size === 10
    && moiMuc.every(motLan) && JSON.stringify(Object.keys(luat.THE_MUC)) === JSON.stringify(nut.map(n => n.khoa)),
    JSON.stringify(mucTheoThe));
  ok('2.11 Tảng & ô mã, Tất cả hàng, Mẫu tem, Cân & thông số, Phím tắt, Nhật ký cân là mục gập (<details class="the an">); Quầy, Gửi giá, Giảm giá, Báo cáo vẫn là <section>',
    MUC_GAP.every(m => gd.includes(`<details class="the an" id="the-${m}">`))
    && ['quay', 'dong-bo', 'giam', 'bao-cao'].every(m => gd.includes(`<section class="the an" id="the-${m}">`)));

  // Bảng vai → mục, vai → thẻ.
  const sai: string[] = [];
  for (const v of MUC_THEO_VAI) {
    for (const coGoc of [true, false]) {
      const q = v.vai === null ? null : quyenCuaVai(v.vai);
      const thay = luat.mucDuocThay(q, coGoc);
      const muc = moiMuc.filter(m => thay[m] === true);
      const mong = coGoc ? v.coGoc : v.chuaGoc;
      if (JSON.stringify([...muc].sort()) !== JSON.stringify([...mong].sort()) || moiMuc.some(m => typeof thay[m] !== 'boolean')) {
        sai.push(`${v.vai ?? 'chưa đăng nhập'}${coGoc ? '' : ' (chưa có file gốc)'}: ${muc.join(',')} — mong ${mong.join(',')}`);
      }
    }
  }
  ok('2.11 Thẻ theo vai (chạy mucDuocThay của trang): NV quầy, thủ kho → chỉ Quầy (cả Tảng & ô); kế toán → Quầy, Báo cáo; quản lý, chủ → đủ 5 thẻ, '
    + '10 mục; chưa đăng nhập → Cân (Gửi giá: khung đăng nhập; Tất cả hàng), Thiết lập cân; chưa có file gốc → bớt mục cần file gốc',
    sai.length === 0, sai.join(' | '));
  const theCua = (vai: string | null) => NAM_THE.filter(t => MUC_CUA_THE[t].some(m => luat!.mucDuocThay(vai === null ? null : quyenCuaVai(vai), true)[m]));
  ok('2.11 Thẻ hiện: NV quầy [Quầy] · thủ kho [Quầy] · kế toán [Quầy, Báo cáo] · quản lý, chủ [5 thẻ] · chưa đăng nhập [Cân, Thiết lập cân]',
    JSON.stringify([theCua('nhan_vien_quay'), theCua('thu_kho'), theCua('ke_toan'), theCua('quan_ly'), theCua('chu_so_huu'), theCua(null)])
      === JSON.stringify([['Quầy'], ['Quầy'], ['Quầy', 'Báo cáo'], NAM_THE, NAM_THE, ['Cân', 'Thiết lập cân']]));

  // Mã trang dựa vào thẻ / mục.
  ok('2.11 Mục gập tải khi mở (sự kiện toggle); Tảng & ô đọc luôn khi mở thẻ Quầy (dòng gập có tóm tắt) và tự mở khi có ô cân chưa đổi tên',
    /addEventListener\('toggle'/.test(gd) && /id="tang-o-tom-tat"/.test(gd) && /\$\('the-tang-o'\)\.open = true/.test(gd));
  ok('2.11 Phím mũi tên chỉ dời ô tem khi mục Mẫu tem đang mở; Quầy tự tải lại theo coMuc.quay; không còn coThe / CAC_THE / bộ chặn tải bằng Set',
    /if \(!dangThayMuc\('tem'\)/.test(gd) && /tab === 'quay' && coMuc\.quay/.test(gd) && !/\bcoThe\b/.test(gd) && !/CAC_THE/.test(gd)
    && !/dangTaiMuc|new Set\(\)\s*;?\s*\/\/[^\n]*tải/.test(gd));
  ok('2.11 taiTrangThai vẫn khai canCan trước khi dùng (nút đọc từ cân theo vai)',
    /const canCan = !q \|\| q\.danhMuc;[\s\S]{0,600}toggle\('an', !canCan\)/.test(gd));

  // Câu chữ: không còn chỉ tới thẻ cũ.
  const tep = ['src/giao-dien.html', 'src/huong-dan.html', 'src/nghiep-vu.ts', 'src/thong-so.ts', 'src/tem.ts', 'src/quay.ts', 'src/may-chu.ts', 'src/main.ts'];
  const cu: string[] = [];
  for (const f of tep) {
    doc(f).split('\n').forEach((dong, i) => {
      for (const m of dong.replace(NGOAI_LE, '').matchAll(THE_CU)) cu.push(`${f}:${i + 1}: ${m[0]}`);
    });
  }
  ok('2.11 Không còn câu chỉ tới thẻ cũ (Gửi giá từ kho, Tất cả hàng, Mẫu tem, Cân & thông số, Phím tắt, Nhật ký cân, Tảng & ô, thẻ Tem) '
    + 'trong trang, hướng dẫn, mã nguồn — trừ câu lỗi cũ "Mở lại thẻ Tem" (kiểm thử khoá chữ)', cu.length === 0, cu.slice(0, 12).join(' | '));
  ok('2.11 Ngoại lệ "Mở lại thẻ Tem" còn đúng chỗ cũ (tem.ts: CAU_DOI và hai câu lỗi) — không lan sang câu mới',
    (doc('src/tem.ts').match(NGOAI_LE) ?? []).length === 3 && (gd.match(NGOAI_LE) ?? []).length === 0);
  ok('2.11 Chú thích "thẻ Cân" cũ (nghĩa Cân & thông số) đổi thành "mục Cân & thông số" — "thẻ Cân" giờ là thẻ khác',
    !/Việc ở thẻ Cân: khoá|sau khi gửi ở thẻ Cân|lần tải thẻ Cân|một lần gửi ở thẻ Cân/.test(gd) && /mục Cân & thông số: khoá/.test(gd));
  const dm = fs.readFileSync(path.join(GOC, '..', 'web', 'src', 'lib', 'kho', 'danh-muc-can.ts'), 'utf8');
  ok('2.11 Trang pha lóc: "chưa gán phím tắt" chỉ tới mục Phím tắt của Beeftown Cân (đúng cả máy còn chạy 2.10), vi và en',
    dm.includes("' · chưa gán phím tắt (gán ở mục Phím tắt của Beeftown Cân)'") && dm.includes("' · no shortcut key yet (set it in the Keys section of Beeftown Scale)'")
    && !/thẻ Phím tắt|Keys tab/.test(dm));

  // Tài liệu.
  const muc211 = rd.slice(rd.indexOf('## Bản 2.11'), rd.indexOf('## Bản 2.10'));
  ok('2.11 README: mục "Bản 2.11 — gọn còn 5 thẻ" (trước 2.10) có bảng thẻ cũ → chỗ mới cho đủ mười thẻ cũ và "Thử ở quán (2.11)"',
    rd.includes('## Bản 2.11 — gọn còn 5 thẻ') && rd.indexOf('## Bản 2.11') < rd.indexOf('## Bản 2.10') && muc211.includes('Thử ở quán (2.11)')
    && ['Quầy', 'Tảng & ô mã', 'Giảm giá cận date', 'Báo cáo', 'Gửi giá từ kho', 'Tất cả hàng (SKU)', 'Mẫu tem', 'Cân & thông số', 'Phím tắt', 'Nhật ký cân']
      .every(t => muc211.includes(`| ${t} |`)), muc211.slice(0, 300));
  // Phần README còn đang dùng: "Dùng" và mục 2.2 (bước 6 của "Dùng" và "Chưa làm" trỏ tới "Thử bản 2.2 ở quán"), mục 2.4 (thử
  // sau bước 6), "Chưa làm" — nói theo chỗ mới. Chỉ các mục "Thử ở quán" của bản cũ khác (sau mục 2.11) giữ tên thẻ cũ, tra bảng.
  // Như THE_CU, thêm chữ đậm Markdown và tên thẻ gãy dòng ("thẻ Tất cả⏎   hàng").
  const THE_CU_MD = new RegExp(THE_CU.source.replace('(?:<b>)?', '(?:<b>|\\*\\*)?').replace(/ /g, '\\s+'), 'giu');
  const doan = (tu: string, den: string) => rd.slice(rd.indexOf(tu), den ? rd.indexOf(den) : undefined);
  const dangDung = [doan('## Dùng', '## Bản 2.11'), doan('## Bản 2.4', '## Cân đổi địa chỉ'), doan('## Chưa làm', '')];
  const cuMd = dangDung.flatMap(d => [...d.matchAll(THE_CU_MD)].map(m => m[0]));
  ok('2.11 README: "Dùng", mục 2.2 (cả "Thử bản 2.2 ở quán"), mục 2.4 và "Chưa làm" chỉ tới chỗ mới — không "thẻ Cân & thông số", '
    + '"thẻ Mẫu tem", "Ba thẻ mới"…; bảng tra nói đúng các mục còn tên cũ nằm ở đâu',
    dangDung.every(d => d.length > 100) && cuMd.length === 0 && !/Ba thẻ mới/.test(rd) && !/của bản cũ bên dưới vẫn dùng tên thẻ cũ/.test(rd),
    cuMd.join(' | '));

  // Câu của web chỉ người dùng tới Beeftown Cân (gộp nhánh thu ngân / FABi với 2.11: "Beeftown Cân → thẻ Tảng & ô",
  // "thẻ **Gửi giá từ kho**" lọt vì phần trên chỉ quét can-app). Quét mã web của kho và nội bộ, cả bản tiếng Anh — tên thẻ cũ
  // tiếng Anh chỉ có ở các câu web (Beeftown Cân không có bản tiếng Anh). "thẻ Giảm giá" vẫn là thẻ thật nên không bị bắt.
  const THE_CU_EN = new RegExp('(?:Primals\\s*&(?:amp;)?\\s*slots|Send\\s+prices\\s+from\\s+stock|All\\s+items(?:\\s+\\(SKU\\))?|Labels?'
    + '|Label\\s+template|Scale\\s*&(?:amp;)?\\s*settings|Keys|Scale\\s+log|Near-expiry\\s+discounts?)(?:<\\/b>|\\*\\*)?["”]?\\s+tab\\b', 'gu');
  const WEB = path.join(GOC, '..', 'web', 'src');
  const tepWeb = (thuMuc: string): string[] => fs.readdirSync(path.join(WEB, thuMuc), { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? tepWeb(path.join(thuMuc, e.name)) : /\.(?:ts|astro)$/.test(e.name) ? [path.join(thuMuc, e.name)] : []);
  const cacTepWeb = [...tepWeb('lib'), ...tepWeb(path.join('pages', 'noi-bo'))];
  const cuWeb: string[] = [];
  for (const f of cacTepWeb) {
    fs.readFileSync(path.join(WEB, f), 'utf8').split('\n').forEach((dong, i) => {
      for (const m of [...dong.matchAll(THE_CU_MD), ...dong.matchAll(THE_CU_EN)]) cuWeb.push(`web/src/${f}:${i + 1}: ${m[0]}`);
    });
  }
  ok('2.11 Câu web (web/src/lib, web/src/pages/noi-bo) không chỉ tới thẻ cũ của Beeftown Cân, vi và en — "thẻ Tảng & ô", '
    + '"thẻ Gửi giá từ kho", "Primals & slots tab", "Send prices from stock tab"… đổi theo chỗ mới (thẻ Quầy → mục Tảng & ô mã; thẻ Cân)',
    cacTepWeb.some(f => f.endsWith('thu-ngan.ts')) && cacTepWeb.some(f => f.endsWith('huong-dan.ts')) && cuWeb.length === 0,
    cuWeb.slice(0, 12).join(' | '));
  const viTri = (tieuDe: string) => rd.indexOf(`\n${tieuDe}`);
  ok('2.11 README: câu dẫn bảng tra nói đúng chỗ — "Dùng", "Thử bản 2.2 ở quán" ở trên mục 2.11; mục 2.4 ở dưới, sau 2.5 (không "ở trên")',
    /"Dùng",\s+"Thử bản 2\.2 ở quán"\s+\(ở trên\)\s+và\s+mục\s+2\.4\s+\(cuối các mục phiên bản, sau 2\.5/.test(muc211)
    && !/mục 2\.4 \(ở trên/.test(rd) && [viTri('## Dùng'), viTri('### Thử bản 2.2 ở quán')].every(v => v > 0 && v < viTri('## Bản 2.11'))
    && viTri('## Bản 2.11') < viTri('## Bản 2.5') && viTri('## Bản 2.5') < viTri('## Bản 2.4'));
  // Đoạn README tả dong-goi-can.yml phải theo đúng thứ tự bước của workflow: thu.ts → Chromium → đóng gói.
  const wf = fs.readFileSync(path.join(GOC, '..', '.github', 'workflows', 'dong-goi-can.yml'), 'utf8');
  const doanWf = rd.slice(rd.indexOf('- `.github/workflows/dong-goi-can.yml`:'), rd.indexOf('## Chưa làm'));
  const theoThuTu = (chu: string, ...cum: string[]) => cum.every((c, i) => chu.indexOf(c) >= 0 && (i === 0 || chu.indexOf(c) > chu.indexOf(cum[i - 1])));
  ok('2.11 README "Phát triển": dong-goi-can.yml chạy test/thu.ts → test/thu-trinh-duyet.ts (Chromium) → đóng gói, đúng thứ tự trong workflow',
    doanWf.length > 100 && theoThuTu(doanWf, 'npx bun test/thu.ts', 'npx bun test/thu-trinh-duyet.ts', 'đóng gói → artifact')
    && theoThuTu(wf, 'run: npx bun test/thu.ts', 'run: npx bun test/thu-trinh-duyet.ts', 'run: npx bun scripts/dong-goi.ts'),
    doanWf.slice(0, 300));
  const bangAi = /<h3>Ai thấy thẻ nào<\/h3>([\s\S]*?)<\/table>/.exec(hd)?.[1] ?? '';
  const dongAi = [...bangAi.matchAll(/<tr><td>([^<]+)/g)].map(m => m[1].trim());
  ok('2.11 Hướng dẫn: bảng "Ai thấy thẻ nào" đúng năm thẻ; NV quầy, thủ kho chỉ thẻ Quầy; mục lục giữ mọi neo (#the-…)',
    JSON.stringify(dongAi) === JSON.stringify(NAM_THE) && /<tr><td>Quầy<\/td><td class="giua">✓<\/td>/.test(bangAi)
    && /<tr><td>Giảm giá<\/td><td class="giua">—<\/td>/.test(bangAi)
    && ['the-quay', 'the-tang-o', 'the-giam', 'the-bao-cao', 'the-gui-gia', 'the-hang', 'the-tem', 'the-thong-so', 'the-phim', 'the-nhat-ky']
      .every(id => hd.includes(`href="#${id}"`) && hd.includes(`id="${id}"`)), JSON.stringify(dongAi));
}

if (import.meta.main) {
  let dat = 0, hong = 0;
  const ok: Ok = (ten, dk, ct) => { if (dk) { dat++; console.log('  ✓ ' + ten); } else { hong++; console.log('  ✗ ' + ten + (ct ? '\n      ' + ct : '')); } };
  await thuGiaoDienGon(ok);
  console.log(hong ? `${hong} KIỂM TRA HỎNG / ${dat + hong}` : `TẤT CẢ ${dat} KIỂM TRA ĐỀU ĐẠT`);
  process.exit(hong ? 1 : 0);
}
