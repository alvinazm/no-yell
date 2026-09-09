import type { DbSample } from '../hooks/useAudioMonitor';

interface Props {
  history: DbSample[];
}

const WIDTH = 480;
const HEIGHT = 140;
const PAD_X = 28;
const PAD_Y = 16;
const PLOT_W = WIDTH - PAD_X * 2;
const PLOT_H = HEIGHT - PAD_Y * 2;
const MIN_DB = 30;
const MAX_DB = 100;
const RANGE = MAX_DB - MIN_DB;
const WINDOW_MS = 60_000;

const REFERENCE_LINES = [
  { db: 30, color: '#10b981' },
  { db: 50, color: '#0284c7' },
  { db: 70, color: '#ea580c' },
  { db: 80, color: '#dc2626' }
];

function dbToY(db: number): number {
  const clamped = Math.max(MIN_DB, Math.min(MAX_DB, db));
  return PAD_Y + (1 - (clamped - MIN_DB) / RANGE) * PLOT_H;
}

function tToX(t: number, now: number): number {
  const elapsed = Math.max(0, Math.min(WINDOW_MS, now - t));
  return PAD_X + (1 - elapsed / WINDOW_MS) * PLOT_W;
}

function colorFor(db: number): string {
  if (db < 50) return '#10b981';
  if (db < 70) return '#0284c7';
  if (db < 80) return '#ea580c';
  return '#dc2626';
}

export default function DecibelChart({ history }: Props) {
  const now = history.length > 0 ? history[history.length - 1].t : Date.now();
  const currentDb = history.length > 0 ? history[history.length - 1].db : 0;
  const lineColor = colorFor(currentDb);

  const points = history
    .map((s) => `${tToX(s.t, now).toFixed(1)},${dbToY(s.db).toFixed(1)}`)
    .join(' ');

  const areaPoints = points
    ? `${PAD_X},${PAD_Y + PLOT_H} ${points} ${PAD_X + PLOT_W},${PAD_Y + PLOT_H}`
    : '';

  return (
    <div className="w-full bg-white rounded-[20px] p-4 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] border border-slate-100/80">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-medium text-slate-500 tracking-tight">
          最近 60 秒分贝
        </span>
        <strong className="text-[16px] font-bold tracking-tight font-mono" style={{ color: lineColor }}>
          {currentDb.toFixed(0)} <span className="text-[11px] font-medium text-slate-400">dB</span>
        </strong>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto block"
        role="img"
        aria-label="分贝历史曲线"
      >
        {REFERENCE_LINES.map((ref) => (
          <g key={ref.db}>
            <line
              x1={PAD_X}
              y1={dbToY(ref.db)}
              x2={PAD_X + PLOT_W}
              y2={dbToY(ref.db)}
              stroke={ref.color}
              strokeOpacity={0.3}
              strokeDasharray="3 3"
              strokeWidth={1}
            />
            <text
              x={PAD_X - 6}
              y={dbToY(ref.db)}
              fontSize={9}
              fill={ref.color}
              dominantBaseline="middle"
              textAnchor="end"
              fontWeight={600}
            >
              {ref.db}
            </text>
          </g>
        ))}
        {areaPoints && (
          <polygon points={areaPoints} fill={lineColor} fillOpacity={0.12} />
        )}
        {points && (
          <polyline
            points={points}
            fill="none"
            stroke={lineColor}
            strokeWidth={1.8}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {points && (
          <circle
            cx={tToX(now, now)}
            cy={dbToY(currentDb)}
            r={3.5}
            fill={lineColor}
            stroke="#fff"
            strokeWidth={1.5}
          />
        )}
      </svg>
    </div>
  );
}
