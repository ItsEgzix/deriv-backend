import {
  buildTextForModel,
  collapseWhitespace,
  truncateToMaxWords,
  wordCount,
} from './text.util';

describe('text.util', () => {
  describe('collapseWhitespace', () => {
    it('collapses runs of whitespace to single spaces', () => {
      expect(collapseWhitespace('a   b\n\nc\td')).toBe('a b c d');
    });
  });

  describe('buildTextForModel', () => {
    it('builds deterministic Subject/Message blob', () => {
      const a = buildTextForModel('  Hello  world ', 'one\ntwo  three');
      const b = buildTextForModel('Hello world', 'one two three');
      expect(a).toBe(b);
      expect(a).toBe('Subject: Hello world\n\nMessage: one two three');
    });

    it('is stable across repeated calls', () => {
      const v1 = buildTextForModel('foo', 'bar');
      const v2 = buildTextForModel('foo', 'bar');
      expect(v1).toBe(v2);
    });
  });

  describe('wordCount + truncate', () => {
    it('counts whitespace-separated words', () => {
      expect(wordCount('  hello world  again ')).toBe(3);
      expect(wordCount('')).toBe(0);
    });

    it('truncates with ellipsis when over max', () => {
      const out = truncateToMaxWords('one two three four five', 3);
      expect(out).toBe('one two three...');
    });

    it('returns text unchanged when within max', () => {
      const out = truncateToMaxWords('a b c', 5);
      expect(out).toBe('a b c');
    });
  });
});
