import type { SessionSummary } from '../types';

export interface ScoreInput {
  yellowAlerts: number;
  redAlerts: number;
  avgDb: number | null;
  spikeCount: number;
  durationSec: number;
}

export interface SessionMetrics {
  durationSec: number;
  avgDb: number | null;
  videoAnomalyCount: number;
  alertCount: number;
  score: number;
  grade: string;
}

const SHORT_SESSION_SEC = 300;

export function calculateScore(
  input: ScoreInput,
  videoAnomalyCount: number
): SessionMetrics {
  const alertCount = input.yellowAlerts + input.redAlerts;
  let deduction =
    input.yellowAlerts * 3 +
    input.redAlerts * 8 +
    input.spikeCount * 1;
  if (input.avgDb !== null && input.avgDb > 65) {
    deduction += Math.floor((input.avgDb - 65) / 5) * 2;
  }
  if (input.durationSec < SHORT_SESSION_SEC) {
    deduction = Math.round(deduction / 2);
  }
  const score = Math.max(20, 100 - deduction);
  const grade =
    score >= 85 ? '优秀' :
    score >= 70 ? '良好' :
    score >= 50 ? '需要留意' : '需要休息';
  return {
    durationSec: input.durationSec,
    avgDb: input.avgDb,
    videoAnomalyCount,
    alertCount,
    score,
    grade
  };
}

export function summaryFromMetrics(
  id: string,
  mode: SessionSummary['mode'],
  startedAt: number,
  metrics: SessionMetrics
): SessionSummary {
  return {
    id,
    mode,
    startedAt,
    durationSec: metrics.durationSec,
    avgDb: metrics.avgDb,
    videoAnomalyCount: metrics.videoAnomalyCount,
    alertCount: metrics.alertCount,
    score: metrics.score,
    grade: metrics.grade
  };
}
