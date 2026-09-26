/**
 * BEEFTOWN KHO — Kiểm thử phần web của màn Thiết lập và tồn đầu kỳ dạng lưới (GĐ5e)
 * ===============================================================================
 *
 *     node test/test-kho-thiet-lap-web.mjs
 *
 * Hàm thuần trong web/src/lib/kho/thiet-lap.ts — không cần database. Chỗ nào
 * phải khớp luật của database (bước bỏ qua được, ai bấm được "Bỏ qua", khoảng
 * ngưỡng) thì so với đúng thân hàm trong migration 0035 / 0030.
 *
 *   · Tiến độ: đọc kết quả thô đúng thứ tự, câu "Còn N bước", phần trăm.
 *   · Câu của từng bước chỉ từ số đếm; bước bỏ qua nói rõ là bỏ qua.
 *   · Nút "Làm bước này" trỏ tới trang có thật, đúng quyền của trang đó.
 *   · Nút "Bỏ qua": cùng luật kho_danh_dau_thiet_lap.
 *   · Dán Excel tồn đầu kỳ: có / không tiêu đề, khớp Mã rồi Tên bỏ dấu, Nơi,
 *     hạn mặc định, lỗi rõ dòng, thủ kho bị bỏ cột giá.
 *   · Bảng món: dòng trống bỏ qua, số lỗi, id lạ.
 *   · Dòng gửi database và đọc lại từ ô ẩn.
 *   · Trang: không <script>, thủ kho không thấy giá, form đúng quy ước.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import {
  docTienDoTho, cauConLai, phanTramXong, moTaBuoc, LINK_BUOC, linkBuocCuaVai, quyenBoQua, coTheBoQua, chuNutBoQua,
  KHOANG_NGUONG, KHOA_NGUONG, hienSoNguong,
  kiemNgayTonDau, docHanDan, timMon, timNoi, xemTruocDanTonDau, docLuoiTonDau, monTrongLuoi, tomTatTheoViTri,
  dongGuiTonDau, docDongGuiTonDau, dongTuGui, cauDaLuuTonDau, noiDeDuoc, O_LUOI, TOI_DA_DONG_TON_DAU,
} from '../../web/src/lib/kho/thiet-lap.ts';
import { BUOC_THIET_LAP, duoc } from '../../web/src/lib/kho/chung.ts';
import { TEN_NGUONG } from '../../web/src/lib/kho/thong-bao.ts';
import { MUC_KHO } from '../../web/src/lib/kho/dieu-huong.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ WEB THIẾT LẬP & TỒN ĐẦU KỲ');

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TRANG = join(GOC, 'web', 'src', 'pages');
const THU_MUC_MIG = join(GOC, 'crm', 'supabase', 'migrations');
const cacMig = readdirSync(THU_MUC_MIG).filter(f => /^\d{4}_.+\.sql$/.test(f)).sort();
/** Nội dung migration mới nhất có chứa đoạn chữ này. */
function migMoiNhat(chua) {
  for (const f of [...cacMig].reverse()) {
    const s = readFileSync(join(THU_MUC_MIG, f), 'utf8');
    if (s.includes(chua)) return s;
  }
  return '';
}
/** Thân một hàm SQL (từ create tới comment on function). */
function thanHam(ten) {
  const s = migMoiNhat(`create or replace function ${ten}(`);
  const a = s.indexOf(`create or replace function ${ten}(`);
  const b = s.indexOf(`comment on function ${ten}`, a);
  return a < 0 ? '' : s.slice(a, b < 0 ? undefined : b);
}

/** Trang nhận link này (bỏ ?… và #…) có tồn tại không. */
function coTrang(link) {
  const d = link.split('#')[0].split('?')[0].replace(/\/$/, '');
  if (d === '') return true;   // "#neo" trên chính trang
  return [`${d}.astro`, `${d}/index.astro`].some(p => existsSync(join(TRANG, p)));
}
/** Quyền ở dòng chặn đầu trang: mọi k.duoc('…') trong câu if … redirect đầu tiên. */
function quyenDongChan(link) {
  const d = link.split('#')[0].split('?')[0].replace(/\/$/, '');
  const f = [`${d}.astro`, `${d}/index.astro`].map(p => join(TRANG, p)).find(existsSync);
  if (!f) return null;
  const s = readFileSync(f, 'utf8');
  const dong = s.split('\n').find(l => /redirect\(/.test(l) && /k\.duoc\(/.test(l)) ?? '';
  return [...dong.matchAll(/k\.duoc\('([a-z_]+)'\)/g)].map(m => m[1]);
}

const VAI = ['chu_so_huu', 'quan_ly', 'thu_kho', 'nhan_vien_quay', 'ke_toan'];

// ---------------------------------------------------------------------------
// Dữ liệu mẫu
// ---------------------------------------------------------------------------
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const MH = [
  { id: id(1), ma: 'THAN-NGOAI', ten: 'Thăn ngoại', loai: 'phan_cat', dem_goi: true, don_vi_goi: 'gói', han_dung_ngay: 5, dang_dung: true },
  { id: id(2), ma: 'BA-CHI', ten: 'Ba chỉ bò', loai: 'phan_cat', dem_goi: true, don_vi_goi: 'gói', han_dung_ngay: 4, dang_dung: true },
  { id: id(3), ma: 'NAC-VAI', ten: 'Nạc vai nguyên tảng', loai: 'tang', dem_goi: true, don_vi_goi: 'tảng', han_dung_ngay: 30, dang_dung: true },
  { id: id(4), ma: 'MO', ten: 'Mỡ bò', loai: 'phu_pham', dem_goi: false, don_vi_goi: 'khay', han_dung_ngay: null, dang_dung: true },
  { id: id(5), ma: 'CU', ten: 'Thịt cũ', loai: 'phan_cat', dem_goi: true, don_vi_goi: 'gói', han_dung_ngay: 3, dang_dung: false },
  { id: id(6), ma: 'GAU-A', ten: 'Gầu', loai: 'phan_cat', dem_goi: true, don_vi_goi: 'gói', han_dung_ngay: 3, dang_dung: true },
  { id: id(7), ma: 'GAU-B', ten: 'Gau', loai: 'phan_cat', dem_goi: true, don_vi_goi: 'gói', han_dung_ngay: 3, dang_dung: true },
];
const VT = [
  { id: id(101), ten: 'Kho lạnh', loai: 'kho', dang_dung: true },
  { id: id(102), ten: 'Quầy thịt', loai: 'quay', dang_dung: true },
  { id: id(103), ten: 'Hàng chờ hủy', loai: 'cho_huy', dang_dung: true },
  { id: id(104), ten: 'Đang mang ra quầy', loai: 'dang_chuyen', dang_dung: true },
  { id: id(105), ten: 'Kho cũ', loai: 'kho', dang_dung: false },
];
const NGAY = '2026-09-20';
const ctx = (them = {}) => ({ matHang: MH, viTri: VT, viTriMacDinh: null, coGia: true, ngay: NGAY, ...them });

// ===========================================================================
await nhom('1 · TIẾN ĐỘ: ĐỌC KẾT QUẢ, CÒN MẤY BƯỚC', async () => {
  const tho = {
    chi_nhanh_nhan_vien: { xong: true, so: 3, bo_qua: false, duoc_bo_qua: false },
    mat_hang: { xong: false, so: 20, thieu: 4, bo_qua: false, duoc_bo_qua: false },
    ncc_no_dau: { xong: true, so: 5, thieu: 5, bo_qua: true, duoc_bo_qua: true },
    gia_von: { xong: false, bo_qua: false, duoc_bo_qua: true },
    con_lai: 8, tong: 10, da_khoi_tao: true,
  };
  const td = docTienDoTho(tho);
  ok('Đủ 10 bước, đúng thứ tự BUOC_THIET_LAP', td.buoc.map(b => b.khoa).join() === BUOC_THIET_LAP.map(b => b.khoa).join());
  ok('Lấy con_lai, tong, da_khoi_tao của database', td.conLai === 8 && td.tong === 10 && td.daKhoiTao);
  const mh = td.buoc.find(b => b.khoa === 'mat_hang');
  ok('Bước mặt hàng: số và thiếu đọc đúng', mh.so === 20 && mh.thieu === 4 && !mh.xong);
  ok('Bước không có so/thieu → null', td.buoc.find(b => b.khoa === 'gia_von').so === null);
  const vang = td.buoc.find(b => b.khoa === 'may_chung');
  ok('Bước vắng mặt: chưa xong, không bỏ qua được', !vang.xong && !vang.duocBoQua);
  ok('Tên bước lấy từ BUOC_THIET_LAP', mh.ten === 'Mặt hàng');

  const tuDem = docTienDoTho({ mat_hang: { xong: true } });
  ok('Thiếu con_lai → tự đếm bước chưa xong', tuDem.conLai === 9 && tuDem.tong === 10);
  ok('Kết quả rỗng / hỏng không ném lỗi', docTienDoTho(null).buoc.length === 10 && docTienDoTho('x').conLai === 10);

  ok('"Còn 3 bước"', cauConLai({ conLai: 3, tong: 10 }) === 'Còn 3 bước');
  ok('"Đã xong cả 10 bước"', cauConLai({ conLai: 0, tong: 10 }) === 'Đã xong cả 10 bước');
  ok('Phần trăm: 7/10 → 70', phanTramXong({ conLai: 3, tong: 10 }) === 70);
  ok('Phần trăm không ra ngoài 0–100', phanTramXong({ conLai: 12, tong: 10 }) === 0 && phanTramXong({ conLai: -1, tong: 10 }) === 100
    && phanTramXong({ conLai: 0, tong: 0 }) === 0);

  // Bước nào bỏ qua được: BUOC_THIET_LAP.boQua khớp danh sách của kho_danh_dau_thiet_lap.
  const than = thanHam('kho_danh_dau_thiet_lap');
  const dsSql = /p_buoc not in \(([^)]*)\)/.exec(than)?.[1] ?? '';
  const boQuaSql = [...dsSql.matchAll(/'([a-z_]+)'/g)].map(m => m[1]).sort();
  const boQuaWeb = BUOC_THIET_LAP.filter(b => b.boQua).map(b => b.khoa).sort();
  ok('Bước "bỏ qua được" khớp kho_danh_dau_thiet_lap', boQuaSql.length > 0 && boQuaSql.join() === boQuaWeb.join(),
    `sql: ${boQuaSql} · web: ${boQuaWeb}`);
});

// ===========================================================================
await nhom('2 · CÂU CỦA TỪNG BƯỚC — CHỈ SỐ ĐẾM', async () => {
  const b = (khoa, x = {}) => moTaBuoc({ khoa, xong: false, so: null, thieu: null, boQua: false, ...x });
  ok('Nhân viên: chưa có ai', /Chưa có tài khoản/.test(b('chi_nhanh_nhan_vien', { so: 0 })));
  ok('Nhân viên: 3 người', /^3 người/.test(b('chi_nhanh_nhan_vien', { so: 3, xong: true })));
  ok('Mặt hàng: nói số món còn thiếu', /20 mặt hàng; 4 món/.test(b('mat_hang', { so: 20, thieu: 4 })));
  ok('Mặt hàng: trống', /Chưa có mặt hàng/.test(b('mat_hang', { so: 0, thieu: 0 })));
  ok('Công thức: tảng chưa có công thức', /2 loại tảng/.test(b('cong_thuc', { so: 3, thieu: 2, xong: true })));
  ok('NCC chưa ghi nợ: nhắc nút "Không có nợ đầu kỳ"', /Không có nợ đầu kỳ/.test(b('ncc_no_dau', { so: 4, thieu: 4 })));
  ok('NCC đã ghi nợ', /đã ghi nợ đầu kỳ/.test(b('ncc_no_dau', { so: 4, thieu: 2, xong: true })));
  ok('Bỏ qua nợ đầu kỳ: nói rõ "không có nợ"', /không có nợ đầu kỳ/.test(b('ncc_no_dau', { so: 4, boQua: true, xong: true })));
  ok('Bỏ qua bước khác: "bỏ qua"', /bỏ qua/.test(b('cong_thuc', { boQua: true, xong: true })));
  ok('Tồn đầu kỳ: 1/2 chỗ', /1\/2 kho, quầy/.test(b('ton_dau', { so: 1, thieu: 1 })));
  ok('Tồn đầu kỳ: đủ', /Mọi kho, quầy \(2\)/.test(b('ton_dau', { so: 2, thieu: 0, xong: true })));
  ok('Giá vốn: chưa xem', /Chủ chưa xem/.test(b('gia_von')));
  ok('Ngưỡng: mặc định', /mặc định/.test(b('nguong')));
  ok('Vị trí/lý do/mã vạch: thiếu 2 trong 4', /thiếu 2 trong 4/.test(b('vi_tri_ly_do_ma_vach', { so: 2, thieu: 2 })));
  ok('Máy dùng chung: chưa có', /Chưa có máy/.test(b('may_chung', { so: 0 })));
  ok('Định mức: 5 phần cắt, 3 chưa có', /5 phần cắt có mức tối thiểu; 3/.test(b('dinh_muc', { so: 5, thieu: 3, xong: true })));
  const moiCau = BUOC_THIET_LAP.flatMap(x => [b(x.khoa, { so: 1234567, thieu: 2 }), b(x.khoa, { so: 0, thieu: 0 })]);
  ok('Không câu nào có đơn vị tiền', moiCau.every(c => !/\d\s*(đ|đồng|vnd)(?!\p{L})/iu.test(c)), moiCau.join(' | '));
});

// ===========================================================================
await nhom('3 · NÚT "LÀM BƯỚC NÀY" VÀ "BỎ QUA"', async () => {
  ok('Mọi bước có ít nhất một nút', BUOC_THIET_LAP.every(b => (LINK_BUOC[b.khoa] ?? []).length > 0));
  const nutCaiDat = MUC_KHO.find(m => m.ma === 'cai_dat');
  ok('Ô menu đổi tên thành "Thiết lập"', nutCaiDat?.ten?.vi === 'Thiết lập' && nutCaiDat?.ten?.en === 'Setup');
  const hong = [];
  const lechQuyen = [];
  for (const [khoa, ds] of Object.entries(LINK_BUOC)) {
    for (const l of ds) {
      if (l.link.startsWith('#')) {
        // Neo trên chính màn Thiết lập: phải có id đó.
        const s = readFileSync(join(TRANG, 'noi-bo/kho/cai-dat/index.astro'), 'utf8');
        if (!s.includes(`id="${l.link.slice(1)}"`)) hong.push(`${khoa}: ${l.link}`);
        continue;
      }
      // Trang nợ đầu kỳ do nhóm công nợ làm cùng lúc — chưa có thì chỉ báo, không hỏng.
      if (l.link.startsWith('/noi-bo/kho/cong-no/no-dau') && !coTrang(l.link)) continue;
      if (!coTrang(l.link)) { hong.push(`${khoa}: ${l.link}`); continue; }
      const q = quyenDongChan(l.link);
      // Người thấy nút phải qua được dòng chặn của trang (so theo từng vai).
      if (q && q.length) {
        for (const vai of VAI) {
          const thayNut = l.quyen.some(x => duoc(vai, x));
          const vaoDuoc = q.some(x => duoc(vai, x)) || (l.link.includes('/nhan-vien') && vai === 'chu_so_huu');
          if (thayNut && !vaoDuoc) lechQuyen.push(`${vai} → ${l.link}`);
        }
      }
    }
  }
  ok('Mọi nút trỏ tới trang / neo có thật', hong.length === 0, hong.join(' | '));
  ok('Không vai nào thấy nút rồi bị đá khỏi trang', lechQuyen.length === 0, lechQuyen.join(' | '));
  ok('Thủ kho, NV quầy không thấy nút ghi nợ đầu kỳ',
    ['thu_kho', 'nhan_vien_quay'].every(v => !linkBuocCuaVai('ncc_no_dau', v).some(l => l.link.includes('no-dau'))));
  ok('Kế toán thấy nút "Ghi nợ đầu kỳ"', linkBuocCuaVai('ncc_no_dau', 'ke_toan').some(l => l.link.includes('no-dau')));
  ok('Nút "Tồn đầu kỳ" trỏ tới lưới mới', LINK_BUOC.ton_dau[0].link === '/noi-bo/kho/cai-dat/ton-dau');

  // Ai bấm được "Bỏ qua": soi gương kho_danh_dau_thiet_lap.
  const than = thanHam('kho_danh_dau_thiet_lap');
  ok('SQL: ncc_no_dau cho danh_muc hoặc ke_toan', /when 'ncc_no_dau' then kho_duoc\(p_chi_nhanh_id, 'danh_muc'\) or kho_duoc\(p_chi_nhanh_id, 'ke_toan'\)/.test(than));
  ok('SQL: gia_von chỉ cai_dat_goc', /when 'gia_von'\s+then kho_duoc\(p_chi_nhanh_id, 'cai_dat_goc'\)/.test(than));
  ok('SQL: bước khác cần danh_muc', /else kho_duoc\(p_chi_nhanh_id, 'danh_muc'\)/.test(than));
  ok('Web: ncc_no_dau = danh_muc | ke_toan', quyenBoQua('ncc_no_dau').join() === 'danh_muc,ke_toan');
  ok('Web: gia_von = cai_dat_goc', quyenBoQua('gia_von').join() === 'cai_dat_goc');
  ok('Web: bước khác = danh_muc', quyenBoQua('dinh_muc').join() === 'danh_muc');
  const b = khoa => ({ khoa, duocBoQua: BUOC_THIET_LAP.find(x => x.khoa === khoa).boQua });
  ok('Kế toán bỏ qua được nợ đầu kỳ', coTheBoQua(b('ncc_no_dau'), 'ke_toan'));
  ok('Kế toán không bỏ qua được công thức', !coTheBoQua(b('cong_thuc'), 'ke_toan'));
  ok('Quản lý không bỏ qua được giá vốn; chủ được', !coTheBoQua(b('gia_von'), 'quan_ly') && coTheBoQua(b('gia_von'), 'chu_so_huu'));
  ok('Không ai bỏ qua được mặt hàng / nhân viên',
    VAI.every(v => !coTheBoQua(b('mat_hang'), v) && !coTheBoQua(b('chi_nhanh_nhan_vien'), v)));
  ok('Chữ nút: "Không có nợ đầu kỳ" / "Không bỏ qua nữa"',
    chuNutBoQua('ncc_no_dau', false) === 'Không có nợ đầu kỳ' && chuNutBoQua('ncc_no_dau', true) === 'Không bỏ qua nữa'
    && chuNutBoQua('cong_thuc', false) === 'Bỏ qua');
});

// ===========================================================================
await nhom('4 · NGƯỠNG CẢNH BÁO', async () => {
  ok('5 khóa ngưỡng trùng TEN_NGUONG', KHOA_NGUONG.join() === Object.keys(TEN_NGUONG).join());
  const sql = migMoiNhat('kho_cai_dat_nguong_gia_hop_le');
  const lech = Object.entries(KHOANG_NGUONG).filter(([k, [a, b]]) =>
    !new RegExp(`check \\(${k}\\s+between ${a} and ${b}\\)`).test(sql));
  ok('Khoảng gợi ý khớp CHECK của kho_cai_dat (0030)', lech.length === 0, lech.map(x => x[0]).join(', '));
  ok('Số hiện kiểu Việt: 2.5 → "2,5", null → ""', hienSoNguong(2.5) === '2,5' && hienSoNguong(null) === '' && hienSoNguong(5) === '5');
  const mig35 = migMoiNhat('kho_cai_dat_moc_nguong');
  ok('Trigger mốc ngưỡng theo dõi đủ 5 cột', KHOA_NGUONG.every(k => new RegExp(`before update of[^;]*${k}`).test(mig35)));
});

// ===========================================================================
await nhom('5 · NGÀY, HẠN DÙNG, TÌM MÓN, TÌM NƠI', async () => {
  ok('Ngày hôm nay hợp lệ', kiemNgayTonDau('2026-09-25', '2026-09-25') === null);
  ok('Ngày mai bị chặn', /sau hôm nay/.test(kiemNgayTonDau('2026-09-26', '2026-09-25')));
  ok('90 ngày trước được, 91 ngày bị chặn',
    kiemNgayTonDau('2026-06-27', '2026-09-25') === null && /90 ngày/.test(kiemNgayTonDau('2026-06-26', '2026-09-25')));
  ok('Ngày trống / sai', /Chọn ngày/.test(kiemNgayTonDau('', '2026-09-25')) && /Chọn ngày/.test(kiemNgayTonDau('2026-02-30', '2026-09-25')));
  // Khớp luật database: không sau hôm nay, không quá 90 ngày trước.
  const than = thanHam('kho_luu_ton_dau_ky');
  ok('SQL cùng luật 90 ngày', /p_ngay < hom_nay_vn\(\) - 90/.test(than) && /p_ngay > hom_nay_vn\(\)/.test(than));

  ok('HSD 25/10/2026', docHanDan('25/10/2026') === '2026-10-25');
  ok('HSD 5-1-27', docHanDan('5-1-27') === '2027-01-05');
  ok('HSD 2026-10-25', docHanDan('2026-10-25') === '2026-10-25');
  ok('HSD 25.10.2026', docHanDan('25.10.2026') === '2026-10-25');
  ok('HSD trống → null; sai → undefined', docHanDan('') === null && docHanDan('31/02/2026') === undefined && docHanDan('mai') === undefined);

  ok('Tìm theo mã (không phân biệt hoa thường)', timMon(MH, 'than-ngoai', null)?.id === id(1));
  ok('Ô "Mã/Tên" ghi tên không dấu', timMon(MH, 'ba chi bo', null)?.id === id(2));
  ok('Tìm theo tên, bỏ dấu, gộp khoảng trắng', timMon(MH, null, '  THAN   ngoai ')?.id === id(1));
  ok('Mã sai nhưng tên đúng → theo tên', timMon(MH, 'XYZ', 'Ba chỉ bò')?.id === id(2));
  const trung = timMon(MH, null, 'gau');
  ok('Hai món cùng tên không dấu → báo ghi Mã', typeof trung === 'string' && /GAU-A, GAU-B/.test(trung), String(trung));
  ok('Món ngừng dùng → báo đã ngừng', /ngừng dùng/.test(String(timMon(MH, null, 'Thịt cũ'))));
  ok('Không có → báo rõ', /không tìm thấy mặt hàng "Lưỡi bò"/.test(String(timMon(MH, null, 'Lưỡi bò'))));

  ok('Nơi để được: chỉ kho / quầy đang dùng', noiDeDuoc(VT).map(v => v.id).join() === [id(101), id(102)].join());
  ok('Nơi theo tên không dấu', timNoi(VT, 'kho lanh')?.id === id(101));
  ok('"quầy" khi chỉ có một quầy', timNoi(VT, 'Quầy')?.id === id(102));
  ok('Không nhận chỗ chờ hủy / đang mang ra quầy', typeof timNoi(VT, 'Hàng chờ hủy') === 'string'
    && typeof timNoi(VT, 'Đang mang ra quầy') === 'string');
  const haiKho = [...VT, { id: id(106), ten: 'Kho đông', loai: 'kho', dang_dung: true }];
  ok('Hai kho → "kho" phải ghi đúng tên', /Kho lạnh, Kho đông/.test(String(timNoi(haiKho, 'kho'))));
});

// ===========================================================================
await nhom('6 · DÁN EXCEL TỒN ĐẦU KỲ', async () => {
  const dan = [
    'Mã\tTên\tNơi\tGói\tKg\tĐơn giá/kg\tHSD',
    'THAN-NGOAI\t\tKho lạnh\t4\t12,5\t450.000\t30/09/2026',
    '\tba chi bo\tQuầy\t6\t3.2\t\t',
    '',
    '\tMỡ bò\tkho\t\t2\t\t01/10/2026',
  ].join('\n');
  const xt = xemTruocDanTonDau(dan, ctx());
  ok('Có tiêu đề: 3 dòng, không lỗi', xt.dong.length === 3 && xt.loi.length === 0, xt.loi.join(' | '));
  const [a, b, c] = xt.dong;
  ok('Dòng 1: mã, nơi, gói, kg, giá, HSD', a.mat_hang_id === id(1) && a.vi_tri_id === id(101) && a.so_goi === 4
    && a.so_kg === 12.5 && a.don_gia_kg === 450000 && a.han_dung === '2026-09-30');
  ok('Dòng 2: tên không dấu, "Quầy", kg dấu chấm, HSD mặc định = ngày + 4', b.mat_hang_id === id(2) && b.vi_tri_id === id(102)
    && b.so_kg === 3.2 && b.han_dung === null && b.han_se_dung === '2026-09-24' && b.don_gia_kg === null);
  ok('Món không đếm gói: gói trống = 0', c.mat_hang_id === id(4) && c.so_goi === 0);
  ok('Số thứ tự gửi 1, 2, 3', xt.dong.map(d => d.stt).join() === '1,2,3');
  ok('Nguồn ghi số dòng trong ô dán (bỏ qua dòng trống)', a.nguon === 'dòng 2 ô dán' && c.nguon === 'dòng 5 ô dán');

  const tom = tomTatTheoViTri(xt.dong);
  ok('Tóm tắt: 2 nơi theo thứ tự xuất hiện, cộng kg không lệch', tom.length === 2 && tom[0].ten === 'Kho lạnh'
    && tom[0].so_dong === 2 && tom[0].tong_kg === 14.5 && tom[1].tong_kg === 3.2, JSON.stringify(tom));

  // Không tiêu đề: Mã/Tên, Nơi, Gói, Kg, Đơn giá, HSD
  const khong = xemTruocDanTonDau('Thăn ngoại;Quầy thịt;2;1,5;;\nNAC-VAI;;1;25;900000;', ctx({ viTriMacDinh: id(101) }));
  ok('Không tiêu đề, cách bằng dấu ;', khong.dong.length === 2 && khong.loi.length === 0, khong.loi.join(' | '));
  ok('Nơi trống → nơi mặc định', khong.dong[1].vi_tri_id === id(101) && khong.dong[1].don_gia_kg === 900000);

  const thieuNoi = xemTruocDanTonDau('Thăn ngoại\t\t2\t1', ctx());
  ok('Nơi trống, không có mặc định → lỗi', thieuNoi.dong.length === 0 && /chưa ghi Nơi/.test(thieuNoi.loi[0]));

  const loi = xemTruocDanTonDau([
    'Tên\tNơi\tGói\tKg\tHSD',
    'Lưỡi bò\tKho lạnh\t1\t2\t',
    'Thăn ngoại\tKho lạnh\t\t2\t',
    'Ba chỉ bò\tKho lạnh\t2\t0\t',
    'Mỡ bò\tKho lạnh\t\t1\t',
    'Ba chỉ bò\tKho lạnh\t2\t1\t32/13/2026',
    'Gầu\tKho lạnh\t1\t1\t',
  ].join('\n'), ctx());
  ok('Mỗi dòng lỗi một câu, ghi số dòng ô dán và tên món', loi.loi.length === 6 && loi.dong.length === 0, loi.loi.join(' | '));
  ok('Món không có', /^Dòng 2 \(Lưỡi bò\): không tìm thấy/.test(loi.loi[0]));
  ok('Món đếm gói mà thiếu gói', /^Dòng 3 \(Thăn ngoại\): chưa ghi số gói/.test(loi.loi[1]));
  ok('Kg = 0', /^Dòng 4 .*số kg "0" phải lớn hơn 0/.test(loi.loi[2]));
  ok('Không HSD, món chưa có hạn mặc định', /^Dòng 5 .*chưa cài hạn mặc định/.test(loi.loi[3]));
  ok('HSD sai', /^Dòng 6 .*hạn dùng "32\/13\/2026"/.test(loi.loi[4]));
  ok('Tên trùng không dấu → bảo ghi Mã', /^Dòng 7 .*ghi Mã/.test(loi.loi[5]));

  const thuKho = xemTruocDanTonDau('Mã\tNơi\tGói\tKg\tĐơn giá\nTHAN-NGOAI\tKho lạnh\t1\t1\t500000', ctx({ coGia: false }));
  ok('Thủ kho: cột Đơn giá bị bỏ qua, không lỗi, không giá', thuKho.loi.length === 0 && thuKho.dong[0].don_gia_kg === null
    && thuKho.boQua.some(x => /Đơn giá/.test(x)));
  const thuKhoKhongTieuDe = xemTruocDanTonDau('THAN-NGOAI\tKho lạnh\t1\t1\t500000', ctx({ coGia: false }));
  ok('Thủ kho, không tiêu đề: cột giá cũng bị bỏ', thuKhoKhongTieuDe.dong[0]?.don_gia_kg === null);
  // Thủ kho dán không tiêu đề và bỏ cột Đơn giá: HSD rơi vào chỗ cột giá —
  // phải nhận là HSD, không được lặng lẽ mất hạn dùng.
  const hsdLech = xemTruocDanTonDau('THAN-NGOAI\tKho lạnh\t1\t1\t30/10/2026', ctx({ coGia: false }));
  ok('Không tiêu đề, thiếu cột Đơn giá: ngày ở cột 5 là HSD', hsdLech.loi.length === 0 && hsdLech.dong[0]?.han_dung === '2026-10-30');
  // Không tách bằng dấu phẩy: "12,5" kg không được thành 12 và 5.
  const phay = xemTruocDanTonDau('THAN-NGOAI,Kho lạnh,1,12,5', ctx());
  ok('Dấu phẩy không phải chỗ tách cột (12,5 kg không bị cắt)', phay.dong.length === 0 && phay.loi.length === 1);

  const tieuDeLap = xemTruocDanTonDau('Mã\tKg\tKg\nTHAN-NGOAI\t1\t2', ctx());
  ok('Tiêu đề lặp cột → báo', /cột "Kg" có hai lần/.test(tieuDeLap.loi[0] ?? ''));
  const khongKg = xemTruocDanTonDau('Mã\tNơi\nTHAN-NGOAI\tKho lạnh', ctx());
  ok('Tiêu đề thiếu cột Kg → báo', /cần có cột Kg/.test(khongKg.loi.join()));
  const la = xemTruocDanTonDau('Mã\tKg\tGói\tGhi chú\nTHAN-NGOAI\t1\t2\tabc', ctx({ viTriMacDinh: id(101) }));
  ok('Cột lạ: bỏ qua, ghi tên cột', la.boQua.includes('Ghi chú') && la.dong.length === 1);
  const ngoac = xemTruocDanTonDau('Tên\tKg\tGói\n"Thăn ngoại"\t"1,5"\t1', ctx({ viTriMacDinh: id(101) }));
  ok('Ô bọc ngoặc kép của Excel', ngoac.dong[0]?.so_kg === 1.5);

  const nhieu = Array.from({ length: TOI_DA_DONG_TON_DAU + 1 }, () => 'THAN-NGOAI\tKho lạnh\t1\t1').join('\n');
  ok(`Quá ${TOI_DA_DONG_TON_DAU} dòng → báo chia nhiều lần`, xemTruocDanTonDau(nhieu, ctx()).loi.some(l => /tối đa 500/.test(l)));
  ok('Ô dán trống → không dòng, không lỗi', xemTruocDanTonDau('  \n\n', ctx()).dong.length === 0);
});

// ===========================================================================
await nhom('7 · BẢNG MÓN CỦA MỘT NƠI', async () => {
  const mon = monTrongLuoi(MH);
  ok('Bảng món: bỏ món ngừng dùng, tảng lên trước', !mon.some(m => !m.dang_dung) && mon[0].loai === 'tang'
    && mon.at(-1).loai === 'phu_pham');
  const f = new FormData();
  mon.forEach((m, i) => f.set(O_LUOI.mh + i, m.id));
  const i = t => mon.findIndex(m => m.ma === t);
  f.set(O_LUOI.kg + i('THAN-NGOAI'), '2,5'); f.set(O_LUOI.goi + i('THAN-NGOAI'), '3');
  f.set(O_LUOI.gia + i('THAN-NGOAI'), '450.000'); f.set(O_LUOI.han + i('THAN-NGOAI'), '2026-09-28');
  f.set(O_LUOI.kg + i('MO'), '1'); f.set(O_LUOI.han + i('MO'), '2026-10-01');
  const xt = docLuoiTonDau(f, ctx({ viTriMacDinh: id(102) }));
  ok('Dòng trống bỏ qua, 2 dòng đọc được', xt.dong.length === 2 && xt.loi.length === 0, xt.loi.join(' | '));
  ok('Mọi dòng vào nơi đang chọn', xt.dong.every(d => d.vi_tri_id === id(102)));
  ok('Đúng số, giá, hạn', xt.dong.find(d => d.mat_hang_id === id(1))?.don_gia_kg === 450000
    && xt.dong.find(d => d.mat_hang_id === id(1))?.han_dung === '2026-09-28');

  const f2 = new FormData();
  mon.forEach((m, j) => f2.set(O_LUOI.mh + j, m.id));
  f2.set(O_LUOI.goi + i('BA-CHI'), '2');
  f2.set(O_LUOI.gia + i('NAC-VAI'), '100000');
  const loi = docLuoiTonDau(f2, ctx({ viTriMacDinh: id(101), coGia: false }));
  ok('Ghi gói mà quên kg → lỗi theo tên món', loi.loi.length === 1 && /^Ba chỉ bò: chưa ghi số kg/.test(loi.loi[0]), loi.loi.join(' | '));
  ok('Thủ kho: ô giá (nếu bị gửi) bị bỏ, không tạo dòng', !loi.loi.some(l => /Nạc vai/.test(l)) && loi.dong.length === 0);

  const f3 = new FormData();
  f3.set(O_LUOI.mh + 0, id(999)); f3.set(O_LUOI.kg + 0, '1');
  ok('Id món lạ → bảo tải lại trang', /tải lại trang/.test(docLuoiTonDau(f3, ctx({ viTriMacDinh: id(101) })).loi[0] ?? ''));
});

// ===========================================================================
await nhom('8 · GỬI DATABASE VÀ ĐỌC LẠI Ô ẨN', async () => {
  const xt = xemTruocDanTonDau('Mã\tNơi\tGói\tKg\tĐơn giá\tHSD\nTHAN-NGOAI\tKho lạnh\t4\t12,5\t450000\t30/09/2026\nMO\tQuầy\t\t2\t\t01/10/2026', ctx());
  const gui = dongGuiTonDau(xt.dong);
  ok('Chỉ các khóa database nhận', gui.every(g => Object.keys(g).every(k =>
    ['vi_tri_id', 'mat_hang_id', 'so_goi', 'so_kg', 'don_gia_kg', 'han_dung'].includes(k))));
  ok('Ô trống thì vắng khóa', !('don_gia_kg' in gui[1]) && gui[0].don_gia_kg === 450000);
  // Khóa gửi phải nằm trong danh sách c_khoa của kho_luu_ton_dau_ky.
  const than = thanHam('kho_luu_ton_dau_ky');
  const cKhoa = [...(/c_khoa\s+constant text\[\] := array\[([^\]]*)\]/.exec(than)?.[1] ?? '').matchAll(/'([a-z_]+)'/g)].map(m => m[1]);
  ok('Khóa gửi ⊂ c_khoa của database', cKhoa.length === 6 && gui.flatMap(Object.keys).every(k => cKhoa.includes(k)), cKhoa.join());

  const json = JSON.stringify(gui);
  ok('Đọc lại ô ẩn: y hệt', JSON.stringify(docDongGuiTonDau(json, true)) === json);
  ok('Ô ẩn hỏng → null', docDongGuiTonDau('{', true) === null && docDongGuiTonDau('[]', true) === null
    && docDongGuiTonDau('[{"vi_tri_id":"x"}]', true) === null);
  ok('Người không xem giá gửi đơn giá → null', docDongGuiTonDau(json, false) === null);
  ok('Kg âm / gói lẻ / hạn sai → null',
    docDongGuiTonDau(JSON.stringify([{ ...gui[1], so_kg: -1 }]), true) === null
    && docDongGuiTonDau(JSON.stringify([{ ...gui[1], so_goi: 1.5 }]), true) === null
    && docDongGuiTonDau(JSON.stringify([{ ...gui[1], han_dung: '2026-13-01' }]), true) === null);

  const lai = dongTuGui(gui, { matHang: MH, viTri: VT, ngay: NGAY });
  ok('Dựng lại bảng xem trước từ ô ẩn', lai.length === 2 && lai[0].ten_mat_hang === 'Thăn ngoại' && lai[1].ten_vi_tri === 'Quầy thịt'
    && lai[0].stt === 1);

  const cau = cauDaLuuTonDau([
    { vi_tri_id: id(101), phieu_id: id(1), so_phieu: 'TD-2609-0001', trang_thai: 'da_duyet', so_dong: 2 },
    { vi_tri_id: id(102), phieu_id: id(2), so_phieu: 'TD-2609-0002', trang_thai: 'da_duyet', so_dong: 1 },
  ], false, new Map([[id(101), 'Kho lạnh'], [id(102), 'Quầy thịt']]));
  ok('Câu báo: số phiếu, nơi, đã duyệt', /Đã tạo 2 phiếu.*TD-2609-0001 \(Kho lạnh, 2 dòng\).*đã duyệt/.test(cau), cau);
  const cho = cauDaLuuTonDau([{ vi_tri_id: id(101), phieu_id: id(1), so_phieu: 'TD-1', trang_thai: 'cho_duyet', so_dong: 1 }], true, new Map());
  ok('Gửi lại cùng mã: "đã ghi từ trước", chờ duyệt', /đã ghi từ trước/.test(cho) && /chờ duyệt/.test(cho));
  ok('Câu báo không có tiền', !/\d\s*(đ|đồng|vnd)(?!\p{L})/iu.test(cau + cho));
});

// ===========================================================================
await nhom('9 · TRANG THIẾT LẬP VÀ TỒN ĐẦU KỲ', async () => {
  const idx = readFileSync(join(TRANG, 'noi-bo/kho/cai-dat/index.astro'), 'utf8');
  const td = readFileSync(join(TRANG, 'noi-bo/kho/cai-dat/ton-dau.astro'), 'utf8');
  for (const [ten, s] of [['Thiết lập', idx], ['Tồn đầu kỳ', td]]) {
    ok(`${ten}: không <script>, không onclick`, !/<script|onclick=/i.test(s));
    ok(`${ten}: bọc <Kho>, có <h1> và <BaoKho>`, /<Kho k=\{k\}/.test(s) && /<h1>/.test(s) && /<BaoKho/.test(s));
    ok(`${ten}: thành công thì chuyenHuong`, /chuyenHuong\(Astro,/.test(s));
    ok(`${ten}: không bẫy {x && …} với số`, !/\{\s*[a-zA-Z_.]+\.length\s*&&/.test(s));
  }
  ok('Thiết lập: có thanh tiến độ và nút Bỏ qua', /cauConLai\(tienDo\)/.test(idx) && /name="viec" value="bo_qua"/.test(idx));
  ok('Thiết lập: form ngưỡng lưu bằng luuNguong', /luuNguong\(k\.client/.test(idx) && /name="viec" value="nguong"/.test(idx));
  ok('Thiết lập: giữ công tắc quầy (0032) và cài đặt gốc', /chuyen_quay_can_nhan/.test(idx) && /value="goc"/.test(idx));
  ok('Tồn đầu kỳ: chặn bằng quyền nhap', /if \(!k\.duoc\('nhap'\)\) return Astro\.redirect/.test(td));
  ok('Tồn đầu kỳ: xác nhận có ma_gui', /name="ma_gui" value=\{maGui\}/.test(td));
  ok('Tồn đầu kỳ: cột giá chỉ khi xem giá', (td.match(/Đơn giá\/kg/g) ?? []).length >= 1
    && [...td.matchAll(/Đơn giá\/kg/g)].every(m => /coGia/.test(td.slice(Math.max(0, m.index - 120), m.index))));
  ok('Tồn đầu kỳ: ô nhập trong bảng cỡ 16px, cao 48px', /\.td-o \{[^}]*font-size: 16px[^}]*min-height: 48px/.test(td));
  const lib = readFileSync(join(GOC, 'web/src/lib/kho/thiet-lap.ts'), 'utf8');
  const selMon = /from\('kho_mat_hang'\)\s*\.select\('([^']*)'\)/.exec(lib)?.[1] ?? '';
  ok('Lưới đọc mặt hàng không có cột tiền', selMon !== '' && !/gia|tien/.test(selMon), selMon);
});

process.exit(ketThuc('WEB THIẾT LẬP & TỒN ĐẦU KỲ'));
