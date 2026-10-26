/**
 * PHÉP ĐO THÀNH PHẦN VÀ KHUNG TRANG — dùng chung cho trinh-duyet.mjs và thu-day-du.mjs
 * =================================================================================
 *
 * Quy tắc thành phần của đợt redesign (PR 2: đầu trang, chân trang, nút, thẻ, câu hỏi thường gặp, ô
 * nhập, biểu tượng, cỡ chữ và lưới) đo NGAY TRÊN TRANG ĐÃ DỰNG, không đọc CSS: một quy tắc CSS viết
 * đúng mà bị quy tắc khác đè thì đọc mã vẫn thấy đúng, còn khách thì thấy sai.
 *
 * doGiaoDien() chạy TRONG trang (page.evaluate) nên phải tự đủ: mọi hằng nằm trong thân hàm. Trả về
 * { tên phép đo: [chỗ sai…] } — mảng rỗng là đạt. PHEP_DO ghi tên từng phép đo cho dòng ok(…).
 *
 * PR 3 (trang chủ và thực đơn) thêm bốn phép đo: anh (ảnh và nhãn "Ảnh minh họa"), nhanKhay (thẻ "Cách đọc
 * nhãn khay"), trangChu (màn đầu và các khối của trang chủ), thucDon (trang Thực đơn) — và gỡ hai ngoại lệ
 * PR 2 để lại cho nó: thẻ nhãn khay nay cũng bị đo "không nền trắng", biểu tượng của nhãn món nay cũng 24px.
 * Không còn ngoại lệ nào trong file này.
 */

export const PHEP_DO = {
  vungCham: 'nút, link điều hướng, link chân trang, summary, ô nhập, ô chọn giờ cao ≥ 48px',
  dauTrang: 'đầu trang cao 64px (dưới 1080px) / 80px (từ 1080px), rộng hết cửa sổ; điều hướng 15–16px; logo ≥ 160px (dưới 360px: brandmark ≥ 48px), đúng tỷ lệ',
  ngonNgu: 'bộ chọn ngôn ngữ đủ 3 thứ tiếng, thứ tiếng đang xem đánh dấu bằng chữ đậm và nét gạch (không chỉ bằng màu)',
  khongTrang: 'không nền trắng: mọi màu nền (kể cả dải màu background-image và phần tử giả ::before / ::after) thuộc bảng màu của trang công khai',
  nut: 'nút: bo 4px, đệm ngang 20px, đúng màu theo bề mặt; mỗi nhóm nút một nút chính',
  the: 'thẻ: nền Cream hoặc kem sau, đệm 20px (điện thoại) / 24px, viền mảnh, không bóng đổ; thẻ khác màu nền phía sau hoặc viền tương phản ≥ 1,35 : 1',
  cauHoi: 'câu hỏi thường gặp: mỗi hàng cao ≥ 56px, bấm được trên toàn chiều rộng, có biểu tượng mở/đóng',
  bieuTuong: 'biểu tượng: 24px, nét 1,5px, Beef Red trên kem và Cream trên đỏ, đi kèm nhãn chữ',
  chu: 'chữ và lưới: chỉ Montserrat, chữ chạy 16/24px, h1 32/38 → 48/56px (tiếng Hàn cùng cỡ, dòng 1,28: 32/41 → 48/61px), lề điện thoại clamp(20px, 5vw, 40px) — 20px tới màn 400px, khung ≤ 1200px, khoảng cách khối 48–64 / 72–96px',
  chanTrang: 'chân trang: dải đỏ, logo Cream, không hoa văn chữ, chữ ≥ 14px, điện thoại chia link 2 cột, dải pháp nhân nền Charcoal',
  anh: 'ảnh: ảnh AI nào cũng có nhãn "Ảnh minh họa" nhìn thấy, đọc được; nhãn của ảnh tách nền không che món (0 điểm ảnh đặc dưới nhãn); không bóng đổ; đúng tỷ lệ khung; không chữ, logo hay phần tử nào đè lên ảnh; chỉ ảnh màn đầu tải ngay',
  nhanKhay: 'thẻ "Cách đọc nhãn khay": đặt thẳng, không bóng đổ, nền Cream hoặc kem sau, đủ 5 trường theo thứ tự, chỉ tên trường (không giá trị mẫu), đủ lớn để đọc',
  trangChu: 'trang chủ: đủ 8 khối theo thứ tự, dải tối và dải đỏ giữ nguyên; màn đầu có ảnh, câu chính đứng trước ảnh trên điện thoại, hai cột cân nhau trên máy tính, tagline là một dải đỏ gọn không đè lên ảnh; ba bước, cả bữa, đi nhóm đúng bố cục',
  thucDon: 'thực đơn: "Bò tại quầy" vẫn dải tối, có ảnh lát bò và thẻ đọc nhãn khay; "Món ăn" chưa có món thì có ảnh sốt chấm, đã có món thì từng nhóm kiểu cuốn menu (tên nhóm 28px tới cỡ h1, chữ hoa); thẻ món không tràn chữ, thẻ dẫn đầu từ 768px có ảnh bên phải chữ, dưới 600px món đứng sau món dẫn đầu là hàng gọn (ảnh 112–128px bên trái chữ, nhãn ảnh một dòng ở 20 % đáy khung), nhóm không có món dẫn đầu giữ thẻ to; "Đồ uống" có ảnh ba ly không cồn, chưa công bố đồ uống không cồn nào thì vẫn có tên các nhóm không cồn; không phần tử giá',
};

export function doGiaoDien() {
  const RONG = innerWidth;
  const DIEN_THOAI = RONG < 600, MAY_TINH = RONG >= 1024;
  // Lề hai bên của khung trang — chép tay từ THIET-KE.md mục 4 (`--le`): clamp(20px, 5vw, 40px). Tới màn 400px
  // là 20px (điện thoại thường); từ đó lề lớn dần theo 5 % bề rộng (430px: 21,5px; 599px: 30px), tới 40px ở 800px.
  const LE = Math.min(40, Math.max(20, RONG * 0.05));
  const NGON_NGU = document.documentElement.lang;
  const hien = el => {
    const k = el.getBoundingClientRect();
    return el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && k.width > 0 && k.height > 0;
  };
  const moTa = el => {
    const chu = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    const lop = typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).join('.')}` : '';
    return `<${el.tagName.toLowerCase()}${lop}>${chu ? ` «${chu}»` : ''}`;
  };
  const so = v => parseFloat(v) || 0;
  const mau = s => {
    const m = /^rgba?\(([^)]+)\)$/.exec(String(s).trim());
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean);
    const [r, g, b] = p.slice(0, 3).map(Number);
    const a = p[3] === undefined ? 1 : p[3].endsWith('%') ? parseFloat(p[3]) / 100 : Number(p[3]);
    return [r, g, b, a].some(Number.isNaN) ? null : { r, g, b, a };
  };
  const bo = c => (c ? `${c.r},${c.g},${c.b}` : '');
  // Bảng màu của trang công khai (THUONG-HIEU.md mục 1 và 4) — chép tay, KHÔNG đọc CSS của trang.
  const KEM = '240,227,208', KEM_SAU = '235,220,198', KEM_DAM = '231,213,188';
  const DO = '167,12,12', DO_DAM = '137,6,7', THAN = '21,16,8';
  const VANG = '245,170,20', DA = '184,169,140', VIEN_O = '122,115,102', KHUNG_TOI = '33,26,16';
  const BANG = new Set([KEM, KEM_SAU, KEM_DAM, DO, DO_DAM, THAN, VANG, DA, VIEN_O, KHUNG_TOI]);
  const NEN_SANG = new Set([KEM, KEM_SAU, KEM_DAM]);
  const NEN_DO = new Set([DO, DO_DAM]);
  /** Màu nền gần như đặc đầu tiên phía sau một phần tử (nền nhuộm nhạt thì đi tiếp lên trên). */
  const nenSau = el => {
    for (let e = el; e; e = e.parentElement) {
      const c = mau(getComputedStyle(e).backgroundColor);
      if (c && c.a >= 0.5) return bo(c);
    }
    return '';
  };
  /** Độ sáng tương đối và tỷ lệ tương phản theo WCAG 2.2; màu là [r, g, b] 0–255. */
  const doSang = ([r, g, b]) => {
    const k = [r, g, b].map(v => v / 255).map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
  };
  const tuongPhan = (a, b) => {
    const [sang, toi] = [doSang(a), doSang(b)].sort((x, y) => y - x);
    return (sang + 0.05) / (toi + 0.05);
  };
  // Viền thẻ nhạt nhất còn coi là "nhìn thấy": nét kẻ mảnh của chính hệ này (--vach: Charcoal 16 %) trên
  // thẻ Cream đặt giữa nền Cream cho 1,40 : 1; ngưỡng 1,35 chừa phần làm tròn. Không lấy 3 : 1 của WCAG
  // 1.4.11: mức đó dành cho ranh giới của thứ bấm được (ô nhập — viền --vien-o 3,71 : 1); thẻ chỉ gom
  // nội dung, chữ trong thẻ vẫn đọc được khi không thấy viền. Charcoal 12 % (1,28 : 1) trở xuống là hỏng.
  const VIEN_THE_TOI_THIEU = 1.35;
  const beMat = el => {
    const b = el.closest('.be-do, .be-toi, .be-kem, .be-kem-sau, .be-kem-dam');
    return !b ? 'sang' : b.classList.contains('be-do') ? 'do' : b.classList.contains('be-toi') ? 'toi' : 'sang';
  };
  const moi = chon => [...document.querySelectorAll(chon)];
  const kq = {};

  // --- 1. Vùng chạm ---------------------------------------------------------------------------
  const CHAM = [
    '.nut', 'nav a', 'footer a', '.doi-ngon-ngu', 'summary', '.lien-ket', '.dt-logo', '.kmd-dia-chi', '[role="tab"]',
    'button', 'select', 'textarea', 'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])',
    '.hb-chip-o', '.o-chon', '.hb-dong-y',
  ].join(', ');
  kq.vungCham = moi(CHAM)
    .filter(el => hien(el) && !el.closest('[aria-hidden="true"], .bo-qua'))
    .filter(el => el.getBoundingClientRect().height < 47.5)
    .map(el => `${moTa(el)} cao ${el.getBoundingClientRect().height.toFixed(1)}px`);

  // --- 2. Đầu trang -----------------------------------------------------------------------------
  kq.dauTrang = [];
  const dau = document.querySelector('header.dau-trang');
  if (!dau) kq.dauTrang.push('không có <header class="dau-trang">');
  else {
    const cao = dau.getBoundingClientRect().height;
    const mong = RONG >= 1080 ? 80 : 64;
    if (Math.abs(cao - mong) > 0.6) kq.dauTrang.push(`cao ${cao.toFixed(1)}px, cần ${mong}px`);
    if (bo(mau(getComputedStyle(dau).backgroundColor)) !== KEM) kq.dauTrang.push(`nền ${getComputedStyle(dau).backgroundColor}, cần Cream`);
    // Thanh rộng hết bề ngang cửa sổ (trừ thanh cuộn thật nếu có). Hẹp hơn nghĩa là trang đang chừa một dải
    // trống bên phải: scrollbar-gutter: stable làm Chromium chừa 15px cả khi không có thanh cuộn nào chiếm
    // chỗ (trình duyệt của kiểm thử và của máy chụp ảnh) — mọi ảnh chụp có một dải kem thừa, mọi phép đo lệch 15px.
    const rongDau = dau.getBoundingClientRect().width;
    if (Math.abs(rongDau - document.documentElement.clientWidth) > 0.5) {
      kq.dauTrang.push(`thanh rộng ${rongDau.toFixed(1)}px trong cửa sổ ${document.documentElement.clientWidth}px — trang đang chừa một dải trống bên phải`);
    }
    // Guideline: lockup rộng tối thiểu 160px; hẹp hơn thì dùng brandmark (đầu bò), tối thiểu 48px. Thanh chỉ
    // được đổi sang brandmark khi màn dưới 360px — không đủ chỗ cho lockup cạnh nút danh mục.
    const logo = [...dau.querySelectorAll('.dt-logo img')].filter(hien);
    if (logo.length !== 1) kq.dauTrang.push(`cần đúng một logo hiện trên thanh, thấy ${logo.length}`);
    else {
      const k = logo[0].getBoundingClientRect();
      const tiLe = logo[0].naturalWidth && logo[0].naturalHeight ? logo[0].naturalWidth / logo[0].naturalHeight
        : Number(logo[0].getAttribute('width')) / Number(logo[0].getAttribute('height'));
      const laLockup = /logo-ngang-do\.svg$/.test(logo[0].getAttribute('src') ?? '');
      if (laLockup && k.width < 159.5) kq.dauTrang.push(`logo rộng ${k.width.toFixed(1)}px — guideline: lockup tối thiểu 160px`);
      if (!laLockup && (RONG >= 360 || k.width < 47.5 || !/dau-bo-do\.svg$/.test(logo[0].getAttribute('src') ?? ''))) {
        kq.dauTrang.push(`từ 360px thanh phải dùng lockup; dưới 360px là brandmark đầu bò ≥ 48px — thấy ${logo[0].getAttribute('src')} rộng ${k.width.toFixed(1)}px`);
      }
      if (Math.abs(k.width / k.height - tiLe) > 0.03) kq.dauTrang.push(`logo bị kéo giãn: ${k.width.toFixed(1)} × ${k.height.toFixed(1)}`);
    }
    const dieuHuong = [...dau.querySelectorAll('.dt-nav a')].filter(hien);
    const menu = dau.querySelector('.menu-gon summary');
    if (RONG >= 1080) {
      if (dieuHuong.length < 3) kq.dauTrang.push(`chỉ ${dieuHuong.length} mục điều hướng hiện trên thanh`);
      for (const a of dieuHuong) {
        const co = so(getComputedStyle(a).fontSize);
        if (co < 15 || co > 16) kq.dauTrang.push(`${moTa(a)} cỡ ${co}px, cần 15–16px`);
      }
      if (menu && hien(menu)) kq.dauTrang.push('màn rộng mà nút danh mục gọn vẫn hiện');
    } else if (!menu || !hien(menu) || !menu.textContent.trim()) {
      kq.dauTrang.push('màn hẹp không có nút danh mục có nhãn chữ');
    }
    if (RONG >= 768) {
      const hoiBan = dau.querySelector('.dt-hoi-ban');
      if (!hoiBan || !hien(hoiBan)) kq.dauTrang.push('từ 768px nút Hỏi bàn phải hiện ngay trên thanh');
    }
  }

  // --- 3. Bộ chọn ngôn ngữ ----------------------------------------------------------------------
  kq.ngonNgu = [];
  const boChon = moi('.dt-ngon-ngu, .mg-ngon-ngu').filter(hien);
  if (RONG >= 768 && !boChon.some(u => u.closest('.dt-phai') && !u.closest('.mg-bang'))) {
    kq.ngonNgu.push('từ 768px bộ chọn ngôn ngữ phải hiện ngay trên thanh đầu trang');
  }
  for (const u of boChon) {
    const muc = [...u.querySelectorAll('.doi-ngon-ngu')];
    const ten = `${moTa(u)}:`;
    if (muc.map(m => m.getAttribute('lang')).join(',') !== 'vi,en,ko') kq.ngonNgu.push(`${ten} cần đủ vi, en, ko theo thứ tự — thấy ${muc.map(m => m.getAttribute('lang')).join(',')}`);
    const dangXem = muc.filter(m => m.getAttribute('aria-current') === 'true');
    if (dangXem.length !== 1 || dangXem[0].getAttribute('lang') !== NGON_NGU) {
      kq.ngonNgu.push(`${ten} cần đúng một mục aria-current="true" mang lang="${NGON_NGU}"`);
      continue;
    }
    const net = m => {
      const cs = getComputedStyle(m);
      const vien = so(cs.borderBottomWidth) >= 2 && (mau(cs.borderBottomColor)?.a ?? 0) > 0;
      return vien || cs.textDecorationLine.includes('underline');
    };
    const dam = m => Number(getComputedStyle(m).fontWeight);
    if (dam(dangXem[0]) < 700) kq.ngonNgu.push(`${ten} thứ tiếng đang xem phải in đậm (font-weight ${dam(dangXem[0])})`);
    if (!net(dangXem[0])) kq.ngonNgu.push(`${ten} thứ tiếng đang xem phải có nét gạch`);
    for (const m of muc.filter(x => x !== dangXem[0])) {
      if (m.tagName !== 'A' || !m.getAttribute('href') || !m.getAttribute('hreflang')) kq.ngonNgu.push(`${ten} ${moTa(m)} phải là link có hreflang`);
      if (dam(m) >= dam(dangXem[0])) kq.ngonNgu.push(`${ten} ${moTa(m)} đậm bằng mục đang xem — không phân biệt được bằng chữ`);
      if (net(m)) kq.ngonNgu.push(`${ten} ${moTa(m)} cũng có nét gạch — không phân biệt được bằng nét`);
    }
    for (const m of muc) if (so(getComputedStyle(m).fontSize) < 14) kq.ngonNgu.push(`${ten} ${moTa(m)} cỡ ${getComputedStyle(m).fontSize}, cần ≥ 14px`);
  }

  // --- 4. Không nền trắng -----------------------------------------------------------------------
  // Nền khách nhìn thấy đến từ ba chỗ: background-color, background-image (dải màu — gradient) và phần tử
  // giả ::before / ::after. Đo cả ba: tô trắng bằng linear-gradient(#fff, #fff) hay bằng một ::before phủ
  // kín thì background-color của phần tử vẫn đúng bảng màu mà khách vẫn thấy nền trắng.
  const nenLa = new Map();
  const ghiNenLa = (chuoi, noi) => { if (!nenLa.has(chuoi)) nenLa.set(chuoi, noi); };
  const xetNen = (cs, noi) => {
    const chuoi = cs.backgroundColor;
    const c = mau(chuoi);
    if (c ? (c.a > 0 && !BANG.has(bo(c))) : chuoi !== 'transparent') ghiNenLa(chuoi, noi);
    const anh = cs.backgroundImage;
    if (!anh || anh === 'none') return;
    // File ảnh và SVG (url(…)) không đo ở đây: màu của SVG thương hiệu kiểm ở test-cong-khai-giao-dien nhóm 3.
    const dai = anh.replace(/url\((?:"[^"]*"|'[^']*'|[^)]*)\)/g, '');
    // Trình duyệt ghi màu đã tính thành rgb(…) / rgba(…); màu ở hệ khác (oklch, lab, color(…)) không so
    // được với bảng màu chép tay nên coi là màu lạ.
    for (const m of dai.match(/(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\([^()]*\)/g) ?? []) {
      const d = mau(m);
      if (d ? (d.a > 0 && !BANG.has(bo(d))) : true) ghiNenLa(`${m} (trong background-image)`, noi);
    }
  };
  for (const el of [document.documentElement, document.body, ...document.body.querySelectorAll('*')]) {
    if (el !== document.documentElement && !hien(el)) continue;
    xetNen(getComputedStyle(el), moTa(el));
    for (const gia of ['::before', '::after']) {
      const csGia = getComputedStyle(el, gia);
      // content none / normal: phần tử giả không được sinh ra.
      if (csGia.content === 'none' || csGia.content === 'normal' || csGia.display === 'none') continue;
      xetNen(csGia, `${moTa(el)}${gia}`);
    }
    if (el.matches('input[type="file"]')) xetNen(getComputedStyle(el, '::file-selector-button'), `${moTa(el)}::file-selector-button`);
  }
  kq.khongTrang = [...nenLa].map(([m, el]) => `${m} ở ${el}`);
  // Ô đánh dấu, ô chọn một vẽ kiểu hệ thống thì nền trắng mà getComputedStyle không thấy (trình duyệt tự
  // vẽ): ô nào còn hiện ra thì phải là ô tự vẽ (appearance: none).
  for (const o of moi('input[type="checkbox"], input[type="radio"]').filter(hien)) {
    if (o.closest('[aria-hidden="true"]')) continue;
    if (getComputedStyle(o).appearance !== 'none') kq.khongTrang.push(`${moTa(o)} name="${o.name}" vẽ kiểu hệ thống (nền trắng)`);
  }

  // --- 5. Nút -----------------------------------------------------------------------------------
  kq.nut = [];
  for (const n of moi('.nut').filter(hien)) {
    const cs = getComputedStyle(n);
    const ten = moTa(n);
    if (so(cs.borderTopLeftRadius) !== 4) kq.nut.push(`${ten} bo góc ${cs.borderTopLeftRadius}, cần 4px`);
    const dem = so(cs.paddingLeft);
    if (n.classList.contains('nut-nho') ? dem < 16 : Math.abs(dem - 20) > 0.5) kq.nut.push(`${ten} đệm ngang ${cs.paddingLeft}, cần 20px`);
    if (so(cs.fontSize) < 15) kq.nut.push(`${ten} chữ ${cs.fontSize}, cần ≥ 15px`);
    if (n.getAttribute('aria-busy') === 'true' || n.disabled) continue;
    const be = beMat(n);
    const [nen, chu, vien] = [bo(mau(cs.backgroundColor)), bo(mau(cs.color)), bo(mau(cs.borderTopColor))];
    const nenTrong = (mau(cs.backgroundColor)?.a ?? 0) === 0;
    if (n.classList.contains('nut-chinh')) {
      const mong = be === 'do' ? [KEM, DO_DAM] : [DO, KEM];
      if (nen !== mong[0] || chu !== mong[1]) kq.nut.push(`${ten} (nút chính, bề mặt ${be}) nền ${cs.backgroundColor} chữ ${cs.color}`);
    } else if (n.classList.contains('nut-vien')) {
      if (be === 'sang' && (nen !== KEM || nenTrong || chu !== DO || vien !== DO)) {
        kq.nut.push(`${ten} (nút phụ trên kem) cần nền Cream, chữ và viền Beef Red — nền ${cs.backgroundColor} chữ ${cs.color} viền ${cs.borderTopColor}`);
      }
      if (be !== 'sang' && (chu !== KEM || vien !== KEM)) {
        kq.nut.push(`${ten} (nút phụ, bề mặt ${be}) cần chữ và viền Cream — chữ ${cs.color} viền ${cs.borderTopColor}`);
      }
      if (so(cs.borderTopWidth) < 1) kq.nut.push(`${ten} (nút phụ) không có viền`);
    }
  }
  for (const h of moi('.hang-nut').filter(hien)) {
    const chinh = [...h.querySelectorAll('.nut-chinh')].filter(hien);
    if (chinh.length > 1) kq.nut.push(`nhóm nút có ${chinh.length} nút chính: ${chinh.map(moTa).join(' · ')}`);
  }

  // --- 6. Thẻ -----------------------------------------------------------------------------------
  kq.the = [];
  for (const t of moi('.the, .hb-the, .lt3-gon').filter(hien)) {
    const cs = getComputedStyle(t);
    const ten = moTa(t).slice(0, 60);
    if (cs.boxShadow !== 'none') kq.the.push(`${ten} có bóng đổ ${cs.boxShadow}`);
    if (![KEM, KEM_SAU].includes(bo(mau(cs.backgroundColor)))) kq.the.push(`${ten} nền ${cs.backgroundColor}, cần Cream hoặc kem sau`);
    const mong = DIEN_THOAI ? 20 : 24;
    if (Math.abs(so(cs.paddingRight) - mong) > 0.5 || Math.abs(so(cs.paddingBottom) - mong) > 0.5) {
      kq.the.push(`${ten} đệm phải ${cs.paddingRight}, dưới ${cs.paddingBottom} — cần ${mong}px`);
    }
    const canh = ['Top', 'Right', 'Bottom', 'Left'].filter(c => so(cs[`border${c}Width`]) >= 1 && (mau(cs[`border${c}Color`])?.a ?? 0) > 0);
    if (!canh.length) kq.the.push(`${ten} không có viền hay nét nào tách khỏi nền`);
    // Thẻ phải nhìn ra là thẻ: nền của nó khác nền phía sau, HOẶC có một nét viền đủ rõ trên nền phía sau.
    // Thẻ Cream nằm trên Cream với viền gần trong suốt thì mọi số đo khác vẫn đạt mà khách không thấy thẻ.
    const nenThe = mau(cs.backgroundColor);
    const nenNgoai = nenSau(t.parentElement);
    if (nenThe && nenNgoai && bo(nenThe) === nenNgoai) {
      const ngoai = nenNgoai.split(',').map(Number);
      const ro = Math.max(0, ...canh.map(c => {
        const v = mau(cs[`border${c}Color`]);
        // Viền có độ trong vẽ đè lên nền của chính thẻ (background-clip: border-box) — pha ra màu mắt thấy.
        return tuongPhan(['r', 'g', 'b'].map(k => v[k] * v.a + nenThe[k] * (1 - v.a)), ngoai);
      }));
      if (ro < VIEN_THE_TOI_THIEU) {
        kq.the.push(`${ten} cùng màu với nền phía sau (rgb(${nenNgoai})) mà viền chỉ tương phản ${ro.toFixed(2)} : 1 — cần ≥ ${VIEN_THE_TOI_THIEU} : 1 hoặc nền khác nền phía sau`);
      }
    }
  }
  const bang = document.querySelector('.mg-bang');
  if (bang && getComputedStyle(bang).boxShadow !== 'none') kq.the.push('bảng danh mục gọn (.mg-bang) còn bóng đổ');

  // --- 7. Câu hỏi thường gặp --------------------------------------------------------------------
  kq.cauHoi = [];
  for (const s of moi('.cau-hoi summary').filter(hien)) {
    const k = s.getBoundingClientRect();
    const khung = s.closest('.cau-hoi').getBoundingClientRect();
    if (k.height < 55.5) kq.cauHoi.push(`${moTa(s)} cao ${k.height.toFixed(1)}px`);
    if (k.width < khung.width - 1) kq.cauHoi.push(`${moTa(s)} rộng ${k.width.toFixed(0)}px, khối rộng ${khung.width.toFixed(0)}px`);
    if (![...s.querySelectorAll('svg')].some(hien)) kq.cauHoi.push(`${moTa(s)} không có biểu tượng mở/đóng`);
    if (getComputedStyle(s).cursor !== 'pointer') kq.cauHoi.push(`${moTa(s)} con trỏ không phải bàn tay`);
  }

  // --- 8. Biểu tượng (bộ BieuTuong.astro: lưới 24, nét 1,5) ---------------------------------------
  kq.bieuTuong = [];
  for (const s of moi('svg[viewBox="0 0 24 24"][stroke-width]').filter(hien)) {
    const k = s.getBoundingClientRect();
    const noi = moTa(s.parentElement).slice(0, 50);
    if (Math.abs(k.width - 24) > 0.5 || Math.abs(k.height - 24) > 0.5) {
      kq.bieuTuong.push(`biểu tượng trong ${noi} cỡ ${k.width.toFixed(1)} × ${k.height.toFixed(1)}px, cần 24px`);
    }
    const duong = s.querySelector('path');
    const csD = duong ? getComputedStyle(duong) : null;
    if (!csD || csD.vectorEffect !== 'non-scaling-stroke' || so(csD.strokeWidth) < 1.5 || so(csD.strokeWidth) > 2) {
      kq.bieuTuong.push(`biểu tượng trong ${noi}: nét ${csD?.strokeWidth} (${csD?.vectorEffect}) — cần 1,5–2px không co theo cỡ`);
    }
    const chu = bo(mau(getComputedStyle(s).color));
    const nen = nenSau(s);
    if (NEN_SANG.has(nen) && ![DO, DO_DAM].includes(chu)) kq.bieuTuong.push(`biểu tượng trong ${noi} trên nền kem màu rgb(${chu}), cần Beef Red`);
    if (NEN_DO.has(nen) && chu !== KEM) kq.bieuTuong.push(`biểu tượng trong ${noi} trên nền đỏ màu rgb(${chu}), cần Cream`);
    const bam = s.closest('a, button, summary');
    if (bam && !bam.textContent.trim()) kq.bieuTuong.push(`biểu tượng hành động trong ${moTa(bam)} không có nhãn chữ`);
  }

  // --- 9. Chữ và lưới ---------------------------------------------------------------------------
  kq.chu = [];
  const csThan = getComputedStyle(document.body);
  if (csThan.fontSize !== '16px' || csThan.lineHeight !== '24px') kq.chu.push(`chữ chạy ${csThan.fontSize}/${csThan.lineHeight}, cần 16px/24px`);
  const phongLa = new Set();
  const di = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = di.nextNode(); n; n = di.nextNode()) {
    const el = n.parentElement;
    if (!n.nodeValue.trim() || !el || el.closest('script, style, noscript, template') || !hien(el)) continue;
    const phong = getComputedStyle(el).fontFamily;
    if (!/^["']?Montserrat["']?\s*(,|$)/.test(phong)) phongLa.add(`${moTa(el).slice(0, 40)}: ${phong.slice(0, 40)}`);
  }
  for (const el of moi('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea, button').filter(hien)) {
    const phong = getComputedStyle(el).fontFamily;
    if (!/^["']?Montserrat["']?\s*(,|$)/.test(phong)) phongLa.add(`${moTa(el).slice(0, 40)}: ${phong.slice(0, 40)}`);
  }
  kq.chu.push(...[...phongLa].slice(0, 4).map(p => `phông không phải Montserrat — ${p}`));
  const h1 = document.querySelector('h1');
  if (h1 && hien(h1)) {
    const cs = getComputedStyle(h1);
    const [co, dong] = [so(cs.fontSize), so(cs.lineHeight)];
    const ghi = `h1 ${co.toFixed(1)}/${dong.toFixed(1)}px`;
    // Cỡ chữ h1 như nhau ở cả ba thứ tiếng: 32px tới 390px, 48px từ 1366px, ở giữa chạy đều. Chỉ chiều cao
    // dòng khác: vi / en 1,17 (32/38 → 48/56px); tiếng Hàn 1,28 (32/41 → 48/61px) vì Hangul cao kín ô chữ,
    // dòng 1,17 thì hai dòng chạm nhau (cong-khai.css: .ck:lang(ko) :is(h1, h2, h3)). Không còn ngoại lệ
    // nào cho tiếng Hàn về cỡ chữ.
    const tiLeDong = NGON_NGU === 'ko' ? 1.28 : 1.17;
    const mongDong = c => `${c}/${Math.round(c * tiLeDong)}px`;
    if (RONG <= 390) {
      if (Math.abs(co - 32) > 0.6 || Math.abs(dong - 32 * tiLeDong) > 1) kq.chu.push(`${ghi} — điện thoại cần ${mongDong(32)}`);
    } else if (RONG >= 1366) {
      if (Math.abs(co - 48) > 0.6 || Math.abs(dong - 48 * tiLeDong) > 1) kq.chu.push(`${ghi} — máy tính cần ${mongDong(48)}`);
    } else if (co < 32 || co > 48 || Math.abs(dong / co - tiLeDong) > 0.02) {
      kq.chu.push(`${ghi} — cần cỡ trong khoảng 32–48px, dòng cao ${String(tiLeDong).replace('.', ',')} lần cỡ chữ`);
    }
    for (const h2 of moi('main h2').filter(hien)) {
      if (so(getComputedStyle(h2).fontSize) >= co) kq.chu.push(`${moTa(h2)} cỡ ${getComputedStyle(h2).fontSize} không nhỏ hơn h1 (${co}px)`);
    }
  }
  for (const k of moi('.khung, .khung-hep').filter(hien)) {
    const r = k.getBoundingClientRect();
    if (r.width > 1200.5) kq.chu.push(`${moTa(k).slice(0, 30)} rộng ${r.width.toFixed(0)}px > 1200px`);
    if (DIEN_THOAI && Math.abs(r.left - LE) > 0.6) kq.chu.push(`${moTa(k).slice(0, 30)} lề trái ${r.left.toFixed(1)}px, màn ${RONG}px cần ${LE.toFixed(1)}px (clamp(20px, 5vw, 40px): 20px tới màn 400px)`);
  }
  for (const m of moi('.muc').filter(hien)) {
    const cs = getComputedStyle(m);
    for (const [ten, v] of [['trên', so(cs.paddingTop)], ['dưới', so(cs.paddingBottom)]]) {
      if (v === 0) continue;   // khối nối liền khối trước (đầu trang con + thân)
      if (DIEN_THOAI && (v < 48 || v > 64)) kq.chu.push(`${moTa(m).slice(0, 30)} đệm ${ten} ${v}px, điện thoại cần 48–64px`);
      if (MAY_TINH && (v < 72 || v > 96)) kq.chu.push(`${moTa(m).slice(0, 30)} đệm ${ten} ${v}px, máy tính cần 72–96px`);
    }
  }

  // --- 10. Chân trang -----------------------------------------------------------------------------
  kq.chanTrang = [];
  const chan = document.querySelector('footer');
  if (!chan) kq.chanTrang.push('không có <footer>');
  else {
    if (document.querySelector('.hoa-van-chu')) kq.chanTrang.push('còn hoa văn chữ BEEFTOWN (.hoa-van-chu)');
    const chinh = chan.querySelector('.ct-chinh'), day = chan.querySelector('.ct-day');
    if (!chinh || bo(mau(getComputedStyle(chinh).backgroundColor)) !== DO) kq.chanTrang.push('dải chính không phải nền Beef Red');
    if (!day || bo(mau(getComputedStyle(day).backgroundColor)) !== THAN) kq.chanTrang.push('dải pháp nhân không phải nền Charcoal');
    const logo = chan.querySelector('img[src$="/thuong-hieu/logo-ngang-kem.svg"]');
    if (!logo || !hien(logo)) kq.chanTrang.push('không thấy logo Cream (logo-ngang-kem.svg)');
    else {
      const k = logo.getBoundingClientRect();
      if (k.width < 159.5 || Math.abs(k.width / k.height - 446 / 124) > 0.03) kq.chanTrang.push(`logo ${k.width.toFixed(1)} × ${k.height.toFixed(1)}px — cần ≥ 160px, đúng tỷ lệ`);
    }
    const nho = new Set();
    const diChan = document.createTreeWalker(chan, NodeFilter.SHOW_TEXT);
    for (let n = diChan.nextNode(); n; n = diChan.nextNode()) {
      const el = n.parentElement;
      if (!n.nodeValue.trim() || !el || el.closest('[aria-hidden="true"], .an-chu') || !hien(el)) continue;
      if (so(getComputedStyle(el).fontSize) < 14) nho.add(`«${n.nodeValue.trim().slice(0, 30)}» ${getComputedStyle(el).fontSize}`);
    }
    kq.chanTrang.push(...[...nho].slice(0, 4).map(c => `chữ dưới 14px: ${c}`));
    const cot = [...chan.querySelectorAll('nav.ct-cot')].filter(hien);
    if (cot.length !== 2) kq.chanTrang.push(`cần 2 cột link (nav.ct-cot), thấy ${cot.length}`);
    else if (DIEN_THOAI) {
      const [a, b] = cot.map(c => c.getBoundingClientRect());
      if (Math.abs(a.top - b.top) > 1 || b.left - a.left < 100) kq.chanTrang.push('điện thoại: hai nhóm link phải đứng cạnh nhau thành 2 cột');
    }
  }

  // --- 11. Ảnh và nhãn "Ảnh minh họa" -------------------------------------------------------------
  // Mọi ảnh của trang công khai đi qua component <Anh>: <figure class="anh"> chứa <picture> và, với ảnh AI,
  // <figcaption class="chu-thich-anh">. Bảy id đầu là ảnh ChatGPT tạo ngày 11/10/2026; 26 id sau là ảnh món của
  // cuốn menu bản sáng (11/10/2026, đều gắn nhãn minh họa) — chép tay, KHÔNG đọc danh mục của trang: gỡ cờ
  // minhHoa của một ảnh thì nhãn biến mất và phép đo này đỏ.
  kq.anh = [];
  const ANH_AI = new RegExp('/anh/(?:' + [
    'hero-vi-gas', 'bo-van-mo-can', 'bo-cat-lat', 'sot-cham', 'mon-an-chia-se', 'bua-an-cung-ban', 'bo-xeo-vi',
    'mon-tartare-bo-hoa-tuyet', 'mon-com-tron-tartare-bo-cay', 'mon-lau-kim-chi', 'mon-lau-bo-bulgogi', 'mon-lau-nam', 'mon-set-4-sot',
    'mon-salad-nam', 'mon-caesar-salad', 'mon-mien-tron-han', 'mon-trung-hap-nui-lua', 'mon-khoai-tay-chien-sot-bo',
    'mon-banh-gao-chien-pho-mai', 'mon-canh-kim-chi', 'mon-dau-phu-ham', 'mon-canh-tuong-dau', 'mon-com-kim-chi-bo', 'mon-com-tron-han',
    'mon-com-tron-trung-ca', 'mon-mi-lanh-cay', 'mon-mi-toowoomba', 'mon-mi-carbonara', 'mon-mi-bo-sot-ca',
    'uong-milky-cloud-makgeolli', 'uong-strawberry-crush', 'uong-berry-rouge-highball', 'uong-khong-con-ba-ly',
  ].join('|') + ')-\\d+x\\d+-\\d+\\.(?:avif|webp)(?:$|[?#])');
  const NHAN_ANH = { vi: 'Ảnh minh họa', en: 'Illustrative image', ko: '연출 이미지' };
  const cuonDau = scrollY;
  const veCho = y => scrollTo({ top: y, left: 0, behavior: 'instant' });
  for (const a of moi('img').filter(i => /\/anh\//.test(i.getAttribute('src') ?? ''))) {
    if (!a.closest('figure.anh')) kq.anh.push(`${a.getAttribute('src')} không nằm trong <figure class="anh"> — ảnh phải đi qua component Anh`);
  }
  const khungAnh = moi('figure.anh');
  for (const f of khungAnh) {
    const a = f.querySelector('img');
    const ten = (a?.getAttribute('src') ?? '').replace(/^.*\/anh\//, '').replace(/-\d+\.(?:avif|webp).*$/, '') || moTa(f);
    if (!a) { kq.anh.push(`${ten}: <figure class="anh"> không có <img>`); continue; }
    if ((a.getAttribute('alt') ?? '').trim().length < 20) kq.anh.push(`${ten}: alt quá ngắn hoặc rỗng`);
    if (!ANH_AI.test(a.getAttribute('src') ?? '')) { kq.anh.push(`${ten}: không thuộc danh sách ảnh đã biết — ảnh chụp thật mới thì thêm vào phép đo này`); continue; }
    const nhan = f.querySelector('figcaption.chu-thich-anh');
    if (!nhan) { kq.anh.push(`${ten}: ảnh AI không có nhãn "${NHAN_ANH[NGON_NGU]}"`); continue; }
    if (nhan.textContent.trim() !== NHAN_ANH[NGON_NGU]) kq.anh.push(`${ten}: nhãn ghi «${nhan.textContent.trim()}», cần «${NHAN_ANH[NGON_NGU]}»`);
    if (!hien(f)) continue;   // khối đang ẩn (tab thực đơn khác): chỉ cần có nhãn trong mã
    const [kf, kn, csN, csF] = [f.getBoundingClientRect(), nhan.getBoundingClientRect(), getComputedStyle(nhan), getComputedStyle(f)];
    if (!hien(nhan)) kq.anh.push(`${ten}: nhãn không hiện ra`);
    if (kn.left < kf.left - 0.5 || kn.right > kf.right + 0.5 || kn.top < kf.top - 0.5 || kn.bottom > kf.bottom + 0.5) kq.anh.push(`${ten}: nhãn nằm ngoài khung ảnh`);
    if (so(csN.fontSize) < 13) kq.anh.push(`${ten}: nhãn cỡ ${csN.fontSize}, cần ≥ 13px`);
    // Ảnh tách nền: nhãn không che món. Vẽ ảnh đang hiện lên canvas đúng cỡ khung rồi đếm điểm ảnh ĐẶC (độ đục
    // ≥ 50 %) nằm dưới nhãn — phải là 0: nhãn chỉ được nằm trong dải trống tao-co-anh.py chừa ở đáy khung (bóng
    // đổ mờ dưới 50 % không tính). Ảnh có nền thì nhãn luôn nằm trên ảnh — luật của nó là nền riêng ở dưới.
    if (f.classList.contains('tach-nen') && a.complete && a.naturalWidth > 0 && hien(nhan)) {
      const [w, h] = [Math.round(kf.width), Math.round(kf.height)];
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(a, 0, 0, w, h);
      const [x0, y0] = [Math.max(0, Math.floor(kn.left - kf.left)), Math.max(0, Math.floor(kn.top - kf.top))];
      const [x1, y1] = [Math.min(w, Math.ceil(kn.right - kf.left)), Math.min(h, Math.ceil(kn.bottom - kf.top))];
      if (x1 > x0 && y1 > y0) {
        const d = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
        let dac = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] >= 128) dac++;
        if (dac) kq.anh.push(`${ten}: nhãn "${NHAN_ANH[NGON_NGU]}" che món — ${dac} điểm ảnh đặc (độ đục ≥ 50 %) dưới nhãn (${((dac / (d.length / 4)) * 100).toFixed(1)} %)`);
      }
    }
    // Nhãn có nền riêng (Charcoal có độ trong) nên đọc được trên vùng ảnh nào cũng vậy: tính tương phản của chữ
    // với nền nhãn pha lên vùng ảnh SÁNG NHẤT có thể (trắng tinh).
    const [chuN, nenN] = [mau(csN.color), mau(csN.backgroundColor)];
    if (!chuN || !nenN || nenN.a < 0.5) kq.anh.push(`${ten}: nhãn không có nền riêng (${csN.backgroundColor}) — chữ nằm thẳng trên ảnh thì không chắc đọc được`);
    else {
      const tren = ['r', 'g', 'b'].map(k => nenN[k] * nenN.a + 255 * (1 - nenN.a));
      const tp = tuongPhan([chuN.r, chuN.g, chuN.b], tren);
      if (tp < 4.5) kq.anh.push(`${ten}: nhãn chỉ ${tp.toFixed(2)} : 1 trên vùng ảnh sáng nhất, cần ≥ 4,5 : 1`);
    }
    if (csF.boxShadow !== 'none' || getComputedStyle(a).boxShadow !== 'none' || /drop-shadow/.test(`${csF.filter}${getComputedStyle(a).filter}`)) kq.anh.push(`${ten}: ảnh có bóng đổ`);
    if (csF.transform !== 'none' || csF.rotate !== 'none') kq.anh.push(`${ten}: ảnh bị xoay / biến dạng (${csF.transform})`);
    // Nền chờ của khung (lúc ảnh chưa về) phải là màu của bảng — phép đo khongTrang kiểm; ở đây kiểm khung giữ
    // đúng tỷ lệ của file ảnh đang hiện, không kéo giãn.
    const ka = a.getBoundingClientRect();
    if (a.complete && a.naturalWidth > 0 && Math.abs(ka.width / ka.height - a.naturalWidth / a.naturalHeight) > 0.02) {
      kq.anh.push(`${ten}: hiện ${ka.width.toFixed(0)} × ${ka.height.toFixed(0)}px, file ảnh ${a.naturalWidth} × ${a.naturalHeight} — sai tỷ lệ`);
    }
    if (Math.abs(ka.width - kf.width) > 1 || Math.abs(ka.height - kf.height) > 1) kq.anh.push(`${ten}: ảnh ${ka.width.toFixed(0)} × ${ka.height.toFixed(0)}px không lấp đúng khung ${kf.width.toFixed(0)} × ${kf.height.toFixed(0)}px`);
    // Không logo, chữ hay phần tử nào đè lên ảnh: đưa ảnh vào giữa màn hình rồi hỏi trình duyệt phần tử trên
    // cùng ở năm điểm — phải là chính ảnh hoặc nhãn của nó. (Đầu trang dính che phần trên: lấy điểm trong vùng nhìn thấy.)
    veCho(scrollY + kf.top + kf.height / 2 - innerHeight / 2);
    const k2 = f.getBoundingClientRect();
    const cheTren = (document.querySelector('header.dau-trang')?.getBoundingClientRect().bottom ?? 0) + (document.querySelector('.td-thanh')?.getBoundingClientRect().height ?? 0) + 2;
    const tren2 = Math.max(k2.top, cheTren), duoi2 = Math.min(k2.bottom, innerHeight - 1);
    if (duoi2 - tren2 > 40) {
      for (const [tx, ty] of [[0.5, 0.5], [0.12, 0.12], [0.88, 0.12], [0.12, 0.88], [0.88, 0.88]]) {
        const tc = document.elementFromPoint(k2.left + k2.width * tx, tren2 + (duoi2 - tren2) * ty);
        if (tc && !f.contains(tc)) { kq.anh.push(`${ten}: ${moTa(tc).slice(0, 50)} đè lên ảnh`); break; }
      }
    }
  }
  veCho(cuonDau);
  // Chỉ ảnh màn đầu được tải ngay; mọi ảnh khác lazy. Ảnh tải ngay phải có fetchpriority="high".
  const taiNgay = khungAnh.map(f => f.querySelector('img')).filter(a => a && a.getAttribute('loading') !== 'lazy');
  if (taiNgay.length > 1) kq.anh.push(`${taiNgay.length} ảnh tải ngay — chỉ ảnh màn đầu được tải ngay`);
  for (const a of taiNgay) {
    if (a.getAttribute('fetchpriority') !== 'high') kq.anh.push(`${a.getAttribute('src')}: tải ngay mà không có fetchpriority="high"`);
    if (!a.closest('.kmd')) kq.anh.push(`${a.getAttribute('src')}: tải ngay nhưng không phải ảnh màn đầu trang chủ`);
  }
  for (const a of khungAnh.map(f => f.querySelector('img')).filter(a => a && a.getAttribute('loading') === 'lazy')) {
    if (a.getAttribute('fetchpriority') === 'high') kq.anh.push(`${a.getAttribute('src')}: lazy mà lại fetchpriority="high"`);
  }

  // --- 12. Thẻ "Cách đọc nhãn khay" (NhanKhay.astro) ------------------------------------------------
  kq.nhanKhay = [];
  const DUONG = location.pathname.replace(/\/$/, '') || '/';
  const LA_TRANG_CHU = ['/', '/en', '/ko'].includes(DUONG);
  const LA_THUC_DON = ['/thuc-don', '/en/menu', '/ko/menu'].includes(DUONG);
  // Tên năm trường — chép tay, đúng thứ tự in trên nhãn khay (brief 06/10/2026).
  const TRUONG_NHAN = {
    vi: ['Tên phần cắt', 'Giá / 100g', 'Trọng lượng', 'Giá cuối', 'Ngày đóng gói'],
    en: ['Cut', 'Price / 100g', 'Weight', 'Final price', 'Packed on'],
    ko: ['부위', '100g당 가격', '중량', '최종 가격', '포장일'],
  }[NGON_NGU] ?? [];
  const theNhan = moi('.nk-the');
  if ((LA_TRANG_CHU || LA_THUC_DON) && theNhan.length !== 1) kq.nhanKhay.push(`trang này cần đúng một thẻ đọc nhãn khay, thấy ${theNhan.length}`);
  for (const t of theNhan) {
    const cs = getComputedStyle(t);
    if (t.closest('[aria-hidden="true"]')) kq.nhanKhay.push('thẻ bị aria-hidden — trình đọc màn hình không đọc được năm trường');
    const dong = [...t.querySelectorAll('ol > li')];
    const tenTruong = dong.map(d => (d.querySelector('.nk-ten')?.textContent ?? '').trim());
    if (JSON.stringify(tenTruong) !== JSON.stringify(TRUONG_NHAN)) kq.nhanKhay.push(`cần 5 trường theo thứ tự ${TRUONG_NHAN.join(' → ')} — thấy ${tenTruong.join(' → ') || 'không dòng nào'}`);
    // Chỉ tên trường và lời giải thích: chữ số trong thẻ chỉ gồm số thứ tự 1–5 và "100" của "Giá / 100g".
    const chuSo = t.textContent.replace(/\D/g, '');
    if (chuSo !== '12100345') kq.nhanKhay.push(`thẻ có con số ngoài số thứ tự và "100g" (dãy chữ số: ${chuSo}) — không được có giá trị mẫu`);
    if (/[₫]|vnđ|vnd|\d\s?đ\b/i.test(t.textContent)) kq.nhanKhay.push('thẻ có số tiền');
    if (!hien(t)) continue;
    if (cs.transform !== 'none' || cs.rotate !== 'none') kq.nhanKhay.push(`thẻ bị nghiêng (transform ${cs.transform}, rotate ${cs.rotate})`);
    if (cs.boxShadow !== 'none' || cs.filter !== 'none') kq.nhanKhay.push(`thẻ có bóng đổ (${cs.boxShadow}; filter ${cs.filter})`);
    if (![KEM, KEM_SAU].includes(bo(mau(cs.backgroundColor)))) kq.nhanKhay.push(`thẻ nền ${cs.backgroundColor}, cần Cream hoặc kem sau`);
    if (!['Top', 'Right', 'Bottom', 'Left'].every(c => so(cs[`border${c}Width`]) >= 1 && so(cs[`border${c}Width`]) <= 2)) kq.nhanKhay.push('thẻ cần viền mảnh 1–2px ở cả bốn cạnh');
    const k = t.getBoundingClientRect();
    const rongToiThieu = MAY_TINH ? 640 : Math.min(RONG - 2 * LE, 520);
    if (k.width < rongToiThieu - 0.5) kq.nhanKhay.push(`thẻ rộng ${k.width.toFixed(0)}px, màn ${RONG}px cần ≥ ${rongToiThieu.toFixed(0)}px để đọc được`);
    let duoiTruoc = -Infinity;
    for (const d of dong) {
      const ten = d.querySelector('.nk-ten');
      const kd = d.getBoundingClientRect();
      if (!ten || !hien(ten)) { kq.nhanKhay.push(`dòng «${d.textContent.trim().slice(0, 30)}» không hiện tên trường`); continue; }
      if (so(getComputedStyle(ten).fontSize) < 16 || Number(getComputedStyle(ten).fontWeight) < 600) kq.nhanKhay.push(`tên trường «${ten.textContent.trim()}» cỡ ${getComputedStyle(ten).fontSize}, đậm ${getComputedStyle(ten).fontWeight} — cần ≥ 16px, đậm`);
      for (const con of d.querySelectorAll('span, strong, p')) {
        if (hien(con) && con.children.length === 0 && con.textContent.trim().length > 3 && so(getComputedStyle(con).fontSize) < 15) kq.nhanKhay.push(`«${con.textContent.trim().slice(0, 30)}» cỡ ${getComputedStyle(con).fontSize}, cần ≥ 15px`);
      }
      if (kd.top < duoiTruoc - 0.5) kq.nhanKhay.push(`dòng «${ten.textContent.trim()}» không nằm dưới dòng trước — năm trường phải đọc từ trên xuống`);
      duoiTruoc = kd.bottom;
    }
    const logo = t.querySelector('img');
    if (logo && hien(logo)) {
      const kl = logo.getBoundingClientRect();
      if (kl.width < 159.5 || Math.abs(kl.width / kl.height - 446 / 124) > 0.03) kq.nhanKhay.push(`logo trên thẻ ${kl.width.toFixed(1)} × ${kl.height.toFixed(1)}px — guideline: lockup ≥ 160px, đúng tỷ lệ`);
    }
  }

  // --- 13. Trang chủ: tám khối, màn đầu, ba bước, cả bữa, đi nhóm ------------------------------------
  kq.trangChu = [];
  const HAI_COT = RONG >= 900;
  const giao = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
  const coAnh = (khoi, id) => [...(khoi?.querySelectorAll('figure.anh img') ?? [])].find(a => (a.getAttribute('src') ?? '').includes(`/anh/${id}-`)) ?? null;
  if (LA_TRANG_CHU) {
    const sai = c => kq.trangChu.push(c);
    // Tám khối theo thứ tự (brief 06/10/2026); bề mặt giữ như đang chạy (Khánh quyết 11/10/2026).
    const KHOI = [['màn đầu', '.kmd', KEM], ['ba bước', '#trai-nghiem', KEM], ['quầy chọn bò', '.qcb', THAN], ['cả bữa', '.bacn', KEM_DAM],
      ['đi nhóm', '.dcn', DO], ['tầng 3', '#tang-3', KEM], ['câu hỏi', '.ch', KEM], ['chân trang', 'footer', null]];
    let truoc = -Infinity;
    for (const [ten, chon, nen] of KHOI) {
      const el = document.querySelector(ten === 'chân trang' ? 'footer' : `main ${chon}`);
      if (!el || !hien(el)) { sai(`thiếu khối ${ten} (${chon})`); continue; }
      const dinh = el.getBoundingClientRect().top + scrollY;
      if (dinh < truoc - 0.5) sai(`khối ${ten} đứng sai thứ tự`);
      truoc = dinh;
      if (nen && bo(mau(getComputedStyle(el).backgroundColor)) !== nen) sai(`khối ${ten} nền ${getComputedStyle(el).backgroundColor} — bề mặt phải giữ như đang chạy (rgb(${nen}))`);
    }
    const soKhoi = [...document.querySelectorAll('main > section')].length;
    if (soKhoi !== 7) sai(`main có ${soKhoi} khối, cần đúng 7 (khối thứ tám là chân trang)`);

    // Màn đầu.
    const kmd = document.querySelector('.kmd');
    const h1 = kmd?.querySelector('h1'), dan = kmd?.querySelector('.kmd-dan'), nut = kmd?.querySelector('.kmd-nut');
    const hinh = kmd?.querySelector('.kmd-hinh'), tin = kmd?.querySelector('.kmd-thong-tin'), dai = kmd?.querySelector('.kmd-khau-hieu');
    const anhDau = coAnh(kmd, 'hero-vi-gas');
    const CAU_CHINH = {
      vi: 'Chọn phần bò bạn thích, rồi cùng cả bàn thưởng thức.',
      en: 'Pick the cut you like, then enjoy it with the whole table.',
      ko: '좋아하는 부위를 고르고, 함께 온 사람들과 즐겨 보세요.',
    }[NGON_NGU];
    if (!kmd || !h1 || !dan || !nut || !hinh || !tin) sai('màn đầu thiếu một trong: câu chính, mô tả, nhóm nút, hình, dòng địa điểm');
    else {
      if (h1.textContent.replace(/\s+/g, ' ').trim() !== CAU_CHINH) sai(`câu chính «${h1.textContent.trim()}» — phải giữ nguyên «${CAU_CHINH}»`);
      if (!anhDau || !hien(anhDau)) sai('màn đầu không có ảnh hero-vi-gas');
      else {
        const [kh1, kdan, knut, kanh, ktin, khinh] = [h1, dan, nut, anhDau, tin, hinh].map(e => e.getBoundingClientRect());
        if (anhDau.getAttribute('loading') !== 'eager' || anhDau.getAttribute('fetchpriority') !== 'high') sai('ảnh màn đầu phải tải ngay: loading="eager", fetchpriority="high"');
        if (kanh.top + scrollY >= innerHeight) sai(`ảnh màn đầu bắt đầu ở ${(kanh.top + scrollY).toFixed(0)}px, dưới màn hình đầu (${innerHeight}px)`);
        if (kmd.querySelector('.nen-van-mo') && [...kmd.querySelectorAll('.nen-van-mo')].some(v => hien(v) && v.getBoundingClientRect().height > 120)) sai('màn đầu còn mảng vân mỡ đỏ lớn — hình chính phải là ảnh');
        if (kmd.querySelector('img[src*="tem-tron"], img[src*="logo-"]')) sai('màn đầu đặt logo hay tem trong khối hình — không đặt logo cạnh hay trên ảnh');
        if (!HAI_COT) {
          // Một cột. Từ 360px: câu chính → mô tả → 2 nút → ảnh → dòng địa điểm. Dưới 360px (điện thoại rất nhỏ,
          // máy tính phóng to 400 %) phần chữ dài hơn một màn hình, nên ảnh lên ngay sau câu chính.
          if (kh1.bottom > kanh.top + 0.5) sai('điện thoại: câu chính phải đứng TRƯỚC ảnh');
          const thuTu = RONG >= 360 ? [['câu chính', kh1], ['mô tả', kdan], ['hai nút', knut], ['ảnh', kanh], ['dòng địa điểm', ktin]]
            : [['câu chính', kh1], ['ảnh', kanh], ['mô tả', kdan], ['hai nút', knut], ['dòng địa điểm', ktin]];
          for (let i = 1; i < thuTu.length; i++) {
            if (thuTu[i][1].top < thuTu[i - 1][1].bottom - 0.5) sai(`màn ${RONG}px: ${thuTu[i][0]} phải nằm dưới ${thuTu[i - 1][0]}`);
          }
        } else {
          // Hai cột: chữ bên trái (descriptor, câu chính, mô tả, hai nút), ảnh bên phải, cân nhau theo chiều dọc;
          // dòng địa điểm thành một hàng ngang dưới cả hai cột.
          const kkhung = kmd.querySelector('.khung').getBoundingClientRect();
          const cotChu = { top: kmd.querySelector('.hieu')?.getBoundingClientRect().top ?? kh1.top, bottom: knut.bottom };
          const [caoChu, caoHinh] = [cotChu.bottom - cotChu.top, khinh.height];
          if (kanh.left < kh1.right - 0.5 || kanh.left < kkhung.left + kkhung.width * 0.35) sai('máy tính: ảnh phải ở cột phải, chữ ở cột trái');
          if (kdan.left > kh1.left + 1 || knut.left > kh1.left + 1 || kdan.right > kanh.left || knut.top < kdan.bottom - 0.5 || kdan.top < kh1.bottom - 0.5) sai('máy tính: mô tả và hai nút phải nằm dưới câu chính, trong cột chữ');
          if (kanh.width < kkhung.width * 0.45) sai(`máy tính: ảnh rộng ${kanh.width.toFixed(0)}px, dưới 45 % khung ${kkhung.width.toFixed(0)}px — chưa đủ lớn`);
          if (caoHinh < caoChu * 0.6 || caoHinh > caoChu * 1.4) sai(`máy tính: khối hình cao ${caoHinh.toFixed(0)}px, cột chữ cao ${caoChu.toFixed(0)}px — hai cột chưa cân (cần 60–140 %)`);
          const lech = Math.abs((khinh.top + khinh.bottom) / 2 - (cotChu.top + cotChu.bottom) / 2);
          if (lech > 8) sai(`máy tính: tâm khối hình lệch tâm cột chữ ${lech.toFixed(0)}px theo chiều dọc (cần ≤ 8px)`);
          if (ktin.top < Math.max(knut.bottom, khinh.bottom) - 0.5) sai('máy tính: dòng địa điểm phải nằm dưới cả cột chữ lẫn khối hình');
          if (Math.abs(ktin.left - kkhung.left) > 1 || Math.abs(ktin.right - kkhung.right) > 1) sai('máy tính: dòng địa điểm phải trải hết bề ngang khung, dưới cả hai cột');
        }
        // Tagline: một dải Beef Red gọn cạnh hoặc dưới ảnh — không đè lên ảnh.
        if (!dai || !hien(dai)) sai('màn đầu thiếu dải tagline "Pick it. Grill it. Love it."');
        else {
          const [kdai, csD] = [dai.getBoundingClientRect(), getComputedStyle(dai)];
          if (dai.textContent.replace(/\s+/g, ' ').trim() !== 'Pick it. Grill it. Love it.') sai(`tagline ghi «${dai.textContent.trim()}»`);
          if (dai.getAttribute('lang') !== 'en' && !dai.closest('[lang="en"]') && NGON_NGU !== 'en') sai('tagline tiếng Anh thiếu lang="en"');
          // Mắt thấy dải này; trình đọc màn hình thì đọc tagline ĐÚNG MỘT lần — ở dòng hiệu của khối ba bước ngay sau.
          // Chữ đọc được = mọi nút chữ không nằm trong aria-hidden="true" của màn đầu và khối ba bước.
          if (dai.getAttribute('aria-hidden') !== 'true') sai('dải tagline dưới ảnh thiếu aria-hidden="true" — trình đọc màn hình đọc tagline hai lần liền nhau (dải này, rồi dòng hiệu của khối ba bước)');
          const docDuoc = goc => {
            let chu = '';
            const di = document.createTreeWalker(goc, NodeFilter.SHOW_TEXT);
            for (let n = di.nextNode(); n; n = di.nextNode()) if (!n.parentElement.closest('[aria-hidden="true"]')) chu += ` ${n.nodeValue}`;
            return chu.replace(/\s+/g, ' ');
          };
          const soLanDoc = [kmd, document.querySelector('#trai-nghiem')].filter(Boolean).map(docDuoc).join(' ').split('Pick it. Grill it. Love it.').length - 1;
          if (soLanDoc !== 1) sai(`trình đọc màn hình đọc tagline ${soLanDoc} lần ở màn đầu và khối ba bước — cần đúng 1 lần`);
          if (giao(kdai, kanh)) sai('dải tagline đè lên ảnh');
          if (bo(mau(csD.backgroundColor)) !== DO) sai(`dải tagline nền ${csD.backgroundColor}, cần Beef Red`);
          if (bo(mau(csD.color)) !== KEM) sai(`chữ tagline màu ${csD.color}, cần Cream`);
          if (kdai.height > 72) sai(`dải tagline cao ${kdai.height.toFixed(0)}px — phải gọn (≤ 72px)`);
          if (so(csD.fontSize) < 14) sai(`chữ tagline ${csD.fontSize}, cần ≥ 14px`);
          const sat = Math.min(Math.abs(kdai.top - kanh.bottom), Math.abs(kdai.left - kanh.right));
          if (sat > 24) sai(`dải tagline cách ảnh ${sat.toFixed(0)}px — phải nằm ngay cạnh hoặc dưới ảnh`);
        }
      }
    }

    // Hàng thông tin ở màn đầu. Địa chỉ và câu chỉ đường là MỘT cặp dính nhau ở mọi trạng thái (chưa có ngày
    // mở, sắp mở, đã mở; dòng trạng thái ngắn hay dài hai câu): ô bên cạnh cao lên không được kéo câu chỉ
    // đường tụt khỏi dòng địa chỉ. Ngày mở không gãy giữa chừng. Các ô không đè nhau, không ra ngoài khung.
    if (tin) {
      const [dc, loiLen, ngayMo, trangThai, theoDoi] = ['.kmd-dia-chi', '.kmd-loi-len', '.kmd-ngay', '.kmd-trang-thai', '.kmd-theo-doi'].map(c => tin.querySelector(c));
      if (![dc, loiLen, trangThai].every(e => e && hien(e))) sai('hàng thông tin màn đầu thiếu địa chỉ, câu chỉ đường hoặc dòng trạng thái');
      else {
        const [kdc, kloi, khop] = [dc, loiLen, tin].map(e => e.getBoundingClientRect());
        const khe = kloi.top - kdc.bottom;
        if (khe < -10 || khe > 8) sai(`câu chỉ đường cách đáy dòng địa chỉ ${khe.toFixed(0)}px — phải dính ngay dưới địa chỉ (−10 đến 8px) ở mọi trạng thái`);
        const [chuDc, veDau] = [dc.querySelector(':scope > span'), loiLen.querySelector('span')];
        if (chuDc && veDau && Math.abs(veDau.getBoundingClientRect().left - chuDc.getBoundingClientRect().left) > 1) sai('câu chỉ đường không thẳng mép trái với chữ địa chỉ');
        // Số dòng chữ của một phần tử: gom các hộp dòng theo mép trên (lệch dưới 6px là cùng một dòng).
        const soDong = el => {
          const vung = document.createRange(); vung.selectNodeContents(el);
          const dinh = [];
          for (const o of vung.getClientRects()) if (o.width >= 1 && !dinh.some(d => Math.abs(d - o.top) < 6)) dinh.push(o.top);
          return dinh.length;
        };
        if (ngayMo && hien(ngayMo)) {
          const dam = ngayMo.querySelector('strong');
          if (!dam || soDong(dam) !== 1) sai(`ngày mở «${dam?.textContent.trim() ?? ''}» gãy thành ${dam ? soDong(dam) : 0} dòng — ngày phải nằm trên một dòng`);
          if (HAI_COT && soDong(ngayMo) !== 1) sai(`máy tính: dòng «${ngayMo.textContent.replace(/\s+/g, ' ').trim()}» gãy thành ${soDong(ngayMo)} dòng`);
          if (HAI_COT && ngayMo.getBoundingClientRect().bottom > trangThai.getBoundingClientRect().top + 0.5) sai('máy tính: ngày mở phải nằm trên dòng trạng thái');
        }
        const o = [['địa chỉ', dc], ['câu chỉ đường', loiLen], ['ngày mở', ngayMo], ['dòng trạng thái', trangThai], ['liên kết theo dõi', theoDoi]]
          .filter(([, e]) => e && hien(e)).map(([ten, e]) => [ten, e.getBoundingClientRect()]);
        for (const [ten, k] of o) {
          if (k.left < khop.left - 1 || k.right > khop.right + 1) sai(`${ten} ở hàng thông tin tràn ra ngoài khung (${k.left.toFixed(0)}–${k.right.toFixed(0)}px, khung ${khop.left.toFixed(0)}–${khop.right.toFixed(0)}px)`);
        }
        // Địa chỉ và câu chỉ đường cố ý sát nhau (vùng chạm 48px của địa chỉ trùm xuống vài px) — không tính cặp đó.
        for (let i = 0; i < o.length; i++) for (let j = i + 1; j < o.length; j++) {
          if (o[i][0] === 'địa chỉ' && o[j][0] === 'câu chỉ đường') continue;
          if (giao(o[i][1], o[j][1])) sai(`${o[i][0]} và ${o[j][0]} ở hàng thông tin đè lên nhau`);
        }
      }
    }

    // Ba bước: 3 bước, 3 biểu tượng; điện thoại xếp dọc cách nhau khoảng 24px; máy tính 3 cột.
    const buoc = [...document.querySelectorAll('#trai-nghiem .bb-buoc > li')].filter(hien);
    if (buoc.length !== 3) sai(`ba bước: thấy ${buoc.length} bước`);
    else {
      const kb = buoc.map(b => b.getBoundingClientRect());
      if (buoc.some(b => ![...b.querySelectorAll('svg')].some(hien) || !b.querySelector('h3'))) sai('ba bước: mỗi bước cần một biểu tượng và một tiêu đề');
      if (DIEN_THOAI) {
        for (let i = 1; i < 3; i++) {
          const khe = kb[i].top - kb[i - 1].bottom;
          if (Math.abs(kb[i].left - kb[0].left) > 1 || khe < 16 || khe > 32) sai(`ba bước, điện thoại: bước ${i + 1} cách bước ${i} ${khe.toFixed(0)}px (cần xếp dọc, khoảng 24px)`);
        }
      } else if (HAI_COT) {
        if (Math.abs(kb[0].top - kb[1].top) > 1 || Math.abs(kb[1].top - kb[2].top) > 1 || !(kb[0].right <= kb[1].left + 1 && kb[1].right <= kb[2].left + 1)) sai('ba bước, máy tính: phải là 3 cột ngang hàng');
      }
      // Trang trí không lấn nội dung: số thứ tự không cao quá ba lần tiêu đề của bước, nét trang trí không chạm chữ.
      for (const b of buoc) {
        const [soLon, tieuDe] = [b.querySelector('.bb-so'), b.querySelector('h3')];
        if (soLon && tieuDe && so(getComputedStyle(soLon).fontSize) > 3.6 * so(getComputedStyle(tieuDe).fontSize)) sai(`ba bước: số «${soLon.textContent}» cỡ ${getComputedStyle(soLon).fontSize} lấn tiêu đề ${getComputedStyle(tieuDe).fontSize} (cần ≤ 3,6 lần)`);
      }
    }

    // Quầy chọn bò: ảnh vân thịt là ảnh minh họa; KHÔNG ảnh AI nào cho khay hay quầy.
    const qcb = document.querySelector('.qcb');
    if (!coAnh(qcb, 'bo-van-mo-can')) sai('quầy chọn bò: thiếu ảnh bo-van-mo-can');

    // Cả bữa: có ảnh bữa ăn; nút "Xem thực đơn" nằm sát đoạn giới thiệu, trước danh sách nhóm món.
    const bacn = document.querySelector('.bacn');
    const [danB, nutB, nhomB] = [bacn?.querySelector('.dan'), bacn?.querySelector('a.nut'), bacn?.querySelector('.bacn-nhom')];
    if (!coAnh(bacn, 'mon-an-chia-se')) sai('cả bữa: thiếu ảnh mon-an-chia-se');
    if (!danB || !nutB || !nhomB) sai('cả bữa: thiếu đoạn giới thiệu, nút thực đơn hoặc danh sách nhóm món');
    else {
      const [kd, kn, kh] = [danB, nutB, nhomB].map(e => e.getBoundingClientRect());
      const khe = kn.top - kd.bottom;
      if (khe < 0 || khe > 40) sai(`cả bữa: nút "${nutB.textContent.trim()}" cách đoạn giới thiệu ${khe.toFixed(0)}px — phải nằm sát (0–40px)`);
      if (kn.bottom > kh.top + 0.5) sai('cả bữa: nút thực đơn phải đứng trước danh sách nhóm món');
    }

    // Đi nhóm: ảnh bữa ăn thay hình vẽ; nút ngay sau đoạn giải thích; không hoa văn tranh với ảnh.
    const dcn = document.querySelector('.dcn');
    const anhNhom = coAnh(dcn, 'bua-an-cung-ban');
    if (!anhNhom) sai('đi nhóm: thiếu ảnh bua-an-cung-ban');
    if (dcn?.querySelector('.khung-anh')) sai('đi nhóm: còn khung hình vẽ bàn nướng');
    const chuD = [...(dcn?.querySelectorAll('.dcn-chu > p') ?? [])].filter(hien).at(-1), nutD = dcn?.querySelector('.hang-nut');
    if (!chuD || !nutD) sai('đi nhóm: thiếu đoạn giải thích hoặc nút');
    else {
      const khe = nutD.getBoundingClientRect().top - chuD.getBoundingClientRect().bottom;
      if (khe < 0 || khe > 40) sai(`đi nhóm: nút cách đoạn giải thích ${khe.toFixed(0)}px — phải ngay sau (0–40px)`);
    }
    if (anhNhom && hien(anhNhom)) {
      const ka = anhNhom.getBoundingClientRect();
      for (const v of [...(dcn?.querySelectorAll('.nen-van-mo, .trang-tri') ?? [])].filter(hien)) {
        if (giao(v.getBoundingClientRect(), ka)) sai(`đi nhóm: ${moTa(v).slice(0, 40)} chồng lên vùng ảnh — hoa văn không tranh với ảnh`);
      }
    }
  }

  // --- 14. Trang Thực đơn ---------------------------------------------------------------------------
  kq.thucDon = [];
  if (LA_THUC_DON) {
    const quay = document.getElementById('bo-tai-quay'), monAn = document.getElementById('mon-an');
    if (!quay || bo(mau(getComputedStyle(quay).backgroundColor)) !== THAN) kq.thucDon.push('"Bò tại quầy" phải giữ nền tối (Charcoal)');
    if (!coAnh(quay, 'bo-cat-lat')) kq.thucDon.push('"Bò tại quầy": thiếu ảnh bo-cat-lat');
    if (!quay?.querySelector('.nk-the')) kq.thucDon.push('"Bò tại quầy": thiếu thẻ đọc nhãn khay');
    if (quay?.querySelector('.khung-anh')) kq.thucDon.push('"Bò tại quầy": còn khung vẽ khay');
    // "Món ăn": chưa công bố món nào → lời giới thiệu có ảnh sot-cham; đã có món → các nhóm kiểu cuốn menu bản
    // sáng, không còn ảnh sot-cham (món đã có ảnh riêng).
    const theMon = [...(monAn?.querySelectorAll('.tdn-mon') ?? [])];
    if (!theMon.length && !coAnh(monAn, 'sot-cham')) kq.thucDon.push('"Món ăn" chưa có món: thiếu ảnh sot-cham');
    if (theMon.length && coAnh(monAn, 'sot-cham')) kq.thucDon.push('"Món ăn" đã có món mà vẫn còn ảnh sot-cham');
    const doUong = document.getElementById('do-uong');
    if (!coAnh(doUong, 'uong-khong-con-ba-ly')) kq.thucDon.push('"Đồ uống": thiếu ảnh uong-khong-con-ba-ly');
    // Ảnh ba ly không cồn đứng đầu phần Đồ uống ở mọi trạng thái. Đã công bố đồ uống mà chưa có món không cồn
    // nào (mới công bố ba ly signature, công tắc có cồn bật) thì trang vẫn phải có tên các nhóm không cồn —
    // không thì ảnh nước không cồn đứng trên một trang toàn đồ có cồn. Nhãn "Có cồn" chép tay theo thứ tiếng.
    const NHAN_CO_CON = { vi: 'Có cồn', en: 'Contains alcohol', ko: '알코올 포함' }[NGON_NGU];
    const coNhanCoCon = e => [...e.querySelectorAll('.nhan-mon')].some(n => n.textContent.trim() === NHAN_CO_CON);
    const uongDaCo = [...(doUong?.querySelectorAll('.tdn-mon, li.mon') ?? [])];
    if (uongDaCo.length && uongDaCo.every(coNhanCoCon)) {
      const tenKhongCon = [...(doUong?.querySelectorAll('.td-danh-muc li') ?? [])].filter(li => !coNhanCoCon(li));
      if (!tenKhongCon.length) kq.thucDon.push(`"Đồ uống": ${uongDaCo.length} món đã công bố đều có cồn mà không có tên nhóm đồ uống không cồn nào cạnh ảnh ba ly không cồn`);
    }
    // Giá chưa duyệt không bao giờ có phần tử giá (database trả null).
    if (document.querySelector('.mon-gia')) kq.thucDon.push('có phần tử giá (.mon-gia) trên trang');
    // Tên nhóm kiểu tiêu đề trang của cuốn: chữ hoa, đậm 800, ≥ 28px và không to hơn h1 (dải tối dùng tiêu đề nhỏ).
    const coH1 = so(getComputedStyle(document.querySelector('h1') ?? document.body).fontSize);
    for (const t of moi('.tdn:not(.tdn-tieu-de-nho) .tdn-ten').filter(hien)) {
      const cs = getComputedStyle(t);
      if (so(cs.fontSize) < 27.5 || so(cs.fontSize) > coH1 + 0.5) kq.thucDon.push(`tên nhóm «${t.textContent.trim()}» cỡ ${cs.fontSize} — cần từ 28px tới cỡ h1 (${coH1}px)`);
      if (cs.textTransform !== 'uppercase' || Number(cs.fontWeight) < 800) kq.thucDon.push(`tên nhóm «${t.textContent.trim()}» phải chữ hoa, đậm 800 (${cs.textTransform}, ${cs.fontWeight})`);
    }
    for (const m of theMon.filter(hien)) {
      const ten = (m.querySelector('.tdm-ten')?.textContent ?? '').trim().slice(0, 30);
      const km = m.getBoundingClientRect();
      if (!ten) kq.thucDon.push('thẻ món không có tên');
      // Chữ không tràn khỏi thẻ (tên dài, tiếng Hàn dài, mô tả bốn câu).
      for (const e of m.querySelectorAll('.tdm, .tdm > *')) {
        const k = e.getBoundingClientRect();
        if (e.scrollWidth > e.clientWidth + 1 || k.right > km.right + 1 || k.left < km.left - 1) { kq.thucDon.push(`thẻ «${ten}»: chữ tràn khỏi thẻ (${moTa(e).slice(0, 40)})`); break; }
      }
      // Thẻ của lưới: ảnh (nếu có) ở trên chữ. Món dẫn đầu: từ 768px ảnh ở cột phải, bên phải chữ;
      // dưới 768px ảnh ở trên chữ. Dưới 600px, món đứng sau món dẫn đầu của nhóm món ăn là hàng gọn: ảnh nhỏ
      // 112–128px bên trái, chữ bên phải, cùng mép trên — tab Món ăn ở 390px từng dài hơn 12.000px vì mỗi
      // món là một thẻ ảnh to. Nhãn "Ảnh minh họa" của ảnh nhỏ một dòng, nằm trong 20 % đáy khung (dải trống
      // dưới món của ảnh tách nền; mặt bàn của ảnh tartare) — không đè lên món. Nhóm KHÔNG có món dẫn đầu
      // (đúng hai món — Món đặc trưng) giữ thẻ ảnh trên chữ dưới: hai món đó là chính nhóm, không được nhỏ
      // hơn ảnh dẫn đầu của nhóm khác.
      const chu = m.querySelector('.tdm');
      const f = m.classList.contains('tdn-lon') ? m.closest('.tdn-mo')?.querySelector('.tdn-lon-anh figure.anh') : m.querySelector('figure.anh');
      if (!f || !chu || !hien(f)) continue;
      const [ka, kc] = [f.getBoundingClientRect(), chu.getBoundingClientRect()];
      const hangGon = RONG < 600 && !m.classList.contains('tdn-lon') && !!m.closest('.tdn-dan-dau .tdn-luoi')
        && !!m.closest('.tdn')?.querySelector('.tdn-lon');
      if (m.classList.contains('tdn-lon') && RONG >= 768) {
        if (ka.left < kc.right - 0.5) kq.thucDon.push(`món dẫn đầu «${ten}»: từ 768px ảnh phải ở bên phải chữ`);
      } else if (hangGon) {
        if (ka.right > kc.left + 0.5 || Math.abs(ka.top - kc.top) > 1) kq.thucDon.push(`món «${ten}»: dưới 600px phải là hàng gọn — ảnh nhỏ bên trái chữ, cùng mép trên`);
        if (ka.width < 111.5 || ka.width > 128.5) kq.thucDon.push(`món «${ten}»: ảnh nhỏ của hàng gọn rộng ${ka.width.toFixed(1)}px, cần 112–128px`);
        const nhan = f.querySelector('figcaption.chu-thich-anh');
        const kn = nhan?.getBoundingClientRect();
        if (kn && kn.top < ka.top + ka.height * 0.8 - 0.5) {
          kq.thucDon.push(`món «${ten}»: nhãn ảnh nhỏ cao ${kn.height.toFixed(1)}px, lên tới ${((kn.top - ka.top) / ka.height * 100).toFixed(0)} % khung — phải một dòng trong 20 % đáy khung`);
        }
      } else if (ka.bottom > kc.top + 0.5) {
        kq.thucDon.push(`thẻ «${ten}»: ảnh phải ở trên chữ`);
      }
    }
    for (const tab of moi('.td-tab a').filter(hien)) {
      if (tab.getBoundingClientRect().height < 47.5) kq.thucDon.push(`mục «${tab.textContent.trim()}» của thanh chọn phần cao ${tab.getBoundingClientRect().height.toFixed(1)}px, cần ≥ 48px`);
    }
  }

  return kq;
}
