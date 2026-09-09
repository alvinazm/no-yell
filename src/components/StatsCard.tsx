import React from 'react';

interface StatsCardProps {
  durationSeconds: number;
  averageDecibel: number;
  interventionCount: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  durationSeconds,
  averageDecibel,
  interventionCount,
}) => {
  // Format seconds to mm:ss
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div
      id="stats-summary-card"
      className="w-full bg-white rounded-[22px] px-3 py-4.5 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.05)] border border-slate-100/90"
    >
      <div className="grid grid-cols-3 divide-x divide-slate-100 items-center text-center">
        {/* Column 1: 辅导时长 */}
        <div className="flex flex-col items-center justify-center px-2">
          <span className="text-[13px] font-medium text-slate-500 mb-1 tracking-tight">
            辅导时长
          </span>
          <span className="text-[26px] font-bold text-[#2fa599] tracking-tight font-mono">
            {formatTime(durationSeconds)}
          </span>
        </div>

        {/* Column 2: 平均分贝 */}
        <div className="flex flex-col items-center justify-center px-2">
          <span className="text-[13px] font-medium text-slate-500 mb-1 tracking-tight">
            平均分贝
          </span>
          <span className="text-[26px] font-bold text-[#e5933a] tracking-tight">
            {averageDecibel} <span className="text-[20px] font-semibold font-sans">dB</span>
          </span>
        </div>

        {/* Column 3: 干预次数 */}
        <div className="flex flex-col items-center justify-center px-2">
          <span className="text-[13px] font-medium text-slate-500 mb-1 tracking-tight">
            干预次数
          </span>
          <span className="text-[26px] font-bold text-[#e05e5e] tracking-tight">
            {interventionCount} <span className="text-[20px] font-semibold font-sans">次</span>
          </span>
        </div>
      </div>
    </div>
  );
};
