import type { TensionLevel, VideoFeatures } from '../types';

export const COOLDOWN_MS = 30_000;
export const YELLOW_THRESHOLD = 60;
export const RED_THRESHOLD = 80;

export function dbToTension(db: number): number {
  if (db <= 60) return 0;
  if (db >= 85) return 100;
  if (db <= 75) return ((db - 60) / 15) * 50;
  return 50 + ((db - 75) / 10) * 50;
}

export function calculateAudioTension(
  currentDb: number,
  spikeCount: number,
  keywordHit: boolean
): number {
  let t = dbToTension(currentDb) + spikeCount * 15 + (keywordHit ? 30 : 0);
  return Math.min(100, Math.max(0, t));
}

export function calculateVideoTension(features: VideoFeatures): number {
  return Math.min(
    100,
    Math.max(0, features.browTension * 40 + features.mouthTension * 30 + features.headMotion * 30)
  );
}

export function fuseTensions(audio: number | null, video: number | null): number {
  if (audio === null && video === null) return 0;
  if (audio === null) return video!;
  if (video === null) return audio;
  return audio * 0.6 + video * 0.4;
}

export function smooth(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function levelForTension(tension: number): TensionLevel {
  if (tension >= RED_THRESHOLD) return 'red';
  if (tension >= YELLOW_THRESHOLD) return 'yellow';
  return 'green';
}

export function canAlert(
  level: TensionLevel,
  lastAlertAt: number | null,
  now: number
): boolean {
  if (level === 'green') return false;
  if (lastAlertAt === null) return true;
  return now - lastAlertAt >= COOLDOWN_MS;
}
