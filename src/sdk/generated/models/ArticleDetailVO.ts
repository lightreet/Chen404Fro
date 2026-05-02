/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ArticleAuthorVO } from './ArticleAuthorVO';
import type { ArticleCategoryVO } from './ArticleCategoryVO';
import type { ArticleTagVO } from './ArticleTagVO';
/**
 * 文章详情视图对象
 */
export type ArticleDetailVO = {
    /**
     * 文章ID
     */
    id?: number;
    /**
     * 文章标题
     */
    title?: string;
    /**
     * 文章摘要
     */
    summary?: string;
    /**
     * 封面图片地址
     */
    coverImage?: string;
    /**
     * 作者ID
     */
    authorId?: number;
    /**
     * 分类ID
     */
    categoryId?: number;
    /**
     * 文章状态：0-草稿 1-已发布 2-回收站
     */
    status?: number;
    /**
     * 浏览量
     */
    viewCount?: number;
    /**
     * 评论数
     */
    commentCount?: number;
    /**
     * 点赞数
     */
    likeCount?: number;
    /**
     * 是否置顶：0-否 1-是
     */
    isTop?: number;
    /**
     * 是否推荐：0-否 1-是
     */
    isRecommend?: number;
    /**
     * 可见性：0-公开 1-登录可见 2-好友可见 3-私密
     */
    visibility?: number;
    /**
     * 评论策略：0-关闭 1-登录可评论 2-好友可评论 3-游客可评论
     */
    commentPolicy?: number;
    /**
     * 发布时间
     */
    publishTime?: string;
    /**
     * 创建时间
     */
    createTime?: string;
    /**
     * 更新时间
     */
    updateTime?: string;
    author?: ArticleAuthorVO;
    category?: ArticleCategoryVO;
    /**
     * 标签摘要列表
     */
    tags?: Array<ArticleTagVO>;
    /**
     * 当前用户是否可编辑
     */
    canEdit?: boolean;
    /**
     * 当前用户是否可删除
     */
    canDelete?: boolean;
    /**
     * 当前用户是否已点赞
     */
    liked?: boolean;
    /**
     * 当前用户是否已收藏
     */
    favorited?: boolean;
    /**
     * Markdown 正文内容
     */
    content?: string;
    /**
     * 服务端渲染后的 HTML 内容
     */
    contentHtml?: string;
    /**
     * 是否原创：0-转载 1-原创
     */
    isOriginal?: number;
    /**
     * 转载原文链接
     */
    originalUrl?: string;
    /**
     * 当前用户是否可评论
     */
    canComment?: boolean;
};

