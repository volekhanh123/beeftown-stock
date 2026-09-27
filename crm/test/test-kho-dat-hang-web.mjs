/**
 * BEEFTOWN KHO — Kiểm thử phần web của Đặt hàng NCC · Nhận theo đơn · Đánh giá NCC (GĐ8a)
 * =====================================================================================
 *
 *     node test/test-kho-dat-hang-web.mjs
 *
 * Phần database ở test-kho-dat-hang.mjs. Ở đây:
 *   · Hàm thuần web/src/lib/kho/dat-hang.ts: đọc form đơn (thủ kho KHÔNG BAO GIỜ
 *     gửi khóa giá), số gợi ý điền sẵn, sao, tin nhắn Zalo, cột báo cáo NCC.
 *   · Các hàm gọi database của dat-hang.ts chạy thật trên PGlite qua một client
 *     giả (rpc → câu SQL dưới danh nghĩa từng vai): lập nháp (thủ kho), sửa + gửi
 *     (quản lý), đọc đơn chỉ kg, gợi ý, nhận hàng theo đơn, đánh giá NCC.
 *   · Mã nguồn trang: dòng chặn quyền, huongDan, không <script>, giá chỉ vai xem
 *     giá, menu / quy trình / CSV / in-an.js / nhận hàng có cột "Đặt".
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';
import {
  docFormDonDat, chuFormDonDat, soDongThem, formTuDon, oKgGoiY, oGoiGoiY, chuSao, mucSao, chuThuGiao,
  tinNhanDon, cotDanhGiaNcc, dinhNghiaDanhGiaNcc, docLocDon, nhanTrangThaiDon, LOC_DON, TRANG_THAI_DON,
  luuDonDat, guiDonDat, huyDonDat, docDonDat, docDsDonDat, docDonChoNhan, docGoiYDatHang, taoPhieuTuDon,
  docDanhGiaNcc, luuMucDatHang,
} from '../../web/src/lib/kho/dat-hang.ts';
import { taoCsv, tinhTong } from '../../web/src/lib/kho/bao-cao.ts';
import { MUC_KHO, THAO_TAC_NHANH, mucCuaVai } from '../../web/src/lib/kho/dieu-huong.ts';
import { QUY_TRINH } from '../../web/src/lib/kho/quy-trinh.ts';
import { MUC_HUONG_DAN } from '../../web/src/lib/kho/huong-dan.ts';
import { cauSuKien } from '../../web/src/lib/kho/viec.ts';
import { duoc } from '../../web/src/lib/kho/chung.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ WEB ĐẶT HÀNG NHÀ CUNG CẤP');

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web');
const TRANG = join(WEB, 'src', 'pages', 'noi-bo', 'kho');
const MIG = join(GOC, 'crm', 'supabase', 'migrations');
const doc = p => readFileSync(p, 'utf8');
const SQL = readdirSync(MIG).filter(f => /^\d{4}_.+\.sql$/.test(f)).sort().reverse()
  .map(f => doc(join(MIG, f))).find(s => s.includes('create or replace function kho_luu_don_dat(')) ?? '';

const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
/** FormData giả có getAll (như FormData thật). */
function taoForm(o) {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) {
    if (Array.isArray(v)) for (const x of v) f.append(k, x); else f.set(k, v);
  }
  return f;
}
const MON = new Map([
  [id(1), { ten: 'Thăn ngoại', dem_goi: true, don_vi_goi: 'tảng' }],
  [id(2), { ten: 'Bắp bò', dem_goi: false, don_vi_goi: 'gói' }],
  [id(3), { ten: 'Nạm', dem_goi: true, don_vi_goi: 'gói' }],
]);

// ===========================================================================
await nhom('1 · ĐỌC FORM ĐƠN ĐẶT', async () => {
  const f = taoForm({
    mh: [id(1), id(2)],
    [`kg_${id(1)}`]: '12,5', [`goi_${id(1)}`]: '1', [`gia_${id(1)}`]: '480.000',
    [`kg_${id(2)}`]: '',                                   // trống = không đặt
    t0_mh: id(3), t0_kg: '3.2', t0_goi: '', t0_gia: '',
    t1_mh: '', t1_kg: '', so_dong: '2', ngay_giao: '2026-10-02', ghi_chu: '  giao sớm  ',
  });
  const tk = docFormDonDat(f, MON, { coGia: false, soDong: 2 });
  ok('Thủ kho: đọc 2 món (món trống kg bị bỏ)', tk.loi.length === 0 && tk.dong.length === 2, JSON.stringify(tk));
  ok('Thủ kho: KHÔNG dòng nào có khóa don_gia_du_kien (database từ chối nếu có)',
    tk.dong.every(d => !('don_gia_du_kien' in d)));
  ok('Kg dấu phẩy / dấu chấm, gói trống = null', tk.dong[0].so_kg_dat === 12.5 && tk.dong[0].so_goi_dat === 1
    && tk.dong[1].so_kg_dat === 3.2 && tk.dong[1].so_goi_dat === null);
  ok('Ngày giao, ghi chú đã cắt khoảng trắng', tk.ngayGiao === '2026-10-02' && tk.chu.ghiChu === 'giao sớm');

  const ql = docFormDonDat(f, MON, { coGia: true, soDong: 2 });
  ok('Quản lý: có khóa giá ở MỌI dòng (trống = null — xóa giá)',
    ql.dong[0].don_gia_du_kien === 480000 && ql.dong[1].don_gia_du_kien === null && 'don_gia_du_kien' in ql.dong[1]);

  const khoa = [...new Set(ql.dong.flatMap(d => Object.keys(d)))];
  const cKhoa = SQL.match(/c_khoa\s+constant text\[\] := array\[([^\]]+)\]/)?.[1] ?? '';
  ok('Khóa gửi đúng khóa kho_luu_don_dat nhận', khoa.every(k => cKhoa.includes(`'${k}'`)), `${khoa} / ${cKhoa}`);

  const loi = (o, coGia = false) => docFormDonDat(taoForm({ mh: [id(1)], so_dong: '1', ...o }), MON, { coGia, soDong: 1 }).loi;
  ok('Kg sai → câu có tên món', loi({ [`kg_${id(1)}`]: '12kg5' })[0]?.startsWith('Thăn ngoại:'), loi({ [`kg_${id(1)}`]: '12kg5' })[0]);
  ok('Gói không kg → nhắc ghi kg', /ghi số kg/.test(loi({ [`goi_${id(1)}`]: '2' })[0] ?? ''));
  ok('Gói lẻ → báo số nguyên', /số nguyên/.test(loi({ [`kg_${id(1)}`]: '5', [`goi_${id(1)}`]: '1,5' })[0] ?? ''));
  ok('Trùng món ở dòng thêm → báo gộp', /gộp lại/.test(loi({ [`kg_${id(1)}`]: '5', t0_mh: id(1), t0_kg: '2' }).join(' ')));
  ok('Dòng thêm có kg mà chưa chọn món → báo', /Dòng thêm 1: chọn món/.test(loi({ t0_kg: '2' }).join(' ')));
  ok('Không món nào → câu dễ hiểu', /chưa có món nào/.test(loi({}).join(' ')));
  ok('Giá sai (vai xem giá) → báo', /giá dự kiến là số đồng/.test(loi({ [`kg_${id(1)}`]: '5', [`gia_${id(1)}`]: '4,8 triệu' }, true).join(' ')));
  ok('Ngày giao không có thật → báo', /Ngày giao/.test(loi({ [`kg_${id(1)}`]: '5', ngay_giao: '2026-02-30' }).join(' ')));
  ok('Món lạ (không có trong danh mục) ở dòng có sẵn → không gửi', docFormDonDat(
    taoForm({ mh: [id(9)], [`kg_${id(9)}`]: '3', so_dong: '1' }), MON, { coGia: false, soDong: 1 }).dong.length === 0);

  const chu = chuFormDonDat(taoForm({ mh: [id(1), 'x', id(1)], [`kg_${id(1)}`]: '7', t0_kg: '1' }), 2);
  ok('chuFormDonDat: bỏ mh không phải uuid / trùng, giữ chữ đã gõ', chu.co.size === 1 && chu.co.get(id(1)).kg === '7'
    && chu.them.length === 2 && chu.them[0].kg === '1');
  ok('soDongThem: 1–30, sai → mặc định', soDongThem(taoForm({ so_dong: '5' })) === 5
    && soDongThem(taoForm({ so_dong: '99' })) === 3 && soDongThem(null, 2) === 2);
  ok('formTuDon: kg dấu phẩy, giá có dấu chấm nghìn',
    JSON.stringify(formTuDon({ mat_hang_id: id(1), so_kg_dat: 12.5, so_goi_dat: 2 }, 480000))
      === JSON.stringify({ mh: id(1), kg: '12,5', goi: '2', gia: '480.000' }));
});

// ===========================================================================
await nhom('2 · CHỮ HIỂN THỊ', async () => {
  ok('Số gợi ý điền sẵn: 22 → "22", 0,35 → "0,35", 0 → trống',
    oKgGoiY({ de_nghi_kg: 22 }) === '22' && oKgGoiY({ de_nghi_kg: 0.35 }) === '0,35' && oKgGoiY({ de_nghi_kg: 0 }) === '');
  ok('Gói gợi ý chỉ món đếm gói', oGoiGoiY({ dem_goi: true, de_nghi_goi: 2 }) === '2'
    && oGoiGoiY({ dem_goi: false, de_nghi_goi: 2 }) === '' && oGoiGoiY({ dem_goi: true, de_nghi_goi: null }) === '');
  ok('Sao: 4,5 → ★★★★½, 1 → ★☆☆☆☆, null → chưa đủ số liệu',
    chuSao(4.5) === '★★★★½' && chuSao(1) === '★☆☆☆☆' && chuSao(5) === '★★★★★' && chuSao(null) === 'chưa đủ số liệu', chuSao(4.5));
  ok('Màu sao', mucSao(4) === 'xanh' && mucSao(3.5) === 'vang' && mucSao(2) === 'do' && mucSao(null) === 'xam');
  ok('Thứ giao', chuThuGiao(null) === 'Giao mọi ngày' && chuThuGiao([1, 4]) === 'Giao T2, T5' && chuThuGiao([7]) === 'Giao CN');
  ok('Lọc: chỉ nhận khóa có thật', docLocDon('dang_cho') === 'dang_cho' && docLocDon('xoa') === '' && docLocDon(null) === '');
  ok('Mọi trạng thái database có nhãn', ['nhap', 'da_gui', 'nhan_mot_phan', 'da_nhan', 'huy']
    .every(t => TRANG_THAI_DON[t] && nhanTrangThaiDon(t)[0] !== t));
  const ttSql = SQL.match(/kho_don_dat_trang_thai_hop_le\s+check \(trang_thai in \(([^)]+)\)\)/)?.[1] ?? '';
  ok('Nhãn trạng thái khớp ràng buộc database', Object.keys(TRANG_THAI_DON).every(t => ttSql.includes(`'${t}'`)), ttSql);
  ok('Chip lọc khớp kho_ds_don_dat_kg (dang_cho = đã gửi + nhận một phần)',
    LOC_DON.every(([k]) => !k || k === 'dang_cho' || ttSql.includes(`'${k}'`)) && /p_trang_thai = 'dang_cho'/.test(SQL));

  const don = { so_phieu: 'DH-2609-0001', ngay_giao_du_kien: '2026-09-28', ghi_chu: 'Giao trước 9 giờ', ten_nha_cung_cap: 'NCC Úc',
    dong: [{ mat_hang_id: id(1), ten_mat_hang: 'Thăn ngoại', so_kg_dat: 12.5, so_goi_dat: 1, don_vi_goi: 'tảng' },
           { mat_hang_id: id(2), ten_mat_hang: 'Bắp bò', so_kg_dat: 3, so_goi_dat: null, don_vi_goi: 'gói' }] };
  const t = tinNhanDon(don, { chiNhanh: 'Quận 1' });
  ok('Tin nhắn Zalo: số đơn, NCC, ngày giao, từng món kg / gói, ghi chú',
    t.includes('DH-2609-0001') && t.includes('NCC Úc') && t.includes('28/09/2026') && t.includes('1. Thăn ngoại: 12,5 kg (1 tảng)')
    && t.includes('2. Bắp bò: 3 kg') && t.includes('Giao trước 9 giờ'), t);
  ok('Tin nhắn không chọn giá → không có chữ "đ/kg"', !/đ\/kg/.test(t));
  const tg = tinNhanDon(don, { gia: new Map([[id(1), 480000], [id(2), null]]) });
  ok('Tin nhắn kèm giá: chỉ món có giá', tg.includes('12,5 kg (1 tảng) · 480.000 đ/kg') && !/Bắp bò: 3 kg ·/.test(tg), tg);
});

// ===========================================================================
await nhom('3 · CỘT ĐÁNH GIÁ NCC, CSV', async () => {
  // Bản kho_bao_cao_ncc mới nhất (0048 thêm cột hao repack).
  const sqlNcc = readdirSync(MIG).filter(f => /^\d{4}_.+\.sql$/.test(f)).sort().reverse()
    .map(f => doc(join(MIG, f))).find(s => s.includes('create or replace function kho_bao_cao_ncc(')) ?? '';
  const tra = sqlNcc.slice(sqlNcc.indexOf('create or replace function kho_bao_cao_ncc('));
  const cotSql = tra.slice(tra.indexOf('returns table ('), tra.indexOf(')\nlanguage'));
  const cot = cotDanhGiaNcc(true);
  ok('Mọi cột bảng là cột kho_bao_cao_ncc trả về', cot.every(c => new RegExp(`\\b${c.khoa}\\b`).test(cotSql)),
    cot.filter(c => !new RegExp(`\\b${c.khoa}\\b`).test(cotSql)).map(c => c.khoa).join(', '));
  const khongGia = cotDanhGiaNcc(false).map(c => c.khoa);
  ok('Không xem giá: bỏ giá TB, lệch hóa đơn, ngày trả tiền',
    !['gia_tb_kg', 'so_lan_lech_hoa_don', 'so_ngay_tra_tb'].some(k => khongGia.includes(k)) && cotDanhGiaNcc(false).every(c => !c.tienMat));
  ok('Xem giá: có đủ 3 cột đó', ['gia_tb_kg', 'so_lan_lech_hoa_don', 'so_ngay_tra_tb'].every(k => cot.some(c => c.khoa === k)));
  const dn = dinhNghiaDanhGiaNcc(false);
  const dong = [
    { ten: 'NCC Úc', diem_sao: 4.5, so_phieu: 2, tong_kg: 60.5, so_don: 2, so_don_thieu: 1, kg_thieu: 1.2, so_don_tre: 0,
      thu_hoi_tb_pt: 80, so_phien_pha: 1, kg_tra: 0 },
    { ten: '=HYPERLINK()', diem_sao: null, so_phieu: 1, tong_kg: 3, so_don: 0, so_don_thieu: 0, kg_thieu: 0, so_don_tre: 0,
      thu_hoi_tb_pt: null, so_phien_pha: 0, kg_tra: 1 },
  ];
  const tong = tinhTong(dn, dong)[0];
  ok('Dòng tổng cộng kg, số đơn, không cộng sao', tong.so.tong_kg === 63.5 && tong.so.so_don === 2 && !('diem_sao' in tong.so));
  const csv = taoCsv(dn.cot, dong, { tong: tinhTong(dn, dong) });
  ok('CSV: BOM, dấu ;, kg dấu phẩy, chặn công thức Excel', csv.startsWith('﻿') && csv.includes('NCC Úc;4,5;2;60,5')
    && csv.includes("'=HYPERLINK()"), csv.split('\r\n')[1]);
  ok('CSV không xem giá: không có chữ "Giá"', !/Giá TB|Lệch hóa đơn|trả tiền/.test(csv.split('\r\n')[0]));
});

// ===========================================================================
// Client giả: .rpc(tên, tham số) → câu SQL chạy dưới danh nghĩa một vai.
const { db, cnA, duoi } = await dungDatabase();
const traVeBang = new Map((await db.query(
  `select proname, proretset from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and proname like 'kho_%'`)).rows.map(r => [r.proname, r.proretset]));
function clientCua(uid) {
  return {
    async rpc(ten, thamSo) {
      const ds = Object.entries(thamSo);
      const doi = ds.map(([k, v], i) => `${k} => $${i + 1}${v !== null && typeof v === 'object' ? '::jsonb' : ''}`).join(', ');
      const gt = ds.map(([, v]) => (v !== null && typeof v === 'object' ? JSON.stringify(v) : v));
      const sql = traVeBang.get(ten) ? `select * from ${ten}(${doi})` : `select ${ten}(${doi}) as r`;
      const kq = await duoi(uid, sql, gt);
      if (kq.loi) return { data: null, error: { message: kq.loi } };
      return { data: traVeBang.get(ten) ? kq.rows : kq.rows[0]?.r ?? null, error: null };
    },
  };
}
const tk = clientCua(UID.thuKhoA);
/** Khóa có dáng tiền ("giao" trong ngày giao / số ngày giao là chữ, không phải "gia"). */
const laTien = k => /(^|_)(gia|don_gia|tien|thanh_tien)(_|$)/.test(k);
const ql = clientCua(UID.qlA);
const kt = clientCua(UID.keToanA);

await nhom('4 · LUỒNG THẬT QUA dat-hang.ts (PGlite)', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  const mh = Object.fromEntries((await db.query(`select ma, id, ten, dem_goi, don_vi_goi from kho_mat_hang`)).rows.map(r => [r.ma, r]));
  const mon = new Map(Object.values(mh).map(m => [m.id, { ten: m.ten, dem_goi: m.dem_goi, don_vi_goi: m.don_vi_goi }]));
  const ncc = (await duoi(UID.keToanA, `insert into kho_nha_cung_cap (ten, so_ngay_giao) values ('NCC Web', 2) returning id`)).rows[0].id;
  const vtKho = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'kho'`, [cnA.id])).rows[0].id;

  // Lịch sử: quản lý nhập 2 tảng thăn ngoại của NCC Web → gợi ý có món này.
  const lsu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(p_id => null, p_chi_nhanh_id => $1::uuid, p_ma_gui => $2::uuid, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3::uuid, p_vi_tri_id => $4::uuid, p_ngay_nhap => hom_nay_vn() - 3,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null, p_tien_thue => 0, p_chi_phi_khac => 0,
      p_ghi_chu => null, p_anh => array[$1::text || '/nhap/x/1.jpg'], p_truong_them => '{}'::jsonb, p_dong => $5::jsonb)`,
    [cnA.id, maGui(), ncc, vtKho, JSON.stringify([{ mat_hang_id: mh['T-THANNGOAI'].id, so_goi: 2, so_kg: 28, don_gia_kg: 500000 }])]);
  const pn = lsu.rows?.[0];
  await duoi(UID.qlA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [pn?.phieu_id, pn?.phien_ban_moi]);
  const duyet = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [pn?.phieu_id]);
  ok('Chuẩn bị: một phiếu mua đã duyệt của NCC Web', lsu.loi === null && duyet.loi === null, lsu.loi ?? duyet.loi ?? '');

  const r = await luuMucDatHang(ql, mh['T-THANNGOAI'].id, 10, 50);
  ok('luuMucDatHang (quản lý) lưu mức kho lạnh', r.ok, r.cau);
  ok('luuMucDatHang (thủ kho) bị từ chối', !(await luuMucDatHang(tk, mh['T-THANNGOAI'].id, 1, 2)).ok);

  const goiY = await docGoiYDatHang(tk, cnA.id, ncc);
  const than = goiY.find(g => g.mat_hang_id === mh['T-THANNGOAI'].id);
  ok('docGoiYDatHang (thủ kho): có thăn ngoại, số là number, không khóa tiền',
    !!than && typeof than.de_nghi_kg === 'number' && than.de_nghi_kg === 22 && !Object.keys(than).some(laTien),
    JSON.stringify(than));
  ok('Ô kg điền sẵn = số gợi ý', oKgGoiY(than ?? { de_nghi_kg: 0 }) === '22');

  // Thủ kho lập nháp bằng đúng dạng form của trang (không khóa giá).
  const f = taoForm({ mh: [mh['T-THANNGOAI'].id], [`kg_${mh['T-THANNGOAI'].id}`]: oKgGoiY(than), [`goi_${mh['T-THANNGOAI'].id}`]: '2',
    t0_mh: mh['C-BAPBO']?.id ?? mh['C-NACVAI'].id, t0_kg: '3,5', so_dong: '1' });
  const doc1 = docFormDonDat(f, mon, { coGia: false, soDong: 1 });
  const g = maGui();
  const lap = await luuDonDat(tk, cnA.id, { id: null, maGui: g, phienBan: null, nccId: ncc, ngayGiao: null, ghiChu: '', dong: doc1.dong });
  ok('luuDonDat (thủ kho, không giá): lập nháp', lap.ok && !!lap.id && lap.phienBan === 1, lap.cau);
  const lai = await luuDonDat(tk, cnA.id, { id: null, maGui: g, phienBan: null, nccId: ncc, ngayGiao: null, ghiChu: '', dong: doc1.dong });
  ok('Bấm Lưu hai lần (cùng ma_gui) → cùng đơn, câu "từ lần bấm trước"', lai.ok && lai.id === lap.id && /lần bấm trước/.test(lai.cau));
  const coGiaTk = await luuDonDat(tk, cnA.id, { id: null, maGui: maGui(), phienBan: null, nccId: ncc, ngayGiao: null, ghiChu: '',
    dong: docFormDonDat(f, mon, { coGia: true, soDong: 1 }).dong });
  ok('Nếu lỡ gửi khóa giá khi là thủ kho → database từ chối (vì thế web không gửi)', !coGiaTk.ok && /không điền giá/.test(coGiaTk.cau), coGiaTk.cau);

  const d1 = await docDonDat(tk, lap.id);
  ok('docDonDat (thủ kho): 2 dòng, số là number, không khóa tiền', d1?.dong.length === 2 && d1.dong[0].so_kg_dat === 22
    && d1.dong[0].so_goi_dat === 2 && !Object.keys(d1).some(laTien)
    && d1.dong.every(x => !Object.keys(x).some(laTien)), JSON.stringify(d1?.dong?.[0]));
  ok('docDonDat: id lạ → null', (await docDonDat(tk, id(77))) === null && (await docDonDat(tk, 'khong-phai-uuid')) === null);
  const ds = await docDsDonDat(tk, cnA.id, 'nhap', { q: '', tu: null, den: null, cuaToi: true, trang: 1 });
  ok('docDsDonDat (thủ kho, của tôi, nháp): thấy đơn vừa lập', ds.some(x => x.id === lap.id && x.tong_kg_dat === 25.5), JSON.stringify(ds[0]));

  const guiTk = await guiDonDat(tk, lap.id, d1.phien_ban);
  ok('Thủ kho không gửi được đơn', !guiTk.ok);
  const guiKt = await guiDonDat(kt, lap.id, d1.phien_ban);
  ok('Kế toán không gửi được đơn (không có quyền nhap)', !guiKt.ok);

  // Quản lý mở nháp, điền giá (form có khóa giá), lưu rồi gửi.
  const f2 = taoForm({ mh: d1.dong.map(x => x.mat_hang_id),
    ...Object.fromEntries(d1.dong.flatMap(x => {
      const o = formTuDon(x, null);
      return [[`kg_${x.mat_hang_id}`, o.kg], [`goi_${x.mat_hang_id}`, o.goi], [`gia_${x.mat_hang_id}`, x.so_kg_dat === 22 ? '480.000' : '']];
    })), so_dong: '1' });
  const doc2 = docFormDonDat(f2, mon, { coGia: true, soDong: 1 });
  const sua = await luuDonDat(ql, cnA.id, { id: lap.id, maGui: maGui(), phienBan: d1.phien_ban, nccId: ncc,
    ngayGiao: null, ghiChu: 'Giao sáng', dong: doc2.dong });
  ok('Quản lý sửa nháp kèm giá dự kiến', sua.ok && sua.phienBan === 2, sua.cau);
  const cu = await luuDonDat(tk, cnA.id, { id: lap.id, maGui: maGui(), phienBan: d1.phien_ban, nccId: ncc,
    ngayGiao: null, ghiChu: '', dong: doc1.dong });
  ok('Lưu bằng phiên bản cũ → "máy khác", không đè', !cu.ok && /máy khác/.test(cu.cau), cu.cau);
  const { rows: [gia] } = await db.query(`select don_gia_du_kien from kho_don_dat_dong where don_dat_id = $1 and so_kg_dat = 22`, [lap.id]);
  ok('Giá dự kiến đã lưu', Number(gia?.don_gia_du_kien) === 480000);
  const gui = await guiDonDat(ql, lap.id, sua.phienBan);
  ok('Quản lý gửi đơn', gui.ok && /Đã gửi đơn/.test(gui.cau), gui.cau);

  const cho = await docDonChoNhan(tk, cnA.id);
  ok('docDonChoNhan (màn nhận hàng): đơn vừa gửi có trong danh sách', cho.some(x => x.id === lap.id));
  ok('docDonChoNhan lỗi quyền → rỗng, không ném lỗi', (await docDonChoNhan(clientCua(UID.nvQuayA), cnA.id)).length === 0);

  const pm = maGui();
  const nhan = await taoPhieuTuDon(tk, lap.id, pm);
  ok('taoPhieuTuDon (thủ kho): tạo phiếu nhận hàng', nhan.ok && !!nhan.id, nhan.cau);
  ok('Bấm lại → cùng phiếu nháp', (await taoPhieuTuDon(tk, lap.id, maGui())).id === nhan.id);
  const pk = await clientCua(UID.thuKhoA).rpc('kho_doc_phieu_nhap_kg', { p_id: nhan.id });
  const dd = pk.data?.don_dat;
  ok('Màn nhận hàng đọc được đơn của phiếu (cột "Đặt")', dd?.id === lap.id && dd.dong.length === 2
    && dd.dong.some(x => Number(x.so_kg_dat) === 22), JSON.stringify(dd));
  ok('Phiếu điền sẵn kg còn thiếu, không có giá', pk.data?.dong?.length === 2
    && pk.data.dong.every(x => !Object.keys(x).some(laTien)));

  const huyTk = await huyDonDat(tk, lap.id, 'thử');
  ok('Thủ kho không hủy được đơn đã gửi', !huyTk.ok);
  const huyKhongLyDo = await huyDonDat(ql, lap.id, null);
  ok('Hủy đơn đã gửi phải có lý do', !huyKhongLyDo.ok && /lý do/.test(huyKhongLyDo.cau));

  const dg = await docDanhGiaNcc(tk, cnA.id, '2026-01-01', '2026-12-31');
  const dong = dg.dong.find(x => x.nha_cung_cap_id === ncc);
  ok('docDanhGiaNcc (thủ kho): có NCC, cột tiền là null', dg.loi === null && !!dong && dong.gia_tb_kg === null
    && dong.so_lan_lech_hoa_don === null && dong.so_ngay_tra_tb === null && dong.tong_kg === 28, JSON.stringify(dong));
  const dgKt = (await docDanhGiaNcc(kt, cnA.id, '2026-01-01', '2026-12-31')).dong.find(x => x.nha_cung_cap_id === ncc);
  ok('docDanhGiaNcc (kế toán): có giá TB/kg', dgKt?.gia_tb_kg === 500000, JSON.stringify(dgKt));
  const saiKy = await docDanhGiaNcc(tk, cnA.id, '2026-12-31', '2026-01-01');
  ok('Kỳ ngược → câu lỗi, không ném', saiKy.loi !== null && saiKy.dong.length === 0);
});

// ===========================================================================
await nhom('5 · TRANG: QUYỀN, HƯỚNG DẪN, JAVASCRIPT, TIỀN', async () => {
  const TEP = {
    ds: join(TRANG, 'dat-hang/index.astro'), moi: join(TRANG, 'dat-hang/moi.astro'),
    xem: join(TRANG, 'dat-hang/[id].astro'), in: join(TRANG, 'dat-hang/[id]/in.astro'), ncc: join(TRANG, 'bao-cao/ncc.astro'),
  };
  for (const [ten, p] of Object.entries(TEP)) ok(`Có trang ${ten}`, existsSync(p));
  const ma = Object.fromEntries(Object.entries(TEP).map(([k, p]) => [k, existsSync(p) ? doc(p) : '']));
  const chan = s => s.split('\n').find(d => /!k\.duoc\(/.test(d) && /return Astro\.redirect/.test(d)) ?? '';
  ok('Lập đơn: chỉ quyền nhap', /if \(!k\.duoc\('nhap'\)\) return Astro\.redirect/.test(chan(ma.moi)));
  for (const k of ['ds', 'xem', 'in', 'ncc']) {
    ok(`${k}: nhap HOẶC xem_gia (kế toán xem, thủ kho xem kg)`, /!k\.duoc\('nhap'\) && !k\.duoc\('xem_gia'\)/.test(chan(ma[k])), chan(ma[k]));
  }
  const idHd = new Set(MUC_HUONG_DAN.map(m => m.id));
  for (const [k, s] of Object.entries(ma)) {
    const hd = s.match(/huongDan="([^"]+)"/)?.[1];
    ok(`${k}: nút "?" trỏ mục hướng dẫn có thật (${hd})`, !!hd && idHd.has(hd));
    ok(`${k}: không <script> viết thẳng`, ![...s.matchAll(/<script\b[^>]*>/g)].some(m => !/src="\/kho\/js\/in-an\.js"/.test(m[0])));
  }
  ok('Có mục hướng dẫn dat-hang, danh-gia-ncc, nhan-theo-don', ['dat-hang', 'danh-gia-ncc', 'nhan-theo-don'].every(x => idHd.has(x)));

  // Tiền: form chỉ gửi giá khi xem giá; giá dự kiến chỉ đọc khi xem giá; in giá phải chọn.
  ok('Lập / sửa đơn: docFormDonDat với coGia = k.duoc(\'xem_gia\')',
    /const coGia = k\.duoc\('xem_gia'\)/.test(ma.moi) && /coGia, soDong/.test(ma.moi)
    && /const coGia = k\.duoc\('xem_gia'\)/.test(ma.xem) && /coGia, soDong/.test(ma.xem));
  ok('Ô giá chỉ hiện khi coGia', (ma.moi.match(/name=\{`gia_|name=\{`t\$\{i\}_gia`\}/g) ?? []).length === 2
    && [...ma.moi.matchAll(/\{coGia && \(/g)].length >= 2);
  ok('Trang đơn: đọc giá dự kiến chỉ khi xem giá', /coGia \? docGiaDonDat/.test(ma.xem));
  ok('Trang in: giá chỉ khi xem giá VÀ chọn "in kèm giá"', /const inGia = coGia && Astro\.url\.searchParams\.get\('gia'\) === '1'/.test(ma.in)
    && /inGia \? docGiaDonDat/.test(ma.in));
  ok('Trang in: logo, chữ ký, nút In / Lưu PDF, nút Chia sẻ (ẩn tới khi có JS)',
    /bieu-tuong\.svg/.test(ma.in) && /<KyTen\b/.test(ma.in) && /<NutIn\b/.test(ma.in) && /data-chia-se[^>]*hidden/.test(ma.in)
    && /Lưu PDF/.test(ma.in) && /Zalo/.test(ma.in));
  ok('Gửi đơn / Lưu và gửi chỉ khi nhap + duyet_nhap',
    /const guiDuoc = lapDuoc && k\.duoc\('duyet_nhap'\)/.test(ma.xem) && /const guiDuoc = k\.duoc\('duyet_nhap'\)/.test(ma.moi));
  ok('Nhận hàng theo đơn → mở màn nhận hàng', /taoPhieuTuDon/.test(ma.xem) && /\/noi-bo\/kho\/nhan-hang\/\$\{kq\.id\}/.test(ma.xem));
  ok('Danh sách: tìm / ngày / trang như GĐ4b', /<LocDanhSach\b/.test(ma.ds) && /<PhanTrang\b/.test(ma.ds) && /catTrang/.test(ma.ds));
  ok('Đánh giá NCC: cột tiền theo coGia, có nút CSV', /coGia && <th class="so">\{t\.giaTbKg\}/.test(ma.ncc)
    && /giaTbKg: \{ vi: 'Giá TB\/kg'/.test(ma.ncc) && /ncc\.csv/.test(ma.ncc));

  const js = doc(join(WEB, 'public/kho/js/in-an.js'));
  ok('in-an.js: Web Share khi có, không thì để ẩn', /navigator\.share/.test(js) && /\[data-chia-se\]/.test(js)
    && /typeof navigator\.share !== 'function'/.test(js));

  const csv = doc(join(TRANG, 'bao-cao/[ten].csv.ts'));
  ok('CSV ncc: mở cho nhap hoặc xem_gia, dùng dinhNghiaDanhGiaNcc', /ten === 'ncc'/.test(csv)
    && /duoc\(nhanSu\.vai_tro, 'nhap'\) \|\| duoc\(nhanSu\.vai_tro, 'xem_gia'\)/.test(csv) && /dinhNghiaDanhGiaNcc/.test(csv));

  const nhMoi = doc(join(TRANG, 'nhan-hang/moi.astro'));
  const nhId = doc(join(TRANG, 'nhan-hang/[id].astro'));
  ok('Nhận hàng mới: "Nhận hàng theo đơn này" liệt kê đơn chờ', /docDonChoNhan/.test(nhMoi) && /viec" value="theo_don"/.test(nhMoi));
  ok('Nhận hàng: cột "Đặt" khi phiếu theo đơn', /don_dat/.test(nhId) && /Đặt \$\{dinhDangKg/.test(nhId) && /Ngoài đơn/.test(nhId));
  const nccTrang = doc(join(TRANG, 'cai-dat/nha-cung-cap.astro'));
  ok('Cài đặt NCC: ô số ngày giao, thứ giao', /name="so_ngay_giao"/.test(nccTrang) && /name="thu_giao"/.test(nccTrang));
  const formMh = doc(join(WEB, 'src/components/kho/FormMatHang.astro'));
  const dm = doc(join(WEB, 'src/lib/kho/danh-muc.ts'));
  ok('Mặt hàng: ô tối thiểu / tối đa kho lạnh, ghi qua kho_luu_muc_dat_hang',
    /name="kho_toi_thieu_kg"/.test(formMh) && /name="kho_toi_da_kg"/.test(formMh) && /\.rpc\('kho_luu_muc_dat_hang'/.test(dm));
});

// ===========================================================================
await nhom('6 · MENU, QUY TRÌNH, THÔNG BÁO', async () => {
  const o = MUC_KHO.find(m => m.ma === 'dat_hang');
  ok('Ô "Đặt hàng": quyền nhap, số đỏ don_dat_tre', o?.link === '/noi-bo/kho/dat-hang' && o.quyen.join() === 'nhap'
    && (o.dem ?? []).includes('don_dat_tre'));
  ok('Quản lý, chủ, thủ kho thấy ô; NV quầy, kế toán không',
    ['quan_ly', 'chu_so_huu', 'thu_kho'].every(v => mucCuaVai(v).some(m => m.ma === 'dat_hang'))
    && !['nhan_vien_quay', 'ke_toan'].some(v => mucCuaVai(v).some(m => m.ma === 'dat_hang')));
  ok('Thao tác nhanh quản lý có "Đặt hàng"', THAO_TAC_NHANH.quan_ly.some(t => t.link === '/noi-bo/kho/dat-hang/moi'));
  const b = QUY_TRINH.find(q => q.ma === 'nhan-hang')?.buoc[0];
  ok('Quy trình Nhận hàng bắt đầu bằng bước đặt hàng', b?.link === '/noi-bo/kho/dat-hang/moi' && (b.dem ?? []).includes('don_dat_tre'));
  const c = cauSuKien({ khoa: 'don_dat_tre', nhom: 'nhac_nho', ref_id: id(5), ref2: id(6), ma: 'DH-2609-0001',
    ten: 'NCC Úc', phu: '2026-09-24', so: 2, luc: '' });
  ok('Thông báo don_dat_tre: mở đúng đơn, có ngày hẹn và số ngày trễ',
    c.link === `/noi-bo/kho/dat-hang/${id(5)}` && /24\/09\/2026/.test(c.chiTiet ?? '') && /trễ 2 ngày/.test(c.chiTiet ?? ''), JSON.stringify(c));
  ok('Thủ kho không có quyền xem giá (các màn đặt hàng chỉ kg)', !duoc('thu_kho', 'xem_gia'));
});

await db.close();
process.exit(ketThuc('WEB ĐẶT HÀNG'));
