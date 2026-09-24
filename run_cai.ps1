$env:PROMPT_TOOLKIT_NO_CPR = "1"
$env:CAI_STREAM = "false"

# 1. Tu dong them cong cu Pentest vao PATH
if (Test-Path "$PSScriptRoot\ReconTools\nmap") {
    $env:PATH = "$PSScriptRoot\ReconTools\nmap;" + $env:PATH
} elseif (Test-Path "$env:USERPROFILE\ReconTools\nmap") {
    $env:PATH = "$env:USERPROFILE\ReconTools\nmap;" + $env:PATH
}

if (Test-Path "$PSScriptRoot\ReconTools") {
    $env:PATH = "$PSScriptRoot\ReconTools;" + $env:PATH
} elseif (Test-Path "$env:USERPROFILE\ReconTools") {
    $env:PATH = "$env:USERPROFILE\ReconTools;" + $env:PATH
}

if (Test-Path "$env:USERPROFILE\go\bin") {
    $env:PATH = "$env:USERPROFILE\go\bin;" + $env:PATH
}
if (Test-Path "$env:LOCALAPPDATA\Python\pythoncore-3.14-64\Scripts") {
    $env:PATH = "$env:LOCALAPPDATA\Python\pythoncore-3.14-64\Scripts;" + $env:PATH
}

# 2. Them Git Linux tools va Ollama vao PATH
if (Test-Path "C:\Program Files\Git\usr\bin") {
    $env:PATH = "C:\Program Files\Git\usr\bin;C:\Program Files\Git\bin;" + $env:PATH
}
if (Test-Path "$env:LOCALAPPDATA\Programs\Ollama") {
    $env:PATH = "$env:LOCALAPPDATA\Programs\Ollama;" + $env:PATH
}

# 3. Kiem tra va khoi dong Ollama neu chua chay
try {
    $null = Invoke-WebRequest -Uri "http://localhost:11434" -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
} catch {
    Write-Host "[*] Dang khoi dong dich vu Ollama chay ngam..." -ForegroundColor Cyan
    Start-Process -FilePath "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 2
}

# 4. Kich hoat moi truong ao cai_env
if (Test-Path "$PSScriptRoot\cai_env\Scripts\Activate.ps1") {
    & "$PSScriptRoot\cai_env\Scripts\Activate.ps1"
} elseif (Test-Path "$env:USERPROFILE\cai_env\Scripts\Activate.ps1") {
    & "$env:USERPROFILE\cai_env\Scripts\Activate.ps1"
}

# 5. Chay CAI
if ($args.Count -eq 0) {
    & "$PSScriptRoot\cai_env\Scripts\cai.exe" --agent 20
} else {
    & "$PSScriptRoot\cai_env\Scripts\cai.exe" @args
}
