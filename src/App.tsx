import { useSession } from './hooks/useSession';
import ModeSelector from './components/ModeSelector';
import MonitorView from './components/MonitorView';
import ResultsView from './components/ResultsView';

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
      {session.status === 'monitoring' && (
        <MonitorView session={session} onStop={() => undefined} />
      )}
      {session.status === 'finished' && session.summary && (
        <ResultsView summary={session.summary} onRestart={() => session.start(session.mode)} />
      )}
    </main>
  );
}
