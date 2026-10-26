#!/usr/bin/env python3
"""
DỰNG BIỂU TƯỢNG TRÌNH DUYỆT, BIỂU TƯỢNG APP VÀ ẢNH CHIA SẺ TỪ LOGO MỚI (21/10/2026)
================================================================================
    python3 -I tao-bieu-tuong.py <web/public>

Đầu vào là các SVG tach-logo.mjs đã ghi vào <web/public>/thuong-hieu/ (path gốc của
BEEFTOWN_Brand_Guidelines.pdf): dau-bo-do.svg (brandmark: ô đỏ bo góc, đầu bò trắng),
net-dau-bo.svg (riêng đầu bò, trắng), logo-ngang-trang.svg (logo chính trắng). Đầu ra:
  · <public>/bieu-tuong.svg         — biểu tượng trình duyệt: brandmark giữa ô 64 × 64
  · <public>/favicon.ico            — 16, 32, 48 px cho trình duyệt cũ / Google
  · <public>/thuong-hieu/chia-se-1200x630.png — ảnh chia sẻ dự phòng: logo chính trắng giữa
                                       nền đỏ, đúng cách dùng "trắng trên đỏ" của guideline
                                       (trang 4). Không ảnh chụp, không ngày, không giá.
  · biểu tượng cài như app (xem dung_bieu_tuong_app):
      <public>/thuong-hieu/bieu-tuong-180.png — màn hình chính iPhone, trang công khai
      <public>/kho/bieu-tuong-{180,192,512,maskable-512}.png — app kho; bản 192 còn là
                                       biểu tượng BeeftownCan.exe (can-app/scripts/dong-goi.ts)

Không vẽ lại gì: mọi hình là path gốc, chỉ được đặt vị trí và co giãn. Màu là màu của chính
các SVG đầu vào (đỏ #BD0000, trắng). Chạy lại cho cùng kết quả.
"""
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from PIL import Image

VE = Path(__file__).with_name('ve-svg.mjs')
# Bảng màu Khánh chốt ngày 22/10/2026 (THUONG-HIEU.md ở thư mục gốc).
DO = '#BD0000'
# Biểu tượng maskable: Android cắt theo hình tròn / bo tròn tùy máy, chỉ chắc giữ được
# hình tròn đường kính 80% cạnh (vùng an toàn, chuẩn W3C). Giữ CẢ khung bao của
# đầu bò trong hình tròn 78% — chừa 2% cho điểm khử răng cưa ở mép.
VUNG_AN_TOAN, VUNG_GIU = 0.80, 0.78


def doc(svg):
    """viewBox (x, y, rộng, cao) và phần thân (bỏ thẻ <svg> và chú thích) của một SVG."""
    s = svg.read_text(encoding='utf-8')
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', s)[1].split()]
    than = re.sub(r'^<svg[^>]*>|</svg>\s*$', '', s.strip())
    than = re.sub(r'<!--.*?-->', '', than)
    return vb, than


def so(v):
    return f'{round(v, 3):.3f}'.rstrip('0').rstrip('.')


def dat_giua(than, bw, bh, canh, rong_toi_da, cao_toi_da):
    """Nhóm <g> co hình (bw × bh) vừa khung rong_toi_da × cao_toi_da, đặt giữa ô canh × canh."""
    k = min(rong_toi_da / bw, cao_toi_da / bh)
    dx, dy = (canh - bw * k) / 2, (canh - bh * k) / 2
    return f'<g transform="translate({so(dx)} {so(dy)}) scale({so(k)})">{than}</g>'


def brandmark_64(public):
    """Brandmark (ô đỏ bo góc + đầu bò trắng) giữa ô 64 × 64 trong suốt — cạnh dài chạm mép."""
    (_, _, bw, bh), than = doc(public / 'thuong-hieu' / 'dau-bo-do.svg')
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">'
        '<!-- Brandmark Beeftown (ô đỏ bo góc, đầu bò trắng) — path gốc BEEFTOWN_Brand_Guidelines.pdf (21/10/2026), '
        'dựng bằng web/cong-cu/thuong-hieu/tao-bieu-tuong.py -->'
        + dat_giua(than, bw, bh, 64, 64, 64) + '</svg>\n')


def dau_bo_tren_nen_do(public, ty_le_cao):
    """Đầu bò trắng giữa ô đỏ PHỦ KÍN 64 × 64 (không điểm trong suốt): cao bằng ty_le_cao cạnh ô."""
    (_, _, bw, bh), than = doc(public / 'thuong-hieu' / 'net-dau-bo.svg')
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">'
        f'<rect width="64" height="64" fill="{DO}"/>'
        + dat_giua(than, bw, bh, 64, 64, 64 * ty_le_cao) + '</svg>\n')


def ty_le_cao_maskable(public):
    """Tỷ lệ cao (so với cạnh ô) lớn nhất để cả bốn góc khung bao đầu bò nằm trong hình tròn VUNG_GIU."""
    (_, _, bw, bh), _ = doc(public / 'thuong-hieu' / 'net-dau-bo.svg')
    # Nửa đường chéo khung bao (cao = t, rộng = t·bw/bh) phải ≤ VUNG_GIU / 2.
    return round((VUNG_GIU / 2) / ((1 + (bw / bh) ** 2) ** 0.5 / 2), 3) - 0.001


def ve_png(vao, ra, rong, cao=None):
    kq = subprocess.run(['node', str(VE), str(vao), str(ra), str(rong), str(cao or rong)],
                        capture_output=True, text=True)
    if kq.returncode != 0:
        # Thường là máy chưa có Playwright / Chromium — in nguyên lời báo của node.
        sys.exit(f've-svg.mjs không dựng được {Path(vao).name}:\n{kq.stderr.strip()}')


# Đầu bò của brandmark cao khoảng 86% ô (guideline trang 5). Biểu tượng iPhone phủ kín nền đỏ
# giữ đúng tỷ lệ đó: iPhone bo góc khoảng 22% cạnh, sừng bò vẫn nằm trong phần còn lại.
TY_LE_CAO_IPHONE = 0.86


def dung_bieu_tuong_app(public):
    """Biểu tượng cài như app:
      · kho 192, 512 — y hệt bieu-tuong.svg (brandmark, góc trong suốt): Chrome / Android
        hiện nguyên. Bản 192 còn được bọc vào .ico của BeeftownCan.exe (khai 32 bit → RGBA).
      · 180 (kho + trang công khai) — nền đỏ PHỦ KÍN, không trong suốt: iPhone tự bo góc và
        tô ĐEN chỗ trong suốt.
      · kho maskable 512 — nền đỏ phủ kín, đầu bò co lại vừa vùng an toàn.
    Kiểm cỡ, độ phủ, vùng an toàn: crm/test/test-kho-giao-dien.mjs, nhóm 7."""
    kho = public / 'kho'
    ra = [
        # (svg, cạnh, kiểu ảnh, các file đích)
        (brandmark_64(public), 192, 'RGBA', [kho / 'bieu-tuong-192.png']),
        (brandmark_64(public), 512, 'RGBA', [kho / 'bieu-tuong-512.png']),
        (dau_bo_tren_nen_do(public, TY_LE_CAO_IPHONE), 180, 'RGB',
         [kho / 'bieu-tuong-180.png', public / 'thuong-hieu' / 'bieu-tuong-180.png']),
        (dau_bo_tren_nen_do(public, ty_le_cao_maskable(public)), 512, 'RGB', [kho / 'bieu-tuong-maskable-512.png']),
    ]
    with tempfile.TemporaryDirectory() as tam:
        for i, (svg, canh, kieu, dich) in enumerate(ra):
            vao, png = Path(tam) / f'{i}.svg', Path(tam) / f'{i}.png'
            vao.write_text(svg, encoding='utf-8')
            ve_png(vao, png, canh)
            anh = Image.open(png).convert(kieu)
            for d in dich:
                d.parent.mkdir(parents=True, exist_ok=True)
                anh.save(d, optimize=True)
                print(f'{d.relative_to(public)}  {canh}×{canh} {kieu}  {d.stat().st_size / 1024:.1f} KB')


def main():
    if len(sys.argv) != 2:
        sys.exit('Cách dùng: python3 -I tao-bieu-tuong.py <web/public>')
    # resolve(): ảnh chia sẻ dựng từ đường dẫn file:// — đường dẫn tương đối (../../public) không đổi được.
    public = Path(sys.argv[1]).resolve()
    ra = public / 'thuong-hieu'

    # --- Biểu tượng trình duyệt ------------------------------------------------
    (public / 'bieu-tuong.svg').write_text(brandmark_64(public), encoding='utf-8')

    with tempfile.TemporaryDirectory() as tam:
        tam = Path(tam)
        anh = []
        for c in (16, 32, 48):
            p = tam / f'{c}.png'
            ve_png(public / 'bieu-tuong.svg', p, c)
            anh.append(Image.open(p).convert('RGBA'))
        anh[-1].save(public / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)], append_images=anh[:-1])

        # --- Ảnh chia sẻ: logo chính trắng trên nền đỏ (guideline trang 4) ----------
        html = tam / 'chia-se.html'
        html.write_text(
            '<!doctype html><html><body style="margin:0;width:1200px;height:630px;overflow:hidden;'
            f'position:relative;background:{DO}">'
            f'<img src="{(ra / "logo-ngang-trang.svg").as_uri()}" style="position:absolute;left:50%;top:50%;'
            'width:680px;transform:translate(-50%,-50%)">'
            '</body></html>', encoding='utf-8')
        ve_png(html, ra / 'chia-se-1200x630.png', 1200, 630)
        # PNG nén lại cho nhẹ: ảnh chỉ có hai màu phẳng và mép khử răng cưa.
        og = Image.open(ra / 'chia-se-1200x630.png').convert('RGB')
        og.quantize(colors=64, method=Image.Quantize.MEDIANCUT).save(ra / 'chia-se-1200x630.png', optimize=True)

    dung_bieu_tuong_app(public)

    for f in sorted([ra / 'chia-se-1200x630.png', public / 'bieu-tuong.svg', public / 'favicon.ico']):
        print(f'{f.relative_to(public)}  {f.stat().st_size / 1024:.1f} KB')


if __name__ == '__main__':
    main()
