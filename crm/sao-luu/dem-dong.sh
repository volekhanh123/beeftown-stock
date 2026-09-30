#!/usr/bin/env bash
# =============================================================================
# ĐẾM DÒNG TỪNG BẢNG TRONG data.sql (bản sao lưu dạng COPY)
# =============================================================================
#
#     bash crm/sao-luu/dem-dong.sh data.sql      →  "schema.bang<TAB>số dòng", mỗi bảng một dòng
#
# Số dòng đếm NGAY TRONG FILE sao lưu, không hỏi database thật: đó là con số mà bản khôi phục
# phải có đúng, không lệch vì dữ liệu đổi trong lúc sao lưu (pg_dump chụp một thời điểm).
#
# Dạng COPY văn bản: dòng "COPY "schema"."bang" (cột, …) FROM stdin;", mỗi dòng dữ liệu một dòng
# (xuống dòng trong ô được viết thành \n), kết thúc bằng một dòng chỉ có "\.". Một ô có đúng
# chuỗi "\." bị viết thành "\\." — nên dòng "\." luôn là dòng kết thúc.
#
# Tên bảng lạ (không phải chữ thường, số, gạch dưới) → dừng với lỗi: tên này về sau được ghép
# vào câu SQL đếm dòng (khoi-phuc.sh), không được để lọt ký tự nào khác.
set -euo pipefail

TEP=${1:?Cách dùng: dem-dong.sh <data.sql>}
[ -s "$TEP" ] || { echo "Không có hoặc rỗng: $TEP" >&2; exit 1; }

# Chỉ coi "COPY …" là đầu bảng khi đang ở NGOÀI một khối dữ liệu: một ô dữ liệu cũng có thể bắt đầu
# bằng chữ "COPY ".
awk '
  !trong && /^COPY / {
    bang = $2
    gsub(/"/, "", bang)
    if (bang !~ /^[a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*$/) {
      print "Tên bảng lạ trong bản sao lưu: " bang > "/dev/stderr"
      loi = 1
      exit 1
    }
    n = 0; trong = 1; next
  }
  trong && $0 == "\\." { print bang "\t" n; trong = 0; next }
  trong { n++ }
  END {
    if (loi) exit 1
    if (trong) { print "data.sql bị cắt giữa chừng: bảng " bang " không có dòng kết thúc" > "/dev/stderr"; exit 1 }
  }
' "$TEP"
