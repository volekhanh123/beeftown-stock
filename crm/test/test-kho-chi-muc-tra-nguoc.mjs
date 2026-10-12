/**
 * BEEFTOWN KHO — Kiểm thử: chỉ mục tra ngược của kho, và số liệu sức khỏe không quét cả nhat_ky_tin
 * (migration 0071, 0072)
 * =================================================================================================
 *
 *     node test/test-kho-chi-muc-tra-nguoc.mjs
 *
 * Rà soát nợ kỹ thuật 11/10/2026: năm khóa ngoại kho được TRA NGƯỢC (truy vết lô → phiếu nhập, phiên
 * pha → lô ra, trả NCC → phiếu nhập, lô → dòng xuất / phiên pha đã dùng nó) mà không có chỉ mục mở đầu
 * bằng cột đó — mỗi lần tra là quét cả bảng, bảng lớn dần theo ngày. Và suc_khoe_so_lieu (0063), chạy
 * mỗi 5 phút trong lượt báo động, lọc nhat_ky_tin bằng
 *     chi_nhanh_id = … and (ket_qua = 'cho_gui' or coalesce(gui_luc, gui_sau, created_at) > now() - 24 giờ)
 * — không chỉ mục nào khớp vế sau, nên quét cả bảng tin Zalo (mọi tin từng gửi).
 *
 * Kiểm bằng EXPLAIN: với enable_seqscan = off, planner dùng chỉ mục nếu có — không có thì vẫn phải
 * Seq Scan. nhat_ky_tin: 20.000 tin cũ, analyze, planner tự chọn (không ép).
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem } from './kho-chung.mjs';

const MIG = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'migrations');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — CHỈ MỤC TRA NGƯỢC (0071, 0072)');
const { db, cnA } = await dungDatabase();

const keHoach = async (sql, p = []) => (await db.query(`explain ${sql}`, p)).rows.map(r => r['QUERY PLAN']).join('\n');
const UUID = '00000000-0000-4000-8000-00000000abcd';

// ===========================================================================
await nhom('1 · NĂM KHÓA NGOẠI KHO TRA NGƯỢC ĐI QUA CHỈ MỤC', async () => {
  await db.exec(`set enable_seqscan = off`);
  for (const [bang, cot, viec] of [
    ['kho_lo', 'phien_pha_id', 'phiên pha → các lô nó tạo ra'],
    ['kho_lo', 'phieu_nhap_dong_id', 'dòng phiếu nhập → lô'],
    ['kho_phieu_xuat', 'phieu_nhap_id', 'phiếu nhập → phiếu trả NCC'],
    ['kho_phieu_xuat_dong', 'lo_id', 'lô → mọi dòng xuất của nó (truy vết)'],
    ['kho_phien_pha_vao', 'lo_id', 'lô → phiên pha đã dùng nó'],
  ]) {
    // Chỉ mục có cột ĐẦU là cột này. Btree cho dùng cột thứ hai làm "Index Cond" (quét cả chỉ mục rồi lọc) —
    // kho_phien_pha_vao_duy_nhat (phien_pha_id, lo_id, …) là vậy — nên đòi đúng chỉ mục mở đầu bằng cột.
    const { rows: chiMuc } = await db.query(`
      select c.relname from pg_index i join pg_class c on c.oid = i.indexrelid
      join pg_attribute a on a.attrelid = i.indrelid and a.attnum = i.indkey[0]
      where i.indrelid = $1::regclass and a.attname = $2`, [bang, cot]);
    const kh = await keHoach(`select * from ${bang} where ${cot} = '${UUID}'`);
    ok(`${bang}.${cot} (${viec}): có chỉ mục mở đầu bằng cột này, và tra bằng nó`,
       chiMuc.length > 0 && chiMuc.some(c => new RegExp(`(using|on) ${c.relname}\\b`).test(kh)) && !/Seq Scan/.test(kh),
       `${chiMuc.map(c => c.relname).join(', ') || 'không có chỉ mục'} · ${kh.replace(/\n/g, ' | ')}`);
  }
  await db.exec(`set enable_seqscan = on`);   // PGlite: `reset` không trả về on
});

// ===========================================================================
await nhom('2 · SỐ LIỆU SỨC KHỎE (mỗi 5 phút) KHÔNG QUÉT CẢ BẢNG TIN ZALO', async () => {
  const VE = `t.chi_nhanh_id = $1
          and (t.ket_qua = 'cho_gui' or coalesce(t.gui_luc, t.gui_sau, t.created_at) > now() - interval '24 hours')`;
  // Câu lọc phải còn đúng như trong suc_khoe_so_lieu — đổi hàm thì sửa cả bài này.
  const { rows: [{ d }] } = await db.query(`select pg_get_functiondef('suc_khoe_so_lieu(uuid[],jsonb)'::regprocedure) d`);
  ok('suc_khoe_so_lieu vẫn lọc nhat_ky_tin bằng đúng điều kiện này',
     d.replace(/\s+/g, ' ').includes(VE.replace('$1', 'v_cn.id').replace(/\s+/g, ' ')));

  const { rows: [kh0] } = await db.query(`select * from tim_hoac_tao_khach('0900000000', 'Khách tin')`);
  await db.query(`insert into nhat_ky_tin (chi_nhanh_id, khach_hang_id, sdt_gui, noi_dung, ket_qua, created_at, gui_luc)
                  select $1, $2, '0900000000', 'tin cũ', 'da_gui', now() - (i || ' hours')::interval, now() - (i || ' hours')::interval
                  from generate_series(30, 20029) i`, [cnA.id, kh0.id]);
  await db.query(`insert into nhat_ky_tin (chi_nhanh_id, khach_hang_id, sdt_gui, noi_dung, ket_qua, created_at)
                  values ($1, $2, '0900000000', 'tin chờ', 'cho_gui', now()), ($1, $2, '0900000000', 'tin vừa gửi', 'da_gui', now())`,
                 [cnA.id, kh0.id]);
  await db.query('analyze nhat_ky_tin');
  const kh = await keHoach(`select count(*) from nhat_ky_tin t where ${VE}`, [cnA.id]);
  ok('20.000 tin cũ: planner tự chọn chỉ mục, không Seq Scan nhat_ky_tin', !/Seq Scan on nhat_ky_tin/.test(kh), kh.replace(/\n/g, ' | '));
  const { rows: [{ n }] } = await db.query(`select count(*)::int n from nhat_ky_tin t where ${VE}`, [cnA.id]);
  ok('…và vẫn đếm đúng 2 tin (tin chờ + tin trong 24 giờ)', n === 2, `${n}`);

  const tep = readFileSync(join(MIG, '0072_bao_dong_don_nhat_ky.sql'), 'utf8');
  ok('Chỉ mục mới nằm ở migration 0072 (không sửa migration cũ)', /nhat_ky_tin_moc_idx/.test(tep));
});

process.exit(ketThuc('CHỈ MỤC TRA NGƯỢC'));
