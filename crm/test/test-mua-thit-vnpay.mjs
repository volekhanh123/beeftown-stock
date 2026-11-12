/**
 * BEEFTOWN — MUA THỊT VỀ: KHÁCH TRẢ TRƯỚC QUA VNPAY TRÊN WEBSITE (0114, 0115)
 * ===========================================================================
 *
 *     node test/test-mua-thit-vnpay.mjs
 *
 * Khánh 12/11/2026: đặt hàng xong mở cổng VNPay, giá gói đã gồm phí giao. mua_thit_mo_vnpay (anon, theo ma_gui) mở
 * một lần trả; vnpay_ghi_ipn / vnpay_ghi_ve (máy may_vnpay) ghi kết quả VNPay báo về; hộp thư và bảng sức khỏe đọc
 * lại. Theo 9 mục "xong":
 *
 *   1. quyen — anon chỉ mở lần trả (không đọc bảng, không ghi kết quả); nhân sự (chủ, thu ngân…) không mở lần trả,
 *      không ghi kết quả; máy khác (may_messenger), máy VNPay đã tắt, tài khoản không có dòng nhan_su bị từ chối; máy
 *      VNPay không đọc được đơn, hộp thư hay bảng CRM; quản lý chi nhánh khác không thấy tiền của đơn Q1.
 *   2. bam-hai-lan — mở hai lần → hai mã giao dịch khác nhau (lần 01, 02), cùng số tiền; VNPay gửi lại IPN → 02, không
 *      ghi lần hai; đơn đã trả → không mở lần mới; trả hai lần → hộp thư ghi số phải hoàn; khách F5 trang kết quả →
 *      dấu "đã về" giữ lần đầu; tối đa 10 lần.
 *   3. gio-vn — không áp dụng ở database: lúc trả (vnp_PayDate) web đổi sang timestamptz +07:00 trước khi gọi; đèn
 *      và hộp thư tính theo mốc tuyệt đối (now()), không cắt ngày.
 *   4. chu-va-so — số tiền là số nguyên đồng (đúng tạm tính); IPN sai số tiền (thiếu, thừa, null) → sai_tien.
 *   5. mat-mang — ở test-mua-thit-vnpay-web.mjs (lib của web).
 *   6. ton-kho — kho_doi_soat_ton() rỗng.
 *   7. cau-chu — mọi câu raise mới có bản en, ko (trang công khai) hoặc en (câu của máy, chỉ vào nhật ký).
 *   8. migration — 0114 chỉ một lệnh thêm enum; 0115 không câu delete; kiểm IPN đúng thứ tự 01 → 04 → 02 → 00.
 *   9. dich-vu-ngoai — thứ tự kiểm và mã của VNPay (code mẫu, thư viện vnpay 2.4.1); đèn sức khỏe đỏ khi khách về
 *      với mã 00 mà IPN không tới.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, maGui, UID } from './kho-chung.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOC = join(__dirname, '..', '..');
const WEB = join(GOC, 'web', 'src');
const MIG = join(GOC, 'crm', 'supabase', 'migrations');

const { cauLoiDatabase } = await import(join(WEB, 'lib', 'chu.ts'));
const { dichCau, MO_TA_KHOA_EN } = await import(join(WEB, 'lib', 'cau-noi-bo.ts'));
const { danhGiaSucKhoe, PHUT_CHO_IPN_VNPAY } = await import(join(WEB, 'lib', 'suc-khoe.ts'));

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — MUA THỊT VỀ: TRẢ TRƯỚC QUA VNPAY (0114, 0115)');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();

// Người khung dùng chung chưa có.
const UID_MAY_VNPAY = '00000000-0000-4000-8000-0000000000e1';
const UID_MAY_VNPAY_TAT = '00000000-0000-4000-8000-0000000000e2';
const UID_MAY_MESS = '00000000-0000-4000-8000-0000000000e3';
const UID_LA = '00000000-0000-4000-8000-0000000000e4';
for (const [uid, ten, vai, dangLam] of [
  [UID_MAY_VNPAY, 'Máy VNPay', 'may_vnpay', true],
  [UID_MAY_VNPAY_TAT, 'Máy VNPay cũ', 'may_vnpay', false],
  [UID_MAY_MESS, 'Máy Messenger', 'may_messenger', true],
]) {
  await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam) values ($1, $2, $3, $4, $5)`,
                 [uid, cnA.id, ten, vai, dangLam]);
}

const vi = r => (r.loi ? `${r.ma}: ${r.loi}` : JSON.stringify(r.kq ?? r.rows)?.slice(0, 300));
const goi = async (uid, sql, p = []) => {
  const r = await (uid === 'anon' ? duoiAnon(sql, p) : duoi(uid, sql, p));
  return { ...r, kq: r.rows?.[0]?.r };
};
const tuChoi = r => r.loi !== null && r.ma === '42501';
const nghi = () => new Promise(xong => setTimeout(xong, 3));
const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];

// ---------------------------------------------------------------------------
// Menu bán lẻ (khuôn test-mua-thit-dat-hang.mjs)
// ---------------------------------------------------------------------------
async function matHang(ma, gia) {
  const { rows: [r] } = await db.query(
    `insert into kho_mat_hang (ma, ten, loai, dem_goi, gia_ban_kg) values ($1, $1, 'phan_cat', false, $2) returning id`, [ma, gia]);
  return r.id;
}
const docSp = async id => (await goi(UID.chu, `select ban_le_danh_sach(null, $1) as r`, [id])).kq?.[0];
async function luu(id, duLieu) {
  await nghi();
  const sp = await docSp(id);
  const r = await goi(UID.chu, `select ban_le_luu_san_pham($1, $2::timestamptz, $3::jsonb) as r`, [id, sp.updated_at, JSON.stringify(duLieu)]);
  if (r.loi || r.kq?.ok !== true) throw new Error(`không lưu được: ${vi(r)}`);
}
async function chot(id) {
  await nghi();
  const sp = await docSp(id);
  const r = await goi(UID.chu, `select ban_le_chot_gia($1, $2::timestamptz, $3::jsonb) as r`, [id, sp.updated_at, JSON.stringify(sp.gia_de_chot)]);
  if (r.loi || r.kq?.ok !== true) throw new Error(`không chốt được giá: ${vi(r)}`);
}
async function tao(ma, ten) {
  const r = await goi(UID.chu, `select ban_le_tao_san_pham($1, $2, $3, 'thit', 'theo_can') as r`, [maGui(), ma, ten]);
  if (r.loi || !r.kq?.id) throw new Error(`không tạo được ${ma}: ${vi(r)}`);
  return r.kq.id;
}

let thuTu = 0;
const sdtMoi = () => `09${String(20000000 + ++thuTu).slice(-8)}`;
let GIA = {};
/** Đặt một đơn như trang (anon) cho chi nhánh cn; trả {ma_gui, ma_don, tam_tinh}. */
async function datDon(cn = 'q1', soGoi = 1) {
  const g = maGui();
  const r = await goi('anon', `select tao_don_mua_thit($1::uuid, $2, 'Trần Văn Bình', $3, '45 Lê Lợi, phường Bến Thành', null,
                                 $4::jsonb, $5::jsonb, 'vi', $6::inet) as r`,
                      [g, cn, sdtMoi(), JSON.stringify({ 'thit-vnpay_200': soGoi }), JSON.stringify(GIA), `198.51.100.${thuTu % 250 + 1}`]);
  if (r.loi || !r.kq?.ma_don) throw new Error(`không đặt được đơn: ${vi(r)}`);
  return { ma_gui: g, ma_don: r.kq.ma_don, tam_tinh: Number(r.kq.tam_tinh) };
}
const mo = (maGuiDon, uid = 'anon') => goi(uid, `select mua_thit_mo_vnpay($1::uuid) as r`, [maGuiDon]);
const ipn = (uid, ma, tien, phanHoi = '00', trangThai = '00', maVnpay = '14151617', nganHang = 'NCB', luc = '2026-11-12T10:15:30+07:00') =>
  goi(uid, `select vnpay_ghi_ipn($1, $2::bigint, $3, $4, $5, $6, $7::timestamptz) as r`, [ma, tien, phanHoi, trangThai, maVnpay, nganHang, luc]);
const ve = (uid, ma, phanHoi = '00') => goi(uid, `select vnpay_ghi_ve($1, $2) as r`, [ma, phanHoi]);
const lan = async ma => mot(`select * from thanh_toan_vnpay_web where ma_giao_dich = $1`, [ma]);
const hopThu = async (uid, maDon) => {
  const r = await goi(uid, `select coalesce(jsonb_agg(x), '[]') as r from don_mua_thit_danh_sach('tat_ca') x`);
  return { ...r, don: (r.kq ?? []).find(d => d.ma_don === maDon) ?? null };
};
const soLieu = async () => (await mot(`select suc_khoe_so_lieu(array[$1::uuid, $2::uuid]) as k`, [cnA.id, cnB.id])).k;

// ===========================================================================
await nhom('0 · TIỀN ĐỀ — enum chạy riêng, menu một gói đã chốt giá, công tắc bật', async () => {
  const vai = (await db.query(`select unnest(enum_range(null::vai_tro))::text as v`)).rows.map(r => r.v);
  ok('0114: vai_tro có may_vnpay', vai.includes('may_vnpay'));
  const f = readFileSync(join(MIG, '0114_vnpay_vai_may.sql'), 'utf8').replace(/--[^\n]*/g, '').trim();
  ok('0114 chỉ có đúng một lệnh thêm enum (chạy riêng, trước 0115)', f === `alter type vai_tro add value if not exists 'may_vnpay';`, f.slice(0, 200));
  const sql = readFileSync(join(MIG, '0115_mua_thit_vnpay.sql'), 'utf8').replace(/--[^\n]*/g, '');
  ok('0115 không có câu delete', !/\bdelete\s+from\b/i.test(sql));

  const mh = await matHang('THIT-VNPAY', 1_000_000);
  const sp = await tao('thit-vnpay', 'Thăn bò thử VNPay');
  await luu(sp, { mat_hang_id: mh, trang_thai: 'dang_ban', thu_tu: 1, bao_quan: 'mat' });
  await chot(sp);
  const r = await goi(UID.chu, `select dat_noi_dung('hien_mua_thit_ve', p_bool := true, p_cong_bo := true) as r`);
  ok('Công bố công tắc hien_mua_thit_ve', r.loi === null, vi(r));
  const { rows } = await duoiAnon(`select * from mua_thit_ve_cong_khai('vi', 'q1')`);
  GIA = Object.fromEntries((rows ?? []).map(d => [`${d.san_pham_ma}_${d.so_gam}`, Number(d.gia)]));
  ok('Menu có gói 200 g', GIA['thit-vnpay_200'] > 0, JSON.stringify(GIA));
});

// ===========================================================================
let A;   // đơn chính của các nhóm sau
await nhom('1 · QUYỀN', async () => {
  A = await datDon();
  const r = await mo(A.ma_gui);
  ok('anon mở được lần trả cho đơn vừa đặt (đúng ma_gui)', r.loi === null && r.kq?.ma_giao_dich === `${A.ma_don}01`, vi(r));
  ok('Số tiền = tạm tính của đơn (giá gói đã gồm phí giao)', Number(r.kq?.so_tien) === A.tam_tinh && A.tam_tinh === GIA['thit-vnpay_200'], vi(r));
  ok('Trả lời không có gì của khách (tên, số điện thoại, địa chỉ, ma_gui)',
     r.kq && Object.keys(r.kq).sort().join(',') === 'da_tra,ma_don,ma_giao_dich,ngon_ngu,so_tien', Object.keys(r.kq ?? {}).join(','));

  const sai = await mo(maGui());
  ok('ma_gui lạ (người ngoài đoán) → "Không thấy đơn để trả tiền", không mở gì',
     sai.loi !== null && /^Không thấy đơn để trả tiền/.test(sai.loi), vi(sai));
  const rong = await mo(null);
  ok('Thiếu ma_gui → câu "Thiếu mã đơn"', rong.loi !== null && /^Thiếu mã đơn/.test(rong.loi), vi(rong));

  for (const [ten, uid] of [['Chủ', UID.chu], ['Thu ngân Q1', UID.thuNganA], ['Máy VNPay', UID_MAY_VNPAY]]) {
    const x = await mo(A.ma_gui, uid);
    ok(`${ten} (đã đăng nhập) KHÔNG gọi được mua_thit_mo_vnpay — chỉ trang (anon)`, x.loi !== null && /permission denied/.test(x.loi), vi(x));
  }

  const anonIpn = await ipn('anon', `${A.ma_don}01`, A.tam_tinh);
  ok('anon KHÔNG gọi được vnpay_ghi_ipn', anonIpn.loi !== null && /permission denied/.test(anonIpn.loi), vi(anonIpn));
  const anonVe = await ve('anon', `${A.ma_don}01`);
  ok('anon KHÔNG gọi được vnpay_ghi_ve', anonVe.loi !== null && /permission denied/.test(anonVe.loi), vi(anonVe));
  for (const [ten, uid] of [['Chủ', UID.chu], ['Quản lý Q1', UID.qlA], ['Thu ngân Q1', UID.thuNganA], ['Máy Messenger', UID_MAY_MESS],
                            ['Máy VNPay đã tắt', UID_MAY_VNPAY_TAT], ['Người đã nghỉ', UID.nghiViec], ['Tài khoản không có nhan_su', UID_LA]]) {
    const x = await ipn(uid, `${A.ma_don}01`, A.tam_tinh);
    const y = await ve(uid, `${A.ma_don}01`);
    ok(`${ten} KHÔNG ghi được kết quả VNPay (42501 cả hai hàm)`, tuChoi(x) && tuChoi(y), `${vi(x)} | ${vi(y)}`);
  }
  ok('Chưa ai ghi được gì: lần 01 vẫn chờ', (await lan(`${A.ma_don}01`)).trang_thai === 'cho');

  for (const bang of ['thanh_toan_vnpay_web', 'don_mua_thit', 'khach_hang', 'dat_ban']) {
    const x = await duoi(UID_MAY_VNPAY, `select count(*)::int as n from ${bang}`);
    ok(`Máy VNPay không đọc được ${bang}`, x.loi !== null || x.rows?.[0]?.n === 0, vi(x));
  }
  const xAnon = await duoiAnon(`select count(*)::int as n from thanh_toan_vnpay_web`);
  ok('anon không đọc được thanh_toan_vnpay_web', xAnon.loi !== null && /permission denied/.test(xAnon.loi), vi(xAnon));
  const xTn = await duoi(UID.thuNganA, `select count(*)::int as n from thanh_toan_vnpay_web`);
  ok('Thu ngân không đọc thẳng được thanh_toan_vnpay_web (chỉ qua hộp thư)', xTn.loi !== null && /permission denied/.test(xTn.loi), vi(xTn));
  const mayHopThu = await hopThu(UID_MAY_VNPAY, A.ma_don);
  ok('Máy VNPay không mở được hộp thư đơn', mayHopThu.loi !== null && /Không có quyền xem đơn mua thịt/.test(mayHopThu.loi), vi(mayHopThu));
});

// ===========================================================================
await nhom('2 · IPN — ĐÚNG THỨ TỰ CỦA VNPAY: 01 → 04 → 02 → 00', async () => {
  const ma = `${A.ma_don}01`;
  const khongThay = await ipn(UID_MAY_VNPAY, 'ZZZZZZ01', A.tam_tinh);
  ok('Mã giao dịch không có → khong_thay (RspCode 01)', khongThay.kq === 'khong_thay', vi(khongThay));
  for (const [ten, tien] of [['thiếu 1 đồng', A.tam_tinh - 1], ['thừa', A.tam_tinh * 100], ['null', null]]) {
    const x = await ipn(UID_MAY_VNPAY, ma, tien);
    ok(`Số tiền ${ten} → sai_tien (RspCode 04), không ghi`, x.kq === 'sai_tien' && (await lan(ma)).trang_thai === 'cho', vi(x));
  }
  const saiMa = await ipn(UID_MAY_VNPAY, ma, A.tam_tinh, '0');
  ok('Mã phản hồi sai dạng → lỗi 23514, không ghi', saiMa.loi !== null && saiMa.ma === '23514' && (await lan(ma)).trang_thai === 'cho', vi(saiMa));

  const dung = await ipn(UID_MAY_VNPAY, ma, A.tam_tinh);
  const l = await lan(ma);
  ok('IPN đúng → da_ghi (RspCode 00), lần trả "da_tra"', dung.kq === 'da_ghi' && l.trang_thai === 'da_tra', vi(dung));
  ok('Ghi đủ mã VNPay, ngân hàng, mã phản hồi, lúc trả (giờ VN), lúc IPN',
     l.ma_vnpay === '14151617' && l.ngan_hang === 'NCB' && l.ma_phan_hoi === '00' && l.trang_thai_gd === '00'
     && new Date(l.tra_luc).toISOString() === '2026-11-12T03:15:30.000Z' && l.ipn_luc !== null, JSON.stringify(l));

  const lai = await ipn(UID_MAY_VNPAY, ma, A.tam_tinh, '24', '02');
  ok('VNPay gửi lại IPN (kể cả khác mã) → da_xac_nhan (RspCode 02), giữ kết quả cũ',
     lai.kq === 'da_xac_nhan' && (await lan(ma)).trang_thai === 'da_tra' && (await lan(ma)).ma_phan_hoi === '00', vi(lai));
  const laiSaiTien = await ipn(UID_MAY_VNPAY, ma, A.tam_tinh + 1);
  ok('Đã có kết quả mà số tiền sai → vẫn sai_tien (VNPay kiểm số tiền trước trạng thái)', laiSaiTien.kq === 'sai_tien', vi(laiSaiTien));
});

// ===========================================================================
await nhom('3 · BẤM HAI LẦN, TRẢ HAI LẦN, TRẢ LẠI SAU KHI HỦY', async () => {
  const daTra = await mo(A.ma_gui);
  ok('Đơn đã trả đủ → mở lại không tạo lần mới, da_tra = true, không mã giao dịch',
     daTra.kq?.da_tra === true && daTra.kq?.ma_giao_dich === null
     && Number((await mot(`select count(*) n from thanh_toan_vnpay_web t join don_mua_thit d on d.id = t.don_id where d.ma_don = $1`, [A.ma_don])).n) === 1,
     vi(daTra));

  const B = await datDon();
  const b1 = await mo(B.ma_gui), b2 = await mo(B.ma_gui);
  ok('Bấm đúp → hai lần trả 01, 02 (VNPay không nhận lại mã cũ), cùng số tiền',
     b1.kq?.ma_giao_dich === `${B.ma_don}01` && b2.kq?.ma_giao_dich === `${B.ma_don}02` && b1.kq?.so_tien === b2.kq?.so_tien, `${vi(b1)} | ${vi(b2)}`);
  const huy = await ipn(UID_MAY_VNPAY, `${B.ma_don}01`, B.tam_tinh, '24', '02', '0', 'NCB');
  ok('Khách hủy trên VNPay (24) → da_ghi, lần 01 "that_bai", không lúc trả', huy.kq === 'da_ghi'
     && (await lan(`${B.ma_don}01`)).trang_thai === 'that_bai' && (await lan(`${B.ma_don}01`)).tra_luc === null, vi(huy));
  const ma00Gd02 = await ipn(UID_MAY_VNPAY, `${B.ma_don}02`, B.tam_tinh, '00', '02');
  ok('Mã phản hồi 00 mà trạng thái giao dịch 02 → that_bai (không phải đã trả)',
     ma00Gd02.kq === 'da_ghi' && (await lan(`${B.ma_don}02`)).trang_thai === 'that_bai', vi(ma00Gd02));
  const b3 = await mo(B.ma_gui);
  ok('Hai lần chưa trả → mở được lần 03', b3.kq?.ma_giao_dich === `${B.ma_don}03` && b3.kq?.da_tra === false, vi(b3));
  const thieuGd = await ipn(UID_MAY_VNPAY, `${B.ma_don}03`, B.tam_tinh, '00', null);
  ok('Mã 00, thiếu trạng thái giao dịch → đã trả (như trang thử của máy chủ đơn)',
     thieuGd.kq === 'da_ghi' && (await lan(`${B.ma_don}03`)).trang_thai === 'da_tra', vi(thieuGd));

  // Trả hai lần: khách mở hai thẻ, trả cả hai.
  const C = await datDon();
  const c1 = await mo(C.ma_gui), c2 = await mo(C.ma_gui);
  await ipn(UID_MAY_VNPAY, c1.kq.ma_giao_dich, C.tam_tinh);
  const tra2 = await ipn(UID_MAY_VNPAY, c2.kq.ma_giao_dich, C.tam_tinh);
  ok('Lần thứ hai cũng trả xong → vẫn ghi (tiền đã trừ, phải biết để hoàn)', tra2.kq === 'da_ghi', vi(tra2));
  const ht = await hopThu(UID.thuNganA, C.ma_don);
  ok('Hộp thư: da_tra = 2 × tạm tính (trang ghi số phải hoàn)', Number(ht.don?.da_tra) === 2 * C.tam_tinh, vi(ht));

  const D = await datDon();
  for (let i = 1; i <= 10; i++) await mo(D.ma_gui);
  const quaLan = await mo(D.ma_gui);
  ok('Lần thứ 11 → "đã mở trang trả tiền quá nhiều lần"', quaLan.loi !== null && /^Đơn này đã mở trang trả tiền quá nhiều lần/.test(quaLan.loi), vi(quaLan));
  ok('…và không có dòng thứ 11', Number((await mot(`select count(*) n from thanh_toan_vnpay_web t join don_mua_thit d on d.id = t.don_id where d.ma_don = $1`, [D.ma_don])).n) === 10);
});

// ===========================================================================
await nhom('4 · ĐƠN ĐÃ HỦY / ĐÃ GIAO', async () => {
  const E = await datDon();
  const { id } = await mot(`select id from don_mua_thit where ma_don = $1`, [E.ma_don]);
  const huy = await goi(UID.thuNganA, `select don_mua_thit_chuyen($1::uuid, 'cho_xac_nhan', 'da_huy') as r`, [id]);
  ok('(Thu ngân hủy đơn)', huy.kq === 'da_chuyen', vi(huy));
  const x = await mo(E.ma_gui);
  ok('Đơn đã hủy → "Đơn này đã hủy, không trả tiền được nữa"', x.loi !== null && /^Đơn này đã hủy, không trả tiền được nữa/.test(x.loi), vi(x));

  const F = await datDon();
  const { id: idF } = await mot(`select id from don_mua_thit where ma_don = $1`, [F.ma_don]);
  await goi(UID.thuNganA, `select don_mua_thit_chuyen($1::uuid, 'cho_xac_nhan', 'da_xac_nhan') as r`, [idF]);
  await goi(UID.thuNganA, `select don_mua_thit_chuyen($1::uuid, 'da_xac_nhan', 'da_giao') as r`, [idF]);
  const y = await mo(F.ma_gui);
  ok('Đơn đã giao → "Đơn này đã giao xong"', y.loi !== null && /^Đơn này đã giao xong/.test(y.loi), vi(y));
});

// ===========================================================================
let G;
await nhom('5 · TRANG KẾT QUẢ: CHỈ GHI DẤU KHÁCH ĐÃ VỀ, KHÔNG ĐỔI TRẠNG THÁI', async () => {
  G = await datDon();
  const g1 = await mo(G.ma_gui);
  const ma = g1.kq.ma_giao_dich;
  const v1 = await ve(UID_MAY_VNPAY, ma, '00');
  ok('Khách về với mã 00 trước IPN → thay, trang_thai "cho", don_da_tra false',
     v1.kq?.thay === true && v1.kq?.trang_thai === 'cho' && v1.kq?.don_da_tra === false && v1.kq?.ma_don === G.ma_don, vi(v1));
  const l1 = await lan(ma);
  ok('…lần trả vẫn "cho" (chỉ IPN đổi), có ve_luc và ve_ma_phan_hoi 00', l1.trang_thai === 'cho' && l1.ve_luc !== null && l1.ve_ma_phan_hoi === '00');
  await db.query(`update thanh_toan_vnpay_web set ve_luc = ve_luc - interval '1 minute' where ma_giao_dich = $1`, [ma]);
  const truoc = (await lan(ma)).ve_luc;
  const v2 = await ve(UID_MAY_VNPAY, ma, '24');
  const l2 = await lan(ma);
  ok('F5 trang kết quả (kể cả mã khác) → giữ dấu lần về đầu', v2.kq?.thay === true
     && new Date(l2.ve_luc).getTime() === new Date(truoc).getTime() && l2.ve_ma_phan_hoi === '00', JSON.stringify(l2));
  const ht = await hopThu(UID.qlA, G.ma_don);
  ok('Hộp thư: khách về đã trả mà VNPay chưa báo → khach_ve_da_tra, da_tra 0, so_lan_mo 1',
     ht.don?.khach_ve_da_tra === true && Number(ht.don?.da_tra) === 0 && ht.don?.so_lan_mo === 1, vi(ht));

  const khong = await ve(UID_MAY_VNPAY, 'ZZZZZZ01', '00');
  ok('Mã giao dịch không có → {thay: false}', khong.kq?.thay === false, vi(khong));

  await ipn(UID_MAY_VNPAY, ma, G.tam_tinh, '00', '00', '99887766');
  const v3 = await ve(UID_MAY_VNPAY, ma, '00');
  ok('Sau IPN → trang đọc lại: da_tra, don_da_tra true', v3.kq?.trang_thai === 'da_tra' && v3.kq?.don_da_tra === true, vi(v3));
  const ht2 = await hopThu(UID.qlA, G.ma_don);
  ok('Hộp thư: da_tra = tạm tính, mã VNPay, lúc trả; hết cờ khach_ve_da_tra',
     Number(ht2.don?.da_tra) === G.tam_tinh && ht2.don?.ma_vnpay === '99887766' && ht2.don?.tra_luc !== null
     && ht2.don?.khach_ve_da_tra === false, vi(ht2));
});

// ===========================================================================
await nhom('6 · HỘP THƯ THEO CHI NHÁNH', async () => {
  const H = await datDon('q7');
  await mo(H.ma_gui);
  const qlB = await hopThu(UID.qlB, H.ma_don);
  ok('Quản lý Q7 thấy đơn Q7 với so_lan_mo 1, chưa trả', qlB.don?.so_lan_mo === 1 && Number(qlB.don?.da_tra) === 0, vi(qlB));
  const qlBThayA = await hopThu(UID.qlB, A.ma_don);
  ok('Quản lý Q7 KHÔNG thấy đơn (và tiền) của Q1', qlBThayA.loi === null && qlBThayA.don === null, vi(qlBThayA));
  const mkt = await hopThu(UID.mktA, A.ma_don);
  ok('Marketing không mở được hộp thư (có tiền, địa chỉ)', mkt.loi !== null, vi(mkt));
  const chu = await hopThu(UID.chu, A.ma_don);
  ok('Chủ thấy đơn Q1 đã trả', Number(chu.don?.da_tra) === A.tam_tinh, vi(chu));
  const cu = await hopThu(UID.chu, (await datDon()).ma_don);
  ok('Đơn chưa mở cổng VNPay lần nào → da_tra 0, so_lan_mo 0, ma_vnpay null',
     Number(cu.don?.da_tra) === 0 && cu.don?.so_lan_mo === 0 && cu.don?.ma_vnpay === null, vi(cu));
});

// ===========================================================================
await nhom('7 · ĐÈN SỨC KHỎE "THANH TOÁN VNPAY"', async () => {
  const k = await soLieu();
  ok('suc_khoe_so_lieu có ô vnpay đủ ba số', k?.vnpay && Object.keys(k.vnpay).sort().join(',') === 'ipn_cuoi,lan_mo_30_ngay,ve_chua_ipn', JSON.stringify(k?.vnpay));
  ok('lan_mo_30_ngay đếm mọi lần mở, ipn_cuoi có', Number(k.vnpay.lan_mo_30_ngay) >= 15 && k.vnpay.ipn_cuoi !== null, JSON.stringify(k.vnpay));
  ok('Chưa có lần nào khách về với 00 mà IPN chưa tới → ve_chua_ipn 0', Number(k.vnpay.ve_chua_ipn) === 0, JSON.stringify(k.vnpay));

  const I = await datDon();
  const i1 = await mo(I.ma_gui);
  await ve(UID_MAY_VNPAY, i1.kq.ma_giao_dich, '00');
  ok(`Khách vừa về với 00 (chưa quá ${PHUT_CHO_IPN_VNPAY} phút) → chưa đỏ`, Number((await soLieu()).vnpay.ve_chua_ipn) === 0);
  await db.query(`update thanh_toan_vnpay_web set ve_luc = now() - interval '11 minutes' where ma_giao_dich = $1`, [i1.kq.ma_giao_dich]);
  const k2 = await soLieu();
  ok('Quá 10 phút mà IPN chưa tới → ve_chua_ipn 1', Number(k2.vnpay.ve_chua_ipn) === 1, JSON.stringify(k2.vnpay));
  const sk = danhGiaSucKhoe(k2, 'vi', true);
  const den = sk.khoi.find(x => x.ma === 'thuong_hieu')?.den.find(d => d.ma === 'vnpay');
  ok('Đèn Thanh toán VNPay đỏ, câu nói đúng số lần và chỗ đối chiếu', den?.mau === 'do' && /^1 lần khách trả xong trên VNPay/.test(den?.cau ?? '')
     && /trang quản lý của VNPay/.test(den?.cau ?? '') && den?.di === '/noi-bo/don-mua-thit', `${den?.mau} — ${den?.cau}`);
  ok('Interval của ve_chua_ipn trong 0115 bằng PHUT_CHO_IPN_VNPAY',
     readFileSync(join(MIG, '0115_mua_thit_vnpay.sql'), 'utf8').includes(`t.ve_luc < now() - interval '${PHUT_CHO_IPN_VNPAY} minutes'`));
  await db.query(`update thanh_toan_vnpay_web set ve_luc = now() - interval '25 hours' where ma_giao_dich = $1`, [i1.kq.ma_giao_dich]);
  ok('Quá 24 giờ thì không còn đếm (đèn không đỏ mãi vì một lần cũ)', Number((await soLieu()).vnpay.ve_chua_ipn) === 0);
  await ipn(UID_MAY_VNPAY, i1.kq.ma_giao_dich, I.tam_tinh);
  await db.query(`update thanh_toan_vnpay_web set ve_luc = now() - interval '11 minutes' where ma_giao_dich = $1`, [i1.kq.ma_giao_dich]);
  ok('IPN tới rồi → không đếm nữa', Number((await soLieu()).vnpay.ve_chua_ipn) === 0);

  const xanh = danhGiaSucKhoe(await soLieu(), 'vi', true).khoi[0].den.find(d => d.ma === 'vnpay');
  ok('Khi ổn: xanh, "VNPay báo kết quả về bình thường"', xanh?.mau === 'xanh' && /VNPay báo kết quả về bình thường/.test(xanh?.cau ?? ''), `${xanh?.mau} — ${xanh?.cau}`);
});

// ===========================================================================
await nhom('8 · CÂU CHỮ', async () => {
  const sql = readFileSync(join(MIG, '0115_mua_thit_vnpay.sql'), 'utf8');
  const cauMoi = [...sql.matchAll(/raise exception '([^']+)'/g)].map(m => m[1]);
  ok('Đọc được các câu raise của 0115', cauMoi.length >= 8, String(cauMoi.length));
  const cauMay = cauMoi.filter(c => /VNPay/.test(c));
  const congKhai = cauMoi.filter(c => !cauMay.includes(c) && !/quyền xem đơn mua thịt/.test(c));
  ok('Có đúng năm câu khách đọc (mua_thit_mo_vnpay)', congKhai.length === 5, congKhai.join(' | '));
  for (const cau of congKhai) {
    const en = cauLoiDatabase(cau, 'en', '__CHUNG__');
    const ko = cauLoiDatabase(cau, 'ko', '__CHUNG__');
    ok(`Câu công khai có bản en, ko: "${cau}"`, en !== '__CHUNG__' && ko !== '__CHUNG__' && !/[ăâđêôơư]/i.test(en), `${en} | ${ko}`);
  }
  for (const cau of [...new Set(cauMay)]) {
    const en = dichCau('en', cau);
    ok(`Câu của máy có bản en: "${cau}"`, en !== cau && !/[ăâđêôơư]/i.test(en), en);
  }

  const { rows } = await db.query(`select khoa, mo_ta from khoa_cong_bo where khoa = any($1)`, [['hien_mua_thit_ve', 'mua_thit_giao_hang']]);
  const moTa = Object.fromEntries(rows.map(r => [r.khoa, r.mo_ta]));
  ok('hien_mua_thit_ve nói: có VNPay thì trả trước, giá gói đã gồm phí giao; chưa cài thì website không thu tiền',
     /trả trước qua VNPay/.test(moTa.hien_mua_thit_ve) && /giá gói đã gồm phí giao/.test(moTa.hien_mua_thit_ve)
     && /chưa cài VNPay thì website không thu tiền/.test(moTa.hien_mua_thit_ve), moTa.hien_mua_thit_ve);
  ok('mua_thit_giao_hang nói: có VNPay thì chỉ ghi khu vực giao', /chỉ ghi khu vực giao/.test(moTa.mua_thit_giao_hang), moTa.mua_thit_giao_hang);
  ok('Bản tiếng Anh của hai mô tả cùng ý', /pay in advance through VNPay/.test(MO_TA_KHOA_EN.hien_mua_thit_ve ?? '')
     && /pack prices include delivery/.test(MO_TA_KHOA_EN.mua_thit_giao_hang ?? ''));
});

// ===========================================================================
await nhom('9 · SỔ KHO', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('kho_doi_soat_ton() rỗng', rows.length === 0, JSON.stringify(rows).slice(0, 200));
});

process.exit(ketThuc('MUA THỊT VỀ — TRẢ TRƯỚC QUA VNPAY'));
