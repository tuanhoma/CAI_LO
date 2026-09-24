#!/usr/bin/env python3
"""
Test CAI Framework kết nối với Ollama (Model: qwen2.5-coder:1.5b).
Chạy hoàn toàn cục bộ trên GPU NVIDIA RTX 4050.
"""

import os
import sys
import asyncio

OLLAMA_HOST = "http://172.17.96.1:11434"
MODEL = "ollama/qwen2.5-coder:1.5b"

# Cấu hình môi trường cho CAI & LiteLLM
os.environ["CAI_LICENSE_OFF"] = "1"
os.environ["CAI_STREAM"] = "false"
os.environ["CAI_NO_STARTUP_HINTS"] = "1"
os.environ["CAI_SKIP_UPDATE_CHECK"] = "1"
os.environ["OLLAMA_API_BASE"] = OLLAMA_HOST
os.environ["OLLAMA_HOST"] = OLLAMA_HOST
os.environ["CAI_MODEL"] = MODEL

# Cung cấp key dummy để các module phụ không báo thiếu key
os.environ["OPENAI_API_KEY"] = "sk-ollama-local"

import litellm
litellm.api_base = OLLAMA_HOST
litellm.drop_params = True

async def test_ollama_direct():
    print("=" * 65)
    print("BƯỚC 1: Test LiteLLM gọi Ollama trực tiếp")
    print(f"[*] Endpoint : {OLLAMA_HOST}")
    print(f"[*] Model    : {MODEL}")
    print("=" * 65)
    
    resp = await litellm.acompletion(
        model=MODEL,
        messages=[{"role": "user", "content": "Nói 'Xin chào từ Ollama Qwen Coder' trong 1 câu."}],
        api_base=OLLAMA_HOST,
    )
    output = resp.choices[0].message.content
    print(f"[✓] Ollama Output:\n{output.strip()}\n")

async def test_cai_agent_ollama():
    print("=" * 65)
    print("BƯỚC 2: Test CAI Agent (Agent + Runner) với Ollama Local")
    print("=" * 65)
    
    from openai import AsyncOpenAI
    from cai.sdk.agents import Agent, Runner, OpenAIChatCompletionsModel, set_tracing_disabled
    set_tracing_disabled(True)

    client = AsyncOpenAI(
        api_key="ollama",
        base_url=f"{OLLAMA_HOST}/v1",
    )

    agent = Agent(
        name="CAI Local Security Assistant",
        instructions="Bạn là trợ lý AI an ninh mạng chạy offline qua Ollama. Trả lời súc tích bằng tiếng Việt.",
        model=OpenAIChatCompletionsModel(
            model=MODEL,
            openai_client=client,
        ),
    )

    prompt = "Giải thích ngắn gọn 2 lý do tại sao nên dùng Prepared Statements để chống SQL Injection?"
    print(f"[→] Gửi prompt tới CAI Agent: '{prompt}'\n")
    print("-" * 65)
    
    result = await Runner.run(agent, prompt)
    print(f"[✓] CAI AGENT RESPONSE:\n\n{result.final_output.strip()}")
    print("\n" + "=" * 65)
    print("🎉 THÀNH CÔNG: CAI Framework đã chạy mượt mà với Ollama cục bộ!")

async def main():
    await test_ollama_direct()
    await test_cai_agent_ollama()

if __name__ == "__main__":
    asyncio.run(main())
