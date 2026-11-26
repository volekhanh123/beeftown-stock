/**
 * KHO — LƯU TẠM LƯỢT QUÉT KHI MẤT MẠNG (phần chạy trong trình duyệt)
 *
 * components/kho/QuetMa.astro gọi ganQuetLuuTam() cho mỗi ô quét. Ý tưởng và các quy tắc: đầu file
 * quet-luu-tam.ts. Ở đây chỉ là phần gắn vào trang:
 *
 *   1. Bấm nút của ô quét (cả nút "Xong" trong khung camera — nó requestSubmit nút đó) → hỏi mạng trước: HEAD một
 *      file tĩnh nhỏ (data-thu-mang, mặc định /kho/js/ean13.js), chờ tối đa 5 giây. Tới được → gửi form như cũ
 *      (trang không JavaScript và trang có mạng chạy y như trước). Không tới được:
 *        · trang ghi lượt quét (data-gui-lai): lượt vào hàng chờ trên máy, ô quét trống, ma_gui của form đổi sang
 *          mã mới (lượt quét kế tiếp là một lượt khác — cùng ma_gui thì database coi là gửi lại và bỏ nhãn mới);
 *        · trang chỉ đọc mã: giữ mã trong ô, báo chưa đọc được.
 *   2. Hàng chờ tự gửi khi: mở trang, có mạng lại (sự kiện online), quay lại thẻ (visibilitychange), mỗi
 *      data-hen-gui-ms (mặc định 20 giây) khi còn lượt chờ, bấm "Gửi ngay". Mỗi lượt POST lại đúng các ô đã lưu
 *      (fetch, theo chuyển hướng) rồi xếp loại trả lời bằng xepLoaiTraLoi(). Chỉ báo "Kho đã nhận" khi chính trả lời
 *      đó là chuyển hướng về trang của lượt.
 *   3. Còn lượt chờ của trang này thì mọi nút gửi form POST khác của trang (Quét xong, Gửi quản lý, Chốt, −1, Bỏ
 *      lượt…) bị chặn kèm câu giải thích — Quét xong lúc còn nhãn chưa vào sổ là món đó bị ghi "đã bán hết".
 *   4. Bản nháp ô quét (mọi trang): ô đổi là chép vào máy; mở trang mà ô trống thì đưa lại.
 *
 * Không có localStorage (chế độ riêng tư chặn) thì vẫn hỏi mạng trước khi gửi và giữ mã trong ô khi mất mạng,
 * chỉ không lưu được qua lần tải trang.
 */
import {
  CAU_LUU_TAM, KHOA_HANG_CHO, KHOA_NHAP, boKhoiHang, cauTheo, chuHangCho, choGuiLai, chuanDuong, cuaNguoi,
  cuaNguoiKhac, cuaTrang, demNhan, docHangCho, docNhap, ghiLanThu, ghiNhap, taoLuot, themVaoHang, xepLoaiTraLoi,
  type LuotCho,
} from './quet-luu-tam.ts';
import type { HaiThuTieng, NgonNguNB } from '../ngon-ngu-noi-bo.ts';

const CHO_THU_MANG_MS = 5_000;
const HEN_GUI_MS = 20_000;
const KHOA_KHOA = 'bt-kho-quet-cho';
type Kieu = 'xong' | 'luu-y' | 'loi';

/** localStorage dùng được không (chế độ riêng tư, chặn cookie: đọc / ghi ném lỗi). */
function layKho(): Storage | null {
  try {
    const k = window.localStorage;
    const thu = '__bt_thu__';
    k.setItem(thu, '1');
    k.removeItem(thu);
    return k;
  } catch {
    return null;
  }
}

function maMoi(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * Câu báo kết quả của trang kho vừa dựng (BaoKho: khối [data-bao-ket-qua] — câu chuyenHuong mang theo): kiểu và
 * chữ, để quyết định bỏ lượt khỏi hàng hay không và nói lại đúng điều kho nói. Không có câu báo → kieu null.
 */
function cauBaoCua(html: string): { kieu: 'xong' | 'loi' | null; cau: string } {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const k = doc.querySelector<HTMLElement>('[data-bao-ket-qua]');
    if (!k) return { kieu: null, cau: '' };
    const kieu = k.dataset.baoKetQua === 'xong' ? 'xong' : 'loi';
    return { kieu, cau: (k.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 400) };
  } catch {
    return { kieu: null, cau: '' };
  }
}

export function ganQuetLuuTam(goc: HTMLElement): void {
  const o = goc.querySelector<HTMLTextAreaElement>('textarea[name="ma_quet"]');
  const nut = goc.querySelector<HTMLButtonElement>('button[data-quet-gui]');
  const form = nut?.form ?? null;
  if (!o || !nut || !form) return;

  const nn: NgonNguNB = goc.dataset.nn === 'en' ? 'en' : 'vi';
  const cau = (c: HaiThuTieng) => cauTheo(nn, c);
  const nguoi = goc.dataset.nguoi ?? '';
  const guiLai = (goc.dataset.guiLai ?? '').split(/\s+/).filter(Boolean);
  const ghiSo = guiLai.length > 0;
  const thuMang = goc.dataset.thuMang || '/kho/js/ean13.js';
  const henMs = Number(goc.dataset.henGuiMs) > 0 ? Number(goc.dataset.henGuiMs) : HEN_GUI_MS;
  const diaChi = () => new URL(form.action, location.href);
  const duong = chuanDuong(diaChi().pathname);
  const kho = nguoi ? layKho() : null;

  // --- Bộ nhớ -----------------------------------------------------------------
  const docHang = (): LuotCho[] => {
    if (!kho) return [];
    try { return docHangCho(kho.getItem(KHOA_HANG_CHO)); } catch { return []; }
  };
  const ghiHang = (ds: LuotCho[]): boolean => {
    if (!kho) return false;
    try {
      if (ds.length === 0) kho.removeItem(KHOA_HANG_CHO);
      else kho.setItem(KHOA_HANG_CHO, chuHangCho(ds));
      return true;
    } catch {
      return false;
    }
  };
  const luuNhap = () => {
    if (!kho) return;
    try { kho.setItem(KHOA_NHAP, ghiNhap(kho.getItem(KHOA_NHAP), duong, nguoi, o.value, Date.now())); } catch { /* đầy: thôi */ }
  };
  const xoaNhap = () => {
    if (!kho) return;
    try { kho.setItem(KHOA_NHAP, ghiNhap(kho.getItem(KHOA_NHAP), duong, nguoi, '', Date.now())); } catch { /* */ }
  };

  // --- Khung báo ----------------------------------------------------------------
  const khung = document.createElement('div');
  khung.className = 'kho-quet-cho';
  khung.dataset.quetCho = '';
  khung.setAttribute('aria-live', 'polite');
  khung.hidden = true;
  goc.prepend(khung);

  let baoTam: { kieu: Kieu; chu: string } | null = null;
  let daNhan: string[] = [];
  let canDangNhap = false;
  let coSoMoi = false;

  const theNut = (chu: string, khoa: string, lam: () => void) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'nb-nut phu';
    b.textContent = chu;
    b.dataset[khoa] = '';
    b.addEventListener('click', lam);
    return b;
  };
  const them = (kieu: Kieu, chu: string, nutThem: HTMLButtonElement[] = []) => {
    const k = document.createElement('div');
    k.className = `nb-bao ${kieu}`;
    k.setAttribute('role', kieu === 'loi' ? 'alert' : 'status');
    const p = document.createElement('p');
    p.textContent = chu;
    k.append(p);
    if (nutThem.length > 0) {
      const hang = document.createElement('div');
      hang.className = 'kho-thanh-nut';
      hang.style.margin = '.5rem 0 0';
      hang.append(...nutThem);
      k.append(hang);
    }
    khung.append(k);
  };

  const ve = () => {
    const ds = docHang();
    const cua = cuaNguoi(ds, nguoi);
    const khac = cuaNguoiKhac(ds, nguoi);
    const dung = cua.filter(l => l.dung);
    khung.replaceChildren();
    if (baoTam) them(baoTam.kieu, baoTam.chu);
    const gan = daNhan.slice(-3);
    gan.forEach((c, i) => them('xong', c, coSoMoi && i === gan.length - 1
      ? [theNut(cau(CAU_LUU_TAM.taiLai), 'quetTaiLai', () => {
        // GET lại trang — không gửi lại lượt POST khi trang đang là trả lời của một lượt POST.
        location.assign(location.pathname + location.search);
      })]
      : []));
    if (cua.length > 0) {
      them('luu-y', cau(CAU_LUU_TAM.dangCho(cua)), [
        theNut(cau(CAU_LUU_TAM.guiNgay), 'quetGuiNgay', () => { void guiNgay(); }),
        theNut(cau(CAU_LUU_TAM.bo), 'quetBo', boLuotCho),
      ]);
    }
    for (const l of dung) them('loi', cau(CAU_LUU_TAM.dung(l, Date.now())));
    if (canDangNhap && cua.length > 0) them('loi', cau(CAU_LUU_TAM.dangNhap(cua.length)));
    if (khac.length > 0) them('luu-y', cau(CAU_LUU_TAM.nguoiKhac(khac.length)));
    khung.hidden = khung.childElementCount === 0;
  };

  // --- Hỏi mạng -------------------------------------------------------------------
  const kiemMang = async (): Promise<boolean> => {
    if (navigator.onLine === false) return false;
    const huy = new AbortController();
    const hen = setTimeout(() => huy.abort(), CHO_THU_MANG_MS);
    try {
      await fetch(`${thuMang}${thuMang.includes('?') ? '&' : '?'}t=${Date.now()}`, {
        method: 'HEAD', cache: 'no-store', credentials: 'omit', signal: huy.signal,
      });
      return true;
    } catch {
      return false;
    } finally {
      clearTimeout(hen);
    }
  };

  // --- Gửi hàng chờ -------------------------------------------------------------------
  let dangGui = false;
  /** Gửi các lượt chờ (đang tự gửi) của người đang đăng nhập. Trả true nếu dừng vì mất mạng. */
  const guiHang = async (): Promise<boolean> => {
    if (dangGui || !kho) return false;
    if (!cuaNguoi(docHang(), nguoi).some(l => !l.dung)) return false;
    dangGui = true;
    let matMang = false;
    const chay = async () => {
      for (const l of cuaNguoi(docHang(), nguoi).filter(x => !x.dung)) {
        // Thẻ khác có thể vừa gửi xong lượt này.
        if (!docHang().some(x => x.ma_gui === l.ma_gui)) continue;
        let r: Response | null = null;
        try {
          r = await fetch(l.url, {
            method: 'POST', body: new URLSearchParams(l.truong), credentials: 'same-origin', redirect: 'follow',
            cache: 'no-store',
          });
        } catch {
          r = null;
        }
        // Trang đích chỉ đọc khi đã chuyển hướng (đọc thân hỏng = không thấy câu báo = chưa coi là đã nhận).
        let bao: { kieu: 'xong' | 'loi' | null; cau: string } = { kieu: null, cau: '' };
        if (r?.redirected) {
          try { bao = cauBaoCua(await r.text()); } catch { /* giữ kieu null */ }
        }
        const kq = xepLoaiTraLoi(r && { redirected: r.redirected, status: r.status, url: r.url }, l.duong, bao.kieu);
        if (kq === 'mat-mang') { matMang = true; break; }
        if (kq === 'dang-nhap') { canDangNhap = true; break; }
        canDangNhap = false;
        if (l.duong === duong && (kq === 'da-nhan' || kq === 'tu-choi')) coSoMoi = true;
        if (kq === 'da-nhan') {
          ghiHang(boKhoiHang(docHang(), l.ma_gui));
          daNhan.push(cau(CAU_LUU_TAM.daNhan(l.luc, l.so_nhan, bao.cau, Date.now())));
          baoTam = null;
          continue;
        }
        if (kq === 'tu-choi') {
          // Kho đã trả lời lượt này (câu lỗi, hay cộng một phần): giữ, thôi tự gửi, hiện câu — các lượt sau vẫn gửi.
          ghiHang(ghiLanThu(docHang(), l.ma_gui, true, bao.cau));
          baoTam = null;
          continue;
        }
        // Tới máy chủ mà chưa ghi (database lỗi), hay bị chuyển đi: ghi một lần thử, để lần hẹn sau.
        ghiHang(ghiLanThu(docHang(), l.ma_gui, kq === 'bi-chuyen'));
        break;
      }
    };
    try {
      if (navigator.locks?.request) await navigator.locks.request(KHOA_KHOA, chay);
      else await chay();
    } catch {
      /* khóa không dùng được: lượt nào chưa gửi thì lần hẹn sau gửi */
    } finally {
      dangGui = false;
      ve();
    }
    return matMang;
  };

  let hen: ReturnType<typeof setInterval> | null = null;
  const henGui = () => {
    if (hen !== null || !cuaNguoi(docHang(), nguoi).some(l => !l.dung)) return;
    hen = setInterval(() => {
      if (!cuaNguoi(docHang(), nguoi).some(l => !l.dung)) {
        if (hen !== null) clearInterval(hen);
        hen = null;
        return;
      }
      void guiHang();
    }, henMs);
  };

  const guiNgay = async () => {
    ghiHang(choGuiLai(docHang(), nguoi));
    canDangNhap = false;
    const matMang = await guiHang();
    if (matMang) { baoTam = { kieu: 'loi', chu: cau(CAU_LUU_TAM.chuaGui) }; ve(); }
    henGui();
  };

  const boLuotCho = () => {
    const cua = cuaNguoi(docHang(), nguoi);
    if (cua.length === 0) return;
    if (!window.confirm(cau(CAU_LUU_TAM.hoiBo(cua)))) return;
    ghiHang(docHang().filter(l => l.nguoi !== nguoi));
    baoTam = null;
    canDangNhap = false;
    ve();
  };

  // --- Lưu tạm một lượt -----------------------------------------------------------------
  const luuTam = () => {
    const dc = diaChi();
    const luot = taoLuot({
      truong: new FormData(form).entries(), guiLai, viec: nut.value, maQuet: o.value, duong,
      url: dc.pathname + dc.search, nguoi, luc: Date.now(),
    });
    // Chỉ báo "đã lưu tạm" khi đọc lại thấy lượt nằm trong bộ nhớ.
    const daGhi = luot !== null && ghiHang(themVaoHang(docHang(), luot)) && docHang().some(l => l.ma_gui === luot.ma_gui);
    if (!luot || !daGhi) {
      luuNhap();
      baoTam = { kieu: 'loi', chu: cau(luot ? CAU_LUU_TAM.khongLuuDuoc : CAU_LUU_TAM.chuaGui) };
      ve();
      return;
    }
    o.value = '';
    xoaNhap();
    const oMaGui = form.querySelector<HTMLInputElement>('input[name="ma_gui"]');
    if (oMaGui) oMaGui.value = maMoi();
    baoTam = { kieu: 'luu-y', chu: cau(CAU_LUU_TAM.vuaLuu(luot.so_nhan)) };
    daNhan = [];
    coSoMoi = false;
    ve();
    henGui();
  };

  // --- Bấm nút của ô quét ------------------------------------------------------------------
  let choQua = false;
  let dangKiem = false;
  const guiForm = () => {
    choQua = true;
    if (typeof form.requestSubmit === 'function') form.requestSubmit(nut);
    else nut.click();
    // Trình duyệt không phát submit (form không hợp lệ…): lần bấm sau vẫn hỏi mạng.
    setTimeout(() => { choQua = false; }, 0);
  };
  form.addEventListener('submit', e => {
    if ((e as SubmitEvent).submitter !== nut) return;
    if (choQua) { choQua = false; return; }
    e.preventDefault();
    if (dangKiem) return;
    dangKiem = true;
    void kiemMang().then(coMang => {
      dangKiem = false;
      if (coMang) {
        xoaNhap();
        guiForm();
        return;
      }
      if (!o.value.trim()) baoTam = { kieu: 'loi', chu: cau(CAU_LUU_TAM.chuaGui) };
      else if (!ghiSo || !kho) {
        luuNhap();
        baoTam = { kieu: 'loi', chu: cau(ghiSo ? CAU_LUU_TAM.khongLuuDuoc : CAU_LUU_TAM.chuaDoc) };
      } else {
        luuTam();
        return;
      }
      ve();
    });
  });

  // --- Chặn nút khác của trang khi còn lượt chờ ---------------------------------------------------
  document.addEventListener('submit', e => {
    const f = e.target;
    if (!(f instanceof HTMLFormElement) || f.method !== 'post') return;
    const ai = (e as SubmitEvent).submitter;
    if (ai && ai.matches('button[data-quet-gui]')) return;
    let toi: string;
    try { toi = chuanDuong(new URL(f.action, location.href).pathname); } catch { return; }
    if (toi !== duong) return;
    const cho = cuaTrang(docHang(), nguoi, duong);
    if (cho.length === 0) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    baoTam = { kieu: 'loi', chu: cau(CAU_LUU_TAM.chan(cho)) };
    ve();
    khung.scrollIntoView({ block: 'center' });
  }, true);

  // --- Bản nháp ô quét -------------------------------------------------------------------------
  if (kho) {
    if (o.value.trim()) {
      luuNhap();   // máy chủ vừa đưa lại mã (lỗi database): bản đó là bản đúng
    } else {
      const b = docNhap(kho.getItem(KHOA_NHAP), duong, nguoi, Date.now());
      if (b) {
        o.value = b.ma_quet;
        baoTam = { kieu: 'luu-y', chu: cau(CAU_LUU_TAM.duaLai(demNhan(b.ma_quet), b.luc, Date.now())) };
      }
    }
    o.addEventListener('input', luuNhap);
    window.addEventListener('storage', e => { if (e.key === KHOA_HANG_CHO) ve(); });
  }

  window.addEventListener('online', () => { void guiHang().then(henGui); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void guiHang().then(henGui);
  });
  ve();
  henGui();
  setTimeout(() => { void guiHang(); }, 800);
}
