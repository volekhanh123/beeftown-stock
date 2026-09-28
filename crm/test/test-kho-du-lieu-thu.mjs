/**
 * BEEFTOWN KHO — KIỂM THỬ SCRIPT DỮ LIỆU THỬ (crm/supabase/thu)
 * =============================================================
 *     node test/test-kho-du-lieu-thu.mjs
 *
 * Chạy tao-du-lieu-kho.sql rồi xoa-du-lieu-kho.sql trên database dựng từ đủ
 * migration, với auth.uid() đúng như Supabase (đọc request.jwt.claims) — vì
 * script tự đóng vai nhân sự bằng claims chứ không qua khung duoi().
 *
 * Kiểm: đủ dữ liệu, sổ kho khớp tồn, bán theo ô trúng lô tảng, có lệch ô,
 * có dòng chờ ghép, việc đang chờ; lệnh xoá sạch mà giữ cài đặt; tạo lại
 * được; và chốt an toàn chặn database có chi nhánh thật.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const THU = join(__dirname, '..', 'supabase', 'thu');
const TAO = readFileSync(join(THU, 'tao-du-lieu-kho.sql'), 'utf8');
const XOA = readFileSync(join(THU, 'xoa-du-lieu-kho.sql'), 'utf8');

const { ok, nhom, ketThuc } = taoBoDem('KHO · DỮ LIỆU THỬ: TẠO / XOÁ');
const { db, cnA, duoi } = await dungDatabase();

// auth.uid() đọc claim sub như Supabase thật (script đóng vai bằng claims);
// không có claim thì lấy phiên của khung test để duoi() vẫn dùng được.
await db.exec(`
  create or replace function auth.uid() returns uuid language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub',
                    (select uid::text from auth._phien limit 1))::uuid
  $$;
  update chi_nhanh set ten = ten || ' (BẢN THỬ)';
`);

const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];
const so = async (sql, p = []) => Number(Object.values(await mot(sql, p))[0]);
const chay = async sql => { try { await db.exec(sql); return null; } catch (e) { return e.message; } };

// ===========================================================================
await nhom('1 · TẠO DỮ LIỆU', async () => {
  const t0 = Date.now();
  const loi = await chay(TAO);
  ok('Script tạo chạy hết không lỗi', loi === null, loi ?? '');
  console.log(`    (mất ${((Date.now() - t0) / 1000).toFixed(1)} giây)`);
  ok('Chạy xong trở lại postgres (không kẹt vai authenticated)',
     (await mot(`select current_user as u`)).u === 'postgres');

  const loiBo = (await db.query(`select * from pg_temp.t_loi order by ngay`)).rows;
  for (const l of loiBo.slice(0, 10)) console.log(`    · ${l.ngay?.toISOString?.().slice(0, 10)} ${l.buoc}: ${l.loi}`);
  ok('Mọi bước mô phỏng đều chạy được (không lỗi bỏ qua)', loiBo.length === 0, `${loiBo.length} lỗi`);

  const t = await mot(`select
    (select count(*) from kho_mat_hang)::int mh, (select count(*) from kho_mat_hang where theo_tang)::int tang,
    (select count(*) from kho_o_ma)::int o, (select count(*) from kho_nha_cung_cap)::int ncc,
    (select count(*) from kho_lo where so_tang is not null)::int so_tang,
    (select count(*) from kho_phien_pha where trang_thai = 'da_chot')::int loc,
    (select count(*) from kho_ipos_hoa_don)::int hd,
    (select count(*) from kho_ipos_dong where trang_thai = 'da_ghi')::int da_ghi,
    (select count(*) from kho_thanh_toan)::int tt,
    (select count(*) from kho_phieu_xuat where loai = 'huy' and trang_thai = 'da_duyet')::int huy`);
  console.log('    ' + JSON.stringify(t));
  ok('≥ 70 mặt hàng, 14 món theo tảng, 6 NCC, có ô mã', t.mh >= 70 && t.tang === 14 && t.ncc === 6 && t.o >= 100);
  ok('≥ 40 tảng có số, ≥ 30 phiên lóc đã chốt', t.so_tang >= 40 && t.loc >= 30);
  ok('≥ 150 hoá đơn iPOS, ≥ 300 dòng đã trừ kho', t.hd >= 150 && t.da_ghi >= 300);
  ok('Có trả nợ NCC và huỷ hàng quá hạn đã duyệt', t.tt >= 3 && t.huy >= 1);
});

// ===========================================================================
await nhom('2 · SỔ KHO KHỚP TỒN, NGÀY THÁNG ĐÚNG', async () => {
  ok('Tồn = tổng sổ kho theo từng lô và vị trí', await so(`
    select count(*) from (select lo_id, vi_tri_id, sum(so_kg) kg, sum(so_goi) g from kho_so_cai group by 1, 2) s
    full join kho_ton t using (lo_id, vi_tri_id)
    where coalesce(s.kg, 0) <> coalesce(t.so_kg, 0) or coalesce(s.g, 0) <> coalesce(t.so_goi, 0)`) === 0);
  ok('Không có tồn âm', await so(`select count(*) from kho_ton where so_kg < 0 or so_goi < 0`) === 0);
  ok('Sổ kho không có ngày sau hôm nay', await so(`select count(*) from kho_so_cai where ngay > hom_nay_vn()`) === 0);
  ok('Có sổ kho trải trên ≥ 25 ngày (5 tuần, trừ ngày không giao hàng)', await so(`select count(distinct ngay) from kho_so_cai`) >= 25);
  ok('Bán ghi đúng ngày trên hoá đơn', await so(`
    select count(*) from kho_so_cai s join kho_ipos_dong d on d.id = s.chung_tu_id
    where s.loai = 'ban' and s.ngay <> (d.thoi_diem_ban at time zone 'Asia/Ho_Chi_Minh')::date`) === 0);
  ok('Phiếu chuyển quầy mang ngày mô phỏng (không dồn hết vào hôm nay)', await so(`
    select count(distinct ngay) from kho_phieu_xuat where loai = 'chuyen'`) >= 5);
  ok('Mã lô theo ngày đóng gói, không trùng', await so(`
    select count(*) from kho_lo where ma_lo <> 'L' || to_char(ngay_dong_goi, 'YYMMDD') || '-' || right(ma_lo, 3)`) === 0
    && await so(`select count(*) - count(distinct ma_lo) from kho_lo`) === 0);
  ok('Repack: tảng nhập theo kg sau repack, giá vốn chia trên kg còn lại', await so(`
    select count(*) from kho_phieu_nhap_dong d join kho_mat_hang m on m.id = d.mat_hang_id
    where m.theo_tang and (d.so_kg_thuc is null or d.so_kg_thuc >= d.so_kg)`) === 0);
});

// ===========================================================================
await nhom('3 · BÁN THEO Ô, LỆCH Ô, CHỜ GHÉP, VIỆC ĐANG CHỜ', async () => {
  const trung = await so(`select count(*) from kho_ipos_dong where o_ma_id is not null and not lech_o and lo_o_id is not null
                          and trang_thai = 'da_ghi'`);
  ok('Nhiều dòng bán quét tem ô trừ đúng lô tảng', trung >= 100, String(trung));
  ok('Sổ bán của dòng theo ô trừ đúng lô của ô', await so(`
    select count(*) from kho_ipos_dong d join kho_so_cai s on s.chung_tu_id = d.id and s.loai = 'ban'
    where d.o_ma_id is not null and not d.lech_o and s.lo_id <> d.lo_o_id`) === 0);
  ok('Có dòng lệch ô (tem in nhầm ô trống)', await so(`select count(*) from kho_ipos_dong where lech_o`) >= 1);
  ok('Có dòng chờ ghép mã (nước suối, túi giữ lạnh)', await so(`select count(*) from kho_ipos_dong where trang_thai = 'chua_khop'`) >= 1);
  ok('Món bếp chỉ đếm suất (bỏ qua)', await so(`select count(*) from kho_ipos_dong where trang_thai = 'bo_qua'`) >= 10);
  ok('Có hoá đơn bị huỷ sau khi bán', await so(`select count(*) from kho_ipos_hoa_don where da_huy`) >= 1);
  ok('1 phiếu nhập chờ duyệt, 1 phiếu nháp', await so(`select count(*) from kho_phieu_nhap where trang_thai = 'cho_duyet'`) === 1
     && await so(`select count(*) from kho_phieu_nhap where trang_thai = 'nhap'`) === 1);
  ok('1 phiếu huỷ chờ duyệt, 1 yêu cầu quầy đang mở',
     await so(`select count(*) from kho_phieu_xuat where loai = 'huy' and trang_thai = 'cho_duyet'`) === 1
     && await so(`select count(*) from kho_yeu_cau_quay where trang_thai = 'cho'`) === 1);
  ok('Có tảng đang ủ, tảng chờ lóc, tảng sắp hết hạn', await so(`
    select (count(*) filter (where l.ngay_u_xong > hom_nay_vn()) > 0 and count(*) filter (where l.ngay_u_xong <= hom_nay_vn()) > 0
            and count(*) filter (where l.han_dung <= hom_nay_vn() + 2) > 0)::int
    from kho_ton t join kho_lo l on l.id = t.lo_id where l.so_tang is not null and t.so_kg > 0`) === 1);
  ok('Có lô quá hạn còn ở quầy (hiện cảnh báo)', await so(`
    select count(*) from kho_ton t join kho_lo l on l.id = t.lo_id join kho_vi_tri v on v.id = t.vi_tri_id
    where v.loai = 'quay' and l.han_dung < hom_nay_vn() and t.so_goi > 0`) >= 1);

  const ncc = await duoi(UID.chu, `select ten, hao_repack_pt from kho_bao_cao_ncc($1, hom_nay_vn() - 60, hom_nay_vn())
                                   where hao_repack_pt is not null order by hao_repack_pt`, [cnA.id]);
  ok('Báo cáo NCC có hao repack, nhà tốt < nhà kém', !ncc.loi && ncc.rows.length >= 4
     && Number(ncc.rows[0].hao_repack_pt) < 1 && Number(ncc.rows.at(-1).hao_repack_pt) > 2.5,
     ncc.loi ?? JSON.stringify(ncc.rows));
  const tang = await duoi(UID.chu, `select count(*)::int n from kho_bao_cao_tang($1, hom_nay_vn() - 60, hom_nay_vn())`, [cnA.id]);
  ok('Báo cáo theo tảng có số', !tang.loi && tang.rows[0].n >= 30, tang.loi ?? String(tang.rows[0].n));
});

// ===========================================================================
await nhom('4 · XOÁ SẠCH, GIỮ CÀI ĐẶT, TẠO LẠI', async () => {
  const viTri = await so(`select count(*) from kho_vi_tri`);
  const lyDo = await so(`select count(*) from kho_ly_do`);
  const loi = await chay(XOA);
  ok('Script xoá chạy không lỗi', loi === null, loi ?? '');
  const con = await so(`select (select count(*) from kho_mat_hang) + (select count(*) from kho_nha_cung_cap)
    + (select count(*) from kho_lo) + (select count(*) from kho_so_cai) + (select count(*) from kho_ton)
    + (select count(*) from kho_ipos_dong) + (select count(*) from kho_ipos_cau_hinh) + (select count(*) from kho_so_thu_tu)
    + (select count(*) from kho_mon) + (select count(*) from kho_thanh_toan)`);
  ok('Kho trống (mặt hàng, NCC, lô, sổ, tồn, iPOS, số phiếu, món, công nợ)', con === 0, String(con));
  ok('Vị trí, lý do, cài đặt kho còn nguyên', await so(`select count(*) from kho_vi_tri`) === viTri
     && await so(`select count(*) from kho_ly_do`) === lyDo && await so(`select count(*) from kho_cai_dat`) >= 1);
  ok('Nguồn số bán trở về đếm quầy', await so(`select count(*) from kho_cai_dat where nguon_so_ban <> 'kiem_ke'`) === 0);

  const lai = await chay(TAO);
  ok('Tạo lại lần hai chạy được', lai === null, lai ?? '');
  ok('Lần hai đủ mặt hàng và bán hàng', await so(`select count(*) from kho_mat_hang`) >= 70
     && await so(`select count(*) from kho_ipos_dong where trang_thai = 'da_ghi'`) >= 300);
  const lan3 = await chay(TAO);
  ok('Chạy tạo khi kho chưa trống → dừng, báo xoá trước', /chưa trống/.test(lan3 ?? ''), lan3 ?? '');
});

// ===========================================================================
await nhom('5 · CHỐT AN TOÀN: DATABASE CÓ CHI NHÁNH THẬT', async () => {
  await db.exec(`insert into chi_nhanh (ma, ten) values ('q9', 'Beeftown Thảo Điền')`);
  const truoc = await so(`select count(*) from kho_mat_hang`);
  const x = await chay(XOA);
  ok('Script xoá dừng, không xoá gì', /BẢN THỬ/.test(x ?? '') && await so(`select count(*) from kho_mat_hang`) === truoc, x ?? '');
  const t = await chay(TAO);
  ok('Script tạo dừng', /BẢN THỬ/.test(t ?? ''), t ?? '');
});

process.exit(ketThuc('DỮ LIỆU THỬ'));
