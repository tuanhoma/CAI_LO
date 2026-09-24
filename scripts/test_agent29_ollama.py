#!/usr/bin/env python3
"""
Kiểm thử Agent 29 (Web App Pentester) trong CAI kết nối với Ollama qua OpenAI-compatible endpoint.
Thực hiện khảo sát và phân tích cấu trúc form tại http://localhost:8080/.
"""

import os
import sys
import asyncio

OLLAMA_BASE = "http://172.17.96.1:11434/v1"
MODEL = "openai/qwen2.5-coder:1.5b"

# Thiết lập môi trường cho CAI kết nối với Ollama qua /v1
os.environ["CAI_LICENSE_OFF"] = "1"
os.environ["CAI_STREAM"] = "false"
os.environ["CAI_NO_STARTUP_HINTS"] = "1"
os.environ["CAI_SKIP_UPDATE_CHECK"] = "1"
os.environ["OPENAI_API_KEY"] = "ollama"
os.environ["OPENAI_API_BASE"] = OLLAMA_BASE
os.environ["OPENAI_BASE_URL"] = OLLAMA_BASE
os.environ["CAI_MODEL"] = MODEL

import litellm
litellm.api_base = OLLAMA_BASE
litellm.drop_params = True

from openai import AsyncOpenAI
from cai.sdk.agents import Runner, OpenAIChatCompletionsModel, set_tracing_disabled
from cai.agents.web_pentester import web_pentester_agent

set_tracing_disabled(True)

client = AsyncOpenAI(
    api_key="ollama",
    base_url=OLLAMA_BASE,
)

web_pentester_agent.model = OpenAIChatCompletionsModel(
    model=MODEL,
    openai_client=client,
)

async def main():
    print("=" * 65)
    print("🛡️  KIỂM THỬ AGENT 29 (Web App Pentester) VỚI OLLAMA LOCAL")
    print(f"[*] Agent       : {web_pentester_agent.name}")
    print(f"[*] Model       : {MODEL}")
    print(f"[*] Endpoint    : {OLLAMA_BASE}")
    print(f"[*] Target      : http://localhost:8080/")
    print("=" * 65)

    prompt = (
        "Khảo sát trang web tại http://localhost:8080/. "
        "Sử dụng công cụ để kiểm tra cấu trúc mã HTML, form đăng nhập và các trường input của trang này, "
        "sau đó báo cáo kết quả chi tiết bằng tiếng Việt."
    )

    print(f"[→] Gửi yêu cầu: '{prompt}'\n")
    print("-" * 65)

    try:
        result = await Runner.run(web_pentester_agent, prompt, max_turns=5)
        print("\n" + "=" * 65)
        print("🎯 KẾT QUẢ TỪ AGENT 29 (Ollama):")
        print("=" * 65)
        print(result.final_output)
        print("=" * 65)
        print("✅ Agent 29 đã chạy thành công trên mô hình Ollama cục bộ!")
    except Exception as e:
        print(f"\n[✗] Lỗi: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
