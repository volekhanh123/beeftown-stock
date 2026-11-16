/**
 * Phần xử lý thuần của bot dịch: đọc tin Zalo gửi về, bỏ chữ @tag bot, đoán ngôn ngữ, chọn ngôn ngữ đích,
 * dựng câu trả lời. Không gọi mạng — kiểm thử chạy thẳng trên Node.
 *
 * Cấu trúc tin theo Zalo Bot Platform (bot.zaloplatforms.com/docs), đối chiếu với bộ đọc tin của
 * OpenClaw (@openclaw/zalo, message-schema.ts): webhook gửi { event_name, message } — có lúc bọc trong
 * { ok: true, result: {...} } như kết quả getUpdates.
 */

export type NgonNgu = 'en' | 'ko' | 'vi';

export interface TinZalo {
  maTin: string;
  maChat: string;
  laNhom: boolean;
  maNguoiGui: string;
  tenNguoiGui: string;
  laBot: boolean;
  noiDung: string;
}

/** Zalo trả mỗi tin dài tối đa 2.000 ký tự (OpenClaw: ZALO_TEXT_LIMIT). */
export const DO_DAI_TOI_DA = 2000;

function chuoi(giaTri: unknown): string {
  if (typeof giaTri === 'string') return giaTri.trim();
  if (typeof giaTri === 'number' && Number.isFinite(giaTri)) return String(giaTri);
  return '';
}

/**
 * Đọc thân webhook. Trả null khi không phải tin chữ (ảnh, sticker, sự kiện khác) hoặc thiếu trường bắt buộc —
 * bot bỏ qua những tin đó, không trả lời.
 */
export function docTinZalo(than: unknown): TinZalo | null {
  if (!than || typeof than !== 'object') return null;
  let goi = than as Record<string, unknown>;
  if (goi.ok === true && goi.result && typeof goi.result === 'object') goi = goi.result as Record<string, unknown>;
  if (goi.event_name !== 'message.text.received') return null;
  const tin = goi.message as Record<string, unknown> | undefined;
  if (!tin || typeof tin !== 'object') return null;
  const chat = (tin.chat ?? {}) as Record<string, unknown>;
  const nguoiGui = (tin.from ?? {}) as Record<string, unknown>;
  const maTin = chuoi(tin.message_id);
  const maChat = chuoi(chat.id);
  const noiDung = typeof tin.text === 'string' ? tin.text : '';
  if (!maTin || !maChat || !noiDung.trim()) return null;
  return {
    maTin,
    maChat,
    laNhom: chat.chat_type === 'GROUP',
    maNguoiGui: chuoi(nguoiGui.id),
    tenNguoiGui: chuoi(nguoiGui.display_name) || chuoi(nguoiGui.name),
    laBot: nguoiGui.is_bot === true,
    noiDung,
  };
}

function thoatRegex(chu: string): string {
  return chu.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Bỏ chữ "@Tên bot" khỏi tin (người dùng tag bot trong nhóm). So khớp không phân biệt hoa thường, mọi vị trí.
 * Trả kèm cờ có tag hay không — dùng cho chế độ "chỉ dịch khi được tag".
 */
export function boTagBot(noiDung: string, tenBot: string): { conLai: string; coTag: boolean } {
  const ten = tenBot.trim();
  if (!ten) return { conLai: noiDung.trim(), coTag: false };
  const mau = new RegExp(`@${thoatRegex(ten).replace(/\s+/g, '\\s+')}`, 'giu');
  const coTag = mau.test(noiDung);
  mau.lastIndex = 0;
  const conLai = noiDung.replace(mau, ' ').replace(/[ \t]{2,}/g, ' ').trim();
  return { conLai, coTag };
}

const CHU_HAN = /[ᄀ-ᇿ㄰-㆏가-힯]/gu;
const CHU_CAI = /\p{L}/gu;
// Chữ chỉ tiếng Việt có: đ, ă, â, ê, ô, ơ, ư và nguyên âm mang dấu thanh.
const DAU_TIENG_VIET = /[đăâêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/iu;

/** Đoán ngôn ngữ của tin: chữ Hàn chiếm từ 30% số chữ cái trở lên là tiếng Hàn; có dấu tiếng Việt là tiếng Việt. */
export function doanNgonNgu(noiDung: string): NgonNgu {
  const soChuCai = (noiDung.match(CHU_CAI) ?? []).length;
  const soChuHan = (noiDung.match(CHU_HAN) ?? []).length;
  if (soChuCai > 0 && soChuHan / soChuCai >= 0.3) return 'ko';
  if (DAU_TIENG_VIET.test(noiDung)) return 'vi';
  return 'en';
}

/** Tiếng Hàn dịch sang tiếng của bạn (mặc định tiếng Anh); tiếng Anh và tiếng Việt dịch sang tiếng Hàn. */
export function ngonNguDich(nguon: NgonNgu, tiengHanSang: NgonNgu = 'en'): NgonNgu {
  if (nguon === 'ko') return tiengHanSang === 'ko' ? 'en' : tiengHanSang;
  return 'ko';
}

export function docNgonNguDichTiengHan(giaTri: string | undefined): NgonNgu {
  return giaTri?.trim().toLowerCase() === 'vi' ? 'vi' : 'en';
}

/** Tin chỉ có link, số, dấu câu hay biểu tượng cảm xúc thì không cần dịch. */
export function canDich(noiDung: string): boolean {
  const boLink = noiDung.replace(/https?:\/\/\S+/giu, ' ');
  return /\p{L}/u.test(boLink);
}

const CO: Record<NgonNgu, string> = { ko: '🇰🇷', en: '🇬🇧', vi: '🇻🇳' };

export function dungCauTraLoi(tenNguoiGui: string, dich: NgonNgu, banDich: string): string {
  const ten = tenNguoiGui ? `${tenNguoiGui}: ` : '';
  return `${CO[dich]} ${ten}${banDich.trim()}`;
}

/** Câu báo khi dịch hỏng — hai thứ tiếng để cả hai bên đọc được. Không bao giờ giả như đã dịch. */
export const CAU_DICH_HONG = '⚠️ Bot chưa dịch được tin này, bạn gửi lại giúp. / 번역하지 못했어요. 다시 보내 주세요.';

/** Cắt tin dài thành nhiều đoạn ≤ 2.000 ký tự, ưu tiên cắt ở chỗ xuống dòng hoặc khoảng trắng. */
export function chiaDoan(noiDung: string, doDai = DO_DAI_TOI_DA): string[] {
  const doan: string[] = [];
  let conLai = noiDung;
  while (conLai.length > doDai) {
    let cat = conLai.lastIndexOf('\n', doDai);
    if (cat < doDai / 2) cat = conLai.lastIndexOf(' ', doDai);
    if (cat < doDai / 2) cat = doDai;
    doan.push(conLai.slice(0, cat).trimEnd());
    conLai = conLai.slice(cat).trimStart();
  }
  if (conLai) doan.push(conLai);
  return doan;
}

/**
 * Nhớ mã tin đã nhận để Zalo gửi lại webhook (hết giờ chờ, lỗi mạng) thì không dịch hai lần.
 * Chỉ nhớ trong một máy chạy của Worker — đủ cho lần gửi lại sát nhau, không chặn được mọi trường hợp
 * (README, "Giới hạn").
 */
export class BoNhoTinDaNhan {
  private readonly daNhan = new Map<string, number>();
  private readonly giuMs: number;
  private readonly toiDa: number;
  constructor(giuMs = 10 * 60 * 1000, toiDa = 500) {
    this.giuMs = giuMs;
    this.toiDa = toiDa;
  }

  /** Trả true nếu tin mới (và ghi nhớ nó), false nếu đã nhận rồi. */
  nhanLanDau(maTin: string, bayGio = Date.now()): boolean {
    for (const [ma, luc] of this.daNhan) {
      if (bayGio - luc > this.giuMs || this.daNhan.size > this.toiDa) this.daNhan.delete(ma);
      else break;
    }
    if (this.daNhan.has(maTin)) return false;
    this.daNhan.set(maTin, bayGio);
    return true;
  }
}

/** So hai chuỗi bí mật với thời gian không phụ thuộc chỗ khác nhau. */
export function soBiMat(a: string, b: string): boolean {
  if (a.length !== b.length || !a) return false;
  let khac = 0;
  for (let i = 0; i < a.length; i++) khac |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return khac === 0;
}

/**
 * Khóa bí mật của webhook suy ra từ token bot: Zalo gửi nó trong header X-Bot-Api-Secret-Token, Worker so lại.
 * Suy ra được nên Khánh không phải tạo và cất thêm một bí mật thứ hai. Đổi token (Reset) thì khóa đổi theo —
 * mở lại trang /cai-dat để đăng ký lại.
 */
export async function khoaWebhook(token: string): Promise<string> {
  const du = new TextEncoder().encode(`beeftown-bot-dich|${token}`);
  const bam = new Uint8Array(await crypto.subtle.digest('SHA-256', du));
  return Array.from(bam, b => b.toString(16).padStart(2, '0')).join('').slice(0, 48);
}
