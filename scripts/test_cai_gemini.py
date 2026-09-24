#!/usr/bin/env python3
"""Test CAI Agent với Google Gemini qua OpenAI-compatible endpoint."""
import os
import sys
import asyncio

API_KEY = os.environ.get("GEMINI_API_KEY", "")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
MODEL = "gemini-3.6-flash"  # Chuẩn Google yêu cầu

os.environ["CAI_LICENSE_OFF"] = "1"
os.environ["CAI_STREAM"] = "false"
os.environ["CAI_NO_STARTUP_HINTS"] = "1"
os.environ["CAI_SKIP_UPDATE_CHECK"] = "1"

# Cấu hình để LiteLLM và OpenAI client dùng Google Gemini base URL
os.environ["OPENAI_API_KEY"] = API_KEY
os.environ["OPENAI_API_BASE"] = BASE_URL
os.environ["OPENAI_BASE_URL"] = BASE_URL
os.environ["GEMINI_API_KEY"] = API_KEY

import litellm
litellm.api_base = BASE_URL
litellm.drop_params = True

async def test():
    print("=" * 60)
    print("BƯỚC 1: Test LiteLLM acompletion với Google Gemini")
    print("=" * 60)
    print(f"[→] Model   : openai/{MODEL}")
    print(f"[→] Base URL: {BASE_URL}")
    print(f"[→] Sending prompt...")
    
    resp = await litellm.acompletion(
        model=f"openai/{MODEL}",
        messages=[{"role": "user", "content": "Nói 'Xin chào từ Gemini 3.6 Flash' trong 1 câu."}],
        api_key=API_KEY,
        api_base=BASE_URL,
    )
    output = resp.choices[0].message.content
    print(f"[✓] LiteLLM Output: {output}")

    print("\n" + "=" * 60)
    print("BƯỚC 2: Test CAI Agent (Agent + Runner) với Gemini")
    print("=" * 60)
    
    from openai import AsyncOpenAI
    from cai.sdk.agents import Agent, Runner, OpenAIChatCompletionsModel, set_tracing_disabled
    set_tracing_disabled(True)

    client = AsyncOpenAI(
        api_key=API_KEY,
        base_url=BASE_URL,
    )

    agent = Agent(
        name="CAI Security Analyst",
        instructions="Bạn là chuyên gia an ninh mạng. Trả lời súc tích bằng tiếng Việt.",
        model=OpenAIChatCompletionsModel(
            model=f"openai/{MODEL}",
            openai_client=client,
        ),
    )

    prompt = "Liệt kê 3 phương pháp phòng chống tấn công SQL Injection cơ bản nhất."
    print(f"[→] CAI Agent Prompt: '{prompt}'")
    print("-" * 60)
    
    result = await Runner.run(agent, prompt)
    print(f"[✓] CAI AGENT RESPONSE:\n\n{result.final_output}")
    print("=" * 60)
    print("🎉 HOÀN THÀNH: CAI Framework đã chạy prompt thành công với Gemini API!")

if __name__ == "__main__":
    asyncio.run(test())
