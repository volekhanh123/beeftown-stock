/**
 * BEEFTOWN — TÀI KHOẢN MÁY: ĐĂNG NHẬP CHUNG, MỖI LỜI GỌI SUPABASE CÓ HẠN GIỜ
 * =========================================================================
 *
 *     node test/test-may-het-gio.mjs
 *
 * Bốn việc chạy nền đăng nhập Supabase bằng tài khoản máy: báo động, Zalo, iPOS
 * (cron + hook nhận hóa đơn), Messenger. Rà soát 11/10/2026: chỉ báo động gắn
 * fetch có hạn giờ (taoFetchCoHan) — client máy của Zalo / iPOS / Messenger mà
 * Supabase treo thì lời gọi treo theo tới khi Worker bị giết (khóa lượt giữ 10
 * phút, khách Messenger không được trả lời). Đăng nhập máy chép bốn lần, nhớ
 * phiên chép hai lần.
 *
 *   · web/src/lib/bien-moi-truong.ts: envWorker, docChuoi, layBienCong — một chỗ.
 *   · web/src/lib/tai-khoan-may.ts: taoFetchCoHan, dangNhapMay, taoPhienMayNho.
 *   · Client Supabase THẬT, chỉ fetch là giả (treo, 429, đăng nhập được rồi RPC
 *     treo): mọi việc chạy nền xong trong vài giây, log nói "quá … giây".
 */

import { readFileSync, existsSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — TÀI KHOẢN MÁY: HẠN GIỜ SUPABASE');

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web', 'src');
const LIB = join(WEB, 'lib');
const doc = p => (existsSync(join(WEB, p)) ? readFileSync(join(WEB, p), 'utf8') : '');
const nap = async p => (existsSync(join(LIB, p)) ? import(join(LIB, p)) : {});

const bmt = await nap('bien-moi-truong.ts');
const may = await nap('tai-khoan-may.ts');
const zalo = await import(join(LIB, 'zalo-gui.ts'));
const ipos = await import(join(LIB, 'kho', 'ipos-dong-bo.ts'));
const iposHook = await import(join(LIB, 'kho', 'ipos-hook.ts'));
const mess = await import(join(LIB, 'messenger-hook.ts'));
const baoDong = await import(join(LIB, 'bao-dong.ts'));

// Ghép từ mảnh — quét bí mật trong repo không bắt nhầm.
const ghep = (...p) => p.join('');
const MAT_KHAU = ghep('mat', 'Khau', 'May', '-gia-', '4242');
const SUPA = { PUBLIC_SUPABASE_URL: 'https://gia-het-gio.supabase.co', PUBLIC_SUPABASE_ANON_KEY: 'anon-gia' };
const HAN_MS = 500;          // hạn giờ mỗi lời gọi trong test
const PHAI_XONG_MS = 6000;   // quá chừng này là treo

/** Chờ p, tối đa ms. Treo → { xong: false }. */
async function trongHan(p, ms = PHAI_XONG_MS) {
  let hen;
  const t0 = Date.now();
  const r = await Promise.race([
    Promise.resolve(p).then(v => ({ xong: true, v }), e => ({ xong: true, nem: e })),
    new Promise(x => { hen = setTimeout(() => x({ xong: false }), ms); }),
  ]);
  clearTimeout(hen);
  return { ...r, ms: Date.now() - t0 };
}

/**
 * fetch giả cho Supabase. kieu: 'treo' (mọi lời gọi treo tới khi bị hủy) | 'rpc-treo'
 * (đăng nhập được, gọi /rest treo) | '429'. Đếm số lần gọi theo loại.
 */
function supaGia(kieu) {
  const dem = { auth: 0, rest: 0, khac: 0 };
  const treo = init => new Promise((_, loi) => {
    const s = init?.signal;
    if (s?.aborted) loi(s.reason ?? new Error('aborted'));
    s?.addEventListener('abort', () => loi(s.reason ?? new Error('aborted')), { once: true });
  });
  const fn = async (url, init) => {
    const u = String(url instanceof Request ? url.url : url);
    if (u.includes('/auth/v1/')) dem.auth++; else if (u.includes('/rest/v1/')) dem.rest++; else dem.khac++;
    if (kieu === '429') {
      return new Response(JSON.stringify({ code: 429, error_code: 'over_request_rate_limit', msg: 'Request rate limit reached' }),
        { status: 429, headers: { 'content-type': 'application/json' } });
    }
    if (kieu === 'treo') return treo(init);
    if (u.includes('/auth/v1/token')) {
      const het = Math.floor(Date.now() / 1000) + 3600;
      return new Response(JSON.stringify({
        access_token: 'tok-gia', refresh_token: 'ref-gia', token_type: 'bearer', expires_in: 3600, expires_at: het,
        user: { id: '00000000-0000-4000-8000-0000000000aa', aud: 'authenticated', role: 'authenticated', email: 'may@beeftown.test',
                app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (u.includes('/auth/v1/logout')) return new Response(null, { status: 204 });
    return treo(init);
  };
  return { fn, dem };
}

// ===========================================================================
await nhom('1 · Một chỗ đọc biến môi trường, một chỗ đăng nhập máy', async () => {
  ok('bien-moi-truong.ts có envWorker, docChuoi, layBienCong', ['envWorker', 'docChuoi', 'layBienCong'].every(t => typeof bmt[t] === 'function'));
  ok('tai-khoan-may.ts có taoFetchCoHan, dangNhapMay, taoPhienMayNho', ['taoFetchCoHan', 'dangNhapMay', 'taoPhienMayNho'].every(t => typeof may[t] === 'function'));
  if (typeof bmt.docChuoi === 'function') {
    ok('docChuoi: nguồn đầu có giá trị thắng, bỏ khoảng trắng, chuỗi rỗng bỏ qua',
       bmt.docChuoi('A', { A: '  ' }, undefined, { A: ' x ' }, { A: 'y' }) === 'x' && bmt.docChuoi('A', { A: 1 }) === undefined);
    ok('layBienCong: đọc từ env truyền vào', bmt.layBienCong('PUBLIC_SUPABASE_URL', { PUBLIC_SUPABASE_URL: 'https://a' }) !== undefined);
  }
  for (const f of ['lib/bao-dong.ts', 'lib/zalo-gui.ts', 'lib/kho/ipos-dong-bo.ts', 'lib/messenger-hook.ts']) {
    const ma = doc(f);
    ok(`${f}: không còn bản chép envWorker / docChuoi / layBienCong / signInWithPassword / createClient`,
       !/function envWorker|function docChuoi|function layBienCong|signInWithPassword|createClient\(/.test(ma));
  }
  for (const f of ['lib/kho/ipos-dong-bo.ts', 'lib/messenger-hook.ts']) {
    ok(`${f}: nhớ phiên máy qua taoPhienMayNho (không còn "let phienNho")`, /taoPhienMayNho\(\)/.test(doc(f)) && !/let phienNho/.test(doc(f)));
  }
  ok('bao-dong.ts vẫn xuất taoFetchCoHan (test-bao-dong-web dùng)', typeof baoDong.taoFetchCoHan === 'function');
});

// ===========================================================================
await nhom('2 · dangNhapMay: thiếu bí mật, thiếu database, Supabase treo / 429', async () => {
  if (typeof may.dangNhapMay !== 'function') { ok('dangNhapMay có để thử', false); return; }
  const T = { tenBiMat: { email: 'X_EMAIL', matKhau: 'X_MAT_KHAU' }, nhan: 'tài khoản máy thử' };
  const thieu = await may.dangNhapMay({ ...T, env: SUPA });
  ok('Thiếu email / mật khẩu → chuaCai, câu "chưa cài X_EMAIL / X_MAT_KHAU"', thieu.ok === false && thieu.chuaCai === true
     && thieu.cau === 'chưa cài X_EMAIL / X_MAT_KHAU', JSON.stringify(thieu));
  // Máy có PUBLIC_SUPABASE_* thật (phiên làm việc) thì không thử ca này: layBienCong đọc cả
  // process.env. fetch giả vẫn được truyền — không lời gọi nào đi ra mạng thật. CI không có .env.
  if (!process.env.PUBLIC_SUPABASE_URL && !process.env.PUBLIC_SUPABASE_ANON_KEY) {
    const khongDb = await may.dangNhapMay({ ...T, email: 'a@b', matKhau: MAT_KHAU, env: {}, fetchGoc: supaGia('429').fn });
    ok('Không có URL / khóa anon → "chưa nối database", chuaCai', khongDb.ok === false && khongDb.chuaCai === true && khongDb.cau === 'chưa nối database',
       JSON.stringify(khongDb));
  }

  const treo = supaGia('treo');
  const r = await trongHan(may.dangNhapMay({ ...T, email: 'a@b', matKhau: MAT_KHAU, env: SUPA, fetchGoc: treo.fn, goiMs: HAN_MS }));
  ok('Supabase treo lúc đăng nhập → trả lỗi trong hạn, không treo', r.xong && !r.nem && r.v?.ok === false, `${r.ms} ms`);
  ok('… câu: "tài khoản máy thử không đăng nhập được: … quá 1 giây không trả lời"', /^tài khoản máy thử không đăng nhập được: .*quá 1 giây không trả lời/.test(r.v?.cau ?? ''),
     r.v?.cau);
  ok('… fetch giả thật sự được gọi (client dùng fetch có hạn, không gọi mạng thật)', treo.dem.auth >= 1, JSON.stringify(treo.dem));
  ok('… mật khẩu không nằm trong câu', !(r.v?.cau ?? '').includes(MAT_KHAU));

  const f429 = supaGia('429');
  const r429 = await may.dangNhapMay({ ...T, email: 'a@b', matKhau: MAT_KHAU, env: SUPA, fetchGoc: f429.fn, goiMs: HAN_MS });
  ok('Supabase 429 → ok:false, không ném, chuaCai: false', r429.ok === false && r429.chuaCai === false && /không đăng nhập được/.test(r429.cau), r429.cau);

  const rpcTreo = supaGia('rpc-treo');
  const dn = await may.dangNhapMay({ ...T, email: 'a@b', matKhau: MAT_KHAU, env: SUPA, fetchGoc: rpcTreo.fn, goiMs: HAN_MS });
  ok('Đăng nhập được → ok, biết hạn phiên (hetLuc)', dn.ok === true && Number.isFinite(dn.hetLuc), JSON.stringify({ ok: dn.ok, het: dn.hetLuc, cau: dn.cau }));
  if (dn.ok) {
    const goi = await trongHan(dn.client.rpc('ham_bat_ky', {}));
    ok('RPC treo sau khi đăng nhập → hết giờ thành { error }, không treo', goi.xong && !goi.nem && goi.v?.error && /quá 1 giây không trả lời/.test(goi.v.error.message),
       `${goi.ms} ms · ${JSON.stringify(goi.v?.error ?? goi.nem?.message)}`);
    const dx = await trongHan(dn.dangXuat());
    ok('dangXuat không ném, không treo', dx.xong && !dx.nem);
  }

  const gia = { auth: { signInWithPassword: async () => ({ data: { session: { access_token: 'x', expires_at: 2_000_000_000 } }, error: null }),
                        signOut: async () => { throw new Error('mạng'); } } };
  const dnGia = await may.dangNhapMay({ ...T, email: 'a@b', matKhau: MAT_KHAU, env: SUPA, taoClient: () => gia });
  ok('taoClient (test) dùng client giả; hetLuc từ expires_at; signOut ném → dangXuat nuốt', dnGia.ok && dnGia.hetLuc === 2_000_000_000_000
     && (await dnGia.dangXuat().then(() => true, () => false)));
});

// ===========================================================================
await nhom('3 · taoPhienMayNho: dùng lại tới 2 phút trước khi hết hạn; hai việc không chung phiên', async () => {
  if (typeof may.taoPhienMayNho !== 'function') { ok('taoPhienMayNho có để thử', false); return; }
  let dangNhap = 0, dangXuat = 0;
  const het = 1_000_000;          // giây
  const gia = () => ({ auth: {
    signInWithPassword: async () => { dangNhap++; return { data: { session: { access_token: 'x', expires_at: het } }, error: null }; },
    signOut: async () => { dangXuat++; return { error: null }; } } });
  const T = { tenBiMat: { email: 'E', matKhau: 'M' }, nhan: 'tài khoản máy thử', email: 'a@b', matKhau: 'm', env: {}, taoClient: gia };
  const a = may.taoPhienMayNho();
  const b = may.taoPhienMayNho();
  const bay = het * 1000 - 10 * 60_000;
  const d1 = await a.dangNhap(T, bay);
  const d2 = await a.dangNhap(T, bay + 60_000);
  ok('Lần hai trong hạn → dùng lại, không đăng nhập lại', dangNhap === 1 && d1.ok && d2.ok && d1.client === d2.client);
  await d2.dangXuat();
  ok('dangXuat của phiên nhớ không đăng xuất thật', dangXuat === 0);
  await b.dangNhap(T, bay);
  ok('Phiên nhớ của việc khác (iPOS ≠ Messenger) không dùng chung', dangNhap === 2);
  const d3 = await a.dangNhap(T, het * 1000 - 60_000);
  ok('Còn dưới 2 phút → đăng xuất phiên cũ, đăng nhập lại', dangNhap === 3 && dangXuat === 1 && d3.ok);
  a.quen();
  await a.dangNhap(T, het * 1000 - 60_000);
  ok('quen() → lần sau đăng nhập lại', dangNhap === 4);
  const c = may.taoPhienMayNho();
  await c.dangNhap({ ...T, email: 'khac@b' }, bay);
  await c.dangNhap(T, bay);
  ok('Đổi email máy → không dùng phiên của email cũ', dangNhap === 6);

  // Hai webhook tới cùng lúc khi chưa có phiên (hoặc phiên sắp hết): một lần đăng nhập, không phiên mồ côi.
  let dnCham = 0, dxCham = 0;
  const cham = () => ({ auth: {
    // Phiên mới hết hạn sau phiên trước một giờ — như Supabase thật cấp phiên mới.
    signInWithPassword: async () => { dnCham++; await new Promise(x => setTimeout(x, 30));
      return { data: { session: { access_token: 'x', expires_at: het + (dnCham - 1) * 3600 } }, error: null }; },
    signOut: async () => { dxCham++; return { error: null }; } } });
  const d = may.taoPhienMayNho();
  const Tc = { ...T, taoClient: cham };
  const [x1, x2, x3] = await Promise.all([d.dangNhap(Tc, bay), d.dangNhap(Tc, bay), d.dangNhap(Tc, bay)]);
  ok('Ba lời gọi đồng thời → đăng nhập đúng một lần, cùng một client', dnCham === 1 && x1.ok && x2.ok && x3.ok
     && x1.client === x2.client && x2.client === x3.client, `đăng nhập ${dnCham} lần`);
  await Promise.all([d.dangNhap(Tc, het * 1000 - 60_000), d.dangNhap(Tc, het * 1000 - 60_000)]);
  ok('Phiên sắp hết, hai lời gọi đồng thời → đăng xuất phiên cũ một lần, đăng nhập lại một lần', dnCham === 2 && dxCham === 1,
     `đăng nhập ${dnCham}, đăng xuất ${dxCham}`);
  const hong = may.taoPhienMayNho();
  let dnHong = 0;
  const Th = { ...T, taoClient: () => ({ auth: { signInWithPassword: async () => { dnHong++; await new Promise(x => setTimeout(x, 10));
    return { data: { session: null }, error: { message: 'Invalid login credentials' } }; }, signOut: async () => ({}) } }) };
  const [h1, h2] = await Promise.all([hong.dangNhap(Th, bay), hong.dangNhap(Th, bay)]);
  ok('Đăng nhập hỏng → mọi lời gọi đang chờ đều nhận lỗi, lần sau thử lại', !h1.ok && !h2.ok && (await hong.dangNhap(Th, bay), dnHong >= 2));
});

// ===========================================================================
const ZALO_ENV = {
  ...SUPA, ZALO_SECRET_KEY: ghep('sec', 'ret', 'Gia', '123'), ZALO_KHOA: ghep('khoa', 'Zalo', 'Gia', '-', 'a'.repeat(40)),
  ZALO_MAY_EMAIL: 'may-zalo@beeftown.test', ZALO_MAY_MAT_KHAU: MAT_KHAU,
};
await nhom('4 · Zalo: Supabase treo không làm treo lượt gửi tin', async () => {
  const treo = supaGia('treo');
  const r = await trongHan(zalo.guiZaloTatCa(ZALO_ENV, { fetchSupabase: treo.fn, hetGioSupabaseMs: HAN_MS, ghiLog: () => {} }));
  ok('Đăng nhập treo → lượt xong trong hạn, một dòng log "không đăng nhập được … quá 1 giây"', r.xong && r.v?.length === 1
     && /tài khoản máy Zalo không đăng nhập được: .*quá 1 giây không trả lời/.test(r.v?.[0] ?? '') && treo.dem.auth >= 1,
     r.xong ? r.v?.join(' | ') : `treo ${r.ms} ms`);
  const rpc = supaGia('rpc-treo');
  const r2 = await trongHan(zalo.guiZaloTatCa(ZALO_ENV, { fetchSupabase: rpc.fn, hetGioSupabaseMs: HAN_MS, ghiLog: () => {} }));
  ok('Đăng nhập được, zalo_bat_dau_luot treo → "không bắt đầu được lượt", không treo', r2.xong
     && /không bắt đầu được lượt: .*quá 1 giây không trả lời/.test(r2.v?.join(' | ') ?? '') && rpc.dem.rest >= 1,
     r2.xong ? r2.v?.join(' | ') : `treo ${r2.ms} ms`);
  ok('Mật khẩu máy không nằm trong log', r.xong && r2.xong && ![...(r.v ?? []), ...(r2.v ?? [])].some(l => l.includes(MAT_KHAU)));
  ok('Hạn giờ mặc định của Zalo có khai (HET_GIO_SUPABASE_ZALO_MS)', Number(zalo.HET_GIO_SUPABASE_ZALO_MS) > 0);
});

// ===========================================================================
const IPOS_ENV = { ...SUPA, KHO_IPOS_EMAIL: 'may-ipos@beeftown.test', KHO_IPOS_MAT_KHAU: MAT_KHAU };
await nhom('5 · iPOS: cron và hook nhận hóa đơn có hạn giờ', async () => {
  const treo = supaGia('treo');
  const r = await trongHan(ipos.dongBoTatCa(IPOS_ENV, { fetchSupabase: treo.fn, hetGioSupabaseMs: HAN_MS, ghiLog: () => {} }));
  ok('Cron: đăng nhập treo → xong trong hạn, log "không đăng nhập được … quá 1 giây"', r.xong
     && /tài khoản máy không đăng nhập được: .*quá 1 giây không trả lời/.test(r.v?.join(' | ') ?? '') && treo.dem.auth >= 1,
     r.xong ? r.v?.join(' | ') : `treo ${r.ms} ms`);
  const rpc = supaGia('rpc-treo');
  const r2 = await trongHan(ipos.dongBoTatCa(IPOS_ENV, { fetchSupabase: rpc.fn, hetGioSupabaseMs: HAN_MS, ghiLog: () => {} }));
  ok('Cron: kho_cn_duoc treo → "không đọc được chi nhánh", không treo', r2.xong && /không đọc được chi nhánh: .*quá 1 giây/.test(r2.v?.join(' | ') ?? ''),
     r2.xong ? r2.v?.join(' | ') : `treo ${r2.ms} ms`);

  const KHOA = 'k'.repeat(40);
  const body = JSON.stringify({ event_id: 12, item_changed: { pos_parent: 'BEEFTOWN', pos_id: '1001' } });   // thực đơn đổi: cần đăng nhập máy
  const treoHook = supaGia('treo');
  const logHook = [];
  const hook = await trongHan(iposHook.xuLyHookIpos(new Request(`https://beeftown.vn/hook/ipos/${KHOA}`, { method: 'POST', body }), KHOA, {
    env: { ...IPOS_ENV, IPOS_CALLBACK_KHOA: KHOA }, fetchSupabase: treoHook.fn, hetGioSupabaseMs: HAN_MS, nhoPhien: false, ghiLog: c => logHook.push(c),
  }));
  ok('Hook: Supabase treo → trả 503 trong hạn (iPOS gửi lại sau), không treo', hook.xong && !hook.nem && hook.v?.status === 503 && treoHook.dem.auth >= 1,
     hook.xong ? `${hook.v?.status} · ${JSON.stringify(treoHook.dem)}` : `treo ${hook.ms} ms`);
  ok('Hook: log nói "quá 1 giây"', /quá 1 giây không trả lời/.test(logHook.join(' | ')), logHook.join(' | '));
  ok('Hạn giờ mặc định của iPOS có khai (HET_GIO_SUPABASE_IPOS_MS)', Number(ipos.HET_GIO_SUPABASE_IPOS_MS) > 0);
});

// ===========================================================================
const APP_SECRET = ghep('app', 'Sec', 'Gia', '42');
const MESS_ENV = {
  ...SUPA, META_APP_SECRET: APP_SECRET, META_PAGE_TOKEN: ghep('EAA', 'Gia', 'Tok', '42'),
  META_VERIFY_TOKEN: 'v'.repeat(40), MESS_MAY_EMAIL: 'may-mess@beeftown.test', MESS_MAY_MAT_KHAU: MAT_KHAU, MESS_KHOA_BAM: 'b'.repeat(40),
};
await nhom('6 · Messenger: Supabase treo không ăn hết thời gian waitUntil', async () => {
  const obj = { object: 'page', entry: [{ id: 'PAGE', time: 1, messaging: [
    { sender: { id: '7001' }, recipient: { id: 'PAGE' }, timestamp: 1, message: { mid: 'm.1', text: 'đặt bàn' } }] }] };
  const raw = JSON.stringify(obj);
  const yc = () => new Request('https://beeftown.vn/hook/messenger', { method: 'POST', body: raw, headers: {
    'content-type': 'application/json', 'x-hub-signature-256': 'sha256=' + createHmac('sha256', APP_SECRET).update(raw).digest('hex') } });
  const meta = [];
  const fetchMeta = async (url, init) => { meta.push({ url: String(url), body: init?.body }); return new Response('{"recipient_id":"1"}', { status: 200 }); };
  for (const [ten, kieu, mau] of [['đăng nhập treo', 'treo', /không đăng nhập được: .*quá 1 giây/], ['mess_lay_phien treo', 'rpc-treo', /không đọc được phiên: .*quá 1 giây/]]) {
    mess.quenTrangThaiMess?.();
    const log = [];
    const cho = [];
    const sg = supaGia(kieu);
    const res = await mess.xuLyHookMessenger(yc(), { env: MESS_ENV, ctx: { waitUntil: p => cho.push(p) }, fetchSupabase: sg.fn, hetGioSupabaseMs: HAN_MS,
      fetchFn: fetchMeta, nhoPhien: false, ghiLog: c => log.push(c) });
    const r = await trongHan(Promise.all(cho));
    ok(`${ten}: trả 200 ngay, việc nền xong trong hạn, đi qua fetch giả`, res.status === 200 && r.xong && sg.dem.auth >= 1,
       `${res.status} · ${r.ms} ms · ${JSON.stringify(sg.dem)}`);
    ok(`${ten}: log nói rõ hết giờ`, mau.test(log.join(' | ')), log.join(' | '));
    ok(`${ten}: không lộ mật khẩu máy`, !log.join().includes(MAT_KHAU));
  }
  // Lô nhiều tin khi database đang hỏng: báo khách TRƯỚC khi đếm sự kiện, tin sau trong lô không gọi
  // database nữa — mỗi lời gọi 8 giây cộng dồn qua cả lô sẽ quá ~30 giây của waitUntil (rà soát).
  mess.quenTrangThaiMess?.();
  const dongThoiGian = [];
  const mayClient = (rpcTra) => ({
    rpc: async (ten) => { dongThoiGian.push(`db:${ten}`); return rpcTra(ten); },
    auth: { signInWithPassword: async () => ({ data: { session: { access_token: 'x' } }, error: null }), signOut: async () => ({ error: null }) },
  });
  const metaGhi = async (url, init) => { dongThoiGian.push(`meta:${JSON.parse(init.body).recipient?.id}`); return new Response('{"recipient_id":"1"}', { status: 200 }); };
  const goi = async (body, client) => {
    const raw2 = JSON.stringify(body);
    const cho2 = [];
    await mess.xuLyHookMessenger(new Request('https://beeftown.vn/hook/messenger', { method: 'POST', body: raw2, headers: {
      'content-type': 'application/json', 'x-hub-signature-256': 'sha256=' + createHmac('sha256', APP_SECRET).update(raw2).digest('hex') } }),
      { env: MESS_ENV, ctx: { waitUntil: p => cho2.push(p) }, taoClientMay: () => client, taoClientAnon: () => null, fetchFn: metaGhi,
        nhoPhien: false, ghiLog: () => {} });
    await Promise.all(cho2);
  };
  const tinKhach = (psid) => ({ sender: { id: psid }, recipient: { id: 'PAGE' }, timestamp: 1, message: { mid: `m.${psid}`, text: 'hi' } });
  // Lượt 1: database trả lời — bot đang bật (nhân viên đang trực nên bot im) → isolate biết bot bật.
  await goi({ object: 'page', entry: [{ id: 'PAGE', time: 1, messaging: [tinKhach('8001')] }] },
    mayClient(ten => (ten === 'mess_lay_phien' ? { data: { dang_bat: true, phien: { dang_tam_dung: true } }, error: null } : { data: null, error: null })));
  dongThoiGian.length = 0;
  // Lượt 2: hai khách trong một lô, database hết giờ ở mọi lời gọi.
  await goi({ object: 'page', entry: [{ id: 'PAGE', time: 1, messaging: [tinKhach('8002'), tinKhach('8003')] }] },
    mayClient(() => ({ data: null, error: { message: 'Error: quá 8 giây không trả lời', code: '' } })));
  const db = dongThoiGian.filter(x => x.startsWith('db:'));
  ok('Lô hai tin, database hỏng: cả hai khách được báo "đang trục trặc"', dongThoiGian.includes('meta:8002') && dongThoiGian.includes('meta:8003'),
     dongThoiGian.join(' → '));
  ok('… báo khách TRƯỚC khi đếm sự kiện lỗi', dongThoiGian.indexOf('meta:8002') < dongThoiGian.indexOf('db:mess_ghi_su_kien'),
     dongThoiGian.join(' → '));
  ok('… tin thứ hai không gọi database nữa (đúng một mess_lay_phien cả lô)', db.filter(x => x === 'db:mess_lay_phien').length === 1, db.join(', '));

  ok('Hạn giờ Messenger ngắn hơn 30 giây waitUntil (HET_GIO_SUPABASE_MESS_MS ≤ 10 giây)',
     Number(mess.HET_GIO_SUPABASE_MESS_MS) > 0 && Number(mess.HET_GIO_SUPABASE_MESS_MS) <= 10_000);
});

process.exit(ketThuc('TÀI KHOẢN MÁY: HẠN GIỜ SUPABASE'));
