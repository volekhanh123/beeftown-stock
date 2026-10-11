/**
 * BEEFTOWN — Kiểm thử: lỗi database bị bỏ qua thì trang nói sai (CLAUDE.md mục 5 mat-mang)
 * ======================================================================================
 *
 *     node test/test-mat-mang-doc-lai-web.mjs
 *
 * supabase-js KHÔNG ném lỗi khi mạng đứt: trả { data: null, error }. Code chỉ đọc `data` thì coi
 * "mạng đứt" là "không có gì" — và trang nói một câu sai sự thật:
 *
 *   1. taoPhieuXuat (chuyển ra quầy): phiếu đã ghi, rồi đọc lại trạng thái để biết hàng đã vào quầy
 *      hay đang đi đường. Đọc lại lỗi → báo "Đã chuyển … ra Quầy thịt" trong khi phiếu có thể đang
 *      `dang_chuyen` và quầy vẫn phải bấm "Đã nhận".
 *   2. moTrangKho: kho_dem_viec không trả lời, đọc dự phòng kho_cai_dat cũng lỗi → kết luận "chưa
 *      khởi tạo": trang mời "Bắt đầu dùng kho", nhap/[id] chuyển hướng bỏ mất form đang gõ.
 *   3. docBanAn (/noi-bo/cai-dat): đọc lỗi → "chưa có bàn nào" — chủ nhà hàng thêm bàn lần nữa.
 *
 * Client Supabase giả: bang[tên] = dòng trả về; loi[tên] = { message } trả về như supabase-js.
 */

import { taoBoDem } from './kho-chung.mjs';
import { taoPhieuXuat } from '../../web/src/lib/kho/xuat.ts';
import { moTrangKho } from '../../web/src/lib/kho/trang.ts';
import { docBanAn } from '../../web/src/lib/cai-dat.ts';
import { dichCau } from '../../web/src/lib/cau-noi-bo.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — LỖI DATABASE KHÔNG THÀNH CÂU SAI');

const CN = '11111111-1111-4111-8111-111111111111';
const MH = '22222222-2222-4222-8222-222222222222';
const QUAY = '33333333-3333-4333-8333-333333333333';
const KHO = '44444444-4444-4444-8444-444444444444';
const MANG_DUT = { message: 'TypeError: fetch failed' };

/** Client giả: from(bang)… và rpc(ten) đều chờ được; loi[ten] → { data: null, error }. */
function clientGia(bang, loi = {}) {
  const goi = [];
  const tra = ten => (loi[ten] ? { data: null, error: loi[ten] } : { data: bang[ten] ?? null, error: null });
  const builder = ten => {
    const b = {
      select() { return b; }, eq() { return b; }, order() { return b; }, range() { return b; }, limit() { return b; },
      maybeSingle() { return Promise.resolve(tra(ten)); },
      then(xong, hong) { return Promise.resolve(tra(ten)).then(xong, hong); },
    };
    return b;
  };
  return {
    goi,
    from(ten) { goi.push(ten); return builder(ten); },
    rpc(ten) { goi.push(ten); return builder(ten); },
    storage: { from() { return { list: async () => ({ data: [], error: null }) }; } },
  };
}

const form = (o) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };

// ===========================================================================
await nhom('1 · Chuyển ra quầy: đọc lại trạng thái lỗi → không nói "Đã chuyển"', async () => {
  const ctx = {
    loai: 'chuyen', viTriId: KHO, matHang: [{ id: MH, ten: 'Thăn ngoại', dem_goi: true, don_vi_goi: 'gói' }],
    den: { ten: 'Quầy thịt', loai: 'quay' },
  };
  const f = () => form({ ma_gui: crypto.randomUUID(), vi_tri_den_id: QUAY, so_dong: '1', d0_mat_hang: MH, d0_so_goi: '2' });
  const phieu = [{ phieu_id: '55555555-5555-4555-8555-555555555555', so_phieu: 'PX-0007', da_co: false }];

  const tot = await taoPhieuXuat(clientGia({ kho_tao_phieu_xuat: phieu, kho_phieu_xuat: { trang_thai: 'da_xong' } }), CN, f(), ctx);
  ok('Tiền đề: đọc lại được, phiếu xong → "Đã chuyển … ra Quầy thịt"', tot.ok && /^Đã chuyển .* ra Quầy thịt\.$/.test(tot.cau), tot.cau);
  const di = await taoPhieuXuat(clientGia({ kho_tao_phieu_xuat: phieu, kho_phieu_xuat: { trang_thai: 'dang_chuyen' } }), CN, f(), ctx);
  ok('Tiền đề: phiếu đang đi đường → "Đang mang … — quầy … bấm "Đã nhận""', di.ok && /^Đang mang /.test(di.cau), di.cau);

  const loi = await taoPhieuXuat(clientGia({ kho_tao_phieu_xuat: phieu }, { kho_phieu_xuat: MANG_DUT }), CN, f(), ctx);
  ok('Đọc lại lỗi: phiếu ĐÃ ghi → vẫn ok và có id (không mời gửi lại)', loi.ok === true && loi.id === phieu[0].phieu_id, JSON.stringify(loi));
  ok('…câu KHÔNG nói "Đã chuyển" / "Đang mang" (chưa biết hàng đã vào quầy chưa)', !/Đã chuyển|Đang mang/.test(loi.cau), loi.cau);
  ok('…câu nêu số phiếu và bảo mở phiếu để xem trạng thái', /PX-0007/.test(loi.cau) && /mở phiếu/i.test(loi.cau), loi.cau);
  ok('…có bản tiếng Anh', !!loi.cauEn && /PX-0007/.test(loi.cauEn) && !/Transferred/.test(loi.cauEn), loi.cauEn);
});

// ===========================================================================
await nhom('2 · moTrangKho: không đọc được cài đặt kho → KHÔNG kết luận "chưa khởi tạo"', async () => {
  const astro = client => ({
    locals: { phien: { client, nhanSu: { id: 'ns-1', vai_tro: 'quan_ly', chi_nhanh_id: CN } }, nn: 'vi' },
    cookies: { get: () => undefined, set() {}, delete() {}, has: () => false },
    url: new URL('https://beeftown.vn/noi-bo/kho/nhap/moi'),
    request: new Request('https://beeftown.vn/noi-bo/kho/nhap/moi'),
    response: { headers: new Headers() },
    redirect: (u, s) => new Response(null, { status: s, headers: { location: u } }),
  });
  const cn = [{ id: CN, ma: 'q1', ten: 'Beeftown Quận 1' }];

  const tot = await moTrangKho(astro(clientGia({ chi_nhanh: cn, kho_dem_viec: { khoi_tao: true } })));
  ok('Tiền đề: kho_dem_viec trả lời → đã khởi tạo, không lỗi', tot.daKhoiTao === true && tot.loiDoc === null);
  const chua = await moTrangKho(astro(clientGia({ chi_nhanh: cn, kho_cai_dat: null }, { kho_dem_viec: MANG_DUT })));
  ok('Tiền đề: kho_dem_viec lỗi, kho_cai_dat trả "không có dòng" → chưa khởi tạo thật', chua.daKhoiTao === false && chua.loiDoc === null);
  const coDong = await moTrangKho(astro(clientGia({ chi_nhanh: cn, kho_cai_dat: { chi_nhanh_id: CN } }, { kho_dem_viec: MANG_DUT })));
  ok('Tiền đề: kho_dem_viec lỗi, kho_cai_dat có dòng → đã khởi tạo', coDong.daKhoiTao === true);

  const loi = await moTrangKho(astro(clientGia({ chi_nhanh: cn }, { kho_dem_viec: MANG_DUT, kho_cai_dat: MANG_DUT })));
  ok('Cả hai lỗi → KHÔNG coi là "chưa khởi tạo" (không mời "Bắt đầu dùng kho", không bỏ form đang gõ)', loi.daKhoiTao === true,
     `daKhoiTao=${loi.daKhoiTao}`);
  ok('…trang có câu lỗi đọc để hiện', typeof loi.loiDoc === 'string' && /cài đặt kho/i.test(loi.loiDoc), String(loi.loiDoc));
  const a = astro(clientGia({ chi_nhanh: cn }, { kho_dem_viec: MANG_DUT, kho_cai_dat: MANG_DUT }));
  a.locals.nn = 'en';
  const en = await moTrangKho(a);
  ok('…màn tiếng Anh nhận câu tiếng Anh', /stock settings/.test(en.loiDoc ?? '') && dichCau('en', en.loiDoc) === en.loiDoc, String(en.loiDoc));
});

// ===========================================================================
await nhom('3 · docBanAn: đọc lỗi → ném (trang báo "không đọc được"), không trả "chưa có bàn"', async () => {
  const ban = [{ id: 'b1', ten: 'B01', so_cho: 4, la_phong_rieng: false, dang_dung: true }];
  const tot = await docBanAn(clientGia({ ban_an: ban }), CN);
  ok('Tiền đề: đọc được → danh sách bàn', tot.length === 1);
  let loi = null;
  try { await docBanAn(clientGia({}, { ban_an: MANG_DUT }), CN); } catch (e) { loi = e; }
  ok('Mạng đứt → ném lỗi (cai-dat.astro bắt và hiện loiDoc)', loi !== null, 'trả về danh sách rỗng');
});

process.exit(ketThuc('LỖI DATABASE KHÔNG THÀNH CÂU SAI'));
