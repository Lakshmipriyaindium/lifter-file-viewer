@echo off
:: Lifter-File-Viewer - Zero-Permission Windows Setup Script
echo Launching automated Windows installer...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ScriptDir='%~dp0'; Get-Content '%~f0' | Select-Object -Skip 5 | Out-String | Invoke-Expression"
echo ------------------------------------------------
pause
exit /b

# ============================================================
# Lifter-File-Viewer — Windows Setup & Installer Script
# ============================================================

# Enable UTF8 output representation
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Lifter-File-Viewer  ·  Windows Installer       " -ForegroundColor Cyan
Write-Host "   Electron + Vite + React + TypeScript App       " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# ── Step 1: System Checks ────────────────────────────────────
Write-Host "`n━━━  Checking System Requirements  ━━━" -ForegroundColor White

$hasWinget = $null -ne (Get-Command winget -ErrorAction SilentlyContinue)
if (-not $hasWinget) {
    Write-Host "⚠ winget (Windows Package Manager) not found. Automated environment installer is restricted." -ForegroundColor Yellow
}

# Check Git
$hasGit = $null -ne (Get-Command git -ErrorAction SilentlyContinue)
if (-not $hasGit) {
    if ($hasWinget) {
        Write-Host "⌛ Git not found. Installing Git via winget..." -ForegroundColor Cyan
        & winget install --id Git.Git -e --silent --accept-source-agreements --accept-package-agreements
        # Refresh Path env
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    } else {
        Write-Error "Git is not installed. Please download and install Git from https://git-scm.com/"
        exit 1
    }
}
$gitVersion = (git --version)
Write-Host "✔ Git found: $gitVersion" -ForegroundColor Green

# Check/Install Node.js
$hasNode = $null -ne (Get-Command node -ErrorAction SilentlyContinue)
if (-not $hasNode) {
    if ($hasWinget) {
        Write-Host "⌛ Node.js not found. Installing Node.js LTS via winget..." -ForegroundColor Cyan
        & winget install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements
        # Refresh path env variables to make node available immediately in this session
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        
        # Verify again
        $hasNode = $null -ne (Get-Command node -ErrorAction SilentlyContinue)
        if (-not $hasNode) {
            # Try searching standard paths
            $standardPath = "$env:ProgramFiles\nodejs"
            if (Test-Path "$standardPath\node.exe") {
                $env:Path += ";$standardPath"
                $hasNode = $true
            }
        }
    }
}

if (-not $hasNode) {
    Write-Error "Node.js not found. Please install Node.js (LTS version) from https://nodejs.org/"
    exit 1
}

$nodeVersion = & node -v
Write-Host "✔ Node.js found: $nodeVersion" -ForegroundColor Green

$npmVersion = & npm -v
Write-Host "✔ npm found: $npmVersion" -ForegroundColor Green

# ── Step 2: Resolve Directory & Git Clone ───────────────────
Write-Host "`n━━━  Locating project source  ━━━" -ForegroundColor White

if ([string]::IsNullOrEmpty($ScriptDir)) {
    $ScriptDir = Get-Location
}

$RepoUrl = "https://github.com/IndiumSoftware-AppEngineering/Lifter-File-Viewer.git"
$RepoDirName = "Lifter-File-Viewer"
$ProjectDir = $ScriptDir

if (-not (Test-Path "$ScriptDir\package.json")) {
    if (Test-Path "$ScriptDir\$RepoDirName\package.json") {
        $ProjectDir = "$ScriptDir\$RepoDirName"
        Write-Host "✔ Project source found at: $ProjectDir" -ForegroundColor Green
    } elseif (Test-Path "$ScriptDir\$RepoDirName\.git") {
        $ProjectDir = "$ScriptDir\$RepoDirName"
        Write-Host "⌛ Repository already cloned at $ProjectDir. Pulling latest changes..." -ForegroundColor Cyan
        Set-Location $ProjectDir
        & git pull --ff-only
        Write-Host "✔ Repository is up to date." -ForegroundColor Green
    } else {
        $ProjectDir = "$ScriptDir\$RepoDirName"
        Write-Host "⌛ Project source not found locally. Attempting git clone..." -ForegroundColor Cyan
        & git clone $RepoUrl $ProjectDir
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✔ Repository cloned successfully." -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "✖ Could not clone the repository." -ForegroundColor Red
            Write-Host "  This usually means you do not have access to the private GitHub repo." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "  Please ask the project team to share the project as a ZIP file." -ForegroundColor Yellow
            Write-Host "  Then extract it so your folder looks like this:" -ForegroundColor Yellow
            Write-Host "    📁 Lifter-File-Viewer-setup/" -ForegroundColor Yellow
            Write-Host "      ├── install.bat          ← installer script" -ForegroundColor Yellow
            Write-Host "      ├── package.json" -ForegroundColor Yellow
            Write-Host "      └── src/" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "  Then run: install.bat" -ForegroundColor Yellow
            exit 1
        }
    }
} else {
    Write-Host "✔ Project source found alongside this script: $ProjectDir" -ForegroundColor Green
}

# ── Step 3: Install npm dependencies ────────────────────────
Write-Host "`n━━━  Installing npm dependencies  ━━━" -ForegroundColor White
Set-Location $ProjectDir
Write-Host "⌛ Running: npm install ..." -ForegroundColor Cyan
& npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "npm install failed."
    exit 1
}
Write-Host "✔ All npm dependencies installed." -ForegroundColor Green

# ── Step 4: Build & package application ─────────────────────
Write-Host "`n━━━  Building the application  ━━━" -ForegroundColor White
Write-Host "⌛ Running: npm run dist (this may take a few minutes) ..." -ForegroundColor Cyan
& npm run dist
if ($LASTEXITCODE -ne 0) {
    Write-Error "Application packaging failed."
    exit 1
}
Write-Host "✔ Application packaged successfully." -ForegroundColor Green

# ── Step 5: Install & launch built app ──────────────────────
Write-Host "`n━━━  Installing and Launching  ━━━" -ForegroundColor White

$DistDir = "$ProjectDir\dist_electron"
$exeFile = Get-ChildItem -Path $DistDir -Filter "*.exe" | Select-Object -First 1

if ($null -eq $exeFile) {
    Write-Error "Could not find any generated .exe file in $DistDir"
    exit 1
}

Write-Host "✔ Found generated package: $($exeFile.Name)" -ForegroundColor Green

$desktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$targetPath = "$env:USERPROFILE\AppData\Local\Programs\Lifter-File-Viewer"

if (-not (Test-Path $targetPath)) {
    New-Item -ItemType Directory -Force -Path $targetPath | Out-Null
}

$destExe = "$targetPath\$($exeFile.Name)"
Write-Host "⌛ Copying executable to local programs directory..." -ForegroundColor Cyan
Copy-Item $exeFile.FullName -Destination $destExe -Force

# Unblock the file to bypass Windows SmartScreen warnings
Write-Host "⌛ Lifting Windows security restrictions (Unblock-File)..." -ForegroundColor Cyan
Unblock-File -Path $destExe
Write-Host "✔ Done! Security blocks removed." -ForegroundColor Green

# Create Desktop Shortcut
try {
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$desktopPath\Lifter-File-Viewer.lnk")
    $Shortcut.TargetPath = $destExe
    $Shortcut.WorkingDirectory = $targetPath
    $Shortcut.Save()
    Write-Host "✔ Created desktop shortcut: Lifter-File-Viewer" -ForegroundColor Green
} catch {
    Write-Host "⚠ Failed to create desktop shortcut. You can find the executable at: $destExe" -ForegroundColor Yellow
}

Write-Host "`n━━━  Installation Complete 🎉  ━━━" -ForegroundColor White
Write-Host "  Lifter-File-Viewer has been installed!" -ForegroundColor Green
Write-Host "  Launch Location: $destExe" -ForegroundColor Green
Write-Host "  Starting application now..." -ForegroundColor Cyan

# Launch
Start-Process $destExe
