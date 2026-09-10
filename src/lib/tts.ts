/**
 * 教育心理学平替话术语音朗读工具
 * 使用浏览器原生 SpeechSynthesis，以放缓、温和的语速朗读平替示范，
 * 帮助家长直观感受温和语调的节奏与情绪价值。
 */

let activeSpeaking = false;

export function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function isSpeaking(): boolean {
  return activeSpeaking;
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // 忽略部分浏览器异常
    }
  }
  activeSpeaking = false;
}

export function speakCalmGuidance(
  text: string,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: unknown) => void;
  }
): boolean {
  if (!isTtsSupported()) return false;

  try {
    stopSpeaking();

    // 过滤掉引号等标点，使语流更自然
    const cleanText = text.replace(/^[“"']|[”"']$/g, '').trim();
    if (!cleanText) return false;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-CN';
    // 稍放缓语速（0.88），传递耐心的情绪
    utterance.rate = 0.88;
    utterance.pitch = 1.05;

    utterance.onstart = () => {
      activeSpeaking = true;
      callbacks?.onStart?.();
    };

    utterance.onend = () => {
      activeSpeaking = false;
      callbacks?.onEnd?.();
    };

    utterance.onerror = (e) => {
      activeSpeaking = false;
      callbacks?.onError?.(e);
      callbacks?.onEnd?.();
    };

    activeSpeaking = true;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    activeSpeaking = false;
    callbacks?.onError?.(err);
    callbacks?.onEnd?.();
    return false;
  }
}
