// Kiểm tra logic đơn hàng: npm run kiem-tra (cần Node 22.6 trở lên).
import assert from "node:assert/strict";
import { docConHang, trangThaiPhan, type HamFetch } from "../src/con-hang.ts";
import {
  GIU_DON_MS,
  KHOA_LUU,
  buocTraTien,
  dauNoiDung,
  docDonDaDat,
  docDonTuJson,
  docDonTuMayChu,
  gioPhutVn,
  guiDonLenMayChu,
  hoiLaiSauMs,
  kiemTraTraTruoc,
  luuDonDaDat,
  taoMaGui,
  taoThanDon,
  type HamFetchApi,
  type KhoLuu,
} from "../src/tra-truoc.ts";
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

// ---------- Trả trước qua máy chủ đơn (src/tra-truoc.ts) ----------
// Hợp đồng với máy chủ thật (đúng dạng máy chủ nhận, đúng thứ máy chủ trả) kiểm ở may-chu-don/test/thu.ts.

const MAY_CHU = "https://don.beeftown.vn";
const KHOA = "0123456789abcdef0123456789abcdef";
const nhanTra: ThongTinNhan = {
  cachNhan: "tai-quan",
  ngay: "2026-11-13",
  gio: "10:30",
  ten: " Khánh ",
  dienThoai: "0912 345 678",
  diaChi: "",
  cachTra: "chuyen-khoan",
  ghiChu: " gọi trước ",
};
const thanhToanMau = {
  traDuoc: true,
  nganHang: "VietinBank",
  soTaiKhoan: "113366668888",
  tenTaiKhoan: "CONG TY TNHH SLK GROUP",
  soTien: 750000,
  noiDung: "BTK7QX4M9A",
  chuoiQr: "00020101021238560010A0000007270126000697041501121133666688880208QRIBFTTA530370454067500005802VN62140810BTK7QX4M9A63044BA7",
  hetHanLuc: Date.UTC(2026, 10, 13, 2, 5),
};
const donMau = {
  ok: true,
  ma: "K7QX4M9A",
  soTrongNgay: 12,
  trangThai: "cho_thanh_toan",
  tongTien: 750000,
  daNhan: 0,
  ngayNhan: "2026-11-13",
  gioNhan: "10:30",
  thanhToan: thanhToanMau,
};
type CuocGoi = { url: string; method: string; body?: string };
const mayChuGia = (status: number, json: unknown, ghi: CuocGoi[] = []): HamFetchApi => async (url, init) => {
  ghi.push({ url, method: init.method, body: init.body });
  return { status, json: async () => json };
};

kiem("trả trước: thân đơn chỉ có mã phần thịt và số khay, không giá; chữ đã cắt khoảng trắng", () => {
  const than = taoThanDon("ma-gui-0123456789", { "la-galbi": 2, chadolbagi: 0 }, nhanTra);
  assert.deepEqual(than, {
    maGui: "ma-gui-0123456789",
    khay: { "la-galbi": 2 },
    cachNhan: "tai-quan",
    ngay: "2026-11-13",
    gio: "10:30",
    ten: "Khánh",
    dienThoai: "0912 345 678",
    ghiChu: "gọi trước",
  });
  assert.ok(!JSON.stringify(than).includes("gia"));
});

kiem("trả trước: mã gửi 24 ký tự chữ số, đúng dạng máy chủ nhận; nội dung đổi thì dấu đổi", () => {
  const ma = taoMaGui();
  assert.match(ma, /^[A-Za-z0-9]{24}$/);
  assert.notEqual(taoMaGui(), ma);
  assert.equal(taoMaGui(() => new Uint8Array(24)), "A".repeat(24));
  assert.equal(dauNoiDung({ "la-galbi": 2 }, nhanTra), dauNoiDung({ "la-galbi": 2 }, { ...nhanTra }));
  assert.notEqual(dauNoiDung({ "la-galbi": 2 }, nhanTra), dauNoiDung({ "la-galbi": 3 }, nhanTra));
  assert.notEqual(dauNoiDung({ "la-galbi": 2 }, nhanTra), dauNoiDung({ "la-galbi": 2 }, { ...nhanTra, gio: "11:00" }));
});

kiem("trả trước: bắt tên, số điện thoại; phần vừa hết, phần chưa giá không đặt được", () => {
  assert.deepEqual(kiemTraTraTruoc(nhanTra, [], []), []);
  const loi = kiemTraTraTruoc({ ...nhanTra, ten: " K ", dienThoai: " " }, ["LA Galbi"], ["Chadolbagi"]);
  assert.deepEqual(loi, [
    "LA Galbi vừa hết ở quầy. Bớt phần này rồi gửi lại.",
    "Chadolbagi chưa có giá, chưa đặt trả trước được.",
    "Nhập tên người nhận để quầy gọi khi bạn tới lấy.",
    "Nhập số điện thoại để quán liên hệ khi cần.",
  ]);
});

kiem("trả trước: đọc đơn của máy chủ; thiếu trường, sai kiểu thì null; thanh toán lạ thì tạm lỗi (không hiện mã)", () => {
  assert.equal(docDonTuJson(donMau)?.thanhToan.traDuoc, true);
  assert.equal(docDonTuJson({ ...donMau, daNhan: undefined })?.daNhan, 0);
  for (const hong of [
    null,
    [],
    "x",
    { ...donMau, ma: "k7qx4m9a" },
    { ...donMau, soTrongNgay: 0 },
    { ...donMau, tongTien: 1.5 },
    { ...donMau, trangThai: "da_tra" },
    { ...donMau, daNhan: -1 },
  ]) {
    assert.equal(docDonTuJson(hong), null, JSON.stringify(hong));
  }
  for (const tt of [
    { ...thanhToanMau, soTaiKhoan: "12ab" },
    { ...thanhToanMau, soTien: 0 },
    { ...thanhToanMau, noiDung: "bt k7" },
    { ...thanhToanMau, chuoiQr: "<script>" },
    { traDuoc: false, lyDo: "la" },
    null,
  ]) {
    assert.deepEqual(docDonTuJson({ ...donMau, thanhToan: tt })?.thanhToan, { traDuoc: false, lyDo: "tam_loi" });
  }
  assert.deepEqual(docDonTuJson({ ...donMau, thanhToan: { traDuoc: false, lyDo: "gia_thu" } })?.thanhToan, {
    traDuoc: false,
    lyDo: "gia_thu",
  });
});

await kiemAsync("trả trước: gửi đơn — 201 ghi xong, gửi đúng chỗ, đúng thân", async () => {
  const ghi: CuocGoi[] = [];
  const than = taoThanDon("ma-gui-0123456789", { "la-galbi": 2 }, nhanTra);
  const kq = await guiDonLenMayChu(MAY_CHU, than, mayChuGia(201, { ...donMau, khoa: KHOA }, ghi));
  assert.equal(kq.loai, "da-ghi");
  assert.equal(kq.loai === "da-ghi" && kq.khoa, KHOA);
  assert.deepEqual(ghi, [{ url: `${MAY_CHU}/api/don`, method: "POST", body: JSON.stringify(than) }]);
});

await kiemAsync("trả trước: máy chủ từ chối kèm lý do → chưa ghi, hiện đúng câu; 409 báo trùng mã gửi", async () => {
  const than = taoThanDon("ma-gui-0123456789", { "la-galbi": 2 }, nhanTra);
  for (const status of [400, 413, 429, 500]) {
    const loi = ["Giờ nhận này không còn chọn được. Chọn lại giờ nhận."];
    assert.deepEqual(await guiDonLenMayChu(MAY_CHU, than, mayChuGia(status, { ok: false, loi })), {
      loai: "chua-ghi",
      loi,
      trungMaGui: false,
    });
  }
  const kq = await guiDonLenMayChu(MAY_CHU, than, mayChuGia(409, { ok: false, loi: ["Đơn này đã gửi với nội dung khác."] }));
  assert.equal(kq.loai === "chua-ghi" && kq.trungMaGui, true);
});

await kiemAsync("trả trước: mất mạng, hết giờ, 502 của proxy, 201 mà thân lạ → không rõ (KHÔNG báo đã ghi hay chưa ghi)", async () => {
  const than = taoThanDon("ma-gui-0123456789", { "la-galbi": 2 }, nhanTra);
  const khongRo = { loai: "khong-ro" };
  assert.deepEqual(await guiDonLenMayChu(MAY_CHU, than, async () => { throw new TypeError("Failed to fetch"); }), khongRo);
  assert.deepEqual(await guiDonLenMayChu(MAY_CHU, than, () => new Promise(() => {}), 50), khongRo);
  assert.deepEqual(await guiDonLenMayChu(MAY_CHU, than, async () => ({ status: 201, json: () => new Promise(() => {}) }), 50), khongRo);
  assert.deepEqual(await guiDonLenMayChu(MAY_CHU, than, mayChuGia(502, null)), khongRo);
  assert.deepEqual(await guiDonLenMayChu(MAY_CHU, than, mayChuGia(500, { ok: false })), khongRo);
  assert.deepEqual(await guiDonLenMayChu(MAY_CHU, than, mayChuGia(201, { ...donMau })), khongRo); // thiếu khóa xem
  assert.deepEqual(await guiDonLenMayChu(MAY_CHU, than, mayChuGia(201, { ok: true })), khongRo);
  assert.deepEqual(
    await guiDonLenMayChu(MAY_CHU, than, async () => ({ status: 201, json: async () => { throw new SyntaxError("JSON"); } })),
    khongRo,
  );
});

await kiemAsync("trả trước: đọc đơn — đúng địa chỉ có khóa; 404 có lý do là không thấy; hỏng thì không rõ", async () => {
  const ghi: CuocGoi[] = [];
  const kq = await docDonTuMayChu(MAY_CHU, "K7QX4M9A", KHOA, mayChuGia(200, donMau, ghi));
  assert.equal(kq.loai === "co" && kq.don.ma, "K7QX4M9A");
  assert.deepEqual(ghi, [{ url: `${MAY_CHU}/api/don/K7QX4M9A?khoa=${KHOA}`, method: "GET", body: undefined }]);
  assert.deepEqual(await docDonTuMayChu(MAY_CHU, "K7QX4M9A", KHOA, mayChuGia(404, { ok: false, loi: ["Không thấy đơn này."] })), {
    loai: "khong-thay",
  });
  assert.deepEqual(await docDonTuMayChu(MAY_CHU, "K7QX4M9A", KHOA, mayChuGia(404, null)), { loai: "khong-ro" });
  assert.deepEqual(await docDonTuMayChu(MAY_CHU, "K7QX4M9A", KHOA, mayChuGia(429, { ok: false, loi: ["Hỏi nhiều"] })), {
    loai: "khong-ro",
  });
  assert.deepEqual(await docDonTuMayChu(MAY_CHU, "K7QX4M9A", KHOA, () => new Promise(() => {}), 50), { loai: "khong-ro" });
});

kiem("trả trước: màn theo trạng thái — chỉ 'đã nhận đủ' khi máy chủ nói đã trả; thiếu, dư, hết hạn, hủy", () => {
  const don = (them: object) => docDonTuJson({ ...donMau, ...them })!;
  assert.equal(buocTraTien(don({})).buoc, "cho-tra");
  const thieu = buocTraTien(don({ daNhan: 200000, thanhToan: { ...thanhToanMau, soTien: 550000 } }));
  assert.ok(thieu.buoc === "cho-tra" && thieu.daNhan === 200000 && thieu.thanhToan.soTien === 550000);
  assert.deepEqual(buocTraTien(don({ thanhToan: { traDuoc: false, lyDo: "gia_thu" } })), { buoc: "chua-mo-tra", lyDo: "gia_thu" });
  assert.deepEqual(buocTraTien(don({ thanhToan: { traDuoc: false, lyDo: "chua_co_tai_khoan" } })), {
    buoc: "chua-mo-tra",
    lyDo: "chua_co_tai_khoan",
  });
  // Còn chờ mà máy chủ không đưa được mã: không bao giờ hiện "đã nhận".
  assert.deepEqual(buocTraTien(don({ thanhToan: { traDuoc: false, lyDo: "tam_loi" } })), { buoc: "dang-lay-ma" });
  assert.deepEqual(buocTraTien(don({ thanhToan: { traDuoc: false, lyDo: "khong_cho_tra" } })), { buoc: "dang-lay-ma" });
  assert.deepEqual(buocTraTien(don({ trangThai: "da_thanh_toan", daNhan: 750000, thanhToan: { traDuoc: false, lyDo: "khong_cho_tra" } })), {
    buoc: "da-nhan-du",
    trangThai: "da_thanh_toan",
    thua: 0,
  });
  assert.deepEqual(buocTraTien(don({ trangThai: "cho_lay", daNhan: 770000 })), { buoc: "da-nhan-du", trangThai: "cho_lay", thua: 20000 });
  assert.deepEqual(buocTraTien(don({ trangThai: "het_han", daNhan: 200000 })), { buoc: "het-han", daNhan: 200000 });
  assert.deepEqual(buocTraTien(don({ trangThai: "can_hoan_tien" })), { buoc: "da-huy", daHoan: false });
  assert.deepEqual(buocTraTien(don({ trangThai: "da_hoan_tien" })), { buoc: "da-huy", daHoan: true });
});

kiem("trả trước: hỏi lại 4 giây khi chờ tiền, 15 giây sau đó (kể cả hết hạn: tiền về muộn vẫn tính), thôi khi đã khép", () => {
  assert.equal(hoiLaiSauMs("cho_thanh_toan"), 4000);
  assert.equal(hoiLaiSauMs("het_han"), 15000);
  assert.equal(hoiLaiSauMs("cho_lay"), 15000);
  assert.equal(hoiLaiSauMs("da_giao"), null);
  assert.equal(hoiLaiSauMs("da_hoan_tien"), null);
});

kiem("trả trước: giờ hết hạn theo giờ Việt Nam, kể cả 23:50 và 00:10 (qua ngày)", () => {
  assert.equal(gioPhutVn(Date.UTC(2026, 10, 13, 2, 5)), "09:05");
  assert.equal(gioPhutVn(Date.UTC(2026, 10, 13, 16, 50)), "23:50");
  assert.equal(gioPhutVn(Date.UTC(2026, 10, 13, 17, 10)), "00:10");
});

kiem("trả trước: đơn vừa đặt giữ trên máy 2 ngày, không tên, không số; hỏng bộ nhớ không làm hỏng app", () => {
  const bo = new Map<string, string>();
  const kho: KhoLuu = {
    getItem: (k) => bo.get(k) ?? null,
    setItem: (k, v) => void bo.set(k, v),
    removeItem: (k) => void bo.delete(k),
  };
  const luc = Date.UTC(2026, 10, 13, 2, 0);
  const don = { ma: "K7QX4M9A", khoa: KHOA, soTrongNgay: 12, luc };
  luuDonDaDat(kho, don);
  assert.deepEqual(docDonDaDat(kho, luc + 1000), don);
  assert.deepEqual(Object.keys(JSON.parse(bo.get(KHOA_LUU)!)).sort(), ["khoa", "luc", "ma", "soTrongNgay"]);
  assert.equal(docDonDaDat(kho, luc + GIU_DON_MS + 1), null);
  bo.set(KHOA_LUU, "{hỏng");
  assert.equal(docDonDaDat(kho, luc), null);
  bo.set(KHOA_LUU, JSON.stringify({ ...don, khoa: "x" }));
  assert.equal(docDonDaDat(kho, luc), null);
  const hong: KhoLuu = {
    getItem: () => {
      throw new Error("SecurityError");
    },
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
    removeItem: () => {
      throw new Error("SecurityError");
    },
  };
  luuDonDaDat(hong, don);
  assert.equal(docDonDaDat(hong, luc), null);
  assert.equal(docDonDaDat(null, luc), null);
});

console.log(`Đạt ${dat}/${dat} kiểm tra.`);
