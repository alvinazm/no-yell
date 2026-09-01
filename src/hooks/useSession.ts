import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  MonitorMode, SessionStatus, TensionLevel,
  AudioMetrics, VideoFeatures, SessionSummary
} from '../types';
import {
  calculateAudioTension, calculateVideoTension, fuseTensions,
  smooth, levelForTension, canAlert, RED_THRESHOLD
} from '../lib/emotionEngine';
import { pickScript } from '../lib/speech';
import { calculateScore, summaryFromMetrics } from '../lib/scoring';
import { sessionStore } from '../lib/storage';

export interface UseSession {
  status: SessionStatus;
  mode: MonitorMode;
  startedAt: number | null;
  durationSec: number;
  tension: number;
  level: TensionLevel;
  currentAlert: string | null;
  yellowAlerts: number;
  redAlerts: number;
  videoAnomalyCount: number;
  alertCount: number;
  summary: SessionSummary | null;
  start(mode: MonitorMode): Promise<void>;
  stop(): SessionSummary | null;
  dismissAlert(): void;
  ingestAudio(metrics: AudioMetrics): void;
  ingestVideo(features: VideoFeatures): void;
}

export function useSession(): UseSession {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [mode, setMode] = useState<MonitorMode>('audio');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [durationSec, setDurationSec] = useState(0);
  const [tension, setTension] = useState(0);
  const [level, setLevel] = useState<TensionLevel>('green');
  const [currentAlert, setCurrentAlert] = useState<string | null>(null);
  const [yellowAlerts, setYellowAlerts] = useState(0);
  const [redAlerts, setRedAlerts] = useState(0);
  const [videoAnomalyCount, setVideoAnomalyCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  const timerRef = useRef<number | null>(null);
  const lastAlertAtRef = useRef<number | null>(null);
  const usedScriptsRef = useRef<string[]>([]);
  const tensionBufRef = useRef<number[]>([]);
  const avgDbRef = useRef<number | null>(null);
  const spikeRef = useRef(0);
  const audioTensionRef = useRef<number | null>(null);
  const videoTensionRef = useRef<number | null>(null);
  const anomalyRef = useRef(0);
  const anomalyActiveRef = useRef(false);

  const ingestAudio = useCallback((metrics: AudioMetrics) => {
    avgDbRef.current = metrics.avgDb;
    spikeRef.current = metrics.spikeCount;
    audioTensionRef.current = calculateAudioTension(
      metrics.currentDb,
      metrics.spikeCount,
      metrics.keywordHits.length > 0
    );
  }, []);

  const ingestVideo = useCallback((features: VideoFeatures) => {
    const v = calculateVideoTension(features);
    videoTensionRef.current = v;
    if (v >= RED_THRESHOLD) {
      if (!anomalyActiveRef.current) {
        anomalyRef.current += 1;
        setVideoAnomalyCount(anomalyRef.current);
      }
      anomalyActiveRef.current = true;
    } else {
      anomalyActiveRef.current = false;
    }
  }, []);

  const dismissAlert = useCallback(() => setCurrentAlert(null), []);

  const start = useCallback(async (m: MonitorMode) => {
    setMode(m);
    setStartedAt(Date.now());
    setDurationSec(0);
    setSummary(null);
    setYellowAlerts(0);
    setRedAlerts(0);
    setVideoAnomalyCount(0);
    setAlertCount(0);
    setTension(0);
    setLevel('green');
    avgDbRef.current = null;
    spikeRef.current = 0;
    anomalyRef.current = 0;
    anomalyActiveRef.current = false;
    tensionBufRef.current = [];
    usedScriptsRef.current = [];
    lastAlertAtRef.current = null;
    setStatus('monitoring');
    timerRef.current = window.setInterval(() => {
      setDurationSec((s) => s + 1);
    }, 1000);
  }, []);

  const stop = useCallback((): SessionSummary | null => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    const endedAt = Date.now();
    const secs = startedAt === null ? 0 : Math.round((endedAt - startedAt) / 1000);
    const metrics = calculateScore(
      {
        yellowAlerts,
        redAlerts,
        avgDb: avgDbRef.current,
        spikeCount: spikeRef.current,
        durationSec: secs
      },
      anomalyRef.current
    );
    const s = summaryFromMetrics(
      crypto.randomUUID(),
      mode,
      startedAt ?? endedAt,
      metrics
    );
    sessionStore.saveSession(s);
    setSummary(s);
    setStatus('finished');
    return s;
  }, [startedAt, mode, yellowAlerts, redAlerts]);

  useEffect(() => {
    if (status !== 'monitoring') return;
    const id = window.setInterval(() => {
      const fused = fuseTensions(audioTensionRef.current, videoTensionRef.current);
      tensionBufRef.current.push(fused);
      if (tensionBufRef.current.length > 3) tensionBufRef.current.shift();
      const final = smooth(tensionBufRef.current);
      setTension(final);
      setLevel(levelForTension(final));
    }, 200);
    return () => window.clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (level === 'green' || status !== 'monitoring') return;
    const now = Date.now();
    if (!canAlert(level, lastAlertAtRef.current, now)) return;
    lastAlertAtRef.current = now;
    if (level === 'yellow') {
      setYellowAlerts((n) => n + 1);
    } else {
      setRedAlerts((n) => n + 1);
    }
    setAlertCount((n) => n + 1);
    const script = pickScript(level, usedScriptsRef.current);
    usedScriptsRef.current.push(script);
    setCurrentAlert(script);
  }, [level, status]);

  return {
    status, mode, startedAt, durationSec, tension, level, currentAlert,
    yellowAlerts, redAlerts, videoAnomalyCount, alertCount, summary,
    start, stop, dismissAlert, ingestAudio, ingestVideo
  };
}
