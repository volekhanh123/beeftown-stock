/**
 * BEEFTOWN CÂN — MÁY CHỦ CỤC BỘ (nút bấm của giao diện → việc trong nghiep-vu.ts)
 *
 * Chỉ nghe 127.0.0.1, và mọi yêu cầu phải mang đúng mã bí mật `ma` trên đường
 * dẫn (?t=…) — trang web lạ mở trên cùng máy không gọi được. Tách khỏi main.ts
 * để kiểm thử được với kho giả.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { exec } from 'node:child_process';
import GIAO_DIEN from './giao-dien.html' with { type: 'text' };
import { UngDung, cauLoi } from './nghiep-vu.ts';
import type { ThayDoiTem } from './tem.ts';

const json = (v: unknown, status = 200) =>
  new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const loi = (e: unknown) => json({ ok: false, loi: cauLoi(e) }, 200);
/** Thay đổi tem từ trang: chỉ nhận đúng dạng, bỏ phần thừa. */
function thayDoiTem(b: Record<string, unknown>): ThayDoiTem {
  const chuoi = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const chu: Record<string, string> = {};
  if (b.chu && typeof b.chu === 'object') for (const [k, v] of Object.entries(b.chu)) if (typeof v === 'string') chu[k] = v;
  return { chu, tat: chuoi(b.tat), bat: chuoi(b.bat) };
}
const docThan = async (req: Request) => { try { return await req.json() as Record<string, unknown>; } catch { return {}; } };

export function moMayChu(ud: UngDung, tuy: {
  ma: string; phienBan: string;
  /** Có yêu cầu từ trang (nhịp) — main.ts dùng để biết cửa sổ còn mở. */
  khiCoNhip: () => void;
  /** Trang báo đóng cửa sổ. */
  khiDong: () => void;
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
      tuy.khiCoNhip();
      const p = url.pathname;
      try {
        if (req.method === 'GET' && p === '/') {
          return new Response(GIAO_DIEN, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
        }
        if (req.method !== 'POST' && p !== '/api/tai-usb') return new Response('Sai cách gọi', { status: 405 });
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
            });
          }
          case '/api/cau-hinh': {
            const b = await docThan(req);
            const ch = ud.luuCauHinh({
              ipCan: b.ipCan as string | undefined, congCan: b.congCan as number | undefined,
              diaChiKho: b.diaChiKho as string | undefined, chiNhanhId: b.chiNhanhId as string | undefined,
              tuGui: typeof b.tuGui === 'boolean' ? b.tuGui : undefined,
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
          case '/api/tai-usb': {
            if (!fs.existsSync(ud.fileChoUsb)) return new Response('Chưa có file', { status: 404 });
            return new Response(fs.readFileSync(ud.fileChoUsb), { headers: {
              'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename="A_000.TMS"', 'Cache-Control': 'no-store',
            } });
          }
          case '/api/hang': return json({ ok: true, ...(await ud.tatCaHang()) });
          case '/api/tem': return json({ ok: true, ...ud.tem() });
          case '/api/tem/gui': return json({ ok: true, ...(await ud.guiTem(thayDoiTem(await docThan(req)))) });
          case '/api/tem/usb': return json({ ok: true, ...ud.taoFileUsbTem(thayDoiTem(await docThan(req))) });
          case '/api/da-nap-usb': return json({ ok: true, ...ud.daNapUsb() });
          case '/api/thu-can': return json({ ok: true, thongCan: await ud.thuCan() });
          case '/api/mo-thu-muc': {
            const b = await docThan(req);
            const dich = b.cho === 'usb' ? path.dirname(ud.fileChoUsb) : ud.dd.duLieu;
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
