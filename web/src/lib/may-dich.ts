/**
 * MÁY DỊCH — gọi Gemini, không biết gì về database
 * ================================================
 *
 * Nhận một danh sách câu tiếng Việt, trả về bản tiếng Anh và tiếng Hàn của
 * từng câu, ĐÃ QUA bộ lọc chữ cấm. File này cố ý không đụng tới Supabase hay
 * biến môi trường: khóa API do người gọi đưa vào (lib/ban-dich.ts đọc nó từ
 * secret của Worker). Muốn đổi sang máy dịch khác thì chỉ viết lại file này.
 *
 * CHỈ GỬI CHỮ CÔNG KHAI. Danh sách ô dịch (cot_ban_dich() trong 0036) toàn là
 * chữ sắp lên trang: tin tuyển dụng, thực đơn, chú thích ảnh, dữ kiện công bố.
 * Không bao giờ có tên, số điện thoại hay hồ sơ của khách hoặc ứng viên. Điều
 * đó quan trọng vì gói miễn phí của Gemini được dùng dữ liệu gửi lên để cải
 * thiện sản phẩm.
 *
 * KHÔNG NÉM LỖI. Mất mạng, hết hạn mức, khóa sai, máy trả JSON hỏng — mọi thứ
 * thành trạng thái 'loi' kèm một câu tiếng Việt cho người đọc. Lưu tin không
 * được phép hỏng vì máy dịch hỏng.
 */

import { timChuoiCam } from './chuoi-cam.js';

export type NgonNguDich = 'en' | 'ko';

export interface CauCanDich {
  /** Khóa để ghép kết quả về đúng câu. Người gọi tự đặt, không gửi gì riêng tư. */
  khoa: string;
  vi: string;
}

export type KetQuaNgonNgu =
  | { tt: 'ok'; noi_dung: string }
  | { tt: 'bi_chan' | 'loi'; ly_do: string };

export interface BanDichCuaCau {
  khoa: string;
  en: KetQuaNgonNgu;
  ko: KetQuaNgonNgu;
}

export interface CauHinhMayDich {
  khoa?: string;
  mauMay?: string;
  /** Để test thay fetch thật. */
  goi?: typeof fetch;
  hetGioMs?: number;
}

/**
 * Bí danh "-latest" thay vì một số phiên bản cụ thể: Google khai tử từng phiên
 * bản sau khoảng một năm, và một nhà hàng không nên phải sửa code chỉ vì thế.
 * Muốn khóa cứng một phiên bản thì đặt biến GEMINI_MODEL trong wrangler.toml.
 */
export const MAU_MAY_MAC_DINH = 'gemini-flash-latest';

const DIA_CHI_API = 'https://generativelanguage.googleapis.com/v1beta/models/';

/**
 * Mức suy nghĩ gửi kèm (Gemini 3.x: thinkingConfig.thinkingLevel). Mặc định
 * của 3.5 Flash là "medium": máy nghĩ trước rồi mới viết, và lượt dịch bù đầu
 * tiên sau khi ghim Singapore (26/09/2026) quá 25 giây hết giờ. Dịch theo quy
 * tắc có sẵn không cần suy luận sâu; "LOW" là mức thấp nhất mọi bản 3.x Flash
 * đều nhận. Mẫu không nhận tham số này (vd. GEMINI_MODEL trỏ về một bản 2.x)
 * trả 400 nhắc tới "thinking" — khi đó gọi lại một lần, không kèm mức suy nghĩ.
 */
const MUC_NGHI = 'LOW';

/**
 * Mỗi lời gọi tối đa chừng này chữ tiếng Việt. Máy viết cả bản Anh lẫn bản
 * Hàn nên chữ ra gấp đôi chữ vào; vài lời gọi nhỏ chạy song song (dichTheoNhom)
 * xong sớm hơn nhiều so với một lời gọi lớn.
 */
export const TOI_DA_CHU_MOT_LOI_GOI = 2000;

/**
 * Quy tắc dịch — viết bằng tiếng Anh vì đó là thứ tiếng máy làm theo sát
 * nhất. Mỗi dòng ở đây trả lời cho một lỗi có thật hoặc một luật thương hiệu:
 *
 *   · "gas grill, never charcoal": BBQ Hàn gần như luôn là 숯불 (nướng than).
 *     Không dặn thì máy dịch "nướng tại bàn" thành 숯불구이 — sai sự thật.
 *   · "table request": trang đặt bàn chỉ nhận YÊU CẦU (xem chuoi-cam.js).
 *   · "same line breaks": mô tả công việc là danh sách gạch đầu dòng, và trang
 *     hiện nó bằng white-space: pre-line. Máy gộp dòng là danh sách thành một
 *     đoạn văn dài.
 *   · Giữ nguyên tên bậc Hall Crew / Master Beef Specialist: đó là tên riêng
 *     trong lộ trình nghề của nhà hàng, không phải chức danh để dịch.
 *
 * Bộ lọc chữ cấm vẫn chạy SAU máy dịch. Quy tắc giảm số lần bị chặn; bộ lọc
 * mới là thứ bảo đảm.
 */
export const QUY_TAC_DICH = `You translate short texts for the website of Beeftown, a beef BBQ restaurant with a meat counter in District 1, Ho Chi Minh City. Guests pick pre-portioned, labelled cuts of beef at the counter, then grill them at their own table on a tabletop GAS grill.

The input is a JSON array of objects {"khoa", "vi"}. For every object, translate "vi" (Vietnamese) into English ("en") and Korean ("ko"). Return exactly one output object per input object, with the same "khoa".

Follow every rule:
1. Be faithful. Translate what is written. Never add facts, promises, prices, numbers, dates, opening hours, amenities, dish details or claims that are not in the Vietnamese. Never drop a sentence.
2. Keep exactly the same line breaks: every input line becomes one output line, in the same order. Keep list markers such as "– " at the start of lines.
3. Keep unchanged: "Beeftown"; the English slogan "Pick it, grill it, love it!"; the job levels "Hall Crew" and "Master Beef Specialist"; URLs, e-mail addresses, phone numbers, times, numbers and units.
4. Glossary (Vietnamese → English / Korean):
   - vỉ gas, bếp gas → gas grill / 가스 그릴. The restaurant never uses charcoal: never write "charcoal", "숯" or "숯불".
   - quầy thịt → meat counter / 정육 코너
   - bộ phận thịt → meat department / 정육 파트
   - sảnh (bộ phận sảnh) → floor / 홀; bếp → kitchen / 주방
   - Quận 1, TP.HCM → District 1, Ho Chi Minh City / 호치민시 1군
   - Hồ Tùng Mậu → Hồ Tùng Mậu / Hồ Tùng Mậu (a street name: keep the Vietnamese spelling, also in Korean)
   - Tầng 3 → Floor 3 / 3층
   - thang máy → lift / 엘리베이터
   - đặt bàn, yêu cầu đặt bàn, hỏi bàn → table request / 테이블 문의. It is only a request, never a confirmed booking: never write "confirmed", "booked", "확정" or "완료".
   - bao cơm → meals provided / 식사 제공
   - hợp đồng lao động, bảo hiểm theo quy định → labour contract, social insurance as required by law / 근로계약, 법정 사회보험
5. Never add superlatives or comparisons: no "best", "number one", "cheapest", "최고", "가장", "최저가".
6. Tone: warm and plain. English: short, clear sentences. Korean: natural polite 해요체 for sentences, short noun phrases for titles and labels; avoid "당신".
7. A short label or job title stays a short label or job title.
8. Output only the JSON array. No notes, no markdown.`;

// Khuôn trả về theo kiểu OpenAPI mà Gemini hiểu. Có khuôn thì máy không "nói
// thêm" ngoài JSON, và mỗi phần tử bắt buộc đủ ba trường.
const KHUON_TRA_VE = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      khoa: { type: 'STRING' },
      en: { type: 'STRING' },
      ko: { type: 'STRING' },
    },
    required: ['khoa', 'en', 'ko'],
    propertyOrdering: ['khoa', 'en', 'ko'],
  },
} as const;

interface GeminiTraVe {
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: Array<{ text?: string }> };
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string };
}

/**
 * Dịch trong MỘT lời gọi API. Danh sách dài thì dùng dichTheoNhom — một lời
 * gọi quá nhiều chữ sẽ hết giờ.
 */
export async function dichSangAnhHan(
  cau: CauCanDich[], cauHinh: CauHinhMayDich,
): Promise<BanDichCuaCau[]> {
  if (cau.length === 0) return [];

  const loiChung = (ly_do: string): BanDichCuaCau[] =>
    cau.map(c => ({ khoa: c.khoa, en: { tt: 'loi', ly_do }, ko: { tt: 'loi', ly_do } }));

  if (!cauHinh.khoa) {
    return loiChung('Chưa có khóa GEMINI_API_KEY trong secret của Worker — xem web/README.md, mục "Bản dịch tự động".');
  }

  const mauMay = cauHinh.mauMay?.trim() || MAU_MAY_MAC_DINH;
  const goi = cauHinh.goi ?? fetch;
  const khoa = cauHinh.khoa;
  // Dưới 30 giây: việc chạy nền của Worker bị cắt sau khoảng đó. Một hạn
  // chung cho lời gọi đầu và lần gọi lại (nếu có).
  const hetLuc = Date.now() + (cauHinh.hetGioMs ?? 25_000);

  const guiDi = (kemMucNghi: boolean) => goi(`${DIA_CHI_API}${encodeURIComponent(mauMay)}:generateContent`, {
    method: 'POST',
    // Khóa đi bằng header, không bằng ?key= trên URL: URL hay nằm lại trong
    // nhật ký của đủ loại máy trung gian.
    headers: { 'content-type': 'application/json', 'x-goog-api-key': khoa },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: QUY_TAC_DICH }] },
      contents: [{
        role: 'user',
        parts: [{ text: JSON.stringify(cau.map(c => ({ khoa: c.khoa, vi: c.vi }))) }],
      }],
      generationConfig: {
        // Thấp để hai lần dịch cùng một câu ra gần như cùng một bản.
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: KHUON_TRA_VE,
        ...(kemMucNghi ? { thinkingConfig: { thinkingLevel: MUC_NGHI } } : {}),
      },
    }),
    signal: AbortSignal.timeout(Math.max(1, hetLuc - Date.now())),
  });

  let tra: Response;
  try {
    tra = await guiDi(true);
    // Đọc bản sao: thân gốc còn để moTaLoiHttp đọc nếu lỗi không phải chuyện này.
    if (tra.status === 400 && /thinking/i.test(await tra.clone().text().catch(() => ''))) {
      tra = await guiDi(false);
    }
  } catch (e) {
    const tenLoi = e instanceof Error ? e.name : '';
    return loiChung(tenLoi === 'TimeoutError' || tenLoi === 'AbortError'
      ? 'Gemini trả lời quá lâu. Sẽ tự thử lại sau.'
      : `Không gọi được Gemini: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (!tra.ok) return loiChung(await moTaLoiHttp(tra, mauMay));

  let json: GeminiTraVe;
  try {
    json = await tra.json() as GeminiTraVe;
  } catch {
    return loiChung('Gemini trả về dữ liệu không đọc được.');
  }

  const ung = json.candidates?.[0];
  if (!ung) {
    const chan = json.promptFeedback?.blockReason;
    return loiChung(chan ? `Gemini từ chối dịch (${chan}).` : 'Gemini không trả về bản dịch nào.');
  }
  if (ung.finishReason && ung.finishReason !== 'STOP') {
    return loiChung(`Gemini dừng giữa chừng (${ung.finishReason}).`);
  }

  let mang: unknown;
  try {
    mang = JSON.parse((ung.content?.parts ?? []).map(p => p.text ?? '').join(''));
  } catch {
    return loiChung('Gemini trả về JSON hỏng.');
  }
  if (!Array.isArray(mang)) return loiChung('Gemini trả về sai khuôn.');

  const theoKhoa = new Map<string, { en?: unknown; ko?: unknown }>();
  for (const m of mang) {
    if (m && typeof m === 'object' && typeof (m as { khoa?: unknown }).khoa === 'string') {
      theoKhoa.set((m as { khoa: string }).khoa, m as { en?: unknown; ko?: unknown });
    }
  }

  return cau.map(c => {
    const m = theoKhoa.get(c.khoa);
    return { khoa: c.khoa, en: loc(m?.en), ko: loc(m?.ko) };
  });
}

/**
 * Như dichSangAnhHan, nhưng chia danh sách thành các lời gọi tối đa `toiDaChu`
 * chữ, chạy SONG SONG. Kết quả đúng thứ tự đầu vào. Một câu dài hơn mức đó
 * vẫn đi một mình trong một lời gọi — không cắt đôi câu.
 */
export async function dichTheoNhom(
  cau: CauCanDich[], cauHinh: CauHinhMayDich, toiDaChu = TOI_DA_CHU_MOT_LOI_GOI,
): Promise<BanDichCuaCau[]> {
  const nhom: CauCanDich[][] = [];
  let dang: CauCanDich[] = [];
  let chu = 0;
  for (const c of cau) {
    if (dang.length > 0 && chu + c.vi.length > toiDaChu) {
      nhom.push(dang);
      dang = [];
      chu = 0;
    }
    dang.push(c);
    chu += c.vi.length;
  }
  if (dang.length > 0) nhom.push(dang);
  return (await Promise.all(nhom.map(g => dichSangAnhHan(g, cauHinh)))).flat();
}

/** Chuẩn hóa một bản dịch và cho nó qua bộ lọc chữ cấm. */
function loc(x: unknown): KetQuaNgonNgu {
  if (typeof x !== 'string') return { tt: 'loi', ly_do: 'Máy dịch bỏ sót câu này.' };
  const noi_dung = x.replace(/\r/g, '').trim();
  if (!noi_dung) return { tt: 'loi', ly_do: 'Máy dịch trả về chuỗi rỗng.' };
  const cam = timChuoiCam(noi_dung);
  if (cam.length > 0) {
    return { tt: 'bi_chan', ly_do: `Dính chữ cấm "${cam[0].tim_thay}": ${cam[0].vi_sao}` };
  }
  return { tt: 'ok', noi_dung };
}

/** Câu lỗi cho người đọc. Không bao giờ chứa khóa API — Google không trả nó về trong lỗi. */
async function moTaLoiHttp(tra: Response, mauMay: string): Promise<string> {
  let chiTiet = '';
  try {
    const j = await tra.json() as GeminiTraVe;
    chiTiet = (j.error?.message ?? '').slice(0, 200);
  } catch { /* thân lỗi không phải JSON — dùng mã HTTP là đủ */ }
  const kem = chiTiet ? `: ${chiTiet}` : '';

  if (tra.status === 404) return `Không có mẫu máy "${mauMay}" (404) — kiểm tra biến GEMINI_MODEL${kem}`;
  if (tra.status === 429) return `Gemini báo hết hạn mức (429). Sẽ tự thử lại sau${kem}`;
  if (tra.status === 401 || tra.status === 403) return `Khóa Gemini bị từ chối (${tra.status})${kem}`;
  if (tra.status >= 500) return `Gemini đang lỗi (${tra.status}). Sẽ tự thử lại sau.`;
  return `Gemini từ chối yêu cầu (${tra.status})${kem}`;
}
