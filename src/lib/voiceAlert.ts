export const HIGH_DB_THRESHOLD = 80;
// 30秒内只干预一次
export const VOICE_ALERT_COOLDOWN_MS = 5_000;

export const VOICE_ALERT_AUDIO_URLS = [
  '/bobao1.mp3',
  '/bobao2.mp3',
  '/bobao3.mp3'
] as const;

export interface HighDbVoiceAlertState {
  /** 最近一次播报的档位：0 = 未开始，1~3 = 第几档 */
  level: number;
  lastSpokenAt: number | null;
}

export interface HighDbVoiceAlertResult {
  next: HighDbVoiceAlertState;
  shouldSpeak: boolean;
  audioUrl?: string;
}

export function initialHighDbVoiceAlertState(): HighDbVoiceAlertState {
  return { level: 0, lastSpokenAt: null };
}

export function evaluateHighDbVoiceAlert(
  db: number,
  state: HighDbVoiceAlertState,
  now: number
): HighDbVoiceAlertResult {
  if (db < HIGH_DB_THRESHOLD) {
    // 短促回落不重置档位：本次辅导内的第 1、2、3 次干预依次升级。
    return { next: state, shouldSpeak: false };
  }

  if (
    state.lastSpokenAt !== null &&
    now - state.lastSpokenAt < VOICE_ALERT_COOLDOWN_MS
  ) {
    return { next: state, shouldSpeak: false };
  }

  const level = Math.min(state.level + 1, VOICE_ALERT_AUDIO_URLS.length);
  return {
    next: { level, lastSpokenAt: now },
    shouldSpeak: true,
    audioUrl: VOICE_ALERT_AUDIO_URLS[level - 1]
  };
}
