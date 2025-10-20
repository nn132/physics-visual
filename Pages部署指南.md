# Cloudflare Pages 部署指南

## 当前状态
- ✅ GitHub 已更新（最新提交 44a9e6e）
- ✅ Worker 已部署（https://physics-visual-worker.yywf08125.workers.dev）
- ⏳ Pages 待更新

---

## 推荐方案：通过 Cloudflare Dashboard 连接 GitHub（自动部署）

### 第一步：登录 Cloudflare
1. 访问：https://dash.cloudflare.com
2. 使用你的账户登录（yywf08125@gmail.com）

### 第二步：创建或更新 Pages 项目

#### 情况 A：如果你已经有 `physics-visual` Pages 项目

1. 点击左侧菜单 **Workers & Pages**
2. 找到 `physics-visual` 项目并点击
3. 点击 **Settings** 标签
4. 找到 **Builds & deployments** 部分
5. 点击 **Connect to Git**（如果还未连接）
6. 选择 **GitHub**
7. 授权并选择 `nn132/physics-visual` 仓库
8. 配置：
   ```
   生产分支: master
   构建命令: (留空)
   构建输出目录: dist
   ```
9. 保存

#### 情况 B：如果还没有 Pages 项目

1. 点击左侧菜单 **Workers & Pages**
2. 点击右上角 **Create application**
3. 选择 **Pages** 标签
4. 点击 **Connect to Git**
5. 选择 **GitHub** 并授权
6. 选择仓库 `nn132/physics-visual`
7. 配置项目：
   ```
   项目名称: physics-visual
   生产分支: master
   框架预设: None
   构建命令: (留空)
   构建输出目录: dist
   根目录: /
   ```
8. 点击 **Save and Deploy**

### 第三步：等待部署完成

- 部署通常需要 1-3 分钟
- 完成后你会看到：
  - ✅ 部署状态：Success
  - 🌐 生产 URL：`https://physics-visual.pages.dev`
  - 🔗 预览 URL：`https://xxxxxxxx.physics-visual.pages.dev`

### 第四步：验证部署

1. 访问你的 Pages URL
2. 在题目描述框输入：`一个物体从静止开始自由下落5秒`
3. 点击"从文字解析参数"
4. 应该看到：
   - ✅ 成功解析
   - ✅ 参数自动填充
   - ✅ 绿色成功提示

---

## 备选方案：手动上传（不推荐，每次都要手动）

### 步骤：

1. 在 Cloudflare Dashboard 进入 Pages 项目
2. 点击 **Upload assets** 或 **Create a deployment**
3. 选择 **Direct Upload**
4. 拖拽 `d:\physics-visual\dist` 文件夹中的 `index.html`
5. 点击 **Deploy site**

---

## 完成后的最终架构

```
┌─────────────────────────────────────────┐
│         GitHub Repository               │
│     nn132/physics-visual (master)       │
│                                         │
│  - index1.0.3.html (源文件)             │
│  - dist/index.html (部署版本)           │
│  - backend/worker/index.js              │
│  - 各种部署指南.md                       │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐      ┌────────────────┐
│ Cloudflare    │      │ Cloudflare     │
│ Worker        │◄─────┤ Pages          │
│               │ API  │                │
│ /api/parse-   │      │ 前端 HTML/JS   │
│  problem      │      │                │
└───────────────┘      └────────────────┘
        │                       │
        │                       │
        ▼                       ▼
physics-visual-worker    physics-visual
.yywf08125.workers.dev   .pages.dev
```

---

## 🎯 未来工作流

连接 GitHub 后，你的工作流将变成：

1. **本地开发**：修改 `index1.0.3.html`
2. **更新部署版本**：
   ```powershell
   Copy-Item index1.0.3.html dist\index.html
   ```
3. **提交并推送**：
   ```powershell
   git add .
   git commit -m "你的修改说明"
   git push origin master
   ```
4. **自动部署**：Cloudflare 自动检测推送并部署到 Pages
5. **验证**：访问 `https://physics-visual.pages.dev` 查看更新

---

## ⚠️ 重要提示

- Worker 的更新仍需手动（通过 Dashboard 编辑或 wrangler deploy）
- Pages 连接 GitHub 后会自动部署
- 记得每次修改 `index1.0.3.html` 后同步到 `dist/index.html`

---

## 📞 需要帮助？

如果在设置过程中遇到问题：
1. 截图发给我
2. 告诉我你在哪一步
3. 我会立即帮你解决
