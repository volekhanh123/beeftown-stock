/**
 * BEEFTOWN — HỒ SƠ ỨNG TUYỂN KHÔNG CÓ SỐ ĐIỆN THOẠI (0080)
 * =========================================================
 *
 *     node test/test-tuyen-dung-sdt-rong.mjs
 *
 * LỖI (phát hiện khi làm PR #74, có từ 0012)
 *
 * nop_ho_so_ung_tuyen() kiểm số điện thoại bằng
 *
 *     v_sdt := chuan_hoa_sdt(p_sdt);
 *     if not sdt_hop_le(v_sdt) then raise exception 'Số điện thoại không hợp lệ: %' …
 *
 * Ô số điện thoại chỉ có chữ ("abc"), rỗng, toàn dấu cách hay toàn dấu gạch: chuan_hoa_sdt() bỏ hết ký tự
 * không phải số và trả null. sdt_hop_le(null) là null chứ không phải false, "not null" vẫn là null, nên
 * lệnh if không chạy. Ràng buộc ho_so_sdt_hop_le check (da_an_danh or sdt_hop_le(sdt)) cũng cho qua: check
 * trả null thì Postgres tính là đạt. Hồ sơ được lưu với sdt = null — không liên lạc được ứng viên, và chỉ
 * mục chống nộp trùng (vi_tri_id, sdt, ngay_nop) không chặn được hai dòng null.
 *
 * SỬA (0080)
 *
 *   · nop_ho_so_ung_tuyen: thân 0026 NGUYÊN VĂN, chỉ đổi điều kiện thành
 *     "if v_sdt is null or not sdt_hop_le(v_sdt)" — đúng mẫu tao_dat_ban / tim_hoac_tao_khach đang dùng.
 *   · Ràng buộc mới ho_so_sdt_bat_buoc check (da_an_danh or sdt is not null): đường nào khác ghi hồ sơ
 *     (sửa thẳng, hàm sau này) cũng không để lọt sdt rỗng. ho_so_sdt_hop_le giữ nguyên.
 *
 * Phép thử, theo mục "xong" của CLAUDE.md:
 *   1  tái hiện: anon nộp với số chỉ có chữ, rỗng, dấu cách, dấu gạch, null → từ chối đúng câu, không dòng nào
 *   2  số hợp lệ (mọi dạng hay gặp) vẫn được nhận, lưu dạng chuẩn; nộp hai lần → một dòng
 *   3  ràng buộc mới: không ghi thẳng / sửa được hồ sơ chưa ẩn danh mà sdt rỗng; ẩn danh vẫn chạy
 *   4  quyền: hàm vẫn security definer + search_path, anon vẫn gọi được, anon vẫn không đọc được hồ sơ
 *   5  câu báo trên trang vi / en / ko khớp đúng câu database trả
 *   6  rà mã: 0080 chép nguyên văn 0026 trừ đúng một dòng; không hàm nào trong database còn mẫu
 *      "not sdt_hop_le(x)" thiếu "x is null or"
 */

import { join, dirname } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MIG = join(GOC, 'crm', 'supabase', 'migrations');
const LIB = join(GOC, 'web', 'src', 'lib');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — HỒ SƠ ỨNG TUYỂN KHÔNG CÓ SỐ ĐIỆN THOẠI');
const { db, duoi, duoiAnon } = await dungDatabase();

// Cổng tuyển dụng mở, tin "nhân viên sảnh" đã đăng — như test-tuyen-dung.mjs.
await db.query(`select tao_tin_tuyen_dung_mau(id) from chi_nhanh where ma = 'q1'`);
await db.query(`insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai)
                values ('hien_tuyen_dung', 'bool', true, 'da_cong_bo')`);
await db.query(`update vi_tri_tuyen_dung
                set mo_ta_vi = 'Phục vụ khách tại sảnh, hướng dẫn khách nướng lượt đầu.',
                    yeu_cau_vi = 'Chăm chỉ, giao tiếp tốt. Không cần kinh nghiệm.',
                    ca_lam = 'Ca tối 16:00–22:00', trang_thai = 'da_cong_bo'
                where ma = 'nhan-vien-sanh'`);
const VI_TRI = 'nhan-vien-sanh';
const SAI_SO = /^Số điện thoại không hợp lệ/;

/** Nộp như website: vai anon, đã đồng ý, điền form 30 giây, không IP (không vướng giới hạn 5 lần / giờ). */
async function nop(sdt, hoTen = 'Ứng Viên Thử') {
  const r = await duoiAnon(
    `select nop_ho_so_ung_tuyen(p_vi_tri_ma => $1, p_ho_ten => $2, p_sdt => $3,
                                p_dong_y => true, p_giay_tren_form => 30) as ma`, [VI_TRI, hoTen, sdt]);
  return { ma: r.rows?.[0]?.ma ?? null, loi: r.loi, maLoi: r.ma };
}
// Hồ sơ không xóa được (nhật ký hồ sơ bất biến) — mỗi nhóm dùng số riêng và đếm trước / sau.
const demHoSo = async () => Number((await db.query(`select count(*) from ho_so_ung_tuyen`)).rows[0].count);

// ===========================================================================
await nhom('1 · TÁI HIỆN — ô số điện thoại không có chữ số nào', async () => {
  const truoc = await demHoSo();
  for (const [ten, sdt] of [['chỉ có chữ', 'abc'], ['rỗng', ''], ['toàn dấu cách', '   '],
                            ['toàn dấu gạch', '---'], ['chữ có dấu', 'không có số'], ['null', null]]) {
    const r = await nop(sdt);
    ok(`TÁI HIỆN: số ${ten} (${JSON.stringify(sdt)}) → từ chối với câu "Số điện thoại không hợp lệ", mã check_violation`,
       r.ma === null && SAI_SO.test(r.loi ?? '') && r.maLoi === '23514', r.ma ? `NHẬN, mã ${r.ma}` : `${r.maLoi} ${r.loi}`);
  }
  const { rows } = await db.query(`select ma_ho_so, sdt from ho_so_ung_tuyen where sdt is null and not da_an_danh`);
  ok('TÁI HIỆN: không hồ sơ chưa ẩn danh nào có sdt rỗng', rows.length === 0, JSON.stringify(rows));
  ok('Không dòng nào được ghi', await demHoSo() === truoc);
});

// ===========================================================================
await nhom('2 · SỐ HỢP LỆ VẪN ĐƯỢC NHẬN, NỘP HAI LẦN VẪN MỘT DÒNG', async () => {
  for (const [sdt, chuan] of [['0912345678', '0912345678'], ['+84 912 345 679', '0912345679'],
                              ['84912345680', '0912345680'], ['912345681', '0912345681'], ['0912.345.682', '0912345682']]) {
    const r = await nop(sdt);
    const { rows: [h] } = r.ma ? await db.query(`select sdt from ho_so_ung_tuyen where ma_ho_so = $1`, [r.ma]) : { rows: [] };
    ok(`Số ${JSON.stringify(sdt)} được nhận, lưu dạng chuẩn ${chuan}`, !!r.ma && h?.sdt === chuan, r.loi ?? JSON.stringify(h));
  }
  // Sai dạng mà CÓ chữ số — lỗi đã được chặn từ trước, vẫn phải chặn.
  for (const sdt of ['0912 345', '12345', '0912345678x9']) {
    const r = await nop(sdt);
    ok(`Số sai dạng có chữ số ${JSON.stringify(sdt)} vẫn bị từ chối như trước`, r.ma === null && SAI_SO.test(r.loi ?? ''), r.ma ?? r.loi);
  }
  const lan1 = await nop('0987654321', 'Bấm Hai Lần');
  const lan2 = await nop('0987 654 321', 'Bấm Hai Lần');
  const { rows } = await db.query(`select count(*)::int as n from ho_so_ung_tuyen where sdt = '0987654321'`);
  ok('Bấm gửi hai lần cùng số, cùng tin, cùng ngày → lần hai bị từ chối, đúng một dòng',
     !!lan1.ma && lan2.ma === null && lan2.loi !== null && rows[0].n === 1, `${lan1.ma} · ${lan2.ma ?? lan2.loi} · ${rows[0].n} dòng`);
});

// ===========================================================================
await nhom('3 · RÀNG BUỘC ho_so_sdt_bat_buoc — mọi đường ghi, không chỉ hàm nộp', async () => {
  const { rows: rb } = await db.query(
    `select pg_get_constraintdef(oid) as dinh_nghia, convalidated from pg_constraint
     where conrelid = 'ho_so_ung_tuyen'::regclass and conname = 'ho_so_sdt_bat_buoc'`);
  ok('Ràng buộc ho_so_sdt_bat_buoc có trên ho_so_ung_tuyen, đã kiểm cả dữ liệu cũ (không "not valid")',
     rb.length === 1 && /da_an_danh OR \(sdt IS NOT NULL\)/.test(rb[0].dinh_nghia) && rb[0].convalidated === true, JSON.stringify(rb));
  const { rows: cu } = await db.query(
    `select 1 from pg_constraint where conrelid = 'ho_so_ung_tuyen'::regclass and conname = 'ho_so_sdt_hop_le'`);
  ok('Ràng buộc cũ ho_so_sdt_hop_le vẫn còn, không bị sửa', cu.length === 1);

  const { rows: [vt] } = await db.query(`select id, chi_nhanh_id from vi_tri_tuyen_dung where ma = $1`, [VI_TRI]);
  const ghiThang = sdt => db.query(
    `insert into ho_so_ung_tuyen (ma_ho_so, vi_tri_id, chi_nhanh_id, ho_ten, sdt, dong_y_noi_dung, luu_den)
     values ('BT-UV-THU-' || substr(md5(random()::text), 1, 5), $1, $2, 'Ghi Thẳng', $3, 'Đồng ý', hom_nay_vn() + 180)
     returning ma_ho_so`, [vt.id, vt.chi_nhanh_id, sdt]).then(() => null, e => e.message);
  const l = await ghiThang(null);
  ok('Ghi thẳng (vai chủ database) hồ sơ chưa ẩn danh mà sdt rỗng → bị chặn bởi ho_so_sdt_bat_buoc',
     l !== null && /ho_so_sdt_bat_buoc/.test(l), l ?? 'GHI ĐƯỢC');
  ok('Ghi thẳng hồ sơ có số hợp lệ vẫn được', await ghiThang('0912000001') === null);

  const { ma } = await nop('0912000002', 'Quản Lý Xóa Số');
  const sua = await duoi(UID.qlA, `update ho_so_ung_tuyen set sdt = null where ma_ho_so = $1 returning id`, [ma]);
  ok('Quản lý chi nhánh KHÔNG xóa trắng được số điện thoại của hồ sơ chưa ẩn danh',
     sua.loi !== null && /ho_so_sdt_bat_buoc/.test(sua.loi), sua.loi ?? `sửa được ${sua.rows?.length} dòng`);
  const doi = await duoi(UID.qlA, `update ho_so_ung_tuyen set trang_thai = 'dang_xem' where ma_ho_so = $1 returning id`, [ma]);
  ok('Quản lý vẫn đổi được trạng thái hồ sơ (dòng thường không vướng ràng buộc mới)', doi.loi === null && doi.rows?.length === 1, doi.loi ?? '');

  // Ẩn danh: sdt = null cùng lúc da_an_danh = true — ràng buộc mới phải cho qua.
  await db.query(`update ho_so_ung_tuyen set luu_den = hom_nay_vn() - 1`);
  const an = await duoi(UID.chu, `select an_danh_ho_so_het_han(array[]::text[]) as kq`);
  const { rows: [con] } = await db.query(`select count(*)::int as n from ho_so_ung_tuyen where not da_an_danh`);
  ok('Ẩn danh hồ sơ quá hạn vẫn chạy (sdt = null khi da_an_danh = true là đúng)', an.loi === null && con.n === 0,
     an.loi ?? `${con.n} hồ sơ chưa ẩn danh`);
});

// ===========================================================================
await nhom('4 · QUYỀN — hàm viết lại vẫn đúng như cũ', async () => {
  const { rows: [h] } = await db.query(
    `select p.prosecdef, p.proconfig, has_function_privilege('anon', p.oid, 'execute') as anon_goi,
            has_function_privilege('public', p.oid, 'execute') as public_goi
     from pg_proc p where p.proname = 'nop_ho_so_ung_tuyen' and p.pronamespace = 'public'::regnamespace`);
  ok('nop_ho_so_ung_tuyen vẫn security definer, set search_path = public', h?.prosecdef === true
     && (h.proconfig ?? []).includes('search_path=public'), JSON.stringify(h));
  ok('anon vẫn gọi được nop_ho_so_ung_tuyen (form công khai), public thì không', h?.anon_goi === true && h?.public_goi === false, JSON.stringify(h));
  const { rows: [{ n }] } = await db.query(`select count(*)::int as n from pg_proc where proname = 'nop_ho_so_ung_tuyen'`);
  ok('Không sinh overload: đúng một nop_ho_so_ung_tuyen', n === 1, `${n} hàm`);
  const { rows: [{ ve }] } = await db.query(
    `select has_function_privilege('anon', 've_con_hieu_luc(text)', 'execute') as ve`);
  ok('Khối chốt quyền giữ ve_con_hieu_luc cho anon (policy tải CV, 0025)', ve === true);

  await nop('0912000003', 'Ứng Viên Bí Mật');
  const doc = await duoiAnon(`select sdt from ho_so_ung_tuyen`);
  ok('anon vẫn không đọc được hồ sơ nào', doc.loi !== null || doc.rows.length === 0, doc.loi ?? JSON.stringify(doc.rows));
  const ghi = await duoiAnon(`insert into ho_so_ung_tuyen (ma_ho_so) values ('X') returning id`);
  ok('anon vẫn không ghi thẳng được vào bảng hồ sơ', ghi.loi !== null, 'GHI ĐƯỢC');
});

// ===========================================================================
await nhom('5 · CÂU BÁO TRÊN TRANG vi / en / ko', async () => {
  const { cauLoiDatabase } = await import(join(LIB, 'chu.ts'));
  const CHUNG = 'câu chung của form';
  const { loi } = await nop('abc');
  ok('Trang tiếng Việt hiện nguyên câu database: "Số điện thoại không hợp lệ: abc"',
     cauLoiDatabase(loi ?? '', 'vi', CHUNG) === 'Số điện thoại không hợp lệ: abc', loi ?? '(không lỗi)');
  ok('Trang tiếng Anh nhận bản dịch, không rơi về câu chung',
     cauLoiDatabase(loi ?? '', 'en', CHUNG) === 'The phone number is not valid.', cauLoiDatabase(loi ?? '', 'en', CHUNG));
  ok('Trang tiếng Hàn nhận bản dịch, không rơi về câu chung',
     cauLoiDatabase(loi ?? '', 'ko', CHUNG) === '전화번호가 올바르지 않아요.', cauLoiDatabase(loi ?? '', 'ko', CHUNG));
  const en = readFileSync(join(LIB, 'cau-noi-bo.ts'), 'utf8');
  ok('Câu raise exception không đổi chữ — bản tiếng Anh nội bộ ở cau-noi-bo.ts vẫn khớp',
     en.includes('[/^Số điện thoại không hợp lệ: (.+)$/'));
});

// ===========================================================================
await nhom('6 · RÀ MÃ — 0080 chép nguyên văn 0026; không hàm nào còn mẫu thiếu "is null"', async () => {
  const tep = dau => { const f = readdirSync(MIG).find(x => x.startsWith(dau)); return f ? readFileSync(join(MIG, f), 'utf8') : ''; };
  /** Nguyên văn một hàm: từ "create or replace function <ten>(" tới dòng "$$;" đầu tiên sau đó. */
  const ham = (s, ten) => {
    const i = s.indexOf(`create or replace function ${ten}(`);
    const j = i < 0 ? -1 : s.indexOf('\n$$;', i);
    return j < 0 ? '' : s.slice(i, j + 4);
  };
  const CU = '  if not sdt_hop_le(v_sdt) then';
  const MOI = '  if v_sdt is null or not sdt_hop_le(v_sdt) then';
  const cu = ham(tep('0026_'), 'nop_ho_so_ung_tuyen'), moi = ham(tep('0080_'), 'nop_ho_so_ung_tuyen');
  ok('0080 viết lại nop_ho_so_ung_tuyen = thân 0026 NGUYÊN VĂN, chỉ đổi đúng một điều kiện',
     cu.includes(CU) && moi !== '' && moi === cu.replace(CU, MOI), moi === '' ? 'không thấy hàm trong 0080' : 'thân lệch 0026');

  // Định nghĩa đang chạy trong database (sau MỌI migration) — một nhánh khác viết lại hàm từ thân cũ thì đỏ ở đây.
  const { rows } = await db.query(
    `select p.proname, p.prosrc from pg_proc p
     where p.pronamespace = 'public'::regnamespace and p.prosrc ~ 'sdt_hop_le\\s*\\('`);
  /** Đối số của sdt_hop_le( bắt đầu ở vị trí `tu`: tới dấu ) khớp — kể cả "chuan_hoa_sdt(p_sdt)". */
  const doiSo = (s, tu) => {
    let muc = 1, i = tu;
    for (; i < s.length && muc > 0; i++) muc += s[i] === '(' ? 1 : s[i] === ')' ? -1 : 0;
    return s.slice(tu, i - 1);
  };
  const gon = s => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const thieu = [];
  for (const { proname, prosrc } of rows) {
    for (const m of prosrc.matchAll(/not\s+sdt_hop_le\s*\(/gi)) {
      const x = gon(doiSo(prosrc, m.index + m[0].length));
      if (!(gon(prosrc.slice(0, m.index)) + ' ').endsWith(` ${x} is null or `)) thieu.push(`${proname}: not sdt_hop_le(${x})`);
    }
  }
  ok(`Không hàm nào trong database dùng "not sdt_hop_le(x)" mà thiếu "x is null or" (rà ${rows.length} hàm có sdt_hop_le)`,
     rows.length > 0 && thieu.length === 0, thieu.join(' | '));
});

process.exit(ketThuc('SỐ ĐIỆN THOẠI RỖNG'));
