import React, { useEffect, useMemo, useState } from "react";
import { Page, useNavigate } from "zmp-ui";
import { CAU_HINH, CAU_HINH_GIO } from "../cau-hinh";
import { cacGioChon, cacNgayChon, dinhDangTien, kiemTraDon, taoNoiDungDon, tongTienThit } from "../don";
import { useGioHang } from "../gio-hang";
import { SAN_PHAM, dongTuGio } from "../san-pham";
import { DauTrang, GhiChuConHang, GiaKhay, Muc, NhanBaoQuan, SoKhay } from "../thanh-phan";
import { trangThaiPhan } from "../con-hang";
import { useConHang } from "../con-hang-kho";
import { useThongBao } from "../thong-bao";
import { moChatVoiQuan } from "../zalo";
import { TRA_TRUOC, guiDonDenMayChu } from "../may-chu-don";
import { dauNoiDung, donCuConDung, kiemTraTraTruoc, taoMaGui, taoThanDon } from "../tra-truoc";

export default function DonHang() {
  const navigate = useNavigate();
  const thongBao = useThongBao();
  const { soKhay, datSoKhay, tongKhay, nhan, suaNhan, datNoiDungDaGui, datDonDaDat, lanGui, datLanGui } = useGioHang();
  const conHang = useConHang();
  const [daBamGui, datDaBamGui] = useState(false);
  const [tinNgoaiZalo, datTinNgoaiZalo] = useState<string | null>(null);
  const [dangGui, datDangGui] = useState(false);
  // Trả trước: câu lỗi máy chủ trả về. Mã gửi giữ ở giỏ hàng (lanGui): gửi lại cùng nội dung thì không ra hai đơn.
  const [loiGui, datLoiGui] = useState<string[]>([]);

  const now = useMemo(() => new Date(), []);
  const cacNgay = useMemo(() => cacNgayChon(now, CAU_HINH_GIO), [now]);
  const cacGio = useMemo(() => (nhan.ngay ? cacGioChon(nhan.ngay, now, CAU_HINH_GIO) : []), [nhan.ngay, now]);

  useEffect(() => {
    if (!cacNgay.some((n) => n.giaTri === nhan.ngay)) suaNhan({ ngay: cacNgay[0]?.giaTri ?? "", gio: "" });
  }, [cacNgay, nhan.ngay, suaNhan]);

  useEffect(() => {
    if (nhan.gio && !cacGio.includes(nhan.gio)) suaNhan({ gio: "" });
  }, [cacGio, nhan.gio, suaNhan]);

  // Đơn trả trước đợt đầu chỉ nhận tại quán (phí giao chưa chốt nên chưa tính đủ tiền trước được).
  useEffect(() => {
    if (TRA_TRUOC && nhan.cachNhan !== "tai-quan") suaNhan({ cachNhan: "tai-quan" });
  }, [nhan.cachNhan, suaNhan]);

  // Khách sửa đơn thì câu lỗi của lần gửi trước không còn đúng.
  const dauHienTai = dauNoiDung(soKhay, nhan);
  useEffect(() => datLoiGui([]), [dauHienTai]);

  const daChon = SAN_PHAM.filter((sp) => (soKhay[sp.ma] ?? 0) > 0);
  const dong = dongTuGio(soKhay, (sp) => trangThaiPhan(sp.conHang, conHang[sp.ma]) === "het");
  const tongTien = tongTienThit(dong);

  const phanVuaHet = daChon.filter((sp) => trangThaiPhan(sp.conHang, conHang[sp.ma]) === "het").map((sp) => sp.ten);
  const phanChuaGia = daChon.filter((sp) => sp.giaMoiKhay === null).map((sp) => sp.ten);
  const kiem = () => [...kiemTraDon(dong, nhan), ...(TRA_TRUOC ? kiemTraTraTruoc(nhan, phanVuaHet, phanChuaGia) : [])];

  // Sau lần bấm gửi đầu tiên, danh sách lỗi tự cập nhật theo từng ô khách sửa.
  const loi = [...(daBamGui ? kiem() : []), ...loiGui];

  /** Gửi đơn lên máy chủ đơn; máy chủ ghi xong mới sang màn trả tiền. */
  async function guiDonTraTruoc() {
    let maGui = lanGui?.dau === dauHienTai ? lanGui.maGui : taoMaGui();
    datDangGui(true);
    datLoiGui([]);
    try {
      for (let lan = 0; lan < 2; lan++) {
        datLanGui({ maGui, dau: dauHienTai });
        const kq = await guiDonDenMayChu(taoThanDon(maGui, soKhay, nhan));
        if (kq.loai === "da-ghi") {
          // Cùng mã gửi mà đơn cũ đã hết hạn, đã lấy hay đã hủy (khách đặt lại y như cũ): đặt đơn mới.
          if (!donCuConDung(kq.don.trangThai) && lan === 0) {
            maGui = taoMaGui();
            continue;
          }
          datDonDaDat({
            ma: kq.don.ma,
            khoa: kq.khoa,
            soTrongNgay: kq.don.soTrongNgay,
            ngayNhan: kq.don.ngayNhan ?? nhan.ngay,
            luc: Date.now(),
          });
          navigate("/tra-tien");
          return;
        }
        if (kq.loai === "chua-ghi") {
          if (kq.trungMaGui) datLanGui(null);
          datLoiGui(kq.loi);
          return;
        }
        datLoiGui([
          "Chưa chắc đơn đã tới quán vì mạng chập chờn. Bấm gửi lại: nếu đơn đã tới, app mở đúng đơn đó, không ra hai đơn.",
        ]);
        return;
      }
    } finally {
      datDangGui(false);
    }
  }

  async function guiDon() {
    datDaBamGui(true);
    const dsLoi = kiem();
    if (dsLoi.length > 0) return; // lỗi hiện ngay trên nút Gửi
    if (TRA_TRUOC) return guiDonTraTruoc();
    const noiDung = taoNoiDungDon(dong, nhan, { giaThu: CAU_HINH.giaThu });
    datDangGui(true);
    const ketQua = await moChatVoiQuan(noiDung);
    datDangGui(false);
    if (ketQua === "da-mo") {
      datNoiDungDaGui(noiDung);
      navigate("/da-gui");
    } else if (ketQua === "ngoai-zalo") {
      datNoiDungDaGui(noiDung);
      datTinNgoaiZalo(noiDung);
    } else if (ketQua === "chua-co-oa") {
      thongBao("App chưa cài OA ID của Beeftown (file cau-hinh.ts).");
    } else {
      thongBao("Chưa mở được khung chat Zalo. Bạn thử lại giúp mình.");
    }
  }

  async function chepTin() {
    if (!tinNgoaiZalo) return;
    try {
      await navigator.clipboard.writeText(tinNgoaiZalo);
      thongBao("Đã chép tin nhắn.", "success");
    } catch {
      thongBao("Máy không cho chép, bạn bôi đen rồi chép tay giúp mình.");
    }
  }

  if (tongKhay === 0) {
    return (
      <Page className="trang">
        <DauTrang tieuDe="Đơn hàng" />
        <div className="trong">
          <p>Bạn chưa chọn khay thịt nào.</p>
          <button type="button" className="nut-chinh" onClick={() => navigate("/", { replace: true })}>
            Chọn thịt
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page className="trang don-hang" hideScrollbar>
      <DauTrang tieuDe="Đơn hàng" />

      <Muc tieuDe={`Thịt đã chọn · ${tongKhay} khay`}>
        <ul className="ds-da-chon">
          {daChon.map((sp) => {
            const trangThai = trangThaiPhan(sp.conHang, conHang[sp.ma]);
            return (
              <li key={sp.ma}>
                <div className="ten-dong">
                  <b>{sp.ten}</b>
                  <NhanBaoQuan baoQuan={sp.baoQuan} />
                  <GiaKhay gia={sp.giaMoiKhay} soGam={sp.soGamKhay} />
                  <GhiChuConHang trangThai={trangThai} daChon />
                </div>
                <SoKhay
                  ten={sp.ten}
                  so={soKhay[sp.ma]}
                  het={trangThai === "het"}
                  onDoi={(so) => datSoKhay(sp.ma, so)}
                />
              </li>
            );
          })}
        </ul>
        <p className="tong-tien">
          <span>Tổng tiền thịt</span>
          <b>{tongTien === null ? "Quán báo khi xác nhận" : dinhDangTien(tongTien)}</b>
        </p>
        {nhan.cachNhan === "giao-hang" && <p className="ghi-chu">Chưa gồm phí giao, quán báo khi xác nhận đơn.</p>}
        <button type="button" className="nut-chu" onClick={() => navigate(-1)}>
          + Chọn thêm phần khác
        </button>
      </Muc>

      <Muc tieuDe="Cách nhận">
        {TRA_TRUOC ? (
          <>
            <p>
              <b>Nhận tại quán</b>
            </p>
            <p className="ghi-chu">
              {CAU_HINH.diaChi}. {CAU_HINH.chiDuong} Đơn trả trước trong app hiện chỉ nhận tại quán.
            </p>
          </>
        ) : (
          <>
            <div className="chon-hai" role="radiogroup" aria-label="Cách nhận">
              <button
                type="button"
                role="radio"
                aria-checked={nhan.cachNhan === "tai-quan"}
                className={nhan.cachNhan === "tai-quan" ? "dang-chon" : ""}
                onClick={() => suaNhan({ cachNhan: "tai-quan" })}
              >
                Nhận tại quán
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={nhan.cachNhan === "giao-hang"}
                className={nhan.cachNhan === "giao-hang" ? "dang-chon" : ""}
                onClick={() => suaNhan({ cachNhan: "giao-hang" })}
              >
                Giao tận nơi
              </button>
            </div>
            {nhan.cachNhan === "tai-quan" ? (
              <p className="ghi-chu">
                {CAU_HINH.diaChi}. {CAU_HINH.chiDuong}
              </p>
            ) : (
              <>
                <label className="o-nhap">
                  <span>Địa chỉ giao hàng</span>
                  <textarea
                    rows={2}
                    maxLength={200}
                    placeholder="Số nhà, đường, phường"
                    value={nhan.diaChi}
                    onChange={(e) => suaNhan({ diaChi: e.target.value })}
                  />
                </label>
                <p className="ghi-chu">Quán gọi xe giao. Phí giao quán báo khi xác nhận đơn.</p>
              </>
            )}
          </>
        )}
      </Muc>

      <Muc tieuDe={nhan.cachNhan === "tai-quan" ? "Giờ ghé lấy" : "Giờ muốn nhận"}>
        <div className="hai-cot">
          <label className="o-nhap">
            <span>Ngày</span>
            <select value={nhan.ngay} onChange={(e) => suaNhan({ ngay: e.target.value, gio: "" })}>
              {cacNgay.map((n) => (
                <option key={n.giaTri} value={n.giaTri}>
                  {n.nhan}
                </option>
              ))}
            </select>
          </label>
          <label className="o-nhap">
            <span>Giờ</span>
            <select value={nhan.gio} onChange={(e) => suaNhan({ gio: e.target.value })}>
              <option value="">Chọn giờ</option>
              {cacGio.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Muc>

      <Muc tieuDe="Người nhận">
        <label className="o-nhap">
          <span>{TRA_TRUOC ? "Tên người nhận" : "Tên (không bắt buộc)"}</span>
          <input
            type="text"
            maxLength={60}
            autoComplete="name"
            value={nhan.ten}
            onChange={(e) => suaNhan({ ten: e.target.value })}
          />
        </label>
        <label className="o-nhap">
          <span>{TRA_TRUOC || nhan.cachNhan === "giao-hang" ? "Số điện thoại" : "Số điện thoại (không bắt buộc)"}</span>
          <input
            type="tel"
            inputMode="tel"
            maxLength={16}
            autoComplete="tel"
            placeholder="09xx xxx xxx"
            value={nhan.dienThoai}
            onChange={(e) => suaNhan({ dienThoai: e.target.value })}
          />
        </label>
        {TRA_TRUOC && <p className="ghi-chu">Quầy gọi tên người nhận khi bạn tới lấy khay.</p>}
      </Muc>

      <Muc tieuDe="Thanh toán">
        {TRA_TRUOC ? (
          <p>
            <b>Chuyển khoản trước</b>
            <br />
            Gửi đơn xong, app hiện mã QR đúng số tiền. Quán nhận đủ tiền thì quầy mới soạn khay.
          </p>
        ) : (
          <div className="ds-chon" role="radiogroup" aria-label="Thanh toán">
            <label className={nhan.cachTra === "chuyen-khoan" ? "dang-chon" : ""}>
              <input
                type="radio"
                name="cach-tra"
                checked={nhan.cachTra === "chuyen-khoan"}
                onChange={() => suaNhan({ cachTra: "chuyen-khoan" })}
              />
              <span>
                <b>Chuyển khoản</b>
                <small>Quán gửi mã QR khi xác nhận đơn</small>
              </span>
            </label>
            <label className={nhan.cachTra === "tra-khi-nhan" ? "dang-chon" : ""}>
              <input
                type="radio"
                name="cach-tra"
                checked={nhan.cachTra === "tra-khi-nhan"}
                onChange={() => suaNhan({ cachTra: "tra-khi-nhan" })}
              />
              <span>
                <b>Trả khi nhận hàng</b>
                <small>Tiền mặt hoặc chuyển khoản lúc nhận</small>
              </span>
            </label>
          </div>
        )}
      </Muc>

      <Muc tieuDe="Ghi chú">
        <label className="o-nhap">
          <span className="an">Ghi chú cho quán</span>
          <textarea
            rows={2}
            maxLength={200}
            placeholder="Ví dụ: gọi trước khi tới, cần xuất hóa đơn"
            value={nhan.ghiChu}
            onChange={(e) => suaNhan({ ghiChu: e.target.value })}
          />
        </label>
      </Muc>

      {TRA_TRUOC ? (
        <p className="ghi-chu ghi-chu-trang">
          Bấm “Gửi đơn và trả tiền” để gửi đơn tới Beeftown. Tên, số điện thoại và đơn của bạn được lưu trên máy chủ đơn
          của Beeftown đặt tại Việt Nam, để quầy soạn và giao đúng đơn.
        </p>
      ) : (
        <p className="ghi-chu ghi-chu-trang">
          Bấm “Gửi đơn qua Zalo” sẽ mở khung chat với Beeftown, đơn đã điền sẵn. Bạn bấm Gửi thì quán mới nhận được.
          Mini App không lưu tên, số điện thoại, địa chỉ của bạn.
        </p>
      )}
      <div className="khoang-duoi co-thanh" />

      <div className="thanh-duoi">
        {loi.length > 0 && (
          <ul className="ds-loi" role="alert">
            {loi.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        )}
        <button type="button" className="nut-chinh rong" onClick={guiDon} disabled={dangGui}>
          {TRA_TRUOC
            ? dangGui
              ? "Đang gửi đơn…"
              : "Gửi đơn và trả tiền"
            : dangGui
              ? "Đang mở Zalo…"
              : "Gửi đơn qua Zalo"}
        </button>
      </div>

      {tinNgoaiZalo && (
        <div className="lop-phu" role="dialog" aria-modal="true" aria-label="Tin nhắn đơn hàng">
          <div className="hop-thoai">
            <h2>Bạn đang mở ngoài Zalo</h2>
            <p className="ghi-chu">
              Trong Zalo, nút này mở chat với Beeftown và điền sẵn tin nhắn dưới đây.
              {CAU_HINH.oaId ? "" : " (App chưa cài OA ID.)"}
            </p>
            <pre className="tin-nhan">{tinNgoaiZalo}</pre>
            <div className="hang-nut">
              <button type="button" className="nut-phu" onClick={chepTin}>
                Chép tin nhắn
              </button>
              <button type="button" className="nut-chinh" onClick={() => datTinNgoaiZalo(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
