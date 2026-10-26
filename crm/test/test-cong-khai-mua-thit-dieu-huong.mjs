/**
 * BEEFTOWN — TRANG MUA THỊT VỀ: ĐÍCH ĐẶT HÀNG, MỘT TRẠNG THÁI, ĐIỀU HƯỚNG, VỎ TRANG, QUYỀN RIÊNG TƯ
 * ==================================================================================================
 *
 *     node test/test-cong-khai-mua-thit-dieu-huong.mjs
 *
 * Phần của trang Mua thịt về nằm NGOÀI hai component (bản thiết kế PR 2, mục 2.4, 2.5, 2.6, 2.12, 2.13):
 *
 *   1. Đích đặt hàng (web/src/lib/dich-dat-hang.ts — quyết định 4 của Khánh, 26/10/2026): link gửi đơn chỉ
 *      là link chat Zalo OA dạng https://zalo.me/<mã> (cùng mẫu la_link_zalo_oa() của migration 0101), một
 *      file quyết định nút gửi trỏ đâu và giỏ đi sang quán thế nào. Luồng "Chép đơn → mở chat → dán → Gửi" là
 *      TẠM: PR sau đổi sang deep link Mini App chỉ sửa file này. File chỉ có import type (script của trang
 *      nạp nó trong trình duyệt). Chữ của bước gửi đủ vi / en / ko, không chữ cấm, không hứa "thành công".
 *   2. Một trạng thái: muaThitVeMo(nd) đúng khi và chỉ khi công tắc HIỆU LỰC của database
 *      (nd.hien_mua_thit_ve) là true VÀ link Zalo OA qua laLinkZaloOa.
 *   3. Điều hướng: bốn mục như cũ khi chưa có database hay trang chưa mở; năm mục khi mở — "Mua thịt về"
 *      ngay sau "Thực đơn", mục cuối vẫn là "Hỏi bàn". Đầu trang và chân trang đưa nd vào dieuHuong.
 *   4. Đường dẫn và ba file vỏ: dòng CAP_DUONG_DAN ngay sau /thuc-don (thứ tự sitemap); vỏ đọc nội dung
 *      và menu song song, tính trạng thái bằng trangThaiMuaThit(muaThitVeMo(noiDung), menu).
 *   5. Mô tả trang: câu "chưa mở" không hứa gửi đơn, không nhắc Zalo.
 *   6. Quyền riêng tư, xóa dữ liệu: nói đúng đường đi của dữ liệu — gói đã chọn lên máy chủ qua địa chỉ
 *      trang, không kèm thông tin cá nhân, Beeftown không lưu đơn; tin đơn đi qua Zalo.
 *
 * Phần trong component: test-cong-khai-mua-thit-ve.mjs. Lib đơn và menu: test-mua-thit-ve-web.mjs.
 * Database: test-mua-thit-ve.mjs (nhóm 9 so la_link_zalo_oa() với laLinkZaloOa() trên một bảng mẫu).
 */

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const LIB = join(SRC, 'lib');
const nap = f => import(pathToFileURL(join(LIB, f)).href);
const doc = duong => readFileSync(join(GOC, duong), 'utf8');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — MUA THỊT VỀ: ĐÍCH ĐẶT HÀNG, ĐIỀU HƯỚNG, VỎ TRANG, QUYỀN RIÊNG TƯ');

const { chu, duongDanTuongUng, CAP_DUONG_DAN, NGON_NGU } = await nap('chu.ts');
const { dieuHuong, moTaTrangMuaThit } = await nap('trang-cong-khai.ts');
const { docNoiDung } = await nap('noi-dung.ts');
const { timChuoiCam } = await nap('chuoi-cam.js');
// File của bước 1 chưa có thì từng nhóm đỏ với lý do rõ, không đổ cả file.
const TEP_DICH = join(LIB, 'dich-dat-hang.ts');
const dichDatHangLib = existsSync(TEP_DICH) ? await nap('dich-dat-hang.ts') : null;
const { laLinkZaloOa, MAU_LINK_ZALO_OA, dichDatHang, linkGuiDon, muaThitVeMo, CHU_DICH } = dichDatHangLib ?? {};
const CHUA_CO_DICH = 'chưa có web/src/lib/dich-dat-hang.ts';

// Bản nền đúng như trang thấy khi chưa nối database: mọi khóa null.
const NEN = await docNoiDung('vi', null);
const nd = (them = {}) => ({ ...NEN, ...structuredClone(them) });
const LINK_OA = 'https://zalo.me/3030027075662095415';
// Chữ chỉ tiếng Việt mới có (en / ko không được có): nguyên âm mang dấu và đ.
const CHU_VIET = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/iu;

// ===========================================================================
await nhom('1 · ĐÍCH ĐẶT HÀNG (web/src/lib/dich-dat-hang.ts, quyết định 4)', async () => {
  if (!dichDatHangLib) { ok('web/src/lib/dich-dat-hang.ts có và nạp được', false, CHUA_CO_DICH); return; }

  const NHAN = [
    [LINK_OA, LINK_OA],
    ['https://zalo.me/beeftown', 'https://zalo.me/beeftown'],
    ['https://zalo.me/beeftown/', 'https://zalo.me/beeftown/'],
    ['https://zalo.me/Bee.town_oa-1', 'https://zalo.me/Bee.town_oa-1'],
    [`  ${LINK_OA}\n`, LINK_OA],
  ];
  const BO = [
    'http://zalo.me/beeftown', 'https://example.com/beeftown', 'https://zalo.me.example.com/x', 'https://zalo.me/a/b',
    'https://zalo.me/x?y=1', 'https://zalo.me/x#y', 'https://zalo.me/', 'https://zalo.me', 'https://zalo.me//x',
    'javascript:alert(1)//https://zalo.me/x', 'HTTPS://ZALO.ME/x', 'https://zalo.me/x y', '', '   ',
    null, undefined, 42, {},
  ];
  const sai = [
    ...NHAN.filter(([u, mong]) => laLinkZaloOa(u) !== mong).map(([u]) => `nhận ${JSON.stringify(u)} → ${laLinkZaloOa(u)}`),
    ...BO.filter(u => laLinkZaloOa(u) !== null).map(u => `bỏ ${JSON.stringify(u)} → ${laLinkZaloOa(u)}`),
  ];
  ok('laLinkZaloOa nhận https://zalo.me/<mã> (cả dấu / cuối, khoảng trắng hai đầu); bỏ http, máy chủ khác, đường dẫn con, chuỗi truy vấn, #, javascript:, chữ hoa, chuỗi rỗng, null, số',
     sai.length === 0, sai.join(' · '));
  ok('MAU_LINK_ZALO_OA là một RegExp không cờ (A nhóm 9 so từng ký tự với la_link_zalo_oa() của 0101)',
     MAU_LINK_ZALO_OA instanceof RegExp && MAU_LINK_ZALO_OA.flags === '' && MAU_LINK_ZALO_OA.test(LINK_OA),
     String(MAU_LINK_ZALO_OA));

  const khongCo = [nd(), nd({ zalo_oa_url: 'http://zalo.me/beeftown' }), nd({ zalo_oa_url: 'https://www.facebook.com/beeftown' }),
    nd({ zalo_oa_url: 'javascript:alert(1)' })].map(x => dichDatHang(x));
  const co = dichDatHang(nd({ zalo_oa_url: `  ${LINK_OA} ` }));
  ok('dichDatHang: không link hợp lệ → null; có → cach chep_tin_mo_chat_oa, coBuocChep true, url đúng link đã trim',
     khongCo.every(d => d === null) && co !== null && co.cach === 'chep_tin_mo_chat_oa' && co.coBuocChep === true && co.url === LINK_OA
       && Object.keys(co).sort().join() === 'cach,coBuocChep,url',
     JSON.stringify({ khongCo, co }));
  ok('Đích chuyển được qua data-dich: JSON.parse(JSON.stringify(dich)) giữ nguyên ba trường',
     co !== null && JSON.stringify(JSON.parse(JSON.stringify(co))) === JSON.stringify(co));

  const gioRong = new Map();
  const gioCo = new Map([['ribeye-cap_200', 2], ['kim-chi-cai-thao_500', 1]]);
  const link = co ? [gioRong, gioCo].flatMap(g => ['quay', 'giao'].map(cn => linkGuiDon(co, g, cn))) : [];
  ok('linkGuiDon (PR 2) trả đúng dich.url với giỏ rỗng, giỏ có gói, cả quầy và giao',
     link.length === 4 && link.every(l => l === LINK_OA), link.join(' · '));

  const KHOA = ['buocGui', 'nutXemDon', 'buocSau', 'nutGui', 'nutChep', 'daChep', 'chepLoi', 'chepTay', 'sauNut'];
  const bang = CHU_DICH?.chep_tin_mo_chat_oa;
  const loiBang = [];
  if (!bang) loiBang.push('không có CHU_DICH.chep_tin_mo_chat_oa');
  else {
    const thua = Object.keys(bang).filter(k => !KHOA.includes(k));
    if (thua.length || KHOA.some(k => !bang[k])) loiBang.push(`khóa lệch: thiếu ${KHOA.filter(k => !bang[k]).join(', ')} thừa ${thua.join(', ')}`);
    for (const k of KHOA) for (const nn of NGON_NGU) {
      const cau = bang[k]?.[nn];
      if (typeof cau !== 'string' || !cau.trim()) { loiBang.push(`${k}.${nn} rỗng`); continue; }
      const cam = timChuoiCam(cau);
      if (cam.length) loiBang.push(`${k}.${nn} chữ cấm «${cam.map(c => c.tim_thay).join(', ')}»`);
      if (/thành công|success|성공|đã đặt|đã gửi đơn|đã xác nhận|quán báo giá|mã đơn|order (code|number)|주문 번호|[[\]]/iu.test(cau)) loiBang.push(`${k}.${nn} hứa / chữ bỏ: ${cau}`);
      if (nn !== 'vi' && CHU_VIET.test(cau)) loiBang.push(`${k}.${nn} còn dấu tiếng Việt: ${cau}`);
    }
  }
  ok('CHU_DICH đủ vi, en, ko cho mọi khóa; không chữ cấm, không "thành công / success / 성공"; en, ko không dấu tiếng Việt',
     loiBang.length === 0, loiBang.join(' | '));
  ok('Chữ của bước gửi đúng bản thiết kế (mục 3.2): nút xem đơn, nút mở chat, nút chép ở ba thứ tiếng',
     bang?.nutXemDon?.vi === 'Xem đơn và gửi qua Zalo' && bang?.nutXemDon?.en === 'Review and send on Zalo'
       && bang?.nutXemDon?.ko === '주문 확인 후 Zalo로 보내기' && bang?.nutGui?.vi === 'Mở chat Zalo với Beeftown'
       && bang?.nutChep?.vi === 'Chép đơn' && bang?.daChep?.en === 'Order copied.',
     JSON.stringify(bang?.nutXemDon));
  ok('Câu "Đã chép" chỉ nói đã chép, câu sau nút nói quán chỉ nhận đơn khi khách gửi tin (đúng sự thật, không hứa đã nhận)',
     /chỉ nhận đơn khi bạn gửi tin/.test(bang?.sauNut?.vi ?? '') && /only get your order once you send it/.test(bang?.sauNut?.en ?? '')
       && !/nhận đơn|đơn đã/.test(bang?.daChep?.vi ?? 'x'));

  const ma = readFileSync(TEP_DICH, 'utf8');
  const dongNap = [...ma.matchAll(/^\s*(?:import|export)\b[^;]*?\bfrom\s+['"][^'"]+['"]/gmu)].map(m => m[0].trim());
  const napThat = dongNap.filter(d => !/^(?:import|export)\s+type\b/.test(d));
  ok('dich-dat-hang.ts chỉ có import type (chạy được trong trình duyệt)',
     dongNap.length >= 1 && napThat.length === 0 && !/import\s*\(/.test(ma) && !/supabase/i.test(ma.replace(/\/\*[\s\S]*?\*\//g, '')),
     napThat.join(' | '));
  ok('dich-dat-hang.ts không đọc đồng hồ, không DOM, không mạng',
     !/\bDate\.now\b|new Date\b|\bdocument\.|\bwindow\.|\bfetch\(|\blocalStorage\b/.test(ma.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')));
  // Chú thích đầu file, bỏ dấu " * " đầu dòng để câu xuống dòng vẫn đọc liền.
  const dau = (ma.match(/^\/\*\*[\s\S]*?\*\//)?.[0] ?? '').replace(/\n\s*\*(?!\/)\s?/g, ' ');
  const thieuDau = [
    ['26/10/2026', /26\/10\/2026/], ['câu của Khánh', /Mốt đổi Mini App link trực tiếp đặt chứ không gửi tin nhắn nữa/],
    ['TẠM', /TẠM/], ['Mini App ID', /2858300068641327950/], ['cach mini_app', /'mini_app'/], ['getRouteParams', /getRouteParams/],
    ['linkGuiDon dựng link từ giỏ', /linkGuiDon/], ['coBuocChep = false', /coBuocChep\s*=\s*false/],
    ['sửa kiểm thử của file này', /crm\/test\/test-cong-khai-mua-thit-dieu-huong\.mjs/],
    ['chữ khác còn nhắc gửi tin', /moTaMuaThit/], ['trang quyền riêng tư, xóa dữ liệu', /quyền\s+riêng\s+tư[\s\S]*xóa\s+dữ\s+liệu/],
    ['hướng dẫn trực OA', /web\/README\.md/], ['script đọc data-dich', /data-dich/],
    ['mẫu trùng la_link_zalo_oa()', /la_link_zalo_oa\(\)/],
  ].filter(([, re]) => !re.test(dau)).map(([ten]) => ten);
  ok('Chú thích đầu file ghi quyết định 26/10/2026, Mini App ID 2858300068641327950 và danh sách việc của PR đổi sang Mini App',
     dau.length > 0 && thieuDau.length === 0, `thiếu: ${thieuDau.join(', ')}`);
});

// ===========================================================================
await nhom('2 · MỘT TRẠNG THÁI — muaThitVeMo', async () => {
  if (!dichDatHangLib) { ok('muaThitVeMo có trong web/src/lib/dich-dat-hang.ts', false, CHUA_CO_DICH); return; }
  const CONG_TAC = [null, false, true];
  const LINK = [null, 'http://zalo.me/beeftown', 'https://www.facebook.com/beeftown', LINK_OA];
  const sai = [];
  for (const bat of CONG_TAC) for (const link of LINK) {
    const mong = bat === true && link === LINK_OA;
    const that = muaThitVeMo(nd({ hien_mua_thit_ve: bat, zalo_oa_url: link }));
    if (that !== mong) sai.push(`(${bat}, ${link}) → ${that}`);
  }
  ok('muaThitVeMo: bảng chân trị — hien_mua_thit_ve null / false / true × zalo_oa_url null / http / máy chủ khác / hợp lệ; chỉ (true, hợp lệ) cho true',
     sai.length === 0, sai.join(' · '));
  ok('Chưa nối database (CI): muaThitVeMo(bản nền) = false', muaThitVeMo(NEN) === false);
  ok('Công tắc là giá trị database tính, không đoán: chuỗi "true" hay số 1 không mở trang',
     muaThitVeMo(nd({ hien_mua_thit_ve: 'true', zalo_oa_url: LINK_OA })) === false
       && muaThitVeMo(nd({ hien_mua_thit_ve: 1, zalo_oa_url: LINK_OA })) === false);
});

// ===========================================================================
await nhom('3 · ĐIỀU HƯỚNG (vi, en, ko)', async () => {
  const MO = nd({ hien_mua_thit_ve: true, zalo_oa_url: LINK_OA });
  for (const nn of NGON_NGU) {
    const t = chu(nn);
    const bonMuc = dieuHuong(nn);
    const gon = ds => JSON.stringify(ds.map(m => [m.url, m.chu, m.duong]));
    const chuaMo = [NEN, nd({ hien_mua_thit_ve: true }), nd({ hien_mua_thit_ve: false, zalo_oa_url: LINK_OA }),
      nd({ hien_mua_thit_ve: true, zalo_oa_url: 'http://zalo.me/beeftown' })].map(x => dieuHuong(nn, x));
    ok(`[${nn}] Không nd hoặc trang chưa mở: bốn mục như cũ`,
       bonMuc.length === 4 && chuaMo.every(ds => gon(ds) === gon(bonMuc)), chuaMo.map(gon).join(' | '));

    const nam = dieuHuong(nn, MO);
    const duong = duongDanTuongUng('/mua-thit-ve', nn);
    const muc = nam[2];
    ok(`[${nn}] Trang mở: năm mục, ${t.muaThitVe} ngay sau ${t.thucDon}, dẫn tới đường dẫn đúng thứ tiếng (${duong})`,
       nam.length === 5 && nam[1]?.chu === t.thucDon && muc?.chu === t.muaThitVe && muc?.url === duong && muc?.duong === duong
         && gon(nam.filter(m => m !== muc)) === gon(bonMuc)
         && (nn === 'vi' ? duong === '/mua-thit-ve' : duong === `/${nn}/buy-meat`),
       gon(nam));
    ok(`[${nn}] Trang mở: mục cuối vẫn là ${t.datBan}`, nam.at(-1)?.chu === t.datBan && nam.at(-1)?.duong === duongDanTuongUng('/dat-ban', nn),
       nam.at(-1)?.chu);
  }
  const dau = doc('web/src/components/DauTrang.astro');
  const chan = doc('web/src/components/ChanTrang.astro');
  // Chỉ lời gọi thật (đứng sau dấu =), không tính chữ "dieuHuong()" trong chú thích.
  const goi = s => [...s.matchAll(/=\s*dieuHuong\(([^)]*)\)/g)].map(m => m[1].replace(/\s+/g, ''));
  ok('DauTrang.astro và ChanTrang.astro gọi dieuHuong(ngonNgu, nd)',
     [dau, chan].every(s => goi(s).length === 1 && goi(s)[0] === 'ngonNgu,nd'), JSON.stringify([goi(dau), goi(chan)]));
  ok('Đầu trang chọn nút đỏ theo đường dẫn Hỏi bàn (thêm mục không đổi nút đỏ)',
     /muc\.find\(m => m\.duong === duongHoiBan\)/.test(dau));
});

// ===========================================================================
await nhom('4 · ĐƯỜNG DẪN, VỎ TRANG', async () => {
  const i = CAP_DUONG_DAN.findIndex(c => c[0] === '/thuc-don');
  ok('CAP_DUONG_DAN có dòng /mua-thit-ve, /en/buy-meat, /ko/buy-meat ngay sau /thuc-don',
     i >= 0 && JSON.stringify(CAP_DUONG_DAN[i + 1]) === JSON.stringify(['/mua-thit-ve', '/en/buy-meat', '/ko/buy-meat']),
     JSON.stringify(CAP_DUONG_DAN[i + 1]));
  ok('Đổi ngôn ngữ trên trang Mua thịt về đi đúng trang (không về trang chủ)',
     duongDanTuongUng('/mua-thit-ve', 'en') === '/en/buy-meat' && duongDanTuongUng('/en/buy-meat', 'ko') === '/ko/buy-meat'
       && duongDanTuongUng('/ko/buy-meat/', 'vi') === '/mua-thit-ve');

  const VO = [
    ['vi', 'web/src/pages/mua-thit-ve.astro', '/mua-thit-ve', 'Mua thịt về — Beeftown', '../'],
    ['en', 'web/src/pages/en/buy-meat.astro', '/en/buy-meat', 'Beef to take home — Beeftown', '../../'],
    ['ko', 'web/src/pages/ko/buy-meat.astro', '/ko/buy-meat', '소고기 포장 구매 — Beeftown', '../../'],
  ];
  const coFile = VO.filter(([, f]) => existsSync(join(GOC, f)));
  ok('Ba file vỏ có thật', coFile.length === 3, VO.filter(v => !coFile.includes(v)).map(v => v[1]).join(', '));
  if (coFile.length !== 3) return;

  const loiSongSong = [], loiTrangThai = [], loiTieuDe = [], loiNap = [];
  for (const [nn, f, duong, tieuDe, len] of VO) {
    const s = doc(f);
    const q = `'${nn}'`;
    if (!s.includes(`await Promise.all([docNoiDung(${q}), docMuaThitVe(${q})])`)
      || (s.match(/ngonNgu="([a-z]+)"/g) ?? []).some(x => x !== `ngonNgu="${nn}"`)
      || (s.match(new RegExp(`duongDan="${duong.replace(/\//g, '\\/')}"`, 'g')) ?? []).length !== 2
      || /duongDan=\{/.test(s)) loiSongSong.push(f);
    if (!/const trangThai = trangThaiMuaThit\(muaThitVeMo\(noiDung\), menu\);/.test(s)
      || !s.includes(`moTa={moTaTrangMuaThit(${q}, trangThai === 'mo' || trangThai === 'het_quay')}`)
      || !/<TrangMuaThitVe ngonNgu="[a-z]+" noiDung=\{noiDung\} menu=\{menu\} trangThai=\{trangThai\}\s+thamSo=\{\[\.\.\.Astro\.url\.searchParams\]\} duongDan="[^"]+" \/>/.test(s)) loiTrangThai.push(f);
    if (!s.includes(`tieuDe="${tieuDe}"`)) loiTieuDe.push(`${f}: ${s.match(/tieuDe="[^"]*"/)?.[0]}`);
    const mongNap = [`import Trang from '${len}layouts/Trang.astro';`, `import TrangMuaThitVe from '${len}components/TrangMuaThitVe.astro';`,
      `import { docNoiDung } from '${len}lib/noi-dung';`, `import { docMuaThitVe, trangThaiMuaThit } from '${len}lib/mua-thit-ve';`,
      `import { muaThitVeMo } from '${len}lib/dich-dat-hang';`, `import { moTaTrangMuaThit } from '${len}lib/trang-cong-khai';`];
    if (mongNap.some(d => !s.includes(d))) loiNap.push(`${f}: thiếu ${mongNap.filter(d => !s.includes(d)).join(' ')}`);
  }
  ok('Ba file vỏ đọc docNoiDung và docMuaThitVe song song (Promise.all), đúng thứ tiếng, duongDan là chuỗi cố định',
     loiSongSong.length === 0, loiSongSong.join(', '));
  ok('Ba file vỏ tính trạng thái bằng trangThaiMuaThit(muaThitVeMo(noiDung), menu); mô tả mở khi mo hoặc het_quay',
     loiTrangThai.length === 0, loiTrangThai.join(', '));
  ok('Tiêu đề ba file đúng chữ', loiTieuDe.length === 0, loiTieuDe.join(' | '));
  ok('Ba file vỏ nạp đúng sáu thứ, đúng đường dẫn tương đối của thư mục', loiNap.length === 0, loiNap.join(' | '));

  const MOI = ['web/src/lib/dich-dat-hang.ts', ...VO.map(v => v[1]), 'crm/test/test-cong-khai-mua-thit-dieu-huong.mjs'];
  const thay = execFileSync('git', ['ls-files', '-co', '--exclude-standard', ...MOI], { cwd: GOC, encoding: 'utf8' });
  ok('File mới của phần này không bị .gitignore chặn', MOI.every(f => thay.includes(f)), MOI.filter(f => !thay.includes(f)).join(', '));
});

// ===========================================================================
await nhom('5 · MÔ TẢ TRANG', async () => {
  const MONG = {
    muaThitVe: { vi: 'Mua thịt về', en: 'Take home', ko: '포장 구매' },
    moTaMuaThit: {
      vi: 'Thịt bò của quầy Beeftown chia gói để mang về. Chọn gói trên web, gửi đơn qua Zalo; quán xác nhận tổng tiền và giờ nhận.',
      en: 'Beef from the Beeftown counter in packs to take home. Choose your packs here and send the order on Zalo; we confirm the total and the time.',
      ko: 'Beeftown 매장의 소고기를 팩으로 포장해 가세요. 여기서 팩을 고르고 Zalo로 주문을 보내 주시면 총액과 받으실 시간을 확인해 드려요.',
    },
    moTaMuaThitChuaMo: {
      vi: 'Beeftown chưa mở mua thịt về qua website.',
      en: 'Take-home orders on the Beeftown website are not open yet.',
      ko: 'Beeftown 웹사이트의 포장 구매는 아직 열리지 않았어요.',
    },
  };
  const HUA = { vi: /gửi đơn|Zalo/iu, en: /\bsend\b|Zalo/iu, ko: /보내|Zalo/iu };
  for (const nn of NGON_NGU) {
    const t = chu(nn);
    ok(`[${nn}] moTaTrangMuaThit(nn, true) = t.moTaMuaThit; (nn, false) = t.moTaMuaThitChuaMo`,
       typeof moTaTrangMuaThit === 'function' && !!t.moTaMuaThit && moTaTrangMuaThit(nn, true) === t.moTaMuaThit
         && moTaTrangMuaThit(nn, false) === t.moTaMuaThitChuaMo && t.moTaMuaThit !== t.moTaMuaThitChuaMo);
    ok(`[${nn}] Ba câu đúng chữ bản thiết kế (mục 3.1)`,
       Object.entries(MONG).every(([k, ba]) => t[k] === ba[nn]),
       Object.keys(MONG).filter(k => t[k] !== MONG[k][nn]).map(k => `${k}: ${t[k]}`).join(' | '));
    ok(`[${nn}] Câu chưa mở không hứa: ${String(HUA[nn])} không có`, !!t.moTaMuaThitChuaMo && !HUA[nn].test(t.moTaMuaThitChuaMo),
       t.moTaMuaThitChuaMo);
    const cam = ['muaThitVe', 'moTaMuaThit', 'moTaMuaThitChuaMo'].flatMap(k => timChuoiCam(t[k] ?? '').map(c => `${k}: ${c.tim_thay}`));
    ok(`[${nn}] Không chữ cấm trong ba câu`, cam.length === 0, cam.join(' | '));
  }
  ok('t.muaThitVe đúng "Mua thịt về" / "Take home" / "포장 구매"',
     NGON_NGU.every(nn => chu(nn).muaThitVe === MONG.muaThitVe[nn]));
});

// ===========================================================================
await nhom('6 · QUYỀN RIÊNG TƯ, XÓA DỮ LIỆU', async () => {
  const RIENG_TU = [
    ['vi', 'web/src/pages/quyen-rieng-tu.astro', 'Khi bạn gửi đơn mua thịt qua Zalo', 'Dùng để làm gì', /Ngoài Supabase[^<]*/u,
      /lên máy chủ[^.]*qua địa chỉ trang/u, /không kèm thông tin cá nhân/u, /không lưu đơn/u],
    ['en', 'web/src/pages/en/privacy.astro', 'When you send a take-home order on Zalo', 'What we use it for', /Apart\s+from Supabase[^<]*/u,
      /server[^.]*through the page address/u, /no personal (?:information|details)/u, /(?:does not|do not) (?:store|keep) (?:your )?orders?/u],
    ['ko', 'web/src/pages/ko/privacy.astro', 'Zalo로 포장 구매 주문을 보내실 때', '이용 목적', /Supabase\s+외에[^<]*/u,
      /페이지\s*주소[^.]*서버/u, /개인정보는\s*(?:들어\s*있지\s*않|포함되지\s*않)/u, /주문을\s*저장하지\s*않/u],
  ];
  const loiMuc = [], loiCau = [], loiNgoai = [];
  for (const [nn, f, tieuDe, sau, ngoai, len, khongKem, khongLuu] of RIENG_TU) {
    const s = doc(f);
    const iMuc = s.indexOf(`<h2>${tieuDe}</h2>`);
    const iMess = s.search(/<h2>[^<]*Messenger[^<]*<\/h2>/u);
    const iSau = s.indexOf(`<h2>${sau}</h2>`);
    if (iMuc < 0 || !(iMess >= 0 && iMess < iMuc && iMuc < iSau)) loiMuc.push(`${nn}: mục ở ${iMuc}, Messenger ${iMess}, ${sau} ${iSau}`);
    const muc = iMuc >= 0 ? s.slice(iMuc, s.indexOf('<h2>', iMuc + 4)).replace(/\s+/g, ' ') : '';
    if (/soạn ngay trên máy|on your device|기기에서/iu.test(s)) loiCau.push(`${nn}: còn câu "soạn ngay trên máy"`);
    if (!len.test(muc) || !khongKem.test(muc) || !khongLuu.test(muc) || !/Zalo/.test(muc)) {
      loiCau.push(`${nn}: thiếu ý ${[len, khongKem, khongLuu].filter(re => !re.test(muc)).map(String).join(' ')}`);
    }
    const cauNgoai = s.replace(/\s+/g, ' ').match(ngoai)?.[0] ?? '';
    if (!/Zalo/.test(cauNgoai) || !/Messenger/.test(cauNgoai)) loiNgoai.push(`${nn}: ${cauNgoai.slice(0, 160)}`);
    const cam = timChuoiCam(muc);
    if (cam.length) loiCau.push(`${nn}: chữ cấm ${cam.map(c => c.tim_thay).join(', ')}`);
  }
  ok('Ba trang quyền riêng tư có mục tin đơn qua Zalo ngay sau mục Messenger', loiMuc.length === 0, loiMuc.join(' | '));
  ok('Ba trang quyền riêng tư có mục tin đơn qua Zalo; không câu "soạn ngay trên máy" / "on your device" / "기기에서"; có ý gói đã chọn đi lên máy chủ qua địa chỉ trang, không kèm thông tin cá nhân',
     loiCau.length === 0, loiCau.join(' | '));
  ok('Câu "Ngoài Supabase…" ở cả ba bản nhắc Zalo', loiNgoai.length === 0, loiNgoai.join(' | '));

  const XOA = [
    ['vi', 'web/src/pages/xoa-du-lieu.astro', 'Tin đơn mua thịt gửi qua Zalo', /Website không lưu đơn mua thịt/u],
    ['en', 'web/src/pages/en/data-deletion.astro', 'Take-home order messages sent on Zalo', /website does not store take-home orders/iu],
    ['ko', 'web/src/pages/ko/data-deletion.astro', 'Zalo로 보내신 포장 구매 주문 메시지', /웹사이트는\s*포장\s*구매\s*주문을\s*저장하지\s*않/u],
  ];
  const loiXoa = [];
  for (const [nn, f, tieuDe, khongLuu] of XOA) {
    const s = doc(f);
    const iMuc = s.indexOf(`<h2>${tieuDe}</h2>`);
    const iMess = s.search(/<h2>[^<]*Messenger[^<]*<\/h2>/u);
    const muc = iMuc >= 0 ? s.slice(iMuc, s.indexOf('<h2>', iMuc + 4)).replace(/\s+/g, ' ') : '';
    if (iMuc < 0 || iMess < 0 || iMess > iMuc || !khongLuu.test(muc) || !/Zalo/.test(muc.slice(tieuDe.length + 9))) {
      loiXoa.push(`${nn}: mục ở ${iMuc}, Messenger ở ${iMess}, ${muc.slice(0, 120)}`);
    }
    const cam = timChuoiCam(muc);
    if (cam.length) loiXoa.push(`${nn}: chữ cấm ${cam.map(c => c.tim_thay).join(', ')}`);
  }
  ok('Ba trang xóa dữ liệu có mục tin đơn mua thịt', loiXoa.length === 0, loiXoa.join(' | '));
});

process.exit(ketThuc('MUA THỊT VỀ: ĐÍCH ĐẶT HÀNG, ĐIỀU HƯỚNG, VỎ TRANG, QUYỀN RIÊNG TƯ'));
