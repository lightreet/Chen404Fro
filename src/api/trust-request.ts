import type { PageResult, TrustRequest } from '@/types'
import { Service } from '@/sdk/generated'
import { unwrapResult } from '@/sdk/runtime'

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

export async function createTrustRequest(data: CreateTrustRequestParams): Promise<TrustRequest> {
  return unwrapResult(await Service.createRequest({
    requestBody: {
      reason: data.reason,
      attachmentUrls: data.attachmentUrls,
    },
  })) as TrustRequest
}

export async function getMyLatestTrustRequest(): Promise<TrustRequest | null> {
  return unwrapResult(await Service.getMyLatestRequest()) as TrustRequest | null
}

export async function getAdminTrustRequests(params: TrustRequestQueryParams): Promise<PageResult<TrustRequest>> {
  return unwrapResult(await Service.getAdminRequests({
    page: params.page,
    size: params.size,
    status: params.status,
    keyword: params.keyword,
  })) as PageResult<TrustRequest>
}

export async function approveTrustRequest(id: number | string, data?: ReviewTrustRequestParams): Promise<TrustRequest> {
  return unwrapResult(await Service.approveRequest({
    id: Number(id),
    requestBody: data ? { reviewNote: data.reviewNote } : undefined,
  })) as TrustRequest
}

export async function rejectTrustRequest(id: number | string, data: ReviewTrustRequestParams): Promise<TrustRequest> {
  return unwrapResult(await Service.rejectRequest({
    id: Number(id),
    requestBody: {
      reviewNote: data.reviewNote,
    },
  })) as TrustRequest
}
