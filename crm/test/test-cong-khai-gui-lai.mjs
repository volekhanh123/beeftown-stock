/**
 * BEEFTOWN — FORM CÔNG KHAI: MẤT MẠNG, GỬI LẠI, THÂN QUÁ LỚN (rà soát nợ kỹ thuật 11/10/2026)
 * ==========================================================================================
 *
 *     node test/test-cong-khai-gui-lai.mjs
 *
 * Form hỏi bàn đã làm đúng ba điều mà form nộp hồ sơ chưa làm:
 *
 *   · Lượt gửi KHÔNG CHẮC đã ghi (database không trả lời) ghi cờ khongChac vào cookie kết quả,
 *     để trang sau không mời gửi lại. lib/xu-ly-form.ts chỉ ghi cờ đó cho hỏi bàn — trang tuyển
 *     dụng dựng lại một form trống ngay dưới câu "đừng gửi lại" (TrangTuyenDung.astro).
 *   · Database từ chối (chưa ghi gì) thì người nộp quay về đúng vị trí đã chọn: chuyển hướng về
 *     /tuyen-dung#nop-ho-so bỏ mất vi_tri.
 *   · Thân POST đọc có giới hạn: xu-ly-form.ts gọi request.formData() không kiểm content-length;
 *     kiểm 5 MB của CV chạy SAU khi cả thân đã nằm trong bộ nhớ Worker 128 MB. Hai webhook đã có
 *     bộ đọc giới hạn (kho/ipos-hook.ts, messenger-hook.ts) — giờ là MỘT bộ đọc dùng chung
 *     (lib/than-gioi-han.ts).
 *
 * Bất biến:
 *   1. Mất mạng giữa lượt gửi (ứng tuyển lẫn hỏi bàn): kết quả ok: false, khongChac: true, câu
 *      "KHÔNG CHẮC … đừng gửi lại", chuyển hướng không kèm vi_tri.
 *   2. Database từ chối: câu của database, không khongChac; ứng tuyển chuyển hướng về đúng
 *      ?vi_tri=<mã đã chọn>#nop-ho-so (mã được mã hóa, không chèn được đường dẫn hay #).
 *   3. Đã nhận: ok: true kèm mã, chuyển hướng không kèm vi_tri (F5 không dựng sẵn hồ sơ thứ hai).
 *   4. Thân quá lớn (khai content-length, hoặc không khai mà gửi dòng chảy): KHÔNG gọi database,
 *      dừng đọc ngay khi vượt ngưỡng (không đọc hết vào bộ nhớ), câu "CHƯA được ghi nhận" đủ ba
 *      thứ tiếng — không bao giờ "KHÔNG CHẮC" (database chưa hề được gọi).
 *   5. Thân đứt giữa chừng (dòng chảy lỗi, multipart thiếu đoạn cuối): KHÔNG gọi database, câu
 *      "CHƯA được ghi nhận … gửi lại" — không phải trang 500, không phải "KHÔNG CHẮC".
 *   6. Cookie kết quả mang khongChac qua lần chuyển hướng: ketQuaUngTuyen() trả khongChac.
 *   7. Bộ đọc giới hạn: đúng ngưỡng thì nhận, quá một byte thì từ chối; ipos-hook.ts và
 *      messenger-hook.ts dùng nó, không còn vòng getReader() riêng.
 *   8. Trang tuyển dụng: có script bổ trợ chặn bấm đúp và giữ chữ đã gõ như hỏi bàn; trạng thái
 *      KHÔNG CHẮC không dựng form. Hành vi thật trên trình duyệt: web/kiem-tra/thu-day-du.mjs nhóm 9.
 *
 * Database trả lại mã cũ cho hồ sơ gửi lại y hệt (cùng ngày nộp, hay trong 10 phút): test-tuyen-dung-gui-lai.mjs.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const docNguon = f => readFileSync(join(SRC, f), 'utf8');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — FORM CÔNG KHAI: MẤT MẠNG, GỬI LẠI, THÂN QUÁ LỚN');

const XLF = await nap('xu-ly-form.ts');
const THAN = await nap('than-gioi-han.ts');
const { CAU_NOP } = await nap('nop-ho-so.ts');
const { CAU_DAT_BAN } = await nap('dat-ban.ts');

const NGON_NGU = ['vi', 'en', 'ko'];
const DUONG = { vi: '/tuyen-dung', en: '/en/jobs', ko: '/ko/jobs' };
const DUONG_HB = { vi: '/dat-ban', en: '/en/book', ko: '/ko/book' };

// "KHÔNG CHẮC" (database có thể đã ghi) và "CHƯA được ghi nhận" (database chưa hề nhận) — hai
// điều khác nhau, đừng nói lẫn.
const KHONG_CHAC = { vi: /KHÔNG CHẮC/, en: /NOT SURE/, ko: /확실히 알 수 없어요/ };
const CHUA_GHI = { vi: /CHƯA được ghi nhận/, en: /NOT been recorded/, ko: /접수되지 않았어요/ };

// ---------------------------------------------------------------------------
// Request và client giả
// ---------------------------------------------------------------------------
function formHoSo(viTri = 'SANH-THU') {
  const f = new FormData();
  f.set('vi_tri', viTri);
  f.set('ho_ten', 'Trần Thị Bình');
  f.set('sdt', '0912345679');
  f.set('dong_y', 'co');
  return f;
}
function formHoiBan() {
  const f = new FormData();
  f.set('ngay', '2030-01-02');
  f.set('gio', '19:00');
  f.set('so_khach', '4');
  f.set('ho_ten', 'Nguyễn Văn An');
  f.set('sdt', '0912345678');
  return f;
}
const yeuCau = (duong, form) => new Request(`https://beeftown.vn${duong}`, { method: 'POST', body: form });

/**
 * Thân dạng dòng chảy (không khai content-length — như trình duyệt gửi chunked): mỗi lần đọc
 * nhả một mẩu 64 KB, tổng `tong` byte; `loiSau` byte thì dòng chảy hỏng (mạng đứt).
 * dem.daDoc = số byte bộ đọc đã kéo về.
 */
function yeuCauDongChay(duong, { tong, loiSau = Infinity, khaiDai = null }) {
  const MAU = 64 * 1024;
  const dem = { daDoc: 0 };
  const body = new ReadableStream({
    pull(c) {
      if (dem.daDoc >= loiSau) { c.error(new TypeError('terminated: other side closed')); return; }
      if (dem.daDoc >= tong) { c.close(); return; }
      const n = Math.min(MAU, tong - dem.daDoc);
      dem.daDoc += n;
      c.enqueue(new Uint8Array(n).fill(0x61));
    },
  }, { highWaterMark: 0 });
  const headers = { 'content-type': 'multipart/form-data; boundary=----bt' };
  if (khaiDai !== null) headers['content-length'] = String(khaiDai);
  return { req: new Request(`https://beeftown.vn${duong}`, { method: 'POST', body, headers, duplex: 'half' }), dem };
}

/** Client giả: đếm lời gọi rpc; `tra(ten, thamSo)` quyết định câu trả lời (ném = mất mạng). */
function clientGia(tra) {
  const goi = [];
  return {
    goi,
    rpc: async (ten, thamSo) => { goi.push(ten); return tra(ten, thamSo); },
    storage: { from: () => ({ upload: async () => ({ error: { message: 'không dùng' } }) }) },
  };
}
const mangDut = () => { throw new TypeError('fetch failed'); };

const inKq = l => JSON.stringify(l);

// ===========================================================================
await nhom('1 · MẤT MẠNG GIỮA LƯỢT GỬI → KHÔNG CHẮC (khongChac: true) Ở CẢ ỨNG TUYỂN LẪN HỎI BÀN', async () => {
  ok('xu-ly-form.ts xuất luotUngTuyen và luotDatBan (phần quyết định kết quả, không cần Astro)',
     typeof XLF.luotUngTuyen === 'function' && typeof XLF.luotDatBan === 'function', Object.keys(XLF).join(', '));
  if (typeof XLF.luotUngTuyen !== 'function') return;
  const loiLog = [];
  const goc = console.error;
  console.error = (...x) => loiLog.push(x.join(' '));
  try {
    for (const nn of NGON_NGU) {
      for (const [ten, tra] of [['fetch ném', mangDut],
                                ['error không mã (cổng 502)', () => ({ data: null, error: { message: '<html>502</html>' } })]]) {
        const c = clientGia(tra);
        const l = await XLF.luotUngTuyen(yeuCau(DUONG[nn], formHoSo()), c, DUONG[nn], nn);
        ok(`Ứng tuyển ${nn} — ${ten}: ok false, khongChac true, câu KHÔNG CHẮC (không "CHƯA được ghi nhận")`,
           l.ketQua.ok === false && l.ketQua.khongChac === true && KHONG_CHAC[nn].test(l.ketQua.loi ?? '')
             && !CHUA_GHI[nn].test(l.ketQua.loi ?? ''), inKq(l));
        ok(`Ứng tuyển ${nn} — ${ten}: chuyển hướng về ${DUONG[nn]}#nop-ho-so, KHÔNG kèm vi_tri (không dựng sẵn hồ sơ thứ hai)`,
           l.ve === `${DUONG[nn]}#nop-ho-so`, l.ve);
        ok(`Ứng tuyển ${nn} — ${ten}: gọi nop_ho_so_ung_tuyen đúng một lần`, c.goi.filter(x => x === 'nop_ho_so_ung_tuyen').length === 1, c.goi.join(','));

        const c2 = clientGia(tra);
        const l2 = await XLF.luotDatBan(yeuCau(DUONG_HB[nn], formHoiBan()), c2, DUONG_HB[nn], nn);
        ok(`Hỏi bàn ${nn} — ${ten}: ok false, khongChac true, câu KHÔNG CHẮC`,
           l2.ketQua.ok === false && l2.ketQua.khongChac === true && KHONG_CHAC[nn].test(l2.ketQua.loi ?? ''), inKq(l2));
      }
    }
  } finally { console.error = goc; }
  ok('Mỗi lượt KHÔNG CHẮC ghi một dòng console.error (Workers Logs thấy sự cố)', loiLog.length === 12, `${loiLog.length} dòng`);
});

// ===========================================================================
await nhom('2 · DATABASE TỪ CHỐI → CÂU CỦA DATABASE, QUAY VỀ ĐÚNG VỊ TRÍ ĐÃ CHỌN', async () => {
  if (typeof XLF.luotUngTuyen !== 'function') return ok('Có luotUngTuyen', false);
  const HET_HAN = { data: null, error: { code: 'P0001', message: 'Vị trí này đã hết hạn nhận hồ sơ' } };
  for (const nn of NGON_NGU) {
    const l = await XLF.luotUngTuyen(yeuCau(DUONG[nn], formHoSo('BEP-THU')), clientGia(() => HET_HAN), DUONG[nn], nn);
    ok(`${nn}: ok false, KHÔNG khongChac, có câu lỗi`, l.ketQua.ok === false && !l.ketQua.khongChac && !!l.ketQua.loi, inKq(l));
    ok(`${nn}: chuyển hướng về ${DUONG[nn]}?vi_tri=BEP-THU#nop-ho-so — form chọn sẵn vị trí vừa nộp`,
       l.ve === `${DUONG[nn]}?vi_tri=BEP-THU#nop-ho-so`, l.ve);
  }
  const la = await XLF.luotUngTuyen(yeuCau('/tuyen-dung', formHoSo('A B/../#x?y=1')), clientGia(() => HET_HAN), '/tuyen-dung', 'vi');
  ok('Mã vị trí lạ được mã hóa trong URL — không chèn được đường dẫn, # hay tham số',
     la.ve === '/tuyen-dung?vi_tri=A%20B%2F..%2F%23x%3Fy%3D1#nop-ho-so', la.ve);
  const dai = await XLF.luotUngTuyen(yeuCau('/tuyen-dung', formHoSo('X'.repeat(500))), clientGia(() => HET_HAN), '/tuyen-dung', 'vi');
  ok('Mã vị trí dài bất thường (500 ký tự) → bỏ, không kéo dài URL', dai.ve === '/tuyen-dung#nop-ho-so', dai.ve);
  const thieu = await XLF.luotUngTuyen(yeuCau('/tuyen-dung', formHoSo('')), clientGia(() => HET_HAN), '/tuyen-dung', 'vi');
  ok('Chưa chọn vị trí → câu "Vui lòng chọn vị trí", không gọi database, không vi_tri trong URL',
     thieu.ketQua.loi === CAU_NOP.thieuViTri.vi && thieu.ve === '/tuyen-dung#nop-ho-so', inKq(thieu));
});

// ===========================================================================
await nhom('3 · ĐÃ NHẬN → ok: true kèm mã, chuyển hướng không kèm vi_tri', async () => {
  if (typeof XLF.luotUngTuyen !== 'function') return ok('Có luotUngTuyen', false);
  const l = await XLF.luotUngTuyen(yeuCau('/tuyen-dung', formHoSo()), clientGia(() => ({ data: 'BT-UV-2610-K7M2Q', error: null })), '/tuyen-dung', 'vi');
  ok('Ứng tuyển đã nhận: ok true, mã hồ sơ, không khongChac', l.ketQua.ok === true && l.ketQua.ma === 'BT-UV-2610-K7M2Q' && !l.ketQua.khongChac, inKq(l));
  ok('…chuyển hướng về /tuyen-dung#nop-ho-so', l.ve === '/tuyen-dung#nop-ho-so', l.ve);
  const hb = await XLF.luotDatBan(yeuCau('/dat-ban', formHoiBan()),
    clientGia(() => ({ data: [{ dat_ban_id: 'x', ma_dat_ban: 'K7M2QX', con_trong: 3 }], error: null })), '/dat-ban', 'vi');
  ok('Hỏi bàn đã nhận: ok true, mã, chuyển hướng về /dat-ban', hb.ketQua.ok === true && hb.ketQua.ma === 'K7M2QX' && hb.ve === '/dat-ban', inKq(hb));
  const chua = await XLF.luotUngTuyen(yeuCau('/tuyen-dung', formHoSo()), null, '/tuyen-dung', 'ko');
  ok('Chưa nối database → câu "chưa sẵn sàng" tiếng Hàn, không khongChac', chua.ketQua.ok === false && !chua.ketQua.khongChac
     && /준비되지 않았어요/.test(chua.ketQua.loi ?? ''), inKq(chua));
});

// ===========================================================================
await nhom('4 · THÂN QUÁ LỚN → KHÔNG GỌI DATABASE, DỪNG ĐỌC NGAY, "CHƯA ĐƯỢC GHI NHẬN"', async () => {
  if (typeof XLF.luotUngTuyen !== 'function') return ok('Có luotUngTuyen', false);
  ok('Ngưỡng ứng tuyển đủ cho CV 5 MB cộng các ô chữ, và không quá 8 MB',
     XLF.THAN_TOI_DA_UNG_TUYEN > 5 * 1024 * 1024 && XLF.THAN_TOI_DA_UNG_TUYEN <= 8 * 1024 * 1024, String(XLF.THAN_TOI_DA_UNG_TUYEN));
  ok('Ngưỡng hỏi bàn không quá 1 MB (form chỉ có chữ)', XLF.THAN_TOI_DA_DAT_BAN > 0 && XLF.THAN_TOI_DA_DAT_BAN <= 1024 * 1024,
     String(XLF.THAN_TOI_DA_DAT_BAN));
  const CA = [
    ['ứng tuyển', XLF.luotUngTuyen, DUONG, XLF.THAN_TOI_DA_UNG_TUYEN],
    ['hỏi bàn', XLF.luotDatBan, DUONG_HB, XLF.THAN_TOI_DA_DAT_BAN],
  ];
  for (const [ten, ham, duong, toiDa] of CA) {
    for (const nn of NGON_NGU) {
      // Không khai độ dài, gửi 100 MB dạng dòng chảy.
      const c = clientGia(() => ({ data: 'BT-UV-2610-AAAAA', error: null }));
      const { req, dem } = yeuCauDongChay(duong[nn], { tong: 100 * 1024 * 1024 });
      const l = await ham(req, c, duong[nn], nn);
      ok(`${ten} ${nn} — 100 MB không khai độ dài: không gọi database`, c.goi.length === 0, c.goi.join(','));
      ok(`${ten} ${nn} — …dừng đọc ngay khi vượt ngưỡng (đã kéo ${Math.round(dem.daDoc / 1024)} KB)`,
         dem.daDoc <= toiDa + 2 * 64 * 1024, `${dem.daDoc} byte, ngưỡng ${toiDa}`);
      ok(`${ten} ${nn} — …ok false, câu "CHƯA được ghi nhận", không "KHÔNG CHẮC", không khongChac`,
         l.ketQua.ok === false && !l.ketQua.khongChac && CHUA_GHI[nn].test(l.ketQua.loi ?? '') && !KHONG_CHAC[nn].test(l.ketQua.loi ?? ''), inKq(l));

      // Khai content-length vượt ngưỡng: không đọc byte nào.
      const c2 = clientGia(() => ({ data: 'BT-UV-2610-AAAAA', error: null }));
      const kd = yeuCauDongChay(duong[nn], { tong: 100 * 1024 * 1024, khaiDai: toiDa + 1 });
      const l2 = await ham(kd.req, c2, duong[nn], nn);
      ok(`${ten} ${nn} — khai content-length ${toiDa + 1}: từ chối trước khi đọc (0 byte), không gọi database`,
         c2.goi.length === 0 && kd.dem.daDoc === 0 && l2.ketQua.ok === false && CHUA_GHI[nn].test(l2.ketQua.loi ?? ''),
         `${kd.dem.daDoc} byte; ${inKq(l2)}`);
    }
  }
  const l = await XLF.luotUngTuyen(yeuCauDongChay('/tuyen-dung', { tong: 9 * 1024 * 1024 }).req, clientGia(() => ({})), '/tuyen-dung', 'vi');
  ok('Câu tiếng Việt khi hồ sơ quá lớn nói giới hạn 5MB của CV', /5MB|5 MB/.test(l.ketQua.loi ?? ''), l.ketQua.loi);
});

// ===========================================================================
await nhom('5 · THÂN ĐỨT GIỮA CHỪNG → KHÔNG GỌI DATABASE, "CHƯA ĐƯỢC GHI NHẬN … GỬI LẠI", KHÔNG TRANG 500', async () => {
  if (typeof XLF.luotUngTuyen !== 'function') return ok('Có luotUngTuyen', false);
  for (const [ten, ham, duong] of [['ứng tuyển', XLF.luotUngTuyen, DUONG], ['hỏi bàn', XLF.luotDatBan, DUONG_HB]]) {
    for (const nn of NGON_NGU) {
      const c = clientGia(() => ({ data: 'BT-UV-2610-AAAAA', error: null }));
      const { req } = yeuCauDongChay(duong[nn], { tong: 10 * 1024, loiSau: 4 * 1024 });
      let l, nem = null;
      try { l = await ham(req, c, duong[nn], nn); } catch (e) { nem = e; }
      ok(`${ten} ${nn} — dòng chảy đứt sau 4 KB: không ném (không trang 500), không gọi database`,
         !nem && c.goi.length === 0, nem ? `ném: ${nem.message}` : c.goi.join(','));
      ok(`${ten} ${nn} — …ok false, "CHƯA được ghi nhận", không khongChac`,
         !!l && l.ketQua.ok === false && !l.ketQua.khongChac && CHUA_GHI[nn].test(l.ketQua.loi ?? ''), l ? inKq(l) : '');
    }
  }
  // Multipart thiếu đoạn kết thúc (thân bị cắt nhưng dòng chảy không báo lỗi).
  const cut = '------bt\r\nContent-Disposition: form-data; name="ho_ten"\r\n\r\nTrần Thị Bình\r\n------bt\r\nContent-Disposition: form-data; na';
  const req = new Request('https://beeftown.vn/tuyen-dung', { method: 'POST', body: cut, headers: { 'content-type': 'multipart/form-data; boundary=----bt' } });
  const c = clientGia(() => ({ data: 'BT-UV-2610-AAAAA', error: null }));
  const l = await XLF.luotUngTuyen(req, c, '/tuyen-dung', 'vi');
  ok('Multipart bị cắt cụt → không gọi database, "CHƯA được ghi nhận"', c.goi.length === 0 && CHUA_GHI.vi.test(l.ketQua.loi ?? ''), inKq(l));
});

// ===========================================================================
await nhom('6 · COOKIE KẾT QUẢ MANG khongChac QUA LẦN CHUYỂN HƯỚNG', async () => {
  const cookieGia = (gt) => {
    let v = gt === null ? null : JSON.stringify(gt);
    return { get: () => (v === null ? undefined : { value: v }), delete: () => { v = null; }, set: (_, x) => { v = x; } };
  };
  for (const nn of NGON_NGU) {
    const kc = XLF.ketQuaUngTuyen({ cookies: cookieGia({ ok: false, loi: 'x', khongChac: true }) }, nn);
    ok(`ketQuaUngTuyen ${nn}: cookie khongChac → khongChac true`, kc?.ok === false && kc.khongChac === true, JSON.stringify(kc));
    const loi = XLF.ketQuaUngTuyen({ cookies: cookieGia({ ok: false, loi: 'Vị trí này đã hết hạn nhận hồ sơ' }) }, nn);
    ok(`ketQuaUngTuyen ${nn}: lỗi thường → khongChac false`, loi?.ok === false && loi.khongChac === false, JSON.stringify(loi));
    const da = XLF.ketQuaUngTuyen({ cookies: cookieGia({ ok: true, ma: 'BT-UV-2610-K7M2Q' }) }, nn);
    ok(`ketQuaUngTuyen ${nn}: đã nhận → câu "đã nhận" của CAU_NOP`, da?.ok === true && da.cau === CAU_NOP.daNhan[nn], JSON.stringify(da));
  }
  const hb = XLF.ketQuaDatBan({ cookies: cookieGia({ ok: false, loi: 'x', khongChac: true }) }, 'vi');
  ok('ketQuaDatBan vẫn mang khongChac như trước', hb?.khongChac === true && hb.cau === 'x', JSON.stringify(hb));
  ok('Câu "đã nhận" của hỏi bàn không đổi', CAU_DAT_BAN.daNhan.vi.length > 0);
});

// ===========================================================================
await nhom('7 · BỘ ĐỌC GIỚI HẠN DÙNG CHUNG (lib/than-gioi-han.ts)', async () => {
  const doc = THAN.docThanGioiHan;
  ok('than-gioi-han.ts xuất docThanGioiHan và docFormGioiHan',
     typeof doc === 'function' && typeof THAN.docFormGioiHan === 'function', Object.keys(THAN).join(', '));
  if (typeof doc !== 'function') return;
  const r = n => new Request('https://x/', { method: 'POST', body: new Uint8Array(n).fill(1) });
  ok('Đúng ngưỡng (1000 / 1000 byte) → nhận đủ', (await doc(r(1000), 1000))?.byteLength === 1000);
  ok('Quá một byte (1001 / 1000) → null', (await doc(r(1001), 1000)) === null);
  ok('Thân rỗng → 0 byte', (await doc(new Request('https://x/', { method: 'POST' }), 10))?.byteLength === 0);
  const { req, dem } = yeuCauDongChay('/', { tong: 50 * 1024 * 1024 });
  ok('Dòng chảy 50 MB, ngưỡng 256 KB → null, chỉ kéo về quanh ngưỡng', (await doc(req, 256 * 1024)) === null && dem.daDoc <= 256 * 1024 + 2 * 64 * 1024,
     `${dem.daDoc} byte`);
  let nem = null;
  try { await doc(yeuCauDongChay('/', { tong: 10 * 1024, loiSau: 1024 }).req, 1e6); } catch (e) { nem = e; }
  ok('Dòng chảy hỏng → ném (người gọi tự quyết câu trả lời)', !!nem);

  const f = new FormData(); f.set('ho_ten', 'Nguyễn Thị Ánh'); f.set('ghi_chu', 'Sinh nhật bé — 1.000 lời chúc');
  const kq = await THAN.docFormGioiHan(new Request('https://x/', { method: 'POST', body: f }), 64 * 1024);
  ok('docFormGioiHan đọc đúng chữ có dấu', kq.form?.get('ho_ten') === 'Nguyễn Thị Ánh' && kq.form?.get('ghi_chu') === 'Sinh nhật bé — 1.000 lời chúc',
     JSON.stringify(kq.loi ?? null));
  const u = new URLSearchParams({ ho_ten: 'Lê Văn Đức', so_khach: '4' });
  const kq2 = await THAN.docFormGioiHan(new Request('https://x/', { method: 'POST', body: u }), 64 * 1024);
  ok('docFormGioiHan đọc form urlencoded (form hỏi bàn không có enctype)', kq2.form?.get('ho_ten') === 'Lê Văn Đức' && kq2.form?.get('so_khach') === '4');
  const kq3 = await THAN.docFormGioiHan(new Request('https://x/', { method: 'POST', body: f }), 10);
  ok('docFormGioiHan quá ngưỡng → { loi: "qua_lon" }', kq3.loi === 'qua_lon' && !kq3.form, JSON.stringify(kq3));

  for (const tep of ['lib/kho/ipos-hook.ts', 'lib/messenger-hook.ts']) {
    const s = docNguon(tep);
    ok(`${tep} dùng docThanGioiHan của than-gioi-han.ts, không còn vòng getReader() riêng`,
       /from '\.{1,2}\/(?:\.\.\/)?than-gioi-han\.ts'/.test(s) && /docThanGioiHan\(/.test(s) && !/getReader\(/.test(s));
  }
  const xlf = docNguon('lib/xu-ly-form.ts');
  ok('xu-ly-form.ts không gọi request.formData() trần (mọi lần đọc thân đi qua docFormGioiHan)',
     !/\.formData\(\)/.test(xlf) && /docFormGioiHan\(/.test(xlf));
});

// ===========================================================================
await nhom('8 · TRANG TUYỂN DỤNG: SCRIPT BỔ TRỢ VÀ TRẠNG THÁI KHÔNG CHẮC', async () => {
  const trang = docNguon('components/TrangTuyenDung.astro');
  const form = docNguon('components/FormUngTuyen.astro');
  const script = trang.match(/<script>([^]*?)<\/script>/)?.[1] ?? '';
  ok('TrangTuyenDung.astro có <script> bổ trợ (luôn nạp, kể cả khi không dựng form — để xóa bản lưu tạm)', !!script);
  ok('Script chặn bấm đúp: lần submit thứ hai bị preventDefault, nút khóa, aria-busy="true"',
     /dataset\.dangGui/.test(script) && /preventDefault\(\)/.test(script) && /disabled\s*=\s*true/.test(script) && /aria-busy/.test(script));
  ok('Script giữ chữ đã gõ trong sessionStorage, xóa khi "đã nhận" hoặc "không chắc"',
     /sessionStorage/.test(script) && /'da-nhan'/.test(script) && /'khong-chac'/.test(script));
  const oGiu = [...(script.match(/const O_CHU = \[([^\]]*)\]/)?.[1] ?? '').matchAll(/'([a-z_]+)'/g)].map(m => m[1]);
  ok('Script giữ đúng các ô chữ (vị trí, họ tên, số điện thoại…) — KHÔNG giữ ô đồng ý (sự đồng ý phải là một cú bấm mới), không giữ file CV',
     ['vi_tri', 'ho_ten', 'sdt'].every(x => oGiu.includes(x)) && !oGiu.includes('dong_y') && !oGiu.includes('cv'), oGiu.join(', '));
  ok('Script mở lại nút khi quay lại trang bằng nút Back (pageshow persisted)', /pageshow/.test(script) && /persisted/.test(script));
  ok('Nút gửi mang chữ "Đang gửi…" đủ ba thứ tiếng (data-dang-gui-chu)', /data-dang-gui-chu=\{/.test(form)
     && /Đang gửi…/.test(form) && /Sending…/.test(form) && /보내는 중…/.test(form));
  ok('Khung kết quả mang data-ket-qua: da-nhan (FormUngTuyen), loi (FormUngTuyen), khong-chac (TrangTuyenDung)',
     /data-ket-qua="da-nhan"/.test(form) && /data-ket-qua="loi"/.test(form) && /data-ket-qua="khong-chac"/.test(trang));
  ok('TrangTuyenDung đọc cờ khongChac của kết quả', /ketQuaNop\?\.khongChac === true/.test(trang));
  ok('FormUngTuyen.astro không còn ghi "KHÔNG CÓ JAVASCRIPT" (script bổ trợ đã có — form vẫn gửi được khi tắt JavaScript)',
     !/KHÔNG CÓ JAVASCRIPT\./.test(form));
});

process.exit(ketThuc('FORM CÔNG KHAI: MẤT MẠNG, GỬI LẠI, THÂN QUÁ LỚN'));
