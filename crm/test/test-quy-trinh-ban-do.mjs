/**
 * BEEFTOWN — QUY TRÌNH: BẢN ĐỒ CHO PHIÊN LÀM VIỆC VÀ CÔNG CỤ GIẢM TẢI RÀ SOÁT
 * ==========================================================================
 *
 *     node test/test-quy-trinh-ban-do.mjs
 *
 * CLAUDE.md của từng thư mục là bản đồ: "việc này đọc mục kia, sửa file nọ". Bản đồ chỉ sai một chỗ là phiên sau
 * đi lạc — tệ hơn không có. Nên máy canh:
 *
 *   1. Mọi đường dẫn, lệnh `npm run`, hàm SQL `ten()`, mục tài liệu ("`README.md`, "Zalo"", "`KHO.md` mục 3j") mà
 *      bản đồ nhắc đều có thật. Đổi tên file hay tiêu đề mục mà quên bản đồ là test đỏ.
 *   2. Bảng "Kho" của web/CLAUDE.md: thư mục trang, file logic, số mục KHO.md của từng dòng có thật.
 *   3. doc-sql.mjs cắt đúng câu tạo hàm (thẻ $f$ lồng $$, câu trong chú thích, security definer sau thân).
 *   4. tim.mjs tìm đúng bản cuối, in nguyên văn (`--than`), so hai bản (`--khac`), tra bảng.
 *   5. tom-tat-pr.mjs: việc sau khi gộp, chỗ cần chú ý, cỡ thật của migration thay thân — theo từng loại file.
 *   6. kiem-mo-ta-pr.mjs và mẫu PR khớp nhau; mẫu trống bị từ chối, mô tả đủ thì đạt.
 *   7. Workflow mo-ta-pr.yml chạy đúng hai script, mô tả PR không bao giờ chép vào lệnh shell.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { banCuoiTheoTen, cacCauHam, soHaiBan } from './doc-sql.mjs';
import { DAU_COMMENT, NGUONG_PR_LON, tomTat, xepKhu, docMigrationMoi } from './tom-tat-pr.mjs';
import { DONG_TOM_TAT, MUC_XONG as MUC_MO_TA, kiemMoTa } from './kiem-mo-ta-pr.mjs';

const THU_MUC = dirname(fileURLToPath(import.meta.url));
const GOC = join(THU_MUC, '..', '..');
const doc = f => readFileSync(join(GOC, f), 'utf8');
const git = args => execFileSync('git', args, { cwd: GOC, encoding: 'utf8', maxBuffer: 64 << 20 });
const node = (tep, args) => {
  try {
    return { ma: 0, ra: execFileSync('node', [join(THU_MUC, tep), ...args],
      { cwd: GOC, encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'pipe'] }) };
  }
  catch (e) { return { ma: e.status ?? 1, ra: (e.stdout ?? '') + (e.stderr ?? '') }; }
};
const boMau = s => s.replace(/\x1b\[[0-9;]*m/g, '');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — QUY TRÌNH: BẢN ĐỒ VÀ CÔNG CỤ GIẢM TẢI RÀ SOÁT');

const BAN_DO = ['CLAUDE.md', 'AGENTS.md', 'crm/CLAUDE.md', 'web/CLAUDE.md', 'can-app/CLAUDE.md'];
// Cả file mới chưa commit (không bị .gitignore chặn): bản đồ viết cùng lúc với file nó nhắc.
const TEP_GIT = git(['ls-files', '--cached', '--others', '--exclude-standard']).split('\n').filter(Boolean);
const TEN_TEP = new Set(TEP_GIT.map(f => f.split('/').pop()));
const migration = readdirSync(join(GOC, 'crm/supabase/migrations')).filter(f => f.endsWith('.sql')).sort()
  .map(f => readFileSync(join(GOC, 'crm/supabase/migrations', f), 'utf8')).join('\n');
const HAM_SQL = new Set(cacCauHam(migration).map(h => h.ten));
const SCRIPT_NPM = new Set(['crm', 'web', 'can-app', 'mini-app']
  .flatMap(d => Object.keys(JSON.parse(doc(`${d}/package.json`)).scripts ?? {})));

/** Đường dẫn trong `…` có thật: tính từ gốc repo, từ thư mục của bản đồ, hoặc (tên trần) có file trùng tên. */
function coThat(chu, thuMucBanDo) {
  const thu = [join(GOC, chu), join(GOC, thuMucBanDo, chu)];
  if (thu.some(p => existsSync(p))) return true;
  if (!chu.includes('/')) return TEN_TEP.has(chu);
  // Đường dẫn tính từ một thư mục quen (`cai-dat/ipos.astro` dưới trang kho, `kho/tang.ts` dưới web/src/lib):
  // có file mang đúng đuôi đường dẫn đó. Bảng Kho của web/CLAUDE.md thì nhóm 2 kiểm chặt hơn.
  return chu.endsWith('/') ? TEP_GIT.some(f => f.includes('/' + chu)) : TEP_GIT.some(f => f.endsWith('/' + chu));
}

// ===========================================================================
await nhom('1 · BẢN ĐỒ CHỈ NHẮC THỨ CÓ THẬT', async () => {
  for (const f of BAN_DO) {
    const s = doc(f);
    const thuMuc = dirname(f);
    const ma = [...s.matchAll(/`([^`\n]+)`/g)].map(m => m[1]);

    // Đường dẫn và tên file
    const LA_DUONG_DAN = /^[\w.@-]+(\/[\w.@[\]-]+)*\/?$/;
    const DUOI = /\.(mjs|ts|tsx|js|md|sql|yml|yaml|astro|json|css|html|toml|cmd|sh|txt)$/;
    // Bỏ chỗ giữ chỗ (`00NN_ten.sql`, `test-<khu>-<ten>.mjs`) và đuôi trần (`.ts`).
    const duongDan = ma.filter(m => LA_DUONG_DAN.test(m) && (DUOI.test(m) || m.endsWith('/')) && !/NN|<|\*/.test(m) && !/^\.\w+$/.test(m));
    const thieu = [...new Set(duongDan.filter(m => !coThat(m, thuMuc)))];
    ok(`${f}: ${duongDan.length} đường dẫn đều có thật`, thieu.length === 0, `không thấy: ${thieu.join(', ')}`);

    // npm run <lệnh>
    const lenh = [...s.matchAll(/npm run ([a-z][\w:-]*)/g)].map(m => m[1]);
    const thieuLenh = [...new Set(lenh.filter(l => !SCRIPT_NPM.has(l)))];
    ok(`${f}: ${new Set(lenh).size} lệnh npm run đều có trong package.json`, thieuLenh.length === 0, `không có: ${thieuLenh.join(', ')}`);

    // Hàm SQL viết dạng `ten_co_gach()` (hàm JS như `duoi()` không có gạch dưới)
    const ham = ma.filter(m => /^[a-z][a-z0-9]*_[a-z0-9_]*\(\)$/.test(m)).map(m => m.slice(0, -2));
    const thieuHam = [...new Set(ham.filter(h => !HAM_SQL.has(h)))];
    ok(`${f}: ${new Set(ham).size} hàm SQL đều có trong migration`, thieuHam.length === 0, `không có: ${thieuHam.join(', ')}`);

    // Mục tài liệu: `X.md`, "Tiêu đề", "Tiêu đề khác"  ·  `X.md`, mục "Tiêu đề"  ·  `X.md` mục 3j
    const sai = [];
    let soMuc = 0;
    for (const m of s.matchAll(/`([\w./-]+\.md)`((?:,? (?:mục )?"[^"\n]+")+)/g)) {
      const tep = [join(thuMuc, m[1]), m[1]].find(p => existsSync(join(GOC, p)));
      if (!tep) { sai.push(`${m[1]} (không có file)`); continue; }
      const tieuDe = doc(tep).split('\n').filter(d => /^#{1,4} /.test(d)).join('\n');
      for (const [, ten] of m[2].matchAll(/"([^"]+)"/g)) {
        soMuc++;
        if (!tieuDe.includes(ten)) sai.push(`${m[1]} "${ten}"`);
      }
    }
    for (const m of s.matchAll(/`([\w./-]+\.md)` mục (\d+[a-z]?)\b/g)) {
      const tep = [join(thuMuc, m[1]), m[1]].find(p => existsSync(join(GOC, p)));
      if (!tep) { sai.push(`${m[1]} (không có file)`); continue; }
      soMuc++;
      if (!new RegExp(`^#{1,4} ${m[2]}\\.`, 'm').test(doc(tep))) sai.push(`${m[1]} mục ${m[2]}`);
    }
    ok(`${f}: ${soMuc} mục tài liệu được nhắc đều có tiêu đề thật`, sai.length === 0, `không thấy: ${sai.join('; ')}`);
  }

  // Bản đồ của thư mục chỉ có ích khi được nạp: Claude Code nạp CLAUDE.md của thư mục con, .gitignore phải mở nó.
  for (const f of ['crm/CLAUDE.md', 'web/CLAUDE.md', 'can-app/CLAUDE.md']) {
    let biChan = false;
    try { git(['check-ignore', '-q', f]); biChan = true; } catch { /* mã 1 = không bị chặn */ }
    ok(`${f} không bị .gitignore chặn`, !biChan, `thêm dòng !/${f} vào mục ĐƯỢC PHÉP của .gitignore`);
  }
  const goc = doc('CLAUDE.md');
  ok('CLAUDE.md gốc trỏ tới bản đồ của từng thư mục và hai công cụ tra',
     ['crm/CLAUDE.md', 'web/CLAUDE.md', 'can-app/CLAUDE.md', 'npm run tim', 'npm run tom-tat-pr'].every(x => goc.includes(x)));
  ok('AGENTS.md (Codex, agent khác) cũng trỏ tới bản đồ từng thư mục', doc('AGENTS.md').includes('web/CLAUDE.md'));
});

// ===========================================================================
await nhom('2 · BẢNG "KHO" CỦA web/CLAUDE.md KHỚP MÃ VÀ KHO.md', async () => {
  const s = doc('web/CLAUDE.md');
  const bang = s.slice(s.indexOf('## Kho'), s.indexOf('\n## ', s.indexOf('## Kho') + 5));
  const dong = bang.split('\n').filter(d => d.startsWith('| ') && !d.startsWith('| Màn') && !d.startsWith('|---'));
  ok('Bảng Kho có các màn chính', dong.length >= 15, `${dong.length} dòng`);
  const kho = doc('web/KHO.md');
  const sai = [];
  for (const d of dong) {
    const [, , trang, logic, muc] = d.split('|').map(x => x.trim());
    for (const [o, goc] of [[trang, 'web/src/pages/noi-bo/kho/'], [logic, 'web/src/lib/kho/']]) {
      for (const [, p] of o.matchAll(/`([^`]+)`/g)) {
        const duong = p.startsWith('src/') ? `web/${p}` : goc + p;
        if (!existsSync(join(GOC, duong))) sai.push(duong);
      }
    }
    for (const so of muc.split(/,\s*/).map(x => x.match(/^(\d+[a-z]?)/)?.[1]).filter(Boolean)) {
      if (!new RegExp(`^## ${so}\\.`, 'm').test(kho)) sai.push(`KHO.md mục ${so}`);
    }
    for (const [, ten] of muc.matchAll(/"([^"]+)"/g)) if (!kho.includes(`### ${ten}`)) sai.push(`KHO.md "${ten}"`);
  }
  ok('Mọi trang, file logic, mục KHO.md trong bảng đều có thật', sai.length === 0, sai.join(', '));
  // Màn kho mới: có trong bảng (hoặc thuộc một dòng) — để phiên sau tìm ra nó.
  const thuMucTrang = readdirSync(join(GOC, 'web/src/pages/noi-bo/kho')).filter(x => statSync(join(GOC, 'web/src/pages/noi-bo/kho', x)).isDirectory());
  const thieuMan = thuMucTrang.filter(x => !bang.includes('`' + x + '/'));
  ok('Mọi thư mục màn kho đều có dòng trong bảng', thieuMan.length === 0, `thêm vào web/CLAUDE.md: ${thieuMan.join(', ')}`);
});

// ===========================================================================
await nhom('3 · doc-sql.mjs CẮT ĐÚNG CÂU TẠO HÀM', async () => {
  const sql = `
-- create or replace function trong_chu_thich() returns int as $$ select 1 $$;
create or replace function a_mot(p int) returns int
language plpgsql security definer set search_path = public as $f$
begin
  execute $$ select 1; $$;   -- thẻ khác tên lồng bên trong không cắt nhầm
  raise exception 'Không cho % làm', p;
  return 1;
end $f$;
create function public.b_hai() returns void as $$ select 1 $$ language sql security definer;
create or replace function a_mot(p int) returns int language sql as $$ select 2 $$;
`;
  const ham = cacCauHam(sql);
  ok('Đọc ba câu tạo hàm, bỏ câu trong chú thích', ham.length === 3 && !ham.some(h => h.ten === 'trong_chu_thich'),
     ham.map(h => h.ten).join(', '));
  ok('Thẻ $f$ lồng $$: câu đầu cắt tới "end $f$;"', ham[0].cau.trimEnd().endsWith('end $f$;') && ham[0].cau.includes('return 1;'));
  ok('security definer + set search_path trước thân', ham[0].definer && ham[0].searchPath && ham[0].ngonNgu === 'plpgsql');
  ok('security definer SAU thân, thiếu search_path', ham[1].ten === 'b_hai' && ham[1].definer && !ham[1].searchPath && ham[1].ngonNgu === 'sql');
  ok('Câu raise exception đọc được', ham[0].raise.length === 1 && ham[0].raise[0] === 'Không cho % làm');
  ok('Bản cuối theo tên là lần viết sau', banCuoiTheoTen(sql).get('a_mot').cau.includes('select 2'));
  const k = soHaiBan('a\nb\nc\n', 'a\nB\nc\nd\n');
  ok('So hai bản đếm đúng dòng thêm / bớt', k.them === 2 && k.bot === 1, JSON.stringify(k));
  ok('Hai bản y hệt: 0 / 0', (({ them, bot }) => them === 0 && bot === 0)(soHaiBan('x\n', 'x\n')));
});

// ===========================================================================
await nhom('4 · tim.mjs TÌM ĐÚNG BẢN CUỐI, IN NGUYÊN VĂN', async () => {
  // Bản cuối tính độc lập: file migration cuối cùng có câu tạo hàm này.
  const thuMuc = join(GOC, 'crm/supabase/migrations');
  const tep = readdirSync(thuMuc).filter(f => f.endsWith('.sql')).sort();
  const coHam = (ten) => tep.filter(f => new RegExp(`create\\s+or\\s+replace\\s+function\\s+${ten}\\s*\\(`, 'i').test(readFileSync(join(thuMuc, f), 'utf8')));
  const TEN = 'kho_duyet_phieu_nhap';
  const ds = coHam(TEN);
  const r = node('tim.mjs', [TEN]);
  const ra = boMau(r.ra);
  ok('Tra một hàm: chạy được', r.ma === 0, ra.slice(0, 300));
  ok(`Bản cuối của ${TEN} là ${ds.at(-1)}`, ra.includes(`bản cuối crm/supabase/migrations/${ds.at(-1)}:`));
  ok('Liệt kê đủ các lần viết', ds.every(f => ra.includes(f)), `${ds.length} lần`);
  ok('Có chỗ web gọi qua .rpc() và danh sách quyền chứa hàm', /web\/src\/lib\/kho\/nhap\.ts/.test(ra) && /GOI_DUOC — crm\/test\/test-kho-quyen\.mjs/.test(ra));

  const than = node('tim.mjs', [TEN, '--than']);
  const cau = than.ra.split('\n').filter(d => !d.startsWith('-- Bản cuối') && !d.startsWith('-- CHÚ Ý')).join('\n').trim();
  ok('--than in nguyên văn đúng một đoạn của file migration cuối',
     than.ma === 0 && cau.endsWith(';') && readFileSync(join(thuMuc, ds.at(-1)), 'utf8').includes(cau), `${cau.length} ký tự`);

  const khac = node('tim.mjs', [TEN, '--khac']);
  ok('--khac so hai bản cuối', khac.ma === 0 && boMau(khac.ra).includes(`${ds.at(-2)}`) && boMau(khac.ra).includes(`→ ${ds.at(-1)}`),
     boMau(khac.ra).split('\n')[0]);
  ok('--khac với hàm một bản: báo, mã khác 0', node('tim.mjs', ['ngay_vn', '--khac']).ma !== 0);

  const bang = boMau(node('tim.mjs', ['kho_phieu_nhap_dong']).ra);
  ok('Tra một bảng: thấy câu tạo bảng và các lần thêm cột', /tạo bảng 0020_kho_so_cai_nhap\.sql:\d+/.test(bang) && /sửa bảng 0105_/.test(bang));
  const tepWeb = boMau(node('tim.mjs', ['nhan-hang.ts']).ra);
  ok('Tra một file: thấy trang import nó', tepWeb.includes('web/src/pages/noi-bo/kho/nhan-hang/moi.astro'));
  // drop chữ ký cũ rồi create lại trong cùng file (0102) không phải "xoá sau bản cuối".
  ok('Drop đứng trước bản cuối trong cùng file: không báo xoá', !boMau(node('tim.mjs', ['ban_le_tao_san_pham']).ra).includes('Có lệnh xoá sau bản cuối'));
  const dm = boMau(node('tim.mjs', ['danh-muc.ts']).ra);
  const aiImport = dm.slice(dm.indexOf('Ai import'), dm.indexOf('Kiểm thử nhắc tên'));
  ok('Tra file: "danh-muc.ts" không kéo theo file chỉ import danh-muc-can.ts',
     aiImport.includes('can-app/src/nghiep-vu.ts') && !aiImport.includes('can-app/src/quay.ts'));
  const khong = node('tim.mjs', ['khong_co_ten_nay_dau']);
  ok('Tên không có: chạy hết, không ném lỗi', khong.ma === 0 && boMau(khong.ra).includes('(không có)'));
});

// ===========================================================================
await nhom('5 · tom-tat-pr.mjs: VIỆC SAU KHI GỘP THEO TỪNG LOẠI FILE', async () => {
  const f = (tep, them = 10, bot = 0, trangThai = 'M') => ({ tep, them, bot, trangThai });
  const chay = (o) => tomTat({ migMoi: [], hamDaCo: new Map(), nhacTrongTest: () => true, phienBanCan: { cu: '2.11.0', moi: '2.11.0' },
    soVoi: 'origin/main', soBan: () => ({ them: 3, bot: 1 }), ...o });

  ok('Xếp khu: KHO.md là tài liệu, workflow là CI, mẫu PR là tài liệu, test là kiểm thử',
     xepKhu('web/KHO.md').loai === 'tai-lieu' && xepKhu('.github/workflows/kiem-thu.yml').ten.startsWith('CI')
     && xepKhu('.github/pull_request_template.md').loai === 'tai-lieu' && xepKhu('crm/test/test-x.mjs').loai === 'test'
     && xepKhu('web/src/lib/kho/nhap.ts').ten === 'Kho (web)' && xepKhu('crm/supabase/migrations/0001_a.sql').loai === 'sql');

  const chiTaiLieu = chay({ tep: [f('web/KHO.md'), f('crm/test/test-x.mjs', 5, 0, 'A')] });
  ok('Chỉ tài liệu + kiểm thử: không cần làm gì sau khi gộp', chiTaiLieu.includes('Không cần làm gì'));
  ok('Comment mang dấu để workflow sửa lại đúng comment', chiTaiLieu.startsWith(DAU_COMMENT));

  const mig = docMigrationMoi('0200_thu.sql', `
alter type vai_tro add value 'may_moi';
create or replace function kho_cu(p uuid) returns int language sql security definer set search_path = public as $$ select 1 $$;
create or replace function kho_moi_khong_test() returns int language sql security definer as $$ delete from x where false; select 1 $$;
alter table kho_mat_hang add column so_moi int;
drop function if exists kho_bo_di(uuid);
-- delete from chi_trong_chu_thich;
`);
  const hamDaCo = new Map([['kho_cu', { cau: 'create or replace function kho_cu(p uuid) returns int language sql as $$ select 0 $$;' }]]);
  const coMig = chay({
    tep: [f('crm/supabase/migrations/0200_thu.sql', 8, 0, 'A'), f('web/src/lib/kho/nhap.ts'), f('mini-app/src/don.ts')],
    migMoi: [mig], hamDaCo, nhacTrongTest: t => t !== 'kho_moi_khong_test',
  });
  ok('Migration mới: chạy migration rồi đối chiếu', coMig.includes('**Chạy migration** `0200_thu.sql`') && coMig.includes('npm run doi-chieu'));
  ok('Thêm giá trị enum: chạy RIÊNG', coMig.includes('`0200` thêm giá trị enum: **chạy RIÊNG**'));
  ok('Có câu delete (kể cả trong thân hàm): nhắc không chạy qua Supabase MCP', coMig.includes('`0200` có câu `delete`'));
  ok('Đổi web + có migration: deploy SAU khi chạy migration', /Deploy web.*SAU khi chạy migration/.test(coMig));
  ok('Đổi Mini App: nhắc đưa lên Zalo', coMig.includes('dua-len-zalo.cmd'));
  ok('Xoá hàm: cần chú ý', coMig.includes('xoá `function kho_bo_di`'));
  ok('security definer thiếu search_path: cần chú ý', coMig.includes('`kho_moi_khong_test` (`0200`) là security definer nhưng thiếu `set search_path`'));
  ok('Hàm mới chưa test nào nhắc: cần chú ý', coMig.includes('Hàm mới `kho_moi_khong_test`'));
  ok('Hàm thay thân: ghi số dòng đổi so với bản trước', coMig.includes('thay thân `kho_cu` (+3 / −1)'));
  ok('Cột mới ghi trong mục migration', coMig.includes('`kho_mat_hang.so_moi`'));
  const chiChuThich = docMigrationMoi('0201_x.sql', "-- delete from a;\nselect 'delete from b';\n/* delete from c */\n");
  ok('delete trong chú thích hay trong chuỗi chữ không tính', !chiChuThich.coDelete);
  ok('Dấu nháy lẻ trong chú thích không nuốt câu lệnh sau nó',
     docMigrationMoi('0203_x.sql', "-- câu cũ: 'Số điện thoại\ndelete from kho_x where id = '1';\n").coDelete
     && docMigrationMoi('0204_x.sql', "-- it's\nalter type vai_tro add value 'may_moi';\n").themEnum);
  ok('Thêm giá trị enum cho kiểu có public. hay nháy kép: vẫn là chạy RIÊNG',
     docMigrationMoi('0205_x.sql', "alter type public.vai_tro add value 'x';").themEnum
     && docMigrationMoi('0206_x.sql', 'alter type "vai_tro" add value \'x\';').themEnum);
  const taoLai = docMigrationMoi('0207_x.sql', `
drop trigger if exists t1 on a; create trigger t1 after insert on a for each row execute function f();
drop function if exists f(int); create or replace function f(p text) returns int language sql as $$ select 1 $$;
drop policy if exists "doc ca nha" on b; create policy "doc ca nha" on b for select using (true);
drop index if exists i1; create index i1 on a (x);
drop policy if exists "chi chu" on b;
drop table cu;
alter table a drop column y;`);
  ok('Drop rồi tạo lại trong cùng file (trigger, hàm đổi tham số, policy, chỉ mục): không báo',
     JSON.stringify(taoLai.coDrop) === JSON.stringify(['policy chi chu', 'table cu', 'column y']), JSON.stringify(taoLai.coDrop));

  const suaCu = chay({ tep: [f('crm/supabase/migrations/0001_nen_mong.sql', 1, 1, 'M')] });
  ok('Sửa migration đã có trên main: cần chú ý', suaCu.includes('Sửa migration đã có trên main'));

  const can = chay({ tep: [f('can-app/src/nghiep-vu.ts')] });
  ok('Đổi Beeftown Cân, không nâng PHIEN_BAN: cần chú ý, không ở "Sau khi gộp"',
     can.includes('vẫn 2.11.0: CI không tạo Release') && !can.slice(0, can.indexOf('#### Cần chú ý')).includes('Beeftown Cân'));
  const nang = chay({ tep: [f('can-app/src/main.ts')], phienBanCan: { cu: '2.11.0', moi: '2.12.0' } });
  ok('Nâng PHIEN_BAN: sau khi gộp máy quầy bấm Cập nhật', nang.includes('**Beeftown Cân 2.12.0** (trước: 2.11.0)'));
  const lib = chay({ tep: [f('web/src/lib/kho/can-tma.ts')], tepCan: new Set(['web/src/lib/kho/can-tma.ts']) });
  ok('Đổi file web/src/lib mà Beeftown Cân đóng gói: nhắc ở cần chú ý', lib.includes('Beeftown Cân đóng gói cả `kho/can-tma.ts`'));

  const khoa = chay({ tep: [f('web/package-lock.json', 4000, 3000), f('web/package.json', 1, 1)] });
  ok('package-lock.json không tính vào cỡ PR, nhưng đổi thư viện web vẫn phải deploy',
     !khoa.includes('PR lớn') && khoa.includes('Deploy web'));
  ok('Đổi mini-app/package.json: nhắc đưa Mini App lên Zalo', chay({ tep: [f('mini-app/package.json')] }).includes('dua-len-zalo.cmd'));
  ok('Hàm mới "có test nhắc" tính trên cùng bộ file với test-quy-trinh.mjs nhóm 1 (bỏ chính file đó)',
     doc('crm/test/tom-tat-pr.mjs').includes("':!crm/test/test-quy-trinh.mjs'"));
  const lon = chay({ tep: [f('web/src/lib/kho/nhap.ts', NGUONG_PR_LON, 1)] });
  ok(`Quá ${NGUONG_PR_LON} dòng mã: nhắc tách PR`, lon.includes('**PR lớn:**'));
  ok(`Đúng ${NGUONG_PR_LON} dòng: không nhắc`, !chay({ tep: [f('web/src/lib/kho/nhap.ts', NGUONG_PR_LON, 0)] }).includes('PR lớn'));
  ok(`CLAUDE.md ghi đúng ngưỡng ${NGUONG_PR_LON.toLocaleString('vi-VN')} dòng`, doc('CLAUDE.md').includes(NGUONG_PR_LON.toLocaleString('vi-VN')));

  // Thân hàm chép nguyên văn không tính vào cỡ: migration 300 dòng, hàm thay thân 290 dòng, đổi 4 dòng.
  const than = 'create or replace function kho_cu() returns int language sql as $$\n' + 'select 1;\n'.repeat(288) + '$$;';
  const migLon = docMigrationMoi('0202_lon.sql', than + '\n'.repeat(10));
  const coThan = chay({ tep: [f('crm/supabase/migrations/0202_lon.sql', NGUONG_PR_LON + 200, 0, 'A')], migMoi: [migLon],
    hamDaCo: new Map([['kho_cu', { cau: than }]]), soBan: () => ({ them: 2, bot: 2 }) });
  ok('Migration thay thân lớn: không bị tính là PR lớn, ghi số dòng thật sự đổi', !coThan.includes('PR lớn') && coThan.includes('thật sự đổi'));

  const rong = node('tom-tat-pr.mjs', ['--so-voi', 'HEAD', '--den', 'HEAD']);
  ok('Chạy trên git thật: nhánh không đổi gì', rong.ma === 0 && rong.ra.includes('Nhánh chưa có thay đổi nào.'), rong.ra.slice(0, 200));
});

// ===========================================================================
await nhom('6 · MÔ TẢ PR: MẪU VÀ MÁY KIỂM KHỚP NHAU', async () => {
  const mau = doc('.github/pull_request_template.md');
  const quyTrinh = doc('crm/test/test-quy-trinh.mjs');
  const mucQuyTrinh = [...(quyTrinh.match(/export const MUC_XONG = \[([^\]]+)\]/)?.[1] ?? '').matchAll(/'([a-z-]+)'/g)].map(m => m[1]);
  ok('kiem-mo-ta-pr.mjs dùng đúng 9 mục của test-quy-trinh.mjs', JSON.stringify(mucQuyTrinh) === JSON.stringify(MUC_MO_TA),
     `${mucQuyTrinh.join(',')} ≠ ${MUC_MO_TA.join(',')}`);
  ok('Mẫu PR có đủ bốn dòng "Tóm tắt cho Khánh" mà máy kiểm', DONG_TOM_TAT.every(n => mau.includes(`- **${n}:**`)));
  ok('Mẫu PR: tóm tắt cho Khánh đứng đầu, bằng chứng kỹ thuật trong phần gập',
     mau.startsWith('## Tóm tắt cho Khánh') && mau.indexOf('<details>') < mau.indexOf('`quyen`') && mau.indexOf('`dich-vu-ngoai`') < mau.indexOf('</details>'));

  const loiMau = kiemMoTa(mau);
  ok('Mẫu PR còn trống: bị từ chối ở mọi dòng phải điền', loiMau.length === DONG_TOM_TAT.length + 1 + MUC_MO_TA.length, `${loiMau.length} lỗi`);

  const du = mau
    .replace('- **Thay đổi:** <!--', '- **Thay đổi:** Thủ kho nhận bia theo thùng. <!--')
    .replace('- **Rủi ro:** <!--', '- **Rủi ro:** Vừa — đổi cách tính tiền phiếu nhập. <!--')
    .replace('- **Cần Khánh quyết:** <!--', '- **Cần Khánh quyết:** không <!--')
    .replace('- **Sau khi gộp:** <!--', '- **Sau khi gộp:** chạy migration 0105 rồi deploy web. <!--')
    .replace(/(## Khánh tự thử thế nào\n\n<!--[^\n]*-->)/, '$1\n\n1. Kho → Nhận hàng.')
    .replace(/(`[a-z-]+` — [^\n]*:)\n/g, '$1\n  - `Tên kiểm tra`\n');
  ok('Mô tả điền đủ: đạt', kiemMoTa(du).length === 0, kiemMoTa(du).join(' | '));
  ok('Chữ trong chú thích <!-- --> không tính là đã điền',
     kiemMoTa(du.replace('- **Cần Khánh quyết:** không <!--', '- **Cần Khánh quyết:** <!-- không')).some(l => l.includes('Cần Khánh quyết')));
  ok('Rủi ro không ghi Thấp / Vừa / Cao: bị từ chối',
     kiemMoTa(du.replace('Vừa — đổi', 'Trung bình — đổi')).some(l => l.includes('Thấp / Vừa / Cao')));
  ok('Rủi ro "Cao" đạt', kiemMoTa(du.replace('Vừa — đổi', 'Cao — đổi')).length === 0);
  ok('Một mục "xong" để trống: bị từ chối đúng mục đó',
     (l => l.length === 1 && l[0].includes('`ton-kho`'))(kiemMoTa(du.replace(/(`ton-kho` — [^\n]*:)\n  - `Tên kiểm tra`\n/, '$1\n'))));
  ok('"không áp dụng vì …" cùng dòng là đã điền',
     kiemMoTa(du.replace(/(`ton-kho` — [^\n]*:)\n  - `Tên kiểm tra`\n/, '$1 không áp dụng vì không đụng kho.\n')).length === 0);
  ok('Thiếu hẳn mục: bị từ chối', kiemMoTa(du.replace(/- \[ \] `gio-vn`[^\n]*\n  - `Tên kiểm tra`\n/, '')).some(l => l.includes('Thiếu mục `gio-vn`')));
  ok('Mô tả rỗng (PR mở không theo mẫu): bị từ chối, không ném lỗi', kiemMoTa('').length > 0 && kiemMoTa(null).length > 0);
  ok('Xuống dòng kiểu Windows (\\r\\n) vẫn đọc được', kiemMoTa(du.replace(/\n/g, '\r\n')).length === 0);
  ok('Gõ bằng "Unicode tổ hợp" (NFD): "Rủi ro: Thấp" vẫn đạt', kiemMoTa(du.replace('Vừa — đổi', 'Thấp — đổi').normalize('NFD')).length === 0);
});

// ===========================================================================
await nhom('7 · WORKFLOW mo-ta-pr.yml', async () => {
  const y = doc('.github/workflows/mo-ta-pr.yml');
  ok('Chạy khi mở, sửa mô tả, đẩy thêm, mở lại, sẵn sàng rà soát', /types: \[opened, edited, synchronize, reopened, ready_for_review\]/.test(y));
  ok('Job tóm tắt chạy tom-tat-pr.mjs so với nhánh gốc của PR', /node crm\/test\/tom-tat-pr\.mjs --so-voi "origin\/\$NHANH_GOC" --den HEAD/.test(y));
  ok('Job kiểm mô tả chạy kiem-mo-ta-pr.mjs', /run: node crm\/test\/kiem-mo-ta-pr\.mjs/.test(y));
  ok('Mô tả PR chỉ đi qua biến môi trường, không bao giờ nằm trong lệnh run',
     /MO_TA_PR: \$\{\{ github\.event\.pull_request\.body \}\}/.test(y)
     && !y.split('\n').some(d => /pull_request\.body|head_ref|pull_request\.title/.test(d) && !/^\s+MO_TA_PR: /.test(d)));
  ok('Comment tìm lại bằng đúng dấu của tom-tat-pr.mjs, chỉ sửa khi khác', y.includes(`DAU='${DAU_COMMENT}'`) && y.includes('!= "$(cat tom-tat.md)"'));
  ok('Không đăng được comment (token chỉ đọc) không làm PR đỏ', /name: Đăng hoặc sửa comment tóm tắt\n\s+continue-on-error: true/.test(y));
  ok('Quyền ghi PR chỉ ở job tóm tắt; mặc định chỉ đọc', /^permissions:\n  contents: read\n/m.test(y) && (y.match(/pull-requests: write/g) ?? []).length === 1);
  ok('Sửa mô tả và đẩy commit ở hai nhóm chạy riêng: sửa mô tả không hủy lượt tóm tắt của commit mới',
     /group: mo-ta-pr-\$\{\{ github\.event\.pull_request\.number \}\}-\$\{\{ \(github\.event\.action == 'edited' && !github\.event\.changes\.base\) && 'mo-ta' \|\| 'ma' \}\}/.test(y));
  ok('Đổi nhánh gốc (sự kiện edited) thì tóm tắt lại', y.includes("(github.event.action != 'edited' || github.event.changes.base)"));
  ok('Bỏ qua PR của Dependabot', (y.match(/github\.event\.pull_request\.user\.login != 'dependabot\[bot\]'/g) ?? []).length === 2);
  ok('Không chạy trên main: cổng deploy không đọc workflow này', !/^\s+push:/m.test(y) && doc('web/kiem-tra/truoc-deploy.mjs').includes("const WORKFLOW = 'kiem-thu.yml'"));
});

process.exit(ketThuc('QUY TRÌNH — BẢN ĐỒ'));
