import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft } from 'lucide-react';
import { useSession } from './hooks/useSession';
import { useAudioMonitor } from './hooks/useAudioMonitor';
import { useVideoMonitor } from './hooks/useVideoMonitor';
import { useDbVoiceAlert } from './hooks/useDbVoiceAlert';
import { usePythonEmotionMonitor } from './hooks/usePythonEmotionMonitor';
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
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [negativeSpeech, setNegativeSpeech] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);

  // Python FastAPI 后端实时情绪监控引擎
  const pythonMonitor = usePythonEmotionMonitor(started && !paused);

  const currentDbRef = useRef(0);
  const handleSpeech = useCallback((text: string, isFinal: boolean) => {
    pythonMonitor.analyzeSpeech(text, currentDbRef.current, isFinal);
  }, [pythonMonitor]);

  const audio = useAudioMonitor(handleSpeech);
  currentDbRef.current = audio.currentDb;
  const video = useVideoMonitor();
  const startVideoMonitor = video.start;
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 当 Python 后端识别到负面语言时，同步更新状态并记录干预
  useEffect(() => {
    if (pythonMonitor.activeAlert?.hasNegative) {
      setNegativeSpeech(true);
      session.recordIntervention();
    } else {
      setNegativeSpeech(false);
    }
  }, [pythonMonitor.activeAlert]);

  const needsAudio = session.mode === 'audio' || session.mode === 'both';
  const needsVideo = session.mode === 'video' || session.mode === 'both';
  useDbVoiceAlert(
    audio.currentDb,
    started && !paused && needsAudio,
    session.recordIntervention
  );

  // 把每个新分贝样本喂给会话：平均分贝在会话内全程累计，
  // 不受音频采样器“最近 60 秒”滑动窗口影响。
  useEffect(() => {
    if (!started || paused || !needsAudio || audio.dbHistory.length === 0) return;
    const sample = audio.dbHistory[audio.dbHistory.length - 1];
    if (!sample) return;
    session.ingestAudio({
      currentDb: sample.db,
      avgDb: audio.avgDb,
      spikeCount: audio.spikeCount,
      keywordHits: audio.keywordHits
    });
  }, [started, paused, needsAudio, audio.dbHistory, audio.avgDb, audio.spikeCount, audio.keywordHits]);

  const handleSelectMode = async (mode: MonitorMode) => {
    setPermError(null);
    try {
      await session.start(mode);
      if (mode === 'audio' || mode === 'both') await audio.start();
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
      session.resume();
      setPaused(false);
    } else {
      audio.stop();
      video.stop();
      session.pause();
      setPaused(true);
    }
  };

  // 摄像头画面依赖 <video> 元素：只有在页面切换到监测页、元素挂载后
  // 才能拿到 videoRef.current，因此启动放在 effect 中而不是点击处理器里。
  useEffect(() => {
    if (!started || paused || !needsVideo || !videoRef.current) return;
    startVideoMonitor(videoRef.current).catch(() => {
      video.stop();
      audio.stop();
      session.stop();
      setPermError('无法获取摄像头权限，请检查浏览器权限后重试。');
      setStarted(false);
      setPaused(false);
    });
  }, [started, paused, needsVideo, startVideoMonitor]);

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
    pythonMonitor.clearHistory();
    setPermError(null);
    setStarted(false);
  };

  const avgDb = Math.round(session.summary?.avgDb ?? session.avgDb ?? audio.avgDb);

  // 结束辅导会同时切回首页，因此报告弹窗必须在 started 分支之外渲染，
  // 否则 setStarted(false) 会把它一起卸载，导致点击结束辅导看不到报告。
  if (showSummary && typeof document !== 'undefined') {
    return createPortal(
      <SummaryModal
        isOpen
        onClose={() => setShowSummary(false)}
        onBackHome={() => { setShowSummary(false); handleRestart(); }}
        durationSeconds={session.durationSec}
        averageDecibel={avgDb}
        interventionCount={session.alertCount}
      />,
      document.body
    );
  }

  // Landing screen (mode selector)
  if (!started) {
    return (
      <div className="min-h-screen bg-[#f0f4f2] flex flex-col items-center justify-center px-5 py-10 font-sans text-slate-800 antialiased">
        <div className="w-full max-w-[420px]">
          <div className="py-4">
            <header className="text-center mb-7">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#22a091] to-[#2fa599] text-white shadow-[0_8px_24px_-8px_rgba(34,160,145,0.5)] mb-4">
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2Z" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
              </div>
              <h1 className="text-[26px] font-bold text-[#1e293b] tracking-tight">和颜悦色</h1>
              <p className="text-slate-500 text-[13px] mt-2 leading-relaxed">
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
    <div className="min-h-screen bg-[#f0f4f2] flex flex-col items-center font-sans text-slate-800 antialiased selection:bg-teal-500 selection:text-white">
      <div
        id="phone-container"
        className="w-full max-w-[420px] mx-auto px-4 sm:px-5 flex flex-col min-h-screen pb-28"
      >
        <div className="w-full flex flex-col flex-1">
          <header className="w-full pt-2 pb-1.5 flex items-center justify-between">
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
            <div className="w-full px-4.5 pt-1.5 pb-2">
              <video
                ref={videoRef}
                muted
                playsInline
                className="w-full max-h-[180px] rounded-[18px] bg-slate-200 -scale-x-100 object-cover"
              />
              {video.error && (
                <p
                  role="alert"
                  className="mt-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5 leading-relaxed"
                >
                  {video.error}
                </p>
              )}
            </div>
          )}

          <section aria-label="分贝监测表盘" className="w-full">
            <DecibelGauge db={audio.currentDb} />
          </section>

          <main className="w-full px-4 space-y-3 mt-2">
            <StatsCard
              durationSeconds={session.durationSec}
              averageDecibel={avgDb}
              interventionCount={session.alertCount}
            />

            {/* 负面语言实时分析卡片（整合实时转写、敏感词识别、平替建议与语音示范） */}
            <SpeechRecognitionCard
              negativeSpeechDetected={negativeSpeech}
              backendConnected={pythonMonitor.connectionStatus === 'connected'}
              activeAlert={pythonMonitor.activeAlert}
              lastTranscript={audio.lastTranscript}
              currentDb={audio.currentDb}
              asrStatus={audio.asrStatus}
              onDismissAlert={pythonMonitor.dismissAlert}
              onSimulate={(phrase) => {
                pythonMonitor.analyzeSpeech(phrase, audio.currentDb > 0 ? audio.currentDb : 76, true);
              }}
            />

            {/* 分贝历史曲线走势图 */}
            <section aria-label="分贝曲线图">
              <DecibelChart history={audio.dbHistory} />
            </section>

            <TipBanner />
          </main>
        </div>

        <footer className="fixed bottom-0 left-0 right-0 z-10 bg-[#f0f4f2]/92 backdrop-blur-md border-t border-slate-200/60 px-4 py-3 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.04)]">
          <div className="w-full max-w-[420px] mx-auto">
            <ActionControls
              isPaused={paused}
              onTogglePause={handleTogglePause}
              onEndCoaching={handleEnd}
            />
          </div>
        </footer>
      </div>

    </div>
  );
}
