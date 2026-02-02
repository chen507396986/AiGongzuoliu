@echo off
echo =======================================================
echo           Git Proxy Configuration Helper
echo =======================================================
echo.
echo Current Git Proxy Settings:
git config --global --get http.proxy
echo.
echo -------------------------------------------------------
echo [1] Set Proxy (Enter Port Manually)
echo [2] Set Proxy to Default (7890 - Clash/v2ray)
echo [3] Set Proxy to Alternative (1080 - Shadowsocks)
echo [4] Remove Proxy (Direct Connection)
echo.
set /p choice="Select an option (1-4): "

if "%choice%"=="1" goto set_manual
if "%choice%"=="2" goto set_7890
if "%choice%"=="3" goto set_1080
if "%choice%"=="4" goto unset
goto end

:set_manual
set /p port="Enter your proxy port (e.g., 7890 or 1080): "
git config --global http.proxy http://127.0.0.1:%port%
git config --global https.proxy http://127.0.0.1:%port%
echo Proxy set to 127.0.0.1:%port%
goto test_push

:set_7890
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
echo Proxy set to 127.0.0.1:7890
goto test_push

:set_1080
git config --global http.proxy http://127.0.0.1:1080
git config --global https.proxy http://127.0.0.1:1080
echo Proxy set to 127.0.0.1:1080
goto test_push

:unset
git config --global --unset http.proxy
git config --global --unset https.proxy
echo Proxy removed.
goto test_push

:test_push
echo.
echo -------------------------------------------------------
echo Testing connection by pushing to GitHub...
git push --set-upstream origin master
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Push successful!
) else (
    echo.
    echo [FAIL] Push failed. Please check your port or network.
)
pause
goto end

:end
