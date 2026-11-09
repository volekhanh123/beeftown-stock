// Giỏ hàng và thông tin nhận hàng. Chỉ giữ trong bộ nhớ khi app đang mở, không lưu xuống máy hay máy chủ.
// Riêng đơn trả trước vừa đặt: giữ mã đơn và khóa xem trên máy (không tên, không số điện thoại) để khách quay lại
// từ app ngân hàng vẫn mở đúng đơn (tra-truoc.ts, "Đơn vừa đặt, giữ trên máy"); và danh sách "Đơn của tôi" (cùng loại
// dữ liệu, 30 ngày, tối đa 20 đơn).

import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import type { ThongTinNhan } from "./don";
import { CAU_HINH } from "./cau-hinh";
import { khoLuuCuaMay } from "./may-chu-don";
import {
  boKhoiDanhSach,
  docDanhSachDon,
  docDonDaDat,
  luuDonDaDat,
  themVaoDanhSach,
  xoaDonDaDat,
  type DonDaDat,
} from "./tra-truoc";

const NHAN_BAN_DAU: ThongTinNhan = {
  cachNhan: "tai-quan",
  ngay: "",
  gio: "",
  ten: "",
  dienThoai: "",
  diaChi: "",
  cachTra: "chuyen-khoan",
  ghiChu: "",
};

interface GioHang {
  soKhay: Record<string, number>;
  datSoKhay: (ma: string, so: number) => void;
  tongKhay: number;
  soPhan: number;
  nhan: ThongTinNhan;
  suaNhan: (thayDoi: Partial<ThongTinNhan>) => void;
  noiDungDaGui: string;
  datNoiDungDaGui: (s: string) => void;
  lamMoi: () => void;
  /** Đơn trả trước vừa đặt (giữ trên máy tới hết ngày nhận), hoặc null. */
  donDaDat: DonDaDat | null;
  /** Đặt đơn đang theo dõi (màn trả tiền); đơn mới cũng vào "Đơn của tôi". null: thôi theo dõi (vẫn còn trong danh sách). */
  datDonDaDat: (don: DonDaDat | null) => void;
  /** "Đơn của tôi": các đơn trả trước đã đặt trên máy này, mới nhất trước (tra-truoc.ts, docDanhSachDon). */
  danhSachDon: DonDaDat[];
  /** Máy chủ báo không còn đơn này: bỏ khỏi "Đơn của tôi". */
  boDonKhoiDanhSach: (ma: string) => void;
  /**
   * Mã gửi của lần gửi đơn trả trước gần nhất và dấu nội dung đơn lúc đó. Nằm ở đây chứ không ở màn đơn hàng: khách
   * rời màn (sang màn trả tiền, quay lại) rồi gửi lại cùng nội dung thì vẫn cùng mã gửi — máy chủ trả đúng đơn cũ.
   */
  lanGui: { maGui: string; dau: string } | null;
  datLanGui: (lan: { maGui: string; dau: string } | null) => void;
}

const NguCanh = createContext<GioHang | null>(null);

export function GioHangProvider({ children }: { children: ReactNode }) {
  const [soKhay, setSoKhay] = useState<Record<string, number>>({});
  const [nhan, setNhan] = useState<ThongTinNhan>(NHAN_BAN_DAU);
  const [noiDungDaGui, datNoiDungDaGui] = useState("");
  const [lanGui, datLanGui] = useState<{ maGui: string; dau: string } | null>(null);
  const [donDaDat, setDonDaDat] = useState<DonDaDat | null>(() => docDonDaDat(khoLuuCuaMay(), Date.now()));

  const [danhSachDon, setDanhSachDon] = useState<DonDaDat[]>(() => docDanhSachDon(khoLuuCuaMay(), Date.now()));

  const datDonDaDat = useCallback((don: DonDaDat | null) => {
    if (don) {
      luuDonDaDat(khoLuuCuaMay(), don);
      setDanhSachDon(themVaoDanhSach(khoLuuCuaMay(), don, Date.now()));
    } else xoaDonDaDat(khoLuuCuaMay());
    setDonDaDat(don);
  }, []);

  const boDonKhoiDanhSach = useCallback((ma: string) => {
    setDanhSachDon(boKhoiDanhSach(khoLuuCuaMay(), ma, Date.now()));
  }, []);

  const datSoKhay = useCallback((ma: string, so: number) => {
    const gioiHan = Math.max(0, Math.min(CAU_HINH.soKhayToiDa, so));
    setSoKhay((cu) => {
      const moi = { ...cu };
      if (gioiHan === 0) delete moi[ma];
      else moi[ma] = gioiHan;
      return moi;
    });
  }, []);

  const suaNhan = useCallback((thayDoi: Partial<ThongTinNhan>) => {
    setNhan((cu) => ({ ...cu, ...thayDoi }));
  }, []);

  const lamMoi = useCallback(() => {
    setSoKhay({});
    setNhan(NHAN_BAN_DAU);
    datNoiDungDaGui("");
    datLanGui(null);
  }, []);

  const giaTri = useMemo<GioHang>(() => {
    const cacSo = Object.values(soKhay);
    return {
      soKhay,
      datSoKhay,
      tongKhay: cacSo.reduce((t, s) => t + s, 0),
      soPhan: cacSo.length,
      nhan,
      suaNhan,
      noiDungDaGui,
      datNoiDungDaGui,
      lamMoi,
      donDaDat,
      datDonDaDat,
      danhSachDon,
      boDonKhoiDanhSach,
      lanGui,
      datLanGui,
    };
  }, [soKhay, datSoKhay, nhan, suaNhan, noiDungDaGui, lamMoi, donDaDat, datDonDaDat, danhSachDon, boDonKhoiDanhSach, lanGui]);

  return <NguCanh.Provider value={giaTri}>{children}</NguCanh.Provider>;
}

export function useGioHang(): GioHang {
  const gio = useContext(NguCanh);
  if (!gio) throw new Error("useGioHang phải nằm trong GioHangProvider");
  return gio;
}
