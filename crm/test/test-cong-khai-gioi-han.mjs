/**
 * BEEFTOWN CRM — Kiểm thử: giới hạn tần suất của các hàm công khai (0084)
 * =======================================================================
 *
 *     node test/test-cong-khai-gioi-han.mjs
 *
 * Khoá anon là CÔNG KHAI theo thiết kế: ai mở trang cũng lấy được, rồi gọi thẳng
 * PostgREST với tham số tùy chọn — kể cả p_ip. Nên mọi giới hạn phải nằm trong
 * database, và giới hạn theo IP chỉ là lớp thứ nhất: kẻ gọi thẳng đổi IP mỗi lần
 * được. Lớp chặn thật là theo số điện thoại, theo chi nhánh và toàn cục.
 *
 * Rà soát nợ kỹ thuật 11/10/2026 tái hiện được trên PGlite (mỗi dòng dưới đây
 * là một kiểm tra "RÀ SOÁT 11/10" — đỏ trước 0084, xanh từ 0084):
 *   · tao_dat_ban không giới hạn: lời gọi anon với số điện thoại mới mỗi lần
 *     chiếm hết bàn một khung giờ và đổ dòng rác vào khach_hang;
 *   · xin_phieu_tai_cv, nop_ho_so_ung_tuyen bỏ qua giới hạn khi p_ip null; một
 *     vé tải CV cho tải không giới hạn số file trong 15 phút;
 *   · tra_cuu_dat_ban chỉ khoá khi có IP — nơi gọi duy nhất (Messenger) luôn
 *     truyền null; huy_dat_ban không khoá; ghi_nhat_ky_tra_cuu và
 *     ghi_su_kien_web (khoá theo p_phien người gọi tự chọn) chèn không giới hạn.
 *
 * PGlite chỉ có một kết nối nên không dựng được hai giao dịch song song. Điều
 * giữ cho hai lượt cùng lúc không cùng lọt là THỨ TỰ trong thân hàm: khoá
 * (pg_advisory_xact_lock / for update) đứng trước câu đếm — nhóm 7 kiểm thứ tự đó
 * như test-dat-ban-goi-lai.mjs.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB = join(__dirname, '..', '..', 'web', 'src', 'lib');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — GIỚI HẠN TẦN SUẤT CỦA CÁC HÀM CÔNG KHAI (0084)');
const { db, cnA, cnB, duoi, duoiAnon, phaiLoi } = await dungDatabase();

// Chi nhánh A rộng (60 bàn) để thứ chặn là giới hạn, không phải hết chỗ. Chi
// nhánh B 4 bàn: chỉ dùng để thấy trần tính riêng từng chi nhánh.
for (let i = 1; i <= 60; i++) {
  await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1, $2, 4)`, [cnA.id, `A${String(i).padStart(2, '0')}`]);
}
for (let i = 1; i <= 4; i++) {
  await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1, $2, 4)`, [cnB.id, `B${i}`]);
}

const q = async (sql, p = []) => (await db.query(sql, p)).rows;
const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];
/** Câu select một số (count…) → số. */
const dem = async (sql, p = []) => Number(Object.values(await mot(sql, p))[0]);

/** Ngày giờ Việt Nam lấy từ database — không tự tính trong JavaScript. */
const ngayThu = async n => (await mot(`select (hom_nay_vn() + $1::int)::text as d`, [n])).d;
const NGAY = await ngayThu(3);

/** Số điện thoại Việt Nam hợp lệ thứ n (10 số, đầu 09). */
const sdtThu = n => `09${String(n).padStart(8, '0')}`;

/** Câu database trả — giữ nguyên từng chữ (web khớp theo chữ tiếng Việt). */
const CAU = {
  mangNhieu: 'Mạng bạn đang dùng đã gửi quá nhiều yêu cầu đặt bàn, vui lòng thử lại sau hoặc gọi nhà hàng',
  sdtNhieu:  'Số điện thoại này đã có nhiều yêu cầu đặt bàn đang chờ nhà hàng xác nhận, vui lòng gọi nhà hàng',
  heThongBan: 'Hệ thống đang nhận quá nhiều yêu cầu, vui lòng thử lại sau hoặc liên hệ trực tiếp với nhà hàng',
  khoaTraCuu: 'Tra cứu bị tạm khoá, vui lòng gọi nhà hàng',
  taiNhieu:  'Bạn đã thử tải lên quá nhiều lần, vui lòng chờ ít phút',
  nopNhieu:  'Bạn đã nộp quá nhiều hồ sơ, vui lòng liên hệ trực tiếp với nhà hàng',
};

/** Gửi yêu cầu đặt bàn như website / Messenger (anon), hoặc dưới phiên của một người khi có uid. */
async function datBan(thay, uid) {
  const t = { cn: 'q1', ten: 'Khách Thử', ngay: NGAY, gio: '18:00', soKhach: 2, ghiChu: null, dongY: false, ip: null, ...thay };
  const sql = `select * from tao_dat_ban(p_chi_nhanh_ma => $1, p_sdt => $2, p_ho_ten => $3,
                 p_ngay => $4::date, p_gio => $5::time, p_so_khach => $6::smallint,
                 p_ghi_chu => $7, p_dong_y => $8, p_ip => $9::inet)`;
  const thamSo = [t.cn, t.sdt, t.ten, t.ngay, t.gio, t.soKhach, t.ghiChu, t.dongY, t.ip];
  const r = uid === undefined ? await duoiAnon(sql, thamSo) : await duoi(uid, sql, thamSo);
  return r.loi ? { loi: r.loi } : r.rows[0];
}
const moTa = r => (r?.loi ? `LỖI: ${r.loi}` : `mã ${r?.ma_dat_ban ?? r}`);

/** Gửi n lượt, mỗi lượt một số điện thoại mới; trả lượt đầu tiên bị từ chối (1-based) và câu lỗi. */
async function guiLienTuc(n, taoLuot) {
  for (let i = 1; i <= n; i++) {
    const r = await taoLuot(i);
    if (r.loi) return { bi: i, loi: r.loi };
  }
  return { bi: null, loi: null };
}

/**
 * Sổ giới hạn về trống — mỗi nhóm thử đúng một giới hạn, không mang lượt của nhóm trước. Bảng chưa
 * có (chạy trước 0084, trước bản sửa) thì bỏ qua để các kiểm tra RÀ SOÁT đỏ đúng chỗ; nhóm 0 mới là
 * chỗ đòi bảng phải có.
 */
const xoaSoGioiHan = async () => {
  if ((await mot(`select to_regclass('public.gioi_han_luot') is not null as co`)).co) await db.query(`delete from gioi_han_luot`);
};

/** Mọi đặt bàn đang chờ của chi nhánh A về da_huy — giới hạn theo SĐT không dính sang nhóm sau. */
const huyHetChoXacNhan = () => db.query(`update dat_ban set trang_thai = 'da_huy' where trang_thai = 'cho_xac_nhan'`);

// ===========================================================================
await nhom('0 · TIỀN ĐỀ — chữ ký không đổi, quyền gọi, bảng sổ giới hạn khoá kín', async () => {
  const CHU_KY = {
    tao_dat_ban: 'p_chi_nhanh_ma text, p_sdt text, p_ho_ten text, p_ngay date, p_gio time without time zone, p_so_khach smallint, '
      + 'p_dip text, p_ghi_chu text, p_dong_y boolean, p_utm_source text, p_utm_medium text, p_utm_campaign text, '
      + 'p_trang_gioi_thieu text, p_ip inet',
    tra_cuu_dat_ban: 'p_ma text, p_sdt text, p_ip inet',
    tra_cuu_mot_dat_ban: 'p_ma text, p_sdt text, p_ip inet',
    huy_dat_ban: 'p_ma text, p_sdt text, p_ly_do text, p_ip inet',
    xin_phieu_tai_cv: 'p_ip inet',
    ve_con_hieu_luc: 'p_doan text',
    ghi_su_kien_web: 'p_loai text, p_trang text, p_phien uuid, p_chi_nhanh_ma text, p_ngon_ngu text, p_ket_qua text, '
      + 'p_utm_source text, p_utm_medium text, p_utm_campaign text, p_trang_gioi_thieu text',
  };
  for (const [ham, chuKy] of Object.entries(CHU_KY)) {
    const ds = await q(`select pg_get_function_identity_arguments(p.oid) as args from pg_proc p
                          join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'public' and p.proname = $1`, [ham]);
    ok(`${ham}(): đúng MỘT bản, chữ ký giữ nguyên (web không đổi lời gọi)`, ds.length === 1 && ds[0].args === chuKy,
       ds.map(r => r.args).join(' | '));
  }
  const { n: soNop } = await mot(`select count(*)::int as n from pg_proc where proname = 'nop_ho_so_ung_tuyen'`);
  ok('nop_ho_so_ung_tuyen(): đúng MỘT bản', soNop === 1);

  for (const ham of ['tao_dat_ban', 'tra_cuu_mot_dat_ban', 'huy_dat_ban', 'xin_phieu_tai_cv', 'nop_ho_so_ung_tuyen',
                     'ghi_su_kien_web', 've_con_hieu_luc']) {
    const { anon } = await mot(`select has_function_privilege('anon', $1::regproc, 'execute') as anon`, [ham]);
    ok(`anon gọi được ${ham}()`, anon === true);
  }

  // RÀ SOÁT BẢO MẬT 12/10 (của chính bản này): tra_cuu_dat_ban trả BẢNG — người gọi PostgREST gửi
  // Accept: application/vnd.pgrst.object+json (và lọc cột kết quả) thì lần sai ra 0 dòng, PostgREST
  // trả 406 và HỦY giao dịch, kéo theo dòng "lần sai" vừa ghi: khoá dò mã không bao giờ đếm. Anon
  // tra qua tra_cuu_mot_dat_ban — trả một giá trị, không lọc được, luôn đúng một dòng.
  const traBang = await duoiAnon(`select * from tra_cuu_dat_ban('XXXXXX', '0900000000', null::inet)`);
  ok('RÀ SOÁT BẢO MẬT: anon KHÔNG còn gọi được tra_cuu_dat_ban (hàm trả bảng — hủy được lần sai)',
     /permission denied/i.test(traBang.loi ?? ''), traBang.loi ?? 'GỌI ĐƯỢC');
  const traBangLa = await duoi(null, `select * from tra_cuu_dat_ban('XXXXXX', '0900000000', null::inet)`);
  ok('…tài khoản đăng nhập cũng không', /permission denied/i.test(traBangLa.loi ?? ''), traBangLa.loi ?? 'GỌI ĐƯỢC');
  const kieu = await mot(`select p.proretset as tap, format_type(p.prorettype, null) as kieu, p.prosecdef as dinh,
                                 array_to_string(p.proconfig, ',') as cfg
                            from pg_proc p where p.proname = 'tra_cuu_mot_dat_ban'`);
  ok('tra_cuu_mot_dat_ban trả MỘT giá trị jsonb (không phải bảng), security definer có set search_path',
     kieu?.tap === false && kieu.kieu === 'jsonb' && kieu.dinh === true && /search_path=public/.test(kieu.cfg ?? ''), JSON.stringify(kieu));

  // RÀ SOÁT 11/10: ghi_nhat_ky_tra_cuu chèn thẳng một dòng mỗi lần gọi, không giới hạn — kể cả
  // dòng thanh_cong = false giả để khoá tra cứu của người khác. Từ 0084 tra_cuu_dat_ban và
  // huy_dat_ban tự ghi; không ai bên ngoài cần gọi nó nữa.
  const ghiAnon = await duoiAnon(`select ghi_nhat_ky_tra_cuu('203.0.113.1'::inet, 'XXXXXX', false)`);
  ok('RÀ SOÁT 11/10: anon KHÔNG còn gọi được ghi_nhat_ky_tra_cuu()', /permission denied/i.test(ghiAnon.loi ?? ''), ghiAnon.loi ?? 'GỌI ĐƯỢC');
  const ghiLa = await duoi(null, `select ghi_nhat_ky_tra_cuu('203.0.113.1'::inet, 'XXXXXX', false)`);
  ok('…tài khoản đăng nhập (kể cả không có dòng nhan_su) cũng không', /permission denied/i.test(ghiLa.loi ?? ''), ghiLa.loi ?? 'GỌI ĐƯỢC');

  const { vol } = await mot(`select provolatile as vol from pg_proc where proname = 'tra_cuu_dat_ban'`);
  ok('tra_cuu_dat_ban() là VOLATILE — tự ghi nhật ký được, không phụ thuộc người gọi có ghi hay không', vol === 'v', vol);

  for (const ham of ['gioi_han_lay_luot', 'kiem_khoa_tra_cuu', 'ghi_lan_tra_cuu', 'ho_so_mot_ve_mot_file']) {
    const r = await mot(`select p.prosecdef as dinh, array_to_string(p.proconfig, ',') as cfg,
                                has_function_privilege('anon', p.oid, 'execute') as anon,
                                has_function_privilege('authenticated', p.oid, 'execute') as auth
                           from pg_proc p where p.proname = $1`, [ham]);
    ok(`${ham}(): hàm nội bộ — anon và authenticated KHÔNG gọi được`, r && r.anon === false && r.auth === false, JSON.stringify(r));
    ok(`${ham}(): KHÔNG security definer (chạy dưới quyền hàm definer gọi nó), có set search_path`,
       r?.dinh === false && /search_path=public/.test(r?.cfg ?? ''), JSON.stringify(r));
  }

  for (const [ai, chay] of [['anon', s => duoiAnon(s)], ['tài khoản không có nhan_su', s => duoi(null, s)], ['chủ sở hữu', s => duoi(UID.chu, s)]]) {
    const doc = await chay(`select count(*) from gioi_han_luot`);
    const ghi = await chay(`insert into gioi_han_luot (viec, khoa) values ('tao_dat_ban', 'ip:192.0.2.1')`);
    ok(`${ai} KHÔNG đọc / ghi thẳng được gioi_han_luot`, /permission denied/i.test(doc.loi ?? '') && /permission denied/i.test(ghi.loi ?? ''),
       `${doc.loi ?? 'ĐỌC ĐƯỢC'} · ${ghi.loi ?? 'GHI ĐƯỢC'}`);
  }
});

// ===========================================================================
await nhom('1 · tao_dat_ban — RÀ SOÁT 11/10: chiếm hết bàn, đổ rác vào khach_hang', async () => {
  // Kịch bản báo cáo: lời gọi anon thẳng (p_ip null, hay p_ip tự bịa) với số điện thoại mới mỗi
  // lần. Giới hạn không làm khung giờ rộng ra — kẻ đổi cả IP lẫn số vẫn lấy được tới trần chi nhánh
  // (30 / giờ), và khi trần đã chạm thì khách thật cũng nhận câu bận tới hết giờ (đánh đổi ghi ở
  // đầu 0084). Điều 0084 đổi: không còn vô hạn, khach_hang không đầy rác, câu từ chối nói đúng.
  await xoaSoGioiHan();
  const khachTruoc = await dem(`select count(*) from khach_hang`);
  const nullIp = await guiLienTuc(50, i => datBan({ sdt: sdtThu(1000 + i), gio: '19:00' }));
  ok('RÀ SOÁT 11/10: IP null (gọi thẳng bằng khoá anon) KHÔNG còn gửi được không giới hạn — lượt thứ 31 bị chặn (trần chi nhánh)',
     nullIp.bi === 31, `bị chặn ở lượt ${nullIp.bi}: ${nullIp.loi}`);
  ok('…bằng câu nói đúng sự thật (hệ thống bận), không phải "đã hết bàn"', nullIp.loi?.includes(CAU.heThongBan), nullIp.loi);
  ok('RÀ SOÁT 11/10: khach_hang thêm đúng 30 dòng, không phải 50', (await dem(`select count(*) from khach_hang`)) - khachTruoc === 30);
  // IP null không có xô riêng nhỏ hơn trần chi nhánh (đầu 0084): xô đó chỉ là công tắc tắt bot
  // Messenger cho kẻ phá, trong khi kẻ phá thoát xô bằng cách bịa IP.
  await huyHetChoXacNhan();

  // Một IP thật: 5 yêu cầu mỗi giờ.
  await xoaSoGioiHan();
  const motIp = await guiLienTuc(20, i => datBan({ sdt: sdtThu(2000 + i), ip: '198.51.100.20' }));
  ok('Một IP gửi tới 5 yêu cầu / giờ; lượt thứ 6 bị chặn', motIp.bi === 6, `lượt ${motIp.bi}: ${motIp.loi}`);
  ok('…câu nói rõ là mạng của khách gửi nhiều', motIp.loi?.includes(CAU.mangNhieu), motIp.loi);
  const ipKhac = await datBan({ sdt: sdtThu(2100), ip: '198.51.100.21' });
  ok('…IP khác không bị ảnh hưởng', !ipKhac.loi, moTa(ipKhac));
  await db.query(`update gioi_han_luot set created_at = created_at - interval '61 minutes'`);
  const sauGio = await datBan({ sdt: sdtThu(2101), ip: '198.51.100.20' });
  ok('…qua 1 giờ thì IP đó gửi lại được', !sauGio.loi, moTa(sauGio));
  await huyHetChoXacNhan();

  // Đổi IP mỗi lần (gọi thẳng PostgREST tự bịa p_ip): trần chi nhánh 30 / giờ.
  await xoaSoGioiHan();
  const khach2 = await dem(`select count(*) from khach_hang`);
  const doiIp = await guiLienTuc(50, i => datBan({ sdt: sdtThu(3000 + i), ip: `203.0.113.${i}` }));
  ok('RÀ SOÁT 11/10: đổi IP mỗi lần vẫn bị trần chi nhánh — lượt thứ 31 bị chặn', doiIp.bi === 31, `lượt ${doiIp.bi}: ${doiIp.loi}`);
  ok('…câu hệ thống bận', doiIp.loi?.includes(CAU.heThongBan), doiIp.loi);
  ok('…khach_hang thêm đúng 30 dòng', (await dem(`select count(*) from khach_hang`)) - khach2 === 30);
  const cnKhac = await datBan({ cn: 'q7', sdt: sdtThu(3100), ip: '203.0.113.200' });
  ok('…trần tính riêng từng chi nhánh: chi nhánh B vẫn nhận', !cnKhac.loi, moTa(cnKhac));

  // Phiên nhân viên (quản lý ghi hộ khách gọi điện) không bị giới hạn công khai.
  const ql = await datBan({ sdt: sdtThu(3200) }, UID.qlA);
  ok('Quản lý ghi yêu cầu qua điện thoại khi trần chi nhánh đã chạm → vẫn ghi được', !ql.loi, moTa(ql));
  const ql2 = await datBan({ sdt: sdtThu(3201), gio: '18:30' }, UID.qlA);
  ok('…ghi tiếp được nữa: phiên nhân viên không ăn vào trần của khách web', !ql2.loi, moTa(ql2));

  // Gửi lại Y HỆT (0062) khi đã chạm trần: yêu cầu ĐÃ được ghi → nhận lại đúng mã cũ.
  await xoaSoGioiHan();
  const yc = { sdt: sdtThu(3300), ip: '198.51.100.30', gio: '20:00' };
  const dau = await datBan(yc);
  for (let i = 1; i <= 4; i++) await datBan({ sdt: sdtThu(3300 + i), ip: '198.51.100.30', gio: '20:00' });
  const lai = await datBan(yc);
  ok('Đã chạm 5 / giờ mà gửi lại y hệt lượt đầu → nhận lại mã cũ (yêu cầu đã ghi), không bị chặn',
     !dau.loi && !lai.loi && lai.ma_dat_ban === dau.ma_dat_ban, `${moTa(dau)} · ${moTa(lai)}`);
  await huyHetChoXacNhan();
});

// ===========================================================================
await nhom('2 · tao_dat_ban — một số điện thoại giữ tối đa 3 yêu cầu đang chờ', async () => {
  await xoaSoGioiHan();
  const sdt = sdtThu(4000);
  const kq = [];
  for (const [i, gio] of ['17:00', '18:00', '19:00', '20:00'].entries()) {
    kq.push(await datBan({ sdt, gio, ip: `198.51.100.${40 + i}` }));   // mỗi lượt một IP: chỉ thử giới hạn theo SĐT
  }
  ok('Ba yêu cầu đầu được nhận', kq.slice(0, 3).every(r => !r.loi), kq.map(moTa).join(' · '));
  ok('Yêu cầu thứ tư cùng số điện thoại (dù khác IP) bị chặn', kq[3].loi?.includes(CAU.sdtNhieu), moTa(kq[3]));
  const kieuKhac = await datBan({ sdt: '+84 ' + sdt.slice(1, 4) + ' ' + sdt.slice(4), gio: '21:00', ip: '198.51.100.49' });
  ok('…viết số kiểu khác (+84, có dấu cách) vẫn là cùng một số', kieuKhac.loi?.includes(CAU.sdtNhieu), moTa(kieuKhac));

  await db.query(`update dat_ban set trang_thai = 'da_xac_nhan' where ma_dat_ban = $1`, [kq[0].ma_dat_ban]);
  const sauXacNhan = await datBan({ sdt, gio: '20:00', ip: '198.51.100.50' });
  ok('Nhà hàng xác nhận một yêu cầu → khách gửi thêm được (chỉ đếm yêu cầu còn chờ)', !sauXacNhan.loi, moTa(sauXacNhan));

  await db.query(`update dat_ban set ngay = hom_nay_vn() - 1 where ma_dat_ban = $1`, [kq[1].ma_dat_ban]);
  const sauNgay = await datBan({ sdt, gio: '21:00', ip: '198.51.100.51' });
  ok('Yêu cầu của ngày đã qua không còn tính là đang chờ', !sauNgay.loi, moTa(sauNgay));

  const truoc = await mot(`select (select count(*) from dat_ban)::int as db, (select count(*) from nhat_ky_dong_y)::int as dy`);
  const biChan = await datBan({ sdt, gio: '17:30', ip: '198.51.100.52', dongY: true });
  const sau = await mot(`select (select count(*) from dat_ban)::int as db, (select count(*) from nhat_ky_dong_y)::int as dy`);
  ok('Bị chặn → không dòng dat_ban, không dòng nhat_ky_dong_y nào được ghi', biChan.loi && sau.db === truoc.db && sau.dy === truoc.dy,
     `${moTa(biChan)} · ${JSON.stringify(truoc)} → ${JSON.stringify(sau)}`);
  await huyHetChoXacNhan();
});

// ===========================================================================
await nhom('3 · tra_cuu_mot_dat_ban / huy_dat_ban — khoá dò mã thật sự chạy', async () => {
  await xoaSoGioiHan();
  await db.query(`delete from nhat_ky_tra_cuu`);
  const sdtKhach = sdtThu(5000);
  const dat = await datBan({ sdt: sdtKhach, ip: '198.51.100.60', gio: '19:30' });
  const ma = dat.ma_dat_ban;
  /** Tra như Messenger: tra_cuu_mot_dat_ban → { rows: [] | [dòng] } để đọc như bảng. */
  const tra = async (m, s, ip = null) => {
    const r = await duoiAnon(`select tra_cuu_mot_dat_ban($1, $2, $3::inet) as kq`, [m, s, ip]);
    return r.loi ? r : { rows: r.rows[0].kq ? [r.rows[0].kq] : [], loi: null };
  };
  const huy = (m, s, ip = null) => duoiAnon(`select huy_dat_ban($1, $2, 'thử', $3::inet) as ok`, [m, s, ip]);

  // Tự ghi nhật ký: không cần ai gọi ghi_nhat_ky_tra_cuu sau đó.
  await tra(ma, sdtKhach);
  await tra('XXXXXX', sdtKhach);
  const nk = await q(`select ip, ma_thu, thanh_cong, to_jsonb(n) ->> 'sdt_bam' as sdt_bam from nhat_ky_tra_cuu n order by created_at`);
  ok('Mỗi lần tra cứu tự ghi đúng một dòng nhật ký (đúng → thanh_cong, sai → không)',
     nk.length === 2 && nk[0].thanh_cong === true && nk[1].thanh_cong === false, JSON.stringify(nk));
  ok('…nhật ký không chứa số điện thoại thô', nk.every(r => r.sdt_bam && !String(r.sdt_bam).includes(sdtKhach.slice(2))), JSON.stringify(nk));

  // RÀ SOÁT 11/10: Messenger luôn truyền p_ip null → khoá cũ (chỉ theo IP) là mã chết. Từ 0084
  // khoá theo số điện thoại và toàn cục không đọc p_ip.
  await db.query(`delete from nhat_ky_tra_cuu`);
  let biKhoa = null;
  for (let i = 1; i <= 10 && biKhoa === null; i++) {
    const r = await tra(`ZZZZZ${i + 1}`, sdtKhach);   // IP null, như bot Messenger
    if (r.loi) biKhoa = { i, loi: r.loi };
  }
  ok('RÀ SOÁT 11/10: IP null (Messenger) giờ bị khoá — 5 lần sai mã cùng một số, lần 6 bị khoá', biKhoa?.i === 6, JSON.stringify(biKhoa));
  ok('…câu khoá giữ nguyên chữ cũ', biKhoa?.loi?.includes(CAU.khoaTraCuu), biKhoa?.loi);
  const soDongKhiKhoa = await dem(`select count(*) from nhat_ky_tra_cuu`);
  await tra('XXXXXX', sdtKhach);
  ok('Bị khoá thì không ghi thêm dòng nào (bảng không đầy dù bị gọi liên tục)',
     (await dem(`select count(*) from nhat_ky_tra_cuu`)) === soDongKhiKhoa);
  await db.query(`update nhat_ky_tra_cuu set created_at = created_at - interval '16 minutes'`);
  const sau15 = await tra(ma, sdtKhach);
  ok('…qua 15 phút thì mở lại', sau15.loi === null && sau15.rows.length === 1, sau15.loi ?? '');

  // Không có xô chung cho IP null: lần sai của khách Messenger này không khoá khách Messenger khác.
  await db.query(`delete from nhat_ky_tra_cuu`);
  for (let i = 1; i <= 30; i++) await tra('XXXXXX', sdtThu(5100 + i));
  const khachKhac = await tra(ma, sdtKhach);
  ok('30 lần sai IP null với 30 số khác → khách Messenger khác vẫn tra được (không có công tắc chung dưới trần toàn cục)',
     khachKhac.loi === null && khachKhac.rows.length === 1, khachKhac.loi ?? '');

  // IP thật: 6 lần sai như 0013.
  await db.query(`delete from nhat_ky_tra_cuu`);
  for (let i = 0; i < 6; i++) await tra('XXXXXX', sdtThu(5200 + i), '203.0.113.99');
  const khoaIp = await tra(ma, sdtKhach, '203.0.113.99');
  ok('Một IP sai 6 lần → khoá (như 0013)', khoaIp.loi?.includes(CAU.khoaTraCuu), khoaIp.loi ?? 'VẪN TRA ĐƯỢC');
  const ipKhac = await tra(ma, sdtKhach, '203.0.113.100');
  ok('…IP khác vẫn tra được', ipKhac.loi === null && ipKhac.rows.length === 1, ipKhac.loi ?? '');

  // Theo số điện thoại: dò mã của MỘT khách từ nhiều IP.
  await db.query(`delete from nhat_ky_tra_cuu`);
  for (let i = 0; i < 5; i++) await tra(`ZZZZZ${i + 2}`, sdtKhach, `192.0.2.${i + 1}`);
  const khoaSdt = await tra(ma, sdtKhach, '192.0.2.99');
  ok('Dò mã một số điện thoại từ 5 IP khác nhau → lần 6 (dù đúng mã, IP mới) bị khoá', khoaSdt.loi?.includes(CAU.khoaTraCuu),
     khoaSdt.loi ?? 'VẪN TRA ĐƯỢC');
  const sdtKhac = await tra('XXXXXX', sdtThu(5300), '192.0.2.100');
  ok('…số điện thoại khác không bị kéo theo', sdtKhac.loi === null, sdtKhac.loi ?? '');

  // RÀ SOÁT 11/10: huy_dat_ban không khoá — dò mã qua đường hủy được mà không ai đếm.
  const huyKhiKhoa = await huy(ma, sdtKhach, '192.0.2.101');
  const { tt } = await mot(`select trang_thai::text as tt from dat_ban where ma_dat_ban = $1`, [ma]);
  ok('RÀ SOÁT 11/10: số điện thoại đang bị khoá thì huy_dat_ban cũng bị khoá, bàn KHÔNG bị hủy',
     huyKhiKhoa.loi?.includes(CAU.khoaTraCuu) && tt === 'cho_xac_nhan', `${huyKhiKhoa.loi ?? 'HỦY ĐƯỢC'} · ${tt}`);
  await db.query(`delete from nhat_ky_tra_cuu`);
  for (let i = 0; i < 5; i++) await huy(`QQQQQ${i + 2}`, sdtKhach, `192.0.2.${110 + i}`);
  const traSauHuySai = await tra(ma, sdtKhach, '192.0.2.120');
  ok('…hủy sai mã cũng tính vào lần sai: 5 lần hủy sai → tra cứu số đó bị khoá', traSauHuySai.loi?.includes(CAU.khoaTraCuu),
     traSauHuySai.loi ?? 'VẪN TRA ĐƯỢC');
  await db.query(`delete from nhat_ky_tra_cuu`);
  const huyDung = await huy(ma, sdtKhach, '192.0.2.121');
  ok('…hết khoá thì khách hủy được bàn của mình', huyDung.rows?.[0]?.ok === true, huyDung.loi ?? '');

  // Trần toàn cục: 100 lượt (đúng hay sai) trong 15 phút — bảng nhật ký không đầy dù đổi IP và số.
  await db.query(`delete from nhat_ky_tra_cuu`);
  let toanCuc = null;
  for (let i = 1; i <= 120 && toanCuc === null; i++) {
    const r = await tra('XXXXXX', sdtThu(6000 + i), `198.18.${Math.floor(i / 200)}.${i % 200}`);
    if (r.loi) toanCuc = { i, loi: r.loi };
  }
  ok('Đổi cả IP lẫn số điện thoại mỗi lần → lần 101 bị khoá (trần toàn cục)', toanCuc?.i === 101, JSON.stringify(toanCuc));
  ok('…nhật ký tra cứu giữ đúng 100 dòng', (await dem(`select count(*) from nhat_ky_tra_cuu`)) === 100);

  // Hạn giữ: mọi lần tra giờ đều ghi IP và md5 số điện thoại. Dòng quá 30 ngày do lượt báo động dọn
  // (don_nhat_ky_qua_han, 0073 — kiểm ở test-bao-dong-don-nhat-ky.mjs); 0084 không thêm lượt dọn thứ hai.
  const { nguonDon } = await mot(`select prosrc as "nguonDon" from pg_proc where proname = 'don_nhat_ky_qua_han'`);
  ok('Nhật ký tra cứu (có thêm sdt_bam) vẫn được dọn bởi don_nhat_ky_qua_han (0073)', /delete\s+from\s+nhat_ky_tra_cuu/i.test(nguonDon ?? ''));
  await db.query(`delete from nhat_ky_tra_cuu`);
});

// ===========================================================================
await nhom('4 · xin_phieu_tai_cv và vé tải CV', async () => {
  await db.query(`insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai)
                  values ('hien_tuyen_dung', 'bool', true, 'da_cong_bo')`);
  const xin = ip => duoiAnon(`select xin_phieu_tai_cv($1::inet) as id`, [ip]);
  const xinDenKhiChan = async (n, ip) => {
    for (let i = 1; i <= n; i++) {
      const r = await xin(typeof ip === 'function' ? ip(i) : ip);
      if (r.loi) return { i, loi: r.loi };
    }
    return null;
  };

  await db.query(`delete from phieu_tai_len`);
  const nullIp = await xinDenKhiChan(30, null);
  ok('RÀ SOÁT 11/10: IP null không còn xin vé không giới hạn — đếm như MỘT IP, vé thứ 11 bị từ chối', nullIp?.i === 11, JSON.stringify(nullIp));
  ok('…câu hệ thống bận (không phải "bạn đã thử")', nullIp?.loi?.includes(CAU.heThongBan), nullIp?.loi);

  await db.query(`delete from phieu_tai_len`);
  const motIp = await xinDenKhiChan(20, '198.51.100.70');
  ok('Một IP thật: 10 vé / giờ như 0012, vé 11 bị từ chối bằng câu cũ', motIp?.i === 11 && motIp.loi.includes(CAU.taiNhieu), JSON.stringify(motIp));

  await db.query(`delete from phieu_tai_len`);
  const gio = await xinDenKhiChan(50, i => `203.0.113.${i}`);
  ok('Đổi IP mỗi lần → vé 31 bị từ chối (trần toàn cục 30 / giờ)', gio?.i === 31 && gio.loi.includes(CAU.heThongBan), JSON.stringify(gio));
  await db.query(`update phieu_tai_len set created_at = created_at - interval '61 minutes'`);
  const sauGio = await xin('203.0.113.250');
  ok('…qua 1 giờ thì xin lại được', sauGio.loi === null, sauGio.loi ?? '');

  // Trần ngày: mỗi vé ≤ 5 MB một file — 100 vé / 24 giờ là ≤ 500 MB / ngày trong kho.
  await db.query(`insert into phieu_tai_len (ip, created_at)
                  select ('192.0.2.' || g)::inet, now() - interval '2 hours' from generate_series(1, 69) g`);
  const ngay = await xinDenKhiChan(5, i => `198.18.0.${i}`);
  ok('Trần ngày: đủ 100 vé trong 24 giờ (dù rải ngoài giờ gần nhất) → vé mới bị từ chối', ngay?.i === 1 && ngay.loi.includes(CAU.heThongBan),
     `${JSON.stringify(ngay)} · ${await dem(`select count(*) from phieu_tai_len where created_at > now() - interval '24 hours'`)} vé trong ngày`);
  await db.query(`update phieu_tai_len set created_at = created_at - interval '25 hours'`);
  const ve = (await xin('203.0.113.251')).rows?.[0]?.id;
  ok('…qua 24 giờ thì xin lại được', !!ve);

  // RÀ SOÁT 11/10: policy tải CV chỉ hỏi "vé còn hạn, chưa dùng" → một vé tải bao nhiêu file
  // cũng được trong 15 phút. PGlite không có schema storage: dựng đúng các cột cần.
  const truocKhiCoKho = await duoiAnon(`select ve_con_hieu_luc($1) as duoc`, [ve]);
  ok('Không có schema storage (PGlite, CI) → ve_con_hieu_luc() vẫn chạy, vé mới hợp lệ', truocKhiCoKho.rows?.[0]?.duoc === true,
     truocKhiCoKho.loi ?? '');
  await db.exec(`create schema storage;
                 create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text,
                                               unique (bucket_id, name))`);
  const chuaCoFile = await duoiAnon(`select ve_con_hieu_luc($1) as duoc`, [ve]);
  ok('Chốt 1 (policy): vé chưa có file nào → tải được file đầu tiên', chuaCoFile.rows?.[0]?.duoc === true, chuaCoFile.loi ?? '');
  await db.query(`insert into storage.objects (bucket_id, name) values ('ho-so-ung-tuyen', $1)`, [`${ve}/cv.pdf`]);
  const fileHai = await duoiAnon(`select ve_con_hieu_luc($1) as duoc`, [ve]);
  ok('RÀ SOÁT 11/10 — chốt 1: vé đã có một file → file thứ hai bị từ chối (một vé = một file)', fileHai.rows?.[0]?.duoc === false,
     fileHai.loi ?? 'VẪN TẢI ĐƯỢC');
  const veHoa = await duoiAnon(`select ve_con_hieu_luc($1) as duoc`, [ve.toUpperCase()]);
  ok('…viết mã vé bằng chữ HOA cũng là cùng vé — không lách được', veHoa.rows?.[0]?.duoc === false, veHoa.loi ?? 'VẪN TẢI ĐƯỢC');
  const ve3 = (await xin('203.0.113.252')).rows[0].id;
  await db.query(`insert into storage.objects (bucket_id, name) values ('ho-so-ung-tuyen', $1)`, [`${ve3.toUpperCase()}/cv.pdf`]);
  const ve3Thuong = await duoiAnon(`select ve_con_hieu_luc($1) as duoc`, [ve3]);
  ok('…file đã tải dưới thư mục chữ HOA thì thư mục chữ thường cũng bị từ chối', ve3Thuong.rows?.[0]?.duoc === false,
     ve3Thuong.loi ?? 'VẪN TẢI ĐƯỢC');
  const ve2 = (await xin('203.0.113.253')).rows[0].id;
  await db.query(`insert into storage.objects (bucket_id, name) values ('anh-cong-khai', $1)`, [`${ve2}/x.jpg`]);
  const khoKhac = await duoiAnon(`select ve_con_hieu_luc($1) as duoc`, [ve2]);
  ok('…file trùng thư mục ở kho KHÁC không tính', khoKhac.rows?.[0]?.duoc === true, khoKhac.loi ?? '');
  const tiemSql = await duoiAnon(`select ve_con_hieu_luc($1) as duoc`, ["%' or '1'='1"]);
  ok('…đoạn đường dẫn lạ vẫn trả false, không ném lỗi', tiemSql.rows?.[0]?.duoc === false, tiemSql.loi ?? '');

  // Chốt 2 (trigger): storage-api kiểm policy lần cuối trong một savepoint rồi hủy, sau đó mới ghi
  // dòng — hai lượt tải SONG SONG cùng vé đều qua chốt 1. Trigger chặn ở bước ghi dòng. Chạy lại
  // NGUYÊN VĂN khối storage của 0084 trên bảng giả (PGlite một kết nối: thử thứ tự, không thử song song).
  const mig = readFileSync(join(__dirname, '..', 'supabase', 'migrations', '0084_gioi_han_cong_khai.sql'), 'utf8');
  const khoi = mig.slice(mig.indexOf('-- KHỐI STORAGE 0084'), mig.indexOf('-- HẾT KHỐI STORAGE 0084'));
  ok('Đọc được khối storage của 0084', khoi.includes('create trigger ho_so_mot_ve_mot_file'), khoi.slice(0, 80));
  await db.exec(khoi);
  const { n: soTrigger } = await mot(`select count(*)::int as n from pg_trigger t join pg_class c on c.oid = t.tgrelid
                                       join pg_namespace s on s.oid = c.relnamespace
                                      where s.nspname = 'storage' and c.relname = 'objects' and t.tgname = 'ho_so_mot_ve_mot_file'`);
  ok('Khối storage gắn trigger ho_so_mot_ve_mot_file vào storage.objects', soTrigger === 1, `${soTrigger}`);
  await db.exec(khoi);
  ok('…chạy lại khối không gắn trigger thứ hai', (await dem(`select count(*) from pg_trigger where tgname = 'ho_so_mot_ve_mot_file'`)) === 1);

  const ve4 = (await xin('203.0.113.254')).rows[0].id;
  // Lượt A và lượt B cùng qua chốt 1 (chưa có file nào) — như hai lượt song song.
  const a = await duoiAnon(`select ve_con_hieu_luc($1) as duoc`, [ve4]);
  const b = await duoiAnon(`select ve_con_hieu_luc($1) as duoc`, [ve4]);
  ok('(tiền đề: hai lượt song song cùng qua chốt 1)', a.rows?.[0]?.duoc === true && b.rows?.[0]?.duoc === true);
  const ghiA = await phaiLoi(`insert into storage.objects (bucket_id, name) values ('ho-so-ung-tuyen', $1)`, [`${ve4}/a.pdf`]);
  const ghiB = await phaiLoi(`insert into storage.objects (bucket_id, name) values ('ho-so-ung-tuyen', $1)`, [`${ve4}/b.pdf`]);
  ok('RÀ SOÁT 11/10 — chốt 2: lượt A ghi được, lượt B (file khác, cùng vé) bị trigger từ chối',
     ghiA === null && /Vé tải CV này đã có một file/.test(ghiB ?? ''), `A: ${ghiA} · B: ${ghiB ?? 'GHI ĐƯỢC'}`);
  const ghiHoa = await phaiLoi(`insert into storage.objects (bucket_id, name) values ('ho-so-ung-tuyen', $1)`, [`${ve4.toUpperCase()}/c.pdf`]);
  ok('…thư mục vé viết HOA cũng bị trigger từ chối', /Vé tải CV này đã có một file/.test(ghiHoa ?? ''), ghiHoa ?? 'GHI ĐƯỢC');
  const khac = await phaiLoi(`insert into storage.objects (bucket_id, name) values ('anh-cong-khai', $1), ('ho-so-ung-tuyen', 'khong-phai-ve/x.pdf')`,
                                [`${ve4}/d.jpg`]);
  ok('…kho khác, thư mục không phải vé: trigger không đụng tới (policy của kho quyết)', khac === null, khac ?? '');

  await db.exec(`drop schema storage cascade`);
  await db.query(`delete from phieu_tai_len`);
});

// ===========================================================================
await nhom('5 · nop_ho_so_ung_tuyen', async () => {
  await db.query(`select tao_tin_tuyen_dung_mau($1)`, [cnA.id]);
  await db.query(`update vi_tri_tuyen_dung
                     set mo_ta_vi = 'Phục vụ khách tại sảnh.', yeu_cau_vi = 'Chăm chỉ.', ca_lam = 'Ca tối 16:00–22:00',
                         trang_thai = 'da_cong_bo'
                   where ma = 'nhan-vien-sanh'`);
  const nop = (sdt, ip, ve = null) => duoiAnon(
    `select nop_ho_so_ung_tuyen('nhan-vien-sanh', 'Ứng Viên Thử', $1, p_dong_y => true, p_giay_tren_form => 30,
                                p_ma_tai_len => $3::uuid, p_ten_tep => 'cv.pdf', p_ip => $2::inet) as ma`, [sdt, ip, ve]);
  // Hồ sơ không xoá được (nhat_ky_ho_so bất biến, xoá dây chuyền bị chặn): lùi giờ cho ra khỏi cửa sổ 1 giờ.
  const lui2Gio = () => db.query(`update ho_so_ung_tuyen set created_at = created_at - interval '2 hours'`);
  const trongGio = () => dem(`select count(*) from ho_so_ung_tuyen where created_at > now() - interval '1 hour'`);

  let nullIp = null;
  for (let i = 1; i <= 30 && nullIp === null; i++) {
    const r = await nop(sdtThu(7000 + i), null);
    if (r.loi) nullIp = { i, loi: r.loi };
  }
  ok('RÀ SOÁT 11/10: IP null không còn nộp không giới hạn — đếm như MỘT IP, hồ sơ thứ 6 bị từ chối', nullIp?.i === 6, JSON.stringify(nullIp));
  ok('…câu hệ thống bận', nullIp?.loi?.includes(CAU.heThongBan), nullIp?.loi);

  await lui2Gio();
  let motIp = null;
  for (let i = 1; i <= 10 && motIp === null; i++) {
    const r = await nop(sdtThu(7100 + i), '198.51.100.80');
    if (r.loi) motIp = { i, loi: r.loi };
  }
  ok('Một IP thật: 5 hồ sơ / giờ như 0012, hồ sơ 6 bị từ chối bằng câu cũ', motIp?.i === 6 && motIp.loi.includes(CAU.nopNhieu), JSON.stringify(motIp));

  // Theo số điện thoại: chỉ mục duy nhất ho_so_khong_trung_idx (0012) đã chặn — một số, một vị
  // trí, một ngày; 0084 không thêm luật thứ hai. Từ 0081 lần gửi lại Y HỆT nhận lại mã cũ thay vì
  // lỗi 23505, khác nội dung thì vẫn lỗi — điều phải giữ ở cả hai đường là KHÔNG có hồ sơ thứ hai.
  const soCua = sdt => dem(`select count(*) from ho_so_ung_tuyen where sdt = chuan_hoa_sdt($1)`, [sdt]);
  const goc = await mot(`select ma_ho_so from ho_so_ung_tuyen where sdt = chuan_hoa_sdt($1)`, [sdtThu(7101)]);
  const trung = await nop(sdtThu(7101), '198.51.100.81');
  ok('Một số điện thoại gửi lại y hệt cùng vị trí trong ngày, đổi IP → nhận lại mã cũ (0081), không hồ sơ thứ hai',
     trung.rows?.[0]?.ma === goc?.ma_ho_so && (await soCua(sdtThu(7101))) === 1,
     `${trung.loi ?? trung.rows?.[0]?.ma} · gốc ${goc?.ma_ho_so} · ${await soCua(sdtThu(7101))} dòng`);
  const khacTen = await duoiAnon(
    `select nop_ho_so_ung_tuyen('nhan-vien-sanh', 'Ứng Viên Khác Tên', $1, p_dong_y => true, p_giay_tren_form => 30,
                                p_ip => '198.51.100.82'::inet) as ma`, [sdtThu(7101)]);
  ok('…cùng số, khác nội dung, đổi IP → bị chặn (chỉ mục 0012), vẫn một dòng',
     khacTen.loi !== null && (await soCua(sdtThu(7101))) === 1, khacTen.loi ?? 'NỘP ĐƯỢC');

  await lui2Gio();
  let toanCuc = null;
  for (let i = 1; i <= 40 && toanCuc === null; i++) {
    const r = await nop(sdtThu(7300 + i), `203.0.113.${i}`);
    if (r.loi) toanCuc = { i, loi: r.loi };
  }
  ok('Đổi IP và số mỗi lần → hồ sơ 31 bị từ chối (trần toàn cục 30 / giờ)', toanCuc?.i === 31 && toanCuc.loi.includes(CAU.heThongBan),
     JSON.stringify(toanCuc));

  // Bị chặn thì vé tải CV không bị đánh dấu đã dùng — giao dịch hủy cả.
  await db.query(`update vi_tri_tuyen_dung set hoi_cv = true where ma = 'nhan-vien-sanh'`);
  const ve = (await duoiAnon(`select xin_phieu_tai_cv('203.0.113.240'::inet) as id`)).rows[0].id;
  const biChan = await nop(sdtThu(7400), '203.0.113.241', ve);
  const { da_dung } = await mot(`select da_dung from phieu_tai_len where id = $1`, [ve]);
  ok('Bị chặn → không hồ sơ mới, vé tải CV vẫn chưa dùng', biChan.loi && da_dung === false && (await trongGio()) === 30,
     `${biChan.loi} · da_dung ${da_dung} · ${await trongGio()} hồ sơ trong giờ`);
  await lui2Gio();
  const sauGio = await nop(sdtThu(7400), '203.0.113.242', ve);
  ok('…qua 1 giờ thì nộp được, kèm đúng vé cũ', sauGio.loi === null, sauGio.loi ?? '');
});

// ===========================================================================
await nhom('6 · ghi_su_kien_web — RÀ SOÁT 11/10: khoá theo p_phien người gọi tự chọn', async () => {
  const ghi = phien => duoiAnon(`select ghi_su_kien_web('xem_trang', '/', $1::uuid, 'q1', 'vi')`, [phien]);
  const soDong = () => dem(`select count(*) from su_kien_web`);

  await db.query(`delete from su_kien_web`);
  let loiNem = 0;
  for (let i = 0; i < 80; i++) if ((await ghi(null)).loi) loiNem++;
  ok('RÀ SOÁT 11/10: p_phien null không còn chèn không giới hạn — đếm như MỘT phiên, giữ 60 dòng / phút', (await soDong()) === 60, `${await soDong()} dòng`);
  ok('…lượt thừa bị bỏ qua, không ném lỗi cho trang khách', loiNem === 0, `${loiNem} lỗi`);

  await db.query(`delete from su_kien_web`);
  const phienRieng = crypto.randomUUID();
  for (let i = 0; i < 70; i++) await ghi(phienRieng);
  ok('Trần riêng mỗi phiên 60 / phút giữ nguyên như 0013', (await soDong()) === 60, `${await soDong()} dòng`);

  await db.query(`delete from su_kien_web`);
  for (let i = 0; i < 320; i++) await ghi(crypto.randomUUID());
  ok('RÀ SOÁT 11/10: đổi p_phien mỗi lần → trần toàn cục 300 dòng / phút', (await soDong()) === 300, `${await soDong()} dòng`);
  await db.query(`update su_kien_web set created_at = created_at - interval '2 minutes'`);
  await ghi(crypto.randomUUID());
  ok('…sang phút sau ghi tiếp được', (await soDong()) === 301, `${await soDong()} dòng`);

  await db.query(`insert into su_kien_web (loai, created_at)
                  select 'xem_trang', now() - interval '30 minutes' from generate_series(1, 2699)`);
  await ghi(crypto.randomUUID());
  ok('Trần giờ: đủ 3000 dòng trong một giờ thì lượt mới bị bỏ qua', (await soDong()) === 3000, `${await soDong()} dòng`);
  await db.query(`delete from su_kien_web`);
});

// ===========================================================================
await nhom('7 · HAI LƯỢT CÙNG LÚC — khoá đứng trước câu đếm (bam-hai-lan)', async () => {
  const nguon = async ten => (await mot(`select prosrc as s from pg_proc where proname = $1`, [ten])).s;
  const truoc = (s, khoa, demRe) => { const k = s.search(khoa); const d = s.search(demRe); return k >= 0 && d > k; };

  const tao = await nguon('tao_dat_ban');
  ok('tao_dat_ban: khoá dòng chi_nhanh đứng trước câu đếm giới hạn',
     truoc(tao, /from\s+chi_nhanh\s+where\s+id\s*=\s*v_cn\.id\s+for\s+update/i, /gioi_han_lay_luot/i));
  const conLuot = await nguon('gioi_han_lay_luot');
  ok('gioi_han_lay_luot: pg_advisory_xact_lock đứng trước câu đếm', truoc(conLuot, /pg_advisory_xact_lock/i, /count\(\*\)/i));
  const khoaTra = await nguon('kiem_khoa_tra_cuu');
  ok('kiem_khoa_tra_cuu: pg_advisory_xact_lock đứng trước câu đếm', truoc(khoaTra, /pg_advisory_xact_lock/i, /count\(\*\)/i));
  for (const ham of ['xin_phieu_tai_cv', 'nop_ho_so_ung_tuyen', 've_con_hieu_luc', 'ho_so_mot_ve_mot_file']) {
    const s = await nguon(ham);
    ok(`${ham}: pg_advisory_xact_lock đứng trước câu đếm / câu tìm`, truoc(s, /pg_advisory_xact_lock/i, /count\(\*\)|from storage\.objects/i));
  }
  const { vol } = await mot(`select provolatile as vol from pg_proc where proname = 've_con_hieu_luc'`);
  ok('ve_con_hieu_luc: VOLATILE — câu tìm file sau khoá chụp ảnh mới, thấy file lượt trước vừa ghi', vol === 'v', vol);
  const { muc } = await mot(`select current_setting('default_transaction_isolation') as muc`);
  ok('Mức cô lập mặc định là READ COMMITTED', muc === 'read committed', muc);
});

// ===========================================================================
await nhom('8 · GIỜ VIỆT NAM — cửa sổ đếm theo now(), không đổi theo múi giờ phiên', async () => {
  for (const mui of ['Pacific/Kiritimati', 'Pacific/Pago_Pago']) {
    await xoaSoGioiHan();
    await db.exec(`set time zone '${mui}'`);
    const r = await guiLienTuc(8, i => datBan({ sdt: sdtThu(8000 + i), ip: '198.51.100.110', gio: '21:00' }));
    await db.exec(`reset time zone`);
    ok(`Múi giờ phiên ${mui}: vẫn chặn đúng lượt thứ 6 của một IP`, r.bi === 6, `lượt ${r.bi}: ${r.loi}`);
    await huyHetChoXacNhan();
  }
});

// ===========================================================================
await nhom('9 · CÂU THÔNG BÁO — vi nguyên văn, en / ko trên trang công khai, en ở nội bộ', async () => {
  const { cauLoiDatabase } = await import(pathToFileURL(join(WEB, 'chu.ts')).href);
  const { dichCau } = await import(pathToFileURL(join(WEB, 'cau-noi-bo.ts')).href);
  const VIET = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
  const HAN = /[가-힣]/;
  const MOI = [CAU.mangNhieu, CAU.sdtNhieu, CAU.heThongBan];
  for (const cau of MOI) {
    const loi = cau;   // PostgREST trả nguyên văn câu raise exception trong error.message
    ok(`[vi] trang tiếng Việt hiện nguyên văn: «${cau.slice(0, 40)}…»`, cauLoiDatabase(loi, 'vi', 'CHUNG') === cau);
    const en = cauLoiDatabase(loi, 'en', 'CHUNG');
    ok(`[en] có bản tiếng Anh riêng: «${en.slice(0, 50)}»`, en !== 'CHUNG' && !VIET.test(en));
    const ko = cauLoiDatabase(loi, 'ko', 'CHUNG');
    ok(`[ko] có bản tiếng Hàn riêng: «${ko.slice(0, 30)}»`, ko !== 'CHUNG' && HAN.test(ko) && !VIET.test(ko));
    const nb = dichCau('en', cau);
    ok(`[nội bộ en] dichCau có bản tiếng Anh: «${nb.slice(0, 50)}»`, nb !== cau && !VIET.test(nb));
  }
  ok('Câu "đã hết bàn" vẫn dịch như cũ (giới hạn không đổi câu cũ)',
     cauLoiDatabase('Khung giờ 19:00:00 ngày 2026-10-15 đã hết bàn', 'en', 'CHUNG') === 'No tables are available at that time.');
});

process.exit(ketThuc('GIỚI HẠN TẦN SUẤT CÔNG KHAI'));
