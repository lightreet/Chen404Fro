<template>
  <DefaultLayout>
    <div class="archive-page">
      <div class="page-header">
        <h1 class="page-title">归档</h1>
        <p class="page-desc">共计 {{ total }} 篇文章</p>
      </div>

      <el-skeleton v-if="loading" :rows="8" animated />

      <div v-else-if="archiveData.length === 0" class="empty-state">暂无公开文章归档</div>

      <div v-else class="timeline">
        <div
          v-for="year in archiveData"
          :key="year.year"
          class="timeline-year"
        >
          <div class="year-header">
            <span class="year-title">{{ year.year }}</span>
            <span class="year-count">({{ year.count }} 篇)</span>
          </div>

          <div class="timeline-months">
            <div
              v-for="month in year.months"
              :key="month.month"
              class="timeline-month"
            >
              <div class="month-header">
                <span class="month-title">{{ month.month }} 月</span>
                <span class="month-count">({{ month.count ?? month.articles.length }} 篇)</span>
              </div>

              <div class="article-list">
                <router-link
                  v-for="article in month.articles"
                  :key="article.id"
                  :to="`/article/${article.id}`"
                  class="article-item"
                >
                  <span class="article-date">{{ formatDate(article.publishTime, 'MM-DD') }}</span>
                  <span class="article-title-text">{{ article.title }}</span>
                  <span
                    v-for="tag in article.tags || []"
                    :key="tag.id"
                    class="article-tag"
                    :style="{ backgroundColor: (tag.color || '#fb7299') + '20', color: tag.color || '#fb7299' }"
                  >
                    {{ tag.name }}
                  </span>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import type { ArchiveYear } from '@/types';
import { formatDate } from '@/utils/format';
import { getArchives } from '@/api/article';

const archiveData = ref<ArchiveYear[]>([]);
const total = ref(0);
const loading = ref(true);

const loadArchives = async () => {
  loading.value = true;
  try {
    const data = await getArchives();
    archiveData.value = data ?? [];
    total.value = archiveData.value.reduce((sum, y) => sum + (y.count ?? 0), 0);
  } catch {
    archiveData.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadArchives();
});
</script>

<style scoped lang="scss">
.archive-page {
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

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-tertiary);
  font-size: 15px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.timeline {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 32px;
}

.timeline-year {
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
}

.year-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--primary);
}

.year-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.year-count {
  font-size: 14px;
  color: var(--text-secondary);
}

.timeline-month {
  margin-bottom: 24px;
  padding-left: 20px;
  border-left: 2px solid var(--border-color);
}

.month-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  margin-left: -22px;
  padding-left: 20px;
}

.month-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
}

.month-count {
  font-size: 13px;
  color: var(--text-tertiary);
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.article-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.3s;

  &:hover {
    background: var(--bg-hover);
    color: var(--primary);
  }
}

.article-date {
  font-size: 13px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.article-title-text {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .timeline {
    padding: 20px;
  }

  .article-item {
    flex-wrap: wrap;

    .article-tag {
      margin-left: auto;
    }
  }
}
</style>
