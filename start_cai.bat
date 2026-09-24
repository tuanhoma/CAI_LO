@echo off
title CAI - Cybersecurity AI Framework (WSL)
chcp 65001 >nul
cls
echo ======================================================================
echo    KHỞI ĐỘNG CAI (Cybersecurity AI Framework) TRONG WSL
echo ======================================================================
echo.

:: Kiểm tra WSL
where wsl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Không tìm thấy WSL trên hệ thống!
    pause
    exit /b 1
)

:: Chạy CAI interactive hoặc với tham số truyền vào
wsl -d Ubuntu -e /root/.local/bin/cai %*

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] CAI đã dừng lại hoặc kết thúc phiên làm việc.
    pause
)
