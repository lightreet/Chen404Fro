/**
 * 认证相关 API
 * 优先通过 generated SDK 对齐后端契约；refresh/logout 这类特殊流程仍保留手写 request。
 */

import { post, type RequestConfig } from './request';
import type {
  LoginParams,
  LoginResult,
  RegisterParams,
  User,
  SendCodeParams,
  ChangePasswordParams,
  UpdateProfileParams,
} from '@/types';
import { Service } from '@/sdk/generated';
import { unwrapResult } from '@/sdk/runtime';

/**
 * 用户登录
 */
export async function login(params: LoginParams): Promise<LoginResult> {
  return unwrapResult(await Service.login({
    requestBody: {
      username: params.username,
      password: params.password,
      captcha: params.captcha,
    },
  })) as LoginResult;
}

/**
 * 用户注册
 */
export async function register(params: RegisterParams): Promise<User> {
  return unwrapResult(await Service.register({
    requestBody: {
      username: params.username,
      password: params.password,
      nickname: params.nickname,
      email: params.email,
      phone: params.phone,
      code: params.code || '',
    },
  })) as User;
}

/**
 * 退出登录
 */
export function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('refreshToken') || undefined;
  return post('/auth/logout', refreshToken ? { refreshToken } : undefined);
}

/**
 * 获取当前登录用户信息
 */
export async function getUserInfo(_config?: RequestConfig): Promise<User> {
  return unwrapResult(await Service.getUserInfo()) as User;
}

/**
 * 刷新 Token
 */
export function refreshToken(refreshToken: string): Promise<{
  token: string;
  refreshToken: string;
  expires: number;
}> {
  return post('/auth/refresh', { refreshToken });
}

/**
 * 发送验证码（邮箱或短信）
 */
export async function sendVerifyCode(params: SendCodeParams): Promise<{
  expireSeconds: number;
}> {
  return unwrapResult(await Service.sendCode({
    requestBody: {
      phone: params.phone,
      email: params.email,
      type: params.type,
    },
  })) as { expireSeconds: number };
}

/**
 * 修改密码（需要登录）
 */
export async function changePassword(params: ChangePasswordParams): Promise<void> {
  await unwrapResult(await Service.changePassword({
    requestBody: {
      oldPassword: params.oldPassword,
      newPassword: params.newPassword,
    },
  }));
}

/**
 * 更新个人资料（需要登录）
 */
export async function updateProfile(params: UpdateProfileParams): Promise<User> {
  return unwrapResult(await Service.updateProfile({
    requestBody: {
      nickname: params.nickname,
      avatar: params.avatar,
      bio: params.bio,
    },
  })) as User;
}

/**
 * 检查用户名是否可用
 */
export async function checkUsername(username: string): Promise<{
  available: boolean;
  message?: string;
}> {
  const exists = unwrapResult(await Service.checkUsername({ username })) as boolean;
  return {
    available: !exists,
  };
}

/**
 * 检查邮箱是否已注册
 */
export async function checkEmail(email: string): Promise<{
  exists: boolean;
  message?: string;
}> {
  const exists = unwrapResult(await Service.checkEmail({ email })) as boolean;
  return {
    exists,
  };
}

/**
 * 检查手机号是否已注册
 */
export async function checkPhone(phone: string): Promise<{
  exists: boolean;
  message?: string;
}> {
  const exists = unwrapResult(await Service.checkPhone({ phone })) as boolean;
  return {
    exists,
  };
}
