/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ArticleListItemVO } from './ArticleListItemVO';
import type { BannerVO } from './BannerVO';
import type { RecentCommentVO } from './RecentCommentVO';
import type { SiteStatsVO } from './SiteStatsVO';
/**
 * 首页聚合数据视图对象
 */
export type HomeDataVO = {
    /**
     * 轮播图列表
     */
    banners?: Array<BannerVO>;
    stats?: SiteStatsVO;
    /**
     * 热门文章列表
     */
    hotArticles?: Array<ArticleListItemVO>;
    /**
     * 最新评论列表
     */
    recentComments?: Array<RecentCommentVO>;
};

