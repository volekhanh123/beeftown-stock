import React from "react";
import { Page, useNavigate } from "zmp-ui";
import { KhungChat } from "../bieu-tuong";
import { CAU_HINH } from "../cau-hinh";
import { useGioHang } from "../gio-hang";
import { DauTrang } from "../thanh-phan";
import { useThongBao } from "../thong-bao";
import { moChatVoiQuan, quanTamQuan } from "../zalo";

export default function DaGui() {
  const navigate = useNavigate();
  const thongBao = useThongBao();
  const { noiDungDaGui, lamMoi } = useGioHang();

  async function moLai() {
    const ketQua = await moChatVoiQuan(noiDungDaGui || undefined);
    if (ketQua !== "da-mo") thongBao("Chưa mở được khung chat Zalo.");
  }

  async function quanTam() {
    const daQuanTam = await quanTamQuan();
    if (daQuanTam) thongBao("Cảm ơn bạn đã quan tâm Beeftown.", "success");
  }

  return (
    <Page className="trang da-gui">
      <DauTrang tieuDe="Gửi đơn" quayLai={false} />
      <div className="noi-dung-giua">
        <span className="dau-tick" aria-hidden="true">
          <KhungChat />
        </span>
        <h2>Bấm Gửi trong khung chat</h2>
        <p>
          Đơn đã được điền sẵn trong chat với Beeftown. Bạn bấm Gửi thì quán mới nhận được đơn, rồi quán soạn khay và xác
          nhận đơn.
        </p>
        <p className="ghi-chu">Quán trả lời trong giờ mở cửa: {CAU_HINH.gioMoCua}.</p>
        <div className="cot-nut">
          <button type="button" className="nut-chinh rong" onClick={moLai}>
            Mở lại chat với Beeftown
          </button>
          <button type="button" className="nut-phu rong" onClick={quanTam}>
            Quan tâm Beeftown trên Zalo
          </button>
          <button
            type="button"
            className="nut-chu"
            onClick={() => {
              lamMoi();
              navigate("/", { replace: true });
            }}
          >
            Làm đơn mới
          </button>
        </div>
      </div>
    </Page>
  );
}
