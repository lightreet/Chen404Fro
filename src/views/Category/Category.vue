<template>
  <DefaultLayout>
    <div class="category-page">
      <div class="page-header">
        <h1 class="page-title">分类</h1>
        <p class="page-desc">探索不同主题的文章</p>
      </div>

      <div class="categories-grid">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-card"
        >
          <router-link :to="`/category/${category.id}`">
            <div class="category-icon">
              <el-icon><FolderOpened /></el-icon>
            </div>
            <h3 class="category-name">{{ category.name }}</h3>
            <p class="category-desc">{{ category.description }}</p>
            <span class="category-count">{{ Math.floor(Math.random() * 20) + 1 }} 篇文章</span>
          </router-link>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { FolderOpened } from '@element-plus/icons-vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import type { Category } from '@/types';
import { mockCategories } from '@/utils/mock';

const categories = ref<Category[]>([]);

onMounted(() => {
  categories.value = mockCategories;
});
</script>

<style scoped lang="scss">
.category-page {
  padding-top: 24px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.page-desc {
  font-size: 14px;
  color: var(--text-secondary);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.category-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 28px;
  transition: all 0.3s;
  text-align: center;

  a {
    color: inherit;
    text-decoration: none;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
}

.category-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
}

.category-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.category-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 12px;
  min-height: 40px;
}

.category-count {
  font-size: 13px;
  color: var(--primary);
  font-weight: 500;
}
</style>
