/**
 * BEEFTOWN — SAO LƯU HẰNG ĐÊM: SCRIPT (crm/sao-luu/*.sh)
 * =======================================================
 *
 *     node test/test-sao-luu.mjs
 *
 * Chạy CHÍNH hai script sao-luu.sh và khoi-phuc.sh, với `supabase` và `psql` GIẢ đặt trước trong
 * PATH — không cần Docker hay database. Kiểm những điều mà một bản sao lưu hỏng sẽ giấu đi đến đúng
 * ngày cần khôi phục:
 *
 *   1. Đếm dòng trong data.sql đúng (kể cả ô có "\." hay xuống dòng); file cắt giữa chừng, tên bảng
 *      lạ → dừng.
 *   2. Sao lưu ra MỘT file đã mã hoá (không phải chữ thường), giải được bằng đúng mật khẩu, có đủ năm
 *      file bên trong; thư mục ra không có file chưa mã hoá. Hỏng bất kỳ bước nào (CLI hỏng, bản
 *      sao thiếu bảng chính, mật khẩu ngắn) → thoát khác 0 và KHÔNG có file .gpg nửa vời.
 *   3. Mật khẩu không bao giờ nằm trên dòng lệnh (ps / log thấy được).
 *   4. Khôi phục: sai mật khẩu, file sửa lén (lệch sha256), database đích đã có dữ liệu → dừng
 *      TRƯỚC khi nạp gì. Nạp xong mà lệch số dòng một bảng, hay sổ kho lệch tồn → thoát 1. Đúng hết
 *      → "KET_QUA=dat". Những dòng chỉ Supabase nội bộ chạy được được chuyển thành chú thích.
 *
 * Phần chạy với Supabase THẬT (Docker) là lượt khôi phục thử mỗi đêm trong .github/workflows/sao-luu.yml;
 * phần ghi lượt vào database ở test-suc-khoe.mjs nhóm 12.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, existsSync, mkdirSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const DAY = join(dirname(fileURLToPath(import.meta.url)), '..', 'sao-luu');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — SAO LƯU HẰNG ĐÊM: SCRIPT');

const TAM = mkdtempSync(join(tmpdir(), 'bt-sao-luu-'));
const MAT_KHAU = "mật-khẩu-thử 'có nháy' đủ dài hơn hai mươi";
const URL_GIA = 'postgresql://postgres.abc:MATKHAUDB@aws-0-x.pooler.supabase.com:5432/postgres';

// ---------------------------------------------------------------------------
// Bản sao "thật" giả: bốn bảng, có ô chứa "\." và xuống dòng (\n) — đếm phải ra đúng số dòng dữ liệu.
// ---------------------------------------------------------------------------
const DATA = [
  'SET session_replication_role = replica;',
  '-- Dumped from database version 17.6',
  'SET statement_timeout = 0;',
  'COPY "auth"."users" ("id", "email") FROM stdin;',
  '00000000-0000-4000-8000-000000000001\tchu@thu.vn',
  '\\.',
  'COPY "public"."chi_nhanh" ("id", "ma", "ten") FROM stdin;',
  'a\tq1\tBeeftown Quận 1',
  'b\tq7\tBeeftown Quận 7',
  '\\.',
  'COPY "public"."nhan_su" ("id", "ho_ten") FROM stdin;',
  'n1\tChủ nhà hàng',
  '\\.',
  'COPY "public"."khach_hang" ("id", "ghi_chu") FROM stdin;',
  'k1\tdòng một\\ndòng hai',
  'k2\t\\\\.',
  'k3\t\\N',
  '\\.',
  'COPY "public"."kho_trong" ("id") FROM stdin;',
  '\\.',
  '',
].join('\n');
const SO_DONG_DUNG = { 'auth.users': 1, 'public.chi_nhanh': 2, 'public.nhan_su': 1, 'public.khach_hang': 3, 'public.kho_trong': 0 };
const ROLES = 'SET client_encoding = \'UTF8\';\nALTER ROLE "anon" SET "statement_timeout" TO \'3s\';\n'
  + 'GRANT SET ON PARAMETER "log_min_messages" TO "supabase_realtime_admin";\nGRANT "postgres" TO "cli_login_postgres" WITH INHERIT FALSE GRANTED BY "supabase_admin";\n';
const SCHEMA = 'CREATE TABLE "public"."chi_nhanh" ("id" text);\nALTER FUNCTION "public"."f"() OWNER TO "supabase_admin";\nALTER TABLE "public"."x" OWNER TO "postgres";\n';

// ---------------------------------------------------------------------------
// `supabase` giả: db dump -f <file> [--role-only | --data-only] → chép file mẫu; ghi lại dòng lệnh.
// `psql` giả: trả lời theo biến môi trường; ghi lại dòng lệnh và chép các --file được nạp.
// ---------------------------------------------------------------------------
const BIN = join(TAM, 'bin'), MAU = join(TAM, 'mau'), NHAT_KY = join(TAM, 'nhat-ky');
for (const d of [BIN, MAU, NHAT_KY]) mkdirSync(d, { recursive: true });
const datMau = (data = DATA) => {
  writeFileSync(join(MAU, 'roles.sql'), ROLES);
  writeFileSync(join(MAU, 'schema.sql'), SCHEMA);
  writeFileSync(join(MAU, 'data.sql'), data);
};
datMau();
writeFileSync(join(BIN, 'supabase'), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "${NHAT_KY}/supabase.txt"
[ "$1" = "--version" ] && { echo 2.999.0; exit 0; }
[ -n "$GIA_SUPABASE_HONG" ] && { echo "error running container: exit 1" >&2; exit 1; }
ra=""; loai=schema
while [ $# -gt 0 ]; do
  case "$1" in -f) ra="$2"; shift ;; --role-only) loai=roles ;; --data-only) loai=data ;; esac
  shift
done
cp "${MAU}/$loai.sql" "$ra"
`);
writeFileSync(join(BIN, 'psql'), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "${NHAT_KY}/psql.txt"
lenh=""; nap=0
while [ $# -gt 0 ]; do
  case "$1" in
    -c|--command) lenh="$2"; shift ;;
    --single-transaction) nap=1 ;;
    --file) cp "$2" "${NHAT_KY}/nap-$(basename "$2")"; shift ;;
  esac
  shift
done
if [ "$nap" = 1 ]; then exit "\${GIA_NAP:-0}"; fi
case "$lenh" in
  *"from pg_tables where schemaname = 'public'"*) echo "\${GIA_SO_BANG_DICH:-0}" ;;
  *"kho_doi_soat_ton()"*) echo "\${GIA_SO_KHO:-0}" ;;
  "select '"*)
    echo "$lenh" >> "${NHAT_KY}/dem.txt"
    for b in $(printf '%s\n' "$lenh" | grep -oE "from [a-z_][a-z0-9_]*\\.[a-z_][a-z0-9_]*" | cut -d' ' -f2); do
      n=$(awk -F'\\t' -v b="$b" '$1 == b { print $2 }' "\${GIA_DEM}")
      # Như psql thật: bảng không có → cả câu lỗi, không in dòng nào.
      [ -n "$n" ] || { echo "ERROR:  relation \"$b\" does not exist" >&2; exit 1; }
      echo "$b|$n"
    done ;;
  *) echo "psql giả không biết lệnh: $lenh" >&2; exit 9 ;;
esac
`);
chmodSync(join(BIN, 'supabase'), 0o755);
chmodSync(join(BIN, 'psql'), 0o755);

const moiTruong = them => ({ ...process.env, PATH: `${BIN}:${process.env.PATH}`, LC_ALL: 'C.UTF-8', ...them });
function chay(script, args, them = {}) {
  const r = spawnSync('bash', [join(DAY, script), ...args], { env: moiTruong(them), encoding: 'utf8' });
  return { ma: r.status, ra: (r.stdout ?? '') + (r.stderr ?? '') };
}
const docNhatKy = ten => existsSync(join(NHAT_KY, ten)) ? readFileSync(join(NHAT_KY, ten), 'utf8') : '';
const xoaNhatKy = () => { rmSync(NHAT_KY, { recursive: true, force: true }); mkdirSync(NHAT_KY); };

// ===========================================================================
await nhom('1 · ĐẾM DÒNG TRONG data.sql', async () => {
  const f = join(TAM, 'data-dem.sql');
  writeFileSync(f, DATA);
  const r = chay('dem-dong.sh', [f]);
  const dem = Object.fromEntries(r.ra.trim().split('\n').map(l => l.split('\t')).map(([b, n]) => [b, Number(n)]));
  ok('Đúng số dòng từng bảng (ô có "\\\\." và xuống dòng \\n không làm lệch; bảng trống = 0)',
     r.ma === 0 && JSON.stringify(dem) === JSON.stringify(SO_DONG_DUNG), r.ra);

  writeFileSync(f, DATA.slice(0, DATA.indexOf('k2')));
  const cat = chay('dem-dong.sh', [f]);
  ok('data.sql bị cắt giữa chừng (hết file giữa một bảng) → dừng', cat.ma !== 0 && /cắt giữa chừng/.test(cat.ra), cat.ra);

  writeFileSync(f, 'COPY "public"."ghi_chu" ("noi_dung", "id") FROM stdin;\nCOPY đầu dòng là chữ của khách\t1\n\\.\n');
  const copy = chay('dem-dong.sh', [f]);
  ok('Ô dữ liệu bắt đầu bằng chữ "COPY " vẫn là dữ liệu, không phải bảng mới', copy.ma === 0 && copy.ra.trim() === 'public.ghi_chu\t1', copy.ra);

  writeFileSync(f, 'COPY "public"."x; drop table y" ("id") FROM stdin;\n1\n\\.\n');
  const la = chay('dem-dong.sh', [f]);
  ok('Tên bảng lạ (sẽ bị ghép vào câu SQL đếm dòng) → dừng', la.ma !== 0 && /Tên bảng lạ/.test(la.ra), la.ra);

  const rong = chay('dem-dong.sh', [join(TAM, 'khong-co.sql')]);
  ok('Không có file → dừng', rong.ma !== 0, rong.ra);
});

// ===========================================================================
const RA = join(TAM, 'ra');
let TEP = null;
await nhom('2 · SAO LƯU: MỘT FILE ĐÃ MÃ HOÁ, ĐỦ NỘI DUNG', async () => {
  xoaNhatKy();
  const r = chay('sao-luu.sh', [RA], { SAO_LUU_DB_URL: URL_GIA, SAO_LUU_MAT_KHAU: MAT_KHAU });
  ok('Chạy xong, thoát 0', r.ma === 0, r.ra);
  const env = existsSync(join(RA, 'ket-qua.env'))
    ? Object.fromEntries(readFileSync(join(RA, 'ket-qua.env'), 'utf8').trim().split('\n').map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
    : {};
  TEP = env.TEP;
  ok('ket-qua.env có đủ TEP, TEN, KICH_THUOC, PHIEN_BAN_PG, SO_BANG, SO_DONG cho workflow',
     ['TEP', 'TEN', 'KICH_THUOC', 'PHIEN_BAN_PG', 'SO_BANG', 'SO_DONG'].every(k => k in env) && env.PHIEN_BAN_PG === '17'
     && env.SO_BANG === '5' && env.SO_DONG === '7', JSON.stringify(env));
  ok('Tên file: beeftown-<năm-tháng-ngày-giờphút>.tar.gz.gpg', /^beeftown-\d{4}-\d{2}-\d{2}-\d{4}\.tar\.gz\.gpg$/.test(env.TEN ?? ''), env.TEN);
  const trongRa = readdirSync(RA).sort();
  ok('Thư mục ra chỉ có file .gpg và ket-qua.env — không file nào chưa mã hoá', JSON.stringify(trongRa) === JSON.stringify([env.TEN, 'ket-qua.env'].sort()),
     trongRa.join(', '));
  const tho = TEP ? readFileSync(TEP) : Buffer.alloc(0);
  ok('File đã mã hoá: không đọc được chữ nào của dữ liệu (COPY, tên chi nhánh)', tho.length > 0
     && !tho.includes('COPY') && !tho.includes('Beeftown') && !tho.includes('chu@thu.vn'), `${tho.length} byte`);
  ok('KICH_THUOC đúng cỡ file', Number(env.KICH_THUOC) === tho.length, `${env.KICH_THUOC} / ${tho.length}`);

  const giai = spawnSync('bash', ['-c', `gpg --batch --quiet --pinentry-mode loopback --passphrase-fd 3 --decrypt "$1" 3<<< "$2" | tar -tzf -`, '_', TEP ?? '', MAT_KHAU],
    { encoding: 'utf8' });
  ok('Giải được bằng đúng mật khẩu (kể cả mật khẩu có dấu, dấu cách, nháy); có đủ năm file',
     giai.status === 0 && JSON.stringify(giai.stdout.trim().split('\n').sort())
       === JSON.stringify(['data.sql', 'roles.sql', 'schema.sql', 'so-dong.tsv', 'thong-tin.txt']), giai.stdout + giai.stderr);
  const lenh = docNhatKy('supabase.txt');
  ok('Ba lượt supabase db dump: vai trò, cấu trúc, dữ liệu dạng COPY (bỏ hai bảng vector theo hướng dẫn Supabase)',
     /--role-only/.test(lenh) && /--use-copy --data-only -x storage\.buckets_vectors -x storage\.vector_indexes/.test(lenh)
     && lenh.split('\n').filter(l => l.startsWith('db dump')).length === 3, lenh);
  ok('Mật khẩu mã hoá không nằm trên dòng lệnh nào', !lenh.includes(MAT_KHAU) && !docNhatKy('psql.txt').includes(MAT_KHAU));
});

// ===========================================================================
await nhom('3 · SAO LƯU HỎNG → THOÁT KHÁC 0, KHÔNG CÓ FILE NỬA VỜI', async () => {
  const thu = (ten, them, mau, canCau) => {
    const ra = join(TAM, `ra-${ten}`);
    if (mau !== undefined) datMau(mau);
    const r = chay('sao-luu.sh', [ra], { SAO_LUU_DB_URL: URL_GIA, SAO_LUU_MAT_KHAU: MAT_KHAU, ...them });
    datMau();
    const gpg = existsSync(ra) ? readdirSync(ra).filter(f => f.endsWith('.gpg')) : [];
    ok(`${ten} → thoát khác 0, không có file .gpg${canCau ? ', câu nói rõ' : ''}`,
       r.ma !== 0 && gpg.length === 0 && (!canCau || canCau.test(r.ra)), r.ra.slice(-300));
  };
  thu('Supabase CLI hỏng (mất mạng, sai mật khẩu database)', { GIA_SUPABASE_HONG: '1' });
  thu('Bản sao không có dữ liệu nhân sự', {}, DATA.replace('n1\tChủ nhà hàng\n', ''), /không có dữ liệu của public\.nhan_su/);
  thu('Bản sao không có tài khoản đăng nhập (auth.users)', {}, DATA.replace(/COPY "auth"."users"[^\n]*\n[^\n]*\n\\\.\n/, ''), /auth\.users/);
  thu('data.sql rỗng', {}, '', /rỗng/);
  thu('Mật khẩu mã hoá ngắn hơn 20 ký tự', { SAO_LUU_MAT_KHAU: 'ngan' }, undefined, /quá ngắn/);
  thu('Thiếu chuỗi kết nối', { SAO_LUU_DB_URL: '' }, undefined, /SAO_LUU_DB_URL/);
});

// ===========================================================================
const DICH = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const DEM_DUNG = join(TAM, 'dem-dung.tsv');
writeFileSync(DEM_DUNG, Object.entries(SO_DONG_DUNG).map(([b, n]) => `${b}\t${n}`).join('\n') + '\n');
const khoiPhuc = (tep, them = {}) => { xoaNhatKy(); return chay('khoi-phuc.sh', [tep, DICH], { SAO_LUU_MAT_KHAU: MAT_KHAU, GIA_DEM: DEM_DUNG, ...them }); };
const daNap = () => /--single-transaction/.test(docNhatKy('psql.txt'));

await nhom('4 · KHÔI PHỤC: DỪNG TRƯỚC KHI NẠP KHI CÓ GÌ SAI', async () => {
  const saiMk = khoiPhuc(TEP, { SAO_LUU_MAT_KHAU: 'sai mật khẩu nhưng đủ dài hai mươi' });
  ok('Sai mật khẩu → dừng, "Không giải mã được", không nạp gì', saiMk.ma !== 0 && /Không giải mã được/.test(saiMk.ra) && !daNap(), saiMk.ra.slice(-200));

  const cat = join(TAM, 'cat.gpg');
  writeFileSync(cat, readFileSync(TEP).subarray(0, 60));
  const catR = khoiPhuc(cat);
  ok('File tải thiếu → dừng, không nạp gì', catR.ma !== 0 && /Không giải mã được/.test(catR.ra) && !daNap(), catR.ra.slice(-200));

  // Sửa lén data.sql bên trong rồi mã hoá lại bằng ĐÚNG mật khẩu: chỉ mã kiểm sha256 bắt được.
  const lam = join(TAM, 'sua-len');
  mkdirSync(lam);
  execFileSync('bash', ['-c', `gpg --batch --quiet --pinentry-mode loopback --passphrase-fd 3 --decrypt "$1" 3<<< "$2" | tar -C "$3" -xzf -
    printf 'x\\tthêm\\n' >> "$3/data.sql"
    tar -C "$3" -czf - roles.sql schema.sql data.sql so-dong.tsv thong-tin.txt \\
      | gpg --batch --yes --quiet --pinentry-mode loopback --passphrase-fd 3 --symmetric --cipher-algo AES256 -o "$4" 3<<< "$2"`,
    '_', TEP, MAT_KHAU, lam, join(TAM, 'sua-len.gpg')]);
  const sua = khoiPhuc(join(TAM, 'sua-len.gpg'));
  ok('Bản sao bị sửa lén (lệch sha256) → dừng, nói tên file, không nạp gì', sua.ma !== 0 && /không khớp mã kiểm \(sha256\): data\.sql/.test(sua.ra)
     && !daNap(), sua.ra.slice(-200));

  const coDuLieu = khoiPhuc(TEP, { GIA_SO_BANG_DICH: '84' });
  ok('Database đích đã có bảng (lỡ trỏ vào database đang chạy) → dừng, KHÔNG nạp gì',
     coDuLieu.ma !== 0 && /đã có 84 bảng/.test(coDuLieu.ra) && !daNap(), coDuLieu.ra.slice(-200));
});

// ===========================================================================
await nhom('5 · KHÔI PHỤC: NẠP RỒI KIỂM ĐỦ', async () => {
  const r = khoiPhuc(TEP);
  ok('Đủ dòng từng bảng, sổ kho khớp → thoát 0, "KET_QUA=dat SO_BANG=5 SO_DONG=7"',
     r.ma === 0 && /KET_QUA=dat SO_BANG=5 SO_DONG=7\s*$/.test(r.ra), r.ra.slice(-300));
  const lenhNap = docNhatKy('psql.txt').split('\n').find(l => l.includes('--single-transaction')) ?? '';
  const dem = docNhatKy('dem.txt').trim().split('\n');
  ok('Đếm dòng mọi bảng bằng MỘT câu SQL (một kết nối, không 118 kết nối)', dem.length === 1
     && (dem[0].match(/ union all /g) ?? []).length === Object.keys(SO_DONG_DUNG).length - 1, docNhatKy('dem.txt'));
  ok('Nạp một giao dịch: vai trò → cấu trúc → tắt trigger → dữ liệu, dừng ở lỗi đầu tiên',
     /--single-transaction -v ON_ERROR_STOP=1 --file \S+roles\.sql --file \S+schema\.sql --command SET session_replication_role = replica --file \S+data\.sql/.test(lenhNap),
     lenhNap);
  const roles = docNhatKy('nap-roles.sql'), schema = docNhatKy('nap-schema.sql');
  ok('Dòng chỉ Supabase nội bộ chạy được → thành chú thích; dòng thường giữ nguyên',
     /^-- \(bỏ khi khôi phục\) GRANT SET ON PARAMETER/m.test(roles) && /^-- \(bỏ khi khôi phục\) GRANT "postgres" TO "cli_login_postgres"/m.test(roles)
     && /^-- \(bỏ khi khôi phục\) ALTER FUNCTION "public"\."f"\(\) OWNER TO "supabase_admin";/m.test(schema)
     && /^ALTER ROLE "anon"/m.test(roles) && /^ALTER TABLE "public"\."x" OWNER TO "postgres";/m.test(schema)
     && /Bỏ 3 dòng/.test(r.ra), `${roles}\n${schema}`);

  const lechDem = join(TAM, 'dem-lech.tsv');
  writeFileSync(lechDem, readFileSync(DEM_DUNG, 'utf8').replace('public.khach_hang\t3', 'public.khach_hang\t2'));
  const lech = khoiPhuc(TEP, { GIA_DEM: lechDem });
  ok('Một bảng thiếu dòng sau khi nạp → thoát 1, nói tên bảng và hai con số',
     lech.ma === 1 && /LỆCH public\.khach_hang: sao lưu có 3 dòng, khôi phục được 2/.test(lech.ra) && /1 bảng lệch số dòng — bản khôi phục KHÔNG đầy đủ/.test(lech.ra),
     lech.ra.slice(-300));
  const thieuBang = join(TAM, 'dem-thieu.tsv');
  writeFileSync(thieuBang, readFileSync(DEM_DUNG, 'utf8').replace('public.nhan_su\t1\n', ''));
  const mat = khoiPhuc(TEP, { GIA_DEM: thieuBang });
  ok('Một bảng không có sau khi nạp (psql báo "does not exist") → thoát khác 0, không in KET_QUA=dat', mat.ma !== 0
     && /relation "?public\.nhan_su"? does not exist/.test(mat.ra) && !/KET_QUA=dat/.test(mat.ra), mat.ra.slice(-300));
  const kho = khoiPhuc(TEP, { GIA_SO_KHO: '2' });
  ok('Sổ kho lệch tồn sau khi nạp → thoát 1', kho.ma === 1 && /lệch tồn ở 2 lô/.test(kho.ra), kho.ra.slice(-200));
  const napHong = khoiPhuc(TEP, { GIA_NAP: '3' });
  ok('Nạp hỏng giữa chừng (psql lỗi) → thoát khác 0, không in KET_QUA=dat', napHong.ma !== 0 && !/KET_QUA=dat/.test(napHong.ra), napHong.ra.slice(-200));
});

// ===========================================================================
await nhom('6 · MÃ SCRIPT', async () => {
  for (const f of ['sao-luu.sh', 'khoi-phuc.sh', 'dem-dong.sh']) {
    const ma = readFileSync(join(DAY, f), 'utf8');
    ok(`${f}: dừng ở lỗi đầu tiên (set -euo pipefail), không in lệnh ra log (không set -x)`,
       /^set -euo pipefail$/m.test(ma) && !/set -[a-z]*x/.test(ma));
  }
  const sl = readFileSync(join(DAY, 'sao-luu.sh'), 'utf8'), kp = readFileSync(join(DAY, 'khoi-phuc.sh'), 'utf8');
  ok('Mật khẩu chỉ đi qua ống số 3 (--passphrase-fd 3), không bao giờ --passphrase <chữ>',
     [sl, kp].every(m => /--passphrase-fd 3/.test(m) && !/--passphrase[ =](?!-fd)/.test(m)));
  ok('Thư mục tạm (chứa bản CHƯA mã hoá) luôn bị xoá khi thoát, kể cả khi hỏng', [sl, kp].every(m => /trap 'rm -rf "\$TAM"' EXIT/.test(m)));
  ok('Khôi phục chạy được cả trên macOS: không sed -i, không sha256sum -c (GNU)', !/sed -i/.test(kp) && !/sha256sum[^\n]*-c/.test(kp)
     && /shasum -a 256/.test(kp));
  ok('Tên file theo giờ Việt Nam', /TZ=Asia\/Ho_Chi_Minh date '\+%Y-%m-%d-%H%M'/.test(sl));
  ok('Khôi phục: kiểm database đích TRỐNG trước khi nạp', kp.indexOf("schemaname = 'public'") > 0
     && kp.indexOf("schemaname = 'public'") < kp.indexOf('--single-transaction'));
});

rmSync(TAM, { recursive: true, force: true });
process.exit(ketThuc('SAO LƯU HẰNG ĐÊM: SCRIPT'));
