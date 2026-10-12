/**
 * THỬ TẢI — nhiều nhân viên dùng kho CÙNG LÚC, trên project THỬ (Beeftown-thu)
 * ============================================================================
 *
 *   SUPABASE_URL=https://<mã project thử>.supabase.co \
 *   SUPABASE_ANON_KEY=<khóa anon của project THỬ> \
 *   TAI_KHOAN='quanly.tap@…:matkhau,thukho.tap@…:matkhau,quay.tap@…:matkhau' \
 *   node test/thu-tai.mjs --nguoi 150 --phut 10
 *
 * (Windows PowerShell: đặt từng biến bằng $env:SUPABASE_URL="…" rồi chạy dòng node.)
 * Không cần cài thêm gì — Node ≥ 22.18 (như mọi kiểm thử của crm). KHÔNG nằm trong `npm test`: nó gọi một
 * project Supabase thật qua mạng.
 *
 * CHỈ CHẠY TRÊN PROJECT THỬ. Script dừng ngay nếu database có chi nhánh nào tên
 * không chứa "BẢN THỬ" — cùng chốt với crm/supabase/thu/*.sql.
 *
 * LÀM GÌ
 *   Mỗi "người ảo" lặp lại: mở một trang kho → nghỉ vài giây → mở trang khác.
 *   Mở một trang = ĐÚNG các lời gọi Supabase mà Worker làm cho trang đó:
 *     chung    kiểm phiên (GET /auth/v1/user) → đọc nhan_su → song song
 *              chi_nhanh + kho_dem_viec (số đỏ trên menu)
 *     Hôm nay  kho_thong_bao (+ tồn, số tảng cho quầy / thủ kho; chỉ số tháng cho quản lý)
 *     Tồn kho  kho_v_ton (+ giá cho vai xem giá)
 *     Thông báo  kho_thong_bao
 *     Nhập hàng  kho_v_phieu_nhap 100 dòng + kho_ten_nhan_su
 *     Đếm quầy   kho_vi_tri + kho_cai_dat
 *   Trang nào, tỉ lệ bao nhiêu: theo vai của tài khoản (bảng TRANG_THEO_VAI).
 *   CHỈ ĐỌC — không ghi phiếu nào, không bấm "đã xem".
 *
 *   Pha 1 (mốc lúc rảnh): 1 người, 30 giây. Pha 2: N người lên dần trong 60
 *   giây (bài thử dưới 3 phút: một phần ba thời gian), chạy P phút. So thời
 *   gian mở trang giữa hai pha.
 *
 * ĐỌC KẾT QUẢ
 *   Thời gian đo từ máy chạy script (Việt Nam → Singapore) nên có thêm độ trễ
 *   mạng — website thật gọi Supabase từ Singapore, nhanh hơn. Con số đáng xem:
 *     · LỖI: 429 (chạm hạn mức), 5xx, mất mạng — phải bằng 0;
 *     · p95 lúc tải so với lúc rảnh — chậm đi vài lần là database đã quá sức;
 *     · CPU của database: Supabase → Reports → Database, xem trong lúc chạy.
 *
 * TÙY CHỌN
 *   --nguoi N         số người ảo (mặc định 100)
 *   --phut P          số phút pha 2 (mặc định 10)
 *   --nghi a-b        nghỉ giữa hai lần mở trang, giây (mặc định 5-15 — dồn dập
 *                     hơn thật: người thật thường 20-60 giây mới bấm một lần)
 *   --bo-moc          bỏ pha 1
 *   --dang-nhap-don K chỉ thử HẠN MỨC ĐĂNG NHẬP: K lượt đăng nhập cùng một lúc,
 *                     đếm bao nhiêu lượt bị 429, rồi đăng xuất hết. Dùng để kiểm
 *                     đã nâng "Rate limit for token refreshes" ở Supabase chưa.
 */

const URL_SB = (process.env.SUPABASE_URL ?? '').replace(/\/+$/, '');
const ANON = process.env.SUPABASE_ANON_KEY ?? '';
const TAI_KHOAN = (process.env.TAI_KHOAN ?? '').split(',').map(s => s.trim()).filter(Boolean).map(s => {
  const i = s.indexOf(':');
  return { email: s.slice(0, i), matKhau: s.slice(i + 1) };
}).filter(t => t.email && t.matKhau);

function thamSo(ten, macDinh) {
  const i = process.argv.indexOf(`--${ten}`);
  if (i < 0) return macDinh;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
}
const SO_NGUOI = Number(thamSo('nguoi', 100));
const SO_PHUT = Number(thamSo('phut', 10));
const [NGHI_MIN, NGHI_MAX] = String(thamSo('nghi', '5-15')).split('-').map(Number);
const BO_MOC = thamSo('bo-moc', false) === true;
const DANG_NHAP_DON = Number(thamSo('dang-nhap-don', 0));

function dung(cau) { console.error(`\n✗ ${cau}\n`); process.exit(2); }
if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(URL_SB)) dung('Thiếu / sai SUPABASE_URL (dạng https://<mã>.supabase.co).');
if (!ANON) dung('Thiếu SUPABASE_ANON_KEY (khóa anon của project THỬ).');
if (TAI_KHOAN.length === 0) dung("Thiếu TAI_KHOAN — dạng 'email:matkhau,email:matkhau' (tài khoản tập của project thử).");
if (!(SO_NGUOI >= 1 && SO_NGUOI <= 1000) || !(SO_PHUT > 0 && SO_PHUT <= 60)) dung('--nguoi 1–1000, --phut tối đa 60.');
if (!(NGHI_MIN >= 0 && NGHI_MAX >= NGHI_MIN)) dung('--nghi dạng a-b, ví dụ 5-15.');

// ---------------------------------------------------------------------------
// GỌI SUPABASE + ĐO
// ---------------------------------------------------------------------------
/** Mọi lời gọi của pha đang chạy: { ten, ms, status } — status 0 = mất mạng / quá giờ. */
let ghiNhan = [];

async function goi(ten, method, duong, { token, body, dem = true } = {}) {
  const t0 = performance.now();
  let status = 0, data = null;
  try {
    const r = await fetch(URL_SB + duong, {
      method,
      headers: {
        apikey: ANON,
        authorization: `Bearer ${token ?? ANON}`,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    status = r.status;
    const chu = await r.text();
    try { data = chu ? JSON.parse(chu) : null; } catch { data = null; }
  } catch { status = 0; }
  const ms = performance.now() - t0;
  if (dem) ghiNhan.push({ ten, ms, status });
  return { ok: status >= 200 && status < 300, status, data, ms };
}

const rest = (ten, duong, token) => goi(ten, 'GET', `/rest/v1/${duong}`, { token });
const rpc = (ten, body, token) => goi(ten, 'POST', `/rest/v1/rpc/${ten}`, { token, body });

async function dangNhap(email, matKhau, dem = false) {
  return goi('đăng nhập', 'POST', '/auth/v1/token?grant_type=password', { body: { email, password: matKhau }, dem });
}

// ---------------------------------------------------------------------------
// TRANG — đúng thứ tự Worker gọi (song song ở chỗ Worker song song)
// ---------------------------------------------------------------------------
const homNayVn = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

async function phanChung(p) {
  const u = await goi('kiểm phiên', 'GET', '/auth/v1/user', { token: p.token });
  if (!u.ok) return false;
  const ns = await rest('nhan_su', `nhan_su?select=id,ho_ten,vai_tro,chi_nhanh_id&auth_uid=eq.${p.uid}&dang_lam=eq.true`, p.token);
  if (!ns.ok) return false;
  await Promise.all([
    rest('chi_nhanh', 'chi_nhanh?select=id,ma,ten&order=ma', p.token),
    rpc('kho_dem_viec', { p_chi_nhanh_id: p.cn }, p.token),
  ]);
  return true;
}

const COT_TON = 'lo_id,ma_lo,mat_hang_id,ma_hang,ten_hang,nhom,loai_hang,dem_goi,don_vi_goi,vi_tri_id,ten_vi_tri,loai_vi_tri,so_kg,so_goi,nguon,ngay_dong_goi,han_dung,so_ngay_con,tinh_trang_han';
const COT_NHAP = 'id,so_phieu,loai,trang_thai,ten_nha_cung_cap,ten_vi_tri,ngay_nhap,so_hoa_don,han_thanh_toan,so_dong,tong_kg,tong_goi,tien_hang,tong_tien,nguoi_tao,created_at';
const XEM_GIA = ['chu_so_huu', 'quan_ly', 'ke_toan'];

const TRANG = {
  'Hôm nay': async p => {
    const cho = [rpc('kho_thong_bao', { p_chi_nhanh_id: p.cn, p_gioi_han: 200 }, p.token)];
    if (p.vai === 'nhan_vien_quay' || p.vai === 'thu_kho') cho.push(rest('kho_v_ton', `kho_v_ton?select=${COT_TON}&chi_nhanh_id=eq.${p.cn}`, p.token));
    if (p.vai === 'nhan_vien_quay') cho.push(rest('kho_v_lo_tang', `kho_v_lo_tang?select=lo_id,so_tang&chi_nhanh_id=eq.${p.cn}`, p.token));
    if (p.vai === 'quan_ly' || p.vai === 'chu_so_huu') {
      const hn = homNayVn();
      cho.push(rpc('kho_chi_so_quan_tri', { p_chi_nhanh_id: p.cn, p_tu: hn.slice(0, 8) + '01', p_den: hn }, p.token));
    }
    await Promise.all(cho);
  },
  'Tồn kho': async p => {
    const cho = [rest('kho_v_ton', `kho_v_ton?select=${COT_TON}&chi_nhanh_id=eq.${p.cn}`, p.token)];
    if (XEM_GIA.includes(p.vai)) cho.push(rest('kho_v_ton_gia', `kho_v_ton_gia?select=lo_id,vi_tri_id,gia_von_kg,gia_tri&chi_nhanh_id=eq.${p.cn}`, p.token));
    await Promise.all(cho);
  },
  'Thông báo': async p => { await rpc('kho_thong_bao', { p_chi_nhanh_id: p.cn, p_gioi_han: 200 }, p.token); },
  'Nhập hàng': async p => {
    const r = await rest('kho_v_phieu_nhap', `kho_v_phieu_nhap?select=${COT_NHAP}&chi_nhanh_id=eq.${p.cn}&order=created_at.desc&limit=100`, p.token);
    const ids = [...new Set((Array.isArray(r.data) ? r.data : []).map(x => x.nguoi_tao).filter(Boolean))];
    if (ids.length) await rpc('kho_ten_nhan_su', { p_ids: ids }, p.token);
  },
  'Đếm quầy': async p => {
    await Promise.all([
      rest('kho_vi_tri', `kho_vi_tri?select=id,chi_nhanh_id,ten,loai,dang_dung,thu_tu&chi_nhanh_id=eq.${p.cn}&order=thu_tu,ten`, p.token),
      rest('kho_cai_dat', `kho_cai_dat?select=chi_nhanh_id,so_le_kg,canh_bao_truoc_ngay&chi_nhanh_id=eq.${p.cn}`, p.token),
    ]);
  },
};

/** Tỉ lệ mở từng trang theo vai (cộng lại = 1). */
const TRANG_THEO_VAI = {
  nhan_vien_quay: { 'Hôm nay': 0.35, 'Đếm quầy': 0.35, 'Tồn kho': 0.2, 'Thông báo': 0.1 },
  thu_kho: { 'Hôm nay': 0.3, 'Nhập hàng': 0.3, 'Tồn kho': 0.3, 'Thông báo': 0.1 },
  quan_ly: { 'Hôm nay': 0.4, 'Thông báo': 0.2, 'Nhập hàng': 0.2, 'Tồn kho': 0.2 },
  chu_so_huu: { 'Hôm nay': 0.4, 'Thông báo': 0.2, 'Nhập hàng': 0.2, 'Tồn kho': 0.2 },
  ke_toan: { 'Hôm nay': 0.3, 'Nhập hàng': 0.5, 'Thông báo': 0.2 },
};

function chonTrang(vai) {
  const bang = TRANG_THEO_VAI[vai];
  let x = Math.random();
  for (const [ten, tl] of Object.entries(bang)) { x -= tl; if (x <= 0) return ten; }
  return Object.keys(bang)[0];
}

/** Một lần mở trang: thời gian cả trang (như người dùng chờ) + ghi tên trang. */
async function moTrang(p, ten) {
  const t0 = performance.now();
  if (await phanChung(p)) await TRANG[ten](p);
  // Lỗi đếm theo từng lời gọi (tongKet) — các người ảo chạy xen nhau.
  ghiNhan.push({ ten: `TRANG · ${ten}`, ms: performance.now() - t0, status: 200 });
}

// ---------------------------------------------------------------------------
// TỔNG KẾT
// ---------------------------------------------------------------------------
function phanVi(ds, p) {
  if (ds.length === 0) return NaN;
  const s = [...ds].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))];
}
const ms = x => Number.isFinite(x) ? `${Math.round(x)} ms` : '—';

function tongKet(ten, giay) {
  const trang = ghiNhan.filter(g => g.ten.startsWith('TRANG · '));
  const loiGoi = ghiNhan.filter(g => !g.ten.startsWith('TRANG · ') && !(g.status >= 200 && g.status < 300));
  const theoMa = {};
  for (const g of loiGoi) {
    const khoa = g.status === 0 ? 'mất mạng / quá 30 giây' : `HTTP ${g.status}`;
    theoMa[khoa] = (theoMa[khoa] ?? 0) + 1;
  }
  console.log(`\n=== ${ten} — ${trang.length} lần mở trang trong ${Math.round(giay)} giây (${(trang.length / giay).toFixed(1)} trang/giây) ===`);
  const bang = {};
  for (const tenTrang of Object.keys(TRANG)) {
    const d = trang.filter(g => g.ten === `TRANG · ${tenTrang}`).map(g => g.ms);
    if (d.length) bang[tenTrang] = { 'số lần': d.length, 'p50': ms(phanVi(d, 50)), 'p95': ms(phanVi(d, 95)), 'chậm nhất': ms(Math.max(...d)) };
  }
  console.table(bang);
  const goiTheoTen = {};
  for (const g of ghiNhan.filter(g => !g.ten.startsWith('TRANG · '))) (goiTheoTen[g.ten] ??= []).push(g.ms);
  const bangGoi = {};
  for (const [t, d] of Object.entries(goiTheoTen).sort((a, b) => phanVi(b[1], 95) - phanVi(a[1], 95))) {
    bangGoi[t] = { 'số lần': d.length, 'p50': ms(phanVi(d, 50)), 'p95': ms(phanVi(d, 95)) };
  }
  console.log('Từng lời gọi Supabase (chậm nhất lên đầu):');
  console.table(bangGoi);
  if (loiGoi.length) console.log(`LỖI: ${loiGoi.length} lời gọi hỏng —`, theoMa);
  else console.log('Không lời gọi nào hỏng.');
  return { p95: phanVi(trang.map(g => g.ms), 95), p50: phanVi(trang.map(g => g.ms), 50), loi: loiGoi.length, soTrang: trang.length };
}

// ---------------------------------------------------------------------------
// CHẠY
// ---------------------------------------------------------------------------
const ngu = s => new Promise(r => setTimeout(r, s * 1000));
const nghiNgauNhien = () => ngu(NGHI_MIN + Math.random() * (NGHI_MAX - NGHI_MIN));

console.log(`\nTHỬ TẢI · ${URL_SB}`);

// --- Đăng nhập từng tài khoản MỘT lần (cách nhau để không tự chạm hạn mức) ---
const phien = [];
for (const t of TAI_KHOAN) {
  let r = await dangNhap(t.email, t.matKhau);
  // 429 ngay từ đầu (vừa thử --dang-nhap-don, hay người khác cùng mạng đang
  // đăng nhập): chờ hạn mức hồi lại rồi thử tiếp, tối đa khoảng một phút.
  for (let lan = 1; r.status === 429 && lan <= 6; lan++) {
    console.log(`  … ${t.email}: 429 (quá hạn mức đăng nhập) — chờ 10 giây rồi thử lại (${lan}/6)`);
    await ngu(10);
    r = await dangNhap(t.email, t.matKhau);
  }
  if (!r.ok || !r.data?.access_token) dung(`Không đăng nhập được ${t.email} (HTTP ${r.status}).`);
  const token = r.data.access_token, uid = r.data.user?.id;
  const ns = await rest('nhan_su', `nhan_su?select=id,vai_tro,chi_nhanh_id&auth_uid=eq.${uid}&dang_lam=eq.true`, token);
  const dong = Array.isArray(ns.data) ? ns.data[0] : null;
  if (!dong) dung(`${t.email} chưa nối với nhân sự nào.`);
  if (!TRANG_THEO_VAI[dong.vai_tro]) { console.log(`  (bỏ ${t.email}: vai ${dong.vai_tro} không dùng các trang kho này)`); continue; }
  phien.push({ email: t.email, token, uid, vai: dong.vai_tro, cn: dong.chi_nhanh_id });
  console.log(`  ✓ ${t.email} — ${dong.vai_tro}`);
  await ngu(2.5);
}
if (phien.length === 0) dung('Không tài khoản nào dùng được.');

// --- Chốt an toàn: chỉ project THỬ --------------------------------------------
const cnRes = await rest('chi_nhanh', 'chi_nhanh?select=id,ten', phien[0].token);
const cacCn = Array.isArray(cnRes.data) ? cnRes.data : [];
if (cacCn.length === 0 || cacCn.some(c => !/BẢN THỬ/i.test(c.ten ?? ''))) {
  dung(`Đây KHÔNG phải project thử (chi nhánh: ${cacCn.map(c => c.ten).join(', ') || '—'}). Chỉ chạy trên Beeftown-thu.`);
}
for (const p of phien) if (!p.cn) p.cn = cacCn[0].id;   // chủ không gắn chi nhánh: dùng chi nhánh thử

// --- Chỉ thử hạn mức đăng nhập ------------------------------------------------
if (DANG_NHAP_DON > 0) {
  if (DANG_NHAP_DON > 200) dung('--dang-nhap-don tối đa 200.');
  console.log(`Gửi ${DANG_NHAP_DON} lượt đăng nhập CÙNG LÚC (xoay vòng ${TAI_KHOAN.length} tài khoản)…`);
  const kq = await Promise.all(Array.from({ length: DANG_NHAP_DON }, (_, i) => {
    const t = TAI_KHOAN[i % TAI_KHOAN.length];
    return dangNhap(t.email, t.matKhau);
  }));
  const dem = {};
  for (const r of kq) {
    const khoa = r.ok ? 'được' : r.status === 429 ? 'bị 429 (quá hạn mức)' : `hỏng HTTP ${r.status}`;
    dem[khoa] = (dem[khoa] ?? 0) + 1;
  }
  console.table(dem);
  // Không để phiên nào sống mà không ai giữ.
  await Promise.all(kq.filter(r => r.ok && r.data?.access_token).map(r =>
    goi('đăng xuất', 'POST', '/auth/v1/logout?scope=local', { token: r.data.access_token, dem: false })));
  console.log('Đã đăng xuất các phiên vừa tạo.');
  console.log((dem['bị 429 (quá hạn mức)'] ?? 0) > 0
    ? '→ Còn lượt bị 429: hạn mức đăng nhập vẫn thấp so với số người mở máy cùng lúc (README, mục Hạ tầng).'
    : '→ Không lượt nào bị 429.');
  process.exit(0);
}

ghiNhan = [];

let dungLai = false;
process.on('SIGINT', () => { dungLai = true; console.log('\n(Ctrl-C — dừng sau lượt đang chạy, in kết quả tới lúc này)'); });

// --- Pha 1: mốc lúc rảnh --------------------------------------------------------
let moc = null;
if (!BO_MOC) {
  console.log('\nPha 1 · 1 người, 30 giây (mốc lúc rảnh)…');
  const t0 = Date.now();
  let i = 0;
  while (Date.now() - t0 < 30_000 && !dungLai) {
    const p = phien[i++ % phien.length];
    await moTrang(p, chonTrang(p.vai));
    await ngu(1);
  }
  moc = tongKet('PHA 1 · LÚC RẢNH', (Date.now() - t0) / 1000);
  ghiNhan = [];
}

// --- Pha 2: N người -------------------------------------------------------------
// Lên dần trong 60 giây (bài thử ngắn: một phần ba thời gian) — không dồn cả trăm người vào cùng một giây.
const GIAY_LEN_DAN = Math.min(60, SO_PHUT * 20);
console.log(`\nPha 2 · ${SO_NGUOI} người, ${SO_PHUT} phút (lên dần trong ${GIAY_LEN_DAN} giây), nghỉ ${NGHI_MIN}–${NGHI_MAX} giây giữa hai trang…`);
const batDau = Date.now();
const hetLuc = batDau + SO_PHUT * 60_000;
const bao = setInterval(() => {
  const trang = ghiNhan.filter(g => g.ten.startsWith('TRANG · '));
  const loi = ghiNhan.filter(g => !g.ten.startsWith('TRANG · ') && !(g.status >= 200 && g.status < 300)).length;
  const gan = trang.slice(-200).map(g => g.ms);
  console.log(`  ${Math.round((Date.now() - batDau) / 1000)} giây · ${trang.length} trang · p95 gần đây ${ms(phanVi(gan, 95))} · lỗi ${loi}`);
}, 15_000);

await Promise.all(Array.from({ length: SO_NGUOI }, async (_, i) => {
  await ngu((i / SO_NGUOI) * GIAY_LEN_DAN);
  const p = phien[i % phien.length];
  while (Date.now() < hetLuc && !dungLai) {
    await moTrang(p, chonTrang(p.vai));
    await nghiNgauNhien();
  }
}));
clearInterval(bao);
const tai = tongKet(`PHA 2 · ${SO_NGUOI} NGƯỜI`, (Date.now() - batDau) / 1000);

// --- Kết luận -------------------------------------------------------------------
console.log('\n=== KẾT LUẬN ===');
if (moc) console.log(`Mở một trang: lúc rảnh p50 ${ms(moc.p50)} → lúc ${SO_NGUOI} người p95 ${ms(tai.p95)} (chậm đi ${(tai.p95 / moc.p50).toFixed(1)} lần).`);
if (tai.loi > 0) {
  console.log(`CHƯA ĐẠT: ${tai.loi} lời gọi hỏng. 429 = chạm hạn mức; 5xx / mất mạng = Supabase quá sức. Xem README, mục Hạ tầng.`);
  process.exit(1);
} else if (tai.p95 > 2000) {
  console.log('CHƯA ĐẠT: 5% số lần mở trang chậm hơn 2 giây. Xem CPU database ở Supabase → Reports trong lúc chạy.');
  process.exit(1);
} else {
  console.log(`ĐẠT: không lỗi, 95% số lần mở trang dưới ${ms(tai.p95)}.`);
}
