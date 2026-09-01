import { describe, it, expect } from 'vitest';
import { findNegativeKeywords, pickScript, SCRIPTS } from './speech';

describe('findNegativeKeywords', () => {
  it('finds matched keywords and dedupes', () => {
    const hits = findNegativeKeywords('怎么这么笨!烦死了,说了多少遍!');
    expect(hits).toEqual(expect.arrayContaining(['怎么这么笨', '烦死了', '说了多少遍']));
  });
  it('returns empty when nothing matches', () => {
    expect(findNegativeKeywords('我们慢慢来,这道题再想想')).toEqual([]);
  });
});

describe('pickScript', () => {
  it('prefers unused scripts and cycles when exhausted', () => {
    const first = pickScript('yellow', []);
    const second = pickScript('yellow', [first]);
    expect(second).not.toBe(first);
    const recycled = pickScript('yellow', [...SCRIPTS.yellow]);
    expect(SCRIPTS.yellow).toContain(recycled);
  });
});
