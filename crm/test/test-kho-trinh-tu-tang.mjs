/**
 * BEEFTOWN KHO — Tảng → Trim → tảng ủ → Cắt: đúng trình tự · Tảng · ủ tách nguyên tảng / tảng ủ (0107)
 * =====================================================================================================
 *
 *     node test/test-kho-trinh-tu-tang.mjs
 *
 * Khánh chốt 28/10/2026: "Từ tảng thì lúc trim ban đầu nó sẽ luôn ra tảng ủ. Tảng ủ xong mới ra Ribeye khay."
 * Trim: nguyên tảng → MỘT tảng ủ (vẫn một khối) + vụn thừa. Cắt: tảng ủ → khay, không ra vụn. Nguyên tảng và tảng
 * ủ là hai mục khác nhau ở màn Tảng · ủ. Phải đúng:
 *   · nguyên tảng có công thức Trim → chốt phiên chặn: ra thẳng khay; không ra tảng ủ nào; tảng ủ chỉ vào kho;
 *   · tảng ủ có công thức Cắt → chốt phiên chặn: ra thứ ngoài công thức (vụn); dòng bỏ đi (xu_ly bo) vẫn được;
 *   · món không có công thức Trim (thăn ngoại của danh mục mẫu) → không đổi gì;
 *   · kho_v_tang: nguyên tảng (loai_tang nguyen) và tảng ủ (loai_tang u, số tảng + ngày mổ của tảng gốc, ngày bắt
 *     đầu ủ = ngày trim, số ngày đã ủ theo giờ Việt Nam); trim xong nguyên tảng rời view, cắt xong tảng ủ rời view;
 *   · kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — TẢNG → TRIM → TẢNG Ủ → CẮT ĐÚNG TRÌNH TỰ');
const { db, cnA, cnB, duoi } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;

const MH = {};
let vt = {};

async function nhapTang(dong) {
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'ton_dau', p_nha_cung_cap_id => null, p_vi_tri_id => $3, p_ngay_nhap => $4::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => '{}'::text[],
      p_truong_them => '{}'::jsonb, p_dong => $5::jsonb)`,
    [cnA.id, maGui(), vt.kho, homNay, JSON.stringify(dong)]);
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

/** Lưu phiên pha lóc một lô (lấy hết lô ở kho) rồi chốt. Trả { id, loi } — loi là câu database khi chốt bị chặn. */
async function phaLoc(lo, matHangVao, ra) {
  const luu = await duoi(UID.thuKhoA, `
    select * from kho_luu_phien_pha(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_mat_hang_vao_id => $3, p_cong_thuc_id => null, p_ngay_pha => $4::date,
      p_ghi_chu => null, p_vao => $5::jsonb, p_ra => $6::jsonb)`,
    [cnA.id, maGui(), matHangVao, homNay, JSON.stringify([{ lo_id: lo.id, vi_tri_id: vt.kho }]), JSON.stringify(ra)]);
  if (luu.loi) throw new Error(luu.loi);
  const id = luu.rows[0].phien_id;
  const pb = (await db.query(`select phien_ban from kho_phien_pha where id = $1`, [id])).rows[0].phien_ban;
  const c = await duoi(UID.thuKhoA, `select kho_chot_phien_pha($1, $2)`, [id, pb]);
  const tt = (await db.query(`select trang_thai from kho_phien_pha where id = $1`, [id])).rows[0].trang_thai;
  return { id, loi: c.loi, trang_thai: tt };
}
const loRa = async (phien, ma) => (await db.query(`select l.* from kho_phien_pha_ra r join kho_lo l on l.id = r.lo_id
  where r.phien_pha_id = $1 and r.mat_hang_id = $2`, [phien, MH[ma].id])).rows[0];
const viewTang = async () => (await duoi(UID.nvQuayA, `select lo_id, so_tang, ten_hang, ngay_mo::text, tuoi_ngay, loai_tang,
  ngay_bat_dau_u::text, so_ngay_u, so_kg, so_goi from kho_v_tang where chi_nhanh_id = $1 order by loai_tang, so_tang`, [cnA.id])).rows ?? [];
async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

// ===========================================================================
let tang1, tang2;
await nhom('1 · CHUẨN BỊ: NGUYÊN TẢNG THEO TẢNG, TẢNG Ủ, KHAY · CÔNG THỨC TRIM VÀ CẮT', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  const them = await duoi(UID.qlA, `insert into kho_mat_hang (ma, ten, loai, dem_goi, don_vi_goi, theo_tang, han_dung_ngay, ma_can, gia_ban_kg, noi_de_sau_pha)
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
  [tang1, tang2] = await nhapTang([
    { mat_hang_id: MH['T-RIB'].id, so_goi: 1, so_kg: 6.2, so_kg_thuc: 6.1, ngay_mo: await ngay(-18), don_gia_kg: 600000 },
    { mat_hang_id: MH['T-RIB'].id, so_goi: 1, so_kg: 5.8, so_kg_thuc: 5.7, ngay_mo: await ngay(-16), don_gia_kg: 600000 },
  ]);
  ok('Ba món, hai công thức, hai nguyên tảng có số #1 #2', them.loi === null && tang1?.so_tang === 1 && tang2?.so_tang === 2,
     them.loi ?? JSON.stringify([tang1?.so_tang, tang2?.so_tang]));
  const v = await viewTang();
  ok('Tảng · ủ: hai nguyên tảng ở mục nguyên tảng (loai_tang nguyen), chưa có tảng ủ',
     v.length === 2 && v.every(x => x.loai_tang === 'nguyen' && x.ngay_bat_dau_u === null && x.so_ngay_u === null), JSON.stringify(v));
});

// ===========================================================================
let tangU1;
await nhom('2 · TRIM: NGUYÊN TẢNG LUÔN RA TẢNG Ủ — KHÔNG CẮT THẲNG RA KHAY', async () => {
  const thang = await phaLoc(tang1, MH['T-RIB'].id, [
    { mat_hang_id: MH['C-RIB'].id, so_goi: 12, so_kg: 4, xu_ly: 'nhap_kho', vi_tri_id: vt.quay },
    { mat_hang_id: MH['P-VUN'].id, so_kg: 0.5, xu_ly: 'nhap_kho', vi_tri_id: vt.kho },
  ]);
  ok('Nguyên tảng cắt thẳng ra khay → chốt bị chặn, câu nói phải trim ra tảng ủ trước; phiên vẫn nháp, tảng còn nguyên',
     thang.trang_thai === 'nhap' && /"Ribeye cut" chưa ra được từ "Ribeye nguyên tảng": phải Trim ra tảng ủ trước/.test(thang.loi ?? '')
     && Number((await db.query(`select so_kg from kho_ton where lo_id = $1`, [tang1.id])).rows[0].so_kg) === 6.1, thang.loi ?? 'chốt được');
  await db.query(`update kho_phien_pha set trang_thai = 'da_huy' where id = $1`, [thang.id]);

  const khongU = await phaLoc(tang1, MH['T-RIB'].id, [{ mat_hang_id: MH['P-VUN'].id, so_kg: 0.5, xu_ly: 'nhap_kho', vi_tri_id: vt.kho }]);
  ok('Trim mà không ra tảng ủ nào (chỉ vụn) → chốt bị chặn',
     khongU.trang_thai === 'nhap' && /Trim "Ribeye nguyên tảng" phải ra một tảng ủ/.test(khongU.loi ?? ''), khongU.loi ?? 'chốt được');
  await db.query(`update kho_phien_pha set trang_thai = 'da_huy' where id = $1`, [khongU.id]);

  const dung = await phaLoc(tang1, MH['T-RIB'].id, [
    { mat_hang_id: MH['T-RIB-U'].id, so_goi: 1, so_kg: 5.3, xu_ly: 'nhap_kho', vi_tri_id: vt.kho },
    { mat_hang_id: MH['P-VUN'].id, so_kg: 0.5, xu_ly: 'nhap_kho', vi_tri_id: vt.kho },
    { mat_hang_id: MH['P-MO'].id, so_kg: 0.2, xu_ly: 'bo' },
  ]);
  tangU1 = await loRa(dung.id, 'T-RIB-U');
  ok('Trim đúng: 1 tảng ủ 5,3 kg + vụn 0,5 kg (+ mỡ bỏ đi) → chốt được; lô tảng ủ mang tảng gốc #1',
     dung.loi === null && dung.trang_thai === 'da_chot' && tangU1?.tang_goc_id === tang1.id, dung.loi ?? JSON.stringify(tangU1));

  const v = await viewTang();
  const u = v.find(x => x.loai_tang === 'u');
  ok('Tảng · ủ: tảng #1 rời mục nguyên tảng, sang mục tảng ủ — số tảng #1, ngày mổ của tảng gốc, bắt đầu ủ hôm nay, đã ủ 0 ngày, 5,3 kg',
     v.filter(x => x.loai_tang === 'nguyen').map(x => x.so_tang).join() === '2' && u && u.lo_id === tangU1.id && u.so_tang === 1
     && u.ngay_mo === await ngay(-18) && u.tuoi_ngay === 18 && u.ngay_bat_dau_u === homNay && u.so_ngay_u === 0
     && Number(u.so_kg) === 5.3 && u.so_goi === 1, JSON.stringify(v));
  await doiSoat('Trim');
});

// ===========================================================================
await nhom('3 · CẮT: TẢNG Ủ CHỈ RA KHAY, KHÔNG RA VỤN', async () => {
  const coVun = await phaLoc(tangU1, MH['T-RIB-U'].id, [
    { mat_hang_id: MH['C-RIB'].id, so_goi: 14, so_kg: 4.6, xu_ly: 'nhap_kho', vi_tri_id: vt.quay },
    { mat_hang_id: MH['P-VUN'].id, so_kg: 0.3, xu_ly: 'nhap_kho', vi_tri_id: vt.kho },
  ]);
  ok('Cắt tảng ủ mà có dòng vụn → chốt bị chặn, câu nói tảng ủ chỉ cắt ra khay',
     coVun.trang_thai === 'nhap' && /"Thịt vụn" không có trong công thức cắt của "Ribeye tảng ủ" — tảng ủ chỉ cắt ra khay/.test(coVun.loi ?? ''),
     coVun.loi ?? 'chốt được');
  await db.query(`update kho_phien_pha set trang_thai = 'da_huy' where id = $1`, [coVun.id]);

  const dung = await phaLoc(tangU1, MH['T-RIB-U'].id, [
    { mat_hang_id: MH['C-RIB'].id, so_goi: 14, so_kg: 4.6, xu_ly: 'nhap_kho', vi_tri_id: vt.quay },
  ]);
  const khay = await loRa(dung.id, 'C-RIB');
  const v = await viewTang();
  ok('Cắt đúng: chỉ khay → chốt được; lô khay mang tảng gốc #1; tảng ủ rời màn Tảng · ủ',
     dung.loi === null && dung.trang_thai === 'da_chot' && khay?.tang_goc_id === tang1.id && !v.some(x => x.loai_tang === 'u'),
     dung.loi ?? JSON.stringify({ khay: khay?.tang_goc_id, v }));
  await doiSoat('Cắt');
});

// ===========================================================================
await nhom('4 · MÓN KHÔNG CÓ CÔNG THỨC TRIM KHÔNG ĐỔI GÌ', async () => {
  const [tang] = await nhapTang([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 3, don_gia_kg: 500000 }]);
  const p = await phaLoc(tang, MH['T-THANNGOAI'].id, [
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 4, so_kg: 2, xu_ly: 'nhap_kho', vi_tri_id: vt.quay },
    { mat_hang_id: MH['P-VUN'].id, so_kg: 0.4, xu_ly: 'nhap_kho', vi_tri_id: vt.kho },
  ]);
  ok('Thăn ngoại (không có công thức Trim) lóc thẳng ra phần cắt + vụn như trước', p.loi === null && p.trang_thai === 'da_chot', p.loi ?? '');
  const fn = await duoi(UID.qlA, `select kho_phien_pha_dung_trinh_tu()`);
  ok('kho_phien_pha_dung_trinh_tu là hàm trigger nội bộ — quản lý không gọi được', fn.loi !== null, fn.loi ?? 'gọi được');
  await doiSoat('Không công thức Trim');
});

process.exit(ketThuc('TẢNG → TRIM → TẢNG Ủ → CẮT'));
