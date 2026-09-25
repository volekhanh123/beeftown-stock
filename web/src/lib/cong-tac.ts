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
  /** Sổ bản dịch của phiên bản đang sống (0029). null khi khóa chưa công bố. */
  ban_dich: SoBanDich | null;
}

/** Tên nhóm hiện cho người dùng, kèm một câu nói nhóm đó dùng để làm gì. */
export const NHOM: Record<string, { ten: string; dan: string }> = {
  trang_thai: {
    ten: 'Trạng thái và khối nội dung',
    dan: 'Bật một khối là thêm nó vào trang. Tắt là gỡ khỏi trang ngay lập tức.',
  },
  lien_he: {
    ten: 'Liên hệ',
    dan: 'Mỗi dòng ở đây bật một nút trên trang. Chưa công bố thì trang KHÔNG hiện nút — một nút dẫn tới hư không tệ hơn không có nút.',
  },
  lich: {
    ten: 'Ngày tháng',
    dan: 'Chỉ công bố khi đã chắc. Ngày sai trên trang thì gỡ bằng nút "Gỡ khỏi trang", không cần soạn ngày mới trước.',
  },
  chia_se: {
    ten: 'Xem trước khi chia sẻ link',
    dan: 'Thứ hiện ra khi ai đó dán link Beeftown vào Zalo, Messenger hay Facebook.',
  },
  khoi: {
    ten: 'Khối nội dung',
    dan: 'Các phần lớn của trang.',
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
export function motaGiaTri(h: HangCongTac): string | null {
  if (!h.dang_song) return null;
  switch (h.kieu) {
    case 'bool': return h.gia_tri_bool ? 'Đang bật' : 'Đang tắt';
    case 'ngay': return h.gia_tri_ngay;
    case 'so':   return h.gia_tri_so === null ? null : String(h.gia_tri_so);
    case 'tep':  return h.gia_tri_tep_id ? 'Đã gắn ảnh' : null;
    default: {
      const phan = [h.gia_tri_text];
      if (h.gia_tri_text_en) phan.push(`EN: ${h.gia_tri_text_en}`);
      if (h.gia_tri_text_ko) phan.push(`KO: ${h.gia_tri_text_ko}`);
      return phan.join('  ·  ');
    }
  }
}

export interface KetQuaGhi { ok: boolean; cau: string }

/** So như database so (chuan_ban_dich, 0029): bỏ \r và khoảng trắng hai đầu. */
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
async function lapBanDich(h: HangCongTac, vi: string, form: FormData): Promise<BanDichDuKien> {
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
        kq.canhBao.push(`${l === 'en' ? 'Bản tiếng Anh' : 'Bản tiếng Hàn'} ${r.tt === 'bi_chan' ? 'bị chặn' : 'chưa dịch được'}: ${r.ly_do}`);
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
): Promise<KetQuaGhi> {
  const viec = String(form.get('viec') ?? '');

  if (viec === 'go') {
    const { error } = await client.rpc('thu_hoi_noi_dung', {
      p_khoa: h.khoa,
      p_ly_do: String(form.get('ly_do') ?? '').trim() || null,
    });
    if (error) return { ok: false, cau: cauLoi(error) };
    return { ok: true, cau: `Đã gỡ "${h.mo_ta}" khỏi trang công khai.` };
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
      if (!v) return { ok: false, cau: 'Chưa chọn ngày.' };
      tham.p_ngay = v;
      break;
    }
    case 'so': {
      const v = String(form.get('gia_tri') ?? '').trim();
      if (!/^\d+$/.test(v)) return { ok: false, cau: 'Chỉ nhận chữ số.' };
      tham.p_so = Number(v);
      break;
    }
    case 'tep': {
      const v = String(form.get('gia_tri') ?? '').trim();
      if (!v) return { ok: false, cau: 'Chưa chọn ảnh.' };
      tham.p_tep_id = v;
      break;
    }
    default: {
      const v = String(form.get('gia_tri') ?? '').trim();
      if (!v) return { ok: false, cau: 'Chưa điền nội dung.' };
      tham.p_text = v;
      if (h.kieu === 'van_ban') {
        const dich = await lapBanDich(h, v, form);
        tham.p_text_en = dich.en;
        tham.p_text_ko = dich.ko;
        tham.p_ban_dich = dich.so;
        canhBaoDich = dich.canhBao;
      }
    }
  }

  const { error } = await client.rpc('dat_noi_dung', tham);
  if (error) return { ok: false, cau: cauLoi(error) };

  const cau = congBo
    ? `Đã công bố "${h.mo_ta}". Trang công khai đổi ngay bây giờ.`
    : `Đã lưu nháp "${h.mo_ta}". Bản nháp KHÔNG hiện trên trang.`;
  return {
    ok: true,
    cau: canhBaoDich.length === 0 ? cau
      : `${cau} Lưu ý — ${canhBaoDich.join(' · ')}. Trang của thứ tiếng đó tạm hiện bản kế tiếp; bấm lưu lại sau để thử dịch lại.`,
  };
}

function cauLoi(e: { message?: string; hint?: string | null }): string {
  const m = e.message ?? '';
  if (/permission denied|insufficient_privilege|không có quyền|chỉ chủ sở hữu/i.test(m)) {
    return m.includes('quyền') || m.includes('chủ sở hữu')
      ? m
      : 'Tài khoản của bạn không có quyền làm việc này.';
  }
  return m || 'Không ghi được. Thông tin CHƯA được lưu.';
}
