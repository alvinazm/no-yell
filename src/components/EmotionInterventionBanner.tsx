import React from 'react';
import { ShieldAlert, Sparkles, X, HeartHandshake, Volume2 } from 'lucide-react';
import type { EmotionAlert } from '../types/python-monitor';

interface EmotionInterventionBannerProps {
  alert: EmotionAlert | null;
  onDismiss: () => void;
}

export const EmotionInterventionBanner: React.FC<EmotionInterventionBannerProps> = ({
  alert,
  onDismiss
}) => {
  if (!alert || !alert.hasNegative) return null;

  const isRed = alert.level === 'red';

  return (
    <div
      id="emotion-intervention-banner"
      role="alert"
      aria-live="assertive"
      className={`w-full rounded-[22px] p-4.5 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 border ${
        isRed
          ? 'bg-gradient-to-br from-rose-50 via-white to-amber-50/60 border-rose-200/90 shadow-rose-500/10'
          : 'bg-gradient-to-br from-amber-50 via-white to-emerald-50/60 border-amber-200/90 shadow-amber-500/10'
      }`}
    >
      {/* 头部：分类标签与关闭按钮 */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center ${
              isRed ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
            } shadow-xs`}
          >
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-slate-800 tracking-tight">
                语言情绪实时预警
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide ${
                  isRed
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                }`}
              >
                {alert.categoryName || '负向沟通倾向'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="关闭提醒"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 识别到的高危言论高亮 */}
      <div className="mt-3 bg-white/90 rounded-xl p-2.5 border border-slate-100 text-xs text-slate-700 flex flex-col gap-1">
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            刚刚识别到的原话：
          </span>
          {alert.currentDb > 0 && (
            <span className="font-mono text-slate-500">
              音量 {Math.round(alert.currentDb)} dB
            </span>
          )}
        </div>
        <p className="font-medium text-slate-800 pl-0.5 leading-relaxed">
          “{alert.text}”
        </p>
        {alert.matchedPhrases.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className="text-[10px] text-slate-400">预警词：</span>
            {alert.matchedPhrases.map((phrase, idx) => (
              <span
                key={idx}
                className="inline-block px-1.5 py-0.2 bg-rose-100/90 text-rose-700 rounded text-[10px] font-semibold"
              >
                {phrase}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 核心价值：温和替代话术推荐（平替） */}
      <div className="mt-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3 text-slate-800">
        <div className="flex items-center gap-1.5 text-emerald-800 text-[12px] font-bold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>建议改用平和引导话术：</span>
        </div>
        <p className="text-[13px] font-semibold text-emerald-950 mt-1.5 leading-relaxed tracking-tight pl-1 bg-white/70 py-1.5 px-2.5 rounded-xl border border-emerald-100">
          {alert.replacementSuggestion}
        </p>
        {alert.coachTip && (
          <p className="text-[11px] text-emerald-700/90 mt-2 pl-1 leading-normal flex items-start gap-1">
            <HeartHandshake className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
            <span>{alert.coachTip}</span>
          </p>
        )}
      </div>

      {/* 底部安抚与行动 */}
      <div className="mt-3 flex items-center justify-between pt-1">
        <span className="text-[11px] text-slate-400">
          🌱 辅导作业，也是和孩子共同成长的过程
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs px-3 py-1.5 bg-[#2fa599] hover:bg-[#22a091] text-white font-medium rounded-xl active:scale-95 transition-all shadow-xs"
        >
          我知道了，放平心态
        </button>
      </div>
    </div>
  );
};
