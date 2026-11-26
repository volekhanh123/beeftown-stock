/**
 * BEEFTOWN KHO — Món ủ chỉ ở kho: không bao giờ lên FABi, không bán qua iPOS (0128)
 * ==================================================================================
 *
 *     node test/test-kho-mon-u-chi-kho.mjs
 *
 * Khánh 26/11/2026: "FABI sẽ không có các món này, chỉ có phần mềm kho của tôi thôi" — "cứ tảng ủ là trong kho
 * thôi". Khánh chọn: kho TỰ NHẬN món ủ theo công thức Trim (món loại tảng là đầu ra của công thức đang dùng của món
 * khác — luật tảng ủ của 0107), không ô tích; món ủ vẫn giữ được mã cân ("dù cái mã đó chả làm gì nhưng chứa thông
 * tin"). Phải đúng:
 *   · kho_v_mon_u có đúng tảng ủ — không theo tên ("Củ cải ủ chua", tảng tên có "ủ" mà không ra từ Trim đều không
 *     phải); tắt công thức Trim thì thôi là món ủ; RLS: vai kho xem được, anon không;
 *   · không ghép được mã iPOS với món ủ (kho_ipos_gan_ma_v2 — món, hàng cân nhãn), câu vi + en; món khác vẫn ghép;
 *   · bán qua iPOS: mã món = mã cân của món ủ, nhãn cân in mã của món ủ, mã giảm của món ủ, ghép tay có từ trước →
 *     dòng "Chưa khớp" kèm lý do, KHÔNG dòng sổ nào; khay cắt ra (mã cân riêng) vẫn trừ như cũ; lối thoát "Không
 *     phải hàng kho" cho mã đó vẫn dùng được;
 *   · web: docMonU; "Món cần có trên FABi", file mon-fabi.csv / mon-fabi.xlsx không có món ủ (cả mã cân, mã giảm) dù
 *     món ủ có mã cân, có giá; laMaKhoTuNhan / maCanTuNhan / oThucDon không gọi mã của món ủ là "kho tự nhận";
 *     kiemGhep / ganMaIpos từ chối trước khi gọi database, cùng chữ với trigger; trang Ghép món, Mặt hàng đọc docMonU;
 *   · câu mới có bản tiếng Anh;
 *   · kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui, UID_MAY_IPOS, themMayIpos, taoClientPg } from './kho-chung.mjs';
import { phanTichHoaDon } from '../../web/src/lib/kho/ipos.ts';
import { laMaKhoTuNhan, maCanTuNhan, kiemGhep, oThucDon, ganMaIpos, cauKhongGhepMonU } from '../../web/src/lib/kho/ban-ipos.ts';
import { docMonFabi, monCanCoTrenFabi, taoTepMonFabi, taoTepNhapFabi } from '../../web/src/lib/kho/thu-ngan.ts';
import { docMatHang, docMonU } from '../../web/src/lib/kho/danh-muc.ts';
import { dichCau } from '../../web/src/lib/cau-noi-bo.ts';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — MÓN Ủ CHỈ Ở KHO, KHÔNG LÊN FABi (0128)');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
await themMayIpos(db, cnA, cnB);
const MAY = UID_MAY_IPOS.mayIposA;
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');
// Hàm web đọc song song (Promise.all) — xếp hàng từng lời gọi trên MỘT database PGlite (như test-kho-ipos-ma-can.mjs).
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
const MH = {};
let vt = {};
let ctTrim;
const TEN_U = 'Đầu thăn ngoại tảng ủ';
const CAU_GHEP_U = `"${TEN_U}" là món ủ — chỉ ở kho, không bán qua FABi: không ghép được mã iPOS với món này`;
const LY_DO_U = `Món ủ "${TEN_U}" chỉ ở kho, không bán qua FABi — ghép mã này với món bán ra ở Ghép món`;

const monU = async (uid = UID.qlA) => (await duoi(uid, `select mat_hang_id, ten, ma_can from kho_v_mon_u order by ten`)).rows ?? [];
const tonQuay = async ma => {
  const r = (await db.query(`select coalesce(sum(so_goi), 0)::int as goi, coalesce(sum(so_kg), 0) as kg
    from kho_ton where mat_hang_id = $1 and vi_tri_id = $2`, [MH[ma].id, vt.quay])).rows[0];
  return { goi: r.goi, kg: Number(r.kg) };
};
async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

/** Nhãn cân EAN-13 theo mẫu mặc định 2XCCCCCWWWWWK. */
function nhan(maCan, kg) {
  const s = '20' + String(maCan).padStart(5, '0') + String(Math.round(kg * 1000)).padStart(5, '0');
  let t = 0;
  for (let i = 0; i < 12; i++) t += Number(s[i]) * (i % 2 === 0 ? 1 : 3);
  return s + ((10 - t % 10) % 10);
}

// ---- Hóa đơn iPOS DW đúng dạng FABi gửi (như test-kho-ipos-ma-can.mjs), qua bộ đọc của web --------------
let soHd = 0;
function hoaDonFabi(items) {
  soHd += 1;
  const id = `SALE-MON-U-${soHd}`;
  const vn = new Date(Date.now() - 10 * 60000 + 7 * 3600000);
  const ngay = Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()) / 1000 - 7 * 3600;
  return {
    sale_id: id, brand_id: 'BRAND-THU', store_id: 'STORE-THU', pos_type: 'POS_FABI', datastate: 0, tran_date: ngay,
    sale: { sale_id: id, tran_no: `SLK${soHd}`, date_last: ngay, tran_date: ngay, hour_last: vn.getUTCHours(), minute_last: vn.getUTCMinutes() },
    sale_detail: items.map((it, i) => ({
      sale_detail_id: `SD_${id}_${i}`, item_id: it.ma, description: it.ten ?? 'Món thử', unit_id: 'KG',
      quantity: it.sl, price_org: 950000, price_sale: 950000, amount: Math.round(it.sl * 950000), discount: 0,
    })),
  };
}
/** Bán một dòng. nhanCan: dòng mang mã vạch nhãn cân (máy quét đọc tem) thay vì số lượng. */
async function ban(it, { nhanCan } = {}) {
  const kq = phanTichHoaDon(hoaDonFabi([it]));
  if (kq.loai !== 'hoa_don') throw new Error(kq.cau);
  if (nhanCan) for (const d of kq.hoaDon.dong) { delete d.so_luong; d.ma_vach = nhan(nhanCan, it.sl); }
  const r = await duoi(MAY, `select kho_ipos_nhan_callback($1, $2::jsonb) as kq`, [cnA.id, JSON.stringify(kq.hoaDon)]);
  if (r.loi) throw new Error(r.loi);
  const [d] = (await db.query(`select d.* from kho_ipos_dong d join kho_ipos_hoa_don h on h.id = d.hoa_don_id
    where h.chi_nhanh_id = $1 and h.ma_hd = $2`, [cnA.id, kq.hoaDon.ma_hd])).rows;
  const so = (await db.query(`select * from kho_so_cai where chung_tu_loai = 'ban_hang' and chung_tu_id = $1`, [d.id])).rows;
  return { d, so };
}
const ghep = (ma, kieu, matHang, donVi = null) => duoi(UID.qlA,
  `select kho_ipos_gan_ma_v2($1, $2, $3, $4, $5, null) as kq`, [cnA.id, ma, kieu, matHang, donVi]);

// ===========================================================================
await nhom('1 · CHUẨN BỊ: NGUYÊN TẢNG → TRIM → TẢNG Ủ (CÓ MÃ CÂN) → CẮT → KHAY; MÓN TÊN CÓ "Ủ" MÀ KHÔNG PHẢI MÓN Ủ', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  // Như kho thật 26/11/2026: tảng ủ có mã cân và giá (Khánh muốn giữ mã) — trước 0128 nó sẽ vào file nhập FABi.
  const them = await duoi(UID.qlA, `insert into kho_mat_hang (ma, ten, loai, dem_goi, don_vi_goi, theo_tang, han_dung_ngay, ma_can, gia_ban_kg, noi_de_sau_pha)
    values ('T-DTN', 'Đầu thăn ngoại Úc nguyên tảng', 'tang', true, 'tảng', true, 45, null, null, null),
           ('T-DTN-U', $1, 'tang', true, 'tảng', false, 60, '1012', 900000, 'kho'),
           ('C-DTN', 'Đầu thăn ngoại', 'phan_cat', true, 'khay', false, 4, '1011', 950000, 'quay'),
           ('C-CUCAI', 'Củ cải ủ chua', 'phan_cat', true, 'hộp', false, 10, '1020', 30000, 'quay'),
           ('T-THANU', 'Thăn ủ khô nguyên tảng', 'tang', true, 'tảng', false, 30, '1021', 800000, null)`, [TEN_U]);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vt = Object.fromEntries((await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  const ct = async (vao, ten, ra) => {
    const id = (await duoi(UID.qlA, `insert into kho_cong_thuc_pha (mat_hang_vao_id, ten) values ($1, $2) returning id`, [MH[vao].id, ten])).rows[0].id;
    for (const [i, ma] of ra.entries()) {
      await duoi(UID.qlA, `insert into kho_cong_thuc_pha_dong (cong_thuc_id, mat_hang_ra_id, thu_tu) values ($1, $2, $3)`, [id, MH[ma].id, i + 1]);
    }
    return id;
  };
  ctTrim = await ct('T-DTN', 'Trim', ['T-DTN-U', 'P-VUN']);
  await ct('T-DTN-U', 'Cắt', ['C-DTN']);

  // Khay ở quầy để bán thật qua iPOS (tồn đầu kỳ).
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'ton_dau', p_nha_cung_cap_id => null, p_vi_tri_id => $3, p_ngay_nhap => $4::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => '{}'::text[],
      p_truong_them => '{}'::jsonb, p_dong => $5::jsonb)`,
    [cnA.id, maGui(), vt.quay, homNay, JSON.stringify([
      { mat_hang_id: MH['C-DTN'].id, so_goi: 2, so_kg: 1, don_gia_kg: 700000, han_dung: await ngaySau(3) },
    ])]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  for (const [sql, ts] of [[`select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]],
                           [`select kho_duyet_phieu_nhap($1)`, [p.phieu_id]]]) {
    const r = await duoi(UID.qlA, sql, ts);
    if (r.loi) throw new Error(r.loi);
  }
  const chu = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb) as v`, [cnA.id,
    JSON.stringify({ bat: true, pos_parent: 'BRAND-THU', pos_id: 'STORE-THU', vi_tri_ban_id: vt.quay })]);
  const cs = await duoi(UID.chu, `select kho_ipos_chuyen_sang($1, $2::timestamptz)`, [cnA.id, TU_LUC]);
  ok('Năm món, hai công thức (Trim, Cắt), 2 khay ở quầy, bật trừ kho theo iPOS',
     them.loi === null && chu.loi === null && cs.loi === null && (await tonQuay('C-DTN')).goi === 2,
     them.loi ?? chu.loi ?? cs.loi ?? '');
});

// ===========================================================================
await nhom('2 · kho_v_mon_u: ĐÚNG TẢNG Ủ, THEO CÔNG THỨC TRIM — KHÔNG THEO TÊN', async () => {
  const ds = await monU();
  ok('Chỉ "Đầu thăn ngoại tảng ủ" (đầu ra Trim, loại tảng), kèm mã cân 1012',
     ds.length === 1 && ds[0].mat_hang_id === MH['T-DTN-U'].id && ds[0].ma_can === '1012', JSON.stringify(ds));
  ok('Không theo tên: "Củ cải ủ chua", "Thăn ủ khô nguyên tảng" (tảng không ra từ Trim) không phải món ủ',
     !ds.some(u => u.mat_hang_id === MH['C-CUCAI'].id || u.mat_hang_id === MH['T-THANU'].id), JSON.stringify(ds));
  ok('Nguyên tảng (món vào của Trim) và khay (đầu ra Cắt, loại phần cắt) không phải món ủ',
     !ds.some(u => u.mat_hang_id === MH['T-DTN'].id || u.mat_hang_id === MH['C-DTN'].id));

  await db.query(`update kho_cong_thuc_pha set dang_dung = false where id = $1`, [ctTrim]);
  ok('Tắt công thức Trim → tảng ủ thôi là món ủ', (await monU()).length === 0);
  await db.query(`update kho_cong_thuc_pha set dang_dung = true where id = $1`, [ctTrim]);
  ok('Bật lại → là món ủ', (await monU()).length === 1);

  const nv = await monU(UID.nvQuayA);
  ok('Vai kho khác (nhân viên quầy) đọc được view — RLS danh mục (quyền xem)', nv.length === 1, JSON.stringify(nv));
  const an = await duoiAnon(`select * from kho_v_mon_u`);
  ok('anon không đọc được món ủ (lỗi quyền hoặc rỗng)', an.loi !== null || (an.rows ?? []).length === 0, JSON.stringify(an.rows));
});

// ===========================================================================
await nhom('3 · KHÔNG GHÉP ĐƯỢC MÃ iPOS VỚI MÓN Ủ (TRIGGER kho_ipos_ma_hang_khong_mon_u)', async () => {
  const mon = await ghep('ITEM-U1', 'mon', MH['T-DTN-U'].id, 'kg');
  ok('Ghép kiểu món → từ chối, câu đúng chữ', mon.loi === CAU_GHEP_U, mon.loi ?? 'ghép được');
  const nhanCan = await ghep('ITEM-U2', 'goi_can', MH['T-DTN-U'].id);
  ok('Ghép "hàng cân nhãn" kèm món ủ → từ chối', nhanCan.loi === CAU_GHEP_U, nhanCan.loi ?? 'ghép được');
  ok('…không dòng ghép nào được ghi',
     Number((await db.query(`select count(*) n from kho_ipos_ma_hang where mat_hang_id = $1`, [MH['T-DTN-U'].id])).rows[0].n) === 0);
  const khay = await ghep('ITEM-KHAY', 'mon', MH['C-DTN'].id, 'kg');
  ok('Món khác (khay Đầu thăn ngoại) vẫn ghép được', khay.loi === null, khay.loi ?? '');
  const boGhep = await ghep('ITEM-KHAY', null, null);
  ok('Bỏ ghép vẫn được', boGhep.loi === null, boGhep.loi ?? '');
  ok('Câu từ chối có bản tiếng Anh', dichCau('en', CAU_GHEP_U) !== CAU_GHEP_U && /aging item/.test(dichCau('en', CAU_GHEP_U)),
     dichCau('en', CAU_GHEP_U));
  ok('Web dựng đúng chữ câu của trigger (cauKhongGhepMonU)', cauKhongGhepMonU(TEN_U).vi === CAU_GHEP_U
     && /aging item/.test(cauKhongGhepMonU(TEN_U).en));
});

// ===========================================================================
await nhom('4 · BÁN QUA iPOS: MỌI ĐƯỜNG KHỚP RA MÓN Ủ → "CHƯA KHỚP", KHÔNG TRỪ KHO', async () => {
  // Ghép tay có TỪ TRƯỚC khi món thành món ủ (công thức Trim bật sau): trigger không đụng dòng cũ.
  await db.query(`update kho_cong_thuc_pha set dang_dung = false where id = $1`, [ctTrim]);
  const cu = await ghep('ITEM-CU', 'mon', MH['T-DTN-U'].id, 'kg');
  await db.query(`update kho_cong_thuc_pha set dang_dung = true where id = $1`, [ctTrim]);
  ok('Ghép cũ (lúc chưa là món ủ) có trong sổ ghép', cu.loi === null, cu.loi ?? '');
  const ghiLai = await ghep('ITEM-CU', 'mon', MH['T-DTN-U'].id, 'goi');
  ok('…sửa lại ghép cũ đó (vẫn món ủ) → từ chối', ghiLai.loi === CAU_GHEP_U, ghiLai.loi ?? 'ghép được');

  await db.query(`insert into kho_ma_giam (mat_hang_id, phan_tram, ma_can) values ($1, 30, '90012')`, [MH['T-DTN-U'].id]);
  const truoc = (await db.query(`select count(*)::int n from kho_so_cai`)).rows[0].n;
  const duong = [
    ['mã món = mã cân của món ủ ("01012")', { ma: '01012', ten: TEN_U, sl: 0.8 }, {}],
    ['nhãn cân in mã cân của món ủ (món FABi tự sinh mã)', { ma: 'ITEM-NHAN', ten: 'Hàng cân', sl: 0.8 }, { nhanCan: 1012 }],
    ['mã giảm của món ủ ("90012")', { ma: '90012', sl: 0.8 }, {}],
    ['ghép tay có từ trước ("ITEM-CU")', { ma: 'ITEM-CU', sl: 0.8 }, {}],
  ];
  for (const [ten, it, tuy] of duong) {
    const { d, so } = await ban(it, tuy);
    ok(`${ten} → "Chưa khớp", lý do món ủ, không dòng sổ, không món`,
       d.trang_thai === 'chua_khop' && d.ly_do === LY_DO_U && so.length === 0 && d.mat_hang_id === null,
       JSON.stringify({ trang_thai: d.trang_thai, ly_do: d.ly_do, so: so.length, mh: d.mat_hang_id }));
  }
  ok('…sổ kho không thêm dòng nào', (await db.query(`select count(*)::int n from kho_so_cai`)).rows[0].n === truoc);
  const thu = await duoi(MAY, `select kho_ipos_nhan_callback($1, '[]'::jsonb)`, [cnA.id]);
  ok('Thử lại (cron) → các dòng vẫn "Chưa khớp", vẫn không trừ', thu.loi === null
     && Number((await db.query(`select count(*) n from kho_ipos_dong where ly_do = $1 and trang_thai = 'chua_khop'`, [LY_DO_U])).rows[0].n) === 4
     && (await db.query(`select count(*)::int n from kho_so_cai`)).rows[0].n === truoc, thu.loi ?? '');
  ok('Lý do có bản tiếng Anh (cả dạng "Chưa ghi được: …")',
     /Aging item/.test(dichCau('en', LY_DO_U)) && /^Not recorded yet: Aging item/.test(dichCau('en', `Chưa ghi được: ${LY_DO_U}`)),
     dichCau('en', LY_DO_U));

  const { d: k, so: soK } = await ban({ ma: '01011', ten: 'Đầu thăn ngoại', sl: 0.5 });
  ok('Khay cắt ra (mã cân 1011) vẫn tự nhận và trừ 1 khay như cũ', k.trang_thai === 'da_ghi' && k.mat_hang_id === MH['C-DTN'].id
     && soK.length === 1 && soK[0].so_goi === -1 && (await tonQuay('C-DTN')).goi === 1, JSON.stringify({ k, soK }));

  // Lối thoát: FABi lỡ có món mang mã 01012 → ghép "Không phải hàng kho" vẫn được, dòng chờ được xử lý lại.
  const bq = await ghep('01012', 'bo_qua', null);
  const sau = (await db.query(`select trang_thai, ly_do from kho_ipos_dong where ma_ipos = '01012'`)).rows;
  ok('Ghép "01012" là "Không phải hàng kho" → được, dòng chờ thành bỏ qua', bq.loi === null
     && sau.length === 1 && sau[0].trang_thai === 'bo_qua' && sau[0].ly_do === 'Không phải hàng kho', bq.loi ?? JSON.stringify(sau));
  await doiSoat('Sau bán qua iPOS');
});

// ===========================================================================
await nhom('5 · WEB: MÓN CẦN CÓ TRÊN FABi, FILE CSV / XLSX KHÔNG CÓ MÓN Ủ', async () => {
  const ql = clientCua(UID.qlA);
  const u = await docMonU(ql);
  ok('docMonU: đúng một món ủ, có tên và mã cân', u.length === 1 && u[0].mat_hang_id === MH['T-DTN-U'].id
     && u[0].ten === TEN_U && u[0].ma_can === '1012', JSON.stringify(u));

  const { dong } = await docMonFabi(ql, cnA.id);
  ok('Món cần có trên FABi: không dòng nào của món ủ (cả mã cân 1012 lẫn mã giảm 90012)',
     !dong.some(d => d.mat_hang_id === MH['T-DTN-U'].id) && !dong.some(d => ['1012', '90012'].includes(d.maMon)),
     JSON.stringify(dong.map(d => [d.loai, d.maMon, d.tenMonKho])));
  ok('…món tên có "ủ" mà không phải món ủ vẫn có: Củ cải ủ chua (1020), Thăn ủ khô (1021)',
     dong.some(d => d.maMon === '1020' && d.vaoFile) && dong.some(d => d.maMon === '1021' && d.vaoFile),
     JSON.stringify(dong.map(d => [d.maMon, d.vaoFile])));

  // Không truyền monU (như trước 0128): món ủ có mã cân, có giá sẽ vào file — chứng minh bộ lọc là thứ bỏ nó.
  const [matHang] = [await docMatHang(ql)];
  const khongLoc = monCanCoTrenFabi({ matHang, oMa: [], maGiam: [{ id: 'g', mat_hang_id: MH['T-DTN-U'].id, phan_tram: 30, ma_can: '90012', dang_dung: true }],
                                       menu: [], daGhep: [], soChuSo: 5 });
  const coLoc = monCanCoTrenFabi({ matHang, oMa: [], maGiam: [{ id: 'g', mat_hang_id: MH['T-DTN-U'].id, phan_tram: 30, ma_can: '90012', dang_dung: true }],
                                    menu: [], daGhep: [], soChuSo: 5, monU: new Set([MH['T-DTN-U'].id]) });
  ok('monCanCoTrenFabi: thiếu monU thì món ủ vào file (mã cân + mã giảm); có monU thì không dòng nào',
     khongLoc.filter(d => d.mat_hang_id === MH['T-DTN-U'].id && d.vaoFile).length === 2
     && !coLoc.some(d => d.mat_hang_id === MH['T-DTN-U'].id), JSON.stringify(khongLoc.map(d => [d.loai, d.maMon, d.vaoFile])));

  const csv = await taoTepMonFabi(ql, { vai: 'quan_ly', chiNhanh: cnA, nn: 'vi' });
  ok('mon-fabi.csv: 200, không có món ủ (tên, mã 1012, mã giảm 90012), có Củ cải ủ chua', csv.status === 200
     && !csv.noiDung.includes(TEN_U) && !/(^|[^0-9])0*1012([^0-9]|$)/m.test(csv.noiDung) && !csv.noiDung.includes('90012')
     && csv.noiDung.includes('Củ cải ủ chua'), csv.noiDung.slice(0, 400));
  const xlsx = await taoTepNhapFabi(ql, { vai: 'quan_ly', chiNhanh: cnA, nn: 'vi' });
  const chu = xlsx.noiDung instanceof Uint8Array ? new TextDecoder().decode(xlsx.noiDung) : String(xlsx.noiDung);
  ok('mon-fabi.xlsx: 200, file có món (Củ cải ủ chua, Thăn ủ khô), không có món ủ (tên, mã 01012, 90012)', xlsx.status === 200
     && xlsx.tenTep && chu.includes('Củ cải ủ chua') && chu.includes('Thăn ủ khô nguyên tảng')
     && !chu.includes(TEN_U) && !chu.includes('01012') && !chu.includes('90012'), `${xlsx.status} ${xlsx.soMon}`);
  const hong = { from: () => { throw new Error('mất mạng'); }, rpc: () => { throw new Error('mất mạng'); } };
  const loi = await taoTepNhapFabi(hong, { vai: 'quan_ly', chiNhanh: cnA, nn: 'vi' });
  ok('Đọc lỗi (kể cả danh sách món ủ) → 500 kèm câu, không file', loi.status === 500 && loi.tenTep === null, JSON.stringify(loi));
});

// ===========================================================================
await nhom('6 · WEB: GHÉP MÓN — MÃ CỦA MÓN Ủ KHÔNG "KHO TỰ NHẬN", KHÔNG CHỌN ĐƯỢC MÓN Ủ', async () => {
  const monMaCan = [
    { id: MH['T-DTN-U'].id, ten: TEN_U, ma_can: '1012', dang_dung: true },
    { id: MH['C-DTN'].id, ten: 'Đầu thăn ngoại', ma_can: '1011', dang_dung: true },
  ];
  const oMa = [{ id: 'o-u', mat_hang_id: MH['T-DTN-U'].id, so_o: 1, ma_can: '10121' }];
  const maGiam = [{ ma_can: '90012', phan_tram: 30, mat_hang_id: MH['T-DTN-U'].id }];
  const monDangDung = new Set([MH['T-DTN-U'].id, MH['C-DTN'].id]);
  const cu = { oMa, maGiam, monDangDung, monMaCan };
  const moi = { ...cu, monU: new Map([[MH['T-DTN-U'].id, TEN_U]]) };
  ok('Thiếu monU (như trước 0128): "01012" là kho tự nhận — để thấy bộ lọc có tác dụng', laMaKhoTuNhan('01012', cu)?.loai === 'can');
  ok('Có monU: mã cân, ô, mã giảm của món ủ đều là mã thường (database để "Chưa khớp")',
     laMaKhoTuNhan('01012', moi) === null && laMaKhoTuNhan('10121', moi) === null && laMaKhoTuNhan('90012', moi) === null
     && maCanTuNhan('01012', moi) === null && oThucDon('01012', null, moi).kieu === 'nut_ghep');
  ok('Mã cân của khay vẫn kho tự nhận', maCanTuNhan('01011', moi)?.matHangId === MH['C-DTN'].id);

  const chanMon = kiemGhep({ ma: 'ITEM-X', kieu: 'mon', matHang: MH['T-DTN-U'].id, donVi: 'kg', kgMoiDonVi: null }, moi, true, true);
  const chanO = kiemGhep({ ma: 'ITEM-X', kieu: 'mon', matHang: null, donVi: 'kg', kgMoiDonVi: null, oMa: 'o-u' }, moi, true, true);
  const chanNhan = kiemGhep({ ma: 'ITEM-X', kieu: 'goi_can', matHang: MH['T-DTN-U'].id, donVi: null, kgMoiDonVi: null }, moi, true, true);
  ok('kiemGhep: món ủ (chọn món, chọn ô, hàng cân nhãn) → từ chối, không ô xác nhận nào mở được, đúng chữ trigger',
     [chanMon, chanO, chanNhan].every(c => c?.canXacNhan === false && c.cau.vi === CAU_GHEP_U), JSON.stringify([chanMon, chanO, chanNhan]));
  ok('kiemGhep: "Không phải hàng kho" cho mã 01012 không cần xác nhận "trùng mã" nữa (không còn là kho tự nhận)',
     kiemGhep({ ma: '01012', kieu: 'bo_qua', matHang: null, donVi: null, kgMoiDonVi: null }, moi, false, false) === null);

  const f = new FormData();
  f.set('viec', 'ghep'); f.set('ma_ipos', 'ITEM-WEB'); f.set('mat_hang_id', MH['T-DTN-U'].id); f.set('don_vi_ban', 'kg');
  const kq = await ganMaIpos(clientCua(UID.qlA), cnA.id, f);
  ok('ganMaIpos: từ chối trước khi gọi database, câu vi + en', kq.ok === false && kq.cau === CAU_GHEP_U && /aging item/.test(kq.cauEn ?? ''),
     JSON.stringify(kq));
  ok('…không dòng ghép nào', Number((await db.query(`select count(*) n from kho_ipos_ma_hang where ma_ipos = 'ITEM-WEB'`)).rows[0].n) === 0);
});

// ===========================================================================
await nhom('7 · TRANG: GHÉP MÓN, MẶT HÀNG ĐỌC MÓN Ủ', async () => {
  const g = doc('web/src/pages/noi-bo/kho/ban-ipos/ghep.astro');
  ok('Ghép món: đọc docMonU cùng phần chính; ô chọn món bỏ món ủ; truyền monU cho kiểm ghép và mục FABi',
     /docMonU\(k\.client\)/.test(g) && /dangDung = matHang\.filter\(m => m\.dang_dung && !laDemCai\(m\) && !idMonU\.has\(m\.id\)\)/.test(g)
     && /monU: idMonU/.test(g) && /monU: new Set\(idMonU\.keys\(\)\)/.test(g));
  const m = doc('web/src/pages/noi-bo/kho/cai-dat/mat-hang.astro');
  ok('Mặt hàng: đọc docMonU, ghi chú "món ủ · chỉ ở kho" ở danh sách và form sửa', /docMonU\(k\.client\)/.test(m)
     && /idMonU\.has\(dangSua!\.id\)/.test(m) && /món ủ · chỉ ở kho/.test(m));
  const t = doc('web/src/lib/kho/thu-ngan.ts');
  ok('docMonFabi (CSV + XLSX) đọc docMonU và truyền monU', /docMonU\(client\)/.test(t) && /monU: new Set\(monU\.map/.test(t));
});

await doiSoat('Cuối file');
process.exit(ketThuc('Món ủ chỉ ở kho — không bao giờ lên FABi'));
