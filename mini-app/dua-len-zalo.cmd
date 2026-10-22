@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title Beeftown - đưa bản thử lên Zalo

echo ============================================
echo  BEEFTOWN MINI APP - ĐƯA BẢN THỬ LÊN ZALO
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 goto chua_co_node

echo [1/3] Cài thư viện. Lần đầu mất khoảng 1-3 phút...
call npm install --no-audit --no-fund
if errorlevel 1 goto loi

if not exist ".env" echo APP_ID=2858300068641327950> ".env"
findstr /b "ZMP_TOKEN=" ".env" >nul 2>nul
if errorlevel 1 goto dang_nhap
echo.
choice /c CK /n /m "Máy đã đăng nhập Zalo từ lần trước. Đăng nhập lại? Bấm C = có, K = không: "
if errorlevel 2 goto dua_len

:dang_nhap
echo.
echo [2/3] Đăng nhập Zalo Mini App
echo   - Thấy dòng "Choose a Login Method": bấm Enter để chọn Login Via QR Code With Zalo App.
echo   - Mở app Zalo trên điện thoại, quét mã QR hiện ra, bấm xác nhận. Có khoảng 2 phút.
echo   - Mã QR khó quét thì phóng to cửa sổ này.
echo.
call npx zmp login
findstr /b "ZMP_TOKEN=" ".env" >nul 2>nul
if errorlevel 1 goto loi_dang_nhap

:dua_len
echo.
echo [3/3] Build và đưa bản thử lên Zalo...
call npm run deploy:thu
echo.
echo Thấy chữ "Deploy Done!" là xong: quét mã QR ở trên bằng Zalo để mở bản thử, rồi báo Claude.
echo Thấy chữ "Error" thì chụp màn hình cửa sổ này gửi Claude.
echo.
pause
exit /b 0

:chua_co_node
echo Máy chưa có Node.js.
echo Cài bản LTS ở https://nodejs.org, cài xong bấm đúp lại file này.
echo.
pause
exit /b 1

:loi_dang_nhap
echo.
echo Đăng nhập chưa xong. Bấm đúp lại file này để thử lại.
echo.
pause
exit /b 1

:loi
echo.
echo Có lỗi ở bước trên. Chụp màn hình cửa sổ này gửi Claude.
echo.
pause
exit /b 1
