import { html2md } from './html2md';
import { demargin } from '../common/string/string';

describe('html2md', () => {
  it('should work on very basic text', () => {
    expect(html2md('<h1>foo</h1>')).toBe("# foo");
  });

  it('should work on a large, clean HTML snippet', () => {
    expect(html2md(demargin`
      <span><p>You can combine <code>async</code> and <code>await</code> with <code>.resolves</code> or <code>.rejects</code>.</p>
      <pre><code class="hljs css language-js">test(<span class="hljs-string">'the data is peanut butter'</span>, <span class="hljs-keyword">async</span> () =&gt; {
        <span class="hljs-keyword">await</span> expect(fetchData()).resolves.toBe(<span class="hljs-string">'peanut butter'</span>);
      });

      test(<span class="hljs-string">'the fetch fails with an error'</span>, <span class="hljs-keyword">async</span> () =&gt; {
        <span class="hljs-keyword">await</span> expect(fetchData()).rejects.toThrow(<span class="hljs-string">'error'</span>);
      });
      </code></pre></span><span>
      <p>In these cases, <code>async</code> and <code>await</code> are effectively syntactic sugar for the same logic as the promises example uses.</p>
      <p>None of these forms is particularly superior to the others, and you
      can mix and match them across a codebase or even in a single file. It
      just depends on which style you feel makes your tests simpler.</p></span>
    `)).toBe(demargin`
      You can combine \`async\` and \`await\` with \`.resolves\` or \`.rejects\`.

      \`\`\`
      test('the data is peanut butter', async () => {
        await expect(fetchData()).resolves.toBe('peanut butter');
      });

      test('the fetch fails with an error', async () => {
        await expect(fetchData()).rejects.toThrow('error');
      });

      \`\`\`

      In these cases, \`async\` and \`await\` are effectively syntactic sugar for the same logic as the promises example uses.

      None of these forms is particularly superior to the others, and you
      can mix and match them across a codebase or even in a single file. It
      just depends on which style you feel makes your tests simpler.
    `.trim())
  })
});
