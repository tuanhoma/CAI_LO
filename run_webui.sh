#!/usr/bin/env bash
# Khoi dong CAI API + Web Dashboard trong WSL/Linux.
# Chi lang nghe tren loopback (127.0.0.1) — KHONG mo ra Internet/LAN.
set -euo pipefail
cd "$(dirname "$0")"

export CAI_API_HOST="${CAI_API_HOST:-127.0.0.1}"
export CAI_API_PORT="${CAI_API_PORT:-8000}"
export CAI_API_SERVE_UI="${CAI_API_SERVE_UI:-true}"

# Dam bao cac cong cu pentest (Go/pipx/Rust) nam tren PATH cho agent CAI
# (login shell non-interactive khong doc .bashrc).
export PATH="$HOME/.local/bin:$HOME/go/bin:$HOME/.cargo/bin:$PATH"

VENV="${CAI_VENV:-$HOME/.cai_env}"
PY="$VENV/bin/python"

if [ ! -x "$PY" ]; then
  echo "[!] Khong tim thay venv tai $VENV"
  echo "    Chay cai dat truoc:  bash install_cai_linux.sh"
  echo "    Hoac:  uv pip install --python $PY -e ."
  exit 1
fi

echo "[*] CAI dashboard: http://${CAI_API_HOST}:${CAI_API_PORT}/ui"
echo "[*] Ctrl+C de dung."
exec "$PY" -c "from cai.api.server import run_api_server; run_api_server()"
