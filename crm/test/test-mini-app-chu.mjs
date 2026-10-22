/**
 * BEEFTOWN — CHỮ CỦA MINI APP ZALO (mini-app/)
 * ============================================
 *
 *     node test/test-mini-app-chu.mjs
 *
 * Mini App có package.json riêng và CI riêng (.github/workflows/mini-app.yml: kiểm tra đơn, tsc, build).
 * File này nằm ở crm/test vì danh sách chữ cấm là của repo (web/src/lib/chuoi-cam.js) — một nguồn cho
 * trang công khai, máy dịch và giờ là Mini App. Nó chạy trong `npm test` mỗi PR, không cần cài mini-app/.
 * Bất biến:
 *
 *   1. Chữ khách thấy trong Mini App không dính chữ cấm của repo: mã nguồn (bỏ chú thích), dữ liệu
 *      6 phần thịt, cấu hình quán, và tin đơn soạn sẵn gửi vào chat OA (nhận tại quán, giao tận nơi).
 *   2. Không dính chữ Khánh dặn không viết cho Mini App (mini-app/CLAUDE.md, "Quy tắc chữ và thương hiệu").
 *   3. Giá ghi theo cách của repo, "000.000 đ" có dấu cách — đúng như dinhDangTien của
 *      web/src/lib/kho/chung.ts (toLocaleString('vi-VN') + ' đ'). Bán theo khay giá cố định (Khánh quyết
 *      22/10/2026): mỗi dòng "số khay × giá một khay = tiền", dòng tổng bằng tổng các dòng.
 *   4. Giá trong tin đơn là giá chưa duyệt (máy quét chữ cấm bắt nó, "Chưa món nào có gia_da_duyet = true").
 *      Khi cau-hinh.ts có giaThu: true, tin có giá phải kèm dòng báo giá thử — đó là điều kiện để bản thử
 *      được hiện giá. Ngoài mẫu giá ra, tin có giá không dính chữ cấm nào khác.
 *
 * Mã .ts của Mini App nạp thẳng bằng node (bỏ kiểu, Node ≥ 22.18) — don.ts không import gì, san-pham.ts
 * và cau-hinh.ts chỉ import kiểu.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — CHỮ CỦA MINI APP ZALO');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MINI = join(GOC, 'mini-app');
const nap = p => import(pathToFileURL(join(GOC, p)).href);
const { timChuoiCam, CAM } = await nap('web/src/lib/chuoi-cam.js');
const { dinhDangTien, taoNoiDungDon } = await nap('mini-app/src/don.ts');
const { SAN_PHAM } = await nap('mini-app/src/san-pham.ts');
const { CAU_HINH } = await nap('mini-app/src/cau-hinh.ts');

/** Chữ Khánh dặn không viết trong Mini App (mini-app/CLAUDE.md). Mẫu trùng chuoi-cam.js thì để máy đó bắt. */
const KHONG_VIET = [
  { re: /korean\s*bbq|nướng\s*hàn|buffet|cao\s*cấp/i, vi_sao: 'Beeftown là nhà hàng chuyên bò, không phải BBQ Hàn hay buffet; không tự gọi cao cấp.' },
  { re: /(^|[^\p{L}])rẻ([^\p{L}]|$)/iu, vi_sao: 'Không lấy giá làm lời chào.' },
  { re: /nút thắt|đầu phễu|nước rút|dựng nền|hệ hạng|xoay trục|cổng số liệu|kích hoạt|\bleads?\b|seeding|broadcast|footage|creative|\bcamp\b|nghiệm thu/iu,
    vi_sao: 'Từ Khánh không dùng: câu thường, có số, không ẩn dụ.' },
];
const timKhongViet = chu => KHONG_VIET.filter(({ re }) => re.test(String(chu).normalize('NFC')));

/**
 * Bỏ chú thích // và /* *\/ của mã TS/TSX, giữ nguyên chuỗi ('…', "…", `…`). Chú thích không lên màn hình.
 * `//` ngay sau dấu hai chấm là địa chỉ web viết thẳng trong chữ JSX ("https://…"), không phải chú thích:
 * bỏ nó đi thì phần chữ sau địa chỉ không được quét.
 */
function boChuThich(ma) {
  let ra = '', i = 0, chuoi = null;
  while (i < ma.length) {
    const c = ma[i], sau = ma[i + 1];
    if (chuoi) {
      ra += c;
      if (c === '\\') { ra += sau ?? ''; i += 2; continue; }
      if (c === chuoi) chuoi = null;
      i++;
    } else if (c === '/' && sau === '/' && ma[i - 1] !== ':') {
      while (i < ma.length && ma[i] !== '\n') i++;
    } else if (c === '/' && sau === '*') {
      const het = ma.indexOf('*/', i + 2);
      i = het < 0 ? ma.length : het + 2;
    } else {
      if (c === '"' || c === "'" || c === '`') chuoi = c;
      ra += c;
      i++;
    }
  }
  return ra;
}

function moiFile(thuMuc) {
  return readdirSync(thuMuc, { withFileTypes: true }).flatMap(d =>
    d.isDirectory() ? moiFile(join(thuMuc, d.name)) : [join(thuMuc, d.name)]);
}
const tuGoc = p => relative(GOC, p).split(sep).join('/');

const nhanQuan = {
  cachNhan: 'tai-quan', ngay: '2026-11-13', gio: '18:30', ten: 'Anh Khánh', dienThoai: '0912345678',
  diaChi: '', cachTra: 'chuyen-khoan', ghiChu: '',
};
const nhanGiao = {
  ...nhanQuan, cachNhan: 'giao-hang', diaChi: '12 Nguyễn Huệ, phường Sài Gòn', cachTra: 'tra-khi-nhan',
  ghiChu: 'Gọi trước 10 phút',
};
const dongDon = gia => SAN_PHAM.map((sp, i) => ({
  ten: sp.ten, baoQuan: sp.baoQuan, soKhay: i + 1, soGamKhay: sp.soGamKhay, giaMoiKhay: gia ? sp.giaMoiKhay : null,
}));

/** Mọi chữ khách thấy, kèm nơi lấy: [nơi, chữ]. */
const CHU = [];
for (const f of moiFile(join(MINI, 'src')).filter(f => /\.tsx?$/.test(f))) {
  CHU.push([tuGoc(f), boChuThich(readFileSync(f, 'utf8'))]);
}
for (const f of ['index.html', 'app-config.json']) CHU.push([`mini-app/${f}`, readFileSync(join(MINI, f), 'utf8')]);
for (const sp of SAN_PHAM) {
  CHU.push([`san-pham.ts: ${sp.ma}`, [sp.ten, sp.goiY, sp.moTa, sp.cachNuong].filter(Boolean).join('\n')]);
}
CHU.push(['cau-hinh.ts: CAU_HINH', JSON.stringify(CAU_HINH)]);
CHU.push(['tin đơn nhận tại quán (không giá)', taoNoiDungDon(dongDon(false), nhanQuan)]);
CHU.push(['tin đơn giao tận nơi (không giá)', taoNoiDungDon(dongDon(false), nhanGiao)]);

await nhom('1 · CHỮ KHÁCH THẤY KHÔNG DÍNH CHỮ CẤM CỦA REPO (web/src/lib/chuoi-cam.js)', async () => {
  ok(`Đọc được chữ của Mini App (${CHU.length} nguồn, có đủ 6 phần thịt)`, CHU.length >= 20 && SAN_PHAM.length === 6,
     `${CHU.length} nguồn, ${SAN_PHAM.length} phần thịt`);
  for (const [noi, chu] of CHU) {
    const thay = timChuoiCam(chu);
    ok(`${noi}: không chữ cấm`, thay.length === 0, thay.map(t => `"${t.tim_thay}" — ${t.vi_sao}`).join(' | '));
  }
});

await nhom('2 · KHÔNG DÍNH CHỮ KHÁNH DẶN KHÔNG VIẾT CHO MINI APP', async () => {
  for (const [noi, chu] of CHU) {
    const thay = timKhongViet(chu);
    ok(`${noi}: không chữ Khánh dặn tránh`, thay.length === 0, thay.map(t => t.vi_sao).join(' | '));
  }
  ok('Bộ lọc bắt được chữ mẫu (Korean BBQ, buffet, giá rẻ, nghiệm thu) và để yên câu đúng',
     ['Korean BBQ tại nhà', 'Buffet bò', 'Thịt giá rẻ', 'Nghiệm thu bản thử'].every(c => timKhongViet(c).length > 0)
     && timKhongViet('Chọn số khay, quán soạn khay và báo tiền theo tem.').length === 0);
});

await nhom('3 · GIÁ GHI THEO CÁCH CỦA REPO: "000.000 đ"', async () => {
  // web/src/lib/kho/chung.ts: Math.round(x).toLocaleString('vi-VN') + ' đ'
  const cuaRepo = n => Math.round(n).toLocaleString('vi-VN') + ' đ';
  for (const n of [0, 500, 45000, 84500, 120000, 1229840]) {
    ok(`dinhDangTien(${n}) = "${cuaRepo(n)}"`, dinhDangTien(n) === cuaRepo(n), `ra "${dinhDangTien(n)}"`);
  }
  const tin = taoNoiDungDon(dongDon(true), nhanQuan, { giaThu: true });
  // Bán theo khay, giá cố định (Khánh quyết 22/10/2026): "• Ribeye with Cap (khay ~150 g): 1 × 300.000 đ = 300.000 đ".
  const so = g => Number(g.replace(/\D/g, ''));
  const dongGia = [...tin.matchAll(/^• .+ \(.*khay ~\d+ g\): (\d+) × ([\d.]+ đ) = ([\d.]+ đ)$/gm)];
  const DANG = /^\d{1,3}(\.\d{3})* đ$/;
  ok('Tin đơn ghi từng phần dạng "2 × 300.000 đ = 600.000 đ", đúng phép nhân',
     dongGia.length === SAN_PHAM.filter(sp => sp.giaMoiKhay !== null).length
     && dongGia.every(([, n, gia, tien]) => DANG.test(gia) && DANG.test(tien) && Number(n) * so(gia) === so(tien)),
     dongGia.map(m => m[0]).join(' | '));
  const tong = tin.match(/^Tổng: (\d+) khay · ([\d.]+ đ) tiền thịt$/m);
  ok('Dòng tổng ghi số khay và tổng tiền thịt, bằng tổng các dòng',
     !!tong && DANG.test(tong[2]) && so(tong[2]) === dongGia.reduce((t, [, , , tien]) => t + so(tien), 0)
     && Number(tong[1]) === dongDon(true).reduce((t, d) => t + d.soKhay, 0), tong?.[0] ?? 'không thấy dòng tổng');
  ok('Tin đơn không còn câu "báo tiền theo tem" của cách bán theo gam', !/theo tem/.test(tin));
  ok('Không còn giá dính chữ đ ("120.000đ") trong mã nguồn hay tin đơn',
     !CHU.some(([, chu]) => /\d\.\d{3}đ/.test(chu)) && !/\d\.\d{3}đ/.test(tin));
});

await nhom('4 · GIÁ THỬ: TIN CÓ GIÁ PHẢI KÈM DÒNG BÁO GIÁ THỬ', async () => {
  const MAU_GIA = CAM.find(m => /gia_da_duyet/.test(m.vi_sao));
  ok('chuoi-cam.js còn mẫu giá tiền (giá chưa duyệt)', !!MAU_GIA);
  const coGia = SAN_PHAM.some(sp => sp.giaMoiKhay !== null);
  for (const [ten, nhan] of [['nhận tại quán', nhanQuan], ['giao tận nơi', nhanGiao]]) {
    const tin = taoNoiDungDon(dongDon(true), nhan, { giaThu: CAU_HINH.giaThu });
    const thay = timChuoiCam(tin);
    ok(`Tin ${ten} có giá: ngoài mẫu giá chưa duyệt, không dính chữ cấm nào khác`,
       thay.every(t => t.vi_sao === MAU_GIA?.vi_sao), thay.map(t => t.tim_thay).join(' | '));
    if (CAU_HINH.giaThu && coGia) {
      ok(`giaThu: true → tin ${ten} có dòng "(Giá trong đơn là giá thử, chưa phải giá bán.)"`,
         tin.includes('(Giá trong đơn là giá thử, chưa phải giá bán.)'));
    }
  }
});

process.exit(ketThuc('MINI APP'));
