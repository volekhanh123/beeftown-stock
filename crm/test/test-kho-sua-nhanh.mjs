/**
 * BEEFTOWN KHO — Kiểm thử sửa hàng loạt danh mục, báo cáo tháng, mua hàng,
 *                 sổ thanh toán (0041, GĐ8c)
 * =========================================================================
 *
 *     node test/test-kho-sua-nhanh.mjs
 *
 * Những điều phải đúng tuyệt đối:
 *   · sửa hàng loạt: ô trống / vắng = GIỮ, null = xóa; phiên bản cũ = lỗi dòng
 *     "người khác vừa sửa"; có một lỗi thì KHÔNG dòng nào được ghi (tất cả hoặc
 *     không) và mỗi lỗi chỉ đúng dòng, đúng ô; mã cân trùng bị chặn, đổi chéo
 *     mã cân giữa hai món được; thủ kho / kế toán / NV quầy không gọi được;
 *   · báo cáo tháng: từng tháng khớp kho_bao_cao_xnt_v2 cùng khoảng ngày;
 *     tồn cuối = tồn đầu + nhập − các loại xuất; tồn cuối tháng này = tồn
 *     tháng sau; doanh thu iPOS bỏ dòng đã hủy; tiền null cho thủ kho / NV quầy;
 *   · mua hàng theo NCC / mặt hàng: đúng kg, tiền hàng, thuế, phải trả (tiền
 *     hóa đơn khi đã đối chiếu), giá TB / thấp / cao; chỉ vai xem giá;
 *   · sổ thanh toán: đủ khoản (cả khoản đã hủy, tiền = 0), tiền ra / vào /
 *     giảm nợ đúng dấu; chỉ ke_toan;
 *   · cuối cùng tồn khớp sổ kho.
 */

import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — SỬA HÀNG LOẠT · BÁO CÁO THÁNG · MUA HÀNG · SỔ THANH TOÁN (0041)');
const { db, cnA, cnB, duoi } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
const n = v => (v === null || v === undefined ? v : Number(v));
const namCua = d => Number(d.slice(0, 4));
const thangCua = d => Number(d.slice(5, 7));

async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

const MH = {};
let viTri = {};
let nccUc, nccMy;

async function nhapHang({ ncc, ngayNhap = homNay, thue = 0, chiPhi = 0, dong }) {
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => $6, p_chi_phi_khac => $7, p_ghi_chu => null,
      p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $8::jsonb)`,
    [cnA.id, maGui(), ncc, viTri.kho, ngayNhap, thue, chiPhi, JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  const gui = await duoi(UID.qlA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
  if (gui.loi) throw new Error(gui.loi);
  const d = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [p.phieu_id]);
  if (d.loi) throw new Error(d.loi);
  const { rows: lo } = await db.query(`
    select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1 order by d.thu_tu`, [p.phieu_id]);
  const { rows: [pn] } = await db.query(`select * from kho_phieu_nhap where id = $1`, [p.phieu_id]);
  return { id: p.phieu_id, so: pn.so_phieu, lo };
}

const suaNhanh = (uid, dong, cn = cnA.id) =>
  duoi(uid, `select kho_sua_nhanh_mat_hang($1, $2::jsonb) as kq`, [cn, JSON.stringify(dong)]);
const mh = async ma => (await db.query(`select * from kho_mat_hang where ma = $1`, [ma])).rows[0];
/** updated_at dạng chuỗi ISO — đúng như web đọc từ PostgREST. */
const pb = async ma => (await db.query(`select to_json(updated_at) #>> '{}' as p from kho_mat_hang where ma = $1`, [ma])).rows[0].p;

let P1, P2, P3;

// ===========================================================================
await nhom('1 · CHUẨN BỊ: DANH MỤC MẪU, HAI NCC, BA PHIẾU MUA (HAI THÁNG)', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  viTri = Object.fromEntries((await db.query(
    `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  const them = async ten => (await duoi(UID.keToanA,
    `insert into kho_nha_cung_cap (ten, so_ngay_no) values ($1, 15) returning id`, [ten])).rows?.[0]?.id;
  nccUc = await them('NCC Úc');
  nccMy = await them('NCC Mỹ');
  ok('Có danh mục mẫu và hai NCC', Object.keys(MH).length > 5 && nccUc && nccMy);

  // P1: 40 ngày trước (tháng trước hoặc trước nữa) — Úc, thuế 100.000
  P1 = await nhapHang({ ncc: nccUc, ngayNhap: await ngay(-40), thue: 100000,
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 2, so_kg: 10, don_gia_kg: 500000 },
           { mat_hang_id: MH['T-NACVAI'].id, so_goi: 1, so_kg: 5, don_gia_kg: 300000 }] });
  // P2: hôm nay — Mỹ, chi phí 50.000
  P2 = await nhapHang({ ncc: nccMy, chiPhi: 50000,
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 4, don_gia_kg: 600000 }] });
  // P3: hôm nay — Úc, 2,5 kg thăn giá 450.000
  P3 = await nhapHang({ ncc: nccUc,
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 2.5, don_gia_kg: 450000 }] });
  ok('Ba phiếu mua đã duyệt', P1.lo.length === 2 && P2.lo.length === 1 && P3.lo.length === 1);

  // Xuất bếp tảng thăn Mỹ (4 kg, giá vốn gồm chi phí khác: 2.450.000) hôm nay.
  const xb = await duoi(UID.qlA, `
    select * from kho_tao_phieu_xuat($1, $2, 'xuat_bep', $3, null, null, null, '{}'::text[], $4::jsonb)`,
    [cnA.id, maGui(), viTri.kho, JSON.stringify([{ mat_hang_id: MH['T-THANNGOAI'].id, lo_id: P2.lo[0].id, so_goi: 1, so_kg: 4 }])]);
  ok('Xuất bếp tảng thăn 4 kg', xb.loi === null, xb.loi ?? '');

  // Hai dòng iPOS: một dòng bán thật (nước ngọt 30.000 — bỏ qua kho), một dòng đã hủy.
  const { rows: [hd] } = await db.query(`
    insert into kho_ipos_hoa_don (chi_nhanh_id, ma_hd, bam, thoi_diem_ban) values ($1, 'HD1', 'x', now()) returning id`, [cnA.id]);
  await db.query(`
    insert into kho_ipos_dong (hoa_don_id, chi_nhanh_id, khoa_dong, thoi_diem_ban, ten_ipos, thanh_tien, trang_thai)
    values ($1, $2, '1', now(), 'Nước ngọt', 30000, 'bo_qua'), ($1, $2, '2', now(), 'Món hủy', 999000, 'da_huy')`,
    [hd.id, cnA.id]);
  await doiSoat('Sau chuẩn bị');
});

// ===========================================================================
await nhom('2 · SỬA HÀNG LOẠT: Ô TRỐNG GIỮ, NULL XÓA, CHỈ DÒNG ĐỔI MỚI GHI', async () => {
  const thanTruoc = await mh('C-THANNGOAI');
  const nacTruoc = await mh('C-NACVAI');
  const khac = (await db.query(`select * from kho_mat_hang where ma not in ('C-THANNGOAI', 'C-NACVAI') order by ma limit 1`)).rows[0];
  const r = await suaNhanh(UID.qlA, [
    { id: thanTruoc.id, phien_ban: await pb('C-THANNGOAI'), gia_ban_kg: '720000', han_dung_ngay: '', ma_can: '00123',
      quay_toi_thieu_goi: 4, quay_toi_da_goi: '10', kho_toi_thieu_kg: '2,5', kho_toi_da_kg: 12, noi_de_sau_pha: 'quay' },
    { id: nacTruoc.id, phien_ban: await pb('C-NACVAI'), gia_ban_kg: '' },
  ]);
  const kq = r.rows?.[0]?.kq;
  ok('Quản lý lưu hai dòng', r.loi === null && kq?.ok === true, r.loi ?? JSON.stringify(kq));
  ok('Dòng không đổi gì không được tính là đã lưu', kq?.so_dong_luu === 1 && kq?.so_dong_khong_doi === 1, JSON.stringify(kq));
  ok('Trả phiên bản mới của dòng đã lưu', kq?.dong?.length === 1 && kq.dong[0].id === thanTruoc.id && !!kq.dong[0].phien_ban);
  const than = await mh('C-THANNGOAI');
  ok('Giá bán, mã cân (bỏ số 0 đầu), mức quầy, mức kho lạnh (1,5 → số), nơi để sau pha đã đổi',
     n(than.gia_ban_kg) === 720000 && than.ma_can === '123' && than.quay_toi_thieu_goi === 4 && than.quay_toi_da_goi === 10
     && n(than.kho_toi_thieu_kg) === 2.5 && n(than.kho_toi_da_kg) === 12 && than.noi_de_sau_pha === 'quay', JSON.stringify(than));
  ok('Ô trống "" (hạn dùng) giữ nguyên', than.han_dung_ngay === thanTruoc.han_dung_ngay);
  ok('Ô vắng (đang dùng, tồn tối thiểu, tên) giữ nguyên',
     than.dang_dung === thanTruoc.dang_dung && than.ten === thanTruoc.ten && String(than.ton_toi_thieu_kg) === String(thanTruoc.ton_toi_thieu_kg));
  const nac = await mh('C-NACVAI');
  ok('Dòng không đổi: updated_at giữ nguyên', String(nac.updated_at) === String(nacTruoc.updated_at));
  const khacSau = (await db.query(`select * from kho_mat_hang where id = $1`, [khac.id])).rows[0];
  ok('Món không gửi lên không bị chạm', String(khacSau.updated_at) === String(khac.updated_at));
  ok('Phiên bản trả về = updated_at mới', kq?.dong?.[0]?.phien_ban === await pb('C-THANNGOAI'));

  // null = xóa; ngưng dùng
  const x = await suaNhanh(UID.chu, [
    { id: than.id, phien_ban: kq.dong[0].phien_ban, kho_toi_thieu_kg: null, kho_toi_da_kg: null, noi_de_sau_pha: null },
    { id: nac.id, phien_ban: await pb('C-NACVAI'), dang_dung: false },
  ]);
  const t2 = await mh('C-THANNGOAI'), n2 = await mh('C-NACVAI');
  ok('Chủ: null xóa mức kho lạnh và nơi để sau pha; ngưng dùng một món',
     x.loi === null && x.rows[0].kq.ok && t2.kho_toi_thieu_kg === null && t2.kho_toi_da_kg === null
     && t2.noi_de_sau_pha === null && n2.dang_dung === false && n(t2.gia_ban_kg) === 720000, x.loi ?? JSON.stringify(x.rows?.[0]?.kq));
  const bat = await suaNhanh(UID.qlA, [{ id: nac.id, phien_ban: await pb('C-NACVAI'), dang_dung: 'true' }]);
  ok('Bật dùng lại bằng chữ "true"', bat.rows?.[0]?.kq?.ok && (await mh('C-NACVAI')).dang_dung === true);
  const rong = await suaNhanh(UID.qlA, []);
  ok('Danh sách rỗng: ok, 0 dòng', rong.rows?.[0]?.kq?.ok === true && rong.rows[0].kq.so_dong_luu === 0);
});

// ===========================================================================
await nhom('3 · SỬA HÀNG LOẠT: XUNG ĐỘT PHIÊN BẢN, LỖI DÒNG, TẤT CẢ HOẶC KHÔNG', async () => {
  const cuThan = await pb('C-THANNGOAI');
  const cuNac = await pb('C-NACVAI');
  // Người khác sửa thăn trong lúc mình đang mở trang.
  await suaNhanh(UID.chu, [{ id: MH['C-THANNGOAI'].id, phien_ban: cuThan, gia_ban_kg: 730000 }]);
  const truocNac = await mh('C-NACVAI');
  const r = await suaNhanh(UID.qlA, [
    { id: MH['C-NACVAI'].id, phien_ban: cuNac, gia_ban_kg: 555000 },
    { id: MH['C-THANNGOAI'].id, phien_ban: cuThan, gia_ban_kg: 740000 },
  ]);
  const kq = r.rows?.[0]?.kq;
  ok('Phiên bản cũ: ok = false, lỗi đúng dòng 2', r.loi === null && kq?.ok === false && kq.loi.length === 1
     && kq.loi[0].dong === 2 && kq.loi[0].id === MH['C-THANNGOAI'].id, JSON.stringify(kq));
  ok('Câu lỗi nói "người khác sửa", "tải lại"', /người khác sửa/.test(kq?.loi?.[0]?.cau ?? '') && /tải lại/i.test(kq?.loi?.[0]?.cau ?? ''),
     kq?.loi?.[0]?.cau);
  ok('Tất cả hoặc không: dòng 1 (hợp lệ) KHÔNG được ghi', n((await mh('C-NACVAI')).gia_ban_kg) === n(truocNac.gia_ban_kg)
     && String((await mh('C-NACVAI')).updated_at) === String(truocNac.updated_at));
  ok('Giá của người sửa trước còn nguyên', n((await mh('C-THANNGOAI')).gia_ban_kg) === 730000);

  const thieuPb = await suaNhanh(UID.qlA, [{ id: MH['C-NACVAI'].id, gia_ban_kg: 1 }]);
  ok('Thiếu phiên bản: lỗi dòng', thieuPb.rows?.[0]?.kq?.ok === false && /phiên bản/.test(thieuPb.rows[0].kq.loi[0].cau));

  // Nhiều lỗi một lần, mỗi lỗi đúng ô.
  const p1 = await pb('C-NACVAI'), p2 = await pb('C-THANNGOAI');
  const nhieu = await suaNhanh(UID.qlA, [
    { id: MH['C-NACVAI'].id, phien_ban: p1, gia_ban_kg: 'abc', han_dung_ngay: 0, ma_can: '12a', noi_de_sau_pha: 'bep' },
    { id: MH['C-THANNGOAI'].id, phien_ban: p2, quay_toi_thieu_goi: 20, quay_toi_da_goi: 5, kho_toi_thieu_kg: 9, kho_toi_da_kg: 3 },
    { id: MH['C-THANNGOAI'].id, phien_ban: p2 },
    { id: '00000000-0000-4000-8000-000000000999', phien_ban: p2 },
    { phien_ban: p2 },
  ]);
  const loi = nhieu.rows?.[0]?.kq?.loi ?? [];
  const o = (dong, truong) => loi.some(l => l.dong === dong && l.truong === truong);
  ok('Dòng 1: lỗi giá, hạn dùng, mã cân, nơi để — mỗi ô một lỗi',
     o(1, 'gia_ban_kg') && o(1, 'han_dung_ngay') && o(1, 'ma_can') && o(1, 'noi_de_sau_pha'), JSON.stringify(loi));
  ok('Dòng 2: tối thiểu > tối đa (quầy và kho lạnh) bị chặn trên giá trị cuối', o(2, 'quay_toi_da_goi') && o(2, 'kho_toi_da_kg'));
  ok('Dòng 3: món gửi hai lần; dòng 4: không có món; dòng 5: thiếu mặt hàng',
     loi.some(l => l.dong === 3 && /hai lần/.test(l.cau)) && loi.some(l => l.dong === 4 && /Không tìm thấy/.test(l.cau))
     && loi.some(l => l.dong === 5 && /thiếu mặt hàng/.test(l.cau)), JSON.stringify(loi));
  ok('Mọi câu lỗi có tên món (trừ dòng không xác định được món)',
     loi.filter(l => l.ten).every(l => l.cau.startsWith(l.ten)));
  ok('Không dòng nào bị ghi', (await pb('C-NACVAI')) === p1 && (await pb('C-THANNGOAI')) === p2);

  // Giữ mức cũ: tối đa quầy cũ 10, gửi tối thiểu 12 thôi → lỗi (so với ô giữ).
  const giu = await suaNhanh(UID.qlA, [{ id: MH['C-THANNGOAI'].id, phien_ban: p2, quay_toi_thieu_goi: 12 }]);
  ok('Tối thiểu mới > tối đa đang có (ô giữ) bị chặn', giu.rows?.[0]?.kq?.ok === false
     && giu.rows[0].kq.loi[0].truong === 'quay_toi_da_goi');
});

// ===========================================================================
await nhom('4 · SỬA HÀNG LOẠT: MÃ CÂN TRÙNG, ĐỔI CHÉO MÃ CÂN', async () => {
  const a = await mh('C-THANNGOAI'); // mã cân 123
  const b = await mh('C-NACVAI');
  const t1 = await suaNhanh(UID.qlA, [{ id: b.id, phien_ban: await pb('C-NACVAI'), ma_can: '123' }]);
  ok('Mã cân trùng món đang dùng khác: lỗi đúng ô, nói tên món kia',
     t1.rows?.[0]?.kq?.ok === false && t1.rows[0].kq.loi[0].truong === 'ma_can' && t1.rows[0].kq.loi[0].cau.includes(a.ten),
     JSON.stringify(t1.rows?.[0]?.kq));
  const t2 = await suaNhanh(UID.qlA, [
    { id: a.id, phien_ban: await pb('C-THANNGOAI'), ma_can: '777' },
    { id: b.id, phien_ban: await pb('C-NACVAI'), ma_can: '777' },
  ]);
  ok('Hai dòng cùng một mã cân mới trong một lần lưu: bị chặn', t2.rows?.[0]?.kq?.ok === false
     && t2.rows[0].kq.loi.filter(l => l.truong === 'ma_can').length === 2);
  const g = await suaNhanh(UID.qlA, [{ id: b.id, phien_ban: await pb('C-NACVAI'), ma_can: '456' }]);
  ok('Đặt mã cân 456 cho nạc vai', g.rows?.[0]?.kq?.ok === true);
  const cheo = await suaNhanh(UID.qlA, [
    { id: a.id, phien_ban: await pb('C-THANNGOAI'), ma_can: '456' },
    { id: b.id, phien_ban: await pb('C-NACVAI'), ma_can: '123' },
  ]);
  ok('Đổi chéo mã cân giữa hai món trong một lần lưu', cheo.loi === null && cheo.rows[0].kq.ok === true
     && (await mh('C-THANNGOAI')).ma_can === '456' && (await mh('C-NACVAI')).ma_can === '123', cheo.loi ?? JSON.stringify(cheo.rows?.[0]?.kq));
  const ngung = await suaNhanh(UID.qlA, [
    { id: b.id, phien_ban: await pb('C-NACVAI'), dang_dung: false },
    { id: a.id, phien_ban: await pb('C-THANNGOAI'), ma_can: '123' },
  ]);
  ok('Ngưng dùng món này, món kia lấy mã cân của nó trong cùng lần lưu', ngung.rows?.[0]?.kq?.ok === true
     && (await mh('C-THANNGOAI')).ma_can === '123', JSON.stringify(ngung.rows?.[0]?.kq));
  await suaNhanh(UID.qlA, [{ id: b.id, phien_ban: await pb('C-NACVAI'), dang_dung: true, ma_can: null }]);
});

// ===========================================================================
await nhom('5 · SỬA HÀNG LOẠT: AI GỌI ĐƯỢC', async () => {
  const dong = async () => [{ id: MH['P-VUN'].id, phien_ban: await pb('P-VUN'), gia_ban_kg: 1 }];
  for (const [ai, uid] of [['Thủ kho', UID.thuKhoA], ['NV quầy', UID.nvQuayA], ['Kế toán', UID.keToanA],
                           ['Thu ngân', UID.thuNganA], ['Người đã nghỉ', UID.nghiViec]]) {
    const r = await suaNhanh(uid, await dong());
    ok(`${ai} KHÔNG gọi được`, r.loi !== null && /không sửa được danh mục/.test(r.loi), r.loi ?? 'GỌI ĐƯỢC');
  }
  const b = await suaNhanh(UID.qlB, await dong(), cnA.id);
  ok('Quản lý Q7 KHÔNG sửa được khi mang chi nhánh Q1', b.loi !== null);
  ok('Giá phụ phẩm không đổi', n((await mh('P-VUN')).gia_ban_kg) !== 1);
  const sai = await duoi(UID.qlA, `select kho_sua_nhanh_mat_hang($1, '{"a":1}'::jsonb)`, [cnA.id]);
  ok('Dữ liệu không phải danh sách: lỗi', sai.loi !== null);
});

// ===========================================================================
await nhom('6 · BÁO CÁO THEO THÁNG: KHỚP XNT, TỒN NỐI THÁNG, DOANH THU iPOS', async () => {
  const nams = [...new Set([namCua(await ngay(-40)), namCua(homNay)])];
  let dongThang = [];
  for (const nam of nams) {
    const r = await duoi(UID.qlA, `select * from kho_bao_cao_theo_thang($1, $2)`, [cnA.id, nam]);
    ok(`Quản lý xem báo cáo năm ${nam}`, r.loi === null && r.rows.length > 0, r.loi ?? '');
    dongThang = dongThang.concat((r.rows ?? []).map(x => ({ ...x, nam })));
  }
  const cuaNamNay = dongThang.filter(x => x.nam === namCua(homNay));
  ok('Năm nay: đúng số tháng đã bắt đầu', cuaNamNay.length === thangCua(homNay), `${cuaNamNay.length}`);

  const COT = [['nhap', 'nhap'], ['ban', 'ban'], ['xuat_bep', 'xuat_bep'], ['xuat_khac', 'xuat_khac'],
               ['tra_ncc', 'tra_ncc'], ['huy', 'huy']];
  let khop = true, chiTiet = '';
  for (const t of dongThang) {
    const x = await duoi(UID.qlA, `select * from kho_bao_cao_xnt_v2($1, $2::date, $3::date)`,
      [cnA.id, t.tu.toISOString?.().slice(0, 10) ?? t.tu, t.den.toISOString?.().slice(0, 10) ?? t.den]);
    const tong = k => (x.rows ?? []).reduce((s, r) => s + Number(r[k]), 0);
    const so = [
      ['ton_dau', tong('dau_kg'), tong('dau_gia_tri')], ['ton_cuoi', tong('cuoi_kg'), tong('cuoi_gia_tri')],
      ...COT.map(([a, b]) => [a, tong(`${b}_kg`), tong(`${b}_gia_tri`)]),
      ['hao_hut', tong('hao_hut_kg') - tong('kiem_ke_kg'), tong('hao_hut_gia_tri') - tong('kiem_ke_gia_tri')],
      ['pha_mat', tong('pha_vao_kg') - tong('pha_ra_kg'), tong('pha_vao_gia_tri') - tong('pha_ra_gia_tri')],
    ];
    for (const [k, kg, tien] of so) {
      if (Math.abs(n(t[`${k}_kg`]) - kg) > 0.0005 || Math.abs(n(t[`${k}_tien`]) - tien) > 2) {
        khop = false; chiTiet += `${t.nam}/${t.thang} ${k}: ${t[`${k}_kg`]}/${t[`${k}_tien`]} ≠ ${kg}/${tien}; `;
      }
    }
  }
  ok('Mỗi tháng khớp kho_bao_cao_xnt_v2 (kg và tiền, mọi cột)', khop, chiTiet);

  const lech = dongThang.filter(t => Math.abs(n(t.ton_dau_kg) + n(t.nhap_kg) - n(t.ban_kg) - n(t.xuat_bep_kg) - n(t.xuat_khac_kg)
    - n(t.tra_ncc_kg) - n(t.huy_kg) - n(t.hao_hut_kg) - n(t.pha_mat_kg) - n(t.ton_cuoi_kg)) > 0.0005);
  ok('Tồn cuối = tồn đầu + nhập − các loại xuất (mọi tháng)', lech.length === 0, JSON.stringify(lech));
  const noi = dongThang.slice(1).every((t, i) => n(t.ton_dau_kg) === n(dongThang[i].ton_cuoi_kg)
    && n(t.ton_dau_tien) === n(dongThang[i].ton_cuoi_tien));
  ok('Tồn đầu tháng sau = tồn cuối tháng trước (kg và tiền)', noi);

  const tNay = cuaNamNay.find(t => t.thang === thangCua(homNay));
  ok('Tháng này: nhập 6,5 kg = 2.400.000 + 50.000 chi phí + 1.125.000', n(tNay?.nhap_kg) === 6.5 && n(tNay?.nhap_tien) === 3575000,
     JSON.stringify(tNay));
  ok('Tháng này: xuất bếp 4 kg = 2.450.000', n(tNay?.xuat_bep_kg) === 4 && n(tNay?.xuat_bep_tien) === 2450000);
  ok('Chi phí thịt tháng này > 0', n(tNay?.chi_phi_thit) >= 2450000);
  ok('Chi phí thịt = bán + bếp + khác + hủy + hao hụt',
     n(tNay?.chi_phi_thit) === n(tNay.ban_tien) + n(tNay.xuat_bep_tien) + n(tNay.xuat_khac_tien) + n(tNay.huy_tien) + n(tNay.hao_hut_tien));
  ok('Doanh thu iPOS tháng này = 30.000 (bỏ dòng đã hủy)', tNay?.co_ipos === true && n(tNay?.doanh_thu) === 30000, JSON.stringify(tNay));
  ok('Chi phí / doanh thu % = chi phí thịt ÷ 30.000 × 100',
     n(tNay?.chi_phi_tren_doanh_thu_pt) === Math.round(n(tNay.chi_phi_thit) / 30000 * 1000) / 10, `${tNay?.chi_phi_tren_doanh_thu_pt}`);
  const ngayCu = await ngay(-40);
  const tCu = dongThang.find(t => t.nam === namCua(ngayCu) && t.thang === thangCua(ngayCu));
  ok('Tháng của phiếu 40 ngày trước: nhập 15 kg = 6.500.000, không có iPOS', n(tCu?.nhap_kg) === 15 && n(tCu?.nhap_tien) === 6500000
     && tCu?.co_ipos === false && tCu?.doanh_thu === null, JSON.stringify(tCu));

  const tuongLai = await duoi(UID.qlA, `select * from kho_bao_cao_theo_thang($1, $2)`, [cnA.id, namCua(homNay) + 1]);
  ok('Năm sau: 0 dòng', tuongLai.loi === null && tuongLai.rows.length === 0);
  const sai = await duoi(UID.qlA, `select * from kho_bao_cao_theo_thang($1, 1990)`, [cnA.id]);
  ok('Năm vô lý: lỗi', sai.loi !== null);
  const B = await duoi(UID.qlB, `select * from kho_bao_cao_theo_thang($1, $2)`, [cnA.id, namCua(homNay)]);
  ok('Quản lý Q7 KHÔNG xem được Q1', B.loi !== null);
  const tn = await duoi(UID.thuNganA, `select * from kho_bao_cao_theo_thang($1, $2)`, [cnA.id, namCua(homNay)]);
  ok('Thu ngân (không phải vai kho) KHÔNG xem được', tn.loi !== null);
});

// ===========================================================================
await nhom('7 · BÁO CÁO THEO THÁNG: THỦ KHO / NV QUẦY THẤY KG, TIỀN NULL', async () => {
  const COT_TIEN = ['ton_dau_tien', 'nhap_tien', 'ban_tien', 'xuat_bep_tien', 'xuat_khac_tien', 'tra_ncc_tien', 'huy_tien',
                    'hao_hut_tien', 'pha_mat_tien', 'ton_cuoi_tien', 'chi_phi_thit', 'doanh_thu', 'chi_phi_tren_doanh_thu_pt'];
  const ql = (await duoi(UID.qlA, `select * from kho_bao_cao_theo_thang($1, $2)`, [cnA.id, namCua(homNay)])).rows;
  for (const [ai, uid] of [['Thủ kho', UID.thuKhoA], ['NV quầy', UID.nvQuayA]]) {
    const r = await duoi(uid, `select * from kho_bao_cao_theo_thang($1, $2)`, [cnA.id, namCua(homNay)]);
    ok(`${ai} xem được báo cáo tháng`, r.loi === null && r.rows.length === ql.length, r.loi ?? '');
    ok(`${ai}: mọi cột tiền null`, (r.rows ?? []).every(x => COT_TIEN.every(c => x[c] === null)));
    ok(`${ai}: kg giống hệt quản lý`, (r.rows ?? []).every((x, i) =>
      ['ton_dau_kg', 'nhap_kg', 'xuat_bep_kg', 'ton_cuoi_kg'].every(c => n(x[c]) === n(ql[i][c]))));
    ok(`${ai}: vẫn biết tháng có iPOS (không tiền)`, (r.rows ?? []).some(x => x.co_ipos === true));
  }
  const kt = await duoi(UID.keToanA, `select * from kho_bao_cao_theo_thang($1, $2)`, [cnA.id, namCua(homNay)]);
  ok('Đối chứng: kế toán thấy tiền', kt.rows?.some(x => n(x.nhap_tien) > 0));
});

// ===========================================================================
await nhom('8 · MUA HÀNG THEO NCC / MẶT HÀNG', async () => {
  const tu = await ngay(-60);
  // Kế toán đối chiếu hóa đơn P3 lệch: 1.200.000 (tổng phiếu 1.125.000).
  const dc = await duoi(UID.keToanA, `select kho_doi_chieu_hoa_don($1, 'HD-P3', null, 1200000, null, null)`, [P3.id]);
  ok('Kế toán đối chiếu hóa đơn P3', dc.loi === null, dc.loi ?? '');
  const theoNcc = await duoi(UID.keToanA, `select * from kho_bao_cao_mua_hang($1, $2::date, $3::date, 'ncc')`, [cnA.id, tu, homNay]);
  ok('Kế toán xem mua hàng theo NCC: 2 dòng', theoNcc.loi === null && theoNcc.rows.length === 2, theoNcc.loi ?? '');
  const uc = theoNcc.rows?.find(x => x.id === nccUc), my = theoNcc.rows?.find(x => x.id === nccMy);
  // Úc: P1 10×500.000 + 5×300.000 = 6.500.000, thuế 100.000; P3 1.125.000, hóa đơn 1.200.000
  ok('Úc: 2 phiếu, 2 mặt hàng, 17,5 kg, 4 gói', uc?.so_phieu === 2 && uc?.so_mat_hang === 2 && n(uc?.so_kg) === 17.5 && uc?.so_goi === 4,
     JSON.stringify(uc));
  ok('Úc: tiền hàng 7.625.000, thuế 100.000, phải trả 6.600.000 + 1.200.000 (tiền hóa đơn)',
     n(uc?.tien_hang) === 7625000 && n(uc?.tien_thue) === 100000 && n(uc?.chi_phi_khac) === 0 && n(uc?.tong_tien) === 7800000,
     JSON.stringify(uc));
  ok('Úc: giá TB/kg = 7.625.000 ÷ 17,5 = 435.714', n(uc?.gia_tb_kg) === 435714);
  ok('Mỹ: 4 kg, 2.400.000, chi phí 50.000, phải trả 2.450.000',
     n(my?.so_kg) === 4 && n(my?.tien_hang) === 2400000 && n(my?.chi_phi_khac) === 50000 && n(my?.tong_tien) === 2450000, JSON.stringify(my));
  ok('Tỷ trọng: Úc 7.625.000 ÷ 10.025.000 = 76,1%, cộng 100%',
     n(uc?.ty_trong_pt) === 76.1 && Math.abs(n(uc.ty_trong_pt) + n(my.ty_trong_pt) - 100) < 0.11);
  ok('Xếp theo tiền hàng giảm dần', theoNcc.rows?.[0]?.id === nccUc);

  const theoMh = await duoi(UID.qlA, `select * from kho_bao_cao_mua_hang($1, $2::date, $3::date, 'mat_hang')`, [cnA.id, tu, homNay]);
  const than = theoMh.rows?.find(x => x.id === MH['T-THANNGOAI'].id);
  ok('Thăn ngoại: 3 phiếu, 2 NCC, 16,5 kg', than?.so_phieu === 3 && than?.so_ncc === 2 && n(than?.so_kg) === 16.5, JSON.stringify(than));
  ok('Thăn ngoại: tiền 8.525.000, TB 516.667, thấp 450.000, cao 600.000',
     n(than?.tien_hang) === 8525000 && n(than?.gia_tb_kg) === 516667 && n(than?.gia_thap_kg) === 450000 && n(than?.gia_cao_kg) === 600000,
     JSON.stringify(than));
  ok('Theo mặt hàng: thuế, chi phí, phải trả để trống', (theoMh.rows ?? []).every(x => x.tien_thue === null && x.tong_tien === null));
  const tongMh = (theoMh.rows ?? []).reduce((s, x) => s + n(x.tien_hang), 0);
  ok('Tổng tiền hàng theo mặt hàng = theo NCC', tongMh === n(uc?.tien_hang) + n(my?.tien_hang));

  const homNayThoi = await duoi(UID.qlA, `select * from kho_bao_cao_mua_hang($1, $2::date, $2::date, 'ncc')`, [cnA.id, homNay]);
  ok('Chỉ hôm nay: không có P1', homNayThoi.rows?.find(x => x.id === nccUc)?.so_phieu === 1);

  for (const [ai, uid] of [['Thủ kho', UID.thuKhoA], ['NV quầy', UID.nvQuayA]]) {
    const r = await duoi(uid, `select * from kho_bao_cao_mua_hang($1, $2::date, $3::date, 'ncc')`, [cnA.id, tu, homNay]);
    ok(`${ai} KHÔNG xem được mua hàng`, r.loi !== null);
  }
  const sai = await duoi(UID.qlA, `select * from kho_bao_cao_mua_hang($1, $2::date, $3::date, 'ngay')`, [cnA.id, tu, homNay]);
  ok('Nhóm lạ: lỗi', sai.loi !== null);
  const dai = await duoi(UID.qlA, `select * from kho_bao_cao_mua_hang($1, $2::date, $3::date, 'ncc')`, [cnA.id, await ngay(-400), homNay]);
  ok('Kỳ dài quá 1 năm: lỗi', dai.loi !== null);
  const B = await duoi(UID.qlB, `select * from kho_bao_cao_mua_hang($1, $2::date, $3::date, 'ncc')`, [cnA.id, tu, homNay]);
  ok('Quản lý Q7 KHÔNG xem được Q1', B.loi !== null);
});

// ===========================================================================
await nhom('9 · SỔ THANH TOÁN', async () => {
  const ghi = t => duoi(UID.keToanA, `
    select * from kho_ghi_thanh_toan_v2($1, $2, $3, $4, $5, $6, $7::date, $8, '{}'::text[], '[]'::jsonb)`,
    [cnA.id, maGui(), t.ncc, t.loai, t.hinhThuc ?? null, t.soTien, t.ngay ?? homNay, t.ghiChu ?? null]);
  const a = await ghi({ ncc: nccUc, loai: 'thanh_toan', hinhThuc: 'chuyen_khoan', soTien: 3000000 });
  const b = await ghi({ ncc: nccUc, loai: 'giam_tru', soTien: 100000, ghiChu: 'Chiết khấu' });
  const c = await ghi({ ncc: nccMy, loai: 'bu_tru', soTien: 200000, ghiChu: 'Vỏ thùng' });
  const d = await ghi({ ncc: nccMy, loai: 'thanh_toan', hinhThuc: 'tien_mat', soTien: 500000, ngay: await ngay(-1) });
  ok('Kế toán ghi 4 khoản', [a, b, c, d].every(x => x.loi === null), [a, b, c, d].map(x => x.loi).join(' | '));
  const huy = await duoi(UID.keToanA, `select kho_huy_thanh_toan($1, 'Ghi nhầm')`, [d.rows?.[0]?.thanh_toan_id]);
  ok('Hủy một khoản', huy.loi === null, huy.loi ?? '');

  const so = await duoi(UID.keToanA, `select * from kho_so_thanh_toan($1, $2::date, $3::date)`, [cnA.id, await ngay(-30), homNay]);
  ok('Sổ có 4 khoản (cả khoản đã hủy)', so.loi === null && so.rows.length === 4, so.loi ?? JSON.stringify(so.rows));
  const r = id => so.rows?.find(x => x.id === id);
  const ra = r(a.rows[0].thanh_toan_id), gt = r(b.rows[0].thanh_toan_id), bt = r(c.rows[0].thanh_toan_id), dh = r(d.rows[0].thanh_toan_id);
  ok('Trả tiền: tiền ra 3.000.000, giảm nợ 3.000.000, "Trả tiền · Chuyển khoản", có số phiếu nhập được chia',
     n(ra?.tien_ra) === 3000000 && n(ra?.giam_no) === 3000000 && n(ra?.tien_vao) === 0 && ra?.ten_loai === 'Trả tiền'
     && ra?.ten_hinh_thuc === 'Chuyển khoản' && ra?.phieu_nhap?.includes(P1.so) && ra?.nguoi_ghi === 'Kế toán Q1', JSON.stringify(ra));
  ok('Giảm trừ / bù trừ: không tiền ra, giảm nợ đúng số',
     n(gt?.tien_ra) === 0 && n(gt?.giam_no) === 100000 && gt?.ten_loai === 'Giảm trừ'
     && n(bt?.tien_ra) === 0 && n(bt?.giam_no) === 200000 && bt?.ten_loai === 'Bù trừ' && bt?.ghi_chu === 'Vỏ thùng');
  ok('Khoản đã hủy: còn trong sổ, tiền ra / giảm nợ = 0, có lý do hủy',
     dh?.trang_thai === 'da_huy' && n(dh?.so_tien) === 500000 && n(dh?.tien_ra) === 0 && n(dh?.giam_no) === 0 && dh?.ly_do_huy === 'Ghi nhầm',
     JSON.stringify(dh));
  ok('Xếp theo ngày: khoản hôm qua đứng đầu', so.rows?.[0]?.id === d.rows[0].thanh_toan_id);

  // Tổng giảm nợ trong kỳ khớp thay đổi còn nợ của view.
  const conNo = async () => Number((await db.query(`select coalesce(sum(con_no), 0) as c from kho_v_cong_no_ncc where chi_nhanh_id = $1`, [cnA.id])).rows[0].c);
  const truoc = await conNo();
  const e = await ghi({ ncc: nccUc, loai: 'thanh_toan', hinhThuc: 'tien_mat', soTien: 1000000 });
  // NCC hoàn tiền cần phiếu còn nợ âm (0040) — ở đây chỉ thử cách sổ đọc, nên ghi thẳng một khoản
  // không chia vào phiếu nào (không đổi còn nợ của view).
  const { rows: [h] } = await db.query(`
    insert into kho_thanh_toan (chi_nhanh_id, so_phieu, ma_gui, nha_cung_cap_id, loai, hinh_thuc, so_tien, ngay)
    values ($1, 'HT-THU', gen_random_uuid(), $2, 'hoan_tien', 'chuyen_khoan', 50000, $3::date) returning id`, [cnA.id, nccUc, homNay]);
  const hoan = { loi: null, rows: [{ thanh_toan_id: h.id }] };
  const so2 = await duoi(UID.keToanA, `select * from kho_so_thanh_toan($1, $2::date, $2::date)`, [cnA.id, homNay]);
  const ht = so2.rows?.find(x => x.id === hoan.rows?.[0]?.thanh_toan_id);
  ok('NCC hoàn tiền: tiền vào 50.000, giảm nợ −50.000', e.loi === null && hoan.loi === null && n(ht?.tien_vao) === 50000
     && n(ht?.giam_no) === -50000 && ht?.ten_loai === 'NCC hoàn tiền', (hoan.loi ?? '') + JSON.stringify(ht));
  const giamMoi = (so2.rows ?? []).filter(x => x.id === e.rows?.[0]?.thanh_toan_id)
    .reduce((s, x) => s + n(x.giam_no), 0);
  ok('Giảm nợ trong sổ = còn nợ của view giảm đúng bấy nhiêu', truoc - (await conNo()) === giamMoi, `${truoc} → ${await conNo()} / ${giamMoi}`);

  for (const [ai, uid] of [['Thủ kho', UID.thuKhoA], ['NV quầy', UID.nvQuayA], ['Quản lý Q7', UID.qlB]]) {
    const x = await duoi(uid, `select * from kho_so_thanh_toan($1, $2::date, $3::date)`, [cnA.id, await ngay(-30), homNay]);
    ok(`${ai} KHÔNG xem được sổ thanh toán`, x.loi !== null);
  }
  const ql = await duoi(UID.qlA, `select * from kho_so_thanh_toan($1, $2::date, $3::date)`, [cnA.id, await ngay(-30), homNay]);
  ok('Quản lý (có ke_toan) xem được', ql.loi === null && ql.rows.length === 6);
  const dai = await duoi(UID.keToanA, `select * from kho_so_thanh_toan($1, $2::date, $3::date)`, [cnA.id, await ngay(-400), homNay]);
  ok('Kỳ dài quá 1 năm: lỗi', dai.loi !== null);
});

// ===========================================================================
await nhom('10 · QUYỀN GỌI HÀM, ĐỐI SOÁT CUỐI', async () => {
  const { rows } = await db.query(`
    select p.proname, has_function_privilege('authenticated', p.oid, 'execute') as au,
           has_function_privilege('anon', p.oid, 'execute') as an, p.prosecdef
    from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname = 'public' and p.proname in
      ('kho_sua_nhanh_mat_hang', 'kho_bao_cao_theo_thang', 'kho_bao_cao_mua_hang', 'kho_so_thanh_toan')`);
  ok('Bốn hàm mới có mặt, SECURITY DEFINER', rows.length === 4 && rows.every(r => r.prosecdef));
  ok('authenticated gọi được, anon không', rows.every(r => r.au && !r.an));
  await doiSoat('Cuối cùng');
});

process.exit(ketThuc('SỬA HÀNG LOẠT · BÁO CÁO (0041)'));
