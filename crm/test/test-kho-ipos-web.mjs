/**
 * BEEFTOWN KHO — Kiểm thử phần WEB của đồng bộ iPOS (GĐ7a, sửa theo tài liệu thật GĐ7c)
 * ===================================================================================
 *
 *     node test/test-kho-ipos-web.mjs
 *
 * Phần database nằm ở test-kho-ipos.mjs và test-kho-ipos-callback.mjs. File này kiểm:
 *   · lib/kho/ipos.ts (thuần): phanTichCallback theo Event 11 "sale_manager" và
 *     Event 12 "item_changed" (mẫu TỰ DỰNG LẠI theo tài liệu — không token,
 *     không thông tin khách thật), bỏ thông tin khách, hai dòng cùng item_id,
 *     tran_date → +07:00; phanTichMenu theo GET /v2/items (không lấy giá);
 *   · lib/kho/ipos-hook.ts: route nhận hóa đơn — khóa sai 404, thiếu bí mật 503,
 *     body hỏng 400, quá lớn 413, event 11 → RPC đúng tham số, bắn trùng không
 *     trừ đôi, event 12 → cờ thực đơn, event khác 200, lỗi database 500;
 *   · lib/kho/ipos-dong-bo.ts: lượt cron / tay (thử lại hàng chờ + thực đơn) trên
 *     PGlite bằng client giả, fetch giả; câu lỗi không bao giờ chứa token;
 *   · src/worker.ts + wrangler.toml: /hook/ipos chặn trước Astro, scheduled, crons,
 *     không bí mật;
 *   · cả repo: không file nào chứa chuỗi giống token iPOS.
 */

import { taoBoDem, UID, UID_MAY_IPOS, themMayIpos, dungDatabase } from './kho-chung.mjs';
import {
  TRUONG_IPOS, phanTichCallback, phanTichMenu, docThoiDiem, taoUrlMenu, xoaToken, bangNhauHang, boThongTinKhach, cheKhoa,
} from '../../web/src/lib/kho/ipos.ts';
import {
  dongBoIpos, dongBoTatCa, layBiMatIpos, trangThaiBiMatIpos, cauTomTat, canDocMenu, layKhoaCallback, MENU_MOI_PHUT, quenPhienMay,
} from '../../web/src/lib/kho/ipos-dong-bo.ts';
import { xuLyHookIpos, khoaTuDuong } from '../../web/src/lib/kho/ipos-hook.ts';
import { cauSuKien } from '../../web/src/lib/kho/viec.ts';
import { docFormGhep, docFormCauHinhIpos } from '../../web/src/lib/kho/ban-ipos.ts';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ ĐỒNG BỘ iPOS (PHẦN WEB)');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Token / khóa GIẢ dựng lúc chạy — chuỗi "access_token=<dài>" không nằm nguyên văn
// trong file nào (nhóm quét repo sẽ bắt nó).
const TOKEN_GIA = ['TK', 'gia', 'Zz9', 'x7Q', 'p2L', 'm4N', 'r8'].join('');
const KHOA_GIA = ['khoa', 'Gia', 'Hook', 'Q9w8', 'E7r6', 'T5y4', 'U3i2', 'O1p0', 'Zx9'].join('');   // 34 ký tự
const TEN_TS = ['access', 'token'].join('_');
for (const k of ['IPOS_ACCESS_TOKEN', 'KHO_IPOS_EMAIL', 'KHO_IPOS_MAT_KHAU', 'IPOS_CALLBACK_KHOA']) delete process.env[k];
const ENV = {
  IPOS_ACCESS_TOKEN: TOKEN_GIA, KHO_IPOS_EMAIL: 'may-ipos@beeftown.test', KHO_IPOS_MAT_KHAU: 'mat-khau-gia-1234',
  IPOS_CALLBACK_KHOA: KHOA_GIA,
};

// ---------------------------------------------------------------------------
// MẪU TỰ DỰNG theo tài liệu (mục 6.1 Event 11, mục 1 /v2/items). Thông tin khách
// là giá trị giả, có mặt để kiểm chúng bị bỏ.
// ---------------------------------------------------------------------------
const SDT_GIA = '0900111222';
const DIA_CHI_GIA = '12 đường Thử Nghiệm';
const POS_PARENT = 'BEEFTEST';
const POS_ID = 5898;
const gioVn = n => new Date(Date.now() + 7 * 3600000 - n * 60000).toISOString().slice(0, 19).replace('T', ' ');

function event11(tranId, items, { phutTruoc = 20, posParent = POS_PARENT, posId = POS_ID, them = {} } = {}) {
  return {
    event_id: 11, event: 'sale_manager', timestamp: String(Date.now()),
    sale_manager: {
      pos_name: 'Beeftown thử', pos_type: 'ipos_pc',
      channels: [{ channel: 'voucher', source: '10000007' }],
      pos_parent: posParent, pos_id: posId, tran_id: String(tranId), tran_no: 'TA' + tranId,
      tran_date: gioVn(phutTruoc), created_at: gioVn(phutTruoc - 1),
      discount_extra: 0, discount_extra_amount: 0, service_charge: 0, service_charge_amount: 0,
      coupon_amount: 0, ship_fee_amount: 0, discount_amount_on_item: 0,
      original_amount: 200000, vat_amount: 0, bill_amount: 200000, total_amount: 200000,
      membership_name: 'KHACH GIA', membership_id: SDT_GIA, sale_note: 'ghi chú khách',
      sale_type: 'TA', hour: 12, pos_city: 129, pos_district: 12904,
      items: items.map(it => ({ item_id: it.item_id, item_name: it.item_name ?? `Món ${it.item_id}`, price: 100000,
                                quantity: it.quantity, amount: it.amount ?? 100000, discount_amount: 0 })),
      payment_info: [{ tran_id: 'PAY' + tranId, method_id: 'CASH', name: 'CASH', currency: 'VND', amount: 200000, trace_no: '' }],
      delivery_info: { order_code: 'X1', address: DIA_CHI_GIA, lng: 0, lat: 0 },
      ...them,
    },
  };
}
const EV12 = { event_id: 12, event: 'item_changed', timestamp: '1575953471216',
  item_changed: { Id: 'x', pos_parent: POS_PARENT, pos_id: POS_ID, last_changed: '2026-09-25 11:49:54', reversion: 1, changed: 1 } };
const MENU = {
  data: {
    pos_parent: { id: POS_PARENT, name: 'Beeftown thử' },
    item_types: [{ id: 'THIT', name: 'Thịt bò quầy' }, { id: 'BEP', name: 'Món bếp' }],
    items: [
      { id: 1, name: 'Ba chỉ bò Mỹ', ta_price: 300000, ots_price: 300000, store_item_id: 'BACHI', type_id: 'THIT', status: 'ACTIVE' },
      { id: 2, name: 'Phở bò tái', ta_price: 70000, ots_price: 70000, store_item_id: 'PHO', type_id: 'BEP', status: 'OUT_OF_STOCK',
        childs: [{ id: 3, name: 'Phở bò tái lớn', ta_price: 90000, store_item_id: 'PHO-L', type_id: 'BEP', status: 'ACTIVE' }] },
      { id: 4, name: 'Món cũ', ta_price: 1000, store_item_id: 'CU', type_id: 'KHAC', status: 'DEACTIVE' },
      { id: 5, name: 'Không mã', ta_price: 1 },
      { id: 6, name: 'Ba chỉ trùng mã', store_item_id: 'BACHI' },
    ],
  },
};

// ===========================================================================
await nhom('1 · phanTichCallback: EVENT 11 THEO TÀI LIỆU', async () => {
  const ev = event11('T100', [{ item_id: 'BACHI', quantity: 0.45 }, { item_id: 'BACHI', quantity: 0.45 }, { item_id: 'PHO', quantity: 2, amount: '140000' }]);
  const kq = phanTichCallback(ev);
  ok('Event 11 → loai hoa_don, đọc pos_parent / pos_id (số → chữ)', kq.loai === 'hoa_don' && kq.posParent === POS_PARENT
     && kq.posId === String(POS_ID), JSON.stringify(kq).slice(0, 200));
  const h = kq.hoaDon;
  ok('ma_hd = "<pos_id>:<tran_id>"', h.ma_hd === `${POS_ID}:T100`, h.ma_hd);
  ok('tran_date giờ VN không múi → +07:00', h.thoi_diem_ban === ev.sale_manager.tran_date.replace(' ', 'T') + '+07:00', h.thoi_diem_ban);
  ok('Hai dòng cùng item_id là HAI dòng, khoa_dong = chỉ số (từ 0)', h.dong.length === 3
     && h.dong.map(d => d.khoa_dong).join() === '0,1,2' && h.dong[0].ma_ipos === 'BACHI' && h.dong[1].ma_ipos === 'BACHI',
     JSON.stringify(h.dong));
  ok('Dòng: so_luong = quantity, thanh_tien = amount (chuỗi → số), ten_ipos = item_name, không kg / gói / mã vạch',
     h.dong[0].so_luong === 0.45 && h.dong[2].so_luong === 2 && h.dong[2].thanh_tien === 140000 && h.dong[0].ten_ipos === 'Món BACHI'
     && h.dong.every(d => d.so_kg === undefined && d.so_goi === undefined && d.ma_vach === undefined), JSON.stringify(h.dong));
  ok('Không có cờ hủy → da_huy false', h.da_huy === false);
  const r = JSON.stringify(h.raw);
  ok('raw BỎ membership_*, delivery_info, payment_info, sale_note (không số điện thoại, không địa chỉ)',
     !r.includes(SDT_GIA) && !r.includes(DIA_CHI_GIA) && !/membership|delivery|payment|sale_note|KHACH GIA/.test(r), r.slice(0, 300));
  ok('raw giữ phần hóa đơn (tran_id, tran_no, items)', h.raw.tran_id === 'T100' && h.raw.tran_no === 'TAT100' && Array.isArray(h.raw.items));
  ok('Không cảnh báo khi đủ trường', kq.canhBao.length === 0, kq.canhBao.join());

  const huy = phanTichCallback(event11('T101', [], { them: { status: 'CANCELLED' } }));
  ok('Cờ hủy đọc mềm (status "CANCELLED") → da_huy', huy.loai === 'hoa_don' && huy.hoaDon.da_huy === true);
  const huy2 = phanTichCallback(event11('T102', [], { them: { is_cancel: 0, status: 'done' } }));
  ok('is_cancel 0 / status "done" → không hủy; items rỗng → 0 dòng', huy2.hoaDon.da_huy === false && huy2.hoaDon.dong.length === 0);

  const thieuSl = phanTichCallback(event11('T103', [{ item_id: 'A', quantity: 'abc' }, { item_name: 'x', quantity: 1 }]));
  ok('Dòng thiếu item_id / quantity sai → vẫn nhận, cảnh báo chỉ tên khóa', thieuSl.loai === 'hoa_don'
     && thieuSl.hoaDon.dong[0].so_luong === undefined && thieuSl.hoaDon.dong[1].ma_ipos === undefined
     && /item_id/.test(thieuSl.canhBao.join()) && /quantity/.test(thieuSl.canhBao.join()) && !/abc/.test(thieuSl.canhBao.join()),
     thieuSl.canhBao.join());

  const tt = (x) => { const e = event11('T9', []); Object.assign(e.sale_manager, x); return phanTichCallback(e); };
  const k1 = tt({ tran_id: '' });
  ok('Thiếu tran_id → loi, câu nói tên khóa', k1.loai === 'loi' && /tran_id/.test(k1.cau), JSON.stringify(k1));
  const k2 = tt({ tran_date: 'hôm qua', created_at: null });
  ok('Giờ không đọc được → loi, câu không chứa giá trị', k2.loai === 'loi' && /tran_date/.test(k2.cau) && !/hôm qua/.test(k2.cau), k2.cau);
  const k3 = tt({ tran_date: null });
  ok('Thiếu tran_date → dùng created_at', k3.loai === 'hoa_don' && /\+07:00$/.test(k3.hoaDon.thoi_diem_ban));
  ok('items không phải danh sách → loi', tt({ items: { a: 1 } }).loai === 'loi');
  ok('Thiếu sale_manager → loi', phanTichCallback({ event_id: 11 }).loai === 'loi');
  ok('event_id dạng chuỗi "11" vẫn nhận', phanTichCallback({ ...ev, event_id: '11' }).loai === 'hoa_don');

  const m12 = phanTichCallback(EV12);
  ok('Event 12 item_changed → menu_doi + pos', m12.loai === 'menu_doi' && m12.posParent === POS_PARENT && m12.posId === String(POS_ID));
  ok('Event 12 thiếu item_changed → loi', phanTichCallback({ event_id: 12 }).loai === 'loi');
  const k10 = phanTichCallback({ event_id: 10, event: 'membership_log', membership_log: { phone: SDT_GIA } });
  ok('Event khác (10 membership_log) → khac, không đọc gì', k10.loai === 'khac' && k10.eventId === 10 && !JSON.stringify(k10).includes(SDT_GIA));
  ok('Không phải object → loi', phanTichCallback(null).loai === 'loi' && phanTichCallback([1]).loai === 'loi' && phanTichCallback('x').loai === 'loi');
});

// ===========================================================================
await nhom('2 · phanTichMenu: GET /v2/items, KHÔNG LẤY GIÁ', async () => {
  const m = phanTichMenu(MENU);
  ok('Đọc món + món con (childs); mã trùng lấy lần đầu; món thiếu mã bị bỏ', m.loi === null
     && m.mon.map(x => x.ma_ipos).join() === 'BACHI,PHO,PHO-L,CU' && /1 món thiếu/.test(m.canhBao.join()), JSON.stringify(m));
  ok('ma_ipos = store_item_id; tên; nhóm theo item_types', m.mon[0].ten_ipos === 'Ba chỉ bò Mỹ' && m.mon[0].loai === 'Thịt bò quầy'
     && m.mon[2].loai === 'Món bếp' && m.mon[3].loai === 'KHAC');
  ok('status DEACTIVE → ngừng bán; OUT_OF_STOCK vẫn là món đang có', m.mon[3].dang_ban === false && m.mon[1].dang_ban === true);
  ok('KHÔNG có giá trong kết quả (ta_price / ots_price / price)', !/price|gia|300000|70000/.test(JSON.stringify(m.mon)), JSON.stringify(m.mon));
  const loi = phanTichMenu({ error: { message: 'input params missing or PosParent denied', code: 100 } });
  ok('iPOS báo lỗi → loi có mã, không chép câu của iPOS', loi.mon.length === 0 && /mã 100/.test(loi.loi) && !/PosParent/.test(loi.loi), loi.loi);
  ok('Không có items → loi', phanTichMenu({ data: { foo: 1 } }).loi !== null && phanTichMenu(null).loi !== null);
  ok('items ở tầng ngoài cũng đọc được', phanTichMenu({ items: [{ item_id: 'X', name: 'x' }] }).mon[0]?.ma_ipos === 'X');
});

// ===========================================================================
await nhom('3 · HÀM NHỎ: GIỜ, URL, TOKEN, KHÓA, FORM', async () => {
  const chuong = so => cauSuKien({ khoa: 'ipos_mat_ket_noi', nhom: 'he_thong', ref_id: null, ref2: null, ma: null, ten: null,
    phu: 'cham', so, luc: '' });
  ok('Chuông mất kết nối: chưa nhận hóa đơn nào (so = null) → nói "chưa nhận", không bịa giờ',
     /Chưa nhận được hóa đơn nào/.test(chuong(null).chiTiet ?? '') && !/trước\./.test(chuong(null).chiTiet ?? ''), chuong(null).chiTiet);
  ok('Chuông mất kết nối: 200 phút → "3 giờ trước"', /Hóa đơn cuối nhận được: 3 giờ trước/.test(chuong(200).chiTiet ?? ''), chuong(200).chiTiet);
  ok('docThoiDiem: ISO có Z giữ nguyên', docThoiDiem('2026-09-25T16:50:00Z') === '2026-09-25T16:50:00.000Z');
  ok('docThoiDiem: "YYYY-MM-DD HH:mm:ss" → +07:00', docThoiDiem('2017-11-03 16:51:00') === '2017-11-03T16:51:00+07:00');
  ok('docThoiDiem: rác → null', docThoiDiem('abc') === null && docThoiDiem('2026-13-45 99:00:00') === null && docThoiDiem({}) === null);

  const url = taoUrlMenu({ api_url: 'https://apitest.foodbook.vn/ipos/ws/xpartner/', pos_parent: POS_PARENT, pos_id: '5898' }, TOKEN_GIA);
  const u = new URL(url);
  ok('URL thực đơn: {api_url}/v2/items?access_token&pos_parent&pos_id&menu_type=DELI', u.pathname === '/ipos/ws/xpartner/v2/items'
     && u.searchParams.get(TEN_TS) === TOKEN_GIA && u.searchParams.get('pos_parent') === POS_PARENT
     && u.searchParams.get('pos_id') === '5898' && u.searchParams.get('menu_type') === 'DELI', url.replace(TOKEN_GIA, '***'));
  ok('api_url trống → máy thử của iPOS', taoUrlMenu({ api_url: '', pos_parent: 'a', pos_id: '1' }, 'x').startsWith(TRUONG_IPOS.apiThu));

  const x1 = xoaToken(`GET ${url} failed`, TOKEN_GIA);
  ok('xoaToken: bỏ token khỏi URL', !x1.includes(TOKEN_GIA) && x1.includes(`${TEN_TS}=***`), x1);
  ok('xoaToken: không biết token vẫn xóa "access_token=…"', !/Q{30}/.test(xoaToken(`${TEN_TS}=${'Q'.repeat(30)}`)));
  ok('bangNhauHang: đúng / sai / khác độ dài / rỗng', bangNhauHang(KHOA_GIA, KHOA_GIA) && !bangNhauHang(KHOA_GIA, KHOA_GIA + 'x')
     && !bangNhauHang(KHOA_GIA, KHOA_GIA.slice(0, -1) + 'Z') && !bangNhauHang('', KHOA_GIA) && !bangNhauHang(KHOA_GIA, ''));
  ok('cheKhoa không lộ ký tự nào', !cheKhoa(KHOA_GIA).includes(KHOA_GIA.slice(0, 3)) && cheKhoa(undefined) === '');
  ok('boThongTinKhach: mọi tầng', JSON.stringify(boThongTinKhach({ a: [{ customer_phone: 1, x: { email: 'e', ok: 1 } }] })) === '{"a":[{"x":{"ok":1}}]}');
  ok('khoaTuDuong: /hook/ipos/<khóa>[/], không nhận đường dẫn con', khoaTuDuong(`/hook/ipos/${KHOA_GIA}`) === KHOA_GIA
     && khoaTuDuong(`/hook/ipos/${KHOA_GIA}/`) === KHOA_GIA && khoaTuDuong('/hook/ipos/') === null
     && khoaTuDuong('/hook/ipos/a/b') === null && khoaTuDuong('/noi-bo') === null);

  const bayGio = Date.now();
  ok('canDocMenu: chưa đọc / iPOS báo đổi / quá 1 giờ → đọc; vừa đọc → không', canDocMenu({}) && canDocMenu({ menu_luc: new Date(bayGio).toISOString(), menu_can_lam_moi: true })
     && canDocMenu({ menu_luc: new Date(bayGio - MENU_MOI_PHUT * 60000 - 1000).toISOString() }, bayGio)
     && !canDocMenu({ menu_luc: new Date(bayGio - 60000).toISOString() }, bayGio));
  ok('cauTomTat dễ đọc', /thử lại 3 dòng đang chờ: 2 đã trừ kho, 1 vẫn chờ xử lý, thực đơn iPOS 5 món/.test(cauTomTat(
    { hd_moi: 0, hd_trung: 0, hd_sua: 0, hd_huy: 0, hd_loi: 0, so_dong: 0, dong: { da_ghi: 2, thieu_hang: 1, loi: 0 } },
    { so_mon: 5, moi: 0, bo: 0, dat_ten: 0 })) && /không có dòng nào đang chờ/.test(cauTomTat(undefined)));

  const f = o => { const fd = new FormData(); for (const [k, v] of Object.entries(o)) fd.set(k, v); return fd; };
  const MH = '11111111-1111-4111-8111-111111111111';
  const g1 = docFormGhep(f({ ma_ipos: 'BACHI', mat_hang_id: MH, don_vi_ban: 'kg' }));
  ok('Ghép: món kho + bán theo kg', g1.ghep?.kieu === 'mon' && g1.ghep.matHang === MH && g1.ghep.donVi === 'kg' && g1.ghep.kgMoiDonVi === null);
  const g2 = docFormGhep(f({ ma_ipos: 'PHO', mat_hang_id: '', don_vi_ban: 'suat' }));
  ok('Ghép: bán theo suất không cần món kho → bo_qua + suat', g2.ghep?.kieu === 'bo_qua' && g2.ghep.donVi === 'suat' && g2.ghep.matHang === null);
  const g3 = docFormGhep(f({ ma_ipos: 'G', mat_hang_id: MH, don_vi_ban: 'goi', kg_moi_don_vi: '0,5' }));
  ok('Ghép: bán theo gói + "mỗi gói = 0,5 kg"', g3.ghep?.donVi === 'goi' && g3.ghep.kgMoiDonVi === 0.5);
  ok('Ghép: mỗi gói sai (0, chữ) → lỗi', docFormGhep(f({ ma_ipos: 'G', mat_hang_id: MH, don_vi_ban: 'goi', kg_moi_don_vi: '0' })).loi !== null
     && docFormGhep(f({ ma_ipos: 'G', mat_hang_id: MH, don_vi_ban: 'goi', kg_moi_don_vi: 'abc' })).loi !== null);
  ok('Ghép: kg_moi_don_vi bị bỏ khi không bán theo gói', docFormGhep(f({ ma_ipos: 'G', mat_hang_id: MH, don_vi_ban: 'kg', kg_moi_don_vi: '2' })).ghep?.kgMoiDonVi === null);
  ok('Ghép: chưa chọn món (không phải suất) → lỗi; bán theo lạ → lỗi', docFormGhep(f({ ma_ipos: 'G', mat_hang_id: '' })).loi !== null
     && docFormGhep(f({ ma_ipos: 'G', mat_hang_id: MH, don_vi_ban: 'lit' })).loi !== null);
  ok('Ghép: bỏ ghép / không phải hàng kho', docFormGhep(f({ ma_ipos: 'G', mat_hang_id: 'bo_ghep', don_vi_ban: 'kg' })).ghep?.kieu === null
     && docFormGhep(f({ ma_ipos: 'G', mat_hang_id: 'bo_qua', don_vi_ban: 'kg' })).ghep?.donVi === null);

  const ch = docFormCauHinhIpos(f({ bat: 'co', pos_parent: POS_PARENT, pos_id: '5898', gio_mo_cua: '9', gio_dong_cua: '22', gio_mat_ket_noi: '4',
    duong_dan_hoa_don: '/khong-dung' }));
  ok('Form cấu hình: có gio_mat_ket_noi, KHÔNG gửi đường dẫn lấy hóa đơn nữa', ch.cauHinh?.gio_mat_ket_noi === 4
     && !('duong_dan_hoa_don' in (ch.cauHinh ?? {})), JSON.stringify(ch));
  ok('Form cấu hình: gio_mat_ket_noi ngoài 1–12 → lỗi', docFormCauHinhIpos(f({ gio_mat_ket_noi: '13' })).loi !== null);
  ok('Form cấu hình: dán token → từ chối', /token/i.test(docFormCauHinhIpos(f({ pos_id: `x${TEN_TS}` })).loi ?? ''));

  const nguon = readFileSync(join(GOC, 'web/src/lib/kho/ipos.ts'), 'utf8');
  ok('ipos.ts thuần: không import gì', ![...nguon.matchAll(/^import /gm)].length);
  ok('TRUONG_IPOS ghi nguồn tài liệu Postman', /IPOS HUB API INTERGRATION FOR MERCHANT[\s\S]{0,4000}export const TRUONG_IPOS/.test(nguon)
     && /IPOS HUB API INTERGRATION FOR MERCHANT/.test(TRUONG_IPOS.nguon));
});

// ===========================================================================
// Client Supabase GIẢ trên PGlite: rpc(tên, {p_…}) → select tên(p_… => $n)
// dưới danh nghĩa một người. Ghi lại mọi lời gọi để kiểm.
const { db, cnA, cnB, duoi } = await dungDatabase();
function clientGia(uid, { matKhauDung = ENV.KHO_IPOS_MAT_KHAU } = {}) {
  const goi = [];
  let dangNhap = uid;
  return {
    goi,
    rpc: async (ten, thamSo = {}) => {
      goi.push({ ten, thamSo: structuredClone(thamSo) });
      const k = Object.keys(thamSo);
      const r = await duoi(dangNhap, `select ${ten}(${k.map((x, i) => `${x} => $${i + 1}`).join(', ')}) as kq`,
        k.map(x => (thamSo[x] !== null && typeof thamSo[x] === 'object') ? JSON.stringify(thamSo[x]) : thamSo[x]));
      return r.loi ? { data: null, error: { message: r.loi } } : { data: r.rows[0].kq, error: null };
    },
    auth: {
      signInWithPassword: async ({ password }) => password === matKhauDung
        ? { data: { session: { access_token: 'x' } }, error: null }
        : (dangNhap = null, { data: { session: null }, error: { message: 'Invalid login credentials' } }),
      signOut: async () => { goi.push({ ten: 'signOut' }); return { error: null }; },
    },
  };
}
/** fetch giả: trả JSON thực đơn, ghi lại URL. */
function fetchGia(body = MENU, status = 200) {
  const url = [];
  const f = async u => {
    url.push(String(u));
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  };
  f.url = url;
  return f;
}
const MAY = UID_MAY_IPOS.mayIposA;
const log = [];
const ghiLog = c => log.push(c);
const yeuCau = (body, { method = 'POST', loai = 'application/json', dai } = {}) => new Request('https://beeftown.vn/hook/ipos/x', {
  method, body: method === 'GET' ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
  headers: { 'content-type': loai, ...(dai ? { 'content-length': String(dai) } : {}) },
});
const hook = async (body, { khoa = KHOA_GIA, env = ENV, client, ...tuy } = {}) => {
  const c = client ?? clientGia(MAY);
  const res = await xuLyHookIpos(yeuCau(body, tuy), khoa, { env, taoClient: () => c, ghiLog });
  let json = null;
  try { json = await res.json(); } catch { /* không JSON */ }
  return { status: res.status, json, goi: c.goi };
};

await nhom('4 · ROUTE /hook/ipos: KHÓA, BODY, EVENT 11 / 12 / KHÁC', async () => {
  await themMayIpos(db, cnA, cnB);
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  const viTriQuay = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'quay'`, [cnA.id])).rows[0].id;

  ok('GET → 405', (await hook(null, { method: 'GET' })).status === 405);
  const r503 = await hook(event11('A1', []), { env: { ...ENV, IPOS_CALLBACK_KHOA: undefined } });
  ok('Thiếu bí mật IPOS_CALLBACK_KHOA → 503 "chưa cài", không gọi database', r503.status === 503
     && /IPOS_CALLBACK_KHOA/.test(r503.json?.loi) && r503.goi.length === 0, JSON.stringify(r503));
  ok('Khóa cài quá ngắn (< 32 ký tự) → 503', (await hook(event11('A1', []), { khoa: 'ngan', env: { ...ENV, IPOS_CALLBACK_KHOA: 'ngan' } })).status === 503);
  const sai = await hook(event11('A1', []), { khoa: KHOA_GIA.slice(0, -1) + 'X' });
  ok('Khóa sai → 404, không gọi database', sai.status === 404 && sai.goi.length === 0);
  ok('Khóa rỗng → 404', (await hook(event11('A1', []), { khoa: '' })).status === 404);
  ok('JSON hỏng → 400', (await hook('{không phải json')).status === 400);
  ok('Body > 256KB → 413', (await hook('x'.repeat(TRUONG_IPOS.bodyToiDa + 10))).status === 413);
  ok('content-length khai > 256KB → 413 (không đọc body)', (await hook('{}', { dai: TRUONG_IPOS.bodyToiDa + 1 })).status === 413);
  const khac = await hook({ event_id: 10, membership_log: { phone: SDT_GIA } });
  ok('Event khác → 200 bỏ qua, không đăng nhập máy, không gọi database', khac.status === 200 && khac.json?.bo_qua === true && khac.goi.length === 0);
  const hong = await hook({ event_id: 11, sale_manager: { pos_parent: POS_PARENT } });
  ok('Event 11 thiếu tran_id → 400', hong.status === 400 && /tran_id/.test(hong.json?.loi), JSON.stringify(hong.json));

  const chuaCn = await hook(event11('A1', [{ item_id: 'BACHI', quantity: 1 }]));
  ok('Chưa có chi nhánh khớp pos → 202 + log cảnh báo, không nhận', chuaCn.status === 202
     && chuaCn.goi.map(g => g.ten).join() === 'kho_ipos_tim_chi_nhanh,signOut' && /không có chi nhánh nào khớp/.test(log.at(-1)), log.at(-1));

  const luu = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb) as v`, [cnA.id, JSON.stringify({
    bat: true, pos_parent: POS_PARENT, pos_id: String(POS_ID), vi_tri_ban_id: viTriQuay })]);
  ok('Chủ bật kết nối iPOS chi nhánh A (không cần đường dẫn hóa đơn)', luu.loi === null && luu.rows[0].v.cau_hinh_du === true, luu.loi ?? '');

  const ev = event11('A2', [{ item_id: 'BACHI', quantity: 0.45 }, { item_id: 'BACHI', quantity: 0.3 }, { item_id: 'PHO', quantity: 2 }]);
  const r1 = await hook(JSON.stringify(ev), { loai: 'text/plain' });
  ok('Event 11 (kể cả "text/plain") → 200 {"ok":true}', r1.status === 200 && r1.json?.ok === true, JSON.stringify(r1));
  const tim = r1.goi.find(g => g.ten === 'kho_ipos_tim_chi_nhanh');
  const nhan = r1.goi.find(g => g.ten === 'kho_ipos_nhan_callback');
  ok('Gọi kho_ipos_tim_chi_nhanh(pos_parent, pos_id) rồi kho_ipos_nhan_callback(chi nhánh, HĐ) rồi đăng xuất',
     tim?.thamSo.p_pos_parent === POS_PARENT && tim?.thamSo.p_pos_id === String(POS_ID)
     && nhan?.thamSo.p_chi_nhanh_id === cnA.id && r1.goi.at(-1).ten === 'signOut', JSON.stringify(r1.goi.map(g => g.ten)));
  const p = nhan?.thamSo.p_hoa_don ?? {};
  ok('Tham số HĐ: ma_hd, 3 dòng so_luong, không thông tin khách', p.ma_hd === `${POS_ID}:A2` && p.dong?.length === 3
     && p.dong.map(d => d.so_luong).join() === '0.45,0.3,2' && !JSON.stringify(p).includes(SDT_GIA)
     && !JSON.stringify(p).includes(DIA_CHI_GIA), JSON.stringify(p).slice(0, 300));
  const { rows: [hd] } = await db.query(`select h.raw::text as raw, (select count(*)::int from kho_ipos_dong d where d.hoa_don_id = h.id) as n
    from kho_ipos_hoa_don h where h.chi_nhanh_id = $1 and h.ma_hd = $2`, [cnA.id, `${POS_ID}:A2`]);
  ok('Database: HĐ vào hộp thư, 3 dòng, raw không số điện thoại / địa chỉ', hd?.n === 3 && !hd.raw.includes(SDT_GIA) && !hd.raw.includes(DIA_CHI_GIA));

  const r2 = await hook(ev);
  const dem = (await db.query(`select count(*)::int as n from kho_ipos_dong where chi_nhanh_id = $1`, [cnA.id])).rows[0].n;
  ok('Hub bắn TRÙNG → 200, không thêm dòng nào', r2.status === 200 && dem === 3, String(dem));

  const r12 = await hook(EV12);
  const { rows: [cf] } = await db.query(`select menu_can_lam_moi, nhan_hd_luc from kho_ipos_cau_hinh where chi_nhanh_id = $1`, [cnA.id]);
  ok('Event 12 → kho_ipos_bao_menu_doi → cờ "thực đơn cần làm mới", 200', r12.status === 200
     && r12.goi.some(g => g.ten === 'kho_ipos_bao_menu_doi' && g.thamSo.p_chi_nhanh_id === cnA.id) && cf.menu_can_lam_moi === true);
  ok('nhan_hd_luc đã có (lần nhận hóa đơn gần nhất)', cf.nhan_hd_luc !== null);

  const khongMay = await hook(event11('A3', []), { env: { ...ENV, KHO_IPOS_MAT_KHAU: undefined } });
  ok('Thiếu tài khoản máy → 503', khongMay.status === 503 && khongMay.goi.length === 0);
  const saiMk = await hook(event11('A3', []), { client: clientGia(MAY, { matKhauDung: 'khac' }) });
  ok('Máy sai mật khẩu → 503, không gọi RPC', saiMk.status === 503 && saiMk.goi.length === 0);
  const clientLoi = { goi: [], rpc: async (ten) => ten === 'kho_ipos_tim_chi_nhanh' ? { data: cnA.id, error: null }
      : { data: null, error: { message: 'connection reset' } },
    auth: { signInWithPassword: async () => ({ data: { session: {} }, error: null }), signOut: async () => ({}) } };
  ok('Lỗi database khi nhận → 500 (để Hub thử lại)', (await hook(event11('A4', []), { client: clientLoi })).status === 500);
  const mayB = await hook(event11('A5', []), { client: clientGia(UID_MAY_IPOS.mayIposB) });
  ok('Máy chi nhánh B không tìm thấy chi nhánh A → 202, không ghi', mayB.status === 202
     && !(await db.query(`select 1 from kho_ipos_hoa_don where ma_hd = $1`, [`${POS_ID}:A5`])).rows.length);

  // Dùng lại phiên máy giữa các callback (tránh giới hạn đăng nhập Supabase Auth).
  const demDN = { vao: 0, ra: 0 };
  const taoNho = (hetGiay) => {
    const c = clientGia(MAY);
    c.auth.signInWithPassword = async () => { demDN.vao++; return { data: { session: { access_token: 'x', expires_at: hetGiay } }, error: null }; };
    c.auth.signOut = async () => { demDN.ra++; return { error: null }; };
    return c;
  };
  const conHan = Math.floor(Date.now() / 1000) + 3600;
  const cNho = taoNho(conHan);
  const goiNho = async (ma) => (await xuLyHookIpos(yeuCau(event11(ma, [])), KHOA_GIA,
    { env: ENV, taoClient: () => cNho, ghiLog, nhoPhien: true })).status;
  const s1 = await goiNho('N1'); const s2 = await goiNho('N2'); const s3 = await goiNho('N3');
  ok('Nhớ phiên: 3 callback liền → đăng nhập 1 lần, không đăng xuất', s1 === 200 && s2 === 200 && s3 === 200
     && demDN.vao === 1 && demDN.ra === 0, JSON.stringify({ s1, s2, s3, ...demDN }));
  quenPhienMay();
  const cSapHet = taoNho(Math.floor(Date.now() / 1000) + 60);
  demDN.vao = 0; demDN.ra = 0;
  const goiSapHet = async (ma) => (await xuLyHookIpos(yeuCau(event11(ma, [])), KHOA_GIA,
    { env: ENV, taoClient: () => cSapHet, ghiLog, nhoPhien: true })).status;
  await goiSapHet('N4'); await goiSapHet('N5');
  ok('Phiên sắp hết hạn (< 2 phút) → đăng nhập lại, đăng xuất phiên cũ', demDN.vao === 2 && demDN.ra === 1, JSON.stringify(demDN));
  quenPhienMay();

  const tatCa = log.join('\n');
  ok('Log không chứa khóa, token, mật khẩu, số điện thoại / địa chỉ khách', !tatCa.includes(KHOA_GIA) && !tatCa.includes(TOKEN_GIA)
     && !tatCa.includes(ENV.KHO_IPOS_MAT_KHAU) && !tatCa.includes(SDT_GIA) && !tatCa.includes(DIA_CHI_GIA), tatCa.slice(0, 400));

  const route = readFileSync(join(GOC, 'web/src/pages/hook/ipos/[khoa].ts'), 'utf8');
  ok('Route web/src/pages/hook/ipos/[khoa].ts: ngoài /noi-bo, gọi xuLyHookIpos, không gọi database trực tiếp',
     /export const ALL/.test(route) && /xuLyHookIpos\(/.test(route) && !/\.rpc\(|\.from\(/.test(route) && /prerender = false/.test(route));
});

// ===========================================================================
await nhom('5 · dongBoIpos: THỬ LẠI HÀNG CHỜ + THỰC ĐƠN (PGlite)', async () => {
  await db.query(`update kho_ipos_lan_chay set bat_dau_luc = bat_dau_luc - interval '5 minutes'`);
  const may = clientGia(MAY);
  const f = fetchGia();
  const k1 = await dongBoIpos({ supabase: may, chiNhanhId: cnA.id, nguon: 'cron', env: ENV, fetchFn: f });
  ok('Lượt cron: ok, đọc thực đơn (iPOS vừa báo đổi)', k1.ok === true && k1.menu?.so_mon === 4, JSON.stringify(k1).slice(0, 300));
  ok('Thứ tự: bat_dau → nhan([]) → luu_menu → ket_thuc(null)', may.goi.map(g => g.ten).join() ===
     'kho_ipos_bat_dau,kho_ipos_nhan,kho_ipos_luu_menu,kho_ipos_ket_thuc'
     && JSON.stringify(may.goi[1].thamSo.p_hoa_don) === '[]' && may.goi[1].thamSo.p_den_luc === null && may.goi[3].thamSo.p_loi === null);
  ok('Thực đơn gửi database không có giá', !/price|300000/.test(JSON.stringify(may.goi[2].thamSo.p_mon)));
  ok('Gọi iPOS đúng 1 lần, URL mang token chỉ trong fetch', f.url.length === 1 && f.url[0].includes(TOKEN_GIA) && /\/v2\/items\?/.test(f.url[0]));
  const { rows: menu } = await db.query(`select * from kho_ipos_menu where chi_nhanh_id = $1 order by ma_ipos`, [cnA.id]);
  const { rows: [cf] } = await db.query(`select * from kho_ipos_cau_hinh where chi_nhanh_id = $1`, [cnA.id]);
  ok('kho_ipos_menu có 4 món, cờ thực đơn tắt, menu_luc có', menu.length === 4 && cf.menu_can_lam_moi === false && cf.menu_luc !== null
     && cf.dang_chay_tu === null && cf.lan_cuoi_loi === null, JSON.stringify(cf).slice(0, 200));

  await db.query(`update kho_ipos_lan_chay set bat_dau_luc = bat_dau_luc - interval '5 minutes'`);
  const f2 = fetchGia();
  const may2 = clientGia(MAY);
  const k2 = await dongBoIpos({ supabase: may2, chiNhanhId: cnA.id, nguon: 'cron', env: ENV, fetchFn: f2 });
  ok('Lượt cron kế tiếp (thực đơn còn mới) → KHÔNG gọi iPOS, chỉ thử lại hàng chờ', k2.ok && f2.url.length === 0
     && !may2.goi.some(g => g.ten === 'kho_ipos_luu_menu'), JSON.stringify(k2));

  await db.query(`update kho_ipos_lan_chay set bat_dau_luc = bat_dau_luc - interval '5 minutes'`);
  const may3 = clientGia(MAY);
  const k3 = await dongBoIpos({ supabase: may3, chiNhanhId: cnA.id, nguon: 'tay', env: { ...ENV, IPOS_ACCESS_TOKEN: undefined }, fetchFn: fetchGia() });
  ok('Thiếu token → vẫn thử lại hàng chờ (ok), báo chưa đọc được thực đơn', k3.ok === true && k3.chuaCai === true
     && may3.goi.some(g => g.ten === 'kho_ipos_nhan') && /IPOS_ACCESS_TOKEN/.test(k3.canhBao.join()), JSON.stringify(k3));

  await db.query(`update kho_ipos_lan_chay set bat_dau_luc = bat_dau_luc - interval '5 minutes'`);
  const nem = async u => { throw new Error(`fetch failed: GET ${u} (connect ECONNREFUSED)`); };
  const may4 = clientGia(MAY);
  const k4 = await dongBoIpos({ supabase: may4, chiNhanhId: cnA.id, nguon: 'tay', env: ENV, fetchFn: nem });
  const loiGui = may4.goi.find(g => g.ten === 'kho_ipos_ket_thuc')?.thamSo.p_loi ?? '';
  ok('Đọc thực đơn lỗi (URL có token) → ok=false, câu đã xóa token', k4.ok === false && !k4.cau.includes(TOKEN_GIA)
     && /thực đơn/.test(k4.cau), k4.cau);
  ok('Câu gửi kho_ipos_ket_thuc đã xóa token (≤ 300 ký tự)', loiGui && !loiGui.includes(TOKEN_GIA) && loiGui.length <= 300, loiGui);
  const { rows: [cf4] } = await db.query(`select lan_cuoi_loi, dang_chay_tu from kho_ipos_cau_hinh where chi_nhanh_id = $1`, [cnA.id]);
  ok('Cấu hình: có lỗi (không token), khóa lượt đã nhả', cf4.lan_cuoi_loi && !cf4.lan_cuoi_loi.includes(TOKEN_GIA) && cf4.dang_chay_tu === null);

  await db.query(`update kho_ipos_lan_chay set bat_dau_luc = bat_dau_luc - interval '5 minutes'`);
  const k401 = await dongBoIpos({ supabase: clientGia(MAY), chiNhanhId: cnA.id, nguon: 'tay', env: ENV, fetchFn: fetchGia('Unauthorized', 401) });
  ok('HTTP 401 → "iPOS trả lỗi HTTP 401", không URL', /HTTP 401/.test(k401.cau) && !k401.cau.includes('http'), k401.cau);
  await db.query(`update kho_ipos_lan_chay set bat_dau_luc = bat_dau_luc - interval '5 minutes'`);
  const kLoi = await dongBoIpos({ supabase: clientGia(MAY), chiNhanhId: cnA.id, nguon: 'tay', env: ENV,
    fetchFn: fetchGia({ error: { message: 'denied', code: 100 } }) });
  ok('iPOS báo lỗi trong JSON → ok=false, không xóa thực đơn cũ', kLoi.ok === false && /mã 100/.test(kLoi.cau)
     && (await db.query(`select count(*)::int as n from kho_ipos_menu where chi_nhanh_id = $1`, [cnA.id])).rows[0].n === 4, kLoi.cau);
  await db.query(`update kho_ipos_lan_chay set bat_dau_luc = bat_dau_luc - interval '5 minutes'`);
  const kRong = await dongBoIpos({ supabase: clientGia(MAY), chiNhanhId: cnA.id, nguon: 'tay', env: ENV, fetchFn: fetchGia({ data: { items: [] } }) });
  ok('Thực đơn rỗng → giữ thực đơn cũ, cảnh báo', kRong.ok && /rỗng/.test(kRong.canhBao.join())
     && (await db.query(`select count(*)::int as n from kho_ipos_menu where chi_nhanh_id = $1`, [cnA.id])).rows[0].n === 4);

  const clientLoi = { rpc: async () => ({ data: null, error: { message: `boom ${TEN_TS}=${TOKEN_GIA}` } }) };
  const kd = await dongBoIpos({ supabase: clientLoi, chiNhanhId: cnA.id, nguon: 'tay', env: ENV, fetchFn: fetchGia() });
  ok('Lỗi database lỡ chứa token → cũng bị xóa', !kd.cau.includes(TOKEN_GIA), kd.cau);
  const nv = await dongBoIpos({ supabase: clientGia(UID.nvQuayA), chiNhanhId: cnA.id, nguon: 'tay', env: ENV, fetchFn: fetchGia() });
  ok('NV quầy bấm "Cập nhật ngay" → database từ chối', nv.ok === false && /không đồng bộ được/.test(nv.cau), nv.cau);
  const mayB = await dongBoIpos({ supabase: clientGia(UID_MAY_IPOS.mayIposB), chiNhanhId: cnA.id, nguon: 'cron', env: ENV, fetchFn: fetchGia() });
  ok('Máy chi nhánh B không đồng bộ chi nhánh A', mayB.ok === false && !mayB.tuChoi, mayB.cau);
  const nvMenu = await duoi(UID.nvQuayA, `select count(*)::int as n from kho_ipos_menu`);
  ok('NV quầy đọc được thực đơn iPOS (không có giá) — không lỗi', nvMenu.loi === null, nvMenu.loi ?? '');
});

// ===========================================================================
await nhom('6 · dongBoTatCa (CRON): ĐĂNG NHẬP MÁY → CHI NHÁNH CỦA MÁY → ĐĂNG XUẤT', async () => {
  await db.query(`update kho_ipos_lan_chay set bat_dau_luc = bat_dau_luc - interval '5 minutes'`);
  await db.query(`update kho_ipos_cau_hinh set dang_chay_tu = null, lan_dang_chay = null`);
  const log0 = await dongBoTatCa({}, { taoClient: () => clientGia(MAY), ghiLog: () => {} });
  ok('Thiếu tài khoản máy → 1 dòng log "chưa cài", không làm gì', log0.length === 1 && /chưa cài/.test(log0[0]), log0.join());

  const sai = clientGia(MAY, { matKhauDung: 'khac' });
  const log1 = await dongBoTatCa(ENV, { taoClient: () => sai, ghiLog: () => {} });
  ok('Sai mật khẩu máy → log lỗi, không gọi RPC nào', /không đăng nhập được/.test(log1.join()) && sai.goi.length === 0, log1.join());

  const c = clientGia(MAY);
  const log2 = await dongBoTatCa(ENV, { taoClient: () => c, fetchFn: fetchGia(), ghiLog: () => {} });
  ok('Máy A: hỏi kho_cn_duoc(dong_bo_ban) → chỉ chi nhánh A → 1 lượt → đăng xuất',
     c.goi[0].ten === 'kho_cn_duoc' && c.goi[0].thamSo.p_viec === 'dong_bo_ban'
     && c.goi.filter(g => g.ten === 'kho_ipos_bat_dau').length === 1
     && c.goi.find(g => g.ten === 'kho_ipos_bat_dau').thamSo.p_chi_nhanh_id === cnA.id
     && c.goi.at(-1).ten === 'signOut', c.goi.map(g => g.ten).join());
  ok('Log có kết quả lượt, không token', /Đã cập nhật/.test(log2.join()) && !log2.join().includes(TOKEN_GIA), log2.join());
  const log3 = await dongBoTatCa({ ...ENV, IPOS_ACCESS_TOKEN: undefined }, { taoClient: () => clientGia(MAY), ghiLog: () => {} });
  ok('Thiếu token iPOS → cron VẪN chạy (thử lại hàng chờ)', !/bỏ qua/.test(log3.join()), log3.join());

  const cB = clientGia(UID_MAY_IPOS.mayIposB);
  const log4 = await dongBoTatCa(ENV, { taoClient: () => cB, fetchFn: fetchGia(), ghiLog: () => {} });
  ok('Máy B: chi nhánh B chưa bật → im lặng (không log lượt)', log4.length === 0
     && cB.goi.find(g => g.ten === 'kho_ipos_bat_dau')?.thamSo.p_chi_nhanh_id === cnB.id, log4.join());

  ok('trangThaiBiMatIpos chỉ trả có / không', JSON.stringify(await trangThaiBiMatIpos(ENV)) === '{"token":true,"taiKhoanMay":true,"khoaCallback":true}'
     && JSON.stringify(await trangThaiBiMatIpos({ IPOS_CALLBACK_KHOA: 'ngan' })) === '{"token":false,"taiKhoanMay":false,"khoaCallback":false}');
  ok('layKhoaCallback: chỉ trả khi đủ dài', await layKhoaCallback(ENV) === KHOA_GIA && await layKhoaCallback({ IPOS_CALLBACK_KHOA: 'ngan' }) === undefined
     && !(JSON.stringify(await layBiMatIpos({})).includes('IPOS')));
  const { rows: [{ n }] } = await db.query(`select count(*)::int as n from kho_doi_soat_ton()`);
  ok('Đối soát tồn rỗng', n === 0);
});

// ===========================================================================
await nhom('7 · WORKER, WRANGLER, TRANG, KHÔNG TOKEN TRONG REPO', async () => {
  const w = readFileSync(join(GOC, 'web/src/worker.ts'), 'utf8');
  ok('src/worker.ts: fetch chặn /hook/ipos → xuLyHookIpos TRƯỚC handle của adapter; scheduled gọi dongBoTatCa qua waitUntil',
     /from '@astrojs\/cloudflare\/handler'/.test(w) && /async fetch\([\s\S]*startsWith\(DUONG_HOOK\)[\s\S]*xuLyHookIpos\([\s\S]*return handle\(/.test(w)
     && /async scheduled\([^)]*\)\s*\{[\s\S]*waitUntil\(dongBoTatCa\(env\)\)/.test(w));
  const t = readFileSync(join(GOC, 'web/wrangler.toml'), 'utf8');
  ok('wrangler.toml: main = src/worker.ts, crons 5 phút, giữ workers_dev / preview_urls = false',
     /^main = "\.\/src\/worker\.ts"$/m.test(t) && /^\[triggers\]\s*\ncrons = \["\*\/5 \* \* \* \*"\]/m.test(t)
     && /^workers_dev = false$/m.test(t) && /^preview_urls = false$/m.test(t));
  ok('wrangler.toml không có [vars] và không có giá trị bí mật', !/^\[vars\]/m.test(t) && !/IPOS_CALLBACK_KHOA\s*=/.test(t));
  const kho = readFileSync(join(GOC, 'web/KHO.md'), 'utf8');
  ok('KHO.md mục 3j: mô hình đẩy, IPOS_CALLBACK_KHOA, việc nhờ iPOS, câu hỏi còn mở',
     /IPOS_CALLBACK_KHOA/.test(kho) && /\/hook\/ipos\//.test(kho) && /mọi hóa đơn/i.test(kho) && /Câu hỏi còn mở/i.test(kho));
  const trang = readFileSync(join(GOC, 'web/src/pages/noi-bo/kho/cai-dat/ipos.astro'), 'utf8');
  ok('Màn Kết nối iPOS: địa chỉ nhận hóa đơn (chỉ chủ lấy khóa), lần nhận hóa đơn, 4 việc nhờ iPOS, không còn ô đường dẫn hóa đơn',
     /if \(laChu\) \{ try \{ khoa = await layKhoaCallback\(\)/.test(trang) && /nhan_hd_luc/.test(trang)
     && /callback_url/.test(trang) && /MỌI hóa đơn/.test(trang) && !/name="duong_dan_hoa_don"/.test(trang));
  const ghep = readFileSync(join(GOC, 'web/src/pages/noi-bo/kho/ban-ipos/ghep.astro'), 'utf8');
  ok('Màn Ghép món: Bán theo kg / gói / suất + "mỗi gói = … kg" + thực đơn iPOS có tìm / chia trang',
     /name="don_vi_ban"/.test(ghep) && /name="kg_moi_don_vi"/.test(ghep) && /docMenuIpos/.test(ghep) && /<PhanTrang/.test(ghep));
  ok('Ghép món: bấm "Sửa" chọn sẵn đúng món / kiểu đang ghép (không nhảy về gợi ý)',
     /const dangChon = !cu \?/.test(ghep) && /selected=\{dangChon === 'goi_can'\}/.test(ghep) && /selected=\{dangChon === 'bo_qua'\}/.test(ghep));
  const banIpos = readFileSync(join(GOC, 'web/src/lib/kho/ban-ipos.ts'), 'utf8');
  ok('Ghép món gọi kho_ipos_gan_ma_v2', /rpc\('kho_ipos_gan_ma_v2'/.test(banIpos) && !/rpc\('kho_ipos_gan_ma'/.test(banIpos));

  const wj = join(GOC, 'web/dist/server/wrangler.json');
  if (existsSync(wj)) {
    const j = JSON.parse(readFileSync(wj, 'utf8'));
    ok('Bản build (dist/server/wrangler.json) có triggers.crons', Array.isArray(j.triggers?.crons) && j.triggers.crons.length > 0,
       JSON.stringify(j.triggers));
    const e = join(GOC, 'web/dist/server', j.main ?? 'entry.mjs');
    ok('Bản build xuất scheduled', existsSync(e) && /scheduled\s*\(/.test(readFileSync(e, 'utf8')));
  } else {
    console.log('  (chưa build web — bỏ qua kiểm dist/server/wrangler.json)');
  }

  // Quét mọi file git theo dõi + file mới chưa bị .gitignore chặn.
  const ds = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: GOC, encoding: 'utf8' })
    .split('\n').filter(f => f && !f.includes('node_modules/') && existsSync(join(GOC, f)));
  const giongToken = new RegExp(`${TEN_TS}=[A-Za-z0-9._~%+/-]{16,}`);
  // Kiểu token mẫu trong tài liệu iPOS: 32 ký tự IN HOA + số đứng sau chữ access_token.
  const kieuIpos = new RegExp(`${TEN_TS}["'\\s:=]{1,6}[A-Z0-9]{32}\\b`);
  const tronIn = new RegExp(`\\b(?=[A-Z0-9]{32}\\b)(?=[A-Z]*[0-9])(?=[0-9]*[A-Z])[A-Z0-9]{32}\\b`);
  const ganBiMat = new RegExp(`(IPOS_${'ACCESS'}_TOKEN|IPOS_CALLBACK_${'KHOA'})\\s*=\\s*["']?[^\\s"'$<{]+`);
  const tim = [];
  for (const f of ds) {
    let s;
    try { s = readFileSync(join(GOC, f), 'utf8'); } catch { continue; }
    if (s.includes('\u0000')) continue;
    if (giongToken.test(s) || kieuIpos.test(s) || ganBiMat.test(s) || s.includes(TOKEN_GIA) || s.includes(KHOA_GIA)
        || (/ipos|foodbook/i.test(s) && tronIn.test(s))) tim.push(f);
  }
  ok(`Không file nào (${ds.length} file) chứa chuỗi giống token iPOS / khóa callback`, tim.length === 0 && ds.length > 50, tim.join(', '));
  const env = join(GOC, 'web/.env.example');
  ok('.env.example không nhắc tới bí mật iPOS', !existsSync(env) || !/(IPOS_ACCESS_TOKEN|IPOS_CALLBACK_KHOA)\s*=/.test(readFileSync(env, 'utf8')));
});

process.exit(ketThuc('ĐỒNG BỘ iPOS (PHẦN WEB)'));
