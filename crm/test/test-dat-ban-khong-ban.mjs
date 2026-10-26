/**
 * BEEFTOWN CRM — Kiểm thử: đặt bàn không cần nhập bàn trước (0100) và màn Cài đặt gọn (26/10/2026)
 * ================================================================================================
 *
 *     node test/test-dat-ban-khong-ban.mjs
 *
 * Ngày 26/10/2026 production bật đủ hai công tắc (form_dat_ban_dang_mo, gio_phuc_vu_da_chot) mà form
 * hỏi bàn vẫn không lên: bảng ban_an có 0 bàn, so_ban_con_trong() trả 0 cho mọi khung, web hiện
 * "chưa mở đặt bàn", tao_dat_ban() báo "đã hết bàn". Khánh quyết: mở luôn, không bắt nhập bàn.
 *
 * Kiểm (mỗi kiểm tra "KHÔNG BÀN" đỏ trước 0100):
 *   0. so_ban_con_trong() vẫn một bản, cùng chữ ký, security definer, anon vẫn không gọi được;
 *   1. chi nhánh chưa có bàn: đủ 18 khung của giờ 11:00–14:00, 17:00–23:00 đều nhận; nhiều khách cùng
 *      khung đều nhận; gửi hai lần y hệt vẫn một dòng; lịch không lộ con số nào;
 *   2. đã nhập bàn: tính sức chứa như cũ ("đã hết bàn" giữ nguyên câu); ngừng dùng hết bàn = hết
 *      chỗ (như cũ), xóa hết bàn = như chưa nhập bàn;
 *   3. giờ Việt Nam: 22:50, 23:50, 00:10 hôm sau; ngày không có thật (31/02);
 *   4. lib/cai-dat.ts trên database thật: lưu giờ chỉ ghi bốn cột giờ và tự đưa giờ lên trang (một
 *      lần, không đẻ phiên bản mới mỗi lần lưu); bật / tắt nhận đặt bàn; quản lý, nhân sự đã nghỉ,
 *      anon bị từ chối và không bao giờ nhận câu "đã lưu"; bấm hai lần ra cùng trạng thái;
 *   5. mất mạng giữa chừng: không bao giờ báo đã lưu khi database chưa xác nhận;
 *   6. mô tả công tắc ở màn Nội dung không còn nói "đã nhập bàn thật vào ban_an".
 */

import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dungDatabase, taoBoDem, taoClientPg, datGioDatabase, traGioDatabase, UID } from './kho-chung.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LIB = join(__dirname, '..', '..', 'web', 'src', 'lib');
const nap = f => import(pathToFileURL(join(LIB, f)).href);
const CD = await nap('cai-dat.ts');
const { CAU_MAT_MANG_GHI } = await nap('qua-tai.ts');
const { moTaKhoa } = await nap('cau-noi-bo.ts');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — ĐẶT BÀN KHÔNG CẦN NHẬP BÀN (0100)');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
const clientCua = await taoClientPg({ db, duoi, duoiAnon });

const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];
const ngayThu = async n => (await mot(`select (hom_nay_vn() + $1::int)::text as d`, [n])).d;
const congTac = async khoa => (await mot(`select cong_tac_bat($1) as b`, [khoa])).b;

// Giờ Khánh chốt 26/10/2026 — như dòng q1 trên production.
const GIO = { trua_bat_dau: '11:00', trua_ket_thuc: '14:00', toi_bat_dau: '17:00', toi_ket_thuc: '23:00' };
for (const cn of [cnA, cnB]) {
  await db.query(`update chi_nhanh set trua_bat_dau = $2, trua_ket_thuc = $3, toi_bat_dau = $4, toi_ket_thuc = $5 where id = $1`,
    [cn.id, GIO.trua_bat_dau, GIO.trua_ket_thuc, GIO.toi_bat_dau, GIO.toi_ket_thuc]);
}

/** Gửi yêu cầu như website (anon, IP null như bot Messenger). */
async function gui({ cn = 'q1', sdt, ngay, gio = '19:00', soKhach = 2, ghiChu = null }) {
  const r = await duoiAnon(
    `select * from tao_dat_ban(p_chi_nhanh_ma => $1, p_sdt => $2, p_ho_ten => 'Khách Thử', p_ngay => $3::date,
       p_gio => $4::time, p_so_khach => $5::smallint, p_ghi_chu => $6)`,
    [cn, sdt, ngay, gio, soKhach, ghiChu]);
  return r.loi ? { loi: r.loi } : r.rows[0];
}
const moTa = r => (r?.loi ? `LỖI: ${r.loi}` : `mã ${r?.ma_dat_ban}`);

/** Lịch như web đọc (anon). */
async function lich(cn, ngay) {
  const r = await duoiAnon(`select * from lich_trong_theo_ma($1, $2::date)`, [cn, ngay]);
  if (r.loi) throw new Error(r.loi);
  return r.rows.map(k => ({ ...k, gio: String(k.gio).slice(0, 5) }));
}

// ===========================================================================
await nhom('0 · TIỀN ĐỀ — so_ban_con_trong() một bản, chữ ký không đổi, anon không gọi được', async () => {
  const { n } = await mot(`select count(*)::int as n from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                            where s.nspname = 'public' and p.proname = 'so_ban_con_trong'`);
  ok('so_ban_con_trong() vẫn chỉ có MỘT bản (không đẻ overload)', n === 1, `${n} bản`);
  const { args, dinh, cauHinh } = await mot(
    `select pg_get_function_identity_arguments('so_ban_con_trong'::regproc) as args, prosecdef as dinh, proconfig::text as "cauHinh"
       from pg_proc where proname = 'so_ban_con_trong'`);
  ok('Chữ ký giữ nguyên như 0004', args === 'p_chi_nhanh_id uuid, p_ngay date, p_gio time without time zone', args);
  ok('Vẫn là SECURITY DEFINER, có set search_path', dinh === true && /search_path=public/.test(cauHinh ?? ''), cauHinh);
  const { anon } = await mot(`select has_function_privilege('anon', 'so_ban_con_trong(uuid,date,time)', 'execute') as anon`);
  ok('anon vẫn KHÔNG gọi được so_ban_con_trong() (con số sức chứa không ra ngoài)', anon === false);
  const { lichAnon } = await mot(`select has_function_privilege('anon', 'lich_trong_theo_ma(text,date)', 'execute') as "lichAnon"`);
  ok('anon vẫn gọi được lich_trong_theo_ma()', lichAnon === true);
});

// ===========================================================================
await nhom('1 · KHÔNG BÀN — chi nhánh chưa nhập bàn nhận mọi khung trong giờ mở cửa', async () => {
  const { n } = await mot(`select count(*)::int as n from ban_an where chi_nhanh_id = $1`, [cnA.id]);
  ok('Tiền đề: q1 chưa có bàn nào', n === 0, `${n} bàn`);

  const ngay = await ngayThu(2);
  const ks = await lich('q1', ngay);
  const MONG = ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];
  ok('Giờ 11:00–14:00, 17:00–23:00 sinh đủ 18 khung, khung cuối trước giờ đóng 30 phút',
     JSON.stringify(ks.map(k => k.gio)) === JSON.stringify(MONG), ks.map(k => k.gio).join(' '));
  ok('KHÔNG BÀN: mọi khung đều còn chỗ (trước 0100: không khung nào)', ks.length === 18 && ks.every(k => k.con_cho === true),
     ks.filter(k => !k.con_cho).map(k => k.gio).join(' ') || 'không có khung');
  ok('Lịch chỉ trả có / không — không cột số nào', ks.every(k => Object.keys(k).sort().join(',') === 'buoi,con_cho,da_qua,gio'),
     Object.keys(ks[0] ?? {}).join(','));

  const dau = await gui({ sdt: '0912100001', ngay });
  ok('KHÔNG BÀN: yêu cầu đầu tiên được ghi, có mã (trước 0100: "đã hết bàn")', !dau.loi && typeof dau.ma_dat_ban === 'string' && dau.ma_dat_ban.length > 0, moTa(dau));
  const sau = [];
  for (let i = 2; i <= 5; i++) sau.push(await gui({ sdt: `091210000${i}`, ngay }));
  ok('KHÔNG BÀN: bốn khách khác cùng khung 19:00 đều được ghi (nhân viên gọi xác nhận từng cái)',
     sau.every(r => !r.loi && r.ma_dat_ban), sau.map(moTa).join(' | '));
  const { dem } = await mot(`select count(*)::int as dem from dat_ban where chi_nhanh_id = $1 and ngay = $2::date and gio = '19:00'`, [cnA.id, ngay]);
  ok('Đúng 5 dòng ở khung 19:00, mọi dòng ở trạng thái chờ xác nhận', dem === 5, `${dem} dòng`);
  ok('Khung 19:00 vẫn còn chỗ sau 5 yêu cầu', (await lich('q1', ngay)).find(k => k.gio === '19:00')?.con_cho === true);

  // Bấm đúp: lần hai y hệt trong 10 phút → cùng mã, không dòng thứ hai (0062 giữ nguyên).
  const ngay2 = await ngayThu(3);
  const lan1 = await gui({ sdt: '0912100009', ngay: ngay2, gio: '12:00', ghiChu: 'Bàn gần cửa sổ' });
  const lan2 = await gui({ sdt: '0912100009', ngay: ngay2, gio: '12:00', ghiChu: 'Bàn gần cửa sổ' });
  const { dem2 } = await mot(`select count(*)::int as dem2 from dat_ban where chi_nhanh_id = $1 and ngay = $2::date`, [cnA.id, ngay2]);
  ok('Gửi hai lần y hệt → cùng một mã, đúng một dòng', !lan1.loi && lan1.ma_dat_ban === lan2.ma_dat_ban && dem2 === 1,
     `${moTa(lan1)} / ${moTa(lan2)} · ${dem2} dòng`);
});

// ===========================================================================
await nhom('2 · ĐÃ NHẬP BÀN — tính sức chứa như cũ', async () => {
  const { rows: [ban] } = await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1, 'B01', 4) returning id`, [cnB.id]);
  const ngay = await ngayThu(2);
  const a = await gui({ cn: 'q7', sdt: '0912200001', ngay });
  const b = await gui({ cn: 'q7', sdt: '0912200002', ngay });
  ok('Một bàn: khách đầu được ghi', !a.loi && a.ma_dat_ban, moTa(a));
  ok('Một bàn: khách thứ hai cùng khung → "đã hết bàn" (câu cũ giữ nguyên)', /Khung giờ \S+ ngày \S+ đã hết bàn/.test(b.loi ?? ''), moTa(b));
  const ks = await lich('q7', ngay);
  ok('Lịch: khung 19:00 hết chỗ, khung 11:00 còn chỗ', ks.find(k => k.gio === '19:00')?.con_cho === false
     && ks.find(k => k.gio === '11:00')?.con_cho === true, JSON.stringify(ks.filter(k => ['11:00', '19:00'].includes(k.gio))));

  await db.query(`update ban_an set dang_dung = false where id = $1`, [ban.id]);
  const c = await gui({ cn: 'q7', sdt: '0912200003', ngay, gio: '11:00' });
  ok('Ngừng dùng bàn duy nhất → không còn chỗ (như cũ), KHÔNG thành "không giới hạn"', /đã hết bàn/.test(c.loi ?? ''), moTa(c));
  await db.query(`update ban_an set dang_dung = true where id = $1`, [ban.id]);
  const d = await gui({ cn: 'q7', sdt: '0912200004', ngay });
  ok('Dùng lại bàn → tính sức chứa lại, khung 19:00 hết bàn', /đã hết bàn/.test(d.loi ?? ''), moTa(d));
  await db.query(`update dat_ban set ban_an_id = null where chi_nhanh_id = $1`, [cnB.id]);
  await db.query(`delete from ban_an where id = $1`, [ban.id]);
  const e = await gui({ cn: 'q7', sdt: '0912200005', ngay });
  ok('Xóa hết bàn → như chưa nhập bàn: nhận lại', !e.loi && e.ma_dat_ban, moTa(e));
});

// ===========================================================================
await nhom('3 · GIỜ VIỆT NAM — 22:50, 23:50, 00:10 hôm sau; ngày không có thật', async () => {
  try {
    await datGioDatabase(db, '2026-11-20T22:50:00+07:00');
    let ks = await lich('q1', '2026-11-20');
    ok('22:50 giờ VN: khung 22:30 hôm nay đã qua, không khung nào hôm nay còn đặt được',
       ks.find(k => k.gio === '22:30')?.da_qua === true && ks.every(k => k.da_qua), ks.filter(k => !k.da_qua).map(k => k.gio).join(' '));
    const qua = await gui({ sdt: '0912300001', ngay: '2026-11-20', gio: '22:30' });
    ok('22:50 giờ VN: đặt 22:30 hôm nay → "đã qua", không ghi', /hôm nay đã qua/.test(qua.loi ?? ''), moTa(qua));
    const mai = await gui({ sdt: '0912300001', ngay: '2026-11-21', gio: '11:00' });
    ok('22:50 giờ VN: đặt 11:00 ngày mai → được ghi', !mai.loi && mai.ma_dat_ban, moTa(mai));

    await datGioDatabase(db, '2026-11-20T23:50:00+07:00');
    ks = await lich('q1', '2026-11-21');
    ok('23:50 giờ VN: mọi khung ngày mai còn đặt được', ks.length === 18 && ks.every(k => !k.da_qua && k.con_cho), ks.length);

    await datGioDatabase(db, '2026-11-21T00:10:00+07:00');
    ks = await lich('q1', '2026-11-21');
    ok('00:10 giờ VN: "hôm nay" là ngày mới — khung 11:00 chưa qua', ks.find(k => k.gio === '11:00')?.da_qua === false, JSON.stringify(ks[0]));
    const homQua = await gui({ sdt: '0912300002', ngay: '2026-11-20', gio: '22:30' });
    ok('00:10 giờ VN: đặt 22:30 ngày hôm trước → "quá khứ"', /quá khứ/.test(homQua.loi ?? ''), moTa(homQua));
  } finally {
    await traGioDatabase(db);
  }
  const { truoc } = await mot(`select count(*)::int as truoc from dat_ban`);
  const sai = await gui({ sdt: '0912300003', ngay: '2026-02-31' });
  const { sauDo } = await mot(`select count(*)::int as "sauDo" from dat_ban`);
  ok('Ngày không có thật (31/02) → lỗi, không ghi dòng nào', !!sai.loi && sauDo === truoc, moTa(sai));
});

// ===========================================================================
// Màn Cài đặt (lib/cai-dat.ts) chạy thẳng trên database, dưới đúng vai — RLS và quyền hàm như thật.
const formGio = (gio = GIO) => {
  const f = new FormData();
  f.set('viec', 'chi_nhanh');
  for (const [k, v] of Object.entries(gio)) f.set(k, v);
  return f;
};
const formNhan = bat => { const f = new FormData(); f.set('viec', 'nhan_dat_ban'); f.set('bat', bat ? 'co' : 'khong'); return f; };
const dongQ1 = () => mot(`select trua_bat_dau::text, trua_ket_thuc::text, toi_bat_dau::text, toi_ket_thuc::text,
                                 khu_vuc, dia_chi, dien_thoai, buoc_khung_gio_phut, thoi_luong_bua_phut, giu_ban_phut
                            from chi_nhanh where id = $1`, [cnA.id]);
const soPhienBan = async khoa => (await mot(
  `select count(*)::int as n from noi_dung_cong_bo where khoa = $1 and trang_thai = 'da_cong_bo'`, [khoa])).n;

await nhom('4 · MÀN CÀI ĐẶT — lưu giờ, bật / tắt nhận đặt bàn, quyền', async () => {
  const chu = clientCua(UID.chu);
  await db.query(`update chi_nhanh set khu_vuc = 'Hồ Tùng Mậu', dia_chi = 'Tầng 3, 63 Hồ Tùng Mậu', dien_thoai = '0281234567',
                    toi_bat_dau = '16:00', buoc_khung_gio_phut = 30, thoi_luong_bua_phut = 120, giu_ban_phut = 15 where id = $1`, [cnA.id]);
  ok('Tiền đề: công tắc giờ chưa công bố', (await congTac('gio_phuc_vu_da_chot')) === false);

  const cn = await CD.docChiNhanh(chu);
  ok('docChiNhanh đọc đúng chi nhánh q1', cn?.id === cnA.id && cn?.toi_bat_dau?.startsWith('16:00'), JSON.stringify(cn));

  const kq = await CD.luuChiNhanh(chu, formGio(), cn, 'vi');
  const sau = await dongQ1();
  ok('Chủ lưu giờ → câu "Đã lưu giờ mở cửa…"', kq.ok === true && kq.cau === 'Đã lưu giờ mở cửa. Trang công khai và khung giờ đặt bàn đổi ngay.', JSON.stringify(kq));
  ok('Bốn cột giờ đúng 11:00–14:00, 17:00–23:00', sau.trua_bat_dau === '11:00:00' && sau.trua_ket_thuc === '14:00:00'
     && sau.toi_bat_dau === '17:00:00' && sau.toi_ket_thuc === '23:00:00', JSON.stringify(sau));
  ok('Khu vực, địa chỉ, điện thoại, bước, lượt ngồi, giữ bàn KHÔNG bị xóa hay đổi', sau.khu_vuc === 'Hồ Tùng Mậu'
     && sau.dia_chi === 'Tầng 3, 63 Hồ Tùng Mậu' && sau.dien_thoai === '0281234567' && sau.buoc_khung_gio_phut === 30
     && sau.thoi_luong_bua_phut === 120 && sau.giu_ban_phut === 15, JSON.stringify(sau));
  ok('Lưu giờ tự đưa giờ lên trang (gio_phuc_vu_da_chot bật) — không phải sang màn Nội dung', (await congTac('gio_phuc_vu_da_chot')) === true);
  const pb1 = await soPhienBan('gio_phuc_vu_da_chot');
  const lai = await CD.luuChiNhanh(chu, formGio(), await CD.docChiNhanh(chu), 'vi');
  ok('Lưu lần hai (bấm đúp, F5) → vẫn "đã lưu", không đẻ phiên bản công bố mới', lai.ok === true && pb1 === 1
     && (await soPhienBan('gio_phuc_vu_da_chot')) === 1, `${pb1} → ${await soPhienBan('gio_phuc_vu_da_chot')}`);

  const toiSai = await CD.luuChiNhanh(chu, formGio({ ...GIO, toi_ket_thuc: '16:00' }), cn, 'vi');
  ok('Tối đóng trước tối mở → câu lỗi, không ghi', toiSai.ok === false && /Giờ đóng tối phải sau giờ mở tối/.test(toiSai.cau)
     && (await dongQ1()).toi_ket_thuc === '23:00:00', JSON.stringify(toiSai));
  const gioSai = await CD.luuChiNhanh(chu, formGio({ ...GIO, trua_bat_dau: '11h' }), cn, 'en');
  ok('Giờ không đúng dạng → câu lỗi tiếng Anh', gioSai.ok === false && gioSai.cau === 'Times must be in HH:MM format.', JSON.stringify(gioSai));

  for (const [ten, uid] of [['Quản lý', UID.qlA], ['Nhân sự đã nghỉ', UID.nghiViec], ['Tài khoản không có dòng nhan_su', null]]) {
    const r = await CD.luuChiNhanh(clientCua(uid), formGio({ ...GIO, toi_bat_dau: '18:00' }), cn, 'vi');
    ok(`${ten} lưu giờ → bị từ chối, KHÔNG nói "đã lưu", giờ giữ nguyên`, r.ok === false && !/Đã lưu/.test(r.cau)
       && (await dongQ1()).toi_bat_dau === '17:00:00', JSON.stringify(r));
  }

  // Bật / tắt nhận đặt bàn. 0010 seed công tắc đang bật.
  const tat = await CD.datNhanDatBan(chu, formNhan(false), 'vi');
  ok('Chủ tắt → câu "Đã tắt…", công tắc tắt', tat.ok === true && /^Đã tắt nhận đặt bàn/.test(tat.cau)
     && (await congTac('form_dat_ban_dang_mo')) === false, JSON.stringify(tat));
  const doc1 = await CD.docCongTacDatBan(chu);
  ok('docCongTacDatBan: nhận đặt bàn tắt, giờ đã lên', doc1.nhanDatBan === false && doc1.gioDaLen === true, JSON.stringify(doc1));
  const tatKhach = await gui({ sdt: '0912400001', ngay: await ngayThu(4) });
  ok('Đang tắt: khách gửi → "tạm đóng", không ghi', /tạm đóng/.test(tatKhach.loi ?? ''), moTa(tatKhach));

  const bat1 = await CD.datNhanDatBan(chu, formNhan(true), 'en');
  const bat2 = await CD.datNhanDatBan(chu, formNhan(true), 'en');
  ok('Chủ bật hai lần (bấm đúp) → cả hai ok, câu tiếng Anh, công tắc bật', bat1.ok && bat2.ok
     && bat2.cau === 'Online bookings are on.'
     && (await congTac('form_dat_ban_dang_mo')) === true, JSON.stringify([bat1, bat2]));
  ok('…chỉ một phiên bản đang công bố (bản cũ được thu hồi)', (await soPhienBan('form_dat_ban_dang_mo')) === 1,
     `${await soPhienBan('form_dat_ban_dang_mo')} bản`);
  ok('docCongTacDatBan: cả hai đang bật', JSON.stringify(await CD.docCongTacDatBan(chu)) === JSON.stringify({ nhanDatBan: true, gioDaLen: true }));

  const fLa = new FormData(); fLa.set('viec', 'nhan_dat_ban');
  const la = await CD.datNhanDatBan(chu, fLa, 'vi');
  ok('Form thiếu ô bat (trang cũ, gửi tay) → từ chối, KHÔNG tắt', la.ok === false && la.cau === 'Không rõ bật hay tắt. Chưa đổi gì.'
     && (await congTac('form_dat_ban_dang_mo')) === true, JSON.stringify(la));

  for (const [ten, c] of [['Quản lý', clientCua(UID.qlA)], ['Nhân sự đã nghỉ', clientCua(UID.nghiViec)], ['anon', clientCua('anon')]]) {
    const r = await CD.datNhanDatBan(c, formNhan(false), 'vi');
    ok(`${ten} tắt nhận đặt bàn → bị từ chối, công tắc vẫn bật`, r.ok === false && (await congTac('form_dat_ban_dang_mo')) === true,
       JSON.stringify(r));
  }
});

// ===========================================================================
// Client giả cho các kiểu hỏng của mạng — đường thật đã thử ở nhóm 4.
function clientHong({ sua = { data: [{ id: 'cn' }], error: null }, doc = { data: null, error: null }, rpc = { data: 'id', error: null } } = {}) {
  const goi = [];
  const chuoi = (bang, kq) => {
    const b = { update: () => b, eq: () => b, in: () => b, select: () => b, maybeSingle: async () => kq(),
                then: (x, y) => Promise.resolve().then(kq).then(x, y) };
    return b;
  };
  return {
    goi,
    from(bang) {
      goi.push(bang);
      return chuoi(bang, () => {
        const v = bang === 'chi_nhanh' ? sua : Array.isArray(doc) ? (doc.length > 1 ? doc.shift() : doc[0]) : doc;
        if (v instanceof Error) throw v;
        return v;
      });
    },
    async rpc(ten) {
      goi.push(`rpc:${ten}`);
      if (rpc instanceof Error) throw rpc;
      return rpc;
    },
  };
}
const MANG = { data: null, error: { message: 'TypeError: fetch failed' } };
const CN_GIA = { id: 'cn', ma: 'q1', ten: 'Q1', ...GIO, dang_hoat_dong: true };

await nhom('5 · MẤT MẠNG — không bao giờ báo đã lưu khi database chưa xác nhận', async () => {
  let c = clientHong({ sua: MANG });
  let r = await CD.luuChiNhanh(c, formGio(), CN_GIA, 'vi');
  ok('Ghi giờ đứt mạng → câu mất mạng của lần ghi, không gọi công bố', r.ok === false && r.cau === CAU_MAT_MANG_GHI.vi
     && !c.goi.includes('rpc:dat_noi_dung'), JSON.stringify(r));

  c = clientHong({ rpc: MANG });
  r = await CD.luuChiNhanh(c, formGio(), CN_GIA, 'vi');
  ok('Giờ đã ghi, công bố đứt mạng → ok false, nói đúng cả hai nửa', r.ok === false
     && r.cau.startsWith('Đã lưu giờ mở cửa, nhưng CHƯA đưa giờ lên trang được:') && r.cau.includes(CAU_MAT_MANG_GHI.vi), r.cau);
  r = await CD.luuChiNhanh(clientHong({ rpc: MANG }), formGio(), CN_GIA, 'en');
  ok('…bản tiếng Anh', r.ok === false && r.cau.startsWith('Opening hours saved, but they could NOT be put on the site:'), r.cau);

  // Hai lượt lưu cùng lúc: lượt này đọc "chưa bật", công bố vấp bản lượt kia vừa công bố, đọc lại thấy đã bật.
  const GIO_LEN = { data: [{ khoa: 'gio_phuc_vu_da_chot', dang_song: true, gia_tri_bool: true }], error: null };
  c = clientHong({ doc: [{ data: [], error: null }, GIO_LEN],
                   rpc: { data: null, error: { message: 'duplicate key value violates unique constraint "cong_bo_dang_song_idx"', code: '23505' } } });
  r = await CD.luuChiNhanh(c, formGio(), CN_GIA, 'vi');
  ok('Lưu cùng lúc: công bố vấp bản vừa lên, đọc lại thấy giờ đã lên → "đã lưu", không báo lỗi sai', r.ok === true
     && r.cau.startsWith('Đã lưu giờ mở cửa.'), JSON.stringify(r));

  c = clientHong({ doc: MANG });
  r = await CD.luuChiNhanh(c, formGio(), CN_GIA, 'vi');
  ok('Đọc công tắc đứt mạng → vẫn công bố (không biết thì coi như chưa bật)', r.ok === true && c.goi.includes('rpc:dat_noi_dung'), JSON.stringify(r));

  r = await CD.datNhanDatBan(clientHong({ rpc: MANG }), formNhan(true), 'vi');
  ok('Bật nhận đặt bàn đứt mạng → ok false, câu mất mạng', r.ok === false && r.cau === CAU_MAT_MANG_GHI.vi, JSON.stringify(r));
  r = await CD.datNhanDatBan(clientHong({ rpc: { data: null, error: { message: 'Service Unavailable', code: '503' } } }), formNhan(true), 'vi');
  ok('Dịch vụ trả 503 → ok false', r.ok === false, JSON.stringify(r));
  let nem = null;
  try { await CD.datNhanDatBan(clientHong({ rpc: new Error('fetch failed') }), formNhan(true), 'vi'); } catch (e) { nem = e; }
  ok('fetch ném lỗi → hàm ném (trang bắt và báo lỗi), không trả ok', nem !== null);
  nem = null;
  try { await CD.docCongTacDatBan(clientHong({ doc: MANG })); } catch (e) { nem = e; }
  ok('docCongTacDatBan đọc lỗi → ném (trang báo "không đọc được"), không trả "đang tắt"', nem !== null);
});

// ===========================================================================
await nhom('6 · MÔ TẢ CÔNG TẮC KHÔNG CÒN ĐÒI NHẬP BÀN', async () => {
  const { mo_ta } = await mot(`select mo_ta from khoa_cong_bo where khoa = 'form_dat_ban_dang_mo'`);
  ok('Mô tả tiếng Việt (màn Nội dung) không còn nói "ban_an"', !/ban_an/.test(mo_ta) && /gọi lại khách/.test(mo_ta), mo_ta);
  const en = moTaKhoa('en', 'form_dat_ban_dang_mo', mo_ta);
  ok('Bản tiếng Anh cũng vậy', en !== mo_ta && !/ban_an/.test(en) && /call(s)? guests back/.test(en), en);
});

process.exit(ketThuc('ĐẶT BÀN KHÔNG CẦN NHẬP BÀN'));
