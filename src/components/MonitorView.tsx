import { useEffect, useRef } from 'react';
import type { UseSession } from '../hooks/useSession';
import { useAudioMonitor } from '../hooks/useAudioMonitor';
import { useVideoMonitor } from '../hooks/useVideoMonitor';
import ReminderOverlay from './ReminderOverlay';

interface Props {
  session: UseSession;
  onStop: () => void;
}

const LEVEL_TEXT = { green: '平稳', yellow: '紧张', red: '危险' };

export default function MonitorView({ session, onStop }: Props) {
  const audio = useAudioMonitor();
  const video = useVideoMonitor();
  const videoRef = useRef<HTMLVideoElement>(null);
  const startedRef = useRef(false);

  const needsAudio = session.mode === 'audio' || session.mode === 'both';
  const needsVideo = session.mode === 'video' || session.mode === 'both';

  useEffect(() => {
    if (startedRef.current || session.status !== 'monitoring') return;
    startedRef.current = true;
    if (needsAudio) {
      audio.start().catch(() => undefined);
    }
    if (needsVideo && videoRef.current) {
      video.start(videoRef.current).catch(() => undefined);
    }
  }, [session.status, needsAudio, needsVideo, audio, video]);

  useEffect(() => {
    if (needsAudio) {
      session.ingestAudio({
        currentDb: audio.currentDb,
        avgDb: audio.avgDb,
        spikeCount: audio.spikeCount,
        keywordHits: audio.keywordHits
      });
    }
  }, [audio.currentDb, audio.avgDb, audio.spikeCount, audio.keywordHits]);

  useEffect(() => {
    if (needsVideo && video.features) {
      session.ingestVideo(video.features);
    }
  }, [video.features]);

  useEffect(() => {
    if (session.currentAlert && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(session.currentAlert);
      u.lang = 'zh-CN';
      window.speechSynthesis.speak(u);
      const t = window.setTimeout(() => session.dismissAlert(), 4000);
      return () => window.clearTimeout(t);
    }
  }, [session.currentAlert]);

  const handleStop = () => {
    audio.stop();
    video.stop();
    session.stop();
    onStop();
  };

  const mm = Math.floor(session.durationSec / 60);
  const ss = (session.durationSec % 60).toString().padStart(2, '0');

  return (
    <section className="monitor">
      {(audio.error || video.error) && (
        <p className="card warn">{audio.error || video.error}</p>
      )}
      {needsVideo && (
        <video ref={videoRef} muted playsInline className="cam-preview" />
      )}
      {session.currentAlert && (
        <ReminderOverlay level={session.level} message={session.currentAlert} />
      )}
      <div className={`status-ball ${session.level}`}>
        <strong>{session.tension.toFixed(0)}</strong>
        <span>{LEVEL_TEXT[session.level]}</span>
      </div>
      <div className="monitor-grid">
        <div className="card stat">
          <span className="muted">辅导时长</span>
          <strong>{mm}:{ss}</strong>
        </div>
        {needsAudio && (
          <div className="card stat">
            <span className="muted">当前分贝</span>
            <strong>{audio.currentDb.toFixed(0)} dB</strong>
          </div>
        )}
        {needsVideo && video.features && (
          <div className="card stat">
            <span className="muted">表情</span>
            <strong>{video.tension.toFixed(0)}</strong>
          </div>
        )}
      </div>
      <button className="btn secondary" onClick={handleStop}>结束辅导</button>
    </section>
  );
}
