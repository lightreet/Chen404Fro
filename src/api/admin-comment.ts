import { get, put } from './request'
import type { PageParams, PageResult } from '@/types'

export type AdminCommentStatus = 0 | 1 | 2
export type AdminCommentScene = 'ALL' | 'ARTICLE' | 'GUESTBOOK'

export interface AdminComment {
  id: number | string
  articleId?: number | string
  articleTitle?: string
  scene: Exclude<AdminCommentScene, 'ALL'>
  parentId: number | string
  rootId: number | string
  replyToAuthorName?: string
  content: string
  authorName: string
  authorEmail?: string
  authorWebsite?: string
  authorAvatar?: string
  authorId?: number | string
  ip?: string
  location?: string
  userAgent?: string
  status: AdminCommentStatus
  isAdmin: number
  likeCount: number
  createTime: string
  updateTime: string
}

export interface AdminCommentStats {
  totalCount: number
  pendingCount: number
  approvedCount: number
  rejectedCount: number
}

export interface AdminCommentQueryParams extends PageParams {
  status?: AdminCommentStatus
  scene?: AdminCommentScene
  keyword?: string
}

export function getAdminComments(
  params?: AdminCommentQueryParams,
): Promise<PageResult<AdminComment>> {
  return get('/admin/comments', params)
}

export function getAdminCommentStats(): Promise<AdminCommentStats> {
  return get('/admin/comments/stats')
}

export function reviewAdminComment(
  id: number | string,
  status: 1 | 2,
): Promise<AdminComment> {
  return put(`/admin/comments/${id}/review`, { status })
}
