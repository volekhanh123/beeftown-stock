/**
 * BEEFTOWN KHO — Form mặt hàng hỏi loại trước (27/10/2026)
 * =========================================================
 *
 *     node test/test-kho-mat-hang-loai.mjs
 *
 * Khánh: "nhìn nhiều trường thông tin quá bị rối — chọn loại rồi mới hiện". Form
 * Thêm / Sửa mặt hàng (FormMatHang.astro) hỏi Tảng nhập / Phần cắt / Phụ phẩm trước,
 * rồi chỉ hiện ô của loại đó (CSS :has()); ô ít dùng gập trong "Thông tin thêm".
 *
 *   · hàm thuần: bảng ô theo loại (O_THEO_LOAI), loaiCoO, oCuaLoai, demMacDinh;
 *   · mã nguồn form: chọn loại trước mọi ô, mỗi ô riêng mang đúng data-loai, CSS ẩn
 *     đủ ba loại, ô ít dùng nằm trong mục gập, form mới chưa chọn loại;
 *   · vòng thật trên PGlite qua client giả: luuMatHang BỎ QUA ô ẩn của loại khác
 *     (mặc định khi thêm, giữ giá trị cũ khi sửa cùng loại, BỎ khi đổi loại và câu báo
 *     kể ra), cách đếm theo loại, ô ẩn sai chữ không chặn lưu, thu hồi đọc trước khi
 *     ghi, ô mã không treo trên món đổi loại, quyền, bấm hai lần, mất mạng;
 *   · kết thúc bằng kho_doi_soat_ton() rỗng.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, taoClientPg, UID } from './kho-chung.mjs';
import {
  LOAI_MAT_HANG, O_THEO_LOAI, loaiCoO, oCuaLoai, laLoaiMatHang, demMacDinh, luuMatHang, docMatHang,
} from '../../web/src/lib/kho/danh-muc.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — FORM MẶT HÀNG HỎI LOẠI TRƯỚC');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');
function taoForm(o) {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
}
/** Mọi ô riêng (gộp ba loại), không trùng. */
const MOI_O_RIENG = [...new Set(Object.values(O_THEO_LOAI).flat())];

// ===========================================================================
await nhom('1 · BẢNG Ô THEO LOẠI — HÀM THUẦN', async () => {
  const rangBuoc = doc('crm/supabase/migrations/0019_kho_danh_muc.sql')
    .match(/kho_mat_hang_loai_hop_le\s+check \(loai in \(([^)]*)\)\)/)?.[1] ?? '';
  ok('LOAI_MAT_HANG đúng ba loại của ràng buộc kho_mat_hang_loai_hop_le (0019)',
    JSON.stringify([...LOAI_MAT_HANG].sort()) === JSON.stringify(rangBuoc.split(',').map(x => x.trim().replace(/'/g, '')).sort()),
    rangBuoc);
  ok('Tảng nhập: theo dõi theo tảng, bảng ủ, mức kho lạnh — không giá bán, mã cân, quầy, thu hồi',
    ['theo_tang', 'bang_u', 'muc_kho'].every(o => oCuaLoai('tang', o))
    && !['gia_ban_kg', 'ma_can', 'ton_toi_thieu_kg', 'gia_tri_thu_hoi_kg', 'o_ma'].some(o => oCuaLoai('tang', o)));
  ok('Phần cắt: giá bán, mã cân, quầy tối thiểu, mức kho lạnh, sau pha để ở, ô mã — không theo tảng, thu hồi',
    ['gia_ban_kg', 'ma_can', 'ton_toi_thieu_kg', 'muc_kho', 'noi_de_sau_pha', 'o_ma'].every(o => oCuaLoai('phan_cat', o))
    && !['theo_tang', 'bang_u', 'gia_tri_thu_hoi_kg', 'xu_ly_mac_dinh'].some(o => oCuaLoai('phan_cat', o)));
  ok('Phụ phẩm: giá trị thu hồi, xử lý sau pha — không giá bán, mã cân, mức kho',
    ['gia_tri_thu_hoi_kg', 'xu_ly_mac_dinh'].every(o => oCuaLoai('phu_pham', o))
    && !['gia_ban_kg', 'ma_can', 'ton_toi_thieu_kg', 'muc_kho', 'theo_tang'].some(o => oCuaLoai('phu_pham', o)));
  ok('loaiCoO: mức kho lạnh thuộc tảng và phần cắt, giá bán chỉ phần cắt', loaiCoO('muc_kho') === 'tang phan_cat'
    && loaiCoO('gia_ban_kg') === 'phan_cat' && loaiCoO('gia_tri_thu_hoi_kg') === 'phu_pham');
  ok('Loại trống hoặc lạ: không có ô riêng nào, laLoaiMatHang từ chối',
    !MOI_O_RIENG.some(o => oCuaLoai('', o) || oCuaLoai('rau', o)) && !laLoaiMatHang('') && !laLoaiMatHang('Tang'));
  ok('demMacDinh: tảng đếm tảng, phần cắt đếm gói, phụ phẩm chỉ kg (khay) — khớp danh mục mẫu của 0019',
    JSON.stringify(demMacDinh('tang')) === '{"dem_goi":true,"don_vi_goi":"tảng"}'
    && JSON.stringify(demMacDinh('phan_cat')) === '{"dem_goi":true,"don_vi_goi":"gói"}'
    && JSON.stringify(demMacDinh('phu_pham')) === '{"dem_goi":false,"don_vi_goi":"khay"}');
});

// ===========================================================================
await nhom('2 · MÃ NGUỒN FORM', async () => {
  const form = doc('web/src/components/kho/FormMatHang.astro');
  const nut = doc('web/src/components/kho/NhanHangChon.astro');
  ok('Chọn loại bằng thẻ NhanHangChon name="loai", bắt buộc, đứng trước ô tên',
    /<NhanHangChon name="loai"[^>]*\bbatBuoc\b/.test(form) && form.indexOf('<NhanHangChon name="loai"') < form.indexOf('name="ten"')
    && /required=\{batBuoc\}/.test(nut));
  ok('Còn đúng một ô chọn loại — không còn <select name="loai"> cũ', !/<select name="loai"/.test(form));

  // Mỗi ô riêng: <label class="nb-o mh-rieng…" data-loai={loaiCoO('<ô>')}> … name="<tên ô>".
  const nhan = [...form.matchAll(/<label class="nb-o mh-rieng[^"]*" data-loai=\{loaiCoO\('(\w+)'\)\}>[\s\S]*?name="(\w+)"/g)]
    .map(m => [m[1], m[2]]);
  const TEN_O = {
    theo_tang: ['theo_tang'], bang_u: ['bang_u'], gia_ban_kg: ['gia_ban_kg'], ma_can: ['ma_can'],
    ton_toi_thieu_kg: ['ton_toi_thieu_kg'], muc_kho: ['kho_toi_thieu_kg', 'kho_toi_da_kg'],
    noi_de_sau_pha: ['noi_de_sau_pha'], o_ma: ['o_ma'], xu_ly_mac_dinh: ['xu_ly_mac_dinh'],
    gia_tri_thu_hoi_kg: ['gia_tri_thu_hoi_kg'],
  };
  ok('Mỗi ô riêng trong form mang data-loai đúng ô của nó', nhan.length > 0 && nhan.every(([o, ten]) => TEN_O[o]?.includes(ten)),
    JSON.stringify(nhan));
  ok('Mọi ô riêng của O_THEO_LOAI đều có trong form, và ngược lại',
    JSON.stringify([...new Set(nhan.map(([o]) => o))].sort()) === JSON.stringify([...MOI_O_RIENG].sort())
    && Object.keys(TEN_O).sort().join() === [...MOI_O_RIENG].sort().join());
  const html = form.slice(0, form.indexOf('<style>'));
  ok('Mỗi tên ô riêng chỉ xuất hiện một lần trong phần HTML của form', Object.values(TEN_O).flat()
    .every(ten => (html.match(new RegExp(`name="${ten}"`, 'g')) ?? []).length === 1));

  const truocMucGap = form.slice(0, form.indexOf('<details class="mh-them"'));
  const mucGap = form.slice(form.indexOf('<details class="mh-them"'), form.indexOf('</details>'));
  /** Thẻ <label …> mở ngay trước ô tên `ten`. */
  const nhanCua = ten => { const i = form.indexOf(`name="${ten}"`); const j = form.lastIndexOf('<label', i); return form.slice(j, form.indexOf('>', j) + 1); };
  ok('Ô chung (tên, nhóm, hạn dùng) hiện ngay, không phải ô riêng, không nằm trong mục gập',
    ['ten', 'nhom', 'han_dung_ngay'].every(ten => truocMucGap.includes(`name="${ten}"`) && nhanCua(ten) === '<label class="nb-o">'));
  ok('Ô ít dùng gập trong "Thông tin thêm": mã, tên khác, báo trước hạn, MISA, đếm theo, đơn vị, thứ tự, tình trạng',
    ['ma', 'ten_phu', 'canh_bao_truoc_ngay', 'ma_misa', 'dem_goi', 'don_vi_goi', 'thu_tu', 'dang_dung']
      .every(ten => mucGap.includes(`name="${ten}"`) && !truocMucGap.includes(`name="${ten}"`)));
  ok('Mục gập mở sẵn khi dựng lại sau lỗi (moThem)', /<details class="mh-them" open=\{moThem\}>/.test(form));
  ok('"Đếm theo" có lựa chọn "Theo loại" (ô trống), chọn sẵn khi món đếm đúng mặc định loại của nó',
    /<option value="" selected=\{gt\.dem_goi === null\}>\{t\.demTheoLoai\}<\/option>/.test(form)
    && /dem_goi: m\.dem_goi === demMacDinh\(m\.loai\)\.dem_goi \? null : m\.dem_goi/.test(doc('web/src/pages/noi-bo/kho/cai-dat/mat-hang.astro')));

  const css = form.slice(form.indexOf('<style>'));
  ok('CSS: mỗi loại một luật ẩn ô riêng không thuộc loại đó',
    LOAI_MAT_HANG.every(l => css.includes(
      `.form-mh:has(input[name="loai"][value="${l}"]:checked) .mh-rieng:not([data-loai~="${l}"]) { display: none; }`)));
  ok('CSS: chưa chọn loại thì ẩn mọi ô sau ô chọn loại và hiện câu "Chọn loại trước"',
    css.includes('.form-mh:not(:has(input[name="loai"]:checked)) .mh-sau-loai { display: none; }')
    && css.includes('.form-mh:not(:has(input[name="loai"]:checked)) .mh-chua-chon { display: block; }')
    && /\.mh-chua-chon \{ display: none;/.test(css));
  ok('CSS: bảng ủ chỉ hiện khi "Theo dõi theo tảng" là Có',
    css.includes('.form-mh:has(select[name="theo_tang"] option[value="khong"]:checked) .mh-bang-u { display: none; }')
    && /class="nb-o mh-rieng mh-bang-u"/.test(form));
  ok('Form và CSS không gõ mã màu (chỉ biến)', !/#[0-9a-fA-F]{3,8}\b/.test(css));

  const trang = doc('web/src/pages/noi-bo/kho/cai-dat/mat-hang.astro');
  ok('Trang: form mới chưa chọn loại (trừ khi danh sách đang lọc theo loại), đếm theo loại',
    /loai: laLoaiMatHang\(locLoai\) \? locLoai : '', dem_goi: null/.test(trang));
  ok('Trang: dựng lại sau lỗi thì mở sẵn "Thông tin thêm" của đúng form',
    /nutLuu=\{t\.luuThayDoi\} moThem=\{!!\(nhapLai && idLoi\)\}/.test(trang)
    && /nutLuu=\{t\.themMatHang\} moThem=\{!!\(nhapLai && !idLoi\)\}/.test(trang));
  const huongDan = doc('web/src/lib/kho/huong-dan.ts');
  ok('Hướng dẫn "Mặt hàng" nói chọn loại trước và mục "Thông tin thêm" (vi / en)',
    /Chọn \*\*Loại mặt hàng\*\* trước/.test(huongDan) && /Choose the \*\*Item type\*\* first/.test(huongDan));
});

// ===========================================================================
await nhom('3 · LƯU THẬT TRÊN PGLITE', async () => {
  const { db, duoi, duoiAnon } = await dungDatabase();
  const clientCua = await taoClientPg({ db, duoi, duoiAnon });
  const ql = clientCua(UID.qlA);
  const luu = (o, cu, client = ql) => luuMatHang(client, taoForm({ viec: 'luu', ...o }), [], cu);
  const docMot = async ma => (await db.query(
    `select m.*, g.gia_tri_thu_hoi_kg as thu_hoi,
            (select count(*)::int from kho_bang_u u where u.mat_hang_id = m.id) as so_dong_u
     from kho_mat_hang m left join kho_mat_hang_gia g on g.mat_hang_id = m.id where m.ma = $1`, [ma])).rows[0];
  const docCu = async ma => (await docMatHang(ql)).find(m => m.ma === ma);
  const soDong = async ma => Number((await db.query(`select count(*) from kho_mat_hang where ma = $1`, [ma])).rows[0].count);

  // Mọi ô của cả ba loại đều có giá trị — như form gửi lên khi người dùng gõ ở một loại rồi đổi sang loại khác.
  const DU_O = {
    gia_ban_kg: '650.000', ma_can: '101', ton_toi_thieu_kg: '2,5', kho_toi_thieu_kg: '5', kho_toi_da_kg: '20',
    noi_de_sau_pha: 'quay', o_ma: '', theo_tang: 'co', bang_u: '5:18, 10', gia_tri_thu_hoi_kg: '30.000',
    xu_ly_mac_dinh: 'chuyen_bep',
  };

  // --- a. Phụ phẩm mới: ô ẩn của tảng / phần cắt bị bỏ qua ---
  let kq = await luu({ ...DU_O, ten: 'Mỡ trắng', ma: 'P-MOTRANG', loai: 'phu_pham', dem_goi: '', don_vi_goi: '' });
  let m = await docMot('P-MOTRANG');
  ok('Phụ phẩm mới: lưu được, câu "Đã thêm"', kq.ok && /^Đã thêm "Mỡ trắng"/.test(kq.cau) && !!m, kq.cau);
  ok('Phụ phẩm mới: giá bán, mã cân, quầy tối thiểu, sau pha để ở ẩn → không lưu',
    m.gia_ban_kg === null && m.ma_can === null && m.ton_toi_thieu_kg === null && m.noi_de_sau_pha === null,
    JSON.stringify({ g: m.gia_ban_kg, mc: m.ma_can, t: m.ton_toi_thieu_kg, n: m.noi_de_sau_pha }));
  ok('Phụ phẩm mới: mức kho lạnh ẩn → không lưu; theo dõi theo tảng tắt; không có bảng ủ',
    m.kho_toi_thieu_kg === null && m.kho_toi_da_kg === null && m.theo_tang === false && m.so_dong_u === 0);
  ok('Phụ phẩm mới: ô của nó được lưu — xử lý "chuyển bếp", thu hồi 30.000 đ/kg',
    m.xu_ly_mac_dinh === 'chuyen_bep' && Number(m.thu_hoi) === 30000);
  ok('Phụ phẩm mới, "Đếm theo" để Theo loại: chỉ kg, đơn vị khay', m.dem_goi === false && m.don_vi_goi === 'khay');

  // --- b. Phần cắt mới: số kiểu Việt, ô của phụ phẩm / tảng bị bỏ qua ---
  kq = await luu({ ...DU_O, ten: 'Thăn ngoại cắt lát', ma: 'C-THANNGOAI', loai: 'phan_cat', dem_goi: '', don_vi_goi: '', xu_ly_mac_dinh: 'bo' });
  m = await docMot('C-THANNGOAI');
  ok('Phần cắt mới: lưu được', kq.ok && !!m, kq.cau);
  ok('Phần cắt mới: "650.000" = 650 nghìn, "2,5" = 2,5 kg, mã cân 101, sau pha để ở quầy',
    Number(m.gia_ban_kg) === 650000 && Number(m.ton_toi_thieu_kg) === 2.5 && m.ma_can === '101' && m.noi_de_sau_pha === 'quay');
  ok('Phần cắt mới: mức kho lạnh 5 → 20 kg được lưu', Number(m.kho_toi_thieu_kg) === 5 && Number(m.kho_toi_da_kg) === 20);
  ok('Phần cắt mới: xử lý ẩn ("bỏ") → mặc định nhập kho; thu hồi ẩn → không ghi; không theo tảng, không bảng ủ',
    m.xu_ly_mac_dinh === 'nhap_kho' && m.thu_hoi === null && m.theo_tang === false && m.so_dong_u === 0);
  ok('Phần cắt mới, đếm theo loại: gói', m.dem_goi === true && m.don_vi_goi === 'gói');

  // --- c. Tảng mới ---
  kq = await luu({ ...DU_O, ten: 'Thăn lưng nguyên tảng', ma: 'T-THANLUNG', loai: 'tang', dem_goi: '', don_vi_goi: '', ma_can: '' });
  m = await docMot('T-THANLUNG');
  ok('Tảng mới: lưu được, theo dõi theo tảng + bảng ủ hai dòng, mức kho lạnh',
    kq.ok && m.theo_tang === true && m.so_dong_u === 2 && Number(m.kho_toi_da_kg) === 20, kq.cau);
  ok('Tảng mới: giá bán, quầy tối thiểu, sau pha để ở, thu hồi ẩn → không lưu',
    m.gia_ban_kg === null && m.ton_toi_thieu_kg === null && m.noi_de_sau_pha === null && m.thu_hoi === null);
  ok('Tảng mới, đếm theo loại: tảng', m.dem_goi === true && m.don_vi_goi === 'tảng');

  // --- d. Sửa, ĐỔI loại: phần cắt → phụ phẩm. Ô của loại cũ bị bỏ (form không còn ô để xóa chúng) ---
  const cu = await docCu('C-THANNGOAI');
  kq = await luu({ ...DU_O, id: cu.id, ten: 'Thăn ngoại vụn', ma: 'C-THANNGOAI', loai: 'phu_pham', dem_goi: '',
                   don_vi_goi: '', ma_can: '102', gia_ban_kg: '1', ton_toi_thieu_kg: '9', kho_toi_da_kg: '99' }, cu);
  m = await docMot('C-THANNGOAI');
  ok('Đổi loại phần cắt → phụ phẩm: lưu được, câu kể ra ô của loại cũ đã bỏ (vi / en)',
    kq.ok && m.loai === 'phu_pham'
    && kq.cau === 'Đã lưu "Thăn ngoại vụn". Đổi loại nên đã bỏ ô của loại cũ: mã cân 101, giá bán/kg, quầy tối thiểu, mức kho lạnh, sau pha để ở quầy.'
    && /The type changed, so the old type's fields were cleared: scale code 101, sale price\/kg/.test(kq.cauEn ?? ''), kq.cau);
  ok('Đổi loại: mã cân, giá bán, quầy tối thiểu, mức kho lạnh, sau pha để ở bị bỏ — không lấy số gõ trong ô ẩn',
    m.ma_can === null && m.gia_ban_kg === null && m.ton_toi_thieu_kg === null
    && m.kho_toi_thieu_kg === null && m.kho_toi_da_kg === null && m.noi_de_sau_pha === null,
    JSON.stringify({ mc: m.ma_can, g: m.gia_ban_kg, t: m.ton_toi_thieu_kg, k: m.kho_toi_da_kg, n: m.noi_de_sau_pha }));
  ok('Đổi loại: ô của loại mới được lưu; "Theo loại" → đếm chỉ kg, khay như phụ phẩm',
    m.xu_ly_mac_dinh === 'chuyen_bep' && Number(m.thu_hoi) === 30000 && m.dem_goi === false && m.don_vi_goi === 'khay');
  kq = await luu({ ten: 'Thăn ngoại cắt lát mới', ma: 'C-THANNGOAI2', loai: 'phan_cat', ma_can: '101' });
  ok('Mã cân 101 được trả lại: phần cắt mới dùng lại được', kq.ok && (await docMot('C-THANNGOAI2'))?.ma_can === '101', kq.cau);

  // --- d2. Sửa, CÙNG loại: món cũ còn số ở ô nay ẩn (từ form trước) — giữ nguyên, không lấy chữ ô ẩn ---
  await db.query(`insert into kho_mat_hang (ma, ten, loai, don_vi_goi, gia_ban_kg, ma_can, ton_toi_thieu_kg)
                  values ('T-CU', 'Tảng cũ', 'tang', 'tảng', 500000, '301', 1)`);
  const tangCu = await docCu('T-CU');
  kq = await luu({ id: tangCu.id, ten: 'Tảng cũ', ma: 'T-CU', loai: 'tang', theo_tang: 'khong', dem_goi: '', don_vi_goi: '',
                   gia_ban_kg: '1', ma_can: '999', ton_toi_thieu_kg: '9', bang_u: 'không phải bảng ủ' }, tangCu);
  m = await docMot('T-CU');
  ok('Sửa cùng loại: lưu được, câu "Đã lưu" không nhắc đổi loại', kq.ok && kq.cau === 'Đã lưu "Tảng cũ".', kq.cau);
  ok('Sửa cùng loại: giá bán, mã cân, quầy tối thiểu cũ (ô ẩn) giữ nguyên',
    Number(m.gia_ban_kg) === 500000 && m.ma_can === '301' && Number(m.ton_toi_thieu_kg) === 1,
    JSON.stringify({ g: m.gia_ban_kg, mc: m.ma_can, t: m.ton_toi_thieu_kg }));
  ok('Bảng ủ ẩn (theo dõi theo tảng: Không) có chữ sai → không chặn lưu, không ghi bảng ủ', m.so_dong_u === 0);

  // --- d3. Cách đếm riêng (không theo loại) giữ khi đổi loại ---
  await db.query(`insert into kho_mat_hang (ma, ten, loai, dem_goi, don_vi_goi) values ('C-KHAY', 'Ba chỉ khay', 'phan_cat', false, 'khay')`);
  const khay = await docCu('C-KHAY');
  kq = await luu({ id: khay.id, ten: 'Ba chỉ khay', ma: 'C-KHAY', loai: 'phu_pham', dem_goi: 'khong', don_vi_goi: 'khay lớn' }, khay);
  m = await docMot('C-KHAY');
  ok('Món đã chọn cách đếm riêng: đổi loại vẫn giữ cách đếm người dùng chọn', kq.ok && m.dem_goi === false && m.don_vi_goi === 'khay lớn');

  // --- e. Chữ sai: ô ẩn không chặn lưu, ô đang hiện vẫn báo ---
  kq = await luu({ ten: 'Gân bò', ma: 'P-GAN', loai: 'phu_pham', gia_ban_kg: 'sáu trăm', ma_can: 'abc', kho_toi_thieu_kg: 'x', o_ma: '' });
  ok('Phụ phẩm: chữ sai trong ô ẩn (giá bán, mã cân, mức kho) không chặn lưu', kq.ok && (await soDong('P-GAN')) === 1, kq.cau);
  kq = await luu({ ten: 'Gầu cắt lát', ma: 'C-GAU', loai: 'phan_cat', gia_ban_kg: 'sáu trăm' });
  ok('Phần cắt: giá bán sai chữ vẫn báo lỗi, không lưu, có tiếng Anh',
    !kq.ok && /Giá bán\/kg phải là số đồng/.test(kq.cau) && !!kq.cauEn && (await soDong('C-GAU')) === 0, kq.cau);

  // --- e2. Giá trị thu hồi sai chữ: báo TRƯỚC khi thêm, không lưu dở; sửa số rồi gửi lại form thêm mới được ---
  kq = await luu({ ten: 'Xương ống', ma: 'P-XUONG', loai: 'phu_pham', gia_tri_thu_hoi_kg: 'ba mươi' });
  ok('Thu hồi sai chữ → báo lỗi (vi / en), CHƯA thêm mặt hàng', !kq.ok && /Giá trị thu hồi\/kg phải là số đồng/.test(kq.cau)
    && !!kq.cauEn && (await soDong('P-XUONG')) === 0, kq.cau);
  kq = await luu({ ten: 'Xương ống', ma: 'P-XUONG', loai: 'phu_pham', gia_tri_thu_hoi_kg: '30.000' });
  ok('Sửa số rồi gửi lại form thêm mới: thêm được, thu hồi 30.000', kq.ok && Number((await docMot('P-XUONG')).thu_hoi) === 30000, kq.cau);

  // --- f. Ô mã: đổi loại khi còn ô mã thì báo, không để ô mã treo ---
  kq = await luu({ ten: 'Ba chỉ', ma: 'T-BACHI', loai: 'tang', o_ma: '10011-10013' });
  ok('Loại khác phần cắt mà ô mã còn mã → báo cách làm (vi / en), không lưu',
    !kq.ok && /Ô mã chỉ dành cho phần cắt\. Muốn đổi loại thì chọn lại Phần cắt/.test(kq.cau) && /choose Cut again/.test(kq.cauEn ?? '')
    && (await soDong('T-BACHI')) === 0, kq.cau);
  kq = await luu({ ten: 'Ba chỉ', ma: 'T-BACHI', loai: 'phu_pham', o_ma: 'chữ sai' });
  ok('Ô mã đang ẩn có chữ sai định dạng → vẫn báo cách làm, không báo lỗi định dạng của ô không thấy',
    !kq.ok && /^Ô mã chỉ dành cho phần cắt\. Muốn đổi loại/.test(kq.cau), kq.cau);

  // --- g. Chưa chọn loại ---
  kq = await luu({ ten: 'Chưa chọn loại', ma: 'X-CHUA', loai: '' });
  ok('Chưa chọn loại → "Chưa chọn loại mặt hàng.", không lưu', !kq.ok && kq.cau === 'Chưa chọn loại mặt hàng.'
    && (await soDong('X-CHUA')) === 0, kq.cau);

  // --- h. Quyền: chỉ chủ và quản lý sửa danh mục ---
  for (const [i, [ten, uid]] of [['Thủ kho', UID.thuKhoA], ['NV quầy', UID.nvQuayA], ['Kế toán', UID.keToanA],
                            ['Nhân sự đã nghỉ', UID.nghiViec], ['Không phải nhân sự', null], ['Chưa đăng nhập', 'anon']].entries()) {
    const ma = `X-Q${i}`;
    kq = await luu({ ten: `Thử ${ten}`, ma, loai: 'phan_cat' }, undefined, clientCua(uid));
    ok(`${ten} không thêm được mặt hàng`, !kq.ok && (await soDong(ma)) === 0, kq.cau);
  }
  kq = await luu({ ten: 'Chủ thêm', ma: 'C-CHU', loai: 'phan_cat' }, undefined, clientCua(UID.chu));
  ok('Chủ nhà hàng thêm được', kq.ok && (await soDong('C-CHU')) === 1, kq.cau);

  // --- i. Bấm hai lần: cùng một form gửi hai lần ---
  const f = { ten: 'Lõi vai cắt lát', loai: 'phan_cat', ma_can: '205' };
  const lan1 = await luu(f);
  const lan2 = await luu(f);
  ok('Bấm hai lần: chỉ một mặt hàng (mã tự đặt theo tên trùng), lần hai không báo "Đã thêm"',
    lan1.ok && !lan2.ok && !/Đã thêm/.test(lan2.cau)
    && Number((await db.query(`select count(*) from kho_mat_hang where ten = 'Lõi vai cắt lát'`)).rows[0].count) === 1, lan2.cau);

  // --- j. Mất mạng: client ném lỗi / trả lỗi → không bao giờ báo thành công ---
  const hong = loi => ({
    from() {
      const b = { insert: () => b, update: () => b, eq: () => b, select: () => b,
        single: async () => (loi ? { data: null, error: { message: 'TypeError: fetch failed' } } : (() => { throw new TypeError('fetch failed'); })()),
        then: (xong, h) => Promise.resolve(loi ? { data: null, error: { message: 'TypeError: fetch failed' } } : null).then(xong, h) };
      return b;
    },
    rpc: async () => ({ data: null, error: { message: 'TypeError: fetch failed' } }),
  });
  kq = await luu({ ten: 'Mất mạng', loai: 'phan_cat' }, undefined, hong(true));
  ok('Dịch vụ trả lỗi → không báo "Đã thêm"', !kq.ok && !/Đã thêm/.test(kq.cau), kq.cau);
  let nem = null;
  try { kq = await luu({ ten: 'Mất mạng', loai: 'phan_cat' }, undefined, hong(false)); } catch (e) { nem = e; }
  ok('fetch ném lỗi → lỗi đi lên trang (trang báo lỗi), không trả "Đã thêm"', !!nem || (!kq.ok && !/Đã thêm/.test(kq.cau)));

  const ds = (await db.query(`select * from kho_doi_soat_ton()`)).rows;
  ok('kho_doi_soat_ton() rỗng', ds.length === 0, JSON.stringify(ds));
});

process.exit(ketThuc('FORM MẶT HÀNG HỎI LOẠI TRƯỚC'));
