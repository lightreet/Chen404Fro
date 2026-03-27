import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types';
import { getUserInfo } from '@/api/auth';

export const useUserStore = defineStore('user', () => {
  // 用户信息
  const user = ref<User | null>(null);

  // Token
  const token = ref<string>('');

  // 是否已登录
  const isLoggedIn = computed(() => !!token.value && !!user.value);
  const sessionChecked = ref(false);

  // 设置用户信息
  const setUser = (userData: User | null) => {
    user.value = userData;
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  };

  // 设置 Token（同时可更新 refreshToken，由 store 统一持久化）
  const setToken = (newToken: string, refreshToken?: string) => {
    token.value = newToken;
    if (newToken) {
      localStorage.setItem('token', newToken);
      if (refreshToken !== undefined) {
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        else localStorage.removeItem('refreshToken');
      }
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('remember');
    }
  };

  // 初始化用户信息（从 localStorage 恢复）
  const initUser = () => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken) {
      token.value = savedToken;
    }
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser);
      } catch {
        user.value = null;
      }
    }
    sessionChecked.value = false;
  };

  // 与服务端同步登录态，确保“显示已登录”与“后端识别已登录”一致
  const syncAuthState = async (force = false) => {
    if (sessionChecked.value && !force) {
      return isLoggedIn.value;
    }

    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      logout();
      sessionChecked.value = true;
      return false;
    }

    token.value = savedToken;
    try {
      const latestUser = await getUserInfo({ suppressErrorMessage: true });
      setUser(latestUser);
      sessionChecked.value = true;
      return true;
    } catch {
      logout();
      sessionChecked.value = true;
      return false;
    }
  };

  // 获取当前存储的 token（供请求拦截器使用）
  const getToken = () => {
    return token.value || localStorage.getItem('token') || '';
  };

  // 登录（token/refreshToken/remember 均由 store 持久化，视图层不直接操作 localStorage）
  const login = (userData: User, newToken: string, options?: { remember?: boolean; refreshToken?: string }) => {
    setUser(userData);
    const remember = options?.remember !== false;
    if (remember && options?.refreshToken != null) {
      setToken(newToken, options.refreshToken);
    } else {
      setToken(newToken);
      if (!remember) localStorage.removeItem('refreshToken');
    }
    localStorage.setItem('remember', String(remember));
  };

  // 登出
  const logout = () => {
    setUser(null);
    setToken('');
    sessionChecked.value = true;
  };

  // 更新用户信息
  const updateUserInfo = (updates: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...updates };
      localStorage.setItem('user', JSON.stringify(user.value));
    }
  };

  return {
    user,
    token,
    isLoggedIn,
    setUser,
    setToken,
    initUser,
    syncAuthState,
    login,
    logout,
    updateUserInfo,
    sessionChecked,
  };
});
