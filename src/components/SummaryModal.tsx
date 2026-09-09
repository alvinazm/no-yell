import React from 'react';
import { Award, CheckCircle2, RotateCcw, X } from 'lucide-react';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  durationSeconds: number;
  averageDecibel: number;
  interventionCount: number;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  onRestart,
  durationSeconds,
  averageDecibel,
  interventionCount,
}) => {
  if (!isOpen) return null;

  const mins = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div
      id="summary-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="summary-modal-content"
        className="bg-white rounded-[28px] p-6 max-w-sm w-full shadow-2xl border border-slate-100 relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center mt-2 mb-5">
          <div className="w-14 h-14 bg-emerald-50 text-[#2fa599] rounded-2xl flex items-center justify-center mb-3 shadow-inner">
            <Award className="w-8 h-8 stroke-[2]" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">辅导监测报告</h3>
          <p className="text-xs text-slate-400 mt-1">本次辅导情绪平和，语言环境极佳</p>
        </div>

        {/* 3 Metric cards */}
        <div className="grid grid-cols-3 gap-2.5 bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-100 mb-4 text-center">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">总时长</div>
            <div className="text-lg font-bold text-[#2fa599] mt-0.5 font-mono">{timeFormatted}</div>
          </div>
          <div className="border-x border-slate-200/60">
            <div className="text-[11px] text-slate-400 font-medium">平均分贝</div>
            <div className="text-lg font-bold text-[#e5933a] mt-0.5">{averageDecibel} dB</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">干预次数</div>
            <div className="text-lg font-bold text-[#e05e5e] mt-0.5">{interventionCount} 次</div>
          </div>
        </div>

        {/* Performance evaluation */}
        <div className="space-y-2.5 text-xs text-slate-600 mb-6 bg-emerald-50/60 border border-emerald-100/80 p-3.5 rounded-2xl">
          <div className="flex items-center gap-2 text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>全程未出现高分贝情绪爆发</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>处于30~50dB「理想学习」区间</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>未监测到负面或指责性用语</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 py-3 px-4 bg-[#2fa599] hover:bg-[#288b81] active:opacity-95 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            开始新辅导
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium rounded-xl text-sm"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
