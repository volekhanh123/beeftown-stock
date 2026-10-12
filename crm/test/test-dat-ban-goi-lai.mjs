/**
 * BEEFTOWN CRM — Kiểm thử: gửi yêu cầu đặt bàn hai lần (0062)
 * ===========================================================
 *
 *     node test/test-dat-ban-goi-lai.mjs
 *
 * Form hỏi bàn chặn bấm đúp bằng JavaScript bổ trợ — tắt JavaScript, trình
 * duyệt gửi lại POST, hay khách gửi lại vì mạng chập sau khi database đã ghi
 * thì tao_dat_ban() được gọi lần hai. Từ 0062, lần gọi lại Y HỆT (cùng số điện
 * thoại đã chuẩn hóa, chi nhánh, ngày, giờ, số khách, dịp, ghi chú, đồng ý nhận
 * tin) trong 10 phút, khi dòng cũ còn cho_xac_nhan, trả lại đúng dòng cũ —
 * cùng ma_dat_ban, không dòng mới, không tin Zalo thứ hai, không trừ chỗ hai lần.
 *
 * Kiểm: hai lần y hệt → một dòng; khác bất kỳ trường nào → dòng mới; dòng cũ
 * đã hủy / đã xác nhận / quá 10 phút → dòng mới; số điện thoại viết khác kiểu
 * vẫn là một; lượt đầu lấy bàn cuối thì gửi lại vẫn nhận mã chứ không "hết
 * bàn"; khung giờ vừa trôi qua vẫn nhận mã cũ; múi giờ phiên không đổi gì; phiên
 * đăng nhập không thuộc CRM không lấy được mã của khách; lần đầu hỏng trước khi
 * ghi thì lần sau tạo đúng một dòng.
 */

import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — GỬI ĐẶT BÀN HAI LẦN (0062)');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();

const UID_LA = '00000000-0000-4000-8000-0000000000e3';   // đăng nhập được, không có dòng nhan_su

await db.query(`update chi_nhanh set dia_chi = '40–42 Đường Thử, Quận 1', dien_thoai = '0281234567' where id = $1`, [cnA.id]);
for (let i = 1; i <= 10; i++) {
  await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1, $2, 4)`, [cnA.id, `B${String(i).padStart(2, '0')}`]);
}
// Chi nhánh B chỉ có MỘT bàn: thử lượt đầu lấy bàn cuối.
await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1, 'B01', 4)`, [cnB.id]);

const q = async (sql, p = []) => (await db.query(sql, p)).rows;
const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];

/** Ngày giờ Việt Nam lấy từ database — không tự tính trong JavaScript. */
const ngayThu = async n => (await mot(`select (hom_nay_vn() + $1::int)::text as d`, [n])).d;
const HOM_NAY = await ngayThu(0);

const MAC_DINH = { cn: 'q1', ten: 'Khách Thử', gio: '18:00', soKhach: 2, dip: null, ghiChu: null, dongY: false, utm: null, ip: null };

/** Gửi yêu cầu như website (anon), hoặc dưới phiên của một người khi có uid. */
async function gui(thay, uid) {
  const t = { ...MAC_DINH, ...thay };
  const sql = `select * from tao_dat_ban(p_chi_nhanh_ma => $1, p_sdt => $2, p_ho_ten => $3,
                 p_ngay => $4::date, p_gio => $5::time, p_so_khach => $6::smallint,
                 p_dip => $7, p_ghi_chu => $8, p_dong_y => $9, p_utm_source => $10, p_ip => $11::inet)`;
  const thamSo = [t.cn, t.sdt, t.ten, t.ngay, t.gio, t.soKhach, t.dip, t.ghiChu, t.dongY, t.utm, t.ip];
  const r = uid === undefined ? await duoiAnon(sql, thamSo) : await duoi(uid, sql, thamSo);
  return r.loi ? { loi: r.loi } : r.rows[0];
}

/** Số dòng dat_ban của một số điện thoại (đã chuẩn hóa) trong một ngày. */
const soDong = async (sdt, ngay) => (await mot(
  `select count(*)::int as n from dat_ban d join khach_hang k on k.id = d.khach_hang_id
    where k.sdt = chuan_hoa_sdt($1) and d.ngay = $2::date`, [sdt, ngay])).n;

const moTa = r => (r?.loi ? `LỖI: ${r.loi}` : `mã ${r?.ma_dat_ban}`);

/**
 * 0066 giới hạn lời gọi không phiên: IP null là MỘT xô chung 20 lượt / giờ, mỗi chi nhánh 30 lượt / giờ.
 * File này thử 0062 (gửi lại y hệt) với hơn 30 lượt anon IP null — mỗi nhóm bắt đầu với sổ giới hạn
 * trống để lượt của nhóm trước không chặn nhầm kịch bản nhóm sau. Giới hạn KHÔNG bị tắt: nó vẫn chạy
 * trong từng nhóm (và giới hạn theo số điện thoại không dùng sổ này), được thử riêng ở
 * test-cong-khai-gioi-han.mjs.
 */
async function nhomMoi(ten, fn) {
  await db.query(`delete from gioi_han_luot`);
  return nhom(ten, fn);
}

// ===========================================================================
await nhom('0 · TIỀN ĐỀ — một bản hàm, chữ ký không đổi, anon vẫn gọi được', async () => {
  const { n } = await mot(`select count(*)::int as n from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                            where s.nspname = 'public' and p.proname = 'tao_dat_ban'`);
  ok('tao_dat_ban() vẫn chỉ có MỘT bản (không đẻ overload)', n === 1, `${n} bản`);
  const { args } = await mot(`select pg_get_function_identity_arguments('tao_dat_ban'::regproc) as args`);
  ok('Chữ ký giữ nguyên 14 tham số như 0013',
     args === 'p_chi_nhanh_ma text, p_sdt text, p_ho_ten text, p_ngay date, p_gio time without time zone, p_so_khach smallint, '
       + 'p_dip text, p_ghi_chu text, p_dong_y boolean, p_utm_source text, p_utm_medium text, p_utm_campaign text, '
       + 'p_trang_gioi_thieu text, p_ip inet', args);
  const { dinh, cauHinh } = await mot(`select prosecdef as dinh, proconfig::text as "cauHinh" from pg_proc where proname = 'tao_dat_ban'`);
  ok('Vẫn là SECURITY DEFINER, có set search_path', dinh === true && /search_path=public/.test(cauHinh ?? ''), cauHinh);
  const { duoc } = await mot(`select has_function_privilege('anon', 'tao_dat_ban'::regproc, 'execute') as duoc`);
  ok('anon vẫn gọi được tao_dat_ban()', duoc === true);

  // Hai lượt gửi CÙNG LÚC: PGlite chỉ có một kết nối nên không dựng được hai giao
  // dịch song song. Điều giữ cho chúng ra một dòng là THỨ TỰ trong thân hàm: khóa
  // dòng chi_nhanh trước, tìm dòng cũ sau (READ COMMITTED chụp ảnh mới sau khi chờ
  // khóa, nên lượt sau thấy dòng lượt trước vừa ghi), rồi mới tới insert. Ai dời
  // câu tìm lên trên khóa thì kiểm tra này đỏ.
  const { nguon } = await mot(`select prosrc as nguon from pg_proc where proname = 'tao_dat_ban'`);
  const viTri = mau => nguon.search(mau);
  const khoa = viTri(/from\s+chi_nhanh\s+where\s+id\s*=\s*v_cn\.id\s+for\s+update/i);
  const tim = viTri(/interval\s+'10 minutes'/i);
  const chen = viTri(/insert\s+into\s+dat_ban/i);
  ok('Thứ tự trong thân hàm: khóa chi_nhanh → tìm dòng gửi lại → insert (hai lượt cùng lúc xếp hàng ở khóa)',
     khoa >= 0 && tim > khoa && chen > tim, `khóa ${khoa} · tìm ${tim} · insert ${chen}`);
  const { muc } = await mot(`select current_setting('default_transaction_isolation') as muc`);
  ok('Mức cô lập mặc định là READ COMMITTED (câu sau khóa thấy dòng vừa commit)', muc === 'read committed', muc);
});

// ===========================================================================
// Bật Zalo như test-zalo.mjs nhóm 2 — để đếm được tin ZBS-01 của mỗi đặt bàn (từ 0063: xếp khi
// nhân viên bấm "Đã gọi xác nhận", không phải lúc khách gửi).
for (const ma of ['ZBS-01', 'ZBS-02']) {
  await duoi(UID.chu, `select zalo_luu_mau($1, $2, true, true)`, [ma, `tpl_${ma.slice(-2)}`]);
}
await duoi(UID.chu, `select zalo_luu_refresh_token($1)`, ['v1.' + 'A'.repeat(40) + 'refresh1']);
const batZalo = await duoi(UID.chu, `select zalo_luu_cau_hinh(p_app_id => '123456', p_oa_id => '654321', p_dang_bat => true) as kq`);

await nhomMoi('1 · BẤM HAI LẦN Y HỆT → MỘT DÒNG, CÙNG MÃ', async () => {
  ok('Bật được Zalo cho nhóm này', batZalo.loi === null && batZalo.rows[0].kq?.dang_bat === true, batZalo.loi ?? '');

  const ngay = await ngayThu(2);
  const yc = { sdt: '0912000001', ngay, dongY: true, dip: 'Sinh nhật', ghiChu: 'Ghế trẻ em' };
  const lan1 = await gui(yc);
  const lan2 = await gui(yc);
  ok('Lần một ghi được', !lan1.loi && lan1.ma_dat_ban?.length === 6, moTa(lan1));
  ok('HAI LẦN GỬI Y HỆT → cùng ma_dat_ban', !lan2.loi && lan2.ma_dat_ban === lan1.ma_dat_ban, `${moTa(lan1)} · ${moTa(lan2)}`);
  ok('…cùng dat_ban_id', lan2.dat_ban_id === lan1.dat_ban_id);
  ok('…đúng MỘT dòng dat_ban', (await soDong('0912000001', ngay)) === 1, `${await soDong('0912000001', ngay)} dòng`);
  ok('…không trừ chỗ hai lần (con_trong lần hai bằng lần một)', lan2.con_trong === lan1.con_trong && lan1.con_trong === 9,
     `${lan1.con_trong} → ${lan2.con_trong}`);

  const { n: soKhach } = await mot(`select count(*)::int as n from khach_hang where sdt = '0912000001'`);
  ok('…một hồ sơ khách', soKhach === 1);
  const { n: dongY } = await mot(
    `select count(*)::int as n from nhat_ky_dong_y n join khach_hang k on k.id = n.khach_hang_id where k.sdt = '0912000001'`);
  ok('…một dòng nhật ký đồng ý nhận tin, không ghi lần hai', dongY === 1, `${dongY} dòng`);
  const lan3 = await gui(yc);
  ok('Gửi lần ba vẫn cùng mã, vẫn một dòng', lan3.ma_dat_ban === lan1.ma_dat_ban && (await soDong('0912000001', ngay)) === 1, moTa(lan3));

  const { n: chuaXn } = await mot(`select count(*)::int as n from nhat_ky_tin where dat_ban_id = $1`, [lan1.dat_ban_id]);
  ok('…yêu cầu chưa xác nhận: Zalo chưa xếp tin nào (0063)', chuaXn === 0, `${chuaXn} tin`);
  const xn = await duoi(UID.qlA, `update dat_ban set trang_thai = 'da_xac_nhan' where id = $1 and trang_thai = 'cho_xac_nhan' returning id`,
                        [lan1.dat_ban_id]);
  ok('…nhân viên chi nhánh bấm "Đã gọi xác nhận" một lần cho cả ba lần gửi', xn.loi === null && xn.rows.length === 1, xn.loi ?? '');
  const { n: tin } = await mot(`select count(*)::int as n from nhat_ky_tin where dat_ban_id = $1 and khoa_gui like 'ZBS-01:%'`, [lan1.dat_ban_id]);
  const { n: tinKhach } = await mot(
    `select count(*)::int as n from nhat_ky_tin n join khach_hang k on k.id = n.khach_hang_id
      where k.sdt = '0912000001' and n.khoa_gui like 'ZBS-01:%'`);
  ok('…Zalo xếp đúng MỘT tin ZBS-01 cho khách, không gửi tin hai lần', tin === 1 && tinKhach === 1, `${tin} / ${tinKhach}`);
});

// ===========================================================================
await nhomMoi('2 · LƯỢT ĐẦU LẤY BÀN CUỐI → GỬI LẠI VẪN NHẬN MÃ, KHÔNG "HẾT BÀN"', async () => {
  const ngay = await ngayThu(2);
  const yc = { cn: 'q7', sdt: '0912000002', ngay, gio: '19:00' };
  const lan1 = await gui(yc);
  ok('Lượt đầu lấy bàn duy nhất của Q7', !lan1.loi && lan1.con_trong === 0, moTa(lan1));
  const lan2 = await gui(yc);
  ok('Gửi lại khi đã hết bàn → nhận lại đúng mã cũ, không báo "đã hết bàn"', !lan2.loi && lan2.ma_dat_ban === lan1.ma_dat_ban, moTa(lan2));
  ok('…vẫn một dòng', (await soDong('0912000002', ngay)) === 1);
  const khac = await gui({ ...yc, sdt: '0912000003' });
  ok('Khách KHÁC cùng khung → vẫn "đã hết bàn" (câu cũ giữ nguyên)', /Khung giờ \S+ ngày \S+ đã hết bàn/.test(khac.loi ?? ''), moTa(khac));
});

// ===========================================================================
await nhomMoi('3 · KHÁC BẤT KỲ TRƯỜNG NÀO → DÒNG MỚI (khách sửa rồi gửi lại không bị nuốt)', async () => {
  const ngay = await ngayThu(3);
  const goc = { sdt: '0912000010', ngay, gio: '18:00', soKhach: 2, dip: 'Sinh nhật', ghiChu: 'Gần cửa sổ', dongY: false };
  const dau = await gui(goc);
  ok('Yêu cầu gốc ghi được', !dau.loi, moTa(dau));

  const gioKhac = await gui({ ...goc, gio: '20:30' });
  ok('Khác GIỜ → hai dòng, hai mã', !gioKhac.loi && gioKhac.ma_dat_ban !== dau.ma_dat_ban && (await soDong(goc.sdt, ngay)) === 2,
     `${moTa(dau)} · ${moTa(gioKhac)}`);

  // 0066: một số điện thoại giữ tối đa 3 yêu cầu còn chờ. Bản cũ gửi cả sáu biến thể dưới CÙNG một
  // số (tới 7 dòng chờ) — giờ lượt thứ tư bị chặn đúng luật. Mỗi biến thể dưới đây đi cùng yêu cầu gốc
  // của RIÊNG nó (một số mới): vẫn là "gốc rồi sửa một trường → dòng mới", hai dòng chờ mỗi số.
  const bienThe = [
    ['số khách', { soKhach: 4 }],
    ['ghi chú', { ghiChu: 'Gần cửa sổ, có xe lăn' }],
    ['dịp', { dip: 'Kỷ niệm' }],
    ['đồng ý nhận tin', { dongY: true }],
  ];
  for (const [i, [ten, thay]] of bienThe.entries()) {
    const gocRieng = { ...goc, sdt: `09120001${String(i).padStart(2, '0')}` };
    const g = await gui(gocRieng);
    const r = await gui({ ...gocRieng, ...thay });
    ok(`Khác ${ten.toUpperCase()} → dòng mới, mã mới`, !g.loi && !r.loi && r.ma_dat_ban !== g.ma_dat_ban && (await soDong(gocRieng.sdt, ngay)) === 2,
       `${moTa(g)} · ${moTa(r)} · ${await soDong(gocRieng.sdt, ngay)} dòng`);
  }

  const ngayKhac = await ngayThu(4);
  const rNgay = await gui({ ...goc, ngay: ngayKhac });
  ok('Khác NGÀY → dòng mới', !rNgay.loi && rNgay.ma_dat_ban !== dau.ma_dat_ban && (await soDong(goc.sdt, ngayKhac)) === 1, moTa(rNgay));

  const rSdt = await gui({ ...goc, sdt: '0912000011' });
  ok('Khác SỐ ĐIỆN THOẠI → dòng mới', !rSdt.loi && rSdt.ma_dat_ban !== dau.ma_dat_ban, moTa(rSdt));

  // Số gốc đã có 3 yêu cầu chờ (gốc, khác giờ, khác ngày) — cặp chi nhánh dùng số riêng.
  const gocCn = { ...goc, sdt: '0912000012', ngay: await ngayThu(5) };
  const rCn = await gui({ ...gocCn, cn: 'q7' });
  const rCn2 = await gui(gocCn);
  ok('Khác CHI NHÁNH (cùng ngày giờ) → hai dòng riêng', !rCn.loi && !rCn2.loi && rCn.ma_dat_ban !== rCn2.ma_dat_ban,
     `${moTa(rCn)} · ${moTa(rCn2)}`);

  const thuTu = await gui({ ...goc, gio: '21:00' });
  ok('0066: số gốc đã có 3 yêu cầu chờ → yêu cầu thứ tư (sửa giờ lần nữa) bị chặn bằng câu giới hạn',
     /^Số điện thoại này đã có nhiều yêu cầu đặt bàn/.test(thuTu.loi ?? ''), moTa(thuTu));

  const giongHet = await gui(goc);
  ok('Gửi lại đúng yêu cầu gốc → vẫn nhận mã gốc', giongHet.ma_dat_ban === dau.ma_dat_ban, moTa(giongHet));
});

// ===========================================================================
await nhomMoi('4 · DÒNG CŨ ĐÃ HỦY / ĐÃ XÁC NHẬN / QUÁ 10 PHÚT → DÒNG MỚI', async () => {
  const ngay = await ngayThu(6);

  const huy = { sdt: '0912000020', ngay, gio: '12:00' };
  const h1 = await gui(huy);
  const daHuy = await duoiAnon(`select huy_dat_ban($1, $2, null, null::inet) as ok`, [h1.ma_dat_ban, huy.sdt]);
  ok('Khách tự hủy được', daHuy.rows?.[0]?.ok === true, daHuy.loi ?? '');
  const h2 = await gui(huy);
  ok('Đã hủy rồi đặt lại → dòng MỚI, mã mới (không trả lại bàn đã hủy)',
     !h2.loi && h2.ma_dat_ban !== h1.ma_dat_ban && (await soDong(huy.sdt, ngay)) === 2, moTa(h2));

  const xn = { sdt: '0912000021', ngay, gio: '12:30' };
  const x1 = await gui(xn);
  await db.query(`update dat_ban set trang_thai = 'da_xac_nhan' where id = $1`, [x1.dat_ban_id]);
  const x2 = await gui(xn);
  ok('Dòng cũ đã xác nhận → chỉ dòng cho_xac_nhan mới được trả lại, nên ra dòng mới',
     !x2.loi && x2.ma_dat_ban !== x1.ma_dat_ban, moTa(x2));

  const cu = { sdt: '0912000022', ngay, gio: '13:00' };
  const c1 = await gui(cu);
  await db.query(`update dat_ban set created_at = created_at - interval '9 minutes' where id = $1`, [c1.dat_ban_id]);
  const c2 = await gui(cu);
  ok('Dòng tạo 9 phút trước → vẫn trả lại mã cũ', c2.ma_dat_ban === c1.ma_dat_ban && (await soDong(cu.sdt, ngay)) === 1, moTa(c2));
  await db.query(`update dat_ban set created_at = created_at - interval '2 minutes' where id = $1`, [c1.dat_ban_id]);
  const c3 = await gui(cu);
  ok('Dòng tạo 11 phút trước → dòng MỚI', !c3.loi && c3.ma_dat_ban !== c1.ma_dat_ban && (await soDong(cu.sdt, ngay)) === 2, moTa(c3));
  const c4 = await gui(cu);
  ok('…và lần gửi ngay sau đó trả lại dòng mới nhất', c4.ma_dat_ban === c3.ma_dat_ban && (await soDong(cu.sdt, ngay)) === 2, moTa(c4));
});

// ===========================================================================
await nhomMoi('5 · CHỮ CÓ DẤU VÀ SỐ ĐIỆN THOẠI VIẾT KIỂU KHÁC', async () => {
  const ngay = await ngayThu(7);
  const goc = { sdt: '0912 345 678', ngay, gio: '18:00', ghiChu: 'Sinh nhật bé Ngọc — cần bánh' };
  const r1 = await gui(goc);
  const r2 = await gui({ ...goc, sdt: '+84 912 345 678' });
  const r3 = await gui({ ...goc, sdt: '84912345678' });
  const r4 = await gui({ ...goc, sdt: '0912.345.678' });
  ok('"0912 345 678", "+84 912 345 678", "84912345678", "0912.345.678" → cùng một mã',
     !r1.loi && [r2, r3, r4].every(r => r.ma_dat_ban === r1.ma_dat_ban), [r1, r2, r3, r4].map(moTa).join(' · '));
  ok('…một dòng', (await soDong('0912345678', ngay)) === 1);

  const khongDau = await gui({ ...goc, ghiChu: 'Sinh nhat be Ngoc — can banh' });
  ok('Ghi chú "Sinh nhật" khác "Sinh nhat" (mất dấu) → dòng mới', !khongDau.loi && khongDau.ma_dat_ban !== r1.ma_dat_ban, moTa(khongDau));
  const dauCach = await gui({ ...goc, ghiChu: 'Sinh nhật bé Ngọc — cần bánh ' });
  ok('Ghi chú khác một dấu cách cuối → dòng mới (không đoán thay khách)', !dauCach.loi && dauCach.ma_dat_ban !== r1.ma_dat_ban, moTa(dauCach));

  const sai = await gui({ ...goc, sdt: 'abc' });
  ok('Số điện thoại sai → câu cũ "Số điện thoại không hợp lệ", không trả mã nào', /^Số điện thoại không hợp lệ/.test(sai.loi ?? ''), moTa(sai));
});

// ===========================================================================
await nhomMoi('6 · GIỜ VIỆT NAM — múi giờ phiên không đổi gì, khung giờ vừa qua vẫn nhận mã cũ', async () => {
  const ngay = await ngayThu(8);
  const yc = { sdt: '0912000030', ngay, gio: '18:00' };
  const r1 = await gui(yc);
  await db.exec(`set timezone to 'Pacific/Kiritimati'`);   // UTC+14
  let r2;
  try { r2 = await gui(yc); }
  finally { await db.exec(`reset timezone`); }
  ok('Gửi lại dưới múi giờ phiên UTC+14 → vẫn cùng mã (cửa sổ 10 phút so timestamptz với timestamptz)',
     r2.ma_dat_ban === r1.ma_dat_ban && (await soDong(yc.sdt, ngay)) === 1, moTa(r2));
  await db.exec(`set timezone to 'UTC'`);
  let r3;
  try { r3 = await gui(yc); }
  finally { await db.exec(`reset timezone`); }
  ok('…và dưới UTC cũng vậy', r3.ma_dat_ban === r1.ma_dat_ban, moTa(r3));

  // Khách gửi lúc 17:58 cho khung 18:00 hôm nay, mạng chập, gửi lại lúc 18:01:
  // khung đã qua nhưng yêu cầu ĐÃ được ghi — trả lại mã cũ là đúng sự thật.
  const vuaQua = { sdt: '0912000031', ngay: await ngayThu(9), gio: '18:00' };
  const v1 = await gui(vuaQua);
  await db.query(`update dat_ban set ngay = hom_nay_vn(), gio = '00:00:01' where id = $1`, [v1.dat_ban_id]);
  const v2 = await gui({ ...vuaQua, ngay: HOM_NAY, gio: '00:00:01' });
  ok('Khung giờ hôm nay vừa trôi qua sau lần gửi đầu → gửi lại nhận mã cũ, không báo "đã qua"',
     !v2.loi && v2.ma_dat_ban === v1.ma_dat_ban, moTa(v2));

  const moi = await gui({ sdt: '0912000032', ngay: HOM_NAY, gio: '00:00:01' });
  ok('Yêu cầu MỚI cho khung hôm nay đã qua → vẫn câu cũ "hôm nay đã qua"', /^Khung giờ \S+ hôm nay đã qua/.test(moi.loi ?? ''), moTa(moi));
  const quaKhu = await gui({ sdt: '0912000033', ngay: await ngayThu(-1) });
  ok('Ngày quá khứ → vẫn câu cũ "Không thể đặt bàn cho ngày trong quá khứ"',
     quaKhu.loi === 'Không thể đặt bàn cho ngày trong quá khứ', moTa(quaKhu));
});

// ===========================================================================
await nhomMoi('7 · QUYỀN — phiên đăng nhập không thuộc CRM không lấy được mã của khách', async () => {
  const ngay = await ngayThu(10);
  const yc = { sdt: '0912000040', ngay, gio: '18:00', ten: 'Khách Bí Mật' };
  const khach = await gui(yc);
  ok('Khách đặt qua website (anon)', !khach.loi, moTa(khach));

  for (const [ten, uid] of [
    ['Marketing', UID.mktA], ['Thủ kho', UID.thuKhoA], ['Kế toán', UID.keToanA],
    ['Nhân sự đã nghỉ', UID.nghiViec], ['Tài khoản không có dòng nhan_su', UID_LA],
  ]) {
    const r = await gui(yc, uid);
    ok(`${ten} gửi đúng nội dung yêu cầu của khách → bị từ chối, không thấy mã`,
       r.loi !== undefined && !JSON.stringify(r).includes(khach.ma_dat_ban), moTa(r));
  }
  ok('…không dòng nào được thêm', (await soDong(yc.sdt, ngay)) === 1, `${await soDong(yc.sdt, ngay)} dòng`);

  const chiNhanhKhac = await gui({ ...yc, cn: 'q7' });
  ok('Cùng số, cùng giờ nhưng chi nhánh khác → không trả mã của chi nhánh kia',
     !chiNhanhKhac.loi && chiNhanhKhac.ma_dat_ban !== khach.ma_dat_ban, moTa(chiNhanhKhac));

  const lai = await gui(yc);
  ok('anon gửi lại đúng yêu cầu → vẫn nhận mã của mình', lai.ma_dat_ban === khach.ma_dat_ban, moTa(lai));
});

// ===========================================================================
await nhomMoi('8 · MẤT MẠNG GIỮA CHỪNG — không dòng nửa vời, gửi lại ra đúng một dòng', async () => {
  const ngay = await ngayThu(11);
  // Messenger gọi y như website, không có IP; "không chắc" → khách gửi lại.
  const yc = { sdt: '0912000050', ngay, gio: '19:30', utm: 'messenger' };
  const r1 = await gui(yc);
  const r2 = await gui(yc);
  ok('Lần đầu đã ghi nhưng mất phản hồi → gửi lại nhận cùng mã, một dòng',
     !r1.loi && r2.ma_dat_ban === r1.ma_dat_ban && (await soDong(yc.sdt, ngay)) === 1, moTa(r2));

  // Đứt kết nối TRƯỚC khi commit: giao dịch hủy, không còn gì để trả lại.
  const yc2 = { sdt: '0912000051', ngay, gio: '19:30' };
  await db.exec('begin');
  let dut;
  try { dut = await gui(yc2); }
  finally { await db.exec('rollback'); }
  ok('Giao dịch đầu bị hủy giữa chừng → không để lại dòng nào', !dut.loi && (await soDong(yc2.sdt, ngay)) === 0, moTa(dut));
  const sau = await gui(yc2);
  ok('…gửi lại → đúng MỘT dòng, mã mới (không trả mã của giao dịch đã hủy)',
     !sau.loi && sau.ma_dat_ban !== dut.ma_dat_ban && (await soDong(yc2.sdt, ngay)) === 1, moTa(sau));
});

process.exit(ketThuc('GỬI ĐẶT BÀN HAI LẦN'));
