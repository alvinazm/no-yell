# 「和颜悦色」家长情绪监测 PWA 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个完全本地运行的 PWA,家长辅导作业时选择麦克风/摄像头/双开模式,实时分析情绪、温和提醒,结束后生成五项指标复盘报告。

**Architecture:** React 单页应用,`useSession` 协调会话状态,`useAudioMonitor`(Web Audio 分贝 + Web Speech 关键词)与 `useVideoMonitor`(MediaPipe 表情)把实时特征交给纯函数 `emotionEngine` 融合成紧张度;超过阈值触发 `speech` 播报;结束由 `scoring` 算分,`storage` 存 localStorage。

**Tech Stack:** Vite 5 + React 18 + TypeScript 5 + Vitest 2 + @mediapipe/tasks-vision + vite-plugin-pwa。所有分析在设备本地完成,无后端、无 API key。

**Spec:** `docs/superpowers/specs/2026-09-01-parent-emotion-monitor-design.md`

## Global Constraints

- 所有音视频数据只做实时分析,不录制、不保存、不上传。
- 阈值与算法逐字取自 spec:黄色提醒紧张度 60-79,红色 ≥80;冷却 30 秒;双开融合音频 ×0.6 + 视频 ×0.4;音频紧张度 60dB≈0、75dB≈50、85dB≈100,骤升 +15、关键词 +30、封顶 100;视频紧张度 = brow×40 + mouth×30 + head×30。
- 情绪得分:100 起,黄 -3、红 -8、平均分贝 >65dB 每满 5dB -2、≥85dB 冲击 -1、下限 20、时长 <5 分钟扣分减半;评级 ≥85 优秀 / 70-84 良好 / 50-69 需要留意 / <50 需要休息。
- UI 文案全部使用中文;产品工作名「和颜悦色」,包名 `calm-tutor`。
- 每个任务结束必须跑通验证步骤并单独提交一个 commit。
- 视频/音频降级:语音识别不可用 → 仅分贝;MediaPipe 加载失败 → 仅音频;权限拒绝 → 返回模式选择页并提示。

---

## 文件结构总览

```
package.json / vite.config.ts / tsconfig.json / index.html
public/icon.svg
src/main.tsx / src/App.tsx / src/index.css
src/types.ts
src/lib/emotionEngine.ts            # 纯函数:分贝映射、紧张度、融合、平滑、阈值、冷却
src/lib/speech.ts                   # 负面关键词匹配 + 播报话术库
src/lib/scoring.ts                  # 情绪得分与评级
src/lib/storage.ts                  # localStorage 会话摘要
src/hooks/useAudioMonitor.ts        # 麦克风:分贝采样 + 语音转写关键词
src/hooks/useVideoMonitor.ts        # 摄像头:MediaPipe 表情特征
src/hooks/useSession.ts             # 会话状态机 + 统计汇总
src/components/ModeSelector.tsx     # 首页模式选择
src/components/MonitorView.tsx      # 监测页
src/components/ReminderOverlay.tsx  # 提醒气泡
src/components/ResultsView.tsx      # 结果页
src/lib/*.test.ts                   # 对应纯逻辑测试
```

---

### Task 1:项目脚手架

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `public/icon.svg`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/lib/smoke.test.ts`, `.gitignore`

**Interfaces:**
- Produces: 可运行的空 PWA 骨架;`src/App.tsx` 渲染占位标题;Vitest 可用。

- [ ] **Step 1:写脚手架文件**

`package.json`:
```json
{
  "name": "calm-tutor",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@mediapipe/tasks-vision": "^0.10.14",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.6.3",
    "vite": "^5.4.11",
    "vite-plugin-pwa": "^0.21.1",
    "vitest": "^2.1.8"
  }
}
```

`vite.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: '和颜悦色',
        short_name: '和颜悦色',
        description: 'AI 家长情绪监测助手',
        theme_color: '#4CAF82',
        background_color: '#F7F9F7',
        display: 'standalone',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
      }
    })
  ],
  test: { environment: 'node' }
});
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "vite.config.ts"]
}
```

`index.html`:
```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#4CAF82" />
    <title>和颜悦色 - AI 家长情绪监测助手</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`public/icon.svg`(圆形笑脸徽标,主色 #4CAF82):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <circle cx="256" cy="256" r="240" fill="#4CAF82"/>
  <circle cx="176" cy="216" r="28" fill="#ffffff"/>
  <circle cx="336" cy="216" r="28" fill="#ffffff"/>
  <path d="M160 300 Q256 392 352 300" stroke="#ffffff" stroke-width="28" fill="none" stroke-linecap="round"/>
</svg>
```

`src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`src/App.tsx`:
```tsx
export default function App() {
  return (
    <main className="app">
      <h1>和颜悦色</h1>
      <p>AI 家长情绪监测助手</p>
    </main>
  );
}
```

`src/index.css`(全局基础样式,后续任务复用 class):
```css
:root {
  --green: #4CAF82;
  --yellow: #E8B33A;
  --red: #D95F4C;
  --bg: #F7F9F7;
  --text: #24352D;
  --muted: #6B7F75;
  --card: #ffffff;
  --radius: 16px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  background: var(--bg);
  color: var(--text);
}
.app { max-width: 640px; margin: 0 auto; padding: 24px 16px 48px; }
.card {
  background: var(--card);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: 0 2px 12px rgba(36, 53, 45, 0.08);
}
.btn {
  border: none;
  border-radius: 999px;
  padding: 14px 28px;
  font-size: 16px;
  cursor: pointer;
  background: var(--green);
  color: #fff;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn.secondary { background: #eef3f0; color: var(--text); }
.muted { color: var(--muted); }
```

`.gitignore`:
```
node_modules
dist
.DS_Store
```

- [ ] **Step 2:安装依赖**

Run: `npm install`
Expected: 安装成功,无 peer 冲突。

- [ ] **Step 3:写 smoke 测试**

`src/lib/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('test runner works', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4:跑测试与构建**

Run: `npm test`
Expected: PASS,1 个测试通过。

Run: `npm run build`
Expected: 构建成功,`dist/` 生成,包含 `manifest.webmanifest`。

- [ ] **Step 5:提交**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json index.html public src .gitignore
git commit -m "feat: 脚手架 - Vite + React + TS + Vitest + PWA 配置"
```

---

### Task 2:类型定义 + 情绪引擎(纯逻辑)

**Files:**
- Create: `src/types.ts`, `src/lib/emotionEngine.ts`, `src/lib/emotionEngine.test.ts`

**Interfaces:**
- Consumes: 无。
- Produces:
  - `types.ts`: `MonitorMode = 'audio' | 'video' | 'both'`;`SessionStatus = 'idle' | 'monitoring' | 'finished'`;`TensionLevel = 'green' | 'yellow' | 'red'`;`VideoFeatures { browTension: number; mouthTension: number; headMotion: number }`;`AudioMetrics { currentDb: number; avgDb: number; spikeCount: number; keywordHits: string[] }`;`AlertEvent { level: 'yellow' | 'red'; tension: number; at: number }`;`SessionSummary { id: string; mode: MonitorMode; startedAt: number; durationSec: number; avgDb: number | null; videoAnomalyCount: number; alertCount: number; score: number; grade: string }`。
  - `emotionEngine.ts`: `COOLDOWN_MS = 30_000`;`YELLOW_THRESHOLD = 60`;`RED_THRESHOLD = 80`;`dbToTension(db: number): number`;`calculateAudioTension(currentDb: number, spikeCount: number, keywordHit: boolean): number`;`calculateVideoTension(features: VideoFeatures): number`;`fuseTensions(audio: number | null, video: number | null): number`;`smooth(values: number[]): number`;`levelForTension(tension: number): TensionLevel`;`canAlert(level: TensionLevel, lastAlertAt: number | null, now: number): boolean`。

- [ ] **Step 1:写失败测试**

`src/lib/emotionEngine.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  dbToTension, calculateAudioTension, calculateVideoTension,
  fuseTensions, smooth, levelForTension, canAlert,
  COOLDOWN_MS, YELLOW_THRESHOLD, RED_THRESHOLD
} from './emotionEngine';

describe('dbToTension', () => {
  it('maps spec anchor points', () => {
    expect(dbToTension(60)).toBe(0);
    expect(dbToTension(75)).toBe(50);
    expect(dbToTension(85)).toBe(100);
  });
  it('clamps below 60 and above 85', () => {
    expect(dbToTension(40)).toBe(0);
    expect(dbToTension(95)).toBe(100);
  });
});

describe('calculateAudioTension', () => {
  it('adds 15 per spike, capped at 100', () => {
    expect(calculateAudioTension(75, 1, false)).toBe(65);
    expect(calculateAudioTension(75, 4, false)).toBe(100);
  });
  it('adds 30 for keyword hit once', () => {
    expect(calculateAudioTension(60, 0, true)).toBe(30);
  });
});

describe('calculateVideoTension', () => {
  it('combines features with spec weights', () => {
    expect(calculateVideoTension({ browTension: 1, mouthTension: 0, headMotion: 0 })).toBe(40);
    expect(calculateVideoTension({ browTension: 0, mouthTension: 0.5, headMotion: 0.5 })).toBe(30);
  });
});

describe('fuseTensions', () => {
  it('uses single channel directly', () => {
    expect(fuseTensions(70, null)).toBe(70);
    expect(fuseTensions(null, 70)).toBe(70);
  });
  it('mixes 0.6 audio / 0.4 video', () => {
    expect(fuseTensions(100, 50)).toBe(80);
  });
});

describe('smooth', () => {
  it('returns average of window', () => {
    expect(smooth([10, 20, 30])).toBe(20);
  });
  it('returns latest value for empty window', () => {
    expect(smooth([])).toBe(0);
  });
});

describe('levelForTension', () => {
  it('maps thresholds', () => {
    expect(levelForTension(50)).toBe('green');
    expect(levelForTension(YELLOW_THRESHOLD)).toBe('yellow');
    expect(levelForTension(RED_THRESHOLD)).toBe('red');
  });
});

describe('canAlert', () => {
  it('allows alert after cooldown', () => {
    expect(canAlert('yellow', null, 1000)).toBe(true);
    expect(canAlert('yellow', 1000, 1000 + COOLDOWN_MS)).toBe(true);
    expect(canAlert('yellow', 1000, 1000 + COOLDOWN_MS - 1)).toBe(false);
  });
});
```

- [ ] **Step 2:跑测试确认失败**

Run: `npm test -- src/lib/emotionEngine.test.ts`
Expected: FAIL,模块不存在。

- [ ] **Step 3:实现**

`src/types.ts`:
```ts
export type MonitorMode = 'audio' | 'video' | 'both';
export type SessionStatus = 'idle' | 'monitoring' | 'finished';
export type TensionLevel = 'green' | 'yellow' | 'red';

export interface VideoFeatures {
  browTension: number;   // 0-1
  mouthTension: number;  // 0-1
  headMotion: number;    // 0-1
}

export interface AudioMetrics {
  currentDb: number;
  avgDb: number;
  spikeCount: number;
  keywordHits: string[];
}

export interface AlertEvent {
  level: 'yellow' | 'red';
  tension: number;
  at: number;
}

export interface SessionSummary {
  id: string;
  mode: MonitorMode;
  startedAt: number;
  durationSec: number;
  avgDb: number | null;
  videoAnomalyCount: number;
  alertCount: number;
  score: number;
  grade: string;
}
```

`src/lib/emotionEngine.ts`:
```ts
import type { TensionLevel, VideoFeatures } from '../types';

export const COOLDOWN_MS = 30_000;
export const YELLOW_THRESHOLD = 60;
export const RED_THRESHOLD = 80;

export function dbToTension(db: number): number {
  if (db <= 60) return 0;
  if (db >= 85) return 100;
  return ((db - 60) / 25) * 100;
}

export function calculateAudioTension(
  currentDb: number,
  spikeCount: number,
  keywordHit: boolean
): number {
  let t = dbToTension(currentDb) + spikeCount * 15 + (keywordHit ? 30 : 0);
  return Math.min(100, Math.max(0, t));
}

export function calculateVideoTension(features: VideoFeatures): number {
  return Math.min(
    100,
    Math.max(0, features.browTension * 40 + features.mouthTension * 30 + features.headMotion * 30)
  );
}

export function fuseTensions(audio: number | null, video: number | null): number {
  if (audio === null && video === null) return 0;
  if (audio === null) return video!;
  if (video === null) return audio;
  return audio * 0.6 + video * 0.4;
}

export function smooth(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function levelForTension(tension: number): TensionLevel {
  if (tension >= RED_THRESHOLD) return 'red';
  if (tension >= YELLOW_THRESHOLD) return 'yellow';
  return 'green';
}

export function canAlert(
  level: TensionLevel,
  lastAlertAt: number | null,
  now: number
): boolean {
  if (level === 'green') return false;
  if (lastAlertAt === null) return true;
  return now - lastAlertAt >= COOLDOWN_MS;
}
```

- [ ] **Step 4:跑测试确认通过**

Run: `npm test -- src/lib/emotionEngine.test.ts`
Expected: PASS,10 个测试通过。

- [ ] **Step 5:提交**

```bash
git add src/types.ts src/lib/emotionEngine.ts src/lib/emotionEngine.test.ts
git commit -m "feat: 情绪引擎 - 分贝映射、双通道融合、阈值与冷却"
```

---

### Task 3:负面关键词 + 播报话术库

**Files:**
- Create: `src/lib/speech.ts`, `src/lib/speech.test.ts`

**Interfaces:**
- Consumes: 无(独立)。
- Produces: `NEGATIVE_KEYWORDS: string[]`;`findNegativeKeywords(text: string): string[]`(返回命中的关键词,去重);`pickScript(level: 'yellow' | 'red', used: string[]): string`(从对应话术库轮换,`used` 内已用过的优先跳过)。

- [ ] **Step 1:写失败测试**

`src/lib/speech.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { findNegativeKeywords, pickScript } from './speech';

describe('findNegativeKeywords', () => {
  it('finds matched keywords and dedupes', () => {
    const hits = findNegativeKeywords('怎么这么笨!烦死了,说了多少遍!');
    expect(hits).toEqual(expect.arrayContaining(['怎么这么笨', '烦死了', '说了多少遍']));
  });
  it('returns empty when nothing matches', () => {
    expect(findNegativeKeywords('我们慢慢来,这道题再想想')).toEqual([]);
  });
});

describe('pickScript', () => {
  it('prefers unused scripts and cycles when exhausted', () => {
    const first = pickScript('yellow', []);
    const second = pickScript('yellow', [first]);
    expect(second).not.toBe(first);
    const recycled = pickScript('yellow', ['全部用过的占位']);
    expect(['深呼吸一下,慢慢来', '先停一停,抱抱自己']).not.toContain(recycled);
    expect(typeof recycled).toBe('string');
  });
});
```

- [ ] **Step 2:跑测试确认失败**

Run: `npm test -- src/lib/speech.test.ts`
Expected: FAIL,模块不存在。

- [ ] **Step 3:实现**

`src/lib/speech.ts`:
```ts
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

const SCRIPTS: Record<'yellow' | 'red', string[]> = {
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
```

- [ ] **Step 4:跑测试确认通过**

Run: `npm test -- src/lib/speech.test.ts`
Expected: PASS,2 个测试通过。

- [ ] **Step 5:提交**

```bash
git add src/lib/speech.ts src/lib/speech.test.ts
git commit -m "feat: 负面关键词匹配与分级播报话术库"
```

---

### Task 4:情绪得分与评级

**Files:**
- Create: `src/lib/scoring.ts`, `src/lib/scoring.test.ts`

**Interfaces:**
- Consumes: `SessionSummary`(types.ts)。
- Produces: `ScoreInput { yellowAlerts: number; redAlerts: number; avgDb: number | null; spikeCount: number; durationSec: number }`;`SessionMetrics { durationSec: number; avgDb: number | null; videoAnomalyCount: number; alertCount: number; score: number; grade: string }`;`calculateScore(input: ScoreInput, videoAnomalyCount: number): SessionMetrics`。

- [ ] **Step 1:写失败测试**

`src/lib/scoring.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { calculateScore } from './scoring';

describe('calculateScore', () => {
  it('starts at 100 for a calm session', () => {
    const r = calculateScore({ yellowAlerts: 0, redAlerts: 0, avgDb: 55, spikeCount: 0, durationSec: 600 }, 0);
    expect(r.score).toBe(100);
    expect(r.grade).toBe('优秀');
  });
  it('deducts per alert', () => {
    const r = calculateScore({ yellowAlerts: 2, redAlerts: 1, avgDb: 55, spikeCount: 0, durationSec: 600 }, 0);
    expect(r.score).toBe(86);
  });
  it('deducts for loud average db', () => {
    const r = calculateScore({ yellowAlerts: 0, redAlerts: 0, avgDb: 75, spikeCount: 0, durationSec: 600 }, 0);
    expect(r.score).toBe(96);
  });
  it('deducts per spike and floors at 20', () => {
    const r = calculateScore({ yellowAlerts: 10, redAlerts: 10, avgDb: 95, spikeCount: 10, durationSec: 600 }, 0);
    expect(r.score).toBe(20);
  });
  it('halves deductions under 5 minutes', () => {
    const r = calculateScore({ yellowAlerts: 2, redAlerts: 0, avgDb: 55, spikeCount: 0, durationSec: 200 }, 0);
    expect(r.score).toBe(97);
  });
  it('reports all metrics', () => {
    const r = calculateScore({ yellowAlerts: 1, redAlerts: 0, avgDb: 60, spikeCount: 2, durationSec: 600 }, 3);
    expect(r).toMatchObject({
      durationSec: 600, avgDb: 60, videoAnomalyCount: 3,
      alertCount: 1, grade: '优秀'
    });
  });
});
```

算分口径说明(与 spec 一致):黄 -3、红 -8;平均分贝超过 65dB 后每满 5dB -2(75dB → 10dB 超出 → 满 5dB 两档 → -4,测试断言 96);≥85dB 冲击每次 -1;时长 <300 秒时上述扣分合计减半,再取下限 20。

- [ ] **Step 2:跑测试确认失败**

Run: `npm test -- src/lib/scoring.test.ts`
Expected: FAIL,模块不存在。

- [ ] **Step 3:实现**

`src/lib/scoring.ts`:
```ts
import type { SessionSummary } from '../types';

export interface ScoreInput {
  yellowAlerts: number;
  redAlerts: number;
  avgDb: number | null;
  spikeCount: number;
  durationSec: number;
}

export interface SessionMetrics {
  durationSec: number;
  avgDb: number | null;
  videoAnomalyCount: number;
  alertCount: number;
  score: number;
  grade: string;
}

const SHORT_SESSION_SEC = 300;

export function calculateScore(
  input: ScoreInput,
  videoAnomalyCount: number
): SessionMetrics {
  const alertCount = input.yellowAlerts + input.redAlerts;
  let deduction =
    input.yellowAlerts * 3 +
    input.redAlerts * 8 +
    input.spikeCount * 1;
  if (input.avgDb !== null && input.avgDb > 65) {
    deduction += Math.floor((input.avgDb - 65) / 5) * 2;
  }
  if (input.durationSec < SHORT_SESSION_SEC) {
    deduction = Math.round(deduction / 2);
  }
  const score = Math.max(20, 100 - deduction);
  const grade =
    score >= 85 ? '优秀' :
    score >= 70 ? '良好' :
    score >= 50 ? '需要留意' : '需要休息';
  return {
    durationSec: input.durationSec,
    avgDb: input.avgDb,
    videoAnomalyCount,
    alertCount,
    score,
    grade
  };
}

export function summaryFromMetrics(
  id: string,
  mode: SessionSummary['mode'],
  startedAt: number,
  metrics: SessionMetrics
): SessionSummary {
  return {
    id,
    mode,
    startedAt,
    durationSec: metrics.durationSec,
    avgDb: metrics.avgDb,
    videoAnomalyCount: metrics.videoAnomalyCount,
    alertCount: metrics.alertCount,
    score: metrics.score,
    grade: metrics.grade
  };
}
```

- [ ] **Step 4:跑测试确认通过**

Run: `npm test -- src/lib/scoring.test.ts`
Expected: PASS,6 个测试通过。

- [ ] **Step 5:提交**

```bash
git add src/lib/scoring.ts src/lib/scoring.test.ts
git commit -m "feat: 情绪得分算法与评级"
```

---

### Task 5:历史记录存储

**Files:**
- Create: `src/lib/storage.ts`, `src/lib/storage.test.ts`

**Interfaces:**
- Consumes: `SessionSummary`(types.ts)。
- Produces: `createSessionStore(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>)` 返回 `{ saveSession(summary): void; loadSessions(): SessionSummary[]; clearSessions(): void }`;默认导出 `sessionStore = createSessionStore(window.localStorage)`,存储键 `calm-tutor:sessions`,最新在前,最多保留 50 条。

- [ ] **Step 1:写失败测试**

`src/lib/storage.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createSessionStore } from './storage';
import type { SessionSummary } from '../types';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); }
  };
}

const summary: SessionSummary = {
  id: 's1', mode: 'both', startedAt: 1000, durationSec: 600,
  avgDb: 60, videoAnomalyCount: 1, alertCount: 2, score: 90, grade: '优秀'
};

describe('createSessionStore', () => {
  let store: ReturnType<typeof createSessionStore>;
  beforeEach(() => { store = createSessionStore(memoryStorage()); });

  it('saves and loads newest-first', () => {
    store.saveSession(summary);
    store.saveSession({ ...summary, id: 's2', startedAt: 2000 });
    expect(store.loadSessions().map((s) => s.id)).toEqual(['s2', 's1']);
  });
  it('clears all sessions', () => {
    store.saveSession(summary);
    store.clearSessions();
    expect(store.loadSessions()).toEqual([]);
  });
  it('caps at 50 entries', () => {
    for (let i = 0; i < 55; i++) {
      store.saveSession({ ...summary, id: `s${i}`, startedAt: i });
    }
    expect(store.loadSessions()).toHaveLength(50);
  });
});
```

- [ ] **Step 2:跑测试确认失败**

Run: `npm test -- src/lib/storage.test.ts`
Expected: FAIL,模块不存在。

- [ ] **Step 3:实现**

`src/lib/storage.ts`:
```ts
import type { SessionSummary } from '../types';

const KEY = 'calm-tutor:sessions';
const MAX = 50;

export interface SessionStore {
  saveSession(summary: SessionSummary): void;
  loadSessions(): SessionSummary[];
  clearSessions(): void;
}

export function createSessionStore(
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
): SessionStore {
  return {
    saveSession(summary) {
      const list = this.loadSessions();
      list.unshift(summary);
      storage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    },
    loadSessions() {
      try {
        const raw = storage.getItem(KEY);
        return raw ? (JSON.parse(raw) as SessionSummary[]) : [];
      } catch {
        return [];
      }
    },
    clearSessions() {
      storage.removeItem(KEY);
    }
  };
}

export const sessionStore = createSessionStore(window.localStorage);
```

- [ ] **Step 4:跑测试确认通过**

Run: `npm test -- src/lib/storage.test.ts`
Expected: PASS,3 个测试通过。

- [ ] **Step 5:提交**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat: localStorage 会话摘要存储(最新在前,最多50条)"
```

---

### Task 6:音频监测 Hook(麦克风)

**Files:**
- Create: `src/types/web-speech.d.ts`, `src/hooks/useAudioMonitor.ts`

**Interfaces:**
- Consumes: `AudioMetrics`(types.ts)、`findNegativeKeywords`(speech.ts)。
- Produces: `useAudioMonitor(): { currentDb: number; avgDb: number; spikeCount: number; keywordHits: string[]; supported: boolean; error: string | null; start(): Promise<void>; stop(): void }`。
  - `start()`:请求 `navigator.mediaDevices.getUserMedia({ audio: true })`,建立 `AudioContext` + `AnalyserNode`,每 100ms 采样分贝;若 `SpeechRecognition` 可用则持续转写并匹配关键词。
  - 分贝计算:分析 `analyser.getByteTimeDomainData`,取 RMS 映射到 dB(0-100 范围,参考全量程);骤升检测:当前分贝比 1 秒前高 ≥10dB 记一次 spike。
  - `stop()`:释放音频轨道、关闭 AudioContext、停止识别。

- [ ] **Step 1:写 Web Speech 类型声明**

`src/types/web-speech.d.ts`:
```ts
interface SpeechRecognitionEvent extends Event {
  results: {
    length: number;
    [i: number]: {
      isFinal: boolean;
      [j: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
}

declare const SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};
declare const webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};
```

- [ ] **Step 2:实现 hook**

`src/hooks/useAudioMonitor.ts`:
```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioMetrics } from '../types';
import { findNegativeKeywords } from '../lib/speech';

const SAMPLE_MS = 100;
const SPIKE_DB = 10;

export interface UseAudioMonitor {
  currentDb: number;
  avgDb: number;
  spikeCount: number;
  keywordHits: string[];
  supported: boolean;
  error: string | null;
  start(): Promise<void>;
  stop(): void;
}

export function useAudioMonitor(): UseAudioMonitor {
  const [currentDb, setCurrentDb] = useState(0);
  const [avgDb, setAvgDb] = useState(0);
  const [spikeCount, setSpikeCount] = useState(0);
  const [keywordHits, setKeywordHits] = useState<string[]>([]);
  const [supported] = useState(() =>
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
  );
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const recognizerRef = useRef<SpeechRecognition | null>(null);
  const samplesRef = useRef<number[]>([]);
  const prevDbRef = useRef<number>(0);
  const spikeRef = useRef(0);

  const stop = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const buf = new Uint8Array(analyser.fftSize);
      const readDb = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        const db = rms === 0 ? 0 : Math.min(100, 20 * Math.log10(rms) + 90);
        return Math.max(0, db);
      };

      timerRef.current = window.setInterval(() => {
        const db = readDb();
        setCurrentDb(db);
        samplesRef.current.push(db);
        if (samplesRef.current.length > 600) samplesRef.current.shift();
        setAvgDb(samplesRef.current.reduce((a, b) => a + b, 0) / samplesRef.current.length);
        if (db - prevDbRef.current >= SPIKE_DB) {
          spikeRef.current += 1;
          setSpikeCount(spikeRef.current);
        }
        prevDbRef.current = db;
      }, SAMPLE_MS);

      const RecognitionCtor =
        typeof SpeechRecognition !== 'undefined'
          ? SpeechRecognition
          : typeof webkitSpeechRecognition !== 'undefined'
            ? webkitSpeechRecognition
            : null;
      if (RecognitionCtor) {
        const rec = new RecognitionCtor();
        rec.lang = 'zh-CN';
        rec.continuous = true;
        rec.interimResults = false;
        rec.onresult = (ev) => {
          let text = '';
          for (let i = 0; i < ev.results.length; i++) {
            if (ev.results[i].isFinal) text += ev.results[i][0].transcript;
          }
          if (text) {
            const hits = findNegativeKeywords(text);
            if (hits.length > 0) setKeywordHits((prev) => [...new Set([...prev, ...hits])]);
          }
        };
        rec.onerror = () => undefined;
        rec.start();
        recognizerRef.current = rec;
      }
    } catch {
      setError('无法获取麦克风权限,请检查浏览器权限设置');
      throw new Error('microphone permission denied');
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { currentDb, avgDb, spikeCount, keywordHits, supported, error, start, stop };
}
```

- [ ] **Step 3:类型检查与构建**

Run: `npm run build`
Expected: 构建成功,无类型错误。

- [ ] **Step 4:手动验证**

Run: `npm run dev`,浏览器打开,临时在 App 中调用 hook(可后续任务删除):
- 授权麦克风后,对麦克风说话/提高音量,`currentDb` 随之变化;
- 大声说话触发 `spikeCount` 增长;
- 说"烦死了"等词,`keywordHits` 出现对应关键词;
- 拒绝授权时 `error` 显示提示。

- [ ] **Step 5:提交**

```bash
git add src/types/web-speech.d.ts src/hooks/useAudioMonitor.ts
git commit -m "feat: 音频监测 hook - 分贝采样、骤升检测、负面关键词识别"
```

---

### Task 7:视频监测 Hook(摄像头)

**Files:**
- Create: `src/hooks/useVideoMonitor.ts`

**Interfaces:**
- Consumes: `VideoFeatures`、`calculateVideoTension`(emotionEngine.ts)。
- Produces: `useVideoMonitor(): { features: VideoFeatures | null; tension: number; supported: boolean; error: string | null; start(video: HTMLVideoElement): Promise<void>; stop(): void }`。
  - `start(video)`:请求摄像头权限,把流接到 `<video>` 元素,加载 MediaPipe FaceLandmarker(模型文件首次需联网,之后由浏览器缓存),每 200ms 检测一次。
  - 特征提取(基于 MediaPipe Face Mesh 478 点索引):`browTension` = 眉毛内角(105/334)相对眼角(33/263)的下压量;`mouthTension` = 嘴角(61/291)相对上唇中点(0)的下拉量;`headMotion` = 鼻尖(1)相邻帧位移。各特征归一到 0-1。
  - `tension` = `calculateVideoTension(features)`。
  - 模型加载失败时 `error` 置为提示,`supported` 仍为 true 但调用方可据此降级。

- [ ] **Step 1:实现 hook**

`src/hooks/useVideoMonitor.ts`:
```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { VideoFeatures } from '../types';
import { calculateVideoTension } from '../lib/emotionEngine';

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';

export interface UseVideoMonitor {
  features: VideoFeatures | null;
  tension: number;
  supported: boolean;
  error: string | null;
  start(video: HTMLVideoElement): Promise<void>;
  stop(): void;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function useVideoMonitor(): UseVideoMonitor {
  const [features, setFeatures] = useState<VideoFeatures | null>(null);
  const [tension, setTension] = useState(0);
  const [supported] = useState(() =>
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
  );
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastNoseRef = useRef<{ x: number; y: number } | null>(null);
  const lastVideoTimeRef = useRef(-1);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
  }, []);

  const start = useCallback(async (video: HTMLVideoElement) => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numFaces: 1
      });
      landmarkerRef.current = landmarker;

      const tick = () => {
        rafRef.current = requestAnimationFrame(tick);
        if (video.currentTime === lastVideoTimeRef.current) return;
        lastVideoTimeRef.current = video.currentTime;
        const result = landmarker.detectForVideo(video, performance.now());
        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          const lm = result.faceLandmarks[0];
          const leftBrowInner = lm[105];
          const rightBrowInner = lm[334];
          const leftEye = lm[33];
          const rightEye = lm[263];
          const mouthLeft = lm[61];
          const mouthRight = lm[291];
          const upperLip = lm[0];
          const nose = lm[1];

          const browTension = clamp01(
            (leftBrowInner.y - leftEye.y + rightBrowInner.y - rightEye.y) / 0.08
          );
          const mouthDrop = (mouthLeft.y + mouthRight.y) / 2 - upperLip.y;
          const mouthTension = clamp01(mouthDrop > 0 ? mouthDrop / 0.05 : 0);
          let headMotion = 0;
          if (lastNoseRef.current) {
            const dx = Math.abs(nose.x - lastNoseRef.current.x);
            const dy = Math.abs(nose.y - lastNoseRef.current.y);
            headMotion = clamp01((dx + dy) / 0.05);
          }
          lastNoseRef.current = { x: nose.x, y: nose.y };

          const f: VideoFeatures = { browTension, mouthTension, headMotion };
          setFeatures(f);
          setTension(calculateVideoTension(f));
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setError('摄像头不可用或模型加载失败,已降级为仅音频');
      throw new Error('camera or model unavailable');
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { features, tension, supported, error, start, stop };
}
```

- [ ] **Step 2:类型检查与构建**

Run: `npm run build`
Expected: 构建成功(若 MediaPipe 类型缺失,`npm install -D @types/mediapipe__tasks-vision` 或按需补充类型声明)。

- [ ] **Step 3:手动验证**

Run: `npm run dev`,临时接入 hook:
- 授权摄像头后,视频画面出现在 `<video>` 中;
- 皱眉/大声说话时 `features` 与 `tension` 变化;
- 断网后启动,`error` 提示模型加载失败。

- [ ] **Step 4:提交**

```bash
git add src/hooks/useVideoMonitor.ts
git commit -m "feat: 视频监测 hook - MediaPipe 表情与动作特征提取"
```

---

### Task 8:会话状态机

**Files:**
- Create: `src/hooks/useSession.ts`

**Interfaces:**
- Consumes: `MonitorMode`、`SessionStatus`、`TensionLevel`、`AudioMetrics`、`SessionSummary`(types.ts);`calculateAudioTension`、`calculateVideoTension`、`fuseTensions`、`smooth`、`levelForTension`、`canAlert`、`YELLOW_THRESHOLD`、`RED_THRESHOLD`(emotionEngine.ts);`pickScript`(speech.ts);`calculateScore`、`summaryFromMetrics`(scoring.ts);`sessionStore`(storage.ts)。
- Produces: `useSession(): { status; mode; startedAt; durationSec; tension; level; currentAlert: string | null; yellowAlerts; redAlerts; videoAnomalyCount; alertCount; summary: SessionSummary | null; start(mode): Promise<void>; stop(): SessionSummary | null; dismissAlert(): void }`。
  - `start(mode)`:置状态为 monitoring,记录 `startedAt`,启动 1 秒计时器;上层(hook 使用方)负责启动音/视频流并把指标喂进来——本 hook 暴露 `ingestAudio(metrics: AudioMetrics)` 与 `ingestVideo(features: VideoFeatures)` 供 MonitorView 调用。
  - 紧张度计算:音频经 `calculateAudioTension(metrics.currentDb, metrics.spikeCount, metrics.keywordHits.length > 0)`;视频经 `calculateVideoTension(features)`;两者经 `fuseTensions` 融合,`smooth` 最近 3 次取均值。
  - 提醒:融合后 `levelForTension`,`canAlert(level, lastAlertAt, Date.now())` 为真时触发——`yellowAlerts/redAlerts` 计数、`currentAlert` 置为 `pickScript` 话术、记录 `lastAlertAt`。视频模式且视频紧张度 ≥80 时,连续帧段计为一次异常(`videoAnomalyCount`)。
  - `stop()`:停止计时,组装 `SessionSummary`(id 用 `crypto.randomUUID()`,`avgDb` 用最后收到的音频均值),`sessionStore.saveSession`,返回 summary,状态置 finished。

- [ ] **Step 1:实现 hook**

`src/hooks/useSession.ts`:
```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  MonitorMode, SessionStatus, TensionLevel,
  AudioMetrics, VideoFeatures, SessionSummary
} from '../types';
import {
  calculateAudioTension, calculateVideoTension, fuseTensions,
  smooth, levelForTension, canAlert, RED_THRESHOLD
} from '../lib/emotionEngine';
import { pickScript } from '../lib/speech';
import { calculateScore, summaryFromMetrics } from '../lib/scoring';
import { sessionStore } from '../lib/storage';

export interface UseSession {
  status: SessionStatus;
  mode: MonitorMode;
  startedAt: number | null;
  durationSec: number;
  tension: number;
  level: TensionLevel;
  currentAlert: string | null;
  yellowAlerts: number;
  redAlerts: number;
  videoAnomalyCount: number;
  alertCount: number;
  summary: SessionSummary | null;
  start(mode: MonitorMode): Promise<void>;
  stop(): SessionSummary | null;
  dismissAlert(): void;
  ingestAudio(metrics: AudioMetrics): void;
  ingestVideo(features: VideoFeatures): void;
}

export function useSession(): UseSession {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [mode, setMode] = useState<MonitorMode>('audio');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [durationSec, setDurationSec] = useState(0);
  const [tension, setTension] = useState(0);
  const [level, setLevel] = useState<TensionLevel>('green');
  const [currentAlert, setCurrentAlert] = useState<string | null>(null);
  const [yellowAlerts, setYellowAlerts] = useState(0);
  const [redAlerts, setRedAlerts] = useState(0);
  const [videoAnomalyCount, setVideoAnomalyCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  const timerRef = useRef<number | null>(null);
  const lastAlertAtRef = useRef<number | null>(null);
  const usedScriptsRef = useRef<string[]>([]);
  const tensionBufRef = useRef<number[]>([]);
  const avgDbRef = useRef<number | null>(null);
  const spikeRef = useRef(0);
  const audioTensionRef = useRef<number | null>(null);
  const videoTensionRef = useRef<number | null>(null);
  const anomalyRef = useRef(0);
  const anomalyActiveRef = useRef(false);

  const ingestAudio = useCallback((metrics: AudioMetrics) => {
    avgDbRef.current = metrics.avgDb;
    spikeRef.current = metrics.spikeCount;
    audioTensionRef.current = calculateAudioTension(
      metrics.currentDb,
      metrics.spikeCount,
      metrics.keywordHits.length > 0
    );
  }, []);

  const ingestVideo = useCallback((features: VideoFeatures) => {
    const v = calculateVideoTension(features);
    videoTensionRef.current = v;
    if (v >= RED_THRESHOLD) {
      if (!anomalyActiveRef.current) {
        anomalyRef.current += 1;
        setVideoAnomalyCount(anomalyRef.current);
      }
      anomalyActiveRef.current = true;
    } else {
      anomalyActiveRef.current = false;
    }
  }, []);

  const dismissAlert = useCallback(() => setCurrentAlert(null), []);

  const start = useCallback(async (m: MonitorMode) => {
    setMode(m);
    setStartedAt(Date.now());
    setDurationSec(0);
    setSummary(null);
    setYellowAlerts(0);
    setRedAlerts(0);
    setVideoAnomalyCount(0);
    setAlertCount(0);
    setTension(0);
    setLevel('green');
    avgDbRef.current = null;
    spikeRef.current = 0;
    anomalyRef.current = 0;
    anomalyActiveRef.current = false;
    tensionBufRef.current = [];
    usedScriptsRef.current = [];
    lastAlertAtRef.current = null;
    setStatus('monitoring');
    timerRef.current = window.setInterval(() => {
      setDurationSec((s) => s + 1);
    }, 1000);
  }, []);

  const stop = useCallback((): SessionSummary | null => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    const endedAt = Date.now();
    const secs = startedAt === null ? 0 : Math.round((endedAt - startedAt) / 1000);
    const metrics = calculateScore(
      {
        yellowAlerts,
        redAlerts,
        avgDb: avgDbRef.current,
        spikeCount: spikeRef.current,
        durationSec: secs
      },
      anomalyRef.current
    );
    const s = summaryFromMetrics(
      crypto.randomUUID(),
      mode,
      startedAt ?? endedAt,
      metrics
    );
    sessionStore.saveSession(s);
    setSummary(s);
    setStatus('finished');
    return s;
  }, [startedAt, mode, yellowAlerts, redAlerts, alertCount]);

  useEffect(() => {
    if (status !== 'monitoring') return;
    const id = window.setInterval(() => {
      const fused = fuseTensions(audioTensionRef.current, videoTensionRef.current);
      tensionBufRef.current.push(fused);
      if (tensionBufRef.current.length > 3) tensionBufRef.current.shift();
      const final = smooth(tensionBufRef.current);
      setTension(final);
      setLevel(levelForTension(final));
    }, 200);
    return () => window.clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (level === 'green' || status !== 'monitoring') return;
    const now = Date.now();
    if (!canAlert(level, lastAlertAtRef.current, now)) return;
    lastAlertAtRef.current = now;
    if (level === 'yellow') {
      setYellowAlerts((n) => n + 1);
    } else {
      setRedAlerts((n) => n + 1);
    }
    setAlertCount((n) => n + 1);
    const script = pickScript(level, usedScriptsRef.current);
    usedScriptsRef.current.push(script);
    setCurrentAlert(script);
  }, [level, status]);

  return {
    status, mode, startedAt, durationSec, tension, level, currentAlert,
    yellowAlerts, redAlerts, videoAnomalyCount, alertCount, summary,
    start, stop, dismissAlert, ingestAudio, ingestVideo
  };
}
```

- [ ] **Step 2:类型检查与构建**

Run: `npm run build`
Expected: 构建成功。

- [ ] **Step 3:手动验证**

Run: `npm run dev`,临时用 App 调用 hook:
- `start('both')` 后 `status` 变为 monitoring,`durationSec` 每秒 +1;
- 模拟喂入高紧张度数据,`level` 变黄/变红,`currentAlert` 出现话术,计数增长;
- 连续高紧张度期间 `videoAnomalyCount` 只算一段;
- `stop()` 返回 summary 且写入 localStorage。

- [ ] **Step 4:提交**

```bash
git add src/hooks/useSession.ts
git commit -m "feat: 会话状态机 - 紧张度融合、提醒触发、结果汇总"
```

---

### Task 9:首页模式选择 + 应用路由

**Files:**
- Create: `src/components/ModeSelector.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `MonitorMode`(types.ts)。
- Produces: `ModeSelector({ onSelect, disabled }: { onSelect: (mode: MonitorMode) => void; disabled: boolean })`——三张模式卡片(仅麦克风/仅摄像头/双开)与隐私说明。
- `App.tsx` 成为页面容器:根据 `useSession().status` 在 `idle` 显示 ModeSelector、`monitoring` 显示 MonitorView(Task 10)、`finished` 显示 ResultsView(Task 11);Task 10/11 未实现时先用占位。

- [ ] **Step 1:实现 ModeSelector**

`src/components/ModeSelector.tsx`:
```tsx
import type { MonitorMode } from '../types';

interface Props {
  onSelect: (mode: MonitorMode) => void;
  disabled: boolean;
}

const MODES: { mode: MonitorMode; title: string; desc: string }[] = [
  { mode: 'audio', title: '仅麦克风', desc: '分析音量、语速与负面用词' },
  { mode: 'video', title: '仅摄像头', desc: '分析表情与动作,适合轻声辅导' },
  { mode: 'both', title: '双开', desc: '声音 + 表情综合判断,识别最准' }
];

export default function ModeSelector({ onSelect, disabled }: Props) {
  return (
    <section className="card">
      <h2>选择监测模式</h2>
      <div className="mode-grid">
        {MODES.map((m) => (
          <button
            key={m.mode}
            className="mode-card"
            disabled={disabled}
            onClick={() => onSelect(m.mode)}
          >
            <strong>{m.title}</strong>
            <span className="muted">{m.desc}</span>
          </button>
        ))}
      </div>
      <p className="muted privacy">
        隐私承诺:所有分析仅在你的设备上实时进行,音视频不录制、不上传。
      </p>
    </section>
  );
}
```

在 `src/index.css` 追加:
```css
.mode-grid { display: grid; gap: 12px; margin: 16px 0; }
.mode-card {
  display: flex; flex-direction: column; gap: 6px;
  text-align: left; padding: 18px;
  border: 2px solid #e2ebe6; border-radius: var(--radius);
  background: #fff; font-size: 16px; cursor: pointer;
}
.mode-card:hover:not(:disabled) { border-color: var(--green); }
.mode-card:disabled { opacity: 0.5; cursor: not-allowed; }
.privacy { font-size: 13px; line-height: 1.6; }
```

- [ ] **Step 2:更新 App 路由骨架**

`src/App.tsx`:
```tsx
import { useSession } from './hooks/useSession';
import ModeSelector from './components/ModeSelector';

export default function App() {
  const session = useSession();
  const handleSelect = async (mode: Parameters<typeof session.start>[0]) => {
    await session.start(mode);
  };

  return (
    <main className="app">
      <header className="hero">
        <h1>和颜悦色</h1>
        <p className="muted">辅导作业,也照顾好自己</p>
      </header>
      {session.status === 'idle' && (
        <ModeSelector onSelect={handleSelect} disabled={false} />
      )}
      {session.status === 'monitoring' && <p>监测中(MonitorView 见 Task 10)</p>}
      {session.status === 'finished' && <p>结果页(ResultsView 见 Task 11)</p>}
    </main>
  );
}
```

`src/index.css` 追加 hero 样式:
```css
.hero { text-align: center; margin: 32px 0 24px; }
.hero h1 { font-size: 32px; margin: 0 0 6px; }
```

- [ ] **Step 3:构建 + 手动验证**

Run: `npm run build`
Expected: 构建成功。

Run: `npm run dev`:首页显示三张模式卡片;点击后进入"监测中"占位;`useSession` 状态正确流转。

- [ ] **Step 4:提交**

```bash
git add src/components/ModeSelector.tsx src/App.tsx src/index.css
git commit -m "feat: 首页模式选择与页面路由骨架"
```

---

### Task 10:监测页 + 提醒气泡

**Files:**
- Create: `src/components/MonitorView.tsx`, `src/components/ReminderOverlay.tsx`

**Interfaces:**
- Consumes: `useSession`(Task 8)、`useAudioMonitor`(Task 6)、`useVideoMonitor`(Task 7)、`TensionLevel`(types.ts)、`speechSynthesis`(浏览器)。
- Produces:
  - `MonitorView({ session, onStop }: { session: ReturnType<typeof useSession>; onStop: () => void })`:内部创建 `useAudioMonitor`/`useVideoMonitor`(按 `session.mode`),启动时把指标喂给 `session.ingestAudio/ingestVideo`,结束调用 `session.stop()`;展示状态球、紧张度、分贝/表情反馈、计时器、结束按钮;监测结束后自动播报提醒(`session.currentAlert`)。
  - `ReminderOverlay({ level, message }: { level: TensionLevel; message: string })`:黄/红两色柔和气泡,3 秒后自动消失(由上层 `dismissAlert` 控制)。

- [ ] **Step 1:实现 ReminderOverlay**

`src/components/ReminderOverlay.tsx`:
```tsx
import type { TensionLevel } from '../types';

interface Props {
  level: TensionLevel;
  message: string;
}

export default function ReminderOverlay({ level, message }: Props) {
  return (
    <div className={`reminder ${level}`} role="alert">
      <span className="reminder-dot" />
      <span>{message}</span>
    </div>
  );
}
```

`src/index.css` 追加:
```css
.reminder {
  position: fixed; left: 50%; top: 24px; transform: translateX(-50%);
  display: flex; align-items: center; gap: 10px;
  padding: 14px 22px; border-radius: 999px;
  color: #fff; font-size: 15px; z-index: 10;
  animation: pop 0.3s ease;
  max-width: 90vw;
}
.reminder.yellow { background: var(--yellow); }
.reminder.red { background: var(--red); }
.reminder-dot { width: 10px; height: 10px; border-radius: 50%; background: #fff; flex: none; }
@keyframes pop { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }
```

- [ ] **Step 2:实现 MonitorView**

`src/components/MonitorView.tsx`:
```tsx
import { useEffect, useRef } from 'react';
import type { UseSession } from '../hooks/useSession';
import { useAudioMonitor } from '../hooks/useAudioMonitor';
import { useVideoMonitor } from '../hooks/useVideoMonitor';
import ReminderOverlay from './ReminderOverlay';

interface Props {
  session: UseSession;
  onStop: () => void;
}

const LEVEL_TEXT = { green: '平稳', yellow: '紧张', red: '危险' };

export default function MonitorView({ session, onStop }: Props) {
  const audio = useAudioMonitor();
  const video = useVideoMonitor();
  const videoRef = useRef<HTMLVideoElement>(null);
  const startedRef = useRef(false);

  const needsAudio = session.mode === 'audio' || session.mode === 'both';
  const needsVideo = session.mode === 'video' || session.mode === 'both';

  useEffect(() => {
    if (startedRef.current || session.status !== 'monitoring') return;
    startedRef.current = true;
    if (needsAudio) {
      audio.start().catch(() => undefined);
    }
    if (needsVideo && videoRef.current) {
      video.start(videoRef.current).catch(() => undefined);
    }
  }, [session.status, needsAudio, needsVideo, audio, video]);

  useEffect(() => {
    if (needsAudio) {
      session.ingestAudio({
        currentDb: audio.currentDb,
        avgDb: audio.avgDb,
        spikeCount: audio.spikeCount,
        keywordHits: audio.keywordHits
      });
    }
  }, [audio.currentDb, audio.avgDb, audio.spikeCount, audio.keywordHits]);

  useEffect(() => {
    if (needsVideo && video.features) {
      session.ingestVideo(video.features);
    }
  }, [video.features]);

  useEffect(() => {
    if (session.currentAlert && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(session.currentAlert);
      u.lang = 'zh-CN';
      window.speechSynthesis.speak(u);
      const t = window.setTimeout(() => session.dismissAlert(), 4000);
      return () => window.clearTimeout(t);
    }
  }, [session.currentAlert]);

  const handleStop = () => {
    audio.stop();
    video.stop();
    session.stop();
    onStop();
  };

  const mm = Math.floor(session.durationSec / 60);
  const ss = (session.durationSec % 60).toString().padStart(2, '0');

  return (
    <section className="monitor">
      {needsVideo && (
        <video ref={videoRef} muted playsInline className="cam-preview" />
      )}
      {session.currentAlert && (
        <ReminderOverlay level={session.level} message={session.currentAlert} />
      )}
      <div className={`status-ball ${session.level}`}>
        <strong>{session.tension.toFixed(0)}</strong>
        <span>{LEVEL_TEXT[session.level]}</span>
      </div>
      <div className="monitor-grid">
        <div className="card stat">
          <span className="muted">辅导时长</span>
          <strong>{mm}:{ss}</strong>
        </div>
        {needsAudio && (
          <div className="card stat">
            <span className="muted">当前分贝</span>
            <strong>{audio.currentDb.toFixed(0)} dB</strong>
          </div>
        )}
        {needsVideo && video.features && (
          <div className="card stat">
            <span className="muted">表情</span>
            <strong>{video.tension.toFixed(0)}</strong>
          </div>
        )}
      </div>
      <button className="btn secondary" onClick={handleStop}>结束辅导</button>
    </section>
  );
}
```

`src/index.css` 追加:
```css
.monitor { display: flex; flex-direction: column; align-items: center; gap: 20px; }
.cam-preview {
  width: 100%; max-width: 360px; border-radius: var(--radius);
  transform: scaleX(-1); background: #dfe8e3;
}
.status-ball {
  width: 160px; height: 160px; border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #fff; gap: 4px;
}
.status-ball.green { background: var(--green); }
.status-ball.yellow { background: var(--yellow); }
.status-ball.red { background: var(--red); }
.status-ball strong { font-size: 40px; }
.monitor-grid { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
.stat { min-width: 120px; text-align: center; display: flex; flex-direction: column; gap: 6px; }
.stat strong { font-size: 22px; }
```

- [ ] **Step 3:接入 App**

`src/App.tsx` 的 monitoring 分支替换为:
```tsx
<MonitorView session={session} onStop={() => undefined} />
```
(并补 import;`onStop` 由 Task 11 的结果页接管,当前传空函数即可。)

- [ ] **Step 4:构建 + 手动验证**

Run: `npm run build`
Expected: 构建成功。

Run: `npm run dev`,完整走一遍:
- 三种模式均可启动,权限弹窗正常;
- 对麦克风大声说话 → 状态球变黄/红,出现气泡,听到中文播报;
- 摄像头模式皱眉 → 紧张度与表情反馈变化;
- 提醒后 30 秒内不再重复播报;
- 结束按钮停止一切采集并回到占位页。

- [ ] **Step 5:提交**

```bash
git add src/components/MonitorView.tsx src/components/ReminderOverlay.tsx src/App.tsx src/index.css
git commit -m "feat: 监测页 - 实时状态、提醒播报与结束流程"
```

---

### Task 11:结果页

**Files:**
- Create: `src/components/ResultsView.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `SessionSummary`(types.ts)、`sessionStore`(storage.ts)。
- Produces: `ResultsView({ summary, onRestart }: { summary: SessionSummary; onRestart: () => void })`:展示情绪得分大数字 + 评级、五项指标卡、历史记录列表(含"清空历史"按钮)。

- [ ] **Step 1:实现 ResultsView**

`src/components/ResultsView.tsx`:
```tsx
import { useState } from 'react';
import type { SessionSummary } from '../types';
import { sessionStore } from '../lib/storage';

interface Props {
  summary: SessionSummary;
  onRestart: () => void;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m} 分 ${s} 秒`;
}

export default function ResultsView({ summary, onRestart }: Props) {
  const [sessions, setSessions] = useState<SessionSummary[]>(() => sessionStore.loadSessions());

  const clearHistory = () => {
    sessionStore.clearSessions();
    setSessions([]);
  };

  const items = [
    { label: '辅导时长', value: formatDuration(summary.durationSec) },
    { label: '声音平均分贝', value: summary.avgDb === null ? '—' : `${summary.avgDb.toFixed(0)} dB` },
    { label: '视频异常次数', value: String(summary.videoAnomalyCount) },
    { label: '系统提醒次数', value: String(summary.alertCount) },
    { label: '情绪得分', value: String(summary.score) }
  ];

  return (
    <section className="results">
      <div className="card score-card">
        <span className="muted">本次辅导情绪稳定得分</span>
        <div className="score-num">{summary.score}</div>
        <strong className={`grade ${summary.score >= 85 ? 'good' : summary.score >= 50 ? 'mid' : 'low'}`}>
          {summary.grade}
        </strong>
      </div>
      <div className="metrics">
        {items.map((it) => (
          <div className="card metric" key={it.label}>
            <span className="muted">{it.label}</span>
            <strong>{it.value}</strong>
          </div>
        ))}
      </div>
      <p className="muted tip">
        {summary.grade === '优秀' && '状态很好,继续保持温柔与耐心。'}
        {summary.grade === '良好' && '整体不错,偶尔的小波动用深呼吸就能化解。'}
        {summary.grade === '需要留意' && '今天有些紧张,试试辅导中途安排一次喝水休息。'}
        {summary.grade === '需要休息' && '今天的情绪压力偏大,先照顾好自己,再陪伴孩子。'}
      </p>
      <div className="actions">
        <button className="btn" onClick={onRestart}>再来一次</button>
      </div>
      <div className="card history">
        <div className="history-head">
          <h3>历史记录</h3>
          <button className="link-btn" onClick={clearHistory}>清空历史</button>
        </div>
        {sessions.length === 0 && <p className="muted">暂无历史记录</p>}
        {sessions.slice(0, 20).map((s) => (
          <div className="history-item" key={s.id}>
            <span>{new Date(s.startedAt).toLocaleString('zh-CN')}</span>
            <strong>{s.score} 分 · {s.grade}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
```

`src/index.css` 追加:
```css
.results { display: flex; flex-direction: column; gap: 16px; }
.score-card { text-align: center; padding: 28px 20px; }
.score-num { font-size: 64px; font-weight: 700; line-height: 1.1; }
.grade.good { color: var(--green); }
.grade.mid { color: var(--yellow); }
.grade.low { color: var(--red); }
.metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
.metric { display: flex; flex-direction: column; gap: 8px; text-align: center; }
.metric strong { font-size: 18px; }
.tip { line-height: 1.7; padding: 0 4px; }
.actions { display: flex; justify-content: center; }
.history h3 { margin: 0 0 12px; }
.history-head { display: flex; justify-content: space-between; align-items: center; }
.link-btn { border: none; background: none; color: var(--muted); cursor: pointer; text-decoration: underline; }
.history-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0; border-bottom: 1px solid #eef2ef;
}
.history-item:last-child { border-bottom: none; }
```

- [ ] **Step 2:接入 App**

`src/App.tsx` 的 finished 分支替换为:
```tsx
{session.status === 'finished' && session.summary && (
  <ResultsView summary={session.summary} onRestart={() => session.start(session.mode)} />
)}
```

- [ ] **Step 3:构建 + 手动验证**

Run: `npm run build`
Expected: 构建成功。

Run: `npm run dev`:完成一次辅导后:
- 结果页显示得分、评级、五项指标与建议;
- "再来一次"回到监测页;
- 历史记录出现本次会话;"清空历史"后列表清空。

- [ ] **Step 4:提交**

```bash
git add src/components/ResultsView.tsx src/App.tsx src/index.css
git commit -m "feat: 结果页 - 得分评级、五项指标与历史记录"
```

---

### Task 12:PWA 完善与端到端验证

**Files:**
- Modify: `src/App.tsx`(补充权限错误提示与降级提示展示)、`src/index.css`

**Interfaces:**
- Consumes: 全部既有模块。
- Produces: 可安装、离线可用的完整 PWA;权限拒绝与能力降级有明确 UI 提示。

- [ ] **Step 1:补权限错误与降级提示**

`src/components/MonitorView.tsx` 在状态球上方渲染错误提示(两个 hook 已各自暴露 `error`):
```tsx
{(audio.error || video.error) && (
  <p className="card warn">{audio.error || video.error}</p>
)}
```

`src/index.css` 追加:
```css
.warn { background: #fff7e8; color: #8a5a00; border: 1px solid #f0d9a8; }
```

- [ ] **Step 2:端到端验证清单**

Run: `npm run build` 后 `npm run preview`,并跑 `npm test`:
- 全部单元测试通过;
- 三种模式端到端流程(选择 → 权限 → 监测 → 提醒 → 结束 → 结果)均正常;
- 拒绝麦克风/摄像头权限时显示中文错误提示,可回到首页重选;
- 离线(断网)后刷新,应用仍能打开(Service Worker 生效),摄像头模式提示模型加载失败并降级为仅音频;
- 浏览器地址栏出现"安装"入口,安装后从桌面/主屏幕独立启动。

- [ ] **Step 3:提交**

```bash
git add src/App.tsx src/index.css
git commit -m "feat: PWA 完善 - 错误提示、降级提示与端到端验证"
```

---

## Self-Review 记录

- Spec 覆盖:模式选择(Task 9)、实时分析(Task 6/7/8)、AI 播报提醒(Task 10)、结果页五项指标(Task 11)、历史记录(Task 11)、隐私本地处理(Task 1 全局约束)、错误降级(Task 12)——均有着落。
- 占位符扫描:无 TBD/TODO;Task 8 的融合逻辑在实现代码中完整给出,无待办说明。
- 类型一致性:`fuseTensions(audio: number | null, video: number | null)`、`calculateScore(input, videoAnomalyCount)`、`ingestAudio/ingestVideo` 签名在各任务间一致。
