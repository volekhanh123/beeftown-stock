/**
 * BEEFTOWN — Kiểm thử: tin tuyển dụng công khai trả ngày công bố (0127)
 * =====================================================================
 *
 *     node test/test-tuyen-dung-cong-bo-luc.mjs
 *
 * Việc của 0127: tin_tuyen_dung_cong_khai() trả thêm cột cong_bo_luc để web dựng JSON-LD JobPosting với datePosted THẬT
 * (web/src/lib/tuyen-dung.ts → tinTuyenDungJsonLd; web không đoán ngày). Cột có từ 0012, trigger ghi mốc từ 0027 / 0028.
 *
 * Bốn điều phải đúng:
 *   1. Hàm trả cong_bo_luc đúng giá trị của bảng, ở CUỐI kết quả; mọi cột cũ giữ nguyên tên và thứ tự.
 *   2. Không lộ thêm: tin nháp / đã duyệt chưa lên sóng / hết hạn nộp / công tắc tắt vẫn không ra, dù cột có giá trị;
 *      không cột nào khác (người đăng, người duyệt…) ra theo.
 *   3. Tin chưa có mốc (đăng trước 0027) trả null — không bịa — và không ra JobPosting; tin có mốc ra đúng một JobPosting
 *      với datePosted theo NGÀY VIỆT NAM (17:30 UTC ngày 20 = 00:30 ngày 21 giờ VN).
 *   4. Tạo lại hàm (drop + create vì RETURNS TABLE đổi) không đánh rơi quyền: ACL của hàm trước và sau 0127 GIỐNG HỆT
 *      — anon gọi được, public không, authenticated như cũ; chạy file hai lần cũng không lỗi.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem, dungDatabaseTrong } from './kho-chung.mjs';
import { tinTuyenDungJsonLd } from '../../web/src/lib/tuyen-dung.ts';
import { diaChiCoCauTruc } from '../../web/src/lib/trang-cong-khai.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEP_0127 = '0127_tin_tuyen_dung_tra_cong_bo_luc.sql';
const SQL_0127 = readFileSync(join(__dirname, '..', 'supabase', 'migrations', TEP_0127), 'utf8');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — TIN TUYỂN DỤNG CÔNG KHAI TRẢ NGÀY CÔNG BỐ (0127)');

/** Cột của hàm TRƯỚC 0127 (0036), đúng thứ tự — 0127 chỉ được thêm cong_bo_luc vào cuối. */
const COT_CU = ['ma', 'ten', 'bo_phan', 'cap_bac', 'loai_hop_dong', 'so_luong', 'mo_ta', 'yeu_cau', 'quyen_loi', 'ca_lam',
  'luong_tu', 'luong_den', 'luong_don_vi', 'han_nop', 'hoi_email', 'hoi_nam_sinh', 'hoi_ca_lam', 'hoi_gioi_thieu',
  'hoi_kinh_nghiem', 'hoi_cv'];

const BOI_CANH = {
  trangUrl: 'https://beeftown.vn/tuyen-dung', tenToChuc: 'Beeftown', goc: 'https://beeftown.vn/',
  diaChi: diaChiCoCauTruc({}),
};

const MO_TA = 'Phục vụ khách tại sảnh, hướng dẫn khách nướng lượt đầu.';
const YEU_CAU = 'Chăm chỉ, giao tiếp tốt. Không cần kinh nghiệm.';

/** ACL của hàm: mỗi dòng "người nhận:quyền", public ghi là "public". Sắp xếp để so hai lần chụp. */
async function chupQuyen(db) {
  const { rows } = await db.query(`
    select coalesce(r.rolname, 'public') || ':' || a.privilege_type as dong
    from pg_proc p
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    left join pg_roles r on r.oid = a.grantee
    where p.proname = 'tin_tuyen_dung_cong_khai' and p.pronamespace = 'public'::regnamespace
    order by 1`);
  return rows.map(r => r.dong);
}

// ===========================================================================
await nhom('1 · QUYỀN SAU KHI TẠO LẠI HÀM: ACL TRƯỚC VÀ SAU 0127 GIỐNG HỆT', async () => {
  // Database dừng ở 0126 (hàm bản 0036 + quyền như production), rồi chạy đúng file 0127.
  const { db } = await dungDatabaseTrong({ den: 126 });
  const truoc = await chupQuyen(db);
  const cotTruoc = (await db.query(
    `select pg_get_function_result('tin_tuyen_dung_cong_khai(text)'::regprocedure) as kq`)).rows[0].kq;
  ok('Trước 0127: hàm chưa có cong_bo_luc (đúng hiện trạng production)', !/cong_bo_luc/.test(cotTruoc), cotTruoc);
  ok('Trước 0127: anon gọi được, public thì không', truoc.some(d => d.startsWith('anon:EXECUTE')) && !truoc.includes('public:EXECUTE'),
     truoc.join(' · '));

  await db.exec(SQL_0127);
  const sau = await chupQuyen(db);
  ok('Sau 0127: ACL của hàm giống hệt trước (không mất, không thêm quyền nào)',
     JSON.stringify(sau) === JSON.stringify(truoc), `trước: ${truoc.join(' · ')} — sau: ${sau.join(' · ')}`);
  ok('Sau 0127: anon vẫn gọi được; public không gọi được',
     (await db.query(`select has_function_privilege('anon', 'tin_tuyen_dung_cong_khai(text)', 'execute') as co`)).rows[0].co === true
       && !sau.includes('public:EXECUTE'));
  ok('Sau 0127: authenticated giữ đúng như trước',
     sau.includes('authenticated:EXECUTE') === truoc.includes('authenticated:EXECUTE'));

  const cotSau = (await db.query(
    `select pg_get_function_result('tin_tuyen_dung_cong_khai(text)'::regprocedure) as kq`)).rows[0].kq;
  ok('Sau 0127: hàm có cong_bo_luc kiểu timestamptz, đứng cuối', /cong_bo_luc timestamp with time zone\)$/.test(cotSau), cotSau);
  ok('Chữ ký tham số giữ nguyên (p_ngon_ngu text default \'vi\') — lời gọi cũ vẫn chạy',
     (await db.query(`select pg_get_function_arguments('tin_tuyen_dung_cong_khai(text)'::regprocedure) as a`)).rows[0].a
       === "p_ngon_ngu text DEFAULT 'vi'::text");

  let loiLanHai = null;
  try { await db.exec(SQL_0127); } catch (e) { loiLanHai = e.message; }
  ok('Chạy file lần hai không lỗi và quyền không đổi', loiLanHai === null && JSON.stringify(await chupQuyen(db)) === JSON.stringify(truoc),
     loiLanHai ?? '');
  ok('Hàm vẫn security definer có set search_path = public',
     (await db.query(`select prosecdef, proconfig from pg_proc where proname = 'tin_tuyen_dung_cong_khai'`)).rows
       .every(r => r.prosecdef === true && (r.proconfig ?? []).includes('search_path=public')));
  await db.close();
});

// ===========================================================================
await nhom('2 · HÀM TRẢ NGÀY CÔNG BỐ, KHÔNG LỘ THÊM GÌ, RA ĐÚNG JOBPOSTING', async () => {
  const { db } = await dungDatabaseTrong();
  const anon = async (sql, params = []) => {
    await db.exec(`set role anon`);
    try { return (await db.query(sql, params)).rows; } finally { await db.exec(`reset role`); }
  };

  const { rows: [cn] } = await db.query(`insert into chi_nhanh (ma, ten) values ('q1', 'Beeftown Quận 1') returning id`);
  await db.query(`select tao_tin_tuyen_dung_mau($1)`, [cn.id]);
  await db.query(`insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai) values ('hien_tuyen_dung', 'bool', true, 'da_cong_bo')`);

  // Sáu tin, mỗi tin một ca. Tin đăng thật (trang_thai da_cong_bo): trigger tự ghi cong_bo_luc = now().
  for (const ma of ['nhan-vien-sanh', 'nhan-vien-bep', 'quan-ly-cua-hang', 'to-truong-sanh']) {
    await db.query(`update vi_tri_tuyen_dung set mo_ta_vi = $2, yeu_cau_vi = $3, trang_thai = 'da_cong_bo' where ma = $1`, [ma, MO_TA, YEU_CAU]);
  }
  const { rows: [{ truocKhiDat }] } = await db.query(
    `select cong_bo_luc is not null as "truocKhiDat" from vi_tri_tuyen_dung where ma = 'nhan-vien-sanh'`);
  ok('Trigger 0028 tự ghi cong_bo_luc khi tin lên sóng (nền tảng của cột mới)', truocKhiDat === true);

  // Đặt mốc cố định để so chính xác: 20/11 03:12:45.123456 UTC = 10:12 giờ VN cùng ngày; 17:30 UTC ngày 20 = 00:30 ngày 21 giờ VN.
  await db.query(`update vi_tri_tuyen_dung set cong_bo_luc = '2026-11-20T03:12:45.123456+00:00' where ma = 'nhan-vien-sanh'`);
  await db.query(`update vi_tri_tuyen_dung set cong_bo_luc = '2026-11-20T17:30:00+00:00' where ma = 'nhan-vien-bep'`);
  // Tin đăng trước khi hệ thống ghi mốc (0027): cong_bo_luc chưa từng có giá trị.
  await db.query(`update vi_tri_tuyen_dung set cong_bo_luc = null where ma = 'quan-ly-cua-hang'`);
  // Hết hạn nộp từ hôm qua (giờ VN): không ra khỏi hàm dù cột có giá trị.
  await db.query(`update vi_tri_tuyen_dung set han_nop = hom_nay_vn() - 1, cong_bo_luc = '2026-10-01T00:00:00+00:00' where ma = 'to-truong-sanh'`);
  // Chưa lên sóng nhưng cột lỡ có giá trị (đã gỡ về nháp / mới duyệt): không ra.
  await db.query(`update vi_tri_tuyen_dung set mo_ta_vi = $1, yeu_cau_vi = $2, trang_thai = 'da_duyet', cong_bo_luc = '2026-09-09T00:00:00+00:00' where ma = 'quan-ly-sanh'`, [MO_TA, YEU_CAU]);
  await db.query(`update vi_tri_tuyen_dung set cong_bo_luc = '2026-09-10T00:00:00+00:00' where ma = 'dau-moi-marketing'`);

  const tin = await anon(`select * from tin_tuyen_dung_cong_khai()`);
  const ma = tin.map(t => t.ma).sort();
  ok('anon thấy đúng ba tin đang đăng còn hạn: sảnh, bếp, quản lý cửa hàng',
     JSON.stringify(ma) === JSON.stringify(['nhan-vien-bep', 'nhan-vien-sanh', 'quan-ly-cua-hang']), ma.join(', '));
  ok('Không tin hết hạn nộp, không tin đã duyệt chưa lên sóng, không tin nháp — dù cột cong_bo_luc có giá trị',
     !ma.includes('to-truong-sanh') && !ma.includes('quan-ly-sanh') && !ma.includes('dau-moi-marketing'));

  const sanh = tin.find(t => t.ma === 'nhan-vien-sanh');
  ok('cong_bo_luc của sảnh đúng mốc trong bảng, chính xác tới micro giây',
     sanh.cong_bo_luc instanceof Date && sanh.cong_bo_luc.getTime() === Date.parse('2026-11-20T03:12:45.123Z'),
     String(sanh.cong_bo_luc));
  // Đọc bảng bằng chủ database (anon không có quyền bảng — đúng thiết kế): so ba dòng hàm trả với ba dòng bảng.
  ok('Hàm và bảng cùng một giờ (so tới micro giây trong database)',
     (await db.query(`select count(*)::int as n from tin_tuyen_dung_cong_khai() t join vi_tri_tuyen_dung v using (ma)
                      where t.cong_bo_luc is not distinct from v.cong_bo_luc`)).rows[0].n === 3);
  ok('Tin chưa từng có mốc trả null, không bịa giờ (không now(), không created_at)',
     tin.find(t => t.ma === 'quan-ly-cua-hang').cong_bo_luc === null);

  // Không lộ thêm: hai mươi cột cũ nguyên tên nguyên thứ tự ở đầu, cong_bo_luc có mặt. Cố ý KHÔNG đòi "đúng 21 cột":
  // migration sau thêm cột cho hàm này là việc hợp lệ, không phải lỗi của 0127. Cột nào thêm sau phải qua mắt
  // phép thử "không cột riêng nào theo ra" dưới đây.
  const cot = Object.keys(tin[0]);
  ok('20 cột cũ nguyên tên, nguyên thứ tự ở đầu; có cong_bo_luc',
     JSON.stringify(cot.slice(0, COT_CU.length)) === JSON.stringify(COT_CU) && cot.includes('cong_bo_luc'), cot.join(','));
  ok('Không cột riêng nào theo ra (người đăng, người duyệt, mã chi nhánh, giờ sửa, lương đề xuất…)',
     !cot.some(c => /nguoi|duyet|chi_nhanh|created|updated|de_xuat|ghi_chu/.test(c)));

  // Công tắc tắt: không ra gì, cong_bo_luc không làm hàm ra dòng nào.
  // Giá trị đã công bố không sửa được (0010): thu hồi rồi thêm dòng mới, như test-tuyen-dung.mjs.
  await db.query(`update noi_dung_cong_bo set trang_thai = 'da_thu_hoi' where khoa = 'hien_tuyen_dung' and trang_thai = 'da_cong_bo'`);
  ok('Công tắc hien_tuyen_dung thu hồi: hàm trả 0 dòng dù tin còn đăng và có cong_bo_luc',
     (await anon(`select * from tin_tuyen_dung_cong_khai()`)).length === 0);
  await db.query(`insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai, cong_bo_luc)
                  values ('hien_tuyen_dung', 'bool', true, 'da_cong_bo', now())`);

  // Đăng lại tin đã gỡ là một lần đăng mới: mốc đổi sang giờ mới (0028), cột công khai theo kịp.
  await db.query(`update vi_tri_tuyen_dung set trang_thai = 'nhap' where ma = 'nhan-vien-sanh'`);
  ok('Tin gỡ về nháp: biến khỏi hàm', !(await anon(`select ma from tin_tuyen_dung_cong_khai()`)).some(t => t.ma === 'nhan-vien-sanh'));
  await db.query(`update vi_tri_tuyen_dung set trang_thai = 'da_cong_bo' where ma = 'nhan-vien-sanh'`);
  const lai = (await anon(`select cong_bo_luc from tin_tuyen_dung_cong_khai() where ma = 'nhan-vien-sanh'`))[0];
  ok('Đăng lại: hàm trả mốc MỚI (sau mốc cũ 20/11/2026), không giữ giờ cũ', lai.cong_bo_luc.getTime() > Date.parse('2026-11-21T00:00:00Z'),
     String(lai.cong_bo_luc));
  await db.query(`update vi_tri_tuyen_dung set cong_bo_luc = '2026-11-20T03:12:45.123456+00:00' where ma = 'nhan-vien-sanh'`);

  // Đường thật tới web: PostgREST trả mỗi dòng dạng JSON (timestamptz thành chuỗi ISO) → tinTuyenDungJsonLd.
  const json = (await anon(`select to_jsonb(t) as j from tin_tuyen_dung_cong_khai() t order by t.ma`)).map(r => r.j);
  ok('Dòng JSON mang cong_bo_luc dạng chuỗi ISO (như PostgREST)', typeof json[0].cong_bo_luc === 'string' || json[0].cong_bo_luc === null,
     JSON.stringify(json[0].cong_bo_luc));
  const jobs = tinTuyenDungJsonLd(json, BOI_CANH);
  ok('Ba tin đang đăng, một tin chưa có mốc → đúng hai JobPosting (tin không mốc không bị đoán ngày)',
     jobs.length === 2 && jobs.every(j => j['@type'] === 'JobPosting'), String(jobs.length));
  const ngay = Object.fromEntries(jobs.map(j => [j.identifier.value, j.datePosted]));
  ok('datePosted của sảnh = 2026-11-20 (10:12 giờ VN cùng ngày)', ngay['nhan-vien-sanh'] === '2026-11-20', JSON.stringify(ngay));
  ok('datePosted của bếp = 2026-11-21: 17:30 UTC ngày 20 đã là 00:30 ngày 21 giờ Việt Nam', ngay['nhan-vien-bep'] === '2026-11-21', JSON.stringify(ngay));
  ok('Tin quản lý cửa hàng (mốc null) không có JobPosting', !('quan-ly-cua-hang' in ngay));
  ok('Không baseSalary trong JobPosting (lương chưa duyệt, trang không hiện lương)', jobs.every(j => !('baseSalary' in j)));

  ok('Chuỗi ISO giữ phần lẻ giây của database (Date.parse đọc được, không NaN)',
     Number.isFinite(Date.parse(json.find(t => t.ma === 'nhan-vien-sanh').cong_bo_luc)));
  await db.close();
});

process.exit(ketThuc('TIN TUYỂN DỤNG CÔNG BỐ LÚC'));
