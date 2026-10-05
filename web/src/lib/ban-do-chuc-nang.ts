/**
 * NỘI BỘ — BẢN ĐỒ CHỨC NĂNG VÀ Ô TÌM
 *
 * Ghép menu phần nhà hàng (dieu-huong-noi-bo.ts) với menu kho (kho/dieu-huong.ts)
 * thành danh sách theo nhóm, cho hai trang:
 *
 *   · /noi-bo/chuc-nang (khung NoiBo, nút "Thêm"): nhóm nhà hàng trước, rồi từng
 *     nhóm kho với tiền tố "Kho · ".
 *   · /noi-bo/kho/khac (khung Kho, nút "Khác"): nhóm kho trước, rồi một nhóm
 *     "Phần khác của nhà hàng". Máy tính bảng dùng chung không có nhóm đó — như menu
 *     người dùng của layouts/Kho.astro.
 *
 * Ô TÌM chạy trên máy chủ (GET ?tim=), không JavaScript — trang kho phải chạy đủ khi
 * tắt JS (test-kho-giao-dien mục 8). Tìm trong tên hai thứ tiếng và từ khóa của mục,
 * cộng thao tác nhanh của vai. Mỗi chữ gõ vào khớp ĐẦU một từ, và một mục chỉ ra khi:
 *   · mọi chữ nằm trong TÊN mục (thứ tự nào cũng được), hoặc
 *   · các chữ đứng LIỀN NHAU, đúng thứ tự, trong tên hay từ khóa — như gõ một cụm:
 *     "tra tien" ra Công nợ (từ khóa "trả tiền").
 * Lỏng hơn thế thì "cong no" ra cả "Nội dung website" (từ khóa "công bố", tên "nội").
 *
 * Dấu tiếng Việt, theo TỪNG CHỮ gõ vào:
 *   · chữ không dấu so không dấu — "cong no" ra "Công nợ", thủ kho gõ điện thoại
 *     không bật bộ gõ vẫn tìm được;
 *   · chữ có dấu so đúng dấu — "hủy" ra "Hủy" nhưng "hùy" thì không; "dừng" không
 *     khớp "Đúng" (CLAUDE.md mục 4). Bỏ dấu cả chữ có dấu thì người gõ đúng dấu bị
 *     trả về đủ thứ không liên quan.
 * Chữ dán từ macOS / Excel là NFD (dấu là ký tự riêng) — đưa về NFC trước khi so.
 *
 * File thuần — test nạp thẳng bằng Node.
 */

import type { HaiThuTieng } from './ngon-ngu-noi-bo.ts';
import type { TenBieuTuong } from './kho/bieu-tuong.ts';
import { MUC_NOI_BO, NHOM_NOI_BO, mucNoiBoCuaVai } from './dieu-huong-noi-bo.ts';
import { nhomCuaVai, thaoTacCuaVai, TU_KHOA_KHO, MUC_CRM } from './kho/dieu-huong.ts';
import { boDau } from './kho/chung.ts';

export interface ChucNang {
  ten: HaiThuTieng;
  link: string;
  bieuTuong: TenBieuTuong;
  /** Khóa kho_dem_viec cộng thành số đỏ (chỉ mục kho có). */
  dem?: string[];
  tuKhoa?: HaiThuTieng;
}

export interface NhomChucNang {
  ma: string;
  ten: HaiThuTieng;
  muc: ChucNang[];
}

export interface KetQuaTim {
  muc: ChucNang;
  /** Tên nhóm chứa mục — in dưới tên để người dùng biết lần sau tìm ở đâu. */
  nhom: HaiThuTieng;
}

/** Chữ tìm dài nhất được nhận. Không ai gõ tên chức năng dài hơn thế. */
export const GIOI_HAN_TIM = 60;

const NHOM_NHANH: HaiThuTieng = { vi: 'Thao tác nhanh', en: 'Quick actions' };
const NHOM_PHAN_KHAC: HaiThuTieng = { vi: 'Phần khác của nhà hàng', en: 'Other restaurant areas' };
const TIEN_TO_KHO: HaiThuTieng = { vi: 'Kho · ', en: 'Inventory · ' };

function nhomKho(vai: string, tienTo: boolean): NhomChucNang[] {
  return nhomCuaVai(vai).map(n => ({
    ma: `kho_${n.ma}`,
    ten: tienTo ? { vi: TIEN_TO_KHO.vi + n.ten.vi, en: TIEN_TO_KHO.en + n.ten.en } : n.ten,
    muc: n.muc.map(m => ({ ten: m.ten, link: m.link, bieuTuong: m.bieuTuong, dem: m.dem, tuKhoa: TU_KHOA_KHO[m.ma] })),
  }));
}

function nhomNhaHang(vai: string): NhomChucNang[] {
  const ds = mucNoiBoCuaVai(vai);
  return NHOM_NOI_BO
    .map(n => ({
      ma: `nb_${n.ma}`, ten: n.ten,
      muc: ds.filter(m => m.nhom === n.ma).map(m => ({ ten: m.ten, link: m.link, bieuTuong: m.bieuTuong, tuKhoa: m.tuKhoa })),
    }))
    .filter(n => n.muc.length > 0);
}

/** Phần nhà hàng gộp một nhóm, cho trang Khác của kho — đúng các mục của menu người dùng bên kho. */
function nhomPhanKhac(vai: string): NhomChucNang[] {
  const tuKhoa = new Map(MUC_NOI_BO.map(m => [m.link, m.tuKhoa]));
  const muc = MUC_CRM.filter(m => m.vai.includes(vai))
    .map(m => ({ ten: m.ten, link: m.link, bieuTuong: m.bieuTuong, tuKhoa: tuKhoa.get(m.link) }));
  return muc.length > 0 ? [{ ma: 'nb_phan_khac', ten: NHOM_PHAN_KHAC, muc }] : [];
}

/**
 * Các nhóm chức năng của một vai, đúng thứ tự in.
 * `trang`: 'kho' = trang Khác của kho; 'nha_hang' = trang Tất cả chức năng.
 * `cheDoMay`: máy tính bảng dùng chung (có người mở khóa bằng PIN) — không có phần nhà hàng.
 */
export function banDoChucNang(
  vai: string, trang: 'kho' | 'nha_hang', tuyChon: { cheDoMay?: boolean } = {},
): NhomChucNang[] {
  if (trang === 'kho') {
    const kho = nhomKho(vai, false).map(n => n.ma === 'kho_hang_ngay'
      ? { ...n, muc: n.muc.filter(m => m.link !== '/noi-bo/kho') }   // đang ở kho: bỏ ô Trang chủ, như trang Khác cũ
      : n).filter(n => n.muc.length > 0);
    return tuyChon.cheDoMay ? kho : [...kho, ...nhomPhanKhac(vai)];
  }
  return [...nhomNhaHang(vai), ...nhomKho(vai, true)];
}

/** Thao tác nhanh của vai (nút tạo phiếu mới…), dạng ChucNang để in và để tìm. */
export function thaoTacNhanhChucNang(vai: string): ChucNang[] {
  return thaoTacCuaVai(vai).map(t => ({ ten: t.ten, link: t.link, bieuTuong: t.bieuTuong }));
}

/** Chữ tìm từ ô nhập: chuỗi, NFC, gộp khoảng trắng, tối đa GIOI_HAN_TIM ký tự. Thứ khác → ''. */
export function lamSachTimChucNang(v: unknown): string {
  if (typeof v !== 'string') return '';
  return [...v.normalize('NFC').replace(/\s+/g, ' ').trim()].slice(0, GIOI_HAN_TIM).join('').trim();
}

function chuanHoa(s: string): string {
  return s.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Tách thành từ: khoảng trắng và dấu câu ("·", ",", ngoặc) là ranh giới; "write-off" là một từ. */
function tachTu(s: string): string[] {
  return s.split(/[\s·,;:()\/]+/).filter(Boolean);
}

/** Chữ gõ `go` có là đầu từ `tu` không: không dấu so không dấu, có dấu so đúng dấu. */
function dauTu(go: string, tu: string): boolean {
  return (boDau(go) === go ? boDau(tu) : tu).startsWith(go);
}

/** Các chữ gõ đứng liền nhau, đúng thứ tự, ở đâu đó trong dãy từ. */
function khopCum(tuGo: string[], day: string[]): boolean {
  for (let i = 0; i + tuGo.length <= day.length; i++) {
    if (tuGo.every((g, j) => dauTu(g, day[i + j]))) return true;
  }
  return false;
}

/**
 * Tìm chức năng. Mục khớp ở TÊN đứng trước mục chỉ khớp ở từ khóa; còn lại giữ thứ
 * tự in. Mỗi đường dẫn, mỗi tên chỉ ra một lần: thao tác nhanh trùng đường dẫn hoặc
 * trùng tên một mục ("Đặt hàng" → /dat-hang/moi bên cạnh mục Đặt hàng) thì giữ mục —
 * hai dòng cùng chữ trên màn kết quả chỉ làm người ta phân vân bấm dòng nào.
 */
export function timChucNang(nhom: NhomChucNang[], nhanh: ChucNang[], chuTim: string): KetQuaTim[] {
  const q = chuanHoa(lamSachTimChucNang(chuTim));
  if (!q) return [];
  const tuGo = tachTu(q);
  if (tuGo.length === 0) return [];
  const daCo = new Set<string>();
  const ra: (KetQuaTim & { diem: number })[] = [];
  const xet = (muc: ChucNang, tenNhom: HaiThuTieng) => {
    const tenVi = chuanHoa(muc.ten.vi);
    if (daCo.has(muc.link) || daCo.has(tenVi)) return;
    const day = [muc.ten.vi, muc.ten.en, muc.tuKhoa?.vi ?? '', muc.tuKhoa?.en ?? ''].map(x => tachTu(chuanHoa(x)));
    const tuTen = [...day[0], ...day[1]];
    const trongTen = tuGo.every(g => tuTen.some(t => dauTu(g, t)));
    if (!trongTen && !day.some(d => khopCum(tuGo, d))) return;
    daCo.add(muc.link).add(tenVi);
    ra.push({ muc, nhom: tenNhom, diem: trongTen ? 0 : 1 });
  };
  for (const n of nhom) for (const m of n.muc) xet(m, n.ten);
  for (const m of nhanh) xet(m, NHOM_NHANH);
  return ra.sort((a, b) => a.diem - b.diem).map(({ muc, nhom }) => ({ muc, nhom }));
}
