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
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { datGio, traGio } from './dong-ho-gia.mjs';
import { VIET } from './quet-chu-viet.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web', 'src');
const CS = await import(join(WEB, 'lib', 'bao-dong-chinh-sach.ts'));
const { lapKeHoach, NHOM, nhomCua, laBanDem, dauChuKy, gioVn,
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
  const heThongDem = sc({ ma: 'ipos', cn: CN1, bat_dau_luc: vn('21:00'), het_do_tu: vn('22:30'), bao_mo_luc: vn('21:05') });
  ok('Đèn hệ thống hết đỏ lúc 23:00 → báo ngay', ids(kh(dem, [heThongDem]).hetDo) === heThongDem.id);
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

process.exit(ketThuc('BÁO ĐỘNG PHÍA WEB'));
