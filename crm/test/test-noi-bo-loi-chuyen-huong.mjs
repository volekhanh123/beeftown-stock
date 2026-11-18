/**
 * BEEFTOWN — /noi-bo (CRM): GỬI FORM KHÔNG THÀNH CŨNG CHUYỂN HƯỚNG 303 (issue #194, đợt 4)
 * ======================================================================================
 *
 *     node test/test-noi-bo-loi-chuyen-huong.mjs
 *
 * Trang CRM ghi được thì đã 303 sang GET từ rà soát 11/10/2026 (lib/gui-noi-bo.ts, chuyenHuongNoiBo —
 * test-noi-bo-gui-lai.mjs). KHÔNG ghi được thì dựng lại trang ngay trong trả lời của lượt POST: mục lịch sử đó
 * giữ nguyên thân form, F5 trên nó (hay Quay lại / Tiến tới rồi F5) là gửi lại. Lý do cũ — "để chữ đã gõ còn
 * nguyên" — không đúng với sáu trang dưới đây: chúng dựng lại form từ database, không điền lại chữ nào của lượt
 * gửi (xem tay 16/11/2026). Nên ở sáu trang này, mọi kết cục của lượt POST là 303 về chính trang (giữ bộ lọc),
 * câu báo — lỗi cũng vậy — đi theo cookie dùng một lần như câu "đã lưu".
 *
 * Bảy trang CRM có điền lại chữ đã gõ (thực đơn, tin tuyển dụng, bán lẻ, video đào tạo, chiến dịch Zalo) vẫn dựng
 * tại chỗ khi lỗi — chữ dài, không vừa một cookie. Khánh quyết 16/11/2026 giữ cách này (#194).
 *
 * Bất biến:
 *   1. ghiBaoNoiBo: câu báo dài (câu lỗi của database có thể dài) được cắt để cookie luôn vừa giới hạn của trình
 *      duyệt — cookie quá cỡ bị trình duyệt BỎ, và trang sau chuyển hướng không báo gì (người ta tưởng đã lưu).
 *   2. Sáu trang: khối POST kết thúc bằng `return chuyenHuongNoiBo(Astro, bao)`; mọi câu return trong khối là
 *      chuyển hướng 303 — không lối nào đi tiếp xuống phần HTML.
 *   3. Bảy trang có điền lại chữ: còn nguyên cách cũ (ghi được thì 303), danh sách khớp với ghi chú của
 *      lib/gui-noi-bo.ts — trang mới phải được xếp vào một trong hai nhóm.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const GNB = await import(pathToFileURL(join(SRC, 'lib', 'gui-noi-bo.ts')).href);
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — /noi-bo (CRM): GỬI KHÔNG THÀNH CŨNG CHUYỂN HƯỚNG 303 (#194)');

const SAU_TRANG = ['dat-ban.astro', 'don-mua-thit.astro', 'tuyen-dung.astro', 'cai-dat.astro', 'noi-dung.astro', 'tin-tuyen-dung/index.astro'];
const BAY_TRANG_DIEN_LAI = ['thuc-don/[id].astro', 'tin-tuyen-dung/[id].astro', 'ban-le/[id].astro', 'ban-le/cai-dat.astro',
  'ban-le/index.astro', 'dao-tao.astro', 'zalo/chien-dich/moi.astro',
  // 0126 · sổ học của Trang: câu trả lời tới 1.000 ký tự, máy kiểm tiếng Việt từ chối là chuyện thường — điền lại chữ đã gõ.
  'tro-ly.astro'];
const docTrang = t => readFileSync(join(SRC, 'pages', 'noi-bo', t), 'utf8');

/** Khối `if (… Astro.request.method === 'POST') { … }` ở cấp ngoài cùng của phần đầu trang, bỏ chú thích. */
function khoiPost(s) {
  const fm = s.slice(s.indexOf('---') + 3, s.indexOf('\n---', s.indexOf('---') + 3));
  const m = fm.match(/\nif \((?:[\w.]+ && )?Astro\.request\.method === 'POST'(?: && [\w.]+)?\) \{\n/);
  if (!m) return '';
  const dau = m.index + 1;
  return fm.slice(dau, fm.indexOf('\n}\n', dau) + 2).replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

// ===========================================================================
await nhom('1 · ghiBaoNoiBo: CÂU BÁO DÀI KHÔNG LÀM COOKIE QUÁ CỠ (trình duyệt bỏ cookie quá cỡ — trang không báo gì)', async () => {
  let v = null;
  const cookies = { set: (ten, gt, tuy) => { v = { ten, gt, tuy }; }, get: ten => (v?.ten === ten ? { value: v.gt } : undefined), delete: () => { v = null; } };
  const dai = 'Không ghi được — dữ liệu vượt quá giới hạn cho phép của cột ghi chú (tối đa 2.000 ký tự). '.repeat(30);
  GNB.ghiBaoNoiBo(cookies, { ok: false, cau: dai }, '/noi-bo/cai-dat');
  // Astro mã hóa giá trị bằng encodeURIComponent; trình duyệt nhận tối đa 4096 byte cho tên + giá trị + thuộc tính.
  const coMaHoa = encodeURIComponent(v?.gt ?? '').length + 'bt_nb_bao='.length;
  ok('#194: câu lỗi rất dài (≈ 2.800 ký tự có dấu) → giá trị cookie sau mã hóa vẫn dưới 3.800 byte', v !== null && coMaHoa < 3800, String(coMaHoa));
  const doc = GNB.docBaoNoiBo(cookies, '/noi-bo/cai-dat');
  ok('…đọc lại được: vẫn là câu lỗi (ok: false), đầu câu giữ nguyên, có dấu "…" ở chỗ cắt',
     doc?.ok === false && doc.cau.startsWith('Không ghi được — dữ liệu vượt quá giới hạn') && doc.cau.endsWith('…'), (doc?.cau ?? '').slice(-40));
  GNB.ghiBaoNoiBo(cookies, { ok: true, cau: 'Đã lưu cài đặt.' }, '/noi-bo/cai-dat');
  ok('Câu ngắn giữ nguyên từng chữ', GNB.docBaoNoiBo(cookies, '/noi-bo/cai-dat')?.cau === 'Đã lưu cài đặt.');
});

// ===========================================================================
await nhom(`2 · ${SAU_TRANG.length} TRANG CRM KHÔNG ĐIỀN LẠI CHỮ: MỌI KẾT CỤC CỦA LƯỢT POST LÀ 303`, async () => {
  for (const tep of SAU_TRANG) {
    const khoi = khoiPost(docTrang(tep));
    ok(`${tep}: tìm thấy khối POST`, khoi.length > 0);
    const cuoi = khoi.trimEnd().split('\n').slice(-2).join('\n');
    ok(`#194: ${tep} — khối POST kết thúc bằng return chuyenHuongNoiBo(Astro, bao): lỗi cũng là 303 về chính trang, không dựng tại chỗ`,
       /\n  return chuyenHuongNoiBo\(Astro, bao\);\n\}$/.test(khoi.trimEnd()), cuoi);
    const cacReturn = [...khoi.matchAll(/\breturn\b[^;]*;/g)].map(m => m[0]);
    ok(`#194: ${tep} — mọi câu return trong khối POST là chuyển hướng 303 (${cacReturn.length})`,
       cacReturn.length > 0 && cacReturn.every(r => /^return chuyenHuongNoiBo\(/.test(r) || /^return Astro\.redirect\([^;]*, 303\);$/.test(r)),
       cacReturn.filter(r => !/^return chuyenHuongNoiBo\(|^return Astro\.redirect\(/.test(r)).join(' | '));
    ok(`${tep}: không câu "if (… POST …)" nào khác ngoài khối đó, trừ dòng chuyển hướng 303 một câu`,
       (docTrang(tep).match(/if \([^)\n]*Astro\.request\.method === 'POST'[^)\n]*\)/g) ?? []).length
       === 1 + (docTrang(tep).match(/if \([^)\n]*Astro\.request\.method === 'POST'[^)\n]*\) return Astro\.redirect\([^;]*, 303\);/g) ?? []).length);
    ok(`${tep}: không dựng lại form từ chữ của lượt gửi (không form.get trong phần HTML) — nên chuyển hướng không làm mất chữ nào`,
       !/form\??\.get\(/.test(docTrang(tep).slice(docTrang(tep).indexOf('\n---', 4) + 4)));
  }
});

// ===========================================================================
await nhom('3 · BẢY TRANG CÓ ĐIỀN LẠI CHỮ: CÒN CÁCH CŨ, CÓ TÊN TRONG GHI CHÚ CỦA lib/gui-noi-bo.ts', async () => {
  const ghiChu = readFileSync(join(SRC, 'lib', 'gui-noi-bo.ts'), 'utf8');
  for (const tep of BAY_TRANG_DIEN_LAI) {
    const s = docTrang(tep);
    ok(`${tep}: vẫn 303 khi ghi được`, /return (chuyenHuongNoiBo\(|Astro\.redirect\()/.test(khoiPost(s)));
    ok(`${tep}: có tên trong ghi chú "còn dựng tại chỗ khi lỗi" của lib/gui-noi-bo.ts`, ghiChu.includes(tep.replace(/\.astro$/, '')), tep);
  }
  // Trang CRM mới có POST phải được xếp vào một nhóm (không lặng lẽ dựng tại chỗ).
  const moiFile = d => readdirSync(d, { withFileTypes: true }).flatMap(x => x.isDirectory() ? moiFile(join(d, x.name)) : [join(d, x.name)]);
  const goc = join(SRC, 'pages', 'noi-bo');
  const coPost = moiFile(goc).filter(f => f.endsWith('.astro') && !f.includes('/kho/')).map(f => relative(goc, f))
    .filter(f => /method === 'POST'/.test(readFileSync(join(goc, f), 'utf8')));
  const daXep = new Set([...SAU_TRANG, ...BAY_TRANG_DIEN_LAI, 'dang-nhap.astro', 'zalo/cai-dat.astro', 'zalo/index.astro', 'messenger.astro']);
  const chuaXep = coPost.filter(f => !daXep.has(f));
  ok('Mọi trang CRM có POST đều đã được xếp: 303 mọi kết cục, hay còn dựng tại chỗ khi lỗi (có lý do)', chuaXep.length === 0, chuaXep.join(', '));
});

process.exit(ketThuc('/noi-bo (CRM): GỬI KHÔNG THÀNH CŨNG CHUYỂN HƯỚNG'));
