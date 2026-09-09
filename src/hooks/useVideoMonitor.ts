import { useCallback, useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { VideoFeatures } from '../types';
import { calculateVideoTension } from '../lib/emotionEngine';

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';

export interface UseVideoMonitor {
  features: VideoFeatures | null;
  tension: number;
  supported: boolean;
  error: string | null;
  start(video: HTMLVideoElement): Promise<void>;
  stop(): void;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function useVideoMonitor(): UseVideoMonitor {
  const [features, setFeatures] = useState<VideoFeatures | null>(null);
  const [tension, setTension] = useState(0);
  const [supported] = useState(() =>
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
  );
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const sessionIdRef = useRef(0);
  const lastNoseRef = useRef<{ x: number; y: number } | null>(null);
  const lastVideoTimeRef = useRef(-1);

  const stop = useCallback(() => {
    sessionIdRef.current += 1;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
  }, []);

  const start = useCallback(async (video: HTMLVideoElement) => {
    setError(null);
    const sessionId = ++sessionIdRef.current;

    // 阶段 1：只负责打开摄像头并显示画面。任何失败都直接抛给调用方，
    // 由界面层提示权限/设备错误，不在这里伪装成模型降级。
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
    } catch (err) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      throw err;
    }

    // 阶段 2：异步加载表情分析模型。失败只降级为“无表情分析”，
    // 不影响已经打开的摄像头画面，也不向外抛错。
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numFaces: 1
      });

      if (sessionIdRef.current !== sessionId) {
        landmarker.close();
        return;
      }
      landmarkerRef.current = landmarker;

      const tick = () => {
        rafRef.current = requestAnimationFrame(tick);
        if (video.currentTime === lastVideoTimeRef.current) return;
        lastVideoTimeRef.current = video.currentTime;
        const result = landmarker.detectForVideo(video, performance.now());
        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          const lm = result.faceLandmarks[0];
          const leftBrowInner = lm[105];
          const rightBrowInner = lm[334];
          const leftEye = lm[33];
          const rightEye = lm[263];
          const mouthLeft = lm[61];
          const mouthRight = lm[291];
          const upperLip = lm[0];
          const nose = lm[1];

          const browTension = clamp01(
            (leftBrowInner.y - leftEye.y + rightBrowInner.y - rightEye.y) / 0.08
          );
          const mouthDrop = (mouthLeft.y + mouthRight.y) / 2 - upperLip.y;
          const mouthTension = clamp01(mouthDrop > 0 ? mouthDrop / 0.05 : 0);
          let headMotion = 0;
          if (lastNoseRef.current) {
            const dx = Math.abs(nose.x - lastNoseRef.current.x);
            const dy = Math.abs(nose.y - lastNoseRef.current.y);
            headMotion = clamp01((dx + dy) / 0.05);
          }
          lastNoseRef.current = { x: nose.x, y: nose.y };

          const f: VideoFeatures = { browTension, mouthTension, headMotion };
          setFeatures(f);
          setTension(calculateVideoTension(f));
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      if (sessionIdRef.current === sessionId) {
        setError('表情分析模型加载失败，情绪分析已降级');
      }
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { features, tension, supported, error, start, stop };
}
