/**
 * BEEFTOWN — KHUNG NHẮN TIN TRANG Ở TRANG MUA THỊT VỀ (web/src/lib/tro-ly-trang.ts, components/TroLyTrang.astro)
 * ===========================================================================================================
 *
 *     node test/test-cong-khai-tro-ly-trang.mjs
 *
 * Khánh 18/11/2026: trợ lý tên Trang, nói như nhân viên quầy, không chữ AI, bot, tự động trong lời chào hay tin nào; ĐÚNG
 * MỘT chỗ khách biết đây là trợ lý ảo (dòng gạch dưới cố định dưới tên Trang, bấm vào mở phần giải thích). Nhân viên nhận
 * chat (0126 mục 4b): lệnh xem, tin nhân viên có nhãn riêng, đầu khung đổi sang nhân viên. Theo 9 mục "xong":
 *   1. quyen — khung chỉ dựng khi công tắc bật, trang mở, trang tiếng Việt hay tiếng Hàn, có địa chỉ hàm; lời gọi không
 *      mang cookie, chỉ sáu ô (cuộc, mã tin, tin, trả trước, chi nhánh, nn); lệnh xem chỉ bốn ô (hanh_dong, cuoc, sau, chi_nhanh).
 *   2. bam-hai-lan — nút Gửi khóa khi đang chờ; gửi lại dùng đúng mã tin cũ (Edge Function không trả lời hai lần).
 *   4. chu-va-so — tiền của thẻ đơn tính bằng tinhDon (giá gói của trang), in qua dinhDangTien trong data-tien; số gói 1–10.
 *   5. mat-mang — trả lời hỏng, lỗi mạng: câu "chưa được trả lời" + Gửi lại; không bao giờ bịa câu của Trang.
 *   7. cau-chu — chữ cố định đủ vi / en / ko, tiếng Anh, tiếng Hàn không lẫn chữ Việt, không chữ cấm; lời chào trùng lời dặn
 *      của Edge Function; không câu nào hứa nhân viên vào khung hay gọi lại.
 *   9. dich-vu-ngoai — Edge Function giả kiểm ở web/kiem-tra/thu-day-du.mjs nhóm 17 (trình duyệt thật).
 *   3, 6, 8 — không áp dụng.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { VIET } from './quet-chu-viet.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const nap = (...p) => import(pathToFileURL(join(GOC, ...p)).href);
const TL = await nap('web', 'src', 'lib', 'tro-ly-trang.ts');
const HAM = await nap('crm', 'supabase', 'functions', 'tro-ly-trang', 'trang.ts');
const { timChuoiCam } = await nap('web', 'src', 'lib', 'chuoi-cam.js');
const { dinhDangTien } = await nap('web', 'src', 'lib', 'don-mua-thit.ts');
const docNguon = (...p) => readFileSync(join(GOC, ...p), 'utf8');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — KHUNG NHẮN TIN TRANG (TRANG MUA THỊT VỀ)');

const MENU = [
  { ma: 'ribeye-with-cap', loai: 'thit', donVi: 'goi', baoQuan: 'mat', ten: 'Ribeye with Cap', tenVi: 'Ribeye with Cap', moTa: null, cachDung: null,
    goi: [{ khoa: 'ribeye-with-cap_150', soGam: 150, gia: 300000, tamHet: false }] },
  { ma: 'la-galbi', loai: 'thit', donVi: 'goi', baoQuan: 'dong_lanh', ten: 'LA Galbi', tenVi: 'LA Galbi', moTa: null, cachDung: null,
    goi: [{ khoa: 'la-galbi_150', soGam: 150, gia: 150000, tamHet: true }] },
  { ma: 'kim-chi', loai: 'kim_chi', donVi: 'hop', baoQuan: 'giu_lanh', ten: 'Kim chi cải thảo', tenVi: 'Kim chi cải thảo', moTa: null, cachDung: null,
    goi: [{ khoa: 'kim-chi_500', soGam: 500, gia: 75000, tamHet: false }] },
];

await nhom('1 · KHI NÀO KHUNG HIỆN (troLyTrangMo)', async () => {
  const u = 'https://x.supabase.co/functions/v1/tro-ly-trang';
  ok('Bật + trang mở + tiếng Việt + có địa chỉ hàm → hiện', TL.troLyTrangMo(true, 'mo', 'vi', u) === true);
  ok('Trang tiếng Hàn (Khánh 23/11/2026 "Làm tiếng Hàn") → hiện', TL.troLyTrangMo(true, 'mo', 'ko', u) === true);
  for (const [ten, a] of [['công tắc null (chưa công bố)', [null, 'mo', 'vi', u]], ['công tắc false', [false, 'mo', 'vi', u]],
    ['chuỗi "true"', ['true', 'mo', 'vi', u]], ['trang chưa mở', [true, 'chua_mo', 'vi', u]], ['mọi gói tạm hết', [true, 'het_quay', 'vi', u]],
    ['đọc menu lỗi', [true, 'loi', 'vi', u]], ['trang tiếng Anh (chờ Khánh chọn)', [true, 'mo', 'en', u]],
    ['trang tiếng Hàn, công tắc tắt', [false, 'mo', 'ko', u]], ['chưa nối database (CI)', [true, 'mo', 'vi', null]]]) {
    ok(`${ten} → không hiện`, TL.troLyTrangMo(...a) === false);
  }
  const vo = docNguon('web', 'src', 'components', 'TrangMuaThitVe.astro');
  ok('TrangMuaThitVe dựng <TroLyTrang> với noiDung, trangThai, traVnpay', /<TroLyTrang ngonNgu=\{nn\} noiDung=\{nd\} trangThai=\{trangThai\} traVnpay=\{traVnpay\} \/>/.test(vo));
});

await nhom('2 · CHỈ MỘT CHỖ NÓI LÀ TRỢ LÝ ẢO; LỜI CHÀO TRÙNG LỜI DẶN; CHỮ ĐỦ BA THỨ TIẾNG', async () => {
  ok('Lời chào của trang trùng LOI_CHAO của Edge Function (lời dặn nói Trang đã chào bằng đúng hai câu này)',
    JSON.stringify(TL.LOI_CHAO) === JSON.stringify(HAM.LOI_CHAO));
  ok('Trang tự giới thiệu "em là Trang bên Beeftown"', TL.LOI_CHAO[0] === 'Dạ em chào anh/chị, em là Trang bên Beeftown ạ.', TL.LOI_CHAO[0]);
  ok('Lời chào không nhắc AI, trợ lý, máy, tự động, bot', TL.LOI_CHAO.every(t => !/\bAI\b|trợ lý|máy|tự động|\bbot\b/i.test(t)));
  ok('Lời chào tiếng Hàn của trang trùng LOI_CHAO_HAN của Edge Function', JSON.stringify(TL.LOI_CHAO_HAN) === JSON.stringify(HAM.LOI_CHAO_HAN));
  ok('Lời chào tiếng Hàn: có chữ Hàn, không chữ Việt, không AI / 봇 / 도우미 / 자동',
    TL.LOI_CHAO_HAN.every(t => /[가-힯]/.test(t) && !/[àáảãạăâđèéêìíòóôơùúưỳý]/i.test(t) && !/\bAI\b|봇|도우미|자동/.test(t)));
  ok('loiChao: trang tiếng Hàn chào tiếng Hàn, trang khác chào tiếng Việt',
    TL.loiChao('ko') === TL.LOI_CHAO_HAN && TL.loiChao('vi') === TL.LOI_CHAO && TL.loiChao('en') === TL.LOI_CHAO);
  ok('nnGuiHam: chỉ gửi "ko" hay "vi"', TL.nnGuiHam('ko') === 'ko' && TL.nnGuiHam('vi') === 'vi' && TL.nnGuiHam('en') === 'vi');
  for (const cach of [1, 2, 3]) {
    const d = TL.CACH_DONG_AO[cach];
    ok(`Cách ${cach}: chữ hiện sẵn có "trợ lý ảo" / "virtual assistant" / "가상 도우미" (chỉ "Chính sách tư vấn" thì không đạt)`,
      /trợ lý ảo/i.test(d.dau.vi + d.gach.vi) && /virtual assistant/i.test(d.dau.en + d.gach.en) && /가상 도우미/.test(d.dau.ko + d.gach.ko),
      JSON.stringify(d));
    ok(`Cách ${cach}: không chữ AI, bot, tự động`, !/\bAI\b|\bbot\b|tự động/i.test(d.dau.vi + d.gach.vi));
  }
  ok('Cách 3 ("có nhân viên theo dõi") chỉ khi có người trực, không thì về cách 1; cách 1, 2 không phụ thuộc',
    TL.dongAo(3, false) === TL.CACH_DONG_AO[1] && TL.dongAo(3, true) === TL.CACH_DONG_AO[3]
    && TL.dongAo(2, false) === TL.CACH_DONG_AO[2] && TL.dongAo(1, true) === TL.CACH_DONG_AO[1]);
  ok('Cách đang dùng là một trong ba cách', [1, 2, 3].includes(TL.CACH_DONG_AO_CHON));
  // Ngoài dòng gạch dưới (CACH_DONG_AO) chỉ phần giải thích (veAi — hiện khi khách bấm dòng đó) được nói AI / trợ lý.
  const khacNoiAi = Object.entries(TL.CHU_TRO_LY).filter(([k]) => k !== 'veAi')
    .filter(([, v]) => ['vi', 'en', 'ko'].some(nn => { const s = typeof v[nn] === 'function' ? v[nn]('x') : v[nn]; return /\bAI\b|trợ lý|assistant|도우미/i.test(s); }));
  ok('Ngoài dòng gạch dưới và phần giải thích, không chữ cố định nào nói AI hay trợ lý', khacNoiAi.length === 0, khacNoiAi.map(([k]) => k).join(', '));
  ok('Phần giải thích nói rõ trợ lý ảo (AI) ở cả ba thứ tiếng', /trợ lý ảo \(AI\)/.test(TL.CHU_TRO_LY.veAi.vi) && /\(AI\)/.test(TL.CHU_TRO_LY.veAi.en) && /\(AI\)/.test(TL.CHU_TRO_LY.veAi.ko));
  const thieu = [], lanViet = [], cam = [];
  for (const [k, v] of Object.entries(TL.CHU_TRO_LY)) {
    for (const nn of ['vi', 'en', 'ko']) {
      // Câu có số nhận chữ đếm đã đúng thứ tiếng (CHU_DON.dem[nn] của don-mua-thit.ts).
      const s = typeof v[nn] === 'function' ? v[nn]({ vi: '3 gói', en: '3 packs', ko: '3팩' }[nn]) : v[nn];
      if (typeof s !== 'string' || !s) thieu.push(`${k}.${nn}`);
      else {
        if (nn !== 'vi' && k !== 'ten' && VIET.test(s)) lanViet.push(`${k}.${nn}`);
        if (timChuoiCam(s).length) cam.push(`${k}.${nn}`);
      }
    }
  }
  for (const [cach, d] of Object.entries(TL.CACH_DONG_AO)) {
    for (const nn of ['en', 'ko']) if (VIET.test(d.dau[nn] + d.gach[nn])) lanViet.push(`CACH_DONG_AO.${cach}.${nn}`);
    for (const nn of ['vi', 'en', 'ko']) if (timChuoiCam(d.dau[nn] + d.gach[nn]).length) cam.push(`CACH_DONG_AO.${cach}.${nn}`);
  }
  ok('Mọi chữ cố định có vi, en, ko', thieu.length === 0, thieu.join(', '));
  ok('Tiếng Anh, tiếng Hàn không lẫn chữ Việt', lanViet.length === 0, lanViet.join(', '));
  ok('Không chữ cấm', cam.length === 0, cam.join(', '));
  const hua = Object.entries(TL.CHU_TRO_LY).filter(([, v]) => { const s = typeof v.vi === 'function' ? v.vi('x') : v.vi; return /sẽ vào|gọi lại cho|vào trả lời/.test(s); });
  ok('Không câu nào hứa nhân viên vào khung hay gọi lại', hua.length === 0, hua.map(([k]) => k).join(', '));
  const tp = docNguon('web', 'src', 'components', 'TroLyTrang.astro');
  ok('Dòng gạch dưới in đúng một lần, ngay dưới tên: nút có aria-expanded, aria-controls tới khung giải thích',
    (tp.match(/\{dong\.gach\[nn\]\}/g) ?? []).length === 1
    && /<p class="tlt-ai" id="tlt-ai" data-tlt-ai-dong><span data-tlt-ai-dau>\{dong\.dau\[nn\]\}<\/span><button type="button" class="tlt-ai-nut" aria-expanded="false" aria-controls="tlt-ve" data-tlt-ai>\{dong\.gach\[nn\]\}<\/button><\/p>/.test(tp)
    && /aria-describedby="tlt-ai"/.test(tp));
  ok('Chữ của dòng chỉ đổi theo dongAo (cách đã chọn, có người trực) — không bao giờ thành "đang soạn tin…"',
    (tp.match(/nutAo\.textContent = /g) ?? []).length === 1 && /nutAo\.textContent = d\.gach\[nn\]/.test(tp)
    && /const d = dongAo\(CACH_DONG_AO_CHON, truc\)/.test(tp) && /data-tlt-dang-soan/.test(tp));
  ok('Khung giải thích ẩn lúc đầu, bấm dòng mới hiện; có trợ lý ảo, gặp nhân viên, giá, tin lưu và che, link Quyền riêng tư',
    /<div class="tlt-ve" id="tlt-ve" data-tlt-ve hidden>/.test(tp) && /ve\.hidden = !ve\.hidden;/.test(tp)
    && ['{c.veAi}', '{veGap}', '{c.veTruc}', '{c.veGia}', '{c.veLuu}', "duongDanTuongUng('/quyen-rieng-tu', nn)}#tro-ly-trang"].every(x => tp.includes(x)));
  ok('"Có nhân viên theo dõi" trong phần giải thích chỉ hiện khi có người trực',
    /<li data-tlt-ve-truc hidden>\{c\.veTruc\}<\/li>/.test(tp) && /if \(veGap\) veGap\.hidden = truc;/.test(tp) && /if \(veTruc\) veTruc\.hidden = !truc;/.test(tp));
  for (const [nn, tep] of [['vi', 'quyen-rieng-tu.astro'], ['en', 'en/privacy.astro'], ['ko', 'ko/privacy.astro']]) {
    const t = docNguon('web', 'src', 'pages', ...tep.split('/'));
    const muc = t.split('id="tro-ly-trang"')[1]?.split('<h2')[0] ?? '';
    ok(`Quyền riêng tư (${nn}) có mục id="tro-ly-trang": nói Anthropic, 180 ngày`, /<h2 id="tro-ly-trang">/.test(t) && /Anthropic/.test(muc) && /180/.test(muc));
  }
  ok('Ảnh đại diện là chữ "T" (không <img>, không ảnh người)', !/<img\b/i.test(tp) && (tp.match(/class="tlt-hinh" aria-hidden="true"( data-tlt-hinh)?>T</g) ?? []).length === 2);
});

await nhom('3 · THẺ ĐƠN: TRANG TỰ TÍNH TIỀN BẰNG GIỎ CỦA TRANG', async () => {
  const td = TL.theDon([{ khoa: 'ribeye-with-cap_150', so_goi: 4, ten: 'đầu thăn ngoại còn nắp' }, { khoa: 'kim-chi_500', so_goi: 1, ten: 'kim chi cải thảo' },
    { khoa: 'khong-co_200', so_goi: 2, ten: 'x' }, { khoa: 'la-galbi_150', so_goi: 2, ten: 'sườn bò cắt ngang ướp sẵn' }], MENU, 'vi');
  ok('Tổng = 4 × 300.000 + 75.000 (giá gói của trang), không tính gói lạ, gói tạm hết', td.tamTinh === 1275000, String(td.tamTinh));
  ok('Hai dòng; tên Trang nói kèm tên trên trang; dòng kim chi giữ tên trên trang', JSON.stringify(td.dong.map(d => d.chu)) === JSON.stringify([
    'Đầu thăn ngoại còn nắp (Ribeye with Cap) · Gói 150 g × 4 = ', 'Kim chi cải thảo · Hộp 500 g × 1 = ']), JSON.stringify(td.dong));
  ok('Đếm: "4 gói · 1 hộp"; hai dòng bị bỏ (thieu = 2)', td.dem === '4 gói · 1 hộp' && td.thieu === 2, `${td.dem} · ${td.thieu}`);
  ok('Giỏ đặt vào form đúng khóa và số gói', JSON.stringify([...td.gio]) === JSON.stringify([['ribeye-with-cap_150', 4], ['kim-chi_500', 1]]), JSON.stringify([...td.gio]));
  ok('Tiền in kiểu Việt: 1.275.000 đ', dinhDangTien(td.tamTinh) === '1.275.000 đ');
  ok('Gói của một sản phẩm trên thẻ: bỏ gói tạm hết', JSON.stringify(TL.goiCuaSanPham('la-galbi', MENU, 'vi')) === '[]'
    && JSON.stringify(TL.goiCuaSanPham('ribeye-with-cap', MENU, 'vi')) === JSON.stringify([{ nhan: 'Gói 150 g', gia: 300000 }]));
  const tp = docNguon('web', 'src', 'components', 'TroLyTrang.astro');
  ok('Script in tiền chỉ qua oTien (dinhDangTien trong span data-tien); không innerHTML', /function oTien\(n: number\) \{ const s = el\('span', '', dinhDangTien\(n\)\); s\.dataset\.tien = ''/.test(tp)
    && !/innerHTML|insertAdjacentHTML|outerHTML/.test(tp));
  ok('"Cho vào đơn" đặt số gói vào ô chọn có sẵn của form rồi phát change (luồng đặt hàng cũ)',
    /select\[name="\$\{CSS\.escape\(khoa\)\}"\]/.test(tp) && /formDat\.dispatchEvent\(new Event\('change', \{ bubbles: true \}\)\)/.test(tp));
});

await nhom('4 · ĐỌC TRẢ LỜI CỦA EDGE FUNCTION: KHÔNG TIN DỮ LIỆU NGOÀI', async () => {
  for (const [ten, v, loi] of [['null', null, 'tam_thoi'], ['ok false không mã', { ok: false }, 'tam_thoi'], ['quá lượt', { ok: false, loi: 'qua_luot' }, 'qua_luot'],
    ['tắt', { ok: false, loi: 'tat' }, 'tat'], ['hết lượt của cuộc', { ok: false, loi: 'het_luot' }, 'het_luot'], ['mã lạ', { ok: false, loi: 'gi_do' }, 'tam_thoi'], ['ok mà không tin nào', { ok: true, tin: [] }, 'tam_thoi']]) {
    const k = TL.docTraLoi(v);
    ok(`${ten} → lỗi "${loi}" (trang nói tin CHƯA được trả lời, không bịa câu)`, k.ok === false && k.loi === loi, JSON.stringify(k));
  }
  const k = TL.docTraLoi({ ok: true, tin: ['a', 'b', 'c', 'd', 5], the: [{ ma: 'x', ten: 'X' }, { ma: 'y', ten: 'Y' }, { ma: 'z', ten: 'Z' }, { ten: 'thiếu mã' }],
    don: [{ khoa: 'a_150', so_goi: 11 }, { khoa: 'b_150', so_goi: 2 }, { khoa: 'c_150', so_goi: 0 }, { khoa: 5, so_goi: 1 }], chot: true, chuyen_nguoi: 'true' });
  ok('Tối đa 3 tin, 2 thẻ; số gói 1–10; chuyen_nguoi chỉ khi đúng true', k.ok && k.tin.length === 3 && k.the.length === 2
    && JSON.stringify(k.don.map(d => d.khoa)) === '["b_150"]' && k.chot === true && k.chuyen_nguoi === false, JSON.stringify(k));
  ok('Không đơn thì không chốt', TL.docTraLoi({ ok: true, tin: ['x'], don: [], chot: true }).chot === false);
});

await nhom('5 · NHỊP NHƯ NGƯỜI (bản thử 18/11/2026)', async () => {
  ok('Lần đầu sau lời chào 9–11 giây', TL.trongKhoang(TL.NHIP.tinDauSauChao, 0) === 9000 && TL.trongKhoang(TL.NHIP.tinDauSauChao, 1) === 11000);
  ok('Các lần sau 5–7 giây; "Đã xem" sau 1–2 giây', TL.trongKhoang(TL.NHIP.tinDau, 0.5) === 6000 && TL.trongKhoang(TL.NHIP.doc, 0) === 1000 && TL.trongKhoang(TL.NHIP.doc, 1) === 2000);
  ok('Tin thứ 2, 3 "gõ" 2–4 giây ±15%', TL.thoiGianGo('x', 0) === 1700 && TL.thoiGianGo('x'.repeat(200), 1) === 4600 && TL.thoiGianGo('x'.repeat(60), 0.5) === 3000);
  const tp = docNguon('web', 'src', 'components', 'TroLyTrang.astro');
  ok('Máy trả lời chậm hơn mốc thì không chờ thêm (chỉ chờ phần còn lại)', /const con = hanTra - \(Date\.now\(\) - batDau\); if \(con > 0\) await doi\(con\);/.test(tp));
});

await nhom('6 · LỜI GỌI EDGE FUNCTION: KHÔNG COOKIE, CHỈ NĂM Ô, GỬI LẠI CÙNG MÃ TIN', async () => {
  const tp = docNguon('web', 'src', 'components', 'TroLyTrang.astro');
  ok('text/plain (không hỏi trước CORS), credentials: omit, hết giờ 45 giây', /'Content-Type': 'text\/plain;charset=UTF-8'/.test(tp) && /credentials: 'omit'/.test(tp)
    && /setTimeout\(\(\) => huy\.abort\(\), 45000\)/.test(tp));
  const than = tp.match(/body: JSON\.stringify\(\{ (cuoc, ma_tin[^}]*)\}\)/)?.[1] ?? '';
  ok('Thân gửi đúng sáu ô: cuoc, ma_tin, tin, tra_truoc, chi_nhanh, nn (trang đang mở, 23/11/2026)',
    JSON.stringify(than.split(',').map(x => x.trim().split(':')[0].trim())) === JSON.stringify(['cuoc', 'ma_tin', 'tin', 'tra_truoc', 'chi_nhanh', 'nn'])
    && /nn: nnGuiHam\(nn\)/.test(than), than);
  const xem = tp.match(/body: JSON\.stringify\(\{ (hanh_dong[^}]*)\}\)/)?.[1] ?? '';
  ok('Lệnh xem gửi đúng bốn ô: hanh_dong xem, cuoc, sau (mốc đã hiện), chi_nhanh; hết giờ 15 giây',
    xem.trim() === "hanh_dong: 'xem', cuoc, sau: moc, chi_nhanh: goc.dataset.chiNhanh" && /setTimeout\(\(\) => huy\.abort\(\), 15000\)/.test(tp), xem);
  ok('Gửi lại dùng đúng mã tin cũ và dòng tin cũ', /void gui\(tin, maTin, dongKhach\)/.test(tp) && /const maTin = maTinCu \?\? taoMa\(\)/.test(tp));
  ok('Đang chờ thì nút Gửi khóa, không gửi chồng', /if \(!tin \|\| dangGui\) return;/.test(tp) && /nutGui!\.disabled = b/.test(tp));
  ok('Khối ra trang với hidden, script hiện khi có <dialog> và fetch; quy tắc [hidden] riêng của component',
    /data-tlt [^>]*hidden>/.test(tp.replace(/\n\s+/g, ' ')) && /typeof HTMLDialogElement === 'function'/.test(tp) && /\[hidden\] \{ display: none !important; \}/.test(tp));
});

await nhom('7 · NHÂN VIÊN NHẬN CHAT: LỆNH XEM, TIN NHÂN VIÊN KHÔNG DƯỚI TÊN TRANG', async () => {
  const k = TL.docTraLoi({ ok: true, nhan_vien: true, ten: '  Minh ' });
  ok('Tin tới nhân viên đang nhận: { ok, nhanVien, ten } — không câu nào của Trang', k.ok && k.nhanVien === true && k.ten === 'Minh' && !('tin' in k), JSON.stringify(k));
  for (const [ten, v, loi] of [['null', null, 'tam_thoi'], ['tắt', { ok: false, loi: 'tat' }, 'tat'], ['ok mà không phải lệnh xem', { ok: true, tin: [] }, 'tam_thoi']]) {
    const x = TL.docXem(v);
    ok(`Lệnh xem: ${ten} → "${loi}"`, x.ok === false && x.loi === loi, JSON.stringify(x));
  }
  const x = TL.docXem({ ok: true, xem: true, ai_tra_loi: 'nhan_vien', ten: 'Minh', dang_go: true, truc: true, tin: [
    { id: 9, nguoi: 'nhan_vien', noi_dung: ' Dạ em là Minh bên quán ạ ', ten: 'Minh' }, { id: 7, nguoi: 'he_thong', noi_dung: 'nhan_vien_vao', ten: 'Minh' },
    { id: 8, nguoi: 'he_thong', noi_dung: 'gi_do' }, { id: 10, nguoi: 'trang', noi_dung: 'x' }, { id: 11, nguoi: 'nhan_vien', noi_dung: '  ' }, { id: 'a', nguoi: 'nhan_vien', noi_dung: 'y' }] });
  ok('Giữ tin nhân viên có chữ và câu hệ thống đã biết, cũ trước; bỏ mã lạ, tin Trang, tin rỗng, id sai',
    x.ok && JSON.stringify(x.tin.map(t => [t.id, t.nguoi, t.noiDung])) === JSON.stringify([[7, 'he_thong', 'nhan_vien_vao'], [9, 'nhan_vien', 'Dạ em là Minh bên quán ạ']]), JSON.stringify(x));
  ok('Nhân viên đang nhận: tên, đang gõ, có người trực', x.ok && x.aiTraLoi === 'nhan_vien' && x.ten === 'Minh' && x.dangGo && x.truc);
  const t = TL.docXem({ ok: true, xem: true, ai_tra_loi: 'trang', ten: 'Minh', dang_go: true, truc: false, tin: [] });
  ok('Trang đang trả lời: không tên nhân viên, không bong bóng nhân viên đang gõ', t.ok && t.aiTraLoi === 'trang' && t.ten === null && t.dangGo === false);
  ok('Câu hệ thống: "Minh, nhân viên Beeftown, đã vào chat." · không tên thì "Nhân viên Beeftown đã vào chat." · "Trang tiếp tục hỗ trợ anh/chị."',
    TL.CHU_TRO_LY.nhanVienVao.vi('Minh') === 'Minh, nhân viên Beeftown, đã vào chat.' && TL.CHU_TRO_LY.nhanVienVao.vi(null) === 'Nhân viên Beeftown đã vào chat.'
    && TL.CHU_TRO_LY.trangQuayLai.vi === 'Trang tiếp tục hỗ trợ anh/chị.');
  ok('Hỏi lại nhanh khi nhân viên đang nhận (≤ 3 giây), chậm khi Trang trả lời (≥ 5 giây), thưa khi chưa ai trực (30 giây), lỗi thì giãn tới 30 giây',
    TL.NHIP_XEM.nhanVien <= 3000 && TL.NHIP_XEM.trang >= 5000 && TL.NHIP_XEM.khongTruc === 30000 && TL.NHIP_XEM.loiToiDa === 30000);
  const tpx = docNguon('web', 'src', 'components', 'TroLyTrang.astro');
  ok('Chưa ai trực thì hỏi thưa; mở lại khung thì hỏi lại kể cả sau khi công tắc từng tắt',
    tpx.includes("const nhip = cheDo === 'nhan_vien' ? NHIP_XEM.nhanVien : truc ? NHIP_XEM.trang : NHIP_XEM.khongTruc;") && /tatXem = false;\s*void xem\(\);/.test(tpx));
  const tp = docNguon('web', 'src', 'components', 'TroLyTrang.astro');
  ok('Tin nhân viên là tin của nhân viên: lớp tlt-cua-nv, nhãn "Tên · Nhân viên Beeftown", không dưới tên Trang',
    /function tinNhanVien\(chu: string, ten: string \| null\) \{\s*const d = el\('div', 'tlt-dong-tin tlt-cua-nv'\);/.test(tp)
    && tp.includes("el('p', 'tlt-nguoi-gui', ten ? `${ten} · ${CHU_TRO_LY.nhanVien[nn]}` : CHU_TRO_LY.nhanVien[nn])"));
  ok('Nhân viên đang nhận: đầu khung đổi sang nhân viên, ẩn dòng trợ lý ảo; trả lại thì về Trang',
    tp.includes('if (tenDau) tenDau.textContent = laNv ? (tenNv ?? CHU_TRO_LY.nhanVien[nn]) : CHU_TRO_LY.ten[nn];')
    && tp.includes('if (dongAoEl) dongAoEl.hidden = laNv;'));
  ok('Gửi lúc nhân viên đang nhận: không nhịp của Trang (không "Đã xem" giả, không bong bóng Trang), ghi "Đã gửi"',
    tp.includes('const henGo = choNhanVien ? undefined :') && tp.includes('daXem(dongKhach, CHU_TRO_LY.daGui[nn])'));
  ok('Đóng khung hay ẩn thẻ thì thôi hỏi lại; chưa gửi tin nào thì chỉ hỏi một lần lúc mở; công tắc tắt thì thôi hẳn',
    tp.includes("hop.addEventListener('close', () => { document.documentElement.classList.remove('tlt-khoa'); thoiXem(); });")
    && tp.includes('if (tatXem || !hop!.open || document.hidden) return;') && tp.includes("if (cheDo !== 'nhan_vien' && !coCuoc) return;")
    && tp.includes("if (kq.loi === 'tat') tatXem = true;"));
  ok('Chỉ hiện tin mới hơn mốc (không hiện hai lần một tin nhân viên)', tp.includes('for (const t of kq.tin) if (t.id > moc) { moc = t.id; hienTinXem(t); }'));
});

process.exit(ketThuc('KHUNG NHẮN TIN TRANG'));
