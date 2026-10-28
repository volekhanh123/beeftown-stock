/**
 * BEEFTOWN — MỞ RỘNG FABi: PHẦN THUẦN DÙNG CHUNG
 *
 * Nạp ở hai nơi: service worker (nen.js, importScripts) và trang FABi CMS (content script, trước trang-fabi.js).
 * Kiểm thử Node nạp thẳng file này: crm/test/test-mo-rong-fabi.mjs. Vì vậy file THUẦN: không DOM, không chrome.*,
 * không mạng — chỉ hằng, câu chữ và hàm tính. Viết kiểu script thường (không import / export) vì content script
 * không nạp được module; mọi thứ gắn vào globalThis.BeeftownFabi.
 *
 * Mọi điều về FABi CMS ở đây và ở trang-fabi.js lấy từ lần Cowork ghi lại trang thật ngày 28/10/2026
 * (thương hiệu SLK Group): danh sách món /menu/items/items-in-city, hộp thoại "Thêm món từ file" có
 * <input type="file" class="excel-upload-input"> ẩn, đọc Excel ngay trên trình duyệt rồi hiện bảng xem trước
 * với nút "Lưu". README.md của thư mục này ghi đủ giả định và việc Khánh phải thử trên FABi thật.
 */
(function (goc) {
  'use strict';

  /** Kho Beeftown — nơi có file nhập món (lib/kho/thu-ngan.ts, taoTepNhapFabi). */
  const KHO = 'https://beeftown.vn';
  const DUONG_TEP = '/noi-bo/kho/ban-ipos/mon-fabi.xlsx';
  const DUONG_DANG_NHAP = '/noi-bo/dang-nhap';
  /** FABi CMS — extension chỉ chạy ở đây (manifest.json, content_scripts). */
  const FABI = 'https://fabi.ipos.vn';
  /** Trang "Món ăn tại thành phố": bảng món và nút Tiện ích → Thêm món từ file. */
  const TRANG_DANH_SACH = '/menu/items/items-in-city';
  /** Cùng trần với MA_DA_CO_TOI_DA của web/src/lib/kho/thu-ngan.ts (route trả 400 khi vượt). */
  const MA_DA_CO_TOI_DA = 2000;
  /** Địa chỉ dài nhất extension gửi (Cloudflare từ chối địa chỉ quá dài trước khi tới kho). Beeftown dùng vài chục món:
   *  50 mã ≈ 350 ký tự. Vượt mức này thì báo, không cắt bớt danh sách (cắt là đưa lại món đã có). */
  const DIA_CHI_TOI_DA = 8000;
  const KIEU_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  /** File nhập món của kho chỉ vài KB; lớn hơn mức này là phản hồi lạ, không đưa vào FABi. */
  const TEP_TOI_DA_BYTE = 5 * 1024 * 1024;
  /** Chờ kho trả file tối đa (đọc database + dựng Excel thường dưới 2 giây). */
  const HET_GIO_KHO_MS = 30_000;
  /** Mở hộp thoại tự động: chờ menu Tiện ích, chờ hộp thoại hiện. */
  const CHO_MENU_MS = 3_000;
  const CHO_HOP_THOAI_MS = 5_000;
  /** Mở tự động không được → chờ người bấm Tiện ích → Thêm món từ file tối đa 2 phút. */
  const CHO_NGUOI_MO_MS = 120_000;
  /** Sau khi đưa file: chờ FABi đọc Excel và hiện bảng xem trước. */
  const CHO_XEM_TRUOC_MS = 15_000;
  /** Sau bảng xem trước: theo dõi câu "Tải lên thành công" của FABi tối đa 10 phút (người kiểm từng dòng). */
  const THEO_DOI_LUU_MS = 600_000;
  /** Cuộn bảng để FABi tải thêm món: chờ mỗi lượt, dừng sau ngần này lượt liền không thêm dòng. */
  const CHO_TAI_THEM_MS = 800;
  const LUOT_KHONG_THEM_TOI_DA = 3;
  const LUOT_CUON_TOI_DA = 200;

  /** Gom khoảng trắng (kể cả xuống dòng, khoảng trắng không ngắt) thành một dấu cách, cắt hai đầu. */
  function gon(chu) {
    return String(chu ?? '').replace(/[\s ]+/g, ' ').trim();
  }

  function laTrangDanhSach(duong) {
    return (String(duong ?? '').replace(/\/+$/, '') || '/') === TRANG_DANH_SACH;
  }

  /**
   * Mã món đọc ở cột "Mã món" của bảng FABi → chỉ mã TOÀN SỐ (1–16 số), không trùng, giữ nguyên số 0 đầu (kho tự
   * bỏ khi so). Mã có chữ (ITEM-HJAE — FABi tự sinh) không bao giờ trùng mã cân / ô / giảm của kho: bỏ.
   */
  function locMaSo(cacMa) {
    return [...new Set((cacMa ?? []).map(gon).filter(m => /^\d{1,16}$/.test(m)))];
  }

  /**
   * Chữ của một ô "Mã món" → { ma } (mã toàn số — có thể là món cân / ô / giảm của kho), { coChu: true } (mã có chữ
   * như ITEM-HJAE — không bao giờ trùng mã kho), hoặc null (không đọc được: ô trống, hai mã số). Ô có thêm chữ quanh
   * mã (nhãn, nút sao chép) vẫn đọc được mã số duy nhất trong ô. null → extension dừng: đọc thiếu là đưa lại món đã có.
   */
  function docMaO(chu) {
    const tu = gon(chu).split(' ').filter(Boolean);
    const so = tu.filter(t => /^\d{1,16}$/.test(t));
    if (so.length === 1) return { ma: so[0] };
    if (so.length === 0 && tu.length > 0 && /^[A-Za-z][A-Za-z0-9_-]*$/.test(tu[0]) && /[A-Za-z]/.test(tu[0])) return { coChu: true };
    return null;
  }

  /** "Tổng: 3 món", "Tổng: 1.234 món" → số; không thấy → null. */
  function docTong(chu) {
    const m = /Tổng\s*:\s*(\d{1,3}(?:[.,\s]\d{3})*|\d+)\s*món/i.exec(gon(chu));
    if (!m) return null;
    const so = Number(m[1].replace(/[.,\s]/g, ''));
    return Number.isSafeInteger(so) ? so : null;
  }

  /** Địa chỉ file nhập món, kèm mã đang có trên FABi (da_co) để kho không đưa lại món đã có. */
  function taoUrlTep(maSo) {
    const u = new URL(DUONG_TEP, KHO);
    u.searchParams.set('da_co', (maSo ?? []).join(','));
    return u.href;
  }

  /**
   * Phản hồi của kho → loại. { status, kieuNoiDung, url, redirected } lấy từ Response của fetch (theo chuyển hướng).
   *   · chua_dang_nhap — chưa đăng nhập: middleware /noi-bo chuyển hướng 302 về /noi-bo/dang-nhap, hoặc route trả 401.
   *   · chuyen_trang — đã đăng nhập mà kho chuyển sang trang khác thay vì trả file: tài khoản máy (màn máy), máy
   *     tính bảng dùng chung đã khóa (kiemMayChung trong lib/kho/may-chung.ts).
   *   · tep — 200, kiểu .xlsx.  · khong_co_mon_moi — 200, chữ trơn (câu của kho).
   *   · khong_quyen — 403.  · sai_yeu_cau — 400 (da_co sai dạng).  · loi_kho — mọi thứ khác.
   */
  function phanLoaiPhanHoi(p) {
    const status = Number(p?.status ?? 0);
    const kieu = String(p?.kieuNoiDung ?? '').toLowerCase();
    if (p?.type === 'opaqueredirect' || status === 401) return 'chua_dang_nhap';
    let duong = '';
    try { duong = new URL(String(p?.url ?? '')).pathname.replace(/\/+$/, ''); } catch { /* không có địa chỉ: xét tiếp */ }
    if (duong === DUONG_DANG_NHAP) return 'chua_dang_nhap';
    if (p?.redirected || (duong && duong !== DUONG_TEP)) return 'chuyen_trang';
    if (status === 200 && kieu.startsWith(KIEU_XLSX)) return 'tep';
    if (status === 200 && kieu.startsWith('text/plain')) return 'khong_co_mon_moi';
    if (status === 403) return 'khong_quyen';
    if (status === 400) return 'sai_yeu_cau';
    return 'loi_kho';
  }

  /** Câu chữ trơn của kho (route trả text/plain) — chỉ nhận chữ ngắn, không thẻ HTML; không thì ''. */
  function cauCuaKho(kieuNoiDung, chu) {
    if (!String(kieuNoiDung ?? '').toLowerCase().startsWith('text/plain')) return '';
    const c = gon(chu);
    return c.length > 0 && c.length <= 600 && !/[<>]/.test(c) ? c : '';
  }

  /** File .xlsx là zip: 4 byte đầu "PK\x03\x04". */
  function laTepZip(bytes) {
    return !!bytes && bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  }

  /** Tên file từ content-disposition của kho (them-mon-fabi-<chi nhánh>-YYYYMMDD-HHMM.xlsx), chỉ ký tự ASCII an toàn. */
  function tenTepTuHeader(header) {
    const m = /filename="?([^";]+)"?/i.exec(String(header ?? ''));
    const ten = m ? m[1].replace(/[^a-zA-Z0-9._-]/g, '_') : '';
    return /\.xlsx$/.test(ten) ? ten : 'them-mon-fabi.xlsx';
  }

  /** Số không âm từ header x-so-mon / x-so-da-co; thiếu hay sai → null. */
  function docSoHeader(chu) {
    const so = Number(chu);
    return chu != null && chu !== '' && Number.isSafeInteger(so) && so >= 0 ? so : null;
  }

  /** Byte ↔ base64 (tin nhắn giữa service worker và trang chỉ chở được JSON). */
  function sangBase64(bytes) {
    let nhi = '';
    for (let i = 0; i < bytes.length; i += 0x8000) nhi += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(nhi);
  }
  function tuBase64(chuoi) {
    const nhi = atob(chuoi);
    const ra = new Uint8Array(nhi.length);
    for (let i = 0; i < nhi.length; i++) ra[i] = nhi.charCodeAt(i);
    return ra;
  }

  /** Câu có chữ Việt có dấu → 'vi', không thì 'en' (câu của kho theo ngôn ngữ người dùng chọn ở kho). */
  function ngonNguCua(cau) {
    return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(String(cau ?? '')) ? 'vi' : 'en';
  }

  /** Câu của kho + "Chưa có gì được đưa vào FABi" CÙNG thứ tiếng với câu của kho — không câu nào lẫn hai thứ tiếng. */
  function kemKhongGi(cau) {
    return `${cau} ${KHONG_GI[ngonNguCua(cau)]}`;
  }

  /** Mã chi nhánh từ header x-chi-nhanh (mã hóa URL); thiếu hay hỏng → ''. Chỉ chữ, số, gạch — đưa vào câu. */
  function docChiNhanh(chu) {
    try {
      const ma = decodeURIComponent(String(chu ?? ''));
      return /^[\p{L}\p{N}_ .-]{1,40}$/u.test(ma) ? ma : '';
    } catch { return ''; }
  }

  /** Ngôn ngữ của khung extension: tiếng Việt khi trình duyệt dùng tiếng Việt, không thì tiếng Anh. */
  function chonNgonNgu(ngonNgu) {
    return /^vi\b/i.test(String(ngonNgu ?? '')) ? 'vi' : 'en';
  }

  const KHONG_GI = { vi: 'Chưa có gì được đưa vào FABi.', en: 'Nothing has been put into FABi.' };

  /**
   * Câu của khung extension — hai thứ tiếng như mọi màn nội bộ. Đúng sự thật: extension chỉ ĐƯA FILE vào hộp thoại;
   * món chỉ vào FABi khi người dùng bấm Lưu của FABi và FABi báo "Tải lên thành công" (câu của chính FABi).
   */
  const CAU = {
    vi: {
      tieuDe: 'Beeftown · món mới từ kho',
      gioiThieu: 'Lấy món kho chưa có trên FABi, đưa vào hộp thoại Thêm món từ file. Bạn xem bảng xem trước rồi tự bấm Lưu của FABi.',
      nut: 'Đưa món mới sang FABi',
      nutDang: 'Đang làm…',
      an: 'Ẩn',
      docDanhSach: 'Đang đọc danh sách món trên FABi…',
      dangTim: 'Ô tìm kiếm đang có chữ nên bảng chỉ hiện một phần món. Xóa ô tìm kiếm, bấm kính lúp cho bảng hiện đủ, rồi bấm lại. ' + KHONG_GI.vi,
      dangLoc: 'Không thấy hai ô lọc "Tất cả thành phố" và "Tất cả nhóm món". Đặt hai ô lọc về Tất cả rồi bấm lại — extension cần thấy đủ món để không thêm trùng. ' + KHONG_GI.vi,
      khongThayBang: 'Không thấy bảng món có cột "Mã món" trên trang này — FABi có thể đã đổi giao diện. Báo người làm phần mềm. ' + KHONG_GI.vi,
      khongThayTong: 'Không thấy dòng "Tổng: … món" dưới bảng nên không biết đã đọc đủ món chưa — FABi có thể đã đổi giao diện. Báo người làm phần mềm. ' + KHONG_GI.vi,
      chuaDu: (doc, tong) => `Mới đọc được ${doc} / ${tong} món trên FABi (bảng chưa tải hết). Cuộn xuống cuối bảng cho hiện đủ rồi bấm lại. ${KHONG_GI.vi}`,
      quaNhieuMa: `Danh sách mã món trên FABi quá dài để gửi kho một lần (quá ${MA_DA_CO_TOI_DA} mã hoặc quá ${DIA_CHI_TOI_DA} ký tự). Báo người làm phần mềm. ${KHONG_GI.vi}`,
      khongDocMa: dong => `Không đọc được mã món ở dòng ${dong} của bảng FABi (ô trống hoặc có hai mã). FABi có thể đã đổi giao diện — báo người làm phần mềm. ${KHONG_GI.vi}`,
      layTep: n => `Đã đọc ${n} món trên FABi. Đang lấy món mới từ kho Beeftown…`,
      chuaDangNhap: 'Trình duyệt này chưa đăng nhập kho Beeftown. Mở trang đăng nhập kho, đăng nhập bằng tài khoản quản lý hoặc chủ, rồi bấm lại. ' + KHONG_GI.vi,
      moDangNhap: 'Mở trang đăng nhập kho',
      chuyenTrang: 'Kho chuyển sang trang khác thay vì trả file — trình duyệt đang đăng nhập kho bằng tài khoản máy, hoặc máy tính bảng dùng chung đang khóa. Đăng nhập kho bằng tài khoản quản lý hoặc chủ trên trình duyệt này rồi bấm lại. ' + KHONG_GI.vi,
      khongQuyen: 'Tài khoản đang đăng nhập kho không được tải danh sách món cho FABi (cần tài khoản quản lý hoặc chủ). ' + KHONG_GI.vi,
      matMang: `Không lấy được file từ kho Beeftown (mất mạng hoặc quá ${HET_GIO_KHO_MS / 1000} giây). ${KHONG_GI.vi} Thử lại sau ít giây.`,
      loiKho: status => `Kho Beeftown báo lỗi (mã ${status}). ${KHONG_GI.vi} Thử lại sau ít phút; còn lỗi thì báo người làm phần mềm.`,
      tepLa: 'Kho trả về một file không phải Excel. ' + KHONG_GI.vi + ' Báo người làm phần mềm.',
      khongCoMonMoi: 'Kho không có món mới nào cần thêm trên FABi.',
      taiLaiTrang: 'Extension vừa được tải lại hoặc cập nhật. Tải lại trang FABi (phím F5) rồi bấm lại. ' + KHONG_GI.vi,
      loiBatNgo: 'Extension gặp lỗi bất ngờ. Nếu hộp thoại Thêm món từ file đang mở, kiểm kỹ bảng xem trước rồi mới bấm Lưu. Báo người làm phần mềm.',
      moHopThoai: n => `Kho có ${n} món mới. Đang mở Tiện ích → Thêm món từ file…`,
      choNguoiMo: 'Chưa mở được hộp thoại tự động. Bấm Tiện ích → Thêm món từ file; extension đưa file vào khi hộp thoại hiện (chờ 2 phút).',
      hetChoHopThoai: 'Hết 2 phút mà chưa thấy hộp thoại Thêm món từ file. ' + KHONG_GI.vi + ' Bấm lại để thử lần nữa.',
      xemTruoc: (n, daCo, cn) => `FABi đang hiện bảng xem trước ${n} món mới${cn ? ` của chi nhánh ${cn} trong kho` : ''}. Kiểm tên, mã, giá từng dòng rồi bấm Lưu của FABi. FABi báo lỗi dòng nào thì đọc câu lỗi trước, đừng bấm Lưu.`
        + (daCo > 0 ? ` ${daCo} món kho đã có trên FABi nên không đưa lại.` : ''),
      chuaThayXemTruoc: 'Đã đưa file vào hộp thoại nhưng chưa thấy bảng xem trước của FABi. Xem hộp thoại: FABi báo lỗi thì chụp màn hình gửi người làm phần mềm. Chưa có món nào được lưu.',
      fabiDaLuu: 'FABi báo "Tải lên thành công". Ở máy thu ngân, quét thử 1 tem cân của mỗi món mới xem ra đúng món, đúng giá.',
    },
    en: {
      tieuDe: 'Beeftown · new dishes from stock',
      gioiThieu: 'Takes the stock dishes that are not on FABi yet and puts them into the Add dishes from file dialog. You check the preview and press FABi’s Save yourself.',
      nut: 'Bring new dishes into FABi',
      nutDang: 'Working…',
      an: 'Hide',
      docDanhSach: 'Reading the dish list on FABi…',
      dangTim: 'The search box has text, so the table shows only some dishes. Clear the search box, press the magnifier so the table shows everything, then press again. ' + KHONG_GI.en,
      dangLoc: 'The two filters "Tất cả thành phố" (all cities) and "Tất cả nhóm món" (all dish groups) were not found. Set both filters back to all, then press again — the extension must see every dish to avoid duplicates. ' + KHONG_GI.en,
      khongThayBang: 'No dish table with a "Mã món" (dish code) column on this page — FABi may have changed its layout. Tell the software maintainer. ' + KHONG_GI.en,
      khongThayTong: 'The "Tổng: … món" (total) line under the table was not found, so it is not known whether every dish was read — FABi may have changed its layout. Tell the software maintainer. ' + KHONG_GI.en,
      chuaDu: (doc, tong) => `Only ${doc} / ${tong} FABi dishes were read (the table has not loaded everything). Scroll to the end of the table so everything shows, then press again. ${KHONG_GI.en}`,
      quaNhieuMa: `The list of FABi dish codes is too long to send to stock at once (more than ${MA_DA_CO_TOI_DA} codes or ${DIA_CHI_TOI_DA} characters). Tell the software maintainer. ${KHONG_GI.en}`,
      khongDocMa: dong => `Could not read the dish code on row ${dong} of the FABi table (empty cell or two codes). FABi may have changed its layout — tell the software maintainer. ${KHONG_GI.en}`,
      layTep: n => `Read ${n} dishes on FABi. Getting the new dishes from Beeftown stock…`,
      chuaDangNhap: 'This browser is not logged in to Beeftown stock. Open the stock login page, log in with a manager or owner account, then press again. ' + KHONG_GI.en,
      moDangNhap: 'Open the stock login page',
      chuyenTrang: 'Stock moved to another page instead of returning the file — this browser is logged in to stock with a machine account, or the shared tablet is locked. Log in to stock with a manager or owner account in this browser, then press again. ' + KHONG_GI.en,
      khongQuyen: 'The account logged in to stock may not download the FABi dish list (a manager or owner account is needed). ' + KHONG_GI.en,
      matMang: `Could not get the file from Beeftown stock (no connection or more than ${HET_GIO_KHO_MS / 1000} seconds). ${KHONG_GI.en} Try again in a few seconds.`,
      loiKho: status => `Beeftown stock reported an error (code ${status}). ${KHONG_GI.en} Try again in a few minutes; if it keeps failing, tell the software maintainer.`,
      tepLa: 'Stock returned a file that is not Excel. ' + KHONG_GI.en + ' Tell the software maintainer.',
      khongCoMonMoi: 'Stock has no new dishes to add on FABi.',
      taiLaiTrang: 'The extension was just reloaded or updated. Reload the FABi page (F5), then press again. ' + KHONG_GI.en,
      loiBatNgo: 'The extension hit an unexpected error. If the Add dishes from file dialog is open, check the preview carefully before pressing Save. Tell the software maintainer.',
      moHopThoai: n => `Stock has ${n} new dishes. Opening Tiện ích (Utilities) → Thêm món từ file (Add dishes from file)…`,
      choNguoiMo: 'Could not open the dialog automatically. Press Tiện ích (Utilities) → Thêm món từ file (Add dishes from file); the extension puts the file in when the dialog shows (waits 2 minutes).',
      hetChoHopThoai: 'Two minutes passed without the Add dishes from file dialog. ' + KHONG_GI.en + ' Press again to retry.',
      xemTruoc: (n, daCo, cn) => `FABi is showing a preview of ${n} new dishes${cn ? ` from stock branch ${cn}` : ''}. Check the name, code and price on each row, then press FABi’s Lưu (Save). If FABi reports an error on a row, read it first and do not press Save.`
        + (daCo > 0 ? ` ${daCo} stock dishes are already on FABi, so they were left out.` : ''),
      chuaThayXemTruoc: 'The file was put into the dialog but FABi’s preview has not appeared. Look at the dialog: if FABi shows an error, take a screenshot for the software maintainer. No dish has been saved.',
      fabiDaLuu: 'FABi reported "Tải lên thành công" (upload done). At the till, scan one scale label of each new dish to check it shows the right dish and price.',
    },
  };

  goc.BeeftownFabi = Object.freeze({
    KHO, DUONG_TEP, DUONG_DANG_NHAP, FABI, TRANG_DANH_SACH, MA_DA_CO_TOI_DA, DIA_CHI_TOI_DA, KIEU_XLSX, TEP_TOI_DA_BYTE,
    HET_GIO_KHO_MS, CHO_MENU_MS, CHO_HOP_THOAI_MS, CHO_NGUOI_MO_MS, CHO_XEM_TRUOC_MS, THEO_DOI_LUU_MS,
    CHO_TAI_THEM_MS, LUOT_KHONG_THEM_TOI_DA, LUOT_CUON_TOI_DA,
    gon, laTrangDanhSach, locMaSo, docMaO, docTong, taoUrlTep, phanLoaiPhanHoi, cauCuaKho, laTepZip, tenTepTuHeader,
    docSoHeader, docChiNhanh, sangBase64, tuBase64, ngonNguCua, kemKhongGi, chonNgonNgu, CAU,
  });
})(globalThis);
