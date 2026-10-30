import React from "react";
import { Page } from "zmp-ui";
import dauBo from "../assets/dau-bo-do.png";
import { CAU_HINH } from "../cau-hinh";
import { SAN_PHAM } from "../san-pham";
import { DauTrang, Muc } from "../thanh-phan";
import { useThongBao } from "../thong-bao";
import { moChatVoiQuan } from "../zalo";
import { TRA_TRUOC } from "../may-chu-don";

export default function ThongTin() {
  const thongBao = useThongBao();
  const dongLanh = SAN_PHAM.filter((sp) => sp.baoQuan === "dong-lanh").map((sp) => sp.ten);
  const mat = SAN_PHAM.filter((sp) => sp.baoQuan === "mat").map((sp) => sp.ten);
  const p = CAU_HINH.phapNhan;

  async function chat() {
    const ketQua = await moChatVoiQuan();
    if (ketQua !== "da-mo") thongBao("Chưa mở được khung chat Zalo.");
  }

  return (
    <Page className="trang thong-tin" hideScrollbar>
      <DauTrang tieuDe="Thông tin" />

      <Muc tieuDe="Cách mua">
        {TRA_TRUOC ? (
          <ol className="ds-buoc">
            <li>
              <b>Chọn số khay</b> của từng phần thịt. Khay đã chia sẵn ở quầy; số gam khoảng và giá của một khay ghi ở
              từng phần thịt.
            </li>
            <li>
              <b>Gửi đơn và chuyển khoản trong app.</b> App hiện mã QR đúng số tiền; quán nhận đủ tiền thì quầy soạn
              khay.
            </li>
            <li>
              <b>Ghé quán lấy khay</b> theo giờ bạn chọn. Quầy gọi tên người nhận.
            </li>
          </ol>
        ) : (
          <ol className="ds-buoc">
            <li>
              <b>Chọn số khay</b> của từng phần thịt. Khay đã chia sẵn ở quầy; số gam khoảng và giá của một khay ghi ở
              từng phần thịt.
            </li>
            <li>
              <b>Gửi đơn qua Zalo.</b> App mở chat với Beeftown, đơn điền sẵn; bạn bấm Gửi.
            </li>
            <li>
              <b>Quán soạn khay</b> và xác nhận đơn cùng tổng tiền. Bạn đồng ý thì quán giữ hàng.
            </li>
            <li>
              <b>Trả tiền và nhận hàng:</b> chuyển khoản theo mã QR quán gửi, hoặc trả khi nhận.
            </li>
          </ol>
        )}
      </Muc>

      <Muc tieuDe="Cách tính tiền">
        <p>
          Giá tính theo khay, không đổi theo số gam thật của từng khay. Tiền thịt = số khay × giá một khay; app tính sẵn
          tổng trong đơn.
          {TRA_TRUOC
            ? " Đơn trả trước trong app hiện chỉ nhận tại quán."
            : " Đơn giao tận nơi cộng phí giao, quán báo khi xác nhận."}
          {CAU_HINH.giaThu && " Giá và số gam trong app hiện là số thử, chưa phải giá bán của quán."}
        </p>
      </Muc>

      <Muc tieuDe="Thịt mát và thịt đông lạnh">
        <p>
          {dongLanh.join(" và ")} là thịt đông lạnh. {mat.join(", ")} là thịt mát.
        </p>
      </Muc>

      <Muc tieuDe="Nhận hàng tại quán">
        <p>
          <b>{CAU_HINH.diaChi}</b>
          <br />
          {CAU_HINH.chiDuong}
          <br />
          Giờ mở cửa: {CAU_HINH.gioMoCua}.
        </p>
      </Muc>

      <Muc tieuDe="Liên hệ">
        <div className="cot-nut">
          <button type="button" className="nut-chinh rong" onClick={chat}>
            Chat với Beeftown
          </button>
          {CAU_HINH.hotline && (
            <a className="nut-phu rong" href={`tel:${CAU_HINH.hotline.replace(/\s/g, "")}`}>
              Gọi {CAU_HINH.hotline}
            </a>
          )}
        </div>
        <p className="ghi-chu">Website: {CAU_HINH.website}</p>
      </Muc>

      <Muc tieuDe="Thông tin của bạn">
        {TRA_TRUOC ? (
          <p>
            Khi đặt trong app, tên, số điện thoại và đơn của bạn được gửi tới máy chủ đơn của Beeftown đặt tại Việt Nam,
            để quầy soạn và giao đúng đơn. Tiền chuyển khoản vào thẳng tài khoản của {p.ten}; máy chủ chỉ ghi số tiền và
            mã giao dịch, không lưu tên hay số tài khoản ngân hàng của bạn.
          </p>
        ) : (
          <p>
            Mini App không lưu tên, số điện thoại, địa chỉ của bạn và không gửi chúng về máy chủ nào. Những gì bạn nhập
            chỉ được điền sẵn vào tin nhắn gửi Beeftown trong Zalo; bạn xem lại và tự bấm Gửi. Tin nhắn đã gửi nằm trong
            cuộc chat của bạn với Beeftown trên Zalo.
          </p>
        )}
      </Muc>

      <Muc tieuDe="Đơn vị bán hàng">
        <p className="phap-nhan">
          {p.diaDiemKinhDoanh}
          <br />
          Địa chỉ: {p.diaChiDiaDiem}
          <br />
          Doanh nghiệp: {p.ten} · Mã số doanh nghiệp {p.maSoDoanhNghiep}
        </p>
      </Muc>

      <div className="chan-trang">
        <img src={dauBo} alt="" width={40} height={38} />
        <span>Pick it, grill it, love it!</span>
      </div>
    </Page>
  );
}
