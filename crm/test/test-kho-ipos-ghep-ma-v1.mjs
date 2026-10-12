/**
 * BEEFTOWN KHO — Kiểm thử: ghép món iPOS bằng hàm v1 bỏ ô mã như v2 (migration 0071)
 * ==================================================================================
 *
 *     node test/test-kho-ipos-ghep-ma-v1.mjs
 *
 * kho_ipos_gan_ma (0042) vẫn gọi được qua RPC dù web đã dùng kho_ipos_gan_ma_v2 (0042/0051). 0051
 * thêm cột kho_ipos_ma_hang.o_ma_id (món iPOS bán theo một ô của tảng) và dạy v2 "ghép lại = bỏ ô"
 * — nhưng không đụng v1. Nên với một món đang gắn ô:
 *   · v1 ghép lại sang goi_can / bo_qua → vỡ ràng buộc kho_ipos_ma_hang_o_ma_hop_le (23514);
 *   · v1 ghép lại sang MÓN KHÁC → chạy được, nhưng o_ma_id vẫn trỏ ô của món cũ: bán món này trừ
 *     lô của ô cũ (kho_ipos_ghi_dong ưu tiên o_ma_id) chứ không phải món vừa chọn — lệch kho lặng lẽ.
 * 0071 vá v1 đúng như v2: ghép lại bằng hàm này = bỏ ô.
 */

import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — GHÉP MÓN iPOS v1 BỎ Ô MÃ (0071)');
const { db, cnA, duoi } = await dungDatabase();

const vi = r => (r.loi ? `${r.ma}: ${r.loi}` : 'CHẠY ĐƯỢC');
const MH = {};
const O = {};
const dongMa = async ma => (await db.query(`select kieu, mat_hang_id, o_ma_id, don_vi_ban from kho_ipos_ma_hang
                                             where chi_nhanh_id = $1 and ma_ipos = $2`, [cnA.id, ma])).rows[0];

await nhom('1 · CHUẨN BỊ — danh mục mẫu, hai ô mã của thăn ngoại', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  const o = await duoi(UID.qlA, `insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 1, '10011'), ($1, 2, '10012')
                                 returning id, so_o`, [MH['C-THANNGOAI'].id]);
  for (const r of o.rows ?? []) O[r.so_o] = r.id;
  ok('Có hai ô mã', !!O[1] && !!O[2], vi(o));
});

await nhom('2 · v1 ghép lại món đang gắn ô — bỏ ô, không vỡ, không trỏ ô của món cũ', async () => {
  for (const [kieu, mh, ten] of [
    ['goi_can', null, 'gói cân'],
    ['bo_qua', null, 'bỏ qua (món chế biến)'],
    ['mon', 'P-VUN', 'MÓN KHÁC (vụn)'],
  ]) {
    const ma = `O1-${kieu}`;
    const gan = await duoi(UID.qlA, `select kho_ipos_gan_o_ma($1, $2, $3, 'kg')`, [cnA.id, ma, O[1]]);
    ok(`Tiền đề: món ${ma} gắn ô 1`, gan.loi === null && (await dongMa(ma))?.o_ma_id === O[1], vi(gan));
    const r = await duoi(UID.qlA, `select kho_ipos_gan_ma($1, $2, $3, $4) as v`, [cnA.id, ma, kieu, mh ? MH[mh].id : null]);
    const d = await dongMa(ma);
    ok(`v1 ghép lại sang ${ten} → chạy được, bỏ ô (o_ma_id null)`,
       r.loi === null && d?.kieu === kieu && d.o_ma_id === null && d.mat_hang_id === (mh && kieu !== 'bo_qua' ? MH[mh].id : null),
       r.loi ? vi(r) : JSON.stringify(d));
  }

  // v1 cùng món, cùng kiểu: vẫn bỏ ô — đúng câu "ghép lại bằng hàm này = bỏ ô" của v2.
  await duoi(UID.qlA, `select kho_ipos_gan_o_ma($1, 'O2-CUNG', $2, 'kg')`, [cnA.id, O[2]]);
  const cung = await duoi(UID.qlA, `select kho_ipos_gan_ma($1, 'O2-CUNG', 'mon', $2) as v`, [cnA.id, MH['C-THANNGOAI'].id]);
  ok('v1 ghép lại đúng món của ô → bỏ ô như v2', cung.loi === null && (await dongMa('O2-CUNG')).o_ma_id === null, vi(cung));

  // v2 vẫn như cũ (đối chiếu).
  await duoi(UID.qlA, `select kho_ipos_gan_o_ma($1, 'O2-V2', $2, 'kg')`, [cnA.id, O[2]]);
  const v2 = await duoi(UID.qlA, `select kho_ipos_gan_ma_v2($1, 'O2-V2', 'bo_qua', null, null, null)`, [cnA.id]);
  ok('v2 ghép lại sang bỏ qua → bỏ ô (như 0051)', v2.loi === null && (await dongMa('O2-V2')).o_ma_id === null, vi(v2));

  // Món chưa gắn ô: v1 giữ hành vi 0042 — giữ kiểu thì giữ "bán theo" đã chọn ở v2.
  await duoi(UID.qlA, `select kho_ipos_gan_ma_v2($1, 'GOI-THUONG', 'mon', $2, 'goi', 0.5)`, [cnA.id, MH['C-THANNGOAI'].id]);
  const giu = await duoi(UID.qlA, `select kho_ipos_gan_ma($1, 'GOI-THUONG', 'mon', $2) as v`, [cnA.id, MH['C-THANNGOAI'].id]);
  const g = await dongMa('GOI-THUONG');
  ok('Món không gắn ô, v1 giữ kiểu → vẫn giữ bán theo gói 0,5 kg (hành vi 0042)',
     giu.loi === null && g.don_vi_ban === 'goi' && g.o_ma_id === null, giu.loi ? vi(giu) : JSON.stringify(g));

  const tk = await duoi(UID.thuKhoA, `select kho_ipos_gan_ma($1, 'O1-mon', 'bo_qua', null)`, [cnA.id]);
  ok('Thủ kho vẫn bị từ chối (danh_muc)', tk.loi !== null && /không ghép được món iPOS/.test(tk.loi), vi(tk));
});

await nhom('3 · SỔ KHO', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('kho_doi_soat_ton() rỗng', rows.length === 0, JSON.stringify(rows.slice(0, 3)));
});

process.exit(ketThuc('GHÉP MÓN iPOS v1'));
