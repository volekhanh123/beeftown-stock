// Kiểm tra logic đơn hàng: npm run kiem-tra (cần Node 22.6 trở lên).
import assert from "node:assert/strict";
import {
  cacGioChon,
  cacNgayChon,
  chuanHoaSoDienThoai,
  dinhDangTien,
  kiemTraDon,
  taoNoiDungDon,
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
  { ten: "Ribeye with Cap", baoQuan: "mat", soKhay: 2, giaMoi100g: 84500 },
  { ten: "Chadolbagi", baoQuan: "dong-lanh", soKhay: 0, giaMoi100g: null },
  { ten: "LA Galbi", baoQuan: "dong-lanh", soKhay: 1, giaMoi100g: null },
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
  assert.ok(tin.includes("• Ribeye with Cap: 2 khay · 84.500 đ/100 g"));
  assert.ok(tin.includes("• LA Galbi (đông lạnh): 1 khay"));
  assert.ok(!tin.includes("Chadolbagi"));
  assert.ok(tin.includes("Tổng: 3 khay"));
  assert.ok(tin.includes("Nhận tại quán: 18:30, Thứ Sáu 13/11"));
  assert.ok(tin.includes("Người nhận: Anh Khánh · 0912 345 678"));
  assert.ok(tin.includes("Thanh toán: chuyển khoản sau khi quán báo tiền"));
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
  assert.ok(coCo.includes("Tổng: 3 khay\n(Giá trong đơn là giá thử, chưa phải giá bán.)"));
  assert.ok(!taoNoiDungDon(dong, nhan).includes("giá thử"));
  const khongGia = dong.map((d) => ({ ...d, giaMoi100g: null }));
  assert.ok(!taoNoiDungDon(khongGia, nhan, { giaThu: true }).includes("giá thử"));
});

kiem("báo lỗi khi thiếu thông tin", () => {
  assert.deepEqual(kiemTraDon(dong, nhan), []);
  assert.equal(kiemTraDon(dong, { ...nhan, gio: "" }).length, 1);
  const loiGiao = kiemTraDon(dong, { ...nhan, cachNhan: "giao-hang", dienThoai: "" });
  assert.equal(loiGiao.length, 2);
  assert.equal(kiemTraDon([], nhan)[0], "Bạn chưa chọn khay thịt nào.");
  assert.equal(kiemTraDon(dong, { ...nhan, dienThoai: "123" }).length, 1);
});

console.log(`Đạt ${dat}/${dat} kiểm tra.`);
