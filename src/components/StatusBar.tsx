import React from 'react';
import { Wifi, Bluetooth } from 'lucide-react';

export const StatusBar: React.FC = () => {
  return (
    <div id="status-bar" className="w-full px-7 pt-3 pb-1 flex items-center justify-between text-slate-800 select-none text-[13px] font-semibold tracking-tight">
      {/* Left: Time and app icon */}
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-[15px] tracking-tight">09:37</span>
        <div className="w-4 h-4 rounded-[4px] bg-[#07c160] flex items-center justify-center text-white text-[9px] font-bold shadow-xs">
          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2v-6h2v6z" />
          </svg>
        </div>
      </div>

      {/* Right: Connectivity and Battery */}
      <div className="flex items-center gap-1.5 text-slate-700">
        <Bluetooth className="w-3.5 h-3.5 stroke-[2.2]" />
        <Wifi className="w-3.5 h-3.5 stroke-[2.2]" />
        
        {/* 5G Label & Cellular Signal */}
        <div className="flex items-center gap-0.5">
          <span className="text-[10px] font-extrabold text-slate-800 scale-90">5G</span>
          <div className="flex items-end gap-[1.5px] h-3 ml-0.5">
            <div className="w-[2.5px] h-[4px] bg-slate-800 rounded-[0.5px]"></div>
            <div className="w-[2.5px] h-[6px] bg-slate-800 rounded-[0.5px]"></div>
            <div className="w-[2.5px] h-[9px] bg-slate-800 rounded-[0.5px]"></div>
            <div className="w-[2.5px] h-[12px] bg-slate-800 rounded-[0.5px]"></div>
          </div>
        </div>

        {/* 5G Label 2 & Signal */}
        <div className="flex items-center gap-0.5">
          <span className="text-[10px] font-extrabold text-slate-800 scale-90">5G</span>
          <div className="flex items-end gap-[1.5px] h-3 ml-0.5">
            <div className="w-[2.5px] h-[4px] bg-slate-800 rounded-[0.5px]"></div>
            <div className="w-[2.5px] h-[6px] bg-slate-800 rounded-[0.5px]"></div>
            <div className="w-[2.5px] h-[9px] bg-slate-800 rounded-[0.5px]"></div>
            <div className="w-[2.5px] h-[12px] bg-slate-300 rounded-[0.5px]"></div>
          </div>
        </div>

        {/* Battery with percentage */}
        <div className="flex items-center ml-0.5">
          <div className="relative border border-slate-800 rounded-[3.5px] px-[2px] py-[0.5px] flex items-center justify-center bg-slate-800 text-white min-w-[28px] h-[14px]">
            <span className="text-[9px] font-bold leading-none scale-90">74</span>
            {/* Battery nipple */}
            <div className="absolute -right-[2.5px] top-[3px] w-[1.5px] h-[6px] bg-slate-800 rounded-r-[1px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
