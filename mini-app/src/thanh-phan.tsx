// Thành phần dùng chung: đầu trang, nút chọn số khay, giá khay, thẻ phần thịt.

import React, { ReactNode } from "react";
import { useNavigate } from "zmp-ui";
import { MuiTenTrai } from "./bieu-tuong";
import { CAU_HINH } from "./cau-hinh";
import { dinhDangTien } from "./don";
import { useGioHang } from "./gio-hang";
import type { SanPham } from "./san-pham";

export function DauTrang({ tieuDe, quayLai = true }: { tieuDe: string; quayLai?: boolean }) {
  const navigate = useNavigate();
  return (
    <header className="dau-trang-con">
      {quayLai ? (
        <button type="button" className="nut-quay-lai" aria-label="Quay lại" onClick={() => navigate(-1)}>
          <MuiTenTrai />
        </button>
      ) : (
        <span className="nut-quay-lai" aria-hidden="true" />
      )}
      <h1>{tieuDe}</h1>
      <span className="nut-quay-lai" aria-hidden="true" />
    </header>
  );
}

export function SoKhay({ ten, so, onDoi }: { ten: string; so: number; onDoi: (so: number) => void }) {
  if (so === 0) {
    return (
      <button type="button" className="nut-them" onClick={() => onDoi(1)} aria-label={`Thêm ${ten} vào đơn`}>
        Thêm vào đơn
      </button>
    );
  }
  return (
    <div className="so-khay" role="group" aria-label={`Số khay ${ten}`}>
      <button type="button" aria-label={`Bớt 1 khay ${ten}`} onClick={() => onDoi(so - 1)}>
        −
      </button>
      <span aria-live="polite">
        <b>{so}</b> khay
      </span>
      <button
        type="button"
        aria-label={`Thêm 1 khay ${ten}`}
        disabled={so >= CAU_HINH.soKhayToiDa}
        onClick={() => onDoi(so + 1)}
      >
        +
      </button>
    </div>
  );
}

export function NhanBaoQuan({ baoQuan }: { baoQuan: SanPham["baoQuan"] }) {
  return (
    <span className={`nhan-bao-quan ${baoQuan}`}>{baoQuan === "mat" ? "Thịt mát" : "Đông lạnh"}</span>
  );
}

/** Giá cố định của 1 khay, kèm số gam khoảng. Giá không đổi theo số gam thật của khay. */
export function GiaKhay({ gia, soGam }: { gia: number | null; soGam: number }) {
  if (gia === null) {
    return (
      <span className="gia chua-co">
        <span>Báo giá khi xác nhận đơn</span>
        <span className="so-gam">~{soGam} g một khay</span>
      </span>
    );
  }
  return (
    <span className="gia">
      <span>
        <b>{dinhDangTien(gia)}</b> / khay
      </span>
      <span className="so-gam">~{soGam} g một khay</span>
      {CAU_HINH.giaThu && <span className="nhan-gia-thu">Giá thử</span>}
    </span>
  );
}

/** Dòng báo giá thử ở trang chủ. Chỉ hiện khi CAU_HINH.giaThu = true. */
export function BaoGiaThu() {
  if (!CAU_HINH.giaThu) return null;
  return (
    <p className="bao-gia-thu" role="note">
      <b>Giá thử.</b> Giá và số gam trong app đang để thử, chưa phải giá bán của quán.
    </p>
  );
}

export function TheThit({ sp }: { sp: SanPham }) {
  const { soKhay, datSoKhay } = useGioHang();
  const so = soKhay[sp.ma] ?? 0;
  return (
    <article className={`the-thit ${sp.baoQuan}${so > 0 ? " da-chon" : ""}`}>
      <div className="the-thit-dau">
        <h2>{sp.ten}</h2>
        <NhanBaoQuan baoQuan={sp.baoQuan} />
      </div>
      {sp.goiY && <p className="goi-y">{sp.goiY}</p>}
      <p className="mo-ta">{sp.moTa}</p>
      {sp.cachNuong && (
        <p className="cach-nuong">
          <b>Nướng:</b> {sp.cachNuong}
        </p>
      )}
      <div className="the-thit-chan">
        <GiaKhay gia={sp.giaMoiKhay} soGam={sp.soGamKhay} />
        {sp.conHang ? (
          <SoKhay ten={sp.ten} so={so} onDoi={(moi) => datSoKhay(sp.ma, moi)} />
        ) : (
          <span className="het-hang">Tạm hết</span>
        )}
      </div>
    </article>
  );
}

export function Muc({ tieuDe, children }: { tieuDe: string; children: ReactNode }) {
  return (
    <section className="muc">
      <h2 className="muc-tieu-de">{tieuDe}</h2>
      {children}
    </section>
  );
}
