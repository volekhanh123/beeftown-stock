import React from "react";
import { AnimationRoutes, App, Route, ZMPRouter } from "zmp-ui";
import { ThongBaoProvider } from "./thong-bao";
import { GioHangProvider } from "./gio-hang";
import { ConHangProvider } from "./con-hang-kho";
import TrangChu from "./trang/trang-chu";
import DonHang from "./trang/don-hang";
import DaGui from "./trang/da-gui";
import TraTien from "./trang/tra-tien";
import DonCuaToi from "./trang/don-cua-toi";
import ThongTin from "./trang/thong-tin";

export default function UngDung() {
  return (
    <App>
      <ThongBaoProvider>
        <GioHangProvider>
          <ConHangProvider>
            <ZMPRouter>
              <AnimationRoutes>
                <Route path="/" element={<TrangChu />} />
                <Route path="/mon/:ma" element={<TrangChu />} />
                <Route path="/don-hang" element={<DonHang />} />
                <Route path="/da-gui" element={<DaGui />} />
                <Route path="/tra-tien" element={<TraTien />} />
                <Route path="/don-cua-toi" element={<DonCuaToi />} />
                <Route path="/thong-tin" element={<ThongTin />} />
              </AnimationRoutes>
            </ZMPRouter>
          </ConHangProvider>
        </GioHangProvider>
      </ThongBaoProvider>
    </App>
  );
}
