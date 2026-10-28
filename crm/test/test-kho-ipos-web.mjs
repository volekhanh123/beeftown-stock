/**
 * BEEFTOWN KHO — Kiểm thử phần WEB của đồng bộ iPOS (GĐ7a; GĐ7c; iPOS DW cho FABi 27/10/2026)
 * ===================================================================================
 *
 *     node test/test-kho-ipos-web.mjs
 *
 * Phần database nằm ở test-kho-ipos.mjs và test-kho-ipos-callback.mjs. File này kiểm:
 *   · lib/kho/ipos.ts (thuần): phanTichHoaDon theo tài liệu Postman "iPOS DW - PARTNERS"
 *     (mẫu TỰ DỰNG LẠI theo tài liệu — không token, không thông tin khách thật): sale_id,
 *     datastate, giờ in = ngày date_last + hour_last:minute_last (cả mốc 23:50 / 00:10 giờ
 *     VN), sale_detail_id, raw chỉ giữ khóa cho phép; phanTichKetQuaKeo, taoUrlKeo (không
 *     token), chiaCuaSo (15 phút – 1 ngày);
 *   · lib/kho/ipos-hook.ts: webhook — khóa sai 404, thiếu bí mật 503, body hỏng 400, quá
 *     lớn 413, hóa đơn → RPC đúng tham số, trả {"data": true}, gửi trùng không trừ đôi,
 *     sửa / xóa, lỗi database 500, mọi lỗi dạng {"error": {code, message}};
 *   · lib/kho/ipos-dong-bo.ts: lượt kéo bù (cron / tay) trên PGlite bằng client giả, fetch
 *     giả: cửa sổ, trang, mốc chỉ tiến khi kéo xong, hóa đơn hỏng làm đèn đỏ nhưng không kẹt
 *     mốc, mỗi kiểu hỏng của iPOS; token chỉ ở header, câu lỗi không bao giờ chứa token;
 *   · src/worker.ts + wrangler.toml: /hook/ipos chặn trước Astro, scheduled, crons,
 *     không bí mật;
 *   · cả repo: không file nào chứa chuỗi giống token iPOS.
 */

import { taoBoDem, UID, UID_MAY_IPOS, themMayIpos, dungDatabase } from './kho-chung.mjs';
import {
  TRUONG_IPOS, CAU_HOA_DON, phanTichHoaDon, thoiDiemBan, phanTichKetQuaKeo, taoUrlKeo, chiaCuaSo, docThoiDiem, xoaToken,
  bangNhauHang, cheKhoa,
} from '../../web/src/lib/kho/ipos.ts';
import {
  dongBoIpos, dongBoTatCa, layBiMatIpos, trangThaiBiMatIpos, cauTomTat, layKhoaCallback, quenPhienMay, dichLoiIpos,
  CUA_SO_MOT_LUOT, LO_GUI,
} from '../../web/src/lib/kho/ipos-dong-bo.ts';
import { xuLyHookIpos, khoaTuDuong } from '../../web/src/lib/kho/ipos-hook.ts';
import { cauSuKien } from '../../web/src/lib/kho/viec.ts';
import { docFormGhep, docFormCauHinhIpos } from '../../web/src/lib/kho/ban-ipos.ts';
import { gioVnTuMs } from '../../web/src/lib/gio-vn.ts';
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
// MẪU TỰ DỰNG theo tài liệu iPOS DW (Webhook sync / Get sale manager). Thông tin
// khách, nhân viên, thanh toán là giá trị giả, có mặt để kiểm chúng bị bỏ.
// ---------------------------------------------------------------------------
const SDT_GIA = '0900111222';
const DIA_CHI_GIA = '12 đường Thử Nghiệm';
const TEN_KHACH_GIA = 'KHACH GIA';
const NV_GIA = 'Thu ngân Thử';
const PII = [SDT_GIA, DIA_CHI_GIA, TEN_KHACH_GIA, NV_GIA, 'khach@gia.test', 'THE-GIA', 'GIAO-DICH-GIA', 'ít mỡ', 'ghi chú hóa đơn', 'NV01'];
const coPii = v => { const s = JSON.stringify(v); return PII.filter(x => s.includes(x)); };
const BRAND = 'BRAND-TEST';
const STORE = 'STORETEST001';

/** "n phút trước" theo giờ VN: ngày 00:00 (epoch giây, như date_last), giờ, phút, ISO mong đợi. */
function mocVn(phutTruoc) {
  const ms = Date.now() - phutTruoc * 60000;
  const g = gioVnTuMs(ms);
  return { ngayGiay: Date.parse(`${g.slice(0, 10)}T00:00:00+07:00`) / 1000, gio: +g.slice(11, 13), phut: +g.slice(14, 16),
           iso: `${g.slice(0, 16)}:00+07:00`, taoGiay: Math.floor(ms / 1000) };
}

function hoaDonDw(saleId, dong, { datastate = 0, phutTruoc = 20, brand = BRAND, store = STORE, sale = {}, them = {} } = {}) {
  const m = mocVn(phutTruoc);
  return {
    sale_id: saleId, datastate, origin_sale_id: null, tran_date: m.ngayGiay,
    sale: {
      vat: 0, note: 'ghi chú hóa đơn', status: 1, area_id: 'AREA-1', is_temp: 0, sale_id: saleId, tran_id: 'TA', tran_no: 'S' + saleId,
      user_id: 'NV01', user_name: NV_GIA, shift_id: 'CA1', store_id: store, date_last: m.ngayGiay, hour_last: m.gio,
      minute_last: m.phut, tran_date: m.ngayGiay, store_name: 'Beeftown thử', customer_id: '00000', membership_id: SDT_GIA,
      membership_id_new: SDT_GIA, vat_customer_name: TEN_KHACH_GIA, vat_customer_phone: SDT_GIA,
      vat_customer_email: 'khach@gia.test', vat_customer_address: DIA_CHI_GIA, address_delivery: DIA_CHI_GIA,
      card_info_code: 'THE-GIA', get_amount: 500000, ...sale,
    },
    sale_detail: dong.map((d, i) => ({
      sale_detail_id: d.sale_detail_id ?? `SD-${saleId}-${i}`, item_id: d.item_id, description: d.description ?? `Món ${d.item_id}`,
      quantity: d.quantity, amount: d.amount ?? 100000, unit_id: 'KG', price_sale: 100000, price_org: 100000,
      note: 'ít mỡ', user_id: 'NV01', store_id: store, sale_id: saleId, is_gift: 0, discount: 0,
    })),
    sale_payment_method: [{ amount: 100000, payment_method_id: 'CASH', trace_no: 'GIAO-DICH-GIA', user_id: 'NV01' }],
    amount: 200000, amount_org: 200000, brand_id: brand, company_id: 'CTY-GIA', created_at: m.taoGiay, updated_at: m.taoGiay,
    ...them,
  };
}

// ===========================================================================
await nhom('1 · phanTichHoaDon: HÓA ĐƠN iPOS DW THEO TÀI LIỆU', async () => {
  const x = hoaDonDw('S100', [{ item_id: 'BACHI', quantity: 0.45 }, { item_id: 'BACHI', quantity: 0.45 },
    { item_id: 'PHO', quantity: 2, amount: '140000' }]);
  const kq = phanTichHoaDon(x);
  ok('Hóa đơn → loai hoa_don, brandId (tầng ngoài), storeId (trong sale)', kq.loai === 'hoa_don' && kq.brandId === BRAND
     && kq.storeId === STORE, JSON.stringify(kq).slice(0, 200));
  const h = kq.hoaDon;
  ok('ma_hd = sale_id', h.ma_hd === 'S100', h.ma_hd);
  ok('Giờ bán = ngày date_last + hour_last:minute_last, giờ VN +07:00', h.thoi_diem_ban === mocVn(20).iso, h.thoi_diem_ban);
  ok('Hai dòng cùng item_id là HAI dòng, khoa_dong = sale_detail_id', h.dong.length === 3
     && h.dong.map(d => d.khoa_dong).join() === 'SD-S100-0,SD-S100-1,SD-S100-2' && h.dong[0].ma_ipos === 'BACHI'
     && h.dong[1].ma_ipos === 'BACHI', JSON.stringify(h.dong));
  ok('Dòng: so_luong = quantity, thanh_tien = amount (chuỗi → số), ten_ipos = description, không kg / gói / mã vạch',
     h.dong[0].so_luong === 0.45 && h.dong[2].so_luong === 2 && h.dong[2].thanh_tien === 140000 && h.dong[0].ten_ipos === 'Món BACHI'
     && h.dong.every(d => d.so_kg === undefined && d.so_goi === undefined && d.ma_vach === undefined), JSON.stringify(h.dong));
  ok('datastate 0 → da_huy false', h.da_huy === false);
  ok('raw BỎ khách, nhân viên, thanh toán, ghi chú (không số điện thoại, địa chỉ, tên, mã giao dịch)', coPii(h.raw).length === 0
     && !/membership|vat_customer|address|payment|user_|card|note/.test(JSON.stringify(h.raw)), coPii(h.raw).join());
  ok('raw giữ mã món đối chiếu item_id_mapping (để biết mã món tự đặt trên FABi đi sang ở đâu)',
     phanTichHoaDon({ ...x, sale_detail: [{ ...x.sale_detail[0], item_id_mapping: 'BPHU0010' }] }).hoaDon.raw.sale_detail[0].item_id_mapping === 'BPHU0010');
  ok('raw giữ phần hóa đơn (sale_id, datastate, sale.tran_no, sale.store_id, dòng item_id / quantity)', h.raw.sale_id === 'S100'
     && h.raw.datastate === 0 && h.raw.sale.tran_no === 'SS100' && h.raw.sale.store_id === STORE
     && h.raw.sale_detail[2].item_id === 'PHO' && h.raw.sale_detail[2].quantity === 2, JSON.stringify(h.raw).slice(0, 300));
  ok('Không cảnh báo khi đủ trường', kq.canhBao.length === 0, kq.canhBao.join());

  const xoa = phanTichHoaDon(hoaDonDw('S101', [{ item_id: 'BACHI', quantity: 1 }], { datastate: 2 }));
  ok('datastate 2 (xóa) → da_huy; "2" dạng chuỗi cũng vậy', xoa.hoaDon.da_huy === true
     && phanTichHoaDon(hoaDonDw('S102', [], { datastate: '2' })).hoaDon.da_huy === true);
  ok('datastate 1 (sửa) → không hủy (database đảo ngược rồi ghi lại theo băm)', phanTichHoaDon(hoaDonDw('S103', [], { datastate: 1 })).hoaDon.da_huy === false);
  ok('sale.status 0 (chưa thanh toán) KHÔNG phải hủy', phanTichHoaDon(hoaDonDw('S104', [], { sale: { status: 0 } })).hoaDon.da_huy === false);

  // Hủy trên FABi (thử thật 28/10/2026): bản MỚI "X_DEL", datastate 2, origin_sale_id = X, quantity âm (0108).
  const del = phanTichHoaDon(hoaDonDw('S107_DEL', [{ item_id: '01011', quantity: -1.2, amount: -1140000 }],
    { datastate: 2, sale: { origin_sale_id: 'S107' }, them: { origin_sale_id: 'S107' } }));
  ok('Bản hủy "X_DEL" (datastate 2, origin_sale_id = X) → ma_hd_goc = X, da_huy; quantity âm không thành cảnh báo',
     del.hoaDon.ma_hd === 'S107_DEL' && del.hoaDon.ma_hd_goc === 'S107' && del.hoaDon.da_huy === true
     && del.canhBao.length === 0, JSON.stringify({ h: del.hoaDon, c: del.canhBao }));
  const chiSale = phanTichHoaDon(hoaDonDw('S108_DEL', [], { datastate: 2, sale: { origin_sale_id: 'S108' } }));
  ok('origin_sale_id chỉ có trong "sale" (gốc null) → vẫn đọc ma_hd_goc', chiSale.hoaDon.ma_hd_goc === 'S108');
  ok('Hóa đơn sửa (datastate 0 / 1 có origin_sale_id) → KHÔNG ma_hd_goc — không hủy hóa đơn cũ',
     [0, 1].every(ds => phanTichHoaDon(hoaDonDw('S109', [], { datastate: ds, them: { origin_sale_id: 'S100' } })).hoaDon.ma_hd_goc === undefined));
  ok('datastate 2 mà origin_sale_id rỗng / trùng chính nó → KHÔNG ma_hd_goc',
     ['', '  ', 'S110'].every(g => phanTichHoaDon(hoaDonDw('S110', [], { datastate: 2, them: { origin_sale_id: g } })).hoaDon.ma_hd_goc === undefined)
     && phanTichHoaDon(hoaDonDw('S111', [], { datastate: 2 })).hoaDon.ma_hd_goc === undefined);
  ok('Hóa đơn hủy trỏ origin_sale_id mà sale_id không đúng "<gốc>_DEL" (tách, gộp, hóa đơn sửa bị hủy) → KHÔNG ma_hd_goc',
     ['S113', 'S113_DEL2', 'S100_DEL'].every(id => phanTichHoaDon(hoaDonDw(id, [], { datastate: 2, them: { origin_sale_id: 'S107' } })).hoaDon.ma_hd_goc === undefined));
  ok('Hóa đơn thường quantity âm → vẫn cảnh báo dòng sai "quantity"',
     phanTichHoaDon(hoaDonDw('S112', [{ item_id: 'A', quantity: -1 }])).canhBao.some(c => c.includes('quantity')));
  ok('Bản "X_DEL" có dòng thiếu quantity → vẫn cảnh báo (chỉ quantity âm là đúng mẫu)',
     phanTichHoaDon(hoaDonDw('S114_DEL', [{ item_id: 'A' }], { datastate: 2, them: { origin_sale_id: 'S114' } })).canhBao.some(c => c.includes('quantity')));

  const trungMa = phanTichHoaDon(hoaDonDw('S105', [{ item_id: 'A', quantity: 1, sale_detail_id: 'X' }, { item_id: 'B', quantity: 1, sale_detail_id: 'X' }]));
  ok('sale_detail_id trùng → khoa_dong theo chỉ số dòng (từ 0)', trungMa.hoaDon.dong.map(d => d.khoa_dong).join() === '0,1');
  const thieuMaDong = phanTichHoaDon({ ...hoaDonDw('S106', []), sale_detail: [{ item_id: 'A', quantity: 1 }, { item_id: 'B', quantity: 1, sale_detail_id: 'Y' }] });
  ok('Có dòng thiếu sale_detail_id → khoa_dong theo chỉ số dòng', thieuMaDong.hoaDon.dong.map(d => d.khoa_dong).join() === '0,1');

  const thieuSl = phanTichHoaDon(hoaDonDw('S107', [{ item_id: 'A', quantity: 'abc' }, { quantity: 1 }, { item_id: 'C', quantity: -1 }]));
  ok('Dòng thiếu item_id / quantity sai / âm → vẫn nhận, cảnh báo chỉ tên khóa', thieuSl.loai === 'hoa_don'
     && thieuSl.hoaDon.dong[0].so_luong === undefined && thieuSl.hoaDon.dong[1].ma_ipos === undefined
     && thieuSl.hoaDon.dong[2].so_luong === undefined && /1 dòng thiếu "item_id"/.test(thieuSl.canhBao.join())
     && /2 dòng thiếu hoặc sai "quantity"/.test(thieuSl.canhBao.join()) && !/abc/.test(thieuSl.canhBao.join()), thieuSl.canhBao.join());
  ok('sale_detail_id dài / số → khoa_dong là chuỗi', phanTichHoaDon(hoaDonDw('S108', [{ item_id: 'A', quantity: 1, sale_detail_id: 5346308 }]))
    .hoaDon.dong[0].khoa_dong === '5346308');

  const thieu = phanTichHoaDon({ ...hoaDonDw('', []), sale: { ...hoaDonDw('', []).sale, sale_id: '' } });
  ok('Thiếu sale_id → loi, câu nói tên khóa, có bản tiếng Anh', thieu.loai === 'loi' && /sale_id/.test(thieu.cau)
     && thieu.cauEn === CAU_HOA_DON.thieuMa.en, JSON.stringify(thieu));
  const chiTrongSale = hoaDonDw('', []); chiTrongSale.sale.sale_id = 'S109';
  ok('sale_id chỉ có trong sale → vẫn đọc', phanTichHoaDon(chiTrongSale).hoaDon?.ma_hd === 'S109');
  ok('sale_detail không phải danh sách → loi', phanTichHoaDon({ ...hoaDonDw('S110', []), sale_detail: { a: 1 } }).loai === 'loi');
  ok('sale không phải object → loi', phanTichHoaDon({ ...hoaDonDw('S111', []), sale: 'x' }).loai === 'loi');
  const nhieu = phanTichHoaDon(hoaDonDw('S112', Array.from({ length: TRUONG_IPOS.dongToiDa + 1 }, () => ({ item_id: 'A', quantity: 1 }))));
  ok(`Hơn ${TRUONG_IPOS.dongToiDa} dòng → loi`, nhieu.loai === 'loi');
  ok('Không phải object → loi', ['x', null, [1], 5].every(v => phanTichHoaDon(v).loai === 'loi'));
  const khongCh = phanTichHoaDon({ ...hoaDonDw('S113', []), brand_id: undefined });
  ok('Thiếu brand_id → vẫn đọc hóa đơn, brandId trống (hook từ chối)', khongCh.loai === 'hoa_don' && khongCh.brandId === undefined);
  const storeNgoai = hoaDonDw('S114', [], { them: { store_id: 'TANG-NGOAI' } });
  ok('store_id ở tầng ngoài (kết quả kéo) được ưu tiên', phanTichHoaDon(storeNgoai).storeId === 'TANG-NGOAI');
});

// ===========================================================================
await nhom('2 · GIỜ BÁN QUA NỬA ĐÊM GIỜ VN (23:50 / 00:10), MỐC HỎNG', async () => {
  const ngay = Date.parse('2026-10-27T00:00:00+07:00') / 1000;   // date_last như tài liệu: 00:00 giờ VN
  const gio = (dateLast, h, m, them = {}) => thoiDiemBan({ sale: { date_last: dateLast, hour_last: h, minute_last: m }, ...them });
  ok('23:50 giờ VN → 2026-10-27T23:50 +07:00 (UTC đã là 16:50 cùng ngày)', gio(ngay, 23, 50) === '2026-10-27T23:50:00+07:00', gio(ngay, 23, 50));
  ok('00:10 giờ VN → 2026-10-27T00:10 +07:00 (UTC còn là 26/10)', gio(ngay, 0, 10) === '2026-10-27T00:10:00+07:00', gio(ngay, 0, 10));
  ok('date_last là mốc đầy đủ lúc 23:50 VN (16:50Z) → không cộng đôi giờ',
     gio(Date.parse('2026-10-27T16:50:00Z') / 1000, 23, 50) === '2026-10-27T23:50:00+07:00');
  ok('date_last là mốc đầy đủ lúc 00:10 VN (17:10Z hôm trước) → vẫn ngày 27/10',
     gio(Date.parse('2026-10-26T17:10:00Z') / 1000, 0, 10) === '2026-10-27T00:10:00+07:00');
  ok('date_last mili giây vẫn đọc', gio(ngay * 1000, 23, 50) === '2026-10-27T23:50:00+07:00');
  ok('Thiếu date_last → ngày của tran_date trong sale', thoiDiemBan({ sale: { tran_date: ngay, hour_last: 8, minute_last: 5 } })
     === '2026-10-27T08:05:00+07:00');
  const tao = Date.parse('2026-10-27T05:00:00Z') / 1000;
  ok('hour_last 24 / minute_last 60 (không có thật) → dùng created_at', gio(ngay, 24, 0, { created_at: tao }) === '2026-10-27T05:00:00.000Z'
     && gio(ngay, 10, 60, { created_at: tao }) === '2026-10-27T05:00:00.000Z');
  ok('Thiếu giờ phút, thiếu created_at → chính mốc date_last', gio(ngay, undefined, undefined) === '2026-10-26T17:00:00.000Z');
  ok('Không mốc nào → null; hóa đơn báo "không đọc được giờ bán"', thoiDiemBan({ sale: { hour_last: 1, minute_last: 1 } }) === null
     && /giờ bán/.test(phanTichHoaDon({ sale_id: 'Z', sale: { date_last: 'hôm qua' } }).cau ?? ''));
  ok('Mốc rác ("31/02", 0, âm) → không dùng', gio('31/02/2026', 1, 1) === null && gio(0, 1, 1) === null && gio(-5, 1, 1) === null);
  ok('docThoiDiem (created_at chuỗi): "YYYY-MM-DD HH:mm:ss" → +07:00; 31/02 → null',
     docThoiDiem('2017-11-03 16:51:00') === '2017-11-03T16:51:00+07:00' && docThoiDiem('2026-02-31 10:00') === null);
});

// ===========================================================================
await nhom('3 · KÉO CHỦ ĐỘNG: KẾT QUẢ, URL, CỬA SỔ', async () => {
  const kq = phanTichKetQuaKeo({ data: [hoaDonDw('K1', []), {}] });
  ok('{"data": [...]} → danh sách thô (đọc từng cái sau)', kq.loi === null && kq.hoaDon.length === 2);
  const loi = phanTichKetQuaKeo({ error: { message: 'IP Blocked or Access Denied! TrackId: 1', code: 1401 } });
  ok('iPOS báo lỗi → loi có mã, KHÔNG chép câu của iPOS, có bản tiếng Anh', loi.hoaDon.length === 0 && /mã 1401/.test(loi.loi)
     && !/Blocked|TrackId/.test(loi.loi) && /code 1401/.test(loi.loiEn), loi.loi);
  ok('Thiếu "data" / data không phải danh sách / không phải object → loi', phanTichKetQuaKeo({ data: {} }).loi !== null
     && phanTichKetQuaKeo({}).loi !== null && phanTichKetQuaKeo(null).loi !== null && phanTichKetQuaKeo([1]).loi !== null);

  const url = new URL(taoUrlKeo({ brandId: BRAND, storeId: STORE }, 1000, 2000, 3));
  ok('URL: {goc}/api/v1/partners/get-sales?store_id&brand_id&from_update_time&to_update_time&page&page_size=1000',
     url.origin === TRUONG_IPOS.goc && url.pathname === '/api/v1/partners/get-sales' && url.searchParams.get('store_id') === STORE
     && url.searchParams.get('brand_id') === BRAND && url.searchParams.get('from_update_time') === '1000'
     && url.searchParams.get('to_update_time') === '2000' && url.searchParams.get('page') === '3'
     && url.searchParams.get('page_size') === '1000', url.toString());
  ok('URL KHÔNG có token (token đi ở header access_token)', !url.toString().includes(TEN_TS) && TRUONG_IPOS.keo.tieuDeToken === TEN_TS);
  ok('Máy chủ là dwapis.ipos.vn (bản thật, không phải bản thử -dev)', TRUONG_IPOS.goc === 'https://dwapis.ipos.vn');

  const t0 = Date.parse('2026-10-27T10:00:00Z');
  const gioMs = 3600_000;
  const c20 = chiaCuaSo(t0 - gioMs / 3, t0, 3);
  ok('20 phút → một cửa sổ đúng 20 phút', c20.length === 1 && c20[0][1] === t0 / 1000 && c20[0][1] - c20[0][0] === 1200, JSON.stringify(c20));
  const c5 = chiaCuaSo(t0 - 5 * 60000, t0, 3);
  ok('5 phút (< 15 phút iPOS nhận) → lùi đầu cửa sổ cho đủ 15 phút', c5.length === 1 && c5[0][1] - c5[0][0] === 900, JSON.stringify(c5));
  const c60 = chiaCuaSo(t0 - 60 * gioMs, t0, 5);
  ok('60 giờ → 3 cửa sổ liền nhau, mỗi cửa sổ 15 phút – 1 ngày, cửa sổ cuối hết ở "bây giờ"', c60.length === 3
     && c60.every(([a, b]) => b - a >= 900 && b - a <= 86400) && c60[1][0] === c60[0][1] && c60[2][1] === t0 / 1000
     && c60[0][0] === (t0 - 60 * gioMs) / 1000, JSON.stringify(c60));
  ok('Quá số cửa sổ tối đa → dừng ở tối đa (lượt sau kéo tiếp)', chiaCuaSo(t0 - 10 * 24 * gioMs, t0, 2).length === 2);
  const lech = chiaCuaSo(t0 - 24 * gioMs - 60_000, t0, 3);
  ok('Mẩu cuối 1 phút → lùi đầu cho đủ 15 phút (đọc trùng không sao)', lech.length === 2 && lech[1][1] - lech[1][0] === 900
     && lech[1][1] === t0 / 1000, JSON.stringify(lech));
  ok('Đầu sau cuối / mốc hỏng → không cửa sổ nào', chiaCuaSo(t0, t0 - 1, 3).length === 0 && chiaCuaSo(NaN, t0, 3).length === 0);
  ok('Đầu bằng cuối → một cửa sổ 15 phút', chiaCuaSo(t0, t0, 3).length === 1);
});

// ===========================================================================
await nhom('4 · HÀM NHỎ: CHUÔNG, TOKEN, KHÓA, CÂU, FORM', async () => {
  const chuong = so => cauSuKien({ khoa: 'ipos_mat_ket_noi', nhom: 'he_thong', ref_id: null, ref2: null, ma: null, ten: null,
    phu: 'cham', so, luc: '' });
  ok('Chuông mất kết nối: chưa nhận hóa đơn nào (so = null) → nói "chưa nhận", không bịa giờ',
     /Chưa nhận được hóa đơn nào/.test(chuong(null).chiTiet ?? '') && !/trước\./.test(chuong(null).chiTiet ?? ''), chuong(null).chiTiet);
  ok('Chuông mất kết nối: 200 phút → "3 giờ trước"', /Hóa đơn cuối nhận được: 3 giờ trước/.test(chuong(200).chiTiet ?? ''), chuong(200).chiTiet);
  const loiChuong = cauSuKien({ khoa: 'ipos_mat_ket_noi', nhom: 'he_thong', ref_id: null, ref2: null, ma: null, ten: null, phu: 'loi', so: null, luc: '' });
  ok('Chuông lượt lỗi nói "kéo hóa đơn", không còn "đọc thực đơn"', /kéo hóa đơn/.test(loiChuong.chiTiet ?? '')
     && !/thực đơn/.test(loiChuong.chiTiet ?? ''), loiChuong.chiTiet);

  const x1 = xoaToken(`GET https://x/y?${TEN_TS}=${TOKEN_GIA} failed (${TEN_TS}: ${TOKEN_GIA})`, TOKEN_GIA);
  ok('xoaToken: bỏ token ở mọi chỗ', !x1.includes(TOKEN_GIA), x1);
  ok('xoaToken: không biết token vẫn xóa "access_token=…"', !/Q{30}/.test(xoaToken(`${TEN_TS}=${'Q'.repeat(30)}`)));
  ok('bangNhauHang: đúng / sai / khác độ dài / rỗng', bangNhauHang(KHOA_GIA, KHOA_GIA) && !bangNhauHang(KHOA_GIA, KHOA_GIA + 'x')
     && !bangNhauHang(KHOA_GIA, KHOA_GIA.slice(0, -1) + 'Z') && !bangNhauHang('', KHOA_GIA) && !bangNhauHang(KHOA_GIA, ''));
  ok('cheKhoa không lộ ký tự nào', !cheKhoa(KHOA_GIA).includes(KHOA_GIA.slice(0, 3)) && cheKhoa(undefined) === '');
  ok('khoaTuDuong: /hook/ipos/<khóa>[/], không nhận đường dẫn con', khoaTuDuong(`/hook/ipos/${KHOA_GIA}`) === KHOA_GIA
     && khoaTuDuong(`/hook/ipos/${KHOA_GIA}/`) === KHOA_GIA && khoaTuDuong('/hook/ipos/') === null
     && khoaTuDuong('/hook/ipos/a/b') === null && khoaTuDuong('/noi-bo') === null);

  const tt = { hd_moi: 1, hd_trung: 2, hd_sua: 0, hd_huy: 0, hd_loi: 0, so_dong: 0, dong: { da_ghi: 2, thieu_hang: 1, loi: 0 } };
  ok('cauTomTat: kéo, hóa đơn mới, dòng đã trừ / vẫn chờ', /Đã cập nhật: kéo 3 hóa đơn từ iPOS, 1 hóa đơn mới, xử lý 3 dòng bán: 2 đã trừ kho, 1 vẫn chờ xử lý\./
    .test(cauTomTat(tt, { so_tra: 3, so_hd: 3, so_cua_so: 1, con_lai: false })), cauTomTat(tt, { so_tra: 3, so_hd: 3, so_cua_so: 1, con_lai: false }));
  ok('cauTomTat: không có hóa đơn / không dòng chờ / còn hóa đơn cũ', /iPOS không có hóa đơn nào mới cập nhật, không có dòng bán nào đang chờ, còn hóa đơn cũ hơn/
    .test(cauTomTat(undefined, { so_tra: 0, so_hd: 0, so_cua_so: 3, con_lai: true })) && /không có dòng bán nào đang chờ/.test(cauTomTat(undefined)));
  ok('cauTomTat tiếng Anh', /^Updated: fetched 1 invoice from iPOS, processed 3 sale lines: 2 deducted from stock, 1 still waiting\.$/
    .test(cauTomTat({ ...tt, hd_moi: 0 }, { so_tra: 1, so_hd: 1, so_cua_so: 1, con_lai: false }, 'en')),
     cauTomTat({ ...tt, hd_moi: 0 }, { so_tra: 1, so_hd: 1, so_cua_so: 1, con_lai: false }, 'en'));
  ok('dichLoiIpos: câu lỗi kéo trong nhật ký → tiếng Anh', dichLoiIpos('Không kéo được hóa đơn iPOS: iPOS trả lỗi HTTP 401', 'en')
     === 'Could not fetch iPOS invoices: iPOS returned an HTTP 401 error'
     && dichLoiIpos('Không kéo được hóa đơn iPOS: iPOS báo lỗi khi kéo hóa đơn (mã 1401) — kiểm tra mã thương hiệu, mã cửa hàng và token', 'en')
       === 'Could not fetch iPOS invoices: iPOS reported an error while fetching invoices (code 1401) — check the brand code, store code and token');
  ok('dichLoiIpos: "<n> hóa đơn iPOS không ghi được: <lý do>" → tiếng Anh, lý do cũng dịch',
     dichLoiIpos(`3 hóa đơn iPOS không ghi được: ${CAU_HOA_DON.thieuMa.vi}`, 'en')
       === `3 iPOS invoices could not be recorded: ${CAU_HOA_DON.thieuMa.en}`, dichLoiIpos(`3 hóa đơn iPOS không ghi được: ${CAU_HOA_DON.thieuMa.vi}`, 'en'));
  ok('dichLoiIpos: tiếng Việt giữ nguyên, trống → ""', dichLoiIpos('abc', 'vi') === 'abc' && dichLoiIpos(null, 'en') === '');

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

  const ch = docFormCauHinhIpos(f({ bat: 'co', pos_parent: BRAND, pos_id: STORE, gio_mo_cua: '9', gio_dong_cua: '22', gio_mat_ket_noi: '4',
    duong_dan_hoa_don: '/khong-dung', api_url: 'https://apitest.foodbook.vn/ipos/ws/xpartner' }));
  ok('Form cấu hình: mã thương hiệu, mã cửa hàng, gio_mat_ket_noi; KHÔNG gửi đường dẫn hóa đơn, KHÔNG gửi địa chỉ API',
     ch.cauHinh?.pos_parent === BRAND && ch.cauHinh?.pos_id === STORE && ch.cauHinh?.gio_mat_ket_noi === 4
     && !('duong_dan_hoa_don' in (ch.cauHinh ?? {})) && !('api_url' in (ch.cauHinh ?? {})), JSON.stringify(ch));
  const saiMa = docFormCauHinhIpos(f({ pos_id: 'Cửa hàng 1' }));
  ok('Form cấu hình: mã cửa hàng có dấu → lỗi gọi đúng tên ô, đủ hai thứ tiếng', /^Mã cửa hàng chỉ gồm/.test(saiMa.loi ?? '')
     && /^The store code may only/.test(saiMa.loiEn ?? ''), JSON.stringify(saiMa));
  ok('Form cấu hình: gio_mat_ket_noi ngoài 1–12 → lỗi', docFormCauHinhIpos(f({ gio_mat_ket_noi: '13' })).loi !== null);
  ok('Form cấu hình: dán token → từ chối', /token/i.test(docFormCauHinhIpos(f({ pos_id: `x${TEN_TS}` })).loi ?? ''));

  const nguon = readFileSync(join(GOC, 'web/src/lib/kho/ipos.ts'), 'utf8');
  // Thuần = không mạng, không database. Chỉ được import gio-vn.ts (đọc ngày giờ VN), và chính file đó cũng không import gì.
  const cacImport = [...nguon.matchAll(/^import .* from '([^']+)'/gm)].map(m => m[1]);
  const nguonGioVn = readFileSync(join(GOC, 'web/src/lib/gio-vn.ts'), 'utf8');
  ok('ipos.ts thuần: chỉ import gio-vn.ts, và gio-vn.ts không import gì',
     cacImport.every(d => d === '../gio-vn.ts') && [...nguon.matchAll(/^import /gm)].length === cacImport.length
     && ![...nguonGioVn.matchAll(/^import /gm)].length, cacImport.join(', '));
  ok('ipos.ts: không tự cộng 7 tiếng (giờ VN qua gio-vn.ts)', !/7\s*\*\s*(60|3600)|25200/.test(nguon));
  ok('TRUONG_IPOS ghi nguồn tài liệu Postman iPOS DW', /iPOS DW - PARTNERS[\s\S]{0,6000}export const TRUONG_IPOS/.test(nguon)
     && /iPOS DW - PARTNERS/.test(TRUONG_IPOS.nguon));
  ok('raw chỉ giữ khóa cho phép — không khóa nào mang thông tin khách / nhân viên / thanh toán',
     [...TRUONG_IPOS.rawGiu.hoaDon, ...TRUONG_IPOS.rawGiu.sale, ...TRUONG_IPOS.rawGiu.dong]
       .every(k => !/membership|customer|phone|email|address|user|payment|card|note|token|name/i.test(k)));
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
/** fetch giả của API kéo: trang → body (hàm), ghi URL, tham số, header token. */
function fetchKeo(trangRa = () => ({ data: [] }), status = 200) {
  const goi = [];
  const f = async (u, init = {}) => {
    const url = new URL(String(u));
    goi.push({ url: String(u), token: new Headers(init.headers).get(TEN_TS), tham: Object.fromEntries(url.searchParams) });
    const body = trangRa(Number(url.searchParams.get('page')), url);
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  };
  f.goi = goi;
  return f;
}
const MAY = UID_MAY_IPOS.mayIposA;
const log = [];
const ghiLog = c => log.push(c);
const yeuCau = (body, { method = 'POST', loai = 'application/json', dai } = {}) => new Request('https://beeftown.vn/hook/ipos/x', {
  method, body: method === 'GET' ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
  headers: { 'content-type': loai, [TEN_TS]: 'TOKEN-IPOS-GUI-KEM', ...(dai ? { 'content-length': String(dai) } : {}) },
});
const hook = async (body, { khoa = KHOA_GIA, env = ENV, client, ...tuy } = {}) => {
  const c = client ?? clientGia(MAY);
  const res = await xuLyHookIpos(yeuCau(body, tuy), khoa, { env, taoClient: () => c, ghiLog });
  let json = null;
  try { json = await res.json(); } catch { /* không JSON */ }
  return { status: res.status, json, goi: c.goi };
};
/** Đúng dạng thất bại của tài liệu iPOS DW: {"error": {"code", "message"}}, không có "data". */
const laLoi = (r, ma) => r.json?.error?.code === ma && typeof r.json.error.message === 'string' && !('data' in (r.json ?? {}));
const dongCua = async ma => (await db.query(`select d.khoa_dong, d.trang_thai, d.so_luong from kho_ipos_dong d
  join kho_ipos_hoa_don h on h.id = d.hoa_don_id where h.chi_nhanh_id = $1 and h.ma_hd = $2 order by d.khoa_dong`, [cnA.id, ma])).rows;
const hoaDonDb = async ma => (await db.query(`select * from kho_ipos_hoa_don where chi_nhanh_id = $1 and ma_hd = $2`, [cnA.id, ma])).rows[0];
let HD_WEBHOOK;   // hóa đơn đã nhận qua webhook ở nhóm 5 — nhóm 6 kéo lại đúng nó

await nhom('5 · WEBHOOK /hook/ipos: KHÓA, BODY, HÓA ĐƠN, SỬA / XÓA', async () => {
  await themMayIpos(db, cnA, cnB);
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  const viTriQuay = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'quay'`, [cnA.id])).rows[0].id;

  const get = await hook(null, { method: 'GET' });
  ok('GET → 405 dạng {"error": …}', get.status === 405 && laLoi(get, 'chi_nhan_post'), JSON.stringify(get.json));
  const r503 = await hook(hoaDonDw('A1', []), { env: { ...ENV, IPOS_CALLBACK_KHOA: undefined } });
  ok('Thiếu bí mật IPOS_CALLBACK_KHOA → 503 "chưa cài", không gọi database', r503.status === 503
     && /IPOS_CALLBACK_KHOA/.test(r503.json?.error?.message) && r503.goi.length === 0, JSON.stringify(r503));
  ok('Khóa cài quá ngắn (< 32 ký tự) → 503', (await hook(hoaDonDw('A1', []), { khoa: 'ngan', env: { ...ENV, IPOS_CALLBACK_KHOA: 'ngan' } })).status === 503);
  const sai = await hook(hoaDonDw('A1', []), { khoa: KHOA_GIA.slice(0, -1) + 'X' });
  ok('Khóa sai → 404, không gọi database', sai.status === 404 && sai.goi.length === 0 && laLoi(sai, 'khong_tim_thay'));
  ok('Khóa rỗng → 404', (await hook(hoaDonDw('A1', []), { khoa: '' })).status === 404);
  ok('JSON hỏng → 400', (await hook('{không phải json')).status === 400);
  ok('Body > 256KB → 413', (await hook('x'.repeat(TRUONG_IPOS.bodyToiDa + 10))).status === 413);
  ok('content-length khai > 256KB → 413 (không đọc body)', (await hook('{}', { dai: TRUONG_IPOS.bodyToiDa + 1 })).status === 413);
  const cu = await hook({ event_id: 11, sale_manager: { pos_parent: 'X', pos_id: 1, tran_id: 'T1' } });
  ok('Định dạng iPOS Hub cũ / không có sale_id → 400 hoa_don_hong, không đăng nhập máy', cu.status === 400 && laLoi(cu, 'hoa_don_hong')
     && /sale_id/.test(cu.json.error.message) && cu.goi.length === 0, JSON.stringify(cu.json));
  const thieuCh = await hook({ ...hoaDonDw('A1', []), brand_id: undefined });
  ok('Thiếu brand_id → 400 thieu_cua_hang, không gọi database', thieuCh.status === 400 && laLoi(thieuCh, 'thieu_cua_hang') && thieuCh.goi.length === 0);

  const chuaCn = await hook(hoaDonDw('A1', [{ item_id: 'BACHI', quantity: 1 }]));
  ok('Chưa có chi nhánh khớp brand_id / store_id → 202 + log cảnh báo, không nhận', chuaCn.status === 202
     && laLoi(chuaCn, 'khong_khop_cua_hang') && chuaCn.goi.map(g => g.ten).join() === 'kho_ipos_tim_chi_nhanh,signOut'
     && /không có chi nhánh nào khớp brand_id \/ store_id/.test(log.at(-1)), log.at(-1));

  const luu = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb) as v`, [cnA.id, JSON.stringify({
    bat: true, pos_parent: BRAND, pos_id: STORE, vi_tri_ban_id: viTriQuay })]);
  ok('Chủ bật kết nối iPOS chi nhánh A với mã thương hiệu / mã cửa hàng', luu.loi === null && luu.rows[0].v.cau_hinh_du === true, luu.loi ?? '');

  const x = hoaDonDw('A2', [{ item_id: 'BACHI', quantity: 0.45 }, { item_id: 'BACHI', quantity: 0.3 }, { item_id: 'PHO', quantity: 2 }]);
  HD_WEBHOOK = x;
  const r1 = await hook(JSON.stringify(x), { loai: 'text/plain' });
  ok('Hóa đơn (kể cả "text/plain") → 200 {"data": true} đúng tài liệu', r1.status === 200 && r1.json?.data === true
     && Object.keys(r1.json).join() === 'data', JSON.stringify(r1.json));
  const tim = r1.goi.find(g => g.ten === 'kho_ipos_tim_chi_nhanh');
  const nhan = r1.goi.find(g => g.ten === 'kho_ipos_nhan_callback');
  ok('Gọi kho_ipos_tim_chi_nhanh(brand_id, store_id) rồi kho_ipos_nhan_callback(chi nhánh, HĐ) rồi đăng xuất',
     tim?.thamSo.p_pos_parent === BRAND && tim?.thamSo.p_pos_id === STORE
     && nhan?.thamSo.p_chi_nhanh_id === cnA.id && r1.goi.at(-1).ten === 'signOut', JSON.stringify(r1.goi.map(g => g.ten)));
  const p = nhan?.thamSo.p_hoa_don ?? {};
  ok('Tham số HĐ: ma_hd = sale_id, 3 dòng so_luong, không thông tin khách / nhân viên / thanh toán', p.ma_hd === 'A2' && p.dong?.length === 3
     && p.dong.map(d => d.so_luong).join() === '0.45,0.3,2' && coPii(p).length === 0, JSON.stringify(p).slice(0, 300));
  const hd = await hoaDonDb('A2');
  ok('Database: HĐ vào hộp thư đúng giờ bán, 3 dòng, raw không thông tin khách', hd && (await dongCua('A2')).length === 3
     && coPii(hd.raw).length === 0 && new Date(hd.thoi_diem_ban).getTime() === Date.parse(mocVn(20).iso), JSON.stringify(hd?.raw).slice(0, 200));

  const r2 = await hook(x);
  const dem = (await db.query(`select count(*)::int as n from kho_ipos_dong where chi_nhanh_id = $1`, [cnA.id])).rows[0].n;
  ok('iPOS gửi TRÙNG → 200, không thêm dòng nào', r2.status === 200 && r2.json?.data === true && dem === 3, String(dem));

  const sua = await hook({ ...x, datastate: 1, sale_detail: x.sale_detail.slice(0, 2) });
  const dSua = await dongCua('A2');
  ok('Sửa cùng sale_id (bỏ một dòng) → 200; database ghi lần sửa, dòng bị bỏ thành da_huy', sua.status === 200
     && (await hoaDonDb('A2')).so_lan_sua === 1 && dSua.find(d => d.khoa_dong === 'SD-A2-2')?.trang_thai === 'da_huy'
     && dSua.filter(d => d.trang_thai !== 'da_huy').length === 2, JSON.stringify(dSua));
  const x3 = hoaDonDw('A3', [{ item_id: 'BACHI', quantity: 1 }]);
  await hook(x3);
  const xoa = await hook({ ...x3, datastate: 2 });
  ok('Xóa (datastate 2) → 200; hóa đơn da_huy, dòng da_huy', xoa.status === 200 && (await hoaDonDb('A3')).da_huy === true
     && (await dongCua('A3')).every(d => d.trang_thai === 'da_huy'), JSON.stringify(await dongCua('A3')));
  // Sửa hóa đơn đã in trên FABi — iPOS xác nhận 27/10/2026: tạo sale_id MỚI có origin_sale_id trỏ hóa đơn
  // cũ, và gửi lại hóa đơn cũ với datastate = 2. Kho chỉ được còn hàng của hóa đơn mới, đến theo thứ tự nào cũng vậy.
  const dangCo = async ma => (await dongCua(ma)).filter(d => d.trang_thai !== 'da_huy');
  for (const [goc, moi, xoaTruoc] of [['G1', 'G2', false], ['H1', 'H2', true]]) {
    const hdGoc = hoaDonDw(goc, [{ item_id: 'BACHI', quantity: 1 }]);
    const hdMoi = hoaDonDw(moi, [{ item_id: 'BACHI', quantity: 2 }], { datastate: 1, them: { origin_sale_id: goc } });
    const kq = [await hook(hdGoc)];
    if (xoaTruoc) kq.push(await hook({ ...hdGoc, datastate: 2 }), await hook(hdMoi));
    else kq.push(await hook(hdMoi), await hook({ ...hdGoc, datastate: 2 }));
    const conGoc = await dangCo(goc);
    const conMoi = await dangCo(moi);
    ok(`Sửa hóa đơn kiểu FABi (sale_id mới + hóa đơn cũ datastate 2${xoaTruoc ? ', bản xóa đến TRƯỚC' : ''}) → chỉ còn hàng của hóa đơn mới, không trừ hai lần`,
       kq.every(r => r.status === 200) && (await hoaDonDb(goc)).da_huy === true && conGoc.length === 0
       && (await hoaDonDb(moi)).da_huy === false && conMoi.length === 1 && Number(conMoi[0].so_luong) === 2
       && (await hoaDonDb(moi)).raw?.origin_sale_id === goc, JSON.stringify({ conGoc, conMoi, ma: kq.map(r => r.status) }));
  }
  const thuong = await hook(hoaDonDw('A4', [], { brand: BRAND.toLowerCase() }));
  ok('brand_id khác hoa thường vẫn khớp chi nhánh', thuong.status === 200 && !!(await hoaDonDb('A4')));

  const khongMay = await hook(hoaDonDw('A5', []), { env: { ...ENV, KHO_IPOS_MAT_KHAU: undefined } });
  ok('Thiếu tài khoản máy → 503', khongMay.status === 503 && khongMay.goi.length === 0 && laLoi(khongMay, 'chua_cai'));
  const saiMk = await hook(hoaDonDw('A5', []), { client: clientGia(MAY, { matKhauDung: 'khac' }) });
  ok('Máy sai mật khẩu → 503, không gọi RPC', saiMk.status === 503 && saiMk.goi.length === 0);
  const clientLoi = { goi: [], rpc: async (ten) => ten === 'kho_ipos_tim_chi_nhanh' ? { data: cnA.id, error: null }
      : { data: null, error: { message: 'connection reset' } },
    auth: { signInWithPassword: async () => ({ data: { session: {} }, error: null }), signOut: async () => ({}) } };
  const r500 = await hook(hoaDonDw('A6', []), { client: clientLoi });
  ok('Lỗi database khi nhận → 500 (iPOS gửi lại), không bao giờ {"data": true}', r500.status === 500 && laLoi(r500, 'loi_may_chu'));
  const clientNem = { goi: [], rpc: async () => { throw new Error(`fetch failed ${TEN_TS}=${TOKEN_GIA}`); },
    auth: { signInWithPassword: async () => ({ data: { session: {} }, error: null }), signOut: async () => ({}) } };
  const rNem = await hook(hoaDonDw('A6', []), { client: clientNem });
  ok('fetch tới database ném lỗi (mất mạng) → 500, log không chứa token', rNem.status === 500 && !log.at(-1).includes(TOKEN_GIA), log.at(-1));
  const mayB = await hook(hoaDonDw('A7', []), { client: clientGia(UID_MAY_IPOS.mayIposB) });
  ok('Máy chi nhánh B không tìm thấy chi nhánh A → 202, không ghi', mayB.status === 202 && !(await hoaDonDb('A7')));
  const sDb = await hook(hoaDonDw('A8', [{ item_id: 'X', quantity: 1, sale_detail_id: 'k'.repeat(150) }]));
  ok('Dòng hợp lệ ở web → database nhận (khoa_dong dài bị cắt ở database, không lỗi)', sDb.status === 200, JSON.stringify(sDb.json));

  // Dùng lại phiên máy giữa các lần iPOS gọi (tránh giới hạn đăng nhập Supabase Auth).
  const demDN = { vao: 0, ra: 0 };
  const taoNho = (hetGiay) => {
    const c = clientGia(MAY);
    c.auth.signInWithPassword = async () => { demDN.vao++; return { data: { session: { access_token: 'x', expires_at: hetGiay } }, error: null }; };
    c.auth.signOut = async () => { demDN.ra++; return { error: null }; };
    return c;
  };
  const cNho = taoNho(Math.floor(Date.now() / 1000) + 3600);
  const goiNho = async (ma) => (await xuLyHookIpos(yeuCau(hoaDonDw(ma, [])), KHOA_GIA,
    { env: ENV, taoClient: () => cNho, ghiLog, nhoPhien: true })).status;
  const s1 = await goiNho('N1'); const s2 = await goiNho('N2'); const s3 = await goiNho('N3');
  ok('Nhớ phiên: 3 hóa đơn liền → đăng nhập 1 lần, không đăng xuất', s1 === 200 && s2 === 200 && s3 === 200
     && demDN.vao === 1 && demDN.ra === 0, JSON.stringify({ s1, s2, s3, ...demDN }));
  quenPhienMay();
  const cSapHet = taoNho(Math.floor(Date.now() / 1000) + 60);
  demDN.vao = 0; demDN.ra = 0;
  const goiSapHet = async (ma) => (await xuLyHookIpos(yeuCau(hoaDonDw(ma, [])), KHOA_GIA,
    { env: ENV, taoClient: () => cSapHet, ghiLog, nhoPhien: true })).status;
  await goiSapHet('N4'); await goiSapHet('N5');
  ok('Phiên sắp hết hạn (< 2 phút) → đăng nhập lại, đăng xuất phiên cũ', demDN.vao === 2 && demDN.ra === 1, JSON.stringify(demDN));
  quenPhienMay();

  const tatCa = log.join('\n');
  ok('Log không chứa khóa, token, mật khẩu, thông tin khách', !tatCa.includes(KHOA_GIA) && !tatCa.includes(TOKEN_GIA)
     && !tatCa.includes(ENV.KHO_IPOS_MAT_KHAU) && coPii(tatCa).length === 0, tatCa.slice(0, 400));

  const route = readFileSync(join(GOC, 'web/src/pages/hook/ipos/[khoa].ts'), 'utf8');
  ok('Route web/src/pages/hook/ipos/[khoa].ts: ngoài /noi-bo, gọi xuLyHookIpos, không gọi database trực tiếp',
     /export const ALL/.test(route) && /xuLyHookIpos\(/.test(route) && !/\.rpc\(|\.from\(/.test(route) && /prerender = false/.test(route));
});

// ===========================================================================
const luiLuot = () => db.query(`update kho_ipos_lan_chay set bat_dau_luc = bat_dau_luc - interval '5 minutes'`);
const mocKeo = async () => (await db.query(`select dong_bo_den_luc, lan_cuoi_loi, dang_chay_tu from kho_ipos_cau_hinh where chi_nhanh_id = $1`, [cnA.id])).rows[0];

await nhom('6 · dongBoIpos: KÉO BÙ + THỬ LẠI HÀNG CHỜ (PGlite)', async () => {
  await luiLuot();
  const may = clientGia(MAY);
  const k1Moi = hoaDonDw('K1', [{ item_id: 'BACHI', quantity: 0.5 }]);
  const f1 = fetchKeo(trang => ({ data: trang === 1 ? [HD_WEBHOOK, k1Moi] : [] }));
  const truoc = Math.floor(Date.now() / 1000);
  const k1 = await dongBoIpos({ supabase: may, chiNhanhId: cnA.id, nguon: 'cron', env: ENV, fetchFn: f1 });
  const sau = Math.floor(Date.now() / 1000);
  ok('Lượt cron đầu: ok, kéo 2 hóa đơn — 1 đã nhận qua webhook (trùng), 1 mới', k1.ok === true && k1.keo?.so_hd === 2
     && k1.tomTat?.hd_moi === 1 && k1.tomTat?.hd_trung + k1.tomTat?.hd_sua === 1, JSON.stringify(k1).slice(0, 400));
  ok('Thứ tự: bat_dau → nhan([2 HĐ], den_luc) → ket_thuc(null)', may.goi.map(g => g.ten).join() === 'kho_ipos_bat_dau,kho_ipos_nhan,kho_ipos_ket_thuc'
     && may.goi[1].thamSo.p_hoa_don.length === 2 && may.goi[2].thamSo.p_loi === null, may.goi.map(g => g.ten).join());
  const g1 = f1.goi[0];
  ok('Gọi iPOS: trang 1 có hóa đơn, trang 2 rỗng → dừng; store_id, brand_id, page_size 1000; token CHỈ ở header access_token',
     f1.goi.map(g => g.tham.page).join() === '1,2' && f1.goi.every(g => g.token === TOKEN_GIA && !g.url.includes(TOKEN_GIA))
     && g1.tham.store_id === STORE && g1.tham.brand_id === BRAND && g1.tham.page === '1' && g1.tham.page_size === '1000'
     && g1.token === TOKEN_GIA && !g1.url.includes(TOKEN_GIA) && !(TEN_TS in g1.tham), JSON.stringify(g1).replace(TOKEN_GIA, '***'));
  const tu1 = Number(g1.tham.from_update_time); const den1 = Number(g1.tham.to_update_time);
  ok('Chưa có mốc → kéo 1 giờ vừa qua, tới "bây giờ"', den1 >= truoc && den1 <= sau && den1 - tu1 === 3600, `${tu1} → ${den1}`);
  ok('Lô cuối mang p_den_luc = cuối cửa sổ → mốc dong_bo_den_luc tiến tới đó',
     Date.parse(may.goi[1].thamSo.p_den_luc) === den1 * 1000 && new Date((await mocKeo()).dong_bo_den_luc).getTime() === den1 * 1000);
  ok('Hóa đơn kéo về vào database như hóa đơn webhook', (await dongCua('K1')).length === 1);

  await luiLuot();
  const f2 = fetchKeo(() => ({ data: [{ ...k1Moi, datastate: 2 }] }));
  const k2 = await dongBoIpos({ supabase: clientGia(MAY), chiNhanhId: cnA.id, nguon: 'cron', env: ENV, fetchFn: f2 });
  ok('Lượt sau kéo từ mốc − 15 phút (chồng lên lượt trước)', Number(f2.goi[0]?.tham.from_update_time) === den1 - 900, JSON.stringify(f2.goi[0]?.tham));
  ok('Hóa đơn bị xóa trên iPOS (kéo về datastate 2) → database đảo ngược', k2.ok && k2.tomTat?.hd_huy === 1
     && (await hoaDonDb('K1')).da_huy === true, JSON.stringify(k2.tomTat));

  // Phân trang + hóa đơn hỏng: trang 1 đủ 1000 cái (hỏng hết), trang 2 có 1 cái tốt.
  await luiLuot();
  const mocTruoc = new Date((await mocKeo()).dong_bo_den_luc).getTime();
  const f3 = fetchKeo(trang => ({ data: trang === 1 ? Array.from({ length: 1000 }, () => ({ khong: 'phai hoa don' }))
    : trang === 2 ? [hoaDonDw('K2', [])] : [] }));
  const k3 = await dongBoIpos({ supabase: clientGia(MAY), chiNhanhId: cnA.id, nguon: 'tay', env: ENV, fetchFn: f3 });
  ok('Kéo tiếp từng trang tới trang rỗng', f3.goi.map(g => g.tham.page).join() === '1,2,3', f3.goi.map(g => g.tham.page).join());
  ok('Hóa đơn hỏng → lượt báo lỗi (đèn đỏ) có số và lý do, đủ hai thứ tiếng', k3.ok === false
     && /1000 hóa đơn iPOS không ghi được: Hóa đơn thiếu "sale_id"/.test(k3.cau)
     && /1000 iPOS invoices could not be recorded: The invoice has no "sale_id"/.test(k3.cauEn ?? '') && !/hóa đơn|Hóa đơn/.test(k3.cauEn ?? ''), `${k3.cau} | ${k3.cauEn}`);
  const den3 = Number(f3.goi.at(-1)?.tham.to_update_time) * 1000;
  ok('…nhưng KHÔNG kẹt mốc: hóa đơn tốt vào database, mốc tiến tới cuối cửa sổ', !!(await hoaDonDb('K2'))
     && new Date((await mocKeo()).dong_bo_den_luc).getTime() === den3 && den3 >= mocTruoc
     && /không ghi được/.test((await mocKeo()).lan_cuoi_loi ?? ''), JSON.stringify(await mocKeo()));
  ok('Màn tiếng Anh dịch lại được lỗi trong nhật ký', /could not be recorded: The invoice has no "sale_id"/.test(dichLoiIpos((await mocKeo()).lan_cuoi_loi, 'en')),
     dichLoiIpos((await mocKeo()).lan_cuoi_loi, 'en'));

  // Mất mạng: fetch ném lỗi (câu lỗi lỡ chứa token) → không tiến mốc, vẫn thử lại hàng chờ.
  await luiLuot();
  const mocTruoc4 = (await mocKeo()).dong_bo_den_luc;
  const nem = async () => { throw new Error(`fetch failed: connect ECONNREFUSED (${TEN_TS}: ${TOKEN_GIA})`); };
  const may4 = clientGia(MAY);
  const k4 = await dongBoIpos({ supabase: may4, chiNhanhId: cnA.id, nguon: 'tay', env: ENV, fetchFn: nem });
  const loiGui = may4.goi.find(g => g.ten === 'kho_ipos_ket_thuc')?.thamSo.p_loi ?? '';
  ok('fetch ném lỗi → ok=false, "Không kéo được hóa đơn iPOS", câu đã xóa token', k4.ok === false && !k4.cau.includes(TOKEN_GIA)
     && /Không kéo được hóa đơn iPOS/.test(k4.cau) && !(k4.cauEn ?? '').includes(TOKEN_GIA), k4.cau);
  ok('Câu gửi kho_ipos_ket_thuc đã xóa token (≤ 300 ký tự)', loiGui && !loiGui.includes(TOKEN_GIA) && loiGui.length <= 300, loiGui);
  ok('Kéo hỏng ngay cửa sổ đầu → câu không nói "iPOS không có hóa đơn" (câu lỗi nói thay)', !/không có hóa đơn nào mới/.test(k4.cau)
     && !/no recently updated/.test(k4.cauEn ?? ''), k4.cau);
  ok('Mất mạng → KHÔNG tiến mốc; vẫn gọi kho_ipos_nhan([], null) để thử lại hàng chờ',
     String((await mocKeo()).dong_bo_den_luc) === String(mocTruoc4)
     && may4.goi.some(g => g.ten === 'kho_ipos_nhan' && JSON.stringify(g.thamSo.p_hoa_don) === '[]' && g.thamSo.p_den_luc === null));
  const cf4 = await mocKeo();
  ok('Cấu hình: có lỗi (không token), khóa lượt đã nhả', cf4.lan_cuoi_loi && !cf4.lan_cuoi_loi.includes(TOKEN_GIA) && cf4.dang_chay_tu === null);

  const thu = async (fetchFn) => { await luiLuot(); return dongBoIpos({ supabase: clientGia(MAY), chiNhanhId: cnA.id, nguon: 'tay', env: ENV, fetchFn }); };
  const k401 = await thu(fetchKeo(() => 'Unauthorized', 401));
  ok('HTTP 401 → "iPOS trả lỗi HTTP 401", không URL', /HTTP 401/.test(k401.cau) && !/https?:/.test(k401.cau) && /HTTP 401 error/.test(k401.cauEn), k401.cau);
  const k500 = await thu(fetchKeo(() => 'loi', 500));
  ok('HTTP 500 của iPOS → lỗi, không báo xong', k500.ok === false && /HTTP 500/.test(k500.cau));
  const kChan = await thu(fetchKeo(() => ({ error: { message: 'IP Blocked or Access Denied! TrackId: 9', code: 1401 } })));
  ok('iPOS báo lỗi trong JSON (chặn IP / sai token) → "mã 1401", không chép câu của iPOS', kChan.ok === false
     && /mã 1401/.test(kChan.cau) && !/Blocked|TrackId/.test(kChan.cau), kChan.cau);
  const kRac = await thu(fetchKeo(() => '<html>bao tri</html>'));
  ok('Trả về không phải JSON (trang bảo trì) → lỗi rõ', kRac.ok === false && /không phải JSON/.test(kRac.cau), kRac.cau);
  const kKhongData = await thu(fetchKeo(() => ({ ok: 1 })));
  ok('JSON thiếu "data" → lỗi rõ, không tiến mốc', kKhongData.ok === false && /khóa "data"/.test(kKhongData.cau), kKhongData.cau);

  // iPOS ngầm trả ít hơn page_size: vẫn kéo tới trang rỗng, không bỏ sót.
  await db.query(`update kho_ipos_cau_hinh set dong_bo_den_luc = now() - interval '10 minutes' where chi_nhanh_id = $1`, [cnA.id]);
  const trangNho = { 1: ['P1', 'P2'], 2: ['P3', 'P4'], 3: ['P5'] };
  const fNho = fetchKeo(trang => ({ data: (trangNho[trang] ?? []).map(ma => hoaDonDw(ma, [])) }));
  const kNho = await thu(fNho);
  ok('iPOS ngầm giới hạn 2 hóa đơn / trang → vẫn kéo trang 2, 3 cho tới trang rỗng, đủ 5 hóa đơn', kNho.ok
     && fNho.goi.map(g => g.tham.page).join() === '1,2,3,4' && kNho.keo?.so_tra === 5
     && (await Promise.all(['P1', 'P2', 'P3', 'P4', 'P5'].map(hoaDonDb))).every(Boolean), fNho.goi.map(g => g.tham.page).join());
  const fLap = fetchKeo(() => ({ data: [hoaDonDw('Q1', [])] }));
  const kLap = await thu(fLap);
  ok('Máy chủ bỏ qua tham số page (trang nào cũng y hệt) → dừng ở trang 2, không chép trùng', kLap.ok
     && fLap.goi.length === 2 && kLap.keo?.so_tra === 1, `${fLap.goi.length} · ${kLap.keo?.so_tra}`);

  // Nhiều hóa đơn → gửi database theo lô LO_GUI; chỉ lô cuối mang mốc.
  await luiLuot();
  const nhieu = Array.from({ length: LO_GUI + 50 }, (_, i) => hoaDonDw(`L${i}`, []));
  const mayLo = clientGia(MAY);
  const kLo = await dongBoIpos({ supabase: mayLo, chiNhanhId: cnA.id, nguon: 'tay', env: ENV,
    fetchFn: fetchKeo(trang => ({ data: trang === 1 ? nhieu : [] })) });
  const lo = mayLo.goi.filter(g => g.ten === 'kho_ipos_nhan');
  ok(`${LO_GUI + 50} hóa đơn → ${LO_GUI} + 50 (database nhận ≤ 200 một lần); chỉ lô cuối mang p_den_luc`, kLo.ok && lo.length === 2
     && lo[0].thamSo.p_hoa_don.length === LO_GUI && lo[1].thamSo.p_hoa_don.length === 50 && LO_GUI <= 200
     && lo[0].thamSo.p_den_luc === null && lo[1].thamSo.p_den_luc !== null && kLo.tomTat?.hd_moi === LO_GUI + 50,
     lo.map(g => `${g.thamSo.p_hoa_don.length}:${g.thamSo.p_den_luc}`).join());

  // Lâu không kéo được (5 ngày) → mỗi lượt kéo bù CUA_SO_MOT_LUOT ngày, mốc tiến theo.
  await luiLuot();
  const mot = 24 * 3600_000;
  await db.query(`update kho_ipos_cau_hinh set dong_bo_den_luc = now() - interval '5 days' where chi_nhanh_id = $1`, [cnA.id]);
  const mocLau = new Date((await mocKeo()).dong_bo_den_luc).getTime();
  const f5 = fetchKeo();
  const k5 = await dongBoIpos({ supabase: clientGia(MAY), chiNhanhId: cnA.id, nguon: 'cron', env: ENV, fetchFn: f5 });
  const cs = f5.goi.map(g => [Number(g.tham.from_update_time), Number(g.tham.to_update_time)]);
  ok(`Mất 5 ngày → lượt này kéo ${CUA_SO_MOT_LUOT} cửa sổ một ngày liền nhau, báo còn hóa đơn cũ hơn`, k5.ok && f5.goi.length === CUA_SO_MOT_LUOT
     && cs.every(([a, b]) => b - a === 86400) && cs[1][0] === cs[0][1] && cs[0][0] === Math.floor((mocLau - 15 * 60000) / 1000)
     && k5.keo?.con_lai === true && /lượt sau kéo tiếp/.test(k5.cau), JSON.stringify(cs));
  ok('Mốc tiến đúng tới cuối cửa sổ thứ ba', new Date((await mocKeo()).dong_bo_den_luc).getTime() === cs.at(-1)[1] * 1000);

  await db.query(`update kho_ipos_cau_hinh set dong_bo_den_luc = now() - interval '10 minutes' where chi_nhanh_id = $1`, [cnA.id]);
  const k6 = await thu(fetchKeo(() => ({ data: [hoaDonDw('X1', [], { store: 'CUAHANGKHAC' })] })));
  ok('Hóa đơn của cửa hàng khác trong kết quả kéo → bỏ, đèn đỏ (cấu hình sai), đủ hai thứ tiếng', k6.ok === false
     && /1 hóa đơn của cửa hàng khác/.test(k6.cau) && /1 invoice from another store/.test(k6.cauEn ?? '') && !(await hoaDonDb('X1'))
     && /from another store/.test(dichLoiIpos((await mocKeo()).lan_cuoi_loi, 'en')), `${k6.cau} | ${k6.cauEn}`);

  await luiLuot();
  const may7 = clientGia(MAY);
  const f7 = fetchKeo();
  const k7 = await dongBoIpos({ supabase: may7, chiNhanhId: cnA.id, nguon: 'tay', env: { ...ENV, IPOS_ACCESS_TOKEN: undefined }, fetchFn: f7 });
  ok('Thiếu token → không gọi iPOS, vẫn thử lại hàng chờ (ok), cảnh báo chưa kéo bù được', k7.ok === true && k7.chuaCai === true
     && f7.goi.length === 0 && may7.goi.some(g => g.ten === 'kho_ipos_nhan') && /IPOS_ACCESS_TOKEN/.test(k7.canhBao.join()), JSON.stringify(k7));

  const clientLoi = { rpc: async () => ({ data: null, error: { message: `boom ${TEN_TS}=${TOKEN_GIA}` } }) };
  const kd = await dongBoIpos({ supabase: clientLoi, chiNhanhId: cnA.id, nguon: 'tay', env: ENV, fetchFn: fetchKeo() });
  ok('Lỗi database lỡ chứa token → cũng bị xóa', !kd.cau.includes(TOKEN_GIA), kd.cau);
  const nv = await dongBoIpos({ supabase: clientGia(UID.nvQuayA), chiNhanhId: cnA.id, nguon: 'tay', env: ENV, fetchFn: fetchKeo() });
  ok('NV quầy bấm "Cập nhật ngay" → database từ chối', nv.ok === false && /không đồng bộ được/.test(nv.cau), nv.cau);
  const mayB = await dongBoIpos({ supabase: clientGia(UID_MAY_IPOS.mayIposB), chiNhanhId: cnA.id, nguon: 'cron', env: ENV, fetchFn: fetchKeo() });
  ok('Máy chi nhánh B không đồng bộ chi nhánh A', mayB.ok === false && !mayB.tuChoi, mayB.cau);
});

// ===========================================================================
await nhom('7 · dongBoTatCa (CRON): ĐĂNG NHẬP MÁY → CHI NHÁNH CỦA MÁY → ĐĂNG XUẤT', async () => {
  await luiLuot();
  await db.query(`update kho_ipos_cau_hinh set dang_chay_tu = null, lan_dang_chay = null`);
  const log0 = await dongBoTatCa({}, { taoClient: () => clientGia(MAY), ghiLog: () => {} });
  ok('Thiếu tài khoản máy → 1 dòng log "chưa cài", không làm gì', log0.length === 1 && /chưa cài/.test(log0[0]), log0.join());

  const sai = clientGia(MAY, { matKhauDung: 'khac' });
  const log1 = await dongBoTatCa(ENV, { taoClient: () => sai, ghiLog: () => {} });
  ok('Sai mật khẩu máy → log lỗi, không gọi RPC nào', /không đăng nhập được/.test(log1.join()) && sai.goi.length === 0, log1.join());

  const c = clientGia(MAY);
  const f = fetchKeo();
  const log2 = await dongBoTatCa(ENV, { taoClient: () => c, fetchFn: f, ghiLog: () => {} });
  ok('Máy A: hỏi kho_cn_duoc(dong_bo_ban) → chỉ chi nhánh A → 1 lượt (có kéo bù) → đăng xuất',
     c.goi[0].ten === 'kho_cn_duoc' && c.goi[0].thamSo.p_viec === 'dong_bo_ban'
     && c.goi.filter(g => g.ten === 'kho_ipos_bat_dau').length === 1
     && c.goi.find(g => g.ten === 'kho_ipos_bat_dau').thamSo.p_chi_nhanh_id === cnA.id
     && f.goi.length >= 1 && c.goi.at(-1).ten === 'signOut', c.goi.map(g => g.ten).join());
  ok('Log có kết quả lượt, không token', /Đã cập nhật/.test(log2.join()) && !log2.join().includes(TOKEN_GIA), log2.join());
  await luiLuot();
  const log3 = await dongBoTatCa({ ...ENV, IPOS_ACCESS_TOKEN: undefined }, { taoClient: () => clientGia(MAY), ghiLog: () => {} });
  ok('Thiếu token iPOS → cron VẪN chạy (thử lại hàng chờ)', !/bỏ qua/.test(log3.join()) && /Đã cập nhật/.test(log3.join()), log3.join());

  const cB = clientGia(UID_MAY_IPOS.mayIposB);
  const log4 = await dongBoTatCa(ENV, { taoClient: () => cB, fetchFn: fetchKeo(), ghiLog: () => {} });
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
await nhom('8 · WORKER, WRANGLER, TRANG, KHÔNG TOKEN TRONG REPO', async () => {
  const w = readFileSync(join(GOC, 'web/src/worker.ts'), 'utf8');
  ok('src/worker.ts: fetch chặn /hook/ipos → xuLyHookIpos TRƯỚC handle của adapter; scheduled gọi dongBoTatCa qua waitUntil',
     /from '@astrojs\/cloudflare\/handler'/.test(w) && /async fetch\([\s\S]*startsWith\(DUONG_HOOK\)[\s\S]*xuLyHookIpos\([\s\S]*return handle\(/.test(w)
     && /async scheduled\([^)]*\)\s*\{[\s\S]*waitUntil\(dongBoTatCa\(env\)\)/.test(w));
  const t = readFileSync(join(GOC, 'web/wrangler.toml'), 'utf8');
  ok('wrangler.toml: main = src/worker.ts, crons 5 phút (+ cron báo động lệch 2 phút, 0060), giữ workers_dev / preview_urls = false',
     /^main = "\.\/src\/worker\.ts"$/m.test(t) && /^\[triggers\]\s*\ncrons = \["\*\/5 \* \* \* \*", "2-59\/5 \* \* \* \*"\]$/m.test(t)
     && /^workers_dev = false$/m.test(t) && /^preview_urls = false$/m.test(t));
  ok('wrangler.toml không có [vars] và không có giá trị bí mật', !/^\[vars\]/m.test(t) && !/IPOS_CALLBACK_KHOA\s*=/.test(t));
  const kho = readFileSync(join(GOC, 'web/KHO.md'), 'utf8');
  ok('KHO.md mục 3j: iPOS DW, webhook + kéo bù, IPOS_CALLBACK_KHOA, việc nhờ iPOS, câu hỏi còn mở',
     /iPOS DW - PARTNERS/.test(kho) && /IPOS_CALLBACK_KHOA/.test(kho) && /\/hook\/ipos\//.test(kho) && /get-sales/.test(kho)
     && /mọi hóa đơn/i.test(kho) && /Câu hỏi còn mở/i.test(kho) && /origin_sale_id/.test(kho));
  const trang = readFileSync(join(GOC, 'web/src/pages/noi-bo/kho/cai-dat/ipos.astro'), 'utf8');
  ok('Màn Kết nối iPOS: địa chỉ nhận hóa đơn (chỉ chủ lấy khóa), lần nhận hóa đơn, webhook, MỌI hóa đơn; ô mã thương hiệu / mã cửa hàng; không ô địa chỉ API, không dòng thực đơn',
     /if \(laChu\) \{ try \{ khoa = await layKhoaCallback\(\)/.test(trang) && /nhan_hd_luc/.test(trang)
     && /webhook/.test(trang) && /MỌI hóa đơn/.test(trang) && /t\.maThuongHieu/.test(trang) && /t\.maCuaHang/.test(trang)
     && !/name="duong_dan_hoa_don"/.test(trang) && !/name="api_url"/.test(trang) && !/so_mon_menu|đọc thực đơn|callback_url/.test(trang));
  const ghep = readFileSync(join(GOC, 'web/src/pages/noi-bo/kho/ban-ipos/ghep.astro'), 'utf8');
  ok('Màn Ghép món: Bán theo kg / gói / suất + "mỗi gói = … kg" + thực đơn iPOS có tìm / chia trang',
     /name="don_vi_ban"/.test(ghep) && /name="kg_moi_don_vi"/.test(ghep) && /docMenuIpos/.test(ghep) && /<PhanTrang/.test(ghep));
  ok('Ghép món: bấm "Sửa" chọn sẵn đúng món / kiểu đang ghép (không nhảy về gợi ý)',
     /const dangChon = !cu \?/.test(ghep) && /selected=\{dangChon === 'goi_can'\}/.test(ghep) && /selected=\{dangChon === 'bo_qua'\}/.test(ghep));
  ok('Ghép món không hứa đọc thực đơn mỗi giờ', !/mỗi giờ|every hour/.test(ghep));
  const banIpos = readFileSync(join(GOC, 'web/src/lib/kho/ban-ipos.ts'), 'utf8');
  ok('Ghép món gọi kho_ipos_gan_ma_v2', /rpc\('kho_ipos_gan_ma_v2'/.test(banIpos) && !/rpc\('kho_ipos_gan_ma'/.test(banIpos));
  const dongBo = readFileSync(join(GOC, 'web/src/lib/kho/ipos-dong-bo.ts'), 'utf8');
  ok('Web không còn gọi đọc / lưu thực đơn iPOS (iPOS DW không có API thực đơn)',
     !/kho_ipos_luu_menu|kho_ipos_bao_menu_doi|\/v2\/items/.test(dongBo + readFileSync(join(GOC, 'web/src/lib/kho/ipos-hook.ts'), 'utf8')));

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
  // Kiểu token iPOS: 32 (iPOS Hub) hay 36 (iPOS DW) ký tự IN HOA + số — đứng sau chữ access_token,
  // hoặc trơn trong file có nhắc iPOS.
  const kieuIpos = new RegExp(`${TEN_TS}["'\\s:=]{1,6}[A-Z0-9]{32,40}\\b`);
  const tronIn = new RegExp(`\\b(?=[A-Z0-9]{32,40}\\b)(?=[A-Z]*[0-9])(?=[0-9]*[A-Z])[A-Z0-9]{32,40}\\b`);
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
