/**
 * BEEFTOWN KHO — Chọn món kèm số tồn: quầy yêu cầu hàng, xuất, chuyển ra quầy (29/10/2026)
 * =======================================================================================
 *
 *     node test/test-kho-chon-mon-co-ton.mjs
 *
 * Khánh chốt 29/10/2026 ("làm tiếp mục 1–3 quầy và xuất"): chọn một thứ thì bung đúng lựa chọn liên quan —
 *   1. Quầy → Yêu cầu hàng: "Kho đang có" — phần cắt / phụ phẩm kho lạnh còn hạn, mỗi món một ô số và dòng
 *      "Kho còn 4 gói · 2 kg · HSD 30/10"; không tảng, không lô hết hạn, không món đã ở danh sách sắp hết;
 *   2. Xuất → Chuyển ra quầy: "Quầy đang thiếu" (kho_goi_y_ra_quay) — bấm là thêm dòng điền sẵn số nên lấy;
 *   3. Xuất (mọi loại): món đang có ở nơi lấy thành nút, dưới tên là "Còn … · HSD …".
 *
 * Kiểm: chữ chuConTon (vi / en, gói / kg / cái, số kiểu Việt), monKhoChoQuay, dongTuGoiYRaQuay, ô `k_` của form
 * yêu cầu (nguồn "tay", cộng với dòng thêm), NV quầy đọc được tồn kho lạnh (RLS), thủ kho đọc được gợi ý ra quầy,
 * gửi yêu cầu thật qua client giả, mã nguồn hai trang; kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, taoClientPg, UID, maGui } from './kho-chung.mjs';
import { docTon, chuConTon } from '../../web/src/lib/kho/ton.ts';
import {
  monKhoChoQuay, dongTuGoiYRaQuay, soNenLay, docFormYeuCau, docGoiYRaQuay, taoYeuCau, LOAI_RA_QUAY,
} from '../../web/src/lib/kho/quay.ts';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — CHỌN MÓN KÈM SỐ TỒN (QUẦY, XUẤT)');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
const clientCua = await taoClientPg({ db, duoi, duoiAnon });

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngaySau = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
const MH = {};
let viTri = {};
let ncc;

async function nhapHang(dong, vt, cn = cnA, ql = UID.qlA) {
  const luu = await duoi(ql, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cn.id, maGui(), ncc, vt, homNay, JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  const gui = await duoi(ql, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
  if (gui.loi) throw new Error(gui.loi);
  const duyet = await duoi(ql, `select kho_duyet_phieu_nhap($1)`, [p.phieu_id]);
  if (duyet.loi) throw new Error(duyet.loi);
}

// ===========================================================================
await nhom('0 · DỰNG DỮ LIỆU', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  viTri = Object.fromEntries((await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows
    .map(r => [r.loai, r.id]));
  ncc = (await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC A') returning id`)).rows[0].id;
  await db.query(`update kho_mat_hang set quay_toi_thieu_goi = 3, quay_toi_da_goi = 6 where ma = 'C-THANNGOAI'`);
  await nhapHang([
    // Thăn cắt lát: một lô HẾT HẠN (2 gói) + một lô còn hạn (4 gói, 2 kg).
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 2, so_kg: 1, don_gia_kg: 700000, han_dung: await ngaySau(-1) },
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 4, so_kg: 2, don_gia_kg: 700000, han_dung: await ngaySau(3) },
    { mat_hang_id: MH['C-NACVAI'].id, so_goi: 6, so_kg: 3, don_gia_kg: 400000, han_dung: await ngaySau(2) },
    { mat_hang_id: MH['P-VUN'].id, so_kg: 1.25, don_gia_kg: 80000, han_dung: await ngaySau(2) },
    { mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 14, don_gia_kg: 500000, han_dung: await ngaySau(20) },
  ], viTri.kho);
  ok('Kho lạnh có thăn cắt lát (1 lô hết hạn), nạc vai, thịt vụn, một tảng', !!MH['C-THANNGOAI'] && !!viTri.kho && !!viTri.quay);
  // Chi nhánh B cũng có hàng — để thử NV quầy A không thấy tồn của B.
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  const khoB = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'kho'`, [cnB.id])).rows[0].id;
  await nhapHang([{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 3, so_kg: 1.5, don_gia_kg: 400000, han_dung: await ngaySau(2) }], khoB, cnB, UID.qlB);
  ok('Chi nhánh B có tồn nạc vai', (await db.query(`select count(*)::int as n from kho_v_ton where chi_nhanh_id = $1`, [cnB.id])).rows[0].n > 0);
});

// ===========================================================================
await nhom('1 · CHỮ "CÒN … · HSD …"', async () => {
  const ngay = '2026-10-30';
  const goi = { loai_hang: 'phan_cat', dem_goi: true, don_vi_goi: 'gói', so_goi: 3, so_kg: 1.2, han_som_nhat: ngay };
  ok('Hàng đếm gói: "Còn 3 gói · 1,2 kg · HSD 30/10" (số kiểu Việt)', chuConTon(goi) === 'Còn 3 gói · 1,2 kg · HSD 30/10', chuConTon(goi));
  ok('Tiếng Anh: "In stock 3 gói · 1.2 kg · Use by 30/10"', chuConTon(goi, 'en') === 'In stock 3 gói · 1.2 kg · Use by 30/10', chuConTon(goi, 'en'));
  const kg = { loai_hang: 'phu_pham', dem_goi: false, don_vi_goi: 'khay', so_goi: 0, so_kg: 1.25, han_som_nhat: ngay };
  ok('Hàng cân ký: chỉ kg — "Còn 1,25 kg · HSD 30/10"', chuConTon(kg) === 'Còn 1,25 kg · HSD 30/10', chuConTon(kg));
  const cai = { loai_hang: 'do_uong', dem_goi: true, don_vi_goi: 'lon', so_goi: 24, so_kg: 24, han_som_nhat: ngay };
  ok('Món đếm theo cái: chỉ số cái — "Còn 24 lon · HSD 30/10" (không "24 kg")', chuConTon(cai) === 'Còn 24 lon · HSD 30/10', chuConTon(cai));
  ok('Chữ đầu câu đổi được: "Kho còn …"', chuConTon(goi, 'vi', { vi: 'Kho còn', en: 'Store has' }).startsWith('Kho còn 3 gói'));
  const khongDv = { ...goi, don_vi_goi: '' };
  ok('Không có đơn vị gói → chữ chung "gói" / "packs"', chuConTon(khongDv).startsWith('Còn 3 gói') && chuConTon(khongDv, 'en').startsWith('In stock 3 packs'));
});

// ===========================================================================
await nhom('2 · QUẦY → YÊU CẦU HÀNG: "KHO ĐANG CÓ"', async () => {
  const nvQuay = clientCua(UID.nvQuayA);
  const ton = await docTon(nvQuay, cnA.id);
  ok('NV quầy đọc được tồn kho lạnh (kho_v_ton, không tiền)', ton.some(t => t.loai_vi_tri === 'kho'), String(ton.length));
  const dangDung = new Set(Object.values(MH).filter(m => m.dang_dung).map(m => m.id));
  const kho = monKhoChoQuay(ton, dangDung);
  const ma = kho.map(m => m.ma_hang);
  ok('Chỉ phần cắt / phụ phẩm (LOAI_RA_QUAY) — không tảng', ma.includes('C-THANNGOAI') && ma.includes('P-VUN') && !ma.includes('T-THANNGOAI')
    && kho.every(m => LOAI_RA_QUAY.includes(m.loai_hang)), ma.join());
  const than = kho.find(m => m.ma_hang === 'C-THANNGOAI');
  ok('Lô hết hạn không tính: thăn cắt lát còn 4 gói 2 kg (không 6 gói)', than?.so_goi === 4 && than.so_kg === 2, JSON.stringify(than));
  ok('Dòng phụ: "Kho còn 4 gói · 2 kg · HSD …"', /^Kho còn 4 gói · 2 kg · HSD \d\d\/\d\d$/.test(chuConTon(than, 'vi', { vi: 'Kho còn', en: 'Store has' })));
  ok('Xếp theo tên (tiếng Việt)', ma.join() === [...kho].sort((a, b) => a.ten_hang.localeCompare(b.ten_hang, 'vi')).map(m => m.ma_hang).join());
  const boQua = monKhoChoQuay(ton, dangDung, new Set([MH['C-THANNGOAI'].id]));
  ok('Món đã ở danh sách sắp hết không lặp lại', !boQua.some(m => m.ma_hang === 'C-THANNGOAI'));
  const ngung = monKhoChoQuay(ton, new Set([...dangDung].filter(id => id !== MH['P-VUN'].id)));
  ok('Món ngừng dùng không hiện', !ngung.some(m => m.ma_hang === 'P-VUN'));
  // Món đếm gói chỉ còn kg lẻ (0 gói): danh sách sắp hết coi là "kho đã hết" — "Kho đang có" cũng không hiện.
  const le = ton.filter(t => t.mat_hang_id === MH['C-NACVAI'].id && t.loai_vi_tri === 'kho').map(t => ({ ...t, so_goi: 0, so_kg: 0.4 }));
  const tonLe = [...ton.filter(t => t.mat_hang_id !== MH['C-NACVAI'].id), ...le];
  ok('Món đếm gói chỉ còn kg lẻ (0 gói) không hiện ở "Kho đang có"', le.length > 0 && !monKhoChoQuay(tonLe, dangDung).some(m => m.ma_hang === 'C-NACVAI'));

  // Form: ô k_<món> là chọn tay (nguồn "tay"), cộng với dòng thêm cùng món; g_<món> vẫn là gợi ý.
  const matHang = Object.values(MH);
  const f = new FormData();
  f.append(`k_${MH['C-NACVAI'].id}`, '2');
  f.append(`k_${MH['P-VUN'].id}`, '0,5');
  f.append('t0_mat_hang', MH['C-NACVAI'].id); f.append('t0_so', '1');
  let r = docFormYeuCau(f, matHang, 1);
  const dong = Object.fromEntries(r.dong.map(d => [d.mat_hang_id, d]));
  ok('Ô k_: nạc vai 2 + dòng thêm 1 = 3 gói; thịt vụn "0,5" = 0,5 kg; nguồn "tay"',
    r.loi.length === 0 && dong[MH['C-NACVAI'].id]?.so_goi === 3 && dong[MH['P-VUN'].id]?.so_kg === 0.5 && r.nguon === 'tay',
    JSON.stringify(r));
  f.append(`g_${MH['C-THANNGOAI'].id}`, '3');
  r = docFormYeuCau(f, matHang, 1);
  ok('Có ô gợi ý g_ có số → nguồn "goi_y"', r.nguon === 'goi_y');
  const sai = new FormData();
  sai.append(`k_${MH['C-NACVAI'].id}`, '1,5');
  r = docFormYeuCau(sai, matHang, 0);
  ok('Ô k_ của món đếm gói ghi số lẻ → báo lỗi số nguyên', r.loi.length === 1 && /số gói phải là số nguyên/.test(r.loi[0]), r.loi.join());

  const kq = await taoYeuCau(nvQuay, cnA.id, crypto.randomUUID(), viTri.quay, 'tay', '',
    [{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 2 }, { mat_hang_id: MH['P-VUN'].id, so_kg: 0.5 }]);
  const yc = (await db.query(`select y.nguon, count(d.*)::int as n from kho_yeu_cau_quay y join kho_yeu_cau_quay_dong d on d.yeu_cau_id = y.id
    where y.id = $1 group by y.nguon`, [kq.id])).rows[0];
  ok('NV quầy gửi yêu cầu từ "Kho đang có" (client giả): 2 món, nguồn "tay"', kq.ok && yc?.n === 2 && yc.nguon === 'tay', kq.cau);
});

// ===========================================================================
await nhom('2b · QUYỀN ĐỌC TỒN CHO "KHO ĐANG CÓ"', async () => {
  /** Số dòng tồn một client đọc được ở một chi nhánh (đọc lỗi = 0 — trang báo "chưa đọc được tồn"). */
  const soDong = async (c, cn) => { try { return (await docTon(c, cn.id)).length; } catch { return 0; } };
  ok('NV quầy chi nhánh A KHÔNG đọc được tồn chi nhánh B', await soDong(clientCua(UID.nvQuayA), cnB) === 0);
  ok('Quản lý B đọc được tồn B (kiểm thử trên có nghĩa)', await soDong(clientCua(UID.qlB), cnB) > 0);
  ok('anon KHÔNG đọc được tồn', await soDong(clientCua('anon'), cnA) === 0);
  ok('Nhân sự đã nghỉ KHÔNG đọc được tồn', await soDong(clientCua(UID.nghiViec), cnA) === 0);
  ok('Đăng nhập nhưng không có dòng nhân sự KHÔNG đọc được tồn', await soDong(clientCua(null), cnA) === 0);
  const cot = Object.keys((await docTon(clientCua(UID.nvQuayA), cnA.id))[0] ?? {});
  ok('Tồn NV quầy đọc không có cột tiền', cot.length > 0 && !cot.some(c => /(^|_)(gia|tien)(_|$)/.test(c)), cot.join());
});

// ===========================================================================
await nhom('3 · XUẤT → CHUYỂN RA QUẦY: "QUẦY ĐANG THIẾU"', async () => {
  const thuKho = clientCua(UID.thuKhoA);
  const g = await docGoiYRaQuay(thuKho, cnA.id, viTri.quay);
  const than = g.find(x => x.mat_hang_id === MH['C-THANNGOAI'].id);
  ok('Thủ kho đọc được gợi ý ra quầy (quầy 0 gói, tối thiểu 3, tối đa 6 → nên lấy gói)', !!than && (than.so_goi_de_nghi ?? 0) > 0,
    JSON.stringify(than));
  const d = dongTuGoiYRaQuay(than);
  ok('Dòng phiếu chuyển điền sẵn số gói nên lấy (ô kg trống)', d.mat_hang_id === than.mat_hang_id && d.so_goi === String(than.so_goi_de_nghi) && d.so_kg === '',
    JSON.stringify(d));
  const kg = dongTuGoiYRaQuay({ ...than, dem_goi: false, so_goi_de_nghi: null, so_kg_de_nghi: 1.5 });
  ok('Món cân ký: số kg viết kiểu Việt "1,5" (ô gói trống)', kg.so_kg === '1,5' && kg.so_goi === '', JSON.stringify(kg));
  const het = dongTuGoiYRaQuay({ ...than, so_goi_de_nghi: -2 });
  ok('Số nên lấy âm (quầy đã thừa) → 0, không số âm', het.so_goi === '0');
  // kho_goi_y_ra_quay tính trên MỌI kho của chi nhánh; phiếu lấy từ một nơi → không điền quá số nơi đó còn.
  const sau = { ...than, so_goi_de_nghi: 6 };
  ok('Số nên lấy không quá số nơi lấy còn: đề nghị 6 gói, nơi lấy còn 2 → điền 2',
    soNenLay(sau, { so_goi: 2, so_kg: 1 }) === 2 && dongTuGoiYRaQuay(sau, { so_goi: 2, so_kg: 1 }).so_goi === '2');
  ok('Nơi lấy còn nhiều hơn → vẫn số đề nghị; không truyền tồn → số đề nghị',
    soNenLay(sau, { so_goi: 9, so_kg: 4 }) === 6 && soNenLay(sau) === 6);
  const kgSau = { ...than, dem_goi: false, so_goi_de_nghi: null, so_kg_de_nghi: 3 };
  ok('Món cân ký: giới hạn theo kg nơi lấy còn (3 kg đề nghị, còn 1,25 → "1,25")',
    dongTuGoiYRaQuay(kgSau, { so_goi: 0, so_kg: 1.25 }).so_kg === '1,25');
});

// ===========================================================================
await nhom('4 · MÃ NGUỒN TRANG', async () => {
  const yc = doc('web/src/pages/noi-bo/kho/quay/yeu-cau/index.astro');
  ok('Quầy: "Kho đang có" từ monKhoChoQuay, ô k_<món>, dòng phụ chuConTon "Kho còn"',
    /monKhoChoQuay\(ton,/.test(yc) && /name=\{`k_\$\{m\.mat_hang_id\}`\}/.test(yc) && /chuConTon\(m, nn, \{ vi: 'Kho còn'/.test(yc));
  ok('Quầy: đọc tồn (song song) lỗi thì báo, không im như thể kho trống',
    /docTon\(k\.client, cn\.id\)\.catch\(\(\) => null\)/.test(yc) && /const loiTon = tonDoc === null;/.test(yc) && /t\.khongDocTon/.test(yc));
  ok('Quầy: đọc danh mục lỗi thì không nói "kho lạnh chưa có phần cắt nào"', /!loiTon && !loiDoc && khoCo\.length === 0 && <p class="kho-phu">\{t\.khoTrong\}/.test(yc));
  ok('Quầy: ô chọn món ở dòng thêm không lặp món đã có ở hai danh sách trên', /!idGoiY\.has\(m\.id\) && !idKhoCo\.has\(m\.id\)/.test(yc));
  ok('Quầy: "Món không có trong danh sách" mở sẵn khi đọc tồn lỗi, kho trống, đã bấm "+ Thêm dòng" hay dòng có chữ',
    /<details class="yc-them-khac" open=\{loiTon \|\| khoCo\.length === 0 \|\| soDong > 3 \|\| dongThem\.some\(d => d\.mh \|\| d\.so\)/.test(yc));
  const xu = doc('web/src/pages/noi-bo/kho/xuat/[id].astro');
  ok('Xuất: chuyển ra QUẦY mới đọc gợi ý ra quầy; đọc lỗi chỉ mất nhóm đó',
    /loai === 'chuyen' && den\?\.loai === 'quay'/.test(xu) && /docGoiYRaQuay\(k\.client, cn\.id, den\.id\)\.catch\(/.test(xu));
  ok('Xuất: bấm món đang thiếu → dòng điền sẵn số nên lấy, không quá tồn nơi lấy; "+ Lấy cả" là viec them_thieu',
    /const dongThieu = \(g: GoiYRaQuay\) => dongTuGoiYRaQuay\(g, tonMonTaiTu\.get\(g\.mat_hang_id\)\)/.test(xu)
      && /g \? dongThieu\(g\)/.test(xu) && /value="them_thieu"/.test(xu) && /'them_thieu'/.test(xu));
  ok('Xuất: "đang thiếu" bỏ sốt / đồ uống (kho_goi_y_ra_quay không lọc loại) và món nơi lấy không đủ',
    /!laDemCai\(tenMh\.get\(g\.mat_hang_id\)\) && nenLay\(g\) > 0/.test(xu));
  ok('Xuất: bấm món đang thiếu đã có dòng trống → điền số vào dòng đó', /doc\.dong\.map\(d => \(d\.mat_hang_id === themMh \? dienThieu\(d\) : d\)\)/.test(xu));
  ok('Xuất: "+ Lấy cả" không thêm được gì thì vẫn giữ dòng trống để chọn món', /dienSanMh = dongA\.length > doc\.dong\.length;/.test(xu));
  ok('Xuất: nút món kèm "Còn … · HSD …" (chuConTon), mọi món đang có ở nơi lấy trong mục gập',
    /chuConTon\(tonMonTaiTu\.get\(m\.id\)!, nn\)/.test(xu) && /ch\.monDangCo\(tu\.ten, monTaiTu\.length\)/.test(xu));
  ok('Xuất: phiếu chuyển không có nút sốt / đồ uống (0105)', /loai !== 'chuyen' \|\| !laDemCai\(m\)/.test(xu));
  ok('Xuất: tồn dưới nút chỉ tính lô còn hạn khi phiếu chỉ nhận hàng còn hạn',
    /gomTheoMatHang\(loTaiTu\.filter\(t => !chiConHan \|\| t\.tinh_trang_han !== 'het_han'\)\)/.test(xu));
});

const dsTon = (await db.query(`select * from kho_doi_soat_ton()`)).rows;
ok('kho_doi_soat_ton() rỗng', dsTon.length === 0, JSON.stringify(dsTon));

process.exit(ketThuc('CHỌN MÓN KÈM SỐ TỒN'));
