/**
 * ẢNH CỦA TRANG CÔNG KHAI
 * =======================
 * Hai loại ảnh, hai quy tắc:
 *
 *  · ẢNH MINH HỌA (minhHoa: true) — ảnh không khí món ăn tạo bằng công cụ AI
 *    (Higgsfield), Khánh duyệt 06/10/2026: CHỈ dùng cho không khí món (bò trên vỉ
 *    gas, vân thịt, sốt chấm). Trên trang LUÔN có dòng "Ảnh minh họa". Không bao
 *    giờ dùng ảnh AI cho quầy, khay skin-pack, không gian, lối lên hay con người —
 *    những chỗ đó dùng KhungAnh cho tới khi có ảnh chụp thật.
 *  · ẢNH THẬT (minhHoa: false) — ảnh chụp tại Beeftown. Chưa có tấm nào.
 *
 * Cỡ ảnh do web/cong-cu/anh/tao-co-anh.py dựng sẵn vào public/anh/ (avif + webp,
 * nhiều bề rộng) và ghi danh sách vào anh-tao-san.ts. Id có trong DANH_MUC_ANH mà
 * chưa có trong anh-tao-san.ts thì component <Anh> hiện KhungAnh thay vào — trang
 * vẫn đủ, không có ảnh hỏng.
 */
import type { BaThuTieng } from './chu';
import type { NgonNgu } from './noi-dung';
import { ANH_TAO_SAN, type CoAnh } from './anh-tao-san.ts';

export type IdAnh = 'hero-vi-gas' | 'bo-van-mo-can' | 'bo-cat-lat' | 'sot-cham' | 'bo-xeo-vi';

export interface MoTaAnh {
  /** Ảnh tạo bằng AI — trang phải ghi "Ảnh minh họa" ngay trên ảnh. */
  minhHoa: boolean;
  /** Mô tả cho trình đọc màn hình. Tả món, không nói đây là ảnh chụp tại quán. */
  alt: BaThuTieng;
}

export const DANH_MUC_ANH: Readonly<Record<IdAnh, MoTaAnh>> = {
  'hero-vi-gas': {
    minhHoa: true,
    alt: {
      vi: 'Những lát bò có vân mỡ được gắp lên vỉ gang đặt trên bếp gas giữa bàn, bên cạnh chén sốt và rau.',
      en: 'Slices of marbled beef being laid on a cast-iron plate over a tabletop gas grill, with sauces and greens beside it.',
      ko: '테이블 가스 그릴 위 무쇠 판에 마블링이 있는 소고기를 올리는 모습, 옆에 소스와 채소가 있어요.',
    },
  },
  'bo-van-mo-can': {
    minhHoa: true,
    alt: {
      vi: 'Cận cảnh miếng bò sống với vân mỡ trắng mịn, cạnh nhánh hương thảo và muối hạt.',
      en: 'Close-up of a raw beef cut with fine white marbling, beside rosemary and coarse salt.',
      ko: '하얀 마블링이 고르게 퍼진 생 소고기 클로즈업, 옆에 로즈메리와 굵은 소금이 있어요.',
    },
  },
  'bo-cat-lat': {
    minhHoa: true,
    alt: {
      vi: 'Những lát bò sống có vân mỡ xếp trên đĩa đá tối màu.',
      en: 'Thin slices of marbled raw beef arranged on a dark stone plate.',
      ko: '어두운 돌 접시 위에 가지런히 놓인 얇은 마블링 소고기.',
    },
  },
  'sot-cham': {
    minhHoa: true,
    alt: {
      vi: 'Bốn chén sốt chấm nhỏ, rau xanh và kimchi đặt cạnh vỉ nướng.',
      en: 'Four small dipping sauces, fresh greens and kimchi beside the grill.',
      ko: '그릴 옆에 놓인 작은 소스 네 가지와 채소, 김치.',
    },
  },
  'bo-xeo-vi': {
    minhHoa: true,
    alt: {
      vi: 'Lát bò đang xèo trên vỉ gang, mép thịt vàng sậm và một làn hơi nóng.',
      en: 'Beef slices searing on a cast-iron grill plate, edges caramelised, a wisp of steam rising.',
      ko: '무쇠 그릴 위에서 노릇하게 익어 가는 소고기와 피어오르는 김.',
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
