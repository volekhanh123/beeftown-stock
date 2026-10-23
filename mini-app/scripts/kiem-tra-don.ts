// Kiểm tra logic đơn hàng: npm run kiem-tra (cần Node 22.6 trở lên).
import assert from "node:assert/strict";
import { docConHang, trangThaiPhan, type HamFetch } from "../src/con-hang.ts";
import {
  cacGioChon,
  cacNgayChon,
  chuanHoaSoDienThoai,
  dinhDangTien,
  kiemTraDon,
  taoNoiDungDon,
  tongTienThit,
  type CauHinhGio,
  type DongDon,
  type ThongTinNhan,
} from "../src/don.ts";

const cfg: CauHinhGio = {
  ngayBatDauNhanHang: "2026-11-13",
  khungGioNhan: [
    { tu: "10:30", den: "13:30" },
    { tu: "16:30", den: "21:00" },
  ],
  buocPhut: 30,
  soPhutChuanBi: 60,
  soNgayChoChon: 7,
};

let dat = 0;
function kiem(ten: string, fn: () => void) {
  fn();
  dat++;
  console.log(`  đạt: ${ten}`);
}

kiem("trước ngày mở bán, ngày đầu tiên là 13/11", () => {
  const ngay = cacNgayChon(new Date(2026, 9, 22, 9, 0), cfg);
  assert.equal(ngay.length, 7);
  assert.equal(ngay[0].giaTri, "2026-11-13");
  assert.equal(ngay[0].nhan, "Thứ Sáu 13/11");
  assert.equal(ngay[6].giaTri, "2026-11-19");
});

kiem("1 ngày có 17 mốc giờ: 7 mốc trưa, 10 mốc tối", () => {
  const gio = cacGioChon("2026-11-14", new Date(2026, 10, 13, 9, 0), cfg);
  assert.deepEqual(gio.slice(0, 3), ["10:30", "11:00", "11:30"]);
  assert.equal(gio[gio.length - 1], "21:00");
  assert.equal(gio.length, 7 + 10);
});

kiem("trong ngày: giờ sớm nhất là bây giờ + 60 phút", () => {
  const gio = cacGioChon("2026-11-13", new Date(2026, 10, 13, 16, 10), cfg);
  assert.equal(gio[0], "17:30");
});

kiem("sau 20:00 thì hôm nay hết giờ, ngày đầu là ngày mai", () => {
  const ngay = cacNgayChon(new Date(2026, 10, 13, 20, 30), cfg);
  assert.equal(ngay[0].giaTri, "2026-11-14");
  assert.equal(ngay[0].nhan, "Ngày mai · Thứ Bảy 14/11");
});

kiem("hôm nay còn giờ thì có nhãn Hôm nay", () => {
  const ngay = cacNgayChon(new Date(2026, 10, 16, 8, 0), cfg);
  assert.equal(ngay[0].nhan, "Hôm nay · Thứ Hai 16/11");
});

kiem("định dạng tiền kiểu Việt Nam", () => {
  assert.equal(dinhDangTien(84500), "84.500 đ");
  assert.equal(dinhDangTien(1229840), "1.229.840 đ");
});

kiem("số điện thoại", () => {
  assert.equal(chuanHoaSoDienThoai("0912 345 678"), "0912345678");
  assert.equal(chuanHoaSoDienThoai("+84 912.345.678"), "0912345678");
  assert.equal(chuanHoaSoDienThoai("84912345678"), "0912345678");
  assert.equal(chuanHoaSoDienThoai("091234567"), null);
});

const dong: DongDon[] = [
  { ten: "Ribeye with Cap", baoQuan: "mat", soKhay: 2, soGamKhay: 150, giaMoiKhay: 300000 },
  { ten: "Chadolbagi", baoQuan: "dong-lanh", soKhay: 0, soGamKhay: 150, giaMoiKhay: 115000 },
  { ten: "LA Galbi", baoQuan: "dong-lanh", soKhay: 1, soGamKhay: 150, giaMoiKhay: 150000 },
];
const nhan: ThongTinNhan = {
  cachNhan: "tai-quan",
  ngay: "2026-11-13",
  gio: "18:30",
  ten: "Anh Khánh",
  dienThoai: "0912345678",
  diaChi: "",
  cachTra: "chuyen-khoan",
  ghiChu: "",
};

kiem("tin nhắn nhận tại quán", () => {
  const tin = taoNoiDungDon(dong, nhan);
  assert.ok(tin.includes("• Ribeye with Cap (khay ~150 g): 2 × 300.000 đ = 600.000 đ"));
  assert.ok(tin.includes("• LA Galbi (đông lạnh, khay ~150 g): 1 × 150.000 đ = 150.000 đ"));
  assert.ok(!tin.includes("Chadolbagi"));
  assert.ok(tin.includes("Tổng: 3 khay · 750.000 đ tiền thịt"));
  assert.ok(!tin.includes("theo tem"));
  assert.ok(tin.includes("Nhận tại quán: 18:30, Thứ Sáu 13/11"));
  assert.ok(tin.includes("Người nhận: Anh Khánh · 0912 345 678"));
  assert.ok(tin.includes("Thanh toán: chuyển khoản sau khi quán xác nhận đơn"));
  assert.ok(tin.length < 1000);
  console.log("\n" + tin.split("\n").map((d) => "    | " + d).join("\n") + "\n");
});

kiem("tin nhắn giao tận nơi", () => {
  const tin = taoNoiDungDon(dong, {
    ...nhan,
    cachNhan: "giao-hang",
    diaChi: "12 Nguyễn Huệ, phường Sài Gòn",
    cachTra: "tra-khi-nhan",
    ghiChu: "Gọi trước 10 phút",
  });
  assert.ok(tin.includes("Giao tới: 12 Nguyễn Huệ, phường Sài Gòn"));
  assert.ok(tin.includes("Giờ nhận: khoảng 18:30, Thứ Sáu 13/11"));
  assert.ok(tin.includes("Phí giao: nhờ quán báo"));
  assert.ok(tin.includes("Thanh toán: trả khi nhận hàng"));
  assert.ok(tin.includes("Ghi chú: Gọi trước 10 phút"));
});

kiem("giá thử: tin có dòng báo giá thử, tắt cờ thì không có", () => {
  const coCo = taoNoiDungDon(dong, nhan, { giaThu: true });
  assert.ok(coCo.includes("Tổng: 3 khay · 750.000 đ tiền thịt\n(Giá trong đơn là giá thử, chưa phải giá bán.)"));
  assert.ok(!taoNoiDungDon(dong, nhan).includes("giá thử"));
  const khongGia = dong.map((d) => ({ ...d, giaMoiKhay: null }));
  assert.ok(!taoNoiDungDon(khongGia, nhan, { giaThu: true }).includes("giá thử"));
});

kiem("tổng tiền thịt = số khay × giá một khay; có phần chưa có giá thì quán báo", () => {
  assert.equal(tongTienThit(dong), 2 * 300000 + 1 * 150000);
  assert.equal(tongTienThit([]), 0);
  const thieuGia = dong.map((d) => (d.ten === "LA Galbi" ? { ...d, giaMoiKhay: null } : d));
  assert.equal(tongTienThit(thieuGia), null);
  // Phần chưa có giá mà không chọn khay nào thì không làm mất tổng.
  const khongChon = dong.map((d) => (d.ten === "Chadolbagi" ? { ...d, giaMoiKhay: null } : d));
  assert.equal(tongTienThit(khongChon), 750000);
  const tin = taoNoiDungDon(thieuGia, nhan);
  assert.ok(tin.includes("• LA Galbi (đông lạnh, khay ~150 g): 1 khay, quán báo giá"));
  assert.ok(tin.includes("Tổng: 3 khay · tiền thịt quán báo khi xác nhận"));
  // Giá 0 là giá thật, không phải "chưa có giá".
  assert.equal(tongTienThit(dong.map((d) => ({ ...d, giaMoiKhay: 0 }))), 0);
});

kiem("báo lỗi khi thiếu thông tin", () => {
  assert.deepEqual(kiemTraDon(dong, nhan), []);
  assert.equal(kiemTraDon(dong, { ...nhan, gio: "" }).length, 1);
  const loiGiao = kiemTraDon(dong, { ...nhan, cachNhan: "giao-hang", dienThoai: "" });
  assert.equal(loiGiao.length, 2);
  assert.equal(kiemTraDon([], nhan)[0], "Bạn chưa chọn khay thịt nào.");
  assert.equal(kiemTraDon(dong, { ...nhan, dienThoai: "123" }).length, 1);
});

// --- Còn hàng ở quầy (src/con-hang.ts) --------------------------------------------------------------------
const tra = (ok: boolean, json: unknown): HamFetch => async () => ({ ok, json: async () => json });
const URL_KHO = "https://beeftown.vn/mini-app/con-hang.json";
async function kiemAsync(ten: string, fn: () => Promise<void>) {
  await fn();
  dat++;
  console.log(`  đạt: ${ten}`);
}

await kiemAsync("còn hàng: đọc đúng trạng thái, bỏ dòng lạ", async () => {
  const kq = await docConHang(
    URL_KHO,
    tra(true, { phanThit: { "ribeye-with-cap": "con", "la-galbi": "het", "outside-skirt": "sap_het", Ribeye: "con", galbisal: "het_han" } }),
  );
  assert.deepEqual(kq, { "ribeye-with-cap": "con", "la-galbi": "het", "outside-skirt": "sap_het" });
});

await kiemAsync("còn hàng: hỏng thì không biết ({}), không bao giờ ra hết", async () => {
  assert.deepEqual(await docConHang("", tra(true, { phanThit: { "la-galbi": "het" } })), {});
  assert.deepEqual(await docConHang(URL_KHO, tra(false, { phanThit: { "la-galbi": "het" } })), {}); // 404, 500
  assert.deepEqual(await docConHang(URL_KHO, async () => { throw new TypeError("Failed to fetch"); }), {});
  assert.deepEqual(await docConHang(URL_KHO, async () => ({ ok: true, json: async () => { throw new SyntaxError("JSON"); } })), {});
  assert.deepEqual(await docConHang(URL_KHO, tra(true, { phanThit: ["het"] })), {});
  assert.deepEqual(await docConHang(URL_KHO, tra(true, null)), {});
  // Máy chủ treo: fetch không bao giờ trả lời, kể cả khi bị hủy.
  const batDau = Date.now();
  assert.deepEqual(await docConHang(URL_KHO, () => new Promise(() => {}), 50), {});
  // Máy chủ gửi header rồi treo thân.
  assert.deepEqual(await docConHang(URL_KHO, async () => ({ ok: true, json: () => new Promise(() => {}) }), 50), {});
  assert.ok(Date.now() - batDau < 2000);
});

kiem("phần kho báo vừa hết vẫn gửi được, tin ghi thêm cho nhân viên kiểm lại", () => {
  const tin = taoNoiDungDon(
    dong.map((d) => (d.ten === "LA Galbi" ? { ...d, vuaHet: true } : d)),
    nhan,
  );
  assert.ok(tin.includes("• LA Galbi (đông lạnh, khay ~150 g): 1 × 150.000 đ = 150.000 đ — app báo quầy vừa hết"));
  assert.ok(tin.includes("• Ribeye with Cap (khay ~150 g): 2 × 300.000 đ = 600.000 đ\n"));
});

await kiemAsync("còn hàng: tạm ngưng trong cau-hinh thắng kho; kho không biết thì coi như còn", async () => {
  assert.equal(trangThaiPhan(false, "con"), "het");
  assert.equal(trangThaiPhan(true, undefined), "con");
  assert.equal(trangThaiPhan(true, "het"), "het");
  assert.equal(trangThaiPhan(true, "sap_het"), "sap_het");
});

console.log(`Đạt ${dat}/${dat} kiểm tra.`);
