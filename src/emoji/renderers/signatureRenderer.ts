import { parseEmojiTokens } from '../parser'
import { scenePolicies } from '../scenePolicy'

export function renderSignatureTokens(content: string) {
  const tokens = parseEmojiTokens(content || '')
  let emojiCount = 0

  return tokens.map((token) => {
    if (token.type !== 'emoji') return token
    emojiCount += 1
    if (emojiCount > scenePolicies.signature.maxEmoji) {
      return { type: 'text' as const, value: token.emoji.unicode || `:${token.value}:` }
    }
    return token
  })
}

