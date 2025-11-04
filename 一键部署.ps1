# Cloudflare D1 完整部署脚本
# 自动化配置和部署流程

Write-Host "=== 🚀 Cloudflare D1 学习数据库部署 ===" -ForegroundColor Cyan
Write-Host ""

# 步骤 1: 设置 API Token
Write-Host "[1/6] 设置 Cloudflare API Token..." -ForegroundColor Yellow
Write-Host "请粘贴您的 API Token（按回车继续）:" -ForegroundColor Green
$token = Read-Host

if ($token) {
    $env:CLOUDFLARE_API_TOKEN = $token
    Write-Host "✅ Token 已设置" -ForegroundColor Green
} else {
    Write-Host "❌ Token 不能为空" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 步骤 2: 验证登录
Write-Host "[2/6] 验证 Cloudflare 登录状态..." -ForegroundColor Yellow
$whoami = wrangler whoami 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 登录成功" -ForegroundColor Green
    Write-Host $whoami -ForegroundColor Gray
} else {
    Write-Host "❌ 登录失败，请检查 Token 权限" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 步骤 3: 创建 D1 数据库
Write-Host "[3/6] 创建 D1 数据库..." -ForegroundColor Yellow
$createOutput = wrangler d1 create physics-learning-db 2>&1 | Out-String
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 数据库创建成功" -ForegroundColor Green
    Write-Host $createOutput -ForegroundColor Gray
    
    # 提取 database_id
    if ($createOutput -match 'database_id = "([^"]+)"') {
        $dbId = $matches[1]
        Write-Host ""
        Write-Host "📋 Database ID: $dbId" -ForegroundColor Cyan
        Write-Host ""
        
        # 自动更新 wrangler.toml
        $tomlPath = "backend\worker\wrangler.toml"
        if (Test-Path $tomlPath) {
            $content = Get-Content $tomlPath -Raw
            $content = $content -replace 'database_id = ""', "database_id = `"$dbId`""
            Set-Content $tomlPath $content
            Write-Host "✅ 已自动更新 wrangler.toml 中的 database_id" -ForegroundColor Green
        }
    }
} else {
    if ($createOutput -match "already exists") {
        Write-Host "⚠️  数据库已存在，继续..." -ForegroundColor Yellow
        Write-Host "运行以下命令查看 database_id:" -ForegroundColor Yellow
        Write-Host "  wrangler d1 list" -ForegroundColor White
    } else {
        Write-Host "❌ 创建失败: $createOutput" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# 步骤 4: 初始化表结构
Write-Host "[4/6] 初始化数据库表结构..." -ForegroundColor Yellow
$schemaResult = wrangler d1 execute physics-learning-db --file=backend/d1-schema.sql 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 表结构创建成功" -ForegroundColor Green
} else {
    Write-Host "❌ 表结构创建失败: $schemaResult" -ForegroundColor Red
    Write-Host "可能表已存在，继续..." -ForegroundColor Yellow
}

Write-Host ""

# 步骤 5: 验证数据库
Write-Host "[5/6] 验证数据库..." -ForegroundColor Yellow
$tables = wrangler d1 execute physics-learning-db --command="SELECT name FROM sqlite_master WHERE type='table';" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 数据库验证成功" -ForegroundColor Green
    Write-Host "数据库表列表:" -ForegroundColor Gray
    Write-Host $tables -ForegroundColor Gray
} else {
    Write-Host "⚠️  验证失败，但可能数据库正常: $tables" -ForegroundColor Yellow
}

Write-Host ""

# 步骤 6: 部署 Worker
Write-Host "[6/6] 部署 Cloudflare Worker..." -ForegroundColor Yellow
Write-Host "按任意键开始部署 Worker（或 Ctrl+C 取消）..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Push-Location backend\worker
$deployResult = wrangler deploy 2>&1
Pop-Location

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Worker 部署成功！" -ForegroundColor Green
    Write-Host $deployResult -ForegroundColor Gray
} else {
    Write-Host "❌ Worker 部署失败: $deployResult" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== 🎉 部署完成 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步测试:" -ForegroundColor Yellow
Write-Host "1. 打开 index1.0.3.html" -ForegroundColor White
Write-Host "2. 浏览几个知识点，生成可视化" -ForegroundColor White
Write-Host "3. 点击右上角 '学习报告' → '教师报告'" -ForegroundColor White
Write-Host "4. 点击 '同步到云端' 按钮" -ForegroundColor White
Write-Host "5. 勾选 '使用云端数据' 查看报告" -ForegroundColor White
Write-Host ""
Write-Host "测试 API 端点:" -ForegroundColor Yellow
Write-Host "  curl `"https://physics-visual-worker.yywf08125.workers.dev/api/learning/report?type=teacher&days=7`"" -ForegroundColor White
Write-Host ""
