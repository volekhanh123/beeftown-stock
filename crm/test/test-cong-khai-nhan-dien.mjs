/**
 * BEEFTOWN — BỘ NHẬN DIỆN 21/10/2026 TRÊN TOÀN REPO: KHÔNG CÒN HÌNH BỘ CŨ, TAGLINE MỚI, LOGO THAY CHỮ GÕ
 * ======================================================================================================
 *
 *     node test/test-cong-khai-nhan-dien.mjs
 *
 * Ngày 26/10/2026 Khánh chốt: website dùng bộ logo của Brand Guidelines 21/10/2026 (logo chính, logo phụ, brandmark —
 * mỗi thứ ba bản đỏ / đen / trắng, web/public/thuong-hieu), BỎ HẾT hình của bộ nhận diện cũ (đầu bò hoạt hình, hương
 * thảo, vân mỡ, steak, chữ BEEFTOWN lặp, tem tròn — không giữ hình cũ đổi màu), tagline "Pick it, grill it, love it!"
 * ở mọi nơi; bảng màu 22/10/2026. Các kiểm thử theo khu (test-cong-khai-giao-dien.mjs: tập file logo và màu từng
 * bản; test-noi-bo-bang-mau.mjs; test-ky-nang-thiet-ke.mjs) gác từng khu; file này là lưới trên CẢ repo, thay cho các
 * lệnh grep chạy tay của kế hoạch đổi màu (mục 5 bước 8). Bất biến:
 *
 *   1. Không file nào (web/src, web/public, web/kiem-tra, web/cong-cu, .claude/skills, .github, tài liệu .md ở gốc và
 *      web/, mini-app/CLAUDE.md) còn THAM CHIẾU tới hình bộ cũ: giá trị của src= / href= / url( / class= / --hinh:,
 *      và đường dẫn thuong-hieu/<tên file cũ>. Chữ trong câu ("không hoa-van-chu", "thay cho nhánh rosemary") không
 *      bị bắt — câu hồi quy và câu luật được phép nhắc tên cũ. Có mẫu tự kiểm. Riêng THUONG-HIEU.md (lịch sử bộ nhận
 *      diện) không quét.
 *   2. Mọi đường dẫn /thuong-hieu/<file> trong web/src có file thật.
 *   3. Không gõ chữ BEEFTOWN bằng phông thay logo ở đầu trang /noi-bo, kho và các trang in; mỗi chỗ dùng đúng bản
 *      logo cho nền (đầu trang đen: bản trắng; giấy in: logo chính đen).
 *   4. Tagline: THUONG_HIEU.khauHieu là "Pick it, grill it, love it!" (phẩy, chấm than); máy dịch giữ nguyên đúng
 *      chuỗi đó; không chữ nào trên trang, trong tài liệu còn cách viết cũ ("Pick it. Grill it. Love it.", "Pick it –
 *      Grill it – Love it"); dải tagline của màn đầu tách vế theo dấu câu [,.!] (không thành một khối không xuống dòng).
 *   5. Không tài liệu, công cụ, file chữ nào còn mã màu của bảng 09/10/2026 hay tám màu trạng thái (hex, bộ ba trong
 *      rgb() / rgba() viết phẩy hay cách, bộ ba 0x… của Python).
 */

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const doc = p => readFileSync(join(GOC, p), 'utf8').replace(/\r\n/g, '\n');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — BỘ NHẬN DIỆN 21/10/2026 TRÊN TOÀN REPO');

// File git thấy (đã theo dõi, hoặc mới mà .gitignore không chặn) — đúng tập file sẽ vào PR.
const TEP_GIT = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: GOC, encoding: 'utf8' }).split('\n').filter(Boolean)
  .filter(f => existsSync(join(GOC, f)));
const DUOI_CHU = /\.(?:astro|ts|tsx|js|mjs|cjs|css|html|svg|json|webmanifest|xml|txt|md|py|sh|ya?ml)$/i;
// Vùng quét. crm/test (và các file kiểm thử khác) cố ý chứa tên cũ trong mẫu tự kiểm — không quét; can-app (Beeftown
// Cân, PR riêng) và mini-app/src (PR Mini App sau) ngoài phạm vi; THUONG-HIEU.md là lịch sử bộ nhận diện.
const VUNG = [/^web\/src\//, /^web\/public\//, /^web\/kiem-tra\//, /^web\/cong-cu\//, /^\.claude\/skills\//, /^\.github\//,
  /^[^/]+\.md$/, /^web\/[^/]+\.md$/, /^mini-app\/CLAUDE\.md$/];
const KHONG_QUET = new Set(['THUONG-HIEU.md']);
const tepQuet = TEP_GIT.filter(f => DUOI_CHU.test(f) && VUNG.some(v => v.test(f)) && !KHONG_QUET.has(f));

// ===========================================================================
// Bộ hình cũ (PDF nhận diện 09/10/2026). Tên file có đuôi .svg; tên lớp CSS của các hình trang trí đặt bằng mặt nạ.
const TEN_FILE_CU = '(?:chu-beeftown-nho|dau-bo-kem|hoa-van-chu|huong-thao-\\d|logo-ngang-kem|steak-net-\\d|tem-tron|van-mo-gan|van-mo)';
// "van-mo" chỉ bắt khi là tên file (đuôi .svg, hay sau thuong-hieu/) — không bắt id ảnh chụp bo-van-mo-can.
const FILE_CU = new RegExp(`(?:thuong-hieu/${TEN_FILE_CU}(?![\\w-])|(?<![\\w-])${TEN_FILE_CU}\\.svg)`, 'g');
const LOP_CU = new Set(['nen-van-mo', 'trang-tri', 'net', 'net-goc', 'co-trang-tri', 'an-khi-hep', 'hoa-van-chu', 'huong-thao-1', 'huong-thao-2',
  'huong-thao-3', 'huong-thao-4', 'huong-thao-5', 'steak-1', 'steak-2', 'ct-tem', 'hb-tem', 'db-steak', 'qcb-steak', 'ch-la']);

/**
 * Mọi tham chiếu tới hình bộ cũ trong một đoạn văn bản → ['…', …]. Chỉ đọc chỗ là tham chiếu thật:
 *   · giá trị của src= / href= / srcset= / poster= (ngoặc đơn, kép, ngược, kể cả {`…`} của Astro);
 *   · giá trị của url(…) (mặt nạ, nền);
 *   · giá trị của class= / class:list= / className= (từng tên lớp);
 *   · giá trị của biến --hinh: (nét trang trí đặt qua biến);
 *   · đường dẫn thuong-hieu/<tên file cũ> ở bất kỳ đâu (tài liệu ghi đường dẫn là chỉ người đọc tới file).
 */
function thamChieuCu(van) {
  const ra = [];
  const xetGiaTri = (loai, gt) => { for (const m of gt.matchAll(FILE_CU)) ra.push(`${loai} ${m[0]}`); };
  for (const m of van.matchAll(/\b(?:src|href|srcset|poster|data-src)\s*=\s*\{?\s*(["'`])([^"'`]*)\1/g)) xetGiaTri('src/href', m[2]);
  for (const m of van.matchAll(/\burl\(\s*(["']?)([^"')]*)\1\s*\)/g)) xetGiaTri('url()', m[2]);
  for (const m of van.matchAll(/--hinh\s*:\s*([^;}\n]*)/g)) xetGiaTri('--hinh', m[1]);
  for (const m of van.matchAll(/\bclass(?::list|Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g)) {
    const gt = m[1] ?? m[2] ?? m[3] ?? '';
    const lop = m[3] !== undefined ? [...gt.matchAll(/['"`]([^'"`]*)['"`]/g)].flatMap(x => x[1].split(/\s+/)) : gt.split(/\s+/);
    for (const l of lop) if (LOP_CU.has(l)) ra.push(`class ${l}`);
  }
  for (const m of van.matchAll(/thuong-hieu\/[\w.-]+/g)) {
    if (new RegExp(`^thuong-hieu/${TEN_FILE_CU}(?![\\w-])`).test(m[0])) ra.push(`đường dẫn ${m[0]}`);
  }
  return [...new Set(ra)];
}

await nhom('1 · KHÔNG CÒN THAM CHIẾU TỚI HÌNH BỘ CŨ (src, href, url(), class, --hinh, đường dẫn thuong-hieu/…)', async () => {
  ok(`Danh sách quét (${tepQuet.length} file) có trang, CSS, kiểm thử trình duyệt, công cụ, skill, tài liệu — không có THUONG-HIEU.md, crm/test`,
     tepQuet.length > 250 && tepQuet.includes('web/src/styles/cong-khai.css') && tepQuet.includes('web/kiem-tra/do-giao-dien.mjs')
       && tepQuet.includes('README.md') && tepQuet.some(f => f.startsWith('.claude/skills/')) && !tepQuet.includes('THUONG-HIEU.md')
       && !tepQuet.some(f => f.startsWith('crm/test/')));
  const conCu = tepQuet.flatMap(f => thamChieuCu(doc(f)).map(t => `${f}: ${t}`));
  ok('Không file nào còn tham chiếu tới hình bộ cũ (đầu bò cũ, hương thảo, vân mỡ, steak, chữ lặp, tem tròn, logo kem)', conCu.length === 0,
     conCu.slice(0, 8).join(' | '));
  // Mẫu tự kiểm: bắt mọi kiểu tham chiếu; không bắt chữ trong câu, ảnh chụp bo-van-mo-can, file logo mới.
  const BAT = [
    '<img class="ct-tem" src="/thuong-hieu/tem-tron.svg" width="320" />',
    "mask: url('/thuong-hieu/van-mo-gan.svg') no-repeat;",
    '<span class="trang-tri net huong-thao-5 net-goc" aria-hidden="true"></span>',
    "--hinh: url('/thuong-hieu/steak-net-1.svg');",
    '<section class:list={[\'muc\', \'be-do\', \'nen-van-mo\']}>',
    'dựng từ brandmark (`public/thuong-hieu/dau-bo-kem.svg`, path gốc)',
    "<img src={`/thuong-hieu/logo-ngang-kem.svg`} />",
  ];
  const KHONG_BAT = [
    'Chân trang không `hoa-van-chu`, không tem tròn.',
    'Ba bước dùng số lớn (thay cho nhánh rosemary của bản trước).',
    '<img src="/anh/bo-van-mo-can-800x600-1.webp" alt="" />',
    '<img src="/thuong-hieu/logo-ngang-trang.svg" width="579" height="131" />',
    "if (document.querySelector('.hoa-van-chu')) kq.push('còn hoa văn chữ');",
    '<img src="/thuong-hieu/dau-bo-do.svg" /> <span class="nb-nhan">',
    "kmd.querySelector('img[src*=\"tem-tron\"]')",
  ];
  const lot = BAT.filter(m => thamChieuCu(m).length === 0);
  const nham = KHONG_BAT.filter(m => thamChieuCu(m).length > 0);
  ok(`…phép quét bắt được ${BAT.length} kiểu tham chiếu (src, url(), class, --hinh, class:list, đường dẫn trong tài liệu, src={\`…\`}) và không bắt ${KHONG_BAT.length} câu, ảnh chụp, logo mới`,
     lot.length === 0 && nham.length === 0, [...lot.map(m => `lọt: ${m}`), ...nham.map(m => `bắt nhầm: ${m} → ${thamChieuCu(m).join(', ')}`)].join(' | '));
});

// ===========================================================================
await nhom('2 · MỌI ĐƯỜNG DẪN /thuong-hieu/<file> TRONG web/src CÓ FILE THẬT', async () => {
  const thamChieu = TEP_GIT.filter(f => f.startsWith('web/src/') && DUOI_CHU.test(f)).flatMap(f => {
    const van = doc(f);
    return [...van.matchAll(/["'`(]\/thuong-hieu\/([\w.-]+)/g)].map(m => [f, m[1]]);
  });
  const thieu = thamChieu.filter(([, ten]) => !existsSync(join(GOC, 'web', 'public', 'thuong-hieu', ten))).map(([f, ten]) => `${f}: /thuong-hieu/${ten}`);
  ok(`${thamChieu.length} đường dẫn /thuong-hieu/<file> trong web/src (src=, href=, url(), preload) đều có file trong web/public/thuong-hieu`,
     thamChieu.length >= 5 && thieu.length === 0, thieu.slice(0, 6).join(' | '));
});

// ===========================================================================
/** Phần template của một file .astro: sau khối --- … ---, bỏ <script>, <style>, chú thích JSX và HTML. */
const mauCua = nguon => nguon.replace(/^---[\s\S]*?\n---/, '').replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
  .replace(/<script[^>]*>[\s\S]*?<\/script>/g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/<!--[\s\S]*?-->/g, '');

await nhom('3 · LOGO THAY CHỮ GÕ "BEEFTOWN": ĐẦU TRANG /noi-bo, KHO VÀ TRANG IN', async () => {
  // Luật "không gõ lại chữ BEEFTOWN bằng phông" (skill thiết kế): chữ của logo là hình (Figtree, path gốc của PDF).
  const TRANG_CO_LOGO = ['web/src/layouts/NoiBo.astro', 'web/src/layouts/Kho.astro', 'web/src/components/kho/InDau.astro', 'web/src/pages/noi-bo/kho/dat-hang/[id]/in.astro'];
  const goChu = TRANG_CO_LOGO.filter(f => />[^<{]*\bBEEFTOWN\b/.test(mauCua(doc(f))));
  ok('Không gõ chữ BEEFTOWN bằng phông thay logo: NoiBo.astro, Kho.astro, InDau.astro, phiếu đặt hàng in (in.astro) — chỉ quét markup',
     goChu.length === 0, goChu.join(', '));
  ok('…phép quét bắt được <p>BEEFTOWN · chi nhánh</p>, không bắt alt="Beeftown" hay chữ trong chú thích',
     />[^<{]*\bBEEFTOWN\b/.test(mauCua('---\n---\n<p class="kho-in-quan">BEEFTOWN{chiNhanh}</p>'))
       && !/>[^<{]*\bBEEFTOWN\b/.test(mauCua('---\nconst a = 1;\n---\n<img src="/thuong-hieu/logo-ngang-den.svg" alt="Beeftown" />{/* BEEFTOWN */}<!-- >BEEFTOWN -->')));
  /** Ảnh logo trong markup: [src, …]. */
  const logo = f => [...mauCua(doc(f)).matchAll(/<img\b[^>]*\ssrc="(\/thuong-hieu\/[^"]+)"/g)].map(m => m[1]);
  ok('Đầu trang /noi-bo (NoiBo.astro, nền đen): logo phụ trắng /thuong-hieu/chu-beeftown-trang.svg',
     logo('web/src/layouts/NoiBo.astro').includes('/thuong-hieu/chu-beeftown-trang.svg'), logo('web/src/layouts/NoiBo.astro').join(', ') || 'không có logo');
  ok('Đầu trang kho (Kho.astro, nền đen): brandmark trắng /thuong-hieu/dau-bo-trang.svg — không còn biểu tượng tab bieu-tuong.svg',
     logo('web/src/layouts/Kho.astro').includes('/thuong-hieu/dau-bo-trang.svg') && !/<img\b[^>]*src="\/bieu-tuong\.svg"/.test(mauCua(doc('web/src/layouts/Kho.astro'))),
     logo('web/src/layouts/Kho.astro').join(', ') || 'không có logo');
  ok('Đầu tờ in của kho (InDau.astro, giấy trắng, máy in đen trắng): logo chính đen /thuong-hieu/logo-ngang-den.svg',
     logo('web/src/components/kho/InDau.astro').includes('/thuong-hieu/logo-ngang-den.svg'), logo('web/src/components/kho/InDau.astro').join(', ') || 'không có logo');
  const banTrangTrenSang = TRANG_CO_LOGO.filter(f => /InDau|in\.astro/.test(f)).flatMap(f => logo(f).filter(s => /-trang\.svg$/.test(s)).map(s => `${f}: ${s}`));
  ok('Trang in không dùng bản trắng (bản trắng chỉ trên nền đen / đỏ)', banTrangTrenSang.length === 0, banTrangTrenSang.join(' | '));
});

// ===========================================================================
const TAGLINE = 'Pick it, grill it, love it!';
const TAGLINE_CU = /Pick it\.\s*Grill it\.\s*Love it\.?|Pick it\s*[–-]\s*Grill it\s*[–-]\s*Love it/i;

await nhom('4 · TAGLINE "Pick it, grill it, love it!" Ở MỌI NƠI', async () => {
  const { THUONG_HIEU } = await nap('chu.ts');
  ok(`chu.ts: THUONG_HIEU.khauHieu là «${TAGLINE}» (phẩy, chấm than — theo logo 21/10/2026)`, THUONG_HIEU?.khauHieu === TAGLINE, THUONG_HIEU?.khauHieu);
  const { QUY_TAC_DICH } = await nap('may-dich.ts');
  ok('may-dich.ts: quy tắc dịch giữ nguyên đúng chuỗi tagline mới (tiếng Anh ở mọi thứ tiếng), không còn chuỗi cũ',
     typeof QUY_TAC_DICH === 'string' && QUY_TAC_DICH.includes(`"${TAGLINE}"`) && !TAGLINE_CU.test(QUY_TAC_DICH));
  // Chữ trên trang và tài liệu: web/src (mọi file chữ), tài liệu .md ở gốc và web/, mini-app (chữ của Mini App, CLAUDE.md).
  const VUNG_CHU = [/^web\/src\//, /^[^/]+\.md$/, /^web\/[^/]+\.md$/, /^mini-app\/CLAUDE\.md$/, /^mini-app\/src\//];
  const tep = TEP_GIT.filter(f => DUOI_CHU.test(f) && VUNG_CHU.some(v => v.test(f)) && !KHONG_QUET.has(f));
  const conCu = tep.filter(f => TAGLINE_CU.test(doc(f))).map(f => `${f}: «${doc(f).match(TAGLINE_CU)[0]}»`);
  ok(`${tep.length} file chữ (web/src, tài liệu, Mini App): không còn tagline cũ "Pick it. Grill it. Love it." hay "Pick it – Grill it – Love it"`,
     tep.length > 200 && conCu.length === 0, conCu.slice(0, 6).join(' | '));
  ok('…phép tìm bắt cả hai cách viết cũ (kể cả chữ hoa của logo cũ), không bắt tagline mới',
     TAGLINE_CU.test('Pick it. Grill it. Love it.') && TAGLINE_CU.test('PICK IT – GRILL IT – LOVE IT') && !TAGLINE_CU.test(TAGLINE) && !TAGLINE_CU.test(TAGLINE.toUpperCase()));
  // Màn đầu tách tagline thành từng vế (mỗi vế không xuống dòng giữa chừng) theo dấu câu: tách theo dấu chấm như bản
  // cũ thì câu mới (chỉ phẩy) thành một khối nowrap duy nhất — tràn ngang ở màn 320px.
  const moDau = doc('web/src/components/KhoiMoDau.astro');
  const tach = moDau.match(/khauHieu\.split\((\/[^\n]*?\/[gimsuy]*)\)/)?.[1];
  let ve = [];
  try { ve = tach ? TAGLINE.split(new Function(`return ${tach}`)()) : []; } catch { ve = []; }
  ok(`KhoiMoDau.astro: dải tagline tách vế theo dấu câu [,.!] — «${TAGLINE}» thành 3 vế`,
     !!tach && /\[,\.!\]|\[\.,!\]|\[!,\.\]/.test(tach) && ve.length === 3, tach ? `${tach} → ${JSON.stringify(ve)}` : 'không thấy THUONG_HIEU.khauHieu.split(…)');
});

// ===========================================================================
// Mã của bảng 09/10/2026 (cùng màu pha 10/10/2026) và tám màu trạng thái bỏ ngày 25/10/2026 — viết hex, bộ ba trong
// rgb() / rgba() (phẩy hoặc cách), hoặc bộ ba 0x… / (r, g, b) của công cụ Python. Tài liệu ghi mã cũ là dạy người đọc
// dùng lại màu đã bỏ (lịch sử chỉ ở THUONG-HIEU.md, không quét).
const HEX_CU = ['A70C0C', '890607', 'F0E3D0', 'EBDCC6', 'E7D5BC', '151008', 'F5AA14', 'B8A98C', '7A7366', '211A10', 'FFFDF6',
  '1A683F', 'D3E3C6', 'A3C597', '7A5200', 'F6DC9E', 'DDB65C', 'F2D6CE', 'DDA79C'];
const BO_BA_CU = [[21, 16, 8], [240, 227, 208], [167, 12, 12], [137, 6, 7], [245, 170, 20], [184, 169, 140]];
const MA_CU = new RegExp([
  `#(?:${HEX_CU.join('|')})\\b`,
  `rgba?\\(\\s*(?:${BO_BA_CU.map(b => b.join('[\\s,]+')).join('|')})\\b`,
  `\\(\\s*(?:${BO_BA_CU.map(b => b.map(x => `(?:${x}|0x${x.toString(16).padStart(2, '0')})`).join('\\s*,\\s*')).join('|')})\\s*[,)]`,
].join('|'), 'gi');

await nhom('5 · TÀI LIỆU, CÔNG CỤ, FILE CHỮ KHÔNG CÒN MÃ MÀU CỦA BẢNG 09/10/2026 HAY MÀU TRẠNG THÁI', async () => {
  const conCu = tepQuet.flatMap(f => {
    const thay = [...new Set(doc(f).match(MA_CU) ?? [])];
    return thay.length ? [`${f}: ${thay.slice(0, 4).join(' ')}`] : [];
  });
  ok(`${tepQuet.length} file (web/src, web/public, web/kiem-tra, web/cong-cu, skill, .github, tài liệu .md) không còn mã màu của bảng 09/10/2026 hay tám màu trạng thái`,
     conCu.length === 0, conCu.slice(0, 8).join(' | '));
  const BAT = ['#A70C0C', '#f0e3d0', '`#1A683F`', 'rgba(21, 16, 8, .68)', 'rgb(240 227 208 / .22)', 'NEN_KEM = (0xF0, 0xE3, 0xD0, 255)', 'mau = (240, 227, 208)', 'rgb(167,12,12)'];
  const KHONG_BAT = ['#BD0000', '#8F0000', 'rgba(0, 0, 0, .78)', 'rgba(255, 255, 255, .22)', 'NEN_TRANG = (0xFF, 0xFF, 0xFF, 255)', 'M 21 16 8 L 240 227 208', '(21, 16, 80)', 'margin: 21px 16px 8px'];
  const lot = BAT.filter(m => !m.match(MA_CU)), nham = KHONG_BAT.filter(m => m.match(MA_CU));
  ok(`…bộ lọc bắt được ${BAT.length} kiểu viết (hex, rgb() phẩy / cách, bộ ba 0x… và (r, g, b) của Python), không bắt ${KHONG_BAT.length} mã mới, số đo, số trong path`,
     lot.length === 0 && nham.length === 0, [...lot.map(m => `lọt: ${m}`), ...nham.map(m => `bắt nhầm: ${m}`)].join(' | '));
});

process.exit(ketThuc('BỘ NHẬN DIỆN TRÊN TOÀN REPO'));
