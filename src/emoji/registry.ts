import type { EmojiItem, EmojiScene } from './types'
import { scenePolicies } from './scenePolicy'

const basicPack: EmojiItem[] = [
  { id: 'basic_smile', shortcode: 'basic_smile', pack: 'basic', category: 'emotion', label: '微笑', unicode: '🙂', type: 'unicode', enabled: true, sort: 1 },
  { id: 'basic_grin', shortcode: 'basic_grin', pack: 'basic', category: 'emotion', label: '大笑', unicode: '😄', type: 'unicode', enabled: true, sort: 2 },
  { id: 'basic_laugh', shortcode: 'basic_laugh', pack: 'basic', category: 'emotion', label: '笑哭', unicode: '😂', type: 'unicode', enabled: true, sort: 3 },
  { id: 'basic_joy', shortcode: 'basic_joy', pack: 'basic', category: 'emotion', label: '开心', unicode: '🥳', type: 'unicode', enabled: true, sort: 4 },
  { id: 'basic_love', shortcode: 'basic_love', pack: 'basic', category: 'emotion', label: '爱心眼', unicode: '😍', type: 'unicode', enabled: true, sort: 5 },
  { id: 'basic_think', shortcode: 'basic_think', pack: 'basic', category: 'emotion', label: '思考', unicode: '🤔', type: 'unicode', enabled: true, sort: 6 },
  { id: 'basic_wow', shortcode: 'basic_wow', pack: 'basic', category: 'emotion', label: '震惊', unicode: '😮', type: 'unicode', enabled: true, sort: 7 },
  { id: 'basic_sleepy', shortcode: 'basic_sleepy', pack: 'basic', category: 'emotion', label: '困', unicode: '😪', type: 'unicode', enabled: true, sort: 8 },
  // Windows 上部分字体对 🥹 支持不好，会出现“空白方块”，先用兼容性更好的 😢
  { id: 'basic_cry', shortcode: 'basic_cry', pack: 'basic', category: 'emotion', label: '哭哭', unicode: '😢', type: 'unicode', enabled: true, sort: 9 },
  { id: 'basic_sob', shortcode: 'basic_sob', pack: 'basic', category: 'emotion', label: '大哭', unicode: '😭', type: 'unicode', enabled: true, sort: 10 },
  { id: 'basic_angry', shortcode: 'basic_angry', pack: 'basic', category: 'emotion', label: '生气', unicode: '😤', type: 'unicode', enabled: true, sort: 11 },
  { id: 'basic_cool', shortcode: 'basic_cool', pack: 'basic', category: 'emotion', label: '酷', unicode: '😎', type: 'unicode', enabled: true, sort: 12 },
  { id: 'basic_wink', shortcode: 'basic_wink', pack: 'basic', category: 'emotion', label: '眨眼', unicode: '😉', type: 'unicode', enabled: true, sort: 13 },
  { id: 'basic_sweat', shortcode: 'basic_sweat', pack: 'basic', category: 'emotion', label: '汗', unicode: '😅', type: 'unicode', enabled: true, sort: 14 },
  { id: 'basic_hug', shortcode: 'basic_hug', pack: 'basic', category: 'emotion', label: '拥抱', unicode: '🤗', type: 'unicode', enabled: true, sort: 15 },
  { id: 'basic_shy', shortcode: 'basic_shy', pack: 'basic', category: 'emotion', label: '害羞', unicode: '😊', type: 'unicode', enabled: true, sort: 16 },
  { id: 'basic_sigh', shortcode: 'basic_sigh', pack: 'basic', category: 'emotion', label: '叹气', unicode: '😮‍💨', type: 'unicode', enabled: true, sort: 17 },
  { id: 'basic_dizzy', shortcode: 'basic_dizzy', pack: 'basic', category: 'emotion', label: '晕', unicode: '😵‍💫', type: 'unicode', enabled: true, sort: 18 },
  { id: 'basic_tired', shortcode: 'basic_tired', pack: 'basic', category: 'emotion', label: '疲惫', unicode: '😫', type: 'unicode', enabled: true, sort: 19 },
  { id: 'basic_ok', shortcode: 'basic_ok', pack: 'basic', category: 'social', label: 'OK', unicode: '👌', type: 'unicode', enabled: true, sort: 20 },
  { id: 'basic_thumbsup', shortcode: 'basic_thumbsup', pack: 'basic', category: 'social', label: '点赞', unicode: '👍', type: 'unicode', enabled: true, sort: 21 },
  { id: 'basic_clap', shortcode: 'basic_clap', pack: 'basic', category: 'social', label: '鼓掌', unicode: '👏', type: 'unicode', enabled: true, sort: 22 },
  { id: 'basic_pray', shortcode: 'basic_pray', pack: 'basic', category: 'social', label: '感谢', unicode: '🙏', type: 'unicode', enabled: true, sort: 23 },
  { id: 'basic_heart', shortcode: 'basic_heart', pack: 'basic', category: 'social', label: '爱心', unicode: '❤️', type: 'unicode', enabled: true, sort: 24 },
  { id: 'basic_fire', shortcode: 'basic_fire', pack: 'basic', category: 'social', label: '火', unicode: '🔥', type: 'unicode', enabled: true, sort: 25 },
  { id: 'basic_star', shortcode: 'basic_star', pack: 'basic', category: 'social', label: '星星', unicode: '⭐', type: 'unicode', enabled: true, sort: 26 },
  { id: 'basic_rocket', shortcode: 'basic_rocket', pack: 'basic', category: 'social', label: '冲', unicode: '🚀', type: 'unicode', enabled: true, sort: 27 },
  { id: 'basic_wave', shortcode: 'basic_wave', pack: 'basic', category: 'social', label: '挥手', unicode: '👋', type: 'unicode', enabled: true, sort: 28 },
  { id: 'basic_handshake', shortcode: 'basic_handshake', pack: 'basic', category: 'social', label: '握手', unicode: '🤝', type: 'unicode', enabled: true, sort: 29 },
  { id: 'basic_muscle', shortcode: 'basic_muscle', pack: 'basic', category: 'social', label: '加油', unicode: '💪', type: 'unicode', enabled: true, sort: 30 },
  { id: 'basic_confetti', shortcode: 'basic_confetti', pack: 'basic', category: 'social', label: '庆祝', unicode: '🎉', type: 'unicode', enabled: true, sort: 31 },
  { id: 'basic_gift', shortcode: 'basic_gift', pack: 'basic', category: 'social', label: '礼物', unicode: '🎁', type: 'unicode', enabled: true, sort: 32 },
  { id: 'basic_camera', shortcode: 'basic_camera', pack: 'basic', category: 'daily', label: '相机', unicode: '📷', type: 'unicode', enabled: true, sort: 40 },
  { id: 'basic_coffee', shortcode: 'basic_coffee', pack: 'basic', category: 'daily', label: '咖啡', unicode: '☕', type: 'unicode', enabled: true, sort: 41 },
  { id: 'basic_tea', shortcode: 'basic_tea', pack: 'basic', category: 'daily', label: '奶茶', unicode: '🧋', type: 'unicode', enabled: true, sort: 42 },
  { id: 'basic_cake', shortcode: 'basic_cake', pack: 'basic', category: 'daily', label: '蛋糕', unicode: '🍰', type: 'unicode', enabled: true, sort: 43 },
  { id: 'basic_moon', shortcode: 'basic_moon', pack: 'basic', category: 'daily', label: '晚安', unicode: '🌙', type: 'unicode', enabled: true, sort: 44 },
  { id: 'basic_sakura', shortcode: 'basic_sakura', pack: 'basic', category: 'daily', label: '樱花', unicode: '🌸', type: 'unicode', enabled: true, sort: 45 },
  { id: 'basic_book', shortcode: 'basic_book', pack: 'basic', category: 'tech', label: '学习', unicode: '📚', type: 'unicode', enabled: true, sort: 50 },
  { id: 'basic_laptop', shortcode: 'basic_laptop', pack: 'basic', category: 'tech', label: '电脑', unicode: '💻', type: 'unicode', enabled: true, sort: 51 },
  { id: 'basic_bug', shortcode: 'basic_bug', pack: 'basic', category: 'tech', label: 'Bug', unicode: '🐛', type: 'unicode', enabled: true, sort: 52 },
  { id: 'basic_wrench', shortcode: 'basic_wrench', pack: 'basic', category: 'tech', label: '修复', unicode: '🔧', type: 'unicode', enabled: true, sort: 53 },
  { id: 'basic_lightbulb', shortcode: 'basic_lightbulb', pack: 'basic', category: 'tech', label: '灵感', unicode: '💡', type: 'unicode', enabled: true, sort: 54 },
  { id: 'basic_memo', shortcode: 'basic_memo', pack: 'basic', category: 'tech', label: '记录', unicode: '📝', type: 'unicode', enabled: true, sort: 55 },
  { id: 'basic_link', shortcode: 'basic_link', pack: 'basic', category: 'tech', label: '链接', unicode: '🔗', type: 'unicode', enabled: true, sort: 56 },
]

let currentRegistry: EmojiItem[] = [...basicPack].sort((a, b) => a.sort - b.sort)
let currentMap = new Map<string, EmojiItem>(currentRegistry.map((item) => [item.shortcode, item]))

export const emojiRegistry: EmojiItem[] = currentRegistry

export function replaceEmojiRegistry(items: EmojiItem[]) {
  currentRegistry = [...items].sort((a, b) => a.sort - b.sort)
  currentMap = new Map<string, EmojiItem>(currentRegistry.map((item) => [item.shortcode, item]))
}

export function getEmojiByShortcode(shortcode: string): EmojiItem | undefined {
  return currentMap.get(shortcode)
}

export function queryByScene(scene: EmojiScene): EmojiItem[] {
  const policy = scenePolicies[scene]
  return currentRegistry.filter((item) => item.enabled && policy.allowedPacks.includes(item.pack))
}

