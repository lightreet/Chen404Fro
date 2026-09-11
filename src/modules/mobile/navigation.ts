export interface MobileDestination {
  key: string;
  label: string;
  title: string;
  path: string;
  icon: string;
}

export const MOBILE_NAV_STORAGE_KEY = 'chen404.mobile-navigation.v1';
export const MOBILE_NAV_LIMIT = 3;
export const DEFAULT_MOBILE_NAV = ['bookshelf', 'music', 'travel'];

export const MOBILE_DESTINATIONS: readonly MobileDestination[] = [
  { key: 'home', label: '首页', title: '首页', path: '/', icon: 'home' },
  { key: 'bookshelf', label: '书架', title: '书架', path: '/bookshelf', icon: 'book' },
  { key: 'music', label: '音乐', title: '音乐馆', path: '/music', icon: 'music' },
  { key: 'travel', label: '旅行', title: '旅行游记', path: '/memory-map', icon: 'map' },
  { key: 'profile', label: '我的', title: '个人中心', path: '/profile', icon: 'user' },
  { key: 'archive', label: '记录', title: '文章记录', path: '/archive', icon: 'archive' },
  { key: 'guestbook', label: '留言', title: '留言板', path: '/guestbook', icon: 'comment' },
  { key: 'about', label: '关于', title: '关于本站', path: '/about', icon: 'info' },
  { key: 'discover', label: '发现', title: '发现', path: '/discover', icon: 'compass' },
];

export const OPTIONAL_MOBILE_DESTINATIONS = MOBILE_DESTINATIONS.filter(
  item => item.key !== 'home' && item.key !== 'discover',
);

/** Browser preferences never supply route URLs; only known destination keys are accepted. */
export function normalizeMobileNavigation(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_MOBILE_NAV];
  const allowed = new Set(OPTIONAL_MOBILE_DESTINATIONS.map(item => item.key));
  return [...new Set(value.filter((key): key is string => typeof key === 'string' && allowed.has(key)))]
    .slice(0, MOBILE_NAV_LIMIT);
}

export function buildMobileNavigation(keys: readonly string[]): MobileDestination[] {
  return ['home', ...normalizeMobileNavigation(keys), 'discover'].flatMap(
    key => MOBILE_DESTINATIONS.filter(item => item.key === key),
  );
}

export function isMobilePrimaryPage(path: string, keys: readonly string[], hasDetail = false): boolean {
  if (hasDetail) return false;
  return ['/', '/discover', '/bookshelf', '/music', '/memory-map'].includes(path)
    || buildMobileNavigation(keys).some(item => item.path === path);
}
