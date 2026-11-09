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
 */
import { Database } from 'bun:sqlite';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { congNgay, homNayVn } from '../../web/src/lib/gio-vn.ts';
import type { TinTienVe } from './sepay.ts';
import type { LoaiTin } from './zns.ts';
import type { DonMoi, DongMoi } from './tao-don.ts';
import { CON_VIEC, duocBam, laTrangThai, type TrangThai } from './trang-thai.ts';

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

export interface TienVeCanXem {
  idSepay: number;
  maDon: string | null;
  soTrongNgay: number | null;
  soTien: number;
  /** Tổng tiền đơn (khi khớp đơn) — để quầy thấy thiếu / dư bao nhiêu. */
  tongTienDon: number | null;
  tongDaNhan: number | null;
  ngayGiaoDich: string;
  maThamChieu: string;
  ketQua: KetQuaTienVe;
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
        if (this.daThanhToanTrongGiaoDich(maDon, 'sepay', ms) === 'da_doi') this.xepTinZns(maDon, 'da_nhan', ms);
        // Đơn vừa đủ tiền: các lần "thiếu" trước của đơn này không còn phải xem.
        this.db.query("update giao_dich set can_xem = 0 where ma_don = ? and ket_qua = 'thieu'").run(maDon);
      }
      return { moi: true, ketQua, maDon };
    }).immediate();
  }

  /** Tiền đã về của mọi đơn có tiền — một câu cho cả màn quầy (tự tải lại 20 giây một lần). */
  tienDaNhanTheoDon(): Map<string, number> {
    return new Map((this.db.query(`select ma_don as m, sum(so_tien) as n from giao_dich where ma_don is not null
      and ket_qua in ('du', 'thieu', 'thua') group by ma_don`).all() as { m: string; n: number }[]).map(r => [r.m, r.n]));
  }

  /** Tổng tiền đã về cho một đơn (mọi lần khớp đơn). */
  tienDaNhan(ma: string): number {
    return (this.db.query(`select coalesce(sum(so_tien), 0) as n from giao_dich where ma_don = ?
      and ket_qua in ('du', 'thieu', 'thua')`).get(ma) as { n: number }).n;
  }

  /** Tiền về quầy / kế toán phải xem (thiếu, dư, không khớp đơn) mà chưa ai bấm "Đã xử lý". */
  tienVeCanXem(): TienVeCanXem[] {
    const hang = this.db.query(`select g.*, d.so_trong_ngay, d.tong_tien from giao_dich g left join don d on d.ma = g.ma_don
      where g.can_xem = 1 and g.xem_xong_luc is null order by g.nhan_luc`).all() as DongDb[];
    const daNhan = this.tienDaNhanTheoDon();
    return hang.map(h => ({
      idSepay: Number(h.id_sepay), maDon: h.ma_don === null ? null : String(h.ma_don),
      soTrongNgay: h.so_trong_ngay === null ? null : Number(h.so_trong_ngay), soTien: Number(h.so_tien),
      tongTienDon: h.tong_tien === null ? null : Number(h.tong_tien),
      tongDaNhan: h.ma_don === null ? null : daNhan.get(String(h.ma_don)) ?? 0,
      ngayGiaoDich: String(h.ngay_giao_dich), maThamChieu: String(h.ma_tham_chieu), ketQua: String(h.ket_qua) as KetQuaTienVe,
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
    const ma = [...viec, ...xong].map(h => String(h.ma));
    const dongTheoDon = new Map<string, DongDb[]>(ma.map(m => [m, []]));
    if (ma.length) {
      const tat = this.db.query(`select * from don_dong where ma_don in (${ma.map(() => '?').join(', ')}) order by ma_don, thu_tu`)
        .all(...ma) as DongDb[];
      for (const d of tat) dongTheoDon.get(String(d.ma_don))!.push(d);
    }
    const doc = (h: DongDb) => this.docDon(h, dongTheoDon.get(String(h.ma)))!;
    return { conViec: viec.map(doc), xongHomNay: xong.map(doc) };
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

  /** Số liệu cho đèn sức khỏe — chỉ số đếm và mốc giờ, không tên, không số điện thoại. */
  soLieu(ms: number) {
    const soTheoTrangThai = new Map((this.db.query('select trang_thai as t, count(*) as n from don group by trang_thai').all() as
      { t: string; n: number }[]).map(r => [r.t, r.n]));
    const dem = (tt: TrangThai) => soTheoTrangThai.get(tt) ?? 0;
    const cuNhat = this.db.query(`select min(cap_nhat_luc) as luc from don where trang_thai = 'da_thanh_toan'`)
      .get() as { luc: number | null };
    const cuoi = this.db.query('select max(luc) as luc from nhat_ky').get() as { luc: number | null };
    const tienVe = this.db.query(`select max(nhan_luc) as luc, sum(case when can_xem = 1 and xem_xong_luc is null then 1 else 0 end) as can
      from giao_dich`).get() as { luc: number | null; can: number | null };
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
    };
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
