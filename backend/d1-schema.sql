-- Cloudflare D1 数据库结构
-- 物理教学一体化平台 - 学习行为追踪系统

-- 1. 学习会话表
CREATE TABLE IF NOT EXISTS learning_sessions (
  id TEXT PRIMARY KEY,
  student_id TEXT,  -- 学生ID（可选，匿名时为NULL）
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  total_time INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

-- 2. 知识点访问记录
CREATE TABLE IF NOT EXISTS knowledge_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  knowledge_id TEXT NOT NULL,
  knowledge_name TEXT NOT NULL,
  category TEXT,
  visit_count INTEGER DEFAULT 1,
  total_time INTEGER DEFAULT 0,
  last_visit INTEGER,
  UNIQUE(session_id, knowledge_id),  -- 唯一约束：每个会话的每个知识点只有一条记录
  FOREIGN KEY (session_id) REFERENCES learning_sessions(id)
);

-- 3. 例题练习记录
CREATE TABLE IF NOT EXISTS example_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  example_title TEXT NOT NULL,
  knowledge_point TEXT,
  question_type TEXT,
  attempts INTEGER DEFAULT 1,
  total_time INTEGER DEFAULT 0,
  visualizations INTEGER DEFAULT 0,
  last_attempt INTEGER,
  UNIQUE(session_id, example_title),  -- 唯一约束：每个会话的每个例题只有一条记录
  FOREIGN KEY (session_id) REFERENCES learning_sessions(id)
);

-- 4. 可视化生成记录
CREATE TABLE IF NOT EXISTS visualizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  question_type TEXT NOT NULL,
  params TEXT,  -- JSON格式存储参数
  duration INTEGER DEFAULT 0,
  played BOOLEAN DEFAULT 0,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES learning_sessions(id)
);

-- 5. 题型统计（聚合表）
CREATE TABLE IF NOT EXISTS question_type_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  question_type TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  total_time INTEGER DEFAULT 0,
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (session_id) REFERENCES learning_sessions(id)
);

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_knowledge_session ON knowledge_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_name ON knowledge_visits(knowledge_name);
CREATE INDEX IF NOT EXISTS idx_example_session ON example_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_viz_session ON visualizations(session_id);
CREATE INDEX IF NOT EXISTS idx_viz_type ON visualizations(question_type);
CREATE INDEX IF NOT EXISTS idx_sessions_student ON learning_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_time ON learning_sessions(created_at);

-- 插入示例数据（可选，用于测试）
INSERT OR IGNORE INTO learning_sessions (id, student_id, start_time, total_time) 
VALUES ('demo-session-1', 'demo-student', unixepoch(), 0);
