import { Mic, Camera, AudioLines } from 'lucide-react';
import type { MonitorMode } from '../types';

interface Props {
  onSelect: (mode: MonitorMode) => void;
  error?: string | null;
}

const MODES: {
  mode: MonitorMode;
  title: string;
  desc: string;
  Icon: typeof Mic;
  gradient: string;
}[] = [
  {
    mode: 'audio',
    title: '仅麦克风',
    desc: '分析音量、音量突增与负面用词',
    Icon: Mic,
    gradient: 'from-emerald-400 to-teal-500'
  },
  {
    mode: 'video',
    title: '仅摄像头',
    desc: '分析表情与动作，适合轻声辅导',
    Icon: Camera,
    gradient: 'from-sky-400 to-blue-500'
  },
  {
    mode: 'both',
    title: '声音 + 表情',
    desc: '声音与表情综合判断，识别最准',
    Icon: AudioLines,
    gradient: 'from-violet-400 to-fuchsia-500'
  }
];

export default function ModeSelector({ onSelect, error }: Props) {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-center mb-5">
        <h2 className="text-[20px] font-bold text-[#1e293b] tracking-tight">
          选择监测模式
        </h2>
        <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
          选择最适合本次辅导场景的方式开始监测
        </p>
      </div>

      <div className="w-full space-y-3">
        {MODES.map(({ mode, title, desc, Icon, gradient }) => (
          <button
            key={mode}
            type="button"
            onClick={() => onSelect(mode)}
            className="group w-full bg-white rounded-[20px] p-4 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] border border-slate-100/80 hover:border-slate-200 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] active:scale-[0.98] transition-all cursor-pointer text-left flex items-center gap-4"
          >
            <div
              className={`w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md`}
            >
              <Icon className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-bold text-slate-800 tracking-tight">
                {title}
              </div>
              <div className="text-[12px] text-slate-500 mt-0.5 leading-snug">
                {desc}
              </div>
            </div>
            <div className="w-7 h-7 shrink-0 rounded-full bg-slate-100 group-hover:bg-[#2fa599] group-hover:text-white text-slate-400 flex items-center justify-center transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 w-full text-[12px] text-[#e05e5e] bg-red-50 border border-red-100 rounded-xl p-3 leading-relaxed">
          {error}
        </p>
      )}

      <p className="mt-5 text-[11px] text-slate-400 text-center leading-relaxed max-w-[320px]">
        隐私承诺：所有分析仅在你的设备上实时进行<br />
        音视频不录制、不上传
      </p>
    </div>
  );
}
