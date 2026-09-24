@echo off
chcp 65001 >nul
:: Chạy CAI Framework prompt trong WSL Ubuntu
wsl -d Ubuntu -e bash -c "cp '/mnt/c/Users/Tuan Anh/cai-project/cai_prompt.py' /tmp/cai_prompt.py && sed -i 's/\r$//' /tmp/cai_prompt.py && /root/.cai_env/bin/python /tmp/cai_prompt.py %*"
pause
