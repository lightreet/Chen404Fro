import { getEmojiByShortcode } from './registry'
import type { EmojiToken } from './types'

const SHORTCODE_REGEX = /:([a-z0-9_]+):/gi

export function parseEmojiTokens(content: string): EmojiToken[] {
  if (!content) return [{ type: 'text', value: '' }]

  const tokens: EmojiToken[] = []
  let lastIndex = 0

  content.replace(SHORTCODE_REGEX, (match, code: string, offset: number) => {
    if (offset > lastIndex) {
      tokens.push({ type: 'text', value: content.slice(lastIndex, offset) })
    }
    const emoji = getEmojiByShortcode(code)
    if (emoji) {
      tokens.push({ type: 'emoji', value: code, emoji })
    } else {
      tokens.push({ type: 'text', value: match })
    }
    lastIndex = offset + match.length
    return match
  })

  if (lastIndex < content.length) {
    tokens.push({ type: 'text', value: content.slice(lastIndex) })
  }

  return tokens
}

export function renderShortcodesToText(content: string): string {
  return parseEmojiTokens(content)
    .map((token) => (token.type === 'emoji' ? token.emoji.unicode || `:${token.value}:` : token.value))
    .join('')
}

export function countEmojiTokens(content: string): number {
  return parseEmojiTokens(content).filter((token) => token.type === 'emoji').length
}

