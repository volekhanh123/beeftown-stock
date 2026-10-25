/**
 * BEEFTOWN — /noi-bo (CRM): GHI XONG THÌ CHUYỂN HƯỚNG, LẦN GỬI THỨ HAI NÓI ĐÚNG SỰ THẬT
 * =================================================================================
 *
 *     node test/test-noi-bo-gui-lai.mjs
 *
 * Rà soát nợ kỹ thuật 11/10/2026: năm trang CRM — dat-ban, tuyen-dung, noi-dung, cai-dat,
 * tin-tuyen-dung/[id] — ghi rồi dựng thẳng trang trong cùng lượt POST, không chuyển hướng 303
 * như kho (lib/kho/trang.ts, chuyenHuong) và Zalo. Hai hệ quả:
 *
 *   · F5 sau khi lưu gửi lại lệnh cũ — lần hai ra lỗi giả: "Yêu cầu đã được người khác xử lý",
 *     "Tên này đã có rồi", "Tin vừa được người khác sửa … CHƯA được lưu" — dù lần đầu đã lưu.
 *   · Bấm đúp: trình duyệt bỏ câu trả lời của lần một, người bấm chỉ thấy câu của lần hai — cùng
 *     những lỗi giả đó. Chuyển hướng không chữa được ca này (lần hai vẫn tới máy chủ), nên mỗi
 *     chỗ ghi tự nhận ra "đã đúng như mình gửi" và nói đúng điều đó.
 *   · dat-ban, tuyen-dung, noi-dung gọi request.formData() trần: thân cụt (mạng đứt giữa chừng)
 *     → trang 500.
 *
 * Bất biến:
 *   1. lib/gui-noi-bo.ts: đọc thân không bao giờ ném (thân cụt → null); câu báo qua cookie dùng
 *      một lần; chuyenHuongNoiBo trả 303 về chính trang (giữ ?loc=…).
 *   2. chuyenTrangThai (hộp thư đặt bàn, hồ sơ ứng tuyển): khớp → đã chuyển; không khớp mà dòng
 *      đã ở trạng thái đích → "đã ở" (ok); trạng thái khác → "người khác xử lý"; không đọc lại
 *      được thì không đoán là đã xong.
 *   3. Tin tuyển dụng: lưu lần hai y hệt → "Đã lưu" (không "người khác sửa"); gỡ lần hai → tin đã
 *      gỡ (ok); duyệt lương lần hai → ok CHỈ KHI trang đang hiện đúng mức người duyệt đã thấy.
 *   4. Bàn ăn: thêm lần hai y hệt → "đã có" (ok); tên trùng với bàn khác thông số → "Tên này đã
 *      có rồi" như cũ.
 *   5. Năm trang: không gọi request.formData() trần; ghi được thì chuyenHuongNoiBo (303); đọc câu
 *      báo bằng docBaoNoiBo; câu "không đọc được dữ liệu gửi lên" chỉ ở MỘT chỗ.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const docNguon = f => readFileSync(join(SRC, f), 'utf8');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — /noi-bo (CRM): CHUYỂN HƯỚNG SAU KHI GHI, GỬI LẠI ĐÚNG SỰ THẬT');

let GNB = {};
try { GNB = await nap('gui-noi-bo.ts'); } catch (e) { console.log(`  (chưa nạp được lib/gui-noi-bo.ts: ${e.message})`); }
const TIN = await nap('tin-tuyen-dung.ts');
const CD = await nap('cai-dat.ts');

// ---------------------------------------------------------------------------
// Client PostgREST giả: mỗi truy vấn là { bang, loai, tri, cot, loc, don }; `tra(q)` quyết định
// câu trả lời { data, error }. goi = mọi truy vấn đã chạy, theo thứ tự.
// ---------------------------------------------------------------------------
function clientGia(tra) {
  const goi = [];
  const from = (bang) => {
    const q = { bang, loai: 'select', tri: null, cot: null, loc: [], don: false };
    const b = {
      update(v) { q.loai = 'update'; q.tri = v; return b; },
      insert(v) { q.loai = 'insert'; q.tri = v; return b; },
      delete() { q.loai = 'delete'; return b; },
      select(c) { q.cot = c; return b; },
      eq(k, v) { q.loc.push(['eq', k, v]); return b; },
      in(k, v) { q.loc.push(['in', k, v]); return b; },
      order() { return b; },
      limit() { return b; },
      maybeSingle() { q.don = true; return b; },
      single() { q.don = true; return b; },
      then(xong, hong) { goi.push(q); return Promise.resolve(tra(q)).then(xong, hong); },
    };
    return b;
  };
  return { goi, from, rpc: async () => ({ data: null, error: null }) };
}
const loc = (q, k) => q.loc.find(([, kk]) => kk === k)?.[2];
const inGoi = c => c.goi.map(q => `${q.loai} ${q.bang}`).join(' → ');

// ===========================================================================
await nhom('1 · lib/gui-noi-bo.ts — đọc thân không ném, câu báo qua cookie, chuyển hướng 303', async () => {
  ok('gui-noi-bo.ts xuất CAU_DOC_FORM_HONG, docFormNoiBo, ghiBaoNoiBo, docBaoNoiBo, chuyenHuongNoiBo, chuyenTrangThai',
     ['CAU_DOC_FORM_HONG', 'docFormNoiBo', 'ghiBaoNoiBo', 'docBaoNoiBo', 'chuyenHuongNoiBo', 'chuyenTrangThai'].every(k => k in GNB),
     Object.keys(GNB).join(', '));
  if (!GNB.docFormNoiBo) return;
  ok('CAU_DOC_FORM_HONG: vi "Không đọc được dữ liệu gửi lên — mạng có thể đã đứt giữa chừng", có bản tiếng Anh, không hứa "đã lưu"',
     /^Không đọc được dữ liệu gửi lên — mạng có thể đã đứt giữa chừng/.test(GNB.CAU_DOC_FORM_HONG?.vi ?? '')
       && /connection may have dropped/.test(GNB.CAU_DOC_FORM_HONG?.en ?? '') && !/đã lưu|saved/i.test(JSON.stringify(GNB.CAU_DOC_FORM_HONG)),
     JSON.stringify(GNB.CAU_DOC_FORM_HONG));

  const f = new FormData(); f.set('id', 'x'); f.set('ghi_chu', 'Đã gọi — khách hẹn 1.000 lần');
  const form = await GNB.docFormNoiBo(new Request('https://x/noi-bo/tuyen-dung', { method: 'POST', body: f }));
  ok('Thân đủ → FormData, chữ có dấu nguyên vẹn', form?.get('ghi_chu') === 'Đã gọi — khách hẹn 1.000 lần');
  const cut = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('------b\r\nContent-Disposition: form-data; name="id"\r\n\r\nx')); c.error(new TypeError('terminated')); } });
  let nem = null, kq;
  try { kq = await GNB.docFormNoiBo(new Request('https://x/', { method: 'POST', body: cut, duplex: 'half', headers: { 'content-type': 'multipart/form-data; boundary=----b' } })); }
  catch (e) { nem = e; }
  ok('Thân cụt (mạng đứt giữa chừng) → null, KHÔNG ném (trước đây: trang 500)', !nem && kq === null, nem?.message ?? String(kq));

  let v = null;
  const cookies = {
    set: (ten, gt, tuy) => { v = { ten, gt, tuy }; },
    get: (ten) => (v && v.ten === ten ? { value: v.gt } : undefined),
    delete: (ten) => { if (v?.ten === ten) v = null; },
  };
  GNB.ghiBaoNoiBo(cookies, { ok: true, cau: 'Đã chuyển sang "Đã xác nhận".' }, '/noi-bo/dat-ban');
  ok('Cookie câu báo: httpOnly, sameSite lax, chỉ sống ở ĐÚNG trang sẽ đọc nó (/noi-bo/dat-ban), ngắn hạn',
     v?.tuy?.httpOnly === true && v?.tuy?.sameSite === 'lax'
     && v?.tuy?.path === '/noi-bo/dat-ban' && v?.tuy?.maxAge > 0 && v?.tuy?.maxAge <= 300, JSON.stringify(v?.tuy));
  const doc1 = GNB.docBaoNoiBo(cookies, '/noi-bo/dat-ban');
  const doc2 = GNB.docBaoNoiBo(cookies, '/noi-bo/dat-ban');
  ok('Đọc câu báo một lần rồi xóa (F5 trang GET không hiện lại)', doc1?.ok === true && doc1.cau === 'Đã chuyển sang "Đã xác nhận".' && doc2 === null,
     JSON.stringify([doc1, doc2]));
  v = { ten: 'bt_nb_bao', gt: '{"ok":"co"}' };
  ok('Cookie hỏng / sai hình dạng → null', GNB.docBaoNoiBo(cookies, '/noi-bo/dat-ban') === null);

  let chuyen = null;
  const r = GNB.chuyenHuongNoiBo({ cookies, url: new URL('https://beeftown.vn/noi-bo/dat-ban?loc=hom_nay'),
    redirect: (duong, ma) => { chuyen = { duong, ma }; return new Response(null, { status: ma, headers: { location: duong } }); } },
    { ok: true, cau: 'x' });
  const duongCookie = v?.tuy?.path;
  ok('chuyenHuongNoiBo: 303 về chính trang, giữ bộ lọc ?loc=hom_nay, ghi câu báo cho đúng đường dẫn trang (không kèm ?loc)',
     r.status === 303 && chuyen?.duong === '/noi-bo/dat-ban?loc=hom_nay' && duongCookie === '/noi-bo/dat-ban'
     && GNB.docBaoNoiBo(cookies, '/noi-bo/dat-ban')?.cau === 'x', `${JSON.stringify(chuyen)} · ${duongCookie}`);
});

// ===========================================================================
await nhom('2 · chuyenTrangThai — "đã ở trạng thái đó" khác "người khác xử lý"', async () => {
  if (!GNB.chuyenTrangThai) return ok('Có chuyenTrangThai', false);
  for (const bang of ['dat_ban', 'ho_so_ung_tuyen']) {
    const c1 = clientGia(q => (q.loai === 'update' ? { data: [{ id: 'd1' }], error: null } : { data: null, error: null }));
    const k1 = await GNB.chuyenTrangThai(c1, bang, 'd1', 'cho_xac_nhan', 'da_xac_nhan', { nguoi_xu_ly: 'ns1' });
    const u = c1.goi[0];
    ok(`${bang}: khớp một dòng → "da_chuyen"; UPDATE lọc đúng id VÀ trạng thái cũ, ghi trạng thái mới kèm cột thêm`,
       k1 === 'da_chuyen' && u?.loai === 'update' && u.bang === bang && loc(u, 'id') === 'd1' && loc(u, 'trang_thai') === 'cho_xac_nhan'
         && u.tri?.trang_thai === 'da_xac_nhan' && u.tri?.nguoi_xu_ly === 'ns1', `${JSON.stringify(k1)} · ${inGoi(c1)}`);

    const c2 = clientGia(q => (q.loai === 'update' ? { data: [], error: null } : { data: { trang_thai: 'da_xac_nhan' }, error: null }));
    const k2 = await GNB.chuyenTrangThai(c2, bang, 'd1', 'cho_xac_nhan', 'da_xac_nhan', {});
    ok(`${bang}: không khớp, đọc lại thấy ĐÃ ở trạng thái đích (lần hai của cú bấm đúp) → "da_o_san"`,
       k2 === 'da_o_san' && c2.goi[1]?.loai === 'select' && loc(c2.goi[1], 'id') === 'd1', `${JSON.stringify(k2)} · ${inGoi(c2)}`);

    const c3 = clientGia(q => (q.loai === 'update' ? { data: [], error: null } : { data: { trang_thai: 'da_huy' }, error: null }));
    ok(`${bang}: không khớp, dòng đang ở trạng thái KHÁC → "nguoi_khac"`,
       (await GNB.chuyenTrangThai(c3, bang, 'd1', 'cho_xac_nhan', 'da_xac_nhan', {})) === 'nguoi_khac');

    const c4 = clientGia(q => (q.loai === 'update' ? { data: [], error: null } : { data: null, error: { message: 'fetch failed' } }));
    ok(`${bang}: không khớp và không đọc lại được → "nguoi_khac" (không đoán là đã xong)`,
       (await GNB.chuyenTrangThai(c4, bang, 'd1', 'cho_xac_nhan', 'da_xac_nhan', {})) === 'nguoi_khac');

    const c5 = clientGia(() => ({ data: null, error: { message: 'new row violates row-level security policy for table "dat_ban"' } }));
    // (c5 kiểm ở cuối vòng — trước đó: ghi chú của người bấm.)
    const k5 = await GNB.chuyenTrangThai(c5, bang, 'd1', 'cho_xac_nhan', 'da_xac_nhan', {});
    ok(`${bang}: database báo lỗi → { loi } nguyên câu, không đọc lại`, typeof k5 === 'object' && /row-level security/.test(k5.loi) && c5.goi.length === 1,
       JSON.stringify(k5));
  }

  // Hồ sơ ứng tuyển có ghi chú: "đã ở" CHỈ khi nhật ký bước đó mang đúng ghi chú này (lần hai của cú
  // bấm đúp). Người khác chuyển trước với ghi chú khác → ghi chú của người bấm CHƯA được lưu.
  const traNk = (ghiChu, loi = null) => q => (q.loai === 'update' ? { data: [], error: null }
    : q.bang === 'nhat_ky_ho_so' ? { data: loi ? null : [{ ghi_chu: ghiChu }], error: loi }
    : { data: { trang_thai: 'tu_choi' }, error: null });
  const them = { nguoi_phu_trach: 'ns1', ghi_chu_buoc: 'Thiếu kinh nghiệm bếp nóng' };
  const cNk1 = clientGia(traNk('Thiếu kinh nghiệm bếp nóng'));
  const kNk1 = await GNB.chuyenTrangThai(cNk1, 'ho_so_ung_tuyen', 'h1', 'dang_xem', 'tu_choi', them);
  const qNk = cNk1.goi.find(q => q.bang === 'nhat_ky_ho_so');
  ok('Hồ sơ có ghi chú, đã ở trạng thái đích và nhật ký bước đó có ĐÚNG ghi chú này → "da_o_san"',
     kNk1 === 'da_o_san' && loc(qNk, 'ho_so_id') === 'h1' && loc(qNk, 'den_trang_thai') === 'tu_choi', `${JSON.stringify(kNk1)} · ${inGoi(cNk1)}`);
  ok('…ghi chú khác (người khác chuyển trước) → "nguoi_khac": không báo xanh khi ghi chú chưa được lưu',
     (await GNB.chuyenTrangThai(clientGia(traNk('Đã nhận việc nơi khác')), 'ho_so_ung_tuyen', 'h1', 'dang_xem', 'tu_choi', them)) === 'nguoi_khac');
  ok('…nhật ký không có ghi chú → "nguoi_khac"',
     (await GNB.chuyenTrangThai(clientGia(traNk(null)), 'ho_so_ung_tuyen', 'h1', 'dang_xem', 'tu_choi', them)) === 'nguoi_khac');
  ok('…không đọc được nhật ký → "nguoi_khac" (không đoán)',
     (await GNB.chuyenTrangThai(clientGia(traNk(null, { message: 'fetch failed' })), 'ho_so_ung_tuyen', 'h1', 'dang_xem', 'tu_choi', them)) === 'nguoi_khac');
  const cKhongGhi = clientGia(traNk('bất kỳ'));
  ok('Không ghi chú → "da_o_san", không đọc nhật ký',
     (await GNB.chuyenTrangThai(cKhongGhi, 'ho_so_ung_tuyen', 'h1', 'dang_xem', 'tu_choi', { nguoi_phu_trach: 'ns1', ghi_chu_buoc: null })) === 'da_o_san'
       && !cKhongGhi.goi.some(q => q.bang === 'nhat_ky_ho_so'));
});

// ===========================================================================
await nhom('3 · Tin tuyển dụng — lưu / gỡ / duyệt lương lần hai', async () => {
  const formLuu = (viec = 'luu') => {
    const f = new FormData();
    for (const [k, v] of Object.entries({
      viec, phien_ban: '2026-10-12T03:00:00.000000+00:00', ten_vi: 'Nhân viên sảnh', bo_phan: 'sanh',
      loai_hop_dong: 'ban_thoi_gian', so_luong: '3', han_nop: '', cap_bac: '', ca_lam: 'Ca tối 16:00–22:00',
      mo_ta_vi: 'Đón khách, hướng dẫn chọn bò.', yeu_cau_vi: 'Chăm chỉ.', quyen_loi_vi: '',
      luong_de_xuat_tu: '25000', luong_de_xuat_den: '', luong_de_xuat_don_vi: 'gio',
    })) f.set(k, v);
    for (const cot of ['hoi_email', 'hoi_ca_lam']) f.set(cot, 'co');
    return f;
  };
  // Dòng như database đang giữ SAU lần lưu thứ nhất: đúng những gì form gửi, updated_at mới.
  const dongSauLan1 = {
    updated_at: '2026-10-12T03:00:05.123456+00:00', ten_vi: 'Nhân viên sảnh', bo_phan: 'sanh', cap_bac: null,
    loai_hop_dong: 'ban_thoi_gian', so_luong: 3, han_nop: null, mo_ta_vi: 'Đón khách, hướng dẫn chọn bò.', yeu_cau_vi: 'Chăm chỉ.',
    quyen_loi_vi: null, ca_lam: 'Ca tối 16:00–22:00', luong_de_xuat_tu: 25000, luong_de_xuat_den: null, luong_de_xuat_don_vi: 'gio',
    hoi_email: true, hoi_nam_sinh: false, hoi_ca_lam: true, hoi_gioi_thieu: false, hoi_kinh_nghiem: false, hoi_cv: false,
    trang_thai: 'nhap',
  };
  const traLuu = dong => q => (q.loai === 'update' ? { data: [], error: null } : { data: dong, error: null });

  for (const nn of ['vi', 'en']) {
    const c = clientGia(traLuu(dongSauLan1));
    const kq = await TIN.luuTin(c, 't1', formLuu(), nn);
    ok(`luuTin ${nn}: phiên bản đã đổi nhưng database đang giữ ĐÚNG bản vừa gửi (lần hai của cú bấm đúp / F5) → ok "Đã lưu"`,
       kq.ok === true && (nn === 'vi' ? kq.cau === 'Đã lưu.' : kq.cau === 'Saved.'), JSON.stringify(kq));
  }
  const cDang = clientGia(traLuu({ ...dongSauLan1, trang_thai: 'da_cong_bo' }));
  const kqDang = await TIN.luuTin(cDang, 't1', formLuu('luu_dang'), 'vi');
  ok('luuTin "Lưu và đăng" lần hai, tin đã đăng đúng bản đó → ok "Đã lưu và đăng"', kqDang.ok === true && /đăng lên trang/.test(kqDang.cau), JSON.stringify(kqDang));
  const cKhac = clientGia(traLuu({ ...dongSauLan1, mo_ta_vi: 'Mô tả người khác vừa sửa.' }));
  const kqKhac = await TIN.luuTin(cKhac, 't1', formLuu(), 'vi');
  ok('luuTin: database giữ bản KHÁC (người khác vừa sửa mô tả) → vẫn "Tin vừa được người khác sửa … CHƯA được lưu", giữ chữ đã gõ',
     kqKhac.ok === false && /người khác sửa/.test(kqKhac.cau) && kqKhac.daGo?.mo_ta_vi === 'Đón khách, hướng dẫn chọn bò.', JSON.stringify(kqKhac));
  const cChuaDang = clientGia(traLuu(dongSauLan1));
  const kqChuaDang = await TIN.luuTin(cChuaDang, 't1', formLuu('luu_dang'), 'vi');
  ok('luuTin "Lưu và đăng" nhưng tin trong database CHƯA đăng → không nói "đã đăng"', kqChuaDang.ok === false, JSON.stringify(kqChuaDang));

  const cGo = clientGia(q => (q.loai === 'update' ? { data: [], error: null } : { data: { trang_thai: 'da_thu_hoi' }, error: null }));
  const kqGo = await TIN.goTin(cGo, 't1', 'vi');
  ok('goTin lần hai: tin đã gỡ → ok (không "Tin không còn đang đăng — có thể người khác vừa gỡ")', kqGo.ok === true, JSON.stringify(kqGo));
  const cNhap = clientGia(q => (q.loai === 'update' ? { data: [], error: null } : { data: { trang_thai: 'nhap' }, error: null }));
  ok('goTin: tin đang là nháp (chưa từng đăng) → vẫn báo không còn đang đăng', (await TIN.goTin(cNhap, 't1', 'vi')).ok === false);

  const daThay = { tu: '25000', den: '', donVi: 'gio' };
  const tinDaDuyet = { updated_at: '2026-10-12T03:10:00+00:00', luong_de_xuat_tu: 25000, luong_de_xuat_den: null, luong_de_xuat_don_vi: 'gio',
                       luong_da_duyet: true, luong_tu: 25000, luong_den: null, luong_don_vi: 'gio' };
  const cDuyet = clientGia(q => (q.loai === 'select' ? { data: tinDaDuyet, error: null } : { data: [], error: null }));
  const kqDuyet = await TIN.duyetLuong(cDuyet, 't1', '2026-10-12T03:00:00+00:00', true, 'vi', daThay);
  ok('duyetLuong lần hai: trang đang hiện ĐÚNG mức người duyệt đã thấy → ok "Đã duyệt", không ghi thêm',
     kqDuyet.ok === true && /Đã duyệt/.test(kqDuyet.cau) && !cDuyet.goi.some(q => q.loai === 'update'), JSON.stringify(kqDuyet));
  const cDoi = clientGia(q => (q.loai === 'select' ? { data: { ...tinDaDuyet, luong_de_xuat_tu: 30000, luong_tu: 30000 }, error: null } : { data: [], error: null }));
  const kqDoi = await TIN.duyetLuong(cDoi, 't1', '2026-10-12T03:00:00+00:00', true, 'vi', daThay);
  ok('duyetLuong: mức trên trang KHÁC mức người duyệt đã thấy → vẫn "Tin vừa được sửa sau lúc bạn mở trang"', kqDoi.ok === false && /sửa sau lúc bạn mở/.test(kqDoi.cau), JSON.stringify(kqDoi));
  const cBo = clientGia(q => (q.loai === 'select' ? { data: { ...tinDaDuyet, luong_da_duyet: false, luong_tu: null }, error: null } : { data: [], error: null }));
  const kqBo = await TIN.duyetLuong(cBo, 't1', '2026-10-12T03:00:00+00:00', false, 'vi', daThay);
  ok('duyetLuong bỏ duyệt lần hai: trang đã không hiện lương → ok "Đã bỏ duyệt"', kqBo.ok === true && /bỏ duyệt/.test(kqBo.cau), JSON.stringify(kqBo));
});

// ===========================================================================
await nhom('4 · Bàn ăn — thêm lần hai y hệt là "đã có", không phải "Tên này đã có rồi"', async () => {
  const trung = { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "ban_an_chi_nhanh_id_ten_key"' } };
  const fMot = () => { const f = new FormData(); f.set('ten', 'Phòng 1'); f.set('so_cho', '8'); f.set('la_phong_rieng', 'co'); return f; };
  const c1 = clientGia(q => (q.loai === 'insert' ? trung : { data: [{ ten: 'Phòng 1', so_cho: 8, la_phong_rieng: true, dang_dung: true }], error: null }));
  const k1 = await CD.themMotBan(c1, fMot(), 'cn1', 'vi');
  ok('themMotBan lần hai: bàn cùng tên, cùng số chỗ, cùng loại đã có → ok, câu nói bàn đã có', k1.ok === true && /Phòng 1/.test(k1.cau), JSON.stringify(k1));
  const c2 = clientGia(q => (q.loai === 'insert' ? trung : { data: [{ ten: 'Phòng 1', so_cho: 4, la_phong_rieng: true, dang_dung: true }], error: null }));
  const k2 = await CD.themMotBan(c2, fMot(), 'cn1', 'vi');
  ok('themMotBan: tên trùng với bàn KHÁC số chỗ → vẫn "Tên này đã có rồi."', k2.ok === false && k2.cau === 'Tên này đã có rồi.', JSON.stringify(k2));

  const fNhieu = () => { const f = new FormData(); f.set('tien_to', 'B'); f.set('tu', '1'); f.set('den', '3'); f.set('so_cho', '4'); return f; };
  const daCo = ['B01', 'B02', 'B03'].map(ten => ({ ten, so_cho: 4, la_phong_rieng: false, dang_dung: true }));
  const c3 = clientGia(q => (q.loai === 'insert' ? trung : { data: daCo, error: null }));
  const k3 = await CD.themNhieuBan(c3, fNhieu(), 'cn1', 'en');
  ok('themNhieuBan lần hai: cả loạt B01–B03 đã có y hệt → ok (tiếng Anh)', k3.ok === true && /B01/.test(k3.cau) && /B03/.test(k3.cau), JSON.stringify(k3));
  const c4 = clientGia(q => (q.loai === 'insert' ? trung : { data: daCo.slice(0, 2), error: null }));
  const k4 = await CD.themNhieuBan(c4, fNhieu(), 'cn1', 'vi');
  ok('themNhieuBan: chỉ một phần loạt đã có → vẫn "Tên này đã có rồi." (không bàn nào được thêm)', k4.ok === false && k4.cau === 'Tên này đã có rồi.', JSON.stringify(k4));
});

// ===========================================================================
await nhom('5 · Năm trang CRM: không formData() trần, ghi được thì chuyển hướng 303, câu "không đọc được" một chỗ', async () => {
  const TRANG = ['pages/noi-bo/dat-ban.astro', 'pages/noi-bo/tuyen-dung.astro', 'pages/noi-bo/noi-dung.astro',
                 'pages/noi-bo/cai-dat.astro', 'pages/noi-bo/tin-tuyen-dung/[id].astro',
                 // Màn soạn món (lib/thuc-don-noi-bo.ts) — cùng luật từ ngày dựng.
                 'pages/noi-bo/thuc-don/[id].astro'];
  for (const tep of TRANG) {
    const s = docNguon(tep);
    ok(`${tep}: không gọi Astro.request.formData() trần (thân cụt → trang 500)`, !/request\.formData\(\)/.test(s));
    ok(`${tep}: đọc thân bằng docFormNoiBo, báo bằng CAU_DOC_FORM_HONG khi hỏng`, /docFormNoiBo\(/.test(s) && /CAU_DOC_FORM_HONG/.test(s));
    ok(`${tep}: ghi được thì return chuyenHuongNoiBo(…) (303), đọc câu báo của đúng trang bằng docBaoNoiBo`,
       /return chuyenHuongNoiBo\(/.test(s) && /docBaoNoiBo\(Astro\.cookies, Astro\.url\.pathname\)/.test(s));
    ok(`${tep}: không còn câu "Không đọc được dữ liệu gửi lên" riêng`, !/Không đọc được dữ liệu gửi lên/.test(s));
  }
  for (const tep of ['pages/noi-bo/dat-ban.astro', 'pages/noi-bo/tuyen-dung.astro']) {
    const s = docNguon(tep);
    ok(`${tep}: dùng chuyenTrangThai và có câu riêng cho "đã ở trạng thái đó" (vi, en)`,
       /chuyenTrangThai\(/.test(s) && /'da_o_san'/.test(s) && /daO:\s*\{\s*vi:/.test(s));
  }
  const tin = docNguon('pages/noi-bo/tin-tuyen-dung/[id].astro');
  ok('tin-tuyen-dung/[id].astro: form duyệt lương gửi kèm mức đề xuất đang thấy (de_xuat_tu, de_xuat_den, de_xuat_don_vi)',
     ['de_xuat_tu', 'de_xuat_den', 'de_xuat_don_vi'].every(k => tin.includes(`name="${k}"`)));
  ok('tin-tuyen-dung/[id].astro: câu "đang được dịch" tính lúc lưu (trước chuyển hướng), không dựa vào request.method',
     !/Astro\.request\.method === 'POST'\)\s*\{\s*\n\s*bao = \{ \.\.\.bao, cau: t\.dangDich/.test(tin));
});

process.exit(ketThuc('/noi-bo (CRM): CHUYỂN HƯỚNG SAU KHI GHI'));
