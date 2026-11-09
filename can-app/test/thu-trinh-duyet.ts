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
 * #0142); phím mũi tên chỉ dời ô tem khi mục Mẫu tem đang mở. Lượt đọc lại mỗi phút (đồng hồ giả page.clock): gập Tảng & ô thì
 * không tự mở lại; đọc lại hỏng thì dòng gập nói "chưa đọc lại được" kèm giờ lần đọc cuối, không đứng im như đang đúng.
 * Đăng xuất / đăng nhập (trang-thai đổi người, page.route): thanh thẻ đổi theo, Tất cả hàng mở khi vừa đăng xuất, gập khi
 * vừa đăng nhập.
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
import { MAU_BEEFTOWN } from '../src/tem.ts';
import type { UngDung } from '../src/nghiep-vu.ts';

type Ok = (ten: string, dieuKien: boolean, chiTiet?: string) => void;

/** Phần của Playwright file này dùng (can-app không có kiểu của thư viện — thư viện nằm ở web/). */
interface TinConsole { type(): string; text(): string }
interface PhanHoiPw { json(): Promise<unknown> }
interface DuongPw { fetch(): Promise<PhanHoiPw>; fulfill(tuy: { response?: PhanHoiPw; json?: unknown }): Promise<void> }
interface TrangPw {
  goto(url: string): Promise<unknown>;
  reload(): Promise<unknown>;
  /** Đồng hồ giả của trang: install trước goto; runFor chạy nhanh các hẹn giờ (setInterval mỗi phút) trong ms đó. */
  clock: { install(): Promise<void>; runFor(ms: number): Promise<void> };
  route(khop: (url: URL) => boolean, xuLy: (d: DuongPw) => Promise<void>): Promise<void>;
  fill(chon: string, giaTri: string): Promise<void>;
  setInputFiles(chon: string, tep: { name: string; mimeType: string; buffer: Buffer }): Promise<void>;
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
    try {
      const trinhDuyet = await pw.chromium.launch();
      // In ra bản đã dùng: máy làm việc có thể rơi về bản cài chung (web/ chưa tải Chromium) — báo cáo phải nói đúng bản nào.
      const banPw = (createRequire(f)('playwright/package.json') as { version: string }).version;
      console.log(`      Chromium qua playwright ${banPw} (${f === noi[0] ? 'của web/' : 'cài chung của máy — web/ chưa có Chromium cho bản của nó'})`);
      return trinhDuyet;
    } catch (e) { loi.push(`${f}: ${String(e).split('\n')[0]}`); }
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
    await thuDocLaiMoiPhut(ok, trinhDuyet);
    await thuDangXuatDangNhap(ok, trinhDuyet);
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
    if (kb.vai === 'quan_ly' && !kb.chuaCoGoc) { await thuPhimTem(ok, trang); await thuMauTem(ok, trang, g.ud); }
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

/** Theo dõi lỗi JavaScript và dòng lỗi ở console của một trang. */
function ghiLoi(trang: TrangPw): string[] {
  const loi: string[] = [];
  trang.on('console', m => { if (m.type() === 'error') loi.push(m.text()); });
  trang.on('pageerror', e => loi.push('Lỗi JavaScript: ' + e.message));
  return loi;
}
const chuTomTat = (trang: TrangPw) => trang.evaluate(() => (document.getElementById('tang-o-tom-tat')?.textContent ?? '').replace(/\s+/g, ' ').trim(), null);
/**
 * Đánh dấu bảng Tảng & ô đang hiện, chạy đồng hồ giả qua một lượt mỗi phút, chờ bảng được vẽ lại (veTangO thay cả bảng — bảng
 * mới không còn dấu). Trả false nếu không vẽ lại trong thời hạn.
 */
async function quaMotPhut(trang: TrangPw, choVeLai: boolean): Promise<boolean> {
  await trang.evaluate(() => { const b = document.querySelector<HTMLElement>('#tang-o-noi-dung table'); if (b) b.dataset.cu = '1'; }, null);
  await trang.clock.runFor(61000);
  if (!choVeLai) return true;
  try {
    await trang.waitForFunction(() => !!document.querySelector('#tang-o-noi-dung table') && !document.querySelector('#tang-o-noi-dung table[data-cu]'),
      null, { timeout: 10000 });
    return true;
  } catch { return false; }
}

/**
 * Lượt đọc lại Tảng & ô mỗi phút (cùng thẻ Quầy), đồng hồ giả:
 *  · tự mở MỘT lần: NV gập mục lại, lượt đọc sau (còn ô cân chưa đổi tên) không bung mục ra;
 *  · đọc lại hỏng (kho_can_o_ma không trả lời): giữ bảng, nhưng dòng gập nói "chưa đọc lại được" kèm giờ lần đọc cuối — không
 *    đứng im như số đang đúng (mat-mang); kho trả lời lại thì lượt sau xoá câu đó.
 */
async function thuDocLaiMoiPhut(ok: Ok, trinhDuyet: TrinhDuyetPw): Promise<void> {
  const khoHong = new Set<string>();
  const g = await moGiaoDienGia({ vai: 'nhan_vien_quay', khoHong });
  const trang = await trinhDuyet.newPage({ viewport: { width: 1180, height: 860 } });
  const loi = ghiLoi(trang);
  try {
    await trang.clock.install();
    await trang.goto(g.url);
    await trang.waitForSelector('#tang-o-noi-dung table', { state: 'visible', timeout: 15000 });
    const tuMo = await dangMo(trang, 'tang-o');
    await trang.click('#the-tang-o > summary', { timeout: 5000 });   // NV gập lại
    const veLai = await quaMotPhut(trang, true);
    const vanGap = !(await dangMo(trang, 'tang-o'));
    const tt0 = await chuTomTat(trang);
    ok('Tảng & ô tự mở MỘT lần: NV gập lại, lượt đọc lại mỗi phút (vẫn còn ô cân chưa đổi tên) không mở lại',
      tuMo && veLai && vanGap && /cân chưa đổi tên/.test(tt0), JSON.stringify({ tuMo, veLai, vanGap, tt0 }));

    khoHong.add('kho_can_o_ma');
    await quaMotPhut(trang, false);
    let baoCu = true;
    try {
      await trang.waitForFunction(() => /chưa đọc lại được/.test(document.getElementById('tang-o-tom-tat')?.textContent ?? ''), null, { timeout: 10000 });
    } catch { baoCu = false; }
    const tt1 = await chuTomTat(trang);
    const conBang = await trang.evaluate(() => !!document.querySelector('#tang-o-noi-dung table'), null);
    ok('HỒI QUY rà soát 2.11: lượt đọc lại mỗi phút của Tảng & ô hỏng → dòng gập nói "chưa đọc lại được" kèm giờ lần đọc cuối '
      + '(không đứng im như số đang đúng); vẫn giữ bảng và tóm tắt cũ',
      baoCu && /chưa đọc lại được/.test(tt1) && /lúc \d{2}:\d{2}/.test(tt1) && /cân chưa đổi tên/.test(tt1) && conBang && !(await dangMo(trang, 'tang-o')),
      JSON.stringify({ tt0, tt1, conBang }));

    khoHong.delete('kho_can_o_ma');
    const veLai2 = await quaMotPhut(trang, true);
    const tt2 = await chuTomTat(trang);
    await trang.waitForTimeout(300);
    ok('Kho trả lời lại: lượt đọc sau xoá câu "chưa đọc lại được", dòng gập lại nêu ô cân chưa đổi tên; không lỗi JavaScript',
      veLai2 && !/chưa đọc lại được/.test(tt2) && /cân chưa đổi tên/.test(tt2) && loi.length === 0, JSON.stringify({ tt2, loi }));
  } catch (e) {
    ok('Đọc lại Tảng & ô mỗi phút: trang không hỏng giữa chừng', false, String(e) + (loi.length ? ' · console: ' + loi.slice(0, 3).join(' | ') : ''));
  } finally {
    await trang.close();
    await g.dong();
  }
}

/**
 * Đăng xuất rồi đăng nhập lại trên cùng trang (quản lý). Kho giả luôn coi là đã đăng nhập, nên trang-thai được sửa trên đường
 * (page.route): sau khi bấm Đăng xuất kho thì người = null; /api/dang-nhap trả ok mà không gọi kho. Kiểm:
 *  · vừa đăng xuất: thanh thẻ thành [Cân, Thiết lập cân], chọn thẻ Cân, Tất cả hàng mở sẵn và ra bảng;
 *  · vừa đăng nhập: đủ năm thẻ, vẫn ở thẻ Cân, Tất cả hàng gập lại (không đọc /api/hang khi chưa mở), Gửi giá ra bảng xem trước.
 */
async function thuDangXuatDangNhap(ok: Ok, trinhDuyet: TrinhDuyetPw): Promise<void> {
  const g = await moGiaoDienGia({ vai: 'quan_ly' });
  const trang = await trinhDuyet.newPage({ viewport: { width: 1180, height: 860 } });
  const loi = ghiLoi(trang);
  const gia = { dangXuat: false };
  let docHang = 0;
  try {
    await trang.route(u => u.pathname === '/api/trang-thai', async d => {
      const ph = await d.fetch();
      const j = await ph.json() as { nguoi: unknown };
      if (gia.dangXuat) j.nguoi = null;
      await d.fulfill({ response: ph, json: j });
    });
    await trang.route(u => u.pathname === '/api/dang-nhap', d => d.fulfill({ json: { ok: true } }));
    await trang.route(u => u.pathname === '/api/hang', async d => { docHang++; const ph = await d.fetch(); await d.fulfill({ response: ph }); });
    const daTai = (chuKho: string) => trang.waitForFunction((c) => {
      const o = document.getElementById('o-kho')?.textContent ?? '';
      return c === 'chua' ? o === 'Chưa đăng nhập' : o !== '…' && o !== 'Chưa đăng nhập';
    }, chuKho, { timeout: 15000 });
    await trang.goto(g.url);
    await daTai('co');
    const the0 = await theDangHien(trang), hang0 = await dangMo(trang, 'hang');

    gia.dangXuat = true;
    await trang.click('details:has(#nut-dang-xuat) > summary', { timeout: 5000 });   // nút nằm trong "Cài đặt và việc khác"
    await trang.click('#nut-dang-xuat', { timeout: 5000 });
    await daTai('chua');
    let bangHang = true;
    try { await trang.waitForSelector('#bang-hang table', { state: 'visible', timeout: 15000 }); } catch { bangHang = false; }
    const the1 = await theDangHien(trang), hang1 = await dangMo(trang, 'hang');
    const chon1 = await trang.evaluate(() => document.querySelector('#thanh-tab button.chon')?.textContent?.trim() ?? null, null);
    ok('Quản lý bấm Đăng xuất kho: thanh thẻ thành [Cân, Thiết lập cân], chọn thẻ Cân, Tất cả hàng mở sẵn và ra bảng',
      JSON.stringify(the0) === JSON.stringify(NAM_THE) && hang0 === false && JSON.stringify(the1) === JSON.stringify(['Cân', 'Thiết lập cân'])
        && chon1 === 'Cân' && hang1 && bangHang, JSON.stringify({ the0, hang0, the1, chon1, hang1, bangHang }));

    gia.dangXuat = false;
    await trang.fill('#form-dang-nhap input[name="email"]', 'quan_ly@beeftown.vn');
    await trang.fill('#form-dang-nhap input[name="matKhau"]', 'mat-khau-gia');
    const docHangTruoc = docHang;
    await trang.click('#form-dang-nhap button[type="submit"]', { timeout: 5000 });
    await daTai('co');
    await trang.waitForSelector('#ket-qua-xem #nut-gui', { state: 'visible', timeout: 15000 });
    await trang.waitForTimeout(300);
    const the2 = await theDangHien(trang), hang2 = await dangMo(trang, 'hang');
    const chon2 = await trang.evaluate(() => document.querySelector('#thanh-tab button.chon')?.textContent?.trim() ?? null, null);
    ok('Đăng nhập lại: đủ năm thẻ, vẫn ở thẻ Cân, Tất cả hàng gập lại và không đọc /api/hang, Gửi giá ra bảng xem trước; không lỗi JavaScript',
      JSON.stringify(the2) === JSON.stringify(NAM_THE) && chon2 === 'Cân' && hang2 === false && docHang === docHangTruoc && loi.length === 0,
      JSON.stringify({ the2, chon2, hang2, docHang: docHang - docHangTruoc, loi }));
  } catch (e) {
    ok('Đăng xuất / đăng nhập: trang không hỏng giữa chừng', false, String(e) + (loi.length ? ' · console: ' + loi.slice(0, 3).join(' | ') : ''));
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

/**
 * 2.12 — Mẫu tem Beeftown: bấm "Xếp tem theo mẫu Beeftown" → sơ đồ đổi theo mẫu, chưa gửi (thay cả ô vừa dời bằng phím mũi tên);
 * Gửi tem xuống cân → cân giả hai chiều nhận và đọc lại khớp; thẻ đọc lại tem: đã đúng mẫu, không còn nút.
 * 2.16: cân giả in đơn vị sau số (185–187 = 1, như trình cài đặt của hãng cho Việt Nam) → gửi tem theo mẫu xong thì tự tắt; tem đã
 * đúng mẫu mà cân còn in đơn vị (bật lại bằng đường thông số) → khung nói không cần gửi lại tem, nút "Tắt đơn vị in sau số".
 */
async function thuMauTem(ok: Ok, trang: TrangPw, ud: UngDung): Promise<void> {
  await trang.click('#thanh-tab button:text-is("Thiết lập cân")');
  if (!(await dangMo(trang, 'tem'))) await trang.click('#the-tem > summary');
  await trang.waitForSelector('#nut-mau-beeftown', { state: 'visible', timeout: 15000 });
  // 2.14: nạp file mẫu (mẫu Beeftown viết thành file) → sơ đồ đổi, câu "Đã nạp mẫu … chưa gửi"; Bỏ thay đổi → về như cũ.
  await trang.setInputFiles('#tep-mau-tem', { name: 'mau-tem-beeftown.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(MAU_BEEFTOWN)) });
  let napDuoc = true;
  try { await trang.waitForFunction(() => /Đã nạp mẫu/.test(document.getElementById('tem-file-bao')?.textContent ?? ''), null, { timeout: 10000 }); }
  catch { napDuoc = false; }
  const sauNap = await trang.evaluate(() => ({ bao: document.getElementById('tem-file-bao')?.textContent ?? '', dem: document.getElementById('tem-dem')?.textContent ?? '',
    logo: !!document.querySelector('#giay .el img.logo-tem') }), null);
  await trang.click('#nut-bo-tem');
  const sauBo = await trang.evaluate(() => ({ bao: document.getElementById('tem-file-bao')?.textContent ?? '', dem: document.getElementById('tem-dem')?.textContent ?? '',
    logo: !!document.querySelector('#giay .el img.logo-tem') }), null);
  ok('Quản lý: nạp mẫu tem từ file → sơ đồ có logo, câu "Đã nạp mẫu … chưa gửi", có thay đổi chưa gửi; Bỏ thay đổi → về như cũ, hết câu',
    napDuoc && /Mẫu tem Beeftown/.test(sauNap.bao) && /chưa gửi/.test(sauNap.bao) && sauNap.logo && /thay đổi chưa gửi/.test(sauNap.dem)
    && sauBo.bao === '' && !sauBo.logo && /Chưa có thay đổi/.test(sauBo.dem), JSON.stringify({ sauNap, sauBo }));
  await trang.click('#nut-mau-beeftown');
  const sauBam = await trang.evaluate(() => ({
    dem: document.getElementById('tem-dem')?.textContent ?? '',
    chu: [...document.querySelectorAll('#giay .el')].map(x => (x.textContent ?? '').trim()).filter(Boolean),
    guiDuoc: !(document.getElementById('nut-gui-tem') as HTMLButtonElement).disabled,
    baoDaXep: /đã xếp theo mẫu/.test(document.getElementById('tem-mau')?.textContent ?? ''),
    baoTuTat: /Gửi tem xuống cân xong, chương trình tự tắt "kg", "VND\/kg", "VND"/.test(document.getElementById('tem-mau')?.textContent ?? ''),
  }), null);
  const canCo = ['Ngày đóng gói', 'Hạn sử dụng', 'Thành tiền (đ)', 'Khối lượng (kg)', 'Đơn giá (đ/kg)', 'CÔNG TY TNHH SLK GROUP'];
  // 2.13: logo vẽ trên sơ đồ (ảnh 184 × 26 có chấm đen), không còn chữ BEEFTOWN hay dòng địa chỉ.
  const logo = await trang.evaluate(() => {
    const a = document.querySelector<HTMLImageElement>('#giay .el img.logo-tem');
    if (!a || !a.complete || !a.naturalWidth) return null;
    const c = document.createElement('canvas'); c.width = a.naturalWidth; c.height = a.naturalHeight;
    const g = c.getContext('2d')!; g.drawImage(a, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let den = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) den++;
    return { w: c.width, h: c.height, den };
  }, null);
  ok('Quản lý: bấm "Xếp tem theo mẫu Beeftown" — sơ đồ có logo (ảnh 184 × 26, có chấm đen), nhãn tiếng Việt, tên công ty; không còn chữ '
    + 'BEEFTOWN, dòng địa chỉ; chưa gửi, nút Gửi bật',
    canCo.every(c => sauBam.chu.includes(c)) && !sauBam.chu.includes('BEEFTOWN') && !sauBam.chu.some(c => /Hồ Tùng Mậu/.test(c))
    && logo !== null && logo.w === 184 && logo.h === 26 && logo.den > 1000
    && /thay đổi chưa gửi/.test(sauBam.dem) && sauBam.guiDuoc && sauBam.baoDaXep, JSON.stringify({ sauBam, logo }));
  ok('2.16 Quản lý: cân in đơn vị sau số — khung mẫu Beeftown nói gửi tem xong chương trình tự tắt "kg", "VND/kg", "VND"', sauBam.baoTuTat,
    JSON.stringify(sauBam));
  await trang.click('#nut-gui-tem');
  let nhan = true;
  try {
    await trang.waitForFunction(() => /Cân đã nhận mẫu tem/.test(document.getElementById('bao-chung')?.textContent ?? '')
      && /Cân đã thôi in/.test(document.getElementById('bao-chung')?.textContent ?? ''), null, { timeout: 20000 });
    await trang.waitForFunction(() => /đúng mẫu tem Beeftown/.test(document.getElementById('tem-mau')?.textContent ?? ''), null, { timeout: 15000 });
  } catch { nhan = false; }
  const sauGui = await trang.evaluate(() => ({ bao: (document.getElementById('bao-chung')?.textContent ?? '').slice(0, 600),
    loaiBao: document.querySelector('#bao-chung .bao')?.className ?? '',
    mau: document.getElementById('tem-mau')?.textContent ?? '', nut: !!document.getElementById('nut-mau-beeftown'),
    nutTat: !!document.getElementById('nut-tat-don-vi') }), null);
  ok('Quản lý: gửi tem theo mẫu — cân giả nhận, đọc lại thấy đúng; câu báo nói logo không kiểm được (in thử); mở lại thẻ: tem đã đúng mẫu, '
    + 'không còn nút', nhan && !sauGui.nut && /không kiểm được logo/.test(sauGui.bao), JSON.stringify(sauGui));
  ok('2.16 Quản lý: gửi tem theo mẫu xong thì tự tắt đơn vị — câu "Cân đã thôi in "kg", "VND/kg", "VND" sau số (thông số 185, 186, 187, '
    + 'đọc lại thấy đúng)" trong khung xanh; cân giả hết in đơn vị; mở lại mục: không còn nút tắt',
    nhan && /Cân đã thôi in "kg", "VND\/kg", "VND" sau số \(thông số 185, 186, 187, đọc lại thấy đúng\)/.test(sauGui.bao)
    && /\bxong\b/.test(sauGui.loaiBao) && !sauGui.nutTat && /Tem đang dùng đúng mẫu tem Beeftown\./.test(sauGui.mau)
    && JSON.stringify(ud.tem().donViSauSo) === '[]', JSON.stringify({ sauGui, donVi: ud.tem().donViSauSo }));

  // 2.16: tem đã đúng mẫu mà cân còn in đơn vị (ví dụ nạp file mẫu bằng bản 2.14, hay ai đó bật lại ở Cân & thông số).
  await ud.suaThongSo({ thay: { 185: 1, 186: 1, 187: 1 } });
  await trang.reload();
  await trang.waitForFunction(() => { const o = document.getElementById('o-kho'); return !!o && o.textContent !== '…'; }, null, { timeout: 15000 });
  await trang.click('#thanh-tab button:text-is("Thiết lập cân")');
  if (!(await dangMo(trang, 'tem'))) await trang.click('#the-tem > summary');
  let coNut = true;
  try { await trang.waitForSelector('#nut-tat-don-vi', { state: 'visible', timeout: 15000 }); } catch { coNut = false; }
  const truocTat = await trang.evaluate(() => ({ mau: document.getElementById('tem-mau')?.textContent ?? '',
    guiTem: !(document.getElementById('nut-gui-tem') as HTMLButtonElement).disabled, nutMau: !!document.getElementById('nut-mau-beeftown') }), null);
  ok('2.16 Quản lý: tem đã đúng mẫu, cân còn in đơn vị — khung nói không cần gửi lại tem (Gửi tem xuống cân tắt vì không có thay đổi), '
    + 'nêu "kg", "VND/kg", "VND", có nút "Tắt đơn vị in sau số"',
    coNut && /không cần gửi lại tem/.test(truocTat.mau) && /"kg", "VND\/kg", "VND"/.test(truocTat.mau) && !truocTat.guiTem && !truocTat.nutMau,
    JSON.stringify(truocTat));
  // Rà soát 2.16: đơn vị vừa tắt ở chỗ khác (mục Cân & thông số) trong lúc trang còn số cũ → đọc lại trước khi gửi, không báo lỗi giả.
  await ud.suaThongSo({ thay: { 185: 0, 186: 0, 187: 0 } });
  let khongGui = true;
  try {
    await trang.click('#nut-tat-don-vi');
    await trang.waitForFunction(() => /Cân đã không in đơn vị sau số/.test(document.getElementById('bao-chung')?.textContent ?? '')
      && !document.getElementById('nut-tat-don-vi'), null, { timeout: 20000 });
  } catch { khongGui = false; }
  const sauCu = await trang.evaluate(() => ({ bao: (document.getElementById('bao-chung')?.textContent ?? '').slice(0, 300),
    loaiBao: document.querySelector('#bao-chung .bao')?.className ?? '' }), null);
  ok('2.16 HỒI QUY rà soát: đơn vị đã tắt ở mục khác trong lúc trang còn số cũ — bấm "Tắt đơn vị in sau số" đọc lại, báo "Cân đã không in '
    + 'đơn vị sau số" (xanh, không gửi), không báo lỗi', khongGui && /\bxong\b/.test(sauCu.loaiBao) && !/Chưa tắt|chưa có gì thay đổi/.test(sauCu.bao),
    JSON.stringify(sauCu));
  await ud.suaThongSo({ thay: { 185: 1, 186: 1, 187: 1 } });
  await trang.reload();
  await trang.waitForFunction(() => { const o = document.getElementById('o-kho'); return !!o && o.textContent !== '…'; }, null, { timeout: 15000 });
  await trang.click('#thanh-tab button:text-is("Thiết lập cân")');
  if (!(await dangMo(trang, 'tem'))) await trang.click('#the-tem > summary');
  await trang.waitForSelector('#nut-tat-don-vi', { state: 'visible', timeout: 15000 });
  let tatDuoc = true;
  try {
    await trang.click('#nut-tat-don-vi');
    await trang.waitForFunction(() => /Cân đã nhận lệnh thôi in "kg", "VND\/kg", "VND" sau số/.test(document.getElementById('bao-chung')?.textContent ?? ''),
      null, { timeout: 20000 });
    await trang.waitForFunction(() => !document.getElementById('nut-tat-don-vi')
      && /Tem đang dùng đúng mẫu tem Beeftown\./.test(document.getElementById('tem-mau')?.textContent ?? ''), null, { timeout: 15000 });
  } catch { tatDuoc = false; }
  const sauTat = await trang.evaluate(() => ({ bao: (document.getElementById('bao-chung')?.textContent ?? '').slice(0, 400),
    mau: document.getElementById('tem-mau')?.textContent ?? '' }), null);
  ok('2.16 Quản lý: bấm "Tắt đơn vị in sau số" — cân giả nhận, đọc lại thấy đúng ("Cân đã nhận lệnh thôi in …"); mục đọc lại: hết nút',
    tatDuoc && JSON.stringify(ud.tem().donViSauSo) === '[]', JSON.stringify({ sauTat, donVi: ud.tem().donViSauSo }));

  // 2.16 mất mạng: tem gửi được, lệnh tắt đơn vị hỏng (máy chủ nhỏ không trả lời) → khung đỏ nói đúng phần nào chưa xong, không báo
  // "đã thôi in"; mục đọc lại còn nút tắt riêng.
  await ud.suaThongSo({ thay: { 185: 1, 186: 1, 187: 1 } });
  const t0 = ud.tem();
  const oLogo = t0.tem!.o.find(o => o.bat && o.loai === '6')!;
  await ud.guiTem({ tat: [oLogo.khoa], dau: t0.dau });   // tem lệch mẫu: nút Xếp tem theo mẫu hiện lại
  let hongTs = true;
  await trang.route(u => u.pathname === '/api/thong-so/gui', async d => {
    if (hongTs) { hongTs = false; await d.fulfill({ json: { ok: false, loi: 'Không nối được máy chủ nhỏ (giả lập mất mạng).' } }); return; }
    await d.fulfill({ response: await d.fetch() });
  });
  await trang.reload();
  await trang.waitForFunction(() => { const o = document.getElementById('o-kho'); return !!o && o.textContent !== '…'; }, null, { timeout: 15000 });
  await trang.click('#thanh-tab button:text-is("Thiết lập cân")');
  if (!(await dangMo(trang, 'tem'))) await trang.click('#the-tem > summary');
  await trang.waitForSelector('#nut-mau-beeftown', { state: 'visible', timeout: 15000 });
  await trang.click('#nut-mau-beeftown');
  await trang.click('#nut-gui-tem');
  let baoHong = true;
  try {
    await trang.waitForFunction(() => /Chưa tắt được/.test(document.getElementById('bao-chung')?.textContent ?? ''), null, { timeout: 20000 });
    await trang.waitForSelector('#nut-tat-don-vi', { state: 'visible', timeout: 15000 });
  } catch { baoHong = false; }
  const sauHong = await trang.evaluate(() => ({ bao: (document.getElementById('bao-chung')?.textContent ?? '').slice(0, 600),
    loaiBao: document.querySelector('#bao-chung .bao')?.className ?? '' }), null);
  ok('2.16 Quản lý: gửi tem theo mẫu được nhưng lệnh tắt đơn vị hỏng (mất mạng) — khung đỏ: tem đã nhận, "Chưa tắt được "kg", "VND/kg", "VND" '
    + 'in sau số" kèm lỗi; không câu "đã thôi in"; cân giả vẫn in đơn vị; mục đọc lại có nút tắt riêng',
    baoHong && /\bloi\b/.test(sauHong.loaiBao) && /Cân đã nhận mẫu tem/.test(sauHong.bao)
    && /Chưa tắt được "kg", "VND\/kg", "VND" in sau số: Không nối được máy chủ nhỏ/.test(sauHong.bao) && !/đã thôi in/.test(sauHong.bao)
    && JSON.stringify(ud.tem().donViSauSo) === '[185,186,187]', JSON.stringify({ sauHong, donVi: ud.tem().donViSauSo }));
}

if (import.meta.main) {
  let dat = 0, hong = 0;
  const ok: Ok = (ten, dk, ct) => { if (dk) { dat++; console.log('  ✓ ' + ten); } else { hong++; console.log('  ✗ ' + ten + (ct ? '\n      ' + ct : '')); } };
  try { await thuTrinhDuyet(ok); } catch (e) { ok('Chạy được Chromium (playwright)', false, String(e)); }
  console.log(hong ? `${hong} KIỂM TRA HỎNG / ${dat + hong}` : `TẤT CẢ ${dat} KIỂM TRA ĐỀU ĐẠT`);
  process.exit(hong ? 1 : 0);
}
