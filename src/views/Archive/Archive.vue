<template>
  <DefaultLayout>
    <template #hero>
      <PageHero
        title="时光轴"
        eyebrow="Timeline"
        subtitle="沿着时间回看已经发布的内容，看看这个站点一路留下了哪些记录。"
        :bg-image="heroBgImage"
        bg-position="center 44%"
        min-height="320px"
        :overlay-opacity="0.48"
        compact
      >
        <template #meta>
          <div class="hero-meta">
            <span class="hero-stat">{{ total }} 篇文章</span>
          </div>
        </template>
      </PageHero>
    </template>

    <div class="archive-page">
      <el-skeleton v-if="loading" :rows="8" animated />

      <div v-else-if="archiveData.length === 0" class="empty-state">暂无公开文章记录</div>

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
import PageHero from '@/components/PageHero/PageHero.vue';
import { useSiteConfig } from '@/composables/useSiteConfig';
import type { ArchiveYear } from '@/types';
import { formatDate } from '@/utils/format';
import { getArchives } from '@/api/article';

const DEFAULT_ARCHIVE_HERO =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1920&q=80';
const archiveData = ref<ArchiveYear[]>([]);
const total = ref(0);
const loading = ref(true);
const heroBgImage = ref(DEFAULT_ARCHIVE_HERO);
const { loadSiteConfig } = useSiteConfig();

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
  void loadSiteConfig(true).then((config) => {
    heroBgImage.value = config.heroImages?.archive || DEFAULT_ARCHIVE_HERO;
  });
  loadArchives();
});
</script>

<style scoped lang="scss">
.archive-page {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding-top: 20px;
}

.hero-meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.hero-stat {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.94);
  font-size: 13px;
  backdrop-filter: blur(10px);
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
