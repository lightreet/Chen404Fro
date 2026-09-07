import axios from 'axios'
import { get, post, del } from './request'
import type { UploadResult } from './upload'

export interface MobileUploadReceipt {
  requestId: string
  name: string
  status: 'uploading' | 'done' | 'failed'
}
export interface MobileUploadSession {
  sessionId: string
  targetKind: 'cover' | 'stop'
  targetLabel: string
  travelTitle: string
  expiresAt: number
  status: 'active' | 'closed' | 'expired'
  connected: boolean
  uploadingCount: number
  batchActive: boolean
  maxCount: number
  maxFileBytes: number
  allowedTypes: string[]
  receipts: MobileUploadReceipt[]
  images: UploadResult[]
}
export interface MobileUploadCreated {
  sessionId: string
  token: string
  uploadUrl: string
  session: MobileUploadSession
}
export interface MobileUploadTarget {
  key: string
  kind: 'cover' | 'stop'
  label: string
  travelTitle: string
}

const endpoint = '/upload/travel-mobile'
const quiet = { suppressErrorMessage: true, skipAuthRedirect: true }

export function createMobileUpload(target: MobileUploadTarget) {
  return post<MobileUploadCreated>(
    `${endpoint}/sessions`,
    {
      targetKind: target.kind,
      targetLabel: target.label,
      travelTitle: target.travelTitle,
    },
    quiet,
  )
}
export function pollMobileUpload(id: string) {
  return get<MobileUploadSession>(`${endpoint}/sessions/${id}`, undefined, quiet)
}
export function closeMobileUpload(id: string, requireIdle = false) {
  return del<MobileUploadSession>(`${endpoint}/sessions/${id}`, { ...quiet, params: { requireIdle } })
}

// 手机端专用客户端：不携带账号 token，也不触发登录弹窗或账号续期。
// 使用同源 /api，避免手机把电脑配置中的 localhost 当成自己的地址。
const mobileClient = axios.create({ baseURL: '/api', timeout: 15_000, withCredentials: false })
export function mobileUploadError(error: unknown): string {
  if (axios.isAxiosError(error)) return error.response?.data?.message || '连接中断，请检查网络后重试'
  return error instanceof Error ? error.message : '操作失败，请重试'
}
export function isMobileUploadForbidden(error: unknown) {
  return axios.isAxiosError(error) && [401, 403].includes(error.response?.status || 0)
}
export function isMobileUploadGone(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 410
}
export async function getMobileUploadStatus(id: string, token: string, batchId?: string) {
  const { data } = await mobileClient.get<{ code: number; data: MobileUploadSession; message?: string }>(
    `${endpoint}/public/${id}`,
    { headers: { 'X-Upload-Token': token }, params: batchId ? { batchId } : undefined },
  )
  if (data.code !== 200) throw new Error(data.message || '上传链接不可用')
  return data.data
}
export async function beginMobileBatch(id: string, token: string, batchId: string) {
  await mobileClient.post(`${endpoint}/public/${id}/batches/${batchId}`, undefined, {
    headers: { 'X-Upload-Token': token },
  })
}
export async function endMobileBatch(id: string, token: string, batchId: string) {
  await mobileClient.delete(`${endpoint}/public/${id}/batches/${batchId}`, {
    headers: { 'X-Upload-Token': token },
  })
}
export async function sendMobilePhoto(
  id: string,
  token: string,
  requestId: string,
  file: File,
  onProgress: (progress: number) => void,
  signal: AbortSignal,
) {
  const body = new FormData()
  body.append('file', file)
  body.append('requestId', requestId)
  const { data } = await mobileClient.post<{ code: number; data: MobileUploadReceipt; message?: string }>(
    `${endpoint}/public/${id}/images`,
    body,
    {
      headers: { 'X-Upload-Token': token },
      timeout: 120_000,
      signal,
      onUploadProgress: (event) =>
        onProgress(Math.min(99, Math.round((event.loaded / (event.total || file.size)) * 100))),
    },
  )
  if (data.code !== 200) throw new Error(data.message || '图片上传失败')
  return data.data
}

/** 局域网 HTTP 下也能生成随机请求 ID，不依赖仅安全上下文可用的 randomUUID。 */
export function mobileUploadRequestId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) =>
    value.toString(16).padStart(2, '0'),
  ).join('')
}
