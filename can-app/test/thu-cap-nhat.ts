/**
 * Kiểm thử tự cập nhật (2.5) — src/cap-nhat.ts, UngDung.kiemBanMoi / capNhat, /api/ban-moi, /api/cap-nhat.
 *
 *     cd can-app && npx bun test/thu-cap-nhat.ts
 *
 * GitHub giả trên 127.0.0.1 (chuyển hướng 302 như GitHub thật: latest → can-v<phiên bản> → máy chứa file); file cài
 * giả là một file PE32+ giao diện x64 nhỏ; mọi file ở thư mục tạm. KHÔNG BAO GIỜ gọi github.com.
 * Đổi tên file đang chạy, mở tiến trình tách rời, Defender: chỉ thử được trên Windows thật (README, "Bản 2.5").
 * test/thu.ts gọi thuCapNhat(ok) với hàm ok chung.
 */
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import {
  LENH_CHAY_THU, LENH_KHOI_DONG, LoiCapNhat, cacTepCapNhat, cauQuayVeBangTay, chayThuBanMoi, chayThuQuaPowerShell, docPhieuPhienBan,
  docThamSoPhienBan, donSauCapNhat, duongTepBanMoi,
  khoaCapNhatConHan, khoiDongLaiSauCapNhat, khoiDongQuaPowerShell, kiemFileChayWindows, laBanDongGoi, moTaMb, ngayPhatHanhVn,
  soSanhPhienBan,
  FS_THAT, type ChayThu, type FsHam, type KhoiDong,
} from '../src/cap-nhat.ts';
import { UngDung, cauLoi, quyenCuaVai } from '../src/nghiep-vu.ts';
import { moMayChu } from '../src/may-chu.ts';

type Ok = (ten: string, dk: boolean, ct?: string) => void;

// ---- File cài giả --------------------------------------------------------------------------
/** File PE32+ giao diện x64 (như BeeftownCan.exe thật) cỡ `co` byte; `hat` đổi nội dung. */
function taoPe(co: number, hat = 7, may = 0x8664, giaoDien = 2): Buffer {
  const b = Buffer.alloc(co);
  for (let i = 0; i < co; i++) b[i] = (i * hat + 13) & 0xff;
  b.write('MZ', 0, 'latin1');
  b.writeUInt32LE(0x80, 0x3C);
  b.writeUInt32LE(0x00004550, 0x80);
  b.writeUInt16LE(may, 0x84);
  b.writeUInt16LE(240, 0x94);
  b.writeUInt16LE(0x20B, 0x98);
  b.writeUInt16LE(giaoDien, 0x98 + 68);
  return b;
}
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
const BAN_CU = Buffer.from('BAN CU 2.5.0 — file dang chay');

/** Câu lỗi (LoiCapNhat / LoiCan…) hoặc '' nếu không lỗi. */
async function loiCua(f: () => unknown): Promise<string> {
  try { await f(); return ''; } catch (e) { return cauLoi(e); }
}

// ---- GitHub giả ------------------------------------------------------------------------------
interface GithubGia {
  goc: string;
  phienBan: string;
  exe: Buffer;
  /** Ghi đè / thêm trường vào phiếu (url lạ, kichThuoc sai, dang…). */
  phieuThem: Record<string, unknown>;
  cheDo: string;
  dem: Map<string, number>;
  tongLuot: () => number;
  dong: () => Promise<void>;
}

async function moGithubGia(): Promise<GithubGia> {
  const gh = { phienBan: '2.6.0', exe: taoPe(300 * 1024), phieuThem: {} as Record<string, unknown>, cheDo: 'ok', dem: new Map<string, number>() };
  const giu: http.ServerResponse[] = [];
  const may = http.createServer((req, res) => {
    const p = (req.url ?? '').split('?')[0];
    gh.dem.set(p, (gh.dem.get(p) ?? 0) + 1);
    const phieu = `/releases/download/can-v${gh.phienBan}/phien-ban.json`;
    const exe = `/releases/download/can-v${gh.phienBan}/BeeftownCan.exe`;
    if (p === '/releases/latest/download/phien-ban.json') {
      if (gh.cheDo === 'phieu-500') { res.writeHead(500); res.end('loi'); return; }
      if (gh.cheDo === 'phieu-404') { res.writeHead(404); res.end('Not Found'); return; }
      if (gh.cheDo === 'phieu-cham') { giu.push(res); return; }
      if (gh.cheDo === 'phieu-lon') { res.writeHead(200); res.end('x'.repeat(20_000)); return; }
      res.writeHead(302, { Location: phieu }); res.end(); return;
    }
    if (p === phieu) {
      const v = { dang: 1, phienBan: gh.phienBan, tep: 'BeeftownCan.exe', sha256: sha(gh.exe), kichThuoc: gh.exe.length,
        ngay: '2026-09-29T17:10:00Z', ...gh.phieuThem };
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(v)); return;
    }
    if (p === exe) { res.writeHead(302, { Location: `/tai/${gh.phienBan}` }); res.end(); return; }
    if (p.startsWith('/tai/')) {
      const b = gh.exe;
      if (gh.cheDo === 'exe-500') { res.writeHead(500); res.end('loi'); return; }
      if (gh.cheDo === 'exe-dut') { res.writeHead(200, { 'Content-Length': String(b.length) }); res.write(b.subarray(0, b.length >> 1)); setTimeout(() => res.socket?.destroy(), 30); return; }
      if (gh.cheDo === 'exe-dung') { res.writeHead(200, { 'Content-Length': String(b.length) }); res.write(b.subarray(0, 1024)); giu.push(res); return; }
      if (gh.cheDo === 'exe-thua') { res.writeHead(200); res.write(b); res.end(Buffer.from('THUA THEM')); return; }
      if (gh.cheDo === 'exe-sai-sha') { const c = Buffer.from(b); c[c.length - 5] ^= 0xff; res.writeHead(200, { 'Content-Length': String(c.length) }); res.end(c); return; }
      res.writeHead(200, { 'Content-Length': String(b.length) }); res.end(b); return;
    }
    res.writeHead(404); res.end('Not Found');
  });
  await new Promise<void>(x => may.listen(0, '127.0.0.1', () => x()));
  const cong = (may.address() as net.AddressInfo).port;
  return Object.assign(gh, {
    goc: `http://127.0.0.1:${cong}/releases`,
    tongLuot: () => [...gh.dem.values()].reduce((a, b) => a + b, 0),
    dong: async () => { for (const r of giu) r.socket?.destroy(); may.closeAllConnections?.(); await new Promise<void>(x => may.close(() => x())); },
  });
}

// ---- Chương trình giả: thư mục tạm có BeeftownCan.exe (bản cũ) ------------------------------
const TAM = fs.mkdtempSync(path.join(os.tmpdir(), 'beeftown-cap-nhat-'));
let soThuMuc = 0;
function moUd(gh: GithubGia, tuy: { laBanDongGoi?: boolean; fsHam?: FsHam; tenTep?: string; noiDung?: Buffer; nguoi?: string;
  chayPs?: (lenh: string, bien: Record<string, string>, choMs: number) => Promise<string>;
  chayThu?: ChayThu; ghiNhatKy?: (cau: string) => void } = {}) {
  const dir = path.join(TAM, `may-${++soThuMuc}`, 'Beeftown Cân chủ quán');
  fs.mkdirSync(dir, { recursive: true });
  const tepChay = path.join(dir, tuy.tenTep ?? 'BeeftownCan.exe');
  fs.writeFileSync(tepChay, tuy.noiDung ?? BAN_CU);
  const cn = { id: 'cn1', ma: 'q1', ten: 'Chi nhánh thử' };
  const u = new UngDung({ cauHinh: path.join(dir, '..', 'appdata'), duLieu: path.join(dir, '..', 'tai-lieu') }, {
    mang: [], mac: async () => null,
    ...(tuy.chayPs ? { chayPs: tuy.chayPs } : {}),
    // Luôn có người đăng nhập giả: không bao giờ hỏi kho thật (beeftown.vn) trong kiểm thử.
    nguoi: { email: 'nv@b', hoTen: 'NV', vaiTro: tuy.nguoi ?? 'quan_ly', chiNhanh: cn, cacChiNhanh: [cn], quyen: quyenCuaVai(tuy.nguoi ?? 'quan_ly') },
    capNhat: {
      phienBan: '2.5.0', tepChay, laBanDongGoi: tuy.laBanDongGoi ?? true, goc: gh.goc,
      choMs: { hoi: 1500, tong: 8000, lang: 700 }, gioiHan: { nhoNhat: 1024, lonNhat: 4 * 1024 * 1024 },
      ...(tuy.fsHam ? { fsHam: tuy.fsHam } : {}),
      ...(tuy.chayThu ? { chayThu: tuy.chayThu, choChayThuMs: 2000 } : {}),
      ...(tuy.ghiNhatKy ? { ghiNhatKy: tuy.ghiNhatKy } : {}),
    },
  });
  return { u, t: cacTepCapNhat(tepChay), dir };
}
const docTep = (p: string) => (fs.existsSync(p) ? fs.readFileSync(p) : null);
const giong = (a: Buffer | null, b: Buffer) => !!a && Buffer.compare(a, b) === 0;
/** Thư mục chỉ còn file đang chạy (không .cu.exe, .dang-tai, .thu-ghi). */
const chiConTepChay = (dir: string) => fs.readdirSync(dir).join() === 'BeeftownCan.exe';

// ---- Kiểm thử ------------------------------------------------------------------------------------
export async function thuCapNhat(ok: Ok): Promise<void> {
  console.log('\n— Tự cập nhật (cap-nhat.ts, 2.5)');
  const gh = await moGithubGia();
  try {
    // Hàm thuần
    ok('soSanhPhienBan: 2.10.0 > 2.9.0, bằng nhau = 0, cũ hơn < 0, sai dạng → lỗi',
      soSanhPhienBan('2.10.0', '2.9.0') > 0 && soSanhPhienBan('2.5.0', '2.5.0') === 0 && soSanhPhienBan('2.4.9', '2.5.0') < 0
      && /không đúng dạng/.test(await loiCua(() => soSanhPhienBan('2.6', '2.5.0'))));
    const phieuDung = { dang: 1, phienBan: '2.6.0', tep: 'BeeftownCan.exe', sha256: 'a'.repeat(64), kichThuoc: 20 * 1024 * 1024, ngay: '2026-09-29T17:10:00Z' };
    const p0 = docPhieuPhienBan(JSON.stringify({ ...phieuDung, url: 'https://ke-xau.example/x.exe' }));
    ok('docPhieuPhienBan: phiếu đúng đọc được; trường url lạ bị bỏ', p0.phienBan === '2.6.0' && p0.kichThuoc === 20 * 1024 * 1024
      && !('url' in p0) && p0.ngay === '2026-09-29T17:10:00Z');
    const phieuSai: [string, unknown][] = [
      ['sha viết hoa', { ...phieuDung, sha256: 'A'.repeat(64) }], ['thiếu sha', { ...phieuDung, sha256: undefined }],
      ['cỡ 0', { ...phieuDung, kichThuoc: 0 }], ['cỡ 200 MB', { ...phieuDung, kichThuoc: 200 * 1024 * 1024 }],
      ['cỡ lẻ', { ...phieuDung, kichThuoc: 1.5 }], ['cỡ là chữ', { ...phieuDung, kichThuoc: '90' }],
      ['phiên bản 2.6', { ...phieuDung, phienBan: '2.6' }], ['phiên bản beta', { ...phieuDung, phienBan: '2.6.0-beta' }],
      ['phiên bản có ../', { ...phieuDung, phienBan: '2.6.0/../x' }], ['tên file lạ', { ...phieuDung, tep: 'Khac.exe' }],
      ['mảng', [phieuDung]], ['không có dang', { ...phieuDung, dang: undefined }],
    ];
    const kqSai = phieuSai.map(([ten, v]) => { try { docPhieuPhienBan(JSON.stringify(v)); return ten; } catch (e) { return e instanceof LoiCapNhat ? '' : ten; } });
    ok('docPhieuPhienBan: từ chối sha sai, cỡ sai, phiên bản sai, tên file lạ, mảng, thiếu dạng', kqSai.every(x => x === ''), kqSai.filter(Boolean).join());
    ok('docPhieuPhienBan: phiếu dạng mới (dang 2) → báo cài bằng tay; chữ không phải JSON → báo không đọc được',
      /cài bằng tay/.test(await loiCua(() => docPhieuPhienBan(JSON.stringify({ ...phieuDung, dang: 2 }))))
      && /không đọc được/.test(await loiCua(() => docPhieuPhienBan('<html>'))));
    ok('duongTepBanMoi: dựng từ khuôn cố định, phiên bản sai dạng → lỗi',
      duongTepBanMoi('2.6.0', 'https://github.com/a/b/releases') === 'https://github.com/a/b/releases/download/can-v2.6.0/BeeftownCan.exe'
      && /không đúng dạng/.test(await loiCua(() => duongTepBanMoi('2.6.0/../../x', 'g'))));
    ok('laBanDongGoi: chỉ file .exe trên Windows, không phải bun.exe',
      laBanDongGoi('C:\\Beeftown\\BeeftownCan.exe', 'win32') && !laBanDongGoi('C:\\bun\\bun.exe', 'win32')
      && !laBanDongGoi('/usr/bin/bun', 'linux') && !laBanDongGoi('/tmp/BeeftownCan.exe', 'linux') && !laBanDongGoi('C:\\x\\BeeftownCan', 'win32'));
    ok('kiemFileChayWindows: nhận PE32+ giao diện x64; từ chối 32-bit, cửa sổ lệnh, chữ thường, file ngắn',
      kiemFileChayWindows(taoPe(4096)) && !kiemFileChayWindows(taoPe(4096, 7, 0x14c)) && !kiemFileChayWindows(taoPe(4096, 7, 0x8664, 3))
      && !kiemFileChayWindows(Buffer.from('xin chao '.repeat(500))) && !kiemFileChayWindows(Buffer.from('MZ')));
    ok('Chữ hiện: 89.456.123 byte = "85,3 MB"; ngày phát hành theo giờ VN (23:50 → 29/09, 00:10 → 30/09)',
      moTaMb(89_456_123) === '85,3 MB' && ngayPhatHanhVn('2026-09-29T16:50:00Z') === '29/09/2026'
      && ngayPhatHanhVn('2026-09-29T17:10:00Z') === '30/09/2026', `${moTaMb(89_456_123)} ${ngayPhatHanhVn('2026-09-29T17:10:00Z')}`);
    ok('docThamSoPhienBan: đọc --vua-cap-nhat=2.5.0, bỏ giá trị sai dạng',
      docThamSoPhienBan(['bun', 'x', '--vua-cap-nhat=2.5.0'], '--vua-cap-nhat=') === '2.5.0'
      && docThamSoPhienBan(['--vua-cap-nhat=2.5; rm'], '--vua-cap-nhat=') === null && docThamSoPhienBan([], '--cap-nhat-hong=') === null);
    const t0 = cacTepCapNhat(path.join('C:', 'Beeftown', 'BeeftownCan.exe'));
    ok('cacTepCapNhat: .cu.exe, .loi.exe, .dang-tai (không đuôi .exe) cùng thư mục', path.basename(t0.tepCu) === 'BeeftownCan.cu.exe'
      && path.basename(t0.tepLoi) === 'BeeftownCan.loi.exe' && path.basename(t0.tepDangTai) === 'BeeftownCan.dang-tai'
      && path.dirname(t0.tepDangTai) === path.dirname(t0.tepChay));

    // Hỏi bản mới
    {
      const { u } = moUd(gh);
      const k = await u.kiemBanMoi();
      ok('Hỏi bản mới: có bản 2.6.0 (0,3 MB, phát hành 30/09/2026 giờ VN)', k.coTheCapNhat && k.phienBanMoi === '2.6.0'
        && k.cau === 'Có bản mới 2.6.0 (0,3 MB, phát hành 30/09/2026).', JSON.stringify(k));
      const luot = gh.tongLuot();
      await u.kiemBanMoi();
      const luotNho = gh.tongLuot();
      await u.kiemBanMoi(true);
      const [a, b] = await Promise.all([u.kiemBanMoi(true), u.kiemBanMoi(true)]);
      ok('Nhớ kết quả 30 phút (hỏi lại không vào mạng); "Kiểm tra bản mới" hỏi lại; hai lần hỏi cùng lúc dùng chung một lần',
        luotNho === luot && gh.tongLuot() === luot + 4 && a === b, `${luot} ${luotNho} ${gh.tongLuot()}`);
    }
    for (const [v, ten] of [['2.5.0', 'bằng'], ['2.4.9', 'cũ hơn']] as const) {
      gh.phienBan = v;
      const { u, dir } = moUd(gh);
      const k = await u.kiemBanMoi();
      const loi = await loiCua(() => u.capNhat());
      ok(`Bản trên kho ${ten} bản đang chạy (${v}) → "Đang dùng bản mới nhất", không bao giờ hạ phiên bản, không tải file`,
        k.phienBanMoi === null && k.cau === 'Đang dùng bản mới nhất (2.5.0).' && /Đang dùng bản mới nhất \(2\.5\.0\)/.test(loi)
        && !gh.dem.has(`/tai/${v}`) && chiConTepChay(dir), JSON.stringify([k, loi]));
    }
    gh.phienBan = '2.6.0';
    {
      const truoc = gh.tongLuot();
      const { u } = moUd(gh, { laBanDongGoi: false });
      const k = await u.kiemBanMoi(true);
      ok('Không phải bản .exe (chạy bằng bun) → không cập nhật được, KHÔNG hỏi mạng', !k.coTheCapNhat && gh.tongLuot() === truoc
        && /Chỉ cập nhật được bản BeeftownCan\.exe/.test(await loiCua(() => u.capNhat())) && gh.tongLuot() === truoc, k.cau);
    }

    {
      // Bản 2.6.0 đã không mở được (lần mở với --cap-nhat-hong=2.6.0): không tự mời lại; nhớ qua các lần mở; cập nhật được
      // lên bản khác (--vua-cap-nhat) thì quên.
      const dd = { cauHinh: path.join(TAM, 'hong-truoc', 'appdata'), duLieu: path.join(TAM, 'hong-truoc', 'du-lieu') };
      const cn0 = { phienBan: '2.5.0', tepChay: path.join(TAM, 'hong-truoc', 'BeeftownCan.exe'), laBanDongGoi: true, goc: gh.goc,
        choMs: { hoi: 1500, tong: 8000, lang: 700 }, gioiHan: { nhoNhat: 1024, lonNhat: 4 * 1024 * 1024 } };
      const moi = (them: object) => new UngDung(dd, { mang: [], mac: async () => null, capNhat: { ...cn0, ...them } });
      const k1 = await moi({ capNhatHong: '2.6.0' }).kiemBanMoi();
      const k2 = await moi({}).kiemBanMoi();
      const k3 = await moi({ vuaCapNhatTu: '2.4.0' }).kiemBanMoi();
      ok('Bản mới đã không mở được trên máy này → không tự mời (daHongTruoc), câu nói rõ; nhớ qua lần mở sau; lên được bản khác thì quên',
        k1.phienBanMoi === '2.6.0' && k1.daHongTruoc && /đã không mở được trên máy này/.test(k1.cau) && k2.daHongTruoc && !k3.daHongTruoc,
        JSON.stringify([k1.cau, k2.daHongTruoc, k3.daHongTruoc]));
    }

    // mat-mang: hỏng ở bước nào cũng không đổi gì
    const CHE_DO: [string, RegExp, Record<string, unknown>?][] = [
      ['phieu-500', /mã 500/], ['phieu-404', /chưa có bản nào/], ['phieu-cham', /Không hỏi được bản mới/], ['phieu-lon', /quá lớn/],
      ['exe-500', /mã 500/], ['exe-dut', /ngắt giữa chừng|thiếu/], ['exe-dung', /ngắt giữa chừng/], ['exe-thua', /lớn hơn cỡ/],
      ['exe-sai-sha', /SHA-256/], ['phieu-sai-co', /không đúng cỡ/, { kichThuoc: 300 * 1024 + 100 }],
    ];
    for (const [cheDo, cau, them] of CHE_DO) {
      gh.cheDo = cheDo.startsWith('phieu-sai') ? 'ok' : cheDo;
      gh.phieuThem = them ?? {};
      const { u, t, dir } = moUd(gh);
      const loi = await loiCua(() => u.capNhat());
      ok(`Mất mạng / hỏng (${cheDo}): báo rõ, file đang chạy y nguyên, không .cu.exe, không file tải dở, không nói "đã tải"`,
        cau.test(loi) && (!/^exe|sai-co/.test(cheDo) || /Chưa đổi gì/.test(loi)) && !/Đã tải/.test(loi)
        && giong(docTep(t.tepChay), BAN_CU) && chiConTepChay(dir) && !u.trangThaiCapNhat().dangCapNhat, loi);
    }
    gh.cheDo = 'exe-khong-pe'; gh.phieuThem = {};
    {
      const exeThat = gh.exe;
      gh.exe = Buffer.from('day khong phai chuong trinh '.repeat(2000));
      const { u, t, dir } = moUd(gh);
      const loi = await loiCua(() => u.capNhat());
      gh.exe = exeThat;
      ok('File đúng cỡ, đúng SHA-256 nhưng không phải chương trình Windows 64-bit → không thay', /không phải chương trình Windows/.test(loi)
        && giong(docTep(t.tepChay), BAN_CU) && chiConTepChay(dir), loi);
    }
    {
      const cong = await new Promise<number>((x) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = (s.address() as net.AddressInfo).port; s.close(() => x(p)); }); });
      const { u, t } = moUd({ ...gh, goc: `http://127.0.0.1:${cong}/releases` });
      const loi = await loiCua(() => u.capNhat());
      ok('Kho cập nhật không nối được (cổng đóng) → "máy có vào mạng internet không?", không đổi gì',
        /internet/.test(loi) && giong(docTep(t.tepChay), BAN_CU), loi);
    }
    gh.cheDo = 'ok'; gh.phieuThem = { url: `${gh.goc.replace('/releases', '')}/ke-xau.exe` };

    // Cập nhật được: NV quầy cũng bấm được (chỉ cài bản chính thức, không đụng dữ liệu)
    {
      const { u, t, dir } = moUd(gh, { nguoi: 'nhan_vien_quay' });
      const kq = await u.capNhat();
      ok('Cập nhật (NV quầy bấm): bản mới vào chỗ, bản cũ thành BeeftownCan.cu.exe, không file tải dở; câu "Đã tải và kiểm tra… Đang khởi động lại"',
        kq.phienBan === '2.6.0' && kq.phienBanCu === '2.5.0' && /^Đã tải và kiểm tra bản 2\.6\.0\. Đang khởi động lại/.test(kq.cau)
        && giong(docTep(t.tepChay), gh.exe) && giong(docTep(t.tepCu), BAN_CU)
        && fs.readdirSync(dir).sort().join() === 'BeeftownCan.cu.exe,BeeftownCan.exe', JSON.stringify([kq, fs.readdirSync(dir)]));
      ok('Đường lạ ghi trong phiếu (url) không bao giờ được gọi', !gh.dem.has('/ke-xau.exe'));
      const tt = u.trangThaiCapNhat();
      const loiLan2 = await loiCua(() => u.capNhat());
      ok('Sau khi đổi file: đang khởi động lại — bấm cập nhật lần nữa bị từ chối',
        tt.dangCapNhat && tt.cauTienDo === 'Đang khởi động lại…' && /đang khởi động lại/i.test(loiLan2), JSON.stringify([tt, loiLan2]));
    }
    // 2.6.1: chạy thử bản mới trước khi đổi file
    {
      const t0 = cacTepCapNhat(path.join('C:', 'Beeftown', 'BeeftownCan.exe'));
      ok('2.6.1 cacTepCapNhat: file chạy thử .chay-thu.exe (đuôi .exe để Windows chạy) và .chay-thu.json cùng thư mục',
        path.basename(t0.tepChayThu) === 'BeeftownCan.chay-thu.exe' && path.basename(t0.fileChayThu) === 'BeeftownCan.chay-thu.json'
        && path.dirname(t0.tepChayThu) === path.dirname(t0.tepChay));
      // Bản mới "chạy" được: ghi đúng phiên bản vào file kết quả (như main.ts với BEEFTOWN_CAN_THU_CHAY).
      const chayDung: ChayThu = async (tep, fileKetQua) => {
        if (!fs.existsSync(tep) || !tep.endsWith('.chay-thu.exe')) throw new Error('không có file chạy thử');
        fs.writeFileSync(fileKetQua, JSON.stringify({ phienBan: '2.6.0' }));
      };
      const nhatKy: string[] = [];
      const { u, t, dir } = moUd(gh, { chayThu: chayDung, ghiNhatKy: c => nhatKy.push(c) });
      const kq = await u.capNhat();
      ok('2.6.1: chạy thử được → đổi file như cũ; câu "Đã tải và chạy thử"; không còn file chạy thử; loi.txt ghi chạy thử mất bao lâu',
        /^Đã tải và chạy thử bản 2\.6\.0\. Đang khởi động lại/.test(kq.cau) && giong(docTep(t.tepChay), gh.exe) && giong(docTep(t.tepCu), BAN_CU)
        && fs.readdirSync(dir).sort().join() === 'BeeftownCan.cu.exe,BeeftownCan.exe' && /chạy thử bản 2\.6\.0 được, mất \d+,\d giây/.test(nhatKy.join('|')),
        JSON.stringify([kq.cau, fs.readdirSync(dir), nhatKy]));
    }
    for (const [ten, chayThu, mau] of [
      ['quá giờ / bị chặn', (async () => { throw new LoiCapNhat('quá 180 giây chưa xong'); }) as ChayThu, /không được \(quá 180 giây chưa xong\)/],
      ['không ghi phiên bản (bị chặn im lặng)', (async () => {}) as ChayThu, /không được \(không ghi được phiên bản\)/],
      ['ghi phiên bản khác', (async (_tep: string, f: string) => { fs.writeFileSync(f, JSON.stringify({ phienBan: '2.5.9' })); }) as ChayThu, /ghi phiên bản 2\.5\.9/],
    ] as const) {
      const { u, t, dir } = moUd(gh, { chayThu });
      const loi = await loiCua(() => u.capNhat());
      const tt = u.trangThaiCapNhat();
      ok(`2.6.1: chạy thử ${ten} → báo ngay, CHƯA ĐỔI GÌ (bản cũ vẫn ở chỗ, không .cu.exe), bản mới để ở .loi.exe, không còn file tạm`,
        mau.test(loi) && /Chưa đổi gì/.test(loi) && /BeeftownCan\.loi\.exe/.test(loi) && giong(docTep(t.tepChay), BAN_CU) && giong(docTep(t.tepLoi), gh.exe)
        && fs.readdirSync(dir).sort().join() === 'BeeftownCan.exe,BeeftownCan.loi.exe' && !tt.dangCapNhat && !/thành công/i.test(loi),
        `${loi} · ${fs.readdirSync(dir).join()}`);
    }
    {
      const dir = path.join(TAM, 'chay-thu-ham');
      fs.mkdirSync(dir, { recursive: true });
      const t = cacTepCapNhat(path.join(dir, 'BeeftownCan.exe'));
      fs.writeFileSync(t.tepDangTai, 'moi'); fs.writeFileSync(t.fileChayThu, '{"phienBan":"2.6.0"}');   // file kết quả cũ còn sót
      const loi = await loiCua(() => chayThuBanMoi({ t, phienBan: '2.6.0', chayThu: async () => {}, choMs: 1000 }));
      ok('2.6.1: file kết quả cũ còn sót không được tính — xoá trước khi chạy thử', /không ghi được phiên bản/.test(loi), loi);
      // File vừa chạy thử bị khoá một lúc (phần mềm diệt virus quét sau khi chạy): thử lại rồi được.
      fs.writeFileSync(t.tepDangTai, 'moi');
      let lanKhoa = 0;
      const khoaHaiLan: FsHam = { ...FS_THAT, ngu: () => {}, doiTen: (tu, den) => { if (tu === t.tepChayThu && lanKhoa++ < 2) throw new Error('EBUSY'); fs.renameSync(tu, den); } };
      const chayGhi: ChayThu = async (_tep, f) => { fs.writeFileSync(f, JSON.stringify({ phienBan: '2.6.0' })); };
      const ms = await chayThuBanMoi({ t, phienBan: '2.6.0', chayThu: chayGhi, choMs: 1000, fsHam: khoaHaiLan });
      ok('2.6.1: chạy thử được mà file còn bị khoá lúc đặt lại → thử lại rồi được (như doiTep)', typeof ms === 'number' && lanKhoa === 3
        && fs.readFileSync(t.tepDangTai, 'utf8') === 'moi' && !fs.existsSync(t.tepChayThu) && !fs.existsSync(t.fileChayThu));
      const khoaMai: FsHam = { ...FS_THAT, ngu: () => {}, doiTen: (tu, den) => { if (tu === t.tepChayThu) throw new Error('EBUSY'); fs.renameSync(tu, den); } };
      const loiKhoa = await loiCua(() => chayThuBanMoi({ t, phienBan: '2.6.0', chayThu: chayGhi, choMs: 1000, fsHam: khoaMai }));
      ok('2.6.1: file bị khoá mãi → lỗi có câu "Chưa đổi gì" (không phải EBUSY trần), không để file tạm', /không đặt lại được file/.test(loiKhoa)
        && /Chưa đổi gì/.test(loiKhoa) && !/^EBUSY/.test(loiKhoa) && !fs.existsSync(t.tepChayThu) && !fs.existsSync(t.tepDangTai), loiKhoa);
      for (const p of [t.tepChayThu, t.fileChayThu, t.tepDangTai, t.tepThuGhi]) fs.writeFileSync(p, 'x');
      donSauCapNhat(t);
      ok('2.6.1 donSauCapNhat: dọn cả file chạy thử (.chay-thu.exe / .json) còn sót khi mất điện giữa chừng',
        ![t.tepChayThu, t.fileChayThu, t.tepDangTai, t.tepThuGhi].some(p => fs.existsSync(p)) && fs.existsSync(t.tepLoi));
      let bien: Record<string, string> = {}, lenh = '';
      const ps = (ra: string | Error) => async (l: string, b: Record<string, string>) => { lenh = l; bien = b; if (ra instanceof Error) throw ra; return ra; };
      await chayThuQuaPowerShell(ps('OK\t0\r\n'))('C:\\B\\BeeftownCan.chay-thu.exe', 'C:\\B\\BeeftownCan.chay-thu.json', 180_000);
      const loiHet = await loiCua(() => chayThuQuaPowerShell(ps('LOI\thet-gio\tquá 180 giây chưa xong\r\n'))('a.exe', 'a.chay-thu.json', 180_000));
      const loiDay = await loiCua(() => chayThuQuaPowerShell(ps(new Error('Quá lâu không xong. Rút dây ra cắm lại rồi thử lại.')))('a.exe', 'a.chay-thu.json', 1000));
      ok('2.6.1 chayThuQuaPowerShell: PowerShell quá giờ → "quá 31 giây chưa xong", không chép câu của dây RS232 ("rút dây")',
        /quá 31 giây chưa xong/.test(loiDay) && !/dây/.test(loiDay), loiDay);
      const loiPs = await loiCua(() => chayThuQuaPowerShell(ps(new Error('bị chặn')))('a.exe', 'a.chay-thu.json', 1000));
      ok('2.6.1 chayThuQuaPowerShell: đường dẫn và file kết quả qua biến môi trường (BEEFTOWN_CAN_THU_CHAY), chờ tiến trình thoát; quá giờ / PowerShell hỏng → lỗi có câu',
        bien.BEEFTOWN_CAN_THU_CHAY === 'a.chay-thu.json' && bien.BT_CHO_MS === '1000' && /UseShellExecute = \$false/.test(LENH_CHAY_THU)
        && /WaitForExit\(\[int\]\$env:BT_CHO_MS\)/.test(LENH_CHAY_THU) && !lenh.includes('a.exe')
        && /quá 180 giây chưa xong/.test(loiHet) && /PowerShell không chạy được: bị chặn/.test(loiPs), JSON.stringify([bien, loiHet, loiPs]));
    }
    {
      // Lần cập nhật thứ hai: .cu.exe cũ (2.4) bị thay bằng bản vừa chạy (2.6) — chỉ giữ một bản dự phòng.
      const b26 = taoPe(300 * 1024, 11);
      gh.phienBan = '2.7.0';
      const { u, t, dir } = moUd(gh, { noiDung: b26 });
      fs.writeFileSync(t.tepCu, 'BAN 2.4');
      await u.capNhat();
      ok('Cập nhật lần hai: .cu.exe giữ đúng một bản — bản vừa chạy', giong(docTep(t.tepCu), b26) && giong(docTep(t.tepChay), gh.exe)
        && fs.readdirSync(dir).length === 2);
      gh.phienBan = '2.6.0';
    }

    // Đổi file hỏng
    {
      const gi: FsHam = { ...FS_THAT, ghiThu: () => { const e = new Error('EACCES') as NodeJS.ErrnoException; e.code = 'EACCES'; throw e; } };
      const truoc = gh.tongLuot();
      const { u, t } = moUd(gh, { fsHam: gi });
      const loi = await loiCua(() => u.capNhat());
      ok('Thư mục chương trình không ghi được (Program Files, USB chỉ đọc) → báo cách làm, KHÔNG tải gì',
        /Không ghi được vào thư mục/.test(loi) && /Desktop/.test(loi) && gh.tongLuot() === truoc && giong(docTep(t.tepChay), BAN_CU), loi);
    }
    {
      let ngu = 0;
      const khoa: FsHam = { ...FS_THAT, ngu: () => { ngu++; },
        doiTen: (tu, den) => { if (tu.endsWith('.dang-tai')) { const e = new Error('EBUSY') as NodeJS.ErrnoException; e.code = 'EBUSY'; throw e; } fs.renameSync(tu, den); } };
      const { u, t, dir } = moUd(gh, { fsHam: khoa });
      const loi = await loiCua(() => u.capNhat());
      ok('Bản mới không đặt vào chỗ được (bị khoá mãi) → thử 6 lần rồi đổi ngược lại: file đang chạy y nguyên, không .cu.exe',
        /bị khoá/.test(loi) && /Chưa đổi gì/.test(loi) && ngu === 5 && giong(docTep(t.tepChay), BAN_CU) && chiConTepChay(dir), loi);
    }
    {
      let lan = 0, ngu = 0;
      const khoa2: FsHam = { ...FS_THAT, ngu: () => { ngu++; },
        doiTen: (tu, den) => { if (tu.endsWith('.dang-tai') && lan++ < 2) { const e = new Error('EBUSY') as NodeJS.ErrnoException; e.code = 'EBUSY'; throw e; } fs.renameSync(tu, den); } };
      const { u, t } = moUd(gh, { fsHam: khoa2 });
      await u.capNhat();
      ok('Phần mềm diệt virus khoá file 2 lần rồi thả → vẫn cập nhật được', ngu === 2 && giong(docTep(t.tepChay), gh.exe) && giong(docTep(t.tepCu), BAN_CU));
    }
    {
      const { u } = moUd(gh, { tenTep: 'BeeftownCan.cu.exe' });
      ok('Đang chạy bản dự phòng (.cu.exe) → từ chối, bảo đổi tên lại', /bản dự phòng/.test(await loiCua(() => u.capNhat())));
    }

    // bam-hai-lan
    {
      const truoc = gh.dem.get('/tai/2.6.0') ?? 0;
      const { u, t } = moUd(gh);
      const [a, b] = await Promise.all([loiCua(() => u.capNhat()), loiCua(() => u.capNhat())]);
      ok('Bấm Cập nhật hai lần cùng lúc → một lần chạy, lần kia "Đang cập nhật"; chỉ tải file một lần',
        [a, b].filter(x => x === '').length === 1 && [a, b].some(x => /Đang cập nhật/.test(x)) && (gh.dem.get('/tai/2.6.0') ?? 0) === truoc + 1
        && giong(docTep(t.tepChay), gh.exe), JSON.stringify([a, b]));
    }

    // Chờ việc ghi xuống cân đang chạy (motLuc)
    {
      let mo!: () => void, daVao = false;
      const cua = new Promise<void>(x => { mo = x; });
      const { u, t } = moUd(gh, { chayPs: async () => { daVao = true; await cua; return 'OK\t4096\r\n'; } });
      const day = loiCua(() => u.kiemTraDay({ com: 'COM3', baud: 9600 }));
      for (let i = 0; i < 40 && !daVao; i++) await Bun.sleep(25);
      const cn = u.capNhat();
      let cau: string | null = null;
      for (let i = 0; i < 60 && !/chờ việc gửi/.test(cau ?? ''); i++) { await Bun.sleep(50); cau = u.trangThaiCapNhat().cauTienDo; }
      const chuaDoi = giong(docTep(t.tepChay), BAN_CU);
      mo();
      await day;
      const kq = await cn;
      const loiDay = await loiCua(() => u.kiemTraDay({ com: 'COM3', baud: 9600 }));
      ok('Đang gửi qua dây / xuống cân → tải xong thì CHỜ việc đó xong rồi mới đổi file', daVao && cau === 'Đã tải xong. Đang chờ việc gửi xuống cân xong…'
        && chuaDoi && kq.phienBan === '2.6.0' && giong(docTep(t.tepChay), gh.exe), String(cau));
      ok('Sau khi đổi file: việc ghi xuống cân mới (hàng đợi) dừng gọn "đang khởi động lại"', /đang khởi động lại/i.test(loiDay), loiDay);
    }

    // Khởi động lại sau khi đổi file
    const sauDoi = (tenThu: string) => {
      const dir = path.join(TAM, `khoi-dong-${tenThu}`, 'Thư mục có dấu');
      fs.mkdirSync(dir, { recursive: true });
      const t = cacTepCapNhat(path.join(dir, 'BeeftownCan.exe'));
      fs.writeFileSync(t.tepChay, gh.exe);
      fs.writeFileSync(t.tepCu, BAN_CU);
      const fileDangChay = path.join(dir, '..', 'dang-chay.json');
      fs.writeFileSync(fileDangChay, JSON.stringify({ cong: 1, ma: 'cu', phienBan: '2.5.0' }));
      return { t, fileDangChay, fileKhoa: path.join(dir, '..', 'dang-cap-nhat.json') };
    };
    {
      const { t, fileDangChay, fileKhoa } = sauDoi('da-mo');
      const buoc: string[] = [];
      let mayMoi: ReturnType<typeof Bun.serve> | null = null;
      const khoiDong: KhoiDong = async (tep, thamSo) => {
        buoc.push(`mo ${path.basename(tep)} ${thamSo} con-dang-chay:${fs.existsSync(fileDangChay)} khoa:${khoaCapNhatConHan(fileKhoa)}`);
        mayMoi = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch: (req) => new Response(new URL(req.url).searchParams.get('t') === 'moi' ? '{"ok":true}' : 'x', { status: new URL(req.url).searchParams.get('t') === 'moi' ? 200 : 403 }) });
        setTimeout(() => fs.writeFileSync(fileDangChay, JSON.stringify({ cong: mayMoi!.port, ma: 'moi', phienBan: '2.6.0' })), 150);
        return 4242;
      };
      const kq = await khoiDongLaiSauCapNhat({ dungMayChu: () => { buoc.push('dung'); }, fileDangChay, fileKhoa, t, phienBanMoi: '2.6.0', phienBanCu: '2.5.0',
        khoiDong, diet: () => buoc.push('diet'), fetch, choMs: 3000, nghiMs: 50 });
      (mayMoi as ReturnType<typeof Bun.serve> | null)?.stop(true);
      ok('Khởi động lại: dừng máy chủ → xoá dang-chay.json → khoá "đang cập nhật" → mở bản mới (--vua-cap-nhat=2.5.0) → bản mới trả lời → bỏ khoá',
        kq === 'da-mo' && buoc.join('|') === 'dung|mo BeeftownCan.exe --vua-cap-nhat=2.5.0 con-dang-chay:false khoa:true'
        && giong(docTep(t.tepChay), gh.exe) && giong(docTep(t.tepCu), BAN_CU) && !fs.existsSync(fileKhoa), `${kq} ${buoc.join('|')}`);
    }
    for (const [ten, cachHong] of [['không trả lời', 'im'], ['ghi sai phiên bản', 'sai'], ['không mở được', 'nem']] as const) {
      const { t, fileDangChay, fileKhoa } = sauDoi(cachHong);
      const buoc: string[] = [];
      let lan = 0;
      const khoiDong: KhoiDong = async (tep, thamSo) => {
        buoc.push(thamSo);
        if (lan++ === 0) {
          if (cachHong === 'nem') throw new LoiCapNhat('bị chặn');
          if (cachHong === 'sai') fs.writeFileSync(fileDangChay, JSON.stringify({ cong: 1, ma: 'x', phienBan: '2.5.0' }));
          return 777;
        }
        return 778;
      };
      const lyDo: string[] = [];
      const kq = await khoiDongLaiSauCapNhat({ dungMayChu: () => {}, fileDangChay, fileKhoa, t, phienBanMoi: '2.6.0', phienBanCu: '2.5.0',
        khoiDong, diet: (pid) => buoc.push(`diet ${pid}`), fetch, choMs: 400, nghiMs: 50,
        conChay: (pid) => pid === 777 && cachHong === 'im', ghiLyDo: (c) => lyDo.push(c) });
      ok(`2.6.1: bản mới ${ten} → ghi lý do vào loi.txt (còn chạy / đã tắt / không mở được)`, lyDo.length === 1 && (cachHong === 'nem'
        ? /^Không mở được bản 2\.6\.0: bị chặn\. Quay về bản 2\.5\.0\.$/.test(lyDo[0])
        : /^Bản 2\.6\.0 \(tiến trình 777\) không trả lời trong 0 giây — /.test(lyDo[0])
          && (cachHong === 'im' ? /vẫn đang chạy/.test(lyDo[0]) : /đã tắt/.test(lyDo[0]))), lyDo.join('|'));
      ok(`Bản mới ${ten} → tự quay về: bản cũ về chỗ, bản mới thành .loi.exe, mở lại bản cũ với --cap-nhat-hong=2.6.0, bỏ khoá`,
        kq === 'quay-ve' && giong(docTep(t.tepChay), BAN_CU) && giong(docTep(t.tepLoi), gh.exe) && !fs.existsSync(t.tepCu) && !fs.existsSync(fileKhoa)
        && buoc.at(-1) === '--cap-nhat-hong=2.6.0' && (cachHong === 'nem' ? !buoc.includes('diet 777') : buoc.includes('diet 777')),
        `${kq} ${buoc.join('|')}`);
    }
    {
      const { t, fileDangChay, fileKhoa } = sauDoi('chua-mo');
      const kq = await khoiDongLaiSauCapNhat({ dungMayChu: () => {}, fileDangChay, fileKhoa, t, phienBanMoi: '2.6.0', phienBanCu: '2.5.0',
        khoiDong: async () => { throw new LoiCapNhat('PowerShell bị chặn'); }, diet: () => {}, fetch, choMs: 200, nghiMs: 50 });
      ok('Bản mới không mở được VÀ mở lại bản cũ cũng không được → "quay-ve-chua-mo": bản cũ đã về chỗ; câu chỉ bảo mở lại, không bảo đổi tên',
        kq === 'quay-ve-chua-mo' && giong(docTep(t.tepChay), BAN_CU) && /^Mở lại BeeftownCan\.exe/.test(cauQuayVeBangTay(t)), `${kq} ${cauQuayVeBangTay(t)}`);
    }
    {
      const { t, fileDangChay, fileKhoa } = sauDoi('hong');
      const khongDoiDuoc: FsHam = { ...FS_THAT, ngu: () => {}, doiTen: () => { throw new Error('EPERM'); } };
      const kq = await khoiDongLaiSauCapNhat({ dungMayChu: () => {}, fileDangChay, fileKhoa, t, phienBanMoi: '2.6.0', phienBanCu: '2.5.0',
        khoiDong: async () => 1, diet: () => {}, fetch, choMs: 200, nghiMs: 50, fsHam: khongDoiDuoc });
      ok('Không quay về được (đổi tên hỏng) → "hong"; câu chỉ cách đổi tên theo đúng file đang có', kq === 'hong'
        && /đổi tên BeeftownCan\.exe thành BeeftownCan\.loi\.exe, rồi đổi BeeftownCan\.cu\.exe thành BeeftownCan\.exe/.test(cauQuayVeBangTay(t)),
        cauQuayVeBangTay(t));
    }
    {
      const dir = path.join(TAM, 'cau-tay');
      fs.mkdirSync(dir, { recursive: true });
      const t = cacTepCapNhat(path.join(dir, 'BeeftownCan.exe'));
      fs.writeFileSync(t.tepCu, 'cu'); fs.writeFileSync(t.tepChay, 'moi'); fs.writeFileSync(t.tepLoi, 'loi cu');
      const caHai = cauQuayVeBangTay(t);
      fs.rmSync(t.tepChay);
      const chiCu = cauQuayVeBangTay(t);
      ok('Câu quay về bằng tay theo đúng file đang có: tên .loi.exe đã có thì đổi thành .moi.exe; chỉ còn .cu.exe thì đổi nó về tên chính',
        /đổi tên BeeftownCan\.exe thành BeeftownCan\.moi\.exe/.test(caHai) && /^Vào thư mục .*: đổi tên BeeftownCan\.cu\.exe thành BeeftownCan\.exe, rồi mở/.test(chiCu),
        `${caHai} · ${chiCu}`);
      const khoa = path.join(dir, 'dang-cap-nhat.json');
      fs.writeFileSync(khoa, JSON.stringify({ den: Date.now() + 60_000 }));
      const conHan = khoaCapNhatConHan(khoa);
      fs.writeFileSync(khoa, JSON.stringify({ den: Date.now() - 1 }));
      ok('Khoá "đang cập nhật": còn hạn → true; hết hạn, không có file, hỏng → false (máy tắt giữa chừng không khoá mãi)',
        conHan && !khoaCapNhatConHan(khoa) && !khoaCapNhatConHan(path.join(dir, 'khong-co.json')));
    }
    {
      const nhan: { lenh: string; bien: Record<string, string> }[] = [];
      const kd = khoiDongQuaPowerShell(async (lenh, bien) => { nhan.push({ lenh, bien }); return 'OK\t4242\r\n'; });
      const tep = 'C:\\Users\\Chủ Quán\\Desktop\\Beeftown Can\\BeeftownCan.exe';
      const pid = await kd(tep, '--vua-cap-nhat=2.5.0', 'C:\\Users\\Chủ Quán\\Desktop\\Beeftown Can');
      const kdHong = khoiDongQuaPowerShell(async () => 'LOI\tWin32Exception\tAccess is denied\r\n');
      ok('Mở bản mới qua PowerShell (.NET Process.Start, không Start-Process — thư mục có [ ] vẫn mở được): đường dẫn có dấu, dấu cách chỉ đi qua biến môi trường; lỗi → câu rõ',
        pid === 4242 && nhan[0].lenh === LENH_KHOI_DONG && !nhan[0].lenh.includes('Chủ Quán') && nhan[0].bien.BT_TEP === tep
        && /ProcessStartInfo/.test(LENH_KHOI_DONG) && !/Start-Process/.test(LENH_KHOI_DONG)
        && nhan[0].bien.BT_THAM === '--vua-cap-nhat=2.5.0' && /Access is denied/.test(await loiCua(() => kdHong('x', 'y', 'z'))));
    }
    {
      const dir = path.join(TAM, 'don');
      fs.mkdirSync(dir, { recursive: true });
      const t = cacTepCapNhat(path.join(dir, 'BeeftownCan.exe'));
      for (const p of [t.tepChay, t.tepCu, t.tepLoi, t.tepDangTai, t.tepThuGhi]) fs.writeFileSync(p, 'x');
      donSauCapNhat(t);
      ok('Lúc khởi động: xoá file tải dở, file thử ghi; giữ .cu.exe (quay về bằng tay) và .loi.exe',
        fs.readdirSync(dir).sort().join() === 'BeeftownCan.cu.exe,BeeftownCan.exe,BeeftownCan.loi.exe');
    }

    // Qua máy chủ cục bộ (may-chu.ts)
    {
      const { u, t } = moUd(gh);
      const goiLai: string[] = [];
      const mc = moMayChu(u, { ma: 'cn', phienBan: '2.5.0', khiCoNhip: () => {}, khiDong: () => {}, khoiDongLai: (v) => goiLai.push(v) });
      const api = async (d: string, than?: unknown) => (await fetch(`http://127.0.0.1:${mc.port}${d}?t=cn`, { method: 'POST',
        body: JSON.stringify(than ?? {}), headers: { 'Content-Type': 'application/json' } })).json() as Promise<Record<string, unknown>>;
      const bm = await api('/api/ban-moi', { hoiLai: true });
      const td = await api('/api/ban-moi', { chiXem: true });
      const tt = await api('/api/trang-thai') as { capNhat?: { coTheCapNhat: boolean } };
      const khongMa = await fetch(`http://127.0.0.1:${mc.port}/api/cap-nhat`, { method: 'POST' });
      const getCn = await fetch(`http://127.0.0.1:${mc.port}/api/cap-nhat?t=cn`);
      gh.cheDo = 'exe-500';
      const hong = await api('/api/cap-nhat');
      gh.cheDo = 'ok';
      await Bun.sleep(700);
      const soGoiSauHong = goiLai.length;
      const cn = await api('/api/cap-nhat');
      await Bun.sleep(700);
      mc.stop(true);
      ok('API: /api/ban-moi (hỏi, tiến độ), /api/trang-thai có capNhat; không mã → 403, GET → 405',
        bm.ok === true && bm.phienBanMoi === '2.6.0' && td.ok === true && td.cauTienDo === null && tt.capNhat?.coTheCapNhat === true
        && khongMa.status === 403 && getCn.status === 405, JSON.stringify([bm, td]));
      ok('API /api/cap-nhat: hỏng → ok:false, KHÔNG khởi động lại; được → trả câu rồi mới hẹn khởi động lại đúng một lần với 2.6.0',
        hong.ok === false && /mã 500/.test(String(hong.loi)) && soGoiSauHong === 0 && cn.ok === true && goiLai.join() === '2.6.0'
        && giong(docTep(t.tepChay), gh.exe), JSON.stringify([hong, cn, goiLai]));
    }
    {
      const truoc = gh.tongLuot();
      const { u, t } = moUd(gh);
      const mc = moMayChu(u, { ma: 'k', phienBan: '2.5.0', khiCoNhip: () => {}, khiDong: () => {} });
      const r = await (await fetch(`http://127.0.0.1:${mc.port}/api/cap-nhat?t=k`, { method: 'POST' })).json() as { ok: boolean; loi: string };
      mc.stop(true);
      ok('Máy chủ không có khoiDongLai (bun, kiểm thử) → /api/cap-nhat từ chối trước khi tải gì', !r.ok && /không tự khởi động lại/.test(r.loi)
        && gh.tongLuot() === truoc && giong(docTep(t.tepChay), BAN_CU), JSON.stringify(r));
    }

    // Câu chữ và mã trang
    {
      const nguon = fs.readFileSync(path.join(import.meta.dir, '..', 'src', 'cap-nhat.ts'), 'utf8');
      const gd = fs.readFileSync(path.join(import.meta.dir, '..', 'src', 'giao-dien.html'), 'utf8');
      const main = fs.readFileSync(path.join(import.meta.dir, '..', 'src', 'main.ts'), 'utf8');
      ok('Câu chữ: không có "thành công"; cửa sổ cũ nói "Đã tải và kiểm tra… Đang khởi động lại"; trang không tự dựng đường tải (không "github.com")',
        !/thành công/i.test(nguon) && !/thành công/i.test(gd.slice(gd.indexOf('cập nhật chương trình (2.5)'))) && !/github\.com/.test(gd));
      ok('Trang: hỏi bản mới im lặng lúc mở, confirm trước /api/cap-nhat, tự đóng cửa sổ cũ, thôi nhịp / báo đóng khi đang khởi động lại',
        /kiemBanMoi\(false\)\.catch\(\(\) => \{\}\)/.test(gd) && gd.indexOf('confirm(`Cập nhật Beeftown Cân') < gd.indexOf("goi('/api/cap-nhat')")
        && /window\.close\(\)/.test(gd) && /if \(!dangKhoiDongLai\) fetch\('\/api\/nhip/.test(gd) && /if \(!dangKhoiDongLai\) navigator\.sendBeacon/.test(gd)
        && /if \(dangCapNhat \|\| !banMoi \|\| !banMoi\.phienBanMoi\) return;/.test(gd));
      ok('Trang: tiến độ và lỗi cập nhật hiện ở đầu trang (#bao-cap-nhat), không trong khung Cài đặt đang gập; tải lại giữa chừng vẫn theo dõi; không tự mời bản đã hỏng',
        /bao\(\$\('bao-cap-nhat'\), 'loi', e\(err\.message\)\)/.test(gd) && /'Đang cập nhật chương trình: ' \+ e\(t\.cauTienDo\)/.test(gd)
        && /if \(c\.dangCapNhat && !dangCapNhat\) theoDoiCapNhat\(\);/.test(gd) && /!coMoi \|\| banMoi\.daHongTruoc \|\| dangCapNhat/.test(gd)
        && !/id="dang-cap-nhat"/.test(gd));
      ok('main.ts: không tự tắt / tự gửi khi đang cập nhật (tính từ lúc đổi file, ud.dangDoiFile); dang-chay.json ghi phiên bản; nguồn thử chỉ nhận 127.0.0.1',
        /khiDong: \(\) => \{ if \(!dangCapNhat\(\)\)/.test(main) && /if \(!dangCapNhat\(\) && Date\.now\(\) - nhipCuoi/.test(main)
        && /const dangCapNhat = \(\) => dangKhoiDongLai \|\| ud\.dangDoiFile\(\);/.test(main) && /if \(dangCapNhat\(\) \|\| dangTuGui/.test(main)
        && /JSON\.stringify\(\{ cong: mayChu\.port, ma: MA, phienBan: PHIEN_BAN \}\)/.test(main) && /\^http:\\\/\\\/127\\\.0\\\.0\\\.1:/.test(main));
      ok('main.ts: đang có khoá "đang cập nhật" thì lần mở tay báo chờ và thoát (không hai bản cùng chạy); bản mở sau cập nhật được qua',
        /if \(!moSauCapNhat && khoaCapNhatConHan\(fileKhoaCapNhat\)\)/.test(main) && main.indexOf('khoaCapNhatConHan(fileKhoaCapNhat)') < main.indexOf('Đã có một bản đang chạy?')
        && /fileKhoa: fileKhoaCapNhat/.test(main) && /cauQuayVeBangTay\(t\)/.test(main));
      ok('2.6.1 main.ts: chờ bản mới 3 phút; ghi lý do vào loi.txt; chạy thử qua PowerShell; chế độ chạy thử đứng TRƯỚC mọi bước khởi động',
        /choMs: 180_000/.test(main) && /ghiLyDo: \(cau\) => ghiLoiTxt\(/.test(main) && /chayThu: chayThuQuaPowerShell\(chayPowerShell\)/.test(main)
        && /process\.kill\(pid, 0\)/.test(main) && main.indexOf('BEEFTOWN_CAN_THU_CHAY') < main.indexOf('new UngDung(')
        && main.indexOf('BEEFTOWN_CAN_THU_CHAY') < main.indexOf('khoaCapNhatConHan(fileKhoaCapNhat)'));
      {
        // Chạy thật src/main.ts ở chế độ chạy thử (như bản cũ chạy thử file vừa tải): ghi phiên bản rồi thoát, không mở máy chủ.
        const thuMuc = path.join(TAM, 'chay-thu-that');
        fs.mkdirSync(thuMuc, { recursive: true });
        const ketQua = path.join(thuMuc, 'BeeftownCan.chay-thu.json');
        const moiTruong = { ...process.env, APPDATA: path.join(thuMuc, 'appdata'), HOME: thuMuc, USERPROFILE: thuMuc };
        const batDau = Date.now();
        const r = Bun.spawnSync([process.execPath, path.join(import.meta.dir, '..', 'src', 'main.ts'), '--khong-mo'],
          { env: { ...moiTruong, BEEFTOWN_CAN_THU_CHAY: ketQua }, timeout: 30_000 });
        const ghi = fs.existsSync(ketQua) ? JSON.parse(fs.readFileSync(ketQua, 'utf8')) as { phienBan?: string } : null;
        const phienBanMain = /const PHIEN_BAN = '([\d.]+)'/.exec(main)?.[1];
        ok('2.6.1: chạy src/main.ts với BEEFTOWN_CAN_THU_CHAY → ghi đúng phiên bản rồi thoát 0, không mở máy chủ (không dang-chay.json, không in đường dẫn)',
          r.exitCode === 0 && ghi?.phienBan === phienBanMain && !fs.existsSync(path.join(thuMuc, 'appdata', 'BeeftownCan', 'dang-chay.json'))
          && !/Mở: http/.test(r.stdout.toString()) && Date.now() - batDau < 30_000, `${r.exitCode} ${JSON.stringify(ghi)} ${r.stderr.toString().slice(0, 200)}`);
        const sai = path.join(thuMuc, 'khac.json');
        const r2 = Bun.spawnSync([process.execPath, path.join(import.meta.dir, '..', 'src', 'main.ts'), '--khong-mo'],
          { env: { ...moiTruong, BEEFTOWN_CAN_THU_CHAY: sai }, timeout: 30_000 });
        ok('2.6.1: BEEFTOWN_CAN_THU_CHAY trỏ tới file không đúng đuôi .chay-thu.json → không ghi gì, thoát mã 2, không mở máy chủ',
          r2.exitCode === 2 && !fs.existsSync(sai) && !/Mở: http/.test(r2.stdout.toString()), String(r2.exitCode));
      }
      ok('main.ts: hộp báo lỗi nhận câu qua biến môi trường BT_CHU, không ghép vào lệnh PowerShell (câu có đường dẫn thư mục — tên có dấu nháy ’ không phá được lệnh)',
        /\[System\.Windows\.MessageBox\]::Show\(\$env:BT_CHU, /.test(main) && /BT_CHU: `Beeftown Cân không chạy được:/.test(main)
        && !/::Show\('\$\{/.test(main) && !/replace\(\/'\/g, "''"\)/.test(main));
    }
  } finally {
    await gh.dong();
    fs.rmSync(TAM, { recursive: true, force: true });
  }
}

if ((import.meta as { main?: boolean }).main) {
  let dat = 0, hong = 0;
  await thuCapNhat((ten, dk, ct = '') => {
    if (dk) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten} ${ct}`); }
  });
  console.log(hong === 0 ? `\nTẤT CẢ ${dat} KIỂM TRA TỰ CẬP NHẬT ĐỀU ĐẠT` : `\n${hong} KIỂM TRA HỎNG / ${dat + hong}`);
  process.exit(hong === 0 ? 0 : 1);
}
