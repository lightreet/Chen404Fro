import {
  ArticleStatus,
  type ArticleDetail,
  type CreateArticleCommand,
  type UpdateArticleCommand,
} from '@/types';
import type { ArticleEditorForm, ArticleEditorOptions } from './types';
import { getArticleById, getCategories, getTags } from '@/api';

const SUMMARY_MAX_LEN = 200;

/**
 * 文章编辑页对接后端的集中入口，避免 composable 直接散落请求细节。
 */
export async function fetchArticleEditorOptions(): Promise<ArticleEditorOptions> {
  const [categories, tags] = await Promise.all([
    getCategories(),
    getTags(),
  ]);

  return {
    categories: categories || [],
    tags: tags || [],
  };
}

export function fetchArticleEditorDetail(articleId: number | string): Promise<ArticleDetail> {
  return getArticleById(articleId);
}

function buildSummary(summary: string | undefined, content: string) {
  const trimmedSummary = summary?.trim();
  if (trimmedSummary) {
    return trimmedSummary;
  }

  return content
    .replace(/[#*`\[\]!()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, SUMMARY_MAX_LEN);
}

/**
 * 将页面编辑态收敛成后端 command，避免视图直接拼接 payload。
 */
export function buildArticleSubmitData(
  form: ArticleEditorForm,
  formTagIds: number[],
  customTagNames: string[],
): CreateArticleCommand {
  const summary = buildSummary(form.summary, form.content);
  const tagNames = customTagNames.map((name) => name.trim()).filter(Boolean);

  return {
    title: form.title,
    content: form.content,
    coverImage: form.coverImage || undefined,
    categoryId: Number(form.categoryId),
    status: form.status,
    isTop: form.isTop,
    visibility: form.visibility,
    commentPolicy: form.commentPolicy,
    summary,
    tagIds: [...formTagIds],
    ...(tagNames.length > 0 ? { tagNames } : {}),
  };
}

export function buildDraftSubmitData(
  form: ArticleEditorForm,
  formTagIds: number[],
  customTagNames: string[],
): UpdateArticleCommand {
  return {
    ...buildArticleSubmitData(form, formTagIds, customTagNames),
    status: ArticleStatus.DRAFT,
  };
}
