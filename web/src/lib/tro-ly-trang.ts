/**
 * TRỢ LÝ TRANG — KHUNG NHẮN TIN Ở TRANG MUA THỊT VỀ (phần thuần: chạy cả ở máy chủ lẫn trong trình duyệt)
 * ======================================================================================================
 *
 * Khánh 17–18/11/2026: khách nhắn tự do như với nhân viên quầy; trợ lý tên Trang, xưng "em", không chữ AI, bot, tự động
 * trong lời chào hay tin nào. ĐÚNG MỘT chỗ khách biết đây là AI: dòng gạch dưới nhỏ, màu xám, cố định dưới tên Trang ở
 * đầu khung, có chữ "trợ lý ảo" (CACH_DONG_AO — ba cách ghi, Khánh chọn ở CACH_DONG_AO_CHON); bấm vào mới hiện phần giải
 * thích (CHU_TRO_LY.ve*). Lý do giữ dòng đó từ lúc mở khung (đã báo Khánh): chính sách dùng của Anthropic, Luật Trí tuệ
 * nhân tạo 134/2025/QH15 Điều 11 (hiệu lực 01/03/2026). Ảnh đại diện là chữ "T", không ảnh người thật hay người do AI tạo.
 *
 * Nhân viên nhận chat (Khánh 18/11/2026 13:35 — màn theo dõi ở /noi-bo làm ở PR sau): khung hỏi lại Edge Function vài
 * giây một lần khi đang mở (docXem, NHIP_XEM); nhân viên nhận thì khách thấy "… đã vào chat", tin nhân viên hiện là tin
 * của nhân viên (không dưới tên Trang), đầu khung đổi sang nhân viên; trả lại thì "Trang tiếp tục hỗ trợ".
 *
 * Câu trả lời đến từ Edge Function tro-ly-trang (crm/supabase/functions/tro-ly-trang — Claude Haiku 5.5). Trang này
 * chỉ: hiện tin theo nhịp như người (NHIP), dựng thẻ phần thịt và thẻ đơn — TIỀN DO TRANG TỰ TÍNH bằng tinhDon của
 * don-mua-thit.ts từ menu của chính trang, Trang (Claude) không bao giờ tự cộng — và "Cho vào đơn" đặt số gói vào các
 * ô chọn có sẵn của form đặt hàng. Đặt hàng vẫn là luồng cũ (tao_don_mua_thit, VNPay).
 *
 * Khi nào hiện (troLyTrangMo): công tắc hien_tro_ly_trang đã công bố và bật (0126), trang Mua thịt về đang mở có gói
 * đặt được, trang tiếng Việt (tạm — chờ Khánh chọn cho /en, /ko), và web đã nối database (có địa chỉ hàm).
 *
 * File thuần: chỉ import type và hàm thuần của don-mua-thit.ts; không supabase-js, không DOM, không mạng, không đồng hồ.
 * Kiểm thử: crm/test/test-cong-khai-tro-ly-trang.mjs.
 */
import type { NgonNgu } from './noi-dung.ts';
import { CHU_DON, docGio, nhanGoi, tinhDon, type Don, type SanPhamMua } from './don-mua-thit.ts';

type BaTieng<T> = Readonly<Record<NgonNgu, T>>;

/**
 * Lời chào hiện ngay khi mở khung — PHẢI trùng LOI_CHAO của crm/supabase/functions/tro-ly-trang/trang.ts (lời dặn nói
 * Trang đã chào bằng đúng hai câu này; kiểm thử so hai bên). Không nhắc AI hay trợ lý ảo: dòng đầu khung đã nói.
 */
export const LOI_CHAO: readonly string[] = [
  'Dạ em chào anh/chị, em là Trang bên Beeftown ạ.',
  'Anh/chị nướng cho mấy người, thích thịt kiểu nào thì cứ nhắn em, em gợi ý phần thịt và số gói vừa đủ nhé.',
];

/**
 * Nhịp trả lời cho giống người (mili giây; mỗi khoảng [thấp, cao] lấy ngẫu nhiên) — bản thử ngày 18/11/2026 (Khánh: "sau
 * chào hỏi tự động thì phải chục giây, rồi có bong bóng tạo cảm giác đang trả lời"):
 *   doc           khách gửi xong, chờ chừng này rồi hiện "Đã xem" và bong bóng đang soạn;
 *   tinDauSauChao lần trả lời đầu tiên sau lời chào;
 *   tinDau        các lần sau — máy trả lời chậm hơn mốc thì không chờ thêm;
 *   moiKyTu       tin thứ 2, 3 trong cùng lượt "gõ" chừng này mỗi chữ cái, trong khoảng toiThieu–toiDa, lệch ±15%;
 *   truocThe      thẻ phần thịt, thẻ đơn, cách liên hệ hiện sau tin cuối chừng này.
 */
export const NHIP = {
  doc: [1000, 2000], tinDauSauChao: [9000, 11000], tinDau: [5000, 7000],
  moiKyTu: 50, toiThieu: 2000, toiDa: 4000, truocThe: 800,
} as const;

/** Lấy một số trong khoảng [thấp, cao]; `ngauNhien` (0..1) đưa vào để kiểm thử. */
export function trongKhoang(k: readonly [number, number], ngauNhien: number): number {
  return Math.round(k[0] + ngauNhien * (k[1] - k[0]));
}

/** Thời gian "gõ" tin thứ 2, 3: theo số chữ, kẹp trong toiThieu–toiDa, lệch ±15%. */
export function thoiGianGo(tin: string, ngauNhien: number): number {
  const go = Math.min(NHIP.toiDa, Math.max(NHIP.toiThieu, [...tin].length * NHIP.moiKyTu));
  return Math.round(go * (0.85 + ngauNhien * 0.3));
}

/**
 * Khung đang mở thì hỏi lại Edge Function (lệnh xem) chừng này mili giây một lần: nhân viên đang nhận cuộc thì nhanh
 * (tin nhân viên không đến theo nhịp hỏi–đáp), Trang đang trả lời thì chậm (chỉ để biết nhân viên có vào không). Lỗi
 * mạng thì giãn dần tới loiToiDa. Đóng khung hay ẩn thẻ trình duyệt thì thôi hỏi.
 */
export const NHIP_XEM = { nhanVien: 2500, trang: 8000, loiToiDa: 30000 } as const;

type CachDong = { dau: BaTieng<string>; gach: BaTieng<string>; canTruc: boolean };

/**
 * Ba cách ghi dòng nhỏ dưới tên Trang (Khánh 18/11/2026 13:45: "note cái chính sách tư vấn như 1 cái dòng gạch dưới
 * thôi, rồi ai click vào mới thể hiện rõ"). Chữ hiện sẵn luôn có "trợ lý ảo" — chỉ "Chính sách tư vấn" thì khách không
 * biết đang chat với AI. dau: chữ thường đứng trước; gach: chữ gạch dưới, bấm mở phần giải thích. Cách 3 chỉ hiện khi
 * thật sự có nhân viên mở màn theo dõi (canTruc — tro_ly_co_truc của 0126); không có thì về cách 1.
 */
export const CACH_DONG_AO: Readonly<Record<1 | 2 | 3, CachDong>> = {
  1: {
    dau: { vi: '', en: '', ko: '' },
    gach: { vi: 'Trang là trợ lý ảo của Beeftown', en: "Trang is Beeftown's virtual assistant", ko: 'Trang은 Beeftown의 가상 도우미예요' },
    canTruc: false,
  },
  2: {
    dau: { vi: 'Trợ lý ảo · ', en: 'Virtual assistant · ', ko: '가상 도우미 · ' },
    gach: { vi: 'Chính sách tư vấn', en: 'How this chat works', ko: '상담 안내' },
    canTruc: false,
  },
  3: {
    dau: { vi: '', en: '', ko: '' },
    gach: {
      vi: 'Tư vấn bằng trợ lý ảo, có nhân viên theo dõi',
      en: 'Virtual assistant, with Beeftown staff watching',
      ko: '가상 도우미 상담 · 직원이 함께 보고 있어요',
    },
    canTruc: true,
  },
};

/** Cách Khánh chọn — tạm cách 1 cho tới khi Khánh chọn (ảnh ba cách: web/kiem-tra/anh-chup/tro-ly-trang/). */
export const CACH_DONG_AO_CHON: 1 | 2 | 3 = 1;

/** Chữ của dòng dưới tên Trang lúc này: cách cần nhân viên trực mà chưa ai trực thì dùng cách 1. */
export function dongAo(cach: 1 | 2 | 3, truc: boolean): CachDong {
  const c = CACH_DONG_AO[cach] ?? CACH_DONG_AO[1];
  return c.canTruc && !truc ? CACH_DONG_AO[1] : c;
}

/** Khung Trang hiện hay không — một chỗ quyết định (file vỏ và component cùng gọi). */
export function troLyTrangMo(batCongTac: unknown, trangThaiTrang: string, nn: NgonNgu, diaChiHam: string | null): boolean {
  return batCongTac === true && trangThaiTrang === 'mo' && nn === 'vi' && !!diaChiHam;
}

/**
 * Chữ cố định của khung (ba thứ tiếng như mọi chữ trang công khai; khung hiện chỉ ở trang tiếng Việt). Không câu nào
 * nói "nhân viên sẽ vào" hay "quán sẽ gọi lại": cần người thì khung hiện đúng cách liên hệ quán đã công bố.
 */
export const CHU_TRO_LY = {
  ten: { vi: 'Trang', en: 'Trang', ko: 'Trang' },
  // Phần giải thích hiện khi bấm dòng gạch dưới (CACH_DONG_AO). Câu nói có nhân viên theo dõi chỉ dùng khi có người trực.
  veAi: {
    vi: 'Trang là trợ lý ảo (AI) của Beeftown, trả lời theo thông tin quán đã duyệt.',
    en: "Trang is Beeftown's virtual assistant (AI) and answers from information the restaurant has approved.",
    ko: 'Trang은 Beeftown의 가상 도우미(AI)로, 매장이 확인한 정보로 답해요.',
  },
  veTruc: {
    vi: 'Nhân viên Beeftown đang theo dõi và vào chat khi cần. Muốn gặp nhân viên ngay, anh/chị nhắn "gặp nhân viên".',
    en: 'Beeftown staff are watching and join the chat when needed. To reach them now, write "talk to staff".',
    ko: 'Beeftown 직원이 지켜보다가 필요하면 채팅에 들어와요. 바로 직원과 이야기하시려면 "직원 연결"이라고 보내 주세요.',
  },
  veGap: {
    vi: 'Muốn gặp nhân viên, anh/chị nhắn "gặp nhân viên" để nhận cách liên hệ quán.',
    en: 'To reach our staff, write "talk to staff" and you get the ways to contact us.',
    ko: '직원과 이야기하시려면 "직원 연결"이라고 보내 주시면 연락 방법을 알려 드려요.',
  },
  veGapGoi: {
    vi: (so: string) => `Muốn gặp nhân viên, anh/chị nhắn "gặp nhân viên" hoặc gọi ${so}.`,
    en: (so: string) => `To reach our staff, write "talk to staff" or call ${so}.`,
    ko: (so: string) => `직원과 이야기하시려면 "직원 연결"이라고 보내 주시거나 ${so}로 전화해 주세요.`,
  },
  veGia: {
    vi: 'Giá và tổng tiền trong khung lấy thẳng từ bảng giá của quán.',
    en: "Prices and totals in this chat come straight from the restaurant's price list.",
    ko: '채팅 속 가격과 합계는 매장 가격표에서 그대로 가져와요.',
  },
  veLuu: {
    vi: 'Tin nhắn được lưu để nhân viên hỗ trợ; số điện thoại và địa chỉ được che trong nhật ký.',
    en: 'Messages are kept so our staff can help; phone numbers and addresses are masked in the log.',
    ko: '직원이 도울 수 있도록 메시지를 저장하며, 기록에서 전화번호와 주소는 가려져요.',
  },
  veQuyen: {
    vi: 'Thời gian giữ: xem trang Quyền riêng tư',
    en: 'How long we keep them: see our privacy page',
    ko: '보관 기간: 개인정보 처리방침 보기',
  },
  // Nhân viên nhận chat (0126 mục 4b).
  nhanVien: { vi: 'Nhân viên Beeftown', en: 'Beeftown staff', ko: 'Beeftown 직원' },
  nhanVienVao: {
    vi: (ten: string | null) => (ten ? `${ten}, nhân viên Beeftown, đã vào chat.` : 'Nhân viên Beeftown đã vào chat.'),
    en: (ten: string | null) => (ten ? `${ten} from Beeftown staff has joined the chat.` : 'Beeftown staff have joined the chat.'),
    ko: (ten: string | null) => (ten ? `Beeftown 직원 ${ten}님이 채팅에 들어왔어요.` : 'Beeftown 직원이 채팅에 들어왔어요.'),
  },
  trangQuayLai: { vi: 'Trang tiếp tục hỗ trợ anh/chị.', en: 'Trang is back to help you.', ko: 'Trang이 다시 도와드려요.' },
  nhanVienDangSoanDoc: { vi: 'Nhân viên đang soạn tin', en: 'Staff are typing', ko: '직원이 입력 중이에요' },
  daGui: { vi: 'Đã gửi', en: 'Sent', ko: '보냄' },
  dangSoan: { vi: 'đang soạn tin…', en: 'typing…', ko: '입력 중…' },
  dangSoanDoc: { vi: 'Trang đang soạn tin', en: 'Trang is typing', ko: 'Trang이 입력 중이에요' },
  daXem: { vi: 'Đã xem', en: 'Seen', ko: '읽음' },
  moTieuDe: { vi: 'Chưa biết chọn phần nào?', en: 'Not sure which cut to pick?', ko: '어떤 부위를 고를지 모르시겠어요?' },
  moDan: {
    vi: 'Nhắn Trang của quầy thịt Beeftown: bạn nướng cho mấy người, thích thịt kiểu nào, Trang gợi ý phần thịt và số gói vừa đủ.',
    en: 'Message Trang from the Beeftown meat counter: tell her how many people and what you like, and she suggests the cuts and the right number of packs.',
    ko: 'Beeftown 정육 코너의 Trang에게 메시지를 보내 보세요. 인원과 취향을 알려 주시면 부위와 알맞은 팩 수를 추천해 드려요.',
  },
  moNut: { vi: 'Nhắn Trang', en: 'Message Trang', ko: 'Trang에게 메시지' },
  dong: { vi: 'Đóng', en: 'Close', ko: '닫기' },
  oNhan: { vi: 'Tin nhắn cho Trang', en: 'Message to Trang', ko: 'Trang에게 보낼 메시지' },
  goiY: { vi: 'Nhắn như nói với nhân viên quầy…', en: 'Write as you would to the counter staff…', ko: '정육 코너 직원에게 말하듯 적어 주세요…' },
  gui: { vi: 'Gửi', en: 'Send', ko: '보내기' },
  // Câu hệ thống (không phải giọng Trang): đúng sự thật, không bao giờ nói tin đã được trả lời khi chưa.
  chuaTraLoi: {
    vi: 'Tin của anh/chị chưa được trả lời — mạng có thể vừa chập.',
    en: 'Your message has not been answered yet — the connection may have dropped.',
    ko: '메시지에 아직 답하지 못했어요 — 연결이 잠시 끊겼을 수 있어요.',
  },
  guiLai: { vi: 'Gửi lại', en: 'Send again', ko: '다시 보내기' },
  quaLuot: {
    vi: 'Khung nhắn tin đang quá nhiều tin. Anh/chị đợi ít phút rồi nhắn tiếp, hoặc liên hệ quán theo cách bên dưới.',
    en: 'Too many messages right now. Please wait a few minutes, or contact us below.',
    ko: '지금 메시지가 너무 많아요. 몇 분 뒤에 다시 보내 주시거나 아래 방법으로 연락해 주세요.',
  },
  hetLuot: {
    vi: 'Cuộc nhắn tin này đã đủ số tin cho một lần. Anh/chị tải lại trang để bắt đầu cuộc mới, hoặc liên hệ quán theo cách bên dưới.',
    en: 'This chat has reached its message limit. Reload the page to start a new one, or contact us below.',
    ko: '이 채팅은 메시지 한도에 도달했어요. 페이지를 새로 고쳐 새 채팅을 시작하시거나 아래 방법으로 연락해 주세요.',
  },
  tamNghi: {
    vi: 'Khung nhắn tin đang tạm nghỉ. Anh/chị liên hệ quán theo cách bên dưới nhé.',
    en: 'The chat is paused for now. Please contact us below.',
    ko: '채팅이 잠시 쉬고 있어요. 아래 방법으로 연락해 주세요.',
  },
  // Thẻ phần thịt, thẻ đơn.
  trenTrang: { vi: 'Trên trang ghi', en: 'On this page', ko: '이 페이지 표기' },
  viTri: { vi: 'Vị trí', en: 'Where on the animal', ko: '부위 위치' },
  doChin: { vi: 'Độ chín hợp', en: 'Best doneness', ko: '어울리는 굽기' },
  meo: { vi: 'Mẹo nướng', en: 'Grilling tip', ko: '굽는 팁' },
  donGoiY: { vi: 'Đơn gợi ý', en: 'Suggested order', ko: '추천 주문' },
  donChot: { vi: 'Đơn anh/chị vừa chốt', en: 'Your confirmed choice', ko: '확정한 주문' },
  choVaoDon: { vi: 'Cho vào đơn', en: 'Add to my order', ko: '주문에 담기' },
  daChoVaoDon: {
    vi: (dem: string) => `Đã cho vào đơn: ${dem}. Anh/chị điền họ tên, số điện thoại, địa chỉ giao ở phần Giao hàng rồi bấm Đặt hàng.`,
    en: (dem: string) => `Added to your order: ${dem}. Enter your name, phone number and delivery address under Delivery, then press Place order.`,
    ko: (dem: string) => `주문에 담았어요: ${dem}. 배송 칸에 이름, 전화번호, 주소를 적고 주문하기를 눌러 주세요.`,
  },
  goiDaDoi: {
    vi: 'Một số gói trong thẻ không còn trên trang — tải lại trang để xem giá mới nhất.',
    en: 'Some packs on this card are no longer on the page — reload the page to see the latest prices.',
    ko: '카드의 일부 팩이 페이지에 없어요 — 최신 가격을 보려면 페이지를 새로 고쳐 주세요.',
  },
  giaGomPhiGiao: { vi: 'Giá gói đã gồm phí giao.', en: 'Pack prices include delivery.', ko: '팩 가격에 배송비가 포함돼 있어요.' },
  giaChuaGomPhiGiao: {
    vi: 'Chưa gồm phí giao — quán báo khi gọi xác nhận.',
    en: 'Delivery not included — we tell you when we call to confirm.',
    ko: '배송비 별도 — 확인 전화 때 알려 드려요.',
  },
  // Cách liên hệ quán khi cần người thật (chỉ kênh đã công bố ở /noi-bo/noi-dung).
  lienHe: { vi: 'Liên hệ nhân viên của quán', en: 'Contact our staff', ko: '직원에게 연락하기' },
  goiQuan: { vi: 'Gọi quán', en: 'Call us', ko: '전화하기' },
  nhanZalo: { vi: 'Nhắn Zalo', en: 'Message on Zalo', ko: 'Zalo로 메시지' },
  nhanFacebook: { vi: 'Nhắn qua Facebook', en: 'Message on Facebook', ko: 'Facebook으로 메시지' },
  khongKenh: {
    vi: 'Anh/chị ghi câu hỏi vào ô Ghi chú khi đặt hàng, nhân viên trả lời khi gọi cho anh/chị.',
    en: 'Write your question in the Note box when you order; our staff answer it when they call you.',
    ko: '주문할 때 메모 칸에 질문을 적어 주시면 직원이 전화할 때 답해 드려요.',
  },
} as const satisfies Record<string, BaTieng<unknown>>;

// -----------------------------------------------------------------------------
// TRẢ LỜI CỦA EDGE FUNCTION — đọc lại ở trình duyệt (không tin dữ liệu ngoài)
// -----------------------------------------------------------------------------
export interface ThePhanThit {
  ma: string; ten: string; nhan: string; loai: string;
  viTri: string | null; diem: string[]; doChin: string | null; meo: string | null; moTa: string | null;
}
export interface DongDonTrang { khoa: string; so_goi: number; ten: string }
export interface TraLoiTrang {
  ok: true; tin: string[]; the: ThePhanThit[]; don: DongDonTrang[]; chot: boolean; chuyen_nguoi: boolean;
}
export type LoiTrang = 'tam_thoi' | 'qua_luot' | 'het_luot' | 'tat' | 'dang_tra_loi' | 'sai';
const LOI_BIET: readonly string[] = ['qua_luot', 'het_luot', 'tat', 'dang_tra_loi', 'sai'];
/** Nhân viên đang nhận cuộc: tin đã tới nhân viên, Trang không trả lời (Edge Function không gọi Claude). */
export interface DaToiNhanVien { ok: true; nhanVien: true; ten: string | null }

const chuoi = (v: unknown, toiDa: number): string => (typeof v === 'string' ? v.slice(0, toiDa) : '');

function docLoi(o: Record<string, unknown> | null): { ok: false; loi: LoiTrang } {
  const loi = o?.loi;
  return { ok: false, loi: typeof loi === 'string' && LOI_BIET.includes(loi) ? (loi as LoiTrang) : 'tam_thoi' };
}

/** JSON của Edge Function → trả lời đã gọt, hay mã lỗi. Không hiện thứ gì sai kiểu. */
export function docTraLoi(v: unknown): TraLoiTrang | DaToiNhanVien | { ok: false; loi: LoiTrang } {
  const o = v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  if (!o || o.ok !== true) return docLoi(o);
  if (o.nhan_vien === true) return { ok: true, nhanVien: true, ten: chuoi(o.ten, 60).trim() || null };
  const tin = (Array.isArray(o.tin) ? o.tin : []).map(t => chuoi(t, 600).trim()).filter(Boolean).slice(0, 3);
  if (!tin.length) return { ok: false, loi: 'tam_thoi' };
  const the = (Array.isArray(o.the) ? o.the : []).slice(0, 2).flatMap(x => {
    const t = x as Record<string, unknown>;
    if (!t || typeof t.ma !== 'string' || typeof t.ten !== 'string') return [];
    return [{
      ma: t.ma, ten: chuoi(t.ten, 80), nhan: chuoi(t.nhan, 80), loai: chuoi(t.loai, 40),
      viTri: chuoi(t.viTri, 120) || null, diem: (Array.isArray(t.diem) ? t.diem : []).map(d => chuoi(d, 60)).filter(Boolean).slice(0, 4),
      doChin: chuoi(t.doChin, 160) || null, meo: chuoi(t.meo, 160) || null, moTa: chuoi(t.moTa, 300) || null,
    }];
  });
  const don = (Array.isArray(o.don) ? o.don : []).flatMap(x => {
    const d = x as Record<string, unknown>;
    const n = Number(d?.so_goi);
    return d && typeof d.khoa === 'string' && Number.isInteger(n) && n >= 1 && n <= 10
      ? [{ khoa: d.khoa, so_goi: n, ten: chuoi(d.ten, 80) }] : [];
  });
  return { ok: true, tin, the, don, chot: o.chot === true && don.length > 0, chuyen_nguoi: o.chuyen_nguoi === true };
}

/** Một tin nhân viên hay câu hệ thống (nhan_vien_vao | trang_quay_lai) từ lệnh xem. */
export interface TinXem { id: number; nguoi: 'nhan_vien' | 'he_thong'; noiDung: string; ten: string | null }
export interface KetQuaXem { ok: true; aiTraLoi: 'trang' | 'nhan_vien'; ten: string | null; dangGo: boolean; truc: boolean; tin: TinXem[] }

/** JSON của lệnh xem → trạng thái cuộc chat và tin mới (cũ trước). Câu hệ thống lạ, tin sai kiểu thì bỏ. */
export function docXem(v: unknown): KetQuaXem | { ok: false; loi: LoiTrang } {
  const o = v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  if (!o || o.ok !== true || o.xem !== true) return docLoi(o);
  const tin = (Array.isArray(o.tin) ? o.tin : []).flatMap((x): TinXem[] => {
    const t = x as Record<string, unknown> | null;
    const id = Number(t?.id);
    if (!t || !Number.isSafeInteger(id) || id <= 0) return [];
    const noiDung = chuoi(t.noi_dung, 1000).trim();
    const ten = chuoi(t.ten, 60).trim() || null;
    if (t.nguoi === 'nhan_vien' && noiDung) return [{ id, nguoi: 'nhan_vien', noiDung, ten }];
    if (t.nguoi === 'he_thong' && (noiDung === 'nhan_vien_vao' || noiDung === 'trang_quay_lai')) return [{ id, nguoi: 'he_thong', noiDung, ten }];
    return [];
  }).sort((a, b) => a.id - b.id);
  const aiTraLoi = o.ai_tra_loi === 'nhan_vien' ? 'nhan_vien' : 'trang';
  return {
    ok: true, aiTraLoi, ten: aiTraLoi === 'nhan_vien' ? chuoi(o.ten, 60).trim() || null : null,
    dangGo: aiTraLoi === 'nhan_vien' && o.dang_go === true, truc: o.truc === true, tin,
  };
}

// -----------------------------------------------------------------------------
// THẺ ĐƠN — tiền do trang tính (tinhDon), không do Trang
// -----------------------------------------------------------------------------
export interface DongTheDon { chu: string; thanhTien: number }
export interface TheDon { dong: DongTheDon[]; tamTinh: number; dem: string; thieu: number; gio: Map<string, number> }

/**
 * Đơn Trang gợi ý → các dòng của thẻ đơn, tính bằng chính hàm của giỏ hàng (giá gói của menu trên trang). Dòng có khóa
 * không còn trên menu (chủ vừa đổi gói) hay gói tạm hết thì bị bỏ, `thieu` đếm số dòng bị bỏ.
 */
export function theDon(don: readonly DongDonTrang[], menu: readonly SanPhamMua[], nn: NgonNgu): TheDon {
  const { gio, boTamHet } = docGio(don.map(d => [d.khoa, String(d.so_goi)] as const), menu);
  const tinh: Don = tinhDon(gio, menu, boTamHet);
  const tenTrang = new Map(don.map(d => [d.khoa, d.ten]));
  const dong = tinh.dong.map(d => {
    const noi = tenTrang.get(d.goi.khoa) ?? '';
    const ten = noi && noi.toLowerCase() !== d.sanPham.ten.toLowerCase()
      ? `${noi.charAt(0).toUpperCase()}${noi.slice(1)} (${d.sanPham.ten})` : d.sanPham.ten;
    return { chu: CHU_DON.dongDau[nn](ten, nhanGoi(d.sanPham.donVi, d.goi.soGam, nn), d.soLuong), thanhTien: d.thanhTien };
  });
  return { dong, tamTinh: tinh.tamTinh, dem: CHU_DON.dem[nn](tinh.soGoi, tinh.soHop), thieu: don.length - tinh.dong.length, gio };
}

/** Các gói của một sản phẩm như trang ghi ("Gói 150 g") kèm giá — cho thẻ phần thịt. */
export function goiCuaSanPham(ma: string, menu: readonly SanPhamMua[], nn: NgonNgu): { nhan: string; gia: number }[] {
  const sp = menu.find(x => x.ma === ma);
  return sp ? sp.goi.filter(g => !g.tamHet).map(g => ({ nhan: nhanGoi(sp.donVi, g.soGam, nn), gia: g.gia })) : [];
}
