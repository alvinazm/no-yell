import { describe, expect, it } from 'vitest';
import {
  HIGH_DB_THRESHOLD,
  VOICE_ALERT_COOLDOWN_MS,
  VOICE_ALERT_AUDIO_URLS,
  evaluateHighDbVoiceAlert,
  initialHighDbVoiceAlertState
} from './voiceAlert';

describe('evaluateHighDbVoiceAlert', () => {
  it('分贝达到 80 时首次播报第 1 档', () => {
    const result = evaluateHighDbVoiceAlert(
      HIGH_DB_THRESHOLD,
      initialHighDbVoiceAlertState(),
      1000
    );

    expect(result.shouldSpeak).toBe(true);
    expect(result.audioUrl).toBe(VOICE_ALERT_AUDIO_URLS[0]);
    expect(result.next.level).toBe(1);
  });

  it('30 秒冷却期内即使仍超 80 也不重复播报', () => {
    const first = evaluateHighDbVoiceAlert(
      85,
      initialHighDbVoiceAlertState(),
      0
    );
    const second = evaluateHighDbVoiceAlert(
      85,
      first.next,
      VOICE_ALERT_COOLDOWN_MS - 1000
    );

    expect(second.shouldSpeak).toBe(false);
  });

  it('持续超 80 分贝时按 1、2、3 档逐步升级', () => {
    const t0 = evaluateHighDbVoiceAlert(85, initialHighDbVoiceAlertState(), 0);
    const t1 = evaluateHighDbVoiceAlert(
      85,
      t0.next,
      VOICE_ALERT_COOLDOWN_MS
    );
    const t2 = evaluateHighDbVoiceAlert(
      85,
      t1.next,
      VOICE_ALERT_COOLDOWN_MS * 2
    );

    expect(t0.audioUrl).toBe(VOICE_ALERT_AUDIO_URLS[0]);
    expect(t1.audioUrl).toBe(VOICE_ALERT_AUDIO_URLS[1]);
    expect(t2.audioUrl).toBe(VOICE_ALERT_AUDIO_URLS[2]);
  });

  it('播完第 3 档后持续高压只重复最强档', () => {
    let state = initialHighDbVoiceAlertState();
    for (let i = 0; i < 4; i++) {
      const result = evaluateHighDbVoiceAlert(
        90,
        state,
        i * VOICE_ALERT_COOLDOWN_MS
      );
      state = result.next;
      if (i === 3) {
        expect(result.audioUrl).toBe(VOICE_ALERT_AUDIO_URLS[2]);
        expect(result.next.level).toBe(3);
      }
    }
  });

  it('音量回落过也不重置档位，第二次干预仍升级到第 2 档', () => {
    const t0 = evaluateHighDbVoiceAlert(85, initialHighDbVoiceAlertState(), 0);
    const quiet = evaluateHighDbVoiceAlert(60, t0.next, 1000);
    const again = evaluateHighDbVoiceAlert(
      85,
      quiet.next,
      VOICE_ALERT_COOLDOWN_MS * 2
    );
    const third = evaluateHighDbVoiceAlert(
      85,
      again.next,
      VOICE_ALERT_COOLDOWN_MS * 3
    );

    expect(quiet.shouldSpeak).toBe(false);
    expect(again.audioUrl).toBe(VOICE_ALERT_AUDIO_URLS[1]);
    expect(third.audioUrl).toBe(VOICE_ALERT_AUDIO_URLS[2]);
  });
});
