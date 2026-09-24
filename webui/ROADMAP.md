# Lộ trình phát triển Front-end — CAI Pentest Dashboard

> Bảng điều khiển quan sát (observability) chỉ-đọc cho pentest agent, dùng nội bộ được ủy quyền. Loopback-only, giao diện tiếng Việt, chủ đề tối, không build step. Lộ trình dưới đây tổng hợp 4 góc nhìn (robustness / khai thác API backend / UX-product / vận hành pentest), khử trùng lặp và sắp xếp theo **giá trị cao / rủi ro thấp trước**.

---

## Phán quyết kiến trúc: KHÔNG chuyển sang build (giữ vanilla, tách ES module)

Giữ nguyên cách tiếp cận **một file, không build**. Đây là công cụ cá nhân ~561 dòng, chạy loopback, phục vụ qua FastAPI tại `/ui`, mở từ trình duyệt Windows qua WSL. Một build step (Vite/React + node_modules + cổng thứ hai + bước copy asset) sẽ phá vỡ vòng lặp "sửa `index.html` → refresh" mà gần như không đem lại lợi ích ở quy mô này.

**Việc nên làm thay thế:** tách khối `<script>` nội tuyến thành các **ES module native** (`state.js`, `api.js`, `stream.js`, `phases.js`, `findings.js`, `redact.js`, `log.js`, `ui.js`) phục vụ từ mount `/ui/static` **đã có sẵn**, nạp qua `<script type=module>`, đưa vào một vòng `state → render(state)` nhỏ. Lối thoát duy nhất nếu sau này reactivity trở nên đau: import **Preact + htm qua CDN bằng import-map** — vẫn zero build. Chỉ cân nhắc lại nếu làm đa-phiên song song (Later).

---

## An toàn & Rủi ro (đọc trước khi bắt đầu)

| # | Rủi ro | Ứng xử |
|---|--------|--------|
| 1 | **BACKEND — agent chạy 2 lần mỗi stream.** Sau khi phát `final`, `send_message_stream` gọi lại `Runner.run` để tái dựng lịch sử (app.py ~682-688). Với công cụ pentest, điều này **nhân đôi hoạt động thật lên mục tiêu** và là gốc rễ khiến UI kẹt "đang chạy". | Front-end chỉ che được triệu chứng (lật trạng thái trên `final`). **Phải sửa ở backend** (lưu history từ items của lần chạy đầu thay vì chạy lại). Ghi rõ trong UI rằng chi phí/hoạt động ≈ 2×. |
| 2 | **Log chứa credential + dữ liệu mục tiêu.** | Redaction mặc định BẬT; API key mặc định KHÔNG lưu; không bao giờ đưa dữ liệu nhạy cảm vào URL/query; giữ loopback-only, không mở ra LAN/Internet. |
| 3 | **`/ux/summarize` và `/ux/title` gửi steps/messages lên cloud Alias Robotics** (api.aliasrobotics.com qua `ALIAS_API_KEY`). | Mặc định TẮT, có cảnh báo tiếng Việt rõ "dữ liệu rời khỏi máy", chỉ hiện khi `ALIAS_API_KEY` được cấu hình. |
| 4 | **Stream POST-SSE không resume được** (không có Last-Event-ID, không dùng được EventSource GET). | Chỉ hứa **phát lại lịch sử sau khi chạy**, KHÔNG hứa reconnect vào stream đang chạy. |
| 5 | **Session lưu in-memory; `/history` trả message-list, không phải step objects.** | Gọi là "phiên gần đây", không phải kho lưu bền; replay cần adapter riêng và không khớp 100% với live. |
| 6 | **Phase & severity là heuristic regex.** | Gắn nhãn "nghi ngờ — cần xác minh"; coi LLM summary + reporter agent là nguồn chân lý, không phải bộ đếm. |
| 7 | **Không endpoint nào trả token usage.** | "Chi phí" chỉ là bảng giá theo model (rate card), KHÔNG phải chi tiêu thật. |

---

## 5 việc bắt tay ngay (quick wins)

1. **Lật trạng thái chạy ngay trên frame `event:'final'`** để nút "Bắt đầu" bật lại tức thì, thay vì chờ socket (và lần chạy thứ hai vô hình của backend) đóng.
2. **Áp class `.dot.err` đã định nghĩa sẵn (line 63)** khi lỗi stream/kết nối — trạng thái đã tồn tại nhưng chưa bao giờ được dùng.
3. **Lấy phase từ `step.agent` + `agent_switched`/`handoff`** thay vì chỉ regex trên text output — diệt các bước nhảy phase ảo; giữ regex làm fallback.
4. **Lưu API base URL / agent / max_turns / target / nháp prompt vào localStorage** (API key opt-in, mặc định OFF).
5. **Chặn nhánh `else` của `handleStep`** để frame `{raw}`/không rõ không render chữ "undefined"; thêm phím tắt Ctrl+Enter = Bắt đầu, Esc = Dừng.

---

## BÂY GIỜ (Now) — độ tin cậy + an toàn + nền tảng

| Tính năng | Mô tả | Endpoint | Effort | Giá trị |
|-----------|-------|----------|--------|---------|
| **Nền tảng: tách ES module + vòng state→render** | Tách `<script>` nội tuyến thành module native phục vụ từ `/ui/static` đã mount; đưa mọi cập nhật DOM qua `render(state)`. Làm một lượt cơ học khi app đang chạy, TRƯỚC khi thêm panel. | `/ui/static` (mount sẵn) | M | Nền cho mọi việc sau, giữ nguyên lợi thế zero-build. |
| **Kết thúc phiên đúng lúc + đồng hồ + watchdog treo** | Lật `running=false`, bật lại Start, dừng dot, đánh dấu phase cuối ngay trên `final`/`error`; vẫn drain reader tới khi đóng. Thêm đồng hồ elapsed + bộ đếm turn (so với max_turns). Watchdog: không có frame SSE trong N giây (vd 90s) → cảnh báo "Có thể đã treo" **không tự kill**. | `event:final`, `event:error`, `POST /interrupt` | M | Xóa bug khó hiểu nhất (UI kẹt "đang chạy") + tín hiệu treo/lặp thật. |
| **Phase từ trường có cấu trúc, không quét text** | Neo phase theo agent hiện tại + tên tool từ `tool_call` + `agent_switched`/`handoff`, map `{agent\|tool → phase}` seed từ `GET /agents`. Regex text chỉ là fallback. Hiện phase hiện tại (không chỉ max đơn điệu), chống flapping. | `GET /api/v1/agents`, SSE `tool_call`/`agent_switched`/`handoff` | M | Biến widget trạng thái từ "hay sai" thành "thường đúng", không đụng backend. |
| **Redaction credential/secret (log + export)** | Lớp che client-side áp TRƯỚC khi render/copy/export: header Authorization, Basic/Bearer, JWT, AWS/API key, khối PRIVATE KEY, `password=`/`-p`, dòng hash NTLM/MD5, connection string. Mặc định BẬT, có nút "hiện" từng dòng. Giá trị đã che không được lọt ra export dạng rõ. | — | M | Trực tiếp phục vụ nguyên tắc "log chứa credential"; giảm rủi ro khi share màn hình/xuất log. |
| **Cổng xác nhận ủy quyền + ghi nhớ target** | Modal trước `POST /sessions`: echo target/scope, bắt buộc tick "Tôi được ủy quyền kiểm thử phạm vi này", tùy chọn allowlist host/CIDR. Nhớ target gần đây (localStorage). Đóng dấu affirmation vào metadata phiên. | `POST /api/v1/sessions` (metadata.target) | S | Biến "chỉ dùng khi được ủy quyền" từ chữ trang trí thành checkpoint mỗi lần chạy. |
| **Ghi nhớ cấu hình bằng localStorage** | Lưu base URL, agent, max_turns, target, nháp prompt; khôi phục khi tải. API key sau checkbox opt-in mặc định OFF, nhãn "chỉ trên máy này". Bọc try/catch (an toàn cửa sổ ẩn danh). Lưu `sessionId` cuối để phục vụ replay. | — | S | Hết cảnh gõ lại key/prompt mỗi lần reload — ma sát lớn nhất. |
| **Lỗi rõ ràng + phân biệt auth/refused + gia cố parser** | Áp `.dot.err`, đặt status lỗi, banner có thể đóng. Rẽ nhánh `res.status`: 401/403 → "Cần API key" (mở mục cấu hình, focus ô key); network/refused → "Không kết nối được backend". Guard nhánh `else` của `handleStep`; parser chịu được CRLF + dòng comment. Thêm phím tắt Ctrl+Enter/Esc. | `GET /agents`, `GET /health` | S | Biến lỗi im lặng/mơ hồ thành thông điệp cụ thể, hành động được. |
| **Log giới hạn (ring buffer) + tải log đầy đủ** | Giữ ~2000 dòng cuối trong DOM (đánh dấu "… N dòng cũ đã ẩn"), giữ full text trong mảng JS cho nút "Tải log" (.txt/.json). Giới hạn `seenFindings`. Không phá autoscroll. Export áp redaction. | — | M | Giữ UI mượt trên chính các lần chạy dài mà nó sinh ra để quan sát. |

---

## TIẾP THEO (Next) — sản phẩm hóa: findings, báo cáo, tái hiện

| Tính năng | Mô tả | Endpoint | Effort | Giá trị |
|-----------|-------|----------|--------|---------|
| **Bảng Phát hiện có cấu trúc (triage)** | Thay 2 bộ đếm severity bằng model finding thật: mỗi finding giữ severity, signature (dedup sẵn có), nguồn (agent+tool+thời gian), excerpt gốc. Card có: đánh dấu false-positive (giảm đếm), ghi đè severity thủ công, "nhảy tới dòng log", ghim evidence. Nhãn "nghi ngờ — cần xác minh". Export Markdown/JSON. | SSE `tool_output`/`message` | L | Anchor: chuyển nhiễu thành artifact xem/sửa/xuất được — tiền đề của báo cáo & so sánh. |
| **Tìm kiếm + lọc log** | Client-side: ô tìm (lọc + highlight), chip loại (tool_call/tool_output/message/handoff/errors/findings), lọc severity, "x/y dòng khớp", "copy phần đang hiện". Giữ autoscroll. | — | S | Làm log dài đi lại được — giá trị hàng ngày cao, chi phí thấp. |
| **Drill-down từng bước + copy command/output** | Bỏ truncation (hiện cắt args 60, output 220 ký tự); giữ full step trong state (có giới hạn buffer). Row mở rộng: xem full arguments + "Copy command" tái dựng lời gọi; xem full output trong drawer + "Lưu làm evidence". | SSE `tool_call.arguments`/`tool_output.output` | M | Tái hiện & bằng chứng — thứ operator cần nhất để kiểm chứng và chạy lại thủ công. |
| **Streaming token-level (toggle)** | Toggle (mặc định bật) trỏ run sang `/messages/stream_tokens`; xử lý frame `token`/`message_start`/`message_end` để text agent hiện dần. `reasoning_step`/`final` giữ nguyên nên heuristic không đổi; giữ `/messages/stream` làm fallback. | `POST /messages/stream_tokens` | S | Text mượt hơn, gần như không đụng backend. Kiểm tra interrupt/cancel parity trước khi mặc định. |
| **Bộ chọn model + thẻ giá (rate card)** | `<select>` model từ `GET /models` nhóm theo provider, truyền `model` trong `POST /sessions` (đã honored). Thẻ hiện provider/category/pricing/capabilities. **Chỉ là bảng giá theo token**, KHÔNG phải chi tiêu thật (API không trả usage), và nhắc chi phí ≈ 2× do double-run backend. | `GET /api/v1/models`, `POST /sessions {model}` | M | Chọn model per-run + nhận thức chi phí, dùng endpoint đã có sẵn pricing. |
| **Dừng chắc chắn + timeout request** | Nâng Stop từ `/interrupt` (chỉ signal) lên `POST /cancel` (interrupt_and_wait — chờ task thoát) với trạng thái "Đang dừng…" → "Đã dừng". Thêm timeout AbortController cho fetch tạo phiên + mở stream (không phải thân stream). | `POST /cancel`, `POST /interrupt` | S | Chặn kẹt "Khởi tạo phiên…" vĩnh viễn; Stop đáng tin. Ghi rõ lần chạy tái dựng có thể không dừng được. |
| **Xuất báo cáo JSON / Markdown / PDF** | Ghép deliverable: findings (kèm evidence + trạng thái override), timeline tool/step, metadata (agent, model, session id, start/stop, duration, affirmation scope). JSON=raw, Markdown=báo cáo, PDF=`window.print` (không thư viện). Tùy chọn tóm tắt/tiêu đề qua `/ux/*` (opt-in, cảnh báo cloud, degrade sang template khi lỗi). Redaction áp mọi đường xuất. | `POST /ux/summarize`, `POST /ux/title` | M | Sản phẩm bàn giao — payoff của model findings. |
| **Trình duyệt & phát lại phiên + vòng đời phiên** | Panel "Phiên gần đây" từ `GET /sessions` (agent/model/created/history_length/metadata.target). Click → `GET /sessions/{id}/history` replay vào log (adapter map message→dòng, chạy lại heuristic). DELETE có xác nhận. Giữ `sessionId` sống để prompt tiếp nối trên phiên stateful. | `GET /sessions`, `GET /sessions/{id}/history`, `DELETE /sessions/{id}` | L | Từ view live-only thành console có ghi nhớ. Nhãn "bản ghi hội thoại", in-memory, mất khi restart. |

---

## VỀ SAU (Later) — mở rộng & hoàn thiện

| Tính năng | Mô tả | Endpoint | Effort | Giá trị |
|-----------|-------|----------|--------|---------|
| **Giám sát đa mục tiêu song song** | Refactor state đơn-phiên thành mảng run đồng thời, mỗi run có session/reader/AbortController/panel riêng, chuyển tab hoặc chia cột. Backend đã hỗ trợ nhiều session. | `POST /sessions` (N), `POST /messages/stream_tokens` (N), `POST /cancel` | L | Xem nhiều mục tiêu/agent cùng lúc — điểm nên cân nhắc lại quyết định no-build. |
| **Dải thời gian phiên (timeline)** | Timeline ngang từ timestamp chuyển phase + tool_call: elapsed-per-phase, số tool mỗi phase, scrubber nhảy log. Phụ thuộc phase đã đáng tin. | SSE (timestamps client-side) | M | Định hướng thời gian nhanh trên run dài. |
| **So sánh findings giữa các lần chạy (diff)** | Liệt kê run cũ, diff 2 run cùng scope theo signature: mới / đã hết / không đổi. Chỉ lưu **metadata đã redact** (title, scope, agent/model, signature/severity), opt-in, có nút xóa lịch sử. | `GET /sessions`, `GET /sessions/{id}/history`, `DELETE`, localStorage | L | Câu chuyện retest — thứ khách hàng trả tiền. Mặc định metadata-only. |
| **Chủ đề sáng/tối + a11y + typography VN** | Bộ token màu thứ hai dưới `prefers-color-scheme` + toggle lưu localStorage. Sửa contrast (muted, chữ finding). Thêm `:focus-visible`, `aria-live` cho status/log, kiểm line-height dấu tiếng Việt trong log mono. Giữ system font (không thêm webfont CDN). | — | M | Dễ đọc, tiếp cận được, không thêm phụ thuộc. |
| **Heartbeat SSE + gia cố parser + responsive hẹp** | (Backend nhỏ) phát comment keepalive `: ping` để watchdog phân biệt "nmap dài" với "treo"; client bỏ qua comment nhưng reset timer. Parser render frame không đọc được thành dòng "khung không đọc được". Kiểm layout ~380px trên trình duyệt Windows. | `POST /messages/stream` | S | Watchdog đáng tin trên tool im lặng lâu; parser hết edge case; dùng được trên điện thoại. |

---

## Nguyên tắc xuyên suốt

- **Chỉ-đọc, không tự động tấn công.** Mọi tính năng chỉ làm giàu/đóng gói log backend sinh ra.
- **Loopback-only, không bao giờ mở ra LAN/Internet.**
- **Nhạy cảm mặc định an toàn:** redaction bật, API key không lưu, cloud `/ux/*` tắt & cảnh báo.
- **Trung thực về heuristic:** nhãn "nghi ngờ", LLM/reporter là nguồn chân lý.
- **Thực tế cho solo dev + AI:** ưu tiên các món S/M ở Now; các món L (findings panel, history, đa-phiên) chia nhỏ khi làm.

---

## Backlog checklist (đánh dấu khi xong)

### Bây giờ
- [ ] (M) Nền tảng: tách <script> nội tuyến thành ES module không-build + vòng state→render — `/ui/static`
- [ ] (M) Kết thúc phiên trên event 'final'/'error' + đồng hồ elapsed + bộ đếm turn + watchdog treo (không tự kill) — `event:final`, `event:error`, `POST /api/v1/sessions/{id}/interrupt`
- [x] (M) Suy ra phase từ tool_call/agent_switched/handoff (map agent|tool→phase), regex text chỉ là fallback — `GET /api/v1/agents`  ✅ quick win
- [ ] (M) Redaction credential/secret client-side áp trước render/copy/export, mặc định bật + nút hiện
- [ ] (S) Cổng xác nhận ủy quyền trước Start + nhớ target gần đây, đóng dấu affirmation vào metadata — `POST /api/v1/sessions`
- [x] (S) Ghi nhớ cấu hình bằng localStorage (base URL/agent/max_turns/target/nháp; API key opt-in OFF)  ✅ quick win (API key không bao giờ lưu)
- [ ] (S) Trạng thái lỗi rõ ràng (áp .dot.err, phân biệt 401/403 vs refused) + guard handleStep + phím tắt Ctrl+Enter/Esc — `GET /api/v1/agents`, `GET /api/v1/health`
- [ ] (M) Log ring-buffer (~2000 dòng) + nút tải log đầy đủ (.txt/.json) áp redaction

### Tiếp theo
- [ ] (L) Bảng Phát hiện có cấu trúc: triage, false-positive, ghi đè severity, evidence, jump-to-log, export MD/JSON — `POST /api/v1/sessions/{id}/messages/stream`
- [ ] (S) Tìm kiếm + lọc log client-side (text highlight, chip loại, lọc severity, copy phần hiện)
- [ ] (M) Drill-down từng bước: bỏ truncation, mở full arguments + copy command, full output + lưu evidence — `POST /api/v1/sessions/{id}/messages/stream`
- [ ] (S) Streaming token-level qua /messages/stream_tokens (toggle, fallback /messages/stream) — `POST /api/v1/sessions/{id}/messages/stream_tokens`
- [ ] (M) Bộ chọn model từ GET /models + thẻ giá (rate card, không phải chi tiêu thật) — `GET /api/v1/models`, `POST /api/v1/sessions`
- [ ] (S) Dừng chắc chắn qua POST /cancel (interrupt_and_wait) + timeout AbortController cho tạo phiên/mở stream — `POST /api/v1/sessions/{id}/cancel`, `POST /api/v1/sessions/{id}/interrupt`
- [ ] (M) Xuất báo cáo JSON/Markdown/PDF (window.print) + tóm tắt/tiêu đề /ux/* opt-in có cảnh báo cloud — `POST /api/v1/ux/summarize`, `POST /api/v1/ux/title`
- [ ] (L) Trình duyệt & phát lại phiên (history adapter) + tái dùng session stateful + DELETE có xác nhận — `GET /api/v1/sessions`, `GET /api/v1/sessions/{id}/history`, `DELETE /api/v1/sessions/{id}`

### Về sau
- [ ] (L) Giám sát đa mục tiêu song song (đa session/reader/AbortController + tab/split) — `POST /api/v1/sessions`, `POST /api/v1/sessions/{id}/messages/stream_tokens`, `POST /api/v1/sessions/{id}/cancel`
- [ ] (M) Dải thời gian phiên (timeline) từ timestamp phase/tool + scrubber
- [ ] (L) So sánh findings giữa các lần chạy (diff theo signature), lưu metadata-only opt-in + xóa lịch sử — `GET /api/v1/sessions`, `GET /api/v1/sessions/{id}/history`, `DELETE /api/v1/sessions/{id}`
- [ ] (M) Chủ đề sáng/tối + a11y (focus-visible, aria-live) + typography tiếng Việt
- [ ] (S) Heartbeat SSE keepalive (backend nhỏ) + parser chịu CRLF/comment/khung lỗi + responsive ~380px — `POST /api/v1/sessions/{id}/messages/stream`

