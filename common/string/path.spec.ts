import { relativePathFromTo } from './path';

describe("relativePathFromTo", () => {
  it('should resolve sibling paths correctly', () => {
    expect(relativePathFromTo('a/b/c.txt', 'a/b/d.txt')).toBe('./d.txt');
  });

  it('should resolve sibling paths correctly when one is a directory', () => {
    expect(relativePathFromTo('a/b/', 'a/b/c.txt')).toBe('./c.txt');
  });

  it('should resolve child paths correctly', () => {
    expect(relativePathFromTo('a/b/', 'a/b/c/d.txt')).toBe('./c/d.txt');
  });

  it('should resolve niece paths correctly', () => {
    expect(relativePathFromTo('a/b/c.txt', 'a/b/d/e.txt')).toBe('./d/e.txt');
  });

  it('should resolve cousin paths correctly', () => {
    expect(relativePathFromTo('a/b/c.txt', 'a/d/e.txt')).toBe('../d/e.txt');
  });

  it('should resolve 1st-cousin-once-removed paths correctly', () => {
    expect(relativePathFromTo('a/b/c.txt', 'a/e.txt')).toBe('../e.txt');
    expect(relativePathFromTo('a/b.txt', 'a/c/d.txt')).toBe('./c/d.txt');
  });

  it('should resolve 2nd-cousin paths correctly', () => {
    expect(relativePathFromTo('a/b/c/d.txt', 'a/e/f/g.txt')).toBe('../../e/f/g.txt');
  });

  it('should resolve 2nd-cousin directory paths correctly', () => {
    expect(relativePathFromTo('a/b/c/', 'a/e/f/g/')).toBe('../../e/f/g/');
  });

  it('should resolve 2nd-cousin directory paths correctly', () => {
    expect(relativePathFromTo('a/b/c/', 'a/e/f/g/')).toBe('../../e/f/g/');
  });

  it('should resolve completely distinct paths correctly', () => {
    expect(relativePathFromTo('a/b/c/d/e/f/g.txt', 'h/i/j/k.txt')).toBe('../../../../../../h/i/j/k.txt');
  });

  it('should resolve completely distinct paths correctly when they start with "/"', () => {
    expect(relativePathFromTo('/a/b/c/d/e/f/g.txt', '/h/i/j/k.txt')).toBe('../../../../../../h/i/j/k.txt');
  });
});
