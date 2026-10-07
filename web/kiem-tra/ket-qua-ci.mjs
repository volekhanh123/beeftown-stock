/**
 * ĐỌC KẾT QUẢ CI CHO CỔNG DEPLOY
 * ==============================
 *
 * Tách khỏi truoc-deploy.mjs để kiểm thử được (crm/test/test-web-cong-deploy.mjs) — file đó chạy
 * thẳng từ trên xuống và thoát tiến trình, không gọi riêng được từng phần.
 *
 * LƯỢT MỚI NHẤT quyết định (bỏ lượt bị hủy vì có lượt sau thay): lượt đêm giờ VN đỏ trên cùng commit
 * mà push trước đó xanh thì vẫn là đỏ — lượt đêm chạy chính để bắt lỗi múi giờ mà lượt kia không thấy.
 *
 * TRỪ MỘT JOB: "Quét chữ cấm trên trang đang chạy thật" (chỉ có ở lượt đêm và lượt chạy tay). Nó quét
 * beeftown.vn ĐANG CHẠY — bản deploy CŨ — chứ không quét commit sắp deploy. Commit thêm trang mới thì
 * site cũ trả 404 cho trang đó, job đỏ, và chỉ deploy mới làm nó hết đỏ: cổng chặn vì job này là khóa
 * chết (07/10/2026: /thuc-don, /den-beeftown, /en/menu… 404 trên bản 05/10). Nên lượt đỏ CHỈ vì job này,
 * còn mọi job kiểm mã xanh, thì cho qua kèm cảnh báo quét lại site thật sau khi deploy. Job kiểm mã
 * nào đỏ / bị hủy / quá giờ, hay không đọc được danh sách job → vẫn chặn.
 */

/** Phải trùng `name:` của job quet-trang-that trong .github/workflows/kiem-thu.yml (kiểm thử canh). */
export const JOB_QUET_TRANG_THAT = 'Quét chữ cấm trên trang đang chạy thật';

/**
 * @param luot     workflow_runs của commit (GitHub API)
 * @param jobsCua  (idLuot) => danh sách job của lượt, hoặc null khi không hỏi được
 * @returns { kq: 'xanh' | 'do' | 'dang-chay' | 'chua-co', link?, ly_do?, chiTrangThatDo? }
 */
export function xetLuotCi(luot, jobsCua) {
  const conTinh = (luot ?? [])
    .filter(l => l.conclusion !== 'cancelled' && l.conclusion !== 'skipped')
    .sort((a, b) => b.run_number - a.run_number);
  if (!conTinh.length) return { kq: 'chua-co' };
  const moiNhat = conTinh[0];
  const link = moiNhat.html_url;
  if (moiNhat.status !== 'completed') return { kq: 'dang-chay', link };
  if (moiNhat.conclusion === 'success') return { kq: 'xanh', link };

  const jobs = jobsCua(moiNhat.id);
  if (!Array.isArray(jobs)) {
    return { kq: 'do', link, ly_do: `${moiNhat.conclusion}; không đọc được danh sách job để biết job nào đỏ` };
  }
  const quetThat = jobs.filter(j => j.name === JOB_QUET_TRANG_THAT);
  const kiemMa = jobs.filter(j => j.name !== JOB_QUET_TRANG_THAT);
  const chiTrangThatDo =
    quetThat.some(j => j.conclusion === 'failure') &&
    kiemMa.some(j => j.conclusion === 'success') &&
    kiemMa.every(j => j.conclusion === 'success' || j.conclusion === 'skipped');
  if (chiTrangThatDo) return { kq: 'xanh', link, chiTrangThatDo: true };

  const jobDo = jobs.filter(j => j.conclusion !== 'success' && j.conclusion !== 'skipped').map(j => j.name);
  return { kq: 'do', link, ly_do: jobDo.length ? `${moiNhat.conclusion}: ${jobDo.join(', ')}` : moiNhat.conclusion };
}
