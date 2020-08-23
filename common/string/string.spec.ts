import { kebabCase, leftPad, demargin } from './string';

describe('kebabCase', () => {
  it('kebab-cases basic input correctly', () => {
    expect(kebabCase('Foo')).toEqual('foo');
    expect(kebabCase('Foo bar bagel')).toEqual('foo-bar-bagel');
  });
  it('omits leading or trailing hyphens', () => {
    expect(kebabCase('!Foo bar bagel')).toEqual('foo-bar-bagel');
    expect(kebabCase('Foo bar bagel!')).toEqual('foo-bar-bagel');
    expect(kebabCase('!Foo bar bagel!')).toEqual('foo-bar-bagel');
  });
  it('handles really weird input', () => {
    expect(kebabCase('This is an emoji! 🎉')).toEqual('this-is-an-emoji');
    expect(kebabCase('This is a weird unicode character: Ā')).toEqual('this-is-a-weird-unicode-character-a');
  });
});

describe('leftPad', () => {
  it('left pads basic input correctly', () => {
    expect(leftPad('a', 3)).toEqual('  a');
    expect(leftPad('ab', 3)).toEqual(' ab');
    expect(leftPad('abc', 3)).toEqual('abc');
    expect(leftPad('abcd', 3)).toEqual('abcd');
  });
  it('safely handles non-string input', () => {
    const impostor = { length: 10 } as any as string;
    const space = 0 as unknown as string;
    expect(leftPad(impostor, 20, space)).toEqual('00000[object Object]');
  });
});

describe('demargin', () => {
  it('removes the left margin correctly without interpolation', () => {
    expect(demargin`
        foo 1
            bar 2
            3
        bagel 4!

        `).toEqual('foo 1\n    bar 2\n    3\nbagel 4!\n');
  });

  it('removes the left margin correctly with interpolation', () => {
    expect(demargin`
        foo ${1}
            bar ${2}
            3
        bagel ${4}!

        `).toEqual('foo 1\n    bar 2\n    3\nbagel 4!\n');
  });

  it('removes the left margin correctly when used as a regular function', () => {
    expect(demargin(`
        foo ${1}
            bar ${2}
            3
        bagel ${4}!

        `)).toEqual('foo 1\n    bar 2\n    3\nbagel 4!\n');
  });

  it('removes any leading or trailing blank lines', () => {
    expect(demargin`

          foo
           bar
          bagel

        `).toEqual('foo\n bar\nbagel\n');
  });

  it(`does not add a trailing newline if the original text doesn't have one`, () => {
    expect(demargin`
          foo
           bar
          bagel`).toEqual('foo\n bar\nbagel');
  });
});
