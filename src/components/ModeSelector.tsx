import type { MonitorMode } from '../types';

interface Props {
  onSelect: (mode: MonitorMode) => void;
  disabled: boolean;
}

const MODES: { mode: MonitorMode; title: string; desc: string }[] = [
  { mode: 'audio', title: '仅麦克风', desc: '分析音量、语速与负面用词' },
  { mode: 'video', title: '仅摄像头', desc: '分析表情与动作,适合轻声辅导' },
  { mode: 'both', title: '双开', desc: '声音 + 表情综合判断,识别最准' }
];

export default function ModeSelector({ onSelect, disabled }: Props) {
  return (
    <section className="card">
      <h2>选择监测模式</h2>
      <div className="mode-grid">
        {MODES.map((m) => (
          <button
            key={m.mode}
            className="mode-card"
            disabled={disabled}
            onClick={() => onSelect(m.mode)}
          >
            <strong>{m.title}</strong>
            <span className="muted">{m.desc}</span>
          </button>
        ))}
      </div>
      <p className="muted privacy">
        隐私承诺:所有分析仅在你的设备上实时进行,音视频不录制、不上传。
      </p>
    </section>
  );
}
