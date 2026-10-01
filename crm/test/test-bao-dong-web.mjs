/**
 * BEEFTOWN — BÁO ĐỘNG, PHÍA WEB (luật báo, câu chữ, hợp đồng kênh, việc chạy nền)
 * ============================================================================
 *
 *     node test/test-bao-dong-web.mjs
 *
 * web/src/lib/bao-dong-chinh-sach.ts quyết lượt nào báo gì, đóng gì — thuần, mọi mốc giờ tính
 * theo `luc` của database, nên ở đây thử từng phút giờ Việt Nam (21:59 / 22:00, 06:59 / 07:00,
 * 07:59 / 08:00, 23:50 / 00:10) bằng số liệu giả. bao-dong-tin.ts soạn một tin mỗi lượt;
 * bao-dong-kenh.ts là hợp đồng của kênh (chưa chọn kênh nào). Phần database: test-bao-dong.mjs.
 *
 * Nhóm 13 trở đi chạy ĐẦU–CUỐI: baoDongTatCa (bao-dong.ts) trên database thật (PGlite) với
 * client Supabase giả (rpc chạy thật dưới danh nghĩa máy may_bao_dong) và kênh giả — nối kênh,
 * mới đỏ, hết đỏ, gửi hỏng, đánh dấu hỏng, mất mạng, số liệu hỏng, khóa, cron riêng.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem, dungDatabase, UID } from './kho-chung.mjs';
import { datGio, traGio } from './dong-ho-gia.mjs';
import { VIET } from './quet-chu-viet.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web', 'src');
const CS = await import(join(WEB, 'lib', 'bao-dong-chinh-sach.ts'));
const { lapKeHoach, NHOM, nhomCua, laBanDem, dauChuKy, dauDem, gioVn,
        PHUT_XAC_NHAN, PHUT_CHO_HET_DO, TIN_TOI_DA_MOI_DEN, GIO_TOM_TAT, GIO_TOM_TAT_BU_DEN, GIO_DEM_TU, GIO_DEM_DEN } = CS;
const { soanTin } = await import(join(WEB, 'lib', 'bao-dong-tin.ts'));
const { KENH_KHONG, chonKenhBaoDong } = await import(join(WEB, 'lib', 'bao-dong-kenh.ts'));
const { danhGiaSucKhoe } = await import(join(WEB, 'lib', 'suc-khoe.ts'));
const { CAM } = await import(join(WEB, 'lib', 'chuoi-cam.js'));

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — BÁO ĐỘNG, PHÍA WEB');

// ---------------------------------------------------------------------------
// Dữ liệu giả
// ---------------------------------------------------------------------------
/** Mốc giờ Việt Nam "HH:MM" của một ngày → ISO UTC (như now() database trả). */
const vn = (hhmm, ngay = '2026-09-29') => new Date(`${ngay}T${hhmm}:00+07:00`).toISOString();
const truoc = (luc, phut) => new Date(Date.parse(luc) - phut * 60000).toISOString();
const CN1 = '11111111-1111-4111-8111-111111111111';
const CN7 = '77777777-7777-4777-8777-777777777777';
let soId = 0;
/** Một sự cố đang mở, đúng dạng bao_dong_ghi_luot trả. */
function sc(o) {
  const ma = o.ma ?? 'zalo', cn = o.cn ?? null;
  return {
    id: o.id ?? `00000000-0000-4000-8000-${String(++soId).padStart(12, '0')}`,
    khoa: cn ? `${ma}:${cn}` : ma, ma_den: ma, chi_nhanh_id: cn,
    bat_dau_luc: o.bat_dau_luc, het_do_tu: o.het_do_tu ?? null, mau_sau: o.mau_sau ?? (o.het_do_tu ? 'xanh' : null),
    bao_mo_luc: o.bao_mo_luc ?? null, bao_mo_kenh: o.bao_mo_luc ? 'telegram' : null, bao_het_luc: o.bao_het_luc ?? null,
  };
}
/** Kế hoạch ở mốc luc. Mặc định: có kênh, vừa tóm tắt, kênh nối từ lâu — để thử từng luật riêng. */
const kh = (luc, suCo, o = {}) => lapKeHoach({
  luc, kenh: o.kenh ?? 'telegram', kenhTuLuc: o.kenhTuLuc === undefined ? '2026-01-01T00:00:00Z' : o.kenhTuLuc,
  tomTatLuc: o.tomTatLuc === undefined ? luc : o.tomTatLuc, suCo, daBao48Gio: o.daBao48Gio ?? [], mu: o.mu ?? false,
});
const ids = ds => ds.map(x => x.id ?? x).join();
/** Đỏ đã đủ lâu để báo, lúc luc. */
const doLau = (luc, o = {}) => sc({ ...o, bat_dau_luc: truoc(luc, 10) });

/** Số liệu bảng sức khỏe giả (dạng suc_khoe_he_thong) — chi nhánh tên KHÔNG dấu để soi tiếng Anh. */
function thoGia(luc) {
  const t = p => truoc(luc, p);
  const cn = (id, ma, ten) => ({
    id, ma, ten,
    ipos: { co_cau_hinh: true, bat: true, cau_hinh_du: true, den: 'xanh', mat_ket_noi: false, loi_tu_luc: null, nhan_hd_luc: t(12),
            gio_mat_ket_noi: 3, dang_tru_kho: true, cho_xu_ly: 0, dong_loi: 0, bat_luc: t(3 * 24 * 60), cron_cuoi: t(4) },
    tin_zalo: { that_bai_24h: 0, cho_qua_han: 0 },
    dat_ban: { form_mo: true, so_ban: 10, cho: 0, cho_qua_2_gio: 0, cho_qua_24_gio: 0, qua_gio_hen: 0 },
    tuyen_dung: { moi: 0, moi_qua_2_ngay: 0, moi_qua_7_ngay: 0 },
    so_kho: { co_kho: true, lech: 0 },
  });
  return {
    luc,
    zalo: { dang_bat: true, che_do: 'that', bat_luc: t(3 * 24 * 60), lan_chay_cuoi: t(3), co_loi: false },
    messenger: { dang_bat: true, bat_luc: t(30 * 24 * 60), lan_nhan_cuoi: t(10), loi_cuoi_luc: null, loi_7_ngay: 0 },
    dich: { cho: 0, loi: 0 },
    bao_dong: { lan_chay_cuoi: t(5), kenh: 'telegram', co_loi: false, lan_gui_cuoi: t(60) },
    sao_luu: { lan_cuoi: t(10 * 60), lan_cuoi_ok: true, lan_cuoi_thu: 'dat', dung_duoc_cuoi: t(10 * 60), kich_thuoc: 1048576 },
    chi_nhanh: [cn(CN1, 'q1', 'Beeftown Q1'), cn(CN7, 'q7', 'Beeftown Q7')],
  };
}

// ===========================================================================
await nhom('1 · MỖI ĐÈN CÓ NHÓM: HỆ THỐNG BÁO CẢ ĐÊM, KHÁCH ĐỢI 07:00', async () => {
  const sk = danhGiaSucKhoe(thoGia(vn('12:00')), 'vi', true);
  const maDen = [...new Set(sk.khoi.flatMap(k => k.den.map(d => d.ma)))].sort();
  const coNhom = Object.keys(NHOM).filter(m => m !== 'doc_so_lieu').sort();
  ok('NHOM có đúng mọi đèn của bảng sức khỏe (+ đèn giả doc_so_lieu) — đèn mới phải xếp nhóm',
     JSON.stringify(maDen) === JSON.stringify(coNhom) && NHOM.doc_so_lieu === 'he_thong', `${maDen.join()} | ${coNhom.join()}`);
  ok('Nhóm khách đúng ba đèn: đặt bàn, hồ sơ, tin Zalo kẹt',
     Object.keys(NHOM).filter(m => NHOM[m] === 'khach').sort().join() === 'dat_ban,tin_zalo,tuyen_dung');
  ok('Messenger thuộc nhóm hệ thống (tin khách lỗi lúc 02:00 vẫn báo ngay)', NHOM.messenger === 'he_thong');
  ok('Mã đèn lạ (database mới hơn web) coi là hệ thống — thà báo đêm còn hơn im', nhomCua('den_moi') === 'he_thong');
  const kieu = readFileSync(join(WEB, 'lib', 'bao-dong-chinh-sach.ts'), 'utf8');
  ok('NHOM có kiểu Record<MaDenBaoDong, …>: thiếu đèn thì astro check báo lỗi',
     /export const NHOM: Readonly<Record<MaDenBaoDong, NhomDen>>/.test(kieu) && /type MaDenBaoDong = MaDen \| 'doc_so_lieu'/.test(kieu));
});

// ===========================================================================
await nhom('2 · ĐỎ HAI LƯỢT MỚI BÁO', async () => {
  const luc = vn('14:00');
  for (const [phut, bao] of [[PHUT_XAC_NHAN - 1, false], [PHUT_XAC_NHAN, true], [5, true]]) {
    const s = sc({ bat_dau_luc: truoc(luc, phut) });
    const k = kh(luc, [s]);
    ok(`Đỏ ${phut} phút → ${bao ? 'báo' : 'chưa báo (đỏ một lượt rồi tự hết thì im)'}`,
       (k.moiDo.length === 1) === bao && k.coTin === bao, ids(k.moiDo));
  }
  const daBao = sc({ bat_dau_luc: truoc(luc, 30), bao_mo_luc: truoc(luc, 25) });
  ok('Đã báo rồi → lượt sau không báo lại', kh(luc, [daBao]).moiDo.length === 0);
  ok(`PHUT_XAC_NHAN (${PHUT_XAC_NHAN}) < 5 phút của cron: lượt thứ hai luôn đủ, dù lệch vài giây`, PHUT_XAC_NHAN < 5 && PHUT_XAC_NHAN > 0);
  const hai = kh(luc, [doLau(luc, { ma: 'zalo' }), doLau(luc, { ma: 'so_kho', cn: CN1 }), doLau(luc, { ma: 'ipos', cn: CN7 })]);
  ok('Nhiều đèn đỏ cùng lượt → cùng một kế hoạch (một tin)', hai.moiDo.length === 3 && hai.danhDauMo.length === 3);
});

// ===========================================================================
await nhom('3 · BAN ĐÊM THEO GIỜ VIỆT NAM (21:59 / 22:00, 06:59 / 07:00)', async () => {
  ok(`Ban đêm ${GIO_DEM_TU}:00–${GIO_DEM_DEN}:00 giờ VN`, !laBanDem(Date.parse(vn('21:59'))) && laBanDem(Date.parse(vn('22:00')))
     && laBanDem(Date.parse(vn('06:59'))) && !laBanDem(Date.parse(vn('07:00'))));
  ok('Giờ VN tính từ mốc UTC (00:30 VN là 17:30 UTC hôm trước)', gioVn(Date.parse('2026-09-28T17:30:00Z')) === 0);
  const khach = luc => kh(luc, [doLau(luc, { ma: 'dat_ban', cn: CN1 })]);
  ok('Đèn khách 21:59 → báo ngay', khach(vn('21:59')).moiDo.length === 1);
  ok('Đèn khách 22:00 → giữ lại', khach(vn('22:00')).moiDo.length === 0 && !khach(vn('22:00')).coTin);
  ok('Đèn khách 06:59 → vẫn giữ', khach(vn('06:59')).moiDo.length === 0);
  ok('Đèn khách 07:00 → báo (lượt đầu sau 07:00 gửi gộp)', khach(vn('07:00')).moiDo.length === 1);
  for (const ma of ['zalo', 'messenger', 'ipos', 'so_kho', 'dich', 'doc_so_lieu']) {
    const luc = vn('02:00');
    const k = kh(luc, [doLau(luc, { ma, cn: ['ipos', 'so_kho'].includes(ma) ? CN1 : null })]);
    ok(`Đèn hệ thống ${ma} lúc 02:00 → báo ngay`, k.moiDo.length === 1);
  }
  const luc = vn('23:30');
  const gop = kh(vn('07:00', '2026-09-30'), [
    sc({ ma: 'dat_ban', cn: CN1, bat_dau_luc: luc }), sc({ ma: 'tuyen_dung', cn: CN7, bat_dau_luc: truoc(luc, 60) }),
    sc({ ma: 'tin_zalo', cn: CN1, bat_dau_luc: vn('03:00', '2026-09-30') }),
  ]);
  ok('07:00: mọi mục khách còn đỏ từ đêm vào CÙNG một tin, cũ trước',
     gop.moiDo.length === 3 && gop.moiDo[0].ma_den === 'tuyen_dung' && gop.moiDo[2].ma_den === 'tin_zalo', gop.moiDo.map(x => x.ma_den).join());
});

// ===========================================================================
await nhom('4 · HẾT ĐỎ: CHỜ 15 PHÚT, CÂU THEO MÀU MỚI, ĐÊM ĐỢI 07:00', async () => {
  const luc = vn('15:00');
  const cho = (phut, o = {}) => sc({ ma: 'zalo', bat_dau_luc: truoc(luc, 120), het_do_tu: truoc(luc, phut), bao_mo_luc: truoc(luc, 110), ...o });
  let k = kh(luc, [cho(PHUT_CHO_HET_DO - 1)]);
  ok(`Hết đỏ ${PHUT_CHO_HET_DO - 1} phút → chưa đóng, chưa báo`, k.hetDo.length === 0 && k.dongIm.length === 0);
  const s15 = cho(PHUT_CHO_HET_DO);
  k = kh(luc, [s15]);
  ok(`Hết đỏ ${PHUT_CHO_HET_DO} phút, đã báo → báo hết đỏ (đóng sau khi gửi được)`, ids(k.hetDo) === s15.id && k.dongIm.length === 0 && k.coTin);
  const chuaBao = cho(20, { bao_mo_luc: null });
  k = kh(luc, [chuaBao]);
  ok('Chưa từng báo → đóng im lặng', ids(k.dongIm) === chuaBao.id && k.hetDo.length === 0 && !k.coTin);
  const mat = cho(20, { mau_sau: 'mat' });
  ok('Đèn không còn (chi nhánh ngừng hoạt động) → đóng im lặng dù đã báo', ids(kh(luc, [mat]).dongIm) === mat.id);
  const daBaoHet = cho(20, { bao_het_luc: truoc(luc, 3) });
  ok('Đã báo hết đỏ mà chưa đóng được (lượt trước hỏng giữa chừng) → đóng im lặng, không báo lần hai',
     ids(kh(luc, [daBaoHet]).dongIm) === daBaoHet.id && kh(luc, [daBaoHet]).hetDo.length === 0);
  const dem = vn('23:00');
  const khachDem = sc({ ma: 'dat_ban', cn: CN1, bat_dau_luc: vn('19:00'), het_do_tu: vn('22:30'), bao_mo_luc: vn('19:05') });
  k = kh(dem, [khachDem]);
  ok('Đèn khách hết đỏ lúc 23:00 → giữ mở, chưa báo (không đánh thức ai vì tin tốt)', k.hetDo.length === 0 && k.dongIm.length === 0);
  k = kh(vn('07:00', '2026-09-30'), [khachDem]);
  ok('…07:00 → báo hết đỏ', ids(k.hetDo) === khachDem.id);
  // Hết đỏ ban đêm của đèn HỆ THỐNG (chủ chọn 30/09/2026): chỉ báo ngay khi tin báo ĐỎ của chính sự cố
  // đó cũng đến trong đêm nay — người nhận đã biết, có thể đang xử lý. Tin đỏ đã đến từ trước 22:00
  // thì tin tốt đợi 07:00 như đèn khách: đèn Sao lưu đỏ từ chiều, ổn lại lúc 3 giờ sáng, không đánh thức ai.
  const giu = k => k.hetDo.length === 0 && k.dongIm.length === 0;
  const heThongTuToi = sc({ ma: 'ipos', cn: CN1, bat_dau_luc: vn('21:00'), het_do_tu: vn('22:30'), bao_mo_luc: vn('21:05') });
  ok('Đèn hệ thống: tin đỏ 21:05 (trước 22:00), hết đỏ 22:30 → 23:00 giữ mở, chưa báo', giu(kh(dem, [heThongTuToi])));
  ok('…07:00 → báo hết đỏ', ids(kh(vn('07:00', '2026-09-30'), [heThongTuToi]).hetDo) === heThongTuToi.id);
  const heThongDem = sc({ ma: 'ipos', cn: CN1, bat_dau_luc: vn('22:00'), het_do_tu: vn('22:30'), bao_mo_luc: vn('22:05') });
  ok('Đèn hệ thống: tin đỏ 22:05 (trong đêm) → 23:00 báo hết đỏ ngay (người nhận đã biết)',
     ids(kh(dem, [heThongDem]).hetDo) === heThongDem.id);
  const saoLuu = sc({ ma: 'sao_luu', bat_dau_luc: vn('14:00'), het_do_tu: vn('02:45', '2026-09-30'), bao_mo_luc: vn('14:05') });
  ok('Sao lưu: tin đỏ 14:05, bản đêm sau dùng được 02:45 → 03:00 giữ mở, không đánh thức ai',
     giu(kh(vn('03:00', '2026-09-30'), [saoLuu])));
  ok('…06:59 → vẫn giữ', giu(kh(vn('06:59', '2026-09-30'), [saoLuu])));
  ok('…07:00 → báo "đã ổn lại"', ids(kh(vn('07:00', '2026-09-30'), [saoLuu]).hetDo) === saoLuu.id);
  // Sự cố có tin đỏ lúc `bao` (giờ VN, ngày 29/09 nếu không ghi), hết đỏ 20 phút trước mốc xét `luc`.
  const daBaoLuc = (bao, luc, ngayBao = '2026-09-29') =>
    sc({ ma: 'zalo', bat_dau_luc: truoc(vn(bao, ngayBao), 5), het_do_tu: truoc(luc, 20), bao_mo_luc: vn(bao, ngayBao) });
  const s2200 = daBaoLuc('22:00', vn('22:30'));
  ok('Tin đỏ đúng 22:00 → tính là trong đêm: 22:30 báo hết đỏ ngay', ids(kh(vn('22:30'), [s2200]).hetDo) === s2200.id);
  ok('Tin đỏ 21:59 → 22:30 giữ tới 07:00', giu(kh(vn('22:30'), [daBaoLuc('21:59', vn('22:30'))])));
  const quaNuaDem = daBaoLuc('23:50', vn('00:30', '2026-09-30'));
  ok('Tin đỏ 23:50, hết đỏ 00:10 → 00:30 báo ngay (cùng một đêm, qua nửa đêm)',
     ids(kh(vn('00:30', '2026-09-30'), [quaNuaDem]).hetDo) === quaNuaDem.id);
  ok('Tin đỏ 01:00 đêm TRƯỚC (đỏ suốt ngày), hết đỏ 23:10 đêm nay → 23:30 giữ tới 07:00',
     giu(kh(vn('23:30'), [daBaoLuc('01:00', vn('23:30'))])));
  const khachTinDem = sc({ ma: 'dat_ban', cn: CN1, bat_dau_luc: vn('22:10'), het_do_tu: vn('22:30'), bao_mo_luc: vn('22:15') });
  ok('Đèn khách: tin đỏ đến trong đêm (tin nối kênh) → hết đỏ vẫn giữ tới 07:00', giu(kh(dem, [khachTinDem])));
});

// ===========================================================================
await nhom('5 · TRẦN TIN MỖI ĐÈN: TÍNH TỪ 8 GIỜ SÁNG, KHÔNG ĐẶT LẠI LÚC NỬA ĐÊM', async () => {
  const luc = vn('20:00');
  const lan = (...gio) => gio.map(g => ({ khoa: 'zalo', bao_mo_luc: vn(g) }));
  let k = kh(luc, [doLau(luc)], { daBao48Gio: lan('09:00', '10:00', '11:00', '12:00') });
  ok(`Đã báo ${TIN_TOI_DA_MOI_DEN - 1} lần từ 8 giờ → lần thứ ${TIN_TOI_DA_MOI_DEN} vẫn báo, kèm câu "sẽ không nhắn riêng nữa"`,
     k.moiDo.length === 1 && k.chamTran.join() === 'zalo');
  k = kh(luc, [doLau(luc)], { daBao48Gio: lan('09:00', '10:00', '11:00', '12:00', '13:00') });
  ok(`Đã báo ${TIN_TOI_DA_MOI_DEN} lần → không báo nữa (nhưng vẫn là sự cố đang mở)`, k.moiDo.length === 0 && !k.coTin);
  k = kh(luc, [doLau(luc)], { daBao48Gio: lan('07:59', '09:00', '10:00', '11:00', '12:00') });
  ok('Lần báo lúc 07:59 thuộc chu kỳ trước — không tính', k.moiDo.length === 1);
  k = kh(luc, [doLau(luc, { ma: 'ipos', cn: CN1 })], { daBao48Gio: lan('09:00', '10:00', '11:00', '12:00', '13:00') });
  ok('Trần tính riêng từng đèn', k.moiDo.length === 1 && k.chamTran.length === 0);
  const dem = vn('00:10', '2026-09-30');
  k = kh(dem, [doLau(dem)], { daBao48Gio: lan('20:00', '21:00', '22:00', '23:00', '23:50') });
  ok('00:10: năm lần báo từ 20:00 tới 23:50 vẫn tính — nửa đêm KHÔNG đặt lại trần', k.moiDo.length === 0);
  const sang = vn('08:00', '2026-09-30');
  k = kh(sang, [doLau(sang)], { daBao48Gio: lan('20:00', '21:00', '22:00', '23:00', '23:50') });
  ok('08:00 hôm sau → chu kỳ mới, báo lại được', k.moiDo.length === 1);
  ok('Đầu chu kỳ: 07:59 → 08:00 hôm qua; 08:00 → 08:00 hôm nay; 00:10 → 08:00 hôm qua',
     dauChuKy(Date.parse(vn('07:59'))) === Date.parse(vn('08:00', '2026-09-28'))
     && dauChuKy(Date.parse(vn('08:00'))) === Date.parse(vn('08:00'))
     && dauChuKy(Date.parse(vn('00:10', '2026-09-30'))) === Date.parse(vn('08:00')));
  ok('Đầu đêm: 22:00 → 22:00 hôm nay; 23:50 → 22:00 hôm nay; 00:10 và 06:59 → 22:00 hôm qua',
     dauDem(Date.parse(vn('22:00'))) === Date.parse(vn('22:00'))
     && dauDem(Date.parse(vn('23:50'))) === Date.parse(vn('22:00'))
     && dauDem(Date.parse(vn('00:10', '2026-09-30'))) === Date.parse(vn('22:00'))
     && dauDem(Date.parse(vn('06:59', '2026-09-30'))) === Date.parse(vn('22:00')));
});

// ===========================================================================
await nhom('6 · TÓM TẮT 8 GIỜ SÁNG MỖI NGÀY, VÀ TIN "ĐÃ NỐI KÊNH"', async () => {
  const homQua = vn('08:00', '2026-09-28');
  const tt = (luc, o = {}) => kh(luc, o.suCo ?? [], { tomTatLuc: homQua, ...o }).tomTat;
  ok('07:59 → chưa tóm tắt', tt(vn('07:59')) === null);
  ok('08:00 → tóm tắt', tt(vn('08:00')) === 'sang');
  ok('08:05 sau khi đã gửi lúc 08:00 → không lặp', tt(vn('08:05'), { tomTatLuc: vn('08:00') }) === null);
  ok(`Lỡ 08:00 → gửi bù tới trước ${GIO_TOM_TAT_BU_DEN}:00 (21:59 vẫn gửi)`, tt(vn('21:59')) === 'sang');
  ok(`Sau ${GIO_TOM_TAT_BU_DEN}:00 không gửi bù (không đánh thức ai vì một bản tóm tắt)`, tt(vn('22:00')) === null && tt(vn('23:50')) === null);
  const xanh = kh(vn('08:00'), [], { tomTatLuc: homQua });
  ok('Mọi thứ xanh vẫn tóm tắt — không thấy tin sáng là báo động hỏng', xanh.tomTat === 'sang' && xanh.coTin);
  const luc = vn('08:00');
  const a = doLau(luc, { ma: 'ipos', cn: CN1 }), b = doLau(luc, { ma: 'zalo', bao_mo_luc: truoc(luc, 5) });
  const khach = doLau(luc, { ma: 'dat_ban', cn: CN7 });
  const k = kh(luc, [a, b, khach], { tomTatLuc: homQua });
  ok('Tóm tắt liệt kê MỌI mục đang đỏ (kể cả đã báo), đánh dấu "đã báo" các mục chưa báo',
     k.tomTat === 'sang' && k.dangDo.length === 3 && k.danhDauMo.sort().join() === [a.id, khach.id].sort().join());
  const noi = kh(vn('00:10', '2026-09-30'), [doLau(vn('00:10', '2026-09-30'), { ma: 'dat_ban', cn: CN1 })],
                 { kenhTuLuc: vn('00:05', '2026-09-30'), tomTatLuc: null });
  ok('Vừa có kênh lúc 00:10 → tin "đã nối kênh" ngay (kể cả mục khách), không dồn tin cũ',
     noi.tomTat === 'noi_kenh' && noi.dangDo.length === 1 && noi.danhDauMo.length === 1);
  ok('Nối kênh lúc 00:10 → 08:00 vẫn có tóm tắt sáng',
     kh(vn('08:00', '2026-09-30'), [], { kenhTuLuc: vn('00:05', '2026-09-30'), tomTatLuc: vn('00:10', '2026-09-30') }).tomTat === 'sang');
  ok('Đổi kênh sau lần tóm tắt → nối kênh lại', kh(vn('15:00'), [], { kenhTuLuc: vn('14:58'), tomTatLuc: vn('08:00') }).tomTat === 'noi_kenh');
  ok(`GIO_TOM_TAT = ${GIO_TOM_TAT}`, GIO_TOM_TAT === 8);
});

// ===========================================================================
await nhom('7 · KHÔNG ĐỌC ĐƯỢC SỐ LIỆU: KHÔNG "ĐÃ ỔN LẠI" GIẢ', async () => {
  const luc = vn('08:00');
  const mu = doLau(luc, { ma: 'doc_so_lieu' });
  const cu = sc({ ma: 'ipos', cn: CN1, bat_dau_luc: truoc(luc, 120), het_do_tu: truoc(luc, 60), bao_mo_luc: truoc(luc, 110) });
  const doCu = doLau(luc, { ma: 'zalo' });
  const k = kh(luc, [mu, cu, doCu], { mu: true, tomTatLuc: vn('08:00', '2026-09-28') });
  ok('Mù → chỉ báo đèn giả doc_so_lieu ("báo động đang mù")', ids(k.moiDo) === mu.id);
  ok('Mù → không đóng, không báo hết đỏ sự cố nào', k.dongIm.length === 0 && k.hetDo.length === 0);
  ok('Mù → không tóm tắt (bù khi đọc lại được, tới 22:00)', k.tomTat === null);
  const moi = sc({ ma: 'doc_so_lieu', bat_dau_luc: truoc(luc, 2) });
  ok('Mù một lượt → chưa báo (hai lượt liền mới báo)', kh(luc, [moi], { mu: true }).moiDo.length === 0);
});

// ===========================================================================
await nhom('8 · CHƯA CHỌN KÊNH: THEO DÕI, KHÔNG GỬI, KHÔNG ĐÁNH DẤU', async () => {
  const luc = vn('08:00');
  const doMoi = doLau(luc, { ma: 'zalo' });
  const hetBao = sc({ ma: 'ipos', cn: CN1, bat_dau_luc: truoc(luc, 120), het_do_tu: truoc(luc, 30), bao_mo_luc: truoc(luc, 110) });
  const k = kh(luc, [doMoi, hetBao], { kenh: 'khong', tomTatLuc: null, kenhTuLuc: null });
  ok('Không gửi gì (kể cả tóm tắt 8 giờ), không đánh dấu "đã báo"', !k.coTin && k.moiDo.length === 0 && k.tomTat === null && k.danhDauMo.length === 0);
  ok('Vẫn đóng sự cố đã hết đỏ đủ lâu (im lặng)', ids(k.dongIm) === hetBao.id);
});

// ===========================================================================
await nhom('9 · ĐỒNG HỒ MÁY KHÔNG ẢNH HƯỞNG (23:50, 00:10, lệch năm năm)', async () => {
  const luc = vn('23:50');
  const vao = [doLau(luc, { ma: 'dat_ban', cn: CN1 }), doLau(luc, { ma: 'zalo' }),
               sc({ ma: 'ipos', cn: CN7, bat_dau_luc: truoc(luc, 90), het_do_tu: truoc(luc, 20), bao_mo_luc: truoc(luc, 80) })];
  const chup = () => JSON.stringify(kh(luc, vao, { daBao48Gio: [{ khoa: 'zalo', bao_mo_luc: vn('09:00') }] }));
  const that = chup();
  const ketQua = [];
  try {
    for (const g of ['2026-09-29T16:50:00Z', '2026-09-29T17:10:00Z', '2031-01-01T00:00:00Z', '2020-06-15T03:00:00Z']) {
      datGio(g);
      ketQua.push(chup());
    }
  } finally { traGio(); }
  ok('Cùng số liệu, đồng hồ máy ở 23:50 / 00:10 giờ VN hay lệch năm năm → cùng một kế hoạch', ketQua.every(x => x === that));
  const k = JSON.parse(that);
  ok('…và kế hoạch đó đúng luật đêm: báo Zalo, giữ đặt bàn, báo iPOS hết đỏ', k.moiDo.map(x => x.ma_den).join() === 'zalo'
     && k.hetDo.map(x => x.ma_den).join() === 'ipos');
  ok('luc hỏng → không quyết gì (không gửi, không đóng)', !lapKeHoach({ luc: 'không phải giờ', kenh: 'telegram', kenhTuLuc: null,
     tomTatLuc: null, suCo: vao, daBao48Gio: [], mu: false }).coTin);
});

// ===========================================================================
const WEB_GOC = 'https://beeftown.vn';
const tin = (luc, keHoach, o = {}) => soanTin({
  keHoach, sk: o.sk === undefined ? danhGiaSucKhoe(o.tho ?? thoGia(luc), o.nn ?? 'vi', true) : o.sk,
  nn: o.nn ?? 'vi', tenKenh: 'Telegram', gioiHanKyTu: o.gioiHan ?? 4096, web: WEB_GOC, luc,
});
await nhom('10 · CÂU CHỮ CỦA TIN', async () => {
  const luc = vn('14:05');
  const tho = thoGia(luc);
  tho.chi_nhanh[0].so_kho.lech = 2;
  tho.zalo.lan_chay_cuoi = truoc(luc, 45);
  const a = doLau(luc, { ma: 'so_kho', cn: CN1 }), z = doLau(luc, { ma: 'zalo' });
  let t = tin(luc, kh(luc, [a, z]), { tho });
  const dong = t.vanBan.split('\n');
  ok('Tiêu đề: giờ VN và số mục mới đỏ', dong[0] === 'Beeftown 14:05 — 2 mục mới đỏ', dong[0]);
  ok('Mỗi mục một dòng, câu lấy NGUYÊN từ bảng sức khỏe (tên chi nhánh · tên đèn: câu)',
     dong.includes('Mới đỏ:') && dong.some(d => d.startsWith('• Beeftown Q1 · Sổ kho: 2 lô có tồn lệch sổ kho'))
     && dong.some(d => d.startsWith('• Bộ gửi tin Zalo: Bộ gửi đã dừng (lượt gần nhất 45 phút trước)')), t.vanBan);
  ok('Cuối tin: link tuyệt đối tới bảng sức khỏe', dong.at(-1) === `Mở bảng sức khỏe: ${WEB_GOC}/noi-bo`);

  const het = (mau, o = {}) => sc({ ma: 'ipos', cn: CN7, bat_dau_luc: truoc(luc, 90), het_do_tu: truoc(luc, 20), bao_mo_luc: truoc(luc, 80), mau_sau: mau, ...o });
  const thoVang = thoGia(luc);
  Object.assign(thoVang.chi_nhanh[1].ipos, { den: 'vang', dang_tru_kho: false });
  const cau = (mau, o) => tin(luc, kh(luc, [het(mau)]), o).vanBan;
  ok('Hết đỏ, màu xanh → "đã ổn lại."', cau('xanh').includes('• Beeftown Q7 · iPOS: đã ổn lại.'), cau('xanh'));
  ok('Hết đỏ, màu vàng → "hết đỏ, còn cần xem hôm nay — <câu vàng của bảng>"',
     cau('vang', { tho: thoVang }).includes('• Beeftown Q7 · iPOS: hết đỏ, còn cần xem hôm nay — Đang nhận hóa đơn iPOS nhưng CHƯA trừ kho'),
     cau('vang', { tho: thoVang }));
  ok('Hết đỏ, màu xám → "đã tắt."', cau('tat').includes('• Beeftown Q7 · iPOS: đã tắt.'));
  ok('Tiêu đề tin chỉ có hết đỏ', cau('xanh').split('\n')[0] === 'Beeftown 14:05 — 1 mục hết đỏ');

  const tran = kh(luc, [z], { daBao48Gio: [9, 10, 11, 12].map(g => ({ khoa: 'zalo', bao_mo_luc: vn(`${String(g).padStart(2, "0")}:00`) })) });
  ok('Tin thứ 5 của một đèn nói rõ sẽ không nhắn riêng nữa tới bản tóm tắt 8 giờ sáng',
     tin(luc, tran, { tho }).vanBan.includes('(đã báo mục này 5 lần từ 8 giờ sáng — sẽ không nhắn riêng nữa tới bản tóm tắt 8 giờ sáng)'));

  const sang = vn('08:00');
  const xanh = tin(sang, kh(sang, [], { tomTatLuc: vn('08:00', '2026-09-28') }));
  ok('Tóm tắt khi mọi thứ xanh: nói rõ, và "không thấy tin này là báo động hỏng"',
     xanh.vanBan.startsWith('Beeftown — tóm tắt 8 giờ sáng 29/09: mọi thứ ổn\nKhông có mục nào đỏ.')
     && xanh.vanBan.includes('Không thấy tin này lúc 8 giờ sáng nghĩa là hệ thống báo động đang hỏng.'), xanh.vanBan);
  const thoSang = thoGia(sang);
  thoSang.dich.loi = 2;
  thoSang.chi_nhanh[0].so_kho.lech = 1;
  const doSang = tin(sang, kh(sang, [doLau(sang, { ma: 'so_kho', cn: CN1 })], { tomTatLuc: vn('08:00', '2026-09-28') }), { tho: thoSang });
  ok('Tóm tắt có mục đỏ: tiêu đề đếm, liệt kê "Đang đỏ:", đếm mục vàng',
     doSang.vanBan.startsWith('Beeftown — tóm tắt 8 giờ sáng 29/09: 1 mục đang đỏ\nĐang đỏ:\n• Beeftown Q1 · Sổ kho:')
     && doSang.vanBan.includes('\n1 mục vàng cần xem hôm nay.'), doSang.vanBan);
  const noi = tin(luc, kh(luc, [], { kenhTuLuc: truoc(luc, 1), tomTatLuc: null }));
  ok('Tin "đã nối kênh": tên kênh, "hiện không có mục nào đỏ", giải thích tin 8 giờ sáng',
     noi.vanBan.startsWith('Beeftown — đã nối kênh báo động (Telegram)\nHiện không có mục nào đỏ.')
     && /8 giờ sáng mỗi ngày có một tin tóm tắt/.test(noi.vanBan), noi.vanBan);
  const mu = tin(luc, kh(luc, [doLau(luc, { ma: 'doc_so_lieu' })], { mu: true }), { sk: null });
  ok('Báo động mù (không có số liệu): câu riêng, không vỡ', mu.vanBan.includes('• Báo động: không đọc được số liệu sức khỏe hệ thống'),
     mu.vanBan);
  const la = tin(luc, kh(luc, [doLau(luc, { ma: 'den_moi', cn: CN1 })]), { tho });
  ok('Đèn lạ / không tìm thấy trên bảng → vẫn có một dòng dễ hiểu', la.vanBan.includes('• Beeftown Q1 · den_moi: đang đỏ — mở bảng sức khỏe'),
     la.vanBan);
});

// ===========================================================================
await nhom('11 · TIN DÀI THÌ CẮT, SỐ KIỂU VIỆT, CHỮ NFC, KHÔNG LỘ GÌ', async () => {
  const luc = vn('14:05');
  const nhieu = Array.from({ length: 1300 }, (_, i) =>
    sc({ ma: `den_${String.fromCharCode(97 + (i % 26))}${String.fromCharCode(97 + Math.floor(i / 26) % 26)}${String.fromCharCode(97 + Math.floor(i / 676))}`,
         bat_dau_luc: truoc(luc, 10) }));
  const k = kh(luc, nhieu);
  const t = tin(luc, k, { gioiHan: 4096 });
  ok('Tin không bao giờ dài quá giới hạn kênh', t.vanBan.length <= 4096, `${t.vanBan.length}`);
  ok('Bỏ bớt mục thì ghi "và N mục khác" với số kiểu Việt (1.234)', t.soMucBoBot > 1000
     && t.vanBan.includes(`… và ${t.soMucBoBot.toLocaleString('vi-VN')} mục khác — mở bảng sức khỏe để xem đủ.`)
     && /… và \d\.\d{3} mục khác/.test(t.vanBan), t.vanBan.slice(-200));
  ok('Tiêu đề vẫn đếm đủ 1.300 mục', t.vanBan.startsWith('Beeftown 14:05 — 1.300 mục mới đỏ'), t.vanBan.slice(0, 60));
  const en = tin(luc, k, { gioiHan: 4096, nn: 'en' });
  ok('Tiếng Anh: số kiểu Anh (1,234)', /… and \d,\d{3} more items — open the health panel to see all\./.test(en.vanBan), en.vanBan.slice(-120));
  let dungHet = true;
  for (const gh of [0, 1, 10, 50, 80, 120, 200, 333, 1000]) {
    const x = tin(luc, kh(luc, nhieu.slice(0, 40)), { gioiHan: gh });
    if (x.vanBan.length > gh) dungHet = false;
  }
  ok('Giới hạn nào (0 tới 1.000 ký tự) cũng không vượt', dungHet);

  const thoDau = thoGia(luc);
  thoDau.chi_nhanh[0].ten = 'Beeftown Quận 1';
  thoDau.chi_nhanh[0].so_kho.lech = 1;
  const v = tin(luc, kh(luc, [doLau(luc, { ma: 'so_kho', cn: CN1 })]), { tho: { ...thoDau, chi_nhanh: thoDau.chi_nhanh.map(c => ({ ...c, ten: c.ten.normalize('NFD') })) } });
  ok('Chữ có dấu luôn dạng NFC (tên chi nhánh gõ kiểu tổ hợp cũng được chuẩn hóa)',
     v.vanBan === v.vanBan.normalize('NFC') && v.vanBan.includes('Beeftown Quận 1'), v.vanBan.slice(0, 120));

  const moiTin = [];
  const kichBan = [
    kh(luc, [doLau(luc, { ma: 'so_kho', cn: CN1 }), doLau(luc, { ma: 'zalo' })]),
    kh(vn('08:00'), [doLau(vn('08:00'), { ma: 'dat_ban', cn: CN7 })], { tomTatLuc: vn('08:00', '2026-09-28') }),
    kh(vn('08:00'), [], { tomTatLuc: vn('08:00', '2026-09-28') }),
    kh(luc, [], { kenhTuLuc: truoc(luc, 1), tomTatLuc: null }),
    kh(luc, [sc({ ma: 'ipos', cn: CN7, bat_dau_luc: truoc(luc, 90), het_do_tu: truoc(luc, 20), bao_mo_luc: truoc(luc, 80), mau_sau: 'vang' })]),
    kh(luc, [doLau(luc, { ma: 'doc_so_lieu' })], { mu: true }),
    kh(luc, [doLau(luc)], { daBao48Gio: [9, 10, 11, 12].map(g => ({ khoa: 'zalo', bao_mo_luc: vn(`${String(g).padStart(2, "0")}:00`) })) }),
  ];
  const thoXau = thoGia(luc);
  thoXau.chi_nhanh[0].so_kho.lech = 1;
  thoXau.chi_nhanh[1].dat_ban.qua_gio_hen = 2;
  thoXau.zalo.co_loi = true;
  Object.assign(thoXau.chi_nhanh[1].ipos, { den: 'vang', dang_tru_kho: false });
  for (const nn of ['vi', 'en']) {
    for (const kk of kichBan) {
      const lucK = kk.tomTat === 'sang' ? vn('08:00') : luc;
      moiTin.push({ nn, van: tin(lucK, kk, { nn, tho: { ...thoXau, luc: lucK }, sk: kk === kichBan[5] ? null : undefined }).vanBan });
    }
  }
  const sai = [];
  for (const { nn, van } of moiTin) {
    if (/thành công|successful/i.test(van)) sai.push(`[${nn}] chữ "thành công"`);
    for (const c of CAM) if (c.re.test(van)) sai.push(`[${nn}] chữ cấm ${c.re}`);
    if (/\b0\d{9}\b|@[a-z]+\./i.test(van)) sai.push(`[${nn}] SĐT / email`);
    if (nn === 'en' && VIET.test(van)) sai.push(`[en] lẫn chữ Việt: ${van.split('\n').find(d => VIET.test(d))}`);
  }
  ok(`${moiTin.length} tin (vi / en): không "thành công", không chữ cấm, không SĐT / email; tiếng Anh không lẫn chữ Việt`,
     sai.length === 0, sai.slice(0, 3).join(' | '));
  ok('Tin tiếng Việt và tiếng Anh khác nhau', moiTin.filter(x => x.nn === 'vi').every((x, i) => x.van !== moiTin.filter(y => y.nn === 'en')[i].van));
});

// ===========================================================================
await nhom('12 · HỢP ĐỒNG KÊNH (CHƯA CHỌN KÊNH NÀO)', async () => {
  ok('KENH_KHONG: mã "khong", không gửi được gì', KENH_KHONG.ma === 'khong' && KENH_KHONG.gioiHanKyTu === 0
     && (await KENH_KHONG.gui({ vanBan: 'x' }, new AbortController().signal)).ok === false);
  ok('Bản này chonKenhBaoDong luôn trả KENH_KHONG (kể cả khi env có đủ thứ)',
     chonKenhBaoDong(undefined) === KENH_KHONG && chonKenhBaoDong({ TELEGRAM_BOT_TOKEN: 'x', BAO_DONG_KENH: 'telegram' }) === KENH_KHONG);
  ok('Mã kênh khớp ràng buộc của database (^[a-z_]{1,20}$)', /^[a-z_]{1,20}$/.test(KENH_KHONG.ma));
});

// ===========================================================================
// ĐẦU–CUỐI trên database thật
// ===========================================================================
// Phần này chạy theo giờ THẬT (now() của database). Luật có hai mốc tính tới từng giây: 08:00 (tóm tắt
// sáng) và 22:00 (đầu đêm — tin đỏ trước mốc, hết đỏ sau mốc thì giữ tới 07:00). Một lượt rơi đúng qua
// mốc thì số tin đổi, nên còn dưới 3 phút nữa tới mốc thì đợi qua mốc rồi mới chạy (phần này mất vài giây).
const MOT_NGAY_MS = 24 * 60 * 60_000;
const conLaiToiMoc = Math.min(dauChuKy(Date.now()), dauDem(Date.now())) + MOT_NGAY_MS - Date.now();
if (conLaiToiMoc < 3 * 60_000) {
  console.log(`  (còn ${Math.ceil(conLaiToiMoc / 1000)} giây nữa tới mốc 08:00 / 22:00 giờ VN — đợi qua mốc rồi chạy)`);
  await new Promise(r => setTimeout(r, conLaiToiMoc + 2000));
}
const { baoDongTatCa, CRON_BAO_DONG, HET_GIO, taoFetchCoHan, guiCoHan, xoaBiMatBaoDong } = await import(join(WEB, 'lib', 'bao-dong.ts'));
const { db, cnA, cnB, duoi } = await dungDatabase();
const UID_MAY = '00000000-0000-4000-8000-0000000000f1';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro) values ($1, $2, 'Máy báo động', 'may_bao_dong')`, [UID_MAY, cnA.id]);
// Mỗi chi nhánh một bàn: form đặt bàn mở mà chưa có bàn là đèn KHÁCH đỏ — báo hay giữ tùy giờ chạy
// test. Các nhóm dưới chỉ dùng đèn HỆ THỐNG (Zalo) nên chạy giờ nào cũng cùng kết quả.
for (const cn of [cnA, cnB]) await db.query(`insert into ban_an (chi_nhanh_id, ten) values ($1, 'Bàn 1')`, [cn.id]);
// Một lượt sao lưu tốt 2 giờ trước: đèn "Sao lưu dữ liệu" xanh — bảng trống thì đèn đỏ "chưa có bản nào" và
// nhóm nào cũng thêm một tin đỏ không liên quan. Nhóm 19c thử đường đỏ (bản dùng được cuối quá 36 giờ).
const SAO_LUU_TOT = `insert into he_thong_sao_luu (bat_dau_luc, ok, kich_thuoc, so_bang, so_dong, thu_khoi_phuc, luot_chay)
                     values (now() - interval '2 hours', true, 829275, 118, 10325, 'dat', '1001-1')`;
await db.query(SAO_LUU_TOT);

const MAT_KHAU = 'MatKhauMay-Bi-Mat-123';
const ENV = { BAO_DONG_MAY_EMAIL: 'may-bao-dong@beeftown.test', BAO_DONG_MAY_MAT_KHAU: MAT_KHAU };
const TOKEN_KENH = 'TOKEN-KENH-BI-MAT-999';
const KIEU = {
  bao_dong_bat_dau_luot: [['p_kenh', 'text']],
  bao_dong_ghi_luot: [['p_luot', 'uuid'], ['p_den', 'jsonb'], ['p_day_du', 'boolean']],
  bao_dong_da_gui: [['p_kenh', 'text'], ['p_mo', 'uuid[]'], ['p_het', 'uuid[]'], ['p_tom_tat', 'boolean']],
  bao_dong_ket_thuc_luot: [['p_luot', 'uuid'], ['p_dong', 'uuid[]'], ['p_loi', 'text']],
};
/** Client Supabase giả: rpc chạy THẬT trên PGlite dưới danh nghĩa máy. hong[hàm] = { con: số lần hỏng, kieu: 'loi' | 'nem' }. */
function clientGia(o = {}) {
  const goi = [];
  return {
    goi,
    auth: {
      async signInWithPassword({ email, password }) {
        goi.push('signIn');
        if (o.dangNhap === 'nem') throw new Error('fetch failed');
        if (o.dangNhap === '429') return { data: { session: null }, error: { message: 'Request rate limit reached', status: 429 } };
        if (email !== ENV.BAO_DONG_MAY_EMAIL || password !== MAT_KHAU) return { data: { session: null }, error: { message: 'Invalid login credentials' } };
        return { data: { session: { access_token: 'phien-gia' } }, error: null };
      },
      async signOut() { goi.push('signOut'); return { error: null }; },
    },
    async rpc(ham, thamSo = {}) {
      goi.push(ham);
      const h = o.hong?.[ham];
      if (h && h.con > 0) {
        h.con--;
        if (h.kieu === 'nem') throw new Error('fetch failed: mất mạng giữa chừng');
        return { data: null, error: { message: 'Lỗi 503 giả của PostgREST' } };
      }
      const kieu = KIEU[ham];
      if (!kieu) return { data: null, error: { message: `hàm lạ ${ham}` } };
      const p = kieu.map(([ten, k]) => {
        const v = thamSo[ten];
        if (v === undefined || v === null) return null;
        return k === 'jsonb' ? JSON.stringify(v) : k === 'uuid[]' ? `{${v.join(',')}}` : v;
      });
      const r = await duoi(UID_MAY, `select ${ham}(${kieu.map(([, k], i) => `$${i + 1}::${k}`).join(', ')}) as kq`, p);
      return r.loi ? { data: null, error: { message: r.loi, code: r.ma } } : { data: r.rows[0].kq, error: null };
    },
  };
}
/** Kênh giả ghi lại mọi tin. kieu: 'ok' | 'hong' | 'nem' | 'treo' | 'la'. */
function kenhGia(kieu = 'ok') {
  const tin = [];
  return {
    tin, ma: 'telegram', ten: 'Telegram', gioiHanKyTu: 4096, biMat: [TOKEN_KENH],
    async gui(t) {
      tin.push(t.vanBan);
      if (kieu === 'nem') throw new Error(`lỗi mạng khi gọi bot${TOKEN_KENH}`);
      if (kieu === 'treo') return new Promise(() => {});
      if (kieu === 'hong') return { ok: false, tamThoi: true, cau: `HTTP 502 bot${TOKEN_KENH}` };
      if (kieu === 'la') return 'ok';
      return { ok: true };
    },
  };
}
const moiLog = [];
/** Một lượt: trả { log, c (client) }. */
async function chay(o = {}) {
  const c = o.client ?? clientGia(o.clientO);
  const log = await baoDongTatCa(o.env ?? ENV, {
    taoClient: () => c, kenh: o.kenh, hetGio: o.hetGio, ghiLog: () => {}, nn: 'vi',
  });
  moiLog.push(...log);
  return { log, c };
}
const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];
const trangThai = () => mot(`select * from bao_dong_trang_thai where id = 1`);
const suCoMo = khoa => mot(`select * from bao_dong_su_co where khoa = $1 and het_luc is null`, [khoa]);
/** Giả thời gian trôi: lùi mốc của sự cố đang mở (database không có đồng hồ giả). */
const lui = (khoa, cot, phut) => db.query(
  `update bao_dong_su_co set ${cot} = ${cot} - make_interval(mins => $2) where khoa = $1 and het_luc is null`, [khoa, phut]);
const zaloDo = () => db.query(`
  update zalo_cau_hinh set app_id = '123', oa_id = '456', refresh_token_ma_hoa = 'v1.' || repeat('BANMABIMAT', 5),
         dang_bat = true, che_do = 'that', lan_chay_cuoi = now(), loi_cuoi = 'Lỗi thử — gọi 0912345678' where id = 1`);
const zaloXanh = () => db.query(`update zalo_cau_hinh set loi_cuoi = null, lan_chay_cuoi = now() where id = 1`);
const denBaoDong = async () => {
  const r = await duoi(UID.chu, `select suc_khoe_he_thong() as k`);
  const k = r.rows?.[0]?.k;
  return { o: k?.bao_dong, d: danhGiaSucKhoe(k, 'vi', true).khoi[0].den.find(x => x.ma === 'bao_dong') };
};

// ===========================================================================
await nhom('13 · KHÔNG CÓ TÀI KHOẢN MÁY, ĐĂNG NHẬP HỎNG → BỎ LƯỢT, KHÔNG NÉM', async () => {
  let log = await baoDongTatCa({}, { taoClient: () => { throw new Error('không được tạo client'); }, ghiLog: () => {} });
  ok('Thiếu hai bí mật → đúng một dòng "chưa cài … — bỏ qua", không gọi database',
     log.length === 1 && log[0] === '[bao-dong] chưa cài BAO_DONG_MAY_EMAIL / BAO_DONG_MAY_MAT_KHAU — bỏ qua', log.join(' | '));
  for (const [ten, o, mau] of [['Supabase trả 429 (quá giới hạn đăng nhập)', { dangNhap: '429' }, /Request rate limit reached/],
                               ['mất mạng lúc đăng nhập', { dangNhap: 'nem' }, /fetch failed/]]) {
    const r = await chay({ clientO: o });
    ok(`${ten} → bỏ lượt, một dòng log, không gọi RPC nào`, r.c.goi.join() === 'signIn' && r.log.length === 1
       && /tài khoản máy báo động không đăng nhập được/.test(r.log[0]) && mau.test(r.log[0]) && /— bỏ qua$/.test(r.log[0]), r.log.join(' | '));
  }
  const sai = await chay({ env: { ...ENV, BAO_DONG_MAY_MAT_KHAU: 'sai-mat-khau-456' } });
  ok('Sai mật khẩu → bỏ lượt; log không có mật khẩu', /Invalid login credentials/.test(sai.log[0]) && !sai.log[0].includes('sai-mat-khau-456'),
     sai.log.join(' | '));

  // Client Supabase THẬT, chỉ fetch là giả: 429 và treo.
  const envThat = { ...ENV, PUBLIC_SUPABASE_URL: 'https://gia.supabase.co', PUBLIC_SUPABASE_ANON_KEY: 'anon-gia' };
  const f429 = async () => new Response(JSON.stringify({ code: 429, error_code: 'over_request_rate_limit', msg: 'Request rate limit reached' }),
                                        { status: 429, headers: { 'content-type': 'application/json' } });
  log = await baoDongTatCa(envThat, { fetchFn: f429, ghiLog: () => {} });
  ok('Client Supabase thật, Supabase trả 429 → bỏ lượt, không ném', log.length === 1 && /không đăng nhập được/.test(log[0]), log.join(' | '));
  const fTreo = (_u, init) => new Promise((_, loi) => init?.signal?.addEventListener('abort', () => loi(init.signal.reason ?? new Error('aborted'))));
  const t0 = Date.now();
  log = await baoDongTatCa(envThat, { fetchFn: fTreo, hetGio: { goiMs: 1000 }, ghiLog: () => {} });
  ok('Supabase treo → lời gọi hết giờ (goiMs), bỏ lượt, không treo Worker', Date.now() - t0 < 8000 && log.length === 1
     && /không đăng nhập được/.test(log[0]), `${Date.now() - t0} ms · ${log.join(' | ')}`);
  ok('Mật khẩu máy không bao giờ nằm trong log', ![...log, ...moiLog].some(l => l.includes(MAT_KHAU)));
});

// ===========================================================================
await nhom('14 · CHƯA CHỌN KÊNH: CHẠY TRỌN LƯỢT, THEO DÕI, KHÔNG GỬI, KHÔNG ĐÁNH DẤU', async () => {
  const r = await chay();
  ok('Lượt trọn: đăng nhập → bắt đầu → ghi → kết thúc → đăng xuất',
     r.c.goi.join() === 'signIn,bao_dong_bat_dau_luot,bao_dong_ghi_luot,bao_dong_ket_thuc_luot,signOut', r.c.goi.join());
  ok('Log đúng một dòng "lượt xong — 0 đèn đỏ · chưa chọn kênh"', r.log.length === 1
     && r.log[0] === '[bao-dong] lượt xong — 0 đèn đỏ · chưa chọn kênh', r.log.join(' | '));
  const tt = await trangThai();
  ok('Database: nhịp tim, kênh "khong", không lỗi, nhả khóa', tt.lan_chay_cuoi !== null && tt.kenh === 'khong' && tt.loi_cuoi === null
     && tt.dang_chay_tu === null && tt.luot === null, JSON.stringify(tt));
  const { d } = await denBaoDong();
  ok('Đèn Báo động trên bảng: xám "chưa chọn kênh"', d?.mau === 'tat' && /chưa chọn kênh/.test(d?.cau), `${d?.mau} — ${d?.cau}`);
  ok('Không có sự cố nào (mọi đèn không đỏ)', (await mot(`select count(*)::int as n from bao_dong_su_co`)).n === 0);

  await zaloDo();
  await chay();
  const s1 = await suCoMo('zalo');
  ok('Đèn Zalo đỏ → sự cố mở, chưa báo', !!s1 && s1.bao_mo_luc === null && s1.het_do_tu === null);
  await lui('zalo', 'bat_dau_luc', 6);
  await chay();
  const s2 = await suCoMo('zalo');
  ok('Đỏ đủ lâu mà chưa có kênh → vẫn KHÔNG đánh dấu "đã báo" (để tin nối kênh nói lại)', s2.id === s1.id && s2.bao_mo_luc === null);
});

// ===========================================================================
const kenh = kenhGia('ok');
await nhom('15 · CÓ KÊNH: TIN NỐI KÊNH, KHÔNG LẶP, HẾT ĐỎ, MỚI ĐỎ', async () => {
  let r = await chay({ kenh });
  ok('Lượt đầu có kênh → tin "đã nối kênh" liệt kê mục đang đỏ', kenh.tin.length === 1
     && kenh.tin[0].startsWith('Beeftown — đã nối kênh báo động (Telegram)\nĐang đỏ:\n• Bộ gửi tin Zalo: Lượt gửi gần nhất bị lỗi'), kenh.tin[0]);
  ok('Log "đã gửi" SAU khi kênh trả ok, rồi "lượt xong"',
     r.log.join('\n') === '[bao-dong] đã gửi qua Telegram: tin nối kênh (1 đang đỏ)\n[bao-dong] lượt xong — 1 đèn đỏ · kênh Telegram',
     r.log.join(' | '));
  const tt = await trangThai();
  ok('Database: kênh telegram, lúc tóm tắt, lần gửi, sự cố Zalo đã báo', tt.kenh === 'telegram' && tt.tom_tat_luc !== null
     && tt.lan_gui_cuoi !== null && (await suCoMo('zalo')).bao_mo_luc !== null);
  ok('Tin không mang câu lỗi thô hay số điện thoại của lượt Zalo', !kenh.tin[0].includes('0912345678') && !kenh.tin[0].includes('Lỗi thử'));
  r = await chay({ kenh });
  ok('Lượt sau, vẫn đỏ → KHÔNG gửi lại (một đèn đỏ = một tin)', kenh.tin.length === 1 && r.log.length === 1, r.log.join(' | '));

  await zaloXanh();
  await chay({ kenh });
  ok('Hết đỏ → chưa báo ngay (chờ 15 phút)', kenh.tin.length === 1 && (await suCoMo('zalo'))?.het_do_tu !== null);
  await lui('zalo', 'het_do_tu', 16);
  await chay({ kenh });
  ok('Hết đỏ 16 phút → tin "hết đỏ: đã ổn lại"', kenh.tin.length === 2 && /— 1 mục hết đỏ\nHết đỏ:\n• Bộ gửi tin Zalo: đã ổn lại\./.test(kenh.tin[1]),
     kenh.tin[1]);
  const dong = await mot(`select * from bao_dong_su_co where khoa = 'zalo' order by bat_dau_luc desc limit 1`);
  ok('…sự cố đóng SAU khi gửi và đánh dấu', dong.het_luc !== null && dong.bao_het_luc !== null && !(await suCoMo('zalo')));

  await zaloDo();
  await chay({ kenh });
  ok('Đỏ lại → sự cố MỚI, lượt đầu chưa báo', kenh.tin.length === 2 && (await suCoMo('zalo'))?.bao_mo_luc === null);
  await lui('zalo', 'bat_dau_luc', 6);
  await chay({ kenh });
  ok('Lượt thứ hai → tin "mới đỏ"', kenh.tin.length === 3 && /^Beeftown \d\d:\d\d — 1 mục mới đỏ\nMới đỏ:\n• Bộ gửi tin Zalo: Lượt gửi gần nhất bị lỗi/.test(kenh.tin[2]),
     kenh.tin[2]);
  await chay({ kenh });
  ok('…và chỉ một lần', kenh.tin.length === 3);
  const { d } = await denBaoDong();
  ok('Đèn Báo động: xanh "Báo qua Telegram"', d?.mau === 'xanh' && /^Báo qua Telegram/.test(d?.cau), `${d?.mau} — ${d?.cau}`);
});

// ===========================================================================
await nhom('16 · GỬI HỎNG → KHÔNG ĐÁNH DẤU, ĐÈN ĐỎ, LƯỢT SAU GỬI LẠI', async () => {
  await zaloXanh();
  await chay({ kenh });
  await lui('zalo', 'het_do_tu', 16);
  for (const [ten, k, o] of [['kênh trả lỗi 502', kenhGia('hong'), {}], ['kênh ném lỗi mạng', kenhGia('nem'), {}],
                             ['kênh trả kết quả sai hợp đồng', kenhGia('la'), {}],
                             ['kênh treo', kenhGia('treo'), { hetGio: { kenhMs: 300 } }]]) {
    const t0 = Date.now();
    const r = await chay({ kenh: k, ...o });
    const s = await suCoMo('zalo');
    const tt = await trangThai();
    ok(`${ten} → sự cố vẫn mở, chưa đánh dấu hết đỏ, lỗi lưu lại (không token kênh), không "đã gửi"`,
       k.tin.length === 1 && !!s && s.bao_het_luc === null && /gửi qua Telegram hỏng/.test(tt.loi_cuoi ?? '')
       && !(tt.loi_cuoi ?? '').includes(TOKEN_KENH) && !r.log.some(l => l.includes('đã gửi')) && tt.dang_chay_tu === null,
       `${tt.loi_cuoi} · ${r.log.join(' | ')}`);
    if (ten === 'kênh treo') ok('…kênh treo hết giờ, lượt vẫn kết thúc', Date.now() - t0 < 5000, `${Date.now() - t0} ms`);
  }
  let { o, d } = await denBaoDong();
  ok('Đèn Báo động ĐỎ "lượt gần nhất bị lỗi"', o?.co_loi === true && d?.mau === 'do' && /bị lỗi/.test(d?.cau), `${d?.mau} — ${d?.cau}`);
  const truoc = kenh.tin.length;
  await chay({ kenh });
  ok('Kênh hoạt động lại → gửi tin hết đỏ đúng một lần, đóng sự cố, hết lỗi', kenh.tin.length === truoc + 1
     && /đã ổn lại/.test(kenh.tin.at(-1)) && !(await suCoMo('zalo')) && (await trangThai()).loi_cuoi === null);
  ({ o, d } = await denBaoDong());
  ok('…đèn Báo động xanh lại', d?.mau === 'xanh', `${d?.mau} — ${d?.cau}`);
});

// ===========================================================================
await nhom('17 · GỬI ĐƯỢC MÀ ĐÁNH DẤU HỎNG → LẶP ĐÚNG MỘT TIN', async () => {
  await zaloDo();
  await chay({ kenh });
  await lui('zalo', 'bat_dau_luc', 6);
  const truoc = kenh.tin.length;
  let r = await chay({ kenh, clientO: { hong: { bao_dong_da_gui: { con: 2 } } } });
  ok('Tin tới kênh, đánh dấu hỏng hai lần → log "đã gửi" + lỗi "không đánh dấu được"', kenh.tin.length === truoc + 1
     && r.log.some(l => l.startsWith('[bao-dong] đã gửi qua Telegram: 1 mới đỏ'))
     && /không đánh dấu được/.test((await trangThai()).loi_cuoi ?? '') && (await suCoMo('zalo')).bao_mo_luc === null, r.log.join(' | '));
  await chay({ kenh });
  ok('Lượt sau gửi LẠI đúng tin đó (thà lặp còn hơn mất), lần này đánh dấu được', kenh.tin.length === truoc + 2
     && kenh.tin.at(-1).split('\n').slice(1).join() === kenh.tin.at(-2).split('\n').slice(1).join() && (await suCoMo('zalo')).bao_mo_luc !== null);
  await chay({ kenh });
  ok('…rồi thôi: đúng một lần lặp', kenh.tin.length === truoc + 2);
  await zaloXanh();
  await chay({ kenh });
  await lui('zalo', 'het_do_tu', 16);
  r = await chay({ kenh, clientO: { hong: { bao_dong_da_gui: { con: 1 } } } });
  ok('Đánh dấu hỏng MỘT lần → thử lại được ngay, không lặp tin, sự cố đóng', kenh.tin.length === truoc + 3 && !(await suCoMo('zalo'))
     && (await trangThai()).loi_cuoi === null, r.log.join(' | '));
});

// ===========================================================================
await nhom('18 · MẤT MẠNG / DATABASE LỖI GIỮA CHỪNG → KHÔNG GỬI, VẪN NHẢ KHÓA', async () => {
  await zaloDo();
  const truoc = kenh.tin.length;
  for (const [ten, hong] of [['ghi lượt trả lỗi', { bao_dong_ghi_luot: { con: 1 } }],
                             ['ghi lượt mất mạng (ném lỗi)', { bao_dong_ghi_luot: { con: 1, kieu: 'nem' } }]]) {
    const r = await chay({ kenh, clientO: { hong } });
    const tt = await trangThai();
    ok(`${ten} → không gửi, kết thúc lượt, nhả khóa, lỗi lưu lại`, kenh.tin.length === truoc && r.c.goi.includes('bao_dong_ket_thuc_luot')
       && tt.dang_chay_tu === null && /không ghi được lượt|lỗi: fetch failed/.test(tt.loi_cuoi ?? ''), `${tt.loi_cuoi} · ${r.c.goi.join()}`);
  }
  let r = await chay({ kenh, clientO: { hong: { bao_dong_bat_dau_luot: { con: 1, kieu: 'nem' } } } });
  ok('Mất mạng ngay lúc bắt đầu lượt → log lỗi, vẫn đăng xuất, không ném', r.log.some(l => /lỗi: fetch failed/.test(l))
     && r.c.goi.at(-1) === 'signOut', r.log.join(' | '));
  r = await chay({ kenh, clientO: { hong: { bao_dong_ket_thuc_luot: { con: 1 } } } });
  ok('Không kết thúc được lượt → log nói khóa tự hết sau 10 phút', r.log.some(l => /không kết thúc được lượt \(khóa tự hết sau 10 phút\)/.test(l)),
     r.log.join(' | '));
  r = await chay({ kenh });
  ok('…lượt ngay sau: "lượt khác đang chạy — bỏ qua", không ghi, không nhả khóa của lượt kia',
     r.log.includes('[bao-dong] lượt khác đang chạy — bỏ qua') && !r.c.goi.includes('bao_dong_ghi_luot')
     && !r.c.goi.includes('bao_dong_ket_thuc_luot') && (await trangThai()).dang_chay_tu !== null, r.log.join(' | '));
  await db.query(`update bao_dong_trang_thai set dang_chay_tu = now() - interval '11 minutes' where id = 1`);
  r = await chay({ kenh });
  ok('…khóa treo quá 10 phút → lượt mới chạy bình thường', r.c.goi.includes('bao_dong_ghi_luot') && (await trangThai()).dang_chay_tu === null);
  await lui('zalo', 'bat_dau_luc', 6);
  await chay({ kenh });
  ok('Đèn đỏ trong lúc lỗi vẫn được báo khi database ổn lại', kenh.tin.length === truoc + 1 && /1 mục mới đỏ/.test(kenh.tin.at(-1)));
});

// ===========================================================================
await nhom('19 · KHÔNG ĐỌC ĐƯỢC SỐ LIỆU → ĐÈN GIẢ doc_so_lieu, KHÔNG "ĐÃ ỔN LẠI" GIẢ', async () => {
  const soLieuThat = (() => {
    const m = readFileSync(join(GOC, 'crm', 'supabase', 'migrations', '0060_bao_dong.sql'), 'utf8');
    const i = m.indexOf('create or replace function suc_khoe_so_lieu(');
    return m.slice(i, m.indexOf('\n$$;', i) + 4);
  })();
  const truoc = kenh.tin.length;
  await db.exec(`create or replace function suc_khoe_so_lieu(p_chi_nhanh_ids uuid[], p_lech jsonb default null) returns jsonb language plpgsql stable
    security invoker set search_path = public as $$ begin raise exception 'hỏng thử'; end $$;`);
  try {
    await zaloXanh();
    await chay({ kenh });
    const zalo = await suCoMo('zalo');
    ok('Mù một lượt: mở sự cố doc_so_lieu, sự cố Zalo vẫn ĐỎ (dù Zalo đã ổn — không ai biết)', !!(await suCoMo('doc_so_lieu'))
       && zalo?.het_do_tu === null && kenh.tin.length === truoc, JSON.stringify(zalo));
    ok('…lỗi lưu lại: không đọc được số liệu', /không đọc được số liệu sức khỏe/.test((await trangThai()).loi_cuoi ?? ''));
    await lui('doc_so_lieu', 'bat_dau_luc', 6);
    await chay({ kenh });
    ok('Mù hai lượt → một tin "báo động đang mù"', kenh.tin.length === truoc + 1
       && kenh.tin.at(-1).includes('• Báo động: không đọc được số liệu sức khỏe hệ thống'), kenh.tin.at(-1));
    ok('…không tin "đã ổn lại" nào, không đóng sự cố nào', !kenh.tin.at(-1).includes('ổn lại') && !!(await suCoMo('zalo')));
  } finally {
    await db.exec(soLieuThat);
  }
  await chay({ kenh });
  ok('Đọc lại được → Zalo và doc_so_lieu bắt đầu chờ hết đỏ', (await suCoMo('zalo'))?.het_do_tu !== null
     && (await suCoMo('doc_so_lieu'))?.het_do_tu !== null);
  await lui('zalo', 'het_do_tu', 16);
  await lui('doc_so_lieu', 'het_do_tu', 16);
  await chay({ kenh });
  ok('…15 phút sau: MỘT tin báo cả hai đã ổn lại', kenh.tin.length === truoc + 2 && /2 mục hết đỏ/.test(kenh.tin.at(-1))
     && kenh.tin.at(-1).includes('• Bộ gửi tin Zalo: đã ổn lại.') && kenh.tin.at(-1).includes('• Báo động: đã ổn lại.'), kenh.tin.at(-1));
});

// ===========================================================================
await nhom('19b · ĐÃ BÁO HẾT ĐỎ MÀ KHÔNG KẾT THÚC ĐƯỢC LƯỢT → LẦN ĐỎ SAU VẪN ĐƯỢC BÁO', async () => {
  // Các nhóm trên đã báo Zalo đủ 5 lần từ 8 giờ sáng — đẩy các lần đó ra khỏi chu kỳ, để nhóm này
  // thử đúng một điều (trần tin đã thử ở nhóm 5).
  await db.query(`update bao_dong_su_co set bao_mo_luc = bao_mo_luc - interval '3 days' where khoa = 'zalo' and het_luc is not null`);
  await zaloDo();
  await chay({ kenh });
  await lui('zalo', 'bat_dau_luc', 6);
  await chay({ kenh });
  await zaloXanh();
  await chay({ kenh });
  await lui('zalo', 'het_do_tu', 16);
  const truoc = kenh.tin.length;
  await chay({ kenh, clientO: { hong: { bao_dong_ket_thuc_luot: { con: 1 } } } });
  ok('Tin "đã ổn lại" tới kênh và đã đánh dấu, nhưng lượt không kết thúc được', kenh.tin.length === truoc + 1
     && /đã ổn lại/.test(kenh.tin.at(-1)) && (await trangThai()).dang_chay_tu !== null);
  await db.query(`update bao_dong_trang_thai set dang_chay_tu = now() - interval '11 minutes' where id = 1`);
  await zaloDo();
  await chay({ kenh });
  await lui('zalo', 'bat_dau_luc', 6);
  await chay({ kenh });
  ok('Rà soát: Zalo đỏ lại sau đó → vẫn có tin "mới đỏ" (không bị nuốt vì sự cố cũ đã đánh dấu hết đỏ)',
     kenh.tin.length === truoc + 2 && /1 mục mới đỏ/.test(kenh.tin.at(-1) ?? ''), kenh.tin.at(-1));
  await zaloXanh();
  await chay({ kenh });
  await lui('zalo', 'het_do_tu', 16);
  await chay({ kenh });
});

// ===========================================================================
// Đèn "Sao lưu dữ liệu" (0058) chỉ chủ / quản lý đọc được qua suc_khoe_sao_luu(); 0060 tách phần tính
// để lượt báo động thấy nó như mọi đèn khác — không thì sao lưu hỏng không bao giờ được báo.
await nhom('19c · SAO LƯU KHÔNG CÓ BẢN DÙNG ĐƯỢC → ĐƯỢC BÁO NHƯ MỌI ĐÈN HỆ THỐNG', async () => {
  const truoc = kenh.tin.length;
  await chay({ kenh });
  ok('Sao lưu tốt → không có sự cố sao lưu', !(await suCoMo('sao_luu')) && kenh.tin.length === truoc);
  await db.query(`update he_thong_sao_luu set bat_dau_luc = now() - interval '40 hours', ket_thuc_luc = now() - interval '39 hours'`);
  await chay({ kenh });
  ok('Bản dùng được gần nhất 40 giờ trước → đèn đỏ → sự cố "sao_luu" mở', !!(await suCoMo('sao_luu')));
  await lui('sao_luu', 'bat_dau_luc', 6);
  await chay({ kenh });
  ok('Lượt sau → tin "mới đỏ" với đúng câu của bảng', kenh.tin.length === truoc + 1
     && kenh.tin.at(-1).includes('• Sao lưu dữ liệu: Bản sao lưu dùng được gần nhất đã 40 giờ trước'), kenh.tin.at(-1));
  await db.query(`delete from he_thong_sao_luu`);
  await db.query(SAO_LUU_TOT);
  await chay({ kenh });
  await lui('sao_luu', 'het_do_tu', 16);
  await chay({ kenh });
  ok('Sao lưu tốt lại → "Sao lưu dữ liệu: đã ổn lại."', kenh.tin.length === truoc + 2
     && kenh.tin.at(-1).includes('• Sao lưu dữ liệu: đã ổn lại.') && !(await suCoMo('sao_luu')), kenh.tin.at(-1));
});

// ===========================================================================
await nhom('20 · LOG VÀ TIN KHÔNG LỘ GÌ', async () => {
  ok(`${moiLog.length} dòng log: không mật khẩu máy, không token kênh, không số điện thoại`,
     moiLog.length > 20 && !moiLog.some(l => l.includes(MAT_KHAU) || l.includes(TOKEN_KENH) || l.includes('0912345678')),
     moiLog.find(l => l.includes(MAT_KHAU) || l.includes(TOKEN_KENH) || l.includes('0912345678')));
  ok('Mọi dòng log có tiền tố [bao-dong]', moiLog.every(l => l.startsWith('[bao-dong] ')));
  ok(`${kenh.tin.length} tin: không "thành công", không số điện thoại`,
     !kenh.tin.some(t => /thành công/i.test(t) || t.includes('0912345678')));
  const maHoa = xoaBiMatBaoDong(`gọi bot123456789%3AAAH${'f'.repeat(32)}/getMe`);
  ok('Rà soát: xoaBiMatBaoDong xóa cả token Telegram mã hóa URL (%3A) — không chỉ phần số', maHoa === 'gọi bot***/getMe', maHoa);
  ok('xoaBiMatBaoDong: bí mật đã biết, token Telegram, SĐT, token=…',
     xoaBiMatBaoDong(`a ${TOKEN_KENH} b 123456789:AAH${'f'.repeat(32)} c 0901 234 567 d token=abc123`, [TOKEN_KENH])
       === 'a *** b *** c *** d token=***', xoaBiMatBaoDong(`a ${TOKEN_KENH} b 123456789:AAH${'f'.repeat(32)} c 0901 234 567 d token=abc123`, [TOKEN_KENH]));
});

// ===========================================================================
await nhom('21 · CRON RIÊNG, HẾT GIỜ, WORKER', async () => {
  const w = readFileSync(join(WEB, 'worker.ts'), 'utf8');
  const sch = w.slice(w.indexOf('async scheduled('));
  ok('worker.ts: cron báo động chỉ chạy baoDongTatCa (waitUntil) rồi dừng — TRƯỚC hai việc cũ',
     /import \{ baoDongTatCa, CRON_BAO_DONG \} from '\.\/lib\/bao-dong\.ts'/.test(w)
     && /if \(dieuKhien\?\.cron === CRON_BAO_DONG\) \{\s*ctx\.waitUntil\(baoDongTatCa\(env\)\);\s*return;\s*\}/.test(sch)
     && sch.indexOf('CRON_BAO_DONG') < sch.indexOf('dongBoTatCa') && sch.indexOf('CRON_BAO_DONG') < sch.indexOf('guiZaloTatCa'));
  const t = readFileSync(join(GOC, 'web', 'wrangler.toml'), 'utf8');
  const crons = JSON.parse(t.match(/^crons = (\[.*\])$/m)?.[1] ?? '[]');
  ok('wrangler.toml: đúng hai cron, cron báo động = CRON_BAO_DONG, lệch cron iPOS / Zalo',
     crons.length === 2 && crons[0] === '*/5 * * * *' && crons[1] === CRON_BAO_DONG && CRON_BAO_DONG === '2-59/5 * * * *', JSON.stringify(crons));
  const ban = join(GOC, 'web', 'dist', 'server', 'wrangler.json');
  if (existsSync(ban)) {
    const j = JSON.parse(readFileSync(ban, 'utf8'));
    ok('Bản build (dist/server/wrangler.json) có cả hai cron', JSON.stringify(j.triggers?.crons) === JSON.stringify(crons), JSON.stringify(j.triggers));
  } else {
    console.log('  (chưa build web — bỏ qua kiểm dist/server/wrangler.json)');
  }
  ok('Hết giờ: mỗi lời gọi 20 giây, kênh 10 giây, cả lượt 60 giây, kết thúc lượt thêm 15 giây',
     HET_GIO.goiMs === 20000 && HET_GIO.kenhMs === 10000 && HET_GIO.luotMs === 60000 && HET_GIO.ketThucMs === 15000);
  const treo = (_u, init) => new Promise((_, loi) => init.signal.addEventListener('abort', () => loi(init.signal.reason)));
  let t0 = Date.now(), loi = null;
  try { await taoFetchCoHan(treo, () => Date.now() + 60000, 1000)('https://x'); } catch (e) { loi = e; }
  ok('fetch có hạn: treo → hủy sau goiMs với câu "quá … giây không trả lời"', loi !== null && Date.now() - t0 < 3000
     && /quá 1 giây không trả lời/.test(loi?.message ?? ''), `${Date.now() - t0} ms · ${loi?.message}`);
  t0 = Date.now(); loi = null;
  try { await taoFetchCoHan(treo, () => Date.now() - 5000, 20000)('https://x'); } catch (e) { loi = e; }
  ok('Quá hạn chót của lượt → lời gọi còn lại hỏng nhanh (1 giây), không chờ đủ 20 giây', loi !== null && Date.now() - t0 < 3000,
     `${Date.now() - t0} ms`);
  const ngoai = new AbortController();
  const p = taoFetchCoHan(treo, () => Date.now() + 60000, 20000)('https://x', { signal: ngoai.signal });
  ngoai.abort(new Error('người gọi hủy'));
  loi = null;
  try { await p; } catch (e) { loi = e; }
  ok('Giữ tín hiệu hủy của người gọi (supabase-js)', /người gọi hủy/.test(loi?.message ?? ''), loi?.message);
  const kq = await guiCoHan(kenhGia('treo'), { vanBan: 'x' }, 200);
  ok('guiCoHan: kênh treo → { ok:false, tamThoi:true } sau hạn giờ', kq.ok === false && kq.tamThoi === true, JSON.stringify(kq));
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('Sổ kho không bị đụng: kho_doi_soat_ton() rỗng', rows.length === 0);
});

process.exit(ketThuc('BÁO ĐỘNG PHÍA WEB'));
