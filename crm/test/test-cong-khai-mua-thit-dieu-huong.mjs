/**
 * BEEFTOWN — TRANG MUA THỊT VỀ: ĐÍCH ĐẶT HÀNG, MỘT TRẠNG THÁI, ĐIỀU HƯỚNG, VỎ TRANG, QUYỀN RIÊNG TƯ
 * ==================================================================================================
 *
 *     node test/test-cong-khai-mua-thit-dieu-huong.mjs
 *
 * Phần của trang Mua thịt về nằm NGOÀI hai component. Từ 0113 (Khánh 03/11/2026: "đã lên website rồi thì cần gì
 * Zalo OA", "chỉ giao tận nơi") khách đặt thẳng trên website:
 *
 *   1. web/src/lib/dich-dat-hang.ts còn hai việc: mẫu link Zalo OA (laLinkZaloOa — cùng mẫu la_link_zalo_oa() của
 *      0101, link liên hệ chỉ chủ đổi được) và muaThitVeMo. Không còn đích đặt hàng, link gửi đơn, chữ bước gửi.
 *      File chỉ có import type.
 *   2. Một trạng thái: muaThitVeMo(nd) đúng khi và chỉ khi công tắc HIỆU LỰC của database (nd.hien_mua_thit_ve) là
 *      true — link Zalo không còn là điều kiện.
 *   3. Điều hướng: bốn mục như cũ khi chưa có database hay trang chưa mở; năm mục khi mở — "Mua thịt về"
 *      ngay sau "Thực đơn", mục cuối vẫn là "Hỏi bàn". Đầu trang và chân trang đưa nd vào dieuHuong.
 *   4. Đường dẫn và ba file vỏ: dòng CAP_DUONG_DAN ngay sau /thuc-don; vỏ nhận POST đặt hàng (xuLyDatHang) trước khi
 *      đọc gì, đọc nội dung và menu song song, tính trạng thái bằng trangThaiMuaThit(muaThitVeMo(noiDung), menu).
 *   5. Mô tả trang: giao tận nơi, đặt trên web, quán gọi xác nhận; câu "chưa mở" không hứa gì.
 *   6. Quyền riêng tư, xóa dữ liệu: nói đúng dữ liệu đơn lưu gì (họ tên, số điện thoại, địa chỉ, ghi chú, gói),
 *      ai đọc, không thu tiền; IP chỉ để chặn gửi quá nhiều; không còn câu "tin đơn qua Zalo".
 *
 * Phần trong component: test-cong-khai-mua-thit-ve.mjs. Lib đơn và menu: test-mua-thit-ve-web.mjs. Gửi đơn:
 * test-mua-thit-dat-hang-web.mjs. Database: test-mua-thit-ve.mjs, test-mua-thit-dat-hang.mjs.
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

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — MUA THỊT VỀ: TRANG MỞ, ĐIỀU HƯỚNG, VỎ TRANG, QUYỀN RIÊNG TƯ');

const { chu, duongDanTuongUng, CAP_DUONG_DAN, NGON_NGU } = await nap('chu.ts');
const { dieuHuong, moTaTrangMuaThit } = await nap('trang-cong-khai.ts');
const { docNoiDung } = await nap('noi-dung.ts');
const { timChuoiCam } = await nap('chuoi-cam.js');
// File của bước 1 chưa có thì từng nhóm đỏ với lý do rõ, không đổ cả file.
const TEP_DICH = join(LIB, 'dich-dat-hang.ts');
const dichDatHangLib = existsSync(TEP_DICH) ? await nap('dich-dat-hang.ts') : null;
const { laLinkZaloOa, MAU_LINK_ZALO_OA, muaThitVeMo } = dichDatHangLib ?? {};
const CHUA_CO_DICH = 'chưa có web/src/lib/dich-dat-hang.ts';

// Bản nền đúng như trang thấy khi chưa nối database: mọi khóa null.
const NEN = await docNoiDung('vi', null);
const nd = (them = {}) => ({ ...NEN, ...structuredClone(them) });
const LINK_OA = 'https://zalo.me/3030027075662095415';
// Chữ chỉ tiếng Việt mới có (en / ko không được có): nguyên âm mang dấu và đ.
const CHU_VIET = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/iu;

// ===========================================================================
await nhom('1 · MẪU LINK ZALO OA, KHÔNG CÒN ĐÍCH ĐẶT HÀNG (web/src/lib/dich-dat-hang.ts)', async () => {
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

  ok('dich-dat-hang.ts không còn đích đặt hàng: không dichDatHang, linkGuiDon, CHU_DICH (0113: đơn ghi thẳng vào database)',
     ['dichDatHang', 'linkGuiDon', 'CHU_DICH'].every(k => !(k in dichDatHangLib))
       && Object.keys(dichDatHangLib).sort().join() === 'MAU_LINK_ZALO_OA,laLinkZaloOa,muaThitVeMo', Object.keys(dichDatHangLib).join(', '));

  const ma = readFileSync(TEP_DICH, 'utf8');
  const dongNap = [...ma.matchAll(/^\s*(?:import|export)\b[^;]*?\bfrom\s+['"][^'"]+['"]/gmu)].map(m => m[0].trim());
  const napThat = dongNap.filter(d => !/^(?:import|export)\s+type\b/.test(d));
  ok('dich-dat-hang.ts chỉ có import type', dongNap.length >= 1 && napThat.length === 0 && !/import\s*\(/.test(ma), napThat.join(' | '));
  ok('dich-dat-hang.ts không đọc đồng hồ, không DOM, không mạng',
     !/\bDate\.now\b|new Date\b|\bdocument\.|\bwindow\.|\bfetch\(|\blocalStorage\b/.test(ma.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')));
  const dau = (ma.match(/^\/\*\*[\s\S]*?\*\//)?.[0] ?? '').replace(/\n\s*\*(?!\/)\s?/g, ' ');
  ok('Chú thích đầu file ghi quyết định 03/11/2026 và vì sao tên file còn giữ', /03\/11\/2026/.test(dau) && /0113/.test(dau) && /Tên file giữ/.test(dau), dau.slice(0, 200));
});

// ===========================================================================
await nhom('2 · MỘT TRẠNG THÁI — muaThitVeMo', async () => {
  if (!dichDatHangLib) { ok('muaThitVeMo có trong web/src/lib/dich-dat-hang.ts', false, CHUA_CO_DICH); return; }
  const CONG_TAC = [null, false, true];
  const LINK = [null, 'http://zalo.me/beeftown', 'https://www.facebook.com/beeftown', LINK_OA];
  const sai = [];
  for (const bat of CONG_TAC) for (const link of LINK) {
    const mong = bat === true;   // 0113: link Zalo không còn là điều kiện
    const that = muaThitVeMo(nd({ hien_mua_thit_ve: bat, zalo_oa_url: link }));
    if (that !== mong) sai.push(`(${bat}, ${link}) → ${that}`);
  }
  ok('muaThitVeMo: bảng chân trị — hien_mua_thit_ve null / false / true × zalo_oa_url null / http / máy chủ khác / hợp lệ; true khi và chỉ khi công tắc hiệu lực true (0113)',
     sai.length === 0, sai.join(' · '));
  ok('Chưa nối database (CI): muaThitVeMo(bản nền) = false', muaThitVeMo(NEN) === false);
  ok('Công tắc là giá trị database tính, không đoán: chuỗi "true" hay số 1 không mở trang',
     muaThitVeMo(nd({ hien_mua_thit_ve: 'true', zalo_oa_url: LINK_OA })) === false
       && muaThitVeMo(nd({ hien_mua_thit_ve: 1, zalo_oa_url: LINK_OA })) === false);
});

// ===========================================================================
await nhom('3 · ĐIỀU HƯỚNG (vi, en, ko)', async () => {
  const MO = nd({ hien_mua_thit_ve: true });   // 0113: mở dù chưa công bố link Zalo
  for (const nn of NGON_NGU) {
    const t = chu(nn);
    const bonMuc = dieuHuong(nn);
    const gon = ds => JSON.stringify(ds.map(m => [m.url, m.chu, m.duong]));
    const chuaMo = [NEN, nd({ hien_mua_thit_ve: null, zalo_oa_url: LINK_OA }), nd({ hien_mua_thit_ve: false, zalo_oa_url: LINK_OA }),
      nd({ hien_mua_thit_ve: 'true' })].map(x => dieuHuong(nn, x));
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

  const loiSongSong = [], loiTrangThai = [], loiTieuDe = [], loiNap = [], loiPost = [];
  for (const [nn, f, duong, tieuDe, len] of VO) {
    const s = doc(f);
    const q = `'${nn}'`;
    if (!s.includes(`await Promise.all([docNoiDung(${q}), docMuaThitVe(${q})])`)
      || (s.match(/ngonNgu="([a-z]+)"/g) ?? []).some(x => x !== `ngonNgu="${nn}"`)
      || (s.match(new RegExp(`duongDan="${duong.replace(/\//g, '\\/')}"`, 'g')) ?? []).length !== 2
      || /duongDan=\{/.test(s)) loiSongSong.push(f);
    if (!/const trangThai = trangThaiMuaThit\(muaThitVeMo\(noiDung\), menu\);/.test(s)
      || !s.includes(`moTa={moTaTrangMuaThit(${q}, trangThai === 'mo' || trangThai === 'het_quay')}`)
      || !s.includes(`const ketQua = ketQuaDatHang(Astro, ${q});`)
      || !/<TrangMuaThitVe ngonNgu="[a-z]+" noiDung=\{noiDung\} menu=\{menu\} trangThai=\{trangThai\} ketQua=\{ketQua\}\s+thamSo=\{\[\.\.\.Astro\.url\.searchParams\]\} duongDan="[^"]+" \/>/.test(s)) loiTrangThai.push(f);
    // POST đặt hàng xử lý TRƯỚC khi đọc nội dung, menu: chuyển hướng 303 về chính trang (lib/xu-ly-form.ts).
    const iPost = s.indexOf(`const chuyenHuong = await xuLyDatHang(Astro, '${duong}', ${q});`);
    if (iPost < 0 || !/if \(chuyenHuong\) return chuyenHuong;/.test(s) || iPost > s.indexOf('await Promise.all')) loiPost.push(f);
    if (!s.includes(`tieuDe="${tieuDe}"`)) loiTieuDe.push(`${f}: ${s.match(/tieuDe="[^"]*"/)?.[0]}`);
    const mongNap = [`import Trang from '${len}layouts/Trang.astro';`, `import TrangMuaThitVe from '${len}components/TrangMuaThitVe.astro';`,
      `import { docNoiDung } from '${len}lib/noi-dung';`, `import { docMuaThitVe, trangThaiMuaThit } from '${len}lib/mua-thit-ve';`,
      `import { muaThitVeMo } from '${len}lib/dich-dat-hang';`, `import { moTaTrangMuaThit } from '${len}lib/trang-cong-khai';`,
      `import { xuLyDatHang, ketQuaDatHang } from '${len}lib/xu-ly-form';`];
    if (mongNap.some(d => !s.includes(d))) loiNap.push(`${f}: thiếu ${mongNap.filter(d => !s.includes(d)).join(' ')}`);
  }
  ok('Ba file vỏ đọc docNoiDung và docMuaThitVe song song (Promise.all), đúng thứ tiếng, duongDan là chuỗi cố định',
     loiSongSong.length === 0, loiSongSong.join(', '));
  ok('Ba file vỏ tính trạng thái bằng trangThaiMuaThit(muaThitVeMo(noiDung), menu); mô tả mở khi mo hoặc het_quay; kết quả lượt đặt qua ketQuaDatHang',
     loiTrangThai.length === 0, loiTrangThai.join(', '));
  ok('Ba file vỏ nhận POST đặt hàng (xuLyDatHang, đúng đường dẫn và thứ tiếng) trước khi đọc nội dung và menu',
     loiPost.length === 0, loiPost.join(', '));
  ok('Tiêu đề ba file đúng chữ', loiTieuDe.length === 0, loiTieuDe.join(' | '));
  ok('Ba file vỏ nạp đúng bảy thứ, đúng đường dẫn tương đối của thư mục', loiNap.length === 0, loiNap.join(' | '));

  const MOI = ['web/src/lib/dich-dat-hang.ts', 'web/src/lib/dat-hang-mua-thit.ts', 'web/src/pages/noi-bo/don-mua-thit.astro',
    ...VO.map(v => v[1]), 'crm/test/test-cong-khai-mua-thit-dieu-huong.mjs'];
  const thay = execFileSync('git', ['ls-files', '-co', '--exclude-standard', ...MOI], { cwd: GOC, encoding: 'utf8' });
  ok('File mới của phần này không bị .gitignore chặn', MOI.every(f => thay.includes(f)), MOI.filter(f => !thay.includes(f)).join(', '));
});

// ===========================================================================
await nhom('5 · MÔ TẢ TRANG', async () => {
  const MONG = {
    muaThitVe: { vi: 'Mua thịt về', en: 'Take home', ko: '포장 구매' },
    moTaMuaThit: {
      vi: 'Thịt bò của quầy Beeftown chia gói, giao tận nơi. Chọn gói và đặt hàng trên web; quán gọi lại xác nhận tổng tiền, phí giao và giờ giao.',
      en: 'Beef from the Beeftown counter in packs, delivered to you. Choose your packs and order here; we call you back to confirm the total, the delivery fee and the time.',
      ko: 'Beeftown 매장의 소고기를 팩으로 배달해 드려요. 여기서 팩을 고르고 주문해 주시면 전화로 총액, 배달비, 배달 시간을 확인해 드려요.',
    },
    moTaMuaThitChuaMo: {
      vi: 'Beeftown chưa mở mua thịt về qua website.',
      en: 'Take-home orders on the Beeftown website are not open yet.',
      ko: 'Beeftown 웹사이트의 포장 구매는 아직 열리지 않았어요.',
    },
  };
  const HUA = { vi: /gửi đơn|đặt hàng|Zalo/iu, en: /\bsend\b|\border\b|Zalo/iu, ko: /보내|주문해|Zalo/iu };
  for (const nn of NGON_NGU) {
    const t = chu(nn);
    ok(`[${nn}] moTaTrangMuaThit(nn, true) = t.moTaMuaThit; (nn, false) = t.moTaMuaThitChuaMo`,
       typeof moTaTrangMuaThit === 'function' && !!t.moTaMuaThit && moTaTrangMuaThit(nn, true) === t.moTaMuaThit
         && moTaTrangMuaThit(nn, false) === t.moTaMuaThitChuaMo && t.moTaMuaThit !== t.moTaMuaThitChuaMo);
    ok(`[${nn}] Ba câu đúng chữ (0113: giao tận nơi, đặt trên web, không còn Zalo)`,
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
    ['vi', 'web/src/pages/quyen-rieng-tu.astro', 'Khi bạn đặt mua thịt về', 'Dùng để làm gì',
      [/họ tên,\s*số điện thoại,\s*địa chỉ giao,\s*ghi chú/u, /chủ nhà hàng,\s*quản lý và thu ngân/u, /không thu tiền/u, /IP[^.]*chặn/u, /15 phút/u]],
    ['en', 'web/src/pages/en/privacy.astro', 'When you order beef to take home', 'What we use it for',
      [/name, phone number, delivery address, note/u, /owner, managers and\s*cashiers/u, /does not take\s*payment/u, /IP address[^.]*block/u, /15 minutes/u]],
    ['ko', 'web/src/pages/ko/privacy.astro', '소고기 포장 주문을 하실 때', '이용 목적',
      [/이름,\s*전화번호,\s*배달 주소,\s*메모/u, /대표,\s*매니저,\s*캐셔/u, /결제하지 않으며/u, /IP 주소[^.]*막는/u, /15분/u]],
  ];
  const loiMuc = [], loiCau = [];
  for (const [nn, f, tieuDe, sau, y] of RIENG_TU) {
    const s = doc(f);
    const iMuc = s.indexOf(`<h2>${tieuDe}</h2>`);
    const iMess = s.search(/<h2>[^<]*Messenger[^<]*<\/h2>/u);
    const iSau = s.indexOf(`<h2>${sau}</h2>`);
    if (iMuc < 0 || !(iMess >= 0 && iMess < iMuc && iMuc < iSau)) loiMuc.push(`${nn}: mục ở ${iMuc}, Messenger ${iMess}, ${sau} ${iSau}`);
    const muc = iMuc >= 0 ? s.slice(iMuc, s.indexOf('<h2>', iMuc + 4)).replace(/\s+/g, ' ').replace(/<\/?strong>/g, '') : '';
    const thieu = y.filter(re => !re.test(muc));
    if (thieu.length) loiCau.push(`${nn}: thiếu ý ${thieu.map(String).join(' ')}`);
    if (/qua Zalo|on Zalo|Zalo로/u.test(muc) || /tin đơn bạn gửi qua Zalo|order messages you send us on Zalo|Zalo로 보내신 주문 메시지/u.test(s)) {
      loiCau.push(`${nn}: còn câu đơn đi qua Zalo`);
    }
    const cam = timChuoiCam(muc);
    if (cam.length) loiCau.push(`${nn}: chữ cấm ${cam.map(c => c.tim_thay).join(', ')}`);
  }
  ok('Ba trang quyền riêng tư có mục đặt mua thịt về ngay sau mục Messenger', loiMuc.length === 0, loiMuc.join(' | '));
  ok('Mục đó nói đủ: lưu họ tên, số điện thoại, địa chỉ, ghi chú; ai đọc; không thu tiền; IP chỉ để chặn; trình duyệt giữ 15 phút; không còn "đơn qua Zalo"',
     loiCau.length === 0, loiCau.join(' | '));

  const XOA = [
    ['vi', 'web/src/pages/xoa-du-lieu.astro', /<h2>[^<]*đơn mua thịt[^<]*<\/h2>/u],
    ['en', 'web/src/pages/en/data-deletion.astro', /<h2>[^<]*take-home orders[^<]*<\/h2>/u],
    ['ko', 'web/src/pages/ko/data-deletion.astro', /<h2>[^<]*포장 주문[^<]*<\/h2>/u],
  ];
  const loiXoa = XOA.filter(([, f, re]) => !re.test(doc(f)) || /Zalo OA/.test(doc(f))).map(([nn]) => nn);
  ok('Ba trang xóa dữ liệu có đơn mua thịt trong mục xóa theo yêu cầu; không còn mục tin đơn qua Zalo', loiXoa.length === 0, loiXoa.join(', '));
});

process.exit(ketThuc('MUA THỊT VỀ: TRANG MỞ, ĐIỀU HƯỚNG, VỎ TRANG, QUYỀN RIÊNG TƯ'));
