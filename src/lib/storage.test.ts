import { describe, it, expect, beforeEach } from 'vitest';
import { createSessionStore } from './storage';
import type { SessionSummary } from '../types';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); }
  };
}

const summary: SessionSummary = {
  id: 's1', mode: 'both', startedAt: 1000, durationSec: 600,
  avgDb: 60, videoAnomalyCount: 1, alertCount: 2, score: 90, grade: '优秀'
};

describe('createSessionStore', () => {
  let store: ReturnType<typeof createSessionStore>;
  beforeEach(() => { store = createSessionStore(memoryStorage()); });

  it('saves and loads newest-first', () => {
    store.saveSession(summary);
    store.saveSession({ ...summary, id: 's2', startedAt: 2000 });
    expect(store.loadSessions().map((s) => s.id)).toEqual(['s2', 's1']);
  });
  it('clears all sessions', () => {
    store.saveSession(summary);
    store.clearSessions();
    expect(store.loadSessions()).toEqual([]);
  });
  it('caps at 50 entries', () => {
    for (let i = 0; i < 55; i++) {
      store.saveSession({ ...summary, id: `s${i}`, startedAt: i });
    }
    expect(store.loadSessions()).toHaveLength(50);
  });
});
