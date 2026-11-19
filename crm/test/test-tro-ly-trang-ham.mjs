/**
 * BEEFTOWN — TRỢ LÝ TRANG: EDGE FUNCTION VỚI CLAUDE VÀ DATABASE GIẢ
 * ================================================================
 *
 *     node test/test-tro-ly-trang-ham.mjs
 *
 * Edge Function tro-ly-trang (crm/supabase/functions/tro-ly-trang): xu-ly.ts nhận phụ thuộc từ ngoài, nên ở đây Claude
 * và database là hàm giả — thử từng kiểu hỏng mà không tốn tiền. Phần chạy trên database thật: test-tro-ly-trang.mjs
 * nhóm 10. Theo 9 mục "xong":
 *
 *   1. quyen — nguồn lạ (Origin khác beeftown.vn) bị từ chối trước khi gọi gì; thiếu khóa thì 503, không gọi Claude.
 *   2. bam-hai-lan — database báo "đang trả lời" → 409, "đã trả lời" → câu cũ, không gọi Claude.
 *   4. chu-va-so — che số điện thoại, email, địa chỉ, tên trước khi gửi Claude; "1,5 gói", "nhà 3 người" giữ nguyên;
 *      máy kiểm tiếng Việt không bắt nhầm lời chào, đoạn chat mẫu, câu an toàn; bắt chữ tiếng Anh, số tiền, câu nhận là
 *      người, câu bịa việc đã làm.
 *   5. mat-mang — Claude ném lỗi (hết giờ, 529), từ chối, trả JSON hỏng, hết token; database mở lượt lỗi / ném: không
 *      bao giờ { ok: true } bịa; lỗi ghi vào nhật ký; ghi nhật ký hỏng sau khi đã có câu thì vẫn trả câu đó.
 *   7. cau-chu — không câu nào của Trang chứa chữ cấm của web (chuoi-cam.js) — bản chép trong thư mục hàm đúng từng byte.
 *   9. dich-vu-ngoai — tham số gửi Claude: Haiku 5.5, không suy nghĩ thêm, hai khối lời dặn lưu đệm, khuôn JSON, không
 *      temperature; Claude viết sai tiếng Việt → viết lại đúng một lần; vẫn sai → thay bảng từ / bỏ tin / câu an toàn.
 *      Giả định về API của Anthropic: crm/supabase/functions/tro-ly-trang/index.ts (SDK @anthropic-ai/sdk 1.8.0).
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOC = join(__dirname, '..', '..');
const HAM = join(GOC, 'crm', 'supabase', 'functions', 'tro-ly-trang');
const nap = p => import(pathToFileURL(p).href);
const xuLy = await nap(join(HAM, 'xu-ly.ts'));
const trang = await nap(join(HAM, 'trang.ts'));
const tv = await nap(join(GOC, 'web', 'src', 'lib', 'tieng-viet-trang.ts'));

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — TRỢ LÝ TRANG: EDGE FUNCTION (CLAUDE, DATABASE GIẢ)');

const MENU = [
  { san_pham_ma: 'ribeye-with-cap', loai: 'thit', don_vi: 'goi', bao_quan: 'mat', ten: 'Ribeye with Cap', ten_vi: 'Ribeye with Cap', mo_ta: 'x', cach_dung: 'y', so_gam: 150, gia: 300000, tam_het: false },
  { san_pham_ma: 'top-blade', loai: 'thit', don_vi: 'goi', bao_quan: 'mat', ten: 'Top Blade', ten_vi: 'Top Blade', mo_ta: 'x', cach_dung: 'y', so_gam: 150, gia: '165000', tam_het: false },
  { san_pham_ma: 'la-galbi', loai: 'thit', don_vi: 'goi', bao_quan: 'dong_lanh', ten: 'LA Galbi', ten_vi: 'LA Galbi', mo_ta: 'x', cach_dung: 'y', so_gam: 150, gia: 150000, tam_het: true },
  { san_pham_ma: 'thu-kim-chi', loai: 'kim_chi', don_vi: 'hop', bao_quan: 'giu_lanh', ten: 'Kim chi cải thảo', ten_vi: 'Kim chi cải thảo', mo_ta: 'Kim chi cải thảo kiểu Hàn.', cach_dung: null, so_gam: 500, gia: 75000, tam_het: false },
  { san_pham_ma: 'mystery-cut', loai: 'thit', don_vi: 'goi', bao_quan: 'mat', ten: 'Mystery Cut', ten_vi: 'Mystery Cut', mo_ta: null, cach_dung: null, so_gam: 200, gia: 99000, tam_het: false },
];
const SO_HOC = [{ hoi: 'Quán có xuất hóa đơn đỏ không?', dap: 'Dạ quán có xuất hóa đơn đỏ ạ.' }];
const NGUON = 'https://beeftown.vn';

/** Database giả: tro_ly_mo_luot trả theo kịch bản, tro_ly_ghi_luot ghi lại. */
function dbGia(moLuot = { duoc: true, luot: 1, lich_su: [], menu: MENU, so_hoc: SO_HOC }) {
  const goi = [];
  const rpc = async (ten, thamSo) => {
    goi.push({ ten, thamSo });
    if (ten === 'tro_ly_mo_luot') return typeof moLuot === 'function' ? moLuot(thamSo) : { data: moLuot, error: null };
    if (ten === 'tro_ly_ghi_luot') return { data: true, error: null };
    if (ten === 'mua_thit_ve_cong_khai') return { data: MENU, error: null };
    return { data: null, error: { message: 'không có hàm' } };
  };
  return { rpc, goi, ghi: () => goi.filter(g => g.ten === 'tro_ly_ghi_luot').map(g => g.thamSo.p_ket_qua) };
}

/** Claude giả: mỗi lần gọi lấy một câu trả lời trong danh sách (JSON, chuỗi, hay hàm ném lỗi). */
function claudeGia(...lanTra) {
  const goi = [];
  const f = async thamSo => {
    goi.push(structuredClone(thamSo));
    const tra = lanTra[Math.min(goi.length - 1, lanTra.length - 1)];
    if (typeof tra === 'function') return tra();
    if (tra && tra.stop_reason) return tra;
    return {
      stop_reason: 'end_turn',
      usage: { input_tokens: 40, output_tokens: 120, cache_read_input_tokens: 7100, cache_creation_input_tokens: 0 },
      content: [{ type: 'text', text: typeof tra === 'string' ? tra : JSON.stringify(tra) }],
    };
  };
  return { f, goi };
}
const KQ = (them = {}) => ({ tin: ['Dạ nhà mình mấy người ạ?'], the: [], don: [], chot: false, chuyen_nguoi: false, cau_chua_biet: '', ...them });

const yc = (than, dau = {}) => new Request('https://bzf.supabase.co/functions/v1/tro-ly-trang', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=UTF-8', Origin: NGUON, 'x-forwarded-for': '192.0.2.10, 10.0.0.1', ...dau },
  body: typeof than === 'string' ? than : JSON.stringify(than),
});
const THAN = (them = {}) => ({ cuoc: crypto.randomUUID(), ma_tin: crypto.randomUUID(), tin: 'nhà 4 người nên lấy gì', ...them });
const chay = async (req, mt) => { const r = await xuLy.xuLyYeuCau(req, { ghiLog: () => {}, ...mt }); return { r, j: await r.json().catch(() => null) }; };

// ===========================================================================
await nhom('1 · BẢN CHÉP TRONG THƯ MỤC HÀM ĐÚNG TỪNG BYTE (Supabase chỉ đóng gói thư mục hàm)', async () => {
  for (const f of ['tieng-viet-trang.ts', 'chuoi-cam.js']) {
    const goc = readFileSync(join(GOC, 'web', 'src', 'lib', f), 'utf8');
    const chep = readFileSync(join(HAM, f), 'utf8');
    ok(`${f}: bản trong thư mục hàm giống web/src/lib (chép lại: cp web/src/lib/${f} crm/supabase/functions/tro-ly-trang/)`, goc === chep);
  }
});

await nhom('2 · MÁY KIỂM TIẾNG VIỆT VÀ CHỮ CẤM', async () => {
  ok('Lời chào sạch', trang.LOI_CHAO.every(t => !tv.chuNgoai(t).length && !tv.chuCam(t).length));
  ok('Câu an toàn sạch', !tv.chuNgoai(trang.CAU_AN_TOAN).length && !tv.chuCam(trang.CAU_AN_TOAN).length);
  ok('Lời chào không nhắc AI, trợ lý, tự động, bot', trang.LOI_CHAO.every(t => !/\bAI\b|trợ lý|tự động|\bbot\b|máy/i.test(t)));
  const em = trang.LOI_DAY_CO_DINH.split('\n').filter(d => d.startsWith('Em: ')).map(d => d.slice(4).replace(/\s*\[[^\]]*\]$/, '').split('||')).flat();
  ok(`Đoạn chat mẫu: ${em.length} tin của Trang, không tin nào có chữ nước ngoài hay chữ cấm`,
    em.length >= 20 && em.every(t => !tv.chuNgoai(t).length && !tv.chuCam(t).length),
    em.filter(t => tv.chuNgoai(t).length || tv.chuCam(t).length).join(' | '));
  ok('Lời dặn mở đầu: Trang là trợ lý ảo (AI) của quầy thịt Beeftown', trang.LOI_DAY_CO_DINH.startsWith('Em là Trang, trợ lý ảo (AI) của quầy thịt Beeftown'));
  ok('Lời dặn: hỏi người hay máy thì nói "Dạ em là trợ lý ảo của Beeftown ạ"; không bao giờ viết AI, bot, tự động trong tin',
    trang.LOI_DAY_CO_DINH.includes('"Dạ em là trợ lý ảo của Beeftown ạ"') && trang.LOI_DAY_CO_DINH.includes('Không bao giờ viết chữ "AI", "bot", "chatbot", "tự động", "trí tuệ nhân tạo" trong tin'));
  ok('Đoạn mẫu của Trang không có chữ AI, bot, tự động; người hay máy trả lời "trợ lý ảo"',
    em.every(t => !/(^|[^\p{L}])AI(?![\p{L}])|\bbot\b|tự động/u.test(t)) && em.some(t => t.startsWith('Dạ em là trợ lý ảo của Beeftown ạ.')));
  ok('Lời chào và đoạn mẫu không còn "trợ lý tự động" của bản thử', ![...trang.LOI_CHAO, ...em].some(t => /trợ lý tự động/.test(t)));
  for (const [t, mong] of [
    ['có ribeye không em, ăn medium rare được không', ['ribeye', 'medium', 'rare']],
    ['ok shop, set này size nào', ['ok', 'shop', 'set', 'size']],
    ['Dạ thanh toán qua VNPay, mã QR, giao qua Ahamove, nhắn Zalo hay Facebook ạ', []],
    ['Gói 150 g, 1,5 gói mỗi người, khoảng 225 gam', []],
    ['Ngon nhứt luôn á', []],
  ]) ok(`chuNgoai("${t}") = [${mong}]`, JSON.stringify(tv.chuNgoai(t)) === JSON.stringify(mong), JSON.stringify(tv.chuNgoai(t)));
  for (const [t, cam] of [
    ['Dạ gói này 300.000đ ạ', true], ['Dạ gói này 300 nghìn ạ', true], ['giá 300k thôi ạ', true], ['tổng 1.250.000', true],
    ['Dạ phần này rẻ lắm ạ', true], ['Dạ đây là thịt bò Hanwoo ạ', true], ['Dạ em là người thật ạ', true],
    ['Dạ em không phải là máy đâu ạ', true], ['Nhân viên sẽ vào chat ngay ạ', true], ['Để em ra kho xem lại nhé', true],
    ['Em vừa hỏi bếp rồi ạ', true], ['Ngon nhất quán ạ', true],
    ['Dạ em là trợ lý AI của Beeftown ạ', true], ['Dạ em là chatbot của quán ạ', true], ['Dạ trang tự động tính tiền ạ', true],
    ['Em dùng trí tuệ nhân tạo ạ', true], ['Dạ em là A.I. ạ', true],
    ['Dạ em là trợ lý ảo của Beeftown ạ', false], ['Nhà mình có ai ăn cay không ạ?', false], ['Ai ăn tái được thì lấy diềm thăn ạ', false],
    // Bộ chấm lần 1 (#30, #41): nói như đang làm việc ngoài khung nhắn tin.
    ['Dạ giờ giao buổi tối khoảng 7 giờ em ghi lại giúp anh/chị ở phần ghi chú khi đặt hàng ạ.', true], ['Dạ được ạ, anh chờ em một chút nhé.', true],
    ['Để em báo nhân viên nhé', true], ['Dạ em sẽ báo quán ạ', true], ['Để em kiểm tra lại ạ', true],
    ['Anh/chị ghi giờ muốn nhận ở ô Ghi chú khi đặt nhé.', false], ['Dạ em ghi 3 gói diềm thăn bò cho chị ạ.', false],
    ['Dạ mỗi phần hợp một gu nên em hỏi anh/chị chút ạ.', false], ['Anh/chị nhắn Zalo cho quán theo cách bên dưới nhé.', false],
    // Rà soát 19/11: câu đúng không được bắt nhầm.
    ['Em lưu ý anh/chị ghi giờ muốn nhận ở ô Ghi chú nhé.', false], ['Dạ để em báo giá ở thẻ ngay bên dưới ạ.', false], ['Để em báo nhân viên nhé', true],
    ['Dạ 2 khay, mỗi người 1,5 gói ạ', false], ['Dạ tầng 3, 63 Hồ Tùng Mậu ạ', false],
    ['Dạ gói 150 g ạ', false], ['Dạ 2 kg là nhiều đó ạ', false],
  ]) ok(`chuCam("${t}") ${cam ? 'bắt' : 'không bắt'}`, (tv.chuCam(t).length > 0) === cam, JSON.stringify(tv.chuCam(t)));
  ok('thayBangTu: "ribeye medium rare ok" → tiếng Việt', tv.chuNgoai(tv.thayBangTu('ribeye medium rare ok nha')).length === 0, tv.thayBangTu('ribeye medium rare ok nha'));
});

await nhom('3 · CHE THÔNG TIN KHÁCH (chữ có dấu, số kiểu Việt)', async () => {
  for (const [vao, ra] of [
    ['số em 0961 245 124 nha', 'số em [số điện thoại] nha'],
    ['+84 912 345 678', '[số điện thoại]'],
    ['email lan.nguyen@gmail.com', 'email [email]'],
    ['giao tới 12/3A Nguyễn Trãi, phường Bến Thành, quận 1', 'giao tới [địa chỉ], [địa chỉ], quận 1'],
    ['Phường Bến Thành, giao chiều nay', '[địa chỉ], giao chiều nay'],
    ['địa chỉ của chị là 45 Lê Lợi quận 1. Giao chiều nay', 'địa chỉ của chị là [địa chỉ]. Giao chiều nay'],
    ['hẻm 45 đường số 7', '[địa chỉ]'],
    ['số 12 Trần Hưng Đạo', '[địa chỉ]'],
    ['tên chị là Nguyễn Lan', 'tên chị là [tên]'],
    ['nhà 3 người, 2 khay đầu thăn, 1,5 gói mỗi người', 'nhà 3 người, 2 khay đầu thăn, 1,5 gói mỗi người'],
    ['Đúng 225 gam mỗi người hả em', 'Đúng 225 gam mỗi người hả em'],
  ]) ok(`"${vao}" → "${ra}"`, trang.cheThongTin(vao) === ra, trang.cheThongTin(vao));
});

await nhom('4 · ĐỌC KẾT QUẢ CỦA CLAUDE: thẻ, đơn theo menu, chốt, câu chưa biết', async () => {
  const menu = trang.docMenu(MENU);
  ok('Menu: sản phẩm tên không nói được bằng tiếng Việt ("Mystery Cut") bị bỏ khỏi dữ liệu của Trang', !menu.some(m => m.ma === 'mystery-cut') && menu.length === 4);
  const duTrung = trang.duLieuLuot(trang.docMenu([...MENU, { san_pham_ma: 'thu-ribeye', loai: 'thit', don_vi: 'goi', bao_quan: 'mat', ten: 'Ribeye', ten_vi: 'Ribeye', mo_ta: null, cach_dung: null, so_gam: 200, gia: 189000, tam_het: false }]), [], true);
  ok('Tên đọc qua bảng từ trùng đầu tên phần thịt của quầy ("Ribeye" → "đầu thăn ngoại"): dữ liệu dặn hỏi lại khách', /đầu thăn ngoại — mã thu-ribeye.*Lưu ý: khác sản phẩm đầu thăn ngoại còn nắp/.test(duTrung), duTrung);
  ok('Địa chỉ quán "TP.HCM" qua máy kiểm tiếng Việt', tv.chuNgoai('Dạ quán ở tầng 3, 63 Hồ Tùng Mậu, TP.HCM ạ').length === 0);
  ok('Kim chi gọi là kim chi, không phải thịt', trang.theCua('thu-kim-chi', menu)?.loai === 'Kim chi');
  const kq = trang.docKetQua(JSON.stringify({
    tin: ['**Dạ** chào ạ', '- hai', '', 'ba', 'bốn'], the: ['ribeye-with-cap', 'ribeye-with-cap', 'khong-co', 'top-blade', 'thu-kim-chi'],
    don: [{ khoa: 'ribeye-with-cap_150', so_goi: 7 }, { khoa: 'ribeye-with-cap_150', so_goi: 6 }, { khoa: 'la-galbi_150', so_goi: 2 },
          { khoa: 'top-blade_200', so_goi: 1 }, { khoa: 'top-blade_150', so_goi: 0 }],
    chot: true, chuyen_nguoi: false, cau_chua_biet: 'không được ghi' }), menu);
  ok('Tối đa 3 tin, bỏ markdown và gạch đầu dòng', JSON.stringify(kq?.tin) === JSON.stringify(['Dạ chào ạ', 'hai', 'ba']), JSON.stringify(kq?.tin));
  ok('Thẻ: chỉ mã có trên menu, không lặp, tối đa 2', JSON.stringify(kq?.the) === JSON.stringify(['ribeye-with-cap', 'top-blade']), JSON.stringify(kq?.the));
  ok('Đơn: gộp dòng trùng, tối đa 10 gói; bỏ gói tạm hết, cỡ không có, số 0', JSON.stringify(kq?.don) === JSON.stringify([{ khoa: 'ribeye-with-cap_150', so_goi: 10 }]), JSON.stringify(kq?.don));
  ok('Chốt khi có đơn; câu chưa biết chỉ khi chuyển người', kq?.chot === true && kq?.cau_chua_biet === '');
  const kq2 = trang.docKetQua({ tin: ['Dạ'], the: [], don: [], chot: true, chuyen_nguoi: true, cau_chua_biet: 'Gọi 0912345678 được không?' }, menu);
  ok('Không đơn thì không chốt; câu chưa biết che số điện thoại', kq2?.chot === false && kq2?.cau_chua_biet === 'Gọi [số điện thoại] được không?', JSON.stringify(kq2));
  ok('Không phải JSON → null', trang.docKetQua('Dạ chào anh', menu) === null && trang.docKetQua('{"tin": "x"}', menu) === null);
  const du = trang.duLieuLuot(menu, SO_HOC, true);
  ok('Khối dữ liệu: khóa gói đúng dạng trang (mã_số gam), gói tạm hết ghi rõ, sổ học, trả trước VNPay',
    du.includes('ribeye-with-cap_150 (gói 150 g, 300.000 đồng)') && du.includes('la-galbi_150 (gói 150 g, 150.000 đồng, đang tạm hết ở quầy: không gợi ý)')
    && du.includes('Đáp: Dạ quán có xuất hóa đơn đỏ ạ.') && du.includes('VNPay'), du);
  ok('Chưa cài VNPay: nói quán gọi xác nhận, không nói trả trước', !trang.duLieuLuot(menu, [], false).includes('trả trước qua VNPay'));
});

await nhom('5 · THAM SỐ GỬI CLAUDE (dịch vụ ngoài)', async () => {
  const db = dbGia();
  const c = claudeGia(KQ());
  const { r, j } = await chay(yc(THAN({ tin: 'nhà 4 người, số chị 0912 345 678, giao 12 Lê Lợi' })), { goiClaude: c.f, rpc: db.rpc });
  ok('200 { ok: true }', r.status === 200 && j?.ok === true, JSON.stringify(j));
  const p = c.goi[0];
  ok('Mô hình claude-haiku-5-5', p.model === 'claude-haiku-5-5');
  ok('Không suy nghĩ thêm (thinking disabled)', p.thinking?.type === 'disabled');
  ok('Hai khối system, cả hai lưu đệm; khối đầu là lời dặn cố định', p.system?.length === 2 && p.system.every(s => s.cache_control?.type === 'ephemeral') && p.system[0].text === trang.LOI_DAY_CO_DINH);
  ok('Khuôn JSON bắt buộc (output_config.format json_schema)', p.output_config?.format?.type === 'json_schema' && JSON.stringify(p.output_config.format.schema) === JSON.stringify(trang.KHUON_KET_QUA));
  ok('Không gửi temperature, top_p, top_k (API 2026-10-21 từ chối)', !('temperature' in p) && !('top_p' in p) && !('top_k' in p));
  ok('Tin khách gửi Claude đã che số điện thoại và địa chỉ', p.messages.at(-1).content === 'nhà 4 người, số chị [số điện thoại], giao [địa chỉ]', p.messages.at(-1).content);
  const mo = db.goi.find(g => g.ten === 'tro_ly_mo_luot').thamSo;
  ok('Database nhận tin đã che, IP khách đầu tiên của x-forwarded-for', mo.p_tin === p.messages.at(-1).content && mo.p_ip === '192.0.2.10', JSON.stringify(mo));
  const g = db.ghi()[0];
  ok('Nhật ký ghi tra_loi, token (cả lưu đệm), mili giây', g?.tra_loi?.tin?.length === 1 && g.token_doc_dem === 7100 && typeof g.mili_giay === 'number', JSON.stringify(g));
  const ls = dbGia({ duoc: true, luot: 3, menu: MENU, so_hoc: [], lich_su: [
    { khach: 'chào em', tra_loi: KQ({ tin: ['Dạ em chào anh ạ.'] }) }, { khach: 'hỏng', tra_loi: null }] });
  const c2 = claudeGia(KQ());
  await chay(yc(THAN({ tin: 'có ribeye không' })), { goiClaude: c2.f, rpc: ls.rpc });
  const m = c2.goi[0].messages;
  ok('Lịch sử lấy từ database: khách → Trang (JSON) → tin mới; lượt hỏng bị bỏ', m.length === 3 && m[0].role === 'user' && m[1].role === 'assistant'
    && JSON.parse(m[1].content).tin[0] === 'Dạ em chào anh ạ.' && m[2].content === 'có ribeye không', JSON.stringify(m));
  const c3 = claudeGia(KQ());
  await chay(yc(THAN({ tra_truoc: true })), { goiClaude: c3.f, rpc: dbGia().rpc });
  ok('Trang đã cài VNPay (tra_truoc) → khối dữ liệu nói trả trước', c3.goi[0].system[1].text.includes('trả trước qua VNPay'));
});

await nhom('6 · VIẾT LẠI MỘT LẦN KHI SAI TIẾNG VIỆT HAY PHẠM LUẬT', async () => {
  const c = claudeGia(KQ({ tin: ['Dạ ok, set ribeye medium rare nha'] }), KQ({ tin: ['Dạ được ạ, đầu thăn ngoại nướng tái chín (giữa còn hồng đỏ) nhé.'] }));
  const db = dbGia();
  const { j } = await chay(yc(THAN()), { goiClaude: c.f, rpc: db.rpc });
  ok('Gọi Claude hai lần; lần hai có tin của lần một và câu bắt viết lại', c.goi.length === 2 && c.goi[1].messages.at(-2).role === 'assistant'
    && /ok, set, ribeye, medium, rare/.test(c.goi[1].messages.at(-1).content), c.goi[1]?.messages.at(-1).content);
  ok('Khách nhận bản viết lại', j?.tin?.[0] === 'Dạ được ạ, đầu thăn ngoại nướng tái chín (giữa còn hồng đỏ) nhé.', JSON.stringify(j));
  ok('Nhật ký: viet_lai = true', db.ghi()[0]?.viet_lai === true);

  const cTien = claudeGia(KQ({ tin: ['Dạ gói này 300.000đ ạ.'] }), KQ({ tin: ['Dạ giá em gửi ở thẻ ngay bên dưới ạ.'] }));
  const { j: jt } = await chay(yc(THAN()), { goiClaude: cTien.f, rpc: dbGia().rpc });
  ok('Số tiền trong tin → viết lại, khách không thấy số tiền', cTien.goi.length === 2 && jt?.tin?.[0] === 'Dạ giá em gửi ở thẻ ngay bên dưới ạ.', JSON.stringify(jt));

  const cVanSai = claudeGia(KQ({ tin: ['Dạ ribeye ngon lắm ạ', 'Giá 300k thôi'] }), KQ({ tin: ['Dạ ribeye ngon lắm ạ', 'Giá 300k thôi'] }));
  const dbV = dbGia();
  const { j: jv } = await chay(yc(THAN()), { goiClaude: cVanSai.f, rpc: dbV.rpc });
  ok('Viết lại vẫn sai: thay bảng từ, bỏ tin phạm luật', JSON.stringify(jv?.tin) === JSON.stringify(['Dạ đầu thăn ngoại ngon lắm ạ']), JSON.stringify(jv));
  ok('Nhật ký: thay_tu, bo_tin = 1', dbV.ghi()[0]?.thay_tu === true && dbV.ghi()[0]?.bo_tin === 1, JSON.stringify(dbV.ghi()[0]));

  const cNguoi = claudeGia(KQ({ tin: ['Dạ em là người thật ạ'] }), KQ({ tin: ['Dạ em là người thật ạ'] }));
  const { j: jn } = await chay(yc(THAN({ tin: 'em là người hay máy' })), { goiClaude: cNguoi.f, rpc: dbGia().rpc });
  ok('Nhận là người hai lần: bỏ tin, thay câu an toàn và cách liên hệ quán', jn?.tin?.[0] === trang.CAU_AN_TOAN && jn?.chuyen_nguoi === true, JSON.stringify(jn));

  const cLan2Loi = claudeGia(KQ({ tin: ['Dạ ok ạ, phần này hợp nè'] }), () => { throw Object.assign(new Error('x'), { status: 529 }); });
  const { j: jl } = await chay(yc(THAN()), { goiClaude: cLan2Loi.f, rpc: dbGia().rpc });
  ok('Lần viết lại lỗi mạng: gọt bản đầu bằng bảng từ, vẫn trả lời', jl?.ok === true && jl.tin?.[0] === 'Dạ ạ, phần này hợp nè', JSON.stringify(jl));
});

await nhom('7 · MẤT MẠNG, CLAUDE HỎNG: không bao giờ bịa câu trả lời', async () => {
  for (const [ten, loi, ma] of [
    ['Hết giờ (APIConnectionTimeoutError)', Object.assign(new Error('timeout'), { name: 'APIConnectionTimeoutError' }), 'claude_APIConnectionTimeoutError'],
    ['Quá tải 529', Object.assign(new Error('overloaded'), { status: 529 }), 'claude_529'],
    ['Khóa sai 401', Object.assign(new Error('auth sk-ant-xxx'), { status: 401 }), 'claude_401'],
  ]) {
    const db = dbGia();
    const { r, j } = await chay(yc(THAN()), { goiClaude: claudeGia(() => { throw loi; }).f, rpc: db.rpc });
    ok(`${ten}: 502 { ok: false, loi: "tam_thoi" }`, r.status === 502 && j?.ok === false && j?.loi === 'tam_thoi', JSON.stringify(j));
    ok(`${ten}: nhật ký ghi mã lỗi ${ma}, không ghi nội dung lỗi`, db.ghi()[0]?.loi === ma && !JSON.stringify(db.ghi()[0]).includes('sk-ant'), JSON.stringify(db.ghi()[0]));
  }
  const tuChoi = { stop_reason: 'refusal', usage: {}, content: [] };
  const { j: jr } = await chay(yc(THAN()), { goiClaude: claudeGia(tuChoi).f, rpc: dbGia().rpc });
  ok('Claude từ chối: câu an toàn, chuyển người', jr?.ok === true && jr.tin?.[0] === trang.CAU_AN_TOAN && jr.chuyen_nguoi === true, JSON.stringify(jr));
  const { j: jh } = await chay(yc(THAN()), { goiClaude: claudeGia('{"tin": ["Dạ nhà mình', ).f, rpc: dbGia().rpc });
  ok('JSON cụt (hết token giữa chừng): câu an toàn, chuyển người', jh?.tin?.[0] === trang.CAU_AN_TOAN && jh.chuyen_nguoi === true, JSON.stringify(jh));
  const dbLoi = dbGia(async () => ({ data: null, error: { message: '500' } }));
  const cKhong = claudeGia(KQ());
  const { r: rd, j: jd } = await chay(yc(THAN()), { goiClaude: cKhong.f, rpc: dbLoi.rpc });
  ok('Database mở lượt lỗi: 503 "tam_thoi", không gọi Claude', rd.status === 503 && jd?.loi === 'tam_thoi' && cKhong.goi.length === 0);
  const dbNem = dbGia(async () => { throw new TypeError('fetch failed'); });
  const { r: rn } = await chay(yc(THAN()), { goiClaude: cKhong.f, rpc: dbNem.rpc });
  ok('Database không gọi được (mạng): 503, không gọi Claude', rn.status === 503 && cKhong.goi.length === 0);
  const dbGhiHong = dbGia();
  const rpcGhiHong = async (ten, thamSo) => (ten === 'tro_ly_ghi_luot' ? (() => { throw new Error('mất mạng'); })() : dbGhiHong.rpc(ten, thamSo));
  const { r: rg, j: jg } = await chay(yc(THAN()), { goiClaude: claudeGia(KQ()).f, rpc: rpcGhiHong });
  ok('Ghi nhật ký hỏng sau khi đã có câu: vẫn trả câu đó (200)', rg.status === 200 && jg?.tin?.[0] === KQ().tin[0], JSON.stringify(jg));
});

await nhom('8 · DATABASE TỪ CHỐI, GỬI HAI LẦN, YÊU CẦU SAI, NGUỒN LẠ', async () => {
  for (const [lyDo, trangThai, loi] of [['tat', 403, 'tat'], ['chua_mo', 403, 'tat'], ['qua_luot_ip', 429, 'qua_luot'], ['qua_luot_cuoc', 429, 'het_luot'],
    ['qua_luot_ngay', 429, 'qua_luot'], ['dang_tra_loi', 409, 'dang_tra_loi'], ['sai', 400, 'sai']]) {
    const c = claudeGia(KQ());
    const { r, j } = await chay(yc(THAN()), { goiClaude: c.f, rpc: dbGia({ duoc: false, ly_do: lyDo }).rpc });
    ok(`Database "${lyDo}" → ${trangThai} "${loi}", không gọi Claude`, r.status === trangThai && j?.loi === loi && c.goi.length === 0, JSON.stringify(j));
  }
  const c = claudeGia(KQ());
  const daTra = dbGia({ duoc: false, ly_do: 'da_tra_loi', tra_loi: KQ({ tin: ['Câu cũ ạ.'], the: ['top-blade'] }), menu: MENU });
  const { r, j } = await chay(yc(THAN()), { goiClaude: c.f, rpc: daTra.rpc });
  ok('"da_tra_loi" → 200 với câu cũ, thẻ dựng lại từ menu, không gọi Claude', r.status === 200 && j?.tin?.[0] === 'Câu cũ ạ.' && j?.the?.[0]?.nhan === 'Top Blade' && c.goi.length === 0, JSON.stringify(j));
  for (const [ten, than] of [['không phải JSON', 'xin chào'], ['thiếu ma_tin', { cuoc: crypto.randomUUID(), tin: 'x' }],
    ['cuộc không phải uuid', THAN({ cuoc: 'abc' })], ['tin trống', THAN({ tin: '   ' })], ['tin quá 400 ký tự', THAN({ tin: 'ả'.repeat(401) })],
    ['thân quá 4 KB', 'x'.repeat(5000)]]) {
    const cc = claudeGia(KQ());
    const db = dbGia();
    const { r: rs } = await chay(yc(than), { goiClaude: cc.f, rpc: db.rpc });
    ok(`Yêu cầu sai (${ten}) → 400, không gọi database hay Claude`, rs.status === 400 && db.goi.length === 0 && cc.goi.length === 0);
  }
  const db = dbGia();
  const { r: rl } = await chay(yc(THAN(), { Origin: 'https://trang-la.example' }), { goiClaude: claudeGia(KQ()).f, rpc: db.rpc });
  ok('Nguồn lạ → 403, không gọi database', rl.status === 403 && db.goi.length === 0);
  const { r: rk, j: jk } = await chay(yc(THAN()), { goiClaude: null, rpc: db.rpc });
  ok('Chưa đặt ANTHROPIC_API_KEY → 503 "chua_cai"', rk.status === 503 && jk?.loi === 'chua_cai');
  const op = await xuLy.xuLyYeuCau(new Request('https://x/functions/v1/tro-ly-trang', { method: 'OPTIONS', headers: { Origin: NGUON } }), { goiClaude: null, rpc: null });
  ok('OPTIONS từ beeftown.vn → 204, cho đúng nguồn đó', op.status === 204 && op.headers.get('access-control-allow-origin') === NGUON);
  const { r: rok } = await chay(yc(THAN()), { goiClaude: claudeGia(KQ()).f, rpc: dbGia().rpc });
  ok('Trả lời có Access-Control-Allow-Origin đúng nguồn, không lưu đệm', rok.headers.get('access-control-allow-origin') === NGUON && rok.headers.get('cache-control') === 'no-store');
  const ip = h => xuLy.ipKhach(new Request('https://x', { headers: h }));
  ok('IP: ô đầu x-forwarded-for do khách tự đặt không được tin — lấy ô cuối không phải địa chỉ nội bộ', ip({ 'x-forwarded-for': '6.6.6.6, 192.0.2.10, 10.0.0.1' }) === '192.0.2.10');
  ok('IP: có cf-connecting-ip thì dùng nó', ip({ 'cf-connecting-ip': '198.51.100.3', 'x-forwarded-for': '6.6.6.6' }) === '198.51.100.3');
  ok('IP: x-forwarded-for sai dạng → null (không giới hạn theo IP)', xuLy.ipKhach(new Request('https://x', { headers: { 'x-forwarded-for': 'not-an-ip' } })) === null);
});

await nhom('9 · NHÂN VIÊN NHẬN CHAT: KHÔNG GỌI CLAUDE, LỆNH XEM, GHI CHÚ KHI TRẢ LẠI', async () => {
  // Nhân viên đang nhận cuộc: database đã ghi tin cho nhân viên.
  const c = claudeGia(KQ());
  const db = dbGia({ duoc: false, ly_do: 'nhan_vien', ten: 'Minh' });
  const { r, j } = await chay(yc(THAN()), { goiClaude: c.f, rpc: db.rpc });
  ok('Nhân viên đang nhận → 200 { ok, nhan_vien, ten }, không gọi Claude, không đóng lượt nào', r.status === 200 && j?.ok === true && j?.nhan_vien === true
    && j?.ten === 'Minh' && !('tin' in (j ?? {})) && c.goi.length === 0 && db.ghi().length === 0, JSON.stringify(j));

  // Lệnh xem.
  const xemGia = (data, loi = null) => {
    const goi = [];
    return { goi, rpc: async (ten, thamSo) => { goi.push({ ten, thamSo }); return ten === 'tro_ly_xem' ? { data, error: loi } : { data: null, error: { message: 'không có hàm' } }; } };
  };
  const cuoc = crypto.randomUUID();
  const x = xemGia({ ai_tra_loi: 'nhan_vien', ten: 'Minh', dang_go: true, truc: true, tin: [
    { id: 5, nguoi: 'he_thong', noi_dung: 'nhan_vien_vao', ten: 'Minh' }, { id: 6, nguoi: 'nhan_vien', noi_dung: 'Dạ em Minh bên quán ạ', ten: 'Minh' },
    { id: 7, nguoi: 'khach', noi_dung: 'không được lọt ra' }, { id: 'x', nguoi: 'nhan_vien', noi_dung: 'id sai' }] });
  const cx = claudeGia(KQ());
  const { r: rx, j: jx } = await chay(yc({ hanh_dong: 'xem', cuoc, sau: 4, chi_nhanh: 'q1' }), { goiClaude: cx.f, rpc: x.rpc });
  ok('Lệnh xem → 200: ai đang trả lời, tên, đang gõ, có người trực, tin nhân viên / câu hệ thống (không tin khách, id sai)',
    rx.status === 200 && jx?.xem === true && jx.ai_tra_loi === 'nhan_vien' && jx.ten === 'Minh' && jx.dang_go === true && jx.truc === true
    && JSON.stringify(jx.tin.map(t => t.id)) === '[5,6]', JSON.stringify(jx));
  ok('Lệnh xem gọi tro_ly_xem đúng cuộc, mốc, chi nhánh; không gọi Claude', x.goi.length === 1 && x.goi[0].thamSo.p_cuoc === cuoc
    && x.goi[0].thamSo.p_sau === 4 && x.goi[0].thamSo.p_chi_nhanh_ma === 'q1' && cx.goi.length === 0, JSON.stringify(x.goi));
  const { j: jt } = await chay(yc({ hanh_dong: 'xem', cuoc }), { goiClaude: null, rpc: xemGia({ ai_tra_loi: 'trang', ten: 'Minh', dang_go: true, truc: false, tin: [] }).rpc });
  ok('Chưa đặt khóa Claude vẫn xem được; Trang đang trả lời thì không tên, không đang gõ; mốc lạ → 0',
    jt?.ok === true && jt.ai_tra_loi === 'trang' && jt.ten === null && jt.dang_go === false, JSON.stringify(jt));
  const { r: rtat, j: jtat } = await chay(yc({ hanh_dong: 'xem', cuoc }), { goiClaude: null, rpc: xemGia({ tat: true }).rpc });
  ok('Công tắc tắt → 403 "tat"', rtat.status === 403 && jtat?.loi === 'tat');
  const { r: rloi, j: jloi } = await chay(yc({ hanh_dong: 'xem', cuoc }), { goiClaude: null, rpc: xemGia(null, { message: 'hỏng' }).rpc });
  ok('Database lỗi → 503 "tam_thoi"', rloi.status === 503 && jloi?.loi === 'tam_thoi');
  const xs = xemGia({});
  const { r: rsai } = await chay(yc({ hanh_dong: 'xem', cuoc: 'abc' }), { goiClaude: null, rpc: xs.rpc });
  ok('Lệnh xem cuộc không phải uuid → 400, không gọi database', rsai.status === 400 && xs.goi.length === 0);
  const { r: rcc, j: jcc } = await chay(yc({ hanh_dong: 'xem', cuoc }), { goiClaude: claudeGia(KQ()).f, rpc: null });
  ok('Thiếu khóa service_role → 503 "chua_cai"', rcc.status === 503 && jcc?.loi === 'chua_cai');
  const xl = xemGia({});
  const { r: rla } = await chay(yc({ hanh_dong: 'xem', cuoc }, { Origin: 'https://trang-la.example' }), { goiClaude: null, rpc: xl.rpc });
  ok('Lệnh xem từ nguồn lạ → 403, không gọi database', rla.status === 403 && xl.goi.length === 0);

  // Nhân viên vừa trả cuộc lại: ghi chú các tin đã nhắn vào lượt kế tiếp của Trang.
  const xen = [{ nguoi: 'khach', noi_dung: 'cho chị hỏi giao quận 7 không', ten: null }, { nguoi: 'nhan_vien', noi_dung: 'Dạ quán giao quận 7 ạ', ten: 'Minh' }];
  const c2 = claudeGia(KQ());
  await chay(yc(THAN({ tin: 'vậy lấy 2 gói diềm thăn' })), { goiClaude: c2.f, rpc: dbGia({ duoc: true, luot: 3, lich_su: [], menu: MENU, so_hoc: [], xen }).rpc });
  const noi = c2.goi[0]?.messages?.at(-1)?.content ?? '';
  ok('Sau khi nhân viên trả lại: tin gửi Claude có ghi chú hệ thống, tin khách và "Nhân viên Minh", rồi tin khách vừa nhắn',
    noi.startsWith('[Ghi chú của hệ thống, không phải lời khách:') && noi.includes('Khách: cho chị hỏi giao quận 7 không')
    && noi.includes('Nhân viên Minh: Dạ quán giao quận 7 ạ') && noi.endsWith('Tin khách vừa nhắn: vậy lấy 2 gói diềm thăn'), noi);
  const c3 = claudeGia(KQ());
  await chay(yc(THAN({ tin: 'nhà 4 người' })), { goiClaude: c3.f, rpc: dbGia({ duoc: true, luot: 2, lich_su: [], menu: MENU, so_hoc: [], xen: [xen[0]] }).rpc });
  ok('Không tin nhân viên nào ở giữa → tin gửi Claude chỉ là tin khách', c3.goi[0]?.messages?.at(-1)?.content === 'nhà 4 người');
  ok('Ghi chú chỉ dùng chữ đã che, tối đa 12 tin', trang.docXen(Array.from({ length: 20 }, (_, i) => ({ nguoi: 'khach', noi_dung: 't' + i }))).length === 12
    && trang.docXen([{ nguoi: 'trang', noi_dung: 'x' }, { nguoi: 'nhan_vien', noi_dung: '  ' }, null]).length === 0);

  // Khách đòi gặp người → đóng lượt kèm doi_nguoi (cuộc lên đầu màn theo dõi).
  for (const [tin, mong] of [['cho chị gặp nhân viên', true], ['em ơi cho anh nói chuyện với người thật', true], ['gap nhan vien giup chi', true],
    ['nhân viên đâu rồi', true], ['nhà 4 người nên lấy gì', false], ['nhân viên giao hàng có gọi trước không', false]]) {
    ok(`khachDoiNguoi("${tin}") = ${mong}`, trang.khachDoiNguoi(tin) === mong);
  }
  const db4 = dbGia();
  await chay(yc(THAN({ tin: 'cho chị gặp nhân viên' })), { goiClaude: claudeGia(KQ({ chuyen_nguoi: true })).f, rpc: db4.rpc });
  const db5 = dbGia();
  await chay(yc(THAN()), { goiClaude: claudeGia(KQ()).f, rpc: db5.rpc });
  ok('Đóng lượt ghi doi_nguoi: true khi khách đòi gặp người, false khi không', db4.ghi()[0]?.doi_nguoi === true && db5.ghi()[0]?.doi_nguoi === false);
});

await nhom('10 · SAU BỘ CHẤM LẦN 1: ĐƠN LỚN LUÔN HIỆN CÁCH LIÊN HỆ, LỜI DẶN CÓ BẢNG SỐ GÓI', async () => {
  for (const [tin, mong] of [['công ty anh 12 người nướng ngoài trời', 12], ['nhà 4 người', 4], ['nhóm 10 khách', 10], ['15 ng đi nhậu', 15],
    ['2 ngày nữa giao', 0], ['gói 300 nghìn', 0], ['chị 1 người, sau đó 9 người nữa', 9],
    ['nhà 3 người, tháng trước mua cho 20 khách hàng công ty', 3]]) {
    ok(`soNguoiKhachNoi("${tin}") = ${mong}`, trang.soNguoiKhachNoi(tin) === mong, String(trang.soNguoiKhachNoi(tin)));
  }
  const db = dbGia();
  const { j } = await chay(yc(THAN({ tin: 'công ty anh 12 người nướng ngoài trời' })), { goiClaude: claudeGia(KQ({ tin: ['Dạ anh thích thịt mềm hay dai ạ?'] })).f, rpc: db.rpc });
  ok('12 người mà Claude quên đặt chuyen_nguoi → máy đặt (trang hiện cách liên hệ quán), nhật ký ghi đúng', j?.chuyen_nguoi === true && db.ghi()[0]?.tra_loi?.chuyen_nguoi === true, JSON.stringify(j));
  const db2 = dbGia();
  const { j: j2 } = await chay(yc(THAN({ tin: 'nhà 8 người' })), { goiClaude: claudeGia(KQ()).f, rpc: db2.rpc });
  ok('8 người → không ép liên hệ quán', j2?.chuyen_nguoi === false);
  const L = trang.LOI_DAY_CO_DINH;
  ok('Lời dặn: bảng số gói (2 người 3 gói, 6 người 9 gói), số gói trong tin bằng tổng "don", không nói kg',
    L.includes('2 người 3 gói') && L.includes('6 người 9 gói') && L.includes('Số gói nói trong tin phải đúng bằng tổng số gói ghi ở "don"') && L.includes('không nói kg'));
  ok('Lời dặn: từ 9 người là đơn lớn, PHẢI chuyen_nguoi; có đoạn mẫu đơn lớn', L.includes('Từ 9 người trở lên là đơn lớn') && L.includes('Mẫu') && L.includes('(Đơn lớn, quá 8 người)'));
  ok('Lời dặn: không thêm thời gian, nhiệt độ ngoài dữ liệu; không nói như đang làm việc ngoài khung; không mở đầu bằng lời chào',
    L.includes('Thêm thời gian (phút, giờ, đêm)') && L.includes('Nói như đang làm việc ngoài khung nhắn tin') && L.includes('Không mở đầu bằng lời chào'));
  ok('Lời dặn: giao bao lâu, giờ nào theo câu đã học; khu vực giao chưa có thì không tự nói giao được hay không; tên tiếng Hàn không bao giờ nói "không có"',
    L.includes('trả lời theo câu ĐÃ HỌC THÊM về giao hàng') && L.includes('không tự nói giao được, không giao được, hay chỉ giao trong khu nào') && !L.includes('TP.HCM (giao bao lâu') && L.includes('립아이 là ribeye') && L.includes('không bao giờ nói "không có"'));
  ok('Lời dặn (sau lần 2): nhắc đúng mẹo của dữ liệu; chỉ hướng dẫn nút có trên trang (Chọn gói, Cho vào đơn chỉ ở thẻ đơn); dẻ sườn bò chưa ướp; hỏi phần rẻ thì nói thẳng phần giá thấp hơn',
    L.includes('nhắc đúng câu của dữ liệu, không thêm') && L.includes('nút "Cho vào đơn" chỉ có ở thẻ đơn em gửi') && L.includes('Dẻ sườn bò là thịt mát, chưa ướp') && L.includes('không lảng sang hỏi gu'));
});

process.exit(ketThuc('TRỢ LÝ TRANG — EDGE FUNCTION'));
