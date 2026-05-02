/**
 * 文章相关 API
 * 先把读取类接口收敛到 generated SDK，写接口暂时保留手写 request 以复用现有鉴权/续期策略。
 */

import { get, post, put, del, type RequestConfig } from './request';
import type {
  ArticleDetail,
  ArticleListItem,
  Category,
  CreateArticleCommand,
  CreateCategoryCommand,
  Tag,
  PageResult,
  PageParams,
  ArticleQueryParams,
  ArchiveYear,
  UpdateArticleCommand,
  UpdateCategoryCommand,
} from '@/types';
import { Service } from '@/sdk/generated';
import { unwrapResult } from '@/sdk/runtime';

/**
 * 获取文章列表
 */
export async function getArticles(params?: ArticleQueryParams): Promise<PageResult<ArticleListItem>> {
  return unwrapResult(await Service.getArticles({
    page: params?.page,
    size: params?.size,
    status: params?.status,
    categoryId: params?.categoryId,
    tagId: params?.tagId,
    authorId: params?.authorId ? Number(params.authorId) : undefined,
    keyword: params?.keyword,
  })) as PageResult<ArticleListItem>;
}

/**
 * 获取文章详情
 */
export async function getArticleById(
  id: number | string,
  incrementView: boolean = true,
): Promise<ArticleDetail> {
  return unwrapResult(await Service.getArticleById({
    id: Number(id),
    incrementView,
  })) as ArticleDetail;
}

/**
 * 获取上一篇和下一篇文章
 */
export async function getArticleNeighbors(id: number | string): Promise<{
  prev?: { id: number | string; title: string };
  next?: { id: number | string; title: string };
}> {
  return unwrapResult(await Service.getArticleNeighbors({
    id: Number(id),
  })) as {
    prev?: { id: number | string; title: string };
    next?: { id: number | string; title: string };
  };
}

/**
 * 创建文章（需登录）
 */
export function createArticle(data: CreateArticleCommand, config?: RequestConfig): Promise<ArticleDetail> {
  return post('/articles', data, config);
}

/**
 * 更新文章（需登录）
 */
export function updateArticle(
  id: number | string,
  data: UpdateArticleCommand,
  config?: RequestConfig,
): Promise<ArticleDetail> {
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
}): Promise<PageResult<ArticleListItem>> {
  return get('/articles/mine', params);
}

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

export function getMyLikedArticles(params?: PageParams): Promise<PageResult<ArticleListItem>> {
  return get('/articles/mine/liked', params);
}

export function getMyFavoriteArticles(params?: PageParams): Promise<PageResult<ArticleListItem>> {
  return get('/articles/mine/favorites', params);
}

/**
 * 获取分类列表
 */
export async function getCategories(withArticleCount: boolean = true): Promise<Category[]> {
  return unwrapResult(await Service.getCategories({
    withArticleCount,
  })) as Category[];
}

export function getAdminCategories(params?: PageParams): Promise<PageResult<Category>> {
  return get('/admin/categories', params);
}

/**
 * 获取分类详情
 */
export async function getCategoryById(id: number | string): Promise<Category> {
  return unwrapResult(await Service.getCategoryById({
    id: Number(id),
  })) as Category;
}

/**
 * 获取分类下的文章
 */
export function getArticlesByCategory(
  categoryId: number | string,
  params?: PageParams,
): Promise<PageResult<ArticleListItem>> {
  return get('/articles', { categoryId, ...params });
}

export function createCategory(data: CreateCategoryCommand): Promise<Category> {
  return post('/categories', data);
}

export function updateCategory(id: number, data: UpdateCategoryCommand): Promise<Category> {
  return put(`/categories/${id}`, data);
}

export function deleteCategory(id: number): Promise<void> {
  return del(`/categories/${id}`);
}

/**
 * 获取标签列表
 */
export async function getTags(withArticleCount: boolean = true): Promise<Tag[]> {
  return unwrapResult(await Service.getTags({
    withArticleCount,
  })) as Tag[];
}

/**
 * 获取标签详情
 */
export async function getTagById(id: number | string): Promise<Tag> {
  return unwrapResult(await Service.getTagById({
    idOrSlug: String(id),
  })) as Tag;
}

/**
 * 获取标签下的文章
 */
export function getArticlesByTag(
  tagId: number | string,
  params?: PageParams,
): Promise<PageResult<ArticleListItem>> {
  return get('/articles', { tagId, ...params });
}

/**
 * 获取归档数据
 */
export async function getArchives(): Promise<ArchiveYear[]> {
  return unwrapResult(await Service.listArchives()) as ArchiveYear[];
}
