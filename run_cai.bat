@echo off
setlocal enabledelayedexpansion

echo ==============================================================================
echo            CAI - CyberAI Autonomous Pentesting Framework
echo ==============================================================================
echo.

cd /d "%~dp0"

:: 1. Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found in PATH! Please install Python 3.10, 3.11, or 3.12.
    pause
    exit /b 1
)

:: 2. Check Virtual Environment
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

:: 3. Check / Install CAI
where cai >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Installing CAI framework (editable mode)...
    python -m pip install --upgrade pip
    pip install -e .
)

:: 4. Check Environment Configuration (.env)
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

:: 5. Launch CAI
echo.
echo ==============================================================================
echo [*] Starting CAI...
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
