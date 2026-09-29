/**
 * Kiểm thử nhật ký bán của cân (src/bao-cao-can.ts) — chỉ dữ liệu giả, không
 * dùng tên hàng thật, không đọc file cân thật:
 *
 *     cd can-app && npx bun test/thu-bao-cao-can.ts
 *
 * test/thu.ts gọi thuBaoCaoCan(ok) cùng các phần khác.
 * Dòng giả theo đúng dạng file cân thật V3.14E8 (REP 11 cột, RES 19 cột, REE 2).
 */
import { giaTuFile, docFileCan, sangChuoiByte } from '../../web/src/lib/kho/can-tma.ts';
import {
  PLU_HE_THONG, TEN_LOAI, docKhoNhatKy, docNhatKy, ghiChuDong, ghiKhoNhatKy, gopNhatKy, laTheoCai, nhatKyTuFile,
  pluLucDocTuDong, sangCsv, soKieuViet, soTuFile, tenLoai, tienTuFile, tomTatNhatKy, tuyChonTuThongSo,
  type DongBanCan, type PluLucDoc, type TuyChonNhatKy,
} from '../src/bao-cao-can.ts';

type Ok = (ten: string, dieuKien: boolean, chiTiet?: string) => void;

// ---- Dòng giả -----------------------------------------------------------------
/** Chữ → chuỗi byte UTF-8, như dòng đọc từ file cân. */
const byte = (t: string) => sangChuoiByte(new TextEncoder().encode(t));
const rep = (nam: number, thang: number, ngay: number, gio: number, phut: number, giay: number, fid: number | string, sid: number) =>
  `REP\t${nam}\t${thang}\t${ngay}\t${gio}\t${phut}\t${giay}\t${fid}\t${sid}\t0\t`;
interface ORes { stt?: number | string; tien: string; plu: number; sl: string; dv?: number | string; loai?: number; donGia: string; chu1?: string; ten: string }
const res = (o: ORes) =>
  `RES\t${o.stt ?? 1}\t${o.tien}\t${o.plu}\t9\t9\t0,3\t${o.sl}\t${o.dv ?? 3}\t${o.loai ?? 0}\t0,3\t${o.chu1 ?? ''}\t\t\t\t${o.donGia}\t0\t${o.ten}\t`;
const SU_KIEN = 'RES\t0\t0,0\t0\t0\t0\t0,0\t0,0\t2\t1254\t0,0\tUA006 V3.14E8\t\t\t\t0,0\t0\tx\t';

const TEN_1 = 'Hàng thử Một', TEN_3 = 'Hàng thử Ba';
const NHAT_KY = [
  'DWL\tREP\t',
  rep(24, 4, 1, 7, 57, 23, 2, 0), SU_KIEN, 'REE\t',
  rep(24, 4, 2, 9, 0, 0, 11, 1), res({ tien: '22000,3', plu: 3, sl: '1,0', dv: 2, donGia: '22000,3', ten: byte(TEN_3) }), 'REE\t',
  rep(26, 9, 21, 10, 0, 5, 25, 0), res({ tien: '-50700,3', plu: 1, sl: '-6,2', loai: 2, donGia: '845000,3', ten: byte(TEN_1) }), 'REE\t',
  rep(26, 9, 25, 15, 17, 35, 30, 2), res({ tien: '0,3', plu: 9999999, sl: '9000,3', donGia: '0,3', ten: 'T-Weight PLU' }), 'REE\t',
  rep(26, 9, 25, 17, 17, 1, 31, 3), res({ tien: '59150,3', plu: 1, sl: '7,2', donGia: '845000,3', ten: byte(TEN_1) }), 'REE\t',
  rep(26, 9, 26, 18, 10, 21, 32, 0), res({ tien: '126750,3', plu: 1, sl: '15,2', loai: 2, donGia: '845000,3', ten: byte(TEN_1) }), 'REE\t',
  'END\tREP\t',
];
const TUY: TuyChonNhatKy = { mac: 'aa:bb:cc:dd:ee:01', soLeDonGia: 3, soLeTien: 3 };

/** So sánh sâu, không phụ thuộc thứ tự khoá. */
function giong(a: unknown, b: unknown): boolean {
  const chuan = (x: unknown): unknown => Array.isArray(x) ? x.map(chuan)
    : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map(k => [k, chuan((x as Record<string, unknown>)[k])])) : x;
  return JSON.stringify(chuan(a)) === JSON.stringify(chuan(b));
}

const KHUON_PLU = 'PLU\t{1}\t{2}\t\t{4}\t{5}\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\t{15}\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\tx\t0\t0\t0\t';
const plu = (so: number, ma: string, cachBan: string, gia: string, ten: string) =>
  KHUON_PLU.replace('{1}', String(so)).replace('{2}', ma).replace('{4}', cachBan).replace('{5}', gia).replace('{15}', ten);

/** File USB giả (dạng như file cân thật): PLU, REP, TMS, INF. Dòng là chữ; mã hoá UTF-8 khi ghép. */
function fileCan(o: { rep?: string[]; tms?: string[]; inm?: boolean } = {}): Uint8Array {
  const L = ['ECS\tVER\tV3.14E8\t', '',
    'DWL\tPLU\t', plu(1, '10001', '1', '845,0', TEN_1), plu(3, '10003', '1', '695,0', TEN_3), 'END\tPLU\t', '',
    ...(o.rep ? [...o.rep, ''] : []),
    'DWL\tTMS\t', ...(o.tms ?? ['TMS\t0\t28\t', 'TMS\t202\t3\t', 'TMS\t203\t3\t']), 'END\tTMS\t', '',
    'DWL\tINF\t', 'INA\t0\tUTF-8\t0\t0\t8388608\t7\t7\t', ...(o.inm === false ? [] : ['INM\tAABBCCDDEE01\tAABBCCDDEE01\t0\t']),
    'INF\tQuan thu\tCan thu\t1\tV3.14E8\t', 'END\tINF\t', '', 'END\tECS\t', ''];
  // Tên đưa vào dạng chữ: mã hoá cả file một lần (tên trong NHAT_KY đã là byte → giải lại cho đúng).
  const chu = L.map(d => (/[^\x00-\xff]/.test(d) ? d : new TextDecoder().decode(Uint8Array.from(d, ch => ch.charCodeAt(0))))).join('\r\n');
  return new TextEncoder().encode(chu);
}

/** Dòng nhật ký dựng tay cho phần tóm tắt / CSV / lưu. */
const dongGia = (o: Partial<DongBanCan> & Pick<DongBanCan, 'fid' | 'luc'>): DongBanCan => {
  const loai = o.loai ?? 0, sp = o.plu ?? 1;
  return {
    mac: 'AABBCCDDEE01', sid: 1, stt: 1, plu: sp, ten: 'Hàng thử', maCan: '10001', loai, tenLoai: tenLoai(loai),
    tinhKho: (loai === 0 || loai === 1) && sp < PLU_HE_THONG, soLuong: 0.1, theoCai: false, donGia: 845000, thanhTien: 84500, ...o,
  };
};

export async function thuBaoCaoCan(ok: Ok): Promise<void> {
  console.log('\n— Nhật ký bán của cân (bao-cao-can.ts)');

  // ---- Danh mục loại ----------------------------------------------------------
  ok('Nhật ký cân: có đủ 33 loại như danh sách của hãng', Object.keys(TEN_LOAI).length === 33, String(Object.keys(TEN_LOAI).length));
  ok('Nhật ký cân: tên loại 0 / 1 / 2 / 3',
    tenLoai(0) === 'Bán' && tenLoai(1) === 'Trả hàng' && tenLoai(2) === 'Cân chưa in tem' && tenLoai(3) === 'Đã xoá khỏi phiếu');
  ok('Nhật ký cân: sự kiện = 256 + mã (1254 = E9.98, 308 = A52, 777 = P521)',
    tenLoai(1254).includes('E9.98') && tenLoai(308).includes('A52') && tenLoai(777).includes('P521'));
  ok('Nhật ký cân: sự kiện chưa có tên hiện mã lỗi (451 → E1.95), loại lạ hiện số',
    tenLoai(451) === 'Sự kiện E1.95' && tenLoai(16) === 'Loại 16', `${tenLoai(451)} / ${tenLoai(16)}`);
  ok('Nhật ký cân: đơn vị 2 và từ 20 trở lên là cái; 1, 3 (kg), 4 (g) là cân ký',
    laTheoCai(2) && laTheoCai(25) && !laTheoCai(1) && !laTheoCai(3) && !laTheoCai(4));

  // ---- Số ---------------------------------------------------------------------
  ok('Nhật ký cân: số lượng "7,2" = 0,07 · "48,2" = 0,48 · "9" = 9 · "-6,2" = -0,06 · "9000,3" = 9',
    soTuFile('7,2') === 0.07 && soTuFile('48,2') === 0.48 && soTuFile('9') === 9 && soTuFile('-6,2') === -0.06 && soTuFile('9000,3') === 9);
  ok('Nhật ký cân: số sai định dạng → null', [undefined, '', 'abc', '1,', ',2', '1.5', '1,2,3'].every(x => soTuFile(x) === null));
  ok('Nhật ký cân: "16000,3" với 3 số lẻ → 16.000 đ, đúng như giaTuFile', tienTuFile('16000,3', 3) === 16000 && giaTuFile('16000,3', 3) === 16000);
  const cacSo = ['16000,3', '845,0', '59150,3', '888,2', '60000,3', '0,3', '-6000,3', '1105,1', '7,5'];
  const khac = cacSo.flatMap(t => [0, 2, 3].map(s => [t, s] as const)).filter(([t, s]) => tienTuFile(t, s) !== giaTuFile(t, s));
  ok('Nhật ký cân: mọi số có dấu phẩy quy ra đồng y như giaTuFile (số lẻ 0 / 2 / 3)', khac.length === 0, JSON.stringify(khac));
  ok('Nhật ký cân: tiền không có dấu phẩy là số nguyên ("845" với 3 → 845.000 đ); sai → null',
    tienTuFile('845', 3) === 845000 && tienTuFile('x', 3) === null && tienTuFile(undefined, 3) === null);
  ok('Nhật ký cân: số kiểu Việt — 1.234.567,5 · 0,070 · -0,060 · 845.000 · không có "-0"',
    soKieuViet(1234567.5, 3) === '1.234.567,5' && soKieuViet(0.07, 3, true) === '0,070' && soKieuViet(-0.06, 3, true) === '-0,060'
    && soKieuViet(845000) === '845.000' && soKieuViet(-0.0001, 3) === '0' && soKieuViet(999) === '999',
    [soKieuViet(1234567.5, 3), soKieuViet(0.07, 3, true), soKieuViet(-0.06, 3, true), soKieuViet(845000), soKieuViet(-0.0001, 3)].join(' | '));

  // ---- Đọc nhật ký ------------------------------------------------------------
  const truoc = JSON.stringify(NHAT_KY);
  const kq = docNhatKy(NHAT_KY, TUY);
  ok('Nhật ký cân: không sửa mảng dòng đưa vào', JSON.stringify(NHAT_KY) === truoc);
  ok('Nhật ký cân: 5 dòng hàng, 1 sự kiện, không lỗi', kq.dong.length === 5 && kq.suKien.length === 1 && kq.loi.length === 0,
    JSON.stringify({ dong: kq.dong.length, suKien: kq.suKien.length, loi: kq.loi }));
  const sk = kq.suKien[0];
  ok('Nhật ký cân: sự kiện FID 2 — loại 1254, giờ, chữ firmware', sk?.fid === 2 && sk.loai === 1254 && sk.luc === '2024-04-01 07:57:23'
    && sk.ghiChu === 'UA006 V3.14E8' && sk.tenLoai.includes('E9.98'), JSON.stringify(sk));
  const ban = kq.dong.find(d => d.fid === 31);
  ok('Nhật ký cân: dòng bán FID 31 — giờ, SID, SubID, PLU, MAC chuẩn hoá',
    ban?.luc === '2026-09-25 17:17:01' && ban.sid === 3 && ban.stt === 1 && ban.plu === 1 && ban.mac === 'AABBCCDDEE01', JSON.stringify(ban));
  ok('Nhật ký cân: 0,07 kg × 845.000 đ = 59.150 đ, tính kho, loại Bán',
    ban?.soLuong === 0.07 && !ban.theoCai && ban.donGia === 845000 && ban.thanhTien === 59150 && ban.tinhKho && ban.loai === 0 && ban.tenLoai === 'Bán',
    JSON.stringify(ban));
  ok('Nhật ký cân: tên hàng đọc từ byte UTF-8 ra chữ có dấu', ban?.ten === TEN_1, ban?.ten);
  ok('Nhật ký cân: không có bảng PLU thì mã cân để trống', kq.dong.every(d => d.maCan === ''));
  const chuaIn = kq.dong.find(d => d.fid === 32);
  ok('Nhật ký cân: loại 2 (cân chưa in tem) không tính kho, SID 0',
    chuaIn?.loai === 2 && !chuaIn.tinhKho && chuaIn.sid === 0 && chuaIn.tenLoai === 'Cân chưa in tem', JSON.stringify(chuaIn));
  const canTam = kq.dong.find(d => d.fid === 30);
  ok('Nhật ký cân: bán bằng PLU hệ thống 9999999 (cân tạm) không tính kho', canTam?.loai === 0 && !canTam.tinhKho && canTam.soLuong === 9, JSON.stringify(canTam));
  const cai = kq.dong.find(d => d.fid === 11);
  ok('Nhật ký cân: hàng đếm cái (đơn vị 2) — 1 cái × 22.000 đ', cai?.theoCai === true && cai.soLuong === 1 && cai.donGia === 22000 && cai.thanhTien === 22000,
    JSON.stringify(cai));
  const am = kq.dong.find(d => d.fid === 25);
  ok('Nhật ký cân: số âm giữ nguyên dấu (-0,06 kg, -50.700 đ)', am?.soLuong === -0.06 && am.thanhTien === -50700, JSON.stringify(am));
  ok('Nhật ký cân: giữ thứ tự dòng như nhật ký', kq.dong.map(d => d.fid).join() === '11,25,30,31,32');

  const nhatKyChu = NHAT_KY.map(d => (d.startsWith('RES\t') ? new TextDecoder().decode(Uint8Array.from(d, ch => ch.charCodeAt(0))) : d));
  ok('Nhật ký cân: dòng đã đổi sang chữ cũng đọc ra đúng tên', giong(docNhatKy(nhatKyChu, TUY), kq));
  const lf = NHAT_KY.map(d => d + '\r');
  ok('Nhật ký cân: dòng còn dính \\r (tách theo LF) đọc như thường', giong(docNhatKy(lf, TUY), kq));
  const xuongDong = docNhatKy([rep(26, 9, 25, 1, 2, 3, 40, 1), res({ tien: '1,0', plu: 1, sl: '1,0', donGia: '1,0', ten: byte('Dòng một\vdòng hai') }), 'REE\t'], TUY);
  ok('Nhật ký cân: "\\v" trong tên (xuống dòng của cân) thành dấu cách', xuongDong.dong[0]?.ten === 'Dòng một dòng hai', xuongDong.dong[0]?.ten);

  // ---- Mã cân -----------------------------------------------------------------
  const theoMap = docNhatKy(NHAT_KY, { ...TUY, maTheoPlu: new Map([[1, '010001'], [3, '10003'], [9999999, '99']]) });
  ok('Nhật ký cân: maTheoPlu gắn thẳng mã cân (chuẩn hoá "010001" → "10001")',
    theoMap.dong.find(d => d.fid === 31)?.maCan === '10001' && theoMap.dong.find(d => d.fid === 11)?.maCan === '10003');
  ok('Nhật ký cân: PLU hệ thống không bao giờ có mã cân', theoMap.dong.find(d => d.fid === 30)?.maCan === '');
  const bang = new Map<number, PluLucDoc>([[1, { ma: '10001', donGia: 845000, theoCai: false }], [3, { ma: '10003', donGia: 695000, theoCai: false }]]);
  const coKiem = docNhatKy(NHAT_KY, { ...TUY, pluLucDoc: bang, maTheoPlu: new Map([[3, '10003']]) });
  ok('Nhật ký cân: bảng PLU lúc đọc — đơn giá và cách bán khớp thì nhận mã (cả dòng chưa in tem)',
    coKiem.dong.find(d => d.fid === 31)?.maCan === '10001' && coKiem.dong.find(d => d.fid === 32)?.maCan === '10001');
  ok('Nhật ký cân: số PLU nay là hàng khác (giá / cách bán khác) → mã trống, không lấy maTheoPlu',
    coKiem.dong.find(d => d.fid === 11)?.maCan === '', JSON.stringify(coKiem.dong.find(d => d.fid === 11)));
  const cungGiaKhacCach = docNhatKy(NHAT_KY, { ...TUY, pluLucDoc: new Map([[3, { ma: '10003', donGia: 22000, theoCai: false }]]) });
  ok('Nhật ký cân: cùng đơn giá nhưng khác cách bán (ký / cái) → mã trống', cungGiaKhacCach.dong.find(d => d.fid === 11)?.maCan === '');
  const coChu = [rep(26, 9, 27, 8, 0, 0, 50, 1), res({ tien: '84500,3', plu: 1, sl: '1,1', donGia: '845000,3', chu1: '012345', ten: 'x' }), 'REE\t',
    rep(26, 9, 27, 8, 1, 0, 51, 2), res({ tien: '84500,3', plu: 1, sl: '1,1', donGia: '845000,3', ten: 'x' }), 'REE\t'];
  const theoChu = docNhatKy(coChu, { ...TUY, oMaCan: 1, pluLucDoc: bang });
  ok('Nhật ký cân: ô Chữ mang mã hàng (Spec290 = 9) được dùng trước; ô trống thì theo bảng PLU',
    theoChu.dong[0]?.maCan === '12345' && theoChu.dong[1]?.maCan === '10001', theoChu.dong.map(d => d.maCan).join());

  // ---- Số lẻ riêng cho đơn giá / thành tiền, mỗi số mang số lẻ riêng ----------
  const soLe = docNhatKy([rep(26, 9, 27, 9, 0, 0, 60, 1), res({ tien: '59150,0', plu: 1, sl: '7,2', donGia: '845,0', ten: 'x' }), 'REE\t'],
    { mac: 'AABBCCDDEE01', soLeDonGia: 2, soLeTien: 0 });
  ok('Nhật ký cân: đơn giá theo Spec202, thành tiền theo Spec203', soLe.dong[0]?.donGia === 84500 && soLe.dong[0]?.thanhTien === 59150,
    JSON.stringify(soLe.dong[0]));
  const moiSo = docNhatKy([rep(24, 4, 3, 9, 0, 0, 5, 1), res({ tien: '28800,3', plu: 2, sl: '48,2', donGia: '60000,3', ten: 'x' }), 'REE\t',
    rep(24, 4, 3, 9, 5, 0, 6, 2), res({ tien: '888,2', plu: 2, sl: '1,0', dv: 2, donGia: '888,2', ten: 'x' }), 'REE\t'], TUY);
  ok('Nhật ký cân: mỗi số mang số lẻ riêng ("60000,3" = 60.000 đ, "888,2" = 8.880 đ, "48,2" = 0,48 kg)',
    moiSo.dong[0]?.donGia === 60000 && moiSo.dong[0]?.thanhTien === 28800 && moiSo.dong[0]?.soLuong === 0.48 && moiSo.dong[1]?.donGia === 8880,
    JSON.stringify(moiSo.dong));

  // ---- Đơn vị -----------------------------------------------------------------
  const donVi = docNhatKy([rep(26, 9, 27, 10, 0, 0, 70, 1),
    res({ stt: 1, tien: '1,0', plu: 1, sl: '500', dv: 4, donGia: '1,0', ten: 'x' }),
    res({ stt: 2, tien: '1,0', plu: 1, sl: '1', dv: 6, donGia: '1,0', ten: 'x' }),
    res({ stt: 3, tien: '1,0', plu: 1, sl: '3', dv: 25, donGia: '1,0', ten: 'x' }),
    res({ stt: 4, tien: '1,0', plu: 1, sl: '2', dv: 0, donGia: '1,0', ten: 'x' }), 'REE\t'], TUY);
  ok('Nhật ký cân: đơn vị g → kg (500 g = 0,5 kg), lb → kg (1 lb = 0,453592 kg)',
    donVi.dong[0]?.soLuong === 0.5 && !donVi.dong[0].theoCai && donVi.dong[1]?.soLuong === 0.453592, donVi.dong.map(d => d.soLuong).join());
  ok('Nhật ký cân: đơn vị ≥ 20 là cái, đơn vị 0 lạ → coi là cái và báo',
    donVi.dong[2]?.theoCai === true && donVi.dong[2].soLuong === 3 && donVi.dong[3]?.theoCai === true
    && donVi.loi.length === 1 && /đơn vị "0" lạ/.test(donVi.loi[0]), JSON.stringify(donVi.loi));

  // ---- Dòng hỏng --------------------------------------------------------------
  const hong = (dong: string[]) => docNhatKy(dong, TUY);
  const repThieu = hong(['REP\t26\t9\t25\t', res({ tien: '1,0', plu: 1, sl: '1,0', donGia: '1,0', ten: 'x' }), 'REE\t']);
  ok('Nhật ký cân: REP thiếu cột → bỏ giao dịch đó, báo một lỗi', repThieu.dong.length === 0 && repThieu.loi.length === 1 && /REP thiếu cột/.test(repThieu.loi[0]),
    JSON.stringify(repThieu.loi));
  const resThieu = hong([rep(26, 9, 25, 1, 1, 1, 80, 1), 'RES\t1\t1,0\t1\t9\t9\t', 'REE\t']);
  ok('Nhật ký cân: RES thiếu cột → bỏ dòng đó, báo lỗi', resThieu.dong.length === 0 && resThieu.loi.length === 1 && /RES thiếu cột/.test(resThieu.loi[0]));
  const resLe = hong([res({ tien: '1,0', plu: 1, sl: '1,0', donGia: '1,0', ten: 'x' })]);
  ok('Nhật ký cân: RES không có REP → bỏ, báo lỗi', resLe.dong.length === 0 && /không nằm trong giao dịch/.test(resLe.loi[0] ?? ''));
  const fid0 = hong([rep(26, 9, 25, 1, 1, 1, 0, 1), res({ tien: '1,0', plu: 1, sl: '1,0', donGia: '1,0', ten: 'x' }), 'REE\t']);
  ok('Nhật ký cân: FID 0 (hãng gọi là "trùng") → bỏ giao dịch', fid0.dong.length === 0 && fid0.loi.length === 1 && /FID/.test(fid0.loi[0]));
  const ngaySai = hong([rep(26, 2, 31, 1, 1, 1, 81, 1), res({ tien: '1,0', plu: 1, sl: '1,0', donGia: '1,0', ten: 'x' }), 'REE\t',
    rep(26, 13, 1, 1, 1, 1, 82, 1), 'REE\t', rep(26, 1, 1, 24, 0, 0, 83, 1), 'REE\t']);
  ok('Nhật ký cân: ngày không có thật (31/02, tháng 13, 24 giờ) → bỏ, báo lỗi giờ', ngaySai.dong.length === 0 && ngaySai.loi.length === 3
    && ngaySai.loi.every(l => /giờ/.test(l)), JSON.stringify(ngaySai.loi));
  const hoSub = hong([rep(26, 9, 25, 1, 1, 1, 84, 1), res({ stt: 1, tien: '1,0', plu: 1, sl: '1,0', donGia: '1,0', ten: 'x' }),
    res({ stt: 3, tien: '1,0', plu: 1, sl: '1,0', donGia: '1,0', ten: 'x' }), 'REE\t']);
  ok('Nhật ký cân: SubID nhảy cóc → vẫn nhận, báo lỗi', hoSub.dong.length === 2 && hoSub.loi.length === 1 && /đáng lẽ là 2/.test(hoSub.loi[0]));
  const thieuRee = hong([rep(26, 9, 25, 1, 1, 1, 85, 1), res({ tien: '1,0', plu: 1, sl: '1,0', donGia: '1,0', ten: 'x' }),
    rep(26, 9, 25, 1, 1, 2, 86, 2), res({ tien: '1,0', plu: 1, sl: '1,0', donGia: '1,0', ten: 'x' })]);
  ok('Nhật ký cân: thiếu REE (bị cắt) → giữ dòng đọc được, báo lỗi', thieuRee.dong.length === 2 && thieuRee.loi.length === 2
    && /thiếu dòng REE/.test(thieuRee.loi[0]) && /cắt giữa chừng/.test(thieuRee.loi[1]), JSON.stringify(thieuRee.loi));
  const slSai = hong([rep(26, 9, 25, 1, 1, 1, 87, 1), res({ tien: '1,0', plu: 1, sl: 'abc', donGia: '1,0', ten: byte(TEN_1) }), 'REE\t']);
  ok('Nhật ký cân: số lượng hỏng → 0 và báo lỗi', slSai.dong[0]?.soLuong === 0 && slSai.loi.length === 1);
  const moiLoi = [repThieu, resThieu, resLe, fid0, ngaySai, hoSub, thieuRee, slSai, donVi].flatMap(k => k.loi);
  ok('Nhật ký cân: câu lỗi không chứa tên hàng', moiLoi.length > 0 && moiLoi.every(l => !l.includes('Hàng thử') && !l.includes(byte(TEN_1))));

  // ---- Dòng SubID 0 -----------------------------------------------------------
  const thanhToan = docNhatKy([rep(26, 9, 27, 11, 0, 0, 90, 4), res({ tien: '59150,3', plu: 1, sl: '7,2', donGia: '845000,3', ten: 'x' }),
    res({ stt: 0, tien: '-59150,3', plu: 9999995, sl: '0,0', donGia: '0,0', ten: 'x' }),
    res({ stt: 0, tien: '0,3', plu: 1, sl: '0,0', loai: 2, donGia: '0,0', ten: 'x' }), 'REE\t'], TUY);
  ok('Nhật ký cân: dòng thanh toán SubID 0 (PLU 9999995) vào sự kiện, không phải dòng hàng',
    thanhToan.dong.length === 1 && thanhToan.suKien.length === 2 && /Trả bằng thẻ/.test(thanhToan.suKien[0].ghiChu)
    && thanhToan.suKien[0].ghiChu.includes('-59.150') && thanhToan.suKien[0].loai === 0, JSON.stringify(thanhToan.suKien));
  ok('Nhật ký cân: dòng SubID 0 loại lạ ghi là phần mềm hãng bỏ qua', /bỏ qua/.test(thanhToan.suKien[1]?.ghiChu ?? '') && thanhToan.loi.length === 0);

  // ---- Thông số, bảng PLU, file USB -------------------------------------------
  const ts = (d: string[]) => tuyChonTuThongSo(d);
  ok('Nhật ký cân: Spec202 / 203 từ dòng TMS, khối sau thắng; thiếu thì 3',
    giong(ts(['TMS\t202\t3\t', 'TMS\t203\t3\t', 'TMS\t202\t2\t']), { soLeDonGia: 2, soLeTien: 3 }) && giong(ts([]), { soLeDonGia: 3, soLeTien: 3 })
    && giong(ts(['TMS\t203\t0\t']), { soLeDonGia: 0, soLeTien: 0 }), JSON.stringify(ts(['TMS\t203\t0\t'])));
  ok('Nhật ký cân: Spec291 = 9 → mã hàng ở ô Chữ 2; 290 = 0 → không có',
    ts(['TMS\t291\t9\t']).oMaCan === 2 && ts(['TMS\t290\t0\t']).oMaCan === undefined);
  const bangDoc = pluLucDocTuDong([plu(1, '010001', '1', '845,0', 'x'), plu(4, '10004', '2', '22,0', 'x'), 'END\tPLU\t'], 3);
  ok('Nhật ký cân: bảng PLU từ dòng PLU (mã chuẩn hoá, giá theo Spec202, cột 4 = 2 là cái)',
    giong(bangDoc.get(1), { ma: '10001', donGia: 845000, theoCai: false }) && giong(bangDoc.get(4), { ma: '10004', donGia: 22000, theoCai: true }) && bangDoc.size === 2,
    JSON.stringify([...bangDoc]));

  const f = docFileCan(fileCan({ rep: NHAT_KY }));
  const tuFile = nhatKyTuFile(f);
  ok('Nhật ký cân: file USB — MAC từ dòng INM, 5 dòng hàng, 1 sự kiện, không lỗi',
    tuFile.dong.length === 5 && tuFile.suKien.length === 1 && tuFile.loi.length === 0 && tuFile.dong.every(d => d.mac === 'AABBCCDDEE01'),
    JSON.stringify(tuFile.loi));
  ok('Nhật ký cân: file USB — dòng khớp giá PLU 1 (845.000 đ/kg) có mã 10001',
    tuFile.dong.find(d => d.fid === 31)?.maCan === '10001' && tuFile.dong.find(d => d.fid === 31)?.ten === TEN_1);
  ok('Nhật ký cân: file USB — năm 2024 bán PLU 3 theo cái 22.000 đ, nay PLU 3 là hàng ký 695.000 đ → mã trống',
    tuFile.dong.find(d => d.fid === 11)?.maCan === '', JSON.stringify(tuFile.dong.find(d => d.fid === 11)));
  ok('Nhật ký cân: file USB — truyền MAC thì dùng MAC đó', nhatKyTuFile(f, '11-22-33-44-55-66').dong.every(d => d.mac === '112233445566'));
  const khongRep = nhatKyTuFile(docFileCan(fileCan()));
  ok('Nhật ký cân: file không có phần REP → rỗng, báo rõ', khongRep.dong.length === 0 && khongRep.loi.some(l => /không có nhật ký bán/.test(l)),
    JSON.stringify(khongRep.loi));
  const khongMac = nhatKyTuFile(docFileCan(fileCan({ rep: NHAT_KY, inm: false })));
  ok('Nhật ký cân: file không có dòng INM → MAC trống, báo rõ', khongMac.dong.every(d => d.mac === '') && khongMac.loi.some(l => /MAC/.test(l)));
  const soLeFile = nhatKyTuFile(docFileCan(fileCan({ rep: NHAT_KY, tms: ['TMS\t202\t2\t', 'TMS\t203\t2\t'] })));
  ok('Nhật ký cân: file USB — số lẻ lấy theo Spec202/203 của file (2 → "59150,3" = 5.915 đ)',
    soLeFile.dong.find(d => d.fid === 31)?.thanhTien === 5915, JSON.stringify(soLeFile.dong.find(d => d.fid === 31)));

  // ---- Gộp --------------------------------------------------------------------
  const cu = docNhatKy(NHAT_KY, { ...TUY, pluLucDoc: bang });
  const nhatKyMoi = NHAT_KY.map(d => d.replace(byte(TEN_1), byte('Tên đổi sau'))).slice(0, -1)
    .concat([rep(26, 9, 27, 7, 0, 0, 33, 1), res({ tien: '84500,3', plu: 1, sl: '1,1', donGia: '845000,3', ten: 'y' }), 'REE\t', 'END\tREP\t']);
  const moi = docNhatKy(nhatKyMoi, TUY);   // lần đọc sau: tên đã đổi, không có bảng PLU → mã trống
  const cuTruoc = JSON.stringify(cu.dong), moiTruoc = JSON.stringify(moi.dong);
  const gop = gopNhatKy(cu.dong, moi.dong);
  ok('Nhật ký cân: gộp — thêm đúng 1 dòng mới, không trùng', gop.length === cu.dong.length + 1, String(gop.length));
  ok('Nhật ký cân: gộp — trùng khoá thì giữ bản cũ (tên, mã cân lúc đọc sớm)',
    gop.find(d => d.fid === 31)?.ten === TEN_1 && gop.find(d => d.fid === 31)?.maCan === '10001');
  ok('Nhật ký cân: gộp — xếp theo giờ', gop.every((d, i) => i === 0 || gop[i - 1].luc <= d.luc), gop.map(d => d.luc).join());
  ok('Nhật ký cân: gộp — không sửa hai mảng đưa vào', JSON.stringify(cu.dong) === cuTruoc && JSON.stringify(moi.dong) === moiTruoc);
  ok('Nhật ký cân: gộp với chính nó không nhân đôi', gopNhatKy(cu.dong, cu.dong).length === cu.dong.length);
  const fidLai = dongGia({ fid: 31, luc: '2027-01-01 08:00:00' });
  const mayKhac = { ...cu.dong.find(d => d.fid === 31)!, mac: '112233445566' };
  ok('Nhật ký cân: cùng FID nhưng khác giờ (cân đếm lại) hay khác cân → giữ cả hai',
    gopNhatKy(cu.dong, [fidLai, mayKhac]).length === cu.dong.length + 2);

  // ---- Lưu TSV ----------------------------------------------------------------
  const tsv = ghiKhoNhatKy(gop);
  const dongTsv = tsv.split('\r\n');
  ok('Nhật ký cân: TSV có tiêu đề, CRLF, mỗi dòng nhật ký một dòng',
    dongTsv[0].startsWith('mac\tfid\tluc\t') && dongTsv.length === gop.length + 2 && dongTsv[dongTsv.length - 1] === '' && !/[^\r]\n/.test(tsv));
  ok('Nhật ký cân: TSV ghi rồi đọc lại y nguyên', giong(docKhoNhatKy(tsv), gop));
  const tenKho = [dongGia({ fid: 1, luc: '2026-09-25 08:00:00', ten: 'Có\ttab\r\nvà xuống dòng', donGia: null, thanhTien: null })];
  const docLai = docKhoNhatKy(ghiKhoNhatKy(tenKho));
  ok('Nhật ký cân: TSV — tab / xuống dòng trong tên thành dấu cách; giá trống đọc lại là null',
    docLai.length === 1 && docLai[0].ten === 'Có tab và xuống dòng' && docLai[0].donGia === null && docLai[0].thanhTien === null, JSON.stringify(docLai));
  ok('Nhật ký cân: TSV — bỏ BOM, dòng trống, dòng hỏng', docKhoNhatKy('﻿' + tsv + '\r\nabc\r\n\r\nx\ty\tz\r\n').length === gop.length);
  const cot = dongTsv[0].split('\t');
  const dao = (d: string) => { const c = d.split('\t'); return [c[2], c[0], c[1], ...c.slice(3)].join('\t'); };
  ok('Nhật ký cân: TSV — đổi thứ tự cột vẫn đọc đúng theo tiêu đề',
    giong(docKhoNhatKy(dongTsv.filter(Boolean).map(dao).join('\n')), gop) && cot.length === 15);
  ok('Nhật ký cân: TSV — không có tiêu đề thì đọc theo thứ tự cột mặc định', giong(docKhoNhatKy(dongTsv.slice(1).join('\r\n')), gop));
  const khongCotKho = dongTsv.filter(Boolean).map(d => d.split('\t').filter((_, i) => cot[i] !== 'tinhKho').join('\t')).join('\r\n');
  ok('Nhật ký cân: TSV — thiếu cột tinhKho thì tính lại theo loại và PLU', giong(docKhoNhatKy(khongCotKho).map(d => d.tinhKho), gop.map(d => d.tinhKho)));
  ok('Nhật ký cân: TSV rỗng → không có dòng', docKhoNhatKy('').length === 0 && ghiKhoNhatKy([]).split('\r\n').length === 2);

  // ---- Tóm tắt ----------------------------------------------------------------
  const ds: DongBanCan[] = [
    dongGia({ fid: 1, luc: '2026-09-25 09:00:00', soLuong: 0.07, thanhTien: 59150 }),
    dongGia({ fid: 2, luc: '2026-09-25 10:00:00', soLuong: 0.15, thanhTien: 126750 }),
    dongGia({ fid: 3, luc: '2026-09-26 09:00:00', plu: 2, maCan: '10002', soLuong: 0.04, donGia: 876000, thanhTien: 35040 }),
    dongGia({ fid: 4, luc: '2026-09-26 10:00:00', plu: 3, maCan: '', ten: 'Hàng thử cái', soLuong: 2, theoCai: true, donGia: 22000, thanhTien: 44000 }),
    dongGia({ fid: 5, luc: '2026-09-26 11:00:00', loai: 1, soLuong: -0.07, thanhTien: -59150 }),
    dongGia({ fid: 6, luc: '2026-09-26 12:00:00', loai: 2, sid: 0, soLuong: 0.5, thanhTien: 422500 }),
    dongGia({ fid: 7, luc: '2026-09-24 12:00:00', soLuong: 1, thanhTien: 845000 }),
    dongGia({ fid: 8, luc: '2026-09-26 13:00:00', plu: 9999999, maCan: '', soLuong: 9, donGia: 0, thanhTien: 0 }),
  ];
  const dsTruoc = JSON.stringify(ds);
  const tt = tomTatNhatKy(ds, '2026-09-25', '2026-09-26');
  ok('Nhật ký cân: tóm tắt — tổng chỉ dòng tính kho, trả hàng trừ lại (3 gói, 0,19 kg, 2 cái, 205.790 đ)',
    giong(tt.tong, { soGoi: 3, kg: 0.19, cai: 2, tien: 205790 }), JSON.stringify(tt.tong));
  ok('Nhật ký cân: tóm tắt — 1 lần cân chưa in tem, 1 dòng chưa rõ mã', tt.chuaIn === 1 && tt.khongRoMa === 1, JSON.stringify([tt.chuaIn, tt.khongRoMa]));
  ok('Nhật ký cân: tóm tắt — theo ngày, xếp tăng dần',
    giong(tt.theoNgay, [{ ngay: '2026-09-25', soGoi: 2, kg: 0.22, cai: 0, tien: 185900 }, { ngay: '2026-09-26', soGoi: 1, kg: -0.03, cai: 2, tien: 19890 }]),
    JSON.stringify(tt.theoNgay));
  ok('Nhật ký cân: tóm tắt — theo hàng, nhiều tiền trước; dòng chưa rõ mã gom theo PLU',
    giong(tt.theoHang, [
      { maCan: '10001', plu: 1, ten: 'Hàng thử', soGoi: 1, kg: 0.15, cai: 0, tien: 126750 },
      { maCan: '', plu: 3, ten: 'Hàng thử cái', soGoi: 1, kg: 0, cai: 2, tien: 44000 },
      { maCan: '10002', plu: 2, ten: 'Hàng thử', soGoi: 1, kg: 0.04, cai: 0, tien: 35040 },
    ]), JSON.stringify(tt.theoHang));
  ok('Nhật ký cân: tóm tắt — không giới hạn ngày thì tính cả ngày 24', tomTatNhatKy(ds, '', '').tong.soGoi === 4);
  ok('Nhật ký cân: tóm tắt — khoảng ngày ngược → rỗng', giong(tomTatNhatKy(ds, '2026-09-27', '2026-09-25').tong, { soGoi: 0, kg: 0, cai: 0, tien: 0 }));
  ok('Nhật ký cân: tóm tắt không sửa dữ liệu đưa vào', JSON.stringify(ds) === dsTruoc);

  // ---- CSV --------------------------------------------------------------------
  const dsCsv: DongBanCan[] = [
    ...docNhatKy(NHAT_KY, { ...TUY, pluLucDoc: bang }).dong,
    dongGia({ fid: 100, luc: '2026-09-27 08:00:00', ten: 'Thịt; thử "đặc biệt"', donGia: 1234567, thanhTien: 123457 }),
    dongGia({ fid: 101, luc: '2026-09-27 08:01:00', ten: '=1+1', maCan: '' }),
    dongGia({ fid: 102, luc: '2026-09-27 08:02:00', loai: 1, soLuong: -0.1, thanhTien: -84500 }),
    dongGia({ fid: 103, luc: '2026-09-27 08:03:00', donGia: null, thanhTien: null }),
  ];
  const csv = sangCsv(dsCsv);
  const dongCsv = csv.slice(1).split('\r\n');
  const hangCsv = (fid: number) => dongCsv[1 + dsCsv.findIndex(d => d.fid === fid)] ?? '';
  const oCsv = (fid: number) => hangCsv(fid).split(';');
  const tieuDe = dongCsv[0].split(';');
  ok('Nhật ký cân: CSV có BOM UTF-8, CRLF, mỗi dòng hàng một hàng',
    csv.charCodeAt(0) === 0xFEFF && !/[^\r]\n/.test(csv) && dongCsv.length === dsCsv.length + 2 && dongCsv[dongCsv.length - 1] === '');
  ok('Nhật ký cân: CSV tiêu đề tiếng Việt, 16 cột, ngăn bằng dấu ;',
    tieuDe.length === 16 && tieuDe[0] === 'Ngày giờ (giờ cân)' && tieuDe.includes('Thành tiền (đ)') && tieuDe[15] === 'Ghi chú', dongCsv[0]);
  ok('Nhật ký cân: CSV dòng bán — ngày dd/mm/yyyy, 0,070 kg, 845.000 đ, 59.150 đ, tính kho, mã 10001, không ghi chú',
    giong(oCsv(31), ['25/09/2026 17:17:01', 'AABBCCDDEE01', '31', '3', '1', '1', '10001', TEN_1, 'Bán', '0', 'Có', '0,070', 'kg', '845.000', '59.150', '']),
    hangCsv(31));
  ok('Nhật ký cân: CSV dòng cân chưa in tem — "Không" và ghi chú rõ', oCsv(32)[10] === 'Không' && /Không tính kho: cân xong nhưng chưa in tem/.test(oCsv(32)[15]),
    hangCsv(32));
  ok('Nhật ký cân: CSV dòng PLU hệ thống — ghi chú nêu PLU 9999999 (hàng cân tạm)',
    oCsv(30)[10] === 'Không' && oCsv(30)[15].startsWith('Không tính kho: PLU hệ thống 9999999 — Hàng cân tạm'), hangCsv(30));
  ok('Nhật ký cân: CSV hàng cái — "1" cái, 22.000 đ; mã trống thì ghi chú "Chưa rõ mã cân"',
    oCsv(11)[11] === '1' && oCsv(11)[12] === 'cái' && oCsv(11)[13] === '22.000' && /Chưa rõ mã cân/.test(oCsv(11)[15]), hangCsv(11));
  ok('Nhật ký cân: CSV số âm "-0,060" kg, "-50.700" đ', oCsv(25)[11] === '-0,060' && oCsv(25)[14] === '-50.700', hangCsv(25));
  ok('Nhật ký cân: CSV tên có ; và " được bọc ngoặc kép; số lớn 1.234.567',
    hangCsv(100).includes('"Thịt; thử ""đặc biệt"""') && hangCsv(100).includes(';1.234.567;123.457;'), hangCsv(100));
  ok('Nhật ký cân: CSV tên bắt đầu bằng = không thành công thức Excel', oCsv(101)[7] === "'=1+1", hangCsv(101));
  ok('Nhật ký cân: CSV trả hàng ghi rõ chưa thử trên cân thật', oCsv(102)[8] === 'Trả hàng' && /chưa thử trên cân thật/.test(oCsv(102)[15]), hangCsv(102));
  ok('Nhật ký cân: CSV giá không đọc được → ô trống', oCsv(103)[13] === '' && oCsv(103)[14] === '', hangCsv(103));
  ok('Nhật ký cân: ghi chú của dòng bán có mã là rỗng', ghiChuDong(dsCsv.find(d => d.fid === 31)!) === '');
  ok('Nhật ký cân: CSV rỗng vẫn có tiêu đề', sangCsv([]) === '﻿' + dongCsv[0] + '\r\n');
}

// Chạy riêng: cd can-app && npx bun test/thu-bao-cao-can.ts
if (import.meta.main) {
  let dat = 0, hong = 0;
  const ok: Ok = (ten, dieuKien, chiTiet = '') => {
    if (dieuKien) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten} ${chiTiet}`); }
  };
  await thuBaoCaoCan(ok);
  console.log(hong === 0 ? `\nTẤT CẢ ${dat} KIỂM TRA NHẬT KÝ CÂN ĐỀU ĐẠT` : `\n${hong} KIỂM TRA HỎNG / ${dat + hong}`);
  process.exit(hong === 0 ? 0 : 1);
}
