@echo off
setlocal enabledelayedexpansion

echo ==============================================================================
echo            CAI - CyberAI Autonomous Pentesting Framework
echo ==============================================================================
echo.

cd /d "%~dp0"

:: 1. Toi uu Terminal
set PROMPT_TOOLKIT_NO_CPR=1
set CAI_STREAM=false

:: 2. Tu dong nhan dien cong cu Pentest (uu tien noi bo trong thu muc cai-project)
if exist "%~dp0ReconTools\nmap" set "PATH=%~dp0ReconTools\nmap;!PATH!"
if exist "%USERPROFILE%\ReconTools\nmap" set "PATH=%USERPROFILE%\ReconTools\nmap;!PATH!"
if exist "%~dp0ReconTools" set "PATH=%~dp0ReconTools;!PATH!"
if exist "%USERPROFILE%\ReconTools" set "PATH=%USERPROFILE%\ReconTools;!PATH!"
if exist "%USERPROFILE%\go\bin" set "PATH=%USERPROFILE%\go\bin;!PATH!"
if exist "%LOCALAPPDATA%\Programs\Ollama" set "PATH=%LOCALAPPDATA%\Programs\Ollama;!PATH!"
if exist "C:\Program Files\Git\usr\bin" set "PATH=C:\Program Files\Git\usr\bin;C:\Program Files\Git\bin;!PATH!"
if exist "%LOCALAPPDATA%\Python\pythoncore-3.14-64\Scripts" set "PATH=%LOCALAPPDATA%\Python\pythoncore-3.14-64\Scripts;!PATH!"

:: 3. Tu dong khoi dong Ollama chay ngam neu chua bat
curl.exe -s http://localhost:11434 >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" (
        echo [*] Dang khoi dong dich vu Ollama chay ngam...
        start /min "" "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" serve
        timeout /t 2 /nobreak >nul 2>&1
    )
)

:: 4. Kich hoat moi truong ao cai_env
if exist "%~dp0cai_env\Scripts\activate.bat" (
    set "VENV_PATH=%~dp0cai_env"
) else if exist "%USERPROFILE%\cai_env\Scripts\activate.bat" (
    set "VENV_PATH=%USERPROFILE%\cai_env"
) else (
    echo [*] Khoi tao moi truong ao cai_env...
    python -m venv cai_env
    set "VENV_PATH=%~dp0cai_env"
)

call "!VENV_PATH!\Scripts\activate.bat"

:: 5. Khoi dong CAI
echo.
echo ==============================================================================
echo [*] Khoi dong CAI Framework (Agent 20 - Web Pentester)...
echo ==============================================================================
echo.

if "%~1"=="" (
    cai --agent 20
) else (
    cai %*
)

if %errorlevel% neq 0 (
    echo.
    echo [INFO] CAI da ket thuc phien lam viec.
    pause
)
