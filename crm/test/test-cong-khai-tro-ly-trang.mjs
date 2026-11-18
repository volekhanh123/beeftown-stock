/**
 * BEEFTOWN — KHUNG NHẮN TIN TRANG Ở TRANG MUA THỊT VỀ (web/src/lib/tro-ly-trang.ts, components/TroLyTrang.astro)
 * ===========================================================================================================
 *
 *     node test/test-cong-khai-tro-ly-trang.mjs
 *
 * Khánh 18/11/2026: trợ lý tên Trang, nói như nhân viên quầy, không gắn nhãn AI trong từng tin; ĐÚNG MỘT chỗ khách biết
 * đây là trợ lý AI (dòng cố định dưới tên Trang). Theo 9 mục "xong":
 *   1. quyen — khung chỉ dựng khi công tắc bật, trang mở, trang tiếng Việt, có địa chỉ hàm; lời gọi không mang cookie,
 *      chỉ năm ô (cuộc, mã tin, tin, trả trước, chi nhánh).
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
  for (const [ten, a] of [['công tắc null (chưa công bố)', [null, 'mo', 'vi', u]], ['công tắc false', [false, 'mo', 'vi', u]],
    ['chuỗi "true"', ['true', 'mo', 'vi', u]], ['trang chưa mở', [true, 'chua_mo', 'vi', u]], ['mọi gói tạm hết', [true, 'het_quay', 'vi', u]],
    ['đọc menu lỗi', [true, 'loi', 'vi', u]], ['trang tiếng Anh (chờ Khánh chọn)', [true, 'mo', 'en', u]], ['trang tiếng Hàn', [true, 'mo', 'ko', u]],
    ['chưa nối database (CI)', [true, 'mo', 'vi', null]]]) {
    ok(`${ten} → không hiện`, TL.troLyTrangMo(...a) === false);
  }
  const vo = docNguon('web', 'src', 'components', 'TrangMuaThitVe.astro');
  ok('TrangMuaThitVe dựng <TroLyTrang> với noiDung, trangThai, traVnpay', /<TroLyTrang ngonNgu=\{nn\} noiDung=\{nd\} trangThai=\{trangThai\} traVnpay=\{traVnpay\} \/>/.test(vo));
});

await nhom('2 · CHỈ MỘT CHỖ NÓI LÀ AI; LỜI CHÀO TRÙNG LỜI DẶN; CHỮ ĐỦ BA THỨ TIẾNG', async () => {
  ok('Lời chào của trang trùng LOI_CHAO của Edge Function (lời dặn nói Trang đã chào bằng đúng hai câu này)',
    JSON.stringify(TL.LOI_CHAO) === JSON.stringify(HAM.LOI_CHAO));
  ok('Lời chào không nhắc AI, máy, tự động, bot', TL.LOI_CHAO.every(t => !/\bAI\b|máy|tự động|\bbot\b/i.test(t)));
  ok('dongAi nói "AI" ở cả ba thứ tiếng', ['vi', 'en', 'ko'].every(nn => /\bAI\b/.test(TL.CHU_TRO_LY.dongAi[nn])), JSON.stringify(TL.CHU_TRO_LY.dongAi));
  const khacNoiAi = Object.entries(TL.CHU_TRO_LY).filter(([k]) => k !== 'dongAi')
    .filter(([, v]) => ['vi', 'en', 'ko'].some(nn => { const s = typeof v[nn] === 'function' ? v[nn]('x') : v[nn]; return /\bAI\b|trợ lý|assistant|도우미/i.test(s); }));
  ok('Không chữ cố định nào khác nói AI hay trợ lý (đúng một chỗ)', khacNoiAi.length === 0, khacNoiAi.map(([k]) => k).join(', '));
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
  ok('Mọi chữ cố định có vi, en, ko', thieu.length === 0, thieu.join(', '));
  ok('Tiếng Anh, tiếng Hàn không lẫn chữ Việt', lanViet.length === 0, lanViet.join(', '));
  ok('Không chữ cấm', cam.length === 0, cam.join(', '));
  const hua = Object.entries(TL.CHU_TRO_LY).filter(([, v]) => { const s = typeof v.vi === 'function' ? v.vi('x') : v.vi; return /sẽ vào|gọi lại cho|vào trả lời/.test(s); });
  ok('Không câu nào hứa nhân viên vào khung hay gọi lại', hua.length === 0, hua.map(([k]) => k).join(', '));
  const tp = docNguon('web', 'src', 'components', 'TroLyTrang.astro');
  ok('Dòng AI in đúng một lần trong khung, dưới tên, cố định (trạng thái soạn tin là phần tử riêng)',
    (tp.match(/\{c\.dongAi\}/g) ?? []).length === 1 && /data-tlt-dang-soan/.test(tp) && !/dongAi[^\n]*textContent|data-tlt-ai[^\n]*textContent/.test(tp));
  ok('Ảnh đại diện là chữ "T" (không <img>, không ảnh người)', !/<img\b/i.test(tp) && (tp.match(/class="tlt-hinh" aria-hidden="true">T</g) ?? []).length === 2);
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
    ['tắt', { ok: false, loi: 'tat' }, 'tat'], ['mã lạ', { ok: false, loi: 'gi_do' }, 'tam_thoi'], ['ok mà không tin nào', { ok: true, tin: [] }, 'tam_thoi']]) {
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
  ok('Máy trả lời chậm hơn mốc thì không chờ thêm (chỉ chờ phần còn lại)', /const con = moc - \(Date\.now\(\) - batDau\); if \(con > 0\) await doi\(con\);/.test(tp));
});

await nhom('6 · LỜI GỌI EDGE FUNCTION: KHÔNG COOKIE, CHỈ NĂM Ô, GỬI LẠI CÙNG MÃ TIN', async () => {
  const tp = docNguon('web', 'src', 'components', 'TroLyTrang.astro');
  ok('text/plain (không hỏi trước CORS), credentials: omit, hết giờ 45 giây', /'Content-Type': 'text\/plain;charset=UTF-8'/.test(tp) && /credentials: 'omit'/.test(tp)
    && /setTimeout\(\(\) => huy\.abort\(\), 45000\)/.test(tp));
  const than = tp.match(/body: JSON\.stringify\(\{([^}]*)\}\)/)?.[1] ?? '';
  ok('Thân gửi đúng năm ô: cuoc, ma_tin, tin, tra_truoc, chi_nhanh', JSON.stringify(than.split(',').map(x => x.trim().split(':')[0].trim())) === JSON.stringify(['cuoc', 'ma_tin', 'tin', 'tra_truoc', 'chi_nhanh']), than);
  ok('Gửi lại dùng đúng mã tin cũ và dòng tin cũ', /void gui\(tin, maTin, dongKhach\)/.test(tp) && /const maTin = maTinCu \?\? taoMa\(\)/.test(tp));
  ok('Đang chờ thì nút Gửi khóa, không gửi chồng', /if \(!tin \|\| dangGui\) return;/.test(tp) && /nutGui!\.disabled = b/.test(tp));
  ok('Khối ra trang với hidden, script hiện khi có <dialog> và fetch; quy tắc [hidden] riêng của component',
    /data-tlt [^>]*hidden>/.test(tp.replace(/\n\s+/g, ' ')) && /typeof HTMLDialogElement === 'function'/.test(tp) && /\[hidden\] \{ display: none !important; \}/.test(tp));
});

process.exit(ketThuc('KHUNG NHẮN TIN TRANG'));
