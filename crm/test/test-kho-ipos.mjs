/**
 * BEEFTOWN KHO — Kiểm thử đồng bộ bán hàng iPOS (0037, GĐ7a)
 * ==========================================================
 *
 *     node test/test-kho-ipos.mjs
 *
 * PHẦN DATABASE. Những điều phải đúng tuyệt đối:
 *   · chỉ chủ, quản lý và máy may_ipos đồng bộ được; máy không đọc được gì,
 *     không gọi được hàm nào khác, không sang chi nhánh khác;
 *   · khóa lượt (10 phút) và giới hạn "Cập nhật ngay" 60 giây;
 *   · gửi cùng HĐ hai lần không trừ hai lần; FEFO lô còn hạn trước; kg nhãn ≠
 *     kg sổ → hao_hut, lô về đúng 0/0; ngày sổ = ngày bán giờ VN;
 *   · thiếu hàng → thieu_hang (không lỗi, không hỏng lô) → chuyển + thử lại →
 *     da_ghi; tự nhận hàng đang mang ra quầy; hàng ngoài sổ;
 *   · chưa khớp → ghép mã → xử lý lại; HĐ hủy / sửa sau khi ghi → dao_nguoc;
 *   · bán trước mốc chuyển → bỏ qua; chặn gửi / duyệt kiểm kê quầy;
 *   · token không bao giờ vào database; câu lỗi bị xóa token.
 * Cuối mỗi nhóm: kho_doi_soat_ton() phải rỗng.
 *
 * Phần web (lib/kho/ipos.ts đọc JSON, dongBoIpos không lộ token, cron, grep
 * repo tìm token) nằm ở file riêng test-kho-ipos-web.mjs.
 */

import { dungDatabase, taoBoDem, UID, maGui, UID_MAY_IPOS, themMayIpos } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ ĐỒNG BỘ BÁN HÀNG iPOS');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
const nsMay = await themMayIpos(db, cnA, cnB);
const MAY = UID_MAY_IPOS.mayIposA;
const MAY_B = UID_MAY_IPOS.mayIposB;

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngaySau = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
// Token GIẢ, dựng lúc chạy: chuỗi "access_token=<dài>" không nằm nguyên văn trong
// file nào (test quét repo tìm token thật sẽ bắt nó).
const TOKEN_GIA = 'SECRET' + 'abcdef0123456789';
const THAM_SO_TOKEN = 'access' + '_token=' + TOKEN_GIA;
const phutTruoc = n => new Date(Date.now() - n * 60000).toISOString();

async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

const LA_TIEN = /gia|tien|thanh_tien|gia_von|gia_tri|doanh_thu|lai_gop/;
function khoaTien(v, duong = '') {
  const ra = [];
  if (Array.isArray(v)) v.forEach((x, i) => ra.push(...khoaTien(x, `${duong}[${i}]`)));
  else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      if (LA_TIEN.test(k)) ra.push(`${duong}.${k}`);
      ra.push(...khoaTien(x, `${duong}.${k}`));
    }
  }
  return ra;
}

// Nhãn cân mẫu 2XCCCCCWWWWWK: "20" + mã cân 5 số + gram 5 số + số kiểm tra.
function nhanCan(maCan, gram) {
  const s = '20' + String(maCan).padStart(5, '0') + String(gram).padStart(5, '0');
  let t = 0;
  for (let i = 0; i < 12; i++) t += (s.charCodeAt(i) - 48) * (i % 2 === 0 ? 1 : 3);
  return s + ((10 - (t % 10)) % 10);
}

const MH = {};
let viTri = {};
let ncc;

async function nhapHang(dong, vt) {
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cnA.id, maGui(), ncc, vt, homNay, JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  const gui = await duoi(UID.qlA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
  if (gui.loi) throw new Error(gui.loi);
  const duyet = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [p.phieu_id]);
  if (duyet.loi) throw new Error(duyet.loi);
  const { rows } = await db.query(`
    select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1 order by d.thu_tu`, [p.phieu_id]);
  return rows;
}

const xuat = (uid, t) => duoi(uid, `
  select * from kho_tao_phieu_xuat(
    p_chi_nhanh_id => $1, p_ma_gui => $2, p_loai => $3, p_vi_tri_id => $4, p_vi_tri_den_id => $5,
    p_ly_do_id => null, p_ghi_chu => null, p_anh => '{}'::text[], p_dong => $6::jsonb)`,
  [cnA.id, maGui(), t.loai, t.tu, t.den ?? null, JSON.stringify(t.dong ?? [])]);

const ton = async (loId, vt) => {
  const r = (await db.query(`select so_kg, so_goi from kho_ton where lo_id = $1 and vi_tri_id = $2`, [loId, vt])).rows[0];
  return r ? { kg: Number(r.so_kg), goi: r.so_goi } : { kg: 0, goi: 0 };
};
const tonHang = async (ma, vt) => {
  const r = (await db.query(`select coalesce(sum(so_goi), 0)::int as goi, coalesce(sum(so_kg), 0) as kg
    from kho_ton where mat_hang_id = $1 and vi_tri_id = $2`, [MH[ma].id, vt])).rows[0];
  return { goi: r.goi, kg: Number(r.kg) };
};
const soDongSo = async () => (await db.query(`select count(*)::int as n from kho_so_cai`)).rows[0].n;
const demViec = async uid => (await duoi(uid, `select kho_dem_viec($1) as v`, [cnA.id])).rows?.[0]?.v ?? {};
const suKien = async (uid, khoa) =>
  ((await duoi(uid, `select kho_thong_bao($1, 300) as v`, [cnA.id])).rows?.[0]?.v?.su_kien ?? [])
    .filter(e => e.khoa === khoa);
const trangThai = async (uid = UID.qlA) => (await duoi(uid, `select kho_ipos_trang_thai($1) as v`, [cnA.id])).rows?.[0]?.v;

/** Dòng iPOS của một HĐ, theo khóa dòng. */
const dongHd = async ma => (await db.query(`
  select d.* from kho_ipos_dong d join kho_ipos_hoa_don h on h.id = d.hoa_don_id
  where h.chi_nhanh_id = $1 and h.ma_hd = $2 order by d.khoa_dong`, [cnA.id, ma])).rows;
/** Dòng sổ kho của một dòng iPOS. */
const soCuaDong = async id => (await db.query(`
  select *, ngay::text as ngay from kho_so_cai where chung_tu_loai = 'ban_hang' and chung_tu_id = $1
  order by created_at`, [id])).rows;

const hd = (ma, luc, dong, huy = false) => ({ ma_hd: ma, thoi_diem_ban: luc, da_huy: huy, dong });

/** Một lượt đồng bộ trọn vẹn: bat_dau → nhan → ket_thuc. */
async function luot(hoaDon, { uid = MAY, cn = cnA.id, nguon = 'cron', denLuc = new Date().toISOString() } = {}) {
  const b = await duoi(uid, `select kho_ipos_bat_dau($1, $2) as kq`, [cn, nguon]);
  if (b.loi) return { loi: b.loi };
  const bd = b.rows[0].kq;
  if (!bd.duoc) return { tuChoi: bd.ly_do, bd };
  const n = await duoi(uid, `select kho_ipos_nhan($1, $2, $3::jsonb, $4::timestamptz) as kq`,
    [cn, bd.lan_id, JSON.stringify(hoaDon), denLuc]);
  const k = await duoi(uid, `select kho_ipos_ket_thuc($1, $2) as kq`, [bd.lan_id, n.loi]);
  return { bd, kq: n.rows?.[0]?.kq, loi: n.loi ?? k.loi };
}

let L1, L2, L3, V1, N1;
const TU_LUC = new Date(Date.now() - 3 * 86400000).toISOString();

// ===========================================================================
await nhom('1 · CHUẨN BỊ: KHO, HÀNG Ở QUẦY, CẤU HÌNH iPOS', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  await db.query(`update kho_mat_hang set ma_can = '101' where ma = 'C-THANNGOAI'`);
  await db.query(`update kho_mat_hang set ma_can = '102' where ma = 'C-NACVAI'`);
  await db.query(`update kho_mat_hang set ma_can = '201' where ma = 'P-VUN'`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  viTri = Object.fromEntries((await db.query(
    `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  ncc = (await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC A') returning id`)).rows[0].id;

  [L1, L2, L3] = await nhapHang([
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 2, so_kg: 1, don_gia_kg: 700000, han_dung: await ngaySau(-1) },
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 4, so_kg: 2, don_gia_kg: 700000, han_dung: await ngaySau(1) },
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 4, so_kg: 2.4, don_gia_kg: 700000, han_dung: await ngaySau(3) },
  ], viTri.quay);
  [V1] = await nhapHang([{ mat_hang_id: MH['P-VUN'].id, so_kg: 3, don_gia_kg: 80000, han_dung: await ngaySau(2) }], viTri.quay);
  [N1] = await nhapHang([{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 6, so_kg: 3, don_gia_kg: 400000, han_dung: await ngaySau(2) }], viTri.kho);
  ok('Quầy có 3 lô thăn (1 lô hết hạn), thịt vụn; kho có nạc vai', L1 && L2 && L3 && V1 && N1);
  ok('Hai máy iPOS (Q1, Q7) có hồ sơ nhân sự', !!nsMay.mayIposA && !!nsMay.mayIposB);

  const chuaBat = await luot([]);
  ok('Chưa cấu hình → bat_dau từ chối nhẹ (duoc = false), không lỗi', chuaBat.tuChoi && /chưa bật/.test(chuaBat.tuChoi),
     JSON.stringify(chuaBat));

  const cfg = { bat: true, pos_parent: 'SPOLHCM4', pos_id: '5898', vi_tri_ban_id: viTri.quay };
  const ql = await duoi(UID.qlA, `select kho_ipos_luu_cau_hinh($1, $2::jsonb)`, [cnA.id, JSON.stringify(cfg)]);
  ok('Quản lý KHÔNG sửa được kết nối iPOS (chỉ chủ)', ql.loi !== null, ql.loi ?? '');
  const chu = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb) as v`, [cnA.id, JSON.stringify(cfg)]);
  // 0042: iPOS tự đẩy hóa đơn — không cần đường dẫn lấy hóa đơn nữa.
  ok('Chủ lưu cấu hình (không cần đường dẫn hóa đơn — 0042)', chu.loi === null && chu.rows[0].v.bat === true
     && chu.rows[0].v.cau_hinh_du === true && chu.rows[0].v.den === 'vang', chu.loi ?? JSON.stringify(chu.rows?.[0]?.v));
  ok('api_url mặc định là máy thử iPOS', chu.rows?.[0]?.v?.api_url === 'https://apitest.foodbook.vn/ipos/ws/xpartner');
  const khongDuongDan = await luot([], { denLuc: null });
  ok('Không có đường dẫn hóa đơn vẫn chạy được lượt (0042)', khongDuongDan.bd?.duoc === true && !khongDuongDan.loi,
     JSON.stringify(khongDuongDan));
  await db.query(`update kho_ipos_lan_chay set bat_dau_luc = bat_dau_luc - interval '2 minutes'`);

  const tok1 = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb)`,
    [cnA.id, JSON.stringify({ api_url: 'https://apitest.foodbook.vn/ipos/ws/xpartner?' + THAM_SO_TOKEN })]);
  ok('Dán token vào api_url → từ chối, nhắc bí mật Worker', tok1.loi !== null && /IPOS_ACCESS_TOKEN/.test(tok1.loi), tok1.loi ?? '');
  const tok2 = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb)`,
    [cnA.id, JSON.stringify({ access_token: 'x' })]);
  ok('Khóa "access_token" → từ chối', tok2.loi !== null);
  const la = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb)`, [cnA.id, JSON.stringify({ mat_khau: 'x' })]);
  ok('Khóa lạ → từ chối', la.loi !== null && /không được nhận/.test(la.loi), la.loi ?? '');
  const kho = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb)`, [cnA.id, JSON.stringify({ vi_tri_ban_id: viTri.kho })]);
  ok('Quầy bán phải là vị trí loại quầy', kho.loi !== null && /loại quầy/.test(kho.loi), kho.loi ?? '');
  const du = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb) as v`,
    [cnA.id, JSON.stringify({ duong_dan_hoa_don: '/hoa-don' })]);
  ok('Thêm đường dẫn → cấu hình đủ, khóa khác giữ nguyên', du.rows?.[0]?.v?.cau_hinh_du === true
     && du.rows[0].v.pos_id === '5898', du.loi ?? '');
  const { rows: [{ n: coToken }] } = await db.query(
    `select count(*)::int as n from kho_ipos_cau_hinh where row_to_json(kho_ipos_cau_hinh)::text ~* 'token'`);
  ok('Không dòng cấu hình nào chứa chữ "token"', coToken === 0);
  await doiSoat('Chuẩn bị');
});

// ===========================================================================
await nhom('2 · AI ĐỒNG BỘ ĐƯỢC — MÁY KHÔNG LÀM ĐƯỢC GÌ KHÁC', async () => {
  for (const [ten, uid] of [['NV quầy', UID.nvQuayA], ['thủ kho', UID.thuKhoA], ['kế toán', UID.keToanA]]) {
    const r = await duoi(uid, `select kho_ipos_bat_dau($1, 'tay')`, [cnA.id]);
    ok(`${ten} KHÔNG đồng bộ được`, r.loi !== null && /không đồng bộ được/.test(r.loi), r.loi ?? 'GỌI ĐƯỢC');
  }
  const anon = await duoiAnon(`select kho_ipos_bat_dau($1, 'cron')`, [cnA.id]);
  ok('anon KHÔNG gọi được', anon.loi !== null && /permission denied/i.test(anon.loi), anon.loi ?? '');
  const b = await duoi(MAY, `select kho_ipos_bat_dau($1, 'cron')`, [cnB.id]);
  ok('Máy Q1 KHÔNG đồng bộ chi nhánh Q7', b.loi !== null, b.loi ?? '');
  const bB = await luot([], { uid: MAY_B });
  ok('Máy Q7 KHÔNG đồng bộ chi nhánh Q1', !!bB.loi, JSON.stringify(bB));

  const { rows: bang } = await db.query(
    `select tablename from pg_tables where schemaname = 'public' and tablename like 'kho\\_%' order by 1`);
  const lot = [];
  for (const { tablename } of bang) {
    const r = await duoi(MAY, `select count(*)::int as n from ${tablename}`);
    if (r.loi === null && r.rows[0].n > 0) lot.push(`${tablename}(${r.rows[0].n})`);
  }
  ok('Máy iPOS không đọc được dòng nào ở bảng kho', lot.length === 0, lot.join(', '));
  const v = await duoi(MAY, `select count(*)::int as n from kho_v_ipos_dong`);
  ok('Máy iPOS không đọc được danh sách dòng bán', v.rows?.[0]?.n === 0, v.loi ?? '');

  // Bảng / view CRM: máy không đọc được dữ liệu khách, đặt bàn, ứng tuyển, nhân
  // sự khác. Chỉ còn nội dung công bố (thực đơn, mẫu tin...) mà MỌI phiên đăng
  // nhập đọc được (co_phien_dang_nhap, 0011) và đúng 1 dòng nhan_su của chính nó.
  const { rows: crm } = await db.query(
    `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r','v','m') and c.relname not like 'kho\\_%' order by 1`);
  const lotCrm = [];
  for (const { relname } of crm) {
    const r = await duoi(MAY, `select count(*)::int as n from "${relname}"`);
    const n = r.loi === null ? r.rows[0].n : 0;
    if (n === 0) continue;
    if (relname === 'nhan_su' && n === 1) continue;
    const nv = await duoi(UID.nvQuayA, `select count(*)::int as n from "${relname}"`);
    if (nv.loi !== null || nv.rows[0].n < n) lotCrm.push(`${relname}(${n})`);
  }
  ok('Máy iPOS không đọc được gì ở CRM hơn một nhân viên quầy', lotCrm.length === 0, lotCrm.join(', '));
  for (const bang of ['khach_hang', 'dat_ban', 'so_cai_diem', 'luot_ghe', 'ho_so_ung_tuyen', 'nhat_ky_tin', 'su_kien_web']) {
    const r = await duoi(MAY, `select count(*)::int as n from ${bang}`);
    ok(`Máy iPOS không đọc được ${bang}`, r.loi !== null || r.rows[0].n === 0, r.loi ?? `${r.rows[0].n} dòng`);
  }

  const khac = [
    ['kho_tao_phieu_xuat', `select * from kho_tao_phieu_xuat(p_chi_nhanh_id => $1, p_ma_gui => gen_random_uuid(), p_loai => 'xuat_bep',
       p_vi_tri_id => $2, p_vi_tri_den_id => null, p_ly_do_id => null, p_ghi_chu => null, p_anh => '{}'::text[],
       p_dong => '[]'::jsonb)`, [cnA.id, viTri.quay]],
    ['kho_dem_viec', `select kho_dem_viec($1)`, [cnA.id]],
    ['kho_ipos_trang_thai', `select kho_ipos_trang_thai($1)`, [cnA.id]],
    ['kho_ipos_luu_cau_hinh', `select kho_ipos_luu_cau_hinh($1, '{"bat": false}'::jsonb)`, [cnA.id]],
    ['kho_ipos_chuyen_sang', `select kho_ipos_chuyen_sang($1, now())`, [cnA.id]],
    ['kho_ipos_gan_ma', `select kho_ipos_gan_ma($1, 'X', 'bo_qua', null)`, [cnA.id]],
    ['kho_bat_dau_kiem_ke', `select kho_bat_dau_kiem_ke($1, $2, 'theo_mat_hang', gen_random_uuid())`, [cnA.id, viTri.quay]],
  ];
  for (const [ham, sql, ts] of khac) {
    const r = await duoi(MAY, sql, ts);
    ok(`Máy iPOS KHÔNG gọi được ${ham}`, r.loi !== null, r.loi ?? 'GỌI ĐƯỢC');
  }
  const noiBo = await duoi(MAY, `select kho_ipos_ghi_dong(gen_random_uuid())`);
  ok('Không ai gọi thẳng được hàm nội bộ kho_ipos_ghi_dong', noiBo.loi !== null && /permission denied/i.test(noiBo.loi),
     noiBo.loi ?? '');
});

// ===========================================================================
await nhom('3 · KHÓA LƯỢT, GIỚI HẠN 60 GIÂY, CÂU LỖI KHÔNG CÓ TOKEN', async () => {
  const b1 = (await duoi(MAY, `select kho_ipos_bat_dau($1, 'cron') as kq`, [cnA.id])).rows[0].kq;
  ok('Máy bắt đầu lượt: có lan_id, cửa sổ, cấu hình — không token', b1.duoc && b1.lan_id && b1.pos_parent === 'SPOLHCM4'
     && b1.duong_dan_hoa_don === '/hoa-don' && !JSON.stringify(b1).includes('token'), JSON.stringify(b1));
  ok('Chưa có watermark, chưa chuyển → cửa sổ 1 giờ gần nhất',
     Math.abs(new Date(b1.den_luc) - new Date(b1.tu_luc) - 3600000) < 5000, `${b1.tu_luc} → ${b1.den_luc}`);
  const b2 = (await duoi(MAY, `select kho_ipos_bat_dau($1, 'cron') as kq`, [cnA.id])).rows[0].kq;
  ok('Lượt thứ hai trong lúc lượt đầu chạy → từ chối', !b2.duoc && /Đang có một lượt/.test(b2.ly_do), JSON.stringify(b2));
  const sai = await duoi(MAY, `select kho_ipos_nhan($1, gen_random_uuid(), '[]'::jsonb, null)`, [cnA.id]);
  ok('Gửi hóa đơn bằng lan_id lạ → từ chối', sai.loi !== null && /đã kết thúc hoặc quá hạn/.test(sai.loi), sai.loi ?? '');

  const loiCoToken = `fetch failed: GET https://apitest.foodbook.vn/ipos/ws/xpartner/hoa-don?${THAM_SO_TOKEN}&pos_id=5898 `
    + 'x'.repeat(400);
  const k = await duoi(MAY, `select kho_ipos_ket_thuc($1, $2) as kq`, [b1.lan_id, loiCoToken]);
  const { rows: [lan] } = await db.query(`select * from kho_ipos_lan_chay where id = $1`, [b1.lan_id]);
  ok('Kết thúc có lỗi: token bị thay bằng ***, cắt ≤ 300 ký tự',
     k.loi === null && !lan.loi.includes(TOKEN_GIA) && lan.loi.includes('access_token=***') && lan.loi.length <= 300,
     k.loi ?? lan.loi);
  const { rows: [cf] } = await db.query(`select * from kho_ipos_cau_hinh where chi_nhanh_id = $1`, [cnA.id]);
  ok('Khóa lượt được nhả; lỗi lần cuối được ghi (không token)', cf.dang_chay_tu === null && cf.lan_dang_chay === null
     && cf.lan_cuoi_loi && !cf.lan_cuoi_loi.includes(TOKEN_GIA) && cf.loi_tu_luc !== null);
  const lai = await duoi(MAY, `select kho_ipos_ket_thuc($1, null) as kq`, [b1.lan_id]);
  ok('Kết thúc lần hai → không đổi gì (da_co)', lai.rows?.[0]?.kq?.da_co === true);

  const tt = await trangThai();
  ok('Trạng thái: đèn đỏ khi lần cuối lỗi', tt?.den === 'do' && tt.mat_ket_noi === true, JSON.stringify(tt));
  const ev = await suKien(UID.qlA, 'ipos_mat_ket_noi');
  ok('Quản lý có thông báo "mất kết nối iPOS" (phu = loi)', ev.length === 1 && ev[0].phu === 'loi', JSON.stringify(ev));
  ok('Thủ kho không có thông báo đó', (await suKien(UID.thuKhoA, 'ipos_mat_ket_noi')).length === 0);

  const tay = await luot([], { uid: UID.qlA, nguon: 'tay' });
  ok('Quản lý bấm "Cập nhật ngay" < 60 giây sau lượt trước → chờ 1 phút', /đợi 1 phút/.test(tay.tuChoi ?? ''), JSON.stringify(tay));
  await db.query(`update kho_ipos_lan_chay set bat_dau_luc = bat_dau_luc - interval '2 minutes'`);
  const tay2 = await luot([], { uid: UID.qlA, nguon: 'tay' });
  ok('Sau 60 giây → quản lý đồng bộ được bằng phiên của mình', !tay2.loi && tay2.kq && tay2.bd?.duoc,
     JSON.stringify(tay2));
  ok('Lượt tốt → hết đèn đỏ, hết thông báo mất kết nối', (await trangThai()).den !== 'do'
     && (await suKien(UID.qlA, 'ipos_mat_ket_noi')).length === 0);

  // Khóa quá 10 phút = lượt đó hỏng: lượt mới chạy được, lượt cũ ghi lỗi.
  const b3 = (await duoi(MAY, `select kho_ipos_bat_dau($1, 'cron') as kq`, [cnA.id])).rows[0].kq;
  await db.query(`update kho_ipos_cau_hinh set dang_chay_tu = now() - interval '11 minutes' where chi_nhanh_id = $1`, [cnA.id]);
  const b4 = (await duoi(MAY, `select kho_ipos_bat_dau($1, 'cron') as kq`, [cnA.id])).rows[0].kq;
  const { rows: [cu] } = await db.query(`select * from kho_ipos_lan_chay where id = $1`, [b3.lan_id]);
  ok('Khóa quá 10 phút → lượt mới chạy được, lượt cũ ghi "quá 10 phút"',
     b4.duoc && cu.ket_thuc_luc && /Quá 10 phút/.test(cu.loi), JSON.stringify(b4));
  const cuNhan = await duoi(MAY, `select kho_ipos_nhan($1, $2, '[]'::jsonb, null)`, [cnA.id, b3.lan_id]);
  ok('Lượt cũ gửi hóa đơn → từ chối', cuNhan.loi !== null);
  await duoi(MAY, `select kho_ipos_ket_thuc($1, null)`, [b4.lan_id]);
  await doiSoat('Khóa lượt');
});

// ===========================================================================
await nhom('4 · CHƯA CHUYỂN NGUỒN → CHỜ; CHUYỂN SANG iPOS; BÁN TRƯỚC MỐC → BỎ QUA', async () => {
  const soTruoc = await soDongSo();
  const r = await luot([hd('HD0', phutTruoc(60), [{ ma_vach: nhanCan(201, 200), thanh_tien: 30000 }])]);
  const [d0] = await dongHd('HD0');
  ok('Chưa chuyển sang iPOS: dòng vào hộp thư, để "cho", không ghi sổ',
     r.kq?.hd_moi === 1 && d0?.trang_thai === 'cho' && /Chưa chuyển/.test(d0.ly_do) && await soDongSo() === soTruoc,
     JSON.stringify(r));
  ok('Dòng "cho" không tính vào việc của quản lý', (await demViec(UID.qlA)).ipos_cho_xu_ly === 0);

  const ql = await duoi(UID.qlA, `select kho_ipos_chuyen_sang($1, null)`, [cnA.id]);
  ok('Quản lý KHÔNG chuyển nguồn số bán được (chỉ chủ)', ql.loi !== null);
  const chuaDem = await duoi(UID.chu, `select kho_ipos_chuyen_sang($1, null)`, [cnA.id]);
  ok('Chưa có lần đếm quầy nào đã duyệt → phải chọn mốc', chuaDem.loi !== null && /chọn mốc/.test(chuaDem.loi), chuaDem.loi ?? '');
  const tuongLai = await duoi(UID.chu, `select kho_ipos_chuyen_sang($1, now() + interval '3 days')`, [cnA.id]);
  ok('Mốc quá 1 ngày tới → từ chối', tuongLai.loi !== null);
  const cs = await duoi(UID.chu, `select kho_ipos_chuyen_sang($1, $2::timestamptz) as v`, [cnA.id, TU_LUC]);
  const { rows: [cd] } = await db.query(`select nguon_so_ban from kho_cai_dat where chi_nhanh_id = $1`, [cnA.id]);
  const { rows: [cf] } = await db.query(`select * from kho_ipos_cau_hinh where chi_nhanh_id = $1`, [cnA.id]);
  ok('Chủ chuyển: nguồn số bán = ipos và mốc cùng lúc; watermark lùi về mốc',
     cs.loi === null && cd.nguon_so_ban === 'ipos' && +cf.ipos_tu_luc === +new Date(TU_LUC)
       && +cf.dong_bo_den_luc === +new Date(TU_LUC), cs.loi ?? '');

  const r2 = await luot([hd('HD-CU', phutTruoc(4 * 1440), [{ ma_vach: nhanCan(201, 500) }])]);
  ok('Cửa sổ lượt kế tiếp bắt đầu từ mốc (không trước mốc)', +new Date(r2.bd.tu_luc) === +new Date(TU_LUC), r2.bd?.tu_luc);
  const [cuD] = await dongHd('HD-CU');
  ok('Bán TRƯỚC mốc → bỏ qua (đã tính trong lần đếm quầy)', cuD?.trang_thai === 'bo_qua' && /trước mốc/.test(cuD.ly_do),
     JSON.stringify(cuD));
  const [d0b] = await dongHd('HD0');
  ok('Dòng "cho" cũ (sau mốc) được ghi ở lượt kế tiếp', d0b.trang_thai === 'da_ghi', JSON.stringify(d0b));
  ok('Thịt vụn ở quầy còn 2,8 kg', (await ton(V1.id, viTri.quay)).kg === 2.8);
  await doiSoat('Chuyển nguồn');
});

// ===========================================================================
await nhom('5 · FEFO, LỆCH KG NHÃN, LÔ VỀ 0/0, GỬI LẠI KHÔNG TRỪ HAI LẦN', async () => {
  const F1 = hd('HD-F1', phutTruoc(50), [{ khoa_dong: 'a', ma_ipos: 'CAN', ma_vach: nhanCan(101, 520), thanh_tien: 416000 }]);
  const r = await luot([F1]);
  const [d] = await dongHd('HD-F1');
  const so = await soCuaDong(d.id);
  ok('Bán 1 gói thăn: lấy lô CÒN HẠN gần nhất (L2), bỏ qua lô hết hạn L1',
     d.trang_thai === 'da_ghi' && so.every(s => s.lo_id === L2.id) && (await ton(L1.id, viTri.quay)).goi === 2,
     JSON.stringify({ d, so }));
  const ban = so.find(s => s.loai === 'ban');
  const tL2 = await ton(L2.id, viTri.quay);
  // 0104: trừ ĐÚNG kg trên nhãn, không hao hụt theo kg trung bình của gói (0,5) — lô giữ phần kg còn lại.
  ok('Kg nhãn 0,52 (kg TB của gói 0,5) → bán đúng 0,52 kg / 1 gói, KHÔNG dòng hao hụt (0104); L2 còn 3 gói 1,48 kg',
     so.length === 1 && Number(ban?.so_kg) === -0.52 && ban.so_goi === -1
       && tL2.goi === 3 && Math.abs(tL2.kg - 1.48) < 1e-9, JSON.stringify({ so, tL2 }));
  const ngayBan = (await db.query(`select ((thoi_diem_ban at time zone 'utc') + interval '7 hours')::date::text as d
    from kho_ipos_dong where id = $1`, [d.id])).rows[0].d;
  ok('Dòng sổ: chứng từ ban_hang = id dòng iPOS, ngày = ngày bán giờ VN', so.every(s => s.chung_tu_loai === 'ban_hang'
     && s.chung_tu_id === d.id && s.ngay === ngayBan), JSON.stringify(so.map(s => s.ngay)));
  ok('Dòng iPOS nhớ mã cân giải từ nhãn (101) và món', d.ma_can === '101' && d.mat_hang_id === MH['C-THANNGOAI'].id);
  ok('Kết quả lượt: 1 HĐ mới, 1 dòng đã ghi', r.kq?.hd_moi === 1 && r.kq.dong.da_ghi >= 1, JSON.stringify(r.kq));

  const truoc = await soDongSo();
  const lai = await luot([F1]);
  ok('Gửi lại đúng HĐ đó → trùng băm, không ghi thêm dòng sổ nào',
     lai.kq?.hd_trung === 1 && lai.kq.hd_moi === 0 && await soDongSo() === truoc, JSON.stringify(lai.kq));

  await luot([hd('HD-F2', phutTruoc(45), [
    { khoa_dong: '1', ma_vach: nhanCan(101, 490), thanh_tien: 392000 },
    { khoa_dong: '2', ma_vach: nhanCan(101, 510), thanh_tien: 408000 },
    { khoa_dong: '3', ma_vach: nhanCan(101, 470), thanh_tien: 376000 },
  ])]);
  const t2 = await ton(L2.id, viTri.quay);
  ok('Bán 3 gói cuối của L2 (kg nhãn lệch) → lô về ĐÚNG 0 gói 0 kg', t2.goi === 0 && t2.kg === 0, JSON.stringify(t2));
  const lechF2 = (await db.query(`select s.so_kg, s.ghi_chu from kho_so_cai s join kho_ipos_dong d on d.id = s.chung_tu_id
    join kho_ipos_hoa_don h on h.id = d.hoa_don_id where h.ma_hd = 'HD-F2' and s.loai = 'hao_hut'`)).rows;
  ok('…chỉ gói CUỐI ghi một dòng chênh lệch cân: 0,49 + 0,51 + 0,47 = 1,47 so với 1,48 còn lại → −0,01 kg (0104)',
     lechF2.length === 1 && Number(lechF2[0].so_kg) === -0.01 && /^Chênh lệch cân khi bán hết lô · iPOS HD-F2$/.test(lechF2[0].ghi_chu),
     JSON.stringify(lechF2));

  await luot([hd('HD-F3', phutTruoc(40), [{ so_goi: 5, so_kg: 2.9, ma_can: '101', thanh_tien: 2320000 }])]);
  const [d3] = await dongHd('HD-F3');
  const so3 = await soCuaDong(d3.id);
  ok('Bán 5 gói: 4 gói lô còn hạn L3 trước, 1 gói lô HẾT HẠN L1 — cờ lo_het_han',
     d3.trang_thai === 'da_ghi' && d3.lo_het_han === true
       && so3.filter(s => s.loai === 'ban' && s.lo_id === L3.id).reduce((a, s) => a - s.so_goi, 0) === 4
       && so3.filter(s => s.loai === 'ban' && s.lo_id === L1.id).reduce((a, s) => a - s.so_goi, 0) === 1,
     JSON.stringify(so3));
  ok('Web gửi sẵn ma_can (không mã vạch) cũng khớp được', d3.ma_can === '101');
  ok('Không lệch kg (2,9 = 2,4 + 0,5) → không có dòng hao_hut', !so3.some(s => s.loai === 'hao_hut'));
  await doiSoat('FEFO');
});

// ===========================================================================
await nhom('6 · 23:50 BÁN, 00:10 ĐỒNG BỘ → NGÀY SỔ LÀ NGÀY BÁN; GIỜ KHÔNG MÚI → +07:00', async () => {
  const homQua = await ngaySau(-1);
  await luot([hd('HD-D1', `${homQua}T23:50:00+07:00`, [{ ma_vach: nhanCan(201, 100), thanh_tien: 15000 }])]);
  const [d] = await dongHd('HD-D1');
  const so = await soCuaDong(d.id);
  ok('Bán 23:50 hôm qua (giờ VN) → dòng sổ ngày hôm qua, không phải ngày đồng bộ',
     d.trang_thai === 'da_ghi' && so.length === 1 && so[0].ngay === homQua, JSON.stringify(so.map(s => s.ngay)));

  await luot([hd('HD-D2', `${homNay}T00:05:00`, [{ ma_vach: nhanCan(201, 100) }])]);
  const { rows: [h] } = await db.query(`select thoi_diem_ban from kho_ipos_hoa_don where ma_hd = 'HD-D2'`);
  ok('Giờ không ghi múi → hiểu là giờ Việt Nam (+07:00)',
     +h.thoi_diem_ban === +new Date(`${homNay}T00:05:00+07:00`), String(h.thoi_diem_ban));
  const [d2] = await dongHd('HD-D2');
  ok('… và ngày sổ = hôm nay', (await soCuaDong(d2.id))[0]?.ngay === homNay);
  await doiSoat('Ngày bán');
});

// ===========================================================================
await nhom('7 · THIẾU HÀNG → KHÔNG LỖI → CHUYỂN + THỬ LẠI; TỰ NHẬN HÀNG ĐI ĐƯỜNG; NGOÀI SỔ', async () => {
  const r = await luot([
    hd('HD-T1', phutTruoc(30), [{ ma_vach: nhanCan(102, 500), thanh_tien: 200000 }]),
    hd('HD-T1B', phutTruoc(29), [{ ma_vach: nhanCan(201, 300), thanh_tien: 45000 }]),
    { thoi_diem_ban: phutTruoc(28), dong: [] },   // thiếu ma_hd → bỏ HĐ này, báo cảnh báo
  ]);
  const [t1] = await dongHd('HD-T1');
  const [t1b] = await dongHd('HD-T1B');
  ok('Nạc vai không có ở quầy → thieu_hang, lượt không lỗi', !r.loi && t1.trang_thai === 'thieu_hang'
     && /không đủ "Nạc vai|không đủ/.test(t1.ly_do), JSON.stringify({ r, t1 }));
  ok('Dòng khác cùng lô vẫn ghi được', t1b.trang_thai === 'da_ghi');
  ok('HĐ sai dạng bị bỏ, có cảnh báo, không hỏng lô', r.kq?.hd_loi === 1 && r.kq.canh_bao?.[0]?.loi?.includes('ma_hd'),
     JSON.stringify(r.kq));
  ok('Số đỏ quản lý ipos_cho_xu_ly = 1', (await demViec(UID.qlA)).ipos_cho_xu_ly === 1);
  const ev = await suKien(UID.qlA, 'ipos_cho_xu_ly');
  ok('Quản lý có thông báo "dòng bán chưa trừ được kho" (so 1, không tiền)', ev.length === 1 && Number(ev[0].so) === 1
     && khoaTien(ev).length === 0, JSON.stringify(ev));
  ok('Thủ kho không có số đỏ / thông báo đó', !('ipos_cho_xu_ly' in await demViec(UID.thuKhoA))
     && (await suKien(UID.thuKhoA, 'ipos_cho_xu_ly')).length === 0);

  const c = await xuat(UID.qlA, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
                                  dong: [{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 2 }] });
  ok('Quản lý mang 2 gói nạc vai ra quầy', c.loi === null, c.loi ?? '');
  const r2 = await luot([]);
  const [t1c] = await dongHd('HD-T1');
  ok('Lượt sau tự thử lại → da_ghi', t1c.trang_thai === 'da_ghi' && t1c.so_lan_thu >= 2 && r2.kq?.dong?.da_ghi >= 1,
     JSON.stringify(t1c));
  ok('Số đỏ về 0', (await demViec(UID.qlA)).ipos_cho_xu_ly === 0);

  // Bật "quầy phải bấm nhận": thủ kho mang ra → hàng đi đường; iPOS báo bán trước khi quầy bấm nhận.
  await duoi(UID.qlA, `select kho_luu_nguong($1, '{"chuyen_quay_can_nhan": true}'::jsonb)`, [cnA.id]);
  const c2 = await xuat(UID.thuKhoA, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
                                       dong: [{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 2 }] });
  const pId = c2.rows?.[0]?.phieu_id;
  ok('Hàng đang mang ra quầy (chưa bấm nhận)', (await db.query(`select trang_thai from kho_phieu_xuat where id = $1`, [pId]))
     .rows[0]?.trang_thai === 'dang_chuyen', c2.loi ?? '');
  await luot([hd('HD-T2', phutTruoc(20), [{ so_goi: 3, so_kg: 1.5, ma_can: '102', thanh_tien: 600000 }])]);
  const [t2] = await dongHd('HD-T2');
  const { rows: [p] } = await db.query(`select * from kho_phieu_xuat where id = $1`, [pId]);
  ok('Quầy thiếu → máy tự nhận phiếu đang mang ra rồi ghi bán', t2.trang_thai === 'da_ghi' && p.trang_thai === 'da_nhan'
     && p.nguoi_nhan === nsMay.mayIposA, JSON.stringify({ t2: t2.trang_thai, p: p.trang_thai }));
  ok('Không còn gì trên đường', (await db.query(`select * from kho_chuyen_tren_duong($1)`, [pId])).rows.length === 0);

  // Vẫn thiếu → hàng ngoài sổ (quản lý, bắt buộc lý do) hoặc bỏ qua.
  await luot([hd('HD-T3', phutTruoc(15), [{ so_goi: 2, so_kg: 1, ma_can: '102', thanh_tien: 400000 }]),
              hd('HD-T4', phutTruoc(14), [{ so_goi: 1, ma_can: '102', thanh_tien: 200000 }])]);
  const [t3] = await dongHd('HD-T3');
  const [t4] = await dongHd('HD-T4');
  ok('Quầy hết nạc vai → hai dòng thieu_hang', t3.trang_thai === 'thieu_hang' && t4.trang_thai === 'thieu_hang');
  const nv = await duoi(UID.nvQuayA, `select kho_ipos_xu_ly_dong($1, 'ngoai_so', 'có hàng')`, [t3.id]);
  ok('NV quầy KHÔNG xử lý được', nv.loi !== null);
  const khongLyDo = await duoi(UID.qlA, `select kho_ipos_xu_ly_dong($1, 'ngoai_so', ' ')`, [t3.id]);
  ok('Hàng ngoài sổ thiếu lý do → từ chối', khongLyDo.loi !== null && /lý do/.test(khongLyDo.loi), khongLyDo.loi ?? '');
  const ns = await duoi(UID.qlA, `select kho_ipos_xu_ly_dong($1, 'ngoai_so', 'Hàng lấy thẳng từ tủ phụ, chưa ghi sổ') as v`, [t3.id]);
  const so3 = await soCuaDong(t3.id);
  ok('Quản lý ghi "hàng ngoài sổ": cộng kiểm kê 2 gói vào lô mới nhất rồi ghi bán',
     ns.rows?.[0]?.v?.trang_thai === 'da_ghi' && so3.some(s => s.loai === 'kiem_ke' && s.so_goi === 2)
       && so3.some(s => s.loai === 'ban'), ns.loi ?? JSON.stringify(so3));
  const { rows: [t3b] } = await db.query(`select * from kho_ipos_dong where id = $1`, [t3.id]);
  ok('Ghi người xử lý và lý do', t3b.xu_ly_boi && /ngoài sổ/.test(t3b.ly_do));
  const bq = await duoi(UID.qlA, `select kho_ipos_xu_ly_dong($1, 'bo_qua', 'Khách trả lại') as v`, [t4.id]);
  ok('Quản lý bỏ qua một dòng', bq.rows?.[0]?.v?.trang_thai === 'bo_qua', bq.loi ?? '');
  const lai = await duoi(UID.qlA, `select kho_ipos_xu_ly_dong($1, 'thu_lai', null)`, [t4.id]);
  ok('Dòng đã xử lý không thử lại được', lai.loi !== null);
  await doiSoat('Thiếu hàng');
});

// ===========================================================================
await nhom('8 · CHƯA KHỚP → GHÉP MÃ → XỬ LÝ LẠI', async () => {
  await luot([hd('HD-K1', phutTruoc(12), [
    { khoa_dong: 'a', ma_ipos: 'SP-VUN-KG', ten_ipos: 'Thịt vụn (kg)', so_kg: 0.4, thanh_tien: 60000 },
    { khoa_dong: 'b', ma_ipos: 'NUOC', ten_ipos: 'Nước suối', so_goi: 1, thanh_tien: 10000 },
  ])]);
  const [a, b] = await dongHd('HD-K1');
  ok('Mã iPOS chưa ghép, không mã vạch → chua_khop', a.trang_thai === 'chua_khop' && b.trang_thai === 'chua_khop');
  ok('Số đỏ quản lý = 2', (await demViec(UID.qlA)).ipos_cho_xu_ly === 2);
  const tk = await duoi(UID.thuKhoA, `select kho_ipos_gan_ma($1, 'SP-VUN-KG', 'mon', $2)`, [cnA.id, MH['P-VUN'].id]);
  ok('Thủ kho KHÔNG ghép mã được', tk.loi !== null);
  const thieuMon = await duoi(UID.qlA, `select kho_ipos_gan_ma($1, 'SP-VUN-KG', 'mon', null)`, [cnA.id]);
  ok('Kiểu "mon" phải chọn món', thieuMon.loi !== null);
  const g = await duoi(UID.qlA, `select kho_ipos_gan_ma($1, 'SP-VUN-KG', 'mon', $2) as v`, [cnA.id, MH['P-VUN'].id]);
  const [a2] = await dongHd('HD-K1');
  ok('Quản lý ghép → xử lý lại ngay: dòng đã ghi', g.rows?.[0]?.v?.dong?.da_ghi === 1 && a2.trang_thai === 'da_ghi',
     g.loi ?? JSON.stringify(g.rows?.[0]?.v));
  const { rows: [mp] } = await db.query(`select * from kho_ipos_ma_hang where ma_ipos = 'SP-VUN-KG'`);
  ok('Bảng ghép nhớ tên iPOS', mp.ten_ipos === 'Thịt vụn (kg)' && mp.kieu === 'mon');
  const g2 = await duoi(UID.qlA, `select kho_ipos_gan_ma($1, 'NUOC', 'bo_qua', null) as v`, [cnA.id]);
  ok('"Không phải hàng kho" → dòng bỏ qua', g2.rows?.[0]?.v?.dong?.bo_qua === 1, g2.loi ?? '');
  await luot([hd('HD-K2', phutTruoc(11), [{ ma_ipos: 'NUOC', so_goi: 2, thanh_tien: 20000 }])]);
  ok('Lần sau bán nước → tự bỏ qua', (await dongHd('HD-K2'))[0].trang_thai === 'bo_qua');
  ok('Số đỏ về 0', (await demViec(UID.qlA)).ipos_cho_xu_ly === 0);
  await doiSoat('Ghép mã');
});

// ===========================================================================
await nhom('9 · HĐ HỦY / SỬA SAU KHI GHI → ĐẢO NGƯỢC', async () => {
  const tonL2 = await ton(L2.id, viTri.quay);
  const huy = await luot([hd('HD-F1', phutTruoc(50),
    [{ khoa_dong: 'a', ma_ipos: 'CAN', ma_vach: nhanCan(101, 520), thanh_tien: 416000 }], true)]);
  const [d] = await dongHd('HD-F1');
  const so = await soCuaDong(d.id);
  ok('HĐ hủy trên iPOS → dòng da_huy, đếm hd_huy', huy.kq?.hd_huy === 1 && d.trang_thai === 'da_huy', JSON.stringify(huy.kq));
  ok('Dòng sổ bán (một dòng từ 0104) được đảo ngược đúng',
     so.filter(s => s.loai === 'dao_nguoc').length === 1 && so.filter(s => s.loai !== 'dao_nguoc').length === 1
       && so.filter(s => s.loai !== 'dao_nguoc').every(s => so.some(r => r.dao_cua === s.id)), JSON.stringify(so));
  const t = await ton(L2.id, viTri.quay);
  ok('Gói về lại lô L2 đúng kg đã trừ (0,52)', t.goi === tonL2.goi + 1 && Math.abs(t.kg - tonL2.kg - 0.52) < 1e-9,
     JSON.stringify(t));
  const truoc = await soDongSo();
  await luot([hd('HD-F1', phutTruoc(50),
    [{ khoa_dong: 'a', ma_ipos: 'CAN', ma_vach: nhanCan(101, 520), thanh_tien: 416000 }], true)]);
  ok('Gửi lại HĐ đã hủy → không đảo thêm', await soDongSo() === truoc);

  const vun0 = await tonHang('P-VUN', viTri.quay);
  await luot([hd('HD-S1', phutTruoc(10), [
    { khoa_dong: 'a', ma_vach: nhanCan(201, 200), thanh_tien: 30000 },
    { khoa_dong: 'b', ma_vach: nhanCan(201, 300), thanh_tien: 45000 }])]);
  const s1 = await luot([hd('HD-S1', phutTruoc(10), [
    { khoa_dong: 'a', ma_vach: nhanCan(201, 250), thanh_tien: 37500 }])]);
  const [sa, sb] = await dongHd('HD-S1');
  ok('HĐ sửa (băm khác): dòng còn lại ghi lại theo số mới, dòng bị bỏ → da_huy',
     s1.kq?.hd_sua === 1 && sa.trang_thai === 'da_ghi' && Number(sa.so_kg) === 0.25 && sb.trang_thai === 'da_huy',
     JSON.stringify({ kq: s1.kq, sa: sa.trang_thai, sb: sb.trang_thai }));
  const vun1 = await tonHang('P-VUN', viTri.quay);
  ok('Tồn thịt vụn chỉ giảm đúng 0,25 kg sau khi sửa', Math.abs(vun0.kg - vun1.kg - 0.25) < 1e-9, `${vun0.kg} → ${vun1.kg}`);
  await doiSoat('Hủy / sửa HĐ');
});

// ===========================================================================
await nhom('10 · KIỂM KÊ QUẦY KHI NGUỒN iPOS: CHẶN GỬI / DUYỆT', async () => {
  const kid = (await duoi(UID.nvQuayA, `select kho_bat_dau_kiem_ke($1, $2, 'theo_mat_hang', $3) as id`,
    [cnA.id, viTri.quay, maGui()])).rows?.[0]?.id;
  const { rows: [k0] } = await db.query(`select * from kho_kiem_ke where id = $1`, [kid]);
  ok('Phiếu đếm quầy mang nguồn ipos', k0?.nguon_so_ban === 'ipos');
  const { rows: dong } = await db.query(`
    select d.mat_hang_id, m.dem_goi, coalesce(sum(t.so_goi), 0)::int as goi, coalesce(sum(t.so_kg), 0) as kg
    from kho_kiem_ke_dong d join kho_mat_hang m on m.id = d.mat_hang_id
    left join kho_ton t on t.mat_hang_id = d.mat_hang_id and t.vi_tri_id = $2
    where d.kiem_ke_id = $1 group by d.mat_hang_id, m.dem_goi`, [kid, viTri.quay]);
  const luu = await duoi(UID.nvQuayA, `select kho_luu_kiem_ke($1, $2, null, $3::jsonb)`, [kid, k0.phien_ban,
    JSON.stringify(dong.map(d => ({ mat_hang_id: d.mat_hang_id, so_goi_dem: d.dem_goi ? d.goi : null,
      so_kg_dem: d.dem_goi ? null : Number(d.kg), xac_nhan_het: true })))]);
  ok('NV quầy đếm đúng bằng sổ', luu.loi === null, luu.loi ?? '');

  // Một dòng bán thiếu hàng, bán TRƯỚC lúc gửi.
  await luot([hd('HD-KK', phutTruoc(5), [{ so_goi: 5, ma_can: '102', thanh_tien: 1000000 }])]);
  ok('Có một dòng thiếu hàng', (await dongHd('HD-KK'))[0].trang_thai === 'thieu_hang');

  // 0042: mốc là lần cuối hộp thư được xử lý (callback / thử lại), không phải watermark.
  await db.query(`update kho_ipos_cau_hinh set hop_thu_luc = now() - interval '20 minutes',
    dong_bo_den_luc = now() - interval '2 days' where chi_nhanh_id = $1`, [cnA.id]);
  const pb = async () => (await db.query(`select phien_ban from kho_kiem_ke where id = $1`, [kid])).rows[0].phien_ban;
  const g1 = await duoi(UID.nvQuayA, `select kho_gui_kiem_ke($1, $2)`, [kid, await pb()]);
  ok('Bán hàng iPOS cũ hơn 10 phút → chưa gửi được kiểm kê quầy', g1.loi !== null && /hơn 10 phút/.test(g1.loi), g1.loi ?? '');
  await luot([]);
  const g2 = await duoi(UID.nvQuayA, `select kho_gui_kiem_ke($1, $2) as cau`, [kid, await pb()]);
  ok('Đồng bộ xong → gửi được', g2.loi === null, g2.loi ?? '');
  const d1 = await duoi(UID.qlA, `select kho_duyet_kiem_ke($1)`, [kid]);
  ok('Còn dòng thiếu hàng bán trước lúc gửi → chưa duyệt được', d1.loi !== null && /dòng bán iPOS/.test(d1.loi), d1.loi ?? '');
  const [kk] = await dongHd('HD-KK');
  await duoi(UID.qlA, `select kho_ipos_xu_ly_dong($1, 'bo_qua', 'Nhập nhầm trên máy bán')`, [kk.id]);
  const d2 = await duoi(UID.qlA, `select kho_duyet_kiem_ke($1) as cau`, [kid]);
  ok('Xử lý xong → duyệt được', d2.loi === null, d2.loi ?? '');
  const { rows: [{ n: soBan }] } = await db.query(
    `select count(*)::int as n from kho_so_cai where chung_tu_loai = 'kiem_ke' and chung_tu_id = $1 and loai = 'ban'`, [kid]);
  ok('Nguồn ipos: kiểm kê quầy không ghi "bán"', soBan === 0);
  await doiSoat('Kiểm kê');
});

// ===========================================================================
await nhom('11 · BÁO CÁO DOANH THU THẬT, AI THẤY TIỀN', async () => {
  const tu = await ngaySau(-2);
  const bc = await duoi(UID.qlA, `select * from kho_bao_cao_ban_thuc($1, $2::date, $3::date)`, [cnA.id, tu, homNay]);
  const { rows: [{ dt }] } = await db.query(`
    select coalesce(sum(thanh_tien), 0)::bigint as dt from kho_ipos_dong
    where chi_nhanh_id = $1 and trang_thai = 'da_ghi'
      and ((thoi_diem_ban at time zone 'utc') + interval '7 hours')::date between $2::date and $3::date`, [cnA.id, tu, homNay]);
  const ipos = (bc.rows ?? []).filter(r => r.nguon === 'ipos');
  ok('Quản lý: doanh thu iPOS = tổng tiền dòng đã ghi', bc.loi === null && ipos.length > 0
     && ipos.reduce((a, r) => a + Number(r.doanh_thu), 0) === Number(dt), bc.loi ?? JSON.stringify(bc.rows));
  ok('Lãi gộp = doanh thu − giá vốn', ipos.every(r => Number(r.lai_gop) === Number(r.doanh_thu) - Number(r.gia_von)));
  const than = ipos.find(r => r.mat_hang_id === MH['C-THANNGOAI'].id);
  ok('Thăn: kg bán = kg nhãn (0,49 + 0,51 + 0,47 + 2,9)', Number(than?.so_kg) === 4.37, JSON.stringify(than));
  const nv = await duoi(UID.nvQuayA, `select * from kho_bao_cao_ban_thuc($1, $2::date, $3::date)`, [cnA.id, tu, homNay]);
  ok('NV quầy gọi được nhưng không thấy tiền (0)', nv.loi === null
     && (nv.rows ?? []).every(r => Number(r.doanh_thu) === 0 && Number(r.gia_von) === 0), nv.loi ?? JSON.stringify(nv.rows));

  for (const [ten, uid, mong] of [['thủ kho', UID.thuKhoA, 0], ['NV quầy', UID.nvQuayA, 0]]) {
    const r = await duoi(uid, `select count(*)::int as n from kho_v_ipos_dong`);
    ok(`${ten} không đọc được dòng bán iPOS (có tiền)`, r.rows?.[0]?.n === mong, r.loi ?? `thấy ${r.rows?.[0]?.n}`);
  }
  const kt = await duoi(UID.keToanA, `select count(*)::int as n from kho_v_ipos_dong`);
  ok('Kế toán đọc được dòng bán iPOS', kt.rows?.[0]?.n > 0, kt.loi ?? '');
  const qlB = await duoi(UID.qlB, `select count(*)::int as n from kho_ipos_dong`);
  ok('Quản lý Q7 không thấy dòng bán Q1', qlB.rows?.[0]?.n === 0);

  const tk = await trangThai(UID.thuKhoA);
  ok('Thủ kho xem được trạng thái kết nối — không có khóa tiền', tk && khoaTien(tk).length === 0, JSON.stringify(tk));
  ok('Trạng thái: có 10 lượt gần nhất, không chữ "token" nào', tk.lan_chay.length === 10 && !JSON.stringify(tk).includes(TOKEN_GIA));
  const tt = await trangThai();
  ok('Đã chuyển, không còn dòng chờ → đèn xanh', tt.den === 'xanh', JSON.stringify({ den: tt.den, cau: tt.cau, dem: tt.dem }));
});

// ===========================================================================
await nhom('12 · QUAY LẠI ĐẾM QUẦY', async () => {
  const ql = await duoi(UID.qlA, `select kho_ipos_tro_ve($1)`, [cnA.id]);
  ok('Quản lý KHÔNG đổi được', ql.loi !== null);
  const tv = await duoi(UID.chu, `select kho_ipos_tro_ve($1) as v`, [cnA.id]);
  const { rows: [cd] } = await db.query(`select nguon_so_ban from kho_cai_dat where chi_nhanh_id = $1`, [cnA.id]);
  ok('Chủ quay lại "đếm quầy = số bán"', tv.loi === null && cd.nguon_so_ban === 'kiem_ke', tv.loi ?? '');
  const truoc = await soDongSo();
  await luot([hd('HD-Z', phutTruoc(1), [{ ma_vach: nhanCan(201, 100) }])]);
  ok('Sau khi quay lại: dòng mới để chờ, không trừ kho', (await dongHd('HD-Z'))[0].trang_thai === 'cho' && await soDongSo() === truoc);
  ok('Đèn vàng: đang đọc iPOS nhưng chưa trừ kho', (await trangThai()).den === 'vang');
  await doiSoat('Quay lại');
});

process.exit(ketThuc('ĐỒNG BỘ iPOS'));
