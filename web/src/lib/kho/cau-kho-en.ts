/**
 * CÂU THÔNG BÁO CỦA KHO Ở TIẾNG ANH
 * ================================
 *
 * Hàm kho trong database báo lỗi bằng tiếng Việt (`raise exception '…'`), đi
 * lên trang qua error.message — không có cách nào khác ngoài tra bảng. dichCau()
 * (lib/cau-noi-bo.ts) tra ở đây sau bảng của phần CRM:
 *
 *   · CAU_KHO_EN — câu cố định, đúng từng chữ (kể cả dấu chấm cuối);
 *   · MAU_KHO_EN — câu có `%`: viết NGUYÊN câu raise như trong migration
 *     (`%` là chỗ Postgres thay giá trị, `%%` là dấu phần trăm), bản tiếng Anh
 *     đặt {1}, {2}… vào chỗ giá trị thứ 1, thứ 2… của câu tiếng Việt.
 *
 * Câu chưa có ở đây thì màn tiếng Anh hiện nguyên tiếng Việt — người đọc vẫn
 * thấy có lỗi và chụp gửi quản lý được. test-kho-tieng-anh.mjs đòi mọi câu
 * raise của migration kho đều dịch được.
 */

import { LOI_KHO_CHUNG } from './chung.ts';

/** Câu cố định: đúng từng chữ. */
export const CAU_KHO_EN: Readonly<Record<string, string>> = {
  // cauLoiKho() — lỗi kỹ thuật đã đổi thành câu dễ hiểu
  ...Object.fromEntries(Object.values(LOI_KHO_CHUNG).map(c => [c.vi, c.en])),
};

/** [câu raise tiếng Việt, có %] → [bản tiếng Anh, có {1}, {2}…]. */
const MAU_THO: ReadonlyArray<readonly [string, string]> = [
];

type Mau = readonly [RegExp, (m: RegExpMatchArray) => string];

/** Câu raise có % → biểu thức nhận câu đã thay giá trị, và hàm dựng câu tiếng Anh. */
export function dungMauKho(vi: string, en: string): Mau {
  const phan = vi.split('%%').map(p => p.split('%').map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const nguon = phan.map(p => p.join('([\\s\\S]*?)')).join('%');
  const mau = new RegExp(`^${nguon}$`);
  return [mau, m => en.replace(/\{(\d+)\}/g, (_, i: string) => m[Number(i)] ?? '')];
}

export const MAU_KHO_EN: ReadonlyArray<Mau> = MAU_THO.map(([vi, en]) => dungMauKho(vi, en));
