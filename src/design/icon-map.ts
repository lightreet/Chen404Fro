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

import mdiAlertOutline from '@iconify/icons-mdi/alert-outline'
import mdiArchiveOutline from '@iconify/icons-mdi/archive-outline'
import mdiArrowLeft from '@iconify/icons-mdi/arrow-left'
import mdiArrowRight from '@iconify/icons-mdi/arrow-right'
import mdiBellOutline from '@iconify/icons-mdi/bell-outline'
import mdiCalendarBlankOutline from '@iconify/icons-mdi/calendar-blank-outline'
import mdiChatOutline from '@iconify/icons-mdi/chat-outline'
import mdiCheck from '@iconify/icons-mdi/check'
import mdiCheckCircleOutline from '@iconify/icons-mdi/check-circle-outline'
import mdiChevronDown from '@iconify/icons-mdi/chevron-down'
import mdiChevronLeft from '@iconify/icons-mdi/chevron-left'
import mdiChevronRight from '@iconify/icons-mdi/chevron-right'
import mdiChevronUp from '@iconify/icons-mdi/chevron-up'
import mdiClockOutline from '@iconify/icons-mdi/clock-outline'
import mdiClose from '@iconify/icons-mdi/close'
import mdiCloseCircleOutline from '@iconify/icons-mdi/close-circle-outline'
import mdiCogOutline from '@iconify/icons-mdi/cog-outline'
import mdiCommentOutline from '@iconify/icons-mdi/comment-outline'
import mdiCompassOutline from '@iconify/icons-mdi/compass-outline'
import mdiContentCopy from '@iconify/icons-mdi/content-copy'
import mdiContentSaveOutline from '@iconify/icons-mdi/content-save-outline'
import mdiDotsHorizontal from '@iconify/icons-mdi/dots-horizontal'
import mdiDownloadOutline from '@iconify/icons-mdi/download-outline'
import mdiEmailOutline from '@iconify/icons-mdi/email-outline'
import mdiEyeOutline from '@iconify/icons-mdi/eye-outline'
import mdiFileDocumentOutline from '@iconify/icons-mdi/file-document-outline'
import mdiFileMultipleOutline from '@iconify/icons-mdi/file-multiple-outline'
import mdiFileOutline from '@iconify/icons-mdi/file-outline'
import mdiFilterVariant from '@iconify/icons-mdi/filter-variant'
import mdiFolderOutline from '@iconify/icons-mdi/folder-outline'
import mdiFormatListBulleted from '@iconify/icons-mdi/format-list-bulleted'
import mdiHeadphones from '@iconify/icons-mdi/headphones'
import mdiHeartOutline from '@iconify/icons-mdi/heart-outline'
import mdiHomeOutline from '@iconify/icons-mdi/home-outline'
import mdiImageOutline from '@iconify/icons-mdi/image-outline'
import mdiInboxOutline from '@iconify/icons-mdi/inbox-outline'
import mdiInformationOutline from '@iconify/icons-mdi/information-outline'
import mdiKeyOutline from '@iconify/icons-mdi/key-outline'
import mdiLinkVariant from '@iconify/icons-mdi/link-variant'
import mdiLoading from '@iconify/icons-mdi/loading'
import mdiLockOutline from '@iconify/icons-mdi/lock-outline'
import mdiLogout from '@iconify/icons-mdi/logout'
import mdiMagnify from '@iconify/icons-mdi/magnify'
import mdiMapMarkerOutline from '@iconify/icons-mdi/map-marker-outline'
import mdiMapOutline from '@iconify/icons-mdi/map-outline'
import mdiMedalOutline from '@iconify/icons-mdi/medal-outline'
import mdiMenu from '@iconify/icons-mdi/menu'
import mdiMessageOutline from '@iconify/icons-mdi/message-outline'
import mdiMusicNoteOutline from '@iconify/icons-mdi/music-note-outline'
import mdiOpenInNew from '@iconify/icons-mdi/open-in-new'
import mdiPause from '@iconify/icons-mdi/pause'
import mdiPencilOutline from '@iconify/icons-mdi/pencil-outline'
import mdiPlay from '@iconify/icons-mdi/play'
import mdiPlaylistPlay from '@iconify/icons-mdi/playlist-play'
import mdiPlus from '@iconify/icons-mdi/plus'
import mdiRadio from '@iconify/icons-mdi/radio'
import mdiRefresh from '@iconify/icons-mdi/refresh'
import mdiSendOutline from '@iconify/icons-mdi/send-outline'
import mdiSort from '@iconify/icons-mdi/sort'
import mdiSortVariant from '@iconify/icons-mdi/sort-variant'
import mdiStar from '@iconify/icons-mdi/star'
import mdiStarOutline from '@iconify/icons-mdi/star-outline'
import mdiTagMultipleOutline from '@iconify/icons-mdi/tag-multiple-outline'
import mdiTagOutline from '@iconify/icons-mdi/tag-outline'
import mdiTrashCanOutline from '@iconify/icons-mdi/trash-can-outline'
import mdiTrayArrowUp from '@iconify/icons-mdi/tray-arrow-up'
import mdiTransitConnectionVariant from '@iconify/icons-mdi/transit-connection-variant'
import mdiAccountGroupOutline from '@iconify/icons-mdi/account-group-outline'
import mdiAccountOutline from '@iconify/icons-mdi/account-outline'
import mdiAccountPlusOutline from '@iconify/icons-mdi/account-plus-outline'
import mdiViewGridOutline from '@iconify/icons-mdi/view-grid-outline'
import mdiWeatherNight from '@iconify/icons-mdi/weather-night'
import mdiWhiteBalanceSunny from '@iconify/icons-mdi/white-balance-sunny'
import type { IconifyIcon } from '@iconify/types'

export type IconName = keyof typeof iconMap

/**
 * 语义名 -> Iconify 图标名。
 * 命名尽量贴近「操作/含义」，而不是某个库的具体图标名。
 */
export const iconMap = {
  // 基础操作
  add: mdiPlus,
  edit: mdiPencilOutline,
  delete: mdiTrashCanOutline,
  close: mdiClose,
  check: mdiCheck,
  search: mdiMagnify,
  refresh: mdiRefresh,
  more: mdiDotsHorizontal,
  filter: mdiFilterVariant,
  sort: mdiSort,
  rank: mdiSortVariant,
  settings: mdiCogOutline,
  logout: mdiLogout,
  save: mdiContentSaveOutline,
  copy: mdiContentCopy,
  download: mdiDownloadOutline,
  upload: mdiTrayArrowUp,
  menu: mdiMenu,
  link: mdiLinkVariant,
  external: mdiOpenInNew,

  // 方向
  'arrow-up': mdiChevronUp,
  'arrow-down': mdiChevronDown,
  'arrow-left': mdiChevronLeft,
  'arrow-right': mdiChevronRight,
  back: mdiArrowLeft,
  forward: mdiArrowRight,

  // 状态与反馈
  info: mdiInformationOutline,
  success: mdiCheckCircleOutline,
  warning: mdiAlertOutline,
  error: mdiCloseCircleOutline,
  loading: mdiLoading,
  empty: mdiInboxOutline,

  // 内容与导航
  home: mdiHomeOutline,
  article: mdiFileDocumentOutline,
  category: mdiTagMultipleOutline,
  tag: mdiTagOutline,
  archive: mdiArchiveOutline,
  comment: mdiCommentOutline,
  user: mdiAccountOutline,
  users: mdiAccountGroupOutline,
  star: mdiStarOutline,
  'star-filled': mdiStar,
  heart: mdiHeartOutline,
  calendar: mdiCalendarBlankOutline,
  clock: mdiClockOutline,
  location: mdiMapMarkerOutline,
  map: mdiMapOutline,
  image: mdiImageOutline,
  file: mdiFileOutline,
  files: mdiFileMultipleOutline,
  folder: mdiFolderOutline,
  mail: mdiEmailOutline,
  lock: mdiLockOutline,
  key: mdiKeyOutline,
  eye: mdiEyeOutline,
  grid: mdiViewGridOutline,
  list: mdiFormatListBulleted,

  // 媒体 / 音乐
  play: mdiPlay,
  pause: mdiPause,
  'sequence-play': mdiPlaylistPlay,
  music: mdiMusicNoteOutline,
  headset: mdiHeadphones,
  radio: mdiRadio,

  // 交互/沟通
  chat: mdiChatOutline,
  message: mdiMessageOutline,
  send: mdiSendOutline,
  bell: mdiBellOutline,
  compass: mdiCompassOutline,
  connection: mdiTransitConnectionVariant,
  medal: mdiMedalOutline,
  postcard: mdiAccountPlusOutline,

  // 主题
  sun: mdiWhiteBalanceSunny,
  moon: mdiWeatherNight,
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
function unwrapIconData(icon: unknown): IconifyIcon {
  if (icon && typeof icon === 'object' && 'body' in icon) {
    return icon as IconifyIcon
  }
  if (icon && typeof icon === 'object' && 'default' in icon) {
    return unwrapIconData((icon as { default: unknown }).default)
  }
  return icon as IconifyIcon
}

export function resolveIcon(input: string): string | IconifyIcon {
  if (input in iconMap) {
    return unwrapIconData(iconMap[input as IconName])
  }
  if (input in elementIconAlias) {
    return unwrapIconData(iconMap[elementIconAlias[input]])
  }
  return input
}
