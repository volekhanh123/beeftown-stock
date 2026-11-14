/**
 * BEEFTOWN KHO — Hủy phiếu nhập: kiểm quyền TRƯỚC mọi câu trả về (0120)
 * =====================================================================
 *
 *     node test/test-kho-huy-phieu-quyen.mjs
 *
 * Trước 0120, kho_huy_phieu_nhap trả "Phiếu … đã bị hủy trước đó." cho phiếu đã hủy, và ném "Không tìm thấy phiếu
 * nhập" / "Phiếu đang chờ duyệt…" TRƯỚC khi xét vai: tài khoản đăng nhập bất kỳ biết mã (UUID) của một phiếu là đọc
 * được số phiếu và trạng thái của nó. Phải đúng:
 *   · ai không có quyền hủy ở chi nhánh của phiếu (NV quầy, thu ngân, marketing, chi nhánh khác, nhân sự đã nghỉ,
 *     tài khoản không có dòng nhan_su, anon): bị từ chối (42501) bằng MỘT câu chung cho mọi trạng thái — không số
 *     phiếu, không trạng thái; người không có quyền hủy ở chi nhánh nào cũng không biết mã có hay không;
 *   · thủ kho không thấy phiếu nợ đầu kỳ (việc của kế toán), kể cả phiếu đã hủy;
 *   · người có quyền thấy đúng như cũ: "đã bị hủy trước đó", "đang chờ duyệt", "Không tìm thấy phiếu nhập";
 *   · lời gọi bị từ chối không đổi phiếu nào; kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — HỦY PHIẾU NHẬP: KIỂM QUYỀN TRƯỚC MỌI CÂU TRẢ VỀ');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const MA_KHONG_CO = '00000000-0000-4000-8000-0000000fffff';
const CAU_CHUNG = 'Tài khoản của bạn không được hủy phiếu nhập';
const CAU_NO_DAU = 'Chỉ kế toán hoặc quản lý hủy được nợ đầu kỳ';
const CAU_CHO_DUYET = 'Phiếu đang chờ duyệt — rút về hoặc từ chối trước khi hủy';

const huy = (uid, id, lyDo = 'thử quyền') => duoi(uid, `select kho_huy_phieu_nhap($1, $2) as cau`, [id, lyDo]);

async function luuTonDau(dong) {
  const r = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'ton_dau', p_nha_cung_cap_id => null, p_vi_tri_id => $3, p_ngay_nhap => $4::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => '{}'::text[],
      p_truong_them => '{}'::jsonb, p_dong => $5::jsonb)`,
    [cnA.id, maGui(), vt.kho, homNay, JSON.stringify(dong)]);
  if (r.loi) throw new Error(r.loi);
  return r.rows[0];
}

async function chay(uid, sql, ts) {
  const r = await duoi(uid, sql, ts);
  if (r.loi) throw new Error(`${sql}: ${r.loi}`);
  return r.rows;
}

const MH = {};
let vt = {};
const P = {};   // trạng thái → { id, so_phieu }

// ===========================================================================
await nhom('1 · CHUẨN BỊ: PHIẾU Ở ĐỦ SÁU TRẠNG THÁI, CHI NHÁNH Q1', async () => {
  await chay(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await chay(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await chay(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vt = Object.fromEntries((await db.query(
    `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  const dong = kg => [{ mat_hang_id: MH['T-NACVAI'].id, so_goi: 1, so_kg: kg, don_gia_kg: 300000 }];

  const nhap = await luuTonDau(dong(3));
  P.nhap = nhap.phieu_id;

  const cho = await luuTonDau(dong(4));
  await chay(UID.qlA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [cho.phieu_id, cho.phien_ban_moi]);
  P.cho_duyet = cho.phieu_id;

  const duyet = await luuTonDau(dong(5));
  await chay(UID.qlA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [duyet.phieu_id, duyet.phien_ban_moi]);
  await chay(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [duyet.phieu_id]);
  P.da_duyet = duyet.phieu_id;

  const daHuy = await luuTonDau(dong(6));
  await chay(UID.qlA, `select kho_huy_phieu_nhap($1, null)`, [daHuy.phieu_id]);
  P.da_huy = daHuy.phieu_id;

  const ncc = async ten => (await chay(UID.keToanA,
    `insert into kho_nha_cung_cap (ten, so_ngay_no) values ($1, 15) returning id`, [ten]))[0].id;
  const ghiNo = async nccId => (await chay(UID.keToanA,
    `select kho_ghi_no_dau_ky(p_chi_nhanh_id => $1, p_ma_gui => $2, p_dong => $3::jsonb) as kq`,
    [cnA.id, maGui(), JSON.stringify([{ nha_cung_cap_id: nccId, so_tien: 2500000 }])]))[0].kq.phieu[0].phieu_id;
  P.no_dau = await ghiNo(await ncc('NCC Úc'));
  P.no_dau_da_huy = await ghiNo(await ncc('NCC Mỹ'));
  await chay(UID.keToanA, `select kho_huy_phieu_nhap($1, 'Ghi nhầm')`, [P.no_dau_da_huy]);

  const MONG = {
    nhap: 'ton_dau/nhap', cho_duyet: 'ton_dau/cho_duyet', da_duyet: 'ton_dau/da_duyet', da_huy: 'ton_dau/da_huy',
    no_dau: 'no_dau/da_duyet', no_dau_da_huy: 'no_dau/da_huy',
  };
  const { rows } = await db.query(
    `select id, so_phieu, loai, trang_thai from kho_phieu_nhap where id = any($1::uuid[])`, [Object.values(P)]);
  const theoId = Object.fromEntries(rows.map(r => [r.id, r]));
  const dung = Object.entries(P).every(([tt, id]) => `${theoId[id]?.loai}/${theoId[id]?.trang_thai}` === MONG[tt]);
  ok('Có đủ phiếu nháp, chờ duyệt, đã duyệt, đã hủy, nợ đầu kỳ còn hiệu lực, nợ đầu kỳ đã hủy', dung,
     JSON.stringify(rows.map(r => [r.so_phieu, r.loai, r.trang_thai])));
  for (const [tt, id] of Object.entries(P)) P[tt] = { id, so_phieu: theoId[id]?.so_phieu };
});

const truoc = async () => JSON.stringify((await db.query(
  `select id, trang_thai, phien_ban, ly_do, huy_luc from kho_phieu_nhap order by id`)).rows);
const banDau = await truoc();

/** Câu lỗi không được nhắc số phiếu nào, không nói trạng thái. */
const LO_TRANG_THAI = /trước đó|chờ duyệt|Không tìm thấy|nợ đầu kỳ|nháp|đã duyệt/i;
const loSoPhieu = loi => Object.values(P).filter(p => p.so_phieu && loi?.includes(p.so_phieu)).map(p => p.so_phieu);

// ===========================================================================
await nhom('2 · KHÔNG CÓ QUYỀN Ở CHI NHÁNH NÀO: MỘT CÂU CHUNG, KỂ CẢ MÃ KHÔNG CÓ', async () => {
  const AI = [
    ['NV quầy Q1', UID.nvQuayA], ['Thu ngân Q1', UID.thuNganA], ['Marketing Q1', UID.mktA],
    ['Thủ kho đã nghỉ', UID.nghiViec], ['Tài khoản không có dòng nhan_su', null],
  ];
  for (const [ten, uid] of AI) {
    const kq = [];
    for (const [tt, p] of [...Object.entries(P), ['mã không có', { id: MA_KHONG_CO }]]) kq.push([tt, await huy(uid, p.id)]);
    const sai = kq.filter(([, r]) => !(r.loi === CAU_CHUNG && r.ma === '42501')).map(([tt, r]) => `${tt}: ${r.loi ?? r.rows?.[0]?.cau}`);
    ok(`${ten} → 6 trạng thái và mã không có: cùng câu "${CAU_CHUNG}" (42501)`, sai.length === 0, sai.join(' · '));
    const lo = kq.flatMap(([, r]) => [...loSoPhieu(r.loi ?? r.rows?.[0]?.cau), ...(LO_TRANG_THAI.test(r.loi ?? '') ? [r.loi] : [])]);
    ok(`${ten} → không thấy số phiếu, không thấy trạng thái`, lo.length === 0, lo.join(' · '));
  }

  const an = [];
  for (const p of [P.da_huy, P.cho_duyet, P.no_dau_da_huy, { id: MA_KHONG_CO }]) {
    an.push(await duoiAnon(`select kho_huy_phieu_nhap($1, 'x') as cau`, [p.id]));
  }
  ok('anon → phiếu đã hủy, chờ duyệt, nợ đầu kỳ đã hủy, mã không có: bị từ chối (42501), không số phiếu',
     an.every(r => r.loi !== null && r.ma === '42501' && loSoPhieu(r.loi).length === 0 && !LO_TRANG_THAI.test(r.loi)),
     an.map(r => r.loi ?? r.rows?.[0]?.cau).join(' · '));
});

// ===========================================================================
await nhom('3 · CHI NHÁNH KHÁC: PHIẾU Q1 MỌI TRẠNG THÁI → CÂU CHUNG', async () => {
  for (const [ten, uid] of [['Quản lý Q7', UID.qlB], ['Thủ kho Q7', UID.thuKhoB]]) {
    const kq = [];
    for (const [tt, p] of Object.entries(P)) kq.push([tt, await huy(uid, p.id)]);
    const sai = kq.filter(([, r]) => !(r.loi === CAU_CHUNG && r.ma === '42501')).map(([tt, r]) => `${tt}: ${r.loi ?? r.rows?.[0]?.cau}`);
    ok(`${ten} → 6 phiếu của Q1: "${CAU_CHUNG}", không số phiếu, không trạng thái`, sai.length === 0, sai.join(' · '));
  }
  const khongCo = await huy(UID.qlB, MA_KHONG_CO);
  ok('Quản lý Q7, mã không có → vẫn "Không tìm thấy phiếu nhập" (có quyền hủy ở Q7)',
     khongCo.loi === 'Không tìm thấy phiếu nhập', khongCo.loi ?? '');
});

// ===========================================================================
await nhom('4 · THỦ KHO CÙNG CHI NHÁNH KHÔNG THẤY PHIẾU NỢ ĐẦU KỲ', async () => {
  for (const tt of ['no_dau', 'no_dau_da_huy']) {
    const r = await huy(UID.thuKhoA, P[tt].id);
    ok(`Thủ kho Q1 → ${tt === 'no_dau' ? 'nợ đầu kỳ còn hiệu lực' : 'nợ đầu kỳ ĐÃ HỦY'}: "${CAU_NO_DAU}", không số phiếu`,
       r.loi === CAU_NO_DAU && r.ma === '42501' && loSoPhieu(r.loi).length === 0, r.loi ?? r.rows?.[0]?.cau);
  }
});

// ===========================================================================
await nhom('5 · NGƯỜI CÓ QUYỀN THẤY ĐÚNG NHƯ CŨ', async () => {
  const daHuy = `Phiếu ${P.da_huy.so_phieu} đã bị hủy trước đó.`;
  for (const [ten, uid] of [['Quản lý Q1', UID.qlA], ['Thủ kho Q1', UID.thuKhoA], ['Chủ', UID.chu], ['Kế toán Q1', UID.keToanA]]) {
    const r = await huy(uid, P.da_huy.id);
    ok(`${ten} → phiếu đã hủy: "${daHuy}"`, r.loi === null && r.rows?.[0]?.cau === daHuy, r.loi ?? r.rows?.[0]?.cau);
  }
  const ndHuy = await huy(UID.keToanA, P.no_dau_da_huy.id);
  ok('Kế toán Q1 → nợ đầu kỳ đã hủy: "đã bị hủy trước đó", có số phiếu',
     ndHuy.loi === null && ndHuy.rows?.[0]?.cau === `Phiếu ${P.no_dau_da_huy.so_phieu} đã bị hủy trước đó.`, ndHuy.loi ?? ndHuy.rows?.[0]?.cau);

  // Kế toán từ chối được phiếu chờ duyệt (duyet_nhap) — câu "rút về hoặc từ chối" vẫn đúng với họ.
  for (const [ten, uid] of [['Thủ kho Q1', UID.thuKhoA], ['Kế toán Q1', UID.keToanA], ['Chủ', UID.chu]]) {
    const r = await huy(uid, P.cho_duyet.id);
    ok(`${ten} → phiếu chờ duyệt: "${CAU_CHO_DUYET}"`, r.loi === CAU_CHO_DUYET, r.loi ?? r.rows?.[0]?.cau);
  }
  for (const [ten, uid] of [['Thủ kho Q1', UID.thuKhoA], ['Kế toán Q1', UID.keToanA], ['Chủ', UID.chu]]) {
    const r = await huy(uid, MA_KHONG_CO);
    ok(`${ten} → mã không có: "Không tìm thấy phiếu nhập"`, r.loi === 'Không tìm thấy phiếu nhập', r.loi ?? '');
  }
  const ktDuyet = await huy(UID.keToanA, P.da_duyet.id);
  ok('Kế toán Q1 → phiếu đã duyệt: vẫn "Chỉ quản lý hủy được phiếu đã duyệt"',
     ktDuyet.loi === 'Chỉ quản lý hủy được phiếu đã duyệt', ktDuyet.loi ?? ktDuyet.rows?.[0]?.cau);
  const ktNhap = await huy(UID.keToanA, P.nhap.id);
  ok(`Kế toán Q1 → phiếu nháp: vẫn "${CAU_CHUNG}"`, ktNhap.loi === CAU_CHUNG, ktNhap.loi ?? ktNhap.rows?.[0]?.cau);
});

// ===========================================================================
await nhom('6 · LỜI GỌI BỊ TỪ CHỐI KHÔNG ĐỔI PHIẾU NÀO', async () => {
  ok('Trạng thái, phiên bản, lý do, giờ hủy của mọi phiếu giữ nguyên sau nhóm 2–5', (await truoc()) === banDau);

  // Người có quyền vẫn hủy được như cũ — để chắc cửa mới không chặn nhầm.
  const tk = await huy(UID.thuKhoA, P.nhap.id, null);
  ok('Thủ kho Q1 hủy được phiếu nháp', tk.loi === null && tk.rows?.[0]?.cau === `Đã hủy phiếu nháp ${P.nhap.so_phieu}.`, tk.loi ?? '');
  const ql = await huy(UID.qlA, P.da_duyet.id, 'Nhập nhầm');
  ok('Quản lý Q1 hủy được phiếu đã duyệt', ql.loi === null && /trả tồn về/.test(ql.rows?.[0]?.cau ?? ''), ql.loi ?? '');
  const kt = await huy(UID.keToanA, P.no_dau.id, 'Ghi nhầm');
  ok('Kế toán Q1 hủy được nợ đầu kỳ', kt.loi === null && kt.rows?.[0]?.cau === `Đã hủy nợ đầu kỳ ${P.no_dau.so_phieu}.`, kt.loi ?? '');

  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('Tồn khớp sổ kho', rows.length === 0, JSON.stringify(rows));
});

process.exit(ketThuc('HỦY PHIẾU NHẬP — KIỂM QUYỀN TRƯỚC'));
