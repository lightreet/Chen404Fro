<template>
  <section class="notification-page">
    <header class="notification-page__header">
      <div>
        <span class="notification-page__eyebrow">Site activity</span>
        <h2>消息中心</h2>
        <p>查看知友最近发布的文章、旅行地点、音乐与新的好友申请。</p>
      </div>
      <UiButton
        variant="secondary"
        icon="check"
        :disabled="notificationStore.unreadCount === 0"
        :loading="markingAll"
        @click="handleMarkAllRead"
      >
        全部已读
      </UiButton>
    </header>

    <div class="notification-page__filters">
      <div class="notification-page__filter-controls">
        <UiSegmented v-model="readFilter" :options="readFilterOptions" />
        <UiSelect
          v-model="eventFilter"
          :options="eventFilterOptions"
          size="sm"
          aria-label="按消息类型筛选"
        />
      </div>
      <span class="notification-page__count">
        {{ notificationStore.unreadCount > 0 ? `${notificationStore.unreadCount} 条未读` : '没有未读消息' }}
      </span>
    </div>

    <UiLoadingState :loading="loading" message="正在整理最近的站点动态...">
      <div v-if="notifications.length" class="notification-list">
        <article
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-card"
          :class="{ 'is-unread': !notification.read }"
        >
          <button
            type="button"
            class="notification-card__main"
            @click="openNotification(notification)"
          >
            <span class="notification-card__icon">
              <UiIcon :name="eventIcon(notification.eventType)" />
            </span>
            <span class="notification-card__body">
              <span class="notification-card__heading">
                <strong>{{ notification.title }}</strong>
                <span v-if="!notification.read" class="notification-card__unread-dot" aria-label="未读" />
              </span>
              <span class="notification-card__summary">{{ notification.summary }}</span>
              <span class="notification-card__meta">
                <UiAvatar
                  v-if="notification.actor"
                  :src="notification.actor.avatar"
                  :size="22"
                >
                  {{ notification.actor.nickname?.charAt(0) || '知' }}
                </UiAvatar>
                <span>{{ notification.actor?.nickname || '系统用户' }}</span>
                <span>·</span>
                <time :datetime="notification.createTime">{{ formatTime(notification.createTime) }}</time>
              </span>
            </span>
          </button>
          <div class="notification-card__actions">
            <UiButton
              v-if="!notification.read"
              variant="text"
              size="sm"
              @click="handleMarkRead(notification)"
            >
              标为已读
            </UiButton>
            <UiButton
              variant="text"
              size="sm"
              icon="delete"
              aria-label="删除消息"
              @click="handleDelete(notification)"
            />
          </div>
        </article>
      </div>

      <UiEmpty
        v-else
        :description="readFilter === 'unread' ? '最近没有未读消息。' : '功能上线后的新内容会出现在这里。'"
      />
    </UiLoadingState>

    <UiPagination
      v-if="total > pageSize"
      :current="page"
      :page-size="pageSize"
      :total="total"
      @change="loadNotifications"
    />
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import {
  getAdminNotifications,
} from '@/api/admin-notification'
import { confirmDelete, notify } from '@/lib/feedback'
import { useAdminNotificationStore } from '@/stores/admin-notification'
import {
  UiAvatar,
  UiButton,
  UiEmpty,
  UiIcon,
  UiLoadingState,
  UiPagination,
  UiSegmented,
  UiSelect,
} from '@/components/ui'
import type { AdminNotification, AdminNotificationEventType } from '@/types'

type ReadFilter = 'all' | 'unread' | 'read'

const router = useRouter()
const notificationStore = useAdminNotificationStore()
const notifications = ref<AdminNotification[]>([])
const loading = ref(false)
const markingAll = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)
const readFilter = ref<ReadFilter>('all')
const eventFilter = ref<AdminNotificationEventType | ''>('')
const readFilterOptions = [
  { label: '全部', value: 'all' },
  { label: '未读', value: 'unread' },
  { label: '已读', value: 'read' },
]
const eventFilterOptions = [
  { label: '全部类型', value: '' },
  { label: '文章草稿', value: 'ARTICLE_CREATED' },
  { label: '文章发布', value: 'ARTICLE_PUBLISHED' },
  { label: '旅行地点', value: 'TRAVEL_MEMORY_CREATED' },
  { label: '音乐草稿', value: 'MUSIC_TRACK_CREATED' },
  { label: '音乐发布', value: 'MUSIC_TRACK_PUBLISHED' },
  { label: '知友申请', value: 'TRUST_REQUEST_CREATED' },
]

const loadNotifications = async (nextPage = 1) => {
  loading.value = true
  page.value = nextPage
  try {
    const result = await getAdminNotifications({
      page: nextPage,
      size: pageSize,
      readStatus: readFilter.value === 'all' ? undefined : readFilter.value === 'unread' ? 0 : 1,
      eventType: eventFilter.value || undefined,
    })
    notifications.value = result.list ?? []
    total.value = result.total ?? 0
  } catch (error) {
    notify.error(error instanceof Error ? error.message : '管理员消息加载失败')
  } finally {
    loading.value = false
  }
}

const handleMarkRead = async (notification: AdminNotification) => {
  if (notification.read) return
  try {
    await notificationStore.markRead(notification.id, true)
    notification.read = true
    if (readFilter.value === 'unread') {
      await loadNotifications(page.value)
    }
  } catch (error) {
    notify.error(error instanceof Error ? error.message : '标记已读失败')
  }
}

const handleMarkAllRead = async () => {
  markingAll.value = true
  try {
    await notificationStore.markAllRead()
    notifications.value.forEach((item) => {
      item.read = true
    })
    if (readFilter.value === 'unread') {
      await loadNotifications(1)
    }
    notify.success('全部消息已标记为已读')
  } catch (error) {
    notify.error(error instanceof Error ? error.message : '操作失败')
  } finally {
    markingAll.value = false
  }
}

const handleDelete = async (notification: AdminNotification) => {
  const confirmed = await confirmDelete('删除这条消息不会影响对应内容，确定继续吗？', {
    title: '删除消息',
  })
  if (!confirmed) return
  try {
    await notificationStore.remove(notification.id, !notification.read)
    await loadNotifications(page.value)
  } catch (error) {
    notify.error(error instanceof Error ? error.message : '删除消息失败')
  }
}

const openNotification = async (notification: AdminNotification) => {
  if (!notification.read) {
    await handleMarkRead(notification)
  }
  if (notification.resourceType === 'ARTICLE') {
    await router.push(`/article/${notification.resourceId}`)
    return
  }
  if (notification.resourceType === 'TRAVEL_MEMORY') {
    await router.push({ path: '/memory-map', query: { focus: String(notification.resourceId) } })
    return
  }
  if (notification.resourceType === 'MUSIC_TRACK') {
    await router.push(`/music/tracks/${notification.resourceId}/edit`)
    return
  }
  await router.push({ path: '/admin', query: { tab: 'trust-requests' } })
}

const eventIcon = (eventType: AdminNotificationEventType) => {
  if (eventType.startsWith('ARTICLE')) return 'article'
  if (eventType === 'TRAVEL_MEMORY_CREATED') return 'location'
  if (eventType.startsWith('MUSIC')) return 'music'
  return 'postcard'
}

const formatTime = (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm')

watch([readFilter, eventFilter], () => {
  void loadNotifications(1)
})

onMounted(() => {
  void Promise.all([
    loadNotifications(),
    notificationStore.refreshUnreadCount(),
  ])
})
</script>

<style scoped lang="scss">
.notification-page {
  display: grid;
  gap: 18px;
}

.notification-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 22px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);

  h2 {
    margin: 4px 0 8px;
    color: var(--color-text-primary);
    font-size: 24px;
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
  }
}

.notification-page__eyebrow {
  color: var(--primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.notification-page__filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.notification-page__filter-controls {
  display: flex;
  align-items: center;
  gap: 10px;

  :deep(.ui-select) {
    width: 148px;
  }
}

.notification-page__count {
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.notification-list {
  display: grid;
  gap: 10px;
}

.notification-card {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  transition:
    border-color var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-fast) var(--motion-ease-standard);

  &:hover {
    border-color: var(--color-accent-border);
    transform: translateY(-1px);
  }

  &.is-unread {
    border-color: rgba(255, 127, 170, 0.35);
    background: linear-gradient(135deg, var(--color-surface), var(--color-accent-soft));
  }
}

.notification-card__main {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
  flex: 1;
  padding: 16px;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.notification-card__icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border-radius: 12px;
  background: var(--color-accent-soft);
  color: var(--primary);
  font-size: 19px;
}

.notification-card__body {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.notification-card__heading,
.notification-card__meta {
  display: flex;
  align-items: center;
  gap: 7px;
}

.notification-card__heading strong {
  color: var(--color-text-primary);
}

.notification-card__unread-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary);
}

.notification-card__summary {
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.notification-card__meta {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.notification-card__actions {
  display: flex;
  align-items: center;
  padding-right: 12px;
}

@media (max-width: 720px) {
  .notification-page__header,
  .notification-page__filters {
    align-items: stretch;
    flex-direction: column;
  }

  .notification-card {
    align-items: stretch;
    flex-direction: column;
  }

  .notification-card__actions {
    justify-content: flex-end;
    padding: 0 12px 12px;
  }
}
</style>
