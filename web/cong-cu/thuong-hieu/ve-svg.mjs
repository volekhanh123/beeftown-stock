// Dựng SVG thành PNG bằng Chromium (Playwright) — tao-bieu-tuong.py gọi để xuất PNG
// (favicon, biểu tượng app, ảnh chia sẻ); cũng dùng tay để xem một logo trên nền nào đó.
//
//   node ve-svg.mjs <vao.svg|vao.html> <ra.png> [rộng] [cao] [--nen=#F4F4F4]
//
// Không có rộng/cao thì lấy theo viewBox của SVG. File HTML thì chụp đúng khung
// rộng × cao đã cho. Không có --nen thì nền trong suốt.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require('/opt/node-tools/node_modules/playwright'); }

const [vao, ra, rongArg, caoArg, ...khac] = process.argv.slice(2);
if (!vao || !ra) {
  console.error('Cách dùng: node ve-svg.mjs <vao.svg|vao.html> <ra.png> [rộng] [cao] [--nen=#màu]');
  process.exit(2);
}
const nen = (khac.find(a => a.startsWith('--nen=')) ?? '').slice(6) || 'transparent';
const laHtml = vao.endsWith('.html');

let rong = Number(rongArg) || 0;
let cao = Number(caoArg) || 0;
if (!laHtml && (!rong || !cao)) {
  const vb = readFileSync(vao, 'utf8').match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
  if (!vb) throw new Error('SVG không có viewBox');
  rong = rong || Math.round(vb[2]);
  cao = cao || Math.round((rong * vb[3]) / vb[2]);
}

const trinhDuyet = await playwright.chromium.launch();
const trang = await trinhDuyet.newPage({ viewport: { width: rong, height: cao }, deviceScaleFactor: 1 });
if (laHtml) {
  await trang.goto(pathToFileURL(resolve(vao)).href);
  await trang.waitForLoadState('networkidle');
} else {
  const svg = readFileSync(vao, 'utf8');
  await trang.setContent(
    `<html><body style="margin:0;background:${nen}"><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" style="display:block;width:${rong}px;height:${cao}px"></body></html>`);
}
await trang.screenshot({ path: ra, omitBackground: nen === 'transparent' && !laHtml });
await trinhDuyet.close();
console.log(`${ra}  ${rong}×${cao}`);
