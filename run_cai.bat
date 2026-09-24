@echo off
setlocal enabledelayedexpansion

echo ==============================================================================
echo            CAI - CyberAI Autonomous Pentesting Framework
echo ==============================================================================
echo.

cd /d "%~dp0"

:: Set base preferences
set PROMPT_TOOLKIT_NO_CPR=1
set CAI_STREAM=false

:: 1. Auto-discover Pentest & Helper Tools on Windows
if exist "%USERPROFILE%\ReconTools\nmap" set "PATH=%USERPROFILE%\ReconTools\nmap;!PATH!"
if exist "%USERPROFILE%\go\bin" set "PATH=%USERPROFILE%\go\bin;!PATH!"
if exist "%LOCALAPPDATA%\Programs\Ollama" set "PATH=%LOCALAPPDATA%\Programs\Ollama;!PATH!"
if exist "C:\Program Files\Git\usr\bin" set "PATH=C:\Program Files\Git\usr\bin;C:\Program Files\Git\bin;!PATH!"
if exist "%LOCALAPPDATA%\Python\pythoncore-3.14-64\Scripts" set "PATH=%LOCALAPPDATA%\Python\pythoncore-3.14-64\Scripts;!PATH!"

:: 2. Check and start Ollama in background if not already running
curl.exe -s http://localhost:11434 >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" (
        echo [*] Dang khoi dong Ollama chay ngam...
        start /min "" "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" serve
        timeout /t 2 /nobreak >nul 2>&1
    )
)

:: 3. Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found in PATH! Please install Python 3.10, 3.11, or 3.12.
    pause
    exit /b 1
)

:: 4. Check Virtual Environment
if exist "cai_env\Scripts\activate.bat" (
    set "VENV_PATH=cai_env"
) else if exist "%USERPROFILE%\cai_env\Scripts\activate.bat" (
    set "VENV_PATH=%USERPROFILE%\cai_env"
) else (
    echo [*] Creating local virtual environment (cai_env)...
    python -m venv cai_env
    set "VENV_PATH=cai_env"
)

echo [*] Activating environment: !VENV_PATH!...
call "!VENV_PATH!\Scripts\activate.bat"

:: 5. Check / Install CAI
where cai >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Installing CAI framework (editable mode)...
    python -m pip install --upgrade pip
    pip install -e .
)

:: 6. Check Environment Configuration (.env)
if not exist ".env" (
    if exist "%USERPROFILE%\.env" (
        echo [*] Found existing configuration in %USERPROFILE%\.env
    ) else (
        echo [*] Creating .env from .env.example...
        copy /y .env.example .env >nul
        echo [INFO] Created .env pre-configured for local Ollama (qwen2.5-coder:14b).
        echo [INFO] Edit .env anytime to switch models or add cloud API keys.
    )
)

:: 7. Launch CAI
echo.
echo ==============================================================================
echo [*] Starting CAI...
echo [*] Launching Web App Pentester (Agent 20)...
echo ==============================================================================
echo.

if "%~1"=="" (
    cai --agent 20
) else (
    cai %*
)

if %errorlevel% neq 0 (
    echo.
    echo [INFO] CAI session exited with code %errorlevel%.
    pause
)
