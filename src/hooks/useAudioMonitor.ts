import { useCallback, useEffect, useRef, useState } from 'react';
import { findNegativeKeywords } from '../lib/speech';

const SAMPLE_MS = 100;
const SPIKE_DB = 10;
const MAX_HISTORY = 600; // 60s * 10Hz

export interface DbSample {
  t: number;
  db: number;
}

export interface UseAudioMonitor {
  currentDb: number;
  avgDb: number;
  spikeCount: number;
  keywordHits: string[];
  dbHistory: DbSample[];
  supported: boolean;
  error: string | null;
  lastTranscript?: string;
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
  const [supported] = useState(() =>
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
  );
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const recognizerRef = useRef<SpeechRecognition | null>(null);
  const samplesRef = useRef<number[]>([]);
  const historyRef = useRef<DbSample[]>([]);
  const prevDbRef = useRef<number>(0);
  const spikeRef = useRef(0);
  const onSpeechRef = useRef(onSpeech);
  onSpeechRef.current = onSpeech;

  const stop = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
    historyRef.current = [];
    setDbHistory([]);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    samplesRef.current = [];
    historyRef.current = [];
    setDbHistory([]);
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

      const RecognitionCtor =
        typeof SpeechRecognition !== 'undefined'
          ? SpeechRecognition
          : typeof webkitSpeechRecognition !== 'undefined'
            ? webkitSpeechRecognition
            : null;
      if (RecognitionCtor) {
        const rec = new RecognitionCtor();
        rec.lang = 'zh-CN';
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (ev) => {
          let finalText = '';
          let interimText = '';
          const startIndex = (ev as { resultIndex?: number }).resultIndex ?? 0;
          for (let i = startIndex; i < ev.results.length; i++) {
            const transcript = ev.results[i][0].transcript;
            if (ev.results[i].isFinal) {
              finalText += transcript;
            } else {
              interimText += transcript;
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
            if (hits.length > 0) setKeywordHits((prev) => [...new Set([...prev, ...hits])]);
          }
        };
        rec.onerror = () => undefined;
        rec.start();
        recognizerRef.current = rec;
      }
    } catch {
      setError('无法获取麦克风权限,请检查浏览器权限设置');
      throw new Error('microphone permission denied');
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { currentDb, avgDb, spikeCount, keywordHits, dbHistory, supported, error, lastTranscript, start, stop };
}
