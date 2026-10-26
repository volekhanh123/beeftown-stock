/**
 * BEEFTOWN — TRẠNG THÁI Ở /noi-bo VÀ KHO NÓI BẰNG CHỮ, KHÔNG BẰNG MÀU: MARKUP VÀ CÂU
 * ==================================================================================
 *
 *     node test/test-noi-bo-trang-thai.mjs
 *
 * Ngày 25/10/2026 Khánh bỏ màu trạng thái xanh / vàng / đỏ nhạt ở /noi-bo và kho (câu 2 của THUONG-HIEU.md mục 0):
 * trạng thái phân biệt bằng chữ, dấu, nét. CSS của bảy kiểu vẽ (K1–K7) do test-noi-bo-bang-mau.mjs nhóm 7 gác; file
 * này gác phần markup và câu chữ — chỗ mà trước đây màu là thứ DUY NHẤT nói lên trạng thái. Bất biến:
 *
 *   1. Nhãn hạn có chữ: chuTinhTrangHan (web/src/lib/kho/chung.ts) trả "Hết hạn" / "Sắp hết hạn" / "Còn hạn" cho hạn
 *      dùng, "Quá hạn" / "Sắp đến hạn" / "Chưa đến hạn" cho hạn thanh toán ("hết hạn" sai nghĩa với tiền), đủ vi / en;
 *      mọi nhãn .kho-han lớp động trong trang kho in chữ đó, nhãn lớp tĩnh có chữ riêng.
 *   2. Nhãn đúng nghĩa: nhãn thuộc tính (số tiền, tên vai, "vai của bạn", "Nợ đầu kỳ", "Hóa đơn gộp", "Bắt buộc",
 *      "Chủ nhà hàng", "Kho tự nhận…", "tự động", tên loại tin, hạn còn xa) là .nb-nhan.thong-tin (K7, không dấu) —
 *      không mang dấu ✓ hay nền đen của trạng thái; bốn câu "lưu ý" là .nb-nhan.luu-y, không .nb-nhan.nhap ("nháp");
 *      hai nhãn lệch nghĩa có từ trước sửa đúng ("Quá hạn N ngày" → cho, "Đang chạy" → nhap).
 *   3. Câu thay cho màu: chip giá vượt ngưỡng có chữ "vượt ngưỡng"; cột vai của mình có "(bạn)"; bước Xong của phiên
 *      lóc có câu thu hồi thấp (chỉ câu thap1 — thap2 "chốt vẫn được" sai khi đã chốt); nhánh quầy của yêu cầu hàng
 *      nói quá giờ; khung iPOS ở màn Bán hàng in chữ của đèn (chuDen).
 *   4. Không câu nào (khối vi: / en: trong web/src/lib, pages, components) gọi trạng thái bằng xanh / vàng / green /
 *      yellow — màn hình không còn hai màu đó; câu "báo đỏ" của FormMatHang sai từ trước cũng bỏ. Có mẫu tự kiểm.
 *   5. Trạng thái hủy / tắt không vẽ bằng độ mờ (opacity): chữ phụ #555 mờ 55 % trên trắng chỉ còn 2,57 : 1 — nhãn
 *      "Đã hủy" / "Đã bỏ" và nét đứt nói thay.
 *
 * Mã dữ liệu 'xanh' / 'vang' / 'do' / 'tat' của database và lib giữ nguyên tên (không migration) — chỉ thứ người
 * nhìn thấy đổi. Kiểm thử chỉ đọc mã nguồn, không cần database.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const TRANG = join(SRC, 'pages', 'noi-bo');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const doc = p => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const tuGoc = p => relative(GOC, p).split(sep).join('/');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — TRẠNG THÁI Ở /noi-bo VÀ KHO: MARKUP VÀ CÂU');

/** Mọi file dưới một thư mục (đường dẫn đầy đủ). Thư mục không có → []. */
function moiFile(thuMuc) {
  if (!existsSync(thuMuc)) return [];
  return readdirSync(thuMuc, { withFileTypes: true }).flatMap(d =>
    d.isDirectory() ? moiFile(join(thuMuc, d.name)) : [join(thuMuc, d.name)]);
}
/** Phần template của một file .astro: sau khối --- … ---, bỏ <script>, <style>, chú thích JSX và HTML. */
const mauCua = nguon => nguon.replace(/^---[\s\S]*?\n---/, '').replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
  .replace(/<script[^>]*>[\s\S]*?<\/script>/g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/<!--[\s\S]*?-->/g, '');

/**
 * Thẻ mở của phần tử gần nhất bao quanh vị trí `viTri` có tên `the` (mặc định span): lùi về `<span` gần nhất trước vị
 * trí đó, đọc tới dấu > đầu tiên nằm ngoài ngoặc nhọn {…} (class={`…`} có thể chứa <=). Không thấy → ''.
 */
function theMoTruoc(ma, viTri, the = 'span') {
  const dau = ma.lastIndexOf(`<${the}`, viTri);
  if (dau < 0) return '';
  let sau = 0;
  for (let k = dau; k < ma.length; k++) {
    if (ma[k] === '{') sau++;
    else if (ma[k] === '}') sau--;
    else if (ma[k] === '>' && sau === 0) return ma.slice(dau, k + 1);
  }
  return '';
}
/** Thẻ mở của span chứa đoạn mã `khoa` (lần đầu gặp, hoặc lần thứ `lan`). */
function nhanChua(ma, khoa, lan = 0) {
  let viTri = -1;
  for (let i = 0; i <= lan; i++) { viTri = ma.indexOf(khoa, viTri + 1); if (viTri < 0) return ''; }
  return theMoTruoc(ma, viTri);
}

// ===========================================================================
await nhom('1 · NHÃN HẠN CÓ CHỮ (chuTinhTrangHan): HẠN DÙNG VÀ HẠN THANH TOÁN', async () => {
  const CHUNG = await nap('kho/chung.ts');
  const ham = CHUNG.chuTinhTrangHan;
  ok('lib/kho/chung.ts xuất chuTinhTrangHan, TINH_TRANG_HAN_NB, HAN_THANH_TOAN_NB', typeof ham === 'function' && !!CHUNG.TINH_TRANG_HAN_NB && !!CHUNG.HAN_THANH_TOAN_NB);
  const goi = (...a) => (typeof ham === 'function' ? ham(...a) : null);
  const dung = ['het_han', 'sap_het', 'con_han'].map(m => [goi(m, 'vi'), goi(m, 'en')]);
  ok('chuTinhTrangHan (hạn dùng): het_han / sap_het / con_han → "Hết hạn" / "Sắp hết hạn" / "Còn hạn"; en "Expired" / "Expiring soon" / "In date"',
     JSON.stringify(dung) === JSON.stringify([['Hết hạn', 'Expired'], ['Sắp hết hạn', 'Expiring soon'], ['Còn hạn', 'In date']]), JSON.stringify(dung));
  const tien = ['het_han', 'sap_het', 'con_han'].map(m => [goi(m, 'vi', 'thanh_toan'), goi(m, 'en', 'thanh_toan')]);
  ok('chuTinhTrangHan (hạn thanh toán): "Quá hạn" / "Sắp đến hạn" / "Chưa đến hạn"; en "Overdue" / "Due soon" / "Not due yet" — "hết hạn" sai nghĩa với tiền',
     JSON.stringify(tien) === JSON.stringify([['Quá hạn', 'Overdue'], ['Sắp đến hạn', 'Due soon'], ['Chưa đến hạn', 'Not due yet']]), JSON.stringify(tien));
  ok('chuTinhTrangHan: mã lạ, null, undefined → "" (không in chữ sai)', goi('la', 'vi') === '' && goi(null) === '' && goi(undefined, 'en') === '');
  ok('chuTinhTrangHan: mặc định tiếng Việt, hạn dùng', goi('het_han') === 'Hết hạn');

  // Mọi nhãn .kho-han lớp động trong trang kho in chữ tình trạng NGAY TRONG nhãn — trước đây chỉ có ngày, tình trạng
  // nằm ở màu nền. Nhãn lớp tĩnh có sẵn chữ của nó ({t.…}).
  const trangKho = moiFile(join(TRANG, 'kho')).filter(f => f.endsWith('.astro'));
  const dong = [], tinh = [], thieuDong = [], thieuTinh = [], thanhToanSai = [];
  for (const f of trangKho) {
    const ma = mauCua(doc(f));
    for (const m of ma.matchAll(/<span\b[^>]*?class=(\{`kho-han \$\{[^}]*\}`\}|"kho-han (?:het_han|sap_het|con_han)")/g)) {
      const mo = theMoTruoc(ma, m.index + 1);
      const het = ma.indexOf('</span>', m.index + mo.length);
      const noiDung = ma.slice(m.index + mo.length, het < 0 ? undefined : het);
      const noi = `${tuGoc(f)}: ${noiDung.trim().slice(0, 60)}`;
      if (m[1].startsWith('{')) {
        dong.push(noi);
        if (!/chuTinhTrangHan\(/.test(noiDung)) thieuDong.push(noi);
        if (/cong-no[\\/]index\.astro$/.test(f) && !/chuTinhTrangHan\([^)]*'thanh_toan'\)/.test(noiDung)) thanhToanSai.push(noi);
      } else {
        tinh.push(noi);
        if (!/\{t\.[\w$]+/.test(noiDung)) thieuTinh.push(noi);
      }
    }
  }
  ok(`Mọi nhãn .kho-han lớp động trong trang kho (${dong.length} chỗ, cần ≥ 7) có chữ tình trạng chuTinhTrangHan trong cùng phần tử`,
     dong.length >= 7 && thieuDong.length === 0, thieuDong.slice(0, 6).join(' | '));
  ok('Nhãn .kho-han hạn thanh toán ở cong-no/index.astro gọi chuTinhTrangHan(…, \'thanh_toan\')', thanhToanSai.length === 0
     && dong.filter(d => d.startsWith('web/src/pages/noi-bo/kho/cong-no/index.astro')).length === 2, thanhToanSai.join(' | '));
  ok(`Nhãn .kho-han lớp tĩnh (${tinh.length} chỗ: "Quá hạn N ngày", "Chưa có giá") có chữ riêng {t.…}`, tinh.length >= 2 && thieuTinh.length === 0, thieuTinh.join(' | '));
  const quet = doc(join(TRANG, 'kho', 'quet.astro'));
  ok('quet.astro dùng chuTinhTrangHan, không còn bảng chữ hạn riêng (TEN_HAN) — một chỗ cho ba câu', /chuTinhTrangHan\(/.test(quet) && !/TEN_HAN\b/.test(quet));
});

// ===========================================================================
await nhom('2 · NHÃN ĐÚNG NGHĨA: THUỘC TÍNH LÀ .thong-tin, LƯU Ý LÀ .luu-y, KHÔNG MANG DẤU CỦA TRẠNG THÁI', async () => {
  const ma = f => mauCua(doc(join(TRANG, f)));
  /** Lớp của nhãn: các tên lớp trong thẻ mở (kể cả trong biểu thức class={`…`}). */
  const lop = the => new Set([...the.matchAll(/[\w-]+/g)].map(m => m[0]));
  const coLop = (the, ten, khongCo = []) => !!the && lop(the).has('nb-nhan') && lop(the).has(ten) && khongCo.every(k => !lop(the).has(k));

  // [file, đoạn mã nằm trong nhãn, mô tả] — 15 nhãn thuộc tính (kế hoạch 2d.9 và bản đồ trạng thái TT2).
  const THONG_TIN = [
    ['zalo/cai-dat.astro', 'nhanNB(TEN_LOAI_TIN', 'tên loại tin Zalo'],
    ['zalo/index.astro', '{t.tuDong}', '"tự động"'],
    ['kho/ban-ipos/ghep.astro', 't.khoTuNhanGiam(', '"Kho tự nhận giảm N%"'],
    ['kho/ban-ipos/ghep.astro', 't.khoTuNhanO(', '"Kho tự nhận ô …"'],
    ['kho/cai-dat/nhan-vien.astro', '{tenVai(n.vai_tro)}', 'tên vai'],
    ['kho/cai-dat/quyen.astro', '{t.vaiCuaBan}', '"vai của bạn"'],
    ['kho/cong-no/[id].astro', '{t.noDau}', '"Nợ đầu kỳ"'],
    ['kho/cong-no/[id].astro', '{t.hoaDonGop}', '"Hóa đơn gộp"'],
    ['kho/cong-no/[id].astro', 't.hanNgay(', '"Hạn dd/mm" khi còn xa'],
    ['kho/cong-no/[id].astro', 'dinhDangTien(h.tong_tien', 'số tiền hóa đơn'],
    ['kho/cong-no/[id].astro', 'dinhDangTien(kh.so_tien', 'số tiền khoản thanh toán'],
    ['kho/cong-no/no-dau.astro', '{t.nhanNoDau}', '"Nợ đầu kỳ"'],
    ['kho/cong-no/index.astro', '{t.hoaDonGop}', '"Hóa đơn gộp"'],
    ['noi-dung.astro', '{t.batBuoc}', '"Bắt buộc"'],
    ['noi-dung.astro', '{t.chuNhaHang}', '"Chủ nhà hàng"'],
  ];
  const sai = THONG_TIN.filter(([f, khoa]) => !coLop(nhanChua(ma(f), khoa), 'thong-tin', ['song', 'nhap']))
    .map(([f, khoa, mt]) => `${f} ${mt}: ${nhanChua(ma(f), khoa) || 'không thấy nhãn'}`);
  ok(`${THONG_TIN.length} nhãn thuộc tính dùng .nb-nhan.thong-tin (K7, không dấu) — số tiền, tên vai, "vai của bạn", "Nợ đầu kỳ", "Hóa đơn gộp", "Bắt buộc", "Chủ nhà hàng", "Kho tự nhận…", "tự động", loại tin, hạn còn xa`,
     sai.length === 0, sai.slice(0, 5).join(' | '));
  const han = nhanChua(ma('kho/cong-no/[id].astro'), 't.hanNgay(');
  ok('Nhãn "Hạn dd/mm" của công nợ: ≤ 7 ngày vẫn là .cho (K1 "làm ngay"), còn xa là .thong-tin', coLop(han, 'cho') && coLop(han, 'thong-tin', ['nhap']), han);

  // Bốn câu "lưu ý" trước dùng .nhap (bảng cũ: nền vàng) — nay .nhap là K3 nền đen "nháp": phải sang .luu-y (K5).
  const { nhanTrenFabi } = await nap('kho/thu-ngan.ts');
  ok('thu-ngan.ts nhanTrenFabi: "Có trên FABi nhưng ngừng bán" và "Chưa thấy trên FABi" mang lớp luu-y (không nhap)',
     nhanTrenFabi('ngung_ban')[1] === 'luu-y' && nhanTrenFabi('chua_thay')[1] === 'luu-y',
     `${nhanTrenFabi('ngung_ban')[1]} · ${nhanTrenFabi('chua_thay')[1]}`);
  const LUU_Y = [['kho/ban-ipos/ghep.astro', '{t.nenBoGhep}', '"Mã này kho tự nhận — nên Bỏ ghép"'], ['kho/cong-no/[id].astro', '{t.chuaDoiChieuNhan}', '"Chưa đối chiếu"']];
  const saiLuuY = LUU_Y.filter(([f, khoa]) => !coLop(nhanChua(ma(f), khoa), 'luu-y', ['nhap'])).map(([f, khoa, mt]) => `${f} ${mt}: ${nhanChua(ma(f), khoa) || 'không thấy nhãn'}`);
  ok('Không .nb-nhan.nhap nào mang câu lưu ý: ghep.astro "nên Bỏ ghép" và cong-no/[id] "Chưa đối chiếu" là .nb-nhan.luu-y', saiLuuY.length === 0, saiLuuY.join(' | '));

  // Hai nhãn lệch nghĩa có từ trước.
  const quaHan = nhanChua(ma('kho/cong-no/[id].astro'), 't.quaHanNgay(');
  ok('Công nợ "Quá hạn N ngày" là .nb-nhan.cho (làm ngay) — không .tat (nét đứt "tắt")', coLop(quaHan, 'cho', ['tat']), quaHan);
  const dangChay = nhanChua(ma('kho/cai-dat/ipos.astro'), '{t.dangChayNhan}');
  ok('Kết nối iPOS "Đang chạy" là .nb-nhan.nhap (đang làm dở, K3) — không .tat', coLop(dangChay, 'nhap', ['tat']), dangChay);
  // Mẫu tự kiểm của bộ đọc nhãn.
  const mau = '<span class="nb-nhan song">{t.a}</span> <span class={`nb-nhan ${x ? \'cho\' : \'thong-tin\'}`} title={x <= y ? 1 : 2}>{t.b}</span>';
  ok('…bộ đọc nhãn lấy đúng thẻ mở bao quanh đoạn mã (kể cả class={`…`} có dấu <=)',
     coLop(nhanChua(mau, '{t.a}'), 'song') && coLop(nhanChua(mau, '{t.b}'), 'thong-tin') && !coLop(nhanChua(mau, '{t.a}'), 'thong-tin'));
});

// ===========================================================================
await nhom('3 · CÂU THAY CHO MÀU: VƯỢT NGƯỠNG, (BẠN), THU HỒI THẤP, QUÁ GIỜ, CHỮ CỦA ĐÈN iPOS', async () => {
  const nhap = doc(join(TRANG, 'kho', 'nhap', '[id].astro'));
  ok('Phiếu nhập: chip giá vượt ngưỡng có chữ "vượt ngưỡng" / "over threshold" (khóa vuotNguong), in khi chip.vuot',
     /vuotNguong:\s*\{\s*vi:\s*'vượt ngưỡng',\s*en:\s*'over threshold'\s*\}/.test(nhap) && /chip\.vuot\s*&&[\s\S]{0,80}t\.vuotNguong/.test(mauCua(nhap)));
  const quyen = doc(join(TRANG, 'kho', 'cai-dat', 'quyen.astro'));
  ok('Quyền: cột vai của mình có chữ "(bạn)" / "(you)" (khóa banNgoac) cạnh tên vai',
     /banNgoac:\s*\{\s*vi:\s*' \(bạn\)',\s*en:\s*' \(you\)'\s*\}/.test(quyen) && /v === vaiToi && t\.banNgoac/.test(mauCua(quyen)));
  const pha = doc(join(TRANG, 'kho', 'pha-loc', '[id].astro'));
  const i = pha.indexOf("buoc === 'xong' ? (");
  const xong = i < 0 ? '' : pha.slice(i);
  ok('Phiên lóc, bước Xong: thu hồi thấp có câu (t.thap1, trong khối nb-bao luu-y) — không t.thap2 ("chốt vẫn được" sai khi đã chốt)',
     /soSanh\.muc === 'thap'[\s\S]{0,200}nb-bao luu-y[\s\S]{0,200}t\.thap1\(/.test(xong) && !/t\.thap2\b/.test(xong));
  const yeuCau = doc(join(TRANG, 'kho', 'quay', 'yeu-cau', '[id].astro'));
  ok('Yêu cầu hàng, nhánh quầy: nói quá giờ bằng chữ (khóa quaGioQuay, đủ vi / en), khi chuyen.qua_gio',
     /quaGioQuay:\s*\{\s*vi:\s*'[^']+',\s*en:\s*'[^']+'\s*\}/.test(yeuCau) && /t\.kiemRoiNhan[\s\S]{0,80}chuyen\?\.qua_gio[\s\S]{0,20}t\.quaGioQuay/.test(yeuCau));
  const banIpos = doc(join(TRANG, 'kho', 'ban-ipos', 'index.astro'));
  ok('Bán hàng iPOS: khung trạng thái in chữ của đèn (chuDen: "Đang chạy tốt" / "Cần xem" / "Mất kết nối") như màn Kết nối iPOS',
     /import\s*\{[^}]*\bchuDen\b[^}]*\}\s*from\s*'[^']*ban-ipos\.ts'/.test(banIpos) && /chuDen\(tt\.den,\s*nn\)/.test(mauCua(banIpos)));
  const { chuDen } = await nap('kho/ban-ipos.ts');
  ok('chuDen có chữ cho ba mức của đèn (mã dữ liệu xanh / vang / do), vi / en, không gọi tên màu',
     typeof chuDen === 'function' && ['xanh', 'vang', 'do'].every(m => chuDen(m, 'vi') && chuDen(m, 'en') && !/xanh|vàng|đỏ|green|yellow|red/i.test(`${chuDen(m, 'vi')} ${chuDen(m, 'en')}`)),
     typeof chuDen === 'function' ? ['xanh', 'vang', 'do'].map(m => `${m}: ${chuDen(m, 'vi')} / ${chuDen(m, 'en')}`).join(' · ') : 'không có hàm');
});

// ===========================================================================
// Câu người dùng đọc (giá trị của khóa vi: / en: / ko: trong web/src/lib, pages, components) không gọi trạng thái bằng
// màu đã bỏ. Trừ mô tả ảnh món ăn (lib/anh.ts, lib/anh-tao-san.ts: "rau xanh", "đĩa vàng" là đồ vật trong ảnh). Chú
// thích mã không phải câu người dùng đọc, không quét.
/** Mọi chuỗi là giá trị của khóa vi / en / ko trong một đoạn mã → [{ khoa, chu }]. */
function cauTrong(ma) {
  return [...ma.matchAll(/\b(vi|en|ko)\s*:\s*(['"`])((?:\\.|(?!\2)[\s\S])*?)\2/g)].map(m => ({ khoa: m[1], chu: m[3] }));
}
const MAU_DA_BO = /(?<![\p{L}])(xanh|vàng|green|yellow)(?![\p{L}])/iu;
const TRU = ['web/src/lib/anh.ts', 'web/src/lib/anh-tao-san.ts'];

await nhom('4 · KHÔNG CÂU NÀO GỌI TRẠNG THÁI BẰNG XANH / VÀNG / GREEN / YELLOW', async () => {
  const tep = ['lib', 'pages', 'components'].flatMap(d => moiFile(join(SRC, d))).filter(f => /\.(ts|astro)$/.test(f) && !TRU.includes(tuGoc(f)));
  const sai = tep.flatMap(f => cauTrong(doc(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''))
    .filter(c => MAU_DA_BO.test(c.chu)).map(c => `${tuGoc(f)} [${c.khoa}] «${c.chu.match(new RegExp(`.{0,40}${c.chu.match(MAU_DA_BO)[0]}.{0,20}`, 'iu'))?.[0] ?? c.chu.slice(0, 60)}»`));
  ok(`${tep.length} file web/src (lib, pages, components): không câu vi / en nào gọi trạng thái bằng xanh / vàng / green / yellow`,
     tep.length > 100 && sai.length === 0, sai.slice(0, 6).join(' | '));
  const BAT = ["{ vi: 'Đèn xanh là tốt' }", "{ en: 'A yellow light needs a look' }", '{ vi: `Chờ dòng hiện xanh rồi in` }', "{ vi: \"Dòng nền vàng: thiếu mã\" }",
    "{ vi: 'Tổng: Xanh là ổn' }"];
  const KHONG_BAT = ["{ vi: 'Chờ hiện dòng Cân sẵn sàng' }", "muc: 'xanh'", "{ vi: 'Xử lý ngay', en: 'Act now' }", "{ en: 'Greenland' }"];
  const lot = BAT.filter(m => !cauTrong(m).some(c => MAU_DA_BO.test(c.chu)));
  const nham = KHONG_BAT.filter(m => cauTrong(m).some(c => MAU_DA_BO.test(c.chu)));
  ok('…phép quét bắt được câu gọi màu ở mọi kiểu ngoặc (\', ", `) và không bắt mã dữ liệu \'xanh\', chữ "Greenland"',
     lot.length === 0 && nham.length === 0, [...lot.map(m => `lọt: ${m}`), ...nham.map(m => `bắt nhầm: ${m}`)].join(' | '));
  // Câu "báo đỏ" của FormMatHang sai từ trước PR: dòng gợi ý đặt hàng chưa bao giờ đỏ (trước tô vàng, nay chữ đen đậm).
  const form = doc(join(SRC, 'components', 'kho', 'FormMatHang.astro'));
  const goiY = cauTrong(form.match(/khoMinGoiY:\s*\{[^}]*\}/)?.[0] ?? '');
  ok('FormMatHang.astro: câu gợi ý kho tối thiểu không nói "báo đỏ" / "turns red" (dòng gợi ý không đỏ), đủ vi / en',
     goiY.length === 2 && goiY.every(c => !/đỏ|red\b/i.test(c.chu)), goiY.map(c => c.chu).join(' | ') || 'không thấy khóa khoMinGoiY');
});

// ===========================================================================
await nhom('5 · TRẠNG THÁI HỦY / TẮT KHÔNG VẼ BẰNG ĐỘ MỜ', async () => {
  // Chữ phụ #555 mờ 55 % trên thẻ trắng chỉ còn 2,57 : 1, mờ 60 % còn 2,85 : 1 — dưới ngưỡng 4,5 của chữ thường.
  const CHO = [['kho/cong-no/[id].astro', 'khoản / hóa đơn đã hủy, đã bỏ'], ['kho/cong-no/index.astro', 'phiếu đã hủy'], ['cai-dat.astro', 'ô bàn đang tắt (.nb-o-ban.tat)']];
  const sai = CHO.filter(([f]) => /opacity\s*:\s*\.?\d/.test(doc(join(TRANG, f)))).map(([f, mt]) => `${f} (${mt})`);
  ok('Mục hủy / tắt không làm mờ bằng opacity (cong-no/[id], cong-no/index, cai-dat .nb-o-ban.tat) — nhãn "Đã hủy" / "Đã bỏ", nét đứt nói thay',
     sai.length === 0, sai.join(' | '));
  const huongDan = doc(join(SRC, 'lib', 'kho', 'huong-dan.ts'));
  ok('Hướng dẫn kho không còn tả mục hủy là "hiện mờ" / "greyed out"', !/hiện mờ|greyed out/i.test(huongDan));
});

process.exit(ketThuc('TRẠNG THÁI Ở /noi-bo VÀ KHO'));
