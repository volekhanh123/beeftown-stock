/**
 * BEEFTOWN KHO — Kiểm thử theo dõi theo tảng (0046, GĐ1 truy vết tảng)
 * =====================================================================
 *
 *     node test/test-kho-theo-tang.mjs
 *
 * Món bật "Theo dõi theo tảng": nhận hàng mỗi dòng một tảng, có ngày mổ; duyệt
 * thì mỗi tảng thành một lô mang số tảng tăng dần theo chi nhánh và ngày ủ xong
 * tra theo bảng ủ (tuổi thịt lúc nhận → số ngày ủ). Món khác không đổi gì.
 * Cuối cùng: kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — THEO DÕI THEO TẢNG · BẢNG Ủ');
const { db, cnA, cnB, duoi } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;

const MH = {};
let vtA, vtB, ncc;

function luuKg(uid, t) {
  return duoi(uid, `
    select * from kho_luu_phieu_nhap_kg(
      p_id => $1, p_chi_nhanh_id => $2, p_ma_gui => $3, p_phien_ban => $4,
      p_loai => 'mua', p_nha_cung_cap_id => $5, p_vi_tri_id => $6, p_ngay_nhap => $7::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_ghi_chu => null,
      p_anh_them => $8::text[], p_truong_them => '{}'::jsonb, p_dong => $9::jsonb)`,
    [t.id ?? null, t.cn ?? cnA.id, maGui(), t.phienBan ?? null, ncc, t.viTri ?? vtA,
     t.ngay ?? homNay, [`${t.cn ?? cnA.id}/nhap/${maGui()}/1.jpg`], JSON.stringify(t.dong)]);
}

/** Thủ kho lưu → kế toán điền giá → gửi duyệt → kế toán duyệt. Trả phiếu id. */
async function nhanVaDuyet(t) {
  const tk = t.cn === cnB.id ? UID.thuKhoB : UID.thuKhoA;
  const kt = t.cn === cnB.id ? UID.qlB : UID.keToanA;
  const l = await luuKg(tk, t);
  if (l.loi) throw new Error(l.loi);
  const id = l.rows[0].phieu_id;
  const dong = (await db.query(`select id from kho_phieu_nhap_dong where phieu_nhap_id = $1 order by thu_tu`, [id])).rows;
  const pb = (await db.query(`select phien_ban from kho_phieu_nhap where id = $1`, [id])).rows[0].phien_ban;
  const g = await duoi(kt, `select kho_dien_gia_phieu_nhap(p_id => $1, p_phien_ban => $2, p_so_hoa_don => null,
      p_ngay_hoa_don => null, p_han_thanh_toan => null, p_tien_thue => 0, p_chi_phi_khac => 0, p_gia => $3::jsonb) as pb`,
    [id, pb, JSON.stringify(dong.map(d => ({ dong_id: d.id, don_gia_kg: 500000 })))]);
  if (g.loi) throw new Error(g.loi);
  const gui = await duoi(tk, `select kho_gui_duyet_phieu_nhap($1, $2)`, [id, g.rows[0].pb]);
  if (gui.loi) throw new Error(gui.loi);
  const d = await duoi(kt, `select kho_duyet_phieu_nhap($1) as cau`, [id]);
  if (d.loi) throw new Error(d.loi);
  return id;
}

const loCuaPhieu = async id => (await db.query(`
  select l.*, d.thu_tu from kho_lo l join kho_phieu_nhap_dong d on d.lo_id = l.id
  where d.phieu_nhap_id = $1 order by d.thu_tu`, [id])).rows;

// ===========================================================================
await nhom('1 · CHUẨN BỊ: BẬT THEO TẢNG, BẢNG Ủ', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vtA = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'kho'`, [cnA.id])).rows[0].id;
  vtB = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'kho'`, [cnB.id])).rows[0].id;
  ncc = (await duoi(UID.keToanA, `insert into kho_nha_cung_cap (ten, so_ngay_no) values ('NCC Úc', 15) returning id`)).rows[0].id;

  const tkBat = await duoi(UID.thuKhoA, `update kho_mat_hang set theo_tang = true where ma = 'T-THANLUNG' returning id`);
  ok('Thủ kho không bật được "theo tảng" (quyền danh mục)', (tkBat.rows ?? []).length === 0);
  const bat = await duoi(UID.qlA, `update kho_mat_hang set theo_tang = true where ma in ('T-THANLUNG', 'T-THANNGOAI') returning id`);
  ok('Quản lý bật "theo tảng" cho Thăn lưng, Thăn ngoại', bat.loi === null && bat.rows.length === 2, bat.loi ?? '');
  const sai = await duoi(UID.qlA, `update kho_mat_hang set theo_tang = true where ma = 'C-THANNGOAI'`);
  ok('Món phần cắt không bật được "theo tảng"', /theo_tang_hop_le/.test(sai.loi ?? ''), sai.loi ?? '');

  const bang = await duoi(UID.qlA, `insert into kho_bang_u (mat_hang_id, tuoi_den_ngay, so_ngay_u) values
      ($1, 5, 18), ($1, 10, 14), ($1, null, 10)`, [MH['T-THANLUNG'].id]);
  ok('Quản lý nhập bảng ủ Thăn lưng (≤5 → 18, ≤10 → 14, còn lại → 10)', bang.loi === null, bang.loi ?? '');
  const tkBang = await duoi(UID.thuKhoA, `insert into kho_bang_u (mat_hang_id, so_ngay_u) values ($1, 3)`, [MH['T-THANNGOAI'].id]);
  ok('Thủ kho không sửa được bảng ủ', tkBang.loi !== null);
  const trung = await duoi(UID.qlA, `insert into kho_bang_u (mat_hang_id, tuoi_den_ngay, so_ngay_u) values ($1, null, 9)`, [MH['T-THANLUNG'].id]);
  ok('Bảng ủ chỉ có một dòng "còn lại"', trung.loi !== null);
  const noiBo = await duoi(UID.qlA, `select kho_so_ngay_u($1, 3)`, [MH['T-THANLUNG'].id]);
  ok('kho_so_ngay_u là hàm nội bộ', /permission denied/.test(noiBo.loi ?? ''), noiBo.loi ?? '');
  const tra = async tuoi => (await db.query(`select kho_so_ngay_u($1, $2) as n`, [MH['T-THANLUNG'].id, tuoi])).rows[0].n;
  ok('Tra bảng ủ ở các mốc: 0→18, 5→18, 6→14, 10→14, 11→10, 40→10',
     [await tra(0), await tra(5), await tra(6), await tra(10), await tra(11), await tra(40)].join() === '18,18,14,14,10,10');
  ok('Món chưa có bảng ủ → null', (await db.query(`select kho_so_ngay_u($1, 3) as n`, [MH['T-THANNGOAI'].id])).rows[0].n === null);
});

// ===========================================================================
await nhom('2 · NHẬN HÀNG: MỖI DÒNG MỘT TẢNG, CÓ NGÀY MỔ', async () => {
  const tl = MH['T-THANLUNG'].id;
  const thieu = await luuKg(UID.thuKhoA, { dong: [{ mat_hang_id: tl, so_goi: 1, so_kg: 6.2 }] });
  ok('Thiếu ngày mổ → báo', /chưa nhập ngày mổ/.test(thieu.loi ?? ''), thieu.loi ?? '');
  const gop = await luuKg(UID.thuKhoA, { dong: [{ mat_hang_id: tl, so_goi: 3, so_kg: 18, ngay_mo: await ngay(-5) }] });
  ok('Gộp 3 tảng một dòng → báo cân riêng từng tảng', /mỗi tảng một dòng/.test(gop.loi ?? ''), gop.loi ?? '');
  const tuongLai = await luuKg(UID.thuKhoA, { dong: [{ mat_hang_id: tl, so_kg: 6, ngay_mo: await ngay(1) }] });
  ok('Ngày mổ sau ngày nhận → báo', /không được sau ngày nhận/.test(tuongLai.loi ?? ''), tuongLai.loi ?? '');
  const hong = await luuKg(UID.thuKhoA, { dong: [{ mat_hang_id: tl, so_kg: 6, ngay_mo: 'abc' }] });
  ok('Ngày mổ sai dạng → báo', /ngày mổ không hợp lệ/.test(hong.loi ?? ''), hong.loi ?? '');
});

// ===========================================================================
let phieu1;
await nhom('3 · DUYỆT: 3 TẢNG → 3 LÔ, SỐ TẢNG, NGÀY Ủ XONG', async () => {
  const tl = MH['T-THANLUNG'].id;
  phieu1 = await nhanVaDuyet({ dong: [
    { mat_hang_id: tl, so_kg: 6.2, ngay_mo: await ngay(-3) },     // tuổi 3 → ủ 18
    { mat_hang_id: tl, so_kg: 5.9, ngay_mo: await ngay(-8) },     // tuổi 8 → ủ 14
    { mat_hang_id: tl, so_kg: 6.4, ngay_mo: await ngay(-12) },    // tuổi 12 → ủ 10
    { mat_hang_id: MH['T-NACVAI'].id, so_goi: 2, so_kg: 9 },       // món thường
  ] });
  const lo = await loCuaPhieu(phieu1);
  ok('4 dòng → 4 lô', lo.length === 4);
  ok('Ba tảng có số tảng 1, 2, 3', lo.slice(0, 3).map(l => l.so_tang).join() === '1,2,3', lo.map(l => l.so_tang).join());
  ok('Ngày mổ chép sang lô', lo[0].ngay_mo !== null && lo[3].ngay_mo === null);
  const uXong = await Promise.all([18, 14, 10].map(n => ngay(n)));
  const d = x => x && new Date(x).toISOString().slice(0, 10);
  ok('Ngày ủ xong = ngày nhận + 18 / 14 / 10', lo.slice(0, 3).map(l => d(l.ngay_u_xong)).join() === uXong.join(),
     lo.map(l => d(l.ngay_u_xong)).join());
  ok('Món thường: không số tảng, không ngày ủ', lo[3].so_tang === null && lo[3].ngay_u_xong === null);
  const soDong = (await db.query(`select count(*)::int n, sum(so_goi)::int g from kho_phieu_nhap_dong d
      join kho_mat_hang m on m.id = d.mat_hang_id where d.phieu_nhap_id = $1 and m.theo_tang`, [phieu1])).rows[0];
  ok('Mỗi dòng tảng tự đặt 1 tảng', soDong.n === 3 && soDong.g === 3);
  const gia = (await db.query(`select sum(g.gia_tri)::bigint t from kho_lo_gia g join kho_phieu_nhap_dong d on d.lo_id = g.lo_id where d.phieu_nhap_id = $1`, [phieu1])).rows[0].t;
  ok('Tổng giá trị các lô = tiền phiếu', Number(gia) === Math.round((6.2 + 5.9 + 6.4 + 9) * 500000), String(gia));

  const doc = await duoi(UID.thuKhoA, `select kho_doc_phieu_nhap_kg($1) as p`, [phieu1]);
  const dongDoc = doc.rows?.[0].p.dong ?? [];
  ok('Đọc phiếu: dòng có theo_tang, ngay_mo, so_tang', dongDoc[0]?.theo_tang === true && dongDoc[0]?.ngay_mo === (await ngay(-3))
     && dongDoc[2]?.so_tang === 3 && dongDoc[3]?.theo_tang === false, JSON.stringify(dongDoc[0]));

  const pB = await nhanVaDuyet({ cn: cnB.id, viTri: vtB, dong: [{ mat_hang_id: tl, so_kg: 6, ngay_mo: await ngay(-4) }] });
  ok('Chi nhánh B đếm số tảng riêng (bắt đầu từ 1)', (await loCuaPhieu(pB))[0].so_tang === 1);
});

// ===========================================================================
await nhom('4 · kho_v_tang: ĐANG Ủ / SẴN SÀNG / CHƯA CÓ BẢNG', async () => {
  // Nhận 20 ngày trước, tuổi 3 → ủ 18 → xong 2 ngày trước → sẵn sàng.
  await nhanVaDuyet({ ngay: await ngay(-20), dong: [{ mat_hang_id: MH['T-THANLUNG'].id, so_kg: 6.1, ngay_mo: await ngay(-23) }] });
  await nhanVaDuyet({ dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_kg: 7, ngay_mo: await ngay(-2) }] });

  const v = await duoi(UID.nvQuayA, `select * from kho_v_tang where chi_nhanh_id = $1 order by so_tang`, [cnA.id]);
  ok('NV quầy đọc được danh sách tảng', v.loi === null && v.rows.length === 5, v.loi ?? String(v.rows?.length));
  const theo = Object.fromEntries((v.rows ?? []).map(r => [r.so_tang, r]));
  ok('Tảng 1–3: đang ủ, còn 18 / 14 / 10 ngày', [1, 2, 3].map(s => `${theo[s]?.tinh_trang_u}:${theo[s]?.con_ngay_u}`).join()
     === 'dang_u:18,dang_u:14,dang_u:10');
  ok('Tảng 4 (nhận 20 ngày trước): sẵn sàng lóc', theo[4]?.tinh_trang_u === 'san_sang' && theo[4]?.tuoi_ngay === 23);
  ok('Tảng 5 (Thăn ngoại, chưa có bảng ủ): chua_co_bang_u', theo[5]?.tinh_trang_u === 'chua_co_bang_u');
  ok('Không có cột tiền', !Object.keys(v.rows?.[0] ?? {}).some(k => /gia|tien/.test(k)));
  ok('Món thường không vào danh sách tảng', !(v.rows ?? []).some(r => r.ma_hang === 'T-NACVAI'));
  const vB = await duoi(UID.thuKhoB, `select count(*)::int n from kho_v_tang where chi_nhanh_id = $1`, [cnA.id]);
  ok('Chi nhánh B không thấy tảng của A', vB.rows?.[0].n === 0);
});

// ===========================================================================
await nhom('5 · DUYỆT CHẶN DÒNG TẢNG CHƯA TÁCH (VD PHIẾU TỪ ĐƠN ĐẶT)', async () => {
  const l = await luuKg(UID.thuKhoA, { dong: [{ mat_hang_id: MH['T-THANLUNG'].id, so_kg: 6, ngay_mo: await ngay(-2) }] });
  const id = l.rows[0].phieu_id;
  const dongId = (await db.query(`select id from kho_phieu_nhap_dong where phieu_nhap_id = $1`, [id])).rows[0].id;
  // Giả lập dòng sinh từ đơn đặt hàng: 3 tảng một dòng, chưa có ngày mổ.
  await db.query(`update kho_phieu_nhap_dong set so_goi = 3, ngay_mo = null, don_gia_kg = 500000 where id = $1`, [dongId]);
  const pb = (await db.query(`select phien_ban from kho_phieu_nhap where id = $1`, [id])).rows[0].phien_ban;
  await duoi(UID.thuKhoA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [id, pb]);
  const d = await duoi(UID.keToanA, `select kho_duyet_phieu_nhap($1)`, [id]);
  ok('Duyệt bị chặn, câu lỗi chỉ đúng dòng', /Dòng 1 \(Thăn lưng nguyên tảng\).*mỗi tảng một dòng/.test(d.loi ?? ''), d.loi ?? '');
});

await nhom('6 · ĐỐI SOÁT', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('Tồn khớp sổ kho', rows.length === 0, JSON.stringify(rows));
});

process.exit(ketThuc('THEO DÕI THEO TẢNG'));
