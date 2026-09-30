#!/usr/bin/env bash
# =============================================================================
# KHÔI PHỤC MỘT BẢN SAO LƯU VÀO MỘT DATABASE TRỐNG — và kiểm nó đủ
# =============================================================================
#
#     SAO_LUU_MAT_KHAU=… bash crm/sao-luu/khoi-phuc.sh <file .tar.gz.gpg> <chuỗi kết nối database ĐÍCH>
#
# Dùng hai chỗ, cùng một đoạn mã:
#   · mỗi đêm, workflow sao-luu.yml khôi phục THỬ bản vừa tạo vào một Supabase dựng tạm trong
#     máy CI — bản sao không khôi phục được thì coi như không có;
#   · khi cần cứu dữ liệu thật: khôi phục vào một project Supabase MỚI (README gốc, mục "Sao lưu
#     và khôi phục").
#
# Đích phải TRỐNG: schema public đã có bảng → dừng, không đụng gì. Chốt này chặn việc lỡ tay
# khôi phục đè lên database đang chạy.
#
# Theo hướng dẫn của Supabase: một giao dịch duy nhất (hỏng giữa chừng → không để lại gì), tắt
# trigger khi nạp dữ liệu (session_replication_role = replica — không mã hoá hai lần, không chạy
# lại trigger ghi sổ). Những dòng chỉ Supabase nội bộ chạy được (cấp quyền tham số, vai trò
# cli_login_postgres, đổi chủ sang supabase_admin) được chuyển thành chú thích — đúng mục
# "Troubleshooting" của hướng dẫn đó — và in ra số dòng đã bỏ.
#
# Kiểm sau khi nạp: mọi bảng có đúng số dòng như lúc sao lưu (so-dong.tsv, đếm trong chính file
# sao lưu) — một câu SQL, một kết nối; kho_doi_soat_ton() rỗng (sổ kho khớp tồn). Lệch → thoát 1.
# In dòng cuối "KET_QUA=dat SO_BANG=… SO_DONG=…" khi mọi thứ khớp.
#
# Chạy được trên Linux, WSL và macOS (sed không -i, sha256sum hoặc shasum) — cần psql và gpg.
set -euo pipefail

: "${SAO_LUU_MAT_KHAU:?Thiếu SAO_LUU_MAT_KHAU (mật khẩu mã hoá bản sao lưu)}"
TEP=${1:?Cách dùng: khoi-phuc.sh <file .tar.gz.gpg> <database đích>}
DICH=${2:?Cách dùng: khoi-phuc.sh <file .tar.gz.gpg> <database đích>}
[ -s "$TEP" ] || { echo "Không có file: $TEP" >&2; exit 1; }

TAM=$(mktemp -d)
trap 'rm -rf "$TAM"' EXIT
chay_sql() { psql "$DICH" -X -At -v ON_ERROR_STOP=1 -c "$1"; }
# sha256 của một file: sha256sum (Linux) hoặc shasum -a 256 (macOS).
bam() {
  if command -v sha256sum > /dev/null 2>&1; then sha256sum "$1"; else shasum -a 256 "$1"; fi | cut -d' ' -f1
}

echo "1/4 · Giải mã…"
if ! gpg --batch --quiet --pinentry-mode loopback --passphrase-fd 3 --decrypt "$TEP" 3<<< "$SAO_LUU_MAT_KHAU" \
     | tar -C "$TAM" -xzf -; then
  echo "Không giải mã được — sai mật khẩu, hoặc file hỏng / tải thiếu." >&2
  exit 1
fi
SO_MA=0
while read -r ma ten; do
  if [ ! -f "$TAM/$ten" ] || [ "$(bam "$TAM/$ten")" != "$ma" ]; then
    echo "File trong bản sao không khớp mã kiểm (sha256): $ten — bản sao hỏng." >&2
    exit 1
  fi
  SO_MA=$((SO_MA + 1))
done < <(grep -E '^[0-9a-f]{64}  ' "$TAM/thong-tin.txt")
[ "$SO_MA" -eq 4 ] || { echo "Bản sao thiếu mã kiểm (có $SO_MA/4 file) — bản sao hỏng." >&2; exit 1; }
sed -n '1,3p' "$TAM/thong-tin.txt"

echo "2/4 · Kiểm database đích…"
DA_CO=$(chay_sql "select count(*) from pg_tables where schemaname = 'public'")
if [ "$DA_CO" -ne 0 ]; then
  echo "Database đích đã có $DA_CO bảng trong schema public — chỉ khôi phục vào database MỚI, TRỐNG. Không làm gì." >&2
  exit 1
fi

echo "3/4 · Nạp vai trò, cấu trúc, dữ liệu (một giao dịch)…"
BO=0
for f in roles.sql schema.sql; do
  n=$(grep -cE '^(GRANT SET ON PARAMETER |GRANT "postgres" TO "cli_login_postgres"|ALTER .* OWNER TO "supabase_admin")' "$TAM/$f" || true)
  BO=$((BO + n))
  sed -E 's/^(GRANT SET ON PARAMETER .*|GRANT "postgres" TO "cli_login_postgres".*|ALTER .* OWNER TO "supabase_admin".*)$/-- (bỏ khi khôi phục) \1/' \
    "$TAM/$f" > "$TAM/$f.moi"
  mv "$TAM/$f.moi" "$TAM/$f"
done
echo "   Bỏ $BO dòng chỉ Supabase nội bộ chạy được."
psql "$DICH" -X -q --single-transaction -v ON_ERROR_STOP=1 \
  --file "$TAM/roles.sql" \
  --file "$TAM/schema.sql" \
  --command 'SET session_replication_role = replica' \
  --file "$TAM/data.sql" > "$TAM/nap.log"

echo "4/4 · Kiểm số dòng từng bảng…"
# Tên bảng được ghép vào câu SQL → chỉ nhận chữ thường, số, gạch dưới (dem-dong.sh cũng đã chặn).
while IFS=$'\t' read -r bang _; do
  [[ "$bang" =~ ^[a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*$ ]] || { echo "Tên bảng lạ: $bang" >&2; exit 1; }
done < "$TAM/so-dong.tsv"
DEM_SQL=$(awk -F'\t' '{ printf "%sselect %c%s%c, count(*) from %s", (NR > 1 ? " union all " : ""), 39, $1, 39, $1 }' "$TAM/so-dong.tsv")
chay_sql "$DEM_SQL" > "$TAM/khoi-phuc.txt"
if ! awk -F'|' '
  NR == FNR { can[$1] = $2; next }
  { co[$1] = $2 }
  END {
    for (b in can) if (!(b in co) || co[b] != can[b]) {
      printf "   LỆCH %s: sao lưu có %s dòng, khôi phục được %s.\n", b, can[b], ((b in co) ? co[b] : "?")
      n++
    }
    if (n) { printf "%d bảng lệch số dòng — bản khôi phục KHÔNG đầy đủ.\n", n; exit 1 }
  }' <(tr '\t' '|' < "$TAM/so-dong.tsv") "$TAM/khoi-phuc.txt" >&2; then
  exit 1
fi
SO_KHO=$(chay_sql "select count(*) from public.kho_doi_soat_ton()")
if [ "$SO_KHO" -ne 0 ]; then
  echo "Sổ kho sau khôi phục lệch tồn ở $SO_KHO lô — bản khôi phục không dùng được." >&2
  exit 1
fi

SO_BANG=$(wc -l < "$TAM/so-dong.tsv" | tr -d ' ')
SO_DONG=$(awk -F'\t' '{ s += $2 } END { print s + 0 }' "$TAM/so-dong.tsv")
echo "Khôi phục xong và khớp: $SO_BANG bảng, $SO_DONG dòng; sổ kho khớp tồn."
echo "KET_QUA=dat SO_BANG=$SO_BANG SO_DONG=$SO_DONG"
