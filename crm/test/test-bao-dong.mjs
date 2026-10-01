/**
 * BEEFTOWN — BÁO ĐỘNG (0059 · vai may_bao_dong, 0060 · sổ sự cố và bốn RPC của máy)
 * ==============================================================================
 *
 *     node test/test-bao-dong.mjs
 *
 * Việc chạy nền báo động (web/src/lib/bao-dong.ts) đọc số liệu bảng sức khỏe bằng tài khoản
 * máy may_bao_dong và giữ TRẠNG THÁI ở database: mỗi đèn đỏ một sự cố, khóa lượt, dấu "đã
 * báo". Luật báo (giờ, đêm / sáng, câu chữ) ở web — test-bao-dong-web.mjs. Ở đây kiểm:
 *
 *   0. 0059 chỉ đúng một lệnh (chạy riêng); 0060 không thêm giá trị enum.
 *   1. quyen — chỉ may_bao_dong đang làm gọi được bốn RPC; mọi vai khác, máy đã tắt, tài
 *      khoản không có dòng nhan_su, anon bị từ chối. Máy không đọc được bảng nào, không gọi
 *      được hàm của máy khác hay hàm nội bộ.
 *   2. bam-hai-lan — khóa lượt, mã lượt (lượt cũ không nhả khóa của lượt mới), một đèn đỏ qua
 *      nhiều lượt vẫn là một sự cố, "đã gửi" gọi lại không đổi mốc.
 *   3. mat-mang — số liệu hỏng thì lượt vẫn chạy (đèn giả doc_so_lieu), không đóng sự cố nào;
 *      câu lỗi lưu lại đã xóa token / SĐT.
 *   4. ton-kho — không ghi kho; kết thúc bằng kho_doi_soat_ton() rỗng.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, UID, themMayIpos, UID_MAY_IPOS } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MIG = join(GOC, 'crm', 'supabase', 'migrations');
const tep = dau => readFileSync(join(MIG, readdirSync(MIG).find(f => f.startsWith(dau))), 'utf8');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — BÁO ĐỘNG');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
await themMayIpos(db, cnA, cnB);

const UID_MAY = '00000000-0000-4000-8000-0000000000f1';       // máy báo động đang dùng
const UID_MAY_TAT = '00000000-0000-4000-8000-0000000000f2';   // máy báo động cũ, đã tắt
const UID_MAY_ZALO = '00000000-0000-4000-8000-0000000000f3';
const UID_MAY_MESS = '00000000-0000-4000-8000-0000000000f4';
const UID_MAY_CHUNG = '00000000-0000-4000-8000-0000000000f5';
for (const [uid, ten, vai, dangLam] of [
  [UID_MAY, 'Máy báo động', 'may_bao_dong', true], [UID_MAY_TAT, 'Máy báo động cũ', 'may_bao_dong', false],
  [UID_MAY_ZALO, 'Máy Zalo', 'may_zalo', true], [UID_MAY_MESS, 'Máy Messenger', 'may_messenger', true],
  [UID_MAY_CHUNG, 'Máy tính bảng chung', 'may_chung', true],
]) {
  await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam) values ($1, $2, $3, $4, $5)`,
                 [uid, cnA.id, ten, vai, dangLam]);
}

const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];
/** Gọi một hàm dưới danh nghĩa uid → { kq, loi, ma }. */
async function rpc(uid, goi, p = []) {
  const r = await duoi(uid, `select ${goi} as kq`, p);
  return { kq: r.rows?.[0]?.kq ?? null, loi: r.loi, ma: r.ma ?? null };
}
const vi = r => r.loi ?? JSON.stringify(r.kq)?.slice(0, 300);
const mang = ids => `{${ids.join(',')}}`;
const BAT_DAU = (kenh, uid = UID_MAY) => rpc(uid, `bao_dong_bat_dau_luot($1)`, [kenh]);
const GHI = (luot, den, dayDu = true, uid = UID_MAY) =>
  rpc(uid, `bao_dong_ghi_luot($1::uuid, $2::jsonb, $3)`, [luot, den === undefined ? null : JSON.stringify(den), dayDu]);
const DA_GUI = (kenh, mo = [], het = [], tomTat = false, uid = UID_MAY) =>
  rpc(uid, `bao_dong_da_gui($1, $2::uuid[], $3::uuid[], $4)`, [kenh, mang(mo), mang(het), tomTat]);
const KET_THUC = (luot, dong = [], loi = null, uid = UID_MAY) =>
  rpc(uid, `bao_dong_ket_thuc_luot($1::uuid, $2::uuid[], $3)`, [luot, mang(dong), loi]);
const suCoMo = async khoa => mot(`select * from bao_dong_su_co where khoa = $1 and het_luc is null`, [khoa]);
const soSuCo = async () => (await mot(`select count(*)::int as n from bao_dong_su_co`)).n;
const trangThai = () => mot(`select * from bao_dong_trang_thai where id = 1`);
const TU_CHOI = /^Chỉ tài khoản máy báo động mới gọi được hàm này$/;
const HET_LUOT = /^Lượt báo động này đã kết thúc hoặc quá hạn$/;
const SAI_DEN = /^Danh sách đèn không hợp lệ$/;
const SAI_KENH = /^Tên kênh báo động không hợp lệ$/;
// Bí mật GIẢ để thử phần xóa bí mật — ghép lúc chạy: test-kho-ipos-web.mjs quét mọi file tìm chuỗi giống token thật.
const TS_GIA = `${['access', 'token'].join('_')}=EAA${'abcdefghij'.repeat(2)}`;
const TELEGRAM_GIA = `123456789:AAH${'f'.repeat(32)}`;
const conBiMat = c => c.includes(TELEGRAM_GIA.split(':')[1]) || c.includes('123456789') || c.includes('0901234567')
  || c.includes('EAA' + 'abcdefghij');
const den = (ma_den, mau, cn = null) => ({ ma_den, chi_nhanh_id: cn?.id ?? null, mau });
const khoa = (ma, cn = null) => cn ? `${ma}:${cn.id}` : ma;
const bo = (k, ...khoaBo) => { if (!k || typeof k !== 'object') return k; const c = { ...k }; for (const x of khoaBo) delete c[x]; return c; };

// ===========================================================================
await nhom('0 · 0059 CHỈ THÊM VAI, CHẠY MỘT MÌNH', async () => {
  const lenh = tep('0059_').replace(/--[^\n]*/g, '').trim();
  ok('0059 đúng một lệnh: thêm may_bao_dong vào vai_tro (Postgres không cho dùng giá trị enum mới trong cùng giao dịch)',
     lenh === "alter type vai_tro add value if not exists 'may_bao_dong';", lenh);
  const { rows } = await db.query(`select unnest(enum_range(null::vai_tro))::text as v`);
  ok('vai_tro có may_bao_dong', rows.some(r => r.v === 'may_bao_dong'), rows.map(r => r.v).join(', '));
  ok('0060 không thêm giá trị enum nào', !/alter\s+type/i.test(tep('0060_').replace(/--[^\n]*/g, '')));
  const { src } = await mot(`select prosrc as src from pg_proc where proname = 'duoc_truy_cap_chi_nhanh'`);
  ok('Tường ngăn CRM (duoc_truy_cap_chi_nhanh) không nhắc tới may_bao_dong', !src.includes('may_bao_dong'));
  const { n } = await mot(`select count(*)::int as n from unnest(array['xem','nhap','duyet','danh_muc','cai_dat_goc','ke_toan','dong_bo_ban']) v
                           where 'may_bao_dong'::vai_tro = any(kho_vai_duoc(v))`);
  ok('may_bao_dong không có việc kho nào (kho_vai_duoc)', n === 0, `${n} việc`);
});

// ===========================================================================
const RPC = [
  ['bao_dong_bat_dau_luot', uid => BAT_DAU('khong', uid)],
  ['bao_dong_ghi_luot', uid => GHI(crypto.randomUUID(), [], true, uid)],
  ['bao_dong_da_gui', uid => DA_GUI('telegram', [], [], false, uid)],
  ['bao_dong_ket_thuc_luot', uid => KET_THUC(crypto.randomUUID(), [], null, uid)],
];
await nhom('1 · CHỈ MÁY BÁO ĐỘNG GỌI ĐƯỢC BỐN HÀM', async () => {
  for (const [ten, uid] of [
    ['Chủ', UID.chu], ['Quản lý Q1', UID.qlA], ['Quản lý Q7', UID.qlB], ['Thủ kho Q1', UID.thuKhoA],
    ['Nhân viên quầy', UID.nvQuayA], ['Kế toán', UID.keToanA], ['Thu ngân', UID.thuNganA], ['Marketing', UID.mktA],
    ['Người đã nghỉ', UID.nghiViec], ['Máy iPOS', UID_MAY_IPOS.mayIposA], ['Máy Zalo', UID_MAY_ZALO],
    ['Máy Messenger', UID_MAY_MESS], ['Máy tính bảng chung', UID_MAY_CHUNG], ['Máy báo động ĐÃ TẮT', UID_MAY_TAT],
    ['Tài khoản không có dòng nhan_su', null],
  ]) {
    const sai = [];
    for (const [ham, goi] of RPC) {
      const r = await goi(uid);
      if (!(r.ma === '42501' && TU_CHOI.test(r.loi ?? ''))) sai.push(`${ham}: ${vi(r)}`);
    }
    ok(`${ten}: cả bốn hàm từ chối (42501, câu "Chỉ tài khoản máy báo động…")`, sai.length === 0, sai.join(' | '));
  }
  for (const goi of [`bao_dong_bat_dau_luot('khong')`, `bao_dong_ghi_luot(gen_random_uuid(), '[]'::jsonb, true)`,
                     `bao_dong_da_gui('telegram', '{}'::uuid[], '{}'::uuid[], false)`,
                     `bao_dong_ket_thuc_luot(gen_random_uuid(), '{}'::uuid[], null)`]) {
    const r = await duoiAnon(`select ${goi}`);
    ok(`anon không gọi được ${goi.slice(0, goi.indexOf('('))}`, r.loi !== null && /permission denied/.test(r.loi), r.loi ?? 'GỌI ĐƯỢC');
  }
  ok('Máy báo động đang làm gọi được', (await BAT_DAU('khong')).loi === null);
  await db.query(`update bao_dong_trang_thai set dang_chay_tu = null, luot = null where id = 1`);

  const { rows } = await db.query(`
    select p.proname as ten, p.prosecdef as definer, coalesce(array_to_string(p.proconfig, ','), '') as cau_hinh,
           has_function_privilege('authenticated', p.oid, 'execute') as auth,
           has_function_privilege('anon', p.oid, 'execute') as anon, p.prosrc as src
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'bao\\_dong\\_%' order by 1`);
  ok('Hàm bao_dong_* đúng danh sách: bốn RPC máy + bao_dong_sach_loi',
     rows.map(r => r.ten).join() === 'bao_dong_bat_dau_luot,bao_dong_da_gui,bao_dong_ghi_luot,bao_dong_ket_thuc_luot,bao_dong_sach_loi',
     rows.map(r => r.ten).join(', '));
  const rpcRows = rows.filter(r => r.ten !== 'bao_dong_sach_loi');
  ok('Bốn RPC: security definer, set search_path = public, kiểm vai may_bao_dong NGAY câu đầu thân hàm',
     rpcRows.length === 4 && rpcRows.every(r => r.definer && r.cau_hinh === 'search_path=public'
       && /^\s*(declare[\s\S]*?)?begin\s+if not co_vai_tro\(array\['may_bao_dong'\]::vai_tro\[\]\) then/.test(r.src)),
     rpcRows.filter(r => !r.definer || !/^\s*(declare[\s\S]*?)?begin\s+if not co_vai_tro/.test(r.src)).map(r => r.ten).join(', '));
  ok('Không hàm bao_dong_* nào cho anon', rows.every(r => !r.anon), rows.filter(r => r.anon).map(r => r.ten).join(', '));
  const sach = rows.find(r => r.ten === 'bao_dong_sach_loi');
  ok('bao_dong_sach_loi là hàm nội bộ: authenticated không gọi được', sach && !sach.auth);
});

// ===========================================================================
await nhom('2 · MÁY KHÔNG ĐỌC ĐƯỢC GÌ NGOÀI BỐN HÀM CỦA NÓ', async () => {
  await db.query(`select * from tim_hoac_tao_khach('0912345678', 'Khách Bí Mật')`);
  for (const bang of ['bao_dong_trang_thai', 'bao_dong_su_co', 'khach_hang', 'dat_ban', 'nhat_ky_tin', 'zalo_cau_hinh',
                      'mess_cau_hinh', 'kho_ton', 'kho_so_cai', 'kho_ipos_cau_hinh']) {
    const r = await duoi(UID_MAY, `select count(*)::int as n from ${bang}`);
    ok(`Máy báo động không đọc được dòng nào của ${bang}`, r.loi !== null || r.rows[0].n === 0, r.loi ?? `${r.rows[0].n} dòng`);
  }
  const ns = await duoi(UID_MAY, `select count(*)::int as n from nhan_su where auth_uid is distinct from $1`, [UID_MAY]);
  ok('Máy báo động không đọc được nhân sự nào khác', ns.loi !== null || ns.rows[0].n === 0, ns.loi ?? `${ns.rows[0].n} người`);
  for (const [ten, goi, mau] of [
    ['suc_khoe_he_thong (chỉ chủ / quản lý)', `suc_khoe_he_thong()`, /Chỉ chủ sở hữu hoặc quản lý/],
    ['kho_ipos_trang_thai (cần quyền xem kho)', `kho_ipos_trang_thai('${cnA.id}')`, /không xem được kho/],
    ['suc_khoe_so_lieu (nội bộ)', `suc_khoe_so_lieu(array['${cnA.id}']::uuid[])`, /permission denied/],
    ['suc_khoe_lech_so_kho (nội bộ)', `suc_khoe_lech_so_kho()`, /permission denied/],
    ['suc_khoe_sao_luu (chỉ chủ / quản lý)', `suc_khoe_sao_luu()`, /Chỉ chủ sở hữu hoặc quản lý/],
    ['suc_khoe_sao_luu_so_lieu (nội bộ)', `suc_khoe_sao_luu_so_lieu()`, /permission denied/],
    ['kho_ipos_trang_thai_goc (nội bộ)', `kho_ipos_trang_thai_goc('${cnA.id}')`, /permission denied/],
    ['bao_dong_sach_loi (nội bộ)', `bao_dong_sach_loi('x')`, /permission denied/],
    ['zalo_bat_dau_luot (máy Zalo)', `zalo_bat_dau_luot(50)`, /^Chỉ tài khoản máy Zalo mới gọi được hàm này$/],
    ['mess_lay_phien (máy Messenger)', `mess_lay_phien('abc')`, /^Chỉ tài khoản máy Messenger mới gọi được hàm này$/],
  ]) {
    const r = await rpc(UID_MAY, goi);
    ok(`Máy báo động không gọi được ${ten}`, r.loi !== null && mau.test(r.loi), vi(r));
  }
  for (const bang of ['bao_dong_trang_thai', 'bao_dong_su_co']) {
    const c = await duoi(UID.chu, `select count(*) from ${bang}`);
    ok(`Chủ cũng không đọc thẳng ${bang} (chỉ qua đèn Báo động)`, c.loi !== null && /permission denied/.test(c.loi), c.loi ?? 'ĐỌC ĐƯỢC');
    const a = await duoiAnon(`select count(*) from ${bang}`);
    ok(`anon không đọc ${bang}`, a.loi !== null, a.loi ?? 'ĐỌC ĐƯỢC');
  }
  const { rows: cot } = await db.query(`
    select column_name as c, data_type as t from information_schema.columns
    where table_name = 'bao_dong_su_co' order by ordinal_position`);
  ok('Sự cố không có cột chữ tự do nào để dữ liệu cá nhân nằm lại (chỉ mã đèn, khóa, màu, kênh)',
     cot.filter(x => x.t === 'text').map(x => x.c).sort().join() === 'bao_mo_kenh,khoa,ma_den,mau_sau',
     cot.map(x => `${x.c}:${x.t}`).join(', '));
});

// ===========================================================================
let luot = null;
await nhom('3 · BẮT ĐẦU LƯỢT: KHÓA 10 PHÚT, MÃ LƯỢT, SỐ LIỆU CỦA BẢNG', async () => {
  const b1 = await BAT_DAU('khong');
  ok('Bắt đầu lượt: có mã lượt, không bị khóa', b1.loi === null && b1.kq?.bi_khoa === false
     && /^[0-9a-f-]{36}$/.test(b1.kq?.luot ?? ''), vi(b1));
  const chu = (await rpc(UID.chu, `suc_khoe_he_thong()`)).kq;
  ok('Số liệu của máy = đúng số liệu chủ thấy trên bảng (cùng hàm, cùng ngưỡng)',
     b1.kq?.loi_so_lieu === null && b1.kq?.so_lieu?.chi_nhanh?.length === 2
     && JSON.stringify(bo(b1.kq.so_lieu, 'luc', 'bao_dong', 'sao_luu')) === JSON.stringify(bo(chu, 'luc', 'bao_dong')));
  const slChu = (await rpc(UID.chu, `suc_khoe_sao_luu()`)).kq;
  ok('…kèm ô sao_luu = đúng số liệu sao lưu chủ thấy (đèn "Sao lưu dữ liệu" cũng được báo)',
     slChu !== null && JSON.stringify(b1.kq?.so_lieu?.sao_luu) === JSON.stringify(slChu), JSON.stringify(b1.kq?.so_lieu?.sao_luu));
  // Trang /noi-bo đọc số liệu bằng docSucKhoeVaSaoLuu (suc_khoe_he_thong + hàm riêng của đèn Sao lưu). Đèn
  // nào đọc bằng hàm riêng mà quên gắn vào bao_dong_bat_dau_luot thì lượt báo động không bao giờ thấy nó đỏ.
  const { danhGiaSucKhoe, docSucKhoeVaSaoLuu } = await import(join(GOC, 'web', 'src', 'lib', 'suc-khoe.ts'));
  const clientChu = {
    async rpc(ham) {
      const r = await duoi(UID.chu, `select ${ham}() as k`);
      return r.loi ? { data: null, error: { message: r.loi, code: r.ma } } : { data: r.rows[0].k, error: null };
    },
  };
  const trang = await docSucKhoeVaSaoLuu(clientChu);
  const denCua = tho => danhGiaSucKhoe(tho, 'vi', true).khoi
    .flatMap(k => k.den.filter(d => d.ma !== 'bao_dong').map(d => `${k.ma}/${d.ma}: ${d.mau} — ${d.cau}`));
  const denTrang = trang.ok ? denCua(trang.tho) : [], denMay = denCua(b1.kq?.so_lieu);
  ok('Mọi đèn trang /noi-bo thấy, lượt báo động thấy y hệt (màu và câu) — kể cả đèn đọc bằng hàm riêng',
     trang.ok && denTrang.length >= 10 && JSON.stringify(denMay) === JSON.stringify(denTrang),
     JSON.stringify(denTrang.filter(x => !denMay.includes(x))));
  ok('Trả trạng thái cho luật báo: kênh, lần đổi kênh, lần tóm tắt, lượt trước',
     JSON.stringify(Object.keys(b1.kq?.trang_thai ?? {}).sort()) === '["kenh","kenh_tu_luc","lan_chay_cuoi","tom_tat_luc"]'
     && b1.kq.trang_thai.kenh === 'khong' && b1.kq.trang_thai.kenh_tu_luc === null, JSON.stringify(b1.kq?.trang_thai));
  ok('Chưa báo gì trong 48 giờ', Array.isArray(b1.kq?.da_bao_48_gio) && b1.kq.da_bao_48_gio.length === 0);

  const b2 = await BAT_DAU('khong');
  ok('Lượt thứ hai trong lúc lượt đầu chạy → bị khóa, không có mã lượt', b2.kq?.bi_khoa === true && !b2.kq?.luot
     && typeof b2.kq?.dang_chay_tu === 'string', vi(b2));
  await db.query(`update bao_dong_trang_thai set dang_chay_tu = now() - interval '9 minutes' where id = 1`);
  ok('Lượt đầu chạy 9 phút → vẫn khóa', (await BAT_DAU('khong')).kq?.bi_khoa === true);
  await db.query(`update bao_dong_trang_thai set dang_chay_tu = now() - interval '11 minutes' where id = 1`);
  const b3 = await BAT_DAU('khong');
  ok('Lượt đầu treo quá 10 phút → coi như đã chết, lượt mới chạy với mã mới', b3.kq?.bi_khoa === false
     && b3.kq.luot !== b1.kq.luot, vi(b3));

  const g1 = await GHI(b1.kq.luot, []);
  ok('Lượt cũ (đã bị thay) ghi lượt → từ chối', g1.ma === '23514' && HET_LUOT.test(g1.loi ?? ''), vi(g1));
  const k1 = await KET_THUC(b1.kq.luot);
  const tt1 = await trangThai();
  ok('Lượt cũ kết thúc KHÔNG nhả khóa của lượt mới', k1.kq?.nha_khoa === false && tt1.luot === b3.kq.luot
     && tt1.dang_chay_tu !== null, vi(k1));
  const k3 = await KET_THUC(b3.kq.luot);
  const tt3 = await trangThai();
  ok('Lượt mới kết thúc → nhả khóa, ghi nhịp tim', k3.kq?.nha_khoa === true && tt3.luot === null
     && tt3.dang_chay_tu === null && tt3.lan_chay_cuoi !== null, vi(k3));
  const g3 = await GHI(b3.kq.luot, []);
  ok('Ghi lượt sau khi lượt đã kết thúc → từ chối', g3.ma === '23514' && HET_LUOT.test(g3.loi ?? ''), vi(g3));
  ok('Ghi lượt không có mã lượt → từ chối', HET_LUOT.test((await GHI(null, [])).loi ?? ''));

  for (const [ten, kenh] of [['chữ hoa', 'Telegram'], ['rỗng', ''], ['null', null], ['quá 20 ký tự', 'a'.repeat(21)],
                             ['có dấu', 'kênh'], ['khoảng trắng', 'tele gram']]) {
    const r = await BAT_DAU(kenh);
    ok(`Kênh ${ten} → "Tên kênh báo động không hợp lệ", không khóa`, r.ma === '23514' && SAI_KENH.test(r.loi ?? '')
       && (await trangThai()).dang_chay_tu === null, vi(r));
  }
  const t1 = await BAT_DAU('telegram');
  ok('Đổi kênh → ghi kênh và lúc đổi (để gửi tin "đã nối kênh")', t1.kq?.trang_thai?.kenh === 'telegram'
     && typeof t1.kq.trang_thai.kenh_tu_luc === 'string', JSON.stringify(t1.kq?.trang_thai));
  await KET_THUC(t1.kq.luot);
  const t2 = await BAT_DAU('telegram');
  ok('Cùng kênh → giữ nguyên lúc đổi', t2.kq?.trang_thai?.kenh_tu_luc === t1.kq.trang_thai.kenh_tu_luc,
     `${t2.kq?.trang_thai?.kenh_tu_luc} / ${t1.kq.trang_thai.kenh_tu_luc}`);
  await KET_THUC(t2.kq.luot);
  const t3 = await BAT_DAU('khong');
  ok('Về "khong" → lúc đổi mới', t3.kq?.trang_thai?.kenh === 'khong'
     && t3.kq.trang_thai.kenh_tu_luc !== t1.kq.trang_thai.kenh_tu_luc);
  luot = t3.kq.luot;
});

// ===========================================================================
await nhom('4 · GHI LƯỢT: MỖI ĐÈN ĐỎ MỘT SỰ CỐ', async () => {
  let g = await GHI(luot, [den('zalo', 'do'), den('so_kho', 'do', cnA), den('so_kho', 'xanh', cnB), den('dich', 'vang')]);
  const moKhoa = (g.kq?.su_co ?? []).map(s => s.khoa).sort();
  ok('Đèn đỏ → mỗi đèn một sự cố; khóa = mã đèn (+ ":" + id chi nhánh); đèn xanh / vàng không mở sự cố',
     g.loi === null && JSON.stringify(moKhoa) === JSON.stringify([khoa('so_kho', cnA), 'zalo'].sort()), vi(g));
  ok('Trả luc của database (Worker tính giờ theo đồng hồ database)', typeof g.kq?.luc === 'string' && Number.isFinite(Date.parse(g.kq.luc)));
  const z1 = await suCoMo('zalo');
  ok('Sự cố mới: đang đỏ, chưa báo', z1.het_do_tu === null && z1.bao_mo_luc === null && z1.chi_nhanh_id === null);
  g = await GHI(luot, [den('zalo', 'do'), den('so_kho', 'do', cnA)]);
  const z2 = await suCoMo('zalo');
  ok('Đỏ lượt thứ hai → vẫn MỘT sự cố, cùng id, giữ lúc bắt đầu', z2.id === z1.id && +z2.bat_dau_luc === +z1.bat_dau_luc
     && (await mot(`select count(*)::int as n from bao_dong_su_co where khoa = 'zalo'`)).n === 1);

  await GHI(luot, [den('zalo', 'xanh'), den('so_kho', 'do', cnA)]);
  const z3 = await suCoMo('zalo');
  ok('Hết đỏ → sự cố VẪN MỞ, bắt đầu chờ (het_do_tu), nhớ màu mới — Worker quyết lúc đóng',
     z3.id === z1.id && z3.het_do_tu !== null && z3.mau_sau === 'xanh' && z3.het_luc === null, JSON.stringify(z3));
  await db.query(`update bao_dong_su_co set het_do_tu = now() - interval '10 minutes' where id = $1`, [z1.id]);
  await GHI(luot, [den('zalo', 'vang'), den('so_kho', 'do', cnA)]);
  const z4 = await suCoMo('zalo');
  ok('Đang chờ, lượt sau màu khác → giữ lúc bắt đầu chờ (vẫn 10 phút trước), cập nhật màu',
     z4.id === z1.id && Date.now() - new Date(z4.het_do_tu) > 9 * 60000 && z4.mau_sau === 'vang', JSON.stringify(z4));
  await GHI(luot, [den('zalo', 'do'), den('so_kho', 'do', cnA)]);
  const z5 = await suCoMo('zalo');
  ok('Đỏ lại trong lúc chờ → vẫn sự cố cũ (chập chờn không thành nhiều tin), hết chờ',
     z5.id === z1.id && z5.het_do_tu === null && z5.mau_sau === null, JSON.stringify(z5));
  // Tin hết đỏ ban đêm có thể bị GIỮ tới 07:00 (luật hết đỏ ban đêm, bao-dong-chinh-sach.ts): sự cố còn mở
  // dù đèn đã hết đỏ quá PHUT_CHO_HET_DO phút. Đỏ lại lúc đó là một lần hỏng MỚI — phải được báo như mọi
  // lần đỏ, không được nối vào sự cố cũ (đã báo từ tối nên sẽ im tới sáng).
  await db.query(`update bao_dong_su_co set bao_mo_luc = now() - interval '3 hours', bao_mo_kenh = 'telegram' where id = $1`, [z1.id]);
  await GHI(luot, [den('zalo', 'xanh'), den('so_kho', 'do', cnA)]);
  await db.query(`update bao_dong_su_co set het_do_tu = now() - interval '14 minutes' where id = $1`, [z1.id]);
  await GHI(luot, [den('zalo', 'do'), den('so_kho', 'do', cnA)]);
  ok('Đỏ lại sau 14 phút hết đỏ → vẫn sự cố cũ (chưa đủ 15 phút)', (await suCoMo('zalo'))?.id === z1.id);
  await GHI(luot, [den('zalo', 'xanh'), den('so_kho', 'do', cnA)]);
  await db.query(`update bao_dong_su_co set het_do_tu = now() - interval '16 minutes' where id = $1`, [z1.id]);
  await GHI(luot, [den('zalo', 'do'), den('so_kho', 'do', cnA)]);
  const zMoi = await suCoMo('zalo');
  const zCu = await mot(`select het_luc, bao_het_luc, bao_mo_luc from bao_dong_su_co where id = $1`, [z1.id]);
  ok('Đỏ lại sau 16 phút hết đỏ mà sự cố còn mở (tin hết đỏ đang giữ tới 07:00) → sự cố MỚI, chưa báo — được báo như mọi lần đỏ',
     !!zMoi && zMoi.id !== z1.id && zMoi.het_do_tu === null && zMoi.bao_mo_luc === null, JSON.stringify(zMoi));
  ok('…sự cố cũ đóng, không có dấu "đã báo hết đỏ" (đèn đỏ lại rồi, "đã ổn lại" không còn đúng)',
     zCu.het_luc !== null && zCu.bao_het_luc === null && zCu.bao_mo_luc !== null, JSON.stringify(zCu));
  const { PHUT_CHO_HET_DO } = await import(join(GOC, 'web', 'src', 'lib', 'bao-dong-chinh-sach.ts'));
  const thanGhi = tep('0060').split('create or replace function bao_dong_ghi_luot(')[1]?.split('\n$$;')[0] ?? '';
  ok(`Mốc "lần hỏng mới" của bao_dong_ghi_luot đúng bằng PHUT_CHO_HET_DO của luật (${PHUT_CHO_HET_DO} phút)`,
     thanGhi.includes(`het_do_tu <= now() - interval '${PHUT_CHO_HET_DO} minutes'`), thanGhi.slice(0, 80));
  await GHI(luot, [den('zalo', 'tat'), den('so_kho', 'do', cnA)]);
  ok('Đèn chuyển xám (tắt) → chờ hết đỏ với màu "tat"', (await suCoMo('zalo')).mau_sau === 'tat');
  await GHI(luot, [den('zalo', 'do'), den('so_kho', 'do', cnA)]);

  await GHI(luot, [den('zalo', 'do')], true);
  const a1 = await suCoMo(khoa('so_kho', cnA));
  ok('Danh sách đầy đủ mà thiếu một đèn (chi nhánh ngừng hoạt động…) → sự cố đó chờ hết đỏ với màu "mat"',
     a1.het_do_tu !== null && a1.mau_sau === 'mat', JSON.stringify(a1));
  await GHI(luot, [den('zalo', 'do'), den('so_kho', 'do', cnA)]);
  await GHI(luot, [den('doc_so_lieu', 'do')], false);
  const a2 = await suCoMo(khoa('so_kho', cnA)), z6 = await suCoMo('zalo');
  ok('Danh sách KHÔNG đầy đủ (số liệu hỏng) → không đụng sự cố nào khác: không có "đã ổn lại" giả',
     a2.het_do_tu === null && z6.het_do_tu === null, `${a2.het_do_tu} / ${z6.het_do_tu}`);
  ok('…và mở sự cố cho đèn giả doc_so_lieu', !!(await suCoMo('doc_so_lieu')));
  await GHI(luot, [den('zalo', 'do'), den('so_kho', 'do', cnA), den('so_kho', 'do', cnB), den('doc_so_lieu', 'xanh')]);
  ok('Cùng mã đèn ở hai chi nhánh → hai sự cố', !!(await suCoMo(khoa('so_kho', cnA))) && !!(await suCoMo(khoa('so_kho', cnB))));

  const truoc = await soSuCo();
  const nghin = Array.from({ length: 1001 }, () => den('zalo', 'xanh'));
  for (const [ten, ds] of [
    ['không phải mảng', { ma_den: 'zalo', mau: 'do' }], ['null', undefined], ['phần tử không phải object', [1]],
    ['mã đèn có dấu', [den('Đặt bàn', 'do')]], ['mã đèn quá 40 ký tự', [den('a'.repeat(41), 'do')]],
    ['màu lạ', [den('zalo', 'red')]], ['thiếu màu', [{ ma_den: 'zalo' }]],
    ['id chi nhánh hỏng', [{ ma_den: 'so_kho', chi_nhanh_id: 'abc', mau: 'do' }]],
    ['chi nhánh không có thật', [{ ma_den: 'so_kho', chi_nhanh_id: crypto.randomUUID(), mau: 'do' }]],
    ['quá 1000 đèn', nghin],
    ['đèn đúng rồi đèn sai (không được ghi nửa vời)', [den('ipos', 'do', cnA), den('zalo', 'red')]],
  ]) {
    const r = await GHI(luot, ds);
    ok(`${ten} → "Danh sách đèn không hợp lệ", không ghi gì`, r.ma === '23514' && SAI_DEN.test(r.loi ?? '')
       && (await soSuCo()) === truoc && !(await suCoMo(khoa('ipos', cnA))), vi(r));
  }
  ok('Đúng 1000 đèn → ghi được', (await GHI(luot, [...nghin.slice(1), den('zalo', 'do')].slice(0, 1000))).loi === null);
  await GHI(luot, [den('zalo', 'do'), den('so_kho', 'do', cnA), den('so_kho', 'do', cnB), den('doc_so_lieu', 'xanh')]);

  const trung = await (async () => { try { await db.query(`insert into bao_dong_su_co (khoa, ma_den) values ('zalo', 'zalo')`); return null; } catch (e) { return e.message; } })();
  ok('Database chặn sự cố đang mở thứ hai cho cùng một đèn', trung !== null && /duplicate|unique/.test(trung), trung ?? 'GHI ĐƯỢC');
  const lechKhoa = await (async () => { try { await db.query(`insert into bao_dong_su_co (khoa, ma_den) values ('ipos', 'zalo')`); return null; } catch (e) { return e.message; } })();
  ok('Database chặn khóa không khớp mã đèn / chi nhánh', lechKhoa !== null && /bao_dong_su_co_khoa/.test(lechKhoa), lechKhoa ?? 'GHI ĐƯỢC');
  const { xoa } = await mot(`select confdeltype as xoa from pg_constraint where conrelid = 'bao_dong_su_co'::regclass and contype = 'f'`);
  ok('Xóa chi nhánh → xóa luôn sự cố của nó (on delete cascade)', xoa === 'c', xoa);
});

// ===========================================================================
await nhom('5 · ĐÁNH DẤU ĐÃ GỬI: GỌI LẠI KHÔNG ĐỔI MỐC', async () => {
  const z = await suCoMo('zalo'), a = await suCoMo(khoa('so_kho', cnA));
  let r = await DA_GUI('telegram', [z.id]);
  let zz = await suCoMo('zalo');
  ok('Đã gửi tin mới đỏ → bao_mo_luc + kênh', r.kq?.so_mo === 1 && zz.bao_mo_luc !== null && zz.bao_mo_kenh === 'telegram', vi(r));
  await db.query(`update bao_dong_su_co set bao_mo_luc = '2026-01-01T00:00:00Z' where id = $1`, [z.id]);
  r = await DA_GUI('telegram', [z.id]);
  zz = await suCoMo('zalo');
  ok('Gọi lại (thử lại / lượt sau) → không đánh dấu thêm, giữ mốc đầu', r.kq?.so_mo === 0
     && new Date(zz.bao_mo_luc).toISOString() === '2026-01-01T00:00:00.000Z', vi(r));
  ok('Tin hết đỏ cho sự cố CÒN ĐỎ → không đánh dấu', (await DA_GUI('telegram', [], [z.id])).kq?.so_het === 0);
  ok('Tin hết đỏ cho sự cố CHƯA BÁO → không đánh dấu', (await DA_GUI('telegram', [], [a.id])).kq?.so_het === 0);
  await GHI(luot, [den('zalo', 'xanh'), den('so_kho', 'do', cnA), den('so_kho', 'do', cnB), den('doc_so_lieu', 'xanh')]);
  r = await DA_GUI('telegram', [], [z.id]);
  const zHet = await mot(`select bao_het_luc, het_luc from bao_dong_su_co where id = $1`, [z.id]);
  ok('Đã báo + đang chờ hết đỏ → đánh dấu tin hết đỏ', r.kq?.so_het === 1 && zHet.bao_het_luc !== null, vi(r));
  ok('Rà soát: đánh dấu "đã báo hết đỏ" ĐÓNG luôn sự cố trong cùng câu lệnh — không còn sự cố "đã báo hết đỏ" mà vẫn mở',
     zHet.het_luc !== null && !(await suCoMo('zalo')), JSON.stringify(zHet));
  const moMa = await (async () => {
    try { await db.query(`update bao_dong_su_co set bao_het_luc = now() where id = $1`, [a.id]); return null; }
    catch (e) { return e.message; }
  })();
  ok('Database chặn "đã báo hết đỏ" trên sự cố còn mở (lần đỏ sau sẽ bị nuốt)', moMa !== null && /bao_dong_su_co_het_bao/.test(moMa),
     moMa ?? 'GHI ĐƯỢC');
  ok('…gọi lại → không đánh dấu thêm', (await DA_GUI('telegram', [], [z.id])).kq?.so_het === 0);
  ok('id không có thật → không lỗi, không đánh dấu', (await DA_GUI('telegram', [crypto.randomUUID()])).kq?.so_mo === 0);
  const truoc = await trangThai();
  r = await DA_GUI('telegram', [], [], true);
  const sau = await trangThai();
  ok('Tóm tắt → ghi lúc tóm tắt và lần gửi gần nhất', r.loi === null && sau.tom_tat_luc !== null && sau.lan_gui_cuoi !== null
     && truoc.tom_tat_luc === null, vi(r));
  for (const [ten, kenh] of [['"khong" (chưa có kênh thì không có gì đã gửi)', 'khong'], ['chữ hoa', 'Telegram'], ['rỗng', ''], ['null', null]]) {
    const x = await DA_GUI(kenh, [a.id]);
    ok(`Kênh ${ten} → từ chối, không đánh dấu`, x.ma === '23514' && SAI_KENH.test(x.loi ?? '')
       && (await suCoMo(khoa('so_kho', cnA))).bao_mo_luc === null, vi(x));
  }
});

// ===========================================================================
await nhom('6 · KẾT THÚC LƯỢT: CHỈ ĐÓNG SỰ CỐ ĐANG CHỜ, CÂU LỖI ĐÃ XÓA BÍ MẬT', async () => {
  // Zalo: đã báo rồi đã báo hết đỏ ở nhóm 5. Máy dịch: đỏ rồi hết đỏ — đang chờ.
  const z = await mot(`select * from bao_dong_su_co where khoa = 'zalo' order by bat_dau_luc desc limit 1`);
  const phan = [den('so_kho', 'do', cnA), den('so_kho', 'do', cnB), den('doc_so_lieu', 'xanh'), den('zalo', 'xanh')];
  await GHI(luot, [den('dich', 'do'), ...phan]);
  await GHI(luot, [den('dich', 'xanh'), ...phan]);
  const d = await suCoMo('dich'), a = await suCoMo(khoa('so_kho', cnA));
  await db.query(`update bao_dong_su_co set bao_mo_luc = now() - interval '1 hour' where id = $1`, [z.id]);
  const k = await KET_THUC(luot, [d.id, a.id]);
  ok('Đóng: chỉ sự cố đang chờ hết đỏ; sự cố còn đỏ trong danh sách không bị đóng', k.kq?.so_dong === 1
     && (await mot(`select het_luc from bao_dong_su_co where id = $1`, [d.id])).het_luc !== null
     && (await suCoMo(khoa('so_kho', cnA)))?.id === a.id, vi(k));
  const tt = await trangThai();
  ok('Nhịp tim ghi, không lỗi, nhả khóa', k.kq?.nha_khoa === true && tt.lan_chay_cuoi !== null && tt.loi_cuoi === null
     && tt.dang_chay_tu === null);

  const b = await BAT_DAU('telegram');
  luot = b.kq.luot;
  await GHI(luot, [den('zalo', 'do'), den('so_kho', 'do', cnA), den('so_kho', 'do', cnB), den('doc_so_lieu', 'xanh')]);
  const zMoi = await suCoMo('zalo');
  ok('Đóng rồi đỏ lại → sự cố MỚI (id mới, chưa báo): lần báo cũ không nuốt lần đỏ mới',
     zMoi.id !== z.id && zMoi.bao_mo_luc === null && zMoi.bao_het_luc === null);
  ok('Lần báo của sự cố ĐÃ ĐÓNG vẫn nằm trong "đã báo trong 48 giờ" (trần tin mỗi ngày của một đèn)',
     b.kq.da_bao_48_gio.some(x => x.khoa === 'zalo'), JSON.stringify(b.kq.da_bao_48_gio));

  const loi = `gửi hỏng: https://api.telegram.org/bot${TELEGRAM_GIA}/sendMessage chat 0901234567 ${TS_GIA} ${'x'.repeat(700)}`;
  await KET_THUC(luot, [], loi);
  const t2 = await trangThai();
  ok('Câu lỗi lưu lại: không token Telegram, không SĐT, không token Meta, tối đa 500 ký tự',
     typeof t2.loi_cuoi === 'string' && !conBiMat(t2.loi_cuoi) && t2.loi_cuoi.length <= 500, t2.loi_cuoi?.slice(0, 120));
  ok('bao_dong_sach_loi: null → null (lượt không lỗi)', (await mot(`select bao_dong_sach_loi(null) as x`)).x === null);
  ok('bao_dong_sach_loi xóa token Telegram TRƯỚC (mess_sach_loi một mình chỉ cắt mất phần số)',
     (await mot(`select bao_dong_sach_loi($1) as x`, [`bot${TELEGRAM_GIA}/getMe`])).x === 'bot***/getMe');
  const maHoa = (await mot(`select bao_dong_sach_loi($1) as x`, [`bot${TELEGRAM_GIA.replace(':', '%3A')}/getMe`])).x;
  ok('Rà soát: bao_dong_sach_loi xóa cả token Telegram mã hóa URL (%3A)', maHoa === 'bot***/getMe', maHoa);
  const chu = (await rpc(UID.chu, `suc_khoe_he_thong()`)).kq;
  ok('Đèn Báo động thấy lượt lỗi (co_loi) — không thấy câu lỗi', chu?.bao_dong?.co_loi === true
     && !JSON.stringify(chu.bao_dong).includes('gửi hỏng'), JSON.stringify(chu?.bao_dong));
  const b3 = await BAT_DAU('telegram');
  await KET_THUC(b3.kq.luot);
  ok('Lượt sau không lỗi → hết co_loi', (await rpc(UID.chu, `suc_khoe_he_thong()`)).kq?.bao_dong?.co_loi === false);
  luot = null;
});

// ===========================================================================
await nhom('7 · SỐ LIỆU HỎNG: LƯỢT VẪN CHẠY, KHÔNG LỘ BÍ MẬT', async () => {
  const soLieuThat = (() => {
    const s = tep('0060_'), i = s.indexOf('create or replace function suc_khoe_so_lieu(');
    return s.slice(i, s.indexOf('\n$$;', i) + 4);
  })();
  await db.exec(`create or replace function suc_khoe_so_lieu(p_chi_nhanh_ids uuid[], p_lech jsonb default null) returns jsonb language plpgsql stable
    security invoker set search_path = public as $$ begin
      raise exception 'hỏng: ${TS_GIA} gọi 0901234567 bot ${TELEGRAM_GIA}';
    end $$;`);
  let b;
  try { b = await BAT_DAU('telegram'); }
  finally { await db.exec(soLieuThat); }
  ok('Số liệu hỏng → lượt vẫn chạy (có mã lượt), so_lieu null kèm câu lỗi — Worker ghi đèn giả doc_so_lieu',
     b.loi === null && !!b.kq?.luot && b.kq.so_lieu === null && typeof b.kq.loi_so_lieu === 'string', vi(b));
  ok('Câu lỗi số liệu đã xóa token, SĐT, token Telegram', typeof b.kq?.loi_so_lieu === 'string' && !conBiMat(b.kq.loi_so_lieu),
     b.kq?.loi_so_lieu);
  await KET_THUC(b.kq.luot);
  await db.exec(`create or replace function suc_khoe_so_lieu(p_chi_nhanh_ids uuid[], p_lech jsonb default null) returns jsonb language plpgsql stable
    security invoker set search_path = public as $$ begin
      raise exception 'canceling statement due to statement timeout' using errcode = 'query_canceled';
    end $$;`);
  let h;
  try { h = await BAT_DAU('telegram'); }
  finally { await db.exec(soLieuThat); }
  ok('Rà soát: hết giờ khi đọc số liệu (statement_timeout, 57014 — "when others" không bắt) → lượt vẫn chạy, so_lieu null',
     h.loi === null && !!h.kq?.luot && h.kq.so_lieu === null && /statement timeout/.test(h.kq.loi_so_lieu ?? ''), vi(h));
  if (h.kq?.luot) await KET_THUC(h.kq.luot);
  const { q } = await mot(`select has_function_privilege('authenticated', 'suc_khoe_so_lieu(uuid[], jsonb)', 'execute') as q`);
  ok('Dựng lại hàm thật → vẫn là hàm nội bộ', q === false);
  const lai = await BAT_DAU('telegram');
  ok('…và đọc lại được số liệu', lai.kq?.so_lieu?.chi_nhanh?.length === 2, vi(lai));
  await KET_THUC(lai.kq.luot);
});

// ===========================================================================
// kho_doi_soat_ton() quét cả sổ kho (0055: "sổ lớn thì lưu kết quả đối soát định kỳ"). Bảng ở
// /noi-bo vẫn quét mỗi lần mở; máy báo động (288 lượt / ngày) dùng lại kết quả dưới 30 phút.
await nhom('7b · ĐỐI SOÁT SỔ KHO: MÁY DÙNG LẠI KẾT QUẢ DƯỚI 30 PHÚT, BẢNG VẪN QUÉT MỚI', async () => {
  const lechThat = (() => {
    const s = tep('0060_'), i = s.indexOf('create or replace function suc_khoe_lech_so_kho(');
    return s.slice(i, s.indexOf('\n$$;', i) + 4);
  })();
  const lechA = so => so?.chi_nhanh?.find(c => c.id === cnA.id)?.so_kho?.lech;
  await db.query(`update bao_dong_trang_thai set so_kho_luc = null, so_kho_lech = null where id = 1`);
  let b = await BAT_DAU('telegram');
  await KET_THUC(b.kq.luot);
  const tt = await trangThai();
  ok('Lượt đầu: quét sổ, lưu kết quả và lúc quét', lechA(b.kq.so_lieu) === 0 && tt.so_kho_luc !== null
     && JSON.stringify(tt.so_kho_lech) === '{}', JSON.stringify(tt.so_kho_lech));
  await db.exec(`create or replace function suc_khoe_lech_so_kho() returns jsonb language sql stable security invoker
    set search_path = public as $$ select jsonb_build_object('${cnA.id}', 3) $$;`);
  try {
    b = await BAT_DAU('telegram');
    await KET_THUC(b.kq.luot);
    ok('Lượt sau trong 30 phút → dùng kết quả đã lưu, KHÔNG quét lại', lechA(b.kq.so_lieu) === 0, `${lechA(b.kq.so_lieu)}`);
    const chu = (await rpc(UID.chu, `suc_khoe_he_thong()`)).kq;
    ok('Bảng ở /noi-bo vẫn quét mới mỗi lần mở (như 0055)', lechA(chu) === 3, `${lechA(chu)}`);
    await db.query(`update bao_dong_trang_thai set so_kho_luc = now() - interval '31 minutes' where id = 1`);
    b = await BAT_DAU('telegram');
    await KET_THUC(b.kq.luot);
    ok('Kết quả đã lưu quá 30 phút → quét lại, thấy lô lệch mới', lechA(b.kq.so_lieu) === 3
       && (await trangThai()).so_kho_lech?.[cnA.id] === 3, `${lechA(b.kq.so_lieu)}`);
  } finally {
    await db.exec(lechThat);
  }
  await db.query(`update bao_dong_trang_thai set so_kho_luc = null, so_kho_lech = null where id = 1`);
  const { q } = await mot(`select has_function_privilege('authenticated', 'suc_khoe_lech_so_kho()', 'execute') as q`);
  ok('Dựng lại hàm đối soát thật → vẫn là hàm nội bộ', q === false);
});

// ===========================================================================
await nhom('8 · DỌN SỰ CỐ CŨ, "ĐÃ BÁO TRONG 48 GIỜ"', async () => {
  await db.query(`
    insert into bao_dong_su_co (khoa, ma_den, bat_dau_luc, het_do_tu, mau_sau, het_luc, bao_mo_luc) values
      ('dat_ban', 'dat_ban', now() - interval '95 days', now() - interval '92 days', 'xanh', now() - interval '91 days', null),
      ('tuyen_dung', 'tuyen_dung', now() - interval '92 days', now() - interval '90 days', 'xanh', now() - interval '89 days', null),
      ('ipos', 'ipos', now() - interval '200 days', null, null, null, null),
      ('messenger', 'messenger', now() - interval '3 days', now() - interval '2 days', 'xanh', now() - interval '47 hours', now() - interval '49 hours'),
      ('dich', 'dich', now() - interval '2 days', now() - interval '1 day', 'xanh', now() - interval '20 hours', now() - interval '47 hours')`);
  const b = await BAT_DAU('telegram');
  const con = (await db.query(`select khoa from bao_dong_su_co where khoa in ('dat_ban', 'tuyen_dung', 'ipos')`)).rows.map(r => r.khoa).sort();
  ok('Sự cố đóng quá 90 ngày tự dọn; 89 ngày giữ; sự cố đang mở không bao giờ bị dọn', con.join() === 'ipos,tuyen_dung', con.join());
  const d48 = b.kq?.da_bao_48_gio ?? [];
  ok('"Đã báo trong 48 giờ": có lần báo 47 giờ trước, không có lần 49 giờ trước (kể cả sự cố đã đóng)',
     d48.some(x => x.khoa === 'dich') && !d48.some(x => x.khoa === 'messenger'), JSON.stringify(d48));
  ok('…xếp theo lúc báo', d48.every((x, i) => i === 0 || Date.parse(d48[i - 1].bao_mo_luc) <= Date.parse(x.bao_mo_luc)));
  await KET_THUC(b.kq.luot);
  await db.query(`delete from bao_dong_su_co where khoa in ('ipos', 'tuyen_dung', 'messenger', 'dich')`);
});

// ===========================================================================
await nhom('9 · ĐÈN BÁO ĐỘNG TRÊN BẢNG SỨC KHỎE', async () => {
  const { danhGiaSucKhoe } = await import(join(GOC, 'web', 'src', 'lib', 'suc-khoe.ts'));
  const denBd = async () => {
    const k = (await rpc(UID.chu, `suc_khoe_he_thong()`)).kq;
    return { o: k?.bao_dong, d: danhGiaSucKhoe(k, 'vi', true).khoi[0].den.find(x => x.ma === 'bao_dong') };
  };
  const b = await BAT_DAU('khong');
  await KET_THUC(b.kq.luot);
  let { o, d } = await denBd();
  ok('Chạy với kênh "khong" → ô bao_dong: kenh khong, có nhịp tim; đèn XÁM "chưa chọn kênh"',
     o?.kenh === 'khong' && o?.lan_chay_cuoi !== null && d?.mau === 'tat' && /chưa chọn kênh/.test(d?.cau), `${d?.mau} — ${d?.cau}`);
  const b2 = await BAT_DAU('telegram');
  await DA_GUI('telegram', [], [], true);
  await KET_THUC(b2.kq.luot);
  ({ o, d } = await denBd());
  ok('Có kênh, vừa gửi → đèn xanh "Báo qua Telegram"', o?.kenh === 'telegram' && o?.lan_gui_cuoi !== null
     && d?.mau === 'xanh' && /^Báo qua Telegram — lượt gần nhất vừa xong, tin gần nhất vừa xong\.$/.test(d?.cau), `${d?.mau} — ${d?.cau}`);
  await db.query(`update bao_dong_trang_thai set lan_chay_cuoi = now() - interval '40 minutes' where id = 1`);
  ({ d } = await denBd());
  ok('40 phút không có lượt nào chạy xong → đèn ĐỎ "đã dừng"', d?.mau === 'do' && /đã dừng/.test(d?.cau), `${d?.mau} — ${d?.cau}`);
  const b3 = await BAT_DAU('khong');
  await KET_THUC(b3.kq.luot);
});

// ===========================================================================
await nhom('10 · SỔ KHO KHÔNG BỊ ĐỤNG', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('kho_doi_soat_ton() rỗng', rows.length === 0, `${rows.length} dòng lệch`);
});

process.exit(ketThuc('BÁO ĐỘNG'));
