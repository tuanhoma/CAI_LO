@echo off
setlocal enabledelayedexpansion

echo ==============================================================================
echo       CAI_LO - Cai Dat Cong Cu Pentest Tu Dong (Windows)
echo ==============================================================================
echo.

:: 1. Kiem tra Scoop (Trinh quan ly goi khuyen nghi nhat cho Pentest tren Windows)
where scoop >nul 2>&1
if %errorlevel% equ 0 (
    echo [*] Tim thay Scoop! Dang cai dat nmap, sqlmap, gobuster, ffuf...
    scoop install nmap sqlmap gobuster ffuf
    goto :done
)

:: 2. Kiem tra Winget (Co san tren Windows 10/11)
where winget >nul 2>&1
if %errorlevel% equ 0 (
    echo [*] Tim thay Winget! Dang cai dat Nmap va Sqlmap...
    winget install --id Insecure.Nmap -e --accept-source-agreements --accept-package-agreements
    winget install --id sqlmapproject.sqlmap -e --accept-source-agreements --accept-package-agreements
    goto :check_go
)

:: 3. Kiem tra Chocolatey
where choco >nul 2>&1
if %errorlevel% equ 0 (
    echo [*] Tim thay Chocolatey! Dang cai dat nmap va sqlmap...
    choco install -y nmap sqlmap
    goto :check_go
)

echo [!] Khong tim thay Scoop/Winget/Choco tren may!
echo [*] Ban co the cai dat nhanh Scoop bang cach mo PowerShell va chay:
echo     Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
echo     irm get.scoop.sh ^| iex
echo     scoop install nmap sqlmap gobuster ffuf
echo.

:check_go
where go >nul 2>&1
if %errorlevel% equ 0 (
    echo [*] Tim thay Go! Dang cai dat ffuf va gobuster...
    go install github.com/ffuf/ffuf/v2@latest
    go install github.com/OJ/gobuster/v3@latest
)

:done
echo.
echo ==============================================================================
echo [*] Kiem tra trang thai cac cong cu:
echo ==============================================================================
where nmap >nul 2>&1 && echo [OK] nmap || echo [CHUA CO] nmap
where sqlmap >nul 2>&1 && echo [OK] sqlmap || echo [CHUA CO] sqlmap
where gobuster >nul 2>&1 && echo [OK] gobuster || echo [CHUA CO] gobuster
where ffuf >nul 2>&1 && echo [OK] ffuf || echo [CHUA CO] ffuf
echo.
pause
