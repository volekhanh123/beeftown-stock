/**
 * BEEFTOWN CRM — Kiểm thử phần WEB của gửi tin Zalo ZBS (0047)
 * ============================================================
 *
 *     node test/test-zalo-web.mjs
 *
 * Phần database nằm ở test-zalo.mjs. File này kiểm:
 *   · lib/zalo.ts (thuần): số điện thoại → 84…, tham số mẫu, dựng thân gửi (mode
 *     chỉ khi chế độ thử), dựng yêu cầu làm mới token, đọc câu trả lời, bảng mã
 *     lỗi → cách xử lý, xóa bí mật + số điện thoại khỏi câu, dịch câu lỗi;
 *   · lib/zalo-ma-hoa.ts: mã hóa khứ hồi, sai loại (AAD) / sai khóa / bị sửa →
 *     hỏng, bản mã đúng dạng CHECK của zalo_cau_hinh;
 *   · lib/zalo-gui.ts: người gửi với client giả + fetch giả — thiếu bí mật, sai
 *     mật khẩu, Zalo tắt, lượt khác đang chạy, làm mới token khi sắp hết hạn và
 *     LƯU token mới TRƯỚC khi gửi, làm mới một lần khi token bị từ chối, ghi kết
 *     quả đúng tham số, dừng lượt khi hết quota, không bao giờ ném lỗi, log và
 *     câu lỗi không có token / secret / số điện thoại;
 *   · chạy thật trên PGlite: đặt bàn → ZBS-01 → người gửi → da_gui, token mới
 *     nằm trong database dưới dạng bản mã;
 *   · src/worker.ts gọi cả hai việc; trang không lộ token; cả repo không có bí mật.
 *
 * Bí mật / token GIẢ dựng lúc chạy — không chuỗi nào trông như bí mật thật nằm
 * nguyên văn trong file (nhóm quét repo sẽ bắt).
 */

import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';
import {
  ZALO_API, XU_LY_LOI, CAU_GUI, sdtZalo, thamSo, dienNoiDung, duLieuMau, thanGui, dungYeuCauGui, dungYeuCauToken,
  docPhanHoi, docPhanHoiToken, loaiCuaMa, xoaBiMatZalo, dichLoiZalo,
} from '../../web/src/lib/zalo.ts';
import {
  danKhoaZalo, maHoaTokenZalo, giaiMaTokenZalo, khoaZaloHopLe, banMaHopLe, MAU_BAN_MA, ZALO_KHOA_TOI_THIEU,
} from '../../web/src/lib/zalo-ma-hoa.ts';
import {
  guiZaloTatCa, layBiMatZalo, trangThaiBiMatZalo, maHoaRefreshToken, TEN_BI_MAT_ZALO,
} from '../../web/src/lib/zalo-gui.ts';
import { danKhoaMay, giaiMaToken } from '../../web/src/lib/kho/may-chung-ma-hoa.ts';
import { dichCau } from '../../web/src/lib/cau-noi-bo.ts';
import { MUC_NOI_BO } from '../../web/src/lib/dieu-huong-noi-bo.ts';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — GỬI TIN ZALO (PHẦN WEB)');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// ---------------------------------------------------------------------------
// Bí mật GIẢ, ghép lúc chạy. Xóa biến môi trường thật trước (không vô tình dùng).
// ---------------------------------------------------------------------------
for (const k of Object.values(TEN_BI_MAT_ZALO)) delete process.env[k];
const ghep = (...p) => p.join('');
const SECRET_GIA = ghep('sk', 'Gia', 'Zalo', 'Q7w', 'E5r', 'T3y');
const KHOA_GIA = ghep('khoa', 'Zalo', 'Gia', 'A1b2', 'C3d4', 'E5f6', 'G7h8', 'I9j0', 'KkLl');      // 38 ký tự
const KHOA_KHAC = ghep('khoa', 'Khac', 'Hoan', 'Toan', 'Z9y8', 'X7w6', 'V5u4', 'T3s2', 'R1q0');
const MAT_KHAU_GIA = ghep('mat', 'khau', 'may', 'zalo', '-', 'gia', '42');
const REFRESH_CU = ghep('RF', 'cu', 'Aa11', 'Bb22', 'Cc33', 'Dd44', 'Ee55', 'Ff66');
const REFRESH_MOI = ghep('RF', 'moi', 'Gg77', 'Hh88', 'Ii99', 'Jj00', 'Kk11', 'Ll22');
const ACCESS_CU = ghep('AC', 'cu', 'Mm33', 'Nn44', 'Oo55', 'Pp66', 'Qq77');
const ACCESS_MOI = ghep('AC', 'moi', 'Rr88', 'Ss99', 'Tt00', 'Uu11', 'Vv22');
const ENV = {
  ZALO_SECRET_KEY: SECRET_GIA, ZALO_KHOA: KHOA_GIA, ZALO_MAY_EMAIL: 'may-zalo@beeftown.test', ZALO_MAY_MAT_KHAU: MAT_KHAU_GIA,
};
const SDT = '0912345678';
const SDT84 = '84912345678';

// ===========================================================================
await nhom('1 · SỐ ĐIỆN THOẠI VÀ THAM SỐ MẪU', async () => {
  ok('0912345678 → 84912345678', sdtZalo('0912345678') === '84912345678');
  ok('+84 / 84 / có dấu cách, chấm, gạch → 84…', sdtZalo('+84 912 345 678') === SDT84 && sdtZalo('84912345678') === SDT84
     && sdtZalo('0912.345-678') === SDT84 && sdtZalo('(091) 2345678') === SDT84);
  ok('Đầu số 03 / 05 / 07 / 08 / 09 đều nhận', ['0321234567', '0561234567', '0771234567', '0861234567'].every(s => sdtZalo(s) === '84' + s.slice(1)));
  ok('Sai dạng → null (9 số, 11 số, chữ, cố định 028, rỗng)',
     [ '091234567', '09123456789', 'abc', '0281234567', '', null, undefined, '+1 555 123 4567'].every(s => sdtZalo(s) === null));

  const nd = 'Chào <customer_name>, bàn <guests> khách lúc <time>. <customer_name> ơi, xem <link_1>!';
  ok('thamSo: theo thứ tự, không lặp (cùng luật zalo_rut_tham_so)',
     JSON.stringify(thamSo(nd)) === JSON.stringify(['customer_name', 'guests', 'time', 'link_1']));
  ok('thamSo: rỗng / null → []', thamSo('') .length === 0 && thamSo(null).length === 0);
  ok('dienNoiDung: điền giá trị, thiếu thì giữ <tên>',
     dienNoiDung(nd, { customer_name: 'An', guests: 4 }) === 'Chào An, bàn 4 khách lúc <time>. An ơi, xem <link_1>!');
  ok('duLieuMau: chỉ giữ chuỗi / số (số → chuỗi)',
     JSON.stringify(duLieuMau({ a: 'x', b: 2, c: null, d: { e: 1 }, f: [1] })) === '{"a":"x","b":"2"}'
     && JSON.stringify(duLieuMau(null)) === '{}' && JSON.stringify(duLieuMau([1, 2])) === '{}');
});

// ===========================================================================
await nhom('2 · DỰNG YÊU CẦU (gửi tin, làm mới token)', async () => {
  const ts = { sdt84: SDT84, templateId: 'tpl_01', duLieu: { customer_name: 'An', guests: 4, x: null }, trackingId: 'id-1', cheDo: 'thu' };
  const thu = thanGui(ts);
  ok('Chế độ thử: có mode = "development"', thu.mode === 'development' && ZALO_API.gui.modeThu === 'development');
  ok('Thân gửi: phone 84…, template_id, template_data (chuỗi), tracking_id = id nhật ký',
     thu.phone === SDT84 && thu.template_id === 'tpl_01' && JSON.stringify(thu.template_data) === '{"customer_name":"An","guests":"4"}'
     && thu.tracking_id === 'id-1', JSON.stringify(thu));
  const that = thanGui({ ...ts, cheDo: 'that' });
  ok('Chế độ thật: KHÔNG có trường mode', !('mode' in that), JSON.stringify(that));

  const yc = dungYeuCauGui(ts, ACCESS_CU);
  ok('Gửi: POST đúng URL, header access_token, JSON', yc.url === 'https://business.openapi.zalo.me/message/template'
     && yc.init.method === 'POST' && yc.init.headers.access_token === ACCESS_CU
     && /application\/json/.test(yc.init.headers['content-type']) && JSON.parse(yc.init.body).phone === SDT84);
  ok('Token KHÔNG nằm trong URL hay thân gửi', !yc.url.includes(ACCESS_CU) && !yc.init.body.includes(ACCESS_CU));

  const tk = dungYeuCauToken({ appId: '123456', refreshToken: REFRESH_CU, secretKey: SECRET_GIA });
  const f = new URLSearchParams(tk.init.body);
  ok('Làm mới token: POST oauth v4, header secret_key, form app_id / grant_type / refresh_token',
     tk.url === 'https://oauth.zaloapp.com/v4/oa/access_token' && tk.init.headers.secret_key === SECRET_GIA
     && /x-www-form-urlencoded/.test(tk.init.headers['content-type']) && f.get('app_id') === '123456'
     && f.get('grant_type') === 'refresh_token' && f.get('refresh_token') === REFRESH_CU);
  ok('Secret key không nằm trong URL / thân', !tk.url.includes(SECRET_GIA) && !tk.init.body.includes(SECRET_GIA));
  ok('Hằng ZALO_API ghi "CHỈNH KHI CÓ TÀI LIỆU"', /CHỈNH KHI CÓ TÀI LIỆU[\s\S]{0,2000}export const ZALO_API/.test(
    readFileSync(join(GOC, 'web/src/lib/zalo.ts'), 'utf8')));
});

// ===========================================================================
await nhom('3 · ĐỌC CÂU TRẢ LỜI VÀ BẢNG MÃ LỖI', async () => {
  const tot = docPhanHoi(200, { error: 0, message: 'Success', data: { msg_id: 'm123', sent_time: '1', quota: { dailyQuota: '500', remainingQuota: '499' } } });
  ok('error 0 → ok, msg_id, quota còn lại (chuỗi → số)', tot.ok && tot.msgId === 'm123' && tot.quotaConLai === 499, JSON.stringify(tot));
  const khongQuota = docPhanHoi(200, { error: 0, data: {} });
  ok('error 0 không có quota / msg_id → null, vẫn ok', khongQuota.ok && khongQuota.msgId === null && khongQuota.quotaConLai === null);

  // Mỗi mã trong bảng → đúng loại → đúng cách xử lý.
  let dung = 0, tong = 0;
  for (const d of ZALO_API.maLoi) for (const ma of d.ma) {
    tong++;
    const r = docPhanHoi(200, { error: ma, message: `loi ${ma}` });
    if (!r.ok && r.loai === d.loai && r.ma === ma && r.cau.includes(String(ma))) dung++;
  }
  ok(`${tong} mã lỗi trong bảng đều phân loại đúng`, tong >= 25 && dung === tong, `${dung}/${tong}`);
  ok('Không mã nào nằm ở hai loại', (() => { const t = ZALO_API.maLoi.flatMap(d => d.ma); return new Set(t).size === t.length; })());
  ok('-124 / -216 → token; -108 → nguoi_nhan; -131 → mau; -144 → het_quota; -104 → cau_hinh',
     loaiCuaMa(-124) === 'token' && loaiCuaMa(-216) === 'token' && loaiCuaMa(-108) === 'nguoi_nhan'
     && loaiCuaMa(-131) === 'mau' && loaiCuaMa(-144) === 'het_quota' && loaiCuaMa(-104) === 'cau_hinh');
  ok('Mã lạ → thu_lai (an toàn: không bỏ tin)', loaiCuaMa(-99999) === 'thu_lai' && docPhanHoi(200, { error: -777 }).loai === 'thu_lai');
  ok('HTTP 500 không JSON → thu_lai; 429 → gioi_han; 401 → token; 200 không JSON → thu_lai',
     docPhanHoi(500, undefined).loai === 'thu_lai' && docPhanHoi(429, undefined).loai === 'gioi_han'
     && docPhanHoi(401, undefined).loai === 'token' && docPhanHoi(200, undefined).loai === 'thu_lai'
     && /HTTP 500/.test(docPhanHoi(500, undefined).cau));

  const X = XU_LY_LOI;
  ok('Người nhận (số sai, chặn tin…) → bi_tu_choi, KHÔNG thử lại', X.nguoi_nhan.ketQua === 'bi_tu_choi' && X.nguoi_nhan.thuLaiSau === null && !X.nguoi_nhan.dungLuot);
  ok('Mẫu sai / chưa duyệt → that_bai, KHÔNG thử lại', X.mau.ketQua === 'that_bai' && X.mau.thuLaiSau === null && !X.mau.dungLuot);
  ok('Lỗi tạm (mạng, 5xx, mã lạ) → that_bai, thử lại, không dừng lượt', X.thu_lai.ketQua === 'that_bai' && X.thu_lai.thuLaiSau >= 60 && !X.thu_lai.dungLuot);
  ok('Hết quota / gọi quá nhanh / cấu hình sai / token / giờ khuya → thử lại sau VÀ dừng lượt',
     ['het_quota', 'gioi_han', 'cau_hinh', 'token', 'ngoai_gio'].every(k => X[k].ketQua === 'that_bai' && X[k].thuLaiSau >= 60 && X[k].dungLuot));
  ok('Mọi thuLaiSau nằm trong 60–86400 giây (database kẹp đúng khoảng đó)',
     Object.values(X).every(x => x.thuLaiSau === null || (x.thuLaiSau >= 60 && x.thuLaiSau <= 86400)));

  const t1 = docPhanHoiToken(200, { access_token: ACCESS_MOI, refresh_token: REFRESH_MOI, expires_in: '90000' });
  ok('Token: đọc access, refresh mới, expires_in (chuỗi → số)', t1.ok && t1.accessToken === ACCESS_MOI && t1.refreshToken === REFRESH_MOI && t1.hetHanGiay === 90000);
  const t2 = docPhanHoiToken(200, { access_token: ACCESS_MOI });
  ok('Token: thiếu expires_in → mặc định; thiếu refresh → null', t2.ok && t2.hetHanGiay === ZALO_API.token.hetHanMacDinhGiay && t2.refreshToken === null);
  const t3 = docPhanHoiToken(400, { error: -14014, error_name: 'Invalid parameter', error_description: 'Invalid refresh token' });
  ok('Token bị từ chối → tamThoi = false, câu có mã và mô tả', !t3.ok && t3.tamThoi === false && /-14014/.test(t3.cau) && /Invalid refresh token/.test(t3.cau), JSON.stringify(t3));
  const t4 = docPhanHoiToken(503, undefined);
  ok('Token 5xx → tamThoi = true', !t4.ok && t4.tamThoi === true);
});

// ===========================================================================
await nhom('4 · XÓA BÍ MẬT, DỊCH CÂU LỖI', async () => {
  const bua = `lỗi ${ACCESS_CU} ${encodeURIComponent(SECRET_GIA)} ${['access', 'token'].join('_')}=abc123def ${['refresh', 'token'].join('_')}: "zzz999" `
    + `${['secret', 'key'].join('_')}=qqq gọi ${SDT} / ${SDT84} / +${SDT84}, mã -108, id 3f2a`;
  const s = xoaBiMatZalo(bua, ACCESS_CU, SECRET_GIA);
  ok('Xóa token, secret key (cả dạng mã hóa URL), mọi "…_token=…", "secret_key=…"',
     !s.includes(ACCESS_CU) && !s.includes(SECRET_GIA) && !/abc123def|zzz999|qqq/.test(s), s);
  ok('Xóa số điện thoại 0… / 84… / +84…', !s.includes('912345678'), s);
  ok('Giữ phần còn lại (mã lỗi, chữ)', /mã -108/.test(s) && /lỗi \*\*\*/.test(s), s);
  ok('Bí mật quá ngắn (< 4) không làm nát câu', xoaBiMatZalo('abc abc', 'ab') === 'abc abc');

  const en = (x) => dichLoiZalo(x, 'en', y => dichCau('en', y));
  ok('Câu của người gửi → tiếng Anh', en(CAU_GUI.sdtSai.vi) === CAU_GUI.sdtSai.en && en(CAU_GUI.tokenHong.vi) === CAU_GUI.tokenHong.en);
  ok('Câu lồng nhau: "Chưa gửi — Zalo báo lỗi -144: …" → tiếng Anh cả hai lớp',
     en(CAU_GUI.chuaGui.vi(CAU_GUI.loiMa.vi('-144: quota'))) === 'Not sent — Zalo returned error -144: quota');
  ok('Câu của database → tra dichCau', en('Chiến dịch đã dừng') === 'The campaign was stopped');
  ok('Tiếng Việt giữ nguyên; rỗng → ""', dichLoiZalo('x', 'vi') === 'x' && dichLoiZalo(null, 'en') === '');
  const viet = /[ạảãàáâậầấẩẫăắằẳẵặẹẻẽèéêệềếểễịỉĩìíọỏõòóôộồốổỗơợờớởỡụủũùúưựừứửữỵỷỹỳýđ]/i;
  const conViet = Object.values(CAU_GUI).map(c => typeof c.vi === 'string' ? c.en : c.en('x')).filter(e => viet.test(e));
  ok('Mọi câu CAU_GUI có bản tiếng Anh không dấu Việt', conViet.length === 0, conViet.join(' | '));
});

// ===========================================================================
await nhom('5 · MÃ HÓA TOKEN (ZALO_KHOA)', async () => {
  const khoa = await danKhoaZalo(KHOA_GIA);
  const ma = await maHoaTokenZalo(khoa, REFRESH_CU, 'refresh');
  ok('Khứ hồi: giải mã ra đúng token', await giaiMaTokenZalo(khoa, ma, 'refresh') === REFRESH_CU);
  ok('Bản mã đúng dạng CHECK (v1.<base64url>, 41–8192 ký tự), không chứa token',
     MAU_BAN_MA.test(ma) && banMaHopLe(ma) && !ma.includes(REFRESH_CU), ma);
  ok('Hai lần mã hóa cùng token → hai chuỗi khác (iv ngẫu nhiên)', ma !== await maHoaTokenZalo(khoa, REFRESH_CU, 'refresh'));
  ok('Sai loại (AAD: bản mã refresh đọc như access) → null', await giaiMaTokenZalo(khoa, ma, 'access') === null);
  ok('Sai khóa → null', await giaiMaTokenZalo(await danKhoaZalo(KHOA_KHAC), ma, 'refresh') === null);
  const sua = ma.slice(0, -2) + (ma.at(-2) === 'A' ? 'B' : 'A') + ma.at(-1);
  ok('Bị sửa một ký tự → null', await giaiMaTokenZalo(khoa, sua, 'refresh') === null);
  ok('Sai dạng / rỗng / không phải chuỗi → null, không ném',
     await giaiMaTokenZalo(khoa, 'v2.abc', 'refresh') === null && await giaiMaTokenZalo(khoa, 'v1.!!', 'refresh') === null
     && await giaiMaTokenZalo(khoa, null, 'refresh') === null && await giaiMaTokenZalo(khoa, 42, 'refresh') === null);
  const rong = await maHoaTokenZalo(khoa, '', 'access');
  const dai = await maHoaTokenZalo(khoa, 'x'.repeat(3000), 'access');
  ok('Token rỗng / 3000 ký tự vẫn nằm trong 41–8192', banMaHopLe(rong) && banMaHopLe(dai) && rong.length >= 41, `${rong.length} / ${dai.length}`);
  ok(`Khóa ngắn (< ${ZALO_KHOA_TOI_THIEU}) không hợp lệ → danKhoaZalo ném`, !khoaZaloHopLe('ngan') && khoaZaloHopLe(KHOA_GIA)
     && await danKhoaZalo('ngan').then(() => false, () => true));
  // Cùng bí mật với kho vẫn ra khóa KHÁC (HKDF muối / info riêng).
  const kho = await danKhoaMay(KHOA_GIA);
  ok('Khóa kho (cùng bí mật) không giải được bản mã Zalo', await giaiMaToken(kho, ma, 'zalo|refresh') === null);

  const mig = readFileSync(join(GOC, 'crm/supabase/migrations/0047_zalo_gui_tin.sql'), 'utf8');
  ok('Dạng bản mã khớp CHECK trong 0047 (regex + 41..8192)',
     mig.includes(`refresh_token_ma_hoa ~ '${MAU_BAN_MA.source.replace(/\\\./, '\\.')}'`) && /between 41 and 8192/.test(mig));
  ok('maHoaRefreshToken: có ZALO_KHOA → bản mã giải được; thiếu → null',
     await giaiMaTokenZalo(khoa, await maHoaRefreshToken(REFRESH_CU, ENV), 'refresh') === REFRESH_CU
     && await maHoaRefreshToken(REFRESH_CU, {}) === null);
});

// ===========================================================================
// NGƯỜI GỬI VỚI CLIENT GIẢ + FETCH GIẢ
// ===========================================================================
const KHOA = await danKhoaZalo(KHOA_GIA);
const giaiMa = (s, l) => giaiMaTokenZalo(KHOA, s, l);
const BAY_GIO = Date.parse('2026-09-27T05:00:00Z');   // 12:00 giờ VN

/** Một lượt giả: `batDau` là kết quả zalo_bat_dau_luot. Mọi lời gọi (rpc + fetch) ghi vào `su` theo thứ tự. */
function dungGia({ batDau, matKhau = MAT_KHAU_GIA, rpcLoi = {}, token, gui } = {}) {
  const su = [];
  const client = {
    rpc: async (ten, ts = {}) => {
      su.push({ loai: 'rpc', ten, ts: structuredClone(ts) });
      if (rpcLoi[ten] && rpcLoi[ten]-- > 0) return { data: null, error: { message: `loi ${ten}` } };
      if (ten === 'zalo_bat_dau_luot') return { data: structuredClone(batDau), error: null };
      if (ten === 'zalo_ghi_ket_qua') return { data: { ok: true, bo_qua: false, id: ts.p_id, ket_qua: ts.p_ket_qua }, error: null };
      return { data: { ok: true }, error: null };
    },
    auth: {
      signInWithPassword: async ({ password }) => {
        su.push({ loai: 'dang_nhap' });
        return password === matKhau ? { data: { session: { access_token: 'x' } }, error: null }
          : { data: { session: null }, error: { message: 'Invalid login credentials' } };
      },
      signOut: async () => { su.push({ loai: 'dang_xuat' }); return { error: null }; },
    },
  };
  let lanGui = 0;
  const fetchFn = async (url, init) => {
    const u = String(url);
    const ban = { loai: 'fetch', url: u, headers: { ...init.headers }, body: init.body };
    su.push(ban);
    if (u === ZALO_API.token.url) {
      const r = typeof token === 'function' ? token(ban) : (token ?? { access_token: ACCESS_MOI, refresh_token: REFRESH_MOI, expires_in: 90000 });
      if (r instanceof Error) throw r;
      return new Response(JSON.stringify(r.body ?? r), { status: r.status ?? 200 });
    }
    const r = typeof gui === 'function' ? gui(ban, lanGui++) : { error: 0, message: 'Success', data: { msg_id: `msg${lanGui++}`, quota: { remainingQuota: 99 } } };
    if (r instanceof Error) throw r;
    if (typeof r === 'string') return new Response(r, { status: 502 });
    return new Response(JSON.stringify(r.body ?? r), { status: r.status ?? 200 });
  };
  return { su, client, fetchFn, rpc: ten => su.filter(s => s.loai === 'rpc' && s.ten === ten), fetch: () => su.filter(s => s.loai === 'fetch') };
}

const tin = (id, o = {}) => ({ id, sdt: SDT, template_id: 'tpl_01', mau_ma: 'ZBS-01', loai_tin: 'giao_dich',
  du_lieu: { customer_name: 'An', phone: SDT }, lan_thu: 1, ...o });
async function cauHinh({ access = ACCESS_CU, hetPhut = 600, cheDo = 'thu', refresh = REFRESH_CU, khoa = KHOA } = {}) {
  return {
    app_id: '123456', oa_id: '654321', che_do: cheDo,
    refresh_token_ma_hoa: refresh === null ? null : await maHoaTokenZalo(khoa, refresh, 'refresh'),
    access_token_ma_hoa: access ? await maHoaTokenZalo(khoa, access, 'access') : null,
    het_han_luc: new Date(BAY_GIO + hetPhut * 60_000).toISOString(),
  };
}
const luot = async (lo, o = {}) => ({ khoa: false, dang_bat: true, trong_khung_cham_soc: true, cau_hinh: await cauHinh(o), lo });
const chay = (g, env = ENV, them = {}) => guiZaloTatCa(env, {
  taoClient: () => g.client, fetchFn: g.fetchFn, ghiLog: () => {}, bayGio: () => BAY_GIO, ...them,
});

/** Mọi chuỗi đi ra ngoài: log + mọi tham số rpc. */
const raNgoai = (g, log) => JSON.stringify(log) + JSON.stringify(g.su.filter(s => s.loai === 'rpc').map(s => s.ts));
const BI_MAT_THO = [SECRET_GIA, KHOA_GIA, MAT_KHAU_GIA, REFRESH_CU, REFRESH_MOI, ACCESS_CU, ACCESS_MOI];
const coLo = s => BI_MAT_THO.filter(b => s.includes(b)).concat(/912345678/.test(s) ? ['SĐT'] : []);

await nhom('6 · NGƯỜI GỬI: THIẾU BÍ MẬT, ĐĂNG NHẬP, ZALO TẮT, KHÓA LƯỢT', async () => {
  let taoLan = 0;
  const log0 = await guiZaloTatCa({}, { taoClient: () => { taoLan++; return {}; }, ghiLog: () => {} });
  ok('Thiếu mọi bí mật → 1 dòng log nêu đủ tên, không tạo client', log0.length === 1 && taoLan === 0
     && /ZALO_SECRET_KEY/.test(log0[0]) && /ZALO_KHOA/.test(log0[0]) && /ZALO_MAY_EMAIL/.test(log0[0]), log0.join());
  const logNgan = await guiZaloTatCa({ ...ENV, ZALO_KHOA: 'ngan' }, { taoClient: () => { taoLan++; return {}; }, ghiLog: () => {} });
  ok('ZALO_KHOA quá ngắn → coi như chưa cài', /ZALO_KHOA/.test(logNgan.join()) && taoLan === 0 && !logNgan.join().includes(SECRET_GIA));

  const sai = dungGia({ batDau: await luot([tin('a1')]), matKhau: 'khac' });
  const log1 = await chay(sai);
  ok('Sai mật khẩu máy → log "không đăng nhập được", không gọi RPC / Zalo', /không đăng nhập được/.test(log1.join())
     && sai.rpc('zalo_bat_dau_luot').length === 0 && sai.fetch().length === 0, log1.join());

  const tat = dungGia({ batDau: { khoa: false, dang_bat: false, cau_hinh: null, lo: [] } });
  const log2 = await chay(tat);
  ok('Zalo tắt → chỉ zalo_bat_dau_luot, không gọi Zalo, không log, rồi đăng xuất',
     tat.su.filter(s => s.loai === 'rpc').map(s => s.ten).join() === 'zalo_bat_dau_luot' && tat.fetch().length === 0
     && log2.length === 0 && tat.su.at(-1).loai === 'dang_xuat', JSON.stringify(tat.su.map(s => s.ten ?? s.loai)));
  ok('p_gioi_han = 50 mặc định', tat.rpc('zalo_bat_dau_luot')[0].ts.p_gioi_han === 50);

  const khoa = dungGia({ batDau: { khoa: true, dang_bat: true, dang_chay_tu: 'x', cau_hinh: null, lo: [] } });
  const log3 = await chay(khoa);
  ok('Lượt khác đang chạy → log, KHÔNG gọi zalo_ket_thuc_luot (không nhả khóa của lượt kia), đăng xuất',
     /đang chạy/.test(log3.join()) && khoa.rpc('zalo_ket_thuc_luot').length === 0 && khoa.fetch().length === 0
     && khoa.su.at(-1).loai === 'dang_xuat', log3.join());

  const loiBd = dungGia({ batDau: null, rpcLoi: { zalo_bat_dau_luot: 1 } });
  const log4 = await chay(loiBd);
  ok('zalo_bat_dau_luot lỗi → log, không gửi, đăng xuất', /không bắt đầu được lượt/.test(log4.join()) && loiBd.fetch().length === 0
     && loiBd.su.at(-1).loai === 'dang_xuat');

  ok('trangThaiBiMatZalo chỉ trả có / không', JSON.stringify(await trangThaiBiMatZalo(ENV)) === '{"secretKey":true,"khoa":true,"taiKhoanMay":true}'
     && JSON.stringify(await trangThaiBiMatZalo({ ZALO_KHOA: 'ngan' })) === '{"secretKey":false,"khoa":false,"taiKhoanMay":false}');
  ok('layBiMatZalo đọc từ env truyền vào (không có thì undefined)', (await layBiMatZalo(ENV)).secretKey === SECRET_GIA
     && (await layBiMatZalo({})).secretKey === undefined);
});

await nhom('7 · NGƯỜI GỬI: LÀM MỚI TOKEN — LƯU TOKEN MỚI TRƯỚC KHI GỬI', async () => {
  const g = dungGia({ batDau: await luot([tin('a1'), tin('a2', { sdt: '0987654321', mau_ma: 'ZBS-02', template_id: 'tpl_02' })], { hetPhut: 30 }) });
  const log = await chay(g);
  const thuTu = g.su.map(s => s.loai === 'fetch' ? (s.url === ZALO_API.token.url ? 'token' : 'gui') : s.ten ?? s.loai);
  ok('Access token còn 30 phút (< 1 giờ) → làm mới TRƯỚC, lưu token NGAY, rồi mới gửi',
     thuTu.join() === 'dang_nhap,zalo_bat_dau_luot,token,zalo_luu_token,gui,zalo_ghi_ket_qua,gui,zalo_ghi_ket_qua,zalo_ket_thuc_luot,dang_xuat',
     thuTu.join());
  const yc = g.fetch()[0];
  const f = new URLSearchParams(yc.body);
  ok('Lệnh làm mới mang refresh token CŨ (đã giải mã), app_id, header secret_key',
     f.get('refresh_token') === REFRESH_CU && f.get('app_id') === '123456' && yc.headers.secret_key === SECRET_GIA);
  const lt = g.rpc('zalo_luu_token')[0].ts;
  ok('zalo_luu_token: cả hai token là BẢN MÃ, giải ra đúng token mới (đúng loại)',
     banMaHopLe(lt.p_access_ma_hoa) && banMaHopLe(lt.p_refresh_ma_hoa)
     && await giaiMa(lt.p_access_ma_hoa, 'access') === ACCESS_MOI && await giaiMa(lt.p_refresh_ma_hoa, 'refresh') === REFRESH_MOI);
  ok('Hạn mới = bây giờ + expires_in', Date.parse(lt.p_het_han_luc) === BAY_GIO + 90000 * 1000, lt.p_het_han_luc);
  const gui = g.fetch().filter(s => s.url === ZALO_API.gui.url);
  ok('Gửi bằng access token MỚI', gui.every(s => s.headers.access_token === ACCESS_MOI));
  const b0 = JSON.parse(gui[0].body), b1 = JSON.parse(gui[1].body);
  ok('Thân gửi: 84…, tracking_id = id nhật ký, template_id của từng tin, mode development (chế độ thử)',
     b0.phone === SDT84 && b0.tracking_id === 'a1' && b0.template_id === 'tpl_01' && b0.mode === 'development'
     && b1.phone === '84987654321' && b1.tracking_id === 'a2' && b1.template_id === 'tpl_02', JSON.stringify([b0, b1]));
  const kq = g.rpc('zalo_ghi_ket_qua').map(s => s.ts);
  ok('zalo_ghi_ket_qua: da_gui, p_ma_zalo = msg_id, không lỗi, không hẹn thử lại',
     kq.length === 2 && kq.every(k => k.p_ket_qua === 'da_gui' && k.p_loi === null && k.p_thu_lai_sau === null)
     && kq[0].p_id === 'a1' && kq[0].p_ma_zalo === 'msg0' && kq[1].p_ma_zalo === 'msg1', JSON.stringify(kq));
  const kt = g.rpc('zalo_ket_thuc_luot')[0].ts;
  ok('zalo_ket_thuc_luot: không lỗi, quota còn lại từ Zalo', kt.p_loi === null && kt.p_quota === 99, JSON.stringify(kt));
  ok('Log một dòng tóm tắt, không bí mật / SĐT', /đã gửi 2/.test(log.join()) && /đã làm mới token/.test(log.join())
     && coLo(raNgoai(g, log)).length === 0, log.join() + ' | lộ: ' + coLo(raNgoai(g, log)).join());

  const moi = dungGia({ batDau: await luot([tin('b1')], { hetPhut: 600, cheDo: 'that' }) });
  await chay(moi);
  ok('Token còn 10 giờ → KHÔNG làm mới, gửi bằng token cũ', moi.fetch().length === 1 && moi.fetch()[0].headers.access_token === ACCESS_CU
     && moi.rpc('zalo_luu_token').length === 0);
  ok('Chế độ thật → thân gửi không có mode', !('mode' in JSON.parse(moi.fetch()[0].body)));

  const chuaCo = dungGia({ batDau: await luot([], { access: null }) });
  const logRong = await chay(chuaCo);
  ok('Chưa có access token, lô rỗng → vẫn làm mới (giữ refresh token sống), không gửi gì',
     chuaCo.fetch().length === 1 && chuaCo.fetch()[0].url === ZALO_API.token.url && chuaCo.rpc('zalo_luu_token').length === 1
     && chuaCo.rpc('zalo_ket_thuc_luot').length === 1, logRong.join());

  const khongXoay = dungGia({ batDau: await luot([tin('b2')], { hetPhut: 10 }), token: { access_token: ACCESS_MOI, expires_in: 3600 } });
  await chay(khongXoay);
  ok('Zalo không trả refresh token mới → p_refresh_ma_hoa null (database giữ cái cũ)',
     khongXoay.rpc('zalo_luu_token')[0].ts.p_refresh_ma_hoa === null);

  const luuHong = dungGia({ batDau: await luot([tin('b3')], { hetPhut: 10 }), rpcLoi: { zalo_luu_token: 2 } });
  await chay(luuHong);
  const ktH = luuHong.rpc('zalo_ket_thuc_luot')[0].ts;
  ok('Lưu token hỏng → thử lưu 2 lần, VẪN gửi bằng token mới, báo lỗi lên loi_cuoi (không lộ token)',
     luuHong.rpc('zalo_luu_token').length === 2 && luuHong.rpc('zalo_ghi_ket_qua')[0]?.ts.p_ket_qua === 'da_gui'
     && /không lưu được/.test(ktH.p_loi) && coLo(ktH.p_loi).length === 0, ktH.p_loi);

  const tuChoi = dungGia({ batDau: await luot([tin('c1'), tin('c2')], { access: null }),
    token: { status: 400, body: { error: -14014, error_name: 'Invalid parameter', error_description: `Invalid refresh token ${REFRESH_CU}` } } });
  await chay(tuChoi);
  const ktT = tuChoi.rpc('zalo_ket_thuc_luot')[0].ts;
  const kqT = tuChoi.rpc('zalo_ghi_ket_qua').map(s => s.ts);
  ok('Zalo từ chối refresh token, không có access token → không gửi, loi_cuoi dặn dán lại',
     tuChoi.fetch().length === 1 && /từ chối refresh token/.test(ktT.p_loi)
     && /dán lại/.test(ktT.p_loi) && !ktT.p_loi.includes(REFRESH_CU), ktT.p_loi);
  // Hồi quy: trước đây tin bị bỏ im → zalo_ket_thuc_luot trả về hàng chờ 5 phút một lần, lan_thu + 1
  // mỗi lượt → sau 25 phút thành that_bai "Đã thử 5 lần mà không nhận được kết quả" (sai lý do).
  ok('Hồi quy: token hỏng → MỖI tin của lô ghi "Chưa gửi — <lý do>", hẹn thử lại 1 giờ (không bị đốt 5 lượt trong 25 phút)',
     kqT.length === 2 && kqT.every(k => k.p_ket_qua === 'that_bai' && k.p_thu_lai_sau === 3600
       && /^Chưa gửi — .*từ chối refresh token/.test(k.p_loi) && !k.p_loi.includes(REFRESH_CU))
     && kqT.map(k => k.p_id).join() === 'c1,c2', JSON.stringify(kqT));

  const mangTat = dungGia({ batDau: await luot([tin('c6')], { access: null }), token: new Error('fetch failed ECONNRESET') });
  await chay(mangTat);
  const kqM = mangTat.rpc('zalo_ghi_ket_qua').map(s => s.ts);
  ok('Hồi quy: làm mới lỗi mạng, không có access token → tin "Chưa gửi", hẹn thử lại như lỗi tạm (300 giây)',
     mangTat.fetch().length === 1 && kqM.length === 1 && kqM[0].p_ket_qua === 'that_bai' && kqM[0].p_thu_lai_sau === 300
     && /^Chưa gửi — Không làm mới được token/.test(kqM[0].p_loi), JSON.stringify(kqM));

  const mangLoi = dungGia({ batDau: await luot([tin('c3')], { hetPhut: 20 }), token: new Error('fetch failed ECONNRESET') });
  await chay(mangLoi);
  ok('Làm mới lỗi mạng nhưng access token còn 20 phút → vẫn gửi bằng token cũ, báo lỗi',
     mangLoi.rpc('zalo_ghi_ket_qua')[0]?.ts.p_ket_qua === 'da_gui' && mangLoi.fetch()[1].headers.access_token === ACCESS_CU
     && /Không làm mới được token/.test(mangLoi.rpc('zalo_ket_thuc_luot')[0].ts.p_loi));

  const khac = dungGia({ batDau: await luot([tin('c4')], { khoa: await danKhoaZalo(KHOA_KHAC) }) });
  await chay(khac);
  ok('Token mã hóa bằng khóa khác (ZALO_KHOA đã đổi) → không gọi Zalo, loi_cuoi "dán lại refresh token"',
     khac.fetch().length === 0 && /ZALO_KHOA/.test(khac.rpc('zalo_ket_thuc_luot')[0].ts.p_loi));
  ok('Hồi quy: ZALO_KHOA đổi → tin của lô ghi "Chưa gửi", hẹn 1 giờ',
     khac.rpc('zalo_ghi_ket_qua').length === 1 && /^Chưa gửi — .*ZALO_KHOA/.test(khac.rpc('zalo_ghi_ket_qua')[0].ts.p_loi)
     && khac.rpc('zalo_ghi_ket_qua')[0].ts.p_thu_lai_sau === 3600);

  const chuaToken = dungGia({ batDau: await luot([tin('c5')], { refresh: null, access: null }) });
  await chay(chuaToken);
  ok('Chưa có refresh token → không gọi Zalo, loi_cuoi "Chưa có refresh token"',
     chuaToken.fetch().length === 0 && /Chưa có refresh token/.test(chuaToken.rpc('zalo_ket_thuc_luot')[0].ts.p_loi));
});

await nhom('8 · NGƯỜI GỬI: TOKEN BỊ TỪ CHỐI GIỮA LƯỢT, PHÂN LOẠI LỖI, DỪNG LƯỢT', async () => {
  const g = dungGia({
    batDau: await luot([tin('d1'), tin('d2')]),
    gui: (b, i) => (b.headers.access_token === ACCESS_CU ? { error: -124, message: 'Access token is invalid' }
      : { error: 0, data: { msg_id: `ok${i}` } }),
  });
  await chay(g);
  const thuTu = g.su.map(s => s.loai === 'fetch' ? (s.url === ZALO_API.token.url ? 'token' : 'gui') : s.ten ?? s.loai);
  ok('-124 → làm mới MỘT lần, lưu token, gửi lại tin đó → da_gui; tin sau dùng token mới',
     thuTu.join() === 'dang_nhap,zalo_bat_dau_luot,gui,token,zalo_luu_token,gui,zalo_ghi_ket_qua,gui,zalo_ghi_ket_qua,zalo_ket_thuc_luot,dang_xuat'
     && g.rpc('zalo_ghi_ket_qua').every(s => s.ts.p_ket_qua === 'da_gui'), thuTu.join());

  const hong = dungGia({ batDau: await luot([tin('e1'), tin('e2')]), gui: () => ({ error: -216, message: 'invalid token' }) });
  await chay(hong);
  const kqH = hong.rpc('zalo_ghi_ket_qua').map(s => s.ts);
  ok('Làm mới rồi vẫn -216 → không làm mới lần hai; tin đó that_bai (hẹn thử lại), tin còn lại "Chưa gửi", dừng lượt',
     hong.fetch().filter(s => s.url === ZALO_API.token.url).length === 1 && hong.fetch().filter(s => s.url === ZALO_API.gui.url).length === 2
     && kqH[0].p_ket_qua === 'that_bai' && kqH[0].p_thu_lai_sau === XU_LY_LOI.token.thuLaiSau && /vẫn từ chối/.test(kqH[0].p_loi)
     && kqH[1].p_ket_qua === 'that_bai' && /^Chưa gửi/.test(kqH[1].p_loi), JSON.stringify(kqH));

  // Bảng: mỗi tin một kiểu trả lời.
  const lo = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'].map(id => tin(id));
  lo[3].sdt = '123';                                         // số sai → không gọi Zalo
  lo[5].template_id = null;
  const tra = {
    f1: { error: -108, message: `Phone ${SDT84} is invalid` },
    f2: { error: -131, message: 'Template not approved' },
    f3: '<html>bad gateway</html>',
    f5: new Error(`connect ECONNREFUSED ${['access', 'token'].join('_')}=${ACCESS_CU}`),
    f7: { error: -144, message: 'Out of quota' },
    f8: { error: 0, data: { msg_id: 'khong-toi' } },
  };
  const b = dungGia({ batDau: await luot(lo), gui: (ban) => tra[JSON.parse(ban.body).tracking_id] });
  const log = await chay(b);
  const kq = Object.fromEntries(b.rpc('zalo_ghi_ket_qua').map(s => [s.ts.p_id, s.ts]));
  ok('-108 (số sai phía Zalo) → bi_tu_choi, không thử lại', kq.f1.p_ket_qua === 'bi_tu_choi' && kq.f1.p_thu_lai_sau === null);
  ok('-131 (mẫu chưa duyệt) → that_bai, không thử lại', kq.f2.p_ket_qua === 'that_bai' && kq.f2.p_thu_lai_sau === null);
  ok('502 không JSON → that_bai, thử lại sau 300 giây', kq.f3.p_ket_qua === 'that_bai' && kq.f3.p_thu_lai_sau === 300 && /HTTP 502/.test(kq.f3.p_loi));
  ok('Số không dùng được cho Zalo → bi_tu_choi, KHÔNG gọi Zalo', kq.f4.p_ket_qua === 'bi_tu_choi'
     && !b.fetch().some(s => JSON.parse(s.body).tracking_id === 'f4'));
  ok('Lỗi mạng → that_bai, thử lại', kq.f5.p_ket_qua === 'that_bai' && kq.f5.p_thu_lai_sau === 300 && /Không gọi được Zalo/.test(kq.f5.p_loi));
  ok('Tin thiếu mã mẫu Zalo → that_bai không thử lại, không gọi Zalo', kq.f6.p_ket_qua === 'that_bai' && kq.f6.p_thu_lai_sau === null);
  ok('-144 (hết quota) → that_bai hẹn 6 giờ, DỪNG lượt: tin sau "Chưa gửi" cùng hẹn, không gọi Zalo',
     kq.f7.p_thu_lai_sau === 6 * 3600 && kq.f8.p_ket_qua === 'that_bai' && kq.f8.p_thu_lai_sau === 6 * 3600 && /^Chưa gửi/.test(kq.f8.p_loi)
     && !b.fetch().some(s => JSON.parse(s.body).tracking_id === 'f8'), JSON.stringify(kq.f8));
  ok('Mọi tin đều được ghi kết quả đúng một lần', Object.keys(kq).length === 8 && b.rpc('zalo_ghi_ket_qua').length === 8);
  const kt = b.rpc('zalo_ket_thuc_luot')[0].ts;
  ok('loi_cuoi = lỗi dừng lượt (hết quota)', /-144/.test(kt.p_loi), kt.p_loi);
  ok('Câu lỗi ghi database + log: không token, không SĐT (Zalo lỡ nhắc lại)', coLo(raNgoai(b, log)).length === 0,
     coLo(raNgoai(b, log)).join());
  ok('Tóm tắt log đếm đúng', /đã gửi 0, thất bại 5, bị từ chối 2, chưa gửi 1/.test(log.join()), log.join());

  // Hết giờ của lượt: tin còn lại không báo kết quả (database trả về hàng chờ).
  let dong = BAY_GIO;
  const cham = dungGia({ batDau: await luot([tin('g1'), tin('g2'), tin('g3')]) });
  await guiZaloTatCa(ENV, { taoClient: () => cham.client, fetchFn: async (...a) => { dong += 100_000; return cham.fetchFn(...a); },
    ghiLog: () => {}, bayGio: () => dong, thoiGianToiDaMs: 150_000 });
  ok('Quá thời gian tối đa của lượt → ngừng lấy tin mới, tin còn lại không ghi kết quả, loi_cuoi báo',
     cham.rpc('zalo_ghi_ket_qua').length === 2 && /Hết thời gian/.test(cham.rpc('zalo_ket_thuc_luot')[0].ts.p_loi));
});

await nhom('9 · NGƯỜI GỬI KHÔNG BAO GIỜ NÉM LỖI', async () => {
  const nem = { rpc: async () => { throw new Error(`boom ${SECRET_GIA}`); },
    auth: { signInWithPassword: async () => ({ data: { session: {} }, error: null }), signOut: async () => { throw new Error('x'); } } };
  let log;
  try { log = await guiZaloTatCa(ENV, { taoClient: () => nem, ghiLog: () => { throw new Error('log hỏng'); } }); } catch { log = null; }
  ok('rpc ném, signOut ném, ghiLog ném → vẫn trả log, không ném', Array.isArray(log) && log.length >= 1 && !log.join().includes(SECRET_GIA), JSON.stringify(log));
  // Hồi quy: ghi "da_gui" lỗi mạng một lần → thử ghi lại, không để tin về hàng chờ rồi gửi khách lần hai.
  const mot = dungGia({ batDau: await luot([tin('h0')]), rpcLoi: { zalo_ghi_ket_qua: 1 } });
  const logMot = await chay(mot);
  ok('Hồi quy: zalo_ghi_ket_qua lỗi MỘT lần → gọi lại đúng tham số, ghi được da_gui, không log lỗi',
     mot.rpc('zalo_ghi_ket_qua').length === 2 && mot.rpc('zalo_ghi_ket_qua').every(s => s.ts.p_ket_qua === 'da_gui' && s.ts.p_id === 'h0')
     && mot.fetch().length === 1 && !/không ghi được kết quả/.test(logMot.join()) && /đã gửi 1/.test(logMot.join()), logMot.join());
  const g = dungGia({ batDau: await luot([tin('h1')]), rpcLoi: { zalo_ghi_ket_qua: 2, zalo_ket_thuc_luot: 1 } });
  let log2;
  try { log2 = await chay(g); } catch { log2 = null; }
  ok('Ghi kết quả / kết thúc lượt lỗi → log, không ném', Array.isArray(log2) && /không ghi được kết quả/.test(log2.join())
     && /không kết thúc được lượt/.test(log2.join()), JSON.stringify(log2));
  const dnNem = { auth: { signInWithPassword: async () => { throw new Error(`net ${MAT_KHAU_GIA}`); } } };
  const log3 = await guiZaloTatCa(ENV, { taoClient: () => dnNem, ghiLog: () => {} });
  ok('Đăng nhập ném → log, không lộ mật khẩu', /không đăng nhập được/.test(log3.join()) && !log3.join().includes(MAT_KHAU_GIA));
  const loBay = dungGia({ batDau: { khoa: false, dang_bat: true, cau_hinh: await cauHinh(), lo: 'khong-phai-mang' } });
  const log4 = await chay(loBay);
  ok('Lô sai dạng → không gửi, vẫn kết thúc lượt', loBay.fetch().length === 0 && loBay.rpc('zalo_ket_thuc_luot').length === 1, log4.join());
});

// ===========================================================================
await nhom('9b · TIN ĐÃ TỚI ZALO MÀ GHI "da_gui" HỎNG: DỪNG GỬI TIẾP, THỬ GHI LẠI CUỐI LƯỢT', async () => {
  // Rà soát 11/10/2026: zalo_ghi_ket_qua hỏng (mạng, hết giờ) hai lần liền → tin bị zalo_ket_thuc_luot
  // trả về hàng chờ và gửi khách lần hai. Lần chờ cuối lượt cho database thêm cơ hội; database đang hỏng
  // thì không gửi thêm tin nào (mỗi tin là thêm một tin có thể bị gửi đôi).
  const cho = [];
  const choGia = async ms => { cho.push(ms); };
  const g = dungGia({ batDau: await luot([tin('k1'), tin('k2'), tin('k3')]), rpcLoi: { zalo_ghi_ket_qua: 2 } });
  const log = await chay(g, ENV, { cho: choGia });
  const ghiK1 = g.rpc('zalo_ghi_ket_qua').filter(s => s.ts.p_id === 'k1');
  ok('Ghi da_gui hỏng hai lần → dừng: không gửi k2, k3', g.fetch().length === 1 && g.rpc('zalo_ghi_ket_qua').every(s => s.ts.p_id === 'k1'),
     g.su.map(s => s.ten ?? s.loai).join());
  ok('… thử ghi lại k1 lần ba (đúng tham số da_gui, mã Zalo) TRƯỚC zalo_ket_thuc_luot, sau một lần chờ',
     ghiK1.length === 3 && ghiK1.every(s => s.ts.p_ket_qua === 'da_gui' && s.ts.p_ma_zalo === 'msg0')
     && g.su.findIndex(s => s.ten === 'zalo_ket_thuc_luot') > g.su.lastIndexOf(ghiK1[2]) && cho.length >= 1 && cho.every(ms => ms > 0),
     `${g.su.map(s => s.ten ?? s.loai).join()} · chờ ${cho.join()}`);
  ok('… log: lúc hỏng nói "không ghi được kết quả", cuối lượt nói đã ghi lại được', /không ghi được kết quả tin k1/.test(log.join())
     && /đã ghi lại được kết quả tin k1/.test(log.join()), log.join(' | '));
  ok('… tóm tắt: đã gửi 1, chưa gửi 2 (k2, k3 về hàng chờ, chưa tới Zalo)', /đã gửi 1, .*chưa gửi 2/.test(log.join()), log.join(' | '));
  ok('… lỗi lượt (loi_cuoi trên bảng sức khỏe) nói lý do dừng', /dừng gửi/.test(g.rpc('zalo_ket_thuc_luot')[0]?.ts.p_loi ?? ''),
     g.rpc('zalo_ket_thuc_luot')[0]?.ts.p_loi);

  const hong = dungGia({ batDau: await luot([tin('m1'), tin('m2')]), rpcLoi: { zalo_ghi_ket_qua: 99 } });
  const logHong = await chay(hong, ENV, { cho: choGia });
  ok('Database hỏng mãi → thử ghi lại có giới hạn, rồi vẫn kết thúc lượt', hong.rpc('zalo_ghi_ket_qua').length <= 5
     && hong.rpc('zalo_ket_thuc_luot').length === 1 && hong.fetch().length === 1, hong.su.map(s => s.ten ?? s.loai).join());
  ok('… log và loi_cuoi nói thật: tin m1 đã tới Zalo nhưng chưa ghi được, có thể bị gửi lần hai',
     /m1 đã tới Zalo nhưng chưa ghi được/.test(logHong.join()) && /có thể bị gửi lần hai/.test(hong.rpc('zalo_ket_thuc_luot')[0]?.ts.p_loi ?? ''),
     `${logHong.join(' | ')} · ${hong.rpc('zalo_ket_thuc_luot')[0]?.ts.p_loi}`);

  // Lỗi lượt quan trọng hơn có từ trước (token mới chưa lưu được) không bị câu "dừng gửi" ghi đè.
  const tk = dungGia({ batDau: await luot([tin('p1'), tin('p2')], { hetPhut: 10 }), rpcLoi: { zalo_luu_token: 2, zalo_ghi_ket_qua: 2 } });
  const logTk = await chay(tk, ENV, { cho: choGia });
  ok('Token mới chưa lưu được + ghi da_gui hỏng → loi_cuoi vẫn là câu token chưa lưu (chủ phải dán lại)',
     /không lưu được/.test(tk.rpc('zalo_ket_thuc_luot')[0]?.ts.p_loi ?? ''), `${tk.rpc('zalo_ket_thuc_luot')[0]?.ts.p_loi} · ${logTk.join(' | ')}`);

  // Database chậm khi không gửi được tin nào (chưa có token): vòng ghi "Chưa gửi" cũng dừng khi hết thời
  // gian của lượt — 50 tin × 2 lần × 20 giây sẽ quá giới hạn của cron, Worker bị giết trước khi nhả khóa.
  let dongHo = BAY_GIO;
  const cham = dungGia({ batDau: await luot([tin('q1'), tin('q2'), tin('q3'), tin('q4'), tin('q5')], { refresh: null }) });
  const rpcCham = cham.client.rpc;
  cham.client.rpc = async (ten, ts) => { if (ten === 'zalo_ghi_ket_qua') dongHo += 100_000; return rpcCham(ten, ts); };
  const logCham = await guiZaloTatCa(ENV, { taoClient: () => cham.client, fetchFn: cham.fetchFn, ghiLog: () => {}, bayGio: () => dongHo,
    thoiGianToiDaMs: 150_000, cho: choGia });
  ok('Chưa có token, database chậm → ngừng ghi "Chưa gửi" khi hết thời gian lượt, vẫn kết thúc lượt',
     cham.rpc('zalo_ghi_ket_qua').length < 5 && cham.rpc('zalo_ket_thuc_luot').length === 1, `${cham.rpc('zalo_ghi_ket_qua').length} lần ghi · ${logCham.join(' | ')}`);
  const dungCham = dungGia({ batDau: await luot([tin('r1'), tin('r2'), tin('r3'), tin('r4'), tin('r5')]),
    gui: () => ({ error: -144, message: 'quota exceeded' }) });
  let dongHo2 = BAY_GIO;
  const rpcDung = dungCham.client.rpc;
  dungCham.client.rpc = async (ten, ts) => { if (ten === 'zalo_ghi_ket_qua') dongHo2 += 100_000; return rpcDung(ten, ts); };
  await guiZaloTatCa(ENV, { taoClient: () => dungCham.client, fetchFn: dungCham.fetchFn, ghiLog: () => {}, bayGio: () => dongHo2,
    thoiGianToiDaMs: 150_000, cho: choGia });
  ok('Lượt đã dừng (lỗi chung), database chậm → ngừng ghi "Chưa gửi" cho tin còn lại khi hết thời gian lượt',
     dungCham.fetch().length === 1 && dungCham.rpc('zalo_ghi_ket_qua').length < 5 && dungCham.rpc('zalo_ket_thuc_luot').length === 1,
     `${dungCham.fetch().length} lần gửi · ${dungCham.rpc('zalo_ghi_ket_qua').length} lần ghi`);

  // Ghi "that_bai" / "bi_tu_choi" hỏng thì KHÔNG dừng: tin đó chưa tới khách, gửi lại không thành tin đôi.
  const tc = dungGia({ batDau: await luot([tin('n1', { sdt: '123' }), tin('n2')]), rpcLoi: { zalo_ghi_ket_qua: 2 } });
  await chay(tc, ENV, { cho: choGia });
  ok('Ghi "bị từ chối" hỏng → vẫn gửi tin sau', tc.fetch().length === 1 && tc.rpc('zalo_ghi_ket_qua').some(s => s.ts.p_id === 'n2' && s.ts.p_ket_qua === 'da_gui'),
     tc.su.map(s => s.ten ?? s.loai).join());
});

await nhom('10 · CHẠY THẬT TRÊN PGLITE: ĐẶT BÀN → XÁC NHẬN → ZBS-01 → NGƯỜI GỬI → da_gui', async () => {
  const { db, cnA, nsId, duoi, duoiAnon } = await dungDatabase();
  const UID_MAY_ZALO = '00000000-0000-4000-8000-0000000000e1';
  await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro) values ($1, $2, 'Máy Zalo', 'may_zalo')`, [UID_MAY_ZALO, cnA.id]);
  await db.query(`update chi_nhanh set dia_chi = '1 Đường Thử', dien_thoai = '0281234567' where id = $1`, [cnA.id]);
  for (let i = 1; i <= 4; i++) await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1, $2, 4)`, [cnA.id, `B0${i}`]);

  /** Client giả nói chuyện với PGlite dưới danh nghĩa một uid (như test-kho-ipos-web). */
  const clientDb = (uid) => ({
    rpc: async (ten, ts = {}) => {
      const k = Object.keys(ts);
      const r = await duoi(uid, `select ${ten}(${k.map((x, i) => `${x} => $${i + 1}`).join(', ')}) as kq`,
        k.map(x => (ts[x] !== null && typeof ts[x] === 'object') ? JSON.stringify(ts[x]) : ts[x]));
      return r.loi ? { data: null, error: { message: r.loi } } : { data: r.rows[0].kq, error: null };
    },
    auth: {
      signInWithPassword: async () => ({ data: { session: { access_token: 'x' } }, error: null }),
      signOut: async () => ({ error: null }),
    },
  });
  const chu = clientDb(UID.chu);
  // Chủ làm đúng như màn Cài đặt Zalo: mã hóa refresh token rồi mới lưu.
  const banMa = await maHoaRefreshToken(REFRESH_CU, ENV);
  const r1 = await chu.rpc('zalo_luu_refresh_token', { p_ma_hoa: banMa });
  ok('Chủ lưu refresh token đã mã hóa (CHECK database nhận)', r1.data?.ok === true, JSON.stringify(r1));
  for (const ma of ['ZBS-01', 'ZBS-02']) await chu.rpc('zalo_luu_mau', { p_ma: ma, p_ma_zalo: `tpl_${ma.slice(-2)}`, p_da_duyet: true, p_bat_tu_dong: true });
  const r2 = await chu.rpc('zalo_luu_cau_hinh', { p_app_id: '123456', p_oa_id: '654321', p_che_do: 'thu', p_dang_bat: true,
    p_gio_tu: null, p_gio_den: null, p_tran_cham_soc_thang: null });
  ok('Chủ bật gửi tin (chế độ thử)', r2.data?.dang_bat === true, JSON.stringify(r2).slice(0, 200));

  const ngay = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  const d = await duoiAnon(`select * from tao_dat_ban('q1', $1, 'Khách Web', $2::date, '19:00'::time, 2::smallint, p_dong_y => false)`, [SDT, ngay]);
  ok('Khách đặt bàn trên web', !d.loi, d.loi ?? '');
  // Từ 0063 tin ZBS chỉ xếp khi nhân viên bấm "Đã gọi xác nhận" — đúng câu của /noi-bo/dat-ban.
  const xn = await duoi(UID.qlA, `update dat_ban set trang_thai = 'da_xac_nhan', nguoi_xu_ly = $2
                                   where id = $1 and trang_thai = 'cho_xac_nhan' returning id`, [d.rows?.[0]?.dat_ban_id, nsId[UID.qlA]]);
  ok('Quản lý bấm "Đã gọi xác nhận"', xn.loi === null && xn.rows.length === 1, xn.loi ?? '');

  const g = dungGia({ batDau: null });
  const log = await guiZaloTatCa(ENV, { taoClient: () => clientDb(UID_MAY_ZALO), fetchFn: g.fetchFn, ghiLog: () => {} });
  const gui = g.fetch().filter(s => s.url === ZALO_API.gui.url);
  ok('Lượt 1: làm mới token (chưa có access) rồi gửi ĐÚNG MỘT tin (ZBS-01; ZBS-02 hẹn sau)',
     g.fetch()[0]?.url === ZALO_API.token.url && gui.length === 1 && JSON.parse(gui[0].body).template_id === 'tpl_01'
     && JSON.parse(gui[0].body).phone === SDT84 && JSON.parse(gui[0].body).mode === 'development', log.join());
  const { rows: tinDb } = await db.query(`select n.id, n.ket_qua, n.ma_zalo_tra_ve, n.loi, m.ma from nhat_ky_tin n join mau_tin m on m.id = n.mau_tin_id order by m.ma`);
  ok('Database: ZBS-01 da_gui (ma_zalo_tra_ve = msg_id, tracking_id = id), ZBS-02 vẫn cho_gui',
     tinDb.length === 2 && tinDb[0].ket_qua === 'da_gui' && tinDb[0].ma_zalo_tra_ve === 'msg0'
     && JSON.parse(gui[0].body).tracking_id === tinDb[0].id && tinDb[1].ket_qua === 'cho_gui', JSON.stringify(tinDb));
  const { rows: [cf] } = await db.query(`select * from zalo_cau_hinh`);
  ok('Database: token mới nằm dưới dạng BẢN MÃ, giải ra đúng; khóa lượt nhả; quota lưu; không lỗi',
     await giaiMa(cf.access_token_ma_hoa, 'access') === ACCESS_MOI && await giaiMa(cf.refresh_token_ma_hoa, 'refresh') === REFRESH_MOI
     && !JSON.stringify(cf).includes(ACCESS_MOI) && !JSON.stringify(cf).includes(REFRESH_MOI)
     && cf.dang_chay_tu === null && cf.quota_con === 99 && cf.loi_cuoi === null && cf.lan_chay_cuoi !== null, JSON.stringify(cf).slice(0, 300));

  const g2 = dungGia({ batDau: null });
  await guiZaloTatCa(ENV, { taoClient: () => clientDb(UID_MAY_ZALO), fetchFn: g2.fetchFn, ghiLog: () => {} });
  ok('Lượt 2: token còn mới, không tin đến hạn → không gọi Zalo lần nào', g2.fetch().length === 0);

  const nguoiLa = await guiZaloTatCa(ENV, { taoClient: () => clientDb(UID.mktA), fetchFn: g2.fetchFn, ghiLog: () => {} });
  ok('Tài khoản không phải may_zalo → database từ chối, log lỗi, không gọi Zalo', /không bắt đầu được lượt/.test(nguoiLa.join())
     && g2.fetch().length === 0, nguoiLa.join());
});

// ===========================================================================
await nhom('11 · WORKER, TRANG, MENU, KHÔNG BÍ MẬT TRONG REPO', async () => {
  const w = readFileSync(join(GOC, 'web/src/worker.ts'), 'utf8');
  const sch = w.slice(w.indexOf('async scheduled('));
  ok('worker.ts: scheduled chạy CẢ HAI việc, mỗi việc một waitUntil (lỗi bên này không chặn bên kia)',
     /import \{ guiZaloTatCa \} from '\.\/lib\/zalo-gui\.ts'/.test(w)
     && /waitUntil\(dongBoTatCa\(env\)\)/.test(sch) && /waitUntil\(guiZaloTatCa\(env\)\)/.test(sch));
  ok('worker.ts: /hook/ipos vẫn chặn trước handle của adapter',
     /async fetch\([\s\S]*startsWith\(DUONG_HOOK\)[\s\S]*xuLyHookIpos\([\s\S]*return handle\(/.test(w));
  const gui = readFileSync(join(GOC, 'web/src/lib/zalo-gui.ts'), 'utf8');
  // Đăng nhập máy dùng chung (lib/tai-khoan-may.ts, rà soát 11/10/2026): zalo-gui.ts phải đi qua đó.
  const mayChung = readFileSync(join(GOC, 'web/src/lib/tai-khoan-may.ts'), 'utf8');
  ok('zalo-gui.ts: client anon riêng không lưu phiên, không tự làm mới (qua dangNhapMay)', /dangNhapMay\(\{/.test(gui)
     && /persistSession: false, autoRefreshToken: false/.test(mayChung) && /global: \{ fetch: taoFetchCoHan\(/.test(mayChung));

  const P = f => readFileSync(join(GOC, 'web/src/pages/noi-bo/zalo', f), 'utf8');
  const cd = P('cai-dat.astro'), idx = P('index.astro'), moi = P('chien-dich/moi.astro');
  ok('Không trang Zalo nào có <script>', ![cd, idx, moi].some(s => /<script/i.test(s)));
  ok('Cài đặt: chỉ chủ; ô token là password, value rỗng; mã hóa (maHoaRefreshToken) TRƯỚC zalo_luu_refresh_token',
     /vai_tro !== 'chu_so_huu'/.test(cd) && /type="password" name="refresh_token" value=""/.test(cd)
     && cd.indexOf('maHoaRefreshToken(token)') > 0 && cd.indexOf('maHoaRefreshToken(token)') < cd.indexOf("rpc('zalo_luu_refresh_token', { p_ma_hoa: banMa })"));
  ok('Cài đặt: có hộp "4 bước chuẩn bị với Zalo" và trạng thái có / không của bốn bí mật',
     /4 bước chuẩn bị với Zalo/.test(cd) && /trangThaiBiMatZalo\(\)/.test(cd) && !/secret_key|ZALO_SECRET_KEY\s*=/.test(cd));
  ok('Chiến dịch mới: ma_gui ẩn, xem trước bằng GET, tạo bằng POST rồi 303',
     /type="hidden" name="ma_gui"/.test(moi) && /form method="GET"/.test(moi) && /zalo_xem_truoc_chien_dich/.test(moi)
     && /Astro\.redirect\('\/noi-bo\/zalo' \+ cnQ, 303\)/.test(moi));
  ok('Tổng quan: thử lại + dừng chiến dịch bằng POST rồi 303, đọc v_zalo_nhat_ky (SĐT che)',
     /zalo_thu_lai/.test(idx) && /zalo_dung_chien_dich/.test(idx) && /, 303\)/.test(idx) && /sdt_an/.test(idx) && !/sdt_gui/.test(idx));
  ok('Không trang nào select * từ zalo_cau_hinh', ![cd, idx, moi].some(s => /from\('zalo_cau_hinh'\)/.test(s)));
  const bao = readFileSync(join(GOC, 'web/src/lib/zalo-bao.ts'), 'utf8');
  ok('Cookie báo riêng, chỉ sống dưới /noi-bo/zalo, httpOnly', /'\/noi-bo\/zalo'/.test(bao) && /httpOnly: true/.test(bao));
  // Menu nội bộ ở lib/dieu-huong-noi-bo.ts — NoiBo.astro và menu bên kho cùng đọc danh sách đó.
  const nb = readFileSync(join(GOC, 'web/src/layouts/NoiBo.astro'), 'utf8');
  const dongZalo = MUC_NOI_BO.filter(m => m.link === '/noi-bo/zalo');
  ok('Menu nội bộ: một dòng Zalo cho chủ, quản lý, marketing (NoiBo.astro đọc từ lib/dieu-huong-noi-bo.ts)',
     dongZalo.length === 1 && JSON.stringify(dongZalo[0].vai) === JSON.stringify(['chu_so_huu', 'quan_ly', 'marketing'])
     && dongZalo[0].ngan.vi === 'Zalo' && /thanhTrenNoiBo\(nhanSu\?\.vai_tro\)/.test(nb));
  const readme = readFileSync(join(GOC, 'web/README.md'), 'utf8');
  ok('web/README.md có mục Zalo: bốn bí mật, tài khoản may_zalo, refresh token đầu tiên, chế độ thử',
     /^## Zalo/m.test(readme) && Object.values(TEN_BI_MAT_ZALO).every(n => readme.includes(n)) && /may_zalo/.test(readme)
     && /refresh token/i.test(readme) && /chế độ thử/i.test(readme));
  const t = readFileSync(join(GOC, 'web/wrangler.toml'), 'utf8');
  ok('wrangler.toml không khai bí mật Zalo', !/ZALO_[A-Z_]+\s*=/.test(t));

  // Quét mọi file git theo dõi + file mới chưa bị .gitignore chặn.
  const ds = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: GOC, encoding: 'utf8' })
    .split('\n').filter(f => f && !f.includes('node_modules/') && existsSync(join(GOC, f)));
  const tenTs = ['access', 'refresh'].map(x => `${x}_token`).join('|');
  // Token Zalo thật: chuỗi base64url dài sau access_token / refresh_token.
  const giongToken = new RegExp(`(${tenTs})["'\\s:=]{1,6}[A-Za-z0-9_-]{40,}`);
  const ganBiMat = new RegExp(`(ZALO_${'SECRET_KEY'}|ZALO_${'KHOA'}|ZALO_MAY_${'MAT_KHAU'})\\s*=\\s*["']?[^\\s"'$<{]+`);
  const giongSecret = new RegExp(`${['secret', 'key'].join('_')}["'\\s:=]{1,6}[A-Za-z0-9]{16,}`);
  const tim = [];
  for (const f of ds) {
    let s;
    try { s = readFileSync(join(GOC, f), 'utf8'); } catch { continue; }
    if (s.includes('\u0000')) continue;
    if (giongToken.test(s) || ganBiMat.test(s) || giongSecret.test(s) || BI_MAT_THO.some(b => s.includes(b))) tim.push(f);
  }
  ok(`Không file nào (${ds.length} file) chứa chuỗi giống token / secret key / bí mật Zalo`, tim.length === 0 && ds.length > 50, tim.join(', '));
  const env = join(GOC, 'web/.env.example');
  ok('.env.example không nhắc tới bí mật Zalo', !existsSync(env) || !/ZALO_/.test(readFileSync(env, 'utf8')));
  const st = execFileSync('git', ['status', '--short', '--untracked-files=all'], { cwd: GOC, encoding: 'utf8' });
  const can = ['web/src/lib/zalo.ts', 'web/src/lib/zalo-ma-hoa.ts', 'web/src/lib/zalo-gui.ts', 'web/src/lib/zalo-bao.ts', 'web/src/lib/zalo-trang.ts',
    'web/src/pages/noi-bo/zalo/index.astro', 'web/src/pages/noi-bo/zalo/cai-dat.astro', 'web/src/pages/noi-bo/zalo/chien-dich/moi.astro',
    'crm/test/test-zalo-web.mjs'];
  const lsf = execFileSync('git', ['ls-files', '-co', '--exclude-standard', ...can], { cwd: GOC, encoding: 'utf8' });
  ok('Mọi file mới của phần web Zalo đều không bị .gitignore chặn', can.every(f => lsf.includes(f)), can.filter(f => !lsf.includes(f)).join(', ') + ' ' + st.slice(0, 0));
});

process.exit(ketThuc('GỬI TIN ZALO (PHẦN WEB)'));
