/**
 * Kiểm thử giao thức hai chiều của hãng (src/giao-thuc.ts) với cân giả trên
 * 127.0.0.1 (test/can-gia-hai-chieu.ts) — không cần cân thật:
 *
 *     cd can-app && npx bun test/thu-giao-thuc.ts
 *
 * test/thu.ts gọi `thuGiaoThuc(ok)`. Dữ liệu giả, không có tên hàng thật.
 * Cân giả làm theo đặc tả suy từ phần mềm của hãng — đạt ở đây KHÔNG có nghĩa là
 * cân thật cũng vậy (chưa thử trên cân thật).
 */
import {
  CONG_HAI_CHIEU, LoiGiaoThuc, coDauTru, docTuCan, ghepFileUsb, khoiTim, khoiXoaVaNapPlu, kiemKhoiGhi, moKetNoi, yeuCauBaoCao,
  type TuyChonKetNoi,
} from '../src/giao-thuc.ts';
import { chuoiByte, moCanGia, type CanGia } from './can-gia-hai-chieu.ts';
import { docFileCan } from '../../web/src/lib/kho/can-tma.ts';

type Ok = (ten: string, dk: boolean, ct?: string) => void;

const IP = '127.0.0.1';
const NHANH: TuyChonKetNoi = { choMs: 1500, choNoiMs: 3000, nghiBaoCaoMs: 1 };
const B = (s: string) => Buffer.from(s, 'latin1');
const hien = (b: Buffer | string) => JSON.stringify(typeof b === 'string' ? b : b.toString('latin1'));
const BAT_TAY = '\xEF\xBB\xBF\r\nUPL\tMAC\t\r\nUPL\tINF\t\r\nUPL\tEND\t\r\n';

// ---- Dữ liệu giả -------------------------------------------------------------
const KHUON = 'PLU\t{1}\t{2}\t\t1\t{5}\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\t{15}\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\tx\t0\t0\t0\t';
const plu = (so: number, ma: string, gia: string, tenByte: string) =>
  KHUON.replace('{1}', String(so)).replace('{2}', ma).replace('{5}', gia).replace('{15}', tenByte);
const PLU1 = plu(1, '10001', '845,0', chuoiByte('Hàng thử A'));
const PLU2 = plu(2, '10002', '876,0', chuoiByte('Hàng thử B'));
const PLU3 = plu(3, '10003', '695,0', chuoiByte('Hàng thử C') + '\xFF');   // byte không phải UTF-8
const labDong = (id: number, ten: string, chu1: string) =>
  ['LAB', String(id), ten, '1', '58', '40', chuoiByte(chu1), ...Array(15).fill(''), '1', ...Array(16).fill('')].join('\t') + '\t';
const LAB = [
  labDong(28, 'BEEFTOWN', 'Đơn giá'), 'LAS\t1\t0\t0\t1\t1\t0\t0\t5\t0\t0\t408\t43\t', 'LAS\t2\t1\t0\t0\t1\t0\t0\t5\t4\t90\t116\t26\t', 'LAE\t',
  labDong(29, 'THU', 'HSD'), 'LAS\t1\t3\t16\t0\t1\t0\t0\t0\t1\t224\t94\t23\t', 'LAE\t',
];
const PHAN = (): Record<string, string[]> => ({
  TMS: ['TMS\t0\t28\t', 'TMS\t202\t3\t', 'TMS\t104\t0\t'],
  TMT: [`TMT\t0\t${chuoiByte('Quán thử')}\t`, `TMT\t1\t${chuoiByte('Cân quầy thử')}\t`, 'TMT\t15\tWIFI-GIA\t', 'TMT\t16\tmat-khau-gia\t'],
  SCP: ['SCP\t0\t1\t1\t', 'SCP\t0\t2\t2\t', 'SCP\t0\t3\t3\t'],
  DPT: [],
  CLS: [`CLS\t9\t${chuoiByte('Thịt thử')}\t9\t28\t1\t0\t0\t0\t0\t`],
  PLU: [PLU1, PLU2, PLU3],
  BAR: ['BAR\t1\tMa thu\t2XCCCCCWWWWWK\t1\t0\t0\t0\t'],
  LAB: LAB.slice(),
  SAL: ['SAL\t1\tNV thu\t\t0\t0\t0\t\t'],
});
const giaoDich = (fid: number, tenByte: string) => [
  `REP\t26\t9\t25\t15\t16\t${fid}\t${fid}\t1\t0\t`,
  `RES\t1\t16000,3\t1\t9\t9\t0,3\t160,3\t1\t0\t0,3\t\t\t\t\t100000,3\t0\t${tenByte}\t`,
  'REE\t',
];
const BAO_CAO = () => [...giaoDich(3, chuoiByte('Hàng thử A')), ...giaoDich(4, chuoiByte('Hàng thử B')), ...giaoDich(5, chuoiByte('Hàng thử C'))];

async function loiCua(f: () => Promise<unknown>): Promise<LoiGiaoThuc | Error | null> {
  try { await f(); return null; } catch (e) { return e as Error; }
}
const laLoi = (e: unknown, loai: string) => e instanceof LoiGiaoThuc && e.loai === loai;

/** Cổng không ai nghe trên 127.0.0.1. */
async function congDong(): Promise<number> {
  const net = await import('node:net');
  return new Promise((xong) => {
    const s = net.createServer();
    s.listen(0, IP, () => { const p = (s.address() as { port: number }).port; s.close(() => xong(p)); });
  });
}

export async function thuGiaoThuc(ok: Ok): Promise<void> {
  const cacCan: CanGia[] = [];
  const canMoi = async (du: Parameters<typeof moCanGia>[0] = {}) => {
    const c = await moCanGia({ ...du, du: { phan: PHAN(), baoCao: BAO_CAO(), ...du.du } });
    cacCan.push(c);
    return c;
  };
  /** Byte cân giả nhận trên kết nối i, sau phần bắt tay. */
  const sauBatTay = (can: CanGia, i?: number) => can.nhanTu(i).subarray(B(BAT_TAY).length);
  const choByte = (can: CanGia, mong: string, i?: number) => can.choNhan(() => sauBatTay(can, i).equals(B(mong)), 1000);
  /**
   * Số byte cân giả đã nhận, sau khi đường truyền lặng 40 ms: lệnh xong khi byte
   * cuối (UPL END) đã giao cho hệ điều hành, cân giả có thể chưa nhận kịp.
   */
  const moc = async (can: CanGia) => {
    let n = -1;
    while (n !== can.nhanTu().length) { n = can.nhanTu().length; await new Promise(r => setTimeout(r, 40)); }
    return n;
  };

  try {
    // =========================================================================
    console.log('GT1 · Hàm thuần: khối giờ, khối xoá + nạp PLU, kiểm khối ghi');
    ok('CONG_HAI_CHIEU = 33581', CONG_HAI_CHIEU === 33581);
    const kt = khoiTim({ nam: 2026, thang: 9, ngay: 29, gio: 14, phut: 5, giay: 9 });
    ok('khoiTim 29/09/2026 14:05:09 → TIM\\t26\\t9\\t29\\t14\\t5\\t9\\t (không đệm số 0)',
      JSON.stringify(kt) === JSON.stringify(['DWL\tTIM\t', 'TIM\t26\t9\t29\t14\t5\t9\t', 'END\tTIM\t']), JSON.stringify(kt));
    const hexTim = B(kt.map(d => d + '\r\n').join('')).toString('hex').replace(/(..)/g, '$1 ').trim().toUpperCase();
    ok('khoiTim + CRLF đúng từng byte như đặc tả §5.3', hexTim ===
      '44 57 4C 09 54 49 4D 09 0D 0A 54 49 4D 09 32 36 09 39 09 32 39 09 31 34 09 35 09 39 09 0D 0A 45 4E 44 09 54 49 4D 09 0D 0A', hexTim);
    const loiGio = [
      { nam: 2026, thang: 2, ngay: 31, gio: 1, phut: 1, giay: 1 }, { nam: 2026, thang: 13, ngay: 1, gio: 1, phut: 1, giay: 1 },
      { nam: 1999, thang: 1, ngay: 1, gio: 1, phut: 1, giay: 1 }, { nam: 2026, thang: 1, ngay: 1, gio: 24, phut: 0, giay: 0 },
      { nam: 2026, thang: 1, ngay: 1, gio: 1, phut: 1, giay: 1.5 },
    ].map(g => { try { khoiTim(g); return 'không lỗi'; } catch (e) { return laLoi(e, 'khong-cho-phep') ? 'ok' : String(e); } });
    ok('khoiTim từ chối ngày giờ không có thật (31/02, tháng 13, năm 1999, 24 giờ, giây lẻ)', loiGio.every(x => x === 'ok'), loiGio.join());

    const kx = khoiXoaVaNapPlu([PLU1, PLU2]);
    ok('khoiXoaVaNapPlu = CLR PLU, CLR END, DWL PLU, các dòng, END PLU',
      JSON.stringify(kx) === JSON.stringify(['CLR\tPLU\t', 'CLR\tEND\t', 'DWL\tPLU\t', PLU1, PLU2, 'END\tPLU\t']));
    const loiRong = (() => { try { khoiXoaVaNapPlu([]); return null; } catch (e) { return e; } })();
    ok('khoiXoaVaNapPlu danh sách rỗng bị chặn (sẽ xoá sạch hàng)', laLoi(loiRong, 'khong-cho-phep') && /xoá sạch/.test((loiRong as Error).message));
    const loiLa = (() => { try { khoiXoaVaNapPlu([PLU1, 'LAB\t28\t']); return null; } catch (e) { return e; } })();
    ok('khoiXoaVaNapPlu dòng không phải PLU bị chặn', laLoi(loiLa, 'khong-cho-phep'));

    const chan = (dong: string[]) => { try { kiemKhoiGhi(dong); return ''; } catch (e) { return laLoi(e, 'khong-cho-phep') ? (e as Error).message : `lỗi lạ ${e}`; } };
    ok('kiemKhoiGhi: khối PLU, TMS 104/58, LAB có LAS/LAE, CLR PLU hợp lệ', chan(['DWL\tPLU\t', PLU1, 'END\tPLU\t']) === ''
      && chan(['DWL\tTMS\t', 'TMS\t104\t4\t', 'TMS\t58\t0\t', 'END\tTMS\t']) === '' && chan(['DWL\tLAB\t', ...LAB, 'END\tLAB\t']) === ''
      && chan(khoiXoaVaNapPlu([PLU1])) === '');
    const bi: [string, string[], RegExp][] = [
      ['DWL TIM (giờ chỉ qua datGio)', khoiTim({ nam: 2026, thang: 9, ngay: 29, gio: 1, phut: 1, giay: 1 }), /đặt giờ/],
      ['DWL REP (nhật ký bán cũ)', ['DWL\tREP\t', 'REP\t26\t9\t25\t15\t16\t46\t29\t1\t0\t', 'END\tREP\t'], /REP/],
      ['DWL INF (đổi tên cân)', ['DWL\tINF\t', 'INF\ta\tb\t0\txxx\t', 'END\tINF\t'], /INF/],
      ['DWL MAC', ['DWL\tMAC\t', 'MAC\t0\t35\t240\t255\t1\t2\t', 'END\tMAC\t'], /MAC/],
      ['DWL VER (firmware)', ['DWL\tVER\t', 'VER\t@@\t', 'END\tVER\t'], /VER/],
      ['TMS 150 (địa chỉ IP)', ['DWL\tTMS\t', 'TMS\t150\t192\t', 'END\tTMS\t'], /mạng/],
      ['TMS 43 (chế độ mạng)', ['DWL\tTMS\t', 'TMS\t43\t0\t', 'END\tTMS\t'], /mạng/],
      ['TMS 431 (mạng phụ)', ['DWL\tTMS\t', 'TMS\t431\t1\t', 'END\tTMS\t'], /mạng/],
      ['TMT 15 (tên WiFi)', ['DWL\tTMT\t', 'TMT\t15\tabc\t', 'END\tTMT\t'], /WiFi/],
      ['TMT 16 (mật khẩu WiFi)', ['DWL\tTMT\t', 'TMT\t16\tabc\t', 'END\tTMT\t'], /WiFi/],
      ['CLR LAB', ['CLR\tLAB\t', 'CLR\tEND\t'], /xoá cả phần LAB/],
      ['CLR TMS', ['CLR\tTMS\t', 'CLR\tEND\t'], /xoá cả phần TMS/],
      ['CLR thiếu CLR END', ['CLR\tPLU\t', 'DWL\tPLU\t', PLU1, 'END\tPLU\t'], /CLR END/],
      ['khối chưa đóng', ['DWL\tPLU\t', PLU1], /chưa đóng/],
      ['đóng sai phần', ['DWL\tPLU\t', PLU1, 'END\tLAB\t'], /đóng sai/],
      ['dòng ngoài khối', [PLU1], /ngoài khối/],
      ['dòng lạ trong khối', ['DWL\tPLU\t', 'LAB\t1\t', 'END\tPLU\t'], /nằm trong khối/],
      ['dòng có CR', ['DWL\tPLU\t', PLU1 + '\r', 'END\tPLU\t'], /xuống dòng/],
      ['ký tự ngoài 0–255 (chưa đổi chuỗi byte)', ['DWL\tPLU\t', PLU1.replace('x', 'ư'), 'END\tPLU\t'], /chuỗi byte/],
      ['phong bì file USB (ECS VER)', ['ECS\tVER\t100\t', 'DWL\tPLU\t', PLU1, 'END\tPLU\t'], /ngoài khối/],
      ['rỗng', [], /không có dữ liệu/],
    ];
    const sai = bi.filter(([, d, re]) => !re.test(chan(d))).map(([t, d]) => `${t}: ${chan(d) || 'không chặn'}`);
    ok(`kiemKhoiGhi chặn ${bi.length} kiểu dữ liệu nguy hiểm / sai dạng`, sai.length === 0, sai.join(' | '));

    ok('coDauTru: V3.14E8 có dấu trừ; V2.30A, model 2 từ, phiên bản ngắn / lạ thì không',
      coDauTru('TM-xA UA006 V3.14E8') && coDauTru('TM-xA UA006 V2.38A') && !coDauTru('TM-xA UA006 V2.30A') && !coDauTru('TM-xA V3.14E8')
      && !coDauTru('TM-xA UA006 V3.1') && !coDauTru('TM-xA UA006 Vx.yzE8'));
    ok('yeuCauBaoCao: "UPL\\tREP\\t-5\\t" và "UPL\\tREP\\t5\\t"', yeuCauBaoCao('TM-xA UA006 V3.14E8', 5) === 'UPL\tREP\t-5\t'
      && yeuCauBaoCao('TM-xA UA006 V2.30A', 5) === 'UPL\tREP\t5\t');

    // =========================================================================
    console.log('GT2 · Bắt tay: MAC thập phân → hex, INF, INA, INM');
    const can = await canMoi();
    const kn = await moKetNoi(IP, can.cong, NHANH);
    ok('Mã máy: MAC\\t0\\t35\\t240\\t26\\t236\\t177 → 0023F01AECB1', kn.thongTin.mac === '0023F01AECB1', kn.thongTin.mac);
    ok('INF: tên quán, tên máy (chữ có dấu), số máy, model, phiên bản', kn.thongTin.cuaHang === 'Quán thử' && kn.thongTin.tenMay === 'Cân quầy thử'
      && kn.thongTin.soMay === 0 && kn.thongTin.model === 'TM-xA UA006 V3.14E8' && kn.thongTin.phienBan === 'V3.14E8', JSON.stringify(kn.thongTin));
    ok('INA: bảng mã UTF-8', kn.thongTin.maHoa === 'UTF-8');
    ok('Byte bắt tay đúng như hãng: EF BB BF 0D 0A, UPL MAC, UPL INF, UPL END (không có UPL END sau MAC)',
      await can.choNhan(() => can.nhanTu().equals(B(BAT_TAY)), 1000), hien(can.nhanTu()));

    const canInm = await canMoi({ du: { inm: 'INM\tAABBCCDDEEFF\taabbccddeeff\t1\t', ina: 'INA\tGBK\tUTF-8\t0\t1\t1\t' } });
    const knInm = await moKetNoi(IP, canInm.cong, NHANH);
    ok('INM có mã máy → dùng mã đó (viết hoa) như hãng; INA enc1 khác enc2 → lấy enc1', knInm.thongTin.mac === 'AABBCCDDEEFF' && knInm.thongTin.maHoa === 'GBK', JSON.stringify(knInm.thongTin));
    const truocGbk = await moc(canInm);
    const eGbk = await loiCua(() => knInm.ghi(['DWL\tPLU\t', PLU1, 'END\tPLU\t']));
    ok('Cân báo bảng mã khác UTF-8 → không ghi, chưa gửi byte nào', laLoi(eGbk, 'khong-cho-phep') && /GBK/.test(eGbk!.message)
      && canInm.nhanTu().length === truocGbk, eGbk?.message);
    ok('… đọc vẫn được', (await knInm.docPhan('PLU')).length === 3);
    knInm.dong();
    const canZ = await canMoi({ du: { inm: 'INM\tZZZZZZZZZZZZ\tZZZZ00000000\t0\t', ina: null, inf: 'INF\t\t\t7\tTM-xA\t' } });
    const knZ = await moKetNoi(IP, canZ.cong, NHANH);
    ok('INM bắt đầu ZZZZ → 000000000000; không có INA → maHoa rỗng; model một từ → phiên bản rỗng; số máy 7',
      knZ.thongTin.mac === '000000000000' && knZ.thongTin.maHoa === '' && knZ.thongTin.phienBan === '' && knZ.thongTin.soMay === 7, JSON.stringify(knZ.thongTin));
    knZ.dong();

    // =========================================================================
    console.log('GT3 · Đọc từng phần (UPL <phần>)');
    const P = PHAN();
    const saiPhan: string[] = [];
    for (const ten of ['TMS', 'TMT', 'SCP', 'DPT', 'CLS', 'PLU', 'BAR', 'LAB', 'SAL'] as const) {
      const d = await kn.docPhan(ten);
      if (JSON.stringify(d) !== JSON.stringify(P[ten])) saiPhan.push(`${ten}: ${hien(d.join('|'))}`);
    }
    ok('Đọc đủ 9 phần, đúng từng byte (kể cả chữ UTF-8, byte 0xFF, phần rỗng)', saiPhan.length === 0, saiPhan.join(' · '));
    await moc(can);
    const soYc = can.yeuCau.length;
    const truocPlu = await moc(can);
    await kn.docPhan('PLU');
    ok('Byte gửi khi đọc PLU: CRLF, UPL\\tPLU\\t, UPL\\tEND\\t', await can.choNhan(() => can.nhanTu().subarray(truocPlu).equals(B('\r\nUPL\tPLU\t\r\nUPL\tEND\t\r\n'))),
      hien(can.nhanTu().subarray(truocPlu)));
    ok('Cân giả thấy UPL PLU rồi UPL END', can.yeuCau.slice(soYc).join('|') === 'UPL\tPLU\t|UPL\tEND\t');
    const lab = await kn.docPhan('LAB');
    ok('LAB: 2 mẫu tem, mỗi mẫu LAB → LAS… → LAE', lab.length === 7 && lab.filter(d => d === 'LAE\t').length === 2 && lab[0].startsWith('LAB\t28\t') && lab[4].startsWith('LAB\t29\t'));
    const eTen = await loiCua(() => kn.docPhan('REP' as 'PLU'));
    ok('Đọc phần không có trong danh sách (REP) → báo, không gửi', laLoi(eTen, 'khong-cho-phep'));

    await moc(can);
    const yc0 = can.yeuCau.length;
    const [a, b] = await Promise.all([kn.docPhan('PLU'), kn.docPhan('LAB')]);
    ok('Hai lệnh gọi cùng lúc chạy lần lượt, không chen nhau', a.length === 3 && b.length === 7
      && await can.choNhan(() => can.yeuCau.slice(yc0).join('|') === 'UPL\tPLU\t|UPL\tEND\t|UPL\tLAB\t|UPL\tEND\t'), can.yeuCau.slice(yc0).join('|'));

    for (const [ten, dat] of [['LF + BOM + bọc DWL…END', { xuongDong: '\n', bom: true, bocKhoi: true }], ['CR', { xuongDong: '\r', bom: false, bocKhoi: false }]] as const) {
      const c = await canMoi();
      Object.assign(c, dat);
      const k = await moKetNoi(IP, c.cong, NHANH);
      const d = await k.docPhan('PLU');
      const l = await k.docPhan('LAB');
      ok(`Cân trả xuống dòng ${ten}: vẫn đọc đúng từng byte`, JSON.stringify(d) === JSON.stringify(P.PLU) && JSON.stringify(l) === JSON.stringify(P.LAB)
        && k.thongTin.mac === '0023F01AECB1', hien(d.join('|')));
      k.dong();
    }
    const canChen = await canMoi({ hong: { loai: 'chen-dong', dong: ['ENDX\tPLU\t', 'ASK\tREP\t', 'XYZ\t1\t', '', 'LAS\t9\t'] } });
    const knChen = await moKetNoi(IP, canChen.cong, NHANH);
    const dChen = await knChen.docPhan('PLU');
    ok('Dòng ENDX không phải END; dòng ASK, dòng lạ, dòng trống bị bỏ qua', JSON.stringify(dChen) === JSON.stringify(P.PLU), hien(dChen.join('|')));
    knChen.dong();

    kn.dong();

    const canLae = await canMoi({ hong: { loai: 'lab-thieu-lae' } });
    const knLae = await moKetNoi(IP, canLae.cong, NHANH);
    const t0 = Date.now();
    const eLae = await loiCua(() => knLae.docPhan('LAB'));
    ok('Mẫu tem thiếu LAE → báo ngay (không chờ hết giờ), chỉ đường USB', laLoi(eLae, 'sai-du-lieu') && /LAE/.test(eLae!.message)
      && /USB/.test(eLae!.message) && Date.now() - t0 < 1000, `${eLae?.message} (${Date.now() - t0} ms)`);
    ok('… kết nối bị đóng, lệnh sau báo', laLoi(await loiCua(() => knLae.docPhan('PLU')), 'mat-ket-noi') && await canLae.choNhan(() => canLae.ketNoi[0].daDong));

    // =========================================================================
    console.log('GT4 · docTuCan: ghép file dạng USB mà docFileCan đọc được');
    const canDoc = await canMoi();
    const { thongTin, du } = await docTuCan(IP, canDoc.cong, NHANH);
    const f = docFileCan(du);
    ok('docTuCan trả thông tin cân', thongTin.mac === '0023F01AECB1' && thongTin.phienBan === 'V3.14E8');
    ok('docFileCan đọc được: phiên bản V3.14E8, 3 hàng, giá theo TMS 202 = 3 số lẻ', f.phienBan === 'V3.14E8' && f.plu.length === 3 && f.soLeGia === 3
      && f.plu.map(p => `${p.so}:${p.ma}:${p.gia}`).join() === '1:10001:845000,2:10002:876000,3:10003:695000', f.plu.map(p => `${p.so}:${p.ma}:${p.gia}`).join());
    ok('Tên hàng đọc ra chữ có dấu; dòng có byte 0xFF giữ y nguyên', f.plu[0].ten === 'Hàng thử A' && f.plu[2].tho === PLU3);
    ok('Có đủ phần DPT, CLS, PLU, BAR, LAB, SCP, TMS, TMT; không có REP, INF, TIM', ['DPT', 'CLS', 'PLU', 'BAR', 'LAB', 'SCP', 'TMS', 'TMT'].every(t => f.phan[t])
      && !f.phan.REP && !f.phan.INF && !f.phan.TIM, Object.keys(f.phan).join());
    const chuFile = Buffer.from(du).toString('latin1');
    ok('File như cân tự lưu: không BOM, dòng đầu ECS VER, dòng trống sau mỗi khối, cuối END ECS + CRLF, thứ tự DPT CLS PLU BAR LAB SCP TMS TMT',
      chuFile.startsWith('ECS\tVER\tV3.14E8\t\r\n\r\nDWL\tDPT\t\r\nEND\tDPT\t\r\n\r\nDWL\tCLS\t\r\n') && chuFile.endsWith('END\tTMT\t\r\n\r\nEND\tECS\t\r\n')
      && chuFile.split('\r\n').filter(d => d.startsWith('DWL\t')).join('|') === 'DWL\tDPT\t|DWL\tCLS\t|DWL\tPLU\t|DWL\tBAR\t|DWL\tLAB\t|DWL\tSCP\t|DWL\tTMS\t|DWL\tTMT\t'
      && !/\r(?!\n)|(?<!\r)\n/.test(chuFile), hien(chuFile.slice(0, 80)));
    ok('Mẫu tem trong file y nguyên (LAB, LAS, LAE)', f.dong.slice(f.phan.LAB.dau + 1, f.phan.LAB.cuoi).join('|') === P.LAB.join('|'));
    ok('HỒI QUY: file ghép không giữ tên / mật khẩu WiFi (TMT 15, 16) cân trả — file gốc đi xuống cân ở mọi lần gửi sau; TMT 0, 1 còn',
      !f.dong.some(d => /^TMT\t(15|16|19)\t/.test(d)) && f.dong.includes(PHAN().TMT[0]) && f.dong.includes(PHAN().TMT[1]),
      JSON.stringify(f.dong.filter(d => d.startsWith('TMT\t'))));
    const mongDoc = '\r\n' + ['TMS', 'TMT', 'SCP', 'DPT', 'CLS', 'PLU', 'BAR', 'LAB'].map(t => `UPL\t${t}\t\r\nUPL\tEND\t\r\n`).join('');
    ok('Byte gửi: một CRLF rồi UPL TMS/TMT/SCP/DPT/CLS/PLU/BAR/LAB, mỗi phần kèm UPL END (như "Upload data" của hãng)',
      await choByte(canDoc, mongDoc), hien(sauBatTay(canDoc)));
    ok('docTuCan xong thì đóng kết nối', await canDoc.choNhan(() => canDoc.ketNoi[0].daDong));
    const canDoc2 = await canMoi();
    Object.assign(canDoc2, { xuongDong: '\n', bom: true, bocKhoi: true });
    ok('Cân trả LF + BOM + bọc khối: file ra y hệt', Buffer.from((await docTuCan(IP, canDoc2.cong, NHANH)).du).equals(Buffer.from(du)));
    ok('ghepFileUsb không có phần PLU vẫn là file (docFileCan báo thiếu PLU, không sập)', (() => {
      try { docFileCan(ghepFileUsb('V3.14E8', { TMS: [] })); return false; } catch (e) { return /PLU/.test((e as Error).message); }
    })());

    // =========================================================================
    console.log('GT5 · Nhật ký bán (UPL REP -N): đọc hai lần cho khớp');
    const canBc = await canMoi();
    const knBc = await moKetNoi(IP, canBc.cong, NHANH);
    const bcTruoc = await moc(canBc);
    const bc = await knBc.docBaoCao(4);
    ok('Từ FID 4 (tính cả 4): 2 giao dịch, 6 dòng', bc.length === 6 && bc[0].split('\t')[7] === '4' && bc[3].split('\t')[7] === '5', hien(bc.join('|')));
    const mongBc = '\r\n' + 'UPL\tREP\t-4\t\r\nUPL\tEND\t\r\n'.repeat(2) + 'UPL\tEND\t\r\n';
    ok('Hai lần đọc giống nhau → nhận; byte: CRLF, (UPL REP -4, UPL END) × 2, UPL END', await canBc.choNhan(() => canBc.nhanTu().subarray(bcTruoc).equals(B(mongBc))),
      hien(canBc.nhanTu().subarray(bcTruoc)));
    const yRong = canBc.yeuCau.length;
    ok('Không có giao dịch mới → nhận ngay sau 1 lần đọc', (await knBc.docBaoCao(99)).length === 0
      && canBc.yeuCau.slice(yRong).filter(y => y.startsWith('UPL\tREP')).length === 1);

    canBc.hong = { loai: 'bao-cao-tang' };
    const yTang = canBc.yeuCau.length;
    const bcTang = await knBc.docBaoCao(4);
    ok('Lần sau dài hơn (vừa có người bán) → lấy lần TRƯỚC, 2 lần đọc', bcTang.length === 6 && JSON.stringify(bcTang) === JSON.stringify(bc)
      && canBc.yeuCau.slice(yTang).filter(y => y.startsWith('UPL\tREP')).length === 2, `${bcTang.length} dòng`);
    canBc.du.baoCao = BAO_CAO();

    canBc.hong = { loai: 'bao-cao-lech-mot-lan' };
    const knLech = await moKetNoi(IP, canBc.cong, NHANH);
    const yLech = canBc.yeuCau.length;
    const bcLech = await knLech.docBaoCao(4);
    ok('Lần đầu khác, hai lần sau khớp → 3 lần đọc, nhận bản đủ', JSON.stringify(bcLech) === JSON.stringify(bc)
      && canBc.yeuCau.slice(yLech).filter(y => y.startsWith('UPL\tREP')).length === 3);
    knLech.dong();

    canBc.hong = { loai: 'bao-cao-khac' };
    const knKhac = await moKetNoi(IP, canBc.cong, NHANH);
    const yKhac = canBc.yeuCau.length;
    const eKhac = await loiCua(() => knKhac.docBaoCao(4));
    ok('Không bao giờ khớp → báo lỗi sau đúng 11 lần đọc như hãng', laLoi(eKhac, 'sai-du-lieu') && /11 lần/.test(eKhac!.message)
      && canBc.yeuCau.slice(yKhac).filter(y => y.startsWith('UPL\tREP')).length === 11, eKhac?.message);
    canBc.hong = null;

    const eFid = await loiCua(() => knBc.docBaoCao(0));
    ok('FID bắt đầu 0 → báo, không gửi', laLoi(eFid, 'khong-cho-phep'));
    canBc.du.baoCao = [...BAO_CAO(), 'REP\t26\t9\t25\t15\t16\t46\t6\t1\t0\t', 'RES\t1\t16000,3\t1\t9\t', 'REE\t'];
    const knCot = await moKetNoi(IP, canBc.cong, NHANH);
    const eCot = await loiCua(() => knCot.docBaoCao(1));
    ok('Dòng RES thiếu cột → cả lần đọc bị bỏ (như hãng), báo lỗi', laLoi(eCot, 'sai-du-lieu') && /RES/.test(eCot!.message), eCot?.message);
    knBc.dong();

    const canCu = await canMoi({ du: { inf: 'INF\tA\tB\t0\tTM-xA UA006 V2.30A\t' } });
    const knCu = await moKetNoi(IP, canCu.cong, NHANH);
    await knCu.docBaoCao(4);
    ok('Firmware cũ (< 2.38): hỏi "UPL\\tREP\\t4\\t" không dấu trừ', canCu.yeuCau.includes('UPL\tREP\t4\t') && !canCu.yeuCau.some(y => y.includes('-')), canCu.yeuCau.join('|'));
    knCu.dong();

    // =========================================================================
    console.log('GT6 · Ghi + hàng rào UPL TIM');
    const canGhi = await canMoi();
    const knGhi = await moKetNoi(IP, canGhi.cong, NHANH);
    const pluMoi = plu(4, '10004', '990,0', chuoiByte('Hàng thử D'));
    const gTruoc = await moc(canGhi);
    await knGhi.ghi(['DWL\tPLU\t', pluMoi, 'END\tPLU\t']);
    const mongGhi = `\r\nDWL\tPLU\t\r\n${pluMoi}\r\nEND\tPLU\t\r\n\r\nUPL\tTIM\t\r\nUPL\tEND\t\r\n`;
    ok('Byte ghi đúng như hãng: CRLF, DWL PLU, dòng PLU (tab cuối), END PLU, CRLF, UPL TIM, rồi UPL END',
      await canGhi.choNhan(() => canGhi.nhanTu().subarray(gTruoc).equals(B(mongGhi))), hien(canGhi.nhanTu().subarray(gTruoc)));
    ok('Cân giả đã thêm PLU 4 (đọc lại thấy)', (await knGhi.docPhan('PLU')).includes(pluMoi));

    const xTruoc = await moc(canGhi);
    await knGhi.ghi(khoiXoaVaNapPlu([PLU1, pluMoi]));
    ok('Xoá + nạp lại: byte CLR PLU, CLR END, DWL PLU… đúng thứ tự', await canGhi.choNhan(() => canGhi.nhanTu().subarray(xTruoc)
      .equals(B(`\r\nCLR\tPLU\t\r\nCLR\tEND\t\r\nDWL\tPLU\t\r\n${PLU1}\r\n${pluMoi}\r\nEND\tPLU\t\r\n\r\nUPL\tTIM\t\r\nUPL\tEND\t\r\n`))), hien(canGhi.nhanTu().subarray(xTruoc)));
    const sauXoa = await knGhi.docPhan('PLU');
    ok('… đọc lại: cân chỉ còn đúng 2 hàng đã gửi', JSON.stringify(sauXoa) === JSON.stringify([PLU1, pluMoi]), hien(sauXoa.join('|')));

    const truocChan = await moc(canGhi);
    const eChan = await loiCua(() => knGhi.ghi(['DWL\tTMS\t', 'TMS\t150\t10\t', 'END\tTMS\t']));
    const eTim = await loiCua(() => knGhi.ghi(khoiTim({ nam: 2020, thang: 1, ngay: 1, gio: 0, phut: 0, giay: 0 })));
    await new Promise(r => setTimeout(r, 50));
    ok('Ghi thông số mạng / khối giờ bị chặn, cân giả không nhận byte nào', laLoi(eChan, 'khong-cho-phep') && laLoi(eTim, 'khong-cho-phep')
      && canGhi.nhanTu().length === truocChan);
    ok('… kết nối vẫn dùng tiếp được', (await knGhi.docPhan('PLU')).length === 2);

    canGhi.hong = { loai: 'end-thua', tim: 150 };
    const tEnd = Date.now();
    await knGhi.ghi(['DWL\tPLU\t', PLU2, 'END\tPLU\t']);
    const xongEnd = Date.now();
    ok('Cân trả END thừa trước TIM: vẫn chờ dòng TIM rồi END của nó', canGhi.lucTraTim > 0 && canGhi.lucTraTim <= xongEnd && xongEnd - tEnd >= 140,
      `${xongEnd - tEnd} ms`);
    canGhi.hong = null;
    knGhi.dong();
    ok('dong(): cân giả thấy kết nối đóng; lệnh sau báo', await canGhi.choNhan(() => canGhi.ketNoi[0].daDong)
      && laLoi(await loiCua(() => knGhi.docPhan('PLU')), 'mat-ket-noi'));

    const canCham = await canMoi({ hong: { loai: 'hang-rao-cham', ms: 200 } });
    const knCham = await moKetNoi(IP, canCham.cong, { ...NHANH, choHangRaoMs: 1000 });
    ok('Hàng rào chậm 200 ms, chờ tối đa 1 s → xong', (await loiCua(() => knCham.ghi(['DWL\tPLU\t', PLU1, 'END\tPLU\t']))) === null);
    knCham.dong();
    canCham.hong = { loai: 'hang-rao-cham', ms: 700 };
    const knCham2 = await moKetNoi(IP, canCham.cong, { ...NHANH, choHangRaoMs: 250 });
    const tCham = Date.now();
    const eCham = await loiCua(() => knCham2.ghi(khoiXoaVaNapPlu([PLU1])));
    const lauCham = Date.now() - tCham;
    ok('Hàng rào chậm 700 ms, chờ tối đa 250 ms → hết giờ đúng hạn, "chưa chắc đã lưu", có lệnh xoá thì bảo nạp USB ngay',
      laLoi(eCham, 'het-gio') && (eCham as LoiGiaoThuc).daGhi && lauCham >= 240 && lauCham < 650 && /Chưa chắc/.test(eCham!.message)
      && /nạp USB ngay/.test(eCham!.message) && /chưa thử trên cân thật/.test(eCham!.message), `${eCham?.message} (${lauCham} ms)`);
    ok('… hết giờ thì đóng kết nối, lệnh sau báo "mở kết nối mới"', laLoi(await loiCua(() => knCham2.docGio()), 'mat-ket-noi')
      && await canCham.choNhan(() => canCham.ketNoi[1].daDong));

    const canDut = await canMoi({ hong: { loai: 'dong-giua-chung', khi: 'TIM' } });
    const knDut = await moKetNoi(IP, canDut.cong, NHANH);
    const eDut = await loiCua(() => knDut.ghi(['DWL\tPLU\t', PLU1, 'END\tPLU\t']));
    ok('Cân đóng kết nối giữa hàng rào → "mất kết nối", đã ghi, chỉ đường USB', laLoi(eDut, 'mat-ket-noi') && (eDut as LoiGiaoThuc).daGhi
      && /USB/.test(eDut!.message), eDut?.message);

    // =========================================================================
    console.log('GT7 · Giờ cân: đọc (UPL TIM), đặt (DWL TIM + hàng rào)');
    const canGio = await canMoi();
    const knGio = await moKetNoi(IP, canGio.cong, NHANH);
    const gT = await moc(canGio);
    const g0 = await knGio.docGio();
    ok('docGio: 25/09/2026 16:54:12 (năm = 2000 + YY)', JSON.stringify(g0) === JSON.stringify({ nam: 2026, thang: 9, ngay: 25, gio: 16, phut: 54, giay: 12 }), JSON.stringify(g0));
    const canNam4 = await canMoi({ hong: { loai: 'nam-4-so' } });
    const knNam4 = await moKetNoi(IP, canNam4.cong, NHANH);
    const g4 = await knNam4.docGio();
    ok('HỒI QUY: dòng TIM có năm 4 số ("2026") → năm 2026, không phải 4026 (như lucTuRep đọc nhật ký)',
      g4.nam === 2026 && g4.ngay === 25, JSON.stringify(g4));
    await knNam4.dong(); await canNam4.dong();
    ok('Byte đọc giờ: CRLF, UPL TIM, UPL END', await canGio.choNhan(() => canGio.nhanTu().subarray(gT).equals(B('\r\nUPL\tTIM\t\r\nUPL\tEND\t\r\n'))),
      hien(canGio.nhanTu().subarray(gT)));
    const dT = await moc(canGio);
    const lucMoi = { nam: 2026, thang: 9, ngay: 29, gio: 14, phut: 5, giay: 9 };
    await knGio.datGio(lucMoi);
    ok('datGio: byte CRLF, DWL TIM, TIM\\t26\\t9\\t29\\t14\\t5\\t9\\t, END TIM, CRLF, UPL TIM, UPL END',
      await canGio.choNhan(() => canGio.nhanTu().subarray(dT).equals(B('\r\nDWL\tTIM\t\r\nTIM\t26\t9\t29\t14\t5\t9\t\r\nEND\tTIM\t\r\n\r\nUPL\tTIM\t\r\nUPL\tEND\t\r\n'))),
      hien(canGio.nhanTu().subarray(dT)));
    ok('… cân giả đổi giờ, đọc lại đúng', JSON.stringify(await knGio.docGio()) === JSON.stringify(lucMoi));
    const truocGioSai = await moc(canGio);
    const eNgay = await loiCua(() => knGio.datGio({ nam: 2026, thang: 2, ngay: 30, gio: 1, phut: 1, giay: 1 }));
    await new Promise(r => setTimeout(r, 30));
    ok('Đặt ngày không có thật (30/02) → báo, không gửi', laLoi(eNgay, 'khong-cho-phep') && canGio.nhanTu().length === truocGioSai);
    canGio.hong = { loai: 'bo-qua-gio' };
    const eBoQua = await loiCua(() => knGio.datGio({ nam: 2027, thang: 1, ngay: 1, gio: 8, phut: 0, giay: 0 }));
    ok('Cân không nhận giờ mới (giờ đọc lại vẫn cũ) → báo, không nói "thành công"', laLoi(eBoQua, 'sai-du-lieu') && /chưa nhận giờ mới/.test(eBoQua!.message), eBoQua?.message);
    knGio.dong();

    // =========================================================================
    console.log('GT8 · Hỏng lúc mở kết nối: im lặng, đóng giữa chừng, MAC sai…');
    const canIm = await canMoi({ hong: { loai: 'im-lang' } });
    const tIm = Date.now();
    const eIm = await loiCua(() => moKetNoi(IP, canIm.cong, { ...NHANH, choMs: 300 }));
    const lauIm = Date.now() - tIm;
    ok('Cân im lặng → hết giờ sau đúng hạn chờ (0,3 s), câu báo chỉ đường USB', laLoi(eIm, 'het-gio') && lauIm >= 280 && lauIm < 1500
      && /0,3 giây/.test(eIm!.message) && /USB/.test(eIm!.message) && /TM-xA/.test(eIm!.message), `${eIm?.message} (${lauIm} ms)`);
    ok('… vẫn đã gửi BOM + CRLF + UPL MAC', await canIm.choNhan(() => canIm.nhanTu().equals(B('\xEF\xBB\xBF\r\nUPL\tMAC\t\r\n'))), hien(canIm.nhanTu()));
    ok('… và đóng kết nối', await canIm.choNhan(() => canIm.ketNoi[0].daDong));

    const canDutMac = await canMoi({ hong: { loai: 'dong-giua-chung', khi: 'MAC' } });
    const eDutMac = await loiCua(() => moKetNoi(IP, canDutMac.cong, NHANH));
    ok('Cân đóng giữa lúc trả MAC → "mất kết nối"', laLoi(eDutMac, 'mat-ket-noi') && /mã máy/.test(eDutMac!.message), eDutMac?.message);
    const canDutPlu = await canMoi({ hong: { loai: 'dong-giua-chung', khi: 'PLU' } });
    const eDutPlu = await loiCua(() => docTuCan(IP, canDutPlu.cong, NHANH));
    ok('Cân đóng giữa lúc trả PLU (docTuCan) → "mất kết nối khi đọc danh sách hàng", chỉ đường USB', laLoi(eDutPlu, 'mat-ket-noi')
      && /danh sách hàng/.test(eDutPlu!.message) && /lưu dữ liệu ra USB/.test(eDutPlu!.message), eDutPlu?.message);

    const canMacSai = await canMoi({ hong: { loai: 'mac-sai' } });
    const eMacSai = await loiCua(() => moKetNoi(IP, canMacSai.cong, NHANH));
    ok('Dòng MAC có số không thập phân → báo "không đúng dạng"', laLoi(eMacSai, 'sai-du-lieu') && /MAC/.test(eMacSai!.message), eMacSai?.message);
    const canMac300 = await canMoi({ du: { mac: [0, 35, 240, 26, 236, 300] } });
    ok('Dòng MAC có số > 255 → báo', laLoi(await loiCua(() => moKetNoi(IP, canMac300.cong, NHANH)), 'sai-du-lieu'));
    const canKhongMac = await canMoi({ hong: { loai: 'khong-mac' } });
    const eKhongMac = await loiCua(() => moKetNoi(IP, canKhongMac.cong, NHANH));
    ok('Cân không trả dòng MAC → hỏi đúng 3 lần rồi báo', laLoi(eKhongMac, 'sai-du-lieu') && canKhongMac.yeuCau.filter(y => y === 'UPL\tMAC\t').length === 3,
      `${eKhongMac?.message} · ${canKhongMac.yeuCau.join('|')}`);
    const canKhongInf = await canMoi({ du: { inf: null } });
    const eKhongInf = await loiCua(() => moKetNoi(IP, canKhongInf.cong, NHANH));
    ok('Cân không trả dòng INF → hỏi 3 lần, đáp UPL END một lần, rồi báo', laLoi(eKhongInf, 'sai-du-lieu') && /INF/.test(eKhongInf!.message)
      && await canKhongInf.choNhan(() => canKhongInf.nhanTu().equals(B('\xEF\xBB\xBF\r\nUPL\tMAC\t\r\n' + 'UPL\tINF\t\r\n'.repeat(3) + 'UPL\tEND\t\r\n'))),
      hien(canKhongInf.nhanTu()));
    const canSoMay = await canMoi({ du: { inf: 'INF\tA\tB\tabc\tTM-xA UA006 V3.14E8\t' } });
    ok('Số máy trong INF không phải số → báo', laLoi(await loiCua(() => moKetNoi(IP, canSoMay.cong, NHANH)), 'sai-du-lieu'));

    const cong = await congDong();
    const tNoi = Date.now();
    const eNoi = await loiCua(() => moKetNoi(IP, cong, { ...NHANH, choNoiMs: 3000 }));
    ok('Cổng không mở → "không kết nối được", chỉ đường USB, không chờ quá hạn', laLoi(eNoi, 'khong-noi') && /Không kết nối được cân ở 127\.0\.0\.1 \(cổng \d+\)/.test(eNoi!.message)
      && /USB/.test(eNoi!.message) && Date.now() - tNoi < 3500, `${eNoi?.message} (${Date.now() - tNoi} ms)`);
    const eDocNoi = await loiCua(() => docTuCan(IP, cong, { ...NHANH, choNoiMs: 3000 }));
    ok('docTuCan cổng không mở → cùng lỗi "không kết nối được"', laLoi(eDocNoi, 'khong-noi'));

    // Ghi không có lệnh xoá mà hết giờ: không bảo "thiếu hàng, nạp USB ngay".
    const canHan = await canMoi({ hong: { loai: 'hang-rao-cham', ms: 700 } });
    const knHan = await moKetNoi(IP, canHan.cong, { ...NHANH, choHangRaoMs: 250 });
    const eHan = await loiCua(() => knHan.ghi(['DWL\tPLU\t', PLU1, 'END\tPLU\t']));
    ok('Ghi không có CLR mà hết giờ: báo "chưa chắc đã lưu", không báo thiếu hàng', laLoi(eHan, 'het-gio') && /Chưa chắc/.test(eHan!.message)
      && !/nạp USB ngay/.test(eHan!.message) && /Lưu file để nạp USB/.test(eHan!.message), eHan?.message);
  } finally {
    for (const c of cacCan) await c.dong();
  }
}

// Chạy riêng: in tổng và mã thoát.
if (import.meta.main) {
  let dat = 0, hong = 0;
  const ok: Ok = (ten, dieuKien, chiTiet = '') => {
    if (dieuKien) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten} ${chiTiet}`); }
  };
  try {
    await thuGiaoThuc(ok);
  } catch (e) {
    hong++;
    console.log(`  ✗ Kiểm thử dừng giữa chừng: ${(e as Error)?.stack ?? e}`);
  }
  console.log(hong === 0 ? `\nTẤT CẢ ${dat} KIỂM TRA GIAO THỨC HAI CHIỀU ĐỀU ĐẠT` : `\n${hong} KIỂM TRA HỎNG / ${dat + hong}`);
  process.exit(hong === 0 ? 0 : 1);
}
