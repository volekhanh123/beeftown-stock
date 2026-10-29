/**
 * BEEFTOWN KHO — Trả hàng nhà cung cấp: chọn nhà cung cấp trước (0112, 29/10/2026)
 * ===============================================================================
 *
 *     node test/test-kho-tra-hang-theo-ncc.mjs
 *
 * Khánh chốt 29/10/2026 ("làm tiếp các mục còn lại" — mục 5): màn Trả hàng NCC là bảng mọi lô nhập mua, chỉ tìm bằng
 * chữ. Chọn NCC trước thì chỉ hiện lô của NCC đó. Thủ kho không đọc được phiếu nhập (có tiền, 0031) nên 0112 thêm
 * kho_ncc_cua_lo(chi nhánh): lô của phiếu MUA đã duyệt còn ở kho / quầy → NCC và tên NCC, không tiền.
 *
 * Kiểm: quyền (thủ kho, kế toán được; NV quầy, chi nhánh khác, anon, nghỉ việc, không có nhân sự thì không), đúng lô
 * (không lô tồn đầu, không lô chi nhánh khác, không cột tiền, không số phiếu), trả hết lô thì lô rời danh sách, hủy
 * phiếu trả thì lô về lại; nutNccTraHang / khoaNccLo (vi / en, xếp tên có dấu, "Không rõ" cuối, đếm lô khác nhau);
 * mã nguồn trang; kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, taoClientPg, UID, maGui } from './kho-chung.mjs';
import {
  docNccCuaLo, khoaNccLo, nutNccTraHang, traHangGhiKg, huyTraHangChoTien, NCC_KHONG_RO, TEN_NCC_KHONG_RO,
} from '../../web/src/lib/kho/cong-no.ts';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — TRẢ HÀNG NCC: CHỌN NHÀ CUNG CẤP TRƯỚC (0112)');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
const clientCua = await taoClientPg({ db, duoi, duoiAnon });
const UID_LA = '00000000-0000-4000-8000-0000000000aa';

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngaySau = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
const MH = {};
const vt = {};
const NCC = {};

async function nhap(cn, ql, loai, ncc, viTri, dong) {
  const luu = await duoi(ql, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => $3, p_nha_cung_cap_id => $4, p_vi_tri_id => $5, p_ngay_nhap => $6::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null,
      p_anh => case when $3 = 'mua' then array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'] else '{}'::text[] end,
      p_truong_them => '{}'::jsonb, p_dong => $7::jsonb)`,
    [cn.id, maGui(), loai, ncc, viTri, homNay, JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  for (const [sql, ts] of [[`select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]],
                           [`select kho_duyet_phieu_nhap($1)`, [p.phieu_id]]]) {
    const r = await duoi(ql, sql, ts);
    if (r.loi) throw new Error(r.loi);
  }
  return (await db.query(`select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1 order by d.thu_tu`, [p.phieu_id])).rows;
}
const goi = (uid, cn) => duoi(uid, `select * from kho_ncc_cua_lo($1)`, [cn.id]);

let loNacVai, loThan, loVun, loThanQuay;
// ===========================================================================
await nhom('0 · DỰNG DỮ LIỆU', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  for (const [cn, k] of [[cnA, 'A'], [cnB, 'B']]) {
    for (const r of (await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cn.id])).rows) vt[`${r.loai}${k}`] = r.id;
  }
  for (const ten of ['Đông Á', 'Bò Úc', 'Ánh Dương']) {
    NCC[ten] = (await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ($1) returning id`, [ten])).rows[0].id;
  }
  [loNacVai] = await nhap(cnA, UID.qlA, 'mua', NCC['Bò Úc'], vt.khoA,
    [{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 4, so_kg: 2, don_gia_kg: 400000, han_dung: await ngaySau(3) }]);
  [loThan] = await nhap(cnA, UID.qlA, 'mua', NCC['Đông Á'], vt.khoA,
    [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 6, so_kg: 3, don_gia_kg: 700000, han_dung: await ngaySau(3) }]);
  [loThanQuay] = await nhap(cnA, UID.qlA, 'mua', NCC['Đông Á'], vt.quayA,
    [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 2, so_kg: 1, don_gia_kg: 700000, han_dung: await ngaySau(3) }]);
  [loVun] = await nhap(cnA, UID.qlA, 'ton_dau', null, vt.khoA,
    [{ mat_hang_id: MH['P-VUN'].id, so_kg: 1.5, don_gia_kg: 80000, han_dung: await ngaySau(2) }]);
  await nhap(cnB, UID.qlB, 'mua', NCC['Ánh Dương'], vt.khoB,
    [{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 2, so_kg: 1, don_gia_kg: 400000, han_dung: await ngaySau(3) }]);
  ok('Chi nhánh A: nạc vai (Bò Úc), thăn ở kho + quầy (Đông Á), vụn tồn đầu; chi nhánh B: nạc vai (Ánh Dương)',
    !!loNacVai && !!loThan && !!loThanQuay && !!loVun);
});

// ===========================================================================
await nhom('1 · QUYỀN GỌI kho_ncc_cua_lo', async () => {
  const thuKho = await goi(UID.thuKhoA, cnA);
  ok('Thủ kho A gọi được', thuKho.loi === null, thuKho.loi ?? '');
  const keToan = await goi(UID.keToanA, cnA);
  ok('Kế toán A gọi được (cùng quyền màn trả hàng)', keToan.loi === null && keToan.rows.length === thuKho.rows.length, keToan.loi ?? '');
  const nv = await goi(UID.nvQuayA, cnA);
  ok('NV quầy KHÔNG gọi được (không có quyền nhap / ke_toan)', !!nv.loi && /không được xem hàng trả nhà cung cấp/.test(nv.loi), nv.loi ?? '');
  const khac = await goi(UID.thuKhoA, cnB);
  ok('Thủ kho A KHÔNG xem được chi nhánh B', !!khac.loi, khac.loi ?? '');
  const anon = await duoiAnon(`select * from kho_ncc_cua_lo($1)`, [cnA.id]);
  ok('anon KHÔNG gọi được', !!anon.loi, anon.loi ?? '');
  const nghi = await goi(UID.nghiViec, cnA);
  ok('Nhân sự đã nghỉ KHÔNG gọi được', !!nghi.loi, nghi.loi ?? '');
  const la = await goi(UID_LA, cnA);
  ok('Tài khoản không có dòng nhân sự KHÔNG gọi được', !!la.loi, la.loi ?? '');
  const cot = Object.keys(thuKho.rows[0] ?? {});
  ok('Chỉ ba cột lo_id, nha_cung_cap_id, ten_nha_cung_cap — không tiền, không số phiếu',
    cot.sort().join() === 'lo_id,nha_cung_cap_id,ten_nha_cung_cap', cot.join());
  const ham = (await db.query(`select prosecdef, proconfig from pg_proc where proname = 'kho_ncc_cua_lo'`)).rows[0];
  ok('security definer, có set search_path', ham?.prosecdef === true && (ham.proconfig ?? []).some(c => c.startsWith('search_path=')));
});

// ===========================================================================
await nhom('2 · ĐÚNG LÔ, ĐÚNG NHÀ CUNG CẤP', async () => {
  const ds = await docNccCuaLo(clientCua(UID.thuKhoA), cnA.id);
  ok('Ba lô nhập mua của A (nạc vai, thăn kho, thăn quầy); KHÔNG lô tồn đầu, KHÔNG lô chi nhánh B',
    ds.size === 3 && ds.has(loNacVai.id) && ds.has(loThan.id) && ds.has(loThanQuay.id) && !ds.has(loVun.id), JSON.stringify([...ds]));
  ok('Lô nạc vai → Bò Úc (id và tên)', ds.get(loNacVai.id)?.nha_cung_cap_id === NCC['Bò Úc'] && ds.get(loNacVai.id)?.ten_nha_cung_cap === 'Bò Úc');
  ok('khoaNccLo: lô mua → id NCC; lô tồn đầu → null', khoaNccLo(loThan.id, ds) === NCC['Đông Á'] && khoaNccLo(loVun.id, ds) === null);
  // Đọc từng trang (docTungTrang, PostgREST trả tối đa 1.000 dòng / lần): hàm xếp theo lô nên các trang nối khít.
  const tk = clientCua(UID.thuKhoA);
  const trang = await Promise.all([0, 1, 2].map(i => tk.rpc('kho_ncc_cua_lo', { p_chi_nhanh_id: cnA.id }, { count: 'exact' }).range(i, i)));
  const noi = trang.flatMap(x => x.data.map(r => r.lo_id));
  ok('Đọc từng trang một dòng: tổng 3, ba trang nối khít theo thứ tự lô, không trùng không sót',
    trang.every(x => x.count === 3 && x.data.length === 1) && noi.join() === [...ds.keys()].sort().join()
      && JSON.stringify(noi) === JSON.stringify([...noi].sort()), JSON.stringify(noi));
  const nut = nutNccTraHang([loNacVai.id, loThan.id, loThanQuay.id, loThan.id, loVun.id], ds);
  ok('Nút NCC: Bò Úc (1 lô), Đông Á (2 lô — một lô ở hai nơi đếm một); xếp theo tên có dấu',
    nut.map(n => `${n.ten}:${n.so}`).join() === 'Bò Úc:1,Đông Á:2', JSON.stringify(nut));

  // Trả hết lô nạc vai (2 kg) → lô rời danh sách; hủy phiếu trả → hàng về lại đúng lô, lô hiện lại.
  const f = new FormData();
  f.append('ma_gui', crypto.randomUUID()); f.append('so_dong', '1'); f.append('t0_lo', loNacVai.id);
  f.append('t0_kg', '2'); f.append('t0_goi', '4'); f.append('ghi_chu', 'rách túi');
  const kq = await traHangGhiKg(clientCua(UID.thuKhoA), cnA.id, f, { phieuNhapId: null, viTriId: vt.khoA });
  ok('Thủ kho trả hết lô nạc vai cho Bò Úc', kq.ok && !!kq.id, kq.cau);
  const sau = await docNccCuaLo(clientCua(UID.thuKhoA), cnA.id);
  ok('Trả hết → lô nạc vai rời danh sách; nút Bò Úc không còn',
    !sau.has(loNacVai.id) && !nutNccTraHang([...sau.keys()], sau).some(n => n.id === NCC['Bò Úc']));
  const huy = await huyTraHangChoTien(clientCua(UID.keToanA), kq.id, 'NCC không nhận lại');
  ok('Kế toán hủy phiếu trả (NCC không nhận lại)', huy.ok, huy.cau);
  const lai = await docNccCuaLo(clientCua(UID.thuKhoA), cnA.id);
  ok('Hủy → hàng về lại đúng lô: lô nạc vai hiện lại dưới Bò Úc', lai.get(loNacVai.id)?.nha_cung_cap_id === NCC['Bò Úc']);
});

// ===========================================================================
await nhom('3 · NÚT NHÀ CUNG CẤP (THUẦN)', async () => {
  const gia = new Map([
    ['l1', { nha_cung_cap_id: 'n2', ten_nha_cung_cap: 'Đông Á' }],
    ['l2', { nha_cung_cap_id: null, ten_nha_cung_cap: null }],
    ['l3', { nha_cung_cap_id: 'n1', ten_nha_cung_cap: 'Ánh Dương' }],
    ['l4', { nha_cung_cap_id: 'n3', ten_nha_cung_cap: 'Bò Úc' }],
    ['l5', { nha_cung_cap_id: 'n2', ten_nha_cung_cap: 'Đông Á' }],
  ]);
  const nut = nutNccTraHang(['l1', 'l2', 'l3', 'l4', 'l5', 'l9'], gia);
  ok('Xếp tên tiếng Việt (Ánh Dương, Bò Úc, Đông Á); "Không rõ nhà cung cấp" cuối; lô lạ không tính',
    nut.map(n => `${n.ten}:${n.so}`).join() === 'Ánh Dương:1,Bò Úc:1,Đông Á:2,Không rõ nhà cung cấp:1', JSON.stringify(nut));
  ok('Nút "Không rõ" mang khóa NCC_KHONG_RO và chữ TEN_NCC_KHONG_RO (dùng chung với "Trả cho: …"); khoaNccLo cũng vậy',
    nut[3].id === NCC_KHONG_RO && nut[3].ten === TEN_NCC_KHONG_RO.vi && khoaNccLo('l2', gia) === NCC_KHONG_RO);
  ok('Tiếng Anh: "Supplier not recorded"', nutNccTraHang(['l2'], gia, 'en')[0]?.ten === 'Supplier not recorded');
});

// ===========================================================================
await nhom('4 · MÃ NGUỒN TRANG TRẢ HÀNG', async () => {
  const tr = doc('web/src/pages/noi-bo/kho/cong-no/tra-hang.astro');
  ok('Đọc NCC của lô cùng lượt với tồn; lỗi thì null — không lọc; không chọn NCC thì mọi lô như trước (không bỏ lô nào)',
    /docNccCuaLo\(k\.client, cn\.id\)\.catch\(\(\) => null\)/.test(tr) && /const loMua = ton\.filter\(traDuoc\);/.test(tr));
  const cn = doc('web/src/lib/kho/cong-no.ts');
  const mg = doc('crm/supabase/migrations/0112_kho_tra_hang_theo_ncc.sql');
  ok('docNccCuaLo đọc từng trang (docTungTrang, count exact, range); hàm xếp theo lô',
    /docTungTrang\(\(tu, den\) => client\s*\.rpc\('kho_ncc_cua_lo', \{ p_chi_nhanh_id: chiNhanhId \}, \{ count: 'exact' \}\)\s*\.range\(tu, den\)\)/.test(cn)
      && /order by l\.id;/.test(mg));
  ok('?ncc= cũ (NCC đã hết hàng trả được): báo, hiện mọi lô',
    /const nccCu = !!q\.get\('ncc'\) && !nccChon && !!nccLo;/.test(tr) && /\{nccCu && <div class="nb-bao luu-y" role="status"><p>\{t\.nccHetHang\}/.test(tr));
  ok('?ncc= chỉ nhận NCC có trong hàng nút; lọc đúng khóa',
    /const nccChon = nutNcc\.find\(n => n\.id === q\.get\('ncc'\)\) \?\? null;/.test(tr) && /khoaNccLo\(x\.lo_id, nccLo\) === nccChon\.id/.test(tr));
  ok('Hàng nút hiện khi có từ hai nút hoặc đang lọc (luôn có "Tất cả" để bỏ lọc); ô tìm giữ ?ncc=; tên NCC ở từng lô và bước ghi kg',
    /\{\(nutNcc\.length > 1 \|\| nccChon\) && \(\s*<nav class="kho-dh"/.test(tr) && /<input type="hidden" name="ncc" value=\{nccChon\.id\} \/>/.test(tr)
      && /t\.traCho\(tenNccLo\(loChon\.lo_id\) \|\| TEN_NCC_KHONG_RO\[nn\]\)/.test(tr));
  ok('"← Chọn lô khác" chỉ giữ ?ncc= khi có hàng nút', /nccLo && nutNcc\.length > 1 && khoaNccLo\(loChon\.lo_id, nccLo\)/.test(tr));
});

const dsTon = (await db.query(`select * from kho_doi_soat_ton()`)).rows;
ok('kho_doi_soat_ton() rỗng', dsTon.length === 0, JSON.stringify(dsTon));

process.exit(ketThuc('TRẢ HÀNG NCC THEO NHÀ CUNG CẤP'));
