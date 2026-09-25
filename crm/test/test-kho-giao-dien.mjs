/**
 * BEEFTOWN KHO — Kiểm thử khung giao diện (menu, link, cài như app, JavaScript)
 * ==========================================================================
 *
 *     node test/test-kho-giao-dien.mjs
 *
 * Không cần database. Kiểm những thứ dễ vỡ âm thầm khi sửa giao diện:
 *   - mọi link trong menu, thanh đáy, thao tác nhanh, quy trình, thông báo đều
 *     trỏ tới một trang có thật (không ai bấm vào trang 404);
 *   - thanh đáy tối đa 5 nút, nhân viên quầy và thủ kho không thấy ô nào cần
 *     xem tiền (0031: thủ kho không thấy tiền — nhận hàng ở màn chỉ kg);
 *   - khóa số đỏ trong menu và quy trình là khóa kho_dem_viec có thật, khóa sự
 *     kiện của database (0030 trở đi) đều có câu chữ ở lib/kho/viec.ts;
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
import { docFormDienGia, chuSoSanhGia, cauCanhBaoGia } from '../../web/src/lib/kho/nhap.ts';
import { QUY_TRINH } from '../../web/src/lib/kho/quy-trinh.ts';
import { BIEU_TUONG } from '../../web/src/lib/kho/bieu-tuong.ts';
import { duoc, QUYEN_KHO } from '../../web/src/lib/kho/chung.ts';
import {
  docFormYeuCau, docFormMangRa, docFormNhan, gomMon, quaGio, soDeNghi, cauSoLuong,
} from '../../web/src/lib/kho/quay.ts';
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

// Khóa kho_dem_viec có thật: đọc từ thân hàm ở migration MỚI NHẤT còn dựng lại
// nó (0030 → 0031 → 0032...). Migration sau thay thân thì thân cũ hết hiệu lực.
const THU_MUC_MIG = join(GOC, 'crm/supabase/migrations');
const SQL_VIEC = readdirSync(THU_MUC_MIG).filter(f => f.endsWith('.sql')).sort().reverse()
  .map(f => doc(join(THU_MUC_MIG, f)))
  .find(s => s.includes('create or replace function kho_dem_viec(')
          && s.includes('create or replace function kho_su_kien(')) ?? '';
// Bỏ chú thích "-- …" trước khi dò khóa: dòng "-- 0033" chen giữa dấu phẩy và
// tên khóa thì khóa đó vẫn là khóa thật.
const thanDemViec = SQL_VIEC.slice(
  SQL_VIEC.indexOf('create or replace function kho_dem_viec('),
  SQL_VIEC.indexOf('comment on function kho_dem_viec'),
).replace(/--[^\n]*/g, '');
const KHOA_DEM = new Set(
  [...thanDemViec.matchAll(/(?:jsonb_build_object\(|,)\s*'([a-z_]+)'\s*,/g)].map(m => m[1]),
);
// Khóa sự kiện có thật: "select '<khóa>', '<nhóm>'" và nhánh case của hạn dùng.
const thanSuKien = SQL_VIEC.slice(
  SQL_VIEC.indexOf('create or replace function kho_su_kien('),
  SQL_VIEC.indexOf('create or replace function kho_dem_viec('),
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
  for (const ma of ['nhap', 'nhan_hang', 'pha_loc', 'bao_cao', 'cong_no', 'cai_dat', 'duyet']) {
    ok(`NV quầy: không thấy ô "${ma}"`, !nv.some(m => m.ma === ma));
  }

  // 0031: thủ kho không thấy tiền. Không ô, thao tác nhanh hay nút quy trình
  // nào của thủ kho chỉ mở được bằng quyền xem giá / kế toán.
  const chiTien = q => q.every(x => x === 'xem_gia' || x === 'ke_toan');
  const tk = mucCuaVai('thu_kho');
  ok('Thủ kho: không thấy ô nào chỉ-xem-giá', !tk.some(m => chiTien(m.quyen)),
    tk.filter(m => chiTien(m.quyen)).map(m => m.ma).join(', '));
  ok('Thủ kho: thanh đáy không có ô chỉ-xem-giá', !thanhDayCuaVai('thu_kho').some(m => chiTien(m.quyen)));
  ok('Thủ kho: thao tác nhanh không có mục chỉ-xem-giá', !thaoTacCuaVai('thu_kho').some(t => chiTien(t.quyen)));
  const qtTien = QUY_TRINH.flatMap(q => q.buoc).filter(b => b.quyen.some(x => duoc('thu_kho', x)) && chiTien(b.quyen));
  ok('Thủ kho: không có nút quy trình chỉ-xem-giá', qtTien.length === 0, qtTien.map(b => b.ten).join(', '));
  ok('Thủ kho: không có quyền xem giá (khớp 0031)', !duoc('thu_kho', 'xem_gia'));
  for (const ma of ['nhap', 'bao_cao', 'cong_no', 'duyet']) {
    ok(`Thủ kho: không thấy ô "${ma}"`, !tk.some(m => m.ma === ma));
  }
  for (const ma of ['nhan_hang', 'pha_loc', 'viec']) {
    ok(`Thủ kho: thấy ô "${ma}"`, tk.some(m => m.ma === ma));
  }
  const nhanTk = thaoTacCuaVai('thu_kho').find(t => t.ten === 'Nhận hàng');
  ok('Thủ kho: "Nhận hàng" mở màn nhận hàng chỉ kg', nhanTk?.link === '/noi-bo/kho/nhan-hang/moi', nhanTk?.link);
  ok('Ô "Nhập hàng" (có tiền) chỉ cho vai xem giá, không số đỏ phiếu nháp',
    (() => { const m = MUC_KHO.find(x => x.ma === 'nhap'); return m && chiTien(m.quyen) && !(m.dem ?? []).some(k => k.startsWith('nhap_')); })());

  const kt = mucCuaVai('ke_toan');
  ok('Kế toán: thấy Công nợ, Nhập hàng và Duyệt (điền giá phiếu nhập)',
    ['cong_no', 'nhap', 'duyet'].every(ma => kt.some(m => m.ma === ma)));
  ok('Kế toán: không thấy Nhận hàng (kế toán không lập phiếu)', !kt.some(m => m.ma === 'nhan_hang'));
  ok('Kế toán: thanh đáy có Duyệt', thanhDayCuaVai('ke_toan').some(m => m.ma === 'duyet'));
  ok('Kế toán: thao tác nhanh "Duyệt phiếu nhập"',
    thaoTacCuaVai('ke_toan').some(t => t.link === '/noi-bo/kho/duyet'));
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
  ok('Đọc được khóa kho_dem_viec từ migration mới nhất', KHOA_DEM.has('duyet_nhap') && KHOA_DEM.has('het_han'),
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
  ok('Nhận hàng sáng khi mở một phiếu nhận hàng, Nhập hàng thì không',
    dangO(MUC_KHO.find(m => m.ma === 'nhan_hang'), '/noi-bo/kho/nhan-hang/abc')
    && !dangO(MUC_KHO.find(m => m.ma === 'nhap'), '/noi-bo/kho/nhan-hang/abc'));
  ok('Số đỏ Nhận hàng = phiếu nháp + phiếu bị trả của chính mình',
    soDo(MUC_KHO.find(m => m.ma === 'nhan_hang'), { nhap_nhap: 2, nhap_bi_tra: 1 }) === 3);
  const oQuay = THANH_DAY.nhan_vien_quay.find(m => m.link.includes('vi_tri=quay'));
  ok('"Ở quầy" chỉ sáng khi có ?vi_tri=quay', dangO(oQuay, '/noi-bo/kho/ton', '?vi_tri=quay')
    && !dangO(oQuay, '/noi-bo/kho/ton', ''));
});

// ===========================================================================
await nhom('4 · THÔNG BÁO: KHÓA DATABASE ↔ CÂU CHỮ', async () => {
  ok('Đọc được khóa sự kiện từ migration mới nhất', KHOA_SK_SQL.size >= 10, [...KHOA_SK_SQL].join(', '));
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
  // 0031: thủ kho sửa phiếu bị trả ở màn nhận hàng (chỉ kg), không ở trang nhập có tiền.
  ok('Phiếu nhập bị trả về → mở màn nhận hàng',
    cauSuKien({ ...mau, khoa: 'nhap_bi_tu_choi', ref_id: 'X1' }).link === '/noi-bo/kho/nhan-hang/X1');
  ok('Phiếu nhập chờ duyệt → mở trang điền giá',
    cauSuKien({ ...mau, khoa: 'cho_duyet_nhap', ref_id: 'X1' }).link.startsWith('/noi-bo/kho/nhap/X1'));
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
  const oCanKiem = [
    ...MUC_KHO,
    ...Object.values(THANH_DAY).flat(),
    ...Object.entries(THAO_TAC_NHANH).flatMap(([vai, ds]) => ds.map(t => ({ ...t, ma: `thao tác ${vai} "${t.ten}"` }))),
    ...QUY_TRINH.flatMap(q => q.buoc.map(b => ({ ...b, ma: `quy trình ${q.ma} "${b.ten}"` }))),
  ];
  for (const m of oCanKiem) {
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

// ===========================================================================
await nhom('12 · THỦ KHO KHÔNG THẤY TIỀN (0031) — TRANG', async () => {
  // Trang nhập có tiền vẫn chỉ cho vai xem giá; người có quyền nhận hàng mà
  // không xem giá (thủ kho) được chuyển sang màn nhận hàng, không bị đá về
  // trang chủ.
  for (const f of ['nhap/index.astro', 'nhap/[id].astro']) {
    const dong = doc(join(TRANG, 'noi-bo/kho', f)).split('\n')
      .find(d => /!k\.duoc\('xem_gia'\)/.test(d) && /return Astro\.redirect/.test(d)) ?? '';
    ok(`${f}: không xem giá mà có quyền nhận hàng → chuyển sang nhan-hang`,
      /k\.duoc\('nhap'\)\s*\?\s*[`'a-zA-Z]*/.test(dong) && /nhan-hang|nhanHang/.test(dong), dong.trim());
  }
  const nhapId = doc(join(TRANG, 'noi-bo/kho/nhap/[id].astro'));
  ok('nhap/[id]: điền giá và duyệt theo quyền duyet_nhap', /k\.duoc\('duyet_nhap'\)/.test(nhapId)
    && /kho_dien_gia_phieu_nhap|dienGiaPhieu/.test(nhapId));
  ok('nhap/[id]: hủy phiếu đã duyệt vẫn cần quyền duyet',
    /trang_thai === 'da_duyet' && k\.duoc\('duyet'\)/.test(nhapId));
  const phaId = doc(join(TRANG, 'noi-bo/kho/pha-loc/[id].astro'));
  ok('pha-loc/[id]: thủ kho xem thử bằng bản chỉ kg', /xemThuPhienKg/.test(phaId) && /xemGia/.test(phaId));
  const phaLib = doc(join(WEB, 'src/lib/kho/pha-loc.ts'));
  ok('lib pha-loc gọi kho_xem_thu_phien_pha_kg', /\.rpc\('kho_xem_thu_phien_pha_kg'/.test(phaLib));
  // Màn điền giá: đọc form, chip so giá, hộp cảnh báo (hàm thuần).
  const f = new FormData();
  f.set('gia_A', '480.000'); f.set('gia_B', ''); f.set('gia_LA', '999'); f.set('tien_thue', '12.000');
  const dg = docFormDienGia(f, [{ id: 'A' }, { id: 'B' }], 'mua');
  ok('Điền giá: chỉ nhận ô của dòng thuộc phiếu, ô trống = 0',
    JSON.stringify(dg.payload) === JSON.stringify([{ dong_id: 'A', don_gia_kg: 480000 }, { dong_id: 'B', don_gia_kg: 0 }])
    && dg.loi.length === 0, JSON.stringify(dg));
  f.set('gia_B', '4,8 triệu');
  ok('Điền giá: gõ sai đơn giá thì báo đúng dòng', docFormDienGia(f, [{ id: 'A' }, { id: 'B' }], 'mua').loi[0]?.startsWith('Dòng 2'));
  ok('Điền giá: tồn đầu kỳ luôn gửi thuế, chi phí trống',
    docFormDienGia(f, [{ id: 'A' }], 'ton_dau').giaTri.tien_thue === '');
  const ss = (chenh, vuot) => ({ dong_id: 'A', mat_hang_id: 'M', don_gia_kg: 520000, gia_truoc: 480000,
    ngay_truoc: '2026-09-01', so_phieu_truoc: 'PN-1', chenh_pt: chenh, vuot_nguong: vuot });
  ok('Chip so giá: "Lần trước 480.000 đ · +8,3%", đỏ khi vượt',
    chuSoSanhGia(ss(8.3, true))?.chu === 'Lần trước 480.000 đ · +8,3%' && chuSoSanhGia(ss(8.3, true))?.vuot === true,
    chuSoSanhGia(ss(8.3, true))?.chu);
  ok('Chip so giá: chưa có lần trước → không hiện', chuSoSanhGia({ ...ss(null, false), gia_truoc: null }) === null);
  ok('Hộp cảnh báo: đếm món vượt ngưỡng',
    cauCanhBaoGia([ss(8.3, true), ss(6, true), ss(3, false)], 5) === '2 món giá tăng hơn 5% so với lần trước — kiểm lại hóa đơn');
  ok('Hộp cảnh báo: không món nào vượt → không hiện', cauCanhBaoGia([ss(3, false)], 5) === null);

  const duyet = doc(join(TRANG, 'noi-bo/kho/duyet.astro'));
  ok('Trang Duyệt: báo hủy, kiểm kê chỉ đọc cho vai duyet', /duyetKhac \? docDanhSachPhieuXuat/.test(duyet)
    && /duyetKhac \? docDanhSachKiemKe/.test(duyet));
});

// ===========================================================================
await nhom('13 · QUẦY YÊU CẦU → MANG RA → BẤM NHẬN (0032)', async () => {
  for (const f of ['quay/yeu-cau/index.astro', 'quay/yeu-cau/[id].astro', 'quay/nhan.astro']) {
    ok(`Có trang ${f}`, existsSync(join(TRANG, 'noi-bo/kho', f)));
  }
  const mau = { nhom: 'van_hanh', ref_id: 'P1', ref2: 'Q1', ma: 'YC-2609-0001', ten: 'Quầy thịt', phu: 'quay', so: 4, luc: '' };
  ok('Yêu cầu của quầy → mở yêu cầu, nút "Mang ra"',
    cauSuKien({ ...mau, khoa: 'yeu_cau_quay' }).link === '/noi-bo/kho/quay/yeu-cau/P1'
    && cauSuKien({ ...mau, khoa: 'yeu_cau_quay' }).nut === 'Mang ra');
  ok('Hàng đang mang ra → màn nhận hàng; quá giờ thì đỏ, chưa quá thì vàng',
    cauSuKien({ ...mau, khoa: 'hang_dang_chuyen' }).link === '/noi-bo/kho/quay/nhan'
    && cauSuKien({ ...mau, khoa: 'hang_dang_chuyen', phu: 'qua_gio' }).muc === 'do'
    && cauSuKien({ ...mau, khoa: 'hang_dang_chuyen' }).muc === 'vang');
  ok('Quầy nhận thiếu → quản lý mở phiếu chuyển',
    cauSuKien({ ...mau, khoa: 'chuyen_nhan_thieu' }).link === '/noi-bo/kho/xuat/P1');

  // Menu: NV quầy có "Yêu cầu hàng" ở thao tác nhanh, nút Quầy có số đỏ hàng đang mang ra.
  ok('NV quầy: thao tác nhanh "Yêu cầu hàng" đứng đầu',
    thaoTacCuaVai('nhan_vien_quay')[0]?.link === '/noi-bo/kho/quay/yeu-cau');
  ok('NV quầy: nút Quầy có số đỏ hàng đang mang ra',
    soDo(THANH_DAY.nhan_vien_quay[0], { hang_dang_chuyen: 2 }) === 2);
  ok('Thủ kho: số đỏ Việc gồm yêu cầu của quầy',
    soDo(MUC_KHO.find(m => m.ma === 'viec'), { yeu_cau_quay: 3 }) === 3);
  const qt = QUY_TRINH.find(q => q.ma === 'quay');
  ok('Quy trình "Quầy mỗi ngày": yêu cầu → mang ra → bấm nhận → xử lý thiếu',
    ['/noi-bo/kho/quay/yeu-cau', '/noi-bo/kho/quay/nhan'].every(l => qt?.buoc.some(b => b.link === l))
    && ['yeu_cau_quay', 'hang_dang_chuyen', 'chuyen_nhan_thieu'].every(k => qt?.buoc.some(b => (b.dem ?? []).includes(k))));

  const mh = [
    { id: '00000000-0000-0000-0000-00000000000a', ma: 'A', ten: 'Thăn', nhom: null, loai: 'phan_cat', dem_goi: true, don_vi_goi: 'gói', dang_dung: true },
    { id: '00000000-0000-0000-0000-00000000000b', ma: 'B', ten: 'Xương', nhom: null, loai: 'phu_pham', dem_goi: false, don_vi_goi: 'gói', dang_dung: true },
  ];
  const [A, B] = mh.map(m => m.id);
  const f = new FormData();
  f.set(`g_${A}`, '3'); f.set(`g_${B}`, '1,5'); f.set('t0_mat_hang', A); f.set('t0_so', '2');
  const yc = docFormYeuCau(f, mh, 3);
  ok('Yêu cầu: gói với món đếm gói, kg với món cân ký; một món hai dòng thì cộng lại',
    JSON.stringify(yc.dong) === JSON.stringify([{ mat_hang_id: A, so_goi: 5 }, { mat_hang_id: B, so_kg: 1.5 }])
    && yc.nguon === 'goi_y' && yc.loi.length === 0, JSON.stringify(yc));
  const f2 = new FormData(); f2.set(`g_${A}`, '0'); f2.set('t0_mat_hang', A); f2.set('t0_so', '1,5');
  const yc2 = docFormYeuCau(f2, mh, 1);
  ok('Yêu cầu: ghi 0 là bỏ món; món đếm gói ghi số lẻ thì báo lỗi', yc2.dong.length === 0 && yc2.loi.length === 1, JSON.stringify(yc2));
  const f3 = new FormData(); f3.set('t0_so', '2');
  ok('Yêu cầu: dòng có số mà chưa chọn món thì báo', docFormYeuCau(f3, mh, 1).loi.length === 1);

  const dong = [{ thu_tu: 1, mat_hang_id: A, so_goi: 4, so_kg: null, ghi_chu: null },
                { thu_tu: 2, mat_hang_id: B, so_goi: 0, so_kg: 2, ghi_chu: null }];
  const m1 = new FormData(); m1.set(`m_${A}`, '4'); m1.set(`m_${B}`, '2');
  ok('Mang ra đúng như yêu cầu → p_dong null', docFormMangRa(m1, dong, mh).pDong === null);
  const m2 = new FormData(); m2.set(`m_${A}`, '3'); m2.set(`m_${B}`, '0');
  ok('Mang ra ít hơn / bỏ món → gửi số thật, bỏ món ghi 0',
    JSON.stringify(docFormMangRa(m2, dong, mh).pDong) === JSON.stringify([{ mat_hang_id: A, so_goi: 3 }]));
  const m3 = new FormData(); m3.set(`m_${A}`, '0'); m3.set(`m_${B}`, '0');
  ok('Mang ra: mọi món 0 → báo, không lập phiếu rỗng', docFormMangRa(m3, dong, mh).loi.length === 1);

  const mon = gomMon([{ mat_hang_id: A, so_goi: 2, so_kg: 1.2 }, { mat_hang_id: A, so_goi: 1, so_kg: 0.6 },
                      { mat_hang_id: B, so_goi: 0, so_kg: 2 }]);
  ok('Gom dòng phiếu theo món (nhiều lô)', mon.length === 2 && mon[0].so_goi === 3 && mon[0].so_kg === 1.8);
  const n1 = new FormData(); n1.set(`n_${A}`, '3'); n1.set(`n_${B}`, '2');
  ok('Nhận: ghi đủ mọi món → p_dong null (= nhận đủ)', docFormNhan(n1, mon, mh).pDong === null);
  const n2 = new FormData(); n2.set(`n_${A}`, '2'); n2.set(`n_${B}`, '2');
  ok('Nhận thiếu: chỉ gửi món nhận ít hơn',
    JSON.stringify(docFormNhan(n2, mon, mh).pDong) === JSON.stringify([{ mat_hang_id: A, so_goi: 2 }]));
  const n3 = new FormData(); n3.set(`n_${A}`, '5'); n3.set(`n_${B}`, '');
  ok('Nhận: nhiều hơn số mang ra hoặc bỏ trống → báo từng món', docFormNhan(n3, mon, mh).loi.length === 2);

  ok('Quá giờ nhắc', quaGio('2026-09-25T00:00:00Z', 2, new Date('2026-09-25T02:00:00Z'))
    && !quaGio('2026-09-25T00:00:00Z', 2, new Date('2026-09-25T01:59:00Z')));
  ok('Số đề nghị: món cân ký dùng kg, kho hết → 0',
    soDeNghi({ dem_goi: false, so_goi_de_nghi: null, so_kg_de_nghi: 1.5 }) === 1.5
    && soDeNghi({ dem_goi: true, so_goi_de_nghi: null, so_kg_de_nghi: null }) === 0);
  ok('Câu số lượng: "3 gói" · "1,5 kg"', cauSoLuong(mh[0], 3, 1) === '3 gói' && cauSoLuong(mh[1], 0, 1.5) === '1,5 kg');

  // Công tắc Cài đặt đi qua kho_luu_nguong — không ghi thẳng bảng kho_cai_dat.
  const quayLib = doc(join(WEB, 'src/lib/kho/quay.ts'));
  ok('Công tắc "Quầy phải bấm nhận" lưu bằng kho_luu_nguong',
    /\.rpc\('kho_luu_nguong'[\s\S]{0,120}chuyen_quay_can_nhan/.test(quayLib)
    && !/from\('kho_cai_dat'\)\s*\.(update|upsert|insert)/.test(quayLib));
  ok('Màn Cài đặt có công tắc', /chuyen_quay_can_nhan/.test(doc(join(TRANG, 'noi-bo/kho/cai-dat/index.astro'))));
  // GĐ5e: Cài đặt thành "Thiết lập" có tiến độ (0035) — chi tiết ở test-kho-thiet-lap-web.mjs.
  ok('Ô menu "Thiết lập" mở màn có thanh tiến độ', MUC_KHO.find(m => m.ma === 'cai_dat')?.ten === 'Thiết lập'
    && /kho_tien_do_thiet_lap/.test(doc(join(GOC, 'web/src/lib/kho/thiet-lap.ts')))
    && /cauConLai\(tienDo\)/.test(doc(join(TRANG, 'noi-bo/kho/cai-dat/index.astro'))));
});

// ===========================================================================
await nhom('14 · THẺ KHO VÀ QUÉT ĐẦY ĐỦ (GĐ5c, 0033)', async () => {
  const { linkTheKho, linkChungTu } = await import('../../web/src/lib/kho/the-kho.ts');
  const MH = '00000000-0000-0000-0000-00000000000a';
  ok('Có trang the-kho/[mat_hang_id].astro', existsSync(join(TRANG, 'noi-bo/kho/the-kho/[mat_hang_id].astro')));
  const lk = linkTheKho(MH, { viTri: '', tu: '2026-09-01', den: '2026-09-25' });
  ok('Link thẻ kho trỏ tới trang có thật', trangCua(lk)?.file.endsWith('the-kho/[mat_hang_id].astro'), lk);
  ok('Mở thẻ kho thì ô "Tồn kho" sáng', dangO(MUC_KHO.find(m => m.ma === 'ton'), lk));
  const hong = [];
  for (const loai of ['phieu_nhap', 'phien_pha', 'phieu_xuat', 'kiem_ke']) {
    const l = linkChungTu(loai, MH, () => true);
    if (!l || !trangCua(l)) hong.push(`${loai}: ${l}`);
  }
  ok('Link chứng từ của thẻ kho trỏ tới trang có thật', hong.length === 0, hong.join(' | '));
  ok('Thủ kho (không xem giá) mở phiếu nhập ở màn nhận hàng',
    linkChungTu('phieu_nhap', MH, q => q !== 'xem_gia') === `/noi-bo/kho/nhan-hang/${MH}`);
  ok('NV quầy (không nhận hàng, không pha lóc): phiếu nhập / phiên pha không có link',
    linkChungTu('phieu_nhap', MH, q => q === 'xem') === null && linkChungTu('phien_pha', MH, q => q === 'xem') === null);

  const theKho = doc(join(TRANG, 'noi-bo/kho/the-kho/[mat_hang_id].astro'));
  ok('Thẻ kho: chặn quyền xem, gọi docTheKho, in được (InDau, NutIn, KyTen)',
    /if \(!k\.duoc\('xem'\)\) return Astro\.redirect/.test(theKho) && /docTheKho\(/.test(theKho)
    && /<InDau\b/.test(theKho) && /<NutIn\b/.test(theKho) && /<KyTen\b/.test(theKho));
  ok('Thẻ kho: không có tiền', !/dinhDangTien|gia_von|gia_tri/.test(theKho));
  ok('Tồn kho: mỗi món có nút "Thẻ kho"', /linkTheKho\(g\.mat_hang_id\)/.test(doc(join(TRANG, 'noi-bo/kho/ton.astro'))));
  const quet = doc(join(TRANG, 'noi-bo/kho/quet.astro'));
  ok('Quét: nút Thẻ kho, nút theo lô, Đếm quầy, Thêm vào phiên pha',
    /linkTheKho\(mh\.id\)/.test(quet) && /viecVoiLo\(l\)/.test(quet) && /\/noi-bo\/kho\/quay\/dem/.test(quet)
    && /themNhanVaoPhienPha\(/.test(quet) && /name="ma_gui"/.test(quet));
  ok('Quét: không có tiền', !/dinhDangTien|docGiaTon/.test(quet));
  const form = doc(join(WEB, 'src/components/kho/FormMatHang.astro'));
  ok('Danh mục mặt hàng: ô "Sau pha để ở" (Kho lạnh / Quầy)', /name="noi_de_sau_pha"/.test(form) && /Sau pha để ở/.test(form));
});

// ===========================================================================
await nhom('15 · MÁY TÍNH BẢNG DÙNG CHUNG (GĐ5d, 0034) — TRANG', async () => {
  // Không cần database: kiểm các chỗ nối giữa khung, moTrangKho, trang máy và
  // may-chung.js. Phần mã hóa + database ở test-kho-may-chung.mjs.
  for (const l of ['/noi-bo/kho/may', '/noi-bo/kho/may/dang-ky', '/noi-bo/kho/may/gan', '/noi-bo/kho/may?chon=x']) {
    ok(`Trang máy dùng chung có thật: ${l}`, !!trangCua(l));
  }
  const khung = doc(join(WEB, 'src/layouts/Kho.astro'));
  ok('Khung: nạp may-chung.js CHỈ khi có người đang dùng máy dùng chung',
    /\{coNguoiDung && k\.may && \(\s*<script is:inline src="\/kho\/js\/may-chung\.js"/.test(khung)
    && (khung.match(/may-chung\.js/g) ?? []).length === 2);
  ok('Khung ở chế độ máy: "Khóa máy" và "Gỡ tôi khỏi máy này" gửi về màn máy (viec khoa / go)',
    /name="viec" value="khoa"[\s\S]{0,200}Khóa máy/.test(khung) && /name="viec" value="go"[\s\S]{0,200}Gỡ tôi khỏi máy này/.test(khung)
    && /action=\{DUONG_MAY\}/.test(khung));
  ok('Khung ở chế độ máy: không có "Đăng xuất", không menu CRM',
    /laMay \? \([\s\S]*\) : coNguoiDung \? \([\s\S]*\) : \([\s\S]*Đăng xuất/.test(khung)
    && /const crm = cheDoMay \? \[\]/.test(khung));

  const man = doc(join(TRANG, 'noi-bo/kho/may/index.astro'));
  ok('Màn máy nhận viec=mo (PIN), khoa, go, ?khoa=1 (may-chung.js) và ?giu=1',
    ["viec === 'mo'", "viec === 'khoa'", "viec === 'go'", "get('khoa') === '1'", "get('giu') === '1'"].every(x => man.includes(x)));
  ok('Ô PIN: bàn phím số, không tự điền, 4–6 số',
    /name="pin" inputmode="numeric" pattern="\[0-9\]\*" autocomplete="off"\s+minlength="4" maxlength="6"/.test(man));

  const js = doc(join(WEB, 'public/kho/js/may-chung.js'));
  ok('may-chung.js: hết giờ về /noi-bo/kho/may?khoa=1, báo còn dùng bằng ?giu=1',
    js.includes("'/noi-bo/kho/may?khoa=1'") && js.includes("'/noi-bo/kho/may?giu=1'"));
  ok('may-chung.js không đụng cookie (cookie máy httpOnly)', !/document\.cookie/.test(js));

  const trang = doc(join(WEB, 'src/lib/kho/trang.ts'));
  const iMay = trang.indexOf('kiemMayChung(Astro, nhanSu)');
  ok('moTrangKho kiểm tự khóa trước khi đọc gì khác',
    iMay > 0 && iMay < trang.indexOf("vaiDuoc(nhanSu.vai_tro, 'xem')") && iMay < trang.indexOf("from('chi_nhanh')"));
  ok('moTrangKho: vai máy chỉ vào /noi-bo/kho/may/*',
    /if \(laVaiMay\(nhanSu\.vai_tro\)\) \{\s*if \(!laDuongMay\(Astro\.url\.pathname\)\) return Astro\.redirect\(DUONG_MAY/.test(trang));

  const lib = doc(join(WEB, 'src/lib/kho/may-chung.ts'));
  ok('Đổi phiên bằng client không lưu phiên (persistSession: false)',
    (lib.match(/persistSession: false/g) ?? []).length >= 2 && !/persistSession: true/.test(lib));
  ok('Đọc bí mật KHO_MAY_KHOA qua cloudflare:workers, không qua import.meta.env',
    /import\('cloudflare:workers'\)/.test(lib) && !/import\.meta\.env[^\n]*KHO_MAY_KHOA/.test(lib));
  // Soát bảo mật GĐ5d: ba chỗ dễ bị sửa ngược.
  const moKhoa = lib.slice(lib.indexOf('export async function moKhoaNguoi'), lib.indexOf('// GẮN NGƯỜI VÀO MÁY'));
  ok('Mở bằng PIN: giải mã phiên đã cất TRƯỚC khi gọi kho_may_kiem_pin (không dò PIN cho tên máy không mở được)',
    moKhoa.indexOf('giaiMaToken(') > 0 && moKhoa.indexOf('giaiMaToken(') < moKhoa.indexOf("rpc('kho_may_kiem_pin'"));
  ok('POST trong ân hạn không dời mốc hoạt động (mở trang ngay sau đó là khóa)',
    /const trongAnHan = laPost && daQuaGioKhoa\(moc\.luc, bayGio, tb\.phut, false\);\s*if \(!trongAnHan\) await ghiMoc/.test(lib));
  const dk = lib.slice(lib.indexOf('export async function dangKyMay'));
  ok('Đăng ký máy thu hồi phiên bị đè và token máy cũ (không để phiên sống mà không ai giữ)',
    (dk.match(/await thuHoi\(/g) ?? []).length >= 2);
  const coToken = moiFile(join(TRANG, 'noi-bo/kho/may'))
    .filter(p => /refresh_token|access_token|bt_may_|bt_phien/.test(doc(p)));
  ok('Trang máy không chạm token / cookie máy (chỉ lib/kho/may-chung.ts)', coToken.length === 0,
    coToken.map(p => relative(GOC, p)).join(', '));
});

process.exit(ketThuc('KHUNG GIAO DIỆN'));
