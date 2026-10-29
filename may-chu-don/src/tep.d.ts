// Bun nhập file .css bằng `with { type: 'text' }` thành chuỗi (may-chu.ts).
declare module '*.css' { const chu: string; export default chu; }
