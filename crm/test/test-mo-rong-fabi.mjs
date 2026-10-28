/**
 * BEEFTOWN — MỞ RỘNG FABi (mo-rong-fabi/): PHẦN THUẦN, MANIFEST, LUẬT CỦA REPO
 * ============================================================================
 *
 *     node test/test-mo-rong-fabi.mjs
 *
 * Extension Chrome đưa món mới của kho vào hộp thoại "Thêm món từ file" của FABi CMS (README.md của thư mục).
 * File này kiểm phần đọc được bằng Node, không cần trình duyệt:
 *   1. chung.js thuần: đọc dòng "Tổng", lọc mã số, địa chỉ file, phân loại phản hồi của kho, base64, ngôn ngữ.
 *   2. Câu chữ: vi / en đủ cặp; tiếng Anh không lẫn câu Việt (trừ nhãn của chính FABi trong ngoặc kép / ngoặc
 *      đơn); không chữ cấm; chỉ câu "FABi đã lưu" nhắc "Tải lên thành công", và chỉ hiện sau khi FABi tự báo.
 *   3. manifest.json: quyền tối thiểu — host beeftown.vn, content script chỉ fabi.ipos.vn, không trang web nào
 *      gửi tin được cho extension; hai bản ngôn ngữ cùng khóa.
 *   4. Mã của extension: không chèn HTML, không eval, trang FABi không fetch (chỉ service worker), service worker
 *      chỉ nghe tin từ fabi.ipos.vn; extension không bao giờ bấm Lưu của FABi; màu chỉ trong bảng Beeftown.
 *   5. Khớp với kho: đường dẫn route, trần số mã, kiểu .xlsx; CI chạy thử trình duyệt; file không bị .gitignore chặn.
 * Phần chạy trên trang (đọc bảng, mở hộp thoại, đưa file vào, mọi kiểu hỏng) thử trong Chromium thật:
 * mo-rong-fabi/thu/thu-trinh-duyet.mjs (CI: kiem-thu.yml, job database-va-can).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { timChuoiCam } from '../../web/src/lib/chuoi-cam.js';
import { MA_DA_CO_TOI_DA } from '../../web/src/lib/kho/thu-ngan.ts';
import { KIEU_XLSX } from '../../web/src/lib/kho/tep-excel.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — MỞ RỘNG FABi');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MO_RONG = join(GOC, 'mo-rong-fabi');
const doc = p => readFileSync(join(GOC, p), 'utf8');

await import(pathToFileURL(join(MO_RONG, 'chung.js')).href);
const B = globalThis.BeeftownFabi;

// ===========================================================================
await nhom('1 · chung.js THUẦN', async () => {
  ok('Nạp được, đóng băng (trang FABi không sửa được hằng của extension)', !!B && Object.isFrozen(B));
  ok('gon: gom khoảng trắng, xuống dòng, khoảng trắng không ngắt', B.gon('  Mã\n\tmón  ') === 'Mã món' && B.gon(null) === '');
  ok('laTrangDanhSach: đúng /menu/items/items-in-city (kể cả dấu / cuối), không trang khác',
     B.laTrangDanhSach('/menu/items/items-in-city') && B.laTrangDanhSach('/menu/items/items-in-city/')
     && !B.laTrangDanhSach('/menu/items/items-in-store') && !B.laTrangDanhSach('/menu/item/detail') && !B.laTrangDanhSach(''));
  ok('locMaSo: giữ mã toàn số và số 0 đầu, bỏ ITEM-…, mã có dấu cách, mã 17 số, trùng',
     JSON.stringify(B.locMaSo(['01011', ' 01012 ', 'ITEM-HJAE', '01011', '10 11', '1'.repeat(17), '', null, '1013']))
       === '["01011","01012","1013"]');
  const o = x => JSON.stringify(B.docMaO(x));
  ok('docMaO: mã số (kể cả có chữ quanh mã: nhãn, nút sao chép) → mã; mã có chữ → coChu; ô trống, hai mã số, chữ lạ → null (dừng)',
     o('01011') === '{"ma":"01011"}' && o(' 01012\n KG ') === '{"ma":"01012"}' && o('Sao chép 01016') === '{"ma":"01016"}'
     && o('ITEM-HJAE') === '{"coChu":true}' && o('SP-001') === '{"coChu":true}' && o('') === 'null' && o('01011 01012') === 'null'
     && o('—') === 'null' && o('1'.repeat(17)) === 'null');
  ok('docTong: "Tổng: 3 món", "Tổng: 1.234 món", "Tổng:12 món", xuống dòng giữa chữ',
     B.docTong('… Tổng: 3 món') === 3 && B.docTong('Tổng: 1.234 món') === 1234 && B.docTong('Tổng:12 món') === 12
     && B.docTong('Tổng:\n  45\n món') === 45 && B.docTong('Tổng: 1,234 món') === 1234);
  ok('docTong: không có dòng Tổng → null (extension dừng, không đoán)', B.docTong('Món ăn 01011 Steak') === null && B.docTong('') === null);
  const url = new URL(B.taoUrlTep(['01011', '1013']));
  ok('taoUrlTep: https://beeftown.vn/noi-bo/kho/ban-ipos/mon-fabi.xlsx?da_co=01011,1013 (kho đọc lại đúng danh sách)',
     url.origin === 'https://beeftown.vn' && url.pathname === '/noi-bo/kho/ban-ipos/mon-fabi.xlsx'
     && url.searchParams.get('da_co') === '01011,1013' && new URL(B.taoUrlTep([])).searchParams.get('da_co') === '');

  const loai = p => B.phanLoaiPhanHoi(p);
  const TEP_URL = 'https://beeftown.vn/noi-bo/kho/ban-ipos/mon-fabi.xlsx?da_co=1011';
  ok('phanLoaiPhanHoi: chuyển hướng về /noi-bo/dang-nhap / 401 → chua_dang_nhap',
     loai({ status: 200, kieuNoiDung: 'text/html', url: 'https://beeftown.vn/noi-bo/dang-nhap', redirected: true }) === 'chua_dang_nhap'
     && loai({ status: 401, kieuNoiDung: 'text/plain', url: TEP_URL }) === 'chua_dang_nhap' && loai({ type: 'opaqueredirect', status: 0 }) === 'chua_dang_nhap');
  ok('phanLoaiPhanHoi: đã đăng nhập mà bị chuyển sang trang khác (màn máy, màn khóa máy dùng chung) → chuyen_trang, không phải "chưa đăng nhập"',
     loai({ status: 200, kieuNoiDung: 'text/html', url: 'https://beeftown.vn/noi-bo/kho/may', redirected: true }) === 'chuyen_trang'
     && loai({ status: 200, kieuNoiDung: 'text/html', url: 'https://beeftown.vn/noi-bo/kho/khoa', redirected: true }) === 'chuyen_trang');
  ok('phanLoaiPhanHoi: 200 .xlsx → tep; 200 chữ trơn → khong_co_mon_moi; 403 / 400 / 500 / 503 HTML → đúng loại',
     loai({ status: 200, kieuNoiDung: KIEU_XLSX, url: TEP_URL, redirected: false }) === 'tep'
     && loai({ status: 200, kieuNoiDung: 'text/plain; charset=utf-8', url: TEP_URL }) === 'khong_co_mon_moi'
     && loai({ status: 403 }) === 'khong_quyen' && loai({ status: 400 }) === 'sai_yeu_cau' && loai({ status: 500 }) === 'loi_kho'
     && loai({ status: 503, kieuNoiDung: 'text/html' }) === 'loi_kho' && loai({ status: 200, kieuNoiDung: 'text/html' }) === 'loi_kho');
  ok('cauCuaKho: chỉ nhận chữ trơn ngắn, không thẻ HTML (trang quá tải 503 là HTML → bỏ)',
     B.cauCuaKho('text/plain; charset=utf-8', ' Chưa\ntạo file. ') === 'Chưa tạo file.' && B.cauCuaKho('text/html', 'x') === ''
     && B.cauCuaKho('text/plain', '<b>x</b>') === '' && B.cauCuaKho('text/plain', 'a'.repeat(601)) === '');
  ok('laTepZip: "PK\\x03\\x04" mới là .xlsx', B.laTepZip(new Uint8Array([0x50, 0x4b, 3, 4, 9])) && !B.laTepZip(new Uint8Array([0x3c, 0x21, 0x64, 0x6f]))
     && !B.laTepZip(new Uint8Array([0x50, 0x4b])) && !B.laTepZip(null));
  ok('tenTepTuHeader: tên của kho; ký tự lạ thành _; không phải .xlsx → them-mon-fabi.xlsx',
     B.tenTepTuHeader('attachment; filename="them-mon-fabi-cn1-20261028-1200.xlsx"') === 'them-mon-fabi-cn1-20261028-1200.xlsx'
     && B.tenTepTuHeader('attachment; filename="../a b.xlsx"') === '.._a_b.xlsx' && B.tenTepTuHeader('attachment; filename="x.exe"') === 'them-mon-fabi.xlsx'
     && B.tenTepTuHeader(null) === 'them-mon-fabi.xlsx');
  ok('docSoHeader: "2" → 2, "0" → 0; thiếu, âm, chữ → null', B.docSoHeader('2') === 2 && B.docSoHeader('0') === 0
     && B.docSoHeader(null) === null && B.docSoHeader('') === null && B.docSoHeader('-1') === null && B.docSoHeader('2a') === null);
  const ngauNhien = new Uint8Array(100_003).map((_, i) => (i * 7919 + 13) % 256);
  const lai = B.tuBase64(B.sangBase64(ngauNhien));
  ok('base64 qua lại đúng từng byte (file 100 KB, chia khúc 32 KB)', lai.length === ngauNhien.length && lai.every((x, i) => x === ngauNhien[i])
     && B.sangBase64(new Uint8Array([0x50, 0x4b])) === Buffer.from([0x50, 0x4b]).toString('base64'));
  ok('kemKhongGi: câu kho tiếng Việt → đuôi tiếng Việt; câu kho tiếng Anh → đuôi tiếng Anh (không lẫn hai thứ tiếng)',
     B.kemKhongGi('Không đọc được danh sách món cho FABi — chưa tạo file.').endsWith('Chưa có gì được đưa vào FABi.')
     && B.kemKhongGi('Could not read the FABi dish list — no file was created.').endsWith('Nothing has been put into FABi.')
     && B.ngonNguCua('Đã') === 'vi' && B.ngonNguCua('Done') === 'en');
  ok('docChiNhanh: mã hóa URL → mã chi nhánh; thiếu, hỏng, có ký tự lạ → ""',
     B.docChiNhanh('CN1') === 'CN1' && B.docChiNhanh(encodeURIComponent('Hồ Tùng Mậu')) === 'Hồ Tùng Mậu' && B.docChiNhanh(null) === ''
     && B.docChiNhanh('%E0%A4%A') === '' && B.docChiNhanh(encodeURIComponent('<b>')) === '' && B.docChiNhanh('x'.repeat(41)) === '');
  ok('chonNgonNgu: vi, vi-VN → vi; en-US, ko, rỗng → en', B.chonNgonNgu('vi') === 'vi' && B.chonNgonNgu('vi-VN') === 'vi'
     && B.chonNgonNgu('en-US') === 'en' && B.chonNgonNgu('ko-KR') === 'en' && B.chonNgonNgu(undefined) === 'en' && B.chonNgonNgu('vie') === 'en');
});

// ===========================================================================
await nhom('2 · CÂU CHỮ', async () => {
  const khoaVi = Object.keys(B.CAU.vi).sort(), khoaEn = Object.keys(B.CAU.en).sort();
  ok('vi và en cùng bộ khóa, cùng kiểu (chuỗi / hàm)', JSON.stringify(khoaVi) === JSON.stringify(khoaEn)
     && khoaVi.every(k => typeof B.CAU.vi[k] === typeof B.CAU.en[k]), JSON.stringify([khoaVi, khoaEn]));
  const mau = { vi: [], en: [] };
  for (const nn of ['vi', 'en']) {
    for (const [k, v] of Object.entries(B.CAU[nn])) mau[nn].push([k, typeof v === 'function' ? v(2, 1) : v]);
  }
  ok('Câu dạng hàm điền đúng số (không "undefined", không "NaN")', [...mau.vi, ...mau.en].every(([, c]) => !/undefined|NaN/.test(c)));
  // Nhãn của chính FABi (giao diện FABi tiếng Việt) được nhắc trong câu tiếng Anh để người dùng tìm thấy nút.
  const NHAN_FABI = ['Tất cả thành phố', 'Tất cả nhóm món', 'Mã món', 'Tổng: … món', 'Tiện ích', 'Thêm món từ file', 'Lưu', 'Tải lên thành công'];
  const viet = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  const lac = mau.en.filter(([, c]) => viet.test(NHAN_FABI.reduce((s, n) => s.split(n).join(''), c)));
  ok('Câu tiếng Anh không lẫn chữ Việt (trừ nhãn của FABi)', lac.length === 0, JSON.stringify(lac));
  const nhacXong = [...mau.vi, ...mau.en].filter(([, c]) => /thành công|successful|success/i.test(c)).map(([k]) => k);
  ok('Chỉ câu fabiDaLuu nhắc "Tải lên thành công" — câu của chính FABi, không phải extension tự nhận',
     JSON.stringify([...new Set(nhacXong)]) === '["fabiDaLuu"]', JSON.stringify(nhacXong));
  ok('Mọi câu báo dừng / hỏng nói rõ "Chưa có gì được đưa vào FABi"',
     ['dangTim', 'dangLoc', 'khongThayBang', 'khongThayTong', 'chuaDu', 'khongDocMa', 'quaNhieuMa', 'chuaDangNhap', 'chuyenTrang',
      'khongQuyen', 'matMang', 'loiKho', 'tepLa', 'hetChoHopThoai', 'taiLaiTrang'].every(k => {
       const v = B.CAU.vi[k], e = B.CAU.en[k];
       return /Chưa có gì được đưa vào FABi/.test(typeof v === 'function' ? v(1, 2) : v) && /Nothing has been put into FABi/.test(typeof e === 'function' ? e(1, 2) : e);
     }));
  const tep = ['manifest.json', '_locales/vi/messages.json', '_locales/en/messages.json', 'chung.js', 'nen.js', 'trang-fabi.js', 'README.md']
    .map(f => readFileSync(join(MO_RONG, f), 'utf8'));
  const cam = timChuoiCam([...tep, ...mau.vi.map(([, c]) => c), ...mau.en.map(([, c]) => c)].join('\n'));
  ok('Không chữ cấm (web/src/lib/chuoi-cam.js) trong mã, câu, README', cam.length === 0, JSON.stringify(cam));
});

// ===========================================================================
await nhom('3 · manifest.json: QUYỀN TỐI THIỂU', async () => {
  const m = JSON.parse(readFileSync(join(MO_RONG, 'manifest.json'), 'utf8'));
  ok('Manifest V3, phiên bản dạng x.y.z, Chrome ≥ 111', m.manifest_version === 3 && /^\d+\.\d+\.\d+$/.test(m.version) && m.minimum_chrome_version === '111');
  ok('Quyền host duy nhất: https://beeftown.vn/* (lấy file kho bằng phiên đăng nhập)', JSON.stringify(m.host_permissions) === '["https://beeftown.vn/*"]');
  ok('Không xin quyền nào khác (permissions, optional_*), không <all_urls>',
     !('permissions' in m) && !('optional_permissions' in m) && !('optional_host_permissions' in m) && !JSON.stringify(m).includes('<all_urls>'));
  ok('Content script chỉ ở https://fabi.ipos.vn/*, nạp chung.js trước trang-fabi.js',
     m.content_scripts?.length === 1 && JSON.stringify(m.content_scripts[0].matches) === '["https://fabi.ipos.vn/*"]'
     && JSON.stringify(m.content_scripts[0].js) === '["chung.js","trang-fabi.js"]' && !m.content_scripts[0].all_frames);
  ok('Không trang web nào gửi tin hay nhúng tài nguyên extension (không externally_connectable, web_accessible_resources)',
     !('externally_connectable' in m) && !('web_accessible_resources' in m));
  ok('Service worker nen.js', m.background?.service_worker === 'nen.js' && !m.background.type);
  const vi = JSON.parse(readFileSync(join(MO_RONG, '_locales/vi/messages.json'), 'utf8'));
  const en = JSON.parse(readFileSync(join(MO_RONG, '_locales/en/messages.json'), 'utf8'));
  ok('Tên, mô tả vi / en: cùng khóa, mô tả ≤ 132 ký tự (giới hạn của Chrome), mặc định vi',
     m.default_locale === 'vi' && m.name === '__MSG_ten__' && m.description === '__MSG_mo_ta__'
     && JSON.stringify(Object.keys(vi).sort()) === JSON.stringify(Object.keys(en).sort())
     && [vi, en].every(l => l.ten?.message && l.mo_ta?.message && l.mo_ta.message.length <= 132));
});

// ===========================================================================
await nhom('4 · MÃ CỦA EXTENSION', async () => {
  const trang = readFileSync(join(MO_RONG, 'trang-fabi.js'), 'utf8');
  const nen = readFileSync(join(MO_RONG, 'nen.js'), 'utf8');
  const chung = readFileSync(join(MO_RONG, 'chung.js'), 'utf8');
  const tatCa = [trang, nen, chung].join('\n');
  ok('Không chèn HTML, không eval / new Function / setTimeout chuỗi', !/\.innerHTML|\.outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function|setTimeout\(\s*['"`]/.test(tatCa));
  const boChuThich = ma => ma.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok('chung.js thuần: không DOM, không chrome.*, không mạng', !/\bdocument\.|\bwindow\.|\bchrome\.|\bfetch\(|XMLHttpRequest/.test(boChuThich(chung)));
  ok('Trang FABi không tự fetch — chỉ service worker lấy file kho', !/\bfetch\(|XMLHttpRequest/.test(trang) && /chrome\.runtime\.sendMessage\(/.test(trang));
  ok('Service worker: chỉ nghe tin của chính extension từ fabi.ipos.vn, đúng loại tin',
     /nguoiGui\.id !== chrome\.runtime\.id/.test(nen) && /new URL\(url\)\.origin === B\.FABI/.test(nen) && /tin\.loai !== 'lay-tep-mon-moi'/.test(nen));
  ok('Service worker: gửi kèm cookie, theo chuyển hướng rồi xét địa chỉ cuối (redirected, url), không bộ nhớ đệm, có hạn giờ',
     /credentials: 'include'/.test(nen) && /redirect: 'follow'/.test(nen) && /url: phanHoi\.url, redirected: phanHoi\.redirected/.test(nen)
     && /cache: 'no-store'/.test(nen) && /AbortSignal\.timeout\(B\.HET_GIO_KHO_MS\)/.test(nen));
  ok('Service worker: quá MA_DA_CO_TOI_DA mã hoặc địa chỉ quá DIA_CHI_TOI_DA ký tự → báo, không cắt bớt, không gửi',
     /ma\.length > B\.MA_DA_CO_TOI_DA \|\| diaChi\.length > B\.DIA_CHI_TOI_DA\) return \{ kieu: 'qua_nhieu_ma' \}/.test(nen)
     && B.DIA_CHI_TOI_DA <= 8000 && B.taoUrlTep(Array.from({ length: 50 }, (_, i) => String(10000 + i))).length < B.DIA_CHI_TOI_DA);
  ok('Service worker: file không phải zip hoặc quá lớn → không đưa vào FABi', /!B\.laTepZip\(bytes\) \|\| bytes\.length > B\.TEP_TOI_DA_BYTE/.test(nen));
  ok('Extension không bao giờ bấm Lưu của FABi: chỉ bấm "Tiện ích" và "Thêm món từ file"',
     JSON.stringify([...trang.matchAll(/timTheoChu\('[^']*',\s*'([^']+)'\)/g)].map(m => m[1])) === '["Tiện ích","Thêm món từ file"]'
     && (trang.match(/\.click\(\)/g) ?? []).length === 2);
  const thanTheoDoi = /function theoDoiLuu\(lan\) \{[\s\S]*?\n {2}\}\n/.exec(trang)?.[0] ?? '';
  ok('Câu "FABi đã lưu" chỉ hiện trong theoDoiLuu — sau khi trang FABi tự hiện "Tải lên thành công"',
     (trang.match(/C\.fabiDaLuu/g) ?? []).length === (thanTheoDoi.match(/C\.fabiDaLuu/g) ?? []).length && /'Tải lên thành công'/.test(thanTheoDoi)
     && thanTheoDoi.length > 0);
  ok('Bấm đúp: lượt đang chạy thì lượt sau không làm gì', /if \(dangChay\) return;/.test(trang));
  ok('File đưa vào ô của hộp thoại đang hiện (dangHien), không phải ô excel-upload-input đầu tiên của trang',
     /function timHopThoaiNhap\(\) \{\s*for \(const hop of document\.querySelectorAll\('\.modal'\)\) \{\s*if \(!dangHien\(hop\)\) continue;/.test(trang)
     && /hop\.o\.files = goi\.files;/.test(trang) && !/document\.querySelector\('[^']*excel-upload-input/.test(trang));
  const BANG = new Set(['#FFFFFF', '#000000', '#BD0000', '#8F0000', '#E2E2E2', '#F4F4F4', '#555555', '#767676']);
  const ma = [...trang.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map(m => m[0]);
  ok('Màu của khung chỉ trong bảng Beeftown (mã 6 chữ số, viết hoa), không màu trạng thái xanh / vàng',
     ma.length > 0 && ma.every(x => BANG.has(x)) && !/\b(green|yellow|orange|white|black)\b/.test(trang.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')),
     JSON.stringify(ma.filter(x => !BANG.has(x))));
  ok('Nút và liên kết: vùng chạm 48px, vòng focus đen 3px cách 3px, đang làm thì tối đi (aria-busy) chứ không mờ',
     /min-height: 48px/.test(trang) && /outline: 3px solid #000000; outline-offset: 3px/.test(trang)
     && /\.nut\[aria-busy="true"\] \{ background: #8F0000; \}|\.nut:hover, \.nut\[aria-busy="true"\] \{ background: #8F0000; \}/.test(trang) && !/opacity/.test(trang));
  ok('Câu hiện ra đặt bằng textContent (câu của kho là dữ liệu)', /chuBao\.textContent = chu;/.test(trang));
});

// ===========================================================================
await nhom('5 · KHỚP VỚI KHO, CI, .gitignore', async () => {
  ok('Trần số mã của extension = MA_DA_CO_TOI_DA của kho', B.MA_DA_CO_TOI_DA === MA_DA_CO_TOI_DA);
  ok('Kiểu .xlsx của extension = KIEU_XLSX của kho', B.KIEU_XLSX === KIEU_XLSX);
  const route = `web/src/pages${B.DUONG_TEP}.ts`;
  ok(`Route của file có thật: ${route}, đọc da_co`, /searchParams\.get\('da_co'\)/.test(doc(route)));
  ok('Trang đăng nhập kho có thật (middleware mở cho mọi người)', /'\/noi-bo\/dang-nhap'/.test(doc('web/src/middleware.ts')) && B.DUONG_DANG_NHAP === '/noi-bo/dang-nhap');
  const ci = doc('.github/workflows/kiem-thu.yml');
  ok('CI chạy thử extension trong Chromium (kiem-thu.yml)', /node mo-rong-fabi\/thu\/thu-trinh-duyet\.mjs/.test(ci));
  const tep = [];
  const di = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) di(p); else tep.push(relative(GOC, p)); } };
  di(MO_RONG);
  const biChan = tep.filter(f => { try { execFileSync('git', ['check-ignore', '-q', f], { cwd: GOC }); return true; } catch { return false; } });
  ok('Mọi file của mo-rong-fabi/ được git thấy (dòng mở trong .gitignore)', tep.length >= 8 && biChan.length === 0, JSON.stringify(biChan));
});

process.exit(ketThuc('MỞ RỘNG FABi'));
