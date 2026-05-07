import { ref } from 'vue';
import type { SiteConfig } from '@/types';
import { getSiteConfig } from '@/api/home';
import {
  DEFAULT_COPYRIGHT,
  DEFAULT_ICP_NUMBER,
  DEFAULT_SEO_DESCRIPTION,
  DEFAULT_SEO_KEYWORDS,
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_FAVICON,
  DEFAULT_SITE_GITHUB,
  DEFAULT_SITE_LOGO,
  DEFAULT_SITE_NAME,
} from '@/utils/siteConfig';

const DEFAULT_SITE_EMAIL = 'helychen@outlook.com';
const LEGACY_SITE_EMAIL = 'admin@chen404.com';

const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteName: DEFAULT_SITE_NAME,
  siteDescription: DEFAULT_SITE_DESCRIPTION,
  siteLogo: DEFAULT_SITE_LOGO,
  siteFavicon: DEFAULT_SITE_FAVICON,
  icp: DEFAULT_ICP_NUMBER,
  beian: '',
  github: DEFAULT_SITE_GITHUB,
  email: DEFAULT_SITE_EMAIL,
  copyright: DEFAULT_COPYRIGHT,
  seoKeywords: DEFAULT_SEO_KEYWORDS,
  seoDescription: DEFAULT_SEO_DESCRIPTION,
  commentAudit: true,
  commentGuest: true,
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
          email: normalizeSiteEmail(config.email),
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

function normalizeSiteEmail(email?: string) {
  const normalized = email?.trim();
  if (!normalized || normalized.toLowerCase() === LEGACY_SITE_EMAIL) {
    return DEFAULT_SITE_EMAIL;
  }
  return normalized;
}
