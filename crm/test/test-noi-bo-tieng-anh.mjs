/**
 * BEEFTOWN — Kiểm thử tiếng Anh của phần mềm nội bộ (phần CRM)
 * ============================================================
 * Giao diện nội bộ có hai thứ tiếng (web/src/lib/ngon-ngu-noi-bo.ts): câu của
 * trang nằm ngay trong trang dạng { vi, en }; câu thông báo đến từ thư viện
 * và database thì đi qua dichCau() (web/src/lib/cau-noi-bo.ts).
 *
 *     node test/test-noi-bo-tieng-anh.mjs
 *
 * Ba bất biến, để câu mới thêm về sau không lặng lẽ hiện tiếng Việt trên màn
 * tiếng Anh:
 *   1. Mọi câu raise exception của các migration phần CRM đều có bản tiếng Anh.
 *   2. Mọi lý do máy dịch hỏng / bị chặn (lưu trong sổ bản dịch) đều có bản
 *      tiếng Anh, và câu đăng nhập cũng vậy.
 *   3. Các màn CRM và thư viện của chúng không còn chữ Việt nào nằm ngoài cặp
 *      { vi, en } — trừ vài chỗ cố ý, liệt kê kèm lý do ở CO_Y.
 *
 * Phần kho kiểm ở test-kho-tieng-anh.mjs (cùng bộ quét quet-chu-viet.mjs).
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOC = join(__dirname, '..', '..');
const WEB = join(GOC, 'web', 'src');
const MIGRATIONS_DIR = join(GOC, 'crm', 'supabase', 'migrations');

const { dichCau } = await import(join(WEB, 'lib', 'cau-noi-bo.ts'));
const { quetChuViet } = await import('./quet-chu-viet.mjs');
const { CAM } = await import(join(WEB, 'lib', 'chuoi-cam.js'));

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

const VIET = /[ạảãàáâậầấẩẫăắằẳẵặẹẻẽèéêệềếểễịỉĩìíọỏõòóôộồốổỗơợờớởỡụủũùúưựừứửữỵỷỹỳýđĐẠẢÃÀÁÂẬẦẤẨẪĂẮẰẲẴẶẸẺẼÈÉÊỆỀẾỂỄỊỈĨÌÍỌỎÕÒÓÔỘỒỐỔỖƠỢỜỚỞỠỤỦŨÙÚƯỰỪỨỬỮỴỶỸỲÝ]/;

/** Câu tiếng Anh "dịch được" nghĩa là: khác câu gốc và không còn dấu tiếng Việt. */
function dichDuoc(cau) {
  const en = dichCau('en', cau);
  return en !== cau && !VIET.test(en);
}

console.log('\x1b[1m\nBEEFTOWN — TIẾNG ANH CỦA PHẦN MỀM NỘI BỘ (CRM)\x1b[0m');
console.log('='.repeat(60));

// ===========================================================================
nhom('1 · CÂU LỖI DATABASE PHẦN CRM CÓ BẢN TIẾNG ANH');
{
  // Migration phần kho kiểm ở test-kho-tieng-anh.mjs (chặt hơn: cả câu hàm kho trả về). Danh
  // sách giữ giống hệt bên đó — migration kho mới (tên 00NN_kho_…) thêm vào cả hai.
  const KHO = /^(0017|0018|0019|0020|0021|0022|0023|0024|0029_kho|0030|0031|0032|0033|0034|0035|0037|0038|0039|0040|0041|0042|0044_kho|0048_kho|0049_kho|0050_kho|0051_kho|0054_kho|0061_kho)/;
  const tep = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql') && !KHO.test(f)).sort();
  const cau = new Map();
  for (const f of tep) {
    const s = readFileSync(join(MIGRATIONS_DIR, f), 'utf8').replace(/--[^\n]*/g, '');
    // Chỉ raise exception: raise notice là tin cho người chạy migration, không lên trang.
    for (const m of s.matchAll(/raise\s+exception\s+'((?:[^']|'')*)'/gi)) {
      const c = m[1].replace(/''/g, "'");
      if (VIET.test(c) && !cau.has(c)) cau.set(c, f);
    }
  }
  // Postgres thay % bằng giá trị (%% là dấu phần trăm); thử với một giá trị mẫu.
  const mau = c => c.split('%%').map(p => p.replace(/%/g, '12')).join('%');
  const thieu = [...cau.keys()].filter(c => !dichDuoc(mau(c)));
  ok(`${cau.size} câu raise exception của ${tep.length} migration CRM đều có bản tiếng Anh`,
     cau.size > 40 && thieu.length === 0,
     thieu.map(c => `[${cau.get(c).slice(0, 4)}] ${c}`).join(' | '));
}

// ===========================================================================
nhom('2 · LÝ DO DỊCH HỎNG / BỊ CHẶN VÀ CÂU ĐĂNG NHẬP');
{
  const thieu = CAM.filter(c => !dichDuoc(c.vi_sao)).map(c => c.vi_sao);
  ok(`${CAM.length} lý do của bộ lọc chữ cấm đều có bản tiếng Anh`,
     CAM.length > 10 && thieu.length === 0, thieu.join(' | '));

  // Câu lỗi của máy dịch: mọi chuỗi có dấu tiếng Việt trong may-dich.ts, trừ
  // bản quy tắc gửi cho Gemini (QUY_TAC_DICH — phải giữ nguyên chữ Việt).
  const md = readFileSync(join(WEB, 'lib', 'may-dich.ts'), 'utf8')
    .replace(/export const QUY_TAC_DICH = `[\s\S]*?`;/, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  const chuoi = [...md.matchAll(/'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)]
    .map(m => (m[1] ?? m[2]).replace(/\$\{e instanceof Error[^}]*\}/g, 'fetch failed')
      .replace(/\$\{kem\}/g, ': detail').replace(/\$\{[^}]*\}/g, '12'))
    .filter(c => VIET.test(c));
  const thieuMay = chuoi.filter(c => !dichDuoc(c));
  ok(`${chuoi.length} câu lỗi của máy dịch đều có bản tiếng Anh`,
     chuoi.length >= 15 && thieuMay.length === 0, thieuMay.join(' | '));

  // Mẫu "Dính chữ cấm": lý do bên trong cũng phải ra tiếng Anh.
  const chan = dichCau('en', `Dính chữ cấm "charcoal": ${CAM.find(c => /than/.test(c.vi_sao)).vi_sao}`);
  ok('Câu "Dính chữ cấm" dịch cả lý do bên trong', !VIET.test(chan), chan);

  const phien = readFileSync(join(WEB, 'lib', 'phien.ts'), 'utf8');
  const dangNhap = phien.slice(phien.indexOf('export async function dangNhap'));
  const cauDN = [...dangNhap.slice(0, dangNhap.indexOf('\n}')).matchAll(/return '([^']+)'/g)].map(m => m[1]);
  ok(`${cauDN.length} câu lỗi đăng nhập đều có bản tiếng Anh`,
     cauDN.length >= 3 && cauDN.every(dichDuoc), cauDN.filter(c => !dichDuoc(c)).join(' | '));

  ok('Tiếng Việt giữ nguyên câu gốc', dichCau('vi', 'Email hoặc mật khẩu không đúng.') === 'Email hoặc mật khẩu không đúng.');
  ok('Câu chưa có bản dịch thì hiện nguyên tiếng Việt, không trống',
     dichCau('en', 'Một câu chưa ai dịch.') === 'Một câu chưa ai dịch.');
}

// ===========================================================================
nhom('3 · MÀN CRM KHÔNG CÒN CHỮ VIỆT NGOÀI CẶP { vi, en }');
{
  const TEP = [
    'layouts/NoiBo.astro',
    'pages/noi-bo/index.astro', 'pages/noi-bo/dang-nhap.astro', 'pages/noi-bo/dat-ban.astro',
    'pages/noi-bo/noi-dung.astro', 'pages/noi-bo/tuyen-dung.astro', 'pages/noi-bo/cai-dat.astro',
    'pages/noi-bo/tin-tuyen-dung/index.astro', 'pages/noi-bo/tin-tuyen-dung/[id].astro',
    'lib/cong-tac.ts', 'lib/tin-tuyen-dung.ts', 'lib/cai-dat.ts', 'lib/ban-dich.ts',
    'lib/truong-form.ts', 'lib/ngon-ngu-noi-bo.ts',
    // Gửi tin Zalo (0047): ba màn + nhãn dùng chung.
    'pages/noi-bo/zalo/index.astro', 'pages/noi-bo/zalo/chien-dich/moi.astro', 'pages/noi-bo/zalo/cai-dat.astro',
    'lib/zalo-trang.ts', 'lib/zalo-bao.ts',
    // Bot Messenger (0053): màn cài đặt + câu báo sau chuyển hướng.
    'pages/noi-bo/messenger.astro', 'lib/messenger-bao.ts',
    // Bảng sức khỏe hệ thống (0055) trên trang Tổng quan.
    'lib/suc-khoe.ts', 'components/SucKhoeHeThong.astro',
    // Báo động (0060): câu của tin báo gửi chủ nhà hàng.
    'lib/bao-dong-tin.ts',
    // Bản đồ chức năng: menu hai khung, trang Tất cả chức năng, ô tìm.
    'lib/dieu-huong-noi-bo.ts', 'lib/ban-do-chuc-nang.ts',
    'pages/noi-bo/chuc-nang.astro', 'components/BanDoChucNang.astro', 'components/OTimChucNang.astro',
  ];
  // Chữ Việt CỐ Ý, không phải câu giao diện bị sót. Mỗi dòng một lý do.
  const CO_Y = [
    "'Sẵn sàng công bố'",            // so với giá trị vuong_gi của view v_mon_con_vuong
    "'Beeftown Quận 1'",             // tên chi nhánh gợi ý — dữ liệu, không phải nhãn
    'Phụ bếp ca tối',                // ví dụ tên vị trí: ô ten_vi phải gõ tiếng Việt
    '3 bậc · Hướng lên quản lý cửa hàng', 'Ca tối 16:00–22:00', // như trên
    '[chờ duyệt]',                   // đúng chuỗi database coi là chưa viết xong
    'đ/{',                           // ký hiệu đồng trong "đ/giờ"
    'không có quyền|chỉ chủ sở hữu', // biểu thức nhận câu lỗi database
    "m.includes('quyền') || m.includes('chủ sở hữu')",
    ".replace(/đ/g, 'd')", ".replace(/Đ/g, 'D')", // bỏ dấu khi sinh mã tin
    "'Tiếng Việt'",                  // chữ trên nút đổi sang tiếng Việt
  ];
  for (const t of TEP) {
    const sot = quetChuViet(readFileSync(join(WEB, t), 'utf8'), CO_Y);
    ok(`${t}`, sot.length === 0, sot.slice(0, 3).map(([n, d]) => `dòng ${n}: ${d.slice(0, 90)}`).join(' | '));
  }
  // Câu tách thành {t.a}⏎{t.b} thì Astro bỏ dấu cách ở giữa — xem dinh-chu.mjs.
  const { timChoDinh } = await import('./dinh-chu.mjs');
  const dinh = [];
  for (const t of TEP.filter(t => t.endsWith('.astro'))) {
    for (const x of await timChoDinh(readFileSync(join(WEB, t), 'utf8'))) dinh.push(`${t}:${x.dong} [${x.nn}] «${x.mau.replace(/\s+/g, ' ')}»`);
  }
  ok('Màn CRM không có hai mẩu chữ dính nhau vì xuống dòng (cả vi và en)', dinh.length === 0, dinh.slice(0, 4).join(' | '));
}

// ===========================================================================
nhom('4 · NÚT ĐỔI TIẾNG VÀ COOKIE');
{
  const mw = readFileSync(join(WEB, 'middleware.ts'), 'utf8');
  const truocDangNhap = mw.indexOf("searchParams.get('nn')") < mw.indexOf('MO_CHO_MOI_NGUOI.includes');
  ok('Middleware đổi tiếng TRƯỚC khi kiểm đăng nhập (trang đăng nhập cũng đổi được)', truocDangNhap);
  ok('Đổi tiếng chuyển về đúng đường dẫn đang mở, bỏ ?nn= (không có tham số "quay về đâu")',
     /ve\.searchParams\.delete\('nn'\)/.test(mw) && /redirect\(ve\.pathname \+ ve\.search/.test(mw));
  const layout = readFileSync(join(WEB, 'layouts', 'NoiBo.astro'), 'utf8');
  ok('Khung NoiBo có nút đổi tiếng và <html lang> theo ngôn ngữ',
     /linkDoiNgonNgu\(Astro\.url, nn\)/.test(layout) && /<html lang=\{nn\}>/.test(layout));
  const nn = readFileSync(join(WEB, 'lib', 'ngon-ngu-noi-bo.ts'), 'utf8');
  ok('Cookie ngôn ngữ chỉ sống dưới /noi-bo và httpOnly',
     /path: '\/noi-bo'/.test(nn) && /httpOnly: true/.test(nn));
}

// ===========================================================================
console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA TIẾNG ANH NỘI BỘ ĐỀU ĐẠT\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA\x1b[0m`);
  loi.forEach(l => console.log(`  \x1b[31m· ${l}\x1b[0m`));
}
process.exit(hong === 0 ? 0 : 1);
