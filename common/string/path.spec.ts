import { relativePathFromTo, resolveRelative } from './path';

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

describe('resolveRelative', () => {
  it('should resolve (great-)aunt paths correctly', () => {
    expect(resolveRelative('a/b/c/d/e.txt', './f.txt')).toBe('a/b/c/d/f.txt');
    expect(resolveRelative('a/b/c/d/e.txt', '../f.txt')).toBe('a/b/c/f.txt');
    expect(resolveRelative('a/b/c/d/e.txt', '../../f.txt')).toBe('a/b/f.txt');
    expect(resolveRelative('a/b/c/d/e.txt', '../../../f.txt')).toBe('a/f.txt');
  });

  it('should resolve nth-cousin-nth-removed paths correctly', () => {
    expect(resolveRelative('a/b/c/d/e.txt', './f/g/h/i.txt')).toBe('a/b/c/d/f/g/h/i.txt');
    expect(resolveRelative('a/b/c/d/e.txt', '../f/g/h/i/j/k.txt')).toBe('a/b/c/f/g/h/i/j/k.txt');
    expect(resolveRelative('a/b/c/d/e.txt', '../../f/g.txt')).toBe('a/b/f/g.txt');
    expect(resolveRelative('a/b/c/d/e.txt', '../../../f/g/h.txt')).toBe('a/f/g/h.txt');
  });

  it('should filter out "." segments', () => {
    expect(resolveRelative('a/b/c/d/e.txt', './.././././.././././../f.txt')).toBe('a/f.txt');
    expect(resolveRelative('a/b/c/d/e.txt', '../../../f/./g.txt')).toBe('a/f/g.txt');
    expect(resolveRelative('a/b/c/d/e.txt', '../../../f/./')).toBe('a/f/');
  });

  it('should fail nicely when the relative path is too relative', () => {
    expect(resolveRelative('a/b/c.txt', '../../../f.txt')).toBe(undefined);
  });

  it('should just return the (cleaned) path when it is not relative', () => {
    expect(resolveRelative('a/b/c.txt', '/d/e/f.txt')).toBe('/d/e/f.txt');
    expect(resolveRelative('a/b/c.txt', '/d/./e/f.txt')).toBe('/d/e/f.txt');
  });
})
