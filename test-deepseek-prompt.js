// 本地测试脚本：验证 DeepSeek 提示词是否能正确理解物理概念
// 运行: node test-deepseek-prompt.js

const DEEPSEEK_API_KEY = process.argv[2] || process.env.DEEPSEEK_API_KEY;

if (!DEEPSEEK_API_KEY) {
  console.error('❌ 请提供 DeepSeek API Key:');
  console.error('   node test-deepseek-prompt.js sk-xxx');
  console.error('   或设置环境变量: $env:DEEPSEEK_API_KEY="sk-xxx"; node test-deepseek-prompt.js');
  process.exit(1);
}

const SYSTEM_PROMPT = `你是一个专业的物理题目分析器。你的任务是从中文物理题目中提取**精确的数值参数**。

【核心原则】
1. **精确提取**题目中明确给出的数字
2. **物理概念区分**（这非常重要！）：
   - "初速度" vs "加速度"：绝对不能混淆！
   - "由静止开始" = 初速度v0=0
   - "加速度为X m/s²" = a=X（注意单位是m/s²，不是m/s）
   - "以X m/s的速度" = 初速度v0=X（单位是m/s）
3. **题型识别**：
   - 匀速/匀变速直线运动 → "uniform"
   - 抛体运动 → "projectile"
   - 圆周运动 → "circular"

【参数提取规则】
匀变速直线运动（uniform）：
- v0 (初速度, m/s): "由静止"→0, "以X m/s的速度"→X
- a (加速度, m/s²): "加速度为X m/s²"→X, "匀速"→0
- time (时间, s): "X秒末"/"X秒后"/"经过X秒"→X

抛体运动（projectile）：
- speed (初速度, m/s)
- angle (抛射角, 度)
- height (初始高度, m)

【返回格式】
纯JSON，不要markdown格式：
{
  "type": "uniform|projectile|circular|collision|magnetic|astrodynamics",
  "params": {
    "v0": 数字,
    "a": 数字,
    "time": 数字
  },
  "reasoning": "中文简短说明",
  "sceneDescription": {
    "objects": ["物体名称"],
    "initialConditions": "初始状态描述",
    "environment": "环境描述"
  }
}

【示例1】
输入: "一辆汽车由静止开始以2m/s²的加速度匀加速前进，经过3秒后速度是多少？"
输出: {"type":"uniform","params":{"v0":0,"a":2,"time":3},"reasoning":"匀加速直线运动，由静止开始(v0=0)，加速度2m/s²，时间3s","sceneDescription":{"objects":["汽车"],"initialConditions":"静止并开始运动","environment":"笔直公路"}}

【示例2】
输入: "一个物体以10m/s的速度做匀速直线运动，5秒后位移是多少？"
输出: {"type":"uniform","params":{"v0":10,"a":0,"time":5},"reasoning":"匀速直线运动，初速度10m/s，加速度0，时间5s","sceneDescription":{"objects":["物体"],"initialConditions":"匀速运动","environment":"直线轨道"}}`;

const TEST_CASES = [
  {
    name: '测试1：匀加速（从静止，a=2）',
    input: '一辆汽车由静止开始以2m/s²的加速度匀加速前进，经过3秒后速度是多少？',
    expected: { type: 'uniform', params: { v0: 0, a: 2, time: 3 } }
  },
  {
    name: '测试2：匀速（v0=10）',
    input: '一个物体以10m/s的速度做匀速直线运动，5秒后位移是多少？',
    expected: { type: 'uniform', params: { v0: 10, a: 0, time: 5 } }
  },
  {
    name: '测试3：匀减速',
    input: '一辆车以20m/s的速度行驶，刹车后以5m/s²的加速度减速，2秒后速度是多少？',
    expected: { type: 'uniform', params: { v0: 20, a: -5, time: 2 } }
  }
];

async function testDeepSeek(description) {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: description }
      ],
      max_tokens: 800,
      temperature: 0.0
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const assistant = data.choices?.[0]?.message?.content || '';
  
  // 提取 JSON
  const start = assistant.indexOf('{');
  if (start === -1) return { raw: assistant, parsed: null };
  
  let depth = 0;
  for (let i = start; i < assistant.length; i++) {
    const ch = assistant[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (depth === 0) {
      const jsonText = assistant.slice(start, i + 1);
      try {
        return { raw: assistant, parsed: JSON.parse(jsonText) };
      } catch (e) {
        return { raw: assistant, parsed: null };
      }
    }
  }
  return { raw: assistant, parsed: null };
}

(async () => {
  console.log('🚀 开始测试 DeepSeek 提示词...\n');
  
  for (const testCase of TEST_CASES) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📝 ${testCase.name}`);
    console.log(`📥 输入: "${testCase.input}"`);
    console.log(`🎯 期望: ${JSON.stringify(testCase.expected)}`);
    
    try {
      const result = await testDeepSeek(testCase.input);
      
      if (!result.parsed) {
        console.log('❌ 解析失败');
        console.log('📄 原始返回:', result.raw);
        continue;
      }
      
      console.log(`📤 实际: ${JSON.stringify(result.parsed)}`);
      
      // 验证结果
      const { type, params } = result.parsed;
      const exp = testCase.expected;
      
      const typeMatch = type === exp.type;
      const v0Match = params.v0 === exp.params.v0;
      const aMatch = params.a === exp.params.a;
      const timeMatch = params.time === exp.params.time;
      
      if (typeMatch && v0Match && aMatch && timeMatch) {
        console.log('✅ 测试通过！');
      } else {
        console.log('❌ 测试失败！');
        if (!typeMatch) console.log(`   - 题型不匹配: ${type} ≠ ${exp.type}`);
        if (!v0Match) console.log(`   - 初速度不匹配: ${params.v0} ≠ ${exp.params.v0}`);
        if (!aMatch) console.log(`   - 加速度不匹配: ${params.a} ≠ ${exp.params.a}`);
        if (!timeMatch) console.log(`   - 时间不匹配: ${params.time} ≠ ${exp.params.time}`);
      }
      
    } catch (error) {
      console.log('❌ 请求失败:', error.message);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('🏁 测试完成！');
})();
