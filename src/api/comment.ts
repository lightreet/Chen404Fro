/**
 * 评论相关 API
 * 现在统一优先走 generated SDK，减少评论链路的手写路径漂移。
 */

import type {
  Comment,
  CreateCommentParams,
  PageResult,
  PageParams,
} from '@/types';
import { Service } from '@/sdk/generated';
import { unwrapResult } from '@/sdk/runtime';

export async function getComments(
  articleId?: number | string,
  params?: PageParams,
): Promise<PageResult<Comment>> {
  return unwrapResult(await Service.getComments({
    articleId: articleId ? Number(articleId) : undefined,
    page: params?.page,
    size: params?.size,
  })) as PageResult<Comment>;
}

export async function getGuestbookComments(params?: PageParams): Promise<PageResult<Comment>> {
  return unwrapResult(await Service.getGuestbookComments({
    page: params?.page,
    size: params?.size,
  })) as PageResult<Comment>;
}

export async function createComment(data: CreateCommentParams): Promise<Comment> {
  return unwrapResult(await Service.createComment({
    requestBody: {
      articleId: data.articleId ? Number(data.articleId) : undefined,
      parentId: data.parentId,
      content: data.content,
      authorName: data.authorName,
      authorEmail: data.authorEmail,
      authorWebsite: data.authorWebsite,
    },
  })) as Comment;
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
