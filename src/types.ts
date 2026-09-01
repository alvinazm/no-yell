export type MonitorMode = 'audio' | 'video' | 'both';
export type SessionStatus = 'idle' | 'monitoring' | 'finished';
export type TensionLevel = 'green' | 'yellow' | 'red';

export interface VideoFeatures {
  browTension: number;   // 0-1
  mouthTension: number;  // 0-1
  headMotion: number;    // 0-1
}

export interface AudioMetrics {
  currentDb: number;
  avgDb: number;
  spikeCount: number;
  keywordHits: string[];
}

export interface AlertEvent {
  level: 'yellow' | 'red';
  tension: number;
  at: number;
}

export interface SessionSummary {
  id: string;
  mode: MonitorMode;
  startedAt: number;
  durationSec: number;
  avgDb: number | null;
  videoAnomalyCount: number;
  alertCount: number;
  score: number;
  grade: string;
}
