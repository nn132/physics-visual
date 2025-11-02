登录页面与本地 Mock API

这是一个示例项目，包含一个静态登录/注册页面和一个可选的本地 mock API 服务，用于演示验证码发送、校验和注册流程（演示用途，生产环境请接入真实后端与第三方服务）。

主要文件
- `index.html`：前端页面
- `style.css`：样式
- `index.js`：前端交互逻辑（会优先调用 `/api/*` 接口；若后端不可用则回退到前端模拟）
- `server.js`：Node.js Express 本地 mock API 服务（可选）
- `data/store.json`：本地持久化数据（由 server.js 自动创建）

快速运行（PowerShell）

1. 安装依赖：

```
npm install
```

2. 启动本地服务：

普通模式：

```
npm start
```

开发模式（server 会在返回中包含 demo 验证码，方便调试）：

```
set NODE_ENV=development; npm start
```

如果你有 Deepseek API 并希望用它发送短信/邮件，请在运行前设置环境变量 `DEEPSEEK_API_KEY` 与 `DEEPSEEK_ENDPOINT`（端点 URL）。示例：

```
set DEEPSEEK_API_KEY=你的_key; set DEEPSEEK_ENDPOINT=https://api.deepseek.example/send
set NODE_ENV=development; npm start
```

注意与安全
- 本仓库中提供的后端为本地示例，仅用于开发和演示。发送次数限制与验证码持久化均为示例实现，生产环境必须在服务端做更严格的限流、防刷与持久化。
- 密码示例使用 `bcryptjs` 做哈希并保存到本地 `data/store.json`（仅示例），生产环境请使用真实数据库与更完善的认证方案。

如何测试前端

- 直接用浏览器打开 `index.html`（无需服务器）可以看到界面并使用前端模拟验证码发送与验证。
- 如果启动了本地 mock 服务，前端会优先调用 `http://localhost:3000/api/send-code` 等接口；开发模式会在返回中包含演示验证码。

快速将登录/注册跳转到你的物理可视化平台

该示例项目在注册/登录成功后会自动跳转到一个 "可视化平台" 的 URL。你可以用下面三种方式设置目标地址：

1. 在浏览器地址栏用 query 参数传入：

```
file:///.../index.html?redirect=https%3A%2F%2Fyour-visualization.example
```

2. 在浏览器控制台或其它脚本中把地址保存到 localStorage（一次设置，后续访问生效）：

```javascript
localStorage.setItem('redirect_url', 'https://your-visualization.example');
```

3. 修改 `index.js` 中的默认 `REDIRECT_URL`（不推荐，除非你想把地址写死在页面中）。

示例：如果你的可视化平台地址是 `https://visual.example.local/dashboard`，可以直接打开：

```
file:///C:/Users/lenovo/Desktop/dengluyemian001/index.html?redirect=https%3A%2F%2Fvisual.example.local%2Fdashboard
```

在用户点击“注册 / 登录”并通过前端校验后，页面会直接导航到上面配置的地址（离线模式或后端不可用时同样跳转）。

如需我帮你：
- 将验证码发送接入你现有的 Deepseek API（需要你提供 API 文档或示例请求）；
- 或把示例改造成 Docker 镜像/更完整的后端（数据库、认证、日志）；
  请告诉我你想要哪一步，我可以继续实现。
