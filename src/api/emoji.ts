import { del, get, post } from './request'
import type { EmojiItem } from '@/emoji/types'
import type { PageParams, PageResult } from '@/types'

export interface EmojiPackDto {
  id: number
  packCode: string
  name: string
  description?: string
  iconUrl?: string
  enabled: number
  sort: number
}

export function getEmojiPacks(): Promise<EmojiPackDto[]> {
  return get('/emoji/packs')
}

export function getEmojiItems(params?: { scene?: string; packCode?: string }): Promise<EmojiItem[]> {
  return get('/emoji/items', params)
}

export interface AdminEmojiPack {
  id: number
  packCode: string
  name: string
  description?: string
  iconUrl?: string
  enabled: number
  sort: number
}

export interface AdminEmojiItem {
  id: number
  packCode: string
  shortcode: string
  label: string
  category: string
  type: number
  unicode?: string
  assetUrl?: string
  width?: number
  height?: number
  enabled: number
  sort: number
}

export interface EmojiPackUpsertPayload {
  packCode: string
  name: string
  description?: string
  iconUrl?: string
  enabled?: number
  sort?: number
}

export interface EmojiItemUpsertPayload {
  packCode: string
  shortcode: string
  label: string
  category: string
  type: number
  unicode?: string
  assetUrl?: string
  width?: number | null
  height?: number | null
  enabled?: number
  sort?: number
}

export interface EmojiImportResult {
  packCode: string
  successCount: number
  failCount: number
  errors: Array<{ shortcode: string; error: string }>
}

export function getAdminEmojiPacks(params?: PageParams): Promise<PageResult<AdminEmojiPack>> {
  return get('/admin/emoji/packs', params)
}

export function upsertEmojiPack(data: EmojiPackUpsertPayload): Promise<AdminEmojiPack> {
  return post('/admin/emoji/packs', data)
}

export function deleteEmojiPack(id: number): Promise<void> {
  return del(`/admin/emoji/packs/${id}`)
}

export function getAdminEmojiItems(params?: PageParams & { packCode?: string }): Promise<PageResult<AdminEmojiItem>> {
  return get('/admin/emoji/items', params)
}

export function upsertEmojiItem(data: EmojiItemUpsertPayload): Promise<AdminEmojiItem> {
  return post('/admin/emoji/items', data)
}

export function deleteEmojiItem(id: number): Promise<void> {
  return del(`/admin/emoji/items/${id}`)
}

export function importEmojiPack(file: File): Promise<EmojiImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  return post('/admin/emoji/import', formData, { timeout: 60000, headers: {} })
}

