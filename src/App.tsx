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
