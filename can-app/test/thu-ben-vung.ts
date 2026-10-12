/**
 * Kiểm thử Beeftown Cân 2.9.1 — bền vững khi mạng internet hay máy tính trục trặc, không cần cân thật, không cần kho thật:
 *   - kho (internet) treo không giữ hàng đợi việc với cân: tự gửi đọc kho ngoài hàng đợi (lần đọc cũ không đè lần gửi mới
 *     hơn), bấm Gửi đọc kho có hạn (HAN_DOC_KHO_MS); mỗi yêu cầu tới kho có hạn, huỷ hẳn không thử lại (fetchCoHan); mất
 *     mạng nói đúng là mất mạng (đăng nhập, người đăng nhập); kiểm quyền lúc kho không trả lời theo người biết gần nhất;
 *   - ghi đè file an toàn (ghiFileAnToan): mất điện / đầy ổ giữa lúc ghi file gốc A_000.TMS, tren-can.tsv, cau-hinh.json
 *     không để lại file dở — file cũ còn nguyên, chương trình vẫn gửi được.
 *
 *     cd can-app && npx bun test/thu-ben-vung.ts
 *
 * test/thu.ts gọi `thuBenVung(ok, …)`.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { UngDung, cauLoi, fetchCoHan, ghiFileAnToan, type DanhMucKho, type VietByte } from '../src/nghiep-vu.ts';
import { docFileCan, type HangKho } from '../../web/src/lib/kho/can-tma.ts';
import { chuoiByte, moCanGia } from './can-gia-hai-chieu.ts';

type Ok = (ten: string, dieuKien: boolean, chiTiet?: string) => void;
interface TroGiup { fileCan: (dong: string[]) => Uint8Array; plu: (so: number, ma: string, gia: string, ten: string) => string }

const nghi = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
/** Chờ `p` tối đa `ms`: xong → { kq } / { loi }; quá hạn → 'van-cho' (việc còn treo). */
async function choToiDa<T>(p: Promise<T>, ms: number): Promise<{ kq: T } | { loi: Error } | 'van-cho'> {
  let hen: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      p.then(kq => ({ kq }), (loi: Error) => ({ loi })),
      new Promise<'van-cho'>(r => { hen = setTimeout(() => r('van-cho'), ms); }),
    ]);
  } finally { clearTimeout(hen); }
}
const hang = (ma: string, ma_can: string, ten: string, gia: number): HangKho => ({ ma, ma_can, ten, gia_ban_kg: gia, dang_dung: true });
/** fetch giả của mạng treo: không bao giờ trả lời, chỉ dừng khi bị huỷ (như fetch thật). */
const fetchTreo = ((_: unknown, init?: RequestInit) => new Promise<Response>((_xong, hong) => {
  const s = init?.signal;
  if (s?.aborted) { hong(s.reason); return; }
  s?.addEventListener('abort', () => hong(s.reason), { once: true });
})) as unknown as typeof fetch;

/** Phiên đăng nhập giả còn hạn 1 giờ (dạng auth-js lưu trong phien.json). */
const phienGia = () => ({
  access_token: 'thu.thu.thu', refresh_token: 'thu', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'nv@beeftown.vn',
          app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
});
type CheDoKho = 'tot' | 'treo' | 'hong';
/**
 * Kho giả nói như Supabase cho client thật: đăng nhập (/auth/v1/token), nhan_su (NV quầy), chi_nhanh. `cheDo`: mọi yêu cầu;
 * `cheDoBang`: chỉ yêu cầu bảng (/rest/v1/) — treo (chỉ dừng khi bị huỷ) hay hỏng ngay (mất mạng). Ghi lại mọi lần gọi.
 */
function khoGiaSupabase() {
  const kho = { cheDo: 'tot' as CheDoKho, cheDoBang: 'tot' as CheDoKho, goi: [] as string[], f: null as unknown as typeof fetch };
  const json = (v: unknown) => new Response(JSON.stringify(v), { status: 200, headers: { 'content-type': 'application/json' } });
  kho.f = (async (dau: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = typeof dau === 'string' ? dau : dau instanceof URL ? dau.href : dau.url;
    kho.goi.push(`${init?.method ?? 'GET'} ${new URL(url).pathname}`);
    const cheDo = url.includes('/rest/v1/') && kho.cheDo === 'tot' ? kho.cheDoBang : kho.cheDo;
    if (cheDo === 'treo') return fetchTreo(dau, init);
    if (cheDo === 'hong') throw new TypeError('fetch failed');
    if (url.includes('/auth/v1/token')) return json(phienGia());
    if (url.includes('/auth/v1/logout')) return new Response(null, { status: 204 });
    if (url.includes('/rest/v1/nhan_su')) return json([{ id: 'ns1', ho_ten: 'NV thử', vai_tro: 'nhan_vien_quay', chi_nhanh_id: 'cn1' }]);
    if (url.includes('/rest/v1/chi_nhanh')) return json([{ id: 'cn1', ma: 'Q1', ten: 'Quầy thử' }]);
    return new Response('{}', { status: 404, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;
  return kho;
}

export async function thuBenVung(ok: Ok, h: TroGiup): Promise<void> {
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'beeftown-can-ben-vung-'));
  const can = await moCanGia({ du: { phan: { PLU: [chuoiByte(h.plu(1, '10001', '845,0', 'Lõi vai bò Mỹ'))], TMS: ['TMS\t0\t28\t', 'TMS\t202\t3\t'] } } });
  const NHANH = { choMs: 1500, choNoiMs: 1000, choHangRaoMs: 1500, nghiBaoCaoMs: 1 };
  let soThuMuc = 0;
  const ddMoi = () => { soThuMuc++; return { cauHinh: path.join(tam, `appdata${soThuMuc}`), duLieu: path.join(tam, `tai-lieu${soThuMuc}`) }; };
  const fileGoc = h.fileCan([h.plu(1, '10001', '845,0', 'Lõi vai bò Mỹ')]);
  const danhMuc: DanhMucKho = { mauMaVach: '2XCCCCCWWWWWK', matHang: [hang('LOI-VAI', '10001', 'Lõi vai bò Mỹ', 850000)] };
  try {
    console.log('6k1 · 2.9.1 — kho (internet) treo không giữ hàng đợi việc với cân');
    {
      // Kho không bao giờ trả lời (mạng treo). Tự gửi đọc kho NGOÀI hàng đợi việc với cân (motLuc); bấm Gửi đọc trong hàng
      // đợi nhưng có hạn (HAN_DOC_KHO_MS).
      const traKho: ((dm: DanhMucKho) => void)[] = [];
      const ud = new UngDung(ddMoi(), {
        danhMuc: () => new Promise<DanhMucKho>(r => { traKho.push(r); }), hanKhoMs: 1500,
        mang: [], mac: async () => null, tuyHaiChieu: NHANH, choXacNhanMs: [0],
      });
      ud.luuCauHinh({ ipCan: '127.0.0.1', congCan: 1, congHaiChieu: can.cong });
      ud.ghiNhanFileTuCan(fileGoc);
      const soKhoi = can.khoi.length;
      const t0 = Date.now();
      const tuGui = choToiDa(ud.tuGuiMotLan(), 5000);
      await nghi(20);
      const gio = await choToiDa(ud.gioCan(), 5000);
      const msGio = Date.now() - t0;
      const lan = await tuGui;
      ok('HỒI QUY: tự gửi đang chờ kho (mạng treo) → nút Đọc giờ cân chạy ngay, không chờ kho (tự gửi đọc kho ngoài hàng đợi)',
        gio !== 'van-cho' && 'kq' in gio && gio.kq.gio.nam === 2026 && msGio < 1000, `${JSON.stringify(gio)} ${msGio} ms`);
      ok('HỒI QUY: kho không trả lời → tự gửi thôi chờ sau hạn đọc kho, báo rõ, không gửi gì xuống cân',
        lan !== 'van-cho' && 'kq' in lan && lan.kq.hong === true && !lan.kq.daGui && /Kho không trả lời sau 1,5 giây/.test(lan.kq.cau)
        && /chưa gửi gì xuống cân/.test(lan.kq.cau) && can.khoi.length === soKhoi, JSON.stringify(lan));
      const gui = await choToiDa(ud.guiXuongCan(), 5000);
      ok('HỒI QUY: bấm Gửi xuống cân lúc kho treo → báo kho không trả lời sau hạn (không treo trang), không gửi gì',
        gui !== 'van-cho' && 'loi' in gui && /Kho không trả lời/.test(gui.loi.message) && can.khoi.length === soKhoi,
        gui === 'van-cho' ? 'vẫn chờ' : JSON.stringify('loi' in gui ? gui.loi.message : gui.kq));
      const truoc = fs.readFileSync(ud.fileGoc);
      for (const tra of traKho) tra(danhMuc);
      await nghi(100);
      ok('Kho trả lời muộn sau hạn (cả hai lượt: tự gửi, bấm Gửi) → các lượt đã thôi không gửi gì, file gốc không đổi',
        traKho.length === 2 && can.khoi.length === soKhoi && Buffer.compare(truoc, fs.readFileSync(ud.fileGoc)) === 0, String(traKho.length));
      ud.dongNen();
    }
    {
      // Tự gửi đọc kho ngoài hàng đợi: trong lúc nó đọc (giá cũ 850.000), người bấm Gửi với giá mới (870.000) — tự gửi không
      // được đem lần đọc cũ đè giá mới lên cân.
      let traCu: ((dm: DanhMucKho) => void) | null = null;
      let lanDoc = 0;
      const giaMoi: DanhMucKho = { mauMaVach: '2XCCCCCWWWWWK', matHang: [hang('LOI-VAI', '10001', 'Lõi vai bò Mỹ', 870000)] };
      const ud = new UngDung(ddMoi(), {
        danhMuc: () => (++lanDoc === 1 ? new Promise<DanhMucKho>(r => { traCu = r; }) : Promise.resolve(giaMoi)),
        mang: [], mac: async () => null, tuyHaiChieu: NHANH, choXacNhanMs: [0],
      });
      ud.luuCauHinh({ ipCan: '127.0.0.1', congCan: 1, congHaiChieu: can.cong });
      ud.ghiNhanFileTuCan(fileGoc);
      const tuGui = ud.tuGuiMotLan();
      await nghi(20);
      const k = await ud.guiXuongCan();
      const giaSauBam = ud.docTrenCan().get(1)?.gia;
      const soKhoi = can.khoi.length;
      (traCu as ((dm: DanhMucKho) => void) | null)?.(danhMuc);
      const lan = await tuGui;
      ok('HỒI QUY: tự gửi đọc kho xong SAU một lần bấm Gửi (giá mới) → không gửi lần đọc cũ, giá mới giữ trên cân; lượt sau đọc lại',
        k.xacNhan && !lan.daGui && !lan.hong && /Vừa có lần gửi khác/.test(lan.cau) && can.khoi.length === soKhoi
        && ud.docTrenCan().get(1)?.gia === giaSauBam && (can.du.phan.PLU ?? []).some(d => d.split('\t')[5] === giaSauBam),
        `${JSON.stringify(lan)} ${giaSauBam}`);
      const lan2 = await ud.tuGuiMotLan();
      ok('… lượt tự gửi sau đọc kho mới: cân đã khớp kho, không gửi gì', !lan2.daGui && /khớp kho/.test(lan2.cau) && can.khoi.length === soKhoi,
        JSON.stringify(lan2));
      ud.dongNen();
    }
    {
      // Kho trả lời kịp: vẫn gửi như trước (hạn không cắt lần đọc bình thường).
      const ud = new UngDung(ddMoi(), {
        danhMuc: async () => { await nghi(50); return danhMuc; }, hanKhoMs: 2000,
        mang: [], mac: async () => null, tuyHaiChieu: NHANH, choXacNhanMs: [0],
      });
      ud.luuCauHinh({ ipCan: '127.0.0.1', congCan: 1, congHaiChieu: can.cong });
      ud.ghiNhanFileTuCan(fileGoc);
      const lan = await ud.tuGuiMotLan();
      ok('Kho trả lời trong hạn → tự gửi như trước: cân nhận qua cổng hai chiều, đọc lại khớp',
        lan.daGui && /cân đã nhận \(đọc lại khớp\)/.test(lan.cau), JSON.stringify(lan));
      ud.dongNen();
    }

    console.log('6k2 · 2.9.1 — mỗi yêu cầu tới kho có hạn; người đăng nhập khi mất mạng; câu lỗi');
    {
      const t0 = Date.now();
      const e = await choToiDa(fetchCoHan(fetchTreo, 150, 5000)('https://kho.thu/rest/v1/kho_mat_hang'), 3000);
      ok('fetchCoHan: yêu cầu đọc treo → huỷ sau hạn (150 ms) bằng lỗi AbortError có chữ "network timeout", không chờ 5–6 phút',
        e !== 'van-cho' && 'loi' in e && e.loi.name === 'AbortError' && /network timeout/.test(e.loi.message) && Date.now() - t0 < 1500,
        `${e === 'van-cho' ? e : 'loi' in e ? `${e.loi.name}: ${e.loi.message}` : ''} ${Date.now() - t0} ms`);
      const hanCua = async (url: string, init?: RequestInit) => {
        const t = Date.now();
        await choToiDa(fetchCoHan(fetchTreo, 150, 600)(url, init), 3000);
        return Date.now() - t;
      };
      const [msAnh, msHam, msDangNhap] = await Promise.all([
        hanCua('https://kho.thu/storage/v1/object/anh/x.jpg', { method: 'POST' }),
        hanCua('https://kho.thu/rest/v1/rpc/kho_bao_cao_ban_gio', { method: 'POST' }),
        hanCua('https://kho.thu/auth/v1/token?grant_type=password', { method: 'POST' }),
      ]);
      ok('fetchCoHan: tải ảnh, gọi hàm kho (báo cáo, ghi) có hạn dài; đăng nhập theo hạn đọc',
        msAnh >= 500 && msAnh < 2000 && msHam >= 500 && msHam < 2000 && msDangNhap < 450, `${msAnh} · ${msHam} · ${msDangNhap} ms`);
      const ac = new AbortController();
      const huy = choToiDa(fetchCoHan(fetchTreo, 5000, 5000)('https://kho.thu/rest/v1/x', { signal: ac.signal }), 3000);
      ac.abort(new Error('người gọi huỷ'));
      const kqHuy = await huy;
      const ac2 = new AbortController();
      const huy2 = choToiDa(fetchCoHan(fetchTreo, 5000, 5000)(new Request('https://kho.thu/rest/v1/x', { signal: ac2.signal })), 3000);
      ac2.abort(new Error('huỷ theo Request'));
      const kqHuy2 = await huy2;
      ok('fetchCoHan: người gọi huỷ (tín hiệu trong init, hay của Request) → vẫn huỷ ngay',
        kqHuy !== 'van-cho' && 'loi' in kqHuy && kqHuy.loi.message === 'người gọi huỷ'
        && kqHuy2 !== 'van-cho' && 'loi' in kqHuy2 && kqHuy2.loi.message === 'huỷ theo Request', JSON.stringify([kqHuy, kqHuy2]));
      let nhan: RequestInit | undefined;
      const r = await fetchCoHan((async (_: unknown, init?: RequestInit) => { nhan = init; return new Response('ok'); }) as unknown as typeof fetch, 1000, 1000)(
        'https://kho.thu/rest/v1/x', { method: 'POST', headers: { a: 'b' }, body: '{}' });
      ok('fetchCoHan: kho trả lời kịp → trả nguyên câu trả lời, giữ nguyên cách gọi (method, headers, body)',
        await r.text() === 'ok' && nhan?.method === 'POST' && (nhan.headers as Record<string, string>).a === 'b' && nhan.body === '{}' && !!nhan.signal);
    }
    {
      // Chương trình thật (client Supabase) với kho giả: đăng nhập, nhan_su, chi_nhanh; chuyển được sang treo / hỏng mạng.
      const kho = khoGiaSupabase();
      const dd = ddMoi();
      fs.mkdirSync(dd.cauHinh, { recursive: true });
      fs.writeFileSync(path.join(dd.cauHinh, 'cau-hinh.json'), JSON.stringify({ ipCan: '127.0.0.1', congCan: 1, congHaiChieu: can.cong,
        diaChiKho: 'http://127.0.0.1:1', supabaseUrl: 'http://127.0.0.1:1', anonKey: 'khoa-thu' }));
      const ud = new UngDung(dd, { fetch: kho.f, hanYeuCauKhoMs: 200, hanHoiQuyenMs: 300, mang: [], mac: async () => null, tuyHaiChieu: NHANH });

      kho.cheDo = 'treo';
      const t2 = Date.now();
      const dn = await choToiDa(ud.dangNhap('thu@beeftown.vn', 'mat-khau-thu'), 5000);
      ok('HỒI QUY: đăng nhập lúc mạng treo → thôi chờ sau hạn, nói mất mạng / không nối được kho (không nói sai mật khẩu)',
        dn !== 'van-cho' && 'loi' in dn && /không nối được kho/.test(dn.loi.message) && !/Sai email/.test(dn.loi.message) && Date.now() - t2 < 4000,
        dn === 'van-cho' ? 'vẫn chờ' : JSON.stringify('loi' in dn ? dn.loi.message : dn.kq));

      kho.cheDo = 'tot';
      kho.cheDoBang = 'hong';
      const dn2 = await choToiDa(ud.dangNhap('thu@beeftown.vn', 'mat-khau-thu'), 5000);
      ok('HỒI QUY: đăng nhập được mà đọc nhân sự hỏng mạng → báo mất mạng, GIỮ phiên (không đăng xuất, không nói "không phải nhân viên kho")',
        dn2 !== 'van-cho' && 'loi' in dn2 && /không nối được kho/.test(dn2.loi.message) && !/không phải nhân viên/.test(dn2.loi.message)
        && fs.readFileSync(ud.filePhien, 'utf8').includes('access_token'), dn2 === 'van-cho' ? 'vẫn chờ' : JSON.stringify('loi' in dn2 ? dn2.loi.message : dn2.kq));
      const nd0 = await choToiDa(ud.nguoiDung(), 3000);
      ok('HỒI QUY: người đăng nhập lúc mất mạng → ném lỗi mất mạng (không trả "chưa đăng nhập") — tự gửi không bảo đăng nhập lại oan',
        nd0 !== 'van-cho' && 'loi' in nd0 && /không nối được kho/.test(nd0.loi.message), JSON.stringify(nd0));

      kho.cheDoBang = 'tot';
      const nd = await ud.nguoiDung();
      ok('Kho giả trả lời: người đăng nhập là NV quầy', nd?.vaiTro === 'nhan_vien_quay' && nd.chiNhanh?.id === 'cn1', JSON.stringify(nd));

      kho.cheDoBang = 'treo';
      const truocGoi = kho.goi.filter(g => g.includes('/rest/v1/nhan_su')).length;
      const t3 = Date.now();
      const nd2 = await choToiDa(ud.nguoiDung(), 5000);
      ok('HỒI QUY: đọc nhân sự treo → huỷ sau hạn đọc, MỘT lần gọi (thư viện kho không thử lại 3 lần nữa — mỗi lần một hạn)',
        nd2 !== 'van-cho' && 'loi' in nd2 && Date.now() - t3 < 1500 && kho.goi.filter(g => g.includes('/rest/v1/nhan_su')).length === truocGoi + 1,
        `${Date.now() - t3} ms, ${kho.goi.filter(g => g.includes('/rest/v1/nhan_su')).length - truocGoi} lần gọi`);
      const tc = await choToiDa(ud.gioCan(), 4000);
      ok('HỒI QUY: kho không trả lời kịp khi kiểm quyền → theo người đọc được lần gần nhất: NV quầy vẫn bị từ chối (không mở cho mọi vai)',
        tc !== 'van-cho' && 'loi' in tc && /chỉ dành cho quản lý hoặc chủ/.test(tc.loi.message), JSON.stringify(tc));
      await ud.dangXuat();
      const tc2 = await choToiDa(ud.gioCan(), 4000);
      ok('… đăng xuất (quên người cũ) rồi mạng treo → như chưa đăng nhập: Đọc giờ cân chạy (máy quầy không kho vẫn dùng được cân)',
        tc2 !== 'van-cho' && 'kq' in tc2 && tc2.kq.gio.nam === 2026, JSON.stringify(tc2));
      ud.dongNen();
    }
    {
      // Đã đăng nhập (phiên còn hạn trong phien.json) nhưng chương trình vừa mở, chưa đọc được người đăng nhập lần nào, mà mạng
      // treo: hỏi có hạn ngắn, quá hạn coi như chưa đăng nhập (như mất mạng, xem kiemQuyenCan) rồi làm việc với cân.
      const dd = ddMoi();
      fs.mkdirSync(dd.cauHinh, { recursive: true });
      fs.writeFileSync(path.join(dd.cauHinh, 'cau-hinh.json'), JSON.stringify({ ipCan: '127.0.0.1', congCan: 1, congHaiChieu: can.cong,
        diaChiKho: 'http://127.0.0.1:1', supabaseUrl: 'http://127.0.0.1:1', anonKey: 'khoa-thu' }));
      fs.writeFileSync(path.join(dd.cauHinh, 'phien.json'), JSON.stringify({ 'sb-127-auth-token': JSON.stringify(phienGia()) }));
      const ud = new UngDung(dd, { fetch: fetchTreo, hanYeuCauKhoMs: 5000, hanHoiQuyenMs: 300, mang: [], mac: async () => null, tuyHaiChieu: NHANH });
      const t0 = Date.now();
      const gio = await choToiDa(ud.gioCan(), 4000);
      ok('HỒI QUY: vừa mở chương trình, mạng internet treo → nút Đọc giờ cân vẫn chạy sau hạn hỏi quyền ngắn, không chờ kho',
        gio !== 'van-cho' && 'kq' in gio && gio.kq.gio.nam === 2026 && Date.now() - t0 < 3000,
        `${gio === 'van-cho' ? 'vẫn chờ' : JSON.stringify(gio)} ${Date.now() - t0} ms`);
      ud.dongNen();
    }
    ok('HỒI QUY: lỗi kho dạng đối tượng (PostgREST: { message }) lúc mất mạng → câu mất mạng, không ra "[object Object]"',
      cauLoi({ message: 'TypeError: fetch failed', details: '', hint: '', code: '' }) === 'Mất kết nối mạng. Kiểm tra internet rồi thử lại.'
      && cauLoi({ message: 'TimeoutError: The operation timed out.' }) === 'Mất kết nối mạng. Kiểm tra internet rồi thử lại.'
      && cauLoi({ message: 'loi la' }) === 'Có lỗi: loi la' && cauLoi({}) === 'Có lỗi (không rõ chi tiết).',
      cauLoi({ message: 'TypeError: fetch failed' }));
    // Bun (chính BeeftownCan.exe) báo nối không được bằng câu khác Node: kiểm thử giả lỗi bằng câu của Node nên trước
    // đây đạt, còn máy quầy thật hiện "Có lỗi: TypeError: Unable to connect…".
    const cauBun = cauLoi({ message: 'TypeError: Unable to connect. Is the computer able to access the url?' });
    ok('HỒI QUY: câu mất mạng của Bun ("Unable to connect…") → câu mất mạng tiếng Việt',
      cauBun === 'Mất kết nối mạng. Kiểm tra internet rồi thử lại.', cauBun);

    console.log('6k3 · 2.9.1 — ghi đè file an toàn: mất điện / đầy ổ giữa lúc ghi không để file dở');
    {
      // Giả ổ đĩa hỏng giữa chừng: ghi được nửa số byte rồi lỗi (đầy ổ; mất điện thì như vậy mà không có lỗi).
      const dangHong = new Set<string>();
      const hongNua: VietByte = (duongDan, du) => {
        const ten = path.basename(duongDan);
        if (![...dangHong].some(t => ten.startsWith(t))) { fs.writeFileSync(duongDan, du); return; }
        fs.writeFileSync(duongDan, du.subarray(0, du.length >> 1));
        throw Object.assign(new Error(`ENOSPC: no space left on device, write '${ten}'`), { code: 'ENOSPC' });
      };
      const f = path.join(tam, 'thu-ghi.txt');
      fs.writeFileSync(f, 'bản cũ đầy đủ');
      dangHong.add('thu-ghi.txt');
      let loiGhi: unknown = null;
      try { ghiFileAnToan(f, 'bản mới dài hơn bản cũ nhiều', hongNua); } catch (e) { loiGhi = e; }
      ok('ghiFileAnToan: ổ hỏng giữa chừng → ném lỗi, file cũ còn nguyên, không còn file tạm',
        loiGhi !== null && fs.readFileSync(f, 'utf8') === 'bản cũ đầy đủ' && fs.readdirSync(tam).filter(t => t.startsWith('thu-ghi')).join() === 'thu-ghi.txt',
        fs.readdirSync(tam).join());
      dangHong.clear();
      ghiFileAnToan(f, 'bản mới', hongNua);
      ghiFileAnToan(path.join(tam, 'chua-co', 'moi.txt'), new Uint8Array([1, 2, 3]));
      ok('ghiFileAnToan: ghi được → file mới đủ, không còn file tạm; thư mục chưa có thì tạo',
        fs.readFileSync(f, 'utf8') === 'bản mới' && !fs.existsSync(f + '.tam')
        && Buffer.compare(fs.readFileSync(path.join(tam, 'chua-co', 'moi.txt')), Buffer.from([1, 2, 3])) === 0);

      const ud = new UngDung(ddMoi(), { danhMuc: async () => danhMuc, vietByte: hongNua, mang: [], mac: async () => null, tuyHaiChieu: NHANH,
        choXacNhanMs: [0] });
      ud.luuCauHinh({ ipCan: '127.0.0.1', congCan: 1, congHaiChieu: can.cong, tuGui: true });
      ud.ghiNhanFileTuCan(fileGoc);
      const gocCu = fs.readFileSync(ud.fileGoc);
      const trenCanCu = fs.readFileSync(ud.fileTrenCan);
      const fileMoi = h.fileCan([h.plu(1, '10001', '845,0', 'Lõi vai bò Mỹ'), h.plu(2, '10002', '876,0', 'Sườn bò'), h.plu(3, '10003', '695,0', 'Gầu bò')]);

      dangHong.add('A_000.TMS');
      let loiGoc: unknown = null;
      try { ud.ghiNhanFileTuCan(fileMoi); } catch (e) { loiGoc = e; }
      let docDuoc = false;
      try { docDuoc = docFileCan(new Uint8Array(fs.readFileSync(ud.fileGoc))).plu.length === 1; } catch { /* file dở */ }
      ok('HỒI QUY: đầy ổ / mất điện giữa lúc ghi file gốc A_000.TMS → file gốc cũ còn nguyên (đọc được, đủ hàng), không còn file tạm',
        loiGoc !== null && docDuoc && Buffer.compare(gocCu, fs.readFileSync(ud.fileGoc)) === 0
        && !fs.readdirSync(path.dirname(ud.fileGoc)).some(t => t.endsWith('.tam')), `${String(loiGoc)} ${fs.readFileSync(ud.fileGoc).length} byte`);
      ok('… tren-can.tsv ghi TRƯỚC file gốc: đã có 3 hàng của file mới — hàng có thể đang trên cân không bị quên (thừa thì chỉ thêm cảnh báo)',
        Buffer.compare(trenCanCu, fs.readFileSync(ud.fileTrenCan)) !== 0 && ud.docTrenCan().size === 3, String(ud.docTrenCan().size));
      dangHong.clear();

      const trenCanTruoc = fs.readFileSync(ud.fileTrenCan);
      const gocTruoc = fs.readFileSync(ud.fileGoc);
      dangHong.add('tren-can.tsv');
      let loiTren: unknown = null;
      try { ud.ghiNhanFileTuCan(h.fileCan([h.plu(1, '10001', '845,0', 'Lõi vai bò Mỹ')])); } catch (e) { loiTren = e; }
      ok('HỒI QUY: … giữa lúc ghi tren-can.tsv → tren-can.tsv cũ còn nguyên, file gốc chưa bị đổi (dừng trước khi ghi file gốc)',
        loiTren !== null && Buffer.compare(trenCanTruoc, fs.readFileSync(ud.fileTrenCan)) === 0 && Buffer.compare(gocTruoc, fs.readFileSync(ud.fileGoc)) === 0,
        String(ud.docTrenCan().size));
      dangHong.clear();

      dangHong.add('cau-hinh.json');
      try { ud.luuCauHinh({ ipCan: '127.0.0.9' }); } catch { /* lỗi ổ */ }
      const ch = ud.cauHinh();
      ok('HỒI QUY: … giữa lúc ghi cau-hinh.json → cài đặt cũ còn nguyên (địa chỉ cân, cổng hai chiều, tự gửi bật) — không âm thầm về mặc định',
        ch.ipCan === '127.0.0.1' && ch.congHaiChieu === can.cong && ch.tuGui === true, JSON.stringify(ch));
      dangHong.clear();

      // Ổ lành lại: gửi xuống cân được như thường.
      const k = await ud.guiXuongCan();
      ok('Sau lần ghi hỏng, ổ lành lại → gửi xuống cân được, đọc lại khớp; file gốc mới đọc được',
        k.xacNhan && docFileCan(new Uint8Array(fs.readFileSync(ud.fileGoc))).plu.length >= 1, JSON.stringify(k));
      ud.dongNen();
    }
  } finally {
    await can.dong();
    fs.rmSync(tam, { recursive: true, force: true });
  }
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
    await thuBenVung(ok, { fileCan, plu });
  } catch (e) {
    hong++;
    console.log(`  ✗ Kiểm thử dừng giữa chừng: ${(e as Error)?.stack ?? e}`);
  }
  console.log(hong === 0 ? `\nTẤT CẢ ${dat} KIỂM TRA BỀN VỮNG ĐỀU ĐẠT` : `\n${hong} KIỂM TRA HỎNG / ${dat + hong}`);
  process.exit(hong === 0 ? 0 : 1);
}
