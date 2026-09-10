import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  HelpCircle,
  X,
  Crown,
  Sparkles,
  Mic,
  Volume2,
  VolumeX,
  HeartHandshake,
  Check
} from 'lucide-react';
import type { EmotionAlert } from '../types/python-monitor';
import { speakCalmGuidance, stopSpeaking, isTtsSupported } from '../lib/tts';

interface SpeechRecognitionCardProps {
  negativeSpeechDetected?: boolean;
  backendConnected?: boolean;
  activeAlert?: EmotionAlert | null;
  lastTranscript?: string;
  onSimulate?: (text: string) => void;
  currentDb?: number;
  onDismissAlert?: () => void;
  asrStatus?: 'listening' | 'reconnecting' | 'stopped' | 'unsupported';
}

export const SpeechRecognitionCard: React.FC<SpeechRecognitionCardProps> = ({
  negativeSpeechDetected = false,
  backendConnected = true,
  activeAlert = null,
  lastTranscript,
  onSimulate,
  currentDb = 0,
  onDismissAlert,
  asrStatus = 'stopped'
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [isPlayingTts, setIsPlayingTts] = useState(false);
  const ttsAvailable = isTtsSupported();

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // 分类测试情景词
  const scenarioGroups = [
    {
      category: '智力贬低',
      phrases: ['怎么这些笨', '笨死了']
    },
    {
      category: '横向攀比',
      phrases: ['谁都比你强']
    },
    {
      category: '急躁催促',
      phrases: ['快点写别磨蹭']
    },
    {
      category: '温和鼓励',
      phrases: ['先深呼吸，我们慢慢做']
    }
  ];

  // 是否检测到声音/说话中
  const isSoundActive = currentDb > 45 || Boolean(lastTranscript);

  // 只有真正识别到负面敏感词语时才进入预警形态
  const hasNegativeMatch = Boolean(
    (activeAlert?.hasNegative && (activeAlert.matchedPhrases?.length ?? 0) > 0) ||
    (negativeSpeechDetected && activeAlert?.hasNegative)
  );

  const handleToggleTts = () => {
    if (isPlayingTts) {
      stopSpeaking();
      setIsPlayingTts(false);
      return;
    }

    if (!activeAlert?.replacementSuggestion) return;
    setIsPlayingTts(true);
    const success = speakCalmGuidance(activeAlert.replacementSuggestion, {
      onEnd: () => setIsPlayingTts(false),
      onError: () => setIsPlayingTts(false)
    });
    if (!success) {
      setIsPlayingTts(false);
    }
  };

  const handleDismiss = () => {
    stopSpeaking();
    setIsPlayingTts(false);
    onDismissAlert?.();
  };

  return (
    <>
      <div
        id="negative-language-card"
        className={`w-full bg-white rounded-[22px] px-4 py-4.5 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] border transition-all duration-300 relative overflow-hidden ${
          hasNegativeMatch
            ? 'border-rose-300 shadow-rose-500/10 ring-1 ring-rose-200'
            : 'border-slate-100/90'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Red message bubble icon */}
            <div className={`p-1.5 rounded-xl transition-colors ${
              hasNegativeMatch ? 'bg-rose-100 text-rose-600' : 'bg-rose-50 text-rose-500'
            }`}>
              <MessageCircle className="w-4 h-4 stroke-[2.2]" />
            </div>

            {/* Title */}
            <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">
              负面语言实时分析
            </h2>

            {/* 状态徽标 */}
            {hasNegativeMatch ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                已触发心理引导
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide border ${
                  backendConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
                title="智能情绪与语言实时分析"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    backendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                智能引擎运行中
              </span>
            )}

            {/* VIP icon */}
            <span
              className="inline-flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 text-[10px] font-semibold tracking-wide border border-amber-200/70"
              title="实时声学与NLP语义双重监测"
            >
              <Crown className="w-3 h-3 stroke-[2.2]" />
              实时
            </span>
          </div>

          <div className="flex items-center gap-1">
            {hasNegativeMatch && onDismissAlert && (
              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
                title="重置状态"
                aria-label="关闭预警"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Help button */}
            <button
              id="speech-help-btn"
              type="button"
              onClick={() => setShowHelp(true)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1 rounded-full active:bg-slate-100 cursor-pointer"
              aria-label="查看负面语言识别说明"
            >
              <HelpCircle className="w-4 h-4 stroke-[1.8]" />
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="flex items-center justify-between pt-0.5 pb-1">
          {/* Status Text & Dynamic Wave */}
          <div className="flex-1 flex flex-col items-start justify-center pl-1 min-w-0 pr-2">
            {hasNegativeMatch && activeAlert ? (
              <>
                <p className="text-[14px] font-semibold text-rose-600 tracking-tight flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  {activeAlert.categoryName || '情绪语气偏急躁'}
                </p>
                <p className="text-[12px] text-slate-600 mt-0.5 leading-relaxed">
                  {activeAlert.matchedPhrases?.length ? (
                    <>
                      触发敏感词：
                      <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60 ml-0.5">
                        {activeAlert.matchedPhrases.join('、')}
                      </span>
                    </>
                  ) : (
                    '建议深呼吸，放缓语速耐心鼓励~'
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="text-[14px] font-medium text-slate-700 tracking-tight">
                  请保持温和平静的辅导节奏~
                </p>
                <div className="text-[12px] text-slate-400 mt-1 flex items-center gap-1.5">
                  {/* 麦克风能量波形条动效 */}
                  <div className="inline-flex items-end gap-0.5 h-3.5 px-1 py-0.5 rounded bg-slate-100/80">
                    <span className={`w-0.8 bg-[#2fa599] rounded-full transition-all duration-150 ${isSoundActive ? 'h-3 animate-pulse' : 'h-1'}`} />
                    <span className={`w-0.8 bg-[#2fa599] rounded-full transition-all duration-150 delay-75 ${isSoundActive ? 'h-2.5 animate-pulse' : 'h-1.5'}`} />
                    <span className={`w-0.8 bg-[#2fa599] rounded-full transition-all duration-150 delay-150 ${isSoundActive ? 'h-3.5 animate-pulse' : 'h-1'}`} />
                    <span className={`w-0.8 bg-[#2fa599] rounded-full transition-all duration-150 delay-200 ${isSoundActive ? 'h-2 animate-pulse' : 'h-1.5'}`} />
                  </div>
                  <span className="text-slate-500 font-normal">
                    {isSoundActive ? '麦克风收音中...' : '麦克风持续监听中，暂未说话'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Chibi Girl Avatar on the Right */}
          <div className="w-[62px] h-[62px] rounded-full overflow-hidden shrink-0 border-2 border-amber-100/80 shadow-xs bg-amber-50 relative group ml-2">
            <img
              src="/tutor_avatar.jpg"
              alt="辅导助手"
              className="w-full h-full object-cover select-none transition-transform duration-300 group-hover:scale-105"
            />
            {/* Live active indicator badge */}
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-xs"></div>
          </div>
        </div>

        {/* 核心价值：直接在卡片内展开教育心理学平替话术建议 */}
        {hasNegativeMatch && activeAlert && activeAlert.replacementSuggestion && (
          <div className="mt-2.5 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-3 text-slate-800 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-800 text-[12px] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>建议改用平和引导话术：</span>
              </div>

              {/* 温和示范朗读按钮 */}
              {ttsAvailable && (
                <button
                  type="button"
                  onClick={handleToggleTts}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.8 rounded-lg text-[11px] font-medium transition-all active:scale-95 cursor-pointer shadow-2xs border ${
                    isPlayingTts
                      ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                      : 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-100/60'
                  }`}
                >
                  {isPlayingTts ? (
                    <>
                      <VolumeX className="w-3 h-3" />
                      <span>停止朗读</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3" />
                      <span>听温和示范</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-[13px] font-semibold text-emerald-950 mt-1.5 leading-relaxed tracking-tight bg-white/90 py-2 px-2.5 rounded-xl border border-emerald-100 shadow-2xs">
              {activeAlert.replacementSuggestion}
            </p>

            {activeAlert.coachTip && (
              <p className="text-[11px] text-emerald-700/90 mt-2 pl-0.5 leading-normal flex items-start gap-1">
                <HeartHandshake className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                <span>{activeAlert.coachTip}</span>
              </p>
            )}

            {/* 一键放平心态按钮 */}
            <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-700">
              <span className="text-[11px] text-emerald-600">孩子卡壳时，先认可情绪再拆解步骤</span>
              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#2fa599] hover:bg-[#22a091] text-white font-medium rounded-xl active:scale-95 transition-all shadow-xs cursor-pointer text-xs"
              >
                <Check className="w-3 h-3" />
                <span>我知道了，放平心态</span>
              </button>
            </div>
          </div>
        )}

        {/* 实时转写气泡框 */}
        <div className="mt-2.5 px-3 py-2 bg-slate-50/90 rounded-xl border border-slate-100 flex items-start gap-2">
          <Mic className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isSoundActive ? 'text-[#2fa599] animate-pulse' : 'text-slate-400'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span>实时语音转写（ASR）</span>
                {asrStatus === 'listening' && (
                  <span className="inline-flex items-center gap-1 text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    连续监听中
                  </span>
                )}
                {asrStatus === 'reconnecting' && (
                  <span className="inline-flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    自动保活续听中
                  </span>
                )}
                {asrStatus === 'unsupported' && (
                  <span className="text-[9px] text-slate-400">
                    (浏览器不支持，可通过下方模拟)
                  </span>
                )}
              </div>
              {currentDb > 0 && <span className="font-mono text-slate-500">{Math.round(currentDb)} dB</span>}
            </div>
            <p className="text-[12px] text-slate-700 leading-snug break-words">
              {lastTranscript ? (
                <span className="font-medium text-slate-900">“{lastTranscript}”</span>
              ) : (
                <span className="text-slate-400 italic">麦克风持续守候中，对孩子说的每一句话都会实时分析...</span>
              )}
            </p>
          </div>
        </div>

        {/* 快速体验测试按钮（分情境展示） */}
        {onSimulate && (
          <div className="mt-3 pt-2.5 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
              <span className="flex items-center gap-1 font-medium text-slate-600">
                <Sparkles className="w-3 h-3 text-[#2fa599]" />
                点击模拟不同情境原话（测试识别与平替）：
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {scenarioGroups.map((grp) =>
                grp.phrases.map((phrase, idx) => (
                  <button
                    key={`${grp.category}-${idx}`}
                    type="button"
                    onClick={() => onSimulate(phrase)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                      grp.category === '温和鼓励'
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : grp.category === '智力贬低'
                          ? 'bg-rose-50/70 border-rose-200/90 text-rose-700 hover:bg-rose-100'
                          : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                    }`}
                    title={`点击测试【${grp.category}】`}
                  >
                    <span>“{phrase}”</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div
          id="help-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">👑</span>
                <h3 className="font-bold text-slate-800 text-base">情绪语言监测方案说明</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                <strong>1. 实时 NLP 语义分析：</strong>
                引擎毫秒级分析转写文本中的人身侮辱、横向打压、急躁发泄等负向言论，未检测到敏感词或未说话时保持静默状态。
              </p>
              <p>
                <strong>2. 自动生成平和平替话术：</strong>
                一旦识别到“怎么这些笨”、“谁都比你强”等打压语句，系统即刻在卡片内生成教育心理学平替建议，引导家长换个说法支持孩子，并支持一键语音示范试听。
              </p>
              <p>
                <strong>3. 声学分贝 + 语义多模态评估：</strong>
                结合麦克风即时分贝（dB）与敏感词频次进行综合评估，避免在孩子卡壳时情绪逐步激化。
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="mt-5 w-full py-3 bg-[#2fa599] text-white font-semibold rounded-xl active:opacity-90 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </>
  );
};

