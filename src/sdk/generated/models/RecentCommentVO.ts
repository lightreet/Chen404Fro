/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 首页最新评论视图对象
 */
export type RecentCommentVO = {
    /**
     * 评论ID
     */
    id?: number;
    /**
     * 所属文章ID，留言板评论为空
     */
    articleId?: number;
    /**
     * 文章标题，留言板评论为空
     */
    articleTitle?: string;
    /**
     * 评论内容
     */
    content?: string;
    /**
     * 评论作者昵称
     */
    authorName?: string;
    /**
     * 评论作者头像地址
     */
    authorAvatar?: string;
    /**
     * 评论创建时间
     */
    createTime?: string;
};

