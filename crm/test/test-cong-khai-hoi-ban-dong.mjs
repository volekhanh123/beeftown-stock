/**
 * BEEFTOWN — TRANG HỎI BÀN KHI FORM ĐÓNG: MÔ TẢ VÀ ĐOẠN MỞ ĐẦU NÓI ĐÚNG SỰ THẬT
 * =============================================================================
 *
 *     node test/test-cong-khai-hoi-ban-dong.mjs
 *
 * Kiểm site thật 07/10/2026 (Worker d317445e), production đang form_dat_ban_dang_mo = false: trang
 * /dat-ban hiện thẻ "Beeftown chưa mở hỏi bàn trực tuyến", JSON-LD ghi acceptsReservations = false —
 * nhưng meta description / og:description ("Bạn gửi yêu cầu, nhà hàng kiểm tra rồi gọi lại để xác
 * nhận.") và đoạn mở đầu ("Cho Beeftown biết ngày, giờ và số người. Nhà hàng kiểm tra rồi gọi lại…")
 * vẫn hứa một form không có. Mô tả là chuỗi viết thẳng trong ba file trang; đoạn mở đầu một câu
 * cho mọi trạng thái. Bất biến:
 *
 *   1. Form dựng được (tinhTrangDatBan().moDuoc): mô tả giữ NGUYÊN câu cũ — gửi yêu cầu, nhà hàng
 *      gọi lại để xác nhận.
 *   2. Form không dựng được (công tắc tắt, chưa nối database, không còn chỗ, đọc lịch hỏng — đúng
 *      điều kiện của thẻ "chưa mở"): mô tả không hứa gửi yêu cầu / gọi lại, và chỉ sang Facebook
 *      như thẻ "chưa mở" đang làm. Ở cả vi, en, ko.
 *   3. Ba trang /dat-ban, /en/book, /ko/book lấy mô tả qua moTaTrangHoiBan(), không viết thẳng câu.
 *   4. Đoạn mở đầu của TrangDatBan chọn theo cùng biến với thẻ "chưa mở" (chuaMo); câu khi đóng
 *      không hứa form.
 *
 * Trang dựng thật ở hai trạng thái kiểm ở web/kiem-tra/thu-day-du.mjs (Supabase giả: day-du và
 * dat-ban-dong) và web/kiem-tra/trinh-duyet.mjs nhóm 2 (chưa có database).
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'web', 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const { moTaTrangHoiBan } = await nap('trang-cong-khai.ts');
const { chu, NGON_NGU } = await nap('chu.ts');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — TRANG HỎI BÀN KHI FORM ĐÓNG');

// Câu mô tả cũ của ba trang (trước 07/10/2026) — chép tay: lúc form mở, câu này phải còn nguyên.
const MO_TA_KHI_MO = {
  vi: 'Hỏi bàn tại Beeftown, nhà hàng chuyên bò ở tầng 3, 11-21 Hàm Nghi, TP.HCM. Bạn gửi yêu cầu, nhà hàng kiểm tra rồi gọi lại để xác nhận.',
  en: 'Ask for a table at Beeftown, a beef specialty restaurant on Floor 3, 11-21 Hàm Nghi, Ho Chi Minh City. Send a request and we will call you back to confirm.',
  ko: '호치민시 Hàm Nghi 11-21, 3층에 있는 소고기 전문점 Beeftown에 테이블 문의를 보내 주세요. 매장에서 확인한 뒤 전화드려요.',
};
// Lời hứa của form: gửi yêu cầu trên trang, nhà hàng gọi lại.
const HUA_FORM = {
  vi: /gọi lại|gửi yêu cầu/i,
  en: /call you back|(?<!cannot )send (?:a|your)(?: table)? request/i,
  ko: /전화드려요|전화로 안내|문의를 보내 주세요/,
};
const HUA_GOI_LAI = { vi: /gọi lại/i, en: /call you back/i, ko: /전화드려요|전화로 안내/ };

const TRANG = [['dat-ban.astro', 'vi'], ['en/book.astro', 'en'], ['ko/book.astro', 'ko']];
const docTrang = f => readFileSync(join(SRC, 'pages', f), 'utf8');
const nguonTrangDatBan = readFileSync(join(SRC, 'components', 'TrangDatBan.astro'), 'utf8');

/** { vi, en, ko } của một khóa trong bảng dich(…) của TrangDatBan.astro. */
function cauTrangDatBan(khoa) {
  const m = new RegExp(`\\b${khoa}:\\s*\\{\\s*vi:\\s*'([^']*)',\\s*en:\\s*'([^']*)',\\s*ko:\\s*'([^']*)',?\\s*\\}`).exec(nguonTrangDatBan);
  return m ? { vi: m[1], en: m[2], ko: m[3] } : null;
}

// ===========================================================================
await nhom('1 · FORM MỞ: MÔ TẢ GIỮ NGUYÊN CÂU CŨ (vi, en, ko)', async () => {
  ok('trang-cong-khai.ts có hàm moTaTrangHoiBan', typeof moTaTrangHoiBan === 'function', typeof moTaTrangHoiBan);
  if (typeof moTaTrangHoiBan !== 'function') return;
  for (const nn of NGON_NGU) {
    const mo = moTaTrangHoiBan(nn, true);
    ok(`[${nn}] Form mở → mô tả đúng câu cũ`, mo === MO_TA_KHI_MO[nn], mo);
    ok(`[${nn}] Form mở → mô tả vẫn hứa gọi lại để xác nhận`, HUA_GOI_LAI[nn].test(mo ?? ''), mo);
  }
});

// ===========================================================================
await nhom('2 · FORM ĐÓNG: MÔ TẢ KHÔNG HỨA FORM, CHỈ SANG FACEBOOK NHƯ THẺ "CHƯA MỞ"', async () => {
  if (typeof moTaTrangHoiBan !== 'function') { ok('có hàm moTaTrangHoiBan', false); return; }
  for (const nn of NGON_NGU) {
    const t = chu(nn);
    const dong = moTaTrangHoiBan(nn, false);
    ok(`[${nn}] Form đóng → mô tả khác câu khi mở`, typeof dong === 'string' && dong.trim() && dong !== MO_TA_KHI_MO[nn], dong);
    ok(`[${nn}] Form đóng → mô tả không hứa gửi yêu cầu / gọi lại`, typeof dong === 'string' && !HUA_FORM[nn].test(dong),
       dong?.match(HUA_FORM[nn])?.[0]);
    ok(`[${nn}] Form đóng → mô tả chỉ sang Facebook, như thẻ "chưa mở" (${t.datBanChuaMoGiaiThich.slice(0, 40)}…)`,
       /Facebook/.test(dong ?? '') && /Facebook/.test(t.datBanChuaMoGiaiThich), dong);
    ok(`[${nn}] Form đóng → mô tả vẫn có địa chỉ 11-21 Hàm Nghi`, /11-21 Hàm Nghi|Hàm Nghi 11-21/.test(dong ?? ''), dong);
    ok(`[${nn}] Câu nằm trong chu.ts: moTaHoiBan / moTaHoiBanChuaMo`,
       t.moTaHoiBan === moTaTrangHoiBan(nn, true) && t.moTaHoiBanChuaMo === dong);
  }
});

// ===========================================================================
await nhom('3 · BA TRANG HỎI BÀN LẤY MÔ TẢ QUA moTaTrangHoiBan(), KHÔNG VIẾT THẲNG CÂU', async () => {
  for (const [f, nn] of TRANG) {
    const nguon = docTrang(f);
    ok(`pages/${f}: moTa={moTaTrangHoiBan('${nn}', tinhTrang.moDuoc)}`,
       new RegExp(`moTa=\\{moTaTrangHoiBan\\('${nn}',\\s*tinhTrang\\.moDuoc\\)\\}`).test(nguon));
    ok(`pages/${f}: không còn moTa="…" viết thẳng`, !/\bmoTa="/.test(nguon));
  }
});

// ===========================================================================
await nhom('4 · ĐOẠN MỞ ĐẦU CỦA TrangDatBan THEO THẺ "CHƯA MỞ"', async () => {
  ok('TrangDatBan.astro: <p class="dan"> chọn theo chuaMo (cùng biến với thẻ "chưa mở")',
     /<p class="dan">\{\s*chuaMo\s*\?\s*t\.danChuaMo\s*:\s*t\.dan\s*\}<\/p>/.test(nguonTrangDatBan));
  const dan = cauTrangDatBan('dan');
  const danChuaMo = cauTrangDatBan('danChuaMo');
  ok('Bảng câu có dan và danChuaMo, đủ vi / en / ko', !!dan && !!danChuaMo, JSON.stringify({ dan, danChuaMo }).slice(0, 160));
  if (!dan || !danChuaMo) return;
  for (const nn of NGON_NGU) {
    ok(`[${nn}] Đoạn mở đầu khi form mở vẫn nói nhà hàng gọi lại`, HUA_GOI_LAI[nn].test(dan[nn]), dan[nn]);
    ok(`[${nn}] Đoạn mở đầu khi form đóng không hứa gửi yêu cầu / gọi lại`, !HUA_FORM[nn].test(danChuaMo[nn]),
       danChuaMo[nn].match(HUA_FORM[nn])?.[0]);
  }
});

process.exit(ketThuc('TRANG HỎI BÀN KHI FORM ĐÓNG'));
