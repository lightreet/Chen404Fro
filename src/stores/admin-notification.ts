import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  deleteAdminNotification,
  getAdminNotificationUnreadCount,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from '@/api/admin-notification'

const POLL_INTERVAL_MS = 60_000

export const useAdminNotificationStore = defineStore('admin-notification', () => {
  const unreadCount = ref(0)
  const loadingUnreadCount = ref(false)
  let pollTimer: number | null = null
  let visibilityListenerAttached = false

  const refreshUnreadCount = async () => {
    if (loadingUnreadCount.value) return unreadCount.value
    loadingUnreadCount.value = true
    try {
      unreadCount.value = await getAdminNotificationUnreadCount()
      return unreadCount.value
    } finally {
      loadingUnreadCount.value = false
    }
  }

  const markRead = async (id: number | string, wasUnread = true) => {
    await markAdminNotificationRead(id)
    if (wasUnread) {
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  }

  const markAllRead = async () => {
    await markAllAdminNotificationsRead()
    unreadCount.value = 0
  }

  const remove = async (id: number | string, wasUnread = false) => {
    await deleteAdminNotification(id)
    if (wasUnread) {
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  }

  const startPolling = () => {
    if (pollTimer != null) return
    void refreshUnreadCount()
    pollTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshUnreadCount()
      }
    }, POLL_INTERVAL_MS)
    if (!visibilityListenerAttached) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      visibilityListenerAttached = true
    }
  }

  const stopPolling = () => {
    if (pollTimer != null) {
      window.clearInterval(pollTimer)
      pollTimer = null
    }
    if (visibilityListenerAttached) {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      visibilityListenerAttached = false
    }
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      void refreshUnreadCount()
    }
  }

  const reset = () => {
    stopPolling()
    unreadCount.value = 0
  }

  return {
    unreadCount,
    loadingUnreadCount,
    refreshUnreadCount,
    markRead,
    markAllRead,
    remove,
    startPolling,
    stopPolling,
    reset,
  }
})
