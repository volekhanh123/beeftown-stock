/**
 * BEEFTOWN — /noi-bo/thuc-don: SOẠN, CÔNG BỐ, GỠ MÓN
 * ===================================================
 *
 *     node test/test-noi-bo-thuc-don.mjs
 *
 * Màn Thực đơn (web/src/lib/thuc-don-noi-bo.ts, pages/noi-bo/thuc-don/) thay cho các khối SQL của
 * web/THUC-DON.md ở việc hằng ngày: sửa tên, mô tả, bản dịch, công bố, gỡ. Bất biến:
 *
 *   1. Câu UPDATE chỉ có cột trong COT_SUA và COT_DICH — không bao giờ giá, mức cay, cờ món sống /
 *      có cồn, nhóm, mã, kể cả khi form bị sửa tay gửi thêm các ô đó. "Lưu và công bố" đổi trạng
 *      thái trong CÙNG câu UPDATE. Ô dịch chỉ ghi khi người dùng sửa nó; không có ô cảnh báo thì
 *      không xóa cảnh báo.
 *   2. Gửi hai lần nói đúng sự thật: database đã giữ đúng bản vừa gửi → "Đã lưu"; người khác vừa
 *      sửa → báo rõ là CHƯA lưu và giữ chữ đã gõ; RLS lọc mất dòng → "không sửa được".
 *   3. Lỗi database, mất mạng: không bao giờ báo thành công; câu đúng hoàn cảnh (món đang công bố
 *      mà lưu bản thiếu khác với món nháp chưa công bố được).
 *   4. Trên database thật (PGlite, đủ migration), CHÍNH câu UPDATE thư viện dựng ra: ba vai biên
 *      tập ghi được, thu ngân / vai kho / người đã nghỉ / anon không; CHECK mon_an_cong_bo_phai_sach
 *      chặn món chưa sạch và câu lỗi thật khớp biểu thức thư viện bắt; công bố → hiện trên
 *      thuc_don_cong_khai(), gỡ → biến mất.
 *   5. Hợp đồng với database: VAI_SUA_MON = vai của policy mon_an_sua; menu = vai của mon_an_doc;
 *      mọi khóa của MonAn, COT_SUA, COT_DICH là cột thật; O_DICH_MON khớp cot_ban_dich().
 *   6. Trang: đọc form bằng docFormNoiBo, ghi xong chuyển hướng 303, không có ô giá / cờ pháp lý.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const docNguon = f => readFileSync(join(SRC, f), 'utf8');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — /noi-bo/thuc-don: SOẠN, CÔNG BỐ, GỠ MÓN');

const TD = await nap('thuc-don-noi-bo.ts');
const { CAU_MAT_MANG_GHI } = await nap('qua-tai.ts');
const NB = await nap('dieu-huong-noi-bo.ts');

// ---------------------------------------------------------------------------
// Client PostgREST giả (như test-noi-bo-gui-lai.mjs): mỗi truy vấn là { bang, loai, tri, cot, loc, don };
// `tra(q)` quyết định câu trả lời { data, error }. goi = mọi truy vấn đã chạy, theo thứ tự.
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
const ID = '11111111-1111-4111-8111-111111111111';
const PHIEN = '2026-10-25T07:00:00.000000+00:00';

/** Form soạn đầy đủ như trang gửi lên, cộng những ô `them` (giả form bị sửa tay). */
function formSoan(viec, them = {}) {
  const f = new FormData();
  const o = {
    viec, phien_ban: PHIEN,
    ten_vi: 'Salad Caesar', mo_ta_vi: 'Xà lách romaine, sốt Caesar và phô mai Parmesan.',
    khau_phan: '', thu_tu: '3',
    ten_en: 'Caesar salad', goc_ten_en: 'Caesar salad',
    mo_ta_en: 'Romaine, caesar dressing, parmesan.', goc_mo_ta_en: 'Romaine, caesar dressing, parmesan.',
    ten_ko: '', goc_ten_ko: '', mo_ta_ko: '', goc_mo_ta_ko: '',
    khau_phan_en: '', goc_khau_phan_en: '', khau_phan_ko: '', goc_khau_phan_ko: '',
    ...them,
  };
  for (const [k, v] of Object.entries(o)) if (v !== undefined) f.set(k, v);
  return f;
}
const DUOC_GHI = new Set([...TD.COT_SUA, ...TD.COT_DICH, 'trang_thai']);

// ===========================================================================
await nhom('1 · Câu UPDATE chỉ có cột được phép; công bố trong cùng câu', async () => {
  const lenh = formSoan('luu', {
    gia: '250000', gia_de_xuat: '250000', gia_da_duyet: 'true', muc_cay: '3',
    la_mon_song: 'false', co_con: 'true', nhom_mon_id: ID, ma: 'X99', trang_thai: 'da_cong_bo',
  });
  const { dong, loi } = TD.docForm(lenh, 'vi');
  ok('Form hợp lệ thì không có lỗi', loi === null, loi);
  const la = Object.keys(dong).filter(k => !DUOC_GHI.has(k));
  ok('Form gửi thêm giá, mức cay, cờ món sống / có cồn, nhóm, mã, trạng thái → không ô nào vào câu UPDATE',
     la.length === 0, la.join(', '));
  ok('Nút Lưu không tự đổi trạng thái dù form gửi trang_thai', !('trang_thai' in dong));

  const c = clientGia(q => (q.loai === 'update' ? { data: [{ id: ID }], error: null } : { data: null, error: null }));
  const kq = await TD.luuMon(c, ID, formSoan('luu_cong_bo'), 'vi');
  const up = c.goi.find(q => q.loai === 'update');
  ok('Lưu và công bố: báo "Đã lưu và công bố…"', kq.ok && /Đã lưu và công bố/.test(kq.cau), kq.cau);
  ok('Lưu và công bố: đúng MỘT câu UPDATE, có trang_thai = da_cong_bo cùng nội dung',
     c.goi.filter(q => q.loai === 'update').length === 1 && up.tri.trang_thai === 'da_cong_bo' && up.tri.mo_ta_vi);
  ok('UPDATE lọc theo id VÀ phiên bản lúc mở màn hình (updated_at)', loc(up, 'id') === ID && loc(up, 'updated_at') === PHIEN);
  ok('UPDATE vào bảng mon_an', up.bang === 'mon_an');

  const { dong: d2 } = TD.docForm(formSoan('luu', { mo_ta_ko: '로메인 상추', ten_en: '' }), 'vi');
  ok('Ô dịch y như lúc mở → không gửi (không đè bản máy vừa dịch)', !('mo_ta_en' in d2) && !('ten_ko' in d2));
  ok('Ô dịch sửa tay → gửi', d2.mo_ta_ko === '로메인 상추');
  ok('Ô dịch xóa trắng → gửi null (nhờ máy dịch lại)', 'ten_en' in d2 && d2.ten_en === null);
  ok('Form không có ô cảnh báo (món không sống) → không đụng cột canh_bao', !('canh_bao' in d2));
  const { dong: d3 } = TD.docForm(formSoan('luu', { canh_bao: '  Thịt bò sống, không dùng cho trẻ nhỏ.  ' }), 'vi');
  ok('Có ô cảnh báo → gửi đã cắt khoảng trắng', d3.canh_bao === 'Thịt bò sống, không dùng cho trẻ nhỏ.');
  ok('Thứ tự đọc thành số', d3.thu_tu === 3);
});

// ===========================================================================
await nhom('1b · Lỗi của người gõ: không gọi database', async () => {
  for (const [ten, them, mau] of [
    ['tên trống', { ten_vi: '   ' }, /Chưa điền tên món/],
    ['thứ tự chữ', { thu_tu: 'ba' }, /Thứ tự phải là số/],
    ['thứ tự 1000', { thu_tu: '1000' }, /Thứ tự phải là số/],
    ['thứ tự âm', { thu_tu: '-1' }, /Thứ tự phải là số/],
  ]) {
    const c = clientGia(() => ({ data: [{ id: ID }], error: null }));
    const kq = await TD.luuMon(c, ID, formSoan('luu', them), 'vi');
    ok(`${ten} → báo lỗi, giữ chữ đã gõ, không gọi database`, !kq.ok && mau.test(kq.cau) && kq.daGo && c.goi.length === 0, kq.cau);
  }
  for (const [ten, them] of [['mô tả trống', { mo_ta_vi: '' }], ['mô tả còn [ngoặc vuông]', { mo_ta_vi: '[Mô tả sau khi duyệt công thức]' }]]) {
    const c = clientGia(() => ({ data: [{ id: ID }], error: null }));
    const kq = await TD.luuMon(c, ID, formSoan('luu_cong_bo', them), 'vi');
    ok(`Công bố khi ${ten} → "Chưa công bố được", không gọi database`, !kq.ok && /Chưa công bố được/.test(kq.cau) && c.goi.length === 0, kq.cau);
  }
  const c = clientGia(() => ({ data: [{ id: ID }], error: null }));
  const kq = await TD.luuMon(c, ID, formSoan('xoa'), 'vi');
  ok('Việc lạ (viec=xoa) → từ chối, không gọi database', !kq.ok && c.goi.length === 0, kq.cau);
  const en = await TD.luuMon(clientGia(() => ({ data: [], error: null })), ID, formSoan('luu', { ten_vi: '' }), 'en');
  ok('Câu lỗi có bản tiếng Anh', en.cau === 'The dish has no name.', en.cau);
  ok('laChuTam giống la_van_ban_tam(): null, rỗng, [ngoặc vuông] là tạm; câu thật thì không',
     TD.laChuTam(null) && TD.laChuTam('  ') && TD.laChuTam('Sốt [chờ]') && !TD.laChuTam('Sốt mè rang.'));
});

// ===========================================================================
await nhom('2 · Gửi hai lần, người khác sửa, RLS lọc mất dòng', async () => {
  const form = formSoan('luu');
  const { dong } = TD.docForm(form, 'vi');
  // Lần hai của cú bấm đúp: lần một đã ghi và đổi updated_at; database giữ đúng bản này.
  let c = clientGia(q => q.loai === 'update' ? { data: [], error: null }
    : { data: { ...dong, updated_at: '2026-10-25T07:00:05+00:00' }, error: null });
  let kq = await TD.luuMon(c, ID, form, 'vi');
  ok('Lưu lần hai y hệt → "Đã lưu", không "người khác sửa"', kq.ok && kq.cau === 'Đã lưu.', kq.cau);
  const docLai = c.goi.find(q => q.loai === 'select');
  ok('Đọc lại đúng các cột vừa gửi kèm updated_at', docLai && docLai.cot.split(', ').includes('updated_at')
     && Object.keys(dong).every(k => docLai.cot.split(', ').includes(k)), docLai?.cot);

  c = clientGia(q => q.loai === 'update' ? { data: [], error: null }
    : { data: { ...dong, mo_ta_vi: 'Bản của người khác.', updated_at: '2026-10-25T07:01:00+00:00' }, error: null });
  kq = await TD.luuMon(c, ID, form, 'vi');
  ok('Người khác vừa sửa → báo CHƯA được lưu, giữ chữ đã gõ', !kq.ok && /CHƯA được lưu/.test(kq.cau) && kq.daGo?.mo_ta_vi === dong.mo_ta_vi, kq.cau);

  c = clientGia(q => q.loai === 'update' ? { data: [], error: null }
    : { data: { ...dong, mo_ta_vi: 'Khác.', updated_at: PHIEN }, error: null });
  kq = await TD.luuMon(c, ID, form, 'vi');
  ok('RLS lọc mất dòng (phiên bản không đổi) → "không sửa được món này"', !kq.ok && /không sửa được món này/.test(kq.cau), kq.cau);

  c = clientGia(q => q.loai === 'update' ? { data: [], error: null } : { data: null, error: null });
  kq = await TD.luuMon(c, ID, form, 'vi');
  ok('Không đọc lại được dòng nào (vai không đọc được) → không báo đã lưu', !kq.ok, kq.cau);

  c = clientGia(q => q.loai === 'update' ? { data: [], error: null } : { data: { trang_thai: 'da_thu_hoi' }, error: null });
  kq = await TD.goMon(c, ID, 'vi');
  const goUp = c.goi.find(q => q.loai === 'update');
  ok('Gỡ: chỉ đổi trạng thái, chỉ gỡ món đang công bố', JSON.stringify(goUp.tri) === '{"trang_thai":"da_thu_hoi"}'
     && loc(goUp, 'trang_thai') === 'da_cong_bo');
  ok('Gỡ lần hai (món đã gỡ) → báo món đã gỡ, ok', kq.ok && /đã được gỡ/.test(kq.cau), kq.cau);
  c = clientGia(q => q.loai === 'update' ? { data: [], error: null } : { data: { trang_thai: 'nhap' }, error: null });
  kq = await TD.goMon(c, ID, 'vi');
  ok('Gỡ món không còn công bố (không phải đã gỡ) → không báo thành công', !kq.ok && /không còn đang công bố/.test(kq.cau), kq.cau);
});

// ===========================================================================
await nhom('3 · Lỗi database, mất mạng: không bao giờ báo thành công', async () => {
  const loiCheck = { message: 'new row for relation "mon_an" violates check constraint "mon_an_cong_bo_phai_sach"' };
  let c = clientGia(q => q.loai === 'update' ? { data: null, error: loiCheck } : { data: null, error: null });
  let kq = await TD.luuMon(c, ID, formSoan('luu_cong_bo', { mo_ta_vi: 'Có mô tả.' }), 'vi');
  ok('CHECK chặn khi công bố (món sống thiếu cảnh báo) → "Chưa công bố được"', !kq.ok && /Chưa công bố được/.test(kq.cau), kq.cau);
  c = clientGia(q => q.loai === 'update' ? { data: null, error: loiCheck } : { data: null, error: null });
  kq = await TD.luuMon(c, ID, formSoan('luu', { mo_ta_vi: '' }), 'vi');
  ok('CHECK chặn khi lưu món ĐANG công bố → câu riêng "Món đang công bố…", giữ chữ đã gõ',
     !kq.ok && /Món đang công bố/.test(kq.cau) && kq.daGo, kq.cau);

  c = clientGia(q => q.loai === 'update' ? { data: null, error: { message: 'TypeError: fetch failed' } } : { data: null, error: null });
  kq = await TD.luuMon(c, ID, formSoan('luu'), 'vi');
  ok('Mất mạng khi lưu → câu mất mạng chung, không "Đã lưu"', !kq.ok && kq.cau === CAU_MAT_MANG_GHI.vi, kq.cau);
  c = clientGia(() => ({ data: null, error: { message: 'TypeError: fetch failed' } }));
  kq = await TD.goMon(c, ID, 'en');
  ok('Mất mạng khi gỡ → câu mất mạng tiếng Anh, không thành công', !kq.ok && kq.cau === CAU_MAT_MANG_GHI.en, kq.cau);
  c = clientGia(q => q.loai === 'update'
    ? { data: null, error: { message: 'new row violates row-level security policy for table "mon_an"' } } : { data: null, error: null });
  kq = await TD.luuMon(c, ID, formSoan('luu'), 'vi');
  ok('RLS báo lỗi → "không có quyền"', !kq.ok && /không có quyền/.test(kq.cau), kq.cau);

  c = clientGia(q => ({ data: null, error: { message: 'canceling statement due to statement timeout' } }));
  let nem = null;
  try { await TD.docDanhSach(c); } catch (e) { nem = e; }
  ok('Đọc danh sách hỏng → ném lỗi cho trang hiện câu lỗi (không giả là thực đơn rỗng)', nem instanceof Error);
});

// ===========================================================================
await nhom('3b · Danh sách: đúng thứ tự trang Thực đơn, lý do vướng theo món', async () => {
  const NHOM = [
    { id: 'g2', ma: 'chinh', ten_vi: 'Món chính', ten_en: 'Mains', thu_tu: 2, dang_dung: true, khong_niem_yet_gia: false },
    { id: 'g1', ma: 'salad', ten_vi: 'Salad', ten_en: 'Salads', thu_tu: 1, dang_dung: true, khong_niem_yet_gia: false },
    { id: 'g3', ma: 'cu', ten_vi: 'Nhóm cũ', ten_en: null, thu_tu: 0, dang_dung: false, khong_niem_yet_gia: false },
    { id: 'g4', ma: 'bo', ten_vi: 'Bò tại quầy', ten_en: null, thu_tu: 9, dang_dung: true, khong_niem_yet_gia: true },
  ];
  const MON = [
    { id: 'm2', ma: 'F02', ten_vi: 'B', thu_tu: 2, trang_thai: 'nhap', nhom_mon_id: 'g1' },
    { id: 'm1', ma: 'F01', ten_vi: 'A', thu_tu: 1, trang_thai: 'da_cong_bo', nhom_mon_id: 'g1' },
    { id: 'm3', ma: 'F10', ten_vi: 'C', thu_tu: 1, trang_thai: 'nhap', nhom_mon_id: 'g2' },
    { id: 'm4', ma: 'X01', ten_vi: 'D', thu_tu: 1, trang_thai: 'nhap', nhom_mon_id: 'g3' },
  ];
  const c = clientGia(q => q.bang === 'nhom_mon' ? { data: NHOM, error: null }
    : q.bang === 'mon_an' ? { data: MON, error: null }
    : { data: [{ ma: 'F02', vuong_gi: 'Chưa có mô tả' }, { ma: 'F10', vuong_gi: 'Sẵn sàng công bố' }], error: null });
  const ds = await TD.docDanhSach(c);
  ok('Nhóm theo thứ tự; nhóm ngừng dùng còn món đứng cuối (vẫn mở được món để gỡ); bỏ nhóm không có món',
     ds.map(g => g.nhom.ma).join() === 'salad,chinh,cu', ds.map(g => g.nhom.ma).join());
  ok('Món trong nhóm theo thứ tự', ds[0].mon.map(m => m.ma).join() === 'F01,F02');
  ok('Món đang công bố không có lý do vướng; món nháp có', ds[0].mon[0].vuong === null && ds[0].mon[1].vuong === 'Chưa có mô tả' && ds[1].mon[0].vuong === 'Sẵn sàng công bố');
  const c2 = clientGia(q => q.bang === 'v_mon_con_vuong' ? { data: null, error: { message: 'permission denied' } }
    : q.bang === 'nhom_mon' ? { data: NHOM, error: null } : { data: MON, error: null });
  const ds2 = await TD.docDanhSach(c2);
  ok('Đọc lý do vướng hỏng → danh sách vẫn hiện, chỉ thiếu lý do', ds2.length === 3 && ds2.every(g => g.mon.every(m => m.vuong === null)));
  ok('docMon: id không phải uuid → null, không gọi database', await TD.docMon(clientGia(() => { throw new Error('gọi'); }), "x' or 1=1") === null);
});

// ===========================================================================
const { db, duoi, duoiAnon } = await dungDatabase();
const uidMktNghi = '00000000-0000-4000-8000-0000000000f2';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam)
                select $1, chi_nhanh_id, 'Marketing đã nghỉ', 'marketing', false from nhan_su where auth_uid = $2`,
  [uidMktNghi, UID.mktA]);

/** Lấy câu UPDATE thư viện dựng ra (client giả), rồi chạy ĐÚNG câu đó trên PGlite dưới một vai. */
async function chayNhuThuVien(uid, monId, phienBan, form, { anon = false } = {}) {
  const c = clientGia(q => (q.loai === 'update' ? { data: [{ id: monId }], error: null } : { data: null, error: null }));
  await TD.luuMon(c, monId, form, 'vi');
  const up = c.goi.find(q => q.loai === 'update');
  if (!up) return { khongGoi: true };
  const cot = Object.keys(up.tri);
  const sql = `update mon_an set ${cot.map((k, i) => `${k} = $${i + 3}`).join(', ')}
               where id = $1 and updated_at = $2::timestamptz returning id, trang_thai`;
  const thamSo = [monId, phienBan, ...cot.map(k => up.tri[k])];
  return anon ? duoiAnon(sql, thamSo) : duoi(uid, sql, thamSo);
}
const docDong = async ma => (await db.query(
  `select id, updated_at::text as phien, trang_thai, mo_ta_vi, la_mon_song from mon_an where ma = $1`, [ma])).rows[0];
const formThat = (viec, them = {}) => formSoan(viec, {
  goc_ten_en: '', goc_mo_ta_en: '', ten_en: '', mo_ta_en: '', ...them,
});
async function congKhai() { return (await db.query(`select mon_ma from thuc_don_cong_khai()`)).rows.map(r => r.mon_ma); }

await nhom('4 · Database thật: đúng câu UPDATE của thư viện, dưới từng vai', async () => {
  await db.query(`insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai) values ('hien_thuc_don', 'bool', true, 'da_cong_bo')`);
  let f01 = await docDong('F01');

  for (const [ten, uid, thamSo] of [
    ['Thu ngân', UID.thuNganA], ['Thủ kho (vai kho)', UID.thuKhoA], ['Marketing đã nghỉ', uidMktNghi],
    ['Đăng nhập nhưng không có dòng nhan_su', '00000000-0000-4000-8000-0000000000e9'],
  ]) {
    const r = await chayNhuThuVien(uid, f01.id, f01.phien, formThat('luu_cong_bo'));
    ok(`${ten}: không sửa được (0 dòng hoặc bị từ chối)`, r.loi !== null || r.rows.length === 0, r.loi ?? `${r.rows?.length} dòng`);
  }
  const anon = await chayNhuThuVien(null, f01.id, f01.phien, formThat('luu_cong_bo'), { anon: true });
  ok('anon: không sửa được', anon.loi !== null || anon.rows.length === 0, anon.loi ?? `${anon.rows?.length} dòng`);
  ok('Sau các lần trên F01 vẫn là nháp, chưa lên trang', (await docDong('F01')).trang_thai === 'nhap' && !(await congKhai()).includes('F01'));

  const docTN = await duoi(UID.thuNganA, `select ma from mon_an where ma = 'F01'`);
  ok('Thu ngân vẫn ĐỌC được món (trang chỉ đọc)', docTN.rows?.length === 1, docTN.loi);
  const docKho = await duoi(UID.thuKhoA, `select ma from mon_an`);
  ok('Vai kho không đọc được món nào', docKho.loi !== null || docKho.rows.length === 0);

  const r = await chayNhuThuVien(UID.mktA, f01.id, f01.phien, formThat('luu_cong_bo'));
  ok('Marketing: lưu và công bố được (1 dòng, trạng thái đang công bố)', r.rows?.length === 1 && r.rows[0].trang_thai === 'da_cong_bo', r.loi);
  ok('Món vừa công bố hiện trên thuc_don_cong_khai()', (await congKhai()).includes('F01'));
  ok('cong_bo_luc được trigger ghi', (await db.query(`select cong_bo_luc from mon_an where ma = 'F01'`)).rows[0].cong_bo_luc !== null);

  const cu = await chayNhuThuVien(UID.mktA, f01.id, f01.phien, formThat('luu', { mo_ta_vi: 'Bản cũ.' }));
  ok('Lưu với phiên bản cũ (người khác đã sửa) → 0 dòng, không ghi đè', cu.rows?.length === 0 && (await docDong('F01')).mo_ta_vi !== 'Bản cũ.', cu.loi);

  f01 = await docDong('F01');
  const thieu = await chayNhuThuVien(UID.mktA, f01.id, f01.phien, formThat('luu', { mo_ta_vi: '[Chờ viết lại]' }));
  ok('Lưu món ĐANG công bố với mô tả [ngoặc vuông] → database chặn bằng CHECK mon_an_cong_bo_phai_sach',
     /mon_an_cong_bo_phai_sach/.test(thieu.loi ?? ''), thieu.loi);
  ok('Câu lỗi thật của database → thư viện ra câu "Món đang công bố…"', await (async () => {
    const c = clientGia(q => q.loai === 'update' ? { data: null, error: { message: thieu.loi } } : { data: null, error: null });
    return /Món đang công bố/.test((await TD.luuMon(c, f01.id, formThat('luu', { mo_ta_vi: '[Chờ viết lại]' }), 'vi')).cau);
  })());

  const song = (await db.query(`select ma from mon_an where la_mon_song order by ma limit 1`)).rows[0]?.ma;
  ok('Seed có ít nhất một món sống', !!song);
  const ms = await docDong(song);
  const khongCB = await chayNhuThuVien(UID.qlA, ms.id, ms.phien, formThat('luu_cong_bo', { canh_bao: '' }));
  ok(`Món sống ${song} công bố khi chưa có cảnh báo → database chặn`, /mon_an_cong_bo_phai_sach/.test(khongCB.loi ?? ''), khongCB.loi);
  const coCB = await chayNhuThuVien(UID.qlA, ms.id, ms.phien, formThat('luu_cong_bo', { canh_bao: 'Thịt bò sống. Phụ nữ mang thai và trẻ nhỏ không nên dùng.' }));
  ok(`Món sống ${song} có cảnh báo → quản lý công bố được`, coCB.rows?.length === 1, coCB.loi);
  ok('Giá của món vừa công bố vẫn trống (thư viện không bao giờ ghi giá)',
     (await db.query(`select gia, gia_de_xuat from mon_an where ma in ('F01', $1)`, [song])).rows.every(x => x.gia === null && x.gia_de_xuat === null));

  const f02 = await docDong('F02');
  const qlB = await chayNhuThuVien(UID.qlB, f02.id, f02.phien, formThat('luu', { mo_ta_vi: 'Món dùng chung mọi chi nhánh.' }));
  ok('Quản lý chi nhánh khác cũng sửa được (thực đơn dùng chung toàn thương hiệu, 0011)', qlB.rows?.length === 1, qlB.loi);

  const go = await duoi(UID.mktA, `update mon_an set trang_thai = 'da_thu_hoi' where id = $1 and trang_thai = 'da_cong_bo' returning id`, [f01.id]);
  ok('Gỡ (câu của goMon) → 1 dòng, món biến khỏi thuc_don_cong_khai()', go.rows?.length === 1 && !(await congKhai()).includes('F01'), go.loi);
  const goLai = await duoi(UID.mktA, `update mon_an set trang_thai = 'da_thu_hoi' where id = $1 and trang_thai = 'da_cong_bo' returning id`, [f01.id]);
  ok('Gỡ lần hai → 0 dòng (thư viện đọc lại và báo "đã gỡ")', goLai.rows?.length === 0);
  const goTN = await duoi(UID.thuNganA, `update mon_an set trang_thai = 'da_thu_hoi' where ma = $1 returning id`, [song]);
  ok('Thu ngân không gỡ được món', goTN.loi !== null || goTN.rows.length === 0);
});

// ===========================================================================
await nhom('5 · Hợp đồng với database: vai, cột, ô dịch', async () => {
  const vaiPolicy = async ten => {
    const { rows: [r] } = await db.query(
      `select coalesce(pg_get_expr(polqual, polrelid), '') || coalesce(pg_get_expr(polwithcheck, polrelid), '') as bt
         from pg_policy where polname = $1 and polrelid = 'mon_an'::regclass`, [ten]);
    return [...new Set([...(r?.bt ?? '').matchAll(/'([a-z_]+)'/g)].map(m => m[1]))].sort();
  };
  const sua = await vaiPolicy('mon_an_sua');
  ok('VAI_SUA_MON đúng bằng vai của policy mon_an_sua', JSON.stringify([...TD.VAI_SUA_MON].sort()) === JSON.stringify(sua), sua.join(', '));
  const doc = await vaiPolicy('mon_an_doc');
  const muc = NB.MUC_NOI_BO.find(m => m.ma === 'thuc_don');
  ok('Mục menu Thực đơn có trên menu nhà hàng, trỏ /noi-bo/thuc-don', muc?.link === '/noi-bo/thuc-don');
  ok('Vai của mục menu Thực đơn = vai của policy mon_an_doc', JSON.stringify([...(muc?.vai ?? [])].sort()) === JSON.stringify(doc), doc.join(', '));

  const { rows } = await db.query(`select column_name from information_schema.columns where table_name = 'mon_an'`);
  const cot = new Set(rows.map(r => r.column_name));
  const nguon = readFileSync(join(SRC, 'lib', 'thuc-don-noi-bo.ts'), 'utf8');
  const khoaMonAn = [...(nguon.match(/export interface MonAn \{([\s\S]*?)\n\}/)?.[1] ?? '').matchAll(/^\s+([a-z_]+)\??:/gm)].map(m => m[1]);
  ok('Đọc được khóa của interface MonAn', khoaMonAn.length > 15, String(khoaMonAn.length));
  const khongCo = [...khoaMonAn, ...TD.COT_SUA, ...TD.COT_DICH].filter(k => !cot.has(k));
  ok('Mọi khóa của MonAn, COT_SUA, COT_DICH là cột thật của mon_an', khongCo.length === 0, khongCo.join(', '));

  const { rows: dich } = await db.query(`select cot, nguon from cot_ban_dich() where bang = 'mon_an' order by cot`);
  const tuDB = dich.map(d => `${d.cot}<-${d.nguon}`).sort().join();
  const tuWeb = TD.O_DICH_MON.map(o => `${o.cot}<-${o.nguon}`).sort().join();
  ok('O_DICH_MON khớp đúng các ô dịch của mon_an trong cot_ban_dich() (0036)', tuDB === tuWeb, `${tuDB} | ${tuWeb}`);
});

// ===========================================================================
await nhom('6 · Trang: đọc form an toàn, chuyển hướng 303, không ô giá hay cờ pháp lý', async () => {
  const id = docNguon('pages/noi-bo/thuc-don/[id].astro');
  const ds = docNguon('pages/noi-bo/thuc-don/index.astro');
  ok('[id].astro đọc form bằng docFormNoiBo, không gọi request.formData() trần',
     /docFormNoiBo\(Astro\.request\)/.test(id) && !/request\.formData\(\)/.test(id));
  ok('[id].astro ghi được thì chuyenHuongNoiBo (303), đọc câu báo bằng docBaoNoiBo',
     /return chuyenHuongNoiBo\(Astro, bao, duongDan\)/.test(id) && /docBaoNoiBo\(Astro\.cookies/.test(id));
  const oCam = [...id.matchAll(/name="(gia[a-z_]*|muc_cay[a-z_]*|la_mon_song|co_con|nhom_mon_id|ma|trang_thai|di_ung)"/g)].map(m => m[1]);
  ok('[id].astro không có ô giá, mức cay, cờ món sống / có cồn, nhóm, mã, trạng thái', oCam.length === 0, oCam.join(', '));
  ok('Nút công bố là nút submit thứ hai (Enter trong ô chữ chỉ lưu)',
     id.indexOf('value="luu"') > 0 && id.indexOf('value="luu"') < id.indexOf('value="luu_cong_bo"'));
  ok('Hai trang ẩn ô soạn theo VAI_SUA_MON', /VAI_SUA_MON as readonly string\[\]\)\.includes\(nhanSu\.vai_tro\)/.test(id)
     && /VAI_SUA_MON as readonly string\[\]\)\.includes\(nhanSu\.vai_tro\)/.test(ds));
  ok('Trang danh sách chỉ đọc: không xử lý POST', !/request\.method === 'POST'/.test(ds));
  ok('Lưu xong thì dịch nền đúng món vừa lưu (bang mon_an)', /chayNen\(Astro\.locals, dichBu\(client, \{ bang: 'mon_an', dongId: id \}\)\)/.test(id));
  const tq = docNguon('pages/noi-bo/index.astro');
  ok('Trang Tổng quan: dòng "Thực đơn sẵn sàng công bố" dẫn sang /noi-bo/thuc-don', /ten: t\.vThucDon,[\s\S]{0,260}di: '\/noi-bo\/thuc-don'/.test(tq));
});

await db.close();
process.exit(ketThuc('SOẠN THỰC ĐƠN'));
