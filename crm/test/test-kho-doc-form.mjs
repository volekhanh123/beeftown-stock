/**
 * BEEFTOWN KHO — KHÔNG ĐỌC ĐƯỢC THÂN POST THÌ NÓI RA, MỘT CÂU MỘT CHỖ
 * ===================================================================
 *
 *     node test/test-kho-doc-form.mjs
 *
 * Rà soát nợ kỹ thuật 11/10/2026: docFormGui (lib/kho/trang.ts) trả null khi không đọc được thân
 * POST (mạng đứt giữa chừng, thân cụt). 16 / 41 trang kho gọi nó tự đặt câu "Không đọc được dữ liệu
 * gửi lên — mạng có thể đã đứt giữa chừng" — mỗi trang một bản chép, ba kiểu tiếng Anh khác nhau —
 * còn 25 trang IM LẶNG: thủ kho bấm "Lưu", trang dựng lại y như chưa bấm, không một câu nào. Người ta
 * tưởng đã lưu, hoặc bấm lại mãi.
 *
 * Từ bản này: docFormGui đọc hỏng thì đánh dấu lượt xem (Astro.locals.formGuiHong); BaoKho — có trên
 * mọi trang gọi docFormGui — hiện câu CAU_DOC_FORM_HONG của lib/gui-noi-bo.ts, câu dùng chung với CRM.
 * Không trang nào tự đặt câu đó nữa.
 *
 * Bất biến:
 *   1. docFormGui: POST đọc được → FormData, không đánh dấu; thân cụt → null VÀ đánh dấu; GET → null,
 *      không đánh dấu, không đọc thân.
 *   2. baoDocFormHong(locals) (lib/kho/bao.ts): có dấu → câu báo lỗi hai thứ tiếng; không dấu → null.
 *   3. BaoKho.astro hiện câu đó, không trùng khi trang đã tự báo đúng câu ấy.
 *   4. MỌI trang gọi docFormGui đều dựng <BaoKho; không trang nào còn câu "Không đọc được dữ liệu gửi
 *      lên" hay khối "method === 'POST' && !form" riêng.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KHÔNG ĐỌC ĐƯỢC THÂN POST: MỘT CÂU, MỌI TRANG');

const TRANG = await nap('kho/trang.ts');
const BAO = await nap('kho/bao.ts');
const { CAU_DOC_FORM_HONG } = await nap('gui-noi-bo.ts').catch(() => ({}));

const moiFile = d => readdirSync(d, { withFileTypes: true })
  .flatMap(x => x.isDirectory() ? moiFile(join(d, x.name)) : [join(d, x.name)]);
const trangKho = moiFile(join(SRC, 'pages', 'noi-bo', 'kho')).filter(f => f.endsWith('.astro'));
const goiDocForm = trangKho.filter(f => /docFormGui\(/.test(readFileSync(f, 'utf8')));
const ten = f => relative(SRC, f);

// ===========================================================================
await nhom('1 · docFormGui đánh dấu lượt xem khi không đọc được thân', async () => {
  const f = new FormData(); f.set('viec', 'luu'); f.set('ghi_chu', 'Thùng 1.000 g — đã cân');
  const locals1 = {};
  const ra1 = await TRANG.docFormGui({ request: new Request('https://x/noi-bo/kho/xuat/moi', { method: 'POST', body: f }), locals: locals1 });
  ok('POST đọc được → FormData, chữ có dấu nguyên vẹn, không đánh dấu', ra1?.get('ghi_chu') === 'Thùng 1.000 g — đã cân' && !locals1.formGuiHong);

  const cut = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('------b\r\nContent-Disposition: form-data; name="viec"\r\n\r\nluu')); c.error(new TypeError('terminated')); } });
  const locals2 = {};
  let nem = null, ra2;
  try {
    ra2 = await TRANG.docFormGui({ request: new Request('https://x/noi-bo/kho/xuat/moi', { method: 'POST', body: cut, duplex: 'half',
      headers: { 'content-type': 'multipart/form-data; boundary=----b' } }), locals: locals2 });
  } catch (e) { nem = e; }
  ok('Thân cụt (mạng đứt giữa chừng) → null, không ném', !nem && ra2 === null, nem?.message ?? String(ra2));
  ok('…và đánh dấu Astro.locals.formGuiHong = true', locals2.formGuiHong === true, JSON.stringify(locals2));

  const locals3 = {};
  const ra3 = await TRANG.docFormGui({ request: new Request('https://x/noi-bo/kho/xuat/moi'), locals: locals3 });
  ok('GET → null, không đánh dấu', ra3 === null && !locals3.formGuiHong);
});

// ===========================================================================
await nhom('2 · baoDocFormHong — câu dùng chung với CRM, hai thứ tiếng', async () => {
  ok('lib/kho/bao.ts xuất baoDocFormHong', typeof BAO.baoDocFormHong === 'function', Object.keys(BAO).join(', '));
  if (typeof BAO.baoDocFormHong !== 'function') return;
  const b = BAO.baoDocFormHong({ formGuiHong: true });
  ok('Có dấu → câu lỗi (ok: false), tiếng Việt và tiếng Anh của CAU_DOC_FORM_HONG (lib/gui-noi-bo.ts)',
     b?.ok === false && b.cau === CAU_DOC_FORM_HONG?.vi && b.cauEn === CAU_DOC_FORM_HONG?.en, JSON.stringify(b));
  ok('Câu nói mạng có thể đã đứt, bảo gửi lại — không nói "đã lưu"',
     /mạng có thể đã đứt giữa chừng/.test(b?.cau ?? '') && /gửi lại/.test(b?.cau ?? '') && !/đã lưu/i.test(b?.cau ?? ''));
  ok('Không dấu → null', BAO.baoDocFormHong({}) === null && BAO.baoDocFormHong(undefined) === null);
});

// ===========================================================================
await nhom('3 · BaoKho hiện câu đó, không trùng', async () => {
  const s = readFileSync(join(SRC, 'components', 'kho', 'BaoKho.astro'), 'utf8');
  ok('BaoKho.astro gọi baoDocFormHong(Astro.locals)', /baoDocFormHong\(Astro\.locals\)/.test(s));
  ok('BaoKho.astro bỏ câu của dấu khi trang đã tự báo đúng câu ấy (không hiện hai lần)', /\.cau !== /.test(s) || /\.cau === /.test(s));
  ok('Câu lỗi hiện với role="alert"', /role=\{?.?alert/.test(s));
});

// ===========================================================================
await nhom(`4 · ${goiDocForm.length} trang gọi docFormGui: đều có BaoKho, không trang nào tự đặt câu`, async () => {
  ok('Có ít nhất 41 trang kho gọi docFormGui', goiDocForm.length >= 41, String(goiDocForm.length));
  const thieuBao = goiDocForm.filter(f => !/<BaoKho\b/.test(readFileSync(f, 'utf8')));
  ok('Mọi trang gọi docFormGui đều dựng <BaoKho (nên câu "không đọc được" hiện ra)', thieuBao.length === 0, thieuBao.map(ten).join(', '));
  const tuDat = trangKho.filter(f => /Không đọc được dữ liệu gửi lên/.test(readFileSync(f, 'utf8')));
  ok('Không trang kho nào còn câu "Không đọc được dữ liệu gửi lên" riêng (một chỗ: lib/gui-noi-bo.ts)', tuDat.length === 0, tuDat.map(ten).join(', '));
  const khoiRieng = trangKho.filter(f => /method === 'POST' && !(form|fd)\b/.test(readFileSync(f, 'utf8')));
  ok('Không trang kho nào còn khối "method === \'POST\' && !form" riêng', khoiRieng.length === 0, khoiRieng.map(ten).join(', '));
  const nguon = readFileSync(join(SRC, 'lib', 'kho', 'trang.ts'), 'utf8');
  ok('lib/kho/trang.ts: docFormGui đánh dấu locals.formGuiHong trong catch', /catch\s*\{[^}]*formGuiHong\s*=\s*true/.test(nguon));
});

process.exit(ketThuc('KHÔNG ĐỌC ĐƯỢC THÂN POST'));
