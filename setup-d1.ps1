# Cloudflare D1 一键初始化脚本
# 物理教学平台数据库配置

Write-Host "=== Cloudflare D1 数据库初始化 ===" -ForegroundColor Cyan
Write-Host ""

# 1. 检查 Wrangler 安装
Write-Host "[1/5] 检查 Wrangler 安装..." -ForegroundColor Yellow
if (-not (Get-Command wrangler -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Wrangler 未安装，正在安装..." -ForegroundColor Red
    npm install -g wrangler
    if ($LASTEXITCODE -ne 0) {
        Write-Host "安装失败，请手动运行: npm install -g wrangler" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Wrangler 已就绪" -ForegroundColor Green

# 2. 登录检查
Write-Host "[2/5] 检查登录状态..." -ForegroundColor Yellow
wrangler whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  需要登录 Cloudflare" -ForegroundColor Yellow
    wrangler login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 登录失败" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ 已登录 Cloudflare" -ForegroundColor Green

# 3. 创建数据库
Write-Host "[3/5] 创建 D1 数据库..." -ForegroundColor Yellow
$dbOutput = wrangler d1 create physics-learning-db 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 数据库创建成功" -ForegroundColor Green
    Write-Host $dbOutput -ForegroundColor Gray
    
    # 提取 database_id
    $dbId = ($dbOutput | Select-String -Pattern "database_id = ""(.+)""").Matches.Groups[1].Value
    if ($dbId) {
        Write-Host "📋 Database ID: $dbId" -ForegroundColor Cyan
        Write-Host "请将此 ID 填入 backend/worker/wrangler.toml 的 database_id 字段" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  数据库可能已存在，继续..." -ForegroundColor Yellow
}

# 4. 初始化表结构
Write-Host "[4/5] 初始化数据库表结构..." -ForegroundColor Yellow
wrangler d1 execute physics-learning-db --file=backend/d1-schema.sql
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 表结构创建成功" -ForegroundColor Green
} else {
    Write-Host "❌ 表结构创建失败，请检查 backend/d1-schema.sql" -ForegroundColor Red
    exit 1
}

# 5. 验证数据库
Write-Host "[5/5] 验证数据库..." -ForegroundColor Yellow
$tables = wrangler d1 execute physics-learning-db --command="SELECT name FROM sqlite_master WHERE type='table';"
Write-Host "✅ 数据库表列表:" -ForegroundColor Green
Write-Host $tables -ForegroundColor Gray

Write-Host ""
Write-Host "=== 初始化完成 ===" -ForegroundColor Cyan
Write-Host "下一步操作:" -ForegroundColor Yellow
Write-Host "1. 更新 backend/worker/wrangler.toml 中的 database_id" -ForegroundColor White
Write-Host "2. 运行: cd backend/worker; wrangler deploy" -ForegroundColor White
Write-Host "3. 测试 API 端点" -ForegroundColor White
