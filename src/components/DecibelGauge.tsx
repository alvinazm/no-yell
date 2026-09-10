import { useMemo, useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Info, AlertTriangle } from 'lucide-react';

interface Props {
  db: number;
}

const MIN_DB = 30;
const MAX_DB = 100;
const RANGE = MAX_DB - MIN_DB;

const CX = 190;
const CY = 168;
const R = 130;
const R_TRACK = R + 5;
const START_ANGLE = 206;
const END_ANGLE = -26;
const TOTAL_SPAN = START_ANGLE - END_ANGLE;

const SEGMENTS = [
  { from: 30, to: 50, color: '#10b981', dimColor: '#34d399', label: '理想学习', desc: '环境安静，思维专注', tag: '🍃 理想学习' },
  { from: 50, to: 70, color: '#0284c7', dimColor: '#38bdf8', label: '正常交流', desc: '温和探讨解题思路', tag: '💬 正常交流' },
  { from: 70, to: 80, color: '#ea580c', dimColor: '#f59e0b', label: '认知干扰', desc: '音量偏大，孩子易分心紧张', tag: '⚠️ 认知干扰' },
  { from: 80, to: 100, color: '#dc2626', dimColor: '#f87171', label: '生理防御', desc: '分贝超标，启动防吼守护', tag: '🚨 生理防御' }
] as const;

function segmentFor(db: number) {
  if (db <= 50) return SEGMENTS[0];
  if (db <= 70) return SEGMENTS[1];
  if (db <= 80) return SEGMENTS[2];
  return SEGMENTS[3];
}

function polar(cx: number, cy: number, radius: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(a), y: cy - radius * Math.sin(a) };
}

function dbToAngle(db: number) {
  const ratio = (db - MIN_DB) / RANGE;
  return START_ANGLE - ratio * TOTAL_SPAN;
}

function arcPath(radius: number, start: number, end: number) {
  const s = polar(CX, CY, radius, start);
  const e = polar(CX, CY, radius, end);
  const largeArc = Math.abs(start - end) > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
}

export default function DecibelGauge({ db }: Props) {
  const clamped = Math.min(Math.max(db, MIN_DB), MAX_DB);
  const seg = segmentFor(clamped);
  const displayValue = Math.round(clamped);
  const isHighlighted = clamped > MIN_DB;

  // 峰值记录（最近30秒滑动峰值）
  const [peakDb, setPeakDb] = useState(displayValue);
  const peakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (displayValue > peakDb) {
      setPeakDb(displayValue);
      if (peakTimeoutRef.current) clearTimeout(peakTimeoutRef.current);
      peakTimeoutRef.current = setTimeout(() => {
        setPeakDb(Math.max(displayValue, MIN_DB));
      }, 20000);
    }
  }, [displayValue, peakDb]);

  // 试听防吼叫干预音频状态
  const [isAuditioning, setIsAuditioning] = useState(false);
  const [showDbHelp, setShowDbHelp] = useState(false);
  const auditionAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleToggleAudition = () => {
    if (isAuditioning) {
      auditionAudioRef.current?.pause();
      auditionAudioRef.current = null;
      setIsAuditioning(false);
      return;
    }

    try {
      const audio = new Audio('/bobao1.mp3');
      auditionAudioRef.current = audio;
      setIsAuditioning(true);
      audio.onended = () => setIsAuditioning(false);
      audio.onerror = () => setIsAuditioning(false);
      void audio.play().catch(() => setIsAuditioning(false));
    } catch {
      setIsAuditioning(false);
    }
  };

  const ticks = useMemo(() => {
    const list = [];
    const totalTicks = 42;
    for (let i = 0; i <= totalTicks; i++) {
      const dbVal = MIN_DB + (i / totalTicks) * RANGE;
      const angle = dbToAngle(dbVal);
      let tickColor = '#34d399';
      if (dbVal > 50 && dbVal <= 70) tickColor = '#38bdf8';
      else if (dbVal > 70 && dbVal <= 80) tickColor = '#f59e0b';
      else if (dbVal > 80) tickColor = '#f87171';
      const rounded = Math.round(dbVal);
      const isMajor = rounded === 30 || rounded === 50 || rounded === 70 || rounded === 80 || rounded === 100;
      const innerR = isMajor ? R - 14 : R - 9;
      const outerR = R + 2;
      const pInner = polar(CX, CY, innerR, angle);
      const pOuter = polar(CX, CY, outerR, angle);
      list.push({
        id: i,
        x1: pInner.x, y1: pInner.y, x2: pOuter.x, y2: pOuter.y,
        color: tickColor, width: isMajor ? 2.2 : 1.3
      });
    }
    return list;
  }, []);

  const currentAngle = dbToAngle(clamped);
  const activeArcD = arcPath(R_TRACK, START_ANGLE, currentAngle);
  const idleArcD = arcPath(R_TRACK, START_ANGLE, START_ANGLE - 8);
  const backgroundArcD = arcPath(R, START_ANGLE, END_ANGLE);

  // 峰值标记位置
  const peakAngle = dbToAngle(peakDb);
  const peakPos = polar(CX, CY, R_TRACK + 4, peakAngle);

  const posIdeal = polar(CX, CY, R + 22, dbToAngle(40));
  const posNormal = polar(CX, CY, R + 22, dbToAngle(60));
  const posInterference = polar(CX, CY, R + 22, dbToAngle(75));
  const posDefense = polar(CX, CY, R + 22, dbToAngle(90));

  const pos30 = polar(CX, CY, R + 20, dbToAngle(30));
  const pos50 = polar(CX, CY, R + 20, dbToAngle(50));
  const pos70 = polar(CX, CY, R + 20, dbToAngle(70));
  const pos80 = polar(CX, CY, R + 20, dbToAngle(80));
  const pos100 = polar(CX, CY, R + 20, dbToAngle(100));

  return (
    <div className="gauge-wrap relative">
      <svg viewBox="0 0 380 258" className="gauge-svg" role="img" aria-label={`当前分贝 ${displayValue}`}>
        {/* 背景底槽弧 */}
        <path
          d={backgroundArcD}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* 动态脉冲光晕（当音量超过 75dB 时） */}
        {clamped >= 75 && (
          <circle
            cx={CX}
            cy={CY - 10}
            r="64"
            fill={clamped >= 80 ? '#f43f5e' : '#f59e0b'}
            opacity={clamped >= 80 ? '0.12' : '0.08'}
            className="animate-ping"
          />
        )}

        {/* 活跃弧线 */}
        {isHighlighted ? (
          <path
            d={activeArcD}
            fill="none"
            stroke={seg.color}
            strokeWidth="7"
            strokeLinecap="round"
            className="gauge-active-arc"
          />
        ) : (
          <path
            d={idleArcD}
            fill="none"
            stroke="#2fa599"
            strokeWidth="7"
            strokeLinecap="round"
          />
        )}

        {/* 峰值指示点 */}
        {peakDb > 40 && (
          <circle
            cx={peakPos.x}
            cy={peakPos.y}
            r="3.5"
            fill="#f43f5e"
            stroke="#ffffff"
            strokeWidth="1.5"
          >
            <title>{`最近峰值 ${peakDb} dB`}</title>
          </circle>
        )}

        {/* 刻度线 */}
        {ticks.map((t) => (
          <line
            key={t.id}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.color} strokeWidth={t.width}
            strokeLinecap="round" opacity={0.85}
          />
        ))}

        {/* 梯度文案 */}
        <text x={posIdeal.x - 6} y={posIdeal.y - 2} textAnchor="middle"
          fill="#10b981" fontSize="10" fontWeight="600"
          transform={`rotate(-28, ${posIdeal.x}, ${posIdeal.y})`}>理想学习</text>
        <text x={posNormal.x} y={posNormal.y - 4} textAnchor="middle"
          fill="#0284c7" fontSize="10" fontWeight="600"
          transform={`rotate(-4, ${posNormal.x}, ${posNormal.y})`}>正常交流</text>
        <text x={posInterference.x} y={posInterference.y - 2} textAnchor="middle"
          fill="#ea580c" fontSize="10" fontWeight="600"
          transform={`rotate(22, ${posInterference.x}, ${posInterference.y})`}>认知干扰</text>
        <text x={posDefense.x + 4} y={posDefense.y - 2} textAnchor="middle"
          fill="#dc2626" fontSize="10" fontWeight="600"
          transform={`rotate(38, ${posDefense.x}, ${posDefense.y})`}>生理防御</text>

        {/* 刻度数值 */}
        <text x={pos30.x - 14} y={pos30.y + 4} fill="#10b981" fontSize="11" fontWeight="700">30</text>
        <text x={pos50.x - 12} y={pos50.y - 4} fill="#0284c7" fontSize="11" fontWeight="700">50</text>
        <text x={pos70.x - 10} y={pos70.y - 4} fill="#ea580c" fontSize="11" fontWeight="700">70</text>
        <text x={pos80.x - 2} y={pos80.y - 4} fill="#dc2626" fontSize="11" fontWeight="700">80</text>
        <text x={pos100.x + 6} y={pos100.y + 4} fill="#dc2626" fontSize="11" fontWeight="700">100</text>

        {/* 中央实时分贝读数 */}
        <text x={CX} y={CY - 4} textAnchor="middle"
          fill={seg.color} fontSize="54" fontWeight="800"
          letterSpacing="-0.03em" className="gauge-value transition-colors duration-200">{displayValue}</text>
        <text x={CX} y={CY + 23} textAnchor="middle"
          fill="#2fa599" fontSize="16" fontWeight="600"
          letterSpacing="0.04em">dB</text>
      </svg>

      {/* 仪表盘下方场景标签与互动工具条 */}
      <div className="w-full max-w-[340px] -mt-3 flex items-center justify-between px-2 text-xs">
        {/* 当前声学状态胶囊 */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all shadow-2xs border"
          style={{
            backgroundColor: `${seg.color}14`,
            borderColor: `${seg.color}40`,
            color: seg.color
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: seg.color }}
          />
          <span>{seg.tag}</span>
          <span className="text-[11px] opacity-80 hidden sm:inline">· {seg.desc}</span>
        </div>

        {/* 80dB 语音干预试听与说明按钮 */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleAudition}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all active:scale-95 cursor-pointer ${
              isAuditioning
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : 'bg-white/80 border-slate-200/90 text-slate-600 hover:bg-slate-50'
            }`}
            title="试听超过 80dB 时的真人温和语音提醒"
          >
            {isAuditioning ? (
              <>
                <VolumeX className="w-3 h-3" />
                <span>停止</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3 h-3 text-[#2fa599]" />
                <span>试听80dB干预</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowDbHelp(true)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
            aria-label="查看分贝守护机制说明"
            title="分贝机制说明"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 峰值提示 */}
      {peakDb > 65 && (
        <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
          <span>本次监测最高音量：</span>
          <span className={`font-semibold ${peakDb >= 80 ? 'text-rose-600' : 'text-amber-600'}`}>
            {peakDb} dB
          </span>
          {peakDb >= 80 && (
            <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.2 rounded border border-rose-200">
              曾触发防吼叫提醒
            </span>
          )}
        </div>
      )}

      {/* 分贝说明弹窗 */}
      {showDbHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 text-left"
          onClick={() => setShowDbHelp(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-800 text-base">分贝梯级与儿童心理机制</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDbHelp(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <p className="font-semibold text-emerald-800">30 ~ 50 dB · 理想学习区</p>
                <p className="text-emerald-700/90 mt-0.5">相当于安静书房、图书馆，孩子大脑前额叶皮层注意力最高，极佳思考状态。</p>
              </div>
              <div className="p-2 rounded-xl bg-sky-50/70 border border-sky-100">
                <p className="font-semibold text-sky-800">50 ~ 70 dB · 正常交流区</p>
                <p className="text-sky-700/90 mt-0.5">日常正常说话语调，耐心解答与探讨，适合平稳引导。</p>
              </div>
              <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100">
                <p className="font-semibold text-amber-800">70 ~ 80 dB · 认知干扰区</p>
                <p className="text-amber-700/90 mt-0.5">音量开始急促升高，孩子开始感到无形压力，容易出现运算卡壳、不敢下笔。</p>
              </div>
              <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-100">
                <p className="font-semibold text-rose-800">80 ~ 100 dB · 生理防御区（防吼守护）</p>
                <p className="text-rose-700/90 mt-0.5">吼叫声激活孩子杏仁核恐惧回路，彻底关闭逻辑思考能力。系统将自动播放柔和真法语音干预（共3档升级），提醒您深呼吸暂停片刻。</p>
              </div>
            </div>

            <div className="mt-4 pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDbHelp(false)}
                className="px-4 py-2 bg-[#2fa599] text-white rounded-xl text-xs font-medium cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
