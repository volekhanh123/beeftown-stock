/**
 * BEEFTOWN — MỞ RỘNG FABi: SERVICE WORKER (nền)
 *
 * Việc duy nhất: lấy file nhập món của kho (https://beeftown.vn/noi-bo/kho/ban-ipos/mon-fabi.xlsx?da_co=…) bằng phiên
 * đăng nhập kho sẵn có trên trình duyệt, trả về cho trang FABi. Phải lấy ở đây chứ không ở trang FABi: fetch của
 * content script đi theo nguồn của trang (fabi.ipos.vn) nên kho từ chối vì khác nguồn; service worker có quyền
 * host beeftown.vn (manifest.json) nên gửi kèm cookie phiên kho (SameSite=Lax — đã thử trên Chromium thật,
 * mo-rong-fabi/thu/thu-trinh-duyet.mjs). Theo chuyển hướng rồi xét địa chỉ cuối: về /noi-bo/dang-nhap là chưa đăng
 * nhập; về trang khác (màn máy, màn khóa máy dùng chung) là đã đăng nhập nhưng không phải tài khoản tải được file.
 *
 * Chỉ nghe tin của chính extension gửi từ trang fabi.ipos.vn (không externally_connectable: trang web khác không
 * gửi được). Không ghi gì, không lưu gì: mỗi lần bấm là một lần GET. Mọi lỗi trả về thành một loại để trang nói
 * đúng câu — không bao giờ ném lỗi ra ngoài, không bao giờ báo đã xong khi chưa có file.
 */
/* global importScripts, chrome */
importScripts('chung.js');

const B = globalThis.BeeftownFabi;

chrome.runtime.onMessage.addListener((tin, nguoiGui, traLoi) => {
  if (nguoiGui.id !== chrome.runtime.id || !tuTrangFabi(nguoiGui.url)) return false;
  if (!tin || tin.loai !== 'lay-tep-mon-moi') return false;
  layTepMonMoi(tin.daCo).then(traLoi, () => traLoi({ kieu: 'loi_kho', status: 0 }));
  return true; // trả lời sau (bất đồng bộ)
});

function tuTrangFabi(url) {
  try { return new URL(url).origin === B.FABI; } catch { return false; }
}

/**
 * Lấy file món mới. Kết quả (JSON, đi qua tin nhắn):
 *   { kieu: 'tep', base64, tenTep, soMon, soDaCo, chiNhanh } · { kieu: 'khong_co_mon_moi', cau } · { kieu: 'chua_dang_nhap' }
 *   · { kieu: 'chuyen_trang' } · { kieu: 'khong_quyen' | 'sai_yeu_cau' | 'loi_kho', status, cau } · { kieu: 'mat_mang' }
 *   · { kieu: 'qua_nhieu_ma' } (quá MA_DA_CO_TOI_DA mã hoặc địa chỉ quá DIA_CHI_TOI_DA ký tự — không cắt bớt)
 *   · { kieu: 'tep_la' } (kho trả 200 kiểu .xlsx mà nội dung không phải zip, hoặc quá lớn).
 */
async function layTepMonMoi(daCo) {
  const ma = B.locMaSo(Array.isArray(daCo) ? daCo : []);
  const diaChi = B.taoUrlTep(ma);
  if (ma.length > B.MA_DA_CO_TOI_DA || diaChi.length > B.DIA_CHI_TOI_DA) return { kieu: 'qua_nhieu_ma' };
  let phanHoi;
  try {
    phanHoi = await fetch(diaChi, {
      credentials: 'include', redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(B.HET_GIO_KHO_MS),
    });
  } catch {
    return { kieu: 'mat_mang' };
  }
  const kieuNoiDung = phanHoi.headers.get('content-type') ?? '';
  const kieu = B.phanLoaiPhanHoi({
    type: phanHoi.type, status: phanHoi.status, kieuNoiDung, url: phanHoi.url, redirected: phanHoi.redirected,
  });
  try {
    if (kieu === 'chua_dang_nhap' || kieu === 'chuyen_trang') return { kieu };
    if (kieu === 'tep') {
      const bytes = new Uint8Array(await phanHoi.arrayBuffer());
      if (!B.laTepZip(bytes) || bytes.length > B.TEP_TOI_DA_BYTE) return { kieu: 'tep_la' };
      return {
        kieu, base64: B.sangBase64(bytes), tenTep: B.tenTepTuHeader(phanHoi.headers.get('content-disposition')),
        soMon: B.docSoHeader(phanHoi.headers.get('x-so-mon')), soDaCo: B.docSoHeader(phanHoi.headers.get('x-so-da-co')),
        chiNhanh: B.docChiNhanh(phanHoi.headers.get('x-chi-nhanh')),
      };
    }
    const cau = B.cauCuaKho(kieuNoiDung, await phanHoi.text());
    if (kieu === 'khong_co_mon_moi') return { kieu, cau, soDaCo: B.docSoHeader(phanHoi.headers.get('x-so-da-co')) };
    return { kieu, status: phanHoi.status, cau };
  } catch {
    // Đứt mạng giữa lúc đọc thân phản hồi: không có file trọn vẹn.
    return { kieu: 'mat_mang' };
  }
}
