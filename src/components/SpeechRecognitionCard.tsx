import React, { useState } from 'react';
import { MessageCircle, HelpCircle, X } from 'lucide-react';

interface SpeechRecognitionCardProps {
  negativeSpeechDetected?: boolean;
}

export const SpeechRecognitionCard: React.FC<SpeechRecognitionCardProps> = ({
  negativeSpeechDetected = false,
}) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <div
        id="negative-language-card"
        className="w-full bg-white rounded-[22px] p-5 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.05)] border border-slate-100/90 relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Red message bubble icon */}
            <div className="text-[#f43f5e] flex items-center justify-center">
              <MessageCircle className="w-5 h-5 fill-[#f43f5e]/15 stroke-[2.2]" />
            </div>

            {/* Title */}
            <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">
              负面语言识别
            </h2>

            {/* Crown icon */}
            <span className="text-[16px] leading-none select-none drop-shadow-xs" title="VIP高级监测功能">
              👑
            </span>
          </div>

          {/* Help button */}
          <button
            id="speech-help-btn"
            type="button"
            onClick={() => setShowHelp(true)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1 rounded-full active:bg-slate-100"
            aria-label="查看负面语言识别说明"
          >
            <HelpCircle className="w-5 h-5 stroke-[1.8]" />
          </button>
        </div>

        {/* Card Body */}
        <div className="flex items-center justify-between pt-1 pb-1">
          {/* Status Text */}
          <div className="flex-1 flex flex-col items-start justify-center pl-2">
            {negativeSpeechDetected ? (
              <>
                <p className="text-[15px] font-semibold text-[#e05e5e] tracking-tight">
                  检测到稍显急躁的情绪语气
                </p>
                <p className="text-[12px] text-slate-400 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#e05e5e] animate-ping" />
                  建议深呼吸，放缓语速耐心鼓励~
                </p>
              </>
            ) : (
              <>
                <p className="text-[15px] font-medium text-slate-600 tracking-tight">
                  请保持正常辅导节奏~
                </p>
                <p className="text-[12px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <span className="inline-flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2fa599] animate-pulse"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2fa599] animate-pulse delay-150"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2fa599] animate-pulse delay-300"></span>
                  </span>
                  正在实时评估语境能量...
                </p>
              </>
            )}
          </div>

          {/* Chibi Girl Avatar on the Right */}
          <div className="w-[74px] h-[74px] rounded-full overflow-hidden shrink-0 border-2 border-amber-100/80 shadow-xs bg-amber-50 relative group">
            <img
              src="/tutor_avatar.jpg"
              alt="辅导助手"
              className="w-full h-full object-cover select-none transition-transform duration-300 group-hover:scale-105"
            />
            {/* Live active indicator badge */}
            <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs"></div>
          </div>
        </div>
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
                <h3 className="font-bold text-slate-800 text-base">负面语言识别说明</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                <strong>1. 语境能量实时评估：</strong>
                系统利用高精度声学模型分析辅导过程中的音量爆发度、语速急促度与音频频谱特征。
              </p>
              <p>
                <strong>2. 负面词汇与语气识别：</strong>
                精准捕捉否定式指责、讽刺与高声压打压式语言，帮助家长/辅导老师适时调节情绪。
              </p>
              <p>
                <strong>3. 科学学习区间：</strong>
                保持在30~50dB理想学习区间内，孩子认知负载更低，辅导效率更高。
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="mt-5 w-full py-3 bg-[#2fa599] text-white font-semibold rounded-xl active:opacity-90 shadow-md shadow-emerald-500/20"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </>
  );
};
