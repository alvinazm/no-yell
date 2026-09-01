import type { TensionLevel } from '../types';

interface Props {
  level: TensionLevel;
  message: string;
}

export default function ReminderOverlay({ level, message }: Props) {
  return (
    <div className={`reminder ${level}`} role="alert">
      <span className="reminder-dot" />
      <span>{message}</span>
    </div>
  );
}
