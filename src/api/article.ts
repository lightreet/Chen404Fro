/**
 * 文章相关 API
 * 包含文章列表、详情、分类、标签、归档等功能
 */

import { get, post, put, del, type RequestConfig } from './request';
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
 * 创建文章（需登录）
 */
export function createArticle(data: Partial<Article>, config?: RequestConfig): Promise<Article> {
  return post('/articles', data, config);
}

/**
 * 更新文章（需登录）
 */
export function updateArticle(id: number | string, data: Partial<Article>, config?: RequestConfig): Promise<Article> {
  return put(`/articles/${String(id)}`, data, config);
}

/**
 * 删除文章（需登录）
 */
export function deleteArticle(id: number | string): Promise<void> {
  return del(`/articles/${String(id)}`);
}

/**
 * 获取当前登录用户的文章列表（个人中心管理，需登录）
 */
export function getMyArticles(params?: {
  page?: number;
  size?: number;
  status?: number;
  keyword?: string;
}): Promise<PageResult<Article>> {
  return get('/articles/mine', params);
}

/** 文章点赞接口返回（匿名无 liked 字段） */
export interface ArticleLikeResponse {
  likes: number;
  liked?: boolean;
}

/**
 * 点赞文章：匿名每次 +1（限流）；登录为切换赞/取消
 */
export function likeArticle(id: number | string): Promise<ArticleLikeResponse> {
  return post(`/articles/${String(id)}/like`);
}

/**
 * 切换收藏（需登录）
 */
export function toggleArticleFavorite(id: number | string): Promise<{ favorited: boolean }> {
  return post(`/articles/${String(id)}/favorite`);
}

/** 个人中心：我点赞的文章 */
export function getMyLikedArticles(params?: PageParams): Promise<PageResult<Article>> {
  return get('/articles/mine/liked', params);
}

/** 个人中心：我的收藏 */
export function getMyFavoriteArticles(params?: PageParams): Promise<PageResult<Article>> {
  return get('/articles/mine/favorites', params);
}

// ==================== 分类相关 ====================

/**
 * 获取分类列表
 * @param withArticleCount 是否包含文章数量
 */
export function getCategories(withArticleCount: boolean = true): Promise<Category[]> {
  return get('/categories', { withArticleCount });
}

export function getAdminCategories(params?: PageParams): Promise<PageResult<Category>> {
  return get('/admin/categories', params);
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
 * 创建分类（需管理员，后端 @RequireAdmin 校验）
 */
export function createCategory(data: Partial<Category>): Promise<Category> {
  return post('/categories', data);
}

/**
 * 更新分类（需管理员）
 */
export function updateCategory(id: number, data: Partial<Category>): Promise<Category> {
  return put(`/categories/${id}`, data);
}

/**
 * 删除分类（需管理员）
 */
export function deleteCategory(id: number): Promise<void> {
  return del(`/categories/${id}`);
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
