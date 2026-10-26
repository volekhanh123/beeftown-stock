/**
 * BEEFTOWN — MENU BÁN LẺ: THỊT BÒ MANG VỀ VÀ KIM CHI (0097)
 * =========================================================
 *
 *     node test/test-ban-le.mjs
 *
 * Năm hàm của trang /noi-bo/ban-le (ban_le_danh_sach, ban_le_tao_san_pham, ban_le_luu_san_pham,
 * ban_le_chot_gia, ban_le_doi_chieu) và hai bảng ban_le_san_pham, ban_le_goi. Bất biến:
 *
 *   1. Quyền: anon không đọc bảng, không gọi hàm. Vai kho, tài khoản máy, nhân sự đã nghỉ (quản lý, marketing),
 *      tài khoản không có dòng nhan_su đọc 0 dòng và bị năm hàm từ chối bằng 42501 kèm đúng câu. Thu ngân,
 *      marketing xem được menu (không tồn) nhưng không tạo / lưu / chốt / đối chiếu. Quản lý không chốt giá, không
 *      đối chiếu chi nhánh khác. Không ai ghi thẳng cột nghiệp vụ; ô dịch en / ko chỉ vai biên tập ghi được.
 *   2. Bấm hai lần: cùng ma_gui → một sản phẩm; lưu lại bằng phiên bản cũ → nguoi_khac_sua, không ghi gì; giá kho
 *      vừa đổi → gia_kho_vua_doi và sản phẩm, gói, giá kho đều nguyên; chốt hai lần → da_chot_roi.
 *   3. Giờ Việt Nam: tồn ở quầy và còn hàng theo lô còn hạn — 23:50 còn tính, 00:10 hôm sau thì thôi.
 *   4. Chữ và số: giá gói làm tròn tới 1.000 đ, 0 đ không bao giờ là giá; chữ có dấu giữ nguyên; mã sản phẩm chỉ
 *      chữ thường không dấu; "1.000.000" dạng chữ không bao giờ bị đọc nhầm thành 1.
 *   5. Luật: giá thử / đã chốt (gói ngưng bán có giá cũng chốt được), gói thêm sau khi chốt, hộp không giá, khay
 *      nguyên chặn lần lưu ĐƯA sản phẩm Đang bán vào cấu hình đó (mặt hàng đổi sang khay sau khi bán thì chỉ cảnh
 *      báo), mặt hàng mất / ngừng, mã FABi (không toàn số, không trùng), bỏ gói phải nói rõ, id gói phải là gói
 *      đang có (khóa tạm "moi-1" bị từ chối bằng câu dịch được), giá mỗi kg (sửa ô của Kho → Mặt hàng), giá
 *      trống / 0 / quá 999.999 đều là gia_qua_can.
 *   6. Đối chiếu FABi: thực đơn cũ → menu_cu (không bao giờ "chưa có trên FABi"), khớp, tạo, bật, ghép, sửa ghép,
 *      đặt giá, khay nguyên, tắt món, kiểm tra món, mã cân có số 0 đầu, ô mã và mã giảm với đúng giá, don_vi của
 *      dòng. 6b: mục kiểm tra không bảo tắt mã mà mục mã cân / ô mã / mã giảm đòi; giá mỗi kg trống không bao giờ
 *      khop (thieu_gia); ô trống của Ghép món không làm "ghép đúng" ra NULL.
 *   7. Bản dịch (0036): v_viec_dich vẫn security_invoker, liệt kê ba ô mới; máy dịch ghi được dưới quyền quản lý
 *      và marketing, không đổi updated_at (form mở trước lúc dịch vẫn lưu được); sửa tay qua hàm lưu ghi là bản
 *      tay.
 *   8. Cuối file: kho_doi_soat_ton() rỗng.
 *
 * PGlite chỉ có một kết nối: hai lần bấm CÙNG LÚC (hai phiên song song) không dựng được ở đây — nhánh on conflict
 * / unique_violation của ban_le_tao_san_pham chỉ kiểm được bằng đọc mã (ghi trong mô tả PR).
 */

import {
  dungDatabase, taoBoDem, datGioDatabase, traGioDatabase, maGui, themMayIpos, UID, UID_MAY_IPOS,
} from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — MENU BÁN LẺ (0097)');
const { db, cnA, cnB, duoi, duoiAnon, phaiLoi } = await dungDatabase();
await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
await themMayIpos(db, cnA, cnB);

// Người khung dùng chung chưa có (như test-quyen-ghi-thang-crm.mjs): quản lý và marketing ĐÃ NGHỈ — vai lẽ ra
// được phép, nên chỉ dang_lam = false mới là lý do từ chối — và tài khoản đăng nhập không có dòng nhan_su.
const UID_LA = '00000000-0000-4000-8000-0000000000aa';
const UID_QL_NGHI = '00000000-0000-4000-8000-0000000000ad';
const UID_MKT_NGHI = '00000000-0000-4000-8000-0000000000ae';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam) values
                ($1, $3, 'Quản lý đã nghỉ', 'quan_ly', false), ($2, $3, 'Marketing đã nghỉ', 'marketing', false)`,
               [UID_QL_NGHI, UID_MKT_NGHI, cnA.id]);
// Mọi vai máy có trong enum (may_chung, may_ipos, may_zalo, may_messenger…): may_ipos đã có (themMayIpos).
const MAY = [['may_ipos', UID_MAY_IPOS.mayIposA]];
{
  const { rows } = await db.query(`select v::text as vai from unnest(enum_range(null::vai_tro)) v
                                   where v::text like 'may\\_%' and v::text <> 'may_ipos' order by 1`);
  rows.forEach((r, i) => MAY.push([r.vai, `00000000-0000-4000-8000-0000000000${(0xe0 + i).toString(16)}`]));
  for (const [vai, uid] of MAY.slice(1)) {
    await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam) values ($1, $2, $3, $4::vai_tro, true)`,
                   [uid, cnA.id, `Máy ${vai}`, vai]);
  }
}

const viTri = async cn => Object.fromEntries((await db.query(
  `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cn.id])).rows.map(r => [r.loai, r.id]));
const vtA = await viTri(cnA);

const vi = r => (r.loi ? `${r.ma}: ${r.loi}` : JSON.stringify(r.kq ?? r.rows));
const CAU = {
  xem: 'Tài khoản này không xem được menu bán lẻ.',
  sua: 'Chỉ chủ và quản lý được sửa menu bán lẻ.',
  chot: 'Chỉ chủ được chốt giá bán lẻ.',
  doiChieu: 'Tài khoản này không đối chiếu được FABi ở chi nhánh này.',
  khayNguyen: 'Chưa lưu được: gói online "Cắt tại quầy khi có đơn" trên mặt hàng kho đếm theo khay thì FABi sẽ trừ nguyên một khay cho mỗi gói. Chọn "Đóng gói sẵn", đổi mặt hàng sang cân theo kg, hoặc để Tạm ngưng.',
};
/** Bị từ chối đúng kiểu: 42501 và đúng câu. */
const tuChoi = (r, cau) => r.loi === cau && r.ma === '42501';

/** Mặt hàng phần cắt, chèn bằng superuser. */
async function matHang(ma, ten, { demGoi = false, donVi = 'gói', gia = null, maCan = null, dangDung = true } = {}) {
  const { rows: [r] } = await db.query(
    `insert into kho_mat_hang (ma, ten, loai, dem_goi, don_vi_goi, gia_ban_kg, ma_can, dang_dung)
     values ($1, $2, 'phan_cat', $3, $4, $5, $6, $7) returning id`, [ma, ten, demGoi, donVi, gia, maCan, dangDung]);
  return r.id;
}
const giaKho = async id => Number((await db.query(`select gia_ban_kg from kho_mat_hang where id = $1`, [id])).rows[0].gia_ban_kg);

const goi = async (uid, sql, p = []) => {
  const r = await (uid === 'anon' ? duoiAnon(sql, p) : duoi(uid, sql, p));
  return { ...r, kq: r.rows?.[0]?.r };
};
const tao = (uid, ma, ten, loai = 'thit', cach = 'theo_can', gui = maGui()) =>
  goi(uid, `select ban_le_tao_san_pham($1, $2, $3, $4, $5) as r`, [gui, ma, ten, loai, cach]);
/** Một sản phẩm qua ban_le_danh_sach (mặc định: chủ, không chi nhánh). */
const doc = async (id, { uid = UID.chu, cn = null } = {}) =>
  (await goi(uid, `select ban_le_danh_sach($1, $2) as r`, [cn, id])).kq?.[0];
const danhSach = (uid, cn = null) => goi(uid, `select ban_le_danh_sach($1) as r`, [cn]);
// now() của PGlite chỉ tới mili giây và hai giao dịch liền nhau có thể cùng một mili giây: hai lần ghi cùng
// updated_at thì phép thử "phiên bản cũ bị từ chối" (hay "máy dịch không đổi updated_at") đúng một cách rỗng.
// Mọi lần ghi chờ vài mili giây trước (Postgres thật tới micro giây).
const nghi = () => new Promise(xong => setTimeout(xong, 3));
/** Lưu — phiên bản mặc định là bản vừa đọc (như trang). */
const luu = async (uid, id, duLieu, phienBan) => {
  await nghi();
  const pb = phienBan ?? (await doc(id)).updated_at;
  return goi(uid, `select ban_le_luu_san_pham($1, $2::timestamptz, $3::jsonb) as r`, [id, pb, JSON.stringify(duLieu)]);
};
/** Chốt — mặc định gửi đúng ảnh chụp trang vừa hiện (gia_de_chot). */
const chot = async (uid, id, { gia, phienBan } = {}) => {
  await nghi();
  const sp = await doc(id);
  return goi(uid, `select ban_le_chot_gia($1, $2::timestamptz, $3::jsonb) as r`,
             [id, phienBan ?? sp.updated_at, JSON.stringify(gia === undefined ? sp.gia_de_chot : gia)]);
};
const doiChieu = (uid, cn) => goi(uid, `select ban_le_doi_chieu($1) as r`, [cn]);
const goiCua = (sp, soGam) => sp?.goi?.find(g => g.so_gam === soGam);
const coCanh = (sp, ma) => (sp?.canh_bao ?? []).includes(ma);
const dong = async sql => (await db.query(sql)).rows;
const giongNhau = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const mh = {};
const id = {};
mh.ribeye = await matHang('RIBEYE', 'Ribeye Mỹ', { gia: 950000, maCan: '1001' });
mh.ribeye2 = await matHang('RIBEYE-2', 'Ribeye Úc', { gia: 900000, maCan: '1006' });
mh.khay = await matHang('BAP-KHAY', 'Bắp bò khay', { demGoi: true, donVi: 'khay', gia: 600000, maCan: '1002' });
mh.dat = await matHang('THAN-DAT', 'Thăn đặc biệt', { gia: 1050000, maCan: '1003' });
mh.re = await matHang('BO-RE', 'Bò vụn', { gia: 2499, maCan: '1004' });
mh.hop = await matHang('KIMCHI-HOP', 'Kim chi hộp 500 g', { demGoi: true, donVi: 'hộp' });
mh.hopKg = await matHang('KIMCHI-KG', 'Kim chi cân ký', {});
mh.goi200 = await matHang('RIB-GOI-200', 'Ribeye gói 200 g', { demGoi: true });
mh.ngung = await matHang('NGUNG', 'Mặt hàng đã ngừng', { gia: 500000, dangDung: false });
mh.gio = await matHang('GIO-VN', 'Thăn ngoại giờ VN', { gia: 800000, maCan: '1005' });

// ===========================================================================
await nhom('1 · QUYỀN — ai đọc, ai sửa, ai chốt, ai đối chiếu', async () => {
  const t = await tao(UID.qlA, 'quyen-ribeye', 'Ribeye quyền');
  ok('Quản lý tạo được sản phẩm (sản phẩm mới, có id)', t.loi === null && t.kq?.da_co === false && !!t.kq?.id, vi(t));
  id.quyen = t.kq?.id;
  const l = await luu(UID.qlA, id.quyen, { mat_hang_id: mh.ribeye });
  ok('Quản lý lưu được (gắn mặt hàng kho)', l.loi === null && l.kq?.ok === true, vi(l));
  await db.query(`insert into kho_lo (chi_nhanh_id, ma_lo, mat_hang_id, nguon, han_dung) values ($1, 'Q-1', $2, 'nhap', hom_nay_vn() + 5)`,
                 [cnA.id, mh.ribeye]);
  await db.query(`insert into kho_so_cai (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi, chung_tu_loai, chung_tu_id)
                  select $1, id, $2, $3, 'nhap', 2.5, 0, 'phieu_nhap', gen_random_uuid() from kho_lo where ma_lo = 'Q-1'`,
                 [cnA.id, vtA.quay, mh.ribeye]);

  /** Năm hàm với tham số hợp lệ; trả [tên, kết quả, câu từ chối mong đợi]. */
  const namHam = async uid => {
    const sp = await doc(id.quyen);
    return [
      ['ban_le_danh_sach', await goi(uid, `select ban_le_danh_sach($1, null) as r`, [cnA.id]), CAU.xem],
      ['ban_le_tao_san_pham', await tao(uid, 'khong-duoc-tao', 'Không được tạo'), CAU.sua],
      ['ban_le_luu_san_pham', await goi(uid, `select ban_le_luu_san_pham($1, $2::timestamptz, $3::jsonb) as r`,
                                        [id.quyen, sp.updated_at, JSON.stringify({ ten_vi: 'Bị đổi tên' })]), CAU.sua],
      ['ban_le_chot_gia', await goi(uid, `select ban_le_chot_gia($1, $2::timestamptz, $3::jsonb) as r`,
                                    [id.quyen, sp.updated_at, JSON.stringify(sp.gia_de_chot)]), CAU.chot],
      ['ban_le_doi_chieu', await doiChieu(uid, cnA.id), CAU.doiChieu],
    ];
  };

  // anon
  for (const bang of ['ban_le_san_pham', 'ban_le_goi']) {
    const r = await duoiAnon(`select count(*)::int n from ${bang}`);
    ok(`anon không đọc được ${bang} (42501)`, r.loi !== null && r.ma === '42501', vi(r));
  }
  for (const [ten, r] of await namHam('anon')) {
    ok(`anon không gọi được ${ten} (42501)`, r.loi !== null && r.ma === '42501', vi(r));
  }

  // Bị năm hàm từ chối và đọc 0 dòng
  const BI_CHAN = [
    ['Quản lý ĐÃ NGHỈ', UID_QL_NGHI], ['Marketing ĐÃ NGHỈ', UID_MKT_NGHI], ['Tài khoản không có dòng nhan_su', UID_LA],
    ['Đăng nhập nhưng không phiên (auth.uid() null)', null],
    ['Thủ kho Q1', UID.thuKhoA], ['NV quầy Q1', UID.nvQuayA], ['Kế toán Q1', UID.keToanA], ['Thủ kho đã nghỉ', UID.nghiViec],
    ...MAY.map(([vai, uid]) => [`Tài khoản máy ${vai}`, uid]),
  ];
  for (const [ai, uid] of BI_CHAN) {
    const ket = await namHam(uid);
    const sai = ket.filter(([, r, cau]) => !tuChoi(r, cau)).map(([ten, r]) => `${ten}: ${vi(r)}`);
    ok(`${ai} → cả năm hàm từ chối bằng 42501 kèm đúng câu`, sai.length === 0, sai.join(' · '));
    const sp = await duoi(uid, `select count(*)::int n from ban_le_san_pham`);
    const g = await duoi(uid, `select count(*)::int n from ban_le_goi`);
    ok(`${ai} → đọc 0 dòng sản phẩm, 0 dòng gói`, sp.rows?.[0]?.n === 0 && g.rows?.[0]?.n === 0,
       `${vi(sp)} · ${vi(g)}`);
  }
  ok('Không lần gọi bị từ chối nào tạo được sản phẩm', (await dong(`select id from ban_le_san_pham where ma = 'khong-duoc-tao'`)).length === 0);
  ok('…và tên sản phẩm vẫn nguyên', (await doc(id.quyen)).ten_vi === 'Ribeye quyền');

  // Thu ngân, marketing: xem được, không làm gì khác
  for (const [ai, uid] of [['Thu ngân Q1', UID.thuNganA], ['Marketing Q1', UID.mktA]]) {
    const ket = await namHam(uid);
    const [, ds] = ket[0];
    const sp = ds.kq?.find(x => x.id === id.quyen);
    ok(`${ai} xem được menu`, ds.loi === null && !!sp, vi(ds));
    ok(`${ai} không thấy tồn (ton null, con_hang null) dù gửi chi nhánh`,
       !!sp && sp.ton === null && sp.goi.every(g => g.con_hang === null), JSON.stringify(sp?.ton));
    ok(`${ai} thấy tên, mã cân, giá mỗi kg của mặt hàng gắn sản phẩm (có chủ đích — giá cân công khai ở quầy)`,
       sp?.mat_hang?.ten === 'Ribeye Mỹ' && sp?.mat_hang?.ma_can === '1001' && sp?.mat_hang?.gia_ban_kg === 950000,
       JSON.stringify(sp?.mat_hang));
    const sai = ket.slice(1).filter(([, r, cau]) => !tuChoi(r, cau)).map(([ten, r]) => `${ten}: ${vi(r)}`);
    ok(`${ai} → tạo / lưu / chốt / đối chiếu đều từ chối bằng 42501 kèm đúng câu`, sai.length === 0, sai.join(' · '));
    const n = await duoi(uid, `select count(*)::int n from ban_le_goi`);
    ok(`${ai} đọc được bảng gói qua RLS`, n.rows?.[0]?.n > 0, vi(n));
  }

  // Quản lý: tạo, lưu được (ở trên); không chốt; đối chiếu chi nhánh mình, không chi nhánh khác
  const ket = await namHam(UID.qlA);
  ok('Quản lý Q1 không chốt được giá (42501, đúng câu)', tuChoi(ket[3][1], CAU.chot), vi(ket[3][1]));
  ok('Quản lý Q1 đối chiếu được chi nhánh Q1', ket[4][1].loi === null && Array.isArray(ket[4][1].kq?.dong), vi(ket[4][1]));
  const b = await doiChieu(UID.qlB, cnA.id);
  ok('Quản lý Q7 không đối chiếu được chi nhánh Q1 (42501, đúng câu)', tuChoi(b, CAU.doiChieu), vi(b));
  const bB = await doiChieu(UID.qlB, cnB.id);
  ok('Quản lý Q7 đối chiếu được chi nhánh của mình', bB.loi === null, vi(bB));
  const aB = await doiChieu(UID.qlA, cnB.id);
  ok('Quản lý Q1 không đối chiếu được Q7', tuChoi(aB, CAU.doiChieu), vi(aB));
  const chuB = await doiChieu(UID.chu, cnB.id);
  ok('Chủ đối chiếu được mọi chi nhánh', chuB.loi === null, vi(chuB));
  const c = await chot(UID.chu, id.quyen);
  ok('Chủ chốt được giá', c.loi === null && c.kq?.ok === true, vi(c));

  // Tồn: chỉ khi xem được kho của chi nhánh gửi lên
  const qlA = await doc(id.quyen, { uid: UID.qlA, cn: cnA.id });
  ok('Quản lý Q1 + chi nhánh Q1: có tồn ở quầy (2,5 kg)', qlA?.ton?.so_kg === 2.5, JSON.stringify(qlA?.ton));
  const qlAB = await doc(id.quyen, { uid: UID.qlA, cn: cnB.id });
  ok('Quản lý Q1 + chi nhánh Q7: không tồn (không xem được kho Q7)', qlAB && qlAB.ton === null, JSON.stringify(qlAB?.ton));
  const chuA = await doc(id.quyen, { uid: UID.chu, cn: cnA.id });
  ok('Chủ + chi nhánh Q1: có tồn', chuA?.ton?.so_kg === 2.5, JSON.stringify(chuA?.ton));
  const khongCn = await doc(id.quyen, { uid: UID.qlA });
  ok('Không gửi chi nhánh: không tồn', khongCn && khongCn.ton === null);

  // Ghi thẳng bảng
  const truoc = (await dong(`select ten_en, ban_dich::text as bd from ban_le_san_pham where ma = 'quyen-ribeye'`))[0];
  for (const [ai, uid] of [['Thu ngân Q1', UID.thuNganA], ['Thủ kho Q1', UID.thuKhoA], ['Quản lý đã nghỉ', UID_QL_NGHI],
                           ['Marketing đã nghỉ', UID_MKT_NGHI], ['Tài khoản không có nhan_su', UID_LA]]) {
    const r = await duoi(uid, `update ban_le_san_pham set ten_en = 'Hacked', ban_dich = '{}' where id = $1 returning id`, [id.quyen]);
    ok(`${ai} → sửa thẳng ô được cấp quyền cột (ten_en, ban_dich): 0 dòng, không lỗi`, r.loi === null && r.rows.length === 0, vi(r));
  }
  const sau = (await dong(`select ten_en, ban_dich::text as bd from ban_le_san_pham where ma = 'quyen-ribeye'`))[0];
  ok('…ô dịch và sổ bản dịch giữ nguyên', giongNhau(truoc, sau), `${JSON.stringify(truoc)} → ${JSON.stringify(sau)}`);
  for (const [ai, uid] of [['Chủ', UID.chu], ['Quản lý Q1', UID.qlA]]) {
    for (const [cot, gt] of [['ten_vi', `'Đổi thẳng'`], ['trang_thai', `'dang_ban'`], ['gia_chot', `'{}'::jsonb`],
                             ['mat_hang_id', 'null']]) {
      const r = await duoi(uid, `update ban_le_san_pham set ${cot} = ${gt} where id = $1`, [id.quyen]);
      ok(`${ai} → sửa thẳng ${cot}: 42501 (chỉ qua hàm lưu)`, r.ma === '42501', vi(r));
    }
    const them = await duoi(uid, `insert into ban_le_san_pham (ma, ten_vi, loai, cach_ban) values ('them-thang', 'X', 'thit', 'theo_can')`);
    ok(`${ai} → thêm thẳng sản phẩm: 42501`, them.ma === '42501', vi(them));
    const xoa = await duoi(uid, `delete from ban_le_san_pham where id = $1`, [id.quyen]);
    ok(`${ai} → xóa thẳng sản phẩm: 42501`, xoa.ma === '42501', vi(xoa));
    const xoaHet = await duoi(uid, `truncate ban_le_goi`);
    ok(`${ai} → truncate bảng gói: 42501 (revoke all bỏ cả TRUNCATE)`, xoaHet.ma === '42501', vi(xoaHet));
    for (const sql of [`update ban_le_goi set gia_rieng = 1000 where san_pham_id = $1`,
                       `insert into ban_le_goi (san_pham_id, so_gam) values ($1, 900)`,
                       `delete from ban_le_goi where san_pham_id = $1`]) {
      const r = await duoi(uid, sql, [id.quyen]);
      ok(`${ai} → ${sql.split(' ')[0]} thẳng bảng gói: 42501`, r.ma === '42501', vi(r));
    }
  }
  const mkt = await duoi(UID.mktA, `update ban_le_san_pham set ten_en = 'Ribeye (US)' where id = $1 returning id`, [id.quyen]);
  ok('Marketing (vai biên tập) ghi thẳng được ô dịch en — đường ghi của máy dịch', mkt.loi === null && mkt.rows.length === 1, vi(mkt));
  const soMkt = (await goi(UID.chu, `select ban_le_danh_sach(null, $1) as r`, [id.quyen])).kq?.[0];
  ok('…sổ bản dịch ghi đó là bản tay', soMkt?.ten_en === 'Ribeye (US)' && soMkt?.ban_dich?.ten?.en?.cach === 'tay',
     JSON.stringify(soMkt?.ban_dich));

  // Hàm nội bộ: authenticated không gọi thẳng được; ban_le_gia_goi (thuần) thì được
  for (const [ten, sql] of [
    ['ban_le_san_pham_json', `select ban_le_san_pham_json($1, null, true)`],
    ['ban_le_ton_quay', `select * from ban_le_ton_quay(null, $1)`],
    ['ban_le_ton_tin_duoc', `select ban_le_ton_tin_duoc($1)`],
    ['ban_le_gia_hien_tai', `select ban_le_gia_hien_tai($1)`],
    ['ban_le_gia_ban', `select ban_le_gia_ban(1000, 'theo_can', 1000, 200) where $1::uuid is not null`],
    ['ban_le_doc_so_nguyen', `select ban_le_doc_so_nguyen('1') where $1::uuid is not null`],
    ['ban_le_doc_chu', `select ban_le_doc_chu('"x"') where $1::uuid is not null`],
    ['ban_le_mat_hang_json', `select ban_le_mat_hang_json(m) from kho_mat_hang m where $1::uuid is not null limit 1`],
    ['ban_le_san_pham_giu_ma', `select ban_le_san_pham_giu_ma() where $1::uuid is not null`],
    ['ban_le_kiem_mat_hang', `select ban_le_kiem_mat_hang() where $1::uuid is not null`],
  ]) {
    const r = await duoi(UID.chu, sql, [id.quyen]);
    ok(`Hàm nội bộ ${ten}: chủ (authenticated) cũng không gọi thẳng được`, r.ma === '42501', vi(r));
  }
  const giaGoi = await duoi(UID.qlA, `select ban_le_gia_goi(950000, 200) as g`);
  ok('ban_le_gia_goi (hàm thuần) authenticated gọi được', Number(giaGoi.rows?.[0]?.g) === 190000, vi(giaGoi));
  const { rows: [anonHam] } = await db.query(`select count(*)::int n from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname = 'public' and p.proname like 'ban\\_le\\_%' and has_function_privilege('anon', p.oid, 'execute')`);
  ok('Không hàm ban_le_* nào anon gọi được', anonHam.n === 0, `${anonHam.n} hàm`);
});

// ===========================================================================
await nhom('2 · BẤM HAI LẦN — một sản phẩm, không ghi nửa vời, không trừ / đổi giá hai lần', async () => {
  const gui = maGui();
  const a = await tao(UID.qlA, 'than-lung', 'Thăn lưng', 'thit', 'theo_can', gui);
  const b = await tao(UID.qlA, 'than-lung', 'Thăn lưng', 'thit', 'theo_can', gui);
  ok('Lần bấm đầu tạo sản phẩm mới', a.loi === null && a.kq?.da_co === false, vi(a));
  ok('Lần bấm hai cùng ma_gui → da_co, cùng id', b.loi === null && b.kq?.da_co === true && b.kq?.id === a.kq?.id, vi(b));
  const c = await tao(UID.qlA, 'than-lung-2', 'Đổi chữ trước khi bấm lại', 'thit', 'theo_can', gui);
  ok('Bấm lại cùng ma_gui mà đã gõ khác → vẫn trả sản phẩm đã có, không tạo thêm', c.kq?.da_co === true && c.kq?.id === a.kq?.id
     && (await dong(`select 1 from ban_le_san_pham where ma = 'than-lung-2'`)).length === 0, vi(c));
  ok('Đúng một sản phẩm, đúng hai gói 200 g và 400 g (không bốn)',
     (await dong(`select 1 from ban_le_san_pham where ma = 'than-lung'`)).length === 1
     && giongNhau((await dong(`select so_gam from ban_le_goi g join ban_le_san_pham s on s.id = g.san_pham_id
                                where s.ma = 'than-lung' order by so_gam`)).map(r => r.so_gam), [200, 400]));
  const trung = await tao(UID.qlA, 'than-lung', 'Thăn lưng khác', 'thit', 'theo_can');
  ok('ma_gui khác mà trùng mã → "Mã sản phẩm này đã có. Đổi tên hoặc sửa mã."',
     trung.loi === 'Mã sản phẩm này đã có. Đổi tên hoặc sửa mã.', vi(trung));
  const thieuGui = await goi(UID.qlA, `select ban_le_tao_san_pham(null, 'x-1', 'X', 'thit', 'theo_can') as r`);
  ok('Thiếu ma_gui → từ chối', thieuGui.loi === 'Thiếu mã chống gửi hai lần — tải lại trang.', vi(thieuGui));

  id.lung = a.kq.id;
  const sp0 = await doc(id.lung);
  const l1 = await luu(UID.qlA, id.lung, { ten_vi: 'Thăn lưng Úc' }, sp0.updated_at);
  const l2 = await luu(UID.qlA, id.lung, { ten_vi: 'Thăn lưng Úc' }, sp0.updated_at);
  ok('Lưu lần đầu được', l1.kq?.ok === true, vi(l1));
  ok('Lưu lại cùng phiên bản cũ (bấm đúp) → nguoi_khac_sua kèm updated_at hiện tại, không lỗi',
     l2.loi === null && l2.kq?.ok === false && l2.kq?.ly_do === 'nguoi_khac_sua' && l2.kq?.updated_at === l1.kq?.updated_at, vi(l2));
  const l3 = await luu(UID.qlA, id.lung, { ten_vi: 'Bản cũ đè lên' }, sp0.updated_at);
  const sp1 = await doc(id.lung);
  ok('Phiên bản cũ với chữ khác → nguoi_khac_sua, không ghi gì (tên, updated_at nguyên)',
     l3.kq?.ly_do === 'nguoi_khac_sua' && sp1.ten_vi === 'Thăn lưng Úc' && sp1.updated_at === l1.kq?.updated_at, vi(l3));

  // Giá kho vừa đổi: tên mới + gói đổi + giá cũ đã lỗi thời → không ghi GÌ
  await luu(UID.qlA, id.lung, { mat_hang_id: mh.ribeye2 });
  const spGia = await doc(id.lung);
  const g200 = goiCua(spGia, 200);
  ok('Tiền đề: trang đọc giá mỗi kg 900.000', spGia.mat_hang?.gia_ban_kg === 900000, JSON.stringify(spGia.mat_hang));
  await db.query(`update kho_mat_hang set gia_ban_kg = 920000 where id = $1`, [mh.ribeye2]);   // màn Kho → Mặt hàng
  const lg = await luu(UID.qlA, id.lung, {
    ten_vi: 'Tên mới không được lưu', goi: [{ id: g200.id, gia_rieng: 250000 }, { so_gam: 600 }],
    gia_ban_kg: 980000, gia_ban_kg_cu: 900000,
  }, spGia.updated_at);
  const spSau = await doc(id.lung);
  ok('Giá kho đổi sau khi trang đọc → gia_kho_vua_doi kèm giá hiện tại 920.000',
     lg.loi === null && lg.kq?.ok === false && lg.kq?.ly_do === 'gia_kho_vua_doi' && lg.kq?.gia_ban_kg === 920000, vi(lg));
  ok('…tên sản phẩm KHÔNG đổi', spSau.ten_vi === 'Thăn lưng Úc', spSau.ten_vi);
  ok('…gói KHÔNG đổi (không thêm 600 g, 200 g vẫn không giá riêng)',
     giongNhau(spSau.goi.map(g => g.so_gam), [200, 400]) && goiCua(spSau, 200).gia_rieng === null, JSON.stringify(spSau.goi));
  ok('…giá kho KHÔNG đổi (920.000), phiên bản KHÔNG đổi',
     (await giaKho(mh.ribeye2)) === 920000 && spSau.updated_at === spGia.updated_at);
  const lg2 = await luu(UID.qlA, id.lung, { gia_ban_kg: 980000, gia_ban_kg_cu: 920000 });
  ok('Lưu lại với giá kho mới thấy → được, gia_kho_doi', lg2.kq?.ok === true && lg2.kq?.gia_kho_doi === true
     && (await giaKho(mh.ribeye2)) === 980000, vi(lg2));
  const lg3 = await luu(UID.qlA, id.lung, { gia_ban_kg: 990000, gia_ban_kg_cu: 920000 });
  ok('Bấm Lưu lần hai với giá cũ 920.000 → gia_kho_vua_doi, giá kho không đổi lần nữa',
     lg3.kq?.ly_do === 'gia_kho_vua_doi' && (await giaKho(mh.ribeye2)) === 980000, vi(lg3));

  // Chốt hai lần
  const c1 = await chot(UID.chu, id.lung);
  const luc1 = (await doc(id.lung)).gia_chot_luc;
  const c2 = await chot(UID.chu, id.lung);
  const sp2 = await doc(id.lung);
  ok('Chốt lần đầu ghi ảnh chụp giá', c1.kq?.ok === true && !c1.kq?.da_chot_roi && !!luc1, vi(c1));
  ok('Chốt lần hai cùng giá → da_chot_roi, không ghi lại (gia_chot_luc nguyên)',
     c2.kq?.ok === true && c2.kq?.da_chot_roi === true && sp2.gia_chot_luc === luc1, vi(c2));
  const c3 = await chot(UID.chu, id.lung, { phienBan: sp0.updated_at });
  ok('Chốt bằng phiên bản cũ → nguoi_khac_sua', c3.kq?.ok === false && c3.kq?.ly_do === 'nguoi_khac_sua', vi(c3));
});

// ===========================================================================
await nhom('3 · GIỜ VIỆT NAM — tồn ở quầy và còn hàng theo lô còn hạn', async () => {
  const t = await tao(UID.qlA, 'gio-vn', 'Thăn ngoại giờ VN');
  id.gio = t.kq.id;
  await luu(UID.qlA, id.gio, { mat_hang_id: mh.gio });
  const quay2 = (await db.query(`insert into kho_vi_tri (chi_nhanh_id, ten, loai, thu_tu) values ($1, 'Quầy hai', 'quay', 9) returning id`,
                                [cnA.id])).rows[0].id;
  const themLo = async (ma, viTriId, soKg, hanDung) => {
    const { rows: [lo] } = await db.query(`insert into kho_lo (chi_nhanh_id, ma_lo, mat_hang_id, nguon, han_dung)
                                           values ($1, $2, $3, 'nhap', $4) returning id`, [cnA.id, ma, mh.gio, hanDung]);
    await db.query(`insert into kho_so_cai (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi, chung_tu_loai, chung_tu_id)
                    values ($1, $2, $3, $4, 'nhap', $5, 0, 'phieu_nhap', gen_random_uuid())`, [cnA.id, lo.id, viTriId, mh.gio, soKg]);
  };
  const ngay = '2026-11-13';
  await datGioDatabase(db, `${ngay}T23:50:00+07:00`);
  try {
    await themLo('GIO-1', vtA.quay, 3.1, ngay);           // hạn hôm nay
    await themLo('GIO-KHO', vtA.kho, 9, '2026-11-20');    // trong kho: không phải quầy
    await themLo('GIO-Q2', quay2, 4, '2026-11-20');       // quầy thứ hai
    let sp = await doc(id.gio, { uid: UID.qlA, cn: cnA.id });
    ok('Chế độ kiểm kê: tồn chưa tin được (tin_duoc false), gói không báo còn / hết',
       sp?.ton?.tin_duoc === false && sp.goi.every(g => g.con_hang === null), JSON.stringify(sp?.ton));
    ok('Chưa chọn quầy bán của iPOS: cộng mọi vị trí quầy, không cộng kho (3,1 + 4 = 7,1 kg)',
       sp?.ton?.so_kg === 7.1, JSON.stringify(sp?.ton));

    await db.query(`update kho_cai_dat set nguon_so_ban = 'ipos' where chi_nhanh_id = $1`, [cnA.id]);
    await db.query(`insert into kho_ipos_cau_hinh (chi_nhanh_id, ipos_tu_luc, vi_tri_ban_id) values ($1, now(), $2)`, [cnA.id, vtA.quay]);
    sp = await doc(id.gio, { uid: UID.qlA, cn: cnA.id });
    ok('Trừ kho theo iPOS: chỉ quầy bán của iPOS (vi_tri_ban_id) — 3,1 kg, tin được',
       sp?.ton?.so_kg === 3.1 && sp.ton.tin_duoc === true, JSON.stringify(sp?.ton));
    ok('23:50 giờ VN ngày 13/11: lô hạn 13/11 còn tính → gói 200 g và 400 g "con"',
       goiCua(sp, 200)?.con_hang === 'con' && goiCua(sp, 400)?.con_hang === 'con', JSON.stringify(sp?.goi));
    await luu(UID.qlA, id.gio, { goi: [{ so_gam: 4000 }] });
    sp = await doc(id.gio, { uid: UID.qlA, cn: cnA.id });
    ok('Gói 4.000 g lớn hơn 3,1 kg ở quầy → "het"', goiCua(sp, 4000)?.con_hang === 'het', JSON.stringify(goiCua(sp, 4000)));

    await datGioDatabase(db, '2026-11-14T00:10:00+07:00');
    sp = await doc(id.gio, { uid: UID.qlA, cn: cnA.id });
    ok('00:10 giờ VN ngày 14/11 (UTC vẫn là 13/11): lô hạn 13/11 hết hạn → tồn 0, gói "het"',
       sp?.ton?.so_kg === 0 && goiCua(sp, 200)?.con_hang === 'het', JSON.stringify(sp?.ton));
  } finally {
    await traGioDatabase(db);
  }

  const { rows: [kieu] } = await db.query(`select data_type from information_schema.columns
                                           where table_name = 'ban_le_san_pham' and column_name = 'gia_chot_luc'`);
  ok('gia_chot_luc là timestamptz (thời điểm, không phải ngày)', kieu?.data_type === 'timestamp with time zone', kieu?.data_type);
  await chot(UID.chu, id.gio);
  const { rows: [luc] } = await db.query(`select abs(extract(epoch from now() - gia_chot_luc)) as giay from ban_le_san_pham where id = $1`, [id.gio]);
  ok('gia_chot_luc ghi đúng lúc chốt', Number(luc?.giay) < 60, String(luc?.giay));
});

// ===========================================================================
await nhom('4 · CHỮ VÀ SỐ — giá gói, chữ có dấu, mã sản phẩm, số kiểu Việt', async () => {
  for (const [kg, gam, phai] of [[999999, 200, 200000], [1002500, 200, 201000], [1840000, 400, 736000], [950000, 200, 190000],
                                 [2000, 200, null], [2499, 200, null], [2499, 400, 1000], [null, 200, null]]) {
    const { rows: [r] } = await db.query(`select ban_le_gia_goi($1, $2) as g`, [kg, gam]);
    ok(`ban_le_gia_goi(${kg ?? 'null'} đ/kg, ${gam} g) = ${phai ?? 'null'}`, (r.g === null ? null : Number(r.g)) === phai, String(r.g));
  }

  const t = await tao(UID.qlA, 'ba-chi-my', 'Ba chỉ bò Mỹ');
  id.chu = t.kq.id;
  const l = await luu(UID.qlA, id.chu, {
    ten_vi: '  Ba chỉ bò Mỹ — cắt lát mỏng  ', mo_ta_vi: 'Dòng một: nướng nhanh.\r\nDòng hai: “ăn kèm kim chi”.  ',
    cach_dung_vi: 'Rã đông trong ngăn mát 12 giờ.',
  });
  const sp = await doc(id.chu);
  ok('Chữ có dấu giữ nguyên, cắt khoảng trắng hai đầu', l.kq?.ok === true && sp.ten_vi === 'Ba chỉ bò Mỹ — cắt lát mỏng', sp.ten_vi);
  ok('Xuống dòng của trình duyệt (\\r\\n) lưu thành \\n, ngoặc kép cong giữ nguyên',
     sp.mo_ta_vi === 'Dòng một: nướng nhanh.\nDòng hai: “ăn kèm kim chi”.', JSON.stringify(sp.mo_ta_vi));

  const CAU_MA = 'Mã sản phẩm chỉ gồm chữ thường không dấu, số và dấu gạch ngang, tối đa 40 ký tự.';
  for (const ma of ['kim chi', 'Kim-Chi', 'kim--chi', 'đùi-bò', '-kim-chi', 'kim-chi-', 'a'.repeat(41), '']) {
    const r = await tao(UID.qlA, ma, 'Kim chi');
    ok(`Mã "${ma.length > 20 ? ma.slice(0, 8) + '…' : ma}" bị từ chối bằng câu rõ ràng`, r.loi === CAU_MA, vi(r));
  }
  const kc = await tao(UID.qlA, 'kim-chi-cai-thao', 'Kim chi cải thảo', 'kim_chi', 'theo_hop');
  ok('Mã "kim-chi-cai-thao" hợp lệ; kim chi theo hộp không có gói tự tạo, bảo quản giữ lạnh',
     kc.kq?.da_co === false && (await doc(kc.kq.id))?.goi?.length === 0 && (await doc(kc.kq.id))?.bao_quan === 'giu_lanh', vi(kc));
  id.kimChi = kc.kq?.id;
  for (const [ten, phai] of [['   ', 'Chưa điền tên sản phẩm.'], ['x'.repeat(121), 'Tên sản phẩm dài quá 120 ký tự.']]) {
    const r = await tao(UID.qlA, `ten-${ten.length}`, ten);
    ok(`Tên "${ten.slice(0, 5)}…" (${ten.length} ký tự) bị từ chối: ${phai}`, r.loi === phai, vi(r));
  }
  const loai = await tao(UID.qlA, 'heo-quay', 'Heo quay', 'heo', 'theo_can');
  ok('Loại ngoài thịt bò / kim chi bị từ chối', loai.loi === 'Loại sản phẩm phải là thịt bò hoặc kim chi.', vi(loai));
  const cach = await tao(UID.qlA, 'bo-cai', 'Bò', 'thit', 'theo_cai');
  ok('Cách bán ngoài theo cân / theo hộp bị từ chối', cach.loi === 'Cách bán phải là theo cân hoặc theo hộp.', vi(cach));

  await luu(UID.qlA, id.chu, { mat_hang_id: mh.ribeye });
  const truoc = await giaKho(mh.ribeye);
  const sai = await luu(UID.qlA, id.chu, { gia_ban_kg: '1.000.000', gia_ban_kg_cu: truoc });
  ok('Giá mỗi kg gửi dạng chữ "1.000.000" không bao giờ bị đọc thành 1 hay 1.000 — từ chối, giá kho nguyên',
     sai.loi === 'Giá mỗi kg phải từ 1.000 đ.' && (await giaKho(mh.ribeye)) === truoc, vi(sai));
  const phay = await luu(UID.qlA, id.chu, { goi: [{ so_gam: '1,5' }] });
  ok('Trọng lượng "1,5" (một phẩy năm) không phải số gam nguyên → từ chối', phay.loi === 'Trọng lượng gói phải từ 50 đến 5.000 g.', vi(phay));
  const chuoiSo = await luu(UID.qlA, id.chu, { goi: [{ so_gam: '600', gia_rieng: '150000' }] });
  ok('Số gửi dạng chuỗi chữ số ("600", "150000") vẫn đọc đúng', chuoiSo.kq?.ok === true
     && goiCua(await doc(id.chu), 600)?.gia_rieng === 150000, vi(chuoiSo));
});

// ===========================================================================
await nhom('5 · LUẬT — giá thử, gói, khay nguyên, mặt hàng mất / ngừng, mã FABi, giá mỗi kg', async () => {
  // --- Giá thử / đã chốt
  const t = await tao(UID.qlA, 'luat-ribeye', 'Ribeye luật');
  id.luat = t.kq.id;
  await luu(UID.qlA, id.luat, { mat_hang_id: mh.ribeye });
  let sp = await doc(id.luat);
  ok('Giá gói tự tính từ 950.000 đ/kg: 200 g = 190.000, 400 g = 380.000',
     goiCua(sp, 200)?.gia === 190000 && goiCua(sp, 200)?.gia_tu_tinh === 190000 && goiCua(sp, 400)?.gia === 380000, JSON.stringify(sp.goi));
  ok('Chưa chốt bao giờ → mọi gói và sản phẩm là giá thử', sp.gia_thu === true && sp.goi.every(g => g.gia_thu === true));
  ok('gia_de_chot = đúng ảnh chụp sẽ ghi (khóa là chữ)',
     giongNhau(sp.gia_de_chot, { kg: 950000, goi: { 200: 190000, 400: 380000 } }), JSON.stringify(sp.gia_de_chot));
  const c = await chot(UID.chu, id.luat);
  sp = await doc(id.luat);
  ok('Ngay sau khi chốt: gia_thu false ở mọi gói và ở sản phẩm (ban_le_danh_sach)',
     c.kq?.ok === true && sp.gia_thu === false && sp.goi.every(g => g.gia_thu === false), JSON.stringify(sp.goi.map(g => g.gia_thu)));
  ok('…gia_chot đúng ảnh chụp, ghi người chốt', giongNhau(sp.gia_chot, { kg: 950000, goi: { 200: 190000, 400: 380000 } })
     && sp.gia_chot_boi_ten === 'Chủ nhà hàng' && !!sp.gia_chot_luc, JSON.stringify(sp.gia_chot));
  await db.query(`update kho_mat_hang set gia_ban_kg = 960000 where id = $1`, [mh.ribeye]);   // đổi thẳng ở Kho
  sp = await doc(id.luat);
  ok('Đổi giá mỗi kg ở Kho → giá thử trở lại (true, không phải null), giá gói theo giá mới',
     sp.gia_thu === true && sp.goi.every(g => g.gia_thu === true) && goiCua(sp, 200)?.gia === 192000, JSON.stringify(sp.goi));
  await db.query(`update kho_mat_hang set gia_ban_kg = 950000 where id = $1`, [mh.ribeye]);
  sp = await doc(id.luat);
  ok('Đổi lại đúng giá đã chốt → hết giá thử', sp.gia_thu === false && sp.goi.every(g => g.gia_thu === false));
  await luu(UID.qlA, id.luat, { goi: [{ so_gam: 600 }] });
  sp = await doc(id.luat);
  ok('Gói thêm sau khi chốt → gia_thu === true (không null); gói cũ vẫn đã chốt',
     goiCua(sp, 600)?.gia_thu === true && goiCua(sp, 200)?.gia_thu === false && sp.gia_thu === true, JSON.stringify(sp.goi));

  // --- Gói ngưng bán có giá vẫn vào ảnh chụp để chốt: không thì nó là "giá thử" mãi (không lần chốt nào gồm nó)
  const ngGoi = (await tao(UID.qlA, 'luat-goi-ngung', 'Ribeye có gói ngưng bán')).kq.id;
  await luu(UID.qlA, ngGoi, { mat_hang_id: mh.ribeye });
  await luu(UID.qlA, ngGoi, { goi: [{ id: goiCua(await doc(ngGoi), 400).id, dang_ban: false }] });
  sp = await doc(ngGoi);
  ok('Ảnh chụp để chốt gồm cả gói NGƯNG BÁN có giá (400 g = 380.000)',
     goiCua(sp, 400)?.dang_ban === false && giongNhau(sp.gia_de_chot, { kg: 950000, goi: { 200: 190000, 400: 380000 } }),
     JSON.stringify(sp.gia_de_chot));
  const cNgGoi = await chot(UID.chu, ngGoi);
  sp = await doc(ngGoi);
  ok('Chốt xong: gói ngưng bán có giá → gia_thu false (không "giá thử" mãi); sản phẩm hết giá thử',
     cNgGoi.kq?.ok === true && goiCua(sp, 400)?.gia_thu === false && sp.gia_thu === false,
     `${vi(cNgGoi)} · ${JSON.stringify(sp.goi.map(g => [g.so_gam, g.dang_ban, g.gia_thu]))}`);

  // --- 0 đ không bao giờ là giá
  const re = await tao(UID.qlA, 'luat-bo-vun', 'Bò vụn');
  await luu(UID.qlA, re.kq.id, { mat_hang_id: mh.re });
  sp = await doc(re.kq.id);
  ok('2.499 đ/kg × 200 g làm tròn ra 0 → gia null (không 0 đ), không vào ảnh chụp',
     goiCua(sp, 200)?.gia === null && goiCua(sp, 200)?.gia_tu_tinh === null && !('200' in sp.gia_de_chot.goi)
     && goiCua(sp, 400)?.gia === 1000, JSON.stringify(sp.goi));

  // --- Hộp kim chi
  let l = await luu(UID.qlA, id.kimChi, { trang_thai: 'dang_ban', goi: [{ so_gam: 500, mat_hang_id: mh.hop }] });
  sp = await doc(id.kimChi);
  ok('Hộp kim chi chưa có giá riêng → gia null, cảnh báo thieu_gia (Đang bán)', l.kq?.ok === true
     && goiCua(sp, 500)?.gia === null && goiCua(sp, 500)?.gia_tu_tinh === null && coCanh(sp, 'thieu_gia'), vi(l));
  l = await luu(UID.qlA, id.kimChi, { goi: [{ id: goiCua(sp, 500).id, gia_rieng: 120000 }] });
  sp = await doc(id.kimChi);
  ok('Đặt giá hộp 120.000 → hết thieu_gia', goiCua(sp, 500)?.gia === 120000 && !coCanh(sp, 'thieu_gia'), JSON.stringify(sp.canh_bao));
  l = await luu(UID.qlA, id.kimChi, { goi: [{ so_gam: 1000, gia_rieng: 200000 }] });
  sp = await doc(id.kimChi);
  ok('Hộp đang bán chưa gắn mặt hàng kho → hop_chua_co_kho', coCanh(sp, 'hop_chua_co_kho'), JSON.stringify(sp.canh_bao));
  await luu(UID.qlA, id.kimChi, { goi: [{ id: goiCua(sp, 1000).id, mat_hang_id: mh.hopKg }] });
  sp = await doc(id.kimChi);
  ok('Hộp gắn mặt hàng chỉ cân kg → goi_khong_dem_goi (không phải lỗi)', coCanh(sp, 'goi_khong_dem_goi')
     && !coCanh(sp, 'hop_chua_co_kho'), JSON.stringify(sp.canh_bao));

  // --- Khay nguyên
  const kh = await tao(UID.qlA, 'luat-bap-khay', 'Bắp bò khay');
  id.khay = kh.kq.id;
  await luu(UID.qlA, id.khay, { mat_hang_id: mh.khay });
  sp = await doc(id.khay);
  ok('Cắt tại quầy + mặt hàng đếm theo khay (Tạm ngưng) → cảnh báo khay_nguyen', coCanh(sp, 'khay_nguyen'), JSON.stringify(sp.canh_bao));
  const chan = await luu(UID.qlA, id.khay, { ten_vi: 'Bắp bò đổi tên', trang_thai: 'dang_ban' });
  sp = await doc(id.khay);
  ok('Chuyển Đang bán khi còn khay nguyên → từ chối bằng đúng câu', chan.loi === CAU.khayNguyen, vi(chan));
  ok('…cả lần lưu bị hủy: tên và trạng thái nguyên', sp.ten_vi === 'Bắp bò khay' && sp.trang_thai === 'tam_ngung', sp.ten_vi);
  l = await luu(UID.qlA, id.khay, { nguon_goi: 'dong_san', trang_thai: 'dang_ban' });
  sp = await doc(id.khay);
  ok('Chọn "Đóng gói sẵn" → Đang bán được, hết khay_nguyen', l.kq?.ok === true && sp.trang_thai === 'dang_ban'
     && !coCanh(sp, 'khay_nguyen'), vi(l));
  ok('…gói đóng sẵn chưa gắn mặt hàng → goi_chua_co_kho', coCanh(sp, 'goi_chua_co_kho'), JSON.stringify(sp.canh_bao));
  await luu(UID.qlA, id.khay, { goi: [{ id: goiCua(sp, 200).id, mat_hang_id: mh.goi200 }, { id: goiCua(sp, 400).id, dang_ban: false }] });
  sp = await doc(id.khay);
  ok('Gắn mặt hàng gói cho 200 g, ngưng bán 400 g → hết goi_chua_co_kho', !coCanh(sp, 'goi_chua_co_kho')
     && goiCua(sp, 200)?.mat_hang?.ma === 'RIB-GOI-200' && goiCua(sp, 400)?.dang_ban === false, JSON.stringify(sp.canh_bao));

  // --- Khay nguyên khi sản phẩm ĐÃ Đang bán: mặt hàng bị đổi sang đếm khay ở Kho → Mặt hàng sau khi bán. Chỉ
  // chặn lần lưu đưa sản phẩm VÀO cấu hình đó (chuyển sang Đang bán, đổi mặt hàng / cách làm gói / cách bán);
  // lần lưu khác vẫn được, kèm cảnh báo — không thì sửa một chữ mô tả cũng bị khóa.
  mh.f3 = await matHang('F3-THAN', 'Thăn đổi sang khay sau', { gia: 800000, maCan: '1007' });
  mh.f3kg = await matHang('F3-THAN-KG', 'Thăn cân kg', { gia: 800000 });
  const f3 = (await tao(UID.qlA, 'luat-khay-sau', 'Thăn đổi khay sau')).kq.id;
  l = await luu(UID.qlA, f3, { mat_hang_id: mh.f3, trang_thai: 'dang_ban' });
  ok('Tiền đề: mặt hàng cân theo kg → Đang bán được', l.kq?.ok === true, vi(l));
  await db.query(`update kho_mat_hang set dem_goi = true, don_vi_goi = 'khay' where id = $1`, [mh.f3]);   // Kho → Mặt hàng
  l = await luu(UID.qlA, f3, { mo_ta_vi: 'Sửa mô tả sau khi mặt hàng đổi sang khay.' });
  sp = await doc(f3);
  ok('Đã Đang bán, mặt hàng vừa đổi sang đếm khay ở Kho → lưu mô tả VẪN được, kèm canh_bao khay_nguyen',
     l.loi === null && l.kq?.ok === true && coCanh(l.kq, 'khay_nguyen') && sp.mo_ta_vi === 'Sửa mô tả sau khi mặt hàng đổi sang khay.'
     && sp.trang_thai === 'dang_ban', vi(l));
  l = await luu(UID.qlA, f3, { ten_vi: 'Thăn đổi khay sau (form)', trang_thai: 'dang_ban', nguon_goi: 'cat_tai_quay',
                               mat_hang_id: mh.f3, loai: 'thit', cach_ban: 'theo_can' });
  ok('…form gửi đủ ô với giá trị KHÔNG đổi (trạng thái, cách làm gói, mặt hàng, cách bán) → vẫn lưu được',
     l.loi === null && l.kq?.ok === true && (await doc(f3)).ten_vi === 'Thăn đổi khay sau (form)', vi(l));
  l = await luu(UID.qlA, f3, { mat_hang_id: mh.f3kg });
  ok('…đổi sang mặt hàng cân kg → được, hết khay_nguyen', l.kq?.ok === true && !coCanh(l.kq, 'khay_nguyen'), vi(l));
  let pbF3 = (await doc(f3)).updated_at;
  l = await luu(UID.qlA, f3, { mat_hang_id: mh.f3, ten_vi: 'Không được lưu' });
  sp = await doc(f3);
  ok('Đang bán, đổi mặt hàng sang mặt hàng đếm khay → từ chối bằng đúng câu, không ghi gì',
     l.loi === CAU.khayNguyen && sp.mat_hang_id === mh.f3kg && sp.ten_vi === 'Thăn đổi khay sau (form)' && sp.updated_at === pbF3, vi(l));
  sp = await doc(id.khay);
  l = await luu(UID.qlA, id.khay, { nguon_goi: 'cat_tai_quay' });
  ok('Đang bán "Đóng gói sẵn" trên mặt hàng đếm khay, đổi sang "Cắt tại quầy" → từ chối bằng đúng câu, không ghi gì',
     l.loi === CAU.khayNguyen && (await doc(id.khay)).nguon_goi === 'dong_san' && (await doc(id.khay)).updated_at === sp.updated_at, vi(l));
  l = await luu(UID.qlA, f3, { trang_thai: 'tam_ngung', mat_hang_id: mh.f3 });
  ok('Tạm ngưng + mặt hàng đếm khay → lưu được (cảnh báo khay_nguyen)', l.kq?.ok === true && coCanh(l.kq, 'khay_nguyen'), vi(l));
  pbF3 = (await doc(f3)).updated_at;
  l = await luu(UID.qlA, f3, { trang_thai: 'dang_ban', mo_ta_vi: 'Không được lưu' });
  sp = await doc(f3);
  ok('Tạm ngưng → Đang bán khi còn khay nguyên → từ chối bằng đúng câu, không ghi gì',
     l.loi === CAU.khayNguyen && sp.trang_thai === 'tam_ngung' && sp.mo_ta_vi === 'Sửa mô tả sau khi mặt hàng đổi sang khay.'
     && sp.updated_at === pbF3, vi(l));

  // --- Mặt hàng mất
  mh.mat = await matHang('MAT-DI', 'Mặt hàng sẽ mất', { gia: 700000 });
  const mt = await tao(UID.qlA, 'luat-mat', 'Sản phẩm mặt hàng mất');
  id.mat = mt.kq.id;
  await luu(UID.qlA, id.mat, { mat_hang_id: mh.mat });
  await db.query(`delete from kho_mat_hang where id = $1`, [mh.mat]);   // như script dọn kho
  const ds = await danhSach(UID.qlA);
  sp = ds.kq?.find(x => x.id === id.mat);
  ok('Mặt hàng mất → sản phẩm vẫn có trong danh sách, mat_hang null, mat_hang_mat, cảnh báo',
     !!sp && sp.mat_hang === null && sp.mat_hang_mat === true && coCanh(sp, 'mat_hang_mat'), JSON.stringify(sp?.canh_bao));
  ok('…không lấy giá từ mặt hàng đã mất', sp?.goi?.every(g => g.gia === null), JSON.stringify(sp?.goi));
  l = await luu(UID.qlA, id.mat, { ten_vi: 'Đổi tên khi mặt hàng đã mất', mat_hang_id: mh.mat });
  ok('Lưu lại (mat_hang_id không đổi, đang treo) vẫn được', l.kq?.ok === true, vi(l));
  l = await luu(UID.qlA, id.mat, { mat_hang_id: '00000000-0000-4000-8000-00000000dead' });
  ok('Gắn mặt hàng không có → "Không thấy mặt hàng kho này."', l.loi === 'Không thấy mặt hàng kho này.', vi(l));
  l = await luu(UID.qlA, id.mat, { mat_hang_id: 'khong-phai-uuid' });
  ok('mat_hang_id không phải uuid → cùng câu, không lỗi Postgres thô', l.loi === 'Không thấy mặt hàng kho này.', vi(l));

  // --- Mặt hàng ngừng
  const ng = await tao(UID.qlA, 'luat-ngung', 'Sản phẩm mặt hàng ngừng');
  await luu(UID.qlA, ng.kq.id, { mat_hang_id: mh.ngung });
  sp = await doc(ng.kq.id);
  ok('Mặt hàng ngừng dùng → mat_hang_ngung, cảnh báo, không giá gói, kg null trong ảnh chụp',
     sp.mat_hang_ngung === true && sp.mat_hang?.dang_dung === false && coCanh(sp, 'mat_hang_ngung')
     && sp.goi.every(g => g.gia === null) && sp.gia_de_chot.kg === null, JSON.stringify(sp));
  l = await luu(UID.qlA, ng.kq.id, { gia_ban_kg: 600000, gia_ban_kg_cu: 500000 });
  ok('Sửa giá mỗi kg khi mặt hàng ngừng → từ chối', l.loi === 'Sản phẩm chưa gắn mặt hàng kho đang dùng, chưa sửa được giá mỗi kg.', vi(l));
  const ch = await chot(UID.chu, ng.kq.id);
  ok('Không giá nào (mặt hàng ngừng) → "Chưa có giá nào để chốt."', ch.loi === 'Chưa có giá nào để chốt.', vi(ch));

  // --- Mã FABi, mã vạch, giá riêng, trọng lượng
  sp = await doc(id.luat);
  const p200 = goiCua(sp, 200).id, p400 = goiCua(sp, 400).id, p600 = goiCua(sp, 600).id;
  const thu = async (goiMoi, idSp = id.luat) => luu(UID.qlA, idSp, { goi: goiMoi });
  for (const [ma, phai] of [
    ['12345', 'Mã FABi phải có ít nhất một chữ cái — mã toàn số dễ trùng mã cân.'],
    ['RIB 200', 'Mã FABi chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới, gạch ngang, tối đa 40 ký tự.'],
    ['SƯỜN-200', 'Mã FABi chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới, gạch ngang, tối đa 40 ký tự.'],
  ]) {
    l = await thu([{ id: p200, ma_fabi: ma }]);
    ok(`Mã FABi "${ma}" bị từ chối`, l.loi === phai, vi(l));
  }
  l = await thu([{ id: p200, ma_fabi: 'RIB-200' }, { id: p400, ma_fabi: 'RIB-400', ma_vach: '8930000000017' }]);
  ok('Mã FABi RIB-200, RIB-400 và mã vạch 13 số lưu được', l.kq?.ok === true, vi(l));
  l = await thu([{ id: goiCua(await doc(id.khay), 200).id, ma_fabi: 'RIB-200' }], id.khay);
  ok('Mã FABi đã dùng ở sản phẩm khác → từ chối, nêu mã', l.loi === 'Mã FABi RIB-200 đã dùng cho gói khác.', vi(l));
  l = await thu([{ id: p600, ma_fabi: 'RIB-400' }]);
  ok('Hai gói cùng sản phẩm cùng mã FABi → từ chối', l.loi === 'Mã FABi RIB-400 đã dùng cho gói khác.', vi(l));
  l = await thu([{ id: goiCua(await doc(id.khay), 200).id, ma_fabi: 'rib-200' }], id.khay);
  ok('Mã FABi phân biệt hoa thường (rib-200 khác RIB-200) — như ghép món iPOS', l.kq?.ok === true, vi(l));
  l = await thu([{ id: p600, ma_vach: '123' }]);
  ok('Mã vạch 3 số → từ chối', l.loi === 'Mã vạch phải gồm 8 đến 14 chữ số.', vi(l));
  l = await thu([{ id: p600, ma_vach: '8930000000017' }]);
  ok('Mã vạch trùng → từ chối, nêu mã', l.loi === 'Mã vạch 8930000000017 đã dùng cho gói khác.', vi(l));
  for (const [gia, phai] of [[1500, 'Giá gói phải tròn nghìn đồng.'], [500, 'Giá gói phải từ 1.000 đ đến 100.000.000 đ.'],
                             [100001000, 'Giá gói phải từ 1.000 đ đến 100.000.000 đ.'], ['190.000', 'Giá gói phải từ 1.000 đ đến 100.000.000 đ.']]) {
    l = await thu([{ id: p600, gia_rieng: gia }]);
    ok(`Giá riêng ${JSON.stringify(gia)} → ${phai}`, l.loi === phai, vi(l));
  }
  for (const soGam of [49, 5001, 200.5]) {
    l = await thu([{ id: p600, so_gam: soGam }]);
    ok(`Trọng lượng ${soGam} g → từ chối`, l.loi === 'Trọng lượng gói phải từ 50 đến 5.000 g.', vi(l));
  }
  l = await thu([{ gia_rieng: 300000 }]);
  ok('Gói mới thiếu trọng lượng → từ chối', l.loi === 'Trọng lượng gói phải từ 50 đến 5.000 g.', vi(l));
  l = await thu([{ id: p600, so_gam: 400 }]);
  ok('Hai gói cùng trọng lượng → "Hai gói cùng trọng lượng 400 g."', l.loi === 'Hai gói cùng trọng lượng 400 g.', vi(l));
  l = await thu([{ id: '00000000-0000-4000-8000-00000000beef', gia_rieng: 1000 }]);
  ok('id gói không có → "Không thấy gói này — tải lại trang."', l.loi === 'Không thấy gói này — tải lại trang.', vi(l));
  l = await thu([{ id: goiCua(await doc(id.khay), 200).id, gia_rieng: 1000 }]);
  ok('id gói của sản phẩm khác → cùng câu, không sửa được gói người khác', l.loi === 'Không thấy gói này — tải lại trang.', vi(l));
  // Khóa tạm của gói thêm trong cùng lần lưu ('moi-<thứ tự>') không phải id gói: phải bị từ chối bằng câu dịch được,
  // không lọt tới phép đổi ::uuid (lỗi Postgres thô 22P02), không lặng lẽ sửa / bỏ gói vừa thêm.
  const soGoiTruoc = (await doc(id.luat)).goi.length;
  l = await thu([{ so_gam: 300 }, { id: 'moi-1', xoa: true }]);
  ok('Gói mới + id giả "moi-1" (xoa) cùng lần → "Không thấy gói này — tải lại trang.", không lỗi Postgres thô',
     l.loi === 'Không thấy gói này — tải lại trang.', vi(l));
  l = await thu([{ so_gam: 300 }, { id: 'moi-1', gia_rieng: 300000 }]);
  ok('Gói mới + id giả "moi-1" (sửa) cùng lần → cùng câu, không lặng lẽ sửa gói vừa thêm',
     l.loi === 'Không thấy gói này — tải lại trang.', vi(l));
  l = await thu([{ id: crypto.randomUUID(), xoa: true }]);
  ok('uuid ngẫu nhiên (xoa) → cùng câu', l.loi === 'Không thấy gói này — tải lại trang.', vi(l));
  l = await thu([{ id: p600, xoa: true }, { id: p600, gia_rieng: 1000 }]);
  ok('Cùng một gói vừa bỏ rồi lại sửa trong một lần → cùng câu', l.loi === 'Không thấy gói này — tải lại trang.', vi(l));
  ok('…không lần nào ghi: không gói 300 g, số gói nguyên, gói 600 g còn', !goiCua(await doc(id.luat), 300)
     && (await doc(id.luat)).goi.length === soGoiTruoc && !!goiCua(await doc(id.luat), 600));
  l = await thu([{ id: p600, gia: 1000 }]);
  ok('Ô lạ trong gói → "Không nhận ô "gia" — tải lại trang."', l.loi === 'Không nhận ô "gia" — tải lại trang.', vi(l));
  l = await luu(UID.qlA, id.luat, { ten: 'X' });
  ok('Ô lạ của sản phẩm → từ chối, không lặng lẽ "lưu" mà không lưu gì', l.loi === 'Không nhận ô "ten" — tải lại trang.', vi(l));
  l = await luu(UID.qlA, id.luat, { kenh_web: 'co' });
  ok('Có / Không phải là boolean', l.loi === 'Ô "kenh_web" phải là Có hoặc Không.', vi(l));
  l = await thu(Array.from({ length: 21 }, (_, i) => ({ so_gam: 1000 + i * 10 })));
  ok('Quá 20 gói → từ chối', l.loi === 'Một sản phẩm có tối đa 20 gói.', vi(l));

  // --- Bỏ gói chỉ khi nói rõ; đổi chỗ trọng lượng
  l = await thu([]);
  ok('Danh sách gói rỗng → gói đang có GIỮ NGUYÊN (bỏ phải nói rõ)', l.kq?.ok === true && (await doc(id.luat)).goi.length === 3, vi(l));
  l = await thu([{ id: p600, xoa: true }]);
  ok('xoa: true → bỏ gói 600 g, trả trong da_bo', l.kq?.ok === true && giongNhau(l.kq?.da_bo, [{ so_gam: 600, ma_fabi: null }])
     && !goiCua(await doc(id.luat), 600), vi(l));
  l = await thu([{ id: p400, xoa: true }]);
  ok('Bỏ gói có mã FABi → da_bo kèm mã (để nhắc tắt món trên FABi)', giongNhau(l.kq?.da_bo, [{ so_gam: 400, ma_fabi: 'RIB-400' }]), vi(l));
  l = await thu([{ so_gam: 400, ma_fabi: 'RIB-400' }]);
  ok('Mã của gói vừa bỏ dùng lại được cho gói mới', l.kq?.ok === true, vi(l));
  const p400b = goiCua(await doc(id.luat), 400).id;
  l = await thu([{ id: p200, so_gam: 400, ma_fabi: 'RIB-400' }, { id: p400b, so_gam: 200, ma_fabi: 'RIB-200' }]);
  sp = await doc(id.luat);
  ok('Đổi chỗ trọng lượng và mã FABi giữa hai gói trong một lần lưu → được (ràng buộc hoãn tới cuối hàm)',
     l.kq?.ok === true && goiCua(sp, 400)?.id === p200 && goiCua(sp, 400)?.ma_fabi === 'RIB-400'
     && goiCua(sp, 200)?.id === p400b && goiCua(sp, 200)?.ma_fabi === 'RIB-200', vi(l));

  // --- Giá mỗi kg
  const mhTruoc = (await doc(id.luat)).mat_hang_id;
  l = await luu(UID.qlA, id.luat, { mat_hang_id: mh.dat, gia_ban_kg: 1000000, gia_ban_kg_cu: 950000 });
  ok('Đổi mặt hàng kho và giá mỗi kg cùng lần → "Lưu mặt hàng kho trước, rồi mới sửa giá mỗi kg."',
     l.loi === 'Lưu mặt hàng kho trước, rồi mới sửa giá mỗi kg.' && (await doc(id.luat)).mat_hang_id === mhTruoc, vi(l));
  for (const [gia, phai] of [[999, 'Giá mỗi kg phải từ 1.000 đ.'], ['abc', 'Giá mỗi kg phải từ 1.000 đ.'],
                             [950000.5, 'Giá mỗi kg phải từ 1.000 đ.'], [100000001, 'Giá mỗi kg tối đa 100.000.000 đ.']]) {
    l = await luu(UID.qlA, id.luat, { gia_ban_kg: gia, gia_ban_kg_cu: 950000 });
    ok(`Giá mỗi kg ${JSON.stringify(gia)} → ${phai}`, l.loi === phai, vi(l));
  }
  const dt = await tao(UID.qlA, 'luat-than-dac-biet', 'Thăn đặc biệt');
  id.dat = dt.kq.id;
  l = await luu(UID.qlA, id.dat, { mat_hang_id: mh.dat });
  ok('Mặt hàng có mã cân, giá 1.050.000 đ/kg → cảnh báo gia_qua_can (cân vẫn in giá cũ)', coCanh(l.kq, 'gia_qua_can'), vi(l));
  l = await luu(UID.qlA, id.dat, { gia_ban_kg: 990000, gia_ban_kg_cu: 1050000 });
  ok('Hạ giá về 990.000 → ghi vào Kho → Mặt hàng, gia_kho_doi, hết gia_qua_can',
     l.kq?.ok === true && l.kq?.gia_kho_doi === true && !coCanh(l.kq, 'gia_qua_can') && (await giaKho(mh.dat)) === 990000
     && l.kq?.mat_hang?.gia_ban_kg === 990000, vi(l));
  ok('Kết quả lưu đúng các khóa: ok, updated_at, gia_kho_doi, da_bo, canh_bao, mat_hang',
     Object.keys(l.kq ?? {}).sort().join(',') === 'canh_bao,da_bo,gia_kho_doi,mat_hang,ok,updated_at', Object.keys(l.kq ?? {}).join(','));
  l = await luu(UID.qlA, id.dat, { gia_ban_kg: 1050000, gia_ban_kg_cu: 990000 });
  ok('Lưu giá 1.050.000 → được, nhưng cảnh báo gia_qua_can', l.kq?.ok === true && coCanh(l.kq, 'gia_qua_can'), vi(l));
  l = await luu(UID.qlA, id.dat, { gia_ban_kg: 1050000, gia_ban_kg_cu: 1050000 });
  ok('Lưu lại đúng giá đang có → gia_kho_doi false', l.kq?.ok === true && l.kq?.gia_kho_doi === false, vi(l));
  // Beeftown Cân (can-tma.ts kiemHang) bỏ qua dòng giá trống, giá 0 và giá quá 999.999 — cả ba thì cân GIỮ dòng cũ.
  // Hai trạng thái, hai mã: chua_gia_can (trống / ≤ 0), gia_qua_can (chỉ khi > 999.999) — trang không phải đoán.
  mh.chuaGia = await matHang('CHUA-GIA', 'Thăn chưa có giá', { maCan: '1008' });
  const chuaGia = (await tao(UID.qlA, 'luat-chua-gia', 'Thăn chưa có giá')).kq.id;
  l = await luu(UID.qlA, chuaGia, { mat_hang_id: mh.chuaGia });
  ok('Mặt hàng có mã cân mà CHƯA có giá mỗi kg → cảnh báo chua_gia_can, KHÔNG gia_qua_can (mã đó chỉ cho giá quá 999.999)',
     l.kq?.ok === true && coCanh(l.kq, 'chua_gia_can') && !coCanh(l.kq, 'gia_qua_can') && coCanh(await doc(chuaGia), 'chua_gia_can'), vi(l));
  await db.query(`update kho_mat_hang set gia_ban_kg = 0 where id = $1`, [mh.chuaGia]);
  ok('…giá 0 đ → cũng chua_gia_can, không gia_qua_can', coCanh(await doc(chuaGia), 'chua_gia_can') && !coCanh(await doc(chuaGia), 'gia_qua_can'),
     JSON.stringify((await doc(chuaGia)).canh_bao));
  await db.query(`update kho_mat_hang set gia_ban_kg = 1050000 where id = $1`, [mh.chuaGia]);
  ok('…giá 1.050.000 → gia_qua_can, không chua_gia_can', coCanh(await doc(chuaGia), 'gia_qua_can') && !coCanh(await doc(chuaGia), 'chua_gia_can'),
     JSON.stringify((await doc(chuaGia)).canh_bao));
  await db.query(`update kho_mat_hang set gia_ban_kg = 990000 where id = $1`, [mh.chuaGia]);
  ok('…giá 990.000 → không còn mã nào trong hai mã', !coCanh(await doc(chuaGia), 'gia_qua_can') && !coCanh(await doc(chuaGia), 'chua_gia_can'));

  // --- Chốt khi giá vừa đổi
  sp = await doc(id.luat);
  const daXem = sp.gia_de_chot;
  await db.query(`update kho_mat_hang set gia_ban_kg = 970000 where id = $1`, [mh.ribeye]);
  const cv = await chot(UID.chu, id.luat, { gia: daXem });
  const spSau = await doc(id.luat);
  ok('Giá đổi ở Kho sau khi trang hiện → gia_vua_doi kèm ảnh chụp mới, không ghi',
     cv.kq?.ok === false && cv.kq?.ly_do === 'gia_vua_doi' && cv.kq?.gia?.kg === 970000
     && giongNhau(spSau.gia_chot, sp.gia_chot), vi(cv));
  await db.query(`update kho_mat_hang set gia_ban_kg = 950000 where id = $1`, [mh.ribeye]);

  // --- Danh sách: cột, thứ tự
  const list = (await danhSach(UID.chu)).kq;
  ok('Danh sách không trả ma_gui, không trả ban_dich', list.every(x => !('ma_gui' in x) && !('ban_dich' in x)));
  const mot = (await goi(UID.chu, `select ban_le_danh_sach(null, $1) as r`, [id.luat])).kq;
  ok('Một sản phẩm (p_id) trả kèm ban_dich', mot.length === 1 && 'ban_dich' in mot[0] && !('ma_gui' in mot[0]));
  const khong = (await goi(UID.chu, `select ban_le_danh_sach(null, $1) as r`, ['00000000-0000-4000-8000-00000000cafe'])).kq;
  ok('p_id không có → []', Array.isArray(khong) && khong.length === 0, JSON.stringify(khong));
  const viTriKimChi = list.findIndex(x => x.loai === 'kim_chi');
  ok('Thịt bò đứng trước kim chi', viTriKimChi > 0 && list.slice(viTriKimChi).every(x => x.loai === 'kim_chi'),
     list.map(x => x.loai).join(','));

  // --- Trigger và bảng
  const doiMa = await phaiLoi(`update ban_le_san_pham set ma = 'doi-ma' where id = $1`, [id.luat]);
  ok('Mã sản phẩm không đổi được sau khi tạo (kể cả superuser)', doiMa === 'Mã sản phẩm không đổi được sau khi tạo.', doiMa ?? 'đổi được');
  const goiLa = await phaiLoi(`insert into ban_le_goi (san_pham_id, so_gam, mat_hang_id) values ($1, 900, gen_random_uuid())`, [id.luat]);
  ok('Gói gắn mặt hàng kho không có → trigger từ chối', goiLa === 'Không thấy mặt hàng kho này.', goiLa ?? 'chèn được');
  const { rows: [fk] } = await db.query(`select count(*)::int n from pg_constraint
    where contype = 'f' and conrelid in ('ban_le_san_pham'::regclass, 'ban_le_goi'::regclass) and confrelid::regclass::text like 'kho\\_%'`);
  ok('Không khóa ngoại nào từ bảng bán lẻ sang bảng kho_* (script dọn kho truncate không cascade)', fk.n === 0, `${fk.n}`);
});

// ===========================================================================
await nhom('6 · ĐỐI CHIẾU FABi — chi nhánh Q7', async () => {
  const cn = cnB.id;
  mh.dc = await matHang('DC-THAN', 'Thăn ngoại', { gia: 900000, maCan: '2001' });
  mh.dc2 = await matHang('DC-NAC', 'Nạc vai', { gia: 700000, maCan: '2002' });
  mh.dcKhay = await matHang('DC-LOI-VAI', 'Lõi vai', { gia: 650000, maCan: '2003' });
  mh.dcHop = await matHang('DC-KIMCHI', 'Kim chi hộp đối chiếu', { demGoi: true, donVi: 'hộp' });

  const sanPham = async (ma, ten, duLieu, loai = 'thit', cach = 'theo_can') => {
    const t = await tao(UID.qlB, ma, ten, loai, cach);
    if (duLieu) {
      const l = await luu(UID.qlB, t.kq.id, duLieu);
      if (l.loi || l.kq?.ok !== true) throw new Error(`${ma}: ${vi(l)}`);
    }
    return t.kq.id;
  };
  id.p1 = await sanPham('dc-than-ngoai', 'Thăn ngoại đối chiếu', { mat_hang_id: mh.dc, trang_thai: 'dang_ban' });
  let sp = await doc(id.p1);
  await luu(UID.qlB, id.p1, { goi: [{ id: goiCua(sp, 200).id, ma_fabi: 'TN-200' }, { id: goiCua(sp, 400).id, ma_fabi: 'TN-400' }] });
  await chot(UID.chu, id.p1);
  id.p2 = await sanPham('dc-nac-vai', 'Nạc vai đối chiếu', { mat_hang_id: mh.dc2, trang_thai: 'dang_ban' });
  sp = await doc(id.p2);
  await luu(UID.qlB, id.p2, { goi: [{ id: goiCua(sp, 200).id, ma_fabi: 'NV-200' }] });
  id.p3 = await sanPham('dc-tam-ngung', 'Tạm ngưng đối chiếu', { mat_hang_id: mh.dcKhay });
  sp = await doc(id.p3);
  await luu(UID.qlB, id.p3, { goi: [{ id: goiCua(sp, 200).id, ma_fabi: 'TAM-200' }] });
  id.p4 = await sanPham('dc-loi-vai', 'Lõi vai đối chiếu', { mat_hang_id: mh.dcKhay, trang_thai: 'dang_ban' });
  sp = await doc(id.p4);
  await luu(UID.qlB, id.p4, { goi: [{ id: goiCua(sp, 200).id, ma_fabi: 'KH-200' }, { id: goiCua(sp, 400).id, dang_ban: false }] });
  id.p5 = await sanPham('dc-kim-chi', 'Kim chi đối chiếu', null, 'kim_chi', 'theo_hop');
  await luu(UID.qlB, id.p5, { trang_thai: 'dang_ban', goi: [{ so_gam: 500, gia_rieng: 120000, ma_fabi: 'KC-500', mat_hang_id: mh.dcHop }] });
  await chot(UID.chu, id.p5);

  const tim = (kq, f) => kq?.dong?.find(f);
  const goiDong = (kq, ma) => tim(kq, d => d.loai_dong === 'goi' && d.ma_fabi === ma);

  // Chưa nối iPOS ở Q7: thực đơn chưa từng đọc
  let r = await doiChieu(UID.qlB, cn);
  let can = tim(r.kq, d => d.loai_dong === 'can' && d.ma_can === '2001');
  ok('Thực đơn chưa đọc → đầu trang menu_cu, bat false, menu_luc null, 0 món',
     r.kq?.menu_cu === true && r.kq?.bat === false && r.kq?.menu_luc === null && r.kq?.so_mon_menu === 0, vi(r));
  ok('…dòng mã cân: menu_cu, KHÔNG nói "tạo món" (không suy từ dữ liệu cũ), không biết trên FABi (null)',
     can?.viec.includes('menu_cu') && !can.viec.includes('tao_mon') && can.tren_fabi === null, JSON.stringify(can));
  ok('…dòng gói TN-200: menu_cu, chưa ghép', goiDong(r.kq, 'TN-200')?.viec.includes('menu_cu')
     && goiDong(r.kq, 'TN-200')?.viec.includes('ghep') && !goiDong(r.kq, 'TN-200')?.viec.includes('tao_mon'),
     JSON.stringify(goiDong(r.kq, 'TN-200')));

  // Thực đơn vừa đọc
  await db.query(`insert into kho_ipos_cau_hinh (chi_nhanh_id, bat, menu_luc) values ($1, true, now())`, [cn]);
  for (const [ma, ten, ban] of [['02001', 'Thăn ngoại kg', true], ['2002', 'Nạc vai kg', true], ['TN-200', 'Thăn ngoại 200g', true],
                                ['TN-400', 'Thăn ngoại 400g', false], ['TAM-200', 'Tạm 200g', true], ['KH-200', 'Lõi vai 200g', true],
                                ['KC-500', 'Kim chi 500g', true], ['OLD-500', 'Thăn ngoại 500g cũ', true], ['20011', 'Thăn ngoại ô 1', true]]) {
    await db.query(`insert into kho_ipos_menu (chi_nhanh_id, ma_ipos, ten_ipos, dang_ban) values ($1, $2, $3, $4)`, [cn, ma, ten, ban]);
  }
  for (const [ma, kieu, mat, donVi, kg] of [['02001', 'mon', mh.dc, 'kg', null], ['2002', 'goi_can', null, null, null],
                                            ['TN-200', 'mon', mh.dc, 'goi', 0.2], ['TN-400', 'mon', mh.dc, 'goi', 0.5],
                                            ['KH-200', 'mon', mh.dcKhay, 'goi', 0.2], ['KC-500', 'mon', mh.dcHop, null, null],
                                            ['OLD-500', 'mon', mh.dc, 'goi', 0.5]]) {
    await db.query(`insert into kho_ipos_ma_hang (chi_nhanh_id, ma_ipos, kieu, mat_hang_id, don_vi_ban, kg_moi_don_vi)
                    values ($1, $2, $3, $4, $5, $6)`, [cn, ma, kieu, mat, donVi, kg]);
  }
  await db.query(`insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 1, '20011')`, [mh.dc]);
  await db.query(`insert into kho_ma_giam (mat_hang_id, phan_tram, ma_can) values ($1, 30, '90001')`, [mh.dc]);
  await db.query(`update kho_mat_hang set dem_goi = true where id = $1`, [mh.dcKhay]);   // đổi sang đếm khay SAU khi Đang bán

  r = await doiChieu(UID.qlB, cn);
  const d = r.kq;
  ok('Thực đơn mới: đầu trang menu_cu false, bat true, 9 món', d?.menu_cu === false && d?.bat === true && d?.so_mon_menu === 9
     && !!d?.menu_luc, vi(r));
  can = tim(d, x => x.loai_dong === 'can' && x.ma_can === '2001');
  ok('Mã cân 2001 khớp món FABi "02001" (FABi thêm số 0 đầu) — hiện mã FABi thật, ghép đúng, đã chốt → khop',
     can?.ma_fabi === '02001' && giongNhau(can?.viec, ['khop']) && can?.gia_phai_dat === 900000 && can?.tren_fabi?.co === true
     && can?.san_pham_id === id.p1, JSON.stringify(can));
  ok('…dòng mã cân mang ghép hiện tại và ghép mong đợi',
     can?.ghep?.kieu === 'mon' && can?.ghep?.don_vi_ban === 'kg' && can?.mong_doi?.don_vi_ban === 'kg'
     && can?.mong_doi?.mat_hang_ten === 'Thăn ngoại', JSON.stringify(can));
  const can2 = tim(d, x => x.loai_dong === 'can' && x.ma_can === '2002');
  ok('Mã cân ghép goi_can KHÔNG mặt hàng → sua_ghep (dòng FABi không mang mã cân, không bao giờ khớp); chưa chốt → dat_gia',
     can2?.viec.includes('sua_ghep') && can2?.viec.includes('dat_gia') && !can2?.viec.includes('khop'), JSON.stringify(can2));
  ok('Gói TN-200 (mon, đúng mặt hàng, theo gói, mỗi gói 0,2 kg, đã chốt) → khop',
     giongNhau(goiDong(d, 'TN-200')?.viec, ['khop']) && goiDong(d, 'TN-200')?.gia_phai_dat === 180000, JSON.stringify(goiDong(d, 'TN-200')));
  ok('Gói TN-400: món đang tắt trên FABi → bat_mon; ghép 0,5 kg cho gói 400 g → sua_ghep',
     goiDong(d, 'TN-400')?.viec.includes('bat_mon') && goiDong(d, 'TN-400')?.viec.includes('sua_ghep')
     && goiDong(d, 'TN-400')?.mong_doi?.kg_moi_don_vi === 0.4, JSON.stringify(goiDong(d, 'TN-400')));
  ok('Gói NV-200: chưa có trên FABi → tao_mon, chưa ghép → ghep',
     goiDong(d, 'NV-200')?.viec.includes('tao_mon') && goiDong(d, 'NV-200')?.viec.includes('ghep')
     && goiDong(d, 'NV-200')?.tren_fabi?.co === false, JSON.stringify(goiDong(d, 'NV-200')));
  const nv400 = tim(d, x => x.loai_dong === 'goi' && x.san_pham_id === id.p2 && x.so_gam === 400);
  ok('Gói chưa có mã FABi → chua_co_ma', nv400?.viec.includes('chua_co_ma') && nv400?.ma_fabi === null, JSON.stringify(nv400));
  ok('Sản phẩm Tạm ngưng mà FABi còn bán TAM-200 → tat_mon', giongNhau(goiDong(d, 'TAM-200')?.viec, ['tat_mon']),
     JSON.stringify(goiDong(d, 'TAM-200')));
  ok('Mặt hàng đổi sang đếm khay sau khi Đang bán → KH-200 khay_nguyen thay cho khop',
     goiDong(d, 'KH-200')?.viec.includes('khay_nguyen') && !goiDong(d, 'KH-200')?.viec.includes('khop')
     && !goiDong(d, 'KH-200')?.viec.includes('sua_ghep'), JSON.stringify(goiDong(d, 'KH-200')));
  ok('Gói ngưng bán chưa có trên FABi → không có dòng (không việc gì)',
     !tim(d, x => x.loai_dong === 'goi' && x.san_pham_id === id.p4 && x.so_gam === 400));
  ok('Hộp kim chi KC-500 (mon, mặt hàng hộp, theo món kho, đã chốt) → khop, giá 120.000',
     giongNhau(goiDong(d, 'KC-500')?.viec, ['khop']) && goiDong(d, 'KC-500')?.gia_phai_dat === 120000, JSON.stringify(goiDong(d, 'KC-500')));
  const cu = tim(d, x => x.loai_dong === 'kiem_tra');
  ok('FABi đang bán OLD-500 trừ cùng mặt hàng theo gói, menu bán lẻ không có → kiem_tra_mon (xem lại, không ra lệnh tắt)',
     cu?.ma_fabi === 'OLD-500' && giongNhau(cu?.viec, ['kiem_tra_mon']) && cu?.san_pham_id === null, JSON.stringify(cu));
  const oMa = tim(d, x => x.loai_dong === 'o_ma');
  ok('Ô mã 20011 của mặt hàng: có trên FABi, giá = giá mỗi kg 900.000, đã chốt → khop (chưa ghép vẫn đúng)',
     oMa?.ma_can === '20011' && oMa?.so_o === 1 && oMa?.gia_phai_dat === 900000 && giongNhau(oMa?.viec, ['khop']), JSON.stringify(oMa));
  const giam = tim(d, x => x.loai_dong === 'ma_giam');
  ok('Mã giảm 90001 (-30%): giá kho_gia_giam = 630.000, chưa có trên FABi → tao_mon',
     giam?.ma_can === '90001' && giam?.phan_tram === 30 && giam?.gia_phai_dat === 630000 && giongNhau(giam?.viec, ['tao_mon']),
     JSON.stringify(giam));
  ok('Mọi dòng đủ khóa', d.dong.every(x => ['loai_dong', 'ma_fabi', 'ten_san_pham', 'san_pham_id', 'so_gam', 'gia_phai_dat',
    'tren_fabi', 'ghep', 'mong_doi', 'viec', 'ma_can', 'so_o', 'phan_tram', 'don_vi'].every(k => k in x)));
  ok('don_vi của dòng: gói thịt "goi", hộp kim chi "hop" (trang ghi "gói 200 g" / "hộp 500 g"); mã cân, ô mã, mã giảm, kiểm tra null',
     goiDong(d, 'TN-200')?.don_vi === 'goi' && goiDong(d, 'KC-500')?.don_vi === 'hop' && goiDong(d, 'TAM-200')?.don_vi === 'goi'
     && d.dong.filter(x => x.loai_dong !== 'goi').every(x => x.don_vi === null),
     JSON.stringify(d.dong.map(x => [x.loai_dong, x.ma_fabi, x.don_vi])));

  // Giá đổi ở Kho sau khi chốt
  await db.query(`update kho_mat_hang set gia_ban_kg = 950000 where id = $1`, [mh.dc]);
  r = await doiChieu(UID.qlB, cn);
  can = tim(r.kq, x => x.loai_dong === 'can' && x.ma_can === '2001');
  ok('Giá mỗi kg đổi sau lần chốt → mã cân dat_gia 950.000, không còn khop',
     giongNhau(can?.viec, ['dat_gia']) && can?.gia_phai_dat === 950000, JSON.stringify(can));
  ok('…gói TN-200 dat_gia 190.000; ô mã dat_gia; mã giảm 665.000',
     goiDong(r.kq, 'TN-200')?.viec.includes('dat_gia') && goiDong(r.kq, 'TN-200')?.gia_phai_dat === 190000
     && tim(r.kq, x => x.loai_dong === 'o_ma')?.viec.includes('dat_gia')
     && tim(r.kq, x => x.loai_dong === 'ma_giam')?.gia_phai_dat === 665000, JSON.stringify(goiDong(r.kq, 'TN-200')));
  await db.query(`update kho_mat_hang set gia_ban_kg = 1050000 where id = $1`, [mh.dc]);
  r = await doiChieu(UID.qlB, cn);
  ok('Giá mỗi kg 1.050.000 → mã cân và ô mã gia_qua_can',
     tim(r.kq, x => x.loai_dong === 'can' && x.ma_can === '2001')?.viec.includes('gia_qua_can')
     && tim(r.kq, x => x.loai_dong === 'o_ma')?.viec.includes('gia_qua_can'));
  await db.query(`update kho_mat_hang set gia_ban_kg = 900000 where id = $1`, [mh.dc]);

  // Thực đơn cũ: ba lý do
  for (const [moTa, sql] of [
    ['iPOS báo thực đơn vừa đổi (menu_can_lam_moi)', `update kho_ipos_cau_hinh set menu_can_lam_moi = true where chi_nhanh_id = $1`],
    ['đọc đã quá 2 giờ', `update kho_ipos_cau_hinh set menu_luc = now() - interval '3 hours' where chi_nhanh_id = $1`],
    ['đồng bộ đang tắt', `update kho_ipos_cau_hinh set bat = false where chi_nhanh_id = $1`],
  ]) {
    await db.query(sql, [cn]);
    r = await doiChieu(UID.qlB, cn);
    const nv = goiDong(r.kq, 'NV-200');
    const tn = goiDong(r.kq, 'TN-400');
    ok(`Thực đơn cũ vì ${moTa} → menu_cu, không tao_mon / bat_mon`, r.kq?.menu_cu === true
       && nv?.viec.includes('menu_cu') && !nv?.viec.includes('tao_mon') && tn?.viec.includes('menu_cu') && !tn?.viec.includes('bat_mon'),
       JSON.stringify([nv?.viec, tn?.viec]));
    await db.query(`update kho_ipos_cau_hinh set menu_can_lam_moi = false, menu_luc = now(), bat = true where chi_nhanh_id = $1`, [cn]);
  }
  const chuR = await doiChieu(UID.chu, cn);
  ok('Chủ đối chiếu Q7 ra cùng số dòng như quản lý Q7', chuR.kq?.dong?.length === (await doiChieu(UID.qlB, cn)).kq?.dong?.length);
});

// ===========================================================================
await nhom('6b · ĐỐI CHIẾU FABi — mục "kiểm tra" không bảo tắt mã mà mục khác đòi; giá mỗi kg trống không bao giờ "khớp"', async () => {
  const cn = cnB.id;   // thực đơn FABi vừa đọc (nhóm 6)
  const sanPham = async (ma, ten, duLieu) => {
    const t = await tao(UID.qlB, ma, ten);
    const l = await luu(UID.qlB, t.kq.id, duLieu);
    if (l.loi || l.kq?.ok !== true) throw new Error(`${ma}: ${vi(l)}`);
    return t.kq.id;
  };
  const themMenu = async ds => {
    for (const ma of ds) {
      await db.query(`insert into kho_ipos_menu (chi_nhanh_id, ma_ipos, ten_ipos, dang_ban) values ($1, $2, $3, true)`, [cn, ma, `Món ${ma}`]);
    }
  };
  const ghep = async ds => {
    for (const [ma, mat, donVi, oMa] of ds) {
      await db.query(`insert into kho_ipos_ma_hang (chi_nhanh_id, ma_ipos, kieu, mat_hang_id, don_vi_ban, o_ma_id)
                      values ($1, $2, 'mon', $3, $4, $5)`, [cn, ma, mat, donVi, oMa]);
    }
  };

  // --- Mặt hàng ĐẾM KHAY có mã cân: mục mã cân đòi mã đó (sửa ghép sang bán theo kg), mục kiểm tra không được
  // bảo tắt chính mã đó. Ô mã, mã giảm của mặt hàng cũng vậy.
  mh.f1 = await matHang('F1-BAP-KHAY', 'Bắp khay đối chiếu', { demGoi: true, donVi: 'khay', gia: 600000, maCan: '2101' });
  await sanPham('dc-f1-bap-khay', 'Bắp khay đối chiếu', { mat_hang_id: mh.f1 });   // Tạm ngưng: không có dòng gói
  const { rows: [oMa] } = await db.query(`insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 1, '21011') returning id`, [mh.f1]);
  await db.query(`insert into kho_ma_giam (mat_hang_id, phan_tram, ma_can) values ($1, 20, '92101')`, [mh.f1]);
  await themMenu(['02101', '21011', 'O-21', '92101', 'F1-KG', 'F1-OLD']);
  await ghep([
    ['02101', mh.f1, null, null],      // mã cân (FABi thêm số 0 đầu), "theo món kho" = theo khay → mục mã cân: sua_ghep
    ['21011', mh.f1, null, oMa.id],    // ô mã đã ghép
    ['O-21', mh.f1, null, oMa.id],     // mã khác ghép vào ô mã
    ['92101', mh.f1, null, null],      // mã giảm ghép "theo món kho"
    ['F1-KG', mh.f1, 'kg', null],      // bán theo kg
    ['F1-OLD', mh.f1, 'goi', null],    // gói cũ thật sự, menu bán lẻ không có
  ]);
  let r = await doiChieu(UID.qlB, cn);
  const kiemTra = (r.kq?.dong ?? []).filter(x => x.loai_dong === 'kiem_tra');
  const maKiemTra = kiemTra.map(x => x.ma_fabi);
  const dongMaCan = (r.kq?.dong ?? []).filter(x => x.ma_fabi === '02101');
  ok('Mã cân 2101 của mặt hàng đếm khay, ghép "theo món kho" → đúng MỘT dòng: dòng mã cân với sua_ghep (không thêm dòng kiem_tra bảo tắt)',
     dongMaCan.length === 1 && dongMaCan[0].loai_dong === 'can' && dongMaCan[0].viec.includes('sua_ghep'), JSON.stringify(dongMaCan));
  ok('Ô mã 21011 đã ghép (o_ma_id) → không dòng kiem_tra', !maKiemTra.includes('21011'), maKiemTra.join(', '));
  ok('Mã khác ghép vào ô mã (O-21, o_ma_id) → không dòng kiem_tra', !maKiemTra.includes('O-21'), maKiemTra.join(', '));
  ok('Mã giảm 92101 ghép "theo món kho" → không dòng kiem_tra (mục mã giảm đòi mã này)',
     !maKiemTra.includes('92101') && (r.kq?.dong ?? []).some(x => x.loai_dong === 'ma_giam' && x.ma_can === '92101'), maKiemTra.join(', '));
  ok('Ghép bán theo kg (F1-KG) → không dòng kiem_tra', !maKiemTra.includes('F1-KG'), maKiemTra.join(', '));
  ok('Gói cũ thật sự (F1-OLD, bán theo gói, menu không có) → vẫn kiem_tra_mon',
     giongNhau(kiemTra.find(x => x.ma_fabi === 'F1-OLD')?.viec, ['kiem_tra_mon']), JSON.stringify(kiemTra));
  ok('Dòng kiem_tra còn lại đúng hai gói cũ: F1-OLD, OLD-500', giongNhau([...maKiemTra].sort(), ['F1-OLD', 'OLD-500']), maKiemTra.join(', '));

  // --- Chỉ loại ĐÚNG những mã các dòng ở trên đòi (mã cân, ô mã, mã giảm ĐANG DÙNG của mặt hàng dùng được của sản
  // phẩm theo cân). Mã giảm đã tắt, mã cân của mặt hàng ngừng dùng, mã cân của mặt hàng hộp không dòng nào đòi —
  // FABi còn bán chúng theo gói, trừ mặt hàng của menu, thì vẫn phải xem lại.
  await db.query(`insert into kho_ma_giam (mat_hang_id, phan_tram, ma_can, dang_dung) values ($1, 30, '92102', false)`, [mh.f1]);
  mh.f1Ngung = await matHang('F1-NGUNG', 'Bắp đã ngừng', { gia: 500000, maCan: '2401', dangDung: false });
  await sanPham('dc-f1-ngung', 'Bắp đã ngừng đối chiếu', { mat_hang_id: mh.f1Ngung });
  mh.f1Hop = await matHang('F1-KC-HOP', 'Kim chi hộp có mã cân', { demGoi: true, donVi: 'hộp', maCan: '2501' });
  const kcF1 = (await tao(UID.qlB, 'dc-f1-kim-chi', 'Kim chi có mã cân', 'kim_chi', 'theo_hop')).kq.id;
  const lKc = await luu(UID.qlB, kcF1, { goi: [{ so_gam: 500, gia_rieng: 120000, mat_hang_id: mh.f1Hop, ma_fabi: 'F1-KC-500' }] });
  if (lKc.loi || lKc.kq?.ok !== true) throw new Error(`dc-f1-kim-chi: ${vi(lKc)}`);
  await themMenu(['92102', '2401', '2501']);
  await ghep([['92102', mh.f1, 'goi', null], ['2401', mh.f1Ngung, 'goi', null], ['2501', mh.f1Hop, null, null]]);
  r = await doiChieu(UID.qlB, cn);
  const kiemTra2 = (r.kq?.dong ?? []).filter(x => x.loai_dong === 'kiem_tra');
  const coKiemTra = ma => giongNhau(kiemTra2.find(x => x.ma_fabi === ma)?.viec, ['kiem_tra_mon']);
  ok('Mã giảm ĐÃ TẮT (92102) mà FABi còn bán theo gói, trừ mặt hàng của menu → vẫn kiem_tra_mon (mục mã giảm không đòi nó)',
     coKiemTra('92102') && !(r.kq?.dong ?? []).some(x => x.loai_dong === 'ma_giam' && x.ma_can === '92102'), JSON.stringify(kiemTra2.map(x => x.ma_fabi)));
  ok('Mã cân của mặt hàng NGỪNG dùng (2401) ghép theo gói → vẫn kiem_tra_mon (không có dòng mã cân cho mặt hàng ngừng)',
     coKiemTra('2401') && !(r.kq?.dong ?? []).some(x => x.loai_dong === 'can' && x.ma_can === '2401'), JSON.stringify(kiemTra2.map(x => x.ma_fabi)));
  ok('Mã cân của mặt hàng hộp (2501, chỉ gắn qua hộp kim chi) → vẫn kiem_tra_mon',
     coKiemTra('2501'), JSON.stringify(kiemTra2.map(x => x.ma_fabi)));
  ok('…các mã mục khác đòi vẫn không bị liệt kê (02101, 21011, O-21, 92101)',
     !kiemTra2.some(x => ['02101', '21011', 'O-21', '92101'].includes(x.ma_fabi)), JSON.stringify(kiemTra2.map(x => x.ma_fabi)));

  // --- Giá mỗi kg TRỐNG (hay 0 đ): Beeftown Cân bỏ qua dòng, cân giữ hàng cũ. Đã chốt (kg null = null) vẫn không
  // bao giờ "khớp" — mã cân, ô mã, mã giảm đều thieu_gia.
  mh.f5 = await matHang('F5-NAM', 'Nạm chưa có giá', { maCan: '2201' });
  const f5 = await sanPham('dc-f5-nam', 'Nạm chưa có giá', { mat_hang_id: mh.f5 });
  await luu(UID.qlB, f5, { goi: [{ id: goiCua(await doc(f5), 200).id, gia_rieng: 100000 }] });
  const cF5 = await chot(UID.chu, f5);
  ok('Tiền đề: chốt được ảnh chụp {kg: null, goi: {200: 100.000}}', cF5.kq?.ok === true
     && giongNhau((await doc(f5)).gia_chot, { kg: null, goi: { 200: 100000 } }), vi(cF5));
  await db.query(`insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 1, '22011')`, [mh.f5]);
  await db.query(`insert into kho_ma_giam (mat_hang_id, phan_tram, ma_can) values ($1, 20, '92201')`, [mh.f5]);
  await themMenu(['2201', '22011', '92201']);
  await ghep([['2201', mh.f5, 'kg', null]]);
  r = await doiChieu(UID.qlB, cn);
  const dongF5 = loai => (r.kq?.dong ?? []).find(x => x.loai_dong === loai && ['2201', '22011', '92201'].includes(x.ma_can));
  ok('Mã cân 2201, giá mỗi kg trống, đã chốt, ghép đúng → thieu_gia (KHÔNG khop, không dat_gia)',
     giongNhau(dongF5('can')?.viec, ['thieu_gia']), JSON.stringify(dongF5('can')));
  ok('…ô mã 22011 → thieu_gia, không khop', giongNhau(dongF5('o_ma')?.viec, ['thieu_gia']), JSON.stringify(dongF5('o_ma')));
  ok('…mã giảm 92201 → thieu_gia, không khop', giongNhau(dongF5('ma_giam')?.viec, ['thieu_gia']), JSON.stringify(dongF5('ma_giam')));
  ok('Giá mỗi kg trống → gia_phai_dat null ở dòng mã cân, ô mã, mã giảm', ['can', 'o_ma', 'ma_giam'].every(x => dongF5(x)?.gia_phai_dat === null),
     JSON.stringify(['can', 'o_ma', 'ma_giam'].map(x => dongF5(x)?.gia_phai_dat)));
  await db.query(`update kho_mat_hang set gia_ban_kg = 0 where id = $1`, [mh.f5]);
  r = await doiChieu(UID.qlB, cn);
  ok('Giá 0 đ → thieu_gia (không phải gia_qua_can)', giongNhau(dongF5('can')?.viec, ['thieu_gia'])
     && giongNhau(dongF5('o_ma')?.viec, ['thieu_gia']), JSON.stringify([dongF5('can')?.viec, dongF5('o_ma')?.viec]));
  ok('Giá 0 đ → gia_phai_dat null (không bao giờ "đặt 0 đ/kg trên FABi") ở dòng mã cân, ô mã, mã giảm',
     ['can', 'o_ma', 'ma_giam'].every(x => dongF5(x)?.gia_phai_dat === null), JSON.stringify(['can', 'o_ma', 'ma_giam'].map(x => dongF5(x)?.gia_phai_dat)));
  await db.query(`update kho_mat_hang set gia_ban_kg = 1050000 where id = $1`, [mh.f5]);
  r = await doiChieu(UID.qlB, cn);
  ok('Giá 1.050.000 → gia_qua_can (giá đổi sau chốt → dat_gia), không thieu_gia',
     dongF5('can')?.viec.includes('gia_qua_can') && dongF5('can')?.viec.includes('dat_gia') && !dongF5('can')?.viec.includes('thieu_gia'),
     JSON.stringify(dongF5('can')));

  // --- Ô trống trong Ghép món (don_vi_ban, kg_moi_don_vi null) không được làm phép so "ghép đúng" ra NULL rồi bị
  // bỏ qua: gói cắt tại quầy ghép "theo món kho" (mặt hàng cân kg → iPOS trừ 1 kg mỗi gói) hay "theo gói" mà
  // thiếu "mỗi gói = … kg" (iPOS từ chối dòng bán, 0054) đều là sua_ghep.
  mh.f1b = await matHang('F1B-THAN', 'Thăn ghép thiếu ô', { gia: 900000, maCan: '2301' });
  const f1b = await sanPham('dc-f1b-than', 'Thăn ghép thiếu ô', { mat_hang_id: mh.f1b, trang_thai: 'dang_ban' });
  const spF1b = await doc(f1b);
  await luu(UID.qlB, f1b, { goi: [{ id: goiCua(spF1b, 200).id, ma_fabi: 'F1B-200' }, { id: goiCua(spF1b, 400).id, ma_fabi: 'F1B-400' }] });
  await themMenu(['F1B-200', 'F1B-400']);
  await ghep([['F1B-200', mh.f1b, null, null], ['F1B-400', mh.f1b, 'goi', null]]);
  r = await doiChieu(UID.qlB, cn);
  const goiF1b = ma => (r.kq?.dong ?? []).find(x => x.loai_dong === 'goi' && x.ma_fabi === ma);
  ok('Gói cắt tại quầy ghép "theo món kho" (don_vi_ban trống) trên mặt hàng cân kg → sua_ghep, không khop',
     goiF1b('F1B-200')?.viec.includes('sua_ghep') && !goiF1b('F1B-200')?.viec.includes('khop'), JSON.stringify(goiF1b('F1B-200')));
  ok('Gói cắt tại quầy ghép "theo gói" mà thiếu "mỗi gói = … kg" → sua_ghep, không khop',
     goiF1b('F1B-400')?.viec.includes('sua_ghep') && !goiF1b('F1B-400')?.viec.includes('khop'), JSON.stringify(goiF1b('F1B-400')));
  ok('…mã của hai gói đó không bị liệt kê thêm ở mục kiểm tra', !(r.kq?.dong ?? []).some(x => x.loai_dong === 'kiem_tra' && /^F1B-/.test(x.ma_fabi)));
});

// ===========================================================================
await nhom('7 · BẢN DỊCH (0036) — ba ô mới, máy dịch ghi dưới quyền người gọi', async () => {
  const { rows: [view] } = await db.query(`select coalesce(array_to_string(reloptions, ','), '') as o from pg_class where relname = 'v_viec_dich'`);
  ok('v_viec_dich vẫn là security_invoker sau khi viết lại', view.o.includes('security_invoker=true'), view.o);
  const { rows: cot } = await db.query(`select cot, nguon from cot_ban_dich() where bang = 'ban_le_san_pham' order by cot`);
  ok('cot_ban_dich có ba ô: cach_dung, mo_ta, ten', giongNhau(cot.map(c => `${c.cot}:${c.nguon}`),
     ['cach_dung:cach_dung_vi', 'mo_ta:mo_ta_vi', 'ten:ten_vi']), JSON.stringify(cot));

  const t = await tao(UID.qlA, 'dich-than-vai', 'Thăn vai bò Úc');
  id.dich = t.kq.id;
  await luu(UID.qlA, id.dich, { mo_ta_vi: 'Mềm, nhiều vân mỡ.', cach_dung_vi: 'Áp chảo hai phút mỗi mặt.' });
  const viec = async uid => {
    const r = await duoi(uid, `select cot || '/' || ngon_ngu as o, ly_do from v_viec_dich where dong_id = $1 order by 1`, [id.dich]);
    return r.loi ? r.loi : Object.fromEntries(r.rows.map(x => [x.o, x.ly_do]));
  };
  let v = await viec(UID.qlA);
  ok('Sản phẩm mới: v_viec_dich liệt kê đủ 6 ô (3 ô × en / ko), đều "thieu"',
     Object.keys(v).length === 6 && Object.values(v).every(x => x === 'thieu'), JSON.stringify(v));
  ok('Thủ kho đọc view: 0 ô (view đi qua RLS của bảng)', Object.keys(await viec(UID.thuKhoA)).length === 0);

  const bam = async t2 => (await db.query(`select bam_nguon($1) as b`, [t2])).rows[0].b;
  const ghi = (uid, muc) => duoi(uid, `select ghi_ban_dich('ban_le_san_pham', $1, $2::jsonb) as n`, [id.dich, JSON.stringify(muc)]);
  const pbTruoc = (await doc(id.dich)).updated_at;
  await nghi();
  let r = await ghi(UID.qlA, [{ cot: 'ten', ngon_ngu: 'en', bam: await bam('Thăn vai bò Úc'), tt: 'ok', noi_dung: 'Australian chuck eye' }]);
  let sp = (await goi(UID.chu, `select ban_le_danh_sach(null, $1) as r`, [id.dich])).kq[0];
  ok('Quản lý: ghi_ban_dich ghi được 1 ô, sổ ghi bản máy', r.rows?.[0]?.n === 1 && sp.ten_en === 'Australian chuck eye'
     && sp.ban_dich?.ten?.en?.cach === 'may', `${vi(r)} · ${JSON.stringify(sp.ban_dich)}`);
  ok('…máy dịch không đổi updated_at (phiên bản của form vẫn đúng)', sp.updated_at === pbTruoc, `${pbTruoc} → ${sp.updated_at}`);
  // Báo lỗi bị nghi: "máy dịch đẩy updated_at → lần lưu sau báo nguoi_khac_sua". Sai: 0036 tu_dong_cap_nhat_updated_at
  // thoát sớm khi beeftown.ghi_ban_dich = 'on'. Kiểm thử giữ điều đó mãi.
  const lSauDich = await luu(UID.qlA, id.dich, { mo_ta_vi: 'Mềm, nhiều vân mỡ.' }, pbTruoc);
  ok('…form mở TRƯỚC khi máy dịch ghi vẫn lưu được (phiên bản trước lúc dịch → ok:true, không nguoi_khac_sua)',
     lSauDich.loi === null && lSauDich.kq?.ok === true, vi(lSauDich));
  ok('…lần lưu đó không xóa bản máy dịch vừa ghi', (await doc(id.dich)).ten_en === 'Australian chuck eye');
  r = await ghi(UID.mktA, [{ cot: 'mo_ta', ngon_ngu: 'ko', bam: await bam('Mềm, nhiều vân mỡ.'), tt: 'ok', noi_dung: '부드럽고 마블링이 많아요.' }]);
  ok('Marketing: ghi_ban_dich ghi được 1 ô', r.rows?.[0]?.n === 1, vi(r));
  for (const [ai, uid] of [['Quản lý đã nghỉ', UID_QL_NGHI], ['Marketing đã nghỉ', UID_MKT_NGHI],
                           ['Tài khoản không có nhan_su', UID_LA], ['Thu ngân Q1', UID.thuNganA], ['Thủ kho Q1', UID.thuKhoA]]) {
    r = await ghi(uid, [{ cot: 'cach_dung', ngon_ngu: 'en', bam: await bam('Áp chảo hai phút mỗi mặt.'), tt: 'ok', noi_dung: 'Hacked' }]);
    ok(`${ai}: ghi_ban_dich ghi được 0 ô`, r.loi === null && r.rows?.[0]?.n === 0, vi(r));
  }
  ok('…ô cach_dung_en vẫn trống', (await doc(id.dich)).cach_dung_en === null);
  r = await duoi(UID.qlA, `select ghi_ban_dich('ban_le_goi', $1, '[]'::jsonb)`, [id.dich]);
  ok('ghi_ban_dich từ chối bảng gói (không trong danh sách)', r.loi === 'Bảng ban_le_goi không nhận bản dịch qua hàm này', vi(r));

  const l = await luu(UID.qlA, id.dich, { ten_ko: '호주산 척아이롤' });
  sp = (await goi(UID.chu, `select ban_le_danh_sach(null, $1) as r`, [id.dich])).kq[0];
  ok('Sửa tay ô tiếng Hàn qua ban_le_luu_san_pham → sổ ghi bản tay', l.kq?.ok === true && sp.ban_dich?.ten?.ko?.cach === 'tay',
     JSON.stringify(sp.ban_dich?.ten));
  await luu(UID.qlA, id.dich, { ten_vi: 'Thăn vai bò Úc thượng hạng' });
  v = await viec(UID.qlA);
  ok('Đổi tên tiếng Việt → ô tên phải dịch lại ("cu")', v['ten/en'] === 'cu' && v['ten/ko'] === 'cu', JSON.stringify(v));
});

// ===========================================================================
await nhom('8 · SỔ KHO KHỚP', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('kho_doi_soat_ton() rỗng', rows.length === 0, JSON.stringify(rows.slice(0, 3)));
});

process.exit(ketThuc('MENU BÁN LẺ'));
