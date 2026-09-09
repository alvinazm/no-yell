import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  MonitorMode, SessionStatus, TensionLevel,
  AudioMetrics, VideoFeatures, SessionSummary
} from '../types';
import {
  calculateAudioTension, calculateVideoTension, fuseTensions,
  smooth, levelForTension, RED_THRESHOLD
} from '../lib/emotionEngine';
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
  avgDb: number | null;
  start(mode: MonitorMode): Promise<void>;
  stop(): SessionSummary | null;
  pause(): void;
  resume(): void;
  dismissAlert(): void;
  recordIntervention(): void;
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
  const [avgDb, setAvgDb] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const activeMsRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const tensionBufRef = useRef<number[]>([]);
  const avgDbRef = useRef<number | null>(null);
  const avgDbSumRef = useRef(0);
  const avgDbCountRef = useRef(0);
  const spikeRef = useRef(0);
  const audioTensionRef = useRef<number | null>(null);
  const videoTensionRef = useRef<number | null>(null);
  const anomalyRef = useRef(0);
  const anomalyActiveRef = useRef(false);

  const ingestAudio = useCallback((metrics: AudioMetrics) => {
    avgDbSumRef.current += metrics.currentDb;
    avgDbCountRef.current += 1;
    const sessionAvg = avgDbSumRef.current / avgDbCountRef.current;
    avgDbRef.current = sessionAvg;
    setAvgDb(sessionAvg);
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

  const recordIntervention = useCallback(() => {
    setRedAlerts((n) => n + 1);
    setAlertCount((n) => n + 1);
  }, []);

  const syncDuration = useCallback(() => {
    const runningMs =
      segmentStartRef.current === null ? 0 : Date.now() - segmentStartRef.current;
    setDurationSec(Math.floor((activeMsRef.current + runningMs) / 1000));
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current !== null) return;
    timerRef.current = window.setInterval(syncDuration, 1000);
  }, [syncDuration]);

  const start = useCallback(async (m: MonitorMode) => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
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
    avgDbSumRef.current = 0;
    avgDbCountRef.current = 0;
    setAvgDb(null);
    spikeRef.current = 0;
    anomalyRef.current = 0;
    anomalyActiveRef.current = false;
    tensionBufRef.current = [];
    window.sessionStorage.setItem('calm-tutor:active', '1');
    setStatus('monitoring');
    activeMsRef.current = 0;
    segmentStartRef.current = Date.now();
    startTimer();
  }, []);

  const stop = useCallback((): SessionSummary | null => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    if (segmentStartRef.current !== null) {
      activeMsRef.current += Date.now() - segmentStartRef.current;
      segmentStartRef.current = null;
    }
    window.sessionStorage.removeItem('calm-tutor:active');
    const endedAt = Date.now();
    const secs = Math.max(0, Math.round(activeMsRef.current / 1000));
    setDurationSec(secs);
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

  const pause = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    if (segmentStartRef.current !== null) {
      activeMsRef.current += Date.now() - segmentStartRef.current;
      segmentStartRef.current = null;
    }
    syncDuration();
  }, [syncDuration]);

  const resume = useCallback(() => {
    if (timerRef.current !== null) return;
    segmentStartRef.current = Date.now();
    startTimer();
  }, [startTimer]);

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

  return {
    status, mode, startedAt, durationSec, tension, level, currentAlert,
    yellowAlerts, redAlerts, videoAnomalyCount, alertCount, summary, avgDb,
    start, stop, pause, resume, dismissAlert, recordIntervention,
    ingestAudio, ingestVideo
  };
}
