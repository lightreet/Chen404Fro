/**
 * 文件上传相关 API。
 * 保留薄适配层，统一前端调用签名，同时底层走 generated SDK 对齐后端契约。
 */

import { Service } from '@/sdk/generated'
import { unwrapResult, type ResultEnvelope } from '@/sdk/runtime'

export interface UploadResult {
  url: string
  name: string
  size?: string
}

async function uploadSingleFile(
  file: File,
  handler: (params: { formData: { file: Blob } }) => Promise<unknown>,
): Promise<UploadResult> {
  const payload = unwrapResult(await handler({
    formData: { file },
  }) as ResultEnvelope<{ url?: string; name?: string; size?: string }>)

  return {
    url: payload.url || '',
    name: payload.name || '',
    size: payload.size,
  }
}

export function uploadImage(file: File): Promise<UploadResult> {
  return uploadSingleFile(file, Service.uploadImage)
}

export async function uploadImages(files: File[]): Promise<UploadResult[]> {
  const payload = unwrapResult(await Service.uploadImages({
    formData: { files },
  }) as ResultEnvelope<Array<{ url?: string; name?: string; size?: string }>>)

  return payload.map((item) => ({
    url: item.url || '',
    name: item.name || '',
    size: item.size,
  }))
}

export function uploadCover(file: File): Promise<UploadResult> {
  return uploadSingleFile(file, Service.uploadCover)
}

export function uploadSiteAsset(file: File): Promise<UploadResult> {
  return uploadSingleFile(file, Service.uploadSiteAsset)
}

export function uploadAvatar(file: File): Promise<UploadResult> {
  return uploadSingleFile(file, Service.uploadAvatar)
}

export function uploadTrustAttachment(file: File): Promise<UploadResult> {
  return uploadSingleFile(file, Service.uploadTrustAttachment)
}

export async function deleteFile(url: string): Promise<void> {
  await unwrapResult(await Service.deleteFile({ url }))
}
