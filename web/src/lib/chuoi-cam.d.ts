// Kiểu cho chuoi-cam.js. File kia là JavaScript thuần vì máy quét chạy bằng node trần.
export interface MucCam {
  re: RegExp;
  vi_sao: string;
}

export interface ChoCam {
  tim_thay: string;
  vi_sao: string;
}

export const CAM: ReadonlyArray<MucCam>;

export function timChuoiCam(chu: string): ChoCam[];

/** Khoảng giá mỗi người đã duyệt — ngoại lệ duy nhất của mẫu "Giá tiền" (xem chuoi-cam.js). */
export const KHOANG_GIA_DA_DUYET: RegExp;
