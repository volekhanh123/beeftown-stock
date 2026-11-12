/**
 * SỔ ĐƠN — SQLite trên chính máy chủ (bun:sqlite)
 * ===============================================
 *
 * Dữ liệu khách của Mini App phải xử lý và lưu ở Việt Nam (thỏa thuận nhà phát triển Zalo Mini App, Điều 5.3.3b
 * và 7.5 — mini-app/CLAUDE.md, "Quy tắc của Zalo phải giữ"). Vì vậy sổ đơn là một file SQLite nằm trên laptop
 * thử hay máy chủ thuê ở Việt Nam, KHÔNG phải Supabase (Singapore). Sang kho chỉ đi số khay, không tên, không số.
 *
 * Chống ghi hai lần (CLAUDE.md gốc, mục bam-hai-lan):
 *   · tạo đơn: mỗi lần bấm gửi của Mini App mang một maGui; cùng maGui thì trả lại đúng đơn cũ. Cùng maGui mà khác
 *     nội dung (dauNoiDung) thì từ chối — không ghi đè đơn khách đã thấy.
 *   · đổi trạng thái: câu update chỉ chạy khi trạng thái đang đúng là `tu`. Hai máy tính bảng cùng bấm, hay một
 *     người bấm đúp: lần sau thấy đơn đã ở bước mới, không đi hai bước.
 * Mỗi lần ghi là một giao dịch BEGIN IMMEDIATE — SQLite xếp hàng các lần ghi, số thứ tự trong ngày không trùng.
 *
 * Tin ZNS (đợt 3, zns.ts, gui-zns.ts): bảng zns_tin, mỗi đơn mỗi loại tin đúng một dòng (khóa chính). Tin xếp cùng
 * giao dịch với bước làm ra nó — tiền về đủ (ghiTienVe) xếp "da_nhan", quầy bấm "Soạn xong, chờ giao" xếp "dang_giao"
 * — nên không có bước nào thiếu tin hay có tin mà không có bước. Đơn mẫu, đơn đánh dấu đã trả bằng tay
 * (ghiDaThanhToan) không có tin nào: chỉ tiền thật qua SePay mới báo khách.
 *
 * VNPay qua Checkout SDK của Zalo (Khánh 11/11/2026, checkout-zalo.ts): bảng thanh_toan_zalo, mỗi orderId của Zalo
 * đúng một dòng (khóa chính) — Zalo gửi lại, hai máy chủ Zalo cùng gọi: lần sau thấy đã có. Ghi tiền và đổi đơn sang
 * "đã trả tiền" trong cùng một giao dịch, như ghiTienVe. Tiền đã nhận của một đơn là tổng của cả hai bảng.
 * Bảng mo_thanh_toan_zalo: Mini App báo orderId ngay khi mở trang VNPay — đơn đã mở trang mà quá 20 phút chưa có kết
 * quả hiện ở số liệu sức khỏe (callback có thể đã lạc: Zalo không gửi lại).
 *
 * Xe Ahamove (Khánh 12/11/2026, ahamove.ts, goi-xe.ts): bảng chuyen_xe, mỗi đơn mỗi lần gọi xe một dòng (khóa chính
 * mã đơn + lần). Chuyến xếp cùng giao dịch với bước "Soạn xong, chờ giao" (bấm đúp: một chuyến); quầy hủy đơn thì
 * chuyến đang chạy chuyển sang việc "huy" trong cùng giao dịch. Trước khi gửi Tạo đơn, chuyến đã mang việc "kiem_lai":
 * máy chủ tắt hay mất mạng giữa chừng thì lượt sau tra Ahamove theo mã theo dõi, không gửi lại mù (không ra hai xe).
 */
import { Database } from 'bun:sqlite';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { congNgay, gioVnTuMs, homNayVn } from '../../web/src/lib/gio-vn.ts';
import type { TinTienVe } from './sepay.ts';
import { laThuNghiem, type TinCheckout } from './checkout-zalo.ts';
import type { LoaiTin } from './zns.ts';
import type { DonMoi, DongMoi } from './tao-don.ts';
import { CON_VIEC, duocBam, laTrangThai, type TrangThai } from './trang-thai.ts';
import {
  MS_CHO_KIEM_LAI, MS_HOI_LAI, MS_THOI_HOI, SO_LAN_HUY_TOI_DA, SO_LAN_TAO_TOI_DA, buocXe, daKhepHan, docMaTheoDoiXe, laTrangThaiCuoi,
  type ChuyenXe, type LoiAhamove, type TinChuyen, type ViecXe,
} from './ahamove.ts';

/** Đơn chưa trả tiền quá chừng này thì hết hạn (khách mở lại app phải đặt lại). */
export const PHUT_CHO_THANH_TOAN = 30;

export interface DonDayDu {
  ma: string;
  khoaXem: string;
  soTrongNgay: number;
  /** Ngày tạo đơn theo giờ Việt Nam, yyyy-mm-dd */
  ngayTao: string;
  trangThai: TrangThai;
  /** Từ 09/11/2026 đơn mới luôn 'giao-hang'. 'tai-quan': đơn ghi trước đó trên sổ thử (laptop), địa chỉ trống. */
  cachNhan: 'tai-quan' | 'giao-hang';
  /** Địa chỉ giao (đơn 'giao-hang'); '' với đơn 'tai-quan' cũ. Dữ liệu khách: chỉ quầy thấy, API của khách không trả. */
  diaChi: string;
  ngayNhan: string;
  gioNhan: string;
  ten: string;
  dienThoai: string;
  ghiChu: string;
  tongTien: number;
  giaThu: boolean;
  taoLuc: number;
  capNhatLuc: number;
  dong: DongMoi[];
}

export type KetQuaTao =
  | { ok: true; moi: boolean; don: DonDayDu }
  | { ok: false; ly_do: 'trung_ma_gui' };

/** da_doi: vừa đổi · da_o_buoc_moi: đơn đã ở `den` (bấm đúp) · lech: đơn đang ở bước khác · khong_co · khong_duoc */
export type KetQuaDoi = 'da_doi' | 'da_o_buoc_moi' | 'lech' | 'khong_co' | 'khong_duoc';

/**
 * Một lần tiền về đối với đơn: du (đủ, đơn sang "đã trả tiền") · thieu (chưa đủ, đơn vẫn chờ) · thua (đủ mà dư, hay đơn đã
 * trả từ trước — phải hoàn phần dư) · khong_khop (có dạng mã "BT…" mà không ra đơn nào — gõ sai một ký tự cũng vào đây)
 * · khong_ma (nội dung không có dạng mã — tiền khác của công ty, không đụng) · sai_tai_khoan (vào tài khoản khác; mang mã
 * của quán thì phải xem) · tien_ra (tiền đi, không đụng).
 */
export type KetQuaTienVe = 'du' | 'thieu' | 'thua' | 'khong_khop' | 'khong_ma' | 'sai_tai_khoan' | 'tien_ra';

/**
 * Một kết quả VNPay (qua Checkout SDK) đối với đơn: du · thieu · thua như tiền SePay (thua: đơn đã trả từ trước — khách
 * trả hai lần — phải hoàn) · khong_khop (extradata không ra đơn nào) · that_bai (Zalo báo không trừ được tiền: chỉ ghi
 * lại) · sai_phuong_thuc (tiền sandbox khi máy chủ nhận tiền thật, hay ngược lại: không tính cho đơn).
 */
export type KetQuaThanhToanZalo = 'du' | 'thieu' | 'thua' | 'khong_khop' | 'that_bai' | 'sai_phuong_thuc';

/** Đơn đã mở trang VNPay mà quá chừng này chưa có kết quả: số liệu sức khỏe báo (tài liệu callback: 20 phút). */
export const PHUT_CHO_KET_QUA_ZALO = 20;
/** Mỗi đơn giữ tối đa chừng này lần mở trang VNPay (Mini App báo; khách bấm lại nhiều lần thì thôi ghi). */
export const SO_LAN_MO_ZALO_TOI_DA = 5;

export interface TienVeCanXem {
  /** 'sepay': chuyển khoản (idSepay). 'vnpay': VNPay qua Checkout SDK (maZalo). */
  nguon: 'sepay' | 'vnpay';
  /** id SePay; 0 với tiền VNPay. */
  idSepay: number;
  /** orderId của Checkout SDK; null với tiền SePay. */
  maZalo: string | null;
  maDon: string | null;
  soTrongNgay: number | null;
  soTien: number;
  /** Tổng tiền đơn (khi khớp đơn) — để quầy thấy thiếu / dư bao nhiêu. */
  tongTienDon: number | null;
  tongDaNhan: number | null;
  ngayGiaoDich: string;
  maThamChieu: string;
  ketQua: KetQuaTienVe | KetQuaThanhToanZalo;
}

/** Trạng thái đơn đã có tiền (tiền về thêm thì là tiền dư). */
const DA_CO_TIEN: readonly TrangThai[] = ['da_thanh_toan', 'dang_soan', 'cho_lay', 'da_giao', 'can_hoan_tien', 'da_hoan_tien'];

// Mã đơn: 8 ký tự, bỏ chữ dễ nhầm khi đọc qua điện thoại (0/O, 1/I/L, 2/Z, 5/S, 8/B).
const CHU_MA = 'ACDEFGHJKMNPQRTUVWXY34679';
function taoMa(): string {
  const b = randomBytes(8);
  let ma = '';
  for (let i = 0; i < 8; i++) ma += CHU_MA[b[i] % CHU_MA.length];
  return ma;
}

const LUOC_DO = `
create table if not exists don (
  ma text primary key,
  khoa_xem text not null,
  ma_gui text not null unique,
  dau_noi_dung text not null,
  so_trong_ngay integer not null,
  ngay_tao text not null,
  trang_thai text not null,
  cach_nhan text not null,
  dia_chi text not null default '',
  ngay_nhan text not null,
  gio_nhan text not null,
  ten text not null,
  dien_thoai text not null,
  ghi_chu text not null,
  tong_tien integer not null check (tong_tien >= 0),
  gia_thu integer not null,
  tao_luc integer not null,
  cap_nhat_luc integer not null,
  unique (ngay_tao, so_trong_ngay)
);
create index if not exists don_trang_thai on don (trang_thai, ngay_nhan, gio_nhan);
create table if not exists don_dong (
  ma_don text not null references don (ma),
  thu_tu integer not null,
  ma_phan text not null,
  ten text not null,
  bao_quan text not null,
  so_gam_khay integer not null,
  so_khay integer not null check (so_khay > 0),
  gia_moi_khay integer not null check (gia_moi_khay >= 0),
  primary key (ma_don, thu_tu)
);
create table if not exists nhat_ky (
  id integer primary key autoincrement,
  ma_don text not null references don (ma),
  tu text,
  den text not null,
  ai text not null,
  luc integer not null
);
create index if not exists nhat_ky_don on nhat_ky (ma_don, id);
create table if not exists giao_dich (
  id_sepay integer primary key,
  ma_don text references don (ma),
  so_tien integer not null check (so_tien > 0),
  ngay_giao_dich text not null,
  ma_tham_chieu text not null,
  ket_qua text not null,
  can_xem integer not null,
  nhan_luc integer not null,
  xem_xong_luc integer
);
create index if not exists giao_dich_don on giao_dich (ma_don);
create index if not exists giao_dich_can_xem on giao_dich (can_xem, xem_xong_luc);
create table if not exists thanh_toan_zalo (
  ma_zalo text primary key,
  ma_don text references don (ma),
  ma_giao_dich text not null,
  phuong_thuc text not null,
  so_tien integer not null check (so_tien >= 0),
  ngay_giao_dich text not null,
  ket_qua text not null,
  can_xem integer not null,
  nhan_luc integer not null,
  xem_xong_luc integer
);
create index if not exists thanh_toan_zalo_don on thanh_toan_zalo (ma_don);
create index if not exists thanh_toan_zalo_can_xem on thanh_toan_zalo (can_xem, xem_xong_luc);
create table if not exists mo_thanh_toan_zalo (
  ma_zalo text primary key,
  ma_don text not null references don (ma),
  luc integer not null
);
create index if not exists mo_thanh_toan_zalo_don on mo_thanh_toan_zalo (ma_don);
create table if not exists zns_tin (
  ma_don text not null references don (ma),
  loai text not null check (loai in ('da_nhan', 'dang_giao')),
  trang_thai text not null check (trang_thai in ('cho', 'dang_gui', 'da_gui', 'that_bai', 'bo_qua', 'khong_ro')),
  so_lan integer not null default 0,
  gui_sau integer not null,
  tao_luc integer not null,
  cap_nhat_luc integer not null,
  msg_id text,
  loi text,
  primary key (ma_don, loai)
);
create index if not exists zns_tin_cho on zns_tin (trang_thai, gui_sau);
create table if not exists zalo_token (
  id integer primary key check (id = 1),
  refresh_ma text,
  access_ma text,
  het_han_luc integer,
  dau_gieo text,
  trang_thai text not null,
  loi text,
  cap_nhat_luc integer not null
);
create table if not exists chuyen_xe (
  ma_don text not null references don (ma),
  lan integer not null check (lan between 1 and 20),
  viec text check (viec in ('tao', 'kiem_lai', 'huy')),
  viec_sau integer not null,
  so_lan integer not null default 0,
  ma_aha text,
  trang_thai_aha text,
  trang_thai_phu text,
  diem_giao text,
  ly_do text,
  tai_xe_ten text,
  tai_xe_sdt text,
  link text,
  phi integer,
  ma_loi text,
  loi text,
  huy_yeu_cau integer not null default 0,
  loi_huy text,
  tu_goi_luc integer,
  tao_luc integer not null,
  cap_nhat_luc integer not null,
  aha_luc integer,
  hoi_luc integer,
  primary key (ma_don, lan)
);
create index if not exists chuyen_xe_viec on chuyen_xe (viec, viec_sau);
create unique index if not exists chuyen_xe_ma_aha on chuyen_xe (ma_aha) where ma_aha is not null;
`;

/**
 * Một tin ZNS trong hàng chờ. cho → dang_gui (đang gọi Zalo) → da_gui · that_bai (lỗi không thử lại, hay quá
 * SO_LAN_ZNS_TOI_DA lần) · bo_qua (quá cũ, đơn đã sang bước khác) · khong_ro (máy chủ tắt giữa lúc gọi Zalo — không
 * gửi lại, kẻo khách nhận hai lần).
 */
export type TrangThaiZns = 'cho' | 'dang_gui' | 'da_gui' | 'that_bai' | 'bo_qua' | 'khong_ro';
export interface TinZns { maDon: string; loai: LoaiTin; soLan: number }
export const SO_LAN_ZNS_TOI_DA = 6;
/** Tin quá cũ không gửi nữa: "đã nhận đơn" sau 24 giờ, "đang giao" sau 6 giờ. */
export const GIU_TIN_ZNS_MS: Readonly<Record<LoaiTin, number>> = { da_nhan: 24 * 3600_000, dang_giao: 6 * 3600_000 };

/** Token Zalo của máy chủ đơn, đã mã hóa (zns.ts, maHoaToken). trangThai: 'tot' · 'bi_tu_choi' · 'khong_giai_ma'. */
export interface TokenZalo {
  refreshMa: string | null;
  accessMa: string | null;
  hetHanLuc: number | null;
  trangThai: string;
  loi: string | null;
}

type DongDb = Record<string, string | number>;

export class SoDon {
  readonly db: Database;
  /**
   * Gọi xe Ahamove (main.ts bật khi có cấu hình Ahamove). null: "Soạn xong, chờ giao" không xếp chuyến nào.
   * chiTienThat (Ahamove thật): chỉ đơn có tiền thật đủ tổng đơn mới gọi xe — đơn mẫu, tiền giả lập demo, tiền thử VNPay
   * sandbox không bao giờ gọi tài xế thật.
   */
  goiXe: { chiTienThat: boolean } | null = null;

  /** `duongDan` ":memory:" cho kiểm thử. File thật: WAL, khóa ngoại bật. */
  constructor(duongDan: string) {
    this.db = new Database(duongDan, { create: true, strict: true });
    this.db.exec('pragma journal_mode = wal; pragma foreign_keys = on; pragma busy_timeout = 5000;');
    this.db.exec(LUOC_DO);
    // Sổ tạo trước 09/11/2026 (laptop thử) chưa có cột dia_chi: thêm, đơn cũ để trống.
    const cot = this.db.query("select name from pragma_table_info('don')").all() as { name: string }[];
    if (!cot.some(c => c.name === 'dia_chi')) this.db.exec("alter table don add column dia_chi text not null default ''");
  }

  dong(): void { this.db.close(); }

  /** `dongSan`: dòng đơn đã đọc sẵn (danh sách nhiều đơn đọc một câu cho mọi đơn). */
  private docDon(h: DongDb | null, dongSan?: DongDb[]): DonDayDu | null {
    if (!h) return null;
    const dong = dongSan ?? this.db.query('select * from don_dong where ma_don = ? order by thu_tu').all(h.ma as string) as DongDb[];
    const trangThai = String(h.trang_thai);
    if (!laTrangThai(trangThai)) throw new Error(`Đơn ${h.ma} có trạng thái lạ: ${trangThai}`);
    return {
      ma: String(h.ma), khoaXem: String(h.khoa_xem), soTrongNgay: Number(h.so_trong_ngay), ngayTao: String(h.ngay_tao),
      trangThai, cachNhan: h.cach_nhan === 'giao-hang' ? 'giao-hang' : 'tai-quan', diaChi: String(h.dia_chi ?? ''),
      ngayNhan: String(h.ngay_nhan), gioNhan: String(h.gio_nhan),
      ten: String(h.ten), dienThoai: String(h.dien_thoai), ghiChu: String(h.ghi_chu), tongTien: Number(h.tong_tien),
      giaThu: Number(h.gia_thu) === 1, taoLuc: Number(h.tao_luc), capNhatLuc: Number(h.cap_nhat_luc),
      dong: dong.map(d => ({
        maPhan: String(d.ma_phan), ten: String(d.ten), baoQuan: d.bao_quan === 'dong-lanh' ? 'dong-lanh' : 'mat',
        soGamKhay: Number(d.so_gam_khay), soKhay: Number(d.so_khay), giaMoiKhay: Number(d.gia_moi_khay),
      })),
    };
  }

  layDon(ma: string): DonDayDu | null {
    return this.docDon(this.db.query('select * from don where ma = ?').get(ma) as DongDb | null);
  }

  /** Đơn đã ghi theo maGui, kèm dấu nội dung lúc ghi — để trả lại đơn cũ trước khi kiểm lại giờ, giá. */
  layTheoMaGui(maGui: string): { don: DonDayDu; dauNoiDung: string } | null {
    const h = this.db.query('select * from don where ma_gui = ?').get(maGui) as DongDb | null;
    return h ? { don: this.docDon(h)!, dauNoiDung: String(h.dau_noi_dung) } : null;
  }

  /** Khách xem đơn của mình: phải đúng cả mã đơn lẫn khóa xem. Sai khóa thì như không có đơn. */
  layTheoKhoa(ma: string, khoa: string): DonDayDu | null {
    const don = this.layDon(ma);
    if (!don) return null;
    const a = Buffer.from(don.khoaXem), b = Buffer.from(String(khoa));
    return a.length === b.length && timingSafeEqual(a, b) ? don : null;
  }

  /** Ghi đơn đã qua kiemDon. Cùng maGui → trả đơn cũ (moi: false); cùng maGui khác nội dung → từ chối. */
  taoDon(don: DonMoi, ms: number): KetQuaTao {
    return this.db.transaction((): KetQuaTao => {
      const cu = this.db.query('select * from don where ma_gui = ?').get(don.maGui) as DongDb | null;
      if (cu) {
        if (cu.dau_noi_dung !== don.dauNoiDung) return { ok: false, ly_do: 'trung_ma_gui' };
        return { ok: true, moi: false, don: this.docDon(cu)! };
      }
      const ngayTao = homNayVn(ms);
      const { so } = this.db.query('select coalesce(max(so_trong_ngay), 0) + 1 as so from don where ngay_tao = ?')
        .get(ngayTao) as { so: number };
      let ma = taoMa();
      while (this.db.query('select 1 from don where ma = ?').get(ma)) ma = taoMa();
      this.db.query(`insert into don (ma, khoa_xem, ma_gui, dau_noi_dung, so_trong_ngay, ngay_tao, trang_thai, cach_nhan,
          dia_chi, ngay_nhan, gio_nhan, ten, dien_thoai, ghi_chu, tong_tien, gia_thu, tao_luc, cap_nhat_luc)
        values (?, ?, ?, ?, ?, ?, 'cho_thanh_toan', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(ma, randomBytes(16).toString('hex'), don.maGui, don.dauNoiDung, so, ngayTao, don.cachNhan, don.diaChi,
          don.ngayNhan, don.gioNhan, don.ten, don.dienThoai, don.ghiChu, don.tongTien, don.giaThu ? 1 : 0, ms, ms);
      const themDong = this.db.query(`insert into don_dong (ma_don, thu_tu, ma_phan, ten, bao_quan, so_gam_khay, so_khay,
        gia_moi_khay) values (?, ?, ?, ?, ?, ?, ?, ?)`);
      don.dong.forEach((d, i) => themDong.run(ma, i + 1, d.maPhan, d.ten, d.baoQuan, d.soGamKhay, d.soKhay, d.giaMoiKhay));
      this.ghiNhatKy(ma, null, 'cho_thanh_toan', 'khach', ms);
      return { ok: true, moi: true, don: this.layDon(ma)! };
    }).immediate();
  }

  private ghiNhatKy(ma: string, tu: TrangThai | null, den: TrangThai, ai: string, ms: number) {
    this.db.query('insert into nhat_ky (ma_don, tu, den, ai, luc) values (?, ?, ?, ?, ?)').run(ma, tu, den, ai, ms);
  }

  /** Xếp một tin ZNS — gọi bên trong giao dịch của bước làm ra tin. Đã có thì thôi (mỗi đơn mỗi loại một tin). */
  private xepTinZns(ma: string, loai: LoaiTin, ms: number) {
    this.db.query(`insert or ignore into zns_tin (ma_don, loai, trang_thai, gui_sau, tao_luc, cap_nhat_luc)
      values (?, ?, 'cho', ?, ?, ?)`).run(ma, loai, ms, ms, ms);
  }

  /** Đổi một bước, chỉ khi đơn đang ở `tu` — gọi bên trong một giao dịch đã mở. */
  private doiTrongGiaoDich(ma: string, tu: TrangThai, den: TrangThai, ai: string, ms: number): KetQuaDoi {
    const r = this.db.query('update don set trang_thai = ?, cap_nhat_luc = ? where ma = ? and trang_thai = ?')
      .run(den, ms, ma, tu);
    if (r.changes === 1) {
      this.ghiNhatKy(ma, tu, den, ai, ms);
      // "Soạn xong, chờ giao" của đơn giao tận nơi đã báo khách "đã nhận đơn" (tiền thật) → báo "đang giao".
      if (den === 'cho_lay' && this.db.query(`select 1 from don d join zns_tin z on z.ma_don = d.ma and z.loai = 'da_nhan'
        where d.ma = ? and d.cach_nhan = 'giao-hang'`).get(ma)) this.xepTinZns(ma, 'dang_giao', ms);
      if (den === 'cho_lay') this.xepChuyenXe(ma, ms);
      if (den === 'can_hoan_tien') this.huyChuyenXeCuaDon(ma, ms);
      if (den === 'da_giao' && ai === 'quay') this.thoiChuyenKhiQuayTuGiao(ma, ms);
      return 'da_doi';
    }
    const hienTai = this.db.query('select trang_thai from don where ma = ?').get(ma) as { trang_thai: string } | null;
    if (!hienTai) return 'khong_co';
    return hienTai.trang_thai === den ? 'da_o_buoc_moi' : 'lech';
  }

  /** Đổi một bước, chỉ khi đơn đang ở `tu`. `ai`: "quay", "may" (bước của máy), "sepay" (tiền về). */
  private doi(ma: string, tu: TrangThai, den: TrangThai, ai: string, ms: number): KetQuaDoi {
    return this.db.transaction((): KetQuaDoi => this.doiTrongGiaoDich(ma, tu, den, ai, ms)).immediate();
  }

  /** Chờ trả tiền hay hết hạn → đã trả tiền, trong giao dịch đã mở. Đơn đã có tiền từ trước → da_o_buoc_moi. */
  private daThanhToanTrongGiaoDich(ma: string, ai: string, ms: number): KetQuaDoi {
    let ra = this.doiTrongGiaoDich(ma, 'cho_thanh_toan', 'da_thanh_toan', ai, ms);
    if (ra === 'lech') ra = this.doiTrongGiaoDich(ma, 'het_han', 'da_thanh_toan', ai, ms);
    return ra === 'lech' ? 'da_o_buoc_moi' : ra;
  }

  /** Bước quầy bấm trên màn hình — chỉ các bước trong BUOC_QUAY. */
  doiTrangThai(ma: string, tu: TrangThai, den: TrangThai, ms: number): KetQuaDoi {
    if (!duocBam(tu, den)) return 'khong_duoc';
    return this.doi(ma, tu, den, 'quay', ms);
  }

  /**
   * Đánh dấu đơn đã trả đủ tiền. Đường thật là ghiTienVe (SePay, sau khi đã kiểm chữ ký và số tiền); hàm này cho đơn
   * mẫu và kiểm thử. Đơn đã hết hạn mà tiền vẫn về: giữ "đã trả tiền" để quầy soạn hay hoàn tiền — tiền khách không bị
   * bỏ quên. Báo lại khi quầy đã soạn, đã giao hay đã hủy: tiền đã ghi nhận từ lần trước → da_o_buoc_moi.
   */
  ghiDaThanhToan(ma: string, ms: number, ai = 'sepay'): KetQuaDoi {
    return this.db.transaction((): KetQuaDoi => this.daThanhToanTrongGiaoDich(ma, ai, ms)).immediate();
  }

  /**
   * Ghi một lần tiền về của SePay — đúng một lần cho mỗi id (SePay gửi lại tới 8 lần, admin bấm gửi lại được).
   * Cùng một giao dịch BEGIN IMMEDIATE: ghi tiền và đổi đơn sang "đã trả tiền" hoặc cùng xong, hoặc cùng không có.
   * `soTaiKhoanQuan`: tài khoản nhận của quán — tiền vào tài khoản khác không được tính cho đơn.
   */
  ghiTienVe(tin: TinTienVe, soTaiKhoanQuan: string, ms: number): { moi: boolean; ketQua: KetQuaTienVe; maDon: string | null } {
    return this.db.transaction(() => {
      const cu = this.db.query('select ket_qua, ma_don from giao_dich where id_sepay = ?').get(tin.idSepay) as
        { ket_qua: KetQuaTienVe; ma_don: string | null } | null;
      if (cu) return { moi: false, ketQua: cu.ket_qua, maDon: cu.ma_don };
      const don = tin.maDon ? this.db.query('select ma, trang_thai, tong_tien from don where ma = ?').get(tin.maDon) as
        { ma: string; trang_thai: TrangThai; tong_tien: number } | null : null;
      let ketQua: KetQuaTienVe;
      // Tài khoản của quán: số tài khoản chính, hoặc tài khoản ảo (VA) SePay ghi ở subAccount.
      const dungTaiKhoan = !!soTaiKhoanQuan && (tin.soTaiKhoan === soTaiKhoanQuan || tin.taiKhoanPhu === soTaiKhoanQuan);
      if (!tin.vao) ketQua = 'tien_ra';
      else if (!dungTaiKhoan) ketQua = 'sai_tai_khoan';
      else if (!tin.maDon) ketQua = tin.coMaQuan ? 'khong_khop' : 'khong_ma';
      else if (!don) ketQua = 'khong_khop';
      else if (DA_CO_TIEN.includes(don.trang_thai)) ketQua = 'thua';
      else {
        const tong = this.tienDaNhan(don.ma) + tin.soTien;
        ketQua = tong < don.tong_tien ? 'thieu' : tong === don.tong_tien ? 'du' : 'thua';
      }
      const maDon = don && ['du', 'thieu', 'thua'].includes(ketQua) ? don.ma : null;
      // Phải có người xem: thiếu, dư, có mã của quán mà không có đơn, hay tiền mang mã của quán vào tài khoản khác.
      // Tiền khác của công ty (không mã), tiền ra: không.
      const canXem = ketQua === 'thieu' || ketQua === 'thua' || ketQua === 'khong_khop'
        || (ketQua === 'sai_tai_khoan' && (!!tin.maDon || tin.coMaQuan)) ? 1 : 0;
      this.db.query(`insert into giao_dich (id_sepay, ma_don, so_tien, ngay_giao_dich, ma_tham_chieu, ket_qua, can_xem, nhan_luc)
        values (?, ?, ?, ?, ?, ?, ?, ?)`).run(tin.idSepay, maDon, tin.soTien, tin.ngayGiaoDich, tin.maThamChieu, ketQua, canXem, ms);
      if (maDon && (ketQua === 'du' || ketQua === 'thua') && !DA_CO_TIEN.includes(don!.trang_thai)) {
        // Tin "đã nhận đơn" ghi "Giao tới <địa chỉ>": chỉ đơn giao tận nơi (đơn nhận tại quán cũ của sổ thử không có địa chỉ).
        if (this.daThanhToanTrongGiaoDich(maDon, 'sepay', ms) === 'da_doi'
          && this.db.query("select 1 from don where ma = ? and cach_nhan = 'giao-hang'").get(maDon)) this.xepTinZns(maDon, 'da_nhan', ms);
        // Đơn vừa đủ tiền: các lần "thiếu" trước của đơn này không còn phải xem.
        this.db.query("update giao_dich set can_xem = 0 where ma_don = ? and ket_qua = 'thieu'").run(maDon);
      }
      return { moi: true, ketQua, maDon };
    }).immediate();
  }

  /** Tiền đã về của mọi đơn có tiền — một câu cho cả màn quầy (tự tải lại 20 giây một lần). */
  tienDaNhanTheoDon(): Map<string, number> {
    return new Map((this.db.query(`select m, sum(n) as n from (
        select ma_don as m, so_tien as n from giao_dich where ma_don is not null and ket_qua in ('du', 'thieu', 'thua')
        union all
        select ma_don, so_tien from thanh_toan_zalo where ma_don is not null and ket_qua in ('du', 'thieu', 'thua')
      ) group by m`).all() as { m: string; n: number }[]).map(r => [r.m, r.n]));
  }

  /** Tổng tiền đã về cho một đơn (mọi lần khớp đơn): chuyển khoản SePay và VNPay. */
  tienDaNhan(ma: string): number {
    return (this.db.query(`select (select coalesce(sum(so_tien), 0) from giao_dich where ma_don = ?1
        and ket_qua in ('du', 'thieu', 'thua'))
      + (select coalesce(sum(so_tien), 0) from thanh_toan_zalo where ma_don = ?1 and ket_qua in ('du', 'thieu', 'thua')) as n`)
      .get(ma) as { n: number }).n;
  }

  /** Tiền về quầy / kế toán phải xem (thiếu, dư, không khớp đơn) mà chưa ai bấm "Đã xử lý". */
  tienVeCanXem(): TienVeCanXem[] {
    const hang = this.db.query(`select 'sepay' as nguon, g.id_sepay, null as ma_zalo, g.ma_don, g.so_tien, g.ngay_giao_dich,
        g.ma_tham_chieu, g.ket_qua, g.nhan_luc, d.so_trong_ngay, d.tong_tien from giao_dich g left join don d on d.ma = g.ma_don
      where g.can_xem = 1 and g.xem_xong_luc is null
      union all
      select 'vnpay', 0, z.ma_zalo, z.ma_don, z.so_tien, z.ngay_giao_dich, z.ma_giao_dich, z.ket_qua, z.nhan_luc,
        d.so_trong_ngay, d.tong_tien from thanh_toan_zalo z left join don d on d.ma = z.ma_don
      where z.can_xem = 1 and z.xem_xong_luc is null
      order by nhan_luc`).all() as DongDb[];
    const daNhan = this.tienDaNhanTheoDon();
    return hang.map(h => ({
      nguon: h.nguon === 'vnpay' ? 'vnpay' as const : 'sepay' as const, idSepay: Number(h.id_sepay),
      maZalo: h.ma_zalo === null ? null : String(h.ma_zalo), maDon: h.ma_don === null ? null : String(h.ma_don),
      soTrongNgay: h.so_trong_ngay === null ? null : Number(h.so_trong_ngay), soTien: Number(h.so_tien),
      tongTienDon: h.tong_tien === null ? null : Number(h.tong_tien),
      tongDaNhan: h.ma_don === null ? null : daNhan.get(String(h.ma_don)) ?? 0,
      ngayGiaoDich: String(h.ngay_giao_dich), maThamChieu: String(h.ma_tham_chieu),
      ketQua: String(h.ket_qua) as KetQuaTienVe | KetQuaThanhToanZalo,
    }));
  }

  /** Quầy bấm "Đã xử lý" cho một lần tiền về cần xem. Bấm đúp → da_o_buoc_moi. */
  danhDauDaXem(idSepay: number, ms: number): 'da_doi' | 'da_o_buoc_moi' | 'khong_co' {
    return this.db.transaction(() => {
      const r = this.db.query('update giao_dich set xem_xong_luc = ? where id_sepay = ? and can_xem = 1 and xem_xong_luc is null')
        .run(ms, idSepay);
      if (r.changes === 1) return 'da_doi' as const;
      return this.db.query('select 1 from giao_dich where id_sepay = ? and can_xem = 1').get(idSepay) ? 'da_o_buoc_moi' as const : 'khong_co' as const;
    }).immediate();
  }

  /**
   * Ghi một kết quả VNPay Zalo báo (đã kiểm MAC) — đúng một lần cho mỗi orderId của Checkout SDK. Cùng một giao dịch
   * BEGIN IMMEDIATE: ghi tiền và đổi đơn sang "đã trả tiền" hoặc cùng xong, hoặc cùng không có. Lần trước Zalo báo thất
   * bại mà lần này báo đã trừ tiền (cùng orderId): ghi lại theo lần này — tiền khách không bị bỏ quên.
   * `phuongThucQuan`: phương thức máy chủ đang ký (VNPAY_SANDBOX / VNPAY) — tiền của phương thức khác không tính cho đơn.
   */
  ghiThanhToanZalo(tin: TinCheckout, phuongThucQuan: string, ms: number): { moi: boolean; ketQua: KetQuaThanhToanZalo; maDon: string | null } {
    return this.db.transaction(() => {
      const cu = this.db.query('select ket_qua, ma_don from thanh_toan_zalo where ma_zalo = ?').get(tin.maZalo) as
        { ket_qua: KetQuaThanhToanZalo; ma_don: string | null } | null;
      if (cu && !(cu.ket_qua === 'that_bai' && tin.thanhCong)) return { moi: false, ketQua: cu.ket_qua, maDon: cu.ma_don };
      const don = tin.maDon ? this.db.query('select ma, trang_thai, tong_tien, cach_nhan from don where ma = ?').get(tin.maDon) as
        { ma: string; trang_thai: TrangThai; tong_tien: number; cach_nhan: string } | null : null;
      let ketQua: KetQuaThanhToanZalo;
      if (!tin.thanhCong) ketQua = 'that_bai';
      else if (tin.phuongThuc !== phuongThucQuan) ketQua = 'sai_phuong_thuc';
      else if (!don) ketQua = 'khong_khop';
      else if (DA_CO_TIEN.includes(don.trang_thai)) ketQua = 'thua';
      else {
        const tong = this.tienDaNhan(don.ma) + tin.soTien;
        ketQua = tong < don.tong_tien ? 'thieu' : tong === don.tong_tien ? 'du' : 'thua';
      }
      // Phải có người xem: thiếu, dư (khách trả hai lần), không ra đơn, hay tiền THẬT đi nhầm phương thức (máy chủ đang ở
      // sandbox). Thất bại, tiền thử của sandbox khi máy chủ nhận tiền thật: không — không có tiền thật nào để xử lý.
      const canXem = ketQua === 'thieu' || ketQua === 'thua' || ketQua === 'khong_khop'
        || (ketQua === 'sai_phuong_thuc' && !laThuNghiem(tin.phuongThuc)) ? 1 : 0;
      const ngay = gioVnTuMs(tin.luc ?? ms).replace('T', ' ');
      this.db.query(`insert or replace into thanh_toan_zalo (ma_zalo, ma_don, ma_giao_dich, phuong_thuc, so_tien, ngay_giao_dich,
          ket_qua, can_xem, nhan_luc) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(tin.maZalo, don?.ma ?? null, tin.maGiaoDich, tin.phuongThuc, tin.soTien, ngay, ketQua, canXem, ms);
      if (don && (ketQua === 'du' || ketQua === 'thua') && !DA_CO_TIEN.includes(don.trang_thai)) {
        if (this.daThanhToanTrongGiaoDich(don.ma, 'vnpay', ms) === 'da_doi' && don.cach_nhan === 'giao-hang') this.xepTinZns(don.ma, 'da_nhan', ms);
        // Đơn vừa đủ tiền: các lần "thiếu" trước của đơn này không còn phải xem.
        this.db.query("update giao_dich set can_xem = 0 where ma_don = ? and ket_qua = 'thieu'").run(don.ma);
        this.db.query("update thanh_toan_zalo set can_xem = 0 where ma_don = ? and ket_qua = 'thieu'").run(don.ma);
      }
      return { moi: true, ketQua, maDon: don?.ma ?? null };
    }).immediate();
  }

  /**
   * Mini App báo khách vừa mở trang VNPay (orderId do CheckoutSDK.createOrder trả). Chỉ để biết đơn nào đang chờ kết
   * quả của Zalo — không đổi đơn, không tính tiền. da_co: orderId đã ghi. qua_nhieu: đơn đã có SO_LAN_MO_ZALO_TOI_DA lần.
   */
  ghiMoThanhToanZalo(maDon: string, maZalo: string, ms: number): 'da_ghi' | 'da_co' | 'qua_nhieu' {
    return this.db.transaction(() => {
      if (this.db.query('select 1 from mo_thanh_toan_zalo where ma_zalo = ?').get(maZalo)) return 'da_co' as const;
      const { n } = this.db.query('select count(*) as n from mo_thanh_toan_zalo where ma_don = ?').get(maDon) as { n: number };
      if (n >= SO_LAN_MO_ZALO_TOI_DA) return 'qua_nhieu' as const;
      this.db.query('insert into mo_thanh_toan_zalo (ma_zalo, ma_don, luc) values (?, ?, ?)').run(maZalo, maDon, ms);
      return 'da_ghi' as const;
    }).immediate();
  }

  /** Quầy bấm "Đã xử lý" cho một kết quả VNPay cần xem. Bấm đúp → da_o_buoc_moi. */
  danhDauDaXemZalo(maZalo: string, ms: number): 'da_doi' | 'da_o_buoc_moi' | 'khong_co' {
    return this.db.transaction(() => {
      const r = this.db.query('update thanh_toan_zalo set xem_xong_luc = ? where ma_zalo = ? and can_xem = 1 and xem_xong_luc is null')
        .run(ms, maZalo);
      if (r.changes === 1) return 'da_doi' as const;
      return this.db.query('select 1 from thanh_toan_zalo where ma_zalo = ? and can_xem = 1').get(maZalo) ? 'da_o_buoc_moi' as const : 'khong_co' as const;
    }).immediate();
  }

  /** Đơn có tiền thử VNPay sandbox — màn quầy gắn nhãn, kẻo quầy soạn khay thật cho tiền không có thật. */
  donCoTienThuVnpay(): Set<string> {
    return new Set((this.db.query(`select distinct ma_don as m from thanh_toan_zalo where ma_don is not null
      and phuong_thuc glob '*_SANDBOX' and ket_qua in ('du', 'thieu', 'thua')`).all() as { m: string }[]).map(r => r.m));
  }

  /** Đơn chờ trả tiền quá PHUT_CHO_THANH_TOAN phút → hết hạn. Trả về số đơn vừa đổi. */
  datHetHan(ms: number): number {
    const moc = ms - PHUT_CHO_THANH_TOAN * 60_000;
    const qua = this.db.query("select ma from don where trang_thai = 'cho_thanh_toan' and tao_luc < ?").all(moc) as { ma: string }[];
    let so = 0;
    for (const { ma } of qua) if (this.doi(ma, 'cho_thanh_toan', 'het_han', 'may', ms) === 'da_doi') so++;
    return so;
  }

  /**
   * Đơn cho màn hình quầy: mọi đơn còn việc (CON_VIEC), xếp theo giờ nhận; và đơn đã khép trong hôm nay (giờ VN).
   * Đơn chờ trả tiền, hết hạn không hiện — quầy không soạn đơn chưa có tiền.
   */
  danhSachQuay(ms: number): { conViec: DonDayDu[]; xongHomNay: DonDayDu[] } {
    const dau = CON_VIEC.map(() => '?').join(', ');
    const viec = this.db.query(`select * from don where trang_thai in (${dau})
      order by ngay_nhan, gio_nhan, ngay_tao, so_trong_ngay`).all(...CON_VIEC) as DongDb[];
    // Hôm nay theo giờ Việt Nam: [0:00, 0:00 hôm sau) của ngày homNayVn — mốc ghi bằng chuỗi có múi +07:00.
    const homNay = homNayVn(ms);
    const tu = Date.parse(`${homNay}T00:00:00+07:00`), den = Date.parse(`${congNgay(homNay, 1)}T00:00:00+07:00`);
    const xong = this.db.query(`select * from don where trang_thai in ('da_giao', 'da_hoan_tien')
      and cap_nhat_luc >= ? and cap_nhat_luc < ? order by cap_nhat_luc desc`).all(tu, den) as DongDb[];
    const doc = this.docKemDong([...viec, ...xong]);
    return { conViec: viec.map(doc), xongHomNay: xong.map(doc) };
  }

  /** Đọc dòng thịt của nhiều đơn bằng một câu; trả hàm dựng DonDayDu cho từng hàng `don`. */
  private docKemDong(hang: DongDb[]): (h: DongDb) => DonDayDu {
    const ma = hang.map(h => String(h.ma));
    const dongTheoDon = new Map<string, DongDb[]>(ma.map(m => [m, []]));
    if (ma.length) {
      const tat = this.db.query(`select * from don_dong where ma_don in (${ma.map(() => '?').join(', ')}) order by ma_don, thu_tu`)
        .all(...ma) as DongDb[];
      for (const d of tat) dongTheoDon.get(String(d.ma_don))!.push(d);
    }
    return (h: DongDb) => this.docDon(h, dongTheoDon.get(String(h.ma)))!;
  }

  /** Chế độ demo: đơn đang chờ khách chuyển khoản, mới nhất trước (màn quầy hiện nút giả lập tiền về). */
  donChoThanhToan(): DonDayDu[] {
    const hang = this.db.query("select * from don where trang_thai = 'cho_thanh_toan' order by tao_luc desc limit 50").all() as DongDb[];
    return hang.map(this.docKemDong(hang));
  }

  /** Đơn có tiền về giả lập của chế độ demo (id âm, may-chu.ts idTienVeDemo) — màn quầy gắn nhãn DEMO. */
  donCoTienDemo(): Set<string> {
    return new Set((this.db.query('select distinct ma_don as m from giao_dich where id_sepay < 0 and ma_don is not null').all() as
      { m: string }[]).map(r => r.m));
  }

  // ---------- Hàng chờ ZNS (gui-zns.ts) ----------

  /**
   * Bỏ tin không còn nên gửi: quá GIU_TIN_ZNS_MS; "đã nhận đơn" của đơn đã hủy; "đang giao" của đơn không còn ở bước
   * "Soạn xong, chờ giao" (đã giao, đã hủy). Trả về số tin vừa bỏ.
   */
  boQuaTinZnsCu(ms: number): number {
    return this.db.transaction(() => this.db.query(`update zns_tin set trang_thai = 'bo_qua', cap_nhat_luc = ?1,
        loi = 'Quá cũ hoặc đơn đã sang bước khác'
      where trang_thai = 'cho' and (
        (loai = 'da_nhan' and (tao_luc < ?2 or ma_don in (select ma from don where trang_thai in ('can_hoan_tien', 'da_hoan_tien'))))
        or (loai = 'dang_giao' and (tao_luc < ?3 or ma_don in (select ma from don where trang_thai <> 'cho_lay'))))`)
      .run(ms, ms - GIU_TIN_ZNS_MS.da_nhan, ms - GIU_TIN_ZNS_MS.dang_giao).changes).immediate();
  }

  /** Tin đến hạn gửi, cũ trước. */
  tinZnsDenHan(ms: number, gioiHan: number): TinZns[] {
    return (this.db.query(`select ma_don, loai, so_lan from zns_tin where trang_thai = 'cho' and gui_sau <= ?
      order by gui_sau, tao_luc limit ?`).all(ms, gioiHan) as { ma_don: string; loai: LoaiTin; so_lan: number }[])
      .map(h => ({ maDon: h.ma_don, loai: h.loai, soLan: h.so_lan }));
  }

  /** cho → dang_gui ngay trước khi gọi Zalo. false: tin đã bị lượt khác lấy hay đã bỏ — không gửi. */
  batDauGuiZns(ma: string, loai: LoaiTin, ms: number): boolean {
    return this.db.transaction(() => this.db.query(`update zns_tin set trang_thai = 'dang_gui', so_lan = so_lan + 1,
      cap_nhat_luc = ? where ma_don = ? and loai = ? and trang_thai = 'cho'`).run(ms, ma, loai).changes === 1).immediate();
  }

  /**
   * Kết quả một lần gọi Zalo (tin đang 'dang_gui'). thuLaiSauMs: null = không thử lại (that_bai); có số = về 'cho',
   * gửi lại sau chừng đó — trừ khi đã gọi SO_LAN_ZNS_TOI_DA lần (that_bai). `loi` đã xóa số điện thoại, token.
   */
  ghiKetQuaZns(ma: string, loai: LoaiTin, kq: { daGui: true; msgId: string | null } | { daGui: false; loi: string; thuLaiSauMs: number | null },
    ms: number): TrangThaiZns {
    return this.db.transaction((): TrangThaiZns => {
      const h = this.db.query("select so_lan from zns_tin where ma_don = ? and loai = ? and trang_thai = 'dang_gui'")
        .get(ma, loai) as { so_lan: number } | null;
      if (!h) return 'khong_ro';
      const den: TrangThaiZns = kq.daGui ? 'da_gui'
        : kq.thuLaiSauMs === null || h.so_lan >= SO_LAN_ZNS_TOI_DA ? 'that_bai' : 'cho';
      this.db.query(`update zns_tin set trang_thai = ?, cap_nhat_luc = ?, gui_sau = ?, msg_id = ?, loi = ?
        where ma_don = ? and loai = ?`).run(den, ms, ms + (!kq.daGui && kq.thuLaiSauMs ? kq.thuLaiSauMs : 0),
        kq.daGui ? kq.msgId : null, kq.daGui ? null : kq.loi.slice(0, 300), ma, loai);
      return den;
    }).immediate();
  }

  /** Tin chưa gửi đi được vì lý do không phải của riêng tin (chưa có token, hết quota…): về 'cho', không tính lần. */
  traTinZnsVeHang(ma: string, loai: LoaiTin, guiSau: number, ms: number): void {
    this.db.query(`update zns_tin set trang_thai = 'cho', so_lan = max(so_lan - 1, 0), gui_sau = ?, cap_nhat_luc = ?
      where ma_don = ? and loai = ? and trang_thai = 'dang_gui'`).run(guiSau, ms, ma, loai);
  }

  /**
   * Khi máy chủ khởi động: tin còn 'dang_gui' là lúc máy chủ tắt giữa chừng gọi Zalo — Zalo có thể đã nhận. Không gửi
   * lại (khách nhận hai lần còn tệ hơn thiếu một tin): đánh dấu 'khong_ro', đếm ở số liệu sức khỏe.
   */
  datKhongRoTinZnsDangGui(ms: number): number {
    return this.db.query(`update zns_tin set trang_thai = 'khong_ro', cap_nhat_luc = ?, loi = 'Máy chủ tắt giữa lúc gọi Zalo'
      where trang_thai = 'dang_gui'`).run(ms).changes;
  }

  trangThaiTinZns(ma: string, loai: LoaiTin): { trangThai: TrangThaiZns; soLan: number; msgId: string | null; loi: string | null } | null {
    const h = this.db.query('select trang_thai, so_lan, msg_id, loi from zns_tin where ma_don = ? and loai = ?').get(ma, loai) as
      { trang_thai: TrangThaiZns; so_lan: number; msg_id: string | null; loi: string | null } | null;
    return h ? { trangThai: h.trang_thai, soLan: h.so_lan, msgId: h.msg_id, loi: h.loi } : null;
  }

  docTokenZalo(): TokenZalo | null {
    const h = this.db.query('select * from zalo_token where id = 1').get() as Record<string, string | number | null> | null;
    return h ? {
      refreshMa: (h.refresh_ma as string | null) ?? null, accessMa: (h.access_ma as string | null) ?? null,
      hetHanLuc: (h.het_han_luc as number | null) ?? null, trangThai: String(h.trang_thai), loi: (h.loi as string | null) ?? null,
    } : null;
  }

  /**
   * Gieo refresh token Khánh dán vào ZALO_REFRESH_TOKEN_MOI — mỗi token một lần (dấu `dau`): khởi động lại máy chủ
   * với dòng cũ còn trong file bí mật không đè chuỗi token đã làm mới. true: vừa gieo.
   */
  gieoTokenZalo(refreshMa: string, dau: string, ms: number): boolean {
    return this.db.transaction(() => {
      const cu = this.db.query('select dau_gieo from zalo_token where id = 1').get() as { dau_gieo: string | null } | null;
      if (cu?.dau_gieo === dau) return false;
      this.db.query(`insert into zalo_token (id, refresh_ma, access_ma, het_han_luc, dau_gieo, trang_thai, loi, cap_nhat_luc)
        values (1, ?, null, null, ?, 'tot', null, ?) on conflict (id) do update set refresh_ma = excluded.refresh_ma,
        access_ma = null, het_han_luc = null, dau_gieo = excluded.dau_gieo, trang_thai = 'tot', loi = null,
        cap_nhat_luc = excluded.cap_nhat_luc`).run(refreshMa, dau, ms);
      return true;
    }).immediate();
  }

  /** Lưu cặp token vừa làm mới — TRƯỚC khi dùng access token (refresh token cũ đã chết ngay khi Zalo trả cái mới). */
  luuTokenZalo(o: { refreshMa: string | null; accessMa: string; hetHanLuc: number }, ms: number): void {
    this.db.query(`update zalo_token set refresh_ma = coalesce(?, refresh_ma), access_ma = ?, het_han_luc = ?,
      trang_thai = 'tot', loi = null, cap_nhat_luc = ? where id = 1`).run(o.refreshMa, o.accessMa, o.hetHanLuc, ms);
  }

  /** Token hỏng (Zalo từ chối refresh token, hay không giải mã được): ghi để số liệu sức khỏe và nhật ký báo. */
  ghiLoiTokenZalo(trangThai: 'bi_tu_choi' | 'khong_giai_ma', loi: string, ms: number): void {
    this.db.query('update zalo_token set trang_thai = ?, loi = ?, access_ma = null, cap_nhat_luc = ? where id = 1')
      .run(trangThai, loi.slice(0, 300), ms);
  }

  // ---------- Chuyến xe Ahamove (goi-xe.ts, POST /ahamove/trang-thai) ----------

  private docChuyen(h: DongDb | null): ChuyenXe | null {
    if (!h) return null;
    const s = (k: string) => (h[k] === null || h[k] === undefined ? null : String(h[k]));
    const n = (k: string) => (h[k] === null || h[k] === undefined ? null : Number(h[k]));
    return {
      maDon: String(h.ma_don), lan: Number(h.lan), viec: s('viec') as ViecXe | null, viecSau: Number(h.viec_sau), soLan: Number(h.so_lan),
      maAha: s('ma_aha'), trangThaiAha: s('trang_thai_aha'), trangThaiPhu: s('trang_thai_phu'), diemGiao: s('diem_giao'),
      lyDo: s('ly_do'), taiXeTen: s('tai_xe_ten'), taiXeSdt: s('tai_xe_sdt'), link: s('link'), phi: n('phi'),
      maLoi: s('ma_loi'), loi: s('loi'), huyYeuCau: Number(h.huy_yeu_cau) === 1, loiHuy: s('loi_huy'), tuGoiLuc: n('tu_goi_luc'),
      taoLuc: Number(h.tao_luc), capNhatLuc: Number(h.cap_nhat_luc), ahaLuc: n('aha_luc'),
    };
  }

  layChuyen(ma: string, lan: number): ChuyenXe | null {
    return this.docChuyen(this.db.query('select * from chuyen_xe where ma_don = ? and lan = ?').get(ma, lan) as DongDb | null);
  }

  /** Lần gọi xe mới nhất của đơn — lần quầy thấy và bấm. */
  chuyenMoiNhat(ma: string): ChuyenXe | null {
    return this.docChuyen(this.db.query('select * from chuyen_xe where ma_don = ? order by lan desc limit 1').get(ma) as DongDb | null);
  }

  /** Lần gọi xe mới nhất của các đơn `ma` (đơn trên màn quầy) — một câu, không quét cả lịch sử. */
  chuyenMoiNhatTheoDon(ma: string[]): Map<string, ChuyenXe> {
    if (!ma.length) return new Map();
    const dau = ma.map(() => '?').join(', ');
    const hang = this.db.query(`select c.* from chuyen_xe c join (select ma_don, max(lan) as lan from chuyen_xe
        where ma_don in (${dau}) group by ma_don) m on m.ma_don = c.ma_don and m.lan = c.lan`).all(...ma) as DongDb[];
    return new Map(hang.map(h => [String(h.ma_don), this.docChuyen(h)!]));
  }

  /** Tiền THẬT đã về đủ tổng đơn: SePay id dương (id âm là giả lập của demo), VNPay không phải sandbox. */
  private coTienThat(ma: string): boolean {
    const h = this.db.query(`select (select coalesce(sum(so_tien), 0) from giao_dich where ma_don = ?1 and id_sepay > 0
        and ket_qua in ('du', 'thieu', 'thua'))
      + (select coalesce(sum(so_tien), 0) from thanh_toan_zalo where ma_don = ?1 and phuong_thuc not glob '*_SANDBOX'
        and ket_qua in ('du', 'thieu', 'thua')) as n, (select tong_tien from don where ma = ?1) as t`).get(ma) as { n: number; t: number | null };
    return h.t !== null && h.n >= h.t;
  }

  /** "Soạn xong, chờ giao" của đơn giao tận nơi → lần gọi xe đầu tiên — trong giao dịch đổi trạng thái. */
  private xepChuyenXe(ma: string, ms: number) {
    if (!this.goiXe) return;
    if (!this.db.query("select 1 from don where ma = ? and cach_nhan = 'giao-hang'").get(ma)) return;
    if (this.goiXe.chiTienThat && !this.coTienThat(ma)) return;
    this.db.query(`insert or ignore into chuyen_xe (ma_don, lan, viec, viec_sau, tao_luc, cap_nhat_luc) values (?, 1, 'tao', ?, ?, ?)`)
      .run(ma, ms, ms, ms);
  }

  /**
   * Quầy hủy đơn → chuyến mới nhất (trong giao dịch đổi trạng thái). Đã gửi Ahamove mà chưa khép (có mã Ahamove, hay
   * đang 'kiem_lai'): việc 'huy'. Chưa gửi lần nào ('tao'), hay đã khép (Ahamove không nhận, Ahamove hủy, giao không
   * được): khỏi gọi Ahamove, chỉ đánh dấu đã hủy — quầy thôi thấy nút "Gọi lại xe".
   */
  private huyChuyenXeCuaDon(ma: string, ms: number) {
    const c = this.chuyenMoiNhat(ma);
    if (!c || c.tuGoiLuc !== null || c.huyYeuCau) return;
    if (c.viec === 'kiem_lai' || (c.maAha && !laTrangThaiCuoi(c.trangThaiAha))) {
      this.db.query(`update chuyen_xe set viec = 'huy', viec_sau = ?, so_lan = 0, huy_yeu_cau = 1, cap_nhat_luc = ?
        where ma_don = ? and lan = ?`).run(ms, ms, ma, c.lan);
    } else {
      this.db.query('update chuyen_xe set viec = null, huy_yeu_cau = 1, cap_nhat_luc = ? where ma_don = ? and lan = ?').run(ms, ma, c.lan);
    }
  }

  /**
   * Quầy tự bấm "Đã giao tới khách" (quầy tự giao) trong lúc chuyến chưa tới tay tài xế: chưa gửi Ahamove → thôi gọi;
   * đã gửi mà tài xế chưa lấy hàng → hủy. Tài xế đã lấy hàng (IN PROCESS): để nguyên — thường là webhook tới chậm hơn quầy.
   */
  private thoiChuyenKhiQuayTuGiao(ma: string, ms: number) {
    const c = this.chuyenMoiNhat(ma);
    if (!c || c.tuGoiLuc !== null || c.huyYeuCau || laTrangThaiCuoi(c.trangThaiAha) || c.trangThaiAha === 'IN PROCESS') return;
    if (c.viec === 'tao' || (!c.maAha && c.viec === null)) {
      this.db.query('update chuyen_xe set viec = null, tu_goi_luc = ?, cap_nhat_luc = ? where ma_don = ? and lan = ?').run(ms, ms, ma, c.lan);
    } else {
      this.db.query(`update chuyen_xe set viec = 'huy', viec_sau = ?, so_lan = 0, huy_yeu_cau = 1, tu_goi_luc = ?, cap_nhat_luc = ?
        where ma_don = ? and lan = ?`).run(ms, ms, ms, ma, c.lan);
    }
  }

  /** Chuyến có việc đến hạn (tạo, tra lại, hủy) — hủy trước (tài xế đừng tới đơn đã hủy), rồi cũ trước. */
  chuyenCanLam(ms: number, gioiHan: number): ChuyenXe[] {
    return (this.db.query(`select * from chuyen_xe where viec is not null and viec_sau <= ?
      order by case viec when 'huy' then 0 else 1 end, viec_sau, tao_luc limit ?`)
      .all(ms, gioiHan) as DongDb[]).map(h => this.docChuyen(h)!);
  }

  /** Chuyến đang chạy mà Ahamove im quá MS_HOI_LAI (webhook lạc, hay chưa cài webhook): máy chủ tự hỏi. */
  chuyenCanHoi(ms: number, gioiHan: number): ChuyenXe[] {
    return (this.db.query(`select * from chuyen_xe where ma_aha is not null and viec is null and tu_goi_luc is null
        and (trang_thai_aha is null or trang_thai_aha <> 'CANCELLED') and not (trang_thai_aha = 'COMPLETED' and diem_giao is not null)
        and max(coalesce(aha_luc, 0), coalesce(hoi_luc, 0), cap_nhat_luc) < ? and tao_luc > ?
      order by coalesce(hoi_luc, 0) limit ?`).all(ms - MS_HOI_LAI, ms - MS_THOI_HOI, gioiHan) as DongDb[]).map(h => this.docChuyen(h)!);
  }

  /**
   * tao → kiem_lai NGAY TRƯỚC khi gửi Tạo đơn (đếm một lần). Máy chủ tắt, mất mạng giữa chừng: lượt sau tra lại theo mã
   * theo dõi chứ không gửi lại mù. false: chuyến đã bị lượt khác lấy, hay không còn việc tạo — không gửi.
   */
  batDauTaoChuyen(ma: string, lan: number, ms: number): boolean {
    return this.db.transaction(() => this.db.query(`update chuyen_xe set viec = 'kiem_lai', viec_sau = ?, so_lan = so_lan + 1,
      cap_nhat_luc = ? where ma_don = ? and lan = ? and viec = 'tao' and viec_sau <= ?`)
      .run(ms + MS_CHO_KIEM_LAI, ms, ma, lan, ms).changes === 1).immediate();
  }

  /** Còn tra lại / hủy, chưa xong (mất mạng, 5xx, 409): giữ việc, lùi giờ làm, ghi câu lỗi. */
  hoanViecXe(ma: string, lan: number, sauMs: number, loi: string, ms: number): void {
    this.db.query('update chuyen_xe set viec_sau = ?, loi = ?, cap_nhat_luc = ? where ma_don = ? and lan = ? and viec is not null')
      .run(ms + sauMs, loi.slice(0, 300), ms, ma, lan);
  }

  /**
   * Ahamove chắc chắn CHƯA có đơn của lần gọi này (503, hay tra lại không thấy): về 'tao', gửi lại sau `sauMs`. Đã gửi
   * SO_LAN_TAO_TOI_DA lần: thôi, báo quầy (QUA_SO_LAN). Quầy đã hủy đơn: thôi luôn, không gọi. tinhLan false: lần vừa
   * rồi không tới được Ahamove (token hỏng trước khi gửi) — không đếm.
   */
  traChuyenVeTao(ma: string, lan: number, sauMs: number, loi: string, ms: number, tinhLan = true): ViecXe | null {
    return this.db.transaction((): ViecXe | null => {
      const c = this.layChuyen(ma, lan);
      if (!c || (c.viec !== 'kiem_lai' && c.viec !== 'huy')) return c?.viec ?? null;
      if (c.huyYeuCau) {
        this.db.query('update chuyen_xe set viec = null, loi = ?, cap_nhat_luc = ? where ma_don = ? and lan = ?').run(loi.slice(0, 300), ms, ma, lan);
        return null;
      }
      const soLan = tinhLan ? c.soLan : Math.max(c.soLan - 1, 0);
      const het = soLan >= SO_LAN_TAO_TOI_DA;
      this.db.query(`update chuyen_xe set viec = ?, viec_sau = ?, so_lan = ?, ma_loi = ?, loi = ?, cap_nhat_luc = ? where ma_don = ? and lan = ?`)
        .run(het ? null : 'tao', ms + sauMs, soLan, het ? 'QUA_SO_LAN' : null, loi.slice(0, 300), ms, ma, lan);
      return het ? null : 'tao';
    }).immediate();
  }

  /** Ahamove không nhận đơn (400, 404, 406…): thôi tạo, quầy thấy lý do theo mã lỗi. */
  ghiLoiTaoChuyen(ma: string, lan: number, l: LoiAhamove, ms: number): void {
    this.db.query(`update chuyen_xe set viec = null, ma_loi = ?, loi = ?, cap_nhat_luc = ?
      where ma_don = ? and lan = ? and viec in ('kiem_lai', 'huy') and ma_aha is null`)
      .run(l.ma, `${l.ma}${l.cau ? `: ${l.cau}` : ''}`.slice(0, 300), ms, ma, lan);
  }

  /**
   * Ghi một trạng thái Ahamove báo (câu trả lời Tạo đơn, tra lại, hỏi lại, webhook). Tìm chuyến theo mã Ahamove, không
   * thấy thì theo mã theo dõi (webhook tới trước câu trả lời Tạo đơn). Chuyến đã khép (COMPLETED, CANCELLED) không đổi
   * nữa — webhook tới trễ không kéo lùi. Giao được (COMPLETED, điểm giao COMPLETED): đơn "Soạn xong, chờ giao" tự sang
   * "Đã giao tới khách" (ai: ahamove). Quầy đã hủy đơn mà chuyến còn chạy: việc 'huy' (Tạo đơn xong sau lệnh hủy).
   * null: không phải chuyến của máy chủ này.
   */
  ghiTinAhamove(tin: TinChuyen, ms: number, khoa?: { ma: string; lan: number }): { maDon: string; lan: number; doi: boolean; daGiao: boolean } | null {
    return this.db.transaction(() => {
      let c = this.docChuyen(this.db.query('select * from chuyen_xe where ma_aha = ?').get(tin.maAha) as DongDb | null);
      const theoMa = khoa ? { maDon: khoa.ma, lan: khoa.lan } : docMaTheoDoiXe(tin.maTheoDoi);
      if (!c && theoMa) {
        const cu = this.layChuyen(theoMa.maDon, theoMa.lan);
        if (cu && (cu.maAha === null || cu.maAha === tin.maAha)) c = cu;
      }
      if (!c) return null;
      if (c.maAha === tin.maAha && daKhepHan(c.trangThaiAha, c.diemGiao)) return { maDon: c.maDon, lan: c.lan, doi: false, daGiao: false };
      const tt = tin.trangThai || c.trangThaiAha;
      const cuoi = laTrangThaiCuoi(tt);
      // Lần cũ hơn lần quầy đang thấy (đã bấm "Gọi lại xe") mà Ahamove vẫn chạy: hủy nó — một đơn một xe.
      const moiNhat = this.db.query('select max(lan) as lan from chuyen_xe where ma_don = ?').get(c.maDon) as { lan: number };
      const biThay = !cuoi && c.lan < moiNhat.lan;
      if (biThay && !c.huyYeuCau) this.db.query('update chuyen_xe set huy_yeu_cau = 1 where ma_don = ? and lan = ?').run(c.maDon, c.lan);
      const huyYeuCau = c.huyYeuCau || biThay;
      const coTaiXe = tt === 'ACCEPTED' || tt === 'IN PROCESS' || tt === 'COMPLETED' || tt === 'CONFIRMING' || tt === 'PAYING';
      // Việc tiếp theo: tra lại / tạo xong rồi thì hết việc; quầy đã hủy đơn mà chuyến còn chạy thì hủy; khép thì hết.
      // Hủy không được (loi_huy) thì thôi thử lại: webhook sau không mở lại vòng hủy.
      const viec: ViecXe | null = cuoi ? null : (huyYeuCau && !c.loiHuy) || c.viec === 'huy' ? 'huy' : null;
      this.db.query(`update chuyen_xe set ma_aha = ?, trang_thai_aha = ?, trang_thai_phu = ?, diem_giao = coalesce(?, diem_giao),
          ly_do = coalesce(?, ly_do), tai_xe_ten = ?, tai_xe_sdt = ?, link = coalesce(?, link), phi = coalesce(?, phi),
          viec = ?, viec_sau = case when ? is null then viec_sau else ? end, ma_loi = null, aha_luc = ?, cap_nhat_luc = ?
        where ma_don = ? and lan = ?`).run(
        tin.maAha, tt, tin.trangThaiPhu || null, tin.diemGiao || null, tin.lyDo || null,
        coTaiXe ? (tin.taiXeTen || c.taiXeTen) : null, coTaiXe ? (tin.taiXeSdt || c.taiXeSdt) : null,
        tin.link || null, tin.phi, viec, viec, viec === c.viec ? c.viecSau : ms, ms, ms, c.maDon, c.lan);
      const daGiao = tt === 'COMPLETED' && tin.diemGiao === 'COMPLETED'
        && this.doiTrongGiaoDich(c.maDon, 'cho_lay', 'da_giao', 'ahamove', ms) === 'da_doi';
      return { maDon: c.maDon, lan: c.lan, doi: true, daGiao };
    }).immediate();
  }

  /** Đã hủy chuyến (Ahamove trả 200), hay không có chuyến nào để hủy (404): thôi việc hủy. */
  ghiDaHuyChuyen(ma: string, lan: number, ms: number): void {
    this.db.query(`update chuyen_xe set viec = null, trang_thai_aha = case when ma_aha is null then trang_thai_aha else 'CANCELLED' end,
      loi = null, cap_nhat_luc = ? where ma_don = ? and lan = ? and viec = 'huy'`).run(ms, ma, lan);
  }

  /** Hủy không được (tài xế đã lấy hàng, hay hỏng quá SO_LAN_HUY_TOI_DA lần): quầy gọi tài xế / Ahamove. */
  ghiHuyKhongDuoc(ma: string, lan: number, loi: string, ms: number): void {
    this.db.query(`update chuyen_xe set viec = null, loi_huy = ?, cap_nhat_luc = ? where ma_don = ? and lan = ? and viec = 'huy'`)
      .run(loi.slice(0, 300) || 'Không hủy được', ms, ma, lan);
  }

  /** Một lần hủy hỏng tạm (mất mạng, 5xx): đếm; quá SO_LAN_HUY_TOI_DA lần thì thôi, báo quầy. */
  hoanHuyChuyen(ma: string, lan: number, sauMs: number, loi: string, ms: number): void {
    this.db.transaction(() => {
      const c = this.layChuyen(ma, lan);
      if (!c || c.viec !== 'huy') return;
      if (c.soLan + 1 >= SO_LAN_HUY_TOI_DA) { this.ghiHuyKhongDuoc(ma, lan, `QUA_SO_LAN: ${loi}`, ms); return; }
      this.db.query('update chuyen_xe set so_lan = so_lan + 1, viec_sau = ?, loi = ?, cap_nhat_luc = ? where ma_don = ? and lan = ?')
        .run(ms + sauMs, loi.slice(0, 300), ms, ma, lan);
    }).immediate();
  }

  /** Đã hỏi Ahamove (được hay không): lượt sau chờ thêm MS_HOI_LAI mới hỏi lại chuyến này. */
  daHoiChuyen(ma: string, lan: number, ms: number): void {
    this.db.query('update chuyen_xe set hoi_luc = ? where ma_don = ? and lan = ?').run(ms, ma, lan);
  }

  /**
   * Quầy bấm "Gọi lại xe Ahamove" cho lần `lan` (lần mới nhất, đang cần người làm và được gọi lại: Ahamove không nhận,
   * Ahamove hủy, giao không được) — đơn phải còn ở "Soạn xong, chờ giao". Bấm đúp, hai máy cùng bấm: một lần mới.
   */
  goiLaiXe(ma: string, lan: number, ms: number): KetQuaDoi {
    if (!this.goiXe) return 'khong_duoc';
    return this.db.transaction((): KetQuaDoi => {
      const c = this.chuyenMoiNhat(ma);
      if (!c) return 'khong_co';
      if (c.lan > lan) return 'da_o_buoc_moi';
      if (c.lan < lan) return 'khong_co';
      const don = this.db.query('select trang_thai from don where ma = ?').get(ma) as { trang_thai: string } | null;
      if (!don || don.trang_thai !== 'cho_lay' || !buocXe(c, ms).choGoiLai || c.lan >= 20) return 'lech';
      this.db.query(`insert into chuyen_xe (ma_don, lan, viec, viec_sau, tao_luc, cap_nhat_luc) values (?, ?, 'tao', ?, ?, ?)`)
        .run(ma, c.lan + 1, ms, ms, ms);
      return 'da_doi';
    }).immediate();
  }

  /** Quầy bấm "Quầy tự xử lý" cho lần `lan` đang cần người làm: thôi báo, máy chủ không làm gì thêm với chuyến này. */
  quayTuGoiXe(ma: string, lan: number, ms: number): KetQuaDoi {
    return this.db.transaction((): KetQuaDoi => {
      const c = this.chuyenMoiNhat(ma);
      if (!c || c.lan !== lan) return c && c.lan > lan ? 'lech' : 'khong_co';
      if (c.tuGoiLuc !== null) return 'da_o_buoc_moi';
      if (!buocXe(c, ms).canXem) return 'lech';
      // Đang gọi lâu (đã gửi mà chưa rõ) hay chuyến còn chạy: Ahamove có thể đã có đơn — hủy nó, kẻo hai tài xế.
      const conChay = c.viec === 'kiem_lai' || (c.maAha !== null && !laTrangThaiCuoi(c.trangThaiAha) && !c.loiHuy);
      this.db.query(`update chuyen_xe set tu_goi_luc = ?, viec = ?, viec_sau = ?, so_lan = case when ? = 'huy' then 0 else so_lan end,
        huy_yeu_cau = case when ? = 'huy' then 1 else huy_yeu_cau end, cap_nhat_luc = ? where ma_don = ? and lan = ?`)
        .run(ms, conChay ? 'huy' : null, ms, conChay ? 'huy' : '', conChay ? 'huy' : '', ms, ma, lan);
      return 'da_doi';
    }).immediate();
  }

  private soLieuXe(ms: number) {
    const dangLam = (this.db.query(`select ma from don where trang_thai in (${CON_VIEC.map(() => '?').join(', ')})`)
      .all(...CON_VIEC) as { ma: string }[]).map(r => r.ma);
    let canXem = 0;
    for (const c of this.chuyenMoiNhatTheoDon(dangLam).values()) if (buocXe(c, ms).canXem) canXem++;
    const cuoi = this.db.query('select max(aha_luc) as luc from chuyen_xe').get() as { luc: number | null };
    return { soXeCanXem: canXem, lanAhamoveCuoi: cuoi.luc };
  }

  /** Số liệu cho đèn sức khỏe — chỉ số đếm và mốc giờ, không tên, không số điện thoại. */
  soLieu(ms: number) {
    const soTheoTrangThai = new Map((this.db.query('select trang_thai as t, count(*) as n from don group by trang_thai').all() as
      { t: string; n: number }[]).map(r => [r.t, r.n]));
    const dem = (tt: TrangThai) => soTheoTrangThai.get(tt) ?? 0;
    const cuNhat = this.db.query(`select min(cap_nhat_luc) as luc from don where trang_thai = 'da_thanh_toan'`)
      .get() as { luc: number | null };
    const cuoi = this.db.query('select max(luc) as luc from nhat_ky').get() as { luc: number | null };
    const tienVe = this.db.query(`select max(nhan_luc) as luc, sum(case when can_xem = 1 and xem_xong_luc is null then 1 else 0 end) as can
      from (select nhan_luc, can_xem, xem_xong_luc from giao_dich union all select nhan_luc, can_xem, xem_xong_luc from thanh_toan_zalo
        where ket_qua in ('du', 'thieu', 'thua', 'khong_khop') or can_xem = 1)`)
      .get() as { luc: number | null; can: number | null };
    return {
      soChoSoan: dem('da_thanh_toan'),
      soDangSoan: dem('dang_soan'),
      soChoLay: dem('cho_lay'),
      soCanHoanTien: dem('can_hoan_tien'),
      phutChoSoanLauNhat: cuNhat.luc === null ? null : Math.floor((ms - cuNhat.luc) / 60_000),
      soDonHomNay: (this.db.query('select count(*) as n from don where ngay_tao = ?').get(homNayVn(ms)) as { n: number }).n,
      lanGhiCuoi: cuoi.luc,
      lanTienVeCuoi: tienVe.luc,
      soTienVeCanXem: tienVe.can ?? 0,
      ...this.soLieuZns(ms),
      ...this.soLieuVnpay(ms),
      ...this.soLieuXe(ms),
    };
  }

  private soLieuVnpay(ms: number) {
    const v = this.db.query(`select max(case when ket_qua in ('du', 'thieu', 'thua') then nhan_luc end) as cuoi,
        sum(case when ket_qua = 'that_bai' and nhan_luc >= ? then 1 else 0 end) as that_bai from thanh_toan_zalo`)
      .get(ms - 24 * 3600_000) as { cuoi: number | null; that_bai: number | null };
    // Đơn đã mở trang VNPay quá PHUT_CHO_KET_QUA_ZALO phút mà Zalo chưa báo kết quả nào, đơn vẫn chưa có tiền.
    const cho = this.db.query(`select count(distinct m.ma_don) as n from mo_thanh_toan_zalo m join don d on d.ma = m.ma_don
      where m.luc < ? and m.luc >= ? and d.trang_thai in ('cho_thanh_toan', 'het_han')
        and not exists (select 1 from thanh_toan_zalo z where z.ma_zalo = m.ma_zalo)`)
      .get(ms - PHUT_CHO_KET_QUA_ZALO * 60_000, ms - 48 * 3600_000) as { n: number };
    return { lanVnpayCuoi: v.cuoi, soVnpayThatBai24Gio: v.that_bai ?? 0, soDonVnpayChoKetQua: cho.n };
  }

  private soLieuZns(ms: number) {
    const z = this.db.query(`select sum(case when trang_thai in ('cho', 'dang_gui') then 1 else 0 end) as cho,
        sum(case when trang_thai in ('that_bai', 'khong_ro') and cap_nhat_luc >= ? then 1 else 0 end) as hong,
        max(case when trang_thai = 'da_gui' then cap_nhat_luc end) as cuoi from zns_tin`).get(ms - 24 * 3600_000) as
      { cho: number | null; hong: number | null; cuoi: number | null };
    const t = this.db.query('select trang_thai from zalo_token where id = 1').get() as { trang_thai: string } | null;
    return {
      soTinZnsCho: z.cho ?? 0,
      soTinZnsHong24Gio: z.hong ?? 0,
      lanGuiZnsCuoi: z.cuoi,
      tokenZalo: t ? t.trang_thai : 'chua_co',
    };
  }
}
