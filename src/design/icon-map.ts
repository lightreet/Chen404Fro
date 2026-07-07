/**
 * Chen404 图标语义映射
 *
 * 统一图标入口：业务/组件层通过 UiIcon 使用「语义名」而不是直接引用第三方图标，
 * 由这里把语义名映射到具体 Iconify 名称（默认走 mdi 线性风格，与内容站气质一致）。
 *
 * 迁移策略：
 *  - 短期：UiIcon 同时支持「语义名」「直接 iconify 名」「Element Plus 组件」三种来源
 *  - 中期：页面逐步改为语义名，收敛到单一图标语言
 */

export type IconName = keyof typeof iconMap

/**
 * 语义名 -> Iconify 图标名。
 * 命名尽量贴近「操作/含义」，而不是某个库的具体图标名。
 */
export const iconMap = {
  // 基础操作
  add: 'mdi:plus',
  edit: 'mdi:pencil-outline',
  delete: 'mdi:trash-can-outline',
  close: 'mdi:close',
  check: 'mdi:check',
  search: 'mdi:magnify',
  refresh: 'mdi:refresh',
  more: 'mdi:dots-horizontal',
  filter: 'mdi:filter-variant',
  sort: 'mdi:sort',
  rank: 'mdi:sort-variant',
  settings: 'mdi:cog-outline',
  logout: 'mdi:logout',
  save: 'mdi:content-save-outline',
  copy: 'mdi:content-copy',
  download: 'mdi:download-outline',
  upload: 'mdi:tray-arrow-up',
  menu: 'mdi:menu',
  link: 'mdi:link-variant',
  external: 'mdi:open-in-new',

  // 方向
  'arrow-up': 'mdi:chevron-up',
  'arrow-down': 'mdi:chevron-down',
  'arrow-left': 'mdi:chevron-left',
  'arrow-right': 'mdi:chevron-right',
  back: 'mdi:arrow-left',
  forward: 'mdi:arrow-right',

  // 状态与反馈
  info: 'mdi:information-outline',
  success: 'mdi:check-circle-outline',
  warning: 'mdi:alert-outline',
  error: 'mdi:close-circle-outline',
  loading: 'mdi:loading',
  empty: 'mdi:inbox-outline',

  // 内容与导航
  home: 'mdi:home-outline',
  article: 'mdi:file-document-outline',
  category: 'mdi:tag-multiple-outline',
  tag: 'mdi:tag-outline',
  archive: 'mdi:archive-outline',
  comment: 'mdi:comment-outline',
  user: 'mdi:account-outline',
  users: 'mdi:account-group-outline',
  star: 'mdi:star-outline',
  'star-filled': 'mdi:star',
  heart: 'mdi:heart-outline',
  calendar: 'mdi:calendar-blank-outline',
  clock: 'mdi:clock-outline',
  location: 'mdi:map-marker-outline',
  map: 'mdi:map-outline',
  image: 'mdi:image-outline',
  file: 'mdi:file-outline',
  files: 'mdi:file-multiple-outline',
  folder: 'mdi:folder-outline',
  mail: 'mdi:email-outline',
  lock: 'mdi:lock-outline',
  key: 'mdi:key-outline',
  eye: 'mdi:eye-outline',
  grid: 'mdi:view-grid-outline',
  list: 'mdi:format-list-bulleted',

  // 媒体 / 音乐
  play: 'mdi:play',
  pause: 'mdi:pause',
  'sequence-play': 'mdi:playlist-play',
  music: 'mdi:music-note-outline',
  headset: 'mdi:headphones',
  radio: 'mdi:radio',

  // 交互/沟通
  chat: 'mdi:chat-outline',
  message: 'mdi:message-outline',
  send: 'mdi:send-outline',
  bell: 'mdi:bell-outline',
  compass: 'mdi:compass-outline',
  connection: 'mdi:transit-connection-variant',
  medal: 'mdi:medal-outline',
  postcard: 'mdi:account-plus-outline',

  // 主题
  sun: 'mdi:white-balance-sunny',
  moon: 'mdi:weather-night',
} as const

/** Element Plus 组件名 -> 语义名，用于迁移时把旧的 EP 图标平滑换掉 */
export const elementIconAlias: Record<string, IconName> = {
  Plus: 'add',
  Edit: 'edit',
  EditPen: 'edit',
  Delete: 'delete',
  Close: 'close',
  Search: 'search',
  Sort: 'sort',
  Refresh: 'refresh',
  Setting: 'settings',
  Upload: 'upload',
  UploadFilled: 'upload',
  Download: 'download',
  Link: 'link',
  ArrowUp: 'arrow-up',
  ArrowDown: 'arrow-down',
  ArrowLeft: 'arrow-left',
  ArrowRight: 'arrow-right',
  Back: 'back',
  Right: 'forward',
  Top: 'arrow-up',
  Bottom: 'arrow-down',
  HomeFilled: 'home',
  InfoFilled: 'info',
  User: 'user',
  UserFilled: 'user',
  Star: 'star',
  StarFilled: 'star-filled',
  Calendar: 'calendar',
  Location: 'location',
  Place: 'location',
  MapLocation: 'map',
  Document: 'article',
  Files: 'files',
  Folder: 'folder',
  CollectionTag: 'category',
  Postcard: 'postcard',
  Lock: 'lock',
  Key: 'key',
  View: 'eye',
  Grid: 'grid',
  List: 'list',
  Menu: 'menu',
  Rank: 'rank',
  VideoPlay: 'play',
  VideoPause: 'pause',
  Headset: 'headset',
  ChatDotRound: 'chat',
  Message: 'message',
  Connection: 'connection',
  Compass: 'compass',
  Medal: 'medal',
  Loading: 'loading',
  Camera: 'image',
  Minus: 'close',
  Sunny: 'sun',
  Moon: 'moon',
  SwitchButton: 'logout',
}

/** 解析任意输入到最终 Iconify 名（找不到时原样返回，方便直接传 iconify 名） */
export function resolveIcon(input: string): string {
  if (input in iconMap) {
    return iconMap[input as IconName]
  }
  if (input in elementIconAlias) {
    return iconMap[elementIconAlias[input]]
  }
  return input
}
