/**
 * BEEFTOWN — KIỂM THỬ ĐỐI CHIẾU DATABASE VỚI MIGRATION (doi-chieu-production.mjs)
 * ==============================================================================
 *
 *     node test/test-doi-chieu-production.mjs
 *
 * doi-chieu-production.mjs nối vào database THẬT nên không chạy trong npm test. File này kiểm chính
 * công cụ đó trên PGlite: "database đích" là một PGlite thứ hai dựng từ mọi migration, rồi bị làm hỏng
 * đúng kiểu production từng hỏng (04/10/2026: một mảnh migration không chạy → thiếu
 * bao_dong_bat_dau_luot và kho_may_can_nhat_ky). Mỗi lần làm hỏng chạy trong một giao dịch rồi
 * rollback, nên các nhóm không ảnh hưởng nhau.
 *
 * Dòng lệnh (nhóm 9) chạy thật bằng tiến trình con với máy chủ giả: không nối được, nối được mà im
 * lặng, nối xong bị cắt — không trường hợp nào được in "KHỚP" hay lộ mật khẩu.
 */

import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import net from 'node:net';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import {
  chuanHoaThan, dungMau, docPglite, docCauTruc, soSanh, tongKhacBiet, baoCao, timTep, docThamSo,
} from './doi-chieu-production.mjs';

const THU_MUC = dirname(fileURLToPath(import.meta.url));
const GOC = join(THU_MUC, '..', '..');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — ĐỐI CHIẾU DATABASE THẬT VỚI MIGRATION');

const BAO_DONG = 'bao_dong_bat_dau_luot(p_kenh text)';
const MAY_CAN = 'kho_may_can_nhat_ky(p_chi_nhanh_id uuid, p_ma_may uuid, p_dong jsonb)';

const { db: dbMau, chiMuc } = await dungMau();
const mau = await docPglite(dbMau);
const { db: dbDich } = await dungMau();

/** Làm hỏng database đích bằng `sqlDoi`, đọc cấu trúc, rồi rollback. Trả kết quả so với mẫu. */
async function sauKhi(sqlDoi) {
  const dich = await dbDich.transaction(async tx => {
    await tx.exec(sqlDoi);
    await tx.exec('set transaction read only');
    const anh = await docCauTruc(async q => (await tx.query(q)).rows);
    await tx.rollback();
    return anh;
  });
  const kq = soSanh(mau, dich);
  const n = loai => kq.find(x => x.loai === loai);
  return { kq, n, tong: tongKhacBiet(kq), bao: baoCao(kq, chiMuc).join('\n') };
}
const ds = (n, loai, x) => JSON.stringify(n(loai)[x].map(k => (typeof k === 'string' ? k : k.khoa)));
/** Khoá đầu tiên của một nhóm trong mẫu thoả điều kiện — tách "bảng.tên". */
function dauTien(loai, dk = () => true) {
  const [k, v] = [...mau.get(loai)].find(([k, v]) => dk(k, v)) ?? [];
  if (!k) throw new Error(`mẫu không có ${loai} nào thoả điều kiện`);
  const i = k.indexOf('.');
  return { khoa: k, bang: k.slice(0, i), ten: k.slice(i + 1), giaTri: v.giaTri };
}

// ===========================================================================
await nhom('1 · CHUẨN HOÁ THÂN HÀM: bỏ chú thích và khoảng trắng, giữ nguyên chuỗi', async () => {
  const bang = (a, b) => chuanHoaThan(a) === chuanHoaThan(b);
  ok('Bỏ chú thích -- cuối dòng và dòng chỉ có chú thích', bang('select 1; -- một\n-- hai\nselect 2;', 'select 1;\nselect 2;'));
  ok('Bỏ chú thích /* */, kể cả lồng nhau', bang('select /* a /* b */ c */ 1', 'select 1'));
  ok('Thụt lề, xuống dòng, khoảng trắng quanh dấu không tính',
    bang('if  x  =  1  then\n      y := ( a , b );\n  end if;', 'if x=1 then y:=(a,b); end if;'));
  ok('Hai từ dính nhau là KHÁC ("end if" ≠ "endif")', !bang('end if', 'endif'));
  ok('-- trong chuỗi là chữ, không phải chú thích', chuanHoaThan("x := 'a--b'; -- c") === "x:='a--b';" && !bang("x := 'a--b';", "x := 'a';"));
  ok('Khoảng trắng TRONG chuỗi được giữ ("a  b" ≠ "a b")', !bang("raise exception 'a  b';", "raise exception 'a b';"));
  ok('Chữ có dấu trong chuỗi so đúng từng dấu ("Đúng" ≠ "Dừng"), chú thích có dấu thì bỏ',
    !bang("raise exception 'Đúng';", "raise exception 'Dừng';")
    && bang("raise exception 'Đúng';", "raise exception 'Đúng'; -- Ghi chú: số 1.000, 1,5 kg"));
  ok("Nháy đơn kép trong chuỗi ('it''s -- x') không cắt chuỗi", chuanHoaThan("s := 'it''s -- x'; -- c") === "s:='it''s -- x';");
  ok("Chuỗi E'…' có \\' bên trong", chuanHoaThan("s := E'a\\'b -- c'; -- d") === "s:=E'a\\'b -- c';");
  ok('Tên trong ngoặc kép giữ nguyên', chuanHoaThan('select "cột  --x" from t') === 'select"cột  --x"from t');
  ok('$1 là tham số, không phải chuỗi $…$', chuanHoaThan('select $1 + $2 -- c') === 'select $1+$2');
  ok('SQL động trong $q$…$q$ cũng bỏ chú thích và khoảng trắng',
    bang('execute $q$ select 1 -- c\n   from t $q$;', 'execute $q$select 1 from t$q$;'));
  ok('Xuống dòng kiểu Windows (\\r\\n) tính như \\n', bang('select\r\n  1', 'select\n1'));
  ok('Đổi một số trong thân là KHÁC', !bang('return 1;', 'return 2;'));
});

// ===========================================================================
await nhom('2 · DATABASE DỰNG TỪ MỌI MIGRATION: 0 KHÁC BIỆT', async () => {
  const dich = await docPglite(dbDich);
  const kq = soSanh(mau, dich);
  ok('Hai database dựng từ cùng migration: 0 khác biệt', tongKhacBiet(kq) === 0, baoCao(kq, chiMuc).filter(d => !d.startsWith('✓')).join(' | '));
  const so = l => mau.get(l).size;
  ok(`Đọc đủ mọi nhóm: ${so('ham')} hàm, ${so('bang')} bảng / view, ${so('cot')} cột, ${so('rang_buoc')} ràng buộc, `
    + `${so('chi_muc')} chỉ mục, ${so('trigger')} trigger, ${so('chinh_sach')} policy, ${so('quyen')} dòng quyền`,
  so('ham') > 300 && so('than_ham') === so('ham') && so('bang') > 100 && so('cot') > 1000 && so('rang_buoc') > 400
    && so('chi_muc') > 50 && so('trigger') > 50 && so('chinh_sach') > 100 && so('view') > 10 && so('kieu') > 5 && so('quyen') > 400);
  ok('Mẫu có hai hàm của sự cố 04/10: bao_dong_bat_dau_luot, kho_may_can_nhat_ky',
    mau.get('ham').has(BAO_DONG) && mau.get('ham').has(MAY_CAN), [...mau.get('ham').keys()].filter(k => /^(bao_dong_bat|kho_may_can_n)/.test(k)).join(', '));
  ok('Báo cáo khi khớp: mọi nhóm đều ✓', baoCao(kq, chiMuc).every(d => d.startsWith('✓')));

  let loi = null;
  try { await docCauTruc(async q => (await dbDich.query(q)).rows); } catch (e) { loi = e.message; }
  ok('Không ở trong giao dịch chỉ đọc thì từ chối đọc (dù chỉ là select)', /giao dịch chỉ đọc/.test(loi ?? ''), loi ?? 'đọc được');
});

// ===========================================================================
await nhom('3 · HÀM BỊ THIẾU — ĐÚNG KIỂU SỰ CỐ 04/10/2026', async () => {
  const a = await sauKhi('drop function bao_dong_bat_dau_luot(text)');
  ok('Xoá bao_dong_bat_dau_luot → báo THIẾU đúng hàm đó, không gì khác',
    ds(a.n, 'ham', 'thieu') === JSON.stringify([BAO_DONG]) && a.tong === 1, `${a.tong} khác biệt: ${a.bao}`);
  ok('Thân hàm và quyền của hàm thiếu không kể thêm lần nữa (chỉ ghi kèm)',
    a.n('than_ham').anThieu === 1 && a.n('quyen').anThieu === 1 && a.n('than_ham').thieu.length === 0);
  ok('Báo cáo chỉ đúng file migration tạo hàm: 0060_bao_dong.sql',
    a.bao.includes(`THIẾU  ${BAO_DONG}   ← tạo ở 0060_bao_dong.sql`), a.bao);

  const b = await sauKhi('drop function bao_dong_bat_dau_luot(text); drop function kho_may_can_nhat_ky(uuid, uuid, jsonb);');
  ok('Xoá cả hai hàm của sự cố → báo đúng hai hàm, mỗi hàm một file',
    ds(b.n, 'ham', 'thieu') === JSON.stringify([BAO_DONG, MAY_CAN]) && b.tong === 2
      && b.bao.includes('0060_bao_dong.sql') && b.bao.includes('0061_kho_can_quay.sql'), b.bao);
});

// ===========================================================================
await nhom('4 · THÂN HÀM VÀ THUỘC TÍNH KHÁC', async () => {
  // Production lưu thân hàm đã bỏ chú thích: dựng lại MỌI hàm sql / plpgsql với thân bỏ dòng chú thích,
  // bỏ chú thích cuối dòng (khi trước nó không có dấu nháy) và bỏ thụt lề — phải vẫn 0 khác biệt.
  const boChuThich = than => than.split('\n')
    .map(l => (l.includes('--') && !l.slice(0, l.indexOf('--')).includes("'") ? l.slice(0, l.indexOf('--')) : l).trim())
    .filter(Boolean).join('\n');
  const { rows: ham } = await dbDich.query(`
    select p.oid, p.prosrc, pg_get_functiondef(p.oid) as dinh_nghia
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace join pg_language l on l.oid = p.prolang
    where n.nspname = 'public' and p.prokind = 'f' and l.lanname in ('sql', 'plpgsql')`);
  const doi = ham.filter(h => boChuThich(h.prosrc) !== h.prosrc);
  const lenh = doi.map(h => {
    const i = h.dinh_nghia.indexOf(h.prosrc);
    return h.dinh_nghia.slice(0, i) + boChuThich(h.prosrc) + h.dinh_nghia.slice(i + h.prosrc.length) + ';';
  });
  const c = await sauKhi(lenh.join('\n'));
  ok(`Dựng lại ${doi.length} hàm với thân đã bỏ chú thích, thụt lề (như production lưu) → 0 khác biệt`,
    doi.length > 100 && c.tong === 0, c.bao.split('\n').filter(d => !d.startsWith('✓')).slice(0, 6).join(' | '));

  const homNay = mau.get('than_ham').get('hom_nay_vn()').goc;
  const d = await sauKhi(`create or replace function public.hom_nay_vn() returns date language sql stable
    as $$ ${homNay.replace("interval '7 hours'", "interval '0 hours'")} $$`);
  ok('hom_nay_vn() trên database bị đổi sang giờ UTC → báo KHÁC đúng thân hàm đó',
    ds(d.n, 'than_ham', 'khac') === JSON.stringify(['hom_nay_vn()']) && d.tong === 1, d.bao);
  ok("Báo cáo chỉ ra chỗ khác: '7 hours' ở migration, '0 hours' ở database, định nghĩa cuối ở 0008",
    /migration: .*'7 hours'/.test(d.bao) && /database: .*'0 hours'/.test(d.bao) && d.bao.includes('định nghĩa cuối ở 0008_siet_an_toan.sql'), d.bao);

  const e = await sauKhi('alter function public.bao_dong_bat_dau_luot(text) security invoker');
  const x = e.n('ham').khac[0];
  ok('Hàm mất security definer → báo KHÁC ở thuộc tính, thân vẫn khớp',
    ds(e.n, 'ham', 'khac') === JSON.stringify([BAO_DONG]) && e.tong === 1
      && x.mau.includes('security definer') && !x.dich.includes('security definer'), e.bao);
  const f = await sauKhi('alter function public.bao_dong_bat_dau_luot(text) reset search_path');
  ok('Hàm mất set search_path → báo KHÁC', ds(f.n, 'ham', 'khac') === JSON.stringify([BAO_DONG]) && f.n('ham').khac[0].mau.includes('set search_path'), f.bao);
});

// ===========================================================================
await nhom('5 · BẢNG, CỘT, RÀNG BUỘC, CHỈ MỤC', async () => {
  const a = await sauKhi('drop table public.bao_dong_trang_thai');
  ok('Bảng bị thiếu → báo THIẾU một bảng; cột, ràng buộc, policy, quyền của nó chỉ ghi kèm',
    ds(a.n, 'bang', 'thieu') === JSON.stringify(['bao_dong_trang_thai']) && a.tong === 1 && a.n('cot').anThieu > 0 && a.n('rang_buoc').anThieu > 0, a.bao);
  ok('Báo cáo chỉ file tạo bảng: 0060_bao_dong.sql', a.bao.includes('THIẾU  bao_dong_trang_thai   ← tạo ở 0060_bao_dong.sql'), a.bao);

  const b = await sauKhi(`alter table public.bao_dong_trang_thai add column them_tay text;
    alter table public.bao_dong_trang_thai alter column kenh drop not null`);
  ok('Cột thêm tay → THỪA; cột mất not null → KHÁC',
    ds(b.n, 'cot', 'thua') === JSON.stringify(['bao_dong_trang_thai.them_tay'])
      && ds(b.n, 'cot', 'khac') === JSON.stringify(['bao_dong_trang_thai.kenh']) && b.tong === 2, b.bao);

  const ck = dauTien('rang_buoc', (k, v) => v.giaTri.startsWith('CHECK'));
  const fk = dauTien('rang_buoc', (k, v) => v.giaTri.startsWith('FOREIGN KEY'));
  const c = await sauKhi(`alter table public."${ck.bang}" drop constraint "${ck.ten}";
    alter table public."${fk.bang}" drop constraint "${fk.ten}"`);
  ok(`Ràng buộc check (${ck.khoa}) và khóa ngoại (${fk.khoa}) bị thiếu → báo đúng hai cái`,
    ds(c.n, 'rang_buoc', 'thieu') === JSON.stringify([ck.khoa, fk.khoa].sort()) && c.tong === 2, c.bao);

  const im = dauTien('chi_muc');
  const d = await sauKhi(`drop index public."${im.khoa}"`);
  ok(`Chỉ mục ${im.khoa} bị thiếu → báo THIẾU`, ds(d.n, 'chi_muc', 'thieu') === JSON.stringify([im.khoa]) && d.tong === 1, d.bao);
});

// ===========================================================================
await nhom('6 · TRIGGER, RLS, POLICY, QUYỀN, KIỂU', async () => {
  const tg = dauTien('trigger');
  const a = await sauKhi(`drop trigger "${tg.ten}" on public."${tg.bang}"`);
  ok(`Trigger ${tg.khoa} bị thiếu → báo THIẾU`, ds(a.n, 'trigger', 'thieu') === JSON.stringify([tg.khoa]) && a.tong === 1, a.bao);
  const b = await sauKhi(`alter table public."${tg.bang}" disable trigger "${tg.ten}"`);
  ok('Trigger bị tắt → báo KHÁC ("ĐANG TẮT")', ds(b.n, 'trigger', 'khac') === JSON.stringify([tg.khoa]) && b.bao.includes('ĐANG TẮT'), b.bao);

  const c = await sauKhi('alter table public.bao_dong_trang_thai disable row level security');
  ok('Bảng bị tắt RLS → báo KHÁC ("RLS TẮT")',
    ds(c.n, 'bang', 'khac') === JSON.stringify(['bao_dong_trang_thai']) && c.bao.includes('RLS TẮT') && c.tong === 1, c.bao);

  const cs = dauTien('chinh_sach');
  const d = await sauKhi(`drop policy "${cs.ten}" on public."${cs.bang}"`);
  ok(`Policy ${cs.khoa} bị thiếu → báo THIẾU`, ds(d.n, 'chinh_sach', 'thieu') === JSON.stringify([cs.khoa]) && d.tong === 1, d.bao);

  // Khối chốt quyền là mảnh cuối của migration — mảnh đó không chạy thì hàm nội bộ lộ cho anon.
  const e = await sauKhi(`grant execute on function public.bao_dong_bat_dau_luot(text) to anon;
    grant select on public.bao_dong_trang_thai to anon`);
  ok('Hàm nội bộ và bảng lộ cho anon (khối chốt quyền chưa chạy) → báo KHÁC ở nhóm quyền',
    ds(e.n, 'quyen', 'khac') === JSON.stringify(['bảng bao_dong_trang_thai', `hàm ${BAO_DONG}`]) && e.tong === 2
      && e.bao.includes('anon gọi được') && e.bao.includes('anon: select'), e.bao);

  const f = await sauKhi(`alter type public.vai_tro add value 'them_tay'`);
  ok('Enum có thêm giá trị → báo KHÁC ở nhóm kiểu', ds(f.n, 'kieu', 'khac') === JSON.stringify(['vai_tro']) && f.tong === 1, f.bao);
});

// ===========================================================================
await nhom('7 · THỪA: TẠO TAY, HAY CÂU DROP CHƯA CHẠY', async () => {
  const a = await sauKhi(`create function public.ham_tao_tay() returns int language sql as $$ select 1 $$`);
  ok('Hàm tạo tay trên database → báo THỪA, "migration không tạo"',
    ds(a.n, 'ham', 'thua') === JSON.stringify(['ham_tao_tay()']) && a.tong === 1 && a.bao.includes('ham_tao_tay()   ← migration không tạo'), a.bao);

  // 0036 drop bản dat_noi_dung 9 tham số. Mảnh chứa câu drop không chạy → bản cũ còn trên production.
  const b = await sauKhi(`create function public.dat_noi_dung(text, text, text, date, bigint, boolean, uuid, text, boolean)
    returns void language sql as $$ select $$`);
  ok('Bản hàm mà migration đã drop vẫn còn → THỪA, chỉ đúng file có câu drop (0036)',
    b.n('ham').thua.length === 1 && b.n('ham').thua[0].startsWith('dat_noi_dung(') && b.tong === 1
      && b.bao.includes('← 0036_tieng_han_va_ban_dich.sql đã drop — câu drop chưa chạy?'), b.bao);
});

// ===========================================================================
await nhom('7b · GỢI Ý FILE: CHỈ CÂU CREATE / DROP THẬT, KHÔNG PHẢI GRANT / ALTER NHẮC TÊN', async () => {
  // tao_dat_ban: tạo lại ở 0004, 0008, 0010, 0013, 0062, 0066 (giới hạn tần suất); các file khác chỉ grant / revoke nó
  // trong khối chốt quyền.
  ok('Hàm tạo nhiều lần → file CUỐI có create (tao_dat_ban → 0066), không phải file chỉ grant nó',
    timTep(chiMuc, 'ham', 'tao_dat_ban(p_chi_nhanh_ma text)') === '0066_gioi_han_cong_khai.sql', timTep(chiMuc, 'ham', 'tao_dat_ban()'));
  ok('Bảng → file create table (chi_nhanh → 0001, khach_hang → 0002), không phải file alter / bật RLS',
    timTep(chiMuc, 'bang', 'chi_nhanh') === '0001_nen_mong.sql' && timTep(chiMuc, 'bang', 'khach_hang') === '0002_khach_hang.sql',
    `${timTep(chiMuc, 'bang', 'chi_nhanh')}, ${timTep(chiMuc, 'bang', 'khach_hang')}`);
  ok('Câu drop: bản dat_noi_dung cũ → 0036; hàm migration không drop → không có gợi ý',
    timTep(chiMuc, 'ham', 'dat_noi_dung()', { xoa: true }) === '0036_tieng_han_va_ban_dich.sql'
      && timTep(chiMuc, 'ham', 'ham_tao_tay()', { xoa: true }) === null);
  for (const loai of ['ham', 'bang', 'chi_muc', 'trigger', 'chinh_sach', 'kieu']) {
    const thieu = [...mau.get(loai).keys()].filter(k => !timTep(chiMuc, loai, k));
    ok(`Mọi đối tượng nhóm ${loai} (${mau.get(loai).size}) đều tìm được file tạo`, thieu.length === 0, thieu.slice(0, 5).join(', '));
  }
});

// ===========================================================================
await nhom('7c · THAM SỐ DÒNG LỆNH: KHÔNG HIỂU THÌ BÁO LỖI, KHÔNG BỎ QUA', async () => {
  const a = docThamSo(['--den', '0061']), b = docThamSo(['--den=0061', '--gioi-han=5']);
  ok('--den 0061 và --den=0061 như nhau; --gioi-han=5 là 5 giây',
    a.den === 61 && b.den === 61 && b.gioiHanMs === 5000 && !a.loi.length && !b.loi.length, JSON.stringify([a, b]));
  ok('Không tham số: so mọi migration, chờ 180 giây', docThamSo([]).den === Infinity && docThamSo([]).gioiHanMs === 180000);
  for (const [thamSo, vi] of [[['--den'], 'thiếu giá trị'], [['--den', '--gioi-han', '5'], 'thiếu giá trị'], [['--den='], 'cần một số'],
    [['--den', 'abc'], 'cần một số'], [['--dem', '61'], 'không hiểu'], [['0061'], 'không hiểu'], [['--gioi-han', '0'], 'cần số giây']]) {
    const r = docThamSo(thamSo);
    ok(`${JSON.stringify(thamSo)} → lỗi "${vi}"`, r.loi.some(l => l.includes(vi)), JSON.stringify(r));
  }
});

// ===========================================================================
await nhom('8 · --den: SO VỚI MỘT MỐC MIGRATION', async () => {
  const { db, daNap } = await dungMau({ den: 60 });
  const mau60 = await docPglite(db);
  ok('--den 60 chỉ nạp đến 0060_bao_dong.sql', daNap.at(-1) === '0060_bao_dong.sql' && !daNap.some(f => f.startsWith('0061')), daNap.at(-1));
  // Database ĐÚNG mốc 0061: chạy thêm đúng file 0061 lên database vừa đọc. Không dùng dbDich (đã chạy
  // mọi migration): migration sau 0061 được phép bỏ hay đổi chữ ký một hàm cũ (0063 đổi tên tham số
  // zalo_xep_tin_dat_ban), và hàm cũ đó sẽ hiện thành THIẾU dù 0061 không đụng tới nó.
  const tep61 = readdirSync(join(THU_MUC, '..', 'supabase', 'migrations')).find(f => f.startsWith('0061_'));
  await db.exec(readFileSync(join(THU_MUC, '..', 'supabase', 'migrations', tep61), 'utf8'));
  const dich61 = await docPglite(db);
  await db.close();
  ok('Chạy thêm đúng 0061_kho_can_quay.sql', tep61 === '0061_kho_can_quay.sql', tep61);
  const kq = soSanh(mau60, dich61);
  const ham = kq.find(x => x.loai === 'ham');
  ok('Database đã chạy 0061 so với mẫu đến 0060 → kho_may_can_nhat_ky là THỪA, không phải THIẾU',
    ham.thua.includes(MAY_CAN) && !ham.thieu.length, JSON.stringify(ham.thua));
});

// ===========================================================================
await nhom('9 · DÒNG LỆNH: KHÔNG ĐỌC XONG THÌ KHÔNG BAO GIỜ BÁO "KHỚP", KHÔNG LỘ MẬT KHẨU', async () => {
  const MAT_KHAU = 'MatKhauRatBiMat@2026';
  const MAT_KHAU_URL = encodeURIComponent(MAT_KHAU);
  function chay(thamSo, url) {
    return new Promise(xong => {
      const env = { ...process.env, NO_COLOR: '1' };
      delete env.DOI_CHIEU_DB_URL;
      if (url !== undefined) env.DOI_CHIEU_DB_URL = url;
      const batDau = Date.now();
      const con = spawn(process.execPath, [join(THU_MUC, 'doi-chieu-production.mjs'), ...thamSo], { env, cwd: join(THU_MUC, '..') });
      let ra = '';
      con.stdout.on('data', d => { ra += d; });
      con.stderr.on('data', d => { ra += d; });
      const hen = setTimeout(() => con.kill('SIGKILL'), 60_000);
      con.on('close', ma => { clearTimeout(hen); xong({ ma, ra: ra.replace(/\x1b\[[0-9;]*m/g, ''), giay: (Date.now() - batDau) / 1000 }); });
    });
  }
  const khongBaoKhop = r => !/KHỚP/.test(r.ra) && /Không đối chiếu được/.test(r.ra) && /KHÔNG có nghĩa là database khớp/.test(r.ra);
  const mayChu = xuLy => new Promise(r => { const s = net.createServer(xuLy); s.listen(0, '127.0.0.1', () => r(s)); });
  const urlToi = cong => `postgresql://postgres.abc:${MAT_KHAU_URL}@127.0.0.1:${cong}/postgres`;

  const a = await chay([]);
  ok('Thiếu DOI_CHIEU_DB_URL → mã 2, nói rõ thiếu biến, không báo khớp',
    a.ma === 2 && khongBaoKhop(a) && a.ra.includes('thiếu biến môi trường DOI_CHIEU_DB_URL'), a.ra);

  const b = await chay([], `khong-phai-url-${MAT_KHAU}`);
  ok('Chuỗi kết nối sai dạng → mã 2, chỉ cách viết ký tự đặc biệt, không in lại chuỗi',
    b.ma === 2 && khongBaoKhop(b) && b.ra.includes('%40') && !b.ra.includes(MAT_KHAU), b.ra);

  const c = await chay(['--den', 'abc'], urlToi(5432));
  ok('--den sai → mã 2', c.ma === 2 && khongBaoKhop(c), c.ra);

  // Cổng không ai nghe: mở rồi đóng ngay để lấy một cổng trống.
  const tam = await mayChu(() => {});
  const congTrong = tam.address().port;
  await new Promise(r => tam.close(r));
  const d = await chay([], urlToi(congTrong));
  ok('Không nối được database (fetch ném lỗi) → mã 2, không báo khớp, không lộ mật khẩu',
    d.ma === 2 && khongBaoKhop(d) && !d.ra.includes(MAT_KHAU) && !d.ra.includes(MAT_KHAU_URL), d.ra);
  ok('Không nối được thì dừng ngay — không mất thời gian dựng mẫu', d.giay < 15 && !d.ra.includes('Mẫu:'), `${d.giay} giây`);

  const imLang = await mayChu(() => { /* nhận kết nối rồi không bao giờ trả lời */ });
  const e = await chay(['--gioi-han', '2'], urlToi(imLang.address().port));
  imLang.close();
  ok('Database nhận kết nối rồi im lặng (hết giờ) → mã 2 sau giới hạn giờ, không treo',
    e.ma === 2 && khongBaoKhop(e) && e.giay < 20 && !e.ra.includes(MAT_KHAU), `${e.giay} giây — ${e.ra}`);

  const catNgang = await mayChu(s => s.destroy());
  const f = await chay([], urlToi(catNgang.address().port));
  catNgang.close();
  ok('Database cắt kết nối giữa chừng → mã 2, không báo khớp',
    f.ma === 2 && khongBaoKhop(f) && !f.ra.includes(MAT_KHAU), f.ra);

  ok('Màn hình chỉ hiện máy chủ và người dùng, không hiện mật khẩu',
    d.ra.includes(`Database: 127.0.0.1:${congTrong}/postgres (người dùng postgres.abc)`), d.ra);
});

// ===========================================================================
await nhom('10 · QUY TRÌNH: CHẠY TAY, KHÔNG COMMIT CHUỖI KẾT NỐI, CÓ HƯỚNG DẪN', async () => {
  const chayTatCa = readFileSync(join(THU_MUC, 'chay-tat-ca.mjs'), 'utf8');
  ok('doi-chieu-production.mjs là công cụ chạy tay — nằm trong THU_VIEN, npm test không chạy nó',
    /const THU_VIEN = new Set\(\[[^\]]*'doi-chieu-production\.mjs'/.test(chayTatCa));
  const pkg = JSON.parse(readFileSync(join(THU_MUC, '..', 'package.json'), 'utf8'));
  ok('npm run doi-chieu chạy đúng file', pkg.scripts?.['doi-chieu'] === 'node test/doi-chieu-production.mjs', pkg.scripts?.['doi-chieu']);
  ok('Thư viện nối Postgres (postgres) khai trong package.json', !!pkg.devDependencies?.postgres);

  const readme = readFileSync(join(GOC, 'README.md'), 'utf8');
  const muc = readme.slice(readme.indexOf('## Chạy migration lên production'));
  ok('README gốc có mục "Chạy migration lên production" bắt chạy npm run doi-chieu sau MỖI lần',
    readme.includes('## Chạy migration lên production') && muc.includes('npm run doi-chieu') && muc.includes('DOI_CHIEU_DB_URL')
      && /sau MỖI lần/.test(muc));
  ok('CLAUDE.md nhắc chạy đối chiếu sau khi chạy migration lên production', readFileSync(join(GOC, 'CLAUDE.md'), 'utf8').includes('npm run doi-chieu'));

  // Chuỗi kết nối có mật khẩu thật không được nằm trong file nào git theo dõi. Chuỗi thật của Supabase luôn mang
  // mã project 20 chữ thường — ở tên người dùng (postgres.<mã>, Session pooler) hoặc ở máy chủ (db.<mã>.supabase.co).
  // Chuỗi giả trong kiểm thử (postgres.abc, aws-0-x) và chỗ điền (<mật khẩu>, [YOUR-PASSWORD]) không khớp.
  const tep = execFileSync('git', ['ls-files'], { cwd: GOC, encoding: 'utf8' }).split('\n').filter(Boolean)
    .filter(f => !/\.(png|jpe?g|svg|ico|webp|avif|woff2?|ttf|exe)$/i.test(f));
  const CHUOI_THAT = /postgres(?:ql)?:\/\/(?:postgres\.[a-z]{20}:[^\s@'"`<>[\]]+@|[^\s:@'"`<>/]+:[^\s@'"`<>[\]]+@db\.[a-z]{20}\.supabase\.co\b)/;
  const MA = 'abcdefghij'.repeat(2);   // mã project giả 20 chữ — ghép lúc chạy để chính file này không chứa chuỗi "thật"
  ok('Mẫu chuỗi kết nối thật nhận ra cả hai dạng, bỏ qua chuỗi giả và chỗ điền',
    CHUOI_THAT.test(`postgresql://postgres.${MA}:p4ss@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`)
      && CHUOI_THAT.test(`postgresql://postgres:p4ss@db.${MA}.supabase.co:5432/postgres`)
      && !CHUOI_THAT.test('postgresql://postgres.abc:MATKHAUDB@aws-0-x.pooler.supabase.com:5432/postgres')
      && !CHUOI_THAT.test(`postgresql://postgres.${MA}:[YOUR-PASSWORD]@aws-0-x.pooler.supabase.com:5432/postgres`));
  const lo = tep.filter(f => { try { return CHUOI_THAT.test(readFileSync(join(GOC, f), 'utf8')); } catch { return false; } });
  ok('Không file nào trong repo chứa chuỗi kết nối Supabase có mật khẩu', lo.length === 0, lo.join(', '));
});

await dbMau.close();
await dbDich.close();
process.exit(ketThuc('ĐỐI CHIẾU DATABASE'));
