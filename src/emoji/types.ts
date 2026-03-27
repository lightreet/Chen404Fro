export type EmojiScene = 'comment' | 'article' | 'signature'

export interface EmojiItem {
  id: string
  shortcode: string
  pack: string
  category: string
  label: string
  unicode?: string
  asset?: string
  type: 'unicode' | 'image'
  enabled: boolean
  sort: number
}

export interface ScenePolicy {
  maxEmoji: number
  allowedPacks: string[]
  allowGif: boolean
}

export type EmojiToken =
  | { type: 'text'; value: string }
  | { type: 'emoji'; value: string; emoji: EmojiItem }

