import type { SiteConfig } from '@/types';

export const DEFAULT_SITE_NAME = 'Chen404 Blog';
export const DEFAULT_SITE_DESCRIPTION = '一个写下技术，也收藏温柔日常的小小角落';
export const DEFAULT_SITE_LOGO = '/logo.png';
export const DEFAULT_SITE_FAVICON = '/favicon.png';
export const DEFAULT_SITE_GITHUB = 'https://github.com/lightreet';
export const DEFAULT_ICP_NUMBER = '湘ICP备2026010852号-1';
export const DEFAULT_COPYRIGHT = 'Copyright 2024 Chen404';
export const DEFAULT_SEO_KEYWORDS = '博客,技术,前端,后端,Java,Vue';
export const DEFAULT_SEO_DESCRIPTION = 'Chen404的个人技术博客，一个写下技术，也收藏温柔日常的小小角落';
export const DEFAULT_ARTICLE_PAGE_SIZE = 10;
export const DEFAULT_UPLOAD_MAX_SIZE = 12 * 1024 * 1024;
export const DEFAULT_UPLOAD_ALLOW_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

function trimText(value?: string | null) {
  return value?.trim() || '';
}

export function normalizeUploadAllowTypes(value?: string[] | null) {
  const normalized = (value ?? [])
    .map((item) => item?.trim().toLowerCase())
    .filter((item): item is string => Boolean(item));

  return normalized.length > 0 ? Array.from(new Set(normalized)) : [...DEFAULT_UPLOAD_ALLOW_TYPES];
}

export function resolveSiteName(config?: Partial<SiteConfig> | null) {
  return trimText(config?.siteName) || DEFAULT_SITE_NAME;
}

export function resolveSiteDescription(config?: Partial<SiteConfig> | null) {
  return trimText(config?.siteDescription) || DEFAULT_SITE_DESCRIPTION;
}

export function resolveSiteLogo(config?: Partial<SiteConfig> | null) {
  return trimText(config?.siteLogo) || DEFAULT_SITE_LOGO;
}

export function resolveSiteFavicon(config?: Partial<SiteConfig> | null) {
  return trimText(config?.siteFavicon) || DEFAULT_SITE_FAVICON;
}

export function resolveSiteGithub(config?: Partial<SiteConfig> | null) {
  return trimText(config?.github) || DEFAULT_SITE_GITHUB;
}

export function resolveIcp(config?: Partial<SiteConfig> | null) {
  return trimText(config?.icp) || DEFAULT_ICP_NUMBER;
}

export function resolveBeian(config?: Partial<SiteConfig> | null) {
  return trimText(config?.beian);
}

export function resolveCopyright(config?: Partial<SiteConfig> | null) {
  return trimText(config?.copyright) || DEFAULT_COPYRIGHT;
}

export function resolveSeoKeywords(config?: Partial<SiteConfig> | null) {
  return trimText(config?.seoKeywords) || DEFAULT_SEO_KEYWORDS;
}

export function resolveSeoDescription(config?: Partial<SiteConfig> | null) {
  return trimText(config?.seoDescription) || DEFAULT_SEO_DESCRIPTION;
}

export function resolveArticlePageSize(_config?: Partial<SiteConfig> | null, fallback = DEFAULT_ARTICLE_PAGE_SIZE) {
  return fallback;
}

export function resolveUploadMaxSize(_config?: Partial<SiteConfig> | null) {
  return DEFAULT_UPLOAD_MAX_SIZE;
}

export function resolveUploadAllowTypes(_config?: Partial<SiteConfig> | null) {
  return [...DEFAULT_UPLOAD_ALLOW_TYPES];
}

export function resolveHeroImage(
  config: Partial<SiteConfig> | null | undefined,
  key: string,
  fallback: string,
) {
  const heroImages = config?.heroImages ?? {};
  const direct = trimText(heroImages[key]);
  if (direct) {
    return direct;
  }
  if (key === 'tag') {
    return trimText(heroImages.category) || trimText(heroImages.home) || fallback;
  }
  return fallback;
}

function upsertMetaByName(name: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

function upsertFavicon(href: string) {
  const selectors = ['link[rel="icon"]', 'link[rel="shortcut icon"]'];
  for (const selector of selectors) {
    const existing = document.head.querySelector<HTMLLinkElement>(selector);
    if (existing) {
      existing.href = href;
      return;
    }
  }

  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = href;
  document.head.appendChild(link);
}

export function applySiteMeta(
  config?: Partial<SiteConfig> | null,
  pageTitle?: string,
  pageDescription?: string,
) {
  const siteName = resolveSiteName(config);
  const normalizedTitle = trimText(pageTitle);

  document.title = normalizedTitle && normalizedTitle !== '首页'
    ? `${normalizedTitle} - ${siteName}`
    : siteName;

  upsertMetaByName(
    'description',
    trimText(pageDescription) || resolveSeoDescription(config) || resolveSiteDescription(config),
  );
  upsertMetaByName('keywords', resolveSeoKeywords(config));
  upsertFavicon(resolveSiteFavicon(config));
}
