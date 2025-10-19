"""
物理可视化平台 - AI 解析后端服务
使用 DeepSeek API 解析自然语言物理题目并提取结构化参数
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from openai import OpenAI
import json

app = Flask(__name__)
CORS(app)  # 允许前端跨域访问

# DeepSeek API 配置
# API key 从环境变量读取（安全做法）
DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY', '')
DEEPSEEK_BASE_URL = "https://api.deepseek.com"

# 初始化 DeepSeek 客户端（使用 OpenAI SDK 兼容接口）
# Python 3.14 兼容：不传递 proxies 等可能不兼容的参数
try:
    client = OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url=DEEPSEEK_BASE_URL,
        timeout=30.0,
        max_retries=2
    )
except TypeError:
    # 如果上面的参数不兼容，使用最简配置
    client = OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url=DEEPSEEK_BASE_URL
    )

# 系统 Prompt：指导 AI 如何提取物理参数
SYSTEM_PROMPT = """你是一个物理题目参数提取专家。用户会输入物理题目描述，你需要识别题目类型并提取关键参数。

**支持的题型：**
1. uniform - 匀变速直线运动（自由落体、竖直上抛、匀加速直线等）
2. projectile - 平抛/抛体运动
3. circular - 圆周运动
4. collision - 碰撞与动量守恒
5. magnetic - 带电粒子在磁场中的运动
6. astrodynamics - 天体运动

**输出格式（严格 JSON）：**
```json
{
  "type": "题型英文代码",
  "params": {
    "v0": 初始速度(m/s, 数字),
    "a": 加速度(m/s², 数字),
    "angle": 角度(度, 数字),
    "height": 高度(m, 数字),
    "radius": 半径(m, 数字),
    "mass": 质量(kg, 数字),
    "time": 时间(s, 数字),
    // 其他参数根据题型添加
  },
  "reasoning": "简短推理过程（可选）"
}
```

**提取规则：**
- 自由落体 → type: "uniform", v0: 0, a: 10（或题目给定的g值）
- 平抛 → type: "projectile", 水平初速度、高度
- 斜抛 → type: "projectile", 初速度、角度
- 竖直上抛 → type: "uniform", v0 > 0, a: -10
- 圆周运动 → type: "circular", 半径、角速度或线速度
- 如果题目没有明确给出某参数但可推理，请给出合理默认值
- 重力加速度默认 10 m/s²，除非题目特别说明

**示例：**
输入："一个小球从10米高处以5m/s的初速度水平抛出"
输出：
```json
{
  "type": "projectile",
  "params": {
    "speed": 5,
    "angle": 0,
    "height": 10
  }
}
```

输入："自由落体运动，5秒后的速度和位移"
输出：
```json
{
  "type": "uniform",
  "params": {
    "v0": 0,
    "a": 10,
    "time": 5
  }
}
```

**注意：只返回 JSON，不要添加任何解释文字。**
"""


@app.route('/api/parse-problem', methods=['POST'])
def parse_problem():
    """
    解析物理题目的 API 端点
    
    请求格式：
    {
      "description": "题目描述文本"
    }
    
    返回格式：
    {
      "success": true,
      "type": "题型",
      "params": {...},
      "reasoning": "推理过程"
    }
    """
    try:
        data = request.get_json()
        description = data.get('description', '').strip()
        
        if not description:
            return jsonify({
                'success': False,
                'error': '题目描述不能为空'
            }), 400
        
        if not DEEPSEEK_API_KEY:
            return jsonify({
                'success': False,
                'error': 'DeepSeek API key 未配置'
            }), 500
        
        # 调用 DeepSeek API
        response = client.chat.completions.create(
            model="deepseek-chat",  # 或 "deepseek-coder" 用于代码相关任务
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"请解析这个物理题目：\n\n{description}"}
            ],
            temperature=0.3,  # 较低温度保证输出稳定
            max_tokens=500,
            response_format={"type": "json_object"}  # 强制返回 JSON
        )
        
        # 提取 AI 返回的 JSON
        ai_result = response.choices[0].message.content
        parsed = json.loads(ai_result)
        
        return jsonify({
            'success': True,
            'type': parsed.get('type', 'uniform'),
            'params': parsed.get('params', {}),
            'reasoning': parsed.get('reasoning', ''),
            'raw_response': ai_result  # 调试用
        })
        
    except json.JSONDecodeError as e:
        return jsonify({
            'success': False,
            'error': f'AI 返回格式错误: {str(e)}',
            'raw_response': ai_result if 'ai_result' in locals() else None
        }), 500
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'解析失败: {str(e)}'
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查端点"""
    return jsonify({
        'status': 'ok',
        'api_key_configured': bool(DEEPSEEK_API_KEY)
    })


if __name__ == '__main__':
    if not DEEPSEEK_API_KEY:
        print("⚠️  警告: DEEPSEEK_API_KEY 环境变量未设置")
        print("   请在启动前设置: set DEEPSEEK_API_KEY=your_api_key_here (Windows)")
        print("   或: export DEEPSEEK_API_KEY=your_api_key_here (Linux/Mac)")
    else:
        print(f"✓ DeepSeek API 已配置 (key: {DEEPSEEK_API_KEY[:8]}...)")
    
    print("\n🚀 后端服务启动在 http://localhost:5000")
    print("   API 端点: POST /api/parse-problem")
    print("   健康检查: GET /api/health\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
