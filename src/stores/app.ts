import { defineStore } from 'pinia';
import { ref } from 'vue';

export type AppTheme = 'light' | 'dark';
export type SakuraEffectPreference = 'full' | 'light' | 'off';

const THEME_STORAGE_KEY = 'theme';
const SAKURA_EFFECT_STORAGE_KEY = 'sakura-effect';

const isAppTheme = (value: string | null): value is AppTheme =>
  value === 'light' || value === 'dark';

const isSakuraEffectPreference = (value: string | null): value is SakuraEffectPreference =>
  value === 'full' || value === 'light' || value === 'off';

export const useAppStore = defineStore('app', () => {
  // 主题
  const theme = ref<AppTheme>('light');

  // 樱花展示强度，仅保存在当前浏览器，不同步到账号或服务端
  const sakuraEffect = ref<SakuraEffectPreference>('full');

  // 侧边栏折叠状态
  const sidebarCollapsed = ref(false);

  // 设置主题
  const setTheme = (newTheme: AppTheme) => {
    theme.value = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const setSakuraEffect = (preference: SakuraEffectPreference) => {
    sakuraEffect.value = preference;
    document.documentElement.setAttribute('data-sakura-effect', preference);
    localStorage.setItem(SAKURA_EFFECT_STORAGE_KEY, preference);
  };

  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme.value === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // 初始化主题
  const initTheme = () => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (isAppTheme(savedTheme)) {
      setTheme(savedTheme);
    } else {
      // 检测系统主题
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  };

  const initSakuraEffect = () => {
    const savedPreference = localStorage.getItem(SAKURA_EFFECT_STORAGE_KEY);
    setSakuraEffect(isSakuraEffectPreference(savedPreference) ? savedPreference : 'full');
  };

  const initDisplayPreferences = () => {
    initTheme();
    initSakuraEffect();
  };

  // 切换侧边栏
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  };

  return {
    theme,
    sakuraEffect,
    sidebarCollapsed,
    setTheme,
    setSakuraEffect,
    toggleTheme,
    initTheme,
    initSakuraEffect,
    initDisplayPreferences,
    toggleSidebar,
  };
});
