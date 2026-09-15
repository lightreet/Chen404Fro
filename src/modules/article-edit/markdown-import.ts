import MarkdownIt from 'markdown-it';
import { isAlias, isMap, isNode, parseDocument, visit } from 'yaml';

export const MARKDOWN_MAX_BYTES = 1024 * 1024;
const FRONTMATTER_MAX_LENGTH = 16 * 1024;
const markdown = new MarkdownIt();

export interface MarkdownArticleImport {
  fileName: string;
  title: string;
  summary: string;
  tags: string[];
  content: string;
}

function textField(metadata: Record<string, unknown>, key: string, max: number): string {
  const value = metadata[key];
  if (value === undefined) return '';
  if (typeof value !== 'string') throw new Error(`文章资料中的 ${key} 必须是文本`);
  if (value.trim().length > max) throw new Error(`${key} 不能超过 ${max} 个字符`);
  return value.trim();
}

/** 只解析文章资料白名单，文件不能设置作者、权限、状态或数据库 ID。 */
export function parseMarkdownArticle(source: string, fileName: string): MarkdownArticleImport {
  let content = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (content.includes('\0')) throw new Error('文件包含无效字符，请保存为 UTF-8 Markdown');
  let metadata: Record<string, unknown> = {};
  if (/^---[ \t]*\n/.test(content)) {
    const closing = /^---[ \t]*$/gm;
    closing.lastIndex = content.indexOf('\n') + 1;
    const match = closing.exec(content);
    if (!match) throw new Error('文章资料头缺少结尾的 ---');
    const header = content.slice(content.indexOf('\n') + 1, match.index);
    if (header.length > FRONTMATTER_MAX_LENGTH) throw new Error('文章资料头过长，请只保留标题、摘要和标签等资料');
    const document = parseDocument(header, { version: '1.2', schema: 'core', uniqueKeys: true, stringKeys: true });
    if (document.errors.length || document.warnings.length) throw new Error('文章资料头格式有误，请检查 YAML 字段、引号和缩进');
    if (!isMap(document.contents)) throw new Error('文章资料头必须是字段与值组成的对象');
    visit(document, (_key, node) => {
      if (isAlias(node) || (isNode(node) && (node.tag || ('anchor' in node && node.anchor)))) {
        throw new Error('文章资料头不支持 YAML 标签、锚点或别名');
      }
    });
    metadata = document.toJS({ maxAliasCount: 0 }) as Record<string, unknown>;
    if (metadata.schema_version !== undefined && metadata.schema_version !== 1) throw new Error('暂不支持该文章资料版本');
    content = content.slice(match.index + match[0].length).trim();
  }

  const tokens = markdown.parse(content, {});
  const headingIndex = tokens.findIndex(token => token.type === 'heading_open' && token.tag === 'h1');
  const heading = tokens[headingIndex];
  const headingText = headingIndex >= 0 ? tokens[headingIndex + 1]?.content.trim() || '' : '';
  const metadataTitle = textField(metadata, 'title', 100);
  const title = metadataTitle || headingText || fileName.replace(/\.(?:md|markdown)$/i, '');
  if (!title.trim() || title.length > 100) throw new Error('文章标题不能为空，且不能超过 100 个字符');
  // 只移除用作文章标题的一级标题；代码块中的 # 和不同标题均保留。
  if (heading?.map && headingText && (!metadataTitle || metadataTitle === headingText)) {
    const lines = content.split('\n');
    lines.splice(heading.map[0], heading.map[1] - heading.map[0]);
    content = lines.join('\n').trim();
  }
  if (!content.trim()) throw new Error('文章正文为空，请补充正文后导入');

  const rawTags = metadata.tags ?? [];
  if (!Array.isArray(rawTags) || rawTags.some(tag => typeof tag !== 'string' || tag.trim().length > 50)) {
    throw new Error('tags 必须是文本列表，每个标签最多 50 个字符');
  }
  const tags = [...new Map(rawTags.map((tag: string) => [tag.trim().toLowerCase(), tag.trim()])).values()].filter(Boolean);
  if (tags.length > 20) throw new Error('一次最多导入 20 个标签');
  return { fileName, title: title.trim(), summary: textField(metadata, 'summary', 500), tags, content };
}

/** 严格 UTF-8 解码，避免把乱码内容写入文章。 */
export async function readMarkdownArticle(file: File): Promise<MarkdownArticleImport> {
  if (!/\.(?:md|markdown)$/i.test(file.name)) throw new Error('请选择 .md 或 .markdown 文件');
  if (file.size > MARKDOWN_MAX_BYTES) throw new Error('Markdown 文件不能超过 1 MB');
  if (file.size === 0) throw new Error('Markdown 文件为空');
  const buffer = await file.arrayBuffer();
  let source: string;
  try {
    source = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    throw new Error('文件不是有效的 UTF-8 编码，请另存为 UTF-8 后重试');
  }
  return parseMarkdownArticle(source, file.name);
}
