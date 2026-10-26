/**
 * BẢNG CÔNG TẮC — đọc và ghi
 *
 * Toàn bộ luật về ai được làm gì nằm trong database (RLS 0010 + trigger +
 * hàm dat_noi_dung của 0015). File này chỉ dịch giữa form HTML và lời gọi
 * RPC, và cố ý KHÔNG tự kiểm tra quyền lần nữa — một bản sao của luật đặt ở
 * đây sẽ lệch khỏi bản gốc, và lúc đó không ai biết bản nào đúng.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { dichMotCau, type NgonNguDich, type SoBanDich } from './ban-dich';
import { dichNB, type HaiThuTieng, type NgonNguNB } from './ngon-ngu-noi-bo';
import { dichCau, moTaKhoa } from './cau-noi-bo';
import { CAU_MAT_MANG_GHI, laLoiMang } from './qua-tai';

/** Câu của file này ở hai thứ tiếng giao diện nội bộ (lib/ngon-ngu-noi-bo.ts). */
const CAU = {
  dangBat:    { vi: 'Đang bật', en: 'On' },
  dangTat:    { vi: 'Đang tắt', en: 'Off' },
  daGanAnh:   { vi: 'Đã gắn ảnh', en: 'Photo attached' },
  daGo:       { vi: (ten: string) => `Đã gỡ "${ten}" khỏi trang công khai.`,
                en: (ten: string) => `Removed "${ten}" from the public site.` },
  chuaNgay:   { vi: 'Chưa chọn ngày.', en: 'No date chosen.' },
  chiSo:      { vi: 'Chỉ nhận chữ số.', en: 'Digits only.' },
  chuaAnh:    { vi: 'Chưa chọn ảnh.', en: 'No photo chosen.' },
  chuaNoiDung:{ vi: 'Chưa điền nội dung.', en: 'Nothing entered.' },
  daCongBo:   { vi: (ten: string) => `Đã công bố "${ten}". Trang công khai đổi ngay bây giờ.`,
                en: (ten: string) => `Published "${ten}". The public site changes right now.` },
  daLuuNhap:  { vi: (ten: string) => `Đã lưu nháp "${ten}". Bản nháp KHÔNG hiện trên trang.`,
                en: (ten: string) => `Saved "${ten}" as a draft. Drafts do NOT show on the site.` },
  luuY:       { vi: (cau: string, ds: string) => `${cau} Lưu ý — ${ds}. Trang của thứ tiếng đó tạm hiện bản kế tiếp; bấm lưu lại sau để thử dịch lại.`,
                en: (cau: string, ds: string) => `${cau} Note — ${ds}. That language's page shows the next language for now; save again later to retry the translation.` },
  banEn:      { vi: 'Bản tiếng Anh', en: 'The English version' },
  banKo:      { vi: 'Bản tiếng Hàn', en: 'The Korean version' },
  biChan:     { vi: 'bị chặn', en: 'was blocked' },
  chuaDich:   { vi: 'chưa dịch được', en: 'could not be translated' },
  khongQuyen: { vi: 'Tài khoản của bạn không có quyền làm việc này.', en: 'Your account is not allowed to do this.' },
  khongGhi:   { vi: 'Không ghi được. Thông tin CHƯA được lưu.', en: 'Could not save. Nothing has been saved.' },
} satisfies Record<string, HaiThuTieng<unknown>>;

export type KieuCongBo = 'van_ban' | 'ngay' | 'so' | 'bool' | 'url' | 'sdt' | 'tep';

export interface HangCongTac {
  khoa: string;
  kieu: KieuCongBo;
  nhom: string;
  mo_ta: string;
  bat_buoc: boolean;
  chi_chu_so_huu: boolean;
  thu_tu: number;
  dang_song: boolean;
  gia_tri_text: string | null;
  gia_tri_text_en: string | null;
  gia_tri_text_ko: string | null;
  gia_tri_ngay: string | null;
  gia_tri_so: number | null;
  gia_tri_bool: boolean | null;
  gia_tri_tep_id: string | null;
  cong_bo_luc: string | null;
  ly_do: string | null;
  /** Sổ bản dịch của phiên bản đang sống (0036). null khi khóa chưa công bố. */
  ban_dich: SoBanDich | null;
}

/** Tên nhóm hiện cho người dùng, kèm một câu nói nhóm đó dùng để làm gì. */
export const NHOM: Record<string, { ten: HaiThuTieng; dan: HaiThuTieng }> = {
  trang_thai: {
    ten: { vi: 'Trạng thái và khối nội dung', en: 'Status and content blocks' },
    dan: { vi: 'Bật một khối là thêm nó vào trang. Tắt là gỡ khỏi trang ngay lập tức.',
           en: 'Turning a block on adds it to the site. Turning it off removes it right away.' },
  },
  lien_he: {
    ten: { vi: 'Liên hệ', en: 'Contact' },
    dan: { vi: 'Mỗi dòng ở đây bật một nút trên trang. Chưa công bố thì trang KHÔNG hiện nút — một nút dẫn tới hư không tệ hơn không có nút.',
           en: 'Each row here turns on a button on the site. Until it is published the site shows NO button — a button that leads nowhere is worse than no button.' },
  },
  lich: {
    ten: { vi: 'Ngày tháng', en: 'Dates' },
    dan: { vi: 'Chỉ công bố khi đã chắc. Ngày sai trên trang thì gỡ bằng nút "Gỡ khỏi trang", không cần soạn ngày mới trước.',
           en: 'Publish only when certain. If a date on the site is wrong, take it down with "Remove from site" — no need to prepare a new date first.' },
  },
  chia_se: {
    ten: { vi: 'Xem trước khi chia sẻ link', en: 'Link-sharing preview' },
    dan: { vi: 'Thứ hiện ra khi ai đó dán link Beeftown vào Zalo, Messenger hay Facebook.',
           en: 'What appears when someone pastes a Beeftown link into Zalo, Messenger or Facebook.' },
  },
  khoi: {
    ten: { vi: 'Khối nội dung', en: 'Content blocks' },
    dan: { vi: 'Các phần lớn của trang.', en: 'The big sections of the site.' },
  },
  // Mua thịt về (0101): công tắc hien_mua_thit_ve là công tắc HIỆU LỰC — trang chỉ mở khi đủ ba điều kiện (mô tả khóa).
  mua_thit: {
    ten: { vi: 'Mua thịt về', en: 'Take-home orders' },
    dan: { vi: 'Chữ và công tắc của trang Mua thịt về. Chưa công bố thì trang ẩn phần đó hoặc hiện câu mặc định. Không ghi số tiền vào các ô chữ.',
           en: 'Text and switches of the Take home page. Until published, the page hides that part or shows the default sentence. Do not write amounts of money in the text fields.' },
  },
};

export async function docBangCongTac(client: SupabaseClient): Promise<HangCongTac[]> {
  const { data, error } = await client
    .from('v_bang_cong_tac')
    .select('*')
    .order('thu_tu', { ascending: true })
    .order('khoa', { ascending: true });
  if (error) throw error;
  return (data ?? []) as HangCongTac[];
}

/** Giá trị đang sống, dưới dạng chuỗi để đổ vào ô nhập. */
export function giaTriHienTai(h: HangCongTac): string {
  if (!h.dang_song) return '';
  switch (h.kieu) {
    case 'ngay': return h.gia_tri_ngay ?? '';
    case 'so':   return h.gia_tri_so === null ? '' : String(h.gia_tri_so);
    case 'bool': return h.gia_tri_bool ? 'bat' : 'tat';
    case 'tep':  return h.gia_tri_tep_id ?? '';
    default:     return h.gia_tri_text ?? '';
  }
}

/** Câu mô tả giá trị đang sống, cho người đọc lướt. */
export function motaGiaTri(h: HangCongTac, nn: NgonNguNB = 'vi'): string | null {
  if (!h.dang_song) return null;
  const t = dichNB(nn, CAU);
  switch (h.kieu) {
    case 'bool': return h.gia_tri_bool ? t.dangBat : t.dangTat;
    case 'ngay': return h.gia_tri_ngay;
    case 'so':   return h.gia_tri_so === null ? null : String(h.gia_tri_so);
    case 'tep':  return h.gia_tri_tep_id ? t.daGanAnh : null;
    default: {
      const phan = [h.gia_tri_text];
      if (h.gia_tri_text_en) phan.push(`EN: ${h.gia_tri_text_en}`);
      if (h.gia_tri_text_ko) phan.push(`KO: ${h.gia_tri_text_ko}`);
      return phan.join('  ·  ');
    }
  }
}

export interface KetQuaGhi { ok: boolean; cau: string }

/** So như database so (chuan_ban_dich, 0036): bỏ \r và khoảng trắng hai đầu. */
function giongNhau(a: string | null, b: string | null): boolean {
  const c = (x: string | null) => (x ?? '').replace(/\r/g, '').trim();
  return c(a) === c(b);
}

interface BanDichDuKien {
  en: string | null;
  ko: string | null;
  so: SoBanDich;
  canhBao: string[];
}

/**
 * Bản dịch cho một dữ kiện văn bản, lập TRƯỚC khi gọi dat_noi_dung(): dòng
 * đã công bố là bất biến (0010), nên bản dịch phải đi cùng phiên bản mới —
 * không có "dịch sau" cho bảng này.
 *
 * Với từng thứ tiếng:
 *   · người dùng sửa ô (khác chữ lúc mở màn hình, ô ẩn goc_…) → giữ bản tay;
 *     xóa trắng ô → nhờ máy dịch lại;
 *   · câu tiếng Việt không đổi và bản đang sống vẫn tốt → giữ nguyên cả chữ
 *     lẫn sổ, không tốn một lượt gọi máy;
 *   · còn lại → máy dịch. Máy hỏng thì vẫn lưu, ô đó để trống (trang lùi về
 *     thứ tiếng kế tiếp) và người dùng được báo lý do.
 */
async function lapBanDich(h: HangCongTac, vi: string, form: FormData, nn: NgonNguNB): Promise<BanDichDuKien> {
  const t = dichNB(nn, CAU);
  const kq: BanDichDuKien = { en: null, ko: null, so: {}, canhBao: [] };
  const so: NonNullable<SoBanDich[string]> = {};
  const viDoi = !h.dang_song || !giongNhau(vi, h.gia_tri_text);
  const canMay: NgonNguDich[] = [];

  for (const l of ['en', 'ko'] as const) {
    const moi = String(form.get(`gia_tri_${l}`) ?? '').trim() || null;
    const goc = String(form.get(`goc_gia_tri_${l}`) ?? '').trim() || null;
    const soCu = h.ban_dich?.gia_tri_text?.[l];

    if (!giongNhau(moi, goc)) {
      if (moi) { kq[l] = moi; so[l] = { cach: 'tay', tt: 'ok' }; }
      else canMay.push(l);
    } else if (!viDoi && moi && soCu?.tt === 'ok') {
      kq[l] = moi;
      so[l] = soCu;
    } else {
      canMay.push(l);
    }
  }

  if (canMay.length > 0) {
    const dich = await dichMotCau(vi);
    for (const l of canMay) {
      const r = dich[l];
      if (r.tt === 'ok') {
        kq[l] = r.noi_dung;
        so[l] = { cach: 'may', tt: 'ok' };
      } else {
        so[l] = { cach: 'may', tt: r.tt, ly_do: r.ly_do };
        kq.canhBao.push(`${l === 'en' ? t.banEn : t.banKo} ${r.tt === 'bi_chan' ? t.biChan : t.chuaDich}: ${dichCau(nn, r.ly_do)}`);
      }
    }
  }

  kq.so = { gia_tri_text: so };
  return kq;
}

/**
 * Ghi một dữ kiện.
 *
 * Trả về câu tiếng Việt để hiện thẳng cho người dùng. Câu lỗi từ database đã
 * được viết sẵn cho người đọc (0010, 0012, 0015 đều raise exception bằng
 * tiếng Việt), nên dùng nguyên văn tốt hơn là dịch lại ở đây.
 */
export async function ghiCongTac(
  client: SupabaseClient,
  h: HangCongTac,
  form: FormData,
  nn: NgonNguNB = 'vi',
): Promise<KetQuaGhi> {
  const viec = String(form.get('viec') ?? '');
  const t = dichNB(nn, CAU);
  const ten = moTaKhoa(nn, h.khoa, h.mo_ta);

  if (viec === 'go') {
    const { error } = await client.rpc('thu_hoi_noi_dung', {
      p_khoa: h.khoa,
      p_ly_do: String(form.get('ly_do') ?? '').trim() || null,
    });
    if (error) return { ok: false, cau: cauLoi(error, nn) };
    return { ok: true, cau: t.daGo(ten) };
  }

  const congBo = viec === 'cong_bo';
  let canhBaoDich: string[] = [];
  const tham: Record<string, unknown> = {
    p_khoa: h.khoa,
    p_ly_do: String(form.get('ly_do') ?? '').trim() || null,
    p_cong_bo: congBo,
  };

  switch (h.kieu) {
    case 'bool':
      tham.p_bool = form.get('gia_tri') === 'bat';
      break;
    case 'ngay': {
      const v = String(form.get('gia_tri') ?? '').trim();
      if (!v) return { ok: false, cau: t.chuaNgay };
      tham.p_ngay = v;
      break;
    }
    case 'so': {
      const v = String(form.get('gia_tri') ?? '').trim();
      if (!/^\d+$/.test(v)) return { ok: false, cau: t.chiSo };
      tham.p_so = Number(v);
      break;
    }
    case 'tep': {
      const v = String(form.get('gia_tri') ?? '').trim();
      if (!v) return { ok: false, cau: t.chuaAnh };
      tham.p_tep_id = v;
      break;
    }
    default: {
      const v = String(form.get('gia_tri') ?? '').trim();
      if (!v) return { ok: false, cau: t.chuaNoiDung };
      tham.p_text = v;
      if (h.kieu === 'van_ban') {
        const dich = await lapBanDich(h, v, form, nn);
        tham.p_text_en = dich.en;
        tham.p_text_ko = dich.ko;
        tham.p_ban_dich = dich.so;
        canhBaoDich = dich.canhBao;
      }
    }
  }

  const { error } = await client.rpc('dat_noi_dung', tham);
  if (error) return { ok: false, cau: cauLoi(error, nn) };

  const cau = congBo ? t.daCongBo(ten) : t.daLuuNhap(ten);
  return {
    ok: true,
    cau: canhBaoDich.length === 0 ? cau : t.luuY(cau, canhBaoDich.join(' · ')),
  };
}

function cauLoi(e: { message?: string; hint?: string | null }, nn: NgonNguNB): string {
  const t = dichNB(nn, CAU);
  const m = e.message ?? '';
  if (laLoiMang(m)) return CAU_MAT_MANG_GHI[nn];
  if (/permission denied|insufficient_privilege|không có quyền|chỉ chủ sở hữu/i.test(m)) {
    return m.includes('quyền') || m.includes('chủ sở hữu')
      ? dichCau(nn, m)
      : t.khongQuyen;
  }
  return m ? dichCau(nn, m) : t.khongGhi;
}
