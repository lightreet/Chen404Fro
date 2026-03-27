import type { EmojiScene, ScenePolicy } from './types'

export const scenePolicies: Record<EmojiScene, ScenePolicy> = {
  comment: {
    maxEmoji: 20,
    allowedPacks: ['basic'],
    allowGif: false,
  },
  article: {
    maxEmoji: 200,
    allowedPacks: ['basic', 'extended'],
    allowGif: false,
  },
  signature: {
    maxEmoji: 8,
    allowedPacks: ['basic'],
    allowGif: false,
  },
}

