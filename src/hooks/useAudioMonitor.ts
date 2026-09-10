import { useCallback, useEffect, useRef, useState } from 'react';
import { findNegativeKeywords } from '../lib/speech';

const SAMPLE_MS = 100;
const SPIKE_DB = 10;
const MAX_HISTORY = 600; // 60s * 10Hz

export interface DbSample {
  t: number;
  db: number;
}

export type AsrStatus = 'listening' | 'reconnecting' | 'stopped' | 'unsupported';

export interface UseAudioMonitor {
  currentDb: number;
  avgDb: number;
  spikeCount: number;
  keywordHits: string[];
  dbHistory: DbSample[];
  supported: boolean;
  error: string | null;
  lastTranscript?: string;
  asrStatus: AsrStatus;
  start(): Promise<void>;
  stop(): void;
}

export function useAudioMonitor(onSpeech?: (text: string, isFinal: boolean) => void): UseAudioMonitor {
  const [currentDb, setCurrentDb] = useState(0);
  const [avgDb, setAvgDb] = useState(0);
  const [spikeCount, setSpikeCount] = useState(0);
  const [keywordHits, setKeywordHits] = useState<string[]>([]);
  const [dbHistory, setDbHistory] = useState<DbSample[]>([]);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [asrStatus, setAsrStatus] = useState<AsrStatus>('stopped');
  const [supported] = useState(() =>
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
  );
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const recognizerRef = useRef<SpeechRecognition | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const watchdogTimerRef = useRef<number | null>(null);
  const isListeningRef = useRef(false);
  const isRecognizingRef = useRef(false);
  const sessionStartTimeRef = useRef(0);
  const samplesRef = useRef<number[]>([]);
  const historyRef = useRef<DbSample[]>([]);
  const prevDbRef = useRef<number>(0);
  const spikeRef = useRef(0);
  const onSpeechRef = useRef(onSpeech);
  onSpeechRef.current = onSpeech;

  // 彻底销毁旧实例，防止 Chrome/WebKit 内部状态机锁死
  const cleanupRecognizer = useCallback(() => {
    if (recognizerRef.current) {
      const rec = recognizerRef.current;
      rec.onstart = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        // 忽略中止异常
      }
      recognizerRef.current = null;
    }
    isRecognizingRef.current = false;
  }, []);

  // 延迟平滑重启，避免与浏览器清理音频通道冲突（抛出 InvalidStateError）
  const scheduleRestart = useCallback((delayMs = 200) => {
    if (!isListeningRef.current) return;
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
    }
    setAsrStatus('reconnecting');
    restartTimerRef.current = window.setTimeout(() => {
      restartTimerRef.current = null;
      if (isListeningRef.current) {
        startRecognizer();
      }
    }, delayMs);
  }, []);

  // 核心语音识别启动引擎：每次均创建全新实例
  const startRecognizer = useCallback(() => {
    if (!isListeningRef.current) return;

    const RecognitionCtor =
      typeof SpeechRecognition !== 'undefined'
        ? SpeechRecognition
        : typeof webkitSpeechRecognition !== 'undefined'
          ? webkitSpeechRecognition
          : null;

    if (!RecognitionCtor) {
      setAsrStatus('unsupported');
      return;
    }

    cleanupRecognizer();

    try {
      const rec = new RecognitionCtor();
      rec.lang = 'zh-CN';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        isRecognizingRef.current = true;
        sessionStartTimeRef.current = Date.now();
        setAsrStatus('listening');
      };

      rec.onresult = (ev) => {
        let finalText = '';
        let interimText = '';
        const startIndex = (ev as { resultIndex?: number }).resultIndex ?? 0;
        for (let i = startIndex; i < ev.results.length; i++) {
          const res = ev.results[i];
          if (res.isFinal) {
            finalText += res[0].transcript;
          } else {
            interimText += res[0].transcript;
          }
        }

        // 兜底：若分段未取到，直接提取最近的结果
        if (!finalText && !interimText && ev.results.length > 0) {
          const last = ev.results[ev.results.length - 1];
          if (last && last[0]) {
            if (last.isFinal) finalText = last[0].transcript;
            else interimText = last[0].transcript;
          }
        }

        const currentText = (finalText || interimText).trim();
        if (currentText) {
          setLastTranscript(currentText);
          const isFinal = Boolean(finalText);
          if (onSpeechRef.current) {
            onSpeechRef.current(currentText, isFinal);
          }
          const hits = findNegativeKeywords(currentText);
          if (hits.length > 0) {
            setKeywordHits((prev) => [...new Set([...prev, ...hits])]);
          }
        }
      };

      rec.onerror = (e) => {
        // 用户明确禁用麦克风或服务禁用
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          isListeningRef.current = false;
          setAsrStatus('unsupported');
          return;
        }

        // no-speech 是浏览器检测到静默时的正常心跳通知，无需当做致命错误
        if (e.error === 'no-speech') {
          return;
        }

        // network 错误（Chrome 语音服务器短时抖动或连接时间上限）：平滑重连
        if (e.error === 'network') {
          scheduleRestart(800);
          return;
        }

        // aborted: 页面失焦或被打断，迅速恢复
        if (e.error === 'aborted') {
          scheduleRestart(200);
          return;
        }

        // 其它异常（如 audio-capture 设备占用）
        scheduleRestart(400);
      };

      rec.onend = () => {
        isRecognizingRef.current = false;
        // 浏览器识别在停顿或静默后会自动结束，若辅导仍在进行中则自动无缝续订
        if (isListeningRef.current) {
          scheduleRestart(180);
        } else {
          setAsrStatus('stopped');
        }
      };

      rec.start();
      recognizerRef.current = rec;
    } catch {
      // 启动同步失败时安排平滑重试
      scheduleRestart(500);
    }
  }, [cleanupRecognizer, scheduleRestart]);

  // 巡检守护进程：每 2.5 秒检查一次 ASR 状态
  // 针对 Chrome 50~60 秒限制静默断流、锁屏恢复等边缘情况进行主动自愈
  useEffect(() => {
    if (watchdogTimerRef.current !== null) {
      window.clearInterval(watchdogTimerRef.current);
    }

    watchdogTimerRef.current = window.setInterval(() => {
      if (isListeningRef.current) {
        if (!isRecognizingRef.current && restartTimerRef.current === null) {
          startRecognizer();
        } else if (isRecognizingRef.current && Date.now() - sessionStartTimeRef.current > 48000) {
          // Chrome 对连续语音识别单个 session 往往在 60s 强制中断
          // 在 48s 左右主动平滑重启，可彻底避免突发断流丢失后续语音
          scheduleRestart(100);
        }
      }
    }, 2500);

    return () => {
      if (watchdogTimerRef.current !== null) {
        window.clearInterval(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
    };
  }, [startRecognizer, scheduleRestart]);

  const stop = useCallback(() => {
    isListeningRef.current = false;
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;

    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    cleanupRecognizer();
    setAsrStatus('stopped');

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
    historyRef.current = [];
    setDbHistory([]);
  }, [cleanupRecognizer]);

  const start = useCallback(async () => {
    setError(null);
    samplesRef.current = [];
    historyRef.current = [];
    setDbHistory([]);
    isListeningRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const buf = new Uint8Array(analyser.fftSize);
      const readDb = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        const db = rms === 0 ? 0 : Math.min(100, 20 * Math.log10(rms) + 90);
        return Math.max(0, db);
      };

      timerRef.current = window.setInterval(() => {
        const db = readDb();
        setCurrentDb(db);
        samplesRef.current.push(db);
        if (samplesRef.current.length > 600) samplesRef.current.shift();
        setAvgDb(samplesRef.current.reduce((a, b) => a + b, 0) / samplesRef.current.length);

        const next = historyRef.current.concat({ t: Date.now(), db });
        if (next.length > MAX_HISTORY) next.splice(0, next.length - MAX_HISTORY);
        historyRef.current = next;
        setDbHistory(next);

        if (db - prevDbRef.current >= SPIKE_DB) {
          spikeRef.current += 1;
          setSpikeCount(spikeRef.current);
        }
        prevDbRef.current = db;
      }, SAMPLE_MS);

      // 启动 ASR 语音识别
      startRecognizer();
    } catch {
      setError('无法获取麦克风权限,请检查浏览器权限设置');
      throw new Error('microphone permission denied');
    }
  }, [startRecognizer]);

  useEffect(() => stop, [stop]);

  return {
    currentDb,
    avgDb,
    spikeCount,
    keywordHits,
    dbHistory,
    supported,
    error,
    lastTranscript,
    asrStatus,
    start,
    stop
  };
}
