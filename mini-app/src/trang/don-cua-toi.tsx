// "Đơn của tôi": các đơn trả trước đã đặt trên máy này (Khánh chọn 09/11/2026, ý từ mẫu zaui-fashion; mã viết mới).
// Danh sách nằm trên máy (tra-truoc.ts, docDanhSachDon); trạng thái từng đơn hỏi lại máy chủ mỗi lần mở màn.
// Máy chủ báo không có đơn: bỏ khỏi danh sách. Mất mạng: ghi "chưa xem được trạng thái", không đoán.

import React, { useEffect, useRef, useState } from "react";
import { Page, useNavigate } from "zmp-ui";
import { dinhDangTien, ngayDayDu } from "../don";
import { useGioHang } from "../gio-hang";
import { docDonTrenMayChu } from "../may-chu-don";
import { DauTrang } from "../thanh-phan";
import { nhanTrangThaiDon, type DonDaDat, type KetQuaDoc } from "../tra-truoc";

export default function DonCuaToi() {
  const navigate = useNavigate();
  const { danhSachDon, datDonDaDat, boDonKhoiDanhSach } = useGioHang();
  const [ketQua, datKetQua] = useState<Record<string, KetQuaDoc | "dang-hoi">>({});
  // Mỗi đơn hỏi máy chủ đúng một lần mỗi lần mở màn. Danh sách đổi (bỏ đơn máy chủ không còn) không hủy các lần hỏi
  // đang chạy của đơn khác — chỉ rời màn mới thôi nhận câu trả lời.
  const daHoi = useRef(new Set<string>());
  const conMo = useRef(true);
  useEffect(
    () => () => {
      conMo.current = false;
    },
    [],
  );

  useEffect(() => {
    for (const d of danhSachDon) {
      if (daHoi.current.has(d.ma)) continue;
      daHoi.current.add(d.ma);
      datKetQua((cu) => ({ ...cu, [d.ma]: "dang-hoi" }));
      void docDonTrenMayChu(d.ma, d.khoa).then((kq) => {
        if (!conMo.current) return;
        if (kq.loai === "khong-thay") boDonKhoiDanhSach(d.ma);
        datKetQua((cu) => ({ ...cu, [d.ma]: kq }));
      });
    }
  }, [danhSachDon, boDonKhoiDanhSach]);

  function xem(d: DonDaDat) {
    datDonDaDat(d);
    navigate("/tra-tien");
  }

  return (
    <Page className="trang don-cua-toi">
      <DauTrang tieuDe="Đơn của tôi" />
      {danhSachDon.length === 0 ? (
        <div className="trong">
          <p>Bạn chưa đặt đơn nào trên máy này trong 30 ngày qua.</p>
          <button type="button" className="nut-chinh" onClick={() => navigate("/", { replace: true })}>
            Về trang chủ
          </button>
        </div>
      ) : (
        <ul className="ds-don-cua-toi">
          {danhSachDon.map((d) => {
            const kq = ketQua[d.ma];
            const don = kq && kq !== "dang-hoi" && kq.loai === "co" ? kq.don : null;
            const trangThai =
              !kq || kq === "dang-hoi"
                ? "Đang xem trạng thái…"
                : don
                  ? nhanTrangThaiDon(don.trangThai, don.cachNhan)
                  : "Chưa xem được trạng thái. Kiểm tra mạng rồi mở lại.";
            return (
              <li key={d.ma} className="the-don-cua-toi">
                <div className="dong-dau">
                  <b>Đơn #{d.soTrongNgay}</b>
                  <span className="nhan-trang-thai">{trangThai}</span>
                </div>
                <p className="ghi-chu">
                  {don?.cachNhan === "tai-quan" ? "Nhận" : "Giao"} {don?.gioNhan ? `${don.gioNhan}, ` : ""}
                  {ngayDayDu(d.ngayNhan)}
                  {don ? ` · ${dinhDangTien(don.tongTien)}` : ""}
                </p>
                <button type="button" className="nut-phu" onClick={() => xem(d)}>
                  Xem đơn
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
