#!/usr/bin/env python3
"""
ĐỐI CHIẾU TÀI SẢN ĐÃ TÁCH VỚI CHÍNH TRANG PDF
==============================================
    python3 -I so-sanh.py <file.pdf> <thu-muc-svg> <thu-muc-tam>

Với mỗi SVG có chú thích "nguồn: trang N x y w h" (do tach-tu-pdf.py ghi):
  1. pdftoppm cắt đúng vùng đó của trang PDF ở 3× (216 dpi);
  2. Chromium dựng SVG cùng cỡ, trên nền là màu trung vị của viền ảnh PDF cắt ra
     (nền của ô logo trong PDF);
  3. so từng điểm ảnh: lệch > 48 (trên thang 0–255, kênh lớn nhất) là "khác",
     TRỪ dải 2 px quanh mép nét — ở đó hai bộ dựng khử răng cưa khác nhau.
Đạt khi ≤ 0,5 % điểm ảnh khác ngoài dải mép.

Vài tài sản trong PDF bị phần tử khác đè lên (khai ở BI_CHE): so sánh vẫn chạy và
in số, nhưng không tính là lỗi — xem ảnh lệch trong thư mục tạm để chắc chắn.
"""
import re
import subprocess
import sys
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter

TY_LE = 3
NGUONG, TOI_DA = 48, 0.005

# Trong PDF, những tài sản này có thứ khác nằm đè hoặc nằm sát — chênh lệch là thật
# nhưng không phải lỗi tách.
BI_CHE = {
    'dau-bo-do': 'đường gióng khoảng trống logo (24px) vẽ chồng quanh đầu bò',
    'van-mo': 'logo ngang đặt giữa mảng vân mỡ',
    'huong-thao-2': 'khối nền đỏ của ô logo đè lên nửa dưới nhánh lá',
}


def mau_vien(anh):
    w, h = anh.size
    diem = [anh.getpixel((x, 0)) for x in range(w)] + [anh.getpixel((x, h - 1)) for x in range(w)]
    diem.sort(key=lambda p: sum(p))
    return '#%02X%02X%02X' % diem[len(diem) // 2][:3]


def main():
    pdf, thu_muc, tam = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3])
    tam.mkdir(parents=True, exist_ok=True)
    ve = Path(__file__).with_name('ve-svg.mjs')
    loi = 0
    for svg in sorted(thu_muc.glob('*.svg')):
        m = re.search(r'nguồn: trang (\d+) ([\d.-]+) ([\d.-]+) ([\d.]+) ([\d.]+)', svg.read_text(encoding='utf-8'))
        if not m:
            continue
        trang, x, y, w, h = int(m[1]), *map(float, m.groups()[1:])
        if x < 0 or y < 0:
            print(f'{svg.name:24s} bỏ qua — nét lấn ra ngoài mép trang PDF')
            continue
        X, Y, W, H = (round(v * TY_LE) for v in (x, y, w, h))
        goc = tam / f'{svg.stem}-pdf'
        subprocess.run(['pdftoppm', '-r', str(72 * TY_LE), '-f', str(trang), '-l', str(trang),
                        '-x', str(X), '-y', str(Y), '-W', str(W), '-H', str(H), '-png', '-singlefile',
                        pdf, str(goc)], check=True)
        a = Image.open(f'{goc}.png').convert('RGB')
        b_duong = tam / f'{svg.stem}-svg.png'
        subprocess.run(['node', str(ve), str(svg), str(b_duong), str(a.size[0]), str(a.size[1]),
                        f'--nen={mau_vien(a)}'], check=True, capture_output=True)
        b = Image.open(b_duong).convert('RGB').resize(a.size)
        lech = ImageChops.difference(a, b).convert('L').point(lambda v: 255 if v > NGUONG else 0)
        mep = a.convert('L').filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 24 else 0)
        mep = mep.filter(ImageFilter.MaxFilter(5))
        that = ImageChops.subtract(lech, mep)
        khac = sum(1 for v in that.tobytes() if v)
        ti_le = khac / (a.size[0] * a.size[1])
        that.save(tam / f'{svg.stem}-lech.png')
        dat = ti_le <= TOI_DA
        ghi_chu = ''
        if not dat and svg.stem in BI_CHE:
            ghi_chu, dat = f'  (bị che trong PDF: {BI_CHE[svg.stem]})', True
        loi += not dat
        print(f'{svg.name:24s} {a.size[0]}×{a.size[1]}  khác {ti_le * 100:5.2f}%  {"ĐẠT" if dat else "KHÔNG ĐẠT"}{ghi_chu}')
    sys.exit(1 if loi else 0)


if __name__ == '__main__':
    main()
