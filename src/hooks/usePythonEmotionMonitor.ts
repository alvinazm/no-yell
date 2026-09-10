import { useState, useRef, useCallback, useEffect } from 'react';
import type { EmotionAlert, PythonServerHealth } from '../types/python-monitor';
import { analyzeSpeechContent } from '../lib/speechNlpEngine';

export function usePythonEmotionMonitor(enabled: boolean = true) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connected');
  const [serverInfo] = useState<PythonServerHealth>({
    status: 'ok',
    backend: 'AI 实时情绪与负面语言监控引擎',
    version: '1.0.0',
    capabilities: [
      'realtime_nlp_speech_monitoring',
      'regex_pattern_matching',
      'positive_replacement_generation',
      'multimodal_db_fusion'
    ]
  });
  const [activeAlert, setActiveAlert] = useState<EmotionAlert | null>(null);
  const [alertHistory, setAlertHistory] = useState<EmotionAlert[]>([]);
  const alertTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (enabled) {
      setConnectionStatus('connected');
    } else {
      setActiveAlert(null);
    }
  }, [enabled]);

  // 核心实时语言与分贝分析
  const analyzeSpeech = useCallback((text: string, currentDb: number, _isFinal: boolean = false) => {
    if (!text || !text.trim()) return;

    const result = analyzeSpeechContent(text, currentDb);

    if (result.hasNegative || result.level !== 'green') {
      const alertData: EmotionAlert = {
        hasNegative: result.hasNegative,
        level: result.level,
        score: result.score,
        category: result.category,
        categoryName: result.categoryName,
        matchedPhrases: result.matchedPhrases,
        replacementSuggestion: result.replacementSuggestion,
        coachTip: result.coachTip,
        currentDb: result.currentDb,
        text: result.text,
        timestamp: Date.now()
      };

      setActiveAlert(alertData);
      setAlertHistory((prev) => [alertData, ...prev.slice(0, 19)]);

      if (alertTimeoutRef.current) {
        window.clearTimeout(alertTimeoutRef.current);
      }
      alertTimeoutRef.current = window.setTimeout(() => {
        setActiveAlert((current) => (current === alertData ? null : current));
      }, 12000);
    }
  }, []);

  const dismissAlert = useCallback(() => {
    setActiveAlert(null);
    if (alertTimeoutRef.current) {
      window.clearTimeout(alertTimeoutRef.current);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setAlertHistory([]);
    setActiveAlert(null);
  }, []);

  return {
    connectionStatus,
    serverInfo,
    activeAlert,
    alertHistory,
    analyzeSpeech,
    dismissAlert,
    clearHistory
  };
}
