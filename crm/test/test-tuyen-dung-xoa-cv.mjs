/**
 * BEEFTOWN — XÓA FILE CV KHI ẨN DANH, QUÉT CV MỒ CÔI (0074)
 * ==========================================================
 *
 *     node test/test-tuyen-dung-xoa-cv.mjs
 *
 * LỖI (rà soát nợ kỹ thuật 11/10/2026)
 *
 * Trang quyền riêng tư (vi / en / ko) hứa: hồ sơ ứng tuyển giữ sáu tháng, sau đó họ tên, số điện thoại,
 * email, địa chỉ IP VÀ FILE CV bị xóa. Nút "Ẩn danh hồ sơ đã quá hạn lưu" ở /noi-bo/cai-dat chạy
 * don_dep_ho_so_het_han() (0012) — hàm đó chỉ đặt duong_dan_cv = null. File trong kho ho-so-ung-tuyen
 * ở lại mãi, và từ lúc đó không còn gì trỏ tới nó.
 *
 * Cùng gốc: nopHoSo (lib/nop-ho-so.ts) tải CV TRƯỚC khi gọi nop_ho_so_ung_tuyen — hàm đó có thể từ chối
 * (bẫy bot, quá 5 lần/giờ/IP, số điện thoại sai, trùng trong ngày) và file thì đã nằm trong kho. Vé tải
 * CV là dấu vết duy nhất của thư mục đó, và don_dep_phieu_tai_len() xóa vé.
 *
 * SỬA (0074 + lib/xoa-cv.ts)
 *
 *   · Đọc đường dẫn CV sắp ẩn danh (ho_so_cv_het_han) → xóa trong kho (bỏ tiền tố "ho-so-ung-tuyen/")
 *     → kiểm lại file đã thật sự không còn → rồi mới ẩn danh, và CHỈ ẩn danh hồ sơ không CV hoặc có
 *     CV đã chắc chắn xóa (an_danh_ho_so_het_han). Hồ sơ còn file thì giữ nguyên cho lần bấm sau.
 *     don_dep_ho_so_het_han() cũ (SQL Editor, web chưa deploy) chỉ còn ẩn danh hồ sơ không có CV.
 *   · Dọn vé: liệt kê thư mục của kho CV → database chỉ ra thư mục nào mồ côi
 *     (ho_so_thu_muc_cv_mo_coi: không hồ sơ nào trỏ tới, vé không còn hiệu lực) → xóa file trong đó →
 *     kho sạch rồi mới xóa vé. Quét theo KHO, không theo vé: CV mồ côi mà vé đã bị xóa từ trước vẫn tìm ra.
 *   · nopHoSo không tải CV khi chính form đã chắc chắn bị database từ chối (bẫy bot, điền dưới 3 giây).
 *
 * Phép thử, theo mục "xong" của CLAUDE.md:
 *   1–5  database: tái hiện, quyền (anon / vai khác / người nghỉ / không nhan_su), giờ VN 23:50 và 00:10,
 *        bấm hai lần, thư mục nào là mồ côi, số liệu đèn "Dọn dữ liệu cá nhân".
 *   6–9  web với kho file GIẢ và database thật (PGlite): từng kiểu hỏng — mạng đứt trước khi xóa, xóa xong
 *        mất trả lời, RLS chặn im lặng, đứt giữa xóa file và ẩn danh, database ghi xong mất trả lời.
 *        Không bao giờ nói "đã xóa" / "đã ẩn danh" khi chưa chắc.
 *   10   supabase-js THẬT với fetch giả: hình dạng lỗi của Storage và PostgREST đúng như mã đang giả định.
 *   11   nopHoSo: bẫy bot không để lại file trong kho.
 *   13   (rà soát bảo mật) policy ho_so_sua cho quản lý sửa MỌI cột hồ sơ của chi nhánh mình: sửa đường dẫn CV / hạn lưu
 *        thì nút ẩn danh của chủ xóa giùm file của người khác. Ba cột đó chỉ đổi được qua hàm definer.
 *
 * Chính sách Storage (ai xóa / đọc được kho CV) PGlite không có — bước thử tay trên project Beeftown-thu
 * ghi ở cuối migration 0074 và trong mô tả PR.
 */

import { join, dirname } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';
import { VIET } from './quet-chu-viet.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIB = join(GOC, 'web', 'src', 'lib');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — XÓA FILE CV KHI ẨN DANH, QUÉT CV MỒ CÔI');
const { db, cnA, nsId, duoi, duoiAnon } = await dungDatabase();

// Tài khoản đăng nhập mà không có dòng nhan_su.
const UID_LA = '00000000-0000-4000-8000-0000000000ee';

// Cổng tuyển dụng mở, tin "quản lý sảnh" (tin mẫu có hỏi CV) đã đăng.
await db.query(`select tao_tin_tuyen_dung_mau($1)`, [cnA.id]);
await db.query(`insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai)
                values ('hien_tuyen_dung', 'bool', true, 'da_cong_bo')`);
await db.query(`update vi_tri_tuyen_dung
                set mo_ta_vi = 'Điều phối sảnh, xếp ca, chăm khách trong giờ cao điểm.',
                    yeu_cau_vi = 'Đã quản lý sảnh nhà hàng ít nhất một năm.',
                    ca_lam = 'Ca tối 16:00–22:00', trang_thai = 'da_cong_bo'
                where ma = 'quan-ly-sanh'`);

const VI_TRI = 'quan-ly-sanh';
let soDt = 912000100;

/** Nộp một hồ sơ như website (anon), có hoặc không CV, rồi đặt luu_den = hôm nay (giờ VN) - quaHan ngày. */
async function taoHoSo(hoTen, { cv = false, ten = 'cv.pdf', quaHan = null } = {}) {
  let ve = null;
  if (cv) {
    const r = await duoiAnon(`select xin_phieu_tai_cv(null) as id`);
    if (r.loi) throw new Error(`xin_phieu_tai_cv: ${r.loi}`);
    ve = r.rows[0].id;
  }
  const sdt = '0' + String(soDt++);
  const r = await duoiAnon(
    `select nop_ho_so_ung_tuyen($1, $2, $3, null, null, null, null, null::text[],
       $4::uuid, $5, true, null, 30, null, null, null::inet) as ma`,
    [VI_TRI, hoTen, sdt, ve, cv ? ten : null]);
  if (r.loi) throw new Error(`nop_ho_so_ung_tuyen: ${r.loi}`);
  const ma = r.rows[0].ma;
  // 0079 giới hạn nộp hồ sơ (5 / giờ / IP — IP null đếm như một IP — và 30 / giờ toàn cục) và xin vé
  // (10 / giờ / IP, 30 / giờ toàn cục). File này dựng hơn 40 hồ sơ mẫu trong vài giây — đúng điều 0079
  // chặn — nên hồ sơ mẫu coi như nộp trước giờ chạy: dời created_at của hồ sơ và vé ra ngoài cửa sổ
  // một giờ. Không đụng luu_den / het_han (thứ file này kiểm: hạn lưu, vé còn hiệu lực); vẫn dưới hai
  // ngày nên số liệu hồ sơ mới của bảng sức khỏe không đổi. Giới hạn tự nó kiểm ở
  // test-cong-khai-gioi-han.mjs; nopHoSo của web ở mục 11 vẫn đi qua giới hạn thật.
  await db.query(`update ho_so_ung_tuyen set created_at = now() - interval '61 minutes' where ma_ho_so = $1`, [ma]);
  if (ve) await db.query(`update phieu_tai_len set created_at = now() - interval '61 minutes' where id = $1`, [ve]);
  if (quaHan !== null) {
    await db.query(`update ho_so_ung_tuyen set luu_den = hom_nay_vn() - $2::int where ma_ho_so = $1`, [ma, quaHan]);
  }
  const { rows: [h] } = await db.query(`select id, duong_dan_cv from ho_so_ung_tuyen where ma_ho_so = $1`, [ma]);
  return { ma, id: h.id, sdt, duongDan: h.duong_dan_cv, ve, khoa: ve ? `${ve}/${ten}` : null };
}

/** Một dòng hồ sơ, đọc bằng superuser. */
async function hoSo(ma) {
  return (await db.query(`select ho_ten, sdt, duong_dan_cv, da_an_danh from ho_so_ung_tuyen where ma_ho_so = $1`, [ma])).rows[0];
}
const daAnDanh = async ma => (await hoSo(ma))?.da_an_danh === true;

/** Vé tải CV với hạn tùy ý (giờ so với now()), bằng superuser. */
async function taoVe(gioHetHan, daDung = false) {
  const { rows: [r] } = await db.query(
    `insert into phieu_tai_len (het_han, da_dung) values (now() + $1::float8 * interval '1 hour', $2) returning id::text as id`,
    [gioHetHan, daDung]);
  return r.id;
}

/** Bắt đầu một nhóm từ trạng thái sạch: không hồ sơ nào quá hạn, không vé nào. */
async function donSach() {
  await db.query(`update ho_so_ung_tuyen set luu_den = hom_nay_vn() + 180 where not da_an_danh`);
  await db.query(`delete from phieu_tai_len`);
}

/** Chạy một hàm SQL dưới danh nghĩa một người: { kq, loi, ma }. */
async function goi(uid, sql, thamSo = []) {
  const r = await duoi(uid, sql, thamSo);
  return { kq: r.rows?.[0]?.kq, loi: r.loi, ma: r.ma };
}

const NGUOI_BI_TU_CHOI = [
  ['Quản lý Q1', UID.qlA], ['Thu ngân Q1', UID.thuNganA], ['Marketing Q1', UID.mktA],
  ['Thủ kho Q1', UID.thuKhoA], ['Người đã nghỉ', UID.nghiViec], ['Tài khoản không có dòng nhan_su', UID_LA],
];

// ===========================================================================
await nhom('1 · TÁI HIỆN — ẩn danh làm file CV mồ côi', async () => {
  await donSach();
  const coCv = await taoHoSo('Nguyễn Văn Có CV', { cv: true, quaHan: 1 });
  const khongCv = await taoHoSo('Trần Thị Không CV', { quaHan: 1 });
  ok('(Hồ sơ có CV lưu đường dẫn kèm tên kho: ho-so-ung-tuyen/<vé>/cv.pdf)',
     coCv.duongDan === `ho-so-ung-tuyen/${coCv.khoa}`, coCv.duongDan);

  // Đúng cách nút cũ ở /noi-bo/cai-dat gọi: rpc('don_dep_ho_so_het_han') dưới danh nghĩa chủ.
  const r = await goi(UID.chu, `select don_dep_ho_so_het_han() as kq`);
  const sau = await hoSo(coCv.ma);
  ok('TÁI HIỆN: don_dep_ho_so_het_han() KHÔNG được xóa đường dẫn của hồ sơ còn file CV — ai chưa xóa file thì database còn phải giữ dấu vết của nó',
     r.loi === null && sau.duong_dan_cv === coCv.duongDan && sau.da_an_danh === false && sau.ho_ten === 'Nguyễn Văn Có CV',
     r.loi ?? JSON.stringify(sau));
  ok('…hồ sơ KHÔNG có CV vẫn được ẩn danh như trước (đếm 1)', r.loi === null && Number(r.kq) === 1 && await daAnDanh(khongCv.ma),
     r.loi ?? `trả ${r.kq}`);
});

// ===========================================================================
await nhom('2 · ho_so_cv_het_han() — đọc đúng danh sách CV sắp ẩn danh', async () => {
  await donSach();
  const a = await taoHoSo('Quá Hạn Một', { cv: true, quaHan: 1 });
  const b = await taoHoSo('Quá Hạn Hai', { cv: true, ten: 'CV-Le-Van-B.pdf', quaHan: 30 });
  const homNay = await taoHoSo('Hết Hạn Hôm Nay', { cv: true, quaHan: 0 });
  const conHan = await taoHoSo('Còn Hạn', { cv: true });
  const khongCv = await taoHoSo('Không File', { quaHan: 5 });

  const r = await goi(UID.chu, `select ho_so_cv_het_han() as kq`);
  const ds = Array.isArray(r.kq) ? [...r.kq].sort() : r.kq;
  ok('Chủ đọc được: đúng hai đường dẫn quá hạn, nguyên dạng cột duong_dan_cv',
     r.loi === null && JSON.stringify(ds) === JSON.stringify([a.duongDan, b.duongDan].sort()), r.loi ?? JSON.stringify(r.kq));
  ok('luu_den = hôm nay (giờ VN) là ngày cuối còn giữ — chưa nằm trong danh sách', !r.kq?.includes(homNay.duongDan));
  ok('Hồ sơ còn hạn và hồ sơ không có CV không nằm trong danh sách',
     !r.kq?.includes(conHan.duongDan) && !r.kq?.includes(null) && !r.kq?.includes(khongCv.duongDan));

  for (const [ai, uid] of NGUOI_BI_TU_CHOI) {
    const x = await goi(uid, `select ho_so_cv_het_han() as kq`);
    ok(`${ai} → bị từ chối, không thấy đường dẫn nào`,
       x.loi !== null && /Chỉ chủ sở hữu mới chạy được việc dọn hồ sơ hết hạn/.test(x.loi) && x.kq === undefined, x.loi ?? JSON.stringify(x.kq));
  }
  const anon = await duoiAnon(`select ho_so_cv_het_han() as kq`);
  ok('anon → không có quyền gọi', anon.loi !== null && /permission denied/i.test(anon.loi), anon.loi ?? 'GỌI ĐƯỢC');

  await goi(UID.chu, `select an_danh_ho_so_het_han($1::text[]) as kq`, [[a.duongDan]]);
  const sau = await goi(UID.chu, `select ho_so_cv_het_han() as kq`);
  ok('Hồ sơ đã ẩn danh không còn trong danh sách', JSON.stringify(sau.kq) === JSON.stringify([b.duongDan]), JSON.stringify(sau.kq));
});

// ===========================================================================
await nhom('3 · an_danh_ho_so_het_han(p_cv_da_xoa) — chỉ ẩn danh hồ sơ đã hết file', async () => {
  await donSach();
  const daXoa = await taoHoSo('Đã Xóa File', { cv: true, quaHan: 2 });
  const chuaXoa = await taoHoSo('Chưa Xóa File', { cv: true, quaHan: 2 });
  const khongCv = await taoHoSo('Không Có File', { quaHan: 2 });
  const conHan = await taoHoSo('Còn Hạn Mà Lọt Danh Sách', { cv: true });

  for (const [ai, uid] of NGUOI_BI_TU_CHOI) {
    const x = await goi(uid, `select an_danh_ho_so_het_han($1::text[]) as kq`, [[daXoa.duongDan]]);
    ok(`${ai} → bị từ chối`, x.loi !== null && /Chỉ chủ sở hữu mới chạy được việc dọn hồ sơ hết hạn/.test(x.loi), x.loi ?? `trả ${x.kq}`);
  }
  const anon = await duoiAnon(`select an_danh_ho_so_het_han(array[]::text[]) as kq`);
  ok('anon → không có quyền gọi', anon.loi !== null && /permission denied/i.test(anon.loi), anon.loi ?? 'GỌI ĐƯỢC');
  ok('Bị từ chối thì không hồ sơ nào bị đụng', !(await daAnDanh(daXoa.ma)) && !(await daAnDanh(khongCv.ma)));

  const r = await goi(UID.chu, `select an_danh_ho_so_het_han($1::text[]) as kq`, [[daXoa.duongDan, conHan.duongDan]]);
  ok('Chủ: ẩn danh 2 — hồ sơ có CV đã xóa và hồ sơ không có CV', r.loi === null && Number(r.kq) === 2, r.loi ?? `trả ${r.kq}`);
  const x = await hoSo(daXoa.ma), y = await hoSo(chuaXoa.ma), z = await hoSo(conHan.ma);
  ok('Hồ sơ có CV đã xóa: sạch họ tên, số điện thoại, đường dẫn', x.da_an_danh && x.ho_ten === null && x.sdt === null && x.duong_dan_cv === null,
     JSON.stringify(x));
  ok('Hồ sơ có CV CHƯA xóa: còn nguyên họ tên, số điện thoại và đường dẫn (lần bấm sau làm tiếp)',
     !y.da_an_danh && y.ho_ten === 'Chưa Xóa File' && y.duong_dan_cv === chuaXoa.duongDan, JSON.stringify(y));
  ok('Đường dẫn của hồ sơ CÒN HẠN lọt vào danh sách cũng không làm nó bị ẩn danh', !z.da_an_danh && z.ho_ten !== null);

  const lan2 = await goi(UID.chu, `select an_danh_ho_so_het_han($1::text[]) as kq`, [[daXoa.duongDan]]);
  ok('Bấm hai lần: lần sau đếm 0, không đụng hồ sơ nào nữa', lan2.loi === null && Number(lan2.kq) === 0, lan2.loi ?? `trả ${lan2.kq}`);
  const rong = await goi(UID.chu, `select an_danh_ho_so_het_han(null) as kq`);
  ok('Danh sách null = không file nào đã xóa: hồ sơ có CV vẫn giữ', rong.loi === null && Number(rong.kq) === 0 && !(await daAnDanh(chuaXoa.ma)),
     rong.loi ?? `trả ${rong.kq}`);
});

// ===========================================================================
await nhom('4 · GIỜ VIỆT NAM — 23:50 và 00:10 (hom_nay_vn giả)', async () => {
  // PGlite không cho đặt giờ database. Thay hom_nay_vn() bằng một ngày cố định là đủ: hàm đọc / ẩn danh
  // phải dựa vào ngày Việt Nam, không phải ngày UTC (kiem-migration.mjs đã chặn chữ current_date).
  await donSach();
  const homQua = await taoHoSo('Hết Hạn 03/10', { cv: true });
  const homNay = await taoHoSo('Hết Hạn 04/10', { cv: true });
  await db.query(`update ho_so_ung_tuyen set luu_den = '2026-10-03' where ma_ho_so = $1`, [homQua.ma]);
  await db.query(`update ho_so_ung_tuyen set luu_den = '2026-10-04' where ma_ho_so = $1`, [homNay.ma]);
  const { rows: [{ src }] } = await db.query(`select prosrc as src from pg_proc where proname = 'hom_nay_vn'`);
  const datNgay = d => db.exec(`create or replace function hom_nay_vn() returns date language sql stable as $$ select '${d}'::date $$`);
  try {
    await datNgay('2026-10-04');   // 00:10 ngày 04/10 giờ VN = 17:10Z ngày 03/10
    const ds0010 = (await goi(UID.chu, `select ho_so_cv_het_han() as kq`)).kq ?? [];
    ok('00:10 ngày 04/10 giờ VN: hồ sơ lưu đến 03/10 đã quá hạn (theo UTC vẫn là 03/10)',
       ds0010.includes(homQua.duongDan) && !ds0010.includes(homNay.duongDan), JSON.stringify(ds0010));
    await datNgay('2026-10-03');   // 23:50 ngày 03/10 giờ VN
    const ds2350 = (await goi(UID.chu, `select ho_so_cv_het_han() as kq`)).kq ?? [];
    ok('23:50 ngày 03/10 giờ VN: hồ sơ lưu đến 03/10 vẫn còn hạn', !ds2350.includes(homQua.duongDan), JSON.stringify(ds2350));
    const r = await goi(UID.chu, `select an_danh_ho_so_het_han($1::text[]) as kq`, [[homQua.duongDan]]);
    ok('23:50: ẩn danh cũng chưa đụng hồ sơ lưu đến 03/10', r.loi === null && !(await daAnDanh(homQua.ma)), r.loi ?? '');
  } finally {
    await db.exec(`create or replace function hom_nay_vn() returns date language sql stable as $$${src}$$`);
  }
  await db.query(`update ho_so_ung_tuyen set luu_den = hom_nay_vn() + 180 where ma_ho_so = any($1)`, [[homQua.ma, homNay.ma]]);
});

// ===========================================================================
await nhom('5 · ho_so_thu_muc_cv_mo_coi(p_thu_muc) — thư mục nào trong kho là mồ côi', async () => {
  await donSach();
  const veSong = await taoVe(0.25);                   // vé vừa xin, còn 15 phút
  const veVuaHet = await taoVe(-12);                  // hết hạn 12 giờ — chưa quá một ngày, chưa đụng
  const veHetHan = await taoVe(-48);                  // hết hạn 2 ngày, chưa dùng = lượt nộp bị từ chối
  const coHoSo = await taoHoSo('Hồ Sơ Còn Giữ', { cv: true });
  const daAn = await taoHoSo('Hồ Sơ Đã Ẩn Danh', { cv: true, quaHan: 3 });
  await goi(UID.chu, `select an_danh_ho_so_het_han($1::text[]) as kq`, [[daAn.duongDan]]);
  await db.query(`update phieu_tai_len set het_han = now() - interval '3 days'`);   // vé của hai hồ sơ trên đã cũ
  await db.query(`update phieu_tai_len set het_han = now() + interval '15 minutes' where id::text = $1`, [veSong]);
  await db.query(`update phieu_tai_len set het_han = now() - interval '12 hours' where id::text = $1`, [veVuaHet]);
  const khongVe = '7f1d2c3b-4a5e-4f60-8172-839405a6b7c8';     // thư mục mà vé đã bị xóa từ lâu
  const DAU_VAO = [veSong, veVuaHet, veHetHan, coHoSo.ve, daAn.ve, khongVe, 'khong-phai-uuid', khongVe, ''];

  const r = await goi(UID.chu, `select ho_so_thu_muc_cv_mo_coi($1::text[]) as kq`, [DAU_VAO]);
  const ds = Array.isArray(r.kq) ? [...r.kq].sort() : r.kq;
  ok('Chủ: mồ côi = vé hết hạn chưa dùng, hồ sơ đã ẩn danh, thư mục không còn vé — mỗi thư mục một lần',
     r.loi === null && JSON.stringify(ds) === JSON.stringify([veHetHan, daAn.ve, khongVe].sort()), r.loi ?? JSON.stringify(r.kq));
  ok('Vé còn hạn và vé hết hạn chưa quá một ngày KHÔNG mồ côi (người nộp có thể đang bấm gửi)',
     !r.kq?.includes(veSong) && !r.kq?.includes(veVuaHet));
  ok('Thư mục hồ sơ chưa ẩn danh trỏ tới KHÔNG mồ côi, dù vé đã cũ', !r.kq?.includes(coHoSo.ve));
  ok('Tên không phải mã vé thì không bao giờ là mồ côi (không xóa thứ không hiểu)', !r.kq?.includes('khong-phai-uuid') && !r.kq?.includes(''));

  const ql = await goi(UID.qlA, `select ho_so_thu_muc_cv_mo_coi($1::text[]) as kq`, [DAU_VAO]);
  ok('Quản lý cũng hỏi được (quản lý dọn được vé — 0065)', ql.loi === null && ql.kq?.length === 3, ql.loi ?? JSON.stringify(ql.kq));
  for (const [ai, uid] of NGUOI_BI_TU_CHOI.filter(([, u]) => u !== UID.qlA)) {
    const x = await goi(uid, `select ho_so_thu_muc_cv_mo_coi($1::text[]) as kq`, [DAU_VAO]);
    ok(`${ai} → bị từ chối`, x.loi !== null && /Chỉ chủ sở hữu hoặc quản lý mới dọn được vé tải CV/.test(x.loi), x.loi ?? JSON.stringify(x.kq));
  }
  const anon = await duoiAnon(`select ho_so_thu_muc_cv_mo_coi(array['x']) as kq`);
  ok('anon → không có quyền gọi', anon.loi !== null && /permission denied/i.test(anon.loi), anon.loi ?? 'GỌI ĐƯỢC');

  await goi(UID.chu, `select don_dep_phieu_tai_len() as kq`);
  const sauDonVe = await goi(UID.chu, `select ho_so_thu_muc_cv_mo_coi($1::text[]) as kq`, [DAU_VAO]);
  ok('Sau khi dọn vé: thư mục hồ sơ còn giữ vẫn không mồ côi; vé còn hạn vẫn giữ',
     !sauDonVe.kq?.includes(coHoSo.ve) && !sauDonVe.kq?.includes(veSong) && sauDonVe.kq?.includes(veHetHan), JSON.stringify(sauDonVe.kq));
  const rong = await goi(UID.chu, `select ho_so_thu_muc_cv_mo_coi(array[]::text[]) as kq`);
  ok('Danh sách rỗng → mảng rỗng (không null)', rong.loi === null && Array.isArray(rong.kq) && rong.kq.length === 0, JSON.stringify(rong.kq));
});

// ===========================================================================
await nhom('5b · ĐÈN "DỌN DỮ LIỆU CÁ NHÂN" — số liệu trong suc_khoe_he_thong()', async () => {
  await donSach();
  await db.query(`delete from su_kien_web`);
  const dem = async () => (await goi(UID.chu, `select suc_khoe_he_thong() as kq`)).kq?.don_dep;
  let d = await dem();
  ok('Database sạch: mọi số bằng 0', d?.ho_so_qua_han === 0 && d?.ho_so_qua_han_7_ngay === 0 && d?.ve_qua_han === 0
     && d?.su_kien_qua_han === false, JSON.stringify(d));

  await taoHoSo('Quá Hạn Hôm Qua', { quaHan: 1 });
  await taoHoSo('Quá Hạn Đúng 7 Ngày', { quaHan: 7 });
  await taoHoSo('Quá Hạn 8 Ngày', { cv: true, quaHan: 8 });
  await taoHoSo('Hết Hạn Hôm Nay', { quaHan: 0 });
  await taoVe(-8 * 24);              // vé chưa dùng hết hạn 8 ngày → có thể còn CV mồ côi
  await taoVe(-6 * 24);              // 6 ngày: chưa tính
  await taoVe(-30 * 24, true);       // vé đã dùng: hồ sơ trỏ tới, không phải mồ côi
  await db.query(`insert into su_kien_web (loai, trang, ngay) values ('mo_tuyen_dung', '/tuyen-dung', hom_nay_vn() - 96)`);
  d = await dem();
  ok('Hai nhóm hồ sơ không chồng nhau: quá hạn 1–7 ngày (2) · quá hạn hơn 7 ngày (1); hết hạn hôm nay chưa tính',
     d?.ho_so_qua_han === 2 && d?.ho_so_qua_han_7_ngay === 1, JSON.stringify(d));
  ok('Vé chưa dùng hết hạn quá 7 ngày: 1 (vé đã dùng và vé 6 ngày không tính)', d?.ve_qua_han === 1, JSON.stringify(d));
  ok('Dữ liệu đo lường 96 ngày: chưa tính (90 ngày + 7 ngày chờ bấm)', d?.su_kien_qua_han === false, JSON.stringify(d));
  await db.query(`insert into su_kien_web (loai, trang, ngay) values ('mo_tuyen_dung', '/tuyen-dung', hom_nay_vn() - 98)`);
  ok('Dữ liệu đo lường 98 ngày → có', (await dem())?.su_kien_qua_han === true);

  const ql = (await goi(UID.qlA, `select suc_khoe_he_thong() as kq`)).kq?.don_dep;
  ok('Quản lý thấy cùng số liệu (đèn của cả thương hiệu, chỉ là số đếm)', JSON.stringify(ql) === JSON.stringify(await dem()), JSON.stringify(ql));
  const s = JSON.stringify(await dem());
  ok('Không lộ dữ liệu cá nhân: không họ tên, số điện thoại, đường dẫn CV', !/Quá Hạn|09\d{8}|ho-so-ung-tuyen/.test(s), s);
  await db.query(`delete from su_kien_web`);
  await donSach();
});

// ===========================================================================
// WEB — kho file GIẢ, database THẬT (PGlite) dưới danh nghĩa chủ / quản lý.
// ===========================================================================
const KHO_CV = 'ho-so-ung-tuyen';

/**
 * Client giả: rpc chạy thẳng trên PGlite dưới danh nghĩa `uid` (đúng quyền thật); storage là một tập khóa
 * trong bộ nhớ, trả lời theo hình dạng của Supabase Storage (remove trả các dòng đã xóa; list trả một cấp,
 * thư mục có id null). `hong[buoc]`: kiểu hỏng cho từng bước ('rpc:<tên hàm>', 'remove', 'list', 'list:<tiền tố>'),
 * hoặc hàm (lần gọi thứ mấy) → kiểu hỏng.
 *   nem          — ném TypeError('fetch failed') trước khi làm gì
 *   loi          — trả { error } có status 502, không làm gì
 *   mat_tra_loi  — LÀM XONG rồi mới mất trả lời (trả error không mã)
 *   rong         — không lỗi, không dữ liệu
 *   la           — dữ liệu hình dạng lạ
 */
function taoClient({ uid = UID.chu, tep = new Set(), quyenXoa = true, hong = {} } = {}) {
  const goiDen = [];
  const dem = {};
  const kieu = buoc => {
    dem[buoc] = (dem[buoc] ?? 0) + 1;
    const h = hong[buoc];
    return typeof h === 'function' ? h(dem[buoc]) : h;
  };
  const LOI_MANG = { code: '', message: 'TypeError: fetch failed' };
  return {
    goiDen, tep,
    async rpc(ten, thamSo = {}) {
      goiDen.push(['rpc', ten, thamSo]);
      const h = kieu(`rpc:${ten}`);
      if (h === 'nem') throw new TypeError('fetch failed');
      if (h === 'loi') return { data: null, error: { code: '', message: '502 Bad Gateway' } };
      if (h === 'rong') return { data: null, error: null };
      if (h === 'la') return { data: { la: true }, error: null };
      const khoa = Object.keys(thamSo);
      const r = await duoi(uid, `select ${ten}(${khoa.map((k, i) => `${k} => $${i + 1}`).join(', ')}) as kq`,
                           khoa.map(k => thamSo[k]));
      if (h === 'mat_tra_loi') return { data: null, error: LOI_MANG };
      if (r.loi) return { data: null, error: { code: r.ma ?? 'XX000', message: r.loi } };
      return { data: r.rows[0].kq, error: null };
    },
    storage: {
      from(kho) {
        if (kho !== KHO_CV) throw new Error(`sai kho: ${kho}`);
        return {
          async remove(ds) {
            goiDen.push(['remove', [...ds]]);
            const h = kieu('remove');
            if (h === 'nem') throw new TypeError('fetch failed');
            if (h === 'loi') return { data: null, error: { message: 'Bad Gateway', status: 502, statusCode: '502' } };
            if (h === 'rong') return { data: null, error: null };
            if (h === 'la') return { data: { la: true }, error: null };
            const xoa = quyenXoa ? ds.filter(k => tep.has(k)) : [];   // RLS chặn: im lặng, không lỗi
            for (const k of xoa) tep.delete(k);
            if (h === 'mat_tra_loi') return { data: null, error: { message: 'fetch failed' } };
            return { data: xoa.map(name => ({ name, bucket_id: KHO_CV, id: `id-${name}` })), error: null };
          },
          async list(tienTo = '', tuyChon = {}) {
            goiDen.push(['list', tienTo, tuyChon]);
            const h = kieu('list') ?? kieu(`list:${tienTo}`);
            if (h === 'nem') throw new TypeError('fetch failed');
            if (h === 'loi') return { data: null, error: { message: 'Bad Gateway', status: 502, statusCode: '502' } };
            if (h === 'rong') return { data: null, error: null };
            if (h === 'la') return { data: { la: true }, error: null };
            const dau = tienTo ? `${tienTo}/` : '';
            const muc = new Map();
            for (const k of tep) {
              if (!k.startsWith(dau)) continue;
              const con = k.slice(dau.length);
              const [ten, ...sau] = con.split('/');
              muc.set(ten, sau.length > 0 ? { name: ten, id: null } : { name: ten, id: `id-${k}` });
            }
            let ds = [...muc.values()].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
            if (tuyChon.search) ds = ds.filter(m => m.name.toLowerCase().startsWith(String(tuyChon.search).toLowerCase()));
            const tu = tuyChon.offset ?? 0;
            return { data: ds.slice(tu, tu + (tuyChon.limit ?? 100)), error: null };
          },
        };
      },
    },
  };
}
const soLan = (c, loai, ten) => c.goiDen.filter(g => g[0] === loai && (ten === undefined || g[1] === ten)).length;
const DA_XOA = /Đã xóa \d+ file/;
const DA_AN_DANH = /Đã ẩn danh/;

const xoaCv = await import(join(LIB, 'xoa-cv.ts')).catch(e => ({ loiNap: e }));
const { anDanhHoSoHetHan, donCvMoCoiVaVe, xoaTrongKho, khoaTrongKho, THU_MUC_TOI_DA, NGAN_SACH_GOI } = xoaCv;
/** Số lời gọi ra ngoài (rpc, remove, list) client giả ghi được trong một lần chạy. */
async function demGoi(c, p) { const truoc = c.goiDen.length; const r = await p; return { r, goi: c.goiDen.length - truoc }; }
ok('Nạp được web/src/lib/xoa-cv.ts', !xoaCv.loiNap, xoaCv.loiNap?.message ?? '');

/** Ba hồ sơ quá hạn (hai có CV, một không) và kho chứa đúng hai file đó cộng một file của hồ sơ còn hạn. */
async function dungCanhAnDanh() {
  await donSach();
  const a = await taoHoSo('Ứng Viên A', { cv: true, quaHan: 3 });
  const b = await taoHoSo('Ứng Viên B', { cv: true, ten: 'CV-Tran-Thi-B.docx', quaHan: 10 });
  const c = await taoHoSo('Ứng Viên C', { quaHan: 3 });
  const conHan = await taoHoSo('Ứng Viên Còn Hạn', { cv: true });
  return { a, b, c, conHan, tep: new Set([a.khoa, b.khoa, conHan.khoa]) };
}

// ===========================================================================
await nhom('6 · khoaTrongKho — bỏ tiền tố tên kho, không đoán', async () => {
  ok('ho-so-ung-tuyen/<vé>/cv.pdf → <vé>/cv.pdf',
     khoaTrongKho('ho-so-ung-tuyen/7f1d2c3b-4a5e-4f60-8172-839405a6b7c8/cv.pdf') === '7f1d2c3b-4a5e-4f60-8172-839405a6b7c8/cv.pdf');
  ok('Tên file giữ nguyên từng ký tự (không bỏ dấu lần nữa, không đổi hoa thường)',
     khoaTrongKho('ho-so-ung-tuyen/7f1d2c3b-4a5e-4f60-8172-839405a6b7c8/CV-Nguyen-Van-A.PDF') === '7f1d2c3b-4a5e-4f60-8172-839405a6b7c8/CV-Nguyen-Van-A.PDF');
  ok('Sai tiền tố, thiếu mã vé, thiếu tên file, không phải chuỗi → null',
     [null, undefined, 42, '', 'ho-so-ung-tuyen/', 'kho-khac/7f1d2c3b-4a5e-4f60-8172-839405a6b7c8/cv.pdf',
      '7f1d2c3b-4a5e-4f60-8172-839405a6b7c8/cv.pdf', 'ho-so-ung-tuyen/abc/cv.pdf',
      'ho-so-ung-tuyen/7f1d2c3b-4a5e-4f60-8172-839405a6b7c8/', 'ho-so-ung-tuyen/7f1d2c3b-4a5e-4f60-8172-839405a6b7c8']
       .every(x => khoaTrongKho(x) === null));
});

// ===========================================================================
await nhom('7 · anDanhHoSoHetHan — xóa file trước, ẩn danh sau', async () => {
  // 7a · bình thường
  let k = await dungCanhAnDanh();
  let c = taoClient({ tep: k.tep });
  let r = await anDanhHoSoHetHan(c, 'vi');
  ok('Bình thường: xóa đúng hai file CV quá hạn, file của hồ sơ còn hạn ở lại',
     !k.tep.has(k.a.khoa) && !k.tep.has(k.b.khoa) && k.tep.has(k.conHan.khoa), JSON.stringify([...k.tep]));
  ok('…xóa bằng khóa trong kho (đã bỏ "ho-so-ung-tuyen/"), một lần gọi',
     c.goiDen.filter(g => g[0] === 'remove').map(g => g[1].sort().join()).join('|') === [k.a.khoa, k.b.khoa].sort().join(), JSON.stringify(c.goiDen));
  ok('…rồi mới ẩn danh: database nhận đường dẫn NGUYÊN DẠNG cột duong_dan_cv',
     (() => { const i = c.goiDen.findIndex(g => g[1] === 'an_danh_ho_so_het_han');
              return i > c.goiDen.findIndex(g => g[0] === 'remove')
                && [...c.goiDen[i][2].p_cv_da_xoa].sort().join() === [k.a.duongDan, k.b.duongDan].sort().join(); })(),
     JSON.stringify(c.goiDen));
  ok('…ba hồ sơ đã ẩn danh, hồ sơ còn hạn giữ nguyên',
     await daAnDanh(k.a.ma) && await daAnDanh(k.b.ma) && await daAnDanh(k.c.ma) && !(await daAnDanh(k.conHan.ma)));
  ok('…câu: đã ẩn danh 3 hồ sơ, đã xóa 2 file CV', r.ok === true && /Đã ẩn danh 3 hồ sơ/.test(r.cau) && /Đã xóa 2 file CV/.test(r.cau), r.cau);
  r = await anDanhHoSoHetHan(c, 'vi');
  ok('Bấm lại khi không còn gì: "không có hồ sơ nào quá hạn lưu", không gọi kho file',
     r.ok === true && /không có hồ sơ nào quá hạn lưu/.test(r.cau) && soLan(c, 'remove') === 1, r.cau);

  // 7b · không đọc được danh sách
  for (const h of ['nem', 'loi', 'rong', 'la']) {
    k = await dungCanhAnDanh();
    c = taoClient({ tep: k.tep, hong: { 'rpc:ho_so_cv_het_han': h } });
    r = await anDanhHoSoHetHan(c, 'vi');
    ok(`Đọc danh sách hỏng (${h}) → không xóa file nào, không ẩn danh, không nói "đã xóa" / "đã ẩn danh"`,
       r.ok === false && soLan(c, 'remove') === 0 && soLan(c, 'rpc', 'an_danh_ho_so_het_han') === 0
       && k.tep.size === 3 && !(await daAnDanh(k.c.ma)) && !DA_XOA.test(r.cau) && !DA_AN_DANH.test(r.cau), r.cau);
  }

  // 7c · kho file hỏng trước khi xóa được gì
  for (const h of ['nem', 'loi', 'rong', 'la']) {
    k = await dungCanhAnDanh();
    c = taoClient({ tep: k.tep, hong: { remove: h } });
    r = await anDanhHoSoHetHan(c, 'vi');
    const a = await hoSo(k.a.ma);
    ok(`Kho file hỏng (${h}) → hồ sơ có CV GIỮ NGUYÊN (họ tên, đường dẫn); không nói "đã xóa … file"`,
       r.ok === false && k.tep.size === 3 && !a.da_an_danh && a.duong_dan_cv === k.a.duongDan && !DA_XOA.test(r.cau), r.cau);
    ok(`…(${h}) hồ sơ không có CV vẫn được ẩn danh, câu nói đúng "2 hồ sơ còn file CV chưa xóa được"`,
       await daAnDanh(k.c.ma) && /Đã ẩn danh 1 hồ sơ/.test(r.cau) && /2 hồ sơ còn file CV chưa xóa được/.test(r.cau), r.cau);
  }

  // 7d · kho xóa xong rồi mất trả lời — lần bấm sau phải tự nhận ra file đã không còn
  k = await dungCanhAnDanh();
  c = taoClient({ tep: k.tep, hong: { remove: n => (n === 1 ? 'mat_tra_loi' : undefined) } });
  r = await anDanhHoSoHetHan(c, 'vi');
  ok('Xóa xong mà mất trả lời → chưa chắc → chưa ẩn danh hồ sơ có CV, không nói "đã xóa … file"',
     r.ok === false && k.tep.size === 1 && !(await daAnDanh(k.a.ma)) && !DA_XOA.test(r.cau), r.cau);
  r = await anDanhHoSoHetHan(c, 'vi');
  ok('…bấm lần hai: kho trả về không có gì để xóa, kiểm lại thấy file đã không còn → ẩn danh nốt',
     r.ok === true && await daAnDanh(k.a.ma) && await daAnDanh(k.b.ma) && /Đã ẩn danh 2 hồ sơ/.test(r.cau), r.cau);

  // 7e · RLS chặn im lặng (tài khoản không có quyền xóa trong kho)
  k = await dungCanhAnDanh();
  c = taoClient({ tep: k.tep, quyenXoa: false });
  r = await anDanhHoSoHetHan(c, 'vi');
  ok('Kho "xóa" không lỗi mà file vẫn còn → kiểm lại thấy còn → không ẩn danh, câu nói file vẫn còn',
     r.ok === false && k.tep.size === 3 && !(await daAnDanh(k.a.ma)) && /vẫn còn/.test(r.cau) && !DA_XOA.test(r.cau), r.cau);

  // 7f · MẠNG ĐỨT GIỮA XÓA FILE VÀ ẨN DANH
  for (const h of ['nem', 'loi', 'rong']) {
    k = await dungCanhAnDanh();
    c = taoClient({ tep: k.tep, hong: { 'rpc:an_danh_ho_so_het_han': n => (n === 1 ? h : undefined) } });
    r = await anDanhHoSoHetHan(c, 'vi');
    const a = await hoSo(k.a.ma);
    ok(`Đứt giữa xóa file và ẩn danh (${h}) → không nói "đã ẩn danh"; nói KHÔNG CHẮC; nói đúng 2 file đã xóa`,
       r.ok === false && !DA_AN_DANH.test(r.cau) && /KHÔNG CHẮC/.test(r.cau) && /Đã xóa 2 file CV/.test(r.cau)
       && k.tep.size === 1 && !a.da_an_danh && a.ho_ten === 'Ứng Viên A', r.cau);
    r = await anDanhHoSoHetHan(c, 'vi');
    ok(`…(${h}) bấm lại: kiểm lại thấy file đã không còn → ẩn danh đủ ba hồ sơ`,
       r.ok === true && await daAnDanh(k.a.ma) && await daAnDanh(k.b.ma) && await daAnDanh(k.c.ma), r.cau);
  }

  // 7g · database ghi xong, trả lời mất trên đường về
  k = await dungCanhAnDanh();
  c = taoClient({ tep: k.tep, hong: { 'rpc:an_danh_ho_so_het_han': n => (n === 1 ? 'mat_tra_loi' : undefined) } });
  r = await anDanhHoSoHetHan(c, 'vi');
  ok('Database đã ẩn danh nhưng trả lời mất → vẫn chỉ nói KHÔNG CHẮC, không nói "đã ẩn danh"',
     r.ok === false && /KHÔNG CHẮC/.test(r.cau) && !DA_AN_DANH.test(r.cau) && await daAnDanh(k.a.ma), r.cau);
  r = await anDanhHoSoHetHan(c, 'vi');
  ok('…bấm lại: không còn gì để làm', r.ok === true && /không có hồ sơ nào quá hạn lưu/.test(r.cau), r.cau);

  // 7h · bấm đúp
  k = await dungCanhAnDanh();
  c = taoClient({ tep: k.tep });
  const [r1, r2] = await Promise.all([anDanhHoSoHetHan(c, 'vi'), anDanhHoSoHetHan(c, 'vi')]);
  const { rows: [{ n }] } = await db.query(`select count(*)::int as n from ho_so_ung_tuyen where ma_ho_so = any($1) and da_an_danh`,
                                           [[k.a.ma, k.b.ma, k.c.ma]]);
  ok('Bấm đúp: ba hồ sơ ẩn danh đúng một lần, không lượt nào báo lỗi, không file nào ở lại',
     n === 3 && r1.ok && r2.ok && k.tep.size === 1, `${n} · ${r1.cau} | ${r2.cau}`);

  // 7j · lần trước xóa xong 12 file mà mất trả lời: lượt này kiểm lại được tối đa 10 khóa — 2 khóa còn lại là
  // "hết lượt", không phải "kho hỏng" (câu phải đúng sự thật).
  await donSach();
  const lo12 = [];
  for (let i = 0; i < 12; i++) lo12.push(await taoHoSo(`Ứng Viên Lô ${i}`, { cv: true, quaHan: 2 }));
  c = taoClient({ tep: new Set() });
  let dg = await demGoi(c, anDanhHoSoHetHan(c, 'vi'));
  ok('12 file đã không còn, lượt này kiểm lại 10 → ẩn danh 10; 2 hồ sơ chờ lần sau vì hết lượt gọi — không nói kho hỏng',
     dg.r.ok === false && /Đã ẩn danh 10 hồ sơ/.test(dg.r.cau) && /2 hồ sơ còn file CV chưa xóa được \(lần bấm này đã dùng hết/.test(dg.r.cau)
     && !/không trả lời/.test(dg.r.cau), dg.r.cau);
  ok(`…và gọi ra ngoài không quá ${NGAN_SACH_GOI} lần`, dg.goi <= NGAN_SACH_GOI, `${dg.goi} lần`);
  r = await anDanhHoSoHetHan(c, 'vi');
  ok('…bấm lại: ẩn danh nốt 2', r.ok === true && /Đã ẩn danh 2 hồ sơ/.test(r.cau) && lo12.every(h => h.ma), r.cau);

  // 7k · đường dẫn sai dạng (database tự dựng nên chỉ có thể là dữ liệu hỏng): nói riêng, phần còn lại vẫn làm.
  k = await dungCanhAnDanh();
  const goc = taoClient({ tep: k.tep });
  c = { ...goc, rpc: async (ten, ts) => (ten === 'ho_so_cv_het_han'
    ? { data: [...(await goc.rpc(ten, ts)).data, 'ho-so-ung-tuyen/khong-phai-ma-ve/cv.pdf'], error: null }
    : goc.rpc(ten, ts)) };
  r = await anDanhHoSoHetHan(c, 'vi');
  ok('Đường dẫn sai dạng → câu riêng "báo người quản trị kỹ thuật", không bảo bấm lại; ba hồ sơ còn lại vẫn ẩn danh',
     r.ok === false && /Đã ẩn danh 3 hồ sơ/.test(r.cau) && /1 hồ sơ có đường dẫn CV không đúng dạng/.test(r.cau)
     && !/bấm lại/.test(r.cau) && k.tep.size === 1, r.cau);

  // 7i · quản lý gọi được trang nhưng database từ chối
  k = await dungCanhAnDanh();
  c = taoClient({ uid: UID.qlA, tep: k.tep });
  r = await anDanhHoSoHetHan(c, 'vi');
  ok('Quản lý → câu từ chối của database, không đụng kho file', r.ok === false && soLan(c, 'remove') === 0 && k.tep.size === 3
     && /Chỉ chủ sở hữu/.test(r.cau), r.cau);
  r = await anDanhHoSoHetHan(c, 'en');
  ok('…bản tiếng Anh dịch câu của database', r.ok === false && /^Only the owner/.test(r.cau) && !VIET.test(r.cau), r.cau);
});

// ===========================================================================
await nhom('8 · donCvMoCoiVaVe — quét kho, xóa CV mồ côi, kho sạch rồi mới dọn vé', async () => {
  /** Kho có: vé còn hạn (đang nộp), vé hết hạn chưa dùng (nộp bị từ chối), hồ sơ còn giữ, hồ sơ đã ẩn danh mà file sót, thư mục không còn vé. */
  async function dungCanh() {
    await donSach();
    const veSong = await taoVe(0.25);
    const veTuChoi = await taoVe(-48);
    const giu = await taoHoSo('Còn Giữ', { cv: true });
    const sot = await taoHoSo('Đã Ẩn Danh Cũ', { cv: true, quaHan: 5 });
    await db.query(`update ho_so_ung_tuyen set ho_ten = null, sdt = null, email = null, duong_dan_cv = null, ip = null,
                    dong_y_ip = null, da_an_danh = true, trang_thai = 'da_an_danh' where ma_ho_so = $1`, [sot.ma]);  // như nút cũ
    await db.query(`update phieu_tai_len set het_han = now() - interval '3 days' where id::text = any($1)`, [[giu.ve, sot.ve]]);
    const mat = '7f1d2c3b-4a5e-4f60-8172-839405a6b7c8';
    const tep = new Set([`${veSong}/cv.pdf`, `${veTuChoi}/CV-Bi-Tu-Choi.pdf`, giu.khoa, sot.khoa, `${mat}/cv.pdf`, `${mat}/con/x.pdf`]);
    return { veSong, veTuChoi, giu, sot, mat, tep };
  }
  const soVe = async () => (await db.query(`select count(*)::int as n from phieu_tai_len`)).rows[0].n;

  let k = await dungCanh();
  let c = taoClient({ tep: k.tep });
  let r = await donCvMoCoiVaVe(c, true, 'vi');
  ok('Chủ: xóa đúng 4 file mồ côi (kể cả file nằm sâu một cấp), giữ file đang nộp và file hồ sơ còn giữ',
     JSON.stringify([...k.tep].sort()) === JSON.stringify([`${k.veSong}/cv.pdf`, k.giu.khoa].sort()), JSON.stringify([...k.tep]));
  ok('…kho sạch rồi mới dọn vé: chỉ còn vé đang hiệu lực', await soVe() === 1
     && c.goiDen.findIndex(g => g[1] === 'don_dep_phieu_tai_len') > c.goiDen.findIndex(g => g[0] === 'remove'), `${await soVe()} vé`);
  ok('…câu: đã xóa 4 file CV mồ côi, đã dọn 3 vé', r.ok === true && /Đã xóa 4 file CV mồ côi/.test(r.cau) && /Đã dọn 3 vé/.test(r.cau), r.cau);
  r = await donCvMoCoiVaVe(c, true, 'vi');
  ok('Bấm lại: không còn CV mồ côi, không vé nào cần dọn, không gọi xóa', r.ok === true && soLan(c, 'remove') === 1
     && /không có CV mồ côi/i.test(r.cau), r.cau);

  // Quản lý: thấy được kho nhưng không xóa được file — không dọn vé khi kho còn CV mồ côi.
  k = await dungCanh();
  c = taoClient({ uid: UID.qlA, tep: k.tep, quyenXoa: false });
  r = await donCvMoCoiVaVe(c, false, 'vi');
  ok('Quản lý, kho còn CV mồ côi → không gọi xóa, KHÔNG dọn vé, nhờ chủ nhà hàng',
     r.ok === false && soLan(c, 'remove') === 0 && soLan(c, 'rpc', 'don_dep_phieu_tai_len') === 0 && await soVe() === 4
     && /chủ nhà hàng/.test(r.cau) && /3 thư mục/.test(r.cau), r.cau);
  await donCvMoCoiVaVe(taoClient({ tep: k.tep }), true, 'vi');
  await db.query(`insert into phieu_tai_len (het_han) values (now() - interval '2 days')`);
  r = await donCvMoCoiVaVe(taoClient({ uid: UID.qlA, tep: k.tep, quyenXoa: false }), false, 'vi');
  ok('Quản lý, kho sạch → dọn vé như trước (0065)', r.ok === true && /Đã dọn 1 vé/.test(r.cau), r.cau);

  // Không đọc được kho / không hỏi được database → không làm gì cả.
  for (const [buoc, h] of [['list:', 'nem'], ['list:', 'loi'], ['list:', 'rong'], ['list:', 'la'],
                           ['rpc:ho_so_thu_muc_cv_mo_coi', 'nem'], ['rpc:ho_so_thu_muc_cv_mo_coi', 'loi'],
                           ['rpc:ho_so_thu_muc_cv_mo_coi', 'rong'], ['rpc:ho_so_thu_muc_cv_mo_coi', 'la']]) {
    k = await dungCanh();
    c = taoClient({ tep: k.tep, hong: { [buoc]: h } });
    r = await donCvMoCoiVaVe(c, true, 'vi');
    ok(`${buoc.replace(/:$/, ' thư mục gốc')} hỏng (${h}) → không xóa file nào, không dọn vé nào, không nói "đã xóa"`,
       r.ok === false && k.tep.size === 6 && await soVe() === 4 && soLan(c, 'remove') === 0 && !DA_XOA.test(r.cau), r.cau);
  }

  // Một thư mục không liệt kê được: các thư mục khác vẫn xóa, nhưng vé chưa được dọn.
  k = await dungCanh();
  c = taoClient({ tep: k.tep, hong: { [`list:${k.mat}`]: 'nem' } });
  r = await donCvMoCoiVaVe(c, true, 'vi');
  ok('Một thư mục mồ côi không liệt kê được → xóa phần còn lại, nói đúng số đã xóa, KHÔNG dọn vé',
     r.ok === false && !k.tep.has(`${k.veTuChoi}/CV-Bi-Tu-Choi.pdf`) && k.tep.has(`${k.mat}/cv.pdf`) && await soVe() === 4
     && /Đã xóa 2 file CV mồ côi/.test(r.cau) && /bấm lại/i.test(r.cau), r.cau);

  // Xóa hỏng / RLS chặn im lặng → vé không bị dọn, file còn nguyên.
  for (const [ten, tuyChon] of [['nem', { hong: { remove: 'nem' } }], ['loi', { hong: { remove: 'loi' } }],
                                ['rong', { hong: { remove: 'rong' } }], ['RLS chặn', { quyenXoa: false }]]) {
    k = await dungCanh();
    c = taoClient({ tep: k.tep, ...tuyChon });
    r = await donCvMoCoiVaVe(c, true, 'vi');
    ok(`Xóa trong kho hỏng (${ten}) → file còn nguyên, KHÔNG dọn vé, không nói "đã xóa"`,
       r.ok === false && k.tep.size === 6 && await soVe() === 4 && soLan(c, 'rpc', 'don_dep_phieu_tai_len') === 0
       && !DA_XOA.test(r.cau) && /bấm lại/.test(r.cau), r.cau);
  }
  r = await donCvMoCoiVaVe(c, true, 'vi');
  ok('…RLS chặn: bấm lại vẫn chặn, vẫn không dọn vé (không bao giờ "quen" với file còn đó)',
     r.ok === false && await soVe() === 4 && /vẫn còn/.test(r.cau), r.cau);

  // Kho xóa xong rồi mất trả lời: lượt này chưa chắc nên chưa dọn vé; bấm lại thấy thư mục đã hết → dọn vé.
  k = await dungCanh();
  c = taoClient({ tep: k.tep, hong: { remove: n => (n === 1 ? 'mat_tra_loi' : undefined) } });
  r = await donCvMoCoiVaVe(c, true, 'vi');
  ok('Xóa xong mà mất trả lời → không nói "đã xóa", KHÔNG dọn vé',
     r.ok === false && k.tep.size === 2 && await soVe() === 4 && !DA_XOA.test(r.cau), r.cau);
  r = await donCvMoCoiVaVe(c, true, 'vi');
  ok('…bấm lại: kho không còn CV mồ côi → dọn 3 vé', r.ok === true && await soVe() === 1
     && /không có CV mồ côi/.test(r.cau) && /Đã dọn 3 vé/.test(r.cau), r.cau);

  // Dọn vé hỏng sau khi đã xóa file.
  k = await dungCanh();
  c = taoClient({ tep: k.tep, hong: { 'rpc:don_dep_phieu_tai_len': 'mat_tra_loi' } });
  r = await donCvMoCoiVaVe(c, true, 'vi');
  ok('Xóa file xong, dọn vé mất trả lời → nói đúng 4 file đã xóa, vé thì "chưa chắc"', r.ok === false
     && /Đã xóa 4 file CV mồ côi/.test(r.cau) && /chưa chắc/i.test(r.cau) && !/Đã dọn/.test(r.cau), r.cau);

  // Nhiều thư mục mồ côi hơn một lượt làm được: làm từng phần, chỉ dọn vé ở lượt cuối.
  await donSach();
  const nhieu = new Set();
  for (let i = 0; i < THU_MUC_TOI_DA + 5; i++) nhieu.add(`${crypto.randomUUID()}/cv.pdf`);
  await db.query(`insert into phieu_tai_len (het_han) values (now() - interval '2 days')`);
  c = taoClient({ tep: nhieu });
  r = await donCvMoCoiVaVe(c, true, 'vi');
  ok(`${THU_MUC_TOI_DA + 5} thư mục mồ côi → lượt đầu xóa ${THU_MUC_TOI_DA}, còn 5, chưa dọn vé, trong ngân sách lời gọi`,
     r.ok === false && nhieu.size === 5 && await soVe() === 1 && /Còn 5 thư mục/.test(r.cau) && c.goiDen.length <= NGAN_SACH_GOI,
     `${c.goiDen.length} lời gọi · ${r.cau}`);
  r = await donCvMoCoiVaVe(c, true, 'vi');
  ok('…lượt sau xóa nốt rồi dọn vé', r.ok === true && nhieu.size === 0 && await soVe() === 0, r.cau);

  // Thư mục mồ côi lồng một cấp: mỗi thư mục tốn hai lần liệt kê — ngân sách lời gọi chặn trước khi chạm trần 50
  // của Workers, phần còn lại để lượt sau.
  await donSach();
  const long = new Set();
  for (let i = 0; i < 20; i++) long.add(`${crypto.randomUUID()}/con/cv.pdf`);
  c = taoClient({ tep: long });
  let dg = await demGoi(c, donCvMoCoiVaVe(c, true, 'vi'));
  ok(`20 thư mục lồng nhau → lượt đầu dừng trong ngân sách (${NGAN_SACH_GOI} lời gọi), nói "hết số lần gọi", chưa dọn vé`,
     dg.r.ok === false && dg.goi <= NGAN_SACH_GOI && long.size > 0 && long.size < 20 && /đã dùng hết số lần gọi/.test(dg.r.cau)
     && /bấm lại/.test(dg.r.cau), `${dg.goi} lời gọi, còn ${long.size} file · ${dg.r.cau}`);
  for (let lan = 0; lan < 3 && long.size > 0; lan++) dg = await demGoi(c, donCvMoCoiVaVe(c, true, 'vi'));
  ok('…bấm thêm vài lần thì sạch, mỗi lần vẫn trong ngân sách', long.size === 0 && dg.goi <= NGAN_SACH_GOI, `${long.size} file`);

  // Thư mục gốc hơn một trang (1.000 mục): đọc đủ mọi trang trước khi hỏi database.
  await donSach();
  const muc = new Set();
  const { rows: ve } = await db.query(`insert into phieu_tai_len (het_han) select now() + interval '10 minutes'
                                       from generate_series(1, 1003) returning id::text as id`);
  for (const v of ve) muc.add(`${v.id}/cv.pdf`);
  c = taoClient({ tep: muc });
  r = await donCvMoCoiVaVe(c, true, 'vi');
  const hoi = c.goiDen.find(g => g[1] === 'ho_so_thu_muc_cv_mo_coi');
  ok('1.003 thư mục (vé còn hạn) → hỏi database đủ 1.003 tên, không xóa gì', r.ok === true && hoi?.[2]?.p_thu_muc?.length === 1003
     && muc.size === 1003 && soLan(c, 'remove') === 0, `${hoi?.[2]?.p_thu_muc?.length} tên · ${r.cau}`);
  await donSach();
});

// ===========================================================================
await nhom('9 · CÂU CHỮ — tiếng Anh không lẫn chữ Việt, không chữ "thành công"', async () => {
  const cau = [];
  const ghi = async p => { const r = await p; cau.push(r.cau); return r; };
  let k = await dungCanhAnDanh();
  await ghi(anDanhHoSoHetHan(taoClient({ tep: k.tep, hong: { remove: 'nem' } }), 'en'));
  k = await dungCanhAnDanh();
  await ghi(anDanhHoSoHetHan(taoClient({ tep: k.tep, hong: { 'rpc:an_danh_ho_so_het_han': 'nem' } }), 'en'));
  k = await dungCanhAnDanh();
  await ghi(anDanhHoSoHetHan(taoClient({ tep: k.tep, quyenXoa: false }), 'en'));
  await ghi(anDanhHoSoHetHan(taoClient({ tep: k.tep, hong: { 'rpc:ho_so_cv_het_han': 'nem' } }), 'en'));
  k = await dungCanhAnDanh();
  await ghi(anDanhHoSoHetHan(taoClient({ tep: k.tep, hong: { 'rpc:an_danh_ho_so_het_han': 'loi' } }), 'en'));
  await ghi(anDanhHoSoHetHan(taoClient({ tep: k.tep }), 'en'));
  await ghi(anDanhHoSoHetHan(taoClient({ tep: k.tep }), 'en'));
  await donSach();
  const mo = new Set([`${crypto.randomUUID()}/cv.pdf`, `${crypto.randomUUID()}/cv.pdf`]);
  await ghi(donCvMoCoiVaVe(taoClient({ tep: mo, quyenXoa: false }), false, 'en'));
  await ghi(donCvMoCoiVaVe(taoClient({ tep: mo, quyenXoa: false }), true, 'en'));
  await ghi(donCvMoCoiVaVe(taoClient({ tep: mo, hong: { 'list:': 'nem' } }), true, 'en'));
  await ghi(donCvMoCoiVaVe(taoClient({ tep: mo, hong: { 'rpc:don_dep_phieu_tai_len': 'nem' } }), true, 'en'));
  await ghi(donCvMoCoiVaVe(taoClient({ tep: mo }), true, 'en'));
  const sot = cau.filter(x => typeof x !== 'string' || x === '' || VIET.test(x));
  ok(`${cau.length} câu tiếng Anh: không trống, không lẫn chữ Việt`, cau.length === 12 && sot.length === 0, sot.join(' | '));
  const ma = readFileSync(join(LIB, 'xoa-cv.ts'), 'utf8');
  ok('xoa-cv.ts không có "thành công" / "success" — chỉ nói điều đã được xác nhận', !/thành công|success/i.test(ma));
  await donSach();
});

// ===========================================================================
// supabase-js THẬT của web/ với fetch giả — hình dạng lỗi Storage / PostgREST đúng như mã giả định.
// ===========================================================================
const requireWeb = createRequire(join(GOC, 'web', 'package.json'));
const { createClient } = await import(pathToFileURL(requireWeb.resolve('@supabase/supabase-js')).href);
let traLoiGia = () => { throw new Error('chưa đặt câu trả lời giả'); };
const goiFetch = [];
const taoClientThat = () => createClient('https://thu-khong-that.supabase.co', 'khoa-anon-gia', {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: async (url, init) => { goiFetch.push({ url: String(url), method: init?.method, body: init?.body }); return traLoiGia(String(url), init); } },
});
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const html = status => new Response('<html><body>Lỗi cổng</body></html>', { status, headers: { 'content-type': 'text/html' } });
const loiUndici = (thongDiep, ma) => new TypeError('fetch failed', { cause: Object.assign(new Error(thongDiep), { code: ma }) });
const KIEU_HONG = [
  ['mất mạng trước khi gửi', () => { throw loiUndici('connect ECONNREFUSED 104.18.0.1:443', 'ECONNREFUSED'); }],
  ['đứt SAU khi đã gửi', () => { throw loiUndici('other side closed', 'UND_ERR_SOCKET'); }],
  ['hết giờ chờ', () => { throw new DOMException('The operation was aborted due to timeout', 'TimeoutError'); }],
  ['cổng 502 trả HTML', () => html(502)],
  ['503 JSON không mã', () => json(503, { message: 'name resolution failed' })],
  ['200 thân bị cắt', () => new Response('[{"name":"7f1d', { status: 200, headers: { 'content-type': 'application/json' } })],
  ['200 thân rỗng', () => new Response('', { status: 200 })],
];
const VE = '7f1d2c3b-4a5e-4f60-8172-839405a6b7c8';
const KHOA = `${VE}/cv.pdf`;
const laXoa = (u, i) => i?.method === 'DELETE' && u.endsWith(`/storage/v1/object/${KHO_CV}`);
const laList = u => u.endsWith(`/storage/v1/object/list/${KHO_CV}`);

await nhom('10 · supabase-js THẬT — xoaTrongKho và anDanhHoSoHetHan với từng kiểu hỏng', async () => {
  for (const [ten, hong] of KIEU_HONG) {
    traLoiGia = (u, i) => (laXoa(u, i) ? hong() : json(200, [{ name: 'cv.pdf', id: 'x' }]));
    goiFetch.length = 0;
    let kq, nem = null;
    try { kq = await xoaTrongKho(taoClientThat(), [KHOA]); } catch (e) { nem = e; }
    ok(`Xóa trong kho: ${ten} → không ném, không tính là đã xóa`,
       nem === null && kq.daXoa.length === 0 && kq.chuaXoa.join() === KHOA && kq.lyDo !== null,
       nem?.message ?? JSON.stringify(kq));
  }
  traLoiGia = (u, i) => (laXoa(u, i) ? json(200, [{ name: KHOA, bucket_id: KHO_CV, id: 'x' }]) : html(502));
  goiFetch.length = 0;
  let kq = await xoaTrongKho(taoClientThat(), [KHOA]);
  ok('Kho trả dòng đã xóa (name = khóa đầy đủ) → đã xóa, không cần kiểm lại',
     kq.daXoa.join() === KHOA && goiFetch.length === 1 && JSON.parse(goiFetch[0].body).prefixes.join() === KHOA, JSON.stringify(kq));
  traLoiGia = (u, i) => (laXoa(u, i) ? json(200, []) : laList(u) ? json(200, [{ name: 'cv.pdf', id: 'x' }]) : html(502));
  kq = await xoaTrongKho(taoClientThat(), [KHOA]);
  ok('Kho trả [] mà liệt kê lại vẫn thấy file (RLS chặn im lặng) → chưa xóa, lý do "vẫn còn"',
     kq.daXoa.length === 0 && kq.lyDo === 'van_con', JSON.stringify(kq));
  traLoiGia = (u, i) => (laXoa(u, i) ? json(200, []) : laList(u) ? json(200, []) : html(502));
  kq = await xoaTrongKho(taoClientThat(), [KHOA]);
  ok('Kho trả [] và liệt kê lại không thấy file (đã xóa ở lần trước) → tính là đã xóa', kq.daXoa.join() === KHOA, JSON.stringify(kq));
  traLoiGia = (u, i) => (laXoa(u, i) ? json(200, []) : hong502());
  function hong502() { return html(502); }
  kq = await xoaTrongKho(taoClientThat(), [KHOA]);
  ok('Kho trả [] mà liệt kê lại hỏng → chưa chắc → chưa xóa', kq.daXoa.length === 0 && kq.lyDo === 'loi_kho', JSON.stringify(kq));

  // Toàn luồng ẩn danh: đứt giữa xóa file và ẩn danh, mỗi kiểu hỏng một lần.
  for (const [ten, hong] of KIEU_HONG) {
    traLoiGia = (u, i) => {
      if (u.endsWith('/rest/v1/rpc/ho_so_cv_het_han')) return json(200, [`ho-so-ung-tuyen/${KHOA}`]);
      if (laXoa(u, i)) return json(200, [{ name: KHOA, bucket_id: KHO_CV, id: 'x' }]);
      if (u.endsWith('/rest/v1/rpc/an_danh_ho_so_het_han')) return hong();
      return html(500);
    };
    goiFetch.length = 0;
    let r, nem = null;
    try { r = await anDanhHoSoHetHan(taoClientThat(), 'vi'); } catch (e) { nem = e; }
    const gui = goiFetch.find(g => g.url.endsWith('/rpc/an_danh_ho_so_het_han'));
    ok(`Ẩn danh: ${ten} sau khi xóa file → không ném, không "đã ẩn danh", KHÔNG CHẮC, đúng "đã xóa 1 file"`,
       nem === null && r.ok === false && !DA_AN_DANH.test(r.cau) && /KHÔNG CHẮC/.test(r.cau) && /Đã xóa 1 file CV/.test(r.cau)
       && JSON.parse(gui?.body ?? '{}').p_cv_da_xoa?.join() === `ho-so-ung-tuyen/${KHOA}`, nem?.message ?? r.cau);
  }
  traLoiGia = (u, i) => {
    if (u.endsWith('/rest/v1/rpc/ho_so_cv_het_han')) return json(200, [`ho-so-ung-tuyen/${KHOA}`]);
    if (laXoa(u, i)) return json(200, [{ name: KHOA, bucket_id: KHO_CV, id: 'x' }]);
    if (u.endsWith('/rest/v1/rpc/an_danh_ho_so_het_han')) return json(200, 4);
    return html(500);
  };
  const r = await anDanhHoSoHetHan(taoClientThat(), 'vi');
  ok('Trả lời hợp lệ → "Đã ẩn danh 4 hồ sơ", "Đã xóa 1 file CV"', r.ok === true && /Đã ẩn danh 4 hồ sơ/.test(r.cau) && /Đã xóa 1 file CV/.test(r.cau), r.cau);
  traLoiGia = (u, i) => {
    if (u.endsWith('/rest/v1/rpc/ho_so_cv_het_han')) return json(200, [`ho-so-ung-tuyen/${KHOA}`]);
    if (laXoa(u, i)) return json(200, [{ name: KHOA, bucket_id: KHO_CV, id: 'x' }]);
    return json(403, { code: '42501', message: 'Chỉ chủ sở hữu mới chạy được việc dọn hồ sơ hết hạn' });
  };
  const tuChoi = await anDanhHoSoHetHan(taoClientThat(), 'vi');
  ok('Database từ chối thật (42501) → nói đúng câu của database, nói họ tên còn đó, không "KHÔNG CHẮC"',
     tuChoi.ok === false && /Chỉ chủ sở hữu/.test(tuChoi.cau) && /vẫn còn/.test(tuChoi.cau) && !/KHÔNG CHẮC/.test(tuChoi.cau), tuChoi.cau);
});

// ===========================================================================
await nhom('11 · nopHoSo — form chắc chắn bị từ chối thì không tải CV lên kho', async () => {
  const { nopHoSo } = await import(join(LIB, 'nop-ho-so.ts'));
  await donSach();
  function clientNop() {
    const goiDen = [];
    return {
      goiDen,
      async rpc(ten, thamSo = {}) {
        goiDen.push(['rpc', ten]);
        const khoa = Object.keys(thamSo);
        const r = await duoiAnon(`select ${ten}(${khoa.map((k, i) => `${k} => $${i + 1}`).join(', ')}) as kq`, khoa.map(k => thamSo[k]));
        if (r.loi) return { data: null, error: { code: r.ma ?? 'P0001', message: r.loi } };
        const kq = r.rows[0].kq;
        return { data: ten === 'tin_tuyen_dung_cong_khai' ? null : kq, error: null };
      },
      storage: { from: () => ({ upload: async khoa => { goiDen.push(['upload', khoa]); return { data: { path: khoa }, error: null }; } }) },
    };
  }
  // tin_tuyen_dung_cong_khai trả bảng — client trên đọc một ô; tinHoiCv không đọc được thì coi là có hỏi CV (đúng như thật).
  const form = (sua = {}) => {
    const f = new FormData();
    f.set('vi_tri', VI_TRI); f.set('ho_ten', 'Lý Thị Nộp'); f.set('sdt', '0' + String(soDt++)); f.set('dong_y', 'co');
    f.set('moc', String(Date.now() - 60_000));
    f.set('cv', new File([new Uint8Array([37, 80, 68, 70])], 'CV Lý Thị Nộp.pdf', { type: 'application/pdf' }));
    for (const [k, v] of Object.entries(sua)) f.set(k, v);
    return f;
  };
  let c = clientNop();
  let r = await nopHoSo(c, form({ website: 'http://spam.example' }), null, 'vi');
  ok('Bẫy bot (ô website có chữ) → không xin vé, không tải CV, database vẫn từ chối như cũ',
     r.ok === false && !c.goiDen.some(g => g[0] === 'upload' || g[1] === 'xin_phieu_tai_cv'), JSON.stringify(c.goiDen) + ' ' + r.cau);
  c = clientNop();
  r = await nopHoSo(c, form({ moc: String(Date.now() - 1000) }), null, 'vi');
  ok('Điền form dưới 3 giây → không tải CV, database vẫn từ chối',
     r.ok === false && !c.goiDen.some(g => g[0] === 'upload' || g[1] === 'xin_phieu_tai_cv'), JSON.stringify(c.goiDen) + ' ' + r.cau);
  c = clientNop();
  r = await nopHoSo(c, form({ sdt: '0912 345' }), null, 'vi');
  ok('Số điện thoại sai dạng → không tải CV, database vẫn từ chối với đúng câu "Số điện thoại không hợp lệ"',
     r.ok === false && /Số điện thoại không hợp lệ/.test(r.cau) && !c.goiDen.some(g => g[0] === 'upload' || g[1] === 'xin_phieu_tai_cv'),
     JSON.stringify(c.goiDen) + ' ' + r.cau);
  // Web bỏ tải CV khi sdtHopLe() nói sai — chỉ đúng nếu nó nói y như database. Đối chiếu từng dạng hay gặp.
  const { sdtHopLe } = await import(join(LIB, 'messenger.ts'));
  const lech = [];
  for (const x of ['0912345678', '+84 912 345 678', '84912345678', '+84912345678', '912345678', '0912.345.678', '(028) 3823 4567',
                   '02838234567', '849123456789', '0912 345', '12345', '', '   ', 'abc', '０９１２３４５６７８', '0912345678x', '0084912345678']) {
    const { rows: [d] } = await db.query(`select sdt_hop_le(chuan_hoa_sdt($1)) is true as hop_le, chuan_hoa_sdt($1) as so`, [x]);
    const w = sdtHopLe(x);
    if ((w !== null) !== d.hop_le || (w !== null && w !== d.so)) lech.push(`${JSON.stringify(x)}: web ${w} · database ${d.hop_le} ${d.so}`);
  }
  ok('sdtHopLe (web) nói y như chuan_hoa_sdt + sdt_hop_le (database) ở 17 dạng số', lech.length === 0, lech.join(' | '));
  c = clientNop();
  r = await nopHoSo(c, form({ sdt: 'abc' }), null, 'vi');
  ok('Lỡ database nhận số mà web coi là sai (ô số điện thoại chỉ có chữ) → câu trả lời nói đúng: hồ sơ nộp KHÔNG kèm CV',
     r.ok !== true || (r.luuY !== undefined && /không kèm CV/.test(r.luuY) && !c.goiDen.some(g => g[0] === 'upload')), JSON.stringify(r));

  c = clientNop();
  r = await nopHoSo(c, form({ website: '   ' }), null, 'vi');
  ok('Ô website chỉ có dấu cách (database coi là trống) → vẫn tải CV và nộp được',
     r.ok === true && c.goiDen.some(g => g[0] === 'upload'), JSON.stringify(c.goiDen) + ' ' + r.cau);
  c = clientNop();
  r = await nopHoSo(c, form(), null, 'vi');
  const tai = c.goiDen.find(g => g[0] === 'upload');
  ok('Form thường → tải CV (khóa ASCII không dấu theo mã vé) rồi nộp, hồ sơ trỏ đúng file',
     r.ok === true && /^[0-9a-f-]{36}\/CV-Ly-Thi-Nop\.pdf$/.test(tai?.[1] ?? '')
     && (await db.query(`select duong_dan_cv from ho_so_ung_tuyen where ma_ho_so = $1`, [r.ma])).rows[0]?.duong_dan_cv === `ho-so-ung-tuyen/${tai[1]}`,
     JSON.stringify(c.goiDen) + ' ' + r.cau);
  await donSach();
});

// ===========================================================================
await nhom('12 · 0074 VIẾT LẠI HÀM CŨ — chỉ thêm đúng phần cần thêm', async () => {
  const MIG = join(GOC, 'crm', 'supabase', 'migrations');
  const tep = dau => readFileSync(join(MIG, readdirSync(MIG).find(f => f.startsWith(dau))), 'utf8');
  /** Nguyên văn một hàm: từ "create or replace function <ten>(" tới dòng "$$;" đầu tiên sau đó. */
  const ham = (s, ten) => {
    const i = s.indexOf(`create or replace function ${ten}(`);
    const j = i < 0 ? -1 : s.indexOf('\n$$;', i);
    return j < 0 ? '' : s.slice(i, j + 4);
  };
  const m66 = tep('0074_');
  const cu = ham(tep('0063_'), 'suc_khoe_so_lieu'), moi = ham(m66, 'suc_khoe_so_lieu');
  const i = moi.indexOf('    -- 0074:'), j = moi.indexOf("    'chi_nhanh', v_ds);");
  const o = i > 0 && j > i ? moi.slice(i, j) : '';
  ok('suc_khoe_so_lieu thêm đúng một ô don_dep gồm bốn số',
     /'don_dep', jsonb_build_object\(/.test(o) && (o.match(/'[a-z_0-9]+',/g) ?? []).length === 5
     && ['ho_so_qua_han', 'ho_so_qua_han_7_ngay', 've_qua_han', 'su_kien_qua_han'].every(x => o.includes(`'${x}',`)), o);
  ok('suc_khoe_so_lieu = thân 0063 NGUYÊN VĂN, trừ ô don_dep', cu !== '' && moi.slice(0, i) + moi.slice(j) === cu);

  const { NGAY_CHO_BAM_DON: N } = await import(join(LIB, 'suc-khoe.ts'));
  ok(`Ngưỡng ${N} ngày của đèn (lib/suc-khoe.ts) khớp đúng các số trong ô don_dep`,
     o.includes(`h.luu_den < hom_nay_vn() - ${N})`) && o.includes(`h.luu_den >= hom_nay_vn() - ${N})`)
     && o.includes(`interval '${N} days'`) && o.includes(`hom_nay_vn() - ${90 + N})`), o);

  // an_danh_ho_so_het_han xóa đúng những cột 0012 đã xóa — không bớt cột nào.
  const m12 = ham(tep('0012_'), 'don_dep_ho_so_het_han');
  const set12 = m12.slice(m12.indexOf('    set ho_ten'), m12.indexOf("trang_thai = 'da_an_danh'"));
  ok('an_danh_ho_so_het_han xóa đúng các cột của 0012 (chép nguyên văn)',
     set12.length > 50 && ham(m66, 'an_danh_ho_so_het_han').includes(set12), set12);
  ok('don_dep_ho_so_het_han() (0074) gọi an_danh_ho_so_het_han với danh sách RỖNG — từ SQL không xóa được file',
     ham(m66, 'don_dep_ho_so_het_han').includes('return an_danh_ho_so_het_han(array[]::text[]);'));
});

// ===========================================================================
// Rà soát bảo mật: từ 0074 nút ẩn danh của chủ XÓA FILE theo duong_dan_cv — chủ xóa được mọi file trong kho
// (policy 0014). Policy ho_so_sua (0012) cho quản lý UPDATE mọi cột hồ sơ của chi nhánh mình, nên quản lý ghi
// đường dẫn của người khác vào một hồ sơ mồi, lùi hạn lưu về quá khứ, đèn đỏ, chủ bấm → file của người khác mất.
await nhom('13 · ĐƯỜNG DẪN CV, HẠN LƯU, CỜ ẨN DANH CHỈ ĐỔI QUA HÀM — nút của chủ không thành công cụ xóa file của người khác', async () => {
  await donSach();
  const { rows: tg } = await db.query(`select tgname from pg_trigger where tgrelid = 'ho_so_ung_tuyen'::regclass and not tgisinternal
                                       and tgname = 'ho_so_khoa_cot_don_dep'`);
  ok('Trigger ho_so_khoa_cot_don_dep có trên ho_so_ung_tuyen (0074)', tg.length === 1);
  const nanNhan = await taoHoSo('Nạn Nhân Còn Hạn', { cv: true });
  const moi = await taoHoSo('Hồ Sơ Mồi');
  const tep = new Set([nanNhan.khoa]);
  const TU_CHOI = /chỉ đổi được qua việc dọn dữ liệu/;

  const sua = await duoi(UID.qlA, `update ho_so_ung_tuyen set duong_dan_cv = $2, luu_den = '2020-01-01'
                                   where ma_ho_so = $1 returning id`, [moi.ma, nanNhan.duongDan]);
  ok('TÁI HIỆN: quản lý KHÔNG ghi được đường dẫn CV của người khác và hạn lưu cũ vào một hồ sơ mồi',
     sua.loi !== null && TU_CHOI.test(sua.loi), sua.loi ?? `sửa được ${sua.rows?.length} dòng`);
  await anDanhHoSoHetHan(taoClient({ tep }), 'vi');
  ok('…nên chủ bấm "Ẩn danh hồ sơ đã quá hạn lưu" không xóa file của hồ sơ còn hạn', tep.has(nanNhan.khoa) && !(await daAnDanh(nanNhan.ma)));

  for (const [ten, sql] of [
    ['lùi hạn lưu của hồ sơ còn hạn về quá khứ', `update ho_so_ung_tuyen set luu_den = '2020-01-01' where ma_ho_so = $1 returning id`],
    ['xóa đường dẫn CV (thư mục thành mồ côi, nút quét xóa file)', `update ho_so_ung_tuyen set duong_dan_cv = null where ma_ho_so = $1 returning id`],
    ['tự ẩn danh thẳng (bỏ qua bước xóa file)', `update ho_so_ung_tuyen set ho_ten = null, sdt = null, email = null, duong_dan_cv = null,
       da_an_danh = true, trang_thai = 'da_an_danh' where ma_ho_so = $1 returning id`],
  ]) {
    const r = await duoi(UID.qlA, sql, [nanNhan.ma]);
    ok(`Quản lý KHÔNG ${ten}`, r.loi !== null && TU_CHOI.test(r.loi), r.loi ?? `sửa được ${r.rows?.length} dòng`);
  }
  const chu = await duoi(UID.chu, `update ho_so_ung_tuyen set luu_den = luu_den + 30 where ma_ho_so = $1 returning id`, [nanNhan.ma]);
  ok('Chủ cũng không sửa thẳng hạn lưu — chỉ qua hàm', chu.loi !== null && TU_CHOI.test(chu.loi), chu.loi ?? 'SỬA ĐƯỢC');
  const sau = await hoSo(nanNhan.ma);
  ok('Hồ sơ nạn nhân còn nguyên', sau.duong_dan_cv === nanNhan.duongDan && sau.ho_ten === 'Nạn Nhân Còn Hạn' && !sau.da_an_danh, JSON.stringify(sau));

  const doi = await duoi(UID.qlA, `update ho_so_ung_tuyen set trang_thai = 'dang_xem', nguoi_phu_trach = $2, ghi_chu_buoc = 'Đã gọi'
                                   where ma_ho_so = $1 and trang_thai = 'moi' returning id`, [nanNhan.ma, nsId[UID.qlA]]);
  ok('Giao diện /noi-bo/tuyen-dung vẫn đổi được trạng thái, người phụ trách, ghi chú (đúng ba cột nó gửi)',
     doi.loi === null && doi.rows?.length === 1, doi.loi ?? '');

  await db.query(`update ho_so_ung_tuyen set luu_den = hom_nay_vn() - 2 where ma_ho_so = $1`, [nanNhan.ma]);
  const r = await anDanhHoSoHetHan(taoClient({ tep }), 'vi');
  ok('Hết hạn thật thì việc dọn (hàm definer) vẫn xóa file và ẩn danh được', r.ok === true && !tep.has(nanNhan.khoa)
     && await daAnDanh(nanNhan.ma), r.cau);
  const sp = await duoiAnon(`update ho_so_ung_tuyen set luu_den = '2020-01-01' returning id`);
  ok('anon không sửa được dòng nào', sp.loi !== null || sp.rows?.length === 0, sp.loi ?? '');

  const en = readFileSync(join(LIB, 'cau-noi-bo.ts'), 'utf8');
  const m66 = readFileSync(join(GOC, 'crm', 'supabase', 'migrations', '0074_xoa_file_cv.sql'), 'utf8');
  const cau = m66.match(/raise exception '([^']*chỉ đổi được qua việc dọn dữ liệu[^']*)'/)?.[1];
  ok('Câu từ chối mới có bản tiếng Anh ở cau-noi-bo.ts', !!cau && en.includes(`'${cau}'`), cau ?? 'không thấy câu trong 0074');
  await donSach();
});

process.exit(ketThuc('XÓA FILE CV'));
