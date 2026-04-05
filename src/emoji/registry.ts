import type { EmojiItem, EmojiScene } from './types'
import { scenePolicies } from './scenePolicy'

const basicPack: EmojiItem[] = [
  { id: 'basic_smile', shortcode: 'basic_smile', pack: 'basic', category: 'emotion', label: '\u5fae\u7b11', unicode: '\u{1F642}', type: 'unicode', enabled: true, sort: 1 },
  { id: 'basic_grin', shortcode: 'basic_grin', pack: 'basic', category: 'emotion', label: '\u5927\u7b11', unicode: '\u{1F601}', type: 'unicode', enabled: true, sort: 2 },
  { id: 'basic_laugh', shortcode: 'basic_laugh', pack: 'basic', category: 'emotion', label: '\u7b11\u54ed', unicode: '\u{1F602}', type: 'unicode', enabled: true, sort: 3 },
  { id: 'basic_joy', shortcode: 'basic_joy', pack: 'basic', category: 'emotion', label: '\u5f00\u5fc3', unicode: '\u{1F973}', type: 'unicode', enabled: true, sort: 4 },
  { id: 'basic_love', shortcode: 'basic_love', pack: 'basic', category: 'emotion', label: '\u5fc3\u52a8', unicode: '\u{1F60D}', type: 'unicode', enabled: true, sort: 5 },
  { id: 'basic_think', shortcode: 'basic_think', pack: 'basic', category: 'emotion', label: '\u601d\u8003', unicode: '\u{1F914}', type: 'unicode', enabled: true, sort: 6 },
  { id: 'basic_wow', shortcode: 'basic_wow', pack: 'basic', category: 'emotion', label: '\u60ca\u8bb6', unicode: '\u{1F62E}', type: 'unicode', enabled: true, sort: 7 },
  { id: 'basic_sleepy', shortcode: 'basic_sleepy', pack: 'basic', category: 'emotion', label: '\u56f0', unicode: '\u{1F62A}', type: 'unicode', enabled: true, sort: 8 },
  { id: 'basic_cry', shortcode: 'basic_cry', pack: 'basic', category: 'emotion', label: '\u59d4\u5c48', unicode: '\u{1F97A}', type: 'unicode', enabled: true, sort: 9 },
  { id: 'basic_sob', shortcode: 'basic_sob', pack: 'basic', category: 'emotion', label: '\u5927\u54ed', unicode: '\u{1F62D}', type: 'unicode', enabled: true, sort: 10 },
  { id: 'basic_angry', shortcode: 'basic_angry', pack: 'basic', category: 'emotion', label: '\u751f\u6c14', unicode: '\u{1F624}', type: 'unicode', enabled: true, sort: 11 },
  { id: 'basic_cool', shortcode: 'basic_cool', pack: 'basic', category: 'emotion', label: '\u9177', unicode: '\u{1F60E}', type: 'unicode', enabled: true, sort: 12 },
  { id: 'basic_wink', shortcode: 'basic_wink', pack: 'basic', category: 'emotion', label: '\u7728\u773c', unicode: '\u{1F609}', type: 'unicode', enabled: true, sort: 13 },
  { id: 'basic_sweat', shortcode: 'basic_sweat', pack: 'basic', category: 'emotion', label: '\u6c57', unicode: '\u{1F605}', type: 'unicode', enabled: true, sort: 14 },
  { id: 'basic_hug', shortcode: 'basic_hug', pack: 'basic', category: 'emotion', label: '\u62e5\u62b1', unicode: '\u{1F917}', type: 'unicode', enabled: true, sort: 15 },
  { id: 'basic_shy', shortcode: 'basic_shy', pack: 'basic', category: 'emotion', label: '\u5bb3\u7f9e', unicode: '\u{1F60A}', type: 'unicode', enabled: true, sort: 16 },
  { id: 'basic_sigh', shortcode: 'basic_sigh', pack: 'basic', category: 'emotion', label: '\u53f9\u6c14', unicode: '\u{1F614}', type: 'unicode', enabled: true, sort: 17 },
  { id: 'basic_dizzy', shortcode: 'basic_dizzy', pack: 'basic', category: 'emotion', label: '\u53d1\u6655', unicode: '\u{1F635}', type: 'unicode', enabled: true, sort: 18 },
  { id: 'basic_tired', shortcode: 'basic_tired', pack: 'basic', category: 'emotion', label: '\u75b2\u60eb', unicode: '\u{1F62B}', type: 'unicode', enabled: true, sort: 19 },
  { id: 'basic_ok', shortcode: 'basic_ok', pack: 'basic', category: 'social', label: 'OK', unicode: '\u{1F44C}', type: 'unicode', enabled: true, sort: 20 },
  { id: 'basic_thumbsup', shortcode: 'basic_thumbsup', pack: 'basic', category: 'social', label: '\u70b9\u8d5e', unicode: '\u{1F44D}', type: 'unicode', enabled: true, sort: 21 },
  { id: 'basic_clap', shortcode: 'basic_clap', pack: 'basic', category: 'social', label: '\u9f13\u638c', unicode: '\u{1F44F}', type: 'unicode', enabled: true, sort: 22 },
  { id: 'basic_pray', shortcode: 'basic_pray', pack: 'basic', category: 'social', label: '\u611f\u8c22', unicode: '\u{1F64F}', type: 'unicode', enabled: true, sort: 23 },
  { id: 'basic_heart', shortcode: 'basic_heart', pack: 'basic', category: 'social', label: '\u7231\u5fc3', unicode: '\u2764\uFE0F', type: 'unicode', enabled: true, sort: 24 },
  { id: 'basic_fire', shortcode: 'basic_fire', pack: 'basic', category: 'social', label: '\u706b', unicode: '\u{1F525}', type: 'unicode', enabled: true, sort: 25 },
  { id: 'basic_star', shortcode: 'basic_star', pack: 'basic', category: 'social', label: '\u661f\u661f', unicode: '\u2B50', type: 'unicode', enabled: true, sort: 26 },
  { id: 'basic_rocket', shortcode: 'basic_rocket', pack: 'basic', category: 'social', label: '\u51b2', unicode: '\u{1F680}', type: 'unicode', enabled: true, sort: 27 },
  { id: 'basic_wave', shortcode: 'basic_wave', pack: 'basic', category: 'social', label: '\u6325\u624b', unicode: '\u{1F44B}', type: 'unicode', enabled: true, sort: 28 },
  { id: 'basic_handshake', shortcode: 'basic_handshake', pack: 'basic', category: 'social', label: '\u63e1\u624b', unicode: '\u{1F91D}', type: 'unicode', enabled: true, sort: 29 },
  { id: 'basic_muscle', shortcode: 'basic_muscle', pack: 'basic', category: 'social', label: '\u52a0\u6cb9', unicode: '\u{1F4AA}', type: 'unicode', enabled: true, sort: 30 },
  { id: 'basic_confetti', shortcode: 'basic_confetti', pack: 'basic', category: 'social', label: '\u5e86\u795d', unicode: '\u{1F389}', type: 'unicode', enabled: true, sort: 31 },
  { id: 'basic_gift', shortcode: 'basic_gift', pack: 'basic', category: 'social', label: '\u793c\u7269', unicode: '\u{1F381}', type: 'unicode', enabled: true, sort: 32 },
  { id: 'basic_camera', shortcode: 'basic_camera', pack: 'basic', category: 'daily', label: '\u76f8\u673a', unicode: '\u{1F4F7}', type: 'unicode', enabled: true, sort: 40 },
  { id: 'basic_coffee', shortcode: 'basic_coffee', pack: 'basic', category: 'daily', label: '\u5496\u5561', unicode: '\u2615', type: 'unicode', enabled: true, sort: 41 },
  { id: 'basic_tea', shortcode: 'basic_tea', pack: 'basic', category: 'daily', label: '\u5976\u8336', unicode: '\u{1F375}', type: 'unicode', enabled: true, sort: 42 },
  { id: 'basic_cake', shortcode: 'basic_cake', pack: 'basic', category: 'daily', label: '\u86cb\u7cd5', unicode: '\u{1F370}', type: 'unicode', enabled: true, sort: 43 },
  { id: 'basic_moon', shortcode: 'basic_moon', pack: 'basic', category: 'daily', label: '\u665a\u5b89', unicode: '\u{1F319}', type: 'unicode', enabled: true, sort: 44 },
  { id: 'basic_sakura', shortcode: 'basic_sakura', pack: 'basic', category: 'daily', label: '\u6a31\u82b1', unicode: '\u{1F338}', type: 'unicode', enabled: true, sort: 45 },
  { id: 'basic_book', shortcode: 'basic_book', pack: 'basic', category: 'tech', label: '\u5b66\u4e60', unicode: '\u{1F4DA}', type: 'unicode', enabled: true, sort: 50 },
  { id: 'basic_laptop', shortcode: 'basic_laptop', pack: 'basic', category: 'tech', label: '\u7535\u8111', unicode: '\u{1F4BB}', type: 'unicode', enabled: true, sort: 51 },
  { id: 'basic_bug', shortcode: 'basic_bug', pack: 'basic', category: 'tech', label: 'Bug', unicode: '\u{1F41B}', type: 'unicode', enabled: true, sort: 52 },
  { id: 'basic_wrench', shortcode: 'basic_wrench', pack: 'basic', category: 'tech', label: '\u4fee\u590d', unicode: '\u{1F527}', type: 'unicode', enabled: true, sort: 53 },
  { id: 'basic_lightbulb', shortcode: 'basic_lightbulb', pack: 'basic', category: 'tech', label: '\u7075\u611f', unicode: '\u{1F4A1}', type: 'unicode', enabled: true, sort: 54 },
  { id: 'basic_memo', shortcode: 'basic_memo', pack: 'basic', category: 'tech', label: '\u8bb0\u5f55', unicode: '\u{1F4DD}', type: 'unicode', enabled: true, sort: 55 },
  { id: 'basic_link', shortcode: 'basic_link', pack: 'basic', category: 'tech', label: '\u94fe\u63a5', unicode: '\u{1F517}', type: 'unicode', enabled: true, sort: 56 },
]

export const emojiRegistry: EmojiItem[] = [...basicPack].sort((a, b) => a.sort - b.sort)

let currentRegistry: EmojiItem[] = emojiRegistry
let currentMap = new Map<string, EmojiItem>(currentRegistry.map((item) => [item.shortcode, item]))

export function replaceEmojiRegistry(items: EmojiItem[]) {
  const nextRegistry = [...items].sort((a, b) => a.sort - b.sort)
  emojiRegistry.splice(0, emojiRegistry.length, ...nextRegistry)
  currentRegistry = emojiRegistry
  currentMap = new Map<string, EmojiItem>(currentRegistry.map((item) => [item.shortcode, item]))
}

export function getEmojiByShortcode(shortcode: string): EmojiItem | undefined {
  return currentMap.get(shortcode)
}

export function queryByScene(scene: EmojiScene): EmojiItem[] {
  const policy = scenePolicies[scene]
  return currentRegistry.filter((item) => item.enabled && policy.allowedPacks.includes(item.pack))
}
