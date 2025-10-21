# 修复导出按钮的点击事件
$file = "index1.0.3.html"
$content = Get-Content $file -Encoding UTF8 -Raw

# 替换mousedown事件处理器，让它直接触发菜单切换
$content = $content -replace "exportMenuBtn\.addEventListener\('mousedown', \(\) => console\.log\('� mousedown'\)\);", "exportMenuBtn.addEventListener('mousedown', (e) => { console.log('mousedown触发'); e.stopPropagation(); e.preventDefault(); toggleMenu(e); });"

# 保存文件
$content | Set-Content $file -Encoding UTF8 -NoNewline

Write-Host "已修复导出按钮事件处理" -ForegroundColor Green
