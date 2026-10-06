/**
 * ĐẶT BÀN — đọc lịch trống và gửi yêu cầu
 * =======================================
 *
 * HAI CÔNG TẮC, KHÔNG PHẢI MỘT.
 *
 * Công tắc thứ nhất là form_dat_ban_dang_mo, do người bật. Công tắc thứ hai
 * là THỰC TẾ: chi nhánh có tồn tại không, giờ phục vụ đã chốt chưa, và bảng
 * ban_an đã có bàn nào chưa.
 *
 * Vì sao cần cả hai: migration 0010 seed form_dat_ban_dang_mo = true để tám
 * kiểm tra đặt bàn cũ không hỏng. Trên một database vừa cài xong, bảng ban_an
 * TRỐNG. Chỉ tin công tắc thứ nhất thì form hiện ra, khách điền xong, và
 * tao_dat_ban() trả về "Khung giờ ... đã hết bàn" — một câu nói SAI về một
 * nhà hàng chưa mở cửa, và sai theo cách tệ nhất: nó nghe như nhà hàng đông
 * khách, nên khách không báo cho ai cả.
 *
 * Nên trước khi dựng form, hàm dưới đây hỏi thẳng database: có khung giờ nào
 * còn chỗ trong 14 ngày tới không. Không có thì trang nói "chưa mở đặt bàn"
 * và chỉ sang Facebook — đúng sự thật, và không ai phải điền gì.
 *
 * KHÔNG BAO GIỜ TRẢ SỐ BÀN CÒN TRỐNG RA TRÌNH DUYỆT. lich_trong_theo_ma()
 * đã trả về boolean thay vì số, và tao_dat_ban() trả về cột con_trong thì
 * cột đó bị bỏ ngay tại đây. Vừa là quy định của kế hoạch IMC (cấm hook khan
 * hiếm), vừa vì một con số sức chứa là thứ đối thủ đếm được.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { taoClient, maChiNhanh, homNayVn, type NgonNgu } from './noi-dung.ts';
import { congNgay } from './gio-vn.ts';
import { cauLoiDatabase, laLoiDatabase, dich, type BaThuTieng } from './chu.ts';

export interface KhungGio {
  gio: string;      // '18:00:00'
  buoi: 'trua' | 'toi';
  con_cho: boolean;
  da_qua: boolean;
}

export interface TinhTrangDatBan {
  /** Có dựng được form không. False thì trang hiện khối "chưa mở". */
  moDuoc: boolean;
  /** Khung giờ của ngày đang xem. */
  khung: KhungGio[];
  ngay: string;
  /** Vì sao không mở được — CHỈ để ghi chú nội bộ, không hiện cho khách. */
  viSao: string | null;
}

/** 14 ngày tới, đủ xa để biết nhà hàng có bàn hay không. */
function cacNgayToi(n = 14): string[] {
  const homNay = homNayVn();
  return Array.from({ length: n }, (_, i) => congNgay(homNay, i));
}

async function docKhung(
  client: SupabaseClient, ma: string, ngay: string,
): Promise<KhungGio[]> {
  const { data, error } = await client.rpc('lich_trong_theo_ma', {
    p_chi_nhanh_ma: ma,
    p_ngay: ngay,
  });
  if (error || !Array.isArray(data)) return [];
  return data as KhungGio[];
}

/**
 * Hỏi database xem đặt bàn có thật sự dùng được không, và trả về khung giờ
 * của ngày khách đang xem.
 */
export async function tinhTrangDatBan(
  ngayXem: string | null, formDangMo: boolean | null,
): Promise<TinhTrangDatBan> {
  const ngay = ngayXem && /^\d{4}-\d{2}-\d{2}$/.test(ngayXem) ? ngayXem : homNayVn();
  const rong: TinhTrangDatBan = { moDuoc: false, khung: [], ngay, viSao: null };

  if (formDangMo !== true) {
    return { ...rong, viSao: 'Công tắc form_dat_ban_dang_mo đang tắt.' };
  }

  const client = taoClient();
  if (!client) return { ...rong, viSao: 'Chưa nối database.' };

  const ma = maChiNhanh();

  try {
    const khung = await docKhung(client, ma, ngay);

    if (khung.length === 0) {
      // Không có khung giờ nào nghĩa là: không có chi nhánh mã này đang hoạt
      // động, hoặc giờ phục vụ chưa được công bố (chi_nhanh_cong_khai() giấu
      // giờ cho tới khi bật gio_phuc_vu_da_chot).
      return {
        ...rong,
        viSao: `Không có khung giờ nào cho chi nhánh "${ma}" — kiểm tra bảng chi_nhanh và công tắc gio_phuc_vu_da_chot.`,
      };
    }

    // Ngày đang xem có thể hết chỗ thật. Nên nhìn rộng ra 14 ngày trước khi
    // kết luận "chưa mở": một nhà hàng kín bàn suốt hai tuần liền, kể cả
    // những khung giờ chưa tới, thì gần như chắc chắn là bảng ban_an trống.
    const coChoODauDo =
      khung.some(k => k.con_cho && !k.da_qua) ||
      (await Promise.all(
        cacNgayToi().slice(1).map(n => docKhung(client, ma, n)),
      )).some(ks => ks.some(k => k.con_cho));

    if (!coChoODauDo) {
      return {
        ...rong,
        khung,
        viSao: 'Không còn chỗ ở bất kỳ khung giờ nào trong 14 ngày tới — nhiều khả năng bảng ban_an chưa có bàn nào.',
      };
    }

    return { moDuoc: true, khung, ngay, viSao: null };
  } catch (e) {
    return { ...rong, viSao: e instanceof Error ? e.message : 'Không đọc được lịch.' };
  }
}

export interface KetQuaDatBan {
  ok: boolean;
  ma?: string;
  cau: string;
}

/**
 * Câu trả lời sau khi gửi, ở cả ba thứ tiếng. Bản tiếng Anh và tiếng Hàn nói
 * đúng điều bản tiếng Việt nói: "đã nhận yêu cầu", không bao giờ là "đã giữ
 * bàn" — bản dịch là chỗ câu chữ dễ trôi thành một lời hứa nhất.
 *
 * xu-ly-form.ts dùng lại bảng này cho câu đọc từ cookie sau khi chuyển hướng,
 * để hai nơi không nói hai câu khác nhau.
 */
export const CAU_DAT_BAN = {
  thieuHoTen: {
    vi: 'Vui lòng điền họ tên.',
    en: 'Please enter your full name.',
    ko: '이름을 입력해 주세요.',
  },
  thieuSdt: {
    vi: 'Vui lòng điền số điện thoại.',
    en: 'Please enter your phone number.',
    ko: '전화번호를 입력해 주세요.',
  },
  thieuNgay: {
    vi: 'Vui lòng chọn ngày.',
    en: 'Please choose a date.',
    ko: '날짜를 선택해 주세요.',
  },
  thieuGio: {
    vi: 'Vui lòng chọn khung giờ.',
    en: 'Please choose a time.',
    ko: '시간대를 선택해 주세요.',
  },
  soKhach: {
    vi: 'Số khách phải từ 1 đến 8. Nhóm đông hơn, bạn nhắn trực tiếp cho Beeftown để nhà hàng sắp xếp.',
    en: 'The number of guests must be from 1 to 8. For a larger group, message Beeftown directly and we will arrange it with you.',
    ko: '인원은 1명에서 8명까지 선택할 수 있어요. 더 많은 인원은 Beeftown에 직접 메시지를 보내 주시면 매장에서 조율해 드려요.',
  },
  chuaGhi: {
    vi: 'Chưa gửi được yêu cầu. Yêu cầu của bạn CHƯA được ghi nhận.',
    en: 'Your request could not be sent. It has NOT been recorded.',
    ko: '요청을 보내지 못했어요. 예약 요청은 아직 접수되지 않았어요.',
  },
  daNhan: {
    vi: 'Beeftown đã nhận yêu cầu đặt bàn của bạn.',
    en: 'Beeftown has received your table request.',
    ko: 'Beeftown에 예약 요청이 접수되었어요.',
  },
} as const satisfies Record<string, BaThuTieng>;

/**
 * Gửi yêu cầu đặt bàn.
 *
 * "Thành công" ở đây nghĩa là DATABASE ĐÃ GHI, không hơn. Câu trả lời nói
 * thẳng rằng chưa có bàn nào được giữ cho tới khi nhân viên gọi xác nhận —
 * vì đó đúng là tình trạng của một dòng dat_ban ở trạng thái cho_xac_nhan.
 *
 * Gửi lại Y HỆT trong 10 phút (tắt JavaScript, trình duyệt gửi lại POST, khách
 * gửi lại vì mạng chập sau khi database đã ghi) thì tao_dat_ban() trả lại dòng
 * cũ và mã cũ thay vì tạo dòng thứ hai (migration 0062) — câu "đã nhận" vẫn đúng.
 */
export async function guiYeuCauDatBan(
  client: SupabaseClient, form: FormData, ip: string | null, ngonNgu: NgonNgu,
): Promise<KetQuaDatBan> {
  const cau = dich(ngonNgu, CAU_DAT_BAN);
  const hoTen = String(form.get('ho_ten') ?? '').trim();
  const sdt = String(form.get('sdt') ?? '').trim();
  const ngay = String(form.get('ngay') ?? '').trim();
  const gio = String(form.get('gio') ?? '').trim();
  const soKhach = Number(form.get('so_khach'));

  if (!hoTen) return { ok: false, cau: cau.thieuHoTen };
  if (!sdt)   return { ok: false, cau: cau.thieuSdt };
  if (!ngay)  return { ok: false, cau: cau.thieuNgay };
  if (!gio)   return { ok: false, cau: cau.thieuGio };
  if (!Number.isInteger(soKhach) || soKhach < 1 || soKhach > 8) {
    return { ok: false, cau: cau.soKhach };
  }

  const { data, error } = await client.rpc('tao_dat_ban', {
    p_chi_nhanh_ma: maChiNhanh(),
    p_sdt: sdt,
    p_ho_ten: hoTen,
    p_ngay: ngay,
    p_gio: gio,
    p_so_khach: soKhach,
    p_dip: String(form.get('dip') ?? '').trim() || null,
    p_ghi_chu: String(form.get('ghi_chu') ?? '').trim() || null,
    // Đồng ý nhận tin là TÙY CHỌN và KHÔNG được gộp vào việc đặt bàn. Bắt
    // người ta đồng ý nhận quảng cáo mới cho giữ bàn là ép buộc sự đồng ý,
    // và nó làm hỏng luôn giá trị của những người đã đồng ý thật lòng.
    p_dong_y: form.get('dong_y_nhan_tin') === 'co',
    p_utm_source: String(form.get('utm_source') ?? '').trim() || null,
    p_utm_medium: String(form.get('utm_medium') ?? '').trim() || null,
    p_utm_campaign: String(form.get('utm_campaign') ?? '').trim() || null,
    p_trang_gioi_thieu: null,
    p_ip: ip,
  });

  if (error) {
    // Đứt mạng / hết giờ / cổng 502–504: supabase-js không ném mà trả error
    // không có mã. Yêu cầu có thể đã ghi xong rồi mới đứt — ném để
    // xu-ly-form.ts nói "KHÔNG CHẮC", không bao giờ nói "CHƯA được ghi nhận"
    // (khách sẽ gửi lại và nhà hàng nhận hai bản). Xem laLoiDatabase().
    if (!laLoiDatabase(error)) {
      throw new Error(`tao_dat_ban: không nghe được trả lời — ${error.message ?? ''}`);
    }
    // Câu lỗi của database viết bằng tiếng Việt: trang tiếng Việt dùng nguyên
    // văn, trang khác nhận bản dịch — xem cauLoiDatabase() trong lib/chu.ts.
    return { ok: false, cau: cauLoiDatabase(error.message ?? '', ngonNgu, cau.chuaGhi) };
  }

  // tao_dat_ban() trả về cả con_trong. Chỉ lấy mã; con số sức chứa dừng ở đây.
  const dong = Array.isArray(data) ? data[0] : data;
  // Ghi được thì LUÔN có mã (0013). Không lỗi mà cũng không có dòng — thân trả
  // lời rỗng; supabase-js biến 404 thân rỗng thành 204 — là database chưa xác
  // nhận gì: không được nói "đã nhận". Như messenger-anon.ts.
  if (!dong?.ma_dat_ban) throw new Error('tao_dat_ban: trả lời không có mã đặt bàn');
  return {
    ok: true,
    ma: dong.ma_dat_ban,
    cau: cau.daNhan,
  };
}
