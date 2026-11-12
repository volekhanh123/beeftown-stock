/**
 * BEEFTOWN — MUA THỊT VỀ: VNPAY TRÊN WEBSITE (web/src/lib/vnpay.ts, vnpay-hook.ts, luotDatHang / luotTraLai của
 * lib/xu-ly-form.ts) — 0115
 * ===============================================================================================================
 *
 *     node test/test-mua-thit-vnpay-web.mjs
 *
 * Database ở test-mua-thit-vnpay.mjs. File này kiểm phần web, gọi thẳng các hàm trên database PGlite thật (client giả
 * taoClientPg: anon cho trang, may_vnpay cho IPN). Theo 9 mục "xong":
 *
 *   1. quyen — IPN chỉ nhận từ dải IP của VNPay; chữ ký sai không bao giờ được tin; Terminal khác → 01; nút trả lại chỉ
 *      mở lần trả cho đúng đơn của cookie trình duyệt; đường dẫn VNPay không chứa khóa bí mật hay thông tin khách.
 *   2. bam-hai-lan — VNPay gửi lại IPN → 02; gửi lại form của đơn đã trả → thẻ "đã trả", không mở lần mới.
 *   3. gio-vn — vnp_CreateDate / ExpireDate theo giờ VN lúc 23:50 và 00:10 (máy chạy múi khác); vnp_PayDate đổi sang
 *      +07:00, ngày không có thật (31/02) → null.
 *   4. chu-va-so — vnp_Amount = đồng × 100; "1.000" không phải số tiền; nội dung đơn không dấu.
 *   5. mat-mang — mất mạng / lỗi database / không đăng nhập được khi ghi IPN → 99 (VNPay gửi lại), KHÔNG BAO GIỜ 00;
 *      không mở được lần trả → thẻ "đã nhận đơn, CHƯA trả tiền"; trang kết quả không hỏi được database → không nói
 *      "Beeftown đã nhận tiền".
 *   7. cau-chu — câu ba thứ tiếng, không chữ cấm, không "thành công"; trang Quyền riêng tư nói về VNPay ba thứ tiếng.
 *   9. dich-vu-ngoai — chữ ký HMAC-SHA512 tính độc lập bằng node:crypto ra cùng số; nhận cả hai cách ký tham số rỗng;
 *      mã RspCode đúng bảng của VNPay; worker.ts chặn /hook/vnpay-ipn trước Astro.
 *   6, 8 — không áp dụng ở file này (không kho, không migration).
 */
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dungDatabase, taoBoDem, taoClientPg, maGui, UID } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web', 'src');
const nap = f => import(pathToFileURL(join(WEB, 'lib', f)).href);

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — MUA THỊT VỀ: VNPAY TRÊN WEBSITE (THƯ VIỆN WEB)');
const V = await nap('vnpay.ts');
const H = await nap('vnpay-hook.ts');
const XL = await nap('xu-ly-form.ts');
const DH = await nap('dat-hang-mua-thit.ts');
const { timChuoiCam } = await nap('chuoi-cam.js');

const NGON_NGU = ['vi', 'en', 'ko'];
const VIET = /[ạảãàáâậầấẩẫăắằẳẵặẹẻẽèéêệềếểễịỉĩìíọỏõòóôộồốổỗơợờớởỡụủũùúưựừứửữỵỷỹỳýđĐ]/;
const KHOA = 'KHOABIMATTHU0123456789ABCDEFGHIJ';
const CH = { maTmn: 'BTWEB001', khoaBiMat: KHOA, email: 'may-vnpay@beeftown.test', matKhau: 'mat-khau-may-dai-12345', ipIpn: [...V.IP_IPN_THU] };
const CAU_HINH = { ok: true, cauHinh: CH };
const IP_VNPAY = '113.20.124.26';

// ---------------------------------------------------------------------------
// Database: một gói đã chốt giá, công tắc bật; máy VNPay
// ---------------------------------------------------------------------------
const { db, cnA, duoi, duoiAnon } = await dungDatabase();
const UID_MAY = '00000000-0000-4000-8000-0000000000e9';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro) values ($1, $2, 'Máy VNPay', 'may_vnpay')`, [UID_MAY, cnA.id]);
const clientCua = await taoClientPg({ db, duoi, duoiAnon });
const anon = clientCua('anon');
/** Client của tài khoản máy: auth giả (đăng nhập luôn được) trên client PGlite của may_vnpay. */
const mayGia = (uid = UID_MAY, dangNhapDuoc = true) => () => ({
  ...clientCua(uid),
  auth: {
    signInWithPassword: async () => dangNhapDuoc
      ? { data: { session: { expires_at: Math.floor(Date.now() / 1000) + 3600 } }, error: null }
      : { data: { session: null }, error: { message: 'Invalid login credentials' } },
    signOut: async () => ({ error: null }),
  },
});
const goi = async (uid, sql, p = []) => {
  const r = await (uid === 'anon' ? duoiAnon(sql, p) : duoi(uid, sql, p));
  return { ...r, kq: r.rows?.[0]?.r };
};
const nghi = () => new Promise(xong => setTimeout(xong, 3));
{
  const { rows: [mh] } = await db.query(`insert into kho_mat_hang (ma, ten, loai, dem_goi, gia_ban_kg) values ('THIT-WEB', 'THIT-WEB', 'phan_cat', false, 750000) returning id`);
  const t = await goi(UID.chu, `select ban_le_tao_san_pham($1, 'thit-web', 'Thăn bò web', 'thit', 'theo_can') as r`, [maGui()]);
  const id = t.kq.id;
  const doc = async () => (await goi(UID.chu, `select ban_le_danh_sach(null, $1) as r`, [id])).kq[0];
  await nghi();
  let sp = await doc();
  await goi(UID.chu, `select ban_le_luu_san_pham($1, $2::timestamptz, $3::jsonb) as r`, [id, sp.updated_at,
    JSON.stringify({ mat_hang_id: mh.id, trang_thai: 'dang_ban', thu_tu: 1, bao_quan: 'mat' })]);
  await nghi();
  sp = await doc();
  await goi(UID.chu, `select ban_le_chot_gia($1, $2::timestamptz, $3::jsonb) as r`, [id, sp.updated_at, JSON.stringify(sp.gia_de_chot)]);
  await goi(UID.chu, `select dat_noi_dung('hien_mua_thit_ve', p_bool := true, p_cong_bo := true) as r`);
}
const { rows: menu } = await duoiAnon(`select * from mua_thit_ve_cong_khai('vi', 'q1')`);
const GOI = menu.find(d => d.so_gam === 200);
const KHOA_GOI = `thit-web_${GOI?.so_gam}`;
const GIA_GOI = Number(GOI?.gia);

let thuTu = 0;
function formDon(maGuiDon = maGui(), soGoi = '1') {
  return new URLSearchParams({
    ma_gui: maGuiDon, [KHOA_GOI]: soGoi, [`gia_${KHOA_GOI}`]: String(GIA_GOI), ho_ten: 'Lê Thị Mai',
    sdt: `09${String(30000000 + ++thuTu).slice(-8)}`, dia_chi: '7 Pasteur, phường Sài Gòn', ghi_chu: '',
  });
}
const yeuCau = (body, duong = '/mua-thit-ve', ip = `203.0.113.${++thuTu % 250 + 1}`) => new Request(`https://beeftown.vn${duong}`, {
  method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded', 'cf-connecting-ip': ip },
});
const VNPAY_TRANG = { cauHinh: CH, duongVe: 'https://beeftown.vn/mua-thit-ve/ket-qua' };
const lan = async ma => (await db.query(`select * from thanh_toan_vnpay_web where ma_giao_dich = $1`, [ma])).rows[0];

/** Ký bộ tham số VNPay gửi về bằng node:crypto — độc lập với vnpay.ts. */
function kyDocLap(thamSo, boRong = true) {
  const p = new URLSearchParams();
  for (const k of Object.keys(thamSo).sort()) if (!boRong || thamSo[k] !== '') p.append(k, thamSo[k]);
  return createHmac('sha512', KHOA).update(Buffer.from(p.toString(), 'utf8')).digest('hex');
}
/** Đường dẫn VNPay đưa về / gọi IPN cho một lần trả. */
function thamSoVe(ma, tien, them = {}, boRong = true) {
  const t = {
    vnp_Amount: String(tien * 100), vnp_BankCode: 'NCB', vnp_BankTranNo: 'VNP14123456', vnp_CardType: 'ATM',
    vnp_OrderInfo: `Beeftown thanh toan don ${ma.slice(0, 6)}`, vnp_PayDate: '20261112101530', vnp_ResponseCode: '00',
    vnp_TmnCode: CH.maTmn, vnp_TransactionNo: '14123456', vnp_TransactionStatus: '00', vnp_TxnRef: ma, ...them,
  };
  for (const k of Object.keys(t)) if (t[k] === undefined) delete t[k];
  const q = new URLSearchParams(t);
  q.append('vnp_SecureHashType', 'HmacSHA512');
  q.append('vnp_SecureHash', kyDocLap(t, boRong));
  return q;
}
const ipnReq = (q, ip = IP_VNPAY, method = 'GET') => new Request(`https://beeftown.vn/hook/vnpay-ipn?${q}`, {
  method, headers: ip ? { 'cf-connecting-ip': ip } : {},
});
async function goiIpn(q, them = {}) {
  const log = [];
  const res = await H.xuLyIpnVnpay(ipnReq(q, them.ip === undefined ? IP_VNPAY : them.ip, them.method),
    { cauHinh: them.cauHinh ?? CAU_HINH, taoClientMay: them.taoClientMay ?? mayGia(), ghiLog: c => log.push(c) });
  const than = res.status === 200 ? await res.json() : null;
  return { res, than, ma: than?.RspCode, log };
}
/** Đặt một đơn qua chính luotDatHang (không VNPay) và mở một lần trả anon. */
async function donVaLanTra() {
  const g = maGui();
  const l = await XL.luotDatHang(yeuCau(formDon(g)), anon, '/mua-thit-ve', 'vi');
  const mo = await DH.moTraTienVnpay(anon, g, 'vi');
  return { g, maDon: l.ketQua.ma, mo };
}

// ===========================================================================
await nhom('1 · CẤU HÌNH — THIẾU MỘT BÍ MẬT LÀ TRANG CHẠY NHƯ CHƯA CÓ VNPAY', async () => {
  const du = { VNPAY_MA_TMN: 'BTWEB001', VNPAY_KHOA_BI_MAT: KHOA, VNPAY_MAY_EMAIL: 'a@b.c', VNPAY_MAY_MAT_KHAU: 'x'.repeat(20) };
  ok('Không bí mật nào → chưa cài (không log lỗi)', V.docCauHinhTu({}).ok === false && V.docCauHinhTu({}).chuaCai === true);
  for (const thieu of Object.keys(du)) {
    const env = { ...du }; delete env[thieu];
    const r = V.docCauHinhTu(env);
    ok(`Thiếu ${thieu} → VNPay tắt, câu nêu đúng tên, không chứa giá trị bí mật`,
       r.ok === false && !r.chuaCai && r.cau.includes(thieu) && !r.cau.includes(KHOA), r.cau ?? '');
  }
  ok('Mã Terminal sai dạng → tắt', V.docCauHinhTu({ ...du, VNPAY_MA_TMN: 'slk' }).ok === false);
  ok('Secret Key ngắn hay có dấu cách → tắt', V.docCauHinhTu({ ...du, VNPAY_KHOA_BI_MAT: 'ngan' }).ok === false
     && V.docCauHinhTu({ ...du, VNPAY_KHOA_BI_MAT: 'co dau cach trong khoa nay' }).ok === false);
  const r = V.docCauHinhTu(du);
  ok('Đủ bốn → bật, dải IP mặc định là dải VNPay báo cho môi trường thử',
     r.ok && JSON.stringify(r.cauHinh.ipIpn) === JSON.stringify(['113.20.124.24/29', '58.187.148.88/29']), JSON.stringify(r));
  const ip = V.docCauHinhTu({ ...du, VNPAY_IP_IPN: '1.2.3.0/24, 5.6.7.8' });
  ok('VNPAY_IP_IPN thay dải mặc định', ip.ok && ip.cauHinh.ipIpn.join() === '1.2.3.0/24,5.6.7.8');
  ok('VNPAY_IP_IPN sai dạng → tắt (không bao giờ nhận IPN từ mọi nơi)', V.docCauHinhTu({ ...du, VNPAY_IP_IPN: '*' }).ok === false
     && V.docCauHinhTu({ ...du, VNPAY_IP_IPN: '300.1.1.1' }).ok === false && V.docCauHinhTu({ ...du, VNPAY_IP_IPN: '1.2.3.4/33' }).ok === false);
  ok('Cổng là môi trường thử (sandbox) — không biến nào đổi sang cổng thật', V.CONG_VNPAY === 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');

  const goc = process.env;
  process.env = { ...goc, ...du, SITE_URL: 'https://beeftown.vn/' };
  try {
    const t = await XL.vnpayChoTrang({ url: new URL('http://localhost:4321/en/buy-meat') }, 'en');
    ok('vnpayChoTrang: đường về theo SITE_URL và đúng thứ tiếng', t?.duongVe === 'https://beeftown.vn/en/buy-meat/result', JSON.stringify(t));
    process.env = { ...goc, ...du, VNPAY_MAY_MAT_KHAU: '' };
    const loi = [];
    const cu = console.error; console.error = (...a) => loi.push(a.join(' '));
    const tat = await XL.vnpayChoTrang({ url: new URL('https://beeftown.vn/mua-thit-ve') }, 'vi');
    await XL.vnpayChoTrang({ url: new URL('https://beeftown.vn/en/buy-meat') }, 'en');
    console.error = cu;
    ok('vnpayChoTrang: thiếu một bí mật → null và MỘT dòng log nêu tên (dựng trang lần hai không ghi lại)',
       tat === null && loi.length === 1 && loi[0].includes('VNPAY_MAY_MAT_KHAU'), loi.join(' | '));
  } finally { process.env = goc; }
});

// ===========================================================================
await nhom('2 · KÝ ĐƯỜNG DẪN TRẢ TIỀN (dich-vu-ngoai, chu-va-so, gio-vn)', async () => {
  const ms = Date.parse('2026-11-12T23:50:00+07:00');
  const url = await V.taoLinkVnpay(CH, { maGiaoDich: 'AB23CD01', maDon: 'AB23CD', soTien: 250000, ngonNgu: 'vi', ip: '203.0.113.5',
                                        duongVe: 'https://beeftown.vn/mua-thit-ve/ket-qua', ms });
  const u = new URL(url);
  const p = Object.fromEntries(u.searchParams);
  ok('Đi tới cổng thử của VNPay', `${u.origin}${u.pathname}` === V.CONG_VNPAY);
  ok('Đủ tham số PAY 2.1.0, số tiền × 100, tiền đồng', p.vnp_Version === '2.1.0' && p.vnp_Command === 'pay' && p.vnp_TmnCode === 'BTWEB001'
     && p.vnp_Amount === '25000000' && p.vnp_CurrCode === 'VND' && p.vnp_TxnRef === 'AB23CD01' && p.vnp_OrderType === 'other'
     && p.vnp_IpAddr === '203.0.113.5' && p.vnp_ReturnUrl === 'https://beeftown.vn/mua-thit-ve/ket-qua', JSON.stringify(p));
  ok('Nội dung không dấu, không ký tự đặc biệt', p.vnp_OrderInfo === 'Beeftown thanh toan don AB23CD' && !VIET.test(p.vnp_OrderInfo));
  ok('23:50 giờ VN → vnp_CreateDate đúng ngày giờ VN, hết hạn 00:05 hôm sau', p.vnp_CreateDate === '20261112235000' && p.vnp_ExpireDate === '20261113000500',
     `${p.vnp_CreateDate} ${p.vnp_ExpireDate}`);
  const ms2 = Date.parse('2026-11-13T00:10:00+07:00');
  ok('00:10 giờ VN (17:10 UTC hôm trước) → ngày VN', V.ngayVnpay(ms2) === '20261113001000', V.ngayVnpay(ms2));
  const { vnp_SecureHash: ky, ...conLai } = p;
  ok('Chữ ký vnp_SecureHash = HMAC-SHA512 tính độc lập bằng node:crypto', ky === kyDocLap(conLai), ky?.slice(0, 16));
  ok('Đường dẫn không chứa khóa bí mật', !url.includes(KHOA));
  const en = new URL(await V.taoLinkVnpay(CH, { maGiaoDich: 'AB23CD02', maDon: 'AB23CD', soTien: 250000, ngonNgu: 'ko', ip: null, duongVe: 'x', ms }));
  ok('Trang tiếng Hàn / Anh → giao diện VNPay tiếng Anh; không có IP → 127.0.0.1',
     en.searchParams.get('vnp_Locale') === 'en' && en.searchParams.get('vnp_IpAddr') === '127.0.0.1');
  let nem = 0;
  for (const sai of [{ soTien: 0 }, { soTien: 1.5 }, { soTien: 4000 }, { maGiaoDich: 'ab23cd01' }, { maDon: 'AB' }]) {
    try { await V.taoLinkVnpay(CH, { maGiaoDich: 'AB23CD01', maDon: 'AB23CD', soTien: 250000, ngonNgu: 'vi', ip: null, duongVe: 'x', ms, ...sai }); }
    catch { nem++; }
  }
  ok('Số tiền / mã sai dạng → ném (lỗi lập trình), không ký bừa', nem === 5, String(nem));
});

// ===========================================================================
await nhom('3 · ĐỌC THAM SỐ VNPAY GỬI VỀ', async () => {
  const q = thamSoVe('AB23CD01', 250000);
  const kq = await V.docThamSoVnpay(q, CH);
  ok('Chữ ký đúng → tin; đã trả; số tiền đồng; mã đơn', kq.chuKyDung && kq.daTra && kq.soTien === 250000 && kq.maDon === 'AB23CD', JSON.stringify(kq));
  ok('vnp_PayDate (giờ VN) → ISO +07:00', kq.traLuc === '2026-11-12T10:15:30+07:00', kq.traLuc ?? '');
  const hoa = new URLSearchParams(q); hoa.set('vnp_SecureHash', q.get('vnp_SecureHash').toUpperCase());
  ok('Chữ ký viết hoa vẫn nhận', (await V.docThamSoVnpay(hoa, CH)).chuKyDung);
  const rong = thamSoVe('AB23CD01', 250000, { vnp_BankTranNo: '' }, false);
  ok('Tham số rỗng nằm trong chuỗi ký (cách code mẫu PHP) → nhận', (await V.docThamSoVnpay(rong, CH)).chuKyDung);
  const rong2 = thamSoVe('AB23CD01', 250000, { vnp_BankTranNo: '' }, true);
  ok('Tham số rỗng bị bỏ khỏi chuỗi ký (thư viện vnpay) → nhận', (await V.docThamSoVnpay(rong2, CH)).chuKyDung);
  const sua = new URLSearchParams(q); sua.set('vnp_Amount', '100');
  ok('Sửa số tiền sau khi ký → chữ ký sai, không bao giờ "đã trả"', !(await V.docThamSoVnpay(sua, CH)).chuKyDung && !(await V.docThamSoVnpay(sua, CH)).daTra);
  const thieu = new URLSearchParams(q); thieu.delete('vnp_SecureHash');
  ok('Không có chữ ký → sai, không ném', (await V.docThamSoVnpay(thieu, CH)).chuKyDung === false);
  const khac = await V.docThamSoVnpay(q, { khoaBiMat: 'KHOAKHACHOANTOANKHAC123' });
  ok('Khóa khác → sai', khac.chuKyDung === false);
  ok('Mã 00 mà trạng thái 02 → chưa trả', !(await V.docThamSoVnpay(thamSoVe('AB23CD01', 250000, { vnp_TransactionStatus: '02' }), CH)).daTra);
  ok('Mã 24 → chưa trả', !(await V.docThamSoVnpay(thamSoVe('AB23CD01', 250000, { vnp_ResponseCode: '24', vnp_TransactionStatus: '02' }), CH)).daTra);
  const thieuTt = await V.docThamSoVnpay(thamSoVe('AB23CD01', 250000, { vnp_TransactionStatus: undefined }), CH);
  ok('Thiếu vnp_TransactionStatus mà mã 00 → đã trả (trangThaiGd null)', thieuTt.daTra && thieuTt.trangThaiGd === null);
  ok('Ngày không có thật (31/02) → traLuc null', (await V.docThamSoVnpay(thamSoVe('AB23CD01', 250000, { vnp_PayDate: '20260231101530' }), CH)).traLuc === null);
  const q2 = thamSoVe('AB23CD01', 250000); q2.set('vnp_Amount', '1.000');
  ok('Số tiền "1.000" không phải số', (await V.docThamSoVnpay(q2, CH)).soTien === null);
  ok('Mã giao dịch không đúng dạng → không có mã đơn', (await V.docThamSoVnpay(thamSoVe('BTTHU1234', 1000), CH)).maDon === '');
});

// ===========================================================================
await nhom('4 · DẢI IP CỦA VNPAY', async () => {
  const ds = V.IP_IPN_THU;
  ok('113.20.124.24 → 31 trong dải /29', ['113.20.124.24', '113.20.124.31'].every(ip => V.ipTrongDanhSach(ip, ds)));
  ok('113.20.124.23 và .32 ngoài dải', !V.ipTrongDanhSach('113.20.124.23', ds) && !V.ipTrongDanhSach('113.20.124.32', ds));
  ok('58.187.148.88 → 95 trong dải; .96 ngoài', V.ipTrongDanhSach('58.187.148.95', ds) && !V.ipTrongDanhSach('58.187.148.96', ds));
  ok('IPv6 dạng ::ffff:113.20.124.25 nhận', V.ipTrongDanhSach('::ffff:113.20.124.25', ds));
  ok('Không IP, IP rác, IPv6 khác → từ chối', !V.ipTrongDanhSach(null, ds) && !V.ipTrongDanhSach('abc', ds) && !V.ipTrongDanhSach('2001:db8::1', ds)
     && !V.ipTrongDanhSach('113.20.124.300', ds));
  ok('Một IP lẻ (không /n) chỉ khớp đúng nó', V.ipTrongDanhSach('5.6.7.8', ['5.6.7.8']) && !V.ipTrongDanhSach('5.6.7.9', ['5.6.7.8']));
});

// ===========================================================================
await nhom('5 · IPN /hook/vnpay-ipn — MÃ TRẢ LỜI ĐÚNG BẢNG CỦA VNPAY', async () => {
  const { maDon, mo } = await donVaLanTra();
  ok('(Mở được lần trả)', mo.ok && mo.daTra === false, JSON.stringify(mo));
  const ma = mo.maGiaoDich;

  const chuaCai = await goiIpn(thamSoVe(ma, mo.soTien), { cauHinh: { ok: false, chuaCai: true, cau: 'chưa cài VNPay' } });
  ok('Chưa cài → 200 + 99, log một dòng', chuaCai.res.status === 200 && chuaCai.ma === '99' && chuaCai.log.length === 1, JSON.stringify(chuaCai.than));
  const ngoai = await goiIpn(thamSoVe(ma, mo.soTien), { ip: '8.8.8.8' });
  ok('IP ngoài dải VNPay → 03 IP prohibited, không ghi', ngoai.ma === '03' && (await lan(ma)).trang_thai === 'cho', JSON.stringify(ngoai.than));
  const khongIp = await goiIpn(thamSoVe(ma, mo.soTien), { ip: null });
  ok('Không có CF-Connecting-IP → 03', khongIp.ma === '03');
  const sai = thamSoVe(ma, mo.soTien); sai.set('vnp_ResponseCode', '00'); sai.set('vnp_Amount', String(mo.soTien * 100 + 100));
  const saiKy = await goiIpn(sai);
  ok('Chữ ký sai → 97, không ghi, log không chứa chữ ký hay khóa', saiKy.ma === '97' && (await lan(ma)).trang_thai === 'cho'
     && !saiKy.log.join(' ').includes(sai.get('vnp_SecureHash')) && !saiKy.log.join(' ').includes(KHOA), saiKy.log.join(' | '));
  ok('Terminal khác → 01', (await goiIpn(thamSoVe(ma, mo.soTien, { vnp_TmnCode: 'KHAC0001' }))).ma === '01');
  ok('Mã giao dịch database không có → 01 Order not found', (await goiIpn(thamSoVe('ZZZZZZ01', mo.soTien))).than?.Message === 'Order not found');
  ok('Số tiền sai (đã ký đúng) → 04 Invalid amount', (await goiIpn(thamSoVe(ma, mo.soTien + 1000))).ma === '04');

  const loiDb = await goiIpn(thamSoVe(ma, mo.soTien), {
    taoClientMay: () => ({ ...mayGia()(), rpc: async () => ({ data: null, error: { message: 'canceling statement due to statement timeout', code: '57014' } }) }),
  });
  ok('Database lỗi → 99 (VNPay gửi lại), KHÔNG 00', loiDb.ma === '99' && (await lan(ma)).trang_thai === 'cho');
  const matMang = await goiIpn(thamSoVe(ma, mo.soTien), {
    taoClientMay: () => ({ ...mayGia()(), rpc: async () => { throw new TypeError('fetch failed'); } }),
  });
  ok('Mất mạng khi ghi (rpc ném) → 99, KHÔNG 00', matMang.ma === '99' && (await lan(ma)).trang_thai === 'cho');
  const rong = await goiIpn(thamSoVe(ma, mo.soTien), {
    taoClientMay: () => ({ ...mayGia()(), rpc: async () => ({ data: null, error: null }) }),
  });
  ok('Database trả lời rỗng → 99, KHÔNG 00', rong.ma === '99');
  const khongDn = await goiIpn(thamSoVe(ma, mo.soTien), { taoClientMay: mayGia(UID_MAY, false) });
  ok('Tài khoản máy không đăng nhập được → 99, log không chứa mật khẩu', khongDn.ma === '99'
     && !khongDn.log.join(' ').includes(CH.matKhau) && /không đăng nhập được/.test(khongDn.log.join(' ')), khongDn.log.join(' | '));
  const vaiKhac = await goiIpn(thamSoVe(ma, mo.soTien), { taoClientMay: mayGia(UID.chu) });
  ok('Đăng nhập nhầm tài khoản chủ → database từ chối (42501) → 99, không ghi', vaiKhac.ma === '99' && (await lan(ma)).trang_thai === 'cho');

  const dung = await goiIpn(thamSoVe(ma, mo.soTien));
  ok('IPN đúng → 00 Confirm Success, JSON, không cache', dung.ma === '00' && dung.than.Message === 'Confirm Success'
     && /application\/json/.test(dung.res.headers.get('content-type') ?? '') && dung.res.headers.get('cache-control') === 'no-store', JSON.stringify(dung.than));
  const l = await lan(ma);
  ok('Database ghi đã trả, mã VNPay, ngân hàng, lúc trả giờ VN', l.trang_thai === 'da_tra' && l.ma_vnpay === '14123456' && l.ngan_hang === 'NCB'
     && new Date(l.tra_luc).toISOString() === '2026-11-12T03:15:30.000Z', JSON.stringify(l));
  ok('Log nói mã giao dịch và kết quả, không số tiền thẻ hay khóa', dung.log.some(c => c.includes(ma) && /da_ghi \(đã trả\)/.test(c)) && !dung.log.join().includes(KHOA));
  const lai = await goiIpn(thamSoVe(ma, mo.soTien));
  ok('VNPay gửi lại → 02 Order already confirmed', lai.ma === '02' && lai.than.Message === 'Order already confirmed');
  const post = await goiIpn(thamSoVe(ma, mo.soTien), { method: 'POST' });
  ok('POST cùng tham số trên đường dẫn → cùng xử lý (02)', post.ma === '02');
  const put = await goiIpn(thamSoVe(ma, mo.soTien), { method: 'PUT' });
  ok('PUT → 405', put.res.status === 405);

  const b = await donVaLanTra();
  const huy = await goiIpn(thamSoVe(b.mo.maGiaoDich, b.mo.soTien, { vnp_ResponseCode: '24', vnp_TransactionStatus: '02', vnp_TransactionNo: '0' }));
  ok('Khách hủy (24) → 00 (đã nhận kết quả), lần trả that_bai', huy.ma === '00' && (await lan(b.mo.maGiaoDich)).trang_thai === 'that_bai');
  ok('Mã đơn của lần trả đúng đơn', maDon === ma.slice(0, 6));

  const src = readFileSync(join(WEB, 'worker.ts'), 'utf8');
  const iIpn = src.indexOf('DUONG_IPN_VNPAY)'), iHandle = src.indexOf('return handle(');
  ok('worker.ts chặn /hook/vnpay-ipn TRƯỚC Astro (không cookie, không chốt CSRF)', src.includes('xuLyIpnVnpay(request, { env })')
     && src.indexOf('duong === DUONG_IPN_VNPAY') > 0 && src.indexOf('duong === DUONG_IPN_VNPAY') < iHandle, String(iIpn));
});

// ===========================================================================
await nhom('6 · TRANG KẾT QUẢ (Return URL)', async () => {
  const pt = { cauHinh: CAU_HINH, taoClientMay: mayGia(), ghiLog: () => {} };
  const url = q => new URL(`https://beeftown.vn/mua-thit-ve/ket-qua?${q}`);
  ok('Chưa cài → chua_cai', (await H.docKetQuaVe(url(thamSoVe('AB23CD01', 1000)), { cauHinh: { ok: false, chuaCai: true, cau: '' } })).loai === 'chua_cai');
  const sua = thamSoVe('AB23CD01', 250000); sua.set('vnp_ResponseCode', '00'); sua.set('vnp_Amount', '1000');
  ok('Chữ ký sai → sai_chu_ky (không tin số nào)', (await H.docKetQuaVe(url(sua), pt)).loai === 'sai_chu_ky');
  ok('Terminal khác → sai_chu_ky', (await H.docKetQuaVe(url(thamSoVe('AB23CD01', 1000, { vnp_TmnCode: 'KHAC0001' })), pt)).loai === 'sai_chu_ky');

  const c = await donVaLanTra();
  const truoc = await H.docKetQuaVe(url(thamSoVe(c.mo.maGiaoDich, c.mo.soTien)), pt);
  ok('Mã 00 trước IPN → co_ket_qua, daTra true, daGhi false (trang nói "VNPay báo", không nói "Beeftown đã nhận tiền")',
     truoc.loai === 'co_ket_qua' && truoc.daTra && truoc.daGhi === false && truoc.maDon === c.maDon, JSON.stringify(truoc));
  ok('…và database có dấu khách về, lần trả vẫn chờ', (await lan(c.mo.maGiaoDich)).ve_ma_phan_hoi === '00' && (await lan(c.mo.maGiaoDich)).trang_thai === 'cho');
  await goiIpn(thamSoVe(c.mo.maGiaoDich, c.mo.soTien));
  const sau = await H.docKetQuaVe(url(thamSoVe(c.mo.maGiaoDich, c.mo.soTien)), pt);
  ok('Sau IPN → daGhi true', sau.loai === 'co_ket_qua' && sau.daGhi === true);
  const khongDn = await H.docKetQuaVe(url(thamSoVe(c.mo.maGiaoDich, c.mo.soTien)), { ...pt, taoClientMay: mayGia(UID_MAY, false) });
  ok('Không đăng nhập được máy → daGhi null (trang nói theo chữ ký, không nói "đã nhận tiền")', khongDn.loai === 'co_ket_qua' && khongDn.daGhi === null);
  const matMang = await H.docKetQuaVe(url(thamSoVe(c.mo.maGiaoDich, c.mo.soTien)),
    { ...pt, taoClientMay: () => ({ ...mayGia()(), rpc: async () => { throw new TypeError('fetch failed'); } }) });
  ok('Mất mạng khi ghi dấu → daGhi null, không ném', matMang.loai === 'co_ket_qua' && matMang.daGhi === null);

  const d = await donVaLanTra();
  const huy = await H.docKetQuaVe(url(thamSoVe(d.mo.maGiaoDich, d.mo.soTien, { vnp_ResponseCode: '24', vnp_TransactionStatus: '02' })), pt);
  ok('Mã 24 → daTra false, maPhanHoi 24', huy.loai === 'co_ket_qua' && !huy.daTra && huy.maPhanHoi === '24');
  for (const nn of NGON_NGU) {
    const cau = V.cauMaPhanHoi('24', nn), la = V.cauMaPhanHoi('XX', nn);
    ok(`[${nn}] câu mã 24 và mã lạ có, đúng thứ tiếng`, cau.length > 5 && la.length > 5 && (nn === 'vi' || (!VIET.test(cau) && !VIET.test(la))), `${cau} | ${la}`);
  }
});

// ===========================================================================
await nhom('7 · ĐẶT HÀNG CÓ VNPAY → CHUYỂN THẲNG SANG VNPAY (bam-hai-lan, mat-mang)', async () => {
  const g = maGui();
  const body = formDon(g, '2');
  const l = await XL.luotDatHang(yeuCau(new URLSearchParams(body)), anon, '/mua-thit-ve', 'vi', VNPAY_TRANG, () => Date.parse('2026-11-12T23:50:00+07:00'));
  const u = l.sangVnpay ? new URL(l.ve) : null;
  ok('Đã nhận → sangVnpay, đường dẫn tới cổng VNPay', l.sangVnpay === true && `${u?.origin}${u?.pathname}` === V.CONG_VNPAY, l.ve);
  const ma = l.ketQua.ma;
  ok('TxnRef = mã đơn + 01, số tiền = 2 gói × giá đã chốt × 100', u?.searchParams.get('vnp_TxnRef') === `${ma}01`
     && u?.searchParams.get('vnp_Amount') === String(2 * GIA_GOI * 100), u?.search ?? '');
  const p = Object.fromEntries(u.searchParams); const { vnp_SecureHash: ky, ...conLai } = p;
  ok('Chữ ký đúng (tính độc lập)', ky === kyDocLap(conLai));
  ok('Đường dẫn VNPay không mang họ tên, số điện thoại, địa chỉ, ma_gui', !/Mai|Pasteur|09\d{8}/.test(decodeURIComponent(l.ve)) && !l.ve.includes(g));
  ok('Cookie trả lại = "<mã đơn>.<ma_gui>"', l.traVnpay === `${ma}.${g}`);
  ok('vnp_IpAddr là IP của khách (CF-Connecting-IP)', /^203\.0\.113\.\d+$/.test(u.searchParams.get('vnp_IpAddr') ?? ''));
  ok('Giờ tạo theo giờ VN của bayGio', u.searchParams.get('vnp_CreateDate') === '20261112235000');

  const lai = await XL.luotDatHang(yeuCau(new URLSearchParams(body)), anon, '/mua-thit-ve', 'vi', VNPAY_TRANG);
  ok('Gửi lại cùng form (F5) → cùng đơn, lần trả mới 02', lai.ketQua.ma === ma && new URL(lai.ve).searchParams.get('vnp_TxnRef') === `${ma}02`);
  await goiIpn(thamSoVe(`${ma}02`, 2 * GIA_GOI));
  const daTra = await XL.luotDatHang(yeuCau(new URLSearchParams(body)), anon, '/mua-thit-ve', 'en', VNPAY_TRANG);
  ok('Đơn đã trả rồi gửi lại → thẻ "đã trả" (#da-nhan), không sang VNPay, không lần trả mới',
     !daTra.sangVnpay && daTra.ketQua.daTra === true && daTra.ve === '/mua-thit-ve#da-nhan'
     && Number((await db.query(`select count(*) n from thanh_toan_vnpay_web where ma_giao_dich like $1`, [`${ma}%`])).rows[0].n) === 2, JSON.stringify(daTra));

  const khongVnpay = await XL.luotDatHang(yeuCau(formDon()), anon, '/mua-thit-ve', 'vi', null);
  ok('Chưa cài VNPay → như 0113: #da-nhan, không lần trả', !khongVnpay.sangVnpay && khongVnpay.ve === '/mua-thit-ve#da-nhan' && !khongVnpay.traVnpay
     && Number((await db.query(`select count(*) n from thanh_toan_vnpay_web where ma_giao_dich like $1`, [`${khongVnpay.ketQua.ma}%`])).rows[0].n) === 0);

  // Mở lần trả hỏng: client anon bọc — tạo đơn chạy thật, mua_thit_mo_vnpay hỏng theo từng kiểu.
  const boc = hong => ({ rpc: (ham, ts) => (ham === 'mua_thit_mo_vnpay' ? hong() : anon.rpc(ham, ts)) });
  const loiNhat = [];
  const cu = console.error; console.error = (...a) => loiNhat.push(a.join(' '));
  const matMang = await XL.luotDatHang(yeuCau(formDon()), boc(async () => ({ data: null, error: { message: 'TypeError: fetch failed', code: '' } })), '/en/buy-meat', 'en', VNPAY_TRANG);
  console.error = cu;
  ok('Mất mạng khi mở lần trả → thẻ "đã nhận đơn", CHƯA trả, nút trả lại (cookie), không sang VNPay',
     matMang.ketQua.ok && matMang.ketQua.choTra === true && !matMang.sangVnpay && matMang.ve === '/en/buy-meat#da-nhan'
     && matMang.ketQua.loi === 'We got no response while opening the payment page. Your order is still held. Please try again in a few minutes or call Beeftown.'
     && matMang.traVnpay?.startsWith(matMang.ketQua.ma + '.') && loiNhat.length === 1, JSON.stringify(matMang));
  const tuChoi = await XL.luotDatHang(yeuCau(formDon()), boc(async () => ({ data: null, error: { message: 'Đơn này đã mở trang trả tiền quá nhiều lần, vui lòng gọi quán', code: '23514' } })), '/ko/buy-meat', 'ko', VNPAY_TRANG);
  ok('Database từ chối → câu của database đúng thứ tiếng (ko), CHƯA trả',
     tuChoi.ketQua.choTra === true && tuChoi.ketQua.loi === '이 주문의 결제 페이지를 너무 여러 번 여셨어요. 매장에 전화해 주세요.', JSON.stringify(tuChoi.ketQua));
  console.error = () => {};
  const rong = await XL.luotDatHang(yeuCau(formDon()), boc(async () => ({ data: null, error: null })), '/mua-thit-ve', 'vi', VNPAY_TRANG);
  console.error = cu;
  ok('Trả lời rỗng → coi như không nghe được (choTra), không bao giờ sang VNPay với số bừa', rong.ketQua.choTra === true && !rong.sangVnpay);

  // Rà soát 12/11/2026: số tiền ngoài khoảng VNPay nhận làm taoLinkVnpay ném → trước đây trang 500 dù đơn đã ghi.
  console.error = () => {};
  const tienNho = await XL.luotDatHang(yeuCau(formDon()), boc(async () => ({ data: { ma_don: 'ZX23CD', so_tien: 4000, da_tra: false, ma_giao_dich: 'ZX23CD01' }, error: null })),
    '/mua-thit-ve', 'vi', VNPAY_TRANG);
  console.error = cu;
  ok('Số tiền VNPay không nhận (4.000 đ) → thẻ "đã nhận đơn, CHƯA trả tiền", không ném, không sang VNPay',
     tienNho.ketQua.ok && tienNho.ketQua.choTra === true && !tienNho.sangVnpay && tienNho.ketQua.loi === DH.CAU_DAT_HANG.chuaMoTraTien.vi, JSON.stringify(tienNho.ketQua));

  const kq = XL.ketQuaDatHang({ cookies: { get: () => ({ value: JSON.stringify({ ...matMang.ketQua, loai: 'dat_hang' }) }), delete: () => {} } }, 'en');
  ok('ketQuaDatHang đưa choTra, loiTra cho thẻ', kq.ok && kq.choTra === true && kq.loiTra === matMang.ketQua.loi && kq.daTra === false);
});

// ===========================================================================
await nhom('8 · NÚT "TRẢ TIỀN QUA VNPAY" (luotTraLai) — CHỈ ĐÚNG ĐƠN CỦA COOKIE', async () => {
  const g = maGui();
  const dat = await XL.luotDatHang(yeuCau(formDon(g)), anon, '/mua-thit-ve', 'vi', null);
  const ma = dat.ketQua.ma;
  const nut = (maDon, duong = '/mua-thit-ve/ket-qua') => yeuCau(new URLSearchParams({ ma_don: maDon }), duong);
  const tot = await XL.luotTraLai(nut(ma), `${ma}.${g}`, anon, 'vi', VNPAY_TRANG);
  ok('Cookie đúng đơn → sang VNPay, lần trả 01', tot.loai === 'sang_vnpay' && new URL(tot.url).searchParams.get('vnp_TxnRef') === `${ma}01`, JSON.stringify(tot));
  const khac = await XL.luotTraLai(nut('ZZZZZZ'), `${ma}.${g}`, anon, 'en', VNPAY_TRANG);
  ok('Nút của đơn khác với cookie → từ chối, không mở gì', khac.loai === 'loi' && /cannot reopen the payment page/.test(khac.cau));
  const khongCookie = await XL.luotTraLai(nut(ma), null, anon, 'vi', VNPAY_TRANG);
  ok('Không cookie → từ chối', khongCookie.loai === 'loi' && /Không mở lại được/.test(khongCookie.cau));
  const cookieGia = await XL.luotTraLai(nut(ma), `${ma}.${maGui()}`, anon, 'vi', VNPAY_TRANG);
  ok('Cookie đúng mã đơn mà ma_gui giả → database "Không thấy đơn để trả tiền"', cookieGia.loai === 'loi' && /^Không thấy đơn để trả tiền/.test(cookieGia.cau), JSON.stringify(cookieGia));
  const chuaCai = await XL.luotTraLai(nut(ma), `${ma}.${g}`, anon, 'ko', null);
  ok('Chưa cài VNPay → câu "chưa sẵn sàng" (ko)', chuaCai.loai === 'loi' && chuaCai.cau === '웹사이트 결제가 아직 준비되지 않았어요. Beeftown에 전화해 주세요.');
  await goiIpn(thamSoVe(`${ma}01`, GIA_GOI));
  const daTra = await XL.luotTraLai(nut(ma), `${ma}.${g}`, anon, 'vi', VNPAY_TRANG);
  ok('Đơn đã trả → da_tra, không mở lần mới', daTra.loai === 'da_tra' && daTra.maDon === ma);
  ok('maDonTraVnpay đọc mã đơn từ cookie; cookie sai dạng → null',
     XL.maDonTraVnpay({ get: () => ({ value: `${ma}.${g}` }) }) === ma && XL.maDonTraVnpay({ get: () => ({ value: 'abc' }) }) === null
     && XL.maDonTraVnpay({ get: () => undefined }) === null);
});

// ===========================================================================
await nhom('9 · CÂU CHỮ BA THỨ TIẾNG, KHÔNG CHỮ CẤM (cau-chu)', async () => {
  const tep = ['components/TrangMuaThitVe.astro', 'components/TrangKetQuaVnpay.astro', 'lib/xu-ly-form.ts', 'lib/vnpay.ts', 'lib/dat-hang-mua-thit.ts'];
  for (const f of tep) {
    const s = readFileSync(join(WEB, f), 'utf8');
    const cau = [...s.matchAll(/\b(?:vi|en|ko): '([^']+)'/g)].map(m => m[1]);
    ok(`${f}: không "thành công" / "success" / "성공" trong câu khách đọc`, cau.length > 3 && !cau.some(c => /thành công|\bsuccess|성공/i.test(c)), String(cau.length));
    const cauVi = [...s.matchAll(/vi: '([^']+)'/g)].map(m => m[1]);
    const cam = cauVi.flatMap(c => timChuoiCam(c).map(x => `${c} → ${x.tim_thay}`));
    ok(`${f}: câu tiếng Việt không chữ cấm`, cam.length === 0, cam.join(' | '));
  }
  for (const [ma, cau] of Object.entries(V.CAU_MA_PHAN_HOI)) {
    ok(`Mã ${ma}: đủ vi, en, ko; en / ko không lẫn chữ Việt`, NGON_NGU.every(nn => cau[nn]?.length > 5) && !VIET.test(cau.en) && !VIET.test(cau.ko));
  }
  const kq = readFileSync(join(WEB, 'components', 'TrangKetQuaVnpay.astro'), 'utf8');
  ok('Trang kết quả: "Beeftown đã nhận tiền" chỉ dùng cho màn da_nhan_tien', /man\.loai === 'da_nhan_tien' \? c\.daNhanTienH1/.test(kq));
  ok('Trang kết quả: số tiền trong phần tử data-tien', /data-tien>\{dinhDangTien\(soTien\)\}/.test(kq));
  const hopThu = readFileSync(join(WEB, 'pages', 'noi-bo', 'don-mua-thit.astro'), 'utf8');
  ok('Hộp thư: cổng còn là cổng thử thì dòng "Đã trả" ghi rõ CỔNG THỬ, không phải tiền thật (ai cũng trả được bằng thẻ thử công khai)',
     /const congThu = \/sandbox\/\.test\(CONG_VNPAY\);/.test(hopThu) && /\{congThu && <><br \/><strong data-cong-thu>\{t\.congThu\}<\/strong><\/>\}/.test(hopThu)
     && /CỔNG THỬ của VNPay — không phải tiền thật/.test(hopThu) && /VNPay TEST gateway — not real money/.test(hopThu));
  for (const [f, cau] of [['quyen-rieng-tu.astro', /VNPay/], ['en/privacy.astro', /VNPay/], ['ko/privacy.astro', /VNPay/]]) {
    const s = readFileSync(join(WEB, 'pages', f), 'utf8');
    ok(`Quyền riêng tư (${f}) nói về VNPay và không còn nói website không bao giờ thu tiền`, cau.test(s)
       && !/Website không thu tiền và không lưu thông tin thanh toán nào|does not take payment and stores no payment details|결제하지 않으며 결제 정보도 저장하지 않아요/.test(s));
  }
});

process.exit(ketThuc('MUA THỊT VỀ — VNPAY TRÊN WEBSITE'));
