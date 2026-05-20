/**
 * 文件上传相关 API。
 * 保留薄适配层，统一前端调用签名，同时底层走 generated SDK 对齐后端契约。
 */

import { Service } from '@/sdk/generated'
import { unwrapResult, type ResultEnvelope } from '@/sdk/runtime'
import { post } from './request'

export interface UploadResult {
  url: string
  name: string
  size?: string
  latitude?: number
  longitude?: number
  shotAt?: string
}

type UploadPayload = {
  url?: string
  name?: string
  size?: string
  latitude?: number
  longitude?: number
  shotAt?: string
}

async function uploadSingleFile(
  file: File,
  handler: (params: { formData: { file: Blob } }) => Promise<unknown>,
): Promise<UploadResult> {
  const payload = unwrapResult(await handler({
    formData: { file },
  }) as ResultEnvelope<UploadPayload>)

  return {
    url: payload.url || '',
    name: payload.name || '',
    size: payload.size,
    latitude: payload.latitude as number | undefined,
    longitude: payload.longitude as number | undefined,
    shotAt: payload.shotAt as string | undefined,
  }
}

export function uploadImage(file: File): Promise<UploadResult> {
  return uploadSingleFile(file, Service.uploadImage)
}

export async function uploadImages(files: File[]): Promise<UploadResult[]> {
  const payload = unwrapResult(await Service.uploadImages({
    formData: { files },
  }) as ResultEnvelope<UploadPayload[]>)

  return payload.map((item) => ({
    url: item.url || '',
    name: item.name || '',
    size: item.size,
    latitude: item.latitude as number | undefined,
    longitude: item.longitude as number | undefined,
    shotAt: item.shotAt as string | undefined,
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

export async function uploadTravelMemoryImage(file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  const payload = await post<UploadPayload>('/upload/travel-memory-image', formData as any)

  return {
    url: payload.url || '',
    name: payload.name || '',
    size: payload.size,
    latitude: payload.latitude,
    longitude: payload.longitude,
    shotAt: payload.shotAt,
  }
}

export async function deleteFile(url: string): Promise<void> {
  await unwrapResult(await Service.deleteFile({ url }))
}
