/**
 * BEEFTOWN — Quyền bảng: anon, authenticated không có TRUNCATE, REFERENCES, TRIGGER, MAINTAIN (0120)
 * ===================================================================================================
 *
 *     node test/test-quyen-bang-khong-truncate.mjs
 *
 * Quyền mặc định của Supabase (kho-chung.mjs mô phỏng: `grant all on tables`) cấp cho authenticated cả TRUNCATE,
 * REFERENCES, TRIGGER và MAINTAIN trên mọi bảng tạo ra — production 14/11/2026 còn trên 110 bảng / view của public.
 * TRUNCATE bỏ qua RLS, MAINTAIN cho LOCK TABLE. PostgREST không gọi được các lệnh đó, và không màn nào cần chúng.
 * Phải đúng:
 *   · sau MỌI migration: không bảng / view nào của public còn bốn quyền đó cho anon, authenticated — một migration
 *     sau này `grant all` là file này đỏ;
 *   · bảng tạo sau (như một migration mới) cũng không có bốn quyền đó, mà vẫn có select / insert / update / delete
 *     như Supabase cấp;
 *   · TRUNCATE thẳng dưới vai authenticated, kể cả chủ nhà hàng: 42501;
 *   · 0120 không đổi SELECT, INSERT, UPDATE, DELETE (cả quyền theo cột) của bảng nào — so database trước và sau 0120.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, dungDatabaseTrong, taoBoDem, UID } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — QUYỀN BẢNG: KHÔNG TRUNCATE, REFERENCES, TRIGGER, MAINTAIN');

const THU_MUC_MIG = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'migrations');
// Migration thu quyền: tìm theo NỘI DUNG (câu revoke bốn quyền), không theo số hay tên — đánh lại số, đổi tên vẫn đúng.
const TEP_THU_QUYEN = readdirSync(THU_MUC_MIG).filter(f => /^\d{4}_.+\.sql$/.test(f)).sort()
  .find(f => /revoke truncate, references, trigger, maintain on all tables in schema public/i
    .test(readFileSync(join(THU_MUC_MIG, f), 'utf8')));
const SO_THU_QUYEN = Number(TEP_THU_QUYEN?.slice(0, 4));

const QUYEN_THUA = ['TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'];
// Bảng, bảng phân vùng, view, materialized view, bảng ngoài — đúng tập mà `on all tables in schema` đụng tới.
const LA_BANG_PUBLIC = `n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f')`;

/** Bảng / view còn quyền thừa cho anon hoặc authenticated: ["bang: vai quyen", …]. Quyền THẬT (has_table_privilege). */
async function conQuyenThua(db) {
  const { rows } = await db.query(`
    select c.relname || ': ' || v.vai || ' ' || lower(q.quyen) as dong
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    cross join unnest(array['anon', 'authenticated']) v(vai)
    cross join unnest($1::text[]) q(quyen)
    where ${LA_BANG_PUBLIC} and has_table_privilege(v.vai, c.oid, q.quyen)
    order by 1`, [QUYEN_THUA]);
  return rows.map(r => r.dong);
}

/** Quyền đọc / ghi của anon, authenticated đúng như ACL ghi: mức bảng (select, insert, update, delete) và mức cột. */
async function quyenDocGhi(db) {
  const { rows } = await db.query(`
    select c.relname || ': ' || r.rolname || ' ' || lower(e.privilege_type) as dong
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    cross join lateral aclexplode(c.relacl) e
    join pg_roles r on r.oid = e.grantee
    where ${LA_BANG_PUBLIC}
      and r.rolname in ('anon', 'authenticated') and e.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
    union all
    select c.relname || '.' || a.attname || ': ' || r.rolname || ' ' || lower(e.privilege_type)
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    cross join lateral aclexplode(a.attacl) e
    join pg_roles r on r.oid = e.grantee
    where ${LA_BANG_PUBLIC} and a.attacl is not null and not a.attisdropped
      and r.rolname in ('anon', 'authenticated') and e.privilege_type in ('SELECT', 'INSERT', 'UPDATE')
    order by 1`);
  return rows.map(r => r.dong);
}

// ===========================================================================
await nhom('1 · SAU MỌI MIGRATION: KHÔNG BẢNG, VIEW NÀO CÒN BỐN QUYỀN ĐÓ', async () => {
  const { db, duoi } = await dungDatabase();
  const { rows: [{ n }] } = await db.query(`
    select count(*)::int as n from pg_class c join pg_namespace n on n.oid = c.relnamespace where ${LA_BANG_PUBLIC}`);
  const con = await conQuyenThua(db);
  ok(`${n} bảng / view của public: anon, authenticated không còn TRUNCATE, REFERENCES, TRIGGER, MAINTAIN`,
     n > 100 && con.length === 0,
     `${con.length} chỗ, ví dụ: ${con.slice(0, 8).join(' · ')} — cấp đúng select / insert / update / delete, đừng "grant all"`);

  // Bảng tạo sau, đúng như một migration mới chạy bằng postgres trên Supabase.
  await db.exec(`create table thu_bang_moi_0120 (id int primary key)`);
  const { rows: [m] } = await db.query(`
    select ${QUYEN_THUA.map(q => `has_table_privilege('authenticated', 'thu_bang_moi_0120', '${q}')
             or has_table_privilege('anon', 'thu_bang_moi_0120', '${q}')`).join(' or ')} as thua,
           has_table_privilege('authenticated', 'thu_bang_moi_0120', 'SELECT')
             and has_table_privilege('authenticated', 'thu_bang_moi_0120', 'INSERT')
             and has_table_privilege('authenticated', 'thu_bang_moi_0120', 'UPDATE')
             and has_table_privilege('authenticated', 'thu_bang_moi_0120', 'DELETE') as doc_ghi,
           has_table_privilege('anon', 'thu_bang_moi_0120', 'SELECT') as anon_doc`);
  ok('Bảng tạo sau: không có bốn quyền đó', m.thua === false, JSON.stringify(m));
  ok('Bảng tạo sau: authenticated vẫn có select / insert / update / delete như Supabase cấp, anon vẫn không (0008)',
     m.doc_ghi === true && m.anon_doc === false, JSON.stringify(m));
  await db.exec(`drop table thu_bang_moi_0120`);

  for (const [ten, uid] of [['Chủ nhà hàng', UID.chu], ['Quản lý Q1', UID.qlA]]) {
    const r = await duoi(uid, `truncate kho_so_thu_tu`);
    ok(`${ten} → truncate thẳng một bảng: 42501`, r.ma === '42501', r.loi ?? 'XÓA ĐƯỢC');
  }
  await db.close();
});

// ===========================================================================
await nhom('2 · MIGRATION THU QUYỀN KHÔNG ĐỔI SELECT, INSERT, UPDATE, DELETE', async () => {
  ok(`Tìm thấy migration thu quyền (${TEP_THU_QUYEN})`, Number.isInteger(SO_THU_QUYEN), `${TEP_THU_QUYEN}`);
  // Một database: nạp đến ngay trước migration thu quyền, chụp quyền, chạy migration đó, chụp lại.
  const { db } = await dungDatabaseTrong({ den: SO_THU_QUYEN - 1 });
  const qTruoc = await quyenDocGhi(db), conTruoc = await conQuyenThua(db);
  await db.exec(readFileSync(join(THU_MUC_MIG, TEP_THU_QUYEN), 'utf8'));
  const qSau = await quyenDocGhi(db), conSau = await conQuyenThua(db);
  const mat = qTruoc.filter(x => !qSau.includes(x)), them = qSau.filter(x => !qTruoc.includes(x));
  ok(`Quyền đọc / ghi (mức bảng và mức cột) của anon, authenticated trước và sau ${SO_THU_QUYEN}: y hệt (${qSau.length} dòng)`,
     qSau.length > 100 && mat.length === 0 && them.length === 0, `mất: ${mat.slice(0, 8).join(' · ')} · thêm: ${them.slice(0, 8).join(' · ')}`);
  ok(`Trước ${SO_THU_QUYEN} còn quyền thừa (đúng như production 14/11/2026), sau thì hết`,
     conTruoc.length > 100 && conSau.length === 0, `trước: ${conTruoc.length} · sau: ${conSau.length}`);
  await db.close();
});

process.exit(ketThuc('QUYỀN BẢNG'));
