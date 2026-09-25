/**
 * BEEFTOWN KHO — Kiểm thử phần web của Chuyển · Xuất · Hủy (GĐ5b)
 * ===============================================================
 *
 *     node test/test-kho-xuat-web.mjs
 *
 * Hàm thuần trong web/src/lib/kho/xuat.ts và bao-cao.ts — không cần database.
 * Chỗ nào cần biết database nhận gì (loại phiếu, trạng thái, cột báo cáo) thì
 * đọc thẳng file migration MỚI NHẤT có định nghĩa đó, để web và database không
 * lệch nhau khi có migration sau.
 *
 *   · Xuất khác: có tên, lập được, database nhận loại này.
 *   · Mọi trạng thái phiếu xuất (kể cả hàng đi đường) có nhãn tiếng Việt.
 *   · Báo hủy 3 bước: bước nào hiện sau mỗi lần bấm; hàng đi theo qua các
 *     bước bằng ô ẩn vẫn ra đúng một lần (không trừ hai lần).
 *   · Nút trên phiếu chuyển đi đường: ai thấy nút hủy chuyến, xử lý thiếu.
 *   · Xuất bếp nhanh: 6 món hay dùng.
 *   · Báo cáo: cột xuất khác, hao hụt khớp hàm kho_bao_cao_xnt_v2.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import {
  TEN_LOAI_XUAT, LOAI_LAP_DUOC, laNoiDeHang, buocHuySau, nutPhieuChuyen, monHayDung, docFormPhieuXuat,
} from '../../web/src/lib/kho/xuat.ts';
import { TRANG_THAI_CHUNG_TU } from '../../web/src/lib/kho/chung.ts';
import { BAO_CAO, TEN_LOAI_DONG_HAO_HUT, tinhTong, taoCsv } from '../../web/src/lib/kho/bao-cao.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ WEB CHUYỂN · XUẤT · HỦY');

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const THU_MUC_MIG = join(GOC, 'crm', 'supabase', 'migrations');
const cacMig = readdirSync(THU_MUC_MIG).filter(f => /^\d{4}_.+\.sql$/.test(f)).sort();
/** Nội dung migration mới nhất có chứa đoạn chữ này. */
function migMoiNhat(chua) {
  for (const f of [...cacMig].reverse()) {
    const s = readFileSync(join(THU_MUC_MIG, f), 'utf8');
    if (s.includes(chua)) return { ten: f, s };
  }
  return null;
}
/** Các giá trị trong "check (<cột> in ('a', 'b', …))" ngay sau tên ràng buộc. */
function giaTriCheck(s, tenRangBuoc) {
  const i = s.lastIndexOf(`add constraint ${tenRangBuoc}`);
  if (i < 0) return [];
  const doan = s.slice(i, s.indexOf(';', i));
  return [...doan.matchAll(/'([a-z_]+)'/g)].map(m => m[1]);
}
const docTrang = duong => readFileSync(join(GOC, 'web', 'src', duong), 'utf8');

// ===========================================================================
await nhom('1 · XUẤT KHÁC', async () => {
  ok('Có tên "Xuất khác"', TEN_LOAI_XUAT.xuat_khac === 'Xuất khác');
  ok('Lập được ở /xuat/moi (chuyển, xuất bếp, xuất khác, báo hủy)',
     ['chuyen', 'xuat_bep', 'xuat_khac', 'huy'].every(l => LOAI_LAP_DUOC.includes(l)) && !LOAI_LAP_DUOC.includes('tra_ncc'));
  ok('Loại nào lập được cũng có tên', LOAI_LAP_DUOC.every(l => TEN_LOAI_XUAT[l]));
  const m = migMoiNhat('add constraint kho_phieu_xuat_loai_hop_le');
  const loaiDb = m ? giaTriCheck(m.s, 'kho_phieu_xuat_loai_hop_le') : [];
  ok('Database nhận mọi loại web lập được', LOAI_LAP_DUOC.every(l => loaiDb.includes(l)), `${m?.ten}: ${loaiDb.join(', ')}`);
  ok('Mọi loại database có đều có tên trên web', loaiDb.length > 0 && loaiDb.every(l => TEN_LOAI_XUAT[l]), loaiDb.join(', '));
});

// ===========================================================================
await nhom('2 · TRẠNG THÁI PHIẾU (CẢ HÀNG ĐI ĐƯỜNG) CÓ NHÃN', async () => {
  const m = migMoiNhat('add constraint kho_phieu_xuat_trang_thai_hop_le');
  const tt = m ? giaTriCheck(m.s, 'kho_phieu_xuat_trang_thai_hop_le') : [];
  ok('Đọc được trạng thái từ migration', tt.includes('dang_chuyen') && tt.includes('nhan_thieu'), `${m?.ten}: ${tt.join(', ')}`);
  const thieu = tt.filter(t => !TRANG_THAI_CHUNG_TU[t]);
  ok('Mọi trạng thái phiếu xuất có nhãn tiếng Việt', thieu.length === 0, thieu.join(', '));
  ok('Nhãn không dùng chữ kỹ thuật', tt.every(t => !/[a-z]_[a-z]/.test(TRANG_THAI_CHUNG_TU[t]?.[0] ?? '')));
});

// ===========================================================================
await nhom('3 · NƠI LẤY / NƠI NHẬN', async () => {
  ok('Kho, quầy đang dùng: chọn được', laNoiDeHang({ loai: 'kho', dang_dung: true }) && laNoiDeHang({ loai: 'quay', dang_dung: true }));
  ok('Hàng chờ hủy: không', !laNoiDeHang({ loai: 'cho_huy', dang_dung: true }));
  ok('Đang mang ra quầy: không', !laNoiDeHang({ loai: 'dang_chuyen', dang_dung: true }));
  ok('Vị trí đã tắt: không', !laNoiDeHang({ loai: 'kho', dang_dung: false }));
  // Trang xuất không còn lọc kiểu cũ (lọt "Đang mang ra quầy").
  const trang = ['pages/noi-bo/kho/xuat/[id].astro', 'pages/noi-bo/kho/xuat/index.astro'];
  ok('Trang xuất không còn lọc "loai !== \'cho_huy\'" (thiếu Đang mang ra quầy)',
     trang.every(t => !/loai\s*!==\s*'cho_huy'/.test(docTrang(t))));
});

// ===========================================================================
await nhom('4 · BÁO HỦY 3 BƯỚC', async () => {
  const du = { hangXong: true, coLyDo: true };
  ok('Đọc mã / thêm dòng / món nhanh / sửa hàng → bước Hàng',
     ['quet', 'them_dong', 'them_mh', 'buoc_hang'].every(v => buocHuySau(v, du) === 'hang'));
  ok('Tiếp: chọn lý do → bước Lý do', buocHuySau('buoc_ly_do', { hangXong: true, coLyDo: false }) === 'ly_do');
  ok('Đổi lý do (đã có lý do) → vẫn về bước Lý do', buocHuySau('buoc_ly_do', du) === 'ly_do');
  ok('Chưa có hàng mà bấm tiếp → ở lại bước Hàng', buocHuySau('buoc_ly_do', { hangXong: false, coLyDo: false }) === 'hang');
  ok('Chọn lý do → bước Ảnh', buocHuySau('chon_ly_do', du) === 'anh');
  ok('Chọn lý do không còn dùng → ở lại bước Lý do', buocHuySau('chon_ly_do', { hangXong: true, coLyDo: false }) === 'ly_do');
  ok('Gửi bị từ chối vì thiếu ảnh → ở lại bước Ảnh', buocHuySau('ghi', du) === 'anh');
  ok('Gửi bị từ chối vì hàng lỗi → về bước Hàng', buocHuySau('ghi', { hangXong: false, coLyDo: true }) === 'hang');

  // Hàng đi qua bước 2, 3 bằng ô ẩn: đọc lại ra đúng những dòng đó, một lần.
  const matHang = [{ id: '11111111-1111-4111-8111-111111111111', ten: 'Thăn', dem_goi: true },
                   { id: '22222222-2222-4222-8222-222222222222', ten: 'Gầu', dem_goi: false }];
  const lo = '33333333-3333-4333-8333-333333333333';
  const f = new FormData();
  f.set('so_dong', '1');
  f.set('d0_mat_hang', matHang[0].id); f.set('d0_so_goi', '2'); f.set('d0_so_kg', '');
  f.set('so_lo', '1');
  f.set('l0_lo', lo); f.set('l0_mat_hang', matHang[1].id); f.set('l0_so_goi', ''); f.set('l0_so_kg', '0,8');
  const d = docFormPhieuXuat(f, matHang);
  ok('Ô ẩn đọc lại đủ 2 dòng, không lỗi', d.loi.length === 0 && d.payload.length === 2, JSON.stringify(d));
  ok('Dòng lô giữ đúng lô đã chọn', d.payload.some(p => p.lo_id === lo && p.so_kg === 0.8));
  // Luật GĐ4a vẫn giữ: một món ở cả hai phần bị chặn (không trừ hai lần).
  f.set('l0_mat_hang', matHang[0].id); f.set('l0_so_goi', '1'); f.set('l0_so_kg', '');
  ok('Cùng món ở cả hai phần vẫn bị chặn', docFormPhieuXuat(f, matHang).loi.some(c => /cả hai phần/.test(c)));

  const trang = docTrang('pages/noi-bo/kho/xuat/[id].astro');
  ok('Form báo hủy mang ô ẩn "buoc" và giữ ảnh đã tải (anh_da_tai)',
     /name="buoc"/.test(trang) && /name="anh_da_tai"/.test(trang));
  ok('Lý do báo hủy là nút lớn (nút gửi mang ly_do_id)', /type="submit" name="ly_do_id"/.test(trang));
});

// ===========================================================================
await nhom('5 · NÚT TRÊN PHIẾU CHUYỂN ĐI ĐƯỜNG', async () => {
  const lap = 'nguoi-lap', khac = 'nguoi-khac';
  const p = tt => ({ loai: 'chuyen', trang_thai: tt, nguoi_tao: lap });
  const thuKho = { id: lap, duyet: false, vanHanh: true };
  const quay = { id: khac, duyet: false, vanHanh: true };
  const ql = { id: khac, duyet: true, vanHanh: true };
  const keToan = { id: khac, duyet: false, vanHanh: false };
  ok('Người lập hủy được chuyến đang mang ra', nutPhieuChuyen(p('dang_chuyen'), thuKho).huyChuyen);
  ok('NV quầy (không phải người lập) không thấy nút hủy, thấy đường sang Nhận hàng',
     !nutPhieuChuyen(p('dang_chuyen'), quay).huyChuyen && nutPhieuChuyen(p('dang_chuyen'), quay).diNhan);
  ok('Quản lý hủy được chuyến người khác lập', nutPhieuChuyen(p('dang_chuyen'), ql).huyChuyen);
  ok('Quầy đã nhận thì không ai hủy được', !nutPhieuChuyen(p('da_nhan'), thuKho).huyChuyen && !nutPhieuChuyen(p('da_nhan'), ql).huyChuyen);
  ok('Nhận thiếu: quản lý thấy nút xử lý', nutPhieuChuyen(p('nhan_thieu'), ql).xuLyThieu);
  ok('Nhận thiếu: thủ kho, NV quầy không thấy', !nutPhieuChuyen(p('nhan_thieu'), thuKho).xuLyThieu && !nutPhieuChuyen(p('nhan_thieu'), quay).xuLyThieu);
  ok('Đã trả về / đã hủy: không còn nút nào', ['da_tra_ve', 'da_huy'].every(t => {
    const n = nutPhieuChuyen(p(t), ql);
    return !n.huyChuyen && !n.xuLyThieu && !n.diNhan;
  }));
  ok('Vai không vận hành không hủy được', !nutPhieuChuyen({ ...p('dang_chuyen'), nguoi_tao: khac }, keToan).huyChuyen);
  ok('Phiếu không phải chuyển: không nút', !Object.values(nutPhieuChuyen({ loai: 'xuat_bep', trang_thai: 'dang_chuyen', nguoi_tao: lap }, ql)).some(Boolean));

  const trang = docTrang('pages/noi-bo/kho/xuat/[id].astro');
  ok('Trang xử lý đủ ba việc (trả về, ghi mất, hủy chuyến)',
     ['tra_ve', 'ghi_mat', 'huy_chuyen'].every(v => trang.includes(`value="${v}"`) && trang.includes(`'${v}'`)));
  ok('Lý do xử lý thiếu bắt buộc trên form', /name="ly_do" required/.test(trang));
});

// ===========================================================================
await nhom('6 · XUẤT BẾP NHANH — MÓN HAY DÙNG', async () => {
  // Phiếu mới nhất trước.
  const dong = [
    { phieu_id: 'p1', mat_hang_id: 'A' }, { phieu_id: 'p1', mat_hang_id: 'B' },
    { phieu_id: 'p2', mat_hang_id: 'B' }, { phieu_id: 'p2', mat_hang_id: 'B' },
    { phieu_id: 'p3', mat_hang_id: 'C' }, { phieu_id: 'p3', mat_hang_id: 'A' },
    { phieu_id: 'p4', mat_hang_id: 'D' },
  ];
  const ds = monHayDung(dong);
  ok('Nhiều phiếu hơn đứng trước; một phiếu ghi hai dòng vẫn tính một', ds[0] === 'A' || ds[0] === 'B', ds.join());
  ok('Bằng số lần thì món dùng gần đây hơn đứng trước (A trước B)', ds.join() === 'A,B,C,D', ds.join());
  ok('Tối đa 6 món', monHayDung(Array.from({ length: 10 }, (_, i) => ({ phieu_id: `p${i}`, mat_hang_id: `M${i}` }))).length === 6);
  ok('Không có phiếu nào → không có nút', monHayDung([]).length === 0);
});

// ===========================================================================
await nhom('7 · BÁO CÁO: XUẤT KHÁC, HAO HỤT', async () => {
  const xnt = BAO_CAO['xuat-nhap-ton'];
  const khoa = xnt.cot.map(c => c.khoa);
  ok('Có cột xuất khác ngay sau xuất bếp',
     khoa.indexOf('xuat_khac_kg') === khoa.indexOf('xuat_bep_gia_tri') + 1 && khoa.includes('xuat_khac_gia_tri'), khoa.join());
  ok('Có cột hao hụt ngay sau kiểm kê',
     khoa.indexOf('hao_hut_kg') === khoa.indexOf('kiem_ke_gia_tri') + 1 && khoa.includes('hao_hut_gia_tri'), khoa.join());
  ok('Cột tiền mới là cột ẩn với vai không xem giá',
     xnt.cot.filter(c => /^(xuat_khac|hao_hut)_gia_tri$/.test(c.khoa)).every(c => c.tienMat));
  ok('Mọi cột được cộng đều có trong bảng', (xnt.cong ?? []).every(c => khoa.includes(c)));

  // Cột web đọc phải có trong hàm kho_bao_cao_xnt_v2 (migration mới nhất định nghĩa nó).
  const m = migMoiNhat('create or replace function kho_bao_cao_xnt_v2');
  const i = m ? m.s.lastIndexOf('create or replace function kho_bao_cao_xnt_v2') : -1;
  const tra = i >= 0 ? m.s.slice(m.s.indexOf('returns table', i), m.s.indexOf('language', i)) : '';
  const cotDb = [...tra.matchAll(/([a-z_]+)\s+(?:uuid|text|boolean|numeric|bigint|int)\b/g)].map(x => x[1]);
  ok('Đọc được cột của kho_bao_cao_xnt_v2', cotDb.includes('xuat_khac_kg') && cotDb.includes('hao_hut_gia_tri'), `${m?.ten}: ${cotDb.join()}`);
  const la = khoa.filter(k => !cotDb.includes(k));
  ok('Mọi cột trên web có trong hàm database', la.length === 0, la.join());
  const web = docTrang('lib/kho/bao-cao.ts');
  ok('Xuất – nhập – tồn gọi hàm mới', web.includes("rpc('kho_bao_cao_xnt_v2'"));

  const tong = tinhTong(xnt, [
    { ten: 'Thăn', xuat_khac_kg: 0.1, xuat_khac_gia_tri: 30000, hao_hut_kg: 0.25, hao_hut_gia_tri: 90000 },
    { ten: 'Gầu', xuat_khac_kg: 0.2, xuat_khac_gia_tri: 40000, hao_hut_kg: 0, hao_hut_gia_tri: 0 },
  ]);
  ok('Dòng tổng cộng cả xuất khác và hao hụt',
     tong[0]?.so.xuat_khac_kg === 0.3 && tong[0]?.so.xuat_khac_gia_tri === 70000 && tong[0]?.so.hao_hut_kg === 0.25, JSON.stringify(tong));
  const csv = taoCsv(xnt.cot, [{ ten: 'Thăn', xuat_khac_kg: 1.5 }], { tong });
  const dau = csv.slice(1).split('\r\n')[0];
  ok('File Excel: có tiêu đề cột mới, vẫn BOM + chấm phẩy', csv.charCodeAt(0) === 0xFEFF
     && dau.includes('Xuất khác kg') && dau.includes('Hao hụt kg') && dau.split(';').length === xnt.cot.length, dau);

  // Mọi nhóm của báo cáo hao hụt có tên tiếng Việt.
  const mh = migMoiNhat('create or replace function kho_bao_cao_hao_hut');
  const j = mh ? mh.s.lastIndexOf('create or replace function kho_bao_cao_hao_hut') : -1;
  const than = j >= 0 ? mh.s.slice(j, mh.s.indexOf('$$;', mh.s.indexOf('$$', j) + 2)) : '';
  const nhomDb = new Set(['kiem_ke_thieu', 'kiem_ke_thua']);
  const inLoai = than.match(/d\.loai in \(([^)]*)\)/);
  for (const x of (inLoai?.[1] ?? '').matchAll(/'([a-z_]+)'/g)) if (x[1] !== 'kiem_ke') nhomDb.add(x[1]);
  ok('Đọc được nhóm báo cáo hao hụt', nhomDb.has('xuat_khac') && nhomDb.has('hao_hut'), [...nhomDb].join());
  const thieu = [...nhomDb].filter(n => !TEN_LOAI_DONG_HAO_HUT[n]);
  ok('Mọi nhóm hao hụt có tên tiếng Việt', thieu.length === 0, thieu.join());
});

process.exit(ketThuc('WEB CHUYỂN · XUẤT · HỦY'));
