// Giỏ hàng và thông tin nhận hàng. Chỉ giữ trong bộ nhớ khi app đang mở, không lưu xuống máy hay máy chủ.

import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import type { ThongTinNhan } from "./don";
import { CAU_HINH } from "./cau-hinh";

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
}

const NguCanh = createContext<GioHang | null>(null);

export function GioHangProvider({ children }: { children: ReactNode }) {
  const [soKhay, setSoKhay] = useState<Record<string, number>>({});
  const [nhan, setNhan] = useState<ThongTinNhan>(NHAN_BAN_DAU);
  const [noiDungDaGui, datNoiDungDaGui] = useState("");

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
    };
  }, [soKhay, datSoKhay, nhan, suaNhan, noiDungDaGui, lamMoi]);

  return <NguCanh.Provider value={giaTri}>{children}</NguCanh.Provider>;
}

export function useGioHang(): GioHang {
  const gio = useContext(NguCanh);
  if (!gio) throw new Error("useGioHang phải nằm trong GioHangProvider");
  return gio;
}
