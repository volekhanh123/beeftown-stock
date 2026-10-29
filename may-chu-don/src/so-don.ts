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
 */
import { Database } from 'bun:sqlite';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { congNgay, homNayVn } from '../../web/src/lib/gio-vn.ts';
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
  cachNhan: 'tai-quan';
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
`;

type DongDb = Record<string, string | number>;

export class SoDon {
  readonly db: Database;

  /** `duongDan` ":memory:" cho kiểm thử. File thật: WAL, khóa ngoại bật. */
  constructor(duongDan: string) {
    this.db = new Database(duongDan, { create: true, strict: true });
    this.db.exec('pragma journal_mode = wal; pragma foreign_keys = on; pragma busy_timeout = 5000;');
    this.db.exec(LUOC_DO);
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
      trangThai, cachNhan: 'tai-quan', ngayNhan: String(h.ngay_nhan), gioNhan: String(h.gio_nhan),
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
          ngay_nhan, gio_nhan, ten, dien_thoai, ghi_chu, tong_tien, gia_thu, tao_luc, cap_nhat_luc)
        values (?, ?, ?, ?, ?, ?, 'cho_thanh_toan', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(ma, randomBytes(16).toString('hex'), don.maGui, don.dauNoiDung, so, ngayTao, don.cachNhan, don.ngayNhan,
          don.gioNhan, don.ten, don.dienThoai, don.ghiChu, don.tongTien, don.giaThu ? 1 : 0, ms, ms);
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

  /** Đổi một bước, chỉ khi đơn đang ở `tu`. `ai`: "quay", "may" (bước của máy), "zalo" (báo thanh toán). */
  private doi(ma: string, tu: TrangThai, den: TrangThai, ai: string, ms: number): KetQuaDoi {
    return this.db.transaction((): KetQuaDoi => {
      const r = this.db.query('update don set trang_thai = ?, cap_nhat_luc = ? where ma = ? and trang_thai = ?')
        .run(den, ms, ma, tu);
      if (r.changes === 1) { this.ghiNhatKy(ma, tu, den, ai, ms); return 'da_doi'; }
      const hienTai = this.db.query('select trang_thai from don where ma = ?').get(ma) as { trang_thai: string } | null;
      if (!hienTai) return 'khong_co';
      return hienTai.trang_thai === den ? 'da_o_buoc_moi' : 'lech';
    }).immediate();
  }

  /** Bước quầy bấm trên màn hình — chỉ các bước trong BUOC_QUAY. */
  doiTrangThai(ma: string, tu: TrangThai, den: TrangThai, ms: number): KetQuaDoi {
    if (!duocBam(tu, den)) return 'khong_duoc';
    return this.doi(ma, tu, den, 'quay', ms);
  }

  /**
   * Zalo báo khách đã trả đủ tiền (đợt 2 gọi từ đường nhận báo thanh toán, sau khi đã kiểm chữ ký và số tiền).
   * Đơn đã hết hạn mà tiền vẫn về: giữ "đã trả tiền" để quầy soạn hay hoàn tiền — tiền khách không bị bỏ quên.
   */
  ghiDaThanhToan(ma: string, ms: number): KetQuaDoi {
    let ra = this.doi(ma, 'cho_thanh_toan', 'da_thanh_toan', 'zalo', ms);
    if (ra === 'lech') ra = this.doi(ma, 'het_han', 'da_thanh_toan', 'zalo', ms);
    // Zalo gửi lại báo thanh toán khi quầy đã soạn, đã giao hay đã hủy: tiền đã ghi nhận từ lần trước.
    return ra === 'lech' ? 'da_o_buoc_moi' : ra;
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

  /** Số liệu cho đèn sức khỏe — chỉ số đếm và mốc giờ, không tên, không số điện thoại. */
  soLieu(ms: number) {
    const soTheoTrangThai = new Map((this.db.query('select trang_thai as t, count(*) as n from don group by trang_thai').all() as
      { t: string; n: number }[]).map(r => [r.t, r.n]));
    const dem = (tt: TrangThai) => soTheoTrangThai.get(tt) ?? 0;
    const cuNhat = this.db.query(`select min(cap_nhat_luc) as luc from don where trang_thai = 'da_thanh_toan'`)
      .get() as { luc: number | null };
    const cuoi = this.db.query('select max(luc) as luc from nhat_ky').get() as { luc: number | null };
    return {
      soChoSoan: dem('da_thanh_toan'),
      soDangSoan: dem('dang_soan'),
      soChoLay: dem('cho_lay'),
      soCanHoanTien: dem('can_hoan_tien'),
      phutChoSoanLauNhat: cuNhat.luc === null ? null : Math.floor((ms - cuNhat.luc) / 60_000),
      soDonHomNay: (this.db.query('select count(*) as n from don where ngay_tao = ?').get(homNayVn(ms)) as { n: number }).n,
      lanGhiCuoi: cuoi.luc,
    };
  }
}
