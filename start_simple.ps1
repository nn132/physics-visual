# start_simple.ps1
# Robust startup script with python/py detection (ASCII-only)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BackendDir = Join-Path $ScriptDir 'backend'

Write-Host "ScriptDir: $ScriptDir"
Write-Host "BackendDir: $BackendDir"

if (-not (Test-Path $BackendDir)) {
    Write-Host "Backend directory not found: $BackendDir" -ForegroundColor Red
    exit 1
}

# Detect which Python command to use: prefer 'python', fall back to 'py'
$pythonCmd = $null
$pythonArgs = @()

if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = 'python'
    Write-Host "Detected: python" -ForegroundColor Green
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCmd = 'py'
    $pythonArgs = @('-3')
    Write-Host "Detected: py (Python Launcher)" -ForegroundColor Green
}

if (-not $pythonCmd) {
    Write-Host ""
    Write-Host "ERROR: Python not found in PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "If you just installed Python:" -ForegroundColor Yellow
    Write-Host "  1. Close this PowerShell window" -ForegroundColor Yellow
    Write-Host "  2. Open a NEW PowerShell window" -ForegroundColor Yellow
    Write-Host "  3. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "If Python is not installed:" -ForegroundColor Yellow
    Write-Host "  Download from: https://www.python.org/downloads/" -ForegroundColor Cyan
    Write-Host "  Make sure to check 'Add Python to PATH' during installation" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

$venv = Join-Path $BackendDir 'venv'
$venvPython = Join-Path $venv 'Scripts\python.exe'
$venvPip = Join-Path $venv 'Scripts\pip.exe'

# Create virtual environment if missing
if (-not (Test-Path $venv)) {
    Write-Host "Creating virtual environment..."
    & $pythonCmd @pythonArgs -m venv $venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to create virtual environment." -ForegroundColor Red
        Write-Host "Command used: $pythonCmd $pythonArgs -m venv $venv" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "Virtual environment created successfully." -ForegroundColor Green
}

# Install requirements
$reqFile = Join-Path $BackendDir 'requirements.txt'
if (Test-Path $venvPip) {
    Write-Host "Installing requirements..."
    & $venvPip install -q --upgrade pip
    & $venvPip install -q -r $reqFile
    Write-Host "Dependencies installed." -ForegroundColor Green
} else {
    Write-Host "Installing requirements (fallback to global Python)..." -ForegroundColor Yellow
    & $pythonCmd @pythonArgs -m pip install -q --upgrade pip
    & $pythonCmd @pythonArgs -m pip install -q -r $reqFile
}

# Start backend server
Write-Host ""
Write-Host "Starting Flask backend server..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow
Write-Host ""

$serverPath = Join-Path $BackendDir 'server.py'
if (Test-Path $venvPython) {
    & $venvPython $serverPath
} else {
    & $pythonCmd @pythonArgs $serverPath
}
