#!/usr/bin/env bash
# Máy chủ đơn của Mini App trên máy chủ thuê ở Việt Nam (Ubuntu 24.04). Hướng dẫn từng bước: may-chu-don/README.md,
# mục "Đưa lên máy chủ thuê".
#
#   sudo bash may-chu.sh cai don.beeftown.vn   lần đầu: cài Node, Caddy (HTTPS), dịch vụ, tường lửa, mật khẩu quầy
#   sudo bash may-chu.sh cap-nhat              lấy bản mới của main, chạy kiểm thử, rồi mới chuyển máy chủ sang
#   sudo bash may-chu.sh trang-thai            máy chủ có chạy không, đang ở bản nào, nhật ký gần nhất
#
# Mỗi bản mã nằm trong một thư mục riêng /opt/beeftown/ban/<commit>, cài thư viện và chạy kiểm thử ở ĐÓ. Dịch vụ chạy
# từ /opt/beeftown/hien-tai — một liên kết tới bản đang dùng. Bản mới chỉ được chuyển sang (đổi liên kết, một bước)
# sau khi kiểm thử đạt; hỏng ở bất kỳ bước nào trước đó thì bản đang chạy không bị đụng tới, kể cả khi dịch vụ tự chạy
# lại giữa chừng. Bản mới không trả lời thì liên kết trỏ về bản cũ.
#
# Ranh giới quyền: mọi thứ root đọc, chép hay chạy (kho, các bản, cai-dat/, chính script này) thuộc root. Người dùng
# beeftown chỉ ghi được node_modules của bản đang dựng (npm ci chạy bằng beeftown, kể cả script cài của thư viện) và
# thư mục nhà riêng — một thư viện bị chèn mã không sửa được file dịch vụ hay Caddyfile mà root sắp cài.
#
# Chạy lại "cai" không mất gì: không đè mật khẩu, không xóa sổ đơn. Sổ đơn ở /var/lib/beeftown-may-chu-don, ngoài
# mọi thư mục mã.
set -euo pipefail

KHO_MA=https://github.com/volekhanh123/beeftown-stock.git
NHANH=main
GOC=/opt/beeftown
KHO="$GOC/kho"
BAN="$GOC/ban"
HIEN_TAI="$GOC/hien-tai"
NHA="$GOC/nha"
GIU_BAN=3
DU_LIEU=/var/lib/beeftown-may-chu-don
THU_MUC_BI_MAT=/etc/beeftown
BI_MAT="$THU_MUC_BI_MAT/may-chu-don.env"
TEP_TEN_MIEN="$THU_MUC_BI_MAT/ten-mien"
NHAT_KY_THU=/var/log/beeftown-kiem-thu.log
DICH_VU=may-chu-don

bao() { printf '\n==> %s\n' "$*"; }
loi() { printf '\nLỖI: %s\n' "$*" >&2; exit 1; }

can_root() { [ "$(id -u)" -eq 0 ] || loi "Chạy bằng quyền root: sudo bash $0 $*"; }

# Chạy một lệnh bằng người dùng beeftown (không phải root) trong thư mục $1.
la_beeftown() { local o="$1"; shift; runuser -u beeftown -- env -C "$o" HOME="$NHA" "$@"; }

doc_bi_mat() { grep -E "^$1=" "$BI_MAT" 2>/dev/null | tail -n 1 | cut -d= -f2- || true; }

# Chữ ngẫu nhiên chỉ chữ thường và số (dễ gõ trên máy tính bảng ở quầy).
ngau_nhien() { tr -dc 'a-z0-9' </dev/urandom | head -c "$1" || true; }

# Commit mà dịch vụ đang chạy (tên thư mục mà hien-tai trỏ tới); chưa có thì rỗng.
ban_dang_chay() { basename "$(readlink -f "$HIEN_TAI" 2>/dev/null || echo khong)" | grep -E '^[0-9a-f]{40}$' || true; }

mo_ta_ban() { git -C "$KHO" log -1 --format='%h · %cd · %s' --date=format:'%d/%m/%Y %H:%M' "$1" 2>/dev/null || echo "${1:0:7}"; }

# Dựng bản $1 trong thư mục riêng: lấy mã (root), cài thư viện và chạy kiểm thử (beeftown, giống CI "Kiểm thử") ngay
# trên máy này, rồi khóa cả bản về root. Hỏng bước nào thì xóa thư mục dở và trả 1 — bản đang chạy không bị đụng tới.
dung_ban() {
  local cm="$1" thu_muc="$BAN/$1"
  if [ -f "$thu_muc/.da-kiem-thu" ]; then return 0; fi
  rm -rf "$thu_muc"
  install -d -o root -g root -m 0755 "$BAN" "$thu_muc"
  bao "Lấy mã bản ${cm:0:7} vào thư mục riêng"
  if ! { git -C "$KHO" archive "$cm" | tar -x --no-same-owner -C "$thu_muc"; }; then rm -rf "$thu_muc"; return 1; fi
  # beeftown chỉ ghi được node_modules; phần còn lại của bản (gồm cai-dat/) thuộc root.
  install -d -o beeftown -g beeftown -m 0755 "$thu_muc/may-chu-don/node_modules"
  bao "Cài thư viện máy chủ đơn (npm ci)"
  if ! la_beeftown "$thu_muc/may-chu-don" npm ci --no-audit --no-fund --loglevel=error; then rm -rf "$thu_muc"; return 1; fi
  bao "Chạy kiểm thử máy chủ đơn trên máy này (khoảng 30 giây)"
  if ! la_beeftown "$thu_muc/may-chu-don" npx bun test/thu.ts >"$NHAT_KY_THU" 2>&1; then
    tail -n 25 "$NHAT_KY_THU" >&2
    rm -rf "$thu_muc"
    return 1
  fi
  tail -n 1 "$NHAT_KY_THU"
  chown -R root:root "$thu_muc/may-chu-don/node_modules"
  touch "$thu_muc/.da-kiem-thu"
}

# Trỏ hien-tai sang bản $1 trong một bước (mv -T thay liên kết, không có lúc nào thiếu liên kết).
chuyen_sang() {
  ln -sfn "$BAN/$1" "$HIEN_TAI.moi"
  mv -Tf "$HIEN_TAI.moi" "$HIEN_TAI"
}

# Chép cấu hình systemd và Caddy của bản đang trỏ tới. Chỉ nạp lại khi file đổi; Caddyfile mới phải qua "caddy validate".
dat_cau_hinh() {
  local ten_mien tam mau="$HIEN_TAI/may-chu-don/cai-dat"
  ten_mien="$(cat "$TEP_TEN_MIEN")"
  if ! cmp -s "$mau/may-chu-don.service" "/etc/systemd/system/$DICH_VU.service"; then
    install -m 0644 "$mau/may-chu-don.service" "/etc/systemd/system/$DICH_VU.service"
    systemctl daemon-reload
  fi
  tam="$(mktemp)"
  sed "s/TEN_MIEN_MAY_CHU/$ten_mien/" "$mau/Caddyfile.mau" >"$tam"
  if ! cmp -s "$tam" /etc/caddy/Caddyfile; then
    if ! caddy validate --adapter caddyfile --config "$tam" >/dev/null 2>&1; then
      caddy validate --adapter caddyfile --config "$tam" || true
      rm -f "$tam"
      return 1
    fi
    if [ -f /etc/caddy/Caddyfile ]; then cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.truoc; fi
    install -m 0644 "$tam" /etc/caddy/Caddyfile
    systemctl reload caddy || systemctl restart caddy
  fi
  rm -f "$tam"
}

# Đợi máy chủ đơn trả lời /suc-khoe (tối đa 30 giây).
cho_may_chu() {
  local khoa i
  khoa="$(doc_bi_mat KHOA_SUC_KHOE)"
  for i in $(seq 1 30); do
    if curl -fs -o /dev/null "http://127.0.0.1:8787/suc-khoe?khoa=$khoa"; then return 0; fi
    sleep 1
  done
  return 1
}

# Giữ $GIU_BAN bản mới nhất, luôn giữ bản đang chạy.
don_ban_cu() {
  local dang d
  dang="$(ban_dang_chay)"
  ls -1dt "$BAN"/* 2>/dev/null | tail -n +"$((GIU_BAN + 1))" | while read -r d; do
    if [ "$(basename "$d")" != "$dang" ] && [ -d "$d" ] && [ ! -L "$d" ]; then rm -rf -- "$d"; fi
  done
}

cai_node() {
  if command -v node >/dev/null && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 24 ]; then return; fi
  bao "Cài Node.js 24 (kho NodeSource)"
  install -d -m 0755 /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_24.x nodistro main" \
    >/etc/apt/sources.list.d/nodesource.list
  apt-get update -q
  apt-get install -y -q nodejs
}

cai_caddy() {
  if command -v caddy >/dev/null; then return; fi
  bao "Cài Caddy (proxy HTTPS, tự lấy chứng chỉ)"
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key \
    | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt >/etc/apt/sources.list.d/caddy-stable.list
  chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -q
  apt-get install -y -q caddy
}

# Tường lửa: chỉ SSH, 80 (Caddy lấy chứng chỉ, chuyển sang HTTPS) và 443. Cổng 8787 của máy chủ đơn không bao giờ mở.
dat_tuong_lua() {
  local cong_ssh
  bao "Bật tường lửa: SSH, 80, 443"
  # Đọc cổng SSH đang dùng (máy chủ thuê có khi đổi khỏi 22) — mở trước khi bật, kẻo tự khóa mình ngoài máy.
  cong_ssh="$(sshd -T 2>/dev/null | awk '$1 == "port" { print $2 }' | sort -u || true)"
  [ -n "$cong_ssh" ] || cong_ssh=22
  for c in $cong_ssh; do ufw allow "$c/tcp" >/dev/null; done
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
  ufw allow 443/udp >/dev/null
  ufw --force enable >/dev/null
  ufw status | sed -n '1,12p'
}

lenh_cai() {
  local ten_mien="${1:-}" moi_tao=0 mat_khau='' cm
  [ -n "$ten_mien" ] || loi "Thiếu tên miền. Ví dụ: sudo bash $0 cai don.beeftown.vn"
  ten_mien="$(printf '%s' "$ten_mien" | tr 'A-Z' 'a-z')"
  printf '%s' "$ten_mien" | grep -Eq '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$' \
    || loi "Tên miền không hợp lệ: $ten_mien (chỉ chữ thường, số, dấu - và dấu chấm, ví dụ don.beeftown.vn)."
  # shellcheck disable=SC1091
  . /etc/os-release
  [ "${ID:-}" = ubuntu ] || [ "${ID:-}" = debian ] || loi "Bộ cài này viết cho Ubuntu 24.04 (máy này: ${PRETTY_NAME:-không rõ})."

  bao "Giờ của máy: Asia/Ho_Chi_Minh (để nhật ký đọc theo giờ Việt Nam)"
  timedatectl set-timezone Asia/Ho_Chi_Minh 2>/dev/null || true

  bao "Cài gói hệ thống"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -q
  apt-get install -y -q ca-certificates curl git gnupg ufw debian-keyring debian-archive-keyring apt-transport-https \
    unattended-upgrades
  cai_node
  cai_caddy

  bao "Người dùng beeftown (chạy máy chủ đơn, không đăng nhập được)"
  install -d -o root -g root -m 0755 "$GOC"
  id beeftown >/dev/null 2>&1 || useradd --system --home-dir "$NHA" --no-create-home --shell /usr/sbin/nologin beeftown
  install -d -o beeftown -g beeftown -m 0700 "$NHA"

  if [ ! -d "$KHO/.git" ]; then
    bao "Tải mã từ GitHub ($NHANH)"
    git clone --quiet --depth 1 --branch "$NHANH" "$KHO_MA" "$KHO"
  fi
  install -d -o beeftown -g beeftown -m 0700 "$DU_LIEU"

  # Lần cài đầu: dựng bản của kho. Đã có bản đang chạy (chạy lại "cai"): giữ nguyên bản đó — bản mới đi qua "cap-nhat".
  cm="$(ban_dang_chay)"
  if [ -z "$cm" ]; then
    cm="$(git -C "$KHO" rev-parse HEAD)"
    dung_ban "$cm" || loi "Bản ${cm:0:7} chưa qua kiểm thử trên máy này — chưa bật máy chủ. Nhật ký đủ: $NHAT_KY_THU"
    chuyen_sang "$cm"
  fi

  install -d -o root -g beeftown -m 0750 "$THU_MUC_BI_MAT"
  printf '%s\n' "$ten_mien" >"$TEP_TEN_MIEN"
  if [ ! -f "$BI_MAT" ]; then
    bao "Tạo mật khẩu quầy và khóa sức khỏe ngẫu nhiên"
    mat_khau="$(ngau_nhien 12)"
    sed -e "s/^MAT_KHAU_QUAY=$/MAT_KHAU_QUAY=$mat_khau/" -e "s/^KHOA_SUC_KHOE=$/KHOA_SUC_KHOE=$(ngau_nhien 32)/" \
      "$HIEN_TAI/may-chu-don/cai-dat/may-chu-don.env.mau" >"$BI_MAT"
    moi_tao=1
  fi
  chown root:beeftown "$BI_MAT"
  chmod 0640 "$BI_MAT"

  dat_cau_hinh || loi "Caddyfile không hợp lệ — chưa bật máy chủ."
  bao "Bật dịch vụ máy chủ đơn"
  systemctl enable "$DICH_VU" >/dev/null 2>&1
  systemctl restart "$DICH_VU"
  cho_may_chu || { journalctl -u "$DICH_VU" -n 30 --no-pager >&2; loi "Máy chủ đơn chưa trả lời sau 30 giây."; }

  dat_tuong_lua

  bao "Xong phần cài trên máy"
  echo "Máy chủ đơn bản $(mo_ta_ban "$cm") đang chạy ở 127.0.0.1:8787, Caddy đứng trước với tên miền $ten_mien."
  echo "IP công khai của máy này: $(curl -fsS -4 --max-time 5 https://api.ipify.org 2>/dev/null || echo 'không đọc được — xem trang quản lý máy chủ thuê')"
  if [ "$moi_tao" -eq 1 ]; then
    echo
    echo "MẬT KHẨU MÀN HÌNH QUẦY: $mat_khau"
    echo "Ghi lại ngay (chỉ in một lần). Đổi: sudo nano $BI_MAT rồi sudo systemctl restart $DICH_VU"
  fi
  echo
  echo "Việc tiếp theo (README, \"Đưa lên máy chủ thuê\"):"
  echo "  1. Trỏ tên miền $ten_mien về IP trên (bản ghi A; ở Cloudflare để DNS only — đám mây xám)."
  echo "  2. Đợi vài phút, mở https://$ten_mien/quay trên máy tính bảng ở quầy."
  echo "  3. Lần sau cập nhật: sudo bash $HIEN_TAI/may-chu-don/cai-dat/may-chu.sh cap-nhat"
}

lenh_cap_nhat() {
  local cu moi
  cu="$(ban_dang_chay)"
  { [ -n "$cu" ] && [ -d "$KHO/.git" ]; } || loi "Chưa cài. Chạy trước: sudo bash $0 cai <tên miền>"
  bao "Lấy bản mới của $NHANH"
  git -C "$KHO" fetch --quiet --depth 1 origin "$NHANH"
  moi="$(git -C "$KHO" rev-parse FETCH_HEAD)"
  if [ "$cu" = "$moi" ]; then
    echo "Đã là bản mới nhất ($(mo_ta_ban "$cu"))."
    return 0
  fi
  # Kho chỉ để lấy mã; dịch vụ không chạy từ đây, nên đổi kho không đụng tới bản đang chạy.
  git -C "$KHO" reset --quiet --hard "$moi"

  dung_ban "$moi" || loi "Bản mới ${moi:0:7} chưa qua kiểm thử trên máy này. Máy chủ vẫn chạy bản cũ ${cu:0:7}. Nhật ký đủ: $NHAT_KY_THU"

  bao "Chuyển máy chủ đơn sang bản ${moi:0:7}"
  chuyen_sang "$moi"
  if dat_cau_hinh && systemctl restart "$DICH_VU" && cho_may_chu; then
    don_ban_cu
    echo "Đang chạy bản $(mo_ta_ban "$moi")."
    return 0
  fi
  journalctl -u "$DICH_VU" -n 30 --no-pager >&2 || true
  bao "Quay về bản cũ ${cu:0:7}"
  chuyen_sang "$cu"
  dat_cau_hinh || true
  systemctl restart "$DICH_VU" || true
  cho_may_chu || loi "Bản mới hỏng và bản cũ ${cu:0:7} cũng chưa trả lời — xem: journalctl -u $DICH_VU -n 50"
  loi "Bản mới ${moi:0:7} không chạy được — đã quay về bản cũ ${cu:0:7}."
}

lenh_trang_thai() {
  local cm
  cm="$(ban_dang_chay)"
  [ -n "$cm" ] || loi "Chưa cài. Chạy trước: sudo bash $0 cai <tên miền>"
  bao "Bản đang chạy"
  mo_ta_ban "$cm"
  bao "Dịch vụ"
  for d in "$DICH_VU" caddy; do printf '%-12s %s\n' "$d" "$(systemctl is-active "$d" || true)"; done
  bao "Máy chủ đơn trả lời"
  if cho_may_chu; then echo "có (/suc-khoe trả 200)"; else echo "KHÔNG trả lời"; fi
  bao "Nhật ký gần nhất"
  journalctl -u "$DICH_VU" -n 15 --no-pager -o short-iso || true
}

# Bash đọc file script dần trong lúc chạy: gói phần chạy vào một hàm và gọi hàm cùng "exit" trên MỘT dòng, để file
# có bị thay giữa chừng (bản cài tải về được ghi đè) thì bash cũng không đọc tiếp phần đã đổi.
chinh() {
  local lenh="${1:-}"
  [ $# -gt 0 ] && shift
  case "$lenh" in
    cai) can_root cai; lenh_cai "$@" ;;
    cap-nhat) can_root cap-nhat; lenh_cap_nhat ;;
    trang-thai) can_root trang-thai; lenh_trang_thai ;;
    *)
      echo "Cách dùng:"
      echo "  sudo bash $0 cai <tên miền>   cài lần đầu (ví dụ: don.beeftown.vn)"
      echo "  sudo bash $0 cap-nhat         lấy bản mới, kiểm thử, chạy lại"
      echo "  sudo bash $0 trang-thai       xem máy chủ có chạy không"
      return 1
      ;;
  esac
}
chinh "$@"; exit $?
