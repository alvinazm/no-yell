import React from 'react';

export const TipBanner: React.FC = () => {
  return (
    <div
      id="coaching-tip-box"
      className="w-full bg-amber-50/80 border border-amber-200/60 rounded-[20px] p-4 flex items-start gap-3 shadow-[0_2px_12px_-6px_rgba(217,119,6,0.06)] backdrop-blur-[2px]"
    >
      {/* Cartoon Girl Mini Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-amber-200/90 shadow-xs bg-amber-50 mt-0.5">
        <img
          src="/tutor_avatar.jpg"
          alt="辅导助手"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback SVG if image not found
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {/* Tip Text */}
      <div className="flex-1 text-[13px] leading-[1.65] text-[#854d0e] select-none font-normal">
        <span className="font-bold text-[#713f12]">辅导小贴士：</span>
        保持环境安静，使用
        <span className="underline decoration-[#854d0e] underline-offset-[3px] font-semibold mx-[1px]">
          标准普通话
        </span>
        ，可以更精准地捕捉负面语言，确保监测结果真实客观。
      </div>
    </div>
  );
};
