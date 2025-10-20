// Cloudflare Worker: backend API for physics-visual
// Exposes POST /api/parse-problem
// Expects JSON { description: string }
// Uses OPENAI_API_KEY (set as a secret) to call OpenAI-compatible API

const SYSTEM_PROMPT = `You are DeepSeek, a specialized parser that converts a natural-language physics problem into a compact JSON structure with fields: type (one of: uniform, projectile, circular, collision, magnetic, astrodynamics), params (object of numeric parameters and units), and reasoning (short explanation). Return only valid JSON.`;

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  // simple router: only handle /api/parse-problem
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
      const result = await callOpenAI(description);
      // Front-end expects: {success: true, type, params, reasoning}
      if (result.parsed && result.parsed.type && result.parsed.params) {
        return jsonResponse({ 
          success: true, 
          type: result.parsed.type, 
          params: result.parsed.params,
          reasoning: result.parsed.reasoning || '已成功解析'
        }, 200);
      } else {
        // OpenAI returned but parsing failed
        return jsonResponse({ 
          success: false, 
          error: 'AI 返回格式不正确', 
          raw: result.raw 
        }, 200);
      }
    } catch (err) {
      // If MOCK_RESPONSE is set (truthy), return a safe mocked parsed result so
      // the front-end can continue to be tested without a working OpenAI call.
      try {
        if (typeof MOCK_RESPONSE !== 'undefined' && MOCK_RESPONSE) {
          const mock = mockParsed(description);
          return jsonResponse({ 
            success: true, 
            type: mock.type, 
            params: mock.params,
            reasoning: mock.reasoning || 'Mock 模式'
          }, 200);
        }
      } catch (e) {
        // ignore mock generation errors and fall through to original error
      }
      return jsonResponse({ success: false, error: 'AI 请求失败', detail: String(err) }, 502);
    }
  }

  return new Response('Not found', { status: 404 });
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

async function callOpenAI(description) {
  // Use secret `OPENAI_API_KEY` (or DEEPSEEK_API_KEY) bound via wrangler secret
  const key = OPENAI_API_KEY || DEEPSEEK_API_KEY || '';
  if (!key) throw new Error('OPENAI_API_KEY not configured');

  // Build a chat completion request (OpenAI-compatible)
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
  // Extract assistant's content (assume first choice)
  const assistant = data.choices?.[0]?.message?.content || '';

  // Try to parse JSON out of assistant content; if assistant included explanation, try to extract JSON block
  let parsed = null;
  try {
    // find first brace
    const start = assistant.indexOf('{');
    const end = assistant.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const jsonText = assistant.slice(start, end + 1);
      parsed = JSON.parse(jsonText);
    }
  } catch (e) {
    // fall through
  }

  // Fallback: return raw assistant text
  return { raw: assistant, parsed };
}

// Mock parser: returns a conservative parsed object for common physics problems.
function mockParsed(description) {
  // very small heuristic: if contains '抛体' or '角度' -> projectile, else default to uniform fall
  const d = (description || '').toLowerCase();
  if (d.includes('抛体') || d.includes('角') || d.includes('角度')) {
    return { type: 'projectile', params: { speed: 10, angle: 45, height: 0 }, reasoning: '检测到抛体关键词，返回示例值。' };
  }
  if (d.includes('圆周') || d.includes('角速度')) {
    return { type: 'circular', params: { radius: 2, angular: 1 }, reasoning: '检测到圆周运动关键词。' };
  }
  // default: uniform motion (free fall) - params should match front-end expectations
  // Front-end expects: v0, a, time for uniform type
  return { 
    type: 'uniform', 
    params: { v0: 0, a: 10, time: 5 }, 
    reasoning: '默认为自由落体（匀变速直线运动）。' 
  };
}
