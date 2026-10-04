/**
 * Kiểm thử Beeftown Cân 2.9 — báo về kho (bao-kho.ts, migration 0061). Kho giả ghi lại mọi lần gọi; không cần cân thật.
 *   · hàm thuần: dấu vân tay ô đang giao, nhãn phím, dòng trên cân, chọn dòng nhật ký tem;
 *   · NV quầy tự gửi được (danh mục cho vai xem), gửi tay / xem trước vẫn chỉ quản lý;
 *   · hỏi kho 15 giây: đổi ô → tự gửi ngay; mất mạng → không gì;
 *   · báo kho mỗi phút: mã máy giữ nguyên, dòng trên cân chỉ gửi khi đổi (hay 10 phút), lệch / tự gửi hỏng, nhật ký tem
 *     từ mốc — mốc chỉ tiến khi kho trả lời, mất mạng không bao giờ "đã báo".
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { UngDung, quyenCuaVai, type DanhMucKho, type KhoTruyCap, type NguoiDung } from '../src/nghiep-vu.ts';
import { chonNhatKyGui, dongTrenCanBao, nhanPhim, vanTayGiaoO } from '../src/bao-kho.ts';
import { ghiKhoNhatKy, type DongBanCan } from '../src/bao-cao-can.ts';
import type { PhimXem } from '../src/thong-so.ts';
import type { HangKho } from '../../web/src/lib/kho/can-tma.ts';

type Ok = (ten: string, dieuKien: boolean, chiTiet?: string) => void;

const dongNk = (sua: Partial<DongBanCan>): DongBanCan => ({
  mac: 'A1B2C3D4E5F6', fid: 1, luc: '2026-10-04 09:00:00', sid: 1, stt: 1, plu: 6, ten: 'Steak Ribeye Angus #0142', maCan: '10071',
  loai: 0, tenLoai: 'Bán', tinhKho: true, soLuong: 0.5, theoCai: false, donGia: 1350000, thanhTien: 675000, ...sua,
});

export async function thuBaoKho(ok: Ok, h: { fileCan: (dong: string[]) => Uint8Array; plu: (so: number, ma: string, gia: string, ten: string) => string }) {
  console.log('6f · 2.9 — Beeftown Cân báo về kho (0061)');

  // ---- Hàm thuần -------------------------------------------------------------
  const o = (id: string, tang: number | null, giu = true) => ({ o_ma_id: id, so_tang: tang, con_giu: giu, han_dung: '2026-10-08', lo_id: null, lo_vao_id: 'lv' });
  const v1 = vanTayGiaoO([o('o1', 142), o('o2', 150)]);
  ok('Vân tay ô: không phụ thuộc thứ tự dòng', v1 === vanTayGiaoO([o('o2', 150), o('o1', 142)]) && v1 !== '');
  ok('Vân tay ô: tảng khác giữ ô / hết giữ → khác', v1 !== vanTayGiaoO([o('o1', 143), o('o2', 150)]) && v1 !== vanTayGiaoO([o('o1', 142, false), o('o2', 150)]));
  ok('Vân tay ô: dữ liệu lạ → chuỗi rỗng, không ném', vanTayGiaoO(null) === '' && vanTayGiaoO([null, 3]) === '');
  ok('Nhãn phím: tầng 1 "E", tầng 2 "Shift E", tầng 3 "E (tầng 3)"',
    nhanPhim({ trang: 0, nhan: 'E' }) === 'E' && nhanPhim({ trang: 1, nhan: 'E' }) === 'Shift E' && nhanPhim({ trang: 2, nhan: 'E' }) === 'E (tầng 3)');
  const phim: PhimXem[] = [{ trang: 0, phim: 5, nhan: 'E', plu: 6, suaDuoc: true }, { trang: 1, phim: 1, nhan: 'A', plu: 6, suaDuoc: true },
                           { trang: 0, phim: 2, nhan: 'B', plu: 0, suaDuoc: true }, { trang: 0, phim: 3, nhan: 'C', plu: -3, suaDuoc: false }];
  const tren = dongTrenCanBao([{ so: 7, ma: '10072', ten: 'B' }, { so: 6, ma: '10071', ten: 'A #0142' }, { so: 9999, ma: '9999', ten: 'Thử' },
                               { so: 8, ma: '', ten: 'Trống' }], phim, x => x.so === 9999);
  ok('Dòng trên cân: theo số PLU, kèm phím (bỏ phím trống / chức năng), bỏ hàng thử và dòng không mã',
    JSON.stringify(tren) === JSON.stringify([{ plu: 6, ma_can: '10071', ten: 'A #0142', phim: ['E', 'Shift A'] }, { plu: 7, ma_can: '10072', ten: 'B', phim: [] }]),
    JSON.stringify(tren));
  const nk = [
    dongNk({ fid: 1, luc: '2026-10-04 09:00:00' }),
    dongNk({ fid: 2, luc: '2026-10-04 09:00:00', stt: 1, plu: 7, maCan: '10072' }),
    dongNk({ fid: 3, luc: '2026-10-04 09:05:00', loai: 2, tenLoai: 'Cân chưa in tem', tinhKho: false }),
    dongNk({ fid: 4, luc: '2026-10-04 09:06:00', maCan: '' }),
    dongNk({ fid: 5, luc: '2026-10-04 09:07:00', theoCai: true, soLuong: 2 }),
    dongNk({ fid: 6, luc: '2026-10-04 09:08:00', loai: 1, tenLoai: 'Trả hàng', soLuong: -0.5 }),
    dongNk({ fid: 7, luc: '2026-09-20 10:00:00' }),
    dongNk({ fid: 8, luc: '2026-10-04 10:00:00', soLuong: 0.4567 }),
  ];
  const chon = chonNhatKyGui(nk, '2026-10-01 00:00:00', 1000);
  ok('Nhật ký: chỉ dòng bán có mã, theo ký, số ký dương, từ mốc — theo giờ (FID 1, 2, 8), kg 3 số lẻ',
    chon.map(d => d.fid).join() === '1,2,8' && chon[2].so_kg === 0.457 && chon[0].ma_can === '10071' && chon[0].luc === '2026-10-04 09:00:00',
    JSON.stringify(chon.map(d => d.fid)));
  ok('Nhật ký: từ mốc 09:00:00 → gửi lại dòng đúng giây mốc (kho bỏ trùng) cùng dòng mới', chonNhatKyGui(nk, '2026-10-04 09:00:00', 1000).map(d => d.fid).join() === '1,2,8');
  ok('Nhật ký: không có dòng SAU mốc → không gửi gì (không gửi lại mỗi phút)', chonNhatKyGui(nk, '2026-10-04 10:00:00', 1000).length === 0);
  ok('Nhật ký: tối đa N dòng sớm nhất', chonNhatKyGui(nk, '2026-10-01 00:00:00', 2).map(d => d.fid).join() === '1,2');

  // ---- UngDung với kho giả -----------------------------------------------------
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'beeftown-can-bao-kho-'));
  const dd = { cauHinh: path.join(tam, 'appdata'), duLieu: path.join(tam, 'tai-lieu') };
  const cn = { id: 'cn-q1', ma: 'q1', ten: 'Hàm Nghi' };
  const nguoi = (vai: string): NguoiDung => ({ email: vai + '@b', hoTen: vai, vaiTro: vai, chiNhanh: cn, cacChiNhanh: [cn], quyen: quyenCuaVai(vai) });
  const goi: { ten: string; thamSo: Record<string, unknown> }[] = [];
  let giaoO: unknown[] = [o('o1', 142)];
  const hong: Record<string, Error | null> = {};
  const kho: KhoTruyCap = {
    async rpc(ten, thamSo) {
      goi.push({ ten, thamSo: JSON.parse(JSON.stringify(thamSo)) });
      if (hong[ten]) throw hong[ten];
      if (ten === 'kho_can_giao_o_ma') return giaoO;
      if (ten === 'kho_may_can_bao') return { luc: new Date().toISOString(), so_o_tren_can: 1 };
      if (ten === 'kho_may_can_nhat_ky') { const d = thamSo.p_dong as unknown[]; return { tong: d.length, moi: d.length }; }
      throw new Error('Kho giả không có hàm ' + ten);
    },
    async bang() { return []; },
    async taiAnhHuy() { return { duongDan: [], loi: [] }; },
  };
  const hang = (ma: string, ma_can: string, ten: string, gia: number): HangKho => ({ ma, ma_can, ten, gia_ban_kg: gia, dang_dung: true });
  // Giá trong mức cân nhận (cân 3 số lẻ: tối đa 999.999 đ/kg).
  let danhMuc: DanhMucKho = { mauMaVach: '2XCCCCCWWWWWK', matHang: [hang('C-RIB', '107', 'Steak Ribeye Angus', 850000),
                                                                   hang('C-RIB#1', '10071', 'Steak Ribeye Angus #0142', 850000)] };
  let bayGio = Date.parse('2026-10-04T05:00:00Z');
  const tao = (vai: string, them: Record<string, unknown> = {}) => new UngDung(dd, {
    kho, nguoi: nguoi(vai), danhMuc: async () => danhMuc, homNay: () => '2026-10-04', bayGio: () => bayGio,
    capNhat: { phienBan: '2.9.0', tepChay: '/khong-co', laBanDongGoi: false },
    // Không bao giờ dò WiFi thật, không hỏi giờ mạng thật.
    mang: [], mac: async () => null, gioMang: async () => null, ...them,
  });
  const nv = tao('nhan_vien_quay');
  const ql = tao('quan_ly');
  // File gốc: cân đang có đúng danh mục (phím E tầng 1 gọi PLU 2 — ô 10071).
  const goc = h.fileCan([h.plu(1, '107', '850,0', 'Steak Ribeye Angus'), h.plu(2, '10071', '850,0', 'Steak Ribeye Angus #0142')]);
  const gocCoPhim = Buffer.from(Buffer.from(goc).toString('latin1').replace('SCP\t0\t2\t2\t', 'SCP\t0\t5\t2\t'), 'latin1');
  nv.ghiNhanFileTuCan(new Uint8Array(gocCoPhim));
  const loiCua = async (f: () => Promise<unknown>) => { try { await f(); return ''; } catch (e) { return (e as Error).message; } };

  // NV quầy: tự gửi được, gửi tay không.
  const t = await nv.tuGuiMotLan();
  ok('NV quầy: tự gửi đọc được danh mục (vai xem) — cân đã khớp kho, không bị từ chối', !t.daGui && /Cân đã khớp kho/.test(t.cau) && !t.hong, JSON.stringify(t));
  ok('NV quầy: bấm Gửi xuống cân / Xem trước → vẫn chỉ quản lý hoặc chủ',
    /chỉ dành cho quản lý hoặc chủ/.test(await loiCua(() => nv.guiXuongCan())) && /chỉ dành cho quản lý hoặc chủ/.test(await loiCua(() => nv.xemTruoc())));
  ok('Quản lý: xem trước được', (await loiCua(() => ql.xemTruoc())) === '');

  // Hỏi kho 15 giây.
  ok('Hỏi kho lần đầu: chỉ nhớ, không tự gửi', (await nv.khoDoiO()) === false && goi.at(-1)?.ten === 'kho_can_giao_o_ma'
    && goi.at(-1)?.thamSo.p_chi_nhanh_id === 'cn-q1');
  ok('Ô không đổi → không tự gửi', (await nv.khoDoiO()) === false);
  giaoO = [o('o1', 143)];
  ok('Tảng khác giữ ô (vừa Giao ô mã) → tự gửi ngay', (await nv.khoDoiO()) === true);
  ok('Hỏi lại, không đổi nữa → không', (await nv.khoDoiO()) === false);
  hong.kho_can_giao_o_ma = new Error('fetch failed');
  ok('Mất mạng khi hỏi kho → không tự gửi, không ném', (await nv.khoDoiO()) === false);
  hong.kho_can_giao_o_ma = null;

  // Báo kho.
  const baoCuoi = () => goi.filter(x => x.ten === 'kho_may_can_bao').at(-1)?.thamSo as { p_chi_nhanh_id: string; p_ma_may: string; p_bao: Record<string, unknown> } | undefined;
  const b1 = await nv.baoKhoMotLan();
  const p1 = baoCuoi();
  ok('Báo kho: kho trả lời → "Đã báo trạng thái cân về kho"', b1.ok && /^Đã báo trạng thái cân về kho/.test(b1.cau), JSON.stringify(b1));
  ok('Báo kho: mã máy là uuid, lưu ở ma-may.txt; chi nhánh của người đăng nhập', /^[0-9a-f-]{36}$/.test(p1?.p_ma_may ?? '')
    && fs.readFileSync(nv.fileMaMay, 'utf8').trim() === p1?.p_ma_may && p1?.p_chi_nhanh_id === 'cn-q1', JSON.stringify(p1));
  ok('Báo kho: phiên bản, giữ kết nối, chưa nghe cân (null), tự gửi tắt → lech_so null, gui_loi false',
    p1?.p_bao.phien_ban === '2.9.0' && p1.p_bao.giu_ket_noi === true && p1.p_bao.can_tra_loi_luc === null && p1.p_bao.tu_gui === false
    && p1.p_bao.lech_so === null && p1.p_bao.gui_loi === false, JSON.stringify(p1?.p_bao));
  ok('Báo kho: dòng trên cân kèm phím (E gọi PLU 2)', JSON.stringify(p1?.p_bao.tren_can) === JSON.stringify([
    { plu: 1, ma_can: '107', ten: 'Steak Ribeye Angus', phim: ['A'] }, { plu: 2, ma_can: '10071', ten: 'Steak Ribeye Angus #0142', phim: ['E'] }]),
    JSON.stringify(p1?.p_bao.tren_can));
  ok('Mở lại chương trình: cùng mã máy', tao('nhan_vien_quay').maMay() === p1?.p_ma_may);
  await nv.baoKhoMotLan();
  ok('Lần sau, trên cân không đổi → tren_can null (không gửi lại mỗi phút)', baoCuoi()?.p_bao.tren_can === null);
  bayGio += 11 * 60_000;
  await nv.baoKhoMotLan();
  ok('Quá 10 phút → gửi lại dòng trên cân', Array.isArray(baoCuoi()?.p_bao.tren_can));

  // Tự gửi bật: lệch, tự gửi hỏng.
  nv.luuCauHinh({ tuGui: true });
  await nv.tuGuiMotLan();
  await nv.baoKhoMotLan();
  ok('Tự gửi bật, cân khớp kho → lech_so 0, gui_loi false', baoCuoi()?.p_bao.tu_gui === true && baoCuoi()?.p_bao.lech_so === 0
    && baoCuoi()?.p_bao.gui_loi === false, JSON.stringify(baoCuoi()?.p_bao));
  const dmCu = danhMuc;
  danhMuc = { ...danhMuc, matHang: danhMuc.matHang.map(x => (x.ma === 'C-RIB' ? { ...x, gia_ban_kg: 870000 } : x)) };
  const nvKhongCan = tao('nhan_vien_quay');
  nvKhongCan.luuCauHinh({ ipCan: '127.0.0.1', congCan: 1, congHaiChieu: 1, giuKetNoi: false });
  const tHong = await nvKhongCan.tuGuiMotLan();
  await nvKhongCan.baoKhoMotLan();
  ok('Kho đổi giá mà không nối được cân → tự gửi hỏng; báo kho lech_so 1, gui_loi true',
    !tHong.daGui && tHong.hong === true && baoCuoi()?.p_bao.lech_so === 1 && baoCuoi()?.p_bao.gui_loi === true,
    JSON.stringify([tHong, baoCuoi()?.p_bao]));
  danhMuc = dmCu;
  nvKhongCan.luuCauHinh({ ipCan: '127.0.0.1', congCan: 33571, congHaiChieu: 33581, giuKetNoi: true, tuGui: false });

  // Nhật ký tem.
  const nkGui = () => goi.filter(x => x.ten === 'kho_may_can_nhat_ky');
  fs.writeFileSync(nv.fileNhatKy, ghiKhoNhatKy(nk), 'utf8');
  const truocNk = nkGui().length;
  const b2 = await nv.baoKhoMotLan();
  const g1 = nkGui().at(-1)?.thamSo.p_dong as { fid: number }[] | undefined;
  ok('Nhật ký tem: lần đầu gửi dòng bán từ 3 ngày trước (FID 1, 2, 8 — bỏ dòng 20/09, loại 2, theo cái, trả hàng, không mã)',
    nkGui().length === truocNk + 1 && g1?.map(d => d.fid).join() === '1,2,8' && /gửi 3 dòng nhật ký tem/.test(b2.cau), `${JSON.stringify(g1)} ${b2.cau}`);
  ok('Mốc nhật ký của chi nhánh = giờ cân của dòng cuối đã gửi', JSON.parse(fs.readFileSync(nv.fileNhatKyDaGui, 'utf8'))['cn-q1'] === '2026-10-04 10:00:00');
  await nv.baoKhoMotLan();
  ok('Không có dòng mới → không gọi kho_may_can_nhat_ky', nkGui().length === truocNk + 1);
  fs.writeFileSync(nv.fileNhatKy, ghiKhoNhatKy([...nk, dongNk({ fid: 9, luc: '2026-10-04 10:05:00' })]), 'utf8');
  hong.kho_may_can_nhat_ky = new Error('fetch failed');
  const b3 = await nv.baoKhoMotLan();
  ok('Mất mạng khi gửi nhật ký → ok false, nói chưa gửi được, mốc KHÔNG tiến',
    !b3.ok && /nhật ký tem chưa gửi được/.test(b3.cau) && JSON.parse(fs.readFileSync(nv.fileNhatKyDaGui, 'utf8'))['cn-q1'] === '2026-10-04 10:00:00', b3.cau);
  hong.kho_may_can_nhat_ky = null;
  await nv.baoKhoMotLan();
  const g2 = nkGui().at(-1)?.thamSo.p_dong as { fid: number }[] | undefined;
  ok('Mạng lại → gửi lại từ mốc (dòng đúng giây mốc + dòng mới), mốc tiến', g2?.map(d => d.fid).join() === '8,9'
    && JSON.parse(fs.readFileSync(nv.fileNhatKyDaGui, 'utf8'))['cn-q1'] === '2026-10-04 10:05:00', JSON.stringify(g2));

  // Mất mạng khi báo trạng thái.
  hong.kho_may_can_bao = new Error('fetch failed');
  const truocLoi = nkGui().length;
  const b4 = await nv.baoKhoMotLan();
  ok('Mất mạng khi báo → "Chưa báo được về kho", không gửi nhật ký, không bao giờ "Đã báo"',
    !b4.ok && /^Chưa báo được về kho/.test(b4.cau) && !/Đã báo/.test(b4.cau) && nkGui().length === truocLoi, b4.cau);
  ok('Ô Cân (trangThaiNen) thấy lần báo hỏng', nv.trangThaiNen().baoKho?.ok === false);
  hong.kho_may_can_bao = null;

  // Hai lượt cùng lúc (cửa sổ cũ và mới): không chồng.
  const truocDoi = goi.filter(x => x.ten === 'kho_may_can_bao').length;
  await Promise.all([nv.baoKhoMotLan(), nv.baoKhoMotLan()]);
  ok('Hai lượt báo cùng lúc → một lần gọi kho', goi.filter(x => x.ten === 'kho_may_can_bao').length === truocDoi + 1);

  // Chưa đăng nhập.
  const chuaDn = new UngDung(dd, { kho, danhMuc: async () => danhMuc, nguoi: { ...nguoi('nhan_vien_quay'), chiNhanh: null }, mang: [] });
  const b5 = await chuaDn.baoKhoMotLan();
  ok('Chưa chọn chi nhánh / chưa đăng nhập → không gọi kho, nói rõ', !b5.ok && /Chưa đăng nhập kho/.test(b5.cau));

  // main.ts, giao diện.
  const goc2 = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'src');
  const mn = fs.readFileSync(path.join(goc2, 'main.ts'), 'utf8');
  const gd = fs.readFileSync(path.join(goc2, 'giao-dien.html'), 'utf8');
  ok('main.ts: hỏi kho mỗi HOI_KHO_MS (khi bật tự gửi, không chồng lượt tự gửi), đổi ô → tự gửi ngay',
    /if \(await ud\.khoDoiO\(\)\) await tuGui\(\);[\s\S]{0,40}\}, HOI_KHO_MS\);/.test(mn) && /dangTuGui \|\| dangHoiKho \|\| !ud\.cauHinh\(\)\.tuGui/.test(mn));
  ok('main.ts: báo kho mỗi BAO_KHO_MS và 5 giây sau khi mở (dừng khi đang cập nhật)',
    /setInterval\(\(\) => \{ if \(!dangCapNhat\(\)\) void ud\.baoKhoMotLan\(\); \}, BAO_KHO_MS\);/.test(mn) && /void ud\.baoKhoMotLan\(\); \}, 5_000\);/.test(mn));
  ok('Giao diện: ô Cân hiện lần báo về kho bằng textContent (không chèn HTML)', /\$\('o-bao-kho'\)\.textContent = bk/.test(gd));

  fs.rmSync(tam, { recursive: true, force: true });
}
