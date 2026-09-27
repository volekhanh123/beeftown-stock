/**
 * BEEFTOWN CRM — Kiểm thử: ba hàm definer tự kiểm vai (migration 0045)
 * ====================================================================
 *
 *     node test/test-quyen-ham-crm.mjs
 *
 * ghi_luot_ghe(), tim_hoac_tao_khach() và xep_hang_gui_tin() đi xuyên RLS, và
 * vai authenticated vẫn giữ EXECUTE mà Supabase cấp mặc định. Nên câu hỏi
 * không phải "ai gọi được hàm" mà "gọi rồi thì hàm có từ chối đúng người
 * không".
 *
 * Dựng database bằng khung của test-kho-*.mjs, có chủ đích: kho-chung.mjs
 * KHÔNG cấp EXECUTE hàng loạt cho authenticated, nên quyền ở đây đúng là quyền
 * trên Supabase thật. Mục 1 chứng minh đường tấn công có thật trước khi các
 * mục sau chứng minh nó đã bị chặn.
 */

import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — BA HÀM DEFINER TỰ KIỂM VAI (0045)');
const { db, cnA, cnB, nsId, duoiAnon } = await dungDatabase();

// Hai kiểu người mà khung dùng chung chưa có:
//   · tài khoản Supabase Auth đăng nhập được nhưng KHÔNG có dòng nhan_su —
//     đúng thứ một người lạ có được nếu dự án bật đăng ký;
//   · thu ngân đã nghỉ việc (dang_lam = false).
const UID_LA = '00000000-0000-4000-8000-0000000000aa';
const UID_TN_NGHI = '00000000-0000-4000-8000-0000000000ac';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam)
                values ($1, $2, 'Thu ngân đã nghỉ', 'thu_ngan', false)`, [UID_TN_NGHI, cnA.id]);

for (const cn of [cnA, cnB]) {
  await db.query(`insert into cau_hinh_tich_diem (chi_nhanh_id, dang_bat) values ($1, true)`, [cn.id]);
}
for (let i = 1; i <= 4; i++) {
  await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1, $2, 4)`, [cnA.id, `B0${i}`]);
}

/**
 * Như duoi() của kho-chung.mjs, nhưng trả kèm SQLSTATE: bài này phải thấy
 * đúng mã 42501 (insufficient_privilege), không chỉ một câu báo lỗi bất kỳ.
 */
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

const biTuChoi = (r, cau) => r.loi !== null && r.ma === '42501' && cau.test(r.loi);
const vi = r => (r.loi ? `${r.ma}: ${r.loi}` : 'CHẠY ĐƯỢC');

const ngayKia = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

// ===========================================================================
await nhom('1 · TIỀN ĐỀ — authenticated gọi được cả ba hàm, nên hàm phải tự chặn', async () => {
  for (const ham of [
    'ghi_luot_ghe(uuid,text,bigint,text,smallint,bigint,boolean,text,uuid)',
    'tim_hoac_tao_khach(text,text,uuid,text,text,text)',
    'xep_hang_gui_tin(uuid,uuid,text,text,uuid)',
  ]) {
    const { rows: [{ duoc }] } = await db.query(
      `select has_function_privilege('authenticated', $1::regprocedure, 'execute') as duoc`, [ham]);
    ok(`authenticated vẫn có EXECUTE trên ${ham.split('(')[0]}() — /noi-bo cần, nên chặn phải nằm trong thân hàm`,
       duoc === true);
  }

  // Đổi chữ ký sẽ sinh OVERLOAD, và bản cũ không kiểm vai vẫn gọi được
  // (README, lưu ý 6).
  const { rows } = await db.query(`
    select p.proname, count(*)::int as so_ban, bool_and(p.prosecdef) as definer
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('ghi_luot_ghe', 'tim_hoac_tao_khach', 'xep_hang_gui_tin')
    group by p.proname`);
  ok('Mỗi hàm đúng MỘT phiên bản và vẫn là security definer — không sinh overload',
     rows.length === 3 && rows.every(r => r.so_ban === 1 && r.definer), JSON.stringify(rows));
});

// ===========================================================================
await nhom('2 · ghi_luot_ghe() — chủ sở hữu, quản lý, thu ngân của ĐÚNG chi nhánh', async () => {
  const GHI = `select * from ghi_luot_ghe($1, '0955555555', 500000::bigint)`;
  const CAU = /Chỉ chủ sở hữu, quản lý hoặc thu ngân của chi nhánh này/;

  for (const [ai, uid, cn] of [
    ['Marketing Q1', UID.mktA, cnA.id],
    ['Tài khoản đăng nhập KHÔNG có dòng nhan_su', UID_LA, cnA.id],
    ['Thu ngân đã nghỉ việc', UID_TN_NGHI, cnA.id],
    ['Thủ kho Q1', UID.thuKhoA, cnA.id],
    ['Thu ngân Q1 ghi vào chi nhánh Q7', UID.thuNganA, cnB.id],
    ['Quản lý Q7 ghi vào chi nhánh Q1', UID.qlB, cnA.id],
  ]) {
    const r = await duoi(uid, GHI, [cn]);
    ok(`${ai} → bị từ chối, không tự phát được điểm`, biTuChoi(r, CAU), vi(r));
  }

  const tn = await duoi(UID.thuNganA, GHI, [cnA.id]);
  ok('Thu ngân Q1 ghi được lượt ghé ở Q1', tn.loi === null && tn.rows?.length === 1, vi(tn));
  ok('…và khách được tích điểm như thường (3% của 500.000đ)',
     Number(tn.rows?.[0]?.diem_tich_duoc) === 15000, `tích ${tn.rows?.[0]?.diem_tich_duoc}`);

  if (tn.rows?.length) {
    const { rows: [ghi] } = await db.query(`
      select lg.created_by,
             count(sc.id)::int as so_dong,
             (count(sc.id) filter (where sc.created_by = lg.created_by))::int as dung_nguoi
      from luot_ghe lg left join so_cai_diem sc on sc.luot_ghe_id = lg.id
      where lg.id = $1
      group by lg.created_by`, [tn.rows[0].luot_ghe_id]);
    ok('Lượt ghé và dòng sổ cái ghi danh ĐÚNG thu ngân đang đăng nhập, dù không truyền p_nhan_su_id',
       ghi.created_by === nsId[UID.thuNganA] && ghi.so_dong > 0 && ghi.dung_nguoi === ghi.so_dong,
       JSON.stringify(ghi));
  }

  const mao = await duoi(UID.thuNganA,
    `select * from ghi_luot_ghe($1, '0955555555', 200000::bigint, p_nhan_su_id => $2)`,
    [cnA.id, nsId[UID.qlA]]);
  ok('Thu ngân KHÔNG ghi được dưới tên quản lý (p_nhan_su_id của người khác)',
     biTuChoi(mao, /dưới tên một nhân sự khác/), vi(mao));

  const minh = await duoi(UID.thuNganA,
    `select * from ghi_luot_ghe($1, '0955555555', 200000::bigint, p_nhan_su_id => $2)`,
    [cnA.id, nsId[UID.thuNganA]]);
  ok('Truyền đúng id của chính mình thì vẫn ghi được', minh.loi === null, vi(minh));

  const ql = await duoi(UID.qlA, GHI, [cnA.id]);
  ok('Quản lý Q1 ghi được ở Q1', ql.loi === null, vi(ql));

  const chu = await duoi(UID.chu, GHI, [cnB.id]);
  ok('Chủ sở hữu ghi được ở chi nhánh bất kỳ (Q7)', chu.loi === null, vi(chu));
});

// ===========================================================================
await nhom('3 · tim_hoac_tao_khach() — chủ sở hữu, quản lý, thu ngân', async () => {
  // Khách có sẵn, đã ăn ở Q1: hàm sẽ UPDATE rồi trả về NGUYÊN dòng của họ.
  await db.query(`select * from ghi_luot_ghe($1, '0988888888', 250000::bigint)`, [cnA.id]);
  const TIM = `select * from tim_hoac_tao_khach('0988888888', 'Khách Q1')`;
  const CAU = /Chỉ chủ sở hữu, quản lý hoặc thu ngân mới tra cứu hay tạo được hồ sơ khách/;

  for (const [ai, uid] of [
    ['Marketing Q1', UID.mktA],
    ['Tài khoản đăng nhập KHÔNG có dòng nhan_su', UID_LA],
    ['Thu ngân đã nghỉ việc', UID_TN_NGHI],
    ['Thủ kho Q1', UID.thuKhoA],
  ]) {
    const r = await duoi(uid, TIM);
    ok(`${ai} → bị từ chối, không nhận được dòng khách nào`, biTuChoi(r, CAU) && r.rows === null,
       r.rows ? `trả về ${JSON.stringify(r.rows[0])}` : vi(r));
  }

  for (const [ai, uid] of [['Thu ngân Q1', UID.thuNganA], ['Quản lý Q1', UID.qlA], ['Chủ sở hữu', UID.chu]]) {
    const r = await duoi(uid, TIM);
    ok(`${ai} tra được khách`, r.loi === null && r.rows?.[0]?.sdt === '0988888888', vi(r));
  }
});

// ===========================================================================
await nhom('4 · xep_hang_gui_tin() — chủ sở hữu, quản lý, marketing của ĐÚNG chi nhánh', async () => {
  // ZBS-04 là tin giao dịch: không cần khách đồng ý, chỉ cần đã từng ghé.
  await db.query(`update mau_tin set da_duyet = true, ma_zalo = 'zbs-04-kiem-thu' where ma = 'ZBS-04'`);
  const { rows: [{ khach_hang_id: khach }] } = await db.query(
    `select khach_hang_id from ghi_luot_ghe($1, '0912121212', 150000::bigint)`, [cnA.id]);
  const XEP = `select xep_hang_gui_tin($1, $2, 'ZBS-04') as id`;
  const CAU = /Chỉ chủ sở hữu, quản lý hoặc marketing của chi nhánh này/;

  for (const [ai, uid, cn] of [
    ['Thu ngân Q1 (thu ngân không chạy chiến dịch)', UID.thuNganA, cnA.id],
    ['Tài khoản đăng nhập KHÔNG có dòng nhan_su', UID_LA, cnA.id],
    ['Thủ kho Q1', UID.thuKhoA, cnA.id],
    ['Marketing Q1 ghi tin vào sổ chi nhánh Q7', UID.mktA, cnB.id],
  ]) {
    const r = await duoi(uid, XEP, [cn, khach]);
    ok(`${ai} → bị từ chối`, biTuChoi(r, CAU), vi(r));
  }

  for (const [ai, uid] of [['Marketing Q1', UID.mktA], ['Quản lý Q1', UID.qlA], ['Chủ sở hữu', UID.chu]]) {
    const r = await duoi(uid, XEP, [cnA.id, khach]);
    ok(`${ai} xếp được tin ở Q1`, r.loi === null && !!r.rows?.[0]?.id, vi(r));
  }
});

// ===========================================================================
await nhom('5 · KHÔNG CÓ PHIÊN ĐĂNG NHẬP THÌ NHƯ CŨ — website, service_role, seed', async () => {
  const moi = await duoiAnon(
    `select * from tao_dat_ban('q1', '0923232323', 'Khách đặt web', $1::date, '18:00'::time, 2::smallint)`,
    [ngayKia]);
  ok('anon đặt bàn trên website được, có mã đặt bàn', moi.loi === null && moi.rows?.[0]?.ma_dat_ban?.length === 6,
     moi.loi ?? '');
  const { rows: [{ n }] } = await db.query(`select count(*)::int as n from khach_hang where sdt = '0923232323'`);
  ok('…và tim_hoac_tao_khach() bên trong đã tạo hồ sơ khách', n === 1, `có ${n} hồ sơ`);

  // Nhánh còn lại của tim_hoac_tao_khach(): khách đã có hồ sơ, hàm UPDATE.
  await db.query(`select * from tim_hoac_tao_khach('0945454545')`);
  const cu = await duoiAnon(
    `select * from tao_dat_ban('q1', '0945454545', 'Khách quen', $1::date, '19:00'::time, 2::smallint)`,
    [ngayKia]);
  ok('anon đặt bàn cho khách đã có hồ sơ cũng được', cu.loi === null && cu.rows?.length === 1, cu.loi ?? '');

  const coPhien = await duoi(UID_LA,
    `select * from tao_dat_ban('q1', '0934343434', 'Có phiên', $1::date, '18:30'::time, 2::smallint)`,
    [ngayKia]);
  ok('Gọi tao_dat_ban() bằng phiên KHÔNG phải nhân sự → bị chặn ở bước tạo khách (website luôn gọi bằng anon)',
     biTuChoi(coPhien, /Chỉ chủ sở hữu, quản lý hoặc thu ngân/), vi(coPhien));

  // Không có phiên (POS chạy bằng service_role, seed): tham số vẫn được tin.
  const { rows: [pos] } = await db.query(
    `select * from ghi_luot_ghe($1, '0977777777', 300000::bigint, p_nhan_su_id => $2)`,
    [cnA.id, nsId[UID.thuNganA]]);
  const { rows: [{ created_by }] } = await db.query(
    `select created_by from luot_ghe where id = $1`, [pos.luot_ghe_id]);
  ok('Không có phiên: ghi_luot_ghe() vẫn chạy và vẫn ghi danh theo p_nhan_su_id',
     created_by === nsId[UID.thuNganA], `created_by = ${created_by}`);
});

process.exit(ketThuc('QUYỀN HÀM CRM'));
