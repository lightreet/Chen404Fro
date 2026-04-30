/**
 * 认证相关 API
 * 包含登录、注册、密码重置等功能
 */

import { get, post, put, type RequestConfig } from './request';
import type {
  LoginParams,
  LoginResult,
  RegisterParams,
  User,
  SendCodeParams,
  ChangePasswordParams,
  UpdateProfileParams,
} from '@/types';

/**
 * 用户登录
 * @param params 登录参数 { username, password, captcha }
 */
export function login(params: LoginParams): Promise<LoginResult> {
  return post('/auth/login', params);
}

/**
 * 用户注册
 * @param params 注册参数 { username, password, nickname, email/phone, code, registerType }
 */
export function register(params: RegisterParams): Promise<User> {
  return post('/auth/register', params);
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
export function getUserInfo(config?: RequestConfig): Promise<User> {
  return get('/auth/info', undefined, config);
}

/**
 * 刷新 Token
 * @param refreshToken 刷新令牌
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
 * @param params 发送验证码参数 { phone/email, type }
 */
export function sendVerifyCode(params: SendCodeParams): Promise<{
  expireSeconds: number;
}> {
  return post('/auth/send-code', params);
}

/**
 * 修改密码（需要登录）
 * @param params 修改密码参数 { oldPassword, newPassword }
 */
export function changePassword(params: ChangePasswordParams): Promise<void> {
  return post('/auth/change-password', params);
}

/**
 * 更新个人资料（需要登录）
 * @param params 更新参数 { nickname, avatar }
 */
export function updateProfile(params: UpdateProfileParams): Promise<User> {
  return put('/auth/profile', params);
}

/**
 * 检查用户名是否可用
 * @param username 用户名
 */
export function checkUsername(username: string): Promise<{
  available: boolean;
  message?: string;
}> {
  return get('/auth/check-username', { username });
}

/**
 * 检查邮箱是否已注册
 * @param email 邮箱
 */
export function checkEmail(email: string): Promise<{
  exists: boolean;
  message?: string;
}> {
  return get('/auth/check-email', { email });
}

/**
 * 检查手机号是否已注册
 * @param phone 手机号
 */
export function checkPhone(phone: string): Promise<{
  exists: boolean;
  message?: string;
}> {
  return get('/auth/check-phone', { phone });
}
