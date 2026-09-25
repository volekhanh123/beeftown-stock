/**
 * BEEFTOWN KHO — Kiểm thử chuyển quầy, xuất bếp, hủy hàng, kiểm kê
 * ================================================================
 *
 *     node test/test-kho-xuat-kiem-ke.mjs
 *
 * Những điều phải đúng tuyệt đối:
 *   · lấy hàng theo FEFO, theo gói nguyên; lô trao gói cuối trao hết kg;
 *   · hàng hết hạn không lên quầy, không vào bếp — chỉ có đường báo hủy;
 *   · báo hủy: hàng rời quầy ngay (sang "chờ hủy"), quản lý duyệt mới mất,
 *     từ chối thì về lại chỗ cũ;
 *   · kiểm kê quầy dựng lại tồn: giữ lô mới nhất, 0 gói là 0 kg, phần thiếu
 *     ghi là BÁN khi chưa nối iPOS; hàng vào sau khi gửi đếm không bị xóa;
 *   · duyệt kiểm kê bị chặn khi vị trí còn chứng từ treo.
 * Cuối mỗi nhóm: kho_doi_soat_ton() phải rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ CHUYỂN, XUẤT, HỦY, KIỂM KÊ');
const { db, cnA, cnB, duoi } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngaySau = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;

async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

const MH = {};
let viTri = {};
let ncc;
const lyDo = {};

// Phiếu có đơn giá → vai xem giá lưu; thủ kho không gửi được giá (0031).
async function taoPhieuNhap(dong, vt, uid = UID.qlA) {
  const luu = await duoi(uid, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cnA.id, maGui(), ncc, vt, homNay, JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  const gui = await duoi(uid, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
  if (gui.loi) throw new Error(gui.loi);
  return p.phieu_id;
}

/** Nhập hàng qua đúng luồng (quản lý lập có giá rồi duyệt). Trả các lô theo thứ tự dòng. */
async function nhapHang(dong, vt) {
  const id = await taoPhieuNhap(dong, vt);
  const duyet = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [id]);
  if (duyet.loi) throw new Error(duyet.loi);
  const { rows } = await db.query(`
    select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1 order by d.thu_tu`, [id]);
  return rows;
}

async function xuat(uid, t) {
  return duoi(uid, `
    select * from kho_tao_phieu_xuat(
      p_chi_nhanh_id => $1, p_ma_gui => $2, p_loai => $3, p_vi_tri_id => $4, p_vi_tri_den_id => $5,
      p_ly_do_id => $6, p_ghi_chu => $7, p_anh => $8::text[], p_dong => $9::jsonb)`,
    [t.cn ?? cnA.id, t.maGui ?? maGui(), t.loai, t.tu, t.den ?? null, t.lyDo ?? null,
     t.ghiChu ?? null, t.anh ?? [], JSON.stringify(t.dong ?? [])]);
}

const ton = async (loId, vt) => {
  const r = (await db.query(`select so_kg, so_goi from kho_ton where lo_id = $1 and vi_tri_id = $2`, [loId, vt])).rows[0];
  return r ? { kg: Number(r.so_kg), goi: r.so_goi } : { kg: 0, goi: 0 };
};
const soCai = async chungTu => (await db.query(`
  select s.loai, s.lo_id, s.vi_tri_id, s.so_kg::numeric as kg, s.so_goi as goi
  from kho_so_cai s where s.chung_tu_id = $1 order by s.created_at, s.id`, [chungTu])).rows
  .map(r => ({ ...r, kg: Number(r.kg) }));

const anhHuy = (ten = '1.jpg') => `${cnA.id}/huy/${maGui()}/${ten}`;

// Kiểm kê
const batDau = (uid, vt, kieu = 'theo_mat_hang', gui = maGui()) =>
  duoi(uid, `select kho_bat_dau_kiem_ke($1, $2, $3, $4) as id`, [cnA.id, vt, kieu, gui]);
const kk = async id => (await db.query(`select * from kho_kiem_ke where id = $1`, [id])).rows[0];
const dongKK = async id => (await db.query(`
  select d.*, m.ma from kho_kiem_ke_dong d join kho_mat_hang m on m.id = d.mat_hang_id
  where d.kiem_ke_id = $1 order by d.thu_tu`, [id])).rows;
/** Lưu số đếm: dem = { MA: {goi, kg, het} } hoặc theo lô { lo_id: {...} }. */
async function luuDem(uid, id, dem, { theoLo = false } = {}) {
  const k = await kk(id);
  const dong = (await dongKK(id)).map(d => {
    const x = dem[theoLo ? d.lo_id : d.ma] ?? {};
    return {
      mat_hang_id: d.mat_hang_id, ...(theoLo ? { lo_id: d.lo_id } : {}),
      so_goi_dem: x.goi ?? d.so_goi_dem, so_kg_dem: x.kg ?? (d.so_kg_dem === null ? null : Number(d.so_kg_dem)),
      xac_nhan_het: x.het ?? d.xac_nhan_het,
    };
  });
  for (const [ma, x] of Object.entries(dem)) {
    if (!theoLo && !dong.some(d => d.mat_hang_id === MH[ma]?.id)) {
      dong.push({ mat_hang_id: MH[ma].id, so_goi_dem: x.goi ?? null, so_kg_dem: x.kg ?? null, xac_nhan_het: x.het ?? false });
    }
  }
  return duoi(uid, `select kho_luu_kiem_ke($1, $2, null, $3::jsonb) as pb`, [id, k.phien_ban, JSON.stringify(dong)]);
}
const guiKK = async (uid, id) => duoi(uid, `select kho_gui_kiem_ke($1, $2) as cau`, [id, (await kk(id)).phien_ban]);
const duyetKK = (uid, id) => duoi(uid, `select kho_duyet_kiem_ke($1) as cau`, [id]);

let X0, X1, X2, V1, N1, N2, G1, G2;

// ===========================================================================
await nhom('1 · CHUẨN BỊ', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  viTri = Object.fromEntries((await db.query(
    `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  for (const r of (await db.query(`select * from kho_ly_do`)).rows) lyDo[`${r.loai}:${r.ten}`] = r.id;
  ncc = (await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC A') returning id`)).rows[0].id;

  [X0, X1, X2] = await nhapHang([
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 2, so_kg: 1, don_gia_kg: 700000, han_dung: await ngaySau(-1) },
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 4, so_kg: 2, don_gia_kg: 700000, han_dung: await ngaySau(1) },
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 6, so_kg: 3.3, don_gia_kg: 700000, han_dung: await ngaySau(3) },
  ], viTri.kho);
  [V1] = await nhapHang([{ mat_hang_id: MH['P-VUN'].id, so_kg: 2.5, don_gia_kg: 80000, han_dung: await ngaySau(2) }], viTri.kho);
  [N1, N2, G1, G2] = await nhapHang([
    { mat_hang_id: MH['C-NACVAI'].id, so_goi: 5, so_kg: 2.5, don_gia_kg: 400000, han_dung: await ngaySau(1) },
    { mat_hang_id: MH['C-NACVAI'].id, so_goi: 4, so_kg: 2.4, don_gia_kg: 400000, han_dung: await ngaySau(2) },
    { mat_hang_id: MH['P-GAN'].id, so_kg: 1, don_gia_kg: 50000, han_dung: await ngaySau(1) },
    { mat_hang_id: MH['P-GAN'].id, so_kg: 0.8, don_gia_kg: 50000, han_dung: await ngaySau(2) },
  ], viTri.quay);
  ok('Có đủ lô: 3 lô thăn (1 lô đã hết hạn), thịt vụn, nạc vai và gân ở quầy', X0 && X1 && X2 && V1 && N1 && N2 && G1 && G2);
  await doiSoat('Sau khi nhập');
});

// ===========================================================================
await nhom('2 · CHUYỂN KHO → QUẦY: FEFO, GÓI NGUYÊN, BỎ QUA HÀNG HẾT HẠN', async () => {
  const kt = await xuat(UID.keToanA, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
                                        dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }] });
  ok('Kế toán KHÔNG chuyển hàng được', kt.loi !== null);
  const tkB = await xuat(UID.thuKhoB, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
                                         dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }] });
  ok('Thủ kho chi nhánh khác KHÔNG chuyển được hàng Q1', tkB.loi !== null);

  const gui = maGui();
  const t = { loai: 'chuyen', tu: viTri.kho, den: viTri.quay, maGui: gui,
              dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 5 }] };
  const c = await xuat(UID.nvQuayA, t);
  ok('NV quầy chuyển được 5 gói ra quầy', c.loi === null && c.rows[0].da_co === false, c.loi ?? '');
  const pid = c.rows?.[0]?.phieu_id;
  ok('Số phiếu dạng XC-YYMM-0001', /^XC-\d{4}-0001$/.test(c.rows?.[0]?.so_phieu), c.rows?.[0]?.so_phieu);

  const lai = await xuat(UID.nvQuayA, t);
  ok('Bấm lại cùng ma_gui → cùng phiếu, không ghi thêm', lai.rows?.[0]?.phieu_id === pid && lai.rows[0].da_co);

  ok('Lô hết hạn KHÔNG bị đưa ra quầy', (await ton(X0.id, viTri.kho)).goi === 2 && (await ton(X0.id, viTri.quay)).goi === 0);
  const q1 = await ton(X1.id, viTri.quay), q2 = await ton(X2.id, viTri.quay);
  ok('FEFO: lô gần hết hạn đi trước — lô X1 trao hết 4 gói và đủ 2 kg', q1.goi === 4 && q1.kg === 2, JSON.stringify(q1));
  ok('Lô X2 trao 1 gói = 3,3 ÷ 6 = 0,55 kg', q2.goi === 1 && q2.kg === 0.55, JSON.stringify(q2));
  ok('Lô X1 ở kho về đúng 0 gói, 0 kg', JSON.stringify(await ton(X1.id, viTri.kho)) === JSON.stringify({ kg: 0, goi: 0 }));

  const sc = await soCai(pid);
  ok('Sổ: mỗi lô một dòng chuyển đi và một dòng chuyển đến',
     sc.length === 4 && sc.filter(r => r.loai === 'chuyen_di').length === 2 && sc.filter(r => r.loai === 'chuyen_den').length === 2);
  const { rows: [d] } = await db.query(`select * from kho_phieu_xuat_dong where phieu_xuat_id = $1`, [pid]);
  ok('Dòng phiếu ghi 5 gói, 2,55 kg', d.so_goi === 5 && Number(d.so_kg) === 2.55);
  const { rows: [p] } = await db.query(`select * from kho_phieu_xuat where id = $1`, [pid]);
  ok('Phiếu chuyển ghi sổ ngay (da_ghi)', p.trang_thai === 'da_ghi');

  const hetHan = await xuat(UID.nvQuayA, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
                                           dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, lo_id: X0.id, so_goi: 1 }] });
  ok('Chọn đích danh lô hết hạn để đưa ra quầy bị từ chối',
     hetHan.loi !== null && /đã hết hạn — không đưa ra quầy/.test(hetHan.loi), hetHan.loi ?? '');

  const qua = await xuat(UID.nvQuayA, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
                                        dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 6 }] });
  ok('Chuyển quá số gói còn hạn bị từ chối, nói rõ còn bao nhiêu',
     qua.loi !== null && /chỉ còn 5 gói còn hạn/.test(qua.loi), qua.loi ?? '');
  const { rows: [{ n }] } = await db.query(`select count(*)::int as n from kho_phieu_xuat`);
  ok('Phiếu hỏng không để lại gì', n === 1);

  const veKho = await xuat(UID.thuKhoA, { loai: 'chuyen', tu: viTri.kho, den: viTri.kho,
                                          dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }] });
  ok('Nơi lấy trùng nơi nhận bị từ chối', veKho.loi !== null && /phải khác nhau/.test(veKho.loi));
  const choHuy = await xuat(UID.thuKhoA, { loai: 'chuyen', tu: viTri.kho, den: viTri.cho_huy,
                                           dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }] });
  ok('Không chuyển thẳng vào "chờ hủy" được (phải báo hủy)', choHuy.loi !== null);
  const tuChoHuy = await xuat(UID.thuKhoA, { loai: 'chuyen', tu: viTri.cho_huy, den: viTri.kho,
                                             dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }] });
  ok('Không lấy hàng ra khỏi "chờ hủy" bằng phiếu chuyển được', tuChoHuy.loi !== null);

  const khongGoi = await xuat(UID.thuKhoA, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
                                             dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 0.5 }] });
  ok('Mặt hàng đếm gói mà không ghi số gói bị từ chối', khongGoi.loi !== null && /chưa nhập số gói/.test(khongGoi.loi));

  const can = await xuat(UID.thuKhoA, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
                                        dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1, so_kg: 0.61 }] });
  ok('Có kg quét từ nhãn thì vẫn chuyển được', can.loi === null, can.loi ?? '');
  const { rows: [dc] } = await db.query(`select * from kho_phieu_xuat_dong where phieu_xuat_id = $1`, [can.rows[0].phieu_id]);
  ok('Kg quét được ghi để tham khảo; sổ dùng kg trung bình của lô (0,55)',
     Number(dc.so_kg_do) === 0.61 && Number(dc.so_kg) === 0.55, `${dc.so_kg_do} / ${dc.so_kg}`);

  const vun = await xuat(UID.thuKhoA, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
                                        dong: [{ mat_hang_id: MH['P-VUN'].id, so_kg: 1.2 }] });
  ok('Hàng theo kg (thịt vụn): chuyển 1,2 kg', vun.loi === null && (await ton(V1.id, viTri.quay)).kg === 1.2, vun.loi ?? '');
  const vunThieu = await xuat(UID.thuKhoA, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
                                             dong: [{ mat_hang_id: MH['P-VUN'].id }] });
  ok('Hàng theo kg mà không ghi kg bị từ chối', vunThieu.loi !== null && /chưa nhập số kg/.test(vunThieu.loi));

  const truc = await duoi(UID.thuKhoA, `
    insert into kho_phieu_xuat (chi_nhanh_id, so_phieu, ma_gui, loai, vi_tri_id, trang_thai)
    values ($1, 'X', $2, 'xuat_bep', $3, 'da_ghi')`, [cnA.id, maGui(), viTri.kho]);
  ok('Không ghi thẳng vào bảng phiếu xuất được', truc.loi !== null);
  await doiSoat('Sau khi chuyển');
});

// ===========================================================================
await nhom('3 · XUẤT BẾP', async () => {
  const sai = await xuat(UID.nvQuayA, { loai: 'xuat_bep', tu: viTri.quay, lyDo: lyDo['huy:Hết hạn dùng'],
                                        dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 2 }] });
  ok('Lý do của loại khác (hủy) bị từ chối', sai.loi !== null && /Lý do không hợp lệ/.test(sai.loi));

  const x = await xuat(UID.nvQuayA, { loai: 'xuat_bep', tu: viTri.quay, lyDo: lyDo['xuat_bep:Gần hết hạn'],
                                      dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 2 }] });
  ok('NV quầy xuất bếp 2 gói gần hết hạn', x.loi === null && /^XB-/.test(x.rows?.[0]?.so_phieu), x.loi ?? '');
  const sc = await soCai(x.rows[0].phieu_id);
  ok('Sổ: một dòng xuất bếp từ lô X1 (hạn gần nhất), −2 gói, −1 kg',
     sc.length === 1 && sc[0].loai === 'xuat_bep' && sc[0].lo_id === X1.id && sc[0].goi === -2 && sc[0].kg === -1,
     JSON.stringify(sc));

  const hetHan = await xuat(UID.thuKhoA, { loai: 'xuat_bep', tu: viTri.kho,
                                           dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, lo_id: X0.id, so_goi: 1 }] });
  ok('Hàng hết hạn KHÔNG xuất bếp được — phải báo hủy',
     hetHan.loi !== null && /đã hết hạn — không xuất bếp/.test(hetHan.loi), hetHan.loi ?? '');

  const coAnh = await xuat(UID.thuKhoA, { loai: 'xuat_bep', tu: viTri.quay, anh: [anhHuy()],
                                          dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }] });
  ok('Phiếu xuất bếp không kèm ảnh', coAnh.loi !== null && /Chỉ phiếu báo hủy/.test(coAnh.loi));
  await doiSoat('Sau khi xuất bếp');
});

// ===========================================================================
let huy1;
await nhom('4 · BÁO HỦY — HAI BƯỚC QUA "HÀNG CHỜ HỦY"', async () => {
  const base = { loai: 'huy', tu: viTri.kho, dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, lo_id: X0.id, so_goi: 2 }] };

  const khongLyDo = await xuat(UID.nvQuayA, base);
  ok('Báo hủy phải chọn lý do', khongLyDo.loi !== null && /phải chọn lý do/.test(khongLyDo.loi));
  const khongAnh = await xuat(UID.nvQuayA, { ...base, lyDo: lyDo['huy:Hết hạn dùng'] });
  ok('Lý do cần ảnh mà không có ảnh bị từ chối', khongAnh.loi !== null && /cần ít nhất một ảnh/.test(khongAnh.loi));
  const anhLa = await xuat(UID.nvQuayA, { ...base, lyDo: lyDo['huy:Hết hạn dùng'], anh: [`${cnB.id}/huy/${maGui()}/1.jpg`] });
  ok('Ảnh của chi nhánh khác bị từ chối', anhLa.loi !== null && /không thuộc chi nhánh/.test(anhLa.loi));
  const anhNhap = await xuat(UID.nvQuayA, { ...base, lyDo: lyDo['huy:Hết hạn dùng'], anh: [`${cnA.id}/nhap/${maGui()}/1.jpg`] });
  ok('Ảnh nằm ngoài thư mục "huy" bị từ chối', anhNhap.loi !== null);

  const h = await xuat(UID.nvQuayA, { ...base, lyDo: lyDo['huy:Hết hạn dùng'], anh: [anhHuy()] });
  ok('NV quầy báo hủy lô hết hạn kèm ảnh', h.loi === null && /^XH-/.test(h.rows?.[0]?.so_phieu), h.loi ?? '');
  huy1 = h.rows?.[0]?.phieu_id;
  const { rows: [p] } = await db.query(`select * from kho_phieu_xuat where id = $1`, [huy1]);
  ok('Phiếu hủy chờ quản lý duyệt', p.trang_thai === 'cho_duyet');
  ok('Hàng rời kho ngay, nằm ở "Hàng chờ hủy"',
     (await ton(X0.id, viTri.kho)).goi === 0 && (await ton(X0.id, viTri.cho_huy)).goi === 2);
  const { rows: [{ n: coHuy }] } = await db.query(`select count(*)::int as n from kho_so_cai where loai = 'huy'`);
  ok('Chưa có dòng hủy nào trong sổ', coHuy === 0);

  const nv = await duoi(UID.nvQuayA, `select kho_duyet_phieu_huy($1)`, [huy1]);
  ok('NV quầy KHÔNG duyệt hủy được', nv.loi !== null);
  const tk = await duoi(UID.thuKhoA, `select kho_duyet_phieu_huy($1)`, [huy1]);
  ok('Thủ kho KHÔNG duyệt hủy được', tk.loi !== null);
  const ql = await duoi(UID.qlA, `select kho_duyet_phieu_huy($1) as cau`, [huy1]);
  ok('Quản lý duyệt hủy', ql.loi === null && /Đã duyệt hủy .*: 1,000 kg/.test(ql.rows?.[0]?.cau), ql.loi ?? ql.rows?.[0]?.cau);
  ok('Hàng chờ hủy về 0', (await ton(X0.id, viTri.cho_huy)).goi === 0 && (await ton(X0.id, viTri.cho_huy)).kg === 0);
  // Các dòng ghi trong cùng một lệnh có thể trùng created_at — không so thứ tự.
  const sc = await soCai(huy1);
  const dongHuy = sc.find(r => r.loai === 'huy');
  ok('Sổ: chuyển đi, chuyển đến chờ hủy, rồi hủy −2 gói −1 kg',
     sc.map(r => r.loai).sort().join() === 'chuyen_den,chuyen_di,huy'
       && dongHuy.vi_tri_id === viTri.cho_huy && dongHuy.kg === -1 && dongHuy.goi === -2, JSON.stringify(sc));
  const lai = await duoi(UID.qlA, `select kho_duyet_phieu_huy($1) as cau`, [huy1]);
  ok('Duyệt lần hai chỉ báo "đã duyệt"', lai.loi === null && /trước đó/.test(lai.rows?.[0]?.cau));

  // Từ chối: hàng về lại chỗ cũ.
  const truoc = await ton(X2.id, viTri.quay);
  const h2 = await xuat(UID.nvQuayA, { loai: 'huy', tu: viTri.quay, lyDo: lyDo['huy:Bao bì hỏng, hở khí'], anh: [anhHuy()],
                                       dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, lo_id: X2.id, so_goi: 1 }] });
  ok('Báo hủy 1 gói bao bì hỏng ở quầy', h2.loi === null, h2.loi ?? '');
  const tcRong = await duoi(UID.qlA, `select kho_tu_choi_phieu_huy($1, '')`, [h2.rows[0].phieu_id]);
  ok('Từ chối phải ghi lý do', tcRong.loi !== null && /lý do/.test(tcRong.loi));
  const tc = await duoi(UID.qlA, `select kho_tu_choi_phieu_huy($1, 'Bao bì còn tốt, dán lại') as cau`, [h2.rows[0].phieu_id]);
  ok('Quản lý từ chối', tc.loi === null && /về lại chỗ cũ/.test(tc.rows?.[0]?.cau), tc.loi ?? '');
  const sau = await ton(X2.id, viTri.quay);
  ok('Hàng về lại quầy đúng như trước', sau.goi === truoc.goi && sau.kg === truoc.kg, `${JSON.stringify(truoc)} → ${JSON.stringify(sau)}`);
  const duyetSau = await duoi(UID.qlA, `select kho_duyet_phieu_huy($1)`, [h2.rows[0].phieu_id]);
  ok('Phiếu đã từ chối không duyệt được nữa', duyetSau.loi !== null && /từ chối/.test(duyetSau.loi));

  // Không cho tự duyệt.
  await duoi(UID.chu, `select kho_luu_cai_dat_goc($1, 'gia_tri', true, false, 'kiem_ke', false)`, [cnA.id]);
  const h3 = await xuat(UID.qlA, { loai: 'huy', tu: viTri.quay, lyDo: lyDo['huy:Rơi, dập, nhiễm bẩn'], anh: [anhHuy()],
                                   dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }] });
  const tu = await duoi(UID.qlA, `select kho_duyet_phieu_huy($1)`, [h3.rows[0].phieu_id]);
  ok('Tắt "cho tự duyệt": quản lý không duyệt được phiếu mình lập', tu.loi !== null && /tự duyệt/.test(tu.loi));
  const chu = await duoi(UID.chu, `select kho_duyet_phieu_huy($1)`, [h3.rows[0].phieu_id]);
  ok('Chủ duyệt được', chu.loi === null, chu.loi ?? '');
  await duoi(UID.chu, `select kho_luu_cai_dat_goc($1, 'gia_tri', true, false, 'kiem_ke', true)`, [cnA.id]);
  await doiSoat('Sau khi hủy');
});

// ===========================================================================
let kk1;
await nhom('5 · KIỂM KÊ QUẦY THEO MẶT HÀNG — DỰNG LẠI TỒN, GHI BÁN', async () => {
  const kt = await batDau(UID.keToanA, viTri.quay);
  ok('Kế toán KHÔNG kiểm kê được', kt.loi !== null);
  const choHuy = await batDau(UID.nvQuayA, viTri.cho_huy);
  ok('Không kiểm kê vị trí "chờ hủy"', choHuy.loi !== null);

  const b = await batDau(UID.nvQuayA, viTri.quay);
  ok('NV quầy bắt đầu kiểm kê quầy', b.loi === null, b.loi ?? '');
  kk1 = b.rows?.[0]?.id;
  const k = await kk(kk1);
  ok('Số phiếu KK-YYMM-0001, chép nguồn số bán = kiểm kê', /^KK-\d{4}-0001$/.test(k.so_phieu) && k.nguon_so_ban === 'kiem_ke');
  const ds = await dongKK(kk1);
  ok('Điền sẵn mọi mặt hàng đang có ở quầy (thăn, nạc vai, gân, vụn)',
     ['C-THANNGOAI', 'C-NACVAI', 'P-GAN', 'P-VUN'].every(m => ds.some(d => d.ma === m)) && ds.length === 4,
     ds.map(d => d.ma).join());
  const hai = await batDau(UID.thuKhoA, viTri.quay);
  ok('Không mở phiếu thứ hai cho cùng vị trí', hai.loi !== null && /đang có phiếu kiểm kê/.test(hai.loi));

  const thanQuay = (await db.query(`select coalesce(sum(so_goi),0)::int as g from kho_ton where vi_tri_id = $1 and mat_hang_id = $2`,
                                   [viTri.quay, MH['C-THANNGOAI'].id])).rows[0].g;

  await luuDem(UID.nvQuayA, kk1, { 'C-NACVAI': { goi: 3 }, 'P-GAN': { kg: 1.5 } });
  const chuaDem = await guiKK(UID.nvQuayA, kk1);
  ok('Gửi khi còn mặt hàng chưa đếm bị chặn, nêu tên', chuaDem.loi !== null && /Chưa đếm: Thăn ngoại cắt lát/.test(chuaDem.loi), chuaDem.loi ?? '');

  await luuDem(UID.nvQuayA, kk1, { 'C-THANNGOAI': { goi: thanQuay }, 'P-VUN': { kg: 0 } });
  const chuaXacNhan = await guiKK(UID.nvQuayA, kk1);
  ok('Đếm 0 mà sổ còn hàng: phải xác nhận "đã hết thật"',
     chuaXacNhan.loi !== null && /Thịt vụn/.test(chuaXacNhan.loi) && /Đã hết thật/.test(chuaXacNhan.loi), chuaXacNhan.loi ?? '');

  const sai = await luuDem(UID.nvQuayA, kk1, { 'C-NACVAI': { goi: 0, kg: 1 } });
  ok('0 gói mà có kg bị từ chối', sai.loi !== null && /đếm 0 gói mà có/.test(sai.loi), sai.loi ?? '');

  await luuDem(UID.nvQuayA, kk1, { 'C-NACVAI': { goi: 3, kg: null }, 'P-VUN': { kg: 0, het: true } });
  const g = await guiKK(UID.nvQuayA, kk1);
  ok('Gửi được: 3 dòng lệch sổ (nạc vai, gân, vụn)', g.loi === null && /3 dòng lệch sổ/.test(g.rows?.[0]?.cau), g.loi ?? g.rows?.[0]?.cau);

  const sua = await luuDem(UID.nvQuayA, kk1, { 'C-NACVAI': { goi: 4 } });
  ok('Phiếu đã gửi không sửa được', sua.loi !== null && /không còn ở bước đếm/.test(sua.loi));
  const nv = await duyetKK(UID.nvQuayA, kk1);
  ok('NV quầy KHÔNG duyệt kiểm kê được', nv.loi !== null);

  // Chứng từ treo chặn duyệt.
  const pn = await taoPhieuNhap([{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 2, so_kg: 1, don_gia_kg: 400000 }], viTri.quay);
  const bi = await duyetKK(UID.qlA, kk1);
  ok('Còn phiếu nhập chờ duyệt vào quầy → không duyệt kiểm kê được',
     bi.loi !== null && /Còn phiếu nhập chờ duyệt/.test(bi.loi), bi.loi ?? '');
  await duoi(UID.qlA, `select kho_tu_choi_phieu_nhap($1, 'Nhập nhầm quầy')`, [pn]);

  const d = await duyetKK(UID.qlA, kk1);
  ok('Quản lý duyệt: ghi bán 6 gói', d.loi === null && /ghi bán 6 gói \(4,600 kg\)/.test(d.rows?.[0]?.cau), d.loi ?? d.rows?.[0]?.cau);

  const n1 = await ton(N1.id, viTri.quay), n2 = await ton(N2.id, viTri.quay);
  ok('Nạc vai: lô mới nhất (N2) giữ 3 gói = 2,4 × 3/4 = 1,8 kg', n2.goi === 3 && n2.kg === 1.8, JSON.stringify(n2));
  ok('Nạc vai: lô cũ (N1) bán hết — 0 gói, 0 kg', n1.goi === 0 && n1.kg === 0, JSON.stringify(n1));
  const g1 = await ton(G1.id, viTri.quay), g2 = await ton(G2.id, viTri.quay);
  ok('Gân (theo kg): lô mới giữ 0,8 kg, lô cũ còn 0,7 kg', g2.kg === 0.8 && g1.kg === 0.7, `${g1.kg} / ${g2.kg}`);
  ok('Thịt vụn ở quầy về 0', (await ton(V1.id, viTri.quay)).kg === 0);

  const { rows: loai } = await db.query(`select distinct loai from kho_so_cai where chung_tu_id = $1`, [kk1]);
  ok('Phần thiếu ở quầy ghi là BÁN (chưa nối iPOS)', loai.length === 1 && loai[0].loai === 'ban', JSON.stringify(loai));
  const lai = await duyetKK(UID.qlA, kk1);
  ok('Duyệt lần hai chỉ báo "đã duyệt"', lai.loi === null && /trước đó/.test(lai.rows?.[0]?.cau));
  await doiSoat('Sau kiểm kê quầy');
});

// ===========================================================================
await nhom('6 · KIỂM KÊ: THỪA HÀNG, TỪ CHỐI, HÀNG VÀO SAU KHI GỬI, NGUỒN iPOS', async () => {
  // Thừa gói, có quét kg: 5 gói nạc vai, 3,1 kg.
  const b = (await batDau(UID.nvQuayA, viTri.quay)).rows[0].id;
  const thanQuay = (await db.query(`select coalesce(sum(so_goi),0)::int as g from kho_ton where vi_tri_id = $1 and mat_hang_id = $2`,
                                   [viTri.quay, MH['C-THANNGOAI'].id])).rows[0].g;
  await luuDem(UID.nvQuayA, b, { 'C-NACVAI': { goi: 5, kg: 3.1 }, 'P-GAN': { kg: 1.5 }, 'C-THANNGOAI': { goi: thanQuay - 1 } });
  await guiKK(UID.nvQuayA, b);

  const tcRong = await duoi(UID.qlA, `select kho_tu_choi_kiem_ke($1, ' ')`, [b]);
  ok('Từ chối kiểm kê phải có lý do', tcRong.loi !== null);
  const tc = await duoi(UID.qlA, `select kho_tu_choi_kiem_ke($1, 'Đếm lại nạc vai') as cau`, [b]);
  ok('Quản lý trả phiếu về để đếm lại', tc.loi === null && (await kk(b)).trang_thai === 'dang_dem');
  const { rows: [{ n: chup }] } = await db.query(`
    select count(*)::int as n from kho_kiem_ke_lo kl join kho_kiem_ke_dong d on d.id = kl.kiem_ke_dong_id
    where d.kiem_ke_id = $1`, [b]);
  ok('Ảnh chụp sổ sách cũ bị xóa khi trả về', chup === 0);

  await guiKK(UID.nvQuayA, b);
  // Sau khi gửi: chuyển thêm 2 gói thăn ra quầy.
  const them = await xuat(UID.thuKhoA, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
                                         dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 2 }] });
  ok('Chuyển thêm 2 gói thăn ra quầy sau khi gửi kiểm kê', them.loi === null, them.loi ?? '');
  const d = await duyetKK(UID.qlA, b);
  ok('Duyệt được', d.loi === null, d.loi ?? '');
  const n2 = await ton(N2.id, viTri.quay);
  ok('Thừa 2 gói cộng vào lô mới nhất: N2 = 5 gói, đúng 3,1 kg quét được', n2.goi === 5 && n2.kg === 3.1, JSON.stringify(n2));
  const { rows: [{ g: thanSau }] } = await db.query(
    `select coalesce(sum(so_goi),0)::int as g from kho_ton where vi_tri_id = $1 and mat_hang_id = $2`,
    [viTri.quay, MH['C-THANNGOAI'].id]);
  ok('Hàng chuyển vào sau khi gửi KHÔNG bị xóa: thăn = đếm (−1) + 2 gói mới', thanSau === thanQuay - 1 + 2, `${thanQuay} → ${thanSau}`);
  const { rows: loai } = await db.query(
    `select loai, sum(so_goi)::int as g from kho_so_cai where chung_tu_id = $1 group by loai order by loai`, [b]);
  ok('Thừa ghi "kiem_ke" (+), thiếu ghi "ban" (−)',
     loai.some(r => r.loai === 'kiem_ke' && r.g === 2) && loai.some(r => r.loai === 'ban' && r.g === -1), JSON.stringify(loai));
  await doiSoat('Sau thừa hàng');

  // Hàng tìm thấy ở nơi chưa có lô: tủ mát mới.
  const tu = (await duoi(UID.qlA, `insert into kho_vi_tri (chi_nhanh_id, ten, loai) values ($1, 'Tủ mát 2', 'kho') returning id`, [cnA.id])).rows[0].id;
  const t = (await duoi(UID.thuKhoA, `select kho_bat_dau_kiem_ke($1, $2, 'theo_mat_hang', $3) as id`, [cnA.id, tu, maGui()])).rows[0].id;
  ok('Tủ trống: phiếu không có dòng nào', (await dongKK(t)).length === 0);
  await luuDem(UID.thuKhoA, t, { 'C-THANNGOAI': { goi: 1 }, 'C-THANLUNG': { goi: 1 } });
  await guiKK(UID.thuKhoA, t);
  const khongLo = await duyetKK(UID.qlA, t);
  ok('Đếm thấy mặt hàng chưa từng nhập → không có lô để ghi, báo rõ',
     khongLo.loi !== null && /Không có lô nào của "Thăn lưng cắt lát"/.test(khongLo.loi), khongLo.loi ?? '');
  await duoi(UID.qlA, `select kho_tu_choi_kiem_ke($1, 'Bỏ dòng thăn lưng')`, [t]);
  await luuDem(UID.thuKhoA, t, {});
  const k = await kk(t);
  const dong = (await dongKK(t)).filter(x => x.ma !== 'C-THANLUNG')
    .map(x => ({ mat_hang_id: x.mat_hang_id, so_goi_dem: x.so_goi_dem }));
  await duoi(UID.thuKhoA, `select kho_luu_kiem_ke($1, $2, null, $3::jsonb)`, [t, k.phien_ban, JSON.stringify(dong)]);
  await guiKK(UID.thuKhoA, t);
  const dt = await duyetKK(UID.qlA, t);
  ok('Thăn tìm thấy ở tủ mát: ghi vào lô thăn mới nhất (X2)', dt.loi === null, dt.loi ?? '');
  const x2 = await ton(X2.id, tu);
  ok('Tủ mát có 1 gói X2, kg ước theo phiếu nhập (3,3 ÷ 6 = 0,55)', x2.goi === 1 && x2.kg === 0.55, JSON.stringify(x2));
  await doiSoat('Sau hàng tìm thấy');

  // Nguồn số bán = iPOS: thiếu ở quầy KHÔNG ghi là bán.
  await duoi(UID.chu, `select kho_luu_cai_dat_goc($1, 'gia_tri', true, false, 'ipos', true)`, [cnA.id]);
  const ip = (await batDau(UID.nvQuayA, viTri.quay)).rows[0].id;
  ok('Phiếu mới chép nguồn số bán = iPOS', (await kk(ip)).nguon_so_ban === 'ipos');
  const thanNay = (await db.query(`select coalesce(sum(so_goi),0)::int as g from kho_ton where vi_tri_id = $1 and mat_hang_id = $2`,
                                  [viTri.quay, MH['C-THANNGOAI'].id])).rows[0].g;
  const nacNay = (await ton(N2.id, viTri.quay)).goi;
  await luuDem(UID.nvQuayA, ip, { 'C-NACVAI': { goi: nacNay - 1 }, 'P-GAN': { kg: 1.5 }, 'C-THANNGOAI': { goi: thanNay } });
  await guiKK(UID.nvQuayA, ip);
  await duyetKK(UID.qlA, ip);
  const { rows: loaiIp } = await db.query(`select distinct loai from kho_so_cai where chung_tu_id = $1`, [ip]);
  ok('Nguồn iPOS: thiếu ghi "chênh lệch kiểm kê", không phải bán', loaiIp.length === 1 && loaiIp[0].loai === 'kiem_ke', JSON.stringify(loaiIp));
  await duoi(UID.chu, `select kho_luu_cai_dat_goc($1, 'gia_tri', true, false, 'kiem_ke', true)`, [cnA.id]);
  await doiSoat('Sau nguồn iPOS');
});

// ===========================================================================
await nhom('7 · KIỂM KÊ KHO THEO LÔ, CHỨNG TỪ TREO, TỒN ĐỔI SAU KHI GỬI', async () => {
  const b = await batDau(UID.thuKhoA, viTri.kho, 'theo_lo');
  ok('Thủ kho bắt đầu kiểm kê kho lạnh theo lô', b.loi === null, b.loi ?? '');
  const id = b.rows[0].id;
  const ds = await dongKK(id);
  ok('Mỗi lô đang có ở kho một dòng', ds.length > 0 && ds.every(d => d.lo_id !== null), ds.map(d => d.ma).join());

  const x2 = await ton(X2.id, viTri.kho);
  const dem = {};
  for (const d of ds) {
    const t = await ton(d.lo_id, viTri.kho);
    dem[d.lo_id] = MH[d.ma].dem_goi ? { goi: t.goi } : { kg: t.kg };
  }
  dem[X2.id] = { goi: x2.goi - 1 };
  const luu = await luuDem(UID.thuKhoA, id, dem, { theoLo: true });
  ok('Lưu số đếm theo lô', luu.loi === null, luu.loi ?? '');
  await guiKK(UID.thuKhoA, id);

  // Phiên pha lóc nháp dùng hàng ở kho → chặn duyệt.
  const [tang] = await nhapHang([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 10, don_gia_kg: 500000 }], viTri.quay);
  const ph = await duoi(UID.thuKhoA, `
    select * from kho_luu_phien_pha(null, $1, $2, null, $3, null, $4::date, null, $5::jsonb, $6::jsonb)`,
    [cnA.id, maGui(), MH['T-THANNGOAI'].id, homNay,
     JSON.stringify([{ lo_id: tang.id, vi_tri_id: viTri.quay }]),
     JSON.stringify([{ mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 7, so_goi: 14, xu_ly: 'nhap_kho', vi_tri_id: viTri.kho }])]);
  const bi = await duyetKK(UID.qlA, id);
  ok('Phiên pha lóc nháp đưa hàng vào kho → chặn duyệt kiểm kê kho',
     bi.loi !== null && /Còn phiên pha lóc chưa chốt/.test(bi.loi), bi.loi ?? '');
  await duoi(UID.thuKhoA, `select kho_huy_phien_pha($1, 'Làm lại sau')`, [ph.rows[0].phien_id]);

  // Tồn giảm sau khi gửi, nhiều hơn số còn lại → duyệt báo rõ, không ghi gì.
  const lay = await xuat(UID.thuKhoA, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
                                        dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, lo_id: X2.id, so_goi: x2.goi }] });
  ok('Chuyển hết lô X2 ra quầy sau khi gửi kiểm kê', lay.loi === null, lay.loi ?? '');
  const hong = await duyetKK(UID.qlA, id);
  ok('Duyệt bị chặn: tồn đã đổi sau khi gửi, gợi ý từ chối để đếm lại',
     hong.loi !== null && /tồn đã thay đổi sau khi gửi kiểm kê/.test(hong.loi), hong.loi ?? '');
  ok('Phiếu vẫn chờ duyệt, không ghi sổ dòng nào',
     (await kk(id)).trang_thai === 'cho_duyet'
       && (await db.query(`select count(*)::int as n from kho_so_cai where chung_tu_id = $1`, [id])).rows[0].n === 0);

  const huyNv = await duoi(UID.nvQuayA, `select kho_huy_kiem_ke($1, 'x')`, [id]);
  ok('Phiếu chờ duyệt: NV quầy không hủy được', huyNv.loi !== null && /chỉ quản lý/.test(huyNv.loi));
  const huy = await duoi(UID.qlA, `select kho_huy_kiem_ke($1, 'Đếm lại từ đầu') as cau`, [id]);
  ok('Quản lý hủy phiếu', huy.loi === null && (await kk(id)).trang_thai === 'da_huy');

  const moi = await batDau(UID.thuKhoA, viTri.kho, 'theo_lo');
  ok('Hủy xong thì mở phiếu mới cho kho được', moi.loi === null, moi.loi ?? '');
  const id2 = moi.rows[0].id;
  const dem2 = {};
  for (const d of await dongKK(id2)) {
    const t = await ton(d.lo_id, viTri.kho);
    dem2[d.lo_id] = MH[d.ma].dem_goi ? { goi: t.goi } : { kg: Math.max(t.kg - 0.2, 0) };
  }
  await luuDem(UID.thuKhoA, id2, dem2, { theoLo: true });
  await guiKK(UID.thuKhoA, id2);
  const ok2 = await duyetKK(UID.qlA, id2);
  ok('Duyệt kiểm kê kho: thịt vụn hụt 0,2 kg', ok2.loi === null, ok2.loi ?? '');
  const { rows: loai } = await db.query(`select loai, so_kg::numeric as kg from kho_so_cai where chung_tu_id = $1`, [id2]);
  ok('Thiếu ở KHO ghi "chênh lệch kiểm kê", không phải bán',
     loai.length === 1 && loai[0].loai === 'kiem_ke' && Number(loai[0].kg) === -0.2, JSON.stringify(loai));
  await doiSoat('Sau kiểm kê kho');
});

// ===========================================================================
await nhom('8 · AI THẤY GÌ', async () => {
  const dem = async (uid, bang) => (await duoi(uid, `select count(*)::int as n from ${bang}`)).rows?.[0]?.n;
  ok('NV quầy thấy phiếu xuất (không có tiền)', await dem(UID.nvQuayA, 'kho_v_phieu_xuat') > 0);
  ok('NV quầy thấy phiếu kiểm kê', await dem(UID.nvQuayA, 'kho_v_kiem_ke') > 0);
  ok('NV quầy thấy dòng kiểm kê và lô phía sau', await dem(UID.nvQuayA, 'kho_kiem_ke_lo') > 0);
  ok('Thủ kho chi nhánh khác KHÔNG thấy phiếu xuất Q1', await dem(UID.thuKhoB, 'kho_phieu_xuat') === 0);
  ok('Thủ kho chi nhánh khác KHÔNG thấy kiểm kê Q1', await dem(UID.thuKhoB, 'kho_kiem_ke') === 0);
  ok('Thu ngân (vai CRM) KHÔNG thấy phiếu xuất', await dem(UID.thuNganA, 'kho_phieu_xuat') === 0);
  ok('Marketing KHÔNG thấy kiểm kê', await dem(UID.mktA, 'kho_kiem_ke') === 0);

  const sua = await duoi(UID.qlA, `update kho_kiem_ke set trang_thai = 'da_duyet' where trang_thai = 'da_huy'`);
  const { rows: [{ n }] } = await db.query(`select count(*)::int as n from kho_kiem_ke where trang_thai = 'da_huy'`);
  ok('Quản lý KHÔNG sửa thẳng trạng thái kiểm kê được', sua.loi !== null || n > 0);
  const xoa = await duoi(UID.qlA, `delete from kho_phieu_xuat`);
  const { rows: [{ n: con }] } = await db.query(`select count(*)::int as n from kho_phieu_xuat`);
  ok('Quản lý KHÔNG xóa được phiếu xuất', xoa.loi !== null || con > 0);

  for (const f of ['kho_phan_bo(null::uuid, null::uuid, null::uuid, 1, null::numeric, false)',
                   'kho_dung_lai_ton(null::uuid)', 'kho_kg_tb_goi(null::uuid)', 'kho_kiem_ke_bo_sung_dong(null::uuid)']) {
    const r = await duoi(UID.qlA, `select ${f}`);
    ok(`Hàm nội bộ ${f.split('(')[0]} không gọi thẳng được`, r.loi !== null && /permission denied/.test(r.loi), r.loi ?? '');
  }
  await doiSoat('Cuối cùng');
});

process.exit(ketThuc('CHUYỂN, XUẤT, HỦY, KIỂM KÊ'));
