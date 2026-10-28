/**
 * BEEFTOWN — MỞ RỘNG FABi: CHẠY TRÊN FABi CMS (content script, sau chung.js)
 *
 * Trên trang "Món ăn tại thành phố" (https://fabi.ipos.vn/menu/items/items-in-city) hiện một khung nhỏ góc trái dưới
 * với nút "Đưa món mới sang FABi". Bấm nút:
 *   1. Đọc mã món đang có trên FABi ở cột "Mã món" của bảng — cuộn cho bảng tải hết, so với dòng "Tổng: … món".
 *      Ô tìm kiếm có chữ, không thấy bộ lọc "Tất cả", không thấy bảng hay dòng Tổng, đọc thiếu → DỪNG, không đoán:
 *      đọc thiếu một mã là đưa lại món đã có (FABi chỉ THÊM món từ file).
 *   2. Nhờ service worker (nen.js) lấy file nhập món của kho kèm các mã đó (da_co) — kho bỏ món đã có trên FABi.
 *   3. Mở Tiện ích → Thêm món từ file (không mở được thì chờ người bấm, tối đa 2 phút), đưa file vào ô chọn file
 *      của hộp thoại ĐANG HIỆN (trang có thêm ô excel-upload-input trong các hộp thoại ẩn khác).
 *   4. FABi tự đọc Excel và hiện bảng xem trước. Extension KHÔNG bấm Lưu: người dùng kiểm từng dòng rồi bấm. Câu
 *      "đã xong" chỉ hiện khi FABi tự báo "Tải lên thành công".
 *
 * Khung nằm trong Shadow DOM (mở — kiểm thử trình duyệt bấm được nút): CSS của FABi không lọt vào. Trang FABi đọc
 * được khung cũng không lấy được gì ngoài thứ extension vốn đưa cho FABi (file món mới). Mọi câu hiện ra đặt bằng
 * textContent (câu của kho là dữ liệu, không phải HTML). Màu theo bảng Beeftown (skill thiet-ke-beeftown,
 * nội bộ: thẻ trắng, nút đỏ, trạng thái bằng viền và dấu — không màu xanh, vàng).
 */
/* global chrome */
(function () {
  'use strict';
  const B = globalThis.BeeftownFabi;
  if (!B || globalThis.beeftownFabiDaNap) return;
  globalThis.beeftownFabiDaNap = true;

  const nn = B.chonNgonNgu(navigator.language);
  const C = B.CAU[nn];
  const cho = ms => new Promise(xong => setTimeout(xong, ms));

  /** Gọi timRa mỗi buocMs tới khi có kết quả hoặc hết hetMs (trả null). */
  async function choDen(timRa, hetMs, buocMs = 200) {
    const het = Date.now() + hetMs;
    for (;;) {
      const ketQua = timRa();
      if (ketQua) return ketQua;
      if (Date.now() >= het) return null;
      await cho(buocMs);
    }
  }

  function dangHien(el) {
    if (!el || !el.isConnected) return false;
    const kieu = getComputedStyle(el);
    if (kieu.display === 'none' || kieu.visibility === 'hidden') return false;
    const khung = el.getBoundingClientRect();
    return khung.width > 0 && khung.height > 0;
  }

  /** Phần tử đang hiện có chữ đúng bằng `chu` — lấy cái trong cùng (li chứa a cùng chữ thì lấy a: bấm a mới chạy). */
  function timTheoChu(boChon, chu) {
    const ds = [...document.querySelectorAll(boChon)].filter(e => dangHien(e) && B.gon(e.textContent) === chu);
    return ds.find(e => !ds.some(k => k !== e && e.contains(k))) ?? null;
  }

  // ---------------------------------------------------------------------------
  // KHUNG EXTENSION
  // ---------------------------------------------------------------------------
  const CSS = `
    :host { all: initial; }
    [hidden] { display: none !important; }
    .the { position: fixed; left: 16px; bottom: 16px; z-index: 2147483000; box-sizing: border-box;
      width: min(360px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; padding: 16px;
      background: #FFFFFF; color: #000000; border: 1px solid #767676; border-radius: 10px;
      font: 400 15px/1.45 Montserrat, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }
    .tieu-de { margin: 0 0 4px; font-size: 13px; font-weight: 700; }
    .gioi-thieu { margin: 0 0 12px; font-size: 13px; color: #555555; }
    .hang { display: flex; gap: 8px; }
    button { font: inherit; cursor: pointer; min-height: 48px; border-radius: 8px; }
    .nut { flex: 1; padding: 0 16px; border: 1.5px solid transparent; background: #BD0000; color: #FFFFFF; font-weight: 700; }
    .nut:hover, .nut[aria-busy="true"] { background: #8F0000; }
    .nut[aria-busy="true"] { cursor: progress; }
    .nut-phu { padding: 0 16px; border: 1px solid #767676; background: #FFFFFF; color: #000000; font-weight: 600; }
    .nut-phu:hover { background: #E2E2E2; }
    button:focus-visible, a:focus-visible { outline: 3px solid #000000; outline-offset: 3px; }
    .bao { margin-top: 12px; padding: 12px; border-radius: 8px; border: 1px solid #767676; font-size: 14px; }
    .bao p { margin: 0; }
    .bao.loi { border: 2px solid #BD0000; }
    .bao.loi .chu::before { content: "!"; content: "!" / ""; display: inline-flex; align-items: flex-end;
      justify-content: center; width: 18px; height: 16px; margin-right: 8px; vertical-align: -2px; background: #BD0000;
      color: #FFFFFF; font-size: 11px; font-weight: 800; clip-path: polygon(50% 0, 100% 100%, 0 100%); }
    .bao.xong { border: 1.5px solid #000000; }
    .bao.xong .chu::before { content: "✓"; content: "✓" / ""; margin-right: 8px; font-weight: 800; }
    .bao.luu-y { border: 1px solid #E2E2E2; border-left: 4px solid #555555; }
    .lien-ket { display: inline-block; margin-top: 8px; color: #000000; font-weight: 700; text-decoration: underline; }
    @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
  `;

  const host = document.createElement('div');
  host.id = 'beeftown-mo-rong-fabi';
  host.style.display = 'none';
  const bong = host.attachShadow({ mode: 'open' });
  const tao = (ten, lop, chu) => {
    const el = document.createElement(ten);
    if (lop) el.className = lop;
    if (chu != null) el.textContent = chu;
    return el;
  };
  const kieuKhung = tao('style', null, CSS);
  const the = tao('section', 'the');
  the.lang = nn;
  the.setAttribute('aria-label', C.tieuDe);
  const nut = tao('button', 'nut', C.nut);
  nut.type = 'button';
  const nutAn = tao('button', 'nut-phu', C.an);
  nutAn.type = 'button';
  const hang = tao('div', 'hang');
  hang.append(nut, nutAn);
  const khungBao = tao('div', 'bao');
  khungBao.hidden = true;
  khungBao.setAttribute('role', 'status');
  khungBao.setAttribute('aria-live', 'polite');
  const chuBao = tao('p', 'chu');
  const lienKet = tao('a', 'lien-ket');
  lienKet.target = '_blank';
  lienKet.rel = 'noopener noreferrer';
  lienKet.hidden = true;
  khungBao.append(chuBao, lienKet);
  the.append(tao('p', 'tieu-de', C.tieuDe), tao('p', 'gioi-thieu', C.gioiThieu), hang, khungBao);
  bong.append(kieuKhung, the);

  /** kieu: 'dang' (đang làm) · 'luu-y' (việc của người dùng) · 'loi' (dừng, cần làm gì đó) · 'xong'. */
  function bao(kieu, chu, lien) {
    khungBao.className = `bao ${kieu}`;
    chuBao.textContent = chu;
    lienKet.hidden = !lien;
    if (lien) {
      lienKet.href = lien.href;
      lienKet.textContent = lien.chu;
    }
    khungBao.hidden = false;
  }

  function datNut(dang) {
    nut.setAttribute('aria-busy', String(dang));
    nut.textContent = dang ? C.nutDang : C.nut;
  }

  // Trang FABi là ứng dụng một trang (vue-router chế độ history): đường dẫn đổi không tải lại trang — xem định kỳ.
  let anDenKhiRoiTrang = false;
  function capNhatHien() {
    const laDanhSach = B.laTrangDanhSach(location.pathname);
    if (!laDanhSach) anDenKhiRoiTrang = false;
    const hien = laDanhSach && !anDenKhiRoiTrang;
    if (hien && !host.isConnected) (document.body ?? document.documentElement).appendChild(host);
    host.style.display = hien ? '' : 'none';
  }
  nutAn.addEventListener('click', () => { anDenKhiRoiTrang = true; capNhatHien(); });
  setInterval(capNhatHien, 700);
  capNhatHien();

  // ---------------------------------------------------------------------------
  // 1 · ĐỌC MÃ MÓN ĐANG CÓ TRÊN FABi
  // ---------------------------------------------------------------------------
  /** Bảng đang hiện có cột "Mã món": các dòng dữ liệu và chữ ở cột đó. */
  function docBang() {
    for (const bang of document.querySelectorAll('table')) {
      if (!dangHien(bang)) continue;
      const tieuDe = [...(bang.querySelector('thead tr')?.children ?? [])];
      const cot = tieuDe.findIndex(o => B.gon(o.textContent) === 'Mã món');
      if (cot < 0) continue;
      const dong = [...bang.querySelectorAll('tbody tr')].filter(tr => tr.children.length > cot);
      return { dong, ma: dong.map(tr => B.gon(tr.children[cot].textContent)) };
    }
    return null;
  }

  /**
   * Hai ô lọc của danh sách đang ở "Tất cả": có phần tử ĐANG HIỆN mà chữ của chính nó là "Tất cả thành phố" / bắt đầu
   * bằng "Tất cả nhóm". Không xét chữ gợi ý (placeholder): ô đã chọn một thành phố vẫn có thể giữ chữ gợi ý cũ.
   * Lọc thì bảng và dòng Tổng cùng chỉ đếm phần đã lọc — đọc thiếu mã mà không biết.
   */
  function locTatCa() {
    const chuRieng = e => B.gon([...e.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.data).join(' '));
    const hien = [...document.querySelectorAll('p, span, div, button, label')].filter(e => dangHien(e)).map(chuRieng);
    return hien.includes('Tất cả thành phố') && hien.some(c => c.startsWith('Tất cả nhóm'));
  }

  /** Cuộn tới dòng cuối (cả khung cuộn chứa bảng lẫn trang). Ghi vị trí cũ của từng khung vào `cu` để trả lại sau. */
  function cuonXuongCuoi(bang, cu) {
    const cuoi = bang.dong[bang.dong.length - 1];
    for (let e = cuoi?.parentElement; e && e !== document.documentElement; e = e.parentElement) {
      if (e.scrollHeight > e.clientHeight + 1 && getComputedStyle(e).overflowY !== 'visible') {
        if (!cu.has(e)) cu.set(e, e.scrollTop);
        e.scrollTop = e.scrollHeight;
      }
    }
    cuoi?.scrollIntoView({ block: 'end' });
    window.scrollTo(window.scrollX, document.documentElement.scrollHeight);
  }

  /** Cuộn cho bảng tải hết (ít nhất một lượt — FABi có thể tải thêm khi cuộn), rồi so với dòng "Tổng: … món". */
  async function docDuDanhSach() {
    let bang = docBang();
    if (!bang) return { loi: 'khongThayBang' };
    const tong = B.docTong(document.body.innerText);
    if (tong === null) return { loi: 'khongThayTong' };
    const viTri = [window.scrollX, window.scrollY];
    const khungCu = new Map();
    let khongThem = 0;
    for (let luotCuon = 0; luotCuon < B.LUOT_CUON_TOI_DA && khongThem < B.LUOT_KHONG_THEM_TOI_DA; luotCuon++) {
      if (luotCuon > 0 && bang.dong.length >= tong) break;
      const truoc = bang.dong.length;
      cuonXuongCuoi(bang, khungCu);
      await cho(B.CHO_TAI_THEM_MS);
      bang = docBang() ?? bang;
      khongThem = bang.dong.length > truoc ? 0 : khongThem + 1;
    }
    for (const [khung, cuon] of khungCu) khung.scrollTop = cuon;
    window.scrollTo(viTri[0], viTri[1]);
    const tongSau = B.docTong(document.body.innerText) ?? tong;
    if (bang.dong.length < tongSau) return { loi: 'chuaDu', doc: bang.dong.length, tong: tongSau };
    const o = bang.ma.map(B.docMaO);
    const hong = o.findIndex(x => x === null);
    if (hong >= 0) return { loi: 'khongDocMa', dong: hong + 1 };
    return { ma: B.locMaSo(o.filter(x => x.ma).map(x => x.ma)), soMon: bang.dong.length };
  }

  // ---------------------------------------------------------------------------
  // 3 · HỘP THOẠI "THÊM MÓN TỪ FILE"
  // ---------------------------------------------------------------------------
  /** Hộp thoại đang hiện có Bước 2 "Thêm món vào file" và Bước 3 "Tải file thực đơn lên", kèm ô chọn file của nó. */
  function timHopThoaiNhap() {
    for (const hop of document.querySelectorAll('.modal')) {
      if (!dangHien(hop)) continue;
      const chu = B.gon(hop.textContent);
      if (!chu.includes('Thêm món vào file') || !chu.includes('Tải file thực đơn lên')) continue;
      const o = hop.querySelector('input[type="file"].excel-upload-input') ?? hop.querySelector('input[type="file"]');
      if (o) return { hop, o };
    }
    return null;
  }

  async function moHopThoaiTuDong() {
    const tienIch = timTheoChu('button, a, [role="button"], .btn, .dropdown-toggle', 'Tiện ích');
    if (!tienIch) return null;
    tienIch.click();
    const muc = await choDen(() => timTheoChu('a, button, li, .dropdown-item, [role="menuitem"]', 'Thêm món từ file'), B.CHO_MENU_MS);
    if (!muc) return null;
    muc.click();
    return choDen(timHopThoaiNhap, B.CHO_HOP_THOAI_MS);
  }

  /**
   * Bảng xem trước của FABi: hộp thoại đang hiện có bảng và nút "Lưu", và chữ của nó đã KHÁC lúc trước khi đưa file
   * (`truoc`: chữ của từng hộp thoại ngay trước sự kiện change) — bảng cũ còn sót từ lần trước không tính.
   */
  function timXemTruoc(truoc) {
    for (const hop of document.querySelectorAll('.modal')) {
      if (!dangHien(hop) || !hop.querySelector('table tbody tr')) continue;
      if (truoc.get(hop) === B.gon(hop.textContent)) continue;
      if ([...hop.querySelectorAll('button')].some(b => dangHien(b) && B.gon(b.textContent) === 'Lưu')) return hop;
    }
    return null;
  }

  /** Báo "đã xong" CHỈ khi FABi tự hiện "Tải lên thành công" sau khi người dùng bấm Lưu. */
  function theoDoiLuu(lan) {
    const CAU_FABI = 'Tải lên thành công';
    const dung = () => { quanSat.disconnect(); clearTimeout(henGio); };
    // Chỉ đọc chữ của nút chữ và phần tử nhỏ (thông báo của FABi là một khối nhỏ) — không đọc lại cả bảng mỗi lần FABi vẽ lại.
    const chuNho = nut => (nut.nodeType === Node.TEXT_NODE ? nut.data
      : nut.nodeType === Node.ELEMENT_NODE && nut.getElementsByTagName('*').length <= 20 ? nut.textContent : '');
    const quanSat = new MutationObserver(ghi => {
      if (lan !== luot) return dung();
      for (const g of ghi) {
        const thay = g.type === 'characterData' ? String(g.target.data ?? '').includes(CAU_FABI)
          : [...g.addedNodes].some(nut => (chuNho(nut) ?? '').includes(CAU_FABI));
        if (thay) { dung(); bao('xong', C.fabiDaLuu); return; }
      }
    });
    quanSat.observe(document.body, { childList: true, subtree: true, characterData: true });
    const henGio = setTimeout(dung, B.THEO_DOI_LUU_MS);
  }

  // ---------------------------------------------------------------------------
  // MỘT LẦN BẤM
  // ---------------------------------------------------------------------------
  let luot = 0;
  let dangChay = false;

  async function guiNen(tin) {
    try {
      return await chrome.runtime.sendMessage(tin);
    } catch {
      // Extension vừa được tải lại / cập nhật khi trang còn mở: trang cũ mất đường nói chuyện với nền.
      return { kieu: 'mat_noi_nen' };
    }
  }

  async function motLuot(lan) {
    bao('dang', C.docDanhSach);
    const timKiem = [...document.querySelectorAll('input')].find(o => o.placeholder === 'Nhập tên hoặc mã món');
    if (timKiem && B.gon(timKiem.value)) return bao('loi', C.dangTim);
    if (!locTatCa()) return bao('loi', C.dangLoc);
    const ds = await docDuDanhSach();
    if (ds.loi === 'khongThayBang') return bao('loi', C.khongThayBang);
    if (ds.loi === 'khongThayTong') return bao('loi', C.khongThayTong);
    if (ds.loi === 'chuaDu') return bao('loi', C.chuaDu(ds.doc, ds.tong));
    if (ds.loi === 'khongDocMa') return bao('loi', C.khongDocMa(ds.dong));
    if (ds.ma.length > B.MA_DA_CO_TOI_DA) return bao('loi', C.quaNhieuMa);

    bao('dang', C.layTep(ds.soMon));
    const kq = await guiNen({ loai: 'lay-tep-mon-moi', daCo: ds.ma });
    // Câu của kho theo ngôn ngữ người dùng chọn ở kho; đuôi "Chưa có gì…" theo đúng thứ tiếng của câu đó (B.kemKhongGi).
    const kemKhongGi = B.kemKhongGi;
    switch (kq?.kieu) {
      case 'tep': break;
      case 'chua_dang_nhap': return bao('loi', C.chuaDangNhap, { href: B.KHO + B.DUONG_DANG_NHAP, chu: C.moDangNhap });
      case 'chuyen_trang': return bao('loi', C.chuyenTrang, { href: B.KHO + B.DUONG_DANG_NHAP, chu: C.moDangNhap });
      case 'khong_co_mon_moi': return bao('xong', kq.cau || C.khongCoMonMoi);
      case 'khong_quyen': return bao('loi', kq.cau ? kemKhongGi(kq.cau) : C.khongQuyen);
      case 'qua_nhieu_ma': return bao('loi', C.quaNhieuMa);
      case 'tep_la': return bao('loi', C.tepLa);
      case 'mat_noi_nen': return bao('loi', C.taiLaiTrang);
      case 'sai_yeu_cau': case 'loi_kho': return bao('loi', kq.cau ? kemKhongGi(kq.cau) : C.loiKho(kq.status ?? 0));
      default: return bao('loi', C.matMang);
    }

    const bytes = B.tuBase64(kq.base64);
    const soMon = kq.soMon ?? '?';
    bao('dang', C.moHopThoai(soMon));
    let hop = timHopThoaiNhap() ?? await moHopThoaiTuDong();
    if (!hop) {
      bao('luu-y', C.choNguoiMo);
      hop = await choDen(timHopThoaiNhap, B.CHO_NGUOI_MO_MS, 500);
    }
    if (!hop) return bao('loi', C.hetChoHopThoai);

    const truoc = new Map([...document.querySelectorAll('.modal')].map(h => [h, B.gon(h.textContent)]));
    const goi = new DataTransfer();
    goi.items.add(new File([bytes], kq.tenTep, { type: B.KIEU_XLSX }));
    hop.o.files = goi.files;
    hop.o.dispatchEvent(new Event('change', { bubbles: true }));

    const xemTruoc = await choDen(() => timXemTruoc(truoc), B.CHO_XEM_TRUOC_MS, 300);
    if (!xemTruoc) return bao('luu-y', C.chuaThayXemTruoc);
    bao('luu-y', C.xemTruoc(soMon, kq.soDaCo ?? 0, kq.chiNhanh ?? ''));
    theoDoiLuu(lan);
  }

  nut.addEventListener('click', async () => {
    if (dangChay) return; // bấm đúp: lượt thứ hai không làm gì — kho chỉ bị hỏi một lần, FABi chỉ nhận một file
    dangChay = true;
    const lan = ++luot;
    datNut(true);
    try {
      await motLuot(lan);
    } catch {
      bao('loi', C.loiBatNgo);
    } finally {
      dangChay = false;
      datNut(false);
    }
  });
})();
