/**
 * BEEFTOWN KHO — Kiểm thử phần web của Nợ đầu kỳ (GĐ5e)
 * =====================================================
 *
 *     node test/test-kho-cong-no-web.mjs
 *
 * Hàm thuần trong web/src/lib/kho/cong-no.ts (trang /noi-bo/kho/cong-no/no-dau)
 * và một vòng thật trên database (PGlite): dòng web gửi đi được
 * kho_ghi_no_dau_ky (0035) nhận đúng, phiếu ND- hiện trong công nợ.
 *
 *   · Nhận ra phiếu nợ đầu kỳ (ND-), link không trỏ vào trang phiếu nhập.
 *   · Lưới: dòng trống bỏ qua, số tiền / hạn sai báo theo tên nhà cung cấp,
 *     nhà cung cấp đã ghi thì chặn trước.
 *   · Dán Excel: có / không tiêu đề, khớp theo tên không dấu và mã số thuế,
 *     ngày 31/10/2026, dòng lặp, nhà cung cấp lạ, số tiền có dấu phẩy.
 *   · Dòng gửi database chỉ có khóa hàm nhận.
 *   · Các trang công nợ: link "Nợ đầu kỳ", nút "Không có nợ đầu kỳ", phiếu
 *     ND- không trỏ /nhap/, không đối chiếu, không trả hàng.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';
import {
  laNoDau, tenLoaiCongNo, linkPhieuCongNo, docFormNoDau, xemTruocNoDau, dongGuiNoDau, docDanNoDau,
  docNgayDan, chuanTenNcc, TOI_DA_DONG_NO_DAU,
} from '../../web/src/lib/kho/cong-no.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ WEB NỢ ĐẦU KỲ');

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TRANG = join(GOC, 'web', 'src', 'pages', 'noi-bo', 'kho', 'cong-no');
const docTrang = f => readFileSync(join(TRANG, f), 'utf8');
const U = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const formTu = obj => new Map(Object.entries(obj));

const NCC = [
  { id: U(1), ten: 'Công ty Thịt Bò Úc', ma_so_thue: '0312345678', so_ngay_no: 15, dang_dung: true },
  { id: U(2), ten: 'NCC Mỹ', ma_so_thue: null, so_ngay_no: 30, dang_dung: true },
  { id: U(3), ten: 'Bò Nhật', ma_so_thue: '0398765432-001', so_ngay_no: 7, dang_dung: true },
  { id: U(4), ten: 'NCC cũ', ma_so_thue: null, so_ngay_no: 0, dang_dung: false },
];

// ===========================================================================
await nhom('1 · NHẬN RA PHIẾU NỢ ĐẦU KỲ', async () => {
  ok('ND-2610-0001 là nợ đầu kỳ', laNoDau({ so_phieu: 'ND-2610-0001' }));
  ok('PN-, TD- không phải', !laNoDau({ so_phieu: 'PN-2610-0001' }) && !laNoDau({ so_phieu: 'TD-2610-0001' }) && !laNoDau({ so_phieu: null }));
  ok('Tên loại', tenLoaiCongNo({ so_phieu: 'ND-1' }) === 'Nợ đầu kỳ' && tenLoaiCongNo({ so_phieu: 'PN-1' }) === 'Nhập mua');
  const p = { id: U(9), so_phieu: 'ND-2610-0001', nha_cung_cap_id: U(1) };
  ok('Link phiếu ND- về công nợ của nhà cung cấp (không có trang phiếu nhập)',
     linkPhieuCongNo(p) === `/noi-bo/kho/cong-no/${U(1)}#p-${U(9)}`, linkPhieuCongNo(p));
  ok('Phiếu mua vẫn mở trang phiếu nhập', linkPhieuCongNo({ ...p, so_phieu: 'PN-1' }) === `/noi-bo/kho/nhap/${U(9)}`);
});

// ===========================================================================
await nhom('2 · LƯỚI: ĐỌC FORM, XEM TRƯỚC', async () => {
  const f = formTu({
    so_dong: '4',
    n0_ncc: U(1), n0_tien: '12.500.000', n0_han: '2026-10-31', n0_hd: 'HD001', n0_gc: '',
    n1_ncc: U(2), n1_tien: '', n1_han: '', n1_hd: '', n1_gc: '',
    n2_ncc: U(3), n2_tien: '3500000đ', n2_han: '', n2_hd: '', n2_gc: 'theo biên bản',
    n3_ncc: 'khong-phai-id', n3_tien: '1', n3_han: '', n3_hd: '', n3_gc: '',
  });
  const g = docFormNoDau(f);
  ok('Dòng không gõ gì và id hỏng bị bỏ', Object.keys(g).join() === [U(1), U(3)].join(), Object.keys(g).join());
  const xt = xemTruocNoDau(NCC, g);
  ok('Không lỗi', xt.loi.length === 0, xt.loi.join(' · '));
  ok('Số tiền đọc kiểu tiền Việt (chấm, chữ đ)', xt.dong[0].so_tien === 12500000 && xt.dong[1].so_tien === 3500000);
  ok('Hạn trống → null (database tự tính theo số ngày nợ)', xt.dong[0].han_thanh_toan === '2026-10-31' && xt.dong[1].han_thanh_toan === null);
  ok('Tổng', xt.tong === 16000000);
  ok('Số hóa đơn, ghi chú trống → null', xt.dong[0].ghi_chu === null && xt.dong[1].so_hoa_don === null && xt.dong[1].ghi_chu === 'theo biên bản');

  const sai = xemTruocNoDau(NCC, {
    [U(1)]: { tien: 'mười triệu', han: '', hd: '', gc: '' },
    [U(2)]: { tien: '0', han: '', hd: '', gc: '' },
    [U(3)]: { tien: '', han: '', hd: 'HD9', gc: '' },
  });
  ok('Số tiền sai / bằng 0 / chưa ghi → báo theo tên nhà cung cấp', sai.loi.length === 3
     && sai.loi[0].startsWith('Công ty Thịt Bò Úc:') && sai.loi[1].startsWith('NCC Mỹ:') && /chưa ghi số tiền/.test(sai.loi[2]), sai.loi.join(' | '));
  const han = xemTruocNoDau(NCC, { [U(1)]: { tien: '100', han: '2026-02-30', hd: '', gc: '' } });
  ok('Hạn không có thật → báo', han.loi.length === 1 && /hạn trả/.test(han.loi[0]));
  const daGhi = xemTruocNoDau(NCC, { [U(1)]: { tien: '100', han: '', hd: '', gc: '' } }, new Map([[U(1), 'ND-2610-0001']]));
  ok('Nhà cung cấp đã có ND- → chặn trước, nêu số phiếu', daGhi.loi.length === 1 && daGhi.loi[0].includes('ND-2610-0001') && daGhi.dong.length === 0);
  const la = xemTruocNoDau(NCC, { [U(77)]: { tien: '100', han: '', hd: '', gc: '' } });
  ok('Nhà cung cấp không có trong danh mục → báo tải lại', la.loi.length === 1 && /tải lại/.test(la.loi[0]));
  const dai = xemTruocNoDau(NCC, { [U(1)]: { tien: '100', han: '', hd: 'x'.repeat(61), gc: '' } });
  ok('Số hóa đơn quá 60 ký tự → báo (như database)', dai.loi.length === 1);
  ok('Tối đa 300 dòng như database', TOI_DA_DONG_NO_DAU === 300);
});

// ===========================================================================
await nhom('3 · DÒNG GỬI DATABASE', async () => {
  const d = dongGuiNoDau([
    { nha_cung_cap_id: U(1), ten: 'A', so_tien: 100, han_thanh_toan: null, so_hoa_don: null, ghi_chu: null },
    { nha_cung_cap_id: U(2), ten: 'B', so_tien: 200, han_thanh_toan: '2026-10-01', so_hoa_don: 'HD1', ghi_chu: 'gc' },
  ]);
  ok('Chỉ khóa có giá trị, không có "ten"', JSON.stringify(d[0]) === JSON.stringify({ nha_cung_cap_id: U(1), so_tien: 100 }), JSON.stringify(d[0]));
  ok('Đủ khóa khi có', Object.keys(d[1]).sort().join() === 'ghi_chu,han_thanh_toan,nha_cung_cap_id,so_hoa_don,so_tien');
  ok('Số tiền là số (database đòi kiểu number)', typeof d[1].so_tien === 'number');
  const mig = readFileSync(join(GOC, 'crm', 'supabase', 'migrations', '0035_kho_dau_ky_thiet_lap.sql'), 'utf8');
  const m = /c_khoa\s+constant text\[\] := array\[([^\]]+)\]/.exec(mig);
  const khoaDb = m ? [...m[1].matchAll(/'([a-z_]+)'/g)].map(x => x[1]).sort().join() : '';
  ok('Các khóa web gửi = các khóa kho_ghi_no_dau_ky nhận', khoaDb === Object.keys(d[1]).sort().join(), khoaDb);
});

// ===========================================================================
await nhom('4 · DÁN TỪ EXCEL', async () => {
  ok('Ngày Excel', docNgayDan('31/10/2026') === '2026-10-31' && docNgayDan('1-2-2027') === '2027-02-01'
     && docNgayDan('2026-10-31') === '2026-10-31' && docNgayDan('') === null && docNgayDan('31/02/2026') === undefined);
  ok('Tên không dấu', chuanTenNcc('Công ty  Thịt Bò Úc') === 'cong ty thit bo uc');

  const coTieuDe = docDanNoDau(
    'Số tiền (đ)\tNhà cung cấp\tHạn trả\tGhi chú\tCột lạ\n'
    + '12,500,000\tcong ty thit bo uc\t31/10/2026\tBB 30/09\tx\n'
    + '3.000.000\tNCC Mỹ\t\t\t\n', NCC);
  ok('Có tiêu đề: cột thứ tự nào cũng được, không lỗi', coTieuDe.loi.length === 0, coTieuDe.loi.join(' | '));
  ok('Khớp tên không dấu', coTieuDe.giaTri[U(1)]?.tien === '12,500,000' && coTieuDe.giaTri[U(1)]?.han === '2026-10-31' && coTieuDe.giaTri[U(1)]?.gc === 'BB 30/09');
  ok('Cột không hiểu được nêu ra', coTieuDe.boQua.join() === 'Cột lạ');
  const xt = xemTruocNoDau(NCC, coTieuDe.giaTri);
  ok('Số tiền có dấu phẩy nghìn đọc đúng (không tách cột bằng dấu phẩy)', xt.loi.length === 0 && xt.dong[0].so_tien === 12500000 && xt.tong === 15500000, xt.loi.join());

  const khongTieuDe = docDanNoDau('0398765432-001\t5000000\n0312345678\t1000000\t2026-11-01\tHD7', NCC);
  ok('Không tiêu đề: theo thứ tự Nhà cung cấp, Số tiền, Hạn, Số hóa đơn; khớp mã số thuế',
     khongTieuDe.loi.length === 0 && khongTieuDe.giaTri[U(3)]?.tien === '5000000' && khongTieuDe.giaTri[U(1)]?.hd === 'HD7', khongTieuDe.loi.join());

  const loi = docDanNoDau('NCC Mỹ\t100\nncc my\t200\nKhông ai cả\t1\nNCC cũ\t5\n\tchỉ tiền\nBò Nhật\t1\t32/13/2026', NCC);
  ok('Lặp nhà cung cấp → báo dòng trước', loi.loi.some(l => /^Dòng 2: NCC Mỹ đã có ở dòng 1/.test(l)), loi.loi.join(' | '));
  ok('Nhà cung cấp lạ / ngừng dùng → báo, chỉ chỗ thêm', loi.loi.filter(l => /không thấy nhà cung cấp/.test(l)).length === 2);
  ok('Thiếu tên → báo', loi.loi.some(l => /^Dòng 5: thiếu tên/.test(l)));
  ok('Hạn không hiểu → báo', loi.loi.some(l => /^Dòng 6 \(Bò Nhật\): hạn trả/.test(l)));
  ok('Dòng đúng vẫn được điền vào lưới', Object.keys(loi.giaTri).join() === U(2) && loi.giaTri[U(2)].tien === '100');

  const trung = docDanNoDau('NCC Mỹ\t1', [...NCC, { id: U(5), ten: 'NCC  mỹ', ma_so_thue: null, so_ngay_no: 0, dang_dung: true }]);
  ok('Hai nhà cung cấp cùng tên → đòi mã số thuế', trung.loi.length === 1 && /mã số thuế/.test(trung.loi[0]));
  const tieuDeThieu = docDanNoDau('Nhà cung cấp\tGhi chú\nNCC Mỹ\tx', NCC);
  ok('Tiêu đề thiếu cột Số tiền → báo', tieuDeThieu.loi.length === 1 && /Số tiền/.test(tieuDeThieu.loi[0]));
  ok('Ô dán trống → không có gì', Object.keys(docDanNoDau(' \n\n', NCC).giaTri).length === 0);
});

// ===========================================================================
await nhom('5 · VÒNG THẬT: WEB → kho_ghi_no_dau_ky → CÔNG NỢ', async () => {
  const { db, cnA, duoi } = await dungDatabase();
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  const them = async (ten, mst, soNgay) => (await duoi(UID.keToanA,
    `insert into kho_nha_cung_cap (ten, ma_so_thue, so_ngay_no) values ($1, $2, $3) returning id, ten, ma_so_thue, so_ngay_no, dang_dung`,
    [ten, mst, soNgay])).rows[0];
  const ds = [await them('Công ty Thịt Bò Úc', '0312345678', 15), await them('NCC Mỹ', null, 30)];
  const dan = docDanNoDau('Nhà cung cấp\tSố tiền\tHạn trả\n0312345678\t12.500.000\t31/10/2026\nncc my\t3000000\t', ds);
  const xt = xemTruocNoDau(ds, dan.giaTri);
  ok('Dán → xem trước không lỗi', dan.loi.length === 0 && xt.loi.length === 0, [...dan.loi, ...xt.loi].join());
  const luot = maGui();
  const ghi = () => duoi(UID.keToanA, `select kho_ghi_no_dau_ky(p_chi_nhanh_id => $1, p_ma_gui => $2, p_dong => $3::jsonb) as kq`,
    [cnA.id, luot, JSON.stringify(dongGuiNoDau(xt.dong))]);
  const r = await ghi();
  ok('Database nhận đúng dòng web gửi', r.loi === null && r.rows[0].kq.phieu.length === 2, r.loi ?? '');
  const phieu = r.rows?.[0]?.kq?.phieu ?? [];
  ok('Số phiếu bắt đầu ND- (laNoDau nhận ra)', phieu.length === 2 && phieu.every(p => laNoDau(p)), phieu.map(p => p.so_phieu).join());
  const lai = await ghi();
  ok('Bấm lại cùng ma_gui → da_co, không thêm phiếu', lai.rows?.[0]?.kq?.da_co === true && lai.rows[0].kq.phieu.length === 2);
  const cn = (await duoi(UID.keToanA,
    `select so_phieu, phai_tra, con_no, han_thanh_toan::text as han from kho_v_cong_no_phieu where chi_nhanh_id = $1 and so_phieu like 'ND-%' order by phai_tra desc`,
    [cnA.id])).rows;
  ok('Trang nợ đầu kỳ đọc lại được bằng lọc so_phieu like ND-%', cn.length === 2 && Number(cn[0].phai_tra) === 12500000 && Number(cn[1].con_no) === 3000000);
  ok('Hạn dán vào giữ đúng', cn[0].han === '2026-10-31');
  const trung = await duoi(UID.keToanA, `select kho_ghi_no_dau_ky(p_chi_nhanh_id => $1, p_ma_gui => $2, p_dong => $3::jsonb)`,
    [cnA.id, maGui(), JSON.stringify(dongGuiNoDau(xt.dong.slice(0, 1)))]);
  ok('Ghi lần hai cho cùng nhà cung cấp → database từ chối (web cũng chặn trước)', trung.loi !== null && /ND-/.test(trung.loi));
  const dd = await duoi(UID.keToanA, `select kho_danh_dau_thiet_lap(p_chi_nhanh_id => $1, p_buoc => 'ncc_no_dau', p_bo_qua => true) as v`, [cnA.id]);
  ok('Kế toán bấm được "Không có nợ đầu kỳ"', dd.loi === null && dd.rows[0].v.ncc_no_dau.bo_qua === true, dd.loi ?? '');
  const bo = await duoi(UID.keToanA, `select kho_danh_dau_thiet_lap(p_chi_nhanh_id => $1, p_buoc => 'ncc_no_dau', p_bo_qua => false) as v`, [cnA.id]);
  ok('… và bỏ đánh dấu', bo.loi === null && bo.rows[0].v.ncc_no_dau.bo_qua === false);
  const tk = await duoi(UID.thuKhoA, `select count(*)::int as n from kho_v_cong_no_phieu where so_phieu like 'ND-%'`);
  ok('Thủ kho không đọc được phiếu ND-', tk.loi !== null || tk.rows[0].n === 0);
  const huyKhongLyDo = await duoi(UID.keToanA, `select kho_huy_phieu_nhap(p_id => $1, p_ly_do => '')`, [phieu[1]?.phieu_id]);
  ok('Hủy không lý do → từ chối (web cũng đòi lý do)', huyKhongLyDo.loi !== null);
  const huy = await duoi(UID.keToanA, `select kho_huy_phieu_nhap(p_id => $1, p_ly_do => 'ghi nhầm') as c`, [phieu[1]?.phieu_id]);
  ok('Kế toán hủy được phiếu chưa trả tiền', huy.loi === null && /Đã hủy nợ đầu kỳ/.test(huy.rows[0].c), huy.loi ?? '');
  await db.close();
});

// ===========================================================================
await nhom('6 · CÁC TRANG CÔNG NỢ', async () => {
  const noDau = docTrang('no-dau.astro');
  const ds = docTrang('index.astro');
  const ncc = docTrang('[id].astro');
  ok('Trang nợ đầu kỳ: chặn quyền ke_toan, bọc <Kho>', /if \(!k\.duoc\('ke_toan'\)\)/.test(noDau) && /<Kho k=\{k\}[^>]*\stieuDe="Nợ đầu kỳ"/.test(noDau));
  ok('Xem trước → Ghi, form ghi có ma_gui', /value="xem_truoc"/.test(noDau) && /value="ghi"/.test(noDau)
     && /name="ma_gui" value=\{crypto\.randomUUID\(\)\}/.test(noDau));
  ok('Dán Excel và nút "Không có nợ đầu kỳ"', /value="dan"/.test(noDau) && /value="khong_no"/.test(noDau) && />Không có nợ đầu kỳ</.test(noDau));
  ok('Hủy phiếu có lý do bắt buộc', /value="huy"/.test(noDau) && /name="ly_do" required/.test(noDau));
  ok('Ô tiền gõ bằng bàn phím số', /inputmode="numeric" name=\{`n\$\{i\}_tien`\}/.test(noDau));
  ok('Trang Công nợ có link "Nợ đầu kỳ"', ds.includes('href="/noi-bo/kho/cong-no/no-dau"'));
  ok('Danh sách lọc: số phiếu dùng linkPhieuCongNo (ND- không mở /nhap/)', /href=\{linkPhieuCongNo\(p\)\}/.test(ds) && !/href=\{`\/noi-bo\/kho\/nhap\/\$\{p\.id\}`\}/.test(ds));
  ok('Trang nhà cung cấp: ND- có nhãn, không đối chiếu, không trả hàng', /const noDau = laNoDau\(p\)/.test(ncc)
     && />Nợ đầu kỳ</.test(ncc) && ncc.indexOf('{noDau ? (') < ncc.indexOf('tra-hang?phieu='));
  ok('Bẫy Astro: không "{x.length && …}"', ![noDau, ds, ncc].some(s => /\{[a-zA-Z.]+\.length && /.test(s)));
  ok('Không <script> trong trang công nợ', ![noDau, ds, ncc].some(s => /<script/.test(s)));
});

process.exit(ketThuc('WEB NỢ ĐẦU KỲ'));
