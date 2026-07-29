import type { User, UserCapability } from '@/types';
import { UserRole, UserRoleCode, UserTrustLevel } from '@/types';

export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.roleCode === UserRoleCode.ADMIN || user.role === UserRole.ADMIN;
}

export function isFriendUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return isAdminUser(user) || user.trustLevel === UserTrustLevel.FRIEND;
}

export function hasCapability(
  user: User | null | undefined,
  capability: UserCapability,
): boolean {
  return isAdminUser(user) || Boolean(user?.capabilities?.includes(capability));
}

export function hasAnyCreatorCapability(user: User | null | undefined): boolean {
  return (
    hasCapability(user, 'article:create')
    || hasCapability(user, 'travel:create')
    || hasCapability(user, 'music:create')
  );
}

export function getTrustLevelLabel(user: User | null | undefined): string {
  if (!user) return '来客';
  if (user.memberLabel?.trim()) return user.memberLabel.trim();
  if (user.roleName?.trim() && isAdminUser(user)) return user.roleName.trim();
  if (user.trustLevelName?.trim() && isFriendUser(user)) return user.trustLevelName.trim();
  return isAdminUser(user) ? '管理员' : isFriendUser(user) ? '知友' : '读者';
}
