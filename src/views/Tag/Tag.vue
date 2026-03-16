<template>
  <DefaultLayout>
    <div class="tag-page">
      <div class="page-header">
        <h1 class="page-title">标签</h1>
        <p class="page-desc">{{ tags.length }} 个标签</p>
      </div>

      <div class="tags-cloud">
        <router-link
          v-for="tag in tags"
          :key="tag.id"
          :to="`/tag/${tag.id}`"
          class="tag-item"
          :style="{ backgroundColor: tag.color + '20', color: tag.color }"
        >
          {{ tag.name }}
          <span class="tag-count">{{ Math.floor(Math.random() * 15) + 1 }}</span>
        </router-link>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import type { Tag } from '@/types';
import { mockTags } from '@/utils/mock';

const tags = ref<Tag[]>([]);

onMounted(() => {
  tags.value = mockTags;
});
</script>

<style scoped lang="scss">
.tag-page {
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

.tags-cloud {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 40px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.tag-item {
  padding: 10px 18px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}

.tag-count {
  font-size: 12px;
  opacity: 0.8;
}
</style>
