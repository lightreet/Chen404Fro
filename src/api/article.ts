/**
 * 文章相关 API
 * 包含文章列表、详情、分类、标签、归档等功能
 */

import { get, post, put, del } from './request';
import type {
  Article,
  Category,
  Tag,
  PageResult,
  PageParams,
  ArticleQueryParams,
  ArchiveYear,
} from '@/types';

/**
 * 获取文章列表
 * @param params 查询参数 { page, size, categoryId, tagId, keyword, orderBy }
 */
export function getArticles(params?: ArticleQueryParams): Promise<PageResult<Article>> {
  return get('/articles', params);
}

/**
 * 获取文章详情
 * @param id 文章ID（请传 string，避免 Long 在 JS 中精度丢失）
 * @param incrementView 是否增加阅读量，默认为true
 */
export function getArticleById(
  id: number | string,
  incrementView: boolean = true
): Promise<Article> {
  return get(`/articles/${String(id)}`, { incrementView });
}

/**
 * 获取上一篇和下一篇文章
 * @param id 当前文章ID（请传 string，避免 Long 在 JS 中精度丢失）
 */
export function getArticleNeighbors(id: number | string): Promise<{
  prev?: { id: number | string; title: string };
  next?: { id: number | string; title: string };
}> {
  return get(`/articles/${String(id)}/neighbors`);
}

/**
 * 创建文章（管理员）
 * @param data 文章数据
 */
export function createArticle(data: Partial<Article>): Promise<Article> {
  return post('/admin/articles', data);
}

/**
 * 更新文章（管理员）
 * @param id 文章ID
 * @param data 文章数据
 */
export function updateArticle(id: number | string, data: Partial<Article>): Promise<Article> {
  return put(`/admin/articles/${String(id)}`, data);
}

/**
 * 删除文章（管理员）
 * @param id 文章ID
 */
export function deleteArticle(id: number | string): Promise<void> {
  return del(`/admin/articles/${String(id)}`);
}

/**
 * 获取当前登录用户的文章列表（个人中心管理）
 */
export function getMyArticles(params?: {
  page?: number;
  size?: number;
  status?: number;
  keyword?: string;
}): Promise<PageResult<Article>> {
  return get('/admin/articles', params);
}

/**
 * 点赞文章
 * @param id 文章ID
 */
export function likeArticle(id: number): Promise<{ likes: number }> {
  return post(`/articles/${id}/like`);
}

// ==================== 分类相关 ====================

/**
 * 获取分类列表
 * @param withArticleCount 是否包含文章数量
 */
export function getCategories(withArticleCount: boolean = true): Promise<Category[]> {
  return get('/categories', { withArticleCount });
}

/**
 * 获取分类详情
 * @param id 分类ID或slug
 */
export function getCategoryById(id: number | string): Promise<Category> {
  return get(`/categories/${id}`);
}

/**
 * 获取分类下的文章
 * @param categoryId 分类ID
 * @param params 分页参数
 */
export function getArticlesByCategory(
  categoryId: number | string,
  params?: PageParams
): Promise<PageResult<Article>> {
  return get(`/categories/${categoryId}/articles`, params);
}

/**
 * 创建分类（管理员）
 * @param data 分类数据
 */
export function createCategory(data: Partial<Category>): Promise<Category> {
  return post('/admin/categories', data);
}

/**
 * 更新分类（管理员）
 * @param id 分类ID
 * @param data 分类数据
 */
export function updateCategory(id: number, data: Partial<Category>): Promise<Category> {
  return put(`/admin/categories/${id}`, data);
}

/**
 * 删除分类（管理员）
 * @param id 分类ID
 */
export function deleteCategory(id: number): Promise<void> {
  return del(`/admin/categories/${id}`);
}

// ==================== 标签相关 ====================

/**
 * 获取标签列表
 * @param withArticleCount 是否包含文章数量
 */
export function getTags(withArticleCount: boolean = true): Promise<Tag[]> {
  return get('/tags', { withArticleCount });
}

/**
 * 获取标签详情
 * @param id 标签ID或slug
 */
export function getTagById(id: number | string): Promise<Tag> {
  return get(`/tags/${id}`);
}

/**
 * 获取标签下的文章
 * @param tagId 标签ID
 * @param params 分页参数
 */
export function getArticlesByTag(
  tagId: number | string,
  params?: PageParams
): Promise<PageResult<Article>> {
  return get(`/tags/${tagId}/articles`, params);
}

/**
 * 创建标签（管理员）
 * @param data 标签数据
 */
export function createTag(data: Partial<Tag>): Promise<Tag> {
  return post('/admin/tags', data);
}

/**
 * 更新标签（管理员）
 * @param id 标签ID
 * @param data 标签数据
 */
export function updateTag(id: number, data: Partial<Tag>): Promise<Tag> {
  return put(`/admin/tags/${id}`, data);
}

/**
 * 删除标签（管理员）
 * @param id 标签ID
 */
export function deleteTag(id: number): Promise<void> {
  return del(`/admin/tags/${id}`);
}

// ==================== 归档相关 ====================

/**
 * 获取归档数据
 * 按年月分组的文章列表
 */
export function getArchives(): Promise<ArchiveYear[]> {
  return get('/archives');
}

/**
 * 根据日期获取文章
 * @param year 年份
 * @param month 月份（可选）
 * @param params 分页参数
 */
export function getArticlesByDate(
  year: number,
  month?: number,
  params?: PageParams
): Promise<PageResult<Article>> {
  const path = month ? `/archives/${year}/${month}` : `/archives/${year}`;
  return get(path, params);
}
