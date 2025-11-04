# AI助手 Markdown & LaTeX 支持说明

## 📅 更新日期
2025年11月4日

## ✨ 新增功能

### 1. Markdown 渲染支持
AI助手现在完整支持Markdown语法,包括:

- **标题**: `#`, `##`, `###`
- **粗体**: `**文本**`
- **斜体**: `*文本*`
- **行内代码**: `` `代码` ``
- **代码块**: 
  ```
  ```python
  代码内容
  ```
  ```
- **无序列表**: `- 项目`
- **有序列表**: `1. 项目`
- **链接**: `[文本](URL)`

### 2. LaTeX 数学公式渲染
使用 KaTeX 库实现LaTeX公式渲染:

#### 行内公式
使用 `$...$` 包裹:
```
速度公式: $v = v_0 + at$
质能方程: $E = mc^2$
```

#### 块级公式
使用 `$$...$$` 包裹:
```
牛顿第二定律:
$$F = ma$$

动能定理:
$$W = \Delta E_k = \frac{1}{2}mv^2 - \frac{1}{2}mv_0^2$$
```

### 3. 常用物理公式示例

#### 力学公式
```latex
匀变速直线运动:
$$v = v_0 + at$$
$$s = v_0 t + \frac{1}{2}at^2$$
$$v^2 - v_0^2 = 2as$$

动量定理:
$$F \cdot t = \Delta p = mv - mv_0$$

动能定理:
$$W = \Delta E_k = \frac{1}{2}mv^2 - \frac{1}{2}mv_0^2$$

万有引力定律:
$$F = G\frac{m_1 m_2}{r^2}$$
```

#### 电磁学公式
```latex
库仑定律:
$$F = k\frac{q_1 q_2}{r^2}$$

欧姆定律:
$$U = IR$$

电功率:
$$P = UI = I^2R = \frac{U^2}{R}$$

洛伦兹力:
$$F = qvB\sin\theta$$
```

#### 热学公式
```latex
理想气体状态方程:
$$PV = nRT$$

热力学第一定律:
$$\Delta U = Q + W$$
```

## 🛠️ 技术实现

### 依赖库
- **KaTeX v0.16.9**: LaTeX数学公式渲染
- **自定义Markdown解析器**: 轻量级Markdown解析

### 核心函数
```javascript
// ai-assistant.js 中的关键方法

renderContent(element, content) {
  // 1. 处理LaTeX公式(行内和块级)
  // 2. 解析Markdown语法
  // 3. 渲染到DOM
}

parseMarkdown(text) {
  // 解析标题、列表、粗体、斜体、代码、链接等
}
```

### 渲染流程
```
用户输入/AI回复
    ↓
处理LaTeX公式
    ↓
解析Markdown
    ↓
渲染HTML
    ↓
实时显示在聊天框
```

## 📝 使用示例

### System Prompt 配置
```javascript
initAIAssistant(API_KEY, {
  systemPrompt: `你是物理学习助手。

【回答要求】
- 使用LaTeX公式: 行内用 $...$, 块级用 $$...$$
- 使用Markdown格式: 标题##, 列表-, 代码\`\`\`
- 公式示例: 牛顿第二定律 $F = ma$

【常用希腊字母】
$\\alpha, \\beta, \\gamma, \\Delta, \\theta, \\lambda, \\omega$`
});
```

### AI回复示例
````markdown
## 自由落体运动

### 定义
自由落体运动是指**物体只在重力作用下**从静止开始下落的运动。

### 公式

初速度 $v_0 = 0$, 加速度 $a = g$

**速度公式:**
$$v = gt$$

**位移公式:**
$$h = \frac{1}{2}gt^2$$

### 注意事项
- 忽略空气阻力
- 重力加速度 $g \approx 9.8 m/s^2$
````

## 🎨 样式优化

### 公式样式
- 行内公式与文本基线对齐
- 块级公式居中显示,上下留白
- 使用 KaTeX 默认样式,清晰美观

### 代码样式
- 行内代码: 浅灰背景,红色文字
- 代码块: 深色主题,等宽字体
- 支持语言标识 (python, javascript, etc.)

### Markdown样式
- 标题: 递进字号,适当留白
- 列表: 缩进排版,清晰层次
- 链接: 紫色主题,悬停效果

## 🧪 测试页面
打开 `test-ai-assistant.html` 可以测试所有Markdown和LaTeX功能:

```bash
# Windows PowerShell
ii test-ai-assistant.html
```

### 测试内容
- ✅ 基础Markdown格式
- ✅ 列表渲染
- ✅ 代码块高亮
- ✅ 链接跳转
- ✅ 行内公式
- ✅ 块级公式
- ✅ 物理公式集合
- ✅ 复杂数学公式
- ✅ Markdown+LaTeX混合

## 📦 文件清单
```
physics-visual/
├── ai-assistant.js          # AI助手核心逻辑 (已更新)
├── ai-assistant.css         # AI助手样式 (已更新)
├── index1.0.3.html          # 主页面 (已添加KaTeX)
├── test-ai-assistant.html   # 测试页面 (新增)
└── AI_ASSISTANT_MARKDOWN_LATEX.md  # 本文档
```

## 🚀 部署说明

### 1. HTML引入KaTeX
```html
<!-- KaTeX for LaTeX math rendering -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
```

### 2. 引入AI助手
```html
<link rel="stylesheet" href="ai-assistant.css">
<script src="ai-assistant.js"></script>
```

### 3. 初始化
```javascript
const { assistant, ui } = initAIAssistant(API_KEY, {
  systemPrompt: '配置AI支持LaTeX和Markdown...',
  avatarImage: '🧪',
  assistantName: '物理小助手'
});
```

## 🐛 已知问题
- 暂不支持嵌套列表
- 表格语法未实现
- 图片插入功能待开发

## 📌 注意事项
1. **转义字符**: LaTeX中的反斜杠需要双写 `\\`
   ```javascript
   "$$\\frac{1}{2}$$"  // 正确
   "$$\frac{1}{2}$$"   // 错误(字符串中)
   ```

2. **公式边界**: 确保 `$` 前后有空格或标点
   ```
   速度是 $v = 10 m/s$。  // ✅ 正确
   速度是$v = 10 m/s$     // ⚠️ 可能失败
   ```

3. **代码块语言**: 支持 `python`, `javascript`, `java`, `cpp` 等

## 🎯 后续优化
- [ ] 支持表格渲染
- [ ] 支持图片插入
- [ ] 支持更多LaTeX宏
- [ ] 代码高亮增强
- [ ] 嵌套列表支持
- [ ] 导出聊天记录(含公式)

## 📞 技术支持
如遇到渲染问题:
1. 检查浏览器控制台错误
2. 确认KaTeX库已加载
3. 验证LaTeX语法正确性
4. 参考 `test-ai-assistant.html` 示例

---
**更新日志**: 2025年11月4日 - 首次发布Markdown & LaTeX支持
