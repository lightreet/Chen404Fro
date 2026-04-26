import type { PageResult, TrustRequest } from '@/types'
import { get, post, put } from './request'

export interface CreateTrustRequestParams {
  reason: string
  attachmentUrls?: string[]
}

export interface ReviewTrustRequestParams {
  reviewNote?: string
}

export interface TrustRequestQueryParams {
  page?: number
  size?: number
  status?: number
  keyword?: string
}

export function createTrustRequest(data: CreateTrustRequestParams): Promise<TrustRequest> {
  return post('/trust-requests', data)
}

export function getMyLatestTrustRequest(): Promise<TrustRequest | null> {
  return get('/trust-requests/me/latest')
}

export function getAdminTrustRequests(params: TrustRequestQueryParams): Promise<PageResult<TrustRequest>> {
  return get('/admin/trust-requests', params)
}

export function approveTrustRequest(id: number | string, data?: ReviewTrustRequestParams): Promise<TrustRequest> {
  return put(`/admin/trust-requests/${String(id)}/approve`, data || {})
}

export function rejectTrustRequest(id: number | string, data: ReviewTrustRequestParams): Promise<TrustRequest> {
  return put(`/admin/trust-requests/${String(id)}/reject`, data)
}
