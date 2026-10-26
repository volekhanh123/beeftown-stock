/**
 * BEEFTOWN — MENU BÁN LẺ: THƯ VIỆN CỦA TRANG /noi-bo/ban-le (web/src/lib/ban-le-noi-bo.ts)
 * =======================================================================================
 *
 *     node test/test-ban-le-web.mjs
 *
 * Database của menu bán lẻ kiểm ở test-ban-le.mjs; file này kiểm phần web nối vào đó. Bất biến:
 *
 *   1. chu-va-so: giaGoi (TypeScript) ra ĐÚNG số của ban_le_gia_goi (SQL) trên một bảng ca, kể cả ca làm tròn
 *      .5 và ca ra 0 (null — 0 đ không bao giờ là giá). maTuTen: tên có dấu thành mã ASCII database nhận.
 *      Ô tiền: "1.000.000" là một triệu, "1,5" là lỗi, giá gói phải tròn nghìn.
 *   2. Form: lỗi của người gõ không bao giờ tới database; ô trọng lượng trống của gói đang có là LỖI (không phải
 *      bỏ gói); chỉ dòng mới được để trống; bỏ gói phải nói rõ (xoa: true); bản en / ko chỉ gửi khi người dùng
 *      sửa; giá mỗi kg chỉ gửi khi đổi, luôn kèm giá đã thấy.
 *   3. cau-chu: câu sau khi lưu chỉ nói điều đã xảy ra — câu Beeftown Cân chỉ khi giá vừa đổi, trong cửa sổ 6 chữ
 *      số của cân, mặt hàng có mã cân và đang dùng; giá quá cân → "VẪN IN GIÁ CŨ"; gói vừa bỏ → nhắc tắt món trên
 *      FABi; câu dính chữ cấm → cảnh báo. Không câu nào nói Mini App hay website đã đọc menu.
 *   4. quyen + bam-hai-lan + mat-mang, trên database thật (PGlite, RLS thật, client giả taoClientPg): marketing
 *      lưu bị từ chối bằng đúng câu; bấm đúp → "Đã lưu."; người khác sửa → CHƯA lưu; giá kho vừa đổi → không ghi
 *      gì (trùng giá vừa gõ → lưu phần còn lại); mất mạng (client ném TypeError('fetch failed') hay trả lỗi đó)
 *      → CAU_MAT_MANG_GHI, không bao giờ "Đã lưu".
 *   5. Chọn chi nhánh: cookie RIÊNG bt_ban_le_cn sống dưới /noi-bo/ban-le, chỉ chi nhánh đang hoạt động.
 *   6. ton-kho: cuối file kho_doi_soat_ton() rỗng.
 */

import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dungDatabase, taoBoDem, taoClientPg, UID, maGui } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const nap = f => import(pathToFileURL(join(GOC, 'web', 'src', 'lib', f)).href);

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — MENU BÁN LẺ: THƯ VIỆN WEB');

const BL = await nap('ban-le-noi-bo.ts');
const { CAU_MAT_MANG_GHI } = await nap('qua-tai.ts');
const { db, cnA, duoi, duoiAnon } = await dungDatabase();
const clientCua = await taoClientPg({ db, duoi, duoiAnon });

const VIET = /[ạảãàáâậầấẩẫăắằẳẵặẹẻẽèéêệềếểễịỉĩìíọỏõòóôộồốổỗơợờớởỡụủũùúưựừứửữỵỷỹỳýđĐ]/;
const CAU_SUA = 'Chỉ chủ và quản lý được sửa menu bán lẻ.';
// now() của PGlite chỉ tới mili giây: hai lần ghi liền nhau có thể cùng updated_at (xem test-ban-le.mjs).
const nghi = () => new Promise(xong => setTimeout(xong, 3));

/** Form tự dựng từ một FormData phẳng. */
function formTu(o) {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v == null ? '' : String(v));
  return f;
}

/**
 * Form sửa đúng như trang [id].astro dựng từ một lần đọc (tên ô, ô ẩn …_cu, goc_…, hai dòng gói mới), rồi
 * đè những ô trong `doi`.
 */
function formTuSanPham(sp, doi = {}) {
  const o = {
    viec: 'luu', phien_ban: sp.updated_at,
    ten_vi: sp.ten_vi, mo_ta_vi: sp.mo_ta_vi, cach_dung_vi: sp.cach_dung_vi,
    kieu: `${sp.loai}|${sp.cach_ban}`, kieu_cu: `${sp.loai}|${sp.cach_ban}`,
    bao_quan: sp.bao_quan, trang_thai: sp.trang_thai, trang_thai_cu: sp.trang_thai,
    kenh_mini_app: sp.kenh_mini_app ? 'co' : 'khong', kenh_web: sp.kenh_web ? 'co' : 'khong',
  };
  for (const c of ['ten', 'mo_ta', 'cach_dung']) {
    for (const l of ['en', 'ko']) { o[`${c}_${l}`] = sp[`${c}_${l}`]; o[`goc_${c}_${l}`] = sp[`${c}_${l}`]; }
  }
  const laHop = sp.cach_ban === 'theo_hop';
  const coMh = laHop || sp.nguon_goi === 'dong_san';
  if (!laHop) {
    o.mat_hang_id = sp.mat_hang_id; o.mat_hang_id_cu = sp.mat_hang_id;
    if (sp.mat_hang?.dang_dung) {
      o.gia_ban_kg = sp.mat_hang.gia_ban_kg == null ? '' : Number(sp.mat_hang.gia_ban_kg).toLocaleString('vi-VN');
      o.gia_ban_kg_cu = sp.mat_hang.gia_ban_kg;
    }
    o.nguon_goi = sp.nguon_goi; o.nguon_goi_cu = sp.nguon_goi;
  }
  const soMoi = Math.max(0, Math.min(2, 20 - sp.goi.length));
  sp.goi.forEach((g, i) => {
    const p = `goi_${i}_`;
    Object.assign(o, {
      [`${p}id`]: g.id, [`${p}so_gam`]: g.so_gam, [`${p}so_gam_cu`]: g.so_gam,
      [`${p}gia_rieng`]: g.gia_rieng == null ? '' : Number(g.gia_rieng).toLocaleString('vi-VN'), [`${p}gia_rieng_cu`]: g.gia_rieng,
      [`${p}ma_fabi`]: g.ma_fabi, [`${p}ma_fabi_cu`]: g.ma_fabi, [`${p}dang_ban_cu`]: String(g.dang_ban),
      [`${p}viec`]: g.dang_ban ? 'giu' : 'ngung',
    });
    if (laHop) o[`${p}ma_vach`] = g.ma_vach;
    if (coMh) { o[`${p}mat_hang_id`] = g.mat_hang?.id ?? ''; o[`${p}mat_hang_id_cu`] = g.mat_hang?.id ?? ''; }
  });
  for (let j = 0; j < soMoi; j++) {
    const p = `goi_${sp.goi.length + j}_`;
    Object.assign(o, { [`${p}so_gam`]: '', [`${p}gia_rieng`]: '', [`${p}ma_fabi`]: '', [`${p}viec`]: 'giu' });
    if (laHop) o[`${p}ma_vach`] = '';
    if (coMh) o[`${p}mat_hang_id`] = '';
  }
  o.so_dong_goi = sp.goi.length + soMoi;
  return formTu({ ...o, ...doi });
}
/** Chỉ số dòng gói của một cỡ trong form của formTuSanPham. */
const dongCua = (sp, soGam) => sp.goi.findIndex(g => g.so_gam === soGam);

// ===========================================================================
await nhom('1 · chu-va-so: giaGoi = ban_le_gia_goi, maTuTen', async () => {
  const CA = [
    [999999, 200], [1002500, 200], [1840000, 400], [2000, 200], [2499, 200], [2500, 200], [7500, 200],
    [12500, 100], [950000, 200], [950000, 400], [950000, 100], [0, 200], [1, 5000], [100000000, 5000],
    [1234567, 333], [1050000, 50], [3333333, 150], [1500, 333], [null, 200], [950000, null],
  ];
  const sai = [];
  for (const [kg, gam] of CA) {
    const { rows: [r] } = await db.query(`select ban_le_gia_goi($1::bigint, $2::int) as g`, [kg, gam]);
    const sql = r.g === null ? null : Number(r.g);
    const ts = BL.giaGoi(kg, gam);
    if (sql !== ts) sai.push(`${kg} × ${gam}: SQL ${sql}, TS ${ts}`);
  }
  ok(`giaGoi (TypeScript) = ban_le_gia_goi (SQL) trên ${CA.length} ca, kể cả .5 và 0`, sai.length === 0, sai.join(' · '));
  ok('999.999 đ/kg × 200 g = 200.000 đ', BL.giaGoi(999999, 200) === 200000);
  ok('1.002.500 đ/kg × 200 g = 201.000 đ (làm tròn .5 lên)', BL.giaGoi(1002500, 200) === 201000);
  ok('1.840.000 đ/kg × 400 g = 736.000 đ', BL.giaGoi(1840000, 400) === 736000);
  ok('2.000 đ/kg × 200 g và 2.499 × 200 → null (0 đ không bao giờ là giá)', BL.giaGoi(2000, 200) === null && BL.giaGoi(2499, 200) === null);
  ok('Thiếu giá mỗi kg hoặc số gam → null, không NaN', BL.giaGoi(null, 200) === null && BL.giaGoi(950000, undefined) === null);

  const MA = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  ok('maTuTen: "Kim chi cải thảo" → "kim-chi-cai-thao"', BL.maTuTen('Kim chi cải thảo') === 'kim-chi-cai-thao');
  ok('maTuTen: "Đùi bò Úc" → "dui-bo-uc" (đ thành d)', BL.maTuTen('Đùi bò Úc') === 'dui-bo-uc');
  ok('maTuTen: chữ hoa, khoảng trắng, ký tự lạ → chữ thường nối gạch ngang', BL.maTuTen('  RIB EYE  ') === 'rib-eye'
     && BL.maTuTen('Thăn--ngoại__200g!!') === 'than-ngoai-200g');
  ok('maTuTen: chữ NFD (dán từ macOS) ra như chữ gõ', BL.maTuTen('Thăn ngoại'.normalize('NFD')) === 'than-ngoai');
  const dai = BL.maTuTen('Ba chỉ bò Mỹ cắt lát mỏng dùng cho lẩu và nướng tại nhà');
  ok('maTuTen: tên dài → tối đa 40 ký tự, không gạch ngang ở cuối, database nhận', dai.length <= 40 && MA.test(dai), dai);
  ok('maTuTen: toàn ký tự lạ → chuỗi rỗng (trang báo lỗi, không gửi)', BL.maTuTen('!!! ???') === '');
});

// ===========================================================================
await nhom('2 · Form sửa: đọc trước khi gọi database', async () => {
  const ID1 = '11111111-1111-4111-8111-111111111111';
  const ID2 = '22222222-2222-4222-8222-222222222222';
  const coBan = {
    viec: 'luu', phien_ban: '2026-10-26T03:00:00+00:00', ten_vi: 'Ribeye Mỹ', mo_ta_vi: '', cach_dung_vi: '',
    kieu: 'thit|theo_can', kieu_cu: 'thit|theo_can', bao_quan: 'mat', trang_thai: 'tam_ngung', trang_thai_cu: 'tam_ngung',
    kenh_mini_app: 'co', kenh_web: 'khong', mat_hang_id: '', mat_hang_id_cu: '', nguon_goi: 'cat_tai_quay', nguon_goi_cu: 'cat_tai_quay',
    gia_ban_kg: '950.000', gia_ban_kg_cu: '950000',
    so_dong_goi: 4,
    goi_0_id: ID1, goi_0_so_gam: '200', goi_0_so_gam_cu: '200', goi_0_gia_rieng: '', goi_0_gia_rieng_cu: '', goi_0_ma_fabi: 'RIB-200',
    goi_0_ma_fabi_cu: 'RIB-200', goi_0_dang_ban_cu: 'true', goi_0_viec: 'giu',
    goi_1_id: ID2, goi_1_so_gam: '400', goi_1_so_gam_cu: '400', goi_1_gia_rieng: '', goi_1_gia_rieng_cu: '', goi_1_ma_fabi: '',
    goi_1_ma_fabi_cu: '', goi_1_dang_ban_cu: 'true', goi_1_viec: 'giu',
    goi_2_so_gam: '', goi_2_gia_rieng: '', goi_2_ma_fabi: '', goi_2_viec: 'giu',
    goi_3_so_gam: '', goi_3_gia_rieng: '', goi_3_ma_fabi: '', goi_3_viec: 'giu',
  };
  const doc = (doi = {}, nn = 'vi') => BL.docForm(formTu({ ...coBan, ...doi }), nn);

  const k0 = doc();
  ok('Form không đổi gì: không lỗi, không gửi giá mỗi kg, hai gói đang có, hai dòng mới trống không gửi',
     k0.loi === null && !('gia_ban_kg' in k0.duLieu) && k0.duLieu.goi.length === 2 && k0.duLieu.goi.every(g => g.id), JSON.stringify(k0));
  ok('Form không đổi gì: không có gì FABi phải sửa', k0.doiFabi === false);
  ok('Có / Không đọc thành true / false', k0.duLieu.kenh_mini_app === true && k0.duLieu.kenh_web === false);
  ok('Ô "Bán thế nào" tách thành loai + cach_ban', k0.duLieu.loai === 'thit' && k0.duLieu.cach_ban === 'theo_can');

  const k1 = doc({ gia_ban_kg: '1.000.000' });
  ok('Giá mỗi kg "1.000.000" là một triệu, gửi kèm giá đã thấy (950.000)',
     k1.loi === null && k1.duLieu.gia_ban_kg === 1000000 && k1.duLieu.gia_ban_kg_cu === 950000, JSON.stringify(k1.duLieu));
  ok('Giá mỗi kg "1,5" → lỗi, không gửi gì', doc({ gia_ban_kg: '1,5' }).loi?.includes('không đọc được'));
  ok('Giá mỗi kg để trống khi đang có giá → lỗi (bỏ giá làm ở Kho → Mặt hàng)', /Chưa điền giá mỗi kg/.test(doc({ gia_ban_kg: '' }).loi ?? ''));
  ok('Giá mỗi kg "950,000" (bàn phím tiếng Anh) = giá cũ → không gửi', !('gia_ban_kg' in doc({ gia_ban_kg: '950,000' }).duLieu));

  ok('Giá gói "190.500" → lỗi "phải tròn nghìn đồng"', /phải tròn nghìn đồng/.test(doc({ goi_0_gia_rieng: '190.500' }).loi ?? ''));
  ok('Giá gói "500" → lỗi khoảng 1.000 – 100.000.000', /từ 1\.000 đ đến 100\.000\.000 đ/.test(doc({ goi_0_gia_rieng: '500' }).loi ?? ''));
  ok('Giá gói "19,5" → lỗi đọc số (không thành 195)', /không đọc được/.test(doc({ goi_0_gia_rieng: '19,5' }).loi ?? ''));
  const k2 = doc({ goi_0_gia_rieng: '190.000' });
  ok('Giá gói "190.000" → 190000, FABi phải sửa theo', k2.loi === null && k2.duLieu.goi[0].gia_rieng === 190000 && k2.doiFabi);

  const k3 = doc({ goi_1_so_gam: '' });
  ok('Ô trọng lượng gói ĐANG CÓ để trống → lỗi "Ô trọng lượng gói 400 g đang trống", không phải bỏ gói',
     /Ô trọng lượng gói 400 g đang trống/.test(k3.loi ?? ''), k3.loi);
  ok('Trọng lượng "1.5" → lỗi (không thành 15 g)', /Trọng lượng gói/.test(doc({ goi_0_so_gam: '1.5' }).loi ?? ''));
  const k4 = doc({ goi_1_viec: 'bo' });
  ok('Chọn "Bỏ gói này" → { id, xoa: true }, FABi phải sửa theo',
     k4.loi === null && k4.duLieu.goi.some(g => g.id === ID2 && g.xoa === true) && k4.doiFabi, JSON.stringify(k4.duLieu.goi));
  const k5 = doc({ goi_0_viec: 'ngung' });
  ok('Chọn "Ngưng bán" → dang_ban false, gói vẫn còn', k5.duLieu.goi.find(g => g.id === ID1)?.dang_ban === false && k5.doiFabi);
  ok('Dòng mới chỉ có mã FABi, chưa có trọng lượng → lỗi', /Gói mới chưa có trọng lượng/.test(doc({ goi_2_ma_fabi: 'RIB-300' }).loi ?? ''));
  const k6 = doc({ goi_2_so_gam: '300', goi_2_gia_rieng: '285.000', goi_2_ma_fabi: 'RIB-300' });
  ok('Dòng mới đủ trọng lượng → gói mới không id', k6.loi === null && k6.duLieu.goi.some(g => !g.id && g.so_gam === 300 && g.gia_rieng === 285000));
  const nhieu = { so_dong_goi: 21 };
  for (let i = 0; i < 21; i++) Object.assign(nhieu, { [`goi_${i}_so_gam`]: String(100 + i * 10), [`goi_${i}_viec`]: 'giu' });
  ok('21 gói → lỗi "tối đa 20 gói", không gọi database', /tối đa 20 gói/.test(BL.docForm(formTu({ ...nhieu }), 'vi').loi ?? ''));
  ok('Gói đang gắn mặt hàng đã mất, ô chọn "giu" → không gửi mat_hang_id (giữ nguyên)',
     !('mat_hang_id' in doc({ goi_0_mat_hang_id: 'giu', goi_0_mat_hang_id_cu: '' }).duLieu.goi[0]));

  const k7 = doc({ ten_en: 'Ribeye', goc_ten_en: 'Ribeye' });
  ok('Bản tiếng Anh không đổi so với lúc mở trang → không gửi (không đè máy dịch)', !('ten_en' in k7.duLieu));
  const k8 = doc({ ten_en: 'US ribeye', goc_ten_en: 'Ribeye' });
  ok('Bản tiếng Anh sửa tay → gửi', k8.duLieu.ten_en === 'US ribeye');
  ok('Tên tiếng Anh gõ tay quá 120 ký tự → lỗi ở form (database không giới hạn cột en / ko)',
     /dài quá 120/.test(doc({ ten_en: 'a'.repeat(121), goc_ten_en: '' }).loi ?? ''));
  ok('Tên tiếng Hàn đếm theo ký tự, không theo byte (120 chữ Hàn vẫn được)',
     doc({ ten_ko: '갈'.repeat(120), goc_ten_ko: '' }).loi === null);
  ok('Tên trống → lỗi "Chưa điền tên sản phẩm."', doc({ ten_vi: '  ' }).loi === 'Chưa điền tên sản phẩm.');
  ok('Ô kênh lạ → lỗi', doc({ kenh_web: 'x' }).loi !== null);
  ok('Ô "Bán thế nào" lạ → lỗi', doc({ kieu: 'ga|theo_can' }).loi !== null);
  ok('Đổi trạng thái → FABi phải sửa theo (bật / tắt món)', doc({ trang_thai: 'dang_ban' }).doiFabi === true);
  const en = [doc({ goi_1_so_gam: '' }, 'en'), doc({ goi_0_gia_rieng: '190.500' }, 'en'), doc({ gia_ban_kg: 'abc' }, 'en'),
    doc({ ten_vi: '' }, 'en'), BL.docForm(formTu({ ...nhieu }), 'en')].map(k => k.loi ?? '');
  ok('Câu lỗi của form đủ tiếng Anh (không còn dấu tiếng Việt)', en.every(c => c && !VIET.test(c)), en.join(' | '));
});

// ===========================================================================
await nhom('3 · cau-chu: câu sau khi lưu chỉ nói điều đã xảy ra', async () => {
  const mh = (gia, maCan = '1001', dangDung = true) => ({ id: 'x', ma: 'RIB', ten: 'Ribeye', loai: 'phan_cat', gia_ban_kg: gia, ma_can: maCan, dem_goi: false, don_vi_goi: 'gói', dang_dung: dangDung });
  const kq = (o = {}) => ({ ok: true, updated_at: '', gia_kho_doi: false, da_bo: [], canh_bao: [], mat_hang: null, ...o });
  const CAN = 'Beeftown Cân gửi giá mới xuống cân trong khoảng 1 phút nếu đang bật Tự gửi.';

  ok('Không đổi gì FABi phải theo → đúng "Đã lưu."', BL.cauDaLuu(kq(), {}, false, 'vi') === 'Đã lưu.');
  const c1 = BL.cauDaLuu(kq({ gia_kho_doi: true, mat_hang: mh(990000) }), { gia_ban_kg: 990000 }, false, 'vi');
  ok('Giá mỗi kg vừa đổi, 990.000 đ, có mã cân, đang dùng → câu Beeftown Cân + FABi phải sửa tay',
     c1.includes(CAN) && c1.includes('FABi phải sửa tay — xem Đối chiếu FABi.'), c1);
  const c2 = BL.cauDaLuu(kq({ gia_kho_doi: true, mat_hang: mh(1050000), canh_bao: ['gia_qua_can'] }), { gia_ban_kg: 1050000 }, false, 'vi');
  ok('Giá 1.050.000 đ/kg (quá 999.999) → "cân VẪN IN GIÁ CŨ cho mã 1001", không câu "gửi giá mới"',
     c2.includes('Cân quầy chỉ nhận tối đa 999.999 đ/kg: cân VẪN IN GIÁ CŨ cho mã 1001.') && !c2.includes('gửi giá mới'), c2);
  ok('Đúng 999.999 đ/kg → vẫn câu Beeftown Cân (trong cửa sổ)', BL.cauDaLuu(kq({ gia_kho_doi: true, mat_hang: mh(999999) }), {}, false).includes(CAN));
  ok('Giá vừa đổi nhưng mặt hàng chưa có mã cân → không câu Beeftown Cân', !BL.cauDaLuu(kq({ gia_kho_doi: true, mat_hang: mh(990000, null) }), {}, false).includes(CAN));
  ok('Giá vừa đổi nhưng mặt hàng đã ngừng dùng → không câu Beeftown Cân', !BL.cauDaLuu(kq({ gia_kho_doi: true, mat_hang: mh(990000, '1001', false) }), {}, false).includes(CAN));
  ok('Giá không đổi lần này → không câu Beeftown Cân', !BL.cauDaLuu(kq({ mat_hang: mh(990000) }), {}, true).includes(CAN));
  const c3 = BL.cauDaLuu(kq({ da_bo: [{ so_gam: 400, ma_fabi: 'RIB-400' }, { so_gam: 300, ma_fabi: null }] }), {}, true, 'vi');
  ok('Gói vừa bỏ có mã FABi → "Đã bỏ gói 400 g (mã FABi RIB-400) — nhớ tắt món này trên FABi."',
     c3.includes('Đã bỏ gói 400 g (mã FABi RIB-400) — nhớ tắt món này trên FABi.'), c3);
  ok('Gói vừa bỏ không có mã FABi → "Đã bỏ gói 300 g." (không bắt tắt món nào)', c3.includes('Đã bỏ gói 300 g.'), c3);
  const c4 = BL.cauDaLuu(kq(), { mo_ta_vi: 'Bò Wagyu nướng than hoa', ten_en: 'Best beef in town' }, false, 'vi');
  ok('Câu vừa lưu dính chữ cấm → cảnh báo "dính chữ cấm" (cả bản tiếng Anh gõ tay)',
     (c4.match(/dính chữ cấm/g) ?? []).length >= 2 && c4.includes('sửa trước khi bán online'), c4);
  const c5 = BL.cauDaLuu(kq({ canh_bao: ['thieu_gia', 'mat_hang_ngung'] }), {}, false, 'vi');
  ok('Cảnh báo của sản phẩm có câu riêng', c5.includes('chưa gói nào có giá') && c5.includes('đã ngừng dùng'), c5);
  const tatCa = [c1, c2, c3, c4, c5].join(' ');
  ok('Không câu nào nói Mini App hay website đã nhận / đã đọc menu', !/Mini App|website/i.test(tatCa), tatCa);
  const enC = BL.cauDaLuu(kq({ gia_kho_doi: true, mat_hang: mh(1050000), canh_bao: ['gia_qua_can', 'khay_nguyen'], da_bo: [{ so_gam: 400, ma_fabi: 'RIB-400' }] }), {}, true, 'en');
  ok('Câu sau khi lưu đủ tiếng Anh', !VIET.test(enC) && enC.startsWith('Saved.'), enC);
  // Câu đi qua cookie bt_nb_bao (Astro mã hóa bằng encodeURIComponent; trình duyệt bỏ cookie quá 4 KB — mất câu báo).
  const dai = BL.cauDaLuu(kq({ gia_kho_doi: true, mat_hang: mh(1050000), canh_bao: ['gia_qua_can', 'khay_nguyen', 'mat_hang_ngung', 'goi_khong_dem_goi'],
    da_bo: [{ so_gam: 200, ma_fabi: 'RIB-200-UC' }, { so_gam: 400, ma_fabi: 'RIB-400-UC' }] }), { mo_ta_vi: 'Wagyu than hoa 199.000 đ' }, true, 'vi');
  const coCookie = encodeURIComponent(JSON.stringify({ ok: true, cau: dai + ' Bản tiếng Anh và tiếng Hàn đang được dịch — tải lại trang sau ít giây để xem.' })).length;
  ok(`Câu dài nhất có thể vẫn vừa cookie (${coCookie} < 3500 byte)`, coCookie < 3500);
});

// ===========================================================================
// Mặt hàng kho, chèn bằng superuser (như test-ban-le.mjs).
const matHang = async (ma, ten, { gia = null, maCan = null, demGoi = false, dangDung = true } = {}) => (await db.query(
  `insert into kho_mat_hang (ma, ten, loai, dem_goi, gia_ban_kg, ma_can, dang_dung) values ($1, $2, 'phan_cat', $3, $4, $5, $6) returning id`,
  [ma, ten, demGoi, gia, maCan, dangDung])).rows[0].id;
const giaKho = async id => Number((await db.query(`select gia_ban_kg from kho_mat_hang where id = $1`, [id])).rows[0].gia_ban_kg);
const MH = {
  ribeye: await matHang('RIB-WEB', 'Ribeye Mỹ', { gia: 950000, maCan: '1101' }),
  ngung: await matHang('NGUNG-WEB', 'Mặt hàng đã ngừng', { gia: 500000, dangDung: false }),
  hop: await matHang('KIMCHI-WEB', 'Kim chi hộp 500 g', { demGoi: true }),
};
const QL = clientCua(UID.qlA);
const CHU = clientCua(UID.chu);
const MKT = clientCua(UID.mktA);
let idSp = null;
const docQL = async () => BL.docSanPham(QL, idSp, null);

await nhom('4 · Trên database thật: thêm, lưu, bấm đúp, người khác sửa, giá kho vừa đổi, quyền', async () => {
  const gui = maGui();
  const formTao = { viec: 'tao', ma_gui: gui, ten_vi: 'Ribeye Mỹ', kieu: 'thit|theo_can', ma: '' };
  const t1 = await BL.taoSanPham(QL, formTu(formTao), 'vi');
  ok('Quản lý thêm sản phẩm → ok, có id, sản phẩm mới', t1.ok === true && !!t1.id && t1.daCo === false, JSON.stringify(t1));
  idSp = t1.id;
  const t2 = await BL.taoSanPham(QL, formTu({ ...formTao, ten_vi: 'Ribeye Mỹ (gõ lại)' }), 'vi');
  ok('Bấm "Thêm" lần hai, cùng ma_gui → cùng sản phẩm, không thêm dòng', t2.ok === true && t2.id === idSp && t2.daCo === true, JSON.stringify(t2));
  ok('Database chỉ có một sản phẩm mã ribeye-my', (await db.query(`select count(*)::int n from ban_le_san_pham where ma = 'ribeye-my'`)).rows[0].n === 1);
  const t3 = await BL.taoSanPham(MKT, formTu({ ...formTao, ma_gui: maGui(), ma: 'mkt-tao' }), 'vi');
  ok('Marketing thêm → từ chối bằng đúng câu của database', t3.ok === false && t3.cau === CAU_SUA, JSON.stringify(t3));
  const t3en = await BL.taoSanPham(MKT, formTu({ ...formTao, ma_gui: maGui(), ma: 'mkt-tao' }), 'en');
  ok('…và bản tiếng Anh', t3en.ok === false && t3en.cau === 'Only the owner and managers can edit the retail menu.', JSON.stringify(t3en));
  const t4 = await BL.taoSanPham(QL, formTu({ ...formTao, ma_gui: maGui() }), 'vi');
  ok('Mã trùng (ma_gui khác) → "Mã sản phẩm này đã có. Đổi tên hoặc sửa mã."', t4.ok === false && t4.cau === 'Mã sản phẩm này đã có. Đổi tên hoặc sửa mã.', JSON.stringify(t4));
  const t5 = await BL.taoSanPham(QL, formTu({ ...formTao, ma_gui: 'khong-phai-uuid' }), 'vi');
  ok('ma_gui sai dạng → lỗi, không gọi database', t5.ok === false && /chống gửi hai lần/.test(t5.cau));

  let sp = await docQL();
  ok('Đọc lại: thịt theo cân có sẵn gói 200 g và 400 g, Tạm ngưng', sp?.goi.map(g => g.so_gam).join() === '200,400' && sp.trang_thai === 'tam_ngung');

  await nghi();
  const l1 = await BL.luuSanPham(QL, idSp, formTuSanPham(sp, { mat_hang_id: MH.ribeye }), 'vi');
  ok('Quản lý gắn mặt hàng kho → "Đã lưu." + FABi phải sửa tay', l1.ok === true && l1.cau.startsWith('Đã lưu.') && l1.cau.includes('FABi phải sửa tay'), JSON.stringify(l1));
  const lap = await BL.luuSanPham(QL, idSp, formTuSanPham(sp, { mat_hang_id: MH.ribeye }), 'vi');
  ok('Bấm Lưu lần hai (cùng form, phiên bản cũ) → đúng "Đã lưu.", không "người khác sửa"', lap.ok === true && lap.cau === 'Đã lưu.', JSON.stringify(lap));

  const khac = await BL.luuSanPham(QL, idSp, formTuSanPham(sp, { mat_hang_id: MH.ribeye, ten_vi: 'Tên khác' }), 'vi');
  ok('Phiên bản cũ + chữ khác bản đang lưu → CHƯA lưu, câu "người khác sửa"',
     khac.ok === false && khac.maLoi === 'nguoi_khac_sua' && /CHƯA được lưu/.test(khac.cau), JSON.stringify(khac));
  ok('…tên trong database vẫn nguyên', (await docQL()).ten_vi === 'Ribeye Mỹ');

  sp = await docQL();
  const mk = await BL.luuSanPham(MKT, idSp, formTuSanPham(sp, { ten_vi: 'Marketing sửa' }), 'vi');
  ok('Marketing lưu → từ chối bằng đúng câu, không "Đã lưu"', mk.ok === false && mk.cau === CAU_SUA, JSON.stringify(mk));
  const tn = await BL.luuSanPham(clientCua(UID.thuNganA), idSp, formTuSanPham(sp, { ten_vi: 'Thu ngân sửa' }), 'vi');
  ok('Thu ngân lưu → từ chối bằng đúng câu', tn.ok === false && tn.cau === CAU_SUA, JSON.stringify(tn));
  ok('…tên vẫn nguyên', (await docQL()).ten_vi === 'Ribeye Mỹ');

  await nghi();
  const g1 = await BL.luuSanPham(QL, idSp, formTuSanPham(sp, { gia_ban_kg: '990.000' }), 'vi');
  ok('Đổi giá mỗi kg 950.000 → 990.000 → "Đã lưu." + câu Beeftown Cân (mặt hàng có mã cân)',
     g1.ok === true && g1.cau.includes('Beeftown Cân gửi giá mới xuống cân'), JSON.stringify(g1));
  ok('…đúng ô gia_ban_kg của Kho → Mặt hàng', await giaKho(MH.ribeye) === 990000);

  sp = await docQL();
  await db.query(`update kho_mat_hang set gia_ban_kg = 1000000 where id = $1`, [MH.ribeye]);
  await nghi();
  const g2 = await BL.luuSanPham(QL, idSp, formTuSanPham(sp, { gia_ban_kg: '980.000', ten_vi: 'Ribeye Mỹ mới' }), 'vi');
  ok('Giá ở Kho vừa đổi (1.000.000) trong lúc trang mở → "Giá ở Kho vừa đổi thành 1.000.000 đ/kg", CHƯA lưu',
     g2.ok === false && g2.maLoi === 'gia_kho_vua_doi' && g2.cau.includes('1.000.000 đ/kg') && /Chưa có gì được lưu/.test(g2.cau), JSON.stringify(g2));
  ok('…tên và giá kho đều nguyên (hàm lưu không ghi gì)', (await docQL()).ten_vi === 'Ribeye Mỹ' && await giaKho(MH.ribeye) === 1000000);

  sp = await docQL();
  await db.query(`update kho_mat_hang set gia_ban_kg = 1010000 where id = $1`, [MH.ribeye]);
  await nghi();
  const g3 = await BL.luuSanPham(QL, idSp, formTuSanPham(sp, { gia_ban_kg: '1.010.000', ten_vi: 'Ribeye Mỹ loại một' }), 'vi');
  ok('Giá ở Kho vừa đổi ĐÚNG bằng giá vừa gõ → lưu phần còn lại, "Đã lưu." (không câu Beeftown Cân — lần này không đổi giá)',
     g3.ok === true && g3.cau.startsWith('Đã lưu.') && !g3.cau.includes('Beeftown Cân'), JSON.stringify(g3));
  ok('…tên mới đã lưu, giá kho đúng 1.010.000', (await docQL()).ten_vi === 'Ribeye Mỹ loại một' && await giaKho(MH.ribeye) === 1010000);

  sp = await docQL();
  await nghi();
  const g4 = await BL.luuSanPham(QL, idSp, formTuSanPham(sp, { gia_ban_kg: '1.050.000' }), 'vi');
  ok('Giá 1.050.000 đ/kg → "Đã lưu." + "cân VẪN IN GIÁ CŨ cho mã 1101", không câu "gửi giá mới"',
     g4.ok === true && g4.cau.includes('cân VẪN IN GIÁ CŨ cho mã 1101') && !g4.cau.includes('gửi giá mới'), JSON.stringify(g4));

  sp = await docQL();
  const i400 = dongCua(sp, 400);
  await nghi();
  const m1 = await BL.luuSanPham(QL, idSp, formTuSanPham(sp, { [`goi_${i400}_ma_fabi`]: 'RIB-400' }), 'vi');
  ok('Điền mã FABi cho gói 400 g → "Đã lưu." + FABi phải sửa tay', m1.ok === true && m1.cau.includes('FABi phải sửa tay'), JSON.stringify(m1));
  sp = await docQL();
  await nghi();
  const b1 = await BL.luuSanPham(QL, idSp, formTuSanPham(sp, { [`goi_${dongCua(sp, 400)}_viec`]: 'bo' }), 'vi');
  ok('Chọn "Bỏ gói này" cho gói 400 g → "Đã bỏ gói 400 g (mã FABi RIB-400) — nhớ tắt món này trên FABi."',
     b1.ok === true && b1.cau.includes('Đã bỏ gói 400 g (mã FABi RIB-400) — nhớ tắt món này trên FABi.'), JSON.stringify(b1));
  ok('…chỉ còn gói 200 g', (await docQL()).goi.map(g => g.so_gam).join() === '200');
  const b2 = await BL.luuSanPham(QL, idSp, formTuSanPham(sp, { [`goi_${dongCua(sp, 400)}_viec`]: 'bo' }), 'vi');
  ok('Bấm lần hai lệnh bỏ gói → "Đã lưu." (gói đã không còn), không lỗi "Không thấy gói này"', b2.ok === true && b2.cau === 'Đã lưu.', JSON.stringify(b2));

  sp = await docQL();
  await nghi();
  const d1 = await BL.luuSanPham(QL, idSp, formTuSanPham(sp, { ten_en: 'US ribeye', mo_ta_vi: 'Mềm, nhiều vân mỡ.' }), 'vi');
  ok('Sửa tay bản tiếng Anh qua form → lưu được', d1.ok === true && (await docQL()).ten_en === 'US ribeye', JSON.stringify(d1));
  ok('…sổ bản dịch ghi ô ten/en là bản tay', (await docQL()).ban_dich?.ten?.en?.cach === 'tay', JSON.stringify((await docQL()).ban_dich?.ten));
  const sai = await BL.luuSanPham(QL, idSp, formTuSanPham(await docQL(), { [`goi_0_gia_rieng`]: '190.500' }), 'vi');
  ok('Lỗi của người gõ → không gọi database, câu của form', sai.ok === false && /tròn nghìn/.test(sai.cau));

  // Kim chi theo hộp: mỗi hộp gắn mặt hàng kho riêng (ô mat_hang_id của gói).
  const hopTao = await BL.taoSanPham(QL, formTu({ ma_gui: maGui(), ten_vi: 'Kim chi cải thảo', kieu: 'kim_chi|theo_hop' }), 'vi');
  const docHop = () => BL.docSanPham(QL, hopTao.id, null);
  const h0 = await docHop();
  ok('Kim chi theo hộp: tạo xong chưa có hộp nào, bảo quản giữ lạnh', hopTao.ok && h0.goi.length === 0 && h0.bao_quan === 'giu_lanh');
  const formHop = formTuSanPham(h0, { goi_0_so_gam: '500', goi_0_gia_rieng: '120.000', goi_0_ma_fabi: 'KIM-500',
    goi_0_ma_vach: '8930000000017', goi_0_mat_hang_id: MH.hop });
  await nghi();
  const h1 = await BL.luuSanPham(QL, hopTao.id, formHop, 'vi');
  ok('Thêm hộp 500 g có giá, mã vạch, mặt hàng kho → "Đã lưu."', h1.ok === true && h1.cau.startsWith('Đã lưu.'), JSON.stringify(h1));
  const hop1 = (await docHop()).goi[0];
  ok('…hộp gắn đúng mặt hàng kho, giá 120.000 đ', hop1?.mat_hang?.id === MH.hop && hop1?.gia === 120000 && hop1?.ma_vach === '8930000000017');
  const h2 = await BL.luuSanPham(QL, hopTao.id, formHop, 'vi');
  ok('Bấm Lưu lần hai (hộp có mặt hàng kho) → đúng "Đã lưu.", không "người khác sửa"', h2.ok === true && h2.cau === 'Đã lưu.', JSON.stringify(h2));
});

// ===========================================================================
await nhom('4b · Xác nhận giá (bỏ chữ Giá thử): chỉ chủ, đúng giá đã thấy, bấm đúp', async () => {
  let sp = await docQL();
  const anh = JSON.stringify(sp.gia_de_chot);
  const q = await BL.chotGia(QL, idSp, sp.updated_at, anh, 'vi');
  ok('Quản lý xác nhận → "Chỉ chủ được chốt giá bán lẻ."', q.ok === false && q.cau === 'Chỉ chủ được chốt giá bán lẻ.', JSON.stringify(q));
  await nghi();
  const c1 = await BL.chotGia(CHU, idSp, sp.updated_at, anh, 'vi');
  ok('Chủ xác nhận đúng giá đang hiện → "Đã xác nhận giá"', c1.ok === true && /Đã xác nhận giá/.test(c1.cau), JSON.stringify(c1));
  ok('…sản phẩm hết là giá thử', (await docQL()).gia_thu === false);
  const c2 = await BL.chotGia(CHU, idSp, sp.updated_at, anh, 'vi');
  ok('Bấm lần hai (phiên bản cũ, giá vẫn vậy) → ok "đã được xác nhận rồi", không "người khác sửa"',
     c2.ok === true && /đã được xác nhận rồi/.test(c2.cau), JSON.stringify(c2));

  sp = await docQL();
  await db.query(`update kho_mat_hang set gia_ban_kg = 1020000 where id = $1`, [MH.ribeye]);
  await nghi();
  const c3 = await BL.chotGia(CHU, idSp, sp.updated_at, JSON.stringify(sp.gia_de_chot), 'vi');
  ok('Giá đổi ở Kho sau khi trang mở → "Giá vừa đổi … xem lại giá dưới đây rồi xác nhận.", không ghi',
     c3.ok === false && /Giá vừa đổi/.test(c3.cau) && (await docQL()).gia_thu === true, JSON.stringify(c3));
  const c4 = await BL.chotGia(CHU, idSp, sp.updated_at, '{không phải json', 'vi');
  ok('Ô giá đã xem hỏng → câu "tải lại trang", không gọi database', c4.ok === false && /tải lại trang/.test(c4.cau));

  // Máy dịch (hay người khác) đổi dòng sản phẩm nhưng không đổi giá: chủ vẫn xác nhận được những giá đã thấy.
  sp = await docQL();
  await nghi();
  await duoi(UID.qlA, `update ban_le_san_pham set ten_ko = '립아이' where id = $1`, [idSp]);
  await nghi();
  const c5 = await BL.chotGia(CHU, idSp, sp.updated_at, JSON.stringify(sp.gia_de_chot), 'vi');
  ok('Dòng sản phẩm vừa đổi chữ (không đổi giá) → vẫn xác nhận được đúng giá đã thấy', c5.ok === true && /Đã xác nhận giá/.test(c5.cau), JSON.stringify(c5));
  const c5en = await BL.chotGia(QL, idSp, sp.updated_at, JSON.stringify(sp.gia_de_chot), 'en');
  ok('Câu từ chối có bản tiếng Anh', c5en.ok === false && c5en.cau === 'Only the owner can confirm retail prices.', JSON.stringify(c5en));
});

// ===========================================================================
await nhom('4c · Mất mạng giữa chừng: không bao giờ "Đã lưu"', async () => {
  const nem = { rpc() { throw new TypeError('fetch failed'); }, from() { throw new TypeError('fetch failed'); } };
  const traLoi = { rpc: async () => ({ data: null, error: { message: 'TypeError: fetch failed' } }) };
  const sp = await docQL();
  for (const [ten, client] of [['client ném TypeError("fetch failed")', nem], ['client trả lỗi "TypeError: fetch failed"', traLoi]]) {
    const l = await BL.luuSanPham(client, idSp, formTuSanPham(sp, { ten_vi: 'Mất mạng' }), 'vi');
    ok(`${ten}: lưu → CAU_MAT_MANG_GHI, không "Đã lưu"`, l.ok === false && l.cau === CAU_MAT_MANG_GHI.vi, JSON.stringify(l));
    const t = await BL.taoSanPham(client, formTu({ ma_gui: maGui(), ten_vi: 'Mới', kieu: 'thit|theo_can' }), 'en');
    ok(`${ten}: thêm → CAU_MAT_MANG_GHI (tiếng Anh)`, t.ok === false && t.cau === CAU_MAT_MANG_GHI.en, JSON.stringify(t));
    const c = await BL.chotGia(client, idSp, sp.updated_at, JSON.stringify(sp.gia_de_chot), 'vi');
    ok(`${ten}: xác nhận giá → CAU_MAT_MANG_GHI`, c.ok === false && c.cau === CAU_MAT_MANG_GHI.vi, JSON.stringify(c));
  }
  // Hàm lưu trả nguoi_khac_sua rồi mạng đứt khi đọc lại: không đoán là đã lưu.
  const nuaChung = {
    rpc: async ten => (ten === 'ban_le_luu_san_pham'
      ? { data: { ok: false, ly_do: 'nguoi_khac_sua', updated_at: 'x' }, error: null }
      : { data: null, error: { message: 'TypeError: fetch failed' } }),
  };
  const n = await BL.luuSanPham(nuaChung, idSp, formTuSanPham(sp), 'vi');
  ok('nguoi_khac_sua rồi đọc lại hỏng → câu "người khác sửa", không "Đã lưu"', n.ok === false && n.maLoi === 'nguoi_khac_sua', JSON.stringify(n));
  let thrown = null;
  try { await BL.docDanhSach(nem, null); } catch (e) { thrown = e; }
  ok('Đọc menu khi mất mạng → ném, cauLoiDoc ra CAU_MAT_MANG_GHI', thrown && BL.cauLoiDoc(thrown, 'vi') === CAU_MAT_MANG_GHI.vi);
});

// ===========================================================================
await nhom('4d · Đọc: tồn, mặt hàng để chọn, đối chiếu — đúng quyền', async () => {
  const ds = await BL.docDanhSach(clientCua(UID.thuNganA), cnA.id);
  ok('Thu ngân đọc được menu, không thấy tồn dù gửi chi nhánh', ds.some(s => s.id === idSp) && ds.every(s => s.ton === null));
  const mh = await BL.docMatHangChon(QL, []);
  ok('Mặt hàng để chọn: có mặt hàng đang dùng, không có mặt hàng đã ngừng', mh.some(m => m.id === MH.ribeye) && !mh.some(m => m.id === MH.ngung));
  const mhGan = await BL.docMatHangChon(QL, [MH.ngung]);
  ok('Mặt hàng đã ngừng mà đang gắn → vẫn có trong danh sách (lần lưu không lặng lẽ gỡ nó)', mhGan.some(m => m.id === MH.ngung));
  ok('Marketing (không xem kho) đọc mặt hàng → 0 dòng (RLS)', (await BL.docMatHangChon(MKT, [])).length === 0);
  const dc = await BL.docDoiChieu(QL, cnA.id);
  ok('Quản lý đối chiếu chi nhánh mình → có dòng mã cân 1101 và menu_cu (chưa đọc thực đơn FABi)',
     dc.menu_cu === true && dc.dong.some(d => d.loai_dong === 'can' && d.ma_can === '1101'), JSON.stringify(dc).slice(0, 300));
  ok('…không dòng nào nói "tạo món" khi thực đơn FABi cũ', !dc.dong.some(d => d.viec.includes('tao_mon')));
  const cau = BL.cauViecDoiChieu(dc.dong[0], 'vi');
  ok('Mỗi việc có một câu, không còn mã thô', cau.length === dc.dong[0].viec.length && cau.every(c => !/^[a-z_]+$/.test(c)), cau.join(' | '));
  let loiMkt = null;
  try { await BL.docDoiChieu(MKT, cnA.id); } catch (e) { loiMkt = e; }
  ok('Marketing đối chiếu → ném, câu của database (vi và en)',
     BL.cauLoiDoc(loiMkt, 'vi') === 'Tài khoản này không đối chiếu được FABi ở chi nhánh này.'
     && BL.cauLoiDoc(loiMkt, 'en') === 'This account cannot reconcile FABi for this branch.', String(loiMkt?.message));
  const viecLa = BL.cauViecDoiChieu({ ...dc.dong[0], viec: ['viec_moi_chua_co'] }, 'vi');
  ok('Mã việc lạ (database mới hơn web) → hiện nguyên mã, không lỗi', viecLa[0] === 'viec_moi_chua_co');
  ok('moTaGhep: "bán theo gói, mỗi gói = 0,2 kg, trừ Ribeye Mỹ"',
     BL.moTaGhep({ kieu: 'mon', mat_hang_ten: 'Ribeye Mỹ', don_vi_ban: 'goi', kg_moi_don_vi: 0.2 }, 'vi') === 'bán theo gói, mỗi gói = 0,2 kg, trừ Ribeye Mỹ');
});

// ===========================================================================
await nhom('5 · Chọn chi nhánh: cookie riêng bt_ban_le_cn dưới /noi-bo/ban-le, chỉ chi nhánh đang hoạt động', async () => {
  const CN = [
    { id: 'a', ma: 'q1', ten: 'Quận 1', dang_hoat_dong: true },
    { id: 'b', ma: 'q7', ten: 'Quận 7', dang_hoat_dong: true },
    { id: 'c', ma: 'q9', ten: 'Quận 9', dang_hoat_dong: false },
  ];
  const clientCN = { from: () => ({ select: () => ({ order: () => Promise.resolve({ data: CN, error: null }) }) }) };
  const cookieGia = (dang = {}) => {
    const daGhi = [];
    return { daGhi, get: k => (dang[k] ? { value: dang[k] } : undefined), set: (k, v, tuy) => daGhi.push({ k, v, tuy }) };
  };
  const u = q => new URL(`https://beeftown.vn/noi-bo/ban-le${q}`);

  const c1 = cookieGia();
  const r1 = await BL.chonChiNhanhBanLe(clientCN, { chi_nhanh_id: null }, u('?cn=q7'), c1);
  ok('Chủ chọn ?cn=q7 → Quận 7', r1.chiNhanh?.ma === 'q7');
  ok('…ghi cookie bt_ban_le_cn = q7, path /noi-bo/ban-le, httpOnly, sameSite lax',
     c1.daGhi.length === 1 && c1.daGhi[0].k === 'bt_ban_le_cn' && c1.daGhi[0].v === 'q7'
     && c1.daGhi[0].tuy.path === '/noi-bo/ban-le' && c1.daGhi[0].tuy.httpOnly === true && c1.daGhi[0].tuy.sameSite === 'lax', JSON.stringify(c1.daGhi));
  ok('…không đụng cookie của Zalo hay kho', !c1.daGhi.some(x => /zalo|kho/.test(x.k)));
  ok('…danh sách để chọn chỉ có chi nhánh đang hoạt động', r1.cacChiNhanh.map(c => c.ma).join() === 'q1,q7');
  const c2 = cookieGia({ bt_ban_le_cn: 'q7' });
  const r2 = await BL.chonChiNhanhBanLe(clientCN, { chi_nhanh_id: null }, u(''), c2);
  ok('Chủ không ?cn= → đọc cookie bt_ban_le_cn, không ghi lại', r2.chiNhanh?.ma === 'q7' && c2.daGhi.length === 0);
  const c3 = cookieGia({ bt_zalo_cn: 'q7' });
  const r3 = await BL.chonChiNhanhBanLe(clientCN, { chi_nhanh_id: null }, u(''), c3);
  ok('Cookie của Zalo không ảnh hưởng — chi nhánh đầu tiên', r3.chiNhanh?.ma === 'q1');
  const c4 = cookieGia();
  const r4 = await BL.chonChiNhanhBanLe(clientCN, { chi_nhanh_id: null }, u('?cn=q9'), c4);
  ok('?cn= trỏ chi nhánh đã ngừng → chi nhánh đầu tiên đang hoạt động, không ghi cookie', r4.chiNhanh?.ma === 'q1' && c4.daGhi.length === 0);
  const c5 = cookieGia();
  const r5 = await BL.chonChiNhanhBanLe(clientCN, { chi_nhanh_id: 'b' }, u('?cn=q1'), c5);
  ok('Nhân sự có chi nhánh → luôn chi nhánh của mình, không chọn, không ghi cookie',
     r5.chiNhanh?.ma === 'q7' && r5.cacChiNhanh.length === 0 && c5.daGhi.length === 0);
  const r6 = await BL.chonChiNhanhBanLe(clientCN, { chi_nhanh_id: 'c' }, u(''), cookieGia());
  ok('Chi nhánh của nhân sự đã ngừng hoạt động → null (tồn hiện "—")', r6.chiNhanh === null);
  const r7 = await BL.chonChiNhanhBanLe(CHU, { chi_nhanh_id: null }, u(''), cookieGia());
  ok('Trên database thật: chủ thấy hai chi nhánh đang hoạt động', r7.cacChiNhanh.length === 2 && r7.loi === null, JSON.stringify(r7));
});

// ===========================================================================
await nhom('6 · ton-kho', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('kho_doi_soat_ton() rỗng', rows.length === 0, JSON.stringify(rows.slice(0, 3)));
});

await db.close();
process.exit(ketThuc('MENU BÁN LẺ: THƯ VIỆN WEB'));
