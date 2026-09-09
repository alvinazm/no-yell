// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useVideoMonitor } from './useVideoMonitor';

const vision = vi.hoisted(() => ({
  getUserMedia: vi.fn(),
  forVisionTasks: vi.fn(),
  createFromOptions: vi.fn()
}));

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: { forVisionTasks: vision.forVisionTasks },
  FaceLandmarker: { createFromOptions: vision.createFromOptions }
}));

function makeVideo() {
  const play = vi.fn(async () => undefined);
  return { srcObject: null, currentTime: 0, play } as unknown as HTMLVideoElement;
}

function makeStream() {
  return { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
}

beforeEach(() => {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vision.getUserMedia }
  });
});

afterEach(() => {
  vision.getUserMedia.mockReset();
  vision.forVisionTasks.mockReset();
  vision.createFromOptions.mockReset();
});

describe('useVideoMonitor 摄像头与模型解耦', () => {
  it('模型加载失败时画面保留、不向外抛错，只标记分析降级', async () => {
    const stream = makeStream();
    vision.getUserMedia.mockResolvedValue(stream);
    vision.forVisionTasks.mockResolvedValue({});
    vision.createFromOptions.mockRejectedValue(new Error('model download failed'));

    const { result } = renderHook(() => useVideoMonitor());
    const video = makeVideo();

    await act(async () => {
      await result.current.start(video);
    });

    expect(video.srcObject).toBe(stream);
    expect(result.current.error).toContain('表情分析模型加载失败');
    expect(result.current.features).toBeNull();
  });

  it('摄像头权限被拒时向外抛错，但不伪装成模型降级', async () => {
    vision.getUserMedia.mockRejectedValue(new Error('NotAllowedError'));

    const { result } = renderHook(() => useVideoMonitor());
    const video = makeVideo();

    await act(async () => {
      await expect(result.current.start(video)).rejects.toThrow('NotAllowedError');
    });

    expect(result.current.error).toBeNull();
  });
});
