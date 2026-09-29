/**
 * Kiểm thử thông số cân (TMS), chữ cài đặt chung (TMT) và phím tắt (SCP) — src/thong-so.ts.
 *
 *     cd can-app && npx bun test/thu-thong-so.ts
 *
 * Chỉ dùng file cân giả (cấu trúc như file cân thật V3.14E8: dòng đầu "ECS VER",
 * dòng trống sau mỗi phần, SCP tầng 0 phím 1–73 và tầng 1, 2 phím 1–63, TMS đủ
 * 500 dòng). Tên hàng, tên WiFi, mật khẩu đều là chữ giả. Mạng: chỉ 127.0.0.1.
 * test/thu.ts gọi thuThongSo(ok) với hàm ok chung.
 */
import * as net from 'node:net';
import { docFileCan, sangChuoiByte, tuChuoiByte, type FileCan } from '../../web/src/lib/kho/can-tma.ts';
import {
  CHU_CHUNG, CHU_MANG, LoiThongSo, NHAN_PHIM, NHOM_CHU_CHUNG, NHOM_THONG_SO, THONG_SO, docChuChung, docPhim, docThongSo, fileNho,
  kiemChuChung, kiemThongSo, suaChuChung, suaPhim, suaThongSo,
} from '../src/thong-so.ts';
import { O_THEM_DUOC, TRUONG_BAN } from '../src/tem.ts';

type Ok = (ten: string, dk: boolean, ct?: string) => void;

// ---- Dựng file giả ---------------------------------------------------------------------
const utf8 = (t: string) => sangChuoiByte(new TextEncoder().encode(t));
const KHUON = 'PLU\t{1}\t{2}\t\t1\t{5}\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\t{15}\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\tx\t0\t0\t0\t';
const plu = (so: number, ma: string, gia: string, tenByte: string) =>
  KHUON.replace('{1}', String(so)).replace('{2}', ma).replace('{5}', gia).replace('{15}', tenByte);

// Giá trị giống cân của quán ở các thông số liên quan; còn lại 0 (499 = số hãng để sẵn).
const GIA_TRI: Record<number, string> = {
  0: '28', 1: '28', 2: '20', 5: '4', 21: '1', 22: '9', 42: '1', 43: '1', 104: '0', 105: '0', 106: '0', 131: '1',
  166: '33581', 188: '6', 202: '3', 203: '3', 208: '3', 209: '2', 250: '1', 265: '0', 266: '0', 283: '1', 499: '1522729470',
};
const DONG_TMS = Array.from({ length: 500 }, (_, i) => `TMS\t${i}\t${GIA_TRI[i] ?? '0'}\t`);

function dongScp(): string[] {
  const ra: string[] = [];
  for (let k = 1; k <= 73; k++) ra.push(`SCP\t0\t${k}\t${k <= 3 ? k : 0}\t`);   // phím A, B, C gọi PLU 1, 2, 3
  for (let k = 1; k <= 63; k++) ra.push(`SCP\t1\t${k}\t${k === 63 ? -35 : 0}\t`); // Shift+IME = chức năng Drawer (mã 35)
  for (let k = 1; k <= 63; k++) ra.push(`SCP\t2\t${k}\t0\t`);
  return ra;
}

/** Các dòng (dạng chuỗi byte) của file cân giả kiểu cân tự lưu ra USB. */
function dongFileCan(): string[] {
  return [
    'ECS\tVER\tV3.14E8\t', '',
    'DWL\tPLU\t',
    plu(1, '10001', '845,0', utf8('Hàng thử một')),
    plu(2, '10002', '876,0', utf8('Hàng thử hai') + '\xFF'),           // byte không phải UTF-8
    plu(3, '10003', '695,0', utf8('Hàng thử ba')),
    plu(12, '10012', '516,0', utf8('Hàng thử mười hai')),
    'END\tPLU\t', '',
    'DWL\tSCP\t', ...dongScp(), 'END\tSCP\t', '',
    'DWL\tTMS\t', ...DONG_TMS, 'END\tTMS\t', '',
    'DWL\tTMT\t', `TMT\t0\t${utf8('Quán thử')}\t`, 'TMT\t15\tWIFI-GIA\t', 'TMT\t16\tmatkhau-gia\t', 'END\tTMT\t', '',
    'DWL\tTIM\t', 'TIM\t26\t9\t29\t10\t0\t0\t', 'END\tTIM\t', '',
    'END\tECS\t', '',
  ];
}

function taoFile(dong: string[], tuy: { bom?: boolean; lf?: boolean } = {}): Uint8Array {
  const than = tuChuoiByte(dong.join(tuy.lf ? '\n' : '\r\n'));
  if (!tuy.bom) return than;
  const ra = new Uint8Array(than.length + 3);
  ra.set([0xEF, 0xBB, 0xBF]); ra.set(than, 3);
  return ra;
}

/** Tách dòng như cân (bỏ BOM) — dùng để so từng dòng và dựng FileCan cho file kiểu phần mềm hãng. */
function tach(du: Uint8Array): { bom: boolean; xd: string; dong: string[] } {
  const bom = du[0] === 0xEF && du[1] === 0xBB && du[2] === 0xBF;
  const s = sangChuoiByte(bom ? du.subarray(3) : du);
  const xd = s.includes('\r\n') ? '\r\n' : '\n';
  return { bom, xd, dong: s.split(xd) };
}
const fileCanTho = (du: Uint8Array) => ({ dong: tach(du).dong }) as unknown as FileCan;

/** Chỉ số các dòng khác nhau (hai file cùng số dòng); null nếu số dòng khác. */
function dongKhac(a: Uint8Array, b: Uint8Array): number[] | null {
  const A = tach(a).dong, B = tach(b).dong;
  if (A.length !== B.length) return null;
  return A.flatMap((d, i) => (d === B[i] ? [] : [i]));
}

const bang = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Câu lỗi nếu fn ném LoiThongSo; '' nếu không ném; 'KHÁC:…' nếu ném lỗi khác. */
function loi(fn: () => unknown): string {
  try { fn(); return ''; } catch (e) { return e instanceof LoiThongSo ? e.message : `KHÁC:${(e as Error)?.message}`; }
}

function quaMang(du: Uint8Array): Promise<Uint8Array> {
  return new Promise((xong, hong) => {
    const may = net.createServer((s) => {
      const phan: Buffer[] = [];
      s.on('data', d => phan.push(d));
      s.on('end', () => { s.end(); may.close(); xong(new Uint8Array(Buffer.concat(phan))); });
    });
    may.on('error', hong);
    may.listen(0, '127.0.0.1', () => {
      const cong = (may.address() as net.AddressInfo).port;
      const c = net.createConnection({ host: '127.0.0.1', port: cong }, () => c.end(Buffer.from(du)));
      c.on('error', hong);
    });
  });
}

// ---- Kiểm thử ----------------------------------------------------------------------------
export async function thuThongSo(ok: Ok): Promise<void> {
  console.log('\n— Thông số cân (TMS), chữ cài đặt chung (TMT) và phím tắt (SCP)');

  // Danh mục
  const ids = THONG_SO.map(m => m.id);
  ok('Danh mục thông số: không trùng số', new Set(ids).size === ids.length, ids.join());
  const suaDuoc = THONG_SO.filter(m => !m.chiXem).map(m => m.id).sort((a, b) => a - b);
  ok('Sửa được đúng 104, 105, 106, 265, 266, 250, 283 và 22 (độ đậm in)', suaDuoc.join() === '22,104,105,106,250,265,266,283', suaDuoc.join());
  const phaiChiXem = [0, 1, 2, 5, 21, 42, 43, 166, 188, 202, 203, 208, 209];
  ok('Chỉ xem: 0, 1, 2, 5, 21, 42, 43, 166, 188, 202, 203, 208, 209', phaiChiXem.every(id => THONG_SO.find(m => m.id === id)?.chiXem === true));
  ok('Mỗi mục có tên, mô tả tiếng Việt và nhóm hợp lệ', THONG_SO.every(m => m.ten && m.moTa.length > 20 && /[ăâđêôơư]/i.test(m.moTa)
    && (NHOM_THONG_SO as readonly string[]).includes(m.nhom)), THONG_SO.filter(m => !(NHOM_THONG_SO as readonly string[]).includes(m.nhom)).map(m => m.id).join());
  ok('Mục "chọn" có lựa chọn không trùng; mục "số" có khoảng', THONG_SO.every(m => m.kieu === 'chon'
    ? !!m.luaChon?.length && new Set(m.luaChon.map(l => l.gt)).size === m.luaChon.length
    : Number.isInteger(m.toiThieu) && Number.isInteger(m.toiDa) && (m.toiThieu as number) <= (m.toiDa as number)));
  ok('Mục sửa được đều ghi "chưa thử trên cân thật"', THONG_SO.filter(m => !m.chiXem).every(m => /chưa thử trên cân thật/i.test(m.canhBao ?? '')));
  ok('Mục chỉ xem đều có câu giải thích', THONG_SO.filter(m => m.chiXem).every(m => /Chỉ xem/.test(m.canhBao ?? '')));
  const m104 = THONG_SO.find(m => m.id === 104)!;
  const gt104 = m104.luaChon!.map(l => l.gt);
  ok('104: có 0–5 và 100–105, không có lịch Ba Tư (6–10)', ['0', '1', '2', '3', '4', '5', '100', '105'].every(g => gt104.includes(g)) && !gt104.includes('6') && !gt104.includes('106'), gt104.join());
  ok('104 = 4 là ngày/tháng/năm, cảnh báo năm 2 chữ số', /29\/09\/26/.test(m104.luaChon!.find(l => l.gt === '4')!.ten) && /2 chữ số/.test(m104.canhBao ?? ''));
  ok('104 kiểu Mỹ (2, 3) có cảnh báo tháng trước ngày', ['2', '3'].every(g => /Tháng đứng trước ngày/.test(m104.luaChon!.find(l => l.gt === g)!.canhBao ?? '')));
  ok('202/203: cảnh báo đổi là đổi mọi giá / mọi thành tiền', /MỌI giá/.test(THONG_SO.find(m => m.id === 202)!.canhBao ?? '') && /MỌI thành tiền/.test(THONG_SO.find(m => m.id === 203)!.canhBao ?? ''));
  ok('105 = 2 cảnh báo bỏ HSD từng hàng từ kho', /HSD riêng của từng hàng/.test(THONG_SO.find(m => m.id === 105)!.luaChon!.find(l => l.gt === '2')!.canhBao ?? ''));
  ok('42: cảnh báo USB có file A_xxx.TMS cũ', /A_xxx\.TMS cũ/.test(THONG_SO.find(m => m.id === 42)!.canhBao ?? ''));

  // kiemThongSo
  ok('kiemThongSo: "04" → "4"', kiemThongSo(104, '04') === '4');
  ok('kiemThongSo: số dạng number được', kiemThongSo('106', 30) === '30');
  ok('kiemThongSo: 104 = 7 bị từ chối', /không có lựa chọn "7"/.test(loi(() => kiemThongSo(104, '7'))));
  ok('kiemThongSo: 106 = 1000 bị từ chối', /từ 0 đến 999/.test(loi(() => kiemThongSo(106, '1000'))));
  ok('kiemThongSo: 106 = -1, "4.5", "" bị từ chối', ['-1', '4.5', '', 'abc'].every(v => loi(() => kiemThongSo(106, v)) !== '' && !loi(() => kiemThongSo(106, v)).startsWith('KHÁC')));
  ok('kiemThongSo: 202 chỉ xem', /chỉ được xem/.test(loi(() => kiemThongSo(202, '2'))));
  ok('kiemThongSo: số lạ (40) bị từ chối', /không có trong danh sách/.test(loi(() => kiemThongSo(40, '1'))));

  // docThongSo
  const goc = taoFile(dongFileCan());
  const fc = docFileCan(goc);
  const ts = docThongSo(fc);
  ok('docThongSo: đủ 500 thông số, 104 = 0, 202 = 3, 166 = 33581', ts.size === 500 && ts.get(104) === '0' && ts.get(202) === '3' && ts.get(166) === '33581');

  // suaThongSo — đổi 104 và 266
  const s1 = suaThongSo(goc, { 104: '4', 266: '1' });
  ok('suaThongSo: khối gửi chỉ có dòng đổi, xếp theo số',
    JSON.stringify(s1.khoi) === JSON.stringify(['DWL\tTMS\t', 'TMS\t104\t4\t', 'TMS\t266\t1\t', 'END\tTMS\t']), JSON.stringify(s1.khoi));
  ok('suaThongSo: doi = [104, 266]', s1.doi.join() === '104,266');
  const k1 = dongKhac(goc, s1.du);
  const L = tach(goc).dong;
  ok('suaThongSo: chỉ 2 dòng TMS 104, 266 đổi, mọi dòng khác y nguyên',
    k1 !== null && k1.length === 2 && L[k1[0]] === 'TMS\t104\t0\t' && L[k1[1]] === 'TMS\t266\t0\t', JSON.stringify(k1));
  ok('suaThongSo: giữ byte 0xFF, CRLF, không thêm BOM', s1.du.includes(0xFF) && tach(s1.du).xd === '\r\n' && !tach(s1.du).bom && s1.du.length === goc.length);
  const ts1 = docThongSo(docFileCan(s1.du));
  ok('Đọc lại: 104 = 4, 266 = 1, 105 vẫn 0', ts1.get(104) === '4' && ts1.get(266) === '1' && ts1.get(105) === '0');
  ok('suaThongSo không đổi file vào', dongKhac(goc, taoFile(dongFileCan()))?.length === 0);

  // Không đổi gì
  const s2 = suaThongSo(goc, { 104: '0', 250: '01' });
  ok('Giá trị như cũ ("01" = 1): không đổi, khối rỗng, file y nguyên', s2.khoi.length === 0 && s2.doi.length === 0 && bang(s2.du, goc));
  ok('thay rỗng: không đổi', suaThongSo(goc, {}).khoi.length === 0);

  // Lỗi — kiểm hết trước khi sửa
  ok('Sửa 202 (chỉ xem) → LoiThongSo', /chỉ được xem/.test(loi(() => suaThongSo(goc, { 202: '2' }))));
  ok('Sửa số lạ 50 → LoiThongSo', /không có trong danh sách/.test(loi(() => suaThongSo(goc, { 50: '1' }))));
  ok('Sửa khoá không phải số → LoiThongSo', /không có trong danh sách/.test(loi(() => suaThongSo(goc, { abc: '1' }))));
  ok('Một giá trị sai thì không sửa gì (ném lỗi)', /không có lựa chọn/.test(loi(() => suaThongSo(goc, { 104: '4', 105: '9' }))));
  ok('106 = 1000 → LoiThongSo', /từ 0 đến 999/.test(loi(() => suaThongSo(goc, { 106: '1000' }))));
  ok('Cùng một thông số hai lần ("104" và "0104") → LoiThongSo', /hai lần/.test(loi(() => suaThongSo(goc, { 104: '4', '0104': '5' }))));
  ok('File lạ → LoiThongSo', /không phải file dữ liệu của cân/.test(loi(() => suaThongSo(tuChuoiByte('xin chao\r\n'), { 104: '4' }))));
  ok('File rỗng → LoiThongSo', /File rỗng/.test(loi(() => suaThongSo(new Uint8Array(0), { 104: '4' }))));
  const khongDong = dongFileCan().filter(d => d !== 'END\tTMS\t');
  ok('Phần TMS thiếu dòng END → LoiThongSo', /bị hỏng/.test(loi(() => suaThongSo(taoFile(khongDong), { 104: '4' }))));

  // Thông số chưa có dòng → thêm vào cuối khối TMS
  const thieu266 = dongFileCan().filter(d => d !== 'TMS\t266\t0\t');
  const f3 = taoFile(thieu266);
  const s3 = suaThongSo(f3, { 266: '1' });
  const L3 = tach(s3.du).dong;
  const endTms = L3.indexOf('END\tTMS\t');
  ok('Thiếu dòng 266: thêm "TMS 266 1" ngay trước END TMS', L3[endTms - 1] === 'TMS\t266\t1\t' && L3.length === thieu266.length + 1, L3[endTms - 1]);
  ok('… và khối gửi có dòng 266', JSON.stringify(s3.khoi) === JSON.stringify(['DWL\tTMS\t', 'TMS\t266\t1\t', 'END\tTMS\t']));

  // Không có phần TMS → thêm khối mới trước END ECS
  const khongTms = dongFileCan().filter(d => !d.startsWith('TMS\t') && d !== 'DWL\tTMS\t' && d !== 'END\tTMS\t');
  const s4 = suaThongSo(taoFile(khongTms), { 104: '4' });
  const L4 = tach(s4.du).dong;
  const eEcs = L4.indexOf('END\tECS\t');
  ok('Không có phần TMS: thêm khối mới trước END ECS, có dòng trống như file cân',
    L4.slice(eEcs - 4, eEcs).join('|') === 'DWL\tTMS\t|TMS\t104\t4\t|END\tTMS\t|', L4.slice(eEcs - 5, eEcs + 1).join('|'));
  ok('… đọc lại được 104 = 4', docThongSo(fileCanTho(s4.du)).get(104) === '4');

  // File kiểu phần mềm hãng: BOM + dòng trống đầu, nhiều khối TMS, mở bằng XD1, xuống dòng LF
  const hang = ['', 'ECS\tVER\t100\t', 'DWL\tTMS\t', 'TMS\t250\t1\t', 'TMS\t104\t0\t', 'END\tTMS\t', 'DWL\tTMT\t', 'TMT\t3\tVND\t', 'END\tTMT\t',
    'XD1\tTMS\t', 'TMS\t250\t2\t', 'END\tTMS\t', 'END\tECS\t', ''];
  const fHang = taoFile(hang, { bom: true, lf: true });
  const tsHang = docThongSo(fileCanTho(fHang));
  ok('Nhiều khối TMS (mở bằng DWL, XD1): khối sau thắng (250 = 2)', tsHang.get(250) === '2' && tsHang.get(104) === '0');
  const s5 = suaThongSo(fHang, { 250: '0', 104: '5' });
  const t5 = tach(s5.du);
  ok('Giữ BOM, dòng trống đầu, xuống dòng LF', t5.bom && t5.xd === '\n' && t5.dong[0] === '' && t5.dong[1] === 'ECS\tVER\t100\t');
  ok('Sửa mọi dòng của 250 ở cả hai khối (không để dòng cũ đè)', t5.dong[3] === 'TMS\t250\t0\t' && t5.dong[10] === 'TMS\t250\t0\t' && t5.dong[4] === 'TMS\t104\t5\t');
  ok('Khối gửi: mỗi số một dòng (250 không lặp)', JSON.stringify(s5.khoi) === JSON.stringify(['DWL\tTMS\t', 'TMS\t104\t5\t', 'TMS\t250\t0\t', 'END\tTMS\t']), JSON.stringify(s5.khoi));
  ok('Dòng không sửa của file hãng y nguyên', dongKhac(fHang, s5.du)?.join() === '3,4,10');

  // fileNho
  const nho = fileNho('V3.14E8', s1.khoi);
  ok('fileNho: đúng từng byte (ECS VER, dòng trống, khối, dòng trống, END ECS, CRLF)',
    sangChuoiByte(nho) === 'ECS\tVER\tV3.14E8\t\r\n\r\nDWL\tTMS\t\r\nTMS\t104\t4\t\r\nTMS\t266\t1\t\r\nEND\tTMS\t\r\n\r\nEND\tECS\t\r\n', JSON.stringify(sangChuoiByte(nho)));
  ok('fileNho: không BOM', nho[0] === 0x45);
  ok('fileNho: đọc lại được bằng docThongSo', docThongSo(fileCanTho(nho)).get(104) === '4' && docThongSo(fileCanTho(nho)).size === 2);
  ok('fileNho: phiên bản trống → 100, bỏ tab trong phiên bản', sangChuoiByte(fileNho('', s1.khoi)).startsWith('ECS\tVER\t100\t\r\n')
    && sangChuoiByte(fileNho('V3\t1\r\n', s1.khoi)).startsWith('ECS\tVER\tV31\t\r\n'));
  ok('fileNho: khối rỗng → LoiThongSo', /Không có gì để gửi/.test(loi(() => fileNho('V3.14E8', []))));
  ok('fileNho: từ chối CLR', /CLR/.test(loi(() => fileNho('V3.14E8', ['CLR\tTMS\t', 'CLR\tEND\t']))));
  ok('fileNho: từ chối khối không đóng / dòng ngoài khối / dòng có xuống dòng',
    [['DWL\tTMS\t', 'TMS\t104\t4\t'], ['TMS\t104\t4\t'], ['DWL\tTMS\t', 'TMS\t104\t4\r\n', 'END\tTMS\t'], ['DWL\tTMS\t', 'END\tSCP\t']]
      .every(k => { const m = loi(() => fileNho('V3.14E8', k)); return m !== '' && !m.startsWith('KHÁC'); }));

  // ---- Chữ cài đặt chung (TMT, 2.4) --------------------------------------------------------
  const idsChu = CHU_CHUNG.map(m => m.id);
  ok('Danh mục chữ chung: không trùng số, không có 15, 16, 19 (tên / mật khẩu WiFi, tên miền)', new Set(idsChu).size === idsChu.length
    && ![15, 16, 19].some(id => idsChu.includes(id)) && [15, 16, 19].every(id => CHU_MANG.has(id)) && CHU_MANG.size === 3, idsChu.join());
  const suaDuocChu = CHU_CHUNG.filter(m => !m.chiXem).map(m => m.id).sort((a, b) => a - b);
  ok('Sửa được đúng 0–11 và 20–27; chỉ xem 12, 13, 14, 17, 18', suaDuocChu.join() === '0,1,2,3,4,5,6,7,8,9,10,11,20,21,22,23,24,25,26,27'
    && CHU_CHUNG.filter(m => m.chiXem).map(m => m.id).sort((a, b) => a - b).join() === '12,13,14,17,18', suaDuocChu.join());
  ok('Mỗi chữ có tên, mô tả tiếng Việt, nhóm hợp lệ; chữ sửa được ghi "chưa thử trên cân thật"', CHU_CHUNG.every(m => m.ten && m.moTa.length > 15
    && /[ăâđêôơư]/i.test(m.moTa) && (NHOM_CHU_CHUNG as readonly string[]).includes(m.nhom))
    && CHU_CHUNG.filter(m => !m.chiXem).every(m => /chưa thử trên cân thật/i.test(m.canhBao ?? '')) && CHU_CHUNG.filter(m => m.chiXem).every(m => /Chỉ xem/.test(m.canhBao ?? '')));
  ok('Ô tem in chữ (Thông tin lúc in) khớp tên ô của tem.ts: 0 → 0, 1 → 1, 4–11 → 17–24, 12–14 → 36–38, 17–18 → 41–42',
    CHU_CHUNG.filter(m => m.oTem !== undefined).every(m => TRUONG_BAN[m.oTem!] === m.ten)
    && CHU_CHUNG.filter(m => m.oTem !== undefined).map(m => `${m.id}:${m.oTem}`).join()
      === '0:0,1:1,4:17,5:18,6:19,7:20,8:21,9:22,10:23,11:24,12:36,13:37,14:38,17:41,18:42',
    CHU_CHUNG.map(m => `${m.id}:${m.oTem}`).join());

  ok('Thẻ Mẫu tem thêm được ô "Ghi chú cân 1–8" (thông tin lúc in 17–24) và "Tên quán" — in được chữ sửa ở đây',
    CHU_CHUNG.filter(m => m.id === 0 || (m.id >= 4 && m.id <= 11)).every(m => O_THEM_DUOC.some(o => o.flag1 === 2 && o.flag2 === m.oTem && o.ten === m.ten)));
  ok('kiemChuChung: bỏ tab / xuống dòng / ký tự điều khiển, cách thừa hai đầu; NFD → NFC', kiemChuChung(4, ' Giữ\tlạnh\r\n0–4 độ\x07 ') === 'Giữ lạnh 0–4 độ'
    && kiemChuChung('5', 'Quán'.normalize('NFD')) === 'Quán' && kiemChuChung(5, 123) === '123');
  ok('kiemChuChung: 40 ký tự có dấu được, 41 thì không; chữ sau số tiền tối đa 8', kiemChuChung(4, 'ệ'.repeat(40)).length === 40
    && /dài quá 40/.test(loi(() => kiemChuChung(4, 'ệ'.repeat(41)))) && /dài quá 8/.test(loi(() => kiemChuChung(3, 'VND VND V'))));
  ok('kiemChuChung: 15, 16, 19 (cả "016", " 19 ") → từ chối, nói rõ cân rời WiFi', [15, '016', ' 19 '].every(id => /rời WiFi/.test(loi(() => kiemChuChung(id, 'x')))));
  ok('kiemChuChung: chỉ xem (14), số lạ (28, "abc"), không phải chữ (null, {}), trống khi bắt buộc (0, 1), biểu tượng cảm xúc / nửa ký tự',
    /chỉ được xem/.test(loi(() => kiemChuChung(14, '#'))) && /không có trong danh sách/.test(loi(() => kiemChuChung(28, 'x')))
    && /không có trong danh sách/.test(loi(() => kiemChuChung('abc', 'x'))) && [null, {}].every(v => /phải là chữ/.test(loi(() => kiemChuChung(4, v))))
    && [0, 1].every(id => /không được để trống/.test(loi(() => kiemChuChung(id, ' \t ')))) && kiemChuChung(4, '') === ''
    && ['Bò 🐄', 'a\uD800b'].every(v => /không in được/.test(loi(() => kiemChuChung(4, v)))));
  ok('kiemChuChung: biểu tượng trong bảng chữ cơ bản (❤ ☎ ✅ ☕, dấu biến thể FE0F) → từ chối; ° – “ ” ₫ … vẫn được',
    ['Cảm ơn ❤', '☎ 0909', '✅ Tươi', '☕', 'x\uFE0F'].every(v => /không in được/.test(loi(() => kiemChuChung(4, v))))
    && kiemChuChung(4, 'Giữ lạnh 0–4 °C “ngon” 845₫…') === 'Giữ lạnh 0–4 °C “ngon” 845₫…');
  ok('kiemChuChung: ký tự thay thế U+FFFD (chữ không đọc được mà chỉ gõ thêm) → bảo gõ lại cả chữ',
    /gõ lại cả chữ/.test(loi(() => kiemChuChung(0, 'Qu\uFFFDn thử Q1'))));

  const cc = docChuChung(fc);
  ok('docChuChung: tên quán UTF-8; không bao giờ đọc 15, 16 dù file có', cc.get(0)?.giaTri === 'Quán thử' && cc.get(0)?.docDuoc === true
    && !cc.has(15) && !cc.has(16) && cc.size === 1);

  const c1 = suaChuChung(goc, { 0: 'Beeftown Quận 1', 4: 'ĐT 0909 000 000' });
  ok('suaChuChung: khối gửi chỉ có chữ đổi, UTF-8, xếp theo số', JSON.stringify(c1.khoi)
    === JSON.stringify(['DWL\tTMT\t', `TMT\t0\t${utf8('Beeftown Quận 1')}\t`, `TMT\t4\t${utf8('ĐT 0909 000 000')}\t`, 'END\tTMT\t']) && c1.doi.join() === '0,4', JSON.stringify(c1.khoi));
  const Lc1 = tach(c1.du).dong;
  const kc1 = dongKhac(goc, taoFile(Lc1.filter(d => d !== `TMT\t4\t${utf8('ĐT 0909 000 000')}\t`)));
  ok('suaChuChung: chỉ dòng TMT 0 đổi, thêm dòng TMT 4 ngay trước END TMT; mọi dòng khác (kể cả WiFi, byte 0xFF) y nguyên',
    kc1 !== null && kc1.length === 1 && L[kc1[0]] === `TMT\t0\t${utf8('Quán thử')}\t` && Lc1[Lc1.indexOf('END\tTMT\t') - 1] === `TMT\t4\t${utf8('ĐT 0909 000 000')}\t`
    && Lc1.includes('TMT\t15\tWIFI-GIA\t') && Lc1.includes('TMT\t16\tmatkhau-gia\t') && c1.du.includes(0xFF) && tach(c1.du).xd === '\r\n', JSON.stringify(kc1));
  const cc1 = docChuChung(docFileCan(c1.du));
  ok('Đọc lại: tên quán, ghi chú 1 mới', cc1.get(0)?.giaTri === 'Beeftown Quận 1' && cc1.get(4)?.giaTri === 'ĐT 0909 000 000');
  ok('Chữ như cũ → khối rỗng, file y nguyên', (() => { const r = suaChuChung(goc, { 0: ' Quán thử ' }); return r.khoi.length === 0 && bang(r.du, goc); })()
    && suaChuChung(goc, {}).khoi.length === 0);
  ok('Một chữ sai (16) thì không sửa gì; cùng số hai lần ("4", "04") → LoiThongSo', /rời WiFi/.test(loi(() => suaChuChung(goc, { 0: 'Mới', 16: 'x' })))
    && /hai lần/.test(loi(() => suaChuChung(goc, { 4: 'a', '04': 'b' }))));
  ok('Phần TMT thiếu dòng END → LoiThongSo', /TMT.*bị hỏng/.test(loi(() => suaChuChung(taoFile(dongFileCan().filter(d => d !== 'END\tTMT\t')), { 0: 'Mới' }))));
  const khongTmt = dongFileCan().filter(d => !d.startsWith('TMT\t') && d !== 'DWL\tTMT\t' && d !== 'END\tTMT\t');
  const c2 = tach(suaChuChung(taoFile(khongTmt), { 3: 'đ' }).du).dong;
  const eEcs2 = c2.indexOf('END\tECS\t');
  ok('Không có phần TMT: thêm khối mới trước END ECS, có dòng trống như file cân',
    c2.slice(eEcs2 - 4, eEcs2).join('|') === `DWL\tTMT\t|TMT\t3\t${utf8('đ')}\t|END\tTMT\t|`, c2.slice(eEcs2 - 5, eEcs2 + 1).join('|'));
  const c3 = suaChuChung(fHang, { 3: 'đ' });
  const t3 = tach(c3.du);
  ok('File kiểu phần mềm hãng (BOM, LF, TMT 3 "VND"): sửa đúng dòng, giữ BOM và LF', t3.bom && t3.xd === '\n' && t3.dong[7] === `TMT\t3\t${utf8('đ')}\t`
    && dongKhac(fHang, c3.du)?.join() === '7');
  const thieuCot = taoFile(dongFileCan().map(d => (d.startsWith('TMT\t0\t') ? 'TMT\t0' : d)));
  ok('Dòng TMT thiếu cột ("TMT<tab>0") → viết lại đủ dạng', tach(suaChuChung(thieuCot, { 0: 'Mới' }).du).dong.includes('TMT\t0\tM\xE1\xBB\x9Bi\t'));
  const khongUtf8 = taoFile(dongFileCan().map(d => (d.startsWith('TMT\t0\t') ? 'TMT\t0\tQu\xE1n\t' : d)));
  ok('Chữ trong file không phải UTF-8 → docDuoc = false (trang báo gõ lại)', docChuChung(docFileCan(khongUtf8)).get(0)?.docDuoc === false);
  ok('fileNho: khối TMT đọc lại đủ; từ chối dòng TMT 15 / 16 / 19 (phòng khi chỗ khác gọi sai)',
    docChuChung(fileCanTho(fileNho('V3.14E8', c1.khoi))).get(4)?.giaTri === 'ĐT 0909 000 000'
    && [15, 16, 19].every(id => /rời WiFi/.test(loi(() => fileNho('V3.14E8', ['DWL\tTMT\t', `TMT\t${id}\tx\t`, 'END\tTMT\t'])))));

  // Phím tắt
  ok('NHAN_PHIM: 74 phím, 1 = A, 26 = Z, 58 = "_", 63 = IME, 64 = Shift, 73 = Drawer',
    NHAN_PHIM.length === 74 && NHAN_PHIM[1] === 'A' && NHAN_PHIM[26] === 'Z' && NHAN_PHIM[58] === '_' && NHAN_PHIM[63] === 'IME'
    && NHAN_PHIM[64] === 'Shift' && NHAN_PHIM[73] === 'Drawer', JSON.stringify(NHAN_PHIM));
  const ph = docPhim(fc);
  ok('docPhim: 199 phím (73 + 63 + 63)', ph.length === 199, String(ph.length));
  const p = (t: number, k: number) => ph.find(x => x.trang === t && x.phim === k);
  ok('docPhim: phím A tầng 0 gọi PLU 1, sửa được', p(0, 1)?.plu === 1 && p(0, 1)?.nhan === 'A' && p(0, 1)?.suaDuoc === true);
  ok('docPhim: phím 58 hiện "_"', p(0, 58)?.nhan === '_');
  ok('docPhim: phím 64 (Shift) tầng 0 là phím chức năng, không sửa được', p(0, 64)?.suaDuoc === false && /chức năng in sẵn/.test(p(0, 64)?.ghiChu ?? ''));
  ok('docPhim: phím mang số âm (Shift+IME = -35) không sửa được', p(1, 63)?.plu === -35 && p(1, 63)?.suaDuoc === false && /mã 35/.test(p(1, 63)?.ghiChu ?? ''));
  ok('docPhim: xếp theo tầng rồi số phím', ph.every((x, i) => i === 0 || ph[i - 1].trang < x.trang || (ph[i - 1].trang === x.trang && ph[i - 1].phim < x.phim)));

  const q1 = suaPhim(goc, [{ trang: 0, phim: 4, plu: 12 }, { trang: 0, phim: 2, plu: 0 }, { trang: 1, phim: 1, plu: 3 }]);
  ok('suaPhim: khối gửi có đủ 3 dòng, phím bỏ ghi tường minh PLU 0',
    JSON.stringify(q1.khoi) === JSON.stringify(['DWL\tSCP\t', 'SCP\t0\t2\t0\t', 'SCP\t0\t4\t12\t', 'SCP\t1\t1\t3\t', 'END\tSCP\t']), JSON.stringify(q1.khoi));
  const kq1 = dongKhac(goc, q1.du);
  ok('suaPhim: chỉ 3 dòng SCP đổi, mọi dòng khác y nguyên (kể cả byte 0xFF)',
    kq1 !== null && kq1.length === 3 && kq1.every(i => L[i].startsWith('SCP\t')) && q1.du.includes(0xFF), JSON.stringify(kq1));
  const ph1 = docPhim(docFileCan(q1.du));
  ok('Đọc lại: D → PLU 12, B trống, Shift+A → PLU 3',
    ph1.find(x => x.trang === 0 && x.phim === 4)?.plu === 12 && ph1.find(x => x.trang === 0 && x.phim === 2)?.plu === 0
    && ph1.find(x => x.trang === 1 && x.phim === 1)?.plu === 3);
  ok('suaPhim: doi đúng 3 phím', q1.doi.length === 3);

  ok('suaPhim: gán như cũ → khối rỗng, file y nguyên', (() => { const r = suaPhim(goc, [{ trang: 0, phim: 1, plu: 1 }]); return r.khoi.length === 0 && bang(r.du, goc); })());
  ok('suaPhim: phím chức năng 64 (Shift) → LoiThongSo', /phím chức năng in sẵn/.test(loi(() => suaPhim(goc, [{ trang: 0, phim: 64, plu: 1 }]))));
  ok('suaPhim: phím đang mang số âm → LoiThongSo', /phím chức năng của cân \(mã 35/.test(loi(() => suaPhim(goc, [{ trang: 1, phim: 63, plu: 1 }]))));
  ok('suaPhim: phím 64 tầng 1, phím 0, phím 74 → LoiThongSo', [[1, 64], [0, 0], [0, 74]].every(([t, k]) => /không có/.test(loi(() => suaPhim(goc, [{ trang: t, phim: k, plu: 1 }])))));
  ok('suaPhim: tầng 3 → LoiThongSo', /Tầng phím/.test(loi(() => suaPhim(goc, [{ trang: 3, phim: 1, plu: 1 }]))));
  ok('suaPhim: PLU âm / quá lớn / lẻ → LoiThongSo', [-35, 9999991, 1.5].every(v => /Số PLU phải là/.test(loi(() => suaPhim(goc, [{ trang: 0, phim: 5, plu: v }])))));
  ok('suaPhim: PLU không có trên cân → LoiThongSo', /không có hàng PLU 99/.test(loi(() => suaPhim(goc, [{ trang: 0, phim: 5, plu: 99 }]))));
  ok('suaPhim: một phím gán hai lần → LoiThongSo', /hai lần/.test(loi(() => suaPhim(goc, [{ trang: 0, phim: 5, plu: 1 }, { trang: 0, phim: 5, plu: 2 }]))));
  ok('suaPhim: một mục sai thì không sửa gì (ném lỗi)', /không có hàng PLU/.test(loi(() => suaPhim(goc, [{ trang: 0, phim: 5, plu: 1 }, { trang: 0, phim: 6, plu: 77 }]))));

  const thieuPhim = dongFileCan().filter(d => d !== 'SCP\t2\t5\t0\t');
  const q2 = suaPhim(taoFile(thieuPhim), [{ trang: 2, phim: 5, plu: 2 }]);
  const Lq2 = tach(q2.du).dong;
  ok('Phím chưa có dòng: thêm vào cuối khối SCP', Lq2[Lq2.indexOf('END\tSCP\t') - 1] === 'SCP\t2\t5\t2\t' && JSON.stringify(q2.khoi) === JSON.stringify(['DWL\tSCP\t', 'SCP\t2\t5\t2\t', 'END\tSCP\t']));
  const khongScp = dongFileCan().filter(d => !d.startsWith('SCP\t') && d !== 'DWL\tSCP\t' && d !== 'END\tSCP\t');
  const q3 = suaPhim(taoFile(khongScp), [{ trang: 0, phim: 7, plu: 3 }]);
  ok('Không có phần SCP: thêm khối mới', docPhim(fileCanTho(q3.du)).length === 1 && docPhim(fileCanTho(q3.du))[0].plu === 3);

  // Ghép TMS + SCP vào một file nhỏ, gửi qua mạng cục bộ (127.0.0.1) — byte tới nơi y nguyên
  const nho2 = fileNho('V3.14E8', [...s1.khoi, ...q1.khoi]);
  ok('fileNho ghép TMS + SCP đọc lại đủ', docThongSo(fileCanTho(nho2)).size === 2 && docPhim(fileCanTho(nho2)).length === 3);
  const nhan = await quaMang(nho2);
  ok('Gửi file nhỏ qua 127.0.0.1: nhận đúng từng byte', bang(nhan, nho2));
}

if ((import.meta as { main?: boolean }).main) {
  let dat = 0, hong = 0;
  await thuThongSo((ten, dk, ct = '') => {
    if (dk) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten} ${ct}`); }
  });
  console.log(hong === 0 ? `\nTẤT CẢ ${dat} KIỂM TRA THÔNG SỐ / PHÍM TẮT ĐỀU ĐẠT` : `\n${hong} KIỂM TRA HỎNG / ${dat + hong}`);
  process.exit(hong === 0 ? 0 : 1);
}
