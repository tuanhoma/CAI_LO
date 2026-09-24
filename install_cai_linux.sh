#!/usr/bin/env bash
# ==============================================================================
# Script tự động cài đặt CAI (Cybersecurity AI) trong WSL Ubuntu
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}    🚀 BẮT ĐẦU CÀI ĐẶT TỰ ĐỘNG CAI TRONG WSL UBUNTU   ${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Cập nhật apt và cài đặt các gói hệ thống
echo -e "\n${YELLOW}[1/6] Đang cập nhật gói hệ thống và cài đặt phụ thuộc...${NC}"
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y \
    build-essential \
    pkg-config \
    git \
    curl \
    wget \
    net-tools \
    nmap \
    graphviz

# 2. Cài đặt uv (Astral uv - trình quản lý Python tốc độ cao)
echo -e "\n${YELLOW}[2/6] Đang cài đặt uv và thiết lập Python 3.12...${NC}"
if ! command -v uv &> /dev/null; then
    curl -LsSf https://astral.sh/uv/install.sh | sh
fi
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

# 3. Tạo môi trường ảo Python 3.12 chuẩn
VENV_DIR="$HOME/.cai_env"
echo -e "\n${YELLOW}[3/6] Khởi tạo Python virtual environment (Python 3.12) tại $VENV_DIR...${NC}"
uv venv --python 3.12 "$VENV_DIR"
source "$VENV_DIR/bin/activate"

# 4. Xác định thư mục chứa mã nguồn CAI trên Windows mount
CAI_WIN_DIR="/mnt/c/Users/Tuan Anh/cai-project/cai"
if [ ! -d "$CAI_WIN_DIR" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -d "$SCRIPT_DIR/cai" ]; then
        CAI_WIN_DIR="$SCRIPT_DIR/cai"
    elif [ -d "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/pyproject.toml" ]; then
        CAI_WIN_DIR="$SCRIPT_DIR"
    fi
fi

echo -e "${GREEN}✓ Đã xác định thư mục mã nguồn CAI:${NC} $CAI_WIN_DIR"

# 5. Cài đặt CAI
echo -e "\n${YELLOW}[4/6] Đang cài đặt CAI Framework từ mã nguồn local...${NC}"
if [ -d "$CAI_WIN_DIR" ]; then
    uv pip install -e "$CAI_WIN_DIR"
else
    echo -e "${YELLOW}Cài đặt bản phát hành cai-framework từ PyPI...${NC}"
    uv pip install "cai-framework"
fi

uv pip install rich textual questionary prompt_toolkit python-dotenv

# 5. Thiết lập thư mục làm việc và file cấu hình .env
WORKSPACE_DIR="$HOME/cai-workspace"
mkdir -p "$WORKSPACE_DIR"
mkdir -p "$HOME/.cai"

ENV_FILE="$WORKSPACE_DIR/.env"
echo -e "\n${YELLOW}[5/6] Khởi tạo file cấu hình môi trường (.env)...${NC}"

if [ ! -f "$ENV_FILE" ]; then
    cat << 'EOF' > "$ENV_FILE"
# ==============================================================================
# CẤU HÌNH BIẾN MÔI TRƯỜNG CHO CAI (Cybersecurity AI)
# ==============================================================================

# 1. Cấu hình bản quyền (Bỏ qua kiểm tra bản quyền Alias Robotics thương mại)
CAI_LICENSE_OFF=1
PROMPT_TOOLKIT_NO_CPR=1
CAI_STREAM=false

# 2. Cấu hình LLM Provider (Điền API Key của bạn vào dưới đây)
# Bạn có thể dùng OpenAI, Anthropic, DeepSeek, hoặc Ollama (chạy local miễn phí)

# OpenAI:
OPENAI_API_KEY="sk-placeholder"

# Anthropic (Claude):
ANTHROPIC_API_KEY=""

# DeepSeek:
DEEPSEEK_API_KEY=""

# Ollama (Nếu chạy mô hình cục bộ):
# OLLAMA_API_BASE="http://localhost:11434"
OLLAMA=""

# Model mặc định muốn dùng (ví dụ: gpt-4o, claude-3-5-sonnet, ollama/llama3):
# CAI_MODEL="gpt-4o"
EOF
    echo -e "${GREEN}✓ Đã tạo file .env tại:${NC} $ENV_FILE"
else
    echo -e "${GREEN}✓ File .env đã tồn tại tại:${NC} $ENV_FILE"
fi

# Đồng bộ file .env vào ~/.cai/.env
cp -f "$ENV_FILE" "$HOME/.cai/.env"

# 6. Tạo lệnh `cai` toàn cục trong WSL
echo -e "\n${YELLOW}[6/6] Đang tạo script khởi chạy nhanh toàn cục...${NC}"
mkdir -p "$HOME/.local/bin"

cat << 'EOF' > "$HOME/.local/bin/cai"
#!/usr/bin/env bash
export CAI_LICENSE_OFF=1
export PROMPT_TOOLKIT_NO_CPR=1

# Tự động nạp .env nếu có
if [ -f "$HOME/cai-workspace/.env" ]; then
    set -a
    source "$HOME/cai-workspace/.env"
    set +a
fi

source "$HOME/.cai_env/bin/activate"
cd "$HOME/cai-workspace"
exec cai "$@"
EOF

chmod +x "$HOME/.local/bin/cai"

# Tạo link tượng trưng vào /usr/local/bin (nếu có quyền sudo)
if sudo ln -sf "$HOME/.local/bin/cai" /usr/local/bin/cai 2>/dev/null; then
    echo -e "${GREEN}✓ Đã liên kết lệnh 'cai' vào /usr/local/bin/cai${NC}"
fi

# Đảm bảo ~/.local/bin có trong PATH của .bashrc
if ! grep -q 'HOME/.local/bin' "$HOME/.bashrc" 2>/dev/null; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
fi

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}    🎉 CÀI ĐẶT CAI TRONG WSL HOÀN TẤT THÀNH CÔNG!     ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "Cách sử dụng:"
echo -e "1. Chỉnh sửa API Key trong file: ${BLUE}$ENV_FILE${NC} (ví dụ: nano $ENV_FILE)"
echo -e "2. Gõ lệnh: ${YELLOW}cai${NC} từ bất kỳ đâu trong WSL để bắt đầu trải nghiệm!"
echo -e ""
