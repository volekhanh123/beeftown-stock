/**
 * BEEFTOWN KHO — Kiểm thử phần web của Định lượng món + Đối chiếu định mức (GĐ7b)
 * ===============================================================================
 *
 *     node test/test-kho-dinh-luong-web.mjs
 *
 * Hàm thuần trong web/src/lib/kho/dinh-luong.ts và mã nguồn hai trang — không
 * cần database (phần database ở test-kho-dinh-luong.mjs).
 *
 *   · Tách ô dán Excel: Tab / ;, có / không tiêu đề, cột xếp tùy ý, số dòng
 *     đúng dòng trong ô dán, không tách bằng dấu phẩy, dòng gửi đúng khóa mà
 *     kho_nhap_dinh_luong đọc.
 *   · Lưới gram của một món: dòng trống, "Bỏ", trùng mặt hàng, gram sai, dạng
 *     gửi đúng kho_luu_dinh_luong ({mat_hang_id, gram} — gram là số).
 *   · Phiên bản định lượng không phụ thuộc thứ tự.
 *   · Lọc món: đang bán / chưa có định lượng / ngừng bán, tìm không dấu.
 *   · Màu lệch: đỏ đúng khi database nói vượt ngưỡng.
 *   · Cột tiền chỉ cho vai xem giá (bảng và CSV).
 *   · Trang: dòng chặn quyền, huongDan, không <script>, CSV mở cho vai xem.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import {
  docGram, docLuoiDinhLuong, phienBanDinhLuong, tachDanDinhLuong, ganDinhLuong, locMon, docLocMon,
  docXemTruocDl, cauApDungDl, cauMonTuIpos, docDongDinhMuc, mucLech, hienLechPt, hienLechKg,
  cotDinhMuc, dinhNghiaDinhMuc, hienGram, TOI_DA_DONG_DAN,
} from '../../web/src/lib/kho/dinh-luong.ts';
import { taoCsv, tinhTong } from '../../web/src/lib/kho/bao-cao.ts';
import { MUC_KHO } from '../../web/src/lib/kho/dieu-huong.ts';
import { MUC_HUONG_DAN } from '../../web/src/lib/kho/huong-dan.ts';
import { cauSuKien } from '../../web/src/lib/kho/viec.ts';
import { duoc } from '../../web/src/lib/kho/chung.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ WEB ĐỊNH LƯỢNG & ĐỊNH MỨC');

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TRANG = join(GOC, 'web', 'src', 'pages');
const MIG = join(GOC, 'crm', 'supabase', 'migrations');
const doc = p => readFileSync(p, 'utf8');
const SQL = readdirSync(MIG).filter(f => /^\d{4}_.+\.sql$/.test(f)).sort().reverse()
  .map(f => doc(join(MIG, f))).find(s => s.includes('create or replace function kho_nhap_dinh_luong(')) ?? '';

const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

// ===========================================================================
await nhom('1 · TÁCH Ô DÁN EXCEL', async () => {
  const t = tachDanDinhLuong('Món\tMặt hàng\tGram\nBò nướng\tThăn ngoại\t200\n\nLẩu bò\tBắp bò\t120,5\n');
  ok('Có tiêu đề: bỏ dòng tiêu đề, bỏ dòng trống', t.coTieuDe && t.dong.length === 2 && t.loi === null, JSON.stringify(t));
  ok('Số dòng = dòng trong ô dán (dòng 2, dòng 4)', t.dong[0].dong === 2 && t.dong[1].dong === 4);
  ok('Giá trị cột đúng, gram giữ nguyên chữ (database đọc 120,5)',
    t.dong[1].mon === 'Lẩu bò' && t.dong[1].mat_hang === 'Bắp bò' && t.dong[1].gram === '120,5');

  const x = tachDanDinhLuong('Gram;Tên món;Mã cân\n150;"Phở; tái";101');
  ok('Tiêu đề xếp tùy ý, dấu ;, bỏ ngoặc kép', x.coTieuDe && x.dong[0].gram === '150' && x.dong[0].mat_hang === '101',
    JSON.stringify(x));
  const en = tachDanDinhLuong('Dish\tItem\tGrams\nPho\tBrisket\t150.5');
  ok('Tiêu đề tiếng Anh (màn tiếng Anh hướng dẫn Dish · Item · Gram) cũng hiểu', en.coTieuDe && en.dong.length === 1
    && en.dong[0].mon === 'Pho' && en.dong[0].mat_hang === 'Brisket' && en.dong[0].gram === '150.5', JSON.stringify(en));

  const k = tachDanDinhLuong('Bò nướng\tThăn\t200\nBò nướng\tMỡ\t20');
  ok('Không tiêu đề: thứ tự Món, Mặt hàng, Gram; dòng 1 là dữ liệu', !k.coTieuDe && k.dong.length === 2
    && k.dong[0].mon === 'Bò nướng' && k.dong[0].dong === 1);

  ok('Không tách bằng dấu phẩy (150,5 gram không bị cắt)', tachDanDinhLuong('Bò, nướng, 150,5').loi !== null);
  ok('Ô trống → câu dễ hiểu', /trống/.test(tachDanDinhLuong('  \n ').loi ?? ''));
  ok('Tiêu đề thiếu cột Gram → báo rõ', /thiếu cột Gram/.test(tachDanDinhLuong('Món\tMặt hàng\nA\tB').loi ?? ''));
  ok('Chỉ có tiêu đề → báo', /Chỉ có dòng tiêu đề/.test(tachDanDinhLuong('Món\tMặt hàng\tGram').loi ?? ''));
  const nhieu = Array.from({ length: TOI_DA_DONG_DAN + 1 }, () => 'A\tB\t1').join('\n');
  ok(`Quá ${TOI_DA_DONG_DAN} dòng → báo trước khi gửi`, /Tối đa/.test(tachDanDinhLuong(nhieu).loi ?? ''));

  // Khóa gửi phải đúng khóa database đọc.
  const than = SQL.slice(SQL.indexOf('create or replace function kho_nhap_dinh_luong('));
  const khoa = Object.keys(t.dong[0]);
  ok('Dòng gửi chỉ có khóa mà kho_nhap_dinh_luong đọc (mon, mat_hang, gram, dong)',
    khoa.every(kh => than.includes(`v_e ->> '${kh}'`)), khoa.join(', '));
});

// ===========================================================================
await nhom('2 · LƯỚI GRAM CỦA MỘT MÓN', async () => {
  ok('docGram: 150 / 150,5 / 150.5 / 150g', docGram('150') === 150 && docGram('150,5') === 150.5
    && docGram('150.5') === 150.5 && docGram('150g') === 150);
  ok('docGram: trống → null; 0, âm, > 10.000, chữ → NaN', docGram('') === null && Number.isNaN(docGram('0'))
    && Number.isNaN(docGram('-5')) && Number.isNaN(docGram('10001')) && Number.isNaN(docGram('một trăm')));

  const MH = [{ id: id(1), ten: 'Thăn' }, { id: id(2), ten: 'Bắp' }, { id: id(3), ten: 'Gân' }];
  const f = new FormData();
  f.set('so_dong', '6');
  f.set('mh_0', id(1)); f.set('gram_0', '200');
  f.set('mh_1', id(2)); f.set('gram_1', '120,5');
  f.set('mh_2', id(3)); f.set('gram_2', '50'); f.set('bo_2', '1');   // tích Bỏ
  f.set('mh_3', ''); f.set('gram_3', '');                               // dòng trống
  const r = docLuoiDinhLuong(f, MH);
  ok('Dòng tích "Bỏ" và dòng trống không gửi', r.dong.length === 2 && r.loi.length === 0, JSON.stringify(r));
  ok('Gửi đúng dạng kho_luu_dinh_luong: {mat_hang_id, gram} với gram là số',
    JSON.stringify(r.dong) === JSON.stringify([{ mat_hang_id: id(1), gram: 200 }, { mat_hang_id: id(2), gram: 120.5 }]));
  ok('Giữ lại mọi ô để dựng lại lưới', r.o.length === 6 && r.o[2].bo === true && r.o[1].gram === '120,5');
  const than = SQL.slice(SQL.indexOf('create or replace function kho_luu_dinh_luong('));
  ok('Database đọc đúng hai khóa đó', than.includes("v_e ->> 'mat_hang_id'") && than.includes("v_e -> 'gram'"));

  const f2 = new FormData();
  f2.set('so_dong', '4');
  f2.set('mh_0', id(1)); f2.set('gram_0', '200');
  f2.set('mh_1', id(1)); f2.set('gram_1', '100');     // trùng
  f2.set('mh_2', ''); f2.set('gram_2', '80');          // có gram mà chưa chọn
  f2.set('mh_3', id(2)); f2.set('gram_3', '0');        // gram sai
  const r2 = docLuoiDinhLuong(f2, MH);
  ok('Trùng mặt hàng → báo gộp', r2.loi.some(l => /Dòng 2: "Thăn" có hai lần/.test(l)), r2.loi.join(' | '));
  ok('Có gram mà chưa chọn mặt hàng → báo', r2.loi.some(l => /Dòng 3: chọn mặt hàng/.test(l)));
  ok('Gram 0 → báo có tên mặt hàng', r2.loi.some(l => /Dòng 4 \(Bắp\): gram phải lớn hơn 0/.test(l)));
  const f3 = new FormData();
  f3.set('so_dong', '1'); f3.set('mh_0', id(9)); f3.set('gram_0', '10');
  ok('Mặt hàng lạ (không trong danh mục) → báo', docLuoiDinhLuong(f3, MH).loi.length === 1);

  ok('Phiên bản không phụ thuộc thứ tự dòng',
    phienBanDinhLuong([{ mat_hang_id: 'b', gram: 2 }, { mat_hang_id: 'a', gram: 1 }])
      === phienBanDinhLuong([{ mat_hang_id: 'a', gram: 1 }, { mat_hang_id: 'b', gram: 2 }]));
  ok('Phiên bản đổi khi gram đổi',
    phienBanDinhLuong([{ mat_hang_id: 'a', gram: 1 }]) !== phienBanDinhLuong([{ mat_hang_id: 'a', gram: 1.5 }]));
  ok('hienGram: 150,5 · 200 · null → trống', hienGram(150.5) === '150,5' && hienGram(200) === '200' && hienGram(null) === '');
});

// ===========================================================================
await nhom('3 · DANH SÁCH MÓN', async () => {
  const mon = [
    { id: 'm1', ten: 'Phở bò tái', ma_ipos: 'PHO1', dang_ban: true },
    { id: 'm2', ten: 'Bò nướng', ma_ipos: null, dang_ban: true },
    { id: 'm3', ten: 'Trà đá', ma_ipos: 'TD', dang_ban: false },
  ];
  const ds = ganDinhLuong(mon, [{ mon_id: 'm1', mat_hang_id: 'a', gram: 150 }, { mon_id: 'm1', mat_hang_id: 'b', gram: 30.5 }]);
  ok('Đếm số mặt hàng, tổng gram mỗi suất', ds[0].so_dong === 2 && ds[0].tong_gram === 180.5 && ds[1].so_dong === 0);
  ok('Mặc định: chỉ món đang bán', locMon(ds, '', '').map(m => m.id).join() === 'm1,m2');
  ok('Chip "Chưa có định lượng": món đang bán chưa có gram', locMon(ds, '', 'chua').map(m => m.id).join() === 'm2');
  ok('"Ngừng bán": món đã tắt', locMon(ds, '', 'ngung').map(m => m.id).join() === 'm3');
  ok('Tìm không dấu theo tên', locMon(ds, 'pho bo', '').map(m => m.id).join() === 'm1');
  ok('Tìm theo mã iPOS', locMon(ds, 'pho1', '').map(m => m.id).join() === 'm1');
  ok('Tham số lọc lạ → mặc định', docLocMon('xoa') === '' && docLocMon('chua') === 'chua');
});

// ===========================================================================
await nhom('4 · XEM TRƯỚC / ÁP DỤNG / LẤY MÓN TỪ iPOS', async () => {
  const x = docXemTruocDl({
    dong: [
      { stt: 2, ok: true, loi: null, mon: { id: null, ten: 'Lẩu', ma_ipos: null }, mat_hang: { id: 'a', ma: 'BAP', ten: 'Bắp' },
        gram: 120, gram_cu: null, tao_mon_moi: true, thay_doi: 'them' },
      { stt: 3, ok: false, loi: 'Dòng 3: không tìm thấy mặt hàng "X"', mon: null, mat_hang: null, gram: '80', tao_mon_moi: false },
    ],
    so_dong: 2, so_loi: 1, so_mon_moi: 1, them: 1, sua: 0, giu: 0, da_ap_dung: false, da_tao_mon: 0,
  });
  ok('Đọc kết quả database: dòng, lỗi, món mới', x.dong.length === 2 && x.dong[1].loi?.includes('Dòng 3')
    && x.dong[0].tao_mon_moi && x.so_loi === 1 && x.dong[1].gram === 80);
  ok('Kết quả rỗng / lạ không làm vỡ trang', docXemTruocDl(null).dong.length === 0 && docXemTruocDl('x').so_loi === 0);
  ok('Câu áp dụng: tạo món, thêm, sửa, giữ',
    cauApDungDl({ them: 3, sua: 1, giu: 2, da_tao_mon: 1 }) === 'Đã tạo 1 món mới, thêm 3 dòng gram, sửa 1 dòng gram (2 dòng giữ nguyên).');
  ok('Áp dụng lại cùng bảng → "Không có gì thay đổi"', /Không có gì thay đổi/.test(cauApDungDl({ them: 0, sua: 0, giu: 5, da_tao_mon: 0 })));
  ok('Lấy món từ iPOS: không có gì → nói vì sao', /đã bán trên iPOS/.test(cauMonTuIpos(0, 0)));
  ok('Lấy món từ iPOS: số món mới, số món được gắn mã', cauMonTuIpos(4, 1).includes('4 món mới') && cauMonTuIpos(4, 1).includes('1 món'));
});

// ===========================================================================
await nhom('5 · BÁO CÁO ĐỊNH MỨC: MÀU, CỘT TIỀN, CSV', async () => {
  const [d] = docDongDinhMuc([{
    mat_hang_id: 'a', ma: 'THAN', ten: 'Thăn', loai: 'phan_cat', kg_xuat_bep: '10', kg_ly_thuyet: '8', chenh_kg: '2',
    chenh_pt: '25', so_suat: '40', nguong_pt: '10', vuot_nguong: true, so_mon_chua_dinh_luong: 0, chua_co_ban: false, tien_chenh: null,
  }]);
  ok('Đọc số từ chuỗi numeric (10 kg bếp nhận, 8 kg lẽ ra dùng, lệch 25%)',
    d.kg_xuat_bep === 10 && d.kg_ly_thuyet === 8 && d.chenh_pt === 25 && d.tien_chenh === null);
  ok('Vượt ngưỡng (database nói) → đỏ', mucLech(d) === 'do');
  ok('Lệch 6% với ngưỡng 10% → vàng (quá nửa ngưỡng)', mucLech({ ...d, chenh_pt: 6, vuot_nguong: false }) === 'vang');
  ok('Lệch 3% → xanh', mucLech({ ...d, chenh_pt: -3, vuot_nguong: false }) === 'xanh');
  ok('Chưa có bán / chưa có lẽ ra dùng → xám', mucLech({ ...d, chua_co_ban: true }) === 'xam'
    && mucLech({ ...d, kg_ly_thuyet: 0, chenh_pt: null, vuot_nguong: false }) === 'xam');
  ok('Hiện lệch: +25% · −3,5% · —', hienLechPt(25) === '+25%' && hienLechPt(-3.5) === '−3,5%' && hienLechPt(null) === '—');
  ok('Hiện lệch kg có dấu', hienLechKg(2) === '+2' && hienLechKg(-0.25) === '−0,25' && hienLechKg(0) === '0');

  ok('Vai không xem giá: không có cột tiền', !cotDinhMuc(false).some(c => c.kieu === 'tien'));
  ok('Vai xem giá: có cột "Tiền lệch", đánh dấu tiền', cotDinhMuc(true).some(c => c.khoa === 'tien_chenh' && c.tienMat));
  const dong = [{ ...d }, { ...d, ten: 'Bắp', kg_xuat_bep: 1, kg_ly_thuyet: 2, chenh_kg: -1, chenh_pt: -50 }];
  const dnKhong = dinhNghiaDinhMuc(false);
  const csv = taoCsv(dnKhong.cot, dong, { tong: tinhTong(dnKhong, dong) });
  ok('CSV thủ kho: không chữ "Tiền"', !/Tiền/.test(csv));
  ok('CSV: dòng tổng cộng kg (11 bếp nhận, 10 lẽ ra dùng, lệch 1)', /Tổng;;11;10;1;;/.test(csv), csv.split('\r\n').at(-2));
  ok('Dòng tổng không tính % chung', tinhTong(dnKhong, dong)[0].so.chenh_pt === undefined);
  const dnCo = dinhNghiaDinhMuc(true);
  ok('CSV vai xem giá: có cột tiền', /Tiền lệch/.test(taoCsv(dnCo.cot, dong)));
});

// ===========================================================================
await nhom('6 · TRANG, MENU, HƯỚNG DẪN, CẢNH BÁO', async () => {
  const dl = doc(join(TRANG, 'noi-bo/kho/cai-dat/dinh-luong.astro'));
  const dm = doc(join(TRANG, 'noi-bo/kho/bao-cao/dinh-muc.astro'));
  const csvTs = doc(join(TRANG, 'noi-bo/kho/bao-cao/[ten].csv.ts'));
  const chan = s => s.split('\n').find(l => /!k\.duoc\(/.test(l) && /return Astro\.redirect/.test(l)) ?? '';
  ok('Định lượng món: chặn bằng danh_muc', /!k\.duoc\('danh_muc'\)/.test(chan(dl)), chan(dl));
  ok('Đối chiếu định mức: chặn bằng xem (thủ kho, NV quầy mở được)', /!k\.duoc\('xem'\)/.test(chan(dm)), chan(dm));
  ok('Hai trang có huongDan="dinh-luong"', /huongDan="dinh-luong"/.test(dl) && /huongDan="dinh-luong"/.test(dm));
  ok('Mục hướng dẫn "dinh-luong" cho quản lý, chủ',
    MUC_HUONG_DAN.some(m => m.id === 'dinh-luong' && m.vai.includes('quan_ly') && m.vai.includes('chu_so_huu')));
  for (const [ten, s] of [['dinh-luong', dl], ['dinh-muc', dm]]) {
    ok(`${ten}: không <script>, không onclick`, !/<script|onclick=/i.test(s));
    ok(`${ten}: form POST có ô viec (hoặc nút viec)`, !/method="POST"/.test(s) || /name="viec"/.test(s));
  }
  ok('Báo cáo: cột tiền chỉ khi xem_gia', /const coGia = k\.duoc\('xem_gia'\)/.test(dm) && /\{coGia && <th/.test(dm));
  ok('Lưới gram mang phiên bản (không đè người khác vừa sửa)', /name="phien_ban"/.test(dl) && /phienBanDinhLuong\(hienTai\)/.test(dl));
  ok('CSV: dinh-muc mở cho vai xem, file khác vẫn cần xem_gia',
    /ten === 'dinh-muc' \? !duoc\(nhanSu\.vai_tro, 'xem'\) : !duoc\(nhanSu\.vai_tro, 'xem_gia'\)/.test(csvTs));
  ok('CSV: cột tiền theo quyền người tải', /dinhNghiaDinhMuc\(coGia(, nn)?\)/.test(csvTs) && /const coGia = duoc\(nhanSu\.vai_tro, 'xem_gia'\)/.test(csvTs));
  ok('Báo cáo có link từ trang Báo cáo', /\/noi-bo\/kho\/bao-cao\/dinh-muc/.test(doc(join(TRANG, 'noi-bo/kho/bao-cao/index.astro'))));
  ok('Thiết lập có link "Định lượng món"', /\/noi-bo\/kho\/cai-dat\/dinh-luong/.test(doc(join(TRANG, 'noi-bo/kho/cai-dat/index.astro'))));

  const oDl = MUC_KHO.find(m => m.link === '/noi-bo/kho/cai-dat/dinh-luong');
  ok('Menu Khác: ô "Định lượng món" cho vai danh_muc', oDl && oDl.quyen.join() === 'danh_muc');
  const oDm = MUC_KHO.find(m => m.link === '/noi-bo/kho/bao-cao/dinh-muc');
  ok('Ô "Định mức bếp" mang số đỏ dinh_muc_lech, chỉ quản lý / chủ thấy',
    oDm && (oDm.dem ?? []).includes('dinh_muc_lech') && !oDm.quyen.some(q => duoc('thu_kho', q) || duoc('nhan_vien_quay', q)));

  const c = cauSuKien({ khoa: 'dinh_muc_lech', nhom: 'nhac_nho', ref_id: 'a', ref2: null, ma: 'THAN', ten: 'Thăn',
    phu: '2.5', so: 25, luc: '2026-09-24T17:00:00Z' });
  ok('Cảnh báo dinh_muc_lech mở báo cáo đúng 7 ngày', c.link === '/noi-bo/kho/bao-cao/dinh-muc?tu=2026-09-19&den=2026-09-25', c.link);
  ok('Trang báo cáo đọc tu / den (kyBaoCao)', /kyBaoCao\(q, homNay\)/.test(dm));
  ok('Có trang cho link cảnh báo', existsSync(join(TRANG, 'noi-bo/kho/bao-cao/dinh-muc.astro')));
});

process.exit(ketThuc('WEB ĐỊNH LƯỢNG & ĐỊNH MỨC'));
