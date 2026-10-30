import React, { useCallback, useEffect, useRef, useState } from "react";
import { Page, useNavigate } from "zmp-ui";
import { veMaQr } from "../anh-qr";
import { DauTich } from "../bieu-tuong";
import { CAU_HINH } from "../cau-hinh";
import { dinhDangTien, ngayDayDu } from "../don";
import { useGioHang } from "../gio-hang";
import { docDonTrenMayChu } from "../may-chu-don";
import { DauTrang } from "../thanh-phan";
import { useThongBao } from "../thong-bao";
import { buocTraTien, gioPhutVn, hoiLaiSauMs, type DonTraTruoc, type ThanhToanCo } from "../tra-truoc";
import { dangTrongZalo, luuAnhVaoMay, moChatVoiQuan, quanTamQuan } from "../zalo";

/** Lỗi mạng: hỏi lại sau chừng này. Máy đang ẩn (khách ở app ngân hàng): không hỏi dày hơn 30 giây. */
const THU_LAI_KHI_LOI_MS = 8_000;
const KHI_AN_MS = 30_000;

export default function TraTien() {
  const navigate = useNavigate();
  const thongBao = useThongBao();
  const { donDaDat, datDonDaDat, lamMoi } = useGioHang();
  const [don, datDon] = useState<DonTraTruoc | null>(null);
  const [khongThay, datKhongThay] = useState(false);
  const [matKetNoi, datMatKetNoi] = useState(false);
  const [dangKiem, datDangKiem] = useState(false);
  const [chuaThayTien, datChuaThayTien] = useState(false);
  const kiemNgay = useRef<() => Promise<DonTraTruoc | null>>(async () => null);

  // Một vòng hỏi duy nhất: mỗi lần hỏi mới (hẹn giờ, khách quay lại app, bấm "Tôi đã chuyển khoản") thay vòng cũ;
  // câu trả lời của lần hỏi cũ về sau thì bỏ, để màn không lùi về trạng thái cũ.
  useEffect(() => {
    if (!donDaDat || khongThay) return;
    let huy = false;
    let lan = 0;
    let hen: number | undefined;
    async function vong(): Promise<DonTraTruoc | null> {
      const cuaToi = ++lan;
      window.clearTimeout(hen);
      const kq = await docDonTrenMayChu(donDaDat!.ma, donDaDat!.khoa);
      if (huy || cuaToi !== lan) return null;
      let cho: number | null = THU_LAI_KHI_LOI_MS;
      if (kq.loai === "co") {
        datDon(kq.don);
        datMatKetNoi(false);
        cho = hoiLaiSauMs(kq.don.trangThai);
      } else if (kq.loai === "khong-thay") {
        datKhongThay(true);
        return null;
      } else {
        datMatKetNoi(true);
      }
      if (cho !== null) {
        hen = window.setTimeout(vong, document.visibilityState === "visible" ? cho : Math.max(cho, KHI_AN_MS));
      }
      return kq.loai === "co" ? kq.don : null;
    }
    kiemNgay.current = vong;
    void vong();
    function khiHien() {
      if (document.visibilityState === "visible") void vong();
    }
    document.addEventListener("visibilitychange", khiHien);
    return () => {
      huy = true;
      window.clearTimeout(hen);
      document.removeEventListener("visibilitychange", khiHien);
    };
  }, [donDaDat, khongThay]);

  const daChuyen = useCallback(async () => {
    datDangKiem(true);
    datChuaThayTien(false);
    const moi = await kiemNgay.current();
    datDangKiem(false);
    if (moi?.trangThai === "cho_thanh_toan") datChuaThayTien(true);
  }, []);

  async function chat() {
    const ketQua = await moChatVoiQuan();
    if (ketQua !== "da-mo") thongBao("Chưa mở được khung chat Zalo.");
  }

  function veTrangChu(donMoi: boolean) {
    if (donMoi) lamMoi();
    navigate("/", { replace: true });
  }

  if (!donDaDat || khongThay) {
    return (
      <Page className="trang">
        <DauTrang tieuDe="Trả tiền" quayLai={false} />
        <div className="trong">
          <p>{khongThay ? "Không thấy đơn này. Đơn có thể đã quá cũ." : "Bạn chưa có đơn nào đang chờ."}</p>
          <button
            type="button"
            className="nut-chinh"
            onClick={() => {
              if (khongThay) datDonDaDat(null);
              veTrangChu(false);
            }}
          >
            Về trang chủ
          </button>
        </div>
      </Page>
    );
  }

  const buoc = don ? buocTraTien(don) : null;
  const so = don?.soTrongNgay ?? donDaDat.soTrongNgay;
  const lucNhan = don?.ngayNhan && don.gioNhan ? `${don.gioNhan}, ${ngayDayDu(don.ngayNhan)}` : null;

  return (
    <Page className="trang tra-tien" hideScrollbar>
      <DauTrang tieuDe="Trả tiền" quayLai={false} />

      {don && (
        <div className="tom-tat-don">
          <b>Đơn #{so}</b>
          {lucNhan && <span>Nhận tại quán lúc {lucNhan}</span>}
          <span>Tổng tiền {dinhDangTien(don.tongTien)}</span>
        </div>
      )}

      {!buoc && (
        <div className="trong">
          <p>{matKetNoi ? "Chưa kết nối được với quán. App đang thử lại." : "Đang mở đơn…"}</p>
        </div>
      )}

      {buoc?.buoc === "cho-tra" && (
        <ChoTra
          thanhToan={buoc.thanhToan}
          daNhan={buoc.daNhan}
          so={so}
          dangKiem={dangKiem}
          chuaThayTien={chuaThayTien}
          daChuyen={daChuyen}
          chat={chat}
        />
      )}

      {buoc?.buoc === "dang-lay-ma" && (
        <div className="trong">
          <p>Đang lấy mã trả tiền…</p>
        </div>
      )}

      {buoc?.buoc === "chua-mo-tra" && (
        <div className="noi-dung-giua">
          <h2>Chưa trả tiền được trong app</h2>
          <p>
            {buoc.lyDo === "gia_thu"
              ? "Giá trong app đang là giá thử, quán chưa nhận chuyển khoản theo giá này."
              : "Quán chưa mở nhận chuyển khoản trong app."}{" "}
            Đơn #{so} sẽ tự hủy sau 30 phút. Bạn chat với Beeftown để đặt giúp mình.
          </p>
          <div className="cot-nut">
            <button type="button" className="nut-chinh rong" onClick={chat}>
              Chat với Beeftown
            </button>
            <button type="button" className="nut-chu" onClick={() => veTrangChu(false)}>
              Về trang chủ
            </button>
          </div>
        </div>
      )}

      {buoc?.buoc === "da-nhan-du" && (
        <div className="noi-dung-giua">
          <span className="dau-tick" aria-hidden="true">
            <DauTich />
          </span>
          <h2>Quán đã nhận đủ tiền</h2>
          <p>
            {buoc.trangThai === "da_thanh_toan" &&
              `Đơn #${so} đang chờ quầy soạn.${lucNhan ? ` Bạn ghé lấy lúc ${lucNhan}.` : ""}`}
            {buoc.trangThai === "dang_soan" && `Quầy đang soạn khay cho đơn #${so}.`}
            {buoc.trangThai === "cho_lay" && `Khay của đơn #${so} đã sẵn sàng. Mời bạn ghé quán lấy.`}
            {buoc.trangThai === "da_giao" && `Bạn đã lấy khay của đơn #${so}. Cảm ơn bạn đã mua ở Beeftown.`}
          </p>
          {buoc.thua > 0 && (
            <p className="bao-them">Bạn chuyển dư {dinhDangTien(buoc.thua)}. Quán sẽ hoàn phần dư cho bạn.</p>
          )}
          {buoc.trangThai !== "da_giao" && (
            <p className="ghi-chu">
              {CAU_HINH.diaChi}. {CAU_HINH.chiDuong} Tới quầy, bạn đọc tên người nhận hoặc số đơn #{so}.
            </p>
          )}
          <div className="cot-nut">
            <button
              type="button"
              className="nut-phu rong"
              onClick={async () => {
                if (await quanTamQuan()) thongBao("Cảm ơn bạn đã quan tâm Beeftown.", "success");
              }}
            >
              Quan tâm Beeftown trên Zalo
            </button>
            <button type="button" className="nut-chu" onClick={() => veTrangChu(true)}>
              Làm đơn mới
            </button>
          </div>
        </div>
      )}

      {buoc?.buoc === "het-han" && (
        <div className="noi-dung-giua">
          <h2>Đơn đã hết hạn</h2>
          <p>Quán chưa nhận đủ tiền trong 30 phút nên đơn #{so} đã tự hủy.</p>
          <p className="bao-them">
            {buoc.daNhan > 0
              ? `Quán đã nhận ${dinhDangTien(buoc.daNhan)} cho đơn này và sẽ liên hệ bạn để hoàn tiền.`
              : "Nếu bạn vừa chuyển khoản, đợi trong giây lát: app vẫn kiểm tra và tự cập nhật khi quán nhận được tiền."}
          </p>
          <div className="cot-nut">
            <button type="button" className="nut-chinh rong" onClick={() => veTrangChu(false)}>
              Đặt lại
            </button>
            <button type="button" className="nut-chu" onClick={chat}>
              Chat với Beeftown
            </button>
          </div>
        </div>
      )}

      {buoc?.buoc === "da-huy" && (
        <div className="noi-dung-giua">
          <h2>Quán đã hủy đơn</h2>
          <p>
            {buoc.daHoan
              ? `Quán đã hủy đơn #${so} và đã hoàn tiền cho bạn.`
              : `Quán đã hủy đơn #${so} và sẽ hoàn tiền cho bạn.`}
          </p>
          <div className="cot-nut">
            <button type="button" className="nut-chinh rong" onClick={chat}>
              Chat với Beeftown
            </button>
            <button type="button" className="nut-chu" onClick={() => veTrangChu(true)}>
              Về trang chủ
            </button>
          </div>
        </div>
      )}

      {buoc && matKetNoi && <p className="ghi-chu ghi-chu-trang">Chưa kết nối được với quán. App đang thử lại.</p>}
      <div className="khoang-duoi" />
    </Page>
  );
}

function ChoTra({
  thanhToan,
  daNhan,
  so,
  dangKiem,
  chuaThayTien,
  daChuyen,
  chat,
}: {
  thanhToan: ThanhToanCo;
  daNhan: number;
  so: number;
  dangKiem: boolean;
  chuaThayTien: boolean;
  daChuyen: () => void;
  chat: () => void;
}) {
  const thongBao = useThongBao();
  const [anhQr, datAnhQr] = useState<string | null>(null);

  useEffect(() => {
    let conMo = true;
    datAnhQr(null);
    veMaQr(thanhToan.chuoiQr)
      .then((anh) => conMo && datAnhQr(anh))
      .catch(() => undefined);
    return () => {
      conMo = false;
    };
  }, [thanhToan.chuoiQr]);

  async function chep(giaTri: string, ten: string) {
    try {
      await navigator.clipboard.writeText(giaTri);
      thongBao(`Đã chép ${ten}.`, "success");
    } catch {
      thongBao("Máy không cho chép, bạn chép tay giúp mình.");
    }
  }

  async function luuAnh() {
    if (!anhQr) return;
    const ketQua = await luuAnhVaoMay(anhQr);
    if (ketQua === "da-luu") thongBao("Đã lưu ảnh mã QR vào máy.", "success");
    else thongBao("Chưa lưu được ảnh. Bạn chép số tài khoản bên dưới giúp mình.");
  }

  const tien = dinhDangTien(thanhToan.soTien);
  return (
    <>
      {daNhan > 0 && (
        <p className="bao-trang-thai" role="status">
          Quán đã nhận {dinhDangTien(daNhan)}. Bạn chuyển thêm {tien} với cùng nội dung bên dưới.
        </p>
      )}
      <section className="muc the-tra-tien" aria-label="Chuyển khoản">
        <h2 className="tieu-de-tra">Chuyển khoản {tien}</h2>
        <div className="khung-qr">
          {anhQr ? (
            <img src={anhQr} width={240} height={240} alt={`Mã QR chuyển khoản ${tien} cho đơn #${so}`} />
          ) : (
            <span className="cho-qr">Đang vẽ mã QR…</span>
          )}
        </div>
        <p className="ghi-chu">
          Quét mã bằng app ngân hàng. Đang mở Mini App trên chính điện thoại trả tiền: lưu ảnh mã rồi chọn ảnh trong app
          ngân hàng, hoặc chép từng dòng bên dưới.
        </p>
        {dangTrongZalo() && (
          <button type="button" className="nut-phu rong nut-luu-anh" onClick={luuAnh} disabled={!anhQr}>
            Lưu ảnh mã QR
          </button>
        )}

        <dl className="ds-chuyen-khoan">
          <div>
            <dt>Ngân hàng</dt>
            <dd>{thanhToan.nganHang}</dd>
          </div>
          <div>
            <dt>Chủ tài khoản</dt>
            <dd>{thanhToan.tenTaiKhoan}</dd>
          </div>
          <div>
            <dt>Số tài khoản</dt>
            <dd>
              <b>{thanhToan.soTaiKhoan}</b>
              <button type="button" className="nut-them" onClick={() => chep(thanhToan.soTaiKhoan, "số tài khoản")}>
                Chép
              </button>
            </dd>
          </div>
          <div>
            <dt>Số tiền</dt>
            <dd>
              <b>{tien}</b>
              <button type="button" className="nut-them" onClick={() => chep(String(thanhToan.soTien), "số tiền")}>
                Chép
              </button>
            </dd>
          </div>
          <div>
            <dt>Nội dung</dt>
            <dd>
              <b>{thanhToan.noiDung}</b>
              <button type="button" className="nut-them" onClick={() => chep(thanhToan.noiDung, "nội dung")}>
                Chép
              </button>
            </dd>
          </div>
        </dl>
        <p className="ghi-chu">
          Ghi đúng nội dung {thanhToan.noiDung} để quán nhận ra đơn của bạn. Mã dùng tới{" "}
          {gioPhutVn(thanhToan.hetHanLuc)}; quá giờ này quán chưa nhận đủ tiền thì đơn tự hủy.
        </p>
      </section>

      <div className="cho-tien-ve">
        <p className="ghi-chu">Đang chờ tiền về. App tự cập nhật khi quán nhận được tiền.</p>
        {chuaThayTien && (
          <p className="bao-trang-thai" role="status">
            Quán chưa nhận được tiền. Ngân hàng có thể báo chậm vài phút; app vẫn đang kiểm tra.
          </p>
        )}
        <div className="cot-nut">
          <button type="button" className="nut-chinh rong" onClick={daChuyen} disabled={dangKiem}>
            {dangKiem ? "Đang kiểm tra…" : "Tôi đã chuyển khoản"}
          </button>
          <button type="button" className="nut-chu" onClick={chat}>
            Chat với Beeftown
          </button>
        </div>
      </div>
    </>
  );
}
