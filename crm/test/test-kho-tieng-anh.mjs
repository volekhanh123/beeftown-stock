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
 *      kèm lý do. File kho mới cũng bị quét ngay (không có danh sách chờ).
 *   2. Mọi câu raise exception của các migration kho đều có bản tiếng Anh.
 *   3. Khung kho có nút đổi tiếng; câu báo, số, câu sự kiện theo ngôn ngữ.
 *   4. Không có hai mẩu chữ dính nhau vì xuống dòng trong template (dinh-chu.mjs).
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { quetChuViet, VIET } from './quet-chu-viet.mjs';
import { kiemNn, docThuVien } from './kiem-nn.mjs';

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
    // misa.csv.ts KHÔNG còn ở đây: tên cột MISA nằm ở lib/kho/misa.ts; câu lỗi của route có đủ hai thứ tiếng.
    'lib/kho/misa.ts': 'tên cột, mã chứng từ theo mẫu nhập của MISA',
    'lib/kho/may-chung-ma-hoa.ts': 'mã hóa, không có chữ cho người dùng',
  };

  // Chữ Việt CỐ Ý, không phải câu giao diện bị sót. Mỗi dòng một lý do.
  const CO_Y = [
    // gói danh mục — dữ liệu lưu vào database, câu database, mã lọc:
    "(loai === 'tang' ? 'tảng' : 'gói')",                                // danh-muc.ts: đơn vị đếm mặc định lưu vào kho_mat_hang.don_vi_goi
    "loai === 'tang' ? 'tảng' : loai === 'phu_pham' ? 'khay' : 'gói'",   // danh-muc.ts: đơn vị đếm mặc định của hàng mới khi dán Excel
    "String(r.don_vi_goi ?? 'gói')",                                     // sua-nhanh.ts: đơn vị đếm mặc định khi database để trống
    "don_vi_goi: m?.don_vi_goi ?? 'gói'",                                // thiet-lap.ts: đơn vị đếm mặc định khi món không còn trong danh mục
    "`${ct.ten} (bản sao)`",                                             // cong-thuc.ts: tên bản sao lưu vào database (dữ liệu chung)
    "/người khác sửa|thiếu phiên bản/",                                  // sua-nhanh.ts: nhận câu tiếng Việt của kho_sua_nhanh_mat_hang
    "NHOM_CHUA_CO = '(chưa có)'",                                        // sua-nhanh.ts: mã lọc "chưa có nhóm" trên đường dẫn, không hiện
    ".replace(/[đĐ]/g, 'd')",                                            // can-tma.ts: bỏ dấu cho mã tìm kiếm trên cân
    "TEN_PLU_TRONG = 'KHÔNG DÙNG (PLU trống)'",                          // can-tma.ts: tên dòng trống ghi xuống cân (in trên tem), không phải câu màn hình
    "throw new RangeError(`Số PLU của dòng riêng phải từ 1 đến ${PLU_RIENG_TOI_DA}.`)", // can-tma.ts: lỗi lập trình — goHangConLai kiểm số PLU trước khi gọi
    ".replace(/(đ|d|vnd)$/i, '')",              // đọc ô tiền: "450.000đ", "450.000 đ"
    ".replace(/đ/g, 'd').replace(/Đ/g, 'D')",   // bỏ dấu khi sinh mã / tìm không dấu
    // gói máy & iPOS — câu cho máy / log, không hiện trên màn nào:
    // lib/kho/ipos-dong-bo.ts — câu đăng nhập tài khoản máy (chỉ vào log) và log của cron
    // cho người vận hành; test-kho-ipos-web đọc log nguyên văn ("chưa cài", "không đăng
    // nhập được"…). /chưa bật/ nhận câu từ chối của database (kho_ipos_bat_dau).
    "cau: `chưa cài ${TEN_BI_MAT.email} / ${TEN_BI_MAT.matKhau}`",
    "cau: 'chưa nối database'",
    "`tài khoản máy không đăng nhập được: ${error?.message ?? 'không có phiên'}`",
    "`tài khoản máy không đăng nhập được: ${e instanceof Error ? e.message : String(e)}`",
    "ghi(`${dn.cau} — bỏ qua`)",
    "ghi(`không đọc được chi nhánh: ${e1.message}`)",
    "ghi('tài khoản máy không có chi nhánh nào được đồng bộ (vai phải là may_ipos)')",
    "/chưa bật/i.test(kq.cau)",
    "ghi(`lỗi: ${e instanceof Error ? e.message : String(e)}`)",   // cả ipos-hook.ts
    // lib/kho/ipos-hook.ts — thân trả lời HTTP cho iPOS Hub (máy đọc; Hub chỉ xét mã HTTP)
    // và log cho người vận hành; test-kho-ipos-web đọc thân / log nguyên văn.
    "loi: 'Chỉ nhận POST'",
    "loi: `Chưa cài bí mật ${TEN_BI_MAT.khoaCallback}`",
    "loi: 'Không tìm thấy'",
    "loi: 'Không đọc được nội dung'",
    "loi: 'Nội dung quá lớn'",
    "loi: 'Nội dung không phải JSON'",
    "ghi(`bỏ callback hỏng: ${kq.cau}`)",
    "'Máy chủ chưa cài tài khoản đồng bộ'",
    "'Chưa nhận được — thử lại sau'",
    "ghi(`không tìm được chi nhánh: ${e1.message}`)",
    "loi: 'Lỗi máy chủ — thử lại sau'",
    "ghi(`không có chi nhánh nào khớp pos_parent / pos_id của callback (event ${kq.loai === 'hoa_don' ? 11 : 12}) — kiểm tra màn Kết nối iPOS`)",
    "ghi(`không ghi được cờ thực đơn đổi: ${error.message}`)",
    "ghi(`không nhận được hóa đơn: ${error.message}`)",
    "ghi(`database từ chối hóa đơn: ${String(t.canh_bao?.[0]?.loi ?? '').slice(0, 200)}`)",
    "loi: 'Hóa đơn không hợp lệ'",
    "ghi(`đã nhận hóa đơn, lưu ý: ${kq.canhBao.join('; ')}`)",
    // lib/kho/ipos.ts — ghi chú nguồn tài liệu iPOS, và câu của phanTichCallback: chỉ đi vào
    // thân trả lời HTTP cho iPOS Hub và log (ipos-hook.ts), không lên màn nào.
    "nguon: 'Postman \"IPOS HUB API INTERGRATION FOR MERCHANT\" (mục 1 và 6.1)'",
    "cau: 'Nội dung không phải một object JSON'",
    "cau: 'Event 12 thiếu khóa \"item_changed\"'",
    "cau: 'Event 12 thiếu pos_parent hoặc pos_id'",
    "cau: 'Event 11 thiếu khóa \"sale_manager\"'",
    "cau: `Event 11 thiếu ${thieu.join(', ')}`",
    "cau: 'Event 11 không đọc được giờ bán ở khóa \"tran_date\" / \"created_at\"'",
    "cau: 'Event 11: khóa \"items\" không phải danh sách'",
    "cau: 'Event 11 có hơn 500 dòng'",
    "canhBao.push(`${khongMa} dòng thiếu \"item_id\"`)",
    "canhBao.push(`${slHong} dòng thiếu hoặc sai \"quantity\"`)",
    // lib/kho/may-chung.ts — nhãn dòng nhật ký "[qua-tai]" (lib/qua-tai.ts ghiQuaTai) cho người
    // vận hành tìm trong Cloudflare Logs; không lên màn nào. test-qua-tai.mjs đọc nhật ký này.
    "ghiQuaTai('máy dùng chung · đổi phiên', error)",
    "ghiQuaTai('máy dùng chung · đổi phiên', e)",
    "ghiQuaTai('máy dùng chung · đăng nhập', error)",
    "ghiQuaTai('máy dùng chung · đăng nhập', e)",
  ];

  // Mọi file kho đã dịch xong. File kho mới (tự tìm ở trên) được quét ngay —
  // không có danh sách "chưa dịch" nào để trốn. Chữ cố ý thì vào CO_Y, file
  // không có chữ cho người dùng thì vào KHONG_QUET, kèm lý do.
  const CHUA_LAM = [];

  const la = [...CHUA_LAM, ...Object.keys(KHONG_QUET)].filter(f => !TAT_CA.includes(f));
  ok('CHUA_LAM / KHONG_QUET chỉ nhắc file có thật', la.length === 0, la.join(', '));
  const quet = TAT_CA.filter(f => !CHUA_LAM.includes(f) && !(f in KHONG_QUET));
  ok(`Đang kiểm ${quet.length}/${TAT_CA.length} file kho, không còn file nào chưa dịch`, quet.length > 0 && CHUA_LAM.length === 0);
  for (const f of quet) {
    const sot = quetChuViet(doc(f), CO_Y);
    ok(f, sot.length === 0, sot.slice(0, 3).map(([n, d]) => `dòng ${n}: ${d.slice(0, 90)}`).join(' | '));
  }

  // Thư viện đã có bản tiếng Anh mà trang quên truyền nn → màn tiếng Anh vẫn
  // hiện tiếng Việt (bộ quét trên không thấy được). Chỉ kiểm trang, component, khung.
  const tv = docThuVien();
  const giaoDien = quet.filter(f => !f.startsWith('lib/'));
  const sotNn = giaoDien.flatMap(f => kiemNn(doc(f), tv).map(([n, d]) => `${f}:${n} ${d}`));
  ok(`${giaoDien.length} trang / component đã dịch đều truyền nn cho thư viện (${tv.ham.size} hàm có nn, không dùng ${tv.bangCu.size} bảng tên cũ)`,
     sotNn.length === 0, sotNn.slice(0, 6).join(' | '));
}

// ===========================================================================
nhom('2 · CÂU LỖI DATABASE CỦA KHO CÓ BẢN TIẾNG ANH');
{
  // Gói "câu database" bật cờ này khi lib/kho/cau-kho-en.ts đã đủ câu.
  const DA_DICH_DU = true;
  // Giữ giống hệt danh sách ở test-noi-bo-tieng-anh.mjs — bên đó kiểm các migration còn lại.
  const KHO = /^(0017|0018|0019|0020|0021|0022|0023|0024|0029_kho|0030|0031|0032|0033|0034|0035|0037|0038|0039|0040|0041|0042|0044_kho|0048_kho|0049_kho|0050_kho|0051_kho|0054_kho|0061_kho|0072_kho|0075_kho|0076_kho)/;
  const tep = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql') && KHO.test(f)).sort();
  // Quên thêm migration kho vào KHO thì câu hàm kho trả về của nó không ai kiểm (0048–0051, 0054 đã lọt).
  const sotKho = readdirSync(MIGRATIONS_DIR).filter(f => /^\d{4}_kho_.*\.sql$/.test(f) && !KHO.test(f));
  ok('Mọi migration kho (tên 00NN_kho_…) nằm trong danh sách KHO', sotKho.length === 0,
     `thêm vào KHO ở đây và ở test-noi-bo-tieng-anh.mjs: ${sotKho.join(', ')}`);
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

  // ---- Câu hàm kho TRẢ VỀ / GHI vào bảng cho người đọc (không phải raise) -------------
  // Câu báo xong việc, lý do dòng bán iPOS, ghi chú sổ kho / phiếu, cảnh báo, lỗi từng dòng…
  // Thư viện hiện chúng qua KetQua.cau hoặc in thẳng — màn tiếng Anh tra dichCau().
  //   (a) format('…') có chữ Việt: tự trích, %s %I %L là chỗ giá trị (chưa hàm kho nào dùng);
  //   (b) câu ghép bằng || và chuỗi cố định: danh sách TRA_VE, viết như lúc chạy, % ở chỗ giá trị;
  //   (c) mọi chuỗi tiếng Việt khác của migration kho phải nằm trong một câu của TRA_VE — trừ dữ
  //       liệu (dòng mẫu kho_mat_hang / kho_vi_tri / kho_ly_do, mặc định cột), các hàm ở
  //       HAM_KHONG_TRA (lý do kèm theo) và chuỗi so khớp nội bộ.
  const dinhDang = [];
  for (const f of tep) {
    const s = readFileSync(join(MIGRATIONS_DIR, f), 'utf8').replace(/--[^\n]*/g, '');
    for (const m of s.matchAll(/\bformat\s*\(\s*'((?:[^']|'')*)'/gi)) {
      const c = m[1].replace(/''/g, "'");
      if (VIET.test(c)) dinhDang.push(c.split('%%').map(p => p.replace(/%(\d+\$)?-?(\d+|\*)?[sIL]/g, '%')).join('%%'));
    }
  }
  const thieuDD = dinhDang.filter(c => !dichDuoc(c));
  ok(`${dinhDang.length} mẫu format() có chữ Việt của migration kho đều có bản tiếng Anh`,
     thieuDD.length === 0, thieuDD.slice(0, 5).join(' | '));

  const TRA_VE = [
    // 0020 — phiếu nhập: câu báo, ghi chú sổ kho
    'Phiếu % đã được gửi duyệt trước đó.', 'Đã gửi phiếu % chờ quản lý duyệt.', 'Phiếu % đang là bản nháp.',
    'Đã rút phiếu % về để sửa.', 'Phiếu % đã được duyệt trước đó.', 'Đã duyệt phiếu %: % lô hàng đã vào kho.',
    'Phiếu % đã bị từ chối trước đó.', 'Đã từ chối phiếu %.', 'Phiếu % đã bị hủy trước đó.', 'Đã hủy phiếu nháp %.',
    'Hủy phiếu nhập', 'Đã hủy phiếu % và trả tồn về như trước khi nhập.',
    // 0022 — pha lóc: cảnh báo, câu báo, ghi chú sổ kho
    'Chưa có giá bán: % — phiên này chia giá vốn theo kg', 'Phụ phẩm chưa có giá trị thu hồi (tính 0 đ): %',
    'Không giữ lại phần nào — toàn bộ giá vốn đầu vào thành tổn thất', 'Phiên % đã được chốt trước đó.',
    'Pha lóc chuyển thẳng bếp', 'Đã chốt phiên %: thu hồi %, % lô mới.', 'Phiên % đang mở để sửa.',
    'Mở lại phiên pha lóc', 'Đã mở lại phiên % — tồn đã trả về như trước khi chốt. Sửa xong nhớ chốt lại.',
    'Phiên % đã bị hủy trước đó.', 'Đã hủy phiên nháp %.',
    // 0023 — báo hủy, kiểm kê
    'Đã duyệt hủy %: % kg.', 'Từ chối hủy — trả về chỗ cũ', 'Đã từ chối % — hàng đã về lại chỗ cũ.',
    'Phiếu % đã gửi, đang chờ duyệt.', 'Đã gửi %: % dòng lệch sổ, chờ quản lý duyệt.',
    'Đã duyệt %: % dòng điều chỉnh, ghi bán % gói (% kg).', 'Đã duyệt %: % dòng điều chỉnh.',
    'Đã trả % về để đếm lại.', 'Đã hủy phiếu kiểm kê %.',
    // 0024 — đối chiếu hóa đơn, thanh toán, ghi chú giảm trừ khi trả hàng
    'Đã đối chiếu % với hóa đơn %: khớp phiếu.',
    'Đã đối chiếu % với hóa đơn %: LỆCH % đ so với phiếu — công nợ tính theo hóa đơn.', 'Khoản % đã bị hủy trước đó.',
    'Đã hủy % — công nợ các phiếu liên quan đã trở lại như trước.', 'Trả hàng % của phiếu %',
    // 0031 — xem thử pha lóc (thủ kho), gửi duyệt
    'Chưa chọn tảng nào đem pha', 'Chưa nhập phần nào cắt ra', 'Tổng kg ra lớn hơn kg vào — kiểm lại số cân',
    'Đã gửi phiếu % chờ duyệt.',
    // 0032 — quầy, hàng thiếu, hủy chuyến, đọc nhãn cân, quét kiểm kê
    'Yêu cầu % đã hủy trước đó.', 'Đã hủy yêu cầu %.', 'Theo yêu cầu %', 'Đã ghi nhận hàng của phiếu %.',
    'Đã nhận %: % gói. Thiếu % gói (% kg) — đã báo quản lý.', 'Đã nhận đủ %: % gói (% kg).',
    'Phiếu % đã được xử lý trước đó.', 'Mất khi mang ra quầy: %', 'Mất khi mang ra quầy', 'Nhận thiếu — trả về kho',
    'Đã trả % gói thiếu của % về kho.', 'Đã ghi mất % gói (% kg) của %.', 'Phiếu % đã hủy trước đó.',
    'Hủy chuyến — hàng về lại chỗ cũ', 'Đã hủy % — % gói đã về lại chỗ cũ.', 'Mẫu mã vạch trong Cài đặt không hợp lệ',
    'Không phải mã 13 số', 'Sai số kiểm tra — quét lại', 'Không phải nhãn cân (đầu mã không khớp mẫu)',
    'Mã hàng trên nhãn bằng 0', 'Trọng lượng trên nhãn bằng 0', 'Mã hàng % chưa gán cho món nào — báo quản lý',
    '"%" tính theo kg mà nhãn không có kg — nhập số kg bằng tay',
    // 0033 — quét nhãn pha lóc, chốt thu hồi thấp, thẻ kho
    '"%" là hàng đem pha, không phải phần cắt ra', 'Nhãn "%" không có số kg — cân lại in nhãn có kg',
    '"%" đã ghi bằng tay — xóa dòng đó rồi quét lại',
    'Đã chốt phiên %: thu hồi %, % lô mới. Thu hồi thấp hơn dự kiến (%) — đã báo quản lý.',
    'Phiên % đã được xem trước đó.', 'Đã ghi nhận: đã xem kết quả phiên %.', 'Tồn đầu kỳ', 'Nhập', 'Đem pha lóc',
    'Pha lóc ra', 'Chuyển đi', 'Chuyển đến', 'Bán', 'Xuất bếp', 'Hủy', 'Chênh lệch kiểm kê', 'Hao hụt cân',
    'Đảo ngược', 'Trả nhà cung cấp', 'Xuất khác', 'Khai tồn đầu kỳ',
    // 0034 — nhật ký máy dùng chung
    'gỡ % người', '5 lần sai liên tiếp', '% lần sai trong 30 phút', '% lần sai trong 24 giờ',
    // 0035 — nợ đầu kỳ
    'Đã hủy nợ đầu kỳ %.',
    // 0037 — iPOS: ghi chú sổ kho, lý do dòng bán, lý do không đồng bộ, câu trạng thái
    'Tự nhận khi iPOS báo đã bán', 'HĐ iPOS sửa / hủy', 'Hóa đơn đã hủy trên iPOS',
    'Chưa chuyển sang trừ kho theo iPOS', 'Bán trước mốc chuyển sang iPOS — đã tính trong lần đếm quầy',
    'Không phải hàng kho', 'Mã cân (không đọc được) chưa gán cho món nào', 'Mã cân % chưa gán cho món nào',
    'Chưa ghép mã iPOS với món trong kho', 'Quầy không đủ "%" trên sổ: cần %', 'Lệch kg nhãn cân · iPOS %',
    'Đã bán gói thuộc lô HẾT HẠN', 'Đồng bộ iPOS chưa bật ở chi nhánh này',
    'Chưa cấu hình đủ kết nối iPOS: thiếu đường dẫn lấy hóa đơn, quầy bán',
    'Chưa cấu hình đủ kết nối iPOS: thiếu %, đường dẫn lấy hóa đơn, quầy bán',
    'Chưa cấu hình đủ kết nối iPOS: thiếu đường dẫn lấy hóa đơn',
    'Chưa cấu hình đủ kết nối iPOS: thiếu %, đường dẫn lấy hóa đơn', 'Chưa cấu hình đủ kết nối iPOS: thiếu quầy bán',
    'Chưa cấu hình đủ kết nối iPOS: thiếu %, quầy bán', 'Chưa cấu hình đủ kết nối iPOS: thiếu %',
    'Đang có một lượt đồng bộ chạy — đợi ít phút', 'Quá 10 phút không xong — coi như hỏng',
    'Vừa cập nhật xong — đợi 1 phút rồi bấm lại', 'Dòng đã bỏ khỏi hóa đơn trên iPOS', 'Quản lý bỏ qua',
    'Hàng ngoài sổ: %', 'Chưa bật đồng bộ iPOS.', 'Chưa cấu hình đủ kết nối iPOS.',
    'Lần đồng bộ gần nhất bị lỗi — số bán chưa cập nhật.', 'Hơn 30 phút chưa đồng bộ được iPOS.',
    'Đang đọc iPOS nhưng CHƯA trừ kho — còn dùng đếm quầy làm số bán.',
    'Có dòng bán chưa trừ được kho — mở Bán hàng iPOS để xử lý.', 'Kho đang tự trừ theo iPOS.',
    // 0038 — lỗi từng dòng khi dán định lượng món
    'Dòng %: không đọc được', 'Dòng %: thiếu tên hoặc mã món', 'Dòng %: tên món dài quá (tối đa 120 chữ)',
    'Dòng %: thiếu mặt hàng', 'Dòng %: có % mặt hàng tên "%" — ghi mã mặt hàng',
    'Dòng %: không tìm thấy mặt hàng "%" — ghi đúng mã, mã cân hoặc tên',
    'Dòng %: gram "%" không phải số (ví dụ 150 hoặc 150,5)', 'Dòng %: gram phải lớn hơn 0 và không quá 10.000',
    'Dòng %: trùng với dòng % (cùng món, cùng mặt hàng)',
    // 0039 — đặt hàng
    'Đã lưu mức kho lạnh của %.', 'Đơn % đã được gửi trước đó.', 'Đã gửi đơn % cho %. In hoặc lưu PDF để gửi Zalo.',
    'Đơn % đã hủy trước đó.', 'Đã hủy đơn %.', 'Nhận theo đơn %. Ghi hạn dùng theo nhãn cho: %', 'Nhận theo đơn %',
    // 0040 — hóa đơn gộp, trả hàng chờ tiền, sổ công nợ theo kỳ
    'Hóa đơn gộp % (% phiếu) — lệch: %', 'Hóa đơn gộp % (% phiếu)', 'Hóa đơn gộp % đã được bỏ đối chiếu trước đó.',
    'Đã bỏ đối chiếu hóa đơn gộp % — % phiếu trở lại như trước khi đối chiếu.', 'Hủy phiếu trả hàng chờ xác nhận',
    'Đã hủy phiếu trả hàng % — % lô đã về lại chỗ cũ.', 'Nợ đầu kỳ (lúc bắt đầu dùng phần mềm)', 'Nhập hàng',
    'Số dư đầu kỳ', 'Số dư cuối kỳ',
    // 0041 — sửa nhanh mặt hàng, nhãn báo cáo
    'Chưa đổi ô nào — không có gì để lưu.', 'Dòng % không đúng dạng.', 'Dòng %: thiếu mặt hàng.',
    'Một món được gửi hai lần trong cùng một lần lưu.', 'Không tìm thấy món này — có thể đã bị xóa. Tải lại trang.',
    '%: thiếu phiên bản của dòng — tải lại trang rồi sửa lại.',
    '%: vừa được người khác sửa lúc % — tải lại trang để xem số mới rồi sửa lại.',
    '%: giá bán/kg phải là số đồng, ví dụ 650000.', '%: hạn dùng là số ngày, từ 1 đến 3650.',
    '%: mã cân là dãy số (tối đa 6 số), đúng như mã hàng cài trên cân.',
    '%: số gói tối thiểu ở quầy là số nguyên, từ 0.', '%: số gói tối đa ở quầy là số nguyên, từ 1.',
    '%: tồn tối thiểu là số kg, ví dụ 2,5.', '%: mức tối thiểu kho lạnh là số kg, ví dụ 20 hoặc 12,5.',
    '%: mức tối đa kho lạnh là số kg lớn hơn 0 (bỏ trống nếu không dùng).',
    '%: sau pha để ở "kho" (kho lạnh) hoặc "quay" (quầy).', '%: chọn "Đang dùng" hoặc "Ngưng dùng".',
    '%: số gói tối đa ở quầy phải từ % (số gói tối thiểu) trở lên.',
    '%: mức tối thiểu kho lạnh không được lớn hơn mức tối đa.', '%: mã cân % đang dùng cho "%".',
    'Chưa lưu món nào: % ô cần sửa (xem chữ đỏ ở từng dòng).', 'Đã lưu % món.', 'Không ghi nhà cung cấp', 'Trả tiền',
    'Giảm trừ', 'Bù trừ', 'NCC hoàn tiền', 'Chuyển khoản', 'Tiền mặt', 'Khác',
    // 0042 — iPOS gửi hóa đơn sang
    'Món chế biến — chỉ đếm suất, không trừ kho', 'Lệch kg bán theo cân · iPOS %',
    'Lần cập nhật gần nhất bị lỗi — bấm "Cập nhật ngay" để thử lại.',
    'Đã hơn % giờ trong giờ mở cửa không nhận được hóa đơn nào từ iPOS — kiểm tra máy iPOS và địa chỉ nhận hóa đơn.',
    'Đang nhận hóa đơn iPOS nhưng CHƯA trừ kho — còn dùng đếm quầy làm số bán.',
    // 0049 — giải phóng ô mã, quét nhãn ô không giao cho phiên lóc
    'Đã giải phóng ô % (mã %).', 'Ô % (mã %) đã trống từ trước.',
    'Mã ô % không giao cho phiên này — bấm "Giao ô mã" rồi in bằng đúng phím trên cân',
    // 0050 — ghi chú phiếu huỷ khi huỷ cả tảng (kèm ghi chú của người báo, nếu có)
    'Huỷ cả tảng #%: %', 'Huỷ cả tảng #%',
    // 0051, 0054 — dòng bán iPOS theo ô mã lệch ô
    'Ô % (mã %): ô chưa gắn tảng lúc bán — đã trừ theo hạn gần nhất',
    'Ô % (mã %): lô của tảng không đủ — đã trừ theo hạn gần nhất',
    // 0054 — bật / tắt mã giảm giá; giá trị thứ hai của câu bật gồm cả dấu phần trăm (30%)
    'Đã bật mã % (giảm %).',
    'Đã tắt mã %. Lần gửi xuống cân sau sẽ bỏ hàng này (qua WiFi thì còn nằm trên cân, nạp USB để xoá hẳn).',
    // câu rộng (tiền tố + giá trị) — thẻ kho
    'Nhập từ %', 'Pha lóc %',
  ];
  // 0037 raise "Chưa ghi được: %" — giá trị là lý do đã ghi vào kho_ipos_dong.ly_do (hoặc câu lỗi
  // của raise bên trong kho_ipos_ghi_dong): mỗi lý do một câu.
  for (const x of [
    'Hóa đơn đã hủy trên iPOS',
    'Chưa chuyển sang trừ kho theo iPOS',
    'Bán trước mốc chuyển sang iPOS — đã tính trong lần đếm quầy',
    'Không phải hàng kho',
    'Món chế biến — chỉ đếm suất, không trừ kho',
    'Mã cân (không đọc được) chưa gán cho món nào',
    'Mã cân % chưa gán cho món nào',
    'Chưa ghép mã iPOS với món trong kho',
    'Quầy không đủ "%" trên sổ: cần %',
    'Chưa chọn quầy bán trong Kết nối iPOS',
    'Số gói bán phải lớn hơn 0',
    '"%" tính theo kg mà dòng iPOS không có số kg',
    'Số lượng bán trên iPOS phải lớn hơn 0',
    'iPOS báo bán % gói "%" — số gói phải là số nguyên. Món này bán theo kg thì đổi "Bán theo" ở Ghép món',
    '"%" tính theo kg mà iPOS bán theo gói — điền "mỗi gói = … kg" ở Ghép món',
  ]) TRA_VE.push(`Chưa ghi được: ${x}`);
  // 0040 kho_cong_no_theo_ky — diễn giải dòng thanh toán: nhãn [+ ": ghi chú"] + " — phiếu …".
  for (const n of ['Trả tiền', 'Trả tiền (chuyển khoản)', 'Trả tiền (tiền mặt)', 'Giảm trừ', 'Bù trừ công nợ',
                   'Nhà cung cấp hoàn tiền', 'Nhà cung cấp hoàn tiền (chuyển khoản)', 'Nhà cung cấp hoàn tiền (tiền mặt)']) {
    TRA_VE.push(`${n}: % — phiếu %`, `${n} — phiếu %`);
  }
  const thieuTV = TRA_VE.filter(c => !dichDuoc(c));
  ok(`${TRA_VE.length} câu hàm kho trả về / ghi cho người đọc đều có bản tiếng Anh`,
     TRA_VE.length > 150 && thieuTV.length === 0, thieuTV.slice(0, 5).join(' | '));

  const HAM_KHONG_TRA = {   // hàm có chuỗi tiếng Việt không tra bảng — kèm lý do
    kho_du_lieu_misa: 'nội dung file nhập MISA — phải đúng mẫu tiếng Việt của MISA',
    kho_goi_y_dat_hang: 'lời giải thích gợi ý đặt hàng — lib/kho/dat-hang.ts cauGoiYDat dựng câu tiếng Anh từ các cột số',
  };
  const NOI_BO = ['đĐ', 'cơm nhân viên'];   // so khớp trong SQL, không hiện cho ai
  const chuaPhu = new Set();
  let soChuoi = 0;
  for (const f of tep) {
    const s = readFileSync(join(MIGRATIONS_DIR, f), 'utf8').replace(/--[^\n]*/g, '');
    const cacHam = [...s.matchAll(/create\s+(?:or\s+replace\s+)?function\s+(\w+)/gi)];
    for (const m of s.matchAll(/'((?:[^']|'')*)'/g)) {
      const c = m[1].replace(/''/g, "'");
      if (!VIET.test(c)) continue;
      const lenh = s.slice(Math.max(s.lastIndexOf(';', m.index), s.lastIndexOf('$$', m.index)) + 1, m.index);
      if (/\braise\s+(exception|notice|warning|info|log|debug)\b/i.test(lenh) || /^\s*comment\s+on\b/i.test(lenh)) continue;
      if (/\binsert\s+into\s+kho_(mat_hang|vi_tri|ly_do)\b/i.test(lenh) || /\bdefault\s*$/i.test(lenh)) continue;
      if (Object.hasOwn(HAM_KHONG_TRA, cacHam.filter(h => h.index < m.index).pop()?.[1] ?? '') || NOI_BO.includes(c)) continue;
      soChuoi++;
      if (!TRA_VE.some(t => t.includes(c))) chuaPhu.add(`[${f.slice(0, 4)}] ${c}`);
    }
  }
  ok(`${soChuoi} chuỗi tiếng Việt khác của migration kho đều nằm trong một câu đã dịch`,
     soChuoi > 300 && chuaPhu.size === 0, [...chuaPhu].slice(0, 5).join(' | '));
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

// ===========================================================================
nhom('4 · KHÔNG DÍNH CHỮ KHI XUỐNG DÒNG');
{
  // Astro 7 (compressHTML 'jsx') bỏ khoảng trắng có xuống dòng giữa hai nút: câu
  // tách thành {t.a}⏎{t.b} hiện "Câu một.Câu hai." — xem dinh-chu.mjs.
  const { timChoDinh } = await import('./dinh-chu.mjs');
  const moiAstro = thu => readdirSync(join(WEB, thu)).flatMap(f => {
    const p = join(thu, f);
    return statSync(join(WEB, p)).isDirectory() ? moiAstro(p) : p.endsWith('.astro') ? [p.split(sep).join('/')] : [];
  });
  const tep = ['layouts/Kho.astro', ...moiAstro('components/kho'), ...moiAstro('pages/noi-bo/kho')];
  const sot = [];
  for (const f of tep) for (const x of await timChoDinh(doc(f))) sot.push(`${f}:${x.dong} [${x.nn}] «${x.mau.replace(/\s+/g, ' ')}»`);
  ok(`${tep.length} file .astro của kho: không có hai mẩu chữ dính nhau vì xuống dòng (cả vi và en)`, sot.length === 0,
     `${sot.slice(0, 4).join(' | ')} — viết hai mẩu trên cùng dòng, cách một dấu cách, hoặc thêm {' '}`);
}

console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA TIẾNG ANH CỦA KHO ĐỀU ĐẠT\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA\x1b[0m`);
  loi.forEach(l => console.log(`  \x1b[31m· ${l}\x1b[0m`));
}
process.exit(hong === 0 ? 0 : 1);
