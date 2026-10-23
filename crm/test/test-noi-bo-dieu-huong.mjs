/**
 * BEEFTOWN NỘI BỘ — Kiểm thử bản đồ chức năng (menu hai khung, nhóm, ô tìm)
 * =========================================================================
 *
 *     node test/test-noi-bo-dieu-huong.mjs
 *
 * Không cần database: menu là dữ liệu thuần (web/src/lib/dieu-huong-noi-bo.ts,
 * kho/dieu-huong.ts, ban-do-chuc-nang.ts). Giữ các điều:
 *
 *   1. HỒI QUY — đang ở kho thì tới được Zalo, Messenger, Tin tuyển dụng (bản soi
 *      gương cũ thiếu ba mục); trang Khác ở máy tính bảng dùng chung không có nút
 *      "Đăng xuất" (xóa phiên của cả máy) và không có phần nhà hàng.
 *   2. Thanh đáy điện thoại tối đa 5 nút; vai nào cũng tới được MỌI mục của mình —
 *      trên thanh, hoặc qua "Thêm". Bản cũ xếp 8 chữ lên thanh đáy 360px, 4 mục
 *      cuối nằm ngoài mép màn hình.
 *   3. Ai thấy mục nào khớp với trang đó / RLS, đúng như menu cũ; nhóm kho không
 *      thêm, không bớt mục nào so với quyền.
 *   4. Ô tìm: không dấu so không dấu, có dấu so đúng dấu ("dừng" không ra "Đúng"),
 *      chữ NFD, chỉ ra mục vai được thấy.
 *   5. Chữ đủ hai thứ tiếng, vừa chỗ, không chữ cấm.
 *   6. Khung: không còn danh sách viết tay, thanh trên xuống dòng thay vì cuộn ngang.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { MUC_KHO, MUC_CRM, mucCuaVai, THAO_TAC_NHANH } from '../../web/src/lib/kho/dieu-huong.ts';
import { BIEU_TUONG } from '../../web/src/lib/kho/bieu-tuong.ts';
import { QUYEN_KHO } from '../../web/src/lib/kho/chung.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN NỘI BỘ — KIỂM THỬ BẢN ĐỒ CHỨC NĂNG');

const GOC = fileURLToPath(new URL('../../', import.meta.url));
const WEB = join(GOC, 'web');
const TRANG = join(WEB, 'src', 'pages');
const doc = p => readFileSync(join(GOC, p), 'utf8');

/** Mọi file trong một thư mục, đệ quy. */
function moiFile(thuMuc) {
  return readdirSync(thuMuc).flatMap(ten => {
    const p = join(thuMuc, ten);
    return statSync(p).isDirectory() ? moiFile(p) : [p];
  });
}
// Bảng đường dẫn dựng từ thư mục pages như Astro (giống test-kho-giao-dien.mjs).
const TUYEN = moiFile(TRANG).filter(p => /\.(astro|ts)$/.test(p)).map(p => {
  let d = '/' + relative(TRANG, p).split(sep).join('/');
  d = d.replace(/\.(astro|ts)$/, '').replace(/\/index$/, '') || '/';
  return { file: relative(GOC, p), duong: d, re: new RegExp(`^${d.replace(/[.]/g, '\\.').replace(/\[[^\]/]+\]/g, '[^/]+')}$`) };
});
function trangCua(link) {
  const duong = link.split('#')[0].split('?')[0].replace(/\/$/, '') || '/';
  return TUYEN.find(t => t.duong === duong) ?? TUYEN.find(t => t.re.test(duong)) ?? null;
}

const VAI_CRM_DS = ['chu_so_huu', 'quan_ly', 'thu_ngan', 'marketing'];
const VAI_KHO_DS = ['thu_kho', 'nhan_vien_quay', 'ke_toan'];
const MOI_VAI = [...VAI_CRM_DS, ...VAI_KHO_DS];
const VIET = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const bang = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

// ===========================================================================
await nhom('1 · HỒI QUY — TỪ KHO SANG PHẦN NHÀ HÀNG, MÁY DÙNG CHUNG', async () => {
  // Menu người dùng và trang Khác bên kho đọc MUC_CRM. Bản viết tay cũ chỉ có 5 mục.
  const vaiCua = link => MUC_CRM.find(m => m.link === link)?.vai ?? [];
  ok('Menu bên kho có Zalo cho chủ, quản lý, marketing',
    bang(vaiCua('/noi-bo/zalo'), ['chu_so_huu', 'quan_ly', 'marketing']), JSON.stringify(vaiCua('/noi-bo/zalo')));
  ok('Menu bên kho có Messenger cho chủ, quản lý',
    bang(vaiCua('/noi-bo/messenger'), ['chu_so_huu', 'quan_ly']), JSON.stringify(vaiCua('/noi-bo/messenger')));
  ok('Menu bên kho có Tin tuyển dụng cho bốn vai CRM',
    bang(vaiCua('/noi-bo/tin-tuyen-dung'), VAI_CRM_DS), JSON.stringify(vaiCua('/noi-bo/tin-tuyen-dung')));
  ok('Menu bên kho không có mục Kho (đang ở kho rồi)', !MUC_CRM.some(m => m.link === '/noi-bo/kho'));

  // Trang Khác ở máy tính bảng dùng chung: như menu người dùng của layouts/Kho.astro.
  const khac = doc('web/src/pages/noi-bo/kho/khac.astro');
  ok('Trang Khác ở máy dùng chung: "Khóa máy" gửi về màn máy, không "Đăng xuất"',
    /cheDoMay \? \(\s*<form method="POST" action=\{DUONG_MAY\}[\s\S]{0,160}name="viec" value="khoa"[\s\S]{0,200}\{t\.khoaMay\}[\s\S]*\) : \(\s*<form method="POST" action="\/noi-bo\/dang-xuat"/.test(khac)
    && /const cheDoMay = laCheDoMay\(vai, k\.may\)/.test(khac));
  ok('Trang Khác và khung kho hỏi cùng một hàm "chế độ máy" (laCheDoMay)',
    /const cheDoMay = laCheDoMay\(vai, k\.may\)/.test(doc('web/src/layouts/Kho.astro')));
  // may-chung.ts nạp lib/phien (cần Astro) — đọc mã nguồn của hàm.
  ok('laCheDoMay: tài khoản máy, hoặc một người đã mở khóa bằng PIN',
    /export function laCheDoMay\([^)]*\): boolean \{\s*return laVaiMay\(vai\) \|\| !!may\?\.nhanSuId;\s*\}/.test(doc('web/src/lib/kho/may-chung.ts')));
  ok('Trang Khác ở máy dùng chung: không phần nhà hàng',
    /banDoChucNang\(vai, 'kho', \{ cheDoMay \}\)/.test(khac));
  const { banDoChucNang } = await import('../../web/src/lib/ban-do-chuc-nang.ts');
  const linkCua = ds => ds.flatMap(n => n.muc.map(m => m.link));
  ok('Bản đồ ở chế độ máy: không link nào sang phần nhà hàng',
    !linkCua(banDoChucNang('quan_ly', 'kho', { cheDoMay: true })).some(l => !l.startsWith('/noi-bo/kho')));
  ok('Bản đồ thường của quản lý: có phần nhà hàng',
    linkCua(banDoChucNang('quan_ly', 'kho')).includes('/noi-bo/dat-ban'));
});

const NB = await import('../../web/src/lib/dieu-huong-noi-bo.ts');
const BD = await import('../../web/src/lib/ban-do-chuc-nang.ts');
const KDH = await import('../../web/src/lib/kho/dieu-huong.ts');

// ===========================================================================
await nhom('2 · THANH MENU: TỐI ĐA 5 NÚT, KHÔNG MỤC NÀO MẤT', async () => {
  const { MUC_NOI_BO, MUC_THEM, SO_NUT_DAY, mucNoiBoCuaVai, thanhDayNoiBo, thanhTrenNoiBo, canTrangTatCa, dangONoiBo } = NB;
  for (const vai of MOI_VAI) {
    const day = thanhDayNoiBo(vai);
    const tren = thanhTrenNoiBo(vai);
    const cua = mucNoiBoCuaVai(vai);
    ok(`${vai}: thanh đáy ≤ ${SO_NUT_DAY} nút (có ${day.length})`, day.length <= SO_NUT_DAY);
    ok(`${vai}: thanh trên có đủ mọi mục của vai`, cua.every(m => tren.includes(m)));
    // Mục không nằm trên thanh đáy phải nằm trên trang Tất cả chức năng.
    const banDo = BD.banDoChucNang(vai, 'nha_hang').flatMap(n => n.muc.map(m => m.link));
    const thieu = cua.filter(m => !day.includes(m) && !banDo.includes(m.link));
    ok(`${vai}: mục nào cũng tới được bằng thanh đáy hoặc nút "Thêm"`, thieu.length === 0 || day.at(-1) === MUC_THEM,
      thieu.map(m => m.ma).join(', '));
    ok(`${vai}: không mục nào nằm ngoài cả thanh đáy lẫn trang Tất cả chức năng`, thieu.length === 0,
      thieu.map(m => m.ma).join(', '));
    ok(`${vai}: nút "Thêm" chỉ có khi cần, và luôn đứng cuối`,
      canTrangTatCa(vai) === day.includes(MUC_THEM) && (!day.includes(MUC_THEM) || day.at(-1) === MUC_THEM));
  }
  const ma = vai => NB.thanhDayNoiBo(vai).map(m => m.ma).join(',');
  ok('Chủ: thanh đáy Tổng quan · Đặt bàn · Kho · Zalo · Thêm', ma('chu_so_huu') === 'tong_quan,dat_ban,kho,zalo,them', ma('chu_so_huu'));
  ok('Quản lý: thanh đáy như chủ', ma('quan_ly') === ma('chu_so_huu'), ma('quan_ly'));
  ok('Marketing: đủ 5 mục, không cần "Thêm"', ma('marketing') === 'tong_quan,dat_ban,zalo,noi_dung,tin_tuyen_dung', ma('marketing'));
  ok('Thu ngân: Tổng quan · Đặt bàn · Tin tuyển dụng', ma('thu_ngan') === 'tong_quan,dat_ban,tin_tuyen_dung', ma('thu_ngan'));
  ok('Vai lạ / chưa đăng nhập: không mục nào, không lỗi', NB.thanhDayNoiBo('may_chung').length === 0 && NB.thanhDayNoiBo(undefined).length === 0);
  // Vai chỉ-kho mở một trang khung NoiBo: chỉ một mục (Kho) → không hiện thanh nào, như bản cũ;
  // không có "Tất cả chức năng" (trang đó chuyển họ sang trang Khác của kho).
  for (const vai of VAI_KHO_DS) {
    ok(`${vai}: khung NoiBo chỉ có mục Kho, không "Thêm"`,
      NB.thanhTrenNoiBo(vai).map(m => m.ma).join() === 'kho' && NB.thanhDayNoiBo(vai).map(m => m.ma).join() === 'kho'
      && !NB.canTrangTatCa(vai));
  }
  ok('Chủ: thanh trên có "Tất cả chức năng" ở cuối', NB.thanhTrenNoiBo('chu_so_huu').at(-1) === MUC_THEM);

  ok('Tổng quan chỉ sáng ở đúng /noi-bo', dangONoiBo({ link: '/noi-bo' }, '/noi-bo') && dangONoiBo({ link: '/noi-bo' }, '/noi-bo/')
    && !dangONoiBo({ link: '/noi-bo' }, '/noi-bo/dat-ban'));
  ok('Zalo sáng ở trang con /noi-bo/zalo/cai-dat', dangONoiBo({ link: '/noi-bo/zalo' }, '/noi-bo/zalo/cai-dat'));
  ok('Tin tuyển dụng không làm sáng Tuyển dụng (hai đường khác nhau)',
    dangONoiBo({ link: '/noi-bo/tin-tuyen-dung' }, '/noi-bo/tin-tuyen-dung/abc')
    && !dangONoiBo({ link: '/noi-bo/tuyen-dung' }, '/noi-bo/tin-tuyen-dung/abc'));
  ok('Thêm sáng ở /noi-bo/chuc-nang', dangONoiBo(MUC_THEM, '/noi-bo/chuc-nang'));

  const hong = [...MUC_NOI_BO, MUC_THEM].filter(m => !trangCua(m.link)).map(m => m.link);
  ok('Mọi link của menu nhà hàng trỏ tới trang có thật', hong.length === 0, hong.join(', '));
  const hongBd = MOI_VAI.flatMap(v => [...BD.banDoChucNang(v, 'nha_hang'), ...BD.banDoChucNang(v, 'kho')])
    .flatMap(n => n.muc).filter(m => !trangCua(m.link)).map(m => m.link);
  ok('Mọi link của bản đồ chức năng trỏ tới trang có thật', hongBd.length === 0, [...new Set(hongBd)].join(', '));
  const bt = [...MUC_NOI_BO, MUC_THEM].map(m => m.bieuTuong).filter(b => !(b in BIEU_TUONG));
  ok('Mọi biểu tượng của menu nhà hàng đều có hình', bt.length === 0, bt.join(', '));
  ok('Biểu tượng tìm, tin nhắn, trang web có hình', ['tim', 'tin_nhan', 'trang_web'].every(b => b in BIEU_TUONG));
  const maTrung = MUC_NOI_BO.map(m => m.ma).filter((m, i, a) => a.indexOf(m) !== i);
  ok('Mã mục menu nhà hàng không trùng', maTrung.length === 0, maTrung.join(', '));
});

// ===========================================================================
await nhom('3 · AI THẤY MỤC NÀO — KHỚP TRANG VÀ RLS', async () => {
  const vaiCua = ma => [...(NB.MUC_NOI_BO.find(m => m.ma === ma)?.vai ?? [])];
  // Đúng bảng của menu cũ trong layouts/NoiBo.astro (khớp RLS) — chuyển chỗ không được đổi quyền.
  const CU = {
    tong_quan: VAI_CRM_DS, noi_dung: ['chu_so_huu', 'quan_ly', 'marketing'], dat_ban: VAI_CRM_DS,
    tuyen_dung: ['chu_so_huu', 'quan_ly'], zalo: ['chu_so_huu', 'quan_ly', 'marketing'],
    messenger: ['chu_so_huu', 'quan_ly'], kho: ['chu_so_huu', 'quan_ly', 'thu_kho', 'nhan_vien_quay', 'ke_toan'],
    cai_dat: ['chu_so_huu', 'quan_ly'],
  };
  for (const [ma, vai] of Object.entries(CU)) {
    ok(`Mục ${ma}: đúng vai như menu cũ (${vai.join(', ')})`, bang(vaiCua(ma), vai), vaiCua(ma).join(', '));
  }
  ok('Tin tuyển dụng: bốn vai CRM (trang đọc cho mọi vai CRM, chỉ ẩn ô soạn)',
    bang(vaiCua('tin_tuyen_dung'), VAI_CRM_DS)
    && /const duocSoan = \['chu_so_huu', 'quan_ly', 'marketing'\]/.test(doc('web/src/pages/noi-bo/tin-tuyen-dung/index.astro')));
  const mess = doc('web/src/pages/noi-bo/messenger.astro');
  ok('Messenger: trang chỉ cho chủ, quản lý — đúng vai của mục',
    /if \(!laChu && nhanSu\.vai_tro !== 'quan_ly'\) return Astro\.redirect/.test(mess) && bang(vaiCua('messenger'), ['chu_so_huu', 'quan_ly']));
  const { VAI_ZALO } = await import('../../web/src/lib/zalo-trang.ts');
  ok('Zalo: vai của mục = VAI_ZALO mà trang Zalo kiểm', bang(vaiCua('zalo'), VAI_ZALO));
  ok('Kho: vai của mục = vai có quyền "xem" kho (QUYEN_KHO)', bang(vaiCua('kho'), QUYEN_KHO.xem) && bang(NB.VAI_VAO_KHO, QUYEN_KHO.xem));
  ok('Vai chỉ-kho không thấy mục nhà hàng nào ngoài Kho',
    VAI_KHO_DS.every(v => NB.mucNoiBoCuaVai(v).every(m => m.ma === 'kho')));

  const cn = doc('web/src/pages/noi-bo/chuc-nang.astro');
  ok('Trang Tất cả chức năng: vai ngoài bốn vai CRM chuyển sang trang Khác của kho, giữ chữ tìm',
    /if \(!\(VAI_CRM as readonly string\[\]\)\.includes\(vai\)\) \{\s*return Astro\.redirect\('\/noi-bo\/kho\/khac' \+ \(tim \? `\?tim=\$\{encodeURIComponent\(tim\)\}` : ''\), 302\)/.test(cn));
  ok('Trang Tất cả chức năng không gọi database (ai thấy gì do vai quyết định)', !/\.from\(|\.rpc\(|client/.test(cn));

  // Nhóm kho: không thêm, không bớt mục nào so với quyền.
  for (const vai of [...VAI_KHO_DS, 'chu_so_huu', 'quan_ly', 'thu_ngan', 'may_chung']) {
    const theoNhom = KDH.nhomCuaVai(vai).flatMap(n => n.muc.map(m => m.ma));
    ok(`${vai}: các nhóm kho chứa đúng các mục vai được thấy`, bang(theoNhom, mucCuaVai(vai).map(m => m.ma)), theoNhom.join(', '));
    const banDoKho = BD.banDoChucNang(vai, 'kho').flatMap(n => n.muc.map(m => m.link)).filter(l => l.startsWith('/noi-bo/kho'));
    const duocThay = new Set(mucCuaVai(vai).map(m => m.link));
    ok(`${vai}: trang Khác không có mục kho ngoài quyền`, banDoKho.every(l => duocThay.has(l)));
    const crm = BD.banDoChucNang(vai, 'kho').flatMap(n => n.muc.map(m => m.link)).filter(l => !l.startsWith('/noi-bo/kho'));
    ok(`${vai}: trang Khác chỉ có mục nhà hàng của vai`, crm.every(l => MUC_CRM.find(m => m.link === l)?.vai.includes(vai)));
  }
  ok('Thủ kho: trang Khác không có phần nhà hàng', !BD.banDoChucNang('thu_kho', 'kho').some(n => n.ma === 'nb_phan_khac'));
  // Ô menu có nhóm; mục con (`cha`, gọn menu 22/10/2026) không có nhóm — nó theo nhóm của ô cha.
  const khongNhom = MUC_KHO.filter(m => m.cha ? m.nhom : !KDH.NHOM_KHO.some(n => n.ma === m.nhom)).map(m => m.ma);
  ok('Ô menu kho nào cũng thuộc một nhóm có thật; mục con không tự đặt nhóm', khongNhom.length === 0, khongNhom.join(', '));
  ok('Nhóm kho nào cũng có ô', KDH.NHOM_KHO.every(n => MUC_KHO.some(m => m.nhom === n.ma)));
  ok('Chủ: 15 ô kho trong 6 nhóm', KDH.nhomCuaVai('chu_so_huu').length === 6 && mucCuaVai('chu_so_huu').length === 15);
  // Mục con không in trên trang Khác nhưng ô tìm vẫn ra, kèm tên nhóm của ô cha.
  const kq = (vai, chu) => BD.timChucNang(BD.banDoChucNang(vai, 'kho'), BD.thaoTacNhanhChucNang(vai), chu);
  const inTrenTrang = BD.banDoChucNang('chu_so_huu', 'kho').flatMap(n => n.muc.map(m => m.link));
  ok('Trang Khác không in mục con (Tảng · ủ, Mặt hàng, Bán hàng iPOS)',
    !['/noi-bo/kho/tang', '/noi-bo/kho/cai-dat/mat-hang', '/noi-bo/kho/ban-ipos'].some(l => inTrenTrang.includes(l)));
  for (const [chu, link, nhomVi] of [['tảng', '/noi-bo/kho/tang', 'Tồn kho'], ['mặt hàng', '/noi-bo/kho/cai-dat/mat-hang', 'Thiết lập và trợ giúp'],
    ['ipos', '/noi-bo/kho/ban-ipos', 'Tiền và báo cáo'], ['ai lam duoc gi', '/noi-bo/kho/cai-dat/quyen', 'Thiết lập và trợ giúp'],
    ['nhận hàng ra quầy', '/noi-bo/kho/quay/nhan', 'Pha lóc, quầy, xuất']]) {
    const r = kq('chu_so_huu', chu).find(x => x.muc.link === link);
    ok(`Ô tìm "${chu}" vẫn ra mục con ${link}, dưới nhóm "${nhomVi}"`, r?.nhom.vi === nhomVi, r?.nhom.vi ?? 'không ra');
  }
  ok('Ô tìm không ra mục con vai không mở được (kế toán gõ "ipos")', !kq('ke_toan', 'ipos').some(x => x.muc.link === '/noi-bo/kho/ban-ipos'));
  const tuLa = Object.keys(KDH.TU_KHOA_KHO).filter(ma => !MUC_KHO.some(m => m.ma === ma));
  ok('Từ khóa tìm chỉ cho mục kho có thật', tuLa.length === 0, tuLa.join(', '));
});

// ===========================================================================
await nhom('4 · Ô TÌM — DẤU TIẾNG VIỆT, QUYỀN', async () => {
  const { banDoChucNang, thaoTacNhanhChucNang, timChucNang, lamSachTimChucNang, GIOI_HAN_TIM } = BD;
  const tim = (vai, chu, trang = 'nha_hang') => timChucNang(banDoChucNang(vai, trang), thaoTacNhanhChucNang(vai), chu);
  const ten = ds => ds.map(k => k.muc.ten.vi);

  ok('"cong no" (không dấu) ra Công nợ', ten(tim('chu_so_huu', 'cong no'))[0] === 'Công nợ', ten(tim('chu_so_huu', 'cong no')).join(' | '));
  ok('"công nợ" (có dấu) ra Công nợ', ten(tim('chu_so_huu', 'công nợ'))[0] === 'Công nợ');
  ok('"CÔNG NỢ" (chữ hoa) ra Công nợ', ten(tim('chu_so_huu', 'CÔNG NỢ'))[0] === 'Công nợ');
  ok('Chữ NFD (dán từ macOS / Excel) ra như chữ gõ', ten(tim('chu_so_huu', 'công nợ'.normalize('NFD')))[0] === 'Công nợ');
  ok('Chữ có dấu so đúng dấu: "hủy" ra Chuyển · Xuất · Hủy, "hùy" không ra gì',
    ten(tim('chu_so_huu', 'hủy')).includes('Chuyển · Xuất · Hủy') && tim('chu_so_huu', 'hùy').length === 0);
  ok('"đặt" ra Đặt bàn và Đặt hàng; "dat" cũng ra; "dật" không ra gì',
    ['Đặt bàn', 'Đặt hàng'].every(x => ten(tim('chu_so_huu', 'đặt')).includes(x))
    && ['Đặt bàn', 'Đặt hàng'].every(x => ten(tim('chu_so_huu', 'dat')).includes(x)) && tim('chu_so_huu', 'dật').length === 0);
  // CLAUDE.md mục 4: "Đúng" không phải "dừng".
  const thu = [{ ma: 'x', ten: { vi: 'Thử', en: 'Test' }, muc: [{ ten: { vi: 'Đúng giờ', en: 'On time' }, link: '/a', bieuTuong: 'nha' }] }];
  ok('"dừng" không khớp "Đúng"; "dung" (không dấu) thì khớp; "đúng" khớp',
    timChucNang(thu, [], 'dừng').length === 0 && timChucNang(thu, [], 'dung').length === 1 && timChucNang(thu, [], 'đúng').length === 1);
  ok('Khớp từ ĐẦU mỗi từ: "cong no" không ra "Nội dung website" (công bố, nội)',
    !ten(tim('chu_so_huu', 'cong no')).includes('Nội dung website'), ten(tim('chu_so_huu', 'cong no')).join(' | '));
  ok('Khớp từ đầu mỗi từ: "tin" không ra Cài đặt (set·tin·gs), có ra Tin Zalo và Tin tuyển dụng',
    !ten(tim('chu_so_huu', 'tin')).includes('Cài đặt nhà hàng')
    && ['Tin Zalo', 'Tin tuyển dụng'].every(x => ten(tim('chu_so_huu', 'tin')).includes(x)), ten(tim('chu_so_huu', 'tin')).join(' | '));
  ok('Gõ một phần đầu từ vẫn ra: "write" ra Chuyển · Xuất · Hủy (write-off)',
    ten(tim('chu_so_huu', 'write')).includes('Chuyển · Xuất · Hủy'));
  for (const vai of ['chu_so_huu', 'quan_ly', 'thu_kho', 'nhan_vien_quay', 'ke_toan']) {
    ok(`${vai}: ví dụ trong Hướng dẫn ("bao huy") ra màn hủy hàng`,
      tim(vai, 'bao huy', 'kho').some(k => k.muc.link.startsWith('/noi-bo/kho/xuat')), ten(tim(vai, 'bao huy', 'kho')).join(' | '));
  }
  ok('Chữ gõ theo cụm trong từ khóa phải liền nhau: "tien tra" (đảo thứ tự) không ra Công nợ',
    !ten(tim('chu_so_huu', 'tien tra')).includes('Công nợ'));
  ok('Chữ nằm hết trong tên thì thứ tự nào cũng được: "hàng đặt" ra Đặt hàng',
    ten(tim('chu_so_huu', 'hàng đặt')).includes('Đặt hàng'));
  ok('Mọi chữ phải khớp: "tra tien" ra Công nợ (từ khóa), "tra xyz" không ra gì',
    ten(tim('chu_so_huu', 'tra tien')).includes('Công nợ') && tim('chu_so_huu', 'tra xyz').length === 0);
  ok('Tìm bằng tiếng Anh: "payables" ra Công nợ', ten(tim('chu_so_huu', 'payables'))[0] === 'Công nợ');
  ok('Khớp tên đứng trước khớp từ khóa: kế toán gõ "hóa đơn" → "Đối chiếu hóa đơn" đầu tiên',
    ten(tim('ke_toan', 'hóa đơn', 'kho'))[0] === 'Đối chiếu hóa đơn', ten(tim('ke_toan', 'hóa đơn', 'kho')).join(' | '));
  ok('Kết quả ghi nhóm chứa mục (Kho · Tiền và báo cáo)',
    tim('chu_so_huu', 'cong no')[0]?.nhom.vi === 'Kho · Tiền và báo cáo', tim('chu_so_huu', 'cong no')[0]?.nhom.vi);
  ok('Một đường dẫn chỉ ra một lần (thao tác nhanh "Duyệt" trùng mục Duyệt)',
    tim('quan_ly', 'duyệt', 'kho').filter(k => k.muc.link === '/noi-bo/kho/duyet').length === 1);
  ok('Một tên chỉ ra một lần: quản lý gõ "đặt hàng" thấy một dòng Đặt hàng (bỏ thao tác nhanh /dat-hang/moi)',
    tim('quan_ly', 'đặt hàng', 'kho').filter(k => k.muc.ten.vi === 'Đặt hàng').length === 1
    && tim('quan_ly', 'đặt hàng', 'kho')[0]?.muc.link === '/noi-bo/kho/dat-hang', tim('quan_ly', 'đặt hàng', 'kho').map(k => k.muc.link).join(' | '));
  ok('Thủ kho gõ "báo hủy" ra thao tác nhanh Báo hủy',
    tim('thu_kho', 'báo hủy', 'kho').some(k => k.muc.link === '/noi-bo/kho/xuat/moi?loai=huy' && k.nhom.vi === 'Thao tác nhanh'));
  // quyen: tìm chỉ trong những gì vai được thấy.
  ok('Thủ kho gõ "cong no" không ra Công nợ (không có quyền kế toán)', tim('thu_kho', 'cong no', 'kho').length === 0);
  ok('Thủ kho gõ "nhập hàng" không ra Nhập hàng có tiền (0031)',
    !tim('thu_kho', 'nhập hàng', 'kho').some(k => k.muc.link === '/noi-bo/kho/nhap'));
  ok('NV quầy gõ "zalo" không ra gì', tim('nhan_vien_quay', 'zalo', 'kho').length === 0);
  ok('Marketing gõ "messenger" không ra gì (chỉ chủ, quản lý)', tim('marketing', 'messenger').length === 0);

  ok('Chữ tìm rỗng / toàn dấu cách: không tìm', timChucNang(banDoChucNang('chu_so_huu', 'kho'), [], '   ').length === 0);
  ok('Làm sạch: không phải chuỗi → rỗng', lamSachTimChucNang(null) === '' && lamSachTimChucNang(['a']) === '' && lamSachTimChucNang(5) === '');
  ok('Làm sạch: gộp khoảng trắng, bỏ đầu cuối', lamSachTimChucNang('  công \t nợ \n') === 'công nợ');
  ok(`Làm sạch: tối đa ${GIOI_HAN_TIM} ký tự (đếm chữ có dấu là một)`,
    [...lamSachTimChucNang('ợ'.repeat(200))].length === GIOI_HAN_TIM);
  ok('Làm sạch: đưa về NFC', lamSachTimChucNang('nợ'.normalize('NFD')) === 'nợ');
  let nem = false;
  try { timChucNang(banDoChucNang('chu_so_huu', 'kho'), [], '<script>(.*+?[') ; } catch { nem = true; }
  ok('Ký tự đặc biệt (<script>, ngoặc, dấu regex) không làm hỏng ô tìm', !nem);

  const cn = doc('web/src/pages/noi-bo/chuc-nang.astro'), khac = doc('web/src/pages/noi-bo/kho/khac.astro');
  ok('Hai trang đọc ?tim= qua lamSachTimChucNang',
    [cn, khac].every(s => /lamSachTimChucNang\(Astro\.url\.searchParams\.get\('tim'\)\)/.test(s)));
});

// ===========================================================================
await nhom('5 · CHỮ HAI THỨ TIẾNG, VỪA CHỖ, KHÔNG CHỮ CẤM', async () => {
  const { timChuoiCam } = await import('../../web/src/lib/chuoi-cam.js');
  const cap = [
    ...NB.MUC_NOI_BO.flatMap(m => [m.ten, m.ngan, m.tuKhoa].filter(Boolean)), NB.MUC_THEM.ten, NB.MUC_THEM.ngan,
    ...NB.NHOM_NOI_BO.map(n => n.ten), ...KDH.NHOM_KHO.map(n => n.ten), ...Object.values(KDH.TU_KHOA_KHO),
  ];
  ok('Mọi chữ có cả tiếng Việt và tiếng Anh', cap.every(c => c.vi?.trim() && c.en?.trim()));
  const enViet = cap.filter(c => VIET.test(c.en)).map(c => c.en);
  ok('Bản tiếng Anh không còn chữ Việt', enViet.length === 0, enViet.join(' | '));
  const dai = [...NB.MUC_NOI_BO, NB.MUC_THEM].flatMap(m => ['vi', 'en'].map(nn => m.ngan[nn])).filter(c => [...c].length > 10);
  ok('Tên trên thanh đáy ≤ 10 ký tự (360px chia 5 nút)', dai.length === 0, dai.join(', '));
  const nhomDai = KDH.NHOM_KHO.flatMap(n => ['vi', 'en'].map(nn => n.ten[nn])).filter(c => [...c].length > 26);
  ok('Tên nhóm kho ≤ 26 ký tự (cột trái 15rem)', nhomDai.length === 0, nhomDai.join(', '));
  const cam = cap.flatMap(c => [c.vi, c.en]).flatMap(c => timChuoiCam(c).map(x => `${c}: ${x.tim_thay}`));
  ok('Không chữ cấm (chuoi-cam.js)', cam.length === 0, cam.join(' | '));
  const bd = doc('web/src/components/BanDoChucNang.astro');
  ok('Không thấy kết quả thì nói thật là không thấy, và chỉ đường xem tất cả',
    /khongCo: \{\s*vi: \(q: string\) => `Không thấy chức năng nào khớp “\$\{q\}”/.test(bd) && /\{t\.xemTatCa\}/.test(bd));
});

// ===========================================================================
await nhom('6 · KHUNG: MỘT DANH SÁCH, KHÔNG CUỘN NGANG, KHÔNG JAVASCRIPT', async () => {
  const noiBo = doc('web/src/layouts/NoiBo.astro');
  ok('Khung NoiBo đọc menu từ lib/dieu-huong-noi-bo.ts, không còn danh sách viết tay',
    /thanhTrenNoiBo\(nhanSu\?\.vai_tro\)/.test(noiBo) && /thanhDayNoiBo\(nhanSu\?\.vai_tro\)/.test(noiBo)
    && !/'\/noi-bo\/messenger'|'\/noi-bo\/zalo'/.test(noiBo));
  ok('Khung NoiBo: thanh trên và thanh đáy là hai thanh riêng', /class="nb-dieu-huong"/.test(noiBo) && /class="nb-day"/.test(noiBo));
  const css = doc('web/src/styles/noi-bo.css');
  const khoiNav = css.slice(css.indexOf('/* --- Điều hướng'), css.indexOf('/* --- Thân trang'));
  ok('Thanh trên xuống dòng, không cuộn ngang', /\.nb-dieu-huong-hang \{[^}]*flex-wrap: wrap/.test(khoiNav) && !/overflow-x/.test(khoiNav));
  ok('Điện thoại: ẩn thanh trên, hiện thanh đáy', /@media \(max-width: 640px\) \{[\s\S]*\.nb-dieu-huong \{ display: none; \}[\s\S]*\.nb-day \{\s*position: fixed/.test(khoiNav));
  ok('Điện thoại: tên + vai người đang đăng nhập vẫn hiện (hàng thứ hai của đầu trang)',
    /\.nb-ten \{ order: 9; flex-basis: 100%/.test(khoiNav) && !/\.nb-ten \{ display: none/.test(css));

  const kho = doc('web/src/layouts/Kho.astro');
  ok('Cột trái kho in theo nhóm (nhomCuaVai)', /const cot = nhomCuaVai\(vai\)/.test(kho));
  ok('Điện thoại: đổi chi nhánh nằm trong menu người dùng (thanh trên đè lên chữ "Kho")',
    /class="kho-chi-hep"/.test(kho) && /@media \(max-width: 640px\) \{\s*\.kho-cn-chon \{ display: none; \}\s*\.kho-chi-hep \{ display: block; \}/.test(doc('web/src/styles/kho-khung.css')));

  const bd = doc('web/src/components/BanDoChucNang.astro');
  const oTim = doc('web/src/components/OTimChucNang.astro');
  ok('Ô tìm là form GET thường, không <script>',
    /<form method="get" action=\{hanhDong\}/.test(oTim) && /name="tim"/.test(oTim) && ![oTim, bd].some(x => /<script/i.test(x)));
  ok('Ô tìm có nhãn cho trình đọc màn hình và giới hạn độ dài',
    /<label for=\{id\} class="nb-an">/.test(oTim) && /<input id=\{id\}/.test(oTim) && /maxlength=\{GIOI_HAN_TIM\}/.test(oTim));
  ok('Một ô tìm cho cả cột trái kho và trang Tất cả chức năng / Khác (OTimChucNang)',
    /<OTimChucNang nn=\{nn\} hanhDong="\/noi-bo\/kho\/khac" kieu="ben"/.test(kho) && /<OTimChucNang /.test(bd)
    && !/<form method="get"/.test(kho) && !/<form method="get"/.test(bd));
  ok('Trang Tất cả chức năng và trang Khác dùng chung một component',
    /<BanDoChucNang /.test(doc('web/src/pages/noi-bo/chuc-nang.astro')) && /<BanDoChucNang /.test(doc('web/src/pages/noi-bo/kho/khac.astro')));
});

process.exit(ketThuc('BẢN ĐỒ CHỨC NĂNG'));
