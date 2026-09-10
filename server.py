import re
import time
from typing import List, Dict, Optional, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Parent Tutoring Emotion Monitor API",
    description="Python FastAPI 后端：实时家长辅导情绪与负面语言识别引擎",
    version="1.0.0"
)

# 允许跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# 负面语言分类规则与知识库配置
# -------------------------------------------------------------

CATEGORIES: Dict[str, Dict[str, Any]] = {
    "intellectual_belittling": {
        "name": "智力贬低 / 人身打压",
        "severity": "red",
        "keywords": [
            "怎么这么笨", "笨死了", "笨", "蠢的更猪一样", "蠢的跟猪一样", "蠢得像猪",
            "蠢", "没脑子", "缺心眼", "白痴", "傻子", "傻瓜", "脑子进水",
            "朽木不可雕", "无可救药", "脑子被门挤了", "不开窍", "弱智"
        ],
        "patterns": [
            re.compile(r"怎么(这么|那么)?(笨|蠢|慢|差|呆)"),
            re.compile(r"(蠢|笨)得?(跟|像).+一样"),
            re.compile(r"(动不动|长不长)脑子"),
            re.compile(r"脑子(里|装的)(是|都)?(什么|浆糊|水)")
        ],
        "default_replacement": "这道题步骤比较多，我们把题目拆开，一步一步来，你先读第一小问。",
        "coach_tip": "觉察到您此刻有些焦急。深呼吸一口气，孩子的思维正在建立，我们慢下来。"
    },
    "toxic_comparison": {
        "name": "横向打压 / 比较否定",
        "severity": "red",
        "keywords": [
            "谁都比你强", "你看人家", "别的小孩", "全班就你", "别人家的孩子",
            "人家闭着眼睛都会", "你看看隔壁", "全班倒数", "谁像你这样", "丢人"
        ],
        "patterns": [
            re.compile(r"(谁|别人|人家|阿姨家|隔壁)都比你"),
            re.compile(r"全(班|校|年级)就你"),
            re.compile(r"你看(看)?(人家|别人|隔壁)"),
            re.compile(r"没有一个像你")
        ],
        "default_replacement": "只要比昨天的自己有进步就好啦，告诉爸爸/妈妈哪一步卡住了？",
        "coach_tip": "横向比较容易激起逆反与自卑。多关注孩子具体的一小步进展。"
    },
    "impatience_venting": {
        "name": "急躁发泄 / 放弃式指责",
        "severity": "yellow",
        "keywords": [
            "说了多少遍", "讲了多少次", "教了多少遍", "气死我了", "烦死了",
            "我不管你了", "到底懂不懂", "怎么又错", "重写", "爱写不写",
            "听不听得懂", "讲不通", "不想教了"
        ],
        "patterns": [
            re.compile(r"(讲|说|教|强调)了(多少|好几|几|无数)遍"),
            re.compile(r"到底(懂不懂|听不听|会不会)"),
            re.compile(r"(气|烦|急)死我了"),
            re.compile(r"怎么又(错|不会)")
        ],
        "default_replacement": "可能我刚才讲的方法不够直观，我们换个画图或者生活例子再看一遍。",
        "coach_tip": "重复多次未懂往往说明认知跨度过大，换个讲解比喻会柳暗花明。"
    },
    "threat_pressure": {
        "name": "施压威吓 / 催促焦虑",
        "severity": "yellow",
        "keywords": [
            "快点写", "别磨蹭", "再错一下试试", "皮痒了", "欠揍", "打死你",
            "磨蹭什么", "坐好别动", "再玩一下看看", "收起你的眼泪"
        ],
        "patterns": [
            re.compile(r"再(错|磨蹭|哭).+试试"),
            re.compile(r"(快点|赶紧)(写|做|算|看)"),
            re.compile(r"(皮|骨头)痒")
        ],
        "default_replacement": "我们定个 10 分钟小番茄钟，做完这两题就休息 3 分钟吃点水果。",
        "coach_tip": "催促容易引发孩子大脑的战斗/逃跑反应导致卡壳。小任务切分更有动力。"
    }
}

# 细分关键词对应更精确的温和替代建议
EXACT_REPLACEMENTS: Dict[str, str] = {
    "怎么这么笨": "“这道题步骤比较多，我们把它拆成两小步，你先看第一步已知什么？”",
    "蠢的更猪一样": "“先停下来喝口水，深呼吸一下，我们换个画图的思路。”",
    "蠢的跟猪一样": "“先停下来喝口水，深呼吸一下，我们换个画图的思路。”",
    "谁都比你强": "“每个孩子擅长的节奏不一样，只要你今天搞懂这一题，你就比昨天更棒。”",
    "说了多少遍": "“看来这个概念容易让人混淆，妈妈/爸爸重新给你打个比方。”",
    "气死我了": "“我们俩都先闭眼深呼吸 3 次，调整一下，不着急。”",
    "我不管你了": "“我先离开书桌两分钟喝口水，你慢慢读一遍题目，待会我们一起看。”",
    "快点写": "“我们集中精力攻克这一道，完成后给你盖个努力印章！”",
}


# -------------------------------------------------------------
# 核心分析函数
# -------------------------------------------------------------

def analyze_speech_content(text: str, current_db: float = 0.0) -> Dict[str, Any]:
    """
    Python NLP 核心分析器：
    1. 快速精准匹配关键词库
    2. 匹配句式正则规则群
    3. 匹配教育心理学平和替代话术
    4. 结合当前分贝值输出多模态综合张力评分
    """
    if not text or not text.strip():
        return {
            "has_negative": False,
            "level": "green",
            "score": 0,
            "matched_phrases": [],
            "category": None,
            "category_name": "平和交流",
            "replacement_suggestion": "保持温和耐心的语调，当前交流状态良好。",
            "coach_tip": "孩子在温和支持的环境中学习效率最高。"
        }

    clean_text = text.strip()
    matched_phrases = set()
    hit_category_key = None
    highest_severity = "green"

    # 1. 遍历四大家长负面情绪分类
    for cat_key, cat_info in CATEGORIES.items():
        cat_hit = False

        # 关键词匹配
        for kw in cat_info["keywords"]:
            if kw in clean_text:
                matched_phrases.add(kw)
                cat_hit = True

        # 正则句式匹配
        for pattern in cat_info["patterns"]:
            match = pattern.search(clean_text)
            if match:
                matched_phrases.add(match.group(0))
                cat_hit = True

        if cat_hit:
            if not hit_category_key or cat_info["severity"] == "red":
                hit_category_key = cat_key
                highest_severity = cat_info["severity"]

    # 2. 匹配最贴合的平替话术
    replacement = None
    for phrase in matched_phrases:
        if phrase in EXACT_REPLACEMENTS:
            replacement = EXACT_REPLACEMENTS[phrase]
            break

    category_data = CATEGORIES.get(hit_category_key) if hit_category_key else None
    if not replacement:
        if category_data:
            replacement = category_data["default_replacement"]
        else:
            replacement = "“我们慢慢来，深呼吸，孩子需要的是支持而不是指责。”"

    coach_tip = category_data["coach_tip"] if category_data else "保持温和耐心的辅导氛围。"
    category_name = category_data["name"] if category_data else "平和沟通"

    # 3. 结合音量分贝进行多模态张力打分 (0 ~ 100)
    # 分贝基准: 40dB以下=0分, 75dB=30分, 85dB=60分
    db_tension = max(0.0, min(60.0, (current_db - 45.0) * 1.5))
    text_tension = 0.0
    if highest_severity == "red":
        text_tension = 50.0
    elif highest_severity == "yellow":
        text_tension = 30.0

    total_score = min(100, int(db_tension + text_tension))

    # 判定最终等级
    if total_score >= 65 or highest_severity == "red" or current_db >= 80:
        final_level = "red"
    elif total_score >= 40 or highest_severity == "yellow" or current_db >= 70:
        final_level = "yellow"
    else:
        final_level = "green"

    has_negative = len(matched_phrases) > 0

    return {
        "has_negative": has_negative,
        "level": final_level,
        "score": total_score,
        "category": hit_category_key,
        "category_name": category_name,
        "matched_phrases": sorted(list(matched_phrases)),
        "replacement_suggestion": replacement,
        "coach_tip": coach_tip,
        "current_db": current_db,
        "text": clean_text
    }


# -------------------------------------------------------------
# REST API 请求与响应结构
# -------------------------------------------------------------

class SpeechAnalysisRequest(BaseModel):
    text: str
    current_db: Optional[float] = 0.0
    session_id: Optional[str] = None
    is_final: Optional[bool] = False


@app.get("/api/health")
def health_check():
    """健康探测接口"""
    return {
        "status": "ok",
        "backend": "Python FastAPI",
        "version": "1.0.0",
        "capabilities": [
            "realtime_nlp_speech_monitoring",
            "regex_pattern_matching",
            "positive_replacement_generation",
            "multimodal_db_fusion"
        ]
    }


@app.get("/api/rules")
def get_rules():
    """获取服务端维护的负面语言分类规则与知识库信息"""
    summary = {}
    for k, v in CATEGORIES.items():
        summary[k] = {
            "name": v["name"],
            "severity": v["severity"],
            "keyword_count": len(v["keywords"]),
            "sample_keywords": v["keywords"][:6],
            "default_replacement": v["default_replacement"],
            "coach_tip": v["coach_tip"]
        }
    return {
        "categories": summary,
        "total_categories": len(CATEGORIES),
        "exact_replacements": EXACT_REPLACEMENTS
    }


@app.post("/api/analyze-speech")
def analyze_speech_api(req: SpeechAnalysisRequest):
    """单次语音识别文本与分贝联合分析"""
    result = analyze_speech_content(req.text, req.current_db or 0.0)
    result["timestamp"] = time.time()
    result["is_final"] = req.is_final
    result["session_id"] = req.session_id
    return result


# -------------------------------------------------------------
# WebSocket 实时双向通信端点
# -------------------------------------------------------------

@app.websocket("/ws/monitor")
async def websocket_monitor_endpoint(websocket: WebSocket):
    """
    WebSocket 双向长连接：
    - 接收前端音频识别中间片段 (Interim) 与当前分贝
    - 毫秒级返回实时负面预警和积极平替话术
    """
    await websocket.accept()
    # 连接成功发送初始化确认
    await websocket.send_json({
        "type": "connected",
        "message": "Python FastAPI 情绪监控引擎已就绪",
        "timestamp": time.time()
    })

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "speech_input")

            if msg_type == "ping":
                await websocket.send_json({"type": "pong", "timestamp": time.time()})
                continue

            text = data.get("text", "")
            current_db = float(data.get("currentDb", data.get("current_db", 0.0)))
            is_final = bool(data.get("isFinal", data.get("is_final", False)))

            # 执行实时 Python NLP 分析
            analysis = analyze_speech_content(text, current_db)

            # 封装响应下发
            response_payload = {
                "type": "emotion_alert" if analysis["has_negative"] or analysis["level"] != "green" else "emotion_status",
                "hasNegative": analysis["has_negative"],
                "level": analysis["level"],
                "score": analysis["score"],
                "category": analysis["category"],
                "categoryName": analysis["category_name"],
                "matchedPhrases": analysis["matched_phrases"],
                "replacementSuggestion": analysis["replacement_suggestion"],
                "coachTip": analysis["coach_tip"],
                "currentDb": current_db,
                "text": text,
                "isFinal": is_final,
                "timestamp": time.time()
            }

            await websocket.send_json(response_payload)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"Python 服务端分析异常: {str(e)}"
            })
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn
    import os
    # 本地或子进程启动服务
    port = int(os.environ.get("PYTHON_PORT", 5000))
    print(f"Starting Python Emotion Monitor API on 0.0.0.0:{port}...")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
