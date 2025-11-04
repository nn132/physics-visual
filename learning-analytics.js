/**
 * 学习行为追踪与分析系统
 * 用途：记录用户学习行为，生成学习报告
 */

class LearningAnalytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.data = this.loadData();
    
    // 当前活动追踪
    this.currentActivity = null;
    this.currentStartTime = null;
    
    // 自动保存
    this.autoSaveInterval = setInterval(() => this.saveData(), 30000); // 每30秒保存
    
    // 页面关闭时保存
    window.addEventListener('beforeunload', () => this.saveData());
    
    console.log('📊 学习分析系统已启动');
  }
  
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  loadData() {
    try {
      const stored = localStorage.getItem('learningAnalyticsData');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('加载学习数据失败:', e);
    }
    
    return {
      sessions: [],
      knowledgePoints: {}, // 知识点访问记录
      examples: {},        // 例题练习记录
      visualizations: {},  // 可视化生成记录
      questionTypes: {},   // 题型使用统计
      totalTime: 0,        // 总学习时间
      lastVisit: null
    };
  }
  
  saveData() {
    try {
      this.data.lastVisit = Date.now();
      localStorage.setItem('learningAnalyticsData', JSON.stringify(this.data));
      console.log('💾 学习数据已保存');
    } catch (e) {
      console.error('保存学习数据失败:', e);
    }
  }
  
  // ==================== 行为追踪 ====================
  
  /**
   * 开始追踪活动
   * @param {string} type - 活动类型: 'knowledge'|'example'|'visualization'|'export'
   * @param {object} details - 活动详情
   */
  startActivity(type, details = {}) {
    // 结束上一个活动
    if (this.currentActivity) {
      this.endActivity();
    }
    
    this.currentActivity = { type, details, startTime: Date.now() };
    console.log(`▶️ 开始活动: ${type}`, details);
  }
  
  /**
   * 结束当前活动
   */
  endActivity() {
    if (!this.currentActivity) return;
    
    const duration = Date.now() - this.currentActivity.startTime;
    const { type, details } = this.currentActivity;
    
    // 记录数据
    switch (type) {
      case 'knowledge':
        this.recordKnowledgePoint(details, duration);
        break;
      case 'example':
        this.recordExample(details, duration);
        break;
      case 'visualization':
        this.recordVisualization(details, duration);
        break;
    }
    
    this.data.totalTime += duration;
    console.log(`⏹️ 结束活动: ${type}, 时长: ${(duration / 1000).toFixed(1)}秒`);
    
    this.currentActivity = null;
    this.saveData();
  }
  
  // ==================== 具体记录方法 ====================
  
  recordKnowledgePoint(details, duration) {
    const key = details.id || details.name;
    if (!this.data.knowledgePoints[key]) {
      this.data.knowledgePoints[key] = {
        name: details.name,
        category: details.category,
        visits: 0,
        totalTime: 0,
        lastVisit: null
      };
    }
    
    this.data.knowledgePoints[key].visits++;
    this.data.knowledgePoints[key].totalTime += duration;
    this.data.knowledgePoints[key].lastVisit = Date.now();
  }
  
  recordExample(details, duration) {
    const key = `${details.knowledgePoint || 'unknown'}-${details.title}`;
    if (!this.data.examples[key]) {
      this.data.examples[key] = {
        title: details.title,
        knowledgePoint: details.knowledgePoint,
        type: details.type,
        attempts: 0,
        totalTime: 0,
        visualizations: 0,
        lastAttempt: null
      };
    }
    
    this.data.examples[key].attempts++;
    this.data.examples[key].totalTime += duration;
    this.data.examples[key].lastAttempt = Date.now();
  }
  
  recordVisualization(details, duration) {
    const key = `viz-${Date.now()}`;
    this.data.visualizations[key] = {
      type: details.type,
      params: details.params,
      duration: duration,
      timestamp: Date.now(),
      played: details.played || false
    };
    
    // 更新题型统计
    if (!this.data.questionTypes[details.type]) {
      this.data.questionTypes[details.type] = {
        count: 0,
        totalTime: 0
      };
    }
    this.data.questionTypes[details.type].count++;
    this.data.questionTypes[details.type].totalTime += duration;
    
    // 更新例题统计
    if (details.exampleKey) {
      if (this.data.examples[details.exampleKey]) {
        this.data.examples[details.exampleKey].visualizations++;
      }
    }
  }
  
  // ==================== 数据分析 ====================
  
  /**
   * 获取学习统计摘要
   */
  getSummary() {
    const knowledgeArray = Object.values(this.data.knowledgePoints);
    const exampleArray = Object.values(this.data.examples);
    const vizArray = Object.values(this.data.visualizations);
    
    return {
      totalTime: this.data.totalTime,
      totalSessions: this.data.sessions.length,
      knowledgePointsVisited: knowledgeArray.length,
      examplesAttempted: exampleArray.length,
      visualizationsGenerated: vizArray.length,
      lastVisit: this.data.lastVisit
    };
  }
  
  /**
   * 获取知识点掌握度分析
   */
  getKnowledgeMastery() {
    const points = Object.values(this.data.knowledgePoints);
    
    return points.map(point => {
      // 综合评分算法：访问次数 + 时长
      const timeScore = Math.min(point.totalTime / 60000, 10); // 最高10分（10分钟）
      const visitScore = Math.min(point.visits, 10); // 最高10分（10次）
      const masteryScore = (timeScore * 0.6 + visitScore * 0.4) * 10; // 0-100分
      
      return {
        name: point.name,
        category: point.category,
        visits: point.visits,
        totalTime: point.totalTime,
        masteryScore: Math.round(masteryScore),
        level: this.getMasteryLevel(masteryScore)
      };
    }).sort((a, b) => b.masteryScore - a.masteryScore);
  }
  
  getMasteryLevel(score) {
    if (score >= 80) return '精通';
    if (score >= 60) return '熟练';
    if (score >= 40) return '了解';
    if (score >= 20) return '初识';
    return '薄弱';
  }
  
  /**
   * 获取学习偏好分析（按分类）
   */
  getCategoryPreference() {
    const points = Object.values(this.data.knowledgePoints);
    const categoryStats = {};
    
    points.forEach(point => {
      const cat = point.category || '未分类';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { count: 0, totalTime: 0 };
      }
      categoryStats[cat].count += point.visits;
      categoryStats[cat].totalTime += point.totalTime;
    });
    
    return Object.entries(categoryStats).map(([name, stats]) => ({
      category: name,
      visits: stats.count,
      totalTime: stats.totalTime,
      percentage: 0 // 稍后计算
    }));
  }
  
  /**
   * 获取题型使用统计
   */
  getQuestionTypeStats() {
    return Object.entries(this.data.questionTypes).map(([type, stats]) => ({
      type: this.getQuestionTypeName(type),
      count: stats.count,
      totalTime: stats.totalTime,
      avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0
    }));
  }
  
  getQuestionTypeName(type) {
    const names = {
      'uniform': '匀变速运动',
      'projectile': '抛体运动',
      'circular': '圆周运动',
      'collision': '碰撞运动',
      'magnetic': '磁场运动',
      'astrodynamics': '天体运动'
    };
    return names[type] || type;
  }
  
  /**
   * 获取薄弱环节建议
   */
  getWeakPoints() {
    const mastery = this.getKnowledgeMastery();
    return mastery
      .filter(point => point.masteryScore < 60)
      .slice(0, 5) // 最多5个
      .map(point => ({
        name: point.name,
        category: point.category,
        score: point.masteryScore,
        suggestion: this.generateSuggestion(point)
      }));
  }
  
  generateSuggestion(point) {
    if (point.visits < 2) {
      return '建议多次复习该知识点，加深理解';
    }
    if (point.totalTime < 120000) { // 2分钟
      return '学习时间较短，建议深入学习相关例题';
    }
    return '可以尝试更多相关例题来巩固知识';
  }
  
  /**
   * 获取学习时间趋势（按天）
   */
  getTimeTrend() {
    const vizArray = Object.values(this.data.visualizations);
    const dailyStats = {};
    
    vizArray.forEach(viz => {
      const date = new Date(viz.timestamp).toLocaleDateString('zh-CN');
      if (!dailyStats[date]) {
        dailyStats[date] = { count: 0, totalTime: 0 };
      }
      dailyStats[date].count++;
      dailyStats[date].totalTime += viz.duration;
    });
    
    return Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        count: stats.count,
        totalTime: stats.totalTime
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }
  
  // ==================== 报告生成 ====================
  
  /**
   * 生成学生学习报告
   */
  generateStudentReport() {
    const summary = this.getSummary();
    const mastery = this.getKnowledgeMastery();
    const categoryPref = this.getCategoryPreference();
    const questionStats = this.getQuestionTypeStats();
    const weakPoints = this.getWeakPoints();
    const timeTrend = this.getTimeTrend();
    
    // 计算分类百分比
    const totalCategoryTime = categoryPref.reduce((sum, c) => sum + c.totalTime, 0);
    categoryPref.forEach(c => {
      c.percentage = totalCategoryTime > 0 ? (c.totalTime / totalCategoryTime * 100) : 0;
    });
    
    return {
      reportType: 'student',
      generatedAt: new Date().toLocaleString('zh-CN'),
      summary,
      knowledgeMastery: mastery,
      categoryPreference: categoryPref,
      questionTypeStats: questionStats,
      weakPoints,
      timeTrend,
      recommendations: this.generateRecommendations(mastery, weakPoints)
    };
  }
  
  /**
   * 生成教师备课报告（基于学生使用数据）
   */
  generateTeacherReport() {
    const summary = this.getSummary();
    const mastery = this.getKnowledgeMastery();
    const categoryPref = this.getCategoryPreference();
    const questionStats = this.getQuestionTypeStats();
    
    // 热门知识点（学生最关注的）
    const hotTopics = mastery.slice(0, 5);
    
    // 冷门知识点（学生较少关注的）
    const coldTopics = mastery.slice(-5).reverse();
    
    // 学生平均掌握度
    const avgMastery = mastery.length > 0 
      ? mastery.reduce((sum, m) => sum + m.masteryScore, 0) / mastery.length 
      : 0;
    
    return {
      reportType: 'teacher',
      generatedAt: new Date().toLocaleString('zh-CN'),
      summary: {
        ...summary,
        avgMasteryScore: Math.round(avgMastery),
        studentCount: 1 // TODO: 多学生统计时改为实际人数
      },
      hotTopics,
      coldTopics,
      categoryDistribution: categoryPref,
      questionTypeUsage: questionStats,
      teachingSuggestions: this.generateTeachingSuggestions(mastery, categoryPref, avgMastery)
    };
  }
  
  generateRecommendations(mastery, weakPoints) {
    const recommendations = [];
    
    if (weakPoints.length > 0) {
      recommendations.push({
        type: '查漏补缺',
        icon: '🎯',
        content: `发现${weakPoints.length}个薄弱知识点，建议重点复习：${weakPoints.map(p => p.name).join('、')}`
      });
    }
    
    const avgScore = mastery.reduce((sum, m) => sum + m.masteryScore, 0) / mastery.length;
    if (avgScore >= 70) {
      recommendations.push({
        type: '学习状态',
        icon: '🌟',
        content: '整体掌握良好，可以尝试更有挑战性的题目'
      });
    } else if (avgScore < 50) {
      recommendations.push({
        type: '学习建议',
        icon: '💪',
        content: '建议系统复习基础知识，多做例题巩固'
      });
    }
    
    return recommendations;
  }
  
  generateTeachingSuggestions(mastery, categoryPref, avgMastery) {
    const suggestions = [];
    
    // 学生整体掌握情况分析
    if (avgMastery >= 70) {
      suggestions.push({
        type: '整体评价',
        icon: '🌟',
        content: `学生平均掌握度${Math.round(avgMastery)}分，整体学习状态良好。可以适当增加难度，引入拓展性内容。`
      });
    } else if (avgMastery < 50) {
      suggestions.push({
        type: '整体评价',
        icon: '⚠️',
        content: `学生平均掌握度仅${Math.round(avgMastery)}分，建议放慢教学进度，增加基础知识讲解和练习时间。`
      });
    }
    
    // 学生关注度分析
    const topCategory = categoryPref.sort((a, b) => b.totalTime - a.totalTime)[0];
    if (topCategory) {
      suggestions.push({
        type: '学生关注点',
        icon: '📚',
        content: `学生对"${topCategory.category}"投入时间最多，说明该部分内容受欢迎或难度适中，可作为教学重点展开。`
      });
    }
    
    // 薄弱环节建议
    const weakCount = mastery.filter(m => m.masteryScore < 60).length;
    if (weakCount > 3) {
      suggestions.push({
        type: '薄弱环节',
        icon: '�',
        content: `发现${weakCount}个知识点学生掌握不足（<60分），建议针对这些知识点：\n• 增加课堂讲解时间\n• 提供更多例题练习\n• 组织专题答疑`
      });
    }
    
    // 题型使用分析
    const leastUsedTypes = mastery.filter(m => m.visits < 2);
    if (leastUsedTypes.length > 0) {
      suggestions.push({
        type: '冷门内容',
        icon: '❄️',
        content: `有${leastUsedTypes.length}个知识点很少有学生访问，建议：\n• 检查是否为非重点内容\n• 增加趣味性例题吸引学生\n• 在课堂中主动讲解`
      });
    }
    
    // 备课资源建议
    suggestions.push({
      type: '备课建议',
      icon: '📖',
      content: `根据学生使用情况，建议准备以下资源：\n• 补充${weakCount}个薄弱知识点的习题\n• 准备热门知识点的拓展内容\n• 设计互动性强的可视化演示`
    });
    
    return suggestions;
  }
  
  // ==================== 工具方法 ====================
  
  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  }
  
  clearData() {
    if (confirm('确定要清除所有学习数据吗？此操作不可恢复。')) {
      localStorage.removeItem('learningAnalyticsData');
      this.data = this.loadData();
      console.log('✅ 学习数据已清除');
      return true;
    }
    return false;
  }
  
  exportData(format = 'json') {
    const report = this.generateStudentReport();
    
    if (format === 'json') {
      const dataStr = JSON.stringify(report, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `学习报告-${new Date().toLocaleDateString('zh-CN')}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }
  
  // ==================== 云同步功能 ====================
  
  /**
   * 上传当前会话数据到云端
   * @param {string} workerUrl - Cloudflare Worker API地址
   */
  async syncToCloud(workerUrl = 'https://physics-visual-worker.yywf08125.workers.dev') {
    try {
      console.log('☁️ 开始同步数据到云端...');
      
      // 1. 同步会话信息
      await fetch(`${workerUrl}/api/learning/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          studentId: this.data.studentId || null,
          startTime: Math.floor(this.startTime / 1000),
          endTime: Math.floor(Date.now() / 1000),
          totalTime: Math.floor(this.data.totalTime / 1000)
        })
      });
      
      // 2. 同步知识点数据
      for (const [key, kp] of Object.entries(this.data.knowledgePoints)) {
        await fetch(`${workerUrl}/api/learning/knowledge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.sessionId,
            knowledgeId: key,
            knowledgeName: kp.name,
            category: kp.category,
            visitCount: kp.visits,
            totalTime: Math.floor(kp.totalTime / 1000)
          })
        });
      }
      
      // 3. 同步例题数据
      for (const [title, ex] of Object.entries(this.data.examples)) {
        await fetch(`${workerUrl}/api/learning/example`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.sessionId,
            exampleTitle: title,
            knowledgePoint: ex.knowledgePoint,
            questionType: ex.type,
            attempts: ex.attempts,
            totalTime: Math.floor(ex.totalTime / 1000),
            visualizations: ex.visualizations
          })
        });
      }
      
      // 4. 同步可视化记录（最近50条）
      const recentViz = Object.entries(this.data.visualizations)
        .sort((a, b) => b[1].lastGenerated - a[1].lastGenerated)
        .slice(0, 50);
      
      for (const [type, viz] of recentViz) {
        await fetch(`${workerUrl}/api/learning/visualization`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.sessionId,
            questionType: type,
            params: viz.params || {},
            duration: Math.floor(viz.avgDuration / 1000),
            played: viz.played > 0
          })
        });
      }
      
      console.log('✅ 数据同步成功');
      return { success: true };
    } catch (error) {
      console.error('❌ 数据同步失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 从云端获取教师报告
   * @param {string} workerUrl - Worker API地址
   * @param {number} days - 统计最近N天
   */
  async fetchTeacherReport(workerUrl = 'https://physics-visual-worker.yywf08125.workers.dev', days = 7) {
    try {
      const response = await fetch(`${workerUrl}/api/learning/report?type=teacher&days=${days}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('📊 教师报告获取成功:', data.stats);
        return data;
      } else {
        throw new Error(data.error || '获取报告失败');
      }
    } catch (error) {
      console.error('❌ 获取教师报告失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 启用自动云同步（可选功能）
   * @param {number} interval - 同步间隔（毫秒），默认5分钟
   */
  enableAutoSync(interval = 300000) {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }
    
    this.autoSyncInterval = setInterval(async () => {
      const result = await this.syncToCloud();
      if (result.success) {
        console.log('🔄 自动同步完成');
      }
    }, interval);
    
    console.log(`🔄 已启用自动云同步（间隔: ${interval / 1000}秒）`);
  }
  
  /**
   * 停止自动云同步
   */
  disableAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      console.log('🔄 已停止自动云同步');
    }
  }
}

// 自动初始化
if (typeof window !== 'undefined') {
  window.learningAnalytics = new LearningAnalytics();
}
