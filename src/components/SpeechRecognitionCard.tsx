import React, { useState } from 'react';
import { MessageCircle, HelpCircle, X, Crown, Sparkles } from 'lucide-react';
import type { EmotionAlert } from '../types/python-monitor';

interface SpeechRecognitionCardProps {
  negativeSpeechDetected?: boolean;
  backendConnected?: boolean;
  activeAlert?: EmotionAlert | null;
  onSimulate?: (text: string) => void;
}

export const SpeechRecognitionCard: React.FC<SpeechRecognitionCardProps> = ({
  negativeSpeechDetected = false,
  backendConnected = true,
  activeAlert = null,
  onSimulate
}) => {
  const [showHelp, setShowHelp] = useState(false);

  const samplePhrases = [
    '怎么这么笨',
    '谁都比你强',
    '蠢的更猪一样',
    '先深呼吸，我们慢慢做'
  ];

  return (
    <>
      <div
        id="negative-language-card"
        className="w-full bg-white rounded-[20px] px-4 py-5 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] border border-slate-100/80 relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            {/* Red message bubble icon */}
            <div className="text-[#f43f5e] flex items-center justify-center">
              <MessageCircle className="w-5 h-5 fill-[#f43f5e]/15 stroke-[2.2]" />
            </div>

            {/* Title */}
            <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">
              负面语言实时分析
            </h2>

            {/* AI engine status pill */}
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
              智能情绪引擎
            </span>

            {/* VIP icon */}
            <span
              className="inline-flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 text-[10px] font-semibold tracking-wide border border-amber-200/70"
              title="实时声学与NLP语义双重监测"
            >
              <Crown className="w-3 h-3 stroke-[2.2]" />
              实时
            </span>
          </div>

          {/* Help button */}
          <button
            id="speech-help-btn"
            type="button"
            onClick={() => setShowHelp(true)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1 rounded-full active:bg-slate-100 cursor-pointer"
            aria-label="查看负面语言识别说明"
          >
            <HelpCircle className="w-5 h-5 stroke-[1.8]" />
          </button>
        </div>

        {/* Card Body */}
        <div className="flex items-center justify-between pt-1 pb-1">
          {/* Status Text */}
          <div className="flex-1 flex flex-col items-start justify-center pl-1">
            {negativeSpeechDetected || (activeAlert && activeAlert.hasNegative) ? (
              <>
                <p className="text-[14px] font-semibold text-[#e05e5e] tracking-tight flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#e05e5e] animate-ping shrink-0" />
                  {activeAlert?.categoryName || '检测到稍显急躁的情绪语气'}
                </p>
                <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                  {activeAlert?.matchedPhrases?.length
                    ? `触发词：${activeAlert.matchedPhrases.join('、')}`
                    : '建议深呼吸，放缓语速耐心鼓励~'}
                </p>
              </>
            ) : (
              <>
                <p className="text-[14px] font-medium text-slate-700 tracking-tight">
                  请保持温和平静的辅导节奏~
                </p>
                <p className="text-[12px] text-slate-400 mt-1 flex items-center gap-1.5">
                  <span className="inline-flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2fa599] animate-pulse"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2fa599] animate-pulse delay-150"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2fa599] animate-pulse delay-300"></span>
                  </span>
                  麦克风与服务端持续监听中...
                </p>
              </>
            )}
          </div>

          {/* Chibi Girl Avatar on the Right */}
          <div className="w-[66px] h-[66px] rounded-full overflow-hidden shrink-0 border-2 border-amber-100/80 shadow-xs bg-amber-50 relative group ml-2">
            <img
              src="/tutor_avatar.jpg"
              alt="辅导助手"
              className="w-full h-full object-cover select-none transition-transform duration-300 group-hover:scale-105"
            />
            {/* Live active indicator badge */}
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-xs"></div>
          </div>
        </div>

        {/* 快速体验测试按钮（方便无麦克风或想立即检验 Python 识别时点击） */}
        {onSimulate && (
          <div className="mt-3.5 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span className="flex items-center gap-1 font-medium text-slate-500">
                <Sparkles className="w-3 h-3 text-[#2fa599]" />
                点击模拟家长原话测试 Python 识别与平替：
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {samplePhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSimulate(phrase)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all active:scale-95 cursor-pointer ${
                    phrase.includes('深呼吸')
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                  }`}
                >
                  “{phrase}”
                </button>
              ))}
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
                <h3 className="font-bold text-slate-800 text-base">Python 情绪预警方案说明</h3>
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
                <strong>1. Python 服务端实时 NLP：</strong>
                后端通过 FastAPI WebSocket 长连接，毫秒级分析转写文本中的人身侮辱、横向打压、急躁发泄等负向言论。
              </p>
              <p>
                <strong>2. 自动生成平和平替话术：</strong>
                一旦识别到“怎么这么笨”、“谁都比你强”等打压语句，系统即刻生成教育心理学平替建议，引导家长换个说法支持孩子。
              </p>
              <p>
                <strong>3. 声学分贝 + 语义多模态打分：</strong>
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

