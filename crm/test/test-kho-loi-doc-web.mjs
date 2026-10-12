/**
 * BEEFTOWN KHO — Lỗi đọc không được thành "không có" (rà soát nợ kỹ thuật 11/10/2026)
 * ==================================================================================
 *
 *     node test/test-kho-loi-doc-web.mjs
 *
 * Mạng đứt, database trả lỗi giữa chừng: trang phải NÓI là chưa đọc được, không
 * được hiện như thể dữ liệu không có. Từng chỗ đã thấy nuốt lỗi:
 *
 *   · Trả tiền nhà cung cấp (cong-no/[id]/tra-tien.astro): hiện số tài khoản mà
 *     không xét tài khoản vừa đổi; trang NCC (cong-no/[id].astro) đọc nhật ký đổi
 *     tài khoản lỗi thì im — kế toán chuyển tiền vào tài khoản lạ mà không ai nhắc.
 *   · docCongNoMotPhieu / docTenNcc bỏ qua `error` → "không tìm thấy phiếu / NCC".
 *   · docDonChoNhan lỗi gì cũng thành "không có đơn chờ" → nhận hàng không gắn đơn.
 *   · dongBoIpos không kiểm kết quả kho_ipos_ket_thuc → khóa lượt treo 10 phút,
 *     nhật ký không ghi, mà vẫn báo xong.
 *
 * Client giả (không mạng) cho từng kiểu hỏng; PGlite cho đường đọc thật (quyền,
 * nhật ký đổi tài khoản do trigger database ghi).
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — LỖI ĐỌC KHÔNG THÀNH "KHÔNG CÓ"');

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web', 'src');
const doc = p => (existsSync(join(WEB, p)) ? readFileSync(join(WEB, p), 'utf8') : '');

// Nhập cả module (không nhập tên lẻ): hàm chưa có thì kiểm tra đỏ, file vẫn chạy hết.
const congNo = await import(join(WEB, 'lib', 'kho', 'cong-no.ts'));
const datHang = await import(join(WEB, 'lib', 'kho', 'dat-hang.ts'));
const iposDongBo = await import(join(WEB, 'lib', 'kho', 'ipos-dong-bo.ts'));
const { dichCau } = await import(join(WEB, 'lib', 'cau-noi-bo.ts'));

const U = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const LOI_MANG = { message: 'TypeError: fetch failed', details: '', hint: '', code: '' };
const LOI_HET_GIO = { message: 'AbortError: quá 20 giây không trả lời', details: '', hint: '', code: '' };

/**
 * Client giả cho đường .from(bang).select().eq()…: `tra(bang)` cho { data, error }
 * (hoặc ném). Ghi lại mọi bảng đã đọc.
 */
function clientBang(tra) {
  const doc = [];
  const from = bang => {
    doc.push(bang);
    const q = {};
    for (const ten of ['select', 'eq', 'in', 'order', 'limit', 'range', 'gt', 'gte', 'lte', 'or', 'not']) q[ten] = () => q;
    q.maybeSingle = async () => tra(bang);
    q.single = async () => tra(bang);
    q.then = (a, b) => Promise.resolve().then(() => tra(bang)).then(a, b);
    return q;
  };
  return { from, doc };
}

const form = obj => {
  const m = new Map(Object.entries(obj));
  return { get: k => (m.has(k) ? m.get(k) : null), getAll: k => (m.has(k) ? [m.get(k)] : []) };
};

// ===========================================================================
await nhom('1 · docCongNoMotPhieu / docTenNcc: lỗi đọc ném, không thành "không tìm thấy"', async () => {
  for (const [ten, loi] of [['mạng đứt', LOI_MANG], ['hết giờ', LOI_HET_GIO], ['database 500', { message: 'upstream connect error', code: '' }]]) {
    let nem = null, kq;
    try { kq = await congNo.docCongNoMotPhieu(clientBang(() => ({ data: null, error: loi })), U(1)); } catch (e) { nem = e; }
    ok(`docCongNoMotPhieu, ${ten} → ném lỗi (không trả null như "không có phiếu")`, nem !== null, `trả ${JSON.stringify(kq)}`);
    nem = null;
    try { kq = await congNo.docTenNcc(clientBang(() => ({ data: null, error: loi })), U(2)); } catch (e) { nem = e; }
    ok(`docTenNcc, ${ten} → ném lỗi (không trả null như "không có NCC")`, nem !== null, `trả ${JSON.stringify(kq)}`);
  }
  ok('docCongNoMotPhieu: không có dòng, không lỗi → null (không tìm thấy thật)',
     (await congNo.docCongNoMotPhieu(clientBang(() => ({ data: null, error: null })), U(1))) === null);
  ok('docTenNcc: không có dòng, không lỗi → null',
     (await congNo.docTenNcc(clientBang(() => ({ data: null, error: null })), U(2))) === null);
  const khongGoi = clientBang(() => { throw new Error('không được gọi database'); });
  ok('Mã không phải uuid → null, không gọi database', (await congNo.docCongNoMotPhieu(khongGoi, 'x')) === null
     && (await congNo.docTenNcc(khongGoi, 'x')) === null && khongGoi.doc.length === 0);

  // doiChieuHoaDon đọc lại tổng phiếu trước khi ghi: đọc lỗi thì nói chưa ghi, không nói "không tìm thấy".
  const ghiRpc = [];
  const c = clientBang(() => ({ data: null, error: LOI_MANG }));
  c.rpc = async (ham) => { ghiRpc.push(ham); return { data: null, error: null }; };
  const kq = await congNo.doiChieuHoaDon(c, U(1), form({ so_hoa_don: 'HD01', tien_hoa_don: '1.000.000', ngay_hoa_don: '', han_thanh_toan: '', ghi_chu_doi_chieu: '' }));
  ok('doiChieuHoaDon, đọc phiếu lỗi mạng → ok:false, không gọi kho_doi_chieu_hoa_don', kq.ok === false && ghiRpc.length === 0, JSON.stringify(kq));
  ok('… câu báo không nói "không tìm thấy phiếu"', !/Không tìm thấy phiếu/.test(kq.cau) && !/not in payables/.test(kq.cauEn ?? ''), kq.cau);
  ok('… câu báo nói chưa ghi gì, có bản tiếng Anh', /[Cc]hưa ghi/.test(kq.cau) && /not saved|Nothing was saved/i.test(kq.cauEn ?? dichCau('en', kq.cau)),
     `${kq.cau} / ${kq.cauEn}`);
  ok('… giữ lại chữ vừa gõ (giaTri)', kq.giaTri?.so_hoa_don === 'HD01');
});

// ===========================================================================
await nhom('2 · docTenNccTrang: bốn trang NCC phân biệt "không có" và "chưa đọc được"', async () => {
  ok('cong-no.ts có docTenNccTrang', typeof congNo.docTenNccTrang === 'function');
  if (typeof congNo.docTenNccTrang !== 'function') return;
  const loi = await congNo.docTenNccTrang(clientBang(() => ({ data: null, error: LOI_MANG })), U(2));
  ok('Lỗi mạng → không có ncc, câu báo "không đọc được", ok:false', loi.ncc === null && loi.bao?.ok === false
     && /Không đọc được nhà cung cấp/.test(loi.bao.cau), JSON.stringify(loi));
  ok('… nói rõ chưa ghi gì (trang Trả tiền có thể đang gửi form)', /Chưa ghi gì/.test(loi.bao?.cau ?? ''));
  ok('… có bản tiếng Anh', /Could not read this supplier/.test(loi.bao?.cauEn ?? '') && /Nothing was saved/.test(loi.bao?.cauEn ?? ''), loi.bao?.cauEn);
  const khong = await congNo.docTenNccTrang(clientBang(() => ({ data: null, error: null })), U(2));
  ok('Không có dòng → "Không tìm thấy nhà cung cấp này." (câu cũ, vi/en)', khong.ncc === null
     && khong.bao?.cau === 'Không tìm thấy nhà cung cấp này.' && khong.bao?.cauEn === 'This supplier was not found.', JSON.stringify(khong));
  const ncc = { id: U(2), ten: 'NCC A', so_ngay_no: 7, ngan_hang: 'VCB', so_tai_khoan: '0011', ma_so_thue: null, dia_chi: null, kieu_hoa_don: 'tung_lan' };
  const co = await congNo.docTenNccTrang(clientBang(() => ({ data: ncc, error: null })), U(2));
  ok('Có dòng → ncc, không câu báo', co.ncc?.ten === 'NCC A' && !co.bao);

  for (const trang of ['cong-no/[id].astro', 'cong-no/[id]/tra-tien.astro', 'cong-no/[id]/hoa-don-gop.astro', 'cong-no/[id]/doi-chieu.astro']) {
    const ma = doc(`pages/noi-bo/kho/${trang}`);
    ok(`${trang}: đọc NCC bằng docTenNccTrang (không gọi docTenNcc trần)`, /docTenNccTrang\(/.test(ma) && !/await docTenNcc\(/.test(ma));
  }
});

// ===========================================================================
await nhom('3 · Cảnh báo đổi tài khoản: có ở màn Trả tiền; đọc lỗi thì nói "chưa kiểm được"', async () => {
  ok('cong-no.ts có docCanhBaoTaiKhoan', typeof congNo.docCanhBaoTaiKhoan === 'function');
  if (typeof congNo.docCanhBaoTaiKhoan !== 'function') return;
  const bay = Date.parse('2026-10-11T03:00:00Z');
  const vuaDoi = { id: '1', ngan_hang_cu: 'VCB', so_tai_khoan_cu: '0011', ngan_hang_moi: 'ACB', so_tai_khoan_moi: '9988', nguoi_doi: null, luc: '2026-10-05T03:00:00Z' };

  for (const [ten, tra] of [['mạng đứt', () => ({ data: null, error: LOI_MANG })], ['hết giờ', () => ({ data: null, error: LOI_HET_GIO })],
                            ['client ném', () => { throw new Error('fetch failed'); }]]) {
    let kq, nem = null;
    try { kq = await congNo.docCanhBaoTaiKhoan(clientBang(tra), U(2), bay); } catch (e) { nem = e; }
    ok(`Nhật ký đọc lỗi (${ten}) → chuaKiem: true, không ném, không giả là "không đổi"`, nem === null && kq?.chuaKiem === true && kq?.doi === null,
       nem ? nem.message : JSON.stringify(kq));
  }
  const doi = await congNo.docCanhBaoTaiKhoan(clientBang(() => ({ data: [vuaDoi], error: null })), U(2), bay);
  ok('Đổi thật trong 30 ngày → doi, chuaKiem: false', doi.doi?.id === '1' && doi.chuaKiem === false, JSON.stringify(doi));
  const cu = await congNo.docCanhBaoTaiKhoan(clientBang(() => ({ data: [{ ...vuaDoi, luc: '2026-08-01T00:00:00Z' }], error: null })), U(2), bay);
  ok('Đổi quá 30 ngày → không cảnh báo', cu.doi === null && cu.chuaKiem === false);
  const dau = await congNo.docCanhBaoTaiKhoan(clientBang(() => ({ data: [{ ...vuaDoi, so_tai_khoan_cu: null, ngan_hang_cu: null }], error: null })), U(2), bay);
  ok('Điền tài khoản lần đầu → không cảnh báo', dau.doi === null && dau.chuaKiem === false);
  const khongGoi = clientBang(() => { throw new Error('không được gọi'); });
  const sai = await congNo.docCanhBaoTaiKhoan(khongGoi, 'x', bay);
  ok('Mã NCC không phải uuid → không gọi database, không cảnh báo', khongGoi.doc.length === 0 && sai.doi === null && sai.chuaKiem === false);

  const tt = doc('pages/noi-bo/kho/cong-no/[id]/tra-tien.astro');
  const ncc = doc('pages/noi-bo/kho/cong-no/[id].astro');
  const tp = doc('components/kho/CanhBaoTaiKhoan.astro');
  ok('Màn Trả tiền đọc cảnh báo đổi tài khoản và hiện nó', /docCanhBaoTaiKhoan\(/.test(tt) && /<CanhBaoTaiKhoan\b/.test(tt));
  ok('Trang NCC dùng cùng hàm và cùng khối hiện', /docCanhBaoTaiKhoan\(/.test(ncc) && /<CanhBaoTaiKhoan\b/.test(ncc));
  ok('Trang NCC không còn nuốt lỗi đọc nhật ký (.catch(() => []))', !/docNhatKyTaiKhoan\([^)]*\)\.catch\(/.test(ncc));
  ok('Màn Trả tiền: cảnh báo đứng NGAY dưới dòng số tài khoản, trước form', tt.indexOf('<CanhBaoTaiKhoan') > tt.indexOf('t.chuyenKhoan')
     && tt.indexOf('<CanhBaoTaiKhoan') < tt.indexOf('<form'));
  ok('Khối cảnh báo: đổi thật → đỏ role="alert"; chưa kiểm được → nói rõ, role="alert"',
     /nb-bao loi/.test(tp) && (tp.match(/role="alert"/g) ?? []).length >= 2);
  ok('Khối cảnh báo: câu "Chưa kiểm được tài khoản ngân hàng có vừa đổi không" có bản tiếng Anh',
     /Chưa kiểm được tài khoản ngân hàng có vừa đổi không/.test(tp) && /Could not check whether the bank account was changed recently/.test(tp));
  ok('Khối cảnh báo: cả hai trường hợp đều dặn gọi hỏi lại NCC trước khi chuyển tiền',
     /Gọi điện hỏi lại nhà cung cấp/.test(tp) && /Call the supplier/.test(tp));
});

// ===========================================================================
await nhom('4 · Vòng thật trên PGlite: nhật ký đổi tài khoản do database ghi → cảnh báo', async () => {
  if (typeof congNo.docCanhBaoTaiKhoan !== 'function') { ok('docCanhBaoTaiKhoan có để chạy vòng thật', false); return; }
  const { db, duoi } = await dungDatabase();
  /** Client PGlite tối giản cho .from(bang).select(cot).eq(cot, gt).order().limit(). */
  const clientPg = uid => ({
    from(bang) {
      const s = { cot: '*', loc: [], gioiHan: null, thuTu: [] };
      const q = {
        select(c) { s.cot = c; return q; },
        eq(c, v) { s.loc.push([c, v]); return q; },
        order(c, o = {}) { s.thuTu.push(`${c} ${o.ascending === false ? 'desc' : 'asc'}`); return q; },
        limit(n) { s.gioiHan = n; return q; },
        async maybeSingle() { const r = await chay(); return { data: r.data?.[0] ?? null, error: r.error }; },
        then(a, b) { return chay().then(a, b); },
      };
      const chay = async () => {
        const where = s.loc.map(([c], i) => `${c} = $${i + 1}`).join(' and ');
        const sql = `select ${s.cot} from ${bang}${where ? ` where ${where}` : ''}${s.thuTu.length ? ` order by ${s.thuTu.join(', ')}` : ''}${s.gioiHan ? ` limit ${s.gioiHan}` : ''}`;
        const kq = await duoi(uid, sql, s.loc.map(([, v]) => v));
        return kq.loi ? { data: null, error: { message: kq.loi } } : { data: kq.rows, error: null };
      };
      return q;
    },
  });
  const ncc = (await duoi(UID.keToanA, `insert into kho_nha_cung_cap (ten, ngan_hang, so_tai_khoan) values ('NCC đổi TK', 'VCB', '0011 2233') returning id`)).rows?.[0]?.id;
  ok('Chuẩn bị: NCC có số tài khoản', !!ncc);
  const truoc = await congNo.docCanhBaoTaiKhoan(clientPg(UID.keToanA), ncc, Date.now());
  ok('Mới điền tài khoản lần đầu → không cảnh báo', truoc.doi === null && truoc.chuaKiem === false, JSON.stringify(truoc));
  const sua = await duoi(UID.keToanA, `update kho_nha_cung_cap set ngan_hang = 'ACB', so_tai_khoan = '9988 7766' where id = $1`, [ncc]);
  ok('Kế toán đổi tài khoản', sua.loi === null, sua.loi ?? '');
  const sau = await congNo.docCanhBaoTaiKhoan(clientPg(UID.keToanA), ncc, Date.now());
  ok('Vừa đổi → cảnh báo, số cũ / số mới đúng như database ghi', sau.doi?.so_tai_khoan_cu === '0011 2233' && sau.doi?.so_tai_khoan_moi === '9988 7766'
     && sau.chuaKiem === false, JSON.stringify(sau));
  const tk = await congNo.docCanhBaoTaiKhoan(clientPg(UID.thuKhoA), ncc, Date.now());
  ok('Thủ kho (không xem nhật ký được) → không cảnh báo, không lỗi (RLS lọc, không phải lỗi đọc)', tk.doi === null && tk.chuaKiem === false, JSON.stringify(tk));

  // docCongNoMotPhieu / docTenNcc: vai khác không lỗi, chỉ rỗng (đổi sang "ném khi lỗi" không làm hỏng trang thủ kho).
  const tkNcc = await congNo.docTenNcc(clientPg(UID.nvQuayA), ncc).then(x => ({ x }), e => ({ e }));
  ok('docTenNcc dưới vai quầy: không ném', !tkNcc.e, tkNcc.e?.message);
  const tkPhieu = await congNo.docCongNoMotPhieu(clientPg(UID.thuKhoA), U(77)).then(x => ({ x }), e => ({ e }));
  ok('docCongNoMotPhieu dưới vai thủ kho: không ném, null', !tkPhieu.e && tkPhieu.x === null, tkPhieu.e?.message);
  await db.close?.();
});

// ===========================================================================
await nhom('5 · docDonChoNhan: lỗi mạng không thành "không có đơn chờ"', async () => {
  const clientRpc = tra => ({ rpc: async () => tra() });
  for (const [ten, tra] of [['mạng đứt', () => ({ data: null, error: LOI_MANG })], ['hết giờ', () => ({ data: null, error: LOI_HET_GIO })],
                            ['database 500', () => ({ data: null, error: { message: 'canceling statement due to statement timeout', code: '57014' } })],
                            ['client ném', () => { throw new Error('fetch failed'); }]]) {
    let nem = null, kq;
    try { kq = await datHang.docDonChoNhan(clientRpc(tra), U(3)); } catch (e) { nem = e; }
    ok(`${ten} → ném lỗi (trang báo chưa đọc được), không trả []`, nem !== null, `trả ${JSON.stringify(kq)}`);
  }
  const quyen = await datHang.docDonChoNhan(clientRpc(() => ({ data: null,
    error: { message: 'Tài khoản của bạn không xem được đơn đặt hàng ở chi nhánh này', code: '42501' } })), U(3));
  ok('Lỗi quyền (42501) → [] như cũ: vai này không nhận theo đơn', Array.isArray(quyen) && quyen.length === 0);

  const trang = doc('pages/noi-bo/kho/nhan-hang/moi.astro');
  ok('Màn nhận hàng bắt lỗi docDonChoNhan và báo, không im', /try\s*\{[^}]*docDonChoNhan/.test(trang) && /catch/.test(trang.slice(trang.indexOf('docDonChoNhan('))));
  ok('Câu báo: chưa đọc được đơn chờ — hàng về theo đơn thì tải lại trước khi nhận (vi/en)',
     /Chưa đọc được các đơn đặt hàng đang chờ/.test(trang) && /Could not read the purchase orders waiting for delivery/.test(trang));
});

// ===========================================================================
await nhom('6 · dongBoIpos: kết thúc lượt lỗi thì không báo xong', async () => {
  /** Supabase giả cho một lượt: bat_dau → nhan → ket_thuc; ket_thuc hỏng `ketThucHong` lần đầu. */
  const supaGia = ({ ketThucHong = 0, ketThucNem = false } = {}) => {
    const goi = [];
    let hong = ketThucHong;
    return {
      goi,
      rpc: async (ten, ts) => {
        goi.push({ ten, ts });
        if (ten === 'kho_ipos_bat_dau') return { data: { duoc: true, lan_id: U(9), menu_luc: new Date().toISOString(), menu_can_lam_moi: false }, error: null };
        if (ten === 'kho_ipos_nhan') return { data: { hd_moi: 0, hd_trung: 0, hd_sua: 0, hd_huy: 0, hd_loi: 0, so_dong: 0, dong: {} }, error: null };
        if (ten === 'kho_ipos_ket_thuc') {
          if (ketThucNem) throw new Error('fetch failed');
          if (hong-- > 0) return { data: null, error: LOI_HET_GIO };
          return { data: { lan_id: U(9), loi: ts.p_loi, da_co: false }, error: null };
        }
        return { data: null, error: { message: `không có ${ten}` } };
      },
    };
  };
  const ENV = { IPOS_ACCESS_TOKEN: undefined };
  const chay = s => iposDongBo.dongBoIpos({ supabase: s, chiNhanhId: U(5), nguon: 'cron', env: ENV, docMenu: false });

  const tot = supaGia();
  const kqTot = await chay(tot);
  ok('Lượt tốt → ok:true, kết thúc lượt đúng một lần', kqTot.ok === true && tot.goi.filter(g => g.ten === 'kho_ipos_ket_thuc').length === 1, kqTot.cau);

  const motLan = supaGia({ ketThucHong: 1 });
  const kqMot = await chay(motLan);
  ok('kho_ipos_ket_thuc lỗi MỘT lần → gọi lại (hàm database gọi lại an toàn), ok:true',
     kqMot.ok === true && motLan.goi.filter(g => g.ten === 'kho_ipos_ket_thuc').length === 2, `${kqMot.cau} · ${motLan.goi.map(g => g.ten).join()}`);

  const hong = supaGia({ ketThucHong: 5 });
  const kqHong = await chay(hong);
  ok('kho_ipos_ket_thuc lỗi mãi → ok:false (không báo đã cập nhật xong)', kqHong.ok === false, kqHong.cau);
  ok('… câu báo nói chưa ghi được kết thúc lượt, lượt sau có thể chờ tới 10 phút',
     /chưa ghi được kết thúc lượt/i.test(kqHong.cau) && /10 phút/.test(kqHong.cau), kqHong.cau);
  ok('… có bản tiếng Anh', /could not record the end of this run/i.test(kqHong.cauEn ?? '') && /10 minutes/.test(kqHong.cauEn ?? ''), kqHong.cauEn);
  ok('… gọi kết thúc tối đa hai lần, không lặp vô hạn', hong.goi.filter(g => g.ten === 'kho_ipos_ket_thuc').length === 2);
  ok('… câu lỗi của database không mang token, nằm trong ngoặc', /\(AbortError: quá 20 giây không trả lời\)/.test(kqHong.cau), kqHong.cau);

  const nem = supaGia({ ketThucNem: true });
  const kqNem = await chay(nem);
  ok('kho_ipos_ket_thuc ném → ok:false, không ném ra ngoài', kqNem.ok === false, kqNem.cau);

  // Cron dongBoTatCa: kết thúc lượt hỏng thì log nói ra, không ghi "Đã cập nhật" trơn.
  const sCron = supaGia({ ketThucHong: 5 });
  const mayCron = {
    rpc: async (ten, ts) => (ten === 'kho_cn_duoc' ? { data: [U(5)], error: null } : sCron.rpc(ten, ts)),
    auth: {
      signInWithPassword: async () => ({ data: { session: { access_token: 'x', expires_at: Math.floor(Date.now() / 1000) + 3600 } }, error: null }),
      signOut: async () => ({ error: null }),
    },
  };
  const log = await iposDongBo.dongBoTatCa({ ...ENV, KHO_IPOS_EMAIL: 'may-ipos@beeftown.test', KHO_IPOS_MAT_KHAU: 'mat-khau-gia' },
    { taoClient: () => mayCron, ghiLog: () => {} }).catch(e => [`NÉM: ${e.message}`]);
  ok('Cron: log có câu "chưa ghi được kết thúc lượt"', log.some(l => /chưa ghi được kết thúc lượt/i.test(l)), log.join(' | '));
});

process.exit(ketThuc('LỖI ĐỌC KHÔNG THÀNH "KHÔNG CÓ"'));
