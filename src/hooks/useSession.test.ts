// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSession } from './useSession';

afterEach(() => {
  vi.useRealTimers();
});

describe('useSession 暂停/继续', () => {
  it('暂停期间辅导时长不再增长，继续后从暂停处恢复累计', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSession());

    await act(async () => {
      await result.current.start('audio');
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.durationSec).toBe(3);

    act(() => {
      result.current.pause();
    });
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.durationSec).toBe(3);

    act(() => {
      result.current.resume();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.durationSec).toBe(5);
  });

  it('暂停时间不计入结束报告的总时长', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSession());

    await act(async () => {
      await result.current.start('audio');
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => {
      result.current.pause();
    });
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.summary?.durationSec).toBe(3);
  });

  it('平均分贝按整场采样累计，而不是取最后一次传入的滚动均值', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSession());

    await act(async () => {
      await result.current.start('audio');
    });
    act(() => {
      result.current.ingestAudio({
        currentDb: 50,
        avgDb: 999,
        spikeCount: 0,
        keywordHits: []
      });
      result.current.ingestAudio({
        currentDb: 70,
        avgDb: 999,
        spikeCount: 0,
        keywordHits: []
      });
      result.current.ingestAudio({
        currentDb: 60,
        avgDb: 999,
        spikeCount: 0,
        keywordHits: []
      });
    });
    act(() => {
      result.current.stop();
    });

    expect(result.current.summary?.avgDb).toBe(60);
  });

  it('只有实际语音干预才计入干预次数，紧张度波动本身不重复累计', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSession());

    await act(async () => {
      await result.current.start('audio');
    });
    act(() => {
      result.current.ingestAudio({
        currentDb: 90,
        avgDb: 90,
        spikeCount: 1,
        keywordHits: []
      });
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // 紧张度进入红色本身不应该凭空增加干预次数
    expect(result.current.alertCount).toBe(0);

    act(() => {
      result.current.recordIntervention();
      result.current.recordIntervention();
    });
    expect(result.current.alertCount).toBe(2);

    act(() => {
      result.current.stop();
    });
    expect(result.current.summary?.alertCount).toBe(2);
  });
});
