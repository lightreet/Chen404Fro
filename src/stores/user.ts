import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types';
import { getUserInfo } from '@/api/auth';
import {
  AUTH_SESSION_CHANGED_EVENT,
  clearAuthSession,
  readAccessToken,
  readAuthSession,
  saveAuthSession,
  updateAuthTokens,
  updateStoredUser,
} from '@/utils/authSession';

interface RequestFailureLike {
  response?: {
    status?: unknown;
  };
  businessCode?: unknown;
}

function isAuthenticationRejected(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const failure = error as RequestFailureLike;
  const status = failure.response?.status;
  return status === 401
    || status === 403
    || failure.businessCode === 401
    || failure.businessCode === 403;
}

export const useUserStore = defineStore('user', () => {
  // 用户信息
  const user = ref<User | null>(null);

  // Token
  const token = ref<string>('');

  // 是否已登录
  const isLoggedIn = computed(() => !!token.value && !!user.value);
  const sessionChecked = ref(false);

  const hydrateFromStorage = () => {
    const stored = readAuthSession();
    token.value = stored.token;
    if (!stored.userJson) {
      user.value = null;
      return;
    }
    try {
      user.value = JSON.parse(stored.userJson) as User;
    } catch {
      user.value = null;
    }
  };

  window.addEventListener(AUTH_SESSION_CHANGED_EVENT, hydrateFromStorage);
  window.addEventListener('storage', hydrateFromStorage);

  // 设置用户信息
  const setUser = (userData: User | null) => {
    user.value = userData;
    updateStoredUser(userData ? JSON.stringify(userData) : '');
  };

  // 设置 Token（同时可更新 refreshToken，由 store 统一持久化）
  const setToken = (newToken: string, refreshToken?: string) => {
    token.value = newToken;
    if (newToken) {
      updateAuthTokens(newToken, refreshToken);
    } else {
      clearAuthSession();
    }
  };

  // 初始化用户信息（从当前会话或持久会话恢复）
  const initUser = () => {
    hydrateFromStorage();
    sessionChecked.value = false;
  };

  // 与服务端同步登录态，确保“显示已登录”与“后端识别已登录”一致
  const syncAuthState = async (force = false) => {
    if (sessionChecked.value && !force) {
      return isLoggedIn.value;
    }

    const savedToken = readAccessToken();
    if (!savedToken) {
      logout();
      sessionChecked.value = true;
      return false;
    }

    token.value = savedToken;
    try {
      const latestUser = await getUserInfo({
        suppressErrorMessage: true,
        skipAuthRedirect: true,
      });
      setUser(latestUser);
      sessionChecked.value = true;
      return true;
    } catch (error) {
      if (isAuthenticationRejected(error)) {
        logout();
        sessionChecked.value = true;
        return false;
      }

      // 网络波动或服务端暂不可用时保留本地登录态，允许后续重新同步。
      sessionChecked.value = false;
      return isLoggedIn.value;
    }
  };

  // 登录（token/refreshToken/remember 均由 store 持久化，视图层不直接操作 localStorage）
  const login = (userData: User, newToken: string, options?: { remember?: boolean; refreshToken?: string }) => {
    const remember = options?.remember !== false;
    saveAuthSession({
      token: newToken,
      refreshToken: options?.refreshToken || '',
      userJson: JSON.stringify(userData),
      remember,
    });
    user.value = userData;
    token.value = newToken;
    sessionChecked.value = true;
  };

  // 登出
  const logout = () => {
    clearAuthSession();
    user.value = null;
    token.value = '';
    sessionChecked.value = true;
  };

  // 更新用户信息
  const updateUserInfo = (updates: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...updates };
      updateStoredUser(JSON.stringify(user.value));
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
