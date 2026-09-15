import assert from 'node:assert/strict';
import test from 'node:test';
import MarkdownIt from 'markdown-it';
import imageRule from 'markdown-it/lib/rules_inline/image.mjs';
import * as yaml from 'yaml';
import { JSDOM } from 'jsdom';
import { loadTypeScriptModule } from './helpers/load-typescript.mjs';

const { parseMarkdownArticle, readMarkdownArticle } = loadTypeScriptModule(new URL('../src/modules/article-edit/markdown-import.ts', import.meta.url), {
  'markdown-it': { default: MarkdownIt }, yaml,
}, { TextDecoder });
const { collectMarkdownImages, replaceMarkdownImages } = loadTypeScriptModule(new URL('../src/modules/article-edit/markdown-images.ts', import.meta.url), {
  'markdown-it': { default: MarkdownIt }, 'markdown-it/lib/rules_inline/image.mjs': { default: imageRule },
}, { DOMParser: new JSDOM('').window.DOMParser });

test('report metadata imports only article content and removes its duplicate title', () => {
  const result = parseMarkdownArticle('\uFEFF---\r\nschema_version: 1\r\ntitle: "开发者 AI 周报"\r\nsummary: "本期更新"\r\ntags: ["Java", "java", "AI"]\r\nauthorId: 999\r\nstatus: 1\r\nvisibility: 3\r\n---\r\n# 开发者 AI 周报\r\n\r\n正文\r\n\r\n## 事件\r\n![图](https://example.com/a.png)', 'report.md');
  assert.equal(result.title, '开发者 AI 周报');
  assert.equal(result.summary, '本期更新');
  assert.deepEqual(Array.from(result.tags), ['java', 'AI']);
  assert.match(result.content, /^正文\n\n## 事件/);
  assert.equal(result.authorId, undefined);
  assert.equal(result.status, undefined);
  assert.equal(result.visibility, undefined);
});

test('plain Markdown preserves code and unrelated headings, supports filename and setext titles', () => {
  assert.equal(parseMarkdownArticle('```md\n# 代码标题\n```\n\n# 文章标题\n\n内容', 'test.md').title, '文章标题');
  assert.match(parseMarkdownArticle('```md\n# 代码标题\n```\n\n# 文章标题\n\n内容', 'test.md').content, /# 代码标题/);
  assert.equal(parseMarkdownArticle('内容', '文件标题.markdown').title, '文件标题');
  assert.equal(parseMarkdownArticle('文章标题\n========\n\n内容', 'test.md').content, '内容');
  assert.match(parseMarkdownArticle('---\ntitle: 不同文章标题\n---\n# 正文标题\n\n内容', 'test.md').content, /# 正文标题/);
});

test('invalid metadata, alias expansion, custom objects and empty/oversized fields fail clearly', () => {
  for (const header of ['title: [broken', 'title: A\ntitle: B', 'title: &t Hello\nsummary: *t', 'title: !!str Hello', 'title: !object {}', 'title: 123', 'tags: [1]', 'schema_version: 2', '[]']) {
    assert.throws(() => parseMarkdownArticle(`---\n${header}\n---\n内容`, 'file.md'));
  }
  assert.throws(() => parseMarkdownArticle('---\ntitle: 无结尾', 'file.md'), /缺少/);
  assert.throws(() => parseMarkdownArticle('# 唯一标题', 'file.md'), /正文为空/);
  assert.throws(() => parseMarkdownArticle(`---\ntitle: "${'字'.repeat(101)}"\n---\n正文`, 'file.md'), /100/);
});

test('file validation rejects incorrect extension, oversized file and invalid UTF-8', async () => {
  const invalid = { name: 'file.md', size: 2, arrayBuffer: async () => new Uint8Array([0xc0, 0xff]).buffer };
  await assert.rejects(readMarkdownArticle(invalid), /UTF-8/);
  await assert.rejects(readMarkdownArticle({ ...invalid, name: 'file.exe' }), /请选择/);
  await assert.rejects(readMarkdownArticle({ ...invalid, size: 1024 * 1024 + 1 }), /1 MB/);
  await assert.rejects(readMarkdownArticle({ ...invalid, size: 0 }), /为空/);
});

test('image conversion deduplicates links and only rewrites rendered images, preserving sources and examples', () => {
  const source = 'https://example.com/a(b).png';
  const markdown = `![首图](${source} "标题")\n\n[来源](${source})\n\n\`![首图](${source})\`\n\n\`\`\`md\n![首图](${source})\n\`\`\`\n\n> ![引用图](${source})\n\n- ![列表图](${source})\n\n![引用式][pic]\n\n[普通引用][pic]\n\n[pic]: ${source}\n`;
  const images = collectMarkdownImages(markdown);
  assert.equal(images.length, 1);
  assert.equal(images[0].occurrences.length, 4);
  const result = replaceMarkdownImages(markdown, images, new Map([[source, '/api/files/900?ticket=abc']]));
  assert.equal((result.match(/<img src="\/api\/files\/900/g) || []).length, 4);
  assert.ok(result.includes(`[来源](${source})`));
  assert.ok(result.includes(`\`![首图](${source})\``));
  assert.ok(result.includes(`\n![首图](${source})\n\`\`\``));
  assert.ok(result.includes(`[pic]: ${source}`));
  assert.ok(result.includes('title="标题"'));
});

test('table, multiline quote, inline link image and resized HTML image preserve layout', () => {
  const source = 'https://example.com/a.png';
  const markdown = `| 图 | 说明 |\n| --- | --- |\n| ![表格](${source}) | 注释 |\n\n> 第一行\n> ![引用](${source})\n\n[![链接图](${source})](https://example.com)\n\n<img src='${source}' alt="调整图" style="width: 50%" />`;
  const images = collectMarkdownImages(markdown);
  assert.equal(images.length, 1);
  assert.equal(images[0].occurrences.length, 4);
  const result = replaceMarkdownImages(markdown, images, new Map([[source, '/new.png']]));
  assert.equal((result.match(/src="\/new.png"/g) || []).length, 4);
  assert.match(result, /style="width: 50%"/);
  assert.match(result, /> 第一行\n> <img/);
  assert.match(result, /\[<img.*\]\(https:\/\/example.com\)/);
});

test('local paths remain available for manual replacement; a failed remote image retains the original', () => {
  const markdown = '![本地](images/local.png)\n\n![远程](https://example.com/a.png)';
  const images = collectMarkdownImages(markdown);
  assert.equal(images[0].remote, false);
  const result = replaceMarkdownImages(markdown, images, new Map([['images/local.png', '/uploaded.png']]));
  assert.match(result, /src="\/uploaded.png"/);
  assert.match(result, /!\[远程\]\(https:\/\/example.com\/a.png\)/);
});

test('HTML comments and script string examples do not become remote image downloads', () => {
  const content = '<div><!-- <img src="https://hidden.example/comment.png"> --></div>\n\n'
    + '<script>const text = \'<img src="https://hidden.example/script.png">\';</script>\n\n'
    + '<img src="https://visible.example/image.png">';
  const images = collectMarkdownImages(content);
  assert.equal(images.length, 1);
  assert.equal(images[0].source, 'https://visible.example/image.png');
});

test('HTML image rewriting targets src without changing a data-src attribute', () => {
  const source = '<img data-src="placeholder.png" src="https://example.com/a.png" alt="真实图片">';
  const result = replaceMarkdownImages(source, collectMarkdownImages(source), new Map([['https://example.com/a.png', '/local.png']]));
  assert.equal(result, '<img data-src="placeholder.png" src="/local.png" alt="真实图片">');
});
