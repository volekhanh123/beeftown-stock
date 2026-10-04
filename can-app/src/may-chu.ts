/**
 * BEEFTOWN CÂN — MÁY CHỦ CỤC BỘ (nút bấm của giao diện → việc trong nghiep-vu.ts)
 *
 * Chỉ nghe 127.0.0.1, và mọi yêu cầu phải mang đúng mã bí mật `ma` trên đường
 * dẫn (?t=…) — trang web lạ mở trên cùng máy không gọi được. Kể cả trang
 * hướng dẫn /huong-dan và các file tải về. Tách khỏi main.ts để kiểm thử được
 * với kho giả.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { exec } from 'node:child_process';
import GIAO_DIEN from './giao-dien.html' with { type: 'text' };
import HUONG_DAN from './huong-dan.html' with { type: 'text' };
import { UngDung, cauLoi } from './nghiep-vu.ts';
import { LoiCapNhat } from './cap-nhat.ts';
import type { SuaO, ThayDoiTem, ThemO } from './tem.ts';

const json = (v: unknown, status = 200) =>
  new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const loi = (e: unknown) => json({ ok: false, loi: cauLoi(e) }, 200);
const html = (chu: string) => new Response(chu, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });

/** Mảng các đối tượng (bỏ phần tử lạ), tối đa `toiDa` phần tử. */
const mangDoiTuong = (v: unknown, toiDa = 200): Record<string, unknown>[] =>
  (Array.isArray(v) ? v : []).filter((x): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)).slice(0, toiDa);
/** Số (hoặc chữ số) người gửi — suaTem tự kiểm khoảng; thứ khác bỏ. */
const soGui = (v: unknown): number | undefined =>
  (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && /^\s*\d{1,6}\s*$/.test(v) ? Number(v) : undefined);

/** Thay đổi tem từ trang: chỉ nhận đúng dạng, bỏ phần thừa. suaTem (tem.ts) kiểm từng giá trị. */
function thayDoiTem(b: Record<string, unknown>): ThayDoiTem {
  const chuoi = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const chu: Record<string, string> = {};
  if (b.chu && typeof b.chu === 'object') for (const [k, v] of Object.entries(b.chu)) if (typeof v === 'string') chu[k] = v;
  const truongSo = ['x', 'y', 'w', 'h', 'font', 'inKhi', 'canh', 'xoay'] as const;
  const sua: SuaO[] = mangDoiTuong(b.sua).map(s => {
    const o: SuaO = { khoa: String(s.khoa ?? '') };
    for (const k of truongSo) { const n = soGui(s[k]); if (n !== undefined) o[k] = n; }
    return o;
  });
  const them: ThemO[] = mangDoiTuong(b.them).map(t => {
    // x, y bắt buộc: gửi nguyên (kể cả sai) để suaTem báo câu rõ ràng.
    const o: ThemO = { mau: String(t.mau ?? ''), x: soGui(t.x) ?? (t.x as number), y: soGui(t.y) ?? (t.y as number) };
    for (const k of ['w', 'h', 'font', 'inKhi', 'canh', 'xoay'] as const) { const n = soGui(t[k]); if (n !== undefined) o[k] = n; }
    if (typeof t.chu === 'string') o.chu = t.chu;
    return o;
  });
  // dau: dấu mẫu tem lúc trang mở — thiếu thì '' (nghiep-vu từ chối: không biết thay đổi này dựa trên mẫu tem nào).
  return { chu, tat: chuoi(b.tat), bat: chuoi(b.bat), ...(sua.length ? { sua } : {}), ...(them.length ? { them } : {}),
           dau: typeof b.dau === 'string' ? b.dau : '' };
}
const docThan = async (req: Request) => { try { return await req.json() as Record<string, unknown>; } catch { return {}; } };

/** Đường được gọi bằng GET (trang, hướng dẫn, file tải về); mọi đường khác chỉ POST. */
const DUOC_GET = new Set(['/', '/huong-dan', '/api/tai-usb', '/api/nhat-ky-can.csv']);

export function moMayChu(ud: UngDung, tuy: {
  ma: string; phienBan: string;
  /** Có yêu cầu từ trang (nhịp) — main.ts dùng để biết cửa sổ còn mở. */
  khiCoNhip: () => void;
  /** Trang báo đóng cửa sổ. */
  khiDong: () => void;
  /**
   * 2.5: bản mới đã vào chỗ — main.ts dừng máy chủ này, mở bản mới, chờ nó trả lời (hỏng thì quay về bản cũ) rồi
   * thoát. Không có (kiểm thử, bun) → /api/cap-nhat từ chối trước khi làm gì.
   */
  khoiDongLai?: (phienBanMoi: string) => void;
}) {
  const MA = tuy.ma;

  const mayChu = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);
      // Chỉ trang của chính chương trình: đúng máy, đúng mã bí mật.
      if (req.headers.get('host') !== `127.0.0.1:${mayChu.port}` || url.searchParams.get('t') !== MA) {
        return new Response('Không được phép', { status: 403 });
      }
      // Bun cắt yêu cầu quá 10 giây — gửi qua dây RS232, dò WiFi tìm cân, kho chậm, cổng hai chiều (chờ tới
      // 60 giây cho hàng rào) có thể lâu hơn.
      mayChu.timeout(req, 0);
      tuy.khiCoNhip();
      const p = url.pathname;
      try {
        if (req.method === 'GET' && p === '/') return html(GIAO_DIEN);
        if (req.method === 'GET' && p === '/huong-dan') return html(HUONG_DAN);
        if (req.method !== 'POST' && !(req.method === 'GET' && DUOC_GET.has(p))) return new Response('Sai cách gọi', { status: 405 });
        switch (p) {
          case '/api/nhip': return json({ ok: true });
          case '/api/dong':
            tuy.khiDong();
            return json({ ok: true });
          case '/api/trang-thai': {
            let nguoi = null, loiKho: string | null = null;
            try { nguoi = await ud.nguoiDung(); } catch (e) { loiKho = cauLoi(e); }
            return json({
              ok: true, phienBan: tuy.phienBan, cauHinh: ud.cauHinh(), nguoi, loiKho,
              goc: ud.thongTinGoc(), soTrenCan: ud.docTrenCan().size, thuMuc: ud.dd.duLieu,
              lanTuGui: ud.lanTuGui,
              // 2.6: lần gửi gần nhất cân chưa xác nhận (đọc lại qua cổng hai chiều không được, hay thấy cân chưa nhận).
              chuaXacNhan: ud.chuaXacNhan(),
              // HSD trên cân tính cho ngày nào (giờ VN), cân có in HSD không, có cũ không — trang báo đỏ khi cũ.
              hsd: ud.hsdTrenCan(),
              capNhat: ud.trangThaiCapNhat(),
            });
          }
          // ---- 2.5: tự cập nhật (cap-nhat.ts) ----
          case '/api/ban-moi': {
            // chiXem: chỉ tiến độ (trang hỏi mỗi giây lúc đang cập nhật), không hỏi mạng. hoiLai: bỏ qua bản nhớ 30 phút.
            const b = await docThan(req);
            if (b.chiXem === true) return json({ ok: true, ...ud.trangThaiCapNhat() });
            return json({ ok: true, ...(await ud.kiemBanMoi(b.hoiLai === true)) });
          }
          case '/api/cap-nhat': {
            if (!tuy.khoiDongLai) throw new LoiCapNhat('Bản này không tự khởi động lại được — cập nhật bằng tay (trang Releases).');
            const kq = await ud.capNhat();
            // Trả lời trang trước, rồi mới dừng máy chủ và mở bản mới.
            const khoiDongLai = tuy.khoiDongLai;
            setTimeout(() => khoiDongLai(kq.phienBan), 500);
            return json({ ok: true, ...kq });
          }
          case '/api/cau-hinh': {
            const b = await docThan(req);
            const ch = ud.luuCauHinh({
              ipCan: b.ipCan as string | undefined, congCan: b.congCan as number | undefined,
              diaChiKho: b.diaChiKho as string | undefined, chiNhanhId: b.chiNhanhId as string | undefined,
              tuGui: typeof b.tuGui === 'boolean' ? b.tuGui : undefined,
              // Ô để trống (null / '') → về mặc định; không gửi ô đó → giữ nguyên.
              congHaiChieu: b.congHaiChieu === undefined ? undefined : b.congHaiChieu === null || b.congHaiChieu === '' ? null : b.congHaiChieu as number,
            });
            return json({ ok: true, cauHinh: ch });
          }
          case '/api/dang-nhap': {
            const b = await docThan(req);
            return json({ ok: true, nguoi: await ud.dangNhap(String(b.email ?? ''), String(b.matKhau ?? '')) });
          }
          case '/api/dang-xuat': await ud.dangXuat(); return json({ ok: true });
          case '/api/file-tu-can': {
            const du = new Uint8Array(await req.arrayBuffer());
            return json({ ok: true, ...ud.ghiNhanFileTuCan(du) });
          }
          case '/api/xem-truoc': {
            const b = await docThan(req);
            return json({ ok: true, ...(await ud.xemTruoc(b.giuHangNgoaiKho === true)) });
          }
          case '/api/gui': {
            const b = await docThan(req);
            return json({ ok: true, ...(await ud.guiXuongCan(b.giuHangNgoaiKho === true)) });
          }
          case '/api/tao-usb': {
            const b = await docThan(req);
            return json({ ok: true, ...(await ud.taoFileUsb(b.giuHangNgoaiKho === true)) });
          }
          // Thân (tuỳ chọn): { thongSo, phim, chuChung } — thay đổi đang sửa trên trang, chưa gửi WiFi, đưa vào file USB.
          case '/api/tao-usb-goc': return json({ ok: true, ...(await ud.taoFileUsbGoc(await docThan(req))) });
          case '/api/tai-usb': {
            if (!fs.existsSync(ud.fileChoUsb)) return new Response('Chưa có file', { status: 404 });
            return new Response(fs.readFileSync(ud.fileChoUsb), { headers: {
              'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename="A_000.TMS"', 'Cache-Control': 'no-store',
            } });
          }
          case '/api/hang': return json({ ok: true, ...(await ud.tatCaHang()) });
          case '/api/tem': return json({ ok: true, ...ud.tem() });
          case '/api/tem/gui': return json({ ok: true, ...(await ud.guiTem(thayDoiTem(await docThan(req)))) });
          case '/api/tem/usb': return json({ ok: true, ...(await ud.taoFileUsbTem(thayDoiTem(await docThan(req)))) });
          case '/api/da-nap-usb': return json({ ok: true, ...ud.daNapUsb() });
          // Ô Cân tự làm mới mỗi phút: chỉ đọc cài đặt, lần tự gửi và ngày tính HSD trên cân (qua nửa đêm thì báo HSD cũ), không gọi kho.
          case '/api/can': return json({ ok: true, cauHinh: ud.cauHinh(), lanTuGui: ud.lanTuGui, hsd: ud.hsdTrenCan() });
          case '/api/thu-can': return json({ ok: true, ...(await ud.thuCan()) });
          case '/api/tim-can': return json({ ok: true, ...(await ud.timCan()) });
          // ---- 2.2: cổng hai chiều 33581 (chưa thử trên cân thật) ----
          case '/api/can/thong-tin': return json({ ok: true, ...(await ud.thongTinCanHaiChieu()) });
          case '/api/can/doc-wifi': return json({ ok: true, ...(await ud.docTuCanQuaWifi()) });
          case '/api/can/xoa-wifi': {
            // dauVan: dấu kế hoạch của lần xem trước — thiếu / không phải chữ thì xoaQuaWifi từ chối, chưa nối cân.
            const b = await docThan(req);
            return json({ ok: true, ...(await ud.xoaQuaWifi(b.giuHangNgoaiKho === true, typeof b.dauVan === 'string' ? b.dauVan : undefined)) });
          }
          // ---- 2.7: gỡ hàng còn nằm lại bằng ghi đè (dòng trống), chẩn đoán WiFi ----
          case '/api/can/go-con-lai': {
            const b = await docThan(req);
            return json({ ok: true, ...(await ud.goHangConLai(b.giuHangNgoaiKho === true, typeof b.dauVan === 'string' ? b.dauVan : undefined)) });
          }
          case '/api/can/chan-doan': return json({ ok: true, ...(await ud.chanDoanWifi(await docThan(req))) });
          case '/api/gio-can': return json({ ok: true, ...(await ud.gioCan()) });
          case '/api/gio-can/chinh': return json({ ok: true, ...(await ud.chinhGioCan(await docThan(req))) });
          // ---- 2.2: thông số, phím tắt (gửi qua 33571 — chưa thử trên cân thật) ----
          case '/api/thong-so': return json({ ok: true, ...(await ud.thongSo()) });
          case '/api/thong-so/gui': return json({ ok: true, ...(await ud.suaThongSo(await docThan(req))) });
          // ---- 2.4: chữ cài đặt chung (TMT; gửi qua 33571 — chưa thử trên cân thật). Không bao giờ có TMT 15, 16, 19. ----
          case '/api/chu-chung': return json({ ok: true, ...(await ud.chuChung()) });
          case '/api/chu-chung/gui': return json({ ok: true, ...(await ud.suaChuChung(await docThan(req))) });
          case '/api/phim': return json({ ok: true, ...(await ud.phim()) });
          case '/api/phim/gui': return json({ ok: true, ...(await ud.suaPhim(await docThan(req))) });
          // ---- 2.2: nhật ký bán của cân ----
          case '/api/nhat-ky-can': return json({ ok: true, ...(await ud.nhatKyCan(await docThan(req))) });
          case '/api/nhat-ky-can.csv': {
            // Tải về bằng đường dẫn (thẻ <a>): lỗi trả chữ thường, không phải JSON.
            try {
              const k = await ud.taiNhatKyCsv({ tu: url.searchParams.get('tu') ?? '', den: url.searchParams.get('den') ?? '' });
              return new Response(k.chu, { headers: {
                'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${k.ten}"`, 'Cache-Control': 'no-store',
              } });
            } catch (e) {
              return new Response(cauLoi(e), { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
            }
          }
          // ---- dây RS232 (thử) ----
          case '/api/com': return json({ ok: true, ...(await ud.dsCom()) });
          case '/api/com/gui': return json({ ok: true, ...(await ud.guiThuQuaDay(await docThan(req))) });
          case '/api/com/kiem': return json({ ok: true, ...(await ud.kiemTraDay(await docThan(req))) });
          // ---- máy quầy (0054) ----
          case '/api/quay': return json({ ok: true, ...(await ud.bangQuay()) });
          case '/api/quay/yeu-cau': return json({ ok: true, ...(await ud.taoYeuCau(await docThan(req))) });
          case '/api/quay/huy': return json({ ok: true, ...(await ud.taoPhieuHuy(await docThan(req))) });
          case '/api/tang-o': return json({ ok: true, ...(await ud.tangVaO()) });
          case '/api/ma-giam': return json({ ok: true, ...(await ud.maGiam()) });
          case '/api/ma-giam/luu': return json({ ok: true, ...(await ud.luuMaGiam(await docThan(req))) });
          case '/api/ma-giam/bat': return json({ ok: true, ...(await ud.batMaGiam(await docThan(req))) });
          case '/api/bao-cao': return json({ ok: true, ...(await ud.baoCao(await docThan(req))) });
          case '/api/mo-thu-muc': {
            const b = await docThan(req);
            const dich = b.cho === 'usb' ? path.dirname(ud.fileChoUsb) : b.cho === 'chan-doan' ? path.join(ud.dd.duLieu, 'chan-doan') : ud.dd.duLieu;
            fs.mkdirSync(dich, { recursive: true });
            if (process.platform === 'win32') exec(`explorer "${dich}"`, { windowsHide: true });
            return json({ ok: true, duongDan: dich });
          }
        }
        return new Response('Không có', { status: 404 });
      } catch (e) {
        return loi(e);
      }
    },
  });
  return mayChu;
}
