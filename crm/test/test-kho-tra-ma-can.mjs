/**
 * BEEFTOWN KHO — Kiểm thử tra mã cân trên nhãn ở phía web (mã món · ô mã · mã giảm giá)
 * ===================================================================================
 *
 *     node test/test-kho-tra-ma-can.mjs
 *
 * LỖI ĐÃ XẢY RA (soát luồng 11/10/2026): mọi khay thịt ủ in tem bằng MÃ Ô (kho_o_ma, 0049),
 * khay cận date in bằng MÃ GIẢM (kho_ma_giam, 0054). Database nhận đủ ba loại mã
 * (kho_mat_hang_theo_ma_can), nhưng bốn chỗ tra mã ở web viết trước 0049 chỉ so
 * kho_mat_hang.ma_can: màn Quét nhãn báo "chưa gắn với món nào", phiếu chuyển / xuất bếp /
 * báo hủy báo "gói không nhận ra món", kiểm kê dán nhãn coi là gói lạ, màn Mã vạch báo
 * chưa có món mang mã đó.
 *
 * Bất biến:
 *   1. Bộ tra của web (lib/kho/tra-ma-can.ts) cho ĐÚNG món mà kho_mat_hang_theo_ma_can cho,
 *      trên cùng dữ liệu — kể cả dữ liệu trái ràng buộc (mã trùng nhau) và món ngừng dùng.
 *      Thân hàm SQL được chép lại ở đây: migration sau đổi luật thì bài này đỏ cho tới khi
 *      bộ tra của web đổi theo.
 *   2. Mọi vai kho đọc được ô mã và mã giảm (NV quầy cũng quét nhãn); vai khác thì không.
 *   3. Quét nhãn vào phiếu: nhãn mã ô / mã giảm được nhận ra; nhãn mã ô vào ĐÚNG LÔ của
 *      tảng khi lô đủ hàng ở nơi lấy, không thì về dòng theo món (hạn gần lấy trước);
 *      không khay nào nằm ở cả hai phần.
 *   4. Kiểm kê dán nhãn: mọi mã của cùng một món cộng vào một số đếm.
 *   5. Luồng thật trên PGlite: quét nhãn mã ô → phiếu xuất trừ đúng lô của tảng, bấm hai
 *      lần vẫn một phiếu, kho_doi_soat_ton() rỗng.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, taoClientPg, UID, maGui } from './kho-chung.mjs';
import { VIET } from './quet-chu-viet.mjs';
import { tinhSoKiemTra } from '../../web/src/lib/kho/ma-vach.ts';
import * as XUAT from '../../web/src/lib/kho/xuat.ts';
import * as KIEM_KE from '../../web/src/lib/kho/kiem-ke.ts';
import * as O_MA from '../../web/src/lib/kho/o-ma.ts';
import { docCaiDat, docMatHang } from '../../web/src/lib/kho/danh-muc.ts';
import { docTon } from '../../web/src/lib/kho/ton.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — TRA MÃ CÂN TRÊN NHÃN (WEB)');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');

// Bộ tra dùng chung — file mới của bản sửa. Chưa có thì các kiểm tra dưới đỏ (không sập cả file).
const TRA = await import('../../web/src/lib/kho/tra-ma-can.ts').catch(() => null);
ok('HỒI QUY: có bộ tra mã cân dùng chung web/src/lib/kho/tra-ma-can.ts (taoBangTraMaCan, traMaCan)',
   typeof TRA?.taoBangTraMaCan === 'function' && typeof TRA?.traMaCan === 'function');
const taoBang = (...a) => TRA.taoBangTraMaCan(...a);
const tra = (bang, ma) => TRA.traMaCan(bang, ma);

/** Nhãn cân EAN-13 theo mẫu mặc định 2XCCCCCWWWWWK (gram). */
const nhan = (maCan, gram) => {
  const s12 = `20${String(maCan).padStart(5, '0')}${String(gram).padStart(5, '0')}`;
  return s12 + tinhSoKiemTra(s12);
};
const U = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const L = n => `11111111-1111-4111-8111-${String(n).padStart(12, '0')}`;

// ---------------------------------------------------------------------------
// Database thật (PGlite) + client giả (kho-chung.mjs taoClientPg): from() / rpc() thành SQL chạy dưới một vai.
// uid = UID.xxx: vai đã đăng nhập · null: đăng nhập nhưng không phải nhân sự · 'anon': chưa đăng nhập.
// ---------------------------------------------------------------------------
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
const clientCua = await taoClientPg({ db, duoi, duoiAnon });

const MH = {};
let vt = {};
const napMh = async () => { for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r; };

// ===========================================================================
await nhom('1 · BỘ TRA CỦA WEB KHỚP kho_mat_hang_theo_ma_can TRÊN CÙNG DỮ LIỆU', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  await napMh();
  vt = Object.fromEntries((await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  const chay = async (uid, sql, gt = []) => { const r = await duoi(uid, sql, gt); if (r.loi) throw new Error(`${sql.slice(0, 60)}… → ${r.loi}`); return r.rows; };

  // Mã món, giá bán (mã giảm cần giá), đơn vị "khay" cho món sẽ quét ở các nhóm sau.
  await chay(UID.qlA, `update kho_mat_hang set
      ma_can = case ma when 'C-THANNGOAI' then '301' when 'C-THANNOI' then '302' when 'C-NACVAI' then '303' when 'C-LOIVAI' then '304' end,
      gia_ban_kg = 900000, don_vi_goi = case when ma = 'C-THANNGOAI' then 'khay' else don_vi_goi end
    where ma in ('C-THANNGOAI', 'C-THANNOI', 'C-NACVAI', 'C-LOIVAI', 'C-THANLUNG')`);
  await chay(UID.qlA, `insert into kho_o_ma (mat_hang_id, so_o, ma_can) values
      ($1, 1, '10011'), ($1, 2, '10012'), ($2, 1, '10021'), ($2, 2, '10022'), ($3, 1, '10031')`,
    [MH['C-THANNGOAI'].id, MH['C-THANLUNG'].id, MH['C-NACVAI'].id]);
  await chay(UID.qlA, `select kho_luu_ma_giam($1, 30)`, [MH['C-THANNGOAI'].id]);   // 90001
  const g50 = (await chay(UID.qlA, `select kho_luu_ma_giam($1, 50) as r`, [MH['C-THANNGOAI'].id]))[0].r;   // 90002
  await chay(UID.qlA, `select kho_bat_ma_giam($1, false)`, [g50.id]);              // tắt: tem cũ vẫn nhận
  await chay(UID.qlA, `select kho_luu_ma_giam($1, 20)`, [MH['C-THANLUNG'].id]);    // 90003 — món chỉ có ô mã
  await chay(UID.qlA, `select kho_luu_ma_giam($1, 25)`, [MH['C-NACVAI'].id]);      // 90004
  // Món ngừng dùng: C-NACVAI (đã có mã món 303, ô 10031, mã giảm 90004) và C-LOIVAI (mã món 304).
  await chay(UID.qlA, `update kho_mat_hang set dang_dung = false where ma in ('C-NACVAI', 'C-LOIVAI')`);
  // Mã 304 của món đã ngừng được dùng lại làm ô mã của món đang dùng (trigger cho phép).
  await chay(UID.qlA, `insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 1, '304')`, [MH['C-BACHI'].id]);

  // Dữ liệu TRÁI ràng buộc (tắt trigger): chứng minh thứ tự ưu tiên giống nhau cả khi mã trùng.
  await db.exec(`set session_replication_role = replica`);
  try {
    await db.query(`insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 2, '302')`, [MH['C-BACHI'].id]);               // ô trùng mã món đang dùng
    await db.query(`insert into kho_ma_giam (mat_hang_id, phan_tram, ma_can) values ($1, 10, '10012')`, [MH['C-THANNOI'].id]);   // mã giảm trùng mã ô
    await db.query(`insert into kho_ma_giam (mat_hang_id, phan_tram, ma_can) values ($1, 15, '301')`, [MH['C-THANNOI'].id]);     // mã giảm trùng mã món
    await db.query(`insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 2, '90005')`, [MH['C-NACVAI'].id]);             // ô của món NGỪNG dùng…
    await db.query(`insert into kho_ma_giam (mat_hang_id, phan_tram, ma_can) values ($1, 40, '90005')`, [MH['C-THANNGOAI'].id]); // …trùng mã giảm của món đang dùng
  } finally { await db.exec(`set session_replication_role = origin`); }
  await napMh();

  // Web đọc dữ liệu bằng đúng hàm của trang, dưới vai NV quầy (vai thấp nhất quét nhãn).
  const nv = clientCua(UID.nvQuayA);
  const matHang = await docMatHang(nv);
  const maNhan = typeof O_MA.docMaTrenNhan === 'function' ? await O_MA.docMaTrenNhan(nv) : null;
  ok('HỒI QUY: o-ma.ts có docMaTrenNhan — NV quầy đọc được ô mã và mã giảm của mọi món',
     maNhan?.oMa?.length === 8 && maNhan?.maGiam?.length === 7, JSON.stringify({ o: maNhan?.oMa?.length, g: maNhan?.maGiam?.length }));
  const bang = taoBang(matHang, maNhan.oMa, maNhan.maGiam);

  const sqlTra = async ma => (await db.query(`select id from kho_mat_hang_theo_ma_can($1)`, [ma])).rows[0]?.id ?? null;
  const tenCua = id => Object.values(MH).find(m => m.id === id)?.ma ?? id ?? '—';
  const cacMa = [...new Set([
    ...Object.values(MH).map(m => m.ma_can).filter(Boolean), ...maNhan.oMa.map(o => o.ma_can), ...maNhan.maGiam.map(g => g.ma_can),
    '1', '300', '305', '999', '10013', '99999', '123456',
  ])];
  const lech = [];
  for (const ma of cacMa) {
    const [s, w] = [await sqlTra(ma), tra(bang, ma)?.matHang.id ?? null];
    if (s !== w) lech.push(`${ma}: SQL ${tenCua(s)} · web ${tenCua(w)}`);
  }
  ok(`HỒI QUY: ${cacMa.length} mã (mã món, ô mã, mã giảm, mã lạ) — web ra đúng món SQL ra`, cacMa.length >= 20 && lech.length === 0, lech.join(' | '));

  const x = ma => tra(bang, ma);
  ok('HỒI QUY: mã ô 10011 → Thăn ngoại cắt lát, nguồn "ô mã", ô số 1',
     x('10011')?.matHang.ma === 'C-THANNGOAI' && x('10011').nguon === 'o_ma' && x('10011').soO === 1 && x('10011').phanTram === null, JSON.stringify(x('10011')));
  ok('HỒI QUY: mã giảm 90001 → Thăn ngoại cắt lát, nguồn "mã giảm", 30%',
     x('90001')?.matHang.ma === 'C-THANNGOAI' && x('90001').nguon === 'ma_giam' && x('90001').phanTram === 30 && x('90001').soO === null, JSON.stringify(x('90001')));
  ok('Mã của chính món 301 → nguồn "mã món", không ô, không %',
     x('301')?.matHang.ma === 'C-THANNGOAI' && x('301').nguon === 'ma_mon' && x('301').soO === null && x('301').phanTram === null);
  ok('Món không có mã cân riêng vẫn nhận qua ô mã (10022 → Thăn lưng cắt lát, ô 2) và mã giảm (90003, 20%)',
     x('10022')?.matHang.ma === 'C-THANLUNG' && x('10022').soO === 2 && x('90003')?.matHang.ma === 'C-THANLUNG' && x('90003').phanTram === 20);
  ok('Mã giảm ĐÃ TẮT (90002) vẫn nhận — tem in trước đó còn bán được, như SQL',
     x('90002')?.matHang.ma === 'C-THANNGOAI' && x('90002').phanTram === 50 && await sqlTra('90002') === MH['C-THANNGOAI'].id);
  ok('Món ngừng dùng: mã món 303, ô mã 10031, mã giảm 90004 của nó đều không ra món nào',
     x('303') === null && x('10031') === null && x('90004') === null
     && await sqlTra('303') === null && await sqlTra('10031') === null && await sqlTra('90004') === null);
  ok('Mã 304: món cũ đã ngừng, nay là ô 1 của Ba chỉ cuộn → ra Ba chỉ cuộn',
     x('304')?.matHang.ma === 'C-BACHI' && x('304').nguon === 'o_ma' && await sqlTra('304') === MH['C-BACHI'].id);
  ok('Mã món đang dùng thắng mã ô trùng số (302 → Thăn nội, không phải ô của Ba chỉ)',
     x('302')?.matHang.ma === 'C-THANNOI' && x('302').nguon === 'ma_mon' && await sqlTra('302') === MH['C-THANNOI'].id);
  ok('Mã món đang dùng thắng mã giảm trùng số (301 → Thăn ngoại, không phải mã giảm 15% của Thăn nội)',
     x('301')?.nguon === 'ma_mon' && await sqlTra('301') === MH['C-THANNGOAI'].id);
  ok('Mã ô thắng mã giảm trùng số (10012 → ô 2 của Thăn ngoại, không phải mã giảm 10% của Thăn nội)',
     x('10012')?.matHang.ma === 'C-THANNGOAI' && x('10012').nguon === 'o_ma' && x('10012').soO === 2 && await sqlTra('10012') === MH['C-THANNGOAI'].id);
  ok('Ô của món NGỪNG dùng chặn luôn mã giảm trùng số (90005 → không ra món nào, không rơi xuống mã giảm)',
     x('90005') === null && await sqlTra('90005') === null);
  ok('Bỏ số 0 đầu và khoảng trắng như docMaVach ("010011", " 0301 ")',
     x('010011')?.soO === 1 && x(' 0301 ')?.nguon === 'ma_mon' && x('0090001')?.phanTram === 30);
  ok('Mã trống, toàn số 0, null, undefined → không ra món nào (không ném lỗi)',
     x('') === null && x('000') === null && x(null) === null && x(undefined) === null);
  ok('Không truyền ô mã / mã giảm → chỉ nhận mã của chính món (như trước 0049)',
     tra(taoBang(matHang), '301')?.matHang.ma === 'C-THANNGOAI' && tra(taoBang(matHang), '10011') === null && tra(taoBang(matHang), '90001') === null);

  // Bật lại món ngừng dùng → cả ba loại mã của nó nhận lại; hai bên vẫn khớp.
  await db.exec(`set session_replication_role = replica`);
  try { await db.query(`update kho_mat_hang set dang_dung = true where ma = 'C-NACVAI'`); }
  finally { await db.exec(`set session_replication_role = origin`); }
  const bang2 = taoBang(await docMatHang(nv), maNhan.oMa, maNhan.maGiam);
  const lech2 = [];
  for (const ma of cacMa) {
    const [s, w] = [await sqlTra(ma), tra(bang2, ma)?.matHang.id ?? null];
    if (s !== w) lech2.push(`${ma}: SQL ${tenCua(s)} · web ${tenCua(w)}`);
  }
  ok('Bật lại món ngừng dùng: 303, 10031, 90004 nhận lại; 90005 thành ô 2 của món đó; mọi mã vẫn khớp SQL',
     lech2.length === 0 && tra(bang2, '303')?.nguon === 'ma_mon' && tra(bang2, '10031')?.soO === 1
     && tra(bang2, '90004')?.phanTram === 25 && tra(bang2, '90005')?.matHang.ma === 'C-NACVAI', lech2.join(' | '));
  await db.exec(`set session_replication_role = replica`);
  try {
    await db.query(`update kho_mat_hang set dang_dung = false where ma = 'C-NACVAI'`);
    // Dọn dữ liệu trái ràng buộc để các nhóm sau chạy trên dữ liệu hợp lệ.
    await db.query(`delete from kho_ma_giam where ma_can in ('10012', '301', '90005')`);
    await db.query(`delete from kho_o_ma where ma_can in ('302', '90005')`);
  } finally { await db.exec(`set session_replication_role = origin`); }

  // Thân hàm SQL chép lại: migration sau thêm một loại mã (hay đổi luật đang dùng) mà dữ liệu thử ở
  // trên không có thì phép so theo dữ liệu vẫn xanh — bản chép này mới đỏ.
  const def = (await db.query(`select pg_get_functiondef('kho_mat_hang_theo_ma_can(text)'::regprocedure) as d`)).rows[0].d;
  const than = (def.match(/\$function\$([\s\S]*?)\$function\$/)?.[1] ?? '').replace(/\s+/g, ' ').trim();
  const THAN_DA_SOI = `
    select m.* from kho_mat_hang m where m.ma_can = p_ma_can and m.dang_dung
    union all
    select m.* from kho_o_ma o join kho_mat_hang m on m.id = o.mat_hang_id
    where o.ma_can = p_ma_can and m.dang_dung
      and not exists (select 1 from kho_mat_hang x where x.ma_can = p_ma_can and x.dang_dung)
    union all
    select m.* from kho_ma_giam g join kho_mat_hang m on m.id = g.mat_hang_id
    where g.ma_can = p_ma_can and m.dang_dung
      and not exists (select 1 from kho_mat_hang x where x.ma_can = p_ma_can and x.dang_dung)
      and not exists (select 1 from kho_o_ma x where x.ma_can = p_ma_can)
    limit 1;`.replace(/\s+/g, ' ').trim();
  ok('Thân kho_mat_hang_theo_ma_can vẫn là bản mà bộ tra của web soi theo (đổi SQL thì sửa tra-ma-can.ts rồi cập nhật bản chép này)',
     than === THAN_DA_SOI, than);
});

// ===========================================================================
await nhom('2 · QUYỀN: AI ĐỌC ĐƯỢC Ô MÃ, MÃ GIẢM, Ô ĐANG GIAO', async () => {
  const docThu = async uid => {
    try { const r = await O_MA.docMaTrenNhan(clientCua(uid)); return `${r.oMa.length}/${r.maGiam.length}`; }
    catch (e) { return `LỖI ${e.message ?? e}`; }
  };
  for (const [ten, uid] of [['Chủ', UID.chu], ['Quản lý', UID.qlA], ['Thủ kho', UID.thuKhoA], ['NV quầy', UID.nvQuayA], ['Kế toán', UID.keToanA]]) {
    ok(`${ten} đọc được ô mã và mã giảm (6 ô, 4 mã giảm)`, await docThu(uid) === '6/4', await docThu(uid));
  }
  for (const [ten, uid] of [['Thu ngân', UID.thuNganA], ['Marketing', UID.mktA], ['Người đã nghỉ', UID.nghiViec], ['Tài khoản không phải nhân sự', null]]) {
    ok(`${ten}: không đọc được dòng nào`, await docThu(uid) === '0/0', await docThu(uid));
  }
  ok('Chưa đăng nhập (anon): bị từ chối', /^LỖI/.test(await docThu('anon')), await docThu('anon'));
  const giao = async uid => {
    try { return (await O_MA.docGiaoOMaCan(clientCua(uid), cnA.id)).length; } catch (e) { return `LỖI ${e.message ?? e}`; }
  };
  ok('Ô đang giao (kho_can_giao_o_ma): NV quầy và thủ kho chi nhánh A đọc được', await giao(UID.nvQuayA) === 0 && await giao(UID.thuKhoA) === 0,
     `${await giao(UID.nvQuayA)} · ${await giao(UID.thuKhoA)}`);
  ok('Ô đang giao: quản lý, thủ kho chi nhánh khác và thu ngân bị từ chối',
     /không xem được kho/.test(String(await giao(UID.qlB))) && /không xem được kho/.test(String(await giao(UID.thuKhoB)))
     && /không xem được kho/.test(String(await giao(UID.thuNganA))), `${await giao(UID.qlB)} · ${await giao(UID.thuNganA)}`);
});

// ---------------------------------------------------------------------------
// Dữ liệu giả cho hàm thuần (nhóm 3, 4)
// ---------------------------------------------------------------------------
const MON = [
  { id: U(1), ten: 'Ribeye', dem_goi: true, don_vi_goi: 'khay', ma_can: '10010', dang_dung: true },
  { id: U(2), ten: 'Thịt vụn', dem_goi: false, don_vi_goi: 'khay', ma_can: '201', dang_dung: true },
  { id: U(3), ten: 'Skirt', dem_goi: true, don_vi_goi: 'khay', ma_can: null, dang_dung: true },
  { id: U(4), ten: 'Bò xay', dem_goi: false, don_vi_goi: 'gói', ma_can: null, dang_dung: true },
];
const MA_NHAN = {
  oMa: [
    { mat_hang_id: U(1), so_o: 1, ma_can: '10011' }, { mat_hang_id: U(1), so_o: 2, ma_can: '10012' },
    { mat_hang_id: U(3), so_o: 1, ma_can: '10021' }, { mat_hang_id: U(4), so_o: 1, ma_can: '10031' },
  ],
  maGiam: [{ mat_hang_id: U(1), phan_tram: 30, ma_can: '90001', dang_dung: true }],
};
const GIAO = [
  { ma_can: '10011', so_o: 1, mat_hang_id: U(1), lo_id: L(1), so_tang: 1, so_phieu: 'PL-1', trang_thai_phien: 'da_chot' },
  { ma_can: '10012', so_o: 2, mat_hang_id: U(1), lo_id: L(2), so_tang: 2, so_phieu: 'PL-2', trang_thai_phien: 'da_chot' },
  { ma_can: '10021', so_o: 1, mat_hang_id: U(3), lo_id: null, so_tang: 3, so_phieu: 'PL-3', trang_thai_phien: 'nhap' },
  { ma_can: '10031', so_o: 1, mat_hang_id: U(4), lo_id: L(4), so_tang: 4, so_phieu: 'PL-4', trang_thai_phien: 'da_chot' },
];
const LO_NOI_LAY = () => [
  { lo_id: L(1), mat_hang_id: U(1), so_goi: 5, so_kg: 1.5, tinh_trang_han: 'con_han', han_dung: '2026-10-16' },
  { lo_id: L(2), mat_hang_id: U(1), so_goi: 1, so_kg: 0.3, tinh_trang_han: 'con_han', han_dung: '2026-10-18' },
  { lo_id: L(4), mat_hang_id: U(4), so_goi: 0, so_kg: 2, tinh_trang_han: 'con_han', han_dung: '2026-10-12' },
];
const datLo = (them = {}) => ({ giao: GIAO, lo: LO_NOI_LAY(), tenNoiLay: 'Kho lạnh', chiConHan: false, dong: [], theoLo: [], ...them });
const quet = (ma, them) => XUAT.dongTuQuet(ma.join('\n'), MON, null, 3, them);
const tongGoi = q => [...q.dong, ...(q.theoLo ?? [])].reduce((s, d) => s + Number(d.so_goi || 0), 0);

// ===========================================================================
await nhom('3 · PHIẾU CHUYỂN / XUẤT BẾP / BÁO HỦY: QUÉT NHÃN MÃ Ô, MÃ GIẢM (dongTuQuet)', async () => {
  const tron = [nhan(10011, 312), nhan(10012, 298), nhan(90001, 305), nhan(10010, 300), nhan(10021, 262)];
  const q = quet(tron, { maNhan: MA_NHAN });
  const rib = q.dong.filter(d => d.mat_hang_id === U(1));
  ok('HỒI QUY: nhãn mã ô, mã giảm và mã món của cùng một món → MỘT dòng 4 khay, 1,215 kg (cộng theo gram)',
     rib.length === 1 && rib[0].so_goi === '4' && rib[0].so_kg === '1,215', JSON.stringify(q.dong));
  ok('HỒI QUY: món chỉ có ô mã (không mã cân riêng) cũng thành dòng hàng', q.dong.some(d => d.mat_hang_id === U(3) && d.so_goi === '1' && d.so_kg === '0,262'));
  ok('HỒI QUY: không còn câu "gói không nhận ra món" cho nhãn mã ô / mã giảm', q.soGoiLa === 0 && q.maCanLa.length === 0 && q.loi.length === 0 && q.soDoc === 5,
     q.loi.join(' · '));
  const cu = quet(tron);
  ok('Không truyền ô mã / mã giảm → như trước (chỉ nhãn mã món được nhận, 4 gói lạ)', cu.soDoc === 1 && cu.soGoiLa === 4 && cu.dong.length === 1);
  const la = quet([nhan(10011, 312), nhan(77777, 300), '2012345012500'], { maNhan: MA_NHAN });
  ok('Mã lạ và nhãn hỏng vẫn báo như cũ, bằng chữ chung "gói" (không biết là món gì)',
     la.soGoiLa === 1 && la.soNhanHong === 1 && la.loi.includes('1 gói không nhận ra món — để riêng, báo quản lý')
     && la.loi.includes('1 nhãn không đọc được — quét lại gói đó') && la.maCanLa.join() === '77777', la.loi.join(' · '));

  // --- Đặt vào đúng lô của tảng ---
  ok('HỒI QUY: có gopDongLo để cộng dòng lô vừa quét vào form', typeof XUAT.gopDongLo === 'function');
  const hai = quet([nhan(10011, 312), nhan(10011, 298), nhan(10012, 300)], { maNhan: MA_NHAN, datLo: datLo() });
  const l1 = hai.theoLo?.find(l => l.lo_id === L(1)), l2 = hai.theoLo?.find(l => l.lo_id === L(2));
  ok('HỒI QUY: nhãn mã ô của tảng #0001 và #0002 → mỗi tảng một dòng LÔ (2 khay 0,61 kg · 1 khay 0,3 kg), không dòng theo món',
     hai.dong.length === 0 && hai.theoLo?.length === 2 && l1?.so_goi === '2' && l1?.so_kg === '0,61' && l1?.mat_hang_id === U(1)
     && l2?.so_goi === '1' && l2?.so_kg === '0,3', JSON.stringify(hai));
  ok('Câu báo nói đã ghi vào lô của tảng nào, bằng đơn vị của món (khay), có bản tiếng Anh không lẫn chữ Việt',
     /2 khay Ribeye/.test(hai.cauDatLo?.vi ?? '') && /#0001/.test(hai.cauDatLo.vi) && /#0002/.test(hai.cauDatLo.vi) && !/gói/.test(hai.cauDatLo.vi)
     && /#0001/.test(hai.cauDatLo.en) && !VIET.test(hai.cauDatLo.en.replace(/Ribeye/g, '')), JSON.stringify(hai.cauDatLo));
  ok('Không khay nào nằm ở cả hai phần: dòng món + dòng lô = số nhãn đọc được', tongGoi(hai) === 3 && hai.soDoc === 3);

  const thieu = quet([nhan(10012, 300), nhan(10012, 310)], { maNhan: MA_NHAN, datLo: datLo() });
  ok('Lô của tảng không đủ trên sổ (còn 1, quét 2) → cả 2 khay về dòng theo món (hạn gần lấy trước), không dòng lô',
     thieu.theoLo.length === 0 && thieu.dong.length === 1 && thieu.dong[0].so_goi === '2' && tongGoi(thieu) === 2, JSON.stringify(thieu));
  ok('… và có câu nói rõ: sổ chỉ còn 1 khay của tảng #0002 ở Kho lạnh, máy lấy hàng hạn gần trước (vi + en)',
     thieu.loi.some(c => /chỉ còn 1 khay/.test(c) && /#0002/.test(c) && /Kho lạnh/.test(c) && /hạn gần/.test(c))
     && thieu.loiEn.some(c => /#0002/.test(c) && /only 1 khay/.test(c) && !VIET.test(c.replace(/Kho lạnh|Ribeye/g, ''))), `${thieu.loi.join(' · ')} || ${thieu.loiEn.join(' · ')}`);

  const khongCo = quet([nhan(10011, 300)], { maNhan: MA_NHAN, datLo: datLo({ lo: LO_NOI_LAY().filter(l => l.lo_id !== L(1)), tenNoiLay: 'Quầy thịt' }) });
  ok('Tảng không còn hàng ở nơi lấy → về dòng theo món, câu báo "không còn khay nào của tảng #0001 ở Quầy thịt"',
     khongCo.theoLo.length === 0 && khongCo.dong[0]?.so_goi === '1' && khongCo.loi.some(c => /không còn khay nào/.test(c) && /#0001/.test(c) && /Quầy thịt/.test(c)),
     khongCo.loi.join(' · '));

  const tronMa = quet([nhan(10011, 300), nhan(10010, 300), nhan(90001, 300)], { maNhan: MA_NHAN, datLo: datLo() });
  ok('Trộn nhãn mã ô với nhãn mã món / mã giảm của cùng món → cả 3 khay về MỘT dòng theo món (không tách hai phần)',
     tronMa.theoLo.length === 0 && tronMa.dong.length === 1 && tronMa.dong[0].so_goi === '3' && tronMa.loi.length === 0, JSON.stringify(tronMa));

  const daGhiMon = quet([nhan(10011, 300)], { maNhan: MA_NHAN, datLo: datLo({ dong: [{ mat_hang_id: U(1), so_goi: '2', so_kg: '' }] }) });
  ok('Món đang có số ở dòng theo món → nhãn mã ô cũng về dòng theo món (không tạo cảnh "ghi ở cả hai phần")',
     daGhiMon.theoLo.length === 0 && daGhiMon.dong[0]?.so_goi === '1' && XUAT.gopDong([{ mat_hang_id: U(1), so_goi: '2', so_kg: '' }], daGhiMon.dong)[0].so_goi === '3');

  const dot2 = quet([nhan(10011, 300)], { maNhan: MA_NHAN, datLo: datLo({ theoLo: [{ lo_id: L(1), mat_hang_id: U(1), so_goi: '4', so_kg: '1,2' }] }) });
  const gop = typeof XUAT.gopDongLo === 'function'
    ? XUAT.gopDongLo([{ lo_id: L(1), mat_hang_id: U(1), so_goi: '4', so_kg: '1,2' }, { lo_id: L(2), mat_hang_id: U(1), so_goi: '', so_kg: '' }], dot2.theoLo ?? []) : [];
  ok('Quét đợt hai: cộng vào số đã ghi ở dòng lô (4 + 1 = 5 khay, 1,5 kg), dòng lô khác giữ nguyên',
     dot2.theoLo?.[0]?.so_goi === '1' && gop.find(l => l.lo_id === L(1))?.so_goi === '5' && gop.find(l => l.lo_id === L(1))?.so_kg === '1,5'
     && gop.find(l => l.lo_id === L(2))?.so_goi === '', JSON.stringify(gop));
  const dot3 = quet([nhan(10011, 300), nhan(10011, 310)], { maNhan: MA_NHAN, datLo: datLo({ theoLo: [{ lo_id: L(1), mat_hang_id: U(1), so_goi: '4', so_kg: '' }] }) });
  ok('Đợt hai vượt tồn của lô (đã ghi 4, quét thêm 2, lô còn 5) → 2 khay về dòng theo món, có câu báo',
     dot3.theoLo.length === 0 && dot3.dong[0]?.so_goi === '2' && dot3.loi.some(c => /chỉ còn 5 khay/.test(c) && /#0001/.test(c)), dot3.loi.join(' · '));

  const chuaChot = quet([nhan(10021, 262)], { maNhan: MA_NHAN, datLo: datLo() });
  ok('Ô đang giao cho phiên lóc chưa chốt (chưa có lô) → về dòng theo món, câu báo nói khay chưa vào sổ',
     chuaChot.theoLo.length === 0 && chuaChot.dong[0]?.mat_hang_id === U(3) && chuaChot.loi.some(c => /#0003/.test(c) && /chưa chốt/.test(c)), chuaChot.loi.join(' · '));
  const oTrong = quet([nhan(10011, 300)], { maNhan: MA_NHAN, datLo: datLo({ giao: [] }) });
  ok('Ô không còn gắn với tảng nào → về dòng theo món, câu báo nói rõ',
     oTrong.theoLo.length === 0 && oTrong.dong[0]?.so_goi === '1' && oTrong.loi.some(c => /không còn gắn với tảng nào/.test(c)), oTrong.loi.join(' · '));

  const hetHan = them => quet([nhan(10011, 300), nhan(10011, 310), nhan(10010, 290)], { maNhan: MA_NHAN, datLo: datLo({
    lo: LO_NOI_LAY().map(l => (l.lo_id === L(1) ? { ...l, tinh_trang_han: 'het_han', han_dung: '2026-10-09' } : l)), ...them }) });
  const hh = hetHan({ chiConHan: true });
  ok('Lô của tảng ĐÃ HẾT HẠN + phiếu chỉ nhận hàng còn hạn → 2 khay đó KHÔNG được ghi vào đâu; khay mã món vẫn ghi',
     hh.theoLo.length === 0 && hh.dong.length === 1 && hh.dong[0].so_goi === '1' && hh.soDoc === 1 && hh.soHetHan === 2, JSON.stringify(hh));
  ok('… câu báo: 2 khay Ribeye của tảng #0001 đã hết hạn (hạn dùng 09/10/2026) — để riêng, báo hủy (vi + en)',
     hh.loi.some(c => /2 khay Ribeye/.test(c) && /#0001/.test(c) && /09\/10\/2026/.test(c) && /báo hủy/.test(c))
     && hh.loiEn.some(c => /#0001/.test(c) && /09\/10\/2026/.test(c) && /write/.test(c) && !VIET.test(c.replace(/Ribeye/g, ''))), `${hh.loi.join(' · ')} || ${hh.loiEn.join(' · ')}`);
  const huy = hetHan({ chiConHan: false });
  ok('Báo hủy (không cần còn hạn): trộn mã món nên cả 3 khay về dòng theo món; chỉ nhãn mã ô thì vào đúng lô hết hạn',
     huy.dong[0]?.so_goi === '3' && quet([nhan(10011, 300)], { maNhan: MA_NHAN, datLo: datLo({
       lo: LO_NOI_LAY().map(l => (l.lo_id === L(1) ? { ...l, tinh_trang_han: 'het_han' } : l)) }) }).theoLo[0]?.lo_id === L(1));

  const kg = quet([nhan(10031, 750), nhan(10031, 800)], { maNhan: MA_NHAN, datLo: datLo() });
  ok('Món cân ký in mã ô → dòng lô ghi kg (1,55 kg), không ghi số gói',
     kg.theoLo.length === 1 && kg.theoLo[0].lo_id === L(4) && kg.theoLo[0].so_kg === '1,55' && kg.theoLo[0].so_goi === '', JSON.stringify(kg.theoLo));
  const kgQua = quet([nhan(10031, 1200), nhan(10031, 900)], { maNhan: MA_NHAN, datLo: datLo() });
  ok('Món cân ký quét quá số kg của lô (2,1 > 2) → về dòng theo món, câu báo ghi kg kiểu Việt',
     kgQua.theoLo.length === 0 && kgQua.dong[0]?.so_kg === '2,1' && kgQua.loi.some(c => /chỉ còn 2 kg/.test(c)), kgQua.loi.join(' · '));

  // Form đọc lại đúng những dòng đó, một lần.
  const f = new FormData();
  f.set('so_dong', '0'); f.set('so_lo', '2');
  hai.theoLo.forEach((l, i) => { f.set(`l${i}_lo`, l.lo_id); f.set(`l${i}_mat_hang`, l.mat_hang_id); f.set(`l${i}_so_goi`, l.so_goi); f.set(`l${i}_so_kg`, l.so_kg); });
  const d = XUAT.docFormPhieuXuat(f, MON);
  ok('Dòng lô vừa quét qua form thành đúng 2 dòng gửi database, mang lo_id, không lỗi',
     d.loi.length === 0 && d.payload.length === 2 && d.payload.every(p => p.lo_id && p.mat_hang_id === U(1))
     && d.payload.reduce((s, p) => s + p.so_goi, 0) === 3, JSON.stringify(d.payload));
  ok('Tóm tắt hàng tính cả dòng lô: "3 khay Ribeye (0,91 kg)"',
     XUAT.tomTatHang([...hai.dong, ...hai.theoLo], MON) === '3 khay Ribeye (0,91 kg)', XUAT.tomTatHang([...hai.dong, ...(hai.theoLo ?? [])], MON));
});

// ===========================================================================
await nhom('4 · KIỂM KÊ DÁN NHÃN (apDungQuet)', async () => {
  const dong = [{ mat_hang_id: U(1), lo_id: '', goi: '9', kg: '', het: true }];
  const ma = [nhan(10011, 312), nhan(10011, 298), nhan(10012, 300), nhan(90001, 305), nhan(10010, 290), nhan(10021, 262)].join('\n');
  const q = KIEM_KE.apDungQuet(dong, ma, MON, null, 3, MA_NHAN);
  const rib = q.dong.find(d => d.mat_hang_id === U(1));
  ok('HỒI QUY: nhãn mã ô, mã giảm, mã món của cùng một món cộng vào MỘT số đếm: 5 khay, 1,505 kg (không mã nào đè mã nào)',
     rib?.goi === '5' && rib?.kg === '1,505' && rib?.het === false, JSON.stringify(rib));
  ok('HỒI QUY: không gói nào bị coi là lạ; đếm 2 món từ 6 nhãn', q.soGoiLa === 0 && q.soDoc === 6 && q.soHang === 2 && q.loi.length === 0, JSON.stringify(q));
  ok('Món chỉ có ô mã được thêm thành dòng mới', q.dong.some(d => d.mat_hang_id === U(3) && d.goi === '1' && d.kg === '0,262'));
  ok('Tóm tắt dùng đơn vị của món: "5 khay Ribeye (1,505 kg), 1 khay Skirt (0,262 kg)"',
     q.tomTat === '5 khay Ribeye (1,505 kg), 1 khay Skirt (0,262 kg)' && q.tomTatEn === '5 khay Ribeye (1.505 kg), 1 khay Skirt (0.262 kg)', `${q.tomTat} | ${q.tomTatEn}`);
  const cu = KIEM_KE.apDungQuet(dong, ma, MON);
  ok('Không truyền ô mã / mã giảm → như trước (chỉ nhãn mã món: 1 khay, 5 gói lạ)', cu.soDoc === 1 && cu.soGoiLa === 5);
});

// ===========================================================================
await nhom('5 · LUỒNG THẬT TRÊN PGlite: NHÃN MÃ Ô → PHIẾU TRỪ ĐÚNG LÔ CỦA TẢNG', async () => {
  const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
  const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
  const chay = async (uid, sql, gt = []) => { const r = await duoi(uid, sql, gt); if (r.loi) throw new Error(`${sql.slice(0, 70)}… → ${r.loi}`); return r.rows; };
  await chay(UID.qlA, `update kho_mat_hang set theo_tang = true where ma = 'T-THANNGOAI'`);
  const ct = (await chay(UID.qlA, `insert into kho_cong_thuc_pha (mat_hang_vao_id, ten) values ($1, 'Thăn ngoại') returning id`, [MH['T-THANNGOAI'].id]))[0].id;
  await chay(UID.qlA, `insert into kho_cong_thuc_pha_dong (cong_thuc_id, mat_hang_ra_id, ty_le_du_kien) values ($1, $2, 70)`, [ct, MH['C-THANNGOAI'].id]);
  const ncc = (await chay(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC Úc') returning id`))[0].id;
  const mo = await ngay(-14);
  const pn = (await chay(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null, p_loai => 'mua', p_nha_cung_cap_id => $3,
      p_vi_tri_id => $4, p_ngay_nhap => $5::date, p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cnA.id, maGui(), ncc, vt.kho, await ngay(-10), JSON.stringify([1, 2].map(i => (
      { mat_hang_id: MH['T-THANNGOAI'].id, so_kg: 6 + i / 10, so_kg_thuc: 6 + i / 10, don_gia_kg: 500000, ngay_mo: mo })))]))[0];
  await chay(UID.thuKhoA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [pn.phieu_id, pn.phien_ban_moi]);
  await chay(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [pn.phieu_id]);
  const tang = (await db.query(`select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1 order by d.thu_tu`, [pn.phieu_id])).rows;
  ok('Hai tảng thăn ngoại #1, #2 đã vào kho', tang.map(t => t.so_tang).join() === '1,2');

  // Lóc từng tảng: giao ô, quét nhãn mã ô, chốt → mỗi tảng một lô phần cắt ở kho lạnh.
  const loCat = [];
  for (const [i, khay] of [[0, [500, 520, 480]], [1, [400, 410]]]) {
    const ph = (await chay(UID.thuKhoA, `
      select * from kho_luu_phien_pha(p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
        p_mat_hang_vao_id => $3, p_cong_thuc_id => null, p_ngay_pha => $4::date, p_ghi_chu => null, p_vao => $5::jsonb, p_ra => '[]'::jsonb)`,
      [cnA.id, maGui(), MH['T-THANNGOAI'].id, homNay, JSON.stringify([{ lo_id: tang[i].id, vi_tri_id: vt.kho }])]))[0].phien_id;
    const o = (await chay(UID.thuKhoA, `select kho_giao_o_ma($1, null) as kq`, [ph]))[0].kq[0];
    await chay(UID.thuKhoA, `select kho_quet_phien_pha(p_id => $1, p_ma_gui => $2, p_ma => $3::jsonb)`,
      [ph, maGui(), JSON.stringify(khay.map(g => nhan(o.ma_can, g)))]);
    const pb = (await db.query(`select phien_ban from kho_phien_pha where id = $1`, [ph])).rows[0].phien_ban;
    await chay(UID.thuKhoA, `select kho_chot_phien_pha($1, $2)`, [ph, pb]);
    loCat.push({ ma_can: o.ma_can, so_o: o.so_o,
      lo_id: (await db.query(`select lo_id from kho_phien_pha_ra where phien_pha_id = $1 and mat_hang_id = $2`, [ph, MH['C-THANNGOAI'].id])).rows[0].lo_id });
  }
  ok('Tảng #1 giữ ô 1 (10011, 3 khay), tảng #2 giữ ô 2 (10012, 2 khay)', loCat[0].ma_can === '10011' && loCat[1].ma_can === '10012' && !!loCat[0].lo_id && !!loCat[1].lo_id);
  const tonLo = async lo => (await db.query(`select coalesce(sum(so_goi), 0)::int as g from kho_ton where lo_id = $1 and vi_tri_id = $2`, [lo, vt.kho])).rows[0].g;

  // Thủ kho mở phiếu xuất bếp lấy từ Kho lạnh, quét 1 khay của tảng #2 (lô SAU theo hạn — FEFO sẽ lấy nhầm lô tảng #1).
  const tk = clientCua(UID.thuKhoA);
  const [matHang, caiDat, ton, maNhan, giao] = await Promise.all([
    docMatHang(tk), docCaiDat(tk, cnA.id), docTon(tk, cnA.id), O_MA.docMaTrenNhan(tk), O_MA.docGiaoOMaCan(tk, cnA.id),
  ]);
  ok('Thủ kho đọc được ô đang giao: ô 1 → tảng #1, ô 2 → tảng #2, mỗi ô gắn lô phần cắt',
     giao.length === 2 && giao.find(g => g.ma_can === '10011')?.so_tang === 1 && giao.find(g => g.ma_can === '10012')?.lo_id === loCat[1].lo_id, JSON.stringify(giao));
  const loNoiLay = ton.filter(t => t.vi_tri_id === vt.kho);
  const q = XUAT.dongTuQuet(nhan(10012, 400), matHang, caiDat.mau_ma_vach, caiDat.so_le_kg,
    { maNhan, datLo: { giao, lo: loNoiLay, tenNoiLay: 'Kho lạnh', chiConHan: true, dong: [], theoLo: [] } });
  ok('HỒI QUY: quét nhãn mã ô 10012 (tảng #2) → một dòng LÔ đúng lô của tảng #2, 1 khay 0,4 kg',
     q.dong.length === 0 && q.theoLo?.length === 1 && q.theoLo[0].lo_id === loCat[1].lo_id && q.theoLo[0].so_goi === '1' && q.theoLo[0].so_kg === '0,4', JSON.stringify(q));

  const guiPhieu = async (theoLo, dongMon, ma) => {
    const f = new FormData();
    f.set('ma_gui', ma);
    f.set('so_dong', String(dongMon.length));
    dongMon.forEach((d, i) => { f.set(`d${i}_mat_hang`, d.mat_hang_id); f.set(`d${i}_so_goi`, d.so_goi); f.set(`d${i}_so_kg`, d.so_kg); });
    f.set('so_lo', String(theoLo.length));
    theoLo.forEach((l, i) => { f.set(`l${i}_lo`, l.lo_id); f.set(`l${i}_mat_hang`, l.mat_hang_id); f.set(`l${i}_so_goi`, l.so_goi); f.set(`l${i}_so_kg`, l.so_kg); });
    return XUAT.taoPhieuXuat(tk, cnA.id, f, { loai: 'xuat_bep', viTriId: vt.kho, matHang });
  };
  const ma1 = maGui();
  const kq = await guiPhieu(q.theoLo ?? [], q.dong, ma1);
  ok('Ghi phiếu xuất bếp: câu báo dùng đơn vị của món ("1 khay Thăn ngoại cắt lát")', kq.ok && /1 khay Thăn ngoại cắt lát/.test(kq.cau), kq.cau);
  const so = (await db.query(`select lo_id, so_goi, loai from kho_so_cai where chung_tu_id = $1`, [kq.id])).rows;
  ok('HỒI QUY: sổ kho trừ ĐÚNG lô của tảng #2 (không phải lô tảng #1 hạn gần hơn)',
     so.length === 1 && so[0].lo_id === loCat[1].lo_id && so[0].so_goi === -1 && await tonLo(loCat[0].lo_id) === 3 && await tonLo(loCat[1].lo_id) === 1, JSON.stringify(so));
  const lai = await guiPhieu(q.theoLo ?? [], q.dong, ma1);
  ok('Bấm hai lần (cùng ma_gui): vẫn một phiếu, kho không trừ lần hai',
     lai.ok && /đã được ghi từ lần bấm trước/.test(lai.cau) && lai.id === kq.id && await tonLo(loCat[1].lo_id) === 1
     && (await db.query(`select count(*)::int as n from kho_phieu_xuat where ma_gui = $1`, [ma1])).rows[0].n === 1, lai.cau);

  // Nhãn mã giảm (không mang số tảng) → dòng theo món → database lấy lô hạn gần trước (lô tảng #1).
  const ton2 = (await docTon(tk, cnA.id)).filter(t => t.vi_tri_id === vt.kho);
  const qg = XUAT.dongTuQuet(nhan(90001, 500), matHang, caiDat.mau_ma_vach, caiDat.so_le_kg,
    { maNhan, datLo: { giao, lo: ton2, tenNoiLay: 'Kho lạnh', chiConHan: true, dong: [], theoLo: [] } });
  const kg = await guiPhieu(qg.theoLo ?? [], qg.dong, maGui());
  ok('Nhãn mã giảm 90001 → dòng theo món → trừ lô hạn gần trước (lô tảng #1 còn 2 khay)',
     qg.dong.length === 1 && (qg.theoLo ?? []).length === 0 && kg.ok && await tonLo(loCat[0].lo_id) === 2 && await tonLo(loCat[1].lo_id) === 1, kg.cau);

  // Quét quá số khay còn trên sổ của tảng #2 (còn 1, quét 2) → về dòng theo món; database lấy theo hạn gần trước.
  const ton3 = (await docTon(tk, cnA.id)).filter(t => t.vi_tri_id === vt.kho);
  const qq = XUAT.dongTuQuet([nhan(10012, 400), nhan(10012, 410)].join('\n'), matHang, caiDat.mau_ma_vach, caiDat.so_le_kg,
    { maNhan, datLo: { giao, lo: ton3, tenNoiLay: 'Kho lạnh', chiConHan: true, dong: [], theoLo: [] } });
  const kq3 = await guiPhieu(qq.theoLo ?? [], qq.dong, maGui());
  ok('Quét 2 khay tảng #2 khi sổ còn 1 → dòng theo món, phiếu vẫn ghi được (2 khay lấy theo hạn gần trước), tổng tồn giảm đúng 2',
     qq.dong[0]?.so_goi === '2' && (qq.theoLo ?? []).length === 0 && kq3.ok && await tonLo(loCat[0].lo_id) + await tonLo(loCat[1].lo_id) === 1, kq3.cau);

  // NV quầy (vai thấp nhất) tự tra được nhãn: đọc ô mã, mã giảm, ô đang giao bằng phiên của mình.
  const nv = clientCua(UID.nvQuayA);
  const [mhNv, maNv, giaoNv] = await Promise.all([docMatHang(nv), O_MA.docMaTrenNhan(nv), O_MA.docGiaoOMaCan(nv, cnA.id)]);
  const khop = tra(taoBang(mhNv, maNv.oMa, maNv.maGiam), '10011');
  ok('NV quầy: nhãn 10011 → Thăn ngoại cắt lát · ô 1 · tảng #1 (oDangGiao)',
     khop?.matHang.ma === 'C-THANNGOAI' && TRA.oDangGiao(khop, giaoNv)?.so_tang === 1 && TRA.oDangGiao(khop, giaoNv)?.lo_id === loCat[0].lo_id);
  ok('oDangGiao: nhãn mã món / mã giảm không thuộc ô nào → null; ô chưa giao cho tảng nào → null',
     TRA.oDangGiao(tra(taoBang(mhNv, maNv.oMa, maNv.maGiam), '301'), giaoNv) === null
     && TRA.oDangGiao(tra(taoBang(mhNv, maNv.oMa, maNv.maGiam), '90001'), giaoNv) === null
     && TRA.oDangGiao(tra(taoBang(mhNv, maNv.oMa, maNv.maGiam), '10021'), giaoNv) === null);

  const ds = (await db.query(`select * from kho_doi_soat_ton()`)).rows;
  ok('kho_doi_soat_ton() rỗng sau mọi phiếu', ds.length === 0, JSON.stringify(ds));
});

// ===========================================================================
await nhom('6 · BỐN CHỖ TRA MÃ Ở WEB ĐỀU DÙNG BỘ TRA CHUNG', async () => {
  const quetTrang = doc('web/src/pages/noi-bo/kho/quet.astro');
  const maVach = doc('web/src/pages/noi-bo/kho/cai-dat/ma-vach.astro');
  const xuatTs = doc('web/src/lib/kho/xuat.ts');
  const kiemKeTs = doc('web/src/lib/kho/kiem-ke.ts');
  const xuatTrang = doc('web/src/pages/noi-bo/kho/xuat/[id].astro');
  const kiemKeTrang = doc('web/src/pages/noi-bo/kho/kiem-ke/[id].astro');
  const soKieuCu = /\.ma_can\s*===\s*kq\.maCan/;
  ok('HỒI QUY: màn Quét nhãn không còn tự so m.ma_can === kq.maCan, dùng traMaCan', !soKieuCu.test(quetTrang) && /traMaCan\(/.test(quetTrang));
  ok('HỒI QUY: màn Mã vạch (Thử một nhãn) không còn tự so m.ma_can === kq.maCan, dùng traMaCan', !soKieuCu.test(maVach) && /traMaCan\(/.test(maVach));
  ok('HỒI QUY: dongTuQuet và apDungQuet không còn dựng bảng tra riêng theo ma_can, dùng taoBangTraMaCan',
     !/theoCan/.test(xuatTs) && !/theoCan/.test(kiemKeTs) && /taoBangTraMaCan\(/.test(xuatTs) && /taoBangTraMaCan\(/.test(kiemKeTs));
  ok('Trang phiếu xuất truyền ô mã / mã giảm và chỗ đặt lô cho dongTuQuet; trang kiểm kê truyền ô mã / mã giảm cho apDungQuet',
     /dongTuQuet\([\s\S]{0,300}maNhan[\s\S]{0,200}datLo/.test(xuatTrang) && /apDungQuet\([\s\S]{0,200}maNhan/.test(kiemKeTrang));
  // Không thêm lượt chờ: ô mã / mã giảm đọc trong CÙNG Promise.all với thứ trang vốn đã đọc.
  // Lời gọi docMaTrenNhan( nằm TRONG một Promise.all([ … ]) chưa đóng, và Promise.all đó cũng đọc danh mục / cài đặt.
  const cungLuot = s => {
    const i = s.indexOf('docMaTrenNhan(');
    if (i < 0) return false;
    const dau = s.lastIndexOf('Promise.all([', i);
    if (dau < 0 || /\]\s*\)\s*;/.test(s.slice(dau, i))) return false;
    const cuoi = s.indexOf(']);', i);
    return /doc(MatHang|CaiDat)\(/.test(s.slice(dau, cuoi < 0 ? undefined : cuoi));
  };
  for (const [ten, s] of [['Quét nhãn', quetTrang], ['Mã vạch', maVach], ['Phiếu xuất', xuatTrang], ['Kiểm kê', kiemKeTrang]]) {
    ok(`${ten}: docMaTrenNhan nằm trong cùng Promise.all với danh mục (không thêm lượt chờ)`, cungLuot(s));
  }
  ok('docMaTrenNhan đọc hai bảng song song, mỗi yêu cầu một lần', /Promise\.all\(\[\s*docOMa\(client\),\s*docMaGiam\(client\)\s*\]\)/.test(doc('web/src/lib/kho/o-ma.ts')));

  const traTs = TRA ? doc('web/src/lib/kho/tra-ma-can.ts') : '';
  const nhapChay = s => [...s.matchAll(/^\s*import\s+(?!type\b)[^;]*;/gm)].map(m => m[0].trim());
  ok('tra-ma-can.ts là file thuần: không import gì lúc chạy, không gọi database', !!traTs && nhapChay(traTs).length === 0 && !/\.from\(|\.rpc\(/.test(traTs), nhapChay(traTs).join(' | '));
  ok('ma-vach.ts vẫn không import gì', !/^\s*import\s/m.test(doc('web/src/lib/kho/ma-vach.ts')));

  // Câu của màn Quét nhãn: ô + tảng, ô đang trống, tem giảm — đủ vi và en.
  const co = (s, vi, en) => vi.test(s) && en.test(s);
  ok('Quét nhãn có câu "Ô … · tảng …" (vi + en)', co(quetTrang, /vi: \(o: number, tang: string\) => `Ô \$\{o\} · tảng \$\{tang\}`/, /en: \(o: number, tang: string\) => `Slot \$\{o\} · primal \$\{tang\}`/));
  ok('Quét nhãn có câu ô hiện không gắn với tảng nào (vi + en)', co(quetTrang, /hiện không gắn với tảng nào/, /not assigned to a primal right now/));
  ok('Quét nhãn có câu "Tem giảm …%" (vi + en)', co(quetTrang, /Tem giảm \$\{pt\}%/, /\$\{pt\}% discount label/));
  ok('Quét nhãn: nút Đưa bếp / Báo hủy mở đúng lô của tảng trên nhãn (loCuaNhan)', /loCuaNhan/.test(quetTrang) && /linkLo\('xuat_bep'/.test(quetTrang) && /linkLo\('huy'/.test(quetTrang));
  ok('Quét nhãn, Mã vạch: không còn chữ "gói" viết cứng khi đã biết món (dùng don_vi_goi)',
     !/Gói này:/.test(quetTrang) && !/không còn gói nào của món này/.test(quetTrang) && /don_vi_goi/.test(quetTrang));
});

process.exit(ketThuc('TRA MÃ CÂN TRÊN NHÃN (WEB)'));
