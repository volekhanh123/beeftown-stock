#!/usr/bin/env python3
"""
DỰNG CỠ ẢNH CHO TRANG CÔNG KHAI
===============================
    python3 -I tao-co-anh.py <thu-muc-anh-goc> [<thu-muc-khac> …]          dựng mọi ảnh trong mục "anh"
    python3 -I tao-co-anh.py <thu-muc-anh-goc> … --chi <id>                chỉ dựng lại một ảnh
    python3 -I tao-co-anh.py <thu-muc-anh-goc> … --chi 'mon-*' --chi 'uong-*'   dựng lại một nhóm ảnh

--chi lặp lại được và nhận dấu * (khớp theo kiểu tên file: 'mon-*' là mọi id bắt đầu bằng "mon-").
Nhiều thư mục ảnh gốc: tìm file gốc lần lượt trong từng thư mục, thấy ở thư mục nào trước thì dùng file đó
(ảnh của từng đợt nằm ở thư mục riêng — xem web/THIET-KE.md mục 7, "Dựng lại cỡ ảnh").

Đầu vào:
  · danh-sach.json (cùng thư mục) — mỗi id của IdAnh (web/src/lib/anh.ts): file gốc, các khung cần
    cắt ('16x9', '4x5', '3x2', '4x3', '1x1'), điểm lấy nét fx, fy và các bề rộng cần xuất. Mục "anh" là
    ảnh đang đặt trên trang (được dựng); mục "du_phong" là ảnh có file gốc nhưng chưa đặt ở trang nào
    (KHÔNG dựng — không để file ảnh chết trong repo).
  · <thu-muc-anh-goc> — file ảnh gốc (PNG của công cụ tạo ảnh, WebP / PNG tách nền, hoặc ảnh chụp), đặt
    tên đúng trường "goc". Thư mục này ở NGOÀI repo: .gitignore chặn *.png, *.jpg, và ảnh gốc không bao
    giờ lên trang.

Đầu ra:
  · web/public/anh/<id>-<khung>-<rộng>.avif và .webp — mỗi file ≤ 300 KB, cả thư mục ≤ 8 MB;
  · web/src/lib/anh-tao-san.ts — danh sách cỡ đã dựng, component <Anh> đọc. Ảnh nào chưa có ở đây thì
    trang hiện KhungAnh thay vào, không bao giờ có thẻ <img> trỏ tới file không có.

Hai loại ảnh, hai đường:

  ẢNH CẮT (mặc định — ảnh có nền: bàn, đĩa, phòng):
  1. Mở bằng Pillow, xoay theo EXIF, đổi sang sRGB theo hồ sơ màu nhúng trong file (ảnh không có hồ sơ
     thì coi là sRGB), dựng lại thành ảnh RGB mới — EXIF, XMP, hồ sơ màu, ghi chú của công cụ tạo ảnh
     đều bị bỏ (Pillow lưu AVIF còn tự chép hồ sơ màu của ảnh nguồn nếu không bỏ trước).
  2. Cắt đúng tỷ lệ khung, tâm vùng cắt đặt ở điểm lấy nét (fx, fy) rồi đẩy vào trong mép ảnh.

  ẢNH TÁCH NỀN (mục "tach_nen" trong danh-sach.json — món đã tách khỏi nền, kênh trong suốt có sẵn bóng
  đổ; trang đặt thẳng lên nền trắng của trang công khai, như ảnh món trên nền trơn của cuốn menu):
  1. Mở như trên nhưng GIỮ kênh trong suốt (đổi màu sang sRGB chỉ trên ba kênh màu).
  2. Cắt sát phần có hình: hộp bao các điểm có độ đục > "nguong_alpha" (mặc định 8 trên 255 — bỏ viền gần
     như vô hình, giữ bóng đổ).
  3. Đặt phần đó vào một khung trong suốt đúng tỷ lệ, KHÔNG phóng to, không cắt: chừa lề "le" (phần của
     bề rộng / chiều cao khung) ở trên, trái, phải và một dải trống "duoi" (phần của chiều cao) ở đáy —
     dải đó là chỗ của nhãn "Ảnh minh họa", để nhãn nằm ngay dưới món chứ không đè lên món. Món nằm giữa
     theo chiều ngang, giữa vùng trên dải đáy theo chiều dọc. Khung đó là "vùng cắt" của bước 3 dưới đây.
     Một khung có thể khai "tach_nen" riêng (chỉ "le", "duoi") đè lên mục chung của ảnh — vd. khung ảnh
     nhỏ 1x1 của hàng món gọn trên điện thoại (128px) cần dải đáy cao hơn để nhãn vẫn nằm dưới món.
  4. Thu nhỏ trên ảnh nhân sẵn độ đục (RGBa) — viền không ám màu của phần trong suốt; điểm trong suốt hẳn
     mang màu 0 (nén nhỏ hơn).

  Chung cho cả hai:
  3. Thu nhỏ bằng LANCZOS về từng bề rộng. Bề rộng lớn hơn vùng cắt thì bỏ — không phóng to; khi đó
     xuất thêm đúng bề rộng của vùng cắt nếu nó lớn hơn cỡ đã giữ từ 15 % trở lên.
  4. Xuất AVIF (chất lượng 55) và WebP (chất lượng 75, method 6). Ảnh tách nền: AVIF 40, WebP 60, kênh
     trong suốt của WebP 50 — món đặt trên nền trơn, không có nền ảnh để che vết nén, vậy mà so bằng mắt ở
     màn 2x (13/10/2026, bản 800px hiện 400px) không thấy khác bản 55 / 75 / 80 ngoài vài hạt tiêu mờ hơn;
     26 ảnh tách nền từ 3,9 MB còn 2,4 MB, nhường chỗ cho ảnh chụp thật sau này. File nào quá 300 KB thì
     hạ chất lượng từng nấc 5 tới sàn (AVIF 30, WebP 45); tới sàn vẫn quá thì KHÔNG thay file cũ của khung
     đó và báo lỗi. Một ảnh có thể khai "chat_luong" riêng (avif, webp) để giữ tổng thư mục dưới 8 MB.
  5. Dựng xong cả khung trong thư mục tạm rồi mới xóa file cũ của khung đó và chép file mới vào: chạy hỏng
     giữa chừng không để lại nửa bộ ảnh.

anh-tao-san.ts luôn được ghi lại từ CHÍNH các file đang có trong public/anh (đọc lại từng file: đúng cỡ,
không còn siêu dữ liệu, màu trung bình) — chạy hai lần cho cùng một kết quả, và --chi một ảnh không làm
mất dòng của ảnh khác. Chạy đủ (không --chi) thì xóa luôn file của khung / ảnh không còn trong mục "anh"
của danh-sach.json (ảnh chuyển sang "du_phong" cũng vậy).

Thoát mã 1 khi: thiếu file gốc, file vượt 300 KB ở chất lượng sàn, tổng vượt 8 MB, file đã xuất sai cỡ
hoặc còn siêu dữ liệu, ảnh tách nền mà file đã xuất mất kênh trong suốt, danh-sach.json khai id không có
trong IdAnh.

Cần: Python 3.11+, Pillow ≥ 11.3 có AVIF và littlecms (bản Pillow cài bằng pip có sẵn cả hai).
Cách đưa ảnh mới lên trang: web/THIET-KE.md, mục "Manifest artwork".
"""
import argparse
import fnmatch
import io
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageCms, ImageOps, ImageStat, features

THU_MUC_WEB = Path(__file__).resolve().parents[2]
THU_MUC_RA = THU_MUC_WEB / 'public' / 'anh'
FILE_TAO_SAN = THU_MUC_WEB / 'src' / 'lib' / 'anh-tao-san.ts'
FILE_ID_ANH = THU_MUC_WEB / 'src' / 'lib' / 'anh.ts'
FILE_DANH_SACH = Path(__file__).resolve().with_name('danh-sach.json')

KHUNG_HOP_LE = {'16x9': (16, 9), '4x5': (4, 5), '3x2': (3, 2), '4x3': (4, 3), '1x1': (1, 1)}
DUOI = ('avif', 'webp')
# (chất lượng bắt đầu, chất lượng sàn) — hạ từng nấc BUOC_HA khi file quá TOI_DA_MOT_FILE.
CHAT_LUONG = {'avif': (55, 30), 'webp': (75, 45)}
BUOC_HA = 5
TOI_DA_MOT_FILE = 300 * 1024
TOI_DA_TONG = 8 * 1024 * 1024
# Vùng cắt nhỏ hơn bề rộng lớn nhất cần xuất: thêm đúng bề rộng vùng cắt khi nó lớn hơn cỡ đã giữ ≥ 15 %.
THEM_CO_GOC_KHI = 1.15
# Ảnh cắt (không khai "tach_nen") mà có nền trong suốt: đặt lên nền trắng của trang công khai (bảng màu
# 22/10/2026) trước khi bỏ kênh alpha. Màu này cũng là nền để tính màu trung bình của ảnh tách nền.
NEN_TRANG = (0xFF, 0xFF, 0xFF, 255)
# Ảnh tách nền: chất lượng bắt đầu (thay cho CHAT_LUONG) và chất lượng kênh trong suốt của WebP (100 = không
# mất mát — bóng đổ mềm không cần tới mức đó). Lý do chọn: đầu file, bước 4.
CHAT_LUONG_TACH_NEN = {'avif': 40, 'webp': 60}
CHAT_LUONG_ALPHA_WEBP = 50
# Ảnh tách nền: điểm có độ đục từ mức này trở xuống (trên 255) coi như trong suốt khi tìm hộp bao phần có hình.
NGUONG_ALPHA = 8

MAU_TEN_FILE = re.compile(r'^(?P<id>[a-z0-9]+(?:-[a-z0-9]+)*)-(?P<khung>\d+x\d+)-(?P<rong>\d+)\.(?P<duoi>avif|webp)$')
MAU_ID = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
SIEU_DU_LIEU = ('exif', 'xmp', 'icc_profile', 'XML:com.adobe.xmp', 'comment')

# Đầu file anh-tao-san.ts — giữ nguyên từng ký tự: khi chưa có ảnh nào, file sinh ra phải giống hệt
# bản rỗng đang có trong repo.
DAU_FILE_TS = """// FILE SINH TỰ ĐỘNG bởi web/cong-cu/anh/tao-co-anh.py — đừng sửa tay.
// Mỗi ảnh: các khung đã cắt (vd. '4x3', '4x5'), cỡ lớn nhất của khung, các bề
// rộng đã xuất (avif + webp) và màu trung bình của ảnh (trang chưa dùng: nền chờ
// của khung ảnh lấy màu trong bảng màu — xem components/Anh.astro).
export interface CoAnh {
  rong: number;
  cao: number;
  cac: readonly number[];
  mau: string;
}

export const ANH_TAO_SAN: Readonly<Record<string, Readonly<Record<string, CoAnh>>>> = """


class LoiDanhSach(Exception):
    pass


# ---------------------------------------------------------------------------
# Đọc và kiểm danh-sach.json
# ---------------------------------------------------------------------------
def doc_id_anh():
    """Các id khai trong `export type IdAnh = 'a' | 'b' …` của web/src/lib/anh.ts."""
    m = re.search(r'export\s+type\s+IdAnh\s*=\s*([^;]+);', FILE_ID_ANH.read_text(encoding='utf-8'))
    if not m:
        raise LoiDanhSach(f'không tìm thấy "export type IdAnh" trong {FILE_ID_ANH}')
    return re.findall(r"'([^']+)'", m[1])


def la_ten_file_tron(ten):
    return isinstance(ten, str) and ten == Path(ten).name and not ten.startswith('.') and ten.strip() == ten and ten


def kiem_le_duoi(noi, tach_nen):
    le, duoi = tach_nen.get('le'), tach_nen.get('duoi')
    if not isinstance(le, (int, float)) or not 0 <= le <= 0.2:
        raise LoiDanhSach(f'{noi}: tach_nen.le (lề trên, trái, phải) phải nằm trong 0..0,2')
    if not isinstance(duoi, (int, float)) or not 0 <= duoi <= 0.4:
        raise LoiDanhSach(f'{noi}: tach_nen.duoi (dải trống ở đáy cho nhãn) phải nằm trong 0..0,4')


def tach_nen_cua_khung(mo_ta, k):
    """Thông số tách nền của một khung: mục chung của ảnh, đè bằng "tach_nen" riêng của khung (nếu có)."""
    chung = mo_ta.get('tach_nen')
    return None if chung is None else {**chung, **k.get('tach_nen', {})}


def doc_danh_sach():
    try:
        du_lieu = json.loads(FILE_DANH_SACH.read_text(encoding='utf-8'))
    except json.JSONDecodeError as e:
        raise LoiDanhSach(f'danh-sach.json không phải JSON hợp lệ: {e}') from e
    anh = du_lieu.get('anh')
    if not isinstance(anh, dict) or not anh:
        raise LoiDanhSach('danh-sach.json thiếu mục "anh"')
    du_phong = du_lieu.get('du_phong', {})
    if not isinstance(du_phong, dict):
        raise LoiDanhSach('danh-sach.json: mục "du_phong" phải là một bảng { id: mô tả }')
    trung = [i for i in du_phong if i in anh]
    if trung:
        raise LoiDanhSach(f'{", ".join(trung)} nằm ở cả "anh" lẫn "du_phong" — mỗi ảnh chỉ ở một mục')
    for id_anh, mo_ta in [*anh.items(), *du_phong.items()]:
        if not MAU_ID.match(id_anh) or re.search(r'\d+x\d+', id_anh):
            raise LoiDanhSach(f'id "{id_anh}": chỉ chữ thường không dấu, số và gạch nối, không chứa dạng "16x9"')
        khung = mo_ta.get('khung')
        if not isinstance(khung, dict) or not khung:
            raise LoiDanhSach(f'{id_anh}: thiếu mục "khung"')
        tach_nen = mo_ta.get('tach_nen')
        if tach_nen is not None:
            if not isinstance(tach_nen, dict):
                raise LoiDanhSach(f'{id_anh}: "tach_nen" phải là {{ "le": …, "duoi": … }}')
            kiem_le_duoi(id_anh, tach_nen)
            nguong = tach_nen.get('nguong_alpha', NGUONG_ALPHA)
            if not isinstance(nguong, int) or not 0 <= nguong <= 254:
                raise LoiDanhSach(f'{id_anh}: tach_nen.nguong_alpha phải là số nguyên 0..254')
            if any('fx' in k or 'fy' in k for k in khung.values()):
                raise LoiDanhSach(f'{id_anh}: ảnh tách nền không cắt nên không có điểm lấy nét fx, fy')
        for ten_khung, k in khung.items():
            rieng = k.get('tach_nen')
            if rieng is None:
                continue
            if tach_nen is None:
                raise LoiDanhSach(f'{id_anh} / {ten_khung}: khai "tach_nen" riêng cho khung mà ảnh không khai "tach_nen"')
            if not isinstance(rieng, dict) or not rieng or set(rieng) - {'le', 'duoi'}:
                raise LoiDanhSach(f'{id_anh} / {ten_khung}: "tach_nen" của khung chỉ có khóa le, duoi')
            kiem_le_duoi(f'{id_anh} / {ten_khung}', {**tach_nen, **rieng})
        chat_luong = mo_ta.get('chat_luong')
        if chat_luong is not None:
            if not isinstance(chat_luong, dict) or set(chat_luong) - set(DUOI):
                raise LoiDanhSach(f'{id_anh}: "chat_luong" chỉ có khóa avif, webp')
            for duoi_tep, v in chat_luong.items():
                if not isinstance(v, int) or not CHAT_LUONG[duoi_tep][1] <= v <= 90:
                    raise LoiDanhSach(f'{id_anh}: chat_luong.{duoi_tep} phải là số nguyên {CHAT_LUONG[duoi_tep][1]}..90')
        for ten_khung, k in khung.items():
            noi = f'{id_anh} / {ten_khung}'
            if ten_khung not in KHUNG_HOP_LE:
                raise LoiDanhSach(f'{noi}: khung chỉ được là {", ".join(KHUNG_HOP_LE)}')
            goc = k.get('goc', mo_ta.get('goc'))
            if not la_ten_file_tron(goc):
                raise LoiDanhSach(f'{noi}: "goc" phải là tên một file trong thư mục ảnh gốc (không có đường dẫn)')
            for truc in ('fx', 'fy'):
                v = k.get(truc, 0.5)
                if not isinstance(v, (int, float)) or not 0 <= v <= 1:
                    raise LoiDanhSach(f'{noi}: {truc} phải nằm trong 0..1')
            rong = k.get('rong')
            if (not isinstance(rong, list) or not rong or any(not isinstance(r, int) or r < 16 for r in rong)
                    or rong != sorted(set(rong))):
                raise LoiDanhSach(f'{noi}: "rong" là danh sách bề rộng (số nguyên ≥ 16) tăng dần, không trùng')
    return anh, list(du_phong)


# ---------------------------------------------------------------------------
# Xử lý ảnh
# ---------------------------------------------------------------------------
_SRGB = ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB'))


def mo_anh_srgb(duong, canh_bao):
    """Ảnh RGB sạch ở không gian sRGB: đã xoay theo EXIF, không còn siêu dữ liệu nào."""
    with Image.open(duong) as nguon:
        nguon.load()
        anh = ImageOps.exif_transpose(nguon)
    icc = anh.info.get('icc_profile')
    if anh.mode in ('RGBA', 'LA', 'PA') or (anh.mode == 'P' and 'transparency' in anh.info):
        tren_nen = Image.new('RGBA', anh.size, NEN_TRANG)
        tren_nen.alpha_composite(anh.convert('RGBA'))
        anh = tren_nen.convert('RGB')
    elif anh.mode not in ('RGB', 'CMYK', 'L'):
        anh = anh.convert('RGB')
    if icc:
        try:
            ho_so = ImageCms.ImageCmsProfile(io.BytesIO(icc))
            anh = ImageCms.profileToProfile(anh, ho_so, _SRGB, renderingIntent=ImageCms.Intent.PERCEPTUAL,
                                            outputMode='RGB')
        except (ImageCms.PyCMSError, OSError, ValueError) as e:
            canh_bao.append(f'{duong.name}: không đọc được hồ sơ màu nhúng ({e}) — coi như sRGB')
    anh = anh.convert('RGB')
    # Ảnh mới hoàn toàn: không mang theo info (EXIF, XMP, ICC, ghi chú PNG) của ảnh nguồn.
    sach = Image.new('RGB', anh.size)
    sach.paste(anh)
    return sach


def mo_anh_tach_nen(duong, canh_bao):
    """Ảnh RGBA sạch ở sRGB, GIỮ kênh trong suốt: đã xoay theo EXIF, không còn siêu dữ liệu nào."""
    with Image.open(duong) as nguon:
        nguon.load()
        anh = ImageOps.exif_transpose(nguon)
    icc = anh.info.get('icc_profile')
    anh = anh.convert('RGBA')
    if 'A' not in anh.getbands() or anh.getchannel('A').getextrema() == (255, 255):
        canh_bao.append(f'{duong.name}: khai "tach_nen" mà ảnh không có vùng trong suốt nào')
    if icc:
        try:
            ho_so = ImageCms.ImageCmsProfile(io.BytesIO(icc))
            mau = ImageCms.profileToProfile(anh.convert('RGB'), ho_so, _SRGB,
                                            renderingIntent=ImageCms.Intent.PERCEPTUAL, outputMode='RGB')
            mau.putalpha(anh.getchannel('A'))
            anh = mau
        except (ImageCms.PyCMSError, OSError, ValueError) as e:
            canh_bao.append(f'{duong.name}: không đọc được hồ sơ màu nhúng ({e}) — coi như sRGB')
    sach = Image.new('RGBA', anh.size)
    sach.paste(anh)
    return sach


def dat_vao_khung(anh, ti_le, le, duoi, nguong):
    """
    Ảnh tách nền → khung trong suốt đúng tỷ lệ, ở đúng cỡ điểm ảnh của ảnh gốc (không phóng to, không cắt):
    phần có hình nằm giữa theo chiều ngang, giữa vùng trên dải đáy theo chiều dọc; lề `le` ở trên, trái,
    phải; dải trống `duoi` ở đáy cho nhãn "Ảnh minh họa". Trả về (khung, hộp phần có hình trên ảnh gốc).
    """
    hop = anh.getchannel('A').point(lambda v: 255 if v > nguong else 0).getbbox()
    if not hop:
        raise ValueError('ảnh trong suốt hoàn toàn — không có phần nào để đặt vào khung')
    phan = anh.crop(hop)
    rong_phan, cao_phan = phan.size
    rx, ry = ti_le
    # Bề rộng khung nhỏ nhất để phần có hình lọt vừa cả hai chiều.
    rong = max(rong_phan / (1 - 2 * le), cao_phan / (1 - le - duoi) * rx / ry)
    rong = int(-(-rong // 1))
    cao = cao_theo_ti_le(rong, ti_le)
    khung = Image.new('RGBA', (rong, cao), (0, 0, 0, 0))
    x = round((rong - rong_phan) / 2)
    tren, vung = le * cao, cao * (1 - le - duoi)
    y = round(tren + (vung - cao_phan) / 2)
    khung.paste(phan, (x, max(0, y)))
    return khung, hop


def vung_cat(rong_goc, cao_goc, ti_le, fx, fy):
    """Hộp cắt (trái, trên, phải, dưới) — số thực, đúng tỷ lệ, tâm gần (fx, fy) nhất có thể."""
    rx, ry = ti_le
    if rong_goc * ry > cao_goc * rx:          # ảnh rộng hơn khung → cắt bớt hai bên
        cao, rong = float(cao_goc), cao_goc * rx / ry
    else:                                      # ảnh cao hơn khung → cắt bớt trên dưới
        rong, cao = float(rong_goc), rong_goc * ry / rx
    trai = min(max(fx * rong_goc - rong / 2, 0.0), rong_goc - rong)
    tren = min(max(fy * cao_goc - cao / 2, 0.0), cao_goc - cao)
    return (trai, tren, trai + rong, tren + cao)


def chon_be_rong(yeu_cau, rong_vung_cat):
    rong_toi_da = int(rong_vung_cat)
    giu = [r for r in yeu_cau if r <= rong_toi_da]
    if not giu or (rong_toi_da < yeu_cau[-1] and rong_toi_da >= giu[-1] * THEM_CO_GOC_KHI):
        giu.append(rong_toi_da)
    return giu


def cao_theo_ti_le(rong, ti_le):
    return max(1, round(rong * ti_le[1] / ti_le[0]))


def ma_hoa(anh, duoi, bat_dau=None):
    """(byte, chất lượng đã dùng). Hạ chất lượng từng nấc khi quá 300 KB, dừng ở sàn."""
    chat_luong, san = CHAT_LUONG[duoi]
    if bat_dau is not None:
        chat_luong = bat_dau
    while True:
        bo_dem = io.BytesIO()
        if duoi == 'avif':
            anh.save(bo_dem, 'AVIF', quality=chat_luong, speed=6)
        elif anh.mode == 'RGBA':
            anh.save(bo_dem, 'WEBP', quality=chat_luong, method=6, alpha_quality=CHAT_LUONG_ALPHA_WEBP)
        else:
            anh.save(bo_dem, 'WEBP', quality=chat_luong, method=6)
        if bo_dem.tell() <= TOI_DA_MOT_FILE or chat_luong - BUOC_HA < san:
            return bo_dem.getvalue(), chat_luong
        chat_luong -= BUOC_HA


def file_cua(id_anh, khung=None):
    """File đã xuất của một ảnh (hoặc một khung của ảnh đó) trong public/anh."""
    if not THU_MUC_RA.is_dir():
        return []
    kq = []
    for f in THU_MUC_RA.iterdir():
        m = MAU_TEN_FILE.match(f.name)
        if m and m['id'] == id_anh and (khung is None or m['khung'] == khung):
            kq.append(f)
    return sorted(kq)


def dung_mot_khung(anh, id_anh, ten_khung, k, dong, tach_nen=None, chat_luong_rieng=None):
    """Dựng mọi bề rộng của một khung vào thư mục tạm; đạt hết thì thay bộ file cũ của khung đó."""
    ti_le = KHUNG_HOP_LE[ten_khung]
    if tach_nen is not None:
        # Ảnh tách nền: khung dựng từ phần có hình (không cắt) — cả khung là "vùng cắt".
        anh, hop_hinh = dat_vao_khung(anh, ti_le, tach_nen['le'], tach_nen['duoi'],
                                      tach_nen.get('nguong_alpha', NGUONG_ALPHA))
        hop = (0, 0, anh.width, anh.height)
        dong['cat'] = (f'khung {anh.width}×{anh.height} quanh phần có hình '
                       f'{hop_hinh[2] - hop_hinh[0]}×{hop_hinh[3] - hop_hinh[1]}')
        # Thu nhỏ trên ảnh nhân sẵn độ đục: viền không ám màu của vùng trong suốt.
        anh = anh.convert('RGBa')
    else:
        hop = vung_cat(anh.width, anh.height, ti_le, k.get('fx', 0.5), k.get('fy', 0.5))
        dong['cat'] = f'{round(hop[2] - hop[0])}×{round(hop[3] - hop[1])} @({round(hop[0])},{round(hop[1])})'
    rong_cat = hop[2] - hop[0]
    cac_rong = chon_be_rong(k['rong'], rong_cat)
    if cac_rong != k['rong']:
        dong['ghi_chu'].append(f'ảnh gốc nhỏ: xuất {"/".join(map(str, cac_rong))} thay vì {"/".join(map(str, k["rong"]))}')
    tam = Path(tempfile.mkdtemp(prefix='tao-co-anh-'))
    try:
        vuot = []
        for rong in cac_rong:
            nho = anh.resize((rong, cao_theo_ti_le(rong, ti_le)), Image.Resampling.LANCZOS, box=hop)
            if nho.mode == 'RGBa':
                nho = nho.convert('RGBA')
            for duoi in DUOI:
                bat_dau = (chat_luong_rieng or {}).get(duoi)
                if bat_dau is None and tach_nen is not None:
                    bat_dau = CHAT_LUONG_TACH_NEN[duoi]
                du_lieu, chat_luong = ma_hoa(nho, duoi, bat_dau)
                (tam / f'{id_anh}-{ten_khung}-{rong}.{duoi}').write_bytes(du_lieu)
                dong['chat_luong'][duoi] = min(dong['chat_luong'].get(duoi, 100), chat_luong)
                if len(du_lieu) > TOI_DA_MOT_FILE:
                    vuot.append(f'{id_anh}-{ten_khung}-{rong}.{duoi} {len(du_lieu) / 1024:.0f} KB')
        if vuot:
            dong['loi'].append('vượt 300 KB ở chất lượng sàn, giữ nguyên bản cũ: ' + '; '.join(vuot))
            return
        THU_MUC_RA.mkdir(parents=True, exist_ok=True)
        for cu in file_cua(id_anh, ten_khung):
            cu.unlink()
        for moi in sorted(tam.iterdir()):
            shutil.copyfile(moi, THU_MUC_RA / moi.name)
    finally:
        shutil.rmtree(tam, ignore_errors=True)


# ---------------------------------------------------------------------------
# Đọc lại public/anh → anh-tao-san.ts
# ---------------------------------------------------------------------------
def mau_trung_binh(anh):
    """Màu trung bình; ảnh có kênh trong suốt thì tính khi đặt lên nền trắng (như trên trang)."""
    if anh.mode in ('RGBA', 'LA', 'PA'):
        tren_nen = Image.new('RGBA', anh.size, NEN_TRANG)
        tren_nen.alpha_composite(anh.convert('RGBA'))
        anh = tren_nen
    nho = anh.convert('RGB')
    nho.thumbnail((64, 64), Image.Resampling.BOX)
    return '#' + ''.join(f'{round(v):02X}' for v in ImageStat.Stat(nho).mean[:3])


def kiem_file(f, rong, ti_le, loi, tach_nen=False):
    """Mở lại một file đã xuất: đúng bề rộng, đúng tỷ lệ, không còn siêu dữ liệu; ảnh tách nền còn kênh
    trong suốt. Trả về ảnh đã nạp."""
    with Image.open(f) as a:
        a.load()
        if a.width != rong or abs(a.height - rong * ti_le[1] / ti_le[0]) > 1:
            loi.append(f'{f.name}: cỡ {a.width}×{a.height} không khớp tên file / tỷ lệ khung')
        if tach_nen and (a.mode != 'RGBA' or a.getchannel('A').getextrema()[0] > 0):
            loi.append(f'{f.name}: ảnh tách nền mà file đã xuất không còn vùng trong suốt (chế độ {a.mode})')
        con = [k for k in SIEU_DU_LIEU if a.info.get(k)] + (['exif'] if len(a.getexif()) and 'exif' not in a.info else [])
        if con:
            loi.append(f'{f.name}: còn siêu dữ liệu ({", ".join(con)})')
        if f.stat().st_size > TOI_DA_MOT_FILE:
            loi.append(f'{f.name}: {f.stat().st_size / 1024:.0f} KB — quá 300 KB')
        return a.copy()


def doc_lai_da_dung(danh_sach, loi):
    """{id: {khung: {rong, cao, cac, mau, kb_avif, kb_webp}}} theo đúng thứ tự trong danh-sach.json."""
    kq = {}
    for id_anh, mo_ta in danh_sach.items():
        for ten_khung in mo_ta['khung']:
            ti_le = KHUNG_HOP_LE[ten_khung]
            co = {}
            for f in file_cua(id_anh, ten_khung):
                co.setdefault(int(MAU_TEN_FILE.match(f.name)['rong']), {})[f.suffix[1:]] = f
            cac = []
            for rong in sorted(co):
                if set(co[rong]) != set(DUOI):
                    loi.append(f'{id_anh}-{ten_khung}-{rong}: chỉ có {", ".join(co[rong])} — cần đủ avif và webp')
                    continue
                cac.append(rong)
            if not cac:
                continue
            lon_nhat = None
            tach_nen = mo_ta.get('tach_nen') is not None
            for rong in cac:
                kiem_file(co[rong]['avif'], rong, ti_le, loi, tach_nen)
                lon_nhat = kiem_file(co[rong]['webp'], rong, ti_le, loi, tach_nen)
            kq.setdefault(id_anh, {})[ten_khung] = {
                'rong': lon_nhat.width, 'cao': lon_nhat.height, 'cac': cac, 'mau': mau_trung_binh(lon_nhat),
                'kb_avif': co[cac[-1]]['avif'].stat().st_size / 1024,
                'kb_webp': co[cac[-1]]['webp'].stat().st_size / 1024,
            }
    return kq


def viet_tao_san(da_dung):
    if not da_dung:
        than = '{};\n'
    else:
        dong = ['{']
        for id_anh, cac_khung in da_dung.items():
            dong.append(f"  '{id_anh}': {{")
            for ten_khung, c in cac_khung.items():
                dong.append(f"    '{ten_khung}': {{ rong: {c['rong']}, cao: {c['cao']}, "
                            f"cac: [{', '.join(map(str, c['cac']))}], mau: '{c['mau']}' }},")
            dong.append('  },')
        dong.append('};')
        than = '\n'.join(dong) + '\n'
    noi_dung = DAU_FILE_TS + than
    if FILE_TAO_SAN.exists() and FILE_TAO_SAN.read_text(encoding='utf-8') == noi_dung:
        return False
    tam = FILE_TAO_SAN.with_name(FILE_TAO_SAN.name + '.tam')
    tam.write_text(noi_dung, encoding='utf-8')
    tam.replace(FILE_TAO_SAN)
    return True


def chua_ghi_nguon(mo_ta):
    """nguon.da_chon còn trống (null, hoặc một khung nào đó còn null): chưa ghi bản ảnh nào được chọn."""
    da_chon = mo_ta.get('nguon', {}).get('da_chon')
    if isinstance(da_chon, dict):
        return not da_chon or any(v is None for v in da_chon.values())
    return da_chon is None


# ---------------------------------------------------------------------------
def main():
    p = argparse.ArgumentParser(description='Dựng cỡ ảnh của trang công khai (avif + webp) và ghi anh-tao-san.ts.')
    p.add_argument('thu_muc_goc', type=Path, nargs='+',
                   help='thư mục chứa ảnh gốc, tên file đúng trường "goc" của danh-sach.json (nhiều thư mục: tìm lần lượt)')
    p.add_argument('--chi', action='append', metavar='ID',
                   help="chỉ dựng lại id này (lặp lại được; nhận dấu *, vd. 'mon-*')")
    tham_so = p.parse_args()

    if not (features.check('avif') and features.check('webp') and features.check('littlecms2')):
        sys.exit('Pillow thiếu AVIF, WebP hoặc littlecms — cài lại: python3 -m pip install -U Pillow')
    try:
        danh_sach, du_phong = doc_danh_sach()
        id_hop_le = doc_id_anh()
    except LoiDanhSach as e:
        sys.exit(f'LỖI danh-sach.json: {e}')
    la = [i for i in [*danh_sach, *du_phong] if i not in id_hop_le]
    if la:
        sys.exit(f'LỖI: {", ".join(la)} không có trong IdAnh ({FILE_ID_ANH.relative_to(THU_MUC_WEB.parent)}) — '
                 'thêm vào IdAnh và DANH_MUC_ANH (kèm alt vi/en/ko) trước')
    chua_khai = [i for i in id_hop_le if i not in danh_sach and i not in du_phong]

    if tham_so.chi:
        sai = [m for m in tham_so.chi if not fnmatch.filter(danh_sach, m)]
        if sai:
            sys.exit(f'LỖI: --chi {", ".join(sai)} không khớp id nào trong mục "anh" của danh-sach.json')
        chon = [i for i in danh_sach if any(fnmatch.fnmatchcase(i, m) for m in tham_so.chi)]
    else:
        chon = list(danh_sach)
    khong_co = [str(d) for d in tham_so.thu_muc_goc if not d.is_dir()]
    if khong_co:
        sys.exit(f'LỖI: không thấy thư mục ảnh gốc {", ".join(khong_co)}')

    def tim_goc(ten):
        """File gốc ở thư mục đầu tiên có nó (thứ tự trên dòng lệnh)."""
        return next((d / ten for d in tham_so.thu_muc_goc if (d / ten).is_file()), None)

    loi, canh_bao, cac_dong = [], [], []
    for id_anh in chon:
        mo_ta = danh_sach[id_anh]
        tach_nen = mo_ta.get('tach_nen')
        da_mo = {}
        for ten_khung, k in mo_ta['khung'].items():
            ten_goc = k.get('goc', mo_ta.get('goc'))
            dong = {'id': id_anh, 'khung': ten_khung, 'goc': ten_goc, 'co_goc': '', 'cat': '',
                    'chat_luong': {}, 'ghi_chu': [], 'loi': []}
            cac_dong.append(dong)
            duong = tim_goc(ten_goc)
            if duong is None:
                dong['loi'].append(f'thiếu file gốc {ten_goc} — giữ nguyên cỡ đã dựng (nếu có)')
                continue
            try:
                if ten_goc not in da_mo:
                    da_mo[ten_goc] = mo_anh_tach_nen(duong, canh_bao) if tach_nen else mo_anh_srgb(duong, canh_bao)
                anh = da_mo[ten_goc]
                dong['co_goc'] = f'{anh.width}×{anh.height}'
                dung_mot_khung(anh, id_anh, ten_khung, k, dong, tach_nen_cua_khung(mo_ta, k), mo_ta.get('chat_luong'))
            except (OSError, ValueError, Image.DecompressionBombError) as e:
                dong['loi'].append(f'không đọc / xuất được {ten_goc}: {e}')
        # Khung không còn khai trong danh-sach.json: dọn file của nó.
        for f in file_cua(id_anh):
            if MAU_TEN_FILE.match(f.name)['khung'] not in mo_ta['khung']:
                f.unlink()
                canh_bao.append(f'xóa {f.name} — khung không còn trong danh-sach.json')
    if not tham_so.chi and THU_MUC_RA.is_dir():
        for f in sorted(THU_MUC_RA.iterdir()):
            m = MAU_TEN_FILE.match(f.name)
            if f.suffix in ('.avif', '.webp') and (not m or m['id'] not in danh_sach):
                f.unlink()
                canh_bao.append(f'xóa {f.name} — không thuộc ảnh nào trong mục "anh" của danh-sach.json')

    loi_doc_lai = []
    da_dung = doc_lai_da_dung(danh_sach, loi_doc_lai)
    da_doi = viet_tao_san(da_dung)

    # --- Bảng kết quả ------------------------------------------------------------
    tieu_de = ('ảnh', 'khung', 'gốc', 'vùng cắt', 'bề rộng', 'avif lớn nhất', 'webp lớn nhất', 'chất lượng', 'màu')
    hang = []
    for d in cac_dong:
        c = da_dung.get(d['id'], {}).get(d['khung'])
        cl = d['chat_luong']
        hang.append((d['id'], d['khung'], d['co_goc'] or '—', d['cat'] or '—',
                     '/'.join(map(str, c['cac'])) if c else '—',
                     f"{c['kb_avif']:.0f} KB" if c else '—', f"{c['kb_webp']:.0f} KB" if c else '—',
                     f"avif {cl['avif']} · webp {cl['webp']}" if cl else '—', c['mau'] if c else '—'))
    rong_cot = [max(len(str(x)) for x in cot) for cot in zip(tieu_de, *hang)]

    def in_dong(cot):
        print('  '.join(str(x).ljust(w) for x, w in zip(cot, rong_cot)).rstrip())

    in_dong(tieu_de)
    in_dong(['─' * w for w in rong_cot])
    for h in hang:
        in_dong(h)

    tong = sum(f.stat().st_size for f in THU_MUC_RA.iterdir() if f.suffix in ('.avif', '.webp')) if THU_MUC_RA.is_dir() else 0
    so_file = len([f for f in THU_MUC_RA.iterdir() if f.suffix in ('.avif', '.webp')]) if THU_MUC_RA.is_dir() else 0
    print(f'\npublic/anh: {so_file} file, tổng {tong / 1024 / 1024:.2f} MB (tối đa 8 MB)')
    print(f'anh-tao-san.ts: {"đã ghi lại" if da_doi else "không đổi"} — '
          f'{sum(len(v) for v in da_dung.values())} khung của {len(da_dung)} ảnh')

    for d in cac_dong:
        for g in d['ghi_chu']:
            print(f"  ghi chú {d['id']} / {d['khung']}: {g}")
        for e in d['loi']:
            loi.append(f"{d['id']} / {d['khung']}: {e}")
    loi.extend(loi_doc_lai)
    if tong > TOI_DA_TONG:
        loi.append(f'public/anh tổng {tong / 1024 / 1024:.2f} MB — quá 8 MB: bớt bề rộng hoặc bớt khung trong danh-sach.json')
    for c in canh_bao:
        print(f'  cảnh báo: {c}')
    if du_phong:
        print(f'  dự phòng, không dựng cỡ (chưa đặt ở trang nào): {", ".join(du_phong)}')
    if chua_khai:
        print(f'  cảnh báo: IdAnh có {", ".join(chua_khai)} nhưng danh-sach.json chưa khai — trang hiện KhungAnh ở đó')
    chua_chon = [i for i in chon if chua_ghi_nguon(danh_sach[i])]
    if chua_chon:
        print(f'  nhắc: ghi bản ảnh đã chọn vào nguon.da_chon cho {", ".join(chua_chon)} (manifest đọc từ đó)')
    if loi:
        print('\nLỖI:')
        for e in loi:
            print(f'  · {e}')
        sys.exit(1)
    print('\nĐạt: mọi file ≤ 300 KB, tổng ≤ 8 MB, không còn siêu dữ liệu.')


if __name__ == '__main__':
    main()
