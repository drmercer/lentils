import { html2md } from './html2md';

describe('html2md', () => {
  it('should work', () => {
    expect(html2md('<h1>foo</h1>')).toBe("# foo");
  });
});
