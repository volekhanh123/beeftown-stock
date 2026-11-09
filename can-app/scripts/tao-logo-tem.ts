/**
 * Tạo logo đen trắng cho tem cân từ SVG của bộ nhận diện:
 *
 *     cd can-app && npx bun scripts/tao-logo-tem.ts
 *
 * Vẽ `web/public/thuong-hieu/chu-beeftown-den.svg` (logo phụ, bản đen — bộ nhận diện 21/10/2026) trong Chromium ở đúng cỡ
 * in (LOGO_RONG chấm ngang, cao theo tỉ lệ của SVG; máy in cân 8 chấm/mm), đổi sang đen trắng (sáng < 128 là đen), rồi ghi
 * `src/logo-tem.ts`: mỗi hàng chấm là một chuỗi hex, bit cao bên trái, 1 = đen — đúng thứ tự cân đọc (dac-ta/label-format.md
 * mục 5). Không vẽ lại logo, không sửa tay file ra. `test/thu-tem.ts` so sha256 của SVG với số ghi trong file ra: SVG đổi mà
 * chưa chạy lại công cụ này thì kiểm thử đỏ.
 *
 * Playwright lấy từ web/ (cd web && npm ci), không có thì bản cài chung của máy — như test/thu-trinh-duyet.ts.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

/** Rộng logo trên tem (chấm). 184 = 23 byte mỗi hàng, vừa ô góc trên phải của mẫu tem Beeftown (tem.ts). */
export const LOGO_RONG = 184;
const NGUON = 'web/public/thuong-hieu/chu-beeftown-den.svg';

const goc = path.resolve(import.meta.dir, '..', '..');
const svg = fs.readFileSync(path.join(goc, NGUON), 'utf8');
const sha256 = createHash('sha256').update(svg).digest('hex');
const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
if (!vb) throw new Error(`${NGUON} không có viewBox`);
const cao = Math.round(LOGO_RONG * Number(vb[2]) / Number(vb[1]));

interface TrangPw { evaluate<R, A>(f: (a: A) => R | Promise<R>, a: A): Promise<R> }
interface Pw { chromium: { launch(): Promise<{ newPage(): Promise<TrangPw>; close(): Promise<void> }> } }
let pw: Pw | null = null;
for (const f of [path.join(goc, 'web', 'package.json'), import.meta.path]) {
  try { pw = createRequire(f)('playwright') as Pw; await pw.chromium.launch().then(b => b.close()); break; } catch { pw = null; }
}
if (!pw) throw new Error('Không mở được Chromium — cd web && npm ci && npx playwright install chromium');

const trinhDuyet = await pw.chromium.launch();
const trang = await trinhDuyet.newPage();
const hang = await trang.evaluate(async ({ du, w, h }) => {
  const anh = new Image();
  anh.src = 'data:image/svg+xml;base64,' + du;
  await anh.decode();
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, w, h);
  g.drawImage(anh, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  const ra: string[] = [];
  for (let y = 0; y < h; y++) {
    const byte = new Array(Math.ceil(w / 8)).fill(0);
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if ((d[i] + d[i + 1] + d[i + 2]) / 3 < 128) byte[x >> 3] |= 0x80 >> (x & 7);
    }
    ra.push(byte.map(b => b.toString(16).padStart(2, '0')).join(''));
  }
  return ra;
}, { du: Buffer.from(svg).toString('base64'), w: LOGO_RONG, h: cao });
await trinhDuyet.close();

// Hình nhìn bằng mắt trong chú thích: # là chấm đen.
const hinh = hang.map(h => ' *   ' + [...h].map(c => parseInt(c, 16).toString(2).padStart(4, '0')).join('').slice(0, LOGO_RONG)
  .replace(/1/g, '#').replace(/0/g, ' ').trimEnd());
const ra = `/**
 * LOGO TRÊN TEM CÂN — FILE DO MÁY TẠO, đừng sửa tay. Tạo lại: cd can-app && npx bun scripts/tao-logo-tem.ts
 * Nguồn: ${NGUON} (logo phụ, bản đen — bộ nhận diện 21/10/2026).
 * ${LOGO_RONG} × ${cao} chấm (${(LOGO_RONG / 8).toLocaleString('vi-VN')} × ${(cao / 8).toLocaleString('vi-VN')} mm ở 8 chấm/mm). Mỗi hàng là hex, bit cao bên trái, 1 = đen.
 *
${hinh.join('\n')}
 */
export const LOGO_TEM = {
  nguon: '${NGUON}',
  sha256Nguon: '${sha256}',
  rong: ${LOGO_RONG},
  cao: ${cao},
  hang: [
${hang.map(h => `    '${h}',`).join('\n')}
  ],
} as const;
`;
fs.writeFileSync(path.join(goc, 'can-app', 'src', 'logo-tem.ts'), ra);
console.log(`Đã ghi src/logo-tem.ts: ${LOGO_RONG} × ${cao} chấm, ${hang.join('').split('').reduce((n, c) => n + parseInt(c, 16).toString(2).split('1').length - 1, 0)} chấm đen.`);
