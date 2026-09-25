/**
 * BEEFTOWN KHO — Kiểm thử khung giao diện (menu, link, cài như app, JavaScript)
 * ==========================================================================
 *
 *     node test/test-kho-giao-dien.mjs
 *
 * Không cần database. Kiểm những thứ dễ vỡ âm thầm khi sửa giao diện:
 *   - mọi link trong menu, thanh đáy, thao tác nhanh, quy trình, thông báo đều
 *     trỏ tới một trang có thật (không ai bấm vào trang 404);
 *   - thanh đáy tối đa 5 nút, nhân viên quầy không thấy ô nào cần xem tiền;
 *   - khóa số đỏ trong menu và quy trình là khóa kho_dem_viec có thật, khóa sự
 *     kiện của database (0030) đều có câu chữ ở lib/kho/viec.ts;
 *   - mục "?" của từng trang trỏ tới một mục có thật trong trang Hướng dẫn;
 *   - cài như app: manifest hợp lệ, ảnh biểu tượng đúng kích thước;
 *   - JavaScript chỉ ở những chỗ đã cho phép (trang tắt JS vẫn chạy đủ).
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import {
  MUC_KHO, THANH_DAY, THAO_TAC_NHANH, MUC_CRM, mucCuaVai, thanhDayCuaVai, thaoTacCuaVai, soDo, dangO,
} from '../../web/src/lib/kho/dieu-huong.ts';
import { cauSuKien, KHOA_SU_KIEN } from '../../web/src/lib/kho/viec.ts';
import { QUY_TRINH } from '../../web/src/lib/kho/quy-trinh.ts';
import { BIEU_TUONG } from '../../web/src/lib/kho/bieu-tuong.ts';
import { duoc, QUYEN_KHO } from '../../web/src/lib/kho/chung.ts';
import {
  CO_TRANG, docTimDs, lamSachTim, locTimNhieuCot, khoangTrang, catTrang, linkDs, dangTim, apDungTim,
} from '../../web/src/lib/kho/tim-ds.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ KHUNG GIAO DIỆN');

const GOC = fileURLToPath(new URL('../../', import.meta.url));
const WEB = join(GOC, 'web');
const TRANG = join(WEB, 'src', 'pages');
const doc = p => readFileSync(p, 'utf8');

/** Mọi file trong một thư mục, đệ quy. */
function moiFile(thuMuc) {
  const ra = [];
  for (const ten of readdirSync(thuMuc)) {
    const p = join(thuMuc, ten);
    if (statSync(p).isDirectory()) ra.push(...moiFile(p));
    else ra.push(p);
  }
  return ra;
}

// ---------------------------------------------------------------------------
// Bảng đường dẫn: dựng từ thư mục pages giống cách Astro định tuyến.
// [id] khớp một đoạn bất kỳ; index.astro là chính thư mục đó.
// ---------------------------------------------------------------------------
const TUYEN = moiFile(TRANG)
  .filter(p => /\.(astro|ts)$/.test(p))
  .map(p => {
    let d = '/' + relative(TRANG, p).split(sep).join('/');
    d = d.replace(/\.(astro|ts)$/, '').replace(/\/index$/, '') || '/';
    const mau = d.replace(/[.]/g, '\\.').replace(/\[[^\]/]+\]/g, '[^/]+');
    return { file: relative(GOC, p), duong: d, re: new RegExp(`^${mau}$`) };
  });

/** Trang nào nhận link này (bỏ ?… và #…). null = 404. */
function trangCua(link) {
  const duong = link.split('#')[0].split('?')[0].replace(/\/$/, '') || '/';
  // Trang tĩnh thắng trang [id] — giống Astro.
  return TUYEN.find(t => t.duong === duong) ?? TUYEN.find(t => t.re.test(duong)) ?? null;
}

const VAI = ['chu_so_huu', 'quan_ly', 'thu_kho', 'nhan_vien_quay', 'ke_toan'];

// Khóa kho_dem_viec có thật: đọc từ thân hàm trong 0030.
const SQL_0030 = doc(join(GOC, 'crm/supabase/migrations/0030_kho_viec_thong_bao.sql'));
const thanDemViec = SQL_0030.slice(
  SQL_0030.indexOf('create or replace function kho_dem_viec('),
  SQL_0030.indexOf('comment on function kho_dem_viec'),
);
const KHOA_DEM = new Set(
  [...thanDemViec.matchAll(/(?:jsonb_build_object\(|,)\s*'([a-z_]+)'\s*,/g)].map(m => m[1]),
);
// Khóa sự kiện có thật: "select '<khóa>', '<nhóm>'" và nhánh case của hạn dùng.
const thanSuKien = SQL_0030.slice(
  SQL_0030.indexOf('create or replace function kho_su_kien('),
  SQL_0030.indexOf('create or replace function kho_dem_viec('),
);
const KHOA_SK_SQL = new Set([
  ...[...thanSuKien.matchAll(/select '([a-z_]+)', '(?:van_hanh|nhac_nho|he_thong)'/g)].map(m => m[1]),
  ...[...thanSuKien.matchAll(/then '([a-z_]+)' else '([a-z_]+)' end/g)].flatMap(m => [m[1], m[2]]),
]);

// ===========================================================================
await nhom('1 · MỌI LINK TRỎ TỚI TRANG CÓ THẬT', async () => {
  ok('Đọc được bảng đường dẫn (có trang kho)', TUYEN.some(t => t.duong === '/noi-bo/kho'),
    TUYEN.map(t => t.duong).join(', '));
  const hong = [];
  const kiem = (noi, link) => { if (!trangCua(link)) hong.push(`${noi}: ${link}`); };
  for (const m of MUC_KHO) kiem(`menu ${m.ma}`, m.link);
  for (const [vai, ds] of Object.entries(THANH_DAY)) for (const m of ds) kiem(`thanh đáy ${vai}`, m.link);
  for (const [vai, ds] of Object.entries(THAO_TAC_NHANH)) for (const t of ds) kiem(`thao tác ${vai}`, t.link);
  for (const m of MUC_CRM) kiem('menu CRM', m.link);
  for (const q of QUY_TRINH) for (const b of q.buoc) kiem(`quy trình ${q.ma}`, b.link);
  for (const q of QUY_TRINH) kiem(`quy trình ${q.ma}`, `/noi-bo/kho/quy-trinh?qt=${q.ma}`);
  const mau = { nhom: 'van_hanh', ref_id: '00000000-0000-0000-0000-000000000001',
    ref2: '00000000-0000-0000-0000-000000000002', ma: 'X-1', ten: 'Thăn', phu: 'kho', so: 3, luc: '2026-09-25T00:00:00Z' };
  for (const khoa of KHOA_SU_KIEN) {
    for (const phu of ['kho', 'quay']) kiem(`sự kiện ${khoa}`, cauSuKien({ ...mau, khoa, phu }).link);
  }
  ok('Không có link nào dẫn tới trang không tồn tại', hong.length === 0, hong.join(' | '));
});

// ===========================================================================
await nhom('2 · MENU THEO VAI', async () => {
  for (const vai of VAI) {
    const day = thanhDayCuaVai(vai);
    ok(`${vai}: thanh đáy 3–5 nút (có ${day.length})`, day.length >= 3 && day.length <= 5);
    ok(`${vai}: không nút nào của thanh đáy bị ẩn vì thiếu quyền`, day.length === (THANH_DAY[vai] ?? []).length,
      (THANH_DAY[vai] ?? []).filter(m => !day.includes(m)).map(m => m.ma).join(', '));
    ok(`${vai}: nút cuối thanh đáy là "Khác"`, day.at(-1)?.link === '/noi-bo/kho/khac');
    ok(`${vai}: nút đầu thanh đáy là trang chủ kho`, day[0]?.link === '/noi-bo/kho');
    const tenNgan = day.map(m => m.ngan ?? m.ten).filter(t => t.length > 9);
    ok(`${vai}: chữ trên thanh đáy ≤ 9 ký tự`, tenNgan.length === 0, tenNgan.join(', '));
    const khongQuyen = thaoTacCuaVai(vai).length !== (THAO_TAC_NHANH[vai] ?? []).length;
    ok(`${vai}: mọi thao tác nhanh đều làm được`, !khongQuyen);
  }

  const nv = mucCuaVai('nhan_vien_quay');
  const canTien = nv.filter(m => m.quyen.every(q => q === 'xem_gia' || q === 'ke_toan'));
  ok('NV quầy: không có ô nào cần xem tiền', canTien.length === 0, canTien.map(m => m.ma).join(', '));
  for (const ma of ['nhap', 'pha_loc', 'bao_cao', 'cong_no', 'cai_dat', 'duyet']) {
    ok(`NV quầy: không thấy ô "${ma}"`, !nv.some(m => m.ma === ma));
  }
  ok('Thủ kho: không thấy Công nợ, Duyệt', !mucCuaVai('thu_kho').some(m => m.ma === 'cong_no' || m.ma === 'duyet'));
  ok('Kế toán: thấy Công nợ, không thấy Duyệt',
    mucCuaVai('ke_toan').some(m => m.ma === 'cong_no') && !mucCuaVai('ke_toan').some(m => m.ma === 'duyet'));
  ok('Chủ: thấy mọi ô', mucCuaVai('chu_so_huu').length === MUC_KHO.length);
  ok('Vai lạ: chỉ Trang chủ và Khác, không lỗi', thanhDayCuaVai('thu_ngan').length <= 2);

  const quyenCo = new Set(Object.keys(QUYEN_KHO));
  const quyenLa = [...MUC_KHO, ...Object.values(THAO_TAC_NHANH).flat(), ...QUY_TRINH.flatMap(q => q.buoc)]
    .flatMap(m => m.quyen).filter(q => !quyenCo.has(q));
  ok('Mọi quyền nhắc tới trong menu là quyền có thật', quyenLa.length === 0, quyenLa.join(', '));

  const bieuTuongLa = [...MUC_KHO, ...Object.values(THANH_DAY).flat(), ...Object.values(THAO_TAC_NHANH).flat(),
    ...MUC_CRM, ...QUY_TRINH].map(m => m.bieuTuong).filter(b => !(b in BIEU_TUONG));
  ok('Mọi biểu tượng dùng trong menu đều có hình', bieuTuongLa.length === 0, bieuTuongLa.join(', '));

  const maTrung = MUC_KHO.map(m => m.ma).filter((m, i, a) => a.indexOf(m) !== i);
  ok('Mã mục menu không trùng', maTrung.length === 0, maTrung.join(', '));
});

// ===========================================================================
await nhom('3 · SỐ ĐỎ VÀ ĐÁNH DẤU MỤC ĐANG MỞ', async () => {
  ok('Đọc được khóa kho_dem_viec từ 0030', KHOA_DEM.has('duyet_nhap') && KHOA_DEM.has('het_han'),
    [...KHOA_DEM].join(', '));
  const khoaLa = [...MUC_KHO.flatMap(m => m.dem ?? []), ...QUY_TRINH.flatMap(q => q.buoc.flatMap(b => b.dem ?? []))]
    .filter(k => !KHOA_DEM.has(k));
  ok('Mọi khóa số đỏ (menu, quy trình) là khóa kho_dem_viec có thật', khoaLa.length === 0, khoaLa.join(', '));

  const duyet = MUC_KHO.find(m => m.ma === 'duyet');
  ok('Số đỏ Duyệt = cộng 3 loại chờ duyệt', soDo(duyet, { duyet_nhap: 2, duyet_huy: 1, duyet_kiem_ke: 3 }) === 6);
  ok('Khóa vắng mặt (không có quyền) tính 0', soDo(duyet, { duyet_nhap: 2 }) === 2);
  ok('Chưa đọc được số → 0, không lỗi', soDo(duyet, null) === 0);

  const trangChu = MUC_KHO.find(m => m.ma === 'trang_chu');
  const ton = MUC_KHO.find(m => m.ma === 'ton');
  ok('Trang chủ chỉ sáng ở đúng /noi-bo/kho', dangO(trangChu, '/noi-bo/kho') && !dangO(trangChu, '/noi-bo/kho/ton'));
  ok('Tồn kho sáng ở /noi-bo/kho/ton', dangO(ton, '/noi-bo/kho/ton'));
  ok('Nhập hàng sáng khi mở một phiếu nhập',
    dangO(MUC_KHO.find(m => m.ma === 'nhap'), '/noi-bo/kho/nhap/abc'));
  const oQuay = THANH_DAY.nhan_vien_quay.find(m => m.link.includes('vi_tri=quay'));
  ok('"Ở quầy" chỉ sáng khi có ?vi_tri=quay', dangO(oQuay, '/noi-bo/kho/ton', '?vi_tri=quay')
    && !dangO(oQuay, '/noi-bo/kho/ton', ''));
});

// ===========================================================================
await nhom('4 · THÔNG BÁO: KHÓA DATABASE ↔ CÂU CHỮ', async () => {
  ok('Đọc được khóa sự kiện từ 0030', KHOA_SK_SQL.size >= 10, [...KHOA_SK_SQL].join(', '));
  const thieuCau = [...KHOA_SK_SQL].filter(k => !KHOA_SU_KIEN.includes(k));
  ok('Mọi khóa database có thể trả về đều có câu chữ', thieuCau.length === 0, thieuCau.join(', '));
  const thua = KHOA_SU_KIEN.filter(k => !KHOA_SK_SQL.has(k));
  ok('Không có câu chữ cho khóa database không bao giờ trả', thua.length === 0, thua.join(', '));
  const mau = { nhom: 'van_hanh', ref_id: 'a', ref2: 'b', ma: 'X', ten: 'Y', phu: 'quay', so: 1, luc: '' };
  const cauChung = KHOA_SU_KIEN.filter(k => cauSuKien({ ...mau, khoa: k }).link === '/noi-bo/kho');
  ok('Mỗi khóa có câu riêng (không rơi vào câu chung)', cauChung.length === 0, cauChung.join(', '));
  const khongNull = KHOA_SU_KIEN.filter(k => /null|undefined/.test(JSON.stringify(cauSuKien({ ...mau, khoa: k,
    ten: null, ref2: null, so: null }))));
  ok('Thiếu tên / số lượng không in chữ "null"', khongNull.length === 0, khongNull.join(', '));
});

// ===========================================================================
await nhom('5 · NÚT "?" TRỎ ĐÚNG MỤC HƯỚNG DẪN', async () => {
  const hd = doc(join(TRANG, 'noi-bo/kho/huong-dan.astro'));
  const neoCo = new Set([...hd.matchAll(/\bid="([a-z0-9-]+)"/g)].map(m => m[1]));
  const dung = [];
  for (const f of moiFile(join(TRANG, 'noi-bo/kho')).filter(p => p.endsWith('.astro'))) {
    for (const m of doc(f).matchAll(/huongDan="([^"]+)"/g)) dung.push({ f: relative(TRANG, f), neo: m[1] });
  }
  const thieu = dung.filter(d => !neoCo.has(d.neo));
  ok(`Có trang dùng nút "?" (${dung.length} trang)`, dung.length > 0);
  ok('Mọi mục "?" tồn tại trong trang Hướng dẫn', thieu.length === 0, thieu.map(d => `${d.f}#${d.neo}`).join(', '));
});

// ===========================================================================
await nhom('6 · MỌI TRANG KHO DÙNG KHUNG MỚI', async () => {
  const trangKho = moiFile(join(TRANG, 'noi-bo/kho')).filter(p => p.endsWith('.astro'));
  const cu = trangKho.filter(p => /layouts\/NoiBo\.astro|DieuHuongKho/.test(doc(p)));
  ok('Không trang kho nào còn dùng khung NoiBo / DieuHuongKho', cu.length === 0,
    cu.map(p => relative(TRANG, p)).join(', '));
  const thieu = trangKho.filter(p => !/<Kho\s/.test(doc(p)));
  ok('Mọi trang kho bọc trong <Kho …>', thieu.length === 0, thieu.map(p => relative(TRANG, p)).join(', '));
  ok('Đã xóa DieuHuongKho.astro', !existsSync(join(WEB, 'src/components/kho/DieuHuongKho.astro')));
});

// ===========================================================================
await nhom('7 · CÀI NHƯ APP (manifest + biểu tượng)', async () => {
  const PUB = join(WEB, 'public');
  const khung = doc(join(WEB, 'src/layouts/Kho.astro'));
  const linkManifest = khung.match(/rel="manifest" href="([^"]+)"/)?.[1];
  const linkApple = khung.match(/rel="apple-touch-icon" href="([^"]+)"/)?.[1];
  ok('Khung kho gắn manifest', !!linkManifest);
  ok('Khung kho gắn biểu tượng cho iPhone', !!linkApple && existsSync(join(PUB, linkApple)));
  ok('Khung kho cho nội dung tràn tới tai thỏ (viewport-fit=cover)', /viewport-fit=cover/.test(khung));

  let mf = null;
  try { mf = JSON.parse(doc(join(PUB, linkManifest ?? ''))); } catch { /* báo ở dưới */ }
  ok('manifest.json đọc được', !!mf);
  if (!mf) return;
  ok('Có tên và tên ngắn (≤ 12 ký tự)', !!mf.name && !!mf.short_name && mf.short_name.length <= 12);
  ok('Mở như app riêng (standalone)', mf.display === 'standalone');
  ok('start_url nằm trong scope', typeof mf.start_url === 'string' && mf.start_url.startsWith(mf.scope));
  ok('start_url mở trang có thật', !!trangCua(mf.start_url));
  ok('Tiếng Việt', mf.lang === 'vi');

  /** Đọc rộng × cao trong khối IHDR của file PNG. */
  const coPng = p => {
    const b = readFileSync(p);
    if (b.readUInt32BE(0) !== 0x89504e47) return null;
    return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`;
  };
  const icons = mf.icons ?? [];
  for (const ic of icons) {
    const p = join(PUB, ic.src);
    ok(`Biểu tượng ${ic.src} có file`, existsSync(p));
    if (existsSync(p)) ok(`Biểu tượng ${ic.src} đúng cỡ ${ic.sizes}`, coPng(p) === ic.sizes, coPng(p) ?? 'không phải PNG');
  }
  ok('Có biểu tượng 192 và 512', ['192x192', '512x512'].every(s => icons.some(i => i.sizes === s)));
  ok('Có biểu tượng maskable (Android bo tròn không cắt mất đầu bò)', icons.some(i => /maskable/.test(i.purpose ?? '')));
  ok('Ảnh cho iPhone là 180×180', existsSync(join(PUB, linkApple)) && coPng(join(PUB, linkApple)) === '180x180');
  for (const s of mf.shortcuts ?? []) ok(`Lối tắt "${s.name}" mở trang có thật`, !!trangCua(s.url));
  ok('Không có service worker (chưa làm chế độ ngoại tuyến)',
    !existsSync(join(PUB, 'sw.js')) && !/serviceWorker/.test(khung));
});

// ===========================================================================
await nhom('8 · JAVASCRIPT CHỈ Ở CHỖ ĐÃ CHO PHÉP', async () => {
  // Trang kho phải chạy đủ khi tắt JavaScript. JS chỉ để "tăng cường": camera
  // quét nhãn, thu nhỏ ảnh, khóa máy dùng chung, in đơn đặt hàng.
  const DUOC_SCRIPT = new Set(['web/src/components/kho/QuetMa.astro']);
  const DUOC_JS = new Set(['ean13.js', 'anh-nho.js', 'may-chung.js', 'in-an.js']);
  const nguon = [
    ...moiFile(join(TRANG, 'noi-bo/kho')),
    ...moiFile(join(WEB, 'src/components/kho')),
    join(WEB, 'src/layouts/Kho.astro'),
  ].filter(p => p.endsWith('.astro'));
  // Được: script viết trong QuetMa.astro, và thẻ nạp một file trong public/kho/js
  // (<script is:inline src="/kho/js/in-an.js">). Mọi <script> khác là hỏng.
  const theHong = ma => [...ma.matchAll(/<script\b[^>]*>/gi)]
    .filter(m => !DUOC_JS.has(m[0].match(/src="\/kho\/js\/([^"]+)"/)?.[1] ?? ''));
  const coScript = nguon.filter(p => theHong(doc(p)).length > 0
    && !DUOC_SCRIPT.has(relative(GOC, p).split(sep).join('/')));
  ok('Không có <script> ngoài danh sách cho phép', coScript.length === 0,
    coScript.map(p => relative(GOC, p)).join(', '));
  const suKien = nguon.filter(p => /\son(click|change|submit|input|load|keydown|keyup|focus|blur)\s*=/i.test(doc(p)));
  ok('Không có onclick=… / onchange=… viết thẳng vào thẻ', suKien.length === 0,
    suKien.map(p => relative(GOC, p)).join(', '));
  const jsUrl = nguon.filter(p => /href="javascript:/i.test(doc(p)));
  ok('Không có link javascript:', jsUrl.length === 0, jsUrl.map(p => relative(GOC, p)).join(', '));

  const thuMucJs = join(WEB, 'public/kho/js');
  const jsLa = existsSync(thuMucJs) ? readdirSync(thuMucJs).filter(f => !DUOC_JS.has(f)) : [];
  ok('public/kho/js chỉ chứa file trong danh sách cho phép', jsLa.length === 0, jsLa.join(', '));
  for (const p of nguon) {
    for (const m of doc(p).matchAll(/src="\/kho\/js\/([^"]+)"/g)) {
      ok(`${relative(GOC, p)} nạp /kho/js/${m[1]} có thật và được phép`,
        DUOC_JS.has(m[1]) && existsSync(join(thuMucJs, m[1])));
    }
  }
});

// ===========================================================================
await nhom('9 · QUYỀN KHỚP GIỮA MENU VÀ TRANG', async () => {
  // Ô menu hiện với quyền X thì trang phải cho vào với quyền X (không bấm vào
  // ô rồi bị đá ra), và ngược lại trang cần quyền mà ô không đòi thì người
  // không đủ quyền sẽ thấy ô dẫn tới trang cấm.
  const hong = [];
  for (const m of MUC_KHO) {
    const t = trangCua(m.link);
    if (!t || !t.file.endsWith('.astro')) continue;
    // Dòng chặn đầu trang: "if (!k.duoc('a') && !k.duoc('b')) return Astro.redirect"
    // = cần MỘT trong a, b; nối bằng || = cần ĐỦ cả hai.
    const dong = doc(join(GOC, t.file)).split('\n')
      .find(d => /!k\.duoc\(/.test(d) && /return Astro\.redirect/.test(d));
    if (!dong) continue;
    const canh = [...dong.matchAll(/!k\.duoc\('([a-z_]+)'\)/g)].map(x => x[1]);
    const canDu = /\|\|/.test(dong);
    for (const vai of VAI) {
      const thayO = m.quyen.some(q => duoc(vai, q));
      const vaoDuoc = canDu ? canh.every(q => duoc(vai, q)) : canh.some(q => duoc(vai, q));
      if (thayO && !vaoDuoc) hong.push(`${m.ma}: ${vai} thấy ô nhưng trang đòi ${canh.join(canDu ? ' + ' : ' / ')}`);
    }
  }
  ok('Không vai nào thấy ô menu dẫn tới trang mình bị cấm', hong.length === 0, hong.join(' | '));
});

// ===========================================================================
await nhom('10 · TÌM, LỌC NGÀY, CHIA TRANG DANH SÁCH PHIẾU', async () => {
  const t = docTimDs(new URLSearchParams('q=Thịt ABC&tu=2026-09-20&den=2026-09-01&cua_toi=1&trang=3'));
  ok('Đọc chữ tìm', t.q === 'Thịt ABC');
  ok('Từ ngày sau đến ngày → tự đảo lại', t.tu === '2026-09-01' && t.den === '2026-09-20');
  ok('Đọc "của tôi" và trang', t.cuaToi && t.trang === 3);
  const xau = docTimDs(new URLSearchParams('tu=hom-qua&trang=-4'));
  ok('Ngày sai dạng bị bỏ, trang âm về 1', xau.tu === null && xau.trang === 1 && !dangTim(xau));
  ok('Chữ tìm không chèn được điều kiện lọc', lamSachTim('a,so_phieu.eq.1)*%"') === 'a so_phieu.eq.1');
  ok('Chữ tìm dài bị cắt ở 60 ký tự', lamSachTim('x'.repeat(200)).length === 60);
  ok('Bộ lọc nhiều cột', locTimNhieuCot(['so_phieu', 'ten'], 'PN-01') === 'so_phieu.ilike.*PN-01*,ten.ilike.*PN-01*');
  ok('Không tìm gì → không có bộ lọc', locTimNhieuCot(['so_phieu'], '  ') === null);
  const [dau, cuoi] = khoangTrang({ ...t, trang: 2 });
  ok(`Trang 2 đọc dòng ${CO_TRANG}..${2 * CO_TRANG} (dư 1 dòng để biết còn trang sau)`, dau === CO_TRANG && cuoi === 2 * CO_TRANG);
  const c = catTrang(Array.from({ length: CO_TRANG + 1 }, (_, i) => i));
  ok('Đọc được CO_TRANG + 1 dòng → còn trang sau, hiện CO_TRANG dòng', c.coSau && c.ds.length === CO_TRANG);
  ok('Đọc ít hơn → hết', !catTrang([1, 2]).coSau);
  const sp = new URLSearchParams('loc=cho_duyet&q=abc&trang=4');
  ok('Đổi bộ lọc thì về trang 1, giữ tham số khác',
    linkDs('/x', sp, { tu: '2026-09-01' }) === '/x?loc=cho_duyet&q=abc&tu=2026-09-01');
  ok('Đổi trang giữ bộ lọc', linkDs('/x', sp, { trang: '5' }) === '/x?loc=cho_duyet&q=abc&trang=5');
  ok('Bỏ hết tham số → đường dẫn trơn', linkDs('/x', new URLSearchParams('q=a'), { q: null }) === '/x');
  // apDungTim gọi đúng các bước trên builder
  const goi = [];
  const gia = new Proxy({}, { get: (_, ten) => (...a) => { goi.push(`${String(ten)}(${a.join('|')})`); return gia; } });
  apDungTim(gia, t, { cotTim: ['so_phieu'], cotNgay: 'ngay', nhanSuId: 'NS1' });
  ok('Áp tìm + ngày + của tôi + trang', goi.join(' ') ===
    `or(so_phieu.ilike.*Thịt ABC*) gte(ngay|2026-09-01) lte(ngay|2026-09-20) eq(nguoi_tao|NS1) range(${2 * CO_TRANG}|${3 * CO_TRANG})`,
    goi.join(' '));
});

// ===========================================================================
await nhom('11 · TRANG IN VÀ ĐĂNG NHẬP', async () => {
  for (const [f, ten] of [['nhap/[id].astro', 'PHIẾU NHẬP KHO'], ['xuat/[id].astro', 'BIÊN BẢN HỦY HÀNG'],
    ['kiem-ke/[id].astro', 'BIÊN BẢN KIỂM KÊ']]) {
    const ma = doc(join(TRANG, 'noi-bo/kho', f));
    ok(`${f}: có đầu trang in "${ten}", nút In và chỗ ký`,
      ma.includes(ten) && /<NutIn\b/.test(ma) && /<KyTen\b/.test(ma));
  }
  const css = doc(join(WEB, 'src/styles/kho-khung.css'));
  ok('Khi in: ẩn thanh trên, menu, nút; hiện phần chỉ-in', /@media print[\s\S]*kho-chi-in/.test(css));
  ok('Nút In chỉ hiện khi có JavaScript (hidden sẵn)',
    /data-in hidden/.test(doc(join(WEB, 'src/components/kho/NutIn.astro'))));
  ok('Quản lý / chủ đăng nhập xong vào thẳng kho',
    /redirect\('\/noi-bo\/kho'/.test(doc(join(TRANG, 'noi-bo/dang-nhap.astro'))));
});

process.exit(ketThuc('KHUNG GIAO DIỆN'));
