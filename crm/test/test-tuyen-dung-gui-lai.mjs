/**
 * BEEFTOWN CRM — Kiểm thử: nộp hồ sơ ứng tuyển hai lần (0081)
 * ===========================================================
 *
 *     node test/test-tuyen-dung-gui-lai.mjs
 *
 * Chỉ mục ho_so_khong_trung_idx (0012) cho mỗi số điện thoại một hồ sơ / vị trí / ngày. Nên
 * lần gọi thứ hai của cùng hồ sơ — bấm đúp khi tắt JavaScript, trình duyệt gửi lại POST, ứng
 * viên gửi lại sau câu "KHÔNG CHẮC đã ghi nhận" — không tạo dòng thứ hai, nhưng ném 23505, và
 * web báo "Chưa gửi được hồ sơ. Thông tin của bạn CHƯA được ghi nhận. Vui lòng thử lại." trong
 * khi hồ sơ ĐÃ vào. Ứng viên thử lại, lại nghe "chưa ghi nhận", rồi bỏ.
 *
 * Từ 0081, lời gọi không phiên gửi lại Y HỆT (vị trí, số điện thoại đã chuẩn hóa, họ tên,
 * email, năm sinh, giới thiệu, kinh nghiệm, ca — sau khi bỏ các trường tin không hỏi) trong
 * cùng ngày nộp (hoặc trong 10 phút, cho lượt gửi vắt qua nửa đêm) nhận lại đúng mã cũ.
 *
 * Kiểm: hai, ba lần y hệt → một dòng, một mã; khác một trường → không nhận mã cũ, không thêm
 * dòng; trường tin không hỏi khác nhau vẫn là y hệt; số điện thoại viết kiểu khác vẫn là một;
 * vắt qua nửa đêm; múi giờ phiên không đổi gì; lần gửi lại kèm CV chỉ khớp hồ sơ đã có CV và
 * không bao giờ gắn file vào hồ sơ cũ (người lạ biết tên + số điện thoại không gắn được file vào
 * hồ sơ của ứng viên); đã 5 hồ sơ / IP / giờ mà gửi lại vẫn nhận mã; tin vừa hết hạn mà gửi lại vẫn nhận mã; phiên
 * đăng nhập không lấy được mã; bẫy bot, chưa đồng ý vẫn bị chặn; giao dịch đầu bị hủy thì lần
 * sau tạo đúng một dòng.
 */

import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — NỘP HỒ SƠ HAI LẦN (0081)');
const { db, cnA, duoi, duoiAnon } = await dungDatabase();

const UID_LA = '00000000-0000-4000-8000-0000000000e3';   // đăng nhập được, không có dòng nhan_su

const q = async (sql, p = []) => (await db.query(sql, p)).rows;
const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];

// Cổng tuyển dụng mở; hai tin đã đăng: sảnh (không hỏi CV — mẫu 0026) và quản lý cửa hàng (hỏi CV).
await db.query(`select tao_tin_tuyen_dung_mau($1)`, [cnA.id]);
await db.query(`insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai)
                values ('hien_tuyen_dung', 'bool', true, 'da_cong_bo')`);
for (const ma of ['nhan-vien-sanh', 'quan-ly-cua-hang', 'nhan-vien-bep']) {
  await db.query(`update vi_tri_tuyen_dung
                  set mo_ta_vi = 'Mô tả công việc đầy đủ cho kiểm thử.', yeu_cau_vi = 'Yêu cầu đầy đủ cho kiểm thử.',
                      trang_thai = 'da_cong_bo'
                  where ma = $1`, [ma]);
}

const MAC_DINH = {
  viTri: 'nhan-vien-sanh', ten: 'Trần Thị Bình', email: null, namSinh: null, gioiThieu: null, kinhNghiem: null,
  ca: null, ve: null, tep: null, dongY: true, bay: null, giay: 40, utm: null, ip: null,
};

/** Nộp như website (anon), hoặc dưới phiên của một người khi có uid. */
async function nop(thay, uid) {
  const t = { ...MAC_DINH, ...thay };
  const sql = `select nop_ho_so_ung_tuyen($1, $2, $3, $4, $5::smallint, $6, $7, $8::text[],
                 $9::uuid, $10, $11, $12, $13::int, $14, null, $15::inet) as ma`;
  const thamSo = [t.viTri, t.ten, t.sdt, t.email, t.namSinh, t.gioiThieu, t.kinhNghiem, t.ca,
                  t.ve, t.tep, t.dongY, t.bay, t.giay, t.utm, t.ip];
  const r = uid === undefined ? await duoiAnon(sql, thamSo) : await duoi(uid, sql, thamSo);
  return r.loi ? { loi: r.loi } : { ma: r.rows[0].ma };
}
const moTa = r => (r?.loi ? `LỖI: ${r.loi}` : `mã ${r?.ma}`);

/** Số hồ sơ của một số điện thoại (đã chuẩn hóa). */
const soDong = async (sdt) => (await mot(
  `select count(*)::int as n from ho_so_ung_tuyen where sdt = chuan_hoa_sdt($1)`, [sdt])).n;

const xinVe = async () => (await duoiAnon(`select xin_phieu_tai_cv(null::inet) as ve`)).rows[0].ve;

// ===========================================================================
await nhom('0 · TIỀN ĐỀ — một bản hàm, chữ ký không đổi, anon vẫn gọi được', async () => {
  const { n } = await mot(`select count(*)::int as n from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                            where s.nspname = 'public' and p.proname = 'nop_ho_so_ung_tuyen'`);
  ok('nop_ho_so_ung_tuyen() vẫn chỉ có MỘT bản (không đẻ overload)', n === 1, `${n} bản`);
  const { args } = await mot(`select pg_get_function_identity_arguments('nop_ho_so_ung_tuyen'::regproc) as args`);
  ok('Chữ ký giữ nguyên 16 tham số như 0026',
     args === 'p_vi_tri_ma text, p_ho_ten text, p_sdt text, p_email text, p_nam_sinh smallint, p_gioi_thieu text, '
       + 'p_kinh_nghiem text, p_ca_lam_duoc text[], p_ma_tai_len uuid, p_ten_tep text, p_dong_y boolean, p_bay text, '
       + 'p_giay_tren_form integer, p_utm_source text, p_utm_campaign text, p_ip inet', args);
  const { dinh, cauHinh } = await mot(`select prosecdef as dinh, proconfig::text as "cauHinh" from pg_proc where proname = 'nop_ho_so_ung_tuyen'`);
  ok('Vẫn là SECURITY DEFINER, có set search_path', dinh === true && /search_path=public/.test(cauHinh ?? ''), cauHinh);
  const { duoc } = await mot(`select has_function_privilege('anon', 'nop_ho_so_ung_tuyen'::regproc, 'execute') as duoc`);
  ok('anon vẫn gọi được nop_ho_so_ung_tuyen()', duoc === true);
  const { duocVe } = await mot(`select has_function_privilege('anon', 'xin_phieu_tai_cv(inet)'::regprocedure, 'execute') as "duocVe"`);
  ok('anon vẫn xin được vé tải CV, vẫn gọi ve_con_hieu_luc (policy kho)', duocVe === true
     && (await mot(`select has_function_privilege('anon', 've_con_hieu_luc(text)'::regprocedure, 'execute') as d`)).d === true);

  // Hai lượt gửi CÙNG LÚC: PGlite chỉ có một kết nối, không dựng được hai giao dịch song song.
  // Điều giữ cho chúng ra một mã là THỨ TỰ trong thân hàm: khóa tư vấn theo (vị trí, số điện
  // thoại) trước, tìm hồ sơ cũ sau (READ COMMITTED chụp ảnh mới sau khi chờ khóa), rồi mới
  // insert. Lượt sau mà lọt qua khóa thì chỉ mục 0012 ném 23505 — lại là câu "chưa ghi nhận" sai.
  const { nguon } = await mot(`select prosrc as nguon from pg_proc where proname = 'nop_ho_so_ung_tuyen'`);
  const viTri = mau => nguon.search(mau);
  const khoa = viTri(/pg_advisory_xact_lock\(\s*hashtextextended\(\s*v_vi_tri\.id::text\s*\|\|\s*'\|'\s*\|\|\s*coalesce\(v_sdt/i);
  const tim = viTri(/interval\s+'10 minutes'/i);
  const ip = viTri(/where\s+ip\s*=\s*p_ip/i);
  const chen = viTri(/insert\s+into\s+ho_so_ung_tuyen/i);
  ok('Thứ tự trong thân hàm: khóa tư vấn (vị trí, số điện thoại) → tìm hồ sơ gửi lại → đếm IP → insert',
     khoa >= 0 && tim > khoa && ip > tim && chen > ip, `khóa ${khoa} · tìm ${tim} · IP ${ip} · insert ${chen}`);
  ok('Không khóa dòng vi_tri_tuyen_dung (for update): lưu lượng bot không chặn ứng viên khác và người sửa tin',
     !/from\s+vi_tri_tuyen_dung[^;]*for\s+update/i.test(nguon));
  const { n: lk } = await mot(`select count(*)::int as n from pg_locks where locktype = 'advisory'`);
  ok('Khóa tư vấn nhả khi giao dịch xong (không còn khóa nào sau các lần gọi)', lk === 0, `${lk} khóa`);
  const { muc } = await mot(`select current_setting('default_transaction_isolation') as muc`);
  ok('Mức cô lập mặc định là READ COMMITTED (câu sau khóa thấy dòng vừa commit)', muc === 'read committed', muc);
});

// ===========================================================================
await nhom('1 · BẤM HAI LẦN Y HỆT → MỘT DÒNG, CÙNG MÃ (không còn "CHƯA được ghi nhận" sai)', async () => {
  const hs = { sdt: '0912000101', gioiThieu: 'Thích nói chuyện với khách', kinhNghiem: '1 năm phục vụ quán nướng',
               ca: ['toi', 'cuoi_tuan'], namSinh: 2001, email: 'binh@example.com' };
  const lan1 = await nop(hs);
  const lan2 = await nop(hs);
  ok('Lần một ghi được', !lan1.loi && /^BT-UV-\d{4}-[A-Z0-9]{5}$/.test(lan1.ma ?? ''), moTa(lan1));
  ok('HAI LẦN GỬI Y HỆT → cùng mã hồ sơ, không lỗi 23505', !lan2.loi && lan2.ma === lan1.ma, `${moTa(lan1)} · ${moTa(lan2)}`);
  ok('…đúng MỘT dòng ho_so_ung_tuyen', (await soDong(hs.sdt)) === 1, `${await soDong(hs.sdt)} dòng`);
  const lan3 = await nop(hs);
  ok('Gửi lần ba vẫn cùng mã, vẫn một dòng', lan3.ma === lan1.ma && (await soDong(hs.sdt)) === 1, moTa(lan3));
  const { n: nk } = await mot(`select count(*)::int as n from nhat_ky_ho_so k join ho_so_ung_tuyen h on h.id = k.ho_so_id
                               where h.ma_ho_so = $1`, [lan1.ma]);
  ok('…nhật ký hồ sơ không thêm dòng nào cho lần gửi lại', nk <= 1, `${nk} dòng`);

  const ten = await nop({ ...hs, ten: '  Trần Thị Bình  ' });
  ok('Họ tên thừa dấu cách hai đầu (database tự cắt) → vẫn là y hệt', ten.ma === lan1.ma, moTa(ten));
});

// ===========================================================================
await nhom('2 · KHÁC MỘT TRƯỜNG → KHÔNG NHẬN MÃ CŨ, KHÔNG THÊM DÒNG (chỉ mục 0012 vẫn một hồ sơ / vị trí / ngày)', async () => {
  const goc = { sdt: '0912000201', gioiThieu: 'Giới thiệu gốc', kinhNghiem: 'Kinh nghiệm gốc', ca: ['sang'], namSinh: 1999,
                email: 'goc@example.com' };
  const dau = await nop(goc);
  ok('Hồ sơ gốc ghi được', !dau.loi, moTa(dau));
  for (const [ten, thay] of [
    ['họ tên', { ten: 'Trần Thị Bình An' }],
    ['email', { email: 'khac@example.com' }],
    ['năm sinh', { namSinh: 2000 }],
    ['giới thiệu', { gioiThieu: 'Giới thiệu đã sửa' }],
    ['kinh nghiệm', { kinhNghiem: null }],
    ['ca làm', { ca: ['sang', 'toi'] }],
    ['đồng ý (bỏ tích)', { dongY: false }],
  ]) {
    const r = await nop({ ...goc, ...thay });
    ok(`Khác ${ten.toUpperCase()} → không trả mã của hồ sơ gốc, vẫn một dòng`,
       r.ma !== dau.ma && !JSON.stringify(r).includes(dau.ma) && (await soDong(goc.sdt)) === 1, moTa(r));
  }
  const chuaDongY = await nop({ ...goc, dongY: false });
  ok('Bỏ tích đồng ý → vẫn câu cũ "Chưa đồng ý cho Beeftown xử lý thông tin ứng tuyển"',
     /Chưa đồng ý cho Beeftown xử lý thông tin ứng tuyển/.test(chuaDongY.loi ?? ''), moTa(chuaDongY));

  const viTriKhac = await nop({ ...goc, viTri: 'nhan-vien-bep' });
  ok('Khác VỊ TRÍ → hồ sơ mới, mã mới', !viTriKhac.loi && viTriKhac.ma !== dau.ma && (await soDong(goc.sdt)) === 2, moTa(viTriKhac));
  const lai = await nop(goc);
  ok('Gửi lại đúng hồ sơ gốc → vẫn nhận mã gốc', lai.ma === dau.ma, moTa(lai));
});

// ===========================================================================
await nhom('3 · TRƯỜNG TIN KHÔNG HỎI, SỐ ĐIỆN THOẠI VIẾT KIỂU KHÁC, CHỮ CÓ DẤU', async () => {
  // Tin sảnh hỏi đủ trường chữ (mẫu 0026); tắt email để thử: trường tin không hỏi thì database bỏ giá trị.
  await db.query(`update vi_tri_tuyen_dung set hoi_email = false where ma = 'nhan-vien-sanh'`);
  try {
    const goc = { sdt: '0912 000 301', email: 'a@example.com', ten: 'Nguyễn Ngọc Ánh', gioiThieu: 'Sinh viên năm hai — rảnh tối' };
    const r1 = await nop(goc);
    const r2 = await nop({ ...goc, email: 'khac@example.com' });
    ok('Email khác nhau nhưng tin KHÔNG hỏi email (database bỏ cả hai) → vẫn là y hệt, cùng mã', !r1.loi && r2.ma === r1.ma, `${moTa(r1)} · ${moTa(r2)}`);
    const r3 = await nop({ ...goc, sdt: '+84 912 000 301' });
    const r4 = await nop({ ...goc, sdt: '0912.000.301' });
    ok('"0912 000 301", "+84 912 000 301", "0912.000.301" → cùng một mã', r3.ma === r1.ma && r4.ma === r1.ma, [r3, r4].map(moTa).join(' · '));
    ok('…một dòng', (await soDong('0912000301')) === 1);
    const khongDau = await nop({ ...goc, gioiThieu: 'Sinh vien nam hai — ranh toi' });
    ok('Giới thiệu mất dấu ("Sinh vien") khác "Sinh viên" → không nhận mã cũ', khongDau.ma !== r1.ma, moTa(khongDau));
  } finally {
    await db.query(`update vi_tri_tuyen_dung set hoi_email = true where ma = 'nhan-vien-sanh'`);
  }
});

// ===========================================================================
await nhom('4 · GIỜ VIỆT NAM — vắt qua nửa đêm, múi giờ phiên', async () => {
  const hs = { sdt: '0912000401' };
  const r1 = await nop(hs);
  ok('Hồ sơ đầu ghi được', !r1.loi, moTa(r1));
  // 23:59 hôm qua (giờ VN) gửi, mạng chập, 00:01 hôm nay gửi lại: ngày nộp đã khác, nhưng mới 2 phút.
  await db.query(`update ho_so_ung_tuyen set ngay_nop = hom_nay_vn() - 1, created_at = now() - interval '2 minutes' where ma_ho_so = $1`, [r1.ma]);
  const r2 = await nop(hs);
  ok('Nộp 23:59 hôm qua, gửi lại 00:01 hôm nay → nhận mã cũ, không thêm dòng', r2.ma === r1.ma && (await soDong(hs.sdt)) === 1, moTa(r2));
  await db.query(`update ho_so_ung_tuyen set created_at = now() - interval '11 minutes' where ma_ho_so = $1`, [r1.ma]);
  const r3 = await nop(hs);
  ok('Hồ sơ hôm qua, 11 phút trước → hồ sơ MỚI hôm nay (như trước 0081: mỗi ngày một hồ sơ)',
     !r3.loi && r3.ma !== r1.ma && (await soDong(hs.sdt)) === 2, moTa(r3));

  const cung = { sdt: '0912000402' };
  const c1 = await nop(cung);
  await db.query(`update ho_so_ung_tuyen set created_at = now() - interval '5 hours' where ma_ho_so = $1`, [c1.ma]);
  const c2 = await nop(cung);
  ok('Cùng ngày nộp, 5 giờ sau gửi lại y hệt → nhận mã cũ (trước 0081: 23505 "chưa ghi nhận")', c2.ma === c1.ma, moTa(c2));

  await db.exec(`set timezone to 'Pacific/Kiritimati'`);   // UTC+14
  let c3;
  try { c3 = await nop(cung); } finally { await db.exec(`reset timezone`); }
  ok('Gửi lại dưới múi giờ phiên UTC+14 → vẫn cùng mã (ngày nộp theo hom_nay_vn())', c3.ma === c1.ma && (await soDong(cung.sdt)) === 1, moTa(c3));
});

// ===========================================================================
await nhom('5 · CV — kèm CV chỉ khớp hồ sơ đã có CV; không bao giờ gắn file vào hồ sơ cũ', async () => {
  const coCv = { viTri: 'quan-ly-cua-hang', sdt: '0912000501' };
  const ve1 = await xinVe();
  const r1 = await nop({ ...coCv, ve: ve1, tep: 'CV-Tran-Thi-Binh.pdf' });
  const cvGoc = (await mot(`select duong_dan_cv from ho_so_ung_tuyen where ma_ho_so = $1`, [r1.ma])).duong_dan_cv;
  ok('Hồ sơ đầu kèm CV ghi được', !r1.loi && cvGoc === `ho-so-ung-tuyen/${ve1}/CV-Tran-Thi-Binh.pdf`, `${moTa(r1)} · ${cvGoc}`);
  const ve2 = await xinVe();
  const r2 = await nop({ ...coCv, ve: ve2, tep: 'CV-lan-hai.pdf' });
  const sau2 = (await mot(`select duong_dan_cv from ho_so_ung_tuyen where ma_ho_so = $1`, [r1.ma])).duong_dan_cv;
  const dung2 = (await mot(`select da_dung from phieu_tai_len where id = $1`, [ve2])).da_dung;
  ok('Gửi lại kèm CV (vé mới) → cùng mã, CV cũ giữ nguyên, vé mới KHÔNG bị dùng (tự hết hạn)',
     r2.ma === r1.ma && sau2 === cvGoc && dung2 === false, `${moTa(r2)} · ${sau2} · da_dung ${dung2}`);
  const r3 = await nop(coCv);
  ok('Gửi lại KHÔNG kèm CV (lần này tải CV hỏng) → vẫn cùng mã, hồ sơ cũ còn CV', r3.ma === r1.ma
     && (await mot(`select duong_dan_cv from ho_so_ung_tuyen where ma_ho_so = $1`, [r1.ma])).duong_dan_cv === cvGoc, moTa(r3));
  ok('…vẫn một dòng', (await soDong(coCv.sdt)) === 1);

  const khongCv = { viTri: 'quan-ly-cua-hang', sdt: '0912000502', ten: 'Lê Thị Hoa' };
  const k1 = await nop(khongCv);
  const ve3 = await xinVe();
  const k2 = await nop({ ...khongCv, ve: ve3, tep: 'file-cua-nguoi-la.pdf' });
  const sauK = (await mot(`select duong_dan_cv from ho_so_ung_tuyen where ma_ho_so = $1`, [k1.ma])).duong_dan_cv;
  const dung3 = (await mot(`select da_dung from phieu_tai_len where id = $1`, [ve3])).da_dung;
  ok('Hồ sơ cũ CHƯA có CV, lần gửi lại (hay người lạ biết tên + số điện thoại) kèm file → KHÔNG nhận mã, KHÔNG gắn file vào hồ sơ, vé không bị dùng',
     !!k1.ma && k2.ma !== k1.ma && !JSON.stringify(k2).includes(k1.ma) && sauK === null && dung3 === false && (await soDong(khongCv.sdt)) === 1,
     `${moTa(k2)} · ${sauK} · da_dung ${dung3}`);

  const hetHan = { viTri: 'quan-ly-cua-hang', sdt: '0912000503' };
  const ve4 = await xinVe();
  const h1 = await nop({ ...hetHan, ve: ve4, tep: 'cv.pdf' });
  const ve5 = await xinVe();
  await db.query(`update phieu_tai_len set het_han = now() - interval '1 minute' where id = $1`, [ve5]);
  const h2 = await nop({ ...hetHan, ve: ve5, tep: 'cv.pdf' });
  ok('Vé của lần gửi lại đã hết hạn, hồ sơ cũ có CV → vẫn nhận mã cũ (hồ sơ ĐÃ vào), không "phiếu hết hạn"', !h1.loi && h2.ma === h1.ma, moTa(h2));
});

// ===========================================================================
await nhom('6 · ĐÃ ĐỦ 5 HỒ SƠ / IP / GIỜ, TIN VỪA HẾT HẠN — gửi lại vẫn nhận mã cũ', async () => {
  const ip = '203.0.113.64';
  const ma = [];
  for (let i = 0; i < 5; i++) ma.push(await nop({ sdt: `091200060${i}`, ip }));
  ok('Năm hồ sơ từ một IP ghi được', ma.every(r => !r.loi), ma.map(moTa).join(' · '));
  const lai = await nop({ sdt: '0912000604', ip });
  ok('Gửi lại y hệt hồ sơ thứ năm từ cùng IP → nhận mã cũ, không "nộp quá nhiều"', lai.ma === ma[4].ma, moTa(lai));
  const moi = await nop({ sdt: '0912000605', ip });
  ok('Hồ sơ MỚI thứ sáu từ IP đó → vẫn câu cũ "Bạn đã nộp quá nhiều hồ sơ…"',
     /^Bạn đã nộp quá nhiều hồ sơ, vui lòng liên hệ trực tiếp với nhà hàng$/.test(moi.loi ?? ''), moTa(moi));

  const hs = { sdt: '0912000610', viTri: 'nhan-vien-bep' };
  const d = await nop(hs);
  await db.query(`update vi_tri_tuyen_dung set han_nop = hom_nay_vn() - 1 where ma = 'nhan-vien-bep'`);
  try {
    const d2 = await nop(hs);
    ok('Tin vừa hết hạn sau lần nộp đầu → gửi lại nhận mã cũ (hồ sơ ĐÃ vào), không "đã hết hạn"', d2.ma === d.ma, moTa(d2));
    const khac = await nop({ ...hs, sdt: '0912000611' });
    ok('Ứng viên MỚI cho tin hết hạn → vẫn câu cũ "Vị trí này đã hết hạn nhận hồ sơ"', khac.loi?.includes('Vị trí này đã hết hạn nhận hồ sơ'), moTa(khac));
  } finally {
    await db.query(`update vi_tri_tuyen_dung set han_nop = null where ma = 'nhan-vien-bep'`);
  }
});

// ===========================================================================
await nhom('7 · QUYỀN VÀ BẪY BOT — phiên đăng nhập không lấy được mã; bot vẫn bị chặn', async () => {
  const hs = { sdt: '0912000701', ten: 'Ứng Viên Bí Mật', gioiThieu: 'Nội dung riêng' };
  const ung = await nop(hs);
  ok('Ứng viên nộp qua website (anon)', !ung.loi, moTa(ung));
  for (const [ten, uid] of [
    ['Marketing', UID.mktA], ['Thủ kho', UID.thuKhoA], ['Kế toán', UID.keToanA],
    ['Nhân sự đã nghỉ', UID.nghiViec], ['Tài khoản không có dòng nhan_su', UID_LA],
  ]) {
    const r = await nop(hs, uid);
    ok(`${ten} gửi đúng nội dung hồ sơ của ứng viên → không thấy mã`, !JSON.stringify(r).includes(ung.ma), moTa(r));
  }
  ok('…không dòng nào được thêm', (await soDong(hs.sdt)) === 1);

  const bot = await nop({ ...hs, bay: 'http://spam.example' });
  ok('Bẫy bot có chữ → câu chung cũ, không trả mã dù nội dung y hệt',
     bot.loi?.includes('Không gửi được hồ sơ, vui lòng thử lại') && !JSON.stringify(bot).includes(ung.ma), moTa(bot));
  const nhanh = await nop({ ...hs, giay: 1 });
  ok('Điền form 1 giây → câu chung cũ, không trả mã', nhanh.loi?.includes('Không gửi được hồ sơ, vui lòng thử lại'), moTa(nhanh));

  // Giá trị đã công bố không sửa tại chỗ được (0010): thu hồi, rồi công bố một dòng mới.
  await db.query(`select thu_hoi_noi_dung('hien_tuyen_dung')`);
  try {
    const dong = await nop(hs);
    ok('Cổng tuyển dụng đóng → vẫn câu cũ "Cổng tuyển dụng đang tạm đóng"', dong.loi?.includes('Cổng tuyển dụng đang tạm đóng'), moTa(dong));
  } finally {
    await db.query(`insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai)
                    values ('hien_tuyen_dung', 'bool', true, 'da_cong_bo')`);
  }
});

// ===========================================================================
await nhom('8 · MẤT MẠNG GIỮA CHỪNG — không dòng nửa vời, gửi lại ra đúng một dòng', async () => {
  const hs = { sdt: '0912000801' };
  await db.exec('begin');
  let dut;
  try { dut = await nop(hs); } finally { await db.exec('rollback'); }
  ok('Giao dịch đầu bị hủy giữa chừng → không để lại dòng nào', !dut.loi && (await soDong(hs.sdt)) === 0, moTa(dut));
  const sau = await nop(hs);
  ok('…gửi lại → đúng MỘT dòng, mã mới (không trả mã của giao dịch đã hủy)',
     !sau.loi && sau.ma !== dut.ma && (await soDong(hs.sdt)) === 1, moTa(sau));
  const sau2 = await nop(hs);
  ok('…và lần gửi tiếp theo nhận đúng mã đó', sau2.ma === sau.ma, moTa(sau2));
});

process.exit(ketThuc('NỘP HỒ SƠ HAI LẦN'));
