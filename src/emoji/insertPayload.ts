import type { EmojiItem } from './types';

/**
 * 与评论区一致：Unicode 表情直接插入字符；图片类插入 :shortcode: 便于渲染层解析。
 */
export function emojiInsertPayload(item: EmojiItem): string {
  if (item.type === 'unicode' && item.unicode) {
    return item.unicode;
  }
  return `:${item.shortcode}:`;
}
