# 物理可视化平台 - 完整使用指南

## 🚀 快速开始（5 分钟搭建）

### 步骤 1：启动 AI 后端

```powershell
# 进入后端目录
cd backend

# 创建虚拟环境（首次运行）
python -m venv venv

# 激活虚拟环境
.\venv\Scripts\activate

# 安装依赖（首次运行）
pip install -r requirements.txt

# 设置 DeepSeek API 密钥
$env:DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxx"

# 启动后端服务
python server.py
```

**看到以下提示说明后端启动成功：**
```
✓ DeepSeek API 已配置 (key: sk-xxxxx...)
🚀 后端服务启动在 http://localhost:5000
```

### 步骤 2：打开前端页面

```powershell
# 在新的 PowerShell 窗口中
cd d:\physics-visual
ii .\index1.0.3.html
```

### 步骤 3：测试 AI 解析

1. 在题目描述框输入：
   ```
   一个小球从10米高处以5m/s的初速度水平抛出
   ```

2. 点击 **"从文字解析参数"** 按钮

3. 等待 1-2 秒，AI 会：
   - 自动识别为"平抛运动"
   - 填充参数：初速度=5, 高度=10
   - 显示推理过程

4. 点击 **"生成可视化"** 观看动画

---

## 📋 获取 DeepSeek API 密钥

### 方法 1：官网申请（推荐）

1. 访问 https://platform.deepseek.com/
2. 注册/登录账号
3. 点击左侧 "API Keys"
4. 点击 "Create API Key"
5. 复制生成的密钥（格式：`sk-...`）

### 方法 2：充值说明

- 新用户赠送 ¥10 免费额度
- 充值最低 ¥10（约可解析 10,000 次题目）
- 支付方式：支付宝、微信

---

## 🎯 使用示例

### 示例 1：自由落体
**输入：**
```
一个物体从高处自由下落，5秒后的速度和位移是多少？重力加速度取10m/s²
```

**AI 自动识别：**
- 题型：匀变速直线运动
- 初速度：0
- 加速度：10
- 时间：5

### 示例 2：复杂抛体
**输入：**
```
在一次物理实验中，小明站在5米高的平台上，以15m/s的初速度与水平成30度角向上抛出一个小球，不计空气阻力，求小球的最大高度和落地时间。
```

**AI 自动识别：**
- 题型：抛体运动
- 初速度：15
- 角度：30
- 初始高度：5

### 示例 3：圆周运动
**输入：**
```
一个物体在半径为3米的圆周上做匀速圆周运动，角速度为2rad/s
```

**AI 自动识别：**
- 题型：圆周运动
- 半径：3
- 角速度：2

---

## 🔧 故障排除

### 问题 1：点击"从文字解析参数"无反应

**原因：** 后端服务未启动

**解决：**
```powershell
# 检查后端是否运行
# 打开 http://localhost:5000/api/health
# 应该看到 {"status": "ok"}

# 如果打不开，重新启动后端
cd backend
.\venv\Scripts\activate
python server.py
```

### 问题 2：提示"后端服务未启动"

**原因：** 前端无法连接到 `http://localhost:5000`

**解决：**
1. 确认后端已启动（看到 `🚀 后端服务启动` 提示）
2. 检查防火墙是否阻止了 5000 端口
3. 确认后端和前端在同一台电脑上运行

### 问题 3：提示"DEEPSEEK_API_KEY 环境变量未设置"

**原因：** 没有配置 API 密钥

**解决：**
```powershell
# 方法 A：临时设置（关闭 PowerShell 后失效）
$env:DEEPSEEK_API_KEY="sk-your-api-key-here"

# 方法 B：持久化设置
setx DEEPSEEK_API_KEY "sk-your-api-key-here"
# 然后重启 PowerShell 和后端服务

# 方法 C：使用 .env 文件
cd backend
cp .env.example .env
notepad .env  # 编辑文件，填入 API key
```

### 问题 4：AI 解析结果不准确

**优化建议：**

1. **题目描述更清晰**
   - ✓ "一个小球从10米高处以5m/s水平抛出"
   - ✗ "球抛出去了"

2. **包含关键数值**
   - 速度、高度、角度、时间等
   - 明确单位（m, m/s, 度等）

3. **修改 Prompt**
   - 编辑 `backend/server.py` 中的 `SYSTEM_PROMPT`
   - 添加更多示例或约束条件

---

## 💰 费用说明

### DeepSeek 定价（2025年10月）

| 项目 | 价格 |
|------|------|
| 输入 token | ¥1 / 1M tokens |
| 输出 token | ¥2 / 1M tokens |

### 实际成本估算

- 每次解析约消耗 **300-600 tokens**
- 单次成本约 **¥0.0003-0.001**（不到 1 分钱）
- ¥10 余额可解析约 **10,000-30,000 次**

**对比：**
- OpenAI GPT-4：约 ¥0.01-0.05/次（贵 10-50 倍）
- 本地正则匹配：免费（但准确率低）

---

## 🧪 测试后端

运行自动化测试脚本：

```powershell
cd backend
python test_api.py
```

这会测试 6 个典型场景，验证 AI 解析能力。

---

## 📊 高级配置

### 修改后端地址

如果后端部署在其他服务器：

编辑 `index1.0.3.html`，找到：
```javascript
const BACKEND_URL = 'http://localhost:5000';
```

改为：
```javascript
const BACKEND_URL = 'http://your-server-ip:5000';
```

### 调整 AI 参数

编辑 `backend/server.py`：

```python
response = client.chat.completions.create(
    model="deepseek-chat",
    temperature=0.3,  # 降低随机性 (0.1-0.5)
    max_tokens=500,   # 增加输出长度
    ...
)
```

### 部署到生产环境

**使用 Waitress（Windows）：**
```powershell
pip install waitress
waitress-serve --host=0.0.0.0 --port=5000 server:app
```

**使用 Docker：**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY server.py .
ENV DEEPSEEK_API_KEY=""
CMD ["python", "server.py"]
```

---

## 🎓 学习资源

- **DeepSeek 文档：** https://platform.deepseek.com/docs
- **Flask 教程：** https://flask.palletsprojects.com/
- **OpenAI SDK：** https://github.com/openai/openai-python

---

## 📞 获取帮助

遇到问题？
1. 检查 `backend/README.md` 的故障排除部分
2. 查看后端控制台的错误日志
3. 运行 `python test_api.py` 诊断问题

---

**祝你使用愉快！享受 AI 驱动的精准物理可视化 🚀**
