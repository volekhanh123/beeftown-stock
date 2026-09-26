/**
 * BEEFTOWN KHO — TIẾNG ANH CỦA PHẦN KHO
 * ====================================
 * Phần kho có hai thứ tiếng như phần CRM (web/src/lib/ngon-ngu-noi-bo.ts):
 *   · câu của trang / thư viện nằm cạnh nhau dạng { vi, en };
 *   · câu báo KetQua mang thêm cauEn khi thư viện viết sẵn bản tiếng Anh;
 *   · câu đến từ database đi qua dichCau() — bảng ở lib/kho/cau-kho-en.ts.
 *
 *     node test/test-kho-tieng-anh.mjs
 *
 * Bất biến, để câu mới thêm về sau không lặng lẽ hiện tiếng Việt trên màn
 * tiếng Anh:
 *   1. Màn kho và thư viện của chúng không còn chữ Việt nào ngoài cặp
 *      { vi, en } — trừ vài chỗ cố ý (CO_Y) và các file liệt kê ở KHONG_QUET
 *      kèm lý do. CHUA_LAM là các file chưa dịch xong: danh sách này chỉ được
 *      ngắn đi.
 *   2. Mọi câu raise exception của các migration kho đều có bản tiếng Anh.
 *   3. Khung kho có nút đổi tiếng; câu báo, số, câu sự kiện theo ngôn ngữ.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { quetChuViet, VIET } from './quet-chu-viet.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOC = join(__dirname, '..', '..');
const WEB = join(GOC, 'web', 'src');
const MIGRATIONS_DIR = join(GOC, 'crm', 'supabase', 'migrations');

const { dichCau } = await import(join(WEB, 'lib', 'cau-noi-bo.ts'));
const chung = await import(join(WEB, 'lib', 'kho', 'chung.ts'));
const viec = await import(join(WEB, 'lib', 'kho', 'viec.ts'));
const dieuHuong = await import(join(WEB, 'lib', 'kho', 'dieu-huong.ts'));

let dat = 0, hong = 0;
const loi = [];
function ok(ten, dieuKien, chiTiet = '') {
  if (dieuKien) { dat++; console.log(`  \x1b[32m✓\x1b[0m ${ten}`); }
  else {
    hong++; loi.push(ten + (chiTiet ? ` — ${chiTiet}` : ''));
    console.log(`  \x1b[31m✗ ${ten}\x1b[0m${chiTiet ? ` — ${chiTiet}` : ''}`);
  }
}
function nhom(ten) { console.log(`\n\x1b[1m${ten}\x1b[0m`); }

const doc = p => readFileSync(join(WEB, p), 'utf8');

console.log('\x1b[1m\nBEEFTOWN KHO — TIẾNG ANH\x1b[0m');
console.log('='.repeat(60));

// ===========================================================================
nhom('1 · MÀN KHO KHÔNG CÒN CHỮ VIỆT NGOÀI CẶP { vi, en }');
{
  // Mọi file giao diện + thư viện của kho (đường dẫn tính từ web/src).
  const moiFile = thu => readdirSync(join(WEB, thu)).flatMap(f => {
    const p = join(thu, f);
    return statSync(join(WEB, p)).isDirectory() ? moiFile(p) : [p.split(sep).join('/')];
  });
  const TAT_CA = ['layouts/Kho.astro', ...moiFile('components/kho'), ...moiFile('pages/noi-bo/kho'), ...moiFile('lib/kho')]
    .filter(f => /\.(astro|ts)$/.test(f)).sort();

  // Không quét — kèm lý do. Chữ Việt ở đây KHÔNG hiện trên màn nội bộ.
  const KHONG_QUET = {
    'pages/noi-bo/kho/cong-no/misa.csv.ts': 'file cho phần mềm MISA — tên cột phải đúng mẫu tiếng Việt của MISA',
    'lib/kho/misa.ts': 'tên cột, mã chứng từ theo mẫu nhập của MISA',
    'lib/kho/may-chung-ma-hoa.ts': 'mã hóa, không có chữ cho người dùng',
  };

  // Chữ Việt CỐ Ý, không phải câu giao diện bị sót. Mỗi dòng một lý do.
  const CO_Y = [
    ".replace(/đ$|d$|vnd$/i, '')",              // đọc ô tiền: "450.000đ"
    ".replace(/đ/g, 'd').replace(/Đ/g, 'D')",   // bỏ dấu khi sinh mã / tìm không dấu
  ];

  // CHƯA DỊCH XONG — mỗi gói xóa dòng của mình khi xong (giữ dòng đánh dấu).
  // Danh sách này chỉ được ngắn đi.
  const CHUA_LAM = [
    // ---- gói nhập hàng: nhận hàng · nhập hàng · đặt hàng · duyệt ----
    'lib/kho/dat-hang.ts',
    'lib/kho/nhan-hang.ts',
    'lib/kho/nhap.ts',
    'pages/noi-bo/kho/dat-hang/[id].astro',
    'pages/noi-bo/kho/dat-hang/[id]/in.astro',
    'pages/noi-bo/kho/dat-hang/index.astro',
    'pages/noi-bo/kho/dat-hang/moi.astro',
    'pages/noi-bo/kho/duyet.astro',
    'pages/noi-bo/kho/nhan-hang/[id].astro',
    'pages/noi-bo/kho/nhan-hang/index.astro',
    'pages/noi-bo/kho/nhan-hang/moi.astro',
    'pages/noi-bo/kho/nhap/[id].astro',
    'pages/noi-bo/kho/nhap/index.astro',
    // ---- hết gói nhập hàng ----
    // ---- gói vận hành: pha lóc · xuất · kiểm kê · quầy · quét · tồn ----
    'lib/kho/dem-quay.ts',
    'lib/kho/kiem-ke.ts',
    'lib/kho/pha-loc.ts',
    'lib/kho/quay.ts',
    'lib/kho/the-kho.ts',
    'lib/kho/xuat.ts',
    'pages/noi-bo/kho/kiem-ke/[id].astro',
    'pages/noi-bo/kho/kiem-ke/index.astro',
    'pages/noi-bo/kho/pha-loc/[id].astro',
    'pages/noi-bo/kho/pha-loc/index.astro',
    'pages/noi-bo/kho/pha-loc/moi.astro',
    'pages/noi-bo/kho/quay/dem.astro',
    'pages/noi-bo/kho/quay/nhan.astro',
    'pages/noi-bo/kho/quay/yeu-cau/[id].astro',
    'pages/noi-bo/kho/quay/yeu-cau/index.astro',
    'pages/noi-bo/kho/quet.astro',
    'pages/noi-bo/kho/the-kho/[mat_hang_id].astro',
    'pages/noi-bo/kho/ton.astro',
    'pages/noi-bo/kho/xuat/[id].astro',
    'pages/noi-bo/kho/xuat/index.astro',
    // ---- hết gói vận hành ----
    // ---- gói công nợ: công nợ NCC, trả tiền, đối chiếu, trả hàng, MISA ----
    'lib/kho/cong-no.ts',
    'pages/noi-bo/kho/cong-no/[id].astro',
    'pages/noi-bo/kho/cong-no/[id]/doi-chieu.astro',
    'pages/noi-bo/kho/cong-no/[id]/hoa-don-gop.astro',
    'pages/noi-bo/kho/cong-no/[id]/tra-tien.astro',
    'pages/noi-bo/kho/cong-no/index.astro',
    'pages/noi-bo/kho/cong-no/misa.astro',
    'pages/noi-bo/kho/cong-no/no-dau.astro',
    'pages/noi-bo/kho/cong-no/tra-hang.astro',
    // ---- hết gói công nợ ----
    // ---- gói báo cáo: báo cáo, định lượng món, định mức bếp ----
    'components/kho/ChonKy.astro',
    'lib/kho/bao-cao.ts',
    'lib/kho/dinh-luong.ts',
    'pages/noi-bo/kho/bao-cao/[loai].astro',
    'pages/noi-bo/kho/bao-cao/[ten].csv.ts',
    'pages/noi-bo/kho/bao-cao/dinh-muc.astro',
    'pages/noi-bo/kho/bao-cao/index.astro',
    'pages/noi-bo/kho/bao-cao/mua-hang.astro',
    'pages/noi-bo/kho/bao-cao/ncc.astro',
    'pages/noi-bo/kho/bao-cao/so-thanh-toan.astro',
    'pages/noi-bo/kho/bao-cao/theo-thang.astro',
    'pages/noi-bo/kho/cai-dat/dinh-luong.astro',
    // ---- hết gói báo cáo ----
    // ---- gói danh mục: thiết lập, mặt hàng, NCC, vị trí, công thức, cân ----
    'components/kho/FormMatHang.astro',
    'lib/kho/can-tma.ts',
    'lib/kho/cong-thuc.ts',
    'lib/kho/danh-muc.ts',
    'lib/kho/sua-nhanh.ts',
    'lib/kho/thiet-lap.ts',
    'pages/noi-bo/kho/cai-dat/can.astro',
    'pages/noi-bo/kho/cai-dat/cong-thuc.astro',
    'pages/noi-bo/kho/cai-dat/index.astro',
    'pages/noi-bo/kho/cai-dat/ma-vach.astro',
    'pages/noi-bo/kho/cai-dat/mat-hang.astro',
    'pages/noi-bo/kho/cai-dat/mat-hang/sua-nhanh.astro',
    'pages/noi-bo/kho/cai-dat/nha-cung-cap.astro',
    'pages/noi-bo/kho/cai-dat/o-thong-tin.astro',
    'pages/noi-bo/kho/cai-dat/quyen.astro',
    'pages/noi-bo/kho/cai-dat/ton-dau.astro',
    'pages/noi-bo/kho/cai-dat/vi-tri-ly-do.astro',
    // ---- hết gói danh mục ----
    // ---- gói máy & iPOS: nhân viên, máy dùng chung, bán hàng iPOS ----
    'lib/kho/ban-ipos.ts',
    'lib/kho/ipos-dong-bo.ts',
    'lib/kho/ipos-hook.ts',
    'lib/kho/ipos.ts',
    'lib/kho/may-chung.ts',
    'lib/kho/nhan-vien.ts',
    'pages/noi-bo/kho/ban-ipos/ghep.astro',
    'pages/noi-bo/kho/ban-ipos/index.astro',
    'pages/noi-bo/kho/cai-dat/ipos.astro',
    'pages/noi-bo/kho/cai-dat/nhan-vien.astro',
    'pages/noi-bo/kho/may/dang-ky.astro',
    'pages/noi-bo/kho/may/gan.astro',
    'pages/noi-bo/kho/may/index.astro',
    // ---- hết gói máy & iPOS ----
    // ---- gói hướng dẫn: hướng dẫn, quy trình ----
    // ---- hết gói hướng dẫn ----
  ];

  const la = [...CHUA_LAM, ...Object.keys(KHONG_QUET)].filter(f => !TAT_CA.includes(f));
  ok('CHUA_LAM / KHONG_QUET chỉ nhắc file có thật', la.length === 0, la.join(', '));
  const quet = TAT_CA.filter(f => !CHUA_LAM.includes(f) && !(f in KHONG_QUET));
  ok(`Đang kiểm ${quet.length}/${TAT_CA.length} file kho (còn ${CHUA_LAM.length} file chưa dịch)`, quet.length > 0);
  for (const f of quet) {
    const sot = quetChuViet(doc(f), CO_Y);
    ok(f, sot.length === 0, sot.slice(0, 3).map(([n, d]) => `dòng ${n}: ${d.slice(0, 90)}`).join(' | '));
  }
}

// ===========================================================================
nhom('2 · CÂU LỖI DATABASE CỦA KHO CÓ BẢN TIẾNG ANH');
{
  // Gói "câu database" bật cờ này khi lib/kho/cau-kho-en.ts đã đủ câu.
  const DA_DICH_DU = false;
  const KHO = /^(0017|0018|0019|0020|0021|0022|0023|0024|0029_kho|0030|0031|0032|0033|0034|0035|0037|0038|0039|0040|0041|0042|0044_kho)/;
  const tep = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql') && KHO.test(f)).sort();
  const cau = new Map();
  for (const f of tep) {
    const s = readFileSync(join(MIGRATIONS_DIR, f), 'utf8').replace(/--[^\n]*/g, '');
    for (const m of s.matchAll(/raise\s+exception\s+'((?:[^']|'')*)'/gi)) {
      const c = m[1].replace(/''/g, "'");
      if (VIET.test(c) && !cau.has(c)) cau.set(c, f);
    }
  }
  // Postgres thay % bằng giá trị (%% là dấu phần trăm); thử với một giá trị mẫu.
  const mau = c => c.split('%%').map(p => p.replace(/%/g, '12')).join('%');
  const dichDuoc = c => { const en = dichCau('en', mau(c)); return en !== mau(c) && !VIET.test(en.replace(/12/g, '')); };
  const thieu = [...cau.keys()].filter(c => !dichDuoc(c));
  if (DA_DICH_DU) {
    ok(`${cau.size} câu raise exception của ${tep.length} migration kho đều có bản tiếng Anh`,
       cau.size > 400 && thieu.length === 0, thieu.slice(0, 5).map(c => `[${cau.get(c).slice(0, 4)}] ${c}`).join(' | '));
  } else {
    ok(`(đang dịch) ${cau.size - thieu.length}/${cau.size} câu raise exception của kho đã có bản tiếng Anh`, cau.size > 400);
  }
  ok('Câu lỗi chung của kho (cauLoiKho) có bản tiếng Anh',
     Object.values(chung.LOI_KHO_CHUNG).every(c => dichCau('en', c.vi) === c.en));
}

// ===========================================================================
nhom('3 · KHUNG, CÂU BÁO, SỐ, SỰ KIỆN THEO NGÔN NGỮ');
{
  const khung = doc('layouts/Kho.astro');
  ok('Khung kho có nút đổi tiếng (linkDoiNgonNgu) và <html lang={nn}>',
     /linkDoiNgonNgu\(Astro\.url, nn\)/.test(khung) && /class="kho-doi-tieng"/.test(khung) && /<html lang=\{nn\}>/.test(khung));
  const baoKho = doc('components/kho/BaoKho.astro');
  ok('BaoKho: dùng cauEn khi có, còn lại tra dichCau (cả lỗi đọc)',
     /bao\.cauEn/.test(baoKho) && /dichCau\(nn, bao\.cau\)/.test(baoKho) && /dichCau\(nn, loiDoc\)/.test(baoKho));
  ok('Cookie câu báo giữ cauEn qua lần chuyển trang', /cauEn/.test(doc('lib/kho/bao.ts')));
  ok('moTrangKho trả ngôn ngữ (k.nn) từ Astro.locals.nn', /nn: NgonNguNB = Astro\.locals\.nn \?\? 'vi'/.test(doc('lib/kho/trang.ts')));

  ok('kqHai / kqLoi: câu hai thứ tiếng thành KetQua',
     JSON.stringify(chung.kqHai(true, { vi: 'Đã lưu.', en: 'Saved.' })) === '{"ok":true,"cau":"Đã lưu.","cauEn":"Saved."}'
     && chung.kqLoi({ message: 'Lỗi từ database' }).cauEn === undefined
     && chung.kqLoi(null, { vi: 'A', en: 'B' }).cauEn === 'B');

  ok('Số tiếng Anh: dấu chấm thập phân, phẩy ngăn nghìn, ký hiệu ₫',
     chung.dinhDangKg(1.25, 'en') === '1.25' && chung.dinhDangTien(450000, 'en') === '450,000 ₫'
     && chung.dinhDangPhanTram(70.46, 1, 'en') === '70.5%');
  ok('Số tiếng Việt giữ nguyên như cũ',
     chung.dinhDangKg(1.25) === '1,25' && chung.dinhDangTien(450000) === '450.000 đ' && chung.dinhDangPhanTram(70.46) === '70,5%');

  const mau = { nhom: 'van_hanh', ref_id: 'R1', ref2: 'R2', ma: 'X-1', ten: 'Beef', phu: 'kho', so: 3, luc: '2026-09-25T00:00:00Z' };
  const sai = [];
  for (const khoa of viec.KHOA_SU_KIEN) for (const phu of ['kho', 'quay', 'qua_gio', 'loi', 'cham']) {
    const vi = viec.cauSuKien({ ...mau, khoa, phu }), en = viec.cauSuKien({ ...mau, khoa, phu }, 'en');
    if (vi.link !== en.link || vi.muc !== en.muc) sai.push(`${khoa}/${phu}: link hoặc mức khác nhau`);
    if (VIET.test(`${en.tieuDe} ${en.chiTiet ?? ''} ${en.nut}`)) sai.push(`${khoa}/${phu}: ${en.tieuDe}`);
  }
  ok(`Câu sự kiện tiếng Anh: đủ ${viec.KHOA_SU_KIEN.length} khóa, cùng link / mức với tiếng Việt`, sai.length === 0, sai.slice(0, 3).join(' | '));

  const menuThieu = dieuHuong.MUC_KHO.filter(m => !m.ten?.en?.trim() || VIET.test(m.ten.en)).map(m => m.ma);
  ok('Mọi mục menu kho có tên tiếng Anh', menuThieu.length === 0, menuThieu.join(', '));
}

console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA TIẾNG ANH CỦA KHO ĐỀU ĐẠT\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA\x1b[0m`);
  loi.forEach(l => console.log(`  \x1b[31m· ${l}\x1b[0m`));
}
process.exit(hong === 0 ? 0 : 1);
