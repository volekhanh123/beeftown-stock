#!/usr/bin/env python3
"""
TÁCH TÀI SẢN THƯƠNG HIỆU TỪ PDF NHẬN DIỆN
=========================================
PDF nhận diện Beeftown (BGBTFILE) xuất từ Adobe Illustrator: logo, nét rosemary,
nét miếng steak, mảng "vân mỡ" và tem tròn đều là VECTOR. Script này lấy nguyên
hình học đó ra thành SVG sạch — không vẽ lại, không gõ lại chữ.

    python3 -I tach-tu-pdf.py <file.pdf> --liet-ke <trang>
        In từng phần tử của trang: số thứ tự, màu, khung bao. Dùng để chọn vùng cắt.

    python3 -I tach-tu-pdf.py <file.pdf> <thu-muc-ra>
        Xuất mọi tài sản khai trong TAI_SAN bên dưới.

Cách làm:
  1. `pdftocairo -svg` dựng trang thành SVG. Cairo chỉ dùng lệnh M/L/C/Z tuyệt
     đối, transform dạng matrix(...), và chữ là <use> trỏ tới glyph trong <defs>.
  2. Làm phẳng: nhân dồn transform, thay mỗi <use> bằng chính đường nét của glyph
     — wordmark "BEEFTOWN" vì vậy vẫn là nét chữ GỐC của file thiết kế.
  3. Tính khung bao từng phần tử, giữ phần tử nằm trong vùng cắt, bỏ nền.
  4. Viết SVG với viewBox ôm sát, tọa độ làm tròn 2 số lẻ.

Không cần thư viện ngoài: chỉ Python chuẩn và poppler (pdftocairo).
"""
import math
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

SVG = '{http://www.w3.org/2000/svg}'
XLINK = '{http://www.w3.org/1999/xlink}'

# ---------------------------------------------------------------------------
# Ma trận 2D dạng (a, b, c, d, e, f) như SVG
# ---------------------------------------------------------------------------
DON_VI = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


def nhan(m, n):
    """m · n — áp n trước, rồi m."""
    a, b, c, d, e, f = m
    a2, b2, c2, d2, e2, f2 = n
    return (a * a2 + c * b2, b * a2 + d * b2,
            a * c2 + c * d2, b * c2 + d * d2,
            a * e2 + c * f2 + e, b * e2 + d * f2 + f)


def ap(m, x, y):
    a, b, c, d, e, f = m
    return (a * x + c * y + e, b * x + d * y + f)


def doc_transform(chuoi):
    if not chuoi:
        return DON_VI
    m = DON_VI
    for ten, so in re.findall(r'(\w+)\s*\(([^)]*)\)', chuoi):
        v = [float(x) for x in re.split(r'[\s,]+', so.strip()) if x]
        if ten == 'matrix':
            n = tuple(v)
        elif ten == 'translate':
            n = (1, 0, 0, 1, v[0], v[1] if len(v) > 1 else 0)
        elif ten == 'scale':
            n = (v[0], 0, 0, v[1] if len(v) > 1 else v[0], 0, 0)
        else:
            raise ValueError(f'transform chưa hỗ trợ: {ten}')
        m = nhan(m, n)
    return m


# ---------------------------------------------------------------------------
# Đường nét: chỉ M/L/C/Z tuyệt đối (đầu ra của cairo)
# ---------------------------------------------------------------------------
def doc_duong(d):
    """Trả về danh sách (lệnh, [(x, y), ...])."""
    token = re.findall(r'[MLCZmlcz]|-?[\d.]+(?:e-?\d+)?', d)
    lenh, i, kq = None, 0, []
    while i < len(token):
        t = token[i]
        if t in 'MLCZ':
            lenh = t
            i += 1
            if t == 'Z':
                kq.append(('Z', []))
            continue
        if t in 'mlcz':
            raise ValueError('lệnh tương đối — cairo không xuất loại này')
        so = 2 if lenh in 'ML' else 6
        v = [float(x) for x in token[i:i + so]]
        kq.append((lenh, [(v[k], v[k + 1]) for k in range(0, so, 2)]))
        i += so
        if lenh == 'M':
            lenh = 'L'
    return kq


def bien_doi_duong(lenh_ds, m):
    return [(l, [ap(m, x, y) for x, y in diem]) for l, diem in lenh_ds]


def khung_bao(lenh_ds):
    xs = [x for _, diem in lenh_ds for x, _ in diem]
    ys = [y for _, diem in lenh_ds for _, y in diem]
    if not xs:
        return None
    return (min(xs), min(ys), max(xs), max(ys))


def viet_duong(lenh_ds, dx, dy, k=1.0):
    def s(v):
        r = f'{round(v, 2):.2f}'.rstrip('0').rstrip('.')
        return '0' if r == '-0' else r
    phan = []
    for l, diem in lenh_ds:
        if l == 'Z':
            phan.append('Z')
        else:
            phan.append(l + ' '.join(f'{s((x - dx) * k)} {s((y - dy) * k)}' for x, y in diem))
    return ''.join(phan)


# ---------------------------------------------------------------------------
# Làm phẳng một trang
# ---------------------------------------------------------------------------
def mau(chuoi):
    """'rgb(69.8%, 22.7%, 17.2%)' → '#B23A2C'."""
    if not chuoi or chuoi == 'none':
        return None
    m = re.match(r'rgb\(([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)%\)', chuoi)
    if not m:
        return chuoi
    return '#' + ''.join(f'{round(float(v) * 2.55):02X}' for v in m.groups())


def lam_phang(svg_text):
    goc = ET.fromstring(svg_text)
    glyph = {}
    for g in goc.iter(SVG + 'g'):
        gid = g.get('id', '')
        if gid.startswith('glyph-'):
            p = g.find(SVG + 'path')
            glyph[gid] = doc_duong(p.get('d')) if p is not None and p.get('d') else []
    phan_tu = []

    def di(nut, m, kieu):
        tag = nut.tag.replace(SVG, '')
        if tag in ('defs', 'clipPath', 'mask', 'symbol'):
            return
        if nut.get('id', '').startswith('glyph-'):
            return
        m = nhan(m, doc_transform(nut.get('transform')))
        kieu = dict(kieu)
        for k in ('fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width',
                  'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'opacity'):
            if nut.get(k) is not None:
                kieu[k] = nut.get(k)
        if nut.get('clip-path'):
            kieu['co-clip'] = True
        if tag == 'path' and nut.get('d'):
            ds = bien_doi_duong(doc_duong(nut.get('d')), m)
            them(ds, kieu, m)
        elif tag == 'use':
            ref = nut.get(XLINK + 'href', '').lstrip('#')
            if ref in glyph:
                x = float(nut.get('x', 0))
                y = float(nut.get('y', 0))
                mg = nhan(m, (1, 0, 0, 1, x, y))
                them(bien_doi_duong(glyph[ref], mg), kieu, mg)
        elif tag == 'rect':
            x, y = float(nut.get('x', 0)), float(nut.get('y', 0))
            w, h = float(nut.get('width', 0)), float(nut.get('height', 0))
            ds = [('M', [(x, y)]), ('L', [(x + w, y)]), ('L', [(x + w, y + h)]), ('L', [(x, y + h)]), ('Z', [])]
            them(bien_doi_duong(ds, m), kieu, m)
        elif tag == 'image':
            kieu['la-anh'] = True
        for con in nut:
            di(con, m, kieu)

    def them(ds, kieu, m):
        kb = khung_bao(ds)
        if not kb:
            return
        ty_le = math.sqrt(abs(m[0] * m[3] - m[1] * m[2]))
        phan_tu.append({
            'stt': len(phan_tu),
            'd': ds,
            'kb': kb,
            'fill': mau(kieu.get('fill', 'rgb(0%,0%,0%)')),
            'fill-rule': kieu.get('fill-rule'),
            'stroke': mau(kieu.get('stroke')),
            'stroke-width': float(kieu['stroke-width']) * ty_le if kieu.get('stroke-width') else None,
            'stroke-linecap': kieu.get('stroke-linecap'),
            'stroke-linejoin': kieu.get('stroke-linejoin'),
            'opacity': kieu.get('fill-opacity') if kieu.get('fill-opacity') not in (None, '1') else None,
            'co-clip': kieu.get('co-clip', False),
        })

    di(goc, DON_VI, {})
    rong = float(re.sub(r'[^\d.]', '', goc.get('width')))
    cao = float(re.sub(r'[^\d.]', '', goc.get('height')))
    return phan_tu, rong, cao


def svg_trang(pdf, trang):
    return subprocess.run(['pdftocairo', '-svg', '-f', str(trang), '-l', str(trang), pdf, '-'],
                          check=True, capture_output=True, text=True).stdout


# ---------------------------------------------------------------------------
# Tài sản cần xuất
# ---------------------------------------------------------------------------
# vung: (x0, y0, x1, y1) theo tọa độ trang SVG của pdftocairo.
# Phần tử được giữ khi khung bao của nó nằm TRỌN trong vùng (cho phép lố 0,5).
# bo_mau: màu tô bị bỏ (nền). bo_stt: số thứ tự phần tử bị bỏ (đường gióng, nền).
# doi_mau: đổi màu khi xuất (chỉ dùng cho bản "mặt nạ" một màu).
# dem: khoảng chừa quanh viewBox.
TAI_SAN = {}


def xuat(phan_tu, ten, cau_hinh, thu_muc):
    x0, y0, x1, y1 = cau_hinh.get('vung', (0, 0, 0, 0))
    lo = cau_hinh.get('lo', 0.5)
    bo_mau = {m.upper() for m in cau_hinh.get('bo_mau', [])}
    bo_stt = set(cau_hinh.get('bo_stt', []))
    chon_stt = cau_hinh.get('chon_stt')
    doi_mau = {k.upper(): v for k, v in cau_hinh.get('doi_mau', {}).items()}
    giu = []
    for p in phan_tu:
        a, b, c, d = p['kb']
        if chon_stt is not None:
            if p['stt'] not in chon_stt:
                continue
        elif not (a >= x0 - lo and b >= y0 - lo and c <= x1 + lo and d <= y1 + lo):
            continue
        if p['stt'] in bo_stt or (p['fill'] or '').upper() in bo_mau and not p['stroke']:
            continue
        giu.append(p)
    if not giu:
        raise SystemExit(f'{ten}: vùng cắt không có phần tử nào')
    dem = cau_hinh.get('dem', 0)
    if cau_hinh.get('om_sat', True):
        ax = min(p['kb'][0] - (p['stroke-width'] or 0) / 2 for p in giu) - dem
        ay = min(p['kb'][1] - (p['stroke-width'] or 0) / 2 for p in giu) - dem
        bx = max(p['kb'][2] + (p['stroke-width'] or 0) / 2 for p in giu) + dem
        by = max(p['kb'][3] + (p['stroke-width'] or 0) / 2 for p in giu) + dem
    else:
        ax, ay, bx, by = x0, y0, x1, y1
    k = cau_hinh.get('ty_le', 1.0)
    w, h = (bx - ax) * k, (by - ay) * k

    def s(v):
        return f'{round(v, 2):.2f}'.rstrip('0').rstrip('.')

    # Gộp các path liền nhau cùng kiểu tô thành một path — file nhỏ hơn nhiều.
    nhom = []
    for p in giu:
        fill = p['fill']
        stroke = p['stroke']
        if fill:
            fill = doi_mau.get(fill.upper(), fill)
        if stroke:
            stroke = doi_mau.get(stroke.upper(), stroke)
        if stroke and p.get('fill') in (None, 'none'):
            fill = None
        khoa = (fill, p['fill-rule'], stroke, p['stroke-width'], p['stroke-linecap'], p['stroke-linejoin'], p['opacity'])
        if nhom and nhom[-1][0] == khoa:
            nhom[-1][1].append(p)
        else:
            nhom.append((khoa, [p]))
    dong = []
    for (fill, rule, stroke, sw, cap, join, op), ds in nhom:
        thuoc_tinh = [f'd="{"".join(viet_duong(p["d"], ax, ay, k) for p in ds)}"']
        thuoc_tinh.append(f'fill="{fill}"' if fill else 'fill="none"')
        if rule and rule != 'nonzero' and fill:
            thuoc_tinh.append(f'fill-rule="{rule}"')
        if op:
            thuoc_tinh.append(f'fill-opacity="{op}"')
        if stroke:
            thuoc_tinh.append(f'stroke="{stroke}" stroke-width="{s(sw * k)}"')
            if cap and cap != 'butt':
                thuoc_tinh.append(f'stroke-linecap="{cap}"')
            if join and join != 'miter':
                thuoc_tinh.append(f'stroke-linejoin="{join}"')
        dong.append(f'<path {" ".join(thuoc_tinh)}/>')
    mo_ta = cau_hinh.get('mo_ta', '')
    # Vùng nguồn trên trang — so-sanh.py dùng để cắt đúng chỗ đó từ PDF mà đối chiếu.
    nguon = f'trang {cau_hinh["trang"]} {s(ax)} {s(ay)} {s(bx - ax)} {s(by - ay)}'
    noi_dung = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {s(w)} {s(h)}" width="{s(w)}" height="{s(h)}">'
        + (f'<!-- {mo_ta} · nguồn: {nguon} -->' if mo_ta else f'<!-- nguồn: {nguon} -->')
        + ''.join(dong) + '</svg>\n')
    ra = Path(thu_muc) / f'{ten}.svg'
    ra.write_text(noi_dung, encoding='utf-8')
    print(f'{ten}.svg  {len(giu):4d} phần tử  {s(w)}×{s(h)}  {len(noi_dung) / 1024:.1f} KB')


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        raise SystemExit(2)
    pdf = sys.argv[1]
    if sys.argv[2] == '--liet-ke':
        trang = int(sys.argv[3])
        phan_tu, rong, cao = lam_phang(svg_trang(pdf, trang))
        print(f'trang {trang}: {rong}×{cao}, {len(phan_tu)} phần tử')
        for p in phan_tu:
            a, b, c, d = p['kb']
            print(f"{p['stt']:4d} fill={p['fill']} stroke={p['stroke']} sw={p['stroke-width'] and round(p['stroke-width'], 2)}"
                  f" kb=({a:.1f},{b:.1f})-({c:.1f},{d:.1f}) {c - a:.1f}×{d - b:.1f}{' CLIP' if p['co-clip'] else ''}")
        return
    thu_muc = Path(sys.argv[2])
    thu_muc.mkdir(parents=True, exist_ok=True)
    chi = set(sys.argv[3:])
    cache = {}
    from cau_hinh_tai_san import TAI_SAN as CAU_HINH  # noqa: E402  (file cạnh bên)
    for ten, ch in CAU_HINH.items():
        if chi and ten not in chi:
            continue
        if ch['trang'] not in cache:
            cache[ch['trang']] = lam_phang(svg_trang(pdf, ch['trang']))[0]
        xuat(cache[ch['trang']], ten, ch, thu_muc)


if __name__ == '__main__':
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    main()
