/**
 * BEEFTOWN KHO — Trang pha lóc biết ô đã lên cân chưa (0061, phía web)
 * ====================================================================
 *
 *     node test/test-kho-can-quay-web.mjs
 *
 * tomTatCanPhien (web/src/lib/kho/danh-muc-can.ts) soạn câu từ kho_phien_pha_can — hàm thuần, dữ liệu giả:
 *   · "Cân sẵn sàng: <tên + số tảng> = PLU · phím" CHỈ khi máy quầy báo đúng TÊN MỚI cho mã ô (tên cũ = tem sai tảng);
 *   · 0090 (Beeftown Cân 2.9.3): dòng máy quầy đánh dấu chưa xác nhận (cân có thể đang khác) → không "sẵn sàng" theo dòng đó;
 *   · chưa máy quầy nào báo → "không biết", không bao giờ "sẵn sàng";
 *   · tem cân in / nhãn quét: khớp, thiếu quét, nhật ký chưa đủ; nhãn mã thường của phiên theo tảng;
 *   · docCanPhien không bao giờ ném (database chưa chạy 0061 → null, trang không vẽ gì);
 *   · trang pha lóc nối đúng; tiếng Anh không lẫn chữ Việt.
 * Phần database: test-kho-can-quay.mjs.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { VIET, boChuThich } from './quet-chu-viet.mjs';
import { tomTatCanPhien, PHUT_BAO_CAN_CU } from '../../web/src/lib/kho/danh-muc-can.ts';
import { docCanPhien, docGiaoOMaCan, giaoOMa } from '../../web/src/lib/kho/o-ma.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — TRANG PHA LÓC BIẾT Ô ĐÃ LÊN CÂN (0061, WEB)');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');

const LUC = '2026-10-04T05:00:00.000Z';   // 12:00 giờ VN
const truoc = phut => new Date(Date.parse(LUC) - phut * 60000).toISOString();
const MAY = (sua = {}) => ({ bao_luc: truoc(1), phien_ban: '2.9.0', giu_ket_noi: true, can_tra_loi_luc: truoc(0.5), tu_gui: true,
                             lech_so: 0, lech_tu: null, gui_loi: false, gui_luc: truoc(2), nhat_ky_luc: truoc(1), ...sua });
const O = (sua = {}) => ({ giao_id: 'g1', o_ma_id: 'o1', mat_hang_id: 'm1', ten_hang: 'Thăn ngoại cắt lát', so_o: 1, ma_can: '10011',
                           so_tang: 142, dang_giu: true, tu_luc: truoc(60), den_luc: null, quet: 11, quet_kg: 5.5, in: 11, in_kg: 5.5,
                           tren_can: [{ plu: 23, ten: 'Thăn ngoại cắt lát #0142', phim: ['F5'], bao_luc: truoc(1) }], ...sua });
const CP = (sua = {}) => ({ luc: LUC, theo_tang: true, co_mau_ma_vach: true, o: [O()], nhan_thuong: [], may: [MAY()], ...sua });
const dong0 = cp => tomTatCanPhien(cp).dong[0];

// ===========================================================================
await nhom('1 · CÂN SẴN SÀNG CHỈ KHI ĐÚNG TÊN MỚI (TÊN + SỐ TẢNG)', async () => {
  const d = dong0(CP());
  ok('Máy quầy báo đúng tên "Thăn ngoại cắt lát #0142" ở PLU 23, phím F5 → xanh "Cân sẵn sàng: … = PLU 23 · phím F5"',
     d.muc === 'san_sang' && d.cau.vi === 'Cân sẵn sàng: Thăn ngoại cắt lát #0142 = PLU 23 · phím F5' && d.tenMuon === 'Thăn ngoại cắt lát #0142',
     JSON.stringify(d));
  const khongPhim = dong0(CP({ o: [O({ tren_can: [{ plu: 23, ten: 'Thăn ngoại cắt lát #0142', phim: [], bao_luc: truoc(1) }] })] }));
  ok('Chưa gán phím tắt → vẫn sẵn sàng, nói gán ở thẻ Phím tắt', khongPhim.muc === 'san_sang' && /chưa gán phím tắt/.test(khongPhim.cau.vi),
     khongPhim.cau.vi);
  const cu = dong0(CP({ o: [O({ tren_can: [{ plu: 23, ten: 'Thăn ngoại cắt lát #0141', phim: ['F5'], bao_luc: truoc(1) }] })] }));
  ok('Cân còn tên tảng trước (#0141) → vàng "còn tên cũ — chưa in tem", KHÔNG sẵn sàng', cu.muc === 'ten_cu'
     && /^Cân còn tên cũ "Thăn ngoại cắt lát #0141" \(PLU 23\) — chưa in tem/.test(cu.cau.vi), cu.cau.vi);
  const chua = dong0(CP({ o: [O({ tren_can: [] })] }));
  ok('Máy quầy báo mà mã ô chưa có trên cân → vàng "Chưa lên cân"', chua.muc === 'chua_len' && /^Chưa lên cân: mã ô 10011/.test(chua.cau.vi), chua.cau.vi);
  const khong = dong0(CP({ o: [O({ tren_can: [] })], may: [] }));
  ok('Chưa máy quầy nào báo → "không biết": quản lý bấm Gửi xuống cân, xem trên cân đúng tên rồi mới in — không bao giờ "sẵn sàng"',
     khong.muc === 'khong_biet' && /Không biết cân đã có/.test(khong.cau.vi) && /bấm Gửi xuống cân/.test(khong.cau.vi)
     && /xem trên cân đúng tên rồi mới in tem/.test(khong.cau.vi), khong.cau.vi);
  const nfd = dong0(CP({ o: [O({ ten_hang: 'Thăn ngoại cắt lát'.normalize('NFD'),
                                 tren_can: [{ plu: 23, ten: 'Thăn ngoại cắt lát #0142', phim: ['E'], bao_luc: truoc(1) }] })] }));
  ok('Tên món lưu dạng NFD (dán từ Excel / macOS), cân lưu NFC → vẫn "sẵn sàng" (so như lúc gửi xuống cân)', nfd.muc === 'san_sang', nfd.cau?.vi);
  const tab = dong0(CP({ o: [O({ ten_hang: 'Thăn ngoại\tcắt lát', tren_can: [{ plu: 23, ten: 'Thăn ngoại cắt lát #0142', phim: [], bao_luc: truoc(1) }] })] }));
  ok('Tên món có tab → cân nhận dấu cách → vẫn khớp', tab.muc === 'san_sang', tab.cau?.vi);
  const lau = dong0(CP({ o: [O({ tren_can: [{ plu: 23, ten: 'Thăn ngoại cắt lát #0142', phim: ['F5'], bao_luc: truoc(PHUT_BAO_CAN_CU + 3) }] })] }));
  ok(`Máy quầy báo ${PHUT_BAO_CAN_CU + 3} phút trước → vẫn sẵn sàng nhưng nói rõ lần báo`, lau.muc === 'san_sang'
     && /\(máy quầy báo 8 phút trước\)$/.test(lau.cau.vi), lau.cau.vi);
  const hai = dong0(CP({ o: [O({ tren_can: [{ plu: 23, ten: 'Thăn ngoại cắt lát #0141', phim: [], bao_luc: truoc(1) },
                                          { plu: 23, ten: 'Thăn ngoại cắt lát #0142', phim: ['A1'], bao_luc: truoc(3) }] })] }));
  ok('Hai máy quầy (hai cân): một cân đã đổi tên → sẵn sàng theo cân đó', hai.muc === 'san_sang' && /phím A1/.test(hai.cau.vi), hai.cau.vi);
  const tra = dong0(CP({ o: [O({ dang_giu: false })] }));
  ok('Ô đã trả (tảng bán hết / phiên huỷ) → không xét trên cân', tra.muc === null && tra.cau === null);
  const dai = dong0(CP({ o: [O({ ten_hang: 'Thăn ngoại bò Úc Black Angus cắt lát dày', so_tang: 7,
                                 tren_can: [{ plu: 30, ten: 'Thăn ngoại bò Úc B #0007', phim: ['F1'], bao_luc: truoc(1) }] })] }));
  ok('Tên dài: so với ĐÚNG tên đã cắt mà danh mục cân gửi (24 ký tự, giữ số tảng)', dai.muc === 'san_sang'
     && dai.tenMuon === 'Thăn ngoại bò Úc B #0007', `${dai.tenMuon} · ${dai.muc}`);
});

// ===========================================================================
await nhom('1b · 0090: MÁY QUẦY CHƯA XÁC NHẬN LẦN GỬI GẦN NHẤT → KHÔNG "SẴN SÀNG" (rà soát 11/10/2026)', async () => {
  // Beeftown Cân 2.9.2 báo tên ô mới sau một lần gửi chưa đọc lại được cân (cổng hai chiều bận, gửi rơi về 33571 mà cân bỏ
  // qua) → trang xanh "Cân sẵn sàng" khi cân vẫn tên cũ, tem in sai số tảng. 2.9.3 báo thêm cờ chua_xac_nhan.
  const chuaXn = { plu: 23, ten: 'Thăn ngoại cắt lát #0142', phim: ['F5'], bao_luc: truoc(1), chua_xac_nhan: true };
  const d = dong0(CP({ o: [O({ tren_can: [chuaXn] })], may: [MAY({ chua_xac_nhan: true, chua_xac_nhan_tu: truoc(3) })] }));
  ok('HỒI QUY 11/10: đúng tên mới nhưng máy quầy chưa xác nhận lần gửi gần nhất → vàng "chưa chắc", KHÔNG "Cân sẵn sàng"',
     d.muc === 'chua_xac_nhan' && !/sẵn sàng/i.test(d.cau.vi) && !/ready/i.test(d.cau.en)
     && /^Chưa chắc cân đã có Thăn ngoại cắt lát #0142 \(PLU 23\)/.test(d.cau.vi) && /chưa in tem/.test(d.cau.vi)
     && /Not sure the scale has Thăn ngoại cắt lát #0142 \(PLU 23\)/.test(d.cau.en) && /do not print yet/.test(d.cau.en), JSON.stringify(d));
  const hai = dong0(CP({ o: [O({ tren_can: [chuaXn, { plu: 41, ten: 'Thăn ngoại cắt lát #0142', phim: ['A1'], bao_luc: truoc(2), chua_xac_nhan: false }] })] }));
  ok('Hai máy quầy: máy đã xác nhận có đúng tên → sẵn sàng theo máy đó (PLU 41)', hai.muc === 'san_sang' && /= PLU 41 · phím A1/.test(hai.cau.vi), hai.cau.vi);
  const cu = dong0(CP({ o: [O({ tren_can: [{ ...chuaXn, ten: 'Thăn ngoại cắt lát #0141' }] })] }));
  ok('Máy chưa xác nhận còn tên cũ → vẫn "còn tên cũ" (không in)', cu.muc === 'ten_cu', cu.cau.vi);
  const cu29 = dong0(CP({ o: [O({ tren_can: [{ plu: 23, ten: 'Thăn ngoại cắt lát #0142', phim: ['F5'], bao_luc: truoc(1) }] })] }));
  ok('Máy quầy trước 2.9.3 (không có cờ) → như 0061: sẵn sàng theo tên', cu29.muc === 'san_sang', cu29.cau.vi);
  const may = tomTatCanPhien(CP({ o: [O({ tren_can: [chuaXn] })], may: [MAY({ chua_xac_nhan: true, chua_xac_nhan_tu: truoc(3) })] })).may;
  ok('Câu máy quầy nói lần gửi gần nhất chưa được cân xác nhận (đã 3 phút) — xem ô Cân của Beeftown Cân',
     /Lần gửi gần nhất của Beeftown Cân chưa được cân xác nhận \(đã 3 phút\)/.test(may.vi) && /ô Cân/.test(may.vi)
     && /has not been confirmed by the scale \(for 3 min\)/.test(may.en), `${may.vi} | ${may.en}`);
  ok('Chưa xác nhận → trang vẫn hiện nút Xem lại cân (mức khác san_sang)',
     /d\.muc !== null && d\.muc !== 'san_sang'/.test(doc('web/src/pages/noi-bo/kho/pha-loc/[id].astro')));
  ok('Component: chỉ "san_sang" mới xanh — mức mới vàng, role="alert"', /m === 'san_sang' \? 'xong' : 'luu-y'/.test(doc('web/src/components/kho/DoiChieuCan.astro')));
});

// ===========================================================================
await nhom('2 · MÁY QUẦY: TỰ GỬI, LẦN BÁO CUỐI', async () => {
  ok('Tự gửi bật → "tự gửi tên mới xuống cân sau khoảng 15–60 giây — bấm Xem lại cân"',
     /tự gửi tên mới xuống cân sau khoảng 15–60 giây .* — bấm Xem lại cân/.test(tomTatCanPhien(CP()).may.vi), tomTatCanPhien(CP()).may.vi);
  const tat = tomTatCanPhien(CP({ may: [MAY({ tu_gui: false, bao_luc: truoc(4) })] })).may;
  ok('Tự gửi tắt → quản lý bấm Gửi xuống cân; nói lần báo', /^Tự gửi đang tắt ở máy quầy \(báo 4 phút trước\)/.test(tat.vi), tat.vi);
  ok('Không máy nào → câu nói rõ trang không biết', /Chưa máy quầy nào chạy Beeftown Cân 2.9/.test(tomTatCanPhien(CP({ may: [] })).may.vi));
  ok('Không ô nào đang giữ → không câu máy quầy', tomTatCanPhien(CP({ o: [O({ dang_giu: false })] })).may === null);
});

// ===========================================================================
await nhom('3 · ĐỐI CHIẾU TEM CÂN IN / NHÃN ĐÃ QUÉT', async () => {
  ok('11 in, 11 quét → khớp', dong0(CP()).doiChieu.vi === 'Cân in 11 tem mã 10011, phiên quét 11 — khớp');
  const thieu = dong0(CP({ o: [O({ in: 12, quet: 11 })] })).doiChieu.vi;
  ok('"Cân in 12 tem ô 10011, phiên quét 11" — 1 tem chưa quét', /^Cân in 12 tem mã 10011, phiên quét 11 — 1 tem chưa quét/.test(thieu), thieu);
  const du = dong0(CP({ o: [O({ in: 9, quet: 11 })] })).doiChieu.vi;
  ok('In ít hơn quét → nhật ký cân chưa đủ (không đổ lỗi người quét)', /nhật ký cân chưa đủ/.test(du), du);
  ok('Có nhật ký → nói lần gửi cuối theo giờ VN (12:00 − 1 phút → 11:59)', /lần cuối lúc 11:59/.test(tomTatCanPhien(CP()).nhatKy.vi),
     tomTatCanPhien(CP()).nhatKy.vi);
  ok('Chưa nhật ký nào → "0 tem không có nghĩa cân chưa in"', /không có nghĩa cân chưa in/.test(tomTatCanPhien(CP({ may: [] })).nhatKy.vi));
  ok('Số đọc từ database dạng chuỗi ("12") vẫn so đúng', dong0(CP({ o: [O({ in: '12', quet: '11' })] })).soIn === 12);
});

// ===========================================================================
await nhom('4 · NHÃN IN BẰNG MÃ THƯỜNG TRONG PHIÊN THEO TẢNG', async () => {
  const nt = [{ mat_hang_id: 'm1', ten: 'Thăn ngoại cắt lát', ma_can: '301', so_nhan: 2, so_kg: 1.5 }];
  const c = tomTatCanPhien(CP({ nhan_thuong: nt })).nhanThuong;
  ok('2 nhãn mã thường 301 (1,5 kg — số kiểu Việt) → cảnh báo, in lại bằng phím ô của phiên (tên + số tảng), −1 bỏ nhãn cũ',
     c.length === 1 && c[0].vi.startsWith('2 nhãn Thăn ngoại cắt lát (1,5 kg) in bằng mã thường 301 — tem không có số tảng')
     && /In lại bằng phím ô của phiên \(Thăn ngoại cắt lát #0142\)/.test(c[0].vi) && /−1/.test(c[0].vi) && /\(1.5 kg\)/.test(c[0].en), c[0]?.vi);
  const chuaO = tomTatCanPhien(CP({ o: [], nhan_thuong: nt })).nhanThuong;
  ok('Chưa giao ô → bảo giao ô mã rồi in lại', /Giao ô mã rồi in lại/.test(chuaO[0]?.vi ?? ''));
  ok('Phiên không theo tảng → không cảnh báo', tomTatCanPhien(CP({ theo_tang: false, nhan_thuong: nt })).nhanThuong.length === 0);
});

// ===========================================================================
await nhom('5 · ĐỌC KHO: KHÔNG BAO GIỜ NÉM, KHÔNG BAO GIỜ ĐOÁN', async () => {
  const rpc = kq => ({ rpc: async () => (kq instanceof Error ? (() => { throw kq; })() : kq) });
  ok('Database chưa chạy 0061 (hàm không có) → null', await docCanPhien(rpc({ data: null, error: { code: 'PGRST202', message: 'kho_phien_pha_can' } }), 'p') === null);
  ok('Mạng hỏng (fetch ném) → null', await docCanPhien(rpc(new TypeError('fetch failed')), 'p') === null);
  ok('Dạng lạ → null', await docCanPhien(rpc({ data: { o: 'x' }, error: null }), 'p') === null);
  const tot = await docCanPhien(rpc({ data: CP({ o: [O({ in: '3', quet: '2', in_kg: '1.5', quet_kg: '1', tren_can: null })] }), error: null }), 'p');
  ok('Đọc được: số từ chuỗi, tren_can null → []', tot?.o[0].in === 3 && tot.o[0].quet_kg === 1 && Array.isArray(tot.o[0].tren_can)
     && tot.o[0].tren_can.length === 0, JSON.stringify(tot?.o?.[0]));
  let loi = '';
  try { await docGiaoOMaCan(rpc({ data: null, error: { message: 'Tài khoản của bạn không xem được kho của chi nhánh này' } }), 'cn'); }
  catch (e) { loi = e.message; }
  ok('docGiaoOMaCan lỗi → ném (danh mục cân không gửi tên ô thiếu số tảng)', /không xem được kho/.test(loi), loi);
  const g = await docGiaoOMaCan(rpc({ data: [{ o_ma_id: 'o1', con_kg: '1.32', con_goi: '3', con_giu: true }], error: null }), 'cn');
  ok('docGiaoOMaCan: con_kg / con_goi thành số', g[0].con_kg === 1.32 && g[0].con_goi === 3);
  const kq = await giaoOMa(rpc({ data: [{ ten: 'Thăn ngoại cắt lát', so_o: 1, ma_can: '10011' }], error: null }), 'p');
  ok('Giao ô mã: câu không hứa "cân đã đổi" — tự gửi chỉ khi bật, không thì quản lý bấm Gửi; chờ dòng Cân sẵn sàng (Xem lại cân)',
     kq.ok && /bật Tự gửi thì tự gửi tên mới xuống cân sau khoảng 15–60 giây; không thì quản lý mở Beeftown Cân bấm Gửi xuống cân/.test(kq.cau)
     && /Chờ dòng "Cân sẵn sàng" hiện xanh \(bấm Xem lại cân\) rồi mới in tem/.test(kq.cau)
     && /wait for the "Scale ready" line/i.test(kq.cauEn), kq.cau);
  // Database chưa chạy 0061 (Beeftown Cân 2.9 cập nhật trước): đọc view như 2.8, không hỏng cả việc gửi xuống cân.
  const goiView = [];
  const clientCu = {
    rpc: async () => ({ data: null, error: { code: 'PGRST202', message: 'Could not find the function public.kho_can_giao_o_ma(p_chi_nhanh_id)' } }),
    from(ten) { const q = { ten, loc: [] }; goiView.push(q); const b = { select: () => b, eq: (k, v) => { q.loc.push([k, v]); return b; }, order: () => b,
      then: (xong) => Promise.resolve({ data: [{ o_ma_id: 'o1', con_kg: '2', con_goi: 1, con_giu: true }], error: null }).then(xong) }; return b; },
  };
  const cu = await docGiaoOMaCan(clientCu, 'cn-1');
  ok('Kho chưa có kho_can_giao_o_ma → đọc view kho_v_o_ma_giao của đúng chi nhánh (như 2.8)', cu.length === 1 && cu[0].con_kg === 2
     && goiView[0]?.ten === 'kho_v_o_ma_giao' && goiView[0].loc.some(([k, v]) => k === 'chi_nhanh_id' && v === 'cn-1'), JSON.stringify(goiView));
  let loiKhac = '';
  try { await docGiaoOMaCan({ rpc: async () => ({ data: null, error: { code: 'PGRST202', message: 'Could not find the function public.ham_khac' } }) }, 'cn'); }
  catch (e) { loiKhac = e.message; }
  ok('Lỗi "thiếu hàm" của hàm KHÁC → vẫn ném (không giấu hỏng thật)', /ham_khac/.test(loiKhac), loiKhac);
});

// ===========================================================================
await nhom('6 · TIẾNG ANH KHÔNG LẪN CHỮ VIỆT (tên hàng là dữ liệu — dùng tên không dấu)', async () => {
  const OEn = sua => O({ ten_hang: 'Striploin slices', ...sua,
    tren_can: sua?.tren_can ?? [{ plu: 23, ten: 'Striploin slices #0142', phim: ['F5'], bao_luc: truoc(9) }] });
  const kichBan = [
    CP({ o: [OEn()] }), CP({ o: [OEn({ tren_can: [] })] }), CP({ o: [OEn({ tren_can: [] })], may: [] }),
    CP({ o: [OEn({ tren_can: [{ plu: 23, ten: 'Striploin slices #0141', phim: [], bao_luc: truoc(1) }], in: 12, quet: 11 })] }),
    CP({ o: [OEn({ in: 3, quet: 5 })], may: [MAY({ tu_gui: false, nhat_ky_luc: null })],
         nhan_thuong: [{ mat_hang_id: 'm1', ten: 'Striploin slices', ma_can: '301', so_nhan: 1, so_kg: 0.5 }] }),
    CP({ o: [], nhan_thuong: [{ mat_hang_id: 'm9', ten: 'Tenderloin', ma_can: '302', so_nhan: 2, so_kg: 1 }] }),
    CP({ o: [OEn({ tren_can: [{ plu: 23, ten: 'Striploin slices #0142', phim: ['F5'], bao_luc: truoc(1), chua_xac_nhan: true }] })],
         may: [MAY({ chua_xac_nhan: true, chua_xac_nhan_tu: truoc(12) })] }),
  ];
  const sot = [];
  let soCau = 0;
  for (const cp of kichBan) {
    const tt = tomTatCanPhien(cp);
    const en = [...tt.dong.flatMap(d => [d.cau?.en, d.doiChieu.en]), tt.may?.en, tt.nhatKy.en, ...tt.nhanThuong.map(c => c.en)].filter(Boolean);
    soCau += en.length;
    for (const c of en) if (VIET.test(c)) sot.push(c);
  }
  ok(`${soCau} câu tiếng Anh không lẫn chữ Việt`, soCau >= 20 && sot.length === 0, sot.slice(0, 3).join(' | '));
  const comp = boChuThich(doc('web/src/components/kho/DoiChieuCan.astro'));
  const chuViet = [...comp.matchAll(/>([^<>{}]*[^\x00-\x7F][^<>{}]*)</g)].map(m => m[1].trim()).filter(x => VIET.test(x));
  ok('Component không viết chữ Việt thẳng vào HTML (mọi chữ qua [nn])', chuViet.length === 0, chuViet.join(' | '));
});

// ===========================================================================
await nhom('7 · TRANG PHA LÓC NỐI ĐÚNG', async () => {
  const trang = doc('web/src/pages/noi-bo/kho/pha-loc/[id].astro');
  const comp = doc('web/src/components/kho/DoiChieuCan.astro');
  ok('Trang đọc kho_phien_pha_can (docCanPhien) cùng lúc với ô mã, soạn bằng tomTatCanPhien',
     /docCanPhien\(k\.client, phien\.id\)/.test(trang) && /tomTatCanPhien\(cp\)/.test(trang));
  ok('Bước Cân & quét: khung ô mã có DoiChieuCan kieu="can"; bước Kết quả và màn Xem: kieu="doi_chieu"',
     (trang.match(/<DoiChieuCan tomTat=\{tomTatCan\} kieu="can" \/>/g) ?? []).length === 1
     && (trang.match(/<DoiChieuCan tomTat=\{tomTatCan\} kieu="doi_chieu" \/>/g) ?? []).length === 2);
  ok('Chữ hướng dẫn ô mã không còn bắt mở Beeftown Cân bấm Gửi xuống cân; nói chờ "Cân sẵn sàng"',
     !/mở Beeftown Cân bấm Gửi xuống cân/.test(trang) && /Chờ dòng "Cân sẵn sàng" hiện xanh/.test(trang));
  ok('Component không gọi database, không <script>', !/\.rpc\(|\.from\(|<script/i.test(comp));
  ok('hangChoCan đọc ô qua docGiaoOMaCan (kho_can_giao_o_ma)', /docGiaoOMaCan\(client, chiNhanhId\)/.test(doc('web/src/lib/kho/danh-muc-can.ts'))
     && /rpc\('kho_can_giao_o_ma'/.test(doc('web/src/lib/kho/o-ma.ts')));
});

process.exit(ketThuc('TRANG PHA LÓC BIẾT Ô ĐÃ LÊN CÂN'));
