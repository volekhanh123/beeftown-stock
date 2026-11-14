/**
 * BEEFTOWN CRM — Kiểm thử: giới hạn ĐỘ DÀI văn bản của các hàm công khai (0121)
 * ============================================================================
 *
 *     node test/test-cong-khai-do-dai.mjs
 *
 * Rà soát bảo mật 14/11/2026: 0084 giới hạn SỐ LƯỢT của tao_dat_ban, huy_dat_ban và
 * nop_ho_so_ung_tuyen, nhưng không hàm nào giới hạn ĐỘ DÀI chữ nhận vào, và ba bảng dat_ban,
 * khach_hang, ho_so_ung_tuyen không có ràng buộc độ dài. Khoá anon là công khai, nên ai cũng gọi
 * thẳng được ba hàm này với ghi chú dài tuỳ ý: database đầy dần, và trang /noi-bo/dat-ban tải
 * nguyên ghi chú của 100 dòng. tao_don_mua_thit (0113) đã giới hạn độ dài — ba hàm cũ thì chưa.
 *
 * Mỗi dòng "RÀ SOÁT 14/11" đỏ trước 0121, xanh từ 0121.
 *
 * Giới hạn (chốt ở 0121, giống 0113 chỗ nào đã có):
 *   hàm   — họ tên 120, ghi chú 500 (không đếm ký tự \r trình duyệt gửi kèm xuống dòng), dịp 100,
 *           email 200, giới thiệu / kinh nghiệm 4000, tối đa 20 ca, tên tệp CV 200; utm cắt còn 100,
 *           trang giới thiệu cắt còn 300 (như ghi_su_kien_web); lý do hủy cắt còn 300.
 *   bảng  — rộng hơn hàm một bậc, để câu "Khách tự huỷ…" luôn nối được vào ghi chú và nhân viên còn
 *           chỗ ghi thêm: ghi chú 1000, họ tên 200, dịp 200, utm 300, trang giới thiệu 1000…
 */

import { dungDatabase, taoBoDem } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — GIỚI HẠN ĐỘ DÀI VĂN BẢN CỦA CÁC HÀM CÔNG KHAI (0121)');
const { db, cnA, duoiAnon } = await dungDatabase();

const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];
const dem = async (sql, p = []) => Number(Object.values(await mot(sql, p))[0]);
const NGAY = (await mot(`select (hom_nay_vn() + 3)::text as d`)).d;
const sdtThu = n => `09${String(n).padStart(8, '0')}`;
/** Chữ có dấu dài đúng n ký tự — giới hạn đếm ký tự, không đếm byte. */
const chu = (n, mau = 'ắ') => mau.repeat(n);

const CAU = {
  hoTen: 'Họ tên dài quá 120 ký tự',
  ghiChu: 'Ghi chú dài quá 500 ký tự',
  dip: 'Dịp dài quá 100 ký tự',
  email: 'Email dài quá 200 ký tự',
  gioiThieu: 'Phần giới thiệu dài quá 4000 ký tự',
  kinhNghiem: 'Phần kinh nghiệm dài quá 4000 ký tự',
  khongGui: 'Không gửi được hồ sơ, vui lòng thử lại',
};

let soSdt = 100;
/** Gửi yêu cầu đặt bàn như website (anon). Mỗi lượt một số điện thoại mới, không IP (không chạm xô IP của 0084). */
async function datBan(thay = {}) {
  const t = { sdt: sdtThu(++soSdt), ten: 'Khách Thử', gio: '18:00', ghiChu: null, dip: null,
              utmSource: null, utmMedium: null, utmCampaign: null, trangGioiThieu: null, ...thay };
  const r = await duoiAnon(
    `select * from tao_dat_ban(p_chi_nhanh_ma => 'q1', p_sdt => $1, p_ho_ten => $2, p_ngay => $3::date, p_gio => $4::time,
        p_so_khach => 2::smallint, p_dip => $5, p_ghi_chu => $6, p_utm_source => $7, p_utm_medium => $8,
        p_utm_campaign => $9, p_trang_gioi_thieu => $10)`,
    [t.sdt, t.ten, NGAY, t.gio, t.dip, t.ghiChu, t.utmSource, t.utmMedium, t.utmCampaign, t.trangGioiThieu]);
  return r.loi ? { loi: r.loi, sdt: t.sdt } : { ...r.rows[0], sdt: t.sdt };
}
const biTuChoi = (r, cau) => typeof r.loi === 'string' && r.loi.includes(cau);
const moTa = r => (r?.loi ? `LỖI: ${r.loi.slice(0, 160)}` : `được nhận, mã ${r?.ma_dat_ban}`);

// ===========================================================================
await nhom('1 · tao_dat_ban từ chối chữ quá dài, không ghi dòng nào', async () => {
  const truoc = await dem(`select count(*) from dat_ban`);
  const khachTruoc = await dem(`select count(*) from khach_hang`);

  const ten = await datBan({ ten: chu(121) });
  ok('RÀ SOÁT 14/11: họ tên 121 ký tự → "Họ tên dài quá 120 ký tự"', biTuChoi(ten, CAU.hoTen), moTa(ten));
  const ghiChu = await datBan({ ghiChu: chu(501) });
  ok('RÀ SOÁT 14/11: ghi chú 501 ký tự → "Ghi chú dài quá 500 ký tự"', biTuChoi(ghiChu, CAU.ghiChu), moTa(ghiChu));
  const lon = await datBan({ ghiChu: 'x'.repeat(2 * 1024 * 1024) });
  ok('RÀ SOÁT 14/11: ghi chú 2 MB bị từ chối', biTuChoi(lon, CAU.ghiChu), moTa(lon));
  const dip = await datBan({ dip: chu(101) });
  ok('RÀ SOÁT 14/11: dịp 101 ký tự → "Dịp dài quá 100 ký tự"', biTuChoi(dip, CAU.dip), moTa(dip));

  ok('Các lượt bị từ chối không để lại đặt bàn nào', await dem(`select count(*) from dat_ban`) === truoc);
  ok('…và không để lại hồ sơ khách nào', await dem(`select count(*) from khach_hang`) === khachTruoc);
});

// ===========================================================================
await nhom('2 · tao_dat_ban vẫn nhận đúng giới hạn; utm và trang giới thiệu bị cắt chứ không làm mất yêu cầu', async () => {
  const vuaDu = await datBan({ ten: chu(120), ghiChu: chu(500), dip: chu(100) });
  ok('Họ tên 120, ghi chú 500, dịp 100 ký tự có dấu → được nhận', !vuaDu.loi && !!vuaDu.ma_dat_ban, moTa(vuaDu));
  const d = await mot(`select char_length(d.ghi_chu) as ghi_chu, char_length(d.dip) as dip, char_length(k.ho_ten) as ho_ten
                         from dat_ban d join khach_hang k on k.id = d.khach_hang_id where d.ma_dat_ban = $1`, [vuaDu.ma_dat_ban]);
  ok('…lưu nguyên vẹn, không cắt', d?.ghi_chu === 500 && d?.dip === 100 && d?.ho_ten === 120, JSON.stringify(d));

  // Trình duyệt đếm một lần xuống dòng là 1 ký tự nhưng gửi lên \r\n (2 ký tự).
  const xuongDong = await datBan({ ghiChu: Array.from({ length: 10 }, () => chu(49)).join('\r\n') });   // 490 + 9 lần xuống dòng = 499 ký tự người gõ
  ok('Ghi chú 499 ký tự người gõ, gửi lên 508 ký tự vì \\r\\n → được nhận', !xuongDong.loi, moTa(xuongDong));

  const utm = await datBan({ utmSource: 'u'.repeat(5000), utmMedium: 'm'.repeat(5000), utmCampaign: 'c'.repeat(5000),
                             trangGioiThieu: 'https://vi-du.test/' + 't'.repeat(5000) });
  ok('utm và trang giới thiệu 5.000 ký tự → yêu cầu vẫn được nhận', !utm.loi && !!utm.ma_dat_ban, moTa(utm));
  const u = await mot(`select char_length(d.utm_source) as s, char_length(d.utm_medium) as m, char_length(d.utm_campaign) as c,
                              char_length(d.trang_gioi_thieu) as t, char_length(k.nguon_utm_source) as ks,
                              char_length(k.nguon_utm_medium) as km, char_length(k.nguon_utm_campaign) as kc
                         from dat_ban d join khach_hang k on k.id = d.khach_hang_id where d.ma_dat_ban = $1`, [utm.ma_dat_ban]);
  ok('RÀ SOÁT 14/11: utm lưu tối đa 100 ký tự ở cả đặt bàn lẫn hồ sơ khách', u && [u.s, u.m, u.c, u.ks, u.km, u.kc].every(n => n === 100), JSON.stringify(u));
  ok('RÀ SOÁT 14/11: trang giới thiệu lưu tối đa 300 ký tự', u?.t === 300, JSON.stringify(u));
});

// ===========================================================================
await nhom('3 · huy_dat_ban: lý do hủy bị cắt, ghi chú sau khi nối không quá 1000 ký tự', async () => {
  const dat = await datBan({ ghiChu: chu(500) });
  const huy = await duoiAnon(`select huy_dat_ban($1, $2, $3) as da_huy`, [dat.ma_dat_ban, dat.sdt, 'L'.repeat(3 * 1024 * 1024)]);
  ok('Hủy với lý do 3 MB vẫn hủy được', huy.loi === null && huy.rows[0]?.da_huy === true, huy.loi ?? JSON.stringify(huy.rows));
  const g = await mot(`select trang_thai, char_length(ghi_chu) as dai, ghi_chu from dat_ban where ma_dat_ban = $1`, [dat.ma_dat_ban]);
  ok('RÀ SOÁT 14/11: ghi chú sau khi hủy không quá 1000 ký tự', g?.trang_thai === 'da_huy' && g.dai <= 1000, `dài ${g?.dai}`);
  ok('…còn nguyên ghi chú của khách và câu "Khách tự huỷ"', g?.ghi_chu.startsWith(chu(500)) && g.ghi_chu.includes(' · Khách tự huỷ: L'), g?.ghi_chu.slice(495, 530));
  ok('…lý do giữ đúng 300 ký tự đầu', (g?.ghi_chu.match(/L+$/)?.[0].length ?? 0) === 300, String(g?.ghi_chu.match(/L+$/)?.[0].length));

  // Nhân viên đã ghi thêm tới sát trần của bảng: khách vẫn phải hủy được, và dấu "Khách tự huỷ" không bị mất.
  const day = await datBan({ ghiChu: 'ghi chú đầu' });
  await db.query(`update dat_ban set ghi_chu = $2 where ma_dat_ban = $1`, [day.ma_dat_ban, chu(1000, 'n')]);
  const huyDay = await duoiAnon(`select huy_dat_ban($1, $2, $3) as da_huy`, [day.ma_dat_ban, day.sdt, 'bận việc']);
  ok('Ghi chú đã dài 1000 ký tự: khách vẫn hủy được', huyDay.loi === null && huyDay.rows[0]?.da_huy === true, huyDay.loi ?? '');
  const gd = await mot(`select trang_thai, char_length(ghi_chu) as dai, ghi_chu from dat_ban where ma_dat_ban = $1`, [day.ma_dat_ban]);
  ok('…ghi chú vẫn không quá 1000 ký tự và kết thúc bằng lý do hủy', gd?.trang_thai === 'da_huy' && gd.dai <= 1000 && gd.ghi_chu.endsWith(' · Khách tự huỷ: bận việc'), `dài ${gd?.dai}: …${gd?.ghi_chu.slice(-30)}`);

  const khongLyDo = await datBan();
  const huyTron = await duoiAnon(`select huy_dat_ban($1, $2) as da_huy`, [khongLyDo.ma_dat_ban, khongLyDo.sdt]);
  const gt = await mot(`select ghi_chu from dat_ban where ma_dat_ban = $1`, [khongLyDo.ma_dat_ban]);
  ok('Hủy không lý do, không ghi chú: câu ghi như cũ "Khách tự huỷ"', huyTron.rows?.[0]?.da_huy === true && gt?.ghi_chu === 'Khách tự huỷ', gt?.ghi_chu);
});

// ===========================================================================
await nhom('4 · nop_ho_so_ung_tuyen từ chối chữ quá dài', async () => {
  await db.query(`insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai) values ('hien_tuyen_dung', 'bool', true, 'da_cong_bo')`);
  await db.query(`select tao_tin_tuyen_dung_mau($1)`, [cnA.id]);
  await db.query(`update vi_tri_tuyen_dung
                     set mo_ta_vi = 'Phục vụ khách tại sảnh.', yeu_cau_vi = 'Chăm chỉ.', ca_lam = 'Ca tối 16:00–22:00',
                         hoi_email = true, hoi_nam_sinh = true, hoi_ca_lam = true, hoi_gioi_thieu = true,
                         hoi_kinh_nghiem = true, hoi_cv = true, trang_thai = 'da_cong_bo'
                   where ma = 'nhan-vien-sanh'`);
  let soIp = 0;
  /** Nộp hồ sơ như website (anon), mỗi lượt một số điện thoại và một IP mới (không chạm xô IP của 0084). */
  const nop = async (thay = {}) => {
    const t = { ten: 'Ứng Viên Thử', email: null, gioiThieu: null, kinhNghiem: null, ca: null, ve: null, tenTep: null,
                utmSource: null, utmCampaign: null, ...thay };
    const r = await duoiAnon(
      `select nop_ho_so_ung_tuyen(p_vi_tri_ma => 'nhan-vien-sanh', p_ho_ten => $1, p_sdt => $2, p_email => $3,
          p_gioi_thieu => $4, p_kinh_nghiem => $5, p_ca_lam_duoc => $6::text[], p_ma_tai_len => $7::uuid, p_ten_tep => $8,
          p_dong_y => true, p_giay_tren_form => 30, p_utm_source => $9, p_utm_campaign => $10, p_ip => $11::inet) as ma`,
      [t.ten, sdtThu(++soSdt), t.email, t.gioiThieu, t.kinhNghiem, t.ca, t.ve, t.tenTep, t.utmSource, t.utmCampaign,
       `203.0.113.${++soIp}`]);
    return r.loi ? { loi: r.loi } : { ma: r.rows[0].ma };
  };
  const moTaHs = r => (r?.loi ? `LỖI: ${r.loi.slice(0, 160)}` : `được nhận, mã ${r?.ma}`);
  const truoc = await dem(`select count(*) from ho_so_ung_tuyen`);

  const ten = await nop({ ten: chu(121) });
  ok('RÀ SOÁT 14/11: họ tên 121 ký tự → "Họ tên dài quá 120 ký tự"', biTuChoi(ten, CAU.hoTen), moTaHs(ten));
  const email = await nop({ email: 'a'.repeat(190) + '@vi-du.test' });
  ok('RÀ SOÁT 14/11: email 201 ký tự → "Email dài quá 200 ký tự"', biTuChoi(email, CAU.email), moTaHs(email));
  const gt = await nop({ gioiThieu: chu(4001) });
  ok('RÀ SOÁT 14/11: giới thiệu 4001 ký tự → "Phần giới thiệu dài quá 4000 ký tự"', biTuChoi(gt, CAU.gioiThieu), moTaHs(gt));
  const kn = await nop({ kinhNghiem: 'k'.repeat(2 * 1024 * 1024) });
  ok('RÀ SOÁT 14/11: kinh nghiệm 2 MB → "Phần kinh nghiệm dài quá 4000 ký tự"', biTuChoi(kn, CAU.kinhNghiem), moTaHs(kn));
  const ca = await nop({ ca: Array.from({ length: 21 }, (_, i) => `ca-${i}`) });
  ok('RÀ SOÁT 14/11: 21 ca làm → câu chung "Không gửi được hồ sơ…"', biTuChoi(ca, CAU.khongGui), moTaHs(ca));
  const caDai = await nop({ ca: ['c'.repeat(5000)] });
  ok('RÀ SOÁT 14/11: một ca dài 5.000 ký tự → câu chung', biTuChoi(caDai, CAU.khongGui), moTaHs(caDai));
  const ve = (await duoiAnon(`select xin_phieu_tai_cv('203.0.113.250'::inet) as id`)).rows[0].id;
  const tep = await nop({ ve, tenTep: 't'.repeat(201) + '.pdf' });
  ok('RÀ SOÁT 14/11: tên tệp CV 205 ký tự → câu chung', biTuChoi(tep, CAU.khongGui), moTaHs(tep));
  ok('Các lượt bị từ chối không để lại hồ sơ nào', await dem(`select count(*) from ho_so_ung_tuyen`) === truoc);

  const vuaDu = await nop({ ten: chu(120), email: 'a'.repeat(189) + '@vi-du.test', gioiThieu: chu(4000), kinhNghiem: chu(4000),
                            ca: Array.from({ length: 20 }, (_, i) => `ca-${i}`), utmSource: 'u'.repeat(5000), utmCampaign: 'c'.repeat(5000) });
  ok('Đúng giới hạn (120 / 200 / 4000 / 4000 / 20 ca) → được nhận', !vuaDu.loi && !!vuaDu.ma, moTaHs(vuaDu));
  const h = await mot(`select char_length(ho_ten) as ho_ten, char_length(email) as email, char_length(gioi_thieu) as gt,
                              char_length(kinh_nghiem) as kn, cardinality(ca_lam_duoc) as ca,
                              char_length(nguon_utm_source) as s, char_length(nguon_utm_campaign) as c
                         from ho_so_ung_tuyen where ma_ho_so = $1`, [vuaDu.ma]);
  ok('…lưu nguyên vẹn; utm cắt còn 100 ký tự', h?.ho_ten === 120 && h.email === 200 && h.gt === 4000 && h.kn === 4000 && h.ca === 20
     && h.s === 100 && h.c === 100, JSON.stringify(h));

  const xuongDong = await nop({ gioiThieu: Array.from({ length: 40 }, () => chu(99)).join('\r\n') });   // 3960 + 39 lần xuống dòng = 3999 ký tự người gõ
  ok('Giới thiệu 3999 ký tự người gõ, gửi lên 4038 ký tự vì \\r\\n → được nhận', !xuongDong.loi, moTaHs(xuongDong));
});

// ===========================================================================
await nhom('5 · Ràng buộc của bảng chặn mọi đường ghi khác', async () => {
  const dat = await datBan();
  const thu = async (sql, p) => { try { await db.query(sql, p); return null; } catch (e) { return String(e?.message ?? e); } };

  const gc = await thu(`update dat_ban set ghi_chu = $2 where ma_dat_ban = $1`, [dat.ma_dat_ban, chu(1001)]);
  ok('RÀ SOÁT 14/11: ghi thẳng ghi chú 1001 ký tự vào dat_ban → ràng buộc dat_ban_chu_ngan chặn', gc?.includes('dat_ban_chu_ngan'), gc ?? 'ghi được');
  const kh = await thu(`update khach_hang set ho_ten = $2 where sdt = $1`, [dat.sdt, chu(201)]);
  ok('RÀ SOÁT 14/11: ghi thẳng họ tên 201 ký tự vào khach_hang → ràng buộc khach_hang_chu_ngan chặn', kh?.includes('khach_hang_chu_ngan'), kh ?? 'ghi được');
  const hs = await thu(`update ho_so_ung_tuyen set gioi_thieu = $1 where not da_an_danh`, [chu(8001)]);
  ok('RÀ SOÁT 14/11: ghi thẳng giới thiệu 8001 ký tự vào ho_so_ung_tuyen → ràng buộc ho_so_chu_ngan chặn', hs?.includes('ho_so_chu_ngan'), hs ?? 'ghi được');
  const caNhieu = await thu(`update ho_so_ung_tuyen set ca_lam_duoc = array_fill(null::text, array[2000000]) where not da_an_danh`);
  ok('RÀ SOÁT 14/11: mảng ca 2.000.000 phần tử rỗng → ràng buộc chặn theo số phần tử', caNhieu?.includes('ho_so_chu_ngan'), caNhieu ?? 'ghi được');

  const ham = await db.query(
    `select p.proname, p.prosecdef, p.proconfig::text as cau_hinh, has_function_privilege('anon', p.oid, 'execute') as anon
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname in ('tao_dat_ban', 'huy_dat_ban', 'nop_ho_so_ung_tuyen') order by 1`);
  ok('Ba hàm vẫn là security definer, đặt search_path, anon gọi được',
     ham.rows.length === 3 && ham.rows.every(r => r.prosecdef && /search_path=public/.test(r.cau_hinh ?? '') && r.anon), JSON.stringify(ham.rows));
});

// ===========================================================================
await nhom('6 · Khách đọc câu từ chối bằng đúng thứ tiếng của trang (vi nguyên văn, en, ko)', async () => {
  const { cauLoiDatabase } = await import('../../web/src/lib/chu.ts');
  const { dichCau } = await import('../../web/src/lib/cau-noi-bo.ts');
  const VIET = /[ạảãàáâậầấẩẫăắằẳẵặẹẻẽèéêệềếểễịỉĩìíọỏõòóôộồốổỗơợờớởỡụủũùúưựừứửữỵỷỹỳýđĐ]/i;
  const HAN = /[가-힣]/;
  for (const cau of ['Họ tên dài quá 120 ký tự', 'Ghi chú dài quá 500 ký tự', 'Dịp dài quá 100 ký tự', 'Email dài quá 200 ký tự',
                     'Phần giới thiệu dài quá 4000 ký tự', 'Phần kinh nghiệm dài quá 4000 ký tự']) {
    const en = cauLoiDatabase(cau, 'en', 'CHUNG');
    const ko = cauLoiDatabase(cau, 'ko', 'CHUNG');
    ok(`«${cau}»: trang tiếng Việt hiện nguyên văn; tiếng Anh và tiếng Hàn có câu riêng, không rơi về câu chung`,
       cauLoiDatabase(cau, 'vi', 'CHUNG') === cau && en !== 'CHUNG' && !VIET.test(en) && ko !== 'CHUNG' && HAN.test(ko) && !VIET.test(ko), `${en} | ${ko}`);
    const nb = dichCau('en', cau);
    ok('…màn nội bộ tiếng Anh (nhân viên ghi hộ) cũng có bản dịch', nb !== cau && !VIET.test(nb), nb);
  }
});

process.exit(ketThuc('giới hạn độ dài văn bản của các hàm công khai'));
