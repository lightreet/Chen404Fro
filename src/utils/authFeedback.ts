import { isAxiosError } from 'axios';
import { notify } from '@/lib/feedback';

const GENERIC_ERROR_MESSAGES = new Set(['请求失败', '接口返回为空']);

/**
 * 认证接口同时包含 generated SDK 的业务错误与 Axios 传输错误。
 * 传输错误已经由 request.ts 统一提示，这里只补齐页面侧的业务失败反馈。
 */
export function notifyAuthFailure(error: unknown, fallbackMessage: string): boolean {
  if (isAxiosError(error) || (error instanceof Error && error.name === 'ApiError')) {
    return false;
  }

  const errorMessage = error instanceof Error ? error.message.trim() : '';
  const message = errorMessage && !GENERIC_ERROR_MESSAGES.has(errorMessage)
    ? errorMessage
    : fallbackMessage;

  notify.error({
    message,
    duration: 4500,
    showClose: true,
  });
  return true;
}
