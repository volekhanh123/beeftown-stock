/**
 * BEEFTOWN KHO — Ngày ủ của từng tảng ủ: ghi tay, giữ mãi để sau này ra công thức (0109)
 * ======================================================================================
 *
 *     node test/test-kho-ghi-ngay-u.mjs
 *
 * Khánh 29/10/2026: "Về ngày ủ của từng miếng ấy, hiện tại giờ bạn ghi nhận thủ công nhé, tức là giờ hiện không có
 * công thức ủ, nhưng vẫn nhớ lưu giữ lại về sau tôi sẽ làm phân tích để có công thức." Phải đúng:
 *   · quyền: chỉ vai pha_loc của đúng chi nhánh ghi được; NV quầy, kế toán, thu ngân, marketing, chi nhánh khác, người
 *     đã nghỉ, tài khoản không có dòng nhan_su, anon đều bị từ chối và không để lại dòng nào; ghi thẳng vào bảng bị chặn;
 *   · chỉ tảng ủ (lô món loại tảng sinh từ trim), còn trong kho, chưa cắt; 0–365 ngày;
 *   · bấm đúp / F5 (cùng mã gửi) không thêm dòng và trả đúng kết quả lần bấm đầu ("Đã đổi", không "Không có gì đổi");
 *     ghi lại cùng số không thêm dòng; đổi số thêm dòng mới, dòng cũ giữ nguyên — sửa / xoá dòng nhật ký bị chặn kể cả
 *     với chủ database;
 *   · số ngày gắn với tảng: mở lại phiên trim rồi chốt lại (lô tảng ủ mới) vẫn giữ số đã ghi;
 *   · kho_v_tang: ngày ủ xong của tảng ủ = ngày trim + số ngày ghi gần nhất; đang ủ / ủ xong theo giờ Việt Nam
 *     (23:50 hôm trước còn ủ, 00:10 hôm sau ủ xong); lóc một chạm ẩn khi đang ủ;
 *   · cắt rồi thì số ngày ủ khóa lại; nhật ký ủ (kho_nhat_ky_u) đủ cột để phân tích: tuổi thịt lúc bắt đầu ủ, kg vào
 *     ủ, số ngày ghi lần đầu / lần cuối, số lần ghi, ai ghi, ngày cắt, số ngày ủ thật, kg lúc cắt, kg cắt ra, hao %
 *     (chỉ khi tảng ủ đã hết, không kg nào đi đường khác);
 *   · web: ghiNgayU — câu chỉ nói "Đã lưu" khi database đã ghi; mất mạng không bao giờ thành "Đã lưu"; câu nhắc tảng
 *     ủ còn đang ủ ở pha lóc; ô số ngày đọc đúng kiểu Việt; file Excel Nhật ký ủ;
 *   · kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, taoClientPg, UID, maGui, datGioDatabase, traGioDatabase } from './kho-chung.mjs';
import {
  cauDaGhiU, cauTangConU, dinhNghiaNhatKyU, docLanGhiU, docNgayUTang, docNhatKyU, docSoNgayU, docTangTon, dongBangNhatKyU,
  ghiNgayU,
} from '../../web/src/lib/kho/tang.ts';
import { tangLocDuoc } from '../../web/src/lib/kho/pha-loc.ts';
import { taoCsv } from '../../web/src/lib/kho/bao-cao.ts';
import { CAU_MAT_MANG_GHI } from '../../web/src/lib/qua-tai.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — NGÀY Ủ CỦA TỪNG TẢNG Ủ: GHI TAY, GIỮ MÃI ĐỂ RA CÔNG THỨC');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
const UID_LA = '00000000-0000-4000-8000-0000000000aa';

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;

const MH = {};
let vt = {};

async function nhapTang(ngayNhap, dong) {
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'ton_dau', p_nha_cung_cap_id => null, p_vi_tri_id => $3, p_ngay_nhap => $4::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => '{}'::text[],
      p_truong_them => '{}'::jsonb, p_dong => $5::jsonb)`,
    [cnA.id, maGui(), vt.kho, ngayNhap, JSON.stringify(dong)]);
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

/** Lưu phiên pha lóc một lô (lấy hết lô ở kho) ngày ngayPha rồi chốt. */
async function phaLoc(lo, matHangVao, ngayPha, ra) {
  const luu = await duoi(UID.thuKhoA, `
    select * from kho_luu_phien_pha(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_mat_hang_vao_id => $3, p_cong_thuc_id => null, p_ngay_pha => $4::date,
      p_ghi_chu => null, p_vao => $5::jsonb, p_ra => $6::jsonb)`,
    [cnA.id, maGui(), matHangVao, ngayPha, JSON.stringify([{ lo_id: lo.id, vi_tri_id: vt.kho }]), JSON.stringify(ra)]);
  if (luu.loi) throw new Error(luu.loi);
  const id = luu.rows[0].phien_id;
  const pb = (await db.query(`select phien_ban from kho_phien_pha where id = $1`, [id])).rows[0].phien_ban;
  const c = await duoi(UID.thuKhoA, `select kho_chot_phien_pha($1, $2)`, [id, pb]);
  if (c.loi) throw new Error(c.loi);
  return id;
}
const loRa = async (phien, ma) => (await db.query(`select l.* from kho_phien_pha_ra r join kho_lo l on l.id = r.lo_id
  where r.phien_pha_id = $1 and r.mat_hang_id = $2`, [phien, MH[ma].id])).rows[0];
const ghi = (uid, loId, soNgay, ma = maGui()) =>
  duoi(uid, `select kho_ghi_ngay_u($1, $2, $3) as kq`, [loId, soNgay, ma]);
const soDong = async loId => Number((await db.query(`select count(*) from kho_ghi_u where lo_id = $1`, [loId])).rows[0].count);
const tangU = async loId => (await duoi(UID.nvQuayA, `select lo_id, so_tang, ngay_bat_dau_u::text, so_ngay_u, so_ngay_u_ghi,
  ngay_u_xong::text, con_ngay_u, tinh_trang_u from kho_v_tang where lo_id = $1`, [loId])).rows?.[0] ?? null;
const nhatKy = async (uid, tu, den) => duoi(uid, `select lo_id, so_tang, ma_lo, ten_hang, ten_hang_goc, ngay_mo::text,
  ngay_nhan::text, ngay_bat_dau_u::text, tuoi_luc_u, kg_vao_u::float8 as kg_vao_u, so_ngay_u_dau, so_ngay_u_ghi,
  ngay_u_xong::text, so_lan_ghi, nguoi_ghi, ngay_ghi_cuoi::text, ngay_cat::text, so_ngay_u_that,
  kg_luc_cat::float8 as kg_luc_cat, kg_cat_ra::float8 as kg_cat_ra, hao_pt::float8 as hao_pt, tinh_trang
  from kho_nhat_ky_u($1, $2::date, $3::date)`, [cnA.id, tu, den]);
async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

// ===========================================================================
let tang1, tang2, tang3, tang4, U1, U2, U3, vun1;
await nhom('1 · CHUẨN BỊ: BỐN NGUYÊN TẢNG, BA TẢNG Ủ (MỘT TRIM 20 NGÀY TRƯỚC)', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  await duoi(UID.qlA, `insert into kho_mat_hang (ma, ten, loai, dem_goi, don_vi_goi, theo_tang, han_dung_ngay, ma_can, gia_ban_kg, noi_de_sau_pha)
    values ('T-RIB', 'Ribeye nguyên tảng', 'tang', true, 'tảng', true, 45, null, null, null),
           ('T-RIB-U', 'Ribeye tảng ủ', 'tang', true, 'tảng', false, 60, null, null, 'kho'),
           ('C-RIB', 'Ribeye cut', 'phan_cat', true, 'khay', false, 4, '1011', 950000, 'quay')`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vt = Object.fromEntries((await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  const ct = async (vao, ten, ra) => {
    const id = (await duoi(UID.qlA, `insert into kho_cong_thuc_pha (mat_hang_vao_id, ten) values ($1, $2) returning id`, [MH[vao].id, ten])).rows[0].id;
    for (const [i, ma] of ra.entries()) {
      await duoi(UID.qlA, `insert into kho_cong_thuc_pha_dong (cong_thuc_id, mat_hang_ra_id, thu_tu) values ($1, $2, $3)`, [id, MH[ma].id, i + 1]);
    }
  };
  await ct('T-RIB', 'Trim', ['T-RIB-U', 'P-VUN']);
  await ct('T-RIB-U', 'Cắt', ['C-RIB']);
  [tang1, tang2, tang3, tang4] = await nhapTang(await ngay(-25), [
    { mat_hang_id: MH['T-RIB'].id, so_goi: 1, so_kg: 6.2, so_kg_thuc: 6.1, ngay_mo: await ngay(-30), don_gia_kg: 600000 },
    { mat_hang_id: MH['T-RIB'].id, so_goi: 1, so_kg: 5.8, so_kg_thuc: 5.7, ngay_mo: await ngay(-28), don_gia_kg: 600000 },
    { mat_hang_id: MH['T-RIB'].id, so_goi: 1, so_kg: 5.6, so_kg_thuc: 5.5, ngay_mo: await ngay(-28), don_gia_kg: 600000 },
    { mat_hang_id: MH['T-RIB'].id, so_goi: 1, so_kg: 5.0, so_kg_thuc: 5.0, ngay_mo: await ngay(-27), don_gia_kg: 600000 },
  ]);
  const trim = async (tang, ngayPha, kgU) => {
    const id = await phaLoc(tang, MH['T-RIB'].id, ngayPha, [
      { mat_hang_id: MH['T-RIB-U'].id, so_goi: 1, so_kg: kgU, xu_ly: 'nhap_kho', vi_tri_id: vt.kho },
      { mat_hang_id: MH['P-VUN'].id, so_kg: 0.5, xu_ly: 'nhap_kho', vi_tri_id: vt.kho },
    ]);
    return [await loRa(id, 'T-RIB-U'), await loRa(id, 'P-VUN')];
  };
  [U1, vun1] = await trim(tang1, await ngay(-20), 5.3);
  [U2] = await trim(tang2, homNay, 4.8);
  [U3] = await trim(tang3, homNay, 4.6);
  const v = await tangU(U1.id);
  ok('Tảng ủ #1 trim 20 ngày trước: đã ủ 20 ngày, chưa ghi số ngày ủ → chưa có ngày ủ xong (như trước 0109)',
     v?.so_tang === 1 && v.ngay_bat_dau_u === await ngay(-20) && v.so_ngay_u === 20 && v.so_ngay_u_ghi === null
       && v.ngay_u_xong === null && v.tinh_trang_u === 'chua_co_bang_u', JSON.stringify(v));
  ok('Ba tảng ủ, nguyên tảng #4 chưa trim', !!U1 && !!U2 && !!U3 && !!tang4 && (await soDong(U1.id)) === 0);
});

// ===========================================================================
await nhom('2 · QUYỀN: CHỈ VAI PHA LÓC CỦA ĐÚNG CHI NHÁNH GHI ĐƯỢC', async () => {
  const BI_TU_CHOI = [
    ['NV quầy (không có quyền pha lóc)', UID.nvQuayA], ['kế toán', UID.keToanA], ['thu ngân', UID.thuNganA],
    ['marketing', UID.mktA], ['quản lý chi nhánh khác', UID.qlB], ['thủ kho chi nhánh khác', UID.thuKhoB],
    ['người đã nghỉ', UID.nghiViec], ['tài khoản không có dòng nhan_su', UID_LA], ['phiên không mang danh ai', null],
  ];
  const lot = [];
  for (const [vai, uid] of BI_TU_CHOI) if ((await ghi(uid, U1.id, 21)).loi === null) lot.push(vai);
  ok('kho_ghi_ngay_u: NV quầy, kế toán, thu ngân, marketing, chi nhánh khác, người đã nghỉ, tài khoản không có dòng nhan_su đều bị từ chối',
     lot.length === 0, `ghi được: ${lot.join(', ')}`);
  const a = await duoiAnon(`select kho_ghi_ngay_u($1, 21, $2)`, [U1.id, maGui()]);
  ok('kho_ghi_ngay_u: anon bị từ chối', /permission denied/.test(a.loi ?? ''), a.loi ?? 'gọi được');
  ok('Bị từ chối thì không để lại dòng nhật ký nào', (await soDong(U1.id)) === 0);
  const tuChoi = await ghi(UID.thuKhoB, U1.id, 21);
  ok('Câu từ chối không lộ tảng của chi nhánh khác: "Không tìm thấy tảng ủ, hoặc tài khoản không được ghi ngày ủ"',
     /Không tìm thấy tảng ủ, hoặc tài khoản không được ghi ngày ủ/.test(tuChoi.loi ?? ''), tuChoi.loi ?? '');

  const chen = await duoi(UID.thuKhoA, `insert into kho_ghi_u (chi_nhanh_id, lo_id, tang_id, ma_gui, so_ngay_u, ngay_bat_dau_u, ngay_u_xong)
    values ($1, $2, $3, gen_random_uuid(), 5, $4::date, $4::date + 5)`, [cnA.id, U1.id, tang1.id, await ngay(-20)]);
  ok('Ghi thẳng vào bảng kho_ghi_u (bỏ qua hàm) bị chặn — chỉ ghi qua kho_ghi_ngay_u', chen.loi !== null && (await soDong(U1.id)) === 0,
     chen.loi ?? 'chèn được');

  const NHAT_KY_TU_CHOI = [
    ['thu ngân', UID.thuNganA], ['marketing', UID.mktA], ['quản lý chi nhánh khác', UID.qlB], ['thủ kho chi nhánh khác', UID.thuKhoB],
    ['người đã nghỉ', UID.nghiViec], ['tài khoản không có dòng nhan_su', UID_LA], ['phiên không mang danh ai', null],
  ];
  const lotNk = [];
  for (const [vai, uid] of NHAT_KY_TU_CHOI) if ((await nhatKy(uid, await ngay(-30), homNay)).loi === null) lotNk.push(vai);
  ok('kho_nhat_ky_u: thu ngân, marketing, chi nhánh khác, người đã nghỉ, tài khoản không có dòng nhan_su đều bị từ chối',
     lotNk.length === 0, `đọc được: ${lotNk.join(', ')}`);
  const aNk = await duoiAnon(`select * from kho_nhat_ky_u($1, $2::date, $3::date)`, [cnA.id, await ngay(-30), homNay]);
  ok('kho_nhat_ky_u: anon bị từ chối', /permission denied/.test(aNk.loi ?? ''), aNk.loi ?? 'gọi được');
  const nv = await nhatKy(UID.nvQuayA, await ngay(-30), homNay);
  ok('kho_nhat_ky_u: NV quầy (quyền xem) đọc được — không có cột tiền', nv.loi === null && nv.rows.length === 3,
     nv.loi ?? JSON.stringify(nv.rows));
});

// ===========================================================================
await nhom('3 · GHI TAY: MỖI LẦN ĐỔI MỘT DÒNG, DÒNG CŨ GIỮ NGUYÊN', async () => {
  const ma = maGui();
  const lan1 = await ghi(UID.thuKhoA, U1.id, 21, ma);
  ok('Thủ kho Q1 ghi tảng ủ #0001 ủ 21 ngày → một dòng; ủ xong = ngày trim + 21',
     lan1.loi === null && lan1.rows[0].kq.da_co === false && lan1.rows[0].kq.so_tang === '#0001'
       && lan1.rows[0].kq.ngay_u_xong === await ngay(1) && (await soDong(U1.id)) === 1, lan1.loi ?? JSON.stringify(lan1.rows));
  const v1 = await tangU(U1.id);
  ok('Tảng · ủ: tảng #0001 có ngày ủ xong (mai), đang ủ, còn 1 ngày, số ngày ghi 21',
     v1?.so_ngay_u_ghi === 21 && v1.ngay_u_xong === await ngay(1) && v1.tinh_trang_u === 'dang_u' && v1.con_ngay_u === 1, JSON.stringify(v1));

  const dup = await ghi(UID.thuKhoA, U1.id, 21, ma);
  ok('BẤM HAI LẦN (cùng mã gửi): không thêm dòng, trả đúng kết quả lần đầu (lần đầu ghi, không phải "không đổi")',
     dup.loi === null && dup.rows[0].kq.da_co === false && dup.rows[0].kq.so_ngay_u === 21 && dup.rows[0].kq.so_ngay_cu === null
       && (await soDong(U1.id)) === 1, dup.loi ?? JSON.stringify(dup.rows));
  const cungSo = await ghi(UID.qlA, U1.id, 21);
  ok('Ghi lại cùng số 21 (mã gửi khác): không thêm dòng', cungSo.loi === null && cungSo.rows[0].kq.da_co === true && (await soDong(U1.id)) === 1,
     cungSo.loi ?? '');
  const maKhacLo = await ghi(UID.thuKhoA, U2.id, 5, ma);
  ok('Mã gửi của tảng #0001 dùng cho tảng khác → bị từ chối, không ghi gì', maKhacLo.loi !== null && (await soDong(U2.id)) === 0,
     maKhacLo.loi ?? 'ghi được');

  const ma2 = maGui();
  const lan2 = await ghi(UID.qlA, U1.id, 18, ma2);
  const dup2 = await ghi(UID.qlA, U1.id, 18, ma2);
  const v2 = await tangU(U1.id);
  ok('Quản lý đổi thành 18 ngày → dòng thứ hai (lần trước 21 vẫn còn); ủ xong 2 ngày trước → sẵn sàng cắt',
     lan2.loi === null && lan2.rows[0].kq.so_ngay_cu === 21 && (await soDong(U1.id)) === 2 && v2?.so_ngay_u_ghi === 18
       && v2.ngay_u_xong === await ngay(-2) && v2.tinh_trang_u === 'san_sang' && v2.con_ngay_u === -2,
     lan2.loi ?? JSON.stringify(v2));
  ok('Bấm đúp lúc đổi 21 → 18: lần bấm sau vẫn trả "lần trước ghi 21" (câu "Đã đổi"), không thêm dòng',
     dup2.loi === null && dup2.rows[0].kq.da_co === false && dup2.rows[0].kq.so_ngay_cu === 21 && (await soDong(U1.id)) === 2,
     dup2.loi ?? JSON.stringify(dup2.rows));

  const SAI = [[-1, 'âm'], [366, 'quá 365'], [null, 'trống']];
  for (const [n, ten] of SAI) {
    const r = await ghi(UID.thuKhoA, U2.id, n);
    ok(`Số ngày ${ten} → "Số ngày ủ phải là số nguyên từ 0 đến 365"`, /Số ngày ủ phải là số nguyên từ 0 đến 365/.test(r.loi ?? ''), r.loi ?? 'ghi được');
  }
  const khongMa = await duoi(UID.thuKhoA, `select kho_ghi_ngay_u($1, 5, null)`, [U2.id]);
  ok('Thiếu mã gửi → câu "Thiếu mã gửi"', /Thiếu mã gửi/.test(khongMa.loi ?? ''), khongMa.loi ?? 'ghi được');
  const nguyen = await ghi(UID.thuKhoA, tang4.id, 14);
  ok('Nguyên tảng (chưa trim) → "Chỉ ghi ngày ủ cho tảng ủ (tảng đã trim)"',
     /Chỉ ghi ngày ủ cho tảng ủ \(tảng đã trim\) — "Ribeye nguyên tảng" không phải tảng ủ/.test(nguyen.loi ?? ''), nguyen.loi ?? 'ghi được');
  const vun = await ghi(UID.thuKhoA, vun1.id, 14);
  ok('Vụn từ trim (không phải món loại tảng) → bị từ chối', /không phải tảng ủ/.test(vun.loi ?? ''), vun.loi ?? 'ghi được');
  ok('Các lần ghi sai không để lại dòng nào', (await soDong(U2.id)) === 0 && (await soDong(tang4.id)) === 0 && (await soDong(vun1.id)) === 0);

  // Nhật ký chỉ thêm: cả chủ database (bỏ qua RLS) cũng không sửa / xoá được.
  let sua = null, xoa = null;
  try { await db.query(`update kho_ghi_u set so_ngay_u = 30, ngay_u_xong = ngay_bat_dau_u + 30 where lo_id = $1`, [U1.id]); } catch (e) { sua = e.message; }
  try { await db.query(`delete from kho_ghi_u where lo_id = $1`, [U1.id]); } catch (e) { xoa = e.message; }
  ok('Sửa / xoá dòng nhật ký ủ bị chặn: "Nhật ký ủ chỉ thêm, không sửa, không xoá"',
     /Nhật ký ủ chỉ thêm, không sửa, không xoá/.test(sua ?? '') && /Nhật ký ủ chỉ thêm/.test(xoa ?? '') && (await soDong(U1.id)) === 2,
     JSON.stringify({ sua, xoa }));
  const suaVai = await duoi(UID.chu, `update kho_ghi_u set nguoi = null where lo_id = $1`, [U1.id]);
  const conNguoi = (await db.query(`select count(*) from kho_ghi_u where lo_id = $1 and nguoi is not null`, [U1.id])).rows[0].count;
  ok('Chủ (qua PostgREST) cũng không sửa được dòng nhật ký', Number(conNguoi) === 2, suaVai.loi ?? '');

  // Lóc một chạm: tảng ủ đang ủ ẩn nút Cắt, ủ xong thì hiện (cùng luật với nguyên tảng có bảng ủ).
  const okU2 = await ghi(UID.thuKhoA, U2.id, 3);
  const ds = (await duoi(UID.thuKhoA, `select lo_id, so_tang, tinh_trang_u from kho_v_tang where chi_nhanh_id = $1 and loai_tang = 'u'`, [cnA.id])).rows;
  const cho = new Map(ds.map(x => [x.lo_id, [{ lo_id: x.lo_id, vi_tri_id: vt.kho, so_kg: 1 }]]));
  const duoc = new Set(tangLocDuoc(ds, cho, new Set()).map(x => x.lo_id));
  ok('Cắt một chạm: #0001 (ủ xong) và #0003 (chưa ghi) hiện; #0002 (ghi 3 ngày, còn đang ủ) ẩn — cắt sớm thì sửa số ngày',
     okU2.loi === null && duoc.has(U1.id) && duoc.has(U3.id) && !duoc.has(U2.id), okU2.loi ?? JSON.stringify(ds));
});

// ===========================================================================
await nhom('4 · GIỜ VIỆT NAM: Ủ XONG ĐÚNG NỬA ĐÊM GIỜ VN', async () => {
  // Tảng #0002 trim hôm nay. Ghi 1 ngày lúc 23:50 → ủ xong ngày mai: 23:50 còn ủ, 00:10 hôm sau ủ xong.
  await datGioDatabase(db, `${homNay}T23:50:00+07:00`);
  const r = await ghi(UID.thuKhoA, U2.id, 1);
  const toi = await tangU(U2.id);
  await datGioDatabase(db, `${await ngay(1)}T00:10:00+07:00`);
  const sang = await tangU(U2.id);
  await traGioDatabase(db);
  ok('23:50 giờ VN ghi 1 ngày: ủ xong = ngày trim + 1 (không lệch sang hôm sau vì giờ UTC), còn 1 ngày, đang ủ',
     r.loi === null && r.rows[0].kq.ngay_u_xong === await ngay(1) && toi?.tinh_trang_u === 'dang_u' && toi.con_ngay_u === 1,
     r.loi ?? JSON.stringify(toi));
  ok('00:10 giờ VN hôm sau: ủ xong hôm nay, sẵn sàng cắt; bắt đầu ủ vẫn là ngày trim',
     sang?.tinh_trang_u === 'san_sang' && sang.con_ngay_u === 0 && sang.ngay_bat_dau_u === homNay, JSON.stringify(sang));
  const u2 = (await db.query(`select ngay_bat_dau_u::text, ngay_u_xong::text from kho_ghi_u where lo_id = $1 order by created_at desc limit 1`, [U2.id])).rows[0];
  ok('Dòng nhật ký chụp lại ngày bắt đầu ủ (ngày trim) và ngày ủ xong', u2?.ngay_bat_dau_u === homNay && u2.ngay_u_xong === await ngay(1),
     JSON.stringify(u2));
});

// ===========================================================================
await nhom('5 · CẮT RỒI THÌ SỐ NGÀY Ủ KHÓA LẠI · NHẬT KÝ Ủ ĐỦ CỘT ĐỂ PHÂN TÍCH', async () => {
  await phaLoc(U1, MH['T-RIB-U'].id, homNay, [
    { mat_hang_id: MH['C-RIB'].id, so_goi: 14, so_kg: 4.6, xu_ly: 'nhap_kho', vi_tri_id: vt.quay },
  ]);
  const sau = await ghi(UID.qlA, U1.id, 25);
  ok('Tảng ủ #0001 đã cắt → ghi thêm bị chặn: "đã cắt — số ngày ủ giữ nguyên"; hai dòng cũ vẫn còn',
     /Tảng ủ #0001 đã cắt — số ngày ủ giữ nguyên như lúc cắt để sau này phân tích/.test(sau.loi ?? '') && (await soDong(U1.id)) === 2,
     sau.loi ?? 'ghi được');
  ok('Tảng · ủ: #0001 cắt xong rời màn', (await tangU(U1.id)) === null);

  const nk = await nhatKy(UID.thuKhoA, await ngay(-30), homNay);
  const d1 = nk.rows?.find(x => x.lo_id === U1.id);
  const d2 = nk.rows?.find(x => x.lo_id === U2.id);
  const d3 = nk.rows?.find(x => x.lo_id === U3.id);
  const tenQl = (await db.query(`select ho_ten from nhan_su where auth_uid = $1`, [UID.qlA])).rows[0]?.ho_ten;
  ok('Nhật ký #0001: món, nguyên tảng gốc, ngày mổ, ngày nhận, bắt đầu ủ 20 ngày trước, tuổi thịt lúc ủ 10 ngày, 5,3 kg vào ủ',
     d1?.so_tang === 1 && d1.ten_hang === 'Ribeye tảng ủ' && d1.ten_hang_goc === 'Ribeye nguyên tảng' && d1.ngay_mo === await ngay(-30)
       && d1.ngay_nhan === await ngay(-25) && d1.ngay_bat_dau_u === await ngay(-20) && d1.tuoi_luc_u === 10 && d1.kg_vao_u === 5.3,
     JSON.stringify(d1));
  ok('Nhật ký #0001: ghi lần đầu 21, lần cuối 18, 2 lần, người ghi lần cuối là quản lý, ủ xong theo số ghi = 2 ngày trước',
     d1?.so_ngay_u_dau === 21 && d1.so_ngay_u_ghi === 18 && d1.so_lan_ghi === 2 && d1.nguoi_ghi === tenQl && !!tenQl
       && d1.ngay_u_xong === await ngay(-2) && !!d1.ngay_ghi_cuoi, JSON.stringify(d1));
  ok('Nhật ký #0001: cắt hôm nay, ủ thật 20 ngày, 5,3 kg lúc cắt, 4,6 kg cắt ra, hao 13,2 %, đã cắt',
     d1?.ngay_cat === homNay && d1.so_ngay_u_that === 20 && d1.kg_luc_cat === 5.3 && d1.kg_cat_ra === 4.6 && d1.hao_pt === 13.2
       && d1.tinh_trang === 'da_cat', JSON.stringify(d1));
  ok('Nhật ký #0002: 2 lần ghi (3 rồi 1), đang ủ, chưa cắt, chưa có hao; #0003: chưa ghi lần nào, đang ủ',
     d2?.so_lan_ghi === 2 && d2.so_ngay_u_dau === 3 && d2.so_ngay_u_ghi === 1 && d2.ngay_cat === null && d2.tinh_trang === 'dang_u'
       && d2.hao_pt === null
       && d3?.so_lan_ghi === 0 && d3.so_ngay_u_ghi === null && d3.so_ngay_u_dau === null && d3.nguoi_ghi === null && d3.tinh_trang === 'dang_u',
     JSON.stringify({ d2, d3 }));
  ok('Nhật ký chỉ có tảng ủ: không có nguyên tảng, vụn, khay', nk.rows?.length === 3, JSON.stringify(nk.rows?.map(x => x.ten_hang)));

  const motNgay = await nhatKy(UID.thuKhoA, await ngay(-20), await ngay(-20));
  ok('Kỳ là ngày trim của #0001 → chỉ #0001', motNgay.loi === null && motNgay.rows.length === 1 && motNgay.rows[0].lo_id === U1.id,
     motNgay.loi ?? JSON.stringify(motNgay.rows));
  const nguoc = await nhatKy(UID.thuKhoA, homNay, await ngay(-1));
  const dai = await nhatKy(UID.thuKhoA, await ngay(-400), homNay);
  ok('Từ ngày sau đến ngày, kỳ dài hơn 1 năm → bị từ chối với câu rõ',
     /Chọn khoảng ngày/.test(nguoc.loi ?? '') && /Khoảng ngày tối đa 1 năm/.test(dai.loi ?? ''), JSON.stringify([nguoc.loi, dai.loi]));
  const nkB = await duoi(UID.thuKhoB, `select * from kho_ghi_u`);
  ok('Thủ kho chi nhánh khác không đọc được dòng nhật ký ủ của Q1', nkB.loi === null && nkB.rows.length === 0, nkB.loi ?? JSON.stringify(nkB.rows));
  await doiSoat('Cắt');
});

// ===========================================================================
await nhom('6 · TẢNG Ủ KHÔNG CÒN TRONG KHO MÀ CHƯA CẮT', async () => {
  const xb = await duoi(UID.qlA, `select * from kho_tao_phieu_xuat($1, $2, 'xuat_bep', $3, null, null, null, '{}'::text[], $4::jsonb)`,
    [cnA.id, maGui(), vt.kho, JSON.stringify([{ mat_hang_id: MH['T-RIB-U'].id, lo_id: U3.id, so_goi: 1, so_kg: 4.6 }])]);
  const r = await ghi(UID.thuKhoA, U3.id, 10);
  ok('Tảng ủ #0003 đã xuất bếp hết → "Tảng ủ #0003 không còn trong kho — không ghi ngày ủ được"',
     xb.loi === null && /Tảng ủ #0003 không còn trong kho — không ghi ngày ủ được/.test(r.loi ?? '') && (await soDong(U3.id)) === 0,
     xb.loi ?? r.loi ?? 'ghi được');
  const d3 = (await nhatKy(UID.thuKhoA, await ngay(-30), homNay)).rows?.find(x => x.lo_id === U3.id);
  ok('Nhật ký #0003: vẫn có dòng, tình trạng "không còn trong kho, chưa cắt", không có hao', d3?.tinh_trang === 'khac'
     && d3.ngay_cat === null && d3.hao_pt === null, JSON.stringify(d3));
  await doiSoat('Xuất bếp tảng ủ');
});

// ===========================================================================
await nhom('7 · MỞ LẠI PHIÊN TRIM RỒI CHỐT LẠI: SỐ NGÀY ĐÃ GHI VẪN THEO TẢNG', async () => {
  const phien = await phaLoc(tang4, MH['T-RIB'].id, homNay, [
    { mat_hang_id: MH['T-RIB-U'].id, so_goi: 1, so_kg: 4.4, xu_ly: 'nhap_kho', vi_tri_id: vt.kho },
    { mat_hang_id: MH['P-VUN'].id, so_kg: 0.4, xu_ly: 'nhap_kho', vi_tri_id: vt.kho },
  ]);
  const cu = await loRa(phien, 'T-RIB-U');
  const g = await ghi(UID.thuKhoA, cu.id, 7);
  const mo = await duoi(UID.qlA, `select kho_mo_lai_phien_pha($1, 'Sửa kg tảng ủ')`, [phien]);
  const pb = (await db.query(`select phien_ban from kho_phien_pha where id = $1`, [phien])).rows[0].phien_ban;
  const chot = await duoi(UID.qlA, `select kho_chot_phien_pha($1, $2)`, [phien, pb]);
  const moi = await loRa(phien, 'T-RIB-U');
  const v = await tangU(moi?.id);
  ok('Ghi 7 ngày, mở lại phiên trim, chốt lại → lô tảng ủ mới vẫn "ủ 7 ngày" (số ngày theo tảng #0004, không theo lô)',
     g.loi === null && mo.loi === null && chot.loi === null && !!moi && moi.id !== cu.id && v?.so_tang === 4
       && v.so_ngay_u_ghi === 7 && v.ngay_u_xong === await ngay(7) && v.tinh_trang_u === 'dang_u',
     [g.loi, mo.loi, chot.loi].filter(Boolean).join(' · ') || JSON.stringify(v));
  const doi = await ghi(UID.thuKhoA, moi.id, 9);
  ok('Ghi tiếp trên lô mới: "lần trước ghi 7" — dòng cũ của lô cũ vẫn tính là lần ghi của tảng',
     doi.loi === null && doi.rows[0].kq.so_ngay_cu === 7, doi.loi ?? JSON.stringify(doi.rows));
  const nk = (await nhatKy(UID.thuKhoA, await ngay(-30), homNay)).rows ?? [];
  const d4 = nk.filter(x => x.so_tang === 4);
  ok('Nhật ký: tảng #0004 một dòng (lô mới), ghi lần đầu 7, lần cuối 9, 2 lần — lô cũ của phiên mở lại không thành dòng thứ hai',
     d4.length === 1 && d4[0].lo_id === moi.id && d4[0].so_ngay_u_dau === 7 && d4[0].so_ngay_u_ghi === 9 && d4[0].so_lan_ghi === 2,
     JSON.stringify(d4));
  await doiSoat('Mở lại phiên trim');
});

// ===========================================================================
await nhom('8 · WEB: CÂU BÁO ĐÚNG SỰ THẬT, MẤT MẠNG, NHẮC CÒN ĐANG Ủ, TRUY VẾT, FILE EXCEL', async () => {
  const clientCua = await taoClientPg({ db, duoi, duoiAnon });
  const tk = clientCua(UID.thuKhoA);

  const kq = await ghiNgayU(tk, { loId: U2.id, soNgay: 5, maGui: maGui() });
  ok('ghiNgayU: database ghi xong mới báo "Đã đổi: tảng ủ #0002 ủ 5 ngày (lần trước ghi 1)" (vi và en)',
     kq.ok && /^Đã đổi: tảng ủ #0002 ủ 5 ngày \(lần trước ghi 1\) — ủ xong ngày /.test(kq.cau) && /^Changed: aging primal #0002 ages 5 days/.test(kq.cauEn ?? ''),
     JSON.stringify(kq));
  const nv = await ghiNgayU(clientCua(UID.nvQuayA), { loId: U2.id, soNgay: 7, maGui: maGui() });
  ok('ghiNgayU: NV quầy → ok false, không có chữ "Đã"', !nv.ok && !/Đã/.test(nv.cau), JSON.stringify(nv));

  const truocMatMang = await soDong(U2.id);
  const nem = { rpc: async () => { throw new TypeError('fetch failed'); } };
  const loiMang = { rpc: async () => ({ data: null, error: { message: 'TypeError: fetch failed' } }) };
  const kqNem = await ghiNgayU(nem, { loId: U2.id, soNgay: 9, maGui: maGui() });
  const kqLoi = await ghiNgayU(loiMang, { loId: U2.id, soNgay: 9, maGui: maGui() });
  ok('MẤT MẠNG: rpc ném / trả lỗi mạng → ok false, câu "chưa chắc đã ghi", không bao giờ "Đã lưu" / "Đã đổi"',
     !kqNem.ok && !kqLoi.ok && kqNem.cau === CAU_MAT_MANG_GHI.vi && kqLoi.cau === CAU_MAT_MANG_GHI.vi
       && ![kqNem.cau, kqLoi.cau].some(c => /Đã lưu|Đã đổi/.test(c)) && (await soDong(U2.id)) === truocMatMang,
     JSON.stringify({ kqNem, kqLoi }));

  ok('cauDaGhiU: lần đầu "Đã lưu", không đổi "Không có gì đổi", tiếng Anh số ít "1 day"',
     /^Đã lưu: tảng ủ #0009 ủ 21 ngày — ủ xong ngày 19\/11\/2026\.$/.test(cauDaGhiU({ da_co: false, so_tang: '#0009', so_ngay_u: 21, ngay_u_xong: '2026-11-19', so_ngay_cu: null }).vi)
       && /Không có gì đổi/.test(cauDaGhiU({ da_co: true, so_tang: '#0009', so_ngay_u: 21, ngay_u_xong: '2026-11-19' }).vi)
       && /ages 1 day —/.test(cauDaGhiU({ da_co: false, so_tang: '#0009', so_ngay_u: 1, ngay_u_xong: '2026-10-30', so_ngay_cu: null }).en));

  const ds = await docTangTon(tk, cnA.id);
  const x2 = ds.find(x => x.lo_id === U2.id);
  ok('docTangTon: tảng ủ #0002 có số ngày ghi 5, ủ xong = trim + 5, đang ủ', x2?.so_ngay_u_ghi === 5 && x2.ngay_u_xong === await ngay(5)
     && x2.tinh_trang_u === 'dang_u', JSON.stringify(x2));

  const ngayU = await docNgayUTang(tk, [U2.id, tang4.id]);
  const nhac = cauTangConU(ngayU.get(U2.id), homNay, 'vi');
  ok('Pha lóc: cắt tảng ủ #0002 khi còn đang ủ → câu nhắc "còn đang ủ — ủ xong ngày …" (lấy từ số ngày ghi tay)',
     ngayU.get(U2.id)?.ngay_u_xong === await ngay(5) && /còn đang ủ — ủ xong ngày .* \(còn 5 ngày\)/.test(nhac ?? ''), JSON.stringify({ g: ngayU.get(U2.id), nhac }));
  const hongTang = { from: bang => (bang === 'kho_v_tang'
    ? { select: () => ({ eq: () => ({ in: async () => ({ data: null, error: { message: 'TypeError: fetch failed' } }) }) }) }
    : tk.from(bang)) };
  const ngayUHong = await docNgayUTang(hongTang, [U2.id, tang4.id]);
  ok('Đọc ngày ủ của tảng ủ hỏng: vẫn trả số tảng / ngày mổ từ lô (không ném), chỉ thiếu ngày ủ xong của tảng ủ',
     ngayUHong.get(tang4.id)?.so_tang === 4 && ngayUHong.get(U2.id)?.ngay_u_xong === null, JSON.stringify([...ngayUHong]));

  const lan = await docLanGhiU(tk, tang1.id);
  ok('Trang truy vết tảng #0001: hai lần ghi, cũ trước (21 rồi 18), có người ghi và lúc ghi',
     lan.map(x => x.so_ngay_u).join() === '21,18' && lan.every(x => !!x.nguoi && !!x.created_at) && lan[1].ngay_u_xong === await ngay(-2),
     JSON.stringify(lan));
  const lanB = await docLanGhiU(clientCua(UID.thuKhoB), tang1.id);
  ok('Thủ kho chi nhánh khác: không thấy lần ghi nào của tảng Q1', lanB.length === 0, JSON.stringify(lanB));

  const dong = dongBangNhatKyU(await docNhatKyU(clientCua(UID.nvQuayA), cnA.id, await ngay(-30), homNay), 'vi');
  const dn = dinhNghiaNhatKyU('vi');
  const csv = taoCsv(dn.cot, dong);
  const hang1 = csv.split('\r\n').find(h => h.startsWith('#0001;'));
  ok('File Excel Nhật ký ủ: đủ cột phân tích, dấu phẩy thập phân, ngày dd/mm/yyyy',
     /Tuổi thịt lúc bắt đầu ủ \(ngày\);Kg vào ủ;Số ngày ủ ghi lần đầu;Số ngày ủ ghi lần cuối/.test(csv)
       && /Kg cắt ra \(không tính phần bỏ đi\);Hao từ trim tới cắt xong %/.test(csv)
       && !!hang1 && hang1.includes(';5,3;21;18;') && hang1.includes(';20;5,3;4,6;13,2;Đã cắt')
       && hang1.includes(`;${(await ngay(-20)).split('-').reverse().join('/')};10;`), hang1 ?? csv);
  ok('File Excel Nhật ký ủ (en): tên cột tiếng Anh', dinhNghiaNhatKyU('en').cot.some(c => c.ten === 'Real aging days')
     && dongBangNhatKyU([{ ...dong[0], tinh_trang: 'khac' }], 'en')[0].tinh_trang_chu === 'No longer in stock, not cut');

  const DOC = [['21', 21], [' 7 ', 7], ['0', 0], ['365', 365], ['366', null], ['-1', null], ['1,5', null], ['1.5', null],
               ['1.000', null], ['abc', null], ['', null], [null, null], ['٣', null]];
  const sai = DOC.filter(([v, mong]) => docSoNgayU(v) !== mong);
  ok('docSoNgayU: số nguyên 0–365; "1,5", "1.5", "1.000", âm, chữ, trống → không nhận', sai.length === 0, JSON.stringify(sai));
  await doiSoat('Web');
});

process.exit(ketThuc('NGÀY Ủ GHI TAY, NHẬT KÝ Ủ'));
