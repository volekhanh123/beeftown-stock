/**
 * ẢNH CỦA TRANG CÔNG KHAI
 * =======================
 * Hai loại ảnh, hai quy tắc:
 *
 *  · ẢNH MINH HỌA (minhHoa: true) — ảnh tạo bằng công cụ AI. Tám ảnh hiện có do ChatGPT
 *    tạo ngày 11/10/2026 (gọi qua Codex), Khánh cho đưa lên trang cùng ngày. CHỈ dùng
 *    cho không khí món và bữa ăn: bò trên vỉ gas, vân thịt, lát bò, sốt chấm, bàn ăn
 *    chung. Trên trang LUÔN có dòng "Ảnh minh họa" (component <Anh> tự gắn).
 *      - Bàn tay người trong ảnh thì được; MẶT NGƯỜI thì không.
 *      - Hai ảnh bữa ăn (mon-an-chia-se, bua-an-cung-ban) có kim chi và nhiều chén món
 *        phụ: đó là hình minh họa Khánh cho dùng, KHÔNG phải lời hứa quán dọn đúng các
 *        món đó — câu chữ và alt không kể tên, không hứa món phụ nào.
 *      - Không bao giờ dùng ảnh AI cho quầy, khay skin-pack, không gian quán, lối vào,
 *        thang máy hay mặt người — những chỗ đó dùng KhungAnh cho tới khi có ảnh chụp thật.
 *  · ẢNH THẬT (minhHoa: false) — ảnh chụp tại Beeftown. Chưa có tấm nào.
 *
 * Cỡ ảnh do web/cong-cu/anh/tao-co-anh.py dựng sẵn vào public/anh/ (avif + webp,
 * nhiều bề rộng) và ghi danh sách vào anh-tao-san.ts. Id có trong DANH_MUC_ANH mà
 * chưa có trong anh-tao-san.ts thì component <Anh> hiện KhungAnh thay vào — trang
 * vẫn đủ, không có ảnh hỏng. (bo-xeo-vi đang ở trạng thái đó: ảnh dự phòng, chưa đặt
 * ở trang nào nên chưa dựng cỡ — web/cong-cu/anh/danh-sach.json, mục "du_phong".)
 */
import type { BaThuTieng } from './chu';
import type { NgonNgu } from './noi-dung';
import { ANH_TAO_SAN, type CoAnh } from './anh-tao-san.ts';

export type IdAnh = 'hero-vi-gas' | 'bo-van-mo-can' | 'bo-cat-lat' | 'sot-cham' | 'mon-an-chia-se' | 'bua-an-cung-ban' | 'bo-xeo-vi';

export interface MoTaAnh {
  /** Ảnh tạo bằng AI — trang phải ghi "Ảnh minh họa" ngay trên ảnh. */
  minhHoa: boolean;
  /** Mô tả cho trình đọc màn hình. Tả món, không nói đây là ảnh chụp tại quán. */
  alt: BaThuTieng;
}

export const DANH_MUC_ANH: Readonly<Record<IdAnh, MoTaAnh>> = {
  // Một alt cho cả hai khung. Bản ngang (màn rộng) và bản dọc (điện thoại) là hai file tạo riêng nhưng
  // cùng một cảnh: vỉ lưới thép, bàn tay cầm kẹp từ bên trái, đĩa bò sống, chén sốt, rau xà lách.
  'hero-vi-gas': {
    minhHoa: true,
    alt: {
      vi: 'Một bàn tay cầm kẹp đặt lát bò lên vỉ gas tròn giữa bàn gỗ sáng, cạnh đĩa bò sống, chén sốt và rau xà lách.',
      en: 'A hand with tongs lays a slice of beef on a round gas grill set into a light wood table, beside a plate of raw beef, a bowl of sauce and lettuce.',
      ko: '밝은 나무 테이블 가운데 둥근 가스 그릴 위에 집게로 소고기를 올리는 손, 옆에는 생고기 접시와 소스, 상추가 놓여 있어요.',
    },
  },
  'bo-van-mo-can': {
    minhHoa: true,
    alt: {
      vi: 'Cận cảnh một miếng bò sống dày, vân mỡ trắng xen giữa thớ thịt đỏ, đặt trên giấy lót màu kem.',
      en: 'Close-up of a thick cut of raw beef, white marbling running through the red meat, resting on cream paper.',
      ko: '크림색 종이 위에 놓인 두툼한 생 소고기 한 덩이, 붉은 살 사이로 하얀 마블링이 보여요.',
    },
  },
  'bo-cat-lat': {
    minhHoa: true,
    alt: {
      vi: 'Những lát bò sống có vân mỡ xếp trên đĩa sứ màu kem, bên cạnh là chiếc kẹp gắp.',
      en: 'Slices of marbled raw beef fanned out on a cream ceramic plate, with a pair of tongs beside it.',
      ko: '크림색 도자기 접시에 가지런히 놓인 마블링 생 소고기 슬라이스, 옆에는 집게가 있어요.',
    },
  },
  // Alt không đếm số chén sốt: set sốt thật chưa chốt số loại (test-cong-khai-anh.mjs chặn số lượng món ở mọi alt).
  'sot-cham': {
    minhHoa: true,
    alt: {
      vi: 'Mấy chén sốt chấm đặt trước đĩa bò nướng cắt lát và lá xà lách.',
      en: 'Small bowls of dipping sauce in front of a plate of sliced grilled beef and lettuce leaves.',
      ko: '얇게 썬 구운 소고기와 상추가 담긴 접시 앞에 소스 그릇들이 놓여 있어요.',
    },
  },
  // Hai ảnh bữa ăn: alt tả chung "các chén món phụ", không kể tên từng món — trang không hứa món phụ nào.
  'mon-an-chia-se': {
    minhHoa: true,
    alt: {
      vi: 'Đĩa bò nướng cắt lát đặt giữa bàn gỗ sáng, xung quanh là salad, cơm, canh và các chén món phụ.',
      en: 'A plate of sliced grilled beef in the middle of a light wood table, surrounded by salad, rice, soup and small side dishes.',
      ko: '밝은 나무 테이블 가운데 얇게 썬 구운 소고기 접시, 주위에 샐러드와 밥, 국, 작은 곁들임 그릇들이 놓여 있어요.',
    },
  },
  'bua-an-cung-ban': {
    minhHoa: true,
    alt: {
      vi: 'Nhiều bàn tay cùng gắp bò nướng trên vỉ gas tròn giữa bàn, xung quanh là cơm, rau cuốn và các chén món phụ.',
      en: 'Several hands share grilled beef from a round gas grill in the middle of the table, with rice, lettuce and small side dishes around it.',
      ko: '테이블 가운데 둥근 가스 그릴에서 여러 사람의 손이 구운 소고기를 함께 집고 있고, 주위에 밥과 쌈 채소, 곁들임 그릇들이 놓여 있어요.',
    },
  },
  // Ảnh dự phòng: chưa đặt ở trang nào, chưa dựng cỡ.
  'bo-xeo-vi': {
    minhHoa: true,
    alt: {
      vi: 'Những lát bò đang chín trên vỉ gas tròn viền thép, mặt thịt vàng nâu và một làn hơi nóng.',
      en: 'Slices of beef cooking on a round steel-rimmed gas grill, browned on top, with a wisp of steam.',
      ko: '둥근 가스 그릴 위에서 노릇하게 익어 가는 소고기, 김이 살짝 피어올라요.',
    },
  },
};

/** Cỡ đã dựng của một ảnh ở một khung (vd. '16x9'), hoặc null nếu chưa dựng. */
export function coAnh(id: IdAnh, khung: string): CoAnh | null {
  return (ANH_TAO_SAN as Readonly<Record<string, Readonly<Record<string, CoAnh>>>>)[id]?.[khung] ?? null;
}

export function duongDanAnh(id: IdAnh, khung: string, rong: number, duoi: 'avif' | 'webp'): string {
  return `/anh/${id}-${khung}-${rong}.${duoi}`;
}

export function srcsetAnh(id: IdAnh, khung: string, duoi: 'avif' | 'webp'): string {
  const co = coAnh(id, khung);
  return co ? co.cac.map(r => `${duongDanAnh(id, khung, r, duoi)} ${r}w`).join(', ') : '';
}

export function altAnh(id: IdAnh, ngonNgu: NgonNgu): string {
  return DANH_MUC_ANH[id].alt[ngonNgu];
}
