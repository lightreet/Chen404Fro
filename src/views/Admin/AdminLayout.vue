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
            </el-menu>
          </aside>

          <section class="admin-content">
            <AdminCategories v-if="activeMenu === 'categories'" />
          </section>
        </div>
      </div>
    </DefaultLayout>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CollectionTag } from '@element-plus/icons-vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import AdminCategories from './AdminCategories.vue';

const route = useRoute();
const router = useRouter();

const activeMenu = ref<string>((route.query.tab as string) || 'categories');

const currentTabQuery = computed(() => ({ ...route.query, tab: activeMenu.value }));

const handleSelect = (key: string) => {
  activeMenu.value = key;
  router.replace({ path: '/admin', query: currentTabQuery.value });
};
</script>

<style scoped lang="scss">
.admin-page {
  min-height: 100vh;
}

.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.admin-header {
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  grid-template-columns: 220px 1fr;
  gap: var(--spacing-lg);
  align-items: start;
}

.admin-nav {
  position: sticky;
  top: calc(64px + var(--spacing-lg));
  height: calc(100vh - (64px + var(--spacing-lg)) - var(--spacing-lg));
  display: flex;
}

.admin-menu {
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  overflow: hidden;
  flex: 1;
  height: 100%;
}

.admin-content {
  min-width: 0;
}

@media (max-width: 900px) {
  .admin-main {
    grid-template-columns: 1fr;
  }
  .admin-nav {
    position: static;
    height: auto;
    display: block;
  }
}
</style>

