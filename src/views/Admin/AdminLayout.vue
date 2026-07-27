<template>
  <div class="admin-page">
    <DefaultLayout wide-content>
      <div class="admin-container">
        <div class="admin-header">
          <div class="title">
            <span class="title-main">后台管理</span>
          </div>
        </div>

        <div class="admin-main">
          <aside class="admin-nav">
            <nav class="admin-menu" aria-label="后台导航">
              <button
                v-for="item in menuItems"
                :key="item.key"
                type="button"
                class="admin-menu__item"
                :class="{ 'is-active': activeMenu === item.key }"
                @click="handleSelect(item.key)"
              >
                <UiIcon :name="item.icon" class="admin-menu__icon" />
                <span>{{ item.label }}</span>
                <span v-if="item.badge" class="admin-menu__badge">{{ item.badge }}</span>
              </button>
            </nav>
          </aside>

          <section class="admin-content">
            <AdminCategories v-if="activeMenu === 'categories'" />
            <AdminComments
              v-else-if="activeMenu === 'comments'"
              @stats-change="handleCommentStats"
            />
            <AdminSiteSettings v-else-if="activeMenu === 'site-settings'" />
            <AdminEmojiManager v-else-if="activeMenu === 'emoji'" />
            <AdminFiles v-else-if="activeMenu === 'files'" />
            <AdminTrustRequests v-else-if="activeMenu === 'trust-requests'" />
          </section>
        </div>
      </div>
    </DefaultLayout>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAdminCommentStats } from '@/api/admin-comment'
import type { AdminCommentStats } from '@/api/admin-comment'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { UiIcon } from '@/components/ui'
import AdminCategories from './AdminCategories.vue'
import AdminComments from './AdminComments.vue'
import AdminEmojiManager from './AdminEmojiManager.vue'
import AdminFiles from './AdminFiles.vue'
import AdminSiteSettings from './AdminSiteSettings.vue'
import AdminTrustRequests from './AdminTrustRequests.vue'

const route = useRoute()
const router = useRouter()
const pendingCommentCount = ref(0)

const menuItems = computed(() => [
  { key: 'categories', label: '分类管理', icon: 'category' },
  {
    key: 'comments',
    label: '评论审核',
    icon: 'comment',
    badge: pendingCommentCount.value || undefined,
  },
  { key: 'site-settings', label: '站点配置', icon: 'settings' },
  { key: 'emoji', label: '表情包管理', icon: 'image' },
  { key: 'files', label: '文件管理', icon: 'files' },
  { key: 'trust-requests', label: '好友申请', icon: 'postcard' },
])

const normalizeTab = (tab?: string) => {
  if (tab === 'hero') return 'site-settings'
  return tab || 'categories'
}
const activeMenu = ref<string>(normalizeTab(route.query.tab as string | undefined))

const currentTabQuery = computed(() => ({ ...route.query, tab: activeMenu.value }))

const handleSelect = (key: string) => {
  activeMenu.value = key
  router.replace({ path: '/admin', query: currentTabQuery.value })
}

const handleCommentStats = (stats: AdminCommentStats) => {
  pendingCommentCount.value = stats.pendingCount
}

watch(
  () => route.query.tab,
  (tab) => {
    activeMenu.value = normalizeTab(tab as string | undefined)
  },
)

onMounted(() => {
  void getAdminCommentStats()
    .then(handleCommentStats)
    .catch(() => undefined)
})
</script>

<style scoped lang="scss">
.admin-page {
  min-height: 100vh;
}

.admin-container {
  width: min(1520px, 100%);
  margin: 0 auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.admin-header {
  width: 100%;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  text-align: left;
}

.title-main {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.admin-main {
  display: grid;
  grid-template-columns: minmax(180px, 220px) minmax(0, 1fr);
  gap: var(--spacing-lg);
  align-items: start;
  width: 100%;
  min-width: 0;
}

.admin-nav {
  display: flex;
  align-self: start;
  min-width: 0;
}

.admin-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  flex: 1;
}

.admin-menu__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--color-text-secondary);
  font: inherit;
  font-size: var(--font-size-base);
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition:
    background-color var(--motion-duration-fast) var(--motion-ease-standard),
    color var(--motion-duration-fast) var(--motion-ease-standard);

  &:hover:not(.is-active) {
    background: var(--color-surface-muted);
    color: var(--color-text-primary);
  }

  &.is-active {
    background: var(--color-accent-soft);
    color: var(--primary-dark);
    font-weight: 600;
  }
}

.admin-menu__icon {
  font-size: 18px;
  flex-shrink: 0;
}

.admin-menu__badge {
  min-width: 22px;
  margin-left: auto;
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  background: var(--color-warning-soft, #fff4d6);
  color: var(--color-warning);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  text-align: center;
}

.admin-content {
  min-width: 0;
  width: 100%;
  justify-self: stretch;
}

.admin-page :deep(.container) {
  max-width: none;
  width: 100%;
  padding-inline: clamp(12px, 2vw, 24px);
}

.admin-page :deep(.content-wrapper.no-right-sidebar .main-area) {
  max-width: none;
}

.admin-page :deep(.main-content) {
  overflow: visible;
}

@media (max-width: 1320px) {
  .admin-main {
    grid-template-columns: minmax(168px, 190px) minmax(0, 1fr);
    gap: 16px;
  }
}

@media (max-width: 900px) {
  .admin-container {
    width: 100%;
  }

  .admin-main {
    grid-template-columns: 1fr;
  }

  .admin-nav {
    display: block;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .admin-nav::-webkit-scrollbar {
    display: none;
  }

  .admin-menu {
    width: max-content;
    min-width: 100%;
    flex-direction: row;
  }

  .admin-menu__item {
    width: auto;
    flex: 0 0 auto;
    white-space: nowrap;
  }
}
</style>
