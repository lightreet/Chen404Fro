/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 创建文章命令对象
 */
export type CreateArticleCommand = {
    /**
     * 文章标题
     */
    title: string;
    /**
     * 文章摘要
     */
    summary?: string;
    /**
     * Markdown 正文内容
     */
    content: string;
    /**
     * 封面图片地址
     */
    coverImage?: string;
    /**
     * 分类ID
     */
    categoryId: number;
    /**
     * 文章状态：0-草稿 1-已发布 2-回收站
     */
    status: number;
    /**
     * 是否置顶：0-否 1-是
     */
    isTop?: number;
    /**
     * 是否推荐：0-否 1-是
     */
    isRecommend?: number;
    /**
     * 是否原创：0-转载 1-原创
     */
    isOriginal?: number;
    /**
     * 转载原文链接
     */
    originalUrl?: string;
    /**
     * 访问密码，仅私密文章需要
     */
    password?: string;
    /**
     * 可见性：0-公开 1-登录可见 2-好友可见 3-私密
     */
    visibility?: number;
    /**
     * 评论策略：0-关闭 1-登录可评论 2-好友可评论 3-游客可评论
     */
    commentPolicy?: number;
    /**
     * 已存在标签ID列表
     */
    tagIds?: Array<number>;
    /**
     * 新建标签名称列表
     */
    tagNames?: Array<string>;
};

