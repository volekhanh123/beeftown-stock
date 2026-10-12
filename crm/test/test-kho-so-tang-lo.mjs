/**
 * BEEFTOWN KHO — Kiểm thử số tảng cạnh mã lô, và nhắc "tảng còn đang ủ" khi lóc
 * ============================================================================
 *
 *     node test/test-kho-so-tang-lo.mjs
 *
 * CHỖ THIẾU ĐÃ THẤY (soát luồng 11/10/2026): với món theo dõi theo tảng, thứ duy nhất ghi
 * trên túi và in trên tem khay là SỐ TẢNG ("#0001"); mã lô (L261011-001) không có ở đâu
 * ngoài đời. Vậy mà mọi danh sách phải chọn / đếm một lô chỉ hiện mã lô: chọn tảng đem pha,
 * chọn lô cần hủy / cần lấy, kiểm kê theo lô, tồn kho, quét nhãn. Phiên lóc cũng không nhắc
 * gì khi tảng được chọn còn đang ủ (tảng #0001 ủ xong 18/10 bị lóc ngày 11/10).
 *
 * Bất biến:
 *   1. Tình trạng ủ tính ở web (tinhTrangU) khớp view kho_v_tang; câu nhắc đúng mẫu, đúng
 *      ngày Việt Nam (mốc 23:50 và 00:10), ngày không có thật thì không nhắc bừa.
 *   2. docLoTang: lô tảng và mọi lô cắt ra từ nó → số tảng; lô khác → vắng mặt. Vai không
 *      xem giá (thủ kho, NV quầy) vẫn đọc được; chi nhánh khác, vai khác, người đã nghỉ,
 *      chưa đăng nhập thì không. Nhiều lô vẫn chỉ vài lượt đọc, không mỗi lô một lượt.
 *   3. Mọi trang nêu tên một lô đều kèm số tảng; trang pha lóc có ngày mổ, tình trạng ủ ở
 *      mục chọn tảng và câu nhắc ở cả bước Cân & quét lẫn bước Kết quả.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, taoClientPg, UID, maGui } from './kho-chung.mjs';
import { datGio, traGio } from './dong-ho-gia.mjs';
import { VIET } from './quet-chu-viet.mjs';
import { homNayVn } from '../../web/src/lib/gio-vn.ts';
import * as TANG from '../../web/src/lib/kho/tang.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — SỐ TẢNG CẠNH MÃ LÔ · NHẮC TẢNG CÒN Ủ');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, 'web', 'src', p), 'utf8');
const co = ten => typeof TANG[ten] === 'function';

// ===========================================================================
await nhom('1 · TÌNH TRẠNG Ủ VÀ CÂU NHẮC (hàm thuần, ngày Việt Nam)', async () => {
  ok('HỒI QUY: tang.ts có tinhTrangU, cauTangConU, chuTang, soNgayGiua',
     co('tinhTrangU') && co('cauTangConU') && co('chuTang') && co('soNgayGiua'));
  const { tinhTrangU, cauTangConU, chuTang, soNgayGiua } = TANG;
  ok('Số ngày giữa hai ngày: 11/10 → 18/10 = 7; qua tháng, qua năm, lùi ngày',
     soNgayGiua('2026-10-11', '2026-10-18') === 7 && soNgayGiua('2026-10-28', '2026-11-02') === 5
     && soNgayGiua('2026-12-30', '2027-01-02') === 3 && soNgayGiua('2026-10-18', '2026-10-11') === -7);
  const j = x => JSON.stringify(x);
  ok('Ủ xong sau hôm nay → đang ủ, còn 7 ngày', j(tinhTrangU('2026-10-18', '2026-10-11')) === j({ tinh_trang_u: 'dang_u', con_ngay_u: 7 }));
  ok('Ủ xong đúng hôm nay → sẵn sàng lóc (0)', j(tinhTrangU('2026-10-11', '2026-10-11')) === j({ tinh_trang_u: 'san_sang', con_ngay_u: 0 }));
  ok('Ủ xong 3 ngày trước → sẵn sàng lóc (−3)', j(tinhTrangU('2026-10-08', '2026-10-11')) === j({ tinh_trang_u: 'san_sang', con_ngay_u: -3 }));
  ok('Chưa có ngày ủ xong → chưa có bảng ủ', j(tinhTrangU(null, '2026-10-11')) === j({ tinh_trang_u: 'chua_co_bang_u', con_ngay_u: null }));

  const t1 = { so_tang: 1, ngay_u_xong: '2026-10-18' };
  ok('HỒI QUY: câu nhắc đúng mẫu "Tảng #0001 còn đang ủ — ủ xong ngày 18/10/2026 (còn 7 ngày)."',
     cauTangConU(t1, '2026-10-11') === 'Tảng #0001 còn đang ủ — ủ xong ngày 18/10/2026 (còn 7 ngày).', String(cauTangConU(t1, '2026-10-11')));
  const en = cauTangConU(t1, '2026-10-11', 'en');
  ok('Câu nhắc tiếng Anh: đủ số tảng, ngày, số ngày còn lại; không lẫn chữ Việt',
     en === 'Primal #0001 is still aging — aging ends on 18/10/2026 (7 days left).' && !VIET.test(en), String(en));
  ok('Còn 1 ngày: tiếng Anh số ít "1 day left"', /\(1 day left\)/.test(cauTangConU(t1, '2026-10-17', 'en')) && /\(còn 1 ngày\)/.test(cauTangConU(t1, '2026-10-17')));
  ok('Ủ xong hôm nay, đã ủ xong, chưa có bảng ủ → không nhắc',
     cauTangConU(t1, '2026-10-18') === null && cauTangConU(t1, '2026-10-25') === null && cauTangConU({ so_tang: 1, ngay_u_xong: null }, '2026-10-11') === null);
  ok('Tảng chưa có số (dữ liệu cũ) → vẫn nhắc, không in "#"', cauTangConU({ so_tang: null, ngay_u_xong: '2026-10-18' }, '2026-10-11') === 'Tảng còn đang ủ — ủ xong ngày 18/10/2026 (còn 7 ngày).');

  // Giờ Việt Nam: 23:50 ngày 17/10 còn 1 ngày; 00:10 ngày 18/10 (UTC vẫn là 17/10) → hết nhắc.
  try {
    datGio('2026-10-17T16:50:00Z');
    const truoc = cauTangConU(t1, homNayVn());
    datGio('2026-10-17T17:10:00Z');
    const sau = cauTangConU(t1, homNayVn());
    ok('23:50 giờ VN ngày 17/10 → còn 1 ngày; 00:10 giờ VN ngày 18/10 (ngày UTC còn 17/10) → không nhắc nữa',
       /còn 1 ngày/.test(truoc ?? '') && sau === null, `${truoc} | ${sau}`);
  } finally { traGio(); }
  ok('Ngày không có thật (31/02) → coi như chưa biết ngày ủ xong, không nhắc bừa',
     tinhTrangU('2026-02-31', '2026-02-01').tinh_trang_u === 'chua_co_bang_u' && cauTangConU({ so_tang: 1, ngay_u_xong: '2026-02-31' }, '2026-02-01') === null
     && Number.isNaN(soNgayGiua('2026-02-31', '2026-03-05')));

  ok('chuTang: "tảng #0001" / "primal #0001"; không có số tảng → chuỗi rỗng',
     chuTang(1) === 'tảng #0001' && chuTang(142, 'en') === 'primal #0142' && chuTang(null) === '' && chuTang(undefined, 'en') === '');
});

// ===========================================================================
const { db, cnA, duoi, duoiAnon } = await dungDatabase();
const clientCua = await taoClientPg({ db, duoi, duoiAnon });
const MH = {};
let vt = {};
const lo = {};

await nhom('2 · docLoTang, docNgayUTang TRÊN DATABASE THẬT (PGlite): ĐÚNG SỐ TẢNG, ĐÚNG QUYỀN', async () => {
  const chay = async (uid, sql, gt = []) => { const r = await duoi(uid, sql, gt); if (r.loi) throw new Error(`${sql.slice(0, 70)}… → ${r.loi}`); return r.rows; };
  const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
  const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
  await chay(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await chay(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vt = Object.fromEntries((await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  // Thăn ngoại: theo tảng, có bảng ủ (tuổi ≤ 5 ngày ủ 18, ≤ 10 ủ 14, còn lại 10). Thăn nội: theo tảng, CHƯA có bảng ủ. Gầu: không theo tảng.
  await chay(UID.qlA, `update kho_mat_hang set theo_tang = true where ma in ('T-THANNGOAI', 'T-THANNOI')`);
  await chay(UID.qlA, `insert into kho_bang_u (mat_hang_id, tuoi_den_ngay, so_ngay_u) values ($1, 5, 18), ($1, 10, 14), ($1, null, 10)`, [MH['T-THANNGOAI'].id]);
  const ncc = (await chay(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC Úc') returning id`))[0].id;
  const nhap = async (ngayNhap, dong) => {
    const p = (await chay(UID.qlA, `
      select * from kho_luu_phieu_nhap(
        p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null, p_loai => 'mua', p_nha_cung_cap_id => $3,
        p_vi_tri_id => $4, p_ngay_nhap => $5::date, p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
        p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
        p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`, [cnA.id, maGui(), ncc, vt.kho, ngayNhap, JSON.stringify(dong)]))[0];
    await chay(UID.thuKhoA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
    await chay(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [p.phieu_id]);
    return (await db.query(`select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
      where d.phieu_nhap_id = $1 order by d.thu_tu`, [p.phieu_id])).rows;
  };
  const tang = (ma, kg, ngayMo) => ({ mat_hang_id: MH[ma].id, so_kg: kg, so_kg_thuc: kg, don_gia_kg: 500000, ngay_mo: ngayMo });
  // Nhận 20 ngày trước, mổ 40 ngày trước (tuổi 20 → ủ 10 ngày) → ủ xong 10 ngày trước: hai tảng SẴN SÀNG.
  const cu = await nhap(await ngay(-20), [tang('T-THANNGOAI', 6.1, await ngay(-40)), tang('T-THANNGOAI', 6.2, await ngay(-40))]);
  // Nhận 3 ngày trước: mổ 6 ngày trước (tuổi 3 → ủ 18) → còn 15 ngày; mổ 30 ngày trước (tuổi 27 → ủ 10) → còn 7 ngày; thăn nội chưa có bảng ủ; gầu không theo tảng.
  const moi = await nhap(await ngay(-3), [
    tang('T-THANNGOAI', 6.3, await ngay(-6)), tang('T-THANNGOAI', 6.4, await ngay(-30)), tang('T-THANNOI', 3.1, await ngay(-6)),
    { mat_hang_id: MH['T-GAU'].id, so_kg: 5, so_goi: 1, don_gia_kg: 200000 },
  ]);
  [lo.sanSang1, lo.sanSang2] = cu;
  [lo.con15, lo.con7, lo.chuaBang, lo.gau] = moi;
  ok('Sáu lô: năm tảng có số #1–#5, lô gầu không có số tảng',
     [lo.sanSang1, lo.sanSang2, lo.con15, lo.con7, lo.chuaBang].map(l => l.so_tang).join() === '1,2,3,4,5' && lo.gau.so_tang === null);

  // Lóc hết tảng #1 → hai lô phần cắt (thăn ngoại cắt lát, thăn nội cắt miếng) mang tảng gốc #1.
  const ph = (await chay(UID.thuKhoA, `
    select * from kho_luu_phien_pha(p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_mat_hang_vao_id => $3, p_cong_thuc_id => null, p_ngay_pha => $4::date, p_ghi_chu => null, p_vao => $5::jsonb, p_ra => $6::jsonb)`,
    [cnA.id, maGui(), MH['T-THANNGOAI'].id, homNay, JSON.stringify([{ lo_id: lo.sanSang1.id, vi_tri_id: vt.kho }]),
     JSON.stringify([{ mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 3.2, so_goi: 8, vi_tri_id: vt.kho }, { mat_hang_id: MH['C-THANNOI'].id, so_kg: 1.1, so_goi: 3, vi_tri_id: vt.kho }])]))[0].phien_id;
  await chay(UID.thuKhoA, `select kho_chot_phien_pha($1, $2)`, [ph, (await db.query(`select phien_ban from kho_phien_pha where id = $1`, [ph])).rows[0].phien_ban]);
  const ra = (await db.query(`select lo_id from kho_phien_pha_ra where phien_pha_id = $1 and lo_id is not null order by thu_tu`, [ph])).rows.map(r => r.lo_id);
  [lo.cat1, lo.cat2] = ra;
  ok('Phiên lóc tảng #1 chốt xong: hai lô phần cắt', ra.length === 2);

  ok('HỒI QUY: tang.ts có docLoTang và docNgayUTang', co('docLoTang') && co('docNgayUTang'));
  const tatCa = [lo.sanSang1.id, lo.sanSang2.id, lo.con15.id, lo.con7.id, lo.chuaBang.id, lo.gau.id, lo.cat1, lo.cat2];
  const tk = await TANG.docLoTang(clientCua(UID.thuKhoA), [...tatCa, 'khong-phai-uuid', null, undefined, lo.cat1]);
  ok('HỒI QUY: thủ kho — lô tảng → số tảng của nó; hai lô cắt ra → tảng gốc #1; lô gầu vắng mặt',
     tk.size === 7 && tk.get(lo.sanSang2.id)?.so_tang === 2 && tk.get(lo.con7.id)?.so_tang === 4 && tk.get(lo.chuaBang.id)?.so_tang === 5
     && tk.get(lo.cat1)?.so_tang === 1 && tk.get(lo.cat2)?.so_tang === 1 && tk.get(lo.cat1)?.tang_id === lo.sanSang1.id
     && tk.get(lo.sanSang1.id)?.tang_id === lo.sanSang1.id && !tk.has(lo.gau.id), JSON.stringify([...tk]));
  const nv = await TANG.docLoTang(clientCua(UID.nvQuayA), tatCa);
  ok('NV quầy (không xem giá) đọc được y như thủ kho', nv.size === 7 && nv.get(lo.cat1)?.so_tang === 1);
  ok('Kết quả không có khóa tiền nào', [...tk.values()].every(v => Object.keys(v).sort().join() === 'so_tang,tang_id'));
  for (const [ten, uid] of [['Quản lý chi nhánh khác', UID.qlB], ['Thủ kho chi nhánh khác', UID.thuKhoB], ['Thu ngân', UID.thuNganA],
                            ['Marketing', UID.mktA], ['Người đã nghỉ', UID.nghiViec], ['Tài khoản không phải nhân sự', null]]) {
    const r = await TANG.docLoTang(clientCua(uid), tatCa).then(m => m.size, e => `LỖI ${e.message ?? e}`);
    ok(`${ten}: không đọc được số tảng của lô nào`, r === 0, String(r));
  }
  const anon = await TANG.docLoTang(clientCua('anon'), tatCa).then(m => m.size, e => `LỖI ${e.message ?? e}`);
  ok('Chưa đăng nhập (anon): bị từ chối', /^LỖI/.test(String(anon)) || anon === 0, String(anon));

  // Nhiều lô: gom thành vài lượt đọc, không mỗi lô một lượt; danh sách rỗng thì không gọi database.
  const goi = [];
  const dem = { from: () => ({ select: () => ({ in: (k, ds) => { goi.push(ds); return Promise.resolve({ data: [], error: null }); } }) }) };
  const nhieu = Array.from({ length: 400 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`);
  await TANG.docLoTang(dem, [...nhieu, ...nhieu.slice(0, 50)]);
  ok('400 lô (kèm 50 lô lặp lại) → 3 lượt đọc, mỗi lượt không quá 150 lô, đủ 400 lô không trùng',
     goi.length === 3 && goi.every(ds => ds.length <= 150) && new Set(goi.flat()).size === 400 && goi.flat().length === 400, goi.map(d => d.length).join());
  goi.length = 0;
  await TANG.docLoTang(dem, []); await TANG.docLoTang(dem, [null, 'x']);
  ok('Không có lô hợp lệ → không gọi database', goi.length === 0);
  const hong = { from: () => ({ select: () => ({ in: () => Promise.resolve({ data: null, error: { message: 'fetch failed' } }) }) }) };
  ok('Đọc hỏng → ném lỗi (trang tự bắt và vẫn hiện mã lô như cũ)', await TANG.docLoTang(hong, nhieu.slice(0, 2)).then(() => false, () => true));

  // Ngày mổ, ngày ủ xong của tảng — khớp view kho_v_tang; tình trạng ủ tính ở web khớp view.
  const nu = await TANG.docNgayUTang(clientCua(UID.thuKhoA), tatCa);
  const view = (await db.query(`select lo_id, so_tang, ngay_mo::text as ngay_mo, ngay_u_xong::text as ngay_u_xong, tinh_trang_u, con_ngay_u
    from kho_v_tang where chi_nhanh_id = $1 order by so_tang`, [cnA.id])).rows;
  ok('kho_v_tang còn bốn tảng trong kho: #2 sẵn sàng, #3 và #4 đang ủ, #5 chưa có bảng ủ',
     view.map(v => `${v.so_tang}:${v.tinh_trang_u}:${v.con_ngay_u ?? ''}`).join() === '2:san_sang:-10,3:dang_u:15,4:dang_u:7,5:chua_co_bang_u:', JSON.stringify(view));
  const lech = view.filter(v => {
    const w = nu.get(v.lo_id);
    const tt = w ? TANG.tinhTrangU(w.ngay_u_xong, homNay) : null;
    return !w || w.so_tang !== v.so_tang || w.ngay_mo !== v.ngay_mo || w.ngay_u_xong !== v.ngay_u_xong
      || tt.tinh_trang_u !== v.tinh_trang_u || tt.con_ngay_u !== v.con_ngay_u;
  });
  ok('HỒI QUY: docNgayUTang + tinhTrangU của web khớp kho_v_tang ở cả bốn tảng (số tảng, ngày mổ, ngày ủ xong, tình trạng, số ngày còn)',
     view.length === 4 && lech.length === 0, JSON.stringify(lech));
  ok('Tảng đã lóc hết (#1, không còn trong kho_v_tang) vẫn đọc được ngày ủ xong — màn xem phiên đã chốt cần',
     nu.get(lo.sanSang1.id)?.so_tang === 1 && nu.get(lo.sanSang1.id)?.ngay_u_xong === await ngay(-10));
  ok('Câu nhắc cho tảng #3 (còn 15 ngày) và #4 (còn 7 ngày); không nhắc tảng #2 (đã ủ xong) và #5 (chưa có bảng ủ)',
     /Tảng #0003 còn đang ủ .*\(còn 15 ngày\)\.$/.test(TANG.cauTangConU(nu.get(lo.con15.id), homNay) ?? '')
     && /Tảng #0004 còn đang ủ .*\(còn 7 ngày\)\.$/.test(TANG.cauTangConU(nu.get(lo.con7.id), homNay) ?? '')
     && TANG.cauTangConU(nu.get(lo.sanSang2.id), homNay) === null && TANG.cauTangConU(nu.get(lo.chuaBang.id), homNay) === null);
  const nvU = await TANG.docNgayUTang(clientCua(UID.nvQuayA), [lo.con7.id]);
  const qlB = await TANG.docNgayUTang(clientCua(UID.qlB), [lo.con7.id]).then(m => m.size, () => 0);
  ok('NV quầy đọc được ngày ủ của tảng; quản lý chi nhánh khác thì không', nvU.get(lo.con7.id)?.so_tang === 4 && qlB === 0);

  const ds = (await db.query(`select * from kho_doi_soat_ton()`)).rows;
  ok('kho_doi_soat_ton() rỗng', ds.length === 0, JSON.stringify(ds));
});

// ===========================================================================
await nhom('3 · MỌI TRANG NÊU TÊN MỘT LÔ ĐỀU KÈM SỐ TẢNG', async () => {
  const dem = (s, mau) => (s.match(mau) ?? []).length;
  const TRANG = [
    ['Phiếu chuyển / xuất bếp / báo hủy (chọn lô, Lô đã lấy, bản in)', 'pages/noi-bo/kho/xuat/[id].astro'],
    ['Kiểm kê (đếm theo lô, bảng chênh lệch, biên bản in)', 'pages/noi-bo/kho/kiem-ke/[id].astro'],
    ['Tồn kho (dòng lô)', 'pages/noi-bo/kho/ton.astro'],
    ['Quét nhãn (dòng lô)', 'pages/noi-bo/kho/quet.astro'],
    ['Thẻ kho (cột nơi · lô)', 'pages/noi-bo/kho/the-kho/[mat_hang_id].astro'],
    ['Trả hàng nhà cung cấp (chọn lô)', 'pages/noi-bo/kho/cong-no/tra-hang.astro'],
  ];
  for (const [ten, duong] of TRANG) {
    const s = doc(duong);
    ok(`HỒI QUY: ${ten} — đọc số tảng của các lô đang hiện bằng MỘT lời gọi docLoTang, in bằng chuTang(…, nn)`,
       dem(s, /docLoTang\(/g) === 1 && /chuTang\([^\n]*?,\s*nn\)/.test(s), `docLoTang: ${dem(s, /docLoTang\(/g)} lần`);
  }
  const nhap = doc('pages/noi-bo/kho/nhap/[id].astro');
  ok('HỒI QUY: phiếu nhập (cột Lô, bản in) — số tảng đọc cùng lượt với mã lô (docPhieuNhap trả soTang), in bằng chuTang',
     /soTang/.test(nhap) && /chuTang\([^\n]*?,\s*nn\)/.test(nhap) && /select\('id, ma_lo, so_tang'\)/.test(doc('lib/kho/nhap.ts')));

  const pha = doc('pages/noi-bo/kho/pha-loc/[id].astro');
  ok('HỒI QUY: phiên lóc — mục "Tảng đem pha" hiện số tảng, ngày mổ, tình trạng ủ (TINH_TRANG_U_NB, cauConU)',
     /docNgayUTang\(/.test(pha) && /chuTang\(/.test(pha) && /TINH_TRANG_U_NB/.test(pha) && /cauConU\(/.test(pha) && /t\.moNgay\(/.test(pha));
  ok('HỒI QUY: phiên lóc — câu nhắc tảng còn đang ủ dựng bằng cauTangConU với ngày Việt Nam (homNayVn)',
     /cauTangConU\([^)]*homNayVn\(\)[^)]*\)/.test(pha) || (/cauTangConU\(/.test(pha) && /const homNay = homNayVn\(\)/.test(pha)));
  // Câu nhắc là dòng vàng (nb-bao luu-y), có ở bước Cân & quét VÀ bước Kết quả; không chặn nút Chốt.
  const khoi = ten => {
    const i = pha.indexOf(`buoc === '${ten}' ? (`);
    const cac = ["buoc === 'can_quet' ? (", "buoc === 'ket_qua' ? (", "buoc === 'xong' ? ("].map(m => pha.indexOf(m)).filter(x => x > i);
    return i < 0 ? '' : pha.slice(i, Math.min(...cac, pha.length));
  };
  const coNhac = s => /nb-bao luu-y[^>]*>\s*\{canhBaoU\.map\(/.test(s);
  ok('HỒI QUY: câu nhắc hiện ở bước Cân & quét', coNhac(khoi('can_quet')));
  ok('HỒI QUY: câu nhắc hiện ở bước Kết quả, và nút Chốt vẫn còn (chỉ nhắc, không chặn)',
     coNhac(khoi('ket_qua')) && /name="viec" value="chot"/.test(khoi('ket_qua')));
  ok('Màn xem phiên đã chốt: bảng "Tảng đem pha" và cột "Lô mới" có số tảng', dem(khoi('xong'), /chuTang\(/g) >= 2);
  // Vai không xem giá vẫn thấy: các dòng số tảng / câu nhắc không nằm sau điều kiện xemGia.
  ok('Số tảng và câu nhắc không phụ thuộc quyền xem giá', !/xemGia\s*&&[^\n]*(chuTang|canhBaoU)/.test(pha));
});

process.exit(ketThuc('SỐ TẢNG CẠNH MÃ LÔ · NHẮC TẢNG CÒN Ủ'));
