import { html2md } from './html2md';
import { demargin } from '../common/string/string';
import MarkdownIt from 'markdown-it';

function makeMd() {
  return MarkdownIt();
}

describe('html2md', () => {
  it('should work on very basic text', () => {
    expect(html2md('<h1>foo</h1>')).toBe("# foo");
  });

  it('should work on a large, clean HTML snippet', () => {
    // from https://jestjs.io/docs/en/asynchronous.html
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

  describe("stability tests", () => {

    /**
     * Tests that html2md gives equivalent markdown to the given markdownStr when the
     * rendered HTML is given to html2md.
     */
    function testStability(markdown: string) {
      const md = makeMd();

      const render1 = md.render(markdown);

      let logStr = '';
      const log = (line: string) => { logStr += line + '\n'; }

      const generatedMarkdown = html2md(render1, { log });

      const render2 = md.render(generatedMarkdown);

      try {
        expect(render2).toEqual(render1);
      } catch (err) {
        console.error("html2md log:\n" + logStr);
        throw err;
      }
    }

    it("should be stable on basic markdown", () => {
      testStability(demargin`
        # foo

        Paragraph

        ## subheading

        Another paragraph
      `);
    })

    xit("should be stable on bulleted lists", () => {
      testStability(demargin`
        * Bulleted
        * List
      `);
    })

    xit("should be stable on bulleted lists", () => {
      testStability(demargin`
        1. Numbered
        2. List
      `);
    })

    xit("should be stable on complex markdown", () => {
      testStability(demargin`
        # foo

        Paragraph

        * Bulleted
        * List

        ## subheading

        Another paragraph

        1. Numbered
        2. List

        \`\`\`shell
        echo "Code block!"
        \`\`\`
      `);
    })

  })
});
