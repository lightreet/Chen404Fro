import { ref } from 'vue';
import type { SiteConfig } from '@/types';
import { getSiteConfig } from '@/api/home';

const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteName: 'Chen404 Blog',
  siteDescription: '一个热爱技术分享的博客',
  siteLogo: '/logo.svg',
  siteFavicon: '/favicon.ico',
  icp: '',
  heroImages: {},
};
const CACHE_TTL_MS = 30 * 1000;

const siteConfig = ref<SiteConfig | null>(null);
let pending: Promise<SiteConfig> | null = null;
let loadedAt = 0;

export function useSiteConfig() {
  const loadSiteConfig = async (force = false): Promise<SiteConfig> => {
    const isFresh = siteConfig.value && Date.now() - loadedAt < CACHE_TTL_MS;
    if (!force && isFresh && siteConfig.value) {
      return siteConfig.value;
    }
    if (!force && pending) {
      return pending;
    }
    pending = getSiteConfig()
      .then((config) => {
        const next = {
          ...DEFAULT_SITE_CONFIG,
          ...config,
          heroImages: config.heroImages ?? {},
        };
        siteConfig.value = next;
        loadedAt = Date.now();
        return next;
      })
      .catch((error) => {
        console.warn('加载站点配置失败，回退缓存/默认配置', error);
        if (siteConfig.value) {
          return siteConfig.value;
        }
        const fallback = { ...DEFAULT_SITE_CONFIG };
        siteConfig.value = fallback;
        loadedAt = Date.now();
        return fallback;
      })
      .finally(() => {
        pending = null;
      });
    return pending;
  };

  const setSiteConfig = (config: SiteConfig) => {
    siteConfig.value = config;
    loadedAt = Date.now();
  };

  return {
    siteConfig,
    loadSiteConfig,
    setSiteConfig,
  };
}
