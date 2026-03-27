import type { EmojiItem } from './types'
import { emojiRegistry, replaceEmojiRegistry } from './registry'
import { getEmojiItems } from '@/api/emoji'

export interface RemoteEmojiItem {
  id: string
  shortcode: string
  pack: string
  category: string
  label: string
  unicode?: string
  asset?: string
  type?: 'unicode' | 'image'
  enabled?: boolean
  sort?: number
}

/**
 * 预留：后续可由后端下发表情元数据。
 * 当前返回本地内置 registry，保证不依赖后端即可运行。
 */
export async function loadEmojiRegistry(): Promise<EmojiItem[]> {
  try {
    const remote = await getEmojiItems()
    // 后端实体字段是 packCode/assetUrl；前端 EmojiItem 用 pack/asset
    const normalized: EmojiItem[] = (remote as any[]).map((it: any, idx) => ({
      id: String(it.id ?? `${it.packCode || it.pack}_${it.shortcode}`),
      shortcode: String(it.shortcode),
      pack: String(it.pack ?? it.packCode ?? 'basic'),
      category: String(it.category ?? 'emotion'),
      label: String(it.label ?? it.shortcode),
      unicode: it.unicode ?? undefined,
      asset: it.asset ?? it.assetUrl ?? undefined,
      type: it.type === 1 || it.type === 'image' ? 'image' : 'unicode',
      enabled: it.enabled ?? 1,
      sort: it.sort ?? idx + 1,
    }))
    replaceEmojiRegistry(normalized)
    return normalized
  } catch {
    return emojiRegistry
  }
}

export function normalizeRemoteEmojiItems(items: RemoteEmojiItem[]): EmojiItem[] {
  return items.map((item, idx) => ({
    id: item.id,
    shortcode: item.shortcode,
    pack: item.pack,
    category: item.category,
    label: item.label,
    unicode: item.unicode,
    asset: item.asset,
    type: item.type || (item.asset ? 'image' : 'unicode'),
    enabled: item.enabled ?? true,
    sort: item.sort ?? idx + 1,
  }))
}

