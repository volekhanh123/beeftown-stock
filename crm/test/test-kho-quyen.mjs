/**
 * BEEFTOWN KHO — Kiểm thử phân quyền và tường ngăn CRM
 * ====================================================
 *
 *     node test/test-kho-quyen.mjs
 *
 * Ba câu hỏi, theo thứ tự quan trọng:
 *
 * 1. Thêm vai kho có làm lộ dữ liệu khách hàng không? (0018)
 *    Vai kho không được đọc, không được ghi bất kỳ bảng CRM nào — kể cả qua
 *    hàm definer như ghi_luot_ghe(). Bốn vai CRM cũ phải y như trước.
 * 2. Bảng tra quyền kho có đúng như chủ nhà hàng đã chốt không? Bản soi gương
 *    trong web (lib/kho/chung.ts) có khớp từng dòng với database không?
 * 3. Hàm nội bộ có lọt ra ngoài không? Liệt kê pg_proc chứ không thử từng
 *    hàm — thêm hàm mới mà quên phân loại là test đỏ ngay.
 */

import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';
import { QUYEN_KHO } from '../../web/src/lib/kho/chung.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ PHÂN QUYỀN');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();

// ---------------------------------------------------------------------------
// Dữ liệu CRM mẫu ở chi nhánh A: một khách đã ăn, một đặt bàn từ website,
// một chiến dịch. Đủ để mọi bảng CRM có dòng mà đếm.
// ---------------------------------------------------------------------------
await db.query(`insert into cau_hinh_tich_diem (chi_nhanh_id, dang_bat) values ($1, true)`, [cnA.id]);
for (let i = 1; i <= 4; i++) {
  await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1, $2, 4)`, [cnA.id, `B0${i}`]);
}
await db.query(`select * from ghi_luot_ghe($1, '0911111111', 320000::bigint)`, [cnA.id]);
const ngayKia = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
const datBan = await duoiAnon(
  `select * from tao_dat_ban('q1', '0922222222', 'Khách đặt web', $1::date, '18:00'::time, 2::smallint)`,
  [ngayKia]);

// Hai vai "máy" (0029): tablet dùng chung và máy đồng bộ iPOS. Tạo ở đây chứ
// không ở kho-chung.mjs để các file test khác không phải đếm thêm người.
const UID_MAY_CHUNG = '00000000-0000-4000-8000-0000000000c1';
const UID_MAY_IPOS  = '00000000-0000-4000-8000-0000000000c2';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam) values
  ($1, $3, 'Tablet quầy Q1', 'may_chung', true), ($2, $3, 'Máy iPOS Q1', 'may_ipos', true)`,
  [UID_MAY_CHUNG, UID_MAY_IPOS, cnA.id]);

const VAI_KHO_A = [
  ['thủ kho', UID.thuKhoA],
  ['NV quầy/bếp', UID.nvQuayA],
  ['kế toán', UID.keToanA],
  ['tablet dùng chung (may_chung)', UID_MAY_CHUNG],
  ['máy iPOS (may_ipos)', UID_MAY_IPOS],
];

// ===========================================================================
await nhom('1 · VAI KHO KHÔNG ĐỌC ĐƯỢC DỮ LIỆU CRM', async () => {
  ok('Website (anon) vẫn đặt bàn được — tường ngăn không chặn khách',
     datBan.loi === null && datBan.rows?.length === 1, datBan.loi ?? '');

  // Những bảng thương hiệu dùng chung, không chứa dữ liệu cá nhân — mọi nhân
  // sự đăng nhập đều đọc được từ trước khi có kho (0009–0012). Liệt kê ĐÍCH
  // DANH: bảng mới nào lọt vào danh sách này phải là quyết định có ý thức.
  const DUNG_CHUNG = new Set([
    'khung_anh', 'tep_anh', 'khoa_cong_bo', 'noi_dung_cong_bo', 'mon_an', 'nhom_mon',
    'mau_tin', 'chi_nhanh', 'nhan_su',
  ]);

  const { rows: bang } = await db.query(`
    select tablename from pg_tables
    where schemaname = 'public' and tablename not like 'kho\\_%'
    order by 1`);

  for (const [ten, uid] of VAI_KHO_A) {
    const lot = [];
    for (const { tablename } of bang) {
      if (DUNG_CHUNG.has(tablename)) continue;
      const r = await duoi(uid, `select count(*)::int as n from ${tablename}`);
      if (r.loi === null && r.rows[0].n > 0) lot.push(`${tablename}(${r.rows[0].n})`);
    }
    ok(`${ten} không đọc được dòng nào ở bảng CRM`, lot.length === 0, lot.join(', '));
  }

  // Hai bảng dùng chung có giới hạn riêng:
  for (const [ten, uid] of VAI_KHO_A) {
    const ns = await duoi(uid, `select count(*)::int as n from nhan_su`);
    ok(`${ten} chỉ thấy đúng hồ sơ của mình trong nhan_su`, ns.rows?.[0]?.n === 1,
       ns.loi ?? `thấy ${ns.rows?.[0]?.n}`);
    const cn = await duoi(uid, `select id from chi_nhanh`);
    const mongCn = /máy|tablet/.test(ten) ? 0 : 1;   // vai máy chưa có quyền "xem" kho
    ok(`${ten} ${mongCn ? 'chỉ thấy chi nhánh của mình' : 'không thấy chi nhánh nào'}`,
       cn.rows?.length === mongCn && (mongCn === 0 || cn.rows[0].id === cnA.id), cn.loi ?? `thấy ${cn.rows?.length}`);
  }

  // Vai máy (0029) chưa được làm gì trong kho: không đọc được bảng kho nào.
  const { rows: bangKho } = await db.query(`
    select tablename from pg_tables where schemaname = 'public' and tablename like 'kho\\_%' order by 1`);
  for (const [ten, uid] of VAI_KHO_A.filter(([t]) => /máy|tablet/.test(t))) {
    const lot = [];
    for (const { tablename } of bangKho) {
      const r = await duoi(uid, `select count(*)::int as n from ${tablename}`);
      if (r.loi === null && r.rows[0].n > 0) lot.push(`${tablename}(${r.rows[0].n})`);
    }
    ok(`${ten} không đọc được dòng nào ở bảng kho`, lot.length === 0, lot.join(', '));
    const dv = await duoi(uid, `select kho_dem_viec($1)`, [cnA.id]);
    ok(`${ten} không gọi được kho_dem_viec`, dv.loi !== null);
  }
});

// ===========================================================================
await nhom('2 · VAI KHO KHÔNG GHI ĐƯỢC CRM, KỂ CẢ QUA HÀM DEFINER', async () => {
  for (const [ten, uid] of VAI_KHO_A) {
    const diem = await duoi(uid, `select * from ghi_luot_ghe($1, '0933333333', 500000::bigint)`, [cnA.id]);
    ok(`${ten} KHÔNG tự phát được điểm qua ghi_luot_ghe()`,
       diem.loi !== null && /Tài khoản kho không được ghi/.test(diem.loi), diem.loi ?? 'GỌI ĐƯỢC');

    const khach = await duoi(uid, `select * from tim_hoac_tao_khach('0911111111', 'Đổi tên')`);
    ok(`${ten} KHÔNG đọc/sửa được khách qua tim_hoac_tao_khach()`,
       khach.loi !== null, khach.loi ?? `trả về ${JSON.stringify(khach.rows?.[0]?.ho_ten)}`);

    const ban = await duoi(uid,
      `insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach)
       select $1, id, $2::date, '19:00', 2 from khach_hang limit 1`, [cnA.id, ngayKia]);
    ok(`${ten} KHÔNG tạo được đặt bàn`, ban.loi !== null || ban.rows?.length === 0, ban.loi ?? '');
  }

  const { rows: [{ n }] } = await db.query(
    `select count(*)::int as n from khach_hang where sdt = '0933333333'`);
  ok('Không có khách nào được tạo ra bởi vai kho', n === 0);
});

// ===========================================================================
await nhom('3 · BỐN VAI CRM Y NHƯ TRƯỚC', async () => {
  const ql = await duoi(UID.qlA, `select count(*)::int as n from khach_hang`);
  ok('Quản lý Q1 vẫn thấy khách của Q1 (2 khách)', ql.rows?.[0]?.n === 2, ql.loi ?? `thấy ${ql.rows?.[0]?.n}`);

  const tn = await duoi(UID.thuNganA, `select * from ghi_luot_ghe($1, '0944444444', 300000::bigint)`, [cnA.id]);
  ok('Thu ngân Q1 vẫn ghi được lượt ghé', tn.loi === null, tn.loi ?? '');

  const mkt = await duoi(UID.mktA, `select count(*)::int as n from dat_ban`);
  ok('Marketing Q1 vẫn đọc được đặt bàn', mkt.rows?.[0]?.n >= 1, mkt.loi ?? '');

  const chu = await duoi(UID.chu, `select count(*)::int as n from chi_nhanh`);
  ok('Chủ nhà hàng vẫn thấy mọi chi nhánh', chu.rows?.[0]?.n === 2, chu.loi ?? '');

  const qlB = await duoi(UID.qlB, `select count(*)::int as n from khach_hang`);
  ok('Quản lý Q7 vẫn KHÔNG thấy khách Q1', qlB.rows?.[0]?.n === 0, qlB.loi ?? `thấy ${qlB.rows?.[0]?.n}`);
});

// ===========================================================================
await nhom('4 · BẢNG TRA QUYỀN KHO', async () => {
  const VAI = ['chu_so_huu', 'quan_ly', 'thu_kho', 'nhan_vien_quay', 'ke_toan', 'thu_ngan', 'marketing',
               'may_chung', 'may_ipos'];

  for (const viec of Object.keys(QUYEN_KHO)) {
    const { rows: [{ ds }] } = await db.query(`select kho_vai_duoc($1)::text[] as ds`, [viec]);
    const trongDb = [...ds].sort().join(',');
    const trongWeb = [...QUYEN_KHO[viec]].sort().join(',');
    ok(`"${viec}": web khớp database`, trongDb === trongWeb, `db=${trongDb} · web=${trongWeb}`);
  }

  const { rows: [{ ds: rong }] } = await db.query(`select kho_vai_duoc('viec_bia')::text[] as ds`);
  ok('Việc không có trong bảng → không vai nào được', rong.length === 0);

  // Đúng những gì chủ nhà hàng đã chốt:
  const chot = [
    ['nhan_vien_quay', 'xem', true],
    ['nhan_vien_quay', 'xem_gia', false],   // không thấy giá nhập, giá vốn
    ['nhan_vien_quay', 'van_hanh', true],
    ['nhan_vien_quay', 'pha_loc', false],
    ['thu_kho', 'nhap', true],
    ['thu_kho', 'duyet', false],            // phiếu nhập phải có người khác duyệt
    ['thu_kho', 'duyet_nhap', false],
    ['thu_kho', 'xem_gia', false],          // 0031: thủ kho chỉ chụp, cân, đếm — không thấy tiền
    ['thu_kho', 'pha_loc', true],
    ['ke_toan', 'ke_toan', true],
    ['ke_toan', 'nhap', false],
    ['ke_toan', 'duyet_nhap', true],        // 0031: kế toán điền giá và duyệt phiếu nhập
    ['ke_toan', 'duyet', false],            // nhưng không duyệt hủy hàng, kiểm kê
    ['nhan_vien_quay', 'duyet_nhap', false],
    ['quan_ly', 'cai_dat_goc', false],      // cách tính giá vốn: chỉ chủ
    ['chu_so_huu', 'cai_dat_goc', true],
    ['thu_ngan', 'xem', false],             // vai CRM thuần không dùng kho
    ['marketing', 'xem', false],
    ['may_chung', 'may_chung', true],       // 0034: chỉ để hàm kho_may_* nhận ra máy
    ['may_chung', 'xem', false],            // máy không đọc được gì trong kho
    ['chu_so_huu', 'may_chung', false],     // không người nào dùng được hàm của máy
    ['may_ipos', 'may_chung', false],
    ['may_ipos', 'dong_bo_ban', true],      // 0036: máy iPOS chỉ đồng bộ bán hàng
    ['may_ipos', 'xem', false],             // không đọc được gì trong kho
    ['may_ipos', 'xem_gia', false],
    ['quan_ly', 'dong_bo_ban', true],       // bấm "Cập nhật ngay"
    ['chu_so_huu', 'dong_bo_ban', true],
    ['nhan_vien_quay', 'dong_bo_ban', false],
    ['thu_kho', 'dong_bo_ban', false],
    ['ke_toan', 'dong_bo_ban', false],
    ['may_chung', 'dong_bo_ban', false],
  ];
  for (const [vai, viec, mong] of chot) {
    ok(`${vai} ${mong ? 'ĐƯỢC' : 'KHÔNG được'} "${viec}"`,
       QUYEN_KHO[viec].includes(vai) === mong);
  }
  const { rows: [{ n: soVai }] } = await db.query(`select count(*)::int as n from unnest(enum_range(null::vai_tro))`);
  ok('Bảng có đủ 9 vai để tra (khớp enum vai_tro)', VAI.length === 9 && soVai === 9, `enum có ${soVai}`);
  // Vai máy không được việc nào của người. Riêng việc may_chung (0034) chỉ có
  // đúng vai may_chung; việc dong_bo_ban (0036) là việc DUY NHẤT của may_ipos.
  for (const viec of Object.keys(QUYEN_KHO).filter(v => v !== 'may_chung' && v !== 'dong_bo_ban')) {
    ok(`Vai máy chưa được việc "${viec}"`,
       !QUYEN_KHO[viec].includes('may_chung') && !QUYEN_KHO[viec].includes('may_ipos'));
  }
  ok('Việc "may_chung" chỉ có vai may_chung',
     QUYEN_KHO.may_chung?.length === 1 && QUYEN_KHO.may_chung[0] === 'may_chung');
  ok('may_ipos có đúng MỘT việc: dong_bo_ban',
     Object.keys(QUYEN_KHO).filter(v => QUYEN_KHO[v].includes('may_ipos')).join() === 'dong_bo_ban');
  ok('Việc "dong_bo_ban": chủ, quản lý, may_ipos — không vai nhân viên nào khác',
     [...QUYEN_KHO.dong_bo_ban].sort().join() === 'chu_so_huu,may_ipos,quan_ly');
});

// ===========================================================================
await nhom('5 · QUYỀN THEO CHI NHÁNH', async () => {
  const chu = await duoi(UID.chu, `select kho_cn_duoc('xem') as ds`);
  ok('Chủ nhà hàng: mọi chi nhánh', chu.rows?.[0]?.ds?.length === 2);

  const tkA = await duoi(UID.thuKhoA, `select kho_cn_duoc('nhap') as ds`);
  ok('Thủ kho Q1: đúng Q1', tkA.rows?.[0]?.ds?.length === 1 && tkA.rows[0].ds[0] === cnA.id);

  const tkB = await duoi(UID.thuKhoB, `select kho_duoc($1, 'xem') as duoc`, [cnA.id]);
  ok('Thủ kho Q7 KHÔNG được xem kho Q1', tkB.rows?.[0]?.duoc === false);

  const tn = await duoi(UID.thuNganA, `select kho_cn_duoc('xem') as ds`);
  ok('Thu ngân: không chi nhánh nào', tn.rows?.[0]?.ds?.length === 0);

  const nghi = await duoi(UID.nghiViec, `select kho_cn_duoc('xem') as ds`);
  ok('Người đã nghỉ việc: không chi nhánh nào', nghi.rows?.[0]?.ds?.length === 0);

  const nv = await duoi(UID.nvQuayA, `select kho_duoc($1, 'xem_gia') as duoc`, [cnA.id]);
  ok('NV quầy: không có quyền xem giá', nv.rows?.[0]?.duoc === false);

  const khong = await duoi(null, `select kho_co_quyen('xem') as duoc`);
  ok('Phiên đăng nhập không phải nhân sự: không có quyền kho', khong.rows?.[0]?.duoc === false);
});

// ===========================================================================
await nhom('6 · HỌ TÊN NGƯỜI LÀM CHỨNG TỪ', async () => {
  const { rows: ns } = await db.query(`select id, ho_ten, chi_nhanh_id from nhan_su`);
  const ids = ns.map(r => r.id);

  const nvA = await duoi(UID.nvQuayA, `select ho_ten from kho_ten_nhan_su($1) order by 1`, [ids]);
  const ten = (nvA.rows ?? []).map(r => r.ho_ten);
  ok('NV quầy Q1 thấy tên người cùng chi nhánh và chủ nhà hàng',
     ten.includes('Thủ kho Q1') && ten.includes('Chủ nhà hàng'), ten.join(', '));
  ok('NV quầy Q1 KHÔNG thấy tên người chi nhánh khác', !ten.includes('Thủ kho Q7'));

  const tn = await duoi(UID.thuNganA, `select count(*)::int as n from kho_ten_nhan_su($1)`, [ids]);
  ok('Thu ngân (không dùng kho) không lấy được danh sách', tn.rows?.[0]?.n === 0);
});

// ===========================================================================
await nhom('7 · ẢNH CHỨNG TỪ — AI XEM, AI TẢI', async () => {
  const f = (cn, loai) => `${cn}/${loai}/11111111-1111-4111-8111-111111111111/1.jpg`;
  const kiem = async (uid, ham, duong) =>
    (await duoi(uid, `select ${ham}($1) as duoc`, [duong])).rows?.[0]?.duoc;

  ok('NV quầy tải được ảnh báo hủy', await kiem(UID.nvQuayA, 'kho_duoc_tai_tep', f(cnA.id, 'huy')) === true);
  ok('NV quầy KHÔNG xem được ảnh hóa đơn (có giá)', await kiem(UID.nvQuayA, 'kho_duoc_doc_tep', f(cnA.id, 'nhap')) === false);
  ok('NV quầy KHÔNG tải được ảnh hóa đơn', await kiem(UID.nvQuayA, 'kho_duoc_tai_tep', f(cnA.id, 'nhap')) === false);
  ok('Thủ kho tải được ảnh hóa đơn', await kiem(UID.thuKhoA, 'kho_duoc_tai_tep', f(cnA.id, 'nhap')) === true);
  ok('Thủ kho KHÔNG xem lại được ảnh hóa đơn (có giá — 0031)', await kiem(UID.thuKhoA, 'kho_duoc_doc_tep', f(cnA.id, 'nhap')) === false);
  ok('Kế toán xem được ảnh hóa đơn để điền giá', await kiem(UID.keToanA, 'kho_duoc_doc_tep', f(cnA.id, 'nhap')) === true);
  ok('Thủ kho KHÔNG tải được vào chi nhánh khác', await kiem(UID.thuKhoA, 'kho_duoc_tai_tep', f(cnB.id, 'nhap')) === false);
  ok('Kế toán tải được ảnh thanh toán', await kiem(UID.keToanA, 'kho_duoc_tai_tep', f(cnA.id, 'thanh_toan')) === true);
  ok('Thủ kho KHÔNG tải được ảnh thanh toán', await kiem(UID.thuKhoA, 'kho_duoc_tai_tep', f(cnA.id, 'thanh_toan')) === false);
  ok('Quản lý xem được ảnh hủy', await kiem(UID.qlA, 'kho_duoc_doc_tep', f(cnA.id, 'huy')) === true);

  for (const duong of ['abc/nhap/x/1.jpg', `${cnA.id}/khac/x/1.jpg`, `${cnA.id}/nhap/1.jpg`,
                       `${cnA.id}/nhap/../../x.jpg`, '', null]) {
    const r = await duoi(UID.chu, `select kho_duoc_tai_tep($1) as duoc`, [duong]);
    ok(`Đường dẫn sai dạng "${duong}" → từ chối, không ném lỗi`,
       r.loi === null && r.rows[0].duoc === false, r.loi ?? '');
  }
});

// ===========================================================================
await nhom('8 · HÀM NỘI BỘ KHÔNG LỌT RA NGOÀI', async () => {
  // Hàm kho mà authenticated được gọi. Thêm hàm kho mới thì PHẢI xếp nó vào
  // một trong hai danh sách — quên là test đỏ.
  const GOI_DUOC = [
    // Phân quyền (policy gọi dưới vai người dùng nên phải gọi được)
    'kho_vai_duoc', 'kho_co_quyen', 'kho_cn_duoc', 'kho_duoc', 'kho_ten_nhan_su',
    'kho_tach_duong_dan_tep', 'kho_duoc_doc_tep', 'kho_duoc_tai_tep',
    // Danh mục, cài đặt
    'kho_chuan_hoa_truong_them', 'kho_luu_cai_dat', 'kho_luu_cai_dat_goc',
    'kho_khoi_tao', 'kho_tao_danh_muc_mau',
    // Phiếu nhập
    'kho_luu_phieu_nhap', 'kho_gui_duyet_phieu_nhap', 'kho_rut_phieu_nhap',
    'kho_duyet_phieu_nhap', 'kho_tu_choi_phieu_nhap', 'kho_huy_phieu_nhap',
    // Nhận hàng chỉ kg, điền giá, so giá (0031)
    'kho_ds_ncc_nhap', 'kho_ds_phieu_nhap_kg', 'kho_doc_phieu_nhap_kg', 'kho_luu_phieu_nhap_kg',
    'kho_dien_gia_phieu_nhap', 'kho_so_sanh_gia_nhap',
    // Pha lóc
    'kho_luu_phien_pha', 'kho_xem_thu_phien_pha', 'kho_xem_thu_phien_pha_kg', 'kho_chot_phien_pha',
    'kho_mo_lai_phien_pha', 'kho_huy_phien_pha',
    // Pha lóc bằng quét nhãn, quản lý bấm "Đã xem" thu hồi thấp (0033)
    'kho_quet_phien_pha', 'kho_bo_quet_phien_pha', 'kho_xac_nhan_phien_pha',
    // Chuyển, xuất bếp, xuất khác, hủy
    'kho_tao_phieu_xuat', 'kho_duyet_phieu_huy', 'kho_tu_choi_phieu_huy',
    // Quầy: yêu cầu → mang ra → nhận (0032)
    'kho_tao_yeu_cau', 'kho_huy_yeu_cau', 'kho_goi_y_ra_quay', 'kho_chuyen_theo_yeu_cau',
    'kho_nhan_hang_chuyen', 'kho_xu_ly_chuyen_thieu', 'kho_huy_chuyen',
    // Kiểm kê
    'kho_bat_dau_kiem_ke', 'kho_luu_kiem_ke', 'kho_gui_kiem_ke',
    'kho_duyet_kiem_ke', 'kho_tu_choi_kiem_ke', 'kho_huy_kiem_ke',
    // Đếm quầy cộng dồn bằng máy quét (0032)
    'kho_quet_kiem_ke', 'kho_bo_quet_kiem_ke', 'kho_het_hang_con_lai',
    // Đồng bộ bán hàng iPOS (0036): lượt (dong_bo_ban), cấu hình / chuyển nguồn
    // (cai_dat_goc), ghép mã (danh_muc), xử lý dòng (duyet), trạng thái (xem)
    'kho_ipos_bat_dau', 'kho_ipos_nhan', 'kho_ipos_ket_thuc',
    'kho_ipos_luu_cau_hinh', 'kho_ipos_chuyen_sang', 'kho_ipos_tro_ve',
    'kho_ipos_gan_ma', 'kho_ipos_xu_ly_dong', 'kho_ipos_trang_thai',
    // Công nợ, trả hàng
    'kho_doi_chieu_hoa_don', 'kho_ghi_thanh_toan', 'kho_huy_thanh_toan', 'kho_tra_nha_cung_cap',
    // Báo cáo — SECURITY INVOKER, RLS của người gọi vẫn áp dụng
    'kho_bao_cao_xuat_nhap_ton', 'kho_bao_cao_thu_hoi', 'kho_bao_cao_hao_hut', 'kho_bao_cao_ban',
    'kho_bao_cao_xnt_v2', 'kho_bao_cao_ban_thuc',
    // Đối soát
    'kho_doi_soat_ton',
    // Thẻ kho — không tiền (0033)
    'kho_the_kho',
    // Số đỏ trên menu, thông báo, ngưỡng, chỉ số quản trị (0030)
    'kho_dem_viec', 'kho_thong_bao', 'kho_da_xem_thong_bao', 'kho_luu_nguong', 'kho_chi_so_quan_tri',
    // Máy tính bảng dùng chung (0034) — mỗi hàm tự kiểm: phiên máy, chính người đó, hoặc duyet
    'kho_dang_ky_may', 'kho_may_tat', 'kho_ds_may', 'kho_may_ds_nguoi', 'kho_may_kiem_pin',
    'kho_may_gan_nguoi', 'kho_may_dat_pin', 'kho_may_khoa', 'kho_may_go', 'kho_may_mo_khoa',
    // Chủ tự tạo / khóa / mở tài khoản (0034) — chỉ chu_so_huu
    'kho_them_nhan_su', 'kho_khoa_nhan_su', 'kho_mo_nhan_su', 'kho_ds_nhan_su_kho',
    // Chuẩn bị chạy thật (0035): nợ đầu kỳ (ke_toan), tồn đầu kỳ dạng lưới (nhap),
    // tiến độ Thiết lập (xem — chỉ số đếm), đánh dấu bỏ qua bước (danh_muc)
    'kho_ghi_no_dau_ky', 'kho_luu_ton_dau_ky', 'kho_tien_do_thiet_lap', 'kho_danh_dau_thiet_lap',
    // Hàm trigger — PostgREST không gọi được hàm trả về trigger
    'kho_vi_tri_kiem_sua', 'kho_truong_them_kiem_sua', 'kho_truong_them_kiem',
    'kho_mat_hang_chuan_hoa', 'kho_cong_thuc_pha_kiem', 'kho_lo_chan_sua_xoa',
    'kho_ton_chi_qua_so_cai', 'kho_so_cai_ghi', 'kho_so_cai_chan_sua_xoa',
    'kho_phieu_nhap_chan_huy_da_tra', 'kho_chan_vi_tri_di_duong', 'kho_cai_dat_ghi_moc',
  ].sort();
  const NOI_BO = [
    'kho_sinh_so', 'kho_chia_so_du_lon_nhat', 'kho_ghi_dong_phieu_nhap',
    'kho_tinh_phien_pha', 'kho_phan_bo', 'kho_kg_tb_goi', 'kho_kiem_ke_bo_sung_dong', 'kho_dung_lai_ton',
    'kho_luc_vn', 'kho_su_kien',
    'kho_ghi_phieu_xuat', 'kho_chuyen_tren_duong', 'kho_don_tren_duong',
    'kho_doc_ma_vach', 'kho_kiem_ke_tinh_quet', 'kho_kiem_ke_ds_quet',
    'kho_vi_tri_sau_pha', 'kho_phien_pha_tinh_quet', 'kho_phien_pha_tra_quet', 'kho_thu_hoi_du_kien',
    'kho_may_cua_phien', 'kho_may_nguoi_hop_le', 'kho_may_ghi', 'kho_may_kiem_pin_bam',
    'kho_buoc_thiet_lap',
    // 0036: ghi một dòng iPOS, chọn lô, tự nhận hàng đi đường, đảo ngược, mất kết nối
    'kho_ipos_ghi_dong', 'kho_ipos_lay_lo', 'kho_ipos_tu_nhan', 'kho_ipos_dao_dong', 'kho_ipos_mat_ket_noi',
  ].sort();

  const { rows } = await db.query(`
    select p.proname, has_function_privilege('authenticated', p.oid, 'execute') as goi
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'kho\\_%'
    order by 1`);

  const goi = rows.filter(r => r.goi).map(r => r.proname).sort();
  const khong = rows.filter(r => !r.goi).map(r => r.proname).sort();

  const thua = goi.filter(x => !GOI_DUOC.includes(x));
  const thieu = GOI_DUOC.filter(x => !goi.includes(x));
  ok('authenticated gọi được ĐÚNG danh sách hàm kho đã duyệt', thua.length === 0 && thieu.length === 0,
     [thua.length ? `THỪA: ${thua.join(', ')}` : '', thieu.length ? `THIẾU: ${thieu.join(', ')}` : '']
       .filter(Boolean).join(' · '));
  ok('Hàm nội bộ đều đã rút khỏi authenticated', NOI_BO.every(x => khong.includes(x)),
     `không gọi được: ${khong.join(', ')}`);

  const anon = await db.query(`
    select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'kho\\_%'
      and has_function_privilege('anon', p.oid, 'execute')`);
  ok('anon không gọi được hàm kho nào', anon.rows.length === 0,
     anon.rows.map(r => r.proname).join(', '));

  const sinh = await duoi(UID.chu, `select kho_sinh_so($1, 'PN') as so`, [cnA.id]);
  ok('Gọi thẳng kho_sinh_so() dưới vai người dùng bị từ chối (tấn công thật)',
     sinh.loi !== null && /permission denied/i.test(sinh.loi), sinh.loi ?? 'GỌI ĐƯỢC');
});

process.exit(ketThuc('PHÂN QUYỀN KHO'));
