/**
 * Kiểm thử Beeftown Cân 2.9.2 — nợ kỹ thuật thấy ở rà soát 11/10/2026, không cần cân thật, không cần kho thật:
 *   1. phiếu huỷ gửi lại (cùng ma_gui) không kẹt ở bước ảnh: ảnh đã tải dùng lại, ảnh mới đánh số tiếp (kho file không cho
 *      ghi đè); bấm hai lần / gửi lại khi lần trước chưa xong vẫn một phiếu; mở lại form cùng các lô giữ mã gửi cũ;
 *   2. một gốc giờ cho cân — giờ Việt Nam, máy tính để múi giờ nào cũng vậy: chạy với TZ=UTC, mốc 23:26 và 00:10 giờ VN;
 *   3. kho đổi khoá / chuyển project (kho-can.json): đọc lại khi kho trả 401 "Invalid API key", khi đăng nhập hỏng, và ngầm
 *      mỗi lần mở chương trình — không còn "Sai email hoặc mật khẩu" oan, không âm thầm ghi vào project cũ;
 *   4. da-gui giữ có hạn (100 bản, 30 ngày), bản lưu không có tên / mật khẩu WiFi; loi.txt có hạn;
 *   5. tsconfig strict và bước tsc của CI còn đó.
 *
 *     cd can-app && npx bun test/thu-no-ky-thuat.ts
 *
 * test/thu.ts gọi `thuNoKyThuat(ok, …)`.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as nv from '../src/nghiep-vu.ts';
import { UngDung, quyenCuaVai, type DanhMucKho, type NguoiDung } from '../src/nghiep-vu.ts';
import { chuoiByte, moCanGia } from './can-gia-hai-chieu.ts';
import { taoKhoGia } from './kho-gia.ts';

type Ok = (ten: string, dieuKien: boolean, chiTiet?: string) => void;
interface TroGiup { fileCan: (dong: string[]) => Uint8Array; plu: (so: number, ma: string, gia: string, ten: string) => string }

const SRC = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'src');
const GOC_REPO = path.join(SRC, '..', '..');
const loiCua = async (f: () => Promise<unknown>) => { try { await f(); return ''; } catch (e) { return (e as Error).message; } };
const nghi = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
/** Chờ tới khi `dk()` đúng, tối đa `ms`. */
async function choToi(dk: () => boolean, ms = 3000): Promise<boolean> {
  const het = Date.now() + ms;
  while (Date.now() < het) { if (dk()) return true; await nghi(20); }
  return dk();
}

export async function thuNoKyThuat(ok: Ok, h: TroGiup): Promise<void> {
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'beeftown-can-no-ky-thuat-'));
  let soThuMuc = 0;
  const ddMoi = () => { soThuMuc++; return { cauHinh: path.join(tam, `appdata${soThuMuc}`), duLieu: path.join(tam, `tai-lieu${soThuMuc}`) }; };
  try {
    await thuPhieuHuy(ok, ddMoi);
    await thuGioVn(ok, h, ddMoi);
    await thuKhoCan(ok, ddMoi);
    await thuDaGuiVaLoi(ok, h, ddMoi, tam);
    thuKiemKieu(ok);
  } finally {
    fs.rmSync(tam, { recursive: true, force: true });
  }
}

// =============================================================================
// 1. PHIẾU HUỶ GỬI LẠI
// =============================================================================
async function thuPhieuHuy(ok: Ok, ddMoi: () => { cauHinh: string; duLieu: string }) {
  console.log('7a · 2.9.2 — phiếu huỷ gửi lại không kẹt ở ảnh, một ma_gui một phiếu');
  const g = taoKhoGia();
  const cn = { id: 'cn1', ma: 'q1', ten: 'Hàm Nghi' };
  const nguoi: NguoiDung = { email: 'nv@b', hoTen: 'NV', vaiTro: 'nhan_vien_quay', chiNhanh: cn, cacChiNhanh: [cn], quyen: quyenCuaVai('nhan_vien_quay') };
  const u = new UngDung(ddMoi(), { kho: g.kho, nguoi });
  const anh = (chu: string) => ({ ten: chu + '.jpg', loai: 'image/jpeg', base64: Buffer.from('anh-' + chu).toString('base64') });
  const phieu = (maGui: string, cacAnh: ReturnType<typeof anh>[]) =>
    ({ maGui, lyDoId: g.LD.han, dong: [{ lo_id: g.L.het }], anh: cacAnh });
  const goiXuat = () => g.goiKho.filter(x => x.ten === 'kho_tao_phieu_xuat');

  {
    // Kho đã ghi phiếu nhưng câu trả lời không tới (mạng chập đúng lúc) → người bấm Gửi lại, cùng form (cùng ma_gui), cùng ảnh.
    const mg = crypto.randomUUID();
    g.hong.phieuXuat = 'sau';
    const loi1 = await loiCua(() => u.taoPhieuHuy(phieu(mg, [anh('a')])));
    const soAnh = g.anhDaTai.length, soXuat = goiXuat().length;
    const lai = await u.taoPhieuHuy(phieu(mg, [anh('a')])).catch((e: Error) => e);
    const cuoi = goiXuat().at(-1);
    ok('HỒI QUY: kho ghi phiếu huỷ rồi mất câu trả lời → bấm Gửi lại cùng form: KHÔNG kẹt ở ảnh ("already exists"), kho trả '
      + 'đúng phiếu cũ (daCo), ảnh không tải lại, một phiếu',
      loi1 !== '' && !(lai instanceof Error) && lai.daCo && lai.soPhieu === g.phieuXuat.get(mg) && g.phieuXuat.size === 1
      && g.anhDaTai.length === soAnh && goiXuat().length === soXuat + 1
      && JSON.stringify(cuoi?.thamSo.p_anh) === JSON.stringify([`cn1/huy/${mg}/1.jpg`]),
      JSON.stringify({ loi1, lai: lai instanceof Error ? lai.message : lai, p_anh: cuoi?.thamSo.p_anh, anh: g.anhDaTai }));
  }
  {
    // Mất mạng trước khi kho ghi; gửi lại có thêm một ảnh: ảnh cũ dùng lại, ảnh mới số 2.
    const mg = crypto.randomUUID();
    g.hong.phieuXuat = 'truoc';
    await loiCua(() => u.taoPhieuHuy(phieu(mg, [anh('b')])));
    const soAnh = g.anhDaTai.length;
    const lai = await u.taoPhieuHuy(phieu(mg, [anh('b'), anh('c')])).catch((e: Error) => e);
    ok('HỒI QUY: gửi lại thêm ảnh → ảnh đã tải giữ số 1 (không tải lại), ảnh mới số 2; phiếu mới (daCo = false)',
      !(lai instanceof Error) && !lai.daCo && g.anhDaTai.length === soAnh + 1
      && JSON.stringify(goiXuat().at(-1)?.thamSo.p_anh) === JSON.stringify([`cn1/huy/${mg}/1.jpg`, `cn1/huy/${mg}/2.jpg`]),
      JSON.stringify({ lai: lai instanceof Error ? lai.message : lai, p_anh: goiXuat().at(-1)?.thamSo.p_anh }));
  }
  {
    // Ảnh 2 kho đã lưu mà hết giờ chờ trả lời; kho cũng không ghi được phiếu. Gửi lại: ảnh 2 đi số 3 (số 2 đã có trong kho).
    const mg = crypto.randomUUID();
    g.hong.anh.set(2, 'luu-roi-loi');
    g.hong.phieuXuat = 'truoc';
    await loiCua(() => u.taoPhieuHuy(phieu(mg, [anh('d'), anh('e')])));
    g.hong.anh.clear();
    const lai = await u.taoPhieuHuy(phieu(mg, [anh('d'), anh('e')])).catch((e: Error) => e);
    ok('HỒI QUY: ảnh đã lưu trong kho mà câu trả lời không tới → gửi lại đánh số tiếp (3), không va số 2; không báo lỗi ảnh',
      !(lai instanceof Error) && lai.loiAnh.length === 0
      && JSON.stringify(goiXuat().at(-1)?.thamSo.p_anh) === JSON.stringify([`cn1/huy/${mg}/1.jpg`, `cn1/huy/${mg}/3.jpg`]),
      JSON.stringify({ lai: lai instanceof Error ? lai.message : lai, p_anh: goiXuat().at(-1)?.thamSo.p_anh }));
  }
  {
    // Bấm đúp (hai yêu cầu cùng ma_gui chạy chồng): một phiếu, ảnh tải một lần, không lần nào báo lỗi.
    const mg = crypto.randomUUID();
    const soAnh = g.anhDaTai.length, soPhieu = g.phieuXuat.size;
    const [k1, k2] = await Promise.all([u.taoPhieuHuy(phieu(mg, [anh('f')])).catch((e: Error) => e), u.taoPhieuHuy(phieu(mg, [anh('f')])).catch((e: Error) => e)]);
    ok('Bấm hai lần (hai yêu cầu cùng ma_gui chồng nhau) → cả hai trả cùng số phiếu, một phiếu, ảnh tải một lần',
      !(k1 instanceof Error) && !(k2 instanceof Error) && k1.soPhieu === k2.soPhieu && [k1.daCo, k2.daCo].sort().join() === 'false,true'
      && g.phieuXuat.size === soPhieu + 1 && g.anhDaTai.length === soAnh + 1,
      JSON.stringify([k1 instanceof Error ? k1.message : k1, k2 instanceof Error ? k2.message : k2]));
  }
  {
    // Form mới (ma_gui mới): ảnh của form khác không bị lấy sang; đánh số lại từ 1 trong thư mục của ma_gui mới.
    const mg = crypto.randomUUID();
    const k = await u.taoPhieuHuy(phieu(mg, [anh('a')]));
    ok('Form mới cùng ảnh → ảnh tải vào thư mục của ma_gui mới, số 1 (không dùng ảnh của phiếu khác)', !k.daCo
      && JSON.stringify(goiXuat().at(-1)?.thamSo.p_anh) === JSON.stringify([`cn1/huy/${mg}/1.jpg`]), JSON.stringify(goiXuat().at(-1)?.thamSo.p_anh));
  }
  {
    // Kho đã ghi phiếu, câu trả lời mất, rồi chương trình KHỞI ĐỘNG LẠI (Cập nhật, mất điện, F5): bộ nhớ trống, trang mở form
    // mới — ma_gui mới cho đúng các lô đó. Lần gửi chưa chắc nằm trong file → dùng lại ma_gui cũ; ảnh số 1 đã có trong kho thì
    // tải vào số sau, không kẹt "already exists".
    const dd = ddMoi();
    const mg = crypto.randomUUID();
    g.hong.phieuXuat = 'sau';
    await loiCua(() => new UngDung(dd, { kho: g.kho, nguoi }).taoPhieuHuy(phieu(mg, [anh('g')])));
    const soPhieu = g.phieuXuat.size;
    const u2 = new UngDung(dd, { kho: g.kho, nguoi });
    const k = await u2.taoPhieuHuy(phieu(crypto.randomUUID(), [anh('g')])).catch((e: Error) => e);
    ok('HỒI QUY: kho đã ghi phiếu huỷ, mất câu trả lời, chương trình khởi động lại, mở form mới cùng các lô → vẫn MỘT phiếu (kho trả '
      + 'phiếu đã có), không kẹt ở ảnh',
      !(k instanceof Error) && k.daCo && k.soPhieu === g.phieuXuat.get(mg) && g.phieuXuat.size === soPhieu
      && String(goiXuat().at(-1)?.thamSo.p_ma_gui) === mg, JSON.stringify(k instanceof Error ? k.message : k));
    const k2 = await u2.taoPhieuHuy(phieu(crypto.randomUUID(), [anh('h')])).catch((e: Error) => e);
    ok('… kho đã trả lời (phiếu chắc chắn có) thì quên: lần sau cùng các lô là phiếu mới',
      !(k2 instanceof Error) && !k2.daCo && g.phieuXuat.size === soPhieu + 1, JSON.stringify(k2 instanceof Error ? k2.message : k2));
  }
  const gd = fs.readFileSync(path.join(SRC, 'giao-dien.html'), 'utf8');
  ok('Giao diện: kho trả phiếu đã có → nói rõ phiếu giữ nội dung lần gửi trước (số lượng, lý do, ảnh đổi sau không được ghi)',
    /k\.daCo \? '<p>Phiếu giữ đúng nội dung của lần gửi trước/.test(gd));
  {
    // Cùng chương trình (không khởi động lại): gửi hỏng chưa chắc → bấm Thôi, mở lại form cùng các lô (trang tạo ma_gui mới).
    const mg = crypto.randomUUID();
    g.hong.phieuXuat = 'sau';
    await loiCua(() => u.taoPhieuHuy(phieu(mg, [anh('i')])));
    const soPhieu = g.phieuXuat.size;
    const k = await u.taoPhieuHuy(phieu(crypto.randomUUID(), [anh('i')])).catch((e: Error) => e);
    ok('HỒI QUY: gửi phiếu huỷ hỏng rồi bấm Thôi, mở lại form cùng các lô (ma_gui mới) → kho trả phiếu đã có, không thành hai phiếu',
      !(k instanceof Error) && k.daCo && k.soPhieu === g.phieuXuat.get(mg) && g.phieuXuat.size === soPhieu,
      JSON.stringify(k instanceof Error ? k.message : k));
  }
}

// =============================================================================
// 2. MỘT GỐC GIỜ: GIỜ VIỆT NAM
// =============================================================================
async function thuGioVn(ok: Ok, h: TroGiup, ddMoi: () => { cauHinh: string; duLieu: string }) {
  console.log('7b · 2.9.2 — giờ cho cân luôn là giờ Việt Nam, máy tính để múi giờ UTC');
  const tzCu = process.env.TZ;
  process.env.TZ = 'UTC';
  const can = await moCanGia({ du: { phan: { PLU: [chuoiByte(h.plu(1, '10001', '845,0', 'Lõi vai bò Mỹ'))], TMS: ['TMS\t0\t28\t'] } } });
  try {
    ok('Máy thử đang ở múi UTC (Bun đổi múi giờ theo TZ lúc chạy)', new Date(Date.UTC(2026, 9, 11, 16, 26)).getHours() === 16);
    let moc = Date.parse('2026-10-11T16:26:00Z');   // 23:26 ngày 11/10 giờ VN
    const danhMuc: DanhMucKho = { mauMaVach: '2XCCCCCWWWWWK', matHang: [] };
    const u = new UngDung(ddMoi(), { danhMuc: async () => danhMuc, mang: [], mac: async () => null, bayGio: () => moc,
      tuyHaiChieu: { choMs: 1500, choNoiMs: 1000, choHangRaoMs: 1500, nghiBaoCaoMs: 1 } });
    u.luuCauHinh({ ipCan: '127.0.0.1', congCan: 1, congHaiChieu: can.cong, tuDatGio: false });

    const k = await u.chinhGioCan({});
    ok('HỒI QUY: "Chỉnh giờ cân" không chọn giờ, 23:26 giờ VN, máy tính để UTC → cân đặt 23:26 ngày 11/10 (không phải 16:26)',
      JSON.stringify(can.du.gio) === JSON.stringify({ nam: 2026, thang: 10, ngay: 11, gio: 23, phut: 26, giay: 0 })
      && k.gio.gio === 23, JSON.stringify([can.du.gio, k]));
    moc = Date.parse('2026-10-11T17:10:00Z');        // 00:10 ngày 12/10 giờ VN — ngày UTC còn là 11/10
    await u.chinhGioCan({});
    ok('HỒI QUY: 00:10 giờ VN (UTC còn hôm qua) → cân đặt ngày 12/10 00:10 — ngày đóng gói, HSD in đúng ngày',
      JSON.stringify(can.du.gio) === JSON.stringify({ nam: 2026, thang: 10, ngay: 12, gio: 0, phut: 10, giay: 0 }), JSON.stringify(can.du.gio));
    ok('Ngày không có thật (31/02) chọn tay → báo, không nối cân', /không hợp lệ/.test(await loiCua(() => u.chinhGioCan({ luc: '2026-02-31T10:00' }))));

    can.du.gio = { nam: 2026, thang: 10, ngay: 12, gio: 0, phut: 10, giay: 30 };
    const dg = await u.gioCan() as unknown as Record<string, unknown>;
    ok('HỒI QUY: "Đọc giờ cân" so với giờ VN: cân 00:10:30, VN 00:10:00 → nhanh 30 giây (không lệch 7 tiếng)',
      dg.gioVn === '2026-10-12 00:10:00' && dg.lechGiay === 30 && !('gioMay' in dg), JSON.stringify(dg));
    const tt = await u.thongTinCanHaiChieu() as unknown as Record<string, unknown>;
    ok('HỒI QUY: "Đọc thông tin cân" cũng so với giờ VN', tt.gioVn === '2026-10-12 00:10:00' && tt.lechGiay === 30, JSON.stringify(tt));

    can.du.gio = { nam: 2026, thang: 10, ngay: 12, gio: 0, phut: 10, giay: 0 };
    const cd = await u.chanDoanWifi({});
    const tep = fs.existsSync(cd.duongDan) ? fs.readFileSync(cd.duongDan, 'utf8') : '';
    ok('HỒI QUY: Chẩn đoán WiFi so giờ cân với giờ VN ("khớp giờ Việt Nam"); tên file và dòng "Lúc" theo giờ VN',
      /khớp giờ Việt Nam/.test(cd.buoc.find(b => b.ma === 'gio')?.cau ?? '') && path.basename(cd.duongDan) === 'chan-doan-20261012-001000.txt'
      && tep.includes('Lúc: 2026-10-12 00:10:00'), JSON.stringify([cd.buoc.find(b => b.ma === 'gio'), path.basename(cd.duongDan)]));

    u.ghiNhanFileTuCan(h.fileCan([h.plu(1, '10001', '845,0', 'Lõi vai bò Mỹ')]));
    ok('Bản lưu da-gui đặt tên theo giờ VN (20261012-001000.TMS)', fs.readdirSync(u.thuMucDaGui).includes('20261012-001000.TMS'),
      fs.readdirSync(u.thuMucDaGui).join());
    u.dongNen();
  } finally {
    await can.dong();
    if (tzCu === undefined) delete process.env.TZ; else process.env.TZ = tzCu;
  }

  // Mã nguồn: không còn chỗ nào lấy ngày giờ theo múi của máy.
  const MAY = /\.(getFullYear|getMonth|getDate|getHours|getMinutes|getSeconds|setDate)\(\)|\.setDate\(/;
  const sai: string[] = [];
  for (const f of fs.readdirSync(SRC).filter(t => t.endsWith('.ts'))) {
    fs.readFileSync(path.join(SRC, f), 'utf8').split('\n').forEach((d, i) => { if (MAY.test(d)) sai.push(`${f}:${i + 1}`); });
  }
  ok('HỒI QUY: src/*.ts không lấy ngày / giờ theo múi giờ của máy (getHours, getDate… — dùng gio-vn.ts)', sai.length === 0, sai.join(' '));

  const gd = fs.readFileSync(path.join(SRC, 'giao-dien.html'), 'utf8');
  const saiGd: string[] = [];
  gd.split('\n').forEach((d, i) => {
    if (MAY.test(d)) saiGd.push(`${i + 1}: múi máy`);
    if (/\.toLocale(Time|Date)String\((?![^)]*timeZone)/.test(d) || /new Date\([^)]*\)\.toLocaleString\((?![^)]*timeZone)/.test(d)) saiGd.push(`${i + 1}: thiếu timeZone`);
  });
  ok('HỒI QUY: giao diện hiện giờ / ngày theo giờ VN (timeZone Asia/Ho_Chi_Minh), không theo múi giờ của máy', saiGd.length === 0, saiGd.join(' | '));

  // Hàm giờ VN của giao diện (khối giữa hai dấu) chạy được ở múi UTC: 00:10 giờ VN ngày 12/10.
  const khoi = /\/\/ ---- GIỜ VIỆT NAM[^\n]*\n([\s\S]*?)\/\/ ---- HẾT GIỜ VIỆT NAM/.exec(gd)?.[1] ?? '';
  process.env.TZ = 'UTC';
  try {
    const ham = new Function(`${khoi}; return { phanGioVn, ngayVnIso, congNgayIso, gioVnChu };`)() as {
      phanGioVn: (ms: number) => Record<string, number>; ngayVnIso: (ms: number) => string; congNgayIso: (iso: string, n: number) => string;
      gioVnChu: (ms: number) => string;
    };
    const ms = Date.parse('2026-10-11T17:10:05Z');
    ok('Giao diện: giờ VN lúc 17:10:05 UTC ngày 11/10 là 00:10:05 ngày 12/10; lùi 6 ngày = 06/10; cuối tháng, năm nhuận đúng',
      JSON.stringify(ham.phanGioVn(ms)) === JSON.stringify({ nam: 2026, thang: 10, ngay: 12, gio: 0, phut: 10, giay: 5 })
      && ham.ngayVnIso(ms) === '2026-10-12' && ham.congNgayIso('2026-10-12', -6) === '2026-10-06' && ham.congNgayIso('2028-02-28', 1) === '2028-02-29'
      && ham.congNgayIso('2026-12-31', 1) === '2027-01-01' && ham.gioVnChu(ms) === '00:10:05 12/10/2026',
      JSON.stringify([ham.phanGioVn(ms), ham.ngayVnIso(ms), ham.gioVnChu(ms)]));
  } catch (e) {
    ok('Giao diện: có khối hàm giờ VN (phanGioVn, ngayVnIso, congNgayIso, gioVnChu) giữa "// ---- GIỜ VIỆT NAM" và "// ---- HẾT GIỜ VIỆT NAM"',
      false, String(e));
  } finally {
    if (tzCu === undefined) delete process.env.TZ; else process.env.TZ = tzCu;
  }
  ok('Giao diện: nút chỉnh giờ nói "theo giờ Việt Nam", không còn "theo máy tính"', !/Chỉnh giờ cân theo máy tính|Đặt giờ cân theo giờ máy tính/.test(gd)
    && /Chỉnh giờ cân theo giờ Việt Nam/.test(gd));
}

// =============================================================================
// 3. KHO ĐỔI KHOÁ / CHUYỂN PROJECT — ĐỌC LẠI kho-can.json
// =============================================================================
/** Phiên đăng nhập giả còn hạn 1 giờ (dạng auth-js lưu trong phien.json). */
const phienGia = () => ({
  access_token: 'thu.thu.thu', refresh_token: 'thu', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: { id: '00000000-0000-4000-8000-000000000002', aud: 'authenticated', role: 'authenticated', email: 'ql@beeftown.vn',
          app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
});

/**
 * Web (kho-can.json) và hai project Supabase giả. Mỗi project nhận đúng một khoá (`khoa`); khoá khác → 401
 * {"message":"Invalid API key"} như Supabase. Mật khẩu đúng là "dung". Ghi lại mọi lần gọi theo máy.
 */
function moiTruongKho() {
  const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { 'content-type': 'application/json' } });
  const m = {
    web: { url: 'http://a.thu', khoa: 'khoa-moi', cheDo: 'tot' as 'tot' | 'hong' | '404', treMs: 0 },
    /** jwtHetHan: bảng trả 401 "JWT expired" (phiên hết hạn — không phải sai khoá). */
    project: { 'a.thu': { khoa: 'khoa-moi' }, 'b.thu': { khoa: 'khoa-b' } } as Record<string, { khoa: string; jwtHetHan?: boolean }>,
    goi: [] as string[],
    f: null as unknown as typeof fetch,
  };
  m.f = (async (dau: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = new URL(typeof dau === 'string' ? dau : dau instanceof URL ? dau.href : dau.url);
    m.goi.push(`${init?.method ?? 'GET'} ${url.host}${url.pathname}`);
    if (url.host === 'web.thu') {
      if (m.web.treMs) await nghi(m.web.treMs);
      if (m.web.cheDo === 'hong') throw new TypeError('fetch failed');
      if (m.web.cheDo === '404') return new Response('Không có', { status: 404 });
      return json({ supabaseUrl: m.web.url, anonKey: m.web.khoa });
    }
    const p = m.project[url.host];
    if (!p) throw new TypeError('fetch failed');
    const headers = new Headers(init?.headers ?? (dau instanceof Request ? dau.headers : undefined));
    if (headers.get('apikey') !== p.khoa) return json({ message: 'Invalid API key', hint: 'Double check your Supabase `anon` or `service_role` API key.' }, 401);
    if (url.pathname === '/auth/v1/token') {
      const than = JSON.parse(String(init?.body ?? '{}')) as { password?: string };
      if (url.searchParams.get('grant_type') === 'password' && than.password !== 'dung') {
        return json({ code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' }, 400);
      }
      return json(phienGia());
    }
    if (url.pathname === '/auth/v1/logout') return new Response(null, { status: 204 });
    if (p.jwtHetHan && url.pathname.startsWith('/rest/v1/')) return json({ code: 'PGRST303', message: 'JWT expired', hint: null, details: null }, 401);
    if (url.pathname === '/rest/v1/nhan_su') return json({ id: 'ns1', ho_ten: 'QL thử', vai_tro: 'quan_ly', chi_nhanh_id: 'cn1' });
    if (url.pathname === '/rest/v1/chi_nhanh') return json([{ id: 'cn1', ma: 'Q1', ten: 'Quầy thử' }]);
    return json({}, 404);
  }) as unknown as typeof fetch;
  return m;
}

async function thuKhoCan(ok: Ok, ddMoi: () => { cauHinh: string; duLieu: string }) {
  console.log('7c · 2.9.2 — kho đổi khoá / chuyển project: đọc lại kho-can.json');
  const m = moiTruongKho();
  const dd = ddMoi();
  fs.mkdirSync(dd.cauHinh, { recursive: true });
  const fileCh = path.join(dd.cauHinh, 'cau-hinh.json');
  const ch = () => JSON.parse(fs.readFileSync(fileCh, 'utf8')) as { supabaseUrl?: string; anonKey?: string };
  fs.writeFileSync(fileCh, JSON.stringify({ ipCan: '127.0.0.1', congCan: 1, diaChiKho: 'http://web.thu', supabaseUrl: 'http://a.thu', anonKey: 'khoa-cu' }));
  let moc = Date.now();
  const tuy = { fetch: m.f, hanYeuCauKhoMs: 2000, hanHoiQuyenMs: 2000, mang: [], mac: async () => null, bayGio: () => moc };
  const u = new UngDung(dd, tuy);
  const dn = await u.dangNhap('ql@beeftown.vn', 'dung').catch((e: Error) => e);
  ok('HỒI QUY: kho đổi khoá anon (khoá lưu trên máy bị từ chối 401) → đăng nhập tự đọc lại kho-can.json rồi vào được, '
    + 'không báo "Sai email hoặc mật khẩu"; cau-hinh.json lưu khoá mới',
    !(dn instanceof Error) && dn.vaiTro === 'quan_ly' && ch().anonKey === 'khoa-moi', dn instanceof Error ? dn.message : JSON.stringify(ch()));

  const soToken = () => m.goi.filter(g => g.includes('/auth/v1/token')).length;
  const soWeb = () => m.goi.filter(g => g.startsWith('GET web.thu')).length;
  const t0 = soToken(), w00 = soWeb();
  const sai = await loiCua(() => u.dangNhap('ql@beeftown.vn', 'sai'));
  ok('Sai mật khẩu thật (khoá đúng, kho trả 400) → vẫn "Sai email hoặc mật khẩu", đăng nhập thử một lần, không đọc lại kho-can.json',
    sai === 'Sai email hoặc mật khẩu.' && soToken() === t0 + 1 && soWeb() === w00, `${sai} · ${soToken() - t0} lần đăng nhập, ${soWeb() - w00} lần đọc web`);
  await u.dangNhap('ql@beeftown.vn', 'dung').catch(() => null);

  // Đang chạy thì kho đổi khoá, web chưa kịp đổi: 401 liên tiếp chỉ đọc kho-can.json một lần mỗi phút.
  // Phiên hết hạn (401 "JWT expired") không phải sai khoá: không đọc lại kho-can.json (tự gửi, báo kho chạy mỗi phút).
  m.project['a.thu'].jwtHetHan = true;
  moc += 61_000;
  const wJwt = soWeb();
  await loiCua(() => u.nguoiDung());
  await nghi(50);
  m.project['a.thu'].jwtHetHan = false;
  ok('Kho trả 401 "JWT expired" (phiên hết hạn) → không đọc lại kho-can.json', soWeb() === wJwt, `${soWeb() - wJwt} lần`);

  m.project['a.thu'].khoa = 'khoa-moi-2';
  const w0 = soWeb();
  const l1 = await loiCua(() => u.nguoiDung());
  await choToi(() => soWeb() > w0, 1000);
  await loiCua(() => u.nguoiDung());
  await loiCua(() => u.nguoiDung());
  await nghi(50);
  ok('Kho trả 401 "Invalid API key" → câu báo nói kho đổi khoá (không "Có lỗi: Invalid API key"); đọc lại kho-can.json một lần '
    + '(nhiều lần 401 trong một phút không đọc lại liên tục)', /khoá truy cập/.test(l1) && !/Có lỗi/.test(l1) && soWeb() === w0 + 1, `${l1} · ${soWeb() - w0} lần`);
  m.web.khoa = 'khoa-moi-2';
  moc += 61_000;
  await loiCua(() => u.nguoiDung());
  await choToi(() => ch().anonKey === 'khoa-moi-2');
  const nd = await u.nguoiDung().catch((e: Error) => e);
  ok('HỒI QUY: web đổi theo, quá một phút → lần 401 sau đọc lại, dùng khoá mới; phiên đăng nhập (cùng project) giữ nguyên',
    !(nd instanceof Error) && nd?.vaiTro === 'quan_ly' && ch().anonKey === 'khoa-moi-2', nd instanceof Error ? nd.message : JSON.stringify([nd, ch()]));
  u.dongNen();

  // Khôi phục sang project MỚI mà project cũ vẫn chạy (cùng mật khẩu): mở chương trình là kiểm ngầm kho-can.json.
  m.web.url = 'http://b.thu';
  m.web.khoa = 'khoa-b';
  fs.writeFileSync(path.join(dd.cauHinh, 'phien.json'), JSON.stringify({ 'sb-a-auth-token': JSON.stringify(phienGia()) }));
  const u2 = new UngDung(dd, tuy);
  await u2.nguoiDung().catch(() => null);
  const doi = await choToi(() => ch().supabaseUrl === 'http://b.thu' && ch().anonKey === 'khoa-b');
  const truocA = m.goi.filter(g => g.includes(' a.thu/')).length;
  const nd2 = await u2.nguoiDung().catch((e: Error) => e);
  ok('HỒI QUY: kho chuyển sang project mới, project cũ còn chạy → mở chương trình thì đọc lại kho-can.json (ngầm), theo project mới; '
    + 'không đọc / ghi project cũ nữa; phải đăng nhập lại (chưa có phiên ở project mới)',
    doi && nd2 === null && m.goi.filter(g => g.includes(' a.thu/')).length === truocA, JSON.stringify([ch(), nd2 instanceof Error ? nd2.message : nd2]));
  const dn2 = await u2.dangNhap('ql@beeftown.vn', 'dung').catch((e: Error) => e);
  ok('… đăng nhập lại vào project mới được', !(dn2 instanceof Error) && m.goi.at(-1)?.includes('b.thu') === true, dn2 instanceof Error ? dn2.message : '');
  u2.dongNen();

  // Cuộc đua: kho đã chuyển project (cũ vẫn chạy), web trả chậm — người đăng nhập ngay lúc mở, đăng nhập vào project cũ được
  // TRƯỚC khi lần kiểm ngầm xong. Phải chờ lần kiểm đó rồi đăng nhập lại vào project mới, không để phiên ở project cũ.
  {
    const dd2 = ddMoi();
    fs.mkdirSync(dd2.cauHinh, { recursive: true });
    fs.writeFileSync(path.join(dd2.cauHinh, 'cau-hinh.json'), JSON.stringify({ ipCan: '127.0.0.1', congCan: 1, diaChiKho: 'http://web.thu',
      supabaseUrl: 'http://a.thu', anonKey: 'khoa-moi-2' }));
    const chDua = () => JSON.parse(fs.readFileSync(path.join(dd2.cauHinh, 'cau-hinh.json'), 'utf8')) as { supabaseUrl?: string };
    m.project['a.thu'].khoa = 'khoa-moi-2';
    m.web.treMs = 300;
    const u5 = new UngDung(dd2, tuy);
    const dn5 = await u5.dangNhap('ql@beeftown.vn', 'dung').catch((e: Error) => e);
    const sau = await u5.nguoiDung().catch((e: Error) => e);
    m.web.treMs = 0;
    ok('HỒI QUY: đăng nhập ngay lúc mở, project cũ trả lời trước lần kiểm ngầm kho-can.json → chờ lần kiểm, đăng nhập lại vào project '
      + 'mới; sau đó vẫn đăng nhập (không "không phải nhân viên kho", không phiên ở project cũ)',
      !(dn5 instanceof Error) && !(sau instanceof Error) && sau?.vaiTro === 'quan_ly' && chDua().supabaseUrl === 'http://b.thu',
      JSON.stringify([dn5 instanceof Error ? dn5.message : dn5?.vaiTro, sau instanceof Error ? sau.message : sau, chDua()]));
    u5.dongNen();
  }

  // Web không trả lời / trả 404: giữ cấu hình cũ, không làm hỏng việc gì.
  for (const cheDo of ['hong', '404'] as const) {
    m.web.cheDo = cheDo;
    const w1 = soWeb();
    const u3 = new UngDung(dd, tuy);
    const nd3 = await u3.nguoiDung().catch((e: Error) => e);
    await choToi(() => soWeb() > w1, 1000);
    await nghi(50);
    ok(`Web ${cheDo === 'hong' ? 'mất mạng' : 'trả 404'} lúc kiểm ngầm → giữ địa chỉ / khoá đang lưu, chương trình vẫn dùng được kho`,
      !(nd3 instanceof Error) && ch().supabaseUrl === 'http://b.thu' && ch().anonKey === 'khoa-b', nd3 instanceof Error ? nd3.message : JSON.stringify(ch()));
    u3.dongNen();
  }
  m.project['b.thu'].khoa = 'khoa-b-2';
  m.web.cheDo = 'hong';
  const u4 = new UngDung(dd, tuy);
  const loi4 = await loiCua(() => u4.dangNhap('ql@beeftown.vn', 'dung'));
  ok('Kho từ chối khoá mà không đọc lại được kho-can.json → nói rõ khoá truy cập và kho-can.json, không nói "Sai email hoặc mật khẩu"',
    /khoá truy cập/.test(loi4) && /kho-can\.json/.test(loi4) && !/Sai email/.test(loi4), loi4);
  u4.dongNen();
}

// =============================================================================
// 4. da-gui CÓ HẠN, KHÔNG GIỮ MẬT KHẨU WiFi; loi.txt CÓ HẠN
// =============================================================================
async function thuDaGuiVaLoi(ok: Ok, h: TroGiup, ddMoi: () => { cauHinh: string; duLieu: string }, tam: string) {
  console.log('7d · 2.9.2 — da-gui giữ có hạn, bản lưu không có tên / mật khẩu WiFi; loi.txt có hạn');
  const goc = h.fileCan([h.plu(1, '10001', '845,0', 'Lõi vai bò Mỹ')]);
  // File cân có chữ cài đặt mạng (TMT 15 tên WiFi, 16 mật khẩu, 19 tên miền) như file A_000.TMS thật.
  const coWifi = (du: Uint8Array) => {
    const s = Buffer.from(du).toString('latin1');
    return new Uint8Array(Buffer.from(s.replace('END\tECS\t', 'DWL\tTMT\t\r\nTMT\t0\tBEEFTOWN\t\r\nTMT\t15\tWIFI-QUAN\t\r\nTMT\t16\tmat-khau-wifi\t\r\n'
      + 'TMT\t19\tquan.local\t\r\nEND\tTMT\t\r\n\r\nEND\tECS\t'), 'latin1'));
  };
  const dd = ddMoi();
  const daGui = path.join(dd.duLieu, 'da-gui');
  fs.mkdirSync(daGui, { recursive: true });
  const ngay = 86_400_000, bay = Date.now();
  // 130 bản cũ: 10 bản hơn 30 ngày, 120 bản trong 10 ngày qua; một bản gần đây còn mật khẩu WiFi; một file không phải .TMS.
  for (let i = 0; i < 130; i++) {
    const f = path.join(daGui, `cu-${String(i).padStart(3, '0')}.TMS`);
    fs.writeFileSync(f, i === 125 ? coWifi(goc) : goc);
    const tuoi = i < 10 ? 40 * ngay + i * 1000 : (130 - i) * 7_000_000;
    fs.utimesSync(f, new Date(bay - tuoi), new Date(bay - tuoi));
  }
  fs.writeFileSync(path.join(daGui, 'ghi-chu.txt'), 'của người dùng');
  fs.utimesSync(path.join(daGui, 'ghi-chu.txt'), new Date(bay - 90 * ngay), new Date(bay - 90 * ngay));
  const mtime125 = fs.statSync(path.join(daGui, 'cu-125.TMS')).mtimeMs;

  const u = new UngDung(dd, { mang: [], mac: async () => null });
  u.ghiNhanFileTuCan(coWifi(goc));
  const tms = fs.readdirSync(daGui).filter(t => t.endsWith('.TMS'));
  const moiNhat = tms.filter(t => !t.startsWith('cu-'));
  const cu30 = tms.filter(t => fs.statSync(path.join(daGui, t)).mtimeMs < bay - 30 * ngay);
  ok('HỒI QUY: da-gui giữ tối đa 100 bản, bỏ bản cũ hơn 30 ngày; bản vừa lưu còn; file không phải .TMS không đụng',
    tms.length === 100 && cu30.length === 0 && moiNhat.length === 1 && fs.existsSync(path.join(daGui, 'ghi-chu.txt'))
    && !tms.includes('cu-010.TMS') && tms.includes('cu-129.TMS'), `${tms.length} bản, ${cu30.length} bản cũ, mới: ${moiNhat.join()}`);
  const banMoi = moiNhat[0] ? fs.readFileSync(path.join(daGui, moiNhat[0])).toString('latin1') : '';
  ok('HỒI QUY: bản lưu da-gui không có tên / mật khẩu WiFi, tên miền (TMT 15, 16, 19); còn các chữ khác; file gốc A_000.TMS giữ nguyên đủ',
    banMoi.includes('TMT\t0\tBEEFTOWN\t') && !/WIFI-QUAN|mat-khau-wifi|quan\.local/.test(banMoi)
    && fs.readFileSync(u.fileGoc).toString('latin1').includes('mat-khau-wifi'), banMoi.slice(-200));
  ok('Gửi xuống cân không đọc / ghi lại các bản cũ (việc làm sạch chạy riêng lúc mở chương trình, không chặn đường gửi)',
    fs.readFileSync(path.join(daGui, 'cu-125.TMS')).toString('latin1').includes('mat-khau-wifi'));
  const lamSach = async (x: UngDung) => {
    const f = (x as unknown as { lamSachDaGuiLucMo?: () => Promise<void> }).lamSachDaGuiLucMo;
    if (typeof f !== 'function') throw new Error('chưa có lamSachDaGuiLucMo');
    await f.call(x);
  };
  const loiLam = await loiCua(() => lamSach(u));
  const cu125 = fs.readFileSync(path.join(daGui, 'cu-125.TMS')).toString('latin1');
  ok('HỒI QUY: lúc mở chương trình, bản lưu cũ còn mật khẩu WiFi (từ bản trước 2.9.2) được xoá dòng mạng, giữ ngày sửa',
    loiLam === '' && !/WIFI-QUAN|mat-khau-wifi/.test(cu125) && cu125.includes('TMT\t0\tBEEFTOWN\t')
    && Math.abs(fs.statSync(path.join(daGui, 'cu-125.TMS')).mtimeMs - mtime125) < 2000, loiLam);
  u.dongNen();
  {
    // Máy chưa gửi gì từ khi lên 2.9.2: dọn cũng phải chạy lúc mở. Một file hỏng (liên kết gãy — OneDrive đang giữ, vừa bị xoá)
    // không làm dừng cả lượt.
    const dd2 = ddMoi();
    const dg2 = path.join(dd2.duLieu, 'da-gui');
    fs.mkdirSync(dg2, { recursive: true });
    for (const [ten, tuoi] of [['cu-1.TMS', 40], ['cu-2.TMS', 2]] as const) {
      fs.writeFileSync(path.join(dg2, ten), coWifi(goc));
      fs.utimesSync(path.join(dg2, ten), new Date(bay - tuoi * ngay), new Date(bay - tuoi * ngay));
    }
    fs.symlinkSync(path.join(dg2, 'khong-co.TMS'), path.join(dg2, 'gay.TMS'));
    const u2 = new UngDung(dd2, { mang: [], mac: async () => null });
    const loi2 = await loiCua(() => lamSach(u2));
    const con = fs.readdirSync(dg2).sort();
    ok('HỒI QUY: máy chưa gửi gì → lúc mở vẫn bỏ bản cũ hơn 30 ngày, xoá dòng mạng bản còn giữ; một file hỏng không dừng cả lượt',
      loi2 === '' && !con.includes('cu-1.TMS') && con.includes('cu-2.TMS')
      && !fs.readFileSync(path.join(dg2, 'cu-2.TMS')).toString('latin1').includes('mat-khau-wifi'), `${loi2} · ${con.join()}`);
    u2.dongNen();
  }

  // loi.txt: đầy thì đổi thành loi-cu.txt, ghi tiếp file mới; một dòng quá dài bị cắt.
  const thuMuc = path.join(tam, 'loi');
  const ghi = (nv as unknown as Record<string, unknown>).ghiLoiTxt as ((thuMuc: string, cau: string, toiDa?: number) => void) | undefined;
  if (typeof ghi !== 'function') {
    ok('HỒI QUY: có ghiLoiTxt (loi.txt có hạn) cho main.ts dùng', false, 'nghiep-vu.ts chưa xuất ghiLoiTxt');
  } else {
    for (let i = 0; i < 40; i++) ghi(thuMuc, `lỗi thử số ${i} ` + 'x'.repeat(40), 1000);
    ghi(thuMuc, 'y'.repeat(50_000), 1000);
    const loi = fs.readFileSync(path.join(thuMuc, 'loi.txt'), 'utf8'), cu = fs.readFileSync(path.join(thuMuc, 'loi-cu.txt'), 'utf8');
    ok('HỒI QUY: loi.txt có hạn — đầy thì thành loi-cu.txt, ghi tiếp file mới; dòng quá dài bị cắt; dòng mới nhất còn',
      Buffer.byteLength(loi) <= 1000 + 9000 && Buffer.byteLength(cu) <= 1000 + 9000 && loi.includes('yyyy') && Buffer.byteLength(loi) < 50_000
      && fs.readdirSync(thuMuc).sort().join() === 'loi-cu.txt,loi.txt', `${Buffer.byteLength(loi)} / ${Buffer.byteLength(cu)} byte`);
  }
  const mn = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  ok('main.ts: dọn da-gui một lần sau khi mở (không chờ, không chặn việc khác)', /void ud\.lamSachDaGuiLucMo\(\)/.test(mn));
  ok('main.ts ghi loi.txt qua ghiLoiTxt của nghiep-vu.ts (có hạn), không appendFileSync thẳng', !/appendFileSync/.test(mn)
    && /ghiLoiTxt as ghiLoiCoHan \} from '\.\/nghiep-vu\.ts'/.test(mn) && /ghiLoiCoHan\(ud\.dd\.cauHinh, cau\)/.test(mn));
}

// =============================================================================
// 5. KIỂM KIỂU
// =============================================================================
function thuKiemKieu(ok: Ok) {
  console.log('7e · 2.9.2 — kiểm kiểu TypeScript (tsc) trong CI');
  let ts: { compilerOptions?: { strict?: boolean; noEmit?: boolean; types?: string[] } } = {};
  try { ts = JSON.parse(fs.readFileSync(path.join(SRC, '..', 'tsconfig.json'), 'utf8')); } catch { /* chưa có */ }
  const ci = fs.readFileSync(path.join(GOC_REPO, '.github', 'workflows', 'kiem-thu.yml'), 'utf8');
  const pk = JSON.parse(fs.readFileSync(path.join(SRC, '..', 'package.json'), 'utf8')) as { scripts?: Record<string, string>; devDependencies?: Record<string, string> };
  ok('can-app/tsconfig.json strict, có @types/bun; CI chạy tsc --noEmit (npm run kiem-kieu) sau kiểm thử Beeftown Cân, cả khi kiểm thử hỏng',
    ts.compilerOptions?.strict === true && ts.compilerOptions.types?.includes('bun') === true && !!pk.devDependencies?.['@types/bun']
    && !!pk.devDependencies?.typescript && /tsc --noEmit/.test(pk.scripts?.['kiem-kieu'] ?? '')
    && /run: npx bun test\/thu\.ts\n[^\n]*\n\s+- name: Kiểm kiểu Beeftown Cân[^\n]*\n\s+if: \$\{\{ !cancelled\(\) \}\}\n\s+working-directory: can-app\n\s+run: npm run kiem-kieu/.test(ci),
    JSON.stringify(ts));
}

// Chạy riêng: in tổng và mã thoát. Cần file cân giả của test/thu.ts — dựng gọn ở đây.
if (import.meta.main) {
  const KHUON = 'PLU\t{1}\t{2}\t\t1\t{5}\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\t{15}\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\tx\t0\t0\t0\t';
  const plu = (so: number, ma: string, gia: string, ten: string) => KHUON.replace('{1}', String(so)).replace('{2}', ma).replace('{5}', gia).replace('{15}', ten);
  const fileCan = (dong: string[]) => new TextEncoder().encode(['ECS\tVER\tV3.14E8\t', '', 'DWL\tPLU\t', ...dong, 'END\tPLU\t', '',
    'DWL\tTMS\t', 'TMS\t0\t28\t', 'TMS\t202\t3\t', 'END\tTMS\t', '', 'END\tECS\t', ''].join('\r\n'));
  let dat = 0, hong = 0;
  const ok: Ok = (ten, dieuKien, chiTiet = '') => {
    if (dieuKien) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten} ${chiTiet}`); }
  };
  try {
    await thuNoKyThuat(ok, { fileCan, plu });
  } catch (e) {
    hong++;
    console.log(`  ✗ Kiểm thử dừng giữa chừng: ${(e as Error)?.stack ?? e}`);
  }
  console.log(hong === 0 ? `\nTẤT CẢ ${dat} KIỂM TRA NỢ KỸ THUẬT 2.9.2 ĐỀU ĐẠT` : `\n${hong} KIỂM TRA HỎNG / ${dat + hong}`);
  process.exit(hong === 0 ? 0 : 1);
}

