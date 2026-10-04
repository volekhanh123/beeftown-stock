/**
 * Kiểm thử 2.8 ở tầng thấp — không cần cân thật:
 *   - giao-thuc.ts: dòng cân tự báo (ASK) đến người nghe, không lẫn vào câu trả lời; dangMo; hỏi giờ với hạn ngắn;
 *   - giu-ket-noi.ts: dùng lại kết nối còn sống (hỏi giờ trước), mở mới khi đứt / im lặng, một kết nối mỗi lúc;
 *   - udp-can.ts: đọc gói cân phát, nghe, hỏi như hãng.
 *
 *     cd can-app && npx bun test/thu-giu-ket-noi.ts
 *
 * test/thu.ts gọi `thuGiuKetNoi(ok)`. Cân giả (test/can-gia-hai-chieu.ts) làm theo đặc tả suy từ phần mềm của hãng —
 * đạt ở đây KHÔNG có nghĩa là cân thật cũng vậy.
 */
import * as dgram from 'node:dgram';
import { LoiGiaoThuc, moKetNoi, type TuyChonKetNoi } from '../src/giao-thuc.ts';
import { GiuKetNoi } from '../src/giu-ket-noi.ts';
import { GOI_HOI, NgheUdp, docGoiUdp } from '../src/udp-can.ts';
import { chuoiByte, moCanGia, type CanGia } from './can-gia-hai-chieu.ts';

type Ok = (ten: string, dk: boolean, ct?: string) => void;

const IP = '127.0.0.1';
const NHANH: TuyChonKetNoi = { choMs: 1500, choNoiMs: 2000, nghiBaoCaoMs: 1 };
const nghi = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const loiCua = async (f: () => Promise<unknown>): Promise<Error | null> => { try { await f(); return null; } catch (e) { return e as Error; } };
const KHUON = 'PLU\t{1}\t{2}\t\t1\t{5}\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\t{15}\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\tx\t0\t0\t0\t';
const plu = (so: number, ma: string, gia: string, ten: string) =>
  KHUON.replace('{1}', String(so)).replace('{2}', ma).replace('{5}', gia).replace('{15}', chuoiByte(ten));
const PLU_GIA = [plu(1, '10001', '845,0', 'Hàng thử A'), plu(2, '10002', '876,0', 'Hàng thử B')];

export async function thuGiuKetNoi(ok: Ok): Promise<void> {
  const cacCan: CanGia[] = [];
  const canMoi = async (tuy: Parameters<typeof moCanGia>[0] = {}) => {
    const c = await moCanGia({ du: { phan: { PLU: PLU_GIA.slice(), TMS: ['TMS\t0\t28\t', 'TMS\t202\t3\t'] } }, ...tuy });
    cacCan.push(c);
    return c;
  };
  try {
    console.log('6j1 · giao-thuc.ts: cân tự báo (ASK), dangMo, hỏi giờ với hạn ngắn');
    {
      const can = await canMoi();
      const bao: string[] = [];
      const kn = await moKetNoi(IP, can.cong, { ...NHANH, khiCanBao: (d) => bao.push(d) });
      ok('Kết nối vừa mở: dangMo', kn.dangMo);
      can.day('ASK\tREP\t7\t');
      ok('Cân đẩy "ASK REP" lúc rảnh → người nghe nhận nguyên dòng', await can.choNhan(() => bao.length === 1) && bao[0] === 'ASK\tREP\t7\t', JSON.stringify(bao));
      // Cân chèn ASK trước mọi câu trả lời: câu trả lời vẫn đúng, người nghe nhận thêm.
      can.hong = { loai: 'chen-dong', dong: ['ASK\tREP\t8\t'] };
      const dong = await kn.docPhan('PLU');
      can.hong = null;
      ok('ASK chen giữa câu trả lời: danh sách PLU vẫn đúng 2 dòng, người nghe nhận dòng ASK', dong.length === 2 && dong[0] === PLU_GIA[0]
        && await can.choNhan(() => bao.includes('ASK\tREP\t8\t')), JSON.stringify([dong.length, bao]));
      const kn2 = await moKetNoi(IP, can.cong, { ...NHANH, khiCanBao: () => { throw new Error('người nghe hỏng'); } });
      can.day('ASK\tREP\t9\t');
      await nghi(30);
      const g = await loiCua(() => kn2.docGio());
      ok('Người nghe ASK ném lỗi → không làm hỏng việc đọc trên kết nối đó', g === null && kn2.dangMo, g?.message);
      const kn3 = await moKetNoi(IP, can.cong, NHANH);
      can.day('ASK\tREP\t10\t');
      ok('Không có người nghe → bỏ dòng ASK như trước (đọc giờ vẫn đúng)', (await kn3.docGio()).nam === 2026);
      can.ngatKetNoi();
      ok('Cân cắt kết nối → dangMo = false (không chờ tới lần đọc sau mới biết)', await can.choNhan(() => !kn.dangMo && !kn2.dangMo && !kn3.dangMo));
      const kn4 = await moKetNoi(IP, can.cong, NHANH);
      kn4.dong();
      ok('Đã đóng → dangMo = false', !kn4.dangMo);

      const canCham = await canMoi({ hong: { loai: 'hang-rao-cham', ms: 600 } });
      const knCham = await moKetNoi(IP, canCham.cong, NHANH);
      const t0 = Date.now();
      const eCham = await loiCua(() => knCham.docGio(150));
      ok('docGio(150): cân trả lời chậm 600 ms → hết giờ sau ~150 ms (không chờ 1,5 giây), kết nối bị đóng',
        eCham instanceof LoiGiaoThuc && eCham.loai === 'het-gio' && Date.now() - t0 < 1000 && !knCham.dangMo, `${eCham?.message} ${Date.now() - t0} ms`);
    }

    console.log('6j2 · giu-ket-noi.ts: dùng lại kết nối còn sống, mở mới khi đứt / im lặng, một kết nối mỗi lúc');
    {
      const can = await canMoi();
      let soMo = 0;
      const giu = new GiuKetNoi(async (ip, cong, tuy) => { soMo++; return moKetNoi(ip, cong, tuy); });
      const a = await giu.lay(IP, can.cong, NHANH);
      const soYc = can.yeuCau.length;
      const b = await giu.lay(IP, can.cong, NHANH);
      ok('Lấy lần hai → đúng kết nối cũ, không mở thêm; hỏi giờ trước khi dùng lại (UPL TIM)', a === b && soMo === 1 && can.ketNoi.length === 1
        && can.yeuCau.slice(soYc).includes('UPL\tTIM\t'), JSON.stringify(can.yeuCau.slice(soYc)));
      giu.daNghe(b);
      const tt = giu.trangThai();
      ok('Trạng thái: đang mở, đúng địa chỉ / cổng, đã nghe, chưa lỗi, mở 1 lần', tt.dangMo && tt.ip === IP && tt.cong === can.cong && !!tt.lucNghe
        && tt.loi === null && tt.soLanMo === 1, JSON.stringify(tt));

      can.ngatKetNoi();
      await can.choNhan(() => !a.dangMo);
      const c = await giu.lay(IP, can.cong, NHANH);
      ok('Cân cắt kết nối (khởi động lại) → lần lấy sau mở kết nối mới, bắt tay lại', c !== a && soMo === 2 && c.dangMo && giu.trangThai().soLanMo === 2);

      // Cân im lặng (treo, mất WiFi mà TCP chưa biết): hỏi giờ hết hạn ngắn → không dùng kết nối đó để ghi.
      can.hong = { loai: 'im-lang' };
      const t0 = Date.now();
      const eIm = await loiCua(() => giu.lay(IP, can.cong, NHANH));
      can.hong = null;
      ok('Cân im lặng → hỏi giờ hết hạn, đóng kết nối, mở mới cũng hết giờ → báo lỗi; không gửi khối ghi nào; trạng thái có lỗi',
        eIm instanceof LoiGiaoThuc && !c.dangMo && can.khoi.length === 0 && giu.trangThai().loi !== null && !giu.trangThai().dangMo
        && Date.now() - t0 < 6000, `${eIm?.message} ${Date.now() - t0} ms`);
      const d = await giu.lay(IP, can.cong, NHANH);
      ok('Cân trả lời lại → lần lấy sau mở được, hết lỗi', d.dangMo && giu.trangThai().loi === null && giu.trangThai().dangMo);

      const e = await giu.lay(IP, can.cong, NHANH, true);
      ok('moi = true → luôn bắt tay lại trên kết nối mới, đóng kết nối cũ', e !== d && !d.dangMo && e.dangMo);
      giu.hong(e, new Error('việc hỏng'));
      ok('Việc trên kết nối hỏng (kể cả lỗi không phải của kết nối) → bỏ kết nối: lần sau bắt tay lại', !e.dangMo && !giu.trangThai().dangMo);
      const f = await giu.lay(IP, can.cong, NHANH);
      const khac = await moKetNoi(IP, can.cong, NHANH);
      giu.bo(khac);
      ok('bo(kết nối khác) chỉ đóng kết nối đó, giữ kết nối đang giữ', !khac.dangMo && f.dangMo && giu.trangThai().dangMo);

      // Hai việc cùng cần kết nối lúc chưa có: chỉ mở một.
      giu.bo();
      const truoc = soMo;
      const [g1, g2] = await Promise.all([giu.lay(IP, can.cong, NHANH), giu.lay(IP, can.cong, NHANH)]);
      ok('Hai việc cùng lấy kết nối → chỉ mở một kết nối, cả hai dùng chung', g1 === g2 && soMo - truoc === 1, `${soMo - truoc}`);

      const can2 = await canMoi();
      const h = await giu.lay(IP, can2.cong, NHANH);
      ok('Đổi cổng (cân khác) → đóng kết nối cũ, mở kết nối tới cổng mới', h !== g1 && !g1.dangMo && h.dangMo && giu.trangThai().cong === can2.cong);
      giu.bo();
      const eNoi = await loiCua(() => giu.lay(IP, 1, NHANH));
      ok('Cổng không mở → ném đúng lỗi "không kết nối được" của giao-thuc.ts, trạng thái có lỗi', eNoi instanceof LoiGiaoThuc
        && eNoi.loai === 'khong-noi' && /Không kết nối được/.test(giu.trangThai().loi ?? ''), giu.trangThai().loi ?? '');
      giu.bo();
    }

    console.log('6j3 · udp-can.ts: đọc gói cân phát, nghe, hỏi như hãng');
    {
      const B = (s: string) => Buffer.from(s, 'latin1');
      ok('docGoiUdp: "UDP⇥33581⇥⇥␍␊" → 33581; lời hỏi "UDP⇥␍␊", cổng 0 / 70000 / chữ, gói lạ → null',
        docGoiUdp(B('UDP\t33581\t\t\r\n')) === 33581 && docGoiUdp(B('UDP\t33581\t')) === 33581 && docGoiUdp(GOI_HOI) === null
        && docGoiUdp(B('UDP\t0\t\r\n')) === null && docGoiUdp(B('UDP\t70000\t\r\n')) === null && docGoiUdp(B('UDP\tabc\t\r\n')) === null
        && docGoiUdp(B('xin chao')) === null && docGoiUdp(B('')) === null);
      let gio = 1_000_000;
      const nghe = new NgheUdp({ congNghe: 0, diaChiNghe: IP, bayGio: () => gio });
      await nghe.bat();
      ok('Bật nghe UDP (cổng bất kỳ, 127.0.0.1) → đang nghe, không lỗi', nghe.dangNghe && nghe.loi === null && !!nghe.cong, nghe.loi ?? '');
      const phat = dgram.createSocket('udp4');
      await new Promise<void>(r => phat.bind(0, '127.0.0.2', () => r()));
      const gui = (s: string, cong: number, ip = IP) => new Promise<void>(r => phat.send(B(s), cong, ip, () => r()));
      await gui('UDP\t33581\t\t\r\n', nghe.cong!);
      await gui('xin chao\r\n', nghe.cong!);
      const da = await (async () => { for (let i = 0; i < 100 && !nghe.ganDay(60_000).length; i++) await nghi(10); return nghe.ganDay(60_000); })();
      ok('Cân (127.0.0.2) tự phát → nghe thấy đúng địa chỉ, cổng 33581; gói lạ bỏ qua', da.length === 1 && da[0].ip === '127.0.0.2'
        && da[0].cong === 33581 && da[0].soGoi === 1, JSON.stringify(da));
      gio += 61_000;
      ok('Quá 60 giây không nghe lại → không còn trong danh sách "gần đây"', nghe.ganDay(60_000).length === 0);

      // Hỏi như hãng: 5 gói "UDP⇥␍␊" tới cổng hỏi; cân trả lời tới cổng nghe.
      const nhanHoi: string[] = [];
      phat.on('message', (m, r) => { nhanHoi.push(m.toString('latin1')); void gui('UDP\t33581\t\t\r\n', r.port, r.address); });
      const nghe2 = new NgheUdp({ congNghe: 0, diaChiNghe: IP, diaChiHoi: '127.0.0.2', congHoi: phat.address().port, bayGio: () => gio });
      await nghe2.bat();
      await nghe2.hoi(5, 0);
      const da2 = await (async () => { for (let i = 0; i < 100 && !nghe2.ganDay(60_000).length; i++) await nghi(10); return nghe2.ganDay(60_000); })();
      ok('Hỏi: gửi 5 gói "UDP⇥␍␊" tới cổng hỏi; cân trả lời → nghe thấy 127.0.0.2', nhanHoi.length === 5 && nhanHoi.every(m => m === 'UDP\t\r\n')
        && da2.length === 1 && da2[0].ip === '127.0.0.2', JSON.stringify([nhanHoi.length, da2]));
      nghe2.tat();
      ok('Tắt → thôi nghe, quên các máy đã nghe; hỏi khi không nghe thì không gửi gì', !nghe2.dangNghe && nghe2.ganDay(60_000).length === 0
        && await (async () => { const n = nhanHoi.length; await nghe2.hoi(1, 0); await nghi(30); return nhanHoi.length === n; })());
      const nghe3 = new NgheUdp({ congNghe: 0, diaChiNghe: '10.255.255.1' });
      await nghe3.bat();
      ok('Không nghe được (địa chỉ không phải của máy) → không ném, ghi lỗi tiếng Việt, không đang nghe', !nghe3.dangNghe
        && /Không nghe được cổng UDP/.test(nghe3.loi ?? '') && /dò WiFi như trước/.test(nghe3.loi ?? ''), nghe3.loi ?? '');
      await nghe.bat();
      ok('Bật lần hai khi đang nghe → không mở thêm cổng', nghe.dangNghe);
      nghe.tat();
      const congTam = await new Promise<number>((xong) => { const x = dgram.createSocket('udp4'); x.bind(0, IP, () => { const c = x.address().port; x.close(() => xong(c)); }); });
      const nghe4 = new NgheUdp({ congNghe: congTam, diaChiNghe: IP });
      const dangBat = nghe4.bat();
      nghe4.tat();
      await dangBat;
      const moDuoc = await new Promise<boolean>((r) => { const x = dgram.createSocket('udp4'); x.once('error', () => r(false)); x.bind(congTam, IP, () => { x.close(() => r(true)); }); });
      ok('HỒI QUY: tắt lúc đang mở cổng UDP → không giữ cổng (chương trình khác mở được cổng đó), không đang nghe', !nghe4.dangNghe && moDuoc);
      await nghe4.bat();
      ok('… bật lại sau đó → nghe được', nghe4.dangNghe);
      nghe4.tat();
      phat.close();
    }
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
    await thuGiuKetNoi(ok);
  } catch (e) {
    hong++;
    console.log(`  ✗ Kiểm thử dừng giữa chừng: ${(e as Error)?.stack ?? e}`);
  }
  console.log(hong === 0 ? `\nTẤT CẢ ${dat} KIỂM TRA GIỮ KẾT NỐI / UDP ĐỀU ĐẠT` : `\n${hong} KIỂM TRA HỎNG / ${dat + hong}`);
  process.exit(hong === 0 ? 0 : 1);
}

