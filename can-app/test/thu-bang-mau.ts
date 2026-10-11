/**
 * Kiểm thử bảng màu của giao diện (2.9.2) — src/giao-dien.html, src/huong-dan.html.
 *
 *     cd can-app && npx bun test/thu-bang-mau.ts
 *
 * Ngày 09/10/2026 Khánh chốt bảng màu thương hiệu (THUONG-HIEU.md ở gốc repo): Beef Red, Cream, Charcoal,
 * Marigold, Warm Stone, cùng vài màu pha chỉ dùng trên màn hình. Bản 2.9.2 đưa Beeftown Cân sang bảng đó, cùng
 * lúc với /noi-bo và kho. Chương trình chạy không mạng nên mỗi file HTML khai lại bảng trong khối :root của nó.
 * Bất biến:
 *   - hai file khai ĐÚNG 16 biến dưới đây, cùng giá trị, mỗi file một khối :root;
 *   - không còn mã màu nào của bảng cũ (hex hay bộ ba số RGB), kể cả trong chú thích và trong mã JavaScript;
 *   - ngoài khối :root không viết cứng mã màu — trừ trắng và hình của vật thật (mực và nét gạch của tờ tem vẽ
 *     thử, màn hình tinh thể lỏng của cân vẽ trong hướng dẫn);
 *   - ô nhập kẻ viền bằng --vien-o; Marigold và Warm Stone chỉ làm chữ trên nền Charcoal;
 *   - các cặp chữ / nền chính đủ tương phản (WCAG 2.2, tính ở đây chứ không ước lượng).
 * Mã chép tay ở đây, KHÔNG đọc từ file HTML: sửa nhầm một mã trong giao diện thì phép thử này đỏ.
 * crm/test/test-noi-bo-bang-mau.mjs (nhóm 5) gác cùng điều này từ phía website; file này để bộ thử của riêng
 * Beeftown Cân — thứ dong-goi-can.yml chạy trước khi đóng gói — tự đỏ khi giao diện lệch bảng.
 * test/thu.ts gọi thuBangMau(ok) với hàm ok chung.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

type Ok = (ten: string, dk: boolean, ct?: string) => void;

// Bảng màu — chép tay từ THUONG-HIEU.md. Tên biến của riêng chương trình: --vach là kem đậm (web gọi --kem-dam),
// --chu-phu là Charcoal 68 % (web gọi --muc-nhat), --trang là trắng.
const BANG_MAU: Record<string, string> = {
  '--do': '#A70C0C', '--kem': '#F0E3D0', '--than': '#151008', '--mu-tat': '#F5AA14', '--da': '#B8A98C',   // năm màu thương hiệu
  '--do-dam': '#890607', '--kem-sau': '#EBDCC6', '--vach': '#E7D5BC', '--vien-o': '#7A7366',              // màu pha cho màn hình
  '--chu-phu': 'rgba(21, 16, 8, .68)', '--trang': '#FFFFFF',
  // Màu trạng thái của công cụ (xanh = xong, vàng = lưu ý, đỏ nhạt = lỗi) — cùng mã với /noi-bo và kho.
  '--xanh': '#1A683F', '--xanh-nen': '#E4F0E5', '--do-nen': '#FAE9E6', '--vang-nen': '#FDE9B5', '--vang-chu': '#7A5200',
};
// Mã của bảng trước bản 2.9.2 (và của bảng cũ trên website), viết kiểu hex hoặc bộ ba số RGB có hay không có dấu cách.
const HEX_CU = ['B23A2C', '8F2C21', '8E2B20', '960F13', 'FBF4E1', 'F5ECD7', 'F3E8CC', 'F1E4C2', 'E4D8BC', '1E160E', '3A2D20', 'F2A900', 'F5C211',
  '8C8577', '6A5D45', '7A6C52', '8A7C62', '1F7A4C', 'E9F5EE', 'FFF5DC', 'FDECEA', 'F3C8C2', '8A5A00', 'B07A00'];
const BO_BA_CU = ['30,22,14', '251,244,225', '178,58,44', '242,169,0'];
const MA_CU = new RegExp(`#(?:${HEX_CU.join('|')})\\b|rgba?\\(\\s*(?:${BO_BA_CU.map((b) => b.split(',').join('\\s*,\\s*')).join('|')})\\b`, 'gi');
// Màu viết cứng được phép ngoài khối :root: trắng; mực và nét gạch của tờ tem vẽ thử (#111, #b9b9b9); màn hình tinh
// thể lỏng của cân vẽ trong hướng dẫn (#1f261e, #a8ef9b, #c9d7c5).
const HEX_DUOC = new Set(['#FFF', '#FFFFFF', '#111', '#B9B9B9', '#1F261E', '#A8EF9B', '#C9D7C5']);
// rgb() / rgba(): số của Charcoal, Cream, Beef Red, Marigold; đen cho bóng đổ.
const BO_BA_DUOC = new Set(['21,16,8', '240,227,208', '167,12,12', '245,170,20', '0,0,0']);

const boChuThich = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const chuanHoa = (v: string) => v.trim().replace(/\s+/g, '').toLowerCase();
const so = (x: number) => x.toFixed(2).replace('.', ',');

interface QuyTac { boChon: string; trong: string; trongIn: boolean }
/** CSS → quy tắc ở tầng ngoài cùng (khối @media giữ nguyên trong `trong`). */
function docQuyTac(css: string): { boChon: string; trong: string }[] {
  const ra: { boChon: string; trong: string }[] = [];
  let i = 0;
  while (i < css.length) {
    const mo = css.indexOf('{', i);
    if (mo < 0) break;
    let sau = mo + 1, muc = 1;
    for (; sau < css.length && muc > 0; sau++) {
      if (css[sau] === '{') muc++;
      else if (css[sau] === '}') muc--;
    }
    ra.push({ boChon: css.slice(i, mo).trim().replace(/^[;\s]+/, ''), trong: css.slice(mo + 1, sau - 1) });
    i = sau;
  }
  return ra;
}
/** Mọi quy tắc thường, đi vào trong @media; kèm cờ "nằm trong @media print". */
function quyTacPhang(css: string, trongIn = false): QuyTac[] {
  return docQuyTac(css).flatMap((q): QuyTac[] => {
    if (/^@(media|supports)\b/.test(q.boChon)) return quyTacPhang(q.trong, trongIn || /^@media[^{]*\bprint\b/.test(q.boChon));
    if (q.boChon.startsWith('@')) return [];
    return [{ boChon: q.boChon.replace(/\s+/g, ' '), trong: q.trong, trongIn }];
  });
}
const hexTrong = (css: string) => [...css.matchAll(/#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi)].map((m) => m[0].toUpperCase());

/** Độ sáng tương đối và tỷ lệ tương phản theo WCAG 2.2. Màu là '#RRGGBB'. */
function doSang(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function tuongPhan(a: string, b: string): number {
  const [sang, toi] = [doSang(a), doSang(b)].sort((x, y) => y - x);
  return (sang! + 0.05) / (toi! + 0.05);
}
/** Màu có độ trong đặt trên một nền đặc → màu đặc mắt thấy. */
function phaTren(chu: string, nen: string, alpha: number): string {
  const kenh = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [c, n] = [kenh(chu), kenh(nen)];
  return '#' + c.map((v, i) => Math.round(v * alpha + n[i]! * (1 - alpha)).toString(16).padStart(2, '0')).join('');
}

export async function thuBangMau(ok: Ok): Promise<void> {
  console.log('BM · Bảng màu thương hiệu chốt 09/10/2026 trong giao diện (2.9.2)');
  const khaiCua: Record<string, Map<string, string>> = {};
  for (const ten of ['giao-dien.html', 'huong-dan.html']) {
    const s = fs.readFileSync(path.join(import.meta.dir, '..', 'src', ten), 'utf8').replace(/\r\n/g, '\n');
    const css = boChuThich(/<style\b[^>]*>([\s\S]*?)<\/style>/.exec(s)?.[1] ?? '');
    const khoiRoot = docQuyTac(css).filter((q) => q.boChon === ':root');
    const khai = new Map([...(khoiRoot[0]?.trong ?? '').matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()] as [string, string]));
    khaiCua[ten] = khai;

    const sai = Object.entries(BANG_MAU).filter(([bien, giaTri]) => chuanHoa(khai.get(bien) ?? '') !== chuanHoa(giaTri))
      .map(([bien, giaTri]) => `${bien}: ${khai.get(bien) ?? 'không khai'} (cần ${giaTri})`);
    const thua = [...khai.keys()].filter((b) => !(b in BANG_MAU));
    ok(`${ten}: khối :root khai đúng ${Object.keys(BANG_MAU).length} biến của bảng màu chốt 09/10/2026, không thêm biến nào, chỉ một khối :root`,
      khoiRoot.length === 1 && sai.length === 0 && thua.length === 0, [...sai, ...thua.map((b) => `thừa ${b}`)].join(' · '));

    const conCu = [...new Set(s.match(MA_CU) ?? [])];
    ok(`${ten}: không còn mã màu của bảng cũ (hex hay bộ ba số RGB), kể cả trong chú thích và trong mã JavaScript`, conCu.length === 0, conCu.join(' '));

    // Màu viết cứng ngoài khối :root: trong <style>, trong thuộc tính style và trong chuỗi của mã JavaScript dựng HTML.
    const ngoaiRoot = css.replace(/:root\s*\{[^{}]*\}/, '');
    const quyTac = quyTacPhang(ngoaiRoot);
    const noiTuyen = [...s.replace(/<style\b[\s\S]*?<\/style>/, '').matchAll(/style="([^"]*)"|style=\\?'([^']*)'/g)].map((m) => m[1] ?? m[2] ?? '').join(';');
    const hexLa = [...new Set([...hexTrong(quyTac.map((q) => q.trong).join(';')), ...hexTrong(noiTuyen)].filter((h) => !HEX_DUOC.has(h)))];
    const boBaLa = [...(ngoaiRoot + ';' + noiTuyen).matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g)].map((m) => m.slice(1).join(',')).filter((b) => !BO_BA_DUOC.has(b));
    ok(`${ten}: ngoài khối :root không viết cứng mã màu nào (trừ trắng, mực của tờ tem vẽ thử, màn hình cân vẽ trong hướng dẫn); rgb() chỉ dùng số của bảng`,
      quyTac.length > 20 && hexLa.length === 0 && boBaLa.length === 0, [...hexLa, ...boBaLa.map((b) => `rgb(${b})`)].join(' ') || `chỉ đọc được ${quyTac.length} quy tắc CSS`);

    // Marigold trên thẻ trắng chỉ 1,97 : 1, Warm Stone 2,31 : 1: hai màu này chỉ làm chữ trên đầu trang và khối mở đầu nền Charcoal.
    const chuVang = quyTac.filter((q) => !q.trongIn && /(?:^|[;\s])color\s*:\s*var\(--(mu-tat|da)\)/.test(q.trong) && !/^(header|header\.dau|\.phan)\b/.test(q.boChon)).map((q) => q.boChon);
    ok(`${ten}: Marigold và Warm Stone chỉ làm màu chữ trên nền Charcoal (đầu trang, khối mở đầu từng phần)`, chuVang.length === 0, chuVang.join(' | '));

    const oNhap = quyTac.filter((q) => /(^|[\s,])(input|textarea|select)\b/.test(q.boChon) && !/checkbox|radio/.test(q.boChon) && /border\s*:/.test(q.trong));
    const oMo = oNhap.filter((q) => !/border\s*:\s*1px solid var\(--vien-o\)/.test(q.trong)).map((q) => q.boChon);
    const canCo = ten === 'giao-dien.html' ? 4 : 0;   // hướng dẫn không có ô nhập nào
    ok(`${ten}: mọi ô nhập kẻ viền bằng --vien-o — viền mờ thì đứng ở quầy không thấy chỗ để gõ (${oNhap.length} quy tắc)`,
      oNhap.length >= canCo && oMo.length === 0, oMo.join(' | ') || `chỉ thấy ${oNhap.length} quy tắc ô nhập, cần ít nhất ${canCo}`);
  }
  const [a, b] = [khaiCua['giao-dien.html']!, khaiCua['huong-dan.html']!];
  const lech = [...new Set([...a.keys(), ...b.keys()])].filter((k) => chuanHoa(a.get(k) ?? '') !== chuanHoa(b.get(k) ?? ''));
  ok('giao-dien.html và huong-dan.html khai cùng bộ biến, cùng giá trị', a.size > 0 && lech.length === 0, lech.join(', '));

  // Bộ lọc mã cũ phải bắt được mọi kiểu viết — để các phép kiểm trên không đạt suông.
  const MAU_THU_CU = ['--do: #B23A2C;', 'color:#6a5d45', 'rgba(30,22,14,.12)', 'rgba(30, 22, 14, .68)', 'rgb(242 , 169,0)', '#F3E8CC'];
  const MAU_THU_MOI = ['--do: #A70C0C;', 'rgba(21,16,8,.12)', 'rgba(245,170,20,.4)', '#1A683F', 'margin: 30px 22px 14px'];
  ok('Bộ lọc mã cũ bắt được mã cũ ở các kiểu viết, không bắt nhầm mã của bảng mới hay số đo',
    MAU_THU_CU.every((m) => m.match(MA_CU)) && !MAU_THU_MOI.some((m) => m.match(MA_CU)),
    [...MAU_THU_CU.filter((m) => !m.match(MA_CU)).map((m) => `lọt: ${m}`), ...MAU_THU_MOI.filter((m) => m.match(MA_CU)).map((m) => `bắt nhầm: ${m}`)].join(' | '));

  // Tương phản — chữ thường ≥ 4,5 : 1; viền ô nhập và đèn ≥ 3 : 1.
  const M = BANG_MAU as Record<string, string>, TRANG = '#FFFFFF';
  const chuPhu = (nen: string) => phaTren(M['--than']!, nen, 0.68);
  const CAP: [string, string, string, number][] = [
    ['chữ than trên nền kem', M['--than']!, M['--kem']!, 7],
    ['chữ than trên thẻ trắng', M['--than']!, TRANG, 7],
    ['chữ phụ (than 68 %) trên thẻ trắng', chuPhu(TRANG), TRANG, 4.5],
    ['chữ phụ trên nền kem (tên thẻ chưa chọn)', chuPhu(M['--kem']!), M['--kem']!, 4.5],
    ['chữ phụ trên kem sau (nhãn "giữ nguyên")', chuPhu(M['--kem-sau']!), M['--kem-sau']!, 4.5],
    ['chữ trắng trên đỏ (nút chính)', TRANG, M['--do']!, 4.5],
    ['chữ trắng trên đỏ đậm (nút chính khi di chuột)', TRANG, M['--do-dam']!, 4.5],
    ['chữ BEEFTOWN (Marigold) trên đầu trang than', M['--mu-tat']!, M['--than']!, 4.5],
    ['chữ Warm Stone trên đầu trang than', M['--da']!, M['--than']!, 4.5],
    ['chữ kem trên than (thẻ lọc đang chọn)', M['--kem']!, M['--than']!, 7],
    ['chữ than trên Marigold (nhãn "sửa", "cận date")', M['--than']!, M['--mu-tat']!, 4.5],
    ['chữ xanh trên nền xanh nhạt (nhãn "thêm", "đủ")', M['--xanh']!, M['--xanh-nen']!, 4.5],
    ['chữ cảnh báo (--vang-chu) trên thẻ trắng', M['--vang-chu']!, TRANG, 4.5],
    ['chữ cảnh báo trên nền vàng nhạt', M['--vang-chu']!, M['--vang-nen']!, 4.5],
    ['chữ đỏ đậm trên nền vàng nhạt (cảnh báo ô thông số)', M['--do-dam']!, M['--vang-nen']!, 4.5],
    ['chữ than trên nền đỏ nhạt (khung báo lỗi)', M['--than']!, M['--do-nen']!, 7],
    ['viền ô nhập trên nền trắng của ô', M['--vien-o']!, TRANG, 3],
    ['đèn "chưa rõ" (--vien-o) trên thẻ trắng', M['--vien-o']!, TRANG, 3],
  ];
  const thieu = CAP.filter(([, chu, nen, can]) => tuongPhan(chu, nen) < can).map(([ten, chu, nen, can]) => `${ten}: ${so(tuongPhan(chu, nen))} (cần ≥ ${can})`);
  ok(`Tương phản WCAG 2.2: ${CAP.length} cặp chữ / nền, viền ô nhập, đèn của giao diện đều đạt (chữ ≥ 4,5 : 1; viền, đèn ≥ 3 : 1)`, thieu.length === 0, thieu.join(' · '));
  const cam: [string, string, string][] = [['Marigold trên thẻ trắng', M['--mu-tat']!, TRANG], ['Marigold trên nền kem', M['--mu-tat']!, M['--kem']!],
    ['Warm Stone trên thẻ trắng', M['--da']!, TRANG], ['đỏ trên than', M['--do']!, M['--than']!]];
  ok(`Các cặp không được dùng làm chữ đều dưới 3 : 1 — ${cam.map(([t, x, y]) => `${t} ${so(tuongPhan(x, y))}`).join(' · ')}`, cam.every(([, x, y]) => tuongPhan(x, y) < 3));
}

if ((import.meta as { main?: boolean }).main) {
  let dat = 0, hong = 0;
  await thuBangMau((ten, dk, ct = '') => {
    if (dk) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten} ${ct}`); }
  });
  console.log(hong === 0 ? `\nTẤT CẢ ${dat} KIỂM TRA BẢNG MÀU ĐỀU ĐẠT` : `\n${hong} KIỂM TRA HỎNG / ${dat + hong}`);
  process.exit(hong === 0 ? 0 : 1);
}
