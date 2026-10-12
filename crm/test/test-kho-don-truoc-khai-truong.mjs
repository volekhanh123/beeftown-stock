/**
 * BEEFTOWN KHO — KIỂM THỬ LỆNH DỌN DỮ LIỆU THỬ TRƯỚC KHAI TRƯƠNG
 * ================================================================
 *     node test/test-kho-don-truoc-khai-truong.mjs
 *
 * crm/supabase/thu/don-du-lieu-thu-truoc-khai-truong.sql chạy trên PROJECT THẬT, trước khai trương,
 * để xoá dữ liệu mô phỏng của kho. Database ở đây giống production lúc này: MỘT chi nhánh tên thật,
 * kho đầy dữ liệu mô phỏng (chạy tao-du-lieu-kho.sql), kho chưa trừ theo iPOS, iPOS chưa bật.
 *
 * Bất biến:
 *   1. Từ chối và KHÔNG XOÁ GÌ khi: ba dòng chưa sửa; sai tên chi nhánh; sai ngày hôm nay (kể cả
 *      ngày không có thật); chế độ lạ; hơn một chi nhánh; chi nhánh "BẢN THỬ"; đã tới ngày bán đầu
 *      tiên; kho trừ theo iPOS; cấu hình iPOS đang bật.
 *   2. 'xem': không xoá gì, bảng kết quả liệt kê mọi bảng kho với số dòng đang có.
 *   3. 'xoa': mọi bảng dữ liệu kho về 0; bảng cài đặt giữ nguyên từng dòng; khách hàng, đặt bàn,
 *      nhân sự, chi nhánh không đụng; số phiếu và số tảng bắt đầu lại; sổ kho khớp tồn.
 *   4. Chạy 'xoa' hai lần không lỗi, không đổi gì thêm.
 *   5. Danh sách bảng giữ lại y hệt xoa-du-lieu-kho.sql — hai file không được lệch nhau.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem } from './kho-chung.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const THU = join(__dirname, '..', 'supabase', 'thu');
const TAO = readFileSync(join(THU, 'tao-du-lieu-kho.sql'), 'utf8');
const XOA = readFileSync(join(THU, 'xoa-du-lieu-kho.sql'), 'utf8');
const DON = readFileSync(join(THU, 'don-du-lieu-thu-truoc-khai-truong.sql'), 'utf8');

const { ok, nhom, ketThuc } = taoBoDem('KHO · DỌN DỮ LIỆU THỬ TRƯỚC KHAI TRƯƠNG');
const { db, cnA, cnB } = await dungDatabase();

// auth.uid() đọc claim sub như Supabase thật (tao-du-lieu-kho.sql đóng vai bằng claims) — như test-kho-du-lieu-thu.mjs.
await db.exec(`
  create or replace function auth.uid() returns uuid language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub',
                    (select uid::text from auth._phien limit 1))::uuid
  $$;
`);

const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];
const chay = async sql => {
  try { const kq = await db.exec(sql); return { loi: null, kq }; } catch (e) { return { loi: e.message, kq: null }; }
};
const lit = s => `'${String(s).replace(/'/g, "''")}'`;

const TEN = 'Beeftown Hàm Nghi';
const DONG = {
  ten: `c_ten_chi_nhanh text := 'GÕ ĐÚNG TÊN CHI NHÁNH';`,
  ngay: `c_hom_nay       text := 'YYYY-MM-DD';`,
  cheDo: `c_che_do        text := 'xem';`,
  banDau: `date '2026-11-08'`,
};
/** File với ba dòng đã sửa như người chạy sửa (và tuỳ chọn ngày bán đầu tiên khác). */
const banSua = ({ ten = TEN, ngay, cheDo = 'xem', ngayBanDau = null }) => {
  let s = DON.replace(DONG.ten, `c_ten_chi_nhanh text := ${lit(ten)};`)
    .replace(DONG.ngay, `c_hom_nay       text := ${lit(ngay)};`)
    .replace(DONG.cheDo, `c_che_do        text := ${lit(cheDo)};`);
  if (ngayBanDau) s = s.replace(DONG.banDau, `date '${ngayBanDau}'`);
  return s;
};

/** Số dòng mọi bảng kho + vài bảng ngoài kho — chụp để so "không xoá gì". */
const chup = async () => {
  const bang = (await db.query(`select tablename from pg_tables where schemaname = 'public'
    and (tablename like 'kho\\_%' or tablename in ('chi_nhanh', 'nhan_su', 'khach_hang', 'dat_ban', 'ban_an'))
    order by 1`)).rows.map(r => r.tablename);
  const ra = {};
  for (const b of bang) ra[b] = Number((await mot(`select count(*) as n from ${b}`)).n);
  return ra;
};
const giongNhau = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const GIU = ['kho_cai_dat', 'kho_vi_tri', 'kho_ly_do', 'kho_may', 'kho_may_nguoi', 'kho_may_nhat_ky',
  'kho_may_can', 'kho_nguoi_xem', 'kho_truong_them', 'kho_thiet_lap_bo_qua'];
let homNay = '';
let truoc = {};

// ===========================================================================
await nhom('0 · DỰNG DATABASE GIỐNG PRODUCTION: MỘT CHI NHÁNH, KHO ĐẦY DỮ LIỆU MÔ PHỎNG', async () => {
  ok('File có đủ ba dòng để sửa và hằng số ngày bán đầu tiên 08/11/2026',
     Object.values(DONG).every(d => DON.includes(d)), Object.entries(DONG).filter(([, d]) => !DON.includes(d)).map(([k]) => k).join(', '));
  await db.query(`delete from nhan_su where chi_nhanh_id = $1`, [cnB.id]);
  await db.query(`delete from chi_nhanh where id = $1`, [cnB.id]);
  await db.query(`update chi_nhanh set ten = $2 where id = $1`, [cnA.id, 'Beeftown Quận 1 (BẢN THỬ)']);
  const tao = await chay(TAO);
  ok('Nạp dữ liệu mô phỏng (tao-du-lieu-kho.sql) không lỗi', tao.loi === null, tao.loi ?? '');
  await db.query(`update chi_nhanh set ten = $2 where id = $1`, [cnA.id, TEN]);
  // Như production lúc này: quầy trừ theo đếm, iPOS chưa bật.
  await db.query(`update kho_cai_dat set nguon_so_ban = 'kiem_ke'`);
  await db.query(`update kho_ipos_cau_hinh set bat = false`);
  homNay = (await mot(`select hom_nay_vn()::text as d`)).d;
  truoc = await chup();
  ok('Kho có dữ liệu: mặt hàng, lô, sổ kho, hóa đơn iPOS; một chi nhánh tên thật',
     truoc.kho_mat_hang > 50 && truoc.kho_lo > 50 && truoc.kho_so_cai > 100 && truoc.kho_ipos_hoa_don > 0 && truoc.chi_nhanh === 1,
     JSON.stringify({ mh: truoc.kho_mat_hang, lo: truoc.kho_lo, so: truoc.kho_so_cai, ipos: truoc.kho_ipos_hoa_don, cn: truoc.chi_nhanh }));
});

// ===========================================================================
await nhom('1 · TỪ CHỐI — KHÔNG XOÁ GÌ', async () => {
  // So với ảnh chụp NGAY TRƯỚC lần chạy (ca hai chi nhánh tự thêm một chi nhánh trước khi chạy).
  const tuChoi = async (ten, sql, mau) => {
    const goc = await chup();
    const kq = await chay(sql);
    ok(`${ten} → từ chối, không xoá gì`, kq.loi !== null && mau.test(kq.loi) && giongNhau(await chup(), goc), kq.loi ?? 'CHẠY ĐƯỢC');
  };
  await tuChoi('Ba dòng chưa sửa (dán nguyên file rồi Run)', DON, /chưa sửa ba dòng/);
  await tuChoi('Sai tên chi nhánh', banSua({ ten: 'Beeftown Hàm Nghi 2', ngay: homNay }), /tên chi nhánh gõ vào không khớp/);
  await tuChoi('Tên chi nhánh để trống', banSua({ ten: '', ngay: homNay }), /không khớp/);
  const homQua = (await mot(`select (hom_nay_vn() - 1)::text as d`)).d;
  await tuChoi('Ngày gõ vào là hôm qua', banSua({ ngay: homQua }), /không phải hôm nay theo giờ Việt Nam/);
  await tuChoi('Ngày không có thật (31/02)', banSua({ ngay: '2026-02-31' }), /phải là ngày dạng/);
  await tuChoi('Ngày viết kiểu khác (12/10/2026)', banSua({ ngay: '12/10/2026' }), /phải là ngày dạng|không phải hôm nay/);
  await tuChoi('Chế độ lạ ("xoá" có dấu)', banSua({ ngay: homNay, cheDo: 'xoá' }), /c_che_do phải là/);
  await tuChoi('Đã tới ngày bán đầu tiên', banSua({ ngay: homNay, cheDo: 'xoa', ngayBanDau: homNay }), /đã tới ngày bán đầu tiên/);

  await db.query(`insert into chi_nhanh (ma, ten) values ('q9', 'Beeftown chi nhánh hai')`);
  await tuChoi('Database có hai chi nhánh', banSua({ ngay: homNay, cheDo: 'xoa' }), /database có 2 chi nhánh/);
  await db.query(`delete from chi_nhanh where ma = 'q9'`);

  await db.query(`update chi_nhanh set ten = $1`, [`${TEN} (BẢN THỬ)`]);
  await tuChoi('Chi nhánh "BẢN THỬ" (project thử)', banSua({ ten: `${TEN} (BẢN THỬ)`, ngay: homNay, cheDo: 'xoa' }), /xoa-du-lieu-kho\.sql/);
  await db.query(`update chi_nhanh set ten = $1`, [TEN]);

  await db.query(`update kho_cai_dat set nguon_so_ban = 'ipos'`);
  await tuChoi('Kho đang trừ bán theo iPOS', banSua({ ngay: homNay, cheDo: 'xoa' }), /đang trừ bán theo iPOS/);
  await db.query(`update kho_cai_dat set nguon_so_ban = 'kiem_ke'`);
  await db.query(`update kho_ipos_cau_hinh set bat = true`);
  await tuChoi('Cấu hình iPOS đang bật', banSua({ ngay: homNay, cheDo: 'xoa' }), /cấu hình iPOS đang bật/);
  await db.query(`update kho_ipos_cau_hinh set bat = false`);
  ok('Sau mọi lần từ chối, database y như trước', giongNhau(await chup(), truoc));
});

// ===========================================================================
await nhom('2 · CHẾ ĐỘ XEM — CHỈ ĐẾM', async () => {
  const kq = await chay(banSua({ ngay: homNay, cheDo: 'xem' }));
  ok('Chạy được', kq.loi === null, kq.loi ?? '');
  const bang = kq.kq?.at(-1)?.rows ?? [];
  const tim = ten => bang.find(r => r.bang === ten);
  ok('Bảng kết quả liệt kê MỌI bảng kho, đúng số dòng đang có, đánh dấu bảng giữ lại',
     bang.length === Object.keys(truoc).filter(b => b.startsWith('kho_')).length
     && bang.every(r => Number(r.so_dong) === truoc[r.bang])
     && bang.every(r => (GIU.includes(r.bang) ? r.loai === 'giữ (cài đặt)' : r.loai === 'dữ liệu')),
     JSON.stringify(bang.slice(0, 4)));
  ok('Ví dụ: kho_mat_hang và kho_so_cai hiện đúng số dòng', Number(tim('kho_mat_hang')?.so_dong) === truoc.kho_mat_hang
     && Number(tim('kho_so_cai')?.so_dong) === truoc.kho_so_cai);
  ok('Không xoá gì', giongNhau(await chup(), truoc));
  ok('Tên chi nhánh gõ thừa khoảng trắng đầu / cuối vẫn khớp', (await chay(banSua({ ten: `  ${TEN} `, ngay: homNay }))).loi === null);
});

// ===========================================================================
await nhom('3 · CHẾ ĐỘ XOÁ', async () => {
  const kq = await chay(banSua({ ngay: homNay, cheDo: 'xoa' }));
  ok('Chạy được', kq.loi === null, kq.loi ?? '');
  const sau = await chup();
  const conDuLieu = Object.entries(sau).filter(([b, n]) => b.startsWith('kho_') && !GIU.includes(b) && n !== 0);
  ok('Mọi bảng dữ liệu kho về 0', conDuLieu.length === 0, JSON.stringify(conDuLieu));
  ok('Bảng cài đặt giữ nguyên từng dòng (vị trí, lý do, cài đặt kho, máy…)', GIU.every(b => sau[b] === truoc[b]),
     GIU.filter(b => sau[b] !== truoc[b]).join(', '));
  ok('Chi nhánh, nhân sự, khách hàng, đặt bàn, bàn ăn không đụng tới',
     ['chi_nhanh', 'nhan_su', 'khach_hang', 'dat_ban', 'ban_an'].filter(b => b in truoc).every(b => sau[b] === truoc[b]));
  const bang = kq.kq?.at(-1)?.rows ?? [];
  ok('Bảng kết quả sau khi xoá: mọi dòng "dữ liệu" là 0', bang.length > 0 && bang.filter(r => r.loai === 'dữ liệu').every(r => Number(r.so_dong) === 0));
  ok('Số phiếu bắt đầu lại từ 0001', /-0001$/.test((await mot(`select kho_sinh_so($1, 'PN') as so`, [cnA.id])).so ?? ''));
  ok('Số tảng bắt đầu lại từ 1', Number((await mot(`select kho_sinh_so_tang($1) as so`, [cnA.id])).so) === 1);
  ok('Kho vẫn trừ theo đếm quầy', (await mot(`select nguon_so_ban from kho_cai_dat where chi_nhanh_id = $1`, [cnA.id])).nguon_so_ban === 'kiem_ke');
  ok('kho_doi_soat_ton() rỗng', (await db.query(`select * from kho_doi_soat_ton()`)).rows.length === 0);

  // Lượt sinh số vừa rồi chỉ để thử — xoá lại cho lần chạy thứ hai so được.
  await db.query(`truncate kho_so_thu_tu`);
  const sauMot = await chup();
  const lai = await chay(banSua({ ngay: homNay, cheDo: 'xoa' }));
  ok('Chạy "xoa" lần hai: không lỗi, không đổi gì thêm', lai.loi === null && giongNhau(await chup(), sauMot), lai.loi ?? '');
});

// ===========================================================================
await nhom('4 · HAI FILE KHÔNG LỆCH NHAU', async () => {
  const dsGiu = s => [...(s.match(/v_giu text\[\] := array\[([\s\S]*?)\];/)?.[1] ?? '').matchAll(/'([a-z_]+)'/g)].map(m => m[1]).sort();
  ok('Danh sách bảng giữ lại y hệt xoa-du-lieu-kho.sql',
     dsGiu(DON).length === GIU.length && JSON.stringify(dsGiu(DON)) === JSON.stringify(dsGiu(XOA)) && JSON.stringify(dsGiu(DON)) === JSON.stringify([...GIU].sort()),
     `${dsGiu(DON).join(',')} | ${dsGiu(XOA).join(',')}`);
  ok('Không phải migration: nằm ở crm/supabase/thu, không có file cùng tên trong migrations',
     !readFileSync(join(__dirname, '..', 'README.md'), 'utf8').includes('migrations/don-du-lieu-thu-truoc-khai-truong'));
  ok('Không CASCADE (bảng giữ lại trỏ vào bảng bị xoá thì báo lỗi, không xoá lan)', !/cascade/i.test(DON.replace(/--.*$/gm, '')));
});

process.exit(ketThuc('DỌN DỮ LIỆU THỬ TRƯỚC KHAI TRƯƠNG'));
