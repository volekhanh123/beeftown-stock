/**
 * BEEFTOWN — MÀN ĐẦU MỚI (ĐỢT 1 CỦA ĐỀ XUẤT GIAO DIỆN 12/11/2026): HỎI BÀN NHANH, THANH HÀNH ĐỘNG ĐIỆN THOẠI
 * =========================================================================================================
 *
 *     node test/test-cong-khai-man-dau.mjs
 *
 * Khánh duyệt ngày 12/11/2026:
 *   · Màn đầu: khi form hỏi bàn mở, hai ô chọn — ngày đến (14 ngày tới, giờ Việt Nam) và số người (1–8) — rồi
 *     "Hỏi bàn" gửi GET sang /dat-ban?ngay=…&so_khach=…#hb-gio. Trang Hỏi bàn chọn sẵn số người đó.
 *   · Thanh hành động dính đáy màn hình điện thoại ở trang chủ, Thực đơn, Đến Beeftown: Hỏi bàn (hoặc Khám phá
 *     thực đơn khi form chưa mở), Gọi và Chỉ đường chỉ khi đã công bố.
 *
 * Bất biến:
 *   1. ngayHoiNhanh: 14 ngày liền nhau kể từ hôm nay THEO GIỜ VIỆT NAM — 23:50 và 00:10 giờ VN là hai ngày khác
 *      nhau; qua tháng, qua năm đúng; nhãn ba thứ tiếng đúng thứ trong tuần, ngày-tháng không trùng nhau.
 *   2. soKhachTuUrl: chỉ nhận số nguyên 1–8; mọi thứ khác về 2 như ô số người trước đây.
 *   3. thanhHanhDong: đúng ba trang; nút chính theo công tắc form; Gọi / Chỉ đường chỉ khi hotline, Maps đã công
 *      bố và là đường dẫn an toàn; không có gì để hiện thì không có thanh; đường dẫn lạ không có thanh.
 *   4. Mã nguồn: form của màn đầu là GET tới nút chính + #hb-gio với đúng tên ô của trang Hỏi bàn; trang Hỏi bàn
 *      chọn sẵn số người từ địa chỉ và lựa chọn đó thắng bản nháp đã lưu; layout gắn thanh sau chân trang;
 *      thanh có bề mặt đen, ẩn từ 768px và trên màn thấp.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { datGio, traGio } from './dong-ho-gia.mjs';

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'web', 'src');
const nap = f => import(pathToFileURL(join(WEB, 'lib', f)).href);
const doc = (...p) => readFileSync(join(WEB, ...p), 'utf8');
const {
  ngayHoiNhanh, nhanSoKhach, soKhachTuUrl, thanhHanhDong, nutMoDau, SO_NGAY_HOI_NHANH, SO_KHACH_HOI_NHANH, SO_KHACH_MAC_DINH,
} = await nap('trang-cong-khai.ts');
const { chu, duongDanTuongUng, NGON_NGU } = await nap('chu.ts');
const { docNoiDung } = await nap('noi-dung.ts');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — MÀN ĐẦU MỚI: HỎI BÀN NHANH, THANH HÀNH ĐỘNG ĐIỆN THOẠI');
const NEN = await docNoiDung('vi', null);
const nd = (them = {}) => ({ ...NEN, ...structuredClone(them) });

// ===========================================================================
await nhom('1 · NGÀY CHỌN ĐƯỢC Ở MÀN ĐẦU: 14 NGÀY THEO GIỜ VIỆT NAM, NHÃN BA THỨ TIẾNG', async () => {
  const vi = ngayHoiNhanh('vi', '2026-11-12');
  ok('Đúng 14 ngày, ngày đầu là hôm nay', vi.length === SO_NGAY_HOI_NHANH && SO_NGAY_HOI_NHANH === 14 && vi[0].iso === '2026-11-12', vi.map(n => n.iso).join(' '));
  ok('Liền nhau, không trùng, đúng khuôn YYYY-MM-DD',
     vi.every((n, i) => /^\d{4}-\d{2}-\d{2}$/.test(n.iso) && (i === 0 || Date.parse(n.iso) - Date.parse(vi[i - 1].iso) === 86_400_000)));
  // 12/11/2026 là thứ Năm.
  ok('[vi] Hôm nay / Ngày mai / tên thứ, ngày dd/mm có số 0 đứng trước',
     vi[0].chu === 'Hôm nay, 12/11' && vi[1].chu === 'Ngày mai, 13/11' && vi[2].chu === 'Thứ Bảy, 14/11' && vi[3].chu === 'Chủ nhật, 15/11'
       && vi[4].chu === 'Thứ Hai, 16/11', vi.slice(0, 5).map(n => n.chu).join(' | '));
  const en = ngayHoiNhanh('en', '2026-11-12');
  ok('[en] Today / Tomorrow / "Saturday, 14 November" — tên thứ, tên tháng viết đủ', en[0].chu === 'Today, 12 November' && en[1].chu === 'Tomorrow, 13 November'
       && en[2].chu === 'Saturday, 14 November' && en[6].chu === 'Wednesday, 18 November',
     en.slice(0, 3).map(n => n.chu).join(' | '));
  const ko = ngayHoiNhanh('ko', '2026-11-12');
  ok('[ko] 오늘 / 내일 / "11월 14일 토요일" — 요일 viết đủ', ko[0].chu === '오늘, 11월 12일' && ko[1].chu === '내일, 11월 13일' && ko[2].chu === '11월 14일 토요일',
     ko.slice(0, 3).map(n => n.chu).join(' | '));
  for (const nn of NGON_NGU) {
    const ds = ngayHoiNhanh(nn, '2026-11-12');
    ok(`[${nn}] Nhãn 14 ngày không trùng nhau, không rỗng`, new Set(ds.map(n => n.chu)).size === 14 && ds.every(n => n.chu.trim()));
  }
  // Qua tháng và qua năm: 25/12/2026 → 07/01/2027. 01/01/2027 là thứ Sáu.
  const cuoiNam = ngayHoiNhanh('vi', '2026-12-25');
  const tet = cuoiNam.find(n => n.iso === '2027-01-01');
  ok('Qua năm: 01/01/2027 có trong danh sách, nhãn "Thứ Sáu, 01/01"', tet?.chu === 'Thứ Sáu, 01/01' && cuoiNam.at(-1).iso === '2027-01-07', tet?.chu ?? 'không thấy');
  // Năm nhuận: 28/02/2028 → 29/02/2028 có thật; 2027 thì không.
  ok('Năm nhuận: sau 28/02/2028 là 29/02/2028; sau 28/02/2027 là 01/03/2027 (không có ngày 29/02/2027)',
     ngayHoiNhanh('vi', '2028-02-28')[1].iso === '2028-02-29' && ngayHoiNhanh('vi', '2027-02-28')[1].iso === '2027-03-01');

  // Giờ Việt Nam: 23:50 ngày 12/11 và 00:10 ngày 13/11 (giờ VN) là hai ngày khác nhau dù cùng một ngày UTC.
  try {
    datGio('2026-11-12T16:50:00Z');   // 23:50 giờ VN, 12/11
    const truoc = ngayHoiNhanh('vi');
    datGio('2026-11-12T17:10:00Z');   // 00:10 giờ VN, 13/11
    const sau = ngayHoiNhanh('vi');
    ok('23:50 giờ VN: ngày đầu là 12/11 ("Hôm nay, 12/11")', truoc[0].iso === '2026-11-12' && truoc[0].chu === 'Hôm nay, 12/11', truoc[0].chu);
    ok('00:10 giờ VN: ngày đầu là 13/11 ("Hôm nay, 13/11") — không tự cộng giờ, không lấy ngày UTC',
       sau[0].iso === '2026-11-13' && sau[0].chu === 'Hôm nay, 13/11', sau[0].chu);
  } finally { traGio(); }
});

// ===========================================================================
await nhom('2 · SỐ NGƯỜI: NHÃN BA THỨ TIẾNG, ĐỌC TỪ ĐỊA CHỈ TRANG HỎI BÀN', async () => {
  ok('Số người chọn được 1–8, mặc định 2 — như ô số người của trang Hỏi bàn',
     JSON.stringify(SO_KHACH_HOI_NHANH) === '[1,2,3,4,5,6,7,8]' && SO_KHACH_MAC_DINH === 2);
  ok('[vi] "1 người", "2 người"', nhanSoKhach(1, 'vi') === '1 người' && nhanSoKhach(2, 'vi') === '2 người');
  ok('[en] "1 guest", "2 guests"', nhanSoKhach(1, 'en') === '1 guest' && nhanSoKhach(2, 'en') === '2 guests');
  ok('[ko] "1명", "8명"', nhanSoKhach(1, 'ko') === '1명' && nhanSoKhach(8, 'ko') === '8명');
  const BANG = [['4', 4], ['1', 1], ['8', 8], [' 3 ', 3], ['08', 8], [null, 2], [undefined, 2], ['', 2], ['0', 2], ['9', 2], ['12', 2],
    ['4.5', 2], ['-3', 2], ['1e1', 2], ['abc', 2], ['４', 2], ['3abc', 2]];
  const sai = BANG.filter(([v, mong]) => soKhachTuUrl(v) !== mong).map(([v, mong]) => `${JSON.stringify(v)} → ${soKhachTuUrl(v)} (cần ${mong})`);
  ok('soKhachTuUrl: chỉ số nguyên 1–8 viết bằng chữ số; trống, 0, 9+, số lẻ, chữ, chữ số toàn khổ → 2', sai.length === 0, sai.join(' | '));
});

// ===========================================================================
await nhom('3 · THANH HÀNH ĐỘNG ĐIỆN THOẠI: TRANG NÀO, NÚT NÀO', async () => {
  const HOTLINE = '0909 123 456';
  const MAPS = 'https://maps.app.goo.gl/beeftown-thu';
  for (const nn of NGON_NGU) {
    const t = chu(nn);
    const duong = v => duongDanTuongUng(v, nn);
    const mo = nd({ form_dat_ban_dang_mo: true });
    for (const v of ['/', '/thuc-don', '/den-beeftown']) {
      const th = thanhHanhDong(mo, nn, duong(v));
      ok(`[${nn}] ${duong(v)}, form mở, chưa công bố liên hệ → chỉ nút chính "${t.datBan}" tới ${duong('/dat-ban')}`,
         th?.chinh?.url === duong('/dat-ban') && th.chinh.chu === t.datBan && th.chinh.kieu === 'chinh' && th.goi === null && th.chiDuong === null,
         JSON.stringify(th));
    }
    // Đường dẫn có dấu "/" cuối (trình duyệt gõ tay) vẫn là trang đó.
    ok(`[${nn}] ${duong('/thuc-don')}/ (dấu "/" cuối) vẫn có thanh`, thanhHanhDong(mo, nn, `${duong('/thuc-don')}/`) !== null);
    for (const v of ['/dat-ban', '/mua-thit-ve', '/tuyen-dung', '/quyen-rieng-tu', '/xoa-du-lieu']) {
      ok(`[${nn}] ${duong(v)}: không có thanh`, thanhHanhDong(nd({ form_dat_ban_dang_mo: true, hotline: HOTLINE, google_maps_url: MAPS }), nn, duong(v)) === null);
    }
    // duongDanTuongUng đưa đường dẫn lạ về trang chủ — thanh không được hiện ở trang 404 hay trang kết quả.
    for (const la of [`${duong('/')}/khong-co`.replace('//', '/'), '/mua-thit-ve/ket-qua', '/en/khong-co', '/ko/khong-co'].filter(x => x !== duong('/'))) {
      ok(`[${nn}] Đường dẫn lạ ${la}: không có thanh`, thanhHanhDong(mo, nn, la) === null);
    }
    const dong = nd({ form_dat_ban_dang_mo: false });
    const thChu = thanhHanhDong(dong, nn, duong('/'));
    ok(`[${nn}] Form chưa mở, trang chủ → nút chính "${t.khamPhaThucDon}"`,
       thChu?.chinh?.url === duong('/thuc-don') && thChu.chinh.chu === t.khamPhaThucDon, JSON.stringify(thChu));
    ok(`[${nn}] Form chưa mở, trang Thực đơn, chưa công bố liên hệ → không có thanh (không nút tới chính trang đang xem)`,
       thanhHanhDong(dong, nn, duong('/thuc-don')) === null);
    const day = thanhHanhDong(nd({ form_dat_ban_dang_mo: false, hotline: HOTLINE, google_maps_url: MAPS }), nn, duong('/thuc-don'));
    ok(`[${nn}] Form chưa mở, Thực đơn, có hotline và Maps → không nút chính; Gọi (tel:0909123456) và Chỉ đường`,
       day?.chinh === null && day.goi === 'tel:0909123456' && day.chiDuong === MAPS, JSON.stringify(day));
    const xau = thanhHanhDong(nd({ form_dat_ban_dang_mo: true, hotline: 'gọi 0909;rm', google_maps_url: 'javascript:alert(1)' }), nn, duong('/'));
    ok(`[${nn}] Hotline không bắt đầu bằng số, Maps không phải http(s) → không Gọi, không Chỉ đường`, xau?.goi === null && xau.chiDuong === null, JSON.stringify(xau));
    ok(`[${nn}] Chuỗi "Gọi" và tên thanh có ở ba thứ tiếng`, !!t.goi.trim() && !!t.hanhDongNhanh.trim() && !!t.chiDuong.trim());
  }
});

// ===========================================================================
await nhom('4 · MÃ NGUỒN: FORM MÀN ĐẦU, TRANG HỎI BÀN, LAYOUT, THANH', async () => {
  const kmd = doc('components', 'KhoiMoDau.astro');
  ok('Màn đầu: thanh hỏi bàn nhanh chỉ khi form mở (formHoiBanMo), không thì hai nút của nutMoDau như trước',
     kmd.includes('const hoiNhanh = formHoiBanMo(nd);') && /\{hoiNhanh \? \(/.test(kmd) && kmd.includes("<div class=\"hang-nut kmd-nut\">"));
  ok('Màn đầu: form GET tới nút chính (trang Hỏi bàn) + #hb-gio, có tên cho trình đọc màn hình',
     kmd.includes('<form class="kmd-nut kmd-hoi" method="get" action={`${nut[0].url}#hb-gio`} aria-label={t.hoiBanNhanh}>'));
  ok('Màn đầu: hai ô chọn có nhãn (label for) — ngay (ngayHoiNhanh, chọn sẵn hôm nay) và so_khach (1–8, chọn sẵn 2)',
     kmd.includes('<label for="kmd-ngay">{t.ngayDen}</label>') && kmd.includes('<select id="kmd-ngay" name="ngay">')
       && kmd.includes('<label for="kmd-so-khach">{t.soNguoi}</label>') && kmd.includes('<select id="kmd-so-khach" name="so_khach">')
       && kmd.includes('const ngayChon = hoiNhanh ? ngayHoiNhanh(ngonNgu) : [];') && kmd.includes('selected={n === SO_KHACH_MAC_DINH}'));
  ok('Màn đầu: một nút chính (nút gửi "Hỏi bàn") và một nút viền trong cùng nhóm',
     kmd.includes('<button type="submit" class="nut nut-chinh">{nut[0].chu}</button>') && kmd.includes('<a class="nut nut-vien" href={nut[1].url}>{nut[1].chu}</a>'));
  const mo = nutMoDau(nd({ form_dat_ban_dang_mo: true }), 'vi');
  ok('Khi form mở, nut[0] là "Hỏi bàn" tới /dat-ban và nut[1] là "Khám phá thực đơn" — form màn đầu gửi đúng trang',
     mo[0].url === '/dat-ban' && mo[0].kieu === 'chinh' && mo[1].url === '/thuc-don', JSON.stringify(mo));

  const datBan = doc('components', 'TrangDatBan.astro');
  ok('Trang Hỏi bàn: ô số người dùng tên so_khach (đúng tên màn đầu gửi), chọn sẵn soKhachTuUrl(?so_khach=)',
     datBan.includes("const soKhachXin = Astro.url.searchParams.get('so_khach');") && datBan.includes('const soKhachChon = soKhachTuUrl(soKhachXin);')
       && datBan.includes('<select id="hb-so-khach" name="so_khach"') && datBan.includes('<option value={n} selected={n === soKhachChon}>{n}</option>'));
  ok('Trang Hỏi bàn: ngày đọc từ ?ngay= (pages/dat-ban.astro → tinhTrangDatBan), khung giờ có id hb-gio',
     doc('pages', 'dat-ban.astro').includes("Astro.url.searchParams.get('ngay')") && datBan.includes('id="hb-gio"'));
  ok('Trang Hỏi bàn: số người khách vừa chọn ở màn đầu thắng bản nháp đã lưu (data-chon-tu-dia-chi, bỏ qua khi điền lại)',
     datBan.includes("data-chon-tu-dia-chi={soKhachXin !== null ? '' : undefined}") && datBan.includes("if (o.hasAttribute('data-chon-tu-dia-chi')) continue;"));

  const trang = doc('layouts', 'Trang.astro');
  ok('Trang.astro: thanh hành động đứng ngay sau chân trang', /<ChanTrang [^>]*\/>\s*\{\/\*[^*]*\*\/\}\s*<ThanhHanhDong ngonNgu=\{ngonNgu\} noiDung=\{nd\} duongDan=\{duongDan\} \/>/.test(trang));
  const thd = doc('components', 'ThanhHanhDong.astro');
  ok('ThanhHanhDong.astro: bề mặt đen be-toi, có tên (aria-label), quyết định nằm ở thanhHanhDong()',
     thd.includes('<nav class="thd be-toi" aria-label={t.hanhDongNhanh} data-thanh-hanh-dong>') && thd.includes('const thanh = thanhHanhDong(noiDung, ngonNgu, duongDan);'));
  ok('ThanhHanhDong.astro: dính đáy (sticky), ẩn từ 768px và trên màn thấp dưới 500px',
     /\.thd \{\s*position: sticky; bottom: 0;/.test(thd) && thd.includes('@media (min-width: 768px), (max-height: 499.98px) {'));
  ok('ThanhHanhDong.astro: nút phụ luôn có chữ cạnh biểu tượng (Gọi, Chỉ đường)',
     thd.includes('<BieuTuong ten="dien-thoai" /><span>{t.goi}</span>') && thd.includes('<BieuTuong ten="ghim" /><span>{t.chiDuong}</span>'));
});

process.exit(ketThuc('MÀN ĐẦU MỚI: HỎI BÀN NHANH, THANH HÀNH ĐỘNG ĐIỆN THOẠI'));
