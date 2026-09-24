#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=============================================================================="
echo "           CAI - CyberAI Autonomous Pentesting Framework"
echo "=============================================================================="
echo ""

# 1. Virtual Environment
if [ -d "cai_env" ]; then
    source cai_env/bin/activate
elif [ -d "$HOME/cai_env" ]; then
    source "$HOME/cai_env/bin/activate"
else
    echo "[*] Creating virtual environment (cai_env)..."
    python3 -m venv cai_env
    source cai_env/bin/activate
fi

# 2. Check / Install CAI
if ! command -v cai &> /dev/null; then
    echo "[*] Installing CAI framework (editable mode)..."
    pip install --upgrade pip
    pip install -e .
fi

# 3. Environment configuration
if [ ! -f ".env" ]; then
    if [ -f "$HOME/.env" ]; then
        echo "[*] Using configuration from $HOME/.env"
    else
        echo "[*] Initializing .env from .env.example..."
        cp .env.example .env
        echo "[INFO] Created .env pre-configured for Ollama (qwen2.5-coder:14b)."
    fi
fi

# 4. Launch CAI
echo ""
echo "=============================================================================="
echo "[*] Starting CAI..."
echo "=============================================================================="
echo ""

if [ $# -eq 0 ]; then
    cai --agent 20
else
    cai "$@"
fi
