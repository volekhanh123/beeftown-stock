/**
 * BEEFTOWN — BỘ CÀI MÁY CHỦ ĐƠN LÊN MÁY CHỦ THUÊ (may-chu-don/cai-dat/)
 * =====================================================================
 *
 *     node test/test-may-chu-don-cai-dat.mjs
 *
 * Bộ cài gồm bốn file: may-chu.sh (cài, cập nhật, xem trạng thái), may-chu-don.service (systemd), Caddyfile.mau
 * (HTTPS) và may-chu-don.env.mau (bí mật). Chúng chỉ chạy trên máy chủ thật, nên CI không chạy được; file này đọc
 * chữ của chúng và canh những điều mà sai là hỏng âm thầm:
 *
 *   1. Caddy: tin tiền về (/sepay…) chỉ nhận IP của SePay — đúng danh sách SePay công bố; chỉ chuyển tới
 *      127.0.0.1:8787; không ghi nhật ký truy cập (đường xem đơn mang khóa xem).
 *   2. systemd: máy chủ đơn chỉ nghe trong máy, tin X-Forwarded-For của Caddy, sổ đơn ngoài thư mục mã; không
 *      bao giờ KHONG_HTTPS; không chạy bằng root.
 *   3. File bí mật mẫu: không đặt được biến cố định, dòng mật khẩu đúng dạng script điền, không có bí mật thật.
 *   4. Script: cú pháp bash; ba bộ đường dẫn khớp nhau; mỗi bản dựng và kiểm thử trong thư mục riêng, đạt mới
 *      chuyển liên kết hien-tai sang (dịch vụ tự chạy lại giữa chừng vẫn chạy bản cũ), bản mới không trả lời thì về
 *      bản cũ; tường lửa không mở 8787.
 *   5. Ranh giới quyền (rà soát bảo mật 02/11/2026): mọi thứ root đọc, chép hay chạy — kho, các bản, cai-dat/, chính
 *      script — thuộc root. beeftown (npm ci, kể cả script cài của thư viện) chỉ ghi được node_modules lúc dựng và
 *      thư mục nhà; không thì một thư viện bị chèn mã sửa file dịch vụ mà root sắp cài (User=root) và lên root.
 *
 * SePay đổi IP (developer.sepay.vn/vi/dia-chi-ip): sửa IP_SEPAY dưới đây và Caddyfile.mau cùng một PR.
 */

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — BỘ CÀI MÁY CHỦ ĐƠN LÊN MÁY CHỦ THUÊ');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');

// developer.sepay.vn/vi/dia-chi-ip, đọc 02/11/2026.
const IP_SEPAY = [
  '172.236.138.20', '172.233.83.68', '171.244.35.2', '151.158.108.68', '151.158.109.79', '103.255.238.139', '45.57.137.67',
  '2400:8905::2000:8cff:fe98:45cd', '2600:3c15::2000:8aff:fedd:874b',
];

const caddy = doc('may-chu-don/cai-dat/Caddyfile.mau');
const dichVu = doc('may-chu-don/cai-dat/may-chu-don.service');
const mau = doc('may-chu-don/cai-dat/may-chu-don.env.mau');
const sh = doc('may-chu-don/cai-dat/may-chu.sh');
const main = doc('may-chu-don/src/main.ts');
const mayChu = doc('may-chu-don/src/may-chu.ts');

/** Bỏ chú thích (# tới hết dòng) để không khớp nhầm chữ trong lời giải thích. */
const boChuThich = chu => chu.split('\n').map(d => d.replace(/(^|\s)#.*$/, '')).join('\n');
const caddyMa = boChuThich(caddy);
const dichVuMa = boChuThich(dichVu);
const shMa = boChuThich(sh);
/** Giá trị một biến gán ở đầu script: TEN=giá trị. */
const bienSh = ten => shMa.match(new RegExp(`^${ten}=(.*)$`, 'm'))?.[1]?.replace(/^"|"$/g, '');
/** Thân một hàm bash: từ "ten() {" tới dòng "}" đầu tiên ở đầu dòng. */
const thanHam = ten => shMa.match(new RegExp(`\\n${ten}\\(\\) \\{\\n([\\s\\S]*?)\\n\\}\\n`))?.[1] ?? '';
const execStart = dichVuMa.match(/^ExecStart=(.*)$/m)?.[1] ?? '';
const bienExec = Object.fromEntries([...execStart.matchAll(/\b([A-Z_]+)=(\S+)/g)].map(m => [m[1], m[2]]));

await nhom('1 · Caddy: HTTPS, tin tiền về chỉ từ SePay, không nhật ký truy cập', async () => {
  const khoi = caddyMa.match(/@khong_phai_sepay \{([\s\S]*?)\}/)?.[1] ?? '';
  const ip = (khoi.match(/not remote_ip (.*)/)?.[1] ?? '').trim().split(/\s+/).filter(Boolean);
  ok('Danh sách IP được gọi /sepay… đúng bằng danh sách SePay công bố (không thiếu, không thừa)',
    ip.length === IP_SEPAY.length && IP_SEPAY.every(x => ip.includes(x)), `Caddyfile: ${ip.join(' ')}`);
  ok('Chặn theo IP kết nối thật (remote_ip), không theo X-Forwarded-For khách tự ghi (client_ip)',
    /not remote_ip /.test(khoi) && !/client_ip/.test(caddyMa));
  ok('Matcher bao /sepay và mọi đường dưới /sepay/ — không chỉ đúng một đường', /path \/sepay \/sepay\/\*/.test(khoi));
  ok('IP khác gọi /sepay… → 403, không tới máy chủ đơn', /respond @khong_phai_sepay .* 403/.test(caddyMa));
  ok('Đường /sepay/tien-ve của máy chủ đơn vẫn nằm dưới /sepay/ (đổi đường thì đổi cả matcher)',
    mayChu.includes("duong === '/sepay/tien-ve'"));
  const proxy = [...caddyMa.matchAll(/reverse_proxy (.*)/g)].map(m => m[1].trim());
  ok('Chỉ một reverse_proxy, tới 127.0.0.1 đúng cổng của dịch vụ', proxy.length === 1 && proxy[0] === `127.0.0.1:${bienExec.CONG}`,
    proxy.join(', '));
  ok('Không ghi nhật ký truy cập (khóa xem đơn nằm trong địa chỉ)', !/^\s*log\b/m.test(caddyMa));
  ok('Không tin proxy nào đứng trước (trusted_proxies) — IP Caddy đặt vào X-Forwarded-For là IP kết nối thật',
    !/trusted_proxies/.test(caddyMa));
  ok('Tên miền là chỗ trống TEN_MIEN_MAY_CHU để script thay', /^TEN_MIEN_MAY_CHU \{$/m.test(caddyMa));
  ok('Không qua Cloudflare (tunnel / proxy): dữ liệu khách Mini App xử lý ở Việt Nam', !/cloudflare|tunnel/i.test(caddyMa));
});

await nhom('2 · systemd: chỉ nghe trong máy, sau proxy, sổ đơn ngoài thư mục mã, không root', async () => {
  ok('ExecStart đặt cố định DIA_CHI_NGHE=127.0.0.1, TIN_PROXY=1 qua /usr/bin/env (file bí mật không đè được)',
    execStart.startsWith('/usr/bin/env ') && bienExec.DIA_CHI_NGHE === '127.0.0.1' && bienExec.TIN_PROXY === '1', execStart);
  ok('Mọi biến trên ExecStart đều được main.ts đọc (đổi tên biến thì đổi cả đây)',
    Object.keys(bienExec).every(b => b.startsWith('BUN_') || main.includes(`env.${b}`)), Object.keys(bienExec).join(', '));
  ok('Không bao giờ KHONG_HTTPS trên máy chủ thật (cookie quầy phải có cờ Secure)', !/KHONG_HTTPS/.test(dichVuMa));
  ok('Chạy bằng người dùng beeftown, không phải root', /^User=beeftown$/m.test(dichVuMa) && !/^User=root/m.test(dichVuMa));
  ok('Tự chạy lại khi hỏng, tự bật khi máy khởi động', /^Restart=always$/m.test(dichVuMa) && /^WantedBy=multi-user\.target$/m.test(dichVuMa));
  const duLieu = bienExec.THU_MUC_DU_LIEU;
  ok('Sổ đơn nằm ngoài mọi thư mục mã (dọn bản cũ không đụng tới)',
    !!duLieu && !duLieu.startsWith(bienSh('GOC') ?? '/opt/beeftown'), duLieu);
  ok('Chỉ ghi được thư mục sổ đơn (ProtectSystem=strict, ReadWritePaths đúng THU_MUC_DU_LIEU)',
    /^ProtectSystem=strict$/m.test(dichVuMa) && dichVuMa.match(/^ReadWritePaths=(.*)$/m)?.[1] === duLieu);
  ok('Script và dịch vụ cùng một thư mục sổ đơn', bienSh('DU_LIEU') === duLieu, `${bienSh('DU_LIEU')} / ${duLieu}`);
  ok('Script và dịch vụ cùng một file bí mật', dichVuMa.match(/^EnvironmentFile=(.*)$/m)?.[1] === '/etc/beeftown/may-chu-don.env'
    && bienSh('THU_MUC_BI_MAT') === '/etc/beeftown' && /BI_MAT="\$THU_MUC_BI_MAT\/may-chu-don\.env"/.test(shMa));
  ok('Dịch vụ chạy từ liên kết hien-tai của script (bản đã qua kiểm thử), không từ kho tải về',
    bienSh('HIEN_TAI') === '$GOC/hien-tai' && bienSh('GOC') === '/opt/beeftown' && bienSh('KHO') === '$GOC/kho'
      && dichVuMa.includes('WorkingDirectory=/opt/beeftown/hien-tai/may-chu-don')
      && execStart.includes('/opt/beeftown/hien-tai/may-chu-don/node_modules/.bin/bun src/main.ts') && !/\/opt\/beeftown\/kho/.test(dichVuMa));
  ok('Cổng của dịch vụ là cổng script hỏi khi đợi máy chủ', shMa.includes(`http://127.0.0.1:${bienExec.CONG}/suc-khoe`));
});

await nhom('3 · File bí mật mẫu: không biến cố định, đúng dạng script điền, không bí mật thật', async () => {
  const dong = mau.split('\n').filter(d => /^[A-Z_]+=/.test(d));
  const ten = dong.map(d => d.split('=')[0]);
  ok('Không đặt biến cố định hay biến chỉ để thử (KHONG_HTTPS, DIA_CHI_NGHE, TIN_PROXY, CONG, THU_MUC_DU_LIEU, CHO_TRA_GIA_THU)',
    !ten.some(t => ['KHONG_HTTPS', 'DIA_CHI_NGHE', 'TIN_PROXY', 'CONG', 'THU_MUC_DU_LIEU', 'CHO_TRA_GIA_THU'].includes(t)), ten.join(', '));
  ok('Dòng MAT_KHAU_QUAY= và KHOA_SUC_KHOE= để trống đúng dạng script điền (sed "^TEN=$")',
    dong.includes('MAT_KHAU_QUAY=') && dong.includes('KHOA_SUC_KHOE=')
      && shMa.includes('s/^MAT_KHAU_QUAY=$/') && shMa.includes('s/^KHOA_SUC_KHOE=$/'));
  ok('Mọi dòng đang bật đều trống (mẫu không mang bí mật thật)', dong.every(d => d.endsWith('=')), dong.join(' | '));
  const moiTen = [...mau.matchAll(/^#?([A-Z_]{4,})=/gm)].map(m => m[1]);
  ok('Mọi biến trong mẫu đều được main.ts đọc', moiTen.length >= 8 && moiTen.every(t => main.includes(`env.${t}`)), moiTen.join(', '));
  ok('Bốn dòng tài khoản và khóa SePay để tắt sẵn (đặt đủ bốn hoặc không cái nào)',
    ['NGAN_HANG_BIN', 'TEN_NGAN_HANG', 'SO_TAI_KHOAN', 'TEN_TAI_KHOAN', 'SEPAY_KHOA_KY'].every(t => new RegExp(`^#${t}=`, 'm').test(mau)));
});

await nhom('4 · Script: cú pháp, kiểm thử trước khi chạy lại, quay về bản cũ, tường lửa', async () => {
  const cuPhap = spawnSync('bash', ['-n', join(GOC, 'may-chu-don/cai-dat/may-chu.sh')], { encoding: 'utf8' });
  ok('bash -n: cú pháp đúng', cuPhap.status === 0, cuPhap.stderr);
  ok('set -euo pipefail: lệnh nào hỏng là dừng, không chạy tiếp nửa vời', /^set -euo pipefail$/m.test(shMa));
  ok('Tải mã từ repo công khai, nhánh main', bienSh('KHO_MA') === 'https://github.com/volekhanh123/beeftown-stock.git'
    && bienSh('NHANH') === 'main');
  ok('Dòng cuối gọi hàm chính và exit trên cùng một dòng (file bị thay giữa chừng thì bash không đọc tiếp)',
    sh.trimEnd().split('\n').at(-1) === 'chinh "$@"; exit $?');

  const dung = thanHam('dung_ban');
  const vt = (than, chu) => than.indexOf(chu);
  ok('dung_ban: mỗi bản một thư mục theo commit, cài thư viện và kiểm thử trong thư mục đó',
    dung.includes('thu_muc="$BAN/$1"') && /npm ci/.test(dung) && /"\$thu_muc\/may-chu-don" npx bun test\/thu\.ts/.test(dung));
  ok('dung_ban: mỗi bước hỏng (lấy mã, npm ci, kiểm thử) đều xóa thư mục dở và trả 1',
    (dung.match(/rm -rf "\$thu_muc"; return 1|rm -rf "\$thu_muc"\n\s*return 1/g) ?? []).length === 3);
  ok('dung_ban: đánh dấu "đã kiểm thử" chỉ sau khi kiểm thử đạt (bản dở không bao giờ được dùng lại)',
    vt(dung, 'touch "$thu_muc/.da-kiem-thu"') > vt(dung, 'npx bun test/thu.ts') && /\.da-kiem-thu" \]; then return 0/.test(dung));
  ok('dung_ban: root lấy mã bằng git archive (pipefail của script: git hỏng thì không giải nén nửa vời)',
    /git -C "\$KHO" archive "\$cm" \| tar -x --no-same-owner/.test(dung) && /^set -euo pipefail$/m.test(shMa));
  ok('chuyen_sang: đổi liên kết trong một bước (ln tạm rồi mv -T)', /ln -sfn[\s\S]*mv -Tf "\$HIEN_TAI\.moi" "\$HIEN_TAI"/.test(thanHam('chuyen_sang')));

  const capNhat = thanHam('lenh_cap_nhat');
  ok('cap-nhat: dựng và kiểm thử bản mới TRƯỚC khi chuyển liên kết, chuyển rồi mới chạy lại dịch vụ',
    vt(capNhat, 'dung_ban "$moi"') > 0 && vt(capNhat, 'chuyen_sang "$moi"') > vt(capNhat, 'dung_ban "$moi"')
      && vt(capNhat, 'systemctl restart "$DICH_VU"') > vt(capNhat, 'chuyen_sang "$moi"'));
  ok('cap-nhat: bản mới hỏng kiểm thử → báo lỗi, không chuyển, bản cũ vẫn chạy', /dung_ban "\$moi" \|\| loi "Bản mới/.test(capNhat));
  ok('cap-nhat: bản mới không trả lời → trỏ liên kết về bản cũ, chạy lại, báo lỗi',
    /Quay về bản cũ[\s\S]*?chuyen_sang "\$cu"[\s\S]*?systemctl restart[\s\S]*?loi "Bản mới/.test(capNhat));
  ok('cap-nhat: dọn bản cũ chỉ sau khi bản mới đã chạy; dọn luôn giữ bản đang chạy',
    vt(capNhat, 'don_ban_cu') > vt(capNhat, 'cho_may_chu') && /!= "\$dang"/.test(thanHam('don_ban_cu')));

  const cai = thanHam('lenh_cai');
  ok('cai: kiểm thử đạt mới bật dịch vụ', vt(cai, 'dung_ban "$cm"') > 0 && vt(cai, 'systemctl restart "$DICH_VU"') > vt(cai, 'dung_ban "$cm"'));
  ok('cai: chạy lại khi đã có bản đang chạy thì giữ bản đó (bản mới chỉ qua cap-nhat)', /if \[ -z "\$cm" \]; then/.test(cai));
  ok('cai: không đè file bí mật đã có (chạy lại không đổi mật khẩu quầy)', /if \[ ! -f "\$BI_MAT" \]; then/.test(cai));
  ok('cai: file bí mật chỉ root và dịch vụ đọc (0640), sổ đơn chỉ dịch vụ (0700)',
    /chmod 0640 "\$BI_MAT"/.test(cai) && /install -d -o beeftown -g beeftown -m 0700 "\$DU_LIEU"/.test(cai));
  ok('cai: tên miền kiểm dạng trước khi đưa vào sed và Caddyfile', cai.indexOf('grep -Eq') > 0
    && cai.indexOf('grep -Eq') < cai.indexOf('printf \'%s\\n\' "$ten_mien" >"$TEP_TEN_MIEN"'));

  const thuc = thanHam('giu_may_thuc');
  ok('Laptop (có pin): gập máy không ngủ, tắt ngủ / ngủ đông; máy không pin thì bỏ qua',
    /compgen -G '\/sys\/class\/power_supply\/BAT\*' >\/dev\/null \|\| return 0/.test(thuc)
      && /HandleLidSwitch=ignore/.test(thuc) && /HandleLidSwitchExternalPower=ignore/.test(thuc)
      && /systemctl mask sleep\.target suspend\.target hibernate\.target hybrid-sleep\.target/.test(thuc)
      && cai.indexOf('giu_may_thuc') > 0 && cai.indexOf('giu_may_thuc') < cai.indexOf('systemctl restart "$DICH_VU"'));

  const tuongLua = thanHam('dat_tuong_lua');
  ok('Tường lửa mở SSH, 80, 443 — không bao giờ mở cổng máy chủ đơn',
    /ufw allow 80\/tcp/.test(tuongLua) && /ufw allow 443\/tcp/.test(tuongLua) && /ufw allow "\$c\/tcp"/.test(tuongLua)
      && !new RegExp(`ufw allow ${bienExec.CONG}`).test(shMa));
  ok('Caddyfile mới phải qua "caddy validate" trước khi thay bản đang chạy',
    thanHam('dat_cau_hinh').indexOf('caddy validate') < thanHam('dat_cau_hinh').indexOf('install -m 0644 "$tam" /etc/caddy/Caddyfile'));
  ok('Chỉ giữ một bản Caddyfile trước (không tích file theo giờ)', /cp \/etc\/caddy\/Caddyfile \/etc\/caddy\/Caddyfile\.truoc;/.test(shMa));

  const khongLenh = spawnSync('bash', [join(GOC, 'may-chu-don/cai-dat/may-chu.sh')], { encoding: 'utf8' });
  ok('Không lệnh → in cách dùng, mã thoát 1', khongLenh.status === 1 && khongLenh.stdout.includes('Cách dùng'));
  if (process.getuid?.() !== 0) {
    const khongRoot = spawnSync('bash', [join(GOC, 'may-chu-don/cai-dat/may-chu.sh'), 'cai', 'don.beeftown.vn'], { encoding: 'utf8' });
    ok('Không phải root → dừng ngay, không cài gì', khongRoot.status === 1 && khongRoot.stderr.includes('quyền root'));
  }
});

await nhom('5 · Ranh giới quyền: beeftown không sửa được thứ root sắp chạy', async () => {
  const dung = thanHam('dung_ban');
  const cai = thanHam('lenh_cai');
  const lenhBeeftown = [...shMa.matchAll(/la_beeftown "([^"]+)" ([^\n]*)/g)].map(m => `${m[1]} ${m[2]}`);
  ok('beeftown chỉ chạy npm ci và kiểm thử, trong thư mục may-chu-don của bản đang dựng',
    lenhBeeftown.length === 2 && lenhBeeftown.every(l => l.startsWith('$thu_muc/may-chu-don npm ci') || l.startsWith('$thu_muc/may-chu-don npx bun test/thu.ts')),
    lenhBeeftown.join(' | '));
  ok('Git (clone, fetch, reset, archive, log) chạy bằng root trên kho của root, không bằng beeftown',
    !/runuser[^\n]*git|la_beeftown[^\n]*git/.test(shMa) && /git clone --quiet --depth 1 --branch "\$NHANH" "\$KHO_MA" "\$KHO"/.test(cai));
  ok('/opt/beeftown và thư mục các bản thuộc root (beeftown không cắm được liên kết vào chỗ root xóa, chép)',
    /install -d -o root -g root -m 0755 "\$GOC"/.test(cai) && /install -d -o root -g root -m 0755 "\$BAN" "\$thu_muc"/.test(dung));
  ok('Lúc dựng, beeftown chỉ ghi được node_modules; kiểm thử xong thì node_modules cũng về root',
    /install -d -o beeftown -g beeftown -m 0755 "\$thu_muc\/may-chu-don\/node_modules"/.test(dung)
      && dung.indexOf('chown -R root:root "$thu_muc/may-chu-don/node_modules"') > dung.indexOf('npx bun test/thu.ts'));
  ok('Đánh dấu "đã kiểm thử" do root ghi (beeftown không tự đánh dấu một bản dở)', /\n\s*touch "\$thu_muc\/\.da-kiem-thu"/.test(dung));
  ok('Nhà của beeftown là thư mục riêng (bộ đệm npm, bun), không phải /opt/beeftown',
    bienSh('NHA') === '$GOC/nha' && /useradd --system --home-dir "\$NHA"/.test(cai) && /HOME="\$NHA"/.test(shMa));
  ok('Dọn bản cũ: không đi theo liên kết, không dấu / cuối (rm -rf liên-kết/ xóa nội dung đích)',
    /ls -1dt "\$BAN"\/\* /.test(thanHam('don_ban_cu')) && /\[ ! -L "\$d" \]/.test(thanHam('don_ban_cu')));
});

process.exit(ketThuc('BỘ CÀI MÁY CHỦ ĐƠN'));
