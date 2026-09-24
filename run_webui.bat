@echo off
setlocal enabledelayedexpansion

echo ==============================================================================
echo            CAI - Web Dashboard (Agent Pentest Log Viewer)
echo ==============================================================================
echo.
echo [*] CAI chay tren WSL/Linux (Windows thuan khong chay duoc vi can pty).
echo [*] Server chi lang nghe 127.0.0.1 - KHONG mo ra Internet/LAN.
echo.

:: Doi thu muc script (%~dp0) sang duong dan WSL — de chinh WSL bash tu doi
:: (tránh tang doi so Windows nuot dau backslash).
set "WSLDIR="
for /f "usebackq delims=" %%p in (`wsl.exe bash -lc "wslpath -a '%~dp0'" 2^>nul`) do set "WSLDIR=%%p"

if "%WSLDIR%"=="" (
    echo [!] Khong goi duoc WSL. Hay chac chan da cai WSL Ubuntu:  wsl --install
    pause
    exit /b 1
)

set "PORT=8000"
echo [*] Mo dashboard tai: http://127.0.0.1:%PORT%/ui
echo.

:: Mo trinh duyet sau ~3 giay (cho server khoi dong) — dung ping thay timeout
:: de khong le thuoc PATH.
start "" /b cmd /c "ping -n 4 127.0.0.1 >nul & start "" http://127.0.0.1:%PORT%/ui"

:: Khoi dong server trong WSL (dung venv ~/.cai_env)
wsl.exe bash -lc "cd '%WSLDIR%' && bash run_webui.sh"

echo.
echo [INFO] Server da dung.
pause
