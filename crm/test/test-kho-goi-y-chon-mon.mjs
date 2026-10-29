/**
 * BEEFTOWN KHO — Nhóm "Gợi ý" trong ô chọn món: pha lóc, công thức, kiểm kê, phiếu nhập (29/10/2026)
 * ===================================================================================================
 *
 *     node test/test-kho-goi-y-chon-mon.mjs
 *
 * Khánh chốt 29/10/2026 ("làm tiếp các mục còn lại" — mục 4, 6, 7, 8 của bản rà các màn): ô chọn món dùng chung
 * (ChonMatHang) có nhóm "Gợi ý" trên cùng, đúng ngữ cảnh từng màn —
 *   4. Pha lóc bước 2, dòng gõ tay: phần loại tảng này thực tế hay ra (30 ngày) rồi phần của công thức;
 *   6. Kiểm kê, "Thấy mặt hàng không có trong danh sách": bỏ món đã có trên phiếu; gợi ý món sổ ghi đang ở chỗ khác;
 *   7. Phiếu nhập soạn tay: món của NCC đang chọn kèm "Lần trước …";
 *   8. Lưới công thức pha lóc: như 4, bỏ món đã có trên lưới.
 *
 * Kiểm: goiYPhanRa, goiYMonNcc, goiYThayMon (vi / en, số kiểu Việt, thứ tự, bỏ trùng), dữ liệu thật qua client giả
 * (thủ kho đọc tỷ lệ thực tế, quản lý đọc danh mục NCC – món, NV quầy đọc tồn), mã nguồn component và bốn trang;
 * kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, taoClientPg, UID, maGui } from './kho-chung.mjs';
import { docGoiYThucTe, goiYPhanRa } from '../../web/src/lib/kho/cong-thuc.ts';
import { docNccMon, goiYMonNcc } from '../../web/src/lib/kho/ncc-mat-hang.ts';
import { docTonChoKhac, goiYThayMon } from '../../web/src/lib/kho/kiem-ke.ts';
import { docTon } from '../../web/src/lib/kho/ton.ts';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — NHÓM "GỢI Ý" TRONG Ô CHỌN MÓN');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
const clientCua = await taoClientPg({ db, duoi, duoiAnon });

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngaySau = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
const ngayNgan = iso => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const MH = {};
let vt = {};
let ncc;

async function nhap(loai, dong, viTri) {
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => $3, p_nha_cung_cap_id => $4, p_vi_tri_id => $5, p_ngay_nhap => $6::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null,
      p_anh => case when $3 = 'mua' then array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'] else '{}'::text[] end,
      p_truong_them => '{}'::jsonb, p_dong => $7::jsonb)`,
    [cnA.id, maGui(), loai, loai === 'mua' ? ncc : null, viTri, homNay, JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  for (const [sql, ts] of [[`select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]],
                           [`select kho_duyet_phieu_nhap($1)`, [p.phieu_id]]]) {
    const r = await duoi(UID.qlA, sql, ts);
    if (r.loi) throw new Error(r.loi);
  }
  return (await db.query(`select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1 order by d.thu_tu`, [p.phieu_id])).rows;
}

/** Pha lóc một lô tảng (lấy hết ở kho) hôm nay rồi chốt. */
async function phaLoc(lo, ra) {
  const luu = await duoi(UID.thuKhoA, `
    select * from kho_luu_phien_pha(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_mat_hang_vao_id => $3, p_cong_thuc_id => null, p_ngay_pha => $4::date,
      p_ghi_chu => null, p_vao => $5::jsonb, p_ra => $6::jsonb)`,
    [cnA.id, maGui(), MH['T-THANNGOAI'].id, homNay, JSON.stringify([{ lo_id: lo.id, vi_tri_id: vt.kho }]), JSON.stringify(ra)]);
  if (luu.loi) throw new Error(luu.loi);
  const id = luu.rows[0].phien_id;
  const pb = (await db.query(`select phien_ban from kho_phien_pha where id = $1`, [id])).rows[0].phien_ban;
  const c = await duoi(UID.thuKhoA, `select kho_chot_phien_pha($1, $2)`, [id, pb]);
  if (c.loi) throw new Error(c.loi);
  return id;
}

// ===========================================================================
await nhom('0 · DỰNG DỮ LIỆU', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vt = Object.fromEntries((await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows
    .map(r => [r.loai, r.id]));
  ncc = (await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC Bò Úc') returning id`)).rows[0].id;
  // Công thức thăn ngoại: thăn cắt lát 72%, mỡ 14%, nạc vai 5% (nạc vai chưa ra lần nào — chỉ ở công thức).
  const ct = (await duoi(UID.qlA, `insert into kho_cong_thuc_pha (mat_hang_vao_id, ten) values ($1, 'Thăn chuẩn') returning id`,
    [MH['T-THANNGOAI'].id])).rows[0].id;
  for (const [i, [ma, tl]] of [['C-THANNGOAI', 72], ['P-MO', 14], ['C-NACVAI', 5]].entries()) {
    await duoi(UID.qlA, `insert into kho_cong_thuc_pha_dong (cong_thuc_id, mat_hang_ra_id, ty_le_du_kien, thu_tu) values ($1, $2, $3, $4)`,
      [ct, MH[ma].id, tl, i + 1]);
  }
  // Hai tảng thăn ngoại (tồn đầu): một đem pha (10 kg → 7 kg cắt lát, 1 kg vụn, 1,5 kg mỡ bỏ), một để lại kho lạnh.
  const [tang1] = await nhap('ton_dau', [
    { mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 10, don_gia_kg: 500000, han_dung: await ngaySau(20) },
    { mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 9, don_gia_kg: 500000, han_dung: await ngaySau(20) },
  ], vt.kho);
  await phaLoc(tang1, [
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 10, so_kg: 7, xu_ly: 'nhap_kho', vi_tri_id: vt.kho },
    { mat_hang_id: MH['P-VUN'].id, so_kg: 1, xu_ly: 'nhap_kho', vi_tri_id: vt.kho },
    { mat_hang_id: MH['P-MO'].id, so_kg: 1.5, xu_ly: 'bo' },
  ]);
  // Phiếu mua của NCC Bò Úc: nạc vai 2 kg (4 gói).
  await nhap('mua', [{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 4, so_kg: 2, don_gia_kg: 400000, han_dung: await ngaySau(3) }], vt.kho);
  ok('Có phiên pha thăn ngoại đã chốt, công thức, phiếu mua của NCC', !!ct && !!ncc);
});

// ===========================================================================
await nhom('1 · PHA LÓC, CÔNG THỨC: "PHẦN TẢNG NÀY HAY RA"', async () => {
  const tyLe = new Map([['a', 10], ['b', 72.5], ['c', 3]]);
  const dong = [{ mat_hang_ra_id: 'd', ty_le_du_kien: 5 }, { mat_hang_ra_id: 'b', ty_le_du_kien: 70 },
    { mat_hang_ra_id: 'e', ty_le_du_kien: null }, { mat_hang_ra_id: 'f', ty_le_du_kien: 12 }, { mat_hang_ra_id: 'd', ty_le_du_kien: 5 }];
  const g = goiYPhanRa(tyLe, dong);
  ok('Thực tế trước (cao trước), rồi phần chỉ ở công thức THEO THỨ TỰ TRUYỀN VÀO, mỗi món một lần',
    g.map(x => x.id).join() === 'b,a,c,d,e,f', g.map(x => x.id).join());
  ok('Chữ phụ kiểu Việt: "thực tế 72,5%", "công thức 5,0%"; không tỷ lệ thì không chữ',
    g[0].chu === 'thực tế 72,5%' && g[3].chu === 'công thức 5,0%' && g[4].chu === null && g[5].chu === 'công thức 12,0%', JSON.stringify(g));
  const en = goiYPhanRa(tyLe, dong, 'en');
  ok('Tiếng Anh: "actual 72.5%", "recipe 12.0%"', en[0].chu === 'actual 72.5%' && en[5].chu === 'recipe 12.0%', JSON.stringify(en));
  ok('`bo` (tảng đầu vào, món đã có trên lưới) không gợi ý', !goiYPhanRa(tyLe, dong, 'vi', new Set(['b', 'd'])).some(x => x.id === 'b' || x.id === 'd'));
  // Pha lóc: công thức đang chọn (A) truyền trước công thức khác (B) — món có ở cả hai lấy tỷ lệ của A, đứng theo A.
  const ab = goiYPhanRa(new Map(), [{ mat_hang_ra_id: 'vai', ty_le_du_kien: 5 }, { mat_hang_ra_id: 'gau', ty_le_du_kien: 20 },
    { mat_hang_ra_id: 'vai', ty_le_du_kien: 12 }]);
  ok('Công thức đang chọn trước: món có ở hai công thức lấy tỷ lệ của công thức đang chọn (5%, không 12%)',
    ab.map(x => x.id).join() === 'vai,gau' && ab[0].chu === 'công thức 5,0%', JSON.stringify(ab));
  const uu = goiYPhanRa(tyLe, dong, 'vi', new Set(), id => id === 'c' || id === 'e');
  ok('`truoc` (pha lóc: phụ phẩm, món mặc định bỏ) lên đầu, giữ thứ tự trong từng phần',
    uu.map(x => x.id).join() === 'c,e,b,a,d,f', uu.map(x => x.id).join());

  // Dữ liệu thật: thủ kho (vai pha lóc) đọc được tỷ lệ thực tế của loại tảng.
  const thuc = await docGoiYThucTe(clientCua(UID.thuKhoA), cnA.id, MH['T-THANNGOAI'].id, homNay);
  ok('Thủ kho đọc tỷ lệ thực tế 30 ngày: 1 phiên, cắt lát 70%, mỡ 15%, vụn 10%',
    !thuc.loi && thuc.soPhien === 1 && thuc.tyLe.get(MH['C-THANNGOAI'].id) === 70 && thuc.tyLe.get(MH['P-MO'].id) === 15
      && thuc.tyLe.get(MH['P-VUN'].id) === 10, JSON.stringify({ ...thuc, tyLe: [...thuc.tyLe] }));
  const ct = (await db.query(`select d.mat_hang_ra_id, d.ty_le_du_kien::float8 as ty_le_du_kien from kho_cong_thuc_pha_dong d
    join kho_cong_thuc_pha c on c.id = d.cong_thuc_id where c.mat_hang_vao_id = $1 order by d.thu_tu`, [MH['T-THANNGOAI'].id])).rows;
  const goi = goiYPhanRa(thuc.tyLe, ct, 'vi', new Set([MH['T-THANNGOAI'].id]));
  const ma = goi.map(x => Object.values(MH).find(m => m.id === x.id)?.ma);
  ok('Gợi ý công thức thăn ngoại: cắt lát, mỡ, vụn (thực tế), rồi nạc vai (chỉ ở công thức)',
    ma.join() === 'C-THANNGOAI,P-MO,P-VUN,C-NACVAI', ma.join());
  // Dòng gõ tay pha lóc là cho phụ phẩm, mỡ bỏ (không nhãn): chúng lên đầu; món đã quét nhãn (cắt lát) không gợi ý.
  const tenMh = new Map(Object.values(MH).map(m => [m.id, m]));
  const pl = goiYPhanRa(thuc.tyLe, ct, 'vi', new Set([MH['T-THANNGOAI'].id, MH['C-THANNGOAI'].id]),
    id => { const m = tenMh.get(id); return !!m && (m.loai === 'phu_pham' || m.xu_ly_mac_dinh === 'bo'); });
  const maPl = pl.map(x => tenMh.get(x.id)?.ma);
  ok('Pha lóc dòng gõ tay: mỡ, vụn (phụ phẩm) trước, nạc vai sau; cắt lát đã quét không gợi ý',
    maPl.join() === 'P-MO,P-VUN,C-NACVAI', maPl.join());
  ok('Nạc vai: "công thức 5,0%"; cắt lát: "thực tế 70,0%"', goi[3].chu === 'công thức 5,0%' && goi[0].chu === 'thực tế 70,0%', JSON.stringify(goi));
  const khac = await docGoiYThucTe(clientCua(UID.thuKhoB), cnA.id, MH['T-THANNGOAI'].id, homNay);
  ok('Thủ kho chi nhánh B KHÔNG đọc được phiên pha của A (0 phiên)', khac.soPhien === 0 || !!khac.loi, JSON.stringify(khac.soPhien));
  const anon = await docGoiYThucTe(clientCua('anon'), cnA.id, MH['T-THANNGOAI'].id, homNay);
  ok('anon KHÔNG đọc được (0 phiên hoặc lỗi)', anon.soPhien === 0 || !!anon.loi);
});

// ===========================================================================
await nhom('2 · PHIẾU NHẬP: MÓN CỦA NHÀ CUNG CẤP ĐANG CHỌN', async () => {
  const ds = await docNccMon(clientCua(UID.qlA), cnA.id, { ncc });
  const mon = new Map(Object.values(MH).map(m => [m.id, m]));
  const g = goiYMonNcc(ds, ncc, mon);
  ok('Món NCC Bò Úc bán: nạc vai, "Lần trước 2 kg · <ngày>" (không tiền)',
    g.length === 1 && g[0].id === MH['C-NACVAI'].id && g[0].chu === `Lần trước 2 kg · ${ngayNgan(homNay)}`, JSON.stringify(g));
  ok('Tiếng Anh: "Last time 2 kg · …"', goiYMonNcc(ds, ncc, mon, 'en')[0]?.chu === `Last time 2 kg · ${ngayNgan(homNay)}`);
  const tay = [{ nha_cung_cap_id: 'n', mat_hang_id: 'x', la_chinh: true, da_bo: false, them_tay: true, da_giao: false,
    so_lan: 0, lan_cuoi: null, kg_lan_cuoi: null, goi_lan_cuoi: null },
  { nha_cung_cap_id: 'n', mat_hang_id: 'y', la_chinh: false, da_bo: false, them_tay: true, da_giao: false,
    so_lan: 0, lan_cuoi: null, kg_lan_cuoi: null, goi_lan_cuoi: null },
  { nha_cung_cap_id: 'n', mat_hang_id: 'z', la_chinh: false, da_bo: true, them_tay: false, da_giao: true,
    so_lan: 2, lan_cuoi: homNay, kg_lan_cuoi: 3, goi_lan_cuoi: null }];
  const g2 = goiYMonNcc(tay, 'n', new Map());
  ok('Chưa giao: NCC chính ghi "NCC chính", món khác không chữ; món đã bỏ tay không gợi ý',
    g2.map(x => `${x.id}:${x.chu}`).join() === 'x:NCC chính,y:null', JSON.stringify(g2));
  ok('Chưa chọn NCC → không gợi ý', goiYMonNcc(ds, '', mon).length === 0);
  let loi = null;
  try { await docNccMon(clientCua(UID.nvQuayA), cnA.id, { ncc }); } catch (e) { loi = e; }
  ok('NV quầy KHÔNG đọc được danh mục NCC – món (trang nhập chỉ mất nhóm gợi ý)', !!loi);
});

// ===========================================================================
await nhom('3 · KIỂM KÊ: "SỔ GHI ĐANG Ở CHỖ KHÁC"', async () => {
  const ton = await docTon(clientCua(UID.nvQuayA), cnA.id);
  const tenKho = (await db.query(`select ten from kho_vi_tri where id = $1`, [vt.kho])).rows[0].ten;
  const quay = goiYThayMon(ton, { id: vt.quay, loai: 'quay' }, new Set([MH['C-NACVAI'].id]));
  const ma = quay.map(x => Object.values(MH).find(m => m.id === x.id)?.ma);
  ok('Kiểm quầy: gợi ý phần cắt / phụ phẩm ở kho lạnh, KHÔNG tảng, KHÔNG món đã có trên phiếu',
    ma.includes('C-THANNGOAI') && ma.includes('P-VUN') && !ma.includes('T-THANNGOAI') && !ma.includes('C-NACVAI'), ma.join());
  ok(`Chữ phụ "đang ở ${tenKho}"`, quay.every(x => x.chu === `đang ở ${tenKho}`), JSON.stringify(quay));
  ok('Xếp theo tên (tiếng Việt)', quay.map(x => x.id).join() === [...quay].sort((a, b) =>
    Object.values(MH).find(m => m.id === a.id).ten.localeCompare(Object.values(MH).find(m => m.id === b.id).ten, 'vi')).map(x => x.id).join());
  const kho = goiYThayMon(ton, { id: vt.kho, loai: 'kho' }, new Set());
  ok('Kiểm kho lạnh: món sổ ghi còn ở kho lạnh không gợi ý (đã có trên phiếu)', kho.length === 0, JSON.stringify(kho));
  // Đọc gọn cho trang: database bỏ chỗ đang kiểm và hàng chờ hủy, chỉ các cột cần.
  const khac = await docTonChoKhac(clientCua(UID.nvQuayA), cnA.id, vt.quay);
  ok('docTonChoKhac (NV quầy): chỉ dòng ở chỗ khác, không hàng chờ hủy, không cột tiền',
    khac.length > 0 && khac.every(r => r.vi_tri_id !== vt.quay && r.loai_vi_tri !== 'cho_huy')
      && !Object.keys(khac[0]).some(c => /(^|_)(gia|tien)(_|$)/.test(c)), JSON.stringify(khac[0]));
  ok('Gợi ý từ docTonChoKhac giống từ docTon', JSON.stringify(goiYThayMon(khac, { id: vt.quay, loai: 'quay' }, new Set([MH['C-NACVAI'].id])))
    === JSON.stringify(quay));

  const gia = (id, vi, loai = 'kho', loaiHang = 'phan_cat', so_kg = 1) => ({
    mat_hang_id: id, ten_hang: id.toUpperCase(), loai_hang: loaiHang, vi_tri_id: vi, ten_vi_tri: `Chỗ ${vi}`, loai_vi_tri: loai,
    so_kg, so_goi: 0,
  });
  const g = goiYThayMon([gia('a', 'k1'), gia('a', 'k2'), gia('a', 'q2', 'quay'), gia('a', 'k1'), gia('b', 'h', 'cho_huy'),
    gia('c', 'k1', 'kho', 'phan_cat', 0), gia('d', 'q1', 'quay'), gia('d', 'k1'), gia('e', 'k1', 'kho', 'tang')],
    { id: 'q1', loai: 'quay' }, new Set(), 'en');
  ok('Ba chỗ trở lên: hai chỗ đầu rồi "…"; tiếng Anh "at …"; bỏ hàng chờ hủy, dòng hết, món còn ở chỗ đang kiểm, tảng',
    g.length === 1 && g[0].id === 'a' && g[0].chu === 'at Chỗ k1, Chỗ k2…', JSON.stringify(g));
});

// ===========================================================================
await nhom('4 · MÃ NGUỒN: Ô CHỌN MÓN VÀ BỐN TRANG', async () => {
  const c = doc('web/src/components/kho/ChonMatHang.astro');
  ok('ChonMatHang: nhóm gợi ý (optgroup tenGoiY) đứng trước các nhóm loại',
    /\{goiYHien\.length > 0 && \(\s*<optgroup label=\{tenGoiY\}>/.test(c) && c.indexOf('<optgroup label={tenGoiY}>') < c.indexOf('<optgroup label={n.ten}>'));
  ok('ChonMatHang: chỉ một lựa chọn mang selected (món đang chọn nằm ở gợi ý thì nhóm loại không chọn)',
    /selected=\{m\.id === chon && !chonOGoiY\}/.test(c));
  ok('ChonMatHang: món đang chọn luôn hiện (kể cả ngoài `loai` / `bo`) — form cũ không tự mất món',
    /m\.id === chon\s*\|\| \(m\.dang_dung && \(!loai \|\| loai\.includes\(m\.loai\)\) && !bo\?\.has\(m\.id\)\)/.test(c));
  ok('ChonMatHang: lựa chọn gợi ý giữ data-cai / data-thung như nhóm loại (CSS :has() của form)',
    (c.match(/data-cai=\{m\.dem_theo_cai \? '' : undefined\}/g) ?? []).length === 2
      && (c.match(/data-thung=\{m\.dem_theo_cai && m\.so_trong_thung \? String\(m\.so_trong_thung\) : undefined\}/g) ?? []).length === 2);
  const pl = doc('web/src/pages/noi-bo/kho/pha-loc/[id].astro');
  ok('Pha lóc: tỷ lệ thực tế đọc sớm (song song), lỗi chỉ mất gợi ý; chỉ bước cân & quét; công thức đang chọn trước',
    /const huaThucTe = phien && soanDuoc && q\.get\('buoc'\) !== 'ket-qua'/.test(pl) && /\.catch\(\(\) => null\) : Promise\.resolve\(null\)/.test(pl)
      && /const goiYRa = buoc === 'can_quet' && phien/.test(pl)
      && /\[\.\.\.\(ctChon\?\.dong \?\? \[\]\), \.\.\.ctCuaTang\.filter\(c => c !== ctChon\)/.test(pl) && /goiY=\{goiYRa\} tenGoiY=\{t\.goiYPhanRa\}/.test(pl));
  ok('Pha lóc: bỏ tảng đầu vào và món đã quét nhãn; phụ phẩm, món mặc định bỏ lên đầu',
    /new Set\(\[phien\.mat_hang_vao_id, \.\.\.mon\.map\(m => m\.mat_hang_id\)\]\)/.test(pl)
      && /m\.loai === 'phu_pham' \|\| m\.xu_ly_mac_dinh === 'bo'/.test(pl));
  const ct = doc('web/src/pages/noi-bo/kho/cai-dat/cong-thuc.astro');
  ok('Công thức: gợi ý bỏ món đã có trên lưới (dòng không tích Bỏ); cột Gợi ý vẫn chỉ khi ?goi_y=1',
    /luoiDung\.filter\(d => !d\.bo && d\.mh\)/.test(ct) && /const goiY = muonGoiY \? thucTe : null;/.test(ct) && /goiY=\{goiYMon\}/.test(ct));
  const nh = doc('web/src/pages/noi-bo/kho/nhap/[id].astro');
  ok('Phiếu nhập: chỉ phiếu mua đang soạn có NCC; đọc danh mục lỗi thì chỉ mất gợi ý',
    /loai === 'mua' && soanDuoc \? ncc\.find/.test(nh) && /docNccMon\(k\.client, cn\.id, \{ ncc: nccDangChon\.id \}\)\.catch\(/.test(nh) && /goiY=\{goiYMon\}/.test(nh));
  const kk = doc('web/src/pages/noi-bo/kho/kiem-ke/[id].astro');
  ok('Kiểm kê: ô thêm bỏ món đã có trên phiếu, gợi ý món ở chỗ khác; đọc tồn lỗi chỉ mất gợi ý',
    /bo=\{monTrenPhieu\}/.test(kk) && /goiY=\{goiYThay\}/.test(kk) && /docTonChoKhac\(k\.client, kk\.chi_nhanh_id, kk\.vi_tri_id\)\.catch\(/.test(kk)
      && /kk && demDuoc && !theoLo/.test(kk));
});

const dsTon = (await db.query(`select * from kho_doi_soat_ton()`)).rows;
ok('kho_doi_soat_ton() rỗng', dsTon.length === 0, JSON.stringify(dsTon));

process.exit(ketThuc('GỢI Ý TRONG Ô CHỌN MÓN'));
