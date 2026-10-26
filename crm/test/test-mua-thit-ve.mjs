/**
 * BEEFTOWN — MUA THỊT VỀ: MENU CÔNG KHAI VÀ CÔNG TẮC HIỆU LỰC (0101)
 * =================================================================
 *
 *     node test/test-mua-thit-ve.mjs
 *
 * mua_thit_ve_cong_khai(ngôn ngữ, mã chi nhánh) là hàm anon gọi được (trang /mua-thit-ve, /en/buy-meat,
 * /ko/buy-meat — web/src/lib/mua-thit-ve.ts). noi_dung_cong_khai() trả hien_mua_thit_ve là công tắc HIỆU LỰC.
 * Bất biến, theo 9 mục "xong" của CLAUDE.md:
 *
 *   1. quyen — anon gọi được đúng một hàm mới; hàm trả đúng 11 cột, không id, mã FABi, mã vạch, giá mỗi kg, số
 *      tồn; anon vẫn không đọc bảng, không gọi năm hàm ban_le_* và ba hàm nội bộ mới; mọi vai thấy như anon;
 *      sáu khóa mới chỉ chủ công bố; zalo_oa_url thành khóa chỉ chủ và chỉ nhận https://zalo.me/<mã>; dòng cũ không
 *      hợp lệ vẫn gỡ được.
 *   2. bam-hai-lan — đọc hai lần cùng kết quả, không bảng nào thêm dòng (website không ghi gì).
 *   3. gio-vn — "Tạm hết ở quầy" theo lô còn hạn tính bằng hom_nay_vn(): 23:50 còn, 00:10 hôm sau thì hết.
 *   4. chu-va-so — giá gói đúng ban_le_gia_goi lúc chốt; tên có dấu nguyên vẹn; giá là số nguyên (qua to_jsonb
 *      như PostgREST); ngôn ngữ lạ → tiếng Việt.
 *   5. LUẬT GIÁ (Khánh chốt 26/10/2026): trang hiện giá gói trong ảnh chụp gia_chot; giá kg đổi sau khi chốt thì
 *      trang vẫn giữ giá đã chốt; chưa chốt → ẩn sản phẩm; gói không có trong ảnh chụp → ẩn gói.
 *   6. Tạm hết ở quầy: chỉ khi công tắc riêng bật, chi nhánh trừ kho theo iPOS và quầy thật sự hết.
 *   7. Bản dịch: bản dịch của câu gốc cũ không bao giờ lên trang (tên phần thịt nằm trong tin đơn).
 *   8. Công tắc hiệu lực: hien_mua_thit_ve = true chỉ khi bật, có link Zalo hợp lệ VÀ menu web có gói — khớp
 *      đúng với mua_thit_ve_cong_khai ở mọi ca của nhóm 5; mọi khóa khác giữ nguyên như bản 0036.
 *   9. Mẫu link Zalo của database (la_link_zalo_oa) và của web (laLinkZaloOa, web/src/lib/dich-dat-hang.ts) cho
 *      cùng kết quả — đỏ chờ nhóm D bước 1 cho tới khi file web có.
 *  10. cau-chu — hai hàm công khai không raise; câu raise mới có bản tiếng Anh; mô tả khóa hai thứ tiếng, dặn
 *      không ghi số tiền, không dính chữ cấm.
 *  11. migration — khối CHỐT QUYỀN chép nguyên văn 0099, thêm đúng một dòng grant.
 *  12. ton-kho — kho_doi_soat_ton() rỗng (file tạo lô ở quầy để thử tạm hết).
 *
 * mat-mang và dich-vu-ngoai của trang nằm ở test-mua-thit-ve-web.mjs (lib) và web/kiem-tra/thu-day-du.mjs
 * (trình duyệt): database không gọi dịch vụ ngoài nào.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, datGioDatabase, traGioDatabase, maGui, taoClientPg, UID } from './kho-chung.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOC = join(__dirname, '..', '..');
const MIG = join(GOC, 'crm', 'supabase', 'migrations');
const WEB = join(GOC, 'web', 'src');
const TEP_0101 = join(MIG, '0101_mua_thit_ve.sql');
const docTep = duongDan => (existsSync(duongDan) ? readFileSync(duongDan, 'utf8') : '');

const { dichCau, MO_TA_KHOA_EN } = await import(join(WEB, 'lib', 'cau-noi-bo.ts'));
const { timChuoiCam } = await import(join(WEB, 'lib', 'chuoi-cam.js'));

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — MUA THỊT VỀ: MENU CÔNG KHAI VÀ CÔNG TẮC HIỆU LỰC (0101)');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
const clientCua = await taoClientPg({ db, duoi, duoiAnon });

// Người khung dùng chung chưa có (như test-ban-le.mjs): quản lý ĐÃ NGHỈ và tài khoản không có dòng nhan_su.
const UID_LA = '00000000-0000-4000-8000-0000000000aa';
const UID_QL_NGHI = '00000000-0000-4000-8000-0000000000ad';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam)
                values ($1, $2, 'Quản lý đã nghỉ', 'quan_ly', false)`, [UID_QL_NGHI, cnA.id]);

const viTri = async cn => Object.fromEntries((await db.query(
  `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cn.id])).rows.map(r => [r.loai, r.id]));
const vtA = await viTri(cnA);

// ---------------------------------------------------------------------------
// Hằng của hợp đồng (spec-v2 mục 1.6, 1.10, 3.5)
// ---------------------------------------------------------------------------
const LINK_OA = 'https://zalo.me/3030027075662095415';
const CAU_ZALO = 'Link Zalo OA phải có dạng https://zalo.me/ và mã OA, không thêm gì phía sau.';
const CAU_ZALO_EN = 'The Zalo OA link must be https://zalo.me/ followed by the OA ID, with nothing after it.';
const COT = ['san_pham_ma', 'loai', 'don_vi', 'bao_quan', 'ten', 'ten_vi', 'mo_ta', 'cach_dung', 'so_gam', 'gia', 'tam_het'];
/** [khóa, kiểu, chỉ chủ, thu_tu] — mười khóa nhóm mua_thit. */
const KHOA_MOI = [
  ['hien_mua_thit_ve', 'bool', true, 400],
  ['mua_thit_hien_tam_het', 'bool', true, 410],
  ['mua_thit_gio_nhan', 'van_ban', false, 420],
  ['mua_thit_giao_hang', 'van_ban', true, 430],
  ['mua_thit_thue', 'van_ban', true, 440],
  ['mua_thit_bao_quan_mat', 'van_ban', false, 450],
  ['mua_thit_bao_quan_dong_lanh', 'van_ban', false, 460],
  ['mua_thit_can_lech', 'van_ban', true, 470],
  ['mua_thit_hang_loi', 'van_ban', true, 480],
  ['mua_thit_doi_huy', 'van_ban', false, 490],
];
const KHONG_TIEN_VI = 'Không ghi số tiền — phí giao, đơn tối thiểu quán báo khi xác nhận đơn.';
const KHONG_TIEN_EN = 'Do not write amounts of money — we give delivery fees and minimum orders when we confirm the order.';

// ---------------------------------------------------------------------------
// Gọi hàm, đọc menu
// ---------------------------------------------------------------------------
const vi = r => (r.loi ? `${r.ma}: ${r.loi}` : JSON.stringify(r.kq ?? r.rows));
const ngan = x => { const s = typeof x === 'string' ? x : JSON.stringify(x); return s.length > 400 ? s.slice(0, 400) + '…' : s; };
const goi = async (uid, sql, p = []) => {
  const r = await (uid === 'anon' ? duoiAnon(sql, p) : duoi(uid, sql, p));
  return { ...r, kq: r.rows?.[0]?.r };
};
// now() của PGlite chỉ tới mili giây: hai lần ghi liền nhau có thể cùng updated_at (xem test-ban-le.mjs).
const nghi = () => new Promise(xong => setTimeout(xong, 3));

/** Menu như trang gọi: mặc định anon, tiếng Việt, chi nhánh q1. */
const menu = async ({ nn = 'vi', cn = 'q1', uid = 'anon' } = {}) =>
  goi(uid, `select * from mua_thit_ve_cong_khai($1, $2)`, [nn, cn]);
const dongCua = (r, ma) => (r.rows ?? []).filter(d => d.san_pham_ma === ma);
const goiCuaMenu = (r, ma, gam) => dongCua(r, ma).find(d => d.so_gam === gam);
const giaCua = (r, ma, gam) => { const d = goiCuaMenu(r, ma, gam); return d ? Number(d.gia) : undefined; };
const giaMoiGoi = (r, ma) => Object.fromEntries(dongCua(r, ma).map(d => [d.so_gam, Number(d.gia)]));
/** noi_dung_cong_khai() như trang gọi (anon). */
const noiDung = async (nn = 'vi') => (await duoiAnon(`select noi_dung_cong_khai($1) as j`, [nn])).rows?.[0]?.j;
const hien = async () => (await noiDung())?.hien_mua_thit_ve;

// ---------------------------------------------------------------------------
// Khóa công bố — qua đúng hai RPC của web/src/lib/cong-tac.ts (dat_noi_dung, thu_hoi_noi_dung)
// ---------------------------------------------------------------------------
const congBo = (khoa, giaTri, uid = UID.chu) => goi(uid, typeof giaTri === 'boolean'
  ? `select dat_noi_dung($1, p_bool := $2::boolean, p_cong_bo := true) as r`
  : `select dat_noi_dung($1, p_text := $2, p_cong_bo := true) as r`, [khoa, giaTri]);
const congBoPhai = async (khoa, giaTri) => {
  const r = await congBo(khoa, giaTri);
  if (r.loi) throw new Error(`không công bố được ${khoa}: ${r.loi}`);
};
const thuHoi = (khoa, uid = UID.chu) => goi(uid, `select thu_hoi_noi_dung($1) as r`, [khoa]);
const dangSong = async khoa => (await db.query(
  `select gia_tri_text, gia_tri_bool from noi_dung_cong_bo where khoa = $1 and trang_thai = 'da_cong_bo'`, [khoa])).rows[0] ?? null;

// ---------------------------------------------------------------------------
// Sản phẩm bán lẻ — qua các hàm ban_le_* của trang nội bộ, dưới vai chủ (khuôn test-ban-le.mjs)
// ---------------------------------------------------------------------------
async function matHang(ma, { gia = null, maCan = null, demGoi = false, donVi = 'gói', dangDung = true } = {}) {
  const { rows: [r] } = await db.query(
    `insert into kho_mat_hang (ma, ten, loai, dem_goi, don_vi_goi, gia_ban_kg, ma_can, dang_dung)
     values ($1, $1, 'phan_cat', $2, $3, $4, $5, $6) returning id`, [ma, demGoi, donVi, gia, maCan, dangDung]);
  return r.id;
}
const doc = async id => (await goi(UID.chu, `select ban_le_danh_sach(null, $1) as r`, [id])).kq?.[0];
const goiCua = (sp, gam) => sp?.goi?.find(g => g.so_gam === gam);
async function tao(ma, ten, loai = 'thit', cach = 'theo_can') {
  const r = await goi(UID.chu, `select ban_le_tao_san_pham($1, $2, $3, $4, $5) as r`, [maGui(), ma, ten, loai, cach]);
  if (r.loi || !r.kq?.id) throw new Error(`không tạo được ${ma}: ${vi(r)}`);
  return r.kq.id;
}
async function luu(id, duLieu) {
  await nghi();
  const sp = await doc(id);
  const r = await goi(UID.chu, `select ban_le_luu_san_pham($1, $2::timestamptz, $3::jsonb) as r`,
                      [id, sp.updated_at, JSON.stringify(duLieu)]);
  if (r.loi || r.kq?.ok !== true) throw new Error(`không lưu được ${sp?.ma}: ${vi(r)}`);
}
async function chot(id) {
  await nghi();
  const sp = await doc(id);
  return goi(UID.chu, `select ban_le_chot_gia($1, $2::timestamptz, $3::jsonb) as r`,
             [id, sp.updated_at, JSON.stringify(sp.gia_de_chot)]);
}
async function chotPhai(id) {
  const r = await chot(id);
  if (r.loi || r.kq?.ok !== true) throw new Error(`không chốt được giá: ${vi(r)}`);
}
/** Thịt theo cân Đang bán, gắn mặt hàng kho có giá mỗi kg; gói 200 g và 400 g tự tạo. Có chốt giá nếu chot. */
async function thit(ma, ten, giaKg, { chot: coChot = true, them = {} } = {}) {
  const mhId = await matHang(ma.toUpperCase(), { gia: giaKg });
  const id = await tao(ma, ten);
  await luu(id, { mat_hang_id: mhId, trang_thai: 'dang_ban', ...them });
  if (coChot) await chotPhai(id);
  return { id, mh: mhId };
}
async function themLo(cn, mhId, viTriId, soKg, hanDung) {
  const { rows: [lo] } = await db.query(
    `insert into kho_lo (chi_nhanh_id, ma_lo, mat_hang_id, nguon, han_dung)
     values ($1, $2, $3, 'nhap', $4::date) returning id`, [cn.id, `MTV-${maGui().slice(0, 8)}`, mhId, hanDung]);
  await db.query(
    `insert into kho_so_cai (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi, chung_tu_loai, chung_tu_id)
     values ($1, $2, $3, $4, 'nhap', $5, 0, 'phieu_nhap', gen_random_uuid())`, [cn.id, lo.id, viTriId, mhId, soKg]);
}

// ---------------------------------------------------------------------------
// KHỚP của nhóm 8: ghi lại từng ca của nhóm 5 (công tắc công bố gì, hàm hiệu lực nói gì, menu web có dòng không)
// ---------------------------------------------------------------------------
const khop = [];
async function ghiKhop(ca) {
  const h = await hien();
  const { rows: [r] } = await db.query(
    `select cong_tac_bat('hien_mua_thit_ve') as cong_tac,
            exists (select 1 from mua_thit_ve_cong_khai('vi', null)) as co_dong`);
  // Bản dừng ở gói đầu (noi_dung_cong_khai hỏi bản này): đúng dòng đầu của menu đầy đủ, không hơn một dòng.
  const { rows: day } = await db.query(`select * from mua_thit_ve_cong_khai('vi', null)`);
  const { rows: dau } = await db.query(`select * from mua_thit_ve_goi('vi', null, true)`);
  khop.push({ ca, congTac: r.cong_tac, coDong: r.co_dong, hien: h,
              dauKhop: dau.length === Math.min(day.length, 1) && JSON.stringify(dau[0]) === JSON.stringify(day[0]) });
}

const mh = {};
const id = {};

// ===========================================================================
await nhom('0 · DỰNG MENU: ba sản phẩm đã chốt giá, một sản phẩm chưa chốt; công tắc và link Zalo đã công bố', async () => {
  ok('Có migration 0101_mua_thit_ve.sql', existsSync(TEP_0101));

  mh.baChi = await matHang('BA-CHI-MY', { gia: 920000, maCan: '2001' });
  id.baChi = await tao('ba-chi-bo-my', 'Ba chỉ bò Mỹ');
  await luu(id.baChi, { mat_hang_id: mh.baChi, trang_thai: 'dang_ban', thu_tu: 1, bao_quan: 'mat',
                        mo_ta_vi: 'Thái lát mỏng, nướng nhanh.', cach_dung_vi: 'Nướng mỗi mặt 30 giây.' });
  const bc = await doc(id.baChi);
  await luu(id.baChi, { goi: [{ id: goiCua(bc, 200).id, ma_fabi: 'BC-200', ma_vach: '8930000000017' },
                              { id: goiCua(bc, 400).id, ma_fabi: 'BC-400', ma_vach: '8930000000024' }] });
  await chotPhai(id.baChi);

  mh.than = await matHang('THAN-DB', { gia: 1840000, maCan: '2002' });
  id.than = await tao('than-dac-biet', 'Thăn đặc biệt');
  await luu(id.than, { mat_hang_id: mh.than, trang_thai: 'dang_ban', thu_tu: 2, bao_quan: 'dong_lanh' });
  await chotPhai(id.than);

  // Kim chi thu_tu 0 (nhỏ hơn thịt) để thử luật "thịt trước kim chi".
  mh.hop = await matHang('KIMCHI-HOP-500', { demGoi: true, donVi: 'hộp' });
  id.kimChi = await tao('kim-chi-cai-thao', 'Kim chi cải thảo', 'kim_chi', 'theo_hop');
  await luu(id.kimChi, { trang_thai: 'dang_ban', thu_tu: 0,
                         goi: [{ so_gam: 500, gia_rieng: 90000, mat_hang_id: mh.hop, ma_fabi: 'KC-500' }] });
  await chotPhai(id.kimChi);

  const chuaChot = await thit('nac-vai-chua-chot', 'Nạc vai chưa chốt', 800000, { chot: false, them: { thu_tu: 5 } });
  id.chuaChot = chuaChot.id;

  await congBoPhai('hien_mua_thit_ve', true);
  await congBoPhai('zalo_oa_url', LINK_OA);
  const r = await menu();
  ok('Dựng xong: công tắc bật, link Zalo đã công bố, menu có ba sản phẩm đã chốt (5 gói)',
     r.loi === null && r.rows.length === 5, vi(r));
});

// ===========================================================================
await nhom('1 · QUYỀN', async () => {
  const r = await menu();
  ok("anon gọi được mua_thit_ve_cong_khai('vi', 'q1')", r.loi === null && r.rows.length > 0, vi(r));

  const { rows: [ham] } = await db.query(`select pg_get_function_result(p.oid) as kq from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'mua_thit_ve_cong_khai'`);
  const kyVong = 'TABLE(san_pham_ma text, loai text, don_vi text, bao_quan text, ten text, ten_vi text, mo_ta text, '
    + 'cach_dung text, so_gam integer, gia bigint, tam_het boolean)';
  ok(`Trả đúng 11 cột, đúng thứ tự: ${COT.join(', ')}`,
     ham?.kq === kyVong && (r.rows ?? []).every(d => Object.keys(d).join(',') === COT.join(',')),
     `${ham?.kq} · ${Object.keys(r.rows?.[0] ?? {}).join(',')}`);

  const { rows: cam } = await db.query(`
    select id::text as v from ban_le_san_pham union all select id::text from ban_le_goi
    union all select id::text from kho_mat_hang union all select ma_fabi from ban_le_goi where ma_fabi is not null
    union all select ma_vach from ban_le_goi where ma_vach is not null
    union all select gia_ban_kg::text from kho_mat_hang where gia_ban_kg is not null
    union all select ma_can from kho_mat_hang where ma_can is not null`);
  const tapCam = new Set(cam.map(x => x.v));
  const lo = [];
  for (const d of r.rows ?? []) {
    for (const [k, v] of Object.entries(d)) {
      if (v === null) continue;
      const s = String(v);
      if (tapCam.has(s) || /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(s)) lo.push(`${k}=${s}`);
    }
  }
  ok('Không giá trị nào là uuid, mã FABi, mã vạch hay giá mỗi kg của mặt hàng', (r.rows ?? []).length > 0 && lo.length === 0,
     lo.join(' · '));

  const bangLo = [];
  for (const bang of ['ban_le_san_pham', 'ban_le_goi', 'kho_ton', 'kho_mat_hang', 'noi_dung_cong_bo']) {
    const t = await duoiAnon(`select count(*)::int as n from ${bang}`);
    if (!(t.loi !== null && t.ma === '42501')) bangLo.push(`${bang}: ${vi(t)}`);
  }
  ok('anon vẫn không đọc được ban_le_san_pham, ban_le_goi, kho_ton, kho_mat_hang, noi_dung_cong_bo (42501)',
     bangLo.length === 0, bangLo.join(' · '));

  const hamLo = [];
  for (const [ten, sql, p] of [
    ['ban_le_danh_sach', `select ban_le_danh_sach(null, null)`, []],
    ['ban_le_tao_san_pham', `select ban_le_tao_san_pham($1, 'anon-tao', 'Anon tạo', 'thit', 'theo_can')`, [maGui()]],
    ['ban_le_luu_san_pham', `select ban_le_luu_san_pham($1, now(), '{}'::jsonb)`, [id.baChi]],
    ['ban_le_chot_gia', `select ban_le_chot_gia($1, now(), '{}'::jsonb)`, [id.baChi]],
    ['ban_le_doi_chieu', `select ban_le_doi_chieu($1)`, [cnA.id]],
  ]) {
    const t = await duoiAnon(sql, p);
    if (!(t.loi !== null && t.ma === '42501')) hamLo.push(`${ten}: ${vi(t)}`);
  }
  ok('anon vẫn không gọi được năm hàm ban_le_* của trang nội bộ (42501)', hamLo.length === 0, hamLo.join(' · '));

  const { rows: [anonBanLe] } = await db.query(`select count(*)::int n from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname = 'public' and p.proname like 'ban\\_le\\_%' and has_function_privilege('anon', p.oid, 'execute')`);
  ok('Không hàm ban_le_* nào anon gọi được (bất biến của test-ban-le.mjs giữ nguyên)', anonBanLe.n === 0, `${anonBanLe.n} hàm`);

  const noiBo = [
    ['chu_dich_con_hieu_luc', `select chu_dich_con_hieu_luc('vi', '{}'::jsonb, 'ten', 'Ba chỉ', null, null)`],
    ['la_link_zalo_oa', `select la_link_zalo_oa('https://zalo.me/1')`],
    ['mua_thit_ve_kenh_mo', `select mua_thit_ve_kenh_mo()`],
    ['mua_thit_ve_goi', `select * from mua_thit_ve_goi('vi', null, false)`],
  ];
  const noiBoLo = [];
  for (const [ten, sql] of noiBo) {
    const t = await duoiAnon(sql);
    if (!(t.loi !== null && t.ma === '42501')) noiBoLo.push(`${ten}: ${vi(t)}`);
  }
  ok('anon không gọi được chu_dich_con_hieu_luc, la_link_zalo_oa, mua_thit_ve_kenh_mo, mua_thit_ve_goi (42501)', noiBoLo.length === 0,
     noiBoLo.join(' · '));

  const kenh = await duoi(UID.chu, `select mua_thit_ve_kenh_mo()`);
  ok('authenticated không gọi được mua_thit_ve_kenh_mo (thu quyền ở khối thứ hai)', kenh.ma === '42501', vi(kenh));
  const goiNoiBo = await duoi(UID.chu, `select * from mua_thit_ve_goi('vi', null, false)`);
  ok('authenticated không gọi được mua_thit_ve_goi (thu quyền ở khối thứ hai) — chỉ hai hàm definer gọi nó',
     goiNoiBo.ma === '42501', vi(goiNoiBo));
  const trig = await duoi(UID.chu, `select zalo_oa_url_kiem_tra()`);
  ok('authenticated không gọi được hàm trigger zalo_oa_url_kiem_tra (thu quyền ở khối thứ hai)', trig.ma === '42501', vi(trig));
  const thuan = await duoi(UID.qlA, `select la_link_zalo_oa($1) as a,
    chu_dich_con_hieu_luc('vi', '{}'::jsonb, 'ten', 'Ba chỉ', null, null) as b`, [LINK_OA]);
  ok('authenticated gọi được hai hàm thuần la_link_zalo_oa, chu_dich_con_hieu_luc (như ban_le_gia_goi — không đọc bảng nào)',
     thuan.loi === null && thuan.rows[0].a === true && thuan.rows[0].b === 'Ba chỉ', vi(thuan));

  const { rows: dinhNghia } = await db.query(`
    select p.proname, p.prosecdef, p.provolatile, p.proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('mua_thit_ve_cong_khai', 'mua_thit_ve_kenh_mo', 'la_link_zalo_oa',
                                                   'chu_dich_con_hieu_luc', 'zalo_oa_url_kiem_tra', 'mua_thit_ve_goi')`);
  const cuaHam = ten => dinhNghia.find(x => x.proname === ten);
  const cong = cuaHam('mua_thit_ve_cong_khai');
  ok("mua_thit_ve_cong_khai là security definer, có search_path = public, chỉ đọc (provolatile = 's')",
     cong?.prosecdef === true && (cong.proconfig ?? []).includes('search_path=public') && cong.provolatile === 's',
     JSON.stringify(cong));
  const khac = ['mua_thit_ve_kenh_mo', 'la_link_zalo_oa', 'chu_dich_con_hieu_luc', 'zalo_oa_url_kiem_tra',
                'mua_thit_ve_goi'].map(cuaHam);
  ok('Năm hàm mới còn lại không security definer, đều có search_path = public; hai hàm thuần là immutable',
     khac.every(h => h && h.prosecdef === false && (h.proconfig ?? []).includes('search_path=public'))
     && cuaHam('la_link_zalo_oa')?.provolatile === 'i' && cuaHam('chu_dich_con_hieu_luc')?.provolatile === 'i'
     && cuaHam('mua_thit_ve_kenh_mo')?.provolatile === 's' && cuaHam('mua_thit_ve_goi')?.provolatile === 's',
     JSON.stringify(khac));

  const anon = JSON.stringify((await menu()).rows);
  const theoVai = [];
  for (const [ai, uid] of [['Quản lý Q1', UID.qlA], ['Quản lý ĐÃ NGHỈ', UID_QL_NGHI], ['Tài khoản không có dòng nhan_su', UID_LA],
                           ['Đăng nhập nhưng không phiên', null], ['Chủ', UID.chu]]) {
    const t = await menu({ uid });
    if (t.loi !== null || JSON.stringify(t.rows) !== anon) theoVai.push(`${ai}: ${ngan(vi(t))}`);
  }
  ok('Quản lý, nhân sự đã nghỉ, tài khoản không có dòng nhan_su thấy đúng như anon — hàm công khai không lộ thêm theo vai',
     theoVai.length === 0, theoVai.join(' · '));

  const CHI_CHU = KHOA_MOI.filter(k => k[2]).map(k => k[0]);
  const CON_LAI = KHOA_MOI.filter(k => !k[2]).map(k => k[0]);
  const chuLo = [];
  for (const khoa of CHI_CHU) {
    const kieu = KHOA_MOI.find(k => k[0] === khoa)[1];
    const t = await congBo(khoa, kieu === 'bool' ? true : 'Câu thử của quản lý.', UID.qlA);
    if (!(t.loi !== null && t.ma === '42501')) chuLo.push(`${khoa}: ${vi(t)}`);
  }
  const conLaiLo = [];
  for (const khoa of CON_LAI) {
    const t = await congBo(khoa, 'Câu thử của quản lý.', UID.qlA);
    if (t.loi !== null) conLaiLo.push(`${khoa}: ${vi(t)}`);
    await thuHoi(khoa);
  }
  ok(`Quản lý không công bố được sáu khóa chỉ chủ của nhóm mua_thit (${CHI_CHU.join(', ')}); công bố được bốn khóa còn lại`,
     CHI_CHU.length === 6 && CON_LAI.length === 4 && chuLo.length === 0 && conLaiLo.length === 0
     && (await dangSong('hien_mua_thit_ve'))?.gia_tri_bool === true, [...chuLo, ...conLaiLo].join(' · '));

  const qlCongBo = await congBo('zalo_oa_url', 'https://zalo.me/beeftown', UID.qlA);
  const qlGo = await thuHoi('zalo_oa_url', UID.qlA);
  const conNguyen = (await dangSong('zalo_oa_url'))?.gia_tri_text === LINK_OA;
  const chuGo = await thuHoi('zalo_oa_url');
  const daGo = (await dangSong('zalo_oa_url')) === null;
  const chuCongBo = await congBo('zalo_oa_url', LINK_OA);
  ok('Quản lý không công bố, không gỡ được zalo_oa_url (khóa chỉ chủ từ 0101); chủ công bố và gỡ được',
     qlCongBo.ma === '42501' && qlGo.ma === '42501' && conNguyen && chuGo.kq === true && daGo
     && chuCongBo.loi === null && (await dangSong('zalo_oa_url'))?.gia_tri_text === LINK_OA,
     `ql công bố: ${vi(qlCongBo)} · ql gỡ: ${vi(qlGo)} · chủ gỡ: ${vi(chuGo)} · chủ công bố: ${vi(chuCongBo)}`);

  const SAI = ['https://example.com/x', 'https://zalo.me/x?y=1', 'https://zalo.me/x#y', 'https://zalo.me/a/b',
               'https://zalo.me.example.com/x', 'https://zalo.me/'];
  const saiLo = [];
  for (const u of SAI) {
    const t = await congBo('zalo_oa_url', u);
    if (!(t.loi === CAU_ZALO && t.ma === '23514')) saiLo.push(`${u} → ${vi(t)}`);
  }
  ok(`zalo_oa_url từ chối ${SAI.join(', ')} — câu tiếng Việt mới, mã check_violation`,
     saiLo.length === 0 && (await dangSong('zalo_oa_url'))?.gia_tri_text === LINK_OA, saiLo.join(' · '));

  const dung = [];
  for (const u of [LINK_OA, 'https://zalo.me/beeftown/']) {
    const t = await congBo('zalo_oa_url', u);
    dung.push(t.loi === null && (await dangSong('zalo_oa_url'))?.gia_tri_text === u ? null : `${u} → ${vi(t)}`);
  }
  ok('zalo_oa_url nhận https://zalo.me/3030027075662095415 và https://zalo.me/beeftown/', dung.every(x => x === null),
     dung.filter(Boolean).join(' · '));
  await congBoPhai('zalo_oa_url', LINK_OA);

  // Dòng có trước 0101: chèn khi tạm tắt trigger (như database production trước khi chạy 0101).
  await db.exec(`alter table noi_dung_cong_bo disable trigger zalo_oa_url_kiem_tra_trigger`);
  try {
    await db.query(`update noi_dung_cong_bo set trang_thai = 'da_thu_hoi' where khoa = 'zalo_oa_url' and trang_thai = 'da_cong_bo'`);
    await db.query(`insert into noi_dung_cong_bo (khoa, kieu, gia_tri_text, trang_thai)
                    values ('zalo_oa_url', 'url', 'https://example.com/oa-cu', 'da_cong_bo')`);
  } finally {
    await db.exec(`alter table noi_dung_cong_bo enable trigger zalo_oa_url_kiem_tra_trigger`);
  }
  const { rows: [k] } = await db.query(`select mua_thit_ve_kenh_mo() as mo`);
  const rCu = await menu();
  const hCu = await hien();
  const go = await thuHoi('zalo_oa_url');
  ok('Dòng zalo_oa_url không hợp lệ có từ trước 0101 (chèn khi tạm tắt trigger) vẫn gỡ được, và kênh không mở',
     k.mo === false && rCu.loi === null && rCu.rows.length === 0 && hCu === false
     && go.loi === null && go.kq === true && (await dangSong('zalo_oa_url')) === null,
     `kênh mở: ${k.mo} · menu: ${vi(rCu)} · hien: ${hCu} · gỡ: ${vi(go)}`);
  await congBoPhai('zalo_oa_url', LINK_OA);

  // Bản NHÁP có trước 0101 không hợp lệ: duyệt hay công bố nó (đổi trang_thai, không đổi chữ) vẫn phải qua mẫu.
  await db.exec(`alter table noi_dung_cong_bo disable trigger zalo_oa_url_kiem_tra_trigger`);
  let nhapCu;
  try {
    ({ rows: [nhapCu] } = await db.query(`insert into noi_dung_cong_bo (khoa, kieu, gia_tri_text, trang_thai)
                    values ('zalo_oa_url', 'url', 'https://example.com/nhap-cu', 'nhap') returning id`));
  } finally {
    await db.exec(`alter table noi_dung_cong_bo enable trigger zalo_oa_url_kiem_tra_trigger`);
  }
  let duyetCu;
  try {
    await db.query(`update noi_dung_cong_bo set trang_thai = 'da_duyet' where id = $1`, [nhapCu.id]);
    duyetCu = 'không lỗi';
  } catch (e) { duyetCu = e.message; }
  const { rows: [conNhap] } = await db.query(`select trang_thai from noi_dung_cong_bo where id = $1`, [nhapCu.id]);
  ok('Bản nháp zalo_oa_url không hợp lệ có từ trước 0101 không duyệt được (trigger kiểm cả khi chỉ đổi trạng thái sang duyệt / công bố)',
     duyetCu === CAU_ZALO && conNhap.trang_thai === 'nhap' && (await dangSong('zalo_oa_url'))?.gia_tri_text === LINK_OA,
     `${duyetCu} · trạng thái: ${conNhap.trang_thai}`);
  await db.query(`delete from noi_dung_cong_bo where id = $1`, [nhapCu.id]);

  const nd = await duoiAnon(`select noi_dung_cong_khai() as j`);
  ok('anon gọi noi_dung_cong_khai() khi công tắc bật: không lỗi quyền (hàm definer gọi mua_thit_ve_cong_khai)',
     nd.loi === null && nd.rows[0].j.hien_mua_thit_ve === true, vi(nd));
});

// ===========================================================================
await nhom('2 · BẤM HAI LẦN — website chỉ đọc, không ghi gì', async () => {
  const dem = async () => (await db.query(`select
    (select count(*) from ban_le_san_pham)::int as sp, (select count(*) from ban_le_goi)::int as goi,
    (select count(*) from noi_dung_cong_bo)::int as nd, (select count(*) from kho_so_cai)::int as so_cai`)).rows[0];
  const truoc = await dem();
  const a = await menu();
  const b = await menu();
  ok('Gọi mua_thit_ve_cong_khai hai lần liền: cùng kết quả, không bảng nào thêm dòng',
     a.loi === null && a.rows.length > 0 && JSON.stringify(a.rows) === JSON.stringify(b.rows)
     && JSON.stringify(await dem()) === JSON.stringify(truoc), `${JSON.stringify(truoc)} → ${JSON.stringify(await dem())}`);
  const n1 = await noiDung();
  const n2 = await noiDung();
  ok('Gọi noi_dung_cong_khai hai lần liền khi công tắc bật: cùng kết quả, không bảng nào thêm dòng',
     n1?.hien_mua_thit_ve === true && JSON.stringify(n1) === JSON.stringify(n2)
     && JSON.stringify(await dem()) === JSON.stringify(truoc));
});

// ===========================================================================
await nhom('3 · GIỜ VIỆT NAM — "Tạm hết ở quầy" theo lô còn hạn', async () => {
  // Công tắc tạm hết bật, chi nhánh q1 trừ kho theo iPOS (quầy bán = vị trí quầy), lô hạn 13/11 ở quầy đủ gói 200 g.
  await db.query(`update kho_cai_dat set nguon_so_ban = 'ipos' where chi_nhanh_id = $1`, [cnA.id]);
  await db.query(`insert into kho_ipos_cau_hinh (chi_nhanh_id, ipos_tu_luc, vi_tri_ban_id) values ($1, now(), $2)`,
                 [cnA.id, vtA.quay]);
  await congBoPhai('mua_thit_hien_tam_het', true);
  const gio = await thit('than-ngoai-gio-vn', 'Thăn ngoại giờ VN', 900000, { them: { thu_tu: 20 } });
  id.gio = gio.id;
  const ngay = '2026-11-13';
  await datGioDatabase(db, `${ngay}T23:50:00+07:00`);
  try {
    await themLo(cnA, gio.mh, vtA.quay, 0.3, ngay);
    let r = await menu();
    ok('23:50 giờ VN ngày 13/11: lô hạn 13/11 còn tính → gói 200 g tam_het = false',
       goiCuaMenu(r, 'than-ngoai-gio-vn', 200)?.tam_het === false && goiCuaMenu(r, 'than-ngoai-gio-vn', 400)?.tam_het === true,
       JSON.stringify(dongCua(r, 'than-ngoai-gio-vn')));
    await datGioDatabase(db, '2026-11-14T00:10:00+07:00');
    r = await menu();
    ok('00:10 giờ VN ngày 14/11 (UTC vẫn 13/11): lô đó hết hạn → gói 200 g tam_het = true',
       goiCuaMenu(r, 'than-ngoai-gio-vn', 200)?.tam_het === true, JSON.stringify(dongCua(r, 'than-ngoai-gio-vn')));
  } finally {
    await traGioDatabase(db);
  }
});

// ===========================================================================
await nhom('4 · CHỮ VÀ SỐ', async () => {
  const r = await menu();
  const { rows: [g] } = await db.query(`select ban_le_gia_goi(920000, 200) as g200, ban_le_gia_goi(1840000, 400) as g400`);
  const chotBc = (await doc(id.baChi))?.gia_chot;
  const chotThan = (await doc(id.than))?.gia_chot;
  ok('Giá gói 200 g = giá chốt = ban_le_gia_goi(giá kg, 200) lúc chốt (920.000 đ/kg → 184.000)',
     giaCua(r, 'ba-chi-bo-my', 200) === 184000 && Number(g.g200) === 184000 && Number(chotBc?.goi?.['200']) === 184000,
     JSON.stringify(giaMoiGoi(r, 'ba-chi-bo-my')));
  ok('Giá gói 400 g = ban_le_gia_goi(giá kg, 400) lúc chốt (1.840.000 đ/kg → 736.000)',
     giaCua(r, 'than-dac-biet', 400) === 736000 && Number(g.g400) === 736000 && Number(chotThan?.goi?.['400']) === 736000,
     JSON.stringify(giaMoiGoi(r, 'than-dac-biet')));
  const bc = dongCua(r, 'ba-chi-bo-my')[0];
  ok('Tên có dấu "Ba chỉ bò Mỹ" giữ nguyên từng ký tự',
     bc?.ten === 'Ba chỉ bò Mỹ' && bc.ten_vi === 'Ba chỉ bò Mỹ' && bc.ten === bc.ten.normalize('NFC')
     && bc.mo_ta === 'Thái lát mỏng, nướng nhanh.' && bc.cach_dung === 'Nướng mỗi mặt 30 giây.', JSON.stringify(bc));

  await luu(id.than, { ten_en: 'Special tenderloin' });
  const fr = await menu({ nn: 'fr' });
  const en = await menu({ nn: 'en' });
  ok("p_ngon_ngu lạ ('fr') → chữ tiếng Việt",
     dongCua(fr, 'than-dac-biet')[0]?.ten === 'Thăn đặc biệt' && dongCua(en, 'than-dac-biet')[0]?.ten === 'Special tenderloin',
     `${dongCua(fr, 'than-dac-biet')[0]?.ten} · en: ${dongCua(en, 'than-dac-biet')[0]?.ten}`);

  // Như PostgREST: kết quả đi qua to_jsonb (taoClientPg) — số nguyên JSON, không phải chuỗi.
  const { data, error } = await clientCua('anon').rpc('mua_thit_ve_cong_khai', { p_ngon_ngu: 'vi', p_chi_nhanh_ma: 'q1' });
  ok('gia trả về là số nguyên, không phải chữ',
     !error && Array.isArray(data) && data.length > 0
     && data.every(d => typeof d.gia === 'number' && Number.isSafeInteger(d.gia) && d.gia > 0
                        && typeof d.so_gam === 'number' && typeof d.tam_het === 'boolean'),
     error ? `${error.code}: ${error.message}` : ngan(data));
});

// ===========================================================================
await nhom('5 · LUẬT GIÁ — quyết định 1 của Khánh (26/10/2026): trang hiện giá đã chốt', async () => {
  let r;
  await thuHoi('hien_mua_thit_ve');
  r = await menu();
  ok('Công tắc hien_mua_thit_ve chưa công bố → không dòng nào', r.loi === null && r.rows.length === 0, vi(r));
  await ghiKhop('công tắc chưa công bố');
  await congBoPhai('hien_mua_thit_ve', false);
  r = await menu();
  ok('Công tắc công bố nhưng đặt false → không dòng nào', r.loi === null && r.rows.length === 0, vi(r));
  await ghiKhop('công tắc công bố false');
  await congBoPhai('hien_mua_thit_ve', true);
  await thuHoi('zalo_oa_url');
  r = await menu();
  ok('Công tắc bật, chưa công bố zalo_oa_url → không dòng nào', r.loi === null && r.rows.length === 0, vi(r));
  await ghiKhop('chưa công bố zalo_oa_url');
  await congBoPhai('zalo_oa_url', LINK_OA);
  await ghiKhop('đủ ba điều kiện');

  r = await menu();
  ok('Sản phẩm Đang bán nhưng CHƯA chốt giá lần nào → không có dòng',
     r.rows.length > 0 && dongCua(r, 'nac-vai-chua-chot').length === 0
     && (await doc(id.chuaChot))?.trang_thai === 'dang_ban' && (await doc(id.chuaChot))?.gia_chot === null, vi(r));

  const ds = (await goi(UID.chu, `select ban_le_danh_sach() as r`)).kq ?? [];
  const chotCua = Object.fromEntries(ds.map(sp => [sp.ma, sp.gia_chot]));
  const lech = r.rows.filter(d => Number(d.gia) !== Number(chotCua[d.san_pham_ma]?.goi?.[String(d.so_gam)]));
  ok('Chốt giá xong → gia của mỗi gói bằng giá gói đó trong ảnh chụp gia_chot', r.rows.length >= 5 && lech.length === 0,
     JSON.stringify(lech));

  // Một sản phẩm cho chuỗi đổi giá: 1.000.000 đ/kg lúc chốt → 200 g 200.000, 400 g 400.000.
  const luat = await thit('than-luat-gia', 'Thăn luật giá', 1000000, { them: { thu_tu: 3 } });
  id.luat = luat.id;
  const spLuat = await doc(id.luat);
  const g200 = goiCua(spLuat, 200).id;
  const g400 = goiCua(spLuat, 400).id;
  r = await menu();
  const giaDau = JSON.stringify(giaMoiGoi(r, 'than-luat-gia'));

  await db.query(`update kho_mat_hang set gia_ban_kg = 1100000 where id = $1`, [luat.mh]);
  r = await menu();
  ok('Đổi giá mỗi kg ở Kho sau khi chốt → vẫn có dòng, gia giữ giá đã chốt, không theo giá mới',
     giaDau === JSON.stringify({ 200: 200000, 400: 400000 })
     && JSON.stringify(giaMoiGoi(r, 'than-luat-gia')) === giaDau && (await doc(id.luat))?.gia_thu === true,
     `${giaDau} → ${JSON.stringify(giaMoiGoi(r, 'than-luat-gia'))}`);
  await ghiKhop('đổi giá kg sau khi chốt');

  await luu(id.luat, { goi: [{ id: g200, gia_rieng: 250000 }] });
  r = await menu();
  ok('Đổi giá riêng của gói sau khi chốt → gia giữ giá đã chốt', giaCua(r, 'than-luat-gia', 200) === 200000,
     JSON.stringify(giaMoiGoi(r, 'than-luat-gia')));

  await db.query(`update kho_mat_hang set gia_ban_kg = null where id = $1`, [luat.mh]);
  r = await menu();
  ok('Xóa giá mỗi kg của mặt hàng sau khi chốt → gói vẫn hiện với giá đã chốt',
     JSON.stringify(giaMoiGoi(r, 'than-luat-gia')) === giaDau, JSON.stringify(giaMoiGoi(r, 'than-luat-gia')));
  await ghiKhop('xóa giá kg sau khi chốt');

  await db.query(`update kho_mat_hang set gia_ban_kg = 1200000 where id = $1`, [luat.mh]);
  await chotPhai(id.luat);
  r = await menu();
  ok('Chủ chốt lại → gia là giá mới', JSON.stringify(giaMoiGoi(r, 'than-luat-gia')) === JSON.stringify({ 200: 250000, 400: 480000 }),
     JSON.stringify(giaMoiGoi(r, 'than-luat-gia')));

  await luu(id.luat, { goi: [{ so_gam: 600 }] });
  r = await menu();
  ok('Thêm gói 600 g sau lần chốt → không có dòng 600 g; 200 g và 400 g vẫn còn',
     goiCuaMenu(r, 'than-luat-gia', 600) === undefined && giaCua(r, 'than-luat-gia', 200) === 250000
     && giaCua(r, 'than-luat-gia', 400) === 480000 && goiCua(await doc(id.luat), 600)?.gia === 720000,
     JSON.stringify(giaMoiGoi(r, 'than-luat-gia')));
  await ghiKhop('thêm gói sau lần chốt');

  await luu(id.luat, { goi: [{ id: g400, dang_ban: false }] });
  r = await menu();
  ok('Gói ngưng bán → không có dòng của gói đó',
     goiCuaMenu(r, 'than-luat-gia', 400) === undefined && giaCua(r, 'than-luat-gia', 200) === 250000,
     JSON.stringify(giaMoiGoi(r, 'than-luat-gia')));
  await ghiKhop('gói ngưng bán');
  await luu(id.luat, { goi: [{ id: g400, dang_ban: true }] });

  await luu(id.luat, { trang_thai: 'tam_ngung' });
  r = await menu();
  ok('Sản phẩm Tạm ngưng → không dòng', r.rows.length > 0 && dongCua(r, 'than-luat-gia').length === 0, vi(r));
  await ghiKhop('sản phẩm tạm ngưng');
  await luu(id.luat, { trang_thai: 'dang_ban' });

  await luu(id.luat, { kenh_web: false });
  r = await menu();
  ok('Bỏ kênh website (kenh_web = false) → không dòng', r.rows.length > 0 && dongCua(r, 'than-luat-gia').length === 0, vi(r));
  await ghiKhop('bỏ kênh website');
  await luu(id.luat, { kenh_web: true });
  ok('…bật lại kênh website → sản phẩm hiện lại với giá đã chốt', giaCua(await menu(), 'than-luat-gia', 200) === 250000);

  // Kim chi
  mh.hop2 = await matHang('KIMCHI-CU-CAI', { demGoi: true, donVi: 'hộp' });
  const kc2 = await tao('kim-chi-cu-cai', 'Kim chi củ cải', 'kim_chi', 'theo_hop');
  await luu(kc2, { trang_thai: 'dang_ban', goi: [{ so_gam: 500, mat_hang_id: mh.hop2 }] });
  const c2 = await chot(kc2);
  r = await menu();
  ok('Hộp kim chi chưa chốt được (chưa có giá riêng) → không dòng',
     c2.loi === 'Chưa có giá nào để chốt.' && dongCua(r, 'kim-chi-cu-cai').length === 0, vi(c2));

  const kc = dongCua(r, 'kim-chi-cai-thao');
  ok('Hộp kim chi đã chốt → don_vi = hop, so_gam là khối lượng hộp, gia là giá chốt của hộp',
     kc.length === 1 && kc[0].don_vi === 'hop' && kc[0].loai === 'kim_chi' && kc[0].so_gam === 500
     && Number(kc[0].gia) === 90000 && kc[0].bao_quan === 'giu_lanh', JSON.stringify(kc));
  await luu(id.kimChi, { goi: [{ id: goiCua(await doc(id.kimChi), 500).id, gia_rieng: 95000 }] });
  r = await menu();
  ok('Đổi giá riêng của hộp sau khi chốt → gia giữ giá chốt của hộp', giaCua(r, 'kim-chi-cai-thao', 500) === 90000,
     JSON.stringify(dongCua(r, 'kim-chi-cai-thao')));
  await ghiKhop('đổi giá hộp sau khi chốt');

  // Mặt hàng kho của phần thịt
  const chuaGan = await tao('than-chua-gan-kho', 'Thăn chưa gắn kho');
  await luu(chuaGan, { trang_thai: 'dang_ban', goi: [{ id: goiCua(await doc(chuaGan), 200).id, gia_rieng: 300000 }] });
  const cg = await chot(chuaGan);
  r = await menu();
  ok('Phần thịt chưa gắn mặt hàng kho → ẩn',
     cg.kq?.ok === true && Number((await doc(chuaGan))?.gia_chot?.goi?.['200']) === 300000
     && dongCua(r, 'than-chua-gan-kho').length === 0, vi(cg));

  const ngung = await thit('than-mat-hang-ngung', 'Thăn mặt hàng ngừng', 900000);
  const coTruoc = dongCua(await menu(), 'than-mat-hang-ngung').length;
  await db.query(`update kho_mat_hang set dang_dung = false where id = $1`, [ngung.mh]);
  r = await menu();
  ok('Mặt hàng kho của phần thịt ngừng dùng → ẩn cả sản phẩm', coTruoc === 2 && dongCua(r, 'than-mat-hang-ngung').length === 0,
     `trước: ${coTruoc} dòng`);
  await ghiKhop('mặt hàng ngừng dùng');

  const mat = await thit('than-mat-hang-mat', 'Thăn mặt hàng mất', 900000);
  const coTruocMat = dongCua(await menu(), 'than-mat-hang-mat').length;
  await db.query(`delete from kho_mat_hang where id = $1`, [mat.mh]);
  r = await menu();
  ok('Mặt hàng kho của phần thịt đã mất (không còn dòng) → ẩn cả sản phẩm',
     coTruocMat === 2 && dongCua(r, 'than-mat-hang-mat').length === 0, `trước: ${coTruocMat} dòng`);

  // Gói đóng sẵn: mỗi cỡ gói một mặt hàng đếm theo gói.
  const ds200 = await matHang('DONG-SAN-200', { demGoi: true });
  const ds400 = await matHang('DONG-SAN-400', { demGoi: true });
  const dongSan = await thit('than-dong-san', 'Thăn đóng gói sẵn', 1000000, { chot: false, them: { nguon_goi: 'dong_san' } });
  const spDs = await doc(dongSan.id);
  await luu(dongSan.id, { goi: [{ id: goiCua(spDs, 200).id, mat_hang_id: ds200 }, { id: goiCua(spDs, 400).id, mat_hang_id: ds400 }] });
  await chotPhai(dongSan.id);
  const coTruocDs = Object.keys(giaMoiGoi(await menu(), 'than-dong-san')).join(',');
  await db.query(`update kho_mat_hang set dang_dung = false where id = $1`, [ds200]);
  r = await menu();
  ok('Gói đóng sẵn có mặt hàng riêng ngừng dùng → ẩn gói đó, gói khác còn',
     coTruocDs === '200,400' && Object.keys(giaMoiGoi(r, 'than-dong-san')).join(',') === '400',
     `${coTruocDs} → ${Object.keys(giaMoiGoi(r, 'than-dong-san')).join(',')}`);

  // Chữ tạm (ngoặc vuông)
  const ngoac = await thit('than-chu-tam', 'Thăn chữ tạm', 1000000, { them: { mo_ta_vi: 'Mô tả [chờ duyệt]' } });
  r = await menu();
  ok('Mô tả còn ngoặc vuông → mo_ta null, sản phẩm vẫn hiện',
     dongCua(r, 'than-chu-tam').length === 2 && dongCua(r, 'than-chu-tam').every(d => d.mo_ta === null),
     JSON.stringify(dongCua(r, 'than-chu-tam')));
  await luu(ngoac.id, { ten_vi: 'Thăn [chờ]' });
  r = await menu();
  ok('Tên còn ngoặc vuông "[chờ]" → ẩn sản phẩm', r.rows.length > 0 && dongCua(r, 'than-chu-tam').length === 0, vi(r));
  await ghiKhop('tên còn ngoặc vuông');

  // Thứ tự và hợp đồng giá
  r = await menu();
  const dsMoi = (await goi(UID.chu, `select ban_le_danh_sach() as r`)).kq ?? [];
  const thuTuSp = [];
  for (const d of r.rows) if (thuTuSp.at(-1) !== d.san_pham_ma) thuTuSp.push(d.san_pham_ma);
  const thuTuDs = dsMoi.map(sp => sp.ma).filter(ma => thuTuSp.includes(ma));
  const loai = r.rows.map(d => d.loai);
  const gamTang = thuTuSp.every(ma => {
    const gam = dongCua(r, ma).map(d => d.so_gam);
    return gam.every((x, i) => i === 0 || gam[i - 1] < x);
  });
  ok('Thứ tự: thịt trước kim chi, theo thu_tu; gói theo so_gam tăng dần',
     loai.lastIndexOf('thit') < loai.indexOf('kim_chi') && new Set(thuTuSp).size === thuTuSp.length
     && thuTuSp.join(',') === thuTuDs.join(',') && thuTuSp.indexOf('ba-chi-bo-my') < thuTuSp.indexOf('than-dac-biet') && gamTang,
     `${thuTuSp.join(', ')} · danh sách nội bộ: ${thuTuDs.join(', ')}`);

  const chotMoi = Object.fromEntries(dsMoi.map(sp => [sp.ma, sp.gia_chot]));
  const lechMoi = r.rows.filter(d => Number(d.gia) !== Number(chotMoi[d.san_pham_ma]?.goi?.[String(d.so_gam)]));
  ok('HỢP ĐỒNG: với mọi gói hiện ra, gia = gia_chot.goi[so_gam] của sản phẩm đó trong ban_le_danh_sach',
     r.rows.length >= 8 && lechMoi.length === 0, JSON.stringify(lechMoi));
});

// ===========================================================================
await nhom('6 · TẠM HẾT Ở QUẦY — chỉ khi chắc chắn', async () => {
  // q1 đang trừ kho theo iPOS (nhóm 3); q7 ở chế độ kiểm kê (mặc định).
  const tam = await thit('than-tam-het', 'Thăn tạm hết', 1000000, { them: { thu_tu: 30 } });
  const { rows: [h] } = await db.query(`select (hom_nay_vn() + 30)::text as d`);
  await themLo(cnA, tam.mh, vtA.quay, 0.3, h.d);
  const { rows: [j] } = await db.query(`select ban_le_san_pham_json($1, $2, false) as j`, [tam.id, cnA.id]);
  const hetThat = (j.j.goi ?? []).find(g => g.so_gam === 400)?.con_hang === 'het';

  await congBoPhai('mua_thit_hien_tam_het', false);
  let r = await menu();
  ok('Công tắc mua_thit_hien_tam_het tắt → mọi tam_het = false, kể cả khi quầy hết',
     hetThat && r.rows.length > 0 && r.rows.every(d => d.tam_het === false), `quầy hết gói 400 g: ${hetThat}`);
  await congBoPhai('mua_thit_hien_tam_het', true);

  r = await menu({ cn: 'q7' });
  ok('Bật, chi nhánh ở chế độ kiểm kê → tam_het = false',
     dongCua(r, 'than-tam-het').length === 2 && r.rows.every(d => d.tam_het === false), JSON.stringify(dongCua(r, 'than-tam-het')));

  r = await menu();
  ok('Bật, chi nhánh trừ kho theo iPOS, quầy còn 300 g → gói 200 g false, gói 400 g true',
     goiCuaMenu(r, 'than-tam-het', 200)?.tam_het === false && goiCuaMenu(r, 'than-tam-het', 400)?.tam_het === true,
     JSON.stringify(dongCua(r, 'than-tam-het')));

  const la = await menu({ cn: 'khong-co' });
  const rong = await menu({ cn: null });
  ok('Mã chi nhánh lạ hoặc null → tam_het = false, sản phẩm không bị ẩn',
     [la, rong].every(x => x.loi === null && dongCua(x, 'than-tam-het').length === 2 && x.rows.every(d => d.tam_het === false)),
     `${vi(la).slice(0, 200)} · ${vi(rong).slice(0, 200)}`);

  await db.query(`update chi_nhanh set dang_hoat_dong = false where id = $1`, [cnA.id]);
  try {
    r = await menu();
    ok('Chi nhánh ngừng hoạt động → tam_het = false',
       dongCua(r, 'than-tam-het').length === 2 && r.rows.every(d => d.tam_het === false), JSON.stringify(dongCua(r, 'than-tam-het')));
  } finally {
    await db.query(`update chi_nhanh set dang_hoat_dong = true where id = $1`, [cnA.id]);
  }
});

// ===========================================================================
await nhom('7 · BẢN DỊCH — bản dịch của câu gốc cũ không lên trang', async () => {
  const dich = await thit('than-ban-dich', 'Thăn bản dịch', 1000000, { them: { thu_tu: 40 } });
  const dongNn = async nn => dongCua(await menu({ nn }), 'than-ban-dich')[0];

  ok('Trang en, chưa có bản en → tên tiếng Việt', (await dongNn('en'))?.ten === 'Thăn bản dịch', JSON.stringify(await dongNn('en')));

  await luu(dich.id, { ten_en: 'Translated loin' });
  const en = await dongNn('en');
  ok('Trang en, bản en còn hiệu lực → tên tiếng Anh', en?.ten === 'Translated loin', JSON.stringify(en));

  const koTruoc = await dongNn('ko');
  await luu(dich.id, { ten_ko: '번역 등심' });
  const ko = await dongNn('ko');
  ok('Trang ko không có bản ko → bản en; bản ko còn hiệu lực → bản ko', koTruoc?.ten === 'Translated loin' && ko?.ten === '번역 등심',
     `${koTruoc?.ten} → ${ko?.ten}`);

  await luu(dich.id, { ten_vi: 'Thăn bản dịch mới' });
  const enSau = await dongNn('en');
  const koSau = await dongNn('ko');
  ok('Sửa ten_vi sau khi dịch (bản en cũ) → trang en hiện tên tiếng Việt mới, không hiện bản cũ',
     enSau?.ten === 'Thăn bản dịch mới' && koSau?.ten === 'Thăn bản dịch mới'
     && (await doc(dich.id))?.ten_en === 'Translated loin', `en: ${enSau?.ten} · ko: ${koSau?.ten}`);

  const tenVi = [];
  for (const nn of ['vi', 'en', 'ko', 'fr']) tenVi.push((await dongNn(nn))?.ten_vi);
  ok('ten_vi luôn là tên tiếng Việt hiện tại ở mọi thứ tiếng',
     en?.ten_vi === 'Thăn bản dịch' && ko?.ten_vi === 'Thăn bản dịch' && tenVi.every(t => t === 'Thăn bản dịch mới'),
     `${en?.ten_vi} · ${ko?.ten_vi} · ${tenVi.join(' · ')}`);

  const { rows: [t] } = await db.query(`select
    (select provolatile from pg_proc where proname = 'chu_dich_con_hieu_luc') as v,
    chu_dich_con_hieu_luc('en', '{}'::jsonb, 'ten', null, 'x', 'y') as a,
    chu_dich_con_hieu_luc('en', '{}'::jsonb, 'ten', '', 'x', 'y') as b,
    chu_dich_con_hieu_luc('ko', '{}'::jsonb, 'ten', '   ', 'x', 'y') as c,
    chu_dich_con_hieu_luc('vi', '{}'::jsonb, 'ten', '[chờ]', 'x', 'y') as d`);
  ok('chu_dich_con_hieu_luc là hàm thuần (immutable); câu gốc rỗng / null → null',
     t.v === 'i' && t.a === null && t.b === null && t.c === null && t.d === null, JSON.stringify(t));
});

// ===========================================================================
await nhom('8 · CÔNG TẮC HIỆU LỰC — noi_dung_cong_khai().hien_mua_thit_ve', async () => {
  // Bản 0036 của noi_dung_cong_khai, dựng lại dưới tên khác để so mọi khóa còn lại.
  const s36 = readFileSync(join(MIG, '0036_tieng_han_va_ban_dich.sql'), 'utf8');
  const ham36 = s36.match(/create or replace function noi_dung_cong_khai\(p_ngon_ngu text default 'vi'\)[\s\S]*?\n\$\$;/)?.[0];
  if (!ham36) throw new Error('không tìm thấy noi_dung_cong_khai trong 0036');
  await db.exec(ham36.replace('function noi_dung_cong_khai(', 'function thu_noi_dung_cong_khai_0036('));
  for (const [khoa, gt] of [['dong_trang_thai', 'Đang thi công, sắp mở cửa.'], ['hotline', '0901234567'],
                            ['facebook_url', 'https://facebook.com/beeftown'], ['hien_thuc_don', true]]) {
    await congBoPhai(khoa, gt);
  }
  const soKhac = async () => {
    const lech = [];
    for (const nn of ['vi', 'en', 'ko']) {
      const { rows: [x] } = await db.query(`select noi_dung_cong_khai($1) as moi, thu_noi_dung_cong_khai_0036($1) as cu`, [nn]);
      const moi = { ...x.moi }, cu = { ...x.cu };
      delete moi.hien_mua_thit_ve; delete cu.hien_mua_thit_ve;
      if (JSON.stringify(moi) !== JSON.stringify(cu)) lech.push(nn);
    }
    return lech;
  };

  await thuHoi('hien_mua_thit_ve');
  const nd0 = await noiDung();
  const lech0 = await soKhac();
  await congBoPhai('hien_mua_thit_ve', false);
  const h1 = await hien();
  const lech1 = await soKhac();
  ok('hien_mua_thit_ve chưa công bố → null; công bố false → false',
     nd0 && 'hien_mua_thit_ve' in nd0 && nd0.hien_mua_thit_ve === null && h1 === false, `${nd0?.hien_mua_thit_ve} · ${h1}`);

  await congBoPhai('hien_mua_thit_ve', true);
  await thuHoi('zalo_oa_url');
  const h2 = await hien();
  await ghiKhop('nhóm 8: chưa có zalo_oa_url');
  await congBoPhai('zalo_oa_url', LINK_OA);
  ok('Công bố true, chưa có zalo_oa_url → false', h2 === false, String(h2));

  const { rows: daChot } = await db.query(`select id, gia_chot from ban_le_san_pham where gia_chot is not null`);
  await db.query(`update ban_le_san_pham set gia_chot = null`);
  let h3, m3;
  try {
    h3 = await hien();
    m3 = await menu();
    await ghiKhop('nhóm 8: chưa sản phẩm nào chốt giá');
  } finally {
    for (const x of daChot) await db.query(`update ban_le_san_pham set gia_chot = $2::jsonb where id = $1`, [x.id, JSON.stringify(x.gia_chot)]);
  }
  ok('Công bố true, có link Zalo, chưa sản phẩm nào chốt giá → false', h3 === false && m3.rows.length === 0 && daChot.length > 0,
     `${h3} · ${vi(m3)}`);

  const h4 = await hien();
  const lech4 = await soKhac();
  await ghiKhop('nhóm 8: đủ ba điều kiện');
  ok('Đủ ba điều kiện → true', h4 === true, String(h4));

  const sai = khop.filter(c => c.congTac && c.hien !== c.coDong);
  const tatSai = khop.filter(c => !c.congTac && c.hien === true);
  ok("KHỚP: ở mọi ca của nhóm 5, khi công tắc công bố true, hien_mua_thit_ve = (mua_thit_ve_cong_khai('vi', null) có ít nhất một dòng)",
     khop.length >= 12 && sai.length === 0 && tatSai.length === 0
     && khop.some(c => c.congTac && !c.coDong) && khop.some(c => c.congTac && c.coDong),
     `${khop.length} ca · lệch: ${JSON.stringify([...sai, ...tatSai])}`);
  const gon = s => s.replace(/\s+/g, ' ').trim();
  const dauLech = khop.filter(c => !c.dauKhop).map(c => c.ca);
  ok("Ở mọi ca của nhóm 5, mua_thit_ve_goi('vi', null, true) trả đúng dòng đầu của menu đầy đủ (rỗng khi menu rỗng)",
     khop.length >= 12 && dauLech.length === 0, dauLech.join(' · '));
  const { rows: [dn] } = await db.query(`select pg_get_functiondef('noi_dung_cong_khai(text)'::regprocedure) as d`);
  ok("noi_dung_cong_khai hỏi mua_thit_ve_goi('vi', null, true) — dừng ở gói đầu, không dựng cả menu cho mỗi trang công khai",
     gon(dn.d).includes("exists (select 1 from mua_thit_ve_goi('vi', null, true))")
     && !gon(dn.d).includes('mua_thit_ve_cong_khai('), gon(dn.d).slice(0, 300));

  ok('Mọi khóa khác của noi_dung_cong_khai giữ nguyên giá trị khi bật / tắt công tắc',
     lech0.length === 0 && lech1.length === 0 && lech4.length === 0 && (await noiDung())?.dong_trang_thai === 'Đang thi công, sắp mở cửa.',
     `lệch ở: ${[...lech0, ...lech1, ...lech4].join(', ')}`);

  const { rows: khoa } = await db.query(`select khoa from khoa_cong_bo`);
  const j = await noiDung();
  ok('Vẫn trả đủ mọi khóa của sổ đăng ký',
     j && Object.keys(j).length === khoa.length && khoa.every(k => k.khoa in j), `${Object.keys(j ?? {}).length}/${khoa.length}`);

  const khoi36 = s36.slice(s36.indexOf('create or replace function noi_dung_cong_khai'));
  const tu = khoi36.indexOf("select coalesce(jsonb_object_agg(k.khoa, v.gia_tri), '{}'::jsonb)");
  const den = khoi36.indexOf(') v on true', tu) + ') v on true'.length;
  const select36 = gon(khoi36.slice(tu, den));
  const dau = "select coalesce(jsonb_object_agg(k.khoa, v.gia_tri), '{}'::jsonb)";
  const s101 = gon(docTep(TEP_0101).replace(/--[^\n]*/g, ''));
  ok('Thân noi_dung_cong_khai trong 0101 chứa nguyên văn khối select của 0036',
     tu > 0 && select36.startsWith(dau) && s101.includes(`${dau} as d${select36.slice(dau.length)}`),
     select36.slice(0, 120));
  await db.exec(`drop function thu_noi_dung_cong_khai_0036(text)`);
});

// ===========================================================================
await nhom('9 · KHỚP VỚI WEB — la_link_zalo_oa() và laLinkZaloOa()', async () => {
  const tepWeb = join(WEB, 'lib', 'dich-dat-hang.ts');
  if (!existsSync(tepWeb)) {
    ok('la_link_zalo_oa() và laLinkZaloOa() (web/src/lib/dich-dat-hang.ts) cho cùng kết quả trên bảng mẫu MAU_LINK', false,
       'ĐỎ CHỜ NHÓM D BƯỚC 1: chưa có web/src/lib/dich-dat-hang.ts');
    return;
  }
  const { laLinkZaloOa, MAU_LINK_ZALO_OA } = await import(tepWeb);
  /** [link, nhận không]. Mẫu cuối: web trim, database không bao giờ gặp (0010:135 cấm dấu cách trong khóa url). */
  const MAU_LINK = [
    ['https://zalo.me/3030027075662095415', true],
    ['https://zalo.me/beeftown', true],
    ['https://zalo.me/beeftown/', true],
    ['https://zalo.me/Bee.town_oa-1', true],
    ['https://example.com/x', false],
    ['https://zalo.me/x?y=1', false],
    ['https://zalo.me/x#y', false],
    ['https://zalo.me/a/b', false],
    ['https://zalo.me.example.com/x', false],
    ['https://zalo.me/', false],
    ['https://zalo.me', false],
    ['http://zalo.me/x', false],
    ['javascript:alert(1)//https://zalo.me/x', false],
    ['HTTPS://ZALO.ME/x', false],
    ['https://zalo.me//x', false],
    ['https://zalo.me/x//', false],
    ['https://zalo.me/x y', false],
    ['', false],
  ];
  const lech = [];
  for (const [u, nhan] of MAU_LINK) {
    const { rows: [x] } = await db.query(`select la_link_zalo_oa($1) as k`, [u]);
    const web = laLinkZaloOa(u);
    if (x.k !== nhan || (web !== null) !== nhan || (nhan && web !== u)) lech.push(`${JSON.stringify(u)}: database ${x.k}, web ${web}`);
  }
  const { rows: [n] } = await db.query(`select la_link_zalo_oa(null) as k`);
  if (n.k !== false || laLinkZaloOa(null) !== null || laLinkZaloOa(undefined) !== null || laLinkZaloOa(42) !== null) {
    lech.push(`null: database ${n.k}, web ${laLinkZaloOa(null)}`);
  }
  const coCach = '  https://zalo.me/beeftown  ';
  const { rows: [c] } = await db.query(`select la_link_zalo_oa($1) as tho, la_link_zalo_oa(btrim($1)) as gon`, [coCach]);
  if (laLinkZaloOa(coCach) !== 'https://zalo.me/beeftown' || c.gon !== true || c.tho !== false) {
    lech.push(`dấu cách hai đầu: web ${laLinkZaloOa(coCach)}, database (đã trim) ${c.gon}`);
  }
  ok('la_link_zalo_oa() và laLinkZaloOa() (web/src/lib/dich-dat-hang.ts) cho cùng kết quả trên bảng mẫu MAU_LINK',
     MAU_LINK.length + 2 >= 14 && lech.length === 0, lech.join(' · '));

  const { rows: [p] } = await db.query(`select prosrc from pg_proc where proname = 'la_link_zalo_oa'`);
  const mauSql = p?.prosrc.match(/'(\^https:[^']*)'/)?.[1];
  ok('MAU_LINK_ZALO_OA của web trùng từng ký tự mẫu của la_link_zalo_oa()',
     !!mauSql && MAU_LINK_ZALO_OA instanceof RegExp && MAU_LINK_ZALO_OA.flags === ''
     && MAU_LINK_ZALO_OA.source.replace(/\\\//g, '/') === mauSql, `${MAU_LINK_ZALO_OA?.source} · ${mauSql}`);
});

// ===========================================================================
await nhom('10 · CÂU CHỮ VÀ KHÓA', async () => {
  const { rows: than } = await db.query(`select proname, prosrc from pg_proc where proname in ('mua_thit_ve_cong_khai', 'noi_dung_cong_khai')`);
  ok('Thân mua_thit_ve_cong_khai và noi_dung_cong_khai của 0101 không có câu raise nào',
     than.length === 2 && than.every(t => !/\braise\b/i.test(t.prosrc)), than.map(t => t.proname).join(', '));

  ok('Câu raise mới của trigger zalo_oa_url_kiem_tra có bản tiếng Anh (dichCau của cau-noi-bo.ts)',
     dichCau('en', CAU_ZALO) === CAU_ZALO_EN && docTep(TEP_0101).includes(`'${CAU_ZALO}'`), dichCau('en', CAU_ZALO));

  const { rows: dong } = await db.query(`select khoa, kieu::text, nhom, mo_ta, bat_buoc, chi_chu_so_huu, thu_tu
                                         from khoa_cong_bo where khoa = any($1) or khoa = 'zalo_oa_url'`,
                                        [KHOA_MOI.map(k => k[0])]);
  const cua = khoa => dong.find(d => d.khoa === khoa);
  const saiKhoa = KHOA_MOI.filter(([khoa, kieu, chiChu, thuTu]) => {
    const d = cua(khoa);
    return !d || d.kieu !== kieu || d.nhom !== 'mua_thit' || d.chi_chu_so_huu !== chiChu || d.bat_buoc !== false || d.thu_tu !== thuTu;
  }).map(k => `${k[0]}: ${JSON.stringify(cua(k[0]))}`);
  const { rows: [nhomMoi] } = await db.query(`select count(*)::int n from khoa_cong_bo where nhom = 'mua_thit'`);
  ok('Mười khóa mới có trong khoa_cong_bo, nhóm mua_thit, đúng kiểu, đúng chi_chu_so_huu, bat_buoc = false',
     saiKhoa.length === 0 && nhomMoi.n === 10, saiKhoa.join(' · '));

  const zalo = cua('zalo_oa_url');
  ok('zalo_oa_url: chi_chu_so_huu = true, mô tả mới nhắc https://zalo.me/',
     zalo?.chi_chu_so_huu === true && zalo.kieu === 'url' && zalo.nhom === 'lien_he' && zalo.mo_ta.includes('https://zalo.me/')
     && zalo.mo_ta.includes(LINK_OA), JSON.stringify(zalo));

  const tatCa = [...KHOA_MOI.map(k => k[0]), 'zalo_oa_url'];
  const thieuEn = tatCa.filter(k => typeof MO_TA_KHOA_EN[k] !== 'string' || /Official Zalo OA\.$/.test(MO_TA_KHOA_EN[k]));
  ok('Mỗi khóa mới và zalo_oa_url có mô tả tiếng Anh trong MO_TA_KHOA_EN (web/src/lib/cau-noi-bo.ts)',
     thieuEn.length === 0 && MO_TA_KHOA_EN.zalo_oa_url.includes('https://zalo.me/'), `thiếu: ${thieuEn.join(', ')}`);

  const congTac = docTep(join(WEB, 'lib', 'cong-tac.ts'));
  const khoiNhom = congTac.match(/\n {2}mua_thit: \{([\s\S]*?)\n {2}\},/)?.[1] ?? '';
  const ten = khoiNhom.match(/ten:\s*\{\s*vi:\s*'([^']+)',\s*en:\s*'([^']+)'\s*\}/);
  const dan = khoiNhom.match(/dan:\s*\{\s*vi:\s*'([^']+)',\s*en:\s*'([^']+)'\s*\}/);
  const trang = docTep(join(WEB, 'pages', 'noi-bo', 'noi-dung.astro'));
  const thuTuNhom = trang.match(/const thuTuNhom = \[([^\]]*)\]/)?.[1] ?? '';
  ok('Nhóm mua_thit có tên hai thứ tiếng trong NHOM (web/src/lib/cong-tac.ts) và có trong thuTuNhom của /noi-bo/noi-dung',
     ten?.[1] === 'Mua thịt về' && ten?.[2] === 'Take-home orders' && !!dan?.[1] && !!dan?.[2]
     && /Không ghi số tiền/.test(dan[1]) && /amounts of money/.test(dan[2]) && thuTuNhom.includes("'mua_thit'"),
     `ten: ${ten?.slice(1).join(' / ')} · thuTuNhom: ${thuTuNhom}`);

  const VAN_BAN = KHOA_MOI.filter(k => k[1] === 'van_ban').map(k => k[0]);
  const khongDan = VAN_BAN.filter(k => !cua(k)?.mo_ta.includes(KHONG_TIEN_VI) || !MO_TA_KHOA_EN[k]?.includes(KHONG_TIEN_EN));
  ok('Mô tả tám khóa văn bản nhóm mua_thit (vi và en) dặn không ghi số tiền', VAN_BAN.length === 8 && khongDan.length === 0,
     `thiếu câu dặn: ${khongDan.join(', ')}`);

  const hienMo = cua('hien_mua_thit_ve')?.mo_ta ?? '';
  ok('Mô tả hien_mua_thit_ve nêu ba điều kiện mở trang, giá đã chốt, FABi và ý kiến luật sư (vi và en)',
     ['zalo_oa_url', 'chốt giá', 'FABi', 'luật sư', 'ba điều kiện'].every(t => hienMo.includes(t))
     && ['zalo_oa_url', 'FABi', 'lawyer', 'all three'].every(t => (MO_TA_KHOA_EN.hien_mua_thit_ve ?? '').includes(t)), hienMo);

  const dinh = [];
  for (const k of tatCa) {
    for (const [nn, cau] of [['vi', cua(k)?.mo_ta ?? ''], ['en', MO_TA_KHOA_EN[k] ?? '']]) {
      const cam = timChuoiCam(cau);
      if (cam.length) dinh.push(`${k} (${nn}): ${JSON.stringify(cam)}`);
    }
  }
  ok('Mô tả mười khóa và zalo_oa_url (vi và en) không dính chữ cấm', dinh.length === 0, dinh.join(' · '));
});

// ===========================================================================
await nhom('11 · MIGRATION', async () => {
  const s99 = readFileSync(join(MIG, '0099_ban_le_menu.sql'), 'utf8');
  const s101 = docTep(TEP_0101);
  const khoi = s => s.slice(s.lastIndexOf('-- CHỐT QUYỀN'));
  const dong = (s, mau) => [...khoi(s).matchAll(mau)].map(m => m[0]);
  const MAU_GRANT = /execute 'grant execute on function [^']+ to anon';/g;
  const MAU_REVOKE_ANON = /execute 'revoke execute on all functions in schema public from (public|anon)';/g;
  const g99 = dong(s99, MAU_GRANT);
  const g100 = dong(s101, MAU_GRANT);
  const THEM = "execute 'grant execute on function mua_thit_ve_cong_khai(text,text) to anon';";
  const iMini = g100.findIndex(x => x.includes('mini_app_con_hang(text)'));
  ok('Khối CHỐT QUYỀN cuối 0101 có mọi dòng grant của khối cuối 0099, đúng thứ tự, và đúng một dòng thêm: mua_thit_ve_cong_khai(text,text)',
     s101.length > 0 && g99.length > 10 && g100.length === g99.length + 1 && g100.filter(x => x === THEM).length === 1
     && g100.filter(x => x !== THEM).join('\n') === g99.join('\n') && g100[iMini + 1] === THEM
     && dong(s101, MAU_REVOKE_ANON).join() === dong(s99, MAU_REVOKE_ANON).join() && dong(s99, MAU_REVOKE_ANON).length === 2,
     `0099: ${g99.length} dòng · 0101: ${g100.length} dòng`);

  const ma = s101.replace(/--[^\n]*/g, '');
  ok('0101 không có câu delete, không current_date (chạy được bằng SQL Editor; giờ Việt Nam qua hom_nay_vn)',
     s101.length > 0 && !/\bdelete\s+from\b/i.test(ma) && !/\bcurrent_date\b/i.test(ma));
});

// ===========================================================================
await nhom('12 · SỔ KHO', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('kho_doi_soat_ton() rỗng', rows.length === 0, JSON.stringify(rows.slice(0, 3)));
});

process.exit(ketThuc('MUA THỊT VỀ'));
