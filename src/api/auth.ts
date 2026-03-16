/**
 * 认证相关 API
 * 包含登录、注册、密码重置等功能
 */

import { get, post } from './request';
import type {
  LoginParams,
  LoginResult,
  RegisterParams,
  User,
  SendCodeParams,
  ForgotPasswordParams,
  ChangePasswordParams,
  ApiResponse,
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
  return post('/auth/logout');
}

/**
 * 获取当前登录用户信息
 */
export function getUserInfo(): Promise<User> {
  return get('/auth/info');
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
  code: string; // 测试环境返回，生产环境不返回
  expireSeconds: number;
}> {
  return post('/auth/send-code', params);
}

/**
 * 验证验证码
 * @param account 邮箱或手机号
 * @param code 验证码
 * @param type 验证类型
 */
export function verifyCode(
  account: string,
  code: string,
  type: 'email' | 'phone'
): Promise<boolean> {
  return post('/auth/verify-code', { account, code, type });
}

/**
 * 忘记密码 - 重置密码
 * @param params 重置密码参数 { account, code, newPassword }
 */
export function resetPassword(params: ForgotPasswordParams): Promise<void> {
  return post('/auth/reset-password', params);
}

/**
 * 修改密码（需要登录）
 * @param params 修改密码参数 { oldPassword, newPassword }
 */
export function changePassword(params: ChangePasswordParams): Promise<void> {
  return post('/auth/change-password', params);
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
