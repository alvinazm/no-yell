// @vitest-environment jsdom

import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import type { MonitorMode, TensionLevel } from './types';

const mocks = vi.hoisted(() => ({
  sessionStart: vi.fn(async (_mode: 'audio' | 'video' | 'both') => undefined),
  sessionStop: vi.fn(() => null),
  sessionPause: vi.fn(),
  sessionResume: vi.fn(),
  sessionIngestAudio: vi.fn(),
  sessionRecordIntervention: vi.fn(),
  audioStart: vi.fn(async () => undefined),
  audioStop: vi.fn(),
  videoStart: vi.fn(async (_video: HTMLVideoElement) => undefined),
  videoStop: vi.fn(),
  state: {
    mode: 'audio' as MonitorMode,
    videoError: null as string | null,
    currentDb: 0,
    dbHistory: [] as { t: number; db: number }[]
  }
}));

vi.mock('./hooks/useSession', () => ({
  useSession: () => ({
    status: 'idle',
    mode: mocks.state.mode,
    startedAt: null,
    durationSec: 0,
    tension: 0,
    level: 'green' as TensionLevel,
    currentAlert: null,
    yellowAlerts: 0,
    redAlerts: 0,
    videoAnomalyCount: 0,
    alertCount: 0,
    summary: null,
    avgDb: null,
    start: async (m: MonitorMode) => {
      mocks.state.mode = m;
      mocks.sessionStart(m);
    },
    stop: () => mocks.sessionStop(),
    pause: mocks.sessionPause,
    resume: mocks.sessionResume,
    dismissAlert: vi.fn(),
    ingestAudio: mocks.sessionIngestAudio,
    recordIntervention: mocks.sessionRecordIntervention,
    ingestVideo: vi.fn()
  })
}));

vi.mock('./hooks/useAudioMonitor', () => ({
  useAudioMonitor: () => ({
    currentDb: mocks.state.currentDb,
    avgDb: 0,
    dbHistory: mocks.state.dbHistory,
    spikeCount: 0,
    keywordHits: [],
    running: false,
    supported: true,
    error: null,
    lastTranscript: '',
    asrStatus: 'listening' as const,
    start: mocks.audioStart,
    stop: mocks.audioStop
  })
}));

vi.mock('./hooks/useVideoMonitor', () => ({
  useVideoMonitor: () => ({
    features: null,
    tension: 0,
    supported: true,
    error: mocks.state.videoError,
    start: mocks.videoStart,
    stop: mocks.videoStop
  })
}));

afterEach(() => {
  cleanup();
  mocks.sessionStart.mockClear();
  mocks.sessionStop.mockClear();
  mocks.sessionPause.mockClear();
  mocks.sessionResume.mockClear();
  mocks.sessionIngestAudio.mockClear();
  mocks.sessionRecordIntervention.mockClear();
  mocks.audioStart.mockClear();
  mocks.audioStop.mockClear();
  mocks.videoStart.mockClear();
  mocks.videoStop.mockClear();
  mocks.state.mode = 'audio';
  mocks.state.videoError = null;
  mocks.state.currentDb = 0;
  mocks.state.dbHistory = [];
});

describe('摄像头启动时序', () => {
  it('在 <video> 元素挂载后才启动摄像头', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /仅摄像头/ }));
    });

    const video = document.querySelector('video');
    expect(video).not.toBeNull();

    await waitFor(() => {
      expect(mocks.videoStart).toHaveBeenCalledTimes(1);
    });
    expect(mocks.videoStart.mock.calls[0]?.[0]).toBe(video);
  });

  it('暂停后点击继续只重新启动一次摄像头', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /仅摄像头/ }));
    });
    await waitFor(() => {
      expect(mocks.videoStart).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /暂停/ }));
    });
    expect(mocks.videoStop).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /继续/ }));
    });
    await waitFor(() => {
      expect(mocks.videoStart).toHaveBeenCalledTimes(2);
    });
  });

  it('摄像头权限被拒时回到选择页并提示权限错误', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    mocks.videoStart.mockRejectedValueOnce(new Error('NotAllowedError'));

    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /仅摄像头/ }));
    });

    await screen.findByText(/无法获取摄像头权限/);
    expect(screen.queryByRole('heading', { name: '辅导监测' })).toBeNull();
    expect(mocks.sessionStop).toHaveBeenCalledTimes(1);
  });

  it('表情分析模型失败时留在监测页并显示降级提示', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    mocks.state.videoError = '表情分析模型加载失败，情绪分析已降级';

    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /仅摄像头/ }));
    });

    expect(await screen.findByText(/表情分析模型加载失败/)).toBeTruthy();
    expect(document.querySelector('video')).not.toBeNull();
    expect(screen.queryByText(/无法获取摄像头权限/)).toBeNull();
  });

  it('点击结束辅导后显示报告弹窗', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /仅麦克风/ }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /结束辅导/ }));
    });

    expect(await screen.findByRole('heading', { name: '辅导监测报告' })).toBeTruthy();
    expect(mocks.sessionStop).toHaveBeenCalledTimes(1);
  });

  it('报告弹窗只提供返回首页按钮', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /仅麦克风/ }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /结束辅导/ }));
    });

    expect(await screen.findByRole('button', { name: /返回首页/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /开始新辅导/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^关闭$/ })).toBeNull();
  });

  it('点击返回首页后回到模式选择页', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /仅麦克风/ }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /结束辅导/ }));
    });

    await act(async () => {
      fireEvent.click(await screen.findByRole('button', { name: /返回首页/ }));
    });

    expect(screen.getByRole('heading', { name: '和颜悦色' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: '辅导监测报告' })).toBeNull();
  });

  it('点击暂停与继续时同步暂停与恢复会话计时', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /仅麦克风/ }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /暂停/ }));
    });
    expect(mocks.sessionPause).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /继续/ }));
    });
    expect(mocks.sessionResume).toHaveBeenCalledTimes(1);
  });

  it('分贝达到 80 时播放第 1 档告警音频并记录一次干预', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    const played: string[] = [];
    Object.defineProperty(globalThis, 'Audio', {
      configurable: true,
      value: class {
        src: string;
        constructor(url: string) {
          this.src = url;
        }
        play() {
          played.push(this.src);
          return Promise.resolve();
        }
        pause() {
          /* no-op */
        }
      }
    });

    mocks.state.currentDb = 82;
    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /仅麦克风/ }));
    });

    await waitFor(() => {
      expect(played).toHaveLength(1);
    });
    expect(played[0]).toBe('/bobao1.mp3');
    expect(mocks.sessionRecordIntervention).toHaveBeenCalledTimes(1);
  });

  it('每个新分贝样本都会喂给会话用于累计全程平均', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    mocks.state.dbHistory = [{ t: 1000, db: 50 }, { t: 1100, db: 70 }];

    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /仅麦克风/ }));
    });

    await waitFor(() => {
      expect(mocks.sessionIngestAudio).toHaveBeenCalled();
    });
    const lastCall = mocks.sessionIngestAudio.mock.calls.at(-1)?.[0];
    expect(lastCall.currentDb).toBe(70);
  });
});
