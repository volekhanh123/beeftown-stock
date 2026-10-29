/**
 * Đơn mẫu cho laptop thử:  npm run don-mau   (cùng THU_MUC_DU_LIEU với lúc chạy máy chủ)
 *
 * Ghi thẳng vào sổ đơn, không qua mạng: 5 đơn tên "Khách thử …", số 0900 000 00x, đủ các bước để xem màn hình quầy.
 * Đợt 1 chưa có thanh toán Zalo, nên đây là cách duy nhất có đơn "đã trả tiền" — không đường dẫn nào của máy chủ
 * đánh dấu đã trả. KHÔNG chạy trên máy chủ bán thật: lệnh từ chối khi sổ đã có đơn của khách thật.
 */
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { CAU_HINH_GIO } from '../../mini-app/src/cau-hinh.ts';
import { cacGioChon, cacNgayChon } from '../../mini-app/src/don.ts';
import { dongHoVn, kiemDon } from '../src/tao-don.ts';
import { SoDon } from '../src/so-don.ts';

const thuMuc = resolve(process.env.THU_MUC_DU_LIEU ?? './du-lieu');
mkdirSync(thuMuc, { recursive: true });
const so = new SoDon(join(thuMuc, 'don.sqlite'));
const khachThat = (so.db.query("select count(*) as n from don where ten not like 'Khách thử %'").get() as { n: number }).n;
if (khachThat > 0) {
  console.error(`Sổ đơn đã có ${khachThat} đơn không phải đơn mẫu — không ghi thêm đơn mẫu vào đây.`);
  process.exit(1);
}

const ms = Date.now();
// Ngày đầu tiên còn ít nhất 5 giờ nhận (chạy lúc chiều tối thì hôm nay có thể chỉ còn vài giờ).
const ngay = cacNgayChon(dongHoVn(ms), CAU_HINH_GIO).map(n => n.giaTri)
  .find(n => cacGioChon(n, dongHoVn(ms), CAU_HINH_GIO).length >= 5);
const gio = ngay ? cacGioChon(ngay, dongHoVn(ms), CAU_HINH_GIO) : [];
if (!ngay) { console.error('Không tìm được ngày nào còn đủ 5 giờ nhận để đặt đơn mẫu.'); process.exit(1); }

const MAU: { khay: Record<string, number>; buoc: ('tra' | 'soan' | 'xong' | 'huy')[]; ghiChu?: string }[] = [
  { khay: { 'ribeye-with-cap': 2, 'la-galbi': 1 }, buoc: ['tra'], ghiChu: 'Gọi trước khi tới 10 phút' },
  { khay: { 'outside-skirt': 1 }, buoc: ['tra', 'soan'] },
  { khay: { chadolbagi: 3, galbisal: 1 }, buoc: ['tra', 'soan', 'xong'] },
  { khay: { 'top-blade': 1 }, buoc: ['tra', 'huy'] },
  { khay: { 'ribeye-with-cap': 1 }, buoc: [] },
];
MAU.forEach((m, i) => {
  const k = kiemDon({
    maGui: `don-mau-${randomBytes(6).toString('hex')}`, khay: m.khay, cachNhan: 'tai-quan', ngay, gio: gio[i],
    ten: `Khách thử ${i + 1}`, dienThoai: `090000000${i + 1}`, ghiChu: m.ghiChu ?? '',
  }, ms);
  if (!k.ok) throw new Error(k.loi.join('; '));
  const r = so.taoDon(k.don, ms);
  if (!r.ok) throw new Error(r.ly_do);
  const ma = r.don.ma;
  if (m.buoc.includes('tra')) so.ghiDaThanhToan(ma, ms);
  if (m.buoc.includes('soan')) so.doiTrangThai(ma, 'da_thanh_toan', 'dang_soan', ms);
  if (m.buoc.includes('xong')) so.doiTrangThai(ma, 'dang_soan', 'cho_lay', ms);
  if (m.buoc.includes('huy')) so.doiTrangThai(ma, 'da_thanh_toan', 'can_hoan_tien', ms);
  console.log(`Đơn #${r.don.soTrongNgay} ${ma}: ${so.layDon(ma)!.trangThai}`);
});
so.dong();
console.log(`Đã ghi ${MAU.length} đơn mẫu vào ${join(thuMuc, 'don.sqlite')}.`);
