import type { RouteLocationRaw } from 'vue-router'
import type { SiteConfig } from '@/types'
import { resolveHeroImage, resolveHeroImagePosition } from '@/utils/siteConfig'

export type FeatureHeroKey = 'memory-map' | 'trust-request' | 'music'

export interface FeatureAccessCoverConfig {
  eyebrow: string
  title: string
  description: string
  noticeTitle: string
  noticeText: string
  primaryText: string
  primaryTo?: RouteLocationRaw
  secondaryText?: string
  secondaryTo?: RouteLocationRaw
}

interface FeatureHeroPreset {
  image: string
  position: string
}

export const FEATURE_HERO_DEFAULTS: Record<FeatureHeroKey, FeatureHeroPreset> = {
  'memory-map': {
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=80',
    position: '50% 56%',
  },
  'trust-request': {
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=80',
    position: '50% 56%',
  },
  music: {
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1920&q=80',
    position: '50% 52%',
  },
}

export function resolveFeatureHero(config: Partial<SiteConfig> | null | undefined, key: FeatureHeroKey) {
  const preset = FEATURE_HERO_DEFAULTS[key]
  return {
    bgImage: resolveHeroImage(config, key, preset.image),
    bgPosition: resolveHeroImagePosition(config, key, preset.position),
  }
}

export function buildMemoryMapCoverConfig(isLoggedIn: boolean): FeatureAccessCoverConfig {
  if (!isLoggedIn) {
    return {
      eyebrow: 'Memory Map',
      title: '登录后解锁这张旅行地图',
      description: '登录之后，你就能回到这张地图里查看旅行地点、照片和沿途写下的纪念内容。',
      noticeTitle: '当前仅对登录成员开放',
      noticeText: '我们先保留一个安静的封面，不强制打断浏览；等你准备好，再登录查看完整内容。',
      primaryText: '前往登录',
      primaryTo: { path: '/login', query: { redirect: '/memory-map' } },
      secondaryText: '先去首页看看',
      secondaryTo: '/',
    }
  }

  return {
    eyebrow: 'Memory Map',
    title: '登录后解锁这张旅行地图',
    description: '这张地图目前只对知友开放。完成受信申请后，就能回来继续翻阅这些旅途记录。',
    noticeTitle: '当前仅对知友开放',
    noticeText: '如果你希望查看这部分旅行内容，可以先前往受信申请页提交理由，审核通过后就能访问。',
    primaryText: '去申请受信权限',
    primaryTo: '/trust-request',
    secondaryText: '返回首页',
    secondaryTo: '/',
  }
}

export const TRUST_REQUEST_LOGIN_COVER: FeatureAccessCoverConfig = {
  eyebrow: 'Members Only',
  title: '登录后可查看受信申请内容',
  description: '这里会展示你的申请状态、申请表单和审核反馈。先登录账号，再决定是否申请成为知友。',
  noticeTitle: '当前仅展示说明封面',
  noticeText: '登录后你可以提交申请理由、上传附件，并在这里查看审核进度。',
  primaryText: '前往登录',
  primaryTo: { path: '/login', query: { redirect: '/trust-request' } },
  secondaryText: '先去看看首页',
  secondaryTo: '/',
}
