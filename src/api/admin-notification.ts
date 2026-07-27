import { del, get, put } from './request'
import type {
  AdminNotification,
  AdminNotificationEventType,
  PageParams,
  PageResult,
} from '@/types'

export interface AdminNotificationQueryParams extends PageParams {
  readStatus?: 0 | 1
  eventType?: AdminNotificationEventType
}

export function getAdminNotifications(
  params?: AdminNotificationQueryParams,
): Promise<PageResult<AdminNotification>> {
  return get('/admin/notifications', params)
}

export async function getAdminNotificationUnreadCount(): Promise<number> {
  const result = await get<{ count: number }>('/admin/notifications/unread-count')
  return result.count ?? 0
}

export function markAdminNotificationRead(id: number | string): Promise<void> {
  return put(`/admin/notifications/${String(id)}/read`)
}

export function markAllAdminNotificationsRead(): Promise<void> {
  return put('/admin/notifications/read-all')
}

export function deleteAdminNotification(id: number | string): Promise<void> {
  return del(`/admin/notifications/${String(id)}`)
}
