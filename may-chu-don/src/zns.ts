/**
 * ZNS — BÁO KHÁCH QUA ZALO TỪ MÁY CHỦ ĐƠN (đợt 3), phần thuần: cấu hình, dữ liệu mẫu tin, mã hóa token
 * ===================================================================================================
 *
 * Khánh 29/10/2026: báo khách trong app và bằng ZNS. Hai tin, mỗi đơn mỗi loại đúng một lần (SoDon xếp tin cùng giao
 * dịch đổi trạng thái):
 *   · da_nhan   — SePay báo đủ tiền: quán đã nhận đơn và đủ tiền, giao lúc nào, tới đâu.
 *   · dang_giao — quầy bấm "Soạn xong, chờ giao": khay đã soạn xong, quán đang giao.
 *
 * Gửi thẳng từ máy chủ đơn (ở Việt Nam) tới Zalo: số điện thoại khách Mini App không đi qua Cloudflare hay Supabase
 * (mini-app/CLAUDE.md, "Quy tắc của Zalo phải giữ"). Chi tiết API Zalo — địa chỉ, tên trường, mã lỗi, cách đọc câu
 * trả lời — dùng chung web/src/lib/zalo.ts (đã đối chiếu tài liệu Zalo 23/10/2026): Zalo đổi API thì sửa một chỗ.
 *
 * Token: máy chủ đơn giữ chuỗi refresh token RIÊNG trong sổ đơn (bảng zalo_token), mã hóa AES-256-GCM bằng khóa rút
 * từ ZALO_SECRET_KEY — bản chép của sổ đơn không lộ token. Refresh token Zalo dùng một lần: nên dùng một App Zalo riêng
 * cho máy chủ đơn (README, "Cài ZNS"), kẻo hai bên (web và máy chủ đơn) làm mới cùng một chuỗi và làm chết của nhau.
 */
import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto';
import { dinhDangTien } from '../../mini-app/src/don.ts';

export const LOAI_TIN = ['da_nhan', 'dang_giao'] as const;
export type LoaiTin = (typeof LOAI_TIN)[number];

export interface CauHinhZns {
  appId: string;
  /** Secret key của App Zalo: chỉ để làm mới token và rút khóa mã hóa token. Không bao giờ ghi ra nhật ký. */
  secretKey: string;
  /** template_id Zalo đã duyệt cho từng loại tin. */
  mau: Record<LoaiTin, string>;
  /** 'thu': gửi kèm mode "development" — chỉ quản trị viên của OA / App nhận. 'that': gửi khách thật. */
  cheDo: 'thu' | 'that';
}

/**
 * Cấu hình ZNS từ biến môi trường. ZALO_APP_ID, ZALO_SECRET_KEY, ZNS_MAU_DA_NHAN, ZNS_MAU_DANG_GIAO: đủ cả bốn hoặc
 * không biến nào (chưa gửi ZNS). ZALO_CHE_DO: "thu" (mặc định) hoặc "that".
 */
export function docCauHinhZns(env: Record<string, string | undefined>):
  { ok: true; cauHinh: CauHinhZns | null } | { ok: false; loi: string } {
  const g = (k: string) => (env[k] ?? '').trim();
  const bon = { appId: g('ZALO_APP_ID'), secretKey: g('ZALO_SECRET_KEY'), daNhan: g('ZNS_MAU_DA_NHAN'), dangGiao: g('ZNS_MAU_DANG_GIAO') };
  const cheDo = (g('ZALO_CHE_DO') || 'thu') as CauHinhZns['cheDo'];
  if (Object.values(bon).every(v => v === '')) return { ok: true, cauHinh: null };
  const loi: string[] = [];
  if (!/^\d{5,25}$/.test(bon.appId)) loi.push('ZALO_APP_ID (dãy số)');
  if (bon.secretKey.length < 10) loi.push('ZALO_SECRET_KEY');
  if (!/^\d{1,20}$/.test(bon.daNhan)) loi.push('ZNS_MAU_DA_NHAN (mã mẫu, dãy số)');
  if (!/^\d{1,20}$/.test(bon.dangGiao)) loi.push('ZNS_MAU_DANG_GIAO (mã mẫu, dãy số)');
  if (cheDo !== 'thu' && cheDo !== 'that') loi.push('ZALO_CHE_DO ("thu" hoặc "that")');
  if (loi.length) return { ok: false, loi: `ZNS chưa đủ hoặc sai: ${loi.join(', ')}. Đặt đủ cả bốn biến, hoặc bỏ cả bốn.` };
  return {
    ok: true,
    cauHinh: { appId: bon.appId, secretKey: bon.secretKey, mau: { da_nhan: bon.daNhan, dang_giao: bon.dangGiao }, cheDo },
  };
}

/** Phần của đơn mà tin cần — không gì hơn (không ghi chú, không dòng thịt). */
export interface DonChoTin {
  ma: string;
  soTrongNgay: number;
  ten: string;
  tongTien: number;
  /** yyyy-mm-dd */
  ngayNhan: string;
  /** HH:mm */
  gioNhan: string;
  diaChi: string;
}

/**
 * Giới hạn độ dài tham số của mẫu ZBS (tên khách 30, địa chỉ 200 ký tự — giả định theo loại tham số khi tạo mẫu,
 * README "Cài ZNS"). Cắt ở ranh giới ký tự, không để Zalo từ chối cả tin vì một tham số dài.
 */
const cat = (s: string, toiDa: number) => (Array.from(s).length <= toiDa ? s : Array.from(s).slice(0, toiDa - 1).join('') + '…');

/** "13/11/2026" từ "2026-11-13". */
const ngayVietNam = (ngay: string) => {
  const [n, t, d] = ngay.split('-');
  return `${d}/${t}/${n}`;
};

/**
 * template_data của từng loại tin. Tên tham số phải trùng đúng tên khai khi tạo mẫu trên Zalo (README, "Cài ZNS").
 * thoi_gian_giao: "10:30 13/11/2026".
 */
export function duLieuTin(loai: LoaiTin, d: DonChoTin): Record<string, string> {
  const chung = {
    ten_khach: cat(d.ten, 30),
    so_don: String(d.soTrongNgay),
    ma_don: d.ma,
    thoi_gian_giao: `${d.gioNhan} ${ngayVietNam(d.ngayNhan)}`,
  };
  if (loai === 'dang_giao') return chung;
  return { ...chung, tong_tien: dinhDangTien(d.tongTien), dia_chi: cat(d.diaChi, 200) };
}

/** tracking_id gửi kèm tin (Zalo trả lại trong báo cáo): mã đơn + loại, dưới 48 ký tự như Zalo khuyên. */
export const maTheoDoi = (ma: string, loai: LoaiTin) => `${ma}-${loai}`;

// ---------- Mã hóa token trong sổ đơn ----------

const khoaToken = (secretKey: string) =>
  Buffer.from(hkdfSync('sha256', secretKey, 'beeftown-may-chu-don', 'zalo-token-v1', 32));

/** "v1." + base64(iv 12 byte · thẻ 16 byte · bản mã). */
export function maHoaToken(tho: string, secretKey: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', khoaToken(secretKey), iv);
  const ma = Buffer.concat([c.update(tho, 'utf8'), c.final()]);
  return 'v1.' + Buffer.concat([iv, c.getAuthTag(), ma]).toString('base64');
}

/** Giải mã; sai khóa (ZALO_SECRET_KEY đã đổi), hỏng dữ liệu → null. Không bao giờ ném lỗi. */
export function giaiMaToken(ma: string | null | undefined, secretKey: string): string | null {
  try {
    if (!ma || !ma.startsWith('v1.')) return null;
    const b = Buffer.from(ma.slice(3), 'base64');
    if (b.length < 29) return null;
    const g = createDecipheriv('aes-256-gcm', khoaToken(secretKey), b.subarray(0, 12));
    g.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([g.update(b.subarray(28)), g.final()]).toString('utf8');
  } catch {
    return null;
  }
}

/** Dấu của refresh token dán vào ZALO_REFRESH_TOKEN_MOI — để chỉ gieo mỗi token một lần (token dùng một lần). */
export const dauToken = (tho: string) => createHash('sha256').update(tho).digest('hex');
