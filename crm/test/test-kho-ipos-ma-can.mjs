/**
 * BEEFTOWN KHO — Kiểm thử kho TỰ NHẬN món cân theo mã món FABi = mã cân (0103)
 * ============================================================================
 *
 *     node test/test-kho-ipos-ma-can.mjs
 *
 * Chạy thử FABi thật 27/10/2026: món FABi đặt Mã món = Mã barcode = mã cân đệm đủ 5 số
 * ("01011"); quét tem cân → webhook iPOS DW gửi item_id "01011", quantity = số kg. Hóa đơn ở
 * đây dựng đúng dạng payload thật đó và đi qua chính bộ đọc của web (phanTichHoaDon) rồi
 * kho_ipos_nhan_callback. Phải đúng:
 *   · mã món chưa ghép, toàn số, bỏ số 0 đầu = mã cân của món đang dùng → trừ đúng món đó,
 *     quantity là kg (món đếm gói → gói gần số kg nhất, lệch ghi hao hụt; món cân kg → đúng kg);
 *   · có hay không số 0 đầu, có khoảng trắng đều nhận; mã cân của món ngừng dùng, mã chữ
 *     (ITEM-XXXX), mã số không trùng gì → vẫn "chưa khớp";
 *   · mã giảm giá vẫn nhận là mã giảm (thứ tự ô > mã giảm > mã cân không đổi);
 *   · ghép tay luôn thắng (Không phải hàng kho; món khác);
 *   · thiếu hàng → thử lại vẫn đọc quantity là kg; dòng không bị ghi mã cân;
 *   · kho_ipos_ma_da_ban: mã số đã bán (bỏ số 0 đầu), RLS xem_gia — vai khác / chi nhánh khác rỗng, anon không gọi;
 *   · web: laMaKhoTuNhan / kiemGhep / oThucDon / goiYMatHang / maCanTuNhan nhận mã cân như database;
 *   · "Món cần có trên FABi" có món cân; file nhập .xlsx đúng sheet "Menu" của mẫu FABi, chỉ món chưa thấy trên
 *     FABi; 403 / 500 / không món mới → câu, không file; tệp Excel tự viết đọc lại được (zip, CRC, XML);
 *   · kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui, UID_MAY_IPOS, themMayIpos, taoClientPg } from './kho-chung.mjs';
import { phanTichHoaDon } from '../../web/src/lib/kho/ipos.ts';
import {
  laMaKhoTuNhan, kiemGhep, oThucDon, goiYMatHang, maCanTuNhan, docFormGhep, ganMaIpos,
} from '../../web/src/lib/kho/ban-ipos.ts';
import { docMonFabi, taoTepNhapFabi, nhanTrenFabi } from '../../web/src/lib/kho/thu-ngan.ts';
import { COT_NHAP_FABI, dongNhapFabi } from '../../web/src/lib/kho/fabi-mau.ts';
import { taoTepExcel, crc32, tenCot, KIEU_XLSX } from '../../web/src/lib/kho/tep-excel.ts';
import { timChuoiCam } from '../../web/src/lib/chuoi-cam.js';
import { crc32 as crc32Node } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — iPOS: MÃ MÓN FABi = MÃ CÂN');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
await themMayIpos(db, cnA, cnB);
const MAY = UID_MAY_IPOS.mayIposA;
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');
// Hàm web đọc song song (Promise.all) — xếp hàng từng lời gọi trên MỘT database PGlite (xem test-kho-ipos-fabi.mjs).
let hangDoi = Promise.resolve();
const noiTiep = f => (...thamSo) => {
  const p = hangDoi.then(() => f(...thamSo));
  hangDoi = p.catch(() => {});
  return p;
};
const clientCua = await taoClientPg({ db, duoi: noiTiep(duoi), duoiAnon: noiTiep(duoiAnon) });

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngaySau = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
const TU_LUC = new Date(Date.now() - 3 * 86400000).toISOString();
const BRAND = 'BRAND-THU';
const STORE = 'STORE-THU';

const MH = {};
let vt = {}, ncc;

async function nhapHang(dong) {
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cnA.id, maGui(), ncc, vt.quay, homNay, JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  const gui = await duoi(UID.qlA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
  if (gui.loi) throw new Error(gui.loi);
  const duyet = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [p.phieu_id]);
  if (duyet.loi) throw new Error(duyet.loi);
}

const tonQuay = async ma => {
  const r = (await db.query(`select coalesce(sum(so_goi), 0)::int as goi, coalesce(sum(so_kg), 0) as kg
    from kho_ton where mat_hang_id = $1 and vi_tri_id = $2`, [MH[ma].id, vt.quay])).rows[0];
  return { goi: r.goi, kg: Number(r.kg) };
};

// ---- Hóa đơn iPOS DW đúng dạng FABi gửi thật (27/10/2026), qua bộ đọc của web --------------
let soHd = 0;
/** Giờ VN của "n phút trước" → (ngày 00:00 VN tính bằng giây epoch, giờ, phút) như FABi gửi. */
function gioFabi(phutTruoc) {
  const vn = new Date(Date.now() - phutTruoc * 60000 + 7 * 3600000);
  const ngay = Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()) / 1000 - 7 * 3600;
  return { ngay, gio: vn.getUTCHours(), phut: vn.getUTCMinutes() };
}
function hoaDonFabi(items, { saleId, datastate = 0, phutTruoc = 10 } = {}) {
  soHd += 1;
  const id = saleId ?? `SALE-MA-CAN-${soHd}`;
  const g = gioFabi(phutTruoc);
  return {
    sale_id: id, brand_id: BRAND, store_id: STORE, pos_type: 'POS_FABI', datastate, fb_store_id: 173181,
    tran_date: g.ngay, origin_sale_id: '',
    sale: { sale_id: id, store_id: STORE, tran_no: `SLK${soHd}`, tran_id: 'TA', date_last: g.ngay, tran_date: g.ngay,
            hour_last: g.gio, minute_last: g.phut, origin_sale_id: '' },
    sale_detail: items.map((it, i) => ({
      sale_detail_id: `SD_${id}_${i}`, item_id: it.ma, description: it.ten ?? 'Món thử', unit_id: it.donVi ?? 'KG',
      quantity: it.sl, price_org: 950000, price_sale: 950000, amount: Math.round(it.sl * 950000), discount: 0,
    })),
  };
}
async function ban(items, tuyChon) {
  const kq = phanTichHoaDon(hoaDonFabi(items, tuyChon));
  if (kq.loai !== 'hoa_don') throw new Error(kq.cau);
  const r = await duoi(MAY, `select kho_ipos_nhan_callback($1, $2::jsonb) as kq`, [cnA.id, JSON.stringify(kq.hoaDon)]);
  if (r.loi) throw new Error(r.loi);
  return (await db.query(`select d.* from kho_ipos_dong d join kho_ipos_hoa_don h on h.id = d.hoa_don_id
    where h.chi_nhanh_id = $1 and h.ma_hd = $2 order by d.khoa_dong`, [cnA.id, kq.hoaDon.ma_hd])).rows;
}
const thuLai = () => duoi(MAY, `select kho_ipos_nhan_callback($1, '[]'::jsonb)`, [cnA.id]);
const dongTheoId = async id => (await db.query(`select * from kho_ipos_dong where id = $1`, [id])).rows[0];
const soCai = async id => (await db.query(`select * from kho_so_cai where chung_tu_loai = 'ban_hang' and chung_tu_id = $1
  order by created_at`, [id])).rows;
async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

// ===========================================================================
await nhom('1 · CHUẨN BỊ: MÃ CÂN, MÃ GIẢM, HÀNG Ở QUẦY, CHUYỂN SANG TRỪ THEO iPOS', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  // Như kho thật: Steak đếm gói, mã cân 1011, 950.000 đ/kg; thịt vụn cân kg, mã 1013.
  await db.query(`update kho_mat_hang set ma_can = '1011', gia_ban_kg = 950000 where ma = 'C-THANNGOAI'`);
  await db.query(`update kho_mat_hang set ma_can = '1013', gia_ban_kg = 120000 where ma = 'P-VUN'`);
  await db.query(`update kho_mat_hang set ma_can = '1014', gia_ban_kg = 500000, dang_dung = false where ma = 'C-GAU'`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  await db.query(`insert into kho_ma_giam (mat_hang_id, phan_tram, ma_can) values ($1, 30, '90001')`, [MH['C-THANNGOAI'].id]);
  vt = Object.fromEntries((await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  ncc = (await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC thử') returning id`)).rows[0].id;

  await nhapHang([
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 4, so_kg: 2, don_gia_kg: 700000, han_dung: await ngaySau(3) },
    { mat_hang_id: MH['P-VUN'].id, so_kg: 1, don_gia_kg: 80000, han_dung: await ngaySau(2) },
  ]);
  ok('Quầy: Steak 4 gói × 0,5 kg; thịt vụn 1 kg', (await tonQuay('C-THANNGOAI')).goi === 4 && (await tonQuay('P-VUN')).kg === 1);

  const chu = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb) as v`, [cnA.id,
    JSON.stringify({ bat: true, pos_parent: BRAND, pos_id: STORE, vi_tri_ban_id: vt.quay })]);
  const cs = await duoi(UID.chu, `select kho_ipos_chuyen_sang($1, $2::timestamptz)`, [cnA.id, TU_LUC]);
  ok('Bật iPOS, chuyển sang trừ kho theo iPOS', chu.loi === null && cs.loi === null, chu.loi ?? cs.loi ?? '');
  ok('Chưa ghép mã nào', Number((await db.query(`select count(*) n from kho_ipos_ma_hang`)).rows[0].n) === 0);
});

// ===========================================================================
await nhom('2 · MÃ MÓN FABi = MÃ CÂN, CHƯA GHÉP → KHO TỰ NHẬN, BÁN THEO KG', async () => {
  const [d1] = await ban([{ ma: '01011', ten: 'Steak Ribeye Úc', sl: 0.23 }]);
  const s1 = await soCai(d1.id);
  ok('"01011" 0,23 kg (đúng payload FABi thật) → đã trừ kho Steak: 1 gói nguyên, bán 0,23 kg, lệch ghi hao hụt',
     d1.trang_thai === 'da_ghi' && d1.mat_hang_id === MH['C-THANNGOAI'].id && d1.so_goi === 1 && Number(d1.so_kg) === 0.23
     && Number(s1.find(s => s.loai === 'ban')?.so_kg) === -0.23 && s1.find(s => s.loai === 'ban')?.so_goi === -1
     && Number(s1.find(s => s.loai === 'hao_hut')?.so_kg) === -0.27, JSON.stringify({ d1, s1 }));
  ok('…không ghép tay nào được tạo; dòng không mang mã cân (thử lại đọc quantity như cũ)',
     Number((await db.query(`select count(*) n from kho_ipos_ma_hang`)).rows[0].n) === 0 && d1.ma_can === null
     && d1.o_ma_id === null && d1.ma_giam_id === null, JSON.stringify(d1));
  ok('…quầy Steak còn 3 gói', (await tonQuay('C-THANNGOAI')).goi === 3);

  const [d2] = await ban([{ ma: ' 1011 ', sl: 0.5 }]);
  ok('"1011" không số 0 đầu, có khoảng trắng → cũng nhận, 1 gói', d2.trang_thai === 'da_ghi'
     && d2.mat_hang_id === MH['C-THANNGOAI'].id && d2.so_goi === 1, JSON.stringify(d2));

  const [d3] = await ban([{ ma: '01013', ten: 'Thịt vụn', sl: 0.4 }]);
  ok('"01013" của món cân kg (thịt vụn) → trừ đúng 0,4 kg', d3.trang_thai === 'da_ghi'
     && d3.mat_hang_id === MH['P-VUN'].id && Number(d3.so_kg) === 0.4 && Math.abs((await tonQuay('P-VUN')).kg - 0.6) < 1e-9,
     JSON.stringify(d3));
  await doiSoat('Tự nhận mã cân');
});

// ===========================================================================
await nhom('3 · KHÔNG NHẬN BỪA: MÃ CHỮ, MÃ CỦA MÓN NGỪNG DÙNG, MÃ SỐ LẠ · MÃ GIẢM VẪN LÀ MÃ GIẢM', async () => {
  const [a, b, c] = await ban([{ ma: 'ITEM-HJAE', sl: 1, donVi: 'MON' }, { ma: '01014', sl: 0.3 }, { ma: '05555', sl: 0.3 }]);
  ok('Mã chữ "ITEM-HJAE" → chưa khớp', a.trang_thai === 'chua_khop' && a.mat_hang_id === null, JSON.stringify(a));
  ok('"01014" là mã cân của món NGỪNG dùng → chưa khớp', b.trang_thai === 'chua_khop' && b.mat_hang_id === null, JSON.stringify(b));
  ok('"05555" không trùng mã nào → chưa khớp, câu lý do cũ', c.trang_thai === 'chua_khop'
     && c.ly_do === 'Chưa ghép mã iPOS với món trong kho', JSON.stringify(c));

  const [g] = await ban([{ ma: '90001', sl: 0.5 }]);
  ok('"90001" là mã giảm 30% của Steak → vẫn nhận là mã giảm (ghi ma_giam_id)', g.trang_thai === 'da_ghi'
     && g.ma_giam_id !== null && g.mat_hang_id === MH['C-THANNGOAI'].id, JSON.stringify(g));
  await doiSoat('Không nhận bừa');
});

// ===========================================================================
await nhom('4 · GHÉP TAY LUÔN THẮNG', async () => {
  const bq = await duoi(UID.qlA, `select kho_ipos_gan_ma_v2($1, '001011', 'bo_qua', null, null, null)`, [cnA.id]);
  const [x] = await ban([{ ma: '001011', sl: 0.3 }]);
  ok('Mã "001011" ghép "Không phải hàng kho" (FABi có món KHÁC trùng số) → bỏ qua, không trừ Steak',
     bq.loi === null && x.trang_thai === 'bo_qua' && x.mat_hang_id === null, bq.loi ?? JSON.stringify(x));

  const mk = await duoi(UID.qlA, `select kho_ipos_gan_ma_v2($1, '0001011', 'mon', $2, 'goi', null)`, [cnA.id, MH['C-NACVAI'].id]);
  const [y] = await ban([{ ma: '0001011', sl: 1, donVi: 'GOI' }]);
  ok('Mã "0001011" ghép tay với Nạc vai → trừ Nạc vai (quầy không có → thiếu hàng), không đụng Steak',
     mk.loi === null && y.trang_thai === 'thieu_hang' && y.mat_hang_id === MH['C-NACVAI'].id, mk.loi ?? JSON.stringify(y));
  ok('Quầy Steak vẫn 1 gói (4 − 0,23 − 0,5 − mã giảm 0,5)', (await tonQuay('C-THANNGOAI')).goi === 1);
  await doiSoat('Ghép tay thắng');
});

// ===========================================================================
await nhom('5 · THIẾU HÀNG → THỬ LẠI VẪN ĐỌC QUANTITY LÀ KG', async () => {
  const [d] = await ban([{ ma: '01013', sl: 2 }]);
  ok('Bán 2 kg thịt vụn khi quầy còn 0,6 kg → thiếu hàng, câu ghi 2 kg', d.trang_thai === 'thieu_hang'
     && d.mat_hang_id === MH['P-VUN'].id && /cần 2 kg/.test(d.ly_do ?? ''), JSON.stringify(d));
  await nhapHang([{ mat_hang_id: MH['P-VUN'].id, so_kg: 3, don_gia_kg: 80000, han_dung: await ngaySau(2) }]);
  const r = await thuLai();
  const d2 = await dongTheoId(d.id);
  ok('Nhập thêm 3 kg → lượt thử lại ghi đúng 2 kg (không đổi thành 2 gói), dòng vẫn không mang mã cân',
     r.loi === null && d2.trang_thai === 'da_ghi' && Number(d2.so_kg) === 2 && d2.ma_can === null
     && Math.abs((await tonQuay('P-VUN')).kg - 1.6) < 1e-9, r.loi ?? JSON.stringify(d2));
  await doiSoat('Thử lại');
});

// ===========================================================================
await nhom('6 · kho_ipos_ma_da_ban: MÃ ĐÃ BÁN, RLS', async () => {
  const doc_ = async uid => {
    const r = await (uid === 'anon' ? duoiAnon(`select * from kho_ipos_ma_da_ban($1)`, [cnA.id])
                                    : duoi(uid, `select * from kho_ipos_ma_da_ban($1)`, [cnA.id]));
    return { loi: r.loi, ma: (r.rows ?? []).map(x => x.ma_so) };
  };
  const ql = await doc_(UID.qlA);
  ok('Quản lý: mã số đã bán, bỏ số 0 đầu, không trùng, có thứ tự — "01011", " 1011 ", "001011", "0001011" chỉ còn "1011"; không mã chữ',
     ql.loi === null && JSON.stringify(ql.ma) === JSON.stringify(['1011', '1013', '1014', '5555', '90001']), ql.loi ?? JSON.stringify(ql.ma));
  const tk = await doc_(UID.thuKhoA);
  ok('Thủ kho (không xem giá) → rỗng, không lỗi (RLS kho_ipos_dong)', tk.loi === null && tk.ma.length === 0, tk.loi ?? JSON.stringify(tk.ma));
  const qlB = await doc_(UID.qlB);
  ok('Quản lý chi nhánh B hỏi chi nhánh A → rỗng', qlB.loi === null && qlB.ma.length === 0, qlB.loi ?? JSON.stringify(qlB.ma));
  const an = await doc_('anon');
  ok('anon không gọi được', an.loi !== null && /permission denied/.test(an.loi), an.loi ?? '');
});

// ===========================================================================
const ngCan = () => ({
  oMa: [],
  maGiam: [{ ma_can: '90001', phan_tram: 30, mat_hang_id: MH['C-THANNGOAI'].id }],
  monDangDung: new Set(Object.values(MH).filter(m => m.dang_dung).map(m => m.id)),
  monMaCan: Object.values(MH).filter(m => m.ma_can).map(m => ({ id: m.id, ten: m.ten, ma_can: m.ma_can, dang_dung: m.dang_dung })),
});
const fd = o => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };

await nhom('7 · WEB THUẦN: NHẬN MÃ CÂN NHƯ DATABASE', async () => {
  const ng = ngCan();
  const steak = MH['C-THANNGOAI'].id;
  const a = laMaKhoTuNhan('01011', ng);
  ok('laMaKhoTuNhan: "01011", " 1011 " → mã cân của Steak (kho tự nhận)', a?.loai === 'can' && a.matHangId === steak && a.maCan === '1011'
     && laMaKhoTuNhan(' 1011 ', ng)?.loai === 'can', JSON.stringify(a));
  ok('laMaKhoTuNhan: mã của món ngừng dùng, mã chữ, mã số lạ, "0" → không; mã giảm vẫn là mã giảm',
     laMaKhoTuNhan('01014', ng) === null && laMaKhoTuNhan('A1011', ng) === null && laMaKhoTuNhan('05555', ng) === null
     && laMaKhoTuNhan('0', ng) === null && laMaKhoTuNhan('90001', ng)?.loai === 'giam');
  ok('Không truyền monMaCan (người gọi cũ) → như trước, không nhận mã cân', laMaKhoTuNhan('01011', { ...ng, monMaCan: undefined }) === null);
  ok('maCanTuNhan: "01011" → Steak; mã giảm → null', maCanTuNhan('01011', ng)?.tenMon === MH['C-THANNGOAI'].ten
     && maCanTuNhan('90001', ng) === null);

  const ghep = o => docFormGhep(fd(o)).ghep;
  ok('kiemGhep: mã cân ghép đúng món đó như món kho → được (thừa, không sai)',
     kiemGhep(ghep({ ma_ipos: '01011', mat_hang_id: steak, don_vi_ban: 'kg' }), ng, false) === null);
  const khac = kiemGhep(ghep({ ma_ipos: '01011', mat_hang_id: MH['C-NACVAI'].id, don_vi_ban: 'goi' }), ng, false);
  ok('kiemGhep: mã cân ghép món KHÁC → cần xác nhận "trùng mã", câu nói mã cân của món nào (vi / en)',
     khac?.canXacNhan === 'trung_ma' && /mã cân 1011/.test(khac.cau.vi) && /scale code 1011/.test(khac.cau.en)
     && /đổi mã món đó trên FABi/.test(khac.cau.vi), JSON.stringify(khac));
  ok('kiemGhep: mã cân ghép "Không phải hàng kho", hàng cân nhãn → cần xác nhận; đã xác nhận → được; bỏ ghép → được',
     kiemGhep(ghep({ ma_ipos: '01011', mat_hang_id: 'bo_qua' }), ng, false)?.canXacNhan === 'trung_ma'
     && kiemGhep(ghep({ ma_ipos: '01011', mat_hang_id: 'goi_can' }), ng, false)?.canXacNhan === 'trung_ma'
     && kiemGhep(ghep({ ma_ipos: '01011', mat_hang_id: 'bo_qua' }), ng, false, true) === null
     && kiemGhep(ghep({ ma_ipos: '01011', mat_hang_id: MH['C-NACVAI'].id }), ng, false, true) === null
     && kiemGhep(ghep({ ma_ipos: '01011', mat_hang_id: 'bo_ghep' }), ng, false) === null);
  const td = oThucDon('01011', undefined, ng);
  ok('oThucDon: mã cân chưa ghép → "kho tự nhận (mã cân)"; đã ghép như món kho → không nhắc Bỏ ghép',
     td.kieu === 'tu_nhan_can' && td.tenMon === MH['C-THANNGOAI'].ten && td.maCan === '1011'
     && oThucDon('01011', { kieu: 'mon', o_ma_id: null }, ng).ghepSai === false, JSON.stringify(td));
  const goiY = goiYMatHang({ ma_ipos: '01011', ten_ipos: null, ma_can: null }, Object.values(MH));
  ok('goiYMatHang: "01011" (iPOS không gửi tên) → gợi ý đầu là Steak (mã cân 1011)', goiY[0]?.id === steak, JSON.stringify(goiY.map(m => m.ma)));

  // Qua ganMaIpos thật (đọc ô, mã giảm, món, mã cân ngay trước khi ghép).
  const ql = clientCua(UID.qlA);
  const k1 = await ganMaIpos(ql, cnA.id, fd({ ma_ipos: '00001011', mat_hang_id: 'bo_qua' }));
  ok('ganMaIpos: mã cân "00001011" ghép "Không phải hàng kho" chưa xác nhận → dừng, đòi ô "trùng mã", không ghi',
     !k1.ok && k1.canXacNhanTrungMa === true
     && (await db.query(`select count(*)::int n from kho_ipos_ma_hang where ma_ipos = '00001011'`)).rows[0].n === 0, JSON.stringify(k1));
  const k2 = await ganMaIpos(ql, cnA.id, fd({ ma_ipos: '00001011', mat_hang_id: 'bo_qua', trung_ma: 'co' }));
  const k3 = await ganMaIpos(ql, cnA.id, fd({ ma_ipos: '00001011', mat_hang_id: 'bo_ghep' }));
  ok('…tích "Mã này là món khác trên FABi" → ghép được; bỏ ghép → được', k2.ok && k3.ok
     && (await db.query(`select count(*)::int n from kho_ipos_ma_hang where ma_ipos = '00001011'`)).rows[0].n === 0, JSON.stringify([k2, k3]));
});

// ===========================================================================
/** Đọc lại file .xlsx tự viết: zip STORE → các phần XML; sheet → mảng hàng (chữ / số). */
function docXlsx(b) {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const e = b.length - 22;
  if (v.getUint32(e, true) !== 0x06054b50) throw new Error('thiếu EOCD');
  const n = v.getUint16(e + 10, true);
  let p = v.getUint32(e + 16, true);
  const tep = {};
  const giai = new TextDecoder();
  for (let i = 0; i < n; i++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error('thư mục zip hỏng');
    const phuongPhap = v.getUint16(p + 10, true), crc = v.getUint32(p + 16, true), co = v.getUint32(p + 20, true);
    const dai = v.getUint16(p + 28, true), viTri = v.getUint32(p + 42, true);
    const ten = giai.decode(b.subarray(p + 46, p + 46 + dai));
    const dauDai = v.getUint16(viTri + 26, true) + v.getUint16(viTri + 28, true);
    const noiDung = b.subarray(viTri + 30 + dauDai, viTri + 30 + dauDai + co);
    if (phuongPhap !== 0 || crc32Node(noiDung) !== crc) throw new Error(`phần ${ten}: nén hay CRC sai`);
    tep[ten] = giai.decode(noiDung);
    p += 46 + dai;
  }
  const boThoat = x => x.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  const chu = [...(tep['xl/sharedStrings.xml'] ?? '').matchAll(/<si><t[^>]*>([\s\S]*?)<\/t><\/si>/g)].map(m => boThoat(m[1]));
  const ten = [...tep['xl/workbook.xml'].matchAll(/<sheet name="([^"]*)"/g)].map(m => boThoat(m[1]));
  const trang = ten.map((_, i) => [...tep[`xl/worksheets/sheet${i + 1}.xml`].matchAll(/<row r="\d+">([\s\S]*?)<\/row>/g)].map(r => {
    const hang = [];
    for (const c of r[1].matchAll(/<c r="([A-Z]+)\d+"( t="s")?><v>([^<]*)<\/v><\/c>/g)) {
      const cot = [...c[1]].reduce((s, ch) => s * 26 + ch.charCodeAt(0) - 64, 0) - 1;
      hang[cot] = c[2] ? chu[Number(c[3])] : Number(c[3]);
    }
    return hang;
  }));
  return { tep, ten, trang };
}

await nhom('8 · MÓN CẦN CÓ TRÊN FABi CÓ MÓN CÂN · FILE NHẬP .xlsx', async () => {
  await db.query(`update kho_mat_hang set ma_can = '1015', gia_ban_kg = 650000 where ma = 'C-LOIVAI'`);
  await db.query(`update kho_mat_hang set ma_can = '1016', gia_ban_kg = null where ma = 'C-SUON'`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  const ql = clientCua(UID.qlA);
  const { dong } = await docMonFabi(ql, cnA.id);
  const theo = Object.fromEntries(dong.map(d => [`${d.loai}:${d.maMon}`, d]));
  ok('Món cân đã bán (1011, 1013) → "Đã bán qua FABi", không vào file; mã giảm đã bán cũng vậy',
     theo['can:1011']?.trenFabi === 'da_ban' && !theo['can:1011'].vaoFile && theo['can:1013']?.trenFabi === 'da_ban'
     && theo['giam:90001']?.trenFabi === 'da_ban' && !theo['giam:90001'].vaoFile, JSON.stringify(dong.map(d => [d.loai, d.maMon, d.trenFabi, d.vaoFile])));
  ok('Món cân chưa bán, có giá (1015) → vào file: tên món kho, mã vạch 01015, giá/kg kho',
     theo['can:1015']?.vaoFile === true && theo['can:1015'].maVach === '01015' && theo['can:1015'].giaKg === 650000
     && theo['can:1015'].tenGoiY === MH['C-LOIVAI'].ten && theo['can:1015'].trenFabi === 'chua_doc', JSON.stringify(theo['can:1015']));
  ok('Món cân chưa có giá (1016) → không vào file, cảnh báo điền giá (vi / en); món ngừng dùng (1014) không có dòng',
     theo['can:1016']?.vaoFile === false && /chưa có giá/.test(theo['can:1016'].canhBao[0]?.vi ?? '')
     && /no price/.test(theo['can:1016'].canhBao[0]?.en ?? '') && !theo['can:1014'], JSON.stringify(theo['can:1016']));
  ok('Nhãn "Đã bán qua FABi" có vi / en, kiểu đã xong', nhanTrenFabi('da_ban')[0].vi && nhanTrenFabi('da_ban')[0].en && nhanTrenFabi('da_ban')[1] === 'song');

  const tep = await taoTepNhapFabi(ql, { vai: 'quan_ly', chiNhanh: cnA, nn: 'vi' });
  ok('File nhập: 200, tên ASCII them-mon-fabi-<chi nhánh>-YYYYMMDD-HHMM.xlsx, 1 món', tep.status === 200
     && /^them-mon-fabi-[a-z0-9_-]+-\d{8}-\d{4}\.xlsx$/.test(tep.tenTep ?? '') && tep.soMon === 1 && tep.noiDung instanceof Uint8Array,
     JSON.stringify({ status: tep.status, tenTep: tep.tenTep, soMon: tep.soMon }));
  const x = docXlsx(tep.noiDung);
  ok('File nhập: một trang "Menu"; dòng đầu đúng 23 cột của mẫu create-item.xlsx', JSON.stringify(x.ten) === '["Menu"]'
     && JSON.stringify(x.trang[0][0]) === JSON.stringify([...COT_NHAP_FABI]) && COT_NHAP_FABI.length === 23
     && COT_NHAP_FABI[0] === 'Thành phố' && COT_NHAP_FABI[4] === 'Mã barcode' && COT_NHAP_FABI[11] === 'Đơn vị', JSON.stringify(x.trang[0][0]));
  const h = x.trang[0][1] ?? [];
  const o = ten => h[COT_NHAP_FABI.indexOf(ten)];
  ok('File nhập: Hồ Chí Minh · tên món · giá là SỐ 650000 · Mã món = Mã barcode = CHỮ "01015" · nhóm ITEM_TYPE_OTHER · loại DA · đơn vị KG; cột khác trống',
     x.trang[0].length === 2 && o('Thành phố') === 'Hồ Chí Minh' && o('Tên') === MH['C-LOIVAI'].ten && o('Giá') === 650000
     && o('Mã món') === '01015' && o('Mã barcode') === '01015' && o('Nhóm') === 'ITEM_TYPE_OTHER' && o('Loại món') === 'DA'
     && o('Đơn vị') === 'KG' && h.filter(v => v !== undefined).length === 8, JSON.stringify(h));

  for (const [uid, vai] of [[UID.thuKhoA, 'thu_kho'], [UID.nvQuayA, 'nhan_vien_quay'], [UID.keToanA, 'ke_toan']]) {
    const t = await taoTepNhapFabi(clientCua(uid), { vai, chiNhanh: cnA, nn: 'vi' });
    ok(`${vai} tải mon-fabi.xlsx → 403, câu chữ, không file`, t.status === 403 && typeof t.noiDung === 'string' && t.tenTep === null);
  }
  const loiMang = { data: null, error: { message: 'TypeError: fetch failed' } };
  const hong = { rpc: (ten, ...a) => (ten === 'kho_ipos_ma_da_ban' ? Promise.resolve(loiMang) : ql.rpc(ten, ...a)), from: b => ql.from(b) };
  const t500 = await taoTepNhapFabi(hong, { vai: 'quan_ly', chiNhanh: cnA, nn: 'vi' });
  const t500en = await taoTepNhapFabi(hong, { vai: 'quan_ly', chiNhanh: cnA, nn: 'en' });
  ok('Mất mạng khi đọc mã đã bán → 500 có câu (vi / en), KHÔNG file — không bao giờ đưa món đã có vào file',
     t500.status === 500 && t500.tenTep === null && /Không đọc được/.test(t500.noiDung) && /Could not/.test(t500en.noiDung),
     JSON.stringify([t500, t500en]));

  // PostgREST thật có thể trả hàm bảng một cột dưới dạng dòng {ma_so} thay vì giá trị — web nhận cả hai.
  const dangDong = { rpc: (ten, ...a) => (ten === 'kho_ipos_ma_da_ban' ? Promise.resolve({ data: [{ ma_so: '1015' }], error: null })
                                                                       : ql.rpc(ten, ...a)), from: b => ql.from(b) };
  const dd = (await docMonFabi(dangDong, cnA.id)).dong.find(d => d.loai === 'can' && d.maMon === '1015');
  ok('Mã đã bán trả dạng dòng {ma_so} cũng đọc đúng', dd?.trenFabi === 'da_ban' && dd.vaoFile === false, JSON.stringify(dd));

  await ban([{ ma: '01015', sl: 0.3 }]);
  const het = await taoTepNhapFabi(ql, { vai: 'quan_ly', chiNhanh: cnA, nn: 'vi' });
  ok('Bán 1015 qua FABi → không còn món mới: 200, câu "Không có món mới", không file', het.status === 200 && het.tenTep === null
     && het.soMon === 0 && /Không có món mới/.test(het.noiDung), JSON.stringify(het));
  ok('dongNhapFabi chỉ lấy dòng vaoFile', dongNhapFabi(dong).length === 1);
  await doiSoat('File FABi');
});

// ===========================================================================
await nhom('9 · TỆP EXCEL TỰ VIẾT (KHÔNG THƯ VIỆN)', async () => {
  ok('CRC-32 chuẩn: "123456789" → CBF43926, khớp zlib của Node',
     crc32(new TextEncoder().encode('123456789')) === 0xcbf43926 && crc32(new Uint8Array([1, 2, 3])) === crc32Node(new Uint8Array([1, 2, 3])));
  ok('Tên cột: A, Z, AA, ZZ, AAA', [0, 25, 26, 701, 702].map(tenCot).join() === 'A,Z,AA,ZZ,AAA');
  const mau = [{ ten: 'Menu', hang: [['Tên', 'Giá'], ['Ba chỉ & "gân" <đặc biệt>', 1.5], ['Món', null], ['01011', 0]] }];
  const a = taoTepExcel(mau), b = taoTepExcel(mau);
  ok('Cùng nội dung → cùng byte (ngày giờ zip cố định)', a.length === b.length && a.every((x, i) => x === b[i]));
  const x = docXlsx(a);
  ok('Đọc lại: thoát & < > " đúng, chữ tổ hợp thành NFC, ô trống bỏ qua, số 0 là số, "01011" là chữ',
     x.trang[0][1][0] === 'Ba chỉ & "gân" <đặc biệt>' && x.trang[0][1][1] === 1.5 && x.trang[0][2][0] === 'Món'.normalize('NFC')
     && x.trang[0][2].length === 1 && x.trang[0][3][0] === '01011' && x.trang[0][3][1] === 0, JSON.stringify(x.trang));
  ok('Đủ phần tối thiểu của .xlsx', ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels',
     'xl/styles.xml', 'xl/sharedStrings.xml', 'xl/worksheets/sheet1.xml'].every(t => t in x.tep));
  const nem = f => { try { f(); return false; } catch { return true; } };
  ok('Tên trang sai / trùng / quá 31 ký tự, số không hữu hạn, sổ không trang → ném lỗi',
     nem(() => taoTepExcel([{ ten: 'a/b', hang: [] }])) && nem(() => taoTepExcel([{ ten: 'A', hang: [] }, { ten: 'a', hang: [] }]))
     && nem(() => taoTepExcel([{ ten: 'x'.repeat(32), hang: [] }])) && nem(() => taoTepExcel([{ ten: 'A', hang: [[NaN]] }]))
     && nem(() => taoTepExcel([])));
  ok('Kiểu nội dung .xlsx', KIEU_XLSX === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
});

// ===========================================================================
await nhom('10 · TRANG, ROUTE, CÂU CHỮ', async () => {
  const ghep = doc('web/src/pages/noi-bo/kho/ban-ipos/ghep.astro');
  const route = doc('web/src/pages/noi-bo/kho/ban-ipos/mon-fabi.xlsx.ts');
  ok('Ghép món: form dùng maCanTuNhan (ghi "kho tự nhận", chọn sẵn Theo kg); thực đơn vẽ tu_nhan_can; ngữ cảnh có monMaCan',
     /maCanTuNhan\(m\.ma_ipos, ngGhep\)/.test(ghep) && /khoTuNhanCanForm/.test(ghep) && /tuCan \? 'kg'/.test(ghep)
     && /o\.kieu === 'tu_nhan_can'/.test(ghep) && /monMaCan: matHang/.test(ghep) && /docTenMaIpos\(/.test(ghep));
  ok('Ghép món: nút tải file nhập .xlsx kèm số món, không thuộc tính download (403 / 500 mở trang có câu lỗi)',
     /href="\/noi-bo\/kho\/ban-ipos\/mon-fabi\.xlsx"/.test(ghep) && !/mon-fabi\.xlsx"[^>]*\bdownload\b/.test(ghep) && /taiNhapFabi\(soVaoFile\)/.test(ghep));
  ok('mon-fabi.xlsx.ts: mở bằng moKhoTai, gọi taoTepNhapFabi, kiểu .xlsx, tên file ASCII, no-store',
     /await moKhoTai\(/.test(route) && /taoTepNhapFabi\(/.test(route) && /KIEU_XLSX/.test(route) && /no-store/.test(route)
     && /\[\^a-zA-Z0-9\._-\]/.test(route));
  const thuNgan = doc('web/src/lib/kho/thu-ngan.ts');
  const banIpos = doc('web/src/lib/kho/ban-ipos.ts');
  const cam = timChuoiCam([ghep, route, thuNgan, banIpos, doc('web/src/lib/kho/tep-excel.ts'), doc('web/src/lib/kho/fabi-mau.ts')].join('\n'));
  ok('Câu mới không chứa chữ cấm (chuoi-cam.js)', cam.length === 0, JSON.stringify(cam));
});

process.exit(ketThuc('iPOS: MÃ MÓN FABi = MÃ CÂN'));
