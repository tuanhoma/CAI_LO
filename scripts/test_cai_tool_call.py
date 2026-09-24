#!/usr/bin/env python3
"""
Test CAI Agent tự động khảo sát web form và kiểm tra input validation trên http://localhost:8080/.
"""

import os
import sys
import asyncio

API_KEY = os.environ.get("GEMINI_API_KEY", "")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
MODEL = "openai/gemini-3.6-flash"

os.environ["CAI_LICENSE_OFF"] = "1"
os.environ["CAI_STREAM"] = "false"
os.environ["CAI_NO_STARTUP_HINTS"] = "1"
os.environ["CAI_SKIP_UPDATE_CHECK"] = "1"
os.environ["OPENAI_API_KEY"] = API_KEY
os.environ["OPENAI_API_BASE"] = BASE_URL
os.environ["OPENAI_BASE_URL"] = BASE_URL
os.environ["GEMINI_API_KEY"] = API_KEY

import litellm
litellm.api_base = BASE_URL
litellm.drop_params = True

from openai import AsyncOpenAI
from cai.sdk.agents import Agent, Runner, OpenAIChatCompletionsModel, set_tracing_disabled
from cai.tools.reconnaissance.generic_linux_command import generic_linux_command

set_tracing_disabled(True)

client = AsyncOpenAI(
    api_key=API_KEY,
    base_url=BASE_URL,
)

agent = Agent(
    name="CAI QA & Security Inspector",
    instructions="""Bạn là kỹ sư kiểm thử bảo mật và phân tích phần mềm.
Khi nhận được yêu cầu kiểm thử một trang web nội bộ, hãy sử dụng công cụ generic_linux_command để:
1. Gửi lệnh curl -s kiểm tra trang chủ http://localhost:8080/
2. Xem form HTML và xác định các trường input, endpoint xử lý.
3. Thử nghiệm gửi dữ liệu qua curl tới endpoint xử lý với các giá trị mẫu để xem phản hồi của server.
4. Báo cáo kết quả chi tiết kèm mã nguồn phản hồi thu được từ server.""",
    tools=[generic_linux_command],
    model=OpenAIChatCompletionsModel(
        model=MODEL,
        openai_client=client,
    ),
)

async def main():
    print("=" * 65)
    print("🛡️  CAI FRAMEWORK: TEST AGENT (MAX_TURNS: 20)")
    print("=" * 65)
    
    prompt = (
        "Hãy dùng công cụ generic_linux_command chạy lệnh curl để kiểm tra trang web tại http://localhost:8080/. "
        "Xem form HTML có gì và thử gửi một request test tới form để xem server phản hồi như thế nào."
    )
    
    print(f"[→] Prompt: '{prompt}'\n")
    
    result = await Runner.run(agent, prompt, max_turns=20)
    print("\n" + "=" * 65)
    print("🎯 PHẢN HỒI TỪ CAI AGENT:")
    print("=" * 65)
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())
