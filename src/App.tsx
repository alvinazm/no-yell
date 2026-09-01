import { useState } from 'react';
import { useSession } from './hooks/useSession';
import ModeSelector from './components/ModeSelector';
import MonitorView from './components/MonitorView';
import ResultsView from './components/ResultsView';

export default function App() {
  const session = useSession();
  const [interrupted, setInterrupted] = useState(() => {
    if (typeof window === 'undefined' || !window.sessionStorage) return false;
    const wasActive = window.sessionStorage.getItem('calm-tutor:active') === '1';
    window.sessionStorage.removeItem('calm-tutor:active');
    return wasActive;
  });
  const handleSelect = async (mode: Parameters<typeof session.start>[0]) => {
    await session.start(mode);
  };

  return (
    <main className="app">
      <header className="hero">
        <h1>和颜悦色</h1>
        <p className="muted">辅导作业,也照顾好自己</p>
      </header>
      {interrupted && (
        <p className="card warn interrupted">
          上次辅导已中断,没有生成结果。
          <button className="link-btn" onClick={() => setInterrupted(false)}>知道了</button>
        </p>
      )}
      {session.status === 'idle' && (
        <ModeSelector onSelect={handleSelect} disabled={false} />
      )}
      {session.status === 'monitoring' && (
        <MonitorView session={session} onStop={() => undefined} />
      )}
      {session.status === 'finished' && session.summary && (
        <ResultsView summary={session.summary} onRestart={() => session.start(session.mode)} />
      )}
    </main>
  );
}
