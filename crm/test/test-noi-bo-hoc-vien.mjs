/**
 * BEEFTOWN — TÀI KHOẢN HỌC VIÊN CHỈ XEM VIDEO ĐÀO TẠO (0118, 0119)
 * ================================================================
 *
 *     node test/test-noi-bo-hoc-vien.mjs
 *
 * Khánh 14/11/2026: "1 tài khoản demo về việc training và chỉ mở cho việc training thôi" — một tài khoản cả lớp dùng
 * chung trong buổi đào tạo. Học viên biết mật khẩu chung, khóa anon thì công khai: họ gọi thẳng được Supabase, nên
 * lớp chặn thật là DATABASE; web chỉ giữ họ ở đúng một trang cho khỏi lạc. Theo 9 mục "xong":
 *
 *   1. quyen — đọc đủ video_dao_tao, không thêm / sửa / xóa / TRUNCATE; khóa (dang_lam = false) là 0 video và không
 *      đăng nhập được; quét MỌI bảng, view của schema public: ngoài video_dao_tao chỉ thấy dòng nhan_su của chính nó;
 *      MỌI hàm security definer authenticated gọi được (trừ hàm công khai của anon), gọi hai lượt — tham số null rồi
 *      tham số thật của chi nhánh Q1: bị từ chối hoặc trả rỗng, trừ đúng ba hàm "tôi là ai" và ba hàm lịch trống công
 *      khai; hàm kho, CRM chính gọi bằng tham số thật: từ chối; sau cả loạt không bảng nào đổi số dòng. Chủ tạo / khóa /
 *      mở lại được; quản lý, thủ kho, chính học viên, tài khoản không có nhan_su, anon thì không.
 *   2. bam-hai-lan — tạo hai lần cùng tài khoản đăng nhập: lần hai bị từ chối, vẫn một dòng nhan_su; khóa hai lần vẫn
 *      khóa, một dòng (màn Nhân viên còn chặn F5 bằng ma_gui — test-kho-may-chung.mjs).
 *   3. gio-vn — không áp dụng: không có ngày giờ nào.
 *   4. chu-va-so — tên vai đủ hai thứ tiếng, bản tiếng Anh không còn chữ Việt; câu hướng dẫn sau khi tạo nằm cùng dòng
 *      với câu xác nhận email (compressHTML).
 *   5. mat-mang — không đường gọi mạng mới: middleware xét học viên SAU khi đọc được phiên (Supabase bận vẫn là trang
 *      "đang bận"); khóa / mở / đọc danh sách đi qua hàm sẵn có của lib/kho/nhan-vien.ts.
 *   6. ton-kho — kho_doi_soat_ton() rỗng.
 *   7. cau-chu — không câu raise mới: bốn hàm của 0119 giữ đúng chữ (bản tiếng Anh có sẵn); tên vai, câu hướng dẫn có
 *      bản tiếng Anh.
 *   8. migration — 0118 đúng một lệnh thêm enum (chạy riêng); 0119 không thêm enum, câu delete chỉ nằm trong thân hàm;
 *      tường ngăn CRM và bảng quyền kho không nhắc tới hoc_vien.
 *   9. dich-vu-ngoai — không dịch vụ mới: tài khoản tạo bằng đường signUp sẵn có của màn Nhân viên.
 *
 * Web (nhóm 6): chuyenHuongHocVien đưa MỌI trang /noi-bo (dựng từ thư mục pages) về /noi-bo/dao-tao; middleware gọi
 * nó sau khi có phiên, trước next(); vai khác không bị đụng; thanh menu chỉ một mục nên không vẽ; không nút sửa / xóa.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dungDatabase, taoBoDem, taoClientPg, UID } from './kho-chung.mjs';
import { VIET } from './quet-chu-viet.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const MIG = join(GOC, 'crm', 'supabase', 'migrations');
const doc = p => readFileSync(join(GOC, p), 'utf8');
const nap = p => import(pathToFileURL(join(SRC, p)).href);

const NB = await nap('lib/dieu-huong-noi-bo.ts');
const VD = await nap('lib/video-dao-tao.ts');
const NV = await nap('lib/kho/nhan-vien.ts');
const KDH = await nap('lib/kho/dieu-huong.ts');
const BD = await nap('lib/ban-do-chuc-nang.ts');
const { QUYEN_KHO } = await nap('lib/kho/chung.ts');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — TÀI KHOẢN HỌC VIÊN CHỈ XEM VIDEO ĐÀO TẠO (0118, 0119)');
const { db, cnA, cnB, nsId, duoi, duoiAnon } = await dungDatabase();
const clientCua = await taoClientPg({ db, duoi, duoiAnon });

const UID_HV = '00000000-0000-4000-8000-0000000000c9';       // học viên đang dùng (chi nhánh Q1)
const UID_HV_KHOA = '00000000-0000-4000-8000-0000000000ca';  // học viên buổi trước, đã khóa
const UID_LA = '00000000-0000-4000-8000-0000000000aa';       // đăng nhập Supabase, không có dòng nhan_su
const { rows: [{ id: NS_HV }] } = await db.query(
  `insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam) values ($1, $2, 'Học viên đào tạo', 'hoc_vien', true) returning id`,
  [UID_HV, cnA.id]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam) values ($1, $2, 'Học viên buổi trước', 'hoc_vien', false)`,
  [UID_HV_KHOA, cnA.id]);

const vi = r => (r.loi ? `${r.ma}: ${r.loi}` : JSON.stringify(r.rows)?.slice(0, 200));
const bang = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const formTu = o => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
const demVideo = async () => (await db.query(`select count(*)::int n from video_dao_tao`)).rows[0].n;
const docDuoc = async uid => { const r = await duoi(uid, `select count(*)::int n from video_dao_tao`); return r.loi ? -1 : r.rows[0].n; };

/** Số dòng của mọi bảng thật (đếm bằng superuser) — so trước / sau để biết có ai ghi được gì không. */
async function demMoiBang() {
  const { rows } = await db.query(`select c.relname as ten from pg_class c join pg_namespace n on n.oid = c.relnamespace
                                   where n.nspname = 'public' and c.relkind in ('r', 'p') order by 1`);
  const ra = {};
  for (const { ten } of rows) ra[ten] = (await db.query(`select count(*)::int n from ${ten}`)).rows[0].n;
  return ra;
}

// ===========================================================================
await nhom('0 · DỮ LIỆU THỬ Ở MỌI KHU — để phép quét bảng không rỗng', async () => {
  await db.query(`insert into cau_hinh_tich_diem (chi_nhanh_id, dang_bat) values ($1, true)`, [cnA.id]);
  for (let i = 1; i <= 3; i++) await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1, $2, 4)`, [cnA.id, `B0${i}`]);
  await db.query(`select * from ghi_luot_ghe($1, '0911111111', 320000::bigint)`, [cnA.id]);
  const ngayKia = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  const datBan = await duoiAnon(`select * from tao_dat_ban('q1', '0922222222', 'Khách đặt web', $1::date, '18:00'::time, 2::smallint)`, [ngayKia]);
  ok('Khách (anon) đặt được một bàn ở Q1', datBan.loi === null && datBan.rows?.length === 1, vi(datBan));
  const khoiTao = await duoi(UID.chu, `select kho_khoi_tao($1) as n`, [cnA.id]);
  ok('Chủ khởi tạo kho Q1', khoiTao.loi === null, vi(khoiTao));
  await db.query(`insert into kho_mat_hang (ma, ten, loai) values ('BO-THU', 'Bò thử', 'phan_cat')`);
  await db.query(`insert into kho_nha_cung_cap (ten) values ('NCC thử')`);
  await db.query(`insert into kho_ipos_cau_hinh (chi_nhanh_id, pos_parent, pos_id) values ($1, 'BEEF', '101')`, [cnA.id]);
  await db.query(`insert into noi_dung_cong_bo (khoa, kieu, gia_tri_text)
                  select khoa, kieu, 'nháp chưa công bố' from khoa_cong_bo where kieu = 'van_ban' and khoa = 'dia_chi_hien_thi'`);
  await db.query(`insert into phieu_tai_len (het_han) values (now() + interval '1 hour')`);
  await db.query(`insert into nhat_ky_tra_cuu (ip, ma_thu, thanh_cong) values ('1.2.3.4', 'ABC123', false)`);
  const { rows: [sp] } = await db.query(
    `insert into ban_le_san_pham (ma, ten_vi, loai, cach_ban) values ('ribeye', 'Ribeye', 'thit', 'theo_can') returning id`);
  await db.query(`insert into ban_le_goi (san_pham_id, so_gam) values ($1, 200)`, [sp.id]);
  // Thứ tự trên trang là created_at: bài 1 thêm trước (một câu insert thì hai dòng cùng giờ).
  await db.query(`insert into video_dao_tao (youtube_id, tieu_de, created_at) values
                  ('AbCdEfGhIjK', 'Bài 1', now() - interval '1 minute'), ('BbCdEfGhIjK', 'Bài 2', now())`);

  const chu = async bangTen => (await duoi(UID.chu, `select count(*)::int n from ${bangTen}`)).rows?.[0]?.n ?? -1;
  ok('Chủ thấy dữ liệu CRM và kho vừa tạo (phép quét có thứ để lộ)',
    (await chu('khach_hang')) >= 2 && (await chu('dat_ban')) === 1 && (await chu('kho_vi_tri')) >= 3 && (await chu('kho_mat_hang')) >= 1,
    `khach_hang ${await chu('khach_hang')} · dat_ban ${await chu('dat_ban')} · kho_vi_tri ${await chu('kho_vi_tri')}`);
});

// ===========================================================================
await nhom('1 · VIDEO ĐÀO TẠO — học viên đọc đủ, không ghi được gì, khóa là hết', async () => {
  const tong = await demVideo();
  const r = await duoi(UID_HV, `select youtube_id from video_dao_tao`);
  ok(`Học viên đọc đủ ${tong} video`, r.loi === null && r.rows.length === tong && tong === 2, vi(r));
  const them = await duoi(UID_HV, `insert into video_dao_tao (youtube_id, tieu_de) values ('CbCdEfGhIjK', 'Học viên thêm')`);
  ok('Học viên KHÔNG thêm được video (RLS, 42501)', them.loi !== null && them.ma === '42501' && (await demVideo()) === tong, vi(them));
  const sua = await duoi(UID_HV, `update video_dao_tao set tieu_de = 'Học viên đổi' returning id`);
  const conTen = (await db.query(`select count(*)::int n from video_dao_tao where tieu_de = 'Học viên đổi'`)).rows[0].n;
  ok('Học viên KHÔNG sửa được video (0 dòng, tên còn nguyên)', sua.loi === null && sua.rows.length === 0 && conTen === 0, vi(sua));
  const xoa = await duoi(UID_HV, `delete from video_dao_tao returning id`);
  ok('Học viên KHÔNG xóa được video (0 dòng, đủ video)', xoa.loi === null && xoa.rows.length === 0 && (await demVideo()) === tong, vi(xoa));
  const cat = await duoi(UID_HV, `truncate video_dao_tao`);
  ok('Học viên KHÔNG xóa sạch bảng bằng TRUNCATE (42501)', cat.loi !== null && cat.ma === '42501' && (await demVideo()) === tong, vi(cat));

  // Qua thư viện của trang (client giả mang phiên học viên).
  const hv = clientCua(UID_HV);
  const ds = await VD.docDanhSachVideo(hv);
  ok('Trang đọc danh sách bằng phiên học viên (docDanhSachVideo): đủ video, đúng thứ tự thêm',
    ds.map(v => v.tieu_de).join() === 'Bài 1,Bài 2', JSON.stringify(ds.map(v => v.tieu_de)));
  const sv = await VD.suaVideo(hv, formTu({ id: ds[0].id, phien_ban: ds[0].updated_at, tieu_de: 'Đổi', mo_ta: '' }), 'vi');
  ok('Gửi thẳng form sửa (trang không có nút): "chỉ chủ và quản lý", tên còn nguyên',
    !sv.ok && sv.cau === VD.CAU.khongQuyen.vi && (await VD.docDanhSachVideo(hv))[0].tieu_de === 'Bài 1', sv.cau);
  const xv = await VD.xoaVideo(hv, formTu({ id: ds[0].id, tieu_de: ds[0].tieu_de }), 'vi');
  ok('Gửi thẳng form xóa: "Chưa xóa được", video còn', !xv.ok && xv.cau === VD.CAU.chuaXoa.vi && (await demVideo()) === tong, xv.cau);

  ok('Học viên đã khóa (dang_lam = false): đọc 0 video', (await docDuoc(UID_HV_KHOA)) === 0);
  // Câu đọc nhân sự của layPhien (lib/phien.ts): dòng của chính mình, dang_lam = true. 0 dòng = không đăng nhập được.
  const phien = doc('web/src/lib/phien.ts');
  ok('layPhien đọc nhân sự theo auth_uid VÀ dang_lam = true',
    /\.from\('nhan_su'\)\s*\.select\('id, ho_ten, vai_tro, chi_nhanh_id'\)\s*\.eq\('auth_uid', uid\)\s*\.eq\('dang_lam', true\)/.test(phien));
  const dangDung = await duoi(UID_HV, `select vai_tro::text from nhan_su where auth_uid = $1 and dang_lam`, [UID_HV]);
  ok('Học viên đang dùng: câu đó ra đúng một dòng, vai hoc_vien — đăng nhập được',
    dangDung.loi === null && dangDung.rows.length === 1 && dangDung.rows[0].vai_tro === 'hoc_vien', vi(dangDung));
  const daKhoa = await duoi(UID_HV_KHOA, `select id from nhan_su where auth_uid = $1 and dang_lam`, [UID_HV_KHOA]);
  ok('Học viên đã khóa: câu đó ra 0 dòng — middleware đưa về trang đăng nhập', daKhoa.loi === null && daKhoa.rows.length === 0, vi(daKhoa));
});

// ===========================================================================
await nhom('2 · MỌI BẢNG, MỌI VIEW — ngoài video chỉ thấy hồ sơ của chính mình', async () => {
  const { rows: rel } = await db.query(`select c.relname as ten from pg_class c join pg_namespace n on n.oid = c.relnamespace
                                        where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm') order by 1`);
  const coDong = [], thay = {}, thayKhoa = {}, thayLa = {};
  for (const { ten } of rel) {
    if ((await db.query(`select count(*)::int n from ${ten}`)).rows[0].n > 0) coDong.push(ten);
    for (const [uid, dich] of [[UID_HV, thay], [UID_HV_KHOA, thayKhoa], [UID_LA, thayLa]]) {
      const r = await duoi(uid, `select count(*)::int n from ${ten}`);
      if (r.loi === null && r.rows[0].n > 0) dich[ten] = r.rows[0].n;
    }
  }
  const CAN_CO = ['khach_hang', 'luot_ghe', 'dat_ban', 'so_cai_diem', 'ban_an', 'kho_vi_tri', 'kho_cai_dat', 'kho_mat_hang',
    'kho_nha_cung_cap', 'kho_ipos_cau_hinh', 'ban_le_san_pham', 'mon_an', 'mau_tin', 'noi_dung_cong_bo', 'chi_nhanh', 'video_dao_tao'];
  ok(`Quét ${rel.length} bảng và view; ${coDong.length} cái có dữ liệu (CRM, kho, nội dung, bán lẻ, video)`,
    rel.length > 100 && coDong.length >= 25 && CAN_CO.every(t => coDong.includes(t)), CAN_CO.filter(t => !coDong.includes(t)).join(', '));
  const cap = o => JSON.stringify(Object.entries(o).sort());
  ok('Học viên thấy dòng ở ĐÚNG hai chỗ: video_dao_tao (đủ 2 video) và nhan_su (1 dòng)',
    cap(thay) === cap({ nhan_su: 1, video_dao_tao: 2 }), cap(thay));
  const minh = await duoi(UID_HV, `select auth_uid, vai_tro::text from nhan_su`);
  ok('…dòng nhan_su đó là của chính học viên (không thấy ai khác cùng chi nhánh)',
    minh.rows?.length === 1 && minh.rows[0].auth_uid === UID_HV, vi(minh));
  const cn = await duoi(UID_HV, `select count(*)::int n from chi_nhanh`);
  ok('Học viên không thấy chi nhánh nào (kể cả chi nhánh của mình)', cn.rows?.[0]?.n === 0, vi(cn));
  ok('Học viên đã khóa: chỉ còn dòng nhan_su của chính mình (policy nhan_su_doc không xét dang_lam), 0 video',
    cap(thayKhoa) === cap({ nhan_su: 1 }), cap(thayKhoa));
  ok('Học viên không thấy gì hơn một tài khoản KHÔNG phải nhân viên, ngoài video và hồ sơ của mình',
    Object.keys(thay).filter(t => !(t in thayLa)).sort().join() === 'nhan_su,video_dao_tao' && cap(thayLa) === cap({}), `${cap(thay)} · ${cap(thayLa)}`);
});

// ===========================================================================
// Hàm "tôi là ai": trả khác rỗng cho MỌI tài khoản đăng nhập, không đọc dữ liệu của ai khác.
const DANH_TINH = ['co_phien_dang_nhap', 'la_nhan_su_ngoai_crm', 'nhan_su_hien_tai'];
// Lịch trống của chi nhánh — đúng thứ anon đọc qua lich_trong_theo_ma ở trang Hỏi bàn (test-quyen-ghi-thang-crm.mjs
// xếp ba hàm này 'cong_khai'). Chỉ ra khác rỗng khi có tham số thật.
const CONG_KHAI = ['khung_gio_trong_ngay', 'lich_trong_theo_ngay', 'so_ban_con_trong'];
const RONG = v => v === null || v === undefined || ['false', '0', '{}', '[]', '', 'null'].includes(String(v)) || /^\(,*\)$/.test(String(v));
const UUID_LA = '00000000-0000-4000-8000-00000000f00d';

await nhom('3 · MỌI HÀM — bị từ chối hoặc trả rỗng; không ghi được gì', async () => {
  const truoc = await demMoiBang();
  const { rows: ham } = await db.query(`
    select p.proname as ten, p.prosecdef as definer, p.proretset as nhieu_dong, coalesce(p.proargnames, '{}') as ten_ts,
           array(select format_type(t, null) from unnest(p.proargtypes) t) as kieu
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
      and has_function_privilege('authenticated', p.oid, 'execute')
      and not has_function_privilege('anon', p.oid, 'execute')
      and p.prorettype <> 'trigger'::regtype
    order by 1`);
  const definer = ham.filter(h => h.definer);
  ok(`Quét ${ham.length} hàm authenticated gọi được mà anon không (${definer.length} hàm security definer — đi xuyên RLS)`,
    ham.length > 200 && definer.length > 150, `${ham.length} / ${definer.length}`);

  /** Tham số thật: chi nhánh Q1, nhân sự có thật, việc / khóa / bước có thật — đi qua được các bước kiểm dữ liệu. */
  const giaTri = (ten, kieu) => {
    if (kieu === 'uuid') return /chi_nhanh/.test(ten) ? `'${cnA.id}'::uuid` : /nhan_su/.test(ten) ? `'${nsId[UID.thuKhoA]}'::uuid` : `'${UUID_LA}'::uuid`;
    if (kieu === 'uuid[]') return `array['${nsId[UID.chu]}', '${nsId[UID.thuKhoA]}', '${nsId[UID.qlA]}']::uuid[]`;
    if (kieu === 'text') {
      if (/viec/.test(ten)) return `'xem'`;
      if (/khoa/.test(ten)) return `'dia_chi_hien_thi'`;
      if (/buoc/.test(ten)) return `'cong_thuc'`;
      if (/loc/.test(ten)) return `'tat_ca'`;
      if (/ngon_ngu/.test(ten)) return `'vi'`;
      if (/pin/.test(ten)) return `'${'a'.repeat(64)}'`;
      if (/pos_parent/.test(ten)) return `'BEEF'`;
      if (/pos_id/.test(ten)) return `'101'`;
      if (/^p_ten$/.test(ten)) return `'${cnA.id}/nhap/11111111-1111-4111-8111-111111111111/1.jpg'`;
      return `'x'`;
    }
    if (kieu === 'jsonb' || kieu === 'json') return `'[]'::${kieu}`;
    if (kieu === 'boolean') return 'true';
    if (/^(integer|bigint|smallint|numeric)$/.test(kieu)) return `1::${kieu}`;
    if (kieu === 'date') return 'hom_nay_vn()';
    if (kieu === 'time without time zone') return `'18:00'::time`;
    if (kieu === 'timestamp with time zone') return 'now()';
    if (kieu === 'vai_tro') return `'hoc_vien'::vai_tro`;
    if (kieu.endsWith('[]')) return `'{}'::${kieu}`;
    return `null::${kieu}`;
  };
  const goi = async (h, thamSo) => {
    const sql = h.nhieu_dong ? `select count(*)::int as v from ${h.ten}(${thamSo})` : `select ${h.ten}(${thamSo})::text as v`;
    return duoi(UID_HV, sql);
  };

  for (const [luot, taoThamSo] of [
    ['tham số null', h => h.kieu.map(k => `null::${k}`).join(', ')],
    ['tham số thật (chi nhánh Q1)', h => h.kieu.map((k, i) => giaTri(h.ten_ts[i] ?? '', k)).join(', ')],
  ]) {
    const tuChoi = [], rong = [], khac = {};
    for (const h of ham) {
      const r = await goi(h, taoThamSo(h));
      if (!h.definer) continue;   // security invoker: chạy dưới quyền học viên — RLS ở nhóm 2 đã chặn
      if (r.loi !== null) tuChoi.push(h.ten);
      else if (RONG(r.rows?.[0]?.v)) rong.push(h.ten);
      else khac[h.ten] = String(r.rows?.[0]?.v).slice(0, 60);
    }
    const ngoaiLe = Object.keys(khac).filter(t => !DANH_TINH.includes(t) && !CONG_KHAI.includes(t));
    ok(`Lượt ${luot}: ${definer.length} hàm definer — ${tuChoi.length} từ chối, ${rong.length} trả rỗng, còn lại chỉ hàm "tôi là ai" / lịch trống công khai`,
      ngoaiLe.length === 0 && DANH_TINH.every(t => t in khac) && tuChoi.length > 150,
      ngoaiLe.map(t => `${t} = ${khac[t]}`).join(' · ') || `thiếu: ${DANH_TINH.filter(t => !(t in khac)).join(', ')}`);
  }

  // Đọc tên từng hàm cho dễ đọc kết quả — hàm kho, CRM chính, bằng tham số thật.
  const tu = async (sql, p = []) => duoi(UID_HV, sql, p);
  const dv = await tu(`select kho_dem_viec($1) as r`, [cnA.id]);
  ok('kho_dem_viec(Q1): từ chối', dv.loi !== null, vi(dv));
  const viec = Object.keys(QUYEN_KHO);
  const q = await tu(`select bool_or(kho_co_quyen(v)) as co, bool_or(kho_duoc($2, v)) as duoc,
                             max(cardinality(kho_cn_duoc(v))) as cn from unnest($1::text[]) v`, [viec, cnA.id]);
  ok(`kho_co_quyen / kho_duoc(Q1) / kho_cn_duoc: không việc kho nào trong ${viec.length} việc`,
    q.loi === null && q.rows[0].co === false && q.rows[0].duoc === false && q.rows[0].cn === 0, vi(q));
  const ten = await tu(`select count(*)::int n from kho_ten_nhan_su($1)`, [Object.values(nsId)]);
  ok('kho_ten_nhan_su(mọi nhân sự): 0 tên', ten.rows?.[0]?.n === 0, vi(ten));
  const may = await tu(`select kho_ds_may($1)::text as r`, [cnA.id]);
  ok('kho_ds_may(Q1): rỗng', may.rows?.[0]?.r === '[]', vi(may));
  for (const [nhan, sql, p, mau] of [
    ['kho_ds_nhan_su_kho()', `select kho_ds_nhan_su_kho()`, [], /Chỉ chủ nhà hàng mới xem được danh sách này/],
    ['kho_them_nhan_su(…, hoc_vien, Q1)', `select kho_them_nhan_su($1, 'Lớp mới', 'hoc_vien', $2)`, [UUID_LA, cnA.id], /Chỉ chủ nhà hàng mới tạo được tài khoản/],
    ['kho_khoa_nhan_su(thủ kho Q1)', `select kho_khoa_nhan_su($1)`, [nsId[UID.thuKhoA]], /Chỉ chủ nhà hàng mới khóa được tài khoản/],
    ['kho_mo_nhan_su(chính mình)', `select kho_mo_nhan_su($1)`, [NS_HV], /Chỉ chủ nhà hàng mới mở lại được tài khoản/],
    ['kho_tien_do_thiet_lap(Q1)', `select kho_tien_do_thiet_lap($1)`, [cnA.id], null],
    ['kho_thong_bao(Q1)', `select kho_thong_bao($1)`, [cnA.id], null],
    ['suc_khoe_he_thong()', `select suc_khoe_he_thong()`, [], null],
    ['don_mua_thit_danh_sach(tất cả)', `select don_mua_thit_danh_sach('tat_ca')`, [], null],
    ['ban_le_danh_sach()', `select ban_le_danh_sach(null, null)`, [], null],
    ['ghi_luot_ghe(Q1)', `select * from ghi_luot_ghe($1, '0933333333', 500000::bigint)`, [cnA.id], null],
    ['tim_hoac_tao_khach(khách Q1)', `select * from tim_hoac_tao_khach('0911111111', 'Đổi tên')`, [], null],
    ['dat_noi_dung(công tắc Mua thịt về)', `select dat_noi_dung('hien_mua_thit_ve', p_bool := true, p_cong_bo := true)`, [], null],
  ]) {
    const r = await tu(sql, p);
    ok(`${nhan}: từ chối${mau ? ' bằng đúng câu của hàm' : ''}`, r.loi !== null && (!mau || mau.test(r.loi)), vi(r));
  }

  const sau = await demMoiBang();
  const doi = Object.keys(sau).filter(t => sau[t] !== truoc[t]).map(t => `${t}: ${truoc[t]} → ${sau[t]}`);
  ok('Sau cả loạt gọi hàm (hai lượt, mọi hàm, cả hàm security invoker): không bảng nào đổi số dòng', doi.length === 0, doi.join(', '));
});

// ===========================================================================
await nhom('4 · CHỦ TẠO, KHÓA, MỞ LẠI TÀI KHOẢN HỌC VIÊN — người khác không làm được', async () => {
  // Supabase có auth.users; khung test chưa có — bản tối thiểu kho_them_nhan_su cần (id, email), như test-kho-may-chung.mjs.
  await db.exec(`create table if not exists auth.users (id uuid primary key, email text)`);
  const UID_MOI = '00000000-0000-4000-8000-0000000000cb';
  await db.query(`insert into auth.users (id, email) values ($1, 'daotao@beeftown.vn')`, [UID_MOI]);
  const dongMoi = async () => (await db.query(`select count(*)::int n from nhan_su where auth_uid = $1`, [UID_MOI])).rows[0].n;
  const tao = ai => (ai === 'anon' ? duoiAnon : (s, p) => duoi(ai, s, p))(
    `select kho_them_nhan_su($1, 'Học viên đào tạo', 'hoc_vien', $2) as r`, [UID_MOI, cnA.id]);

  for (const [ten, ai] of [['Quản lý Q1', UID.qlA], ['Thủ kho Q1', UID.thuKhoA], ['Kế toán Q1', UID.keToanA], ['Học viên', UID_HV],
                           ['Tài khoản không có nhan_su', UID_LA]]) {
    const r = await tao(ai);
    ok(`${ten} KHÔNG tạo được tài khoản học viên`, r.loi !== null && /Chỉ chủ nhà hàng mới tạo được tài khoản/.test(r.loi), vi(r));
  }
  const anon = await tao('anon');
  ok('anon KHÔNG gọi được kho_them_nhan_su', anon.loi !== null && /permission denied/.test(anon.loi), vi(anon));
  ok('Chưa ai tạo được gì: không dòng nhan_su nào cho tài khoản đăng nhập mới', (await dongMoi()) === 0);

  const moi = await tao(UID.chu);
  const kq = moi.rows?.[0]?.r;
  ok('Chủ tạo được: vai hoc_vien, email lấy từ tài khoản đăng nhập, chi nhánh Q1',
    moi.loi === null && kq?.vai_tro === 'hoc_vien' && kq.email === 'daotao@beeftown.vn' && kq.chi_nhanh_id === cnA.id, vi(moi));
  const lai = await tao(UID.chu);
  ok('Tạo lần hai cùng tài khoản đăng nhập (bấm đúp): từ chối "đã gắn", vẫn MỘT dòng nhan_su',
    lai.loi !== null && /đã gắn với một nhân sự khác/.test(lai.loi) && (await dongMoi()) === 1, vi(lai));
  ok('Tài khoản vừa tạo đọc được video ngay', (await docDuoc(UID_MOI)) === 2);

  // Màn Nhân viên gọi qua lib/kho/nhan-vien.ts — client giả mang phiên từng người.
  const chu = clientCua(UID.chu);
  const dong = (await NV.docDsNhanVien(chu)).find(n => n.id === kq?.id);
  ok('Màn Nhân viên (docDsNhanVien) liệt kê tài khoản học viên để chủ khóa / mở', dong?.vai_tro === 'hoc_vien' && dong.dang_lam === true,
    JSON.stringify(dong));
  let dsHv = null;
  try { await NV.docDsNhanVien(clientCua(UID_MOI)); dsHv = 'ĐỌC ĐƯỢC'; } catch (e) { dsHv = e; }
  ok('Học viên KHÔNG đọc được danh sách nhân viên', dsHv !== 'ĐỌC ĐƯỢC', String(dsHv?.message ?? dsHv));
  for (const [ten, ai] of [['Quản lý Q1', UID.qlA], ['Học viên', UID_MOI]]) {
    const k = await NV.khoaNhanVien(clientCua(ai), kq.id);
    ok(`${ten} KHÔNG khóa được tài khoản học viên`, !k.ok && /Chỉ chủ nhà hàng mới khóa được tài khoản/.test(k.cau), k.cau);
  }
  const khoa = await NV.khoaNhanVien(chu, kq.id);
  ok('Chủ khóa khi hết buổi: "Đã khóa tài khoản", đọc 0 video ngay', khoa.ok && /^Đã khóa tài khoản/.test(khoa.cau) && (await docDuoc(UID_MOI)) === 0,
    khoa.cau);
  const khoa2 = await NV.khoaNhanVien(chu, kq.id);
  ok('Khóa lần hai (bấm đúp): vẫn khóa, vẫn một dòng', khoa2.ok && (await dongMoi()) === 1
    && (await db.query(`select dang_lam from nhan_su where id = $1`, [kq.id])).rows[0].dang_lam === false, khoa2.cau);
  const moHv = await NV.moNhanVien(clientCua(UID.qlA), kq.id);
  ok('Quản lý KHÔNG mở lại được', !moHv.ok, moHv.cau);
  const mo = await NV.moNhanVien(chu, kq.id);
  ok('Chủ mở lại cho buổi sau: đọc được video lại', mo.ok && (await docDuoc(UID_MOI)) === 2, mo.cau);

  // Danh sách vai của web = danh sách của database.
  const vaiTrong = async (ham, mau) => {
    const { rows: [{ src }] } = await db.query(`select prosrc as src from pg_proc where proname = $1`, [ham]);
    return [...(src.match(mau)?.[1] ?? '').matchAll(/'([a-z_]+)'/g)].map(m => m[1]);
  };
  const dsTao = await vaiTrong('kho_them_nhan_su', /p_vai_tro not in \(([^)]*)\)/);
  ok('VAI_TAO_DUOC (ô Vai của màn Nhân viên) = đúng danh sách kho_them_nhan_su nhận, có hoc_vien',
    bang(NV.VAI_TAO_DUOC, dsTao) && dsTao.includes('hoc_vien'), dsTao.join(', '));
  for (const [ham, mau] of [['kho_khoa_nhan_su', /vai_tro not in \(([^)]*)\)/], ['kho_mo_nhan_su', /vai_tro not in \(([^)]*)\)/],
                            ['kho_ds_nhan_su_kho', /vai_tro in \(([^)]*)\)/]]) {
    const ds = await vaiTrong(ham, mau);
    ok(`${ham}: quản lý và đúng các vai tạo được ở màn này (có hoc_vien)`, bang(ds, ['quan_ly', ...NV.VAI_TAO_DUOC]), ds.join(', '));
  }
  const f = NV.docFormNhanVien(formTu({ ho_ten: ' Học viên  đào tạo ', email: 'DaoTao@Beeftown.vn', vai_tro: 'hoc_vien', chi_nhanh_id: cnA.id }), [cnA.id]);
  ok('Form Thêm nhân viên nhận vai hoc_vien (họ tên gọn, email chữ thường)',
    f?.vai_tro === 'hoc_vien' && f.ho_ten === 'Học viên đào tạo' && f.email === 'daotao@beeftown.vn', JSON.stringify(f));
  const ten = NV.TEN_VAI_NHAN_VIEN_NB.hoc_vien;
  ok('Tên vai nói luôn tài khoản làm được gì, hai thứ tiếng, bản tiếng Anh không còn chữ Việt',
    ten?.vi === 'Học viên — chỉ xem video đào tạo' && ten.en === 'Trainee — training videos only' && !VIET.test(ten.en), JSON.stringify(ten));

  const trangNv = doc('web/src/pages/noi-bo/kho/cai-dat/nhan-vien.astro');
  ok('Ô Vai của màn Nhân viên đọc VAI_TAO_DUOC — học viên có trong danh sách chọn',
    /\{VAI_TAO_DUOC\.map\(v => <option value=\{v\} selected=\{giu\.vai_tro === v\}>\{tenVai\(v\)\}<\/option>\)\}/.test(trangNv));
  ok('Tạo xong: màn nói tài khoản chỉ mở trang Video đào tạo, cả lớp dùng chung được, hết buổi thì khóa — hai thứ tiếng; ba mẩu câu cùng một dòng, mẩu sau mở đầu bằng dấu cách (compressHTML)',
    /moiTao\.vai_tro === 'hoc_vien' \? \(\s*<p class="kho-phu">\{t\.hocVien1\}\{moiTao\.can_xac_nhan && t\.xacNhan\}\{t\.hocVien2\}<\/p>/.test(trangNv)
    && /hocVien1: \{\s*vi: 'Tài khoản học viên chỉ mở được trang Video đào tạo\./.test(trangNv)
    && /en: 'A trainee account opens only the Training videos page\./.test(trangNv)
    && /hocVien2: \{\s*vi: ' Hết buổi đào tạo thì bấm "Khóa tài khoản"/.test(trangNv) && /en: ' When the training is over, press "Lock account"/.test(trangNv)
    && /xacNhan: \{\s*vi: ' Trước đó/.test(trangNv));
  ok('Nhãn vai ở đầu trang /noi-bo: Học viên / Trainee', /hoc_vien:\s*\{ vi: 'Học viên',\s*en: 'Trainee' \}/.test(doc('web/src/layouts/NoiBo.astro')));
});

// ===========================================================================
await nhom('5 · MIGRATION — 0118 chạy riêng, 0119 không đụng tường ngăn', async () => {
  const vai = (await db.query(`select unnest(enum_range(null::vai_tro))::text as v`)).rows.map(r => r.v);
  ok('0118: vai_tro có hoc_vien', vai.includes('hoc_vien'), vai.join(', '));
  const f18 = readFileSync(join(MIG, '0118_hoc_vien_vai.sql'), 'utf8').replace(/--[^\n]*/g, '').trim();
  ok('0118 chỉ có đúng một lệnh thêm enum (chạy riêng, trước 0119)', f18 === `alter type vai_tro add value if not exists 'hoc_vien';`, f18.slice(0, 200));
  const f19 = readFileSync(join(MIG, '0119_hoc_vien_dao_tao.sql'), 'utf8').replace(/--[^\n]*/g, '');
  ok('0119 không thêm giá trị enum', !/alter\s+type/i.test(f19));
  const ngoaiThan = f19.replace(/\$\$[\s\S]*?\$\$/g, '');
  ok('0119: câu delete chỉ nằm trong THÂN hàm (kho_khoa_nhan_su, chép từ 0034) — chạy migration không xóa dòng nào',
    !/\bdelete\s+from\b/i.test(ngoaiThan) && /\bdelete\s+from\s+kho_may_nguoi\b/i.test(f19));

  for (const ham of ['duoc_truy_cap_chi_nhanh', 'crm_cn_duoc', 'la_chu_so_huu', 'kho_vai_duoc', 'kho_cn_duoc', 'kho_co_quyen', 'kho_may_nguoi_hop_le']) {
    const { rows } = await db.query(`select prosrc from pg_proc where proname = $1`, [ham]);
    ok(`${ham} không nhắc tới hoc_vien (tường ngăn CRM, bảng quyền kho)`, rows.length > 0 && rows.every(r => !r.prosrc.includes('hoc_vien')));
  }
  const { rows: [{ n }] } = await db.query(`select count(*)::int as n from unnest($1::text[]) v where 'hoc_vien'::vai_tro = any(kho_vai_duoc(v))`,
    [Object.keys(QUYEN_KHO)]);
  ok('hoc_vien không có việc kho nào — database (kho_vai_duoc) và bản soi gương của web (QUYEN_KHO)',
    n === 0 && Object.values(QUYEN_KHO).every(ds => !ds.includes('hoc_vien')), `${n} việc`);
  const { rows: pl } = await db.query(`select policyname, coalesce(qual, '') || coalesce(with_check, '') as bt from pg_policies
                                       where schemaname = 'public' and (coalesce(qual, '') || coalesce(with_check, '')) like '%hoc_vien%'`);
  ok('Chỉ MỘT policy trong cả database nhắc tới hoc_vien: video_dao_tao_doc', pl.map(p => p.policyname).join() === 'video_dao_tao_doc',
    pl.map(p => p.policyname).join(', '));
});

// ===========================================================================
// Bảng đường dẫn dựng từ thư mục pages như Astro (giống test-noi-bo-dieu-huong.mjs): trang thêm sau này tự vào phép thử.
function moiFile(thuMuc) {
  return readdirSync(thuMuc).flatMap(t => {
    const p = join(thuMuc, t);
    return statSync(p).isDirectory() ? moiFile(p) : [p];
  });
}
const TRANG = join(SRC, 'pages');
const DUONG_NOI_BO = moiFile(join(TRANG, 'noi-bo')).filter(p => /\.(astro|ts)$/.test(p)).map(p => {
  const d = '/' + relative(TRANG, p).split(sep).join('/');
  return d.replace(/\.(astro|ts)$/, '').replace(/\/index$/, '').replace(/\[[^\]/]+\]/g, '11111111-1111-4111-8111-111111111111');
});

await nhom('6 · WEB — học viên chỉ ở trang Video đào tạo; vai khác không bị đụng', async () => {
  const { chuyenHuongHocVien, DUONG_DAO_TAO, VAI_HOC_VIEN } = NB;
  ok('Đường dẫn của học viên là trang Video đào tạo, vai là hoc_vien', DUONG_DAO_TAO === '/noi-bo/dao-tao' && VAI_HOC_VIEN === 'hoc_vien'
    && VD.DUONG_DAO_TAO === DUONG_DAO_TAO);
  const moChoMoiNguoi = ['/noi-bo/dang-nhap', '/noi-bo/dang-xuat'];
  const canChan = DUONG_NOI_BO.filter(d => d !== DUONG_DAO_TAO && !moChoMoiNguoi.includes(d));
  const lot = canChan.filter(d => chuyenHuongHocVien('hoc_vien', d) !== DUONG_DAO_TAO);
  ok(`MỌI trang /noi-bo khác (${canChan.length} trang, dựng từ thư mục pages — kho, Tất cả chức năng, máy dùng chung, file tải về) → về /noi-bo/dao-tao`,
    canChan.length >= 80 && lot.length === 0 && ['/noi-bo', '/noi-bo/kho', '/noi-bo/chuc-nang', '/noi-bo/kho/may', '/noi-bo/kho/khac',
      '/noi-bo/kho/cai-dat/nhan-vien', '/noi-bo/kho/cong-no/misa.csv'].every(d => canChan.includes(d)), lot.join(', '));
  const THEM = ['/noi-bo/', '/noi-bo/kho/', '/noi-bo/dao-tao/abc', '/noi-bo/dao-taox', '/noi-bo-abc', '/noi-bo/khong-co-trang-nay'];
  ok('Đường dẫn lạ (trang chưa có, /noi-bo/dao-tao/abc, /noi-bo-abc) cũng về /noi-bo/dao-tao',
    THEM.every(d => chuyenHuongHocVien('hoc_vien', d) === DUONG_DAO_TAO), THEM.filter(d => chuyenHuongHocVien('hoc_vien', d) !== DUONG_DAO_TAO).join(', '));
  ok('Đúng trang Video đào tạo (có hay không có "/" cuối): ở lại — không vòng chuyển hướng',
    chuyenHuongHocVien('hoc_vien', DUONG_DAO_TAO) === null && chuyenHuongHocVien('hoc_vien', DUONG_DAO_TAO + '/') === null);
  ok('Trang Video đào tạo cho học viên ở lại (VAI_XEM_DAO_TAO có hoc_vien) — không thì /noi-bo/dao-tao → /noi-bo → /noi-bo/dao-tao mãi',
    VD.VAI_XEM_DAO_TAO.includes('hoc_vien')
    && /if \(!VAI_XEM_DAO_TAO\.includes\(nhanSu\.vai_tro\)\) return Astro\.redirect\('\/noi-bo', 302\)/.test(doc('web/src/pages/noi-bo/dao-tao.astro')));
  const VAI_KHAC = [...NB.VAI_NGUOI, 'may_chung', 'may_ipos', 'may_zalo', 'may_messenger', 'may_bao_dong', 'may_vnpay', '', null, undefined];
  const dung = VAI_KHAC.flatMap(v => [...DUONG_NOI_BO, ...THEM].filter(d => chuyenHuongHocVien(v, d) !== null).map(d => `${v}:${d}`));
  ok('Vai khác (bảy vai người, sáu vai máy, chưa có vai): không trang nào bị chuyển', dung.length === 0, dung.slice(0, 5).join(', '));

  // middleware.ts: xét học viên SAU khi đọc được phiên, TRƯỚC next() — một chỗ cho mọi trang.
  const mw = doc('web/src/middleware.ts');
  const vt = s => mw.indexOf(s);
  const iMo = vt('if (MO_CHO_MOI_NGUOI.includes(duong)) return next();');
  const iBan = vt('if (phien === QUA_TAI)');
  const iChua = vt('if (!phien)');
  const iPhien = vt('context.locals.phien = phien;');
  const iXet = vt('const veDaoTao = chuyenHuongHocVien(phien.nhanSu.vai_tro, duong);');
  const iVe = vt('if (veDaoTao) return context.redirect(veDaoTao, 302);');
  const iNext = mw.lastIndexOf('return next();');
  ok('middleware: nạp chuyenHuongHocVien từ lib/dieu-huong-noi-bo', /import \{ chuyenHuongHocVien \} from '\.\/lib\/dieu-huong-noi-bo';/.test(mw));
  ok('middleware: xét học viên sau "Supabase bận" và "chưa đăng nhập", ngay sau khi có phiên, trước next() cuối cùng',
    [iMo, iBan, iChua, iPhien, iXet, iVe, iNext].every(i => i > 0) && iMo < iBan && iBan < iChua && iChua < iPhien && iPhien < iXet
    && iXet < iVe && iVe < iNext && !/return next\(\)/.test(mw.slice(iPhien, iVe)), [iMo, iBan, iChua, iPhien, iXet, iVe, iNext].join(' < '));
  ok('middleware: so trên đường dẫn đã bỏ "/" cuối, và đăng nhập / đăng xuất mở cho mọi người TRƯỚC khi đọc phiên (học viên đăng xuất được)',
    /const duong = context\.url\.pathname\.replace\(\/\\\/\$\/, ''\) \|\| '\/';/.test(mw)
    && /const MO_CHO_MOI_NGUOI = \['\/noi-bo\/dang-nhap', '\/noi-bo\/dang-xuat'\];/.test(mw));
  // Đăng nhập xong mọi vai về /noi-bo/kho; middleware chuyển học viên tiếp sang trang Video đào tạo.
  const dn = doc('web/src/pages/noi-bo/dang-nhap.astro');
  ok('Đăng nhập xong: trang đăng nhập về /noi-bo/kho (hoặc /noi-bo nếu đã có phiên) — với học viên cả hai chuyển tiếp tới /noi-bo/dao-tao',
    /if \(!loi\) return Astro\.redirect\('\/noi-bo\/kho', 302\)/.test(dn) && /return Astro\.redirect\('\/noi-bo', 302\)/.test(dn)
    && chuyenHuongHocVien('hoc_vien', '/noi-bo/kho') === DUONG_DAO_TAO && chuyenHuongHocVien('hoc_vien', '/noi-bo') === DUONG_DAO_TAO);

  // Thanh menu: chỉ Đào tạo. Một mục thì khung NoiBo không vẽ thanh nào; đầu trang còn đổi tiếng và Đăng xuất.
  const ma = ds => ds.map(m => m.ma).join();
  ok('Menu nhà hàng của học viên: đúng một mục — Video đào tạo; không "Tất cả chức năng"',
    ma(NB.mucNoiBoCuaVai('hoc_vien')) === 'dao_tao' && ma(NB.thanhTrenNoiBo('hoc_vien')) === 'dao_tao'
    && ma(NB.thanhDayNoiBo('hoc_vien')) === 'dao_tao' && !NB.canTrangTatCa('hoc_vien'),
    `${ma(NB.thanhTrenNoiBo('hoc_vien'))} · ${ma(NB.thanhDayNoiBo('hoc_vien'))}`);
  const noiBo = doc('web/src/layouts/NoiBo.astro');
  ok('Khung NoiBo: thanh trên và thanh đáy chỉ vẽ khi có hơn một mục — học viên không thấy thanh nào',
    /\{nhanSu && tren\.length > 1 && \(/.test(noiBo) && /\{nhanSu && day\.length > 1 && \(/.test(noiBo));
  ok('Đầu trang của học viên còn nút English / Tiếng Việt và Đăng xuất',
    /<a href=\{doiTieng\.link\} class="nb-nut-nho nb-doi-tieng"/.test(noiBo)
    && /\{nhanSu && \(\s*<form method="POST" action="\/noi-bo\/dang-xuat" class="nb-ai">/.test(noiBo));
  const linkBanDo = trang => BD.banDoChucNang('hoc_vien', trang).flatMap(n => n.muc.map(m => m.link));
  ok('Menu bên kho và trang Tất cả chức năng / Khác: học viên không có mục kho nào, mục nhà hàng duy nhất là Video đào tạo',
    KDH.mucCuaVai('hoc_vien').length === 0 && KDH.nhomCuaVai('hoc_vien').length === 0
    && KDH.MUC_CRM.filter(m => m.vai.includes('hoc_vien')).map(m => m.link).join() === DUONG_DAO_TAO
    && [...linkBanDo('kho'), ...linkBanDo('nha_hang')].every(l => l === DUONG_DAO_TAO));

  // Không nút sửa / xóa: học viên không thuộc VAI_SUA_DAO_TAO; trang chỉ vẽ mục sửa khi duocSua.
  const daoTao = doc('web/src/pages/noi-bo/dao-tao.astro');
  ok('Trang Video đào tạo: học viên không thấy mục "Sửa tên, mô tả hoặc xóa video"; gửi form thẳng thì nhận câu không có quyền',
    !VD.VAI_SUA_DAO_TAO.includes('hoc_vien') && /const duocSua = VAI_SUA_DAO_TAO\.includes\(nhanSu\.vai_tro\);/.test(daoTao)
    && /\{duocSua && \(\s*<details class="vd-sua"/.test(daoTao) && /\} else if \(!duocSua\) \{\s*bao = \{ ok: false, cau: CAU\.khongQuyen\[nn\] \};/.test(daoTao));
});

// ===========================================================================
await nhom('7 · SỔ KHO — không lệch', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('kho_doi_soat_ton() rỗng', rows.length === 0, JSON.stringify(rows).slice(0, 300));
});

process.exit(ketThuc('TÀI KHOẢN HỌC VIÊN'));
