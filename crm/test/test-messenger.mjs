/**
 * BEEFTOWN CRM — Kiểm thử: bot Messenger đặt bàn, phần database (0052, 0053)
 * ==========================================================================
 *
 *     node test/test-messenger.mjs
 *
 * Dựng database bằng khung của test-kho-*.mjs (kho-chung.mjs): quyền của
 * authenticated đúng là quyền trên Supabase thật, nên một hàm nội bộ lỡ để lọt
 * sẽ lộ ra ở đây. Thêm tài khoản máy may_messenger (và may_zalo, may_ipos để
 * so sánh).
 *
 * Kiểm: quyền từng RPC (máy chỉ gọi RPC máy, người không gọi RPC máy, không
 * phiên cũng bị từ chối); vai máy không đọc / ghi bảng CRM, không có việc kho;
 * anon không gọi được mess_*, danh sách hàm của anon không đổi; chỉ lưu PSID đã
 * băm; phiên (giữ nguyên khi null, tạm dừng, bỏ tạm dừng); khóa tra cứu sai
 * (≥ 5 lần / 15 phút); dọn phiên > 30 ngày; thống kê theo ngày, danh sách loại
 * sự kiện; câu lỗi không lộ token / SĐT / PSID; cài đặt của chủ; tổng quan.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIG = join(__dirname, '..', 'supabase', 'migrations');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — BOT MESSENGER ĐẶT BÀN (0052, 0053)');
const { db, cnA, duoiAnon } = await dungDatabase();

// ---------------------------------------------------------------------------
// Người mà khung dùng chung chưa có
// ---------------------------------------------------------------------------
const UID_MAY_MESS = '00000000-0000-4000-8000-0000000000f1';
const UID_MAY_ZALO = '00000000-0000-4000-8000-0000000000f2';
const UID_MAY_IPOS = '00000000-0000-4000-8000-0000000000f3';
const UID_LA       = '00000000-0000-4000-8000-0000000000f4';   // đăng nhập được, không có dòng nhan_su
const UID_MAY_NGHI = '00000000-0000-4000-8000-0000000000f5';   // máy Messenger đã tắt (dang_lam = false)

for (const [uid, ten, vai, dangLam] of [
  [UID_MAY_MESS, 'Máy Messenger', 'may_messenger', true],
  [UID_MAY_ZALO, 'Máy Zalo', 'may_zalo', true],
  [UID_MAY_IPOS, 'Máy iPOS', 'may_ipos', true],
  [UID_MAY_NGHI, 'Máy Messenger cũ', 'may_messenger', false],
]) {
  await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam) values ($1, $2, $3, $4, $5)`,
                 [uid, cnA.id, ten, vai, dangLam]);
}
await db.query(`insert into cau_hinh_tich_diem (chi_nhanh_id, dang_bat) values ($1, true)`, [cnA.id]);
for (let i = 1; i <= 6; i++) {
  await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1, $2, 4)`, [cnA.id, `B0${i}`]);
}

/** Như duoi() của kho-chung.mjs, trả kèm SQLSTATE. */
async function duoi(uid, sql, params = []) {
  await db.query(`delete from auth._phien`);
  if (uid) await db.query(`insert into auth._phien (uid) values ($1)`, [uid]);
  await db.exec(`set role authenticated`);
  try { return { rows: (await db.query(sql, params)).rows, loi: null, ma: null }; }
  catch (e) { return { rows: null, loi: e.message, ma: e.code ?? null }; }
  finally {
    await db.exec(`reset role`);
    await db.query(`delete from auth._phien`);
  }
}
/** Gọi một RPC trả jsonb, lấy thẳng giá trị. */
async function rpc(uid, sql, params = []) {
  const r = await duoi(uid, `select ${sql} as kq`, params);
  return { ...r, kq: r.rows?.[0]?.kq ?? null };
}
const may = (sql, p = []) => rpc(UID_MAY_MESS, sql, p);
const tuChoi = r => r.loi !== null && r.ma === '42501';
const saiDuLieu = r => r.loi !== null && r.ma === '23514';
const vi = r => (r.loi ? `${r.ma}: ${r.loi}` : `CHẠY ĐƯỢC ${JSON.stringify(r.kq ?? r.rows)?.slice(0, 200)}`);
const q = async (sql, p = []) => (await db.query(sql, p)).rows;
const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];

/** psid_bam như web tính: 64 hex thường. (Web dùng HMAC; ở đây chỉ cần đúng dạng.) */
const bam = s => createHash('sha256').update('mess:' + s).digest('hex');
const P1 = bam('khach-1'), P2 = bam('khach-2'), P3 = bam('khach-3'), P4 = bam('khach-4');
const PSID_THO = '24681357902468135';   // PSID thật của Meta là chuỗi số ~16–17 chữ số

const demHomNay = async loai => (await mot(
  `select coalesce((select dem from mess_thong_ke_ngay where ngay = hom_nay_vn() and loai = $1), 0)::int as n`, [loai])).n;

const GOI_DUOC = ['mess_lay_phien', 'mess_luu_phien', 'mess_ghi_tra_cuu', 'mess_xin_dat_ban', 'mess_ghi_su_kien',
                  'mess_doc_cau_hinh', 'mess_luu_cau_hinh', 'mess_tong_quan'].sort();
const NOI_BO = ['mess_loai_su_kien', 'mess_kiem_psid', 'mess_dem', 'mess_don_phien', 'mess_sach_loi',
                'mess_phien_json', 'mess_cau_hinh_json'].sort();

// ===========================================================================
await nhom('0 · TIỀN ĐỀ — enum, file riêng, chữ ký, quyền gọi hàm, khóa bảng', async () => {
  const vai = (await q(`select unnest(enum_range(null::vai_tro))::text as v`)).map(r => r.v);
  ok('0052: vai_tro có may_messenger', vai.includes('may_messenger'));
  const f51 = readFileSync(join(MIG, '0052_messenger_vai_may.sql'), 'utf8').replace(/--[^\n]*/g, '').trim();
  ok('0052 chỉ có đúng một lệnh thêm enum (chạy riêng, trước 0053)',
     f51 === `alter type vai_tro add value if not exists 'may_messenger';`, f51.slice(0, 200));

  for (const ham of ['tao_dat_ban', 'tra_cuu_dat_ban', 'huy_dat_ban', 'ghi_nhat_ky_tra_cuu', 'lich_trong_theo_ma',
                     'chan_vai_ngoai_crm', 'la_nhan_su_ngoai_crm', 'duoc_truy_cap_chi_nhanh', 'co_vai_tro',
                     'kho_vai_duoc', 'tim_hoac_tao_khach']) {
    const { n } = await mot(`select count(*)::int as n from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                              where s.nspname = 'public' and p.proname = $1`, [ham]);
    ok(`${ham}() vẫn chỉ có MỘT bản (không đẻ overload)`, n === 1, `${n} bản`);
  }
  const f52 = readFileSync(join(MIG, '0053_messenger_bot.sql'), 'utf8');
  ok('0053 không thay thân hàm có sẵn nào (chỉ tạo hàm mess_*)',
     [...f52.matchAll(/create\s+or\s+replace\s+function\s+(\w+)/gi)].every(m => m[1].startsWith('mess_')));

  const ds = await q(`select p.proname, has_function_privilege('authenticated', p.oid, 'execute') as goi,
                             has_function_privilege('anon', p.oid, 'execute') as anon, p.prosecdef as dinh,
                             array_to_string(p.proconfig, ',') as cfg
                      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                      where n.nspname = 'public' and p.proname like 'mess\\_%' order by 1`);
  const goi = ds.filter(r => r.goi).map(r => r.proname).sort();
  const khong = ds.filter(r => !r.goi).map(r => r.proname).sort();
  ok('authenticated gọi được ĐÚNG danh sách RPC mess_ đã duyệt', goi.join() === GOI_DUOC.join(),
     `thừa: ${goi.filter(x => !GOI_DUOC.includes(x))} · thiếu: ${GOI_DUOC.filter(x => !goi.includes(x))}`);
  ok('Hàm nội bộ mess_ đều đã rút khỏi authenticated', khong.join() === NOI_BO.join(), khong.join());
  ok('anon không gọi được hàm mess_ nào', ds.every(r => !r.anon), ds.filter(r => r.anon).map(r => r.proname).join());
  ok('Mọi RPC mess_ là SECURITY DEFINER', ds.filter(r => GOI_DUOC.includes(r.proname)).every(r => r.dinh));
  ok('Mọi hàm mess_ có search_path = public', ds.every(r => r.cfg === 'search_path=public'),
     ds.filter(r => r.cfg !== 'search_path=public').map(r => r.proname).join());

  const noiBo = await duoi(UID.chu, `select mess_dem('dat_ban')`);
  ok('Chủ gọi thẳng hàm nội bộ mess_dem → permission denied', /permission denied/i.test(noiBo.loi ?? ''), vi(noiBo));
  const noiBo2 = await duoi(UID_MAY_MESS, `select mess_don_phien()`);
  ok('Máy gọi thẳng hàm nội bộ mess_don_phien → permission denied', /permission denied/i.test(noiBo2.loi ?? ''), vi(noiBo2));

  for (const b of ['mess_phien', 'mess_cau_hinh', 'mess_thong_ke_ngay']) {
    const r = await mot(`select c.relrowsecurity as rls,
                                (select count(*)::int from pg_policies p where p.tablename = c.relname) as pol,
                                has_table_privilege('anon', c.oid, 'select') or has_table_privilege('anon', c.oid, 'insert')
                                  or has_table_privilege('anon', c.oid, 'update') or has_table_privilege('anon', c.oid, 'delete') as anon,
                                has_table_privilege('authenticated', c.oid, 'select') or has_table_privilege('authenticated', c.oid, 'insert')
                                  or has_table_privilege('authenticated', c.oid, 'update') or has_table_privilege('authenticated', c.oid, 'delete') as auth
                         from pg_class c where c.relname = $1`, [b]);
    ok(`${b}: RLS bật, không policy, anon và authenticated không có quyền bảng nào`,
       r.rls === true && r.pol === 0 && r.anon === false && r.auth === false, JSON.stringify(r));
  }

  // KHÔNG lưu PSID thô, KHÔNG lưu nội dung tin nhắn: đúng các cột này, không hơn.
  const cot = (await q(`select column_name from information_schema.columns where table_name = 'mess_phien' order by ordinal_position`))
    .map(r => r.column_name).join();
  ok('mess_phien chỉ có psid_bam, buoc, du_lieu, tam_dung_den, tra_cuu_sai, sai_tu, cap_nhat + bộ đếm gửi đặt bàn',
     cot === 'psid_bam,buoc,du_lieu,tam_dung_den,tra_cuu_sai,sai_tu,cap_nhat,dat_ban_ngay,dat_ban_dem,dat_ban_luc', cot);
  const cotTk = (await q(`select column_name from information_schema.columns where table_name = 'mess_thong_ke_ngay' order by ordinal_position`))
    .map(r => r.column_name).join();
  ok('mess_thong_ke_ngay chỉ đếm (ngay, loai, dem)', cotTk === 'ngay,loai,dem', cotTk);
  const cfg = await mot(`select dang_bat, phut_tam_dung, loi_chao from mess_cau_hinh where id = 1`);
  ok('mess_cau_hinh có đúng một dòng, bot mặc định TẮT, tạm dừng mặc định 60 phút',
     cfg?.dang_bat === false && cfg.phut_tam_dung === 60 && cfg.loi_chao.length > 0, JSON.stringify(cfg));
  const hai = await db.query(`insert into mess_cau_hinh (id) values (2)`).then(() => null, e => e.message);
  ok('mess_cau_hinh không có dòng thứ hai', hai !== null);
  const tho = await db.query(`insert into mess_phien (psid_bam) values ($1)`, [PSID_THO]).then(() => null, e => e.message);
  ok('CHECK: chèn PSID thô vào mess_phien bị từ chối (kể cả superuser)', tho !== null);
});

// ===========================================================================
await nhom('1 · PHIÊN — lấy, lưu, giữ nguyên khi null, tạm dừng', async () => {
  const tinTruoc = await demHomNay('tin_nhan');
  const moiTruoc = await demHomNay('hoi_thoai_moi');
  const r = await may(`mess_lay_phien($1)`, [P1]);
  ok('Khách mới: phien null, bot đang tắt, có lời chào, 60 phút',
     r.loi === null && r.kq.phien === null && r.kq.dang_bat === false && typeof r.kq.loi_chao === 'string'
     && r.kq.phut_tam_dung === 60, vi(r));
  ok('mess_lay_phien KHÔNG tạo phiên', (await mot(`select count(*)::int as n from mess_phien where psid_bam = $1`, [P1])).n === 0);
  ok('Đếm 1 tin nhận + 1 hội thoại mới', await demHomNay('tin_nhan') === tinTruoc + 1
     && await demHomNay('hoi_thoai_moi') === moiTruoc + 1);
  const { lan } = await mot(`select lan_nhan_cuoi > now() - interval '1 minute' as lan from mess_cau_hinh`);
  ok('lan_nhan_cuoi vừa cập nhật', lan === true);

  const l1 = await may(`mess_luu_phien($1, 'dat_ban_ngay', '{"ngay":"2026-10-01"}'::jsonb)`, [P1]);
  ok('Lưu phiên lần đầu: tạo, trả bước + dữ liệu, chưa tạm dừng',
     l1.kq?.ok === true && l1.kq.buoc === 'dat_ban_ngay' && l1.kq.du_lieu.ngay === '2026-10-01'
     && l1.kq.dang_tam_dung === false && l1.kq.tam_dung_den === null, vi(l1));
  const r2 = await may(`mess_lay_phien($1)`, [P1]);
  ok('Lấy lại: đúng bước, đúng dữ liệu, không khóa',
     r2.kq?.phien?.buoc === 'dat_ban_ngay' && r2.kq.phien.du_lieu.ngay === '2026-10-01'
     && r2.kq.phien.bi_khoa === false && r2.kq.phien.tra_cuu_sai === 0 && r2.kq.phien.khoa_den === null, vi(r2));
  ok('Khách cũ: không đếm hội thoại mới lần nữa', await demHomNay('hoi_thoai_moi') === moiTruoc + 1);

  const l2 = await may(`mess_luu_phien($1, null, '{"ngay":"2026-10-01","gio":"18:30"}'::jsonb)`, [P1]);
  ok('p_buoc null → giữ bước cũ', l2.kq?.buoc === 'dat_ban_ngay' && l2.kq.du_lieu.gio === '18:30', vi(l2));
  const l3 = await may(`mess_luu_phien($1, 'dat_ban_so_khach')`, [P1]);
  ok('p_du_lieu null → giữ dữ liệu cũ', l3.kq?.buoc === 'dat_ban_so_khach' && l3.kq.du_lieu.gio === '18:30', vi(l3));

  const td = await may(`mess_luu_phien($1, null, null, 60)`, [P1]);
  const phut = td.kq?.tam_dung_den ? (Date.parse(td.kq.tam_dung_den) - Date.now()) / 60000 : null;
  ok('Tạm dừng 60 phút: bước và dữ liệu giữ nguyên, dang_tam_dung',
     td.kq?.dang_tam_dung === true && phut > 58 && phut <= 61 && td.kq.buoc === 'dat_ban_so_khach'
     && td.kq.du_lieu.gio === '18:30', vi(td));
  const td2 = await may(`mess_lay_phien($1)`, [P1]);
  ok('mess_lay_phien thấy đang tạm dừng', td2.kq?.phien?.dang_tam_dung === true, vi(td2));
  const bo = await may(`mess_luu_phien($1, 'menu', '{}'::jsonb, 0)`, [P1]);
  ok('p_tam_dung_phut = 0 → bỏ tạm dừng; {} → xóa dữ liệu hỏi dở',
     bo.kq?.dang_tam_dung === false && bo.kq.tam_dung_den === null && bo.kq.buoc === 'menu'
     && JSON.stringify(bo.kq.du_lieu) === '{}', vi(bo));

  const chiTamDung = await may(`mess_luu_phien($1, null, null, 30)`, [P2]);
  ok('Echo nhân viên cho khách chưa có phiên → tạo phiên "menu" đang tạm dừng',
     chiTamDung.kq?.buoc === 'menu' && chiTamDung.kq.dang_tam_dung === true, vi(chiTamDung));

  // Dữ liệu sai dạng → 23514
  const SAI = [
    ['PSID thô', `mess_lay_phien($1)`, [PSID_THO]],
    ['hex HOA', `mess_lay_phien($1)`, [P1.toUpperCase()]],
    ['63 ký tự', `mess_lay_phien($1)`, [P1.slice(1)]],
    ['null', `mess_lay_phien(null)`, []],
    ['PSID thô khi lưu', `mess_luu_phien($1, 'menu')`, [PSID_THO]],
    ['PSID thô khi ghi tra cứu', `mess_ghi_tra_cuu($1, false)`, [PSID_THO]],
    ['bước có chữ hoa', `mess_luu_phien($1, 'DatBan')`, [P1]],
    ['bước có dấu cách', `mess_luu_phien($1, 'dat ban')`, [P1]],
    ['bước 41 ký tự', `mess_luu_phien($1, $2)`, [P1, 'a'.repeat(41)]],
    ['dữ liệu là mảng', `mess_luu_phien($1, null, '[1,2]'::jsonb)`, [P1]],
    ['dữ liệu quá 4000 byte', `mess_luu_phien($1, null, jsonb_build_object('x', repeat('a', 4100)))`, [P1]],
    ['tạm dừng âm', `mess_luu_phien($1, null, null, -1)`, [P1]],
    ['tạm dừng 1441 phút', `mess_luu_phien($1, null, null, 1441)`, [P1]],
    ['kết quả tra cứu null', `mess_ghi_tra_cuu($1, null)`, [P1]],
  ];
  const lot = [];
  for (const [ten, sql, p] of SAI) {
    const x = await may(sql, p);
    if (!saiDuLieu(x)) lot.push(`${ten}: ${vi(x)}`);
  }
  ok(`${SAI.length} kiểu dữ liệu sai đều bị từ chối bằng 23514`, lot.length === 0, lot.join(' | '));
  const soTho = await mot(`select count(*)::int as n from mess_phien where psid_bam !~ '^[0-9a-f]{64}$'`);
  ok('Không dòng nào của mess_phien có khóa khác dạng băm', soTho.n === 0);
});

// ===========================================================================
await nhom('2 · KHÓA TRA CỨU SAI — ≥ 5 lần trong 15 phút', async () => {
  const khoaTruoc = await demHomNay('bi_khoa');
  const traTruoc = await demHomNay('tra_cuu');
  let kq;
  for (let i = 1; i <= 4; i++) kq = (await may(`mess_ghi_tra_cuu($1, false)`, [P3])).kq;
  ok('4 lần sai: chưa khóa', kq?.bi_khoa === false && kq.tra_cuu_sai === 4 && kq.khoa_den === null, JSON.stringify(kq));
  const dung = (await may(`mess_ghi_tra_cuu($1, true)`, [P3])).kq;
  ok('Tra đúng KHÔNG xóa bộ đếm sai', dung?.bi_khoa === false && dung.tra_cuu_sai === 4, JSON.stringify(dung));
  kq = (await may(`mess_ghi_tra_cuu($1, false)`, [P3])).kq;
  const phut = kq?.khoa_den ? (Date.parse(kq.khoa_den) - Date.now()) / 60000 : null;
  ok('Lần sai thứ 5: bi_khoa, khóa tới ~15 phút sau', kq?.bi_khoa === true && kq.tra_cuu_sai === 5
     && phut > 14 && phut <= 15.1, JSON.stringify(kq));
  ok('Đếm bi_khoa đúng một lần', await demHomNay('bi_khoa') === khoaTruoc + 1);
  ok('Đếm tra_cuu mỗi lần gọi (6)', await demHomNay('tra_cuu') === traTruoc + 6);

  const dang = (await may(`mess_ghi_tra_cuu($1, true)`, [P3])).kq;
  ok('Đang khóa, tra đúng vẫn khóa', dang?.bi_khoa === true, JSON.stringify(dang));
  const lay = (await may(`mess_lay_phien($1)`, [P3])).kq;
  ok('mess_lay_phien báo bi_khoa + khoa_den', lay?.phien?.bi_khoa === true && lay.phien.khoa_den !== null, JSON.stringify(lay));
  await may(`mess_luu_phien($1, 'menu', '{}'::jsonb, 0)`, [P3]);
  const sauLuu = (await may(`mess_lay_phien($1)`, [P3])).kq;
  ok('mess_luu_phien KHÔNG rửa được khóa', sauLuu?.phien?.bi_khoa === true && sauLuu.phien.tra_cuu_sai === 5, JSON.stringify(sauLuu));
  const sai6 = (await may(`mess_ghi_tra_cuu($1, false)`, [P3])).kq;
  ok('Sai thêm khi đang khóa: vẫn khóa, không đếm bi_khoa lần nữa',
     sai6?.bi_khoa === true && sai6.tra_cuu_sai === 6 && await demHomNay('bi_khoa') === khoaTruoc + 1, JSON.stringify(sai6));

  // Hết 15 phút kể từ lần sai gần nhất → mở.
  await db.query(`update mess_phien set sai_tu = now() - interval '16 minutes' where psid_bam = $1`, [P3]);
  const mo = (await may(`mess_lay_phien($1)`, [P3])).kq;
  ok('Sau 15 phút: mess_lay_phien không còn khóa', mo?.phien?.bi_khoa === false && mo.phien.khoa_den === null, JSON.stringify(mo));
  const moi = (await may(`mess_ghi_tra_cuu($1, false)`, [P3])).kq;
  ok('Lần sai kế tiếp: bộ đếm tính lại từ 1', moi?.bi_khoa === false && moi.tra_cuu_sai === 1, JSON.stringify(moi));

  // 4 lần sai rồi quá 15 phút → cửa sổ cũ bỏ, lần sai sau là 1.
  for (let i = 0; i < 3; i++) await may(`mess_ghi_tra_cuu($1, false)`, [P3]);
  await db.query(`update mess_phien set sai_tu = now() - interval '15 minutes 1 second' where psid_bam = $1`, [P3]);
  const cu = (await may(`mess_ghi_tra_cuu($1, false)`, [P3])).kq;
  ok('4 lần sai cách nhau > 15 phút với lần thứ 5 → không khóa', cu?.bi_khoa === false && cu.tra_cuu_sai === 1, JSON.stringify(cu));

  const khac = (await may(`mess_ghi_tra_cuu($1, false)`, [P4])).kq;
  ok('Khóa theo từng khách: khách khác không bị ảnh hưởng, phiên được tạo', khac?.bi_khoa === false && khac.tra_cuu_sai === 1,
     JSON.stringify(khac));
});

// ===========================================================================
await nhom('2b · CHỐT GỬI ĐẶT BÀN — chặn gửi trùng 5 giây, tối đa 5 lần / khách / ngày', async () => {
  const P5 = bam('khach-5'), P6 = bam('khach-6');
  const x1 = (await may(`mess_xin_dat_ban($1)`, [P5])).kq;
  ok('Lần đầu: được gửi, còn 4 lượt; tạo phiên', x1?.ok === true && x1.con_lai === 4
     && (await mot(`select count(*)::int as n from mess_phien where psid_bam = $1`, [P5])).n === 1, JSON.stringify(x1));
  const x2 = (await may(`mess_xin_dat_ban($1)`, [P5])).kq;
  ok('Gọi lại ngay (Meta giao lặp / bấm hai lần) → dang_gui, KHÔNG đếm lượt', x2?.ok === false && x2.ly_do === 'dang_gui'
     && (await mot(`select dat_ban_dem as n from mess_phien where psid_bam = $1`, [P5])).n === 1, JSON.stringify(x2));
  const lan = [];
  for (let i = 0; i < 5; i++) {
    await db.query(`update mess_phien set dat_ban_luc = now() - interval '11 seconds' where psid_bam = $1`, [P5]);
    lan.push((await may(`mess_xin_dat_ban($1)`, [P5])).kq);
  }
  ok('Cách nhau > 5 giây: lượt 2–5 được, lượt 6 trong cùng ngày → qua_luot',
     lan.slice(0, 4).every(k => k?.ok === true) && lan[3].con_lai === 0 && lan[4]?.ok === false && lan[4].ly_do === 'qua_luot', JSON.stringify(lan));
  const khac = (await may(`mess_xin_dat_ban($1)`, [P6])).kq;
  ok('Khách khác không bị ảnh hưởng', khac?.ok === true && khac.con_lai === 4, JSON.stringify(khac));
  await db.query(`update mess_phien set dat_ban_ngay = hom_nay_vn() - 1, dat_ban_luc = now() - interval '1 day' where psid_bam = $1`, [P5]);
  const homSau = (await may(`mess_xin_dat_ban($1)`, [P5])).kq;
  ok('Sang ngày VN mới → đếm lại từ đầu', homSau?.ok === true && homSau.con_lai === 4, JSON.stringify(homSau));
  await may(`mess_luu_phien($1, 'menu', '{}'::jsonb, 0)`, [P5]);
  ok('mess_luu_phien KHÔNG rửa được bộ đếm gửi đặt bàn',
     (await mot(`select dat_ban_dem as n from mess_phien where psid_bam = $1`, [P5])).n === 1);
  const saiDang = await may(`mess_xin_dat_ban($1)`, [PSID_THO]);
  ok('PSID thô → 23514', saiDuLieu(saiDang), vi(saiDang));
});

// ===========================================================================
await nhom('3 · DỌN PHIÊN QUÁ 30 NGÀY', async () => {
  const CU = bam('cu-31-ngay'), VUA = bam('cu-29-ngay'), CU2 = bam('cu-40-ngay');
  await db.query(`insert into mess_phien (psid_bam, buoc, du_lieu, cap_nhat) values
                  ($1, 'dat_ban_sdt', '{"sdt":"0901234567"}', now() - interval '31 days'),
                  ($2, 'menu', '{}', now() - interval '29 days'),
                  ($3, 'menu', '{}', now() - interval '40 days')`, [CU, VUA, CU2]);
  await may(`mess_lay_phien($1)`, [P1]);
  const con = (await q(`select psid_bam from mess_phien where psid_bam = any($1)`, [[CU, VUA, CU2]])).map(r => r.psid_bam);
  ok('mess_lay_phien dọn phiên > 30 ngày, giữ phiên 29 ngày', con.length === 1 && con[0] === VUA, con.join());
  const moiTruoc = await demHomNay('hoi_thoai_moi');
  const lai = (await may(`mess_lay_phien($1)`, [CU])).kq;
  ok('Khách cũ quay lại sau 30 ngày: như khách mới (phien null, đếm hội thoại mới)',
     lai?.phien === null && await demHomNay('hoi_thoai_moi') === moiTruoc + 1, JSON.stringify(lai));

  await db.query(`insert into mess_phien (psid_bam, cap_nhat) values ($1, now() - interval '31 days')`, [CU2]);
  await may(`mess_luu_phien($1, 'menu')`, [P1]);
  ok('mess_luu_phien cũng dọn', (await mot(`select count(*)::int as n from mess_phien where psid_bam = $1`, [CU2])).n === 0);
  await db.query(`insert into mess_phien (psid_bam, cap_nhat) values ($1, now() - interval '31 days')`, [CU2]);
  await may(`mess_ghi_tra_cuu($1, true)`, [P1]);
  ok('mess_ghi_tra_cuu cũng dọn', (await mot(`select count(*)::int as n from mess_phien where psid_bam = $1`, [CU2])).n === 0);
});

// ===========================================================================
await nhom('4 · THỐNG KÊ SỰ KIỆN, CÂU LỖI KHÔNG LỘ BÍ MẬT', async () => {
  const LOAI = ['dat_ban', 'dat_ban_that_bai', 'huy_dat_ban', 'hoi_dap', 'gap_nhan_vien', 'nhan_vien_tra_loi', 'loi'];
  const lot = [];
  for (const l of LOAI) {
    const truoc = await demHomNay(l);
    const r = await may(`mess_ghi_su_kien($1)`, [l]);
    if (r.loi || r.kq.ok !== true || r.kq.loai !== l || r.kq.dem !== truoc + 1 || await demHomNay(l) !== truoc + 1
        || !/^\d{4}-\d{2}-\d{2}$/.test(r.kq.ngay)) lot.push(`${l}: ${vi(r)}`);
  }
  ok(`${LOAI.length} loại sự kiện web ghi được, mỗi lần +1`, lot.length === 0, lot.join(' | '));
  const { ngay } = await mot(`select to_char(hom_nay_vn(), 'YYYY-MM-DD') as ngay`);
  const r1 = await may(`mess_ghi_su_kien('dat_ban')`);
  ok('Ngày thống kê là ngày giờ VN', r1.kq?.ngay === ngay, vi(r1));

  const lot2 = [];
  for (const l of ['tin_nhan', 'hoi_thoai_moi', 'tra_cuu', 'bi_khoa', 'xyz', '', 'DAT_BAN']) {
    const r = await may(`mess_ghi_su_kien($1)`, [l]);
    if (!saiDuLieu(r)) lot2.push(`${l}: ${vi(r)}`);
  }
  const rNull = await may(`mess_ghi_su_kien(null)`);
  if (!saiDuLieu(rNull)) lot2.push(`null: ${vi(rNull)}`);
  ok('Loại ngoài danh sách (kể cả loại RPC khác tự đếm) → 23514', lot2.length === 0, lot2.join(' | '));

  // Tên tham số ghép chuỗi: test-kho-ipos-web quét mọi file tìm "access_token=<chuỗi dài>".
  const LOI = 'Send API 400: ' + 'access_' + 'token=EAAGm0PX4ZCpsBAKZCZBabc123def456 psid 24681357902468135 '
            + 'sdt 0901234567 / +84 901 234 567 "appsecret_proof":"abcd" bam ' + P1 + ' ' + 'x'.repeat(600);
  await may(`mess_ghi_su_kien('loi', $1)`, [LOI]);
  const { loi_cuoi: lc, gan } = await mot(`select loi_cuoi, loi_cuoi_luc > now() - interval '1 minute' as gan from mess_cau_hinh`);
  ok('loi_cuoi được lưu, có mốc giờ', typeof lc === 'string' && lc.startsWith('Send API 400') && gan === true, lc);
  ok('loi_cuoi không còn token, PSID thô, SĐT, psid_bam; ≤ 500 ký tự',
     !/EAAGm0|abc123|24681357902468135|0901234567|901 234 567|"abcd"/.test(lc) && !lc.includes(P1) && lc.length <= 500, lc.slice(0, 200));
  await may(`mess_ghi_su_kien('gap_nhan_vien', '   ')`);
  ok('p_loi rỗng không xóa loi_cuoi cũ', (await mot(`select loi_cuoi from mess_cau_hinh`)).loi_cuoi === lc);

  const cot = await mot(`select count(*)::int as n from mess_thong_ke_ngay where loai not in (select unnest(mess_loai_su_kien()))`);
  ok('Mọi dòng thống kê thuộc danh sách loại', cot.n === 0);
  const ngoai = await db.query(`insert into mess_thong_ke_ngay (ngay, loai, dem) values (current_date, 'bia', 1)`)
    .then(() => null, e => e.message);
  ok('CHECK: bảng thống kê không nhận loại lạ (kể cả superuser)', ngoai !== null);
});

// ===========================================================================
await nhom('5 · CÀI ĐẶT CỦA CHỦ, TỔNG QUAN CỦA CHỦ / QUẢN LÝ', async () => {
  const doc = await rpc(UID.chu, `mess_doc_cau_hinh()`);
  ok('Chủ đọc cấu hình: đủ khóa', doc.loi === null
     && ['dang_bat', 'loi_chao', 'phut_tam_dung', 'lan_nhan_cuoi', 'loi_cuoi', 'loi_cuoi_luc', 'cap_nhat']
          .every(k => k in doc.kq), vi(doc));

  const bat = await rpc(UID.chu, `mess_luu_cau_hinh(true, '  Chào anh chị!  ', 90)`);
  ok('Chủ bật bot, đổi lời chào (cắt khoảng trắng), đổi phút tạm dừng',
     bat.kq?.dang_bat === true && bat.kq.loi_chao === 'Chào anh chị!' && bat.kq.phut_tam_dung === 90, vi(bat));
  const giu = await rpc(UID.chu, `mess_luu_cau_hinh(p_phut_tam_dung => 45)`);
  ok('Tham số null = giữ nguyên', giu.kq?.dang_bat === true && giu.kq.loi_chao === 'Chào anh chị!' && giu.kq.phut_tam_dung === 45, vi(giu));
  const lay = (await may(`mess_lay_phien($1)`, [P1])).kq;
  ok('Máy thấy bot bật, lời chào và phút tạm dừng mới', lay?.dang_bat === true && lay.loi_chao === 'Chào anh chị!'
     && lay.phut_tam_dung === 45, JSON.stringify(lay));

  const SAI = [
    ['lời chào rỗng', `mess_luu_cau_hinh(p_loi_chao => '   ')`],
    ['lời chào 301 ký tự', `mess_luu_cau_hinh(p_loi_chao => repeat('a', 301))`],
    ['phút tạm dừng 4', `mess_luu_cau_hinh(p_phut_tam_dung => 4)`],
    ['phút tạm dừng 1441', `mess_luu_cau_hinh(p_phut_tam_dung => 1441)`],
  ];
  const lot = [];
  for (const [ten, sql] of SAI) {
    const r = await rpc(UID.chu, sql);
    if (!saiDuLieu(r)) lot.push(`${ten}: ${vi(r)}`);
  }
  ok('Cài đặt sai → 23514', lot.length === 0, lot.join(' | '));
  const van = await rpc(UID.chu, `mess_doc_cau_hinh()`);
  ok('…và cấu hình không đổi', van.kq?.phut_tam_dung === 45 && van.kq.loi_chao === 'Chào anh chị!', vi(van));

  for (const [ai, uid] of [['Quản lý', UID.qlA], ['Marketing', UID.mktA], ['Thu ngân', UID.thuNganA], ['Thủ kho', UID.thuKhoA]]) {
    const d = await rpc(uid, `mess_doc_cau_hinh()`);
    const l = await rpc(uid, `mess_luu_cau_hinh(false)`);
    ok(`${ai} KHÔNG đọc / sửa được cài đặt bot`, tuChoi(d) && tuChoi(l), `${vi(d)} · ${vi(l)}`);
  }

  for (const [ai, uid] of [['Chủ', UID.chu], ['Quản lý Q1', UID.qlA], ['Quản lý Q7', UID.qlB]]) {
    const t = await rpc(uid, `mess_tong_quan()`);
    ok(`${ai} xem được tổng quan`, t.loi === null && t.kq?.ngay?.length === 7, vi(t));
  }
  const t = (await rpc(UID.chu, `mess_tong_quan()`)).kq;
  const LOAI = (await mot(`select mess_loai_su_kien() as l`)).l;
  ok('Tổng quan: danh sách loại đủ 11, khớp mess_loai_su_kien()', t.loai.length === 11 && t.loai.join() === LOAI.join(), t.loai.join());
  const { ngay: homNay } = await mot(`select to_char(hom_nay_vn(), 'YYYY-MM-DD') as ngay`);
  const { ngay: sauNgayTruoc } = await mot(`select to_char(hom_nay_vn() - 6, 'YYYY-MM-DD') as ngay`);
  ok('7 ngày cũ → mới, kết thúc hôm nay (giờ VN)', t.ngay[0].ngay === sauNgayTruoc && t.ngay[6].ngay === homNay,
     t.ngay.map(d => d.ngay).join());
  ok('Mỗi ngày có đủ 11 loại (ngày trống = 0)', t.ngay.every(d => LOAI.every(l => typeof d.dem[l] === 'number'))
     && t.ngay[0].dem.tin_nhan === 0, JSON.stringify(t.ngay[0]));
  ok('Số hôm nay khớp bảng', t.ngay[6].dem.tin_nhan === await demHomNay('tin_nhan')
     && t.ngay[6].dem.bi_khoa === await demHomNay('bi_khoa'), JSON.stringify(t.ngay[6]));

  await db.query(`insert into mess_thong_ke_ngay (ngay, loai, dem) values (hom_nay_vn() - 3, 'dat_ban', 5), (hom_nay_vn() - 7, 'dat_ban', 100)`);
  const t2 = (await rpc(UID.qlA, `mess_tong_quan()`)).kq;
  ok('tong cộng đúng 7 ngày (ngày thứ 8 không tính)', t2.tong.dat_ban === await demHomNay('dat_ban') + 5
     && t2.ngay[3].dem.dat_ban === 5, JSON.stringify(t2.tong));
  ok('Tổng quan có đếm phiên (hoạt động 24h, tạm dừng, bị khóa)',
     t2.phien.hoat_dong_24h >= 3 && t2.phien.dang_tam_dung >= 1 && typeof t2.phien.bi_khoa === 'number', JSON.stringify(t2.phien));
  ok('Tổng quan có cấu hình (không cap_nhat), không có psid_bam / SĐT',
     t2.cau_hinh.dang_bat === true && !('cap_nhat' in t2.cau_hinh)
     && ![P1, P2, P3].some(p => JSON.stringify(t2).includes(p)) && !/0\d{9}/.test(JSON.stringify(t2)), JSON.stringify(t2.cau_hinh));

  for (const [ai, uid] of [['Marketing', UID.mktA], ['Thu ngân', UID.thuNganA], ['Thủ kho', UID.thuKhoA],
                           ['Kế toán', UID.keToanA], ['NV quầy', UID.nvQuayA]]) {
    const r = await rpc(uid, `mess_tong_quan()`);
    ok(`${ai} KHÔNG xem được tổng quan bot`, tuChoi(r), vi(r));
  }
});

// ===========================================================================
await nhom('6 · AI GỌI ĐƯỢC GÌ — máy chỉ gọi RPC máy, người không gọi RPC máy', async () => {
  const MAY = [
    ['mess_lay_phien', `mess_lay_phien($1)`, [P1]],
    ['mess_luu_phien', `mess_luu_phien($1, 'menu')`, [P1]],
    ['mess_ghi_tra_cuu', `mess_ghi_tra_cuu($1, false)`, [P1]],
    ['mess_xin_dat_ban', `mess_xin_dat_ban($1)`, [P1]],
    ['mess_ghi_su_kien', `mess_ghi_su_kien('dat_ban')`, []],
  ];
  for (const [ai, uid] of [['Chủ sở hữu', UID.chu], ['Quản lý', UID.qlA], ['Marketing', UID.mktA], ['Thu ngân', UID.thuNganA],
                           ['Thủ kho', UID.thuKhoA], ['Kế toán', UID.keToanA], ['NV quầy', UID.nvQuayA],
                           ['Máy Zalo', UID_MAY_ZALO], ['Máy iPOS', UID_MAY_IPOS],
                           ['Máy Messenger đã tắt (dang_lam = false)', UID_MAY_NGHI],
                           ['Không phải nhân sự', UID_LA], ['Đăng nhập nhưng không có uid', null]]) {
    const lot = [];
    for (const [ten, sql, p] of MAY) {
      const r = await rpc(uid, sql, p);
      if (!tuChoi(r)) lot.push(`${ten}: ${vi(r)}`);
    }
    ok(`${ai} KHÔNG gọi được RPC máy nào (42501)`, lot.length === 0, lot.join(' | '));
  }
  // Không phiên (service_role, seed): KHÔNG có đường "không phiên thì cho qua".
  const lot = [];
  for (const [ten, sql, p] of MAY) {
    const e = await db.query(`select ${sql}`, p).then(() => null, e => e);
    if (!(e && e.code === '42501')) lot.push(`${ten}: ${e ? e.code + ' ' + e.message : 'CHẠY ĐƯỢC'}`);
  }
  ok('Không có phiên đăng nhập → cả năm RPC máy bị từ chối 42501', lot.length === 0, lot.join(' | '));

  const NGUOI = [
    ['mess_doc_cau_hinh', `mess_doc_cau_hinh()`],
    ['mess_luu_cau_hinh', `mess_luu_cau_hinh(false)`],
    ['mess_tong_quan', `mess_tong_quan()`],
    ['zalo_bat_dau_luot', `zalo_bat_dau_luot()`],
    ['zalo_tong_quan', `zalo_tong_quan('${cnA.id}')`],
    ['zalo_doc_cau_hinh', `zalo_doc_cau_hinh()`],
  ];
  const lot2 = [];
  for (const [ten, sql] of NGUOI) {
    const r = await may(sql);
    if (!(r.loi !== null && (r.ma === '42501' || /permission denied|quyền/i.test(r.loi)))) lot2.push(`${ten}: ${vi(r)}`);
  }
  ok('Máy Messenger KHÔNG gọi được RPC của người, của Zalo', lot2.length === 0, lot2.join(' | '));
  const dongLai = await rpc(UID.chu, `mess_luu_cau_hinh(false)`);
  ok('…và cấu hình không bị máy đổi (chủ vẫn thấy bot bật trước khi tắt)', dongLai.loi === null && dongLai.kq.dang_bat === false);

  // anon: không hàm mess_ nào, không bảng mess_ nào.
  for (const [ten, sql, p] of [...MAY, ['mess_doc_cau_hinh', `mess_doc_cau_hinh()`, []], ['mess_tong_quan', `mess_tong_quan()`, []]]) {
    const r = await duoiAnon(`select ${sql}`, p);
    ok(`anon gọi ${ten} → permission denied`, /permission denied/i.test(r.loi ?? ''), r.loi ?? 'CHẠY ĐƯỢC');
  }
  for (const b of ['mess_phien', 'mess_cau_hinh', 'mess_thong_ke_ngay']) {
    const r = await duoiAnon(`select count(*) from ${b}`);
    ok(`anon đọc ${b} → permission denied`, /permission denied/i.test(r.loi ?? ''), r.loi ?? 'ĐỌC ĐƯỢC');
  }

  // Ghi / đọc thẳng bảng mess_*: không ai, kể cả chủ và máy.
  for (const [ai, uid] of [['Máy Messenger', UID_MAY_MESS], ['Chủ', UID.chu]]) {
    const lot3 = [];
    for (const sql of [`select * from mess_phien`, `select * from mess_cau_hinh`, `select * from mess_thong_ke_ngay`,
                       `update mess_cau_hinh set dang_bat = true`, `delete from mess_phien`,
                       `insert into mess_thong_ke_ngay (ngay, loai, dem) values (current_date, 'dat_ban', 999)`]) {
      const r = await duoi(uid, sql);
      if (!/permission denied/i.test(r.loi ?? '')) lot3.push(`${sql}: ${r.loi ?? 'CHẠY ĐƯỢC'}`);
    }
    ok(`${ai} KHÔNG đọc / ghi thẳng được bảng mess_* (chỉ qua RPC)`, lot3.length === 0, lot3.join(' | '));
  }
});

// ===========================================================================
await nhom('7 · MÁY MESSENGER KHÔNG ĐỌC / GHI ĐƯỢC CRM, KHÔNG CÓ VIỆC KHO', async () => {
  // Có dữ liệu thật để "đọc được 0 dòng" có nghĩa.
  const NGAY = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const d = await duoiAnon(`select * from tao_dat_ban('q1', '0912345678', 'Khách Messenger', $1::date, '18:00'::time, 2::smallint,
                              p_utm_source => 'messenger', p_utm_medium => 'chatbot', p_dong_y => false)`, [NGAY]);
  ok('Website vẫn như cũ: anon KHÔNG phiên đặt bàn được với utm messenger/chatbot', d.loi === null && d.rows?.[0]?.ma_dat_ban, d.loi ?? '');
  const db1 = await mot(`select utm_source, utm_medium, dong_y_nhan_tin from dat_ban where ma_dat_ban = $1`, [d.rows?.[0]?.ma_dat_ban]);
  ok('…dat_ban ghi đúng nguồn messenger / chatbot, không đồng ý nhận tin',
     db1?.utm_source === 'messenger' && db1.utm_medium === 'chatbot' && db1.dong_y_nhan_tin === false, JSON.stringify(db1));
  await db.query(`insert into luot_ghe (chi_nhanh_id, khach_hang_id, tong_hoa_don, thanh_toan_tien)
                  select $1, id, 500000, 500000 from khach_hang limit 1`, [cnA.id]).catch(() => {});

  // Đọc: đúng như máy Zalo — không hơn.
  const bang = (await q(`select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
                         where n.nspname = 'public' and c.relkind in ('r', 'v', 'm') order by 1`)).map(r => r.relname);
  const docDuoc = async uid => {
    const kq = [];
    for (const b of bang) {
      const r = await duoi(uid, `select count(*)::int as n from "${b}"`);
      if (r.loi === null && r.rows[0].n > 0) kq.push(b);
    }
    return kq;
  };
  const mess = await docDuoc(UID_MAY_MESS);
  const zalo = await docDuoc(UID_MAY_ZALO);
  ok(`Máy Messenger đọc được đúng những gì máy Zalo đọc được (${mess.length} bảng/view nội dung chung) — không hơn`,
     mess.join() === zalo.join(), `mess: ${mess.join()} · zalo: ${zalo.join()}`);
  const CRM = ['khach_hang', 'dat_ban', 'luot_ghe', 'so_cai_diem', 'nhat_ky_tin', 'nhat_ky_dong_y', 'chien_dich',
               'nhat_ky_tra_cuu', 'zalo_cau_hinh', 'chi_nhanh', 'ban_an', 'cau_hinh_tich_diem',
               'mess_phien', 'mess_cau_hinh', 'mess_thong_ke_ngay'];
  const lotCrm = mess.filter(b => CRM.includes(b) || b.startsWith('kho_') || b.startsWith('v_khach') || b.startsWith('v_dat'));
  ok('…không có bảng khách / đặt bàn / điểm / tin / kho / mess_ nào', lotCrm.length === 0, lotCrm.join());
  const coDl = await mot(`select (select count(*) from khach_hang)::int as kh, (select count(*) from dat_ban)::int as db`);
  ok('(tiền đề: database có khách và đặt bàn thật)', coDl.kh > 0 && coDl.db > 0);

  const ngoai = await duoi(UID_MAY_MESS, `select duoc_truy_cap_chi_nhanh($1) as a, la_nhan_su_ngoai_crm() as b`, [cnA.id]);
  ok('duoc_truy_cap_chi_nhanh() = false (dù có chi_nhanh_id); la_nhan_su_ngoai_crm() = true → tường ngăn 0018 áp dụng',
     ngoai.rows?.[0]?.a === false && ngoai.rows[0].b === true, vi(ngoai));
  const VIEC = ['xem', 'xem_gia', 'nhap', 'duyet', 'duyet_nhap', 'pha_loc', 'van_hanh', 'ke_toan', 'danh_muc', 'ncc',
                'cai_dat_goc', 'may_chung', 'dong_bo_ban'];
  const { n: soViec } = await mot(`select count(*)::int as n from unnest($1::text[]) v
                                   where 'may_messenger'::vai_tro = any(kho_vai_duoc(v))`, [VIEC]);
  const khoCn = await duoi(UID_MAY_MESS, `select kho_cn_duoc('xem') as cn`);
  ok('Không có việc kho nào (kho_vai_duoc), kho_cn_duoc(xem) rỗng', soViec === 0
     && (khoCn.loi !== null || khoCn.rows[0].cn.length === 0), `${soViec} việc · ${vi(khoCn)}`);

  // Ghi: tường ngăn 0018 chặn, kể cả qua hàm definer.
  const GHI = [
    ['tim_hoac_tao_khach', `select * from tim_hoac_tao_khach('0988777666', 'Máy tạo')`],
    ['ghi_luot_ghe', `select * from ghi_luot_ghe('${cnA.id}', '0912345678', 100000::bigint)`],
    ['xep_hang_gui_tin', `select xep_hang_gui_tin('${cnA.id}', (select id from khach_hang limit 1), 'ZBS-02')`],
    ['tao_dat_ban dưới phiên máy', `select * from tao_dat_ban('q1', '0977666555', 'Qua máy', '${NGAY}'::date, '19:00'::time, 2::smallint)`],
    ['insert dat_ban', `insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach)
                        select '${cnA.id}', id, '${NGAY}', '20:00', 2 from khach_hang limit 1`],
    ['update khach_hang', `update khach_hang set ho_ten = 'máy sửa'`],
  ];
  // Hàm definer phải BÁO LỖI (tường ngăn); lệnh ghi thẳng thì RLS che hết dòng
  // nên có thể "chạy" mà không chạm dòng nào — đếm dòng lọt ở dưới.
  const lot = [];
  for (const [ten, sql] of GHI) {
    const r = await duoi(UID_MAY_MESS, sql);
    if (r.loi === null && !/^(insert|update)/.test(ten)) lot.push(`${ten}: CHẠY ĐƯỢC`);
  }
  const { n: bi } = await mot(`select (select count(*) from khach_hang where sdt in ('0988777666', '0977666555') or ho_ten = 'máy sửa')
                                    + (select count(*) from dat_ban where gio = '20:00')::int as n`);
  ok('Máy Messenger KHÔNG ghi được khách / lượt ghé / tin / đặt bàn (kể cả qua hàm definer)',
     lot.length === 0 && Number(bi) === 0, lot.join(' | ') + ` · dòng lọt: ${bi}`);

});

// ===========================================================================
await nhom('8 · ANON VÀ CHỐT QUYỀN KHÔNG ĐỔI', async () => {
  // Chép từ DUOC_PHEP của test-an-toan.mjs — 0053 không được thêm hàm nào cho anon. 0084 bớt
  // ghi_nhat_ky_tra_cuu (hai hàm tra / hủy tự ghi nhật ký): 13 → 12 hàm; tra_cuu_mot_dat_ban (trả jsonb)
  // thay tra_cuu_dat_ban (trả bảng).
  const DUOC_PHEP = ['chi_nhanh_cong_khai', 'ghi_su_kien_web', 'huy_dat_ban', 'lich_trong_theo_ma',
                     'noi_dung_cong_khai', 'nop_ho_so_ung_tuyen', 'tao_dat_ban', 'thuc_don_cong_khai',
                     'tin_tuyen_dung_cong_khai', 'tra_cuu_mot_dat_ban', 've_con_hieu_luc', 'xin_phieu_tai_cv'].sort();
  const anon = (await q(`select distinct p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                         where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute') order by 1`))
    .map(r => r.proname);
  ok('anon gọi được đúng danh sách cũ (DUOC_PHEP của test-an-toan)', anon.join() === DUOC_PHEP.join(), anon.join());
  const aT = readFileSync(join(__dirname, 'test-an-toan.mjs'), 'utf8');
  ok('test-an-toan.mjs vẫn liệt kê đúng 12 hàm (0084 bớt ghi_nhat_ky_tra_cuu), không có mess_',
     DUOC_PHEP.length === 12 && DUOC_PHEP.every(h => aT.includes(`'${h}'`)) && !/'mess_/.test(aT));

  const khoi = f => {
    const s = readFileSync(join(MIG, f), 'utf8');
    return s.slice(s.lastIndexOf('-- CHỐT QUYỀN'));
  };
  ok('Khối CHỐT QUYỀN cuối 0053 chép NGUYÊN VĂN từ 0051', khoi('0053_messenger_bot.sql') === khoi('0051_kho_ipos_o_ma.sql'));
  ok('…và có dòng ve_con_hieu_luc(text)', khoi('0053_messenger_bot.sql').includes('ve_con_hieu_luc(text)'));
});

process.exit(ketThuc('BOT MESSENGER'));
