#!/usr/bin/env python3
"""Test Gemini API key + CAI SDK Agent."""
import httpx, json, sys, asyncio, os

API_KEY = os.environ.get("GEMINI_API_KEY", "")
# Model được Google khuyến nghị dùng mới nhất
MODEL = "gemini-3.6-flash"

# ─── Bước 1: REST test trực tiếp ───
print("=" * 55)
print("BƯỚC 1: Test REST API Gemini trực tiếp")
print("=" * 55)

url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"
payload = {
    "contents": [{"parts": [{"text": "Reply in Vietnamese: bạn là gì và bạn có thể làm gì trong cybersecurity?"}]}]
}

print(f"[→] Model  : {MODEL}")
print(f"[→] API Key: {API_KEY[:8]}...{API_KEY[-4:]}")
print(f"[→] Sending prompt...")

r = httpx.post(url, json=payload, timeout=30)
print(f"[✓] HTTP Status: {r.status_code}")

if r.status_code == 200:
    result = r.json()
    text = result["candidates"][0]["content"]["parts"][0]["text"]
    print(f"[✓] Gemini REST Response:\n{text}")
else:
    print(f"[✗] Error: {r.text[:500]}")
    sys.exit(1)

# ─── Bước 2: CAI SDK Agent test ───
print()
print("=" * 55)
print("BƯỚC 2: Test prompt qua CAI SDK Agent")
print("=" * 55)

os.environ["CAI_LICENSE_OFF"] = "1"
os.environ["CAI_STREAM"] = "false"
os.environ["OPENAI_API_KEY"] = "sk-placeholder"
os.environ["GEMINI_API_KEY"] = API_KEY
os.environ["CAI_NO_STARTUP_HINTS"] = "1"
os.environ["CAI_SKIP_UPDATE_CHECK"] = "1"

async def run_cai_agent():
    from cai.sdk.agents import (
        Agent, Runner, OpenAIChatCompletionsModel, set_tracing_disabled
    )
    from openai import AsyncOpenAI
    set_tracing_disabled(True)

    client = AsyncOpenAI(
        api_key=API_KEY,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )

    agent = Agent(
        name="CAI Cybersecurity Agent",
        instructions="You are a cybersecurity expert. Answer clearly and concisely in Vietnamese.",
        model=OpenAIChatCompletionsModel(
            model=MODEL,
            openai_client=client,
        ),
    )

    prompt = "Liệt kê 3 lỗ hổng bảo mật web phổ biến nhất theo OWASP Top 10 năm 2023."
    print(f"[→] CAI Prompt: '{prompt}'")
    print("-" * 55)

    result = await Runner.run(agent, prompt)
    print(f"[✓] CAI Agent Response:\n{result.final_output}")
    print("-" * 55)
    print("\n[🎉] TEST THÀNH CÔNG! CAI hoạt động với Gemini API.")

asyncio.run(run_cai_agent())
