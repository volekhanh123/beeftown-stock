/**
 * Kiểm thử mẫu tem (src/tem.ts) — chỉ dùng file cân giả, không cần cân thật:
 *
 *     cd can-app && npx bun test/thu-tem.ts
 *
 * test/thu.ts gọi thuTem(ok) cùng các phần khác. File giả dựng giống file cân
 * thật (mẫu tem 28, 58×40 mm, 14 ô: vị trí, cỡ chữ, số thứ tự ô như trên cân của
 * quán), chữ trên tem là chữ giả, không có tên hàng thật.
 */
import { docFileCan } from '../../web/src/lib/kho/can-tma.ts';
import {
  CANH_CHU, CAU_PHAN_VUNG, CO_CHU, DIEU_KIEN_IN, DONG_LOGO, ID_LOGO, LOAI_O, LoiTem, MAU_BEEFTOWN_CO, O_MAU_BEEFTOWN, O_THEM_DUOC,
  TEN_CONG_TY_TREN_TEM, TRUONG_BAN, TRUONG_HANG, XOAY,
  docTem, dongBmp, goiYHsd, kemLogo, khoiLogo, khungThat, mauBeeftown, suaTem, temDungLogo, xemTem, type DaTat, type SuaO, type ThayDoiTem,
} from '../src/tem.ts';
import { LOGO_TEM } from '../src/logo-tem.ts';
import { kiemDongBmp, kiemKhoiGhi } from '../src/giao-thuc.ts';
import { createHash } from 'node:crypto';

export type Ok = (ten: string, dieuKien: boolean, chiTiet?: string) => void;

// ---- File cân giả ----------------------------------------------------------------
type DongO = readonly number[];
/** [số thứ tự, loại, Flag2, Flag3, điều kiện in, xoay, canh, cỡ chữ, x, y, rộng, cao] → dòng LAS (tab cuối). */
const las = (r: DongO) => `LAS\t${r.join('\t')}\t`;

// Mẫu 28 như trên cân của quán (vị trí, cỡ chữ, số thứ tự ô), chữ giả.
const O_28: readonly DongO[] = [
  [0, 1, 0, 0, 1, 0, 5, 5, 0, 0, 408, 43],          // 0  Tên hàng
  [1, 1, 0, 6, 1, 0, 5, 0, 408, 1, 54, 34],         // 1  Số PLU
  [4, 3, 3, 0, 1, 0, 4, 5, 281, 52, 152, 26],       // 2  Chữ "Thành tiền" (ô chữ 3)
  [5, 3, 1, 0, 2, 0, 5, 3, 6, 55, 115, 26],         // 3  Chữ "Trọng lượng" (ô chữ 1), chỉ hàng cân ký
  [10, 3, 0, 0, 1, 0, 5, 3, 137, 56, 107, 26],      // 4  Chữ "Đơn giá" (ô chữ 0)
  [12, 1, 0, 1, 1, 0, 5, 3, 4, 90, 116, 26],        // 5  Trọng lượng / số lượng
  [15, 1, 0, 4, 1, 0, 0, 3, 131, 90, 111, 25],      // 6  Đơn giá
  [16, 2, 27, 0, 1, 0, 5, 5, 260, 108, 204, 35],    // 7  Thành tiền
  [17, 0, 0, 0, 1, 0, 0, 0, 3, 120, 257, 74],       // 8  Mã vạch
  [20, 3, 4, 0, 1, 0, 5, 0, 2, 198, 112, 21],       // 9  Chữ "Ngày đóng gói" (ô chữ 4)
  [26, 2, 3, 0, 1, 0, 5, 0, 121, 198, 156, 20],     // 10 Ngày in
  [27, 1, 0, 15, 1, 0, 0, 0, 114, 220, 200, 26],    // 11 Hạn dùng, luôn in
  [28, 3, 16, 0, 1, 0, 0, 0, 1, 224, 94, 23],       // 12 Chữ "HSD" (ô chữ 16), luôn in
  [29, 3, 12, 0, 1, 0, 192, 1, 220, 255, 220, 50],  // 13 Chữ tên quán (ô chữ 12), canh có bit cao 0xC0
];
// Cột LAB → chữ. Cột 8 (ô chữ 2) còn chữ cũ nhưng không ô nào dùng.
const CHU_28: Record<number, string> = { 6: 'Đơn giá', 7: 'Trọng lượng', 8: 'Cái', 9: 'Thành tiền', 10: 'Ngày đóng gói', 18: 'QUÁN THỬ', 23: 'HSD' };

function dongLab(id: string, ten: string, chu: Record<number, string>, tuy: { rong?: number; cao?: number; soCot?: number } = {}): string {
  const soCot = tuy.soCot ?? 40;
  const f = ['LAB', id, ten, '1', String(tuy.rong ?? 58), String(tuy.cao ?? 40)];
  for (let c = 6; c < soCot - 1; c++) f.push(c === 22 ? '1' : (chu[c] ?? ''));
  f.push('');
  return f.join('\t');
}
const mau28 = (o: readonly DongO[] = O_28, chu = CHU_28) => [dongLab('28', 'QUAN THU', chu), ...o.map(las), 'LAE\t'];
// Một mẫu khác đứng trước (như mẫu 1–11 trong file cân thật): không bao giờ bị đụng.
const MAU_1 = [dongLab('1', 'PF-1', { 6: 'Price' }, { rong: 54, cao: 37 }), las([0, 1, 0, 0, 1, 0, 5, 2, 0, 0, 362, 34]), las([12, 0, 0, 0, 1, 0, 5, 1, 0, 88, 281, 113]), 'LAE\t'];

function fileCan(labs: string[], mauDung = '28', bom = false): Uint8Array {
  const L = ['ECS\tVER\tV3.14E8\t', '', 'DWL\tPLU\t', 'PLU\t1\t10001\t\t1\t100,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\tHàng thử\t', 'END\tPLU\t', '',
    'DWL\tLAB\t', ...labs, 'END\tLAB\t', '',
    'DWL\tTMS\t', `TMS\t0\t${mauDung}\t`, 'TMS\t202\t3\t', 'END\tTMS\t', '',
    'DWL\tTIM\t', 'TIM\t26\t9\t29\t8\t0\t0\t', 'END\tTIM\t', '', 'END\tECS\t', ''];
  const u = new TextEncoder().encode(L.join('\r\n'));
  const dau = bom ? 3 : 0;
  const ra = new Uint8Array(dau + u.length + 1);
  if (bom) ra.set([0xEF, 0xBB, 0xBF]);
  ra.set(u, dau);
  ra[ra.length - 1] = 0xFF;   // byte không phải UTF-8 ở cuối: phải giữ nguyên
  return ra;
}
/** File mẫu 28 với vài ô thay (vị trí → dòng mới) và vài ô bỏ. */
const bien = (thay: Record<number, DongO> = {}, bo: number[] = []) => O_28.map((x, i) => thay[i] ?? x).filter((_, i) => !bo.includes(i));
const file28 = (o: readonly DongO[] = O_28, chu = CHU_28, bom = false) => fileCan([...MAU_1, ...mau28(o, chu)], '28', bom);

const bang = (a: Uint8Array, b: Uint8Array) => Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0;
const loiCua = (f: () => unknown): string => {
  try { f(); return ''; } catch (e) { return e instanceof LoiTem ? e.message : `(không phải LoiTem) ${(e as Error).message}`; }
};
/** Chỗ khác nhau đầu tiên, để in khi hỏng. */
const khac = (a: Uint8Array, b: Uint8Array) => {
  const A = Buffer.from(a).toString('latin1').split('\r\n'), B = Buffer.from(b).toString('latin1').split('\r\n');
  const i = A.findIndex((d, j) => d !== B[j]);
  return i < 0 ? `độ dài ${A.length}/${B.length}` : `dòng ${i}: ${JSON.stringify(A[i])} ≠ ${JSON.stringify(B[i])}`;
};

export async function thuTem(ok: Ok): Promise<void> {
  const goc = file28();
  const f0 = docFileCan(goc);

  // ===========================================================================
  console.log('T1 · Đọc mẫu tem: số thứ tự, cỡ chữ, canh, xoay, điều kiện in');
  const { cacMau, dangDung: m } = docTem(f0);
  ok('Đọc 2 mẫu, đang dùng mẫu 28 (TMS 0), 14 ô, không có Phân vùng', cacMau.length === 2 && m?.id === '28' && m.o.length === 14 && !m.phanVung);
  const o0 = m!.o[0];
  ok('Ô tên hàng: số 0, cỡ chữ 5 (cột 8), canh 5 (cột 7), xoay 0 (cột 6), luôn in (cột 5)', o0.subId === 0 && o0.font === 5 && o0.canh === 5 && o0.xoay === 0
    && o0.inKhi === 1 && o0.x === 0 && o0.y === 0 && o0.w === 408 && o0.h === 43, JSON.stringify(o0));
  ok('Chữ "Trọng lượng": chỉ hàng cân ký (inKhi 2, dieuKien "2" như cũ), cỡ 3, số 5', m!.o[3].inKhi === 2 && m!.o[3].dieuKien === '2' && m!.o[3].font === 3 && m!.o[3].subId === 5);
  ok('Đơn giá canh 0 cỡ 3; chữ tên quán canh 192 (giữ cả bit cao) cỡ 1', m!.o[6].canh === 0 && m!.o[6].font === 3 && m!.o[13].canh === 192 && m!.o[13].font === 1);
  const x0 = xemTem(f0, {})!;
  ok('Xem tem: trả số thứ tự, cỡ chữ, canh, xoay, điều kiện in; sửa được', x0.o[11].subId === 27 && x0.o[11].font === 0 && x0.o[11].inKhi === 1 && x0.o[11].xoay === 0
    && x0.o[13].canh === 192 && x0.phanVung === false && x0.chanSua === null, JSON.stringify(x0.o[11]));
  const ten = x0.o.map(o => o.ten);
  ok('Gọi tên ô theo danh mục', ['Tên hàng', 'Số PLU', 'Chữ "Thành tiền"', 'Trọng lượng / số lượng', 'Đơn giá', 'Thành tiền', 'Mã vạch', 'Ngày in', 'Hạn dùng', 'Chữ "HSD"']
    .every(t => ten.includes(t)), ten.join(' | '));
  ok('Danh mục mã có tên tiếng Việt', TRUONG_HANG[15] === 'Hạn dùng (HSD)' && TRUONG_HANG[13] === 'Ngày đóng gói' && TRUONG_HANG[1] === 'Trọng lượng / số lượng'
    && TRUONG_BAN[27] === 'Thành tiền' && TRUONG_BAN[0] === 'Tên quán' && /^Ngày in/.test(TRUONG_BAN[3]) && DIEU_KIEN_IN[1] === 'Luôn in' && /hạn dùng/.test(DIEU_KIEN_IN[9])
    && LOAI_O[5] === 'Phân vùng' && CO_CHU.length === 10 && CO_CHU[5].rong === 18 && CO_CHU[5].cao === 68 && CO_CHU[9].cao === 102 && CANH_CHU[5] === 'Giữa' && XOAY[1] === 'Xoay 90°');
  ok('Ô thêm được: mã đúng danh mục, có HSD + chữ "HSD" + chữ tự do, không có tên / mật khẩu WiFi', O_THEM_DUOC.every(x => x.ten && LOAI_O[x.flag1] && DIEU_KIEN_IN[x.inKhi]
    && CO_CHU[x.font] && CANH_CHU[x.canh] !== undefined && x.w > 0 && x.h > 0 && (x.flag1 !== 1 || TRUONG_HANG[x.flag3]) && (x.flag1 !== 2 || TRUONG_BAN[x.flag2]))
    && !O_THEM_DUOC.some(x => x.flag1 === 2 && (x.flag2 === 39 || x.flag2 === 40)) && ['hsd', 'chu-hsd', 'chu'].every(k => O_THEM_DUOC.some(x => x.khoa === k))
    && new Set(O_THEM_DUOC.map(x => x.khoa)).size === O_THEM_DUOC.length);
  ok('Khung thật khi xoay (như phần mềm của hãng)', JSON.stringify(khungThat(10, 300, 200, 26, 3)) === JSON.stringify({ x: 10, y: 100, w: 26, h: 200 })
    && JSON.stringify(khungThat(50, 5, 20, 30, 1)) === JSON.stringify({ x: 20, y: 5, w: 30, h: 20 })
    && JSON.stringify(khungThat(50, 40, 20, 30, 2)) === JSON.stringify({ x: 30, y: 10, w: 20, h: 30 }) && khungThat(1, 2, 3, 4, 0).w === 3);

  // ===========================================================================
  console.log('T2 · Sửa ô: di chuyển, đổi khung, cỡ chữ — dòng khác giữ từng byte');
  const sua = (thay: ThayDoiTem, dt: DaTat = {}, du = goc) => suaTem(du, dt, thay);
  const k1 = sua({ sua: [{ khoa: 'o:11', x: 120, y: 222 }] });
  const mong1 = file28(bien({ 11: [27, 1, 0, 15, 1, 0, 0, 0, 120, 222, 200, 26] }));
  ok('Di chuyển ô hạn dùng: chỉ đổi x, y của dòng đó; cả file còn lại giữ từng byte (PLU, TIM, mẫu khác, byte cuối)',
    bang(k1.du, mong1) && k1.coDoi && k1.canhBao.length === 0, khac(k1.du, mong1));
  const k2 = sua({ sua: [{ khoa: 'o:7', w: 190, h: 40 }] });
  ok('Đổi khung ô thành tiền', bang(k2.du, file28(bien({ 7: [16, 2, 27, 0, 1, 0, 5, 5, 260, 108, 190, 40] }))), khac(k2.du, goc));
  const k3 = sua({ sua: [{ khoa: 'o:0', font: 6 }] });
  ok('Đổi cỡ chữ tên hàng: ghi cột 8, không đụng cột 7 (canh)', bang(k3.du, file28(bien({ 0: [0, 1, 0, 0, 1, 0, 5, 6, 0, 0, 408, 43] }))), khac(k3.du, goc));
  const k4 = sua({ sua: [{ khoa: 'o:13', canh: 6 }] });
  ok('Đổi canh ô có bit cao: 192 → 198 (giữ bit cao)', bang(k4.du, file28(bien({ 13: [29, 3, 12, 0, 1, 0, 198, 1, 220, 255, 220, 50] }))), khac(k4.du, goc));
  const k5 = sua({ sua: [{ khoa: 'o:13', x: 230, w: 210 }] });
  ok('Di chuyển ô có bit cao: canh 192 giữ nguyên', bang(k5.du, file28(bien({ 13: [29, 3, 12, 0, 1, 0, 192, 1, 230, 255, 210, 50] }))), khac(k5.du, goc));
  const k6 = sua({ sua: [{ khoa: 'o:11', inKhi: 9 }, { khoa: 'o:12', xoay: 3 }] });
  ok('Đổi điều kiện in (cột 5) và góc xoay (cột 6); xoay mà vẫn trong tem thì không cảnh báo',
    bang(k6.du, file28(bien({ 11: [27, 1, 0, 15, 9, 0, 0, 0, 114, 220, 200, 26], 12: [28, 3, 16, 0, 1, 3, 0, 0, 1, 224, 94, 23] }))) && k6.canhBao.length === 0,
    khac(k6.du, goc) + JSON.stringify(k6.canhBao));
  const k7 = sua({ sua: [{ khoa: 'o:0', x: 0, y: 0, w: 408, h: 43, font: 5, canh: 5, xoay: 0, inKhi: 1 }, { khoa: 'o:13', canh: 192 }, { khoa: 'o:13', canh: 0 }] });
  ok('Sửa bằng đúng giá trị đang có (kể cả canh 192 / canh 0 trên ô 192): không đổi gì, file y nguyên', !k7.coDoi && bang(k7.du, goc), khac(k7.du, goc));
  const k8 = sua({ sua: [{ khoa: 'o:0', x: 100 }] });
  ok('Ô ra ngoài mép tem: vẫn sửa, kèm cảnh báo có tên ô', k8.coDoi && k8.canhBao.length === 1 && /ngoài tem 58×40 mm/.test(k8.canhBao[0]) && /Tên hàng/.test(k8.canhBao[0]),
    JSON.stringify(k8.canhBao));
  const k9 = sua({ sua: [{ khoa: 'o:0', xoay: 1 }] });
  ok('Xoay 90° làm ô lệch ra ngoài bên trái: cảnh báo, không chặn', bang(k9.du, file28(bien({ 0: [0, 1, 0, 0, 1, 1, 5, 5, 0, 0, 408, 43] }))) && k9.canhBao.length === 1,
    JSON.stringify(k9.canhBao));
  const k10 = suaTem(file28(O_28, CHU_28, true), {}, { sua: [{ khoa: 'o:11', x: 120, y: 222 }] });
  ok('File có BOM: giữ BOM', bang(k10.du, file28(bien({ 11: [27, 1, 0, 15, 1, 0, 0, 0, 120, 222, 200, 26] }), CHU_28, true)));
  const loiSua = (s: object) => loiCua(() => sua({ sua: [s as SuaO] }));
  ok('Số sai bị từ chối: x âm, y lẻ, rộng 0, cỡ chữ 10, điều kiện in lạ, canh 12, xoay 4', /Vị trí ngang \(x\) phải là số nguyên từ 0/.test(loiSua({ khoa: 'o:0', x: -1 }))
    && /Vị trí dọc/.test(loiSua({ khoa: 'o:0', y: 1.5 })) && /Chiều rộng/.test(loiSua({ khoa: 'o:0', w: 0 })) && /Cỡ chữ/.test(loiSua({ khoa: 'o:0', font: 10 }))
    && /Điều kiện in/.test(loiSua({ khoa: 'o:0', inKhi: 50 })) && /Canh chữ/.test(loiSua({ khoa: 'o:0', canh: 12 })) && /Góc xoay/.test(loiSua({ khoa: 'o:0', xoay: 4 })),
    loiSua({ khoa: 'o:0', x: -1 }));
  ok('Ô không có / ô đang tắt / sai dạng → báo, không ném lỗi lạ', /Mở lại thẻ Tem/.test(loiSua({ khoa: 'o:14', x: 1 })) && /đang tắt/.test(loiSua({ khoa: 't:0', x: 1 }))
    && /Mở lại thẻ Tem/.test(loiSua({ x: 1 })) && /không đúng dạng/.test(loiCua(() => sua({ sua: 'o:1' as unknown as SuaO[] })))
    && /không đúng dạng/.test(loiCua(() => sua({ sua: [null as unknown as SuaO] }))));

  // ===========================================================================
  console.log('T3 · Thêm ô: hạn dùng + chữ "HSD", ô chữ lấy chỗ trống, số thứ tự');
  const O_KHONG_HSD = bien({}, [11, 12]);
  const CHU_KHONG_HSD = { ...CHU_28, 23: '' };
  const gocKhong = file28(O_KHONG_HSD, CHU_KHONG_HSD);
  const t1 = suaTem(gocKhong, {}, { them: [{ mau: 'hsd', x: 114, y: 220 }, { mau: 'chu-hsd', x: 1, y: 224 }] });
  const mongT1 = file28([...O_KHONG_HSD, [30, 1, 0, 15, 9, 0, 5, 0, 114, 220, 200, 26], [31, 3, 5, 0, 9, 0, 5, 0, 1, 224, 94, 23]], { ...CHU_KHONG_HSD, 11: 'HSD' });
  ok('Thêm "Hạn dùng" + chữ "HSD": 2 dòng LAS cuối mẫu (số 30, 31, chỉ in khi có HSD, tab cuối); chữ vào ô chữ trống đầu tiên (số 5, cột 11 — bỏ qua ô 2 còn chữ cũ); byte khác giữ nguyên',
    bang(t1.du, mongT1) && t1.coDoi && t1.canhBao.length === 0, khac(t1.du, mongT1));
  const x1 = xemTem(docFileCan(t1.du), {})!;
  ok('Xem lại: 14 ô, có "Hạn dùng" và chữ "HSD", chỉ in khi có HSD', x1.o.length === 14 && x1.o.some(o => o.ten === 'Hạn dùng' && o.inKhi === 9 && o.subId === 30)
    && x1.o.some(o => o.ten === 'Chữ "HSD"' && o.inKhi === 9 && o.cot === 11) && x1.chu[11] === 'HSD');
  ok('Đã chỉ in khi có HSD → không còn gợi ý', goiYHsd(docFileCan(t1.du)).length === 0);

  const t2 = sua({ them: [{ mau: 'chu', x: 10, y: 290, w: 200, chu: '  Giữ lạnh\t0–4°C\r\n' }, { mau: 'chu', x: 240, y: 290, chu: 'Bảo quản lạnh', inKhi: 2, font: 1 }] });
  const mongT2 = file28([...O_28, [30, 3, 5, 0, 1, 0, 5, 0, 10, 290, 200, 20], [31, 3, 6, 0, 2, 0, 5, 1, 240, 290, 160, 20]], { ...CHU_28, 11: 'Giữ lạnh 0–4°C', 12: 'Bảo quản lạnh' });
  ok('Thêm 2 ô chữ: bỏ tab / xuống dòng, ô chữ trống 5 rồi 6, số thứ tự 30, 31, chữ UTF-8', bang(t2.du, mongT2), khac(t2.du, mongT2));
  ok('Ô chữ mới: thiếu chữ / quá 40 ký tự / loại ô lạ → báo', /Nhập chữ/.test(loiCua(() => sua({ them: [{ mau: 'chu', x: 1, y: 1 }] })))
    && /dài quá 40/.test(loiCua(() => sua({ them: [{ mau: 'chu', x: 1, y: 1, chu: 'x'.repeat(41) }] })))
    && /không có trong danh sách/.test(loiCua(() => sua({ them: [{ mau: 'mat-khau-wifi', x: 1, y: 1 }] })))
    && /Vị trí ngang/.test(loiCua(() => sua({ them: [{ mau: 'hsd', x: -5, y: 1 }] }))));
  const t2b = sua({ them: [{ mau: 'hsd', x: 400, y: 300 }] });
  ok('Thêm ô ra ngoài mép: vẫn thêm, kèm cảnh báo', t2b.coDoi && t2b.canhBao.length === 1 && /Hạn dùng/.test(t2b.canhBao[0]), JSON.stringify(t2b.canhBao));

  // Ô số 29 đang tắt (nhớ trong tem-da-tat.json) → ô mới phải là số 30, không trùng 29.
  const gocTat = file28(bien({}, [13]));
  const daTatCu = JSON.parse(`{"28":[{"tho":${JSON.stringify(las(O_28[13]))},"viTri":13}]}`) as DaTat;
  const t3 = suaTem(gocTat, daTatCu, { them: [{ mau: 'ma-vach', x: 3, y: 200, h: 40 }] });
  const dongMoi = las([30, 0, 0, 0, 1, 0, 5, 0, 3, 200, 257, 40]);
  ok('Số thứ tự ô mới tính cả ô đang tắt (29 tắt → ô mới số 30); ô tắt vẫn nhớ', bang(t3.du, file28([...bien({}, [13]), [30, 0, 0, 0, 1, 0, 5, 0, 3, 200, 257, 40]]))
    && JSON.stringify(t3.daTat) === JSON.stringify(daTatCu), khac(t3.du, gocTat));
  const t4 = suaTem(t3.du, t3.daTat, { bat: ['t:0'] });
  const dongT4 = docFileCan(t4.du).dong.filter(d => d.startsWith('LAS\t')).slice(2);
  ok('Bật lại ô đã tắt sau khi thêm: về đúng chỗ, số thứ tự vẫn tăng dần', dongT4.length === 15 && dongT4[13] === las(O_28[13]) && dongT4[14] === dongMoi
    && dongT4.every((d, i) => i === 0 || Number(d.split('\t')[1]) > Number(dongT4[i - 1].split('\t')[1])), dongT4.map(d => d.split('\t')[1]).join());

  const goc99 = file28([...bien({}, [13]), [99, ...O_28[13].slice(1)]]);
  ok('Số thứ tự ô đã tới 99 → không thêm được', /số thứ tự ô 99/.test(loiCua(() => suaTem(goc99, {}, { them: [{ mau: 'hsd', x: 1, y: 1 }] }))));
  const tram = Array.from({ length: 100 }, (_, i) => [i % 50, 1, 0, 6, 1, 0, 5, 0, 0, 0, 10, 10]);
  ok('Mẫu đã có 100 ô → không thêm được', /tối đa 100 ô/.test(loiCua(() => suaTem(fileCan(mau28(tram)), {}, { them: [{ mau: 'so-plu', x: 1, y: 1 }] }))));

  // File như test/thu.ts: dòng LAB ngắn (25 cột), mọi ô số 29.
  const LAS_CU = [
    [1, 0, 0, 1, 0, 0, 408, 43, 5], [1, 0, 6, 1, 408, 1, 54, 34, 5], [3, 3, 0, 1, 281, 52, 152, 26, 4], [3, 1, 0, 2, 6, 55, 115, 26, 5],
    [3, 0, 0, 1, 137, 56, 107, 26, 5], [1, 0, 1, 1, 4, 90, 116, 26, 5], [1, 0, 4, 1, 131, 90, 111, 25, 0], [2, 27, 0, 1, 260, 108, 204, 35, 5],
    [0, 0, 0, 1, 3, 120, 257, 74, 0], [3, 4, 0, 1, 2, 198, 112, 21, 5], [2, 3, 0, 1, 121, 198, 156, 20, 5], [1, 0, 15, 1, 114, 220, 200, 26, 0],
    [3, 16, 0, 1, 1, 224, 94, 23, 0], [3, 12, 0, 1, 220, 255, 220, 50, 0],
  ].map(([loai, chu, du, dk, x, y, w, h, co]) => `LAS\t29\t${loai}\t${chu}\t${du}\t${dk}\t0\t${co}\t1\t${x}\t${y}\t${w}\t${h}\t`);
  const labCu = (o8: string) => `LAB\t28\tQUAN THU\t1\t58\t40\tĐơn giá\tTrọng Lượng\t${o8}\tThành Tiền\tNgày đóng gói\t\t\t\t\t\t\t\tQUAN THU\t\t\t\t1\tHSD\t`;
  const fCu = docFileCan(fileCan([labCu(''), ...LAS_CU, 'LAE\t']));
  ok('File cũ (dòng LAB 25 cột): cỡ chữ đọc từ cột 8 = 1, canh từ cột 7', xemTem(fCu, {})!.o.every(o => o.font === 1) && xemTem(fCu, {})!.o[2].canh === 4);
  const t5 = suaTem(fileCan([labCu(''), ...LAS_CU, 'LAE\t']), {}, { them: [{ mau: 'chu-hsd', x: 300, y: 224 }] });
  const mongT5 = fileCan([labCu('HSD'), ...LAS_CU, las([30, 3, 2, 0, 9, 0, 5, 0, 300, 224, 94, 23]), 'LAE\t']);
  ok('File cũ: thêm chữ "HSD" vào ô chữ trống 2 (cột 8), ô mới số 30', bang(t5.du, mongT5), khac(t5.du, mongT5));
  const ngan = fileCan(['LAB\t28\tTHU\t1\t58\t40\tGiá\t', las([0, 3, 0, 0, 1, 0, 5, 1, 0, 0, 100, 26]), 'LAE\t']);
  const t6 = suaTem(ngan, {}, { them: [{ mau: 'chu', x: 0, y: 30, chu: 'Mới' }] });
  const mongT6 = fileCan(['LAB\t28\tTHU\t1\t58\t40\tGiá\tMới\t', las([0, 3, 0, 0, 1, 0, 5, 1, 0, 0, 100, 26]), las([1, 3, 1, 0, 1, 0, 5, 0, 0, 30, 160, 20]), 'LAE\t']);
  ok('Dòng LAB rất ngắn: thêm cột cho chữ mới, giữ tab cuối', bang(t6.du, mongT6), khac(t6.du, mongT6));

  // ===========================================================================
  console.log('T4 · Mẫu có Phân vùng: không di chuyển / sửa / thêm ô');
  const MAU_27 = [dongLab('27', 'CONG DON', { 6: 'Hàng', 7: '-----', 23: 'HSD' }, { rong: 48, cao: 118 }),
    las([0, 2, 0, 0, 1, 0, 0, 5, 0, 0, 384, 26]),
    las([1, 5, 0, 0, 1, 0, 0, 0, 20, 26, 200, 50]),
    las([2, 3, 0, 0, 1, 0, 4, 1, 0, 26, 114, 26]),
    las([3, 1, 0, 0, 1, 0, 4, 3, 0, 52, 180, 26]),
    las([4, 5, 2, 0, 1, 0, 0, 0, 20, 78, 200, 50]),
    las([5, 3, 16, 0, 1, 0, 4, 1, 0, 78, 100, 26]),
    'LAE\t'];
  const gocPv = fileCan([...MAU_1, ...mau28(), ...MAU_27], '27');
  const xPv = xemTem(docFileCan(gocPv), {})!;
  ok('Mẫu 27 đang dùng: có Phân vùng, báo rõ không sửa ô được', xPv.id === '27' && xPv.phanVung && /Phân vùng/.test(xPv.chanSua ?? '') && xPv.o[1].ten === 'Phân vùng', JSON.stringify(xPv.chanSua));
  const loiPv = [loiCua(() => suaTem(gocPv, {}, { sua: [{ khoa: 'o:3', x: 10 }] })), loiCua(() => suaTem(gocPv, {}, { them: [{ mau: 'hsd', x: 1, y: 1 }] }))];
  ok('Di chuyển / thêm ô trên mẫu có Phân vùng → từ chối, nói lý do và cách khác', loiPv.every(l => /Phân vùng/.test(l) && /phần mềm của hãng/.test(l)), loiPv.join(' | '));
  ok('Không gợi ý HSD trên mẫu có Phân vùng (dù có chữ "HSD" luôn in)', goiYHsd(docFileCan(gocPv)).length === 0);
  const pv = suaTem(gocPv, {}, { tat: ['o:3'], chu: { 23: 'Hạn dùng' } });
  const mPv = docTem(docFileCan(pv.du)).dangDung!;
  ok('Mẫu có Phân vùng: tắt ô và sửa chữ vẫn như cũ', pv.coDoi && mPv.o.length === 5 && pv.daTat['27'][0].tho === las([3, 1, 0, 0, 1, 0, 4, 3, 0, 52, 180, 26])
    && new TextDecoder().decode(Buffer.from(mPv.cot[23], 'latin1')) === 'Hạn dùng');
  const pv2 = suaTem(gocPv, {}, { tat: ['o:1', 'o:4'] });
  ok('Ô Phân vùng đang tắt vẫn tính: không sửa / thêm ô, không gợi ý', /Phân vùng/.test(loiCua(() => suaTem(pv2.du, pv2.daTat, { sua: [{ khoa: 'o:0', x: 1 }] })))
    && xemTem(docFileCan(pv2.du), pv2.daTat)!.phanVung && goiYHsd(docFileCan(pv2.du), pv2.daTat).length === 0);

  // ===========================================================================
  console.log('T5 · Gợi ý "Chỉ in HSD khi hàng có hạn dùng"');
  ok('Mẫu 28 (ô Hạn dùng và chữ "HSD" luôn in) → gợi ý 2 ô', goiYHsd(f0).join() === 'o:11,o:12', goiYHsd(f0).join());
  const g1 = sua({ sua: goiYHsd(f0).map(khoa => ({ khoa, inKhi: 9 })) });
  ok('Bấm gợi ý: 2 ô sang "Chỉ khi hàng có hạn dùng" (9), hết gợi ý, dòng khác y nguyên',
    bang(g1.du, file28(bien({ 11: [27, 1, 0, 15, 9, 0, 0, 0, 114, 220, 200, 26], 12: [28, 3, 16, 0, 9, 0, 0, 0, 1, 224, 94, 23] }))) && goiYHsd(docFileCan(g1.du)).length === 0);
  ok('Chữ "Hạn sử dụng:" cũng nhận ra; chữ "Ngày đóng gói" thì không', goiYHsd(docFileCan(file28(O_28, { ...CHU_28, 23: 'Hạn sử dụng:' }))).join() === 'o:11,o:12'
    && !goiYHsd(f0).includes('o:9'));
  ok('Mẫu không có ô HSD → không gợi ý', goiYHsd(docFileCan(gocKhong)).length === 0);

  // ===========================================================================
  console.log('T6 · Tắt / bật như cũ (tem-da-tat.json)');
  const b1 = sua({ tat: ['o:8'] });
  ok('Tắt mã vạch: bỏ đúng dòng, nhớ { tho, viTri } như cũ', bang(b1.du, file28(bien({}, [8])))
    && JSON.stringify(b1.daTat) === JSON.stringify({ '28': [{ tho: las(O_28[8]), viTri: 8 }] }), JSON.stringify(b1.daTat));
  const daTatFile = JSON.parse(JSON.stringify(b1.daTat)) as DaTat;   // như đọc lại tem-da-tat.json
  const xb = xemTem(docFileCan(b1.du), daTatFile)!;
  ok('Đọc lại ô đã tắt: mã vạch là "t:0", đang tắt, đủ số thứ tự / cỡ chữ', xb.o.some(o => o.khoa === 't:0' && !o.bat && o.ten === 'Mã vạch' && o.subId === 17 && o.font === 0));
  const b2 = suaTem(b1.du, daTatFile, { bat: ['t:0'] });
  ok('Bật lại: file y như lúc đầu, hết ô đã tắt', bang(b2.du, goc) && b2.daTat['28'].length === 0, khac(b2.du, goc));
  const b3 = sua({ sua: [{ khoa: 'o:11', x: 120 }], tat: ['o:8'] });
  ok('Sửa một ô và tắt ô khác cùng lúc', bang(b3.du, file28(bien({ 11: [27, 1, 0, 15, 1, 0, 0, 0, 120, 220, 200, 26] }, [8]))) && b3.daTat['28'][0].tho === las(O_28[8]));
  const daSua8: DongO = [17, 0, 0, 0, 1, 0, 0, 0, 3, 130, 257, 74];
  const b4 = sua({ sua: [{ khoa: 'o:8', y: 130 }], tat: ['o:8'] });
  ok('Sửa rồi tắt cùng một ô: nhớ dòng đã sửa, bật lại ra dòng đã sửa', b4.daTat['28'][0].tho === las(daSua8)
    && bang(suaTem(b4.du, b4.daTat, { bat: ['t:0'] }).du, file28(bien({ 8: daSua8 }))));
  const b5 = sua({ chu: { 23: 'Hạn dùng' }, tat: ['o:8'], them: [{ mau: 'ma-vach', x: 3, y: 120 }] });
  ok('Sửa chữ + tắt + thêm cùng lúc', bang(b5.du, file28([...bien({}, [8]), [30, 0, 0, 0, 1, 0, 5, 0, 3, 120, 257, 74]], { ...CHU_28, 23: 'Hạn dùng' })), khac(b5.du, goc));
  ok('Không đổi gì → coDoi false (thẻ Tem báo "chưa có gì thay đổi")', !sua({}).coDoi && !sua({ sua: [], them: [] }).coDoi && bang(sua({}).du, goc));
  ok('Lỗi cũ giữ nguyên chữ: ô không có, chữ quá 40, cột chữ không có', /Mở lại thẻ Tem/.test(loiCua(() => sua({ tat: ['o:99'] })))
    && /dài quá 40/.test(loiCua(() => sua({ chu: { 23: 'x'.repeat(41) } }))) && /không có trên tem/.test(loiCua(() => sua({ chu: { 11: 'lạ' } }))));

  // ===========================================================================
  console.log('T7 · Mẫu tem Beeftown (2.12; bản 2 từ 2.13): xếp tem 28 theo mẫu tem thịt siêu thị');
  await thuMauBeeftown(ok);

  // ===========================================================================
  console.log('T8 · Logo trên tem (2.13): hình đen trắng, dòng BMP, file và khối gửi kèm logo');
  await thuLogo(ok);
}

/** Ô đang in của mẫu đang dùng sau khi áp: chữ (ô chữ cố định) hoặc tên ô, kèm khung, cỡ, canh, khi nào in. */
function oSauKhiAp(du: Uint8Array) {
  const f = docFileCan(du), m = docTem(f).dangDung!;
  const tem = xemTem(f, {})!;
  return m.o.map((o, i) => ({ ...o, canh4: o.canh & 0x0F, ten: tem.o[i].ten, chuIn: o.loai === '3' ? tem.chu[tem.o[i].cot!] : null }));
}

async function thuMauBeeftown(ok: Ok): Promise<void> {
  const goc = file28();
  const ap = (du: Uint8Array, daTat: DaTat = {}) => {
    const mb = mauBeeftown(du, daTat);
    return { mb, kq: mb.thay ? suaTem(du, daTat, mb.thay) : null };
  };
  const { mb, kq } = ap(goc);
  ok('Tem 28 của quán: áp được, không có lý do chặn', mb.thay !== null && mb.lyDo === null && kq !== null && kq.coDoi && kq.canhBao.length === 0, JSON.stringify(mb.lyDo ?? kq?.canhBao));
  const o = oSauKhiAp(kq!.du);
  ok('Sau khi áp: 17 ô đang in (8 ô dữ liệu gồm logo + 9 ô chữ)', o.length === 17, String(o.length));

  // Từng ô của mẫu có mặt đúng khung, cỡ chữ, canh, khi nào in.
  const thieu = O_MAU_BEEFTOWN.filter(({ ten, k }) => !o.some(x => (x.chuIn !== null ? `Chữ "${x.chuIn}"` : x.ten) === ten
    && x.x === k.x && x.y === k.y && x.w === k.w && x.h === k.h && x.inKhi === k.inKhi && x.xoay === 0
    && (k.font === undefined || x.font === k.font) && (k.canh === undefined || x.canh4 === k.canh)));
  ok('Mỗi ô của mẫu có trên tem: đúng khung, cỡ chữ, canh, khi nào in', thieu.length === 0, thieu.map(t => t.ten).join(' | '));
  ok('Ô dữ liệu dùng lại ô cũ (số thứ tự giữ nguyên): tên hàng 0, đơn giá 15, thành tiền 16, mã vạch 17, ngày in 26, hạn dùng 27',
    [[0, 'Tên hàng'], [15, 'Đơn giá'], [16, 'Thành tiền'], [17, 'Mã vạch'], [26, 'Ngày in'], [27, 'Hạn dùng'], [12, 'Trọng lượng / số lượng']]
      .every(([so, ten]) => o.some(x => x.subId === so && x.ten === ten)));
  ok('Ô chữ trùng chữ dùng lại ô cũ: "Ngày đóng gói" (số 20), "Đơn giá" (số 10, thành nhãn của hàng theo gói)',
    o.some(x => x.subId === 20 && x.chuIn === 'Ngày đóng gói') && o.some(x => x.subId === 10 && x.chuIn === 'Đơn giá' && x.inKhi === 3));
  const tat = kq!.daTat['28'].map(x => docO2(x.tho));
  ok('Ô không có trong mẫu được tắt và nhớ (bật lại được): số PLU, chữ "Thành tiền", "Trọng lượng", "HSD", tên quán cũ',
    tat.length === 5 && [1, 4, 5, 28, 29].every(so => tat.some(x => x.subId === so)), tat.map(x => x.subId).join());
  ok('Ô mới số 30 trở đi (logo + 7 ô chữ), chữ mới vào ô chữ trống (không đè chữ cũ của ô đã tắt)', o.filter(x => x.subId >= 30).length === 8
    && new Set(o.filter(x => x.loai === '3').map(x => x.chu)).size === 9 && !o.some(x => x.loai === '3' && [1, 3, 12, 16].includes(x.chu) && x.chuIn !== 'Đơn giá'));
  ok('Ô logo: hình số 1, đúng cỡ logo, góc trên phải (mép phải 448), giữa theo chiều cao mã vạch', o.some(x => x.loai === '6' && x.chu === ID_LOGO
    && x.ten === 'Logo Beeftown' && x.w === LOGO_TEM.rong && x.h === LOGO_TEM.cao && x.x + x.w === 448 && x.y + x.h / 2 === 10 + 74 / 2));
  ok('Ba số to (ngày đóng gói, hạn sử dụng, thành tiền) cùng cỡ 4, cùng hàng', ['Ngày in', 'Hạn dùng', 'Thành tiền']
    .every(t => o.some(x => x.ten === t && x.font === 4 && x.y === 154 && x.h === 52)));

  // Hình học: trong tem, không chồng nhau (trừ cặp nhãn cân ký / theo gói cùng một chỗ), cao đúng dòng chữ, chữ dài nhất vẫn vừa.
  const R = MAU_BEEFTOWN_CO.rong * 8, C = MAU_BEEFTOWN_CO.cao * 8;
  ok('Mọi ô trong tem 58×40 mm, cách mép dưới ít nhất 2 mm', o.every(x => x.x >= 0 && x.y >= 0 && x.x + x.w <= R && x.y + x.h <= C - 16));
  const chong: string[] = [];
  for (let i = 0; i < o.length; i++) for (let j = i + 1; j < o.length; j++) {
    const [a, b] = [o[i], o[j]];
    const cap = (a.inKhi === 2 && b.inKhi === 3) || (a.inKhi === 3 && b.inKhi === 2);
    if (!cap && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) chong.push(`${a.ten}/${b.ten}`);
  }
  ok('Không ô nào chồng ô nào (trừ "Khối lượng (kg)"/"Số lượng", "Đơn giá (đ/kg)"/"Đơn giá")', chong.length === 0, chong.join(' | '));
  const MAU_DAI: Record<string, string> = { 'Tên hàng': 'Thăn ngoại cắt lát #0142', 'Ngày in': '2026.11.02', 'Hạn dùng': '2026.11.05',
    'Trọng lượng / số lượng': '99.999', 'Đơn giá': '1.250.000', 'Thành tiền': '9.999.999' };
  const khongVua = o.filter(x => x.loai !== '0' && x.loai !== '6').filter(x => {
    const t = x.chuIn ?? MAU_DAI[x.ten];
    return t === undefined || [...t].length * CO_CHU[x.font].rong > x.w || x.h !== CO_CHU[x.font].cao;
  });
  ok('Chữ dài nhất vừa ô (tên 24 ký tự, ngày 2026.11.02, thành tiền 9.999.999) và cao ô = dòng chữ của cỡ chữ', khongVua.length === 0,
    khongVua.map(x => x.ten).join(' | '));
  ok('Bốn mép cột thẳng hàng: mép trái 4 / 162 / 320, mép phải 460 (trừ dòng thương hiệu)',
    o.filter(x => x.inKhi !== 0 && x.canh4 === 4).every(x => [4, 162, 320].includes(x.x)) && o.filter(x => x.w === 456 || x.x === 320).every(x => x.x + x.w === 460));

  // Phần khác của file giữ nguyên.
  const truoc = docFileCan(goc), sau = docFileCan(kq!.du);
  const ngoaiLab = (f: typeof truoc) => f.dong.filter((_, i) => !f.phan.LAB || i < f.phan.LAB.dau || i > f.phan.LAB.cuoi);
  ok('Phần khác của file (PLU, TMS, TIM) và mẫu tem 1 giữ từng byte', JSON.stringify(ngoaiLab(truoc)) === JSON.stringify(ngoaiLab(sau))
    && JSON.stringify(sau.dong.slice(sau.phan.LAB!.dau, sau.phan.LAB!.dau + 1 + MAU_1.length)) === JSON.stringify(truoc.dong.slice(truoc.phan.LAB!.dau, truoc.phan.LAB!.dau + 1 + MAU_1.length)));

  // Áp lần hai: không có gì đổi (bấm hai lần, hay mở lại thẻ sau khi gửi).
  const lan2 = mauBeeftown(kq!.du, kq!.daTat);
  ok('Áp lần hai trên tem đã đúng mẫu: không có gì đổi, không lý do', lan2.thay === null && lan2.lyDo === null, JSON.stringify(lan2));
  ok('Tem đã đúng mẫu: không còn gợi ý HSD (nhãn "Hạn sử dụng" và ô hạn dùng đã "chỉ khi có hạn dùng")', goiYHsd(docFileCan(kq!.du), kq!.daTat).length === 0);

  // Tem đã xếp theo bản 2.12 (chữ BEEFTOWN góc trên phải, dòng địa chỉ cuối tem): bấm lại → hai ô đó tắt, nhớ để bật lại
  // (cân không in được logo thì bật lại chữ BEEFTOWN, bỏ chọn ô logo).
  const { kq: kqB } = ap(file28([...O_28, [30, 3, 5, 0, 1, 0, 5, 0, 4, 282, 456, 18]], { ...CHU_28, 18: 'BEEFTOWN', 11: 'Tầng 3, 63 Hồ Tùng Mậu' }));
  const tatB = kqB!.daTat['28'].map(x => docO2(x.tho).subId);
  ok('Tem bản 2.12 (chữ BEEFTOWN, dòng địa chỉ): bấm lại thì hai ô đó tắt và được nhớ; tem có ô logo',
    tatB.includes(29) && tatB.includes(30) && !oSauKhiAp(kqB!.du).some(x => x.chuIn === 'BEEFTOWN' || x.chuIn === 'Tầng 3, 63 Hồ Tùng Mậu')
    && temDungLogo(docFileCan(kqB!.du)), tatB.join());

  // Tem thiếu ô: thêm theo O_THEM_DUOC; ô xoay được xoay về 0.
  const { kq: kqThieu } = ap(file28(bien({ 0: [0, 1, 0, 0, 1, 1, 5, 5, 400, 0, 408, 43] }, [8, 11])));
  const oThieu = oSauKhiAp(kqThieu!.du);
  ok('Tem không có mã vạch, hạn dùng: thêm ô mới đúng chỗ; tên hàng đang xoay 90° về 0°',
    oThieu.some(x => x.ten === 'Mã vạch' && x.subId >= 30 && x.x === 4 && x.y === 10) && oThieu.some(x => x.ten === 'Hạn dùng' && x.subId >= 30 && x.inKhi === 9)
    && oThieu.some(x => x.ten === 'Tên hàng' && x.subId === 0 && x.xoay === 0 && x.x === 4) && oThieu.length === 17);

  // Không áp được: lý do rõ, không bao giờ trả thay đổi hỏng.
  const khac40 = mauBeeftown(fileCan([...MAU_1, dongLab('28', 'THU', CHU_28, { rong: 40, cao: 30 }), ...O_28.map(las), 'LAE\t']), {});
  ok('Tem 40×30 mm: không áp, nói cỡ tem', khac40.thay === null && /58×40 mm/.test(khac40.lyDo ?? '') && /40×30 mm/.test(khac40.lyDo ?? ''), String(khac40.lyDo));
  const MAU_27 = [dongLab('27', 'CONG DON', { 6: 'Hàng' }, { rong: 58, cao: 40 }), las([0, 2, 0, 0, 1, 0, 0, 5, 0, 0, 384, 26]),
    las([1, 5, 0, 0, 1, 0, 0, 0, 20, 26, 200, 50]), 'LAE\t'];
  const pv = mauBeeftown(fileCan([...MAU_1, ...MAU_27], '27'), {});
  ok('Mẫu có Phân vùng: không áp, câu Phân vùng như mục Mẫu tem', pv.thay === null && pv.lyDo === CAU_PHAN_VUNG);
  const gan99 = mauBeeftown(file28(bien({ 13: [95, ...O_28[13].slice(1)] })), {});
  ok('Số thứ tự ô gần 99 (ô mới không đủ số): không áp, nói lý do của suaTem', gan99.thay === null && /số thứ tự ô 99/.test(gan99.lyDo ?? ''), String(gan99.lyDo));
  ok('Không có mẫu tem: không áp', mauBeeftown(fileCan([]), {}).thay === null);

  // Tên công ty trên tem khớp chữ pháp lý của website (web/src/lib/chu.ts).
  const chuTs = await Bun.file(new URL('../../web/src/lib/chu.ts', import.meta.url)).text();
  ok('Tên công ty = PHAP_NHAN.ten của web/src/lib/chu.ts; tem không còn dòng địa chỉ (bỏ từ 2.13)',
    chuTs.includes(`ten: '${TEN_CONG_TY_TREN_TEM}'`) && !o.some(x => /Hồ Tùng Mậu/.test(x.chuIn ?? '')));
}

/** Giải dữ liệu của dòng BMP (hai chữ '@'…'O' mỗi byte) — để kiểm thử đọc lại đúng thứ đã mã hoá. */
function giaiBmp(d: string): { id: number; du: number[] } {
  const f = d.split('\t');
  const du: number[] = [];
  for (let i = 0; i < f[2].length; i += 2) du.push(((f[2].charCodeAt(i) - 64) << 4) | (f[2].charCodeAt(i + 1) - 64));
  return { id: Number(f[1]), du };
}

async function thuLogo(ok: Ok): Promise<void> {
  // Logo đen trắng tạo từ SVG của bộ nhận diện (scripts/tao-logo-tem.ts): đúng nguồn, đúng cỡ, có chấm đen.
  const svg = await Bun.file(new URL('../../' + LOGO_TEM.nguon, import.meta.url)).text();
  ok('Logo tạo từ đúng SVG hiện tại (sha256 khớp — SVG đổi thì chạy lại scripts/tao-logo-tem.ts)',
    LOGO_TEM.nguon === 'web/public/thuong-hieu/chu-beeftown-den.svg' && createHash('sha256').update(svg).digest('hex') === LOGO_TEM.sha256Nguon);
  const den = LOGO_TEM.hang.join('').split('').reduce((n, c) => n + (parseInt(c, 16).toString(2).match(/1/g)?.length ?? 0), 0);
  ok('Logo 184 × 26 chấm (23 × 3,25 mm), mỗi hàng 23 byte, có chấm đen và chấm trắng', LOGO_TEM.rong === 184 && LOGO_TEM.cao === 26
    && LOGO_TEM.hang.length === 26 && LOGO_TEM.hang.every(h => /^[0-9a-f]{46}$/.test(h)) && den > 1000 && den < 184 * 26 - 1000, String(den));

  // Dòng BMP: đầu 96 byte (số hình, rộng, cao — byte thấp trước — rồi 88 byte 0), các hàng chấm, mỗi byte hai chữ '@'…'O'.
  const { id, du } = giaiBmp(DONG_LOGO);
  ok('Dòng BMP của logo: "BMP⇥1⇥…⇥", toàn chữ @…O, đầu 96 byte đúng số hình / rộng / cao, sau đó đúng từng byte của logo',
    /^BMP\t1\t[@-O]+\t$/.test(DONG_LOGO) && id === 1 && du.length === 96 + 23 * 26
    && du[0] === 1 && du[1] === 0 && du[2] === 0 && du[3] === 0 && du[4] === 184 && du[5] === 0 && du[6] === 26 && du[7] === 0
    && du.slice(8, 96).every(b => b === 0)
    && du.slice(96).map(b => b.toString(16).padStart(2, '0')).join('') === LOGO_TEM.hang.join(''));
  const le = giaiBmp(dongBmp(7, { rong: 10, cao: 2, hang: ['ffff', '8040'] })).du.slice(96);
  ok('Hình rộng không chia hết cho 8: bit thừa cuối hàng ghi 0 (trắng); số hình 7 vào đầu', JSON.stringify(le) === JSON.stringify([0xFF, 0xC0, 0x80, 0x40])
    && giaiBmp(dongBmp(7, { rong: 10, cao: 2, hang: ['ffff', '8040'] })).du[0] === 7);
  ok('Hình sai bị từ chối: số hình 0 / 256, hàng thiếu byte, sai số hàng, quá 432 chấm',
    [() => dongBmp(0, LOGO_TEM), () => dongBmp(256, LOGO_TEM), () => dongBmp(1, { rong: 16, cao: 1, hang: ['ff'] }),
      () => dongBmp(1, { rong: 8, cao: 2, hang: ['ff'] }), () => dongBmp(1, { rong: 440, cao: 1, hang: ['00'.repeat(55)] })]
      .every(f => /Số hình|Hình không đúng cỡ/.test(loiCua(f))));

  // Cổng ghi (giao-thuc.ts kiemKhoiGhi): nhận khối BMP đúng dạng, chặn dòng hỏng trước khi gửi byte nào.
  const loiGhi = (k: string[]) => { try { kiemKhoiGhi(k); return ''; } catch (e) { return (e as Error).message; } };
  ok('Cổng ghi nhận khối logo đi trước khối mẫu tem', kiemDongBmp(DONG_LOGO) === null
    && loiGhi(['DWL\tBMP\t', DONG_LOGO, 'END\tBMP\t', 'DWL\tLAB\t', ...mau28().map(d => Buffer.from(d, 'utf8').toString('latin1')), 'END\tLAB\t']) === '');
  const sai = [
    DONG_LOGO.replace('BMP\t1\t', 'BMP\t2\t'),                       // số hình ở cột 2 khác số trong đầu
    DONG_LOGO.slice(0, -3) + '\t',                                     // thiếu một chữ
    DONG_LOGO.slice(0, -2) + 'Z\t',                                    // chữ ngoài @…O
    DONG_LOGO.replace('BMP\t1\t', 'BMP\t300\t'),                     // số hình quá 255
    'BMP\t1\t' + 'A'.repeat(100) + '\t',                              // thiếu đầu 96 byte
  ];
  ok('Cổng ghi chặn dòng BMP hỏng: sai số hình, thiếu / thừa dữ liệu, chữ lạ, số hình quá 255, thiếu đầu',
    sai.every(d => kiemDongBmp(d) !== null && /hình|BMP/.test(loiGhi(['DWL\tBMP\t', d, 'END\tBMP\t']))), sai.map(d => kiemDongBmp(d)).join(' | '));
  ok('Cổng ghi vẫn chặn phần khác: FNT, VER, CLR BMP', /FNT/.test(loiGhi(['DWL\tFNT\t', 'FNT\tAA\t', 'END\tFNT\t']))
    && /VER/.test(loiGhi(['DWL\tVER\t', 'VER\tAA\t', 'END\tVER\t'])) && /BMP/.test(loiGhi(['CLR\tBMP\t', 'CLR\tEND\t'])));

  // File và khối gửi: tem có ô logo → kèm logo; không có → nguyên như cũ.
  const goc = file28();
  const mb = mauBeeftown(goc, {});
  const daAp = suaTem(goc, {}, mb.thay!).du;
  const coLogo = kemLogo(daAp);
  const dong = docFileCan(coLogo).dong;
  const iBmp = dong.indexOf('DWL\tBMP\t'), iLab = dong.indexOf('DWL\tLAB\t');
  ok('Tem có ô logo: file thêm phần BMP (DWL BMP, dòng logo, END BMP, dòng trống) ngay trước phần LAB; phần khác giữ nguyên',
    iBmp >= 0 && iBmp < iLab && dong[iBmp + 1] === DONG_LOGO && dong[iBmp + 2] === 'END\tBMP\t' && dong[iBmp + 3] === ''
    && JSON.stringify(dong.filter((_, i) => i < iBmp || i > iBmp + 3)) === JSON.stringify(docFileCan(daAp).dong));
  ok('Kèm logo lần hai: file y nguyên (không thêm phần BMP thứ hai)', bang(kemLogo(coLogo), coLogo));
  ok('Tem không có ô logo: file y nguyên, không khối gửi logo', bang(kemLogo(goc), goc) && khoiLogo(docFileCan(goc)).length === 0);
  ok('Tem có ô logo: khối gửi là DWL BMP, dòng logo, END BMP', JSON.stringify(khoiLogo(docFileCan(coLogo))) === JSON.stringify(['DWL\tBMP\t', DONG_LOGO, 'END\tBMP\t']));
  // Phần BMP có sẵn: hình khác số thì thêm logo vào cùng phần; hình số 1 khác thì thay; thiếu END thì báo, không đoán.
  const voiBmp = (bmp: string[]) => {
    const L = docFileCan(daAp).dong.slice(); L.splice(L.indexOf('DWL\tLAB\t'), 0, 'DWL\tBMP\t', ...bmp, '');
    return new TextEncoder().encode(L.join('\r\n'));
  };
  const hinh2 = dongBmp(2, { rong: 8, cao: 1, hang: ['ff'] });
  const d2 = docFileCan(kemLogo(voiBmp([hinh2, 'END\tBMP\t']))).dong;
  ok('Phần BMP đã có hình số 2: thêm logo vào cùng phần, giữ hình số 2', d2.filter(d => d === 'DWL\tBMP\t').length === 1
    && d2.includes(hinh2) && d2.includes(DONG_LOGO));
  const cu1 = dongBmp(1, { rong: 8, cao: 1, hang: ['0f'] });
  const d1 = docFileCan(kemLogo(voiBmp([cu1, 'END\tBMP\t']))).dong;
  ok('Hình số 1 khác (logo cũ): thay bằng logo Beeftown', d1.includes(DONG_LOGO) && !d1.includes(cu1));
  ok('Phần BMP thiếu END: báo lỗi, không đoán', /thiếu dòng kết thúc/.test(loiCua(() => kemLogo(voiBmp([hinh2])))));
}

/** Đọc một dòng LAS (dòng ô đã tắt trong tem-da-tat.json). */
const docO2 = (tho: string) => ({ subId: Number(tho.split('\t')[1]) });

// Chạy riêng: npx bun test/thu-tem.ts
if (import.meta.main) {
  let dat = 0, hong = 0;
  const ok: Ok = (ten, dieuKien, chiTiet = '') => {
    if (dieuKien) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten} ${chiTiet}`); }
  };
  await thuTem(ok);
  console.log(hong === 0 ? `\nTẤT CẢ ${dat} KIỂM TRA MẪU TEM ĐỀU ĐẠT` : `\n${hong} KIỂM TRA HỎNG / ${dat + hong}`);
  process.exit(hong === 0 ? 0 : 1);
}
