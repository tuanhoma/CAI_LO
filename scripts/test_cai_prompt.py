#!/usr/bin/env python3
"""
Test script: gửi prompt tới CAI Framework sử dụng Google Gemini qua LiteLLM.
Chạy lệnh: python3 /tmp/test_cai_prompt.py YOUR_GEMINI_API_KEY
"""

import asyncio
import os
import sys


def setup_env(gemini_key: str, model: str):
    """Cấu hình biến môi trường cho CAI + Gemini."""
    os.environ["CAI_LICENSE_OFF"] = "1"
    os.environ["CAI_STREAM"] = "false"
    os.environ["PROMPT_TOOLKIT_NO_CPR"] = "1"
    os.environ["CAI_SKIP_UPDATE_CHECK"] = "1"
    os.environ["CAI_NO_STARTUP_HINTS"] = "1"
    os.environ["OPENAI_API_KEY"] = "sk-placeholder"          # LiteLLM vẫn cần biến này
    os.environ["GEMINI_API_KEY"] = gemini_key                # Google Gemini key
    os.environ["CAI_MODEL"] = model
    print(f"[✓] Model: {model}")
    print(f"[✓] GEMINI_API_KEY: {gemini_key[:8]}...{gemini_key[-4:]}")


async def run_prompt(prompt: str, model: str):
    """Gửi prompt tới CAI SDK Agent và in kết quả."""
    from cai.sdk.agents import (
        Agent,
        Runner,
        OpenAIChatCompletionsModel,
        set_tracing_disabled,
    )
    from openai import AsyncOpenAI

    set_tracing_disabled(True)

    # Dùng LiteLLM OpenAI-compatible endpoint để route sang Gemini
    client = AsyncOpenAI(
        api_key=os.environ["GEMINI_API_KEY"],
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )

    agent = Agent(
        name="CAI Security Agent",
        instructions=(
            "You are a helpful cybersecurity assistant. "
            "Answer questions clearly and concisely in the same language as the user."
        ),
        model=OpenAIChatCompletionsModel(
            model=model,
            openai_client=client,
        ),
    )

    print(f"\n[→] Sending prompt: \"{prompt}\"")
    print("-" * 60)

    result = await Runner.run(agent, prompt)

    print("[✓] CAI Response:")
    print(result.final_output)
    print("-" * 60)
    return result.final_output


def main():
    # Lấy API key từ argument hoặc biến môi trường
    gemini_key = None
    if len(sys.argv) > 1:
        gemini_key = sys.argv[1]
    if not gemini_key:
        gemini_key = os.environ.get("GEMINI_API_KEY", "")

    if not gemini_key or gemini_key == "YOUR_GEMINI_KEY_HERE":
        print("❌ Lỗi: Vui lòng cung cấp GEMINI_API_KEY!")
        print("   Cách dùng: python3 /tmp/test_cai_prompt.py AIza...")
        sys.exit(1)

    # Model Gemini hỗ trợ qua endpoint OpenAI-compatible
    model = "gemini-1.5-flash"  # hoặc gemini-1.5-pro, gemini-2.0-flash-exp

    setup_env(gemini_key, model)

    # Test prompts
    prompts = [
        "Xin chào! Hãy tự giới thiệu bản thân bạn là ai và bạn có thể làm gì trong lĩnh vực an ninh mạng?",
        "List the top 3 most common web vulnerabilities in OWASP Top 10.",
    ]

    for prompt in prompts:
        try:
            asyncio.run(run_prompt(prompt, model))
        except Exception as e:
            print(f"[✗] Lỗi khi chạy prompt: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

    print("\n[🎉] Tất cả test prompt đã thành công!")


if __name__ == "__main__":
    main()
