// Logic của đơn hàng: tạo danh sách ngày, giờ nhận, kiểm tra thông tin, soạn tin nhắn gửi OA.
// File này không dùng React hay Zalo để chạy kiểm tra được bằng node (npm run kiem-tra).

export type BaoQuan = "mat" | "dong-lanh";
export type CachNhan = "tai-quan" | "giao-hang";
export type CachTra = "chuyen-khoan" | "tra-khi-nhan";

export interface DongDon {
  ten: string;
  baoQuan: BaoQuan;
  soKhay: number;
  /** Số gam khoảng của 1 khay. Giá không đổi theo số gam thật. */
  soGamKhay: number;
  /** Giá cố định của 1 khay; null = quán báo giá khi xác nhận đơn. */
  giaMoiKhay: number | null;
  /** Kho báo phần này vừa hết ở quầy (khách đã chọn trước đó): tin ghi thêm để nhân viên kiểm lại. */
  vuaHet?: boolean;
}

export interface ThongTinNhan {
  cachNhan: CachNhan;
  /** yyyy-mm-dd */
  ngay: string;
  /** HH:mm */
  gio: string;
  ten: string;
  dienThoai: string;
  diaChi: string;
  cachTra: CachTra;
  ghiChu: string;
}

export interface KhungGio {
  tu: string;
  den: string;
}

export interface CauHinhGio {
  /** Ngày đầu tiên quán nhận hàng, yyyy-mm-dd */
  ngayBatDauNhanHang: string;
  khungGioNhan: KhungGio[];
  buocPhut: number;
  /** Giờ nhận sớm nhất = bây giờ + số phút này */
  soPhutChuanBi: number;
  soNgayChoChon: number;
}

export interface LuaChon {
  giaTri: string;
  nhan: string;
}

const THU = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

function hai(n: number): string {
  return String(n).padStart(2, "0");
}

export function ngaySangChuoi(d: Date): string {
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`;
}

export function chuoiSangNgay(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function phut(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function gioTuPhut(p: number): string {
  return `${hai(Math.floor(p / 60))}:${hai(p % 60)}`;
}

/** "Thứ Sáu 13/11" */
export function ngayDayDu(s: string): string {
  const d = chuoiSangNgay(s);
  return `${THU[d.getDay()]} ${hai(d.getDate())}/${hai(d.getMonth() + 1)}`;
}

/** Nhãn trong ô chọn ngày: "Hôm nay · Thứ Năm 22/10", "Ngày mai · Thứ Sáu 23/10", "Thứ Bảy 24/10" */
export function nhanNgay(s: string, homNay: string): string {
  const mai = chuoiSangNgay(homNay);
  mai.setDate(mai.getDate() + 1);
  if (s === homNay) return `Hôm nay · ${ngayDayDu(s)}`;
  if (s === ngaySangChuoi(mai)) return `Ngày mai · ${ngayDayDu(s)}`;
  return ngayDayDu(s);
}

export function cacGioChon(ngay: string, now: Date, cfg: CauHinhGio): string[] {
  const homNay = ngaySangChuoi(now);
  if (ngay < homNay || ngay < cfg.ngayBatDauNhanHang) return [];
  const somNhat =
    ngay === homNay ? now.getHours() * 60 + now.getMinutes() + cfg.soPhutChuanBi : -1;
  const ketQua: string[] = [];
  for (const k of cfg.khungGioNhan) {
    for (let p = phut(k.tu); p <= phut(k.den); p += cfg.buocPhut) {
      if (p >= somNhat) ketQua.push(gioTuPhut(p));
    }
  }
  return ketQua;
}

export function cacNgayChon(now: Date, cfg: CauHinhGio): LuaChon[] {
  const homNay = ngaySangChuoi(now);
  const batDau = homNay > cfg.ngayBatDauNhanHang ? homNay : cfg.ngayBatDauNhanHang;
  const d = chuoiSangNgay(batDau);
  const ketQua: LuaChon[] = [];
  for (let i = 0; i <= cfg.soNgayChoChon && ketQua.length < cfg.soNgayChoChon; i++) {
    const s = ngaySangChuoi(d);
    if (cacGioChon(s, now, cfg).length > 0) ketQua.push({ giaTri: s, nhan: nhanNgay(s, homNay) });
    d.setDate(d.getDate() + 1);
  }
  return ketQua;
}

/** 84500 → "84.500 đ" — như repo (giá ghi dạng 000.000 đ, `web/src/lib/kho/chung.ts`). */
export function dinhDangTien(n: number): string {
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} đ`;
}

/** Trả về số dạng 0xxxxxxxxx, hoặc null nếu không phải số di động/cố định 10 số của Việt Nam. */
export function chuanHoaSoDienThoai(s: string): string | null {
  let so = s.replace(/[\s.\-()]/g, "");
  if (so.startsWith("+84")) so = `0${so.slice(3)}`;
  else if (so.startsWith("84") && so.length === 11) so = `0${so.slice(2)}`;
  return /^0\d{9}$/.test(so) ? so : null;
}

/** "0912345678" → "0912 345 678" */
export function hienSoDienThoai(so: string): string {
  return `${so.slice(0, 4)} ${so.slice(4, 7)} ${so.slice(7)}`;
}

export function tongSoKhay(dong: DongDon[]): number {
  return dong.reduce((t, d) => t + d.soKhay, 0);
}

/** Tổng tiền thịt (chưa gồm phí giao). null khi có phần đã chọn chưa có giá: quán báo khi xác nhận đơn. */
export function tongTienThit(dong: DongDon[]): number | null {
  const coKhay = dong.filter((d) => d.soKhay > 0);
  if (coKhay.some((d) => d.giaMoiKhay === null)) return null;
  return coKhay.reduce((t, d) => t + d.soKhay * (d.giaMoiKhay ?? 0), 0);
}

/** Trả về danh sách lỗi; rỗng là đủ thông tin để gửi. */
export function kiemTraDon(dong: DongDon[], nhan: ThongTinNhan): string[] {
  const loi: string[] = [];
  if (tongSoKhay(dong) === 0) loi.push("Bạn chưa chọn khay thịt nào.");
  if (!nhan.ngay || !nhan.gio) loi.push("Chọn ngày và giờ nhận hàng.");
  if (nhan.cachNhan === "giao-hang" && nhan.diaChi.trim().length < 8) {
    loi.push("Nhập địa chỉ giao hàng (số nhà, đường, phường).");
  }
  const coSo = nhan.dienThoai.trim().length > 0;
  if (coSo && !chuanHoaSoDienThoai(nhan.dienThoai)) {
    loi.push("Số điện thoại chưa đúng: cần 10 số, bắt đầu bằng 0.");
  } else if (nhan.cachNhan === "giao-hang" && !coSo) {
    loi.push("Nhập số điện thoại để tài xế gọi khi giao.");
  }
  return loi;
}

export interface TuyChonTin {
  /** Giá trong app là giá thử: thêm 1 dòng vào tin để nhân viên không tính theo giá này. */
  giaThu?: boolean;
}

/** Nội dung tin nhắn điền sẵn vào chat với OA. Khách xem lại và tự bấm gửi. */
export function taoNoiDungDon(dong: DongDon[], nhan: ThongTinNhan, tuyChon: TuyChonTin = {}): string {
  const coKhay = dong.filter((d) => d.soKhay > 0);
  const dongTin: string[] = ["ĐẶT THỊT MANG VỀ – BEEFTOWN"];
  for (const d of coKhay) {
    const khay = d.baoQuan === "dong-lanh" ? `đông lạnh, khay ~${d.soGamKhay} g` : `khay ~${d.soGamKhay} g`;
    const tien =
      d.giaMoiKhay === null
        ? `${d.soKhay} khay, quán báo giá`
        : `${d.soKhay} × ${dinhDangTien(d.giaMoiKhay)} = ${dinhDangTien(d.soKhay * d.giaMoiKhay)}`;
    dongTin.push(`• ${d.ten} (${khay}): ${tien}${d.vuaHet ? " — app báo quầy vừa hết" : ""}`);
  }
  const tong = tongTienThit(coKhay);
  dongTin.push(
    `Tổng: ${tongSoKhay(coKhay)} khay · ${tong === null ? "tiền thịt quán báo khi xác nhận" : `${dinhDangTien(tong)} tiền thịt`}`,
  );
  if (tuyChon.giaThu && coKhay.some((d) => d.giaMoiKhay !== null)) {
    dongTin.push("(Giá trong đơn là giá thử, chưa phải giá bán.)");
  }
  dongTin.push("");

  const luc = `${nhan.gio}, ${ngayDayDu(nhan.ngay)}`;
  if (nhan.cachNhan === "tai-quan") {
    dongTin.push(`Nhận tại quán: ${luc}`);
  } else {
    dongTin.push(`Giao tới: ${nhan.diaChi.trim()}`);
    dongTin.push(`Giờ nhận: khoảng ${luc}`);
    dongTin.push("Phí giao: nhờ quán báo");
  }

  const so = chuanHoaSoDienThoai(nhan.dienThoai);
  const nguoiNhan = [nhan.ten.trim(), so ? hienSoDienThoai(so) : ""].filter(Boolean).join(" · ");
  if (nguoiNhan) dongTin.push(`Người nhận: ${nguoiNhan}`);
  dongTin.push(
    `Thanh toán: ${
      nhan.cachTra === "chuyen-khoan" ? "chuyển khoản sau khi quán xác nhận đơn" : "trả khi nhận hàng"
    }`,
  );
  if (nhan.ghiChu.trim()) dongTin.push(`Ghi chú: ${nhan.ghiChu.trim()}`);
  dongTin.push("", "Nhờ quán soạn khay và xác nhận đơn giúp mình.");
  return dongTin.join("\n");
}
