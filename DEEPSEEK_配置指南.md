# DeepSeek API 配置指南

## 方法一：通过 Cloudflare Dashboard 设置（推荐）

这是最简单可靠的方法，不需要 wrangler 登录。

### 步骤：

1. **登录 Cloudflare Dashboard**
   - 访问：https://dash.cloudflare.com/
   - 登录你的账号

2. **找到你的 Worker**
   - 在左侧菜单点击 **Workers & Pages**
   - 找到名为 `physics-visual-worker` 的 Worker
   - 点击进入

3. **添加 Secret**
   - 点击 **Settings** 标签页
   - 找到 **Variables and Secrets** 部分
   - 点击 **Add variable** 或 **Add secret**
   - 类型选择：**Secret**（不是 Variable）
   - Variable name: `DEEPSEEK_API_KEY`
   - Value: 粘贴你的 DeepSeek API Key（格式如 `sk-...`）
   - 点击 **Save and Deploy**

4. **验证设置**
   - 在 Variables and Secrets 列表中应该能看到 `DEEPSEEK_API_KEY`（值会被隐藏）
   - Worker 会自动重新部署

### 获取 DeepSeek API Key：

- 访问：https://platform.deepseek.com/
- 登录后进入 **API Keys** 页面
- 创建或复制你的 API Key

---

## 方法二：使用 Wrangler CLI（备选）

如果你想用命令行，需要先完成 OAuth 授权。

### 步骤：

1. **手动登录 wrangler**
   ```powershell
   npx wrangler login
   ```
   - 会打开浏览器授权页面
   - 在浏览器中完成授权
   - 回到终端确认登录成功

2. **设置 Secret**
   ```powershell
   npx wrangler secret put DEEPSEEK_API_KEY --name physics-visual-worker
   ```
   - 粘贴你的 API Key
   - 按回车确认

3. **部署 Worker（可选）**
   ```powershell
   npx wrangler deploy --name physics-visual-worker
   ```

### 如果 OAuth 超时：

- 尝试关闭防火墙/代理
- 手动复制浏览器打开的 URL 并在浏览器中打开
- 或直接使用方法一（Dashboard）

---

## 验证 DeepSeek 是否生效

### 1. 在前端测试

1. 打开 `index1.0.3.html`（在浏览器中）
2. 打开浏览器 DevTools (F12) → **Network** 标签
3. 在页面输入题目（例如："一辆汽车由静止开始做匀加速直线运动，加速度为2m/s²，求3s末的速度"）
4. 点击"智能解析"按钮
5. 在 Network 中查看 POST 到 `/api/parse-problem` 的响应

### 2. 检查响应内容

响应 JSON 应该包含：
```json
{
  "success": true,
  "type": "uniform",
  "params": {
    "v0": 0,
    "a": 2,
    "time": 3
  },
  "reasoning": "匀加速直线运动...",
  "raw": "{...DeepSeek 的原始返回...}"
}
```

**关键检查点：**
- `params.a` 应该是 `2`（不是默认的 `10`）
- `raw` 字段包含 DeepSeek 的实际返回内容
- 如果 `raw` 包含 `"mock":true`，说明走的是 mock 路径，DeepSeek 没被调用

### 3. 查看页面效果

- 表单中的"加速度"输入框应该显示 `2`
- 点击"生成可视化"后，汽车应该以 a=2 的加速度运动
- 3秒时速度应该是 6 m/s（v = v0 + at = 0 + 2×3）

---

## 故障排查

### 问题：响应中 `a=10`（默认值）

**可能原因：**
1. `DEEPSEEK_API_KEY` 未设置或设置错误
2. DeepSeek API 返回了无法解析的内容
3. Worker 使用了 mock 模式

**解决方法：**
- 检查 Dashboard 中 Secret 是否正确设置
- 查看响应中的 `raw` 字段，看 DeepSeek 实际返回了什么
- 确认 DeepSeek 账号有余额且 API Key 有效

### 问题：wrangler login 超时

**解决方法：**
- 使用方法一（Dashboard）
- 或手动打开浏览器，复制终端中的 OAuth URL 并授权

### 问题：前端仍使用本地解析

**可能原因：**
- Worker 部署未生效
- 前端 `BACKEND_PATH` 指向错误的 URL

**解决方法：**
- 检查前端 `index1.0.3.html` 中的 `BACKEND_PATH` 常量
- 确认指向你部署的 Worker URL

---

## 当前部署状态

- ✅ 后端代码已更新（改进 JSON 解析、返回 raw 字段）
- ✅ 前端本地解析已增强（支持识别 `2mz/s` 等 OCR 噪声）
- ⚠️ 需要设置 `DEEPSEEK_API_KEY` Secret（使用上述方法一或二）
- ⚠️ 设置完成后需要在浏览器测试验证

---

## 后续优化建议

设置成功后，可以考虑：
1. 在前端 UI 显示 DeepSeek 的 `reasoning`（让用户看到 AI 的解释）
2. 添加"调试模式"按钮，显示 `raw` 内容
3. 使用 `sceneDescription` 自动选择车辆模型和场景元素

---

**需要帮助？** 把 Network 中的响应 JSON 截图或复制给我，我可以帮你分析问题。
