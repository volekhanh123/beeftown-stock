/**
 * BEEFTOWN KHO — Kiểm thử pha lóc bằng quét nhãn, báo thu hồi thấp, thẻ kho (0033, GĐ5c)
 * ======================================================================================
 *
 *     node test/test-kho-pha-loc-quet.mjs
 *
 * Chủ nhà hàng đã chốt: gói nào cắt ra cũng có nhãn → ghi kết quả pha bằng
 * quét nhãn (số gói = số nhãn, kg = tổng kg); nơi để sau pha tùy món; pha lóc
 * không duyệt nhưng thu hồi thấp thì tự báo quản lý; thủ kho không thấy tiền.
 *
 * Những điều phải đúng:
 *   · quét 3 nhãn cùng món → 1 dòng ra 3 gói, kg = tổng; gửi lại cùng lượt
 *     không cộng đôi; −1 / bỏ lượt / xóa món đúng;
 *   · lưu phiên không xóa dòng quét; dòng gõ tay trùng món đã quét bị từ chối;
 *   · gói vào đúng nơi theo món (quầy / kho lạnh); chốt → lô đúng vị trí, tổng
 *     giá vốn các lô ra = giá vốn tảng vào, ĐÚNG TỪNG ĐỒNG;
 *   · thu hồi thấp → sự kiện cho quản lý, không cho thủ kho; "Đã xem" → hết;
 *   · thẻ kho: tồn cuối kỳ = kho_ton từng lô × vị trí; tồn đầu kỳ đúng khi lọc
 *     ngày; không tiền.
 * Cuối mỗi nhóm: kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — PHA LÓC QUÉT NHÃN, THU HỒI THẤP, THẺ KHO');
const { db, cnA, cnB, duoi } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;

async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

// Khóa tiền — cùng mẫu với test-kho-thu-kho.mjs. "dien_giai" (diễn giải của
// thẻ kho) khớp mẫu vì có chữ "giai" nhưng là chữ, không phải số tiền.
const LA_TIEN = /gia|tien|thanh_tien|gia_von|gia_tri|thue|chi_phi|phai_tra|con_no|da_tra|giam_tru/;
const KHOA_CHU = new Set(['dien_giai']);
function khoaTien(v, duong = '') {
  const ra = [];
  if (Array.isArray(v)) v.forEach((x, i) => ra.push(...khoaTien(x, `${duong}[${i}]`)));
  else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      if (LA_TIEN.test(k) && !KHOA_CHU.has(k)) ra.push(`${duong}.${k}`);
      ra.push(...khoaTien(x, `${duong}.${k}`));
    }
  }
  return ra;
}
const GIA = { loA: 500000, loB: 520000, loC: 480000, vun: 100000 };
const coTien = s => /\d[\d.,]*\s*(đồng|₫|đ)(?![\p{L}])/u.test(s ?? '')
  || Object.values(GIA).some(g => (s ?? '').includes(String(g)) || (s ?? '').includes(g.toLocaleString('vi-VN')));

/** Nhãn cân EAN-13 theo mẫu mặc định 2XCCCCCWWWWWK (kg 3 số lẻ). */
function nhan(maCan, kg) {
  const s = '20' + String(maCan).padStart(5, '0') + String(Math.round(kg * 1000)).padStart(5, '0');
  let t = 0;
  for (let i = 0; i < 12; i++) t += Number(s[i]) * (i % 2 === 0 ? 1 : 3);
  return s + ((10 - t % 10) % 10);
}

const MH = {};
let viTri = {};
let ncc;

/** Nhập hàng đúng luồng: quản lý lưu có giá, thủ kho gửi, quản lý duyệt. Trả lô. */
async function nhapHang(dong, ngayNhap, vt = viTri.kho) {
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cnA.id, maGui(), ncc, vt, ngayNhap, JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  const gui = await duoi(UID.thuKhoA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
  if (gui.loi) throw new Error(gui.loi);
  const duyet = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [p.phieu_id]);
  if (duyet.loi) throw new Error(duyet.loi);
  const { rows } = await db.query(`
    select l.*, g.gia_tri from kho_lo l
    join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    join kho_lo_gia g on g.lo_id = l.id
    where d.phieu_nhap_id = $1 order by d.thu_tu`, [p.phieu_id]);
  return rows[0];
}

/** kho_luu_phien_pha — chữ ký cũ (0022), gọi bằng tên tham số. */
function luuPhien(uid, t) {
  return duoi(uid, `
    select * from kho_luu_phien_pha(
      p_id => $1, p_chi_nhanh_id => $2, p_ma_gui => $3, p_phien_ban => $4,
      p_mat_hang_vao_id => $5, p_cong_thuc_id => $6, p_ngay_pha => $7::date,
      p_ghi_chu => $8, p_vao => $9::jsonb, p_ra => $10::jsonb)`,
    [t.id ?? null, cnA.id, t.maGui ?? maGui(), t.phienBan ?? null,
     t.matHang ?? MH['T-THANNGOAI'].id, t.congThuc ?? null, t.ngay ?? homNay, null,
     JSON.stringify(t.vao ?? []), JSON.stringify(t.ra ?? [])]);
}

// Mọi kết quả thủ kho nhận được trong file — soát tiền ở nhóm cuối.
const thuKhoThay = [];
async function tk(sql, p = []) {
  const r = await duoi(UID.thuKhoA, sql, p);
  if (r.loi) thuKhoThay.push(r.loi);
  if (r.rows) thuKhoThay.push(r.rows);
  return r;
}

const quet = (uid, id, ma, gui = maGui()) =>
  (uid === UID.thuKhoA ? tk : (s, p) => duoi(uid, s, p))(
    `select kho_quet_phien_pha(p_id => $1, p_ma_gui => $2, p_ma => $3::jsonb) as kq`, [id, gui, JSON.stringify(ma)]);
const boQuet = (uid, id, cach, mh, gui = maGui()) =>
  (uid === UID.thuKhoA ? tk : (s, p) => duoi(uid, s, p))(
    `select kho_bo_quet_phien_pha(p_id => $1, p_ma_gui => $2, p_cach => $3, p_mat_hang_id => $4) as kq`,
    [id, gui, cach, mh ?? null]);
const phien = async id => (await db.query(`select * from kho_phien_pha where id = $1`, [id])).rows[0];
const dongRa = async id => (await db.query(`
  select r.*, m.ma, v.loai as loai_vi_tri from kho_phien_pha_ra r
  join kho_mat_hang m on m.id = r.mat_hang_id left join kho_vi_tri v on v.id = r.vi_tri_id
  where r.phien_pha_id = $1 order by r.thu_tu`, [id])).rows;
const demViec = async uid => (await duoi(uid, `select kho_dem_viec($1) as v`, [cnA.id])).rows?.[0]?.v ?? {};
const suKien = async (uid, khoa) => ((await duoi(uid, `select kho_thong_bao($1, 300) as v`, [cnA.id])).rows?.[0]?.v?.su_kien ?? [])
  .filter(e => e.khoa === khoa);
// Lô của lần chốt HIỆN TẠI (mở lại rồi chốt lại thì lô cũ vẫn còn — bất biến, tồn 0).
const tongGiaVonRa = async id => Number((await db.query(`
  select coalesce(sum(g.gia_tri), 0) as t from kho_phien_pha_ra r join kho_lo_gia g on g.lo_id = r.lo_id
  where r.phien_pha_id = $1`, [id])).rows[0].t);

let loA, loB, loC;
let P1, P2, P3;            // ba phiên pha thăn ngoại

// ===========================================================================
await nhom('1 · CHUẨN BỊ: KHO, DANH MỤC, MÃ CÂN, CÔNG THỨC, BA TẢNG', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  viTri = Object.fromEntries((await db.query(
    `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));

  // Quản lý cài: sau pha thăn ngoại cắt lát ra quầy, thăn nội cất kho lạnh.
  const d = await duoi(UID.qlA, `
    update kho_mat_hang set
      ma_can = case ma when 'C-THANNGOAI' then '301' when 'C-THANNOI' then '302'
                       when 'C-THANLUNG' then '303' when 'P-GAN' then '401' end,
      noi_de_sau_pha = case ma when 'C-THANNGOAI' then 'quay' when 'C-THANNOI' then 'kho' end,
      gia_ban_kg = case ma when 'C-THANNGOAI' then 900000 when 'C-THANNOI' then 1200000
                           when 'C-THANLUNG' then 1000000 end
    where ma in ('C-THANNGOAI', 'C-THANNOI', 'C-THANLUNG', 'P-GAN')`);
  ok('Quản lý đặt mã cân, nơi để sau pha, giá bán', d.loi === null, d.loi ?? '');
  const sai = await duoi(UID.qlA, `update kho_mat_hang set noi_de_sau_pha = 'bep' where ma = 'C-NACVAI'`);
  ok('Nơi để sau pha chỉ nhận kho / quầy', sai.loi !== null);
  await duoi(UID.qlA, `insert into kho_mat_hang_gia (mat_hang_id, gia_tri_thu_hoi_kg) values ($1, $2)`,
             [MH['P-VUN'].id, GIA.vun]);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;

  // Công thức: thịt 60 + 15 = 75% (vụn 8% và mỡ bỏ 12% không tính vào thu hồi).
  const ct = await duoi(UID.qlA, `
    insert into kho_cong_thuc_pha (mat_hang_vao_id, ten) values ($1, 'Thăn ngoại chuẩn') returning id`,
    [MH['T-THANNGOAI'].id]);
  ok('Quản lý tạo công thức', ct.loi === null, ct.loi ?? '');
  for (const [ma, tl, xl] of [['C-THANNGOAI', 60, null], ['C-THANNOI', 15, null], ['P-VUN', 8, null], ['P-MO', 12, 'bo']]) {
    const r = await duoi(UID.qlA, `insert into kho_cong_thuc_pha_dong (cong_thuc_id, mat_hang_ra_id, ty_le_du_kien, xu_ly)
      values ($1, $2, $3, $4)`, [ct.rows[0].id, MH[ma].id, tl, xl]);
    if (r.loi) throw new Error(r.loi);
  }

  ncc = (await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC Thịt Úc') returning id`)).rows[0].id;
  const n10 = await ngay(-10);
  loA = await nhapHang([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 10, don_gia_kg: GIA.loA }], n10);
  loB = await nhapHang([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 10, don_gia_kg: GIA.loB }], n10);
  loC = await nhapHang([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 10, don_gia_kg: GIA.loC }], n10);
  ok('Có ba tảng thăn ngoại 10 kg nhập 10 ngày trước', loA && loB && loC && Number(loA.gia_tri) === 5000000);
  await doiSoat('Sau khi nhập tảng');
});

// ===========================================================================
await nhom('2 · QUÉT NHÃN: 3 NHÃN → 1 DÒNG 3 GÓI, GỬI LẠI KHÔNG CỘNG ĐÔI', async () => {
  const t = await luuPhien(UID.thuKhoA, { ngay: await ngay(-3), vao: [{ lo_id: loA.id, vi_tri_id: viTri.kho }] });
  ok('Thủ kho mở phiên pha (chưa có phần ra)', t.loi === null, t.loi ?? '');
  P1 = t.rows?.[0]?.phien_id;

  const ba = [nhan(301, 0.5), nhan(301, 0.48), nhan(301, 0.52)];
  ok('NV quầy KHÔNG quét vào phiên pha được', (await quet(UID.nvQuayA, P1, ba)).loi !== null);
  ok('Thủ kho chi nhánh khác KHÔNG quét được', (await quet(UID.thuKhoB, P1, ba)).loi !== null);
  ok('Kế toán KHÔNG quét được', (await quet(UID.keToanA, P1, ba)).loi !== null);

  const gui = maGui();
  const pb0 = (await phien(P1)).phien_ban;
  const q = await quet(UID.thuKhoA, P1, ba, gui);
  const kq = q.rows?.[0]?.kq;
  ok('Quét 3 nhãn thăn ngoại cắt lát', q.loi === null && kq.so_nhan === 3 && kq.da_co === false, q.loi ?? JSON.stringify(kq));
  ok('Kết quả: 1 món, 3 gói, 1,5 kg, để ở quầy',
     kq?.mon?.length === 1 && kq.mon[0].so_goi === 3 && Number(kq.mon[0].so_kg) === 1.5 && kq.mon[0].loai_vi_tri === 'quay',
     JSON.stringify(kq?.mon));
  ok('Tóm tắt kg: vào 10, thịt 1,5, thu hồi tạm 15%',
     Number(kq?.kg_vao) === 10 && Number(kq.kg_thit) === 1.5 && Number(kq.ty_le_thu_hoi) === 15, JSON.stringify(kq));
  ok('Phiên bản tăng sau mỗi lượt', kq?.phien_ban === pb0 + 1);
  let r = await dongRa(P1);
  ok('Trong phiên: đúng 1 dòng ra tu_quet, 3 gói, 1,5 kg, xử lý nhập kho, vị trí quầy',
     r.length === 1 && r[0].tu_quet && r[0].so_goi === 3 && Number(r[0].so_kg) === 1.5
       && r[0].xu_ly === 'nhap_kho' && r[0].vi_tri_id === viTri.quay, JSON.stringify(r));

  const lai = await quet(UID.thuKhoA, P1, ba, gui);
  ok('Gửi lại cùng lượt → da_co, không cộng đôi',
     lai.rows?.[0]?.kq?.da_co === true && lai.rows[0].kq.mon[0].so_goi === 3, lai.loi ?? JSON.stringify(lai.rows?.[0]?.kq));
  ok('Gửi lại không tăng phiên bản', (await phien(P1)).phien_ban === pb0 + 1);

  // Lượt 2: hai nhãn thăn nội + một nhãn sai số kiểm tra + một mã chưa gán + nhãn không kg.
  const hong = nhan(302, 1.2).slice(0, 12) + ((Number(nhan(302, 1.2)[12]) + 1) % 10);
  const q2 = await quet(UID.thuKhoA, P1, [nhan(302, 1.2), nhan(302, 1.3), hong, nhan(999, 1), nhan(302, 0)]);
  const k2 = q2.rows?.[0]?.kq;
  ok('Lượt 2: 2 nhãn được cộng, 3 nhãn lỗi trả về từng cái',
     q2.loi === null && k2.so_nhan === 2 && k2.loi.length === 3, q2.loi ?? JSON.stringify(k2?.loi));
  ok('Câu lỗi nói rõ: sai số kiểm tra / chưa gán / không có kg',
     /kiểm tra/.test(k2?.loi?.[0]?.loi) && /chưa gán/.test(k2?.loi?.[1]?.loi) && /bằng 0|không có số kg/.test(k2?.loi?.[2]?.loi),
     JSON.stringify(k2?.loi));
  ok('Món vừa quét lên đầu danh sách', k2?.mon?.[0]?.mat_hang_id === MH['C-THANNOI'].id);
  r = await dongRa(P1);
  const noi = r.find(x => x.ma === 'C-THANNOI');
  ok('Thăn nội: 2 gói 2,5 kg, cất kho lạnh (nơi để theo món)',
     noi?.so_goi === 2 && Number(noi.so_kg) === 2.5 && noi.vi_tri_id === viTri.kho, JSON.stringify(noi));

  const tang = await quet(UID.thuKhoA, P1, [nhan(303, 1)]);
  ok('Nhãn món khác vẫn quét được (thăn lưng)', tang.rows?.[0]?.kq?.so_nhan === 1, tang.loi ?? '');
  await doiSoat('Phiên nháp không chạm sổ');
});

// ===========================================================================
await nhom('3 · −1, BỎ LƯỢT, XÓA MÓN — CHỐNG BẤM HAI LẦN', async () => {
  const gui = maGui();
  const b = await boQuet(UID.thuKhoA, P1, 'bot_mot', MH['C-THANNOI'].id, gui);
  const noi = b.rows?.[0]?.kq?.mon?.find(m => m.mat_hang_id === MH['C-THANNOI'].id);
  ok('−1 thăn nội: bỏ nhãn quét sau cùng (1,3 kg) → 1 gói 1,2 kg',
     b.loi === null && noi?.so_goi === 1 && Number(noi.so_kg) === 1.2, b.loi ?? JSON.stringify(noi));
  const b2 = await boQuet(UID.thuKhoA, P1, 'bot_mot', MH['C-THANNOI'].id, gui);
  ok('Bấm −1 hai lần (cùng mã gửi) → chỉ bớt một',
     b2.rows?.[0]?.kq?.da_co === true && (await dongRa(P1)).find(x => x.ma === 'C-THANNOI')?.so_goi === 1);

  const x = await boQuet(UID.thuKhoA, P1, 'xoa_mon', MH['C-THANLUNG'].id);
  ok('Xóa món thăn lưng → dòng của món biến mất',
     x.loi === null && !(await dongRa(P1)).some(d => d.ma === 'C-THANLUNG'), x.loi ?? '');
  const xl = await boQuet(UID.thuKhoA, P1, 'bot_mot', MH['C-THANLUNG'].id);
  ok('−1 món không còn nhãn nào → báo rõ', xl.loi !== null && /chưa quét nhãn nào/.test(xl.loi), xl.loi ?? '');

  // Bỏ lượt: lượt gần nhất CÒN NHÃN của chính người bấm.
  const ql = await boQuet(UID.qlA, P1, 'lan_cuoi');
  ok('Quản lý chưa quét lượt nào → không bỏ được lượt của thủ kho', ql.loi !== null && /chưa có lượt/.test(ql.loi), ql.loi ?? '');
  const lc = await boQuet(UID.thuKhoA, P1, 'lan_cuoi');
  ok('Thủ kho bỏ lượt cuối còn nhãn (lượt 2: nhãn thăn nội còn lại) → món thăn nội hết',
     lc.loi === null && lc.rows[0].kq.so_nhan === 1 && !(await dongRa(P1)).some(d => d.ma === 'C-THANNOI'),
     lc.loi ?? JSON.stringify(lc.rows?.[0]?.kq));
  ok('Thăn ngoại cắt lát vẫn 3 gói', (await dongRa(P1)).find(d => d.ma === 'C-THANNGOAI')?.so_goi === 3);
  ok('Cách sửa lạ bị từ chối', (await boQuet(UID.thuKhoA, P1, 'xoa_het', null)).loi !== null);
  ok('NV quầy KHÔNG sửa được nhãn đã quét', (await boQuet(UID.nvQuayA, P1, 'lan_cuoi')).loi !== null);

  const q = await quet(UID.thuKhoA, P1, [nhan(302, 1.25), nhan(302, 1.25)]);
  ok('Quét lại hai gói thăn nội cùng cân nặng (cùng mã) → 2 gói, 2,5 kg',
     q.rows?.[0]?.kq?.mon?.find(m => m.mat_hang_id === MH['C-THANNOI'].id)?.so_goi === 2
       && Number(q.rows[0].kq.mon.find(m => m.mat_hang_id === MH['C-THANNOI'].id).so_kg) === 2.5,
     q.loi ?? JSON.stringify(q.rows?.[0]?.kq?.mon));
  await doiSoat('Sau sửa nhãn');
});

// ===========================================================================
await nhom('4 · LƯU PHIÊN: GÕ TAY PHỤ PHẨM, KHÔNG ĐỤNG DÒNG QUÉT', async () => {
  const vao = [{ lo_id: loA.id, vi_tri_id: viTri.kho }];
  const ra = [
    { mat_hang_id: MH['P-VUN'].id, so_kg: 0.5, xu_ly: 'chuyen_bep' },
    { mat_hang_id: MH['P-MO'].id, so_kg: 1, xu_ly: 'bo' },
  ];
  let pb = (await phien(P1)).phien_ban;
  const cu = await luuPhien(UID.thuKhoA, { id: P1, phienBan: pb - 1, ngay: await ngay(-3), vao, ra });
  ok('Lưu với phiên bản cũ bị từ chối', cu.loi !== null && /máy khác/.test(cu.loi), cu.loi ?? '');

  const trung = await luuPhien(UID.thuKhoA, { id: P1, phienBan: pb, ngay: await ngay(-3), vao,
    ra: [...ra, { mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 1, so_goi: 2, xu_ly: 'nhap_kho', vi_tri_id: viTri.quay }] });
  ok('Dòng gõ tay trùng món đã quét bị từ chối', trung.loi !== null && /đã quét nhãn/.test(trung.loi), trung.loi ?? '');

  const diDuong = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'dang_chuyen'`, [cnA.id])).rows[0].id;
  const dd = await luuPhien(UID.thuKhoA, { id: P1, phienBan: pb, ngay: await ngay(-3), vao,
    ra: [...ra, { mat_hang_id: MH['C-BACHI'].id, so_kg: 1, so_goi: 2, xu_ly: 'nhap_kho', vi_tri_id: diDuong }] });
  ok('Chọn "Đang mang ra quầy" làm nơi để bị từ chối', dd.loi !== null && /kho hoặc quầy/.test(dd.loi), dd.loi ?? '');

  const l = await luuPhien(UID.thuKhoA, { id: P1, phienBan: pb, ngay: await ngay(-3), vao, ra });
  ok('Lưu phụ phẩm gõ kg', l.loi === null, l.loi ?? '');
  let r = await dongRa(P1);
  ok('Dòng quét vẫn nguyên, dòng gõ tay đứng sau: 4 dòng',
     r.length === 4 && r.filter(d => d.tu_quet).length === 2 && r.at(-1).ma === 'P-MO' && r[0].tu_quet && r[1].tu_quet,
     JSON.stringify(r.map(d => [d.ma, d.tu_quet, d.thu_tu])));

  // Gõ tay một món rồi quét nhãn món đó → nhãn bị từ chối (không đè số gõ tay).
  pb = (await phien(P1)).phien_ban;
  const tay = await luuPhien(UID.thuKhoA, { id: P1, phienBan: pb, ngay: await ngay(-3), vao,
    ra: [...ra, { mat_hang_id: MH['C-THANLUNG'].id, so_kg: 0.3, so_goi: 1, xu_ly: 'nhap_kho', vi_tri_id: viTri.kho }] });
  ok('Gõ tay 1 gói thăn lưng', tay.loi === null, tay.loi ?? '');
  const q = await quet(UID.thuKhoA, P1, [nhan(303, 0.3)]);
  ok('Quét nhãn món đã gõ tay → nhãn bị trả về, báo xóa dòng gõ tay trước',
     q.loi === null && q.rows[0].kq.so_nhan === 0 && /bằng tay/.test(q.rows[0].kq.loi?.[0]?.loi), q.loi ?? JSON.stringify(q.rows?.[0]?.kq));
  pb = (await phien(P1)).phien_ban;
  const bo = await luuPhien(UID.thuKhoA, { id: P1, phienBan: pb, ngay: await ngay(-3), vao, ra });
  ok('Lưu lại không có thăn lưng → dòng gõ tay mất, dòng quét còn',
     bo.loi === null && (await dongRa(P1)).length === 4 && !(await dongRa(P1)).some(d => d.ma === 'C-THANLUNG'));

  const x = await tk(`select kho_xem_thu_phien_pha_kg($1) as t`, [P1]);
  const t = x.rows?.[0]?.t;
  ok('Xem thử chỉ kg: thịt 4 kg / 10 → 40%, dự kiến 75% theo công thức',
     x.loi === null && Number(t.kg_thit) === 4 && Number(t.ty_le_thu_hoi) === 40
       && Number(t.ty_le_du_kien) === 75 && t.nguon_du_kien === 'cong_thuc' && Number(t.nguong_thu_hoi_diem) === 3,
     x.loi ?? JSON.stringify(t));
  ok('Dòng xem thử có số gói, dòng quét đánh dấu tu_quet',
     t?.dong?.[0]?.tu_quet === true && t.dong[0].so_goi === 3 && t.dong.at(-1).tu_quet === false);
  ok('Chưa có phiên nào chốt → TB 30 ngày trống', t?.ty_le_tb_30_ngay === null);
  await doiSoat('Sau lưu nháp');
});

// ===========================================================================
await nhom('5 · CHỐT: LÔ ĐÚNG VỊ TRÍ, GIÁ VỐN BẢO TOÀN, THU HỒI THẤP BÁO QUẢN LÝ', async () => {
  const pb = (await phien(P1)).phien_ban;
  const c = await tk(`select kho_chot_phien_pha($1, $2) as cau`, [P1, pb]);
  const cau = c.rows?.[0]?.cau ?? '';
  ok('Thủ kho chốt phiên (không cần duyệt)', c.loi === null && /40,00%/.test(cau), c.loi ?? cau);
  ok('Câu chốt nói thu hồi thấp, đã báo quản lý', /thấp hơn dự kiến \(75,00%\).*báo quản lý/.test(cau), cau);

  const { rows: lo } = await db.query(`
    select m.ma, t.vi_tri_id, t.so_goi, t.so_kg from kho_lo l
    join kho_mat_hang m on m.id = l.mat_hang_id join kho_ton t on t.lo_id = l.id
    where l.phien_pha_id = $1 and (t.so_kg > 0 or t.so_goi > 0) order by m.ma`, [P1]);
  const ngoai = lo.find(x => x.ma === 'C-THANNGOAI');
  const noi = lo.find(x => x.ma === 'C-THANNOI');
  ok('Thăn ngoại cắt lát: lô ở QUẦY, 3 gói, 1,5 kg',
     ngoai?.vi_tri_id === viTri.quay && ngoai.so_goi === 3 && Number(ngoai.so_kg) === 1.5, JSON.stringify(lo));
  ok('Thăn nội: lô ở KHO LẠNH, 2 gói, 2,5 kg',
     noi?.vi_tri_id === viTri.kho && noi.so_goi === 2 && Number(noi.so_kg) === 2.5, JSON.stringify(lo));
  ok('Thịt vụn chuyển thẳng bếp — không còn tồn', !lo.some(x => x.ma === 'P-VUN'));
  ok('Tổng giá vốn các lô ra = giá vốn tảng vào (5.000.000đ), đúng từng đồng', await tongGiaVonRa(P1) === 5000000,
     `${await tongGiaVonRa(P1)}`);

  const f = await phien(P1);
  ok('Phiên ghi dự kiến 75 (công thức) và cờ thu hồi thấp',
     Number(f.ty_le_du_kien) === 75 && f.nguon_du_kien === 'cong_thuc' && f.thu_hoi_thap === true && f.da_xem_luc === null);

  ok('Quét thêm vào phiên đã chốt bị chặn', (await quet(UID.thuKhoA, P1, [nhan(301, 0.5)])).loi !== null);
  ok('Bỏ lượt ở phiên đã chốt bị chặn', (await boQuet(UID.thuKhoA, P1, 'lan_cuoi')).loi !== null);

  const skQl = await suKien(UID.qlA, 'thu_hoi_thap');
  ok('Quản lý có sự kiện thu_hoi_thap: số phiên, tên tảng, thu hồi 40, dự kiến 75',
     skQl.length === 1 && skQl[0].ref_id === P1 && skQl[0].ma === f.so_phieu && skQl[0].ten === 'Thăn ngoại nguyên tảng'
       && Number(skQl[0].so) === 40 && Number(skQl[0].phu) === 75 && skQl[0].nhom === 'nhac_nho',
     JSON.stringify(skQl));
  ok('Chủ nhà hàng cũng thấy', (await suKien(UID.chu, 'thu_hoi_thap')).length === 1);
  ok('Thủ kho KHÔNG có sự kiện thu hồi thấp', (await suKien(UID.thuKhoA, 'thu_hoi_thap')).length === 0);
  ok('Kế toán, NV quầy KHÔNG có', (await suKien(UID.keToanA, 'thu_hoi_thap')).length === 0
     && (await suKien(UID.nvQuayA, 'thu_hoi_thap')).length === 0);
  ok('Số đỏ quản lý thu_hoi_thap = 1', (await demViec(UID.qlA)).thu_hoi_thap === 1);
  ok('Số đỏ thủ kho không có khóa thu_hoi_thap', !('thu_hoi_thap' in await demViec(UID.thuKhoA)));
  await doiSoat('Sau chốt phiên 1');
});

// ===========================================================================
await nhom('6 · "ĐÃ XEM" → HẾT SỰ KIỆN', async () => {
  const x = await tk(`select kho_xac_nhan_phien_pha(p_id => $1, p_ghi_chu => null) as cau`, [P1]);
  ok('Thủ kho KHÔNG bấm "Đã xem" được', x.loi !== null);
  const kt = await duoi(UID.keToanA, `select kho_xac_nhan_phien_pha(p_id => $1, p_ghi_chu => null) as cau`, [P1]);
  ok('Kế toán KHÔNG bấm được', kt.loi !== null);
  const qlB = await duoi(UID.qlB, `select kho_xac_nhan_phien_pha(p_id => $1, p_ghi_chu => null) as cau`, [P1]);
  ok('Quản lý chi nhánh khác KHÔNG bấm được', qlB.loi !== null);

  const pb = (await phien(P1)).phien_ban;
  const q = await duoi(UID.qlA, `select kho_xac_nhan_phien_pha(p_id => $1, p_ghi_chu => $2) as cau`,
    [P1, '  Tảng nhiều mỡ, đã báo NCC  ']);
  ok('Quản lý bấm "Đã xem" kèm ghi chú', q.loi === null && /Đã ghi nhận/.test(q.rows?.[0]?.cau), q.loi ?? '');
  const f = await phien(P1);
  ok('Ghi người xem, giờ xem, ghi chú (bỏ khoảng trắng); không đổi phiên bản',
     f.da_xem_boi !== null && f.da_xem_luc !== null && f.da_xem_ghi_chu === 'Tảng nhiều mỡ, đã báo NCC' && f.phien_ban === pb);
  const lai = await duoi(UID.chu, `select kho_xac_nhan_phien_pha(p_id => $1, p_ghi_chu => null) as cau`, [P1]);
  ok('Bấm lại → "đã được xem", không đổi người xem',
     /đã được xem/.test(lai.rows?.[0]?.cau) && (await phien(P1)).da_xem_boi === f.da_xem_boi, lai.loi ?? '');
  ok('Hết sự kiện thu_hoi_thap', (await suKien(UID.qlA, 'thu_hoi_thap')).length === 0);
  ok('Số đỏ về 0', (await demViec(UID.qlA)).thu_hoi_thap === 0);
  ok('View danh sách có cờ và giờ xem, số nhãn đã quét',
     (await tk(`select thu_hoi_thap, da_xem_luc, so_nhan_quet, ty_le_du_kien from kho_v_phien_pha where id = $1`, [P1]))
       .rows?.[0]?.so_nhan_quet === 5);
});

// ===========================================================================
await nhom('7 · PHIÊN ĐẠT DỰ KIẾN; MÓN KHÔNG ĐẾM GÓI; KHÔNG CÔNG THỨC → TB 30 NGÀY', async () => {
  const t = await luuPhien(UID.thuKhoA, { ngay: await ngay(-1), vao: [{ lo_id: loB.id, vi_tri_id: viTri.kho }],
    ra: [{ mat_hang_id: MH['P-MO'].id, so_kg: 1.5, xu_ly: 'bo' }] });
  P2 = t.rows?.[0]?.phien_id;
  const nhanNgoai = Array.from({ length: 15 }, () => nhan(301, 0.5));
  const q = await quet(UID.thuKhoA, P2, [...nhanNgoai, nhan(401, 0.3), nhan(401, 0.2)]);
  const gan = q.rows?.[0]?.kq?.mon?.find(m => m.mat_hang_id === MH['P-GAN'].id);
  ok('Quét 15 gói thăn ngoại + 2 khay gân', q.loi === null && q.rows[0].kq.so_nhan === 17, q.loi ?? '');
  ok('Gân (không đếm gói): 0 gói, 0,5 kg, vào kho lạnh (không cài nơi để)',
     gan?.so_goi === 0 && Number(gan.so_kg) === 0.5 && gan.loai_vi_tri === 'kho', JSON.stringify(gan));
  const x = await tk(`select kho_xem_thu_phien_pha_kg($1) as t`, [P2]);
  ok('Thu hồi 75%, TB 30 ngày = 40% (phiên 1)',
     Number(x.rows?.[0]?.t?.ty_le_thu_hoi) === 75 && Number(x.rows[0].t.ty_le_tb_30_ngay) === 40, JSON.stringify(x.rows?.[0]?.t));
  const c = await tk(`select kho_chot_phien_pha($1, $2) as cau`, [P2, (await phien(P2)).phien_ban]);
  ok('Chốt: đạt dự kiến → không báo', c.loi === null && !/báo quản lý/.test(c.rows[0].cau)
     && (await phien(P2)).thu_hoi_thap === false, c.loi ?? c.rows?.[0]?.cau);
  ok('Tổng giá vốn phiên 2 bảo toàn (5.200.000đ)', await tongGiaVonRa(P2) === 5200000, `${await tongGiaVonRa(P2)}`);
  ok('Không có sự kiện thu hồi thấp mới', (await suKien(UID.qlA, 'thu_hoi_thap')).length === 0);

  // Tắt công thức → dự kiến = TB 30 ngày theo kg: (4 + 7,5) ÷ 20 = 57,5%.
  await duoi(UID.qlA, `update kho_cong_thuc_pha set dang_dung = false where mat_hang_vao_id = $1`, [MH['T-THANNGOAI'].id]);
  const t3 = await luuPhien(UID.thuKhoA, { vao: [{ lo_id: loC.id, vi_tri_id: viTri.kho }] });
  P3 = t3.rows?.[0]?.phien_id;
  await quet(UID.thuKhoA, P3, Array.from({ length: 10 }, () => nhan(301, 0.5)));
  const x3 = (await tk(`select kho_xem_thu_phien_pha_kg($1) as t`, [P3])).rows?.[0]?.t;
  ok('Không công thức: dự kiến = TB 30 ngày 57,5%',
     Number(x3?.ty_le_du_kien) === 57.5 && x3.nguon_du_kien === 'tb_30_ngay', JSON.stringify(x3));
  const c3 = await tk(`select kho_chot_phien_pha($1, $2) as cau`, [P3, (await phien(P3)).phien_ban]);
  ok('Chốt 50% < 57,5 − 3 → thu hồi thấp', c3.loi === null && (await phien(P3)).thu_hoi_thap === true, c3.loi ?? '');
  ok('Quản lý có một sự kiện (phiên 3)', (await suKien(UID.qlA, 'thu_hoi_thap')).map(e => e.ref_id).join() === P3);

  const m = await tk(`select kho_mo_lai_phien_pha($1, 'Cân nhầm') as cau`, [P3]);
  ok('Mở lại phiên 3 → hết cờ, hết sự kiện',
     m.loi === null && (await phien(P3)).thu_hoi_thap === false && (await suKien(UID.qlA, 'thu_hoi_thap')).length === 0,
     m.loi ?? '');
  ok('Mở lại: dòng quét vẫn còn, quét tiếp được', (await quet(UID.thuKhoA, P3, [nhan(301, 0.5)])).rows?.[0]?.kq?.mon?.[0]?.so_goi === 11);
  const c4 = await tk(`select kho_chot_phien_pha($1, $2) as cau`, [P3, (await phien(P3)).phien_ban]);
  ok('Chốt lại (55% < 54,5? không) → không báo', c4.loi === null && (await phien(P3)).thu_hoi_thap === false,
     c4.loi ?? c4.rows?.[0]?.cau);
  ok('Tổng giá vốn phiên 3 bảo toàn (4.800.000đ)', await tongGiaVonRa(P3) === 4800000, `${await tongGiaVonRa(P3)}`);
  await doiSoat('Sau ba phiên');
});

// ===========================================================================
await nhom('8 · THẺ KHO: ĐẦU KỲ, BIẾN ĐỘNG, TỒN LŨY KẾ = kho_ton', async () => {
  const the = (uid, mh, vt, tu, den) => (uid === UID.thuKhoA ? tk : (s, p) => duoi(uid, s, p))(`
    select *, ngay::text as ngay_chu from kho_the_kho(p_chi_nhanh_id => $1, p_mat_hang_id => $2, p_vi_tri_id => $3,
                              p_tu => $4::date, p_den => $5::date)`, [cnA.id, mh, vt, tu, den]);

  // Chuyển 2 gói thăn ngoại cắt lát quầy → kho để có dòng chuyển.
  const ch = await tk(`select * from kho_tao_phieu_xuat($1, $2, 'chuyen', $3, $4, null, null, '{}'::text[], $5::jsonb)`,
    [cnA.id, maGui(), viTri.quay, viTri.kho, JSON.stringify([{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 2 }])]);
  ok('Chuyển 2 gói từ quầy về kho', ch.loi === null, ch.loi ?? '');

  // Mọi món, mọi vị trí: tồn cuối cả chi nhánh = tổng kho_ton; từng lô × vị trí khớp.
  const { rows: mh } = await db.query(`select distinct mat_hang_id from kho_so_cai where chi_nhanh_id = $1`, [cnA.id]);
  const lech = [];
  for (const { mat_hang_id } of mh) {
    const r = await the(UID.thuKhoA, mat_hang_id, null, null, null);
    if (r.loi) { lech.push(r.loi); continue; }
    const cuoi = r.rows.at(-1);
    const { rows: [t] } = await db.query(`select coalesce(sum(so_kg), 0) as kg, coalesce(sum(so_goi), 0)::int as goi
      from kho_ton where chi_nhanh_id = $1 and mat_hang_id = $2`, [cnA.id, mat_hang_id]);
    if (Number(cuoi.ton_kg) !== Number(t.kg) || cuoi.ton_goi !== t.goi) lech.push(`${mat_hang_id}: thẻ ${cuoi.ton_kg}/${cuoi.ton_goi} ≠ tồn ${t.kg}/${t.goi}`);
    const gop = new Map();
    for (const d of r.rows.slice(1)) {
      const k = `${d.lo_id}|${d.vi_tri_id}`;
      const g = gop.get(k) ?? { kg: 0, goi: 0 };
      g.kg += Number(d.nhap_kg) - Number(d.xuat_kg); g.goi += d.nhap_goi - d.xuat_goi;
      gop.set(k, g);
    }
    const { rows: ton } = await db.query(`select lo_id, vi_tri_id, so_kg, so_goi from kho_ton where mat_hang_id = $1`, [mat_hang_id]);
    for (const x of ton) {
      const g = gop.get(`${x.lo_id}|${x.vi_tri_id}`) ?? { kg: 0, goi: 0 };
      if (Math.abs(g.kg - Number(x.so_kg)) > 1e-9 || g.goi !== x.so_goi) lech.push(`lô ${x.lo_id} @ ${x.vi_tri_id}: ${g.kg}/${g.goi} ≠ ${x.so_kg}/${x.so_goi}`);
    }
    // Tồn lũy kế từng dòng = dòng trước + nhập − xuất.
    for (let i = 1; i < r.rows.length; i++) {
      const a = r.rows[i - 1], b = r.rows[i];
      if (Math.abs(Number(a.ton_kg) + Number(b.nhap_kg) - Number(b.xuat_kg) - Number(b.ton_kg)) > 1e-9) { lech.push(`lũy kế dòng ${i}`); break; }
    }
  }
  ok(`Thẻ kho ${mh.length} món: tồn cuối = kho_ton (cả chi nhánh, từng lô × vị trí), lũy kế đúng`, mh.length >= 5 && lech.length === 0,
     lech.slice(0, 5).join(' · '));

  // Lọc vị trí: thăn ngoại cắt lát ở quầy.
  const q = await the(UID.thuKhoA, MH['C-THANNGOAI'].id, viTri.quay, null, null);
  const { rows: [tq] } = await db.query(`select coalesce(sum(so_goi), 0)::int as goi from kho_ton where mat_hang_id = $1 and vi_tri_id = $2`,
    [MH['C-THANNGOAI'].id, viTri.quay]);
  ok('Lọc quầy: tồn cuối = tồn ở quầy; có dòng "Chuyển đi"',
     q.loi === null && q.rows.at(-1).ton_goi === tq.goi && q.rows.some(d => d.loai === 'chuyen_di' && d.xuat_goi === 2),
     q.loi ?? JSON.stringify(q.rows?.at(-1)));
  ok('Mọi dòng lọc quầy đều ở quầy', q.rows?.slice(1).every(d => d.vi_tri_id === viTri.quay));

  // Tảng: nhập 30 kg 10 ngày trước; pha 10 kg ngày −3, −1, hôm nay (có mở lại).
  const tang = MH['T-THANNGOAI'].id;
  const d1 = await the(UID.thuKhoA, tang, null, await ngay(-2), null);
  ok('Từ ngày −2: dòng đầu "Tồn đầu kỳ" = 20 kg, 2 tảng',
     d1.loi === null && d1.rows[0].loai === 'dau_ky' && d1.rows[0].ten_loai === 'Tồn đầu kỳ'
       && Number(d1.rows[0].ton_kg) === 20 && d1.rows[0].ton_goi === 2 && d1.rows[0].ngay_chu === await ngay(-2),
     d1.loi ?? JSON.stringify(d1.rows?.[0]));
  ok('Cuối kỳ: 0 kg (đã pha hết); có dòng đảo ngược khi mở lại',
     Number(d1.rows?.at(-1)?.ton_kg) === 0 && d1.rows.some(d => d.loai === 'dao_nguoc'));
  const d2 = await the(UID.thuKhoA, tang, null, await ngay(-3), await ngay(-2));
  ok('Từ −3 đến −2: đầu kỳ 30 kg, một dòng đem pha 10 kg, cuối 20 kg, số chứng từ PL-',
     d2.rows?.length === 2 && Number(d2.rows[0].ton_kg) === 30 && d2.rows[1].loai === 'pha_loc_vao'
       && Number(d2.rows[1].xuat_kg) === 10 && Number(d2.rows[1].ton_kg) === 20
       && /^PL-/.test(d2.rows[1].so_chung_tu) && d2.rows[1].chung_tu_id === P1 && d2.rows[1].ten_loai === 'Đem pha lóc',
     JSON.stringify(d2.rows));
  const d3 = await the(UID.thuKhoA, tang, null, null, await ngay(-10));
  ok('Không lọc từ ngày: đầu kỳ 0; nhập có số phiếu PN- và diễn giải nhà cung cấp',
     Number(d3.rows?.[0]?.ton_kg) === 0 && d3.rows.length === 4 && /^PN-/.test(d3.rows[1].so_chung_tu)
       && d3.rows[1].dien_giai === 'Nhập từ NCC Thịt Úc' && Number(d3.rows.at(-1).ton_kg) === 30, JSON.stringify(d3.rows));

  const nv = await the(UID.nvQuayA, MH['C-THANNGOAI'].id, viTri.quay, null, null);
  ok('NV quầy xem được thẻ kho', nv.loi === null && nv.rows.length > 1, nv.loi ?? '');
  ok('Thu ngân KHÔNG xem được', (await the(UID.thuNganA, tang, null, null, null)).loi !== null);
  ok('Thủ kho chi nhánh khác KHÔNG xem được', (await the(UID.thuKhoB, tang, null, null, null)).loi !== null);
  const vtB = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'kho'`, [cnB.id])).rows[0].id;
  ok('Vị trí chi nhánh khác bị từ chối', (await the(UID.qlA, tang, vtB, null, null)).loi !== null);
  const nguoc = await the(UID.qlA, tang, null, homNay, await ngay(-1));
  ok('Từ ngày sau đến ngày bị từ chối', nguoc.loi !== null && /Từ ngày/.test(nguoc.loi), nguoc.loi ?? '');
  await doiSoat('Sau thẻ kho');
});

// ===========================================================================
await nhom('9 · THỦ KHO KHÔNG THẤY TIỀN', async () => {
  const tim = thuKhoThay.flatMap(r => typeof r === 'string' ? [] : khoaTien(r));
  ok(`${thuKhoThay.length} kết quả / câu lỗi thủ kho nhận: không khóa tiền nào`,
     thuKhoThay.length >= 30 && tim.length === 0, [...new Set(tim)].slice(0, 10).join(', '));
  const lo = thuKhoThay.map(r => typeof r === 'string' ? r : JSON.stringify(r)).filter(coTien);
  ok('Không số tiền nào lọt ra (câu chốt, câu lỗi, thẻ kho)', lo.length === 0, lo.slice(0, 3).join(' | '));

  for (const bang of ['kho_phien_pha_quet', 'kho_phien_pha_lan_quet']) {
    const t = await duoi(UID.thuKhoA, `select count(*)::int as n from ${bang}`);
    const n = await duoi(UID.nvQuayA, `select count(*)::int as n from ${bang}`);
    ok(`${bang}: thủ kho đọc được, NV quầy không`, t.rows?.[0]?.n > 0 && n.rows?.[0]?.n === 0);
  }
  const x = await duoi(UID.nvQuayA, `select kho_xem_thu_phien_pha_kg($1)`, [P1]);
  ok('NV quầy vẫn KHÔNG xem được phiên pha', x.loi !== null);
  await doiSoat('Cuối cùng');
});

process.exit(ketThuc('PHA LÓC QUÉT NHÃN, THU HỒI THẤP, THẺ KHO'));
