/**
 * Kiểm thử 2.10 — dây RS232 là đường chính, không cần cân thật, không cần dây thật:
 *   - giao-thuc.ts qua luồng (moKetNoiQuaLuong): bắt tay như hãng trên dây (không BOM, UPL END sau MAC), cân im lặng là
 *     'khong-noi' sau lần hỏi đầu, chờ gửi / hàng rào cộng thời gian đẩy byte qua dây, câu lỗi nói về dây;
 *   - day-rs232.ts cầu nối (moCauNoiTienTrinh, luongTuTienTrinh): tiến trình cầu nối giả (bun) nối tới cân giả — mở xong
 *     ("SAN"), báo lỗi cổng (dòng LOI), quá giờ mở, đóng luồng thì tiến trình thoát; LENH_CAU_NOI cài cổng như hãng;
 *   - nghiep-vu.ts đường dây (duongCan 'day'): chọn dây (bắt tay, nhớ mã máy, mã khác thì không đổi), gửi giá / đọc lại / giờ
 *     / kiểm tra kết nối đi qua dây, không bao giờ qua WiFi hay cổng 33571, cân không ở màn hình P43 thì báo và không ghi
 *     nhận gì, không giữ kết nối, quyền; về lại WiFi.
 *
 *     cd can-app && npx bun test/thu-day-chinh.ts
 *
 * test/thu.ts gọi `thuDayChinh(ok, …)`. Cân giả (test/can-gia-hai-chieu.ts) làm theo đặc tả suy từ phần mềm của hãng —
 * đạt ở đây KHÔNG có nghĩa là cân thật cũng vậy (đọc / ghi qua dây chưa thử trên cân thật).
 */
import * as fs from 'node:fs';
import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import type { Duplex } from 'node:stream';
import { LoiGiaoThuc, moKetNoi, moKetNoiQuaLuong, type TuyChonKetNoi } from '../src/giao-thuc.ts';
import { LENH_CAU_NOI, LoiDay, moCauNoiPowerShell, moCauNoiTienTrinh, moKetNoiDay, type ChayPs, type MoCauNoi } from '../src/day-rs232.ts';
import { LoiKhacMay, UngDung, quyenCuaVai, type DanhMucKho, type NguoiDung } from '../src/nghiep-vu.ts';
import { docFileCan, type HangKho } from '../../web/src/lib/kho/can-tma.ts';
import { chuoiByte, moCanGia, type CanGia } from './can-gia-hai-chieu.ts';

type Ok = (ten: string, dieuKien: boolean, chiTiet?: string) => void;
interface TroGiup { fileCan: (dong: string[]) => Uint8Array; plu: (so: number, ma: string, gia: string, ten: string) => string }

const IP = '127.0.0.1';
const NHANH: TuyChonKetNoi = { choMs: 1500, choNoiMs: 1000, choHangRaoMs: 1500, nghiBaoCaoMs: 1 };
const BOM = '\xEF\xBB\xBF';
const loiCua = async (f: () => Promise<unknown>): Promise<Error | null> => { try { await f(); return null; } catch (e) { return e as Error; } };
const hang = (ma: string, ma_can: string, ten: string, gia: number): HangKho => ({ ma, ma_can, ten, gia_ban_kg: gia, dang_dung: true });

/** "Dây" giả: một kết nối TCP tới cân giả — cùng luồng byte hai chiều như cầu nối PowerShell. */
const noiCanGia = (can: CanGia) => new Promise<Duplex>((xong, hong) => {
  const s = net.createConnection({ host: IP, port: can.cong });
  s.once('connect', () => xong(s));
  s.once('error', hong);
});

/** Cầu nối giả: ghi lại mọi lần mở (cổng, tốc độ); `hong` → không mở được cổng (như PowerShell báo LOI). */
function cauNoiGia(can: CanGia) {
  const g = { lan: [] as { com: string; baud: number }[], hong: null as Error | null, mo: null as unknown as MoCauNoi };
  g.mo = async (com, baud) => {
    g.lan.push({ com, baud });
    if (g.hong) throw g.hong;
    return noiCanGia(can);
  };
  return g;
}

/** Tiến trình cầu nối giả (bun): nối tới cân giả, in SAN ra stderr, chuyển byte stdin ↔ cân; stdin hết → đóng, thoát. */
const CAU_NOI_GIA = `
const net = require('node:net');
const s = net.createConnection({ host: '127.0.0.1', port: Number(process.env.CONG) });
s.on('connect', () => {
  process.stderr.write('SAN\\r\\n');
  process.stdin.on('data', (b) => s.write(b));
  process.stdin.on('end', () => s.end());
  s.on('data', (b) => process.stdout.write(b));
});
s.on('close', () => process.exit(0));
s.on('error', () => process.exit(3));
`;
const chayBun = (ma: string, env: Record<string, string> = {}) => () =>
  spawn(process.execPath, ['-e', ma], { env: { ...process.env, ...env }, stdio: ['pipe', 'pipe', 'pipe'] });
const choThoat = (con: ChildProcess, ms = 3000) => new Promise<boolean>((xong) => {
  if (con.exitCode !== null || con.signalCode !== null) { xong(true); return; }
  const hen = setTimeout(() => xong(false), ms);
  con.once('exit', () => { clearTimeout(hen); xong(true); });
});

export async function thuDayChinh(ok: Ok, h: TroGiup): Promise<void> {
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'beeftown-can-day-chinh-'));
  const cacCan: CanGia[] = [];
  const canMoi = async () => {
    const c = await moCanGia({ du: { phan: { PLU: [chuoiByte(h.plu(1, '10001', '845,0', 'Lõi vai bò Mỹ'))], TMS: ['TMS\t0\t28\t', 'TMS\t202\t3\t'] } } });
    cacCan.push(c);
    return c;
  };
  let soThuMuc = 0;
  const ddMoi = () => { soThuMuc++; return { cauHinh: path.join(tam, `appdata${soThuMuc}`), duLieu: path.join(tam, `tai-lieu${soThuMuc}`) }; };
  try {
    console.log('6m1 · 2.10 — giao thức qua dây: bắt tay như hãng, cân im lặng, chờ theo tốc độ dây, câu lỗi');
    {
      const can = await canMoi();
      const kn = await moKetNoiQuaLuong(await noiCanGia(can), 'COM3', 9600, NHANH);
      const nhan = can.nhanTu().toString('latin1');
      ok('Bắt tay qua dây: mở bằng một dòng trống (không BOM như đường mạng), UPL MAC, rồi UPL END sau MAC như hãng trên dây, rồi UPL INF',
        nhan.startsWith('\r\nUPL\tMAC\t\r\nUPL\tEND\t\r\nUPL\tINF\t\r\n') && !nhan.includes(BOM), JSON.stringify(nhan.slice(0, 60)));
      ok('Bắt tay qua dây đọc được mã máy, tên máy, bảng mã như đường mạng', kn.thongTin.mac === '0023F01AECB1'
        && kn.thongTin.maHoa === 'UTF-8' && kn.thongTin.model.startsWith('TM-xA'), JSON.stringify(kn.thongTin));
      const dong = await kn.docPhan('PLU');
      ok('Qua dây đọc được danh sách hàng (UPL PLU) y nguyên byte', dong.length === 1 && dong[0] === chuoiByte(h.plu(1, '10001', '845,0', 'Lõi vai bò Mỹ')));
      await kn.ghi(['DWL\tPLU\t', chuoiByte(h.plu(1, '10001', '850,0', 'Lõi vai bò Mỹ')), 'END\tPLU\t']);
      ok('Qua dây ghi được khối DWL PLU, qua hàng rào UPL TIM', can.khoi.at(-1)?.ten === 'PLU' && can.du.phan.PLU[0].includes('\t850,0\t'));
      kn.dong();

      const canMang = await canMoi();
      const knMang = await moKetNoi(IP, canMang.cong, NHANH);
      ok('Đường mạng không đổi: vẫn mở bằng BOM, không UPL END sau MAC', canMang.nhanTu().toString('latin1').startsWith(BOM + '\r\nUPL\tMAC\t\r\nUPL\tINF\t'));
      knMang.dong();

      can.hong = { loai: 'im-lang' };
      const t0 = Date.now();
      const eIm = await loiCua(() => moKetNoiQuaLuong(noiCanGiaDongBo(can), 'COM3', 9600, NHANH));
      ok('Cân không ở màn hình P43 (im lặng) → "khong-noi" sau lần hỏi đầu (không chờ 3 lần), câu chỉ Prog → 4 → 3, chưa gửi gì',
        eIm instanceof LoiGiaoThuc && eIm.loai === 'khong-noi' && !eIm.daGhi && /Prog → 4 → 3/.test(eIm.message) && /chưa gửi gì/.test(eIm.message)
        && Date.now() - t0 < 2500, `${eIm?.message} ${Date.now() - t0} ms`);
      can.hong = null;

      // Dây chậm: 300 bit/giây, 3 dòng PLU (~500 byte) mất ~17 giây — hàng rào phải chờ thêm thời gian đó.
      const canCham = await canMoi();
      canCham.hong = { loai: 'hang-rao-cham', ms: 900 };
      const khoi = ['DWL\tPLU\t', ...[1, 2, 3].map(so => chuoiByte(h.plu(so, `1000${so}`, '845,0', 'Hàng thử'))), 'END\tPLU\t'];
      const tuyCham = { ...NHANH, choHangRaoMs: 300 };
      const knDay = await moKetNoiQuaLuong(await noiCanGia(canCham), 'COM3', 300, tuyCham);
      const eDay = await loiCua(() => knDay.ghi(khoi));
      ok('Dây 300 bit/giây: hàng rào chờ thêm thời gian đẩy byte qua dây — cân trả lời chậm 0,9 giây vẫn qua (hàng rào gốc 0,3 giây)',
        eDay === null, eDay?.message);
      knDay.dong();
      const knMangCham = await moKetNoi(IP, canCham.cong, tuyCham);
      const eMangCham = await loiCua(() => knMangCham.ghi(khoi));
      ok('Cùng cân chậm qua mạng (không cộng thời gian dây) → hết giờ hàng rào như trước', eMangCham instanceof LoiGiaoThuc && eMangCham.loai === 'het-gio');
      canCham.hong = null;

      const canGio = await canMoi();
      canGio.hong = { loai: 'bo-qua-gio' };
      const knGio = await moKetNoiQuaLuong(await noiCanGia(canGio), 'COM3', 9600, NHANH);
      const eGio = await loiCua(() => knGio.datGio({ nam: 2026, thang: 10, ngay: 19, gio: 9, phut: 30, giay: 0 }));
      ok('Đặt giờ qua dây mà cân không nhận → câu lỗi nói về dây, không nói cổng 33581', eGio instanceof LoiGiaoThuc
        && /cân chưa nhận giờ mới/.test(eGio.message) && /dây RS232/.test(eGio.message) && !/33581/.test(eGio.message), eGio?.message);
      canGio.hong = { loai: 'im-lang' };
      const eIm1 = await loiCua(() => knGio.docGio());
      const eSau = await loiCua(() => knGio.docGio());
      ok('Cân im lặng giữa chừng (hết giờ) rồi lệnh sau trên kết nối dây đó → báo đã đóng sau lỗi, cả hai câu nói về dây, không nói 33581',
        eIm1 instanceof LoiGiaoThuc && eIm1.loai === 'het-gio' && !/33581/.test(eIm1.message)
        && eSau instanceof LoiGiaoThuc && /đã đóng sau lỗi lần trước/.test(eSau.message) && /dây RS232/.test(eSau.message) && !/33581/.test(eSau.message),
        `${eIm1?.message} | ${eSau?.message}`);
      knGio.dong();

      const canDut = await canMoi();
      const knDut = await moKetNoiQuaLuong(await noiCanGia(canDut), 'COM4', 9600, NHANH);
      canDut.hong = { loai: 'dong-giua-chung', khi: 'PLU' };
      const eDut = await loiCua(() => knDut.docPhan('PLU'));
      ok('Đứt dây giữa lúc đọc → câu lỗi nói về dây RS232 và Prog → 4 → 3, không nói cổng 33581',
        eDut instanceof LoiGiaoThuc && eDut.loai === 'mat-ket-noi' && /dây RS232/.test(eDut.message) && !/33581/.test(eDut.message), eDut?.message);
    }

    console.log('6m2 · 2.10 — cầu nối dây: tiến trình giữ cổng, mở xong, báo lỗi cổng, quá giờ, đóng');
    {
      const can = await canMoi();
      let con: ChildProcess | null = null;
      const tao = chayBun(CAU_NOI_GIA, { CONG: String(can.cong) });
      const luong = await moCauNoiTienTrinh('COM3', () => { con = tao(); return con; });
      const kn = await moKetNoiQuaLuong(luong, 'COM3', 9600, NHANH);
      const dong = await kn.docPhan('PLU');
      ok('Cầu nối (tiến trình giả): mở xong khi tiến trình báo SAN; bắt tay, đọc PLU qua stdin / stdout của tiến trình',
        kn.thongTin.mac === '0023F01AECB1' && dong.length === 1, JSON.stringify(kn.thongTin));
      await kn.ghi(['DWL\tPLU\t', chuoiByte(h.plu(1, '10001', '860,0', 'Lõi vai bò Mỹ')), 'END\tPLU\t']);
      ok('Cầu nối: ghi khối DWL qua stdin tới cân, hàng rào trả lời qua stdout', can.du.phan.PLU[0].includes('\t860,0\t'));
      kn.dong();
      ok('Đóng kết nối → tiến trình cầu nối thoát (cổng COM được trả)', !!con && await choThoat(con!));

      const eBan = await loiCua(() => moCauNoiTienTrinh('COM3', chayBun(
        "process.stderr.write('LOI\\tUnauthorizedAccessException\\tAccess to the port COM3 is denied.\\r\\n'); process.exit(2);")));
      ok('Cổng COM đang bị chương trình khác dùng (PowerShell báo LOI) → LoiDay nói rõ, không mở luồng',
        eBan instanceof LoiDay && /đang bị chương trình khác dùng/.test(eBan.message), eBan?.message);
      const eKhongCo = await loiCua(() => moCauNoiTienTrinh('COM9', chayBun(
        "process.stderr.write('LOI\\tIOException\\tThe port COM9 does not exist.\\r\\n'); process.exit(2);")));
      ok('Không có cổng COM (dây rút) → LoiDay chỉ cắm dây, Tìm cổng COM', eKhongCo instanceof LoiDay && /Không thấy cổng COM9/.test(eKhongCo.message), eKhongCo?.message);
      // Cầu nối mở được cổng rồi hỏng giữa chừng (cân giữ XOFF tới hết giờ ghi): lý do của PowerShell tới câu báo.
      const luongHong = await moCauNoiTienTrinh('COM3', chayBun(
        "process.stderr.write('SAN\\r\\n'); process.stdin.once('data', () => { process.stderr.write('LOI\\tTimeoutException\\tThe write timed out.\\r\\n'); process.exit(2); });"));
      const eGiua = await loiCua(() => moKetNoiQuaLuong(luongHong, 'COM3', 9600, NHANH));
      ok('Cầu nối hỏng giữa chừng (PowerShell báo LOI quá giờ ghi) → "mất kết nối" kèm lý do của dây, không chỉ câu chung',
        eGiua instanceof LoiGiaoThuc && eGiua.loai === 'mat-ket-noi' && /Dây báo: Cổng COM3 không đẩy được dữ liệu đi/.test(eGiua.message), eGiua?.message);
      const eLang = await loiCua(() => moCauNoiTienTrinh('COM3', chayBun('process.exit(0);')));
      ok('Tiến trình thoát mà không báo gì → LoiDay "không mở được cổng", không treo', eLang instanceof LoiDay && /Không mở được cổng COM3/.test(eLang.message), eLang?.message);
      let conTreo: ChildProcess | null = null;
      const taoTreo = chayBun('setInterval(() => {}, 1000);');
      const eTreo = await loiCua(() => moCauNoiTienTrinh('COM3', () => { conTreo = taoTreo(); return conTreo; }, 300));
      ok('Mở cổng quá giờ → LoiDay, tiến trình bị dừng', eTreo instanceof LoiDay && /quá/.test(eTreo.message) && !!conTreo && await choThoat(conTreo!), eTreo?.message);

      if (process.platform !== 'win32') {
        const eWin = await loiCua(() => moCauNoiPowerShell('COM3', 9600));
        ok('Cầu nối PowerShell trên máy không phải Windows → LoiDay, không chạy gì', eWin instanceof LoiDay && /Windows/.test(eWin.message));
      }
      const eCom = await loiCua(() => moKetNoiDay('COM3; rm', 9600, NHANH, async () => { throw new Error('không được gọi'); }));
      ok('Tên cổng lạ ("COM3; rm") → chặn trước khi mở cầu nối', eCom instanceof LoiDay && /Chọn cổng COM/.test(eCom.message), eCom?.message);
      ok('LENH_CAU_NOI cài cổng như hãng: 8N1, XOn/XOff, không bật DTR / RTS; đệm đọc lớn; báo SAN / LOI ra stderr; byte qua stdin / stdout',
        /Parity\]::None, 8, \[System\.IO\.Ports\.StopBits\]::One/.test(LENH_CAU_NOI) && /Handshake\]::XOnXOff/.test(LENH_CAU_NOI)
        && !/DtrEnable|RtsEnable/.test(LENH_CAU_NOI) && /ReadBufferSize = 1048576/.test(LENH_CAU_NOI)
        && /\$loi\.WriteLine\('SAN'\)/.test(LENH_CAU_NOI) && /'LOI' \+ \[char\]9/.test(LENH_CAU_NOI)
        && /OpenStandardInput\(\)/.test(LENH_CAU_NOI) && /OpenStandardOutput\(\)/.test(LENH_CAU_NOI) && /\$env:BT_COM/.test(LENH_CAU_NOI));
      ok('LENH_CAU_NOI: stdin hết thì chờ cổng đẩy hết rồi mới đóng cổng; luôn đóng cổng (finally)',
        /\$m -le 0\) \{ \$het = \$true \}/.test(LENH_CAU_NOI) && /BytesToWrite -gt 0/.test(LENH_CAU_NOI) && /finally \{ \[void\]\$p\.Close\(\) \}/.test(LENH_CAU_NOI));
    }

    console.log('6m3 · 2.10 — dây là đường chính: chọn dây, gửi giá, đọc lại, giờ, không qua WiFi / 33571');
    {
      const can = await canMoi();          // cân ở đầu dây
      const canWifi = await canMoi();      // cổng hai chiều WiFi — đường dây không bao giờ được nối tới
      const cau = cauNoiGia(can);
      let soGuiTcp = 0, soThu = 0;
      const dm = (gia: number): DanhMucKho => ({ mauMaVach: '2XCCCCCWWWWWK', matHang: [hang('LOI-VAI', '10001', 'Lõi vai bò Mỹ', gia)] });
      let danhMuc = dm(850000);
      const ud = new UngDung(ddMoi(), {
        danhMuc: async () => danhMuc, mang: [], mac: async () => null, tuyHaiChieu: NHANH, choXacNhanMs: [0],
        moCauNoi: cau.mo, gui: async () => { soGuiTcp++; }, thu: async () => { soThu++; return true; }, chayPs: psBatTay,
      });
      ud.luuCauHinh({ ipCan: IP, congCan: 1, congHaiChieu: canWifi.cong });
      ud.ghiNhanFileTuCan(h.fileCan([h.plu(1, '10001', '845,0', 'Lõi vai bò Mỹ')]));

      const soKhoi = can.khoi.length;
      const chon = await ud.chonDuongCan({ duong: 'day', com: 'COM3', baud: 9600 });
      ok('Chọn dây làm đường chính: bắt tay qua dây được → lưu duongCan "day", cổng, tốc độ; nhớ mã máy cân; không ghi gì xuống cân',
        chon.cauHinh.duongCan === 'day' && chon.cauHinh.com === 'COM3' && chon.cauHinh.baud === 9600 && chon.cauHinh.macHaiChieu === '0023F01AECB1'
        && chon.thongTin?.mac === '0023F01AECB1' && can.khoi.length === soKhoi && cau.lan.length === 1 && can.yeuCau.includes('UPL\tTIM\t'),
        JSON.stringify(chon));

      const gui = await ud.guiXuongCan();
      const khoiDay = can.khoi.slice(soKhoi);
      ok('Gửi giá khi dùng dây: khối DWL PLU đi qua dây (cầu nối mở ở COM3, 9600), đọc lại qua dây khớp → cân đã nhận, cachGui "day"',
        gui.xacNhan && gui.cachGui === 'day' && khoiDay.length === 1 && khoiDay[0].ten === 'PLU' && can.du.phan.PLU[0].includes('\t850,0\t')
        && cau.lan.every(l => l.com === 'COM3' && l.baud === 9600), JSON.stringify({ gui, lan: cau.lan }));
      ok('Gửi giá khi dùng dây: không nối WiFi (cổng hai chiều), không gửi qua 33571, không dò cân',
        canWifi.ketNoi.length === 0 && soGuiTcp === 0 && soThu === 0, JSON.stringify({ wifi: canWifi.ketNoi.length, soGuiTcp, soThu }));
      ok('Sau khi gửi qua dây: file gốc theo kho (850.000 đ)', docFileCan(fs.readFileSync(ud.fileGoc)).plu[0].tho.includes('\t850,0\t'));

      // Cân đang bán hàng (không ở màn hình P43): cân không nghe dây.
      danhMuc = dm(870000);
      const gocTruoc = fs.readFileSync(ud.fileGoc);
      const soKhoi2 = can.khoi.length;
      can.hong = { loai: 'im-lang' };
      const eIm = await loiCua(() => ud.guiXuongCan());
      ok('Dây: cân không ở Prog → 4 → 3 → Gửi báo rõ phải vào P43, chưa gửi gì; không lui về WiFi / 33571',
        !!eIm && /Prog → 4 → 3/.test(eIm.message) && /chưa gửi gì/.test(eIm.message) && can.khoi.length === soKhoi2
        && canWifi.ketNoi.length === 0 && soGuiTcp === 0 && soThu === 0, eIm?.message);
      ok('Dây: lần gửi không tới cân → không ghi nhận gì (file gốc không đổi)', Buffer.compare(gocTruoc, fs.readFileSync(ud.fileGoc)) === 0);
      const lanTu = await ud.tuGuiMotLan();
      ok('Dây: tự gửi lúc cân đang bán hàng → báo hỏng kèm cách làm (Prog → 4 → 3), không gửi qua WiFi',
        lanTu.hong === true && !lanTu.daGui && /Prog → 4 → 3/.test(lanTu.cau) && canWifi.ketNoi.length === 0 && soGuiTcp === 0, JSON.stringify(lanTu));
      const soMoTu = cau.lan.length;
      const lanTu2 = await ud.tuGuiMotLan();
      ok('Dây: lượt tự gửi sau (trong 2 phút) không mở dây, nói giờ thử lại và cách gửi ngay — không giữ hàng đợi mỗi phút',
        cau.lan.length === soMoTu && !lanTu2.daGui && /tự gửi thử lại lúc \d\d:\d\d/.test(lanTu2.cau) && /Gửi xuống cân/.test(lanTu2.cau), JSON.stringify(lanTu2));
      const tc = await ud.thuCan();
      ok('Dây: Kiểm tra kết nối lúc cân không nghe dây → không thông, câu chỉ Prog → 4 → 3, không dò WiFi',
        !tc.thongCan && /Prog → 4 → 3/.test(tc.loi ?? '') && soThu === 0 && canWifi.ketNoi.length === 0, JSON.stringify(tc));
      const eGio = await loiCua(() => ud.chinhGioCan());
      ok('Dây: chỉnh giờ lúc cân không nghe dây → báo lỗi, không lui về gửi giờ qua 33571', !!eGio && soGuiTcp === 0, eGio?.message);
      can.hong = null;

      const tc2 = await ud.thuCan();
      ok('Dây: Kiểm tra kết nối khi cân ở P43 → thông', tc2.thongCan && tc2.loi === null, JSON.stringify(tc2));
      const gio = await ud.chinhGioCan();
      ok('Dây: chỉnh giờ qua dây, cân báo lại giờ mới → cach "day"', gio.cach === 'day' && gio.daXacNhan, JSON.stringify(gio));
      const gui2 = await ud.guiXuongCan();
      ok('Dây: cân về P43 → gửi lại được giá mới (870.000 đ), cân đã nhận', gui2.xacNhan && gui2.cachGui === 'day' && can.du.phan.PLU[0].includes('\t870,0\t'));

      const soMo = cau.lan.length;
      await ud.nhipCan();
      ok('Dây: không giữ kết nối — nhịp 30 giây không mở dây, không nối WiFi', cau.lan.length === soMo && canWifi.ketNoi.length === 0);
      const eChanDoan = await loiCua(() => ud.chanDoanWifi());
      ok('Dây: Chẩn đoán WiFi bị chặn (chỉ chạy khi nối qua WiFi), không mở dây', !!eChanDoan && /Về lại WiFi/.test(eChanDoan.message)
        && cau.lan.length === soMo, eChanDoan?.message);

      cau.hong = new LoiDay('Cổng COM3 đang bị chương trình khác dùng (phần mềm cân cũ…). Tắt chương trình đó rồi thử lại.');
      danhMuc = dm(880000);
      const eBan = await loiCua(() => ud.guiXuongCan());
      ok('Dây: cổng COM bận (không mở được cầu nối) → báo đúng câu đó, không lui về WiFi / 33571',
        !!eBan && /đang bị chương trình khác dùng/.test(eBan.message) && canWifi.ketNoi.length === 0 && soGuiTcp === 0, eBan?.message);
      cau.hong = null;

      can.du.mac = [0, 35, 240, 26, 236, 178];   // cân khác ở đầu dây
      const soKhoi3 = can.khoi.length;
      const eKhac = await loiCua(() => ud.guiXuongCan());
      ok('Dây: cân ở đầu dây khác mã máy đã nhớ → không gửi gì (LoiKhacMay)', eKhac instanceof LoiKhacMay && can.khoi.length === soKhoi3
        && /không phải cân chương trình vẫn dùng/.test(eKhac.message), eKhac?.message);
      const eChonKhac = await loiCua(() => ud.chonDuongCan({ duong: 'day', com: 'COM5', baud: 9600 }));
      ok('Chọn dây ở cổng khác mà cân khác mã máy → không đổi đường (vẫn COM3)', !!eChonKhac && ud.cauHinh().com === 'COM3'
        && ud.cauHinh().duongCan === 'day', eChonKhac?.message);
      can.du.mac = [0, 35, 240, 26, 236, 177];

      // Thử dây ở cổng khác lúc đang dùng dây COM3: không được lặng lẽ dời đường chính sang cổng đó.
      const kt = await ud.kiemTraDay({ com: 'COM7', baud: 19200 });
      ok('Dây: Kiểm tra dây ở cổng / tốc độ khác (COM7, 19200) → hỏi được, nhưng đường chính vẫn COM3, 9600',
        kt.com === 'COM7' && ud.cauHinh().com === 'COM3' && ud.cauHinh().baud === 9600 && ud.cauHinh().duongCan === 'day', JSON.stringify(ud.cauHinh()));

      const veWifi = await ud.chonDuongCan({ duong: 'wifi' });
      ok('Về lại WiFi: bỏ duongCan, giữ cổng COM đã chọn', veWifi.cauHinh.duongCan === undefined && veWifi.cauHinh.com === 'COM3');
      const soMo2 = cau.lan.length;
      const gui3 = await ud.guiXuongCan();
      ok('Về lại WiFi: gửi đi qua cổng hai chiều WiFi như trước, không mở dây', gui3.cachGui === 'hai-chieu' && canWifi.ketNoi.length > 0
        && cau.lan.length === soMo2, JSON.stringify(gui3));
      ud.dongNen();
    }
    {
      const can = await canMoi();
      const cau = cauNoiGia(can);
      can.hong = { loai: 'im-lang' };
      const ud = new UngDung(ddMoi(), { danhMuc: async () => ({ mauMaVach: '2XCCCCCWWWWWK', matHang: [] }), mang: [], mac: async () => null, tuyHaiChieu: NHANH, moCauNoi: cau.mo });
      const e = await loiCua(() => ud.chonDuongCan({ duong: 'day', com: 'COM3', baud: 9600 }));
      ok('Chọn dây lúc cân không nghe dây → báo Prog → 4 → 3, giữ nguyên WiFi', !!e && /Prog → 4 → 3/.test(e.message) && ud.cauHinh().duongCan === undefined, e?.message);
      const eTocDo = await loiCua(() => ud.chonDuongCan({ duong: 'day', com: 'COM3', baud: 1234 }));
      ok('Chọn dây với tốc độ cân không có → chặn trước khi mở dây', !!eTocDo && /tốc độ/i.test(eTocDo.message) && cau.lan.length === 1, eTocDo?.message);
      const eLa = await loiCua(() => ud.chonDuongCan({ duong: 'usb' }));
      ok('Đường nối lạ → chặn', !!eLa && /dây RS232 hoặc WiFi/.test(eLa.message));
      ud.dongNen();

      const cn = { id: 'cn1', ma: 'q1', ten: 'Hàm Nghi' };
      const nv: NguoiDung = { email: 'nv@b', hoTen: 'NV', vaiTro: 'nhan_vien_quay', chiNhanh: cn, cacChiNhanh: [cn], quyen: quyenCuaVai('nhan_vien_quay') };
      const udNv = new UngDung(ddMoi(), { nguoi: nv, mang: [], mac: async () => null, tuyHaiChieu: NHANH, moCauNoi: cau.mo });
      const soMo = cau.lan.length;
      const eNv = await loiCua(() => udNv.chonDuongCan({ duong: 'day', com: 'COM3', baud: 9600 }));
      const eNvWifi = await loiCua(() => udNv.chonDuongCan({ duong: 'wifi' }));
      ok('NV quầy không đổi được đường nối cân (dây / WiFi) — chỉ quản lý, chủ; không mở dây', !!eNv && !!eNvWifi && /quản lý hoặc chủ/.test(eNv.message)
        && cau.lan.length === soMo, eNv?.message);
      udNv.dongNen();
    }

    console.log('6m4 · 2.10 — giao diện, máy chủ, tài liệu');
    {
      const goc = path.join(import.meta.dir, '..');
      const gd = fs.readFileSync(path.join(goc, 'src/giao-dien.html'), 'utf8');
      const mc = fs.readFileSync(path.join(goc, 'src/may-chu.ts'), 'utf8');
      const rd = fs.readFileSync(path.join(goc, 'README.md'), 'utf8');
      const hd = fs.readFileSync(path.join(goc, 'src/huong-dan.html'), 'utf8');
      ok('Máy chủ: /api/com/duong gọi chonDuongCan (POST như mọi đường khác)', /'\/api\/com\/duong': return json\(\{ ok: true, \.\.\.\(await ud\.chonDuongCan\(/.test(mc));
      ok('Giao diện: nút Dùng dây làm đường chính (hỏi xác nhận, nhắc Prog → 4 → 3) và Về lại WiFi',
        gd.includes('id="nut-duong-day"') && gd.includes('id="nut-duong-wifi"') && /goi\('\/api\/com\/duong', \{ duong: 'day'/.test(gd)
        && /goi\('\/api\/com\/duong', \{ duong: 'wifi' \}\)/.test(gd) && /confirm\(`Dùng dây \$\{c\.com\}/.test(gd));
      ok('Giao diện: ô Cân, câu gửi, câu cài đặt nói đúng đường dây (quaDuong), lúc mở trang không tự hỏi cân qua dây',
        /const quaDuong = \(c\) => c === 'day' \? 'qua dây RS232'/.test(gd) && !/k\.cachGui === 'hai-chieu' \? 'qua cổng hai chiều' : 'qua cổng 33571'/.test(gd)
        && /laDay\(\) \? undefined : kiemTraCan\(\)/.test(gd) && /laDay\(\) \? 'Dây ' \+ ch\.com/.test(gd));
      ok('README và hướng dẫn: dây làm đường chính, phải vào Prog → 4 → 3 mỗi lần, chưa thử đọc / ghi qua dây trên cân thật',
        rd.includes('Dùng dây làm đường chính') && hd.includes('Dùng dây làm đường chính') && /2\.10/.test(rd));
    }
  } finally {
    for (const c of cacCan) await c.dong();
    fs.rmSync(tam, { recursive: true, force: true });
  }
}

/** PowerShell giả cho kịch bản Kiểm tra dây (day-rs232.ts BAT_TAY): cân trả giờ ở bước đọc (bước 1). */
const psBatTay: ChayPs = async () => {
  const b64 = (t: string) => Buffer.from(t, 'latin1').toString('base64');
  return `DONG\t1\t${b64('TIM\t26\t10\t19\t9\t0\t0\t')}\r\nDONG\t1\t${b64('END\tTIM\t')}\r\nOK\t24\r\n`;
};

/** Luồng tới cân giả mở đồng bộ (đang nối) — bắt tay chờ 'connect' qua lần ghi đầu, như dây đã cắm sẵn. */
function noiCanGiaDongBo(can: CanGia): Duplex {
  return net.createConnection({ host: IP, port: can.cong });
}

if (import.meta.main) {
  let dat = 0, hong = 0;
  const ok: Ok = (ten, dk, ct) => { if (dk) { dat++; console.log('  ✓ ' + ten); } else { hong++; console.log('  ✗ ' + ten + (ct ? '\n      ' + ct : '')); } };
  const KHUON = 'PLU\t{1}\t{2}\t\t1\t{5}\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\t{15}\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\tx\t0\t0\t0\t';
  const plu = (so: number, ma: string, gia: string, ten: string) =>
    KHUON.replace('{1}', String(so)).replace('{2}', ma).replace('{5}', gia).replace('{15}', ten);
  const fileCan = (dong: string[]) => new TextEncoder().encode(['ECS\tVER\tV3.14E8\t', '', 'DWL\tPLU\t', ...dong, 'END\tPLU\t', '',
    'DWL\tTMS\t', 'TMS\t0\t28\t', 'TMS\t202\t3\t', 'END\tTMS\t', '', 'END\tECS\t', ''].join('\r\n'));
  await thuDayChinh(ok, { fileCan, plu });
  console.log(hong ? `${hong} KIỂM TRA HỎNG / ${dat + hong}` : `TẤT CẢ ${dat} KIỂM TRA ĐỀU ĐẠT`);
  process.exit(hong ? 1 : 0);
}
