# 物理可视化平台 - 一键启动脚本
# 运行方式: .\start.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  物理可视化平台 - AI 后端启动脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 计算脚本目录与后端目录的绝对路径，避免相对路径导致的问题
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BackendDir = Join-Path $ScriptDir 'backend'

Write-Host "脚本目录: $ScriptDir" -ForegroundColor DarkCyan
Write-Host "后端目录: $BackendDir" -ForegroundColor DarkCyan

# 检查 Python 是否安装
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python 已安装: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ 未找到 Python，请先安装 Python 3.8+" -ForegroundColor Red
    exit 1
}

# 检查后端文件是否存在
if (-not (Test-Path (Join-Path $BackendDir 'server.py'))) {
    Write-Host "✗ 找不到后端文件 backend\server.py，请确认仓库结构完整" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "步骤 1: 检查环境..." -ForegroundColor Yellow

# 检查并创建虚拟环境（使用绝对路径）
$venvPath = Join-Path $BackendDir 'venv'
if (-not (Test-Path $venvPath)) {
    Write-Host "  创建 Python 虚拟环境..." -ForegroundColor Gray
    & python -m venv $venvPath
    Write-Host "  ✓ 虚拟环境创建完成" -ForegroundColor Green
} else {
    Write-Host "  ✓ 虚拟环境已存在" -ForegroundColor Green
}

# 激活虚拟环境（如果可用）并使用 venv 的 pip 安装依赖
$pipExe = Join-Path $venvPath 'Scripts\pip.exe'
$pythonExe = Join-Path $venvPath 'Scripts\python.exe'
if (-not (Test-Path $pipExe)) {
    Write-Host "警告：未找到虚拟环境中的 pip，尝试使用全局 pip 安装" -ForegroundColor Yellow
    $pipCmd = 'pip'
} else {
    $pipCmd = $pipExe
}

Write-Host ""
Write-Host "步骤 2: 安装依赖..." -ForegroundColor Yellow

# 检查是否需要安装 (通过检测 flask 目录)
$sitePkg = Join-Path $venvPath 'Lib\site-packages\flask'
if (-not (Test-Path $sitePkg)) {
    Write-Host "  安装 Python 包..." -ForegroundColor Gray
    & $pipCmd install -r (Join-Path $BackendDir 'requirements.txt')
    Write-Host "  ✓ 依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "  ✓ 依赖已安装" -ForegroundColor Green
}

Write-Host ""
Write-Host "步骤 3: 检查 API 密钥..." -ForegroundColor Yellow

# 检查环境变量
if ([string]::IsNullOrEmpty($env:DEEPSEEK_API_KEY)) {
    Write-Host ""
    Write-Host "⚠️  未检测到 DEEPSEEK_API_KEY 环境变量" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "请输入你的 DeepSeek API 密钥 (格式: sk-xxxxxxxxxx):" -ForegroundColor Cyan
    Write-Host "（如果没有密钥，请访问 https://platform.deepseek.com/ 申请）" -ForegroundColor Gray
    Write-Host ""
    $apiKey = Read-Host "API Key"
    if ([string]::IsNullOrEmpty($apiKey)) {
        Write-Host "✗ 未提供 API 密钥，后端将无法工作" -ForegroundColor Red
        Write-Host "  你仍可启动服务，但解析功能不可用" -ForegroundColor Gray
    }
    else {
        $env:DEEPSEEK_API_KEY = $apiKey
        Write-Host "✓ API 密钥已设置（临时）" -ForegroundColor Green
        Write-Host ""
        Write-Host "提示：若要永久保存，运行: setx DEEPSEEK_API_KEY `"$apiKey`"" -ForegroundColor Gray
    }
}

if (-not [string]::IsNullOrEmpty($env:DEEPSEEK_API_KEY)) {
    $maskedKey = $env:DEEPSEEK_API_KEY.Substring(0, [Math]::Min(8, $env:DEEPSEEK_API_KEY.Length)) + "..."
    Write-Host "  ✓ API 密钥已配置: $maskedKey" -ForegroundColor Green
}

Write-Host ""
Write-Host "步骤 4: 启动后端服务..." -ForegroundColor Yellow
Write-Host ""

# 启动服务器
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  后端服务运行在 http://localhost:5000" -ForegroundColor Cyan
Write-Host "  按 Ctrl+C 停止服务" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 在默认浏览器中打开后端健康检查页面（非必须）
Start-Process "http://localhost:5000/api/health" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# 打开前端页面（使用绝对路径）
$indexPath = Join-Path $ScriptDir 'index1.0.3.html'
if (Test-Path $indexPath) {
    Start-Process $indexPath
    Write-Host "✓ 前端页面已在浏览器中打开: $indexPath" -ForegroundColor Green
} else {
    Write-Host "⚠️ 未找到前端文件 index1.0.3.html: $indexPath" -ForegroundColor Yellow
}

# 使用 venv 的 python 运行后端（保证依赖在虚拟环境中）
if (Test-Path $pythonExe) {
    Write-Host "即将在虚拟环境中启动后端服务..." -ForegroundColor Cyan
    & $pythonExe (Join-Path $BackendDir 'server.py')
} else {
    Write-Host "未找到虚拟环境的 python 可执行文件，尝试使用全局 python 启动后端" -ForegroundColor Yellow
    python (Join-Path $BackendDir 'server.py')
}
