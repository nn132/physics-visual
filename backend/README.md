# 物理可视化平台 - AI 后端服务

基于 DeepSeek API 的自然语言物理题目解析后端。

## 快速开始

### 1. 安装依赖

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 配置 API 密钥

方式 A：环境变量（推荐）
```powershell
# Windows PowerShell
$env:DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxx"

# 或持久化到系统环境变量
setx DEEPSEEK_API_KEY "sk-xxxxxxxxxxxxxxxx"
```

方式 B：使用 .env 文件
```powershell
# 复制示例文件
cp .env.example .env

# 编辑 .env 文件，填入你的 API key
notepad .env
```

### 3. 启动服务

```powershell
python server.py
```

服务将运行在 `http://localhost:5000`

### 4. 测试 API

```powershell
# 健康检查
curl http://localhost:5000/api/health

# 测试解析
curl -X POST http://localhost:5000/api/parse-problem `
  -H "Content-Type: application/json" `
  -d '{"description":"一个小球从10米高处自由下落，5秒后的速度和位移是多少？"}'
```

## API 文档

### POST /api/parse-problem

解析物理题目并提取参数。

**请求：**
```json
{
  "description": "物理题目描述文本"
}
```

**响应：**
```json
{
  "success": true,
  "type": "uniform",
  "params": {
    "v0": 0,
    "a": 10,
    "time": 5
  },
  "reasoning": "这是一个自由落体运动..."
}
```

### GET /api/health

健康检查端点。

**响应：**
```json
{
  "status": "ok",
  "api_key_configured": true
}
```

## 支持的题型

- `uniform` - 匀变速直线运动
- `projectile` - 平抛/抛体运动
- `circular` - 圆周运动
- `collision` - 碰撞与动量守恒
- `magnetic` - 带电粒子在磁场中的运动
- `astrodynamics` - 天体运动

## 获取 DeepSeek API 密钥

1. 访问 https://platform.deepseek.com/
2. 注册/登录账号
3. 进入"API Keys"页面创建新密钥
4. 复制密钥（格式：`sk-...`）

## 费用说明

DeepSeek 定价（2025年10月）：
- 输入：¥1 / 1M tokens
- 输出：¥2 / 1M tokens

每次解析约消耗 200-500 tokens，成本约 ¥0.0001-0.001/次。

## 故障排除

**问题：`DEEPSEEK_API_KEY 环境变量未设置`**
- 确保已设置环境变量或创建 `.env` 文件

**问题：`Connection refused`**
- 检查网络连接
- 确认 API 端点 `https://api.deepseek.com` 可访问

**问题：`401 Unauthorized`**
- 检查 API key 是否正确
- 确认账户余额充足

## 开发说明

修改 Prompt 模板以优化解析效果：
- 编辑 `server.py` 中的 `SYSTEM_PROMPT` 变量
- 调整 `temperature` 参数（0.1-0.5 之间）

## 部署到生产环境

使用 Gunicorn（Linux/Mac）：
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 server:app
```

或使用 Waitress（Windows）：
```powershell
pip install waitress
waitress-serve --host=0.0.0.0 --port=5000 server:app
```
