import React, { useEffect } from "react";
import { Page, useLocation, useNavigate } from "zmp-ui";
import { ThongTinTron } from "../bieu-tuong";
import logo from "../assets/logo-chinh-trang.png";
import { useGioHang } from "../gio-hang";
import { SAN_PHAM, dongTuGio } from "../san-pham";
import { dinhDangTien, tongTienThit } from "../don";
import { BaoGiaThu, NutChat, TheThit } from "../thanh-phan";
import { TRA_TRUOC } from "../may-chu-don";
import { monTuDuong } from "../chia-se";

export default function TrangChu() {
  const navigate = useNavigate();
  const { soKhay, tongKhay, soPhan, donDaDat, danhSachDon } = useGioHang();
  const tongTien = tongTienThit(dongTuGio(soKhay));
  // Mở từ tin bạn bè chia sẻ ("/mon/<mã>"): cuộn tới đúng phần thịt đó.
  const { pathname, search } = useLocation();
  const monChon = monTuDuong(SAN_PHAM, pathname, search);
  useEffect(() => {
    if (!monChon) return;
    const hen = window.setTimeout(() => {
      document.getElementById(`mon-${monChon.ma}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
    return () => window.clearTimeout(hen);
  }, [monChon?.ma]);

  return (
    <Page className="trang trang-chu" hideScrollbar>
      <header className="dau-trang-chinh">
        <div className="hang-tren">
          <img className="logo" src={logo} alt="Beeftown. Pick it, grill it, love it!" />
          <button
            type="button"
            className="nut-thong-tin"
            aria-label="Cách mua và thông tin quán"
            onClick={() => navigate("/thong-tin")}
          >
            <ThongTinTron />
          </button>
        </div>
        <p className="tieu-de">Thịt bò mang về</p>
        <p className="dong-phu">
          {TRA_TRUOC
            ? "Chọn số khay, chuyển khoản ngay trong app, quán giao tận nơi. Giá tính theo khay, đã gồm phí giao, thấy tổng tiền trước khi trả."
            : "Chọn số khay, gửi đơn qua Zalo. Giá tính theo khay, thấy tổng tiền trước khi gửi đơn."}
        </p>
      </header>

      {TRA_TRUOC && danhSachDon.length > 0 && (
        <button type="button" className="nut-don-cua-toi" onClick={() => navigate("/don-cua-toi")}>
          Đơn của tôi ({danhSachDon.length})
        </button>
      )}

      {TRA_TRUOC && donDaDat && (
        <div className="don-vua-dat">
          <span>
            <b>Đơn #{donDaDat.soTrongNgay} của bạn</b>
            Xem trạng thái đơn
          </span>
          <button type="button" className="nut-phu" onClick={() => navigate("/tra-tien")}>
            Xem đơn
          </button>
        </div>
      )}

      <ol className="ba-buoc" aria-label="Cách mua">
        <li>
          <b>1</b>Chọn khay
        </li>
        <li>
          <b>2</b>
          {TRA_TRUOC ? "Chuyển khoản trong app" : "Gửi đơn qua Zalo"}
        </li>
        <li>
          <b>3</b>
          {TRA_TRUOC ? "Quán giao tận nơi" : "Quán xác nhận đơn"}
        </li>
      </ol>

      <BaoGiaThu />

      <section className="danh-sach" aria-label="6 phần thịt">
        {SAN_PHAM.map((sp) => (
          <TheThit key={sp.ma} sp={sp} noiBat={monChon?.ma === sp.ma} />
        ))}
      </section>

      <p className="ghi-chu-cuoi">Giá tính theo khay, không đổi theo số gam thật của từng khay.</p>
      <div className={tongKhay > 0 ? "khoang-duoi co-thanh" : "khoang-duoi"} />

      {tongKhay > 0 && (
        <div className="thanh-duoi">
          <div className="tom-tat">
            <b>{tongTien === null ? `${tongKhay} khay` : dinhDangTien(tongTien)}</b>
            <span>{tongTien === null ? `${soPhan} phần thịt` : `${tongKhay} khay · ${soPhan} phần thịt`}</span>
          </div>
          <div className="hang-nut-duoi co-tom-tat">
            <NutChat />
            <button type="button" className="nut-chinh" onClick={() => navigate("/don-hang")}>
              Xem đơn
            </button>
          </div>
        </div>
      )}
    </Page>
  );
}
