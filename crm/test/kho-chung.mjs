/**
 * BEEFTOWN KHO — KHUNG KIỂM THỬ DÙNG CHUNG
 * ========================================
 * Mọi file test-kho-*.mjs dựng database giống hệt nhau: mô phỏng Supabase,
 * nạp toàn bộ migration, hai chi nhánh, đủ các vai. Gom về đây để mỗi file
 * test chỉ còn phần kiểm tra.
 *
 * CÓ Ý THỨC không cấp EXECUTE hàng loạt cho authenticated sau khi nạp migration
 * (bảy file test CRM cũ từng tự dựng Supabase giả và cấp như vậy — 12/10/2026 bỏ
 * cấp, chuyển về dungDatabaseTrong() ở đây; test-quy-trinh.mjs mục 6 chặn). Quyền
 * của authenticated ở đây đúng là quyền Supabase cấp mặc định trừ đi những gì
 * migration đã thu hồi — nên một hàm nội bộ lỡ để lọt ra ngoài sẽ lộ ra trong test
 * thay vì bị che.
 */

import { PGlite } from '@electric-sql/pglite';
import { createHash } from 'node:crypto';
import { existsSync, openAsBlob, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations');

export const UID = {
  chu:      '00000000-0000-4000-8000-000000000001',
  qlA:      '00000000-0000-4000-8000-00000000000a',
  thuKhoA:  '00000000-0000-4000-8000-00000000000b',
  nvQuayA:  '00000000-0000-4000-8000-00000000000c',
  keToanA:  '00000000-0000-4000-8000-00000000000d',
  thuNganA: '00000000-0000-4000-8000-00000000000e',
  mktA:     '00000000-0000-4000-8000-00000000000f',
  qlB:      '00000000-0000-4000-8000-0000000000b1',
  thuKhoB:  '00000000-0000-4000-8000-0000000000b2',
  nghiViec: '00000000-0000-4000-8000-0000000000ff',
};

/** Bộ đếm kết quả kiểu các file test cũ: ok() / nhom() / in tổng kết. */
export function taoBoDem(tieuDe) {
  let dat = 0, hong = 0;
  const loi = [];
  console.log(`\x1b[1m\n${tieuDe}\x1b[0m`);
  console.log('='.repeat(60));

  function ok(ten, dieuKien, chiTiet = '') {
    if (dieuKien) { dat++; console.log(`  \x1b[32m✓\x1b[0m ${ten}`); }
    else {
      hong++; loi.push(ten + (chiTiet ? ` — ${chiTiet}` : ''));
      console.log(`  \x1b[31m✗ ${ten}\x1b[0m${chiTiet ? ` — ${chiTiet}` : ''}`);
    }
  }

  async function nhom(ten, fn) {
    console.log(`\n\x1b[1m${ten}\x1b[0m`);
    try { await fn(); }
    catch (e) { ok(`${ten} chạy được đến cuối`, false, e.stack || e.message); }
  }

  function ketThuc(nhan) {
    console.log('\n' + '='.repeat(60));
    if (hong === 0) {
      console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA ${nhan} ĐỀU ĐẠT\x1b[0m`);
    } else {
      console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA\x1b[0m`);
      loi.forEach(l => console.log(`  \x1b[31m· ${l}\x1b[0m`));
    }
    return hong === 0 ? 0 : 1;
  }

  return { ok, nhom, ketThuc };
}

/**
 * Database chỉ có cấu trúc: mô phỏng Supabase → nạp migration theo thứ tự số, chưa có dòng dữ liệu nào.
 * `den`: chỉ nạp đến migration số này (kể cả nó) — doi-chieu-production.mjs dùng khi production chưa
 * chạy migration mới nhất. Trả về db, danh sách file đã nạp và nội dung từng file (Map tên → SQL).
 */
export async function dungDatabaseTrong({ den = Infinity } = {}) {
  // Không có `den` thì nạp MỌI file .sql như trước — kể cả file tên sai mẫu (kiem-migration.mjs mới là chỗ chặn tên).
  const daNap = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort()
    .filter(f => den === Infinity || Number(f.slice(0, 4)) <= den);
  const vanBan = new Map(daNap.map(f => [f, readFileSync(join(MIGRATIONS_DIR, f), 'utf8')]));

  const anh = den === Infinity ? await docAnhDatabase(vanBan) : null;
  if (anh) return { db: new PGlite({ loadDataDir: anh }), daNap, vanBan };

  const db = new PGlite();

  await db.exec(`
    create schema if not exists auth;
    create table if not exists auth._phien (uid uuid);
    create or replace function auth.uid() returns uuid
      language sql stable as $$ select uid from auth._phien limit 1 $$;

    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin;
    grant usage on schema public to anon, authenticated, service_role;

    -- Supabase cho authenticated gọi auth.uid() (README crm, lưu ý 10).
    grant usage on schema auth to authenticated;
    grant select on auth._phien to authenticated;

    -- Quyền mặc định của Supabase — phải đặt TRƯỚC khi nạp migration.
    alter default privileges in schema public grant all on tables    to anon, authenticated;
    alter default privileges in schema public grant all on functions to anon, authenticated;
    alter default privileges in schema public grant all on sequences to anon, authenticated;
  `);

  for (const f of daNap) await db.exec(vanBan.get(f));
  return { db, daNap, vanBan };
}

// ---------------------------------------------------------------------------
// Ảnh chụp database trống — nạp 62 migration mất ~2,5 giây mỗi file test, nạp lại từ ảnh ~0,7 giây
// ---------------------------------------------------------------------------
// Bộ chạy (chay-tat-ca.mjs) dựng database trống MỘT lần, chụp lại (dumpDataDir) và đưa đường dẫn qua biến
// BEEFTOWN_ANH_DATABASE; dungDatabaseTrong() của từng file nạp lại từ ảnh (loadDataDir). Ảnh kèm dấu vân của
// thư mục migration: lệch (sửa migration giữa lượt) hay thiếu file thì tự nạp migration như cũ. File chạy riêng
// (node test/x.mjs) không có biến này nên luôn nạp migration. `den` (doi-chieu) cũng không dùng ảnh.
export const BIEN_ANH_DATABASE = 'BEEFTOWN_ANH_DATABASE';

/** Dấu vân của bộ migration: tên và nội dung từng file, theo thứ tự nạp. */
function dauVanMigration(vanBan) {
  const h = createHash('sha256');
  for (const [ten, sql] of vanBan) h.update(ten).update('\0').update(sql).update('\0');
  return h.digest('hex');
}

async function docAnhDatabase(vanBan) {
  const duongDan = process.env[BIEN_ANH_DATABASE];
  if (!duongDan || !existsSync(duongDan) || !existsSync(`${duongDan}.dau-van`)) return null;
  if (readFileSync(`${duongDan}.dau-van`, 'utf8') !== dauVanMigration(vanBan)) return null;
  // Blob đọc thẳng từ file: không chép ~80 MB vào bộ nhớ của Node trước khi PGlite tự chép một lần nữa.
  return openAsBlob(duongDan);
}

/** Dựng database trống (luôn nạp migration, không đọc ảnh cũ) rồi chụp vào `duongDan` kèm dấu vân. */
export async function chupDatabaseTrong(duongDan) {
  const truoc = process.env[BIEN_ANH_DATABASE];
  delete process.env[BIEN_ANH_DATABASE];
  try {
    const { db, vanBan } = await dungDatabaseTrong();
    const anh = await db.dumpDataDir('none');   // không nén: nạp nhanh hơn ~0,4 giây mỗi file, đổi lấy ~80 MB tạm
    writeFileSync(duongDan, Buffer.from(await anh.arrayBuffer()));
    writeFileSync(`${duongDan}.dau-van`, dauVanMigration(vanBan));
    await db.close();
  } finally {
    if (truoc !== undefined) process.env[BIEN_ANH_DATABASE] = truoc;
  }
}

/**
 * Dựng database: mô phỏng Supabase → nạp migration → hai chi nhánh → nhân sự.
 * Trả về db cùng các hàm chạy dưới danh nghĩa một người.
 */
export async function dungDatabase() {
  const { db } = await dungDatabaseTrong();

  const { rows: [cnA] } = await db.query(
    `insert into chi_nhanh (ma, ten) values ('q1', 'Beeftown Quận 1') returning *`);
  const { rows: [cnB] } = await db.query(
    `insert into chi_nhanh (ma, ten) values ('q7', 'Beeftown Quận 7') returning *`);

  const nhanSu = [
    [UID.chu,      null,    'Chủ nhà hàng',  'chu_so_huu',     true],
    [UID.qlA,      cnA.id,  'Quản lý Q1',    'quan_ly',        true],
    [UID.thuKhoA,  cnA.id,  'Thủ kho Q1',    'thu_kho',        true],
    [UID.nvQuayA,  cnA.id,  'NV quầy Q1',    'nhan_vien_quay', true],
    [UID.keToanA,  cnA.id,  'Kế toán Q1',    'ke_toan',        true],
    [UID.thuNganA, cnA.id,  'Thu ngân Q1',   'thu_ngan',       true],
    [UID.mktA,     cnA.id,  'Marketing Q1',  'marketing',      true],
    [UID.qlB,      cnB.id,  'Quản lý Q7',    'quan_ly',        true],
    [UID.thuKhoB,  cnB.id,  'Thủ kho Q7',    'thu_kho',        true],
    [UID.nghiViec, cnA.id,  'Thủ kho đã nghỉ', 'thu_kho',      false],
  ];
  const nsId = {};
  for (const [uid, cn, ten, vai, dangLam] of nhanSu) {
    const { rows: [r] } = await db.query(
      `insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam)
       values ($1, $2, $3, $4, $5) returning id`, [uid, cn, ten, vai, dangLam]);
    nsId[uid] = r.id;
  }

  /** Chạy dưới danh nghĩa một nhân sự (uid null = đăng nhập nhưng không phải ai). */
  async function duoi(uid, sql, params = []) {
    await db.query(`delete from auth._phien`);
    if (uid) await db.query(`insert into auth._phien (uid) values ($1)`, [uid]);
    await db.exec(`set role authenticated`);
    try { return { rows: (await db.query(sql, params)).rows, loi: null }; }
    catch (e) { return { rows: null, loi: e.message, ma: e.code ?? null }; }
    finally {
      await db.exec(`reset role`);
      // Dọn phiên: câu lệnh superuser chạy sau đó không được mang danh ai.
      await db.query(`delete from auth._phien`);
    }
  }

  async function duoiAnon(sql, params = []) {
    await db.query(`delete from auth._phien`);
    await db.exec(`set role anon`);
    try { return { rows: (await db.query(sql, params)).rows, loi: null }; }
    catch (e) { return { rows: null, loi: e.message, ma: e.code ?? null }; }
    finally { await db.exec(`reset role`); }
  }

  /** Chạy bằng superuser và KỲ VỌNG lỗi. Trả thông báo lỗi, hoặc null nếu chạy được. */
  async function phaiLoi(sql, params = []) {
    try { await db.query(sql, params); return null; }
    catch (e) { return e.message; }
  }

  return { db, cnA, cnB, nsId, duoi, duoiAnon, phaiLoi };
}

/**
 * Hai tài khoản máy đồng bộ iPOS (vai may_ipos, 0029/0037): mayIposA ở chi
 * nhánh A, mayIposB ở chi nhánh B. KHÔNG tạo sẵn trong dungDatabase() — test
 * khác không phải đếm thêm người; file nào cần thì gọi hàm này.
 */
export const UID_MAY_IPOS = {
  mayIposA: '00000000-0000-4000-8000-0000000000d1',
  mayIposB: '00000000-0000-4000-8000-0000000000d2',
};
export async function themMayIpos(db, cnA, cnB) {
  const id = {};
  for (const [k, cn, ten] of [['mayIposA', cnA, 'Máy iPOS Q1'], ['mayIposB', cnB, 'Máy iPOS Q7']]) {
    const { rows: [r] } = await db.query(
      `insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam)
       values ($1, $2, $3, 'may_ipos', true) returning id`, [UID_MAY_IPOS[k], cn.id, ten]);
    id[k] = r.id;
  }
  return id;
}

// ---------------------------------------------------------------------------
// Đồng hồ giả phía database — bản SQL của dong-ho-gia.mjs
// ---------------------------------------------------------------------------
// hom_nay_vn(), bay_gio_vn(), gio_vn() đọc now() — giờ thật của máy chạy test, không giả được bằng cách thay
// Date của Node. datGioDatabase() thay thân ba hàm (chỉ trong database PGlite của file test, không migration nào
// đổi) để trả đúng thời điểm muốn thử; traGioDatabase() đặt lại đúng định nghĩa đang có trong database
// (pg_get_functiondef — không chép tay, nên migration sau này có định nghĩa lại cũng không lệch).
// Chỉ ba hàm này: now() trong cột created_at hay mốc "10 phút gần đây" vẫn là giờ thật. Nghiệp vụ theo ngày phải
// đi qua ba hàm này (kiem-migration.mjs chặn current_date), nên giả ba hàm là đủ thử mốc 23:50 / 00:10 giờ VN.
const HAM_GIO_VN = ['bay_gio_vn', 'hom_nay_vn', 'gio_vn'];
const dinhNghiaGioThat = new WeakMap();

const ISO_CO_MUI_GIO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/i;
/** Số mili-giây, hoặc báo lỗi: thiếu múi giờ, sai dạng, hay ngày giờ không có thật (Date.parse đọc 31/02 thành 03/03). */
function docThoiDiem(thoiDiem) {
  if (typeof thoiDiem === 'number') {
    if (!Number.isFinite(thoiDiem)) throw new Error(`datGioDatabase: ${thoiDiem} không phải số mili-giây`);
    return thoiDiem;
  }
  const m = ISO_CO_MUI_GIO.exec(String(thoiDiem).trim());
  if (!m) throw new Error(`datGioDatabase: "${thoiDiem}" không phải thời điểm ISO có múi giờ (ghi rõ Z hoặc +07:00)`);
  const ms = Date.parse(m[0]);
  const lechPhut = m[6].toUpperCase() === 'Z' ? 0
    : (m[6][0] === '-' ? -1 : 1) * (Number(m[6].slice(1, 3)) * 60 + Number(m[6].slice(-2)));
  const tai = new Date(ms + lechPhut * 60000);   // giờ đồng hồ tại múi giờ đã ghi
  const khop = tai.getUTCFullYear() === Number(m[1]) && tai.getUTCMonth() + 1 === Number(m[2])
    && tai.getUTCDate() === Number(m[3]) && tai.getUTCHours() === Number(m[4]) && tai.getUTCMinutes() === Number(m[5]);
  if (!Number.isFinite(ms) || !khop) throw new Error(`datGioDatabase: "${thoiDiem}" là ngày giờ không có thật`);
  return ms;
}

/**
 * `thoiDiem`: chuỗi ISO CÓ múi giờ ('2026-10-12T16:50:00Z' hay '2026-10-12T23:50:00+07:00' = 23:50 giờ VN)
 * hoặc số mili-giây. Chuỗi thiếu múi giờ bị từ chối: Node đọc nó theo giờ của máy, nên cùng một kiểm thử ra
 * 23:50 ở lượt đêm (TZ giờ VN) mà 06:50 hôm sau ở lượt PR (UTC).
 */
export async function datGioDatabase(db, thoiDiem) {
  const ms = docThoiDiem(thoiDiem);
  if (!dinhNghiaGioThat.has(db)) {
    const { rows } = await db.query(
      `select pg_get_functiondef(p.oid) as dinh_nghia from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = any($1)`, [HAM_GIO_VN]);
    if (rows.length !== HAM_GIO_VN.length) throw new Error(`datGioDatabase: thiếu hàm, chỉ thấy ${rows.length}/${HAM_GIO_VN.length}`);
    dinhNghiaGioThat.set(db, rows.map(r => r.dinh_nghia));
  }
  const vn = `((timestamptz '${new Date(ms).toISOString()}' at time zone 'utc') + interval '7 hours')`;
  await db.exec(`
    create or replace function public.bay_gio_vn() returns timestamp language sql stable as $$ select ${vn} $$;
    create or replace function public.hom_nay_vn() returns date      language sql stable as $$ select ${vn}::date $$;
    create or replace function public.gio_vn()     returns time      language sql stable as $$ select ${vn}::time $$;
  `);
}

export async function traGioDatabase(db) {
  const dinhNghia = dinhNghiaGioThat.get(db);
  if (!dinhNghia) return;
  for (const d of dinhNghia) await db.exec(d);
  dinhNghiaGioThat.delete(db);
}

/** uuid ngẫu nhiên cho ma_gui. */
export function maGui() {
  return crypto.randomUUID();
}

/**
 * Client Supabase giả chạy trên chính database PGlite, dưới danh nghĩa một vai — để gọi THẲNG các hàm
 * đọc / ghi của web/src/lib/kho (from().select().eq().neq().in().is().gte().lte().order().limit().range(), maybeSingle(), rpc(),
 * from().update().eq(), from().insert()[.select(cột).single()], from().upsert(dòng, { onConflict }), from().delete().eq())
 * và thấy đúng RLS, đúng quyền hàm như trên Supabase thật. select(cột, { count: 'exact' }) trả thêm
 * `count` (tổng số dòng khớp điều kiện, như PostgREST) — docTungTrang (chung.ts) dựa vào nó để biết đã
 * đọc đủ trang.
 *
 *     const clientCua = await taoClientPg({ db, duoi, duoiAnon });
 *     const nv = clientCua(UID.nvQuayA);      // 'anon' = chưa đăng nhập · null = đăng nhập nhưng không phải nhân sự
 *
 * Kết quả đi qua to_jsonb của chính Postgres, như PostgREST: ngày là chuỗi "YYYY-MM-DD", numeric là số
 * (PGlite đọc thẳng thì ngày thành Date, numeric thành chuỗi — khác với thứ web nhận trên Supabase).
 * rpc(): tham số ép kiểu theo chữ ký hàm trong pg_proc (jsonb, uuid, text[]…); hàm trả bảng → data là các
 * dòng, hàm trả một giá trị → data là giá trị đó. Lỗi → { data: null, error: { message, code } }.
 * rpc(tên, tham số, { count: 'exact' }).range(từ, đến): như PostgREST — cắt các dòng (thứ tự trong thân hàm), count là
 * tổng số dòng (docTungTrang đọc từng trang). Chỉ chạy khi await / .range() — giống builder của supabase-js.
 * Chỉ hiểu danh sách cột thường trong select() — không hiểu đổi tên cột hay join lồng của PostgREST.
 */
export async function taoClientPg({ db, duoi, duoiAnon }) {
  const ham = new Map((await db.query(`
    select p.proname, p.proretset, p.proargnames, p.prorettype::regtype::text as tra,
           (select array_agg(t::regtype::text order by thu) from unnest(p.proargtypes::oid[]) with ordinality as x(t, thu)) as kieu
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'`)).rows.map(r => [r.proname, r]));
  return function clientCua(uid) {
    const chay = async (sql, gt) => {
      const kq = await (uid === 'anon' ? duoiAnon(sql, gt) : duoi(uid, sql, gt));
      return kq.loi ? { data: null, error: { message: kq.loi, code: kq.ma } } : { data: kq.rows[0]?.r ?? null, error: null };
    };
    return {
      rpc(ten, thamSo = {}, tuyChon = {}) {
        const goiHam = async () => {
          const h = ham.get(ten);
          if (!h) return { data: null, error: { message: `Could not find the function public.${ten}`, code: 'PGRST202' } };
          const ds = Object.entries(thamSo);
          const kieuCua = k => h.kieu?.[(h.proargnames ?? []).indexOf(k)] ?? 'text';
          const gt = ds.map(([k, v]) => {
            if (v === null || v === undefined) return null;
            const kieu = kieuCua(k);
            if (kieu.endsWith('[]')) return `{${v.map(x => JSON.stringify(String(x))).join(',')}}`;
            return /^jsonb?$/.test(kieu) ? JSON.stringify(v) : v;
          });
          const goi = `${ten}(${ds.map(([k], i) => `${k} => $${i + 1}::${kieuCua(k)}`).join(', ')})`;
          if (h.proretset) return chay(`select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) as r from ${goi} x`, gt);
          return chay(h.tra === 'void' ? `select null::jsonb as r from (select ${goi}) x` : `select to_jsonb(${goi}) as r`, gt);
        };
        const lam = async khoang => {
          const kq = await goiHam();
          if (kq.error || !Array.isArray(kq.data)) return kq;
          const tong = tuyChon?.count ? { count: kq.data.length } : {};
          return khoang ? { data: kq.data.slice(khoang[0], khoang[1] + 1), error: null, ...tong } : { ...kq, ...tong };
        };
        return {
          then(xong, hong) { return lam(null).then(xong, hong); },
          range(tu, den) { return lam([tu, den]); },
        };
      },
      from(bang) {
        const q = { cot: '*', dk: [], gt: [], sap: [], gioiHan: null, boQua: 0, demTong: false, sua: null, xoa: false };
        const dieuKien = () => (q.dk.length ? ` where ${q.dk.join(' and ')}` : '');
        const chayBang = async () => {
          // update(dòng).eq(…)[.select(cột)]: data là các dòng đã sửa — RLS chặn thì mảng rỗng, không lỗi (như PostgREST).
          if (q.sua) {
            return chay(`with x as (update ${bang} set ${q.sua}${dieuKien()} returning ${q.cot})
                         select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) as r from x`, q.gt);
          }
          // delete().eq(…): RLS chặn thì không xóa dòng nào, không lỗi (như PostgREST).
          if (q.xoa) {
            return chay(`with x as (delete from ${bang}${dieuKien()} returning 1)
                         select null::jsonb as r from (select count(*) from x) y`, q.gt);
          }
          const kq = await chay(
            `select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) as r from (select ${q.cot} from ${bang}`
            + `${dieuKien()}${q.sap.length ? ` order by ${q.sap.join(', ')}` : ''}`
            + `${q.gioiHan !== null ? ` limit ${q.gioiHan}` : ''}${q.boQua ? ` offset ${q.boQua}` : ''}) x`, q.gt);
          if (kq.error || !q.demTong) return kq;
          const dem = await chay(`select to_jsonb(count(*)) as r from ${bang}${dieuKien()}`, q.gt);
          return dem.error ? dem : { ...kq, count: Number(dem.data) };
        };
        const chen = (dong, sau) => {
          const ds = Array.isArray(dong) ? dong : [dong];
          const cot = Object.keys(ds[0]);
          const gt = [];
          const hang = ds.map(d => `(${cot.map(k => { gt.push(d[k] ?? null); return `$${gt.length}`; }).join(', ')})`);
          const chenSql = `insert into ${bang} (${cot.join(', ')}) values ${hang.join(', ')}${sau}`;
          const chayChen = cotTra => (cotTra
            ? chay(`with x as (${chenSql} returning ${cotTra}) select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) as r from x`, gt)
            : chay(`with x as (${chenSql} returning 1) select null::jsonb as r from (select count(*) from x) y`, gt));
          return {
            select(cotTra = '*') {
              return {
                async single() { const kq = await chayChen(cotTra); return kq.error ? kq : { data: kq.data[0] ?? null, error: null }; },
                then(xong, hong) { return chayChen(cotTra).then(xong, hong); },
              };
            },
            then(xong, hong) { return chayChen('').then(xong, hong); },
          };
        };
        const b = {
          select(cot, tuy) { q.cot = cot; q.demTong = tuy?.count === 'exact'; return b; },
          // Gọi update() TRƯỚC eq(): giá trị của set đánh số trước giá trị của where.
          update(dong) {
            q.sua = Object.entries(dong).map(([k, v]) => { q.gt.push(v); return `${k} = $${q.gt.length}`; }).join(', ');
            return b;
          },
          // insert(dòng | [dòng]): RLS chặn thì lỗi "violates row-level security policy", như Postgres.
          // .select(cột) trả các dòng vừa thêm, .single() trả dòng đầu (như PostgREST).
          // upsert(dòng, { onConflict: 'cột' }): thêm, trùng thì cập nhật các cột còn lại.
          insert(dong) { return chen(dong, ''); },
          upsert(dong, tuy) {
            const cotTrung = tuy?.onConflict;
            if (!cotTrung) throw new Error('taoClientPg: upsert cần { onConflict }');
            const trung = cotTrung.split(',').map(x => x.trim());
            const cot = Object.keys(Array.isArray(dong) ? dong[0] : dong).filter(k => !trung.includes(k));
            return chen(dong, ` on conflict (${trung.join(', ')}) do ${cot.length
              ? `update set ${cot.map(k => `${k} = excluded.${k}`).join(', ')}` : 'nothing'}`);
          },
          delete() { q.xoa = true; return b; },
          eq(k, v) { q.gt.push(v); q.dk.push(`${k} = $${q.gt.length}`); return b; },
          neq(k, v) { q.gt.push(v); q.dk.push(`${k} <> $${q.gt.length}`); return b; },
          in(k, ds) { q.gt.push(`{${ds.join(',')}}`); q.dk.push(`${k}::text = any($${q.gt.length}::text[])`); return b; },
          // is(cột, null | true | false), gte / lte(cột, giá trị) — như PostgREST "is.null" / "gte." / "lte.".
          is(k, v) { q.dk.push(`${k} is ${v === null ? 'null' : v ? 'true' : 'false'}`); return b; },
          gte(k, v) { q.gt.push(v); q.dk.push(`${k} >= $${q.gt.length}`); return b; },
          lte(k, v) { q.gt.push(v); q.dk.push(`${k} <= $${q.gt.length}`); return b; },
          order(k, tuy) { q.sap.push(`${k}${tuy?.ascending === false ? ' desc' : ''}`); return b; },
          limit(n) { q.gioiHan = n; return b; },
          range(tu, den) { q.boQua = tu; q.gioiHan = den - tu + 1; return b; },
          async maybeSingle() { const kq = await chayBang(); return kq.error ? kq : { data: kq.data[0] ?? null, error: null }; },
          then(xong, hong) { return chayBang().then(xong, hong); },
        };
        return b;
      },
    };
  };
}
