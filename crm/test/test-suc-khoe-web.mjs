/**
 * BEEFTOWN — SỨC KHỎE HỆ THỐNG, PHÍA WEB (web/src/lib/suc-khoe.ts)
 * =================================================================
 * Database (0055, ô sao_luu từ 0058) chỉ trả số liệu; màu đèn và câu do lib/suc-khoe.ts quyết định. File này thử
 * TỪNG NGƯỠNG bằng dữ liệu giả, không cần database (phần đọc database thật và "web đọc đúng tên
 * từng ô" nằm ở test-suc-khoe.mjs).
 *
 * Bốn điều phải luôn đúng:
 *   1. Database mới, chưa bật gì → không đèn đỏ / vàng nào (không báo nhầm).
 *   2. Mỗi kiểu hỏng làm đúng đèn đó đổi màu, câu nói đúng số và đúng việc phải làm.
 *   3. Không đọc được số liệu (mạng, database lỗi, chưa chạy migration, dạng lạ) → KHÔNG BAO GIỜ
 *      hiện xanh hay "mọi thứ đang chạy tốt"; docSucKhoe không bao giờ ném lỗi.
 *   4. Tiếng Anh không lẫn chữ Việt.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { datGio, traGio } from './dong-ho-gia.mjs';
import { VIET, boChuThich } from './quet-chu-viet.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web', 'src');
const {
  danhGiaSucKhoe, bangSucKhoe, cauTomTat, docSucKhoe, docSaoLuu, docSucKhoeVaSaoLuu, laSucKhoeTho, laThieuHam, khoangThoiGian, tuTruoc,
  PHUT_NHIP_TIM, GIO_KHONG_CO_TIN, PHUT_TIN_KET, GIO_SAO_LUU,
} = await import(join(WEB, 'lib', 'suc-khoe.ts'));

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — SỨC KHỎE HỆ THỐNG, PHÍA WEB');

// 12:00 trưa giờ Việt Nam.
const LUC = '2026-09-29T05:00:00.000Z';
const T = Date.parse(LUC);
const truoc = phut => new Date(T - phut * 60000).toISOString();

function cnGoc() {
  return {
    id: 'cn-1', ma: 'q1', ten: 'Beeftown Quận 1',
    ipos: { co_cau_hinh: false, bat: false, cau_hinh_du: false, den: 'vang', mat_ket_noi: false, loi_tu_luc: null,
            nhan_hd_luc: null, gio_mat_ket_noi: 3, dang_tru_kho: false, cho_xu_ly: 0, dong_loi: 0,
            bat_luc: null, cron_cuoi: null },
    tin_zalo: { that_bai_24h: 0, cho_qua_han: 0 },
    dat_ban: { form_mo: false, so_ban: 0, cho: 0, cho_qua_2_gio: 0, cho_qua_24_gio: 0, qua_gio_hen: 0 },
    tuyen_dung: { moi: 0, moi_qua_2_ngay: 0, moi_qua_7_ngay: 0 },
    so_kho: { co_kho: false, lech: 0 },
  };
}
/** Sao lưu đêm qua chạy tốt (0058): bản lúc 02:00 giờ VN, khôi phục thử đạt. */
const SAO_LUU_TOT = { lan_cuoi: truoc(10 * 60), lan_cuoi_ok: true, lan_cuoi_thu: 'dat', dung_duoc_cuoi: truoc(10 * 60),
                      kich_thuoc: 89456123 };
const SAO_LUU_RONG = { lan_cuoi: null, lan_cuoi_ok: null, lan_cuoi_thu: null, dung_duoc_cuoi: null, kich_thuoc: null };
/**
 * Đúng dạng database mới: chưa bật gì, không có gì chờ — và sao lưu hằng đêm đang chạy (sao lưu
 * không có trạng thái "chưa bật": chưa có bản nào là đỏ, thử ở nhóm 16).
 */
function thoGoc() {
  return {
    luc: LUC,
    zalo: { dang_bat: false, che_do: 'thu', bat_luc: null, lan_chay_cuoi: null, co_loi: false },
    messenger: { dang_bat: false, bat_luc: null, lan_nhan_cuoi: null, loi_cuoi_luc: null, loi_7_ngay: 0 },
    dich: { cho: 0, loi: 0 },
    sao_luu: { ...SAO_LUU_TOT },
    chi_nhanh: [cnGoc()],
  };
}
const voi = sua => { const t = thoGoc(); sua(t, t.chi_nhanh[0]); return t; };
/** Đèn `ma` (khối thương hiệu hoặc chi nhánh đầu tiên). */
const den = (tho, ma, nn = 'vi', laChu = true) =>
  danhGiaSucKhoe(tho, nn, laChu).khoi.flatMap(k => k.den).find(d => d.ma === ma);
const tom = d => `${d?.mau} — ${d?.cau}`;

const IPOS_CHAY = {
  co_cau_hinh: true, bat: true, cau_hinh_du: true, den: 'xanh', mat_ket_noi: false, loi_tu_luc: null,
  dang_tru_kho: true, bat_luc: truoc(3 * 24 * 60), cron_cuoi: truoc(4), nhan_hd_luc: truoc(12),
};
const ZALO_CHAY = { dang_bat: true, che_do: 'that', bat_luc: truoc(3 * 24 * 60), lan_chay_cuoi: truoc(3), co_loi: false };
const MESS_CHAY = { dang_bat: true, bat_luc: truoc(30 * 24 * 60), loi_cuoi_luc: null, lan_nhan_cuoi: truoc(10), loi_7_ngay: 0 };

// ===========================================================================
await nhom('1 · DATABASE MỚI, CHƯA BẬT GÌ → KHÔNG BÁO NHẦM', async () => {
  const sk = danhGiaSucKhoe(thoGoc(), 'vi', true);
  ok('Không đèn đỏ, không đèn vàng', sk.soDo === 0 && sk.soVang === 0, `${sk.soDo} đỏ, ${sk.soVang} vàng`);
  ok('Khối đầu là "Toàn thương hiệu", rồi từng chi nhánh theo tên',
     sk.khoi.length === 2 && sk.khoi[0].ten === 'Toàn thương hiệu' && sk.khoi[1].ten === 'Beeftown Quận 1',
     sk.khoi.map(k => k.ten).join(' | '));
  const mau = Object.fromEntries(sk.khoi.flatMap(k => k.den).map(d => [d.ma, d.mau]));
  ok('Chưa bật → xám: Zalo, Messenger, tin Zalo, iPOS, kho; form đặt bàn đóng và không có yêu cầu → xám',
     ['zalo', 'messenger', 'tin_zalo', 'ipos', 'so_kho', 'dat_ban'].every(m => mau[m] === 'tat'), JSON.stringify(mau));
  ok('Không có gì chờ → máy dịch và hồ sơ xanh', mau.dich === 'xanh' && mau.tuyen_dung === 'xanh', JSON.stringify(mau));
  ok('Câu tóm tắt: mọi thứ đang chạy tốt', cauTomTat(sk, 'vi') === 'Mọi thứ đang chạy tốt');
  ok('Giờ số liệu theo giờ Việt Nam (05:00 UTC → 12:00)', sk.gio === '12:00', sk.gio);
  const sk2 = danhGiaSucKhoe({ ...thoGoc(), luc: '2026-09-29T17:05:00Z' }, 'vi');
  ok('Qua nửa đêm giờ VN (17:05 UTC → 00:05)', sk2.gio === '00:05', sk2.gio);
});

// ===========================================================================
await nhom('2 · ĐẶT BÀN', async () => {
  let d = den(voi((t, c) => { c.dat_ban.form_mo = true; c.dat_ban.so_ban = 0; }), 'dat_ban');
  ok('Form mở mà chi nhánh chưa có bàn → đỏ, mở màn Cài đặt',
     d.mau === 'do' && /chưa có bàn nào/.test(d.cau) && d.di === '/noi-bo/cai-dat', tom(d) + ' ' + d.di);
  d = den(voi((t, c) => { Object.assign(c.dat_ban, { form_mo: true, so_ban: 5, cho: 2 }); }), 'dat_ban');
  ok('2 yêu cầu mới (chưa quá 2 giờ) → xanh, nói số', d.mau === 'xanh' && /^2 yêu cầu mới/.test(d.cau), tom(d));
  d = den(voi((t, c) => { Object.assign(c.dat_ban, { form_mo: false, cho: 1, cho_qua_2_gio: 1 }); }), 'dat_ban');
  ok('Form đã đóng nhưng còn yêu cầu chờ quá 2 giờ → vàng (không xám)', d.mau === 'vang' && /1 yêu cầu chờ quá 2 giờ/.test(d.cau), tom(d));
  d = den(voi((t, c) => {
    Object.assign(c.dat_ban, { form_mo: true, so_ban: 5, cho: 4, cho_qua_2_gio: 2, cho_qua_24_gio: 1, qua_gio_hen: 1 });
  }), 'dat_ban');
  ok('Qua giờ hẹn / chờ quá 24 giờ → đỏ; ba nhóm database đã tách sẵn, web nói đúng từng số (không trừ, không cộng)',
     d.mau === 'do' && /1 yêu cầu đã qua giờ hẹn/.test(d.cau) && /1 yêu cầu chờ quá 24 giờ/.test(d.cau)
     && /2 yêu cầu chờ quá 2 giờ/.test(d.cau), tom(d));
  ok('Câu đỏ đứng trước câu vàng', d.cau.indexOf('qua giờ hẹn') < d.cau.indexOf('chờ quá 2 giờ')
     && d.cau.indexOf('chờ quá 24 giờ') < d.cau.indexOf('chờ quá 2 giờ'), d.cau);
  ok('Có yêu cầu chờ → mở màn Đặt bàn', d.di === '/noi-bo/dat-ban', d.di);
  d = den(voi((t, c) => { Object.assign(c.dat_ban, { form_mo: true, so_ban: 0, cho: 1, qua_gio_hen: 1 }); }), 'dat_ban');
  ok('Vừa thiếu bàn vừa có yêu cầu quá hẹn → mở màn Đặt bàn (việc gấp nhất là gọi khách)', d.di === '/noi-bo/dat-ban', d.di);
});

// ===========================================================================
await nhom('3 · HỒ SƠ ỨNG TUYỂN', async () => {
  let d = den(voi((t, c) => { Object.assign(c.tuyen_dung, { moi: 3, moi_qua_2_ngay: 1, moi_qua_7_ngay: 1 }); }), 'tuyen_dung');
  ok('Nằm im quá 7 ngày → đỏ; nhóm 2–7 ngày đi sau, đúng số database trả',
     d.mau === 'do' && /1 hồ sơ chưa ai mở quá 7 ngày/.test(d.cau) && /1 hồ sơ chưa ai mở quá 2 ngày/.test(d.cau), tom(d));
  d = den(voi((t, c) => { Object.assign(c.tuyen_dung, { moi: 1, moi_qua_2_ngay: 1 }); }), 'tuyen_dung');
  ok('Quá 2 ngày → vàng', d.mau === 'vang', tom(d));
  d = den(voi((t, c) => { c.tuyen_dung.moi = 2; }), 'tuyen_dung');
  ok('Hồ sơ mới chưa quá 2 ngày → xanh, nói số', d.mau === 'xanh' && /^2 hồ sơ mới/.test(d.cau) && d.di === '/noi-bo/tuyen-dung', tom(d));
});

// ===========================================================================
await nhom('4 · iPOS', async () => {
  const ipos = sua => den(voi((t, c) => { Object.assign(c.ipos, IPOS_CHAY, sua); }), 'ipos');
  let d = den(thoGoc(), 'ipos');
  ok('Chưa bật → xám, mở cài đặt iPOS của ĐÚNG chi nhánh (?cn=)', d.mau === 'tat' && d.di === '/noi-bo/kho/cai-dat/ipos?cn=q1', d.di);
  d = ipos({ cau_hinh_du: false });
  ok('Bật mà chưa cấu hình đủ → vàng', d.mau === 'vang' && /chưa cấu hình đủ/.test(d.cau), tom(d));
  d = ipos({});
  ok('Đang chạy → xanh, nói hóa đơn gần nhất', d.mau === 'xanh' && /hóa đơn gần nhất 12 phút trước/.test(d.cau), tom(d));
  d = ipos({ cron_cuoi: truoc(PHUT_NHIP_TIM) });
  ok(`Lượt cron đúng ${PHUT_NHIP_TIM} phút trước → chưa đỏ (ngưỡng là QUÁ ${PHUT_NHIP_TIM} phút)`, d.mau === 'xanh', tom(d));
  d = ipos({ cron_cuoi: truoc(PHUT_NHIP_TIM + 1) });
  ok('Việc chạy nền dừng quá 30 phút → đỏ, nói lượt gần nhất và việc phải làm',
     d.mau === 'do' && /lượt gần nhất 31 phút trước/.test(d.cau) && /Cron/.test(d.cau), tom(d));
  d = ipos({ cron_cuoi: null, bat_luc: truoc(5) });
  ok('Vừa bật 5 phút, cron chưa chạy lượt đầu → chưa đỏ', d.mau === 'xanh', tom(d));
  d = ipos({ cron_cuoi: null, bat_luc: truoc(40) });
  ok('Bật 40 phút mà cron chưa chạy lượt nào (mất bí mật Worker) → đỏ', d.mau === 'do' && /chưa chạy lượt nào/.test(d.cau), tom(d));
  d = ipos({ den: 'do', mat_ket_noi: true, loi_tu_luc: truoc(120) });
  ok('Đèn đỏ của màn Kết nối iPOS vì lượt cập nhật lỗi → đỏ, nói lỗi từ bao giờ',
     d.mau === 'do' && /Lần cập nhật gần nhất bị lỗi \(lỗi từ 2 giờ trước\)/.test(d.cau), tom(d));
  d = ipos({ den: 'do', mat_ket_noi: true, gio_mat_ket_noi: 3 });
  ok('Đèn đỏ vì lâu không nhận hóa đơn → đỏ, nói số giờ', d.mau === 'do' && /Hơn 3 giờ/.test(d.cau), tom(d));
  d = ipos({ den: 'vang', dang_tru_kho: false });
  ok('Nhận hóa đơn mà chưa trừ kho → vàng (giống màn Kết nối iPOS)', d.mau === 'vang' && /CHƯA trừ kho/.test(d.cau), tom(d));
  d = ipos({ den: 'vang', cho_xu_ly: 2, dong_loi: 1 });
  ok('Dòng bán chưa trừ được → vàng, nói tổng số, mở Bán hàng iPOS của đúng chi nhánh',
     d.mau === 'vang' && /^3 dòng bán/.test(d.cau) && d.di === '/noi-bo/kho/ban-ipos?cn=q1', tom(d) + ' ' + d.di);
  d = ipos({ den: 'tim' });
  ok('Giá trị đèn lạ → vàng "không rõ", không bao giờ xanh', d.mau === 'vang' && /Không rõ/.test(d.cau), tom(d));
});

// ===========================================================================
await nhom('5 · SỔ KHO', async () => {
  let d = den(voi((t, c) => { c.so_kho.co_kho = true; }), 'so_kho');
  ok('Có kho, tồn khớp sổ → xanh, mở kho của đúng chi nhánh', d.mau === 'xanh' && d.di === '/noi-bo/kho?cn=q1', tom(d) + ' ' + d.di);
  d = den(voi((t, c) => { Object.assign(c.so_kho, { co_kho: true, lech: 2 }); }), 'so_kho');
  ok('Lô lệch sổ kho → đỏ, dặn không sửa tay', d.mau === 'do' && /^2 lô/.test(d.cau) && /đừng sửa tay/.test(d.cau), tom(d));
  const q = den(voi((t, c) => { Object.assign(c.so_kho, { co_kho: true, lech: 1 }); c.ma = 'q 7&x'; }), 'so_kho');
  ok('Mã chi nhánh được mã hóa trong đường dẫn', q.di === '/noi-bo/kho?cn=q%207%26x', q.di);
});

// ===========================================================================
await nhom('6 · TIN ZALO CỦA CHI NHÁNH', async () => {
  let d = den(voi((t, c) => { c.tin_zalo.cho_qua_han = 3; }), 'tin_zalo');
  ok('Zalo chưa bật → xám, dù có tin chờ', d.mau === 'tat', tom(d));
  d = den(voi((t, c) => { Object.assign(t.zalo, ZALO_CHAY); c.tin_zalo.cho_qua_han = 1; c.tin_zalo.that_bai_24h = 2; }), 'tin_zalo');
  ok('Tin giao dịch kẹt → đỏ; tin hỏng trong 24 giờ đi sau',
     d.mau === 'do' && /^1 tin giao dịch đến hạn quá 30 phút/.test(d.cau) && /2 tin đến hạn trong 24 giờ qua đã hỏng/.test(d.cau),
     tom(d));
  d = den(voi((t, c) => { Object.assign(t.zalo, ZALO_CHAY); c.tin_zalo.that_bai_24h = 2; }), 'tin_zalo');
  ok('Chỉ có tin hỏng → vàng', d.mau === 'vang', tom(d));
});

// ===========================================================================
await nhom('7 · BỘ GỬI TIN ZALO (NHỊP TIM VIỆC CHẠY NỀN)', async () => {
  const zalo = (sua, laChu = true) => den(voi(t => { Object.assign(t.zalo, ZALO_CHAY, sua); }), 'zalo', 'vi', laChu);
  let d = zalo({});
  ok('Chạy đều → xanh, nói lượt gần nhất', d.mau === 'xanh' && /lượt gần nhất 3 phút trước/.test(d.cau), tom(d));
  ok('Chủ mở màn cài đặt Zalo; quản lý mở màn Zalo chung',
     d.di === '/noi-bo/zalo/cai-dat' && zalo({}, false).di === '/noi-bo/zalo', `${d.di} / ${zalo({}, false).di}`);
  d = zalo({ lan_chay_cuoi: truoc(45) });
  ok('Bật 3 ngày, lượt chạy xong gần nhất 45 phút trước → đỏ', d.mau === 'do'
     && /Bộ gửi đã dừng \(lượt gần nhất 45 phút trước\)/.test(d.cau), tom(d));
  d = zalo({ lan_chay_cuoi: null, bat_luc: truoc(5) });
  ok('Vừa bật 5 phút, chưa có lượt → chưa đỏ', d.mau === 'xanh' && /vừa bật/.test(d.cau), tom(d));
  d = zalo({ lan_chay_cuoi: null, bat_luc: truoc(40) });
  ok('Bật 40 phút mà chưa chạy lượt nào → đỏ', d.mau === 'do' && /chưa chạy lượt nào/.test(d.cau), tom(d));
  d = zalo({ lan_chay_cuoi: truoc(3 * 24 * 60), bat_luc: truoc(5) });
  ok('Bật lại 5 phút trước: lượt cũ từ trước khi tắt không tính, chưa đỏ', d.mau === 'xanh' && /vừa bật/.test(d.cau), tom(d));
  d = zalo({ lan_chay_cuoi: truoc(3 * 24 * 60), bat_luc: truoc(40) });
  ok('Bật lại 40 phút mà chưa có lượt mới → đỏ "chưa chạy lượt nào kể từ khi bật" (không nói "lượt gần nhất 3 ngày")',
     d.mau === 'do' && /chưa chạy lượt nào kể từ khi bật/.test(d.cau), tom(d));
  d = zalo({ co_loi: true });
  ok('Lượt gần nhất lỗi → đỏ', d.mau === 'do' && /Lượt gửi gần nhất bị lỗi/.test(d.cau), tom(d));
  d = zalo({ lan_chay_cuoi: truoc(45), co_loi: true });
  ok('Đã dừng VÀ lượt cuối lỗi → cả hai câu (lỗi thường là lý do dừng)',
     d.mau === 'do' && /đã dừng/.test(d.cau) && /Lượt gửi gần nhất bị lỗi/.test(d.cau), tom(d));
  d = zalo({ che_do: 'thu' });
  ok('Chế độ thử → vàng: khách thật chưa nhận gì', d.mau === 'vang' && /khách thật chưa nhận gì/.test(d.cau), tom(d));
});

// ===========================================================================
await nhom('8 · BOT MESSENGER', async () => {
  const mess = sua => den(voi(t => { Object.assign(t.messenger, MESS_CHAY, sua); }), 'messenger');
  let d = mess({});
  ok('Trả lời bình thường → xanh, nói tin gần nhất', d.mau === 'xanh' && /tin gần nhất 10 phút trước/.test(d.cau), tom(d));
  d = mess({ loi_cuoi_luc: truoc(20), lan_nhan_cuoi: truoc(30), loi_7_ngay: 1 });
  ok('Tin gần nhất của khách bị lỗi (20 phút) → đỏ', d.mau === 'do' && /Tin gần nhất của khách bị lỗi \(20 phút trước\)/.test(d.cau), tom(d));
  d = mess({ loi_cuoi_luc: truoc(20), lan_nhan_cuoi: null, loi_7_ngay: 1 });
  ok('Lỗi mà chưa từng nhận tin nào → đỏ', d.mau === 'do', tom(d));
  d = mess({ loi_cuoi_luc: truoc(20), lan_nhan_cuoi: truoc(5), loi_7_ngay: 5 });
  ok('Có tin đến SAU lỗi (bot đã chạy lại) → chỉ vàng, nói số lỗi 7 ngày', d.mau === 'vang' && /^5 lỗi trong 7 ngày/.test(d.cau), tom(d));
  d = mess({ loi_cuoi_luc: truoc(90), lan_nhan_cuoi: truoc(100), loi_7_ngay: 1 });
  ok('Lỗi đã hơn 60 phút → vàng, không đỏ', d.mau === 'vang', tom(d));
  d = mess({ lan_nhan_cuoi: truoc(4 * 24 * 60) });
  ok(`Bật mà ${GIO_KHONG_CO_TIN} giờ+ không nhận được tin nào → vàng, bảo nhắn thử kiểm tra webhook`,
     d.mau === 'vang' && /Không nhận được tin nào từ Facebook 4 ngày nay/.test(d.cau) && /webhook/.test(d.cau), tom(d));
  d = mess({ lan_nhan_cuoi: null, bat_luc: truoc(4 * 24 * 60) });
  ok('Bật 4 ngày mà chưa từng nhận tin → vàng', d.mau === 'vang' && /Chưa nhận được tin nào/.test(d.cau), tom(d));
  d = mess({ lan_nhan_cuoi: truoc(10 * 24 * 60), bat_luc: truoc(4 * 24 * 60) });
  ok('Bật lại 4 ngày, tin gần nhất từ trước lần bật → vàng "chưa nhận được tin nào kể từ khi bật"',
     d.mau === 'vang' && /Chưa nhận được tin nào từ Facebook kể từ khi bật/.test(d.cau), tom(d));
  d = mess({ lan_nhan_cuoi: null, bat_luc: truoc(24 * 60) });
  ok('Bật 1 ngày chưa có tin → vẫn xanh (chưa đủ lâu để nghi)', d.mau === 'xanh', tom(d));
});

// ===========================================================================
await nhom('9 · MÁY DỊCH', async () => {
  let d = den(voi(t => { t.dich.loi = 2; }), 'dich');
  ok('Ô dịch lỗi quá 15 phút → vàng, không có màn riêng (việc của người quản trị kỹ thuật)',
     d.mau === 'vang' && /^2 ô dịch bị lỗi/.test(d.cau) && d.di === null, tom(d));
  d = den(voi(t => { t.dich.cho = 5; }), 'dich');
  ok('Chỉ đang chờ dịch → xanh (máy tự dịch dần), nói số', d.mau === 'xanh' && /5 ô đang chờ dịch/.test(d.cau), tom(d));
});

// ===========================================================================
await nhom('10 · TÓM TẮT, VÀ KHÔNG ĐỌC ĐƯỢC THÌ KHÔNG BAO GIỜ BÁO TỐT', async () => {
  const xau = voi((t, c) => {
    Object.assign(t.zalo, ZALO_CHAY, { co_loi: true });
    Object.assign(c.so_kho, { co_kho: true, lech: 1 });
    t.dich.loi = 1;
  });
  const sk = danhGiaSucKhoe(xau, 'vi');
  ok('Đếm đúng: 2 đỏ (Zalo, sổ kho), 1 vàng (máy dịch)', sk.soDo === 2 && sk.soVang === 1, `${sk.soDo} / ${sk.soVang}`);
  ok('Câu tóm tắt vi', cauTomTat(sk, 'vi') === '2 mục cần xử lý ngay · 1 mục cần xem hôm nay', cauTomTat(sk, 'vi'));
  ok('Câu tóm tắt en (số ít / số nhiều)', cauTomTat(sk, 'en') === '2 items to act on now · 1 item to check today', cauTomTat(sk, 'en'));

  const tot = bangSucKhoe({ ok: true, tho: thoGoc() }, 'vi');
  ok('Có số liệu, không vấn đề → xanh, "Mọi thứ đang chạy tốt"', tot.loai === 'so_lieu' && tot.mau === 'xanh'
     && tot.tom === 'Mọi thứ đang chạy tốt', JSON.stringify({ loai: tot.loai, mau: tot.mau, tom: tot.tom }));
  const xauBang = bangSucKhoe({ ok: true, tho: xau }, 'vi');
  ok('Có đèn đỏ → cả bảng đỏ', xauBang.mau === 'do', xauBang.mau);

  for (const nn of ['vi', 'en']) {
    const chua = bangSucKhoe({ ok: false, chuaCoHam: true }, nn);
    const hong = bangSucKhoe({ ok: false, chuaCoHam: false }, nn);
    ok(`[${nn}] Chưa chạy migration → vàng, nói rõ cần migration 0055`,
       chua.loai === 'chua_co_ham' && chua.mau === 'vang' && chua.sk === null && /0055/.test(chua.tom), chua.tom);
    ok(`[${nn}] Không đọc được → đỏ, nói rõ KHÔNG có nghĩa là ổn`,
       hong.loai === 'khong_doc' && hong.mau === 'do' && hong.sk === null && /KHÔNG|NOT/.test(hong.tom), hong.tom);
    ok(`[${nn}] Không đọc được thì không bao giờ xanh hay câu "đang chạy tốt"`,
       ![chua, hong].some(b => b.mau === 'xanh' || b.tom === cauTomTat({ soDo: 0, soVang: 0 }, nn)));
  }
});

// ===========================================================================
await nhom('11 · docSucKhoe: KHÔNG BAO GIỜ NÉM LỖI, KHÔNG BAO GIỜ ĐOÁN', async () => {
  const log = [];
  const goc = console.error;
  console.error = (...a) => log.push(a.join(' '));
  try {
    const goi = [];
    const client = tra => ({ rpc: async (...a) => { goi.push(a); return tra(); } });

    let kq = await docSucKhoe(client(() => ({ data: thoGoc(), error: null })));
    ok('Đọc được → ok, đúng số liệu', kq.ok === true && kq.tho.luc === LUC);
    ok('Gọi đúng suc_khoe_he_thong, không tham số', goi.length === 1 && goi[0][0] === 'suc_khoe_he_thong' && goi[0].length === 1,
       JSON.stringify(goi));

    kq = await docSucKhoe(client(() => ({ data: null, error: {
      code: 'PGRST202', message: 'Could not find the function public.suc_khoe_he_thong without parameters in the schema cache' } })));
    ok('PostgREST không có hàm (PGRST202) → chưa chạy migration', kq.ok === false && kq.chuaCoHam === true, JSON.stringify(kq));
    kq = await docSucKhoe(client(() => ({ data: null, error: { code: '42883', message: 'function suc_khoe_he_thong() does not exist' } })));
    ok('Postgres không có hàm (42883) → chưa chạy migration', kq.ok === false && kq.chuaCoHam === true, JSON.stringify(kq));
    ok('Thiếu hàm không phải lỗi vận hành → không ghi log', log.length === 0, log.join(' | '));

    kq = await docSucKhoe(client(() => ({ data: null, error: {
      code: '42883', message: 'function kho_ipos_trang_thai(uuid) does not exist' } })));
    ok('Hàm CON bị đổi / xóa (42883 nhắc tên hàm khác) → hỏng thật, không phải "chưa chạy migration"',
       kq.ok === false && kq.chuaCoHam === false && log.length === 1, JSON.stringify(kq));
    kq = await docSucKhoe(client(() => ({ data: null, error: {
      code: '42501', message: 'Chỉ chủ sở hữu hoặc quản lý mới xem được sức khỏe hệ thống' } })));
    ok('Bị từ chối quyền → không đọc được (không phải "chưa có hàm")', kq.ok === false && kq.chuaCoHam === false, JSON.stringify(kq));
    kq = await docSucKhoe(client(() => ({ data: null, error: { code: '', message: 'upstream request timeout' } })));
    ok('Supabase trả lỗi / hết giờ → không đọc được', kq.ok === false && kq.chuaCoHam === false);
    kq = await docSucKhoe(client(() => { throw new TypeError('fetch failed'); }));
    ok('fetch ném lỗi (mất mạng) → không đọc được, không ném tiếp', kq.ok === false && kq.chuaCoHam === false);
    kq = await docSucKhoe(client(() => ({ data: null, error: null })));
    ok('Không lỗi mà không có số liệu → không đọc được', kq.ok === false);
    kq = await docSucKhoe(client(() => ({ data: { luc: 'không phải ngày', zalo: {}, messenger: {}, dich: {}, chi_nhanh: [] }, error: null })));
    ok('Số liệu sai dạng → không đọc được (không đoán)', kq.ok === false);
    ok('Mỗi lần không đọc được đều ghi một dòng log [suc-khoe]', log.length === 6 && log.every(l => l.startsWith('[suc-khoe]')),
       log.join(' | '));
  } finally {
    console.error = goc;
  }

  ok('laThieuHam: đúng mã VÀ câu lỗi nhắc chính suc_khoe_he_thong',
     laThieuHam({ code: 'PGRST202', message: 'Could not find the function public.suc_khoe_he_thong without parameters' })
     && laThieuHam({ code: '42883', message: 'function suc_khoe_he_thong() does not exist' })
     && !laThieuHam({ code: '42883', message: 'function kho_ipos_trang_thai(uuid) does not exist' })
     && !laThieuHam({ code: 'PGRST202' }) && !laThieuHam({ code: '42501', message: 'suc_khoe_he_thong' })
     && !laThieuHam(null) && !laThieuHam({ code: 'PGRST301', message: 'JWT expired' }));
  ok('laSucKhoeTho: từ chối null, {}, mảng, thiếu chi_nhanh, luc không phải ngày',
     [null, {}, [], { ...thoGoc(), chi_nhanh: undefined }, { ...thoGoc(), luc: 'x' }, { ...thoGoc(), chi_nhanh: [{}] }]
       .every(v => !laSucKhoeTho(v)) && laSucKhoeTho(thoGoc()));
});

// ===========================================================================
await nhom('12 · Ô THIẾU (DATABASE KHÁC PHIÊN BẢN) → KHÔNG VỠ TRANG', async () => {
  let loi = null, sk = null;
  try {
    sk = danhGiaSucKhoe({ luc: LUC, zalo: {}, messenger: {}, dich: {}, chi_nhanh: [{ id: 'x', ma: 'q9', ten: 'Q9' }] }, 'vi');
  } catch (e) { loi = e.message; }
  ok('Thiếu mọi ô con → vẫn đánh giá được', loi === null && sk?.khoi?.[1]?.den?.length === 5, loi ?? '');
  ok('Thiếu ô thì coi là chưa bật / không có gì — không bịa ra đèn đỏ', sk?.soDo === 0, `${sk?.soDo}`);
});

// ===========================================================================
await nhom('13 · TIẾNG ANH KHÔNG LẪN CHỮ VIỆT', async () => {
  const kichBan = [
    thoGoc(),
    voi((t, c) => {
      Object.assign(t.zalo, ZALO_CHAY, { lan_chay_cuoi: truoc(45), che_do: 'thu', co_loi: true });
      Object.assign(t.messenger, MESS_CHAY, { loi_cuoi_luc: truoc(20), lan_nhan_cuoi: truoc(30), loi_7_ngay: 3 });
      Object.assign(t.dich, { cho: 4, loi: 2 });
      Object.assign(c.dat_ban, { form_mo: true, so_ban: 0, cho: 4, cho_qua_2_gio: 3, cho_qua_24_gio: 1, qua_gio_hen: 1 });
      Object.assign(c.tuyen_dung, { moi: 3, moi_qua_2_ngay: 2, moi_qua_7_ngay: 1 });
      Object.assign(c.tin_zalo, { cho_qua_han: 1, that_bai_24h: 1 });
      Object.assign(c.ipos, IPOS_CHAY, { cron_cuoi: truoc(50) });
      Object.assign(c.so_kho, { co_kho: true, lech: 1 });
    }),
    voi((t, c) => {
      Object.assign(t.zalo, ZALO_CHAY, { lan_chay_cuoi: null, bat_luc: truoc(40) });
      Object.assign(t.messenger, MESS_CHAY, { lan_nhan_cuoi: null, bat_luc: truoc(5 * 24 * 60) });
      Object.assign(c.ipos, IPOS_CHAY, { den: 'vang', cho_xu_ly: 1 });
    }),
    voi((t, c) => { Object.assign(t.zalo, ZALO_CHAY); Object.assign(t.messenger, MESS_CHAY); Object.assign(c.ipos, IPOS_CHAY, { den: 'do', mat_ket_noi: true, loi_tu_luc: truoc(90) }); }),
    voi((t, c) => { Object.assign(c.ipos, IPOS_CHAY, { den: 'do', mat_ket_noi: true }); c.dat_ban.cho = 2; c.tuyen_dung.moi = 1; }),
    voi((t, c) => { Object.assign(c.ipos, IPOS_CHAY, { cau_hinh_du: false }); Object.assign(t.messenger, MESS_CHAY, { lan_nhan_cuoi: truoc(4 * 24 * 60) }); }),
    voi(t => { t.sao_luu = { ...SAO_LUU_RONG }; }),
    voi(t => { t.sao_luu = { ...SAO_LUU_RONG, lan_cuoi: truoc(60), lan_cuoi_ok: false, lan_cuoi_thu: 'chua_thu' }; }),
    voi(t => { t.sao_luu = { ...SAO_LUU_RONG, lan_cuoi: truoc(60), lan_cuoi_ok: true, lan_cuoi_thu: 'hong' }; }),
    voi(t => { Object.assign(t.sao_luu, { dung_duoc_cuoi: truoc(3 * 24 * 60), lan_cuoi: truoc(3 * 24 * 60) }); }),
    voi(t => { Object.assign(t.sao_luu, { lan_cuoi: truoc(60), lan_cuoi_ok: false, lan_cuoi_thu: 'chua_thu' }); }),
    voi(t => { Object.assign(t.sao_luu, { lan_cuoi: truoc(60), lan_cuoi_ok: true, lan_cuoi_thu: 'hong' }); }),
    voi(t => { delete t.sao_luu; }),
    voi(t => { t.sao_luu = null; }),
  ];
  const sot = [];
  let soCau = 0;
  for (const tho of kichBan) {
    const sk = danhGiaSucKhoe(tho, 'en', true);
    for (const k of sk.khoi) {
      if (k.ma === 'thuong_hieu' && VIET.test(k.ten)) sot.push(k.ten);
      for (const d of k.den) { soCau++; for (const c of [d.ten, d.cau]) if (VIET.test(c)) sot.push(c); }
    }
    const vi = danhGiaSucKhoe(tho, 'vi', true).khoi.flatMap(k => k.den).map(d => d.cau);
    const en = sk.khoi.flatMap(k => k.den).map(d => d.cau);
    if (vi.some((c, i) => c === en[i] && VIET.test(c))) sot.push('vi = en');
  }
  for (const kq of [{ ok: false, chuaCoHam: true }, { ok: false, chuaCoHam: false }]) {
    const b = bangSucKhoe(kq, 'en');
    if (VIET.test(b.tom)) sot.push(b.tom);
  }
  ok(`${soCau} câu đèn tiếng Anh không lẫn chữ Việt`, soCau >= 40 && sot.length === 0, sot.slice(0, 3).join(' | '));
  ok('Khoảng thời gian: phút / giờ / ngày, tiếng Anh có số nhiều',
     khoangThoiGian(45).en === '45 min' && khoangThoiGian(60).en === '1 hour' && khoangThoiGian(150).en === '3 hours'
     && khoangThoiGian(4 * 24 * 60).vi === '4 ngày' && tuTruoc(T, T + 5000).vi === 'vừa xong');
});

// ===========================================================================
await nhom('14 · TRANG TỔNG QUAN', async () => {
  const trang = readFileSync(join(WEB, 'pages', 'noi-bo', 'index.astro'), 'utf8');
  const comp = readFileSync(join(WEB, 'components', 'SucKhoeHeThong.astro'), 'utf8');
  const lib = readFileSync(join(WEB, 'lib', 'suc-khoe.ts'), 'utf8');
  ok('Chỉ chủ và quản lý mới gọi suc_khoe_he_thong (vai khác không tốn một lượt gọi bị từ chối)',
     /const xemSucKhoe = \['chu_so_huu', 'quan_ly'\]\.includes\(nhanSu\.vai_tro\)/.test(trang)
     && /xemSucKhoe \? docSucKhoeVaSaoLuu\(client\) : Promise\.resolve\(null\)/.test(trang));
  ok('Trang vẽ bảng khi có kết quả đọc — kể cả khi đọc hỏng (bảng tự nói là không đọc được)',
     /\{sucKhoe && <SucKhoeHeThong ketQua=\{sucKhoe\}/.test(trang));
  ok('Component lấy câu tóm tắt từ bangSucKhoe — không tự viết "đang chạy tốt"',
     /bangSucKhoe\(ketQua, nn, laChu\)/.test(comp) && !/chạy tốt|running well/.test(boChuThich(comp)));
  ok('Component không có <script> (chỉ vẽ)', !/<script/i.test(comp));
  ok('Gọi RPC bằng tên trong nháy đơn (test-hop-dong-web đọc được)', /\.rpc\('suc_khoe_he_thong'\)/.test(lib)
     && /\.rpc\('suc_khoe_sao_luu'\)/.test(lib));
  const mig = readFileSync(join(GOC, 'crm', 'supabase', 'migrations', '0055_suc_khoe_he_thong.sql'), 'utf8');
  const choQuaHan = mig.slice(mig.indexOf("'cho_qua_han'"), mig.indexOf('from nhat_ky_tin'));
  ok(`Câu "tin kẹt quá ${PHUT_TIN_KET} phút" khớp đúng ngưỡng đếm trong SQL của 0055`,
     choQuaHan.includes(`interval '${PHUT_TIN_KET} minutes'`), choQuaHan.slice(0, 200));
});

// ===========================================================================
// CLAUDE.md mục gio-vn: thử 23:50 và 00:10 giờ VN. Mọi phép "bao lâu trước" tính theo luc của
// database — đồng hồ máy chạy Worker (lệch, hay qua nửa đêm) không được đổi một chữ nào.
await nhom('15 · ĐỒNG HỒ MÁY KHÔNG ẢNH HƯỞNG (23:50 và 00:10 giờ VN)', async () => {
  const tho = voi((t, c) => {
    Object.assign(t.zalo, ZALO_CHAY, { lan_chay_cuoi: truoc(45) });
    Object.assign(t.messenger, MESS_CHAY, { loi_cuoi_luc: truoc(20), lan_nhan_cuoi: truoc(30) });
    Object.assign(c.ipos, IPOS_CHAY);
  });
  const chup = () => JSON.stringify(bangSucKhoe({ ok: true, tho }, 'vi', true));
  const that = chup();
  const ketQua = [];
  try {
    for (const gio of ['2026-09-29T16:50:00Z', '2026-09-29T17:10:00Z', '2031-01-01T00:00:00Z']) {
      datGio(gio);
      ketQua.push(chup());
    }
  } finally { traGio(); }
  ok('Đồng hồ máy ở 23:50, 00:10 giờ VN hay lệch hẳn năm năm → cùng một bảng', ketQua.every(k => k === that));
  const luc2350 = danhGiaSucKhoe({ ...tho, luc: '2026-09-29T16:50:00Z' }, 'vi');
  const luc0010 = danhGiaSucKhoe({ ...tho, luc: '2026-09-29T17:10:00Z' }, 'vi');
  ok('Giờ số liệu lấy từ database: 16:50 UTC → 23:50, 17:10 UTC → 00:10 hôm sau', luc2350.gio === '23:50' && luc0010.gio === '00:10',
     `${luc2350.gio} / ${luc0010.gio}`);
});

// ===========================================================================
// 0058 · Sao lưu hằng đêm. "Dùng được" = sao lưu xong VÀ khôi phục thử đạt. Không có "xám": chưa có bản
// dùng được nào là dữ liệu đang không có bản sao.
await nhom('16 · SAO LƯU DỮ LIỆU', async () => {
  const sl = sua => den(voi(t => sua(t.sao_luu, t)), 'sao_luu');
  const moi = gan => den(voi(t => { t.sao_luu = { ...SAO_LUU_RONG, ...gan }; }), 'sao_luu');
  const tot = den(thoGoc(), 'sao_luu');
  ok('Đêm qua sao lưu và khôi phục thử đạt → xanh, nói bao lâu trước và cỡ kiểu Việt (85,3 MB)', tot?.mau === 'xanh'
     && tot.cau === 'Sao lưu hằng đêm bình thường — bản gần nhất 10 giờ trước (85,3 MB), đã khôi phục thử đủ dữ liệu.', tom(tot));
  const totEn = den(thoGoc(), 'sao_luu', 'en');
  ok('Tiếng Anh: "85.3 MB", "10 hours ago"', totEn?.cau === 'Nightly backup works — latest copy 10 hours ago (85.3 MB), test restore complete.',
     tom(totEn));
  const lon = sl(s => { s.kich_thuoc = 1294467072; });
  ok('Bản lớn: dấu chấm hàng nghìn kiểu Việt "1.234,5 MB", tiếng Anh "1,234.5 MB"',
     /\(1\.234,5 MB\)/.test(lon?.cau) && /\(1,234\.5 MB\)/.test(den(voi(t => { t.sao_luu.kich_thuoc = 1294467072; }), 'sao_luu', 'en')?.cau), tom(lon));
  ok('Nằm trong khối "Toàn thương hiệu", đứng đầu', danhGiaSucKhoe(thoGoc(), 'vi').khoi[0].den[0].ma === 'sao_luu');

  const chuaCo = moi({});
  ok('Chưa có lượt nào (chưa thêm bí mật cho GitHub) → ĐỎ, nói tên hai bí mật cần thêm', chuaCo?.mau === 'do'
     && /^Chưa có bản sao lưu nào — dữ liệu đang không có bản sao/.test(chuaCo.cau) && /SAO_LUU_DB_URL/.test(chuaCo.cau)
     && /SAO_LUU_MAT_KHAU/.test(chuaCo.cau), tom(chuaCo));
  const toanHong = moi({ lan_cuoi: truoc(90), lan_cuoi_ok: false, lan_cuoi_thu: 'chua_thu' });
  ok('Chưa có bản dùng được, lượt gần nhất hỏng → đỏ, "lượt gần nhất (2 giờ trước) bị lỗi"', toanHong?.mau === 'do'
     && /^Chưa có bản sao lưu nào dùng được — lượt gần nhất \(2 giờ trước\) bị lỗi/.test(toanHong.cau), tom(toanHong));
  const khongKhoiPhuc = moi({ lan_cuoi: truoc(90), lan_cuoi_ok: true, lan_cuoi_thu: 'hong' });
  ok('Sao lưu được nhưng chưa bản nào khôi phục thử đạt → ĐỎ (bản không khôi phục được coi như không có); câu không nói "bị lỗi"',
     khongKhoiPhuc?.mau === 'do' && /^Chưa có bản sao lưu nào được xác nhận khôi phục được \(bản gần nhất: 2 giờ trước\)/.test(khongKhoiPhuc.cau)
     && !/bị lỗi/.test(khongKhoiPhuc.cau), tom(khongKhoiPhuc));

  const vuaDu = sl(s => Object.assign(s, { dung_duoc_cuoi: truoc(GIO_SAO_LUU * 60 - 1), lan_cuoi: truoc(GIO_SAO_LUU * 60 - 1) }));
  const qua = sl(s => Object.assign(s, { dung_duoc_cuoi: truoc(GIO_SAO_LUU * 60 + 1), lan_cuoi: truoc(GIO_SAO_LUU * 60 + 1) }));
  ok(`Ngưỡng ${GIO_SAO_LUU} giờ: chưa quá → xanh; quá một phút → đỏ`,
     vuaDu?.mau === 'xanh' && qua?.mau === 'do' && /^Bản sao lưu dùng được gần nhất đã 36 giờ trước/.test(qua.cau), `${tom(vuaDu)} | ${tom(qua)}`);
  ok('Các lượt sau đều sao lưu được nhưng KHÔNG khôi phục thử được → vẫn đỏ theo bản dùng được gần nhất (không "làm mới" đèn)',
     sl(s => Object.assign(s, { dung_duoc_cuoi: truoc(3 * 24 * 60), lan_cuoi: truoc(30), lan_cuoi_ok: true, lan_cuoi_thu: 'hong' }))?.mau === 'do');
  ok('Các lượt sau đều hỏng → vẫn đỏ theo bản dùng được gần nhất',
     sl(s => Object.assign(s, { dung_duoc_cuoi: truoc(3 * 24 * 60), lan_cuoi: truoc(30), lan_cuoi_ok: false, lan_cuoi_thu: 'chua_thu' }))?.mau === 'do');

  const motLuotHong = sl(s => Object.assign(s, { lan_cuoi: truoc(30), lan_cuoi_ok: false, lan_cuoi_thu: 'chua_thu' }));
  ok('Lượt gần nhất hỏng, còn bản dùng được trong 36 giờ → vàng, nói cả hai mốc', motLuotHong?.mau === 'vang'
     && motLuotHong.cau === 'Lượt sao lưu gần nhất (30 phút trước) bị lỗi — bản dùng được gần nhất: 10 giờ trước', tom(motLuotHong));
  const thuHong = sl(s => Object.assign(s, { lan_cuoi: truoc(30), lan_cuoi_ok: true, lan_cuoi_thu: 'hong' }));
  ok('Lượt gần nhất sao lưu được nhưng khôi phục thử hỏng → vàng, nói đúng là khôi phục thử (không nói "bị lỗi")', thuHong?.mau === 'vang'
     && thuHong.cau === 'Bản sao lưu gần nhất (30 phút trước) không khôi phục thử được — bản dùng được gần nhất: 10 giờ trước', tom(thuHong));

  const thieu = den(voi(t => { delete t.sao_luu; }), 'sao_luu');
  ok('Database chưa chạy 0058 (không có hàm) → vàng, nói rõ migration 0058 — không đỏ nhầm, không xanh',
     thieu?.mau === 'vang' && /migration 0058/.test(thieu.cau), tom(thieu));
  const khongDoc = den(voi(t => { t.sao_luu = null; }), 'sao_luu');
  ok('Không đọc được số liệu sao lưu → vàng, nói rõ KHÔNG có nghĩa là ổn', khongDoc?.mau === 'vang'
     && /KHÔNG có nghĩa là sao lưu đang ổn/.test(khongDoc.cau), tom(khongDoc));
  ok('Mốc giờ hỏng (chuỗi lạ) → coi như chưa có bản dùng được: đỏ, không xanh',
     sl(s => { s.dung_duoc_cuoi = 'không phải giờ'; })?.mau === 'do');
  ok('Không mở màn nào trong /noi-bo (việc của người quản trị kỹ thuật)', tot?.di === null && chuaCo?.di === null);
});

// ===========================================================================
await nhom('17 · docSaoLuu / docSucKhoeVaSaoLuu: KHÔNG BAO GIỜ NÉM LỖI, KHÔNG BAO GIỜ ĐOÁN', async () => {
  const log = [];
  const goc = console.error;
  console.error = (...a) => log.push(a.join(' '));
  try {
    const goi = [];
    const client = tra => ({ rpc: async (ten, ...a) => { goi.push([ten, ...a]); return tra(ten); } });
    let sl = await docSaoLuu(client(() => ({ data: { ...SAO_LUU_TOT }, error: null })));
    ok('Đọc được → đúng số liệu; gọi suc_khoe_sao_luu không tham số', sl?.lan_cuoi_thu === 'dat'
       && goi.length === 1 && goi[0][0] === 'suc_khoe_sao_luu' && goi[0].length === 1, JSON.stringify(goi));
    sl = await docSaoLuu(client(() => ({ data: null, error: { code: 'PGRST202', message: 'Could not find the function public.suc_khoe_sao_luu without parameters' } })));
    ok('Chưa có hàm (database chưa chạy 0058) → undefined, không ghi log', sl === undefined && log.length === 0, JSON.stringify(sl));
    sl = await docSaoLuu(client(() => ({ data: null, error: { code: '42883', message: 'function suc_khoe_he_thong() does not exist' } })));
    ok('Lỗi nhắc hàm KHÁC → không phải "chưa chạy 0058": null, có log', sl === null && log.length === 1);
    sl = await docSaoLuu(client(() => ({ data: null, error: { code: '42501', message: 'Chỉ chủ sở hữu hoặc quản lý mới xem được sức khỏe hệ thống' } })));
    ok('Bị từ chối quyền → null', sl === null);
    sl = await docSaoLuu(client(() => { throw new TypeError('fetch failed'); }));
    ok('fetch ném lỗi (mất mạng) → null, không ném tiếp', sl === null);
    sl = await docSaoLuu(client(() => ({ data: [1, 2], error: null })));
    ok('Dạng lạ (mảng) → null', sl === null);
    ok('Mỗi lần không đọc được đều ghi một dòng log [suc-khoe]', log.length === 4 && log.every(l => l.startsWith('[suc-khoe]')), log.join(' | '));

    const hai = tra => ({ rpc: async ten => tra(ten) });
    let kq = await docSucKhoeVaSaoLuu(hai(ten => ten === 'suc_khoe_he_thong'
      ? { data: (() => { const t = thoGoc(); delete t.sao_luu; return t; })(), error: null } : { data: { ...SAO_LUU_TOT }, error: null }));
    ok('Gộp: số liệu sao lưu gắn vào tho.sao_luu, đèn xanh', kq.ok && kq.tho.sao_luu?.lan_cuoi_thu === 'dat'
       && danhGiaSucKhoe(kq.tho, 'vi').khoi[0].den[0].mau === 'xanh', JSON.stringify(kq.ok && kq.tho.sao_luu));
    kq = await docSucKhoeVaSaoLuu(hai(ten => ten === 'suc_khoe_he_thong'
      ? { data: thoGoc(), error: null } : { data: null, error: { code: '', message: 'upstream request timeout' } }));
    ok('Sao lưu không đọc được mà bảng chính đọc được → bảng vẫn hiện, đèn sao lưu vàng "không đọc được"', kq.ok && kq.tho.sao_luu === null
       && danhGiaSucKhoe(kq.tho, 'vi').khoi[0].den[0].mau === 'vang');
    kq = await docSucKhoeVaSaoLuu(hai(ten => ten === 'suc_khoe_he_thong'
      ? { data: null, error: { code: '', message: 'boom' } } : { data: { ...SAO_LUU_TOT }, error: null }));
    ok('Bảng chính không đọc được → cả bảng "không đọc được" (sao lưu tốt không làm bảng xanh)', kq.ok === false && kq.chuaCoHam === false);
  } finally {
    console.error = goc;
  }
  ok('laThieuHam nhận tên hàm: suc_khoe_sao_luu', laThieuHam({ code: 'PGRST202', message: 'public.suc_khoe_sao_luu' }, 'suc_khoe_sao_luu')
     && !laThieuHam({ code: 'PGRST202', message: 'public.suc_khoe_sao_luu' })
     && !laThieuHam({ code: 'PGRST202', message: 'public.suc_khoe_he_thong' }, 'suc_khoe_sao_luu'));
});

process.exit(ketThuc('SỨC KHỎE HỆ THỐNG PHÍA WEB'));
