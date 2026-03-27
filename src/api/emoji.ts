import { get } from './request'
import type { EmojiItem } from '@/emoji/types'

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

