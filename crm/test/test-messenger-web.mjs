/**
 * BEEFTOWN CRM — Kiểm thử phần WEB của bot Messenger đặt bàn (0052, 0053)
 * ======================================================================
 *
 *     node test/test-messenger-web.mjs
 *     IN_HOI_THOAI=1 node test/test-messenger-web.mjs    in cả bản hội thoại mẫu
 *
 * Phần database nằm ở test-messenger.mjs. File này kiểm:
 *   · lib/messenger.ts (thuần): chữ ký X-Hub-Signature-256, xác minh GET, tách
 *     sự kiện, hiểu ngày / giờ / SĐT / số khách, băm PSID, xóa bí mật khỏi log,
 *     body Send API và Messenger Profile trong giới hạn của Meta;
 *   · lib/messenger-hook.ts với client máy giả + client anon giả + fetch giả:
 *     hội thoại trọn vòng (đặt bàn → tao_dat_ban đúng tham số + utm, hết bàn,
 *     ngày quá khứ, SĐT sai, 9 khách → nhân viên, ngày gõ tay, tra + hủy, khóa
 *     sau 5 lần sai, gặp nhân viên tạm dừng, echo của nhân viên / của bot, bot
 *     tắt), mess_lay_phien đúng một lần mỗi sự kiện khách, không bao giờ cho echo;
 *     log không lộ token / SĐT / PSID;
 *   · chạy thật trên PGlite: đặt bàn qua bot → dat_ban có utm messenger/chatbot,
 *     mess_phien chỉ có PSID đã băm, tra + hủy;
 *   · worker.ts chặn cả hai hook trước Astro; trang /noi-bo/messenger; menu;
 *     trang công khai; README; file mới không bị .gitignore chặn.
 *
 * Bí mật GIẢ dựng lúc chạy — không chuỗi nào trông như bí mật thật nằm nguyên
 * văn trong file.
 */

import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';
import * as M from '../../web/src/lib/messenger.ts';
import {
  xuLyHookMessenger, trangThaiBiMatMess, caiHoSoMessenger, TEN_BI_MAT_MESS, quenDaBao, DUONG_MESSENGER, quenTrangThaiMess,
} from '../../web/src/lib/messenger-hook.ts';
import { timChuoiCam } from '../../web/src/lib/chuoi-cam.js';
import { MUC_NOI_BO } from '../../web/src/lib/dieu-huong-noi-bo.ts';
import { createHmac } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — BOT MESSENGER (PHẦN WEB)');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const IN = !!process.env.IN_HOI_THOAI;

// ---------------------------------------------------------------------------
// Bí mật GIẢ, ghép lúc chạy. Xóa biến môi trường thật trước.
// ---------------------------------------------------------------------------
for (const k of [...Object.values(TEN_BI_MAT_MESS), 'META_APP_ID', 'SITE_URL']) delete process.env[k];
const ghep = (...p) => p.join('');
const APP_SECRET = ghep('app', 'Sec', 'Gia', '9f8e', '7d6c', '5b4a');
const PAGE_TOKEN = ghep('EA', 'A', 'Gia', 'Page', 'Tok', 'Q1w2E3r4T5y6U7i8O9p0');
const VERIFY = ghep('xac', 'Minh', 'Gia', '-', 'A1b2C3d4', 'E5f6G7h8', 'I9j0K1l2');
const KHOA_BAM = ghep('khoa', 'Bam', 'Gia', '-', 'Z9y8X7w6', 'V5u4T3s2', 'R1q0P9o8');
const MAT_KHAU = ghep('mat', 'khau', 'may', 'mess', '-gia-', '77');
const ENV = {
  META_APP_SECRET: APP_SECRET, META_PAGE_TOKEN: PAGE_TOKEN, META_VERIFY_TOKEN: VERIFY,
  MESS_MAY_EMAIL: 'may-mess@beeftown.test', MESS_MAY_MAT_KHAU: MAT_KHAU, MESS_KHOA_BAM: KHOA_BAM,
};
const BI_MAT = [APP_SECRET, PAGE_TOKEN, VERIFY, KHOA_BAM, MAT_KHAU];

// Chủ nhật 27/09/2026, 10:00 giờ Việt Nam.
const BAY_GIO = Date.parse('2026-09-27T03:00:00Z');
const PHUT = 60_000;
const SDT = '0912345678';
const PSID = { a: '7001002003004005', b: '7001002003004006', c: '7001002003004007', d: '7001002003004008',
               e: '7001002003004009', f: '7001002003004010', g: '7001002003004011', h: '7001002003004012' };

// ---------------------------------------------------------------------------
// Client máy giả — giữ phiên theo psid_bam giống 0053
// ---------------------------------------------------------------------------
function mayGia({ dangBat = true, phut = 60, loiChao = 'Chào bạn! Beeftown có thể giúp gì?' } = {}) {
  const st = { cfg: { dang_bat: dangBat, loi_chao: loiChao, phut_tam_dung: phut }, phien: new Map(), goi: [], suKien: [], bayGio: BAY_GIO };
  const LOAI = ['dat_ban', 'dat_ban_that_bai', 'huy_dat_ban', 'hoi_dap', 'gap_nhan_vien', 'nhan_vien_tra_loi', 'loi'];
  const iso = ms => new Date(ms).toISOString();
  const khoa = p => p && p.sai >= 5 && st.bayGio - p.saiTu < 15 * PHUT;
  const moi = () => ({ buoc: 'menu', du_lieu: {}, tamDungDen: 0, sai: 0, saiTu: 0, capNhat: st.bayGio });
  const client = {
    auth: {
      signInWithPassword: async ({ password }) => password === MAT_KHAU
        ? { data: { session: { access_token: 'x', expires_at: Math.floor(Date.now() / 1000) + 3600 } }, error: null }
        : { data: {}, error: { message: 'Invalid login credentials' } },
      signOut: async () => ({ error: null }),
    },
    rpc: async (ten, ts = {}) => {
      st.goi.push({ ten, ts: JSON.parse(JSON.stringify(ts)) });
      if ('p_psid_bam' in ts && !/^[0-9a-f]{64}$/.test(ts.p_psid_bam)) return { data: null, error: { message: 'Mã khách Messenger phải là chuỗi băm 64 ký tự hex' } };
      if (ten === 'mess_lay_phien') {
        const p = st.phien.get(ts.p_psid_bam);
        return { data: { ...st.cfg, phien: p ? {
          buoc: p.buoc, du_lieu: p.du_lieu, tam_dung_den: p.tamDungDen ? iso(p.tamDungDen) : null, dang_tam_dung: p.tamDungDen > st.bayGio,
          tra_cuu_sai: p.sai, bi_khoa: !!khoa(p), khoa_den: khoa(p) ? iso(p.saiTu + 15 * PHUT) : null, cap_nhat: iso(p.capNhat),
        } : null }, error: null };
      }
      if (ten === 'mess_luu_phien') {
        if (ts.p_buoc !== null && !/^[a-z][a-z0-9_]{0,39}$/.test(ts.p_buoc)) return { data: null, error: { message: 'Bước hội thoại không hợp lệ' } };
        if (ts.p_du_lieu !== null && (typeof ts.p_du_lieu !== 'object' || Array.isArray(ts.p_du_lieu) || JSON.stringify(ts.p_du_lieu).length > 4000)) {
          return { data: null, error: { message: 'Dữ liệu phiên phải là đối tượng JSON không quá 4000 byte' } };
        }
        const p = st.phien.get(ts.p_psid_bam) ?? moi();
        if (ts.p_buoc !== null) p.buoc = ts.p_buoc;
        if (ts.p_du_lieu !== null) p.du_lieu = JSON.parse(JSON.stringify(ts.p_du_lieu));
        if (ts.p_tam_dung_phut === 0) p.tamDungDen = 0;
        else if (ts.p_tam_dung_phut !== null) p.tamDungDen = st.bayGio + ts.p_tam_dung_phut * PHUT;
        p.capNhat = st.bayGio;
        st.phien.set(ts.p_psid_bam, p);
        return { data: { ok: true, buoc: p.buoc, du_lieu: p.du_lieu, dang_tam_dung: p.tamDungDen > st.bayGio }, error: null };
      }
      if (ten === 'mess_ghi_tra_cuu') {
        const p = st.phien.get(ts.p_psid_bam) ?? moi();
        if (!ts.p_thanh_cong) {
          if (p.saiTu && st.bayGio - p.saiTu > 15 * PHUT) p.sai = 0;
          p.sai++;
          if (p.sai === 1 || p.sai >= 5) p.saiTu = st.bayGio;
        }
        st.phien.set(ts.p_psid_bam, p);
        return { data: { ok: true, bi_khoa: !!khoa(p), tra_cuu_sai: p.sai }, error: null };
      }
      if (ten === 'mess_xin_dat_ban') {
        if (st.xinLoi) return { data: null, error: { message: 'mất kết nối database' } };
        const p = st.phien.get(ts.p_psid_bam) ?? moi();
        st.phien.set(ts.p_psid_bam, p);
        const nay = M.ngayVn(st.bayGio);
        if (p.datBanLuc !== undefined && st.bayGio - p.datBanLuc < 5_000) return { data: { ok: false, ly_do: 'dang_gui' }, error: null };
        if (p.datBanNgay !== nay) p.datBanDem = 0;
        if (p.datBanDem >= 5) return { data: { ok: false, ly_do: 'qua_luot' }, error: null };
        p.datBanNgay = nay; p.datBanDem++; p.datBanLuc = st.bayGio;
        return { data: { ok: true, con_lai: 5 - p.datBanDem }, error: null };
      }
      if (ten === 'mess_ghi_su_kien') {
        if (!LOAI.includes(ts.p_loai)) return { data: null, error: { message: `Loại sự kiện Messenger không hợp lệ: ${ts.p_loai}` } };
        st.suKien.push(ts.p_loai);
        return { data: { ok: true }, error: null };
      }
      return { data: null, error: { message: 'Chỉ tài khoản máy Messenger mới gọi được hàm này' } };
    },
  };
  return { client, st };
}

// ---------------------------------------------------------------------------
// Client anon giả — các hàm công khai của website (0013)
// ---------------------------------------------------------------------------
const TRUA = ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30'];
const TOI = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

function anonGia({ kin = [], loiDatBan = null, formMo = true, gioChot = true, hienThucDon = false, nemLoi = false, khoaTra = false } = {}) {
  const st = { goi: [], datBan: new Map(), soMa: 0, loiDatBan, formMo, gioChot, hienThucDon, kin: new Set(kin), bayGio: BAY_GIO, khoaTra };
  // 0079: database tự khoá tra / hủy (kể cả IP null — theo số điện thoại và trần toàn cục).
  const KHOA_TRA = { data: null, error: { message: 'Tra cứu bị tạm khoá, vui lòng gọi nhà hàng', code: '23514' } };
  const MA = ['K7M2QX', 'P3R8TW', 'H4N6VZ'];
  const client = {
    rpc: async (ten, ts = {}) => {
      st.goi.push({ ten, ts: JSON.parse(JSON.stringify(ts ?? {})) });
      if (nemLoi) throw new Error('fetch failed');
      const homNay = M.ngayVn(st.bayGio);
      const gioNay = M.gioVnHienTai(st.bayGio);
      switch (ten) {
        case 'lich_trong_theo_ma':
          return { data: [...TRUA.map(g => [g, 'trua']), ...TOI.map(g => [g, 'toi'])].map(([g, b]) => ({
            gio: g + ':00', buoi: b, con_cho: !st.kin.has(ts.p_ngay), da_qua: ts.p_ngay < homNay || (ts.p_ngay === homNay && g <= gioNay),
          })), error: null };
        case 'tao_dat_ban': {
          if (st.loiDatBan) { const m = st.loiDatBan; st.loiDatBan = null; return { data: null, error: { message: m, code: '23514' } }; }
          if (st.dutMang) { st.dutMang = false; return { data: null, error: { message: 'TypeError: fetch failed', details: '', hint: '', code: '' } }; }
          const ma = MA[st.soMa++ % MA.length];
          st.datBan.set(ma, { ma, sdt: ts.p_sdt, ho_ten: ts.p_ho_ten, ngay: ts.p_ngay, gio: ts.p_gio, so_khach: ts.p_so_khach, trang_thai: 'cho_xac_nhan' });
          return { data: [{ dat_ban_id: 'id-' + ma, ma_dat_ban: ma, con_trong: 3 }], error: null };
        }
        // 0079: trả MỘT giá trị jsonb (null = không thấy), không phải mảng dòng.
        case 'tra_cuu_mot_dat_ban': {
          if (st.khoaTra) return KHOA_TRA;
          const d = st.datBan.get(String(ts.p_ma).trim().toUpperCase());
          if (!d || d.sdt !== M.chuanHoaSdt(ts.p_sdt)) return { data: null, error: null };
          return { data: { ma_dat_ban: d.ma, chi_nhanh_ten: 'Beeftown Quận 1', ngay: d.ngay, gio: d.gio + ':00', so_khach: d.so_khach,
            trang_thai: d.trang_thai, ho_ten_che: 'Nguyễn V. A', sdt_che: M.cheSdt(d.sdt) }, error: null };
        }
        // ghi_nhat_ky_tra_cuu: từ 0079 anon không còn quyền gọi — rơi xuống "permission denied" cuối hàm.
        case 'huy_dat_ban': {
          if (st.khoaTra) return KHOA_TRA;
          const d = st.datBan.get(String(ts.p_ma).trim().toUpperCase());
          if (!d || d.sdt !== M.chuanHoaSdt(ts.p_sdt)) return { data: false, error: null };
          if (d.trang_thai === 'da_huy') return { data: null, error: { message: 'Đặt bàn này không huỷ được nữa, vui lòng gọi nhà hàng' } };
          d.trang_thai = 'da_huy';
          return { data: true, error: null };
        }
        case 'noi_dung_cong_khai':
          return { data: { form_dat_ban_dang_mo: st.formMo, gio_phuc_vu_da_chot: st.gioChot, hien_thuc_don: st.hienThucDon,
            dia_chi_hien_thi: '12 Đường Thử, Quận 1, TP.HCM', hotline: '0281234567', google_maps_url: 'https://maps.app.goo.gl/thu' }, error: null };
        case 'chi_nhanh_cong_khai':
          return { data: [{ ma: 'q1', ten: 'Beeftown Quận 1', dia_chi: '12 Đường Thử', dien_thoai: '0281234567', gio_da_chot: st.gioChot,
            trua_bat_dau: st.gioChot ? '11:00:00' : null, trua_ket_thuc: st.gioChot ? '14:00:00' : null,
            toi_bat_dau: st.gioChot ? '17:00:00' : null, toi_ket_thuc: st.gioChot ? '22:00:00' : null }], error: null };
      }
      return { data: null, error: { message: `permission denied for function ${ten}`, code: '42501' } };
    },
  };
  return { client, st };
}

// ---------------------------------------------------------------------------
// fetch giả (Send API / Messenger Profile)
// ---------------------------------------------------------------------------
function fetchGia({ loi = null } = {}) {
  const goi = [];
  const fn = async (url, init) => {
    const u = new URL(url);
    goi.push({ url: String(url), duong: u.origin + u.pathname, token: u.searchParams.get('access_token'), body: JSON.parse(init.body) });
    if (loi) return new Response(JSON.stringify({ error: { message: loi, code: 190 } }), { status: 400, headers: { 'content-type': 'application/json' } });
    return new Response(JSON.stringify({ recipient_id: '1', message_id: 'mid.1', result: 'success' }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  return { fn, goi };
}

// ---------------------------------------------------------------------------
// Webhook có chữ ký
// ---------------------------------------------------------------------------
function yeuCau(obj, { chuKy = 'dung', secret = APP_SECRET } = {}) {
  const body = typeof obj === 'string' ? obj : JSON.stringify(obj);
  const headers = { 'content-type': 'application/json' };
  if (chuKy === 'dung') headers['x-hub-signature-256'] = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
  else if (chuKy === 'sai') headers['x-hub-signature-256'] = 'sha256=' + createHmac('sha256', 'khac-han').update(body).digest('hex');
  return new Request('https://beeftown.vn/hook/messenger', { method: 'POST', headers, body });
}
const bocTin = (...messaging) => ({ object: 'page', entry: [{ id: 'PAGE_ID', time: 1, messaging }] });
const suTin = (psid, chu) => bocTin({ sender: { id: psid }, recipient: { id: 'PAGE_ID' }, timestamp: 1, message: { mid: 'm.' + Math.random(), text: chu } });
const suNut = (psid, payload, chu = 'nút') => bocTin({ sender: { id: psid }, recipient: { id: 'PAGE_ID' }, timestamp: 1, message: { mid: 'm.x', text: chu, quick_reply: { payload } } });
const suPostback = (psid, payload) => bocTin({ sender: { id: psid }, recipient: { id: 'PAGE_ID' }, timestamp: 1, postback: { title: 'nút', payload } });
const suEcho = (psid, them = {}) => bocTin({ sender: { id: 'PAGE_ID' }, recipient: { id: psid }, timestamp: 1, message: { mid: 'm.e', is_echo: true, text: 'Dạ em chào anh', ...them } });

/** Mô tả một body Send API như khách thấy. */
function nhin(body) {
  const m = body.message;
  if (!m) return null;
  const chu = m.text ?? m.attachment?.payload?.text ?? '';
  const nut = (m.attachment?.payload?.buttons ?? []).map(b => `[${b.title}]`).join(' ');
  const qr = (m.quick_replies ?? []).map(q => q.content_type === 'user_phone_number' ? '(số trong Facebook)' : q.title).join(' | ');
  return chu + (nut ? `\n      nút: ${nut}` : '') + (qr ? `\n      chọn nhanh: ${qr}` : '');
}

const LOG = [];
const TAT_CA_BODY = [];
const BAN_HOI_THOAI = {};

/** Một "cuộc" dùng chung client máy / anon / fetch; gui() trả tin bot gửi lượt đó. */
function taoCuoc({ may = mayGia(), anon = anonGia(), f = fetchGia(), ten = null, env = ENV } = {}) {
  const cuoc = { may, anon, f, ten };
  cuoc.gui = async (obj, moTa) => {
    const cho = [];
    const truoc = f.goi.length;
    const res = await xuLyHookMessenger(yeuCau(obj), {
      env, ctx: { waitUntil: p => cho.push(p) }, taoClientMay: () => may.client, taoClientAnon: () => anon.client,
      fetchFn: f.fn, ghiLog: c => LOG.push(c), bayGio: () => may.st.bayGio, nhoPhien: false,
    });
    cuoc.cho = cho.length;
    await Promise.all(cho);
    const moi = f.goi.slice(truoc);
    TAT_CA_BODY.push(...moi.map(g => g.body));
    const tin = moi.map(g => nhin(g.body)).filter(Boolean);
    if (cuoc.ten) (BAN_HOI_THOAI[cuoc.ten] ??= []).push(`  Khách: ${moTa}`, ...tin.map(x => `  Bot:   ${x}`));
    return { res, tin, body: moi.map(g => g.body).filter(b => b.message), chu: tin.join('\n') };
  };
  cuoc.goi = ten => may.st.goi.filter(g => g.ten === ten).concat(anon.st.goi.filter(g => g.ten === ten));
  return cuoc;
}
const cuoiCung = (arr) => arr[arr.length - 1];

// ===========================================================================
await nhom('1 · CHỮ KÝ, XÁC MINH GET, THIẾU BÍ MẬT', async () => {
  const body = JSON.stringify(suTin(PSID.a, 'xin chào'));
  const dung = 'sha256=' + createHmac('sha256', APP_SECRET).update(body).digest('hex');
  ok('kiemChuKy: đúng → true (cả chữ hoa)', await M.kiemChuKy(body, dung, APP_SECRET) && await M.kiemChuKy(new TextEncoder().encode(body), dung.toUpperCase().replace('SHA256=', 'sha256='), APP_SECRET));
  ok('kiemChuKy: sai / thiếu / sai tiền tố / body bị sửa → false',
     !(await M.kiemChuKy(body, 'sha256=' + '0'.repeat(64), APP_SECRET)) && !(await M.kiemChuKy(body, null, APP_SECRET))
     && !(await M.kiemChuKy(body, dung.replace('sha256=', 'sha1='), APP_SECRET)) && !(await M.kiemChuKy(body + ' ', dung, APP_SECRET))
     && !(await M.kiemChuKy(body, dung, 'khoa-khac')));
  ok('bangNhauHang: so sánh hằng thời gian', M.bangNhauHang('abc', 'abc') && !M.bangNhauHang('abc', 'abd') && !M.bangNhauHang('abc', 'abcd'));

  const c = taoCuoc();
  const sai = await xuLyHookMessenger(yeuCau(suTin(PSID.a, 'hi'), { chuKy: 'sai' }), { env: ENV, taoClientMay: () => c.may.client, taoClientAnon: () => c.anon.client, fetchFn: c.f.fn, ghiLog: x => LOG.push(x) });
  const thieu = await xuLyHookMessenger(yeuCau(suTin(PSID.a, 'hi'), { chuKy: 'thieu' }), { env: ENV, taoClientMay: () => c.may.client, taoClientAnon: () => c.anon.client, fetchFn: c.f.fn, ghiLog: x => LOG.push(x) });
  ok('POST chữ ký sai → 403, thiếu → 403; không gọi database, không gửi tin', sai.status === 403 && thieu.status === 403
     && c.may.st.goi.length === 0 && c.anon.st.goi.length === 0 && c.f.goi.length === 0);

  const url = q => new Request(`https://beeftown.vn/hook/messenger?${new URLSearchParams(q)}`);
  const g1 = await xuLyHookMessenger(url({ 'hub.mode': 'subscribe', 'hub.verify_token': VERIFY, 'hub.challenge': '1158201444' }), { env: ENV, ghiLog: () => {} });
  ok('GET xác minh đúng → 200 + hub.challenge', g1.status === 200 && await g1.text() === '1158201444');
  const g2 = await xuLyHookMessenger(url({ 'hub.mode': 'subscribe', 'hub.verify_token': VERIFY + 'x', 'hub.challenge': '1' }), { env: ENV, ghiLog: () => {} });
  const g3 = await xuLyHookMessenger(url({ 'hub.mode': 'unsubscribe', 'hub.verify_token': VERIFY, 'hub.challenge': '1' }), { env: ENV, ghiLog: () => {} });
  ok('GET sai mã xác minh / sai hub.mode → 403', g2.status === 403 && g3.status === 403);

  quenDaBao();
  const log = [];
  const thieuEnv = { ...ENV, META_PAGE_TOKEN: undefined };
  const t1 = await xuLyHookMessenger(url({ 'hub.mode': 'subscribe', 'hub.verify_token': VERIFY, 'hub.challenge': '1' }), { env: thieuEnv, ghiLog: x => log.push(x) });
  const t2 = await xuLyHookMessenger(yeuCau(suTin(PSID.a, 'hi')), { env: thieuEnv, ghiLog: x => log.push(x) });
  const t3 = await xuLyHookMessenger(yeuCau(suTin(PSID.a, 'hi')), { env: thieuEnv, ghiLog: x => log.push(x) });
  ok('Thiếu bí mật → GET / POST 503, log đúng MỘT lần, nêu tên bí mật (không giá trị)',
     t1.status === 503 && t2.status === 503 && t3.status === 503 && log.length === 1 && /META_PAGE_TOKEN/.test(log[0]) && !BI_MAT.some(b => log[0].includes(b)), log.join(' | '));
  const ngan = await xuLyHookMessenger(yeuCau(suTin(PSID.a, 'hi')), { env: { ...ENV, MESS_KHOA_BAM: 'ngan' }, ghiLog: () => {} });
  const nganV = await xuLyHookMessenger(url({ 'hub.mode': 'subscribe', 'hub.verify_token': 'ngan', 'hub.challenge': '1' }), { env: { ...ENV, META_VERIFY_TOKEN: 'ngan' }, ghiLog: () => {} });
  ok('MESS_KHOA_BAM / META_VERIFY_TOKEN ngắn hơn 32 ký tự → 503', ngan.status === 503 && nganV.status === 503);
  const put = await xuLyHookMessenger(new Request('https://beeftown.vn/hook/messenger', { method: 'PUT', body: 'x' }), { env: ENV, ghiLog: () => {} });
  ok('Phương thức khác → 405', put.status === 405);
  const lon = await xuLyHookMessenger(yeuCau('{"object":"page","x":"' + 'a'.repeat(300 * 1024) + '"}'), { env: ENV, ghiLog: () => {} });
  const hong = await xuLyHookMessenger(yeuCau('{khong phai json'), { env: ENV, ghiLog: () => {} });
  ok('Body quá 256KB → 413; JSON hỏng (chữ ký đúng) → 400', lon.status === 413 && hong.status === 400);

  const c2 = taoCuoc();
  const r = await c2.gui(suTin(PSID.a, 'xin chào'), 'xin chào');
  ok('POST hợp lệ → 200 EVENT_RECEIVED; xử lý qua ctx.waitUntil', r.res.status === 200 && await r.res.text() === 'EVENT_RECEIVED' && c2.cho === 1 && r.tin.length === 1);
  const tt = await trangThaiBiMatMess(ENV);
  ok('trangThaiBiMatMess chỉ trả có / không', JSON.stringify(tt) === '{"appSecret":true,"pageToken":true,"verifyToken":true,"taiKhoanMay":true,"khoaBam":true}'
     && JSON.stringify(await trangThaiBiMatMess({ META_VERIFY_TOKEN: 'ngan' })) === '{"appSecret":false,"pageToken":false,"verifyToken":false,"taiKhoanMay":false,"khoaBam":false}');
});

// ===========================================================================
await nhom('2 · TÁCH SỰ KIỆN, HIỂU CHỮ KHÁCH GÕ, BĂM PSID, XÓA BÍ MẬT', async () => {
  const ds = M.tachSuKien(bocTin(
    { sender: { id: '11' }, recipient: { id: 'P' }, message: { mid: '1', text: 'xin chào' } },
    { sender: { id: '11' }, recipient: { id: 'P' }, message: { mid: '2', text: 'Đặt bàn', quick_reply: { payload: 'BT_DAT_BAN' } } },
    { sender: { id: '11' }, recipient: { id: 'P' }, message: { mid: '3', text: '+84912345678', quick_reply: { payload: '+84912345678' } } },
    { sender: { id: '11' }, recipient: { id: 'P' }, postback: { title: 'Bắt đầu', payload: 'BT_BAT_DAU' } },
    { sender: { id: 'P' }, recipient: { id: '11' }, message: { mid: '4', is_echo: true, app_id: 123, metadata: 'beeftown_bot', text: 'x' } },
    { sender: { id: 'P' }, recipient: { id: '11' }, message: { mid: '5', is_echo: true, text: 'nhân viên' } },
    { sender: { id: '11' }, recipient: { id: 'P' }, message: { mid: '6', attachments: [{ type: 'image' }] } },
    { sender: { id: '11' }, recipient: { id: 'P' }, delivery: { mids: ['1'] } },
  ));
  ok('tachSuKien: tin / nút / SĐT từ nút user_phone_number = tin / postback / echo (app_id, metadata) / ảnh = khac / bỏ delivery',
     JSON.stringify(ds.map(s => s.loai)) === '["tin","nut","tin","postback","echo","echo","khac"]'
     && ds[1].payload === 'BT_DAT_BAN' && ds[2].chu === '+84912345678' && ds[3].payload === 'BT_BAT_DAU'
     && ds[4].psid === '11' && ds[4].appId === '123' && ds[4].metadata === 'beeftown_bot' && ds[5].appId === null, JSON.stringify(ds));
  ok('tachSuKien: không phải "page" / rác → []', M.tachSuKien({ object: 'user', entry: [] }).length === 0 && M.tachSuKien(null).length === 0
     && M.tachSuKien({ object: 'page', entry: [{ messaging: 'x' }] }).length === 0);

  const H = '2026-09-27'; // Chủ nhật
  const N = s => { const r = M.hieuNgay(s, H); return r.ok ? r.ngay : `${r.lyDo}${r.ngay ? ':' + r.ngay : ''}`; };
  const bang = [
    ['hôm nay', '2026-09-27'], ['mai', '2026-09-28'], ['Ngày mai', '2026-09-28'], ['mốt', '2026-09-29'], ['ngày kia', '2026-09-29'],
    ['thứ bảy', '2026-10-03'], ['T7', '2026-10-03'], ['thứ 2', '2026-09-28'], ['chủ nhật', '2026-09-27'], ['CN', '2026-09-27'],
    ['28/9', '2026-09-28'], ['28/09/2026', '2026-09-28'], ['3-10', '2026-10-03'], ['3.10.26', '2026-10-03'], ['2026-10-05', '2026-10-05'],
    ['5 tháng 10', '2026-10-05'], ['20/09/2026', 'qua:2026-09-20'], ['20/9', 'qua:2026-09-20'], ['25/12', 'xa:2026-12-25'],
    ['31/2', 'sai'], ['ngày gì đó', 'khong_hieu'], ['26/11', '2026-11-26'], ['27/11', 'xa:2026-11-27'],
  ];
  const sai = bang.filter(([s, k]) => N(s) !== k).map(([s, k]) => `${s} → ${N(s)} (cần ${k})`);
  ok(`hieuNgay: ${bang.length} cách gõ (hôm nay, mai, mốt, thứ bảy, t7, 28/9, 28/09/2026…; quá khứ, quá 60 ngày, ngày sai)`, sai.length === 0, sai.join(' | '));
  ok('hieuNgay: 5/1 gõ cuối tháng 12 → năm sau (vẫn trong 60 ngày)', M.hieuNgay('5/1', '2026-12-20').ngay === '2027-01-05');
  const G = [['19:00', '19:00'], ['19h', '19:00'], ['19h30', '19:30'], ['7h tối', '19:00'], ['7 giờ 30 tối', '19:30'], ['7pm', '19:00'],
             ['12h trưa', '12:00'], ['1h trưa', '13:00'], ['11g30', '11:30'], ['19', '19:00'], ['25h', null], ['abc', null]];
  const saiG = G.filter(([s, k]) => M.hieuGio(s) !== k).map(([s, k]) => `${s} → ${M.hieuGio(s)} (cần ${k})`);
  ok('hieuGio: 19:00, 19h, 19h30, 7h tối, 7pm, 12h trưa…', saiG.length === 0, saiG.join(' | '));
  ok('SĐT: +84 / 84 / dấu cách / 9 số → 0xxxxxxxxx; sai → null (như chuan_hoa_sdt + ^0\\d{9}$)',
     M.sdtHopLe('+84 912 345 678') === SDT && M.sdtHopLe('84912345678') === SDT && M.sdtHopLe('0912.345.678') === SDT
     && M.sdtHopLe('912345678') === SDT && M.sdtHopLe('12345') === null && M.sdtHopLe('09123456789') === null && M.sdtHopLe('') === null);
  ok('Số khách: "4", "4 người", "bốn", "9 người"', M.hieuSoKhach('4') === 4 && M.hieuSoKhach('4 người') === 4 && M.hieuSoKhach('bốn') === 4 && M.hieuSoKhach('9 người') === 9 && M.hieuSoKhach('nhiều') === null);
  ok('Tên: gọn khoảng trắng; từ chối SĐT / quá ngắn', M.hieuTen('  Nguyễn   Văn An ') === 'Nguyễn Văn An' && M.hieuTen('0912345678') === null && M.hieuTen('a') === null);

  const b1 = await M.bamPsid(PSID.a, KHOA_BAM);
  ok('bamPsid: 64 hex thường, cố định, đúng HMAC-SHA256, đổi khóa → đổi', /^[0-9a-f]{64}$/.test(b1) && b1 === await M.bamPsid(PSID.a, KHOA_BAM)
     && b1 === createHmac('sha256', KHOA_BAM).update(PSID.a).digest('hex') && b1 !== await M.bamPsid(PSID.a, KHOA_BAM + 'x'));
  const cau = `lỗi ${PAGE_TOKEN} access_token=abcdef123456 EAAxyzxyzxyz12345 khách 0912 345 678 psid ${PSID.a} băm ${b1} mã 190`;
  const s = M.xoaBiMat(cau, PAGE_TOKEN);
  ok('xoaBiMat: bỏ token, access_token=…, EAA…, SĐT (kể cả có dấu cách), PSID, chuỗi băm; giữ mã lỗi ngắn',
     !s.includes(PAGE_TOKEN) && !s.includes('abcdef123456') && !/EAA/.test(s) && !/345 678/.test(s) && !s.includes(PSID.a) && !s.includes(b1) && s.includes('190'), s);
});

// ===========================================================================
await nhom('3 · BODY SEND API / MESSENGER PROFILE TRONG GIỚI HẠN META', async () => {
  const G = M.META_API.gioiHan;
  const dai = 'Chữ rất dài '.repeat(80);
  const b = M.thanTin(PSID.a, { chu: dai, nutNhanh: Array.from({ length: 20 }, (_, i) => ({ tieuDe: `Lựa chọn thật là dài số ${i}`, payload: 'BT_X' })) });
  ok('Tin chữ: ≤ 640 ký tự, ≤ 13 quick reply, tiêu đề ≤ 20 ký tự, messaging_type RESPONSE, metadata của bot',
     [...b.message.text].length <= G.chu && b.message.quick_replies.length === 13 && b.message.quick_replies.every(q => [...q.title].length <= 20)
     && b.messaging_type === 'RESPONSE' && b.recipient.id === PSID.a && b.message.metadata === 'beeftown_bot');
  const t = M.thanTin(PSID.a, { chu: 'x', nut: [1, 2, 3, 4].map(i => ({ loai: 'postback', tieuDe: 'Một nút có tên rất dài ' + i, payload: 'BT_' + i })), nutNhanh: [{ sdt: true }] });
  ok('Button template: ≤ 3 nút, tiêu đề ≤ 20; nút SĐT = content_type user_phone_number',
     t.message.attachment.payload.template_type === 'button' && t.message.attachment.payload.buttons.length === 3
     && t.message.attachment.payload.buttons.every(x => [...x.title].length <= 20) && t.message.quick_replies[0].content_type === 'user_phone_number');
  ok('Đang gõ: sender_action typing_on', JSON.stringify(M.thanDangGo('1')) === '{"recipient":{"id":"1"},"sender_action":"typing_on"}');
  const yc = M.dungYeuCauMeta(M.META_API.urlGuiTin, PAGE_TOKEN, { a: 1 });
  ok('Send API: POST JSON tới graph.facebook.com/<phiên bản>/me/messages, token chỉ ở ?access_token, không trong body',
     yc.url.startsWith(`https://graph.facebook.com/${M.META_API.phienBan}/me/messages?access_token=`) && yc.init.method === 'POST'
     && !yc.init.body.includes(PAGE_TOKEN) && /^v\d+\.\d+$/.test(M.META_API.phienBan));
  const hs = M.thanHoSo('Chào '.repeat(60));
  ok('Messenger Profile: get_started BT_BAT_DAU, greeting ≤ 160 ký tự, menu cố định = 5 mục của menu chính (tiêu đề ≤ 30)',
     hs.get_started.payload === 'BT_BAT_DAU' && [...hs.greeting[0].text].length <= 160 && hs.greeting[0].locale === 'default'
     && hs.persistent_menu[0].call_to_actions.length === 5 && hs.persistent_menu[0].call_to_actions.every(x => x.type === 'postback' && [...x.title].length <= 30)
     && M.META_API.urlHoSo.endsWith('/me/messenger_profile'));
  ok('Menu chính: Đặt bàn · Tra/hủy đặt bàn · Giờ mở cửa & địa chỉ · Thực đơn · Gặp nhân viên (mỗi tiêu đề ≤ 20)',
     M.MENU_CHINH.map(m => m.tieuDe).join(' · ') === 'Đặt bàn · Tra/hủy đặt bàn · Giờ mở cửa & địa chỉ · Thực đơn · Gặp nhân viên'
     && M.MENU_CHINH.every(m => [...m.tieuDe].length <= 20));
  ok('Hằng META_API ghi "CHỈNH KHI CÓ TÀI LIỆU", phiên bản Graph, ba trường webhook',
     /CHỈNH KHI CÓ TÀI LIỆU[\s\S]{0,1500}export const META_API/.test(readFileSync(join(GOC, 'web/src/lib/messenger.ts'), 'utf8'))
     && JSON.stringify(M.META_API.truongDangKy) === '["messages","messaging_postbacks","message_echoes"]'
     && G.nutNhanh === 13 && G.tieuDeNutNhanh === 20 && G.chu === 640 && G.nut === 3 && G.loiChao === 160);

  const f = fetchGia();
  const kq = await caiHoSoMessenger('Chào bạn đến Beeftown', { env: ENV, fetchFn: f.fn, ghiLog: () => {} });
  ok('caiHoSoMessenger: POST /me/messenger_profile bằng META_PAGE_TOKEN → ok', kq.ok && f.goi.length === 1 && f.goi[0].duong.endsWith('/me/messenger_profile')
     && f.goi[0].token === PAGE_TOKEN && f.goi[0].body.greeting[0].text === 'Chào bạn đến Beeftown' && !JSON.stringify(f.goi[0].body).includes(PAGE_TOKEN));
  const fLoi = fetchGia({ loi: `Invalid OAuth access token ${PAGE_TOKEN}` });
  const kqLoi = await caiHoSoMessenger('x', { env: ENV, fetchFn: fLoi.fn, ghiLog: x => LOG.push(x) });
  const kqThieu = await caiHoSoMessenger('x', { env: {}, fetchFn: f.fn });
  ok('caiHoSoMessenger: Meta từ chối → câu lỗi không lộ token; thiếu META_PAGE_TOKEN → báo tên bí mật',
     !kqLoi.ok && !kqLoi.cau.includes(PAGE_TOKEN) && /Meta/.test(kqLoi.cau) && !kqThieu.ok && /META_PAGE_TOKEN/.test(kqThieu.cau), kqLoi.cau);
});

// ===========================================================================
const cA = taoCuoc({ ten: 'Đặt bàn trọn vòng' });
let maDatBan = null;
await nhom('4 · ĐẶT BÀN TRỌN VÒNG → tao_dat_ban ĐÚNG THAM SỐ + UTM', async () => {
  const c = cA;
  let r = await c.gui(suTin(PSID.a, 'Xin chào'), 'Xin chào');
  ok('Khách mới chào → lời chào của chủ + menu chính (5 nút)', /Chào bạn! Beeftown/.test(r.chu) && r.body[0].message.quick_replies.length === 5);
  ok('Gửi "đang gõ" trước tin trả lời', c.f.goi[0].body.sender_action === 'typing_on' && c.f.goi[1].body.message);
  r = await c.gui(suNut(PSID.a, M.PAYLOAD.datBan), '[Đặt bàn]');
  const qrNgay = r.body[0].message.quick_replies;
  ok('Đặt bàn → hỏi ngày: 7 nút ngày gần nhất (Hôm nay 27/9, Mai 28/9, T3 29/9…) + Hủy', qrNgay.length === 8 && qrNgay[0].title === 'Hôm nay 27/9'
     && qrNgay[1].title === 'Mai 28/9' && qrNgay[2].title === 'T3 29/9' && qrNgay[6].payload === 'BT_NGAY:2026-10-03' && /60 ngày/.test(r.chu), r.chu);
  ok('Trước khi hỏi ngày: đọc công tắc form đặt bàn (noi_dung_cong_khai)', c.goi('noi_dung_cong_khai').length === 1);
  r = await c.gui(suNut(PSID.a, 'BT_NGAY:2026-10-03'), '[T7 3/10]');
  ok('Chọn ngày → lich_trong_theo_ma(q1, ngày); 16 khung > 11 → hỏi buổi trưa / tối',
     JSON.stringify(cuoiCung(c.goi('lich_trong_theo_ma')).ts) === '{"p_chi_nhanh_ma":"q1","p_ngay":"2026-10-03"}'
     && /trưa hay buổi tối/.test(r.chu) && r.body[0].message.quick_replies.map(q => q.title).join('|') === 'Buổi trưa|Buổi tối|Đổi ngày|Hủy', r.chu);
  r = await c.gui(suNut(PSID.a, 'BT_BUOI:toi'), '[Buổi tối]');
  const qrGio = r.body[0].message.quick_replies;
  ok('Buổi tối → 10 nút giờ + Đổi ngày + Hủy (≤ 13)', qrGio.length === 12 && qrGio[0].title === '17:00' && qrGio[9].title === '21:30' && qrGio.length <= 13);
  r = await c.gui(suNut(PSID.a, 'BT_GIO:19:00'), '[19:00]');
  ok('Chọn giờ → hỏi số khách: 1–8 người + "Trên 8 người" + Hủy', /mấy người/.test(r.chu) && r.body[0].message.quick_replies.length === 10
     && r.body[0].message.quick_replies[8].title === 'Trên 8 người');
  r = await c.gui(suNut(PSID.a, 'BT_KHACH:4'), '[4 người]');
  ok('4 người → hỏi tên', /tên người đặt bàn/.test(r.chu));
  r = await c.gui(suTin(PSID.a, 'Nguyễn   Văn An'), 'Nguyễn   Văn An');
  ok('Tên → hỏi SĐT, có nút user_phone_number', /Số điện thoại/.test(r.chu) && r.body[0].message.quick_replies[0].content_type === 'user_phone_number');
  r = await c.gui(suTin(PSID.a, '+84 912 345 678'), '+84 912 345 678');
  ok('SĐT gõ +84… → chuẩn hóa, tóm tắt: ngày, giờ, số khách, tên, SĐT + Xác nhận / Sửa / Hủy',
     /Thứ Bảy, 03\/10\/2026/.test(r.chu) && /Giờ: 19:00/.test(r.chu) && /Số khách: 4/.test(r.chu) && /Tên: Nguyễn Văn An/.test(r.chu)
     && /0912345678/.test(r.chu) && r.body[0].message.quick_replies.map(q => q.title).join('|') === 'Xác nhận|Sửa|Hủy', r.chu);
  ok('Chưa gọi tao_dat_ban trước khi khách bấm Xác nhận', c.goi('tao_dat_ban').length === 0);
  r = await c.gui(suNut(PSID.a, M.PAYLOAD.xacNhan), '[Xác nhận]');
  const dat = c.goi('tao_dat_ban');
  ok('Xác nhận → tao_dat_ban ĐÚNG MỘT LẦN, đúng từng tham số (utm messenger / chatbot, không đồng ý nhận tin, không IP)',
     dat.length === 1 && JSON.stringify(dat[0].ts) === JSON.stringify({
       p_chi_nhanh_ma: 'q1', p_sdt: SDT, p_ho_ten: 'Nguyễn Văn An', p_ngay: '2026-10-03', p_gio: '19:00', p_so_khach: 4,
       p_dip: null, p_ghi_chu: null, p_dong_y: false, p_utm_source: 'messenger', p_utm_medium: 'chatbot',
       p_utm_campaign: null, p_trang_gioi_thieu: null, p_ip: null,
     }), JSON.stringify(dat[0]?.ts));
  ok('Trả lời: "Beeftown đã nhận yêu cầu", mã đặt bàn, chỉ có hiệu lực khi nhân viên gọi xác nhận, SĐT che; KHÔNG "thành công"',
     /Beeftown đã nhận yêu cầu đặt bàn/.test(r.chu) && /Mã đặt bàn: K7M2QX/.test(r.chu) && /nhân viên gọi xác nhận/.test(r.chu)
     && /09\*\*\*\*5678/.test(r.chu) && !/thành công/i.test(r.chu) && !/còn \d+ bàn/.test(r.chu), r.chu);
  maDatBan = 'K7M2QX';
  const psidBam = await M.bamPsid(PSID.a, KHOA_BAM);
  const phien = c.may.st.phien.get(psidBam);
  ok('Phiên sau khi gửi: về menu, du_lieu rỗng', phien.buoc === 'menu' && JSON.stringify(phien.du_lieu) === '{}');
  ok('Đếm sự kiện "dat_ban" đúng một lần', c.may.st.suKien.filter(x => x === 'dat_ban').length === 1);
  ok('mess_lay_phien: đúng MỘT lần cho mỗi sự kiện khách (9 sự kiện)', c.goi('mess_lay_phien').length === 9);
  ok('Database chỉ nhận psid_bam 64 hex — không PSID thô ở bất kỳ lời gọi nào',
     c.may.st.goi.every(g => !JSON.stringify(g.ts).includes(PSID.a)) && c.may.st.goi.filter(g => g.ts.p_psid_bam).every(g => g.ts.p_psid_bam === psidBam));
  ok('du_lieu mỗi lần lưu ≤ 4000 byte, bước đúng dạng', c.goi('mess_luu_phien').every(g => g.ts.p_du_lieu === null || JSON.stringify(g.ts.p_du_lieu).length <= 4000)
     && c.goi('mess_luu_phien').every(g => g.ts.p_buoc === null || /^[a-z][a-z0-9_]{0,39}$/.test(g.ts.p_buoc)));
});

// ===========================================================================
await nhom('5 · HẾT BÀN, NGÀY QUÁ KHỨ / QUÁ XA, NGÀY GÕ TAY, SĐT SAI, SỬA', async () => {
  const c = taoCuoc({ anon: anonGia({ kin: ['2026-10-01'] }), ten: 'Hết chỗ, ngày gõ tay, SĐT sai' });
  await c.gui(suTin(PSID.b, 'đặt bàn'), 'đặt bàn');
  let r = await c.gui(suTin(PSID.b, '1/10'), '1/10');
  ok('Ngày kín chỗ (mọi khung con_cho = false) → "không còn giờ nào" + lại 7 nút ngày', /không còn giờ nào nhận đặt bàn/.test(r.chu)
     && r.body[0].message.quick_replies[0].title === 'Hôm nay 27/9', r.chu);
  r = await c.gui(suTin(PSID.b, '20/09/2026'), '20/09/2026');
  ok('Ngày quá khứ gõ tay → "đã qua", không gọi lịch trống cho ngày đó', /đã qua/.test(r.chu) && !c.goi('lich_trong_theo_ma').some(g => g.ts.p_ngay === '2026-09-20'), r.chu);
  r = await c.gui(suTin(PSID.b, '25/12'), '25/12');
  ok('Ngày quá 60 ngày → "chỉ nhận đặt bàn trong 60 ngày tới"', /60 ngày tới/.test(r.chu), r.chu);
  r = await c.gui(suNut(PSID.b, 'BT_NGAY:2026-09-20'), '[nút ngày cũ 20/9]');
  ok('Nút ngày cũ (đã qua) → vẫn chặn "đã qua"', /đã qua/.test(r.chu));
  r = await c.gui(suTin(PSID.b, 'mai'), 'mai');
  ok('Gõ "mai" → lich_trong_theo_ma ngày 28/9 → hỏi buổi', cuoiCung(c.goi('lich_trong_theo_ma')).ts.p_ngay === '2026-09-28' && /Thứ Hai, 28\/09\/2026/.test(r.chu), r.chu);
  r = await c.gui(suTin(PSID.b, '7h30 tối'), '7h30 tối');
  ok('Gõ giờ "7h30 tối" ở bước giờ → 19:30 → hỏi số khách', /mấy người/.test(r.chu));
  r = await c.gui(suTin(PSID.b, '2 người'), '2 người');
  r = await c.gui(suTin(PSID.b, 'Trần Bình'), 'Trần Bình');
  r = await c.gui(suTin(PSID.b, '12345'), '12345');
  ok('SĐT sai → "chưa đúng", vẫn hỏi SĐT, chưa đặt', /Số điện thoại chưa đúng/.test(r.chu) && r.body[0].message.quick_replies[0].content_type === 'user_phone_number'
     && c.goi('tao_dat_ban').length === 0, r.chu);
  r = await c.gui(bocTin({ sender: { id: PSID.b }, recipient: { id: 'P' }, message: { mid: 'q', text: '+84987654321', quick_reply: { payload: '+84987654321' } } }), '[nút số trong Facebook: +84987654321]');
  ok('SĐT từ nút user_phone_number → tóm tắt với 0987654321', /0987654321/.test(r.chu) && /Giờ: 19:30/.test(r.chu), r.chu);
  r = await c.gui(suNut(PSID.b, M.PAYLOAD.sua), '[Sửa]');
  ok('Sửa → chọn mục (Ngày & giờ, Giờ, Số khách, Tên, SĐT, Giữ nguyên)', r.body[0].message.quick_replies.length === 6);
  r = await c.gui(suNut(PSID.b, 'BT_SUA:khach'), '[Số khách]');
  r = await c.gui(suNut(PSID.b, 'BT_KHACH:3'), '[3 người]');
  ok('Sửa số khách → quay lại tóm tắt với 3 khách, giữ ngày giờ tên SĐT', /Số khách: 3/.test(r.chu) && /Trần Bình/.test(r.chu) && /19:30/.test(r.chu), r.chu);

  // Vừa có người đặt mất khung đó: database báo hết bàn.
  c.anon.st.loiDatBan = 'Khung giờ 19:30:00 ngày 2026-09-28 đã hết bàn';
  r = await c.gui(suNut(PSID.b, M.PAYLOAD.xacNhan), '[Xác nhận] (khung vừa hết)');
  ok('tao_dat_ban báo hết bàn → "vừa hết chỗ… CHƯA được ghi nhận" + đọc lại lịch trống + hỏi lại giờ',
     /vừa hết chỗ/.test(r.chu) && /CHƯA được ghi nhận/.test(r.chu) && /trưa hay buổi tối/.test(r.chu) && !/thành công/.test(r.chu), r.chu);
  ok('Đếm "dat_ban_that_bai"', c.may.st.suKien.includes('dat_ban_that_bai'));
  await c.gui(suNut(PSID.b, 'BT_BUOI:trua'), '[Buổi trưa]');
  r = await c.gui(suNut(PSID.b, 'BT_GIO:12:00'), '[12:00]');
  ok('Chọn giờ khác → thẳng tới tóm tắt (đã có số khách, tên, SĐT)', /Giờ: 12:00/.test(r.chu) && /Xác nhận/.test(r.body[0].message.quick_replies[0].title), r.chu);
  c.may.st.bayGio += 20_000;   // khách chọn lại giờ mất vài chục giây (chốt chống gửi trùng là 5 giây)
  r = await c.gui(suTin(PSID.b, 'ok'), 'ok');
  ok('Gõ "ok" ở bước xác nhận = Xác nhận → đã nhận yêu cầu', /đã nhận yêu cầu/.test(r.chu) && cuoiCung(c.goi('tao_dat_ban')).ts.p_gio === '12:00');

  const d = taoCuoc({ anon: anonGia({ formMo: false }) });
  r = await d.gui(suNut(PSID.b, M.PAYLOAD.datBan), '[Đặt bàn]');
  ok('Form đặt bàn đang tắt → "chưa mở đặt bàn qua tin nhắn", không hỏi ngày', /chưa mở đặt bàn/.test(r.chu) && d.goi('lich_trong_theo_ma').length === 0);

  // 0079: tao_dat_ban từ chối vì giới hạn tần suất → câu database viết để hiện thẳng cho khách.
  for (const cau of ['Hệ thống đang nhận quá nhiều yêu cầu, vui lòng thử lại sau hoặc liên hệ trực tiếp với nhà hàng',
                     'Số điện thoại này đã có nhiều yêu cầu đặt bàn đang chờ nhà hàng xác nhận, vui lòng gọi nhà hàng']) {
    const g = taoCuoc({ anon: anonGia({ loiDatBan: cau }) });
    await g.gui(suNut(PSID.d, M.PAYLOAD.datBan), '[Đặt bàn]');
    await g.gui(suTin(PSID.d, 'thứ bảy'), 'thứ bảy');
    await g.gui(suNut(PSID.d, 'BT_BUOI:toi'), '[Buổi tối]');
    await g.gui(suNut(PSID.d, 'BT_GIO:19:00'), '[19:00]');
    await g.gui(suNut(PSID.d, 'BT_KHACH:2'), '[2 người]');
    await g.gui(suTin(PSID.d, 'Trần Bình'), 'Trần Bình');
    await g.gui(suTin(PSID.d, '0987654321'), '0987654321');
    const rg = await g.gui(suNut(PSID.d, M.PAYLOAD.xacNhan), '[Xác nhận]');
    ok(`tao_dat_ban bị giới hạn (0079) → hiện nguyên «${cau.slice(0, 36)}…», không "đã nhận", đếm dat_ban_that_bai, không đếm lỗi`,
       g.goi('tao_dat_ban').length === 1 && rg.chu.includes(cau) && !/đã nhận yêu cầu/.test(rg.chu)
       && g.may.st.suKien.includes('dat_ban_that_bai') && !g.may.st.suKien.includes('loi'), rg.chu);
  }

  // Máy trạng thái thuần: các cách gõ ngày đều dẫn tới đọc lịch trống đúng ngày.
  const nc = { bayGio: BAY_GIO, loiChao: '', phutTamDung: 60, biKhoa: false, web: 'https://beeftown.vn' };
  const cach = { 'mốt': '2026-09-29', 'thứ bảy': '2026-10-03', 't7': '2026-10-03', 'chủ nhật': '2026-09-27', '28/9': '2026-09-28', '28/09/2026': '2026-09-28' };
  const lech = Object.entries(cach).filter(([s, n]) => {
    const kq = M.buocTiep({ buoc: 'dat_ngay', duLieu: {} }, { loai: 'tin', psid: '1', chu: s }, nc);
    return !(kq.goi?.goi === 'lich_trong' && kq.goi.ngay === n && kq.phien.buoc === 'dat_gio');
  });
  ok('buocTiep thuần: mốt / thứ bảy / t7 / chủ nhật / 28/9 / 28/09/2026 → yêu cầu lich_trong đúng ngày', lech.length === 0, lech.map(x => x[0]).join(', '));
  const cu = M.buocTiep({ buoc: 'dat_ten', duLieu: { ngay: '2026-10-03', gio: '19:00', so_khach: 2 } }, { loai: 'tin', psid: '1', chu: 'hi' },
    { ...nc, capNhat: new Date(BAY_GIO - 13 * 3600_000).toISOString() });
  ok('Phiên dở dang bỏ quá 12 giờ → coi như bắt đầu lại (không lấy "hi" làm tên)', cu.phien.buoc === 'menu' && !cu.phien.duLieu.ho_ten);
});

// ===========================================================================
await nhom('6 · 9 KHÁCH → NHÂN VIÊN; GẶP NHÂN VIÊN → BOT IM; LỆNH MỌI LÚC', async () => {
  const c = taoCuoc({ ten: '9 khách → nhân viên' });
  await c.gui(suNut(PSID.c, M.PAYLOAD.datBan), '[Đặt bàn]');
  await c.gui(suTin(PSID.c, 'thứ bảy'), 'thứ bảy');
  await c.gui(suNut(PSID.c, 'BT_BUOI:toi'), '[Buổi tối]');
  await c.gui(suNut(PSID.c, 'BT_GIO:18:00'), '[18:00]');
  let r = await c.gui(suTin(PSID.c, '9 người'), '9 người');
  const luu = cuoiCung(c.goi('mess_luu_phien'));
  ok('9 người → chuyển nhân viên: tạm dừng phut_tam_dung (60) phút, đếm gap_nhan_vien, không đặt bàn',
     /9 người trở lên/.test(r.chu) && luu.ts.p_tam_dung_phut === 60 && luu.ts.p_buoc === 'menu' && c.may.st.suKien.includes('gap_nhan_vien')
     && c.goi('tao_dat_ban').length === 0, r.chu);
  const lay = c.goi('mess_lay_phien').length;
  r = await c.gui(suTin(PSID.c, 'alo?'), 'alo? (đang chờ nhân viên)');
  ok('Đang tạm dừng → bot im (không gửi gì), mess_lay_phien vẫn gọi đúng một lần', r.tin.length === 0 && c.goi('mess_lay_phien').length === lay + 1);

  const g = taoCuoc({ may: mayGia({ phut: 30 }), ten: 'Gặp nhân viên' });
  r = await g.gui(suNut(PSID.d, M.PAYLOAD.nhanVien), '[Gặp nhân viên]');
  ok('Gặp nhân viên → báo đã gọi nhân viên, bot im 30 phút (theo cấu hình)', /đã báo nhân viên/.test(r.chu) && /30 phút/.test(r.chu)
     && cuoiCung(g.goi('mess_luu_phien')).ts.p_tam_dung_phut === 30);
  r = await g.gui(suTin(PSID.d, 'menu'), 'menu (sau 10 phút)');
  ok('Trong lúc tạm dừng, kể cả "menu" → im', r.tin.length === 0);
  g.may.st.bayGio += 31 * PHUT;
  r = await g.gui(suTin(PSID.d, 'menu'), 'menu (sau 31 phút)');
  ok('Hết 30 phút → bot nói lại', r.tin.length === 1 && /Chọn một mục/.test(r.chu));
  g.may.st.bayGio = BAY_GIO;

  const h = taoCuoc({ ten: 'Lệnh giữa chừng' });
  await h.gui(suNut(PSID.e, M.PAYLOAD.datBan), '[Đặt bàn]');
  r = await h.gui(suTin(PSID.e, 'Hủy'), 'Hủy');
  ok('"hủy" giữa chừng → "Đã dừng việc đang làm" + menu, phiên về menu', /Đã dừng/.test(r.chu) && cuoiCung(h.goi('mess_luu_phien')).ts.p_buoc === 'menu');
  await h.gui(suNut(PSID.e, M.PAYLOAD.datBan), '[Đặt bàn]');
  r = await h.gui(suTin(PSID.e, 'Bắt đầu lại'), 'Bắt đầu lại');
  ok('"bắt đầu lại" → menu', cuoiCung(h.goi('mess_luu_phien')).ts.p_buoc === 'menu' && r.body[0].message.quick_replies.length === 5);
  r = await h.gui(suTin(PSID.e, 'con mèo'), 'con mèo');
  ok('Chữ lạ → câu trợ giúp ngắn + menu', /trợ lý tự động/.test(r.chu) && r.body[0].message.quick_replies.length === 5);
  r = await h.gui(bocTin({ sender: { id: PSID.e }, recipient: { id: 'P' }, message: { mid: 's', attachments: [{ type: 'image' }] } }), '(gửi sticker)');
  ok('Ảnh / sticker → "chỉ đọc được tin chữ" + menu', /chỉ đọc được tin chữ/.test(r.chu));
  r = await h.gui(suNut(PSID.e, 'BT_GIO:19:00'), '[nút giờ cũ]');
  ok('Nút cũ không đúng bước → "thuộc bước trước" + hỏi lại', /bước trước/.test(r.chu));
});

// ===========================================================================
await nhom('7 · TRA CỨU + HỦY; KHÓA SAU 5 LẦN SAI', async () => {
  const c = cA;
  c.ten = 'Tra cứu và hủy';
  let r = await c.gui(suNut(PSID.a, M.PAYLOAD.traCuu), '[Tra/hủy đặt bàn]');
  ok('Tra/hủy → hỏi mã đặt bàn', /mã đặt bàn/.test(r.chu));
  r = await c.gui(suTin(PSID.a, 'k7m 2qx'), 'k7m 2qx');
  ok('Mã gõ thường, có dấu cách → nhận, hỏi SĐT (có nút số trong Facebook)', /Số điện thoại đã dùng/.test(r.chu) && r.body[0].message.quick_replies[0].content_type === 'user_phone_number');
  r = await c.gui(suTin(PSID.a, '0912 345 678'), '0912 345 678');
  const tc = cuoiCung(c.goi('tra_cuu_mot_dat_ban'));
  ok('tra_cuu_mot_dat_ban(p_ma K7M2QX, p_sdt chuẩn hóa, p_ip null) → mess_ghi_tra_cuu(true); KHÔNG gọi ghi_nhat_ky_tra_cuu (0079: hàm tra tự ghi)',
     JSON.stringify(tc.ts) === JSON.stringify({ p_ma: 'K7M2QX', p_sdt: SDT, p_ip: null })
     && c.goi('ghi_nhat_ky_tra_cuu').length === 0
     && cuoiCung(c.goi('mess_ghi_tra_cuu')).ts.p_thanh_cong === true);
  const tpl = r.body[0].message.attachment?.payload;
  ok('Kết quả: ngày, giờ, số khách, tên và SĐT đã che, trạng thái + nút [Hủy đặt bàn] [Về menu]',
     /Tìm thấy đặt bàn K7M2QX/.test(r.chu) && /Nguyễn V\. A/.test(r.chu) && /09\*\*\*\*5678/.test(r.chu) && /Chờ nhà hàng gọi xác nhận/.test(r.chu)
     && tpl?.buttons.map(b => b.title).join('|') === 'Hủy đặt bàn|Về menu' && !r.chu.includes(SDT), r.chu);
  r = await c.gui(suPostback(PSID.a, M.PAYLOAD.huyDatBan), '[Hủy đặt bàn]');
  ok('Hủy đặt bàn → hỏi chắc chắn (Có, hủy bàn / Không)', /chắc chắn muốn hủy đặt bàn K7M2QX/.test(r.chu) && r.body[0].message.quick_replies.length === 2);
  r = await c.gui(suNut(PSID.a, M.PAYLOAD.huyCo), '[Có, hủy bàn]');
  ok('Có → huy_dat_ban(p_ma, p_sdt, p_ly_do, p_ip null) → "Đã hủy"; đếm huy_dat_ban',
     JSON.stringify(cuoiCung(c.goi('huy_dat_ban')).ts) === JSON.stringify({ p_ma: 'K7M2QX', p_sdt: SDT, p_ly_do: 'Khách hủy qua Messenger', p_ip: null })
     && /Đã hủy yêu cầu đặt bàn K7M2QX/.test(r.chu) && c.may.st.suKien.includes('huy_dat_ban') && c.anon.st.datBan.get('K7M2QX').trang_thai === 'da_huy', r.chu);
  await c.gui(suNut(PSID.a, M.PAYLOAD.traCuu), '[Tra/hủy đặt bàn]');
  await c.gui(suTin(PSID.a, 'K7M2QX'), 'K7M2QX');
  r = await c.gui(suTin(PSID.a, SDT), SDT);
  ok('Tra lại → "Đã hủy", không còn nút Hủy', /Trạng thái: Đã hủy/.test(r.chu) && r.body[0].message.attachment.payload.buttons.map(b => b.title).join() === 'Về menu');

  const k = taoCuoc({ ten: 'Khóa tra cứu' });
  let lan = 0;
  for (let i = 1; i <= 5; i++) {
    await k.gui(suNut(PSID.f, M.PAYLOAD.traCuu), '[Tra/hủy đặt bàn]');
    await k.gui(suTin(PSID.f, 'ZZZZZ' + i), 'ZZZZZ' + i);
    r = await k.gui(suTin(PSID.f, '0909000111'), '0909000111');
    lan++;
    if (i < 5) ok(`Sai lần ${i} → "Không tìm thấy" + Thử lại`, /Không tìm thấy/.test(r.chu) && !/tạm khóa/.test(r.chu) && r.body[0].message.quick_replies[0].title === 'Thử lại');
  }
  ok('Sai lần thứ 5 → mess_ghi_tra_cuu báo bi_khoa → "tạm khóa 15 phút" + hotline nhà hàng',
     /tạm khóa 15 phút/.test(r.chu) && /0281234567/.test(r.chu) && k.goi('mess_ghi_tra_cuu').every(g => g.ts.p_thanh_cong === false), r.chu);
  const soTra = k.goi('tra_cuu_mot_dat_ban').length;
  r = await k.gui(suNut(PSID.f, M.PAYLOAD.traCuu), '[Tra/hủy đặt bàn] (đang khóa)');
  ok('Đang khóa → báo ngay, KHÔNG gọi tra_cuu_mot_dat_ban nữa', /tạm khóa/.test(r.chu) && k.goi('tra_cuu_mot_dat_ban').length === soTra && lan === 5);

  // 0079: database tự khoá tra cứu — theo số điện thoại hay trần toàn cục, có thể do người KHÁC dò mã. Bot hiện nguyên
  // câu database (như nhánh hủy), không mượn câu "bạn đã nhập sai" của khoá theo khách.
  const kd = taoCuoc({ anon: anonGia({ khoaTra: true }), ten: 'Database khoá tra cứu' });
  await kd.gui(suNut(PSID.f, M.PAYLOAD.traCuu), '[Tra/hủy đặt bàn]');
  await kd.gui(suTin(PSID.f, 'K7M2QX'), 'K7M2QX');
  r = await kd.gui(suTin(PSID.f, '0909000111'), '0909000111');
  ok('Database khoá tra cứu (0079) → hiện nguyên "Tra cứu bị tạm khoá, vui lòng gọi nhà hàng"; không "nhập sai", không đếm lỗi, không ghi lượt sai',
     /Tra cứu bị tạm khoá, vui lòng gọi nhà hàng/.test(r.chu) && !/nhập sai/.test(r.chu) && !kd.may.st.suKien.includes('loi')
     && kd.goi('mess_ghi_tra_cuu').length === 0, r.chu);
});

// ===========================================================================
await nhom('8 · ECHO: NHÂN VIÊN TRẢ LỜI → BOT IM; ECHO CỦA BOT → BỎ QUA; BOT TẮT', async () => {
  const c = taoCuoc({ ten: 'Nhân viên trả lời trên Trang' });
  await c.gui(suTin(PSID.g, 'đặt bàn'), 'đặt bàn');
  const lay = c.goi('mess_lay_phien').length;
  let r = await c.gui(suEcho(PSID.g, { app_id: 263902037430900 }), '(nhân viên gõ trên Trang: "Dạ em chào anh")');
  const luu = cuoiCung(c.goi('mess_luu_phien'));
  ok('Echo không phải của bot → mess_luu_phien(psid_bam, null, null, 60) + đếm nhan_vien_tra_loi; KHÔNG gọi mess_lay_phien, không gửi tin',
     luu.ts.p_buoc === null && luu.ts.p_du_lieu === null && luu.ts.p_tam_dung_phut === 60 && /^[0-9a-f]{64}$/.test(luu.ts.p_psid_bam)
     && c.may.st.suKien.includes('nhan_vien_tra_loi') && c.goi('mess_lay_phien').length === lay && r.tin.length === 0);
  r = await c.gui(suTin(PSID.g, 'mai'), 'mai (sau khi nhân viên trả lời)');
  ok('Sau đó khách nhắn → bot im', r.tin.length === 0);

  const d = taoCuoc();
  const soGoi = d.may.st.goi.length;
  await d.gui(suEcho(PSID.h, { app_id: 1234567, metadata: 'beeftown_bot' }), '(echo của bot)');
  ok('Echo của bot (metadata beeftown_bot) → không gọi database nào, không gửi gì', d.may.st.goi.length === soGoi && d.f.goi.length === 0
     && d.goi('mess_lay_phien').length === 0);
  const e = taoCuoc({ env: { ...ENV, META_APP_ID: '555000111' } });
  await e.gui(suEcho(PSID.h, { app_id: 555000111 }), '(echo từ App của mình)');
  ok('Echo có app_id = META_APP_ID → bỏ qua', e.may.st.goi.length === 0 && e.f.goi.length === 0);

  const t = taoCuoc({ may: mayGia({ dangBat: false }) });
  r = await t.gui(suTin(PSID.h, 'xin chào'), 'xin chào (bot tắt)');
  ok('Bot tắt → mess_lay_phien một lần rồi im: không "đang gõ", không lưu phiên, không gửi', r.tin.length === 0 && t.f.goi.length === 0
     && t.goi('mess_lay_phien').length === 1 && t.goi('mess_luu_phien').length === 0);
});

// ===========================================================================
await nhom('9 · GIỜ MỞ CỬA, ĐỊA CHỈ, THỰC ĐƠN', async () => {
  const c = taoCuoc({ ten: 'Giờ mở cửa & thực đơn' });
  let r = await c.gui(suNut(PSID.h, M.PAYLOAD.gioMo), '[Giờ mở cửa & địa chỉ]');
  const nut = r.body[0].message.attachment?.payload?.buttons ?? [];
  ok('Giờ đã công bố → địa chỉ, giờ trưa / tối, hotline + nút [Chỉ đường] (web_url) [Gọi nhà hàng] (+84…) + menu',
     /12 Đường Thử/.test(r.chu) && /trưa 11:00–14:00, tối 17:00–22:00/.test(r.chu) && /Hotline: 0281234567/.test(r.chu)
     && nut[0]?.type === 'web_url' && nut[1]?.type === 'phone_number' && nut[1]?.payload === '+84281234567' && r.body[0].message.quick_replies.length === 5, r.chu);
  ok('Đếm hoi_dap', c.may.st.suKien.includes('hoi_dap'));
  const d = taoCuoc({ anon: anonGia({ gioChot: false }) });
  r = await d.gui(suTin(PSID.h, 'mấy giờ mở cửa vậy'), 'mấy giờ mở cửa vậy');
  ok('Giờ chưa công bố → không nói giờ, nói "chưa được công bố"', /chưa được công bố/.test(r.chu) && !/11:00/.test(r.chu), r.chu);
  r = await c.gui(suNut(PSID.h, M.PAYLOAD.thucDon), '[Thực đơn]');
  ok('Thực đơn chưa công bố → câu "đang được hoàn thiện", không link', /đang được hoàn thiện/.test(r.chu) && !r.body[0].message.attachment);
  const e = taoCuoc({ anon: anonGia({ hienThucDon: true }) });
  r = await e.gui(suNut(PSID.h, M.PAYLOAD.thucDon), '[Thực đơn]');
  const nutTd = r.body[0].message.attachment?.payload?.buttons?.[0];
  ok('Thực đơn đã bật → nút [Xem thực đơn] tới trang /thuc-don', nutTd?.type === 'web_url' && nutTd?.title === 'Xem thực đơn'
     && nutTd?.url === 'https://beeftown.vn/thuc-don', nutTd?.url);
  const s = taoCuoc({ env: { ...ENV, SITE_URL: 'https://thu.beeftown.vn/' }, anon: anonGia({ hienThucDon: true }) });
  r = await s.gui(suNut(PSID.h, M.PAYLOAD.thucDon), '[Thực đơn] (SITE_URL có "/" cuối)');
  ok('SITE_URL có "/" cuối → link thực đơn không thành "//thuc-don"',
     r.body[0].message.attachment?.payload?.buttons?.[0]?.url === 'https://thu.beeftown.vn/thuc-don', r.body[0].message.attachment?.payload?.buttons?.[0]?.url);
  ok('Link thực đơn của bot dẫn tới trang có thật (web/src/pages/thuc-don.astro)', existsSync(join(GOC, 'web', 'src', 'pages', 'thuc-don.astro')));
  const x = taoCuoc({ ten: 'Xóa dữ liệu' });
  r = await x.gui(suTin(PSID.h, 'xóa dữ liệu'), 'xóa dữ liệu');
  ok('"xóa dữ liệu" → xóa phần đang lưu dở + báo nhân viên (tạm dừng)', /đã xóa thông tin bot đang lưu dở/.test(r.chu)
     && cuoiCung(x.goi('mess_luu_phien')).ts.p_tam_dung_phut === 60 && JSON.stringify(cuoiCung(x.goi('mess_luu_phien')).ts.p_du_lieu) === '{}');
});

// ===========================================================================
await nhom('10 · SEND API LỖI, DATABASE LỖI, LOG SẠCH, GIỚI HẠN MỌI TIN ĐÃ GỬI', async () => {
  const c = taoCuoc({ f: fetchGia({ loi: `(#100) Invalid token ${PAGE_TOKEN} for user ${PSID.a} phone 0912345678` }) });
  const r = await c.gui(suTin(PSID.a, 'hi'), 'hi');
  const loi = c.goi('mess_ghi_su_kien').find(g => g.ts.p_loai === 'loi');
  ok('Send API từ chối → không ném, 200 cho Meta, log + đếm "loi" với câu đã sạch token / PSID / SĐT',
     r.res.status === 200 && !!loi && !loi.ts.p_loi.includes(PAGE_TOKEN) && !loi.ts.p_loi.includes(PSID.a) && !loi.ts.p_loi.includes('0912345678')
     && LOG.some(l => /Send API từ chối/.test(l)), loi?.ts.p_loi);
  const n = taoCuoc({ anon: anonGia({ nemLoi: true }) });
  let r2 = await n.gui(suNut(PSID.b, M.PAYLOAD.datBan), '[Đặt bàn] (database đứt)');
  ok('Đọc database lỗi → "chưa đọc được", đếm lỗi, không ném', r2.res.status === 200 && /Chưa đọc được/.test(r2.chu) && n.may.st.suKien.includes('loi'), r2.chu);
  const m = taoCuoc();
  m.may.client.auth.signInWithPassword = async () => ({ data: {}, error: { message: 'Invalid login credentials' } });
  r2 = await m.gui(suTin(PSID.b, 'hi'), 'hi');
  ok('Tài khoản máy sai mật khẩu → 200 cho Meta, log, không gọi gì', r2.res.status === 200 && m.may.st.goi.length === 0 && LOG.some(l => /không đăng nhập được/.test(l)));

  const q = [];
  for (const b of TAT_CA_BODY) {
    if (!b.message) continue;
    const mm = b.message;
    const chu = mm.text ?? mm.attachment?.payload?.text ?? '';
    if ([...chu].length > 640) q.push('chữ > 640');
    if ((mm.quick_replies ?? []).length > 13) q.push('> 13 quick reply');
    if ((mm.quick_replies ?? []).some(x => x.title && [...x.title].length > 20)) q.push('tiêu đề > 20');
    if ((mm.attachment?.payload?.buttons ?? []).length > 3) q.push('> 3 nút');
    if (b.messaging_type !== 'RESPONSE') q.push('messaging_type');
    if (mm.metadata !== 'beeftown_bot') q.push('metadata');
  }
  ok(`Mọi tin bot đã gửi trong test (${TAT_CA_BODY.length}) đều trong giới hạn Meta`, q.length === 0 && TAT_CA_BODY.length > 80, [...new Set(q)].join(', '));
  const moiChu = TAT_CA_BODY.map(b => b.message?.text ?? b.message?.attachment?.payload?.text ?? '').join('\n');
  ok('Không tin nào của bot dính chữ cấm (chuoi-cam.js: "đặt bàn thành công", số bàn còn trống, giá…)', timChuoiCam(moiChu).length === 0 && !/thành công/i.test(moiChu),
     JSON.stringify(timChuoiCam(moiChu)));
  const bam = await Promise.all(Object.values(PSID).map(p => M.bamPsid(p, KHOA_BAM)));
  const lo = LOG.filter(l => BI_MAT.some(b => l.includes(b)) || Object.values(PSID).some(p => l.includes(p)) || bam.some(b => l.includes(b))
    || /0912345678|912 345 678|0987654321/.test(l));
  ok(`Log (${LOG.length} dòng) không chứa token, app secret, mật khẩu, khóa băm, PSID thô / đã băm, SĐT`, lo.length === 0 && LOG.length > 3, lo.slice(0, 2).join(' | '));
});

// ===========================================================================
await nhom('10b · RÀ SOÁT: "đúng"/"dừng", đứt mạng khi đặt, gửi trùng, giới hạn / ngày, database lỗi', async () => {
  const D = { ngay: '2026-10-03', gio: '19:00', so_khach: 4, ho_ten: 'Nguyễn Văn An', sdt: SDT, khung: { ngay: '2026-10-03', trua: [], toi: ['19:00'] } };
  const datPhien = async (cuoc, psid, buoc = 'dat_xac_nhan', du_lieu = D) => {
    const pb = await M.bamPsid(psid, KHOA_BAM);
    const cu = cuoc.may.st.phien.get(pb) ?? { tamDungDen: 0, sai: 0, saiTu: 0 };
    cuoc.may.st.phien.set(pb, { ...cu, buoc, du_lieu: JSON.parse(JSON.stringify(du_lieu)), capNhat: cuoc.may.st.bayGio });
    return pb;
  };

  // "Đúng" = xác nhận (bỏ dấu trùng với "dừng").
  const a = taoCuoc();
  await datPhien(a, PSID.c);
  let r = await a.gui(suTin(PSID.c, 'Đúng rồi'), 'Đúng rồi');
  ok('Bước xác nhận, khách gõ "Đúng rồi" → gửi tao_dat_ban (không bị hiểu là "dừng")',
     a.goi('tao_dat_ban').length === 1 && /đã nhận yêu cầu/.test(r.chu), r.chu);
  await datPhien(a, PSID.c);
  r = await a.gui(suTin(PSID.c, 'dung'), 'dung (không dấu)');
  ok('Gõ "dung" không dấu ở bước xác nhận → hỏi lại bằng nút, KHÔNG xóa đặt bàn đang điền, không gửi',
     a.goi('tao_dat_ban').length === 1 && /chọn một nút/.test(r.chu) && /Bạn kiểm tra lại/.test(r.chu), r.chu);
  r = await a.gui(suTin(PSID.c, 'dừng'), 'dừng');
  ok('"dừng" → dừng việc đang làm', /Đã dừng việc đang làm/.test(r.chu) && a.goi('tao_dat_ban').length === 1, r.chu);
  await datPhien(a, PSID.c, 'huy_xac_nhan', { ma: 'K7M2QX', sdt: SDT });
  r = await a.gui(suTin(PSID.c, 'hủy'), 'hủy (khi đang hỏi chắc chắn hủy bàn?)');
  ok('Đang hỏi "chắc chắn hủy bàn?" mà gõ "hủy" → nói rõ bàn VẪN GIỮ NGUYÊN, không gọi huy_dat_ban',
     /vẫn giữ nguyên/.test(r.chu) && !/Đã dừng/.test(r.chu) && a.goi('huy_dat_ban').length === 0, r.chu);

  // Đứt mạng giữa lúc gửi: supabase-js trả error KHÔNG mã (không ném) → "không chắc", không bao giờ "CHƯA ghi nhận".
  const b = taoCuoc();
  await datPhien(b, PSID.d);
  b.anon.st.dutMang = true;
  r = await b.gui(suNut(PSID.d, M.PAYLOAD.xacNhan), '[Xác nhận] (đứt mạng)');
  ok('tao_dat_ban đứt mạng (error.code rỗng) → "KHÔNG CHẮC… đừng gửi lại", không nói "CHƯA được ghi nhận"',
     /KHÔNG CHẮC/.test(r.chu) && !/CHƯA được ghi nhận/.test(r.chu) && !/đã nhận yêu cầu/.test(r.chu), r.chu);

  // Hai sự kiện "Xác nhận" chạy song song (Meta giao lặp / bấm hai lần) → đúng MỘT đặt bàn.
  const s2 = taoCuoc();
  await datPhien(s2, PSID.e);
  // tao_dat_ban chậm 30 ms: lần thứ hai đọc phiên (vẫn "dat_xac_nhan") trước khi lần đầu kịp lưu.
  const rpcAnon = s2.anon.client.rpc;
  s2.anon.client.rpc = async (ten, ts) => { if (ten === 'tao_dat_ban') await new Promise(k => setTimeout(k, 30)); return rpcAnon(ten, ts); };
  const cho = [];
  const pt = { env: ENV, ctx: { waitUntil: p => cho.push(p) }, taoClientMay: () => s2.may.client, taoClientAnon: () => s2.anon.client,
               fetchFn: s2.f.fn, ghiLog: x => LOG.push(x), bayGio: () => s2.may.st.bayGio, nhoPhien: false };
  await Promise.all([xuLyHookMessenger(yeuCau(suNut(PSID.e, M.PAYLOAD.xacNhan)), pt), xuLyHookMessenger(yeuCau(suTin(PSID.e, 'ok')), pt)]);
  await Promise.all(cho);
  const chu2 = s2.f.goi.map(g => nhin(g.body)).filter(Boolean).join('\n');
  ok('Hai lần xác nhận song song → tao_dat_ban ĐÚNG MỘT LẦN; lần kia báo "đang xử lý", không lưu đè phiên',
     s2.goi('tao_dat_ban').length === 1 && s2.goi('mess_xin_dat_ban').length === 2 && /đang xử lý yêu cầu đặt bàn/.test(chu2)
     && (chu2.match(/đã nhận yêu cầu/g) ?? []).length === 1 && s2.goi('mess_luu_phien').length === 1, chu2);

  // Tối đa 5 lần gửi / khách / ngày.
  const g = taoCuoc();
  for (let i = 0; i < 5; i++) {
    await datPhien(g, PSID.f);
    g.may.st.bayGio += 60_000;
    await g.gui(suNut(PSID.f, M.PAYLOAD.xacNhan), '[Xác nhận]');
  }
  await datPhien(g, PSID.f);
  g.may.st.bayGio += 60_000;
  r = await g.gui(suNut(PSID.f, M.PAYLOAD.xacNhan), '[Xác nhận] lần 6 trong ngày');
  ok('Lần gửi thứ 6 trong ngày → KHÔNG gọi tao_dat_ban, báo CHƯA được ghi nhận + Gặp nhân viên',
     g.goi('tao_dat_ban').length === 5 && /CHƯA được ghi nhận/.test(r.chu) && /Gặp nhân viên/.test(r.chu) && !/đã nhận yêu cầu/.test(r.chu), r.chu);

  // mess_xin_dat_ban lỗi → không gửi (không bỏ qua chốt).
  const x = taoCuoc();
  await datPhien(x, PSID.g);
  x.may.st.xinLoi = true;
  r = await x.gui(suNut(PSID.g, M.PAYLOAD.xacNhan), '[Xác nhận] (không xin được lượt)');
  ok('mess_xin_dat_ban lỗi → không gọi tao_dat_ban, báo CHƯA được ghi nhận', x.goi('tao_dat_ban').length === 0 && /CHƯA được ghi nhận/.test(r.chu), r.chu);

  // Hủy đứt mạng không bị tính là một lần đoán sai.
  const h = taoCuoc();
  await datPhien(h, PSID.h, 'huy_xac_nhan', { ma: 'K7M2QX', sdt: SDT });
  h.anon.client.rpc = async () => ({ data: null, error: { message: 'TypeError: fetch failed', code: '' } });
  r = await h.gui(suNut(PSID.h, M.PAYLOAD.huyCo), '[Có, hủy bàn] (đứt mạng)');
  ok('huy_dat_ban đứt mạng → "chưa tra cứu được", KHÔNG ghi lượt sai (mess_ghi_tra_cuu)',
     /Chưa tra cứu được/.test(r.chu) && h.goi('mess_ghi_tra_cuu').length === 0, r.chu);

  // Buổi có hơn 11 khung (bước 15 phút): giờ không vừa nút vẫn được nêu để khách gõ, và gõ được.
  const nhieu = { ngay: '2026-10-03', trua: [], toi: Array.from({ length: 16 }, (_, i) => `${String(17 + Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`) };
  const kb = M.buocTiep({ buoc: 'dat_gio', duLieu: { ngay: '2026-10-03', khung: nhieu } }, { loai: 'nut', psid: '1', payload: 'BT_BUOI:toi' },
    { bayGio: BAY_GIO, loiChao: '', phutTamDung: 60, biKhoa: false, web: 'https://beeftown.vn' });
  ok('Buổi 16 khung → 11 nút giờ + nêu 5 giờ còn lại (20:00…20:45) trong chữ; gõ "20:45" được nhận',
     kb.tin[0].nutNhanh.length === 13 && /Còn nhận thêm.*20:00, 20:15, 20:30, 20:45/.test(kb.tin[0].chu)
     && M.buocTiep(kb.phien, { loai: 'tin', psid: '1', chu: '20:45' }, { bayGio: BAY_GIO, loiChao: '', phutTamDung: 60, biKhoa: false, web: '' }).phien.duLieu.gio === '20:45',
     kb.tin[0].chu);

  // Database của bot lỗi khi bot đang bật → khách được báo, không im giữa chừng; không lặp; bot tắt → im.
  const l = taoCuoc();
  await l.gui(suTin(PSID.a, 'hi'), 'hi');   // biết bot đang bật
  const rpcCu = l.may.client.rpc;
  l.may.client.rpc = async (ten, ts) => (ten === 'mess_lay_phien' ? { data: null, error: { message: 'timeout' } } : rpcCu(ten, ts));
  r = await l.gui(suNut(PSID.a, M.PAYLOAD.xacNhan), '[Xác nhận] (database của bot lỗi)');
  ok('mess_lay_phien lỗi (bot đang bật) → báo "đang gặp trục trặc… CHƯA được gửi", không gọi tao_dat_ban',
     /trục trặc/.test(r.chu) && /CHƯA được gửi/.test(r.chu) && l.goi('tao_dat_ban').length === 0, r.chu);
  r = await l.gui(suTin(PSID.a, 'alo'), 'alo (vẫn lỗi)');
  ok('…không gửi lặp câu trục trặc cho cùng khách trong 10 phút', r.tin.length === 0);
  quenTrangThaiMess();
  const o = taoCuoc({ may: mayGia({ dangBat: false }) });
  await o.gui(suTin(PSID.b, 'hi'), 'hi (bot tắt)');
  o.may.client.rpc = async () => ({ data: null, error: { message: 'timeout' } });
  r = await o.gui(suTin(PSID.b, 'hi'), 'hi (bot tắt, database lỗi)');
  ok('Bot tắt (lần đọc gần nhất) + database lỗi → vẫn im', r.tin.length === 0);
  quenTrangThaiMess();
});

// ===========================================================================
await nhom('11 · CHẠY THẬT TRÊN PGLITE: ĐẶT BÀN QUA BOT → dat_ban (utm), mess_phien CHỈ PSID ĐÃ BĂM', async () => {
  const { db, cnA, duoi, duoiAnon } = await dungDatabase();
  const UID_MAY_MESS = '00000000-0000-4000-8000-0000000000d1';
  await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro) values ($1, $2, 'Máy Messenger', 'may_messenger')`, [UID_MAY_MESS, cnA.id]);
  for (let i = 1; i <= 4; i++) await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1, $2, 4)`, [cnA.id, `B0${i}`]);

  const KIEU = { p_ngay: 'date', p_gio: 'time', p_so_khach: 'smallint', p_ip: 'inet', p_dong_y: 'boolean', p_thanh_cong: 'boolean',
                 p_du_lieu: 'jsonb', p_tam_dung_phut: 'integer', p_phut_tam_dung: 'integer', p_dang_bat: 'boolean' };
  const TAP = new Set(['lich_trong_theo_ma', 'tao_dat_ban', 'chi_nhanh_cong_khai']);   // tra_cuu_mot_dat_ban trả jsonb (0079)
  const sqlGoi = (ten, ts) => {
    const k = Object.keys(ts);
    const thamSo = k.map((x, i) => `${x} => $${i + 1}${KIEU[x] ? '::' + KIEU[x] : ''}`).join(', ');
    return {
      sql: TAP.has(ten) ? `select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) as kq from ${ten}(${thamSo}) x` : `select ${ten}(${thamSo}) as kq`,
      params: k.map(x => (ts[x] !== null && typeof ts[x] === 'object') ? JSON.stringify(ts[x]) : ts[x]),
    };
  };
  const goiDb = chay => async (ten, ts = {}) => {
    const { sql, params } = sqlGoi(ten, ts);
    const r = await chay(sql, params);
    return r.loi ? { data: null, error: { message: r.loi, code: r.ma ?? '' } } : { data: r.rows[0].kq, error: null };
  };
  const auth = { signInWithPassword: async () => ({ data: { session: { access_token: 'x' } }, error: null }), signOut: async () => ({ error: null }) };
  const may = { rpc: goiDb((s, p) => duoi(UID_MAY_MESS, s, p)), auth };
  const anon = { rpc: goiDb(duoiAnon) };
  const chu = { rpc: goiDb((s, p) => duoi(UID.chu, s, p)) };

  const bat = await chu.rpc('mess_luu_cau_hinh', { p_dang_bat: true, p_loi_chao: 'Chào bạn, Beeftown đây!', p_phut_tam_dung: 45 });
  ok('Chủ bật bot (mess_luu_cau_hinh)', bat.data?.dang_bat === true, JSON.stringify(bat));

  const f = fetchGia();
  const psid = '8800770066005500';
  let soSuKien = 0;
  const gui = async obj => {
    soSuKien++;
    const cho = [];
    const truoc = f.goi.length;
    await xuLyHookMessenger(yeuCau(obj), { env: ENV, ctx: { waitUntil: p => cho.push(p) }, taoClientMay: () => may, taoClientAnon: () => anon,
      fetchFn: f.fn, ghiLog: c => LOG.push(c), nhoPhien: false });
    await Promise.all(cho);
    return f.goi.slice(truoc).map(g => g.body).filter(b => b.message);
  };
  const qr = b => b.at(-1)?.message?.quick_replies ?? [];
  const chuCua = b => b.map(x => x.message.text ?? x.message.attachment?.payload?.text).join('\n');

  let b = await gui(suPostback(psid, M.PAYLOAD.batDau));
  ok('Bắt đầu → lời chào từ database + menu', /Chào bạn, Beeftown đây!/.test(chuCua(b)) && qr(b).length === 5, chuCua(b));
  b = await gui(suNut(psid, M.PAYLOAD.datBan));
  const nutNgay = qr(b).find(q => q.title.startsWith('T') || q.title.startsWith('CN'));
  ok('Đặt bàn → 7 nút ngày (công tắc form_dat_ban_dang_mo đọc thật)', qr(b).length === 8, chuCua(b));
  b = await gui(suNut(psid, nutNgay.payload));
  let q = qr(b);
  if (q[0]?.payload.startsWith('BT_BUOI:')) { b = await gui(suNut(psid, q[0].payload)); q = qr(b); }
  const nutGio = q.find(x => x.payload.startsWith('BT_GIO:'));
  ok('Lịch trống thật (lich_trong_theo_ma) → có nút giờ', !!nutGio, chuCua(b));
  await gui(suNut(psid, nutGio.payload));
  await gui(suNut(psid, 'BT_KHACH:2'));
  await gui(suTin(psid, 'Lê Thị Hoa'));
  b = await gui(suTin(psid, '0933222111'));
  b = await gui(suNut(psid, M.PAYLOAD.xacNhan));
  const ma = (chuCua(b).match(/Mã đặt bàn: ([A-Z0-9]{6})/) ?? [])[1];
  ok('Xác nhận → database ghi thật, bot báo mã', !!ma && /đã nhận yêu cầu/.test(chuCua(b)), chuCua(b));
  const { rows: [d] } = await db.query(`select d.*, k.sdt, k.ho_ten from dat_ban d join khach_hang k on k.id = d.khach_hang_id where d.ma_dat_ban = $1`, [ma ?? '']);
  ok('dat_ban: utm_source messenger, utm_medium chatbot, không đồng ý nhận tin, chờ xác nhận, đúng khách',
     d?.utm_source === 'messenger' && d?.utm_medium === 'chatbot' && d?.dong_y_nhan_tin === false && d?.trang_thai === 'cho_xac_nhan'
     && d?.sdt === '0933222111' && d?.ho_ten === 'Lê Thị Hoa' && d?.so_khach === 2, JSON.stringify(d ?? {}).slice(0, 300));
  const { rows: ph } = await db.query(`select * from mess_phien`);
  const bamThat = await M.bamPsid(psid, KHOA_BAM);
  ok('mess_phien: một dòng, khóa = PSID đã băm, không chứa PSID thô', ph.length === 1 && ph[0].psid_bam === bamThat && !JSON.stringify(ph).includes(psid));
  const { rows: tk } = await db.query(`select loai, sum(dem)::int as n from mess_thong_ke_ngay group by loai`);
  const n = Object.fromEntries(tk.map(r => [r.loai, r.n]));
  ok(`Thống kê: tin_nhan = số sự kiện khách (${soSuKien}), hoi_thoai_moi 1, dat_ban 1`, n.tin_nhan === soSuKien && n.hoi_thoai_moi === 1 && n.dat_ban === 1, JSON.stringify(n));

  await gui(suNut(psid, M.PAYLOAD.traCuu));
  await gui(suTin(psid, ma));
  b = await gui(suTin(psid, '0933 222 111'));
  ok('Tra cứu thật → tên / SĐT che, nút Hủy đặt bàn', /Tìm thấy đặt bàn/.test(chuCua(b)) && /09\*\*\*\*2111/.test(chuCua(b))
     && b.at(-1).message.attachment.payload.buttons[0].title === 'Hủy đặt bàn', chuCua(b));
  await gui(suPostback(psid, M.PAYLOAD.huyDatBan));
  b = await gui(suNut(psid, M.PAYLOAD.huyCo));
  const { rows: [d2] } = await db.query(`select trang_thai from dat_ban where ma_dat_ban = $1`, [ma]);
  ok('Hủy thật → dat_ban da_huy, bot báo đã hủy', d2.trang_thai === 'da_huy' && /Đã hủy/.test(chuCua(b)), chuCua(b));
  const { rows: nk } = await db.query(`select count(*)::int as n from nhat_ky_tra_cuu where ip is null`);
  ok('nhat_ky_tra_cuu có dòng của bot (ip null)', nk[0].n >= 2);

  b = await gui(suNut(psid, M.PAYLOAD.nhanVien));
  const { rows: [p2] } = await db.query(`select tam_dung_den > now() + interval '40 minutes' as dung from mess_phien`);
  ok('Gặp nhân viên → mess_phien.tam_dung_den ≈ now + 45 phút (cấu hình của chủ)', p2.dung === true && /45 phút/.test(chuCua(b)));
  b = await gui(suTin(psid, 'còn đó không'));
  ok('Đang tạm dừng (database nói) → bot im', b.length === 0);
  await db.close();
});

// ===========================================================================
await nhom('12 · WORKER, TRANG, MENU, TRANG CÔNG KHAI, README, GIT', async () => {
  const w = readFileSync(join(GOC, 'web/src/worker.ts'), 'utf8');
  ok('worker.ts: /hook/ipos rồi /hook/messenger đều chặn TRƯỚC handle của adapter; messenger nhận ctx',
     /async fetch\([\s\S]*startsWith\(DUONG_HOOK\)[\s\S]*xuLyHookIpos\([\s\S]*DUONG_MESSENGER[\s\S]*xuLyHookMessenger\(request, \{ env, ctx \}\)[\s\S]*return handle\(/.test(w)
     && /import \{ xuLyHookMessenger, DUONG_MESSENGER \} from '\.\/lib\/messenger-hook\.ts'/.test(w) && DUONG_MESSENGER === '/hook/messenger');
  const sch = w.slice(w.indexOf('async scheduled('));
  ok('worker.ts: scheduled giữ nguyên hai việc cron', /waitUntil\(dongBoTatCa\(env\)\)/.test(sch) && /waitUntil\(guiZaloTatCa\(env\)\)/.test(sch) && !/essenger/.test(sch));
  const route = readFileSync(join(GOC, 'web/src/pages/hook/messenger.ts'), 'utf8');
  ok('Route dự phòng pages/hook/messenger.ts cho astro dev', /xuLyHookMessenger\(request\)/.test(route) && /prerender = false/.test(route));
  const hook = readFileSync(join(GOC, 'web/src/lib/messenger-hook.ts'), 'utf8');
  // Đăng nhập máy dùng chung (lib/tai-khoan-may.ts, rà soát 11/10/2026): messenger-hook.ts phải đi qua đó.
  const mayChung = readFileSync(join(GOC, 'web/src/lib/tai-khoan-may.ts'), 'utf8');
  ok('messenger-hook.ts: client máy anon riêng không lưu phiên (qua dangNhapMay / taoPhienMayNho); không có lời gọi hàm công khai (nằm ở messenger-anon.ts)',
     /dangNhapMay\(thamSoMay\(/.test(hook) && /phienMess\.dangNhap\(thamSoMay\(/.test(hook)
     && /persistSession: false, autoRefreshToken: false/.test(mayChung) && /global: \{ fetch: taoFetchCoHan\(/.test(mayChung)
     && !/\.rpc\('(tao_dat_ban|tra_cuu_dat_ban|tra_cuu_mot_dat_ban|huy_dat_ban|lich_trong_theo_ma)'/.test(hook));
  const anon = readFileSync(join(GOC, 'web/src/lib/messenger-anon.ts'), 'utf8');
  ok('messenger-anon.ts: không gọi mess_*', !/rpc\('mess_/.test(anon) && /p_utm_source: 'messenger'/.test(anon) && /p_utm_medium: 'chatbot'/.test(anon));
  const hd = readFileSync(join(GOC, 'crm/test/test-hop-dong-web.mjs'), 'utf8');
  ok('test-hop-dong-web: messenger-hook.ts chạy đã đăng nhập, messenger-anon.ts vẫn là anon', /'web\/src\/lib\/messenger-hook\.ts'/.test(hd) && !/'web\/src\/lib\/messenger-anon\.ts'/.test(hd));

  const tr = readFileSync(join(GOC, 'web/src/pages/noi-bo/messenger.astro'), 'utf8');
  ok('Trang /noi-bo/messenger: không <script>; chủ + quản lý vào, chỉ chủ ghi; POST rồi 303',
     !/<script/i.test(tr) && /vai_tro !== 'quan_ly'/.test(tr) && /if \(!laChu\)/.test(tr) && /Astro\.redirect\(DUONG, 303\)/.test(tr));
  ok('Trang: bật / tắt, lời chào, phút tạm dừng (mess_luu_cau_hinh), số liệu (mess_tong_quan), bí mật có / không, webhook URL, trường đăng ký, cài menu, các bước với Meta',
     /mess_luu_cau_hinh/.test(tr) && /mess_tong_quan/.test(tr) && /trangThaiBiMatMess\(\)/.test(tr) && /DUONG_MESSENGER/.test(tr)
     && /truongDangKy/.test(tr) && /caiHoSoMessenger\(/.test(tr) && /Các bước với Meta/.test(tr) && /pages_messaging/.test(tr));
  const bao = readFileSync(join(GOC, 'web/src/lib/messenger-bao.ts'), 'utf8');
  ok('Cookie báo riêng, chỉ sống dưới /noi-bo/messenger, httpOnly', /'\/noi-bo\/messenger'/.test(bao) && /httpOnly: true/.test(bao));
  // Menu nội bộ ở lib/dieu-huong-noi-bo.ts — NoiBo.astro và menu bên kho cùng đọc danh sách đó.
  const nb = readFileSync(join(GOC, 'web/src/layouts/NoiBo.astro'), 'utf8');
  const dongMess = MUC_NOI_BO.filter(m => m.link === '/noi-bo/messenger');
  ok('Menu nội bộ: một dòng Messenger cho chủ, quản lý (NoiBo.astro đọc từ lib/dieu-huong-noi-bo.ts)',
     dongMess.length === 1 && JSON.stringify(dongMess[0].vai) === JSON.stringify(['chu_so_huu', 'quan_ly'])
     && dongMess[0].ngan.vi === 'Messenger' && /thanhTrenNoiBo\(nhanSu\?\.vai_tro\)/.test(nb));
  const tn = readFileSync(join(GOC, 'crm/test/test-noi-bo-tieng-anh.mjs'), 'utf8');
  ok('test-noi-bo-tieng-anh quét trang Messenger', /'pages\/noi-bo\/messenger\.astro'/.test(tn));

  const chu = readFileSync(join(GOC, 'web/src/lib/chu.ts'), 'utf8');
  ok('CAP_DUONG_DAN có /xoa-du-lieu · /en/data-deletion · /ko/data-deletion (sitemap, hreflang tự theo)',
     /\['\/xoa-du-lieu',\s*'\/en\/data-deletion', '\/ko\/data-deletion'\]/.test(chu));
  const TRANG = ['quyen-rieng-tu', 'en/privacy', 'ko/privacy'].map(p => readFileSync(join(GOC, `web/src/pages/${p}.astro`), 'utf8'));
  ok('Ba trang quyền riêng tư: có mục Messenger / Meta, 30 ngày, link hướng dẫn xóa dữ liệu; không còn câu "không ai khác đọc được" tuyệt đối',
     TRANG.every(s => /Messenger/.test(s) && /Meta/.test(s) && /30/.test(s)) && /href="\/xoa-du-lieu"/.test(TRANG[0])
     && /href="\/en\/data-deletion"/.test(TRANG[1]) && /href="\/ko\/data-deletion"/.test(TRANG[2]) && !/Nobody\s+else reads it\.<\/p>/.test(TRANG[1]));
  ok('Ba trang xóa dữ liệu tồn tại', ['xoa-du-lieu', 'en/data-deletion', 'ko/data-deletion'].every(p => existsSync(join(GOC, `web/src/pages/${p}.astro`))));

  const readme = readFileSync(join(GOC, 'web/README.md'), 'utf8');
  const muc = readme.slice(readme.indexOf('## Messenger'));
  ok('web/README.md mục Messenger: sáu bí mật, webhook, ba trường, may_messenger + nhan_su, cài menu, pages_messaging + video, link xóa dữ liệu / quyền riêng tư',
     /^## Messenger/m.test(readme) && Object.values(TEN_BI_MAT_MESS).every(n => muc.includes(n)) && /\/hook\/messenger/.test(muc)
     && ['messages', 'messaging_postbacks', 'message_echoes'].every(x => muc.includes(x)) && /may_messenger/.test(muc) && /insert into nhan_su/.test(muc)
     && /pages_messaging/.test(muc) && /video/i.test(muc) && /\/xoa-du-lieu/.test(muc) && /\/quyen-rieng-tu/.test(muc));
  const t = readFileSync(join(GOC, 'web/wrangler.toml'), 'utf8');
  ok('wrangler.toml không khai bí mật Meta / Messenger', !/(META_|MESS_)[A-Z_]+\s*=/.test(t));
  const env = join(GOC, 'web/.env.example');
  ok('.env.example không nhắc tới bí mật Messenger', !existsSync(env) || !/META_APP_SECRET|META_PAGE_TOKEN|MESS_/.test(readFileSync(env, 'utf8')));

  const can = ['web/src/lib/messenger.ts', 'web/src/lib/messenger-anon.ts', 'web/src/lib/messenger-hook.ts', 'web/src/lib/messenger-bao.ts',
    'web/src/pages/hook/messenger.ts', 'web/src/pages/noi-bo/messenger.astro', 'web/src/pages/xoa-du-lieu.astro',
    'web/src/pages/en/data-deletion.astro', 'web/src/pages/ko/data-deletion.astro', 'crm/test/test-messenger-web.mjs'];
  const lsf = execFileSync('git', ['ls-files', '-co', '--exclude-standard', ...can], { cwd: GOC, encoding: 'utf8' });
  ok('Mọi file mới của phần web Messenger đều không bị .gitignore chặn', can.every(f => lsf.includes(f)), can.filter(f => !lsf.includes(f)).join(', '));
  const ds = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: GOC, encoding: 'utf8' })
    .split('\n').filter(f => f && !f.includes('node_modules/') && existsSync(join(GOC, f)));
  const giong = new RegExp(`(META_APP_${'SECRET'}|META_PAGE_${'TOKEN'}|META_VERIFY_${'TOKEN'}|MESS_KHOA_${'BAM'}|MESS_MAY_${'MAT_KHAU'})\\s*=\\s*["']?[^\\s"'$<{]+`);
  const tim = ds.filter(f => { try { const s = readFileSync(join(GOC, f), 'utf8'); return giong.test(s) || /\bEAA[A-Za-z0-9]{40,}/.test(s) || BI_MAT.some(b => s.includes(b)); } catch { return false; } });
  ok(`Không file nào (${ds.length} file) gán giá trị cho bí mật Meta / Messenger hay chứa Page token thật`, tim.length === 0, tim.join(', '));
});

if (IN) {
  console.log('\n\x1b[1mBẢN HỘI THOẠI MẪU (những gì khách thấy)\x1b[0m');
  for (const [ten, dong] of Object.entries(BAN_HOI_THOAI)) {
    console.log(`\n── ${ten} ──`);
    console.log(dong.join('\n'));
  }
}

process.exit(ketThuc('BOT MESSENGER (PHẦN WEB)'));
