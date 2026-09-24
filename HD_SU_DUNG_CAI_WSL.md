# Hướng Dẫn Mở & Sử Dụng CAI (Cybersecurity AI Framework) trong CMD

Tài liệu này hướng dẫn chi tiết cách mở và sử dụng framework **CAI (Cybersecurity AI)** từ Windows Command Prompt (CMD) hoặc PowerShell.

---

## 1. Cách mở CAI từ CMD (Command Prompt)

Mở cửa sổ **CMD** hoặc **PowerShell** trên Windows và di chuyển tới thư mục dự án `c:\Users\Tuan Anh\cai-project`:

```cmd
cd "c:\Users\Tuan Anh\cai-project"
```

### Cách 1: Chạy file `start_cai.bat` (Đơn giản nhất)
Chỉ cần gõ:
```cmd
start_cai.bat
```
*(Hoặc trong Windows Explorer, bạn có thể click đúp chuột trực tiếp vào file [start_cai.bat](file:///c:/Users/Tuan%20Anh/cai-project/start_cai.bat)).*

### Cách 2: Chạy trực tiếp qua lệnh WSL
Từ bất kỳ cửa sổ CMD/PowerShell nào trên Windows:
```cmd
wsl -d Ubuntu -e /root/.local/bin/cai
```

### Cách 3: Vào hẳn Terminal Ubuntu WSL
```cmd
wsl -d Ubuntu
```
Sau đó gõ lệnh:
```bash
cai
```

---

## 2. Các chế độ chạy CAI

| Nhu cầu | Lệnh trong CMD / PowerShell |
|:---|:---|
| **Chế độ REPL tương tác** (Chat trực tiếp) | `start_cai.bat` hoặc `wsl -d Ubuntu -e /root/.local/bin/cai` |
| **Giao diện đồ họa terminal (TUI)** | `start_cai.bat --tui` |
| **Chạy 1 câu hỏi nhanh** (Không cần vào REPL) | `start_cai.bat --prompt "Phân tích CVE-2024-3094"` |
| **Tự động phê duyệt lệnh shell (YOLO)** | `start_cai.bat --yolo` |
| **Dùng script Python tùy biến** | `cai_prompt.bat "câu hỏi của bạn"` |

---

## 3. Hướng dẫn sử dụng các lệnh bên trong CAI REPL

Khi CAI khởi động thành công, bạn sẽ thấy giao diện dòng lệnh của CAI:

```text
╭─ CAI (Cybersecurity AI) ───────────────────────────────────────────────────╮
│ Sẵn sàng nhận câu hỏi hoặc lệnh điều khiển                                 │
╰────────────────────────────────────────────────────────────────────────────╯
cai> 
```

Tại dấu nhắc `cai>`, bạn có thể sử dụng các lệnh hệ thống sau:

### Quản lý và chuyển đổi Agent (`/agent` hoặc `/a`)
CAI tích hợp sẵn hơn 30 agent chuyên trách các mảng bảo mật khác nhau:
* `/agent list` : Hiển thị danh sách tất cả các agent sẵn có (Web Pentester, Bug Bounter, Blue Teamer, Red Teamer, DFIR, CodeAgent, v.v.).
* `/agent select web_pentester` : Chuyển sang agent chuyên đánh giá ứng dụng web.
* `/agent select blue_teamer` : Chuyển sang agent phòng thủ & phân tích log.
* `/agent select ctf` : Chuyển sang agent giải quyết các bài lab CTF.
* `/agent current` : Xem agent và model đang hoạt động.

### Xem công cụ bảo mật (`/tools`)
* `/tools` : Liệt kê các công cụ mà agent có quyền gọi (nmap, curl, packet analysis, shell command, code execution, v.v.).

### Trợ giúp và Thoát
* `/help` : Hiển thị toàn bộ danh sách lệnh hỗ trợ.
* `/model` : Xem thông tin model AI đang kết nối.
* `exit` hoặc `quit` : Thoát khỏi CAI về lại màn hình CMD.

---

## 4. Cấu hình Model & API Key

File cấu hình `.env` đã được thiết lập sẵn và đồng bộ giữa Windows và WSL:
* Trên Windows: `c:\Users\Tuan Anh\cai-project\.env`
* Trong WSL: `/root/cai-workspace/.env`

Hiện tại, hệ thống đã được cấu hình mặc định sử dụng Google Gemini qua endpoint tương thích:
* `OPENAI_API_BASE=https://generativelanguage.googleapis.com/v1beta/openai/`
* `CAI_MODEL=openai/gemini-3.6-flash`
