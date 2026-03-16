import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types';

export const useUserStore = defineStore('user', () => {
  // 用户信息
  const user = ref<User | null>(null);

  // Token
  const token = ref<string>('');

  // 是否已登录
  const isLoggedIn = computed(() => !!token.value && !!user.value);

  // 设置用户信息
  const setUser = (userData: User | null) => {
    user.value = userData;
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  };

  // 设置 Token
  const setToken = (newToken: string) => {
    token.value = newToken;
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
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
  };

  // 获取当前存储的 token（供请求拦截器使用）
  const getToken = () => {
    return token.value || localStorage.getItem('token') || '';
  };

  // 登录
  const login = (userData: User, newToken: string, remember = true) => {
    // 始终保存到 localStorage，确保当前会话可用
    setUser(userData);
    setToken(newToken);
    // 记录是否要记住登录状态（可用于控制 token 过期后的行为）
    localStorage.setItem('remember', String(remember));
  };

  // 登出
  const logout = () => {
    setUser(null);
    setToken('');
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
    login,
    logout,
    updateUserInfo,
  };
});
