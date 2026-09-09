import { useEffect, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useSession } from './hooks/useSession';
import { useAudioMonitor } from './hooks/useAudioMonitor';
import { useVideoMonitor } from './hooks/useVideoMonitor';
import DecibelGauge from './components/DecibelGauge';
import DecibelChart from './components/DecibelChart';
import { StatsCard } from './components/StatsCard';
import { TipBanner } from './components/TipBanner';
import { SpeechRecognitionCard } from './components/SpeechRecognitionCard';
import { ActionControls } from './components/ActionControls';
import { SummaryModal } from './components/SummaryModal';
import ModeSelector from './components/ModeSelector';
import type { MonitorMode } from './types';

export default function App() {
  const session = useSession();
  const audio = useAudioMonitor();
  const video = useVideoMonitor();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [negativeSpeech, setNegativeSpeech] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);

  const needsAudio = session.mode === 'audio' || session.mode === 'both';
  const needsVideo = session.mode === 'video' || session.mode === 'both';

  const handleSelectMode = async (mode: MonitorMode) => {
    setPermError(null);
    try {
      await session.start(mode);
      if (mode === 'audio' || mode === 'both') await audio.start();
      if ((mode === 'video' || mode === 'both') && videoRef.current) {
        await video.start(videoRef.current);
      }
      setStarted(true);
    } catch {
      const msg = mode === 'audio'
        ? '无法获取麦克风权限，请检查浏览器权限后重试。'
        : mode === 'video'
          ? '无法获取摄像头权限，请检查浏览器权限后重试。'
          : '无法获取麦克风或摄像头权限，请检查浏览器权限后重试。';
      setPermError(msg);
      session.stop();
    }
  };

  const handleTogglePause = () => {
    if (paused) {
      if (needsAudio) audio.start().catch(() => undefined);
      if (needsVideo && videoRef.current) video.start(videoRef.current).catch(() => undefined);
      setPaused(false);
    } else {
      audio.stop();
      video.stop();
      setPaused(true);
    }
  };

  const handleEnd = () => {
    audio.stop();
    video.stop();
    session.stop();
    setStarted(false);
    setPaused(false);
    setShowSummary(true);
  };

  const handleRestart = () => {
    setShowSummary(false);
    setNegativeSpeech(false);
    setPermError(null);
    setStarted(false);
  };

  // Detect negative speech & bad-zone interventions
  useEffect(() => {
    if (audio.currentDb >= 80 || session.level === 'red') {
      setNegativeSpeech(true);
    } else {
      setNegativeSpeech(false);
    }
  }, [audio.currentDb, session.level]);

  const avgDb = session.summary?.avgDb ?? Math.round(audio.avgDb);

  // Landing screen (mode selector)
  if (!started) {
    return (
      <div className="min-h-screen bg-[#f5f8fa] flex flex-col items-center justify-center px-5 py-10 font-sans text-slate-800 antialiased">
        <div className="w-full max-w-[420px]">
          <div className="py-6">
            <header className="text-center mb-6">
              <h1 className="text-[24px] font-bold text-[#1e293b] tracking-tight">和颜悦色</h1>
              <p className="text-slate-500 text-[13px] mt-1.5 leading-relaxed">
                AI 家长情绪监测助手 · 辅导作业，也照顾好自己
              </p>
            </header>
            <ModeSelector onSelect={handleSelectMode} error={permError} />
          </div>
        </div>
      </div>
    );
  }

  // Main monitor screen (post-start)
  return (
    <div className="min-h-screen bg-[#f5f8fa] flex flex-col items-center font-sans text-slate-800 antialiased selection:bg-teal-500 selection:text-white">
      <div
        id="phone-container"
        className="w-full max-w-[420px] mx-auto px-4 sm:px-5 flex flex-col justify-between min-h-screen"
      >
        <div className="w-full flex flex-col">
          <header className="w-full pt-3 pb-2 flex items-center justify-between">
            <button
              id="back-nav-btn"
              type="button"
              onClick={() => { if (confirm('确定要返回首页吗？当前监测将结束。')) handleEnd(); }}
              className="p-1 -ml-1 text-slate-700 hover:text-slate-900 active:scale-95 transition-transform rounded-full hover:bg-slate-200/50 cursor-pointer"
              aria-label="返回"
            >
              <ChevronLeft className="w-7 h-7 stroke-[2.4]" />
            </button>
            <h1 className="text-[19px] font-bold text-[#1e293b] tracking-wide select-none">
              辅导监测
            </h1>
            <div className="w-7" />
          </header>

          {needsVideo && (
            <div className="w-full px-4.5 pt-1 pb-2">
              <video
                ref={videoRef}
                muted
                playsInline
                className="w-full max-h-[180px] rounded-[18px] bg-slate-200 -scale-x-100 object-cover"
              />
            </div>
          )}

          <section aria-label="分贝监测表盘" className="w-full">
            <DecibelGauge db={audio.currentDb} />
          </section>

          <main className="w-full px-4.5 space-y-3.5 mt-3.5">
            <StatsCard
              durationSeconds={session.durationSec}
              averageDecibel={avgDb}
              interventionCount={session.alertCount}
            />
            <section aria-label="分贝曲线图">
              <DecibelChart history={audio.dbHistory} />
            </section>
            <TipBanner />
            <SpeechRecognitionCard negativeSpeechDetected={negativeSpeech} />
          </main>
        </div>

        <footer className="w-full px-4.5 pb-2 pt-2 bg-gradient-to-t from-[#f5f8fa] via-[#f5f8fa] to-transparent">
          <ActionControls
            isPaused={paused}
            onTogglePause={handleTogglePause}
            onEndCoaching={handleEnd}
          />
        </footer>
      </div>

      <SummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        onRestart={() => { setShowSummary(false); handleRestart(); }}
        durationSeconds={session.durationSec}
        averageDecibel={avgDb}
        interventionCount={session.alertCount}
      />
    </div>
  );
}
