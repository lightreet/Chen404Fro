import axios from 'axios';
import { OpenAPI } from './generated';
import {
  DEFAULT_REQUEST_TIMEOUT_MS,
  installGeneratedSdkInterceptors,
} from '@/api/request';
import { readAccessToken } from '@/utils/authSession';

export interface ResultEnvelope<T> {
  code?: number;
  message?: string;
  data?: T;
}

/**
 * 让 generated SDK 复用当前前端的 API 基地址与 Bearer Token 读取方式。
 */
export function configureGeneratedSdk() {
  OpenAPI.BASE = import.meta.env.VITE_API_BASE_URL || '/api';
  OpenAPI.TOKEN = async () => readAccessToken();
  axios.defaults.timeout = DEFAULT_REQUEST_TIMEOUT_MS;
  installGeneratedSdkInterceptors(axios);
}

/**
 * 统一拆包 Spring Boot 的 { code, message, data } 响应。
 */
export function unwrapResult<T>(result?: ResultEnvelope<T> | null): T {
  if (!result) {
    throw new Error('接口返回为空');
  }

  if (result.code !== 200) {
    throw new Error(result.message || '请求失败');
  }

  return result.data as T;
}

configureGeneratedSdk();
