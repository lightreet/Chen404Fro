// Axios 请求封装

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';
import { refreshToken as refreshTokenApi } from './auth';

export interface RequestConfig extends AxiosRequestConfig {
  suppressErrorMessage?: boolean;
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

function notifyRefreshWaiters(token: string) {
  refreshWaiters.forEach((cb) => cb(token));
  refreshWaiters = [];
}

function shouldSuppressError(config?: AxiosRequestConfig) {
  return Boolean((config as RequestConfig | undefined)?.suppressErrorMessage);
}

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, message, data } = response.data;

    // 如果后端返回的状态码不是 200，视为错误
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
          // 先尝试使用 refreshToken 静默续期，再失败才跳转登录
          return (async () => {
            const originalConfig: RequestConfig & { _retry?: boolean } = error.config || {};
            const refreshToken = localStorage.getItem('refreshToken') || '';
            const reqUrl = String(originalConfig.url || '');

            // refresh 接口本身 / 或没有 refreshToken / 或已重试过 -> 直接跳登录
            if (originalConfig._retry || !refreshToken || reqUrl.includes('/auth/refresh')) {
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

            // 处理并发 401：只发起一次刷新，其余等待
            if (isRefreshing) {
              const newToken = await new Promise<string>((resolve) => {
                refreshWaiters.push(resolve);
              });
              if (!newToken) {
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
              (originalConfig.headers as any).Authorization = `Bearer ${newToken}`;
              return request(originalConfig);
            }

            isRefreshing = true;
            try {
              const res = await refreshTokenApi(refreshToken);
              if (!res?.token) {
                throw new Error('refresh failed');
              }
              localStorage.setItem('token', res.token);
              if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken);
              notifyRefreshWaiters(res.token);

              originalConfig.headers = originalConfig.headers || {};
              (originalConfig.headers as any).Authorization = `Bearer ${res.token}`;
              return request(originalConfig);
            } catch (e) {
              notifyRefreshWaiters('');
              if (!shouldSuppressError(originalConfig)) {
                ElMessage.error('登录已过期，请重新登录');
              }
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              const redirect = encodeURIComponent(window.location.pathname + window.location.search);
              window.location.href = redirect ? `/login?redirect=${redirect}` : '/login';
              return Promise.reject(error);
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
          // 点赞限流等：业务提示而非错误（如「已点过赞，无需重复点赞」）
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
    } else {
      if (!shouldSuppressError(error.config)) {
        ElMessage.error('网络连接失败');
      }
    }

    return Promise.reject(error);
  }
);

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

// 封装 DELETE 请求
export function del<T>(url: string, config?: RequestConfig): Promise<T> {
  return request.delete(url, config) as Promise<T>;
}

export default request;
