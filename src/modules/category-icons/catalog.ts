import { addIcon } from '@iconify/vue'
import folderOpen from '@iconify/icons-mdi/folder-open'
import notebook from '@iconify/icons-mdi/notebook'
import bookOpen from '@iconify/icons-mdi/book-open-page-variant'
import pencil from '@iconify/icons-mdi/pencil'
import code from '@iconify/icons-mdi/code-tags'
import laptop from '@iconify/icons-mdi/laptop'
import server from '@iconify/icons-mdi/server'
import database from '@iconify/icons-mdi/database'
import robot from '@iconify/icons-mdi/robot'
import lightbulb from '@iconify/icons-mdi/lightbulb-outline'
import school from '@iconify/icons-mdi/school'
import palette from '@iconify/icons-mdi/palette'
import music from '@iconify/icons-mdi/music'
import headphones from '@iconify/icons-mdi/headphones'
import movie from '@iconify/icons-mdi/movie-open'
import gamepad from '@iconify/icons-mdi/gamepad-variant'
import camera from '@iconify/icons-mdi/camera'
import image from '@iconify/icons-mdi/image'
import airplane from '@iconify/icons-mdi/airplane'
import map from '@iconify/icons-mdi/map-marker'
import mountain from '@iconify/icons-mdi/image-filter-hdr'
import flower from '@iconify/icons-mdi/flower'
import coffee from '@iconify/icons-mdi/coffee'
import food from '@iconify/icons-mdi/food'
import home from '@iconify/icons-mdi/home-heart'
import cat from '@iconify/icons-mdi/cat'
import heart from '@iconify/icons-mdi/heart'
import star from '@iconify/icons-mdi/star'
import run from '@iconify/icons-mdi/run'
import chat from '@iconify/icons-mdi/chat'

// Bundle the curated choices so browsing and Chinese search work without Iconify's API.
export const CATEGORY_ICON_OPTIONS = [
  { value: 'mdi:folder-open', label: '文件夹', keywords: '分类 默认 folder category', data: folderOpen },
  { value: 'mdi:notebook', label: '笔记', keywords: '记录 日记 note diary', data: notebook },
  { value: 'mdi:book-open-page-variant', label: '阅读', keywords: '书籍 小说 book read', data: bookOpen },
  { value: 'mdi:pencil', label: '写作', keywords: '文章 随笔 write article', data: pencil },
  { value: 'mdi:code-tags', label: '编程', keywords: '开发 技术 code dev', data: code },
  { value: 'mdi:laptop', label: '电脑', keywords: '数码 科技 computer laptop', data: laptop },
  { value: 'mdi:server', label: '服务器', keywords: '运维 后端 server backend', data: server },
  { value: 'mdi:database', label: '数据库', keywords: '数据 database sql', data: database },
  { value: 'mdi:robot', label: '人工智能', keywords: '机器人 AI robot', data: robot },
  { value: 'mdi:lightbulb-outline', label: '灵感', keywords: '想法 思考 idea', data: lightbulb },
  { value: 'mdi:school', label: '学习', keywords: '学校 教育 study school', data: school },
  { value: 'mdi:palette', label: '设计', keywords: '绘画 艺术 design art', data: palette },
  { value: 'mdi:music', label: '音乐', keywords: '歌曲 music song', data: music },
  { value: 'mdi:headphones', label: '听歌', keywords: '音乐 播客 headphones podcast', data: headphones },
  { value: 'mdi:movie-open', label: '电影', keywords: '影视 视频 movie video', data: movie },
  { value: 'mdi:gamepad-variant', label: '游戏', keywords: '娱乐 game play', data: gamepad },
  { value: 'mdi:camera', label: '摄影', keywords: '照片 相机 photo camera', data: camera },
  { value: 'mdi:image', label: '相册', keywords: '图片 壁纸 image album', data: image },
  { value: 'mdi:airplane', label: '旅行', keywords: '旅游 飞机 travel trip', data: airplane },
  { value: 'mdi:map-marker', label: '地点', keywords: '地图 打卡 map location', data: map },
  { value: 'mdi:image-filter-hdr', label: '山野', keywords: '自然 户外 风景 mountain nature', data: mountain },
  { value: 'mdi:flower', label: '花草', keywords: '植物 花卉 flower plant', data: flower },
  { value: 'mdi:coffee', label: '咖啡', keywords: '生活 日常 coffee life', data: coffee },
  { value: 'mdi:food', label: '美食', keywords: '生活 烹饪 food cooking', data: food },
  { value: 'mdi:home-heart', label: '生活', keywords: '家庭 日常 home life', data: home },
  { value: 'mdi:cat', label: '宠物', keywords: '动物 猫咪 cat pet', data: cat },
  { value: 'mdi:heart', label: '心情', keywords: '生活 情感 喜欢 heart mood', data: heart },
  { value: 'mdi:star', label: '收藏', keywords: '推荐 星星 star favorite', data: star },
  { value: 'mdi:run', label: '运动', keywords: '跑步 健身 sport fitness', data: run },
  { value: 'mdi:chat', label: '杂谈', keywords: '聊天 随想 chat talk', data: chat },
]

for (const option of CATEGORY_ICON_OPTIONS) {
  addIcon(option.value, option.data)
}

export function filterCategoryIcons(keyword: string) {
  const terms = keyword.trim().toLowerCase().split(/\s+/)
  return CATEGORY_ICON_OPTIONS.filter((option) => {
    const text = `${option.label} ${option.keywords} ${option.value}`.toLowerCase()
    return terms.every((term) => text.includes(term))
  })
}
