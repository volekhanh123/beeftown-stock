/**
 * BEEFTOWN — QUY TRÌNH: TÍNH NĂNG MỚI PHẢI KÈM KIỂM THỬ
 * =====================================================
 *
 *     node test/test-quy-trinh.mjs
 *
 * Những quy tắc trong CLAUDE.md mà máy kiểm được thì kiểm ở đây, để quy trình
 * không phụ thuộc vào trí nhớ của người (hay phiên Claude) làm tính năng tiếp theo:
 *
 *   1. Mọi hàm SQL trong schema public phải được ít nhất một file kiểm thử nhắc
 *      tên. 17 hàm có từ trước quy tắc này nằm trong CHUA_CO_TEST — danh sách
 *      chỉ được NGẮN ĐI: viết test cho hàm nào thì xoá tên hàm đó khỏi danh sách.
 *   2. Không file mã nguồn nào bị .gitignore chặn âm thầm. .gitignore của repo
 *      "chặn hết rồi mở từng cái" — file mới quên mở chỉ tồn tại trên máy người
 *      viết; CI và máy khác không bao giờ thấy nó.
 *   3. Các file của quy trình (CLAUDE.md, workflow CI, mẫu PR, mẫu báo lỗi) có
 *      mặt và không bị .gitignore chặn; workflow vẫn chạy đủ các bước.
 *   4. CLAUDE.md và mẫu PR cùng liệt kê đủ 9 mục "định nghĩa xong".
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem } from './kho-chung.mjs';

const THU_MUC = dirname(fileURLToPath(import.meta.url));
const GOC = join(THU_MUC, '..', '..');
const git = args => execFileSync('git', args, { cwd: GOC, encoding: 'utf8' });

/** Hàm có từ trước quy tắc 1 mà chưa file test nào nhắc tên. CHỈ ĐƯỢC XOÁ BỚT, không thêm. */
const CHUA_CO_TEST = [
  'chuan_ban_dich', 'don_dep_phieu_tai_len', 'ghi_so_ban_dich', 'khach_hang_chuan_hoa_sdt',
  'khung_gio_trong_ngay', 'la_chu_so_huu', 'la_van_ban_tam', 'mon_an_kiem_tra_nhom',
  'nhan_su_hien_tai', 'nhat_ky_ho_so_chan_sua_xoa', 'noi_dung_cong_bo_kiem_tra', 'sdt_hop_le',
  'so_cai_diem_chan_sua_xoa', 'so_cai_diem_tinh_so_du', 'tep_anh_kiem_tra_cong_bo',
  'tu_dong_cap_nhat_updated_at', 'vi_tri_kiem_tra',
];

/** 9 mục "định nghĩa xong" — mỗi mục ứng với một nhóm lỗi đã thật sự xảy ra (xem CLAUDE.md). */
export const MUC_XONG = [
  'quyen', 'bam-hai-lan', 'gio-vn', 'chu-va-so', 'mat-mang', 'ton-kho', 'cau-chu', 'migration', 'dich-vu-ngoai',
];

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — QUY TRÌNH: TÍNH NĂNG MỚI PHẢI KÈM KIỂM THỬ');

// ===========================================================================
await nhom('1 · MỌI HÀM SQL ĐỀU CÓ KIỂM THỬ NHẮC TÊN', async () => {
  const { db } = await dungDatabase();
  const { rows } = await db.query(`
    select distinct p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' order by 1`);
  const ten = rows.map(r => r.proname);
  ok('Đọc được danh sách hàm', ten.length > 300, `${ten.length} hàm`);

  // Nguồn: mọi file test trừ chính file này (danh sách miễn ở trên không được tính là "đã nhắc").
  const nguon = [
    ...readdirSync(THU_MUC).filter(f => f.endsWith('.mjs') && f !== 'test-quy-trinh.mjs')
      .map(f => readFileSync(join(THU_MUC, f), 'utf8')),
    ...readdirSync(join(GOC, 'can-app', 'test')).filter(f => f.endsWith('.ts'))
      .map(f => readFileSync(join(GOC, 'can-app', 'test', f), 'utf8')),
  ].join('\n');
  const nhac = h => new RegExp(`\\b${h}\\b`).test(nguon);

  const mien = new Set(CHUA_CO_TEST);
  const thieu = ten.filter(h => !mien.has(h) && !nhac(h));
  ok('Hàm mới nào cũng được ít nhất một file test nhắc tên', thieu.length === 0,
     thieu.length ? `${thieu.join(', ')} — viết kiểm thử cho hàm này (tên hàm phải xuất hiện trong file test)` : '');

  const daCo = CHUA_CO_TEST.filter(nhac);
  ok('Danh sách miễn không còn hàm đã có test', daCo.length === 0,
     daCo.length ? `${daCo.join(', ')} đã có test — xoá khỏi CHUA_CO_TEST` : '');

  const daXoa = CHUA_CO_TEST.filter(h => !ten.includes(h));
  ok('Danh sách miễn không còn hàm đã bị xoá khỏi database', daXoa.length === 0,
     daXoa.length ? `${daXoa.join(', ')} — xoá khỏi CHUA_CO_TEST` : '');
});

// ===========================================================================
await nhom('2 · KHÔNG FILE MÃ NGUỒN NÀO BỊ .gitignore CHẶN ÂM THẦM', async () => {
  // Chỉ những chỗ chứa mã nguồn. Chỗ khác bị chặn là CÓ Ý (tài liệu mật, ảnh, .env, file cân .TMS).
  const CHO_MA = /^(web\/(src|kiem-tra)\/|crm\/(test|supabase)\/|can-app\/(src|test|scripts)\/|\.github\/|CLAUDE\.md$)/;
  const DUOI_MA = /\.(ts|tsx|mjs|js|astro|sql|ya?ml|md|json|css|html|ps1)$/;
  // --directory: thư mục bị chặn cả khối (node_modules, dist) hiện một dòng "thư mục/" thay vì từng file.
  const biChan = git(['ls-files', '--others', '--ignored', '--exclude-standard', '--directory'])
    .split('\n').filter(f => CHO_MA.test(f) && (DUOI_MA.test(f) || f.endsWith('/')) && !/node_modules\//.test(f));
  ok('Mọi file mã nguồn đều được git thấy', biChan.length === 0,
     biChan.length ? `${biChan.slice(0, 8).join(', ')} — thêm một dòng !đường-dẫn vào mục ĐƯỢC PHÉP của .gitignore` : '');
});

// ===========================================================================
await nhom('3 · FILE CỦA QUY TRÌNH CÓ MẶT VÀ ĐƯỢC GIT THEO DÕI', async () => {
  const CAN = [
    'CLAUDE.md',
    '.github/workflows/kiem-thu.yml',
    '.github/workflows/gac-nhanh.yml',
    '.github/pull_request_template.md',
    '.github/ISSUE_TEMPLATE/bao-loi.yml',
  ];
  for (const f of CAN) {
    let biChan = false;
    try { git(['check-ignore', '-q', f]); biChan = true; } catch { /* mã 1 = không bị chặn */ }
    ok(`${f} có mặt và không bị .gitignore chặn`, existsSync(join(GOC, f)) && !biChan,
       !existsSync(join(GOC, f)) ? 'không có file' : biChan ? 'bị .gitignore chặn' : '');
  }

  const yml = existsSync(join(GOC, '.github/workflows/kiem-thu.yml'))
    ? readFileSync(join(GOC, '.github/workflows/kiem-thu.yml'), 'utf8') : '';
  const BUOC = [
    ['gác số migration', /kiem-migration\.mjs/],
    ['toàn bộ kiểm thử database', /chay-tat-ca\.mjs --tat-ca/],
    ['kiểm thử Beeftown Cân', /bun test\/thu\.ts/],
    ['astro check', /astro check/],
    ['build', /astro build/],
    ['quét chữ cấm', /npm run quet/],
    ['kiểm thử trình duyệt', /npm run thu-trinh-duyet/],
    ['lượt đêm giờ Việt Nam', /cron: '30 17 \* \* \*'/],
  ];
  const thieu = BUOC.filter(([, m]) => !m.test(yml)).map(([t]) => t);
  ok('Workflow kiểm thử còn đủ các bước', thieu.length === 0, `thiếu: ${thieu.join(', ')}`);

  const pkg = JSON.parse(readFileSync(join(GOC, 'crm', 'package.json'), 'utf8'));
  ok('npm test chạy bằng chay-tat-ca.mjs (file test mới tự được chạy)', /chay-tat-ca\.mjs/.test(pkg.scripts?.test ?? ''),
     pkg.scripts?.test);
});

// ===========================================================================
await nhom('4 · CLAUDE.md VÀ MẪU PR CÙNG 9 MỤC "ĐỊNH NGHĨA XONG"', async () => {
  const doc = f => existsSync(join(GOC, f)) ? readFileSync(join(GOC, f), 'utf8') : '';
  for (const f of ['CLAUDE.md', '.github/pull_request_template.md']) {
    const s = doc(f);
    const thieu = MUC_XONG.filter(m => !s.includes('`' + m + '`'));
    ok(`${f} có đủ ${MUC_XONG.length} mục`, thieu.length === 0, `thiếu: ${thieu.join(', ')}`);
  }
});

process.exit(ketThuc('QUY TRÌNH'));
