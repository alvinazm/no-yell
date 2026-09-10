export interface EmotionCategory {
  name: string;
  severity: 'red' | 'yellow' | 'green';
  keywords: string[];
  patterns: RegExp[];
  defaultReplacement: string;
  coachTip: string;
}

export const CATEGORIES: Record<string, EmotionCategory> = {
  intellectual_belittling: {
    name: '智力贬低 / 人身打压',
    severity: 'red',
    keywords: [
      '怎么这么笨', '怎么这些笨', '怎么那么笨', '怎么就这么笨', '这么笨', '那么笨',
      '太笨了', '真笨', '笨死了', '笨得可以', '蠢的更猪一样', '蠢的跟猪一样', '蠢得像猪',
      '太蠢了', '真蠢', '蠢死了', '没脑子', '不动脑子', '缺心眼', '白痴', '傻子', '傻瓜', '脑子进水',
      '朽木不可雕', '无可救药', '脑子被门挤了', '不开窍', '弱智'
    ],
    patterns: [
      /(怎么|咋|为什么|怎会).{0,4}(笨|蠢|慢|差|呆)/,
      /(这么|那么|太|真|好|死)(笨|蠢)/,
      /(笨|蠢)(死|透|极)了?/,
      /(蠢|笨)得?(跟|像).+一样/,
      /(动不动|长不长|用不用)脑子/,
      /脑子(里|装的)(是|都)?(什么|浆糊|水|进水)/
    ],
    defaultReplacement: '这道题步骤比较多，我们把题目拆开，一步一步来，你先读第一小问。',
    coachTip: '觉察到您此刻有些焦急。深呼吸一口气，孩子的思维正在建立，我们慢下来。'
  },
  toxic_comparison: {
    name: '横向打压 / 比较否定',
    severity: 'red',
    keywords: [
      '谁都比你强', '你看人家', '别的小孩', '全班就你', '别人家的孩子',
      '人家闭着眼睛都会', '你看看隔壁', '全班倒数', '谁像你这样', '丢人'
    ],
    patterns: [
      /(谁|别人|人家|阿姨家|隔壁)都比你/,
      /全(班|校|年级)就你/,
      /你看(看)?(人家|别人|隔壁)/,
      /没有一个像你/
    ],
    defaultReplacement: '只要比昨天的自己有进步就好啦，告诉爸爸/妈妈哪一步卡住了？',
    coachTip: '横向比较容易激起逆反与自卑。多关注孩子具体的一小步进展。'
  },
  impatience_venting: {
    name: '急躁发泄 / 放弃式指责',
    severity: 'yellow',
    keywords: [
      '说了多少遍', '讲了多少次', '教了多少遍', '气死我了', '烦死了',
      '我不管你了', '到底懂不懂', '怎么又错', '给我重写', '爱写不写',
      '听不听得懂', '讲不通', '不想教了'
    ],
    patterns: [
      /(讲|说|教|强调)了(多少|好几|几|无数)遍/,
      /到底(懂不懂|听不听|会不会)/,
      /(气|烦|急)死我了/,
      /怎么又(错|不会)/
    ],
    defaultReplacement: '可能我刚才讲的方法不够直观，我们换个画图或者生活例子再看一遍。',
    coachTip: '重复多次未懂往往说明认知跨度过大，换个讲解比喻会柳暗花明。'
  },
  threat_pressure: {
    name: '施压威吓 / 催促焦虑',
    severity: 'yellow',
    keywords: [
      '快点写', '别磨蹭', '再错一下试试', '皮痒了', '欠揍', '打死你',
      '磨蹭什么', '坐好别动', '再玩一下看看', '收起你的眼泪'
    ],
    patterns: [
      /再(错|磨蹭|哭).+试试/,
      /(快点|赶紧)(写|做|算|看)/,
      /(皮|骨头)痒/
    ],
    defaultReplacement: '我们定个 10 分钟小番茄钟，做完这两题就休息 3 分钟吃点水果。',
    coachTip: '催促容易引发孩子大脑的战斗/逃跑反应导致卡壳。小任务切分更有动力。'
  }
};

export const EXACT_REPLACEMENTS: Record<string, string> = {
  '怎么这么笨': '“这道题步骤比较多，我们把它拆成两小步，你先看第一步已知什么？”',
  '怎么这些笨': '“这道题步骤比较多，我们把它拆成两小步，你先看第一步已知什么？”',
  '蠢的更猪一样': '“先停下来喝口水，深呼吸一下，我们换个画图的思路。”',
  '蠢的跟猪一样': '“先停下来喝口水，深呼吸一下，我们换个画图的思路。”',
  '谁都比你强': '“每个孩子擅长的节奏不一样，只要你今天搞懂这一题，你就比昨天更棒。”',
  '说了多少遍': '“看来这个概念容易让人混淆，妈妈/爸爸重新给你打个比方。”',
  '气死我了': '“我们俩都先闭眼深呼吸 3 次，调整一下，不着急。”',
  '我不管你了': '“我先离开书桌两分钟喝口水，你慢慢读一遍题目，待会我们一起看。”',
  '快点写': '“我们集中精力攻克这一道，完成后给你盖个努力印章！”'
};

export interface NlpAnalysisResult {
  hasNegative: boolean;
  level: 'green' | 'yellow' | 'red';
  score: number;
  category: string | null;
  categoryName: string;
  matchedPhrases: string[];
  replacementSuggestion: string;
  coachTip: string;
  currentDb: number;
  text: string;
}

export function analyzeSpeechContent(text: string, currentDb: number = 0): NlpAnalysisResult {
  if (!text || !text.trim()) {
    return {
      hasNegative: false,
      level: 'green',
      score: 0,
      matchedPhrases: [],
      category: null,
      categoryName: '平和交流',
      replacementSuggestion: '保持温和耐心的语调，当前交流状态良好。',
      coachTip: '孩子在温和支持的环境中学习效率最高。',
      currentDb,
      text: ''
    };
  }

  const cleanText = text.trim();
  const matchedPhrases = new Set<string>();
  let hitCategoryKey: string | null = null;
  let highestSeverity: 'green' | 'yellow' | 'red' = 'green';

  for (const [catKey, catInfo] of Object.entries(CATEGORIES)) {
    let catHit = false;

    for (const kw of catInfo.keywords) {
      if (cleanText.includes(kw)) {
        matchedPhrases.add(kw);
        catHit = true;
      }
    }

    for (const pattern of catInfo.patterns) {
      const match = cleanText.match(pattern);
      if (match) {
        matchedPhrases.add(match[0]);
        catHit = true;
      }
    }

    if (catHit) {
      if (!hitCategoryKey || catInfo.severity === 'red') {
        hitCategoryKey = catKey;
        highestSeverity = catInfo.severity;
      }
    }
  }

  let replacement: string | null = null;
  for (const phrase of matchedPhrases) {
    if (EXACT_REPLACEMENTS[phrase]) {
      replacement = EXACT_REPLACEMENTS[phrase];
      break;
    }
  }

  const categoryData = hitCategoryKey ? CATEGORIES[hitCategoryKey] : null;
  if (!replacement) {
    if (categoryData) {
      replacement = categoryData.defaultReplacement;
    } else {
      replacement = '“我们慢慢来，深呼吸，孩子需要的是支持而不是指责。”';
    }
  }

  const coachTip = categoryData ? categoryData.coachTip : '保持温和耐心的辅导氛围。';
  const categoryName = categoryData ? categoryData.name : '平和沟通';

  const dbTension = Math.max(0, Math.min(60, (currentDb - 45) * 1.5));
  let textTension = 0;
  if (highestSeverity === 'red') {
    textTension = 50;
  } else if (highestSeverity === 'yellow') {
    textTension = 30;
  }

  const totalScore = Math.min(100, Math.round(dbTension + textTension));

  let finalLevel: 'green' | 'yellow' | 'red' = 'green';
  if (totalScore >= 65 || highestSeverity === 'red' || currentDb >= 80) {
    finalLevel = 'red';
  } else if (totalScore >= 40 || highestSeverity === 'yellow' || currentDb >= 70) {
    finalLevel = 'yellow';
  }

  return {
    hasNegative: matchedPhrases.size > 0,
    level: finalLevel,
    score: totalScore,
    category: hitCategoryKey,
    categoryName,
    matchedPhrases: Array.from(matchedPhrases).sort(),
    replacementSuggestion: replacement,
    coachTip,
    currentDb,
    text: cleanText
  };
}
