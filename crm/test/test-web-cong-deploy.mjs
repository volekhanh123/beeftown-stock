/**
 * BEEFTOWN — CỔNG TRƯỚC KHI DEPLOY: ĐỌC KẾT QUẢ CI
 * ===============================================
 *
 *     node test/test-web-cong-deploy.mjs
 *
 * web/kiem-tra/truoc-deploy.mjs chỉ cho deploy commit mà workflow "Kiểm thử" đã chạy xanh, và lượt
 * MỚI NHẤT quyết định (lượt đêm giờ VN đỏ thì vẫn chặn — nó bắt lỗi múi giờ mà lượt push không thấy).
 *
 * Lỗi đã gặp (07/10/2026): lượt đêm có thêm job "Quét chữ cấm trên trang đang chạy thật" — quét
 * beeftown.vn ĐANG CHẠY, tức bản deploy CŨ. Commit thêm trang mới (/thuc-don, /den-beeftown) thì
 * site cũ trả 404 cho các trang đó → job đỏ → lượt đêm đỏ → cổng chặn deploy. Mà chỉ deploy mới làm
 * job đó hết đỏ: cổng khóa vĩnh viễn mọi bản có trang mới, dù mọi job kiểm MÃ đều xanh.
 *
 * Từ nay: lượt mới nhất đỏ CHỈ vì job quét trang đang chạy thật, mọi job kiểm mã xanh → cho qua,
 * kèm cảnh báo quét lại beeftown.vn sau khi deploy. Job kiểm mã nào đỏ / hủy / quá giờ → vẫn chặn.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { xetLuotCi, JOB_QUET_TRANG_THAT } = await import(pathToFileURL(join(GOC, 'web', 'kiem-tra', 'ket-qua-ci.mjs')).href);

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — CỔNG TRƯỚC KHI DEPLOY: ĐỌC KẾT QUẢ CI');

const luot = (so, them = {}) => ({
  id: 1000 + so, run_number: so, status: 'completed', conclusion: 'success',
  event: 'push', html_url: `https://github.com/x/y/actions/runs/${1000 + so}`, ...them,
});
const job = (name, conclusion = 'success') => ({ name, conclusion, status: 'completed' });
const JOB_MA = ['Web · astro check · build · chữ cấm · trình duyệt', 'Database · kho · Zalo · Messenger · Beeftown Cân'];
const jobsLuotDem = (ketQuaQuetThat, ketQuaMa = ['success', 'success']) => [
  job(JOB_MA[0], ketQuaMa[0]), job(JOB_MA[1], ketQuaMa[1]),
  job(JOB_QUET_TRANG_THAT, ketQuaQuetThat), job('Báo PR đang mở bị trùng số migration', 'skipped'),
];
/** jobsCua giả: trả danh sách job theo id lượt; ghi lại lượt nào đã được hỏi. */
const giaJobs = bang => { const daHoi = []; const f = id => { daHoi.push(id); return id in bang ? bang[id] : null; }; f.daHoi = daHoi; return f; };

// ===========================================================================
await nhom('1 · CÁCH CŨ VẪN GIỮ: LƯỢT MỚI NHẤT QUYẾT ĐỊNH', async () => {
  ok('Chưa có lượt nào → chua-co', xetLuotCi([], giaJobs({})).kq === 'chua-co');
  ok('Lượt mới nhất xanh → xanh, không cần hỏi job', (() => {
    const j = giaJobs({}); const r = xetLuotCi([luot(84)], j);
    return r.kq === 'xanh' && r.link.endsWith('/1084') && j.daHoi.length === 0 && !r.chiTrangThatDo;
  })());
  ok('Lượt mới nhất đang chạy → dang-chay', xetLuotCi([luot(84), luot(85, { status: 'in_progress', conclusion: null })], giaJobs({})).kq === 'dang-chay');
  ok('Lượt bị hủy / bỏ qua không tính: lượt xanh trước đó quyết định',
     xetLuotCi([luot(84), luot(85, { conclusion: 'cancelled' }), luot(86, { conclusion: 'skipped' })], giaJobs({})).kq === 'xanh');
  ok('Lượt đêm đỏ vì job KIỂM MÃ (lỗi múi giờ) trên commit mà lượt push xanh → vẫn CHẶN',
     xetLuotCi([luot(84), luot(85, { event: 'schedule', conclusion: 'failure' })],
               giaJobs({ 1085: jobsLuotDem('success', ['success', 'failure']) })).kq === 'do');
});

// ===========================================================================
await nhom('2 · HỒI QUY 07/10/2026: CHỈ JOB QUÉT TRANG ĐANG CHẠY THẬT ĐỎ → CHO QUA, KÈM CẢNH BÁO', async () => {
  const j = giaJobs({ 1085: jobsLuotDem('failure') });
  const r = xetLuotCi([luot(84), luot(85, { event: 'schedule', conclusion: 'failure' })], j);
  ok('Lượt đêm đỏ chỉ vì quét beeftown.vn (site cũ 404 trang mới), mọi job kiểm mã xanh → xanh',
     r.kq === 'xanh', JSON.stringify(r));
  ok('…và đánh dấu chiTrangThatDo để cổng in cảnh báo quét lại site sau deploy', r.chiTrangThatDo === true, JSON.stringify(r));
  ok('…link là lượt mới nhất (lượt đêm), không phải lượt push cũ', r.link.endsWith('/1085'), r.link);
  ok('…chỉ hỏi job của lượt mới nhất', JSON.stringify(j.daHoi) === '[1085]', JSON.stringify(j.daHoi));
  ok('Lượt chạy tay (workflow_dispatch) cũng có job quét trang thật → cùng luật',
     xetLuotCi([luot(86, { event: 'workflow_dispatch', conclusion: 'failure' })], giaJobs({ 1086: jobsLuotDem('failure') })).kq === 'xanh');
});

// ===========================================================================
await nhom('3 · NGOÀI TRƯỜNG HỢP ĐÓ, ĐỎ VẪN LÀ CHẶN', async () => {
  const do_ = (moTa, jobs) => ok(moTa,
    xetLuotCi([luot(85, { event: 'schedule', conclusion: 'failure' })], giaJobs({ 1085: jobs })).kq === 'do');
  do_('Quét trang thật đỏ VÀ một job kiểm mã đỏ → chặn', jobsLuotDem('failure', ['failure', 'success']));
  do_('Job kiểm mã bị hủy giữa chừng (cancelled) → chặn', jobsLuotDem('failure', ['success', 'cancelled']));
  do_('Job kiểm mã quá giờ (timed_out) → chặn', jobsLuotDem('failure', ['timed_out', 'success']));
  do_('Lượt đỏ mà không có job quét trang thật nào đỏ → chặn', jobsLuotDem('success', ['success', 'failure']));
  do_('Lượt đỏ mà chỉ còn job quét trang thật, không job kiểm mã nào chạy xanh → chặn',
      [job(JOB_MA[0], 'skipped'), job(JOB_MA[1], 'skipped'), job(JOB_QUET_TRANG_THAT, 'failure')]);
  do_('Danh sách job rỗng → chặn', []);
  ok('Không hỏi được danh sách job (mất mạng, gh lỗi) → chặn, không đoán',
     xetLuotCi([luot(85, { event: 'schedule', conclusion: 'failure' })], giaJobs({})).kq === 'do');
  ok('Lượt push đỏ (không có job quét trang thật) → chặn',
     xetLuotCi([luot(85, { conclusion: 'failure' })], giaJobs({ 1085: [job(JOB_MA[0], 'failure'), job(JOB_MA[1])] })).kq === 'do');
});

// ===========================================================================
await nhom('4 · TÊN JOB TRONG CỔNG KHỚP VỚI WORKFLOW', async () => {
  const yml = readFileSync(join(GOC, '.github', 'workflows', 'kiem-thu.yml'), 'utf8');
  const m = yml.match(/\n  ([\w-]+):\n    name: ([^\n]+)\n    if: ([^\n]+)\n/g) ?? [];
  const khoi = m.map(s => /\n  ([\w-]+):\n    name: ([^\n]+)\n    if: ([^\n]+)\n/.exec(s)).find(x => x[2].trim() === JOB_QUET_TRANG_THAT);
  ok(`kiem-thu.yml có job tên đúng "${JOB_QUET_TRANG_THAT}" — đổi tên ở workflow mà quên cổng thì kiểm thử này đỏ`, !!khoi);
  ok('…job đó chỉ chạy ở lượt đêm / chạy tay (lượt push và PR không quét site thật)',
     !!khoi && /schedule/.test(khoi[3]) && /workflow_dispatch/.test(khoi[3]) && !/push|pull_request/.test(khoi[3]), khoi?.[3]);
  const cong = readFileSync(join(GOC, 'web', 'kiem-tra', 'truoc-deploy.mjs'), 'utf8');
  ok('truoc-deploy.mjs dùng xetLuotCi (không tự đọc kết quả CI theo cách riêng)', /xetLuotCi\(/.test(cong) && /ket-qua-ci\.mjs/.test(cong));
});

process.exit(ketThuc('CỔNG TRƯỚC KHI DEPLOY'));
