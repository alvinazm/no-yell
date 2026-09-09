import React from 'react';
import { Play } from 'lucide-react';

interface ActionControlsProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onEndCoaching: () => void;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  isPaused,
  onTogglePause,
  onEndCoaching,
}) => {
  return (
    <div id="action-controls-container" className="w-full pt-3 pb-1 select-none">
      {/* Two pill action buttons */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: 暂停 / 继续 */}
        <button
          id="btn-pause-toggle"
          type="button"
          onClick={onTogglePause}
          className="w-full h-[58px] bg-[#22a091] hover:bg-[#1f9385] active:scale-[0.98] text-white font-medium text-[17px] tracking-wide rounded-full flex items-center justify-center gap-2.5 shadow-[0_8px_20px_-6px_rgba(34,160,145,0.45)] transition-all cursor-pointer"
        >
          {isPaused ? (
            <>
              <Play className="w-5 h-5 fill-white stroke-[2.2]" />
              <span>继续</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-[3px]">
                <div className="w-[3px] h-[16px] bg-white rounded-full"></div>
                <div className="w-[3px] h-[16px] bg-white rounded-full"></div>
              </div>
              <span>暂停</span>
            </>
          )}
        </button>

        {/* Right: 结束辅导 */}
        <button
          id="btn-end-coaching"
          type="button"
          onClick={onEndCoaching}
          className="w-full h-[58px] bg-[#e83a38] hover:bg-[#db312f] active:scale-[0.98] text-white font-medium text-[17px] tracking-wide rounded-full flex items-center justify-center gap-2.5 shadow-[0_8px_20px_-6px_rgba(232,58,56,0.45)] transition-all cursor-pointer"
        >
          <div className="w-[14px] h-[14px] bg-white rounded-[3px]"></div>
          <span>结束辅导</span>
        </button>
      </div>

    </div>
  );
};
