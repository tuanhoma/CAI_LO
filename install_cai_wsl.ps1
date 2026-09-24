# ==============================================================================
# Script tự động cài đặt CAI vào WSL (chạy từ Windows PowerShell)
# ==============================================================================

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   KHOI DONG CAI DAT TU DONG CAI TRONG WSL          " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Kiem tra xem WSL da duoc cai dat chua
$wslInstalled = Get-Command wsl -ErrorAction SilentlyContinue
if (-not $wslInstalled) {
    Write-Host "[X] May cua ban chua bat WSL (Windows Subsystem for Linux)." -ForegroundColor Red
    Write-Host "Dang thuc hien kich hoat WSL va cai dat Ubuntu..." -ForegroundColor Yellow
    wsl --install -d Ubuntu
    Write-Host "[!] Neu he thong yeu cau khoi dong lai may tinh, vui long Restart va chay lai script nay sau khi khoi dong." -ForegroundColor Magenta
    Exit
}

# 2. Kiem tra cac ban phan phoi WSL hien co
Write-Host "`n[1/3] Dang kiem tra cac ban phan phoi WSL..." -ForegroundColor Yellow
$wslList = (wsl -l -q 2>$null) -replace "`0", "" # Bo ky tu null do ma hoa unicode cua wsl

$hasUbuntu = $false
foreach ($distro in $wslList) {
    $d = $distro.Trim()
    if ($d -like "*Ubuntu*") {
        $hasUbuntu = $true
        $targetDistro = $d
        break
    }
}

# 3. Neu chua co Ubuntu, tien hanh cai dat Ubuntu
if (-not $hasUbuntu) {
    Write-Host "[!] Chua tim thay ban phan phoi Ubuntu trong WSL (hien tai chi co cac ban khac nhu docker-desktop)." -ForegroundColor Yellow
    Write-Host "[+] Dang bat dau cai dat Ubuntu vao WSL..." -ForegroundColor Green
    Write-Host "    Qua trinh nay se tai khoang 500MB tu Microsoft Store, xin vui long cho trong giay lat..." -ForegroundColor Gray
    
    wsl --install -d Ubuntu
    
    Write-Host "`n[!] LUU Y: Khi cua so Ubuntu moi xuat hien, hay nhap Username va Password tuy chon cho Linux." -ForegroundColor Yellow
    Write-Host "Sau khi hoan tat tao user, hay chay lai script nay de tiep tuc cai dat CAI!" -ForegroundColor Cyan
    Exit
}
else {
    Write-Host "[OK] Da tim thay ban phan phoi: $targetDistro" -ForegroundColor Green
}

# 4. Chuan bi duong dan script cai dat tren WSL
$scriptDir = $PSScriptRoot
if (-not $scriptDir) {
    $scriptDir = (Get-Location).Path
}

# Chuyen duong dan Windows (C:\Users\...) thanh duong dan WSL mount (/mnt/c/Users/...)
$driveLetter = $scriptDir.Substring(0, 1).ToLower()
$pathWithoutDrive = $scriptDir.Substring(2).Replace("\", "/")
$wslScriptPath = "/mnt/$driveLetter$pathWithoutDrive/install_cai_linux.sh"

Write-Host "`n[2/3] Chuan bi thuc thi script cai dat ben trong $targetDistro..." -ForegroundColor Yellow
Write-Host "Duong dan script trong WSL: $wslScriptPath" -ForegroundColor Gray

# 5. Chay script ben trong WSL Ubuntu
Write-Host "`n[3/3] Dang chay qua trinh cai dat CAI trong Linux..." -ForegroundColor Yellow

$bashCommand = "sed -i 's/\r$//' '$wslScriptPath' && chmod +x '$wslScriptPath' && bash '$wslScriptPath'"

wsl -d $targetDistro -e bash -c $bashCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n====================================================" -ForegroundColor Green
    Write-Host "   DA HOAN TAT CAI DAT CAI TRONG WSL THANH CONG!    " -ForegroundColor Green
    Write-Host "====================================================" -ForegroundColor Green
    Write-Host "Ban co the chay CAI bang 1 trong 2 cach:" -ForegroundColor Cyan
    Write-Host "1. Click dup vao file 'start_cai.bat' o thu muc nay tren Windows." -ForegroundColor White
    Write-Host "2. Mo terminal WSL (go 'wsl') va go lenh: cai" -ForegroundColor White
}
else {
    Write-Host "`n[!] Co loi xay ra trong qua trinh cai dat (Exit code: $LASTEXITCODE)." -ForegroundColor Red
    Write-Host "Vui long kiem tra lai ket noi mang hoac quyen sudo trong WSL." -ForegroundColor Yellow
}
