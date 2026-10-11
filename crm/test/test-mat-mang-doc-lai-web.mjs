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
 *   5. Câu lỗi mạng: mỗi nơi chạy fetch báo một kiểu (Node "fetch failed", Bun của Beeftown Cân "Unable to
 *      connect…", trình duyệt "Failed to fetch", DNS "ENOTFOUND"). Bản chép regex sót Bun và DNS, và ba
 *      thư viện CRM không nhận lỗi mạng nào — người dùng thấy nguyên "TypeError: fetch failed".
 *   4. docBaoCao('ban'): MỌI lỗi có chữ "does not exist" (kể cả bảng / cột bên trong hàm hỏng) bị coi là
 *      "database chưa chạy 0037" → lùi về hàm cũ, báo cáo hiện số ƯỚC TÍNH thay vì báo lỗi.
 *
 * Client Supabase giả: bang[tên] = dòng trả về; loi[tên] = { message } trả về như supabase-js.
 */

import { taoBoDem } from './kho-chung.mjs';
import { taoPhieuXuat } from '../../web/src/lib/kho/xuat.ts';
import { moTrangKho } from '../../web/src/lib/kho/trang.ts';
import { docBanAn } from '../../web/src/lib/cai-dat.ts';
import { dichCau } from '../../web/src/lib/cau-noi-bo.ts';
import { docBaoCao } from '../../web/src/lib/kho/bao-cao.ts';
import { cauLoiKho, LOI_KHO_CHUNG } from '../../web/src/lib/kho/chung.ts';
import { themMotBan } from '../../web/src/lib/cai-dat.ts';
import { readFileSync } from 'node:fs';

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
      insert() { return b; }, update() { return b; }, delete() { return b; }, upsert() { return b; },
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

// ===========================================================================
await nhom('4 · Báo cáo bán: chỉ lùi về hàm cũ khi CHÍNH kho_bao_cao_ban_thuc chưa có', async () => {
  const dongCu = [{ ma_hang: 'A', doanh_thu_uoc_tinh: 100, lai_gop_uoc_tinh: 40 }];
  const thieuHam = clientGia({ kho_bao_cao_ban: dongCu }, {
    kho_bao_cao_ban_thuc: { code: 'PGRST202', message: 'Could not find the function public.kho_bao_cao_ban_thuc(p_chi_nhanh_id, p_den, p_tu) in the schema cache' },
  });
  const a = await docBaoCao(thieuHam, 'ban', CN, '2026-10-01', '2026-10-11');
  ok('Tiền đề: hàm mới chưa có (PGRST202, đúng tên) → lùi về hàm cũ, dòng ước tính', a.loi === null && a.dong.length === 1
     && thieuHam.goi.includes('kho_bao_cao_ban'), JSON.stringify(a));

  const hong = clientGia({ kho_bao_cao_ban: dongCu }, {
    kho_bao_cao_ban_thuc: { code: '42P01', message: 'relation "kho_ipos_dong_x" does not exist' },
  });
  const b = await docBaoCao(hong, 'ban', CN, '2026-10-01', '2026-10-11');
  ok('Hàm mới hỏng bên trong ("relation … does not exist") → BÁO LỖI, không lặng lẽ hiện số ước tính',
     b.loi !== null && b.dong.length === 0 && !hong.goi.includes('kho_bao_cao_ban'), JSON.stringify(b));
});

// ===========================================================================
await nhom('5 · Lỗi mạng mọi kiểu → "chưa chắc đã ghi", không lộ câu kỹ thuật tiếng Anh', async () => {
  for (const m of [
    'TypeError: fetch failed',
    'TypeError: Unable to connect. Is the computer able to access the url?',   // Bun — Beeftown Cân
    'TypeError: Failed to fetch',                                              // Chrome
    'NetworkError when attempting to fetch resource.',                         // Firefox
    'Load failed',                                                              // Safari
    'getaddrinfo ENOTFOUND abc.supabase.co',
    'connect ECONNREFUSED 127.0.0.1:443',
  ]) {
    ok(`cauLoiKho: "${m.slice(0, 40)}" → câu mất mạng`, cauLoiKho({ message: m }) === LOI_KHO_CHUNG.mang.vi, cauLoiKho({ message: m }));
  }
  ok('Câu database tiếng Việt vẫn dùng nguyên văn', cauLoiKho({ message: 'Phiếu đã được duyệt rồi' }) === 'Phiếu đã được duyệt rồi');

  const f = new FormData(); f.set('ten', 'B05'); f.set('so_cho', '4');
  const vi = await themMotBan(clientGia({}, { ban_an: MANG_DUT }), f, CN, 'vi');
  ok('/noi-bo/cai-dat thêm bàn, mạng đứt → "Chưa chắc đã ghi", không phải "TypeError: fetch failed"',
     !vi.ok && vi.cau === LOI_KHO_CHUNG.mang.vi, vi.cau);
  const en = await themMotBan(clientGia({}, { ban_an: MANG_DUT }), f, CN, 'en');
  ok('…màn tiếng Anh: câu tiếng Anh', !en.ok && en.cau === LOI_KHO_CHUNG.mang.en, en.cau);

  for (const tep of ['tin-tuyen-dung.ts', 'cong-tac.ts']) {
    const nguon = readFileSync(new URL(`../../web/src/lib/${tep}`, import.meta.url), 'utf8');
    ok(`${tep}: cauLoi nhận lỗi mạng (laLoiMang → CAU_MAT_MANG_GHI)`, /if \(laLoiMang\(m\)\) return CAU_MAT_MANG_GHI\[nn\]/.test(nguon));
  }
});

process.exit(ketThuc('LỖI DATABASE KHÔNG THÀNH CÂU SAI'));
