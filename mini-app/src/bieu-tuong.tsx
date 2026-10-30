// Biểu tượng vẽ sẵn bằng SVG, không phụ thuộc phông biểu tượng tải từ máy chủ của Zalo.

import React from "react";

const net = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function MuiTenTrai({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...net} strokeWidth={2.4}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ThongTinTron({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...net}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <path d="M12 7.5v.01" strokeWidth={2.8} />
    </svg>
  );
}

export function KhungChat({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...net}>
      <path d="M4 12c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5-3.6 7.5-8 7.5c-1.2 0-2.3-.2-3.3-.6L4.5 20.5l1.2-3.6C4.6 15.6 4 13.9 4 12z" />
      <path d="M8.5 11h7M8.5 14h4.5" />
    </svg>
  );
}

export function DauTich({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...net} strokeWidth={2.4}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
