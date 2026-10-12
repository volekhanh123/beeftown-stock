/**
 * BEEFTOWN — ĐỐI CHIẾU DATABASE THẬT VỚI MIGRATION
 * ================================================
 *
 *   cd crm
 *   DOI_CHIEU_DB_URL='postgresql://postgres.<mã>:<mật khẩu>@<…>.pooler.supabase.com:5432/postgres' npm run doi-chieu
 *   npm run doi-chieu -- --den 0061       production chưa chạy migration sau 0061: chỉ so đến 0061
 *   npm run doi-chieu -- --gioi-han 300   chờ database tối đa 300 giây (mặc định 180)
 *
 * (Windows PowerShell: $env:DOI_CHIEU_DB_URL='…' — nháy ĐƠN, nháy kép làm hỏng mật khẩu có dấu $ — rồi npm run doi-chieu.)
 * CHẠY TAY sau MỖI lần chạy migration lên production — README gốc, mục "Chạy migration lên production".
 * KHÔNG nằm trong `npm test` và CI: nó nối vào database thật qua mạng. Kiểm thử của chính nó (trên
 * PGlite) là test-doi-chieu-production.mjs.
 *
 * VÌ SAO CÓ FILE NÀY
 *   04/10/2026 phát hiện project Beeftown thiếu hai hàm có trong migration đã gộp:
 *   bao_dong_bat_dau_luot (0060_bao_dong.sql) và kho_may_can_nhat_ky (0061_kho_can_quay.sql). Hai file
 *   được chạy lên production thành nhiều mảnh (lịch sử ghi 0060_bao_dong_p1..p4, 0061_kho_can_quay_p1..p2)
 *   và một mảnh lặng lẽ không chạy. Không gì báo lỗi: cron báo động (web/src/lib/bao-dong.ts) đăng nhập
 *   bình thường rồi chết ở lời gọi hàm thiếu, bao_dong_trang_thai.lan_chay_cuoi cứ null. Nghi vấn: công
 *   cụ apply_migration / execute_sql của Supabase MCP chờ người bấm xác nhận khi câu lệnh có `delete`;
 *   phiên không có chỗ bấm thì hết 60 giây và KHÔNG chạy gì, mà phiên vẫn đi tiếp.
 *
 * LÀM GÌ
 *   1. Đọc cấu trúc schema public của database đích trong một giao dịch CHỈ ĐỌC (begin read only).
 *   2. Dựng MẪU: PGlite trống + mô phỏng Supabase + mọi migration — đúng như kiểm thử (kho-chung.mjs).
 *      Postgres tự đọc migration, nên "định nghĩa mới nhất" của mỗi hàm là đúng thứ migration cuối cùng
 *      để lại: create or replace sau thắng, drop thì mất — không tự đoán từ chữ trong file.
 *   3. Chạy CÙNG một bộ câu hỏi catalog trên cả hai, so từng nhóm (NHOM bên dưới), báo:
 *        THIẾU — migration tạo mà database không có (đúng kiểu sự cố 04/10);
 *        KHÁC  — có cả hai nhưng định nghĩa khác;
 *        THỪA  — database có mà migration không tạo, hoặc migration đã drop (câu drop chưa chạy?).
 *      Đối tượng con của một bảng / hàm đã THIẾU hay THỪA (cột, chỉ mục, thân hàm, quyền…) không kể
 *      lại từng cái — chỉ ghi kèm số lượng.
 *
 *   Thân hàm so sau khi bỏ chú thích `--`, `/* *\/` và khoảng trắng: production lưu thân hàm đã bị bỏ
 *   chú thích. Chữ trong chuỗi '…' giữ NGUYÊN (kể cả khoảng trắng, kể cả `--` trong chuỗi) — chuỗi khác
 *   là hàm chạy khác. Chuỗi $tag$…$tag$ lồng trong thân (SQL động của execute) được chuẩn hoá như mã.
 *
 * KHÔNG SO (phải kiểm cách khác)
 *   · Dữ liệu migration chèn sẵn (công tắc, cài đặt): chỉ so cấu trúc.
 *   · Schema storage (kho file, policy của storage.objects): PGlite không có — kiểm tay theo danh sách
 *     cuối 0014_storage_supabase.sql và crm/README.md, mục "Nhật ký kiểm tay kho file".
 *   · Quyền của service_role, quyền trên sequence; thứ tự cột; chú thích (comment on).
 *
 * KẾT QUẢ: mã thoát 0 = khớp hết; 1 = có khác biệt; 2 = không đối chiếu được (thiếu biến, không nối
 * được, hết giờ, lỗi đọc). Không đọc xong thì KHÔNG BAO GIỜ in "KHỚP".
 *
 * CHUỖI KẾT NỐI chỉ đọc từ biến môi trường DOI_CHIEU_DB_URL — không bao giờ ghi vào file, không in ra:
 * màn hình chỉ hiện máy chủ và tên người dùng. Dùng chuỗi Session pooler (Supabase → Connect → Session
 * pooler), giống SAO_LUU_DB_URL của sao lưu. Máy chủ không phải máy này thì bắt buộc SSL (sslmode=require;
 * ghi sslmode=… trong chuỗi để đổi).
 */

import { execFileSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dungDatabaseTrong } from './kho-chung.mjs';

const THU_MUC = dirname(fileURLToPath(import.meta.url));
const GOC = join(THU_MUC, '..', '..');

// ---------------------------------------------------------------------------
// CHUẨN HOÁ THÂN HÀM
// ---------------------------------------------------------------------------
const CHU_TEN = /[\p{L}\p{N}_$]/u;

/**
 * Bỏ chú thích (`--` đến hết dòng, `/* *\/` kể cả lồng nhau) và khoảng trắng không mang nghĩa.
 * Khoảng trắng chỉ giữ một dấu cách khi nằm giữa hai chữ của tên / từ khoá ("select x" ≠ "selectx").
 * Chuỗi '…', E'…', tên "…" giữ nguyên từng ký tự. Chuỗi $tag$…$tag$ là SQL động → chuẩn hoá như mã.
 * \r\n tính như \n (file lấy từ máy Windows).
 */
export function chuanHoaThan(sql) {
  const s = String(sql ?? '').replace(/\r\n?/g, '\n');
  const manh = [];      // { ma: true } = mã (sẽ bỏ khoảng trắng), { ma: false } = chuỗi giữ nguyên
  let ma = '';
  const dayMa = () => { if (ma) { manh.push({ ma: true, t: ma }); ma = ''; } };
  const truoc = () => (ma.length ? ma[ma.length - 1] : '');
  let i = 0;
  while (i < s.length) {
    const c = s[i], c2 = s[i + 1];
    if (c === '-' && c2 === '-') {
      const j = s.indexOf('\n', i);
      i = j < 0 ? s.length : j;
      ma += ' ';
      continue;
    }
    if (c === '/' && c2 === '*') {
      let sau = 1, j = i + 2;
      while (j < s.length && sau > 0) {
        if (s[j] === '/' && s[j + 1] === '*') { sau++; j += 2; }
        else if (s[j] === '*' && s[j + 1] === '/') { sau--; j += 2; }
        else j++;
      }
      i = j;
      ma += ' ';
      continue;
    }
    if (c === "'" || c === '"') {
      // E'…' (hoặc e'…'): \ thoát ký tự kế. Chữ E phải đứng riêng, không phải đuôi của một tên.
      const thoatGach = c === "'" && /[eE]/.test(truoc()) && !CHU_TEN.test(ma[ma.length - 2] ?? '');
      let j = i + 1;
      while (j < s.length) {
        if (thoatGach && s[j] === '\\') { j += 2; continue; }
        if (s[j] === c) { if (s[j + 1] === c) { j += 2; continue; } break; }
        j++;
      }
      dayMa();
      manh.push({ ma: false, t: s.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    if (c === '$' && !CHU_TEN.test(truoc())) {
      // $tag$ / $$ — không phải $1 (tham số): tag không bắt đầu bằng số.
      const m = /^\$(?:[\p{L}_][\p{L}\p{N}_]*)?\$/u.exec(s.slice(i, i + 80));
      if (m) {
        const the = m[0];
        const j = s.indexOf(the, i + the.length);
        const het = j < 0 ? s.length : j + the.length;
        dayMa();
        manh.push({ ma: false, t: the + chuanHoaThan(s.slice(i + the.length, j < 0 ? s.length : j)) + the });
        i = het;
        continue;
      }
    }
    ma += c;
    i++;
  }
  dayMa();

  // Khoảng trắng trong mã: gộp thành một dấu cách, rồi bỏ dấu cách không nằm giữa hai chữ của tên.
  // Mảnh chuỗi kề bên tính là "không phải chữ" — nên dấu cách ở đầu / cuối mảnh mã cũng bỏ.
  return manh.map(({ ma: laMa, t }) => {
    if (!laMa) return t;
    const g = t.replace(/\s+/g, ' ');
    let ra = '';
    for (let k = 0; k < g.length; k++) {
      if (g[k] === ' ' && !(CHU_TEN.test(g[k - 1] ?? '') && CHU_TEN.test(g[k + 1] ?? ''))) continue;
      ra += g[k];
    }
    return ra;
  }).join('');
}

/** Định nghĩa Postgres tự sinh (pg_get_constraintdef, pg_get_indexdef…): chỉ gộp khoảng trắng. */
const gonKhoangTrang = s => String(s ?? '').replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------------------
// CÂU HỎI CATALOG — chạy y hệt trên mẫu (PGlite) và database đích (Supabase) — cả hai Postgres 17 (test-quy-trinh.mjs mục 1).
// Mỗi câu trả về (khoa, gia_tri, cha). `cha` = "<loai>:<khoa>" của đối tượng chứa nó (bảng, hàm).
// search_path rỗng: mọi tên trong định nghĩa Postgres tự sinh đều kèm schema, hai bên viết như nhau.
// ---------------------------------------------------------------------------
const KHONG_PHAI_EXTENSION = (bang, cot) =>
  `not exists (select from pg_depend d where d.classid = '${bang}'::regclass and d.objid = ${cot} and d.deptype = 'e')`;
const HAM_PUBLIC = `
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and ${KHONG_PHAI_EXTENSION('pg_proc', 'p.oid')}`;
const KHOA_HAM = `p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'`;
const BANG_PUBLIC = `
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f') and ${KHONG_PHAI_EXTENSION('pg_class', 'c.oid')}`;
/** Danh sách quyền (select, insert, update, delete) một vai có trên bảng c. */
const QUYEN_BANG = vai => `nullif(concat_ws(', ',
    case when has_table_privilege('${vai}', c.oid, 'SELECT') then 'select' end,
    case when has_table_privilege('${vai}', c.oid, 'INSERT') then 'insert' end,
    case when has_table_privilege('${vai}', c.oid, 'UPDATE') then 'update' end,
    case when has_table_privilege('${vai}', c.oid, 'DELETE') then 'delete' end), '')`;

export const NHOM = [
  {
    loai: 'ham', ten: 'Hàm — có mặt, kiểu trả về, security definer, search_path', chuanHoa: gonKhoangTrang,
    cau: `
      select ${KHOA_HAM} as khoa,
        concat_ws(' · ',
          case p.prokind when 'p' then 'procedure' when 'a' then 'aggregate' when 'w' then 'window'
            else 'returns ' || pg_get_function_result(p.oid) end,
          'language ' || (select l.lanname from pg_language l where l.oid = p.prolang),
          case when p.prosecdef then 'security definer' end,
          case p.provolatile when 'i' then 'immutable' when 's' then 'stable' end,
          case when p.proisstrict then 'strict' end,
          (select string_agg('set ' || x, ', ' order by x) from unnest(p.proconfig) x)) as gia_tri,
        null::text as cha
      ${HAM_PUBLIC}`,
  },
  {
    loai: 'than_ham', ten: 'Thân hàm (bỏ chú thích và khoảng trắng)', chuanHoa: chuanHoaThan, soTungChu: true,
    cau: `select ${KHOA_HAM} as khoa, p.prosrc as gia_tri, 'ham:' || ${KHOA_HAM} as cha ${HAM_PUBLIC}`,
  },
  {
    loai: 'bang', ten: 'Bảng và view — có mặt, RLS bật / tắt, tuỳ chọn', chuanHoa: gonKhoangTrang,
    cau: `
      select c.relname as khoa,
        concat_ws(' · ',
          case c.relkind when 'r' then 'bảng' when 'p' then 'bảng phân vùng' when 'v' then 'view'
            when 'm' then 'materialized view' else 'bảng ngoài' end,
          case when c.relkind in ('r', 'p') then case when c.relrowsecurity then 'RLS bật' else 'RLS TẮT' end end,
          case when c.relforcerowsecurity then 'RLS ép cả chủ bảng' end,
          (select string_agg(x, ', ' order by x) from unnest(c.reloptions) x)) as gia_tri,
        null::text as cha
      ${BANG_PUBLIC}`,
  },
  {
    loai: 'cot', ten: 'Cột — kiểu, not null, mặc định', chuanHoa: gonKhoangTrang,
    cau: `
      select c.relname || '.' || a.attname as khoa,
        concat_ws(' ', format_type(a.atttypid, a.atttypmod),
          case when a.attnotnull then 'not null' end,
          case when a.attgenerated = 's' then 'generated always as (' || pg_get_expr(ad.adbin, ad.adrelid) || ') stored'
               when ad.adbin is not null then 'default ' || pg_get_expr(ad.adbin, ad.adrelid) end,
          case a.attidentity when 'a' then 'generated always as identity'
                             when 'd' then 'generated by default as identity' end) as gia_tri,
        'bang:' || c.relname as cha
      from pg_attribute a
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      left join pg_attrdef ad on ad.adrelid = a.attrelid and ad.adnum = a.attnum
      where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f') and a.attnum > 0 and not a.attisdropped
        and ${KHONG_PHAI_EXTENSION('pg_class', 'c.oid')}`,
  },
  {
    loai: 'rang_buoc', ten: 'Ràng buộc — khóa chính, khóa ngoại, unique, check, exclude', chuanHoa: gonKhoangTrang,
    cau: `
      select c.relname || '.' || con.conname as khoa, pg_get_constraintdef(con.oid) as gia_tri,
        'bang:' || c.relname as cha
      from pg_constraint con
      join pg_class c on c.oid = con.conrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and con.contype in ('p', 'u', 'f', 'c', 'x')
        and ${KHONG_PHAI_EXTENSION('pg_class', 'c.oid')}`,
  },
  {
    // Chỉ mục của khóa chính / unique / exclude đã nằm trong nhóm ràng buộc — không kể hai lần.
    loai: 'chi_muc', ten: 'Chỉ mục (index)', chuanHoa: gonKhoangTrang,
    cau: `
      select i.relname as khoa,
        pg_get_indexdef(i.oid) || case when not x.indisvalid then ' — HỎNG (invalid): tạo lại' else '' end as gia_tri,
        'bang:' || t.relname as cha
      from pg_index x
      join pg_class i on i.oid = x.indexrelid
      join pg_class t on t.oid = x.indrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and not exists (select from pg_constraint con where con.conindid = x.indexrelid and con.contype in ('p', 'u', 'x'))
        and ${KHONG_PHAI_EXTENSION('pg_class', 't.oid')}`,
  },
  {
    loai: 'trigger', ten: 'Trigger', chuanHoa: gonKhoangTrang,
    cau: `
      select c.relname || '.' || tg.tgname as khoa,
        pg_get_triggerdef(tg.oid) || case tg.tgenabled when 'D' then ' — ĐANG TẮT' when 'R' then ' — chỉ chạy khi replica'
          when 'A' then ' — chạy cả khi replica' else '' end as gia_tri,
        'bang:' || c.relname as cha
      from pg_trigger tg
      join pg_class c on c.oid = tg.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and not tg.tgisinternal and ${KHONG_PHAI_EXTENSION('pg_class', 'c.oid')}`,
  },
  {
    loai: 'chinh_sach', ten: 'Chính sách RLS (policy)', chuanHoa: gonKhoangTrang,
    cau: `
      select c.relname || '.' || p.polname as khoa,
        concat_ws(' · ',
          'for ' || case p.polcmd when 'r' then 'select' when 'a' then 'insert' when 'w' then 'update'
            when 'd' then 'delete' else 'all' end,
          case when not p.polpermissive then 'restrictive' end,
          'to ' || (select string_agg(v.ten, ', ' order by v.ten) from (
            select case when r.x = 0 then 'public' else (select rolname from pg_roles where oid = r.x) end as ten
            from unnest(p.polroles) as r(x)) v),
          'using (' || pg_get_expr(p.polqual, p.polrelid) || ')',
          'with check (' || pg_get_expr(p.polwithcheck, p.polrelid) || ')') as gia_tri,
        'bang:' || c.relname as cha
      from pg_policy p
      join pg_class c on c.oid = p.polrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and ${KHONG_PHAI_EXTENSION('pg_class', 'c.oid')}`,
  },
  {
    loai: 'view', ten: 'Định nghĩa view', chuanHoa: chuanHoaThan, soTungChu: true,
    cau: `
      select c.relname as khoa, pg_get_viewdef(c.oid) as gia_tri, 'bang:' || c.relname as cha
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('v', 'm') and ${KHONG_PHAI_EXTENSION('pg_class', 'c.oid')}`,
  },
  {
    loai: 'kieu', ten: 'Kiểu enum / domain', chuanHoa: gonKhoangTrang,
    cau: `
      select t.typname as khoa,
        case t.typtype
          when 'e' then 'enum (' || coalesce((select string_agg(quote_literal(e.enumlabel), ', ' order by e.enumsortorder)
                                              from pg_enum e where e.enumtypid = t.oid), '') || ')'
          else 'domain ' || format_type(t.typbasetype, t.typtypmod) || case when t.typnotnull then ' not null' else '' end
            || coalesce(' ' || (select string_agg(pg_get_constraintdef(con.oid), ' ' order by con.conname)
                                from pg_constraint con where con.contypid = t.oid and con.contype = 'c'), '')
        end as gia_tri,
        null::text as cha
      from pg_type t join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public' and t.typtype in ('e', 'd') and ${KHONG_PHAI_EXTENSION('pg_type', 't.oid')}`,
  },
  {
    // Khối "chốt quyền" ở cuối mỗi migration là một mảnh riêng — mảnh đó không chạy thì hàm nội bộ lộ ra
    // cho anon mà không gì báo. So quyền THẬT (has_*_privilege, gồm cả quyền của PUBLIC), không so chữ ACL.
    loai: 'quyen', ten: 'Quyền của anon và authenticated', chuanHoa: gonKhoangTrang,
    cau: `
      select 'hàm ' || ${KHOA_HAM} as khoa,
        concat_ws(' · ',
          case when has_function_privilege('anon', p.oid, 'EXECUTE') then 'anon gọi được' end,
          case when has_function_privilege('authenticated', p.oid, 'EXECUTE') then 'authenticated gọi được' end) as gia_tri,
        'ham:' || ${KHOA_HAM} as cha
      ${HAM_PUBLIC}
      union all
      select 'bảng ' || c.relname,
        concat_ws(' · ', 'anon: ' || ${QUYEN_BANG('anon')}, 'authenticated: ' || ${QUYEN_BANG('authenticated')}),
        'bang:' || c.relname
      ${BANG_PUBLIC}
      union all
      select 'cột ' || c.relname || '.' || a.attname,
        string_agg(r.rolname || ' ' || lower(e.privilege_type), ', ' order by r.rolname, e.privilege_type),
        'bang:' || c.relname
      from pg_attribute a
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      cross join lateral aclexplode(a.attacl) e
      join pg_roles r on r.oid = e.grantee
      where n.nspname = 'public' and a.attacl is not null and not a.attisdropped and r.rolname in ('anon', 'authenticated')
      group by c.relname, a.attname`,
  },
];

/**
 * Đọc cấu trúc schema public: Map loai → Map khoa → { giaTri (đã chuẩn hoá), goc, cha }.
 * `chay(sql)` trả về mảng dòng, chạy TRONG một giao dịch chỉ đọc (begin read only / set transaction
 * read only) — không ở trong giao dịch chỉ đọc thì từ chối, kể cả khi mọi câu chỉ là select.
 */
export async function docCauTruc(chay) {
  const [{ chi_doc: chiDoc }] = await chay(`select current_setting('transaction_read_only') as chi_doc`);
  if (chiDoc !== 'on') throw new Error('docCauTruc chỉ chạy trong giao dịch chỉ đọc (begin read only)');
  await chay(`set local search_path = ''`);
  await chay(`set local statement_timeout = '120s'`);
  const anh = new Map();
  for (const nhom of NHOM) {
    const theoKhoa = new Map();
    for (const r of await chay(nhom.cau)) {
      theoKhoa.set(r.khoa, { giaTri: nhom.chuanHoa(r.gia_tri), goc: r.gia_tri ?? '', cha: r.cha ?? null });
    }
    anh.set(nhom.loai, theoKhoa);
  }
  return anh;
}

/** Đọc cấu trúc một database PGlite (mẫu, hoặc database thử trong kiểm thử) trong giao dịch chỉ đọc. */
export async function docPglite(db) {
  return db.transaction(async tx => {
    await tx.exec('set transaction read only');
    return docCauTruc(async q => (await tx.query(q)).rows);
  });
}

/** Mẫu: PGlite trống + mọi migration đến số `den`. Trả { db, daNap, chiMuc } — chiMuc: gợi ý file (lapChiMucTep). */
export async function dungMau({ den = Infinity } = {}) {
  const { db, daNap, vanBan } = await dungDatabaseTrong({ den });
  return { db, daNap, chiMuc: lapChiMucTep(vanBan) };
}

// ---------------------------------------------------------------------------
// SO SÁNH
// ---------------------------------------------------------------------------
/**
 * So hai ảnh cấu trúc. Trả mảng theo NHOM: { loai, ten, soMau, soDich, thieu[], khac[], thua[], anThieu, anThua }.
 * thieu / thua: danh sách khoá. khac: { khoa, mau, dich }. anThieu / anThua: số đối tượng con không kể
 * riêng vì đối tượng chứa nó (bảng, hàm) đã thiếu / thừa.
 */
export function soSanh(mau, dich) {
  const thieuCha = new Set(), thuaCha = new Set();
  for (const { loai } of NHOM) {
    const m = mau.get(loai) ?? new Map(), d = dich.get(loai) ?? new Map();
    for (const k of m.keys()) if (!d.has(k)) thieuCha.add(`${loai}:${k}`);
    for (const k of d.keys()) if (!m.has(k)) thuaCha.add(`${loai}:${k}`);
  }
  return NHOM.map(nhom => {
    const m = mau.get(nhom.loai) ?? new Map(), d = dich.get(nhom.loai) ?? new Map();
    const kq = { loai: nhom.loai, ten: nhom.ten, soTungChu: !!nhom.soTungChu, soMau: m.size, soDich: d.size,
      thieu: [], khac: [], thua: [], anThieu: 0, anThua: 0 };
    for (const [k, v] of m) {
      const bv = d.get(k);
      if (!bv) {
        if (v.cha && thieuCha.has(v.cha)) kq.anThieu++; else kq.thieu.push(k);
      } else if (v.giaTri !== bv.giaTri) {
        kq.khac.push({ khoa: k, mau: v.giaTri, dich: bv.giaTri });
      }
    }
    for (const [k, v] of d) {
      if (m.has(k)) continue;
      if (v.cha && thuaCha.has(v.cha)) kq.anThua++; else kq.thua.push(k);
    }
    for (const x of ['thieu', 'thua']) kq[x].sort();
    kq.khac.sort((a, b) => a.khoa.localeCompare(b.khoa));
    return kq;
  });
}

export const tongKhacBiet = ketQua => ketQua.reduce((t, n) => t + n.thieu.length + n.khac.length + n.thua.length, 0);

// ---------------------------------------------------------------------------
// GỢI Ý FILE MIGRATION — chỉ câu create / drop thật, không phải grant, alter, comment nhắc tên
// ---------------------------------------------------------------------------
const S = '(?:public\\.)?';
const T = '(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))';     // tên trong ngoặc kép, hoặc tên thường
const TAO_VIEW = `create\\s+(?:or\\s+replace\\s+)?(?:materialized\\s+)?view\\s+(?:if\\s+not\\s+exists\\s+)?${S}${T}[\\s(]`;
const XOA_VIEW = `drop\\s+(?:materialized\\s+)?view\\s+(?:if\\s+exists\\s+)?${S}${T}`;
const MAU_TAO = {
  ham: [`create\\s+(?:or\\s+replace\\s+)?function\\s+${S}${T}\\s*\\(`],
  bang: [`create\\s+(?:unlogged\\s+)?table\\s+(?:if\\s+not\\s+exists\\s+)?${S}${T}[\\s(]`, TAO_VIEW],
  view: [TAO_VIEW],
  chi_muc: [`create\\s+(?:unique\\s+)?index\\s+(?:concurrently\\s+)?(?:if\\s+not\\s+exists\\s+)?${T}\\s+on\\b`],
  trigger: [`create\\s+(?:or\\s+replace\\s+)?(?:constraint\\s+)?trigger\\s+${T}\\s`],
  chinh_sach: [`create\\s+policy\\s+${T}\\s+on\\b`],
  kieu: [`create\\s+type\\s+${S}${T}\\s+as\\b`, `create\\s+domain\\s+${S}${T}\\s`],
  // Ràng buộc đặt tên trong create table / alter table add constraint — không phải drop / validate / rename.
  rang_buoc: [`(?<!(?:drop|validate|rename)\\s+)constraint\\s+${T}\\s`],
};
MAU_TAO.than_ham = MAU_TAO.ham;
const MAU_XOA = {
  ham: [`drop\\s+function\\s+(?:if\\s+exists\\s+)?${S}${T}`],
  bang: [`drop\\s+table\\s+(?:if\\s+exists\\s+)?${S}${T}`, XOA_VIEW],
  view: [XOA_VIEW],
  chi_muc: [`drop\\s+index\\s+(?:concurrently\\s+)?(?:if\\s+exists\\s+)?${S}${T}`],
  trigger: [`drop\\s+trigger\\s+(?:if\\s+exists\\s+)?${T}`],
  chinh_sach: [`drop\\s+policy\\s+(?:if\\s+exists\\s+)?${T}`],
  kieu: [`drop\\s+(?:type|domain)\\s+(?:if\\s+exists\\s+)?${S}${T}`],
  rang_buoc: [`drop\\s+constraint\\s+(?:if\\s+exists\\s+)?${T}`],
};

/**
 * Đọc mọi file migration MỘT lần: với mỗi loại đối tượng, tên → file CUỐI CÙNG có câu create (và câu drop)
 * của tên đó. Hàm trùng tên khác tham số tính chung một tên.
 */
export function lapChiMucTep(vanBan) {
  const chiMuc = { tao: {}, xoa: {} };
  for (const [kieu, bo] of [['tao', MAU_TAO], ['xoa', MAU_XOA]]) {
    for (const [loai, cacMau] of Object.entries(bo)) {
      const theoTen = (chiMuc[kieu][loai] = new Map());
      const re = new RegExp(cacMau.join('|'), 'gi');
      for (const [f, sql] of vanBan) {
        for (const m of sql.replace(/--[^\n]*/g, '').matchAll(re)) {
          const i = m.findIndex((g, j) => j > 0 && g !== undefined);
          // Tên không ngoặc kép thì Postgres đổi thành chữ thường; trong ngoặc kép thì giữ nguyên.
          if (i > 0) theoTen.set(i % 2 === 1 ? m[i] : m[i].toLowerCase(), f);
        }
      }
    }
  }
  return chiMuc;
}

const tenDoiTuong = (loai, khoa) => {
  if (loai === 'ham' || loai === 'than_ham') return khoa.slice(0, khoa.indexOf('('));
  if (['trigger', 'chinh_sach', 'rang_buoc'].includes(loai)) return khoa.slice(khoa.indexOf('.') + 1);
  return khoa;
};
/** File migration cuối cùng tạo (hoặc drop, khi `xoa`) đối tượng này — gợi ý để biết chạy lại câu nào. */
export function timTep(chiMuc, loai, khoa, { xoa = false } = {}) {
  return chiMuc?.[xoa ? 'xoa' : 'tao']?.[loai]?.get(tenDoiTuong(loai, khoa)) ?? null;
}

// ---------------------------------------------------------------------------
// BÁO CÁO
// ---------------------------------------------------------------------------
const cat = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s);
/** Đoạn quanh chỗ khác đầu tiên của hai chuỗi đã chuẩn hoá. */
export function choKhac(a, b, rong = 60) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const doan = s => (i > rong ? '…' : '') + s.slice(Math.max(0, i - rong), i + rong) + (i + rong < s.length ? '…' : '');
  return { viTri: i, mau: doan(a), dich: doan(b) };
}

/** Các dòng báo cáo (chữ thường, không màu) — in ra màn hình, và kiểm thử đọc lại được. */
export function baoCao(ketQua, chiMuc = null) {
  const d = [];
  for (const n of ketQua) {
    const so = n.thieu.length + n.khac.length + n.thua.length;
    const an = [n.anThieu && `${n.anThieu} thuộc bảng / hàm đã báo THIẾU`, n.anThua && `${n.anThua} thuộc bảng / hàm đã báo THỪA`]
      .filter(Boolean).join(', ');
    d.push(`${so ? '✗' : '✓'} ${n.ten} — mẫu ${n.soMau}, database ${n.soDich}${so ? `: ${so} khác biệt` : ''}${an ? ` (lệch ${an})` : ''}`);
    for (const k of n.thieu) {
      const f = timTep(chiMuc, n.loai, k);
      d.push(`    THIẾU  ${k}${f ? `   ← tạo ở ${f}` : ''}`);
    }
    for (const x of n.khac) {
      const f = timTep(chiMuc, n.loai, x.khoa);
      d.push(`    KHÁC   ${x.khoa}${f ? `   ← định nghĩa cuối ở ${f}` : ''}`);
      if (n.soTungChu) {
        const c = choKhac(x.mau, x.dich);
        d.push(`             khác từ ký tự ${c.viTri} (đã bỏ chú thích, khoảng trắng):`);
        d.push(`             migration: ${c.mau}`);
        d.push(`             database:  ${c.dich}`);
      } else {
        d.push(`             migration: ${cat(x.mau, 400) || '(không có)'}`);
        d.push(`             database:  ${cat(x.dich, 400) || '(không có)'}`);
      }
    }
    for (const k of n.thua) {
      const f = timTep(chiMuc, n.loai, k, { xoa: true });
      d.push(`    THỪA   ${k}${f ? `   ← ${f} đã drop — câu drop chưa chạy?` : '   ← migration không tạo'}`);
    }
  }
  return d;
}

// ---------------------------------------------------------------------------
// DÒNG LỆNH
// ---------------------------------------------------------------------------
/** Thông tin git để người chạy biết đang so với migration của commit nào. Lỗi git thì bỏ qua. */
function thongTinGit(daNap) {
  const git = args => execFileSync('git', args, { cwd: GOC, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  const ra = { dong: [], canhBao: [] };
  try {
    ra.dong.push(`commit ${git(['rev-parse', '--short', 'HEAD'])} (nhánh ${git(['rev-parse', '--abbrev-ref', 'HEAD'])})`);
    const trenMain = new Set(git(['ls-tree', '--name-only', 'origin/main', '--', 'crm/supabase/migrations/'])
      .split('\n').filter(Boolean).map(f => f.split('/').pop()));
    const chuaGop = daNap.filter(f => !trenMain.has(f));
    if (chuaGop.length) {
      ra.canhBao.push(`${chuaGop.length} migration chưa có trên origin/main: ${chuaGop.join(', ')} — đối tượng của chúng sẽ hiện THIẾU. `
        + 'So đúng production: git checkout main && git pull, hoặc --den <số>.');
    }
    const soCuoi = Number((daNap.at(-1) ?? '0').slice(0, 4));
    const moiHon = [...trenMain].filter(f => f.endsWith('.sql') && !daNap.includes(f) && Number(f.slice(0, 4)) <= soCuoi);
    const sauDen = [...trenMain].filter(f => f.endsWith('.sql') && Number(f.slice(0, 4)) > soCuoi);
    if (moiHon.length) ra.canhBao.push(`Thư mục đang mở thiếu ${moiHon.length} migration của origin/main: ${moiHon.join(', ')} — git pull trước.`);
    if (sauDen.length) ra.dong.push(`origin/main còn ${sauDen.length} migration sau ${String(soCuoi).padStart(4, '0')} không so: ${sauDen.join(', ')}`);
  } catch { /* không có git / không có origin/main: chạy tiếp, chỉ thiếu dòng thông tin */ }
  return ra;
}

/**
 * Tham số dòng lệnh: --den <số> / --den=<số>, --gioi-han <giây> / --gioi-han=<giây>. Thứ gì khác — kể cả
 * --den thiếu số — là LỖI chứ không bỏ qua: bỏ qua --den là so với cả migration chưa chạy lên production.
 */
export function docThamSo(argv) {
  const gt = { '--den': undefined, '--gioi-han': undefined };
  const loi = [];
  for (let i = 0; i < argv.length; i++) {
    const [ten, sauBang] = argv[i].split(/=(.*)/s);
    if (!(ten in gt)) { loi.push(`không hiểu tham số ${argv[i]}`); continue; }
    gt[ten] = sauBang ?? (argv[i + 1]?.startsWith('--') ? undefined : argv[++i]);
    if (gt[ten] === undefined) loi.push(`${ten} thiếu giá trị`);
  }
  const den = gt['--den'], gioiHan = gt['--gioi-han'];
  if (den !== undefined && !/^\d{1,4}$/.test(den)) loi.push('--den cần một số migration, ví dụ --den 0061');
  if (gioiHan !== undefined && !(/^\d+$/.test(gioiHan) && Number(gioiHan) > 0)) loi.push('--gioi-han cần số giây, ví dụ --gioi-han 300');
  return { den: den === undefined ? Infinity : Number(den), gioiHanMs: (gioiHan === undefined ? 180 : Number(gioiHan)) * 1000, loi };
}

/** Thay mọi chỗ chứa chuỗi kết nối / mật khẩu trong câu lỗi bằng *** — lỗi được in ra màn hình. */
function cheBiMat(cau, url, matKhau) {
  let s = String(cau ?? '');
  for (const bm of [url, matKhau, (() => { try { return decodeURIComponent(matKhau); } catch { return ''; } })()]) {
    if (bm && bm.length >= 3) s = s.split(bm).join('***');
  }
  return s;
}

/**
 * Đọc database đích qua chuỗi kết nối, giao dịch chỉ đọc, có giới hạn giờ. Trả ảnh cấu trúc hoặc ném lỗi.
 * Tách riêng để kiểm thử gọi được với máy chủ giả (không nối được, nối được mà im lặng).
 */
async function docDatabaseDich(url, u, gioiHanMs) {
  const { default: postgres } = await import('postgres');
  const mayNay = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(u.hostname);
  const sql = postgres(url, {
    max: 1,
    prepare: false,            // pooler kiểu transaction (cổng 6543) không giữ câu prepare
    fetch_types: false,
    connect_timeout: Math.min(30, Math.ceil(gioiHanMs / 1000)),
    idle_timeout: 5,
    onnotice: () => {},
    connection: { application_name: 'beeftown-doi-chieu' },
    ...(u.searchParams.has('sslmode') ? {} : { ssl: mayNay ? 'prefer' : 'require' }),
  });
  let hen;
  try {
    return await Promise.race([
      sql.begin('read only', tx => docCauTruc(q => tx.unsafe(q))),
      new Promise((_, tuChoi) => { hen = setTimeout(() => tuChoi(new Error(`hết ${gioiHanMs / 1000} giây chờ database`)), gioiHanMs); }),
    ]);
  } finally {
    clearTimeout(hen);
    await Promise.race([sql.end({ timeout: 2 }).catch(() => {}), new Promise(r => setTimeout(r, 3000))]);
  }
}

/** Chạy cả lệnh: trả mã thoát (0 khớp, 1 khác biệt, 2 không đối chiếu được). */
export async function chayDongLenh(argv, env, ghi = console.log) {
  const dam = s => `\x1b[1m${s}\x1b[0m`, do_ = s => `\x1b[31m${s}\x1b[0m`, xanh = s => `\x1b[32m${s}\x1b[0m`, vang = s => `\x1b[33m${s}\x1b[0m`;
  const khongDoiChieu = cau => {
    ghi(do_(`\n✗ Không đối chiếu được: ${cau}`));
    ghi('  Chưa so được gì — KHÔNG có nghĩa là database khớp.\n');
    return 2;
  };

  ghi(dam('\nBEEFTOWN — ĐỐI CHIẾU DATABASE VỚI MIGRATION'));
  ghi('='.repeat(60));

  const { den, gioiHanMs, loi } = docThamSo(argv);
  if (loi.length) return khongDoiChieu(loi.join('; '));

  const url = env.DOI_CHIEU_DB_URL ?? '';
  if (!url.trim()) {
    return khongDoiChieu('thiếu biến môi trường DOI_CHIEU_DB_URL — chuỗi Session pooler của project '
      + '(Supabase → Connect → Session pooler, thay [YOUR-PASSWORD]). Xem README gốc, mục "Chạy migration lên production".');
  }
  let u;
  try { u = new URL(url); } catch { u = null; }
  if (!u || !/^postgres(ql)?:$/.test(u.protocol) || !u.hostname) {
    return khongDoiChieu('DOI_CHIEU_DB_URL không đọc được — cần dạng postgresql://người-dùng:mật-khẩu@máy-chủ:5432/postgres. '
      + 'Mật khẩu có ký tự @ # / ? : thì viết mã hoá (@ → %40, # → %23, / → %2F, ? → %3F, : → %3A).');
  }
  ghi(`Database: ${u.hostname}:${u.port || 5432}${u.pathname} (người dùng ${decodeURIComponent(u.username) || '—'})`);

  // 1. Đọc database trước: không nối được thì dừng ngay, không mất 20 giây dựng mẫu.
  let dich;
  try {
    dich = await docDatabaseDich(url, u, gioiHanMs);
  } catch (e) {
    return khongDoiChieu(cheBiMat(e?.message || e, url, u.password));
  }

  // 2. Mẫu từ migration.
  let mau, daNap, chiMuc, dbMau;
  try {
    ({ db: dbMau, daNap, chiMuc } = await dungMau({ den }));
    mau = await docPglite(dbMau);
  } catch (e) {
    return khongDoiChieu(`không dựng được mẫu từ migration: ${e?.message || e}`);
  } finally {
    await dbMau?.close().catch(() => {});
  }
  if (!daNap.length) return khongDoiChieu(`không có migration nào${Number.isFinite(den) ? ` đến số ${den}` : ''}`);
  const git = thongTinGit(daNap);
  ghi(`Mẫu:     ${daNap.length} migration, ${daNap[0]} → ${daNap.at(-1)}${git.dong.length ? `; ${git.dong.join('; ')}` : ''}`);
  for (const c of git.canhBao) ghi(vang(`! ${c}`));
  ghi('');

  // 3. So.
  const ketQua = soSanh(mau, dich);
  for (const dong of baoCao(ketQua, chiMuc)) {
    ghi(dong.startsWith('✓') ? xanh(dong.slice(0, 1)) + dong.slice(1) : dong.startsWith('✗') ? do_(dong.slice(0, 1)) + dong.slice(1) : dong);
  }
  const tong = tongKhacBiet(ketQua);
  const soDoiTuong = ketQua.reduce((t, n) => t + n.soMau, 0);
  ghi('\n' + '='.repeat(60));
  if (tong === 0) {
    ghi(xanh(dam(`KHỚP — ${soDoiTuong} đối tượng của ${daNap.length} migration đều có và đúng trên database`)));
    return 0;
  }
  const dem = k => ketQua.reduce((t, n) => t + n[k].length, 0);
  ghi(do_(dam(`${tong} KHÁC BIỆT — ${dem('thieu')} thiếu, ${dem('khac')} khác, ${dem('thua')} thừa`)));
  ghi('Thiếu / khác: chạy lại ĐÚNG câu tạo đối tượng đó (file ghi bên cạnh) ở Supabase → SQL Editor — create or replace');
  ghi('function chạy lại an toàn; đừng chạy lại cả file có insert / alter table add column. Rồi chạy lại lệnh này.');
  ghi('Thừa: database có mà migration không tạo — xem ai tạo tay, hay câu drop nào chưa chạy, TRƯỚC khi xoá.');
  return 1;
}

const laChayTrucTiep = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (laChayTrucTiep) {
  process.exit(await chayDongLenh(process.argv.slice(2), process.env));
}
