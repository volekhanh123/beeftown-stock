# Phần mềm cân của hãng — TM-xA Management Program

Nhánh mồ côi này chỉ để lưu và phân tích phần mềm quản lý cân in tem mà quán đang dùng. Nó không gộp vào `main`.
Code của Beeftown Cân nằm ở nhánh khác (xem mục **Nối với code Beeftown Cân** ở cuối file).

## Thông tin chung

| Mục | Giá trị |
|---|---|
| Tên phần mềm | **TM-xA Management Program**, file chạy `TM-xA.exe` |
| Phiên bản | **3.10.60.31060** (AssemblyVersion 3.10.60.31060, build 2018) |
| Hãng | **JHScale** ("CopyRight (C) JHScale 2008 - 2018"). Công cụ đi kèm `Binary/FontBuilder.exe` ghi "Font file builder for JHScale". |
| Cân dùng với | Cân in tem dòng **TM-A** (cân báo model `TM-xA UA006 V3.14E8`). Máy của quán có MAC `0023F019CFCA`, firmware **V3.14E8**. |
| Nguồn | Đội kỹ thuật Cân Toàn Thịnh Phát gửi qua Zalo ngày 29/09/2026: file `tma co hsd2.rar` (90,03 MB). Đây không phải bản cài chính thức của hãng. "có hsd" = bản kỹ thuật viên đã cài sẵn dữ liệu in hạn sử dụng. |
| Thư mục phần mềm đã cài | `C:\Users\khanh\Downloads\tma co hsd2\tma co hsd2`. Bản giải nén chạy tại chỗ, không cài vào Program Files. Gói gốc còn một bản sao lồng bên trong (thư mục con `tma co hsd2`). Bản sao đó **không** đưa lên vì chỉ khác các file dữ liệu: `ECS.mdb`, `ECS2.mdb`, `Report.mdb`, `LogInfo.txt`, `user_config.bck`, `Wizard.BIN`, `Config\en\Default.mdb`, `Report\Backup\*.mdb`. |
| Tổng đưa lên | 190 file phần mềm (79,2 MB) + thư mục `nghien-cuu/` (171 file, 11,1 MB) |

## Phần mềm viết bằng gì

| File | Ngôn ngữ / nền tảng | Cách nhận ra |
|---|---|---|
| `TM-xA.exe` | **C# trên .NET Framework 2.0** (WinForms), không làm rối mã (obfuscation). CSDL Access qua Jet OLEDB 4.0 (`Interop.ADODB.dll`, `Interop.JRO.dll`), báo cáo bằng Microsoft ReportViewer, vẽ bằng Microsoft.VisualBasic.PowerPacks. | `AssemblyName` đọc được bằng .NET; ILSpy dịch ngược ra C# sạch (`TargetFramework net20`); không có tham chiếu `Microsoft.VisualBasic.CompilerServices`, nên không phải VB.NET. |
| `ChnCharInfo.dll` | .NET: thư viện đổi chữ Hán sang pinyin của Microsoft (Visual Studio International Pack) | Thông tin phiên bản của file |
| `Binary/BitmapConvert.exe`, `Binary/FontBuilder.exe` | **C++ native, MFC** (Visual C++ 2010) | Không phải .NET; có chuỗi `mfc100` / MFC; đi kèm `mfc100.dll`, `msvcr100.dll` |
| `Document/Teaching Video/**/*.exe` | Video hướng dẫn tự chạy, dựng bằng **Delphi** | Có chuỗi Delphi/Borland trong file |
| `Microsoft.ReportViewer.*.dll`, `Microsoft.VisualBasic.PowerPacks.Vs.dll`, `mfc100.dll`, `msvcr100.dll` | Thư viện phân phối lại của Microsoft | |
| `*.xml` (Combo, Lang, LabelItem, Tm…), `*.chm`, `*.pdf` | Dữ liệu giao diện, định nghĩa thông số (Tm.xml có 383 thông số), trợ giúp, sách hướng dẫn cân | |

Dịch ngược lại được bằng lệnh:
`dotnet tool install -g ilspycmd --version 9.1.0.7988`, đặt `DOTNET_ROLL_FORWARD=Major`, rồi `ilspycmd -p -o <thư mục ra> TM-xA.exe`.
Kết quả đã có sẵn trong `nghien-cuu/ma-dich-nguoc/` (107 file .cs, khoảng 154.000 dòng).

## File KHÔNG đưa lên (và lý do)

| File | Dung lượng (byte) | Lý do |
|---|---|---|
| `ECS.mdb` | 888.832 | CSDL chính (Access, có mật khẩu viết cứng trong `TM-xA.exe`). Chứa bảng **Password** (mật khẩu thao tác cân), bảng String có **tên WiFi** (mục 15; giá trị ở đây là tên mặc định `JHSCALE`), và hàng hoá, tem của **cửa hàng khác** (dữ liệu thử của kỹ thuật viên). |
| `ECS2.mdb` | 888.832 | Bản sao của `ECS.mdb`, cùng lý do |
| `Config/_ECS.mdb` | 708.608 | Mẫu CSDL trống, nhưng có bảng Password |
| `Config/en/Default.mdb` | 888.832 | Hồ sơ của kỹ thuật viên: có bảng Password và tên WiFi (mục 15) |
| `Report.mdb` | 520.192 | Nhật ký bán hàng, danh sách cân của nhiều cửa hàng |
| `Report/Backup/20260421.mdb`, `Report/Backup/20260514.mdb` | 495.616 mỗi file | Bản sao lưu nhật ký bán |
| `Report/OldLogs/20000101_20231016.mdb`, `Report/OldLogs/20231017_20250515.mdb` | 507.904 / 499.712 | Nhật ký bán cũ |
| `Config/en/_ECS.TMS`, `Config/es/_ECS.TMS`, `Config/pt/_ECS.TMS`, `Config/ru/_ECS.TMS`, `Config/zh-CHS/_ECS.TMS`, `Config/zh-CHT/_ECS.TMS` | 99.290 – 102.515 | File .TMS: theo quy định không đưa lên. Đây là dữ liệu gốc của hãng (500 thông số, 33 mẫu tem), không chứa WiFi của quán. |

- **Lược đồ** (tên bảng, tên cột, kiểu) của hai CSDL có ở `nghien-cuu/luoc-do-csdl.md`, không kèm dữ liệu.
- **Không có file Wireshark** (.pcap/.pcapng) nào trong gói.
- **File cấu hình có chỗ ghi mật khẩu**: `TM-xA.exe.Config`, `Config/TM-xA.exe.config` (các mục `ftpuser`/`ftppass`) và `AutoTask.xml` (`<User/>`, `<Password/>`). Cả ba đều **để trống**, nên vẫn đưa lên. `user_config.bck`, `Wizard.BIN` (chỉ có tên quán, tên máy) và `LogInfo.txt` (MAC, IP nội bộ của các cân) cũng không có mật khẩu.
- **Đã quét toàn bộ nhánh** (phần mềm, mã dịch ngược, tài liệu) để tìm đúng tên và mật khẩu WiFi thật của quán: không có. File `.TMS` lưu từ cân của quán thì có WiFi (thông số chữ 15/16); file đó nằm ở `Tài liệu\Beeftown Can\` trên máy quầy và không bao giờ vào repo.

## Danh sách file đưa lên (phần mềm)

| File | Dung lượng (byte) |
|---|---|
| `AutoTask.xml` | 793 |
| `Binary/BitmapConvert.exe` | 1,051,648 |
| `Binary/Default.ftb` | 952 |
| `Binary/Font.bin` | 1,269,176 |
| `Binary/FontBuilder.exe` | 1,853,440 |
| `Binary/mfc100.dll` | 4,342,088 |
| `Binary/msvcr100.dll` | 770,384 |
| `Binary/Unicode.Cfg` | 3,543 |
| `Binary/Uniscribe/Default.ftb` | 952 |
| `Binary/Uniscribe/Font.bin` | 1,220,208 |
| `ChnCharInfo.dll` | 390,224 |
| `Combo.xml` | 35,353 |
| `Config/Config.xml` | 907 |
| `Config/Custom.xml` | 65 |
| `Config/en/Combo.xml` | 90 |
| `Config/en/Default.sbp` | 0 |
| `Config/en/LabelItem.xml` | 90 |
| `Config/en/Lang.xml` | 88 |
| `Config/en/Tm.xml` | 275 |
| `Config/en/TM-xA.exe.config` | 1,049 |
| `Config/es/Combo.xml` | 90 |
| `Config/es/LabelItem.xml` | 90 |
| `Config/es/Lang.xml` | 88 |
| `Config/es/Tm.xml` | 275 |
| `Config/es/TM-xA.exe.config` | 1,049 |
| `Config/Lang.xml` | 808 |
| `Config/pt/Combo.xml` | 90 |
| `Config/pt/LabelItem.xml` | 90 |
| `Config/pt/Lang.xml` | 88 |
| `Config/pt/Tm.xml` | 275 |
| `Config/pt/TM-xA.exe.config` | 1,049 |
| `Config/ru/Combo.xml` | 90 |
| `Config/ru/LabelItem.xml` | 90 |
| `Config/ru/Lang.xml` | 88 |
| `Config/ru/Tm.xml` | 275 |
| `Config/ru/TM-xA.exe.config` | 1,153 |
| `Config/TM-xA.exe.config` | 18,453 |
| `Config/Update.txt` | 513 |
| `Config/zh-CHS/Combo.xml` | 90 |
| `Config/zh-CHS/LabelItem.xml` | 90 |
| `Config/zh-CHS/Lang.xml` | 88 |
| `Config/zh-CHS/Tm.xml` | 275 |
| `Config/zh-CHS/TM-xA.exe.config` | 1,049 |
| `Config/zh-CHT/Combo.xml` | 90 |
| `Config/zh-CHT/LabelItem.xml` | 90 |
| `Config/zh-CHT/Lang.xml` | 88 |
| `Config/zh-CHT/Tm.xml` | 275 |
| `Config/zh-CHT/TM-xA.exe.config` | 1,049 |
| `Custom.xml` | 65 |
| `doc.vbs` | 682 |
| `Document/Teaching Video/A-Basic/A000-Firewall(Win7-8).exe` | 1,563,301 |
| `Document/Teaching Video/A-Basic/A001-ConfigWizard-BarcodeScale.exe` | 2,035,465 |
| `Document/Teaching Video/A-Basic/A002-ConfigWizard-CashRegister.exe` | 2,123,202 |
| `Document/Teaching Video/A-Basic/A003-ConfigWizard-Barcode.exe` | 1,150,703 |
| `Document/Teaching Video/A-Basic/A004-ConfigWizard-Management.exe` | 1,076,050 |
| `Document/Teaching Video/A-Basic/A005-ConfigWizard-Sale.exe` | 1,019,546 |
| `Document/Teaching Video/A-Basic/A006-ConfigWizard-UnitAndDisplay.exe` | 1,125,976 |
| `Document/Teaching Video/B-Details/B004-Import PLU from xls or csv.exe` | 2,678,968 |
| `Document/Teaching Video/B-Details/B005-Export logs to Excel.exe` | 1,579,910 |
| `Document/Teaching Video/B-Details/B006-PLU Edition.exe` | 1,242,250 |
| `Document/Teaching Video/B-Details/B007-ConfigWizard-PrintFormat.exe` | 1,708,128 |
| `Document/Teaching Video/B-Details/B008-AdvancedSetting.exe` | 1,598,333 |
| `Document/Teaching Video/B-Details/B009-Spec Editing.exe` | 1,284,980 |
| `Document/Teaching Video/B-Details/B010-VIP Editing.exe` | 1,836,074 |
| `Document/Teaching Video/B-Details/B011-Stock Function.exe` | 2,505,807 |
| `Document/Teaching Video/B-Details/B012-Custom Info application.exe` | 1,727,085 |
| `Document/Teaching Video/B-Details/B013-Reset Report.exe` | 1,337,727 |
| `Document/Teaching Video/B-Details/B014-Dept&Class.exe` | 1,436,013 |
| `Document/Teaching Video/C-System&Hardware/C001-BarcodeScanner Setting.exe` | 2,552,696 |
| `Document/User Manual/Characters Printable in U Version.pdf` | 1,058,497 |
| `Document/User Manual/Direction of Ethernet Connection.pdf` | 392,019 |
| `Document/User Manual/Easy Manual V2.36L.pdf` | 1,009,455 |
| `Document/User Manual/Electronic Cash Register V2.50A.pdf` | 552,604 |
| `Document/User Manual/Printing Serial Scale V2.50A.pdf` | 1,255,661 |
| `Document/User Manual/Printing Serial Scale V3.04A.pdf` | 1,158,243 |
| `ECS.sbp` | 0 |
| `en/Combo.xml` | 35,480 |
| `en/LabelItem.xml` | 43,774 |
| `en/Lang.xml` | 77,986 |
| `en/Tm.xml` | 84,368 |
| `en/TM-xA.chm` | 1,349,674 |
| `en/TM-xA.exe.config` | 1,478 |
| `es/Combo.xml` | 36,769 |
| `es/LabelItem.xml` | 44,544 |
| `es/Lang.xml` | 80,440 |
| `es/Tm.xml` | 88,964 |
| `es/TM-xA.chm` | 1,349,674 |
| `es/TM-xA.exe.config` | 1,478 |
| `fa/Combo.xml` | 39,680 |
| `fa/LabelItem.xml` | 45,400 |
| `fa/Lang.xml` | 87,844 |
| `fa/Tm.xml` | 100,253 |
| `fa/TM-xA.chm` | 1,349,674 |
| `fa/TM-xA.exe.config` | 1,524 |
| `Interop.ADODB.dll` | 126,976 |
| `Interop.JRO.dll` | 9,216 |
| `LabelItem.xml` | 44,462 |
| `Lang.xml` | 78,641 |
| `LogInfo.txt` | 2,718 |
| `logo.ico` | 50,534 |
| `Microsoft.ReportViewer.Common.dll` | 6,388,088 |
| `Microsoft.ReportViewer.DataVisualization.dll` | 3,875,728 |
| `Microsoft.ReportViewer.ProcessingObjectModel.dll` | 92,056 |
| `Microsoft.ReportViewer.WinForms.dll` | 546,688 |
| `Microsoft.VisualBasic.PowerPacks.Vs.dll` | 259,464 |
| `pt/Combo.xml` | 36,890 |
| `pt/LabelItem.xml` | 44,473 |
| `pt/Lang.xml` | 80,993 |
| `pt/Tm.xml` | 86,331 |
| `pt/TM-xA.chm` | 1,349,674 |
| `pt/TM-xA.exe.config` | 1,478 |
| `Resources/Device_A08.png` | 123,059 |
| `Resources/Device_A12.png` | 154,469 |
| `Resources/Device_A15.png` | 221,851 |
| `Resources/Device_A17.png` | 154,482 |
| `Resources/Device_B.png` | 79,001 |
| `Resources/Device_C11.png` | 158,050 |
| `Resources/Device_C15.png` | 132,790 |
| `Resources/Device_D.png` | 133,379 |
| `Resources/Device_E.png` | 126,822 |
| `Resources/Device_F.png` | 152,368 |
| `Resources/Guider.jpg` | 120,054 |
| `Resources/Guider_Ethernet_1.png` | 10,886 |
| `Resources/Guider_Ethernet_2.png` | 12,658 |
| `Resources/Guider_Excel_1.png` | 11,803 |
| `Resources/Guider_Excel_2.png` | 13,655 |
| `Resources/Guider_Report_1.png` | 17,375 |
| `Resources/Guider_Report_2.png` | 20,570 |
| `Resources/Guider_Setting_1.png` | 11,080 |
| `Resources/Guider_Setting_2.png` | 12,983 |
| `Resources/Guider_Shadow.png` | 3,935 |
| `Resources/Guider_TXT_1.png` | 8,744 |
| `Resources/Guider_TXT_2.png` | 11,155 |
| `Resources/Guider_USB_1.png` | 15,144 |
| `Resources/Guider_USB_2.png` | 17,408 |
| `Resources/Guider_Wizard_1.png` | 26,389 |
| `Resources/Guider_Wizard_2.png` | 29,306 |
| `Resources/logo.ico` | 50,534 |
| `Resources/logoPictureBox.png` | 53,500 |
| `Resources/Shrink.png` | 631 |
| `ru/Combo.xml` | 35,709 |
| `ru/LabelItem.xml` | 43,774 |
| `ru/Lang.xml` | 82,565 |
| `ru/Tm.xml` | 84,352 |
| `ru/TM-xA.chm` | 1,349,674 |
| `ru/TM-xA.exe.config` | 1,478 |
| `run.vbs` | 133 |
| `ScPLU/ScPLU_KA.xml` | 9,565 |
| `ScPLU/ScPLU_KA_DL.jpg` | 188,599 |
| `ScPLU/ScPLU_KA_SL.jpg` | 497,163 |
| `ScPLU/ScPLU_KAB.xml` | 9,573 |
| `ScPLU/ScPLU_KAB_DL.jpg` | 183,281 |
| `ScPLU/ScPLU_KAB_SL.jpg` | 484,293 |
| `ScPLU/ScPLU_KAD.xml` | 5,137 |
| `ScPLU/ScPLU_KAD_DL.jpg` | 99,691 |
| `ScPLU/ScPLU_KAD_SL.jpg` | 305,112 |
| `ScPLU/ScPLU_KB.xml` | 5,129 |
| `ScPLU/ScPLU_KB_DL.jpg` | 87,409 |
| `ScPLU/ScPLU_KB_SL.jpg` | 256,824 |
| `ScPLU/ScPLU_KC.xml` | 5,151 |
| `ScPLU/ScPLU_KC_DL.jpg` | 110,514 |
| `ScPLU/ScPLU_KC_SL.jpg` | 171,614 |
| `ScPLU/ScPLU_KD.xml` | 5,117 |
| `ScPLU/ScPLU_KD_DL.jpg` | 131,016 |
| `ScPLU/ScPLU_KD_SL.jpg` | 102,871 |
| `ScPLU/ScPLU_KE.xml` | 5,137 |
| `ScPLU/ScPLU_KE_DL.jpg` | 28,482 |
| `ScPLU/ScPLU_KE_SL.jpg` | 45,799 |
| `ScPLU/ScPLU_KF.xml` | 5,137 |
| `ScPLU/ScPLU_KF_DL.jpg` | 77,193 |
| `ScPLU/ScPLU_KF_SL.jpg` | 158,362 |
| `Tm.xml` | 84,133 |
| `TM-xA.exe` | 5,825,024 |
| `TM-xA.exe.Config` | 27,488 |
| `uninstall.bat` | 49 |
| `uninstall.ico` | 4,710 |
| `user_config.bck` | 2,472 |
| `Wizard.BIN` | 3,633 |
| `zh-CHS/Combo.xml` | 38,632 |
| `zh-CHS/LabelItem.xml` | 44,348 |
| `zh-CHS/Lang.xml` | 77,869 |
| `zh-CHS/Tm.xml` | 85,654 |
| `zh-CHS/TM-xA.chm` | 2,159,925 |
| `zh-CHS/TM-xA.exe.config` | 1,591 |
| `zh-CHT/Combo.xml` | 38,535 |
| `zh-CHT/LabelItem.xml` | 43,949 |
| `zh-CHT/Lang.xml` | 77,893 |
| `zh-CHT/Tm.xml` | 85,876 |
| `zh-CHT/TM-xA.CHM` | 2,159,925 |
| `zh-CHT/TM-xA.exe.config` | 1,593 |

## `nghien-cuu/` — những gì đã tìm ra (29/09/2026)

| Đường dẫn | Nội dung |
|---|---|
| `nghien-cuu/ma-dich-nguoc/` | C# dịch ngược của `TM-xA.exe` (ILSpy 9.1). Quan trọng nhất: `ECS/NetForm.cs` (giao thức LAN), `ECS/SaveForm.cs` (ghi file TMS / RS232), `ECS/RDS.cs` (đọc TMS, nhật ký bán), `ECS/PluForm.cs`, `ECS/LabelForm.cs`, `ECS/WizardForm.cs`, `ECS/Program.cs` (định dạng số, mật khẩu CSDL). |
| `nghien-cuu/dac-ta/` | 8 bản đặc tả **tiếng Anh**, mỗi bản do một agent viết rồi agent khác phản biện (có mục "Verification log"): `tms-format.md`, `net-protocol.md`, `plu-hsd.md`, `label-format.md`, `barcode-keys.md`, `spec-wizard.md`, `reports-sales.md`, `manuals.md`. `_tom-tat.txt` gom tóm tắt, các chỗ đã sửa và điều chưa biết. Đường dẫn trong đặc tả là của máy phân tích: `SRC`/`tmxa-src` = `nghien-cuu/ma-dich-nguoc/`, `INST`/`APP` = thư mục phần mềm này, `DUMP`/`mdb\dump` = bảng CSDL xuất ra TSV (không đưa lên). |
| `nghien-cuu/CAN-TMA.md` | Tài liệu kỹ thuật **tiếng Việt**, viết lại từ các đặc tả. Đây là bản chụp lúc đưa lên; bản mới nhất nằm ở nhánh code (xem cuối file). |
| `nghien-cuu/luoc-do-csdl.md` | Lược đồ `ECS.mdb` và `Report.mdb` |

### Phát hiện chính

1. **File .TMS là chính luồng lệnh gửi qua mạng.** Văn bản UTF-8, tách cột bằng tab, dòng nào cũng có tab cuối, xuống dòng CRLF. Các từ khoá: `DWL` (máy tính → cân), `END`, `CLR` (xoá sạch cả bảng), `UPL` (máy tính hỏi cân), `ECS VER`/`END ECS` (chỉ dùng trong file). Không có checksum. Không có lệnh xoá một hàng: muốn xoá phải `CLR PLU` rồi gửi lại cả danh sách.
2. **Mạng LAN của cân.**
   - Cổng **33581** là giao thức hai chiều của hãng. Các bước:
     - Mở: gửi `EF BB BF 0D 0A`.
     - Bắt tay: `UPL MAC` → `UPL INF` → `UPL END`.
     - Đọc: `UPL <PHẦN>`. Ghi: `DWL … END`, kết thúc bằng lệnh chặn `UPL TIM` (đọc dòng TIM rồi tới END).
     - Nhật ký bán: `UPL REP -<FID>`.
   - UDP 33583/33584 để dò cân.
   - Cổng **33571** chỉ quán mới dò ra: gửi nguyên file USB vào là cân nạp, cân không trả lời gì, và chỉ thêm/sửa, không xoá. Cổng này không có ở đâu trong mã của hãng.
   - Nhật ký TM-xA cho thấy chính cân của quán đã được đọc qua 33581 ngày 17/06/2024. Beeftown Cân **chưa** thử 33581 trên cân thật.
3. **Hạn sử dụng (HSD).**
   - Dòng PLU có 67 trường. **Cột 27 = PS_UD** (bật in HSD, 0/1), **cột 32 = PC_UD** (số ngày, 0–999). HSD in ra = ngày in + số ngày, tính theo đồng hồ cân.
   - Ngày bán dùng cột 23/28, ngày đóng gói cột 25/30.
   - Trên tem, ô HSD là loại 1 (Item), mã 15. Điều kiện in 9 = chỉ in khi hàng có HSD.
   - Kiểu ngày là thông số 104: cân quán đang để 0 = YYYY.MM.DD. Chỉ có DD/MM/YY (năm 2 số), không có DD/MM/YYYY.
   - Bản "có HSD" của kỹ thuật viên không sửa code, chỉ khác dữ liệu (PS_UD=1, PC_UD=30).
4. **Tem** (`LAB`/`LAS`/`LAE`):
   - Dòng LAS lần lượt là SubID, loại ô (0 mã vạch · 1 dữ liệu hàng · 2 dữ liệu lúc bán · 3 chữ cố định · 4 viền · 5 phân vùng · 6 ảnh · 7 tuỳ biến), Flag2, Flag3, điều kiện in (0–33), góc xoay, căn lề (giữ 2 bit cao), cỡ chữ (0–9, cột f[8]), x, y, rộng, cao. Toạ độ tính bằng chấm, 8 chấm = 1 mm.
   - Ô chữ cố định slot n in chữ `Text(n+1)` của dòng LAB, nằm ở cột `n<16 ? 6+n : 7+n`.
5. **Mã vạch** `BAR`: dãy phần tử `<chữ><độ dài><dịch><tràn>`. Mã vạch số 28 của quán là `B201F501J500…`, tức 2 số đầu + 5 số mã hàng + 5 số trọng lượng (gam) + số kiểm tra.
6. **Nhật ký bán** `REP`/`RES`/`REE`.
   - Tên hàng trong nhật ký là tên **lúc đọc**, không phải lúc bán.
   - Loại 2 là lần cân mà chưa in tem (thông số 283=1).
   - Đơn giá dùng thông số 202, tiền dùng 203.
7. **Lỗi đã thấy ở code cũ của quán**:
   - Không đọc được file do TM-xA xuất (có BOM và dòng trống đầu file).
   - Mỗi lần gửi đều gửi lại cả phần `REP` (nhật ký bán) và `INF`.
   - Đọc nhầm cột cỡ chữ của ô tem.
   - File TM-xA xuất có thể mang lệnh `CLR`: nếu đọc file đó rồi gửi nguyên xuống cân thì cân xoá sạch cả bảng.
   - Kiểm thử cũ ghi file giả đè lên thư mục dữ liệu thật trên Windows (đã sửa).
8. **Không chạy TM-xA cùng lúc với Beeftown Cân.** Mỗi khi nối cân, TM-xA tự chỉnh giờ cân, tự đọc nhật ký bán và ghi thông số 58.

## Nối với code Beeftown Cân

Toàn bộ phần dùng các phát hiện trên (Beeftown Cân 2.2: HSD từ kho, đọc/xoá qua WiFi, sửa tem kéo thả, thông số, phím tắt, nhật ký cân, hướng dẫn sử dụng) nằm ở nhánh **`claude/can-dich-nguoc-tmxa`**, dựng trên nhánh Cân 2.1 `claude/admiring-maxwell-sty1op`.
Tài liệu cho người sửa code: `can-app/CAN-TMA.md` và `can-app/README.md` trên nhánh đó.
