/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 评论视图对象
 */
export type CommentVO = {
    /**
     * 评论ID
     */
    id?: number;
    /**
     * 所属文章ID，留言板评论为空
     */
    articleId?: number;
    /**
     * 父评论ID，顶级评论为0
     */
    parentId?: number;
    /**
     * 根评论ID，顶级评论为0
     */
    rootId?: number;
    /**
     * 评论内容
     */
    content?: string;
    /**
     * 评论作者昵称
     */
    authorName?: string;
    /**
     * 评论作者邮箱
     */
    authorEmail?: string;
    /**
     * 评论作者主页
     */
    authorWebsite?: string;
    /**
     * 评论作者头像地址
     */
    authorAvatar?: string;
    /**
     * 作者用户ID，游客为空
     */
    authorId?: number;
    /**
     * 是否管理员评论：0-否 1-是
     */
    isAdmin?: number;
    /**
     * 点赞数
     */
    likeCount?: number;
    /**
     * 评论状态：0-待审核 1-已通过 2-已拒绝
     */
    status?: number;
    /**
     * 创建时间
     */
    createTime?: string;
    /**
     * 更新时间
     */
    updateTime?: string;
    /**
     * 子评论列表
     */
    children?: Array<CommentVO>;
    /**
     * 被回复用户ID
     */
    replyToUserId?: number;
    /**
     * 被回复作者昵称
     */
    replyToAuthorName?: string;
    /**
     * 游客评论自助删除Key，仅创建评论时返回一次
     */
    guestDeleteKey?: string;
    /**
     * 当前登录用户是否已点赞该评论
     */
    likedByMe?: boolean;
};

