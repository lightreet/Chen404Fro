/**
 * 首页相关 API
 * 读取类接口优先走 generated SDK，减少与后端 Controller 的长期漂移。
 */

import { put } from './request';
import type {
  HomeData,
  SiteStats,
  SiteConfig,
  SiteOwner,
  Banner,
  HotArticle,
  RecentComment,
} from '@/types';
import { Service } from '@/sdk/generated';
import { unwrapResult } from '@/sdk/runtime';

export interface SiteMember {
  id: number | string;
  username: string;
  nickname: string;
  email?: string;
  avatar: string;
  bio?: string;
  trustLevel?: number;
  memberLabel?: string;
  createTime?: string;
}

export async function getHomeData(): Promise<HomeData> {
  return unwrapResult(await Service.getHomeData()) as HomeData;
}

export async function getSiteConfig(): Promise<SiteConfig> {
  return unwrapResult(await Service.getSiteConfig()) as SiteConfig;
}

export async function getSiteOwner(): Promise<SiteOwner | null> {
  return unwrapResult(await Service.getSiteOwner()) as SiteOwner | null;
}

export async function getSiteMembers(): Promise<SiteMember[]> {
  return unwrapResult(await Service.getSiteMembers()) as SiteMember[];
}

export async function getSiteUser(id: number | string): Promise<SiteMember> {
  return unwrapResult(await Service.getSiteUser({
    id: Number(id),
  })) as SiteMember;
}

export function updateSiteConfig(data: Partial<SiteConfig>): Promise<SiteConfig> {
  return put('/site/config', data);
}

export async function getSiteStats(): Promise<SiteStats> {
  return unwrapResult(await Service.getSiteStats()) as SiteStats;
}

export async function getBanners(position: number = 1): Promise<Banner[]> {
  return unwrapResult(await Service.getBanners({ position })) as Banner[];
}

export async function getHotArticles(limit: number = 10): Promise<HotArticle[]> {
  return unwrapResult(await Service.getHotArticles({ limit })) as HotArticle[];
}

export async function getRecentComments(limit: number = 5): Promise<RecentComment[]> {
  return unwrapResult(await Service.getRecentComments({ limit })) as RecentComment[];
}

export async function getRecommendArticles(limit: number = 6): Promise<{
  id: number;
  title: string;
  coverImage?: string;
  summary?: string;
}[]> {
  return unwrapResult(await Service.getRecommendArticles({ limit })) as {
    id: number;
    title: string;
    coverImage?: string;
    summary?: string;
  }[];
}
