#!/usr/bin/env python3
"""
DỰNG BIỂU TƯỢNG, HỌA TIẾT VÀ ẢNH CHIA SẺ TỪ CÁC SVG ĐÃ TÁCH
============================================================
    python3 -I tao-bieu-tuong.py <thu-muc-svg-da-tach> <web/public>

Đầu vào là thư mục tach-tu-pdf.py vừa xuất. Đầu ra:
  · <public>/thuong-hieu/*.svg      — chép các tài sản web dùng
  · <public>/thuong-hieu/hoa-van-chu.svg — ô lặp chữ BEEFTOWN (trang 11), một màu,
                                       dùng làm mặt nạ CSS
  · <public>/bieu-tuong.svg         — biểu tượng trình duyệt: brandmark kem trên ô đỏ
  · <public>/thuong-hieu/bieu-tuong-180.png — biểu tượng màn hình chính iPhone
  · <public>/favicon.ico            — 16, 32, 48 px cho trình duyệt cũ / Google
  · <public>/thuong-hieu/chia-se-1200x630.png — ảnh chia sẻ dự phòng: mảng vân mỡ
                                       trang 2 + logo kem, đúng bố cục trang 2 của
                                       PDF. Không ảnh chụp, không ngày, không giá.

Không vẽ lại gì: mọi hình là path gốc, chỉ được đặt vị trí và co giãn.
"""
import re
import shutil
import subprocess
import sys
from pathlib import Path
from PIL import Image

DUNG_TREN_WEB = [
    'logo-ngang-do', 'logo-ngang-kem', 'dau-bo-do', 'dau-bo-kem', 'tem-tron',
    'huong-thao-1', 'huong-thao-2', 'huong-thao-3', 'huong-thao-4', 'huong-thao-5',
    'steak-net-1', 'steak-net-2', 'van-mo', 'van-mo-gan', 'chu-beeftown-nho',
]


def doc(svg):
    s = svg.read_text(encoding='utf-8')
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', s)[1].split()]
    than = re.sub(r'^<svg[^>]*>|</svg>\s*$', '', s.strip())
    than = re.sub(r'<!--.*?-->', '', than)
    return vb, than


def so(v):
    return f'{round(v, 3):.3f}'.rstrip('0').rstrip('.')


def main():
    vao, public = Path(sys.argv[1]), Path(sys.argv[2])
    ra = public / 'thuong-hieu'
    ra.mkdir(parents=True, exist_ok=True)
    ve = Path(__file__).with_name('ve-svg.mjs')

    for ten in DUNG_TREN_WEB:
        shutil.copyfile(vao / f'{ten}.svg', ra / f'{ten}.svg')

    # --- Ô lặp chữ: hai hàng so le, như mẫu giấy gói trang 11 -----------------
    (w, h), than = doc(vao / 'chu-beeftown-nho.svg')[0][2:], doc(vao / 'chu-beeftown-nho.svg')[1]
    than_den = re.sub(r'fill="#[0-9A-Fa-f]{6}"', 'fill="#000"', than)
    o_rong, o_cao = 2 * w + 40, 2 * h + 24
    hoa_van = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {so(o_rong)} {so(o_cao)}" '
        f'width="{so(o_rong)}" height="{so(o_cao)}">'
        '<!-- Ô lặp chữ BEEFTOWN, nét chữ gốc BGBTFILE (2).pdf trang 11. Một màu: dùng làm mặt nạ CSS. -->'
        f'<defs><g id="c">{than_den}</g></defs>'
        '<use href="#c" x="6" y="6"/>'
        f'<use href="#c" x="{so(w + 26)}" y="{so(h + 18)}"/>'
        '</svg>\n')
    (ra / 'hoa-van-chu.svg').write_text(hoa_van, encoding='utf-8')

    # --- Biểu tượng trình duyệt ------------------------------------------------
    (_, _, bw, bh), dau = doc(vao / 'dau-bo-kem.svg')
    co = 52
    k = co / max(bw, bh)
    dx, dy = (64 - bw * k) / 2, (64 - bh * k) / 2 + 1
    bieu_tuong = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">'
        '<!-- Brandmark Beeftown (đầu bò + miếng steak), path gốc BGBTFILE (2).pdf trang 3, kem trên ô đỏ. -->'
        '<rect width="64" height="64" rx="14" fill="#B23A2C"/>'
        f'<g transform="translate({so(dx)} {so(dy)}) scale({so(k)})">{dau}</g>'
        '</svg>\n')
    (public / 'bieu-tuong.svg').write_text(bieu_tuong, encoding='utf-8')

    tam = ra / '.tam'
    tam.mkdir(exist_ok=True)
    try:
        subprocess.run(['node', str(ve), str(public / 'bieu-tuong.svg'), str(ra / 'bieu-tuong-180.png'), '180', '180'],
                       check=True, capture_output=True)
        anh = []
        for c in (16, 32, 48):
            p = tam / f'{c}.png'
            subprocess.run(['node', str(ve), str(public / 'bieu-tuong.svg'), str(p), str(c), str(c)],
                           check=True, capture_output=True)
            anh.append(Image.open(p).convert('RGBA'))
        anh[-1].save(public / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)], append_images=anh[:-1])

        # --- Ảnh chia sẻ: bố cục trang 2 của PDF ------------------------------
        html = tam / 'chia-se.html'
        html.write_text(
            '<!doctype html><html><body style="margin:0;width:1200px;height:630px;overflow:hidden;'
            'position:relative;background:#B23A2C">'
            f'<img src="{(ra / "van-mo.svg").as_uri()}" style="position:absolute;inset:0;width:1200px;height:630px;object-fit:cover">'
            f'<img src="{(ra / "logo-ngang-kem.svg").as_uri()}" style="position:absolute;left:50%;top:50%;'
            'width:620px;transform:translate(-50%,-50%)">'
            '</body></html>', encoding='utf-8')
        subprocess.run(['node', str(ve), str(html), str(ra / 'chia-se-1200x630.png'), '1200', '630'],
                       check=True, capture_output=True)
        # PNG nén lại cho nhẹ: ảnh chỉ có vài màu phẳng.
        og = Image.open(ra / 'chia-se-1200x630.png').convert('RGB')
        og.quantize(colors=64, method=Image.Quantize.MEDIANCUT).save(ra / 'chia-se-1200x630.png', optimize=True)
        Image.open(ra / 'bieu-tuong-180.png').save(ra / 'bieu-tuong-180.png', optimize=True)
    finally:
        shutil.rmtree(tam, ignore_errors=True)

    for f in sorted(list(ra.iterdir()) + [public / 'bieu-tuong.svg', public / 'favicon.ico']):
        print(f'{f.relative_to(public)}  {f.stat().st_size / 1024:.1f} KB')


if __name__ == '__main__':
    main()
