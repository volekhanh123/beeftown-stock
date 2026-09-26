/**
 * KHO — BỘ BIỂU TƯỢNG
 *
 * Nét vẽ 24×24, viền 2px, không tô — vẽ tay đơn giản cho đủ đọc được ở 22px
 * trên điện thoại. Không dùng thư viện biểu tượng nào: không thêm dependency,
 * không tải gì từ ngoài, và không có JavaScript.
 *
 * File thuần (chỉ dữ liệu) để test kiểm được mọi mục menu đều có biểu tượng.
 * Vẽ ra bằng components/kho/BieuTuong.astro.
 */

export const BIEU_TUONG = {
  nha:        '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  viec:       '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17"/>',
  duyet:      '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  quet:       '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8v8M10 8v8M13 8v8M17 8v8"/>',
  ton:        '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  quay:       '<path d="M4 10h16l-1.5-5h-13L4 10z"/><path d="M5 10v9h14v-9"/><path d="M9 19v-5h6v5"/>',
  khac:       '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',
  nhap:       '<path d="M12 3v11"/><path d="M7 9.5l5 5 5-5"/><path d="M4 16v4h16v-4"/>',
  dao:        '<path d="M3 21l6-6"/><path d="M9 15L20 4c1 3.5-.2 6.8-3.2 9.8L13 17.6z"/>',
  chuyen:     '<path d="M4 8h14l-3.5-3.5"/><path d="M20 16H6l3.5 3.5"/>',
  bep:        '<path d="M4 11h16v2a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-2z"/><path d="M2 11h20"/><path d="M9 7c0-1.2 1-1.8 1-3M14 7c0-1.2 1-1.8 1-3"/>',
  huy:        '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
  kiem_ke:    '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 13l2 2 4-4.5"/>',
  cong_no:    '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M15.5 14.5h2"/>',
  bao_cao:    '<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>',
  cai_dat:    '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  chuong:     '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4l2-2z"/><path d="M10 21h4"/>',
  quy_trinh:  '<circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><path d="M6 8v8"/><path d="M11 6h9M11 12h6M11 18h9"/>',
  huong_dan:  '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2.9-1.2 1.8"/><path d="M12 16.8v.2"/>',
  dang_xuat:  '<path d="M15 4h4v16h-4"/><path d="M10 16l4-4-4-4"/><path d="M14 12H4"/>',
  can:        '<path d="M12 4v15M6 20h12"/><path d="M5 7h14"/><path d="M5 7l-3 6h6L5 7zM19 7l-3 6h6l-3-6z"/>',
  nguoi:      '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  lich:       '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  them:       '<path d="M12 5v14M5 12h14"/>',
  tiep:       '<path d="M9 6l6 6-6 6"/>',
  lui:        '<path d="M15 6l-6 6 6 6"/>',
  canh_bao:   '<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5"/><path d="M12 18v.2"/>',
  in:         '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
} as const;

export type TenBieuTuong = keyof typeof BIEU_TUONG;
