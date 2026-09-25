/**
 * BẢNG CÔNG TẮC — đọc và ghi
 *
 * Toàn bộ luật về ai được làm gì nằm trong database (RLS 0010 + trigger +
 * hàm dat_noi_dung của 0015). File này chỉ dịch giữa form HTML và lời gọi
 * RPC, và cố ý KHÔNG tự kiểm tra quyền lần nữa — một bản sao của luật đặt ở
 * đây sẽ lệch khỏi bản gốc, và lúc đó không ai biết bản nào đúng.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

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
  gia_tri_ngay: string | null;
  gia_tri_so: number | null;
  gia_tri_bool: boolean | null;
  gia_tri_tep_id: string | null;
  cong_bo_luc: string | null;
  ly_do: string | null;
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
    default:
      return h.gia_tri_text_en
        ? `${h.gia_tri_text}  ·  EN: ${h.gia_tri_text_en}`
        : h.gia_tri_text;
  }
}

export interface KetQuaGhi { ok: boolean; cau: string }

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
        tham.p_text_en = String(form.get('gia_tri_en') ?? '').trim() || null;
      }
    }
  }

  const { error } = await client.rpc('dat_noi_dung', tham);
  if (error) return { ok: false, cau: cauLoi(error) };

  return {
    ok: true,
    cau: congBo
      ? `Đã công bố "${h.mo_ta}". Trang công khai đổi ngay bây giờ.`
      : `Đã lưu nháp "${h.mo_ta}". Bản nháp KHÔNG hiện trên trang.`,
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
