/**
 * BEEFTOWN KHO — Kiểm thử máy tính bảng dùng chung + chủ tự tạo tài khoản (GĐ5d, 0034)
 * ================================================================================
 *
 *     node test/test-kho-may-chung.mjs
 *
 * Câu hỏi, theo thứ tự quan trọng:
 *
 * 1. Tài khoản máy có đọc được dữ liệu kho / CRM nào không? (không được)
 * 2. Đoán PIN có bị chặn không? 5 lần sai → khóa người 15 phút; 15 lần sai
 *    trong 30 phút (hoặc 30 lần trong 24 giờ) trên một máy → khóa máy tới
 *    khi quản lý mở.
 * 3. Ai gắn được vào máy nào: chính người đó, cùng chi nhánh với máy.
 *    Người thường không kiểm PIN thay máy được. Máy bị tắt thì hết phiên.
 * 4. Chỉ chủ tạo tài khoản, chỉ vai kho / vai máy, không gắn trùng uid.
 * 5. Phần mã hóa ở Worker (web/src/lib/kho/may-chung-ma-hoa.ts) chạy thẳng
 *    trong Node: khứ hồi, sửa AAD / sai khóa là hỏng, HMAC PIN ổn định và
 *    khác theo máy / người, biên thời gian tự khóa.
 * 6. Cookie bt_phien vẫn đúng định dạng phien.ts ghi (file đổi phiên của máy
 *    dùng chung không được viết một định dạng khác).
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';
import {
  danKhoaMay, danKhoa, maHoaToken, giaiMaToken, bamPin, kyMoc, kiemMoc, tenCookieNguoi,
  daQuaGioKhoa, giayConLai, biMatHopLe, pinHopLe, aadToken,
  PHUT_KHOA_MAC_DINH, AN_HAN_POST, COOKIE_MAY_NGUOI_TIEN_TO,
} from '../../web/src/lib/kho/may-chung-ma-hoa.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — MÁY DÙNG CHUNG · CHỦ TẠO TÀI KHOẢN');

// Bí mật chỉ dùng cho test — giá trị thật nằm trong bí mật Worker KHO_MAY_KHOA.
const BI_MAT = 'bi-mat-chi-de-test-khong-dung-that-0123456789';
const BI_MAT_KHAC = 'mot-bi-mat-khac-hoan-toan-cung-du-dai-9876543210';
const khoa = await danKhoaMay(BI_MAT);
const khoaKhac = await danKhoaMay(BI_MAT_KHAC);

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';

// ===========================================================================
await nhom('1 · MÃ HÓA TOKEN (AES-GCM, AAD = may_id|nhan_su_id)', async () => {
  const token = 'v1.refresh-token-mau_ABCxyz-0123456789';
  const ma = await maHoaToken(khoa, token, aadToken(A, B));
  ok('Khứ hồi: giải mã ra đúng token', await giaiMaToken(khoa, ma, aadToken(A, B)) === token);
  ok('Chuỗi mã hóa an toàn trong cookie (v1. + base64url)', /^v1\.[A-Za-z0-9_-]+$/.test(ma), ma);
  ok('Chuỗi mã hóa không chứa token rõ', !ma.includes('refresh'));
  const ma2 = await maHoaToken(khoa, token, aadToken(A, B));
  ok('Mã hóa hai lần ra hai chuỗi khác (iv ngẫu nhiên)', ma !== ma2);
  ok('Sai AAD (cookie người này bê sang người khác) → hỏng',
     await giaiMaToken(khoa, ma, aadToken(A, C)) === null);
  ok('Sai AAD (bê sang máy khác) → hỏng', await giaiMaToken(khoa, ma, aadToken(C, B)) === null);
  ok('Sai khóa (đổi KHO_MAY_KHOA) → hỏng', await giaiMaToken(khoaKhac, ma, aadToken(A, B)) === null);

  // Sửa một ký tự ở giữa bản mã.
  const i = 10;
  const sua = ma.slice(0, i) + (ma[i] === 'A' ? 'B' : 'A') + ma.slice(i + 1);
  ok('Sửa một ký tự → hỏng (thẻ GCM)', await giaiMaToken(khoa, sua, aadToken(A, B)) === null);
  ok('Cắt ngắn → hỏng', await giaiMaToken(khoa, ma.slice(0, 20), aadToken(A, B)) === null);
  for (const rac of ['', 'v1.', 'v2.' + ma.slice(3), 'khong-phai-ma', 'v1.!!!', null, undefined]) {
    ok(`Chuỗi rác ${JSON.stringify(rac)} → null, không ném lỗi`,
       await giaiMaToken(khoa, rac, aadToken(A, B)) === null);
  }
  ok('Token có dấu tiếng Việt vẫn khứ hồi',
     await giaiMaToken(khoa, await maHoaToken(khoa, 'thịt bò ✓', 'x'), 'x') === 'thịt bò ✓');
});

// ===========================================================================
await nhom('2 · BĂM PIN (HMAC) · KHÓA THEO MỤC ĐÍCH · BÍ MẬT', async () => {
  const p1 = await bamPin(khoa, A, B, '1234');
  ok('pin_bam là 64 ký tự hex thường (khớp CHECK của 0034)', /^[0-9a-f]{64}$/.test(p1), p1);
  ok('Ổn định: cùng máy, người, PIN → cùng giá trị', p1 === await bamPin(khoa, A, B, '1234'));
  ok('Khác máy → khác', p1 !== await bamPin(khoa, C, B, '1234'));
  ok('Khác người → khác', p1 !== await bamPin(khoa, A, C, '1234'));
  ok('Khác PIN → khác', p1 !== await bamPin(khoa, A, B, '1235'));
  ok('Khác bí mật → khác (lộ database không dò được PIN)', p1 !== await bamPin(khoaKhac, A, B, '1234'));
  ok('PIN 6 số dùng được', /^[0-9a-f]{64}$/.test(await bamPin(khoa, A, B, '098765')));
  for (const sai of ['123', '1234567', '12a4', ' 1234', '', null]) {
    let nem = false;
    try { await bamPin(khoa, A, B, sai); } catch { nem = true; }
    ok(`PIN sai dạng ${JSON.stringify(sai)} → không băm`, nem && !pinHopLe(sai));
  }

  // HKDF theo mục đích: cùng nội dung, khóa pin và khóa moc ra chữ ký khác.
  const kPin = await danKhoa(BI_MAT, 'pin');
  const kMoc = await danKhoa(BI_MAT, 'moc');
  const nd = new TextEncoder().encode('cung-noi-dung');
  const s1 = Buffer.from(await crypto.subtle.sign('HMAC', kPin, nd)).toString('hex');
  const s2 = Buffer.from(await crypto.subtle.sign('HMAC', kMoc, nd)).toString('hex');
  ok('Khóa dẫn xuất cho "pin" khác khóa cho "moc"', s1 !== s2);
  const kTok = await danKhoa(BI_MAT, 'token');
  ok('Khóa "token" là AES-GCM, không dùng để ký được', kTok.algorithm.name === 'AES-GCM'
     && !kTok.usages.includes('sign'));

  ok('Bí mật ngắn hơn 32 ký tự → không hợp lệ', !biMatHopLe('ngan-qua') && !biMatHopLe('') && !biMatHopLe(undefined));
  ok('Bí mật đủ dài → hợp lệ', biMatHopLe(BI_MAT));
  let nem = false;
  try { await danKhoaMay('ngan-qua'); } catch { nem = true; }
  ok('danKhoaMay với bí mật ngắn → ném lỗi (tính năng tắt)', nem);

  const t1 = await tenCookieNguoi(khoa, A, B);
  ok('Tên cookie người: bt_may_s_<8 hex>', new RegExp(`^${COOKIE_MAY_NGUOI_TIEN_TO}[0-9a-f]{8}$`).test(t1), t1);
  ok('Tên cookie ổn định, khác theo người, không chứa id', t1 === await tenCookieNguoi(khoa, A, B)
     && t1 !== await tenCookieNguoi(khoa, A, C) && !t1.includes(B.slice(0, 8)));
});

// ===========================================================================
await nhom('3 · MỐC HOẠT ĐỘNG CÓ CHỮ KÝ (bt_may_hd)', async () => {
  const moc = { mayId: A, nhanSuId: B, luc: 1_790_000_000_000 };
  const s = await kyMoc(khoa, moc);
  const doc = await kiemMoc(khoa, s);
  ok('Ký rồi kiểm: ra đúng mốc', doc?.mayId === A && doc?.nhanSuId === B && doc?.luc === moc.luc, JSON.stringify(doc));
  const khoaMan = await kiemMoc(khoa, await kyMoc(khoa, { mayId: A, nhanSuId: null, luc: 5 }));
  ok('Mốc lúc máy đang khóa (không ai dùng) → nhanSuId null', khoaMan?.nhanSuId === null && khoaMan?.luc === 5);
  ok('Sửa lúc (kéo dài giờ khóa) → hỏng', await kiemMoc(khoa, s.replace(String(moc.luc), String(moc.luc + 600000))) === null);
  ok('Đổi người → hỏng', await kiemMoc(khoa, s.replace(B, C)) === null);
  ok('Sai khóa → hỏng', await kiemMoc(khoaKhac, s) === null);
  for (const rac of ['', 'v1.a.b.c.d', `v1.${A}.-.12`, 'x'.repeat(400), null]) {
    ok(`Mốc rác → null`, await kiemMoc(khoa, rac) === null);
  }
  let nem = false;
  try { await kyMoc(khoa, { mayId: 'khong-phai-uuid', nhanSuId: null, luc: 1 }); } catch { nem = true; }
  ok('Không ký mốc sai dạng', nem);
});

// ===========================================================================
await nhom('4 · BIÊN THỜI GIAN TỰ KHÓA', async () => {
  const P = 60_000;
  const t0 = 1_790_000_000_000;
  ok('Mặc định 5 phút, POST ân hạn gấp 2', PHUT_KHOA_MAC_DINH === 5 && AN_HAN_POST === 2);
  ok('GET: 4 phút 59,999 giây → chưa khóa', daQuaGioKhoa(t0, t0 + 5 * P - 1, 5) === false);
  ok('GET: đúng 5 phút → ĐÃ khóa', daQuaGioKhoa(t0, t0 + 5 * P, 5) === true);
  ok('POST: đúng 5 phút → còn ân hạn, vẫn ghi', daQuaGioKhoa(t0, t0 + 5 * P, 5, true) === false);
  ok('POST: 9 phút 59,999 giây → vẫn ghi', daQuaGioKhoa(t0, t0 + 10 * P - 1, 5, true) === false);
  ok('POST: đúng 10 phút → đã khóa, phiếu không được ghi', daQuaGioKhoa(t0, t0 + 10 * P, 5, true) === true);
  ok('phut_khoa = 1 → khóa sau 1 phút', daQuaGioKhoa(t0, t0 + P, 1) === true && daQuaGioKhoa(t0, t0 + P - 1, 1) === false);
  ok('phut_khoa sai (0, 99, NaN) → dùng 5 phút',
     [0, 99, NaN].every(p => daQuaGioKhoa(t0, t0 + 5 * P - 1, p) === false && daQuaGioKhoa(t0, t0 + 5 * P, p) === true));
  ok('Mốc ở tương lai quá 1 phút (đồng hồ lệch / giả) → khóa', daQuaGioKhoa(t0 + 2 * P, t0, 5) === true);
  ok('Mốc ở tương lai trong 1 phút → chưa khóa', daQuaGioKhoa(t0 + 30_000, t0, 5) === false);
  ok('Mốc hỏng (NaN) → khóa', daQuaGioKhoa(NaN, t0, 5) === true);
  ok('Còn lại: vừa hoạt động → 300 giây', giayConLai(t0, t0, 5) === 300);
  ok('Còn lại: 4 phút 30 giây sau → 30 giây', giayConLai(t0, t0 + 4.5 * P, 5) === 30);
  ok('Còn lại: đã quá giờ → 0', giayConLai(t0, t0 + 6 * P, 5) === 0);
});

// ===========================================================================
// DATABASE
// ===========================================================================
const { db, cnA, cnB, nsId, duoi, duoiAnon } = await dungDatabase();

// Supabase có bảng auth.users; khung test chưa có — dựng bản tối thiểu mà
// kho_them_nhan_su cần (id, email).
await db.exec(`create table if not exists auth.users (id uuid primary key, email text)`);
await db.query(`insert into auth.users (id, email) select auth_uid, lower(replace(ho_ten, ' ', '.')) || '@beeftown.test'
                from nhan_su where auth_uid is not null`);

const UID_MAY_A  = '00000000-0000-4000-8000-0000000000d1';
const UID_MAY_A2 = '00000000-0000-4000-8000-0000000000d2';
const UID_MAY_B  = '00000000-0000-4000-8000-0000000000d3';
for (const [uid, cn, ten] of [[UID_MAY_A, cnA.id, 'Tablet quầy Q1'], [UID_MAY_A2, cnA.id, 'Tablet bếp Q1'],
                              [UID_MAY_B, cnB.id, 'Tablet quầy Q7']]) {
  const { rows: [r] } = await db.query(
    `insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro) values ($1, $2, $3, 'may_chung') returning id`,
    [uid, cn, ten]);
  nsId[uid] = r.id;
  await db.query(`insert into auth.users (id, email) values ($1, $2)`, [uid, `may-${uid.slice(-2)}@beeftown.test`]);
}

/** Gọi một RPC trả jsonb, lấy kết quả. */
async function rpc(uid, sql, params = []) {
  const r = await duoi(uid, `select ${sql} as kq`, params);
  return { kq: r.rows?.[0]?.kq ?? null, loi: r.loi };
}

// Dữ liệu kho để "máy không đọc được gì" có ý nghĩa: khởi tạo kho Q1.
await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);

let mayA = null;   // may_id của tablet quầy Q1

// ===========================================================================
await nhom('5 · ĐĂNG KÝ MÁY (quản lý chi nhánh)', async () => {
  const tk = await rpc(UID.thuKhoA, `kho_dang_ky_may($1, 'Quầy', 5)`, [UID_MAY_A]);
  ok('Thủ kho KHÔNG đăng ký được máy', tk.loi !== null, tk.loi ?? 'ĐĂNG KÝ ĐƯỢC');
  const qlB = await rpc(UID.qlB, `kho_dang_ky_may($1, 'Quầy', 5)`, [UID_MAY_A]);
  ok('Quản lý Q7 KHÔNG đăng ký được máy của Q1', qlB.loi !== null, qlB.loi ?? 'ĐĂNG KÝ ĐƯỢC');
  const nguoi = await rpc(UID.qlA, `kho_dang_ky_may($1, 'Quầy', 5)`, [UID.thuKhoA]);
  ok('Tài khoản người (không phải may_chung) KHÔNG đăng ký làm máy được',
     nguoi.loi !== null && /không phải tài khoản máy/.test(nguoi.loi), nguoi.loi ?? 'ĐĂNG KÝ ĐƯỢC');
  const phut = await rpc(UID.qlA, `kho_dang_ky_may($1, 'Quầy', 0)`, [UID_MAY_A]);
  ok('Phút tự khóa 0 → từ chối', phut.loi !== null);

  const dk = await rpc(UID.qlA, `kho_dang_ky_may($1, 'Tablet quầy', 5)`, [UID_MAY_A]);
  ok('Quản lý Q1 đăng ký được máy', dk.loi === null && dk.kq?.moi === true && dk.kq?.phut_khoa === 5
     && dk.kq?.nhan_su_id === nsId[UID_MAY_A] && dk.kq?.chi_nhanh_id === cnA.id, dk.loi ?? JSON.stringify(dk.kq));
  mayA = dk.kq?.may_id;

  const lai = await rpc(UID.qlA, `kho_dang_ky_may($1, 'Tablet quầy thịt', 3)`, [UID_MAY_A]);
  ok('Đăng ký lại cùng tài khoản = sửa tên / phút khóa, cùng may_id',
     lai.kq?.may_id === mayA && lai.kq?.moi === false && lai.kq?.ten === 'Tablet quầy thịt' && lai.kq?.phut_khoa === 3,
     lai.loi ?? JSON.stringify(lai.kq));
  await rpc(UID.qlA, `kho_dang_ky_may($1, 'Tablet quầy', 5)`, [UID_MAY_A]);

  const chu = await rpc(UID.chu, `kho_dang_ky_may($1, 'Tablet bếp', 5)`, [UID_MAY_A2]);
  ok('Chủ đăng ký được máy ở chi nhánh bất kỳ', chu.loi === null && chu.kq?.moi === true, chu.loi ?? '');
  const b = await rpc(UID.qlB, `kho_dang_ky_may($1, 'Tablet Q7', 5)`, [UID_MAY_B]);
  ok('Quản lý Q7 đăng ký máy Q7', b.loi === null, b.loi ?? '');

  const ds = await rpc(UID.qlA, `kho_ds_may($1)`, [cnA.id]);
  ok('kho_ds_may: quản lý Q1 thấy 2 máy Q1', ds.kq?.length === 2, ds.loi ?? JSON.stringify(ds.kq));
  const dsAll = await rpc(UID.qlA, `kho_ds_may()`);
  ok('kho_ds_may() không lọc: quản lý Q1 vẫn không thấy máy Q7', dsAll.kq?.length === 2);
  const dsChu = await rpc(UID.chu, `kho_ds_may()`);
  ok('Chủ thấy máy mọi chi nhánh', dsChu.kq?.length === 3);
  const dsTk = await rpc(UID.thuKhoA, `kho_ds_may($1)`, [cnA.id]);
  ok('Thủ kho: kho_ds_may rỗng (không có duyet)', dsTk.loi === null && dsTk.kq?.length === 0, dsTk.loi ?? '');
  ok('Nhật ký ghi lần đăng ký', (await db.query(
    `select count(*)::int as n from kho_may_nhat_ky where may_id = $1 and su_kien = 'dang_ky'`, [mayA])).rows[0].n === 3);
});

const pinCua = (uid, pin) => bamPin(khoa, mayA, nsId[uid], pin);

// ===========================================================================
await nhom('6 · GẮN NGƯỜI VÀO MÁY (chính người đó, cùng chi nhánh)', async () => {
  const gan = async (uid, pin, may = mayA) => rpc(uid, `kho_may_gan_nguoi($1, $2)`, [may, await pinCua(uid, pin)]);

  const tk = await gan(UID.thuKhoA, '1111');
  ok('Thủ kho Q1 gắn được vào máy Q1', tk.loi === null && tk.kq?.nhan_su_id === nsId[UID.thuKhoA]
     && tk.kq?.gan_lai === false && tk.kq?.phut_khoa === 5, tk.loi ?? JSON.stringify(tk.kq));
  ok('NV quầy Q1 gắn được', (await gan(UID.nvQuayA, '2222')).loi === null);
  ok('Quản lý Q1 gắn được', (await gan(UID.qlA, '3333')).loi === null);

  const b = await gan(UID.thuKhoB, '4444');
  ok('Thủ kho Q7 KHÔNG gắn được vào máy Q1 (khác chi nhánh)', b.loi !== null, b.loi ?? 'GẮN ĐƯỢC');
  const tn = await gan(UID.thuNganA, '4444');
  ok('Thu ngân Q1 (không dùng kho) KHÔNG gắn được', tn.loi !== null, tn.loi ?? 'GẮN ĐƯỢC');
  const nghi = await gan(UID.nghiViec, '4444');
  ok('Người đã nghỉ việc KHÔNG gắn được', nghi.loi !== null);
  const may = await gan(UID_MAY_A2, '4444');
  ok('Tài khoản máy KHÔNG gắn được vào máy khác', may.loi !== null);
  const tho = await rpc(UID.keToanA, `kho_may_gan_nguoi($1, '1234')`, [mayA]);
  ok('Gửi PIN thô (không băm) → từ chối', tho.loi !== null && /không đúng dạng/.test(tho.loi), tho.loi ?? 'NHẬN');

  const lai = await gan(UID.thuKhoA, '1111');
  ok('Gắn lại = đổi PIN (gan_lai true)', lai.kq?.gan_lai === true);

  // Không ai đọc thẳng được bảng PIN — kể cả chủ và quản lý.
  for (const [ten, uid] of [['chủ', UID.chu], ['quản lý', UID.qlA], ['thủ kho', UID.thuKhoA], ['máy', UID_MAY_A]]) {
    const r = await duoi(uid, `select count(*)::int as n from kho_may_nguoi`);
    ok(`${ten} không đọc được dòng nào của kho_may_nguoi (không có policy SELECT)`,
       r.loi !== null || r.rows[0].n === 0, r.loi ?? `thấy ${r.rows?.[0]?.n}`);
  }
  const ds = await rpc(UID.qlA, `kho_ds_may($1)`, [cnA.id]);
  const may1 = ds.kq?.find(m => m.id === mayA);
  ok('kho_ds_may: có 3 người đã gắn, không có PIN', may1?.nguoi?.length === 3
     && !JSON.stringify(ds.kq).includes('pin_bam') && !JSON.stringify(ds.kq).includes(await pinCua(UID.thuKhoA, '1111')));

  const dat = await rpc(UID.nvQuayA, `kho_may_dat_pin($1, $2)`, [mayA, await pinCua(UID.nvQuayA, '2222')]);
  ok('Người đã gắn tự đổi PIN được', dat.loi === null, dat.loi ?? '');
  const datLa = await rpc(UID.keToanA, `kho_may_dat_pin($1, $2)`, [mayA, await pinCua(UID.keToanA, '2222')]);
  ok('Người CHƯA gắn không đặt PIN được', datLa.loi !== null);
});

// ===========================================================================
await nhom('7 · "AI ĐANG DÙNG MÁY?" — CHỈ PHIÊN MÁY GỌI ĐƯỢC', async () => {
  const ds = await rpc(UID_MAY_A, `kho_may_ds_nguoi()`);
  ok('Máy thấy 3 người đã gắn', ds.loi === null && ds.kq?.nguoi?.length === 3, ds.loi ?? JSON.stringify(ds.kq));
  ok('Máy biết thông tin của chính nó', ds.kq?.may?.id === mayA && ds.kq?.may?.phut_khoa === 5
     && ds.kq?.may?.bi_khoa === false && ds.kq?.may?.ten_chi_nhanh === cnA.ten);
  ok('Danh sách không có PIN', !JSON.stringify(ds.kq).includes('pin'));
  const may2 = await rpc(UID_MAY_A2, `kho_may_ds_nguoi()`);
  ok('Máy thứ hai thấy danh sách của nó (chưa ai gắn)', may2.kq?.nguoi?.length === 0, may2.loi ?? '');

  for (const [ten, uid] of [['Thủ kho', UID.thuKhoA], ['Quản lý', UID.qlA], ['Chủ', UID.chu], ['Máy iPOS / người lạ', null]]) {
    const d = await rpc(uid, `kho_may_ds_nguoi()`);
    ok(`${ten} KHÔNG gọi được kho_may_ds_nguoi`, d.loi !== null, d.loi ?? 'GỌI ĐƯỢC');
    const k = await rpc(uid, `kho_may_kiem_pin($1, $2)`, [nsId[UID.thuKhoA], await pinCua(UID.thuKhoA, '1111')]);
    ok(`${ten} KHÔNG gọi được kho_may_kiem_pin`, k.loi !== null, k.loi ?? 'GỌI ĐƯỢC');
  }
  const anon = await duoiAnon(`select kho_may_kiem_pin($1, $2)`, [nsId[UID.thuKhoA], await pinCua(UID.thuKhoA, '1111')]);
  ok('anon KHÔNG gọi được kho_may_kiem_pin', anon.loi !== null && /permission denied/i.test(anon.loi), anon.loi ?? '');

  const khac = await rpc(UID_MAY_A2, `kho_may_kiem_pin($1, $2)`, [nsId[UID.thuKhoA], await pinCua(UID.thuKhoA, '1111')]);
  ok('Máy khác KHÔNG kiểm được PIN của người không gắn vào nó', khac.loi !== null, khac.loi ?? JSON.stringify(khac.kq));
});

// ===========================================================================
await nhom('8 · MÁY KHÔNG ĐỌC ĐƯỢC DỮ LIỆU KHO / CRM', async () => {
  const { rows: bang } = await db.query(`select tablename from pg_tables where schemaname = 'public' order by 1`);
  const lot = [];
  for (const { tablename } of bang) {
    const r = await duoi(UID_MAY_A, `select count(*)::int as n from ${tablename}`);
    const cho = tablename === 'nhan_su' ? 1 : 0;              // hồ sơ của chính nó
    const dungChung = ['khung_anh', 'tep_anh', 'khoa_cong_bo', 'noi_dung_cong_bo', 'mon_an', 'nhom_mon', 'mau_tin'];
    if (dungChung.includes(tablename)) continue;              // bảng thương hiệu công khai (xem test-kho-quyen)
    if (r.loi === null && r.rows[0].n > cho) lot.push(`${tablename}(${r.rows[0].n})`);
  }
  ok('Máy không đọc được dòng nào ở bảng kho / CRM (kể cả kho_may, nhật ký)', lot.length === 0, lot.join(', '));
  const coKho = (await db.query(`select count(*)::int as n from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows[0].n;
  ok('(Q1 thật sự có dữ liệu kho để mà lộ)', coKho > 0);

  for (const sql of [`kho_dem_viec('${cnA.id}')`, `kho_ds_may('${cnA.id}')`, `kho_ds_nhan_su_kho()`,
                     `kho_cn_duoc('xem')`]) {
    const r = await rpc(UID_MAY_A, sql);
    const rong = r.loi !== null || (Array.isArray(r.kq) && r.kq.length === 0);
    ok(`Máy gọi ${sql.replace(/'.*'/, '…')} → lỗi hoặc rỗng`, rong, r.loi ?? JSON.stringify(r.kq));
  }
  const ghi = await rpc(UID_MAY_A, `kho_them_nhan_su($1, 'X', 'thu_kho', $2)`, [UID_MAY_B, cnA.id]);
  ok('Máy KHÔNG tạo được nhân sự', ghi.loi !== null);
  const diem = await duoi(UID_MAY_A, `select * from ghi_luot_ghe($1, '0933333333', 500000::bigint)`, [cnA.id]);
  ok('Máy KHÔNG ghi được CRM (tường ngăn 0018)', diem.loi !== null);
});

// ===========================================================================
await nhom('9 · KIỂM PIN — ĐÚNG, SAI, 5 LẦN SAI KHÓA NGƯỜI 15 PHÚT', async () => {
  const kiem = async (uid, pin, may = UID_MAY_A) =>
    rpc(may, `kho_may_kiem_pin($1, $2)`, [nsId[uid], await pinCua(uid, pin)]);

  const d = await kiem(UID.thuKhoA, '1111');
  ok('Đúng PIN → dung', d.kq?.ket_qua === 'dung' && d.kq?.dung === true && d.kq?.ho_ten === 'Thủ kho Q1',
     d.loi ?? JSON.stringify(d.kq));
  const { rows: [m] } = await db.query(`select nguoi_dang_dung from kho_may where id = $1`, [mayA]);
  ok('Máy ghi người đang dùng', m.nguoi_dang_dung === nsId[UID.thuKhoA]);

  const ketQua = [];
  for (let i = 0; i < 4; i++) ketQua.push((await kiem(UID.thuKhoA, '9999')).kq);
  ok('Sai 4 lần → "sai", còn 4, 3, 2, 1 lần', ketQua.every(k => k?.ket_qua === 'sai')
     && ketQua.map(k => k.con_lan).join() === '4,3,2,1', JSON.stringify(ketQua));
  const lan5 = await kiem(UID.thuKhoA, '9999');
  ok('Sai lần thứ 5 → khóa người', lan5.kq?.ket_qua === 'khoa_nguoi' && !!lan5.kq?.khoa_den, JSON.stringify(lan5.kq));
  const phut = (new Date(lan5.kq?.khoa_den) - Date.now()) / 60000;
  ok('Khóa khoảng 15 phút', phut > 14 && phut <= 15.1, `${phut}`);
  const dungKhiKhoa = await kiem(UID.thuKhoA, '1111');
  ok('Đang khóa thì đúng PIN cũng KHÔNG vào được', dungKhiKhoa.kq?.ket_qua === 'khoa_nguoi');
  const ds = await rpc(UID_MAY_A, `kho_may_ds_nguoi()`);
  ok('Màn chọn người thấy người này đang khóa (khoa_den)',
     !!ds.kq?.nguoi?.find(n => n.nhan_su_id === nsId[UID.thuKhoA])?.khoa_den);

  const nvDung = await kiem(UID.nvQuayA, '2222');
  ok('Người khác trên cùng máy vẫn vào được', nvDung.kq?.ket_qua === 'dung');

  // Hết 15 phút.
  await db.query(`update kho_may_nguoi set khoa_den = now() - interval '1 second' where nhan_su_id = $1`, [nsId[UID.thuKhoA]]);
  const sauKhoa = await kiem(UID.thuKhoA, '1111');
  ok('Hết 15 phút → đúng PIN vào được', sauKhoa.kq?.ket_qua === 'dung', JSON.stringify(sauKhoa.kq));
  await kiem(UID.thuKhoA, '9999');
  const sauDung = await kiem(UID.thuKhoA, '9999');
  ok('Đúng PIN đặt lại số lần sai (sai tiếp → còn 3)', sauDung.kq?.con_lan === 3, JSON.stringify(sauDung.kq));
  await kiem(UID.thuKhoA, '1111');

  // Quản lý mở khóa người.
  for (let i = 0; i < 5; i++) await kiem(UID.nvQuayA, '0000');
  const tkMo = await rpc(UID.thuKhoA, `kho_may_mo_khoa($1, $2)`, [mayA, nsId[UID.nvQuayA]]);
  ok('Thủ kho KHÔNG mở khóa người được', tkMo.loi !== null);
  const qlMo = await rpc(UID.qlA, `kho_may_mo_khoa($1, $2)`, [mayA, nsId[UID.nvQuayA]]);
  ok('Quản lý mở khóa người', qlMo.loi === null && (await kiem(UID.nvQuayA, '2222')).kq?.ket_qua === 'dung', qlMo.loi ?? '');

  const khongGan = await rpc(UID_MAY_A, `kho_may_kiem_pin($1, $2)`,
    [nsId[UID.keToanA], await bamPin(khoa, mayA, nsId[UID.keToanA], '1234')]);
  ok('Người chưa gắn → báo lỗi, không đoán được', khongGan.loi !== null && /chưa gắn/.test(khongGan.loi), khongGan.loi ?? '');
  const tho = await rpc(UID_MAY_A, `kho_may_kiem_pin($1, '1111')`, [nsId[UID.thuKhoA]]);
  ok('PIN thô → từ chối (database không nhận PIN chưa băm)', tho.loi !== null);
});

// ===========================================================================
await nhom('10 · 15 LẦN SAI / 30 PHÚT TRÊN MỘT MÁY → KHÓA MÁY', async () => {
  const kiem = async (uid, pin) => rpc(UID_MAY_A, `kho_may_kiem_pin($1, $2)`, [nsId[uid], await pinCua(uid, pin)]);
  // Bỏ các lần sai của nhóm 9 cho dễ đếm: coi như đã quá 30 phút.
  await db.query(`update kho_may_nhat_ky set luc = luc - interval '31 minutes' where may_id = $1`, [mayA]);

  const kq = [];
  for (const uid of [UID.thuKhoA, UID.nvQuayA, UID.qlA]) {
    for (let i = 0; i < 5; i++) kq.push((await kiem(uid, '0000')).kq?.ket_qua);
  }
  ok('Lần sai thứ 5 và 10 khóa người, lần 15 khóa MÁY',
     kq[4] === 'khoa_nguoi' && kq[9] === 'khoa_nguoi' && kq[14] === 'khoa_may' && kq.slice(0, 4).every(k => k === 'sai'),
     kq.join(','));
  const { rows: [m] } = await db.query(`select bi_khoa, nguoi_dang_dung from kho_may where id = $1`, [mayA]);
  ok('Máy bị khóa, không còn người đang dùng', m.bi_khoa === true && m.nguoi_dang_dung === null);

  // Mở khóa người (quản lý) nhưng máy vẫn khóa → đúng PIN cũng không vào.
  await rpc(UID.qlA, `kho_may_mo_khoa($1, $2)`, [mayA, nsId[UID.thuKhoA]]);
  const dung = await kiem(UID.thuKhoA, '1111');
  ok('Máy khóa → đúng PIN cũng không vào', dung.kq?.ket_qua === 'khoa_may', JSON.stringify(dung.kq));
  const ds = await rpc(UID_MAY_A, `kho_may_ds_nguoi()`);
  ok('Màn chọn người thấy máy đang khóa', ds.kq?.may?.bi_khoa === true);
  const sai30 = (await rpc(UID.qlA, `kho_ds_may($1)`, [cnA.id])).kq?.find(x => x.id === mayA);
  ok('kho_ds_may báo máy khóa + 15 lần sai trong 30 phút', sai30?.bi_khoa === true && sai30?.sai_30_phut === 15,
     JSON.stringify(sai30?.sai_30_phut));

  const tkMo = await rpc(UID.thuKhoA, `kho_may_mo_khoa($1)`, [mayA]);
  ok('Thủ kho KHÔNG mở khóa máy được', tkMo.loi !== null);
  const qlBMo = await rpc(UID.qlB, `kho_may_mo_khoa($1)`, [mayA]);
  ok('Quản lý Q7 KHÔNG mở khóa máy Q1 được', qlBMo.loi !== null);
  const mo = await rpc(UID.qlA, `kho_may_mo_khoa($1)`, [mayA]);
  ok('Quản lý Q1 mở khóa máy', mo.loi === null, mo.loi ?? '');
  const sauMo = await kiem(UID.thuKhoA, '1111');
  ok('Mở khóa máy → đúng PIN vào được', sauMo.kq?.ket_qua === 'dung', JSON.stringify(sauMo.kq));
  const saiSauMo = await kiem(UID.thuKhoA, '0000');
  ok('Sau khi mở, đếm lại từ đầu (1 lần sai không khóa máy lại)', saiSauMo.kq?.ket_qua === 'sai');
  await kiem(UID.thuKhoA, '1111');

  // Cửa sổ 30 phút: 14 lần sai đã cũ hơn 30 phút không tính.
  await rpc(UID.qlA, `kho_may_mo_khoa($1, $2)`, [mayA, nsId[UID.nvQuayA]]);
  await rpc(UID.qlA, `kho_may_mo_khoa($1, $2)`, [mayA, nsId[UID.qlA]]);
  await db.query(`update kho_may set mo_khoa_luc = null where id = $1`, [mayA]);
  await db.query(`delete from kho_may_nhat_ky where may_id = $1 and su_kien = 'pin_sai'`, [mayA]);
  await db.query(`insert into kho_may_nhat_ky (may_id, chi_nhanh_id, nhan_su_id, su_kien, luc)
                  select $1, $2, $3, 'pin_sai', now() - interval '31 minutes' from generate_series(1, 14)`,
                 [mayA, cnA.id, nsId[UID.qlA]]);
  const cu = await kiem(UID.qlA, '0000');
  ok('14 lần sai cũ hơn 30 phút + 1 lần mới → chưa khóa máy', cu.kq?.ket_qua === 'sai', JSON.stringify(cu.kq));
  await db.query(`update kho_may_nhat_ky set luc = now() - interval '29 minutes'
                  where may_id = $1 and su_kien = 'pin_sai' and luc < now() - interval '30 minutes'`, [mayA]);
  const moi = await kiem(UID.nvQuayA, '0000');
  ok('15 lần sai trong 30 phút (mọi người cộng lại) → khóa máy', moi.kq?.ket_qua === 'khoa_may', JSON.stringify(moi.kq));
  await rpc(UID.qlA, `kho_may_mo_khoa($1)`, [mayA]);
  await rpc(UID.qlA, `kho_may_mo_khoa($1, $2)`, [mayA, nsId[UID.qlA]]);
  await rpc(UID.qlA, `kho_may_mo_khoa($1, $2)`, [mayA, nsId[UID.nvQuayA]]);

  // Dò CHẬM: 14 lần mỗi nửa giờ lọt dưới ngưỡng 30 phút — ngưỡng 30 lần / 24 giờ chặn.
  await db.query(`update kho_may set mo_khoa_luc = null where id = $1`, [mayA]);
  await db.query(`delete from kho_may_nhat_ky where may_id = $1 and su_kien = 'pin_sai'`, [mayA]);
  await db.query(`insert into kho_may_nhat_ky (may_id, chi_nhanh_id, nhan_su_id, su_kien, luc)
                  select $1, $2, $3, 'pin_sai', now() - (g * interval '40 minutes') from generate_series(1, 28) g`,
                 [mayA, cnA.id, nsId[UID.qlA]]);
  const cham29 = await kiem(UID.qlA, '0000');
  ok('28 lần sai rải trong ngày + 1 → chưa khóa máy', cham29.kq?.ket_qua === 'sai', JSON.stringify(cham29.kq));
  const cham30 = await kiem(UID.nvQuayA, '0000');
  ok('Lần sai thứ 30 trong 24 giờ → khóa máy (chặn dò chậm)', cham30.kq?.ket_qua === 'khoa_may', JSON.stringify(cham30.kq));
  await db.query(`update kho_may_nhat_ky set luc = now() - interval '25 hours'
                  where may_id = $1 and su_kien = 'pin_sai' and luc < now() - interval '1 minute'`, [mayA]);
  await rpc(UID.qlA, `kho_may_mo_khoa($1)`, [mayA]);
  await rpc(UID.qlA, `kho_may_mo_khoa($1, $2)`, [mayA, nsId[UID.qlA]]);
  await rpc(UID.qlA, `kho_may_mo_khoa($1, $2)`, [mayA, nsId[UID.nvQuayA]]);
  await db.query(`update kho_may set mo_khoa_luc = null where id = $1`, [mayA]);
  const qua24 = await kiem(UID.qlA, '0000');
  ok('Lần sai cũ hơn 24 giờ không tính', qua24.kq?.ket_qua === 'sai', JSON.stringify(qua24.kq));
  await rpc(UID.qlA, `kho_may_mo_khoa($1, $2)`, [mayA, nsId[UID.qlA]]);

  const { rows: nk } = await db.query(
    `select su_kien, count(*)::int as n from kho_may_nhat_ky where may_id = $1 group by 1`, [mayA]);
  const dem = Object.fromEntries(nk.map(r => [r.su_kien, r.n]));
  ok('Nhật ký có đủ pin_dung, pin_sai, khoa_nguoi, khoa_may, mo_khoa_may, mo_khoa_nguoi',
     ['pin_dung', 'pin_sai', 'khoa_nguoi', 'khoa_may', 'mo_khoa_may', 'mo_khoa_nguoi'].every(k => dem[k] > 0),
     JSON.stringify(dem));
});

// ===========================================================================
await nhom('11 · KHÓA MÀN, KHÓA HẲN, GỠ NGƯỜI', async () => {
  const kiem = async (uid, pin) => rpc(UID_MAY_A, `kho_may_kiem_pin($1, $2)`, [nsId[uid], await pinCua(uid, pin)]);
  await kiem(UID.thuKhoA, '1111');

  const bam = await rpc(UID.thuKhoA, `kho_may_khoa($1, 'bam')`, [mayA]);
  ok('Người đã gắn bấm "Khóa máy" → khóa màn', bam.loi === null && bam.kq?.bi_khoa === false, bam.loi ?? '');
  const { rows: [m] } = await db.query(`select nguoi_dang_dung, bi_khoa from kho_may where id = $1`, [mayA]);
  ok('Khóa màn: không còn người đang dùng, máy KHÔNG khóa hẳn', m.nguoi_dang_dung === null && m.bi_khoa === false);
  ok('Phiên máy tự khóa khi hết giờ (het_gio)', (await rpc(UID_MAY_A, `kho_may_khoa($1, 'het_gio')`, [mayA])).loi === null);
  const la = await rpc(UID.thuKhoB, `kho_may_khoa($1, 'bam')`, [mayA]);
  ok('Người không gắn vào máy (Q7) KHÔNG khóa được máy', la.loi !== null);
  const maySai = await rpc(UID_MAY_A2, `kho_may_khoa($1, 'bam')`, [mayA]);
  ok('Máy khác KHÔNG khóa được máy này', maySai.loi !== null);
  const cach = await rpc(UID.thuKhoA, `kho_may_khoa($1, 'lung_tung')`, [mayA]);
  ok('Cách khóa lạ → từ chối', cach.loi !== null);

  const tkHan = await rpc(UID.thuKhoA, `kho_may_khoa($1, 'quan_ly')`, [mayA]);
  ok('Thủ kho KHÔNG khóa hẳn máy được', tkHan.loi !== null);
  const han = await rpc(UID.qlA, `kho_may_khoa($1, 'quan_ly')`, [mayA]);
  ok('Quản lý khóa hẳn máy', han.loi === null && han.kq?.bi_khoa === true, han.loi ?? '');
  ok('Máy khóa hẳn → PIN không mở', (await kiem(UID.thuKhoA, '1111')).kq?.ket_qua === 'khoa_may');
  await rpc(UID.qlA, `kho_may_mo_khoa($1)`, [mayA]);

  const goLa = await rpc(UID.nvQuayA, `kho_may_go($1, $2)`, [mayA, nsId[UID.thuKhoA]]);
  ok('NV quầy KHÔNG gỡ được người khác', goLa.loi !== null);
  const tuGo = await rpc(UID.nvQuayA, `kho_may_go($1)`, [mayA]);
  ok('"Gỡ tôi khỏi máy này"', tuGo.loi === null && tuGo.kq?.da_go === true && tuGo.kq?.nhan_su_id === nsId[UID.nvQuayA],
     tuGo.loi ?? JSON.stringify(tuGo.kq));
  const sauGo = await kiem(UID.nvQuayA, '2222');
  ok('Đã gỡ → PIN không dùng được nữa', sauGo.loi !== null);
  const qlGo = await rpc(UID.qlA, `kho_may_go($1, $2)`, [mayA, nsId[UID.qlA]]);
  ok('Quản lý gỡ được (kể cả chính mình)', qlGo.kq?.da_go === true);
  const ds = await rpc(UID_MAY_A, `kho_may_ds_nguoi()`);
  ok('Còn 1 người trên máy', ds.kq?.nguoi?.length === 1, JSON.stringify(ds.kq?.nguoi));
});

// ===========================================================================
await nhom('12 · TẮT MÁY → PHIÊN MÁY HẾT TÁC DỤNG', async () => {
  const tk = await rpc(UID.thuKhoA, `kho_may_tat($1)`, [mayA]);
  ok('Thủ kho KHÔNG tắt được máy', tk.loi !== null);
  const tat = await rpc(UID.qlA, `kho_may_tat($1)`, [mayA]);
  ok('Quản lý tắt máy, gỡ hết người', tat.loi === null && tat.kq?.dang_dung === false && tat.kq?.so_nguoi_go === 1,
     tat.loi ?? JSON.stringify(tat.kq));
  const ds = await rpc(UID_MAY_A, `kho_may_ds_nguoi()`);
  ok('Máy đã tắt: kho_may_ds_nguoi báo lỗi', ds.loi !== null && /đã bị tắt/.test(ds.loi), ds.loi ?? 'GỌI ĐƯỢC');
  const k = await rpc(UID_MAY_A, `kho_may_kiem_pin($1, $2)`, [nsId[UID.thuKhoA], await pinCua(UID.thuKhoA, '1111')]);
  ok('Máy đã tắt: kho_may_kiem_pin báo lỗi', k.loi !== null && /đã bị tắt/.test(k.loi), k.loi ?? 'GỌI ĐƯỢC');
  const gan = await rpc(UID.thuKhoA, `kho_may_gan_nguoi($1, $2)`, [mayA, await pinCua(UID.thuKhoA, '1111')]);
  ok('Máy đã tắt: không gắn thêm người được', gan.loi !== null);

  const lai = await rpc(UID.qlA, `kho_dang_ky_may($1, 'Tablet quầy', 5)`, [UID_MAY_A]);
  ok('Đăng ký lại → bật lại, cùng may_id', lai.kq?.may_id === mayA && lai.kq?.moi === false, lai.loi ?? '');
  const ds2 = await rpc(UID_MAY_A, `kho_may_ds_nguoi()`);
  ok('Bật lại: không còn ai gắn (phải gắn lại)', ds2.loi === null && ds2.kq?.nguoi?.length === 0, ds2.loi ?? '');

  // Tài khoản máy bị khóa (dang_lam false) cũng hết phiên.
  await db.query(`update nhan_su set dang_lam = false where auth_uid = $1`, [UID_MAY_A2]);
  const khoaTk = await rpc(UID_MAY_A2, `kho_may_ds_nguoi()`);
  ok('Tài khoản máy bị khóa → không gọi được hàm máy', khoaTk.loi !== null);
  await db.query(`update nhan_su set dang_lam = true where auth_uid = $1`, [UID_MAY_A2]);
});

// ===========================================================================
await nhom('13 · CHỦ TỰ TẠO TÀI KHOẢN', async () => {
  const UID_MOI = '00000000-0000-4000-8000-0000000000e1';
  const UID_MOI2 = '00000000-0000-4000-8000-0000000000e2';
  const UID_MA = '00000000-0000-4000-8000-0000000000e9';   // không có trong auth.users
  await db.query(`insert into auth.users (id, email) values ($1, 'nv.moi@beeftown.test'), ($2, 'may.moi@beeftown.test')`,
                 [UID_MOI, UID_MOI2]);

  const ql = await rpc(UID.qlA, `kho_them_nhan_su($1, 'NV mới', 'thu_kho', $2)`, [UID_MOI, cnA.id]);
  ok('Quản lý KHÔNG tạo được tài khoản', ql.loi !== null && /Chỉ chủ/.test(ql.loi), ql.loi ?? 'TẠO ĐƯỢC');
  const tk = await rpc(UID.thuKhoA, `kho_them_nhan_su($1, 'NV mới', 'thu_kho', $2)`, [UID_MOI, cnA.id]);
  ok('Thủ kho KHÔNG tạo được tài khoản', tk.loi !== null);

  for (const vai of ['chu_so_huu', 'quan_ly', 'thu_ngan', 'marketing']) {
    const r = await rpc(UID.chu, `kho_them_nhan_su($1, 'X', $2::vai_tro, $3)`, [UID_MOI, vai, cnA.id]);
    ok(`Chủ KHÔNG thêm được vai CRM "${vai}" ở đây`, r.loi !== null, r.loi ?? 'THÊM ĐƯỢC');
  }
  const ma = await rpc(UID.chu, `kho_them_nhan_su($1, 'Ma', 'thu_kho', $2)`, [UID_MA, cnA.id]);
  ok('uid không có trong auth.users → từ chối', ma.loi !== null && /Không tìm thấy tài khoản/.test(ma.loi), ma.loi ?? '');
  const trung = await rpc(UID.chu, `kho_them_nhan_su($1, 'Trùng', 'thu_kho', $2)`, [UID.thuKhoA, cnA.id]);
  ok('uid đã gắn nhân sự → từ chối', trung.loi !== null && /đã gắn/.test(trung.loi), trung.loi ?? '');
  const khongCn = await rpc(UID.chu, `kho_them_nhan_su($1, 'X', 'thu_kho', null)`, [UID_MOI]);
  ok('Không chọn chi nhánh → từ chối', khongCn.loi !== null);
  const khongTen = await rpc(UID.chu, `kho_them_nhan_su($1, '   ', 'thu_kho', $2)`, [UID_MOI, cnA.id]);
  ok('Không có họ tên → từ chối', khongTen.loi !== null);

  const moi = await rpc(UID.chu, `kho_them_nhan_su($1, '  NV quầy mới  ', 'nhan_vien_quay', $2)`, [UID_MOI, cnA.id]);
  ok('Chủ thêm NV quầy', moi.loi === null && moi.kq?.ho_ten === 'NV quầy mới' && moi.kq?.email === 'nv.moi@beeftown.test'
     && moi.kq?.vai_tro === 'nhan_vien_quay', moi.loi ?? JSON.stringify(moi.kq));
  const quyen = await duoi(UID_MOI, `select kho_duoc($1, 'van_hanh') as d, kho_duoc($1, 'xem_gia') as g`, [cnA.id]);
  ok('Người mới dùng được kho Q1 theo đúng vai (van_hanh, không xem giá)',
     quyen.rows?.[0]?.d === true && quyen.rows?.[0]?.g === false, quyen.loi ?? '');
  const lai = await rpc(UID.chu, `kho_them_nhan_su($1, 'Lần hai', 'thu_kho', $2)`, [UID_MOI, cnA.id]);
  ok('Thêm lần hai cùng uid → từ chối', lai.loi !== null);
  const may = await rpc(UID.chu, `kho_them_nhan_su($1, 'Tablet mới', 'may_chung', $2)`, [UID_MOI2, cnB.id]);
  ok('Chủ thêm tài khoản máy', may.loi === null && may.kq?.vai_tro === 'may_chung', may.loi ?? '');

  const ds = await rpc(UID.chu, `kho_ds_nhan_su_kho()`);
  const ten = (ds.kq ?? []).map(n => n.ho_ten);
  ok('Danh sách nhân viên kho có người mới, máy, quản lý; không có thu ngân / marketing / chủ',
     ten.includes('NV quầy mới') && ten.includes('Tablet mới') && ten.includes('Quản lý Q1')
     && !ten.includes('Thu ngân Q1') && !ten.includes('Marketing Q1') && !ten.includes('Chủ nhà hàng'), ten.join(', '));
  const dsQ7 = await rpc(UID.chu, `kho_ds_nhan_su_kho($1)`, [cnB.id]);
  ok('Lọc một chi nhánh', (dsQ7.kq ?? []).every(n => n.chi_nhanh_id === cnB.id) && dsQ7.kq?.length > 0);
  const dsQl = await rpc(UID.qlA, `kho_ds_nhan_su_kho()`);
  ok('Quản lý KHÔNG xem được danh sách này', dsQl.loi !== null);

  // Khóa / mở.
  await rpc(UID.qlA, `kho_dang_ky_may($1, 'Tablet quầy', 5)`, [UID_MAY_A]);
  await rpc(UID_MOI, `kho_may_gan_nguoi($1, $2)`, [mayA, await bamPin(khoa, mayA, moi.kq?.id, '5555')]);
  const tuKhoa = await rpc(UID.chu, `kho_khoa_nhan_su($1)`, [nsId[UID.chu]]);
  ok('Chủ KHÔNG tự khóa mình', tuKhoa.loi !== null);
  const qlKhoa = await rpc(UID.qlA, `kho_khoa_nhan_su($1)`, [moi.kq?.id]);
  ok('Quản lý KHÔNG khóa được tài khoản', qlKhoa.loi !== null);
  const tnKhoa = await rpc(UID.chu, `kho_khoa_nhan_su($1)`, [nsId[UID.thuNganA]]);
  ok('Màn này KHÔNG khóa vai CRM thuần (thu ngân)', tnKhoa.loi !== null);
  const khoaNv = await rpc(UID.chu, `kho_khoa_nhan_su($1)`, [moi.kq?.id]);
  ok('Chủ khóa NV mới, gỡ khỏi máy', khoaNv.loi === null && khoaNv.kq?.dang_lam === false && khoaNv.kq?.so_may_go === 1,
     khoaNv.loi ?? JSON.stringify(khoaNv.kq));
  const sauKhoa = await duoi(UID_MOI, `select kho_duoc($1, 'xem') as d`, [cnA.id]);
  ok('Bị khóa → mất quyền kho ngay', sauKhoa.rows?.[0]?.d === false);
  const pin = await rpc(UID_MAY_A, `kho_may_kiem_pin($1, $2)`, [moi.kq?.id, await bamPin(khoa, mayA, moi.kq?.id, '5555')]);
  ok('Bị khóa → PIN trên máy không dùng được', pin.loi !== null);
  const mo = await rpc(UID.chu, `kho_mo_nhan_su($1)`, [moi.kq?.id]);
  ok('Chủ mở lại', mo.loi === null && mo.kq?.dang_lam === true, mo.loi ?? '');
  const sauMo = await duoi(UID_MOI, `select kho_duoc($1, 'xem') as d`, [cnA.id]);
  ok('Mở lại → có quyền kho lại (nhưng phải gắn lại vào máy)', sauMo.rows?.[0]?.d === true
     && (await rpc(UID_MAY_A, `kho_may_ds_nguoi()`)).kq?.nguoi?.length === 0);
});

// ===========================================================================
await nhom('14 · COOKIE bt_phien GIỮ ĐÚNG ĐỊNH DẠNG phien.ts', async () => {
  const WEB_LIB = join(__dirname, '..', '..', 'web', 'src', 'lib');
  const phien = readFileSync(join(WEB_LIB, 'phien.ts'), 'utf8');
  ok("phien.ts: cookie tên 'bt_phien'", /const COOKIE_PHIEN = 'bt_phien';/.test(phien));
  ok('phien.ts: giá trị = JSON { access_token, refresh_token }',
     /typeof t\?\.access_token === 'string' && typeof t\?\.refresh_token === 'string'/.test(phien)
     && /cookies\.set\(COOKIE_PHIEN, JSON\.stringify\(t\)/.test(phien));
  ok('phien.ts: httpOnly, sameSite lax, path /, 7 ngày',
     /httpOnly: true,[\s\S]{0,80}sameSite: 'lax',\s*path: '\/',\s*maxAge: 60 \* 60 \* 24 \* 7/.test(phien));

  // File kho nào tự ghi bt_phien (đổi phiên trên máy dùng chung) phải ghi
  // đúng như vậy — layPhien() đọc cookie đó.
  const ghi = readdirSync(join(WEB_LIB, 'kho')).filter(f => f.endsWith('.ts'))
    .map(f => ({ f, ma: readFileSync(join(WEB_LIB, 'kho', f), 'utf8') }))
    .filter(({ ma }) => /['"]bt_phien['"]/.test(ma));
  if (ghi.length === 0) ok('(Chưa file kho nào tự ghi bt_phien)', true);
  for (const { f, ma } of ghi) {
    ok(`${f}: ghi bt_phien là JSON có access_token + refresh_token`,
       /access_token/.test(ma) && /refresh_token/.test(ma) && /JSON\.stringify/.test(ma));
    ok(`${f}: bt_phien httpOnly, sameSite lax, path /, 7 ngày`,
       /httpOnly: true/.test(ma) && /sameSite: 'lax'/.test(ma) && /path: '\/'/.test(ma)
       && /60 \* 60 \* 24 \* 7/.test(ma));
  }
});

process.exit(ketThuc('MÁY DÙNG CHUNG'));
