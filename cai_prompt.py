#!/usr/bin/env python3
"""
CLI tiện ích chạy Prompt với CAI Framework (tích hợp Google Gemini).
Sử dụng:
    python cai_prompt.py "Prompt của bạn"
    python cai_prompt.py              (Chế độ tương tác hỏi - đáp)
"""

import os
import sys
import asyncio

# Cấu hình API Key và Base URL
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
MODEL = "openai/gemini-3.6-flash"

# Thiết lập biến môi trường cho CAI và LiteLLM
os.environ["CAI_LICENSE_OFF"] = "1"
os.environ["CAI_STREAM"] = "false"
os.environ["CAI_NO_STARTUP_HINTS"] = "1"
os.environ["CAI_SKIP_UPDATE_CHECK"] = "1"
os.environ["OPENAI_API_KEY"] = GEMINI_API_KEY
os.environ["OPENAI_API_BASE"] = BASE_URL
os.environ["OPENAI_BASE_URL"] = BASE_URL
os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY

import litellm
litellm.api_base = BASE_URL
litellm.drop_params = True

from openai import AsyncOpenAI
from cai.sdk.agents import Agent, Runner, OpenAIChatCompletionsModel, set_tracing_disabled
set_tracing_disabled(True)

client = AsyncOpenAI(
    api_key=GEMINI_API_KEY,
    base_url=BASE_URL,
)

agent = Agent(
    name="CAI Cybersecurity Agent",
    instructions="""Bạn là chuyên gia an ninh mạng và AI agent của CAI Framework. 
Nhiệm vụ của bạn là hỗ trợ phân tích an toàn thông tin, bảo mật mã nguồn, phát hiện lỗ hổng và đề xuất giải pháp vá lỗi. 
Hãy trả lời một cách chuyên nghiệp, chính xác và dễ hiểu bằng tiếng Việt.""",
    model=OpenAIChatCompletionsModel(
        model=MODEL,
        openai_client=client,
    ),
)

async def ask_cai(prompt_text: str):
    print(f"\n[🤖 CAI đang suy nghĩ...]\n")
    result = await Runner.run(agent, prompt_text)
    print(f"\n[📋 Kết quả từ CAI Agent]:\n")
    print(result.final_output)
    print("\n" + "-" * 60)

async def main():
    if len(sys.argv) > 1:
        # Nhận prompt từ tham số dòng lệnh
        prompt_text = " ".join(sys.argv[1:])
        print(f"[>] Prompt: {prompt_text}")
        await ask_cai(prompt_text)
    else:
        # Chế độ tương tác
        print("=" * 60)
        print("🛡️  CAI FRAMEWORK INTERACTIVE PROMPT (Gemini 3.6 Flash)")
        print("Gõ câu hỏi của bạn và nhấn Enter (Gõ 'exit' hoặc 'quit' để thoát).")
        print("=" * 60)
        while True:
            try:
                user_input = input("\n[Bạn] > ").strip()
                if not user_input:
                    continue
                if user_input.lower() in ("exit", "quit", "q"):
                    print("Tạm biệt!")
                    break
                await ask_cai(user_input)
            except (KeyboardInterrupt, EOFError):
                print("\nĐã thoát.")
                break

if __name__ == "__main__":
    asyncio.run(main())
