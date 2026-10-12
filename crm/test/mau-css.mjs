/**
 * Bộ quét cách viết màu dùng chung cho hai kiểm thử bảng màu: test-cong-khai-giao-dien.mjs (trang công
 * khai) và test-noi-bo-bang-mau.mjs (/noi-bo, kho). Không phải file kiểm thử (tên không bắt đầu bằng
 * "test-"), nên npm test không chạy riêng nó.
 *
 * Trắng (và mọi màu ngoài bảng) viết được bằng nhiều cách khác ngoài mã hex: rgb(255, 255, 255),
 * hsl(0 0% 100%), oklch(1 0 0), color(srgb 1 1 1), tên màu white / ivory / snow, màu hệ thống Canvas…
 * Hàm taoMauLaTrong(boBaDuoc) trả về một hàm quét một giá trị CSS:
 *   · rgb() / rgba(): ba số đầu phải là một bộ ba được phép (độ trong tùy ý);
 *   · không hàm màu nào khác — bảng màu khai bằng hex, không cần hsl(), oklch(), lab(), color()…;
 *   · không tên màu CSS (white, ivory, red…): chỉ transparent, currentColor và biến của bảng;
 *   · màu hệ thống (Canvas, Highlight…) chỉ trong @media (forced-colors: active) — ngoài chế độ đó
 *     Canvas chính là trắng.
 */

// 148 tên màu của CSS Color 4 (transparent và currentColor không phải tên màu). Đứng riêng thành một từ:
// không dính chữ, số, gạch nối, #, . hay $ phía trước (var(--do-red), .white, #red), không dính chữ, gạch
// nối hay ngoặc mở phía sau (white-space, red()).
export const TEN_MAU_CSS = new RegExp(`(?<![\\w#.$-])(?:${`aliceblue antiquewhite aqua aquamarine azure beige bisque black
  blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan
  darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid
  darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue
  dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green
  greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue
  lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue
  lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue
  mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue
  mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen
  paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue
  saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen
  steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen`.trim().split(/\s+/).join('|')})(?![\\w(-])`, 'gi');
// Màu hệ thống (CSS Color 4, mục 6.2) — ngoài chế độ tương phản cao, Canvas và Field là trắng.
export const MAU_HE_THONG = /(?<![\w#.$-])(?:AccentColor|AccentColorText|ActiveText|ButtonBorder|ButtonFace|ButtonText|Canvas|CanvasText|Field|FieldText|GrayText|Highlight|HighlightText|LinkText|Mark|MarkText|SelectedItem|SelectedItemText|VisitedText)(?![\w(-])/gi;

/** boBaDuoc: tập chuỗi "r,g,b" được phép trong rgb() / rgba(). Trả về hàm (giaTri, tuongPhanCao) → danh sách cách viết lạ. */
export function taoMauLaTrong(boBaDuoc) {
  return (giaTri, tuongPhanCao) => {
    const v = giaTri.replace(/url\((?:"[^"]*"|'[^']*'|[^)]*)\)/gi, ' ').replace(/"[^"]*"|'[^']*'/g, ' ');
    const la = [];
    for (const m of v.matchAll(/(?<![\w-])rgba?\(/gi)) {
      const dong = v.indexOf(')', m.index);
      const trong = v.slice(m.index + m[0].length, dong < 0 ? undefined : dong);
      const so = trong.split(/[\s,/]+/).filter(Boolean);
      const baSo = so.slice(0, 3);
      if (so.length < 3 || !baSo.every(x => /^\d{1,3}$/.test(x)) || !boBaDuoc.has(baSo.map(Number).join(','))) la.push(`${m[0]}${trong})`);
    }
    for (const m of v.matchAll(/(?<![\w-])(?:hsla?|hwb|lab|lch|oklab|oklch|color|light-dark|device-cmyk)\(/gi)) la.push(`${m[0]}…)`);
    for (const m of v.matchAll(TEN_MAU_CSS)) la.push(m[0]);
    if (!tuongPhanCao) for (const m of v.matchAll(MAU_HE_THONG)) la.push(`${m[0]} (màu hệ thống ngoài forced-colors)`);
    return la;
  };
}
