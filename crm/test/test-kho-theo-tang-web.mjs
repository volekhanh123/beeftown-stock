/**
 * BEEFTOWN KHO — Kiểm thử web theo dõi theo tảng (0046)
 * =====================================================
 *
 *     node test/test-kho-theo-tang-web.mjs
 *
 * Hàm thuần của lib/kho/tang.ts (bảng ủ dạng chữ, tra số ngày ủ — cùng luật với
 * kho_so_ngay_u trong database, số tảng, xếp tảng) và form nhận hàng một tảng
 * (lib/kho/nhan-hang.ts). Không cần database, trừ phần so với kho_so_ngay_u.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';
import {
  docChuBangU, chuBangU, moTaBangU, soNgayU, soTangChu, sapTang, cauConU,
} from '../../web/src/lib/kho/tang.ts';
import { docFormDongNhan, dongLuuTuPhieu } from '../../web/src/lib/kho/nhan-hang.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — WEB THEO DÕI THEO TẢNG');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');

await nhom('1 · BẢNG Ủ DẠNG CHỮ', async () => {
  const a = docChuBangU('10:14, 5:18, 10');
  ok('Đọc "10:14, 5:18, 10" và xếp theo tuổi', a.loi === null && chuBangU(a.dong) === '5:18, 10:14, 10', JSON.stringify(a));
  ok('Nhận "→", "-", xuống dòng', chuBangU(docChuBangU('5 → 18\n10-14; 12').dong) === '5:18, 10:14, 12');
  ok('Trống = xoá bảng', docChuBangU('  ').dong.length === 0 && docChuBangU('').loi === null);
  ok('Hai mục "còn lại" → lỗi', docChuBangU('10, 12').loi !== null);
  ok('Tuổi trùng → lỗi', docChuBangU('5:18, 5:14').loi !== null);
  ok('Chữ lạ → lỗi có tiếng Anh', !!docChuBangU('abc').loi?.en);
  ok('Quá 365 ngày → lỗi', docChuBangU('5:400').loi !== null);
  ok('Mô tả hai thứ tiếng', /ngày tuổi/.test(moTaBangU(a.dong, 'vi')) && /days old/.test(moTaBangU(a.dong, 'en')));
});

await nhom('2 · TRA SỐ NGÀY Ủ — KHỚP kho_so_ngay_u', async () => {
  const { db, duoi } = await dungDatabase();
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  const mh = (await db.query(`select id from kho_mat_hang where ma = 'T-THANLUNG'`)).rows[0].id;
  const bang = docChuBangU('3:21, 7:17, 14:12, 8').dong;
  for (const d of bang) {
    await db.query(`insert into kho_bang_u (mat_hang_id, tuoi_den_ngay, so_ngay_u) values ($1, $2, $3)`,
                   [mh, d.tuoi_den_ngay, d.so_ngay_u]);
  }
  let khop = true, lech = '';
  for (let tuoi = -2; tuoi <= 30; tuoi++) {
    const sql = (await db.query(`select kho_so_ngay_u($1, $2) as n`, [mh, tuoi])).rows[0].n;
    if (sql !== soNgayU(bang, tuoi)) { khop = false; lech += ` ${tuoi}:${sql}/${soNgayU(bang, tuoi)}`; }
  }
  ok('soNgayU (web) = kho_so_ngay_u (database) với tuổi -2…30', khop, lech);
  ok('Không có bảng → null', soNgayU([], 5) === null);
});

await nhom('3 · SỐ TẢNG, XẾP TẢNG', async () => {
  ok('142 → "#0142"; null → ""', soTangChu(142) === '#0142' && soTangChu(null) === '' && soTangChu(12345) === '#12345');
  const x = (so, tt, con, han = '2026-10-10') => ({ so_tang: so, tinh_trang_u: tt, con_ngay_u: con, han_dung: han });
  const ds = sapTang([x(1, 'dang_u', 5), x(2, 'chua_co_bang_u', null), x(3, 'san_sang', -1), x(4, 'san_sang', -3), x(5, 'dang_u', 2)]);
  ok('Sẵn sàng (ủ xong sớm trước) → đang ủ (sắp xong trước) → chưa có bảng', ds.map(d => d.so_tang).join() === '4,3,5,1,2');
  ok('Câu "còn / hôm nay / trước"', cauConU(x(1, 'dang_u', 5)) === 'còn 5 ngày' && cauConU(x(1, 'san_sang', 0), 'en') === 'ready today'
     && cauConU(x(1, 'san_sang', -2)) === 'ủ xong 2 ngày trước' && cauConU(x(1, 'chua_co_bang_u', null)) === '');
});

await nhom('4 · FORM NHẬN MỘT TẢNG', async () => {
  const MH = '11111111-1111-4111-8111-111111111111';
  const MH2 = '22222222-2222-4222-8222-222222222222';
  const mon = new Map([[MH, { ten: 'Thăn lưng nguyên tảng', dem_goi: true, don_vi_goi: 'tảng', theo_tang: true }],
                       [MH2, { ten: 'Nạc vai nguyên tảng', dem_goi: true, don_vi_goi: 'tảng', theo_tang: false }]]);
  const form = o => ({ get: k => o[k] ?? '' });
  const thieu = docFormDongNhan(form({ mh: MH, so_kg: '6,2' }), [], mon);
  ok('Món theo tảng thiếu ngày mổ → báo (hai thứ tiếng)', thieu.luu === null && /ngày mổ/.test(thieu.loi.join()) && /slaughter/.test(thieu.loiEn.join()));
  const gop = docFormDongNhan(form({ mh: MH, so_kg: '18', so_goi: '3', ngay_mo: '2026-09-20' }), [], mon);
  ok('Món theo tảng ghi 3 tảng một dòng → báo', gop.luu === null && /mỗi tảng một dòng/.test(gop.loi.join()));
  const dung = docFormDongNhan(form({ mh: MH, so_kg: '6,2', ngay_mo: '2026-09-20' }), [], mon);
  ok('Hợp lệ: so_goi tự là 1, có ngay_mo', dung.luu?.so_goi === 1 && dung.luu?.ngay_mo === '2026-09-20' && dung.luu?.so_kg === 6.2, JSON.stringify(dung));
  const sai = docFormDongNhan(form({ mh: MH, so_kg: '6', ngay_mo: '2026-02-31' }), [], mon);
  ok('Ngày mổ không có thật → báo', sai.luu === null && /Ngày mổ không phải ngày có thật/.test(sai.loi.join()));
  const thuong = docFormDongNhan(form({ mh: MH2, so_kg: '9', so_goi: '2' }), [], mon);
  ok('Món thường: không cần ngày mổ, không gửi khóa ngay_mo', thuong.luu?.so_goi === 2 && !('ngay_mo' in thuong.luu));
  const thieuGoi = docFormDongNhan(form({ mh: MH2, so_kg: '9' }), [], mon);
  ok('Món thường đếm tảng vẫn phải nhập số tảng', thieuGoi.luu === null);
  const cu = { mat_hang_id: MH, so_kg: 6.2, so_goi: 1, so_lo_ncc: null, ngay_san_xuat: null, han_dung: '2026-10-20',
               truong_them: {}, ngay_mo: '2026-09-20' };
  ok('Gửi lại dòng đã lưu giữ ngày mổ', dongLuuTuPhieu(cu).ngay_mo === '2026-09-20');
  ok('Dòng không có ngày mổ thì không gửi khóa', !('ngay_mo' in dongLuuTuPhieu({ ...cu, ngay_mo: null })));
});

await nhom('5 · TRANG', async () => {
  const nhan = doc('web/src/pages/noi-bo/kho/nhan-hang/[id].astro');
  ok('Form nhận hàng có ô ngày mổ khi có món theo tảng', /coTheoTang && \(/.test(nhan) && /name="ngay_mo"/.test(nhan));
  ok('Thêm tảng xong điền sẵn món và ngày mổ cho tảng tiếp', /\?tiep=\$\{r\.luu\.mat_hang_id\}&mo=/.test(nhan));
  const form = doc('web/src/components/kho/FormMatHang.astro');
  ok('Form mặt hàng có "Theo dõi theo tảng" và "Bảng ủ"', /name="theo_tang"/.test(form) && /name="bang_u"/.test(form));
  const tang = doc('web/src/pages/noi-bo/kho/tang/index.astro');
  ok('Màn Tảng · ủ đọc kho_v_tang qua docTangTon, không có tiền', /docTangTon/.test(tang) && !/gia_von|xem_gia/.test(tang));
});

process.exit(ketThuc('WEB THEO DÕI THEO TẢNG'));
