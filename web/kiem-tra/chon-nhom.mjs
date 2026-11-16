/**
 * CHỈ CHẠY VÀI NHÓM CỦA MỘT BỘ THỬ TRÌNH DUYỆT — `--chi 5,7`
 * =========================================================
 *
 *     npm run thu-trinh-duyet -- --khong-build --chi 5,7   ← chỉ nhóm 5 và 7
 *     npm run thu-day-du -- --chi 12                       ← chỉ nhóm 12 (nhóm 0 luôn chạy)
 *
 * Dùng chung cho trinh-duyet.mjs và thu-day-du.mjs: sửa nhanh một chỗ thì chạy riêng nhóm đó, khỏi chờ cả bộ. CI chạy
 * hết — kiem-thu.yml và lệnh npm của web không truyền --chi (crm/test/test-web-chon-nhom.mjs giữ).
 *
 * Gõ sai thì đỏ, không bao giờ đạt suông ("TẤT CẢ 0 KIỂM TRA ĐỀU ĐẠT" khi không nhóm nào khớp):
 *   · --chi thiếu số, có mục không phải số, hay ghi hai lần → `loi`: bộ thử in lỗi và dừng trước khi bật máy chủ.
 *   · số không ứng với nhóm nào đã chạy (gõ nhầm, nhóm bị --url bỏ qua) → baoNhomThieu(ok, lyDo) ở cuối bộ thử in
 *     một dòng ✗ cho từng số đó.
 * Dòng tổng của một lần chạy một phần mang `ghiChu` — dán kết quả vào mô tả PR không bị đọc nhầm thành cả bộ đã đạt.
 */

/**
 * @param {string[]} argv process.argv của bộ thử
 * @param {{ luonChay?: string[] }} [tuyChon] số của các nhóm chạy cả khi không được chọn (thu-day-du: nhóm 0)
 */
export function taoChonNhom(argv, { luonChay = [] } = {}) {
  const laChi = t => t === '--chi' || t.startsWith('--chi=');
  const i = argv.findIndex(laChi);
  if (i < 0) return { loi: null, ghiChu: '', chay: () => true, khongCo: () => [], baoNhomThieu() {} };
  const giaTri = argv[i] === '--chi' ? (argv[i + 1] ?? '') : argv[i].slice('--chi='.length);
  const muc = giaTri.startsWith('--') ? [] : giaTri.split(',').map(s => s.trim()).filter(Boolean);
  const loi = argv.filter(laChi).length > 1 ? '--chi chỉ ghi một lần — gộp các nhóm lại, ví dụ --chi 5,7'
    : !muc.length ? `--chi cần danh sách số nhóm, ví dụ --chi 5,7 — thấy «${giaTri}»`
    : muc.some(m => !/^\d+$/.test(m)) ? `--chi chỉ nhận số nhóm cách nhau bằng dấu phẩy, ví dụ --chi 5,7 — thấy «${giaTri}»`
    : null;
  // "05" và "5" là một nhóm.
  const theoSo = [...new Set(loi ? [] : muc.map(m => String(Number(m))))].sort((a, b) => a - b);
  const chi = new Set(theoSo);
  const daChay = new Set();
  const khongCo = () => theoSo.filter(so => !daChay.has(so));
  return {
    loi,
    ghiChu: ` — chỉ nhóm ${theoSo.join(', ')}${luonChay.length ? ` (và nhóm luôn chạy ${luonChay.join(', ')})` : ''}, chạy bằng --chi: không phải cả bộ`,
    /** Nhóm tên `ten` ("5 · …") có chạy không. Ghi lại số của nhóm được chạy cho khongCo(). */
    chay(ten) {
      const so = /^(\d+)/.exec(ten)?.[1];
      const co = so !== undefined && (chi.has(so) || luonChay.includes(so));
      if (co) daChay.add(so);
      return co;
    },
    /** Số đã xin mà không nhóm nào mang số đó được chạy: gõ nhầm, hay nhóm bị bộ thử bỏ qua (--url, thiếu --chup). */
    khongCo,
    /**
     * Gọi ở cuối bộ thử, trước dòng tổng: mỗi số trong khongCo() một dòng ✗ qua ok() của bộ thử.
     * @param {(ten: string, dieuKien: boolean, chiTiet?: string) => unknown} ok
     * @param {string} lyDo vì sao một nhóm có thật mà không chạy ở bộ thử này, ví dụ "nhóm bị --url bỏ qua"
     */
    baoNhomThieu(ok, lyDo) {
      for (const so of khongCo()) ok(`--chi: nhóm ${so} được chạy`, false, `không nhóm nào mang số này được chạy — gõ nhầm số, hay ${lyDo}`);
    },
  };
}
