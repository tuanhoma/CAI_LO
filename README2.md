# CAI — Hướng dẫn 4 cách bật & sử dụng

> Tài liệu này hướng dẫn **cách khởi động và dùng CAI** theo 4 phương thức: Web Dashboard, Terminal REPL, Terminal TUI, và chạy nhanh 1 lệnh.

---

## ⚠️ Điều kiện chung (đọc trước)

- **CAI chạy trên WSL/Linux**, KHÔNG chạy được trên Windows thuần (nó dùng `pty`/`termios`). Trên Windows: mở **WSL Ubuntu** rồi làm mọi thứ trong đó.
- **Môi trường ảo:** `~/.cai_env` (Python 3.12). Mã nguồn: `/mnt/d/CAI_LO`.
- **Cấu hình model + key:** trong file `/mnt/d/CAI_LO/.env` (xem mục [Cấu hình model](#-cấu-hình-model)).
- **Cả 4 cách dùng chung `.env`.** Đừng chạy đồng thời 2 thứ cùng bind cổng `8000` (Web Dashboard và `cai --api`).

---

## 🖥️ Cách 1 — Web Dashboard (trực quan, xem log attack)

Giao diện web hiển thị pha tấn công, mức độ nghiêm trọng, và **log agent trực tiếp** (`tool_call → tool_output`). Có ô chọn Agent + Model (tìm kiếm/tự nhập).

**Khởi động:**

- **Windows:** bấm đúp **`run_webui.bat`**
- **Hoặc trong WSL:**
  ```bash
  cd /mnt/d/CAI_LO && bash run_webui.sh
  ```

**Dùng:** mở trình duyệt → **http://127.0.0.1:8000/ui**
1. Nhập **Mục tiêu** (URL/IP) — chỉ để hiển thị.
2. Chọn **Agent** (vd `web_pentester_agent`) và **Model** (để trống = theo `.env`).
3. Viết **Chỉ thị cho agent** (prompt), đặt **Max turns**.
4. Bấm **▶ Bắt đầu** → xem log stream. **■ Dừng** để dừng. **Xóa log** để reset.

> Chỉ lắng nghe `127.0.0.1` (loopback) — **không mở ra Internet/LAN** vì log có thể chứa thông tin nhạy cảm.

---

## 💻 Cách 2 — Terminal REPL (chat trực tiếp với agent)

Giao diện dòng lệnh, gõ yêu cầu và agent chạy tool ngay trong terminal.

**Khởi động** (trong terminal Ubuntu/WSL):
```bash
cd /mnt/d/CAI_LO && source ~/.cai_env/bin/activate && cai
```

**Dùng:**
- Gõ yêu cầu bằng ngôn ngữ tự nhiên, vd: `Recon và liệt kê dịch vụ trên 10.10.14.5`
- Gõ `/help` để xem các lệnh, `/model` xem/đổi model, `/agent` đổi agent.
- Gõ `/exit` (hoặc `Ctrl+D`) để thoát.

---

## 🎨 Cách 3 — Terminal TUI (giao diện terminal đẹp hơn)

Giao diện Textual (khung/panel) ngay trong terminal — gọn, dễ nhìn hơn REPL thường.

**Khởi động:**
```bash
cd /mnt/d/CAI_LO && source ~/.cai_env/bin/activate && cai --tui
```

---

## ⚡ Cách 4 — Chạy nhanh 1 lệnh rồi thoát (automation/script)

Thực thi một prompt duy nhất, hợp để tự động hoá.

```bash
cd /mnt/d/CAI_LO && source ~/.cai_env/bin/activate && cai --prompt "Recon http://localhost:24001"
```

> Ngoài ra `cai --api` để chạy **chỉ backend API** (không kèm giao diện web). Web Dashboard (Cách 1) đã bao gồm API + `/ui` nên thường không cần dùng riêng.

---

## 📊 Nên dùng cách nào?

| Cách | Lệnh | Hợp khi |
|---|---|---|
| **Web Dashboard** | `bash run_webui.sh` → `/ui` | Muốn **nhìn log attack trực quan**, chọn agent/model bằng chuột, demo |
| **Terminal REPL** | `cai` | Thao tác nhanh bằng bàn phím, chat qua lại với agent |
| **Terminal TUI** | `cai --tui` | Thích giao diện terminal gọn đẹp |
| **Một lệnh** | `cai --prompt "..."` | Tự động hoá / chạy 1 phát trong script |

---

## 🔧 Cấu hình model

Sửa file `/mnt/d/CAI_LO/.env`, dòng `CAI_MODEL`. Trên Web có thể chọn model ngay ở ô **Model** cho từng lần chạy (không cần sửa `.env`).

**Model đã kiểm chứng chạy được (free, gọi tool tốt):**
```
CAI_MODEL="groq/openai/gpt-oss-120b"
```
Cần `GROQ_API_KEY="gsk_..."` trong `.env` (lấy free tại console.groq.com, không cần thẻ).

**Ghi chú các nhà cung cấp:**
| Provider | Trạng thái |
|---|---|
| **Groq** (`groq/openai/gpt-oss-120b`, `groq/openai/gpt-oss-20b`, `groq/qwen/qwen3.8-27b`) | ✅ **Free thật**, nhanh, gọi tool tốt — khuyến nghị |
| OpenAI (`gpt-4o`), Anthropic (`claude-3-5-sonnet`) | ✅ Mạnh nhất cho khai thác — **cần API key thật** |
| Gemini | ⚠️ Bản lite quá yếu; bản flash hay **từ chối tác vụ pentest** |
| Ollama (local) | ⚠️ Free/offline nhưng cần **GPU + model lớn**; model nhỏ (7B) khai thác yếu |

> Sau khi đổi `CAI_MODEL` trong `.env`, **khởi động lại** Web Dashboard để nạp model mới. Terminal (`cai`) tự đọc `.env` khi khởi động.

---

## ⚠️ An toàn & phạm vi

- Chỉ kiểm thử hệ thống bạn **sở hữu hoặc được ủy quyền bằng văn bản**, hoặc lab do nền tảng cấp (PortSwigger, HTB, TryHackMe…).
- Trong prompt luôn ghi rõ `Phạm vi: CHỈ <target>` để agent không tự mở rộng quét.
- Xem thêm: `HD_MUC_TIEU_PENTEST.md` (nhắm mục tiêu IP/web/PortSwigger/OffSec/HTB + VPN trong WSL2).

---

## 🩺 Xử lý sự cố

| Triệu chứng | Nguyên nhân & cách sửa |
|---|---|
| `ERR_CONNECTION_REFUSED` khi mở `/ui` | Server chưa chạy. Chạy `bash run_webui.sh` (WSL), chờ ~5s. |
| Server tắt ngay, log có `.env: line N: $'\r'` | `.env` bị CRLF. Sửa: `python -c "d=open('.env','rb').read();open('.env','wb').write(d.replace(b'\r\n',b'\n'))"` (đã hardening trong `run_webui.sh`). |
| `No module named fastapi/cai` | Chưa cài. Chạy `bash install_cai_linux.sh` hoặc `uv pip install --python ~/.cai_env/bin/python -e /mnt/d/CAI_LO`. |
| Agent chỉ viết kế hoạch, không chạy tool | Model quá yếu (gemini-lite / Ollama 7B). Đổi sang `groq/openai/gpt-oss-120b`. |
| `AuthenticationError` / `Incorrect API key` | Key sai/placeholder trong `.env`. Kiểm tra `OPENAI_API_KEY` không phải `"ollama"`, `GROQ_API_KEY` đúng. |
| Agent gọi tool báo `working_directory does not exist` | Model tự truyền cwd sai. Trong prompt ghi rõ **"KHÔNG đặt working_directory"**. |
| Cổng 8000 bận | Đã có server chạy. Dừng: `wsl.exe bash -lc 'pkill -f run_api_server'` rồi bật lại. |
| Lệnh `cai` toàn cục lỗi | Symlink `/usr/local/bin/cai` có thể trỏ sai. Dùng cách `source ~/.cai_env/bin/activate && cai` như trên. |

---

## 📚 Tài liệu liên quan trong repo

- `README.md` — giới thiệu dự án + cài đặt 1-click.
- `HD_CAI_DAT.md` — hướng dẫn cài đặt cho người clone.
- `HD_MUC_TIEU_PENTEST.md` — nhắm mục tiêu (IP/web/lab) + chạy VPN trong WSL2.
- `webui/ROADMAP.md` — lộ trình phát triển Web Dashboard.
