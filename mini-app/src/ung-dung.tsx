import React from "react";
import { AnimationRoutes, App, Route, ZMPRouter } from "zmp-ui";
import { ThongBaoProvider } from "./thong-bao";
import { GioHangProvider } from "./gio-hang";
import TrangChu from "./trang/trang-chu";
import DonHang from "./trang/don-hang";
import DaGui from "./trang/da-gui";
import ThongTin from "./trang/thong-tin";

export default function UngDung() {
  return (
    <App>
      <ThongBaoProvider>
        <GioHangProvider>
          <ZMPRouter>
            <AnimationRoutes>
              <Route path="/" element={<TrangChu />} />
              <Route path="/don-hang" element={<DonHang />} />
              <Route path="/da-gui" element={<DaGui />} />
              <Route path="/thong-tin" element={<ThongTin />} />
            </AnimationRoutes>
          </ZMPRouter>
        </GioHangProvider>
      </ThongBaoProvider>
    </App>
  );
}
