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
