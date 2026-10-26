/**
 * Kiểm thử 2.11 — GIAO DIỆN TRONG TRÌNH DUYỆT THẬT (Chromium), cho từng vai:
 *
 *     cd can-app && npx bun test/thu-trinh-duyet.ts
 *
 * Các kiểm thử khác đọc mã trang (regex, new Function) nên không bắt được lỗi lúc chạy: xoá một biến mà trang còn dùng thì
 * mọi vai chỉ thấy khung lỗi đỏ, không thẻ nào hiện — kiểm thử đọc mã vẫn xanh. File này mở trang thật của chương trình
 * (test/xem-giao-dien.ts: kho giả, cân giả, máy chủ thật của chương trình) ở cỡ cửa sổ của Beeftown Cân (1180 × 860) cho:
 * chưa đăng nhập kho (có / chưa có file gốc), NV quầy, thủ kho, kế toán, quản lý, chủ, quản lý khi cân chưa có file gốc.
 * Mỗi lượt:
 *   1. thanh thẻ đúng các thẻ của vai, đúng thứ tự (bảng thu-giao-dien-gon.ts — chủ duyệt 25/10/2026), thẻ mở sẵn đúng;
 *   2. bấm từng thẻ: đúng các mục hiện; mục gập đóng sẵn (trừ chỗ tự mở); mở từng mục gập — nội dung tải xong;
 *   3. không lỗi JavaScript, không dòng lỗi nào ở console suốt lượt.
 * Thêm: Tảng & ô mã tự mở khi có ô cân chưa đổi tên và dòng gập nêu ô đó (kho giả: ô 1 Ribeye giữ tảng #0150, cân còn tên
 * #0142); phím mũi tên chỉ dời ô tem khi mục Mẫu tem đang mở.
 *
 * Thư viện playwright lấy từ web/node_modules (cài web/ trước: cd web && npm ci) — cùng bản job web của kiem-thu.yml.
 * Chromium: cd web && npx playwright install chromium. CI: kiem-thu.yml (job database-va-can) và dong-goi-can.yml cài
 * Chromium rồi chạy file này sau test/thu.ts. Hỏng thì ảnh chụp màn hình nằm ở thư mục tạm (đường dẫn in ra).
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createRequire } from 'node:module';
import { moGiaoDienGia } from './xem-giao-dien.ts';
import { MUC_CUA_THE, MUC_GAP, NAM_THE } from './thu-giao-dien-gon.ts';

type Ok = (ten: string, dieuKien: boolean, chiTiet?: string) => void;

/** Phần của Playwright file này dùng (can-app không có kiểu của thư viện — thư viện nằm ở web/). */
interface TinConsole { type(): string; text(): string }
interface TrangPw {
  goto(url: string): Promise<unknown>;
  on(suKien: 'console', f: (m: TinConsole) => void): void;
  on(suKien: 'pageerror', f: (e: Error) => void): void;
  waitForFunction<A>(f: (a: A) => unknown, a: A, tuy?: { timeout?: number }): Promise<unknown>;
  waitForSelector(chon: string, tuy?: { state?: 'visible' | 'attached'; timeout?: number }): Promise<unknown>;
  evaluate<R, A>(f: (a: A) => R, a: A): Promise<R>;
  click(chon: string, tuy?: { timeout?: number }): Promise<void>;
  keyboard: { press(phim: string): Promise<void> };
  waitForTimeout(ms: number): Promise<void>;
  screenshot(tuy: { path: string; fullPage?: boolean }): Promise<unknown>;
  close(): Promise<void>;
}
interface TrinhDuyetPw { newPage(tuy: { viewport: { width: number; height: number } }): Promise<TrangPw>; close(): Promise<void> }
interface Playwright { chromium: { launch(): Promise<TrinhDuyetPw> } }

/**
 * Mở Chromium: Playwright của web/ (CI cài Chromium đúng bản đó), không được thì bản Playwright cài chung của máy (máy làm việc
 * có sẵn trình duyệt cho bản đó). Không bản nào mở được → lỗi kèm cách cài; kiểm thử ĐỎ, không bỏ qua.
 */
async function moChromium(): Promise<TrinhDuyetPw> {
  const noi = [path.join(import.meta.dir, '..', '..', 'web', 'package.json'), import.meta.path];
  const loi: string[] = [];
  for (const f of noi) {
    let pw: Playwright;
    try { pw = createRequire(f)('playwright') as Playwright; } catch (e) { loi.push(`${f}: ${String(e).split('\n')[0]}`); continue; }
    try { return await pw.chromium.launch(); } catch (e) { loi.push(`${f}: ${String(e).split('\n')[0]}`); }
  }
  throw new Error('Không mở được Chromium — cài web/ trước (cd web && npm ci) rồi npx playwright install chromium. ' + loi.join(' · '));
}

interface KichBan { ten: string; vai: string | null; chuaCoGoc?: boolean; the: Record<string, string[]> }
const chiThe = (...ds: string[]) => Object.fromEntries(ds.map(t => [t, MUC_CUA_THE[t]]));
const KICH_BAN: KichBan[] = [
  { ten: 'Chưa đăng nhập kho', vai: null, the: chiThe('Cân', 'Thiết lập cân') },
  { ten: 'Chưa đăng nhập kho, cân chưa có file gốc', vai: null, chuaCoGoc: true, the: { 'Thiết lập cân': ['can', 'nhat-ky'] } },
  { ten: 'NV quầy', vai: 'nhan_vien_quay', the: chiThe('Quầy') },
  { ten: 'Thủ kho', vai: 'thu_kho', the: chiThe('Quầy') },
  { ten: 'Kế toán', vai: 'ke_toan', the: chiThe('Quầy', 'Báo cáo') },
  { ten: 'Quản lý', vai: 'quan_ly', the: chiThe(...NAM_THE) },
  { ten: 'Chủ', vai: 'chu_so_huu', the: chiThe(...NAM_THE) },
  { ten: 'Quản lý, cân chưa có file gốc', vai: 'quan_ly', chuaCoGoc: true,
    the: { 'Quầy': MUC_CUA_THE['Quầy'], 'Giảm giá': ['giam'], 'Báo cáo': ['bao-cao'], 'Thiết lập cân': ['can', 'nhat-ky'] } },
];

/** Thứ chứng tỏ mục đã tải xong nội dung thật (không phải "Đang đọc…", không phải khung lỗi của lần tải). */
function noiDung(m: string, kb: KichBan): string {
  const goc = !kb.chuaCoGoc, dangNhap = kb.vai !== null;
  return {
    quay: '#quay-noi-dung .so-o',
    'tang-o': '#tang-o-noi-dung table',
    'dong-bo': dangNhap ? '#ket-qua-xem #nut-gui' : '#dong-bo-can-kho',
    hang: '#bang-hang table',
    giam: '#giam-noi-dung table',
    'bao-cao': '#bao-cao-noi-dung .so-o',
    tem: '#tem-o .o-tem',
    can: goc ? '#can-thong-so .ts' : '#can-thong-so .bao.luu-y',
    phim: '#phim-noi-dung table',
    'nhat-ky': goc ? '#nk-noi-dung .so-o' : '#nk-noi-dung .bao.luu-y',
  }[m] ?? `#the-${m}`;
}

/** Trên trang: các mục (id the-…) đang hiện, trừ khung Đăng nhập và Bắt đầu. */
const mucDangHien = (trang: TrangPw) => trang.evaluate(() => [...document.querySelectorAll('main > section[id^="the-"], main > details[id^="the-"]')]
  .filter(x => x.checkVisibility()).map(x => x.id.slice(4)).filter(id => id !== 'dang-nhap' && id !== 'bat-dau'), null);
const theDangHien = (trang: TrangPw) => trang.evaluate(() => [...document.querySelectorAll('#thanh-tab button')]
  .filter(b => b.checkVisibility()).map(b => (b.textContent ?? '').trim()), null);
const dangMo = (trang: TrangPw, m: string) => trang.evaluate((id) => (document.getElementById('the-' + id) as HTMLDetailsElement | null)?.open === true, m);

export async function thuTrinhDuyet(ok: Ok): Promise<void> {
  console.log('6o · 2.11 — giao diện trong Chromium cho từng vai (năm thẻ, mục gập, không lỗi JavaScript)');
  const trinhDuyet = await moChromium();
  try {
    for (const kb of KICH_BAN) await thuMotVai(ok, trinhDuyet, kb);
    await thuMatMang(ok, trinhDuyet);
  } finally {
    await trinhDuyet.close();
  }
}

async function thuMotVai(ok: Ok, trinhDuyet: TrinhDuyetPw, kb: KichBan): Promise<void> {
  const g = await moGiaoDienGia({ vai: kb.vai, chuaCoGoc: kb.chuaCoGoc });
  const trang = await trinhDuyet.newPage({ viewport: { width: 1180, height: 860 } });
  const loi: string[] = [];
  trang.on('console', m => { if (m.type() === 'error') loi.push(m.text()); });
  trang.on('pageerror', e => loi.push('Lỗi JavaScript: ' + e.message));
  const hong: string[] = [];
  try {
    await trang.goto(g.url);
    await trang.waitForFunction(() => {
      const o = document.getElementById('o-kho');
      return !!o && o.textContent !== '…';
    }, null, { timeout: 15000 });
    const the = await theDangHien(trang);
    const mongThe = Object.keys(kb.the);
    const chon = await trang.evaluate(() => document.querySelector('#thanh-tab button.chon')?.textContent?.trim() ?? null, null);
    const mongChon = ['Quầy', 'Cân', 'Thiết lập cân'].find(t => mongThe.includes(t)) ?? null;
    ok(`${kb.ten}: thanh thẻ đúng [${mongThe.join(', ')}], mở sẵn thẻ ${mongChon}`,
      JSON.stringify(the) === JSON.stringify(mongThe) && chon === mongChon, JSON.stringify({ the, chon, loi }));

    for (const ten of mongThe) {
      await trang.click(`#thanh-tab button:text-is("${ten}")`, { timeout: 5000 });
      await trang.waitForTimeout(150);
      const hien = await mucDangHien(trang);
      const mong = kb.the[ten];
      if (JSON.stringify(hien) !== JSON.stringify(mong)) hong.push(`thẻ ${ten}: hiện [${hien.join(', ')}], mong [${mong.join(', ')}]`);
      for (const m of mong) {
        if (MUC_GAP.includes(m)) {
          // Mục gập đóng sẵn — trừ Tảng & ô khi có ô cân chưa đổi tên, và Tất cả hàng khi chưa đăng nhập (Gửi giá chỉ có khung đăng nhập).
          const tuMo = (m === 'tang-o' && !kb.chuaCoGoc) || (m === 'hang' && kb.vai === null);
          // Tảng & ô đọc ngay khi vào thẻ Quầy (dòng gập có tóm tắt) — chờ đọc xong rồi mới xem đã tự mở chưa.
          if (m === 'tang-o') {
            await trang.waitForFunction(() => {
              const t = document.getElementById('tang-o-tom-tat')?.textContent ?? '';
              return t !== '' && !/đang đọc/.test(t);
            }, null, { timeout: 15000 });
          }
          const mo = await dangMo(trang, m);
          if (mo !== tuMo) hong.push(`mục ${m}: ${mo ? 'đang mở' : 'đang gập'} lúc vào thẻ, mong ${tuMo ? 'mở' : 'gập'}`);
          if (!mo) await trang.click(`#the-${m} > summary`, { timeout: 5000 });
        }
        try {
          await trang.waitForSelector(noiDung(m, kb), { state: 'visible', timeout: 15000 });
        } catch {
          const chu = await trang.evaluate((id) => (document.getElementById('the-' + id)?.textContent ?? '').replace(/\s+/g, ' ').slice(0, 240), m);
          hong.push(`mục ${m} chưa tải xong (${noiDung(m, kb)}): ${chu}`);
        }
      }
    }
    ok(`${kb.ten}: bấm từng thẻ đúng các mục; mở từng mục gập — nội dung tải xong`, hong.length === 0, hong.join(' | '));

    if (kb.vai !== null && !kb.chuaCoGoc) await thuTangO(ok, trang, kb);
    if (kb.vai === 'quan_ly' && !kb.chuaCoGoc) await thuPhimTem(ok, trang);
    await trang.waitForTimeout(300);
    ok(`${kb.ten}: không lỗi JavaScript, không dòng lỗi nào ở console`, loi.length === 0, loi.slice(0, 5).join(' | '));
  } catch (e) {
    ok(`${kb.ten}: mở trang và bấm các thẻ không hỏng giữa chừng`, false, String(e) + (loi.length ? ' · console: ' + loi.slice(0, 3).join(' | ') : ''));
  } finally {
    if (hong.length || loi.length) {
      const anh = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'beeftown-can-anh-loi-')), `${kb.vai ?? 'chua-dang-nhap'}.png`);
      try { await trang.screenshot({ path: anh, fullPage: true }); console.log('      ảnh chụp: ' + anh); } catch { /* thôi */ }
    }
    await trang.close();
    await g.dong();
  }
}

/**
 * Mất mạng khi đọc Tảng & ô (kho_can_o_ma không trả lời): dòng gập nói chưa đọc được (không im, không nói "không có ô nào cần
 * xem"), mở mục thì đọc lại và hiện khung lỗi, thẻ Quầy vẫn hiện; kho trả lời lại thì Tải lại ra bảng. Không lỗi JavaScript.
 */
async function thuMatMang(ok: Ok, trinhDuyet: TrinhDuyetPw): Promise<void> {
  const khoHong = new Set(['kho_can_o_ma']);
  const g = await moGiaoDienGia({ vai: 'nhan_vien_quay', khoHong });
  const trang = await trinhDuyet.newPage({ viewport: { width: 1180, height: 860 } });
  const loi: string[] = [];
  trang.on('console', m => { if (m.type() === 'error') loi.push(m.text()); });
  trang.on('pageerror', e => loi.push('Lỗi JavaScript: ' + e.message));
  const tomTat = () => trang.evaluate(() => (document.getElementById('tang-o-tom-tat')?.textContent ?? '').trim(), null);
  try {
    await trang.goto(g.url);
    await trang.waitForSelector('#quay-noi-dung .so-o', { state: 'visible', timeout: 15000 });
    await trang.waitForFunction(() => /chưa đọc được/.test(document.getElementById('tang-o-tom-tat')?.textContent ?? ''), null, { timeout: 15000 });
    const tt1 = await tomTat(), gap = !(await dangMo(trang, 'tang-o'));
    await trang.click('#the-tang-o > summary', { timeout: 5000 });
    await trang.waitForSelector('#tang-o-noi-dung .bao.loi', { state: 'visible', timeout: 15000 });
    const khungLoi = await trang.evaluate(() => (document.getElementById('tang-o-noi-dung')?.textContent ?? '').replace(/\s+/g, ' ').trim(), null);
    khoHong.delete('kho_can_o_ma');
    await trang.click('#nut-tai-tang-o', { timeout: 5000 });
    await trang.waitForSelector('#tang-o-noi-dung table', { state: 'visible', timeout: 15000 });
    const tt2 = await tomTat();
    await trang.waitForTimeout(300);
    ok('Mất mạng khi đọc Tảng & ô: dòng gập nói "chưa đọc được", mở mục thì đọc lại và hiện khung lỗi, thẻ Quầy vẫn hiện; '
      + 'kho trả lời lại thì Tải lại ra bảng, dòng gập nêu ô cân chưa đổi tên; không lỗi JavaScript',
      gap && /chưa đọc được/.test(tt1) && !/không có ô nào cần xem/.test(tt1) && khungLoi.length > 0 && !/không có ô nào/.test(khungLoi)
        && /cân chưa đổi tên/.test(tt2) && loi.length === 0, JSON.stringify({ tt1, gap, khungLoi: khungLoi.slice(0, 160), tt2, loi }));
  } catch (e) {
    ok('Mất mạng khi đọc Tảng & ô: trang không hỏng giữa chừng', false, String(e) + (loi.length ? ' · console: ' + loi.slice(0, 3).join(' | ') : ''));
  } finally {
    await trang.close();
    await g.dong();
  }
}

/** Tảng & ô ở cuối thẻ Quầy: dòng gập nêu ô có vấn đề; tự mở; nút Tải lại trong thân mục chạy được. */
async function thuTangO(ok: Ok, trang: TrangPw, kb: KichBan): Promise<void> {
  await trang.click('#thanh-tab button:text-is("Quầy")');
  await trang.waitForSelector('#tang-o-noi-dung table', { state: 'visible', timeout: 15000 });
  const tomTat = await trang.evaluate(() => (document.getElementById('tang-o-tom-tat')?.textContent ?? '').replace(/\s+/g, ' ').trim(), null);
  ok(`${kb.ten}: Tảng & ô mã ở cuối thẻ Quầy — dòng gập nêu ô cân chưa đổi tên (Steak Ribeye Angus ô 1) và lệch ô; mục tự mở`,
    /1 ô cân chưa đổi tên/.test(tomTat) && /Steak Ribeye Angus ô 1/.test(tomTat) && /lệch ô/.test(tomTat) && await dangMo(trang, 'tang-o'), tomTat);
  await trang.click('#the-tang-o > summary');
  const tomTatGap = await trang.evaluate(() => (document.getElementById('tang-o-tom-tat')?.textContent ?? '').trim(), null);
  ok(`${kb.ten}: gập Tảng & ô lại thì dòng gập vẫn nêu ô cân chưa đổi tên`, !(await dangMo(trang, 'tang-o')) && /cân chưa đổi tên/.test(tomTatGap), tomTatGap);
  await trang.click('#the-tang-o > summary');
  await trang.click('#nut-tai-tang-o');
  await trang.waitForSelector('#tang-o-noi-dung table', { state: 'visible', timeout: 15000 });
  ok(`${kb.ten}: nút Tải lại của Tảng & ô (trong thân mục) đọc lại được`, await dangMo(trang, 'tang-o'));
}

/** Phím mũi tên dời ô tem: chỉ khi mục Mẫu tem đang mở (thẻ Thiết lập cân), không khi mục gập hay ở thẻ khác. */
async function thuPhimTem(ok: Ok, trang: TrangPw): Promise<void> {
  await trang.click('#thanh-tab button:text-is("Thiết lập cân")');
  if (!(await dangMo(trang, 'tem'))) await trang.click('#the-tem > summary');
  await trang.waitForSelector('#giay .el', { state: 'visible', timeout: 15000 });
  // Chọn một ô sửa được trên sơ đồ (ô đang in): bấm vào giữa ô.
  const chonDuoc = await trang.evaluate(() => {
    const el = [...document.querySelectorAll<HTMLElement>('#giay .el')].find(x => !x.classList.contains('khong-in') && x.offsetWidth > 20 && x.offsetHeight > 8);
    if (!el) return false;
    const r = el.getBoundingClientRect(), o = { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0, pointerId: 1 };
    el.dispatchEvent(new PointerEvent('pointerdown', o));
    document.getElementById('giay')!.dispatchEvent(new PointerEvent('pointerup', o));
    return true;
  }, null);
  const viTri = () => trang.evaluate(() => document.querySelector('#giay .el.chon')?.getAttribute('style') ?? null, null);
  const truoc = await viTri();
  await trang.keyboard.press('ArrowRight');
  const mo = await viTri();
  await trang.click('#the-tem > summary');   // gập Mẫu tem
  await trang.evaluate(() => (document.activeElement as HTMLElement | null)?.blur(), null);
  await trang.keyboard.press('ArrowRight');
  const gap = await viTri();
  await trang.click('#thanh-tab button:text-is("Quầy")');
  await trang.evaluate(() => (document.activeElement as HTMLElement | null)?.blur(), null);
  await trang.keyboard.press('ArrowRight');
  const theKhac = await viTri();
  ok('Quản lý: phím mũi tên dời ô tem khi mục Mẫu tem mở; mục gập hay đang ở thẻ Quầy thì không dời',
    chonDuoc && truoc !== null && mo !== truoc && gap === mo && theKhac === mo, JSON.stringify({ chonDuoc, truoc, mo, gap, theKhac }));
}

if (import.meta.main) {
  let dat = 0, hong = 0;
  const ok: Ok = (ten, dk, ct) => { if (dk) { dat++; console.log('  ✓ ' + ten); } else { hong++; console.log('  ✗ ' + ten + (ct ? '\n      ' + ct : '')); } };
  try { await thuTrinhDuyet(ok); } catch (e) { ok('Chạy được Chromium (playwright)', false, String(e)); }
  console.log(hong ? `${hong} KIỂM TRA HỎNG / ${dat + hong}` : `TẤT CẢ ${dat} KIỂM TRA ĐỀU ĐẠT`);
  process.exit(hong ? 1 : 0);
}
