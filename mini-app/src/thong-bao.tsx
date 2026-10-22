// Thông báo ngắn ở cuối màn hình (tự tắt sau 2,8 giây).
// Tự làm thay cho snackbar của zmp-ui vì biểu tượng của snackbar tải phông từ máy chủ Zalo.

import React, { createContext, ReactNode, useCallback, useContext, useState } from "react";

type Loai = "error" | "success";
type HamThongBao = (text: string, loai?: Loai) => void;

const NguCanh = createContext<HamThongBao>(() => undefined);

export function ThongBaoProvider({ children }: { children: ReactNode }) {
  const [tb, setTb] = useState<{ text: string; loai: Loai; id: number } | null>(null);

  const hien = useCallback<HamThongBao>((text, loai = "error") => {
    const id = Date.now();
    setTb({ text, loai, id });
    window.setTimeout(() => setTb((cu) => (cu?.id === id ? null : cu)), 2800);
  }, []);

  return (
    <NguCanh.Provider value={hien}>
      {children}
      {tb && (
        <div className={`thong-bao ${tb.loai}`} role="status" aria-live="polite">
          {tb.text}
        </div>
      )}
    </NguCanh.Provider>
  );
}

export function useThongBao(): HamThongBao {
  return useContext(NguCanh);
}
