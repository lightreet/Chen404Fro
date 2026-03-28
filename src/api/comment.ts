/**
 * 评论相关 API
 * 包含评论列表、发表评论、点赞评论等功能
 */

import { get, post, put, del } from './request';
import type {
  Comment,
  CreateCommentParams,
  PageResult,
  PageParams,
} from '@/types';

/**
 * 获取评论列表
 * @param articleId 文章ID（可选，不传则获取留言板评论）
 * @param params 分页参数
 */
export function getComments(
  articleId?: number | string,
  params?: PageParams
): Promise<PageResult<Comment>> {
  return get('/comments', { articleId, ...params });
}

/**
 * 获取留言板评论列表
 * @param params 分页参数
 */
export function getGuestbookComments(params?: PageParams): Promise<PageResult<Comment>> {
  return get('/comments/guestbook', params);
}

/**
 * 获取文章的评论数
 * @param articleId 文章ID
 */
export function getCommentCount(articleId: number | string): Promise<{ count: number }> {
  return get(`/articles/${articleId}/comment-count`);
}

/**
 * 发表评论
 * @param data 评论数据
 */
export function createComment(data: CreateCommentParams): Promise<Comment> {
  return post('/comments', data);
}

/**
 * 删除评论（管理员或评论本人）
 * @param id 评论ID
 */
export function deleteComment(id: number): Promise<void> {
  return del(`/comments/${id}`);
}

/**
 * 游客删除自己的评论（使用创建时返回的 guestDeleteKey）
 * @param id 评论ID
 * @param guestDeleteKey 游客删除密钥
 */
export function deleteCommentAsGuest(id: number, guestDeleteKey: string): Promise<void> {
  return del(`/comments/${id}`, { guestDeleteKey });
}

/**
 * 审核评论（管理员）
 * @param id 评论ID
 * @param status 审核状态 1-通过 2-拒绝
 */
export function reviewComment(id: number, status: 1 | 2): Promise<Comment> {
  return put(`/admin/comments/${id}/review`, { status });
}

/**
 * 点赞评论
 * @param id 评论ID
 */
export function likeComment(id: number): Promise<{ likes: number }> {
  return post(`/comments/${id}/like`);
}
