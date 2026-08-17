// Axios 请求封装

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { confirmAction, notify } from '@/lib/feedback';
import {
  clearAuthSession,
  readAccessToken,
  readRefreshToken,
  updateAuthTokens,
} from '@/utils/authSession';

export interface RequestConfig extends AxiosRequestConfig {
  suppressErrorMessage?: boolean;
  skipAuthRedirect?: boolean;
  timeoutErrorMessage?: string;
}

export const DEFAULT_REQUEST_TIMEOUT_MS = 10000;
const ACCESS_TOKEN_REFRESH_LEEWAY_MS = 5 * 60 * 1000;

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const AI_REQUEST_TIMEOUT_MS = 60000;
export const AI_REQUEST_TIMEOUT_MESSAGE = 'AI 生成耗时较久已超时，请稍后重试，或补充更多条件后再试。';

let refreshPromise: Promise<string> | null = null;
let loginRedirectPrompt: Promise<boolean> | null = null;
let isLoginRedirecting = false;

export interface TokenRefreshResult {
  token: string;
  refreshToken: string;
  expires: number;
}

interface InterceptorInstallOptions {
  unwrapBusinessData: boolean;
}

interface ResultEnvelope<T> {
  code?: number;
  message?: string;
  data?: T;
}

function createBusinessRequestError(message?: string, code?: number) {
  const error = new Error(message || '请求失败') as Error & { businessCode?: number };
  error.businessCode = code;
  return error;
}

function shouldSuppressError(config?: AxiosRequestConfig) {
  return Boolean((config as RequestConfig | undefined)?.suppressErrorMessage);
}

function shouldSkipAuthRedirect(config?: AxiosRequestConfig) {
  return Boolean((config as RequestConfig | undefined)?.skipAuthRedirect);
}

const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/send-code',
  '/auth/forgot-password',
  '/auth/check-username',
  '/auth/check-email',
  '/auth/check-phone',
  '/auth/refresh',
  '/auth/logout',
];
const GENERIC_AUTH_HTTP_MESSAGES = new Set([
  '拒绝访问',
  '未授权',
  'Unauthorized',
  'Forbidden',
]);

function isPublicAuthRequest(config?: AxiosRequestConfig) {
  const requestUrl = String(config?.url || '');
  return PUBLIC_AUTH_PATHS.some((path) => requestUrl.includes(path));
}

function resolvePublicAuthErrorMessage(config?: AxiosRequestConfig, backendMessage?: string) {
  const normalizedMessage = String(backendMessage || '').trim();
  if (normalizedMessage && !GENERIC_AUTH_HTTP_MESSAGES.has(normalizedMessage)) {
    return normalizedMessage;
  }

  const requestUrl = String(config?.url || '');
  if (requestUrl.includes('/auth/login')) {
    return '账号或密码不匹配，请重新输入';
  }
  if (requestUrl.includes('/auth/register')) {
    return '注册信息校验失败，请检查后重试';
  }
  if (requestUrl.includes('/auth/send-code')) {
    return '验证码发送失败，请稍后重试';
  }
  if (requestUrl.includes('/auth/forgot-password')) {
    return '密码重置失败，请检查邮箱和验证码';
  }
  return '认证信息不正确，请检查后重试';
}

function resolveLoginRedirectUrl() {
  const redirect = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
  return redirect ? `/login?redirect=${redirect}` : '/login';
}

async function promptLoginRedirect(message: string) {
  if (isLoginRedirecting) return;
  if (!loginRedirectPrompt) {
    loginRedirectPrompt = confirmAction({
      title: '需要登录',
      message,
      confirmText: '前往登录',
      cancelText: '暂不登录',
      tone: 'info',
    }).finally(() => {
      loginRedirectPrompt = null;
    });
  }

  const confirmed = await loginRedirectPrompt;
  if (!confirmed || isLoginRedirecting) return;
  isLoginRedirecting = true;
  window.location.href = resolveLoginRedirectUrl();
}

function isTimeoutError(error: unknown) {
  const candidate = error as { code?: string; message?: string } | undefined;
  return candidate?.code === 'ECONNABORTED'
    || String(candidate?.message || '').toLowerCase().includes('timeout');
}

function resolveTimeoutErrorMessage(config?: AxiosRequestConfig) {
  return (config as RequestConfig | undefined)?.timeoutErrorMessage || '请求超时，请稍后重试';
}

export function performTokenRefreshRequest(refreshToken: string): Promise<TokenRefreshResult> {
  return refreshRequest
    .post<ResultEnvelope<TokenRefreshResult>>('/auth/refresh', { refreshToken })
    .then((response) => {
      const { code, message, data } = response.data;
      if (code !== 200 || !data) {
        throw createBusinessRequestError(message || '登录续期失败', code);
      }
      return data;
    });
}

function decodeAccessTokenExpiration(token: string): number | null {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function shouldRefreshBeforeRequest(token: string, config: AxiosRequestConfig) {
  const requestUrl = String(config.url || '');
  if (requestUrl.includes('/auth/refresh') || isPublicAuthRequest(config)) return false;
  const expiresAt = decodeAccessTokenExpiration(token);
  return expiresAt != null && expiresAt - Date.now() <= ACCESS_TOKEN_REFRESH_LEEWAY_MS;
}

function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  const currentRefreshToken = readRefreshToken();
  if (!currentRefreshToken) {
    return Promise.reject(new Error('refresh token unavailable'));
  }

  refreshPromise = performTokenRefreshRequest(currentRefreshToken)
    .then((result) => {
      if (!result?.token || !result.refreshToken) {
        throw new Error('refresh response incomplete');
      }
      updateAuthTokens(result.token, result.refreshToken);
      return result.token;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

export async function getAccessTokenForRequest(config: AxiosRequestConfig = {}): Promise<string> {
  let token = readAccessToken();
  if (token && readRefreshToken() && shouldRefreshBeforeRequest(token, config)) {
    try {
      token = await refreshAccessToken();
    } catch {
      // 主动续期失败时保留原 token，让具体请求的 401 流程完成最终判定。
      token = readAccessToken() || token;
    }
  }
  return token;
}

export async function refreshAccessTokenAfterUnauthorized(): Promise<string> {
  try {
    return await refreshAccessToken();
  } catch (error) {
    clearAuthSession();
    throw error;
  }
}

function installRequestInterceptors(client: AxiosInstance, options: InterceptorInstallOptions) {
  client.interceptors.request.use(
    async (config) => {
      if (config.data instanceof FormData) {
        config.headers = config.headers || {};
        delete (config.headers as Record<string, unknown>)['Content-Type'];
      }

      const token = await getAccessTokenForRequest(config);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (config.headers) {
        delete (config.headers as Record<string, unknown>).Authorization;
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
          notify.error(message || '请求失败');
        }
        return Promise.reject(createBusinessRequestError(message, code));
      }

      return data;
    },
    (error) => {
      const { response } = error;
      if (isTimeoutError(error)) {
        if (!shouldSuppressError(error.config)) {
          notify.warning(resolveTimeoutErrorMessage(error.config));
        }
        return Promise.reject(error);
      }

      if (response) {
        const { status, data } = response;

        switch (status) {
          case 401: {
            const originalConfig: RequestConfig & { _retry?: boolean } = error.config || {};
            if (isPublicAuthRequest(originalConfig)) {
              if (!shouldSuppressError(originalConfig)) {
                notify.error(resolvePublicAuthErrorMessage(originalConfig, data?.message));
              }
              return Promise.reject(error);
            }

            return (async () => {
              const refreshToken = readRefreshToken();
              const reqUrl = String(originalConfig.url || '');

              if (originalConfig._retry || !refreshToken || reqUrl.includes('/auth/refresh')) {
                clearAuthSession();
                if (shouldSkipAuthRedirect(originalConfig)) {
                  return Promise.reject(error);
                }
                await promptLoginRedirect('这个内容需要登录后才能继续查看，是否现在前往登录？');
                return Promise.reject(error);
              }

              originalConfig._retry = true;

              try {
                const newToken = await refreshAccessToken();
                originalConfig.headers = originalConfig.headers || {};
                (originalConfig.headers as Record<string, unknown>).Authorization = `Bearer ${newToken}`;
                return client(originalConfig);
              } catch (refreshError) {
                clearAuthSession();
                if (shouldSkipAuthRedirect(originalConfig)) {
                  return Promise.reject(refreshError);
                }
                await promptLoginRedirect('登录状态已过期，需要重新登录后继续。');
                return Promise.reject(refreshError);
              }
            })();
          }
          case 403:
            if (!shouldSuppressError(error.config)) {
              notify.error(isPublicAuthRequest(error.config)
                ? resolvePublicAuthErrorMessage(error.config, data?.message)
                : '拒绝访问');
            }
            break;
          case 404:
            if (!shouldSuppressError(error.config)) {
              notify.error('请求的资源不存在');
            }
            break;
          case 429:
            if (!shouldSuppressError(error.config)) {
              notify.info(data?.message || '请稍后再试');
            }
            break;
          case 500:
            if (!shouldSuppressError(error.config)) {
              notify.error('服务器内部错误');
            }
            break;
          default:
            if (!shouldSuppressError(error.config)) {
              notify.error(data?.message || '网络错误');
            }
        }
      } else if (!shouldSuppressError(error.config)) {
        notify.error('网络连接失败');
      }

      return Promise.reject(error);
    },
  );
}

const refreshRequest: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

installRequestInterceptors(request, { unwrapBusinessData: true });

export function installGeneratedSdkInterceptors(client: AxiosInstance) {
  installRequestInterceptors(client, { unwrapBusinessData: false });
}

const rawRequest: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
});
installRequestInterceptors(rawRequest, { unwrapBusinessData: false });

/** 下载需要登录态的二进制资源，不经过业务 JSON 解包。 */
export async function getBlob(url: string, config?: RequestConfig): Promise<Blob> {
  const response = await rawRequest.get(url, {
    ...config,
    responseType: 'blob',
  });
  return response.data as Blob;
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
