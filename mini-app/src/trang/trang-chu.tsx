import React from "react";
import { Page, useNavigate } from "zmp-ui";
import { ThongTinTron } from "../bieu-tuong";
import logo from "../assets/logo-chinh-trang.png";
import { useGioHang } from "../gio-hang";
import { SAN_PHAM } from "../san-pham";
import { BaoGiaThu, TheThit } from "../thanh-phan";

export default function TrangChu() {
  const navigate = useNavigate();
  const { tongKhay, soPhan } = useGioHang();

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
        <p className="dong-phu">Chọn số khay, gửi đơn qua Zalo. Quán soạn khay và báo tiền theo tem trước khi bạn trả.</p>
      </header>

      <ol className="ba-buoc" aria-label="Cách mua">
        <li>
          <b>1</b>Chọn khay
        </li>
        <li>
          <b>2</b>Gửi đơn qua Zalo
        </li>
        <li>
          <b>3</b>Quán báo tiền theo tem
        </li>
      </ol>

      <BaoGiaThu />

      <section className="danh-sach" aria-label="6 phần thịt">
        {SAN_PHAM.map((sp) => (
          <TheThit key={sp.ma} sp={sp} />
        ))}
      </section>

      <p className="ghi-chu-cuoi">
        Mỗi khay một trọng lượng. Số gam và tiền in trên tem của từng khay; quán báo cho bạn trước khi bạn trả tiền.
      </p>
      <div className={tongKhay > 0 ? "khoang-duoi co-thanh" : "khoang-duoi"} />

      {tongKhay > 0 && (
        <div className="thanh-duoi">
          <div className="tom-tat">
            <b>{tongKhay} khay</b>
            <span>{soPhan} phần thịt</span>
          </div>
          <button type="button" className="nut-chinh" onClick={() => navigate("/don-hang")}>
            Xem đơn
          </button>
        </div>
      )}
    </Page>
  );
}
