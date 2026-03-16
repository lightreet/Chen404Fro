import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('app', () => {
  // 主题
  const theme = ref<'light' | 'dark'>('light');

  // 侧边栏折叠状态
  const sidebarCollapsed = ref(false);

  // 设置主题
  const setTheme = (newTheme: 'light' | 'dark') => {
    theme.value = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme.value === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // 初始化主题
  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // 检测系统主题
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  };

  // 切换侧边栏
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  };

  return {
    theme,
    sidebarCollapsed,
    setTheme,
    toggleTheme,
    initTheme,
    toggleSidebar,
  };
});
