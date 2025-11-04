/**
 * 增强版学习分析引擎 v2.0
 * 功能：深度数据收集、智能分析、专业报告生成
 */

class LearningAnalyticsV2 {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.data = this.loadData();
    
    // 当前活动追踪
    this.currentActivity = null;
    this.activityStartTime = null;
    
    // 行为序列记录（用于模式分析）
    this.behaviorSequence = [];
    
    // 性能指标
    this.metrics = {
      focusTime: 0,        // 专注时间
      distractionCount: 0, // 分心次数
      efficiency: 0        // 学习效率
    };
    
    // 自动保存
    this.setupAutoSave();
    
    // 页面可见性监听（检测分心）
    this.setupVisibilityTracking();
    
    console.log('📊 学习分析系统 v2.0 已启动');
  }
  
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  loadData() {
    try {
      const stored = localStorage.getItem('learningAnalyticsV2');
      if (stored) {
        const data = JSON.parse(stored);
        return {
          ...data,
          sessions: data.sessions || [],
          knowledgePoints: data.knowledgePoints || {},
          visualizations: data.visualizations || {},
          questionTypes: data.questionTypes || {},
          learningPath: data.learningPath || [],     // 学习路径
          timeDistribution: data.timeDistribution || {}, // 时间分布
          difficulty: data.difficulty || {},          // 难度评估
          mastery: data.mastery || {},               // 掌握程度
          mistakes: data.mistakes || [],             // 错误记录
          achievements: data.achievements || [],      // 成就记录
        };
      }
    } catch (e) {
      console.error('加载数据失败:', e);
    }
    
    return this.getDefaultData();
  }
  
  getDefaultData() {
    return {
      sessions: [],
      knowledgePoints: {},
      visualizations: {},
      questionTypes: {},
      learningPath: [],
      timeDistribution: {},
      difficulty: {},
      mastery: {},
      mistakes: [],
      achievements: [],
      totalTime: 0,
      lastVisit: null,
      version: '2.0'
    };
  }
  
  saveData() {
    try {
      this.data.lastVisit = Date.now();
      localStorage.setItem('learningAnalyticsV2', JSON.stringify(this.data));
      console.log('💾 学习数据已保存 (v2.0)');
    } catch (e) {
      console.error('保存失败:', e);
    }
  }
  
  setupAutoSave() {
    this.autoSaveInterval = setInterval(() => this.saveData(), 30000);
    window.addEventListener('beforeunload', () => {
      this.endActivity();
      this.saveData();
    });
  }
  
  setupVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.metrics.distractionCount++;
        console.log('⚠️ 用户切换标签页');
      }
    });
  }
  
  // ==================== 增强的数据收集 ====================
  
  /**
   * 记录知识点学习（增强版）
   */
  recordKnowledgePoint(details) {
    const { id, name, category, difficulty = 'medium' } = details;
    const duration = this.currentActivity ? Date.now() - this.activityStartTime : 0;
    
    if (!this.data.knowledgePoints[id]) {
      this.data.knowledgePoints[id] = {
        id,
        name,
        category,
        difficulty,
        visits: 0,
        totalTime: 0,
        avgTime: 0,
        lastVisit: null,
        masteryScore: 0,
        progressHistory: []
      };
    }
    
    const kp = this.data.knowledgePoints[id];
    kp.visits++;
    kp.totalTime += duration;
    kp.avgTime = kp.totalTime / kp.visits;
    kp.lastVisit = Date.now();
    
    // 记录学习路径
    this.data.learningPath.push({
      timestamp: Date.now(),
      type: 'knowledge',
      id,
      name,
      duration
    });
    
    // 更新时间分布
    const hour = new Date().getHours();
    const timeSlot = `${hour}:00-${hour+1}:00`;
    this.data.timeDistribution[timeSlot] = (this.data.timeDistribution[timeSlot] || 0) + duration;
    
    // 计算掌握度（基于访问次数和时长）
    this.calculateMastery(id);
    
    console.log(`📚 记录知识点: ${name} (${duration}ms)`);
  }
  
  /**
   * 记录可视化生成（增强版）
   */
  recordVisualization(details) {
    const { type, params, played = false } = details;
    const duration = this.currentActivity ? Date.now() - this.activityStartTime : 0;
    
    if (!this.data.visualizations[type]) {
      this.data.visualizations[type] = {
        type,
        count: 0,
        totalTime: 0,
        avgTime: 0,
        played: 0,
        params: [],
        successRate: 100
      };
    }
    
    const viz = this.data.visualizations[type];
    viz.count++;
    viz.totalTime += duration;
    viz.avgTime = viz.totalTime / viz.count;
    if (played) viz.played++;
    viz.params.push(params);
    
    // 记录到学习路径
    this.data.learningPath.push({
      timestamp: Date.now(),
      type: 'visualization',
      vizType: type,
      duration,
      played
    });
    
    // 更新题型统计
    this.data.questionTypes[type] = (this.data.questionTypes[type] || 0) + 1;
    
    console.log(`🎨 记录可视化: ${type} (${duration}ms)`);
  }
  
  /**
   * 计算知识点掌握度
   */
  calculateMastery(knowledgeId) {
    const kp = this.data.knowledgePoints[knowledgeId];
    if (!kp) return;
    
    // 掌握度算法：
    // 1. 访问频率权重 40%
    // 2. 学习时长权重 30%
    // 3. 最近访问权重 20%
    // 4. 难度调整 10%
    
    const visitScore = Math.min(kp.visits / 5 * 40, 40);
    const timeScore = Math.min(kp.totalTime / 60000 * 30, 30); // 1分钟=满分
    const recencyScore = (Date.now() - kp.lastVisit) < 86400000 ? 20 : 10; // 24小时内
    const difficultyPenalty = kp.difficulty === 'hard' ? -10 : kp.difficulty === 'easy' ? 5 : 0;
    
    kp.masteryScore = Math.max(0, Math.min(100, visitScore + timeScore + recencyScore + difficultyPenalty));
    
    // 记录进度历史
    kp.progressHistory.push({
      timestamp: Date.now(),
      score: kp.masteryScore
    });
  }
  
  // ==================== 智能分析 ====================
  
  /**
   * 学习模式分析
   */
  analyzeLearningPattern() {
    const path = this.data.learningPath.slice(-20); // 最近20个行为
    
    // 分析学习风格
    const visualCount = path.filter(p => p.type === 'visualization').length;
    const knowledgeCount = path.filter(p => p.type === 'knowledge').length;
    
    let style = 'balanced';
    if (visualCount > knowledgeCount * 1.5) {
      style = 'visual'; // 视觉型学习者
    } else if (knowledgeCount > visualCount * 1.5) {
      style = 'theoretical'; // 理论型学习者
    }
    
    // 分析学习节奏
    const durations = path.map(p => p.duration).filter(d => d > 0);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    let pace = 'normal';
    if (avgDuration < 30000) pace = 'fast';
    else if (avgDuration > 90000) pace = 'slow';
    
    return { style, pace, avgDuration };
  }
  
  /**
   * 薄弱点分析
   */
  findWeakPoints() {
    const weakPoints = [];
    
    for (const [id, kp] of Object.entries(this.data.knowledgePoints)) {
      if (kp.masteryScore < 50) {
        weakPoints.push({
          id,
          name: kp.name,
          category: kp.category,
          masteryScore: kp.masteryScore,
          visits: kp.visits,
          reason: this.analyzeWeakReason(kp)
        });
      }
    }
    
    return weakPoints.sort((a, b) => a.masteryScore - b.masteryScore);
  }
  
  analyzeWeakReason(kp) {
    if (kp.visits < 2) return '访问次数过少';
    if (kp.avgTime < 20000) return '学习时间不足';
    if (kp.difficulty === 'hard') return '知识点难度较高';
    return '需要加强理解';
  }
  
  /**
   * 学习效率分析
   */
  calculateEfficiency() {
    const totalTime = this.data.totalTime || 1;
    const pointsLearned = Object.keys(this.data.knowledgePoints).length;
    const vizGenerated = Object.values(this.data.visualizations).reduce((sum, v) => sum + v.count, 0);
    
    // 效率 = (知识点数 * 10 + 可视化数 * 5) / (总时长/分钟)
    const efficiency = (pointsLearned * 10 + vizGenerated * 5) / (totalTime / 60000);
    
    return {
      score: Math.min(100, efficiency * 10),
      pointsPerHour: pointsLearned / (totalTime / 3600000),
      vizPerHour: vizGenerated / (totalTime / 3600000)
    };
  }
  
  /**
   * 时间分布分析
   */
  analyzeTimeDistribution() {
    const distribution = {};
    const hours = Object.keys(this.data.timeDistribution);
    
    // 找出最活跃时段
    let peakHour = null;
    let peakTime = 0;
    
    for (const [hour, time] of Object.entries(this.data.timeDistribution)) {
      if (time > peakTime) {
        peakTime = time;
        peakHour = hour;
      }
      
      // 分类时段
      const h = parseInt(hour.split(':')[0]);
      let period = '';
      if (h >= 6 && h < 12) period = '早晨';
      else if (h >= 12 && h < 18) period = '下午';
      else if (h >= 18 && h < 22) period = '晚上';
      else period = '深夜';
      
      distribution[period] = (distribution[period] || 0) + time;
    }
    
    return { peakHour, peakTime, distribution };
  }
  
  // ==================== 报告生成 ====================
  
  /**
   * 生成学生详细报告
   */
  generateDetailedStudentReport() {
    const pattern = this.analyzeLearningPattern();
    const weakPoints = this.findWeakPoints();
    const efficiency = this.calculateEfficiency();
    const timeAnalysis = this.analyzeTimeDistribution();
    
    const knowledgeList = Object.values(this.data.knowledgePoints)
      .sort((a, b) => b.masteryScore - a.masteryScore);
    
    return {
      summary: {
        totalKnowledge: Object.keys(this.data.knowledgePoints).length,
        totalVisualizations: Object.values(this.data.visualizations).reduce((s, v) => s + v.count, 0),
        totalTime: this.data.totalTime,
        avgMastery: knowledgeList.reduce((s, k) => s + k.masteryScore, 0) / (knowledgeList.length || 1),
        efficiency: efficiency.score
      },
      pattern: {
        learningStyle: pattern.style,
        pace: pattern.pace,
        avgDuration: pattern.avgDuration
      },
      mastery: {
        top5: knowledgeList.slice(0, 5),
        weak: weakPoints,
        progress: this.calculateProgressTrend()
      },
      timeAnalysis: timeAnalysis,
      recommendations: this.generateRecommendations(pattern, weakPoints, efficiency),
      charts: {
        masteryRadar: this.getMasteryRadarData(),
        timeDistribution: this.getTimeDistributionData(),
        progressLine: this.getProgressLineData(),
        categoryPie: this.getCategoryPieData()
      }
    };
  }
  
  /**
   * 生成教师详细报告
   */
  generateDetailedTeacherReport() {
    // 这里假设可以获取多个学生的数据聚合
    // 实际使用时从云端API获取
    
    const allKnowledge = Object.values(this.data.knowledgePoints);
    const hotTopics = allKnowledge
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);
    
    const coldTopics = allKnowledge
      .filter(k => k.visits < 3)
      .sort((a, b) => a.visits - b.visits)
      .slice(0, 5);
    
    return {
      overview: {
        totalStudents: 1, // 演示值
        avgStudyTime: this.data.totalTime,
        avgMastery: allKnowledge.reduce((s, k) => s + k.masteryScore, 0) / (allKnowledge.length || 1),
        completionRate: 75 // 演示值
      },
      hotTopics,
      coldTopics,
      difficulty: this.analyzeDifficultyDistribution(),
      recommendations: this.generateTeachingRecommendations(hotTopics, coldTopics),
      charts: {
        masteryHeatmap: this.getMasteryHeatmapData(),
        topicRanking: this.getTopicRankingData(),
        difficultyDistribution: this.getDifficultyDistributionData(),
        learningPathFlow: this.getLearningPathFlowData()
      }
    };
  }
  
  // ==================== 图表数据生成 ====================
  
  getMasteryRadarData() {
    const categories = {};
    for (const kp of Object.values(this.data.knowledgePoints)) {
      if (!categories[kp.category]) {
        categories[kp.category] = [];
      }
      categories[kp.category].push(kp.masteryScore);
    }
    
    return {
      labels: Object.keys(categories),
      data: Object.values(categories).map(scores => 
        scores.reduce((a, b) => a + b, 0) / scores.length
      )
    };
  }
  
  getTimeDistributionData() {
    const periods = ['早晨', '下午', '晚上', '深夜'];
    const data = periods.map(p => this.data.timeDistribution[p] || 0);
    return { labels: periods, data };
  }
  
  getProgressLineData() {
    // 取每个知识点最近的进度数据
    const allProgress = [];
    for (const kp of Object.values(this.data.knowledgePoints)) {
      allProgress.push(...kp.progressHistory);
    }
    
    allProgress.sort((a, b) => a.timestamp - b.timestamp);
    
    return {
      labels: allProgress.map(p => new Date(p.timestamp).toLocaleDateString()),
      data: allProgress.map(p => p.score)
    };
  }
  
  getCategoryPieData() {
    const categories = {};
    for (const kp of Object.values(this.data.knowledgePoints)) {
      categories[kp.category] = (categories[kp.category] || 0) + 1;
    }
    
    return {
      labels: Object.keys(categories),
      data: Object.values(categories)
    };
  }
  
  getMasteryHeatmapData() {
    // 热力图数据：知识点 x 学生
    return Object.values(this.data.knowledgePoints).map(kp => ({
      name: kp.name,
      score: kp.masteryScore
    }));
  }
  
  getTopicRankingData() {
    return Object.values(this.data.knowledgePoints)
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10)
      .map(kp => ({
        name: kp.name,
        visits: kp.visits,
        avgTime: kp.avgTime
      }));
  }
  
  getDifficultyDistributionData() {
    const dist = { easy: 0, medium: 0, hard: 0 };
    for (const kp of Object.values(this.data.knowledgePoints)) {
      dist[kp.difficulty]++;
    }
    return dist;
  }
  
  getLearningPathFlowData() {
    return this.data.learningPath.slice(-30);
  }
  
  // ==================== 建议生成 ====================
  
  generateRecommendations(pattern, weakPoints, efficiency) {
    const recommendations = [];
    
    // 基于学习风格
    if (pattern.style === 'visual') {
      recommendations.push({
        type: 'style',
        title: '您是视觉型学习者',
        content: '建议继续通过动画和图表加深理解，但也要注重理论知识的学习。',
        priority: 'medium'
      });
    }
    
    // 基于效率
    if (efficiency.score < 50) {
      recommendations.push({
        type: 'efficiency',
        title: '学习效率有待提高',
        content: '建议制定学习计划，每次学习设定明确目标，减少分心时间。',
        priority: 'high'
      });
    }
    
    // 基于薄弱点
    if (weakPoints.length > 0) {
      recommendations.push({
        type: 'weak',
        title: `发现${weakPoints.length}个薄弱知识点`,
        content: `重点关注：${weakPoints.slice(0, 3).map(w => w.name).join('、')}`,
        priority: 'high'
      });
    }
    
    return recommendations;
  }
  
  generateTeachingRecommendations(hotTopics, coldTopics) {
    const recommendations = [];
    
    if (hotTopics.length > 0) {
      recommendations.push({
        type: 'hot',
        title: '学生热门关注点',
        content: `${hotTopics[0].name}是学生最关注的内容，可以适当增加相关例题和拓展。`
      });
    }
    
    if (coldTopics.length > 0) {
      recommendations.push({
        type: 'cold',
        title: '冷门知识点需引导',
        content: `${coldTopics.map(c => c.name).join('、')}访问较少，建议课堂上强调其重要性。`
      });
    }
    
    return recommendations;
  }
  
  analyzeDifficultyDistribution() {
    const dist = { easy: [], medium: [], hard: [] };
    for (const kp of Object.values(this.data.knowledgePoints)) {
      dist[kp.difficulty].push(kp);
    }
    return dist;
  }
  
  calculateProgressTrend() {
    const recent = this.data.learningPath.slice(-10);
    const masteryScores = recent
      .filter(p => p.type === 'knowledge')
      .map(p => this.data.knowledgePoints[p.id]?.masteryScore || 0);
    
    if (masteryScores.length < 2) return 'stable';
    
    const trend = masteryScores[masteryScores.length - 1] - masteryScores[0];
    if (trend > 10) return 'rising';
    if (trend < -10) return 'falling';
    return 'stable';
  }
  
  // ==================== 活动追踪 ====================
  
  startActivity(type, details = {}) {
    if (this.currentActivity) {
      this.endActivity();
    }
    
    this.currentActivity = { type, details };
    this.activityStartTime = Date.now();
    
    this.behaviorSequence.push({
      type,
      start: this.activityStartTime
    });
    
    console.log(`▶️ 开始: ${type}`, details);
  }
  
  endActivity() {
    if (!this.currentActivity) return;
    
    const { type, details } = this.currentActivity;
    const duration = Date.now() - this.activityStartTime;
    
    this.data.totalTime += duration;
    
    if (type === 'knowledge') {
      this.recordKnowledgePoint(details);
    } else if (type === 'visualization') {
      this.recordVisualization(details);
    }
    
    this.currentActivity = null;
    this.activityStartTime = null;
    
    console.log(`⏹️ 结束: ${type} (${(duration/1000).toFixed(1)}秒)`);
  }
  
  // ==================== 云同步 ====================
  
  async syncToCloud(workerUrl = 'https://physics-visual-worker.yywf08125.workers.dev') {
    try {
      console.log('☁️ 开始同步...');
      
      // 同步会话
      await fetch(`${workerUrl}/api/learning/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          startTime: Math.floor(this.startTime / 1000),
          endTime: Math.floor(Date.now() / 1000),
          totalTime: Math.floor(this.data.totalTime / 1000)
        })
      });
      
      // 同步知识点
      for (const kp of Object.values(this.data.knowledgePoints)) {
        await fetch(`${workerUrl}/api/learning/knowledge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.sessionId,
            knowledgeId: kp.id,
            knowledgeName: kp.name,
            category: kp.category,
            visitCount: kp.visits,
            totalTime: Math.floor(kp.totalTime / 1000)
          })
        });
      }
      
      // 同步可视化
      for (const [type, viz] of Object.entries(this.data.visualizations)) {
        await fetch(`${workerUrl}/api/learning/visualization`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.sessionId,
            questionType: type,
            params: viz.params[0] || {},
            duration: Math.floor(viz.avgTime / 1000),
            played: viz.played > 0
          })
        });
      }
      
      console.log('✅ 同步成功');
      return { success: true };
    } catch (error) {
      console.error('❌ 同步失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  async fetchTeacherReport(workerUrl = 'https://physics-visual-worker.yywf08125.workers.dev', days = 7) {
    try {
      const response = await fetch(`${workerUrl}/api/learning/report?type=teacher&days=${days}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('📊 教师报告获取成功');
        return data;
      } else {
        throw new Error(data.error || '获取失败');
      }
    } catch (error) {
      console.error('❌ 获取教师报告失败:', error);
      return { success: false, error: error.message };
    }
  }
}

// 自动初始化
if (typeof window !== 'undefined') {
  window.learningAnalytics = new LearningAnalyticsV2();
}
