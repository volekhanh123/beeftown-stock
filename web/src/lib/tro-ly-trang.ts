/**
 * TRỢ LÝ TRANG — KHUNG NHẮN TIN Ở TRANG MUA THỊT VỀ (phần thuần: chạy cả ở máy chủ lẫn trong trình duyệt)
 * ======================================================================================================
 *
 * Khánh 17–18/11/2026: khách nhắn tự do như với nhân viên quầy; trợ lý tên Trang, xưng "em", không gắn nhãn AI trong
 * từng tin. ĐÚNG MỘT chỗ khách biết đây là AI: dòng nhỏ cố định dưới tên Trang ở đầu khung (CHU_TRO_LY.dongAi — chữ
 * cuối cùng chờ Khánh chọn). Lý do giữ dòng đó (đã báo Khánh): chính sách dùng của Anthropic, Luật Trí tuệ nhân tạo
 * 134/2025/QH15 Điều 11 (hiệu lực 01/03/2026). Ảnh đại diện là chữ "T", không ảnh người thật hay người do AI tạo.
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
 * Trang đã chào bằng đúng hai câu này; kiểm thử so hai bên). Không nhắc AI: dòng đầu khung đã nói.
 */
export const LOI_CHAO: readonly string[] = [
  'Dạ em chào anh/chị, em là Trang của quầy thịt Beeftown ạ.',
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
  // Dòng DUY NHẤT cho khách biết đây là AI — chữ tạm, chờ Khánh chọn (web/README.md, "Trợ lý Trang").
  dongAi: {
    vi: 'Trợ lý AI của Beeftown · cần gặp nhân viên thì anh/chị cứ nhắn em',
    en: "Beeftown's AI assistant · tell me any time you want to reach our staff",
    ko: 'Beeftown AI 도우미 · 직원과 이야기하고 싶으면 언제든 말씀해 주세요',
  },
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
export type LoiTrang = 'tam_thoi' | 'qua_luot' | 'tat' | 'dang_tra_loi' | 'sai';

const chuoi = (v: unknown, toiDa: number): string => (typeof v === 'string' ? v.slice(0, toiDa) : '');

/** JSON của Edge Function → trả lời đã gọt, hay mã lỗi. Không hiện thứ gì sai kiểu. */
export function docTraLoi(v: unknown): TraLoiTrang | { ok: false; loi: LoiTrang } {
  const o = v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  if (!o || o.ok !== true) {
    const loi = o?.loi;
    return { ok: false, loi: loi === 'qua_luot' || loi === 'tat' || loi === 'dang_tra_loi' || loi === 'sai' ? loi : 'tam_thoi' };
  }
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
