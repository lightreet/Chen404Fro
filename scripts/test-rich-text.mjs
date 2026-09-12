import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import createDOMPurify from 'dompurify'
import { loadTypeScriptModule } from './helpers/load-typescript.mjs'

const window = new JSDOM('').window
const { sanitizeRichTextHtml } = loadTypeScriptModule(new URL('../src/utils/richText.ts', import.meta.url), {
  dompurify: { default: createDOMPurify(window) },
})

test('rich text removes executable attributes, unsafe URLs, scripts and document-wide markup', () => {
  const dirty = '<h2>Heading</h2><img src="/cover.png" onerror="alert(1)"><script>alert(1)</script>'
    + '<a href="javascript:alert(1)">link</a><style>body{display:none}</style><form><input></form>'
    + '<svg onload="alert(1)"><a xlink:href="javascript:alert(1)">svg</a></svg>'
  const body = new JSDOM(sanitizeRichTextHtml(dirty)).window.document.body
  assert.equal(body.querySelector('script, style, form, [onerror], [onload]'), null)
  assert.equal(body.querySelector('a').getAttribute('href'), null)
  assert.equal(body.querySelector('svg a').getAttribute('xlink:href'), null)
  assert.equal(body.querySelector('img').getAttribute('src'), '/cover.png')
})

test('sanitization preserves heading anchors, resized images, code and math content', () => {
  const input = '<h2 id="section-1" class="article-section-heading--from-h1">标题</h2>'
    + '<img src="/cover.png" style="width: 60%; height: auto"><pre><code>&lt;script&gt;literal&lt;/script&gt;</code></pre>'
    + '<math><mi>x</mi><mo>+</mo><mn>1</mn></math>'
  const body = new JSDOM(sanitizeRichTextHtml(input)).window.document.body
  assert.equal(body.querySelector('#section-1').textContent, '标题')
  assert.equal(body.querySelector('img').style.width, '60%')
  assert.equal(body.querySelector('code').textContent, '<script>literal</script>')
  assert.equal(body.querySelector('math').textContent, 'x+1')
})
