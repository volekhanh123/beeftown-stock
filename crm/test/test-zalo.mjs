/**
 * BEEFTOWN CRM — Kiểm thử: gửi tin Zalo ZBS, phần database (0046, 0047)
 * =====================================================================
 *
 *     node test/test-zalo.mjs
 *
 * Dựng database bằng khung của test-kho-*.mjs (kho-chung.mjs): quyền của
 * authenticated đúng là quyền trên Supabase thật, nên một hàm nội bộ lỡ để lọt
 * sẽ lộ ra ở đây. Thêm tài khoản máy may_zalo và một chi nhánh thứ ba (Q3) có
 * marketing riêng để đếm khách của chiến dịch cho chính xác.
 *
 * Kiểm: đặt bàn được nhân viên xác nhận → đúng một ZBS-01 + một ZBS-02 (giờ
 * hẹn − 2 tiếng), gọi lại không trùng (chưa xác nhận thì không tin nào — 0063,
 * kiểm kỹ ở test-zalo-xac-nhan.mjs); ZBS-02 bỏ khi đã quá; hủy / đổi giờ; mẫu chưa duyệt / tắt / Zalo
 * tắt → không xếp; khách lần đầu nhận giao dịch nhưng không nhận chăm sóc; trần
 * 2 tin/tháng (tính cả tin chờ); khung giờ; xem trước chiến dịch; lượt gửi của
 * máy (khóa, kiểm lại, ghi kết quả, thử lại); ai đọc được gì, ai gọi được gì.
 */

import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — GỬI TIN ZALO ZBS (0046, 0047)');
const { db, cnA, cnB, nsId, duoiAnon } = await dungDatabase();

// ---------------------------------------------------------------------------
// Người và nơi mà khung dùng chung chưa có
// ---------------------------------------------------------------------------
const UID_MAY_ZALO = '00000000-0000-4000-8000-0000000000e1';
const UID_MKT_C    = '00000000-0000-4000-8000-0000000000e2';
const UID_LA       = '00000000-0000-4000-8000-0000000000e3';   // đăng nhập được, không có dòng nhan_su
const UID_MAY_IPOS = '00000000-0000-4000-8000-0000000000e4';

await db.query(`update chi_nhanh set dia_chi = '40–42 Đường Thử, P. Cầu Ông Lãnh, Quận 1', dien_thoai = '0281234567' where id = $1`, [cnA.id]);
const { rows: [cnC] } = await db.query(
  `insert into chi_nhanh (ma, ten, dia_chi, dien_thoai) values ('q3', 'Beeftown Quận 3', '1 Đường Thử, Quận 3', '0287654321') returning *`);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro) values ($1, $2, 'Máy Zalo', 'may_zalo')`, [UID_MAY_ZALO, cnA.id]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro) values ($1, $2, 'Marketing Q3', 'marketing')`, [UID_MKT_C, cnC.id]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro) values ($1, $2, 'Máy iPOS', 'may_ipos')`, [UID_MAY_IPOS, cnA.id]);
for (const cn of [cnA, cnB, cnC]) {
  await db.query(`insert into cau_hinh_tich_diem (chi_nhanh_id, dang_bat) values ($1, true)`, [cn.id]);
}
for (const cn of [cnA, cnC]) {
  for (let i = 1; i <= 6; i++) {
    await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1, $2, 4)`, [cn.id, `B0${i}`]);
  }
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
const tuChoi = r => r.loi !== null && r.ma === '42501';
const vi = r => (r.loi ? `${r.ma}: ${r.loi}` : `CHẠY ĐƯỢC ${JSON.stringify(r.kq ?? r.rows)?.slice(0, 200)}`);
const q = async (sql, p = []) => (await db.query(sql, p)).rows;
const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];

// Bản mã giả đúng dạng "v1.<base64url>"; token thô thì không.
const BAN_MA_1 = 'v1.' + 'A'.repeat(40) + 'refresh1';
const BAN_MA_2 = 'v1.' + 'B'.repeat(40) + 'refresh2';
const ACCESS_1 = 'v1.' + 'C'.repeat(40) + 'access1';

const ngayCong = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const NGAY_KIA = ngayCong(2);

async function datBanWeb(sdt, ten, ngay, gio, dongY = false, cn = 'q1') {
  const r = await duoiAnon(
    `select * from tao_dat_ban($1, $2, $3, $4::date, $5::time, 2::smallint, p_dong_y => $6)`,
    [cn, sdt, ten, ngay, gio, dongY]);
  return r.loi ? { loi: r.loi } : r.rows[0];
}
/**
 * Nhân viên bấm "Đã gọi xác nhận" ở /noi-bo/dat-ban — đúng câu của trang. Từ 0063 tin ZBS chỉ
 * được xếp từ lúc này, không phải lúc khách gửi yêu cầu. Không đổi được đúng một dòng thì NÉM —
 * kiểm tra "xác nhận rồi vẫn không xếp" phía sau không được đạt nhờ việc xác nhận lặng lẽ hỏng.
 */
async function xacNhan(id, uid = UID.qlA) {
  const r = await duoi(uid, `update dat_ban set trang_thai = 'da_xac_nhan', nguoi_xu_ly = $2
                              where id = $1 and trang_thai = 'cho_xac_nhan' returning id`, [id, nsId[uid]]);
  if (r.loi !== null || r.rows.length !== 1) throw new Error(`Xác nhận đặt bàn ${id} không đổi đúng một dòng: ${vi(r)}`);
  return r;
}
const tinCuaDatBan = id => q(
  `select n.*, m.ma as mau_ma from nhat_ky_tin n join mau_tin m on m.id = n.mau_tin_id
    where n.dat_ban_id = $1 order by m.ma`, [id]);

/** Mốc giờ VN (ngày yyyy-mm-dd, giờ HH:MM) → epoch ms. */
const epochVn = (ngay, gio) => {
  const [y, mo, d] = ngay.split('-').map(Number);
  const [h, mi] = gio.split(':').map(Number);
  return Date.UTC(y, mo - 1, d, h - 7, mi);
};

// ===========================================================================
await nhom('0 · TIỀN ĐỀ — enum, chữ ký, quyền gọi hàm', async () => {
  const vai = (await q(`select unnest(enum_range(null::vai_tro))::text as v`)).map(r => r.v);
  ok('0046: vai_tro có may_zalo', vai.includes('may_zalo'));
  const kq = (await q(`select unnest(enum_range(null::ket_qua_gui))::text as v`)).map(r => r.v);
  ok('0046: ket_qua_gui có da_huy', kq.includes('da_huy'));

  for (const ham of ['duoc_phep_gui', 'chan_vai_ngoai_crm', 'xep_hang_gui_tin', 'tao_dat_ban', 'duoc_truy_cap_chi_nhanh']) {
    const { n } = await mot(`select count(*)::int as n from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                              where s.nspname = 'public' and p.proname = $1`, [ham]);
    ok(`${ham}() vẫn chỉ có MỘT bản (không đẻ overload)`, n === 1, `${n} bản`);
  }
  const { args } = await mot(`select pg_get_function_identity_arguments('duoc_phep_gui'::regproc) as args`);
  ok('duoc_phep_gui giữ nguyên chữ ký (uuid, loai_mau_tin)', args === 'p_khach_hang_id uuid, p_loai_tin loai_mau_tin', args);
  const { dinh } = await mot(`select prosecdef as dinh from pg_proc where proname = 'duoc_phep_gui'`);
  ok('duoc_phep_gui vẫn là SECURITY INVOKER', dinh === false);

  const GOI_DUOC = [
    'zalo_bat_dau_luot', 'zalo_ghi_ket_qua', 'zalo_luu_token', 'zalo_ket_thuc_luot',
    'zalo_doc_cau_hinh', 'zalo_luu_cau_hinh', 'zalo_luu_refresh_token', 'zalo_luu_mau',
    'zalo_xem_truoc_chien_dich', 'zalo_tao_chien_dich', 'zalo_dung_chien_dich', 'zalo_thu_lai', 'zalo_tong_quan',
  ].sort();
  const NOI_BO = [
    'zalo_rut_tham_so', 'zalo_mau_tin_tham_so', 'zalo_du_lieu_goc', 'zalo_loc_tham_so', 'zalo_dien_noi_dung',
    'zalo_nhat_ky_tin_dien', 'zalo_luc_hen', 'zalo_du_lieu_dat_ban', 'zalo_xep_tin_mot', 'zalo_xep_tin_dat_ban',
    'zalo_sau_dat_ban', 'zalo_sach_loi', 'zalo_khach_theo_nhom',
  ].sort();
  const ds = await q(`select p.proname, has_function_privilege('authenticated', p.oid, 'execute') as goi,
                             has_function_privilege('anon', p.oid, 'execute') as anon, p.prosecdef as dinh
                      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                      where n.nspname = 'public' and p.proname like 'zalo\\_%' order by 1`);
  const goi = ds.filter(r => r.goi).map(r => r.proname).sort();
  const khong = ds.filter(r => !r.goi).map(r => r.proname).sort();
  ok('authenticated gọi được ĐÚNG danh sách RPC zalo_ đã duyệt', goi.join() === GOI_DUOC.join(),
     `thừa: ${goi.filter(x => !GOI_DUOC.includes(x))} · thiếu: ${GOI_DUOC.filter(x => !goi.includes(x))}`);
  ok('Hàm nội bộ zalo_ đều đã rút khỏi authenticated', khong.join() === NOI_BO.join(), khong.join());
  ok('anon không gọi được hàm zalo_ nào', ds.every(r => !r.anon), ds.filter(r => r.anon).map(r => r.proname).join());
  ok('Mọi RPC zalo_ là SECURITY DEFINER', ds.filter(r => GOI_DUOC.includes(r.proname)).every(r => r.dinh));
  const kiem = await mot(`select has_function_privilege('anon', 'kiem_duoc_phep_gui(uuid,loai_mau_tin,uuid,timestamptz)', 'execute') as a,
                                 prosecdef as d from pg_proc where proname = 'kiem_duoc_phep_gui'`);
  ok('kiem_duoc_phep_gui: anon không gọi được, và là invoker (đi qua RLS người gọi)', kiem.a === false && kiem.d === false);

  const noiBo = await duoi(UID.chu, `select zalo_xep_tin_dat_ban(gen_random_uuid(), true, true)`);
  ok('Chủ gọi thẳng hàm nội bộ zalo_xep_tin_dat_ban → permission denied', /permission denied/i.test(noiBo.loi ?? ''), vi(noiBo));

  const view = await mot(`select coalesce(array_to_string(reloptions, ','), '') as o from pg_class where relname = 'v_zalo_nhat_ky'`);
  ok('v_zalo_nhat_ky là security_invoker', view.o.includes('security_invoker=true'), view.o);
  const rls = await mot(`select relrowsecurity as r from pg_class where relname = 'zalo_cau_hinh'`);
  ok('zalo_cau_hinh bật RLS', rls.r === true);
});

// ===========================================================================
await nhom('1 · MẪU TIN — tham số lấy từ <...>, văn bản B4, câu NGUNG', async () => {
  const mau = Object.fromEntries((await q(`select ma, tham_so, noi_dung, loai, bat_tu_dong, da_duyet from mau_tin`)).map(r => [r.ma, r]));
  ok('ZBS-01 có đủ tham số, đúng thứ tự xuất hiện',
     JSON.stringify(mau['ZBS-01'].tham_so) === JSON.stringify(['customer_name', 'phone', 'date', 'time', 'guests', 'booking_code', 'hotline', 'address']),
     JSON.stringify(mau['ZBS-01'].tham_so));
  ok('ZBS-02: customer_name, guests, time, address, hotline',
     JSON.stringify(mau['ZBS-02'].tham_so) === JSON.stringify(['customer_name', 'guests', 'time', 'address', 'hotline']),
     JSON.stringify(mau['ZBS-02'].tham_so));
  ok('ZBS-04 có <cash_value> (B4)', mau['ZBS-04'].tham_so.includes('cash_value'));
  ok('Không mẫu nào còn chỗ trống kiểu [hotline] / [số nhà]', Object.values(mau).every(m => !/\[[^\]]*\]/.test(m.noi_dung)));
  ok('ZBS-03 (chăm sóc) kết thúc bằng câu hủy nhận "NGUNG"', /nhắn "NGUNG" cho Beeftown\.$/.test(mau['ZBS-03'].noi_dung));
  ok('Mặc định: chưa duyệt, chưa tự động', Object.values(mau).every(m => !m.da_duyet && !m.bat_tu_dong));

  const loi = await db.query(`insert into mau_tin (ma, ten, loai, noi_dung) values ('ZBS-99', 'Thử', 'cham_soc', 'Ưu đãi <x>')`)
    .then(() => null, e => e.message);
  ok('Mẫu chăm sóc thiếu câu NGUNG bị CHECK từ chối', loi !== null && /mau_tin_cham_soc_co_huy_nhan/.test(loi), loi ?? 'CHÈN ĐƯỢC');

  await db.query(`update mau_tin set noi_dung = noi_dung || ' <moi_them>' where ma = 'ZBS-04'`);
  const { tham_so } = await mot(`select tham_so from mau_tin where ma = 'ZBS-04'`);
  ok('Sửa nội dung → tham_so tự tính lại', tham_so.at(-1) === 'moi_them');
  await db.query(`update mau_tin set noi_dung = replace(noi_dung, ' <moi_them>', '') where ma = 'ZBS-04'`);
});

// ===========================================================================
let datBanChinh;   // đặt bàn dùng lại ở các nhóm sau
await nhom('2 · CHƯA SẴN SÀNG → KHÔNG XẾP GÌ (mẫu chưa duyệt / không tự động / Zalo tắt)', async () => {
  const d1 = await datBanWeb('0901000001', 'Khách Một', NGAY_KIA, '18:00');
  ok('Đặt bàn web vẫn chạy', !d1.loi && d1.ma_dat_ban?.length === 6, d1.loi ?? '');
  await xacNhan(d1.dat_ban_id);
  ok('Mẫu chưa duyệt → xác nhận rồi vẫn không xếp tin nào', (await tinCuaDatBan(d1.dat_ban_id)).length === 0);

  for (const ma of ['ZBS-01', 'ZBS-02']) {
    const r = await rpc(UID.chu, `zalo_luu_mau($1, $2, true, false)`, [ma, `tpl_${ma.slice(-2)}`]);
    ok(`Chủ duyệt ${ma} (chưa bật tự động)`, r.kq?.ok === true && r.kq.da_duyet === true, vi(r));
  }
  const d2 = await datBanWeb('0901000002', 'Khách Hai', NGAY_KIA, '18:00');
  await xacNhan(d2.dat_ban_id);
  ok('Đã duyệt nhưng bat_tu_dong = false → xác nhận rồi vẫn không xếp', (await tinCuaDatBan(d2.dat_ban_id)).length === 0);

  for (const ma of ['ZBS-01', 'ZBS-02']) {
    await rpc(UID.chu, `zalo_luu_mau($1, $2, true, true)`, [ma, `tpl_${ma.slice(-2)}`]);
  }
  const d3 = await datBanWeb('0901000003', 'Khách Ba', NGAY_KIA, '18:30');
  await xacNhan(d3.dat_ban_id);
  ok('Mẫu sẵn sàng nhưng zalo_cau_hinh.dang_bat = false → xác nhận rồi vẫn không xếp', (await tinCuaDatBan(d3.dat_ban_id)).length === 0);

  // Bật Zalo: cần App ID, OA ID, refresh token (bản mã).
  const thieu = await rpc(UID.chu, `zalo_luu_cau_hinh(p_app_id => '123456', p_oa_id => '654321', p_dang_bat => true)`);
  ok('Bật khi chưa có refresh token → bị từ chối', thieu.ma === '23514' && /refresh token/.test(thieu.loi), vi(thieu));
  const tho = await rpc(UID.chu, `zalo_luu_refresh_token('abcDEF123_token_tho_dan_nham_vao_o_nay_khong_ma_hoa')`);
  ok('Dán refresh token THÔ (chưa mã hóa) → bị từ chối', tho.ma === '23514', vi(tho));
  const luu = await rpc(UID.chu, `zalo_luu_refresh_token($1)`, [BAN_MA_1]);
  ok('Lưu refresh token dạng bản mã', luu.kq?.ok === true && luu.kq.co_refresh_token === true, vi(luu));
  const bat = await rpc(UID.chu, `zalo_luu_cau_hinh(p_app_id => '123456', p_oa_id => '654321', p_dang_bat => true)`);
  ok('Chủ bật gửi tin Zalo', bat.kq?.dang_bat === true && bat.kq.co_refresh_token === true, vi(bat));
  ok('…kết quả không chứa bản mã token', !JSON.stringify(bat.kq).includes(BAN_MA_1) && !/ma_hoa/.test(JSON.stringify(bat.kq)));

  const ql = await rpc(UID.qlA, `zalo_luu_cau_hinh(p_dang_bat => false)`);
  ok('Quản lý KHÔNG sửa được cài đặt Zalo', tuChoi(ql), vi(ql));
  const gio = await rpc(UID.chu, `zalo_luu_cau_hinh(p_gio_tu => '21:00'::time, p_gio_den => '08:00'::time)`);
  ok('Khung giờ ngược → bị từ chối', gio.ma === '23514', vi(gio));
  const tran = await rpc(UID.chu, `zalo_luu_cau_hinh(p_tran_cham_soc_thang => 3)`);
  ok('Trần 3 tin/tháng → bị từ chối (tối đa 2)', tran.ma === '23514', vi(tran));
  const mauSai = await rpc(UID.chu, `zalo_luu_mau('ZBS-03', null, true, false)`);
  ok('Đánh dấu đã duyệt mà không có mã Zalo → bị từ chối', mauSai.ma === '23514', vi(mauSai));
  const mktMau = await rpc(UID.mktA, `zalo_luu_mau('ZBS-03', 'x', true, false)`);
  ok('Marketing KHÔNG sửa được mẫu', tuChoi(mktMau), vi(mktMau));
});

// ===========================================================================
await nhom('3 · XÁC NHẬN ĐẶT BÀN → MỘT ZBS-01 NGAY + MỘT ZBS-02 LÚC GIỜ HẸN − 2 TIẾNG', async () => {
  const d = await datBanWeb('0901000010', 'Nguyễn Văn Đặt', NGAY_KIA, '18:00', true);
  datBanChinh = d;
  ok('Khách đặt bàn web (anon) thành công', !d.loi, d.loi ?? '');
  ok('Yêu cầu chưa xác nhận → chưa xếp tin nào (0063)', (await tinCuaDatBan(d.dat_ban_id)).length === 0);
  const xn = await xacNhan(d.dat_ban_id);
  ok('Quản lý bấm "Đã gọi xác nhận"', xn.loi === null && xn.rows.length === 1, vi(xn));
  const tin = await tinCuaDatBan(d.dat_ban_id);
  ok('Đúng hai tin: ZBS-01 và ZBS-02', tin.map(t => t.mau_ma).join() === 'ZBS-01,ZBS-02', tin.map(t => t.mau_ma).join());
  const [t1, t2] = tin;

  ok('ZBS-01: cho_gui, giao_dich, khoa_gui ZBS-01:dat_ban:<id>',
     t1.ket_qua === 'cho_gui' && t1.loai_tin === 'giao_dich' && t1.khoa_gui === `ZBS-01:dat_ban:${d.dat_ban_id}`);
  ok('ZBS-01 gửi ngay (gui_sau ≈ bây giờ)', Math.abs(new Date(t1.gui_sau).getTime() - Date.now()) < 60_000, String(t1.gui_sau));
  const muon = epochVn(NGAY_KIA, '18:00') - 2 * 3600_000;
  ok('ZBS-02 hẹn đúng giờ đặt (giờ VN) − 2 tiếng', new Date(t2.gui_sau).getTime() === muon,
     `${new Date(t2.gui_sau).toISOString()} ≠ ${new Date(muon).toISOString()}`);
  ok('ZBS-02 khoa_gui ZBS-02:dat_ban:<id>', t2.khoa_gui === `ZBS-02:dat_ban:${d.dat_ban_id}`);

  const [y, m, dd] = NGAY_KIA.split('-');
  ok('template_data của ZBS-01 đúng và CHỈ gồm tham số của mẫu',
     JSON.stringify(Object.keys(t1.du_lieu).sort()) === JSON.stringify(['address', 'booking_code', 'customer_name', 'date', 'guests', 'hotline', 'phone', 'time'])
     && t1.du_lieu.customer_name === 'Nguyễn Văn Đặt' && t1.du_lieu.phone === '0901000010'
     && t1.du_lieu.date === `${dd}/${m}/${y}` && t1.du_lieu.time === '18:00' && t1.du_lieu.guests === '2'
     && t1.du_lieu.booking_code === d.ma_dat_ban && t1.du_lieu.hotline === '0281234567'
     && t1.du_lieu.address.startsWith('40–42'), JSON.stringify(t1.du_lieu));
  ok('template_data ZBS-02 không có tham số thừa', Object.keys(t2.du_lieu).sort().join() === 'address,customer_name,guests,hotline,time');
  ok('noi_dung đã điền, không còn <...>', !/<[a-z_]+>/.test(t1.noi_dung) && t1.noi_dung.includes(d.ma_dat_ban));
  ok('sdt_gui là SĐT chuẩn 0xxxxxxxxx', t1.sdt_gui === '0901000010');

  // Gọi lại: trigger chạy lại, hàm xếp chạy lại — không trùng.
  await db.query(`select zalo_xep_tin_dat_ban($1, true, true)`, [d.dat_ban_id]);
  await db.query(`update dat_ban set trang_thai = 'da_xac_nhan' where id = $1`, [d.dat_ban_id]);
  const cn = await duoi(UID.qlA, `update dat_ban set so_khach = 2 where id = $1`, [d.dat_ban_id]);
  ok('Quản lý sửa đặt bàn vẫn chạy (trigger không chặn)', cn.loi === null, vi(cn));
  ok('Gọi lại / cập nhật đặt bàn → vẫn đúng hai tin', (await tinCuaDatBan(d.dat_ban_id)).length === 2);

  // Khách lần đầu: có giao dịch (đặt bàn) nhưng chưa ghé → giao_dich được, cham_soc thì không.
  const kh = (await mot(`select khach_hang_id from dat_ban where id = $1`, [d.dat_ban_id])).khach_hang_id;
  const gd = await mot(`select * from duoc_phep_gui($1, 'giao_dich')`, [kh]);
  const cs = await mot(`select * from duoc_phep_gui($1, 'cham_soc')`, [kh]);
  ok('Khách lần đầu đặt bàn: được nhận tin GIAO DỊCH', gd.duoc_gui === true, gd.ly_do);
  ok('…nhưng KHÔNG được nhận tin CHĂM SÓC dù đã tick đồng ý', cs.duoc_gui === false && /chưa từng giao dịch/.test(cs.ly_do), cs.ly_do);
});

// ===========================================================================
await nhom('4 · ZBS-02 BỎ KHI ĐÃ QUÁ; HỦY / ĐỔI GIỜ / ĐÃ ĐẾN', async () => {
  // Đặt bàn 1 tiếng nữa: giờ nhắc (−2 tiếng) đã qua.
  const { ngay, gio } = await mot(`select to_char(bay_gio_vn() + interval '1 hour', 'YYYY-MM-DD') as ngay,
                                          to_char(bay_gio_vn() + interval '1 hour', 'HH24:MI') as gio`);
  const kh = await mot(`select * from tim_hoac_tao_khach('0901000020', 'Khách Sát Giờ', $1)`, [cnA.id]);
  const { id: dSat } = await mot(`insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach, ma_dat_ban)
                                  values ($1, $2, $3::date, $4::time, 2, sinh_ma_dat_ban()) returning id`, [cnA.id, kh.id, ngay, gio]);
  await xacNhan(dSat);
  const t = await tinCuaDatBan(dSat);
  ok('Đặt bàn sát giờ được xác nhận: có ZBS-01, KHÔNG có ZBS-02', t.map(x => x.mau_ma).join() === 'ZBS-01', t.map(x => x.mau_ma).join());

  // Đổi giờ: quản lý dời sang ngày kia 20:00 → ZBS-02 dời theo, tham số cập nhật.
  const d = await datBanWeb('0901000021', 'Khách Đổi Giờ', NGAY_KIA, '19:00');
  await xacNhan(d.dat_ban_id);
  const ngay3 = ngayCong(3);
  const doi = await duoi(UID.qlA, `update dat_ban set ngay = $2::date, gio = '20:00' where id = $1`, [d.dat_ban_id, ngay3]);
  ok('Quản lý đổi giờ đặt bàn', doi.loi === null, vi(doi));
  let [a1, a2] = await tinCuaDatBan(d.dat_ban_id);
  ok('Đổi giờ: ZBS-02 dời sang giờ mới − 2 tiếng', new Date(a2.gui_sau).getTime() === epochVn(ngay3, '20:00') - 7200_000
     && a2.ket_qua === 'cho_gui', String(a2.gui_sau));
  ok('Đổi giờ: tham số giờ của cả hai tin đang chờ thành 20:00', a1.du_lieu.time === '20:00' && a2.du_lieu.time === '20:00'
     && a1.noi_dung.includes('20:00'));

  // Dời về sát giờ → ZBS-02 hủy; dời ra xa lại → ZBS-02 sống lại (không đẻ tin mới).
  await db.query(`update dat_ban set ngay = $2::date, gio = $3::time where id = $1`, [d.dat_ban_id, ngay, gio]);
  [, a2] = await tinCuaDatBan(d.dat_ban_id);
  ok('Dời về sát giờ → ZBS-02 da_huy', a2.ket_qua === 'da_huy' && /sát/.test(a2.loi), `${a2.ket_qua} · ${a2.loi}`);
  await db.query(`update dat_ban set ngay = $2::date, gio = '21:00' where id = $1`, [d.dat_ban_id, ngay3]);
  const lai = await tinCuaDatBan(d.dat_ban_id);
  ok('Dời ra xa lại → ZBS-02 chờ gửi lại, vẫn đúng hai tin',
     lai.length === 2 && lai[1].ket_qua === 'cho_gui' && new Date(lai[1].gui_sau).getTime() === epochVn(ngay3, '21:00') - 7200_000);

  // Khách tự hủy trên website (anon) → mọi tin chờ thành da_huy.
  const huy = await duoiAnon(`select huy_dat_ban($1, '0901000021', 'bận') as ok`, [d.ma_dat_ban]);
  ok('Khách tự hủy đặt bàn trên web vẫn chạy', huy.loi === null && huy.rows[0].ok === true, huy.loi ?? '');
  const sauHuy = await tinCuaDatBan(d.dat_ban_id);
  ok('Hủy đặt bàn → ZBS-01 và ZBS-02 đang chờ đều da_huy',
     sauHuy.every(x => x.ket_qua === 'da_huy' && x.loi === 'Khách đã hủy đặt bàn'), sauHuy.map(x => x.ket_qua).join());
  const khHuy = (await mot(`select khach_hang_id from dat_ban where id = $1`, [d.dat_ban_id])).khach_hang_id;
  const gd = await mot(`select * from duoc_phep_gui($1, 'giao_dich')`, [khHuy]);
  ok('Khách chỉ có đặt bàn ĐÃ HỦY, chưa ghé → không còn được nhận tin giao dịch', gd.duoc_gui === false, gd.ly_do);

  // Đã đến: chỉ ZBS-02 bị hủy.
  const d2 = await datBanWeb('0901000022', 'Khách Đến Sớm', NGAY_KIA, '19:30');
  await xacNhan(d2.dat_ban_id);
  await duoi(UID.qlA, `update dat_ban set trang_thai = 'da_den' where id = $1`, [d2.dat_ban_id]);
  const den = await tinCuaDatBan(d2.dat_ban_id);
  ok('Khách đã đến → ZBS-02 da_huy, ZBS-01 giữ nguyên', den[0].ket_qua === 'cho_gui' && den[1].ket_qua === 'da_huy',
     den.map(x => x.ket_qua).join());
});

// ===========================================================================
await nhom('5 · TRIGGER KHÔNG BAO GIỜ LÀM HỎNG ĐẶT BÀN', async () => {
  await db.exec(`alter table nhat_ky_tin add constraint thu_hong check (khoa_gui is null or khoa_gui not like 'ZBS-%') not valid`);
  try {
    const d = await datBanWeb('0901000030', 'Khách Lúc Lỗi', NGAY_KIA, '12:00');
    ok('Đặt bàn web vẫn ghi được khi bộ xếp tin đang hỏng', !d.loi && d.ma_dat_ban?.length === 6, d.loi ?? '');
    const xn = await xacNhan(d.dat_ban_id);
    ok('Xếp tin lỗi mà bấm "Đã gọi xác nhận" VẪN ghi được', xn.loi === null && xn.rows.length === 1, vi(xn));
    ok('…không tin nào được xếp', (await tinCuaDatBan(d.dat_ban_id)).length === 0);
    const { loi_cuoi } = await mot(`select loi_cuoi from zalo_cau_hinh`);
    ok('…lỗi được ghi vào zalo_cau_hinh.loi_cuoi, có mã đặt bàn',
       loi_cuoi?.startsWith('Xếp tin Zalo cho đặt bàn ' + d.ma_dat_ban), loi_cuoi ?? '(trống)');
  } finally {
    await db.exec(`alter table nhat_ky_tin drop constraint thu_hong`);
  }
});

// ===========================================================================
// Chi nhánh Q3: khách biết trước từng người để đếm chiến dịch cho chính xác.
const K = {};
await nhom('6 · CHIẾN DỊCH — xem trước, loại người không đủ điều kiện, trần 2 tin/tháng', async () => {
  const taoKhach = async (sdt, dongY, cn = cnC) => {
    const { khach_hang_id } = await mot(`select khach_hang_id from ghi_luot_ghe($1, $2, 300000::bigint)`, [cn.id, sdt]);
    if (dongY) await db.query(`insert into nhat_ky_dong_y (khach_hang_id, dong_y, kenh, noi_dung) values ($1, true, 'quay', 'đồng ý')`, [khach_hang_id]);
    return khach_hang_id;
  };
  K.dat     = await taoKhach('0903000001', true);    // đủ điều kiện
  K.chuaDY  = await taoKhach('0903000002', false);   // chưa đồng ý
  K.daXoa   = await taoKhach('0903000003', true);    // đã yêu cầu xóa
  await db.query(`update khach_hang set dang_hoat_dong = false where id = $1`, [K.daXoa]);
  K.duTran  = await taoKhach('0903000006', true);    // đã đủ 2 tin tháng này
  K.khacCn  = await taoKhach('0903000005', true, cnB); // khách chi nhánh khác
  const lanDau = await datBanWeb('0903000004', 'Khách Mới Đặt', NGAY_KIA, '18:00', true, 'q3');  // chưa ghé
  K.lanDau = (await mot(`select khach_hang_id from dat_ban where id = $1`, [lanDau.dat_ban_id])).khach_hang_id;
  await xacNhan(lanDau.dat_ban_id, UID.chu);

  await rpc(UID.chu, `zalo_luu_mau('ZBS-03', 'tpl_03', true, false)`);
  const { id: mau03 } = await mot(`select id from mau_tin where ma = 'ZBS-03'`);
  // Một tin đã gửi + một tin đang chờ trong tháng này — tin CHỜ cũng tính vào trần.
  await db.query(`insert into nhat_ky_tin (chi_nhanh_id, khach_hang_id, mau_tin_id, sdt_gui, ket_qua, gui_luc)
                  values ($1, $2, $3, '0903000006', 'da_gui', now())`, [cnC.id, K.duTran, mau03]);
  await db.query(`insert into nhat_ky_tin (chi_nhanh_id, khach_hang_id, mau_tin_id, sdt_gui, ket_qua, gui_sau)
                  values ($1, $2, $3, '0903000006', 'cho_gui', now())`, [cnC.id, K.duTran, mau03]);
  const tran = await mot(`select * from duoc_phep_gui($1, 'cham_soc')`, [K.duTran]);
  ok('Trần 2 tin chăm sóc/tháng tính cả tin đang chờ', tran.duoc_gui === false && tran.ly_do === 'Khách đã đủ 2 tin chăm sóc trong tháng', tran.ly_do);
  const tranGd = await mot(`select * from duoc_phep_gui($1, 'giao_dich')`, [K.duTran]);
  ok('…tin giao dịch không bị trần', tranGd.duoc_gui === true);

  const xt = await rpc(UID_MKT_C, `zalo_xem_truoc_chien_dich($1, 'ZBS-03')`, [cnC.id]);
  const lyDo = Object.fromEntries((xt.kq?.bi_loai ?? []).map(x => [x.ly_do, x.so]));
  ok('Xem trước: 5 khách của Q3, 1 đủ điều kiện', xt.kq?.tong === 5 && xt.kq?.du_dieu_kien === 1, vi(xt));
  ok('…đếm đúng từng lý do bị loại',
     lyDo['Khách chưa đồng ý nhận tin quảng cáo'] === 1 && lyDo['Khách đã yêu cầu xoá dữ liệu'] === 1
     && lyDo['Khách chưa từng giao dịch — Zalo không cho gửi'] === 1 && lyDo['Khách đã đủ 2 tin chăm sóc trong tháng'] === 1,
     JSON.stringify(lyDo));
  ok('…báo tham số cần nhập (google_review_link) và mẫu sẵn sàng',
     JSON.stringify(xt.kq?.tham_so_can_nhap) === '["google_review_link"]' && xt.kq?.mau?.san_sang === true && xt.kq?.tran_thang === 2);
  ok('…không lộ SĐT', !/0\d{9}/.test(JSON.stringify(xt.kq)));
  const nhom = await rpc(UID_MKT_C, `zalo_xem_truoc_chien_dich($1, 'ZBS-03', 'ngu_dong')`, [cnC.id]);
  ok('Lọc nhóm "ngủ đông" (chưa ai) → 0 khách', nhom.kq?.tong === 0, vi(nhom));
  const nhomSai = await rpc(UID_MKT_C, `zalo_xem_truoc_chien_dich($1, 'ZBS-03', 'nhom_bia')`, [cnC.id]);
  ok('Nhóm không có → 23514', nhomSai.ma === '23514', vi(nhomSai));
  const gd = await rpc(UID_MKT_C, `zalo_xem_truoc_chien_dich($1, 'ZBS-01')`, [cnC.id]);
  ok('Mẫu giao dịch không dùng cho chiến dịch', gd.ma === '23514', vi(gd));

  const TAO = `zalo_tao_chien_dich($1, $2::uuid, 'ZBS-03', null, 'Xin đánh giá tháng này', $3::jsonb)`;
  const thieu = await rpc(UID_MKT_C, TAO, [cnC.id, crypto.randomUUID(), '{}']);
  ok('Thiếu google_review_link → bị từ chối', thieu.ma === '23514' && /google_review_link/.test(thieu.loi), vi(thieu));

  const MA_GUI = crypto.randomUUID();
  const DL = JSON.stringify({ google_review_link: 'https://g.page/r/thu', thua: 'bị bỏ' });
  const cd = await rpc(UID_MKT_C, TAO, [cnC.id, MA_GUI, DL]);
  ok('Tạo chiến dịch: đúng 1 tin (chỉ khách đủ điều kiện)', cd.kq?.ok === true && cd.kq.so_tin === 1 && cd.kq.trung === false, vi(cd));
  const tin = await q(`select * from nhat_ky_tin where chien_dich_id = $1`, [cd.kq.chien_dich_id]);
  ok('…tin đó là của đúng khách, loại cham_soc, khoa_gui CD:<cd>:<khách>',
     tin.length === 1 && tin[0].khach_hang_id === K.dat && tin[0].loai_tin === 'cham_soc'
     && tin[0].khoa_gui === `CD:${cd.kq.chien_dich_id}:${K.dat}`);
  ok('…template_data chỉ gồm tham số của mẫu (bỏ khóa thừa)',
     Object.keys(tin[0].du_lieu).sort().join() === 'customer_name,google_review_link'
     && tin[0].du_lieu.google_review_link === 'https://g.page/r/thu', JSON.stringify(tin[0].du_lieu));
  const lai = await rpc(UID_MKT_C, TAO, [cnC.id, MA_GUI, DL]);
  ok('Bấm gửi lần hai (cùng ma_gui) → trả lại chiến dịch cũ, không thêm tin',
     lai.kq?.trung === true && lai.kq.chien_dich_id === cd.kq.chien_dich_id
     && (await mot(`select count(*)::int as n from chien_dich where ma_gui = $1`, [MA_GUI])).n === 1
     && (await mot(`select count(*)::int as n from nhat_ky_tin where chien_dich_id = $1`, [cd.kq.chien_dich_id])).n === 1, vi(lai));

  for (const [ai, uid] of [['Marketing Q1 (chi nhánh khác)', UID.mktA], ['Thu ngân Q1', UID.thuNganA],
                           ['Máy Zalo', UID_MAY_ZALO], ['Thủ kho Q1', UID.thuKhoA], ['Tài khoản không phải nhân sự', UID_LA]]) {
    const r = await rpc(uid, TAO, [cnC.id, crypto.randomUUID(), DL]);
    ok(`${ai} KHÔNG tạo được chiến dịch Q3`, tuChoi(r), vi(r));
  }

  // Tin thứ hai trong tháng → được; thứ ba → khách bị loại vì trần.
  const cd2 = await rpc(UID_MKT_C, TAO, [cnC.id, crypto.randomUUID(), DL]);
  ok('Chiến dịch thứ hai trong tháng → khách vẫn nhận (1 + 1 = 2)', cd2.kq?.so_tin === 1, vi(cd2));
  const cd3 = await rpc(UID_MKT_C, TAO, [cnC.id, crypto.randomUUID(), DL]);
  ok('Chiến dịch thứ ba → 0 tin, cả hai khách đồng ý đều bị loại vì trần', cd3.kq?.so_tin === 0 && cd3.kq.bi_loai === 2, vi(cd3));
  const xep = await duoi(UID_MKT_C, `select xep_hang_gui_tin($1, $2, 'ZBS-03') as id`, [cnC.id, K.dat]);
  ok('xep_hang_gui_tin() cũng hưởng trần qua duoc_phep_gui', xep.ma === '23514' && /đủ 2 tin/.test(xep.loi ?? ''), vi(xep));

  // Hẹn sang tháng sau: trần tính theo tháng của giờ gửi.
  const { dau } = await mot(`select ((date_trunc('month', bay_gio_vn()) + interval '1 month 1 day 10 hours')
                                     - interval '7 hours') at time zone 'utc' as dau`);
  const cd4 = await rpc(UID_MKT_C, `zalo_tao_chien_dich($1, $2::uuid, 'ZBS-03', 'tat_ca', 'Tháng sau', $3::jsonb, $4::timestamptz)`,
                        [cnC.id, crypto.randomUUID(), DL, dau]);
  ok('Hẹn sang tháng sau → cả hai khách nhận được (trần tính theo tháng gửi)', cd4.kq?.so_tin === 2, vi(cd4));
  const dung = await rpc(UID_MKT_C, `zalo_dung_chien_dich($1)`, [cd4.kq.chien_dich_id]);
  const sauDung = await mot(`select trang_thai from chien_dich where id = $1`, [cd4.kq.chien_dich_id]);
  ok('Dừng chiến dịch → tin chờ da_huy, chiến dịch tam_dung', dung.kq?.so_huy === 2 && sauDung.trang_thai === 'tam_dung', vi(dung));
  const dungSai = await rpc(UID.mktA, `zalo_dung_chien_dich($1)`, [cd.kq.chien_dich_id]);
  ok('Marketing chi nhánh khác KHÔNG dừng được chiến dịch Q3', tuChoi(dungSai), vi(dungSai));

  const qua = await rpc(UID_MKT_C, `zalo_tao_chien_dich($1, $2::uuid, 'ZBS-03', null, 'Quá khứ', $3::jsonb, now() - interval '1 hour')`,
                        [cnC.id, crypto.randomUUID(), DL]);
  ok('Giờ gửi đã qua → bị từ chối', qua.ma === '23514', vi(qua));

  // Hồi quy: hai lời tạo cùng lúc (bấm hai lần / hai người cùng tạo) từng chạy song song — lời
  // thứ hai vỡ unique ma_gui (23505 hiện thẳng ra màn), hoặc hai chiến dịch cùng thấy khách "còn
  // chỗ" trong trần tháng. PGlite chỉ có một kết nối nên kiểm bằng thân hàm: khóa giao dịch nằm
  // TRƯỚC chỗ tìm ma_gui và trước chỗ đếm trần.
  const { src } = await mot(`select prosrc as src from pg_proc where proname = 'zalo_tao_chien_dich'`);
  const iKhoa = src.indexOf('pg_advisory_xact_lock('), iTim = src.indexOf('where ma_gui = p_ma_gui'), iDem = src.indexOf('kiem_duoc_phep_gui(');
  ok('Hồi quy: zalo_tao_chien_dich khóa pg_advisory_xact_lock trước khi tìm ma_gui và đếm trần',
     iKhoa > 0 && iKhoa < iTim && iKhoa < iDem, `${iKhoa} / ${iTim} / ${iDem}`);
  const maLai = crypto.randomUUID();
  const lan1 = await rpc(UID_MKT_C, `zalo_tao_chien_dich($1, $2::uuid, 'ZBS-03', 'tat_ca', 'Hai lần', $3::jsonb, $4::timestamptz)`,
                         [cnC.id, maLai, DL, dau]);
  const lan2 = await rpc(UID_MKT_C, `zalo_tao_chien_dich($1, $2::uuid, 'ZBS-03', 'tat_ca', 'Hai lần', $3::jsonb, $4::timestamptz)`,
                         [cnC.id, maLai, DL, dau]);
  ok('Cùng ma_gui gọi hai lần (có khóa) → lần hai trung, cùng chiến dịch',
     lan1.kq?.ok && lan2.kq?.trung === true && lan2.kq.chien_dich_id === lan1.kq.chien_dich_id, vi(lan2));
  // Dọn để các nhóm sau đếm chiến dịch / tin như cũ.
  await db.query(`delete from nhat_ky_tin where chien_dich_id = $1`, [lan1.kq?.chien_dich_id]);
  await db.query(`delete from chien_dich where id = $1`, [lan1.kq?.chien_dich_id]);
});

// ===========================================================================
const { g: GIO_VN } = await mot(`select to_char(gio_vn(), 'HH24:MI:SS') as g`);
const phut = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const hhmm = p => `${String(Math.floor(p / 60)).padStart(2, '0')}:${String(p % 60).padStart(2, '0')}`;
const TRONG = [hhmm(Math.max(0, phut(GIO_VN) - 30)), phut(GIO_VN) + 31 >= 24 * 60 ? '23:59:59' : hhmm(phut(GIO_VN) + 31)];
const NGOAI = phut(GIO_VN) >= 12 * 60 ? ['01:00', '02:00'] : ['20:00', '21:00'];

let lo1 = [];
await nhom('7 · LƯỢT GỬI CỦA MÁY — khung giờ, khóa 10 phút, kiểm lại lúc lấy', async () => {
  await rpc(UID.chu, `zalo_luu_cau_hinh(p_gio_tu => $1::time, p_gio_den => $2::time)`, NGOAI);
  const b1 = await rpc(UID_MAY_ZALO, `zalo_bat_dau_luot(50)`);
  ok('Máy Zalo bắt đầu lượt', b1.kq?.khoa === false && b1.kq?.dang_bat === true && Array.isArray(b1.kq?.lo), vi(b1));
  ok('…trả cấu hình kèm refresh token BẢN MÃ', b1.kq?.cau_hinh?.refresh_token_ma_hoa === BAN_MA_1
     && b1.kq.cau_hinh.app_id === '123456' && b1.kq.cau_hinh.oa_id === '654321' && b1.kq.cau_hinh.che_do === 'thu');
  ok('Ngoài khung giờ: lô KHÔNG có tin chăm sóc', b1.kq.lo.length > 0 && b1.kq.lo.every(t => t.loai_tin === 'giao_dich'),
     b1.kq.lo.map(t => `${t.mau_ma}/${t.loai_tin}`).join());
  const zbs01 = b1.kq.lo[0];
  ok('Mỗi tin có id, sdt, template_id, du_lieu, lan_thu = 1',
     zbs01.id && /^0\d{9}$/.test(zbs01.sdt) && zbs01.template_id?.startsWith('tpl_') && typeof zbs01.du_lieu === 'object' && zbs01.lan_thu === 1,
     JSON.stringify(zbs01));
  ok('Không lấy ZBS-02 chưa tới giờ', !b1.kq.lo.some(t => t.mau_ma === 'ZBS-02'));
  const { n: choCs } = await mot(`select count(*)::int as n from nhat_ky_tin where loai_tin = 'cham_soc' and ket_qua = 'cho_gui' and dang_gui_tu is null`);
  ok('Tin chăm sóc vẫn nằm chờ (không bị lấy, không bị hủy)', choCs >= 3, `${choCs}`);

  const b2 = await rpc(UID_MAY_ZALO, `zalo_bat_dau_luot(50)`);
  ok('Gọi lượt thứ hai trong 10 phút → bị khóa, lô rỗng, không có token',
     b2.kq?.khoa === true && b2.kq.lo.length === 0 && b2.kq.cau_hinh === null, vi(b2));

  const kt = await rpc(UID_MAY_ZALO, `zalo_ket_thuc_luot(null, 1234)`);
  ok('Kết thúc lượt: trả lại tin chưa báo kết quả', kt.kq?.ok === true && kt.kq.so_tin_tra_lai === b1.kq.lo.length, vi(kt));
  const cfg = await mot(`select dang_chay_tu, lan_chay_cuoi, quota_con from zalo_cau_hinh`);
  ok('…nhả khóa, ghi lần chạy cuối và quota', cfg.dang_chay_tu === null && cfg.lan_chay_cuoi !== null && cfg.quota_con === 1234);

  // Kiểm lại lúc lấy: khách của một tin giao dịch vừa yêu cầu xóa dữ liệu.
  const khXoa = (await mot(`select khach_hang_id from dat_ban where id = $1`, [datBanChinh.dat_ban_id])).khach_hang_id;
  await db.query(`update khach_hang set dang_hoat_dong = false where id = $1`, [khXoa]);

  await rpc(UID.chu, `zalo_luu_cau_hinh(p_gio_tu => $1::time, p_gio_den => $2::time)`, TRONG);
  const b3 = await rpc(UID_MAY_ZALO, `zalo_bat_dau_luot(50)`);
  lo1 = b3.kq?.lo ?? [];
  const cs = lo1.filter(t => t.loai_tin === 'cham_soc');
  ok('Trong khung giờ: lô có tin chăm sóc', cs.length >= 3, `${cs.length} tin chăm sóc`);
  ok('…gồm CẢ HAI tin tháng này của khách đủ điều kiện (trần không đếm chính tin đang xét)',
     cs.filter(t => t.sdt === '0903000001').length === 2, cs.map(t => t.sdt).join());
  const tuChoiLai = await mot(`select ket_qua, loi from nhat_ky_tin where khoa_gui = $1`, [`ZBS-01:dat_ban:${datBanChinh.dat_ban_id}`]);
  ok('Kiểm lại lúc lấy: khách đã yêu cầu xóa → bi_tu_choi, không vào lô',
     tuChoiLai.ket_qua === 'bi_tu_choi' && tuChoiLai.loi === 'Khách đã yêu cầu xoá dữ liệu'
     && !lo1.some(t => t.sdt === '0901000010'), JSON.stringify(tuChoiLai));
  await db.query(`update khach_hang set dang_hoat_dong = true where id = $1`, [khXoa]);
});

// ===========================================================================
await nhom('8 · GHI KẾT QUẢ, THỬ LẠI, TOKEN', async () => {
  const [tA, tB, tC, tD, tE] = lo1;
  ok('(có đủ 5 tin trong lô để thử)', lo1.length >= 5, `${lo1.length}`);

  const gui = await rpc(UID_MAY_ZALO, `zalo_ghi_ket_qua($1, 'da_gui', 'msg-001')`, [tA.id]);
  const rA = await mot(`select * from nhat_ky_tin where id = $1`, [tA.id]);
  ok('da_gui: ghi giờ gửi, mã tin Zalo, nhả khóa', gui.kq?.ok && rA.ket_qua === 'da_gui' && rA.gui_luc && rA.ma_zalo_tra_ve === 'msg-001'
     && rA.dang_gui_tu === null, vi(gui));
  const lap = await rpc(UID_MAY_ZALO, `zalo_ghi_ket_qua($1, 'that_bai', null, 'muộn')`, [tA.id]);
  ok('Báo lại tin đã ở trạng thái cuối → bỏ qua, không đổi', lap.kq?.bo_qua === true && lap.kq.ket_qua === 'da_gui', vi(lap));

  const thu = await rpc(UID_MAY_ZALO, `zalo_ghi_ket_qua($1, 'that_bai', null, $2, 120)`,
                        [tB.id, 'Zalo 500 access_token=abcSECRET123&x=1 "refresh_token":"rtSECRET456"']);
  const rB = await mot(`select * from nhat_ky_tin where id = $1`, [tB.id]);
  const conLai = new Date(rB.thu_lai_luc).getTime() - Date.now();
  ok('Lỗi tạm có p_thu_lai_sau → quay về cho_gui, hẹn thử lại sau 120 giây',
     thu.kq?.ok && rB.ket_qua === 'cho_gui' && conLai > 100_000 && conLai <= 121_000, `${rB.ket_qua} · ${conLai}`);
  ok('…câu lỗi đã xóa token', rB.loi.includes('Zalo 500') && !rB.loi.includes('SECRET'), rB.loi);
  const chuaLay = await rpc(UID_MAY_ZALO, `zalo_ghi_ket_qua($1, 'da_gui')`, [tB.id]);
  ok('Báo kết quả cho tin chưa được lấy ra → ok = false', chuaLay.kq?.ok === false, vi(chuaLay));

  const hong = await rpc(UID_MAY_ZALO, `zalo_ghi_ket_qua($1, 'that_bai', null, 'Số không dùng Zalo')`, [tC.id]);
  ok('Lỗi vĩnh viễn (không p_thu_lai_sau) → that_bai', hong.kq?.ket_qua === 'that_bai', vi(hong));
  const tcMau = await mot(`select chi_nhanh_id from nhat_ky_tin where id = $1`, [tC.id]);
  const nguoi = tcMau.chi_nhanh_id === cnC.id ? UID_MKT_C : UID.mktA;
  const sai = await rpc(nguoi === UID_MKT_C ? UID.mktA : UID_MKT_C, `zalo_thu_lai($1)`, [tC.id]);
  ok('Marketing chi nhánh khác KHÔNG bấm "Thử lại" được', tuChoi(sai), vi(sai));
  const tl = await rpc(nguoi, `zalo_thu_lai($1)`, [tC.id]);
  const rC = await mot(`select ket_qua, lan_thu from nhat_ky_tin where id = $1`, [tC.id]);
  ok('Marketing cùng chi nhánh bấm "Thử lại" → cho_gui, lan_thu về 0', tl.kq?.ok && rC.ket_qua === 'cho_gui' && rC.lan_thu === 0, vi(tl));
  const cnTA = (await mot(`select chi_nhanh_id from nhat_ky_tin where id = $1`, [tA.id])).chi_nhanh_id;
  const tl2 = await rpc(cnTA === cnC.id ? UID_MKT_C : UID.mktA, `zalo_thu_lai($1)`, [tA.id]);
  ok('"Thử lại" tin đã gửi → bị từ chối', tl2.ma === '23514', vi(tl2));

  await db.query(`update nhat_ky_tin set lan_thu = 5 where id = $1`, [tD.id]);
  const het = await rpc(UID_MAY_ZALO, `zalo_ghi_ket_qua($1, 'that_bai', null, 'timeout', 60)`, [tD.id]);
  ok('Đã thử 5 lần → không hẹn thêm, that_bai', het.kq?.ket_qua === 'that_bai', vi(het));

  await db.query(`update nhat_ky_tin set ket_qua = 'da_huy' where id = $1`, [tE.id]);
  const muon = await rpc(UID_MAY_ZALO, `zalo_ghi_ket_qua($1, 'da_gui', 'msg-005')`, [tE.id]);
  ok('Tin bị hủy giữa chừng mà Zalo đã gửi → ghi da_gui (sự thật thắng)', muon.kq?.ket_qua === 'da_gui', vi(muon));

  const saiKq = await rpc(UID_MAY_ZALO, `zalo_ghi_ket_qua($1, 'bay_mau')`, [tA.id]);
  ok('Kết quả không hợp lệ → 23514', saiKq.ma === '23514', vi(saiKq));

  // Token: máy lưu access token mới + refresh token xoay vòng.
  const tho = await rpc(UID_MAY_ZALO, `zalo_luu_token('access-token-tho', now() + interval '1 hour')`);
  ok('Máy lưu access token THÔ → bị CHECK từ chối', tho.ma === '23514', vi(tho));
  const tk = await rpc(UID_MAY_ZALO, `zalo_luu_token($1, now() + interval '25 hours', $2)`, [ACCESS_1, BAN_MA_2]);
  const t = await mot(`select access_token_ma_hoa, refresh_token_ma_hoa, het_han_luc from zalo_cau_hinh`);
  ok('Máy lưu access token + refresh token mới (bản mã) trong một lời gọi',
     tk.kq?.ok && t.access_token_ma_hoa === ACCESS_1 && t.refresh_token_ma_hoa === BAN_MA_2, vi(tk));

  const kt = await rpc(UID_MAY_ZALO, `zalo_ket_thuc_luot('Lỗi mạng khi gọi oauth: refresh_token=rtLEAK999', null)`);
  const cfg = await mot(`select loi_cuoi, quota_con, dang_chay_tu from zalo_cau_hinh`);
  ok('Kết thúc lượt: loi_cuoi đã xóa token, quota giữ nguyên khi truyền null',
     kt.kq?.ok && !cfg.loi_cuoi.includes('rtLEAK999') && cfg.quota_con === 1234 && cfg.dang_chay_tu === null, cfg.loi_cuoi);

  // Tin thử lại chưa tới giờ thì lượt sau không lấy.
  const b = await rpc(UID_MAY_ZALO, `zalo_bat_dau_luot(50)`);
  ok('Lượt sau: không lấy tin đang hẹn thử lại', b.kq && !b.kq.lo.some(x => x.id === tB.id), vi(b));
  ok('…nhưng lấy lại tin vừa bấm "Thử lại"', b.kq.lo.some(x => x.id === tC.id));
  await rpc(UID_MAY_ZALO, `zalo_ket_thuc_luot()`);
});

// ===========================================================================
await nhom('9 · LƯỢT GỬI DỌN TIN CŨ; MẪU BỊ TẮT; CHIẾN DỊCH XONG', async () => {
  // Đặt bàn 1 tiếng nữa (ZBS-01 chờ gửi), rồi giờ hẹn bị dời về quá khứ.
  const kh = await mot(`select * from tim_hoac_tao_khach('0901000050', 'Khách Quá Giờ', $1)`, [cnA.id]);
  const { id: dQua } = await mot(`insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach, ma_dat_ban)
                                  values ($1, $2, (bay_gio_vn() + interval '1 hour')::date, (bay_gio_vn() + interval '1 hour')::time,
                                          2, sinh_ma_dat_ban()) returning id`, [cnA.id, kh.id]);
  await xacNhan(dQua);
  ok('(đặt bàn 1 tiếng nữa, đã xác nhận, có ZBS-01 chờ gửi)', (await tinCuaDatBan(dQua)).map(x => x.ket_qua).join() === 'cho_gui');
  await db.query(`update dat_ban set ngay = (bay_gio_vn() - interval '1 hour')::date,
                                     gio = (bay_gio_vn() - interval '1 hour')::time where id = $1`, [dQua]);
  // Tắt ZBS-01 (bỏ duyệt) — tin ZBS-01 đang chờ không được gửi nữa.
  await rpc(UID.chu, `zalo_luu_mau('ZBS-01', 'tpl_01', false, true)`);
  const b = await rpc(UID_MAY_ZALO, `zalo_bat_dau_luot(50)`);
  const qua = await mot(`select ket_qua, loi from nhat_ky_tin where khoa_gui = $1`, [`ZBS-01:dat_ban:${dQua}`]);
  ok('Tin đặt bàn đã quá giờ hẹn → da_huy', qua.ket_qua === 'da_huy' && /quá giờ hẹn/.test(qua.loi), JSON.stringify(qua));
  // (Tin đang hẹn thử lại chưa tới giờ thì chưa bị xét — tới giờ mới hủy.)
  ok('Mẫu bị bỏ duyệt → tin đến hạn của mẫu đó da_huy, không vào lô',
     !b.kq.lo.some(x => x.mau_ma === 'ZBS-01')
     && (await mot(`select count(*)::int as n from nhat_ky_tin n join mau_tin m on m.id = n.mau_tin_id
                     where m.ma = 'ZBS-01' and n.ket_qua = 'cho_gui' and coalesce(n.thu_lai_luc, now()) <= now()`)).n === 0
     && (await mot(`select count(*)::int as n from nhat_ky_tin n join mau_tin m on m.id = n.mau_tin_id
                     where m.ma = 'ZBS-01' and n.ket_qua = 'da_huy' and n.loi like 'Mẫu tin chưa được Zalo duyệt%'`)).n >= 1);
  for (const t of b.kq.lo) await rpc(UID_MAY_ZALO, `zalo_ghi_ket_qua($1, 'da_gui', 'x')`, [t.id]);
  const kt = await rpc(UID_MAY_ZALO, `zalo_ket_thuc_luot()`);
  ok('Hết tin chờ → chiến dịch đang chạy chuyển hoan_tat', kt.kq?.so_chien_dich_xong >= 1, vi(kt));

  // Đặt bàn mới khi ZBS-01 không duyệt: xác nhận xong chỉ còn ZBS-02.
  const d = await datBanWeb('0901000040', 'Khách Sau Tắt', NGAY_KIA, '20:00');
  await xacNhan(d.dat_ban_id);
  const t = await tinCuaDatBan(d.dat_ban_id);
  ok('ZBS-01 bị bỏ duyệt → đặt bàn mới xác nhận xong chỉ còn ZBS-02', t.map(x => x.mau_ma).join() === 'ZBS-02', t.map(x => x.mau_ma).join());

  // Tắt Zalo: máy nhận lô rỗng, không token; đặt bàn không xếp gì.
  await rpc(UID.chu, `zalo_luu_cau_hinh(p_dang_bat => false)`);
  const tat = await rpc(UID_MAY_ZALO, `zalo_bat_dau_luot()`);
  ok('Zalo tắt → máy nhận dang_bat = false, lô rỗng, không cấu hình', tat.kq?.dang_bat === false && tat.kq.lo.length === 0
     && tat.kq.cau_hinh === null, vi(tat));
  const d2 = await datBanWeb('0901000041', 'Khách Khi Tắt', NGAY_KIA, '20:00');
  await xacNhan(d2.dat_ban_id);
  ok('Zalo tắt → đặt bàn xác nhận xong vẫn không xếp tin', (await tinCuaDatBan(d2.dat_ban_id)).length === 0);
  await rpc(UID.chu, `zalo_luu_cau_hinh(p_dang_bat => true)`);
});

// ===========================================================================
await nhom('10 · AI ĐỌC ĐƯỢC GÌ', async () => {
  const BANG = ['khach_hang', 'nhat_ky_tin', 'dat_ban', 'luot_ghe', 'chien_dich', 'zalo_cau_hinh',
                'nhat_ky_dong_y', 'so_cai_diem', 'v_zalo_nhat_ky', 'v_khach_tong_hop', 'v_duoc_gui_tin'];
  for (const [ai, uid] of [['Máy Zalo', UID_MAY_ZALO], ['Thủ kho Q1', UID.thuKhoA], ['NV quầy Q1', UID.nvQuayA],
                           ['Kế toán Q1', UID.keToanA], ['Máy iPOS', UID_MAY_IPOS]]) {
    const lot = [];
    for (const b of BANG) {
      const r = await duoi(uid, `select count(*)::int as n from ${b}`);
      if (r.loi === null && r.rows[0].n > 0) lot.push(`${b}(${r.rows[0].n})`);
    }
    ok(`${ai} không đọc được dòng nào của khách / tin / cấu hình Zalo`, lot.length === 0, lot.join(', '));
  }

  const tn = await duoi(UID.thuNganA, `select count(*)::int as n from zalo_cau_hinh`);
  ok('Thu ngân không đọc được zalo_cau_hinh', tn.loi !== null || tn.rows[0].n === 0, vi(tn));
  const tnTq = await rpc(UID.thuNganA, `zalo_tong_quan($1)`, [cnA.id]);
  ok('Thu ngân không xem được tổng quan Zalo', tuChoi(tnTq), vi(tnTq));

  for (const [ai, uid] of [['Marketing', UID.mktA], ['Quản lý', UID.qlA], ['Chủ sở hữu', UID.chu]]) {
    const r = await duoi(uid, `select refresh_token_ma_hoa from zalo_cau_hinh`);
    ok(`${ai} KHÔNG select được cột refresh_token_ma_hoa`, /permission denied/i.test(r.loi ?? ''), vi(r));
    const r2 = await duoi(uid, `select access_token_ma_hoa from zalo_cau_hinh`);
    ok(`${ai} KHÔNG select được cột access_token_ma_hoa`, /permission denied/i.test(r2.loi ?? ''), vi(r2));
  }
  const tatCa = await duoi(UID.chu, `select * from zalo_cau_hinh`);
  ok('Chủ "select *" zalo_cau_hinh bị từ chối (có cột bí mật)', /permission denied/i.test(tatCa.loi ?? ''), vi(tatCa));
  const chuDoc = await duoi(UID.chu, `select app_id, oa_id, dang_bat, che_do, gio_tu, loi_cuoi from zalo_cau_hinh`);
  ok('Chủ đọc được các cột không bí mật', chuDoc.rows?.length === 1 && chuDoc.rows[0].app_id === '123456', vi(chuDoc));
  const mktDoc = await duoi(UID.mktA, `select app_id, dang_bat from zalo_cau_hinh`);
  ok('Marketing đọc cột không bí mật → 0 dòng (RLS chỉ chủ)', mktDoc.loi === null && mktDoc.rows.length === 0, vi(mktDoc));
  const mktCh = await rpc(UID.mktA, `zalo_doc_cau_hinh()`);
  ok('Marketing KHÔNG gọi được zalo_doc_cau_hinh', tuChoi(mktCh), vi(mktCh));
  const chuCh = await rpc(UID.chu, `zalo_doc_cau_hinh()`);
  ok('zalo_doc_cau_hinh (chủ): có cờ co_refresh_token, KHÔNG có bản mã',
     chuCh.kq?.co_refresh_token === true && chuCh.kq?.co_access_token === true
     && !JSON.stringify(chuCh.kq).includes('v1.') && chuCh.kq.mau.length === 4, vi(chuCh));

  const tq = await rpc(UID.mktA, `zalo_tong_quan($1)`, [cnA.id]);
  ok('Marketing Q1 xem tổng quan Q1: có đếm, có trạng thái kết nối', typeof tq.kq?.dem?.cho_gui === 'number'
     && tq.kq.ket_noi.dang_bat === true && tq.kq.ket_noi.co_token === true && tq.kq.dem.da_huy > 0, vi(tq));
  ok('…tổng quan không có SĐT, không có bản mã', !/0\d{9}/.test(JSON.stringify(tq.kq)) && !JSON.stringify(tq.kq).includes('v1.'));
  const tqC = await rpc(UID_MKT_C, `zalo_tong_quan($1)`, [cnC.id]);
  ok('Tổng quan Q3 có danh sách chiến dịch kèm số tin', tqC.kq?.chien_dich?.length === 4
     && tqC.kq.chien_dich.every(c => typeof c.so_tin === 'number' && c.mau_ma === 'ZBS-03'), vi(tqC));
  const tqB = await rpc(UID.mktA, `zalo_tong_quan($1)`, [cnB.id]);
  ok('Marketing Q1 KHÔNG xem được tổng quan Q7', tuChoi(tqB), vi(tqB));

  const nk = await duoi(UID.mktA, `select chi_nhanh_id, sdt_an, mau_ma, ket_qua from v_zalo_nhat_ky`);
  ok('v_zalo_nhat_ky: marketing Q1 chỉ thấy tin Q1, SĐT che giữa',
     nk.loi === null && nk.rows.length > 0 && nk.rows.every(r => r.chi_nhanh_id === cnA.id && /^\d{3}\*{4}\d{3}$/.test(r.sdt_an)),
     vi(nk));
});

// ===========================================================================
await nhom('11 · AI GỌI ĐƯỢC GÌ — máy chỉ gọi RPC máy, người không gọi RPC máy', async () => {
  const { id: mot1 } = await mot(`select id from nhat_ky_tin limit 1`);
  const MAY = [
    ['zalo_bat_dau_luot', `zalo_bat_dau_luot()`, []],
    ['zalo_ghi_ket_qua', `zalo_ghi_ket_qua($1, 'da_gui')`, [mot1]],
    ['zalo_luu_token', `zalo_luu_token($1, now())`, [ACCESS_1]],
    ['zalo_ket_thuc_luot', `zalo_ket_thuc_luot()`, []],
  ];
  for (const [ai, uid] of [['Chủ sở hữu', UID.chu], ['Quản lý', UID.qlA], ['Marketing', UID.mktA], ['Thu ngân', UID.thuNganA],
                           ['Thủ kho', UID.thuKhoA], ['Máy iPOS', UID_MAY_IPOS], ['Không phải nhân sự', UID_LA]]) {
    const lot = [];
    for (const [ten, sql, p] of MAY) {
      const r = await rpc(uid, sql, p);
      if (!tuChoi(r)) lot.push(`${ten}: ${vi(r)}`);
    }
    ok(`${ai} KHÔNG gọi được RPC máy nào`, lot.length === 0, lot.join(' | '));
  }
  // Không phiên (service_role, seed) cũng không: bản mã token chỉ ra cho may_zalo.
  const khongPhien = await db.query(`select zalo_bat_dau_luot() as kq`).then(() => null, e => e.message);
  ok('Không có phiên đăng nhập → zalo_bat_dau_luot bị từ chối', /máy Zalo/.test(khongPhien ?? ''), khongPhien ?? 'CHẠY ĐƯỢC');

  const NGUOI = [
    ['zalo_doc_cau_hinh', `zalo_doc_cau_hinh()`, []],
    ['zalo_luu_cau_hinh', `zalo_luu_cau_hinh(p_dang_bat => false)`, []],
    ['zalo_luu_refresh_token', `zalo_luu_refresh_token(null)`, []],
    ['zalo_luu_mau', `zalo_luu_mau('ZBS-02', 'x', false, false)`, []],
    ['zalo_xem_truoc_chien_dich', `zalo_xem_truoc_chien_dich($1, 'ZBS-03')`, [cnA.id]],
    ['zalo_tao_chien_dich', `zalo_tao_chien_dich($1, gen_random_uuid(), 'ZBS-03', null, 'x', '{"google_review_link":"x"}')`, [cnA.id]],
    ['zalo_dung_chien_dich', `zalo_dung_chien_dich((select id from chien_dich limit 1))`, []],
    ['zalo_thu_lai', `zalo_thu_lai($1)`, [mot1]],
    ['zalo_tong_quan', `zalo_tong_quan($1)`, [cnA.id]],
  ];
  const lot = [];
  for (const [ten, sql, p] of NGUOI) {
    const r = await rpc(UID_MAY_ZALO, sql, p);
    if (!tuChoi(r)) lot.push(`${ten}: ${vi(r)}`);
  }
  ok('Máy Zalo KHÔNG gọi được RPC nào của người', lot.length === 0, lot.join(' | '));
  const xep = await duoi(UID_MAY_ZALO, `select xep_hang_gui_tin($1, (select id from khach_hang limit 1), 'ZBS-02')`, [cnA.id]);
  ok('Máy Zalo KHÔNG xếp được tin qua xep_hang_gui_tin', tuChoi(xep), vi(xep));
  const ghiLuot = await duoi(UID_MAY_ZALO, `select * from ghi_luot_ghe($1, '0999000000', 100000::bigint)`, [cnA.id]);
  ok('Máy Zalo KHÔNG ghi được lượt ghé / điểm', tuChoi(ghiLuot), vi(ghiLuot));

  // Ghi thẳng bảng: không policy UPDATE → 0 dòng; INSERT → tường ngăn / RLS chặn.
  const truoc = await mot(`select ket_qua, loi from nhat_ky_tin where id = $1`, [mot1]);
  await duoi(UID_MAY_ZALO, `update nhat_ky_tin set loi = 'máy sửa thẳng' where id = $1`, [mot1]);
  const sau = await mot(`select ket_qua, loi from nhat_ky_tin where id = $1`, [mot1]);
  ok('Máy Zalo UPDATE thẳng nhat_ky_tin → không đổi được gì', JSON.stringify(truoc) === JSON.stringify(sau));
  const chen = await duoi(UID_MAY_ZALO, `insert into nhat_ky_tin (chi_nhanh_id, khach_hang_id, sdt_gui, noi_dung)
                                          select $1, id, sdt, 'máy chèn thẳng' from khach_hang limit 1`, [cnA.id]);
  const { n: soChen } = await mot(`select count(*)::int as n from nhat_ky_tin where noi_dung = 'máy chèn thẳng'`);
  ok('Máy Zalo INSERT thẳng nhat_ky_tin → không chèn được', soChen === 0, vi(chen));
  const khach = await duoi(UID_MAY_ZALO, `update khach_hang set ho_ten = 'x'`);
  ok('Máy Zalo không sửa được khách (0 dòng hoặc bị chặn)', khach.loi !== null
     || (await mot(`select count(*)::int as n from khach_hang where ho_ten = 'x'`)).n === 0, vi(khach));
  const cfgThang = await duoi(UID_MAY_ZALO, `update zalo_cau_hinh set dang_bat = false`);
  ok('Máy Zalo không UPDATE thẳng được zalo_cau_hinh', /permission denied/i.test(cfgThang.loi ?? ''), vi(cfgThang));
  const chuThang = await duoi(UID.chu, `update zalo_cau_hinh set che_do = 'that'`);
  ok('Chủ cũng không UPDATE thẳng zalo_cau_hinh (chỉ qua RPC)', /permission denied/i.test(chuThang.loi ?? ''), vi(chuThang));
});

process.exit(ketThuc('GỬI TIN ZALO'));
