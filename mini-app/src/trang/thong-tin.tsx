import React from "react";
import { Page } from "zmp-ui";
import dauBo from "../assets/dau-bo-do.png";
import { CAU_HINH } from "../cau-hinh";
import { SAN_PHAM } from "../san-pham";
import { DauTrang, Muc } from "../thanh-phan";
import { useThongBao } from "../thong-bao";
import { moChatVoiQuan } from "../zalo";

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
        <ol className="ds-buoc">
          <li>
            <b>Chọn số khay</b> của từng phần thịt. Khay đã chia sẵn ở quầy, mỗi khay một trọng lượng.
          </li>
          <li>
            <b>Gửi đơn qua Zalo.</b> App mở chat với Beeftown, đơn điền sẵn; bạn bấm Gửi.
          </li>
          <li>
            <b>Quán soạn khay</b> và báo số gam, số tiền in trên tem của từng khay. Bạn đồng ý thì quán giữ hàng.
          </li>
          <li>
            <b>Trả tiền và nhận hàng:</b> chuyển khoản theo mã QR quán gửi, hoặc trả khi nhận.
          </li>
        </ol>
      </Muc>

      <Muc tieuDe="Cách tính tiền">
        <p>
          Giá niêm yết theo 100 g. Tiền của mỗi khay = trọng lượng thật × giá/100 g, in sẵn trên tem cùng tên phần thịt
          và ngày đóng gói. Đơn giao tận nơi cộng phí giao, quán báo khi xác nhận.
          {CAU_HINH.giaThu && " Giá trong app hiện là giá thử, chưa phải giá bán của quán."}
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
        <p>
          Mini App không lưu tên, số điện thoại, địa chỉ của bạn và không gửi chúng về máy chủ nào. Những gì bạn nhập chỉ
          được điền sẵn vào tin nhắn gửi Beeftown trong Zalo; bạn xem lại và tự bấm Gửi. Tin nhắn đã gửi nằm trong cuộc
          chat của bạn với Beeftown trên Zalo.
        </p>
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
