import MarkdownIt from 'markdown-it';
import imageRule from 'markdown-it/lib/rules_inline/image.mjs';
import type Token from 'markdown-it/lib/token.mjs';

export interface MarkdownImage {
  source: string;
  alt: string;
  remote: boolean;
  occurrences: Array<{ start: number; end: number; replacement: (url: string) => string }>;
}

const parser = new MarkdownIt({ html: true });
parser.inline.ruler.at('image', (state, silent) => {
  const start = state.pos;
  const matched = imageRule(state, silent);
  if (matched && !silent) {
    const token = state.tokens.at(-1);
    if (token?.type === 'image') token.meta = { start, end: state.pos };
  }
  return matched;
});

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** 通过 Markdown token 定位图片，只替换图片语法；不改来源链接或代码示例。 */
export function collectMarkdownImages(content: string): MarkdownImage[] {
  const tokens = parser.parse(content, {});
  const images = new Map<string, MarkdownImage>();
  const lines = content.split('\n');
  const offsets = [0];
  for (const line of lines) offsets.push(offsets[offsets.length - 1]! + line.length + 1);
  let scope: [number, number] = [0, lines.length];
  let cursor = 0;

  const add = (source: string, alt: string, start: number, end: number, replacement: (url: string) => string) => {
    const image = images.get(source) ?? { source, alt, remote: /^https?:\/\//i.test(source), occurrences: [] };
    image.occurrences.push({ start, end, replacement });
    images.set(source, image);
  };

  for (const block of tokens) {
    if (block.map) scope = block.map;
    if (block.type !== 'inline' && block.type !== 'html_block') continue;
    const scopeStart = offsets[scope[0]]!;
    const scopeEnd = offsets[scope[1]] ?? content.length;
    // 列表/引用会移除每行前缀，逐行映射回原始 Markdown，保留原排版。
    const positions: number[] = [];
    let searchAt = Math.max(scopeStart, cursor);
    for (const line of block.content.split('\n')) {
      const at = content.indexOf(line, searchAt);
      if (at < 0 || at > scopeEnd) break;
      for (let index = 0; index < line.length; index++) positions.push(at + index);
      positions.push(at + line.length);
      searchAt = at + line.length + 1;
    }
    cursor = Math.max(cursor, (positions[block.content.length - 1] ?? cursor - 1) + 1);

    const collectImage = (token: Token) => {
      if (token.type === 'image') {
        const meta = token.meta as { start: number; end: number } | null;
        if (!meta) return;
        const start = positions[meta.start];
        const last = positions[meta.end - 1];
        if (start === undefined || last === undefined) return;
        const source = token.attrGet('src') || '';
        const alt = token.content;
        const title = token.attrGet('title');
        // 引用式图片转换为独立 img，避免修改共用定义后连带改动普通超链接。
        add(source, alt, start, last + 1, url => `<img src="${escapeAttribute(url)}" alt="${escapeAttribute(alt)}"${title ? ` title="${escapeAttribute(title)}"` : ''} />`);
      }
    };
    block.children?.forEach(collectImage);

    // 已经在编辑器中调整过尺寸的图片会保存为 HTML；只处理真实 HTML token。
    const htmlTokens = block.type === 'html_block' ? [block] : (block.children ?? []).filter(token => token.type === 'html_inline');
    let htmlCursor = 0;
    for (const token of htmlTokens) {
      const localAt = block.content.indexOf(token.content, htmlCursor);
      if (localAt < 0) continue;
      htmlCursor = localAt + token.content.length;
      const tags = token.content.matchAll(/<!--[\s\S]*?(?:-->|$)|<(script|style)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)|<img\b[^>]*>/gi);
      for (const match of tags) {
        const raw = match[0];
        if (!/^<img\b/i.test(raw)) continue;
        const document = new DOMParser().parseFromString(raw, 'text/html');
        const element = document.querySelector('img[src]');
        const srcMatch = /\ssrc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i.exec(raw);
        if (!element || !srcMatch) continue;
        const start = positions[localAt + match.index!];
        const last = positions[localAt + match.index! + raw.length - 1];
        if (start === undefined || last === undefined) continue;
        add(element.getAttribute('src') || '', element.getAttribute('alt') || '', start, last + 1,
          url => raw.slice(0, srcMatch.index) + ` src="${escapeAttribute(url)}"` + raw.slice(srcMatch.index + srcMatch[0].length));
      }
    }
  }
  if (images.size > 30) throw new Error('一次最多处理 30 张不同的图片，请拆分文章后导入');
  return [...images.values()];
}

export function replaceMarkdownImages(content: string, images: MarkdownImage[], replacements: Map<string, string>): string {
  const edits = images.flatMap(image => {
    const url = replacements.get(image.source);
    return url ? image.occurrences.map(occurrence => ({ ...occurrence, text: occurrence.replacement(url) })) : [];
  }).sort((a, b) => b.start - a.start);
  for (const edit of edits) content = content.slice(0, edit.start) + edit.text + content.slice(edit.end);
  return content;
}
