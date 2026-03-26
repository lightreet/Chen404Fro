import type { User } from '@/types';
import { UserRole, UserRoleCode, UserTrustLevel } from '@/types';

export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.roleCode === UserRoleCode.ADMIN || user.role === UserRole.ADMIN;
}

export function isFriendUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return isAdminUser(user) || user.trustLevel === UserTrustLevel.FRIEND;
}

export function getTrustLevelLabel(user: User | null | undefined): string {
  if (!user) return '游客';
  if (isAdminUser(user)) return '管理员';
  if (isFriendUser(user)) return '好友 / 受信用户';
  return '普通用户';
}
