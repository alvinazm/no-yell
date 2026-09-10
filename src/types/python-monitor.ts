export interface EmotionAlert {
  hasNegative: boolean;
  level: 'green' | 'yellow' | 'red';
  score: number;
  category: string | null;
  categoryName: string;
  matchedPhrases: string[];
  replacementSuggestion: string;
  coachTip: string;
  currentDb: number;
  text: string;
  timestamp: number;
}

export interface PythonServerHealth {
  status: string;
  backend: string;
  version: string;
  capabilities: string[];
}
