/**
 * 友链相关 API
 * 包含友链列表、申请友链等功能
 */

import { get, post } from './request';
import type {
  FriendLink,
  ApplyFriendLinkParams,
} from '@/types';

/**
 * 获取友链列表
 * 只返回已审核通过的友链
 */
export function getFriendLinks(): Promise<FriendLink[]> {
  return get('/friends');
}

/**
 * 申请友链
 * @param data 友链申请数据
 */
export function applyFriendLink(data: ApplyFriendLinkParams): Promise<FriendLink> {
  return post('/friends/apply', data);
}

/**
 * 检查友链申请状态
 * @param siteUrl 站点链接
 */
export function checkFriendLinkStatus(siteUrl: string): Promise<{
  status: 'pending' | 'approved' | 'rejected' | 'not_found';
  message?: string;
}> {
  return get('/friends/check', { siteUrl });
}
