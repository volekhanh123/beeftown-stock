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
 * Ngoại lệ có chủ đích, mỗi cái ghi lý do tại chỗ:
 *   · .nk-the (thẻ "Đọc nhãn khay", NhanKhay.astro): còn nền trắng ngà, nghiêng, có bóng — PR 3 dựng lại
 *     thẻ đó, lúc ấy gỡ ngoại lệ này.
 *   · .nhan-mon (nhãn Món sống / Có cồn của thực đơn): biểu tượng 16px đi với chữ hoa 12px — thực đơn
 *     thuộc PR 3.
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
  chu: 'chữ và lưới: chỉ Montserrat, chữ chạy 16/24px, h1 32/38 → 48/56px (tiếng Hàn cùng cỡ, dòng 1,28: 32/41 → 48/61px), lề điện thoại 20px, khung ≤ 1200px, khoảng cách khối 48–64 / 72–96px',
  chanTrang: 'chân trang: dải đỏ, logo Cream, không hoa văn chữ, chữ ≥ 14px, điện thoại chia link 2 cột, dải pháp nhân nền Charcoal',
};

export function doGiaoDien() {
  const RONG = innerWidth;
  const DIEN_THOAI = RONG < 600, MAY_TINH = RONG >= 1024;
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
    if (el.closest('.nk-the') || (el !== document.documentElement && !hien(el))) continue;   // .nk-the: PR 3
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
    const nho = !!s.closest('.nhan-mon');   // thực đơn: PR 3
    if (nho ? k.width < 15.5 : (Math.abs(k.width - 24) > 0.5 || Math.abs(k.height - 24) > 0.5)) {
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
    if (DIEN_THOAI && Math.abs(r.left - 20) > 0.6) kq.chu.push(`${moTa(k).slice(0, 30)} lề trái ${r.left.toFixed(1)}px, điện thoại cần 20px`);
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

  return kq;
}
