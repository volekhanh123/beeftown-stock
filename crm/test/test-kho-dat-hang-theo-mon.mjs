/**
 * BEEFTOWN KHO — Đặt hàng theo danh mục nhà cung cấp – món, đặt theo món (0111, đợt 2)
 * ===================================================================================
 *
 *     node test/test-kho-dat-hang-theo-mon.mjs
 *
 * Khánh chốt 29/10/2026: chọn nhà cung cấp rồi chọn món, hoặc chọn món rồi chọn nhà cung cấp, ở cả Đặt hàng. Đợt 1
 * (0110, test-kho-ncc-mat-hang.mjs) làm danh mục và Nhận hàng; đợt này:
 *
 *   1. gợi ý theo NCC dùng danh mục: món hai NCC cùng giao hiện ở CẢ HAI (trước 0111 chỉ ở NCC giao gần nhất); cặp đã
 *      bỏ không hiện; cặp thêm tay (chưa giao) có gợi ý;
 *   2. gợi ý không chọn NCC: mỗi món đúng một dòng, NCC đề xuất = NCC chính → giao gần nhất ở chi nhánh này → tên;
 *   3. kho_cap_ncc_mon (nội bộ) cho đúng tập cặp của kho_ds_ncc_mat_hang; authenticated không gọi được; quyền gợi ý
 *      không đổi;
 *   4. web: docFormTheoMon gom theo NCC (ô chọn, trống = đề xuất), lỗi thiếu / NCC ngừng giao dịch, số kiểu Việt;
 *      maGuiCon cố định theo (form, NCC);
 *   5. lapDonTheoNcc chạy thật trên PGlite qua client giả: mỗi NCC một đơn nháp không giá; bấm lại không lập đôi;
 *      mất mạng / lỗi 500 giữa chừng: câu "Đã lập" chỉ kể đơn đã nhận, bấm lại lập nốt phần thiếu;
 *   6. mã nguồn trang; kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, taoClientPg, UID, maGui } from './kho-chung.mjs';
import {
  docFormTheoMon, chuFormTheoMon, maGuiCon, lapDonTheoNcc, docGoiYDatHang,
} from '../../web/src/lib/kho/dat-hang.ts';
import { laUuid } from '../../web/src/lib/kho/chung.ts';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — ĐẶT HÀNG THEO DANH MỤC NCC – MÓN, ĐẶT THEO MÓN');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
const clientCua = await taoClientPg({ db, duoi, duoiAnon });

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
const MH = {};
const NCC = {};
let viTri;

const taoMon = async (ma, ten) => {
  const r = await duoi(UID.qlA, `
    insert into kho_mat_hang (ma, ten, loai, dem_goi, don_vi_goi, han_dung_ngay)
    values ($1, $2, 'phan_cat', true, 'gói', 5) returning *`, [ma, ten]);
  if (r.loi) throw new Error(r.loi);
  MH[ma] = r.rows[0];
};
const taoNcc = async ten => {
  const r = await duoi(UID.keToanA, `insert into kho_nha_cung_cap (ten) values ($1) returning id`, [ten]);
  if (r.loi) throw new Error(r.loi);
  NCC[ten] = r.rows[0].id;
};
/** Thủ kho nhận rồi gửi một phiếu (đủ để danh mục học cặp NCC – món). */
async function nhanGui(ncc, dong, ngayNhap = homNay) {
  const r = await duoi(UID.thuKhoA, `
    select * from kho_luu_phieu_nhap_kg(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_ghi_chu => null,
      p_anh_them => $6::text[], p_truong_them => '{}'::jsonb, p_dong => $7::jsonb)`,
    [cnA.id, maGui(), NCC[ncc], viTri, ngayNhap, [`${cnA.id}/nhap/${maGui()}/1.jpg`],
     JSON.stringify(dong.map(([ma, kg]) => ({ mat_hang_id: MH[ma].id, so_kg: kg, so_goi: 1, han_dung: homNay })))]);
  if (r.loi) throw new Error(r.loi);
  const id = r.rows[0].phieu_id;
  const pb = (await db.query(`select phien_ban from kho_phieu_nhap where id = $1`, [id])).rows[0].phien_ban;
  const g = await duoi(UID.thuKhoA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [id, pb]);
  if (g.loi) throw new Error(g.loi);
}
const goiY = (uid, ncc, cn = cnA) => duoi(uid, `select * from kho_goi_y_dat_hang($1, $2)`, [cn.id, ncc ? NCC[ncc] : null]);
const maCua = rows => rows.map(r => r.ma).sort().join();
const luu = (ncc, ma, viec) => duoi(UID.qlA, `select kho_luu_ncc_mat_hang($1, $2, $3)`, [NCC[ncc], MH[ma].id, viec]);
const donNhap = async () => (await db.query(`
  select d.id, d.nha_cung_cap_id, d.trang_thai, d.ma_gui,
         (select string_agg(m.ma || '=' || dd.so_kg_dat::float8, ',' order by m.ma)
          from kho_don_dat_dong dd join kho_mat_hang m on m.id = dd.mat_hang_id where dd.don_dat_id = d.id) as dong
  from kho_don_dat d where d.chi_nhanh_id = $1 order by d.created_at`, [cnA.id])).rows;

// ===========================================================================
await nhom('0 · DỰNG DỮ LIỆU', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  viTri = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'kho' limit 1`, [cnA.id])).rows[0].id;
  for (const [ma, ten] of [['C-RIBEYE', 'Ribeye Úc'], ['C-BACHI', 'Ba chỉ bò Mỹ'], ['C-LUOI', 'Lưỡi bò']]) await taoMon(ma, ten);
  for (const ten of ['NCC Bò Úc', 'NCC Bò Mỹ', 'NCC Chợ', 'NCC Mới']) await taoNcc(ten);
  // NCC Bò Úc giao Ribeye 5 ngày trước; NCC Bò Mỹ giao Ribeye + Ba chỉ 2 ngày trước; NCC Chợ giao Lưỡi hôm nay.
  await nhanGui('NCC Bò Úc', [['C-RIBEYE', 4]], await ngay(-5));
  await nhanGui('NCC Bò Mỹ', [['C-RIBEYE', 6], ['C-BACHI', 3]], await ngay(-2));
  await nhanGui('NCC Chợ', [['C-LUOI', 2]]);
  ok('Ba phiếu nhận hàng đã gửi', (await db.query(`select count(*)::int as n from kho_phieu_nhap where trang_thai = 'cho_duyet'`)).rows[0].n === 3);
});

// ===========================================================================
await nhom('1 · GỢI Ý THEO NCC DÙNG DANH MỤC', async () => {
  let r = await goiY(UID.thuKhoA, 'NCC Bò Úc');
  ok('NCC Bò Úc: có Ribeye dù NCC Bò Mỹ giao Ribeye gần hơn (trước 0111: rỗng)', r.loi === null && maCua(r.rows) === 'C-RIBEYE',
    r.loi ?? maCua(r.rows));
  r = await goiY(UID.thuKhoA, 'NCC Bò Mỹ');
  ok('NCC Bò Mỹ: Ribeye và Ba chỉ', maCua(r.rows) === 'C-BACHI,C-RIBEYE', maCua(r.rows));
  ok('Gợi ý theo NCC: cột nha_cung_cap_id là đúng NCC đang chọn', r.rows.every(x => x.nha_cung_cap_id === NCC['NCC Bò Mỹ']));

  await luu('NCC Bò Úc', 'C-RIBEYE', 'bo');
  r = await goiY(UID.thuKhoA, 'NCC Bò Úc');
  ok('Bỏ "NCC Bò Úc bán Ribeye" → gợi ý của NCC Bò Úc không còn Ribeye', r.rows.length === 0, maCua(r.rows));
  await luu('NCC Bò Úc', 'C-RIBEYE', 'them');

  r = await goiY(UID.thuKhoA, 'NCC Mới');
  ok('NCC Mới chưa giao, chưa thêm món → không gợi ý', r.loi === null && r.rows.length === 0, maCua(r.rows));
  await luu('NCC Mới', 'C-LUOI', 'them');
  r = await goiY(UID.thuKhoA, 'NCC Mới');
  ok('Thêm tay "NCC Mới bán Lưỡi" → có gợi ý Lưỡi (chưa từng giao)', maCua(r.rows) === 'C-LUOI', maCua(r.rows));
  ok('Số kg gợi ý của Lưỡi giống nhau dù chọn NCC nào (công thức không đổi)',
    Number(r.rows[0]?.ton_kg) === Number((await goiY(UID.thuKhoA, 'NCC Chợ')).rows[0]?.ton_kg));
});

// ===========================================================================
await nhom('2 · GỢI Ý KHÔNG CHỌN NCC: MỖI MÓN MỘT NCC ĐỀ XUẤT', async () => {
  let r = await goiY(UID.qlA, null);
  const theo = () => Object.fromEntries(r.rows.map(x => [x.ma, x.nha_cung_cap_id]));
  ok('Mỗi món đúng một dòng', r.loi === null && r.rows.length === 3 && new Set(r.rows.map(x => x.ma)).size === 3,
    r.loi ?? maCua(r.rows));
  ok('Ribeye: chưa có NCC chính → NCC giao gần nhất ở chi nhánh (NCC Bò Mỹ)', theo()['C-RIBEYE'] === NCC['NCC Bò Mỹ']);
  ok('Lưỡi: NCC Chợ (đã giao) trước NCC Mới (thêm tay, chưa giao)', theo()['C-LUOI'] === NCC['NCC Chợ']);
  await luu('NCC Bò Úc', 'C-RIBEYE', 'chinh');
  await luu('NCC Mới', 'C-LUOI', 'chinh');
  r = await goiY(UID.qlA, null);
  ok('Đặt NCC Bò Úc là chính của Ribeye → đề xuất NCC Bò Úc (dù giao cũ hơn)', theo()['C-RIBEYE'] === NCC['NCC Bò Úc']);
  ok('NCC chính thêm tay (chưa giao) vẫn thắng NCC đã giao', theo()['C-LUOI'] === NCC['NCC Mới']);
  // Q7 chưa nhận gì: không có "giao gần nhất ở chi nhánh này" — Ba chỉ chỉ một NCC nên vẫn có đề xuất.
  const r7 = await goiY(UID.qlB, null, cnB);
  ok('Chi nhánh Q7 (chưa nhận lần nào): vẫn đủ món của danh mục, NCC chính giữ nguyên',
    r7.loi === null && r7.rows.length === 3
      && r7.rows.find(x => x.ma === 'C-RIBEYE')?.nha_cung_cap_id === NCC['NCC Bò Úc'], r7.loi ?? maCua(r7.rows));
  // Không có NCC chính, không giao ở chi nhánh này: theo tên NCC (Bò Mỹ < Bò Úc theo thứ tự chữ).
  await luu('NCC Bò Úc', 'C-RIBEYE', 'bo_chinh');
  const r7b = await goiY(UID.qlB, null, cnB);
  const tenDau = (await db.query(`select id from kho_nha_cung_cap where id = any($1::uuid[]) order by ten limit 1`,
    [[NCC['NCC Bò Úc'], NCC['NCC Bò Mỹ']]])).rows[0].id;
  ok('Q7, Ribeye không NCC chính, chưa giao ở Q7 → NCC theo thứ tự tên', r7b.rows.find(x => x.ma === 'C-RIBEYE')?.nha_cung_cap_id === tenDau);
  await luu('NCC Bò Úc', 'C-RIBEYE', 'chinh');
});

// ===========================================================================
await nhom('3 · HÀM NỘI BỘ kho_cap_ncc_mon, QUYỀN', async () => {
  const cap = (await db.query(`select nha_cung_cap_id || ':' || mat_hang_id || ':' || la_chinh as k from kho_cap_ncc_mon(null)`))
    .rows.map(r => r.k).sort();
  const ds = (await duoi(UID.qlA, `select nha_cung_cap_id || ':' || mat_hang_id || ':' || la_chinh as k
                                   from kho_ds_ncc_mat_hang($1) where not da_bo`, [cnA.id])).rows.map(r => r.k).sort();
  ok('kho_cap_ncc_mon cho đúng tập cặp (và NCC chính) của kho_ds_ncc_mat_hang — một luật, hai hàm',
    cap.length > 0 && cap.join() === ds.join(), JSON.stringify({ cap, ds }));
  await luu('NCC Chợ', 'C-LUOI', 'bo');
  const cap2 = (await db.query(`select count(*)::int as n from kho_cap_ncc_mon(null) where mat_hang_id = $1 and nha_cung_cap_id = $2`,
    [MH['C-LUOI'].id, NCC['NCC Chợ']])).rows[0].n;
  ok('Cặp đã bỏ không có trong kho_cap_ncc_mon', cap2 === 0);
  await luu('NCC Chợ', 'C-LUOI', 'them');
  const loc = (await db.query(`select count(*)::int as n, bool_and(nha_cung_cap_id = $1) as dung from kho_cap_ncc_mon($1)`,
    [NCC['NCC Bò Mỹ']])).rows[0];
  ok('kho_cap_ncc_mon(NCC): chỉ cặp của NCC đó', loc.n === 2 && loc.dung === true, JSON.stringify(loc));

  for (const [ten, uid] of [['Quản lý Q1', UID.qlA], ['Thủ kho Q1', UID.thuKhoA]]) {
    const r = await duoi(uid, `select * from kho_cap_ncc_mon(null)`);
    ok(`${ten} KHÔNG gọi thẳng được kho_cap_ncc_mon (nội bộ)`, r.loi !== null, 'gọi được');
  }
  const an = await duoiAnon(`select * from kho_cap_ncc_mon(null)`);
  ok('anon không gọi được kho_cap_ncc_mon', an.loi !== null);
  const nv = await goiY(UID.nvQuayA, null);
  ok('NV quầy vẫn KHÔNG xem được gợi ý (quyền không đổi)', nv.loi !== null);
  const b = await goiY(UID.thuKhoB, null);
  ok('Thủ kho Q7 vẫn KHÔNG xem gợi ý Q1', b.loi !== null);
  const g = await goiY(UID.thuKhoA, null);
  ok('Gợi ý không chọn NCC: không cột tiền', g.loi === null && !Object.keys(g.rows[0] ?? {}).some(k => /(^|_)(gia|tien)(_|$)/.test(k)),
    Object.keys(g.rows[0] ?? {}).join());
});

// ===========================================================================
const mon = new Map(Object.values(MH).map(m => [m.id, { ten: m.ten, dem_goi: true, don_vi_goi: 'gói' }]));
const formTu = o => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) for (const x of [].concat(v)) f.append(k, x);
  return f;
};
await nhom('4 · WEB: ĐỌC FORM ĐẶT THEO MÓN, MÃ GỬI TỪNG NCC', async () => {
  const nccDung = new Set(Object.values(NCC));
  const macDinh = new Map([[MH['C-RIBEYE'].id, NCC['NCC Bò Úc']], [MH['C-BACHI'].id, NCC['NCC Bò Mỹ']], [MH['C-LUOI'].id, NCC['NCC Chợ']]]);
  const R = MH['C-RIBEYE'].id; const B = MH['C-BACHI'].id; const L = MH['C-LUOI'].id;
  let r = docFormTheoMon(formTu({
    mh: [R, B], [`kg_${R}`]: '5', [`goi_${R}`]: '2', [`ncc_${R}`]: NCC['NCC Bò Mỹ'],
    [`kg_${B}`]: '1,5', [`ncc_${B}`]: '',
    t0_mh: L, t0_kg: '2', t0_ncc: '', t1_mh: '', t1_kg: '', so_dong: '2',
  }), mon, { soDong: 2, nccDung, macDinh });
  const gom = Object.fromEntries([...r.theoNcc].map(([n, d]) => [n, d.map(x => `${x.mat_hang_id === R ? 'R' : x.mat_hang_id === B ? 'B' : 'L'}=${x.so_kg_dat}`).join()]));
  ok('Gom theo NCC: ô chọn thắng đề xuất (Ribeye → NCC Bò Mỹ), ô trống = đề xuất (Ba chỉ → Bò Mỹ, Lưỡi → Chợ)',
    r.loi.length === 0 && gom[NCC['NCC Bò Mỹ']] === 'R=5,B=1.5' && gom[NCC['NCC Chợ']] === 'L=2' && r.theoNcc.size === 2,
    JSON.stringify({ gom, loi: r.loi }));
  ok('Số kiểu Việt: "1,5" là một phẩy năm', r.theoNcc.get(NCC['NCC Bò Mỹ'])?.find(x => x.mat_hang_id === B)?.so_kg_dat === 1.5);
  ok('Không dòng nào có khóa giá (đặt theo món không có ô giá)', [...r.theoNcc.values()].flat().every(x => !('don_gia_du_kien' in x)));

  r = docFormTheoMon(formTu({ mh: [R], [`kg_${R}`]: '5', [`ncc_${R}`]: '' }), mon, { soDong: 1, nccDung, macDinh: new Map() });
  ok('Món không có NCC đề xuất, ô trống → "Ribeye Úc: chọn nhà cung cấp"', r.loi.join() === 'Ribeye Úc: chọn nhà cung cấp'
    && r.loiEn.join() === 'Ribeye Úc: choose a supplier', r.loi.join());
  r = docFormTheoMon(formTu({ mh: [R], [`kg_${R}`]: '5', [`ncc_${R}`]: '00000000-0000-4000-8000-000000000999' }), mon,
    { soDong: 1, nccDung, macDinh });
  ok('NCC không còn giao dịch → báo, không gom', /ngừng giao dịch/.test(r.loi.join()) && r.theoNcc.size === 0, r.loi.join());
  r = docFormTheoMon(formTu({ mh: [R], [`kg_${R}`]: '' }), mon, { soDong: 1, nccDung, macDinh });
  ok('Không món nào có kg → "Đơn chưa có món nào"', /Đơn chưa có món nào/.test(r.loi.join()), r.loi.join());
  const chu = chuFormTheoMon(formTu({ mh: [R], [`ncc_${R}`]: NCC['NCC Chợ'], t0_ncc: NCC['NCC Mới'] }), 1);
  ok('Chữ đã chọn được giữ để điền lại form', chu.nccCo.get(R) === NCC['NCC Chợ'] && chu.nccThem[0] === NCC['NCC Mới']);

  const g = '00000000-0000-4000-8000-0000000000a1';
  const a1 = await maGuiCon(g, NCC['NCC Bò Úc']);
  ok('maGuiCon: dạng UUID, cố định theo (mã gửi form, NCC), khác nhau giữa NCC và giữa form',
    laUuid(a1) && a1 === await maGuiCon(g, NCC['NCC Bò Úc']) && a1 !== await maGuiCon(g, NCC['NCC Bò Mỹ'])
      && a1 !== await maGuiCon('00000000-0000-4000-8000-0000000000a2', NCC['NCC Bò Úc']) && a1 !== g, a1);
});

// ===========================================================================
await nhom('5 · WEB: LẬP MỖI NCC MỘT ĐƠN NHÁP (CLIENT GIẢ)', async () => {
  const tk = clientCua(UID.thuKhoA);
  const tenNcc = new Map(Object.entries(NCC).map(([t, id]) => [id, t]));
  const d = (ma, kg) => ({ mat_hang_id: MH[ma].id, so_kg_dat: kg, so_goi_dat: null });
  const theoNcc = new Map([[NCC['NCC Bò Úc'], [d('C-RIBEYE', 5)]], [NCC['NCC Bò Mỹ'], [d('C-BACHI', 1.5)]],
    [NCC['NCC Chợ'], [d('C-LUOI', 2)]]]);
  const goiYW = await docGoiYDatHang(tk, cnA.id, null);
  ok('docGoiYDatHang(null) qua client giả (thủ kho): mỗi món một dòng, có NCC đề xuất', goiYW.length === 3
    && goiYW.every(x => laUuid(x.nha_cung_cap_id)));

  const G1 = '00000000-0000-4000-8000-0000000000b1';
  let kq = await lapDonTheoNcc(tk, cnA.id, theoNcc, G1, tenNcc);
  let ds = await donNhap();
  ok('Thủ kho lập được 3 đơn nháp, mỗi NCC một đơn, đúng món và kg', kq.ok && kq.don.length === 3 && ds.length === 3
    && ds.every(x => x.trang_thai === 'nhap')
    && ds.find(x => x.nha_cung_cap_id === NCC['NCC Bò Mỹ'])?.dong === 'C-BACHI=1.5', JSON.stringify({ kq, ds }));
  ok('Câu báo: "Đã lập 3 đơn nháp: NCC Bò Mỹ (1 món), NCC Bò Úc (1 món), NCC Chợ (1 món)."',
    kq.cau.startsWith('Đã lập 3 đơn nháp: NCC Bò Mỹ (1 món), NCC Bò Úc (1 món), NCC Chợ (1 món). ') && /^Created 3 draft orders/.test(kq.cauEn ?? ''),
    kq.cau);
  kq = await lapDonTheoNcc(tk, cnA.id, theoNcc, G1, tenNcc);
  ok('Bấm lại cùng form → vẫn 3 đơn (mã gửi từng NCC cố định), không lập đôi', kq.ok && (await donNhap()).length === 3,
    JSON.stringify(await donNhap()));

  // Mất mạng ở NCC thứ hai (theo thứ tự tên): đơn thứ nhất đã lập, thứ hai không chắc, thứ ba vẫn lập.
  const G2 = '00000000-0000-4000-8000-0000000000b2';
  let lan = 0;
  const dut = { rpc: (...a) => (++lan === 2 ? Promise.reject(new TypeError('fetch failed')) : tk.rpc(...a)) };
  kq = await lapDonTheoNcc(dut, cnA.id, theoNcc, G2, tenNcc);
  ok('Mất mạng giữa chừng → ok = false; câu kể đúng 2 đơn đã lập và NCC chưa chắc',
    !kq.ok && kq.don.length === 2 && /^Đã lập 2 đơn nháp: NCC Bò Mỹ \(1 món\), NCC Chợ \(1 món\)\. Chưa lập được đơn cho NCC Bò Úc: mất kết nối — không chắc đã lập hay chưa\./.test(kq.cau),
    kq.cau);
  ok('Câu không nói "Đã lập" cho NCC lỗi', !/Đã lập[^.]*NCC Bò Úc/.test(kq.cau));
  kq = await lapDonTheoNcc(tk, cnA.id, theoNcc, G2, tenNcc);
  ok('Bấm lại → lập nốt NCC còn thiếu, tổng 6 đơn (3 cũ + 3 lần hai), không đơn nào đôi', kq.ok && (await donNhap()).length === 6,
    String((await donNhap()).length));

  const loi500 = { rpc: async () => ({ data: null, error: { message: 'upstream 500', code: '500' } }) };
  kq = await lapDonTheoNcc(loi500, cnA.id, theoNcc, '00000000-0000-4000-8000-0000000000b3', tenNcc);
  ok('Dịch vụ trả 500 cho mọi NCC → ok = false, không chữ "Đã lập"', !kq.ok && kq.don.length === 0 && !/Đã lập/.test(kq.cau)
    && /^Chưa lập được đơn cho /.test(kq.cau), kq.cau);
  ok('Không đơn nào lập thêm khi lỗi 500', (await donNhap()).length === 6);

  const nv = clientCua(UID.nvQuayA);
  kq = await lapDonTheoNcc(nv, cnA.id, theoNcc, '00000000-0000-4000-8000-0000000000b4', tenNcc);
  ok('NV quầy (không quyền nhap) → không lập được đơn nào', !kq.ok && kq.don.length === 0 && (await donNhap()).length === 6, kq.cau);
  const gia = (await db.query(`select count(*)::int as n from kho_don_dat_dong where don_gia_du_kien is not null`)).rows[0].n;
  ok('Đơn thủ kho lập theo món không có giá', gia === 0);
});

// ===========================================================================
await nhom('6 · MÃ NGUỒN TRANG', async () => {
  const tm = doc('web/src/pages/noi-bo/kho/dat-hang/theo-mon.astro');
  ok('Trang "Đặt theo món": chặn vai không nhap, gợi ý không chọn NCC, danh mục NCC – món',
    /if \(!k\.duoc\('nhap'\)\) return Astro\.redirect/.test(tm) && /docGoiYDatHang\(k\.client, cn\.id, null\)/.test(tm)
      && /docNccMon\(k\.client, cn\.id\)/.test(tm) && /nccCuaMon\(/.test(tm));
  ok('Trang "Đặt theo món": đọc form bằng docFormTheoMon, lập đơn bằng lapDonTheoNcc, có ma_gui',
    /docFormTheoMon\(form, mon,/.test(tm) && /lapDonTheoNcc\(k\.client, cn\.id, r\.theoNcc, maGui, tenNcc\)/.test(tm)
      && /name="ma_gui"/.test(tm));
  ok('Trang "Đặt theo món": không ô giá (thủ kho không thấy tiền)', !/name=\{`gia_|name=\{`t\$\{i\}_gia/.test(tm));
  ok('Trang "Đặt theo món": đọc gợi ý lỗi thì báo ngay, không im như thể không món nào cần đặt',
    /loiGoiY = true/.test(tm) && /t\.khongDocGoiY/.test(tm));
  const moi = doc('web/src/pages/noi-bo/kho/dat-hang/moi.astro');
  ok('Lập đơn (theo NCC): có lối "Đặt theo món", nhắc NCC chính khác', /href=\{`\$\{DS\}\/theo-mon`\}/.test(moi) && /chinhKhac\(/.test(moi));
});

const dsTon = (await db.query(`select * from kho_doi_soat_ton()`)).rows;
ok('kho_doi_soat_ton() rỗng', dsTon.length === 0, JSON.stringify(dsTon));

process.exit(ketThuc('ĐẶT HÀNG THEO DANH MỤC NCC – MÓN'));
