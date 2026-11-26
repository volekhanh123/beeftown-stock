/**
 * BEEFTOWN — KHO: LƯU TẠM LƯỢT QUÉT KHI MẤT MẠNG (web/src/lib/kho/quet-luu-tam.ts, QuetMa.astro)
 * =============================================================================================
 *
 *     node test/test-kho-quet-luu-tam-web.mjs
 *
 * Kho quét nhãn bằng camera điện thoại; trong kho lạnh hay mất sóng. Ô quét hỏi mạng trước khi gửi; không tới được
 * máy chủ thì lượt quét của trang ghi sổ (pha lóc, đếm quầy) vào hàng chờ trên máy và tự gửi lại khi có mạng. Phần
 * chạy trong trình duyệt (tắt mạng thật, gửi lại, chặn nút) kiểm ở web/kiem-tra/thu-quet-luu-tam.mjs (Chromium).
 * File này kiểm phần thuần và chỗ nó khớp với trang, database:
 *
 *   1. Hàm thuần:
 *      · taoLuot chỉ mang viec, ma_quet và các ô của guiLai — không bao giờ ô gõ tay, so_ra, phien_ban; mã cắt
 *        khoảng trắng, đếm nhãn như máy chủ (tachDanhSachMa); ô trống, ma_gui hỏng, không có người, địa chỉ ngoài
 *        kho → null (không lưu gì còn hơn lưu một lượt gửi lại có thể cộng đôi); giá trị File bị bỏ.
 *      · Hàng chờ: chữ hỏng → rỗng; lượt sai dạng bị bỏ, lượt bản cũ thiếu cau_kho vẫn đọc được; cùng ma_gui
 *        không bao giờ hai bản; ghiLanThu đếm lần, thôi tự gửi khi kho trả câu lỗi / bị chuyển / đủ 5 lần, giữ câu của
 *        kho; choGuiLai chỉ mở lại lượt của đúng người; lượt của người khác (máy dùng chung) tách riêng.
 *      · xepLoaiTraLoi: chỉ "chuyển hướng về chính trang + câu báo xong" mới là đã nhận; câu lỗi là tu-choi (giữ,
 *        thôi tự gửi); không thấy câu báo, không chuyển hướng, 5xx là chua-nhan (gửi lại sau); fetch ném lỗi là mat-mang; trang đăng nhập và
 *        màn máy dùng chung là dang-nhap; trang khác là bi-chuyen. Đường dẫn có ?… hay / cuối vẫn là chính trang.
 *      · Bản nháp: đúng người, đúng trang, còn hạn 12 giờ; ô trống xóa bản của trang; bản quá hạn bị dọn; giờ máy
 *        lùi (luc ở tương lai) → không đưa lại.
 *   2. gio-vn: giờ trong câu theo giờ Việt Nam — 23:50 hôm qua nhìn từ 00:10 hôm nay có ghi ngày.
 *   3. cau-chu: mọi câu đủ vi / en; câu vừa lưu nói rõ CHƯA vào sổ; "đã nhận" chỉ ở câu của lượt kho đã nhận;
 *      không "thành công"; không chữ cấm.
 *   4. Khớp với trang (đọc mã nguồn): QuetMa có data-nguoi lấy từ phiên, data-gui-lai, script gọi ganQuetLuuTam,
 *      nạp bộ đọc iPhone ngay khi mở trang, camera phát input; BaoKho đánh dấu câu báo data-bao-ket-qua; pha lóc và
 *      đếm quầy khai guiLai với đúng các ô ẩn có trong CÙNG form, pha lóc không kèm so_ra / phien_ban và máy chủ bỏ
 *      qua bước lưu gõ tay khi thiếu so_ra; ba trang chỉ đọc mã không khai guiLai; hai trang ghi sổ chuyển hướng
 *      về chính trang ở mọi kết cục đã xử lý; file hỏi mạng có thật; thư viện trình duyệt không kéo mã máy chủ.
 *   5. bam-hai-lan: hai hàm database của lượt quét chống cộng đôi theo ma_gui — kiểm thử của chúng còn đó.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { timChuoiCam } from '../../web/src/lib/chuoi-cam.js';
import {
  CAU_LUU_TAM, HAN_NHAP_MS, KHOA_HANG_CHO, KHOA_NHAP, SO_LAN_THU_TOI_DA, boKhoiHang, cauTheo, choGuiLai, chuHangCho,
  chuanDuong, cuaNguoi, cuaNguoiKhac, cuaTrang, demNhan, docHangCho, docNhap, ghiLanThu, ghiNhap, gioLuot, taoLuot,
  themVaoHang, xepLoaiTraLoi,
} from '../../web/src/lib/kho/quet-luu-tam.ts';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web');
const doc = p => readFileSync(join(GOC, p), 'utf8');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — LƯU TẠM LƯỢT QUÉT KHI MẤT MẠNG (WEB)');

const NGUOI_A = '11111111-1111-4111-8111-111111111111';
const NGUOI_B = '22222222-2222-4222-8222-222222222222';
const MA_GUI = '33333333-3333-4333-8333-333333333333';
const MA_GUI_2 = '44444444-4444-4444-8444-444444444444';
const PHA = '/noi-bo/kho/pha-loc/55555555-5555-4555-8555-555555555555';
const DEM = '/noi-bo/kho/quay/dem';
const LUC = Date.UTC(2026, 10, 26, 3, 0, 0);   // 10:00 giờ VN, 26/11/2026

const formPha = (maGui = MA_GUI) => [
  ['ma_gui', maGui], ['ma_gui_sua', MA_GUI_2], ['phien_ban', '7'], ['so_vao', '1'], ['so_ra', '3'],
  ['r0_mat_hang', 'x'], ['r0_so_kg', '1,5'], ['ma_quet', 'bỏ qua — lấy từ maQuet'],
];
const luotPha = (o = {}) => taoLuot({
  truong: formPha(), guiLai: ['ma_gui'], viec: 'quet', maQuet: ' 2010001002154\n2010001000709 ', duong: PHA,
  url: PHA, nguoi: NGUOI_A, luc: LUC, ...o,
});

// ===========================================================================
await nhom('1 · HÀM THUẦN: DỰNG LƯỢT, HÀNG CHỜ, XẾP LOẠI TRẢ LỜI, BẢN NHÁP', async () => {
  const l = luotPha();
  ok('Pha lóc: lượt mang đúng viec, ma_quet (đã cắt khoảng trắng), ma_gui — theo thứ tự đó',
    JSON.stringify(l?.truong) === JSON.stringify([['viec', 'quet'], ['ma_quet', '2010001002154\n2010001000709'], ['ma_gui', MA_GUI]]),
    JSON.stringify(l?.truong));
  ok('Pha lóc: KHÔNG mang so_ra, phien_ban, ô gõ tay (máy chủ sẽ không lưu lại phần gõ tay cũ)',
    !l.truong.some(([t]) => ['so_ra', 'phien_ban', 'so_vao', 'r0_so_kg', 'r0_mat_hang', 'ma_gui_sua'].includes(t)));
  ok('Lượt: khóa = ma_gui, đếm 2 nhãn, chưa thử lần nào, đang tự gửi, chưa có câu của kho',
    l.ma_gui === MA_GUI && l.so_nhan === 2 && l.lan_thu === 0 && l.dung === false && l.cau_kho === '' && l.nguoi === NGUOI_A);
  ok('Đếm nhãn như máy chủ: dòng, dấu phẩy, chấm phẩy, dấu cách', demNhan('2010001002154, 2010001000709;2010001002154 \n\n x') === 4);

  const dem = taoLuot({
    truong: [['vi_tri_id', 'q1'], ['kiem_ke_id', ''], ['ma_gui', MA_GUI], ['ma_gui_mo', MA_GUI_2], ['la', 'khác']],
    guiLai: ['ma_gui', 'ma_gui_mo', 'kiem_ke_id', 'vi_tri_id'], viec: 'quet', maQuet: '2010001002154', duong: DEM,
    url: `${DEM}?vi_tri=q1`, nguoi: NGUOI_A, luc: LUC,
  });
  ok('Đếm quầy: mang bốn ô ẩn khai trong guiLai (cả kiem_ke_id trống), bỏ ô lạ; địa chỉ gửi giữ ?…',
    dem && dem.truong.map(([t]) => t).join() === 'viec,ma_quet,vi_tri_id,kiem_ke_id,ma_gui,ma_gui_mo'
    && dem.truong.find(([t]) => t === 'kiem_ke_id')?.[1] === '' && dem.url === `${DEM}?vi_tri=q1` && dem.duong === DEM,
    JSON.stringify(dem));
  ok('Giá trị không phải chữ (File) bị bỏ', taoLuot({
    truong: [['ma_gui', MA_GUI], ['anh', { name: 'a.jpg' }]], guiLai: ['ma_gui', 'anh'], viec: 'quet', maQuet: '1',
    duong: PHA, url: PHA, nguoi: NGUOI_A, luc: LUC,
  })?.truong.every(([, v]) => typeof v === 'string'));
  ok('Ô quét trống / chỉ khoảng trắng → không lưu', luotPha({ maQuet: '  \n ' }) === null);
  ok('ma_gui hỏng / thiếu → không lưu (gửi lại có thể cộng đôi)',
    taoLuot({ truong: formPha('khong-phai-uuid'), guiLai: ['ma_gui'], viec: 'quet', maQuet: '1', duong: PHA, url: PHA, nguoi: NGUOI_A, luc: LUC }) === null
    && luotPha({ guiLai: [] }) === null);
  ok('Không có người đăng nhập → không lưu', luotPha({ nguoi: '' }) === null);
  ok('Địa chỉ ngoài kho → không lưu', luotPha({ url: '/noi-bo/dang-xuat' }) === null && luotPha({ duong: '/x', url: '/x' }) === null);
  ok('Đường dẫn chuẩn hóa: bỏ ?…, #…, / cuối', chuanDuong(`${PHA}/?a=1#b`) === PHA && chuanDuong('/') === '/');

  // Hàng chờ
  ok('Chữ hỏng / không phải mảng → hàng rỗng', docHangCho('{') .length === 0 && docHangCho('{"a":1}').length === 0
    && docHangCho(null).length === 0 && docHangCho('').length === 0);
  const hong = [{ ...l, ma_gui: 'x' }, { ...l, duong: '/noi-bo/khac' }, { ...l, so_nhan: '2' }, { ...l, truong: [['a']] },
    { ...l, nguoi: '' }, null, 7];
  ok('Lượt sai dạng bị bỏ, lượt đúng giữ', docHangCho(JSON.stringify([...hong, l])).length === 1);
  const cu = { ...l }; delete cu.cau_kho;
  ok('Lượt của bản trước (chưa có cau_kho) vẫn đọc được, cau_kho = \'\'',
    docHangCho(JSON.stringify([cu]))[0]?.cau_kho === '');
  ok('Ghi rồi đọc lại y nguyên', JSON.stringify(docHangCho(chuHangCho([l]))) === JSON.stringify([l]));
  const l2 = { ...l, ma_gui: MA_GUI_2, so_nhan: 5 };
  let ds = themVaoHang(themVaoHang([], l), l2);
  ds = themVaoHang(ds, { ...l, so_nhan: 9 });
  ok('Cùng ma_gui thêm lần hai → thay bản cũ, không hai bản; lượt mới nằm cuối',
    ds.length === 2 && ds.filter(x => x.ma_gui === MA_GUI).length === 1 && ds[1].ma_gui === MA_GUI && ds[1].so_nhan === 9);
  ok('Bỏ một lượt theo ma_gui', boKhoiHang(ds, MA_GUI).map(x => x.ma_gui).join() === MA_GUI_2);

  let t = ghiLanThu([l], MA_GUI, false);
  ok('Kho chưa ghi (database lỗi) → lan_thu 1, vẫn tự gửi', t[0].lan_thu === 1 && t[0].dung === false);
  for (let i = 1; i < SO_LAN_THU_TOI_DA; i++) t = ghiLanThu(t, MA_GUI, false);
  ok(`Đủ ${SO_LAN_THU_TOI_DA} lần → thôi tự gửi`, t[0].lan_thu === SO_LAN_THU_TOI_DA && t[0].dung === true);
  const tc = ghiLanThu([l], MA_GUI, true, '"Quầy thịt" đang có phiếu kiểm kê KK-0007 chưa xong');
  ok('Kho trả câu lỗi → thôi tự gửi ngay, giữ đúng câu của kho', tc[0].dung === true && /KK-0007/.test(tc[0].cau_kho));
  ok('Lần thử sau không có câu → giữ câu cũ', ghiLanThu(tc, MA_GUI, false)[0].cau_kho === tc[0].cau_kho);
  const lb = { ...l2, nguoi: NGUOI_B, dung: true, lan_thu: 5 };
  const mo = choGuiLai([tc[0], lb], NGUOI_A);
  ok('Gửi ngay: mở lại lượt đã thôi của đúng người, lượt người khác không đổi',
    mo[0].dung === false && mo[0].lan_thu === 0 && mo[1].dung === true && mo[1].lan_thu === 5);
  ok('Máy dùng chung: lượt tách theo người, theo trang',
    cuaNguoi([l, lb], NGUOI_A).length === 1 && cuaNguoiKhac([l, lb], NGUOI_A)[0]?.nguoi === NGUOI_B
    && cuaTrang([l, lb], NGUOI_A, `${PHA}/`).length === 1 && cuaTrang([l, lb], NGUOI_A, DEM).length === 0
    && cuaTrang([l, lb], NGUOI_B, PHA).map(x => x.ma_gui).join() === MA_GUI_2);

  // Xếp loại trả lời
  const tl = (redirected, url, status = 200) => ({ redirected, url, status });
  const goc = 'https://beeftown.vn';
  ok('fetch ném lỗi → mat-mang', xepLoaiTraLoi(null, PHA) === 'mat-mang');
  ok('Không chuyển hướng (trang dựng lại vì database lỗi), 500, 403 → chua-nhan',
    xepLoaiTraLoi(tl(false, goc + PHA), PHA, 'loi') === 'chua-nhan' && xepLoaiTraLoi(tl(false, goc + PHA, 500), PHA) === 'chua-nhan'
    && xepLoaiTraLoi(tl(false, goc + PHA, 403), PHA, 'xong') === 'chua-nhan');
  ok('Chuyển hướng về chính trang + câu "xong" → da-nhan (cả khi có ?… và / cuối)',
    xepLoaiTraLoi(tl(true, goc + PHA), PHA, 'xong') === 'da-nhan'
    && xepLoaiTraLoi(tl(true, `${goc}${DEM}/?vi_tri=q1`), DEM, 'xong') === 'da-nhan');
  ok('Chuyển hướng về chính trang nhưng câu lỗi → tu-choi (giữ, thôi tự gửi, không tự xóa)',
    xepLoaiTraLoi(tl(true, goc + PHA), PHA, 'loi') === 'tu-choi');
  ok('Chuyển hướng về chính trang mà không thấy câu báo (lượt xem khác đọc mất cookie câu báo) → chua-nhan (gửi lại sau)',
    xepLoaiTraLoi(tl(true, goc + PHA), PHA, null) === 'chua-nhan' && xepLoaiTraLoi(tl(true, goc + PHA), PHA) === 'chua-nhan');
  ok('Trang chuyển hướng 500 sau khi đã xử lý: câu báo quyết định',
    xepLoaiTraLoi(tl(true, goc + PHA, 500), PHA, null) === 'chua-nhan' && xepLoaiTraLoi(tl(true, goc + PHA, 500), PHA, 'xong') === 'da-nhan');
  ok('Trang đăng nhập / màn máy dùng chung → dang-nhap (chưa xử lý)',
    xepLoaiTraLoi(tl(true, `${goc}/noi-bo/dang-nhap?x=1`), PHA, 'loi') === 'dang-nhap'
    && xepLoaiTraLoi(tl(true, `${goc}/noi-bo/kho/may`), PHA) === 'dang-nhap'
    && xepLoaiTraLoi(tl(true, `${goc}/noi-bo/kho/may/mo`), PHA) === 'dang-nhap');
  ok('Trang khác (mất quyền, phiên pha khác) → bi-chuyen',
    xepLoaiTraLoi(tl(true, `${goc}/noi-bo`), PHA, 'xong') === 'bi-chuyen'
    && xepLoaiTraLoi(tl(true, `${goc}/noi-bo/kho/pha-loc`), PHA, 'xong') === 'bi-chuyen'
    && xepLoaiTraLoi(tl(true, `${goc}/noi-bo/kho/mayxyz`), PHA, 'xong') === 'bi-chuyen');
  ok('Địa chỉ cuối hỏng → chua-nhan', xepLoaiTraLoi(tl(true, 'khong la url'), PHA, 'xong') === 'chua-nhan');

  // Bản nháp
  const chu = ghiNhap(null, `${PHA}?ra=3`, NGUOI_A, '2010001002154', LUC);
  ok('Nháp: ghi rồi đọc lại đúng trang (bỏ ?…), đúng người',
    docNhap(chu, PHA, NGUOI_A, LUC + 1000)?.ma_quet === '2010001002154');
  ok('Nháp: người khác trên cùng máy không thấy', docNhap(chu, PHA, NGUOI_B, LUC + 1000) === null);
  ok('Nháp: trang khác không thấy', docNhap(chu, DEM, NGUOI_A, LUC + 1000) === null);
  ok(`Nháp: quá ${HAN_NHAP_MS / 3600000} giờ → không đưa lại`, docNhap(chu, PHA, NGUOI_A, LUC + HAN_NHAP_MS) === null
    && docNhap(chu, PHA, NGUOI_A, LUC + HAN_NHAP_MS - 1) !== null);
  ok('Nháp: giờ máy lùi (bản nháp ở tương lai) → không đưa lại', docNhap(chu, PHA, NGUOI_A, LUC - 60_000) === null);
  ok('Nháp: ô trống → xóa bản của trang', docNhap(ghiNhap(chu, PHA, NGUOI_A, '  ', LUC + 5), PHA, NGUOI_A, LUC + 10) === null);
  const hai = ghiNhap(chu, DEM, NGUOI_A, '1', LUC + HAN_NHAP_MS + 1);
  ok('Nháp: ghi bản mới thì dọn bản quá hạn của trang khác', !(PHA in JSON.parse(hai)) && DEM in JSON.parse(hai));
  ok('Nháp: chữ hỏng → không có gì, ghi đè được', docNhap('{', PHA, NGUOI_A, LUC) === null
    && docNhap(ghiNhap('[1,2]', PHA, NGUOI_A, '9', LUC), PHA, NGUOI_A, LUC)?.ma_quet === '9');
  ok('Hai khóa localStorage riêng, có tiền tố bt-kho-', KHOA_HANG_CHO !== KHOA_NHAP
    && KHOA_HANG_CHO.startsWith('bt-kho-') && KHOA_NHAP.startsWith('bt-kho-'));
});

// ===========================================================================
await nhom('2 · GIỜ VIỆT NAM TRONG CÂU', async () => {
  const luc2350 = Date.UTC(2026, 10, 26, 16, 50);   // 23:50 giờ VN, 26/11
  const luc0010 = Date.UTC(2026, 10, 26, 17, 10);   // 00:10 giờ VN, 27/11 (UTC vẫn là 26/11)
  ok('Cùng ngày VN → chỉ giờ', gioLuot(LUC, LUC + 3600_000) === '10:00');
  ok('23:50 hôm qua nhìn từ 00:10 hôm nay (giờ VN) → có ngày', gioLuot(luc2350, luc0010) === '23:50 ngày 26/11',
    gioLuot(luc2350, luc0010));
  ok('00:10 VN (UTC còn hôm qua) nhìn từ 00:20 VN → cùng ngày, chỉ giờ', gioLuot(luc0010, luc0010 + 600_000) === '00:10');
  ok('Giờ hỏng → chuỗi trống, không ném', gioLuot(NaN, LUC) === '');
  ok('Câu tiếng Anh cũng ghi ngày khi khác ngày',
    / on 26\/11/.test(CAU_LUU_TAM.daNhan(luc2350, 1, '', luc0010).en));
});

// ===========================================================================
await nhom('3 · CÂU THÔNG BÁO', async () => {
  const l = luotPha();
  const lDung = { ...ghiLanThu([l], MA_GUI, true, 'Đã cộng 1 nhãn. Chưa cộng — 2010001000709: mã hàng chưa gán món')[0] };
  const cau = {
    vuaLuu: CAU_LUU_TAM.vuaLuu(2), dangCho: CAU_LUU_TAM.dangCho([l, { ...l, ma_gui: MA_GUI_2, so_nhan: 1 }]),
    dung: CAU_LUU_TAM.dung(lDung, LUC), dungKhongCau: CAU_LUU_TAM.dung({ ...l, dung: true }, LUC),
    dangNhap: CAU_LUU_TAM.dangNhap(2), nguoiKhac: CAU_LUU_TAM.nguoiKhac(1),
    daNhan: CAU_LUU_TAM.daNhan(LUC, 2, 'Đã cộng 2 nhãn.', LUC), daNhanTrong: CAU_LUU_TAM.daNhan(LUC, 1, '', LUC),
    chan: CAU_LUU_TAM.chan([l]), chuaDoc: CAU_LUU_TAM.chuaDoc, chuaGui: CAU_LUU_TAM.chuaGui,
    khongLuuDuoc: CAU_LUU_TAM.khongLuuDuoc, hoiTaiLai: CAU_LUU_TAM.hoiTaiLai, duaLai: CAU_LUU_TAM.duaLai(3, LUC, LUC), taiLai: CAU_LUU_TAM.taiLai,
    guiNgay: CAU_LUU_TAM.guiNgay, bo: CAU_LUU_TAM.bo, hoiBo: CAU_LUU_TAM.hoiBo([l]),
  };
  const thieu = Object.entries(cau).filter(([, c]) => !(typeof c.vi === 'string' && c.vi && typeof c.en === 'string' && c.en));
  ok('Mọi câu đủ vi và en', thieu.length === 0, thieu.map(([k]) => k).join(', '));
  ok('cauTheo chọn đúng thứ tiếng', cauTheo('en', cau.bo) === cau.bo.en && cauTheo('vi', cau.bo) === cau.bo.vi);
  ok('Vừa lưu: nói rõ CHƯA vào sổ, chỉ trên máy này', /CHƯA vào sổ/.test(cau.vuaLuu.vi) && /trên máy này/.test(cau.vuaLuu.vi)
    && /NOT in the stock books/.test(cau.vuaLuu.en));
  ok('Đang chờ: tổng nhãn và số lượt (3 nhãn, 2 lượt quét)', /^3 nhãn \(2 lượt quét\)/.test(cau.dangCho.vi), cau.dangCho.vi);
  ok('"đã nhận" chỉ ở câu của lượt kho đã nhận',
    Object.entries(cau).filter(([k]) => !k.startsWith('daNhan')).every(([, c]) => !/đã nhận|received/i.test(c.vi + c.en))
    && /đã nhận/.test(cau.daNhan.vi) && /received/.test(cau.daNhan.en));
  ok('Đã nhận: chép câu của kho; không có câu thì kết thúc bằng dấu chấm',
    /: Đã cộng 2 nhãn\.$/.test(cau.daNhan.vi) && /\(1 nhãn\)\.$/.test(cau.daNhanTrong.vi));
  ok('Thôi tự gửi: chép nguyên câu của kho, nói gửi lại không cộng hai lần',
    /«Đã cộng 1 nhãn\. Chưa cộng — 2010001000709: mã hàng chưa gán món»/.test(cau.dung.vi)
    && /không bao giờ cộng hai lần/.test(cau.dung.vi) && /never counts twice/.test(cau.dung.en)
    && /nhiều lần gửi/.test(cau.dungKhongCau.vi));
  ok('Chặn nút: nói rõ vì sao (số sẽ thiếu nhãn)', /số sẽ thiếu/.test(cau.chan.vi) && /miss those labels/.test(cau.chan.en));
  ok('Hỏi bỏ: nói rõ nhãn sẽ không vào sổ, phải quét lại', /KHÔNG vào sổ/.test(cau.hoiBo.vi) && /quét lại/.test(cau.hoiBo.vi));
  ok('Số ít / số nhiều tiếng Anh', /^1 label /.test(CAU_LUU_TAM.dangCho([{ ...l, so_nhan: 1 }]).en)
    && /\(1 scan\)/.test(CAU_LUU_TAM.dangCho([{ ...l, so_nhan: 1 }]).en));
  const tatCa = Object.values(cau).flatMap(c => [c.vi, c.en]).join('\n');
  ok('Không "thành công" / "success"', !/thành công|success/i.test(tatCa));
  const cam = timChuoiCam(tatCa);
  ok('Không chữ cấm (chuoi-cam.js)', !cam || cam.length === 0, JSON.stringify(cam));
});

// ===========================================================================
await nhom('4 · KHỚP VỚI Ô QUÉT, CÁC TRANG VÀ CÂU BÁO', async () => {
  const quetMa = doc('web/src/components/kho/QuetMa.astro');
  ok('QuetMa: người đang đăng nhập lấy từ phiên máy chủ (data-nguoi)',
    /const nguoi = Astro\.locals\.phien\?\.nhanSu\.id \?\? '';/.test(quetMa) && /data-nguoi=\{nguoi\}/.test(quetMa));
  ok('QuetMa: data-nn, data-gui-lai (chỉ khi trang khai guiLai)',
    /data-nn=\{nn\}/.test(quetMa) && /data-gui-lai=\{guiLai \|\| undefined\}/.test(quetMa));
  ok('QuetMa: script gọi ganQuetLuuTam cho mọi ô quét',
    /import \{ ganQuetLuuTam \} from '\.\.\/\.\.\/lib\/kho\/quet-luu-tam-trinh-duyet\.ts';/.test(quetMa)
    && /querySelectorAll<HTMLElement>\('\[data-quet-ma\]'\)\.forEach\(goc => ganQuetLuuTam\(goc\)\)/.test(quetMa));
  ok('QuetMa: iPhone nạp bộ đọc mã ngay khi mở trang, không đợi bấm nút',
    /if \(!coDetector\) napEan13\(\)\.catch\(\(\) => \{\}\);/.test(quetMa)
    && quetMa.indexOf('if (!coDetector) napEan13()') < quetMa.indexOf("nut.addEventListener('click'"));
  ok('QuetMa: camera ghi mã thì phát sự kiện input (bản nháp chép theo input)',
    /o\.dispatchEvent\(new Event\('input', \{ bubbles: true \}\)\)/.test(quetMa));
  ok('QuetMa: nút gửi vẫn là nút submit thường (trang không JavaScript chạy y như cũ)',
    /<button type="submit" name="viec" value=\{viec\} class="nb-nut phu" formnovalidate data-quet-gui>/.test(quetMa));

  const baoKho = doc('web/src/components/kho/BaoKho.astro');
  ok('BaoKho: câu báo kết quả mang data-bao-ket-qua xong / loi (phần gửi lại đọc nó)',
    /data-bao-ket-qua=\{bao\.ok \? 'xong' : 'loi'\}/.test(baoKho));

  const trinhDuyet = doc('web/src/lib/kho/quet-luu-tam-trinh-duyet.ts');
  ok('Gửi lại: đọc [data-bao-ket-qua] của trang đích, theo chuyển hướng, cùng website',
    /querySelector<HTMLElement>\('\[data-bao-ket-qua\]'\)/.test(trinhDuyet) && /redirect: 'follow'/.test(trinhDuyet)
    && /credentials: 'same-origin'/.test(trinhDuyet));
  const nhapKhau = s => [...s.matchAll(/^import [^;]+ from '([^']+)';/gm)].map(m => m[1]);
  ok('Thư viện trình duyệt chỉ kéo phần thuần (không chung.ts, không supabase)',
    nhapKhau(trinhDuyet).every(p => ['./quet-luu-tam.ts', '../ngon-ngu-noi-bo.ts'].includes(p))
    && nhapKhau(doc('web/src/lib/kho/quet-luu-tam.ts')).every(p => ['../gio-vn.ts', './ma-vach.ts', '../ngon-ngu-noi-bo.ts'].includes(p)),
    JSON.stringify([nhapKhau(trinhDuyet), nhapKhau(doc('web/src/lib/kho/quet-luu-tam.ts'))]));
  ok('File hỏi mạng có thật (web/public/kho/js/ean13.js)', /'\/kho\/js\/ean13\.js'/.test(trinhDuyet)
    && existsSync(join(WEB, 'public/kho/js/ean13.js')));

  /** Form (từ <form đến </form>) chứa <QuetMa trong một trang. */
  const formCuaQuetMa = ma => {
    const i = ma.indexOf('<QuetMa');
    return ma.slice(ma.lastIndexOf('<form', i), ma.indexOf('</form>', i));
  };
  const guiLaiCua = ma => (formCuaQuetMa(ma).match(/<QuetMa[^>]*\sguiLai="([^"]*)"/)?.[1] ?? '').split(/\s+/).filter(Boolean);
  const oAn = ma => new Set([...formCuaQuetMa(ma).matchAll(/<input type="hidden" name="([a-z_]+)"/g)].map(m => m[1]));

  const pha = doc('web/src/pages/noi-bo/kho/pha-loc/[id].astro');
  const dem = doc('web/src/pages/noi-bo/kho/quay/dem.astro');
  for (const [ten, ma, mongDoi] of [
    ['Pha lóc', pha, ['ma_gui']],
    ['Đếm quầy', dem, ['ma_gui', 'ma_gui_mo', 'kiem_ke_id', 'vi_tri_id']],
  ]) {
    const gl = guiLaiCua(ma);
    const an = oAn(ma);
    ok(`${ten}: QuetMa khai guiLai = ${mongDoi.join(' ')}`, gl.join() === mongDoi.join(), gl.join());
    ok(`${ten}: mọi ô của guiLai là ô ẩn trong CÙNG form với ô quét`, gl.length > 0 && gl.every(t => an.has(t)),
      `${gl.join()} / ${[...an].join()}`);
  }
  ok('Pha lóc: gửi lại không kèm so_ra / phien_ban (phần gõ tay)', !guiLaiCua(pha).some(t => ['so_ra', 'phien_ban'].includes(t))
    && oAn(pha).has('so_ra'));
  ok('Pha lóc: máy chủ chỉ lưu phần gõ tay khi form có so_ra — thiếu thì chỉ cộng nhãn',
    /if \(form\.has\('so_ra'\)\) \{\s*const luu = await luuPhienPha\(/.test(pha) && /\} else daLuu = true;/.test(pha)
    && /if \(daLuu && viec === 'quet'\) \{/.test(pha));
  ok('Pha lóc: mọi kết cục đã xử lý của lượt quét chuyển hướng về chính trang (ve → chuyenHuong(`${DUONG}…`))',
    /const ve = \(kq: KetQua, them = ''\) => chuyenHuong\(Astro, `\$\{DUONG\}\$\{them\}`, kq\);/.test(pha)
    && /if \(!maQuet\) return ve\(/.test(pha) && /return ve\(loi\.length > 0/.test(pha) && /return ve\(kqHai\(false, \{ vi: `Chưa cộng nhãn nào/.test(pha));
  ok('Đếm quầy: mọi kết cục đã xử lý của lượt quét chuyển hướng về chính trang (veQuay → DUONG?vi_tri=…)',
    /const veQuay = \(thamSo = ''\) => `\$\{DUONG\}\?vi_tri=/.test(dem)
    && /if \(!mo\.ok \|\| !mo\.id\) return chuyenHuong\(Astro, veQuay\(\)/.test(dem)
    && /return chuyenHuong\(Astro, veQuay\(\), loi\.length > 0/.test(dem)
    && /return chuyenHuong\(Astro, veQuay\(\), kqHai\(false, \{ vi: `Chưa cộng nhãn nào/.test(dem));
  ok('Đếm quầy: ma_gui_mo mở đúng một phiếu khi chưa có (gửi lại không mở hai phiếu)',
    /batDauKiemKe\(k\.client, chiNhanhId, quayChon\.id, 'theo_mat_hang', String\(form\.get\('ma_gui_mo'\) \?\? ''\)\)/.test(dem));

  for (const [ten, p] of [
    ['Quét nhãn', 'web/src/pages/noi-bo/kho/quet.astro'],
    ['Kiểm kê', 'web/src/pages/noi-bo/kho/kiem-ke/[id].astro'],
    ['Phiếu chuyển / xuất', 'web/src/pages/noi-bo/kho/xuat/[id].astro'],
  ]) {
    const ma = doc(p);
    ok(`${ten}: chỉ đọc mã — QuetMa không khai guiLai (không lưu tạm lượt, chỉ giữ mã trong ô)`,
      /<QuetMa/.test(ma) && !/<QuetMa[^>]*guiLai/.test(ma));
  }
});

// ===========================================================================
await nhom('5 · DATABASE CHỐNG CỘNG ĐÔI THEO ma_gui (gửi lại an toàn)', async () => {
  ok('kho_quet_kiem_ke: kiểm thử "Phát lại lượt 1 (cùng ma_gui) → không cộng đôi" còn trong test-kho-quay.mjs',
    doc('crm/test/test-kho-quay.mjs').includes("ok('Phát lại lượt 1 (cùng ma_gui) → không cộng đôi'"));
  ok('kho_quet_phien_pha: kiểm thử "Gửi lại cùng lượt → da_co, không cộng đôi" còn trong test-kho-pha-loc-quet.mjs',
    doc('crm/test/test-kho-pha-loc-quet.mjs').includes("ok('Gửi lại cùng lượt → da_co, không cộng đôi'"));
  ok('kho_bat_dau_kiem_ke: cùng ma_gui trả lại đúng phiếu đã mở', /select id into v_id from kho_kiem_ke where ma_gui = p_ma_gui;\s*if found then\s*return v_id;/
    .test(doc('crm/supabase/migrations/0023_kho_xuat_kiem_ke.sql')));
});

ketThuc('LƯU TẠM LƯỢT QUÉT');
