/**
 * BEEFTOWN — CÀI ĐẶT BÁN LẺ: CỠ GÓI THỊT BÒ DÙNG CHUNG (0102)
 * ===========================================================
 *
 *     node test/test-ban-le-cai-dat.mjs
 *
 * Bảng ban_le_co_goi (cỡ gói online dùng chung cho thịt bò — migration gieo 200 g và 400 g đang dùng), ba hàm mới
 * ban_le_co_goi_phien_ban (nội bộ), ban_le_cai_dat (đọc), ban_le_luu_co_goi (lưu) và tham số mới p_so_gam của
 * ban_le_tao_san_pham. Bất biến:
 *
 *   1. quyen: anon không đọc bảng, không gọi hàm nào. Vai kho, kế toán, nhân viên quầy, tài khoản máy, nhân sự đã
 *      nghỉ, tài khoản không có dòng nhan_su: đọc 0 dòng, ban_le_cai_dat / ban_le_luu_co_goi từ chối bằng 42501 kèm
 *      câu cũ. Thu ngân, marketing đọc được nhưng không lưu. Chủ, quản lý lưu được. Không ai ghi thẳng bảng. Ba hàm
 *      mới có search_path, hai hàm definer; authenticated không gọi thẳng hàm phiên bản. Câu kiểm vai đầu tiên của
 *      ban_le_luu_co_goi = VAI_SUA_BAN_LE. ban_le_tao_san_pham chỉ còn MỘT chữ ký (không overload).
 *   2. bam-hai-lan: lưu cùng danh sách hai lần (lần hai bằng phiên bản cũ) → khong_doi, không ghi; người khác vừa
 *      sửa khác đi → nguoi_khac_sua, không ghi, không raise. Thêm sản phẩm hai lần cùng ma_gui với danh sách cỡ
 *      khác → một sản phẩm, gói theo lần đầu.
 *   3. chu-va-so: số gam là số nguyên hay chuỗi chữ số 50–5000; "1,5", "1.000" dạng chữ, "abc", 49, 5001 bị từ chối
 *      bằng câu cũ; trùng cỡ, danh sách hỏng → câu mới; câu mới có bản tiếng Anh.
 *   4. Luật: gieo 200 / 400; thêm / tắt / bỏ cỡ; ban_le_tao_san_pham không p_so_gam → các cỡ đang dùng, có p_so_gam
 *      → đúng các cỡ đó (bỏ trùng, kể cả cỡ đang tắt), [] → không gói, kim chi bỏ qua; > 20 cỡ, ngoài khoảng → câu
 *      cũ và không sản phẩm nào được tạo; > 20 đang dùng, > 30 dòng → câu mới; đổi cài đặt KHÔNG đụng gói,
 *      updated_at, gia_chot của sản phẩm đã có.
 *   8. ton-kho: cuối file kho_doi_soat_ton() rỗng.
 *
 * Nhóm 5 – 7 (thư viện web, mất mạng, trang): test-ban-le-cai-dat-web.mjs.
 */

import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dungDatabase, taoBoDem, maGui, themMayIpos, UID, UID_MAY_IPOS } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const nap = f => import(pathToFileURL(join(GOC, 'web', 'src', 'lib', f)).href);

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — CÀI ĐẶT BÁN LẺ: CỠ GÓI THỊT BÒ (0102)');

const BL = await nap('ban-le-noi-bo.ts');
const { dichCau } = await nap('cau-noi-bo.ts');
const { db, cnA, cnB, nsId, duoi, duoiAnon } = await dungDatabase();
await themMayIpos(db, cnA, cnB);

// Cài đặt ngay sau khi nạp migration — trước mọi lần lưu của file này (nhóm 4 kiểm phần gieo).
const GIEO = await db.query(`select so_gam, dang_dung, nguoi_sua from ban_le_co_goi order by so_gam`)
  .then(r => r.rows, e => ({ loi: e.message }));

// Người khung dùng chung chưa có (như test-ban-le.mjs): quản lý và marketing ĐÃ NGHỈ, tài khoản không có nhan_su.
const UID_LA = '00000000-0000-4000-8000-0000000000aa';
const UID_QL_NGHI = '00000000-0000-4000-8000-0000000000ad';
const UID_MKT_NGHI = '00000000-0000-4000-8000-0000000000ae';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam) values
                ($1, $3, 'Quản lý đã nghỉ', 'quan_ly', false), ($2, $3, 'Marketing đã nghỉ', 'marketing', false)`,
               [UID_QL_NGHI, UID_MKT_NGHI, cnA.id]);
// Mọi vai máy có trong enum: may_ipos đã có (themMayIpos), các vai may_% khác thêm một tài khoản mỗi vai.
const MAY = [['may_ipos', UID_MAY_IPOS.mayIposA]];
{
  const { rows } = await db.query(`select v::text as vai from unnest(enum_range(null::vai_tro)) v
                                   where v::text like 'may\\_%' and v::text <> 'may_ipos' order by 1`);
  rows.forEach((r, i) => MAY.push([r.vai, `00000000-0000-4000-8000-0000000000${(0xe0 + i).toString(16)}`]));
  for (const [vai, uid] of MAY.slice(1)) {
    await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam) values ($1, $2, $3, $4::vai_tro, true)`,
                   [uid, cnA.id, `Máy ${vai}`, vai]);
  }
}

const CAU = {
  xem: 'Tài khoản này không xem được menu bán lẻ.',
  sua: 'Chỉ chủ và quản lý được sửa menu bán lẻ.',
  trongLuong: 'Trọng lượng gói phải từ 50 đến 5.000 g.',
  quaGoi: 'Một sản phẩm có tối đa 20 gói.',
  // Bốn câu mới của 0102
  dsHong: 'Danh sách cỡ gói không hợp lệ — tải lại trang.',
  trung: n => `Cỡ gói ${n} g nhập hai lần.`,
  quaDong: 'Danh sách có tối đa 30 cỡ gói.',
  quaDangDung: 'Tối đa 20 cỡ gói đang dùng — một sản phẩm có tối đa 20 gói.',
};
const CAU_EN = {
  dsHong: 'Invalid pack size list — reload the page.',
  trung: n => `Pack size ${n} g is entered twice.`,
  quaDong: 'The list can have at most 30 pack sizes.',
  quaDangDung: 'At most 20 pack sizes can be in use — a product can have at most 20 packs.',
};

const vi = r => (r.loi ? `${r.ma}: ${r.loi}` : JSON.stringify(r.kq ?? r.rows));
/** Bị từ chối đúng kiểu: 42501 và đúng câu. */
const tuChoi = (r, cau) => r.loi === cau && r.ma === '42501';
const giongNhau = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sapXep = a => JSON.stringify([...a].sort());
const md5 = s => createHash('md5').update(s).digest('hex');
// now() của PGlite chỉ tới mili giây (test-ban-le.mjs): lần ghi dựa vào updated_at đổi thì chờ vài mili giây trước.
const nghi = () => new Promise(xong => setTimeout(xong, 3));

const goi = async (uid, sql, p = []) => {
  const r = await (uid === 'anon' ? duoiAnon(sql, p) : duoi(uid, sql, p));
  return { ...r, kq: r.rows?.[0]?.r };
};
/** Một cỡ gói như hàm nhận và trả. */
const co = (soGam, dangDung = true) => ({ so_gam: soGam, dang_dung: dangDung });
const caiDat = uid => goi(uid, `select ban_le_cai_dat() as r`);
const phienBan = async () => (await caiDat(UID.chu)).kq?.phien_ban;
/** Lưu danh sách cỡ. coGoi: mảng JS (gửi dạng JSON), chuỗi = JSON thô (thử dữ liệu hỏng), null = SQL null. */
const luuCo = (uid, pb, coGoi) => goi(uid, `select ban_le_luu_co_goi($1, $2::jsonb) as r`,
  [pb, coGoi === null || typeof coGoi === 'string' ? coGoi : JSON.stringify(coGoi)]);
/** Mảng JS → chữ mảng Postgres ('{500,300}', null → NULL). */
const mangPg = a => `{${a.map(x => (x === null ? 'NULL' : x)).join(',')}}`;
/**
 * Thêm sản phẩm. soGam vắng → gọi 5 tham số (như web chưa gửi cỡ); có (kể cả null) → gọi tên tham số, p_so_gam
 * kiểu int[].
 */
const tao = (uid, ma, ten, { loai = 'thit', cach = 'theo_can', soGam, gui = maGui() } = {}) => (soGam === undefined
  ? goi(uid, `select ban_le_tao_san_pham($1, $2, $3, $4, $5) as r`, [gui, ma, ten, loai, cach])
  : goi(uid, `select ban_le_tao_san_pham(p_ma_gui => $1, p_ma => $2, p_ten_vi => $3, p_loai => $4, p_cach_ban => $5,
                                         p_so_gam => $6::int[]) as r`,
        [gui, ma, ten, loai, cach, soGam === null ? null : mangPg(soGam)]));
const dong = async (sql, p = []) => (await db.query(sql, p)).rows;
/** Bảng cỡ gói đủ cột (superuser) — so trước / sau để biết có ghi gì không. */
const bangCo = () => dong(`select so_gam, dang_dung, nguoi_sua, updated_at::text as updated_at from ban_le_co_goi order by so_gam`);
const coCua = rows => rows.map(r => co(r.so_gam, r.dang_dung));
const goiCuaMa = async ma => (await dong(`select g.so_gam from ban_le_goi g join ban_le_san_pham s on s.id = g.san_pham_id
                                          where s.ma = $1 order by g.so_gam`, [ma])).map(r => r.so_gam);
const coSanPham = async ma => (await dong(`select 1 from ban_le_san_pham where ma = $1`, [ma])).length > 0;
/** Ảnh chụp một sản phẩm đã có: phiên bản, giá chốt, từng gói với updated_at. */
const anhSanPham = async id => (await dong(`
  select s.updated_at::text as updated_at, s.gia_chot, s.gia_chot_luc::text as gia_chot_luc,
         (select jsonb_agg(jsonb_build_object('id', g.id, 'so_gam', g.so_gam, 'dang_ban', g.dang_ban, 'gia_rieng', g.gia_rieng,
                                              'updated_at', g.updated_at::text) order by g.so_gam)
          from ban_le_goi g where g.san_pham_id = s.id) as goi
  from ban_le_san_pham s where s.id = $1`, [id]))[0];
const prosrc = async ten => (await dong(`select prosrc from pg_proc where proname = $1`, [ten]))[0]?.prosrc ?? '';
/** Mảng vai của lời gọi co_vai_tro(array[…]) ĐẦU TIÊN trong thân hàm (như test-noi-bo-ban-le.mjs). */
const vaiDau = src => [...(src.match(/co_vai_tro\(array\[([^\]]*)\]/)?.[1] ?? '').matchAll(/'([a-z_]+)'/g)].map(m => m[1]);

// ===========================================================================
await nhom('1 · QUYỀN — ai đọc, ai sửa cỡ gói, hàm nào gọi được', async () => {
  const pb0 = await phienBan();
  const goc = await bangCo();

  // anon
  const a = await duoiAnon(`select count(*)::int n from ban_le_co_goi`);
  ok('anon không đọc được ban_le_co_goi (42501)', a.loi !== null && a.ma === '42501', vi(a));
  for (const [ten, sql, p] of [
    ['ban_le_cai_dat', `select ban_le_cai_dat() as r`, []],
    ['ban_le_luu_co_goi', `select ban_le_luu_co_goi($1, $2::jsonb) as r`, [pb0, JSON.stringify([co(200), co(400), co(700)])]],
    ['ban_le_co_goi_phien_ban', `select ban_le_co_goi_phien_ban() as r`, []],
    ['ban_le_tao_san_pham có p_so_gam', `select ban_le_tao_san_pham($1, 'anon-tao', 'Anon', 'thit', 'theo_can', '{300}'::int[]) as r`, [maGui()]],
  ]) {
    const r = await goi('anon', sql, p);
    ok(`anon không gọi được ${ten} (42501)`, r.loi !== null && r.ma === '42501', vi(r));
  }

  // Bị từ chối, đọc 0 dòng
  const BI_CHAN = [
    ['Quản lý ĐÃ NGHỈ', UID_QL_NGHI], ['Marketing ĐÃ NGHỈ', UID_MKT_NGHI], ['Tài khoản không có dòng nhan_su', UID_LA],
    ['Đăng nhập nhưng không phiên (auth.uid() null)', null],
    ['Thủ kho Q1', UID.thuKhoA], ['NV quầy Q1', UID.nvQuayA], ['Kế toán Q1', UID.keToanA], ['Thủ kho đã nghỉ', UID.nghiViec],
    ...MAY.map(([vai, uid]) => [`Tài khoản máy ${vai}`, uid]),
  ];
  for (const [ai, uid] of BI_CHAN) {
    const n = await duoi(uid, `select count(*)::int n from ban_le_co_goi`);
    ok(`${ai} → đọc 0 dòng cỡ gói`, n.loi === null && n.rows[0].n === 0, vi(n));
    const doc = await caiDat(uid);
    const luu = await luuCo(uid, pb0, [co(200), co(400), co(700)]);
    const them = await tao(uid, 'bi-chan-tao', 'Bị chặn', { soGam: [300] });
    ok(`${ai} → ban_le_cai_dat, ban_le_luu_co_goi, ban_le_tao_san_pham (có p_so_gam) từ chối bằng 42501 kèm đúng câu`,
       tuChoi(doc, CAU.xem) && tuChoi(luu, CAU.sua) && tuChoi(them, CAU.sua), `${vi(doc)} · ${vi(luu)} · ${vi(them)}`);
  }

  // Thu ngân, marketing: xem được, không lưu
  for (const [ai, uid] of [['Thu ngân Q1', UID.thuNganA], ['Marketing Q1', UID.mktA]]) {
    const n = await duoi(uid, `select count(*)::int n from ban_le_co_goi`);
    ok(`${ai} đọc được bảng cỡ gói qua RLS (đủ ${goc.length} dòng)`, n.loi === null && n.rows[0].n === goc.length && goc.length > 0, vi(n));
    const doc = await caiDat(uid);
    ok(`${ai} gọi được ban_le_cai_dat — đúng danh sách`, doc.loi === null && giongNhau(doc.kq?.co_goi, coCua(goc)), vi(doc));
    const luu = await luuCo(uid, pb0, [co(200), co(400), co(700)]);
    ok(`${ai} → ban_le_luu_co_goi từ chối bằng 42501, câu "${CAU.sua}"`, tuChoi(luu, CAU.sua), vi(luu));
    const them = await tao(uid, 'thu-ngan-tao', 'Không được tạo', { soGam: [300] });
    ok(`${ai} → ban_le_tao_san_pham (có p_so_gam) từ chối bằng 42501`, tuChoi(them, CAU.sua), vi(them));
  }
  ok('Không lần gọi bị từ chối nào ghi được cỡ gói hay tạo được sản phẩm',
     giongNhau(await bangCo(), goc) && !(await coSanPham('bi-chan-tao')) && !(await coSanPham('thu-ngan-tao'))
     && !(await coSanPham('anon-tao')));

  // Không ai ghi thẳng bảng — kể cả chủ, quản lý (chỉ qua ban_le_luu_co_goi)
  for (const [ai, uid] of [['Chủ', UID.chu], ['Quản lý Q1', UID.qlA], ['Thu ngân Q1', UID.thuNganA], ['Marketing Q1', UID.mktA]]) {
    const sai = [];
    for (const sql of [`insert into ban_le_co_goi (so_gam) values (900)`, `update ban_le_co_goi set dang_dung = false`,
                       `delete from ban_le_co_goi`, `truncate ban_le_co_goi`]) {
      const r = await duoi(uid, sql);
      if (r.ma !== '42501') sai.push(`${sql.split(' ')[0]}: ${vi(r)}`);
    }
    ok(`${ai} → thêm / sửa / xóa / truncate thẳng ban_le_co_goi: 42501`, sai.length === 0, sai.join(' · '));
  }
  ok('…bảng cỡ gói vẫn nguyên', giongNhau(await bangCo(), goc));

  // Chủ, quản lý lưu được; người sửa là người gọi
  const c = await luuCo(UID.chu, pb0, [co(200), co(400), co(250)]);
  ok('Chủ lưu được (thêm 250 g)', c.loi === null && c.kq?.ok === true && c.kq?.khong_doi === false, vi(c));
  const dong250 = (await bangCo()).find(r => r.so_gam === 250);
  ok('…dòng 250 g ghi người sửa là chủ', dong250?.nguoi_sua === nsId[UID.chu], JSON.stringify(dong250));
  const q = await luuCo(UID.qlA, c.kq?.phien_ban, [co(200), co(400)]);
  ok('Quản lý lưu được (bỏ 250 g) — bảng trở lại như trước', q.loi === null && q.kq?.ok === true && q.kq?.khong_doi === false
     && giongNhau(await bangCo(), goc), vi(q));

  // Hàm: definer, search_path, quyền gọi
  const { rows: ham } = await db.query(`
    select p.proname, p.prosecdef,
           exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%') as co_path,
           has_function_privilege('anon', p.oid, 'execute') as anon,
           has_function_privilege('authenticated', p.oid, 'execute') as dang_nhap,
           case when p.proacl is null then true
                else exists (select 1 from aclexplode(p.proacl) x where x.grantee = 0 and x.privilege_type = 'EXECUTE') end as public,
           p.pronargdefaults, pg_get_function_arguments(p.oid) as tham_so
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('ban_le_co_goi_phien_ban', 'ban_le_cai_dat', 'ban_le_luu_co_goi', 'ban_le_tao_san_pham')`);
  const h = ten => ham.filter(x => x.proname === ten);
  ok('Ba hàm mới có trong database, mỗi hàm một chữ ký',
     ['ban_le_co_goi_phien_ban', 'ban_le_cai_dat', 'ban_le_luu_co_goi'].every(t => h(t).length === 1), ham.map(x => x.proname).join(', '));
  ok('Ba hàm mới đều có set search_path',
     ['ban_le_co_goi_phien_ban', 'ban_le_cai_dat', 'ban_le_luu_co_goi'].every(t => h(t)[0]?.co_path === true));
  ok('ban_le_cai_dat, ban_le_luu_co_goi là security definer; ban_le_co_goi_phien_ban thì không',
     h('ban_le_cai_dat')[0]?.prosecdef === true && h('ban_le_luu_co_goi')[0]?.prosecdef === true
     && h('ban_le_co_goi_phien_ban')[0]?.prosecdef === false);
  ok('Không hàm nào trong bốn hàm (ba mới + ban_le_tao_san_pham) cho anon hay PUBLIC gọi',
     ham.length === 4 && ham.every(x => x.anon === false && x.public === false),
     JSON.stringify(ham.map(x => [x.proname, x.anon, x.public])));
  ok('authenticated gọi được ban_le_cai_dat, ban_le_luu_co_goi, ban_le_tao_san_pham; KHÔNG gọi được ban_le_co_goi_phien_ban',
     h('ban_le_cai_dat')[0]?.dang_nhap === true && h('ban_le_luu_co_goi')[0]?.dang_nhap === true
     && h('ban_le_tao_san_pham')[0]?.dang_nhap === true && h('ban_le_co_goi_phien_ban')[0]?.dang_nhap === false);
  const pbThang = await goi(UID.chu, `select ban_le_co_goi_phien_ban() as r`);
  ok('Chủ (authenticated) gọi thẳng ban_le_co_goi_phien_ban: 42501', pbThang.ma === '42501', vi(pbThang));
  const t = h('ban_le_tao_san_pham');
  ok('ban_le_tao_san_pham chỉ còn MỘT chữ ký (drop bản 5 tham số, không overload)', t.length === 1, t.map(x => x.tham_so).join(' | '));
  ok('…tham số cuối p_so_gam int[] có mặc định null (gọi 5 tham số vẫn chạy)',
     t[0]?.pronargdefaults === 1 && t[0]?.tham_so === 'p_ma_gui uuid, p_ma text, p_ten_vi text, p_loai text, p_cach_ban text, p_so_gam integer[] DEFAULT NULL::integer[]',
     t[0]?.tham_so);

  // Vai trong thân hàm = vai của thư viện web
  const luu = await prosrc('ban_le_luu_co_goi');
  ok("Câu kiểm vai ĐẦU TIÊN của ban_le_luu_co_goi là co_vai_tro(array['chu_so_huu','quan_ly']) = VAI_SUA_BAN_LE",
     sapXep(vaiDau(luu)) === sapXep(['chu_so_huu', 'quan_ly']) && sapXep(vaiDau(luu)) === sapXep(BL.VAI_SUA_BAN_LE), vaiDau(luu).join(', '));
  ok('…và là câu đầu thân hàm, kèm câu cũ "Chỉ chủ và quản lý được sửa menu bán lẻ."',
     /^\s*(declare[\s\S]*?)?begin\s+if not co_vai_tro\(array\[[^\]]*\]::vai_tro\[\]\) then\s+raise exception 'Chỉ chủ và quản lý được sửa menu bán lẻ\.' using errcode = 'insufficient_privilege';/.test(luu));
  const doc = await prosrc('ban_le_cai_dat');
  ok('Câu kiểm vai đầu tiên của ban_le_cai_dat = VAI_XEM_BAN_LE, kèm câu cũ "Tài khoản này không xem được menu bán lẻ."',
     sapXep(vaiDau(doc)) === sapXep(BL.VAI_XEM_BAN_LE)
     && /^\s*(declare[\s\S]*?)?begin\s+if not co_vai_tro\(array\[[^\]]*\]::vai_tro\[\]\) then\s+raise exception 'Tài khoản này không xem được menu bán lẻ\.'/.test(doc),
     vaiDau(doc).join(', '));
  const taoSrc = await prosrc('ban_le_tao_san_pham');
  ok('Câu kiểm vai đầu tiên của ban_le_tao_san_pham (bản mới) vẫn = VAI_SUA_BAN_LE',
     sapXep(vaiDau(taoSrc)) === sapXep(BL.VAI_SUA_BAN_LE), vaiDau(taoSrc).join(', '));

  // Bảng: RLS, một policy SELECT cho bốn vai xem, không khóa ngoại sang kho_*
  const { rows: pl } = await db.query(`select polname, polcmd, pg_get_expr(polqual, polrelid) as bt from pg_policy
                                       where polrelid = 'ban_le_co_goi'::regclass`);
  const vaiPl = [...new Set([...(pl[0]?.bt ?? '').matchAll(/'([a-z_]+)'/g)].map(m => m[1]))];
  ok('ban_le_co_goi có đúng một policy: ban_le_co_goi_doc, SELECT, vai = VAI_XEM_BAN_LE (không policy thêm / sửa / xóa)',
     pl.length === 1 && pl[0].polname === 'ban_le_co_goi_doc' && pl[0].polcmd === 'r' && sapXep(vaiPl) === sapXep(BL.VAI_XEM_BAN_LE),
     JSON.stringify(pl));
  const { rows: [rls] } = await db.query(`select relrowsecurity from pg_class where oid = 'ban_le_co_goi'::regclass`);
  ok('ban_le_co_goi bật RLS', rls?.relrowsecurity === true);
  const { rows: fk } = await db.query(`select confrelid::regclass::text as bang from pg_constraint
                                       where conrelid = 'ban_le_co_goi'::regclass and contype = 'f'`);
  ok('Khóa ngoại duy nhất: nguoi_sua → nhan_su (không sang bảng kho_* — script dọn kho truncate không cascade)',
     fk.length === 1 && fk[0].bang === 'nhan_su', JSON.stringify(fk));
});

// ===========================================================================
await nhom('2 · GỬI HAI LẦN — bấm đúp, F5, người khác vừa sửa, thêm sản phẩm hai lần', async () => {
  const v0 = (await caiDat(UID.chu)).kq;
  const ds = [co(200), co(400), co(300)];
  const a = await luuCo(UID.chu, v0.phien_ban, ds);
  ok('Lần bấm đầu: ok, khong_doi false, phiên bản mới, danh sách đọc lại sau khi ghi (theo gam tăng dần)',
     a.loi === null && a.kq?.ok === true && a.kq?.khong_doi === false && a.kq?.phien_ban !== v0.phien_ban
     && giongNhau(a.kq?.co_goi, [co(200), co(300), co(400)]), vi(a));
  const sauLan1 = await bangCo();
  await nghi();
  const b = await luuCo(UID.chu, v0.phien_ban, ds);
  ok('Bấm lần hai bằng phiên bản CŨ, cùng danh sách → ok, khong_doi true (không phải nguoi_khac_sua), cùng phiên bản',
     b.loi === null && b.kq?.ok === true && b.kq?.khong_doi === true && b.kq?.phien_ban === a.kq?.phien_ban
     && giongNhau(b.kq?.co_goi, a.kq?.co_goi), vi(b));
  ok('…không ghi gì: mọi dòng giữ nguyên dang_dung, nguoi_sua, updated_at — một trạng thái duy nhất', giongNhau(await bangCo(), sauLan1));
  await nghi();
  const c = await luuCo(UID.qlA, a.kq?.phien_ban, [co(400), co(300), co(200)]);
  ok('Gửi lại cùng danh sách, khác thứ tự (F5) → khong_doi, không ghi', c.kq?.ok === true && c.kq?.khong_doi === true
     && giongNhau(await bangCo(), sauLan1), vi(c));

  // Người khác vừa sửa khác đi
  const v1 = a.kq?.phien_ban;                                       // quản lý mở trang lúc này
  const d = await luuCo(UID.chu, v1, [co(200), co(400)]);           // chủ bỏ 300
  ok('Chủ bỏ 300 g → ok', d.kq?.ok === true && d.kq?.khong_doi === false, vi(d));
  const sauChu = await bangCo();
  await nghi();
  const e = await luuCo(UID.qlA, v1, [co(200), co(400), co(300), co(500)]);
  ok('Quản lý lưu bằng phiên bản cũ một danh sách khác → ok false, ly_do nguoi_khac_sua, kèm phiên bản và danh sách mới (không raise)',
     e.loi === null && e.kq?.ok === false && e.kq?.ly_do === 'nguoi_khac_sua' && e.kq?.phien_ban === d.kq?.phien_ban
     && giongNhau(e.kq?.co_goi, [co(200), co(400)]), vi(e));
  ok('…không ghi gì: không có 500 g, 300 g không quay lại', giongNhau(await bangCo(), sauChu));
  const f = await luuCo(UID.qlA, v1, [co(400), co(200)]);
  ok('Phiên bản cũ nhưng danh sách gửi lên TRÙNG danh sách hiện tại → khong_doi (đã đúng điều người dùng muốn)',
     f.kq?.ok === true && f.kq?.khong_doi === true && giongNhau(await bangCo(), sauChu), vi(f));
  const g = await luuCo(UID.qlA, null, [co(200), co(400), co(500)]);
  ok('Không gửi phiên bản (null) mà danh sách khác → nguoi_khac_sua, không ghi',
     g.kq?.ok === false && g.kq?.ly_do === 'nguoi_khac_sua' && giongNhau(await bangCo(), sauChu), vi(g));

  // Thêm sản phẩm hai lần cùng ma_gui với danh sách cỡ khác
  const gui = maGui();
  const t1 = await tao(UID.qlA, 'hai-lan-co-goi', 'Hai lần cỡ gói', { soGam: [300, 500], gui });
  const t2 = await tao(UID.qlA, 'hai-lan-co-goi', 'Hai lần cỡ gói', { soGam: [1000], gui });
  const t3 = await tao(UID.qlA, 'hai-lan-co-goi', 'Hai lần cỡ gói', { gui });
  const t4 = await tao(UID.qlA, 'hai-lan-co-goi', 'Hai lần cỡ gói', { soGam: [10, 9000], gui });
  ok('Lần bấm đầu tạo sản phẩm mới', t1.loi === null && t1.kq?.da_co === false && !!t1.kq?.id, vi(t1));
  ok('Bấm lại cùng ma_gui với danh sách cỡ khác / không cỡ / cỡ sai → vẫn da_co, cùng id, không lỗi',
     [t2, t3, t4].every(r => r.loi === null && r.kq?.da_co === true && r.kq?.id === t1.kq?.id), [t2, t3, t4].map(vi).join(' · '));
  ok('…đúng một sản phẩm, gói theo LẦN ĐẦU: 300 g, 500 g',
     (await dong(`select 1 from ban_le_san_pham where ma = 'hai-lan-co-goi'`)).length === 1
     && giongNhau(await goiCuaMa('hai-lan-co-goi'), [300, 500]), JSON.stringify(await goiCuaMa('hai-lan-co-goi')));
});

// ===========================================================================
await nhom('3 · CHỮ VÀ SỐ — số gam dạng số hay chuỗi chữ số, ngoài khoảng, trùng, danh sách hỏng; câu vi / en', async () => {
  const goc = await bangCo();
  const pb = await phienBan();
  const CO_SAN = [co(200), co(400)];
  ok('Tiền đề: cài đặt đang là 200 g, 400 g đang dùng', giongNhau(coCua(goc), CO_SAN), JSON.stringify(goc));

  // Số gam sai → câu cũ. Mỗi lần gửi kèm một cỡ mới hợp lệ (300 g): mọi kiểm tra trước lần ghi đầu tiên.
  for (const [ten, x] of [['"1,5" (một phẩy năm)', '1,5'], ['"1.000" dạng chữ (web đổi thành 1000 trước khi gửi)', '1.000'],
                          ['"abc"', 'abc'], ['1.5 (số lẻ)', 1.5], ['49', 49], ['"49"', '49'], ['5001', 5001], ['-200', -200],
                          ['0', 0], ['chuỗi rỗng', ''], ['null', null], ['true', true], ['[300]', [300]]]) {
    const r = await luuCo(UID.chu, pb, [...CO_SAN, co(300), { so_gam: x, dang_dung: true }]);
    ok(`Cỡ ${ten} → "${CAU.trongLuong}"`, r.loi === CAU.trongLuong, vi(r));
  }
  // dang_dung không phải boolean JSON
  for (const [ten, x] of [['"true" dạng chữ', 'true'], ['1', 1], ['null', null], ['"Có"', 'Có']]) {
    const r = await luuCo(UID.chu, pb, [...CO_SAN, co(300), { so_gam: 600, dang_dung: x }]);
    ok(`dang_dung ${ten} → "${CAU.dsHong}"`, r.loi === CAU.dsHong, vi(r));
  }
  // Hình dạng danh sách
  for (const [ten, x] of [['SQL null', null], ['object {}', '{}'], ['chuỗi JSON', '"200,400"'], ['số JSON', '200'],
                          ['phần tử là số', '[200, 400]'], ['phần tử null', '[null]'], ['phần tử là mảng', '[[200, true]]'],
                          ['thiếu dang_dung', JSON.stringify([{ so_gam: 200 }])], ['thiếu so_gam', JSON.stringify([{ dang_dung: true }])],
                          ['khóa lạ thu_tu', JSON.stringify([{ so_gam: 200, dang_dung: true, thu_tu: 1 }])],
                          ['khóa lạ id', JSON.stringify([{ id: 'x', so_gam: 200, dang_dung: true }])]]) {
    const r = await luuCo(UID.chu, pb, x);
    ok(`Danh sách hỏng (${ten}) → "${CAU.dsHong}"`, r.loi === CAU.dsHong, vi(r));
  }
  // Trùng cỡ — số và chuỗi chữ số cùng một cỡ
  for (const [ten, ds, n] of [['300 và 300', [...CO_SAN, co(300), co(300)], 300],
                              ['300 và "300" (một đang dùng, một tắt)', [...CO_SAN, co(300), { so_gam: '300', dang_dung: false }], 300],
                              ['1000 và " 1000 "', [...CO_SAN, co(1000), { so_gam: ' 1000 ', dang_dung: true }], 1000],
                              ['200 có sẵn gửi hai lần', [co(200), co(400), co(200, false)], 200]]) {
    const r = await luuCo(UID.chu, pb, ds);
    ok(`Trùng cỡ ${ten} → "${CAU.trung(n)}" (gam không dấu ngăn nghìn)`, r.loi === CAU.trung(n), vi(r));
  }
  ok('Không lần bị từ chối nào ghi gì (không có 300 g, 600 g), phiên bản nguyên',
     giongNhau(await bangCo(), goc) && (await phienBan()) === pb);

  // Số gam đúng: số nguyên, chuỗi chữ số (cắt khoảng trắng), số có phần lẻ bằng 0, hai biên
  const r = await luuCo(UID.chu, pb, `[{"so_gam":200,"dang_dung":true},{"so_gam":400,"dang_dung":true},
    {"so_gam":"1000","dang_dung":true},{"so_gam":" 600 ","dang_dung":false},{"so_gam":300.0,"dang_dung":true},
    {"so_gam":50,"dang_dung":false},{"so_gam":5000,"dang_dung":false}]`);
  ok('"1000" = 1000 g, " 600 " = 600 g, 300.0 = 300 g; biên 50 g và 5000 g nhận',
     r.loi === null && r.kq?.ok === true
     && giongNhau(r.kq?.co_goi, [co(50, false), co(200), co(300), co(400), co(600, false), co(1000), co(5000, false)]), vi(r));
  const kieu = await dong(`select pg_typeof(so_gam)::text as k, jsonb_typeof(to_jsonb(so_gam)) as j from ban_le_co_goi limit 1`);
  ok('…bảng lưu số nguyên (int), ban_le_cai_dat trả số JSON — không chuỗi',
     kieu[0]?.k === 'integer' && (await caiDat(UID.chu)).kq?.co_goi?.every(x => typeof x.so_gam === 'number'), JSON.stringify(kieu));
  const ve = await luuCo(UID.chu, r.kq?.phien_ban, CO_SAN);
  ok('Trả cài đặt về 200 g, 400 g', ve.kq?.ok === true && giongNhau(coCua(await bangCo()), CO_SAN), vi(ve));

  // Câu tiếng Anh của bốn câu mới (web/src/lib/cau-noi-bo.ts) — và câu cũ dùng lại vẫn dịch được
  for (const [k, cauVi, cauEn] of [['dsHong', CAU.dsHong, CAU_EN.dsHong], ['trung', CAU.trung(300), CAU_EN.trung(300)],
                                   ['trung 1000', CAU.trung(1000), CAU_EN.trung(1000)], ['quaDong', CAU.quaDong, CAU_EN.quaDong],
                                   ['quaDangDung', CAU.quaDangDung, CAU_EN.quaDangDung]]) {
    ok(`Câu mới (${k}) có bản tiếng Anh: "${cauEn}"`, dichCau('en', cauVi) === cauEn && dichCau('vi', cauVi) === cauVi, dichCau('en', cauVi));
  }
  ok('Câu cũ dùng lại (trọng lượng, tối đa 20 gói) vẫn có bản tiếng Anh',
     dichCau('en', CAU.trongLuong) === 'A pack weight must be between 50 and 5,000 g.'
     && dichCau('en', CAU.quaGoi) === 'A product can have at most 20 packs.');
});

// ===========================================================================
await nhom('4 · LUẬT — gieo 200 / 400, mặc định khi thêm thịt, chọn cỡ, kim chi, giới hạn, sản phẩm đã có không đổi', async () => {
  ok('Migration gieo đúng hai cỡ: 200 g và 400 g, đang dùng, chưa ai sửa (nguoi_sua trống)',
     giongNhau(GIEO, [{ so_gam: 200, dang_dung: true, nguoi_sua: null }, { so_gam: 400, dang_dung: true, nguoi_sua: null }]),
     JSON.stringify(GIEO));
  const cd = (await caiDat(UID.thuNganA)).kq;
  ok('ban_le_cai_dat trả đúng hai khóa (co_goi, phien_ban); mỗi cỡ đúng hai khóa (dang_dung, so_gam)',
     sapXep(Object.keys(cd ?? {})) === sapXep(['co_goi', 'phien_ban'])
     && cd.co_goi.every(x => sapXep(Object.keys(x)) === sapXep(['dang_dung', 'so_gam'])), JSON.stringify(cd));
  ok('phien_ban = md5 của "so_gam:dang_dung" nối dấu phẩy theo gam tăng dần', cd?.phien_ban === md5('200:true,400:true'), cd?.phien_ban);

  // Sản phẩm có từ trước, đã chốt giá
  const { rows: [mh] } = await db.query(
    `insert into kho_mat_hang (ma, ten, loai, dem_goi, don_vi_goi, gia_ban_kg, ma_can, dang_dung)
     values ('CO-GOI-RIB', 'Ribeye cỡ gói', 'phan_cat', false, 'gói', 950000, '2101', true) returning id`);
  const cu = await tao(UID.qlA, 'co-goi-co-truoc', 'Ribeye có trước');
  ok('Không p_so_gam (gọi 5 tham số như web cũ) → gói theo cài đặt: 200 g, 400 g',
     cu.kq?.da_co === false && giongNhau(await goiCuaMa('co-goi-co-truoc'), [200, 400]), vi(cu));
  const docSp = async id => (await goi(UID.chu, `select ban_le_danh_sach(null, $1) as r`, [id])).kq?.[0];
  await nghi();
  let sp = await docSp(cu.kq?.id);
  const gan = await goi(UID.qlA, `select ban_le_luu_san_pham($1, $2::timestamptz, $3::jsonb) as r`,
                        [cu.kq?.id, sp?.updated_at, JSON.stringify({ mat_hang_id: mh.id })]);
  await nghi();
  sp = await docSp(cu.kq?.id);
  const chot = await goi(UID.chu, `select ban_le_chot_gia($1, $2::timestamptz, $3::jsonb) as r`,
                         [cu.kq?.id, sp?.updated_at, JSON.stringify(sp?.gia_de_chot)]);
  ok('Tiền đề: gắn mặt hàng, chủ chốt giá được', gan.kq?.ok === true && chot.kq?.ok === true, `${vi(gan)} · ${vi(chot)}`);
  const anhTruoc = await anhSanPham(cu.kq?.id);
  await nghi();

  // Thêm 300 + 1000, tắt 400, bỏ 200
  const r = await luuCo(UID.chu, cd.phien_ban, [co(400, false), co(1000), co(300)]);
  ok('Thêm 300 g + 1000 g, tắt 400 g, bỏ 200 g → ok; danh sách 300 (dùng), 400 (tắt), 1000 (dùng)',
     r.kq?.ok === true && r.kq?.khong_doi === false && giongNhau(r.kq?.co_goi, [co(300), co(400, false), co(1000)]), vi(r));
  ok('…phien_ban mới đúng công thức', r.kq?.phien_ban === md5('300:true,400:false,1000:true'), r.kq?.phien_ban);
  const bang = await bangCo();
  ok('…dòng thêm / đổi (300, 400, 1000) ghi người sửa là chủ', bang.every(x => x.nguoi_sua === nsId[UID.chu]), JSON.stringify(bang));
  ok('Đổi cài đặt KHÔNG đụng sản phẩm đã có: gói (200, 400 vẫn đó), updated_at, gia_chot, gia_chot_luc, updated_at từng gói nguyên',
     giongNhau(await anhSanPham(cu.kq?.id), anhTruoc), JSON.stringify(await anhSanPham(cu.kq?.id)));
  const spSau = await docSp(cu.kq?.id);
  ok('…sản phẩm vẫn không giá thử (ảnh chụp giá vẫn khớp), gói 200 g vẫn đang bán', spSau?.gia_thu === false
     && spSau?.goi?.find(x => x.so_gam === 200)?.dang_ban === true, JSON.stringify(spSau?.goi));

  // Thêm sản phẩm sau khi đổi
  for (const [ten, ma, tuy, phai] of [
    ['Không p_so_gam (5 tham số) → các cỡ ĐANG DÙNG, gam tăng dần: 300, 1000', 'mac-dinh-5', {}, [300, 1000]],
    ['p_so_gam => null → như không gửi: 300, 1000', 'mac-dinh-null', { soGam: null }, [300, 1000]],
    ['p_so_gam [500, 300, 300] → 300, 500 (bỏ trùng)', 'chon-500-300', { soGam: [500, 300, 300] }, [300, 500]],
    ['p_so_gam [] → không gói nào', 'chon-rong', { soGam: [] }, []],
    ['p_so_gam [400] — cỡ vừa tắt mà form đã hiện → nhận (người dùng đã chọn rõ)', 'chon-co-tat', { soGam: [400] }, [400]],
    ['p_so_gam [2000] — cỡ không có trong cài đặt → nhận (50–5000 g)', 'chon-2000', { soGam: [2000] }, [2000]],
    ['p_so_gam [50, 5000] — hai biên', 'chon-bien', { soGam: [5000, 50] }, [50, 5000]],
    ['Kim chi theo hộp, không p_so_gam → không gói', 'kim-chi-mac-dinh', { loai: 'kim_chi', cach: 'theo_hop' }, []],
    ['Kim chi theo hộp, p_so_gam [500, 10, null] → bỏ qua, không gói, vẫn tạo', 'kim-chi-bo-qua',
     { loai: 'kim_chi', cach: 'theo_hop', soGam: [500, 10, null] }, []],
    ['Thịt bán theo hộp (luật theo cach_ban), p_so_gam [300] → không gói', 'thit-theo-hop', { cach: 'theo_hop', soGam: [300] }, []],
  ]) {
    const t = await tao(UID.qlA, ma, `Sản phẩm ${ma}`, tuy);
    const g = await goiCuaMa(ma);
    ok(ten, t.loi === null && t.kq?.da_co === false && giongNhau(g, phai), `${vi(t)} · gói ${JSON.stringify(g)}`);
  }
  ok('Kim chi bỏ qua p_so_gam vẫn là kim chi giữ lạnh', (await dong(`select bao_quan from ban_le_san_pham where ma = 'kim-chi-bo-qua'`))[0]?.bao_quan === 'giu_lanh');
  const tuGoi = await dong(`select g.gia_rieng, g.dang_ban, g.thu_tu from ban_le_goi g join ban_le_san_pham s on s.id = g.san_pham_id
                            where s.ma = 'chon-500-300'`);
  ok('Gói tạo theo cỡ: giá tự tính (gia_rieng trống), đang bán, thu_tu 0 — như gói 200 / 400 cũ',
     tuGoi.length === 2 && tuGoi.every(x => x.gia_rieng === null && x.dang_ban === true && x.thu_tu === 0), JSON.stringify(tuGoi));

  // Cỡ sai / quá nhiều → câu cũ, KHÔNG sản phẩm nào được tạo
  const haiMuoiCo = Array.from({ length: 20 }, (_, i) => 100 + i * 100);   // 100 … 2000
  for (const [ten, ma, soGam, cau] of [
    ['21 cỡ khác nhau', 'qua-21-co', [...haiMuoiCo, 2100], CAU.quaGoi],
    ['49 g', 'co-49', [300, 49], CAU.trongLuong],
    ['5001 g', 'co-5001', [5001], CAU.trongLuong],
    ['0 g', 'co-0', [0], CAU.trongLuong],
    ['phần tử null', 'co-null', [300, null], CAU.trongLuong],
  ]) {
    const t = await tao(UID.qlA, ma, `Sản phẩm ${ma}`, { soGam });
    ok(`p_so_gam ${ten} → "${cau}", không sản phẩm nào được tạo`, t.loi === cau && !(await coSanPham(ma)), vi(t));
  }
  const du20 = await tao(UID.qlA, 'du-20-co', 'Đủ 20 cỡ', { soGam: [...haiMuoiCo, 100, 2000] });
  ok('20 cỡ khác nhau kèm cỡ trùng → nhận, đúng 20 gói', du20.kq?.da_co === false && (await goiCuaMa('du-20-co')).length === 20, vi(du20));

  // Giới hạn của cài đặt
  let pb = await phienBan();
  const truocGioiHan = await bangCo();
  const dangDung21 = Array.from({ length: 21 }, (_, i) => co(100 + i * 100));
  const q21 = await luuCo(UID.chu, pb, dangDung21);
  ok(`21 cỡ đang dùng → "${CAU.quaDangDung}"`, q21.loi === CAU.quaDangDung, vi(q21));
  const dong31 = Array.from({ length: 31 }, (_, i) => co(100 + i * 100, i < 20));
  const q31 = await luuCo(UID.chu, pb, dong31);
  ok(`31 dòng (20 đang dùng) → "${CAU.quaDong}"`, q31.loi === CAU.quaDong, vi(q31));
  const dai = await luuCo(UID.chu, pb, Array.from({ length: 5000 }, () => co(300)));
  ok('Mảng 5.000 dòng (toàn cỡ trùng) → đếm dòng trước khi đọc từng dòng: vẫn câu tối đa 30 cỡ', dai.loi === CAU.quaDong, vi(dai));
  ok('…không ghi gì', giongNhau(await bangCo(), truocGioiHan));
  const dong30 = Array.from({ length: 30 }, (_, i) => co(100 + i * 100, i < 20));
  const q30 = await luuCo(UID.chu, pb, dong30);
  ok('30 dòng, 20 đang dùng → nhận', q30.kq?.ok === true && (await bangCo()).length === 30, vi(q30));
  const t20 = await tao(UID.qlA, 'mac-dinh-20', 'Mặc định 20 cỡ');
  ok('…thêm thịt không p_so_gam → đúng 20 gói (các cỡ đang dùng)',
     giongNhau(await goiCuaMa('mac-dinh-20'), haiMuoiCo), `${vi(t20)} · ${JSON.stringify(await goiCuaMa('mac-dinh-20'))}`);

  // Danh sách rỗng: thịt mới chưa có gói
  const rong = await luuCo(UID.qlA, q30.kq?.phien_ban, []);
  ok('Bỏ hết cỡ (danh sách rỗng) → nhận', rong.kq?.ok === true && (await bangCo()).length === 0, vi(rong));
  const cdRong = (await caiDat(UID.mktA)).kq;
  ok('…ban_le_cai_dat trả co_goi là mảng rỗng (không null), phien_ban = md5 của chuỗi rỗng',
     Array.isArray(cdRong?.co_goi) && cdRong.co_goi.length === 0 && cdRong.phien_ban === md5(''), JSON.stringify(cdRong));
  const khongGoi = await tao(UID.qlA, 'mac-dinh-rong', 'Chưa có cỡ nào');
  ok('…thêm thịt không p_so_gam → sản phẩm không gói nào', khongGoi.kq?.da_co === false
     && (await goiCuaMa('mac-dinh-rong')).length === 0, vi(khongGoi));

  ok('Sau mọi lần đổi cài đặt (kể cả bỏ hết): sản phẩm có trước vẫn nguyên gói, updated_at, gia_chot',
     giongNhau(await anhSanPham(cu.kq?.id), anhTruoc));

  // Trả về như gieo — phiên bản tính theo nội dung nên trùng phiên bản lúc gieo
  pb = await phienBan();
  const ve = await luuCo(UID.chu, pb, [co(200), co(400)]);
  ok('Trả cài đặt về 200 g, 400 g đang dùng → phiên bản trùng lúc gieo', ve.kq?.ok === true
     && ve.kq?.phien_ban === md5('200:true,400:true') && giongNhau(coCua(await bangCo()), [co(200), co(400)]), vi(ve));
});

// ===========================================================================
await nhom('8 · SỔ KHO KHỚP', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('kho_doi_soat_ton() rỗng', rows.length === 0, JSON.stringify(rows.slice(0, 3)));
});

process.exit(ketThuc('CÀI ĐẶT BÁN LẺ'));
