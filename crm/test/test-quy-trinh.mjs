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
  'nhat_ky_ho_so_chan_sua_xoa', 'noi_dung_cong_bo_kiem_tra', 'sdt_hop_le',
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
  // web/cong-cu/: script dựng tài sản thương hiệu và ảnh (Python) — .gitignore mở riêng đuôi .py ở đó.
  // .claude/skills/: skill dùng chung — .gitignore mở từng skill, nên skill mới bị chặn tới khi có dòng mở.
  const CHO_MA = /^(web\/(src|kiem-tra|cong-cu)\/|crm\/(test|supabase|sao-luu)\/|can-app\/(src|test|scripts)\/|\.github\/|\.claude\/skills\/|CLAUDE\.md$)/;
  const DUOI_MA = /\.(ts|tsx|mjs|js|astro|sql|ya?ml|md|json|css|html|ps1|sh|py)$/;
  // --directory: thư mục bị chặn cả khối (node_modules, dist, ảnh lỗi) hiện một dòng "thư mục/" thay vì từng
  // file. Thư mục bị chặn chỉ đáng ngờ khi nằm trong chỗ CHỈ chứa mã nguồn — web/kiem-tra/anh-loi/ hay
  // crm/supabase/.temp/ là cố ý chặn.
  const THU_MUC_MA = /^(web\/src|crm\/test|crm\/sao-luu|crm\/supabase\/(migrations|thu)|can-app\/(src|test|scripts)|\.github|\.claude\/skills)\//;
  const biChan = git(['ls-files', '--others', '--ignored', '--exclude-standard', '--directory'])
    .split('\n').filter(f => (f.endsWith('/') ? THU_MUC_MA.test(f) : CHO_MA.test(f) && DUOI_MA.test(f)) && !/node_modules\//.test(f));
  const coSkill = biChan.some(f => f.startsWith('.claude/'));
  ok('Mọi file mã nguồn đều được git thấy', biChan.length === 0,
     biChan.length ? `${biChan.slice(0, 8).join(', ')} — thêm một dòng !đường-dẫn vào mục ĐƯỢC PHÉP của .gitignore`
       + (coSkill ? ' (skill dùng chung: mở cạnh dòng thiet-ke-beeftown; skill riêng của máy: chuyển sang ~/.claude/skills/)' : '') : '');
});

// ===========================================================================
await nhom('3 · FILE CỦA QUY TRÌNH CÓ MẶT VÀ ĐƯỢC GIT THEO DÕI', async () => {
  const CAN = [
    'CLAUDE.md',
    '.github/workflows/kiem-thu.yml',
    '.github/workflows/gac-nhanh.yml',
    '.github/workflows/dong-goi-can.yml',
    '.github/workflows/sao-luu.yml',
    'crm/sao-luu/sao-luu.sh',
    'crm/sao-luu/khoi-phuc.sh',
    'crm/sao-luu/dem-dong.sh',
    'crm/sao-luu/ghi-luot.sql',
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
    ['kiểm thử trình duyệt khi đã nối database (Supabase giả)', /npm run thu-day-du/],
    ['lượt đêm giờ Việt Nam', /cron: '30 17 \* \* \*'/],
  ];
  const thieu = BUOC.filter(([, m]) => !m.test(yml)).map(([t]) => t);
  ok('Workflow kiểm thử còn đủ các bước', thieu.length === 0, `thiếu: ${thieu.join(', ')}`);

  // Đóng gói Beeftown Cân: file .exe tải từ GitHub về máy quầy. Kiểm thử phải chạy TRƯỚC — đóng gói bản hỏng
  // rồi đưa lên Releases là đưa bản hỏng ra quán. Tên artifact và Release lấy từ dòng PHIEN_BAN của main.ts.
  const goi = existsSync(join(GOC, '.github/workflows/dong-goi-can.yml'))
    ? readFileSync(join(GOC, '.github/workflows/dong-goi-can.yml'), 'utf8') : '';
  // Tìm trên dòng "run:", không phải chữ bất kỳ — chú thích nhắc tên lệnh không được làm lệch thứ tự.
  const viTriThu = goi.search(/run: npx bun test\/thu\.ts/), viTriGoi = goi.search(/run: npx bun scripts\/dong-goi\.ts/);
  ok('Workflow đóng gói Beeftown Cân chạy kiểm thử TRƯỚC khi đóng gói', viTriThu >= 0 && viTriGoi > viTriThu,
     viTriThu < 0 ? 'không thấy run: npx bun test/thu.ts' : viTriGoi < 0 ? 'không thấy run: npx bun scripts/dong-goi.ts' : 'đóng gói đứng trước kiểm thử');
  // .exe gói cả mã dùng chung trong web/src/lib — đổi ở đó cũng phải đóng gói lại (main) và đóng gói thử (PR).
  const duongDan = khoi => (goi.match(new RegExp(`\\n  ${khoi}:\\n(?:    .*\\n)*?    paths:.*\\n((?:      - .*\\n)+)`))?.[1] ?? '');
  const BUOC_GOI = [
    ['main đổi can-app/', duongDan('push').includes("'can-app/**'") && /\n  push:\n    branches: \[main\]\n/.test(goi)],
    ['main đổi web/src/lib/', duongDan('push').includes("'web/src/lib/**'")],
    ['PR đổi can-app/, web/src/lib/', duongDan('pull_request').includes("'can-app/**'") && duongDan('pull_request').includes("'web/src/lib/**'")],
    ['chạy tay (Run workflow)', /\n  workflow_dispatch:\n/.test(goi)],
    ['tải lên thành artifact', /uses: actions\/upload-artifact@/.test(goi)],
  ];
  const thieuGoi = BUOC_GOI.filter(([, co]) => !co).map(([t]) => t);
  ok('Workflow đóng gói Beeftown Cân còn đủ các bước', thieuGoi.length === 0, `thiếu: ${thieuGoi.join(', ')}`);
  // Job phat-hanh có quyền ghi (tạo Release, xoá artifact). Lượt "bản thử PR" chạy mã chưa gộp trong job dong-goi,
  // nên điều kiện mở job phat-hanh chỉ được đọc từ ngữ cảnh GitHub — không từ needs.* / steps.* (mã chưa gộp ghi được) —
  // và phải trùng khít CHINH_THUC của job dong-goi, nếu không tên artifact và việc tạo Release lệch nhau.
  const chinhThuc = goi.match(/\n      CHINH_THUC: \$\{\{ (.+) \}\}\n/)?.[1];
  const moPhatHanh = goi.match(/\n  phat-hanh:\n(?:    .*\n|\s*\n)*?    if: (.+)\n/)?.[1];
  ok('Job phat-hanh (quyền ghi) chỉ mở cho bản chính thức, theo điều kiện đọc thẳng từ GitHub',
     !!chinhThuc && moPhatHanh === chinhThuc && !/needs\.|steps\./.test(moPhatHanh)
       && ["github.ref == 'refs/heads/main'", "github.event_name != 'pull_request'", "inputs.so_pr == ''"].every(d => moPhatHanh.includes(d)),
     `CHINH_THUC: ${chinhThuc} · if của phat-hanh: ${moPhatHanh}`);
  const dongPhienBan = readFileSync(join(GOC, 'can-app', 'src', 'main.ts'), 'utf8').match(/^const PHIEN_BAN = '\d+\.\d+\.\d+';/gm) ?? [];
  ok('can-app/src/main.ts có đúng một dòng PHIEN_BAN mà workflow đóng gói đọc được', dongPhienBan.length === 1,
     `${dongPhienBan.length} dòng — cần đúng một dòng dạng  const PHIEN_BAN = '2.1.0';  (tên artifact, Release lấy từ đây)`);

  // 2.5 — bản cài công khai cho nút "Cập nhật": token là secret DUY NHẤT của workflow đóng gói, chỉ ở env của một bước
  // trong job phat-hanh (không bao giờ ở job dong-goi — lượt bản thử PR chạy mã chưa gộp ở đó). Thiếu secret thì chỉ cảnh
  // báo, không làm hỏng Release riêng. Tên kho công khai ở workflow và ở can-app/src/cap-nhat.ts phải trùng nhau, và phiếu
  // phiên bản có đủ trường docPhieuPhienBan đọc.
  const biMat = [...goi.matchAll(/secrets\.([A-Za-z0-9_]+)/g)];
  const viTriPhatHanh = goi.indexOf('\n  phat-hanh:\n');
  ok('Workflow đóng gói: secret duy nhất là TOKEN_BAN_CAI_CAN, một lần, trong env của một bước ở job phat-hanh',
     biMat.length === 1 && biMat[0][1] === 'TOKEN_BAN_CAI_CAN' && viTriPhatHanh > 0 && biMat[0].index > viTriPhatHanh
       && /\n          TOKEN_BAN_CAI: \$\{\{ secrets\.TOKEN_BAN_CAI_CAN \}\}\n/.test(goi),
     biMat.map(m => m[1]).join(', ') || 'không thấy secret nào');
  ok('Workflow đóng gói: chưa có secret → cảnh báo ở Summary, thoát 0 (Release riêng vẫn đủ)',
     /if \[ -z "\$TOKEN_BAN_CAI" \]; then\n\s+echo "::warning::[^\n]*\n\s+echo [^\n]*>> "\$GITHUB_STEP_SUMMARY"\n\s+exit 0\n/.test(goi));
  const khoWorkflow = goi.match(/\n\s+REPO_BAN_CAI: (\S+)\n/)?.[1];
  const capNhat = existsSync(join(GOC, 'can-app', 'src', 'cap-nhat.ts')) ? readFileSync(join(GOC, 'can-app', 'src', 'cap-nhat.ts'), 'utf8') : '';
  const khoChuongTrinh = capNhat.match(/export const REPO_BAN_CAI = '([^']+)';/)?.[1];
  ok('Kho bản cài công khai ở workflow trùng REPO_BAN_CAI của can-app/src/cap-nhat.ts', !!khoWorkflow && khoWorkflow === khoChuongTrinh,
     `workflow: ${khoWorkflow} · cap-nhat.ts: ${khoChuongTrinh}`);
  ok('Bản cài công khai: .exe lấy từ Release riêng, đưa lên cùng phien-ban.json có đủ dang, phienBan, tep, sha256, kichThuoc, ngay',
     /gh release download "can-v\$PHIEN_BAN"/.test(goi) && /gh release create "can-v\$PHIEN_BAN" BeeftownCan\.exe phien-ban\.json --repo "\$REPO_BAN_CAI"/.test(goi)
       && ['dang: 1', 'phienBan: $phienBan', 'tep: "BeeftownCan.exe"', 'sha256: $sha256', 'kichThuoc: $kichThuoc', 'ngay: $ngay'].every(t => goi.includes(t)));

  // 0058 — sao lưu hằng đêm. Workflow này cầm chuỗi kết nối database (có mật khẩu) và mật khẩu mã hoá bản sao:
  // mỗi bí mật chỉ ở env: của đúng bước dùng nó; bước "có bí mật chưa?" chỉ thấy true / false. Chỉ file ĐÃ MÃ HOÁ
  // được lưu; khôi phục thử chỉ vào Supabase dựng tạm (127.0.0.1); thiếu bí mật thì cảnh báo, thoát 0.
  const sl = existsSync(join(GOC, '.github/workflows/sao-luu.yml')) ? readFileSync(join(GOC, '.github/workflows/sao-luu.yml'), 'utf8') : '';
  const dongBiMat = [...sl.matchAll(/^.*secrets\.[A-Za-z0-9_]+.*$/gm)].map(m => m[0]);
  const dungCach = l => /^          (SAO_LUU_DB_URL|SAO_LUU_MAT_KHAU): \$\{\{ secrets\.\1 \}\}$/.test(l)
    || /^          CO_(URL|MAT_KHAU): \$\{\{ secrets\.SAO_LUU_(DB_URL|MAT_KHAU) != '' \}\}$/.test(l);
  const buocCo = ten => sl.split(/\n      - /).filter(b => b.includes(`${ten}: \${{ secrets.${ten} }}`)).map(b => b.match(/name: (.+)/)?.[1]);
  ok('Workflow sao lưu: bí mật chỉ là SAO_LUU_DB_URL, SAO_LUU_MAT_KHAU, mỗi dòng đều là env: của một bước (không nằm trong lệnh)',
     dongBiMat.length === 6 && dongBiMat.every(dungCach), dongBiMat.join(' | ') || 'không thấy');
  ok('Chuỗi kết nối chỉ ở bước Sao lưu và bước Ghi lượt; mật khẩu mã hoá chỉ ở bước Sao lưu và bước Khôi phục thử',
     JSON.stringify(buocCo('SAO_LUU_DB_URL')) === JSON.stringify(['Sao lưu (supabase db dump → nén → mã hoá)', 'Ghi lượt vào database (đèn "Sao lưu dữ liệu" ở /noi-bo)'])
     && JSON.stringify(buocCo('SAO_LUU_MAT_KHAU')) === JSON.stringify(['Sao lưu (supabase db dump → nén → mã hoá)', 'Khôi phục thử vào Supabase dựng tạm']),
     `${buocCo('SAO_LUU_DB_URL').join(', ')} · ${buocCo('SAO_LUU_MAT_KHAU').join(', ')}`);
  ok('Workflow sao lưu: mỗi đêm 02:00 giờ VN + chạy tay; chỉ quyền đọc repo; hai lượt không chồng nhau',
     /cron: '0 19 \* \* \*'/.test(sl) && /\n  workflow_dispatch:\n/.test(sl) && /\npermissions:\n  contents: read\n/.test(sl)
     && /\nconcurrency:\n  group: sao-luu\n  cancel-in-progress: false\n/.test(sl));
  ok('Workflow sao lưu: thiếu bí mật → cảnh báo + Summary, thoát 0',
     /echo "::warning::[^\n]*SAO_LUU_DB_URL[^\n]*\n\s+echo [^\n]*>> "\$GITHUB_STEP_SUMMARY"\n\s+echo "co=false" >> "\$GITHUB_OUTPUT"\n\s+exit 0\n/.test(sl));
  ok('Workflow sao lưu: chỉ lưu file ĐÃ MÃ HOÁ (đường dẫn TEP của sao-luu.sh, đuôi .gpg), giữ 30 ngày',
     /path: \$\{\{ steps\.sao-luu\.outputs\.TEP \}\}\n\s+retention-days: 30\n/.test(sl)
     && /TEN="beeftown-[^"]*\.tar\.gz\.gpg"/.test(readFileSync(join(GOC, 'crm', 'sao-luu', 'sao-luu.sh'), 'utf8'))
     && (sl.match(/uses: actions\/upload-artifact@/g) ?? []).length === 1);
  ok('Workflow sao lưu: khôi phục thử chỉ vào Supabase dựng tạm trong máy CI (127.0.0.1)',
     /khoi-phuc\.sh" "\$TEP" "postgresql:\/\/postgres:postgres@127\.0\.0\.1:54322\/postgres"/.test(sl));
  ok('Workflow sao lưu: bước ghi lượt chạy cả khi bước trước hỏng hay quá giờ (đèn phải biết lượt hỏng), bằng ghi-luot.sql',
     /if: \$\{\{ always\(\) && steps\.bi-mat\.outputs\.co == 'true' \}\}/.test(sl) && /-f crm\/sao-luu\/ghi-luot\.sql/.test(sl)
     && /-v luot_chay="\$LUOT"/.test(sl) && /LUOT: \$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/.test(sl));
  ok('Workflow sao lưu: không in lệnh ra log (không set -x)', !/set -[a-z]*x/.test(sl));
  const hanGio = t => Number(sl.match(new RegExp(`name: ${t}[^\\n]*\\n(?:        .*\\n)*?        timeout-minutes: (\\d+)`))?.[1] ?? 0);
  const hanJob = Number(sl.match(/\n    timeout-minutes: (\d+)\n/)?.[1] ?? 0);
  ok('Workflow sao lưu: sao lưu và khôi phục thử có giới hạn giờ riêng, cộng lại vẫn chừa thời gian cho bước ghi lượt',
     hanGio('Sao lưu \\(') > 0 && hanGio('Khôi phục thử') > 0 && hanGio('Ghi lượt') > 0
     && hanGio('Sao lưu \\(') + hanGio('Khôi phục thử') + hanGio('Ghi lượt') + 10 <= hanJob,
     `${hanGio('Sao lưu \\(')} + ${hanGio('Khôi phục thử')} + ${hanGio('Ghi lượt')} / job ${hanJob}`);
  ok('Workflow sao lưu: action bên thứ ba (supabase/setup-cli) ghim theo commit, không theo tag',
     /uses: supabase\/setup-cli@[0-9a-f]{40} # v\d/.test(sl) && !/uses: supabase\/setup-cli@v/.test(sl));

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
