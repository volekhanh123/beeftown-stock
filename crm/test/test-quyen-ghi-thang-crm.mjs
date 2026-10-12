/**
 * BEEFTOWN CRM — Kiểm thử: không ai GHI THẲNG vào bảng khách, đồng ý, tin, điểm (migration 0065)
 * =============================================================================================
 *
 *     node test/test-quyen-ghi-thang-crm.mjs
 *
 * Policy ghi của 0007 viết cho thời chưa có hàm definer: "nhân viên chi nhánh được ghi". Rồi mọi
 * đường ghi thật chuyển vào hàm definer tự kiểm vai (tao_dat_ban, ghi_luot_ghe, tim_hoac_tao_khach,
 * xep_hang_gui_tin, zalo_*), còn policy cũ ở lại — và mở những cửa hàm definer đã đóng:
 *
 *   · nhat_ky_dong_y `with check (true)`: MỌI tài khoản đăng nhập — kể cả tài khoản không có dòng
 *     nhan_su, nhân sự đã nghỉ, quản lý chi nhánh khác — ghi được "khách đồng ý nhận tin" cho khách
 *     đã rút lại. Bằng chứng tuân thủ Nghị định 13 thành giả được.
 *   · nhat_ky_tin: thu ngân, marketing chèn thẳng tin `cho_gui` với SỐ ĐIỆN THOẠI BẤT KỲ — máy Zalo
 *     gửi tin có tính phí tới số đó, vòng qua kiểm vai và khoá chống gửi hai lần của zalo_*.
 *   · so_cai_diem / luot_ghe: thu ngân tự cộng 5.000.000 điểm, ghi dưới tên người khác.
 *   · khach_hang (update không giới hạn chi nhánh): thu ngân Q1 một câu `update` tắt mọi khách của
 *     Q7 — khách bị coi là "đã yêu cầu xoá", mọi tin Zalo dừng.
 *
 * Web và Beeftown Cân không ghi thẳng bảng nào trong năm bảng đó (mục 1 kiểm mã nguồn), nên 0065
 * bỏ các policy ghi đó: bảng còn RLS, không policy ghi = không ai ghi thẳng được; hàm definer vẫn
 * ghi như cũ (mục 6). dat_ban_them / dat_ban_sua GIỮ: /noi-bo/dat-ban sửa thẳng dat_ban, và
 * test-zalo-xac-nhan.mjs dựa vào việc nhân viên chèn thẳng một dòng đặt bàn.
 *
 * Mục 8 là cổng cho lần sau: mọi hàm security definer mà authenticated gọi được, ngoài các
 * tiền tố đã có danh sách riêng (kho_ / zalo_ / mess_ / bao_dong_, test-kho-quyen.mjs và các file
 * cùng khu) và ngoài danh sách anon (DUOC_PHEP, test-an-toan.mjs), phải được xếp loại ở đây.
 * don_dep_phieu_tai_len() lọt đúng chỗ này: không kiểm vai, thủ kho chạy được.
 *
 * Dựng database bằng kho-chung.mjs: KHÔNG cấp quyền hàng loạt cho authenticated, nên quyền ở đây
 * đúng là quyền trên Supabase thật.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — KHÔNG AI GHI THẲNG BẢNG KHÁCH, ĐỒNG Ý, TIN, ĐIỂM (0065)');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();

// Hai kiểu người khung dùng chung chưa có (như test-quyen-ham-crm.mjs).
const UID_LA = '00000000-0000-4000-8000-0000000000aa';
const UID_TN_NGHI = '00000000-0000-4000-8000-0000000000ac';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam)
                values ($1, $2, 'Thu ngân đã nghỉ', 'thu_ngan', false)`, [UID_TN_NGHI, cnA.id]);
for (let i = 1; i <= 4; i++) {
  await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1, $2, 4)`, [cnA.id, `B0${i}`]);
}
await db.query(`insert into cau_hinh_tich_diem (chi_nhanh_id, dang_bat) values ($1, true)`, [cnA.id]);

const ngayKia = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

/** Bị RLS / quyền chặn — mã 42501, không phải một lỗi bất kỳ (ví dụ sai cột). */
const biChan = r => r.loi !== null && r.ma === '42501';
const vi = r => (r.loi ? `${r.ma}: ${r.loi}` : 'CHẠY ĐƯỢC');
const dem = async (sql, p = []) => Number((await db.query(sql, p)).rows[0].n);

/** Mọi người đăng nhập thử ghi — từ người lạ tới chủ sở hữu. */
const MOI_NGUOI = [
  ['Tài khoản đăng nhập KHÔNG có dòng nhan_su', UID_LA],
  ['Thu ngân đã nghỉ việc', UID_TN_NGHI],
  ['Quản lý Q7 (chi nhánh khác)', UID.qlB],
  ['Thủ kho Q1', UID.thuKhoA],
  ['Thu ngân Q1', UID.thuNganA],
  ['Marketing Q1', UID.mktA],
  ['Quản lý Q1', UID.qlA],
  ['Chủ sở hữu', UID.chu],
];

// Khách ở Q1 đã từng đồng ý rồi RÚT LẠI; khách chỉ có ở Q7.
const { rows: [khQ1] } = await db.query(`select * from tim_hoac_tao_khach('0901010101', 'Khách Q1')`);
await db.query(`insert into luot_ghe (chi_nhanh_id, khach_hang_id, tong_hoa_don) values ($1, $2, 300000)`, [cnA.id, khQ1.id]);
await db.query(`insert into nhat_ky_dong_y (khach_hang_id, dong_y, kenh, noi_dung, created_at)
                values ($1, true, 'quay', 'đồng ý', now() - interval '2 days'),
                       ($1, false, 'quay', 'rút lại', now() - interval '1 day')`, [khQ1.id]);
const { rows: [khQ7] } = await db.query(`select * from tim_hoac_tao_khach('0907070707', 'Khách Q7')`);
await db.query(`insert into luot_ghe (chi_nhanh_id, khach_hang_id, tong_hoa_don) values ($1, $2, 300000)`, [cnB.id, khQ7.id]);

const dongYCuoi = async kh => (await db.query(
  `select dong_y from nhat_ky_dong_y where khach_hang_id = $1 order by created_at desc, id desc limit 1`, [kh])).rows[0]?.dong_y;

// ===========================================================================
await nhom('1 · TIỀN ĐỀ — web và Beeftown Cân không ghi thẳng năm bảng này; đường ghi thật là hàm definer', async () => {
  const BANG = ['nhat_ky_dong_y', 'nhat_ky_tin', 'so_cai_diem', 'luot_ghe', 'khach_hang'];
  const tep = [];
  const duyet = thuMuc => {
    for (const ten of readdirSync(thuMuc)) {
      const p = join(thuMuc, ten);
      if (statSync(p).isDirectory()) duyet(p);
      else if (/\.(ts|astro|js|mjs)$/.test(ten)) tep.push(p);
    }
  };
  duyet(join(GOC, 'web', 'src'));
  duyet(join(GOC, 'can-app', 'src'));
  for (const bang of BANG) {
    const ghi = new RegExp(`from\\(\\s*['"\`]${bang}['"\`]\\s*\\)\\s*\\.\\s*(insert|update|upsert|delete)`);
    const co = tep.filter(p => ghi.test(readFileSync(p, 'utf8').replace(/\s+/g, ' ')));
    ok(`Không file nào ghi thẳng ${bang} (.from('${bang}').insert/update/upsert/delete)`, co.length === 0,
       co.map(p => p.slice(GOC.length + 1)).join(', '));
  }

  const { rows } = await db.query(`
    select p.proname, p.prosecdef from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('tao_dat_ban', 'ghi_luot_ghe', 'tim_hoac_tao_khach', 'xep_hang_gui_tin')`);
  ok('Bốn đường ghi thật đều là security definer — không cần policy ghi của bảng',
     rows.length === 4 && rows.every(r => r.prosecdef), JSON.stringify(rows));

  const { rows: rls } = await db.query(`
    select relname, relrowsecurity from pg_class
    where relnamespace = 'public'::regnamespace and relname = any($1)`, [BANG]);
  ok('Năm bảng vẫn bật RLS (không policy ghi = không ai ghi thẳng)',
     rls.length === 5 && rls.every(r => r.relrowsecurity), JSON.stringify(rls));
});

// ===========================================================================
await nhom('2 · nhat_ky_dong_y — không ai tự ghi "khách đồng ý nhận tin"', async () => {
  ok('Tiền đề: khách Q1 đã rút lại đồng ý', (await dongYCuoi(khQ1.id)) === false);
  const truoc = await dem(`select count(*) n from nhat_ky_dong_y`);
  for (const [ai, uid] of MOI_NGUOI) {
    const r = await duoi(uid,
      `insert into nhat_ky_dong_y (khach_hang_id, dong_y, kenh, noi_dung) values ($1, true, 'quay', 'giả')`, [khQ1.id]);
    ok(`${ai} → không ghi được đồng ý thay khách`, biChan(r), vi(r));
  }
  ok('Không dòng đồng ý nào được thêm', (await dem(`select count(*) n from nhat_ky_dong_y`)) === truoc);
  ok('Khách vẫn là "đã rút lại" — duoc_phep_gui cham_soc vẫn từ chối',
     (await dongYCuoi(khQ1.id)) === false
     && (await db.query(`select * from duoc_phep_gui($1, 'cham_soc')`, [khQ1.id])).rows[0].duoc_gui === false);
});

// ===========================================================================
await nhom('3 · nhat_ky_tin — không ai chèn thẳng tin chờ gửi tới số bất kỳ', async () => {
  const truoc = await dem(`select count(*) n from nhat_ky_tin`);
  for (const [ai, uid] of MOI_NGUOI) {
    const r = await duoi(uid,
      `insert into nhat_ky_tin (chi_nhanh_id, khach_hang_id, sdt_gui, noi_dung, ket_qua)
       values ($1, $2, '0999999999', 'tin tự soạn', 'cho_gui')`, [cnA.id, khQ1.id]);
    ok(`${ai} → không chèn được tin chờ gửi`, biChan(r), vi(r));
  }
  ok('Hàng chờ Zalo không thêm dòng nào', (await dem(`select count(*) n from nhat_ky_tin`)) === truoc);
});

// ===========================================================================
await nhom('4 · so_cai_diem, luot_ghe — điểm là tiền: chỉ ghi qua ghi_luot_ghe()', async () => {
  const diemTruoc = await dem(`select count(*) n from so_cai_diem`);
  const gheTruoc = await dem(`select count(*) n from luot_ghe`);
  for (const [ai, uid] of MOI_NGUOI) {
    const diem = await duoi(uid,
      `insert into so_cai_diem (chi_nhanh_id, khach_hang_id, loai, so_diem) values ($1, $2, 'dieu_chinh', 5000000)`,
      [cnA.id, khQ1.id]);
    ok(`${ai} → không tự cộng 5.000.000 điểm`, biChan(diem), vi(diem));
    const ghe = await duoi(uid,
      `insert into luot_ghe (chi_nhanh_id, khach_hang_id, tong_hoa_don) values ($1, $2, 99000000)`, [cnA.id, khQ1.id]);
    ok(`${ai} → không tự thêm lượt ghé`, biChan(ghe), vi(ghe));
  }
  // luot_ghe_sua (0007) cho quản lý / chủ sửa thẳng mọi cột: ghi lại người ghi lượt ghé (created_by — vòng qua
  // kiểm "không ghi dưới tên nhân sự khác" của 0045) và số tiền hoá đơn (nuôi nhóm khách VIP, đối tượng chiến dịch Zalo).
  const { rows: [ns] } = await db.query(`select id from nhan_su where auth_uid = $1`, [UID.keToanA]);
  const { rows: [luot] } = await db.query(`select id, tong_hoa_don, created_by from luot_ghe where khach_hang_id = $1 limit 1`, [khQ1.id]);
  for (const [ai, uid] of MOI_NGUOI) {
    const r = await duoi(uid, `update luot_ghe set created_by = $1, tong_hoa_don = 1 where id = $2 returning id`, [ns.id, luot.id]);
    ok(`${ai} → không sửa thẳng được lượt ghé (người ghi, số tiền)`, r.loi !== null || r.rows.length === 0, vi(r));
  }
  const { rows: [sau] } = await db.query(`select tong_hoa_don, created_by from luot_ghe where id = $1`, [luot.id]);
  ok('Lượt ghé giữ nguyên số tiền và người ghi', Number(sau.tong_hoa_don) === Number(luot.tong_hoa_don)
     && sau.created_by === luot.created_by, JSON.stringify(sau));
  ok('Sổ điểm và lượt ghé không thêm dòng nào',
     (await dem(`select count(*) n from so_cai_diem`)) === diemTruoc
     && (await dem(`select count(*) n from luot_ghe`)) === gheTruoc);
});

// ===========================================================================
await nhom('5 · khach_hang — không ai sửa / thêm thẳng hồ sơ khách', async () => {
  // KHÔNG có "returning": returning bắt Postgres áp thêm policy ĐỌC (khach_hang_doc) và bỏ qua khách Q7 — đúng câu
  // tấn công thật là update trơn, không điều kiện. Kiểm bằng trạng thái sau đó, không bằng số dòng trả về.
  const r = await duoi(UID.thuNganA, `update khach_hang set dang_hoat_dong = false`);
  ok('Thu ngân Q1: update khach_hang KHÔNG điều kiện chạy (không đổi được gì)', r.loi === null || r.ma === '42501', vi(r));
  const { rows: [q7] } = await db.query(`select dang_hoat_dong from khach_hang where id = $1`, [khQ7.id]);
  ok('…khách chỉ có ở Q7 vẫn đang hoạt động (không bị coi là "đã yêu cầu xoá")', q7.dang_hoat_dong === true);
  const { rows: [q1] } = await db.query(`select dang_hoat_dong from khach_hang where id = $1`, [khQ1.id]);
  ok('…khách Q1 cũng vậy', q1.dang_hoat_dong === true);

  for (const [ai, uid] of MOI_NGUOI) {
    const sua = await duoi(uid, `update khach_hang set ho_ten = 'đổi tên' where id = $1 returning id`, [khQ1.id]);
    ok(`${ai} → không sửa thẳng được tên khách`, sua.loi !== null || sua.rows.length === 0, vi(sua));
    const them = await duoi(uid, `insert into khach_hang (sdt, ho_ten) values ('0988888888', 'khách tự thêm')`);
    ok(`${ai} → không thêm thẳng được khách`, biChan(them), vi(them));
  }
  const { rows: [ten] } = await db.query(`select ho_ten from khach_hang where id = $1`, [khQ1.id]);
  ok('Tên khách Q1 giữ nguyên', ten.ho_ten === 'Khách Q1', ten.ho_ten);
});

// ===========================================================================
await nhom('6 · ĐƯỜNG GHI THẬT VẪN CHẠY — hàm definer, và dat_ban cho nhân viên', async () => {
  const dat = await duoiAnon(
    `select * from tao_dat_ban('q1', '0912340000', 'Khách web', $1::date, '18:00'::time, 2::smallint,
                               null, null, true)`, [ngayKia]);
  ok('Website (anon) đặt bàn kèm tick đồng ý được', dat.loi === null && dat.rows?.length === 1, dat.loi ?? '');
  const { rows: [kh] } = await db.query(`select id from khach_hang where sdt = '0912340000'`);
  ok('…và tao_dat_ban() ghi được dòng đồng ý (nguyên văn câu khách đọc)',
     !!kh && (await dongYCuoi(kh.id)) === true);

  const ghe = await duoi(UID.thuNganA, `select * from ghi_luot_ghe($1, '0901010101', 500000::bigint)`, [cnA.id]);
  ok('Thu ngân Q1 ghi lượt ghé qua ghi_luot_ghe() được, có điểm',
     ghe.loi === null && Number(ghe.rows?.[0]?.diem_tich_duoc) > 0, vi(ghe));

  const tao = await duoi(UID.thuNganA, `select * from tim_hoac_tao_khach('0955550000', 'Khách quầy', $1)`, [cnA.id]);
  ok('Thu ngân Q1 tạo khách qua tim_hoac_tao_khach() được', tao.loi === null && tao.rows?.length === 1, vi(tao));

  await db.query(`update mau_tin set da_duyet = true, ma_zalo = 'zbs-04-kiem-thu' where ma = 'ZBS-04'`);
  const xep = await duoi(UID.qlA, `select xep_hang_gui_tin($1, $2, 'ZBS-04') as id`, [cnA.id, khQ1.id]);
  ok('Quản lý Q1 xếp tin qua xep_hang_gui_tin() được', xep.loi === null && !!xep.rows?.[0]?.id, vi(xep));

  const { rows: [db1] } = await db.query(`select id from dat_ban where khach_hang_id = $1`, [kh.id]);
  const sua = await duoi(UID.qlA, `update dat_ban set ghi_chu = 'đã gọi' where id = $1 returning id`, [db1.id]);
  ok('Quản lý Q1 vẫn sửa thẳng dat_ban được (/noi-bo/dat-ban cần — policy GIỮ)',
     sua.loi === null && sua.rows?.length === 1, vi(sua));
});

// ===========================================================================
await nhom('7 · don_dep_phieu_tai_len() — chủ sở hữu hoặc quản lý (như nút ở /noi-bo/cai-dat)', async () => {
  await db.query(`insert into phieu_tai_len (het_han) values (now() - interval '3 days'), (now() - interval '3 days')`);
  const CAU = /Chỉ chủ sở hữu hoặc quản lý mới dọn được vé tải CV/;
  for (const [ai, uid] of [
    ['Tài khoản đăng nhập KHÔNG có dòng nhan_su', UID_LA],
    ['Thu ngân đã nghỉ việc', UID_TN_NGHI],
    ['Thủ kho Q1', UID.thuKhoA],
    ['Thu ngân Q1', UID.thuNganA],
    ['Marketing Q1', UID.mktA],
  ]) {
    const r = await duoi(uid, `select don_dep_phieu_tai_len() as n`);
    ok(`${ai} → bị từ chối`, biChan(r) && CAU.test(r.loi), vi(r));
  }
  ok('Chưa vé nào bị xoá', (await dem(`select count(*) n from phieu_tai_len`)) === 2);

  const ql = await duoi(UID.qlA, `select don_dep_phieu_tai_len() as n`);
  ok('Quản lý Q1 dọn được (2 vé quá hạn)', ql.loi === null && Number(ql.rows?.[0]?.n) === 2, vi(ql));
  await db.query(`insert into phieu_tai_len (het_han) values (now() - interval '3 days')`);
  const chu = await duoi(UID.chu, `select don_dep_phieu_tai_len() as n`);
  ok('Chủ sở hữu dọn được', chu.loi === null && Number(chu.rows?.[0]?.n) === 1, vi(chu));
  await db.query(`insert into phieu_tai_len (het_han) values (now() - interval '3 days')`);
  const { rows: [{ n }] } = await db.query(`select don_dep_phieu_tai_len() as n`);
  ok('Không phiên đăng nhập (SQL Editor, lịch chạy) vẫn dọn được như cũ', Number(n) === 1);

  // Nút "Chạy ngay" ở /noi-bo/cai-dat (chủ sở hữu và quản lý vào được) phải khớp quyền của database: hàm từ
  // chối quản lý thì trang phải ghi chi_chu_so_huu: true — không thì quản lý bấm nút chỉ để nhận câu từ chối.
  const caiDat = readFileSync(join(GOC, 'web', 'src', 'lib', 'cai-dat.ts'), 'utf8').replace(/\s+/g, ' ');
  for (const ham of ['don_dep_ho_so_het_han', 'don_dep_phieu_tai_len', 'don_dep_su_kien_web']) {
    const m = caiDat.match(new RegExp(`ham: '${ham}',.*?chi_chu_so_huu: (true|false)`));
    const r = await duoi(UID.qlA, `select ${ham}() as n`);
    const quanLyDuoc = r.loi === null;
    ok(`Nút ${ham}: chi_chu_so_huu = ${m?.[1]} khớp database (quản lý ${quanLyDuoc ? 'chạy được' : 'bị từ chối'})`,
       !!m && (m[1] === 'true') === !quanLyDuoc, vi(r));
  }

  const en = readFileSync(join(GOC, 'web', 'src', 'lib', 'cau-noi-bo.ts'), 'utf8');
  ok('Câu từ chối mới có bản tiếng Anh ở cau-noi-bo.ts',
     en.includes(`'Chỉ chủ sở hữu hoặc quản lý mới dọn được vé tải CV'`));
});

// ===========================================================================
await nhom('8 · CỔNG — mọi hàm definer authenticated gọi được phải được xếp loại', async () => {
  // Tiền tố có danh sách riêng (test-kho-quyen.mjs GOI_DUOC / NOI_BO, test-zalo*.mjs, test-messenger*.mjs,
  // test-bao-dong*.mjs). Hàm anon gọi được: DUOC_PHEP ở test-an-toan.mjs.
  const XEP_LOAI = {
    // Dùng trong policy RLS — chỉ trả lời về CHÍNH người gọi, không đọc dữ liệu ai khác.
    co_phien_dang_nhap: 'policy', co_vai_tro: 'policy', duoc_truy_cap_chi_nhanh: 'policy',
    la_chu_so_huu: 'policy', la_nhan_su_ngoai_crm: 'policy', nhan_su_hien_tai: 'policy',
    crm_cn_duoc: 'policy',   // 0067 — mảng chi nhánh CRM của người gọi; test-quyen-doc-crm.mjs mục 3
    // Hàm trigger — Postgres không cho gọi thẳng. dat_ban_kiem_sua: 0066, test-quyen-chi-nhanh-crm.mjs mục 5.
    chan_vai_ngoai_crm: 'trigger', ho_so_kiem_tra_vong_doi: 'trigger', dat_ban_kiem_sua: 'trigger',
    // Tự kiểm vai ở đầu thân hàm (kiểm thử: test-quyen-ham-crm.mjs, test-tuyen-dung.mjs, test-cong-khai.mjs,
    // test-suc-khoe.mjs, mục 7 ở trên).
    ghi_luot_ghe: 'tu_kiem_vai', tim_hoac_tao_khach: 'tu_kiem_vai', xep_hang_gui_tin: 'tu_kiem_vai',
    don_dep_ho_so_het_han: 'tu_kiem_vai', don_dep_su_kien_web: 'tu_kiem_vai', don_dep_phieu_tai_len: 'tu_kiem_vai',
    tao_tin_tuyen_dung_mau: 'tu_kiem_vai', phieu_do_launch: 'tu_kiem_vai', thong_ke_tuyen_dung: 'tu_kiem_vai',
    suc_khoe_he_thong: 'tu_kiem_vai', suc_khoe_sao_luu: 'tu_kiem_vai',
    // Chỉ đọc thứ đã công khai cho anon (cong_tac_bat: công tắc đã công bố; lịch trống: như lich_trong_theo_ma).
    cong_tac_bat: 'cong_khai', khung_gio_trong_ngay: 'cong_khai', so_ban_con_trong: 'cong_khai',
    lich_trong_theo_ngay: 'cong_khai',
  };
  const { rows } = await db.query(`
    select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and has_function_privilege('authenticated', p.oid, 'execute')
      and not has_function_privilege('anon', p.oid, 'execute')
      and p.proname !~ '^(kho_|zalo_|mess_|bao_dong_)'
    order by 1`);
  const co = rows.map(r => r.proname);
  const thieu = co.filter(t => !(t in XEP_LOAI));
  ok('Không hàm definer nào authenticated gọi được mà chưa xếp loại', thieu.length === 0,
     `chưa xếp loại: ${thieu.join(', ')} — thêm vào XEP_LOAI kèm kiểm thử từ chối, hoặc revoke`);
  const thua = Object.keys(XEP_LOAI).filter(t => !co.includes(t));
  ok('Danh sách không giữ tên hàm đã bị bỏ / đổi quyền', thua.length === 0, `thừa: ${thua.join(', ')}`);

  const { rows: [luot] } = await db.query(`
    select count(*) filter (where not exists (
             select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%'))::int as thieu
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef`);
  ok('Mọi hàm security definer đều có set search_path', luot.thieu === 0, `${luot.thieu} hàm thiếu`);
});

process.exit(ketThuc('KHÔNG AI GHI THẲNG BẢNG CRM'));
