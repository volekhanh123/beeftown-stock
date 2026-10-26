/**
 * BEEFTOWN KHO — Thu ngân / FABi: món cần có trên FABi, bán không biết tảng, chặn ghép sai
 * =======================================================================================
 *
 *     node test/test-kho-ipos-fabi.mjs
 *
 * Kho chỉ biết tảng của khay bán ra khi dòng hóa đơn iPOS mang mã ô (hoặc mã giảm). Ba việc
 * chỉ ở web (lib/kho/thu-ngan.ts, lib/kho/ban-ipos.ts), không migration:
 *   · "Món cần có trên FABi" (Ghép món, vai danh_muc): mỗi ô mã + mỗi mã giảm đang bật một món,
 *     đối chiếu thực đơn iPOS — thực đơn rỗng thì không kết luận; tải CSV (taoTepMonFabi).
 *   · "Bán không biết tảng · 7 ngày" (Bán hàng iPOS): dòng đã trừ kho của món có ô mà không qua
 *     ô, không mã giảm; dòng lệch ô. Tách hôm nay / 7 ngày theo giờ Việt Nam.
 *   · Chặn ghép sai TRƯỚC khi gọi database: mã trùng mã giảm / mã ô thì không ghép như món
 *     thường; ghép món có ô mà không chọn ô thì phải xác nhận. Mã ô / mã giảm của món đã ngừng
 *     dùng thì database không tự nhận (dòng chưa khớp) → web cho ghép như mã thường (nhóm 10).
 *
 * Dựng như test-kho-ipos-o-ma.mjs: hai tảng thăn ngoại → ô 1 (10011), ô 2 (10012), mã giảm 30%
 * (90001), mã FABi "THAN" ghép món thường. Hóa đơn gửi qua kho_ipos_nhan_callback ở những mốc
 * giờ cố định (giờ Việt Nam), web đọc bằng client giả taoClientPg dưới từng vai.
 */

import {
  dungDatabase, taoBoDem, taoClientPg, UID, maGui, UID_MAY_IPOS, themMayIpos,
} from './kho-chung.mjs';
import { datGio, traGio } from './dong-ho-gia.mjs';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loaiKhongBietTang, tomTatKhongBietTang, docBanKhongBietTang, bayNgayQua, NGUYEN_NHAN_KHONG_BIET_TANG,
  monCanCoTrenFabi, docMonFabi, docThemMonFabi, maVachFabi, tenMonFabiO, nhanTrenFabi, taoTepMonFabi,
  hopKhongBietTang, mucMonFabi, dongCsvMonFabi,
} from '../../web/src/lib/kho/thu-ngan.ts';
import { ganMaIpos, kiemGhep, laMaKhoTuNhan, docFormGhep, oThucDon } from '../../web/src/lib/kho/ban-ipos.ts';
import { giaGiam } from '../../web/src/lib/kho/ma-giam.ts';
import { homNayVn, congNgay } from '../../web/src/lib/gio-vn.ts';
import { timChuoiCam } from '../../web/src/lib/chuoi-cam.js';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — THU NGÂN / FABi');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');

const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
await themMayIpos(db, cnA, cnB);
const MAY = UID_MAY_IPOS.mayIposA;
// Quản lý đã nghỉ việc (dungDatabase chỉ có thủ kho đã nghỉ).
const QL_NGHI = '00000000-0000-4000-8000-0000000000fe';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam) values ($1, $2, 'Quản lý đã nghỉ', 'quan_ly', false)`,
  [QL_NGHI, cnA.id]);
// Hàm web đọc song song (Promise.all). duoi() là bốn câu lệnh nối nhau (xóa / đặt phiên, set role, truy
// vấn, reset role) trên MỘT database PGlite: hai lời gọi chen nhau thì câu "delete from auth._phien" của
// lời gọi này chạy dưới vai authenticated của lời gọi kia ("permission denied for table _phien"). Xếp hàng
// từng lời gọi — trên Supabase thật mỗi lời gọi là một yêu cầu HTTP riêng, không có chuyện này.
let hangDoi = Promise.resolve();
const noiTiep = f => (...thamSo) => {
  const p = hangDoi.then(() => f(...thamSo));
  hangDoi = p.catch(() => {});
  return p;
};
const clientCua = await taoClientPg({ db, duoi: noiTiep(duoi), duoiAnon: noiTiep(duoiAnon) });

// Mốc giờ CỐ ĐỊNH theo giờ Việt Nam. D = hai ngày trước hôm nay thật: mọi lần bán đều ở quá khứ.
const HOM_NAY_THAT = homNayVn();
const D = congNgay(HOM_NAY_THAT, -2);
const D1 = congNgay(D, 1);       // "hôm nay" khi đồng hồ web đặt ở D1 00:10
const luc = (ngay, gio) => `${ngay}T${gio}:00+07:00`;
const BAN_HOM_NAY = luc(D1, '00:05');
const TU_LUC = new Date(Date.now() - 12 * 86400000).toISOString();
const POS_ID = '5898';

const MH = {};
let vt = {};
const O = {};
const LO = {};

let tran = 500;
function hd(items, thoiDiem, { ma = null, huy = false } = {}) {
  tran += 1;
  return {
    ma_hd: ma ?? `${POS_ID}:${tran}`,
    thoi_diem_ban: thoiDiem,
    da_huy: huy,
    raw: { event_id: 11 },
    dong: items.map((it, i) => ({
      khoa_dong: it.khoa ?? i, ma_ipos: it.ma, ten_ipos: it.ten ?? it.ma, so_luong: it.sl, thanh_tien: 450000,
    })),
  };
}
async function gui(h) {
  const r = await duoi(MAY, `select kho_ipos_nhan_callback($1, $2::jsonb) as kq`, [cnA.id, JSON.stringify(h)]);
  if (r.loi) throw new Error(r.loi);
  return (await db.query(`select d.* from kho_ipos_dong d join kho_ipos_hoa_don h on h.id = d.hoa_don_id
    where h.ma_hd = $1 order by d.khoa_dong::int`, [h.ma_hd])).rows;
}
const ban = (items, thoiDiem, tuy) => gui(hd(items, thoiDiem, tuy));

/** Đọc hộp "bán không biết tảng" với đồng hồ web đặt ở một mốc (giờ VN). */
async function docLuc(moc, client = clientCua(UID.qlA), cn = cnA.id) {
  datGio(moc);
  try { return await docBanKhongBietTang(client, cn); } finally { traGio(); }
}
const khongCo = tt => tt.nhom.length === 0
  && Object.values(tt.dem).every(theoLoai => Object.values(theoLoai).every(d => d.dong === 0 && d.hoaDon === 0));

/** Client bọc: bảng `hong` trả lỗi mạng; đếm số lần gọi rpc (để biết có ghi gì không). */
function clientHong(goc, hong) {
  const loi = { data: null, error: { message: 'TypeError: fetch failed' } };
  const dem = { rpc: 0 };
  const builderHong = () => {
    const b = {
      select: () => b, eq: () => b, in: () => b, is: () => b, gte: () => b, order: () => b, range: () => b, limit: () => b,
      maybeSingle: () => Promise.resolve(loi),
      then: (xong, that) => Promise.resolve(loi).then(xong, that),
    };
    return b;
  };
  return {
    dem,
    client: {
      rpc: (...a) => { dem.rpc++; return goc.rpc(...a); },
      from: bang => (hong.includes(bang) ? builderHong() : goc.from(bang)),
    },
  };
}

/** Client bọc: ghi lại mọi lời gọi trên bảng / view (tên hàm + tham số) và mọi dòng web nhận về từ kho_v_ipos_dong. */
function clientGhi(goc) {
  const ghi = { goi: [], dong: [] };
  return {
    ghi,
    client: {
      rpc: (...a) => goc.rpc(...a),
      from: bang => {
        const b = goc.from(bang);
        const p = new Proxy(b, {
          get(t, k) {
            if (k === 'then') {
              return (xong, hong) => t.then(kq => {
                if (bang === 'kho_v_ipos_dong' && Array.isArray(kq?.data)) ghi.dong.push(...kq.data);
                return kq;
              }).then(xong, hong);
            }
            const v = t[k];
            if (typeof v !== 'function') return v;
            return (...a) => { ghi.goi.push([bang, String(k), ...a]); const r = v.apply(t, a); return r === t ? p : r; };
          },
        });
        return p;
      },
    },
  };
}

// ===========================================================================
await nhom('1 · CHUẨN BỊ: HAI TẢNG, HAI Ô, MÃ GIẢM, MÓN CHUNG "THAN"', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vt = Object.fromEntries((await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  const ncc = (await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC Úc') returning id`)).rows[0].id;
  await duoi(UID.qlA, `update kho_mat_hang set theo_tang = true where ma = 'T-THANNGOAI'`);
  await duoi(UID.qlA, `update kho_mat_hang set gia_ban_kg = 900000 where ma = 'C-THANNGOAI'`);
  const ct = (await duoi(UID.qlA, `insert into kho_cong_thuc_pha (mat_hang_vao_id, ten) values ($1, 'Chuẩn') returning id`,
    [MH['T-THANNGOAI'].id])).rows[0].id;
  await duoi(UID.qlA, `insert into kho_cong_thuc_pha_dong (cong_thuc_id, mat_hang_ra_id, ty_le_du_kien) values ($1, $2, 60)`, [ct, MH['C-THANNGOAI'].id]);
  for (const r of (await duoi(UID.qlA, `insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 1, '10011'), ($1, 2, '10012') returning id, so_o`,
    [MH['C-THANNGOAI'].id])).rows) O[r.so_o] = r.id;

  const ngay = n => congNgay(HOM_NAY_THAT, n);
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cnA.id, maGui(), ncc, vt.kho, ngay(-14), JSON.stringify([1, 2].map(() =>
      ({ mat_hang_id: MH['T-THANNGOAI'].id, so_kg: 6, so_kg_thuc: 5.9, don_gia_kg: 450000, ngay_mo: ngay(-20) })))]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  await duoi(UID.qlA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
  const d = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [p.phieu_id]);
  if (d.loi) throw new Error(d.loi);
  const tang = (await db.query(`select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1 order by d.thu_tu`, [p.phieu_id])).rows;

  // Tảng #1 → ô 1 (hạn xa), tảng #2 → ô 2 (hạn gần). Mỗi lô 6 gói × 0,5 kg ở quầy.
  for (const [i, han] of [[0, 5], [1, 2]]) {
    const ph = await duoi(UID.thuKhoA, `
      select * from kho_luu_phien_pha(
        p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
        p_mat_hang_vao_id => $3, p_cong_thuc_id => null, p_ngay_pha => $4::date,
        p_ghi_chu => null, p_vao => $5::jsonb, p_ra => $6::jsonb)`,
      [cnA.id, maGui(), MH['T-THANNGOAI'].id, HOM_NAY_THAT, JSON.stringify([{ lo_id: tang[i].id, vi_tri_id: vt.kho }]),
       JSON.stringify([{ mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 3, so_goi: 6, xu_ly: 'nhap_kho', vi_tri_id: vt.quay, han_dung: ngay(han) }])]);
    if (ph.loi) throw new Error(ph.loi);
    const id = ph.rows[0].phien_id;
    const g = await duoi(UID.thuKhoA, `select kho_giao_o_ma($1, null) as kq`, [id]);
    if (g.loi) throw new Error(g.loi);
    const pb = (await db.query(`select phien_ban from kho_phien_pha where id = $1`, [id])).rows[0].phien_ban;
    const c = await duoi(UID.thuKhoA, `select kho_chot_phien_pha($1, $2)`, [id, pb]);
    if (c.loi) throw new Error(c.loi);
    LO[i + 1] = (await db.query(`select lo_id from kho_phien_pha_ra where phien_pha_id = $1`, [id])).rows[0].lo_id;
  }
  // Ô được giao từ trước mọi mốc bán trong test.
  await db.query(`update kho_o_ma_giao set tu_luc = now() - interval '30 days'`);

  const g30 = await duoi(UID.qlA, `select kho_luu_ma_giam($1, 30) as v`, [MH['C-THANNGOAI'].id]);
  const g50 = await duoi(UID.qlA, `select kho_luu_ma_giam($1, 50) as v`, [MH['C-THANNGOAI'].id]);
  const maTat = (await db.query(`select id, ma_can from kho_ma_giam where phan_tram = 50`)).rows[0];
  await duoi(UID.qlA, `select kho_bat_ma_giam($1, false)`, [maTat.id]);
  const giam = (await db.query(`select ma_can, phan_tram, dang_dung from kho_ma_giam order by phan_tram`)).rows;
  ok('Mã giảm 30% = 90001 (đang bật), 50% đã tắt', g30.loi === null && g50.loi === null
     && giam[0]?.ma_can === '90001' && giam[0].dang_dung === true && giam[1]?.dang_dung === false, JSON.stringify(giam));

  const chu = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb) as v`, [cnA.id,
    JSON.stringify({ bat: true, pos_parent: 'BEEFTOWN', pos_id: POS_ID, vi_tri_ban_id: vt.quay })]);
  const cs = await duoi(UID.chu, `select kho_ipos_chuyen_sang($1, $2::timestamptz)`, [cnA.id, TU_LUC]);
  // Món chung của phần cắt có ô — ghép thẳng bằng RPC (database không chặn; web chặn ở nhóm 6).
  const v2 = await duoi(UID.qlA, `select kho_ipos_gan_ma_v2($1, 'THAN', 'mon', $2, 'kg', null)`, [cnA.id, MH['C-THANNGOAI'].id]);
  ok('Bật iPOS, chuyển sang trừ kho theo iPOS; "THAN" ghép món thường với Thăn ngoại cắt lát',
     chu.loi === null && cs.loi === null && v2.loi === null, chu.loi ?? cs.loi ?? v2.loi ?? '');
});

// ===========================================================================
let dongThan2 = [];
await nhom('2 · BÁN Ở NHỮNG MỐC GIỜ VIỆT NAM CỐ ĐỊNH', async () => {
  const [d1] = await ban([{ ma: '10011', sl: 0.5 }], BAN_HOM_NAY);
  ok('Bán mã 10011 (mã món FABi = mã ô) → qua ô 1, đã trừ kho', d1.trang_thai === 'da_ghi' && d1.o_ma_id === O[1] && !d1.lech_o, JSON.stringify(d1));
  const [d2] = await ban([{ ma: 'THAN', sl: 0.5 }], luc(D, '23:50'));
  const [d3] = await ban([{ ma: 'THAN', sl: 0.5 }], luc(congNgay(D, -5), '00:10'));
  const [d4] = await ban([{ ma: 'THAN', sl: 0.5 }], luc(congNgay(D, -6), '23:50'));
  ok('Bán món chung "THAN" ba lần (D 23:50, D−5 00:10, D−6 23:50) → đã trừ kho, không ô, không mã giảm',
     [d2, d3, d4].every(x => x.trang_thai === 'da_ghi' && x.o_ma_id === null && x.ma_giam_id === null), JSON.stringify([d2, d3, d4]));
  const [d5] = await ban([{ ma: '90001', sl: 0.5 }], BAN_HOM_NAY);
  ok('Bán mã giảm 90001 (chưa ghép) → dòng mang ma_giam_id', d5.trang_thai === 'da_ghi' && d5.ma_giam_id !== null && d5.o_ma_id === null, JSON.stringify(d5));
  const h6 = hd([{ ma: 'THAN', sl: 0.5 }, { ma: 'THAN', sl: 0.5 }], BAN_HOM_NAY);
  dongThan2 = await gui(h6);
  const lai = await gui(h6);
  ok('Một hóa đơn hai dòng "THAN"; iPOS gửi lại đúng hóa đơn đó → vẫn 2 dòng, cùng id',
     dongThan2.length === 2 && lai.length === 2 && lai.every((x, i) => x.id === dongThan2[i].id && x.trang_thai === 'da_ghi'));
  const [d7] = await ban([{ ma: '10012', sl: 0.5 }], BAN_HOM_NAY);
  ok('Bán mã 10012 khi lô của ô 2 đã hết → trừ theo hạn gần nhất, lech_o', d7.trang_thai === 'da_ghi' && d7.lech_o === true, JSON.stringify(d7));

  // Hóa đơn sửa trên iPOS bỏ dòng "THAN"; hóa đơn bị hủy.
  const maX = `${POS_ID}:sua`;
  await ban([{ ma: 'THAN', sl: 0.5, khoa: 0 }, { ma: '10011', sl: 0.5, khoa: 1 }], BAN_HOM_NAY, { ma: maX });
  const sua = await ban([{ ma: '10011', sl: 0.5, khoa: 1 }], BAN_HOM_NAY, { ma: maX });
  ok('Hóa đơn sửa trên iPOS bỏ dòng "THAN" → dòng đó thành da_huy', sua.find(x => x.khoa_dong === '0')?.trang_thai === 'da_huy'
     && sua.find(x => x.khoa_dong === '1')?.trang_thai === 'da_ghi', JSON.stringify(sua.map(x => [x.khoa_dong, x.trang_thai])));
  const maY = `${POS_ID}:huy`;
  await ban([{ ma: 'THAN', sl: 0.5 }], BAN_HOM_NAY, { ma: maY });
  const huy = await ban([{ ma: 'THAN', sl: 0.5 }], BAN_HOM_NAY, { ma: maY, huy: true });
  ok('Hóa đơn hủy trên iPOS → dòng "THAN" thành da_huy', huy.every(x => x.trang_thai === 'da_huy'), JSON.stringify(huy.map(x => x.trang_thai)));
});

// ===========================================================================
await nhom('3 · BÁN KHÔNG BIẾT TẢNG — PHÂN LOẠI THUẦN', async () => {
  const coO = new Set(['mon-o']);
  const d = (x) => ({ id: 'x', hoa_don_id: 'h', thoi_diem_ban: '', ngay_ban: '', ma_ipos: 'A', ten_ipos: null,
    mat_hang_id: 'mon-o', ten_mat_hang: 'Món', o_ma_id: null, so_o: null, lech_o: false, ma_giam_id: null, so_kg: 0.5, ...x });
  ok('Món có ô, không ô, không mã giảm → khong_qua_o', loaiKhongBietTang(d({}), coO) === 'khong_qua_o');
  ok('Có ô → không báo; có mã giảm → không báo; món không có ô → không báo',
     loaiKhongBietTang(d({ o_ma_id: 'o1' }), coO) === null && loaiKhongBietTang(d({ ma_giam_id: 'g' }), coO) === null
     && loaiKhongBietTang(d({ mat_hang_id: 'mon-khac' }), coO) === null);
  ok('Lệch ô → lech_o', loaiKhongBietTang(d({ o_ma_id: 'o1', lech_o: true }), coO) === 'lech_o');
  const bay = bayNgayQua('2026-03-01');
  ok('7 ngày qua tính qua tháng (01/03 → 23/02 … 01/03, năm thường)', bay.length === 7 && bay[0] === '2026-02-23' && bay[6] === '2026-03-01', bay.join(','));
  const tt = tomTatKhongBietTang([
    d({ id: '1', hoa_don_id: 'h1', ngay_ban: '2026-03-01', thoi_diem_ban: '2026-02-28T17:05:00Z' }),
    d({ id: '2', hoa_don_id: 'h1', ngay_ban: '2026-03-01', thoi_diem_ban: '2026-02-28T17:05:00Z' }),
    d({ id: '3', hoa_don_id: 'h2', ngay_ban: '2026-02-27', thoi_diem_ban: '2026-02-27T03:00:00Z', ma_ipos: 'B' }),
    d({ id: '4', hoa_don_id: 'h3', ngay_ban: '2026-02-27', o_ma_id: 'o', lech_o: true, ma_ipos: '10012' }),
    d({ id: '5', hoa_don_id: 'h4', ngay_ban: '2026-02-20' }),   // ngoài 7 ngày
  ], coO, '2026-03-01');
  ok('Tóm tắt: hôm nay 2 dòng / 1 hóa đơn; 7 ngày 3 dòng / 2 hóa đơn; lệch ô 1; dòng ngoài 7 ngày bị bỏ',
     tt.dem.homNay.khong_qua_o.dong === 2 && tt.dem.homNay.khong_qua_o.hoaDon === 1
     && tt.dem.bayNgay.khong_qua_o.dong === 3 && tt.dem.bayNgay.khong_qua_o.hoaDon === 2
     && tt.dem.bayNgay.lech_o.dong === 1 && tt.dem.homNay.lech_o.dong === 0, JSON.stringify(tt.dem));
  const n = tt.nhom.find(x => x.loai === 'khong_qua_o');
  ok('Nhóm theo món: mã FABi đã dùng A, B; lần cuối là lần mới nhất', n?.maIpos.join(',') === 'A,B' && n.soDong === 3
     && n.lanCuoi === '2026-02-28T17:05:00Z', JSON.stringify(n));
  ok('Mỗi loại có tên, giải thích, nguyên nhân có thể và chỗ sửa — đủ vi / en',
     Object.values(NGUYEN_NHAN_KHONG_BIET_TANG).every(x => [x.ten, x.giai, x.sua, ...x.nguyenNhan].every(c => c.vi && c.en && c.vi !== c.en))
     && NGUYEN_NHAN_KHONG_BIET_TANG.khong_qua_o.nguyenNhan.length >= 3 && NGUYEN_NHAN_KHONG_BIET_TANG.lech_o.nguyenNhan.length >= 2);

  // Hộp trên trang in gì — chọn bằng hàm thuần, trang chỉ vẽ theo `kieu`.
  const loiMang = 'Mất kết nối tới máy chủ.';
  const hLoi = hopKhongBietTang(tt, loiMang);
  ok('Hộp: đọc lỗi → kiểu "loi", chỉ có câu lỗi — không có số nào để in (kể cả khi lỡ có số cũ)',
     hLoi?.kieu === 'loi' && hLoi.lop === 'loi' && hLoi.cau === loiMang
     && Object.keys(hLoi).sort().join() === 'cau,kieu,lop', JSON.stringify(hLoi));
  ok('Hộp: đọc lỗi mà không có số → vẫn "loi"; không lỗi, không số (vai không xem giá) → không vẽ hộp',
     hopKhongBietTang(null, loiMang)?.kieu === 'loi' && hopKhongBietTang(null, null) === null);
  const hChuaO = hopKhongBietTang(tomTatKhongBietTang([], new Set(), '2026-03-01'), null);
  ok('Hộp: chưa món nào có ô → "chua_co_o", không số 0', hChuaO?.kieu === 'chua_co_o' && !('loai' in hChuaO), JSON.stringify(hChuaO));
  const hRong = hopKhongBietTang(tomTatKhongBietTang([d({ o_ma_id: 'o1', ngay_ban: '2026-03-01' })], coO, '2026-03-01'), null);
  ok('Hộp: có ô mà 7 ngày không dòng nào cần xem → "khong_co" kèm khoảng ngày (23/02 → 01/03), lớp xong',
     hRong?.kieu === 'khong_co' && hRong.lop === 'xong' && hRong.tuNgay === '2026-02-23' && hRong.homNay === '2026-03-01', JSON.stringify(hRong));
  const hCo = hopKhongBietTang(tt, null);
  ok('Hộp: có dòng → "co_dong", lớp lưu ý; khối "không qua ô" trước "lệch ô", mỗi khối số hôm nay / 7 ngày và đúng nhóm món',
     hCo?.kieu === 'co_dong' && hCo.lop === 'luu-y' && hCo.loai.map(x => x.loai).join() === 'khong_qua_o,lech_o'
     && hCo.loai[0].homNay.dong === 2 && hCo.loai[0].bayNgay.dong === 3 && hCo.loai[0].bayNgay.hoaDon === 2
     && hCo.loai[1].bayNgay.dong === 1 && hCo.loai[1].nhom.every(x => x.loai === 'lech_o'), JSON.stringify(hCo));
  const chiLech = hopKhongBietTang(tomTatKhongBietTang([d({ id: '9', hoa_don_id: 'h9', ngay_ban: '2026-03-01', o_ma_id: 'o', lech_o: true })], coO, '2026-03-01'), null);
  ok('Hộp: loại không có dòng trong 7 ngày thì không có khối (chỉ lệch ô)',
     chiLech?.kieu === 'co_dong' && chiLech.loai.map(x => x.loai).join() === 'lech_o', JSON.stringify(chiLech));
});

// ===========================================================================
await nhom('4 · BÁN KHÔNG BIẾT TẢNG — ĐỌC DATABASE, GIỜ VIỆT NAM', async () => {
  const a = await docLuc(luc(D1, '00:10'));
  ok('Xem lúc 00:10 ngày D+1: hôm nay 2 dòng "THAN" (1 hóa đơn), 1 dòng lệch ô',
     a.homNay === D1 && a.dem.homNay.khong_qua_o.dong === 2 && a.dem.homNay.khong_qua_o.hoaDon === 1 && a.dem.homNay.lech_o.dong === 1,
     JSON.stringify(a.dem));
  ok('7 ngày: D 23:50 và D−5 00:10 vẫn trong, D−6 23:50 (ngày thứ 8) ngoài → 4 dòng, 3 hóa đơn',
     a.dem.bayNgay.khong_qua_o.dong === 4 && a.dem.bayNgay.khong_qua_o.hoaDon === 3 && a.tuNgay === congNgay(D, -5), JSON.stringify(a.dem));
  ok('Không đếm: dòng qua ô, dòng mã giảm, dòng da_huy (hóa đơn sửa / hủy), dòng gửi lại',
     a.dem.bayNgay.khong_qua_o.dong + a.dem.bayNgay.lech_o.dong === 5);
  const nThan = a.nhom.find(x => x.loai === 'khong_qua_o');
  const nLech = a.nhom.find(x => x.loai === 'lech_o');
  ok('Nhóm: Thăn ngoại cắt lát · mã FABi THAN · 4 dòng; lệch ô · mã 10012',
     nThan?.ten === MH['C-THANNGOAI'].ten && nThan.maIpos.join() === 'THAN' && nThan.soDong === 4 && nLech?.maIpos.join() === '10012',
     JSON.stringify(a.nhom));

  const b = await docLuc(luc(D, '23:55'));
  ok('Bán lúc 23:50 ngày D: xem lúc 23:55 cùng ngày → thuộc hôm nay', b.homNay === D && b.dem.homNay.khong_qua_o.dong === 1, JSON.stringify(b.dem));
  ok('Xem lúc 00:10 hôm sau → không còn là hôm nay mà vẫn trong 7 ngày (đã kiểm ở trên: hôm nay chỉ 2 dòng của D+1)',
     a.dem.homNay.khong_qua_o.dong === 2 && a.dem.bayNgay.khong_qua_o.dong === 4);
  const c = await docLuc(luc(congNgay(D1, 1), '00:10'));
  ok('Sang ngày D+2: lần bán D−5 thành ngày thứ 8 → rơi khỏi 7 ngày (còn 3 dòng, 2 hóa đơn); hôm nay 0',
     c.dem.bayNgay.khong_qua_o.dong === 3 && c.dem.bayNgay.khong_qua_o.hoaDon === 2 && c.dem.homNay.khong_qua_o.dong === 0, JSON.stringify(c.dem));

  // Lọc ở database, không kéo mọi dòng đã qua ô về web rồi mới lọc: chỉ dòng không ô + không mã giảm, hoặc
  // lệch ô; mốc ngày theo cột thoi_diem_ban (00:00 giờ VN của ngày đầu), không theo cột tính ngay_ban.
  const { client: soi, ghi } = clientGhi(clientCua(UID.qlA));
  const s = await docLuc(luc(D1, '00:10'), soi);
  const tuNgay = congNgay(D, -5);
  const mocUtc = new Date(`${tuNgay}T00:00:00+07:00`).toISOString();
  const goiView = ghi.goi.filter(g => g[0] === 'kho_v_ipos_dong');
  ok('Đọc hộp: web chỉ nhận dòng không qua ô (không ô, không mã giảm) hoặc lệch ô — không nhận dòng bán qua ô, dòng mã giảm',
     ghi.dong.length === 5 && ghi.dong.every(r => r.lech_o === true || (r.o_ma_id === null && r.ma_giam_id === null))
     && s.dem.bayNgay.khong_qua_o.dong === 4, JSON.stringify(ghi.dong.map(r => [r.ma_ipos, r.o_ma_id, r.ma_giam_id, r.lech_o])));
  ok(`Đọc hộp: lọc ngày bằng thoi_diem_ban >= ${mocUtc} (00:00 giờ VN ngày ${tuNgay}), không lọc theo cột tính ngay_ban`,
     goiView.some(g => g[1] === 'gte' && g[2] === 'thoi_diem_ban' && g[3] === mocUtc)
     && !goiView.some(g => g[2] === 'ngay_ban' && g[1] !== 'select'), JSON.stringify(goiView.filter(g => g[1] !== 'select')));
});

// ===========================================================================
await nhom('5 · QUYỀN VÀ MẤT MẠNG — BÁN KHÔNG BIẾT TẢNG', async () => {
  const moc = luc(D1, '00:10');
  const thuKho = await docLuc(moc, clientCua(UID.thuKhoA));
  const quay = await docLuc(moc, clientCua(UID.nvQuayA));
  ok('Thủ kho, nhân viên quầy đọc → không thấy dòng nào (view cần xem_gia)', khongCo(thuKho) && khongCo(quay));
  ok('Quản lý chi nhánh B đọc chi nhánh A → không thấy dòng nào', khongCo(await docLuc(moc, clientCua(UID.qlB))));
  ok('Quản lý chi nhánh B đọc chi nhánh B → không thấy dòng của A', khongCo(await docLuc(moc, clientCua(UID.qlB), cnB.id)));
  ok('Quản lý đã nghỉ việc → không thấy dòng nào', khongCo(await docLuc(moc, clientCua(QL_NGHI))));
  const loiHoacRong = async uid => { try { return khongCo(await docLuc(moc, clientCua(uid))); } catch { return true; } };
  ok('anon → lỗi hoặc rỗng, không ra dòng nào', await loiHoacRong('anon'));
  ok('Tài khoản không có dòng nhan_su → lỗi hoặc rỗng, không lộ dữ liệu', await loiHoacRong(null));

  for (const bang of ['kho_o_ma', 'kho_v_ipos_dong']) {
    const { client } = clientHong(clientCua(UID.qlA), [bang]);
    let nem = null;
    try { await docLuc(moc, client); } catch (e) { nem = e; }
    ok(`Mất mạng khi đọc ${bang} → docBanKhongBietTang ném lỗi (không trả số 0)`, nem !== null);
  }
});

// ===========================================================================
await nhom('6 · CHẶN GHÉP SAI TRƯỚC KHI GỌI DATABASE', async () => {
  const fd = o => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
  const ng = { oMa: [{ id: O[1], mat_hang_id: MH['C-THANNGOAI'].id, so_o: 1, ma_can: '10011' },
                     { id: O[2], mat_hang_id: MH['C-THANNGOAI'].id, so_o: 2, ma_can: '10012' }],
               maGiam: [{ ma_can: '90001', phan_tram: 30, mat_hang_id: MH['C-THANNGOAI'].id },
                        { ma_can: '90002', phan_tram: 50, mat_hang_id: MH['C-THANNGOAI'].id }],
               monDangDung: new Set([MH['C-THANNGOAI'].id, MH['T-THANNGOAI'].id]) };
  const ghep = o => docFormGhep(fd(o)).ghep;
  const c1 = kiemGhep(ghep({ ma_ipos: '90001', mat_hang_id: MH['C-THANNGOAI'].id, don_vi_ban: 'kg' }), ng, true);
  ok('Mã trùng mã giảm ghép như món thường → từ chối (vi / en), xác nhận cũng không qua', !!c1 && /giảm/.test(c1.cau.vi) && /discount/i.test(c1.cau.en) && !c1.canXacNhan,
     JSON.stringify(c1));
  ok('Mã giảm đã tắt (90002), mã có số 0 đầu (090001) ghép như món thường → vẫn từ chối, xác nhận nào cũng không qua',
     kiemGhep(ghep({ ma_ipos: '90002', mat_hang_id: MH['C-THANNGOAI'].id }), ng, true, true)?.canXacNhan === false
     && kiemGhep(ghep({ ma_ipos: '090001', mat_hang_id: `o:${O[1]}` }), ng, true, true)?.canXacNhan === false);
  // Trùng mã thật (FABi có sẵn món khác mang mã 10011 / 90002, hoặc mã của món đã ngừng dùng): lối thoát
  // "Không phải hàng kho" / Bán theo suất / Hàng cân nhãn vẫn còn, nhưng phải xác nhận.
  const tm = [
    ['90002', { mat_hang_id: 'bo_qua' }], ['090001', { mat_hang_id: 'goi_can' }],
    ['10011', { mat_hang_id: 'bo_qua' }], ['10012', { mat_hang_id: '', don_vi_ban: 'suat' }],
  ];
  const chuaXn = tm.map(([ma, o]) => kiemGhep(ghep({ ma_ipos: ma, ...o }), ng, false, false));
  ok('Mã trùng mã ô / mã giảm ghép "Không phải hàng kho", hàng cân nhãn, suất, chưa xác nhận → dừng, cần xác nhận "trùng mã" (vi / en)',
     chuaXn.every(c => c?.canXacNhan === 'trung_ma' && /món khác/.test(c.cau.vi) && /different dish/.test(c.cau.en)),
     JSON.stringify(chuaXn));
  ok('… đã xác nhận "trùng mã" → được ghép (lối thoát cho mã trùng thật)',
     tm.every(([ma, o]) => kiemGhep(ghep({ ma_ipos: ma, ...o }), ng, false, true) === null));
  ok('Xác nhận "trùng mã" không mở khóa ghép mã ô như món thường; xác nhận "món chung" không mở khóa "Không phải hàng kho" cho mã ô',
     kiemGhep(ghep({ ma_ipos: '10011', mat_hang_id: MH['C-THANNGOAI'].id }), ng, true, true)?.canXacNhan === false
     && kiemGhep(ghep({ ma_ipos: '10011', mat_hang_id: 'bo_qua' }), ng, true, false)?.canXacNhan === 'trung_ma');
  ok('Bỏ ghép mã giảm → được', kiemGhep(ghep({ ma_ipos: '90001', mat_hang_id: 'bo_ghep' }), ng, false) === null);
  const c2 = kiemGhep(ghep({ ma_ipos: '10011', mat_hang_id: MH['C-THANNGOAI'].id }), ng, true);
  ok('Mã trùng mã ô ghép như món thường → từ chối, nói ô 1', !!c2 && /ô 1/.test(c2.cau.vi) && /slot 1/.test(c2.cau.en), JSON.stringify(c2));
  ok('Mã ô ghép đúng ô của nó → được; ghép sang ô khác → từ chối',
     kiemGhep(ghep({ ma_ipos: '10011', mat_hang_id: `o:${O[1]}` }), ng, false) === null
     && !!kiemGhep(ghep({ ma_ipos: '10011', mat_hang_id: `o:${O[2]}` }), ng, false));
  const c3 = kiemGhep(ghep({ ma_ipos: 'THAN2', mat_hang_id: MH['C-THANNGOAI'].id }), ng, false);
  ok('Ghép món có ô mà không chọn ô → cảnh báo, cần xác nhận (vi / en)', !!c3 && c3.canXacNhan && /tảng/.test(c3.cau.vi) && /primal/.test(c3.cau.en), JSON.stringify(c3));
  ok('Đã xác nhận "món chung" → được; món không có ô → được',
     kiemGhep(ghep({ ma_ipos: 'THAN2', mat_hang_id: MH['C-THANNGOAI'].id }), ng, true) === null
     && kiemGhep(ghep({ ma_ipos: 'BACHI', mat_hang_id: MH['T-THANNGOAI'].id }), ng, false) === null);
  ok('laMaKhoTuNhan: 90001 → mã giảm 30%; 010012 → ô 2; THAN → không',
     laMaKhoTuNhan('90001', ng)?.loai === 'giam' && laMaKhoTuNhan('90001', ng).phanTram === 30
     && laMaKhoTuNhan('010012', ng)?.loai === 'o' && laMaKhoTuNhan('010012', ng).soO === 2 && laMaKhoTuNhan('THAN', ng) === null);

  // Ô / mã giảm của món đã NGỪNG DÙNG: database không tự nhận (kho_ipos_ghi_dong 0054 đọc món `and dang_dung` → dòng
  // chưa khớp; kho_ipos_gan_o_ma 0051 từ chối "Món của ô mã đã ngừng dùng") → web coi như mã thường: nút Ghép, ghép được
  // với món khác. Ô không xoá được khi đã từng giao tảng, nên tem cũ của món đã ngừng vẫn có thể bị quét.
  const ngNghi = { ...ng, oMa: [...ng.oMa, { id: 'o-nghi', mat_hang_id: 'mon-nghi', so_o: 1, ma_can: '10031' }],
                   maGiam: [...ng.maGiam, { ma_can: '90031', phan_tram: 30, mat_hang_id: 'mon-nghi' }] };
  ok('laMaKhoTuNhan: mã ô 10031, mã giảm 90031 (kể cả 090031) của món đã ngừng dùng → null (database không tự nhận); ô / mã giảm của món đang dùng vẫn tự nhận',
     laMaKhoTuNhan('10031', ngNghi) === null && laMaKhoTuNhan('90031', ngNghi) === null && laMaKhoTuNhan('090031', ngNghi) === null
     && laMaKhoTuNhan('10011', ngNghi)?.loai === 'o' && laMaKhoTuNhan('90001', ngNghi)?.loai === 'giam',
     JSON.stringify([laMaKhoTuNhan('10031', ngNghi), laMaKhoTuNhan('90031', ngNghi)]));
  ok('Thực đơn: mã ô / mã giảm của món đã ngừng dùng → nút Ghép (không "kho tự nhận"); đã ghép như món thường → không nhắc Bỏ ghép',
     oThucDon('10031', undefined, ngNghi).kieu === 'nut_ghep' && oThucDon('90031', undefined, ngNghi).kieu === 'nut_ghep'
     && oThucDon('10031', { kieu: 'mon', o_ma_id: null }, ngNghi).ghepSai === false
     && oThucDon('90031', { kieu: 'mon', o_ma_id: null }, ngNghi).ghepSai === false);
  ok('Ghép mã ô / mã giảm của món đã ngừng dùng với món khác, hay "Không phải hàng kho" → được, không cần xác nhận "trùng mã"',
     kiemGhep(ghep({ ma_ipos: '10031', mat_hang_id: MH['T-THANNGOAI'].id }), ngNghi, false) === null
     && kiemGhep(ghep({ ma_ipos: '90031', mat_hang_id: MH['T-THANNGOAI'].id }), ngNghi, false) === null
     && kiemGhep(ghep({ ma_ipos: '10031', mat_hang_id: 'bo_qua' }), ngNghi, false, false) === null);

  // Cột "Món kho" của bảng Thực đơn iPOS: nút Ghép hay nhãn "kho tự nhận" — hàm thuần, trang chỉ vẽ theo `kieu`.
  const tdO = oThucDon('10011', undefined, ng);
  const tdG = oThucDon('090001', undefined, ng);
  ok('Thực đơn: mã ô chưa ghép → "Ô 1 — kho tự nhận" (không nút Ghép); mã giảm chưa ghép → "Mã giảm 30%"; mã thường → nút Ghép',
     tdO.kieu === 'tu_nhan_o' && tdO.soO === 1 && tdO.oMaId === O[1] && tdG.kieu === 'tu_nhan_giam' && tdG.phanTram === 30
     && oThucDon('THAN', undefined, ng).kieu === 'nut_ghep', JSON.stringify([tdO, tdG]));
  ok('Thực đơn: thiếu mã giảm (phần FABi đọc lỗi) → mã giảm hiện nút Ghép như mã thường (form vẫn chặn ở kiemGhep)',
     oThucDon('90001', undefined, { ...ng, maGiam: [] }).kieu === 'nut_ghep');
  ok('Thực đơn: đã ghép — mã ô ghép đúng ô, mã trùng đã xác nhận "Không phải hàng kho", mã thường → không nhắc; mã ô / mã giảm ghép như món thường → nhắc Bỏ ghép',
     oThucDon('10011', { kieu: 'mon', o_ma_id: O[1] }, ng).ghepSai === false
     && oThucDon('10011', { kieu: 'bo_qua', o_ma_id: null }, ng).ghepSai === false
     && oThucDon('THAN', { kieu: 'mon', o_ma_id: null }, ng).ghepSai === false
     && oThucDon('10011', { kieu: 'mon', o_ma_id: null }, ng).ghepSai === true
     && oThucDon('10011', { kieu: 'mon', o_ma_id: O[2] }, ng).ghepSai === true
     && oThucDon('90001', { kieu: 'mon', o_ma_id: null }, ng).ghepSai === true
     && oThucDon('90001', { kieu: 'mon', o_ma_id: null }, ng).kieu === 'da_ghep');

  // Qua ganMaIpos với database thật: bị chặn thì không có dòng ghép nào được ghi.
  const ql = clientCua(UID.qlA);
  const maGhep = async ma => (await db.query(`select * from kho_ipos_ma_hang where chi_nhanh_id = $1 and ma_ipos = $2`, [cnA.id, ma])).rows;
  const k1 = await ganMaIpos(ql, cnA.id, fd({ ma_ipos: '90001', mat_hang_id: MH['C-THANNGOAI'].id, don_vi_ban: 'kg', khong_o: 'co' }));
  ok('ganMaIpos "90001" như món thường → ok:false, có cauEn, không ghi', !k1.ok && !!k1.cauEn && (await maGhep('90001')).length === 0, JSON.stringify(k1));
  const k2 = await ganMaIpos(ql, cnA.id, fd({ ma_ipos: 'THAN2', mat_hang_id: MH['C-THANNGOAI'].id, don_vi_ban: 'kg' }));
  ok('ganMaIpos món có ô, chưa xác nhận → ok:false, canXacNhanKhongO, không ghi', !k2.ok && k2.canXacNhanKhongO === true
     && !!k2.cauEn && (await maGhep('THAN2')).length === 0, JSON.stringify(k2));
  const k3 = await ganMaIpos(ql, cnA.id, fd({ ma_ipos: 'THAN2', mat_hang_id: MH['C-THANNGOAI'].id, don_vi_ban: 'kg', khong_o: 'co' }));
  ok('ganMaIpos món có ô, đã xác nhận → ghi', k3.ok && (await maGhep('THAN2')).length === 1, JSON.stringify(k3));
  const k4 = await ganMaIpos(ql, cnA.id, fd({ ma_ipos: 'RIB-O2', mat_hang_id: `o:${O[2]}`, don_vi_ban: '' }));
  ok('ganMaIpos ghép mã khác với ô 2 → ghi (kho_ipos_gan_o_ma)', k4.ok && (await maGhep('RIB-O2'))[0]?.o_ma_id === O[2], JSON.stringify(k4));
  const { client: hong, dem } = clientHong(ql, ['kho_o_ma']);
  const k5 = await ganMaIpos(hong, cnA.id, fd({ ma_ipos: 'MOI', mat_hang_id: MH['T-THANNGOAI'].id, don_vi_ban: 'kg' }));
  ok('Mất mạng khi đọc ô mã → ok:false (vi / en), không gọi hàm ghép', !k5.ok && !!k5.cauEn && dem.rpc === 0 && (await maGhep('MOI')).length === 0,
     JSON.stringify(k5));
  const { client: hongMh, dem: demMh } = clientHong(ql, ['kho_mat_hang']);
  const k5b = await ganMaIpos(hongMh, cnA.id, fd({ ma_ipos: 'MOI', mat_hang_id: MH['T-THANNGOAI'].id, don_vi_ban: 'kg' }));
  ok('Mất mạng khi đọc món đang dùng → ok:false (vi / en), không gọi hàm ghép', !k5b.ok && !!k5b.cauEn && demMh.rpc === 0
     && (await maGhep('MOI')).length === 0, JSON.stringify(k5b));
  const k6 = await ganMaIpos(ql, cnA.id, fd({ ma_ipos: '90001', mat_hang_id: 'bo_ghep' }));
  ok('Bỏ ghép một mã chưa ghép vẫn qua kiểm (không bị chặn ở web)', typeof k6.ok === 'boolean' && !/giảm giá — để trống/.test(k6.cau));
  // Mã giảm đã tắt 90002 trùng một món khác trên FABi: "Không phải hàng kho" cần xác nhận, xác nhận rồi thì ghi.
  const k7 = await ganMaIpos(ql, cnA.id, fd({ ma_ipos: '90002', mat_hang_id: 'bo_qua' }));
  ok('ganMaIpos mã giảm "90002" là "Không phải hàng kho", chưa xác nhận → ok:false, canXacNhanTrungMa, không ghi',
     !k7.ok && k7.canXacNhanTrungMa === true && k7.canXacNhanKhongO === false && !!k7.cauEn && (await maGhep('90002')).length === 0,
     JSON.stringify(k7));
  const k8 = await ganMaIpos(ql, cnA.id, fd({ ma_ipos: '90002', mat_hang_id: 'bo_qua', trung_ma: 'co' }));
  ok('ganMaIpos mã giảm "90002" là "Không phải hàng kho", đã xác nhận trùng mã → ghi kiểu bo_qua',
     k8.ok && (await maGhep('90002'))[0]?.kieu === 'bo_qua', JSON.stringify(k8));
  const k9 = await ganMaIpos(ql, cnA.id, fd({ ma_ipos: '10011', mat_hang_id: MH['C-THANNGOAI'].id, don_vi_ban: 'kg', khong_o: 'co', trung_ma: 'co' }));
  ok('ganMaIpos mã ô "10011" như món thường, tích cả hai ô xác nhận → vẫn từ chối, không ghi',
     !k9.ok && !k9.canXacNhanTrungMa && (await maGhep('10011')).length === 0, JSON.stringify(k9));
});

// ===========================================================================
await nhom('7 · MÓN CẦN CÓ TRÊN FABi — THUẦN', async () => {
  ok('Mã vạch đệm đủ số C của mẫu (mã 12 → 00012; 10011 giữ nguyên)', maVachFabi('12', 5) === '00012' && maVachFabi('10011', 5) === '10011');
  ok('Tên món FABi cho ô: "<tên món> ô <số>", dạng NFC', tenMonFabiO('Thăn ngoại', 1) === 'Thăn ngoại ô 1'.normalize('NFC'));
  const mon = { id: 'm', ten: 'Thăn ngoại', gia_ban_kg: 900000, dang_dung: true };
  const co = (menu, daGhep = []) => monCanCoTrenFabi({
    matHang: [mon, { id: 'm2', ten: 'Món nghỉ', gia_ban_kg: 1, dang_dung: false }],
    oMa: [{ id: 'o1', mat_hang_id: 'm', so_o: 1, ma_can: '10011' }, { id: 'o2', mat_hang_id: 'm', so_o: 2, ma_can: '10012' },
          { id: 'o9', mat_hang_id: 'm2', so_o: 1, ma_can: '20011' }],
    maGiam: [{ id: 'g', mat_hang_id: 'm', phan_tram: 30, ma_can: '90001', dang_dung: true },
             { id: 'g2', mat_hang_id: 'm', phan_tram: 50, ma_can: '90002', dang_dung: false }],
    menu, daGhep, soChuSo: 5,
  });
  const rong = co([]);
  ok('Mọi ô của món đang dùng + mã giảm đang bật (bỏ món đã nghỉ, mã giảm đã tắt)',
     rong.map(x => x.maMon).join(',') === '10011,10012,90001', rong.map(x => x.maMon).join(','));
  ok('Thực đơn rỗng → không món nào bị báo "Chưa thấy trên FABi" (chưa đọc, không kết luận)',
     rong.every(x => x.trenFabi === 'chua_doc'));
  const o1 = rong[0], g = rong[2];
  ok('Ô: tên gợi ý, mã món = mã vạch = mã ô, bán theo kg, giá/kg = giá kho',
     o1.tenGoiY === 'Thăn ngoại ô 1' && o1.maMon === '10011' && o1.maVach === '10011' && o1.giaKg === 900000, JSON.stringify(o1));
  ok('Mã giảm: tên như trên cân, giá = giá đã giảm (làm tròn 1.000 đ)',
     g.tenGoiY === 'Thăn ngoại -30%' && g.giaKg === giaGiam(900000, 30) && g.giaKg === 630000, JSON.stringify(g));
  const daDoc = co([{ ma_ipos: '010011', dang_ban: true }, { ma_ipos: '90001', dang_ban: false }, { ma_ipos: 'RIB-O2', dang_ban: true }],
    [{ ma_ipos: 'RIB-O2', kieu: 'mon', mat_hang_id: 'm', o_ma_id: 'o2' }]);
  ok('Có trong thực đơn (bỏ số 0 đầu) → có; ngừng bán → ngung_ban; ô 2 ghép tay mã RIB-O2 có trong thực đơn → có',
     daDoc[0].trenFabi === 'co' && daDoc[2].trenFabi === 'ngung_ban' && daDoc[1].trenFabi === 'co' && daDoc[1].maDaGhep === 'RIB-O2',
     JSON.stringify(daDoc.map(x => [x.maMon, x.trenFabi, x.maDaGhep])));
  ok('Ô không có trong thực đơn, không ghép tay → chua_thay', co([{ ma_ipos: 'KHAC', dang_ban: true }])[1].trenFabi === 'chua_thay');
  const ghepSai = co([{ ma_ipos: '90001', dang_ban: true }], [{ ma_ipos: '90001', kieu: 'mon', mat_hang_id: 'm', o_ma_id: null },
    { ma_ipos: '10011', kieu: 'mon', mat_hang_id: 'm', o_ma_id: null }]);
  ok('Mã giảm / mã ô đã ghép như món thường → cảnh báo bỏ ghép (vi / en)',
     ghepSai[2].canhBao.length === 1 && /Bỏ ghép/.test(ghepSai[2].canhBao[0].vi) && /Unmatch/.test(ghepSai[2].canhBao[0].en)
     && ghepSai[0].canhBao.length === 1, JSON.stringify(ghepSai.map(x => x.canhBao)));
  const trungMa = co([], [{ ma_ipos: '10012', kieu: 'bo_qua', mat_hang_id: null, o_ma_id: null }]);
  ok('Mã ô đã ghép "Không phải hàng kho" (đã xác nhận là món khác trên FABi) → không bảo Bỏ ghép mà bảo đổi mã ô (vi / en)',
     trungMa[1].canhBao.length === 1 && !/Bỏ ghép/.test(trungMa[1].canhBao[0].vi) && /đổi mã ô/i.test(trungMa[1].canhBao[0].vi)
     && /change the slot code/i.test(trungMa[1].canhBao[0].en), JSON.stringify(trungMa[1].canhBao));
  const dai = monCanCoTrenFabi({
    matHang: [mon], menu: [], daGhep: [], soChuSo: 5,
    oMa: [{ id: 'o6', mat_hang_id: 'm', so_o: 1, ma_can: '100111' }, { id: 'o5', mat_hang_id: 'm', so_o: 2, ma_can: '10012' }],
    maGiam: [{ id: 'g6', mat_hang_id: 'm', phan_tram: 30, ma_can: '900001', dang_dung: true }],
  });
  ok('Mã ô / mã giảm dài hơn số chữ C của mẫu mã vạch (6 > 5) → cảnh báo cân không in được tem, chỉ chỗ đổi mã (vi / en)',
     /dài quá 5 số/.test(dai[0].canhBao[0]?.vi ?? '') && /Mặt hàng/.test(dai[0].canhBao[0].vi) && /longer than 5 digits/.test(dai[0].canhBao[0].en)
     && /dài quá 5 số/.test(dai[2].canhBao[0]?.vi ?? '') && /Giảm giá/.test(dai[2].canhBao[0].vi) && /Discounts/.test(dai[2].canhBao[0].en)
     && dai[1].canhBao.length === 0, JSON.stringify(dai.map(x => [x.maMon, x.canhBao])));
  ok('CSV ghi chú có cảnh báo mã dài', dongCsvMonFabi(dai, 'vi')[0].ghiChu.includes('dài quá 5 số'));

  // Mục "Món cần có trên FABi" in gì — hàm thuần, trang chỉ vẽ theo `kieu`.
  const them = (menu, menuLuc = null) => ({ menu, menuLuc, maGiam: [], soChuSo: 5 });
  const mLoi = mucMonFabi(them([]), 'Không đọc được.', 3);
  ok('Mục FABi: đọc lỗi → "loi", không số món, không kết luận', mLoi.kieu === 'loi' && Object.keys(mLoi).sort().join() === 'cau,kieu', JSON.stringify(mLoi));
  ok('Mục FABi: phần chính chưa đọc được (trang đã báo lỗi ở đầu) → "an", không số', mucMonFabi(null, null, 0).kieu === 'an');
  const mChua = mucMonFabi(them([]), null, 3);
  ok('Mục FABi: thực đơn rỗng → số món cần có, kèm "chưa đọc thực đơn" (không kết luận)',
     mChua.kieu === 'co' && mChua.soMon === 3 && mChua.chuaDocMenu === true, JSON.stringify(mChua));
  const mCo = mucMonFabi(them([{ ma_ipos: 'A', dang_ban: true }], '2026-10-26T01:00:00Z'), null, 3);
  ok('Mục FABi: có thực đơn → giờ đọc và số món thực đơn', mCo.kieu === 'co' && !mCo.chuaDocMenu && mCo.menuLuc === '2026-10-26T01:00:00Z'
     && mCo.soMonMenu === 1, JSON.stringify(mCo));
  ok('Nhãn "trên FABi" đủ vi / en; nhãn "có" nói phải thử mã vạch bằng một tem',
     ['co', 'ngung_ban', 'chua_thay', 'chua_doc'].every(k => nhanTrenFabi(k)[0].vi && nhanTrenFabi(k)[0].en)
     && /mã vạch phải thử bằng một tem/.test(nhanTrenFabi('co')[0].vi) && /test label/.test(nhanTrenFabi('co')[0].en));
});

// ===========================================================================
await nhom('8 · MÓN CẦN CÓ TRÊN FABi — DATABASE, CSV, QUYỀN', async () => {
  const ql = clientCua(UID.qlA);
  // Xóa thực đơn (iPOS trả danh mục rỗng) → chưa đọc.
  await duoi(MAY, `select kho_ipos_luu_menu($1, '[]'::jsonb)`, [cnA.id]);
  const a = await docMonFabi(ql, cnA.id);
  ok('Database: thực đơn rỗng → mọi món "chưa đọc", không món nào "chưa thấy"', a.dong.length === 3 && a.dong.every(x => x.trenFabi === 'chua_doc')
     && a.soMonMenu === 0 && a.menuLuc === null, JSON.stringify(a.dong.map(x => [x.maMon, x.trenFabi])));
  const m = await duoi(MAY, `select kho_ipos_luu_menu($1, $2::jsonb) as v`, [cnA.id,
    JSON.stringify([{ ma_ipos: '10011', ten_ipos: 'Thăn ngoại ô 1' }, { ma_ipos: 'RIB-O2' }, { ma_ipos: 'THAN' }])]);
  const b = await docMonFabi(ql, cnA.id);
  const theo = Object.fromEntries(b.dong.map(x => [x.maMon, x]));
  ok('Database: 10011 có trên FABi; ô 2 qua mã ghép tay RIB-O2; 90001 chưa thấy; kèm giờ đọc thực đơn',
     m.loi === null && theo['10011']?.trenFabi === 'co' && theo['10012']?.trenFabi === 'co' && theo['10012'].maDaGhep === 'RIB-O2'
     && theo['90001']?.trenFabi === 'chua_thay' && !!b.menuLuc && b.soMonMenu === 3, m.loi ?? JSON.stringify(b));
  const them = await docThemMonFabi(ql, cnA.id);
  ok('docThemMonFabi: thực đơn đủ trang, mã giảm, số chữ số mã (mặc định 5)', them.menu.length === 3 && them.maGiam.length === 2 && them.soChuSo === 5);

  datGio('2026-10-26T17:30:00Z');   // 00:30 ngày 27/10/2026 giờ VN
  let tep;
  try { tep = await taoTepMonFabi(ql, { vai: 'quan_ly', chiNhanh: cnA, nn: 'vi' }); } finally { traGio(); }
  const dongCsv = tep.noiDung.split('\r\n');
  ok('CSV: 200, có BOM, dấu chấm phẩy, đủ ba món + dòng đầu', tep.status === 200 && tep.noiDung.startsWith('﻿')
     && dongCsv[0].includes(';') && dongCsv.filter(Boolean).length === 4, tep.noiDung.slice(0, 300));
  ok('CSV: tên "Thăn ngoại cắt lát ô 1" dạng NFC, mã 10011 là chữ thường (không lách bằng "=")',
     tep.noiDung.includes(`${MH['C-THANNGOAI'].ten} ô 1`.normalize('NFC')) && tep.noiDung.includes(';10011;') && !/="|;=/.test(tep.noiDung));
  ok('CSV: tên file ASCII theo giờ Việt Nam (mon-fabi-q1-20261027-0030.csv)', tep.tenTep === 'mon-fabi-q1-20261027-0030.csv', tep.tenTep);
  ok('CSV: giá/kg 900000 và 630000, cột "trên FABi" ghi chữ, mức giảm không bị Excel coi là công thức (không ô nào mở đầu bằng \')',
     tep.noiDung.includes('900000') && tep.noiDung.includes('630000') && tep.noiDung.includes('Chưa thấy trên FABi')
     && tep.noiDung.includes(';giảm 30%;') && !/(^|;)'/m.test(tep.noiDung));
  const en = await taoTepMonFabi(ql, { vai: 'quan_ly', chiNhanh: cnA, nn: 'en' });
  ok('CSV tiếng Anh: tiêu đề cột tiếng Anh, tên món FABi vẫn tiếng Việt (dữ liệu)', en.status === 200
     && /Dish code/.test(en.noiDung.split('\r\n')[0]) && en.noiDung.includes(' ô 1'));

  for (const [uid, vai] of [[UID.thuKhoA, 'thu_kho'], [UID.nvQuayA, 'nhan_vien_quay'], [UID.keToanA, 'ke_toan']]) {
    const t = await taoTepMonFabi(clientCua(uid), { vai, chiNhanh: cnA, nn: 'vi' });
    ok(`${vai} tải mon-fabi.csv → 403, không có dữ liệu`, t.status === 403 && !t.noiDung.includes('10011') && t.tenTep === null);
  }
  const t403en = await taoTepMonFabi(clientCua(UID.thuKhoA), { vai: 'thu_kho', chiNhanh: cnA, nn: 'en' });
  ok('403 tiếng Anh có câu tiếng Anh', t403en.status === 403 && /not allowed|cannot/i.test(t403en.noiDung), t403en.noiDung);
  const nghi = await docMonFabi(clientCua(QL_NGHI), cnA.id);
  ok('Quản lý đã nghỉ việc đọc → không thấy ô, mã giảm nào', nghi.dong.length === 0);
  const loiHoacRong = async uid => { try { return (await docMonFabi(clientCua(uid), cnA.id)).dong.length === 0; } catch { return true; } };
  ok('anon / tài khoản không có nhan_su → lỗi hoặc rỗng', await loiHoacRong('anon') && await loiHoacRong(null));
  const qlB = await docMonFabi(clientCua(UID.qlB), cnA.id);
  ok('Quản lý chi nhánh B đọc thực đơn chi nhánh A → không thấy thực đơn A (chưa đọc, không kết luận)',
     qlB.dong.every(x => x.trenFabi === 'chua_doc'));

  for (const bang of ['kho_ipos_menu', 'kho_ma_giam', 'kho_o_ma']) {
    const { client } = clientHong(ql, [bang]);
    const t = await taoTepMonFabi(client, { vai: 'quan_ly', chiNhanh: cnA, nn: 'vi' });
    ok(`Mất mạng khi đọc ${bang} → CSV 500 có câu lỗi, không bao giờ file rỗng`,
       t.status === 500 && t.tenTep === null && t.noiDung.length > 10 && !t.noiDung.startsWith('﻿'), JSON.stringify(t));
  }
  const { client: hongEn } = clientHong(ql, ['kho_ipos_menu']);
  const t500en = await taoTepMonFabi(hongEn, { vai: 'quan_ly', chiNhanh: cnA, nn: 'en' });
  ok('500 tiếng Anh có câu tiếng Anh', t500en.status === 500 && /Could not/.test(t500en.noiDung), t500en.noiDung);
});

// ===========================================================================
await nhom('9 · TRANG, ROUTE, CÂU CHỮ', async () => {
  const ghep = doc('web/src/pages/noi-bo/kho/ban-ipos/ghep.astro');
  const banIpos = doc('web/src/pages/noi-bo/kho/ban-ipos/index.astro');
  const route = doc('web/src/pages/noi-bo/kho/ban-ipos/mon-fabi.csv.ts');
  ok('Ghép món: mục "Món cần có trên FABi" (id mon-fabi), link tải mon-fabi.csv, đọc thêm riêng (lỗi không làm hỏng trang)',
     /id="mon-fabi"/.test(ghep) && /mon-fabi\.csv/.test(ghep) && /monCanCoTrenFabi\(/.test(ghep) && /docThemMonFabi\([^)]*\)\.catch|catch \(e\) \{ loiFabi/.test(ghep));
  ok('Ghép món: cột "Món kho" của thực đơn iPOS chọn bằng oThucDon (nút Ghép / "kho tự nhận" / nhắc Bỏ ghép), không tự tính lại',
     /oThucDon\(/.test(ghep) && /khoTuNhanGiam/.test(ghep) && /khoTuNhanO/.test(ghep) && !/laMaKhoTuNhan\(/.test(ghep));
  ok('Ghép món: ngữ cảnh oThucDon có món đang dùng (monDangDung từ dangDung); nhóm Ô mã của form và ô gợi ý chỉ lấy ô của món đang dùng',
     /monDangDung: idDangDung/.test(ghep) && /const idDangDung = new Set\(dangDung\.map\(m => m\.id\)\)/.test(ghep)
     && /goiYOMa\(m, oDangDung\)/.test(ghep) && /oDangDung\.map\(o => <option value=\{`o:\$\{o\.id\}`\}/.test(ghep));
  ok('Ghép món: hiện ô xác nhận "món chung" (khong_o) và "trùng mã" (trung_ma) khi ganMaIpos đòi',
     /canXacNhanKhongO/.test(ghep) && /name="khong_o"/.test(ghep) && /canXacNhanTrungMa/.test(ghep) && /name="trung_ma"/.test(ghep));
  ok('Ghép món: mục FABi chọn nội dung bằng mucMonFabi (số món chỉ khi đọc đủ), thực đơn chưa đọc → câu "Chưa đọc được thực đơn iPOS"',
     /mucMonFabi\(/.test(ghep) && /chuaDocMenuFabi/.test(ghep) && /mucFabi\.kieu === 'co' \? ` · \$\{mucFabi\.soMon\}`/.test(ghep));
  ok('Ghép món: nút tải không dùng thuộc tính download (403 / 500 thì trình duyệt mở trang có câu lỗi, không phải "tải hỏng")',
     /href="\/noi-bo\/kho\/ban-ipos\/mon-fabi\.csv"/.test(ghep) && !/mon-fabi\.csv"[^>]*\bdownload\b/.test(ghep));
  ok('Bán hàng iPOS: hộp "Bán không biết tảng · 7 ngày" chỉ khi xem giá, nội dung chọn bằng hopKhongBietTang — trang không đọc số thẳng từ tang.dem',
     /docBanKhongBietTang\(/.test(banIpos) && /xemGia \? hopKhongBietTang\(tang, loiTang\) : null/.test(banIpos)
     && !/tang!?\.dem\b/.test(banIpos) && /NGUYEN_NHAN_KHONG_BIET_TANG/.test(banIpos));
  ok('mon-fabi.csv.ts: mở bằng moKhoTai, gọi taoTepMonFabi, tên file ASCII, no-store',
     /await moKhoTai\(/.test(route) && /taoTepMonFabi\(/.test(route) && /no-store/.test(route) && /\[\^a-zA-Z0-9\._-\]/.test(route));
  const thuNgan = doc('web/src/lib/kho/thu-ngan.ts');
  const hd = doc('web/src/lib/kho/huong-dan.ts');
  const muc = hd.slice(hd.indexOf("id: 'ban-ipos'"), hd.indexOf("id: 'duyet-huy'"));
  // Chỉ phần chữ mới (chú thích cũ của index.astro có một số tiền mẫu).
  const hopMoi = banIpos.slice(banIpos.indexOf('tangTieuDe'), banIpos.indexOf('cotLanCuoi'));
  const cam = timChuoiCam([thuNgan, ghep, hopMoi, route, muc].join('\n'));
  ok('Câu mới không chứa chữ cấm (chuoi-cam.js)', hopMoi.length > 100 && cam.length === 0, JSON.stringify(cam));
  ok('Hướng dẫn ban-ipos: cài FABi (mã món = mã vạch = mã ô, bán theo kg, cùng giá), mã giảm không ghép, quy tắc thu ngân, đổi giá sửa FABi cùng lúc, có tiếng Anh',
     /mã món = mã vạch = mã ô/.test(muc) && /mã giảm/i.test(muc) && /13 số/.test(muc) && /chọn tay/.test(muc)
     && /đổi giá/i.test(muc) && /Bán không biết tảng/.test(muc) && /13 digits/.test(muc) && /change a price/i.test(muc));
  ok('Hướng dẫn / KHO.md: lý do giữ mã giảm trừ theo hạn gần nhất (lô cận date là lô lóc sớm nhất)',
     /lóc sớm nhất/.test(muc) && /lóc sớm nhất/.test(doc('web/KHO.md')));
  // Hai mẹo trong cùng mục không được nói ngược nhau: mã món = mã ô thì KHÔNG ghép (kho tự nhận) — chỉ ghép
  // với ô khi FABi tự sinh mã khác. Và mục FABi nằm ngay trên bảng Thực đơn iPOS, không phải "cuối trang".
  const meo = [...muc.matchAll(/vi: '((?:[^'\\]|\\.)*)'/g)].map(m => m[1]);
  const meoEn = [...muc.matchAll(/en: '((?:[^'\\]|\\.)*)'/g)].map(m => m[1]);
  ok('Hướng dẫn ban-ipos: không mẹo nào vừa nói "mã món = mã ô" vừa bảo "rồi ở Ghép món chọn đúng ô" (ngược mẹo "không ghép")',
     meo.length > 5 && !meo.some(c => /mã món = mã ô/.test(c) && /rồi ở \*\*Ghép món\*\* chọn đúng ô/.test(c))
     && !meoEn.some(c => /dish code = slot code/.test(c) && /then in \*\*Match dishes\*\* choose the slot/.test(c))
     && meo.some(c => /mã món = mã ô/.test(c) && /không cần ghép/.test(c) && /FABi tự sinh mã khác/.test(c)),
     JSON.stringify(meo.filter(c => /mã ô/.test(c))));
  ok('Hướng dẫn ban-ipos: vị trí mục "Món cần có trên FABi" đúng như trang (ngay trên bảng Thực đơn iPOS), không "cuối trang"',
     !/cuối trang/.test(muc) && !/at the bottom of/.test(muc) && /ngay trên bảng \*\*Thực đơn iPOS\*\*/.test(muc) && /just above the \*\*iPOS menu\*\* table/.test(muc)
     && ghep.indexOf('id="mon-fabi"') > 0 && ghep.indexOf('id="mon-fabi"') < ghep.indexOf('id="thuc-don"'));
});

// ===========================================================================
await nhom('10 · MÃ Ô / MÃ GIẢM CỦA MÓN ĐÃ NGỪNG DÙNG (database không tự nhận — web cho ghép như mã thường)', async () => {
  // Lời gọi web còn xếp hàng từ nhóm trước (Promise.all dừng ở lần đọc hỏng đầu tiên, các lần đọc khác vẫn chạy) phải
  // xong trước khi gọi thẳng duoi() — không thì hai lời gọi chen nhau trên cùng một database PGlite.
  await hangDoi;
  const [monA, monB] = (await db.query(`select * from kho_mat_hang where loai = 'phan_cat' and dang_dung
    and ma not in ('C-THANNGOAI') and not exists (select 1 from kho_o_ma o where o.mat_hang_id = kho_mat_hang.id) order by ma limit 2`)).rows;
  await duoi(UID.qlA, `update kho_mat_hang set gia_ban_kg = 800000 where id = $1`, [monA.id]);
  const oA = await duoi(UID.qlA, `insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 1, '10031') returning id`, [monA.id]);
  const gA = await duoi(UID.qlA, `select kho_luu_ma_giam($1, 30, '90031') as v`, [monA.id]);
  const ngung = await duoi(UID.qlA, `update kho_mat_hang set dang_dung = false where id = $1`, [monA.id]);
  ok(`Dựng: ${monA.ma} có ô 1 (10031) và mã giảm 30% (90031), rồi ngừng dùng; ${monB.ma} là món thay`,
     !!monA && !!monB && oA.loi === null && gA.loi === null && ngung.loi === null, oA.loi ?? gA.loi ?? ngung.loi ?? '');
  const [dO] = await ban([{ ma: '10031', sl: 0.5 }], BAN_HOM_NAY);
  const [dG] = await ban([{ ma: '90031', sl: 0.5 }], BAN_HOM_NAY);
  ok('Bán mã 10031, 90031 (chưa ghép) → database không tự nhận: chua_khop "Chưa ghép mã iPOS với món trong kho"',
     [dO, dG].every(x => x?.trang_thai === 'chua_khop' && /Chưa ghép mã iPOS/.test(x.ly_do ?? '')), JSON.stringify([dO, dG]));

  const fd = o => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
  const ql = clientCua(UID.qlA);
  const maGhep = async ma => (await db.query(`select * from kho_ipos_ma_hang where chi_nhanh_id = $1 and ma_ipos = $2`, [cnA.id, ma])).rows;
  const dong = async id => (await db.query(`select * from kho_ipos_dong where id = $1`, [id])).rows[0];
  const kO = await ganMaIpos(ql, cnA.id, fd({ ma_ipos: '10031', mat_hang_id: monB.id, don_vi_ban: 'kg' }));
  const sauO = await dong(dO.id);
  ok(`ganMaIpos ghép 10031 với ${monB.ma} như món thường → ghi (kieu mon), dòng chưa khớp được xử lý lại theo ${monB.ma}`,
     kO.ok && (await maGhep('10031'))[0]?.kieu === 'mon' && sauO?.trang_thai !== 'chua_khop' && sauO?.mat_hang_id === monB.id,
     `${JSON.stringify(kO)} · ${sauO?.trang_thai} ${sauO?.ly_do ?? ''}`);
  const kG = await ganMaIpos(ql, cnA.id, fd({ ma_ipos: '90031', mat_hang_id: monB.id, don_vi_ban: 'kg' }));
  const sauG = await dong(dG.id);
  ok(`ganMaIpos ghép mã giảm 90031 của món đã ngừng với ${monB.ma} → ghi, dòng xử lý lại`,
     kG.ok && (await maGhep('90031'))[0]?.kieu === 'mon' && sauG?.trang_thai !== 'chua_khop' && sauG?.mat_hang_id === monB.id,
     `${JSON.stringify(kG)} · ${sauG?.trang_thai} ${sauG?.ly_do ?? ''}`);
  const kChonO = await ganMaIpos(ql, cnA.id, fd({ ma_ipos: 'O-NGHI', mat_hang_id: `o:${oA.rows[0].id}`, don_vi_ban: '' }));
  ok('Chọn ô của món đã ngừng dùng → database từ chối "Món của ô mã đã ngừng dùng", không ghi (vì vậy form chỉ liệt kê ô của món đang dùng)',
     !kChonO.ok && /Món của ô mã đã ngừng dùng/.test(kChonO.cau) && (await maGhep('O-NGHI')).length === 0, JSON.stringify(kChonO));
});

// ===========================================================================
await nhom('11 · SỔ KHO', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('Sổ kho: kho_doi_soat_ton() rỗng', rows.length === 0, JSON.stringify(rows));
});

process.exit(ketThuc('THU NGÂN / FABi'));
