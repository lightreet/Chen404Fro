/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 创建评论请求参数
 */
export type CreateCommentDTO = {
    /**
     * 文章ID（留言板评论可不传）
     */
    articleId?: number;
    /**
     * 父评论ID（顶级评论传 0 或不传）
     */
    parentId?: number;
    /**
     * 评论内容
     */
    content?: string;
    /**
     * 评论者名称（游客必填，登录用户可不传）
     */
    authorName?: string;
    /**
     * 评论者邮箱
     */
    authorEmail?: string;
    /**
     * 评论者网站
     */
    authorWebsite?: string;
};

