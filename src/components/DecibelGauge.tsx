import { useMemo } from 'react';

interface Props {
  db: number;
}

const MIN_DB = 30;
const MAX_DB = 100;
const RANGE = MAX_DB - MIN_DB;

const CX = 190;
const CY = 172;
const R = 132;
const R_TRACK = R + 5;
const START_ANGLE = 206;
const END_ANGLE = -26;
const TOTAL_SPAN = START_ANGLE - END_ANGLE;

const SEGMENTS = [
  { from: 30, to: 50, color: '#10b981', dimColor: '#34d399', label: '理想学习' },
  { from: 50, to: 70, color: '#0284c7', dimColor: '#38bdf8', label: '正常交流' },
  { from: 70, to: 80, color: '#ea580c', dimColor: '#f59e0b', label: '认知干扰' },
  { from: 80, to: 100, color: '#dc2626', dimColor: '#f87171', label: '生理防御' }
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
    <div className="gauge-wrap">
      <svg viewBox="0 0 380 260" className="gauge-svg" role="img" aria-label={`当前分贝 ${displayValue}`}>
        <path
          d={backgroundArcD}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="8"
          strokeLinecap="round"
        />
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
        {ticks.map((t) => (
          <line
            key={t.id}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.color} strokeWidth={t.width}
            strokeLinecap="round" opacity={0.85}
          />
        ))}
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
        <text x={pos30.x - 14} y={pos30.y + 4} fill="#10b981" fontSize="11" fontWeight="700">30</text>
        <text x={pos50.x - 12} y={pos50.y - 4} fill="#0284c7" fontSize="11" fontWeight="700">50</text>
        <text x={pos70.x - 10} y={pos70.y - 4} fill="#ea580c" fontSize="11" fontWeight="700">70</text>
        <text x={pos80.x - 2} y={pos80.y - 4} fill="#dc2626" fontSize="11" fontWeight="700">80</text>
        <text x={pos100.x + 6} y={pos100.y + 4} fill="#dc2626" fontSize="11" fontWeight="700">100</text>
        <text x={CX} y={CY - 2} textAnchor="middle"
          fill={seg.color} fontSize="54" fontWeight="800"
          letterSpacing="-0.03em" className="gauge-value">{displayValue}</text>
        <text x={CX} y={CY + 26} textAnchor="middle"
          fill="#2fa599" fontSize="17" fontWeight="600"
          letterSpacing="0.04em">dB</text>
      </svg>
    </div>
  );
}
