#!/usr/bin/env python3
"""
DỰNG BIỂU TƯỢNG, HỌA TIẾT VÀ ẢNH CHIA SẺ TỪ CÁC SVG ĐÃ TÁCH
============================================================
    python3 -I tao-bieu-tuong.py <thu-muc-svg-da-tach> <web/public>
    python3 -I tao-bieu-tuong.py --chi-bieu-tuong-app <web/public>

Đầu vào là thư mục tach-tu-pdf.py vừa xuất (SVG mang mã màu của PDF nhận diện). Đầu ra:
  · <public>/thuong-hieu/*.svg      — chép các tài sản web dùng, đổi mã màu của PDF sang bảng
                                       màu thương hiệu đã chốt (DOI_MAU). Hình không đổi.
  · <public>/thuong-hieu/hoa-van-chu.svg — ô lặp chữ BEEFTOWN (trang 11), một màu,
                                       dùng làm mặt nạ CSS
  · <public>/bieu-tuong.svg         — biểu tượng trình duyệt: brandmark kem trên ô đỏ
  · <public>/favicon.ico            — 16, 32, 48 px cho trình duyệt cũ / Google
  · <public>/thuong-hieu/chia-se-1200x630.png — ảnh chia sẻ dự phòng: mảng vân mỡ
                                       trang 2 + logo kem, đúng bố cục trang 2 của
                                       PDF. Không ảnh chụp, không ngày, không giá.
  · biểu tượng cài như app (xem dung_bieu_tuong_app):
      <public>/thuong-hieu/bieu-tuong-180.png — màn hình chính iPhone, trang công khai
      <public>/kho/bieu-tuong-{180,192,512,maskable-512}.png — app kho; bản 192 còn là
                                       biểu tượng BeeftownCan.exe (can-app/scripts/dong-goi.ts)

--chi-bieu-tuong-app chỉ dựng lại các biểu tượng cài như app, từ
<public>/thuong-hieu/dau-bo-kem.svg đã có trong repo — không cần PDF.

Không vẽ lại gì: mọi hình là path gốc, chỉ được đặt vị trí, co giãn và đổi mã màu.

Chạy lại trên chính các SVG đã đổi màu (chép web/public/thuong-hieu ra một thư mục tạm rồi
đưa thư mục đó làm đầu vào) cho cùng kết quả: bảng DOI_MAU không còn gì để đổi.
"""
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from PIL import Image

VE = Path(__file__).with_name('ve-svg.mjs')
# Bảng màu thương hiệu Khánh chốt ngày 09/10/2026 (THUONG-HIEU.md ở thư mục gốc).
DO = '#A70C0C'
# Mã màu trong PDF nhận diện → mã của bảng đã chốt. tach-tu-pdf.py giữ đúng mã của PDF để
# so-sanh.py đối chiếu được từng điểm ảnh; việc đổi màu chỉ làm ở bước chép này.
DOI_MAU = {
    '#B23A2C': '#A70C0C',   # Beef Red
    '#960F13': '#890607',   # đỏ đậm: đường vân mỡ, vòng trong của tem
    '#FBF4E1': '#F0E3D0',   # Cream
    '#F1E4C2': '#E7D5BC',   # kem đậm (lớp lót logo)
}
# Guideline: cả logo một màu đỏ. Trong logo ngang của PDF, dòng "Pick it – Grill it – Love it"
# là đỏ đậm; trên web nó cùng màu với chữ BEEFTOWN.
DOI_MAU_RIENG = {'logo-ngang-do': {'#960F13': '#A70C0C'}}
# Ô đỏ của biểu tượng trình duyệt: brandmark dài 52 trong ô 64, bo góc 14.
CO_BRANDMARK, BO_GOC = 52, 14
# Biểu tượng maskable: Android cắt theo hình tròn / bo tròn tùy máy, chỉ chắc giữ được
# hình tròn đường kính 80% cạnh (vùng an toàn, chuẩn W3C). Giữ CẢ khung bao của
# brandmark trong hình tròn 78% — chừa 2% cho điểm khử răng cưa ở mép.
VUNG_AN_TOAN, VUNG_GIU = 0.80, 0.78

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


def doi_mau(svg, ten):
    """Đổi mọi mã màu của PDF trong một SVG sang bảng đã chốt. Mã không có trong bảng giữ nguyên."""
    bang = {**DOI_MAU, **DOI_MAU_RIENG.get(ten, {})}
    return re.sub(r'#[0-9A-Fa-f]{6}\b', lambda m: bang.get(m[0].upper(), m[0]), svg)


def o_do(dau, bw, bh, co=CO_BRANDMARK, bo_goc=BO_GOC):
    """Brandmark kem giữa ô đỏ 64×64. co: cạnh dài của brandmark trong ô;
    bo_goc = 0: ô phủ kín, không trong suốt (iPhone tự bo góc; maskable)."""
    k = co / max(bw, bh)
    # +1: hạ brandmark 1/64 ô, đúng bố cục bieu-tuong.svg từ trước.
    dx, dy = (64 - bw * k) / 2, (64 - bh * k) / 2 + 1
    rx = f' rx="{so(bo_goc)}"' if bo_goc else ''
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">'
        '<!-- Brandmark Beeftown (đầu bò + miếng steak), path gốc BGBTFILE (2).pdf trang 3, kem trên ô đỏ. -->'
        f'<rect width="64" height="64"{rx} fill="{DO}"/>'
        f'<g transform="translate({so(dx)} {so(dy)}) scale({so(k)})">{dau}</g>'
        '</svg>\n')


def co_maskable(bw, bh):
    """Cạnh dài lớn nhất của brandmark (trong ô 64) để góc xa nhất của khung bao,
    tính cả độ hạ +1 của o_do, còn nằm trong hình tròn VUNG_GIU."""
    ban_kinh = VUNG_GIU * 64 / 2
    co = 64.0
    while co > 0:
        k = co / max(bw, bh)
        if ((bw * k / 2) ** 2 + (bh * k / 2 + 1) ** 2) ** 0.5 <= ban_kinh:
            return round(co, 1)
        co -= 0.1
    raise ValueError('brandmark không vừa vùng an toàn')


def ve_png(vao, ra, canh):
    kq = subprocess.run(['node', str(VE), str(vao), str(ra), str(canh), str(canh)], capture_output=True, text=True)
    if kq.returncode != 0:
        # Thường là máy chưa có Playwright / Chromium — in nguyên lời báo của node.
        sys.exit(f've-svg.mjs không dựng được {Path(vao).name}:\n{kq.stderr.strip()}')


def dung_bieu_tuong_app(public):
    """Biểu tượng cài như app, cùng brandmark với bieu-tuong.svg:
      · kho 192, 512 — y hệt bieu-tuong.svg (ô đỏ bo góc, góc trong suốt): Chrome / Android
        hiện nguyên. Bản 192 còn được bọc vào .ico của BeeftownCan.exe (khai 32 bit → RGBA).
      · 180 (kho + trang công khai) — ô đỏ PHỦ KÍN, không trong suốt: iPhone tự bo góc và
        tô ĐEN chỗ trong suốt.
      · kho maskable 512 — nền đỏ phủ kín, brandmark co lại theo co_maskable.
    Kiểm cỡ, độ phủ, vùng an toàn: crm/test/test-kho-giao-dien.mjs, nhóm 7."""
    (_, _, bw, bh), dau = doc(public / 'thuong-hieu' / 'dau-bo-kem.svg')
    kho = public / 'kho'
    ra = [
        # (svg, cạnh, kiểu ảnh, các file đích)
        (o_do(dau, bw, bh), 192, 'RGBA', [kho / 'bieu-tuong-192.png']),
        (o_do(dau, bw, bh), 512, 'RGBA', [kho / 'bieu-tuong-512.png']),
        (o_do(dau, bw, bh, bo_goc=0), 180, 'RGB',
         [kho / 'bieu-tuong-180.png', public / 'thuong-hieu' / 'bieu-tuong-180.png']),
        (o_do(dau, bw, bh, co=co_maskable(bw, bh), bo_goc=0), 512, 'RGB', [kho / 'bieu-tuong-maskable-512.png']),
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
    if len(sys.argv) == 3 and sys.argv[1] == '--chi-bieu-tuong-app':
        dung_bieu_tuong_app(Path(sys.argv[2]).resolve())
        return
    # resolve(): ảnh chia sẻ dựng từ đường dẫn file:// — đường dẫn tương đối (../../public) không đổi được.
    vao, public = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
    ra = public / 'thuong-hieu'
    ra.mkdir(parents=True, exist_ok=True)

    for ten in DUNG_TREN_WEB:
        (ra / f'{ten}.svg').write_text(doi_mau((vao / f'{ten}.svg').read_text(encoding='utf-8'), ten), encoding='utf-8')

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
    (_, _, bw, bh), dau = doc(ra / 'dau-bo-kem.svg')   # bản đã đổi màu
    (public / 'bieu-tuong.svg').write_text(o_do(dau, bw, bh), encoding='utf-8')

    tam = ra / '.tam'
    tam.mkdir(exist_ok=True)
    try:
        anh = []
        for c in (16, 32, 48):
            p = tam / f'{c}.png'
            subprocess.run(['node', str(VE), str(public / 'bieu-tuong.svg'), str(p), str(c), str(c)],
                           check=True, capture_output=True)
            anh.append(Image.open(p).convert('RGBA'))
        anh[-1].save(public / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)], append_images=anh[:-1])

        # --- Ảnh chia sẻ: bố cục trang 2 của PDF ------------------------------
        html = tam / 'chia-se.html'
        html.write_text(
            '<!doctype html><html><body style="margin:0;width:1200px;height:630px;overflow:hidden;'
            f'position:relative;background:{DO}">'
            f'<img src="{(ra / "van-mo.svg").as_uri()}" style="position:absolute;inset:0;width:1200px;height:630px;object-fit:cover">'
            f'<img src="{(ra / "logo-ngang-kem.svg").as_uri()}" style="position:absolute;left:50%;top:50%;'
            'width:620px;transform:translate(-50%,-50%)">'
            '</body></html>', encoding='utf-8')
        subprocess.run(['node', str(VE), str(html), str(ra / 'chia-se-1200x630.png'), '1200', '630'],
                       check=True, capture_output=True)
        # PNG nén lại cho nhẹ: ảnh chỉ có vài màu phẳng.
        og = Image.open(ra / 'chia-se-1200x630.png').convert('RGB')
        og.quantize(colors=64, method=Image.Quantize.MEDIANCUT).save(ra / 'chia-se-1200x630.png', optimize=True)
    finally:
        shutil.rmtree(tam, ignore_errors=True)

    dung_bieu_tuong_app(public)

    for f in sorted(list(ra.iterdir()) + [public / 'bieu-tuong.svg', public / 'favicon.ico']):
        print(f'{f.relative_to(public)}  {f.stat().st_size / 1024:.1f} KB')


if __name__ == '__main__':
    main()
