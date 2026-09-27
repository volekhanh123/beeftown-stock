# =============================================================================
# BEEFTOWN — NẠP CÂN QUA WIFI (cân in tem TM-A, dòng TM-xA)
# =============================================================================
# Cách chạy: chuột phải vào file này → "Run with PowerShell".
#
# Chương trình gửi file A_000.TMS (tải từ màn Kho › Cài đặt › Đồng bộ cân)
# thẳng xuống cân qua WiFi, thay cho việc chép vào USB rồi cắm vào cân.
#
# ĐÃ THỬ TRÊN CÂN THẬT (26/09/2026, firmware V3.14E8):
#   · Cân nhận dữ liệu ở cổng TCP 33571. Nội dung gửi y như file USB.
#     (Cân tự phát "UDP<tab>33581" mỗi ~15 giây ra cổng UDP 33584, nhưng gửi
#     vào cổng 33581 thì cân KHÔNG nạp.)
#   · Gửi qua WiFi chỉ THÊM và SỬA hàng. Hàng có trên cân mà không có trong
#     file thì VẪN NẰM LẠI. Nạp bằng USB thì cân thay cả danh sách.
#     → Chương trình nhớ những hàng đang nằm trên cân (file tren-can.tsv) và
#       báo khi có hàng cần xoá: lần đó phải nạp bằng USB.
#   · Phần giờ (TIM) bị bỏ trước khi gửi để đồng hồ cân không bị chỉnh lùi.
#
# File .TMS có tên và mật khẩu WiFi của quán: chương trình chỉ gửi tới cân và
# lưu trong thư mục Tài liệu › Beeftown Can của máy này, không gửi đi đâu khác.
# =============================================================================

# ---- Chỉnh nếu địa chỉ cân đổi (xem trên cân: Prog → 4 → 2) -----------------
$IP_CAN   = '192.168.1.22'
$CONG_CAN = 33571
# -----------------------------------------------------------------------------

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}

$TAI_LIEU = [Environment]::GetFolderPath('MyDocuments')
if (-not $TAI_LIEU) { $TAI_LIEU = $HOME }
$THU_MUC  = Join-Path $TAI_LIEU 'Beeftown Can'
$FILE_GOC = Join-Path $THU_MUC 'A_000.TMS'      # tải file này lên màn Đồng bộ cân
$TREN_CAN = Join-Path $THU_MUC 'tren-can.tsv'    # các hàng đang nằm trên cân
$DA_GUI   = Join-Path $THU_MUC 'da-gui'          # bản lưu mỗi lần gửi
$L1 = [Text.Encoding]::GetEncoding(28591)        # 1 ký tự = 1 byte, giữ nguyên file
$U8 = New-Object Text.UTF8Encoding($false)

function Viet($chu, $mau = 'Gray') { Write-Host $chu -ForegroundColor $mau }

function ThuMucTaiVe {
  try {
    $p = (New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path
    if ($p -and (Test-Path -LiteralPath $p)) { return $p }
  } catch {}
  Join-Path $env:USERPROFILE 'Downloads'
}

function HopChonFile($batDau) {
  Add-Type -AssemblyName System.Windows.Forms
  $h = New-Object System.Windows.Forms.OpenFileDialog
  $h.Filter = 'File cân (*.TMS)|*.TMS|Mọi file (*.*)|*.*'
  $h.InitialDirectory = $batDau
  if ($h.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { throw 'Chưa chọn file.' }
  $h.FileName
}

# File .TMS mới nhất trong thư mục Tải về; không dùng thì mở hộp chọn file.
function ChonFileTaiVe {
  $tv = ThuMucTaiVe
  $moi = Get-ChildItem -LiteralPath $tv -Filter '*.TMS' -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($moi) {
    Viet "File mới nhất trong Tải về: $($moi.Name) (lưu lúc $($moi.LastWriteTime.ToString('HH:mm dd/MM/yyyy')))" 'White'
    $tl = Read-Host 'Dùng file này? Enter = có, gõ K rồi Enter để chọn file khác'
    if ($tl -notmatch '^\s*[kK]') { return $moi.FullName }
  }
  HopChonFile $tv
}

# Đọc file cân → chữ (mỗi ký tự 1 byte) và các dòng PLU theo số PLU.
function DocFile($duong) {
  $byte = [IO.File]::ReadAllBytes($duong)
  if ($byte.Length -eq 0 -or $byte.Length -gt 5MB) { throw 'File rỗng hoặc quá lớn, không phải file của cân.' }
  $chu = $L1.GetString($byte)
  if ($chu -notmatch "(?m)^(DWL|XD1)`tPLU`t" -or $chu -notmatch "(?m)^END`tPLU`t") {
    throw 'File không có phần danh sách hàng (PLU). Chọn đúng file A_000.TMS.'
  }
  $plu = @{}
  foreach ($d in ($chu -split "`r?`n")) {
    if (-not $d.StartsWith("PLU`t")) { continue }
    $c = $d -split "`t"
    $so = 0
    if ($c.Length -lt 16 -or -not [int]::TryParse($c[1], [ref]$so)) { continue }
    $plu[$so] = [pscustomobject]@{
      So = $so; Ma = $c[2].TrimStart('0'); Gia = $c[5]; Ten = $U8.GetString($L1.GetBytes($c[15]))
    }
  }
  [pscustomobject]@{ Chu = $chu; Plu = $plu }
}

function BoGio($chu) { [regex]::Replace($chu, "(?s)(DWL|XD1)`tTIM`t.*?END`tTIM`t\r?\n", '') }

function DocTrenCan {
  $m = @{}
  if (Test-Path -LiteralPath $TREN_CAN) {
    foreach ($d in [IO.File]::ReadAllLines($TREN_CAN, $U8)) {
      $c = $d -split "`t"; $so = 0
      if ($c.Length -ge 4 -and [int]::TryParse($c[0], [ref]$so)) {
        $m[$so] = [pscustomobject]@{ So = $so; Ma = $c[1]; Gia = $c[2]; Ten = $c[3] }
      }
    }
  }
  $m
}

function GhiTrenCan($m) {
  $dong = $m.Keys | Sort-Object | ForEach-Object { $h = $m[$_]; "$($h.So)`t$($h.Ma)`t$($h.Gia)`t$($h.Ten)" }
  [IO.File]::WriteAllLines($TREN_CAN, [string[]]@($dong), $U8)
}

function LuuFileGoc([byte[]]$du) {
  New-Item -ItemType Directory -Force -Path $THU_MUC, $DA_GUI | Out-Null
  [IO.File]::WriteAllBytes($FILE_GOC, $du)
  [IO.File]::WriteAllBytes((Join-Path $DA_GUI ((Get-Date).ToString('yyyyMMdd-HHmmss') + '.TMS')), $du)
}

function GuiCan([byte[]]$du) {
  $c = New-Object Net.Sockets.TcpClient
  try {
    $ok = $false
    try { $ok = $c.ConnectAsync($IP_CAN, $CONG_CAN).Wait(5000) -and $c.Connected } catch {}
    if (-not $ok) {
      throw ("Không kết nối được cân ở $IP_CAN (cổng $CONG_CAN).`n" +
        "  · Cân có đang bật, ở màn hình bán hàng không?`n" +
        "  · Máy tính có cùng WiFi với cân không (không dùng WiFi khách)?`n" +
        "  · Địa chỉ cân có đổi không? Trên cân bấm Prog → 4 → 2 để xem, rồi sửa dòng `$IP_CAN ở đầu file này.")
    }
    $s = $c.GetStream()
    $s.Write($du, 0, $du.Length); $s.Flush()
    $c.Client.Shutdown([Net.Sockets.SocketShutdown]::Send)   # báo cân: đã gửi hết
    # Cân không trả lời gì; chờ cân đóng kết nối (tối đa 15 giây).
    $s.ReadTimeout = 15000
    $buf = New-Object byte[] 4096
    try { while ($s.Read($buf, 0, $buf.Length) -gt 0) {} } catch {}
  } finally { $c.Close() }
}

function GuiFileMoi {
  $duong = ChonFileTaiVe
  $f = DocFile $duong
  $truoc = DocTrenCan
  $coTruoc = $truoc.Count -gt 0

  $moi = @(); $sua = @(); $giu = 0
  foreach ($so in $f.Plu.Keys) {
    $h = $f.Plu[$so]; $cu = $truoc[$so]
    if (-not $cu) { $moi += $h }
    elseif ($cu.Ma -ne $h.Ma -or $cu.Gia -ne $h.Gia -or $cu.Ten -ne $h.Ten) { $sua += $h }
    else { $giu++ }
  }
  $conLai = @($truoc.Keys | Where-Object { -not $f.Plu.ContainsKey($_) } | Sort-Object | ForEach-Object { $truoc[$_] })

  Viet ''
  Viet "File có $($f.Plu.Count) hàng." 'White'
  if ($coTruoc) {
    Viet "  $($moi.Count) hàng mới · $($sua.Count) hàng đổi tên/giá/mã · $giu hàng giữ nguyên"
  } else {
    Viet '  Chưa ghi nhận trên cân đang có gì, nên không kiểm được hàng cần xoá.' 'Yellow'
    Viet '  Lần đầu: nạp bằng USB rồi chạy lại chương trình, chọn 2.' 'Yellow'
  }
  if ($conLai.Count -gt 0) {
    Viet ''
    Viet "CÓ $($conLai.Count) HÀNG CẦN XOÁ KHỎI CÂN — gửi qua WiFi KHÔNG xoá được:" 'Red'
    foreach ($h in $conLai) { Viet "    PLU $($h.So) · mã $($h.Ma) · $($h.Ten)" 'Red' }
    Viet '  Muốn xoá: chép file này vào USB › JHSCALE và nạp bằng USB, rồi chạy lại chương trình, chọn 2.' 'Red'
    Viet '  Gửi qua WiFi vẫn được: giá và tên các hàng khác được cập nhật, các hàng trên vẫn nằm lại.' 'Red'
  }
  Viet ''
  $tl = Read-Host "Gửi xuống cân $IP_CAN ngay? Enter = gửi, gõ K rồi Enter để thôi"
  if ($tl -match '^\s*[kK]') { Viet 'Đã thôi, chưa gửi gì.' 'Yellow'; return }

  $du = $L1.GetBytes((BoGio $f.Chu))
  Viet "Đang gửi $($du.Length) byte..."
  GuiCan $du

  foreach ($so in $f.Plu.Keys) { $truoc[$so] = $f.Plu[$so] }   # cân chỉ thêm/sửa
  LuuFileGoc $du
  GhiTrenCan $truoc
  Viet ''
  Viet 'ĐÃ GỬI. Trên cân gọi thử một hàng vừa đổi (gõ số PLU rồi bấm PLU) để chắc cân đã nhận.' 'Green'
  Viet "Lần sau, ở màn Đồng bộ cân hãy tải lên file: $FILE_GOC" 'Green'
}

function GhiNhanUsb {
  Viet 'Chọn đúng file vừa nạp vào cân bằng USB (hoặc file vừa lưu từ cân ra USB).' 'White'
  $duong = HopChonFile ([Environment]::GetFolderPath('Desktop'))
  $f = DocFile $duong
  $du = $L1.GetBytes((BoGio $f.Chu))
  LuuFileGoc $du
  GhiTrenCan $f.Plu
  Viet ''
  Viet "ĐÃ GHI NHẬN: trên cân có $($f.Plu.Count) hàng." 'Green'
  Viet "Lần sau, ở màn Đồng bộ cân hãy tải lên file: $FILE_GOC" 'Green'
}

# Nạp bằng ". .\Nap-Can-WiFi.ps1" (để kiểm thử) thì chỉ nạp các hàm, không chạy.
if ($MyInvocation.InvocationName -eq '.') { return }

try {
  Viet '=== BEEFTOWN · NẠP CÂN QUA WIFI ===' 'Cyan'
  Viet "Cân: $IP_CAN (cổng $CONG_CAN)"
  Viet ''
  Viet '  1  Gửi file mới (tải từ màn Đồng bộ cân) xuống cân qua WiFi'
  Viet '  2  Tôi vừa nạp cân bằng USB / vừa lưu dữ liệu từ cân ra USB — ghi nhận file đó'
  $chon = Read-Host 'Chọn 1 hoặc 2 (Enter = 1)'
  if ($chon -match '^\s*2') { GhiNhanUsb } else { GuiFileMoi }
} catch {
  Viet ''
  Viet "LỖI: $($_.Exception.Message)" 'Red'
}
Viet ''
Read-Host 'Bấm Enter để đóng' | Out-Null
