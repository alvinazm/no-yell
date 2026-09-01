export const NEGATIVE_KEYWORDS = [
  '怎么这么笨', '烦死了', '说了多少遍', '气死我了', '我不管了',
  '再这样', '打死你', '笨死了', '快点写', '别磨蹭'
];

export function findNegativeKeywords(text: string): string[] {
  const hits = new Set<string>();
  for (const word of NEGATIVE_KEYWORDS) {
    if (text.includes(word)) hits.add(word);
  }
  return [...hits];
}

export const SCRIPTS: Record<'yellow' | 'red', string[]> = {
  yellow: [
    '深呼吸一下,慢慢来',
    '先停一停,抱抱自己',
    '孩子需要的是耐心,不是速度',
    '你已经很努力了,放轻松一点',
    '把这一题放一放,喝口水再说'
  ],
  red: [
    '情绪到临界点了,先离开一分钟',
    '停一下,现在不适合继续讲题',
    '先走开缓一缓,回来再继续',
    '你的情绪正在升高,先做个深呼吸',
    '暂停一下,让孩子也休息一会儿'
  ]
};

export function pickScript(level: 'yellow' | 'red', used: string[]): string {
  const pool = SCRIPTS[level];
  const fresh = pool.filter((s) => !used.includes(s));
  const candidates = fresh.length > 0 ? fresh : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
