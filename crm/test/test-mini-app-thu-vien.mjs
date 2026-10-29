/**
 * BEEFTOWN — THƯ VIỆN CỦA MINI APP ZALO (mini-app/package.json, package-lock.json)
 * =================================================================================
 *
 *     node test/test-mini-app-thu-vien.mjs
 *
 * Lỗi đã xảy ra: PR #102 của Dependabot (gộp 26/10/2026) nâng vite 5.4.21 → 8.3.4. zmp-vite-plugin 1.1.6 —
 * bản mới nhất của Zalo — chỉ nhận vite ^4.2.0 || ^5.0.0, @vitejs/plugin-react 4.7.0 nhận tới ^7. Từ đó
 * `npm ci` / `npm install` trong mini-app/ báo ERESOLVE: CI "Mini App Zalo" đỏ trên main, và trên máy
 * Khánh `dua-len-zalo.cmd` dừng ở bước [1/3], không build, không đưa bản thử lên được. CI "Kiểm thử" vẫn xanh
 * vì nó không cài mini-app/ — PR được gộp khi chỉ một workflow đỏ.
 *
 * File này chạy trong `npm test` (CI "Kiểm thử"), không cài mini-app/: chỉ đọc hai file JSON. Bất biến:
 *
 *   1. Mỗi thư viện trực tiếp của mini-app/ (dependencies, devDependencies, optionalDependencies) ghi một
 *      phiên bản cố định, trùng với package-lock.json theo cả hai chiều — không thì `npm ci` từ chối cài.
 *   2. Mỗi gói trong package-lock.json đòi một peer bắt buộc (peerDependencies không ghi optional) thì peer đó
 *      có trong lockfile và phiên bản đang cài nằm trong khoảng gói nhận — điều `npm ci` kiểm khi báo ERESOLVE.
 *      Peer tìm như Node tìm: từ thư mục của gói đi ngược lên (zmp-cli có vite 2.6.14 riêng cho
 *      vite-plugin-replace, không đụng vite 5 của Mini App). Peer tùy chọn không kiểm: npm 11 (Node 24, như CI)
 *      bỏ qua khi lệch — @pmmmwh/react-refresh-webpack-plugin đòi type-fest ^0.13.1 mà cây có 0.21.3; npm 10
 *      (Node 22) thì báo "Missing: type-fest@0.13.1" (mini-app/CLAUDE.md, "Lỗi đã gặp").
 *
 * Không thay được việc cài thật: thư viện mới build hỏng, kiểu hỏng (tsc) thì chỉ CI "Mini App Zalo" thấy.
 * Khoảng phiên bản đọc bằng bộ đọc nhỏ bên dưới (^, ~, >=, >, <=, <, =, x, *, ||, bản trước phát hành), đủ cho
 * mọi khoảng peer đang có. Gặp kiểu chưa đọc được thì ĐỎ kèm khoảng đó — thêm kiểu vào bộ đọc, đừng bỏ qua.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — THƯ VIỆN CỦA MINI APP ZALO');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const docJson = p => JSON.parse(readFileSync(join(GOC, p), 'utf8'));

/** "1.2.3-rc.1" → { so: [1, 2, 3], truoc: 'rc.1' }; "1.2" → { so: [1, 2], ... } (phần thiếu là x). */
function docPhienBan(chu) {
  const m = /^v?(\d+|[xX*])(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(chu);
  if (!m) return null;
  const so = [];
  for (const phan of [m[1], m[2], m[3]]) {
    if (phan === undefined || /^[xX*]$/.test(phan)) break;
    so.push(Number(phan));
  }
  return { so, truoc: m[4] ?? '' };
}

/** So hai đuôi trước phát hành theo từng đoạn cách dấu chấm: đoạn số so theo số (rc.9 < rc.10), số đứng trước chữ. */
function soDuoi(a, b) {
  const x = a.split('.'), y = b.split('.');
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if (x[i] === undefined) return -1;
    if (y[i] === undefined) return 1;
    const soX = /^\d+$/.test(x[i]), soY = /^\d+$/.test(y[i]);
    if (soX && soY) { if (+x[i] !== +y[i]) return +x[i] - +y[i]; }
    else if (soX !== soY) return soX ? -1 : 1;
    else if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  }
  return 0;
}

/** So hai phiên bản đầy đủ: âm, 0, dương. Bản có đuôi trước phát hành (-rc) đứng trước bản không đuôi. */
function so(a, b) {
  for (let i = 0; i < 3; i++) if (a.so[i] !== b.so[i]) return a.so[i] - b.so[i];
  if (a.truoc === b.truoc) return 0;
  if (!a.truoc) return 1;
  if (!b.truoc) return -1;
  return soDuoi(a.truoc, b.truoc);
}

const du = so3 => [0, 1, 2].map(i => so3[i] ?? 0);

/** Một so sánh ("^5.0.0", ">=16.8", "1.x") → danh sách điều kiện [toán tử, phiên bản đầy đủ]; null = không đọc được. */
function docSoSanh(chu) {
  const m = /^(\^|~|>=|<=|>|<|=)?(.*)$/.exec(chu);
  const toan = m[1] ?? '', pb = docPhienBan(m[2]);
  if (!pb) return null;
  const n = pb.so.length, thap = { so: du(pb.so), truoc: pb.truoc };
  if (n === 0) return toan === '' || toan === '=' || toan === '>=' ? [] : null;   // *, x, >=*
  const tang = i => ({ so: du(pb.so.slice(0, i)).map((v, j) => (j === i - 1 ? v + 1 : v)), truoc: '' });
  switch (toan) {
    case '^': {
      // Chữ số khác 0 đầu tiên giữ nguyên: ^1.2.3 <2.0.0, ^0.2.3 <0.3.0, ^0.0.3 <0.0.4; ^0.x <1.0.0.
      const dau = thap.so.findIndex(v => v !== 0);
      const giu = dau === -1 ? n : Math.min(dau + 1, n);
      return [['>=', thap], ['<', tang(giu)]];
    }
    case '~': return [['>=', thap], ['<', tang(n === 1 ? 1 : 2)]];
    case '>=': return [['>=', thap]];
    case '<': return [['<', thap]];
    case '>': return n === 3 ? [['>', thap]] : [['>=', tang(n)]];
    case '<=': return n === 3 ? [['<=', thap]] : [['<', tang(n)]];
    default: return n === 3 ? [['=', thap]] : [['>=', thap], ['<', tang(n)]];   // 1.2.3, =1.2.3, 1.2, 1.x
  }
}

/** Khoảng npm ("^4.2.0 || ^5.0.0", ">= 16.8.0", ">=1 <2") → hàm kiểm một phiên bản; null = không đọc được. */
export function docKhoang(khoang) {
  const cacNhanh = String(khoang).trim().split(/\s*\|\|\s*/);
  const nhanh = [];
  for (const nh of cacNhanh) {
    // ">= 16.8.0" viết cách sau toán tử: ghép lại trước khi tách theo dấu cách.
    const phan = nh.replace(/(\^|~|>=|<=|>|<|=)\s+/g, '$1').split(/\s+/).filter(Boolean);
    if (phan.includes('-')) return null;   // "1.2.3 - 2.3.4": chưa cần, đỏ để thêm
    const dieuKien = [];
    for (const p of phan.length ? phan : ['*']) {
      const d = docSoSanh(p);
      if (!d) return null;
      dieuKien.push(...d);
    }
    nhanh.push(dieuKien);
  }
  return phienBan => {
    const pb = docPhienBan(phienBan);
    if (!pb || pb.so.length !== 3) return false;
    return nhanh.some(dk => dk.every(([toan, moc]) => {
      const c = so(pb, moc);
      return toan === '>=' ? c >= 0 : toan === '>' ? c > 0 : toan === '<' ? c < 0 : toan === '<=' ? c <= 0 : c === 0;
    }) && (!pb.truoc || dk.some(([, moc]) => moc.truoc && so({ ...pb, truoc: '' }, { ...moc, truoc: '' }) === 0)));
  };
}

/** Peer của gói ở `viTri` (khóa trong packages của lockfile) → khóa của bản Node sẽ nạp, hoặc null. */
function timPeer(goi, viTri, ten) {
  let thuMuc = viTri;
  for (;;) {
    const thu = (thuMuc ? thuMuc + '/' : '') + 'node_modules/' + ten;
    if (goi[thu]) return thu;
    if (!thuMuc) return null;
    const cat = thuMuc.lastIndexOf('/node_modules/');
    thuMuc = cat === -1 ? '' : thuMuc.slice(0, cat);
  }
}

/**
 * Mọi vi phạm peer bắt buộc trong cây: { goi, peer, khoang, dangCai } — dangCai null là peer không có trong
 * lockfile; khongDoc: true là bộ đọc chưa hiểu khoảng. Mục không có version (link tới thư mục, bí danh) bỏ qua.
 */
export function viPhamPeer(lock) {
  const goi = lock.packages ?? {};
  const ra = [];
  for (const [viTri, thongTin] of Object.entries(goi)) {
    if (!viTri) continue;
    const tenGoi = viTri.slice(viTri.lastIndexOf('node_modules/') + 'node_modules/'.length);
    for (const [ten, khoang] of Object.entries(thongTin.peerDependencies ?? {})) {
      if (thongTin.peerDependenciesMeta?.[ten]?.optional) continue;
      const noi = timPeer(goi, viTri, ten);
      if (!noi) { ra.push({ goi: tenGoi, peer: ten, khoang, dangCai: null }); continue; }
      const dangCai = goi[noi].version;
      if (!dangCai) continue;
      const khop = docKhoang(khoang);
      if (!khop) ra.push({ goi: tenGoi, peer: ten, khoang, dangCai, khongDoc: true });
      else if (!khop(dangCai)) ra.push({ goi: tenGoi, peer: ten, khoang, dangCai });
    }
  }
  return ra;
}

const moTa = v => `${v.goi} đòi ${v.peer} "${v.khoang}", ` +
  (v.dangCai === null ? 'lockfile không có' : `đang cài ${v.peer}@${v.dangCai}`) +
  (v.khongDoc ? ' (bộ đọc khoảng chưa hiểu kiểu này)' : '');

await nhom('0. Bộ đọc khoảng phiên bản', () => {
  const dung = [
    ['^4.2.0 || ^5.0.0', '5.4.21', true], ['^4.2.0 || ^5.0.0', '8.3.4', false], ['^4.2.0 || ^5.0.0', '4.1.9', false],
    ['^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0', '7.3.7', true], ['^0.152.0', '0.153.0', false], ['^0.152.0', '0.152.4', true],
    ['^0.0.3', '0.0.4', false], ['>= 16.8.0', '18.3.1', true], ['>=16.8', '16.7.9', false], ['~1.2', '1.2.9', true],
    ['~1.2', '1.3.0', false], ['1.x', '1.9.0', true], ['1.x', '2.0.0', false], ['*', '0.0.1', true], ['', '9.9.9', true],
    ['>=1 <2', '1.5.0', true], ['>=1 <2', '2.0.0', false], ['^18.3.1', '18.3.1', true], ['^18.3.1', '19.0.0', false],
    ['^1.0.0', '1.1.0-rc.1', false], ['^1.1.0-rc.0', '1.1.0-rc.1', true], ['^20.19.0 || >=22.12.0', '24.0.0', true],
    ['^1.0.0-rc.10', '1.0.0-rc.9', false], ['^1.0.0-beta.2', '1.0.0-beta.11', true], ['^1.0.0-beta', '1.0.0-beta.1', true],
  ];
  const sai = dung.filter(([k, v, mong]) => docKhoang(k)?.(v) !== mong);
  ok('Bộ đọc khoảng trả đúng cho ^, ~, >=, khoảng có dấu cách, x, *, ||, bản trước phát hành (rc.9 < rc.10)', sai.length === 0,
    sai.map(([k, v, mong]) => `"${k}" với ${v}: mong ${mong}`).join('; '));
  ok('Khoảng chưa hiểu ("1.2.3 - 2.3.4", "latest") trả null để kiểm thử đỏ, không lặng lẽ cho qua',
    docKhoang('1.2.3 - 2.3.4') === null && docKhoang('latest') === null);

  // Đúng lockfile của PR #102: vite 8.3.4 ở gốc, zmp-vite-plugin 1.1.6 đòi ^4.2.0 || ^5.0.0.
  const lockHong = { packages: {
    '': { devDependencies: { vite: '8.3.4', 'zmp-vite-plugin': '1.1.6', 'zmp-cli': '4.0.3' } },
    'node_modules/vite': { version: '8.3.4' },
    'node_modules/zmp-vite-plugin': { version: '1.1.6', peerDependencies: { vite: '^4.2.0 || ^5.0.0' } },
    'node_modules/zmp-cli': { version: '4.0.3' },
    'node_modules/zmp-cli/node_modules/vite': { version: '2.6.14' },
    'node_modules/zmp-cli/node_modules/vite-plugin-replace': { version: '0.1.1', peerDependencies: { vite: '^2' } },
    'node_modules/type-fest': { version: '0.21.3' },
    'node_modules/@pmmmwh/react-refresh-webpack-plugin': { version: '0.5.10', peerDependencies: { 'type-fest': '^0.13.1' },
      peerDependenciesMeta: { 'type-fest': { optional: true } } },
  } };
  const vp = viPhamPeer(lockHong);
  ok('Lockfile kiểu PR #102 (vite 8 ở gốc) bị bắt đúng một lỗi: zmp-vite-plugin đòi vite ^4.2.0 || ^5.0.0',
    vp.length === 1 && vp[0].goi === 'zmp-vite-plugin' && vp[0].dangCai === '8.3.4', vp.map(moTa).join('; '));
  ok('Peer của gói lồng (vite-plugin-replace trong zmp-cli) tìm vite 2.6.14 lồng cạnh nó, không bắt nhầm vite gốc',
    !vp.some(v => v.goi === 'vite-plugin-replace'));
  ok('Peer tùy chọn lệch (type-fest của react-refresh-webpack-plugin) không tính, như npm 11',
    !vp.some(v => v.peer === 'type-fest'));

  // Kiểu PR #100: nâng react 19 mà react-dom còn 18 — peer giữa hai gói không phải vite.
  const vp100 = viPhamPeer({ packages: {
    '': {}, 'node_modules/react': { version: '19.3.1' },
    'node_modules/react-dom': { version: '18.3.1', peerDependencies: { react: '^18.3.1' } },
    'node_modules/zmp-ui': { version: '1.11.14', peerDependencies: { 'zmp-sdk': '^2' } },
    'node_modules/ban-lien-ket': { link: true, resolved: '../ban-lien-ket' },
    'node_modules/dung-lien-ket': { version: '1.0.0', peerDependencies: { 'ban-lien-ket': '^9' } },
  } });
  ok('Kiểu PR #100 bị bắt: react-dom 18.3.1 đòi react ^18.3.1 mà cây có react 19.3.1',
    vp100.some(v => v.goi === 'react-dom' && v.dangCai === '19.3.1'), vp100.map(moTa).join('; '));
  ok('Peer bắt buộc không có trong lockfile bị bắt (npm ci báo "Missing … from lock file")',
    vp100.some(v => v.goi === 'zmp-ui' && v.peer === 'zmp-sdk' && v.dangCai === null), vp100.map(moTa).join('; '));
  ok('Mục link (không có version) không bị báo nhầm', !vp100.some(v => v.peer === 'ban-lien-ket'));
});

await nhom('1. Thư viện trực tiếp ghi phiên bản cố định, trùng package-lock.json', () => {
  const pkg = docJson('mini-app/package.json');
  const lock = docJson('mini-app/package-lock.json');
  const goc = lock.packages?.[''] ?? {};
  for (const loai of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    for (const [ten, pb] of Object.entries(pkg[loai] ?? {})) {
      const daCai = lock.packages?.['node_modules/' + ten]?.version;
      ok(`${ten}: package.json ghi "${pb}", lockfile ghi cùng số và cài đúng bản đó`,
        /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(pb) && goc[loai]?.[ten] === pb && daCai === pb,
        `package.json "${pb}", lockfile gốc "${goc[loai]?.[ten]}", node_modules/${ten} ${daCai}`);
    }
    const thua = Object.keys(goc[loai] ?? {}).filter(ten => !(ten in (pkg[loai] ?? {})));
    ok(`${loai}: lockfile không còn thư viện package.json đã bỏ`, thua.length === 0, thua.join(', '));
  }
});

await nhom('2. Peer bắt buộc trong cả cây khớp — npm ci trong mini-app/ không báo ERESOLVE', () => {
  const vp = viPhamPeer(docJson('mini-app/package-lock.json'));
  ok('HỒI QUY PR #102: vite đang cài nằm trong khoảng zmp-vite-plugin và @vitejs/plugin-react nhận',
    !vp.some(v => v.peer === 'vite'), vp.filter(v => v.peer === 'vite').map(moTa).join('; '));
  ok('Mọi peer bắt buộc khác (react, react-dom, @types/react…) có trong lockfile và khớp khoảng',
    !vp.some(v => v.peer !== 'vite'), vp.filter(v => v.peer !== 'vite').map(moTa).join('; '));
});

process.exit(ketThuc('THƯ VIỆN MINI APP'));
