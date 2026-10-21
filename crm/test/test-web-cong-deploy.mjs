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
 *
 * 19/10/2026: lượt đêm của ngày main không đổi bỏ qua hai job kiểm mã (đỡ phút CI) — "lượt mới nhất" thành
 * "lượt mới nhất CÓ kiểm mã" (nhóm 5).
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { xetLuotCi, JOB_QUET_TRANG_THAT, JOB_XEM_DOI } = await import(pathToFileURL(join(GOC, 'web', 'kiem-tra', 'ket-qua-ci.mjs')).href);

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
  // Lượt đỏ mà mọi job kiểm mã bỏ qua (đêm main không đổi) không còn ở đây: nó không có tiếng nói — nhóm 5.
  do_('Danh sách job rỗng → chặn', []);
  ok('Không hỏi được danh sách job (mất mạng, gh lỗi) → chặn, không đoán',
     xetLuotCi([luot(85, { event: 'schedule', conclusion: 'failure' })], giaJobs({})).kq === 'do');
  ok('Lượt push đỏ (không có job quét trang thật) → chặn',
     xetLuotCi([luot(85, { conclusion: 'failure' })], giaJobs({ 1085: [job(JOB_MA[0], 'failure'), job(JOB_MA[1])] })).kq === 'do');
});

// ===========================================================================
await nhom('4 · TÊN JOB TRONG CỔNG KHỚP VỚI WORKFLOW', async () => {
  const yml = readFileSync(join(GOC, '.github', 'workflows', 'kiem-thu.yml'), 'utf8');
  // Mỗi job có "name:" rồi "if:" ngay dòng sau: [khóa, tên, điều kiện].
  const dsJob = [...yml.matchAll(/\n  ([\w-]+):\n    name: ([^\n]+)\n    if: ([^\n]+)\n/g)];
  const khoi = dsJob.find(x => x[2].trim() === JOB_QUET_TRANG_THAT);
  ok(`kiem-thu.yml có job tên đúng "${JOB_QUET_TRANG_THAT}" — đổi tên ở workflow mà quên cổng thì kiểm thử này đỏ`, !!khoi);
  ok('…job đó chỉ chạy ở lượt đêm / chạy tay (lượt push và PR không quét site thật)',
     !!khoi && /schedule/.test(khoi[3]) && /workflow_dispatch/.test(khoi[3]) && !/push|pull_request/.test(khoi[3]), khoi?.[3]);
  const cong = readFileSync(join(GOC, 'web', 'kiem-tra', 'truoc-deploy.mjs'), 'utf8');
  ok('truoc-deploy.mjs dùng xetLuotCi (không tự đọc kết quả CI theo cách riêng)', /xetLuotCi\(/.test(cong) && /ket-qua-ci\.mjs/.test(cong));
  const xemDoi = dsJob.find(x => x[2].trim() === JOB_XEM_DOI);
  ok(`kiem-thu.yml có job tên đúng "${JOB_XEM_DOI}" (khóa co-doi), chỉ chạy ở lượt đêm`,
     !!xemDoi && xemDoi[1] === 'co-doi' && xemDoi[3].trim() === "github.event_name == 'schedule'", xemDoi?.[3]);
  // Điều kiện của hai job kiểm mã (needs co-doi, PR nháp): test-quy-trinh.mjs.
});

// ===========================================================================
// Lượt đêm của ngày main không đổi (kiem-thu.yml, job co-doi) bỏ qua hai job kiểm mã, chỉ quét trang thật.
// Lượt đó không nói gì về commit — cổng xét lượt có kiểm mã gần nhất. Không thì: đêm sau một lần gộp chưa
// deploy, quét trang thật đỏ (trang mới còn 404 trên bản cũ) mà không job kiểm mã nào xanh → khóa deploy;
// hoặc ngược lại một lượt đêm "xanh" mà không kiểm gì che mất lượt push đỏ.
await nhom('5 · LƯỢT ĐÊM KHÔNG KIỂM MÃ (MAIN KHÔNG ĐỔI) KHÔNG CÓ TIẾNG NÓI', async () => {
  const jobsDemRong = quetThat => [
    job(JOB_XEM_DOI), job(JOB_MA[0], 'skipped'), job(JOB_MA[1], 'skipped'),
    job(JOB_QUET_TRANG_THAT, quetThat), job('Báo PR đang mở bị trùng số migration', 'skipped'),
  ];
  const dem = (so, them = {}) => luot(so, { event: 'schedule', ...them });
  const r1 = xetLuotCi([luot(84), dem(85, { conclusion: 'failure' })], giaJobs({ 1085: jobsDemRong('failure') }));
  ok('Lượt push xanh, đêm sau không kiểm mã mà quét trang thật đỏ (trang mới còn 404) → xanh theo lượt push',
     r1.kq === 'xanh' && r1.link.endsWith('/1084'), JSON.stringify(r1));
  ok('…mà vẫn nhắc quét lại site sau deploy, kèm link lượt đêm đỏ',
     r1.chiTrangThatDo === true && r1.linkQuetThat?.endsWith('/1085'), JSON.stringify(r1));
  const r1b = xetLuotCi([luot(84), dem(85)], giaJobs({ 1085: jobsDemRong('success') }));
  ok('Đêm không kiểm mã, quét trang thật xanh → xanh theo lượt push, không cảnh báo', r1b.kq === 'xanh' && !r1b.chiTrangThatDo, JSON.stringify(r1b));
  ok('Lượt push ĐỎ, đêm sau không kiểm mã và xanh → vẫn CHẶN (lượt đêm rỗng không che lượt đỏ)',
     xetLuotCi([luot(84, { conclusion: 'failure' }), dem(85)],
               giaJobs({ 1085: jobsDemRong('success'), 1084: [job(JOB_MA[0], 'failure'), job(JOB_MA[1])] })).kq === 'do');
  const r3 = xetLuotCi([luot(84), dem(85, { conclusion: 'failure' }), dem(86)],
                       giaJobs({ 1085: jobsDemRong('failure'), 1086: jobsDemRong('success') }));
  ok('Nhiều đêm liền không kiểm mã → xét tới lượt có kiểm mã gần nhất', r3.kq === 'xanh' && r3.link.endsWith('/1084'), JSON.stringify(r3));
  ok('Chỉ có lượt đêm không kiểm mã, không lượt nào trước → chua-co (tự kiểm trên máy), không bao giờ xanh',
     xetLuotCi([dem(85, { conclusion: 'failure' })], giaJobs({ 1085: jobsDemRong('failure') })).kq === 'chua-co');
  ok('Lượt đêm xanh mà không đọc được danh sách job (không biết có kiểm mã không) → xét lượt trước',
     xetLuotCi([luot(84, { conclusion: 'failure' }), dem(85)], giaJobs({ 1084: [job(JOB_MA[0], 'failure'), job(JOB_MA[1])] })).kq === 'do');
  ok('Lượt đêm CÓ kiểm mã (main vừa đổi, đêm Chủ nhật) vẫn quyết định như cũ: job kiểm mã đỏ → chặn',
     xetLuotCi([luot(84), dem(85, { conclusion: 'failure' })],
               giaJobs({ 1085: [job(JOB_XEM_DOI), job(JOB_MA[0], 'failure'), job(JOB_MA[1]), job(JOB_QUET_TRANG_THAT)] })).kq === 'do');
  const r7 = xetLuotCi([luot(84), dem(85, { conclusion: 'failure' })],
                       giaJobs({ 1085: [job(JOB_XEM_DOI), job(JOB_MA[0]), job(JOB_MA[1]), job(JOB_QUET_TRANG_THAT, 'failure')] }));
  ok('Job xem đổi không phải job kiểm mã: lượt đêm có kiểm mã xanh, đỏ chỉ vì quét trang thật → cho qua kèm cảnh báo',
     r7.kq === 'xanh' && r7.chiTrangThatDo === true && r7.link.endsWith('/1085'), JSON.stringify(r7));
  const r8 = xetLuotCi([dem(85, { conclusion: 'failure' })],
                       giaJobs({ 1085: [job(JOB_XEM_DOI, 'failure'), job(JOB_MA[0]), job(JOB_MA[1]), job(JOB_QUET_TRANG_THAT)] }));
  ok('Job xem đổi hỏng (hết giờ, máy chạy lỗi) mà mọi job kiểm mã chạy xanh → cho qua, không khóa deploy',
     r8.kq === 'xanh' && !r8.chiTrangThatDo, JSON.stringify(r8));
  ok('Chỉ lượt ĐÊM mới được bỏ qua: lượt chạy tay đỏ mà mọi job kiểm mã bỏ qua → vẫn CHẶN',
     xetLuotCi([luot(84), luot(85, { event: 'workflow_dispatch', conclusion: 'failure' })],
               giaJobs({ 1085: [job(JOB_MA[0], 'skipped'), job(JOB_MA[1], 'skipped'), job(JOB_QUET_TRANG_THAT, 'failure')] })).kq === 'do');
});

process.exit(ketThuc('CỔNG TRƯỚC KHI DEPLOY'));
