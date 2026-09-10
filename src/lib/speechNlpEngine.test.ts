import { describe, it, expect } from 'vitest';
import { analyzeSpeechContent } from './speechNlpEngine';

describe('speechNlpEngine', () => {
  it('detects intellectual belittling phrases', () => {
    const res1 = analyzeSpeechContent('你怎么这么笨，这道题我都讲过好多次了', 65);
    expect(res1.hasNegative).toBe(true);
    expect(res1.matchedPhrases).toContain('怎么这么笨');
    expect(res1.replacementSuggestion).toContain('拆');
    expect(['yellow', 'red']).toContain(res1.level);

    const res2 = analyzeSpeechContent('蠢的更猪一样，这都不会', 70);
    expect(res2.hasNegative).toBe(true);
    expect(res2.category).toBe('intellectual_belittling');

    const res3 = analyzeSpeechContent('你怎么这些笨', 60);
    expect(res3.hasNegative).toBe(true);
    expect(res3.category).toBe('intellectual_belittling');
    expect(res3.matchedPhrases).toContain('怎么这些笨');
  });

  it('detects toxic comparison', () => {
    const res = analyzeSpeechContent('谁都比你强，你看看别人家的小孩', 75);
    expect(res.hasNegative).toBe(true);
    expect(res.matchedPhrases).toContain('谁都比你强');
    expect(res.category).toBe('toxic_comparison');
    expect(res.replacementSuggestion).toContain('更棒');
  });

  it('handles positive encouraging speech', () => {
    const res = analyzeSpeechContent('做得很棒，先深呼吸，我们一步一步慢慢来', 45);
    expect(res.hasNegative).toBe(false);
    expect(res.level).toBe('green');
    expect(res.score).toBeLessThan(40);
  });

  it('fuses high decibels into stress score', () => {
    const loudRes = analyzeSpeechContent('快点写！', 88);
    expect(loudRes.level).toBe('red');
    expect(loudRes.score).toBeGreaterThanOrEqual(65);
  });
});
