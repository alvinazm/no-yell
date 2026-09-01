import { describe, it, expect } from 'vitest';
import {
  dbToTension, calculateAudioTension, calculateVideoTension,
  fuseTensions, smooth, levelForTension, canAlert,
  COOLDOWN_MS, YELLOW_THRESHOLD, RED_THRESHOLD
} from './emotionEngine';

describe('dbToTension', () => {
  it('maps spec anchor points', () => {
    expect(dbToTension(60)).toBe(0);
    expect(dbToTension(75)).toBe(50);
    expect(dbToTension(85)).toBe(100);
  });
  it('clamps below 60 and above 85', () => {
    expect(dbToTension(40)).toBe(0);
    expect(dbToTension(95)).toBe(100);
  });
});

describe('calculateAudioTension', () => {
  it('adds 15 per spike, capped at 100', () => {
    expect(calculateAudioTension(75, 1, false)).toBe(65);
    expect(calculateAudioTension(75, 4, false)).toBe(100);
  });
  it('adds 30 for keyword hit once', () => {
    expect(calculateAudioTension(60, 0, true)).toBe(30);
  });
});

describe('calculateVideoTension', () => {
  it('combines features with spec weights', () => {
    expect(calculateVideoTension({ browTension: 1, mouthTension: 0, headMotion: 0 })).toBe(40);
    expect(calculateVideoTension({ browTension: 0, mouthTension: 0.5, headMotion: 0.5 })).toBe(30);
  });
});

describe('fuseTensions', () => {
  it('uses single channel directly', () => {
    expect(fuseTensions(70, null)).toBe(70);
    expect(fuseTensions(null, 70)).toBe(70);
  });
  it('mixes 0.6 audio / 0.4 video', () => {
    expect(fuseTensions(100, 50)).toBe(80);
  });
});

describe('smooth', () => {
  it('returns average of window', () => {
    expect(smooth([10, 20, 30])).toBe(20);
  });
  it('returns latest value for empty window', () => {
    expect(smooth([])).toBe(0);
  });
});

describe('levelForTension', () => {
  it('maps thresholds', () => {
    expect(levelForTension(50)).toBe('green');
    expect(levelForTension(YELLOW_THRESHOLD)).toBe('yellow');
    expect(levelForTension(RED_THRESHOLD)).toBe('red');
  });
});

describe('canAlert', () => {
  it('allows alert after cooldown', () => {
    expect(canAlert('yellow', null, 1000)).toBe(true);
    expect(canAlert('yellow', 1000, 1000 + COOLDOWN_MS)).toBe(true);
    expect(canAlert('yellow', 1000, 1000 + COOLDOWN_MS - 1)).toBe(false);
  });
  it('never alerts on green', () => {
    expect(canAlert('green', null, 1000)).toBe(false);
  });
});
