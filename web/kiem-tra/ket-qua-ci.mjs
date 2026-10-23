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
 *
 * LƯỢT ĐÊM KHÔNG KIỂM MÃ (19/10/2026): đêm main không đổi (trừ đêm Chủ nhật, đầu / cuối tháng), job "Lượt
 * đêm có cần kiểm mã không" cho hai job kiểm mã bỏ qua, chỉ còn quét trang thật — đỡ ~14 phút CI mỗi đêm. Lượt
 * đó không nói gì về commit nên bị bỏ qua, xét lượt trước nó; quét trang thật của nó đỏ thì vẫn mang theo
 * cảnh báo (chiTrangThatDo + linkQuetThat). Không bỏ qua thì: đêm sau một lần gộp chưa deploy, quét trang thật
 * đỏ (trang mới 404 trên bản cũ) mà không job kiểm mã nào xanh → khóa deploy; hoặc lượt đêm "xanh" mà không
 * kiểm gì che mất lượt push đỏ. Lượt đêm xanh mà không đọc được job (không biết có kiểm mã không) cũng bỏ qua;
 * lượt đỏ không đọc được job → vẫn chặn. Job xem đổi đó không phải job kiểm mã: nó hỏng (đã continue-on-error)
 * không làm chặn commit có mọi job kiểm mã xanh.
 */

/** Phải trùng `name:` của job quet-trang-that trong .github/workflows/kiem-thu.yml (kiểm thử canh). */
export const JOB_QUET_TRANG_THAT = 'Quét chữ cấm trên trang đang chạy thật';
/** Phải trùng `name:` của job co-doi trong kiem-thu.yml (kiểm thử canh). Job này không kiểm mã. */
export const JOB_XEM_DOI = 'Lượt đêm có cần kiểm mã không';

const laJobKiemMa = j => j.name !== JOB_QUET_TRANG_THAT && j.name !== JOB_XEM_DOI;
/** Có job kiểm mã và job nào cũng bỏ qua. Danh sách rỗng KHÔNG tính — lượt đỏ đó vẫn chặn. */
const khongKiemMa = jobs => {
  const ma = jobs.filter(laJobKiemMa);
  return ma.length > 0 && ma.every(j => j.conclusion === 'skipped');
};

/**
 * @param luot     workflow_runs của commit (GitHub API)
 * @param jobsCua  (idLuot) => danh sách job của lượt, hoặc null khi không hỏi được
 * @returns { kq: 'xanh' | 'do' | 'dang-chay' | 'chua-co', link?, ly_do?, chiTrangThatDo?, linkQuetThat? }
 */
export function xetLuotCi(luot, jobsCua) {
  const conTinh = (luot ?? [])
    .filter(l => l.conclusion !== 'cancelled' && l.conclusion !== 'skipped')
    .sort((a, b) => b.run_number - a.run_number);
  // Lượt đêm mới nhất bị bỏ qua mà quét trang thật đỏ: cổng vẫn phải nhắc quét lại site sau deploy.
  let linkQuetThat = null;
  const xanh = (link, quetDo) => (quetDo || linkQuetThat)
    ? { kq: 'xanh', link, chiTrangThatDo: true, linkQuetThat: linkQuetThat ?? link }
    : { kq: 'xanh', link };
  const quetDo = jobs => jobs.some(j => j.name === JOB_QUET_TRANG_THAT && j.conclusion === 'failure');
  for (const l of conTinh) {
    const link = l.html_url;
    if (l.status !== 'completed') return { kq: 'dang-chay', link };
    // Chỉ lượt đêm mới có thể không kiểm mã: hỏi job của nó (một lần), lượt push xanh thì không cần hỏi.
    const laDem = l.event === 'schedule';
    const jobsDem = laDem ? jobsCua(l.id) : undefined;
    if (laDem && (Array.isArray(jobsDem) ? khongKiemMa(jobsDem) : l.conclusion === 'success')) {
      if (Array.isArray(jobsDem) && quetDo(jobsDem) && !linkQuetThat) linkQuetThat = link;
      continue;
    }
    if (l.conclusion === 'success') return xanh(link, false);

    const jobs = laDem ? jobsDem : jobsCua(l.id);
    if (!Array.isArray(jobs)) {
      return { kq: 'do', link, ly_do: `${l.conclusion}; không đọc được danh sách job để biết job nào đỏ` };
    }
    // Đỏ chỉ vì job không kiểm mã (quét trang thật, xem đổi) mà mọi job kiểm mã xanh → cho qua.
    const kiemMa = jobs.filter(laJobKiemMa);
    const kiemMaXanh =
      kiemMa.some(j => j.conclusion === 'success') &&
      kiemMa.every(j => j.conclusion === 'success' || j.conclusion === 'skipped');
    if (kiemMaXanh) return xanh(link, quetDo(jobs));

    const jobDo = kiemMa.filter(j => j.conclusion !== 'success' && j.conclusion !== 'skipped').map(j => j.name);
    return { kq: 'do', link, ly_do: jobDo.length ? `${l.conclusion}: ${jobDo.join(', ')}` : l.conclusion };
  }
  return { kq: 'chua-co' };
}
