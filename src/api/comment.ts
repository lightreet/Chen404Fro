/**
 * 评论相关 API
 * 现在统一优先走 generated SDK，减少评论链路的手写路径漂移。
 */

import { get, post } from './request';
import type {
  Comment,
  CreateCommentParams,
  PageResult,
  PageParams,
} from '@/types';
import { Service } from '@/sdk/generated';
import { unwrapResult } from '@/sdk/runtime';
import { toPreciseId } from '@/utils/preciseId';

export async function getComments(
  articleId?: number | string,
  params?: PageParams,
): Promise<PageResult<Comment>> {
  return get<PageResult<Comment>>('/comments', {
    articleId: articleId ? toPreciseId(articleId) : undefined,
    page: params?.page,
    size: params?.size,
  });
}

export async function getGuestbookComments(params?: PageParams): Promise<PageResult<Comment>> {
  return unwrapResult(await Service.getGuestbookComments({
    page: params?.page,
    size: params?.size,
  })) as PageResult<Comment>;
}

export async function createComment(data: CreateCommentParams): Promise<Comment> {
  return post<Comment>('/comments', {
    articleId: data.articleId ? toPreciseId(data.articleId) : undefined,
    parentId: data.parentId,
    content: data.content,
    authorName: data.authorName,
    authorEmail: data.authorEmail,
    authorWebsite: data.authorWebsite,
  });
}

export async function deleteComment(id: number): Promise<void> {
  await unwrapResult(await Service.deleteComment({ id }));
}

export async function deleteCommentAsGuest(id: number, guestDeleteKey: string): Promise<void> {
  await unwrapResult(await Service.deleteComment({ id, guestDeleteKey }));
}

export async function reviewComment(id: number, status: 1 | 2): Promise<Comment> {
  return unwrapResult(await Service.reviewComment({
    id,
    requestBody: { status },
  })) as Comment;
}

export interface CommentLikeResponse {
  likes: number;
  liked: boolean;
}

export async function likeComment(id: number): Promise<CommentLikeResponse> {
  return unwrapResult(await Service.likeComment({ id })) as CommentLikeResponse;
}
