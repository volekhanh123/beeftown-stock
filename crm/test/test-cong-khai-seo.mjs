/**
 * TRANG CÔNG KHAI — SEO KỸ THUẬT VÀ TRÊN TRANG (PR "SEO web", 23/11/2026)
 * ======================================================================
 * Chạy: node test/test-cong-khai-seo.mjs
 *
 * Giữ những điều rà soát SEO 23/11/2026 đã sửa, để không ai gỡ nhầm:
 *   1. Tiêu đề và mô tả của mọi trang công khai ở ba thứ tiếng: độ dài, có từ người ta tìm (bò nướng, chọn bò tại
 *      quầy, 63 Hồ Tùng Mậu, Quận 1 cũ), không chữ cấm, không tên phường.
 *   2. Dòng hiệu trên câu chính của trang chủ nói tiếng của trang (không còn "Beef Specialty Restaurant" in nguyên
 *      trên trang tiếng Việt).
 *   3. Trang chạy như nhà hàng đang hoạt động (Khánh quyết 23/11/2026): không câu "đang chuẩn bị đón bạn", không câu
 *      "khai trương" trong mô tả; dòng ngày ("Đón bạn từ" / "Mở cửa từ") chỉ khi chủ công bố ngay_khai_truong (giờ Việt
 *      Nam: 23:50 và 00:10, ngày không có thật 31/02).
 *   4. JSON-LD giờ mở cửa: chỉ khi cả hai công tắc đã công bố; chưa công bố thì không gọi database lần hai.
 *   4b. JSON-LD `geo` (tọa độ chấm ghim đã xác minh của Google Business Profile): cùng cổng với `hasMap` — chỉ khi đã công bố
 *      link Google Maps.
 *   5. JSON-LD Product + Offer của trang Mua thịt về: chỉ gói có giá đã công bố, không dữ liệu bịa; tên Product là tên đang hiện
 *      trên thẻ ("Đầu thăn ngoại (Ribeye)" ở trang Việt). Mô tả trang Mua thịt về nói đúng điều trang nói (có VNPay / chưa).
 *   6. HSTS một năm (không includeSubDomains, không preload) cho trả lời của Worker và file tĩnh; Cache-Control dài
 *      cho /anh/, /thuong-hieu/, /phong/ (web/public/_headers).
 *   7. Phông Montserrat tự phát: file có thật, @font-face đủ hai bộ ký tự, preload đúng tên, không còn stylesheet
 *      Google cho Montserrat; tiếng Hàn vẫn có Noto Sans KR.
 *   8. Hotline đã công bố có link tel: bấm được ở chân trang.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web');
const SRC = join(WEB, 'src');
const LIB = join(SRC, 'lib');
const nap = f => import(pathToFileURL(join(LIB, f)).href);
const doc = (...p) => readFileSync(join(...p), 'utf8');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — TRANG CÔNG KHAI: SEO');

const { chu, NGON_NGU, CAP_DUONG_DAN, THUONG_HIEU, DIA_CHI_NHA_HANG } = await nap('chu.ts');
const { tinhTrangKhaiTruong, dongTrangThai, lienHe, jsonTrongScript, toaDoCoCauTruc, TOA_DO_QUAN } = await nap('trang-cong-khai.ts');
const { docNoiDung } = await nap('noi-dung.ts');
const { homNayVn } = await nap('gio-vn.ts');
const { timChuoiCam } = await nap('chuoi-cam.js');
const { khungGioCongBo, gioMoCuaJsonLd, docGioMoCua, docGioMoCuaChoTrang, xoaBoNhoGioMoCua, NHO_GIO_MO_CUA_MS } = await nap('gio-mo-cua.ts');
const { nhomMuaThitVe, chiaNhom, sanPhamJsonLd, trangThaiMuaThit } = await nap('mua-thit-ve.ts');
const { datHsts, HSTS } = await nap('header-https.ts');
const { PHUONG_QUAN, LUAT_CHU_KHACH_DOC } = await import(pathToFileURL(join(WEB, 'kiem-tra', 'mau-dia-diem.mjs')).href);

const NEN = await docNoiDung('vi', null);
const nd = (them = {}) => ({ ...NEN, ...structuredClone(them) });
const CHU_VIET = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/iu;
const HANGUL = /[가-힣]/u;
const dem = s => [...s].length;

// ---------------------------------------------------------------------------
// Mọi trang công khai (không lập chỉ mục thì bỏ): tiêu đề, mô tả viết thẳng trong file trang.
// ---------------------------------------------------------------------------
const TRANG = {
  home: { vi: null, en: null, ko: null },
  menu: { vi: 'thuc-don.astro', en: 'en/menu.astro', ko: 'ko/menu.astro' },
  visit: { vi: 'den-beeftown.astro', en: 'en/visit.astro', ko: 'ko/visit.astro' },
  book: { vi: 'dat-ban.astro', en: 'en/book.astro', ko: 'ko/book.astro' },
  buy: { vi: 'mua-thit-ve.astro', en: 'en/buy-meat.astro', ko: 'ko/buy-meat.astro' },
  // Cùng ba file; mô tả khi Worker đã cài VNPay (chu.ts moTaMuaThitVnpay) — trang ghi giá đã gồm phí giao, trả trước qua VNPay.
  buyVnpay: { vi: 'mua-thit-ve.astro', en: 'en/buy-meat.astro', ko: 'ko/buy-meat.astro' },
  cuts: { vi: 'phan-thit-bo.astro', en: 'en/beef-cuts.astro', ko: 'ko/beef-cuts.astro' },
  jobs: { vi: 'tuyen-dung.astro', en: 'en/jobs.astro', ko: 'ko/jobs.astro' },
  privacy: { vi: 'quyen-rieng-tu.astro', en: 'en/privacy.astro', ko: 'ko/privacy.astro' },
  data: { vi: 'xoa-du-lieu.astro', en: 'en/data-deletion.astro', ko: 'ko/data-deletion.astro' },
};
const meta = (trang, nn) => {
  if (trang === 'home') return { tieuDe: chu(nn).tieuDeTrangChu, moTa: chu(nn).moTaNgan };
  const s = doc(SRC, 'pages', TRANG[trang][nn]);
  const tieuDe = s.match(/\btieuDe="([^"]*)"/)?.[1] ?? '';
  // Trang đặt bàn và Mua thịt về chọn mô tả theo trạng thái trang: câu mở nằm ở chu.ts (câu chưa mở kiểm riêng bên dưới).
  if (trang === 'book') return { tieuDe, moTa: chu(nn).moTaHoiBan };
  if (trang === 'buy') return { tieuDe, moTa: chu(nn).moTaMuaThit };
  if (trang === 'buyVnpay') return { tieuDe, moTa: chu(nn).moTaMuaThitVnpay };
  return { tieuDe, moTa: s.match(/\bmoTa="([^"]*)"/)?.[1] ?? null };
};

// ===========================================================================
await nhom('1 · TIÊU ĐỀ VÀ MÔ TẢ: ĐỘ DÀI, TỪ KHÓA, CHỮ CẤM, KHÔNG PHƯỜNG', async () => {
  for (const trang of Object.keys(TRANG)) {
    for (const nn of NGON_NGU) {
      const { tieuDe, moTa } = meta(trang, nn);
      const ten = `${trang} [${nn}]`;
      // Chữ Hàn rộng gần gấp đôi chữ Latin trong kết quả tìm kiếm: ngưỡng của tiếng Hàn tính theo ký tự thấp hơn.
      const toiDaTieuDe = nn === 'ko' ? 48 : 64, toiThieuTieuDe = nn === 'ko' ? 18 : 20;
      ok(`${ten}: tiêu đề ${toiThieuTieuDe}–${toiDaTieuDe} ký tự (có ${dem(tieuDe)})`, dem(tieuDe) >= toiThieuTieuDe && dem(tieuDe) <= toiDaTieuDe, tieuDe);
      ok(`${ten}: tiêu đề có tên "Beeftown"`, tieuDe.includes('Beeftown'), tieuDe);
      if (moTa !== null) {
        const toiDaMoTa = nn === 'ko' ? 125 : 175;
        ok(`${ten}: mô tả 40–${toiDaMoTa} ký tự (có ${dem(moTa)})`, dem(moTa) >= 40 && dem(moTa) <= toiDaMoTa, moTa);
      }
      for (const [loai, s] of [['tiêu đề', tieuDe], ['mô tả', moTa ?? '']]) {
        ok(`${ten}: ${loai} không dính chữ cấm (chuoi-cam.js)`, timChuoiCam(s).length === 0, JSON.stringify(timChuoiCam(s)));
        for (const luat of LUAT_CHU_KHACH_DOC) ok(`${ten}: ${loai} không ${luat.ten}`, !luat.tim(s), `«${luat.tim(s)}»`);
      }
    }
  }

  // Câu mô tả "chưa mở" của trang đặt bàn và Mua thịt về cũng qua các luật chữ khách đọc và không phạm luật địa điểm.
  for (const nn of NGON_NGU) {
    for (const k of ['moTaHoiBanChuaMo', 'moTaMuaThitChuaMo']) {
      const m = chu(nn)[k];
      ok(`chu.ts [${nn}] ${k}: không chữ cấm, không tên phường, không luật địa điểm nào bị phạm`, timChuoiCam(m).length === 0 && LUAT_CHU_KHACH_DOC.every(l => !l.tim(m)), m);
    }
    ok(`chu.ts [${nn}] moTaHoiBanChuaMo vẫn chỉ sang Facebook (không hứa gửi yêu cầu)`, /Facebook/.test(chu(nn).moTaHoiBanChuaMo));
  }

  // Trang xếp hạng được: có từ khóa người ta tìm, theo từng thứ tiếng.
  const co = (trang, nn, re) => re.test(meta(trang, nn).tieuDe);
  ok('Tiêu đề trang chủ tiếng Việt là câu Khánh duyệt: "Beeftown — Nhà hàng bò nướng, chọn bò tại quầy · 63 Hồ Tùng Mậu"',
     meta('home', 'vi').tieuDe === 'Beeftown — Nhà hàng bò nướng, chọn bò tại quầy · 63 Hồ Tùng Mậu', meta('home', 'vi').tieuDe);
  for (const trang of ['home', 'menu', 'book', 'jobs']) ok(`${trang} [vi]: tiêu đề có "bò nướng"`, co(trang, 'vi', /bò nướng/iu), meta(trang, 'vi').tieuDe);
  ok('menu [vi]: tiêu đề có "chọn bò tại quầy" và "Quận 1 cũ"', co('menu', 'vi', /chọn bò tại quầy/iu) && co('menu', 'vi', /Quận 1 cũ/u), meta('menu', 'vi').tieuDe);
  ok('visit [vi]: tiêu đề có "63 Hồ Tùng Mậu", "Quận 1 cũ", "TP.HCM"', co('visit', 'vi', /63 Hồ Tùng Mậu/u) && co('visit', 'vi', /Quận 1 cũ/u) && co('visit', 'vi', /TP\.HCM/u), meta('visit', 'vi').tieuDe);
  ok('book [vi]: tiêu đề có "Đặt bàn"', co('book', 'vi', /Đặt bàn/u), meta('book', 'vi').tieuDe);
  ok('book [en]: tiêu đề có nhãn "Book a Table"', co('book', 'en', /Book a Table/u), meta('book', 'en').tieuDe);
  for (const trang of ['home', 'menu', 'jobs']) ok(`${trang} [en]: tiêu đề có "Beef" hoặc "Grilled"`, co(trang, 'en', /beef|grill/iu), meta(trang, 'en').tieuDe);
  for (const trang of ['home', 'visit', 'menu', 'book', 'jobs', 'buy']) ok(`${trang} [ko]: tiêu đề có "호치민"`, co(trang, 'ko', /호치민/u), meta(trang, 'ko').tieuDe);
  ok('home [ko]: tiêu đề có "소고기 전문점" và "구 1군"', co('home', 'ko', /소고기 전문점/u) && co('home', 'ko', /구 1군/u), meta('home', 'ko').tieuDe);
  ok('Mô tả EN trang tuyển dụng và Mua thịt về đã cắt về cỡ gần 155 ký tự (trước: 185 và 162)',
     dem(meta('jobs', 'en').moTa) <= 160 && dem(meta('buy', 'en').moTa) <= 160, `${dem(meta('jobs', 'en').moTa)} · ${dem(meta('buy', 'en').moTa)}`);
  ok('Mô tả Mua thịt về khi có VNPay: vi và en 120–155 ký tự (trang tìm kiếm cắt quanh 155), ko 70–110',
     dem(meta('buyVnpay', 'vi').moTa) >= 120 && dem(meta('buyVnpay', 'vi').moTa) <= 155 && dem(meta('buyVnpay', 'en').moTa) >= 120 && dem(meta('buyVnpay', 'en').moTa) <= 155
       && dem(meta('buyVnpay', 'ko').moTa) >= 70 && dem(meta('buyVnpay', 'ko').moTa) <= 110,
     `${dem(meta('buyVnpay', 'vi').moTa)} · ${dem(meta('buyVnpay', 'en').moTa)} · ${dem(meta('buyVnpay', 'ko').moTa)}`);
  ok('Thuật ngữ "Hỏi bàn" không quay lại: nút ghi "Đặt bàn" (Khánh quyết 23/11/2026) và tiêu đề trang đặt bàn có "Đặt bàn"', chu('vi').datBan === 'Đặt bàn' && co('book', 'vi', /Đặt bàn/u));

  // Trang chủ: mọi thẻ mô tả cùng nói đủ ba điều — chọn bò ở quầy, nướng tại bàn, địa chỉ — và khu vực "Quận 1 cũ" đúng cách của thứ tiếng.
  const KHU = { vi: 'Quận 1 cũ', en: 'former District 1', ko: '구 1군' };
  for (const nn of NGON_NGU) {
    const m = chu(nn).moTaNgan;
    ok(`chu.ts [${nn}]: mô tả nền ghi khu vực "${KHU[nn]}" và không tên phường`, m.includes(KHU[nn]) && !PHUONG_QUAN.tim(m), m);
    ok(`chu.ts [${nn}]: không còn khóa nganhHang (tiêu đề trang chủ là tieuDeTrangChu)`, !('nganhHang' in chu(nn)) && typeof chu(nn).tieuDeTrangChu === 'string');
  }
  const trang = doc(SRC, 'layouts', 'Trang.astro');
  ok('Trang.astro: tiêu đề mặc định (trang chủ) là tieuDeTrangChu, sau tiêu đề trang và tieu_de_og', trang.includes('?? nd.tieu_de_og\n  ?? t.tieuDeTrangChu;'));
  for (const f of ['index.astro', 'en/index.astro', 'ko/index.astro']) {
    ok(`pages/${f}: mô tả trang chủ là câu nền moTaNgan (hoặc mo_ta_og đã duyệt) — không truyền moTa riêng`, !/moTa=/.test(doc(SRC, 'pages', f)) && !doc(SRC, 'pages', f).includes('moTaTrangChu'));
  }
  ok('Địa chỉ in trên trang (DIA_CHI_NHA_HANG) ghi "Quận 1 cũ", không tên phường', DIA_CHI_NHA_HANG.includes('Quận 1 cũ') && !PHUONG_QUAN.tim(DIA_CHI_NHA_HANG), DIA_CHI_NHA_HANG);
});

// ===========================================================================
await nhom('2 · DÒNG HIỆU TRÊN CÂU CHÍNH: ĐÚNG TIẾNG CỦA TRANG', async () => {
  ok('[vi] dòng hiệu là "Nhà hàng bò nướng tại bàn" — tiếng Việt, không còn descriptor tiếng Anh', chu('vi').dongHieu === 'Nhà hàng bò nướng tại bàn' && CHU_VIET.test(chu('vi').dongHieu), chu('vi').dongHieu);
  ok('[en] dòng hiệu viết bằng tiếng Anh, không có chữ Việt hay Hàn', /^[A-Za-z ,-]+$/.test(chu('en').dongHieu) && chu('en').dongHieu !== THUONG_HIEU.descriptor, chu('en').dongHieu);
  ok('[ko] dòng hiệu viết bằng tiếng Hàn', HANGUL.test(chu('ko').dongHieu), chu('ko').dongHieu);
  for (const nn of NGON_NGU) ok(`[${nn}] dòng hiệu không dính chữ cấm`, timChuoiCam(chu(nn).dongHieu).length === 0);
  const kmd = doc(SRC, 'components', 'KhoiMoDau.astro');
  ok('KhoiMoDau.astro in <p class="hieu">{t.dongHieu}</p> và không còn in descriptor tiếng Anh ở màn đầu', kmd.includes('<p class="hieu">{t.dongHieu}</p>') && !kmd.includes('{THUONG_HIEU.descriptor}'));
  ok('Chân trang vẫn ghi descriptor "Beef Specialty Restaurant" (dòng bản quyền)', doc(SRC, 'components', 'ChanTrang.astro').includes('{THUONG_HIEU.descriptor}') && THUONG_HIEU.descriptor === 'Beef Specialty Restaurant');
});

// ===========================================================================
await nhom('3 · KHÔNG CÒN CHỮ VỀ GIAI ĐOẠN RA MẮT (TRANG CHẠY NHƯ NHÀ HÀNG ĐANG HOẠT ĐỘNG); NGÀY KHAI TRƯƠNG CHỈ KHI CHỦ CÔNG BỐ', async () => {
  const MO = '2026-12-02';
  ok('Chưa công bố ngày → chua_co', tinhTrangKhaiTruong(nd(), '2026-12-01') === 'chua_co');
  ok('Ngày chưa tới → sap_mo ("Đón bạn từ …")', tinhTrangKhaiTruong(nd({ ngay_khai_truong: MO }), '2026-12-01') === 'sap_mo');
  ok('Đúng ngày, và các ngày sau → da_mo ("Mở cửa từ …")', ['2026-12-02', '2026-12-03', '2027-01-01'].every(h => tinhTrangKhaiTruong(nd({ ngay_khai_truong: MO }), h) === 'da_mo'));
  // Giờ Việt Nam: 23:50 ngày 01/12 giờ VN là 16:50 UTC cùng ngày; 00:10 ngày 02/12 giờ VN vẫn là ngày 01/12 theo UTC.
  const vn2350 = homNayVn(Date.UTC(2026, 11, 1, 16, 50)), vn0010 = homNayVn(Date.UTC(2026, 11, 1, 17, 10));
  ok('Mốc 23:50 ngày 01/12 giờ VN → sap_mo; 00:10 ngày 02/12 giờ VN (UTC còn 01/12) → da_mo',
     vn2350 === '2026-12-01' && vn0010 === '2026-12-02'
       && tinhTrangKhaiTruong(nd({ ngay_khai_truong: MO }), vn2350) === 'sap_mo' && tinhTrangKhaiTruong(nd({ ngay_khai_truong: MO }), vn0010) === 'da_mo', `${vn2350} · ${vn0010}`);
  for (const sai of ['2026-02-31', '2026-13-01', '2026-12-32', 'sắp mở', '02/12/2026', '2026-12-2', 5, true]) {
    ok(`Ngày không có thật hay sai dạng ${JSON.stringify(sai)} → chua_co (không in dòng ngày)`, tinhTrangKhaiTruong(nd({ ngay_khai_truong: sai }), '2026-12-01') === 'chua_co');
  }

  // Dòng trạng thái: chỉ câu chủ đã công bố; không câu dự phòng ở bất kỳ ngày nào.
  ok('Chưa công bố dong_trang_thai → không có dòng, dù chưa có ngày, ngày chưa tới hay đã qua', [undefined, MO].every(ngay => dongTrangThai(nd(ngay ? { ngay_khai_truong: ngay } : {})) === null));
  ok('Câu đã công bố được in nguyên, bỏ khoảng trắng hai đầu', dongTrangThai(nd({ dong_trang_thai: '  Đã mở cửa.  ' })) === 'Đã mở cửa.');
  ok('Câu chỉ có khoảng trắng coi như chưa công bố', dongTrangThai(nd({ dong_trang_thai: '   ' })) === null);
  for (const nn of NGON_NGU) {
    const moi = Object.entries(chu(nn));
    ok(`[${nn}] chu.ts không còn khóa trangThaiMacDinh, khaiTruongCau`, !('trangThaiMacDinh' in chu(nn)) && !('khaiTruongCau' in chu(nn)));
    const sot = moi.filter(([, v]) => /chuẩn bị đón|getting ready|손님을 맞이할 준비|khai trương|opening on|오픈 예정이에요/i.test(v)).map(([k]) => k);
    ok(`[${nn}] chu.ts không có câu "đang chuẩn bị đón bạn" hay "khai trương"`, sot.length === 0, sot.join(', '));
    ok(`[${nn}] thẻ mô tả nền không nhắc giai đoạn ra mắt`, !/khai trương|opening|오픈/i.test(chu(nn).moTaNgan), chu(nn).moTaNgan);
  }

  const kmd = doc(SRC, 'components', 'KhoiMoDau.astro');
  ok('KhoiMoDau.astro: dòng trạng thái chỉ in khi dongTrangThai(nd) có câu; ngày và "Mở cửa từ" theo tinhTrangKhaiTruong',
     kmd.includes('{trangThai && <li class="trang-thai kmd-trang-thai"><p>{trangThai}</p></li>}') && kmd.includes('const giaiDoanMo = tinhTrangKhaiTruong(nd);') && kmd.includes('dongTrangThai(nd);'));
  ok('Không có ngày 02/12/2026 viết cứng trong mã (nếu có thì nằm ở khóa ngay_khai_truong của /noi-bo)', !/2026-12-02|02\/12\/2026/.test(doc(LIB, 'trang-cong-khai.ts')) && !/2026-12-02/.test(doc(SRC, 'lib', 'chu.ts')));
});

// ===========================================================================
await nhom('4 · JSON-LD GIỜ MỞ CỬA: CHỈ KHI ĐÃ CÔNG BỐ', async () => {
  const DONG = { ma: 'q1', gio_da_chot: true, trua_bat_dau: '11:00:00', trua_ket_thuc: '14:00:00', toi_bat_dau: '17:00:00', toi_ket_thuc: '22:00:00' };
  const BAT = { gio_phuc_vu_da_chot: true };
  ok('Công tắc gio_phuc_vu_da_chot chưa bật (null, false, "true", 1) → không khung nào',
     [null, false, 'true', 1].every(v => khungGioCongBo({ gio_phuc_vu_da_chot: v }, DONG).length === 0));
  ok('Chi nhánh gio_da_chot false hay thiếu → không khung nào', khungGioCongBo(BAT, { ...DONG, gio_da_chot: false }).length === 0 && khungGioCongBo(BAT, { ...DONG, gio_da_chot: undefined }).length === 0 && khungGioCongBo(BAT, null).length === 0);
  ok('Cả hai bật → hai khung 11:00–14:00 và 17:00–22:00 (bỏ giây)', JSON.stringify(khungGioCongBo(BAT, DONG)) === JSON.stringify([{ mo: '11:00', dong: '14:00' }, { mo: '17:00', dong: '22:00' }]), JSON.stringify(khungGioCongBo(BAT, DONG)));
  ok('Chỉ có ca tối → một khung', JSON.stringify(khungGioCongBo(BAT, { ...DONG, trua_bat_dau: null, trua_ket_thuc: null })) === JSON.stringify([{ mo: '17:00', dong: '22:00' }]));
  ok('Khung thiếu một đầu, sai dạng, giờ 25:00, mở ≥ đóng bị bỏ (không khai khung hỏng)',
     khungGioCongBo(BAT, { ...DONG, trua_ket_thuc: null, toi_bat_dau: '25:00', toi_ket_thuc: '22:00' }).length === 0
       && khungGioCongBo(BAT, { ...DONG, trua_bat_dau: '14:00', trua_ket_thuc: '14:00', toi_bat_dau: '22:00', toi_ket_thuc: '17:00' }).length === 0
       && khungGioCongBo(BAT, { ...DONG, trua_bat_dau: 'sáng', toi_bat_dau: 1700 }).length === 0);
  ok('Ca tối đóng sau nửa đêm ("00:30", "00:00") → KHÔNG khai giờ nào (không để lại ca trưa một mình, vì Google sẽ hiểu tối quán đóng cửa)',
     khungGioCongBo(BAT, { ...DONG, toi_ket_thuc: '00:30:00' }).length === 0 && khungGioCongBo(BAT, { ...DONG, toi_ket_thuc: '00:00' }).length === 0);
  ok('Ca trưa trống cả hai đầu (quán chỉ mở tối) vẫn khai ca tối', khungGioCongBo(BAT, { ...DONG, trua_bat_dau: undefined, trua_ket_thuc: null }).length === 1);
  ok('Giờ một chữ số "9:30" → "09:30"', khungGioCongBo(BAT, { ...DONG, trua_bat_dau: '9:30:00', trua_ket_thuc: '10:30' })[0]?.mo === '09:30');

  const ld = gioMoCuaJsonLd(khungGioCongBo(BAT, DONG));
  ok('JSON-LD: hai OpeningHoursSpecification, mỗi cái bảy ngày, opens / closes đúng',
     ld.length === 2 && ld.every(x => x['@type'] === 'OpeningHoursSpecification' && x.dayOfWeek.length === 7 && new Set(x.dayOfWeek).size === 7)
       && ld[0].opens === '11:00' && ld[0].closes === '14:00' && ld[1].opens === '17:00' && ld[1].closes === '22:00', JSON.stringify(ld));
  ok('Không khung → mảng rỗng (không khai gì)', gioMoCuaJsonLd([]).length === 0);

  // Đọc database bằng client giả.
  const gia = (kq) => { const s = { goi: [], daGoi: 0 }; return { s, client: { rpc(ten) { s.goi.push(ten); s.daGoi++; return kq(); } } }; };
  const chay = async (them, kq, ma = 'q1', hetGioMs = 2000) => { const g = gia(kq); const x = await docGioMoCua(them, g.client, ma, hetGioMs); return { x, ...g.s }; };
  const ghiLoi = []; const loiGoc = console.error; console.error = (...a) => ghiLoi.push(a.join(' '));
  try {
    let r = await chay({ gio_phuc_vu_da_chot: null }, () => Promise.resolve({ data: [DONG], error: null }));
    ok('Chưa công bố gio_phuc_vu_da_chot → KHÔNG gọi database lần hai', r.daGoi === 0 && r.x.length === 0, `${r.daGoi} lần gọi`);
    r = await chay(BAT, () => Promise.resolve({ data: [{ ...DONG, ma: 'q2', trua_bat_dau: '08:00:00' }, DONG], error: null }));
    ok('Đã công bố → đúng một lời gọi chi_nhanh_cong_khai, chọn đúng chi nhánh theo mã', r.daGoi === 1 && r.goi[0] === 'chi_nhanh_cong_khai' && r.x[0]?.mo === '11:00', JSON.stringify(r));
    r = await chay(BAT, () => Promise.resolve({ data: [{ ...DONG, ma: 'q2' }], error: null }));
    ok('Không có dòng của chi nhánh trang này → không khung (không lấy dòng đầu của chi nhánh khác)', r.x.length === 0);
    ghiLoi.length = 0;
    r = await chay(BAT, () => Promise.resolve({ data: null, error: { code: '42501', message: 'từ chối' } }));
    ok('Database trả lỗi → không khung, đúng một dòng log "[gio-mo-cua]"', r.x.length === 0 && ghiLoi.length === 1 && ghiLoi[0].includes('[gio-mo-cua]'), ghiLoi.join(' | '));
    ghiLoi.length = 0;
    r = await chay(BAT, () => Promise.reject(new TypeError('fetch failed')));
    ok('fetch ném lỗi (mất mạng) → không khung, không ném ra trang, một dòng log', r.x.length === 0 && ghiLoi.length === 1, ghiLoi.join(' | '));
    ghiLoi.length = 0;
    r = await chay(BAT, () => new Promise(() => {}), 'q1', 30);
    ok('Database không trả lời → hết giờ, không khung, một dòng log (Worker không có hạn chờ mặc định)', r.x.length === 0 && ghiLoi.length === 1 && ghiLoi[0].includes('hết giờ'), ghiLoi.join(' | '));
    r = await chay(BAT, () => Promise.resolve({ data: 'không phải danh sách', error: null }));
    ok('Trả thứ không phải danh sách → không khung', r.x.length === 0);
    ok('Chưa nối database (client null) → không khung', (await docGioMoCua(BAT, null)).length === 0);

    // Bản dùng cho trang nhớ kết quả 60 giây: không thêm một lời gọi database mỗi lượt xem trang.
    xoaBoNhoGioMoCua();
    const T0 = 1_000_000;
    const lan = gia(() => Promise.resolve({ data: [DONG], error: null }));
    const lan1 = await docGioMoCuaChoTrang(BAT, lan.client, 'q1', T0);
    const lan2 = await docGioMoCuaChoTrang(BAT, lan.client, 'q1', T0 + NHO_GIO_MO_CUA_MS - 1);
    ok('Bản cho trang: hai lượt xem trong 60 giây chỉ một lời gọi database, cùng kết quả', lan.s.daGoi === 1 && lan1.length === 2 && JSON.stringify(lan1) === JSON.stringify(lan2), `${lan.s.daGoi} lần gọi`);
    await docGioMoCuaChoTrang(BAT, lan.client, 'q1', T0 + NHO_GIO_MO_CUA_MS + 1);
    ok('Bản cho trang: qua 60 giây thì hỏi lại', lan.s.daGoi === 2, `${lan.s.daGoi} lần gọi`);
    ok('Bản cho trang: công tắc tắt → hết giờ NGAY dù bộ nhớ còn hạn, không gọi database',
       (await docGioMoCuaChoTrang({ gio_phuc_vu_da_chot: false }, lan.client, 'q1', T0 + NHO_GIO_MO_CUA_MS + 2)).length === 0 && lan.s.daGoi === 2);
    xoaBoNhoGioMoCua();
    const hong = gia(() => Promise.resolve({ data: null, error: { code: '500', message: 'x' } }));
    await docGioMoCuaChoTrang(BAT, hong.client, 'q1', T0);
    await docGioMoCuaChoTrang(BAT, hong.client, 'q1', T0 + 1);
    ok('Bản cho trang: lỗi KHÔNG được nhớ — lượt sau thử lại', hong.s.daGoi === 2, `${hong.s.daGoi} lần gọi`);
    xoaBoNhoGioMoCua();
    await docGioMoCuaChoTrang(BAT, lan.client, 'q1', T0);
    const truoc = lan.s.daGoi;
    await docGioMoCuaChoTrang(BAT, lan.client, 'q2', T0 + 1);
    ok('Bản cho trang: bộ nhớ theo mã chi nhánh — chi nhánh khác không dùng nhầm kết quả', lan.s.daGoi === truoc + 1);
    xoaBoNhoGioMoCua();
  } finally { console.error = loiGoc; }

  const layout = doc(SRC, 'layouts', 'Trang.astro');
  ok('Trang.astro: giờ vào JSON-LD qua docGioMoCuaChoTrang(nd) + gioMoCuaJsonLd, không trên trang không lập chỉ mục (404)',
     layout.includes('gioMoCuaJsonLd(khongLapChiMuc ? [] : await docGioMoCuaChoTrang(nd))') && layout.includes('duLieuCoCauTruc.openingHoursSpecification = gioJson;'));
  ok('Trang.astro không khai priceRange, aggregateRating, review (vẫn chưa có dữ kiện)', !/duLieuCoCauTruc\.(priceRange|aggregateRating|review)/.test(layout));
});

// ===========================================================================
await nhom('4b · JSON-LD `geo`: TỌA ĐỘ CHỈ KHI ĐÃ CÔNG BỐ LINK GOOGLE MAPS (CÙNG CỔNG VỚI hasMap)', async () => {
  const MAPS = 'https://maps.app.goo.gl/VLgAW3VuVDaRmyV19';
  const geo = toaDoCoCauTruc(nd({ google_maps_url: MAPS }));
  ok('Đã công bố link Maps → GeoCoordinates với vĩ độ 10.7718087, kinh độ 106.7039074 (chấm ghim Google Business đã xác minh)',
     JSON.stringify(geo) === JSON.stringify({ '@type': 'GeoCoordinates', latitude: 10.7718087, longitude: 106.7039074 }), JSON.stringify(geo));
  ok('Tọa độ là SỐ (không chuỗi), nằm trong TP.HCM (vĩ 10.3–11.2, kinh 106.3–107.1), mười chữ số thập phân không bị làm tròn',
     typeof geo.latitude === 'number' && typeof geo.longitude === 'number' && geo.latitude > 10.3 && geo.latitude < 11.2 && geo.longitude > 106.3 && geo.longitude < 107.1
       && TOA_DO_QUAN.vido === 10.7718087 && TOA_DO_QUAN.kinhdo === 106.7039074);
  for (const [nhan, v] of [['chưa công bố (null)', null], ['chuỗi rỗng', ''], ['chỉ khoảng trắng', '   '], ['"javascript:" (không an toàn → coi như chưa công bố)', 'javascript:alert(1)'], ['không phải URL', 'maps'], ['"data:" ', 'data:text/html,x']]) {
    ok(`Maps ${nhan} → không có geo (JSON-LD chỉ khai điều đã công bố)`, toaDoCoCauTruc(nd({ google_maps_url: v })) === null && lienHe(nd({ google_maps_url: v })).maps === null);
  }
  ok('Cùng cổng với hasMap: toaDoCoCauTruc khác null ⇔ lienHe(nd).maps khác null',
     [MAPS, 'http://maps.google.com/?cid=1', null, '', 'ftp://x'].every(v => (toaDoCoCauTruc(nd({ google_maps_url: v })) !== null) === (lienHe(nd({ google_maps_url: v })).maps !== null)));
  const layout = doc(SRC, 'layouts', 'Trang.astro');
  ok('Trang.astro: geo đứng sau hasMap, lấy từ toaDoCoCauTruc(nd), chỉ gắn khi khác null; không viết tọa độ thẳng trong layout',
     /if \(lh\.maps\) duLieuCoCauTruc\.hasMap = lh\.maps;\r?\n\/\/ Tọa độ: [^\r\n]*\r?\nconst geo = toaDoCoCauTruc\(nd\);\r?\nif \(geo\) duLieuCoCauTruc\.geo = geo;/.test(layout)
       && !/10\.7718087|106\.7039074/.test(layout.replace(/\/\*[\s\S]*?\*\//g, '')));
});

// ===========================================================================
await nhom('5 · JSON-LD PRODUCT + OFFER CỦA TRANG MUA THỊT VỀ: CHỈ GÓI CÓ GIÁ ĐÃ CÔNG BỐ', async () => {
  const dong = (ma, ten, soGam, gia, them = {}) => ({ san_pham_ma: ma, loai: 'thit', don_vi: 'goi', bao_quan: 'mat', ten, ten_vi: ten, mo_ta: null, cach_dung: null, so_gam: soGam, gia, tam_het: false, ...them });
  const sp = nhomMuaThitVe([
    dong('ribeye', 'Ribeye', 200, 189000), dong('ribeye', 'Ribeye', 400, 359000, { tam_het: true }),
    dong('ba-chi', 'Ba chỉ bò', 300, 0), dong('thit-khong-gia', 'Thịt không giá', 300, null),
    dong('kim-chi', 'Kim chi', 500, 59000, { loai: 'kim_chi', don_vi: 'hop', mo_ta: 'Kim chi nhà làm.' }),
  ]);
  const menu = { tinhTrang: 'co', sanPham: sp, nhom: chiaNhom(sp) };
  ok('Lớp chặn cũ vẫn bỏ gói không có giá (giá 0, null) trước khi vào JSON-LD', sp.map(s => s.ma).join() === 'ribeye,kim-chi', sp.map(s => s.ma).join());

  const json = sanPhamJsonLd(menu, 'mo', 'Beeftown');
  ok('Trang mở → một khối @graph có đúng hai Product (Ribeye, Kim chi)', json?.['@context'] === 'https://schema.org' && json['@graph'].length === 2 && json['@graph'].every(p => p['@type'] === 'Product'), JSON.stringify(json));
  const ribeye = json['@graph'][0];
  ok('Offer đúng giá đang in trên trang, đơn vị VND, giá là chuỗi số nguyên', JSON.stringify(ribeye.offers.map(o => [o.price, o.priceCurrency])) === JSON.stringify([['189000', 'VND'], ['359000', 'VND']]), JSON.stringify(ribeye.offers));
  ok('Gói "Tạm hết ở quầy" → OutOfStock, gói còn → InStock', ribeye.offers[0].availability === 'https://schema.org/InStock' && ribeye.offers[1].availability === 'https://schema.org/OutOfStock');
  ok('Tên Offer là cỡ gói ("200 g"), tên Product là tên sản phẩm, có thương hiệu, mô tả chỉ khi đã công bố',
     ribeye.offers[0].name === '200 g' && ribeye.name === 'Ribeye' && ribeye.brand.name === 'Beeftown' && !('description' in ribeye) && json['@graph'][1].description === 'Kim chi nhà làm.');
  const cam = ['aggregateRating', 'review', 'image', 'sku', 'gtin', 'mpn', 'priceValidUntil', 'itemCondition', 'url'];
  ok('Không khai thứ chưa có dữ kiện: đánh giá, ảnh, mã sản phẩm, hạn giá, tình trạng hàng', !cam.some(k => JSON.stringify(json).includes(`"${k}"`)), JSON.stringify(json).slice(0, 200));
  ok('Trang mở mà mọi gói tạm hết (het_quay) vẫn liệt kê, tất cả OutOfStock',
     (() => { const het = nhomMuaThitVe([dong('ribeye', 'Ribeye', 200, 189000, { tam_het: true })]); const j = sanPhamJsonLd({ tinhTrang: 'co', sanPham: het, nhom: chiaNhom(het) }, trangThaiMuaThit(true, { tinhTrang: 'co', sanPham: het, nhom: [] }), 'Beeftown'); return j?.['@graph'][0].offers.every(o => o.availability.endsWith('OutOfStock')); })());
  for (const tt of ['chua_mo', 'loi']) ok(`Trạng thái "${tt}" → không khai gì (null)`, sanPhamJsonLd(menu, tt, 'Beeftown') === null);
  ok('Menu rỗng → null', sanPhamJsonLd({ tinhTrang: 'co', sanPham: [], nhom: [] }, 'mo', 'Beeftown') === null);
  ok('Tên sản phẩm có "</script>" không đóng thẻ sớm (jsonTrongScript thoát "<")', !jsonTrongScript(sanPhamJsonLd({ tinhTrang: 'co', sanPham: nhomMuaThitVe([dong('x', 'A</script><b>', 100, 1000)]), nhom: [] }, 'mo', 'Beeftown')).includes('</script>'));

  const thanh = doc(SRC, 'components', 'TrangMuaThitVe.astro');
  ok('TrangMuaThitVe.astro in thẻ application/ld+json chỉ khi sanPhamJsonLd có kết quả, qua jsonTrongScript',
     thanh.includes('const jsonSanPham = sanPhamJsonLd(menu, trangThai, THUONG_HIEU.ten, nn);') && thanh.includes('{jsonSanPham && <script type="application/ld+json" set:html={jsonTrongScript(jsonSanPham)} is:inline></script>}'));
});

// ===========================================================================
await nhom('6 · HSTS VÀ CACHE-CONTROL', async () => {
  ok('HSTS là "max-age=31536000" — không includeSubDomains, không preload', HSTS === 'max-age=31536000' && !/includeSubDomains|preload/i.test(HSTS), HSTS);
  const a = datHsts(new Response('x', { status: 200 }));
  ok('datHsts gắn header vào trả lời thường, giữ nguyên mã và thân', a.headers.get('strict-transport-security') === HSTS && a.status === 200 && (await a.text()) === 'x');
  const b = datHsts(Response.redirect('https://beeftown.vn/', 301));
  ok('datHsts xử lý cả trả lời có header chỉ-đọc (Response.redirect): vẫn 301, vẫn có Location, có HSTS', b.status === 301 && b.headers.get('location') === 'https://beeftown.vn/' && b.headers.get('strict-transport-security') === HSTS);
  const c = datHsts(new Response(null, { status: 404, headers: { 'strict-transport-security': 'max-age=5' } }));
  ok('Trả lời đã có HSTS riêng → giữ nguyên, không ghi đè', c.headers.get('strict-transport-security') === 'max-age=5' && c.status === 404);
  const d = datHsts(new Response('lỗi', { status: 500 }));
  ok('Lỗi 500 cũng có HSTS (mọi trả lời của Worker)', d.status === 500 && d.headers.get('strict-transport-security') === HSTS);

  const w = doc(SRC, 'worker.ts');
  ok('worker.ts: MỌI lối ra của fetch (hook, trang, 404) đi qua datHsts', w.includes("import { datHsts } from './lib/header-https.ts';") && w.includes('return datHsts(await xuLyYeuCau(request, env, ctx));')
       && /async function xuLyYeuCau[\s\S]*xuLyHookIpos[\s\S]*xuLyHookMessenger[\s\S]*xuLyIpnVnpay[\s\S]*handle\(request/.test(w));
  ok('worker.ts: scheduled không đổi (cron báo động tách riêng)', w.includes('if (dieuKhien?.cron === CRON_BAO_DONG)') && w.includes('ctx.waitUntil(dongBoTatCa(env));'));

  const tep = join(WEB, 'public', '_headers');
  ok('web/public/_headers có thật', existsSync(tep));
  const h = existsSync(tep) ? readFileSync(tep, 'utf8') : '';
  // Tách thành các khối: dòng không thụt = đường dẫn, dòng thụt = header của đường dẫn đó.
  const khoi = {}; let dang = null;
  for (const dong of h.split(/\r?\n/)) {
    if (!dong.trim() || dong.trim().startsWith('#')) continue;
    if (/^\S/.test(dong)) { dang = dong.trim(); khoi[dang] = {}; }
    else if (dang) { const i = dong.indexOf(':'); khoi[dang][dong.slice(0, i).trim().toLowerCase()] = dong.slice(i + 1).trim(); }
  }
  for (const duong of ['/anh/*', '/thuong-hieu/*']) {
    const cc = khoi[duong]?.['cache-control'] ?? '';
    const ma = Number(cc.match(/max-age=(\d+)/)?.[1]), swr = Number(cc.match(/stale-while-revalidate=(\d+)/)?.[1]);
    ok(`_headers ${duong}: public, max-age 1–7 ngày + stale-while-revalidate, KHÔNG immutable (tên file không băm), không max-age=0`,
       /public/.test(cc) && ma >= 86400 && ma <= 7 * 86400 && swr >= 86400 && !/immutable|must-revalidate|no-cache/.test(cc), cc);
  }
  ok('_headers /phong/*: immutable một năm (tên file có số phiên bản)', /max-age=31536000/.test(khoi['/phong/*']?.['cache-control'] ?? '') && /immutable/.test(khoi['/phong/*']?.['cache-control'] ?? ''), JSON.stringify(khoi['/phong/*']));
  ok('_headers /*: HSTS đúng giá trị của lib/header-https.ts, không includeSubDomains / preload', khoi['/*']?.['strict-transport-security'] === HSTS, JSON.stringify(khoi['/*']));
  ok('_headers không đụng /_astro/* (adapter đã tự đặt immutable — hai luật chồng nhau thì Cloudflare nối hai giá trị)', !('/_astro/*' in khoi));
  // git check-ignore thoát 0 khi file BỊ chặn, 1 khi không bị chặn (execFileSync ném lỗi ở mã 1).
  const biChan = f => { try { execFileSync('git', ['check-ignore', '-q', f], { cwd: GOC, stdio: 'ignore' }); return true; } catch { return false; } };
  const FILE_MOI = ['web/public/_headers', 'web/public/phong/montserrat-5.3.0-latin-wght.woff2', 'web/public/phong/montserrat-5.3.0-vietnamese-wght.woff2',
    'web/public/phong/OFL.txt', 'web/src/lib/gio-mo-cua.ts', 'web/src/lib/header-https.ts', 'crm/test/test-cong-khai-seo.mjs'];
  ok('File mới không bị .gitignore chặn (_headers, phông, giấy phép OFL, lib mới, file test này)', FILE_MOI.every(f => !biChan(f)), FILE_MOI.filter(biChan).join(', '));
});

// ===========================================================================
await nhom('7 · PHÔNG MONTSERRAT TỰ PHÁT', async () => {
  const dir = join(WEB, 'public', 'phong');
  const TEP = { latin: 'montserrat-5.3.0-latin-wght.woff2', vietnamese: 'montserrat-5.3.0-vietnamese-wght.woff2' };
  for (const [bo, ten] of Object.entries(TEP)) {
    const p = join(dir, ten);
    const co = existsSync(p);
    ok(`public/phong/${ten} có thật, đúng chữ ký woff2 ("wOF2"), cỡ hợp lý`, co && readFileSync(p).subarray(0, 4).toString('latin1') === 'wOF2' && statSync(p).size > 5000 && statSync(p).size < 80000, co ? `${statSync(p).size} byte` : 'không có');
  }
  ok('Có giấy phép SIL OFL cạnh file phông', existsSync(join(dir, 'OFL.txt')) && /SIL OPEN FONT LICENSE/i.test(doc(dir, 'OFL.txt')));

  const css = doc(SRC, 'styles', 'chung.css');
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(m => m[1]).filter(b => /font-family:\s*'Montserrat'/.test(b));
  ok('chung.css: hai @font-face Montserrat (latin, vietnamese), bản biến thiên 100–900, font-display: swap, có unicode-range',
     faces.length === 2 && faces.every(b => /font-weight:\s*100 900/.test(b) && /font-display:\s*swap/.test(b) && /unicode-range:/.test(b) && /format\('woff2'\)/.test(b)), `${faces.length} khối`);
  for (const ten of Object.values(TEP)) ok(`chung.css trỏ tới /phong/${ten}`, css.includes(`url(/phong/${ten})`));
  ok('Bộ vietnamese phủ chữ ư ơ đ ă ạ ế (U+01B0, U+01A1, U+0111, U+0103, U+1EA1, U+1EBF); bộ latin phủ chữ thường và dấu — (U+2014)',
     /U\+01A0-01A1/.test(css) && /U\+01AF-01B0/.test(css) && /U\+0110-0111/.test(css) && /U\+0102-0103/.test(css) && /U\+1EA0-1EF9/.test(css) && /U\+0000-00FF/.test(css) && /U\+2000-206F/.test(css));
  ok('Tiếng Hàn: :root:lang(ko) vẫn xếp Noto Sans KR ngay sau Montserrat', /:root:lang\(ko\)\s*\{[^}]*--chu:\s*'Montserrat',\s*'Noto Sans KR'/.test(css));

  const trang = doc(SRC, 'layouts', 'Trang.astro');
  ok('Trang.astro: không còn stylesheet Google Fonts cho Montserrat, không preconnect cho trang vi / en',
     !/family=Montserrat/.test(trang) && !/fonts\.googleapis\.com\/css2\?family=Montserrat/.test(trang));
  ok('Trang.astro: preload bộ latin cho mọi trang, bộ vietnamese cho trang tiếng Việt, as="font" type="font/woff2" crossorigin',
     trang.includes(`<link rel="preload" href="/phong/${TEP.latin}" as="font" type="font/woff2" crossorigin />`)
       && trang.includes(`{ngonNgu === 'vi' && (\n      <link rel="preload" href="/phong/${TEP.vietnamese}" as="font" type="font/woff2" crossorigin />`));
  ok('Trang.astro: Noto Sans KR (cùng preconnect Google) CHỈ ở trang tiếng Hàn', /\{ngonNgu === 'ko' && \(\s*<>\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com" \/>[\s\S]*Noto\+Sans\+KR[\s\S]*<\/>\s*\)\}/.test(trang)
       && (trang.match(/fonts\.googleapis\.com/g) ?? []).length === 2);
  for (const f of ['NoiBo.astro', 'Kho.astro']) ok(`layouts/${f}: không còn link Google Fonts (@font-face đã ở chung.css)`, !/fonts\.(googleapis|gstatic)\.com/.test(doc(SRC, 'layouts', f)));
  const nb = doc(SRC, 'layouts', 'NoiBo.astro') + doc(SRC, 'layouts', 'Kho.astro');
  ok('/noi-bo và kho nạp chung.css (nơi có @font-face)', /chung\.css/.test(nb));

  // Trang quyền riêng tư không nhắc Google Fonts (không có gì để sửa) — chỉ trang tiếng Hàn còn kết nối tới Google vì Noto Sans KR.
  const rieng = ['quyen-rieng-tu.astro', 'en/privacy.astro', 'ko/privacy.astro'].map(f => doc(SRC, 'pages', f)).join('\n');
  ok('Trang quyền riêng tư (ba thứ tiếng) không nhắc Google Fonts / phông của bên thứ ba — không có gì sai cần đổi', !/Google Fonts/i.test(rieng));
});

// ===========================================================================
await nhom('8 · HOTLINE: LINK tel: BẤM ĐƯỢC Ở CHÂN TRANG', async () => {
  const lh = lienHe(nd({ hotline: '0961 245 124' }));
  ok('Hotline "0961 245 124" → câu hiện nguyên văn, tel:0961245124', lh.hotline === '0961 245 124' && lh.goi === 'tel:0961245124', JSON.stringify(lh));
  ok('Chưa công bố hotline → không có link tel:', lienHe(nd()).goi === null && lienHe(nd({ hotline: 'gọi chủ quán' })).goi === null);
  const ct = doc(SRC, 'components', 'ChanTrang.astro');
  ok('ChanTrang.astro: link tel: của hotline CHỈ khi đã công bố (lh.goi && lh.hotline), có biểu tượng điện thoại', ct.includes('{lh.goi && lh.hotline && <p class="ct-goi"><a href={lh.goi}><BieuTuong ten="dien-thoai" /><span>{lh.hotline}</span></a></p>}'));
  ok('Chân trang vẫn in số điện thoại PHÁP NHÂN như chữ thường (không phải hotline, không link)', ct.includes('{PHAP_NHAN.dienThoai}</span></p>') && !ct.includes('href={`tel:${PHAP_NHAN'));
  ok('Trang Đến Beeftown và thanh hành động dưới đáy điện thoại đã có link tel: cho hotline đã công bố', doc(SRC, 'components', 'TrangDenBeeftown.astro').includes('href={lh.goi}') && doc(SRC, 'components', 'ThanhHanhDong.astro').includes('href={thanh.goi}'));
});

process.exit(ketThuc('SEO TRANG CÔNG KHAI'));
