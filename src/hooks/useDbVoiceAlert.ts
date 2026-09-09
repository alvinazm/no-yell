import { useEffect, useRef } from 'react';
import {
  evaluateHighDbVoiceAlert,
  initialHighDbVoiceAlertState
} from '../lib/voiceAlert';

/**
 * 分贝超阈值语音告警：30 秒冷却一次，持续超标时按 1→2→3 档升级，
 * 短促回落不重置档位；重新开始新辅导时才回到第 1 档。
 */
export function useDbVoiceAlert(
  db: number,
  enabled: boolean,
  onIntervention?: () => void
): void {
  const stateRef = useRef(initialHighDbVoiceAlertState());
  const onInterventionRef = useRef(onIntervention);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    onInterventionRef.current = onIntervention;
  }, [onIntervention]);

  useEffect(() => {
    if (!enabled) {
      audioRef.current?.pause();
      audioRef.current = null;
      stateRef.current = initialHighDbVoiceAlertState();
      return;
    }

    const now = Date.now();
    const result = evaluateHighDbVoiceAlert(db, stateRef.current, now);
    stateRef.current = result.next;

    if (
      result.shouldSpeak &&
      result.audioUrl
    ) {
      audioRef.current?.pause();
      const audio = new Audio(result.audioUrl);
      audioRef.current = audio;
      void audio.play().then(() => {
        onInterventionRef.current?.();
      }).catch(() => undefined);
    }
  }, [db, enabled]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);
}
