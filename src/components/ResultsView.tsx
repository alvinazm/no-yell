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
