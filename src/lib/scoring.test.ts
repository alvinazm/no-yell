import { describe, it, expect } from 'vitest';
import { calculateScore } from './scoring';

describe('calculateScore', () => {
  it('starts at 100 for a calm session', () => {
    const r = calculateScore({ yellowAlerts: 0, redAlerts: 0, avgDb: 55, spikeCount: 0, durationSec: 600 }, 0);
    expect(r.score).toBe(100);
    expect(r.grade).toBe('优秀');
  });
  it('deducts per alert', () => {
    const r = calculateScore({ yellowAlerts: 2, redAlerts: 1, avgDb: 55, spikeCount: 0, durationSec: 600 }, 0);
    expect(r.score).toBe(86);
  });
  it('deducts for loud average db', () => {
    const r = calculateScore({ yellowAlerts: 0, redAlerts: 0, avgDb: 75, spikeCount: 0, durationSec: 600 }, 0);
    expect(r.score).toBe(96);
  });
  it('deducts per spike and floors at 20', () => {
    const r = calculateScore({ yellowAlerts: 10, redAlerts: 10, avgDb: 95, spikeCount: 10, durationSec: 600 }, 0);
    expect(r.score).toBe(20);
  });
  it('halves deductions under 5 minutes', () => {
    const r = calculateScore({ yellowAlerts: 2, redAlerts: 0, avgDb: 55, spikeCount: 0, durationSec: 200 }, 0);
    expect(r.score).toBe(97);
  });
  it('reports all metrics', () => {
    const r = calculateScore({ yellowAlerts: 1, redAlerts: 0, avgDb: 60, spikeCount: 2, durationSec: 600 }, 3);
    expect(r).toMatchObject({
      durationSec: 600, avgDb: 60, videoAnomalyCount: 3,
      alertCount: 1, grade: '优秀'
    });
  });
});
