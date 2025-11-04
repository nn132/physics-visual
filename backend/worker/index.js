// Cloudflare Worker - ES Module format
// Physics visualization backend with D1 database support

const SYSTEM_PROMPT = `You are DeepSeek, a specialized physics problem parser that converts natural-language physics problems into structured JSON with visualization parameters.

Return ONLY valid JSON with these fields:
1. type: (uniform|projectile|circular|collision|magnetic|astrodynamics)
2. params: Object with numeric parameters specific to the motion type
3. reasoning: Short explanation (in Chinese)
4. visual: Object defining the visual appearance of the simulation`;

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};

async function handleRequest(request, env) {
  const url = new URL(request.url);
  
  if (url.pathname === '/api/learning/session') {
    return handleLearningSession(request, env);
  }
  if (url.pathname === '/api/learning/knowledge') {
    return handleKnowledgeVisit(request, env);
  }
  if (url.pathname === '/api/learning/example') {
    return handleExampleAttempt(request, env);
  }
  if (url.pathname === '/api/learning/visualization') {
    return handleVisualization(request, env);
  }
  if (url.pathname === '/api/learning/report') {
    return handleGenerateReport(request, env);
  }
  
  if (url.pathname === '/api/parse-problem') {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const description = payload.description || payload.text || '';
    if (!description) {
      return jsonResponse({ error: 'Missing description field' }, 400);
    }

    try {
      const result = await callOpenAI(description, env);
      if (result.parsed && result.parsed.type && result.parsed.params) {
        return jsonResponse({ 
          success: true, 
          type: result.parsed.type, 
          params: result.parsed.params,
          reasoning: result.parsed.reasoning || 'Successfully parsed',
          visual: result.parsed.visual || null
        }, 200);
      } else {
        return jsonResponse({ 
          success: false, 
          error: 'AI response format error', 
          raw: result.raw 
        }, 200);
      }
    } catch (err) {
      return jsonResponse({ success: false, error: 'AI request failed', detail: String(err) }, 502);
    }
  }

  return new Response('Not found', { status: 404 });
}

async function handleLearningSession(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const data = await request.json();
    const { sessionId, studentId, startTime, endTime, totalTime } = data;
    
    if (!sessionId || !startTime) {
      return jsonResponse({ error: 'Missing sessionId or startTime' }, 400);
    }

    const db = env.DB;
    if (!db) {
      return jsonResponse({ error: 'Database not configured' }, 500);
    }

    await db.prepare(`
      INSERT INTO learning_sessions (id, student_id, start_time, end_time, total_time)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        end_time = excluded.end_time,
        total_time = excluded.total_time
    `).bind(sessionId, studentId || null, startTime, endTime || null, totalTime || 0).run();

    return jsonResponse({ success: true, sessionId });
  } catch (err) {
    return jsonResponse({ error: 'Failed to save session', detail: String(err) }, 500);
  }
}

async function handleKnowledgeVisit(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const data = await request.json();
    const { sessionId, knowledgeId, knowledgeName, category, visitCount, totalTime } = data;
    
    if (!sessionId || !knowledgeId) {
      return jsonResponse({ error: 'Missing sessionId or knowledgeId' }, 400);
    }

    const db = env.DB;
    if (!db) {
      return jsonResponse({ error: 'Database not configured' }, 500);
    }

    await db.prepare(`
      INSERT INTO knowledge_visits (session_id, knowledge_id, knowledge_name, category, visit_count, total_time, last_visit)
      VALUES (?, ?, ?, ?, ?, ?, unixepoch())
      ON CONFLICT(session_id, knowledge_id) DO UPDATE SET
        visit_count = visit_count + excluded.visit_count,
        total_time = total_time + excluded.total_time,
        last_visit = unixepoch()
    `).bind(sessionId, knowledgeId, knowledgeName, category || '', visitCount || 1, totalTime || 0).run();

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ error: 'Failed to save knowledge visit', detail: String(err) }, 500);
  }
}

async function handleExampleAttempt(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const data = await request.json();
    const { sessionId, exampleTitle, knowledgePoint, questionType, attempts, totalTime, visualizations } = data;
    
    if (!sessionId || !exampleTitle) {
      return jsonResponse({ error: 'Missing sessionId or exampleTitle' }, 400);
    }

    const db = env.DB;
    if (!db) {
      return jsonResponse({ error: 'Database not configured' }, 500);
    }

    await db.prepare(`
      INSERT INTO example_attempts (session_id, example_title, knowledge_point, question_type, attempts, total_time, visualizations, last_attempt)
      VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
      ON CONFLICT(session_id, example_title) DO UPDATE SET
        attempts = attempts + excluded.attempts,
        total_time = total_time + excluded.total_time,
        visualizations = visualizations + excluded.visualizations,
        last_attempt = unixepoch()
    `).bind(sessionId, exampleTitle, knowledgePoint || '', questionType || '', attempts || 1, totalTime || 0, visualizations || 0).run();

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ error: 'Failed to save example attempt', detail: String(err) }, 500);
  }
}

async function handleVisualization(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const data = await request.json();
    const { sessionId, questionType, params, duration, played } = data;
    
    if (!sessionId || !questionType) {
      return jsonResponse({ error: 'Missing sessionId or questionType' }, 400);
    }

    const db = env.DB;
    if (!db) {
      return jsonResponse({ error: 'Database not configured' }, 500);
    }

    await db.prepare(`
      INSERT INTO visualizations (session_id, question_type, params, duration, played, timestamp)
      VALUES (?, ?, ?, ?, ?, unixepoch())
    `).bind(sessionId, questionType, JSON.stringify(params || {}), duration || 0, played ? 1 : 0).run();

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ error: 'Failed to save visualization', detail: String(err) }, 500);
  }
}

async function handleGenerateReport(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const url = new URL(request.url);
    const reportType = url.searchParams.get('type') || 'teacher';
    const days = parseInt(url.searchParams.get('days') || '7', 10);
    
    const db = env.DB;
    if (!db) {
      return jsonResponse({ error: 'Database not configured' }, 500);
    }

    if (reportType === 'teacher') {
      const cutoffTime = Math.floor(Date.now() / 1000) - (days * 86400);
      
      const studentCount = await db.prepare(`
        SELECT COUNT(DISTINCT id) as total FROM learning_sessions WHERE created_at > ?
      `).bind(cutoffTime).first();
      
      const hotKnowledge = await db.prepare(`
        SELECT knowledge_name, SUM(visit_count) as visits, SUM(kv.total_time) as time
        FROM knowledge_visits kv
        JOIN learning_sessions ls ON kv.session_id = ls.id
        WHERE ls.created_at > ?
        GROUP BY knowledge_name
        ORDER BY visits DESC
        LIMIT 5
      `).bind(cutoffTime).all();
      
      const coldKnowledge = await db.prepare(`
        SELECT knowledge_name, SUM(visit_count) as visits
        FROM knowledge_visits kv
        JOIN learning_sessions ls ON kv.session_id = ls.id
        WHERE ls.created_at > ?
        GROUP BY knowledge_name
        HAVING visits < (SELECT AVG(total_visits) FROM (
          SELECT SUM(visit_count) as total_visits FROM knowledge_visits GROUP BY knowledge_name
        ))
        ORDER BY visits ASC
        LIMIT 5
      `).bind(cutoffTime).all();
      
      const typeStats = await db.prepare(`
        SELECT question_type, COUNT(*) as count
        FROM visualizations v
        JOIN learning_sessions ls ON v.session_id = ls.id
        WHERE ls.created_at > ?
        GROUP BY question_type
        ORDER BY count DESC
      `).bind(cutoffTime).all();
      
      const avgTime = await db.prepare(`
        SELECT AVG(ls.total_time) as avg_time FROM learning_sessions ls WHERE ls.created_at > ?
      `).bind(cutoffTime).first();

      return jsonResponse({
        success: true,
        reportType: 'teacher',
        period: `${days} days`,
        stats: {
          studentCount: studentCount?.total || 0,
          avgStudyTime: Math.round((avgTime?.avg_time || 0) / 1000),
          hotKnowledge: hotKnowledge.results || [],
          coldKnowledge: coldKnowledge.results || [],
          typeDistribution: typeStats.results || []
        },
        generatedAt: new Date().toISOString()
      });
    }
    
    return jsonResponse({ error: 'Unsupported report type' }, 400);
  } catch (err) {
    return jsonResponse({ error: 'Failed to generate report', detail: String(err) }, 500);
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}

function jsonResponse(obj, status = 200) {
  const headers = { 'Content-Type': 'application/json', ...corsHeaders() };
  return new Response(JSON.stringify(obj), { status, headers });
}

async function callOpenAI(description, env) {
  const key = env.OPENAI_API_KEY || env.DEEPSEEK_API_KEY || '';
  if (!key) throw new Error('OPENAI_API_KEY not configured');

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: description }
    ],
    max_tokens: 800,
    temperature: 0.0
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const assistant = data.choices?.[0]?.message?.content || '';

  let parsed = null;
  try {
    const start = assistant.indexOf('{');
    const end = assistant.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const jsonText = assistant.slice(start, end + 1);
      parsed = JSON.parse(jsonText);
    }
  } catch (e) {
    // Parsing failed
  }

  return { raw: assistant, parsed };
}
