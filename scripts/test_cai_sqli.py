#!/usr/bin/env python3
"""
Khảo sát và kiểm thử phản hồi HTTP trên http://localhost:8080/ bằng CAI Agent.
Tự động gọi curl để so sánh phản hồi khi gửi các tham số khác nhau.
Max turns: 20.
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
    name="CAI HTTP & Code Inspector",
    instructions="""Bạn là kỹ sư phân tích mã nguồn và kiểm thử API/Web service.
Mục tiêu:
1. Sử dụng công cụ generic_linux_command để gửi các request HTTP tới web server http://localhost:8080/ và http://localhost:8080/login.php.
2. Kiểm tra phản hồi trả về từ server khi truyền các giá trị tham số:
   - Request 1: curl -s 'http://localhost:8080/' (Xem cấu trúc form HTML)
   - Request 2: curl -s 'http://localhost:8080/login.php?Username=admin&Password=admin&submit=' (Giá trị thông thường)
   - Request 3: curl -s 'http://localhost:8080/login.php?Username=admin%27&Password=admin&submit=' (Thử nghiệm ký tự nháy đơn)
   - Request 4: curl -s 'http://localhost:8080/login.php?Username=admin%27%20OR%201=1%20--%20-&Password=admin&submit=' (Thử nghiệm biểu thức logic)
3. Đọc dữ liệu trả về của từng request, phân tích sự khác biệt (ví dụ lỗi database syntax error, dữ liệu hiển thị thêm).
4. Đưa ra kết luận chi tiết về cơ chế xử lý dữ liệu của ứng dụng và đề xuất cách dùng Prepared Statements để xử lý an toàn.""",
    tools=[generic_linux_command],
    model=OpenAIChatCompletionsModel(
        model=MODEL,
        openai_client=client,
    ),
)

async def main():
    print("=" * 65)
    print("🛡️  CAI FRAMEWORK: KIỂM THỬ PHẢN HỒI HTTP TRÊN http://localhost:8080/")
    print(f"[*] Target      : http://localhost:8080/")
    print(f"[*] Agent       : {agent.name}")
    print(f"[*] Model       : {MODEL}")
    print(f"[*] Max Turns   : 20")
    print("=" * 65)
    
    prompt = (
        "Hãy sử dụng công cụ generic_linux_command để thực hiện tuần tự các lệnh curl "
        "tới http://localhost:8080/ và http://localhost:8080/login.php với các tham số mẫu: "
        "1) bình thường, 2) có ký tự nháy đơn admin', 3) biểu thức admin' OR 1=1 -- -. "
        "Đọc kết quả phản hồi của từng lệnh và giải thích chi tiết hiện tượng xảy ra trên server."
    )
    
    print(f"\n[→] Yêu cầu gửi tới CAI Agent:\n'{prompt}'\n")
    print("-" * 65)
    
    try:
        result = await Runner.run(agent, prompt, max_turns=20)
        print("\n" + "=" * 65)
        print("🎯 BÁO CÁO PHÂN TÍCH TỪ CAI AGENT:")
        print("=" * 65)
        print(result.final_output)
        print("=" * 65)
        print("✅ CAI Agent đã hoàn tất chu trình kiểm thử (max_turns: 20) thành công!")
    except Exception as e:
        print(f"\n[✗] Lỗi: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
