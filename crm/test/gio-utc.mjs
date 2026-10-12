/**
 * BEEFTOWN — DÒ NGÀY THEO GIỜ UTC TRONG MIGRATION
 * ===============================================
 * Dùng chung cho kiem-migration.mjs (gác file migration mới) và test-chi-so-gio-vn.mjs (kiểm chính
 * bộ dò). Chỉ cần node — kiem-migration chạy trên CI trước cả npm ci.
 *
 * Trên Supabase, TimeZone của phiên là UTC: `<timestamptz>::date` cắt ngày theo UTC. Lượt ghé 00:30
 * giờ Việt Nam ngày 11 là 17:30 UTC ngày 10 — chi_so_crm (0008) đếm nó sang ngày 10. current_date /
 * now()::date bị chặn từ 0008; cột / biến timestamptz thì regex cũ không nhìn thấy.
 *
 * Một chuỗi SQL không mang kiểu, nên bộ dò dựa vào TÊN: mọi tên được khai `<tên> timestamptz` (cột,
 * biến, tham số) trong bất kỳ migration nào, cộng bí danh `min(<tên>) as …` / `max(<tên>) as …`. Tên
 * cũng từng được khai kiểu date / time / timestamp (không múi giờ) ở đâu đó thì bỏ — mơ hồ, tránh báo
 * nhầm. Ép ngày đúng cách đi qua `at time zone` (ngay_vn(), hom_nay_vn()…), nên thành `)::date`, không
 * khớp mẫu `<tên>::date`.
 */

const BO = new Set(['returns', 'as', 'add', 'column', 'type', 'then', 'else', 'and', 'or', 'default', 'not',
  'null', 'is', 'by', 'when', 'in', 'cast', 'with', 'alter', 'set', 'select', 'for', 'end', 'table', 'return',
  'if', 'on', 'to', 'of', 'from', 'where', 'begin', 'declare', 'language', 'record']);

const boChuThich = sql => sql.replace(/--[^\n]*/g, '');

/** Tên cột / biến / tham số kiểu timestamptz trong một bộ migration (mảng chuỗi SQL). */
export function tenTimestamptz(cacVanBan) {
  const ts = new Set(), khac = new Set();
  for (const goc of cacVanBan) {
    const sql = boChuThich(goc);
    for (const m of sql.matchAll(/\b([a-z_][a-z0-9_]*)\s+(?:timestamptz|timestamp\s+with\s+time\s+zone)\b/gi)) ts.add(m[1].toLowerCase());
    for (const m of sql.matchAll(/\b([a-z_][a-z0-9_]*)\s+(?:date|time|timestamp)\b(?!\s*tz)(?!\s+with\s+time\s+zone)/gi)) khac.add(m[1].toLowerCase());
  }
  const ten = new Set([...ts].filter(t => !khac.has(t) && !BO.has(t)));
  // Bí danh của min / max một cột timestamptz: `min(thoi_diem) as lan_dau` (chi_so_crm, 0008).
  for (const goc of cacVanBan) {
    for (const m of boChuThich(goc).matchAll(/\b(?:min|max)\s*\(\s*(?:[a-z_][a-z0-9_]*\.)?([a-z_][a-z0-9_]*)\s*\)\s+(?:as\s+)?([a-z_][a-z0-9_]*)/gi)) {
      if (ten.has(m[1].toLowerCase()) && !khac.has(m[2].toLowerCase()) && !BO.has(m[2].toLowerCase())) ten.add(m[2].toLowerCase());
    }
  }
  return ten;
}

/**
 * Những chỗ cắt ngày theo giờ UTC trong một file migration: current_date / current_time / localtime /
 * localtimestamp, now()::date, và <tên timestamptz>::date / date(<tên>) / cast(<tên> as date) /
 * date_trunc('day', <tên>). Trả mảng chuỗi khớp (rỗng = sạch).
 */
export function timNgayUtc(goc, ten) {
  const sql = boChuThich(goc);
  const thay = [];
  for (const m of sql.matchAll(/\b(current_date|current_time|localtime|localtimestamp)\b|now\(\)\s*::\s*date/gi)) thay.push(m[0]);
  if (ten.size) {
    const ds = [...ten].join('|');
    const cot = `(?:[a-z_][a-z0-9_]*\\.)?(?:${ds})`;
    const mau = new RegExp(
      `\\b${cot}\\s*::\\s*date\\b`
      + `|\\bdate\\s*\\(\\s*${cot}\\s*\\)`
      + `|\\bcast\\s*\\(\\s*${cot}\\s+as\\s+date\\s*\\)`
      + `|\\bdate_trunc\\s*\\(\\s*'day'\\s*,\\s*${cot}\\s*\\)`, 'gi');
    for (const m of sql.matchAll(mau)) thay.push(m[0]);
  }
  return thay;
}
