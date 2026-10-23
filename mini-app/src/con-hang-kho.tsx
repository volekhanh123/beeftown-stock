// Giữ trạng thái còn hàng đọc từ website trong lúc app mở. Đọc khi mở app, đọc lại khi khách quay lại app
// sau ít nhất 60 giây (website cũng lưu đệm 60 giây).

import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { CAU_HINH } from "./cau-hinh";
import { docConHang, type TrangThaiKho } from "./con-hang";

const DOC_LAI_SAU_MS = 60_000;

const NguCanh = createContext<Record<string, TrangThaiKho>>({});

export function ConHangProvider({ children }: { children: ReactNode }) {
  const [conHang, datConHang] = useState<Record<string, TrangThaiKho>>({});

  useEffect(() => {
    let docLuc = 0;
    let conMo = true;
    async function doc() {
      docLuc = Date.now();
      const moi = await docConHang(CAU_HINH.diaChiConHang, (url, init) => fetch(url, init));
      if (conMo) datConHang(moi);
    }
    function khiHien() {
      if (document.visibilityState === "visible" && Date.now() - docLuc >= DOC_LAI_SAU_MS) void doc();
    }
    void doc();
    document.addEventListener("visibilitychange", khiHien);
    return () => {
      conMo = false;
      document.removeEventListener("visibilitychange", khiHien);
    };
  }, []);

  return <NguCanh.Provider value={conHang}>{children}</NguCanh.Provider>;
}

/** Trạng thái từ kho của từng mã phần thịt; mã không có = không biết. */
export function useConHang(): Record<string, TrangThaiKho> {
  return useContext(NguCanh);
}
