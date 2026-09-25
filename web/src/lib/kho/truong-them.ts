/**
 * KHO — Ô THÔNG TIN THÊM DO CHỦ NHÀ HÀNG TỰ TẠO
 *
 * Định nghĩa nằm ở bảng kho_truong_them (0019). File này làm hai việc thuần:
 *   1. đọc giá trị các ô từ form gửi lên, thành một object đúng kiểu;
 *   2. tạo "tên máy" (khoa) từ tên tiếng Việt chủ nhà hàng gõ.
 *
 * Database kiểm lại tất cả (kho_chuan_hoa_truong_them) — ở đây chỉ đọc cho
 * đúng và báo lỗi sớm, bằng câu dễ hiểu.
 *
 * TÊN Ô TRONG FORM: `tt__<khoa>` cho ô của phiếu / mặt hàng, và
 * `tt__<khoa>__<i>` cho ô của dòng thứ i (dòng hàng nhập). Hai dấu gạch dưới
 * để không bao giờ trùng với khoa (khoa chỉ có một dấu gạch liền nhau).
 *
 * Ô CÓ/KHÔNG là một ô CHỌN ba giá trị (—, Có, Không), không phải ô tích:
 * ô tích bỏ trống không phân biệt được "Không" với "chưa trả lời".
 */

import { boDau, docNgay, docSoThapPhan } from './chung.ts';

export type KieuTruong = 'chu' | 'so' | 'ngay' | 'chon' | 'co_khong';

export interface DinhNghiaTruong {
  id: string;
  doi_tuong: string;
  khoa: string;
  nhan: string;
  kieu: KieuTruong;
  lua_chon: string[];
  bat_buoc: boolean;
  goi_y: string | null;
  dang_dung: boolean;
  thu_tu: number;
}

export type GiaTriTruong = Record<string, string | number | boolean>;

export function tenO(khoa: string, dong?: number): string {
  return dong === undefined ? `tt__${khoa}` : `tt__${khoa}__${dong}`;
}

interface FormLike { get(ten: string): unknown }

/**
 * Đọc giá trị các ô ĐANG DÙNG từ form. Ô đã tắt thì giữ nguyên giá trị cũ
 * (truyền vào qua `cu`) — người dùng không sửa được ô đã tắt, nhưng dữ liệu
 * cũ không được mất.
 *
 * Không kiểm "bắt buộc" ở đây: phiếu nháp được phép thiếu. Database kiểm lúc
 * gửi duyệt (phiếu) hoặc lúc lưu (danh mục).
 */
export function docTruongThem(
  form: FormLike,
  dinhNghia: DinhNghiaTruong[],
  dong?: number,
  cu: GiaTriTruong = {},
): { giaTri: GiaTriTruong; loi: string[] } {
  const giaTri: GiaTriTruong = {};
  const loi: string[] = [];

  for (const dn of dinhNghia) {
    if (!dn.dang_dung) {
      if (cu[dn.khoa] !== undefined) giaTri[dn.khoa] = cu[dn.khoa];
      continue;
    }
    const raw = String(form.get(tenO(dn.khoa, dong)) ?? '').trim();
    if (raw === '') continue;

    switch (dn.kieu) {
      case 'chu':
        if (raw.length > 500) loi.push(`Ô "${dn.nhan}" dài quá 500 ký tự`);
        else giaTri[dn.khoa] = raw;
        break;
      case 'so': {
        const n = docSoThapPhan(raw);
        if (n === null || Number.isNaN(n)) loi.push(`Ô "${dn.nhan}" phải là số`);
        else giaTri[dn.khoa] = n;
        break;
      }
      case 'ngay': {
        const d = docNgay(raw);
        if (!d) loi.push(`Ô "${dn.nhan}" phải là một ngày có thật`);
        else giaTri[dn.khoa] = d;
        break;
      }
      case 'chon':
        if (!dn.lua_chon.includes(raw)) loi.push(`Ô "${dn.nhan}" phải chọn trong danh sách`);
        else giaTri[dn.khoa] = raw;
        break;
      case 'co_khong':
        if (raw === 'co') giaTri[dn.khoa] = true;
        else if (raw === 'khong') giaTri[dn.khoa] = false;
        else loi.push(`Ô "${dn.nhan}" phải là Có hoặc Không`);
        break;
    }
  }
  return { giaTri, loi };
}

/** Giá trị để điền lại vào ô nhập (value của input/select). */
export function giaTriVaoO(dn: DinhNghiaTruong, v: unknown): string {
  if (v === undefined || v === null) return '';
  if (dn.kieu === 'co_khong') return v === true ? 'co' : v === false ? 'khong' : '';
  if (dn.kieu === 'so' && typeof v === 'number') return String(v).replace('.', ',');
  return String(v);
}

/** Giá trị để hiển thị chỉ đọc. */
export function hienThiGiaTri(dn: DinhNghiaTruong, v: unknown): string {
  if (v === undefined || v === null || v === '') return '—';
  if (dn.kieu === 'co_khong') return v === true ? 'Có' : 'Không';
  if (dn.kieu === 'ngay' && typeof v === 'string') {
    const [y, m, d] = v.split('-');
    return `${d}/${m}/${y}`;
  }
  if (dn.kieu === 'so' && typeof v === 'number') {
    return v.toLocaleString('vi-VN', { maximumFractionDigits: 6 });
  }
  return String(v);
}

/**
 * Tên máy từ tên tiếng Việt: "Nhiệt độ khi nhận (°C)" → "nhiet_do_khi_nhan_c".
 * Trùng thì thêm _2, _3... Khớp CHECK ^[a-z][a-z0-9_]{0,39}$ ở 0019.
 */
export function taoKhoa(nhan: string, daCo: Iterable<string> = []): string {
  let goc = boDau(nhan).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (!/^[a-z]/.test(goc)) goc = 'o_' + goc;
  goc = goc.slice(0, 36).replace(/_+$/, '') || 'o';
  const tap = new Set(daCo);
  if (!tap.has(goc)) return goc;
  for (let i = 2; i < 1000; i++) {
    const k = `${goc}_${i}`;
    if (!tap.has(k)) return k;
  }
  return `${goc}_${Date.now() % 1000}`;
}

/** Tách danh sách lựa chọn gõ trong một ô, mỗi dòng hoặc mỗi dấu phẩy một lựa chọn. */
export function tachLuaChon(noiDung: string): string[] {
  const ra: string[] = [];
  for (const x of noiDung.split(/[\n,;]+/)) {
    const s = x.trim();
    if (s && !ra.includes(s)) ra.push(s.slice(0, 60));
  }
  return ra.slice(0, 50);
}
