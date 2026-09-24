# Hướng dẫn cài đặt CAI + Web Dashboard (cho người clone repo)

> CAI chạy trên **Linux / WSL2** (nó dùng `pty`/`termios` — **không chạy được trên Windows thuần**).
> Trên Windows 10/11: cài WSL2 Ubuntu trước (`wsl --install`), rồi làm mọi bước bên trong Ubuntu.

---

## Cách nhanh (khuyến nghị) — 3 bước

Trong terminal **Ubuntu (WSL2)**, tại thư mục vừa `git clone`:

```bash
# 1) Cài CAI (tự cài uv + Python 3.12, tạo venv ~/.cai_env, cài editable).
#    Chạy bằng USER THƯỜNG (script tự hỏi sudo cho phần apt) — ĐỪNG dùng sudo bash.
bash install_cai_linux.sh

# 2) Điền API key LLM cho Dashboard
nano .env            # sửa OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY + CAI_MODEL
#   (install_cai_linux.sh đã tự tạo .env từ .env.example nếu chưa có)

# 3) Chạy Web Dashboard
bash run_webui.sh    # rồi mở http://127.0.0.1:8000/ui
```

Người dùng **Windows**: làm bước 1–2 trong WSL, rồi bấm đúp **`run_webui.bat`** (nó tự gọi WSL, mở trình duyệt).

---

## (Tuỳ chọn) Cài bộ công cụ pentest

Dashboard + agent chạy được ngay, nhưng để agent thực thi công cụ thật (nmap, nuclei, sqlmap, metasploit, netexec…):

```bash
bash install_pentest_tools.sh      # tự hỏi sudo; tải khá nhiều (SecLists ~2.5G, metasploit)
# Bỏ qua metasploit cho nhanh:
SKIP_MSF=1 bash install_pentest_tools.sh
```

Cài xong **mở terminal WSL mới** (hoặc `source ~/.profile`) để các tool vào PATH. Kiểm tra:

```bash
nuclei -version && subfinder -version && nxc --version && msfconsole -v
```

---

## Cách thủ công (nếu không dùng install_cai_linux.sh)

```bash
sudo apt update && sudo apt install -y build-essential pkg-config git curl wget nmap graphviz
curl -LsSf https://astral.sh/uv/install.sh | sh && export PATH="$HOME/.local/bin:$PATH"
uv venv --python 3.12 ~/.cai_env
uv pip install --python ~/.cai_env/bin/python -e .
cp .env.example .env && nano .env
bash run_webui.sh
```

---

## Cấu hình `.env`

`.env` **không được commit** (đã nằm trong `.gitignore`) — mỗi người tự tạo từ `.env.example`. Các biến chính:

| Biến | Ý nghĩa |
|---|---|
| `CAI_MODEL` | Model dùng, vd `openai/gpt-4o`, `anthropic/claude-3-5-sonnet`, `ollama/llama3` |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` | Khoá LLM (điền cái bạn dùng) |
| `OLLAMA_API_BASE` | Nếu chạy model cục bộ qua Ollama (miễn phí) |

> Dashboard nạp `.env` từ **thư mục repo**; lệnh CLI `cai` nạp từ `~/cai-workspace/.env`. Điền key ở nơi tương ứng với thứ bạn dùng (hoặc cả hai).

---

## An toàn / lưu ý

- **Chỉ chạy loopback** (`127.0.0.1`) — không mở Dashboard ra LAN/Internet (log có thể chứa credential).
- **Chỉ kiểm thử mục tiêu bạn sở hữu hoặc được ủy quyền** bằng văn bản, hoặc lab do nền tảng cấp.
- Tài liệu liên quan trong repo:
  - `HD_MUC_TIEU_PENTEST.md` — nhắm agent vào IP / web / PortSwigger / OffSec / HTB / CTF + cách chạy VPN trong WSL2.
  - `webui/ROADMAP.md` — lộ trình phát triển front-end.
  - `HD_SU_DUNG_CAI_WSL.md` — hướng dẫn dùng CAI trên WSL.
