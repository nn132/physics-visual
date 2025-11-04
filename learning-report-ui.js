/**
 * 学习报告UI组件
 * 用于展示学习数据分析结果
 */

class LearningReportUI {
  constructor(analytics) {
    this.analytics = analytics;
    this.currentTab = 'student'; // 'student' | 'teacher'
    this.charts = {}; // 存储Chart.js实例
    
    this.init();
  }
  
  init() {
    this.createHTML();
    this.attachEventListeners();
  }
  
  createHTML() {
    const container = document.createElement('div');
    container.innerHTML = `
      <!-- 报告弹窗 -->
      <div id="report-modal" class="report-modal">
        <div class="report-container">
          <!-- 头部 -->
          <div class="report-header">
            <h2 id="report-title">
              <span class="section-icon">📊</span>
              学习报告
            </h2>
            <div class="report-tabs">
              <button class="report-tab active" data-tab="student">学生报告</button>
              <button class="report-tab" data-tab="teacher">教师报告</button>
            </div>
            <div id="cloud-controls"></div>
            <button class="report-close" id="report-close">×</button>
          </div>
          
          <!-- 内容区 -->
          <div class="report-content" id="report-content">
            <!-- 动态生成 -->
          </div>
          
          <!-- 底部 -->
          <div class="report-footer">
            <div style="color: #718096; font-size: 14px;">
              <span id="report-time"></span>
            </div>
            <div class="export-options">
              <button class="export-btn" id="export-image">
                <i class="fa fa-image"></i> 导出图片
              </button>
              <button class="export-btn" id="export-pdf">
                <i class="fa fa-file-pdf-o"></i> 导出PDF
              </button>
              <button class="export-btn primary" id="export-json">
                <i class="fa fa-download"></i> 导出数据
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    this.elements = {
      modal: document.getElementById('report-modal'),
      content: document.getElementById('report-content'),
      title: document.getElementById('report-title'),
      time: document.getElementById('report-time'),
      closeBtn: document.getElementById('report-close'),
      tabs: document.querySelectorAll('.report-tab'),
      exportImage: document.getElementById('export-image'),
      exportPdf: document.getElementById('export-pdf'),
      exportJson: document.getElementById('export-json'),
      cloudControls: document.getElementById('cloud-controls')
    };
    
    // 添加云端控制UI
    this.createCloudControls();
  }
  
  createCloudControls() {
    const html = `
      <label style="display: none; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: #4a5568;" id="cloud-toggle-label">
        <input type="checkbox" id="cloud-data-toggle" style="cursor: pointer;">
        <span>使用云端数据（所有学生）</span>
      </label>
      <button class="export-btn" id="sync-cloud-btn" style="display: none; background: #4299e1; color: white; border: none;">
        <i class="fa fa-cloud-upload"></i> 同步到云端
      </button>
    `;
    this.elements.cloudControls.innerHTML = html;
    
    this.elements.cloudToggle = document.getElementById('cloud-data-toggle');
    this.elements.cloudToggleLabel = document.getElementById('cloud-toggle-label');
    this.elements.syncBtn = document.getElementById('sync-cloud-btn');
    
    // 切换云端数据时重新渲染
    this.elements.cloudToggle.addEventListener('change', () => {
      this.renderTeacherReport();
    });
    
    // 同步按钮
    this.elements.syncBtn.addEventListener('click', async () => {
      const btn = this.elements.syncBtn;
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 同步中...';
      btn.disabled = true;
      
      const result = await this.analytics.syncToCloud();
      
      if (result.success) {
        btn.innerHTML = '<i class="fa fa-check"></i> 同步成功';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }, 2000);
      } else {
        btn.innerHTML = '<i class="fa fa-times"></i> 同步失败';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }, 2000);
      }
    });
  }
  
  attachEventListeners() {
    // 关闭弹窗
    this.elements.closeBtn.addEventListener('click', () => this.close());
    this.elements.modal.addEventListener('click', (e) => {
      if (e.target === this.elements.modal) {
        this.close();
      }
    });
    
    // 切换标签
    this.elements.tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabType = e.target.dataset.tab;
        this.switchTab(tabType);
      });
    });
    
    // 导出功能
    this.elements.exportImage.addEventListener('click', () => this.exportAsImage());
    this.elements.exportPdf.addEventListener('click', () => this.exportAsPDF());
    this.elements.exportJson.addEventListener('click', () => this.exportAsJSON());
  }
  
  open() {
    this.elements.modal.classList.add('active');
    this.render();
  }
  
  close() {
    this.elements.modal.classList.remove('active');
    // 销毁图表
    Object.values(this.charts).forEach(chart => chart.destroy());
    this.charts = {};
  }
  
  switchTab(tabType) {
    this.currentTab = tabType;
    
    // 更新标签样式
    this.elements.tabs.forEach(tab => {
      if (tab.dataset.tab === tabType) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // 显示/隐藏云端控制
    if (tabType === 'teacher') {
      this.elements.cloudToggleLabel.style.display = 'flex';
      this.elements.syncBtn.style.display = 'inline-flex';
    } else {
      this.elements.cloudToggleLabel.style.display = 'none';
      this.elements.syncBtn.style.display = 'none';
    }
    
    // 重新渲染
    this.render();
  }
  
  render() {
    if (this.currentTab === 'student') {
      this.renderStudentReport();
    } else {
      this.renderTeacherReport();
    }
    
    // 更新时间
    this.elements.time.textContent = `生成时间：${new Date().toLocaleString('zh-CN')}`;
  }
  
  // ==================== 学生报告 ====================
  
  renderStudentReport() {
    const report = this.analytics.generateStudentReport();
    
    if (report.summary.knowledgePointsVisited === 0) {
      this.renderEmptyState();
      return;
    }
    
    let html = '';
    
    // 摘要卡片
    html += this.renderSummaryCards(report.summary);
    
    // 知识点掌握度
    html += this.renderKnowledgeMastery(report.knowledgeMastery);
    
    // 学习偏好分析
    html += this.renderCategoryPreference(report.categoryPreference);
    
    // 题型使用统计
    html += this.renderQuestionTypeStats(report.questionTypeStats);
    
    // 薄弱环节建议
    if (report.weakPoints.length > 0) {
      html += this.renderWeakPoints(report.weakPoints);
    }
    
    // 学习建议
    if (report.recommendations.length > 0) {
      html += this.renderRecommendations(report.recommendations);
    }
    
    this.elements.content.innerHTML = html;
    
    // 渲染图表
    this.renderCharts(report);
  }
  
  renderSummaryCards(summary) {
    return `
      <div class="report-summary">
        <div class="summary-card">
          <div class="summary-icon">⏱️</div>
          <div class="summary-value">${this.analytics.formatTime(summary.totalTime)}</div>
          <div class="summary-label">累计学习时间</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">📚</div>
          <div class="summary-value">${summary.knowledgePointsVisited}</div>
          <div class="summary-label">学习知识点数</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">📝</div>
          <div class="summary-value">${summary.examplesAttempted}</div>
          <div class="summary-label">练习例题数</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">🎬</div>
          <div class="summary-value">${summary.visualizationsGenerated}</div>
          <div class="summary-label">生成可视化</div>
        </div>
      </div>
    `;
  }
  
  renderKnowledgeMastery(mastery) {
    if (mastery.length === 0) return '';
    
    const items = mastery.slice(0, 10).map((point, index) => {
      const scoreClass = point.masteryScore >= 60 ? '' : (point.masteryScore >= 40 ? 'medium' : 'low');
      return `
        <div class="knowledge-item">
          <div class="knowledge-info">
            <div class="knowledge-rank">${index + 1}</div>
            <div class="knowledge-details">
              <h4>${point.name}</h4>
              <p>${point.category || '未分类'} • 访问${point.visits}次 • ${this.analytics.formatTime(point.totalTime)}</p>
            </div>
          </div>
          <div class="knowledge-score">
            <div class="score-bar">
              <div class="score-fill ${scoreClass}" style="width: ${point.masteryScore}%"></div>
            </div>
            <div class="score-text">${point.masteryScore}分</div>
            <span class="mastery-badge ${point.level}">${point.level}</span>
          </div>
        </div>
      `;
    }).join('');
    
    return `
      <div class="report-section">
        <h3><span class="section-icon">🎯</span> 知识点掌握度排名</h3>
        <div class="knowledge-list">
          ${items}
        </div>
      </div>
    `;
  }
  
  renderCategoryPreference(preference) {
    if (preference.length === 0) return '';
    
    return `
      <div class="report-section">
        <h3><span class="section-icon">📊</span> 学习分类分布</h3>
        <div class="chart-container">
          <canvas id="category-chart"></canvas>
        </div>
      </div>
    `;
  }
  
  renderQuestionTypeStats(stats) {
    if (stats.length === 0) return '';
    
    return `
      <div class="report-section">
        <h3><span class="section-icon">📈</span> 题型使用统计</h3>
        <div class="chart-container">
          <canvas id="question-type-chart"></canvas>
        </div>
      </div>
    `;
  }
  
  renderWeakPoints(weakPoints) {
    const items = weakPoints.map(point => `
      <div class="recommendation-card">
        <div class="recommendation-icon">⚠️</div>
        <div class="recommendation-content">
          <h4>${point.name} (${point.score}分)</h4>
          <p>${point.suggestion}</p>
        </div>
      </div>
    `).join('');
    
    return `
      <div class="report-section">
        <h3><span class="section-icon">🎯</span> 薄弱环节分析</h3>
        <div class="recommendation-list">
          ${items}
        </div>
      </div>
    `;
  }
  
  renderRecommendations(recommendations) {
    const items = recommendations.map(rec => `
      <div class="recommendation-card">
        <div class="recommendation-icon">${rec.icon}</div>
        <div class="recommendation-content">
          <h4>${rec.type}</h4>
          <p>${rec.content}</p>
        </div>
      </div>
    `).join('');
    
    return `
      <div class="report-section">
        <h3><span class="section-icon">💡</span> 学习建议</h3>
        <div class="recommendation-list">
          ${items}
        </div>
      </div>
    `;
  }
  
  // ==================== 教师报告 ====================
  
  renderTeacherReport() {
    // 检查是否有云端数据选项
    const useCloudData = this.elements.cloudToggle?.checked || false;
    
    if (useCloudData) {
      this.renderCloudTeacherReport();
      return;
    }
    
    // 本地数据（单个学生）
    const report = this.analytics.generateTeacherReport();
    
    if (report.summary.knowledgePointsVisited === 0) {
      this.renderEmptyState('teacher');
      return;
    }
    
    let html = '';
    
    // 教学统计概览
    html += this.renderTeacherSummary(report.summary);
    
    // 学生整体掌握情况
    html += this.renderOverallMastery(report.summary.avgMasteryScore);
    
    // 热门知识点（学生最关注）
    html += this.renderHotTopics(report.hotTopics);
    
    // 冷门知识点（需要关注）
    html += this.renderColdTopics(report.coldTopics);
    
    // 知识分类使用情况
    html += this.renderCategoryDistribution(report.categoryDistribution);
    
    // 精准备课建议
    if (report.teachingSuggestions.length > 0) {
      html += this.renderTeachingSuggestions(report.teachingSuggestions);
    }
    
    this.elements.content.innerHTML = html;
    
    // 渲染图表
    this.renderTeacherCharts(report);
  }
  
  renderTeacherSummary(summary) {
    return `
      <div class="report-summary">
        <div class="summary-card">
          <div class="summary-icon">👥</div>
          <div class="summary-value">1</div>
          <div class="summary-label">统计学生数（演示）</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">📚</div>
          <div class="summary-value">${summary.knowledgePointsVisited}</div>
          <div class="summary-label">学生学习知识点</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">🎯</div>
          <div class="summary-value">${summary.avgMasteryScore || 0}分</div>
          <div class="summary-label">平均掌握度</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">⏱️</div>
          <div class="summary-value">${this.analytics.formatTime(summary.totalTime)}</div>
          <div class="summary-label">累计学习时长</div>
        </div>
      </div>
    `;
  }
  
  renderOverallMastery(avgScore) {
    let level = '良好';
    let color = '#48bb78';
    let icon = '😊';
    let desc = '学生整体掌握情况不错，可继续保持教学节奏';
    
    if (avgScore >= 80) {
      level = '优秀';
      color = '#38a169';
      icon = '🌟';
      desc = '学生整体掌握优秀，可以适当增加难度或拓展内容';
    } else if (avgScore >= 60) {
      level = '良好';
      color = '#48bb78';
      icon = '😊';
      desc = '学生整体掌握良好，继续保持教学节奏';
    } else if (avgScore >= 40) {
      level = '一般';
      color = '#ed8936';
      icon = '😐';
      desc = '部分学生掌握不足，建议增加练习和答疑';
    } else {
      level = '待提高';
      color = '#f56565';
      icon = '😟';
      desc = '学生整体掌握较弱，建议放慢进度，加强基础';
    }
    
    return `
      <div class="report-section">
        <h3><span class="section-icon">📊</span> 学生整体掌握情况</h3>
        <div style="padding: 24px; background: linear-gradient(135deg, ${color}15 0%, ${color}05 100%); border-radius: 12px; border-left: 4px solid ${color};">
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
            <span style="font-size: 48px;">${icon}</span>
            <div>
              <div style="font-size: 28px; font-weight: bold; color: ${color}; margin-bottom: 4px;">
                ${avgScore}分 · ${level}
              </div>
              <div style="color: #718096; font-size: 14px;">
                基于学生学习时长和访问频次综合评估
              </div>
            </div>
          </div>
          <p style="margin: 0; color: #4a5568; line-height: 1.6;">
            ${desc}
          </p>
        </div>
      </div>
    `;
  }
  
  renderHotTopics(hotTopics) {
    if (hotTopics.length === 0) return '';
    
    const items = hotTopics.map((point, index) => `
      <div class="knowledge-item">
        <div class="knowledge-info">
          <div class="knowledge-rank">🔥</div>
          <div class="knowledge-details">
            <h4>${point.name}</h4>
            <p>学生访问${point.visits}次 • 累计${this.analytics.formatTime(point.totalTime)} • 掌握度${point.masteryScore}分</p>
          </div>
        </div>
        <div class="knowledge-score">
          <span class="mastery-badge ${point.level}">${point.level}</span>
        </div>
      </div>
    `).join('');
    
    return `
      <div class="report-section">
        <h3><span class="section-icon">🔥</span> 学生热门知识点 TOP 5</h3>
        <p style="color: #718096; margin-bottom: 16px;">
          学生关注度最高的知识点，说明：①学生感兴趣 ②难度适中易理解 ③可作为教学重点深入展开
        </p>
        <div class="knowledge-list">
          ${items}
        </div>
      </div>
    `;
  }
  
  renderColdTopics(coldTopics) {
    if (coldTopics.length === 0) return '';
    
    const items = coldTopics.map((point, index) => `
      <div class="knowledge-item">
        <div class="knowledge-info">
          <div class="knowledge-rank" style="background: #cbd5e0;">❄️</div>
          <div class="knowledge-details">
            <h4>${point.name}</h4>
            <p>学生访问${point.visits}次 • 累计${this.analytics.formatTime(point.totalTime)} • 掌握度${point.masteryScore}分</p>
          </div>
        </div>
        <div class="knowledge-score">
          <span class="mastery-badge ${point.level}">${point.level}</span>
        </div>
      </div>
    `).join('');
    
    return `
      <div class="report-section">
        <h3><span class="section-icon">❄️</span> 学生冷门知识点（需关注）</h3>
        <p style="color: #718096; margin-bottom: 16px;">
          学生关注度较低的知识点，建议：①检查是否为非重点内容 ②增加趣味性例题 ③课堂主动讲解
        </p>
        <div class="knowledge-list">
          ${items}
        </div>
      </div>
    `;
  }
  
  renderCategoryDistribution(distribution) {
    if (distribution.length === 0) return '';
    
    return `
      <div class="report-section">
        <h3><span class="section-icon">📊</span> 学生知识分类学习分布</h3>
        <p style="color: #718096; margin-bottom: 16px;">
          分析学生在各物理分类上的学习投入，帮助教师了解学生兴趣点和教学重点
        </p>
        <div class="chart-grid">
          <div class="chart-container">
            <canvas id="teacher-category-chart"></canvas>
          </div>
          <div class="chart-container">
            <canvas id="teacher-time-chart"></canvas>
          </div>
        </div>
      </div>
    `;
  }
  
  renderTeachingSuggestions(suggestions) {
    const items = suggestions.map(sug => `
      <div class="recommendation-card">
        <div class="recommendation-icon">${sug.icon}</div>
        <div class="recommendation-content">
          <h4>${sug.type}</h4>
          <p style="white-space: pre-line;">${sug.content}</p>
        </div>
      </div>
    `).join('');
    
    return `
      <div class="report-section">
        <h3><span class="section-icon">�</span> 精准备课指导方案</h3>
        <p style="color: #718096; margin-bottom: 16px;">
          基于学生学习数据的智能分析，为您提供精准的备课建议和教学改进方向
        </p>
        <div class="recommendation-list">
          ${items}
        </div>
      </div>
    `;
  }
  
  // ==================== 图表渲染 ====================
  
  renderCharts(report) {
    // 延迟渲染，等待DOM更新
    setTimeout(() => {
      // 分类分布饼图
      if (report.categoryPreference.length > 0) {
        this.renderPieChart('category-chart', report.categoryPreference);
      }
      
      // 题型使用柱状图
      if (report.questionTypeStats.length > 0) {
        this.renderBarChart('question-type-chart', report.questionTypeStats);
      }
    }, 100);
  }
  
  renderTeacherCharts(report) {
    setTimeout(() => {
      if (report.categoryDistribution.length > 0) {
        this.renderPieChart('teacher-category-chart', report.categoryDistribution);
        this.renderTeacherTimeChart('teacher-time-chart', report.categoryDistribution);
      }
    }, 100);
  }
  
  renderPieChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 销毁旧图表
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }
    
    this.charts[canvasId] = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.map(d => d.category),
        datasets: [{
          data: data.map(d => d.totalTime),
          backgroundColor: [
            '#667eea',
            '#764ba2',
            '#f093fb',
            '#4facfe',
            '#43e97b',
            '#fa709a'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = this.analytics.formatTime(context.raw);
                return `${label}: ${value}`;
              }
            }
          }
        }
      }
    });
  }
  
  renderBarChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }
    
    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.type),
        datasets: [{
          label: '使用次数',
          data: data.map(d => d.count),
          backgroundColor: 'rgba(102, 126, 234, 0.8)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }
  
  renderTeacherTimeChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }
    
    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.category),
        datasets: [{
          label: '学习时长',
          data: data.map(d => d.totalTime / 60000), // 转换为分钟
          backgroundColor: 'rgba(118, 75, 162, 0.8)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.parsed.y.toFixed(1)} 分钟`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: '分钟'
            }
          }
        }
      }
    });
  }
  
  // ==================== 空状态 ====================
  
  renderEmptyState(type = 'student') {
    const messages = {
      student: {
        icon: '📊',
        title: '暂无学习数据',
        desc: '开始学习后，这里会显示你的学习报告和分析。<br>点击知识点、查看例题、生成可视化，系统会自动记录你的学习行为。'
      },
      teacher: {
        icon: '👨‍🏫',
        title: '暂无学生使用数据',
        desc: '当学生开始使用平台学习后，这里会显示：<br>• 学生整体掌握情况<br>• 热门/冷门知识点分析<br>• 精准备课指导建议'
      }
    };
    
    const msg = messages[type] || messages.student;
    
    this.elements.content.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${msg.icon}</div>
        <h3>${msg.title}</h3>
        <p>${msg.desc}</p>
      </div>
    `;
  }
  
  // ==================== 导出功能 ====================
  
  exportAsImage() {
    alert('导出图片功能开发中...\n将使用 html2canvas 库截取报告内容');
  }
  
  exportAsPDF() {
    alert('导出PDF功能开发中...\n将使用 jsPDF 库生成PDF文档');
  }
  
  exportAsJSON() {
    const report = this.currentTab === 'student' 
      ? this.analytics.generateStudentReport() 
      : this.analytics.generateTeacherReport();
    
    const dataStr = JSON.stringify(report, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.currentTab === 'student' ? '学生' : '教师'}报告-${new Date().toLocaleDateString('zh-CN')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ 报告已导出为JSON');
  }
  
  // ==================== 云端教师报告 ====================
  
  /**
   * 渲染云端教师报告（聚合所有学生数据）
   */
  async renderCloudTeacherReport() {
    // 显示加载状态
    this.elements.content.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fa fa-spinner fa-spin"></i></div>
        <h3>正在加载云端数据...</h3>
        <p>从服务器获取所有学生的学习数据</p>
      </div>
    `;
    
    try {
      const days = 7; // 默认最近7天
      const report = await this.analytics.fetchTeacherReport(undefined, days);
      
      if (!report.success) {
        throw new Error(report.error);
      }
      
      const stats = report.stats;
      
      let html = '';
      
      // 统计概览
      html += `
        <div class="report-summary">
          <div class="summary-card">
            <div class="summary-icon">👥</div>
            <div class="summary-value">${stats.studentCount || 0}</div>
            <div class="summary-label">统计学生数</div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">📚</div>
            <div class="summary-value">${stats.hotKnowledge?.length || 0}</div>
            <div class="summary-label">热门知识点数</div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">⏱️</div>
            <div class="summary-value">${stats.avgStudyTime || 0}秒</div>
            <div class="summary-label">平均学习时长</div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">🎯</div>
            <div class="summary-value">${report.period}</div>
            <div class="summary-label">统计周期</div>
          </div>
        </div>
      `;
      
      // 热门知识点
      if (stats.hotKnowledge && stats.hotKnowledge.length > 0) {
        html += `
          <div class="report-section">
            <h3><span class="section-icon">🔥</span> 学生热门知识点 TOP 5</h3>
            <div class="topic-list hot-topics">
              ${stats.hotKnowledge.slice(0, 5).map((kp, index) => {
                const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6'];
                return `
                  <div class="topic-item">
                    <div class="topic-rank" style="background: ${colors[index]};">${index + 1}</div>
                    <div class="topic-info">
                      <div class="topic-name">${kp.knowledge_name}</div>
                      <div class="topic-stats">
                        访问 ${kp.visits} 次 · 学习 ${Math.round(kp.time / 60)} 分钟
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            <p style="margin-top: 12px; color: #718096; font-size: 14px;">
              💡 这些知识点是学生最关注的内容，可作为重点讲解对象
            </p>
          </div>
        `;
      }
      
      // 冷门知识点
      if (stats.coldKnowledge && stats.coldKnowledge.length > 0) {
        html += `
          <div class="report-section">
            <h3><span class="section-icon">❄️</span> 冷门知识点（需要关注）</h3>
            <div class="topic-list cold-topics">
              ${stats.coldKnowledge.slice(0, 5).map(kp => `
                <div class="topic-item">
                  <div class="topic-info">
                    <div class="topic-name">${kp.knowledge_name}</div>
                    <div class="topic-stats">仅访问 ${kp.visits} 次</div>
                  </div>
                </div>
              `).join('')}
            </div>
            <p style="margin-top: 12px; color: #718096; font-size: 14px;">
              ⚠️ 这些知识点学生访问较少，可能被忽略或难度较高
            </p>
          </div>
        `;
      }
      
      // 题型分布
      if (stats.typeDistribution && stats.typeDistribution.length > 0) {
        html += `
          <div class="report-section">
            <h3><span class="section-icon">📊</span> 题型使用分布</h3>
            <div style="display: grid; gap: 12px;">
              ${stats.typeDistribution.map(type => {
                const typeNames = {
                  uniform: '匀变速直线运动',
                  projectile: '抛体运动',
                  circular: '圆周运动',
                  collision: '碰撞',
                  magnetic: '磁场中的运动',
                  astrodynamics: '天体运动'
                };
                return `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f7fafc; border-radius: 8px;">
                    <span style="font-weight: 500;">${typeNames[type.question_type] || type.question_type}</span>
                    <span style="color: #4299e1; font-weight: bold;">${type.count} 次</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }
      
      // 备课建议
      html += `
        <div class="report-section">
          <h3><span class="section-icon">💡</span> 精准备课指导方案</h3>
          <div class="teaching-suggestions">
            <div class="suggestion-item">
              <div class="suggestion-label">整体评价</div>
              <div class="suggestion-text">
                本周期内共有 <strong>${stats.studentCount}</strong> 名学生使用平台，
                平均学习时长 <strong>${Math.round(stats.avgStudyTime / 60)}</strong> 分钟。
              </div>
            </div>
            <div class="suggestion-item">
              <div class="suggestion-label">学生关注点</div>
              <div class="suggestion-text">
                学生最关注 <strong>${stats.hotKnowledge[0]?.knowledge_name || '暂无'}</strong>，
                建议增加相关例题和拓展内容。
              </div>
            </div>
            <div class="suggestion-item">
              <div class="suggestion-label">备课建议</div>
              <div class="suggestion-text">
                对热门知识点可适当增加难度，对冷门知识点需加强引导和讲解。
              </div>
            </div>
          </div>
        </div>
      `;
      
      this.elements.content.innerHTML = html;
      
    } catch (error) {
      console.error('获取云端报告失败:', error);
      this.elements.content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">❌</div>
          <h3>获取云端数据失败</h3>
          <p>错误信息: ${error.message}</p>
          <p style="margin-top: 16px; color: #718096; font-size: 14px;">
            请确保：<br>
            1. Cloudflare Worker 已部署<br>
            2. D1 数据库已配置<br>
            3. 有学生数据已同步到云端
          </p>
        </div>
      `;
    }
  }
}

// 初始化
if (typeof window !== 'undefined' && window.learningAnalytics) {
  window.learningReportUI = new LearningReportUI(window.learningAnalytics);
}
