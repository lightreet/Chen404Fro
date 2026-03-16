/**
 * 首页相关 API
 * 包含站点统计、Banner、热门文章等首页展示数据
 */

import { get } from './request';
import type {
  HomeData,
  SiteStats,
  SiteConfig,
  Banner,
  HotArticle,
  RecentComment,
} from '@/types';

/**
 * 获取首页聚合数据
 * 包含：Banner、站点统计、热门文章、最新评论
 */
export function getHomeData(): Promise<HomeData> {
  return get('/home');
}

/**
 * 获取站点配置信息
 * 包含：站点名称、描述、Logo、备案号等
 */
export function getSiteConfig(): Promise<SiteConfig> {
  return get('/site/config');
}

/**
 * 获取站点统计数据
 * 包含：文章数、分类数、标签数、评论数、访问数
 */
export function getSiteStats(): Promise<SiteStats> {
  return get('/site/stats');
}

/**
 * 获取首页轮播图/Banner列表
 */
export function getBanners(): Promise<Banner[]> {
  return get('/site/banners');
}

/**
 * 获取热门文章列表
 * @param limit 数量限制，默认10条
 */
export function getHotArticles(limit: number = 10): Promise<HotArticle[]> {
  return get('/articles/hot', { limit });
}

/**
 * 获取最新评论列表
 * @param limit 数量限制，默认5条
 */
export function getRecentComments(limit: number = 5): Promise<RecentComment[]> {
  return get('/comments/recent', { limit });
}

/**
 * 获取推荐文章列表
 * @param limit 数量限制，默认6条
 */
export function getRecommendArticles(limit: number = 6): Promise<{
  id: number;
  title: string;
  coverImage?: string;
  summary?: string;
}> {
  return get('/articles/recommend', { limit });
}
