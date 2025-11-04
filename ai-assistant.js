/**
 * AI 桌宠助手 - 基于 DeepSeek API
 * 作者：物理教学一体化平台
 */

class AIAssistant {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.deepseek.com/v1/chat/completions';
    this.model = options.model || 'deepseek-chat';
    this.systemPrompt = options.systemPrompt || '你是一个物理学习助手，擅长解答高中物理问题。回答要简洁、友好、有趣。';
    this.conversationHistory = [];
    this.maxHistoryLength = 10; // 保留最近10轮对话
  }

  async chat(userMessage) {
    // 添加用户消息到历史
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    // 构建请求体
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...this.conversationHistory.slice(-this.maxHistoryLength)
    ];

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      return this.handleStreamResponse(response);
    } catch (error) {
      console.error('AI助手错误:', error);
      throw error;
    }
  }

  async *handleStreamResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // 保留不完整的行

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const json = JSON.parse(data);
              const content = json.choices[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                yield content;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      // 添加AI回复到历史
      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse
      });
    } finally {
      reader.releaseLock();
    }
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

// UI 组件
class AIAssistantUI {
  constructor(assistant, options = {}) {
    this.assistant = assistant;
    this.isOpen = false;
    this.isMinimized = false;
    this.isDragging = false;
    this.position = { x: window.innerWidth - 420, y: 100 };
    this.dragOffset = { x: 0, y: 0 };
    
    this.options = {
      avatarImage: options.avatarImage || '🤖',
      assistantName: options.assistantName || 'AI小助手',
      placeholder: options.placeholder || '有什么物理问题想问我吗？',
      ...options
    };

    this.init();
  }

  init() {
    this.createHTML();
    this.attachEventListeners();
  }

  createHTML() {
    const container = document.createElement('div');
    container.innerHTML = `
      <!-- 桌宠按钮 -->
      <div id="ai-assistant-toggle" class="ai-assistant-toggle" title="点击打开AI助手">
        <span class="ai-avatar">${this.options.avatarImage}</span>
        <span class="ai-badge">AI</span>
      </div>

      <!-- 对话窗口 -->
      <div id="ai-assistant-window" class="ai-assistant-window" style="display: none;">
        <!-- 标题栏 -->
        <div class="ai-window-header" id="ai-window-header">
          <div class="ai-header-left">
            <span class="ai-avatar-small">${this.options.avatarImage}</span>
            <span class="ai-assistant-name">${this.options.assistantName}</span>
          </div>
          <div class="ai-header-actions">
            <button class="ai-action-btn" id="ai-minimize-btn" title="最小化">
              <i class="fa fa-minus"></i>
            </button>
            <button class="ai-action-btn" id="ai-close-btn" title="关闭">
              <i class="fa fa-times"></i>
            </button>
          </div>
        </div>

        <!-- 聊天区域 -->
        <div class="ai-chat-container" id="ai-chat-container">
          <div class="ai-welcome-message">
            <p>👋 你好！我是${this.options.assistantName}</p>
            <p>我可以帮你解答物理问题、讲解概念、分析题目~</p>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="ai-input-container">
          <textarea 
            id="ai-input" 
            class="ai-input" 
            placeholder="${this.options.placeholder}"
            rows="1"
          ></textarea>
          <button id="ai-send-btn" class="ai-send-btn" title="发送 (Ctrl+Enter)">
            <i class="fa fa-paper-plane"></i>
          </button>
        </div>

        <!-- 快捷问题 -->
        <div class="ai-quick-questions">
          <button class="ai-quick-btn" data-question="解释一下牛顿第二定律">📚 牛顿第二定律</button>
          <button class="ai-quick-btn" data-question="自由落体运动怎么算？">🎯 自由落体</button>
          <button class="ai-quick-btn" data-question="动能定理是什么？">⚡ 动能定理</button>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    this.elements = {
      toggle: document.getElementById('ai-assistant-toggle'),
      window: document.getElementById('ai-assistant-window'),
      header: document.getElementById('ai-window-header'),
      chatContainer: document.getElementById('ai-chat-container'),
      input: document.getElementById('ai-input'),
      sendBtn: document.getElementById('ai-send-btn'),
      minimizeBtn: document.getElementById('ai-minimize-btn'),
      closeBtn: document.getElementById('ai-close-btn')
    };
  }

  attachEventListeners() {
    // 切换窗口
    this.elements.toggle.addEventListener('click', () => this.toggleWindow());
    this.elements.closeBtn.addEventListener('click', () => this.closeWindow());
    this.elements.minimizeBtn.addEventListener('click', () => this.minimizeWindow());

    // 发送消息
    this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
    this.elements.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // 快捷问题
    document.querySelectorAll('.ai-quick-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const question = e.target.dataset.question;
        this.elements.input.value = question;
        this.sendMessage();
      });
    });

    // 拖动窗口
    this.elements.header.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDrag());

    // 自动调整textarea高度
    this.elements.input.addEventListener('input', () => this.autoResizeTextarea());
  }

  toggleWindow() {
    this.isOpen = !this.isOpen;
    this.elements.window.style.display = this.isOpen ? 'flex' : 'none';
    if (this.isOpen) {
      this.elements.input.focus();
    }
  }

  closeWindow() {
    this.isOpen = false;
    this.elements.window.style.display = 'none';
  }

  minimizeWindow() {
    this.isMinimized = !this.isMinimized;
    if (this.isMinimized) {
      this.elements.window.style.height = '60px';
      this.elements.chatContainer.style.display = 'none';
      document.querySelector('.ai-input-container').style.display = 'none';
      document.querySelector('.ai-quick-questions').style.display = 'none';
    } else {
      this.elements.window.style.height = '600px';
      this.elements.chatContainer.style.display = 'flex';
      document.querySelector('.ai-input-container').style.display = 'flex';
      document.querySelector('.ai-quick-questions').style.display = 'flex';
    }
  }

  startDrag(e) {
    this.isDragging = true;
    const rect = this.elements.window.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    this.elements.header.style.cursor = 'grabbing';
  }

  drag(e) {
    if (!this.isDragging) return;
    
    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;
    
    this.elements.window.style.left = `${x}px`;
    this.elements.window.style.top = `${y}px`;
  }

  stopDrag() {
    this.isDragging = false;
    this.elements.header.style.cursor = 'grab';
  }

  async sendMessage() {
    const message = this.elements.input.value.trim();
    if (!message) return;

    // 清空输入框
    this.elements.input.value = '';
    this.autoResizeTextarea();

    // 添加用户消息
    this.addMessage(message, 'user');

    // 显示加载动画
    const loadingId = this.addMessage('正在思考...', 'assistant', true);

    try {
      // 调用AI
      const stream = await this.assistant.chat(message);
      
      // 移除加载消息，添加AI回复
      document.getElementById(loadingId)?.remove();
      const messageDiv = this.addMessage('', 'assistant');
      const contentDiv = messageDiv.querySelector('.ai-message-content');

      // 流式显示回复
      for await (const chunk of stream) {
        contentDiv.textContent += chunk;
        this.scrollToBottom();
      }

    } catch (error) {
      document.getElementById(loadingId)?.remove();
      this.addMessage('❌ 抱歉，出现了一些问题。请稍后再试。', 'assistant');
    }
  }

  addMessage(content, role, isLoading = false) {
    const messageId = `msg-${Date.now()}-${Math.random()}`;
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `ai-message ai-message-${role} ${isLoading ? 'ai-loading' : ''}`;
    messageDiv.innerHTML = `
      <div class="ai-message-avatar">${role === 'user' ? '👤' : this.options.avatarImage}</div>
      <div class="ai-message-content">${content}</div>
    `;
    
    this.elements.chatContainer.appendChild(messageDiv);
    this.scrollToBottom();
    return messageDiv;
  }

  scrollToBottom() {
    this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
  }

  autoResizeTextarea() {
    const textarea = this.elements.input;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }
}

// 初始化函数
function initAIAssistant(apiKey, options = {}) {
  const assistant = new AIAssistant(apiKey, {
    systemPrompt: options.systemPrompt || '你是一个物理学习助手，名叫"物理小助手"。你擅长解答高中物理问题，讲解要清晰、有趣、易懂。对于计算题，要给出详细步骤。'
  });

  const ui = new AIAssistantUI(assistant, {
    avatarImage: '🧪',
    assistantName: '物理小助手',
    placeholder: '问我物理问题，比如：牛顿第二定律是什么？',
    ...options
  });

  return { assistant, ui };
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AIAssistant, AIAssistantUI, initAIAssistant };
}
