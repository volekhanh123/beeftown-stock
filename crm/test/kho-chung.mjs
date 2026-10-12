/**
 * BEEFTOWN KHO — KHUNG KIỂM THỬ DÙNG CHUNG
 * ========================================
 * Mọi file test-kho-*.mjs dựng database giống hệt nhau: mô phỏng Supabase,
 * nạp toàn bộ migration, hai chi nhánh, đủ các vai. Gom về đây để mỗi file
 * test chỉ còn phần kiểm tra.
 *
 * Khác các file test CRM cũ ở một điểm CÓ Ý THỨC: KHÔNG cấp EXECUTE hàng loạt
 * cho authenticated sau khi nạp migration. Quyền của authenticated ở đây đúng
 * là quyền Supabase cấp mặc định trừ đi những gì migration đã thu hồi — nên
 * một hàm nội bộ lỡ để lọt ra ngoài sẽ lộ ra trong test thay vì bị che.
 */

import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
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

  // Không có `den` thì nạp MỌI file .sql như trước — kể cả file tên sai mẫu (kiem-migration.mjs mới là chỗ chặn tên).
  const daNap = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort()
    .filter(f => den === Infinity || Number(f.slice(0, 4)) <= den);
  const vanBan = new Map();
  for (const f of daNap) {
    vanBan.set(f, readFileSync(join(MIGRATIONS_DIR, f), 'utf8'));
    await db.exec(vanBan.get(f));
  }
  return { db, daNap, vanBan };
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

/** uuid ngẫu nhiên cho ma_gui. */
export function maGui() {
  return crypto.randomUUID();
}

/**
 * Client Supabase giả chạy trên chính database PGlite, dưới danh nghĩa một vai — để gọi THẲNG các hàm
 * đọc / ghi của web/src/lib/kho (from().select().eq().in().order().limit(), maybeSingle(), rpc()) và
 * thấy đúng RLS, đúng quyền hàm như trên Supabase thật.
 *
 *     const clientCua = await taoClientPg({ db, duoi, duoiAnon });
 *     const nv = clientCua(UID.nvQuayA);      // 'anon' = chưa đăng nhập · null = đăng nhập nhưng không phải nhân sự
 *
 * Kết quả đi qua to_jsonb của chính Postgres, như PostgREST: ngày là chuỗi "YYYY-MM-DD", numeric là số
 * (PGlite đọc thẳng thì ngày thành Date, numeric thành chuỗi — khác với thứ web nhận trên Supabase).
 * rpc(): tham số ép kiểu theo chữ ký hàm trong pg_proc (jsonb, uuid, text[]…); hàm trả bảng → data là các
 * dòng, hàm trả một giá trị → data là giá trị đó. Lỗi → { data: null, error: { message, code } }.
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
      rpc(ten, thamSo = {}) {
        const h = ham.get(ten);
        if (!h) return Promise.resolve({ data: null, error: { message: `Could not find the function public.${ten}`, code: 'PGRST202' } });
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
      },
      from(bang) {
        const q = { cot: '*', dk: [], gt: [], sap: [], gioiHan: null };
        const chayBang = () => chay(
          `select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) as r from (select ${q.cot} from ${bang}`
          + `${q.dk.length ? ` where ${q.dk.join(' and ')}` : ''}${q.sap.length ? ` order by ${q.sap.join(', ')}` : ''}`
          + `${q.gioiHan ? ` limit ${q.gioiHan}` : ''}) x`, q.gt);
        const b = {
          select(cot) { q.cot = cot; return b; },
          eq(k, v) { q.gt.push(v); q.dk.push(`${k} = $${q.gt.length}`); return b; },
          in(k, ds) { q.gt.push(`{${ds.join(',')}}`); q.dk.push(`${k}::text = any($${q.gt.length}::text[])`); return b; },
          order(k, tuy) { q.sap.push(`${k}${tuy?.ascending === false ? ' desc' : ''}`); return b; },
          limit(n) { q.gioiHan = n; return b; },
          async maybeSingle() { const kq = await chayBang(); return kq.error ? kq : { data: kq.data[0] ?? null, error: null }; },
          then(xong, hong) { return chayBang().then(xong, hong); },
        };
        return b;
      },
    };
  };
}
