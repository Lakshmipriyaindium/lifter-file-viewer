@echo off
:: Lifter-File-Viewer - Zero-Permission Windows Setup Script
:: NOTE: This launcher is for Windows only.
:: macOS/Linux users: run ./install.sh from this same folder.
echo Launching automated Windows installer...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ScriptDir='%~dp0'; Invoke-Expression (([System.IO.File]::ReadAllText('%~f0') -split '(?ms)^# <POWERSHELL_START>')[1])"
echo ------------------------------------------------
pause
exit /b

# <POWERSHELL_START>
# ============================================================
# Lifter-File-Viewer — Windows Setup & Dev Launcher Script
# ============================================================

# Enable UTF8 output representation
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Lifter-File-Viewer  ·  Windows Dev Launcher    " -ForegroundColor Cyan
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
        $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
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
        $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')

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

# Check/Install npm
$hasNpm = $null -ne (Get-Command npm -ErrorAction SilentlyContinue)
if (-not $hasNpm) {
    if ($hasWinget) {
        Write-Host "⌛ npm not found. Installing / repairing Node.js LTS via winget..." -ForegroundColor Cyan
        & winget install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements
        # Refresh path env
        $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')

        # Verify again
        $hasNpm = $null -ne (Get-Command npm -ErrorAction SilentlyContinue)
        if (-not $hasNpm) {
            $standardPath = "$env:ProgramFiles\nodejs"
            if (Test-Path "$standardPath\npm.cmd") {
                $env:Path += ";$standardPath"
                $hasNpm = $true
            }
        }
    }
}

if (-not $hasNpm) {
    Write-Error "npm not found. Please reinstall Node.js (which includes npm) from https://nodejs.org/"
    exit 1
}

$npmVersion = & npm -v
Write-Host "✔ npm found: $npmVersion" -ForegroundColor Green

# ── Step 2: Resolve Directory & Git Clone ───────────────────
Write-Host "`n━━━  Locating project source  ━━━" -ForegroundColor White

if ([string]::IsNullOrEmpty($ScriptDir)) {
    $ScriptDir = Get-Location
}

$RepoUrl = "https://github.com/Lakshmipriyaindium/lifter-file-viewer.git"
$RepoDirName = "Lifter-File-Viewer"
$ProjectDir = $ScriptDir

if (-not (Test-Path "$ScriptDir\package.json")) {
    $targetCloneDir = "$ScriptDir\$RepoDirName"
    if (Test-Path $targetCloneDir) {
        Write-Host "⌛ Found existing directory at $targetCloneDir." -ForegroundColor Yellow
        Write-Host "⌛ Deleting existing clone for a fresh setup..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $targetCloneDir
        Write-Host "✔ Previous directory removed." -ForegroundColor Green
    }

    $ProjectDir = $targetCloneDir
    Write-Host "⌛ Attempting fresh git clone..." -ForegroundColor Cyan
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

# ── Step 4: Launch Electron in development mode ─────────────
Write-Host "`n━━━  Launching Electron Dev Mode  ━━━" -ForegroundColor White

$packageJsonPath = "$ProjectDir\package.json"
if (-not (Test-Path $packageJsonPath)) {
    Write-Error "package.json not found in $ProjectDir"
    exit 1
}

$packageJson = Get-Content -Raw -Path $packageJsonPath | ConvertFrom-Json
$scriptNames = @()
if ($null -ne $packageJson.scripts) {
    $scriptNames = @($packageJson.scripts.PSObject.Properties.Name)
}

$devScript = $null
if ($scriptNames -contains "electron:dev") {
    $devScript = "electron:dev"
} elseif ($scriptNames -contains "dev:electron") {
    $devScript = "dev:electron"
} elseif ($scriptNames -contains "start") {
    $devScript = "start"
} elseif ($scriptNames -contains "dev") {
    $devScript = "dev"
}

if ([string]::IsNullOrEmpty($devScript)) {
    Write-Error "No Electron dev script found. Expected one of: electron:dev, dev:electron, start, dev"
    exit 1
}

Write-Host "✔ Using npm script: $devScript" -ForegroundColor Green
Write-Host "⌛ Running: npm run $devScript" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop the development app." -ForegroundColor Yellow

& npm run $devScript
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to run npm script '$devScript'."
    exit 1
}
 