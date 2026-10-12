/**
 * BEEFTOWN KHO — Kiểm thử hồi quy: số của tảng phải TRỪ dòng đảo ngược (0083)
 * ==========================================================================
 *
 *     node test/test-kho-tang-dao-nguoc.mjs
 *
 * Sổ kho chỉ ghi thêm. Sửa sai = thêm một dòng loai 'dao_nguoc' trỏ về dòng gốc (dao_cua), số
 * ngược dấu: hoá đơn iPOS bị sửa / huỷ / bắn lại với nội dung khác (0037, 0042), phiên lóc mở lại
 * (0033)…
 *
 * Lỗi thấy ngày 11/10/2026 khi soát luồng trên máy chạy thử: trang truy vết tảng #0001 ghi "Đã bán
 * 3,342 kg" trong khi sổ ròng là 2,119 kg; thịt 15,228 ≠ bán 3,342 + huỷ 0,305 + còn 12,806. Ba hàm
 * cộng dòng sổ theo s.loai mà không trừ dòng đảo, nên lần bán đã bị đảo vẫn được tính:
 *   · kho_bao_cao_tang  (0050) — kg_ban, kg_bep, kg_huy (kéo theo ban_pt); ngay_het lấy cả ngày
 *     của dòng đảo (kéo theo so_ngay_ban);
 *   · kho_truy_vet_tang (0050) — từng lô cắt: kg_ban, kg_bep, kg_huy, ngay_ban_cuoi;
 *   · kho_can_o_ma      (0054) — kg_ban, goi_ban, kg_huy, kg_khac.
 * Rà cùng lỗi ở chỗ khác ra thêm một chỗ:
 *   · kho_bao_cao_ban_gio (0054) — "giảm sớm" lấy hạn dùng nhỏ nhất của MỌI dòng sổ bán của dòng
 *     iPOS, kể cả dòng đã bị đảo khi hoá đơn sửa.
 * 0083 sửa cả bốn theo cách các báo cáo khác vẫn làm (0024, 0032, 0037, 0041): dòng đảo xét theo dòng
 * nó đảo — left join kho_so_cai g on g.id = s.dao_cua, coalesce(g.loai, s.loai).
 *
 * Con số mong đợi ở đây so với SỔ RÒNG tính bằng một câu viết khác hẳn (soRong): chỉ cộng dòng còn
 * hiệu lực — bỏ dòng dao_nguoc và bỏ luôn dòng gốc đã bị đảo. Kịch bản:
 *   · tảng A: lóc → ô 1 giữ lô → bán hai hoá đơn theo mã ô (23:50 hôm kia và 00:10 hôm qua, giờ
 *     Việt Nam) → hoá đơn đầu bị sửa mất một dòng → hoá đơn sau bị huỷ → iPOS bắn lại y hệt;
 *     rồi báo huỷ một gói, đảo dòng huỷ;
 *   · tảng B: lóc có thịt vụn chuyển thẳng bếp → mở lại phiên → cân lại → chốt lại;
 *   · tảng C: lóc 3 ngày trước, cả tảng chuyển thẳng bếp → hôm nay mở lại rồi chốt lại (dòng đảo mang
 *     ngày hôm nay, dòng còn hiệu lực mang ngày lóc);
 *   · bán bằng mã giảm giá rồi hoá đơn bị sửa, lần ghi lại rơi vào lô còn hạn xa;
 *   · quyền của bốn hàm không đổi; cuối cùng kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui, UID_MAY_IPOS, themMayIpos } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — HỒI QUY: SỐ CỦA TẢNG TRỪ DÒNG ĐẢO NGƯỢC (0083)');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
await themMayIpos(db, cnA, cnB);
const MAY = UID_MAY_IPOS.mayIposA;
/** Đăng nhập được nhưng không có dòng nhan_su. */
const UID_LA = '00000000-0000-4000-8000-0000000000aa';

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
/** Ngày cách hôm nay (giờ Việt Nam) n ngày — tính một lần ở đầu để cả file dùng cùng một mốc. */
const N = {};
for (const n of [-30, -15, -10, -3, -2, -1, 1, 5, 9]) {
  N[n] = (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
}
/** Mốc chuyển sang trừ kho theo iPOS: trước mọi giờ bán trong file này. */
const TU_LUC = new Date(Date.now() - 5 * 86400000).toISOString();
const POS_ID = '5898';

const MH = {};
let vt = {}, ncc, lyDoHuy;
let tangA, tangB, tangC, phienA, phienB, loO1, O1;

const so = x => Math.round(Number(x) * 1000) / 1000;
const bang = (a, b) => Math.abs(Number(a) - Number(b)) < 5e-7;
const kgChu = x => String(so(x)).replace('.', ',');

async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

// ---- Nhập hàng, phiên lóc ------------------------------------------------------
async function nhapHang(dong, viTri, ngayNhap = homNay) {
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cnA.id, maGui(), ncc, viTri, ngayNhap, JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  const gui = await duoi(UID.qlA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
  if (gui.loi) throw new Error(gui.loi);
  const duyet = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [p.phieu_id]);
  if (duyet.loi) throw new Error(duyet.loi);
  return (await db.query(`select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1 order by d.thu_tu`, [p.phieu_id])).rows;
}

const phienBan = async id => (await db.query(`select phien_ban from kho_phien_pha where id = $1`, [id])).rows[0].phien_ban;
/** Lưu phiên lóc một tảng (lấy hết tảng ở kho lạnh). id null = phiên mới. */
async function luuPhien(id, tangId, ngayPha, ra) {
  const r = await duoi(UID.thuKhoA, `
    select * from kho_luu_phien_pha(
      p_id => $1, p_chi_nhanh_id => $2, p_ma_gui => $3, p_phien_ban => $4,
      p_mat_hang_vao_id => $5, p_cong_thuc_id => null, p_ngay_pha => $6::date,
      p_ghi_chu => null, p_vao => $7::jsonb, p_ra => $8::jsonb)`,
    [id, cnA.id, maGui(), id ? await phienBan(id) : null, MH['T-THANNGOAI'].id, ngayPha,
     JSON.stringify([{ lo_id: tangId, vi_tri_id: vt.kho }]), JSON.stringify(ra)]);
  if (r.loi) throw new Error(r.loi);
  return r.rows[0].phien_id;
}
async function chot(id) {
  const r = await duoi(UID.thuKhoA, `select kho_chot_phien_pha($1, $2) as cau`, [id, await phienBan(id)]);
  if (r.loi) throw new Error(r.loi);
}
/** Lô đang gắn với một dòng ra của phiên (lô của lần chốt hiện tại). */
const loRa = async (phien, ma) => (await db.query(`select lo_id from kho_phien_pha_ra where phien_pha_id = $1 and mat_hang_id = $2`,
  [phien, MH[ma].id])).rows[0]?.lo_id;
/** Mọi lô cắt ra từ một tảng — kể cả lô của lần chốt đã bị mở lại. */
const loCat = async tangId => (await db.query(`select id from kho_lo where tang_goc_id = $1`, [tangId])).rows.map(r => r.id);
const tonKg = async lo => Number((await db.query(`select coalesce(sum(so_kg), 0) as kg from kho_ton where lo_id = any($1::uuid[])`, [lo])).rows[0].kg);
const soDongSo = async () => (await db.query(`select count(*)::int as n from kho_so_cai`)).rows[0].n;

// ---- Hoá đơn iPOS (đã chuẩn hoá như web gửi sau Event 11) ---------------------
/** luc: giờ Việt Nam "YYYY-MM-DDTHH:mm:ss" — ghi rõ +07:00 như lib/kho/ipos.ts. */
const hoaDon = (soHd, luc, dong, huy = false) => ({
  ma_hd: `${POS_ID}:${soHd}`, thoi_diem_ban: `${luc}+07:00`, da_huy: huy, raw: { event_id: 11 },
  dong: dong.map((d, i) => ({ khoa_dong: i, ma_ipos: d.ma, ten_ipos: d.ma, so_luong: d.sl, thanh_tien: d.tien ?? 100000 })),
});
async function gui(hd) {
  const r = await duoi(MAY, `select kho_ipos_nhan_callback($1, $2::jsonb) as kq`, [cnA.id, JSON.stringify(hd)]);
  if (r.loi) throw new Error(r.loi);
  return r.rows[0].kq;
}
const dongHd = async soHd => (await db.query(`select d.* from kho_ipos_dong d join kho_ipos_hoa_don h on h.id = d.hoa_don_id
  where h.chi_nhanh_id = $1 and h.ma_hd = $2 order by d.khoa_dong::int`, [cnA.id, `${POS_ID}:${soHd}`])).rows;

// ---- SỔ RÒNG — câu viết khác hẳn các hàm đang kiểm -----------------------------
/**
 * Chỉ cộng dòng CÒN HIỆU LỰC của các lô: bỏ dòng dao_nguoc và bỏ luôn dòng gốc đã bị đảo (các hàm thì
 * giữ cả hai rồi cho chúng triệt nhau qua coalesce(g.loai, s.loai)). viTri: chỉ tính các loại vị trí đó.
 *   kg_lech: mọi dòng còn hiệu lực không phải lóc ra / bán / bếp / huỷ / chuyển — lệch cân, kiểm kê,
 *   xuất khác, trả nhà cung cấp — GIỮ DẤU (dương = sổ thêm hàng).
 */
async function soRong(lo, viTri = null) {
  const { rows: [r] } = await db.query(`
    select -coalesce(sum(s.so_kg)  filter (where s.loai = 'ban'), 0)      as kg_ban,
           -coalesce(sum(s.so_goi) filter (where s.loai = 'ban'), 0)      as goi_ban,
           -coalesce(sum(s.so_kg)  filter (where s.loai = 'xuat_bep'), 0) as kg_bep,
           -coalesce(sum(s.so_kg)  filter (where s.loai = 'huy'), 0)      as kg_huy,
           -coalesce(sum(s.so_kg)  filter (where s.loai in ('xuat_bep', 'xuat_khac', 'hao_hut', 'kiem_ke')), 0) as kg_khac,
            coalesce(sum(s.so_kg)  filter (where s.loai = 'pha_loc_ra'), 0) as kg_ra,
            coalesce(sum(s.so_kg)  filter (where s.loai not in ('pha_loc_ra', 'ban', 'xuat_bep', 'huy', 'chuyen_di', 'chuyen_den')), 0) as kg_lech,
            (max(s.ngay) filter (where s.loai = 'ban'))::text as ngay_ban_cuoi
    from kho_so_cai s
    join kho_vi_tri v on v.id = s.vi_tri_id
    where s.lo_id = any($1::uuid[])
      and s.loai <> 'dao_nguoc'
      and not exists (select 1 from kho_so_cai r where r.dao_cua = s.id)
      and ($2::text[] is null or v.loai = any($2::text[]))`, [lo, viTri]);
  return {
    kg_ban: Number(r.kg_ban), goi_ban: Number(r.goi_ban), kg_bep: Number(r.kg_bep), kg_huy: Number(r.kg_huy),
    kg_khac: Number(r.kg_khac), kg_ra: Number(r.kg_ra), kg_lech: Number(r.kg_lech), ngay_ban_cuoi: r.ngay_ban_cuoi,
  };
}

// ---- Bốn hàm đang kiểm ---------------------------------------------------------
/** ngay_het_chu: ngày hết dạng chữ YYYY-MM-DD (cột date qua PGlite thành Date — so chữ cho khỏi lệch múi giờ). */
const baoCaoTang = (uid = UID.qlA) => duoi(uid,
  `select t.*, t.ngay_het::text as ngay_het_chu from kho_bao_cao_tang($1, $2::date, $3::date) t`, [cnA.id, N[-30], homNay]);
const dongTang = async tangId => (await baoCaoTang()).rows?.find(r => r.lo_id === tangId);
const truyVet = async (loId, uid = UID.qlA) => (await duoi(uid, `select kho_truy_vet_tang($1) as kq`, [loId])).rows?.[0]?.kq;
const oMa = async (oMaId, uid = UID.nvQuayA) =>
  ((await duoi(uid, `select kho_can_o_ma($1) as v`, [cnA.id])).rows?.[0]?.v ?? []).find(x => x.o_ma_id === oMaId);
const banGio = (uid = UID.keToanA) => duoi(uid, `select * from kho_bao_cao_ban_gio($1, $2::date, $3::date)`, [cnA.id, N[-3], homNay]);

/** Truy vết: các lô cắt mà bán / bếp / huỷ / ngày bán cuối KHÁC sổ ròng của chính lô đó. Rỗng = đúng hết. */
async function loLechSo(tv) {
  const lech = [];
  for (const l of tv?.lo_ra ?? []) {
    const n = await soRong([l.lo_id]);
    if (!(bang(l.kg_ban, n.kg_ban) && bang(l.kg_bep, n.kg_bep) && bang(l.kg_huy, n.kg_huy)
          && (l.ngay_ban_cuoi ?? null) === (n.ngay_ban_cuoi ?? null))) {
      lech.push(`${l.ma_lo} (${l.ten_hang}): hàm bán ${l.kg_ban} · bếp ${l.kg_bep} · huỷ ${l.kg_huy} · bán cuối ${l.ngay_ban_cuoi}`
        + ` — sổ ròng ${n.kg_ban} · ${n.kg_bep} · ${n.kg_huy} · ${n.ngay_ban_cuoi}`);
    }
  }
  return lech;
}

/**
 * Đẳng thức của một tảng đã lóc hết: kg thịt + phụ phẩm giữ lại = kg bán + kg bếp + kg huỷ + kg còn
 * − lệch cân / kiểm kê của các lô cắt. Vế trái và bán / bếp / huỷ / còn lấy TỪ BÁO CÁO; kg lóc ra còn
 * hiệu lực và phần lệch (có dấu) lấy từ sổ ròng — không gõ tay con số nào.
 */
async function dangThuc(tangId) {
  const r = await dongTang(tangId);
  const n = await soRong(await loCat(tangId));
  const tangCon = await tonKg([tangId]);
  const trai = Number(r?.kg_thit ?? 0) + Number(r?.kg_phu_pham ?? 0);
  const phai = Number(r?.kg_ban) + Number(r?.kg_bep) + Number(r?.kg_huy) + Number(r?.kg_con) - n.kg_lech;
  return {
    dat: !!r && tangCon === 0 && trai > 0 && bang(trai, n.kg_ra) && bang(trai, phai),
    chu: `thịt + phụ phẩm ${kgChu(trai)} · sổ lóc ra ${kgChu(n.kg_ra)} · bán ${kgChu(r?.kg_ban)} + bếp ${kgChu(r?.kg_bep)}`
      + ` + huỷ ${kgChu(r?.kg_huy)} + còn ${kgChu(r?.kg_con)} − lệch ${kgChu(n.kg_lech)} = ${kgChu(phai)} · tảng còn ${kgChu(tangCon)}`,
  };
}

/** Ba hàm cùng nhìn tảng A: dòng báo cáo, truy vết (đầu trang + lô của ô 1), tảng & ô (ô 1). */
async function baHamTangA() {
  const r = await dongTang(tangA.id);
  const tv = await truyVet(tangA.id);
  return { r, tv, lo: tv?.lo_ra?.find(x => x.lo_id === loO1), o: await oMa(O1) };
}

// ===========================================================================
await nhom('1 · CHUẨN BỊ: BA TẢNG THĂN NGOẠI, Ô MÃ, iPOS', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vt = Object.fromEntries((await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  lyDoHuy = (await db.query(`select id from kho_ly_do where loai = 'huy' and ten = 'Khác'`)).rows[0]?.id;
  ncc = (await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC Úc') returning id`)).rows[0].id;
  await duoi(UID.qlA, `update kho_mat_hang set theo_tang = true where ma = 'T-THANNGOAI'`);
  await duoi(UID.qlA, `update kho_mat_hang set gia_ban_kg = 900000 where ma = 'C-THANNGOAI'`);
  // Thăn nội: bán qua cân (có mã cân) để tạo được mã giảm giá; cảnh báo cận date trước 3 ngày (nhóm 7).
  const noi = await duoi(UID.qlA, `update kho_mat_hang set gia_ban_kg = 1200000, ma_can = '10020', canh_bao_truoc_ngay = 3
    where ma = 'C-THANNOI' returning id`);
  const ct = (await duoi(UID.qlA, `insert into kho_cong_thuc_pha (mat_hang_vao_id, ten) values ($1, 'Chuẩn') returning id`,
    [MH['T-THANNGOAI'].id])).rows[0].id;
  await duoi(UID.qlA, `insert into kho_cong_thuc_pha_dong (cong_thuc_id, mat_hang_ra_id, ty_le_du_kien) values ($1, $2, 60)`, [ct, MH['C-THANNGOAI'].id]);
  O1 = (await duoi(UID.qlA, `insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 1, '10011'), ($1, 2, '10012') returning id, so_o`,
    [MH['C-THANNGOAI'].id])).rows.find(r => r.so_o === 1)?.id;

  // Ba tảng nhận 10 ngày trước: 6 kg nhà cung cấp, 5,9 kg sau repack.
  [tangA, tangB, tangC] = await nhapHang([1, 2, 3].map(() =>
    ({ mat_hang_id: MH['T-THANNGOAI'].id, so_kg: 6, so_kg_thuc: 5.9, don_gia_kg: 450000, ngay_mo: N[-15] })), vt.kho, N[-10]);

  const chu = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb) as v`, [cnA.id,
    JSON.stringify({ bat: true, pos_parent: 'BEEFTOWN', pos_id: POS_ID, vi_tri_ban_id: vt.quay })]);
  const cs = await duoi(UID.chu, `select kho_ipos_chuyen_sang($1, $2::timestamptz)`, [cnA.id, TU_LUC]);
  ok('Ba tảng có số tảng đã vào kho lạnh; ô 1 (10011) đã có; quầy trừ kho theo iPOS',
     tangA?.so_tang > 0 && tangB?.so_tang > 0 && tangC?.so_tang > 0 && !!O1 && !!lyDoHuy && noi.loi === null && chu.loi === null && cs.loi === null,
     noi.loi ?? chu.loi ?? cs.loi ?? JSON.stringify({ tangA: tangA?.so_tang, tangB: tangB?.so_tang, tangC: tangC?.so_tang, O1 }));
  await doiSoat('Chuẩn bị');
});

// ===========================================================================
// Giờ bán của tảng A — hai hoá đơn cách nhau 20 phút, vắt qua nửa đêm giờ Việt Nam (cùng một ngày UTC):
const LUC_1 = `${N[-2]}T23:50:00`;   // hoá đơn 201 — ngày sổ = hôm kia
const LUC_2 = `${N[-1]}T00:10:00`;   // hoá đơn 202 — ngày sổ = hôm qua
const HD_201 = [{ ma: '10011', sl: 0.52 }, { ma: '10011', sl: 0.45 }];
const HD_202 = [{ ma: '10011', sl: 1 }];

await nhom('2 · TẢNG A: LÓC, Ô 1 GIỮ LÔ, BÁN HAI HOÁ ĐƠN THEO MÃ Ô — CHƯA CÓ DÒNG ĐẢO NÀO', async () => {
  // 5,9 kg vào → thăn ngoại cắt 4 kg / 8 gói ra quầy · thịt vụn 0,3 kg chuyển thẳng bếp · mỡ 0,5 kg bỏ.
  phienA = await luuPhien(null, tangA.id, N[-3], [
    { mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 4, so_goi: 8, xu_ly: 'nhap_kho', vi_tri_id: vt.quay, han_dung: N[5] },
    { mat_hang_id: MH['P-VUN'].id, so_kg: 0.3, xu_ly: 'chuyen_bep' },
    { mat_hang_id: MH['P-MO'].id, so_kg: 0.5, xu_ly: 'bo' },
  ]);
  const g = await duoi(UID.thuKhoA, `select kho_giao_o_ma($1, null) as kq`, [phienA]);
  if (g.loi) throw new Error(g.loi);
  await chot(phienA);
  loO1 = await loRa(phienA, 'C-THANNGOAI');
  // Ô được giao từ trước giờ bán trong file này.
  await db.query(`update kho_o_ma_giao set tu_luc = now() - interval '4 days'`);
  const giao = (await db.query(`select lo_id from kho_o_ma_giao where o_ma_id = $1 and den_luc is null`, [O1])).rows[0];
  ok('Chốt phiên lóc tảng A: ô 1 gắn lô thăn ngoại cắt (4 kg / 8 gói ở quầy)', !!loO1 && giao?.lo_id === loO1 && await tonKg([loO1]) === 4);

  // Mã món iPOS = mã ô 1 (chưa ghép) → kho tự nhận ô, số lượng là kg; món đếm gói nên trừ gói nguyên,
  // lệch giữa kg bán và kg sổ của gói ghi thành dòng hao_hut: 0,52 → 1 gói (+0,02) · 0,45 → 1 gói (−0,05).
  await gui(hoaDon(201, LUC_1, HD_201));
  await gui(hoaDon(202, LUC_2, HD_202));
  const d = [...await dongHd(201), ...await dongHd(202)];
  ok('Ba dòng bán đều đã trừ kho, đúng ô 1, đúng lô của tảng A, không lệch ô',
     d.length === 3 && d.every(x => x.trang_thai === 'da_ghi' && x.o_ma_id === O1 && x.lo_o_id === loO1 && !x.lech_o),
     JSON.stringify(d.map(x => [x.trang_thai, x.ly_do])));

  const n = await soRong([loO1]);
  const { r, lo, o } = await baHamTangA();
  ok('Sổ ròng lô ô 1: bán 1,97 kg / 4 gói, lần bán cuối là hôm qua (00:10 giờ Việt Nam)',
     n.kg_ban === 1.97 && n.goi_ban === 4 && n.ngay_ban_cuoi === N[-1], JSON.stringify(n));
  ok('Chưa có dòng đảo: báo cáo theo tảng, truy vết, tảng & ô đều bằng sổ ròng',
     bang(r?.kg_ban, n.kg_ban) && bang(lo?.kg_ban, n.kg_ban) && lo?.ngay_ban_cuoi === n.ngay_ban_cuoi
       && bang(o?.kg_ban, n.kg_ban) && Number(o?.goi_ban) === n.goi_ban && bang(o?.kg_khac, 0.03),
     JSON.stringify({ bao_cao: r?.kg_ban, lo: [lo?.kg_ban, lo?.ngay_ban_cuoi], o: [o?.kg_ban, o?.goi_ban, o?.kg_khac] }));
  await doiSoat('Bán theo ô');
});

// ===========================================================================
await nhom('3 · HỒI QUY: HOÁ ĐƠN iPOS BỊ SỬA MẤT MỘT DÒNG', async () => {
  // Thu ngân sửa hoá đơn 201 trên iPOS: bỏ dòng 0,45 kg. Kho đảo cả hoá đơn rồi ghi lại dòng còn lại.
  const kq = await gui(hoaDon(201, LUC_1, [HD_201[0]]));
  const d = await dongHd(201);
  const dao = (await db.query(`select count(*)::int as n from kho_so_cai where loai = 'dao_nguoc' and lo_id = $1`, [loO1])).rows[0].n;
  const n = await soRong([loO1]);
  ok('Kho nhận là hoá đơn sửa: dòng 0,45 kg thành da_huy, bốn dòng sổ bị đảo (2 bán + 2 lệch cân), dòng 0,52 kg ghi lại',
     kq.hd_sua === 1 && d[0]?.trang_thai === 'da_ghi' && d[1]?.trang_thai === 'da_huy' && dao === 4, JSON.stringify({ kq, dao }));
  ok('Sổ ròng lô ô 1 sau khi sửa: bán 1,52 kg / 3 gói, quầy còn 2,5 kg', n.kg_ban === 1.52 && n.goi_ban === 3 && await tonKg([loO1]) === 2.5,
     JSON.stringify(n));

  const { r, tv, lo, o } = await baHamTangA();
  ok('HỒI QUY: báo cáo theo tảng — kg bán của tảng A là số ròng 1,52 kg (không còn cộng cả dòng đã đảo thành 2,49), bán 38% số thịt',
     bang(r?.kg_ban, n.kg_ban) && Number(r?.ban_pt) === 38, `kg_ban ${r?.kg_ban} · ban_pt ${r?.ban_pt} · sổ ròng ${n.kg_ban}`);
  ok('HỒI QUY: truy vết tảng — đầu trang và lô cắt của ô 1 đều bán 1,52 kg',
     bang(tv?.tang?.kg_ban, n.kg_ban) && bang(lo?.kg_ban, n.kg_ban), `đầu trang ${tv?.tang?.kg_ban} · lô ${lo?.kg_ban} · sổ ròng ${n.kg_ban}`);
  ok('HỒI QUY: tảng & ô — ô 1 bán 1,52 kg / 3 gói',
     bang(o?.kg_ban, n.kg_ban) && Number(o?.goi_ban) === n.goi_ban, `kg_ban ${o?.kg_ban} · goi_ban ${o?.goi_ban} · sổ ròng ${n.kg_ban} / ${n.goi_ban}`);
  // Lệch cân còn hiệu lực chỉ là +0,02 kg của dòng 0,52 (sổ thêm 0,02 kg → "khác" −0,02); dòng −0,05 đã bị đảo.
  const nQuay = await soRong([loO1], ['quay', 'kho', 'cho_huy']);
  ok('HỒI QUY: tảng & ô — kg "khác" của ô 1 chỉ còn lệch cân của dòng bán còn hiệu lực (−0,02 kg)',
     bang(o?.kg_khac, nQuay.kg_khac) && nQuay.kg_khac === -0.02, `kg_khac ${o?.kg_khac} · sổ ròng ${nQuay.kg_khac}`);
  const dt = await dangThuc(tangA.id);
  ok('HỒI QUY: đẳng thức tảng A sau khi sửa hoá đơn — thịt + phụ phẩm = bán + bếp + huỷ + còn − lệch cân', dt.dat, dt.chu);
  await doiSoat('Hoá đơn sửa');
});

// ===========================================================================
await nhom('4 · HỒI QUY: HOÁ ĐƠN iPOS BỊ HUỶ · NGÀY BÁN CUỐI · BẮN LẠI Y HỆT', async () => {
  const kq = await gui(hoaDon(202, LUC_2, HD_202, true));
  const [d] = await dongHd(202);
  const n = await soRong([loO1]);
  ok('Kho nhận là hoá đơn huỷ: dòng thành da_huy, sổ ròng lô ô 1 còn bán 0,52 kg / 1 gói, quầy còn 3,5 kg',
     kq.hd_huy === 1 && d?.trang_thai === 'da_huy' && n.kg_ban === 0.52 && n.goi_ban === 1 && await tonKg([loO1]) === 3.5,
     JSON.stringify({ kq, n }));

  const { r, tv, lo, o } = await baHamTangA();
  ok('HỒI QUY: báo cáo theo tảng — sau khi hoá đơn huỷ, tảng A bán 0,52 kg, bằng 13% số thịt',
     bang(r?.kg_ban, n.kg_ban) && Number(r?.ban_pt) === 13, `kg_ban ${r?.kg_ban} · ban_pt ${r?.ban_pt} · sổ ròng ${n.kg_ban}`);
  ok('HỒI QUY: truy vết tảng — đầu trang và lô cắt của ô 1 đều bán 0,52 kg',
     bang(tv?.tang?.kg_ban, n.kg_ban) && bang(lo?.kg_ban, n.kg_ban), `đầu trang ${tv?.tang?.kg_ban} · lô ${lo?.kg_ban} · sổ ròng ${n.kg_ban}`);
  // Lần bán còn hiệu lực duy nhất là 23:50 hôm kia (giờ Việt Nam). Hoá đơn 00:10 hôm qua đã huỷ — hai
  // giờ bán nằm trong cùng một ngày UTC, nên ngày ở đây phải là ngày sổ theo giờ Việt Nam.
  ok('HỒI QUY: truy vết tảng — ngày bán cuối của lô lùi về hôm kia (lần bán 23:50 còn hiệu lực), không phải ngày của hoá đơn đã huỷ',
     n.ngay_ban_cuoi === N[-2] && lo?.ngay_ban_cuoi === N[-2], `hàm ${lo?.ngay_ban_cuoi} · sổ ròng ${n.ngay_ban_cuoi} · hôm kia ${N[-2]}`);
  ok('HỒI QUY: tảng & ô — ô 1 bán 0,52 kg / 1 gói, còn 3,5 kg / 7 gói',
     bang(o?.kg_ban, n.kg_ban) && Number(o?.goi_ban) === n.goi_ban && bang(o?.con_kg, 3.5) && Number(o?.con_goi) === 7,
     `kg_ban ${o?.kg_ban} · goi_ban ${o?.goi_ban} · còn ${o?.con_kg} / ${o?.con_goi}`);
  ok('HỒI QUY: truy vết tảng — mọi lô cắt của tảng A đúng sổ ròng của chính lô đó', (await loLechSo(tv)).length === 0, (await loLechSo(tv)).join(' | '));

  // iPOS Hub bắn lại đúng hai hoá đơn đó (một đã sửa, một đã huỷ): trùng băm → kho không ghi gì thêm.
  const truoc = await soDongSo();
  const lai1 = await gui(hoaDon(201, LUC_1, [HD_201[0]]));
  const lai2 = await gui(hoaDon(202, LUC_2, HD_202, true));
  const sau = await baHamTangA();
  ok('HỒI QUY: iPOS bắn lại y hệt hai hoá đơn → không thêm dòng sổ nào, báo cáo / truy vết / tảng & ô giữ nguyên 0,52 kg',
     lai1.hd_trung === 1 && lai2.hd_trung === 1 && await soDongSo() === truoc
       && bang(sau.r?.kg_ban, 0.52) && bang(sau.lo?.kg_ban, 0.52) && bang(sau.o?.kg_ban, 0.52) && Number(sau.o?.goi_ban) === 1,
     JSON.stringify({ lai1: lai1.hd_trung, lai2: lai2.hd_trung, bao_cao: sau.r?.kg_ban, lo: sau.lo?.kg_ban, o: sau.o?.kg_ban }));
  const dt = await dangThuc(tangA.id);
  ok('HỒI QUY: đẳng thức tảng A sau khi huỷ hoá đơn — thịt + phụ phẩm = bán + bếp + huỷ + còn − lệch cân', dt.dat, dt.chu);
  await doiSoat('Hoá đơn huỷ');
});

// ===========================================================================
await nhom('5 · HỒI QUY: KG HUỶ CŨNG TRỪ DÒNG ĐẢO', async () => {
  const px = await duoi(UID.nvQuayA, `select * from kho_tao_phieu_xuat($1, $2, 'huy', $3, null, $4, 'Rơi khay', $5::text[], $6::jsonb)`,
    [cnA.id, maGui(), vt.quay, lyDoHuy, [`${cnA.id}/huy/${maGui()}.jpg`],
     JSON.stringify([{ mat_hang_id: MH['C-THANNGOAI'].id, lo_id: loO1, so_goi: 1 }])]);
  if (px.loi) throw new Error(px.loi);
  const duyet = await duoi(UID.qlA, `select kho_duyet_phieu_huy($1)`, [px.rows[0].phieu_id]);
  if (duyet.loi) throw new Error(duyet.loi);

  let n = await soRong([loO1]);
  let x = await baHamTangA();
  ok('NV quầy báo huỷ 1 gói của lô ô 1, quản lý duyệt → sổ ròng huỷ 0,5 kg; báo cáo, truy vết, tảng & ô đều 0,5 kg',
     n.kg_huy === 0.5 && bang(x.r?.kg_huy, 0.5) && bang(x.lo?.kg_huy, 0.5) && bang(x.o?.kg_huy, 0.5),
     JSON.stringify({ so: n.kg_huy, bao_cao: x.r?.kg_huy, lo: x.lo?.kg_huy, o: x.o?.kg_huy }));
  // Lô của ô: lóc ra = bán + huỷ + khác + còn (không có dòng nào ở "đang mang ra quầy").
  ok('HỒI QUY: tảng & ô — ô 1: lóc ra 4 kg = bán + huỷ + khác + còn (0,52 + 0,5 − 0,02 + 3)',
     bang(x.o?.kg_ra, 4) && bang(Number(x.o?.kg_ban) + Number(x.o?.kg_huy) + Number(x.o?.kg_khac) + Number(x.o?.con_kg), x.o?.kg_ra),
     JSON.stringify({ ra: x.o?.kg_ra, ban: x.o?.kg_ban, huy: x.o?.kg_huy, khac: x.o?.kg_khac, con: x.o?.con_kg }));
  let dt = await dangThuc(tangA.id);
  ok('HỒI QUY: đẳng thức tảng A khi đủ cả bán, bếp, huỷ, còn, lệch cân (4 + 0,3 = 0,52 + 0,3 + 0,5 + 3 − 0,02)', dt.dat, dt.chu);

  // Hiện chưa hàm nào đảo dòng huỷ; chèn tay một dòng đảo để khoá quy tắc "cột nào cộng theo loại dòng
  // sổ thì cũng trừ dòng đảo của loại đó" — hàm đảo dòng huỷ viết sau này sẽ không làm lại lỗi cũ.
  const dongHuy = (await db.query(`select id from kho_so_cai where chung_tu_loai = 'phieu_xuat' and chung_tu_id = $1 and loai = 'huy'`,
    [px.rows[0].phieu_id])).rows[0];
  await db.query(`
    insert into kho_so_cai (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi, chung_tu_loai, chung_tu_id, dao_cua, ghi_chu)
    select s.chi_nhanh_id, s.lo_id, s.vi_tri_id, s.mat_hang_id, 'dao_nguoc', -s.so_kg, -s.so_goi, s.chung_tu_loai, s.chung_tu_id, s.id,
           'Kiểm thử: đảo dòng huỷ'
    from kho_so_cai s where s.id = $1`, [dongHuy.id]);
  n = await soRong([loO1]);
  x = await baHamTangA();
  ok('HỒI QUY: dòng huỷ bị đảo → báo cáo theo tảng, truy vết, tảng & ô đều về huỷ 0 kg (hàng về lại "Chờ huỷ": còn 3,5 kg)',
     n.kg_huy === 0 && bang(x.r?.kg_huy, 0) && bang(x.tv?.tang?.kg_huy, 0) && bang(x.lo?.kg_huy, 0) && bang(x.o?.kg_huy, 0)
       && bang(x.r?.kg_con, 3.5) && bang(x.o?.con_kg, 3.5),
     JSON.stringify({ so: n.kg_huy, bao_cao: [x.r?.kg_huy, x.r?.kg_con], lo: x.lo?.kg_huy, o: [x.o?.kg_huy, x.o?.con_kg] }));
  dt = await dangThuc(tangA.id);
  ok('HỒI QUY: đẳng thức tảng A sau khi đảo dòng huỷ', dt.dat, dt.chu);
  await doiSoat('Huỷ và đảo dòng huỷ');
});

// ===========================================================================
await nhom('6 · HỒI QUY: PHIÊN LÓC MỞ LẠI — KG XUẤT BẾP KHÔNG BỊ CỘNG ĐÔI', async () => {
  // Tảng B: thăn ngoại cắt 3 kg / 6 gói vào kho lạnh · thịt vụn 1 kg chuyển thẳng bếp · mỡ 0,4 kg bỏ.
  const ra = vun => [
    { mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 3, so_goi: 6, xu_ly: 'nhap_kho', vi_tri_id: vt.kho, han_dung: N[5] },
    { mat_hang_id: MH['P-VUN'].id, so_kg: vun, xu_ly: 'chuyen_bep' },
    { mat_hang_id: MH['P-MO'].id, so_kg: 0.4, xu_ly: 'bo' },
  ];
  phienB = await luuPhien(null, tangB.id, homNay, ra(1));
  await chot(phienB);
  let r = await dongTang(tangB.id);
  let n = await soRong(await loCat(tangB.id));
  ok('Chốt phiên lóc tảng B: thịt vụn 1 kg chuyển thẳng bếp → báo cáo và sổ ròng đều xuất bếp 1 kg',
     n.kg_bep === 1 && bang(r?.kg_bep, 1) && bang(r?.kg_phu_pham, 1), JSON.stringify({ so: n.kg_bep, bao_cao: r?.kg_bep }));

  // Cân nhầm thịt vụn → mở lại: mọi dòng sổ của phiên bị đảo, tảng về lại kho lạnh nguyên 5,9 kg.
  const mo = await duoi(UID.thuKhoA, `select kho_mo_lai_phien_pha($1, 'Cân nhầm thịt vụn') as cau`, [phienB]);
  if (mo.loi) throw new Error(mo.loi);
  r = await dongTang(tangB.id);
  n = await soRong(await loCat(tangB.id));
  let tv = await truyVet(tangB.id);
  ok('Mở lại phiên: sổ ròng các lô cắt về 0, tảng B còn nguyên 5,9 kg ở kho lạnh',
     n.kg_bep === 0 && n.kg_ra === 0 && await tonKg([tangB.id]) === 5.9 && bang(r?.kg_con, 5.9), JSON.stringify({ n, con: r?.kg_con }));
  ok('HỒI QUY: báo cáo theo tảng — mở lại phiên lóc thì kg xuất bếp của tảng B về 0 (không còn 1 kg của dòng đã đảo)',
     bang(r?.kg_bep, n.kg_bep) && bang(tv?.tang?.kg_bep, 0), `bao_cao ${r?.kg_bep} · truy vết ${tv?.tang?.kg_bep} · sổ ròng ${n.kg_bep}`);
  ok('HỒI QUY: truy vết tảng — lô của lần chốt đã mở lại không còn mang kg bếp', (await loLechSo(tv)).length === 0, (await loLechSo(tv)).join(' | '));

  // Cân lại: thịt vụn 1,2 kg. Chốt lại → phiên sinh lô MỚI; lô của lần chốt trước chỉ còn các cặp dòng đã đảo.
  await luuPhien(phienB, tangB.id, homNay, ra(1.2));
  await chot(phienB);
  r = await dongTang(tangB.id);
  n = await soRong(await loCat(tangB.id));
  tv = await truyVet(tangB.id);
  ok('Chốt lại với thịt vụn 1,2 kg: sổ ròng xuất bếp 1,2 kg, lóc ra còn hiệu lực 4,2 kg', n.kg_bep === 1.2 && n.kg_ra === 4.2, JSON.stringify(n));
  ok('HỒI QUY: báo cáo theo tảng — chốt lại thì kg xuất bếp của tảng B là 1,2 kg (không phải 1 + 1,2 = 2,2)',
     bang(r?.kg_bep, n.kg_bep) && bang(tv?.tang?.kg_bep, n.kg_bep), `bao_cao ${r?.kg_bep} · truy vết ${tv?.tang?.kg_bep} · sổ ròng ${n.kg_bep}`);
  const tongBep = (tv?.lo_ra ?? []).reduce((t, l) => t + Number(l.kg_bep), 0);
  ok('HỒI QUY: truy vết tảng — từng lô cắt của tảng B đúng sổ ròng của chính lô đó, cộng lại bếp 1,2 kg',
     (await loLechSo(tv)).length === 0 && bang(tongBep, 1.2), `tổng bếp các lô ${so(tongBep)} · ${(await loLechSo(tv)).join(' | ')}`);
  const dt = await dangThuc(tangB.id);
  ok('HỒI QUY: đẳng thức tảng B sau khi mở lại rồi chốt lại — thịt + phụ phẩm = bán + bếp + huỷ + còn (3 + 1,2 = 0 + 1,2 + 0 + 3)', dt.dat, dt.chu);
  await doiSoat('Mở lại phiên lóc');
});

// ===========================================================================
await nhom('7 · HỒI QUY: NGÀY HẾT CỦA TẢNG KHÔNG LẤY NGÀY CỦA DÒNG ĐẢO', async () => {
  // Tảng C lóc 3 ngày trước, cả 5 kg thăn chuyển thẳng bếp (tiệc đặt trước), 0,6 kg mỡ bỏ → hết ngay hôm lóc.
  const raC = [
    { mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 5, xu_ly: 'chuyen_bep' },
    { mat_hang_id: MH['P-MO'].id, so_kg: 0.6, xu_ly: 'bo' },
  ];
  const phienC = await luuPhien(null, tangC.id, N[-3], raC);
  await chot(phienC);
  let r = await dongTang(tangC.id);
  ok('Tảng C lóc 3 ngày trước, chuyển cả 5 kg thẳng bếp → đã hết, ngày hết = ngày lóc, 0 ngày từ lóc tới hết',
     r?.tinh_trang === 'het' && r.ngay_het_chu === N[-3] && r.so_ngay_ban === 0 && bang(r.kg_bep, 5) && bang(r.kg_con, 0),
     JSON.stringify({ tinh_trang: r?.tinh_trang, ngay_het: r?.ngay_het_chu, so_ngay_ban: r?.so_ngay_ban, kg_bep: r?.kg_bep }));

  // Hôm nay mở lại phiên (ghi nhầm) rồi chốt lại, ngày lóc giữ nguyên. Dòng đảo ngược mang ngày HÔM NAY;
  // các dòng của lần chốt lại mang ngày lóc.
  const mo = await duoi(UID.thuKhoA, `select kho_mo_lai_phien_pha($1, 'Ghi nhầm ca') as cau`, [phienC]);
  if (mo.loi) throw new Error(mo.loi);
  await chot(phienC);
  const { rows: [ngay] } = await db.query(`
    select (max(s.ngay) filter (where s.loai = 'dao_nguoc'))::text as dao,
           (max(s.ngay) filter (where s.loai <> 'dao_nguoc'
                                  and not exists (select 1 from kho_so_cai x where x.dao_cua = s.id)))::text as hieu_luc
    from kho_so_cai s where s.lo_id = $1 or s.lo_id = any($2::uuid[])`, [tangC.id, await loCat(tangC.id)]);
  ok('Mở lại hôm nay rồi chốt lại: dòng đảo ngược mang ngày hôm nay, dòng còn hiệu lực cuối cùng vẫn là ngày lóc',
     ngay.dao === homNay && ngay.hieu_luc === N[-3], JSON.stringify(ngay));
  r = await dongTang(tangC.id);
  const tv = await truyVet(tangC.id);
  ok('HỒI QUY: báo cáo theo tảng — ngày hết của tảng C vẫn là ngày lóc, 0 ngày từ lóc tới hết (không nhảy sang ngày mở lại phiên)',
     r?.tinh_trang === 'het' && r.ngay_het_chu === ngay.hieu_luc && r.so_ngay_ban === 0 && tv?.tang?.ngay_het === ngay.hieu_luc,
     `ngày hết ${r?.ngay_het_chu} · ${r?.so_ngay_ban} ngày · truy vết ${tv?.tang?.ngay_het} · dòng còn hiệu lực cuối ${ngay.hieu_luc}`);
  ok('HỒI QUY: báo cáo theo tảng và truy vết — tảng C xuất bếp 5 kg (không phải 10), từng lô cắt đúng sổ ròng',
     bang(r?.kg_bep, 5) && bang(tv?.tang?.kg_bep, 5) && (await loLechSo(tv)).length === 0,
     `báo cáo ${r?.kg_bep} · truy vết ${tv?.tang?.kg_bep} · ${(await loLechSo(tv)).join(' | ')}`);
  const dt = await dangThuc(tangC.id);
  ok('HỒI QUY: đẳng thức tảng C — thịt = bếp (5 = 0 + 5 + 0 + 0)', dt.dat, dt.chu);
  await doiSoat('Ngày hết');
});

// ===========================================================================
await nhom('8 · HỒI QUY: BÁN THEO GIỜ — "GIẢM SỚM" XÉT LÔ CỦA LẦN GHI CÒN HIỆU LỰC', async () => {
  // Thăn nội cắt miếng, cảnh báo cận date trước 3 ngày, bán hôm qua:
  //   lô gần hạn — hạn ngày mai → lúc bán còn 2 ngày: giảm giá là đúng lúc;
  //   lô hạn xa  — hạn 9 ngày nữa → lúc bán còn 10 ngày: giảm giá gói của lô này là GIẢM SỚM.
  const noi = MH['C-THANNOI'].id;
  const g30 = await duoi(UID.qlA, `select kho_luu_ma_giam($1, 30, null) as v`, [noi]);
  if (g30.loi) throw new Error(g30.loi);
  const maGiam = g30.rows[0].v.ma_can;
  const ghep = await duoi(UID.qlA, `select kho_ipos_gan_ma_v2($1, 'NOI-GOI', 'mon', $2, 'goi', null)`, [cnA.id, noi]);
  if (ghep.loi) throw new Error(ghep.loi);
  const [gan] = await nhapHang([{ mat_hang_id: noi, so_goi: 1, so_kg: 0.5, don_gia_kg: 700000, han_dung: N[1] }], vt.quay);

  // 12:30 hôm qua: bán 0,5 kg bằng mã giảm → trừ gói cuối của lô gần hạn.
  await gui(hoaDon(301, `${N[-1]}T12:30:00`, [{ ma: maGiam, sl: 0.5, tien: 420000 }]));
  const [dGiam] = await dongHd(301);
  const giamSom = async () => ((await banGio()).rows ?? []).filter(x => x.mat_hang_id === noi)
    .reduce((t, x) => ({ dong: t.dong + x.so_dong, giam: t.giam + x.so_dong_giam, som: t.som + x.so_dong_giam_som }), { dong: 0, giam: 0, som: 0 });
  let bc = await giamSom();
  ok('Bán bằng mã giảm trừ lô gần hạn → 1 dòng giảm giá, không phải giảm sớm',
     dGiam?.trang_thai === 'da_ghi' && dGiam.ma_giam_id === g30.rows[0].v.id && bc.giam === 1 && bc.som === 0, JSON.stringify({ dGiam: dGiam?.ly_do, bc }));

  // Một hoá đơn bán theo gói lúc 12:00 hôm qua tới sau, quầy đã hết thăn nội → nằm chờ (thiếu hàng).
  await gui(hoaDon(302, `${N[-1]}T12:00:00`, [{ ma: 'NOI-GOI', sl: 1 }]));
  const [dCho] = await dongHd(302);
  // Kho mang lô hạn xa ra quầy, rồi thu ngân sửa tiền của hoá đơn giảm giá. Kho đảo dòng giảm giá (gói
  // gần hạn về lại quầy), ghi lại theo giờ bán: dòng 12:00 lấy gói gần hạn trước, dòng giảm giá 12:30
  // rơi vào lô hạn xa.
  const [xa] = await nhapHang([{ mat_hang_id: noi, so_goi: 4, so_kg: 2, don_gia_kg: 700000, han_dung: N[9] }], vt.quay);
  const kq = await gui(hoaDon(301, `${N[-1]}T12:30:00`, [{ ma: maGiam, sl: 0.5, tien: 400000 }]));
  const [dGiam2] = await dongHd(301);
  const soBan = (await db.query(`
    select s.lo_id, exists (select 1 from kho_so_cai r where r.dao_cua = s.id) as da_dao
    from kho_so_cai s where s.chung_tu_loai = 'ban_hang' and s.chung_tu_id = $1 and s.loai = 'ban' order by s.created_at`, [dGiam.id])).rows;
  ok('Hoá đơn giảm giá bị sửa: dòng sổ bán cũ (lô gần hạn) đã bị đảo, lần ghi còn hiệu lực trừ lô hạn xa',
     dCho?.trang_thai === 'thieu_hang' && kq.hd_sua === 1 && dGiam2?.id === dGiam.id && dGiam2.trang_thai === 'da_ghi'
       && soBan.length === 2 && soBan[0].lo_id === gan.id && soBan[0].da_dao === true && soBan[1].lo_id === xa.id && soBan[1].da_dao === false,
     JSON.stringify({ cho: dCho?.trang_thai, kq, soBan }));
  bc = await giamSom();
  ok('HỒI QUY: báo cáo bán theo giờ — dòng giảm giá nay trừ lô còn hạn 10 ngày (cảnh báo 3 ngày) → tính là giảm sớm, không xét lô của dòng đã đảo',
     bc.dong === 2 && bc.giam === 1 && bc.som === 1, JSON.stringify(bc));
  await doiSoat('Mã giảm giá');
});

// ===========================================================================
await nhom('9 · QUYỀN: 0083 KHÔNG NỚI QUYỀN CỦA BỐN HÀM', async () => {
  const HAM = {
    kho_bao_cao_tang: [`select * from kho_bao_cao_tang($1, $2::date, $3::date)`, [cnA.id, N[-30], homNay]],
    kho_truy_vet_tang: [`select kho_truy_vet_tang($1)`, [tangA.id]],
    kho_can_o_ma: [`select kho_can_o_ma($1)`, [cnA.id]],
    kho_bao_cao_ban_gio: [`select * from kho_bao_cao_ban_gio($1, $2::date, $3::date)`, [cnA.id, N[-3], homNay]],
  };
  const BI_TU_CHOI = [
    ['thu ngân', UID.thuNganA], ['marketing', UID.mktA], ['quản lý chi nhánh khác', UID.qlB], ['thủ kho chi nhánh khác', UID.thuKhoB],
    ['người đã nghỉ', UID.nghiViec], ['tài khoản không có dòng nhan_su', UID_LA], ['phiên không mang danh ai', null],
  ];
  for (const [ten, [sql, thamSo]] of Object.entries(HAM)) {
    const lot = [];
    for (const [vai, uid] of BI_TU_CHOI) if ((await duoi(uid, sql, thamSo)).loi === null) lot.push(vai);
    ok(`${ten}: thu ngân, marketing, chi nhánh khác, người đã nghỉ, tài khoản không có dòng nhan_su đều bị từ chối`, lot.length === 0, `gọi được: ${lot.join(', ')}`);
    const a = await duoiAnon(sql, thamSo);
    ok(`${ten}: anon bị từ chối`, /permission denied/.test(a.loi ?? ''), a.loi ?? 'gọi được');
  }

  // NV quầy (quyền xem, không xem giá): cùng số kg với quản lý, mọi cột tiền là null.
  const ql = await dongTang(tangA.id);
  const nv = (await baoCaoTang(UID.nvQuayA)).rows?.find(x => x.lo_id === tangA.id);
  const tvQl = await truyVet(tangA.id), tvNv = await truyVet(tangA.id, UID.nvQuayA);
  const COT_KG = ['kg_ncc', 'kg_repack', 'kg_vao_loc', 'kg_thit', 'kg_phu_pham', 'kg_bo', 'kg_hao_hut', 'kg_ban', 'kg_bep', 'kg_huy', 'kg_con'];
  ok('NV quầy vẫn xem được báo cáo theo tảng: cùng số kg với quản lý, cột tiền và mã phiếu nhập là null (quản lý thì có)',
     !!nv && COT_KG.every(c => nv[c] === ql[c]) && nv.don_gia_ncc === null && nv.gia_von_repack_kg === null && nv.gia_von_thit_kg === null
       && nv.phieu_nhap_id === null && Number(ql.don_gia_ncc) === 450000 && ql.gia_von_thit_kg !== null && ql.phieu_nhap_id !== null,
     JSON.stringify({ nv, ql }));
  ok('NV quầy vẫn xem được truy vết: không có giá vốn ở lô nào; quản lý thì có',
     tvNv?.co_gia === false && tvNv.lo_ra.length === tvQl.lo_ra.length && tvNv.lo_ra.every(l => l.gia_von_kg === null)
       && tvQl.co_gia === true && tvQl.lo_ra.some(l => l.gia_von_kg !== null), JSON.stringify(tvNv?.lo_ra));
  const oNv = await oMa(O1, UID.nvQuayA);
  ok('NV quầy vẫn xem được tảng & ô — không có giá vốn, doanh thu', oNv?.lo_id === loO1 && !/gia_von|gia_tri|doanh_thu|thanh_tien/.test(JSON.stringify(oNv)),
     JSON.stringify(oNv));
  const thuKho = await banGio(UID.thuKhoA), nvQuay = await banGio(UID.nvQuayA);
  ok('Báo cáo bán theo giờ (có doanh thu): thủ kho và NV quầy vẫn bị từ chối, kế toán xem được',
     /chỉ chủ, quản lý, kế toán/.test(thuKho.loi ?? '') && /chỉ chủ, quản lý, kế toán/.test(nvQuay.loi ?? '') && (await banGio()).loi === null,
     thuKho.loi ?? nvQuay.loi ?? '');

  const { rows } = await db.query(`
    select p.proname, p.prosecdef, coalesce(array_to_string(p.proconfig, ','), '') as cau_hinh
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any($1::text[]) order by 1`, [Object.keys(HAM)]);
  ok('Bốn hàm vẫn là security definer, có set search_path = public, mỗi hàm một bản (không sinh thêm bản trùng tên)',
     rows.length === 4 && rows.every(x => x.prosecdef && /search_path=public/.test(x.cau_hinh)), JSON.stringify(rows));
});

// ===========================================================================
await nhom('10 · ĐỐI SOÁT', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('Tồn khớp sổ kho', rows.length === 0, JSON.stringify(rows));
});

process.exit(ketThuc('TẢNG · TRỪ DÒNG ĐẢO NGƯỢC'));
