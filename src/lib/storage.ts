import type { SessionSummary } from '../types';

const KEY = 'calm-tutor:sessions';
const MAX = 50;

export interface SessionStore {
  saveSession(summary: SessionSummary): void;
  loadSessions(): SessionSummary[];
  clearSessions(): void;
}

export function createSessionStore(
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
): SessionStore {
  return {
    saveSession(summary) {
      const list = this.loadSessions();
      list.unshift(summary);
      storage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    },
    loadSessions() {
      try {
        const raw = storage.getItem(KEY);
        return raw ? (JSON.parse(raw) as SessionSummary[]) : [];
      } catch {
        return [];
      }
    },
    clearSessions() {
      storage.removeItem(KEY);
    }
  };
}

function defaultStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); }
  };
}

export const sessionStore = createSessionStore(defaultStorage());
