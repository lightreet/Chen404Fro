<template>
  <div class="admin-page">
    <DefaultLayout>
      <div class="admin-container">
        <div class="admin-header">
          <div class="title">
            <span class="title-main">后台管理</span>
            <span class="title-sub">仅管理员可见</span>
          </div>
        </div>

        <div class="admin-main">
          <aside class="admin-nav">
            <el-menu
              :default-active="activeMenu"
              class="admin-menu"
              @select="handleSelect"
            >
              <el-menu-item index="categories">
                <el-icon><CollectionTag /></el-icon>
                <span>分类管理</span>
              </el-menu-item>
              <el-menu-item index="site-settings">
                <el-icon><Setting /></el-icon>
                <span>站点配置</span>
              </el-menu-item>
              <el-menu-item index="emoji">
                <el-icon><CollectionTag /></el-icon>
                <span>表情包管理</span>
              </el-menu-item>
              <el-menu-item index="trust-requests">
                <el-icon><Postcard /></el-icon>
                <span>受信申请</span>
              </el-menu-item>
            </el-menu>
          </aside>

          <section class="admin-content">
            <AdminCategories v-if="activeMenu === 'categories'" />
            <AdminSiteSettings v-else-if="activeMenu === 'site-settings'" />
            <AdminEmojiManager v-else-if="activeMenu === 'emoji'" />
            <AdminTrustRequests v-else-if="activeMenu === 'trust-requests'" />
          </section>
        </div>
      </div>
    </DefaultLayout>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CollectionTag, Postcard, Setting } from '@element-plus/icons-vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AdminCategories from './AdminCategories.vue'
import AdminEmojiManager from './AdminEmojiManager.vue'
import AdminSiteSettings from './AdminSiteSettings.vue'
import AdminTrustRequests from './AdminTrustRequests.vue'

const route = useRoute()
const router = useRouter()

const normalizeTab = (tab?: string) => (tab === 'hero' ? 'site-settings' : tab || 'categories')
const activeMenu = ref<string>(normalizeTab(route.query.tab as string | undefined))

const currentTabQuery = computed(() => ({ ...route.query, tab: activeMenu.value }))

const handleSelect = (key: string) => {
  activeMenu.value = key
  router.replace({ path: '/admin', query: currentTabQuery.value })
}
</script>

<style scoped lang="scss">
.admin-page {
  min-height: 100vh;
}

.admin-container {
  width: min(1360px, calc(100vw - 48px));
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

.title-sub {
  font-size: 12px;
  color: var(--text-tertiary);
}

.admin-main {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: var(--spacing-lg);
  align-items: start;
  width: 100%;
}

.admin-nav {
  display: flex;
  align-self: start;
}

.admin-menu {
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  overflow: hidden;
  flex: 1;
}

.admin-content {
  min-width: 0;
  width: 100%;
  justify-self: stretch;
}

.admin-page :deep(.content-wrapper.no-right-sidebar .main-area) {
  max-width: none;
}

@media (max-width: 900px) {
  .admin-main {
    grid-template-columns: 1fr;
  }

  .admin-nav {
    display: block;
  }
}
</style>
