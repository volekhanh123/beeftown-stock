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
  dauTrang: 'đầu trang cao 64px (dưới 1080px) / 80px (từ 1080px); điều hướng 15–16px; logo ≥ 160px, đúng tỷ lệ',
  ngonNgu: 'bộ chọn ngôn ngữ đủ 3 thứ tiếng, thứ tiếng đang xem đánh dấu bằng chữ đậm và nét gạch (không chỉ bằng màu)',
  khongTrang: 'không nền trắng: mọi màu nền thuộc bảng màu của trang công khai',
  nut: 'nút: bo 4px, đệm ngang 20px, đúng màu theo bề mặt; mỗi nhóm nút một nút chính',
  the: 'thẻ: nền Cream hoặc kem sau, đệm 20px (điện thoại) / 24px, viền mảnh, không bóng đổ',
  cauHoi: 'câu hỏi thường gặp: mỗi hàng cao ≥ 56px, bấm được trên toàn chiều rộng, có biểu tượng mở/đóng',
  bieuTuong: 'biểu tượng: 24px, nét 1,5px, Beef Red trên kem và Cream trên đỏ, đi kèm nhãn chữ',
  chu: 'chữ và lưới: chỉ Montserrat, chữ chạy 16/24px, h1 32/38 → 48/56px, lề điện thoại 20px, khung ≤ 1200px, khoảng cách khối 48–64 / 72–96px',
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
    const logo = dau.querySelector('.dt-logo img');
    if (!logo || !hien(logo)) kq.dauTrang.push('không thấy logo');
    else {
      const k = logo.getBoundingClientRect();
      if (k.width < 159.5) kq.dauTrang.push(`logo rộng ${k.width.toFixed(1)}px — guideline: lockup tối thiểu 160px`);
      if (Math.abs(k.width / k.height - 446 / 124) > 0.03) kq.dauTrang.push(`logo bị kéo giãn: ${k.width.toFixed(1)} × ${k.height.toFixed(1)}`);
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
  const nenLa = new Map();
  for (const el of [document.documentElement, document.body, ...document.body.querySelectorAll('*')]) {
    if (el.closest('.nk-the') || (el !== document.documentElement && !hien(el))) continue;   // .nk-the: PR 3
    const chuoi = getComputedStyle(el).backgroundColor;
    const c = mau(chuoi);
    if (c ? (c.a > 0 && !BANG.has(bo(c))) : chuoi !== 'transparent') {
      if (!nenLa.has(chuoi)) nenLa.set(chuoi, moTa(el));
    }
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
    const coNet = ['Top', 'Right', 'Bottom', 'Left'].some(c => so(cs[`border${c}Width`]) >= 1 && (mau(cs[`border${c}Color`])?.a ?? 0) > 0);
    if (!coNet) kq.the.push(`${ten} không có viền hay nét nào tách khỏi nền`);
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
    if (NGON_NGU === 'ko') {
      // Hangul rộng hơn chữ Latin: câu chính trang chủ co theo bề rộng cột (KhoiMoDau.astro), dòng thoáng 1,28.
      if (co < 28 || co > 48.5) kq.chu.push(`${ghi} — tiếng Hàn cần 28–48px`);
    } else if (RONG <= 390) {
      if (Math.abs(co - 32) > 0.6 || Math.abs(dong - 38) > 1) kq.chu.push(`${ghi} — điện thoại cần 32/38px`);
    } else if (RONG >= 1366) {
      if (Math.abs(co - 48) > 0.6 || Math.abs(dong - 56) > 1) kq.chu.push(`${ghi} — máy tính cần 48/56px`);
    } else if (co < 32 || co > 48) kq.chu.push(`${ghi} — cần trong khoảng 32–48px`);
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
