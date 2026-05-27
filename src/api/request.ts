// Axios 请求封装

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';

export interface RequestConfig extends AxiosRequestConfig {
  suppressErrorMessage?: boolean;
  skipAuthRedirect?: boolean;
}

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshWaiters: Array<(token: string) => void> = [];

export interface TokenRefreshResult {
  token: string;
  refreshToken: string;
  expires: number;
}

interface InterceptorInstallOptions {
  unwrapBusinessData: boolean;
}

function notifyRefreshWaiters(token: string) {
  refreshWaiters.forEach((cb) => cb(token));
  refreshWaiters = [];
}

function shouldSuppressError(config?: AxiosRequestConfig) {
  return Boolean((config as RequestConfig | undefined)?.suppressErrorMessage);
}

function shouldSkipAuthRedirect(config?: AxiosRequestConfig) {
  return Boolean((config as RequestConfig | undefined)?.skipAuthRedirect);
}

export function performTokenRefreshRequest(refreshToken: string): Promise<TokenRefreshResult> {
  return request.post('/auth/refresh', { refreshToken }, {
    suppressErrorMessage: true,
    skipAuthRedirect: true,
  } as RequestConfig) as Promise<TokenRefreshResult>;
}

function installRequestInterceptors(client: AxiosInstance, options: InterceptorInstallOptions) {
  client.interceptors.request.use(
    (config) => {
      if (config.data instanceof FormData) {
        config.headers = config.headers || {};
        delete (config.headers as Record<string, unknown>)['Content-Type'];
      }

      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response: AxiosResponse) => {
      if (!options.unwrapBusinessData) {
        return response;
      }

      const { code, message, data } = response.data;
      if (code !== 200) {
        if (!shouldSuppressError(response.config)) {
          ElMessage.error(message || '请求失败');
        }
        return Promise.reject(new Error(message));
      }

      return data;
    },
    (error) => {
      const { response } = error;

      if (response) {
        const { status, data } = response;

        switch (status) {
          case 401:
            return (async () => {
              const originalConfig: RequestConfig & { _retry?: boolean } = error.config || {};
              const refreshToken = localStorage.getItem('refreshToken') || '';
              const reqUrl = String(originalConfig.url || '');

              if (originalConfig._retry || !refreshToken || reqUrl.includes('/auth/refresh')) {
                if (shouldSkipAuthRedirect(originalConfig)) {
                  return Promise.reject(error);
                }
                if (!shouldSuppressError(originalConfig)) {
                  ElMessage.error('未授权，请重新登录');
                }
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                const redirect = encodeURIComponent(window.location.pathname + window.location.search);
                window.location.href = redirect ? `/login?redirect=${redirect}` : '/login';
                return Promise.reject(error);
              }

              originalConfig._retry = true;

              if (isRefreshing) {
                const newToken = await new Promise<string>((resolve) => {
                  refreshWaiters.push(resolve);
                });
                if (!newToken) {
                  if (shouldSkipAuthRedirect(originalConfig)) {
                    return Promise.reject(error);
                  }
                  if (!shouldSuppressError(originalConfig)) {
                    ElMessage.error('登录已过期，请重新登录');
                  }
                  localStorage.removeItem('token');
                  localStorage.removeItem('refreshToken');
                  const redirect = encodeURIComponent(window.location.pathname + window.location.search);
                  window.location.href = redirect ? `/login?redirect=${redirect}` : '/login';
                  return Promise.reject(error);
                }
                originalConfig.headers = originalConfig.headers || {};
                (originalConfig.headers as Record<string, unknown>).Authorization = `Bearer ${newToken}`;
                return client(originalConfig);
              }

              isRefreshing = true;
              try {
                const res = await performTokenRefreshRequest(refreshToken);
                if (!res?.token) {
                  throw new Error('refresh failed');
                }
                localStorage.setItem('token', res.token);
                if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken);
                notifyRefreshWaiters(res.token);

                originalConfig.headers = originalConfig.headers || {};
                (originalConfig.headers as Record<string, unknown>).Authorization = `Bearer ${res.token}`;
                return client(originalConfig);
              } catch (refreshError) {
                notifyRefreshWaiters('');
                if (shouldSkipAuthRedirect(originalConfig)) {
                  return Promise.reject(error);
                }
                if (!shouldSuppressError(originalConfig)) {
                  ElMessage.error('登录已过期，请重新登录');
                }
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                const redirect = encodeURIComponent(window.location.pathname + window.location.search);
                window.location.href = redirect ? `/login?redirect=${redirect}` : '/login';
                return Promise.reject(refreshError);
              } finally {
                isRefreshing = false;
              }
            })();
          case 403:
            if (!shouldSuppressError(error.config)) {
              ElMessage.error('拒绝访问');
            }
            break;
          case 404:
            if (!shouldSuppressError(error.config)) {
              ElMessage.error('请求的资源不存在');
            }
            break;
          case 429:
            if (!shouldSuppressError(error.config)) {
              ElMessage.info(data?.message || '请稍后再试');
            }
            break;
          case 500:
            if (!shouldSuppressError(error.config)) {
              ElMessage.error('服务器内部错误');
            }
            break;
          default:
            if (!shouldSuppressError(error.config)) {
              ElMessage.error(data?.message || '网络错误');
            }
        }
      } else if (!shouldSuppressError(error.config)) {
        ElMessage.error('网络连接失败');
      }

      return Promise.reject(error);
    },
  );
}

installRequestInterceptors(request, { unwrapBusinessData: true });

export function installGeneratedSdkInterceptors(client: AxiosInstance) {
  installRequestInterceptors(client, { unwrapBusinessData: false });
}

// 封装 GET 请求
export function get<T>(url: string, params?: object, config?: RequestConfig): Promise<T> {
  return request.get(url, { ...config, params }) as Promise<T>;
}

// 封装 POST 请求
export function post<T>(url: string, data?: object, config?: RequestConfig): Promise<T> {
  return request.post(url, data, config) as Promise<T>;
}

// 封装 PUT 请求
export function put<T>(url: string, data?: object, config?: RequestConfig): Promise<T> {
  return request.put(url, data, config) as Promise<T>;
}

// 封装 PATCH 请求
export function patch<T>(url: string, data?: object, config?: RequestConfig): Promise<T> {
  return request.patch(url, data, config) as Promise<T>;
}

// 封装 DELETE 请求
export function del<T>(url: string, config?: RequestConfig): Promise<T> {
  return request.delete(url, config) as Promise<T>;
}

export default request;
