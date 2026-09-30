#!/usr/bin/env bash
# =============================================================================
# SAO LƯU DATABASE BEEFTOWN — một file mã hoá
# =============================================================================
#
#     SAO_LUU_DB_URL=… SAO_LUU_MAT_KHAU=… bash crm/sao-luu/sao-luu.sh <thư mục ra>
#
# Chạy mỗi đêm ở .github/workflows/sao-luu.yml; chạy tay được trên máy có Docker, psql, gpg và
# Supabase CLI (đặt SUPABASE="npx supabase" nếu chưa cài CLI). Cách khôi phục: README gốc, mục
# "Sao lưu và khôi phục".
#
# Làm gì — theo đúng hướng dẫn "Backup and restore using the CLI" của Supabase:
#   1. supabase db dump ra ba file: roles.sql (vai trò), schema.sql (bảng, hàm, quyền, RLS),
#      data.sql (dữ liệu, dạng COPY, gồm cả auth.users). CLI chạy pg_dump trong Docker và bỏ các
#      schema nội bộ của Supabase — pg_dump thô sẽ kèm chúng và khôi phục bị lỗi quyền.
#   2. Đếm dòng từng bảng ngay trong data.sql (dem-dong.sh) → so-dong.tsv. Bản sao mà không có dữ
#      liệu của những bảng chính (chi nhánh, nhân sự, tài khoản đăng nhập) là hỏng → dừng.
#   3. Nén + mã hoá AES-256 bằng gpg với mật khẩu SAO_LUU_MAT_KHAU → beeftown-<ngày giờ VN>.tar.gz.gpg.
#      Mật khẩu mã hoá đi qua ống số 3, không nằm trên dòng lệnh (ps / log không thấy). File chưa
#      mã hoá chỉ nằm trong thư mục tạm, xoá khi thoát — kể cả khi hỏng giữa chừng.
#
# Chuỗi kết nối database THÌ nằm trên dòng lệnh (supabase db dump chỉ nhận --db-url): người khác
# cùng máy xem được bằng ps trong lúc chạy. Máy CI là máy riêng của một lượt; chạy tay thì chỉ chạy
# trên máy của mình, không chạy trên máy dùng chung.
#
# KHÔNG có trong bản sao: file trong Supabase Storage (CV ứng viên, ảnh) — chỉ có dòng mô tả
# của chúng trong storage.objects. Khóa bí mật của Worker (Cloudflare) cũng không.
#
# Ra: file .gpg trong <thư mục ra>, và <thư mục ra>/ket-qua.env (TEP, TEN, KICH_THUOC, PHIEN_BAN_PG,
# SO_BANG, SO_DONG) để workflow đọc. Hỏng bước nào → thoát khác 0, không có file .gpg nửa vời.
set -euo pipefail

: "${SAO_LUU_DB_URL:?Thiếu SAO_LUU_DB_URL (chuỗi kết nối Session pooler của database)}"
: "${SAO_LUU_MAT_KHAU:?Thiếu SAO_LUU_MAT_KHAU (mật khẩu mã hoá bản sao lưu)}"
RA=${1:?Cách dùng: sao-luu.sh <thư mục ra>}
if [ "${#SAO_LUU_MAT_KHAU}" -lt 20 ]; then
  echo "Mật khẩu sao lưu quá ngắn: cần ít nhất 20 ký tự." >&2
  exit 1
fi

DAY=$(cd "$(dirname "$0")" && pwd)
read -r -a SUPABASE <<< "${SUPABASE:-supabase}"
mkdir -p "$RA"
TAM=$(mktemp -d)
trap 'rm -rf "$TAM"' EXIT

echo "1/3 · Sao lưu vai trò, cấu trúc, dữ liệu…"
"${SUPABASE[@]}" db dump --db-url "$SAO_LUU_DB_URL" -f "$TAM/roles.sql" --role-only
"${SUPABASE[@]}" db dump --db-url "$SAO_LUU_DB_URL" -f "$TAM/schema.sql"
"${SUPABASE[@]}" db dump --db-url "$SAO_LUU_DB_URL" -f "$TAM/data.sql" --use-copy --data-only \
  -x storage.buckets_vectors -x storage.vector_indexes

echo "2/3 · Kiểm bản sao…"
for f in roles.sql schema.sql data.sql; do
  [ -s "$TAM/$f" ] || { echo "$f rỗng — bản sao hỏng." >&2; exit 1; }
done
bash "$DAY/dem-dong.sh" "$TAM/data.sql" > "$TAM/so-dong.tsv"
for bang in public.chi_nhanh public.nhan_su auth.users; do
  n=$(awk -F'\t' -v b="$bang" '$1 == b { print $2 }' "$TAM/so-dong.tsv")
  if [ -z "$n" ] || [ "$n" -eq 0 ]; then
    echo "data.sql không có dữ liệu của $bang — bản sao hỏng (hoặc sao nhầm database trống)." >&2
    exit 1
  fi
done
PHIEN_BAN_PG=$(sed -n 's/^-- Dumped from database version \([0-9]*\).*/\1/p' "$TAM/data.sql" | head -n 1)
SO_BANG=$(wc -l < "$TAM/so-dong.tsv" | tr -d ' ')
SO_DONG=$(awk -F'\t' '{ s += $2 } END { print s + 0 }' "$TAM/so-dong.tsv")
{
  echo "ngay=$(TZ=Asia/Ho_Chi_Minh date '+%Y-%m-%d %H:%M') (giờ Việt Nam)"
  echo "phien_ban_postgres=${PHIEN_BAN_PG:-khong-ro}"
  echo "supabase_cli=$("${SUPABASE[@]}" --version 2>/dev/null | tail -n 1)"
  # sha256sum (Linux) hoặc shasum -a 256 (macOS) — cùng một dạng "mã  tên file".
  if command -v sha256sum > /dev/null 2>&1; then BAM=(sha256sum); else BAM=(shasum -a 256); fi
  (cd "$TAM" && "${BAM[@]}" roles.sql schema.sql data.sql so-dong.tsv)
} > "$TAM/thong-tin.txt"

echo "3/3 · Nén và mã hoá…"
TEN="beeftown-$(TZ=Asia/Ho_Chi_Minh date '+%Y-%m-%d-%H%M').tar.gz.gpg"
tar -C "$TAM" -czf - roles.sql schema.sql data.sql so-dong.tsv thong-tin.txt \
  | gpg --batch --yes --quiet --pinentry-mode loopback --passphrase-fd 3 \
        --symmetric --cipher-algo AES256 --compress-algo none \
        -o "$TAM/$TEN" 3<<< "$SAO_LUU_MAT_KHAU"
mv "$TAM/$TEN" "$RA/$TEN"

KICH_THUOC=$(wc -c < "$RA/$TEN" | tr -d ' ')
{
  echo "TEP=$RA/$TEN"
  echo "TEN=$TEN"
  echo "KICH_THUOC=$KICH_THUOC"
  echo "PHIEN_BAN_PG=${PHIEN_BAN_PG:-}"
  echo "SO_BANG=$SO_BANG"
  echo "SO_DONG=$SO_DONG"
} > "$RA/ket-qua.env"
echo "Xong: $TEN — $SO_BANG bảng, $SO_DONG dòng, $KICH_THUOC byte (đã mã hoá)."
