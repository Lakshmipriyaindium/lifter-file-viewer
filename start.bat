@echo off
setlocal

:: Change to the application directory
cd /d "%~dp0"

:: Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js from https://nodejs.org/ to run this application.
    pause
    exit /b 1
)

echo Checking dependencies...
:: Install dependencies if node_modules is missing
if not exist "node_modules\" (
    echo Installing required dependencies...
    call npm install --no-fund --no-audit
)

echo Starting application...
:: Start the application (Vite will automatically open the browser because of the --open flag)
call npm start

endlocal
