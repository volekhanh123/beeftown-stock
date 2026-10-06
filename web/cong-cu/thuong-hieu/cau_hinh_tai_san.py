"""
Vùng cắt của từng tài sản trong PDF nhận diện BGBTFILE (2).pdf.

Tọa độ là tọa độ trang của `pdftocairo -svg` (trang 3: 1280×1000; trang 2:
1280×720; trang 11: 1276.57×821.7). Số thứ tự phần tử lấy từ
`python3 -I tach-tu-pdf.py <pdf> --liet-ke <trang>`.

Ghi chú về cấu trúc logo trong file gốc: đầu bò gồm một hình KEM ngoài cùng (tạo
viền), một hình ĐỎ, rồi hai mảng KEM có khoét lỗ (mặt và miếng steak) — chi tiết
đỏ lộ ra qua lỗ. Dưới hai mảng kem có hai mảng #F1E4C2 bị che kín (dư từ file in);
bỏ đi không đổi hình nhìn thấy. Chữ tagline có một lớp trắng lót bên dưới cũng bị
che kín — bỏ luôn.
"""

LOT_IN = ['#F1E4C2', '#FFFFFF']   # lớp lót bị che kín trong file in

TAI_SAN = {
    # --- Logo ngang: biến thể có sẵn ở dòng "ứng dụng" trang 3 ----------------
    'logo-ngang-do': {
        'trang': 3, 'vung': (700, 600, 1200, 760),
        'bo_mau': LOT_IN,
        'mo_ta': 'Logo ngang Beeftown, chữ đỏ trên nền kem — trích nguyên vector từ BGBTFILE (2).pdf trang 3',
    },
    'logo-ngang-kem': {
        'trang': 3, 'vung': (60, 600, 560, 760),
        'bo_mau': LOT_IN, 'bo_stt': [145],
        'mo_ta': 'Logo ngang Beeftown, chữ kem trên nền đỏ — trích nguyên vector từ BGBTFILE (2).pdf trang 3',
    },
    # --- Đầu bò (brandmark) ---------------------------------------------------
    'dau-bo-do': {
        'trang': 3, 'chon_stt': [106, 107, 108, 109],
        'mo_ta': 'Brandmark đầu bò + miếng steak, đỏ trên kem — BGBTFILE (2).pdf trang 3',
    },
    'dau-bo-kem': {
        'trang': 3, 'chon_stt': [257, 258, 259, 260],
        'mo_ta': 'Brandmark đầu bò, kem trên đỏ — BGBTFILE (2).pdf trang 3',
    },
    # --- Nét vẽ trang 3: rosemary và miếng steak --------------------------------
    'huong-thao-1': {'trang': 3, 'chon_stt': [2], 'mo_ta': 'Nhánh rosemary — BGBTFILE (2).pdf trang 3'},
    'huong-thao-2': {'trang': 3, 'chon_stt': [4], 'mo_ta': 'Nhánh rosemary — BGBTFILE (2).pdf trang 3'},
    'huong-thao-3': {'trang': 3, 'chon_stt': [6], 'mo_ta': 'Nhánh rosemary — BGBTFILE (2).pdf trang 3'},
    'huong-thao-4': {'trang': 3, 'chon_stt': [373], 'mo_ta': 'Nhánh rosemary — BGBTFILE (2).pdf trang 3'},
    'huong-thao-5': {'trang': 3, 'chon_stt': [3], 'mo_ta': 'Nhánh rosemary — BGBTFILE (2).pdf trang 3'},
    'steak-net-1': {'trang': 3, 'chon_stt': [8], 'mo_ta': 'Nét miếng steak — BGBTFILE (2).pdf trang 3'},
    'steak-net-2': {'trang': 3, 'chon_stt': [1], 'mo_ta': 'Nét miếng steak — BGBTFILE (2).pdf trang 3'},
    # --- Mảng vân mỡ organic trang 2 -------------------------------------------
    'van-mo': {
        'trang': 2, 'chon_stt': [1, 2], 'vung': (0, 0, 1280, 720), 'om_sat': False,
        'mo_ta': 'Mảng vân mỡ organic: đỏ Beeftown trên đỏ đậm — BGBTFILE (2).pdf trang 2',
    },
    'van-mo-gan': {
        'trang': 2, 'chon_stt': [2], 'vung': (0, 0, 1280, 720), 'om_sat': False,
        'mo_ta': 'Riêng các đường vân của mảng vân mỡ (dùng làm mặt nạ CSS) — BGBTFILE (2).pdf trang 2',
    },
    # --- Trang 11: tem tròn, wordmark lặp --------------------------------------
    'tem-tron': {
        'trang': 11, 'chon_stt': [2, 3, 6, 7, 8, 9],
        'mo_ta': 'Tem tròn brandmark — BGBTFILE (2).pdf trang 11',
    },
    'chu-beeftown-nho': {
        'trang': 11, 'chon_stt': list(range(13, 21)),
        'mo_ta': 'Một chữ BEEFTOWN của mẫu lặp — BGBTFILE (2).pdf trang 11',
    },
}
