"""
测试 AI 后端的解析能力
运行方式: python test_api.py
"""
import requests
import json

BACKEND_URL = "http://localhost:5000"

# 测试用例
test_cases = [
    {
        "name": "自由落体",
        "description": "一个物体从10米高处自由下落，求5秒后的速度和位移"
    },
    {
        "name": "平抛运动",
        "description": "一个小球从5米高的平台以10m/s的初速度水平抛出，求落地时间和水平距离"
    },
    {
        "name": "斜抛运动",
        "description": "以20m/s的初速度与水平成45度角向上抛出一个物体"
    },
    {
        "name": "圆周运动",
        "description": "半径为2米的圆周运动，角速度为3 rad/s"
    },
    {
        "name": "碰撞",
        "description": "质量为2kg的物体以5m/s的速度与质量为3kg静止的物体发生弹性碰撞"
    },
    {
        "name": "复杂描述",
        "description": "在一次物理实验中，小明将一个质量为0.5kg的小球从楼顶竖直向上抛出，初速度是15m/s，重力加速度取9.8m/s²，求小球上升的最大高度和回到抛出点时的速度。"
    }
]

def test_parse(description):
    """测试单个解析请求"""
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/parse-problem",
            json={"description": description},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            return result
        else:
            return {"success": False, "error": f"HTTP {response.status_code}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    print("=" * 60)
    print("物理题目 AI 解析测试")
    print("=" * 60)
    
    # 健康检查
    try:
        health = requests.get(f"{BACKEND_URL}/api/health", timeout=5).json()
        print(f"\n✓ 后端服务状态: {health['status']}")
        print(f"✓ API 密钥已配置: {health['api_key_configured']}\n")
    except:
        print("\n✗ 后端服务未启动！请先运行: python server.py\n")
        return
    
    # 运行测试用例
    for i, test in enumerate(test_cases, 1):
        print(f"\n{'='*60}")
        print(f"测试 {i}/{len(test_cases)}: {test['name']}")
        print(f"{'='*60}")
        print(f"题目: {test['description']}\n")
        
        result = test_parse(test['description'])
        
        if result.get('success'):
            print(f"✓ 解析成功")
            print(f"  题型: {result.get('type')}")
            print(f"  参数: {json.dumps(result.get('params'), indent=4, ensure_ascii=False)}")
            if result.get('reasoning'):
                print(f"  推理: {result.get('reasoning')}")
        else:
            print(f"✗ 解析失败: {result.get('error')}")
    
    print(f"\n{'='*60}")
    print("测试完成")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
