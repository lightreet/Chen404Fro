import { parseEmojiTokens } from '../parser'

export function renderCommentTokens(content: string) {
  return parseEmojiTokens(content)
}

