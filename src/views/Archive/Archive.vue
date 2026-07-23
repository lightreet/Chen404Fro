<template>
  <DefaultLayout>
    <template #hero>
      <PageHero
        title="文章记录"
        eyebrow="Archive"
        subtitle="把写过的内容，交给时间排序。"
        :bg-image="heroBgImage"
        :bg-position="heroBgPosition"
        min-height="64vh"
        compact
        scroll-target="#archive-content"
      >
        <template #meta>
          <div class="hero-meta">
            <UiIcon name="article" />
            <span>{{ loading ? '正在整理文章' : `${total} 篇文章` }}</span>
          </div>
        </template>
      </PageHero>
    </template>

    <main id="archive-content" class="archive-page">
      <UiSkeleton v-if="loading" :rows="8" size="lg" class="content-surface" />

      <UiEmpty
        v-else-if="archiveData.length === 0"
        title="还没有公开文章记录"
        description="文章发布后，会按照年份和月份出现在这里。"
        icon="article"
        size="lg"
        class="content-surface"
      />

      <div v-else class="article-timeline content-surface">
        <section
          v-for="year in archiveData"
          :key="year.year"
          class="timeline-year"
          :aria-labelledby="`archive-year-${year.year}`"
        >
          <header class="year-header">
            <h2 :id="`archive-year-${year.year}`">{{ year.year }}</h2>
            <span>{{ year.count }} 篇文章</span>
          </header>

          <div class="timeline-months">
            <section
              v-for="month in year.months"
              :key="month.month"
              class="timeline-month"
              :aria-labelledby="`archive-month-${year.year}-${month.month}`"
            >
              <header class="month-header">
                <span class="month-dot" aria-hidden="true" />
                <h3 :id="`archive-month-${year.year}-${month.month}`">{{ month.month }} 月</h3>
                <span>{{ month.count ?? month.articles.length }} 篇</span>
              </header>

              <div class="article-list">
                <router-link
                  v-for="article in month.articles"
                  :key="article.id"
                  :to="`/article/${article.id}`"
                  class="article-item"
                >
                  <time :datetime="article.publishTime" class="article-date">
                    {{ formatDate(article.publishTime, 'MM-DD') }}
                  </time>
                  <span class="article-title-text">{{ article.title }}</span>
                  <span class="article-tags">
                    <span
                      v-for="tag in article.tags || []"
                      :key="tag.id"
                      class="article-tag"
                      :style="{
                        backgroundColor: (tag.color || '#fb7299') + '1f',
                        color: tag.color || '#d9567e',
                      }"
                    >
                      {{ tag.name }}
                    </span>
                  </span>
                  <UiIcon name="arrow-right" class="article-arrow" />
                </router-link>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import PageHero from '@/components/PageHero/PageHero.vue'
import { UiEmpty, UiIcon, UiSkeleton } from '@/components/ui'
import { useSiteConfig } from '@/composables/useSiteConfig'
import type { ArchiveYear } from '@/types'
import { formatDate } from '@/utils/format'
import { resolveHeroImagePosition } from '@/utils/siteConfig'
import { getArchives } from '@/api/article'

const DEFAULT_ARCHIVE_HERO =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1920&q=80'
const DEFAULT_ARCHIVE_HERO_POSITION = '50% 44%'

const archiveData = ref<ArchiveYear[]>([])
const total = ref(0)
const loading = ref(false)
const heroBgImage = ref(DEFAULT_ARCHIVE_HERO)
const heroBgPosition = ref(DEFAULT_ARCHIVE_HERO_POSITION)
const { loadSiteConfig } = useSiteConfig()

async function loadArchives() {
  loading.value = true
  try {
    const data = await getArchives()
    archiveData.value = data ?? []
    total.value = archiveData.value.reduce((sum, year) => sum + (year.count ?? 0), 0)
  } catch {
    archiveData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadArchives()
  void loadSiteConfig(true).then((config) => {
    heroBgImage.value = config.heroImages?.archive || DEFAULT_ARCHIVE_HERO
    heroBgPosition.value = resolveHeroImagePosition(config, 'archive', DEFAULT_ARCHIVE_HERO_POSITION)
  })
})
</script>

<style scoped lang="scss">
.archive-page {
  width: min(100%, 1080px);
  margin: 0 auto;
  padding: 20px 0 48px;
}

.hero-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.95);
  font-size: 13px;
  backdrop-filter: blur(8px);
}

.content-surface {
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.article-timeline {
  padding: 30px;
}

.timeline-year + .timeline-year {
  margin-top: 42px;
}

.year-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 22px;
  padding-bottom: 11px;
  border-bottom: 1px solid var(--color-border);
}

.year-header h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 25px;
  line-height: 1.2;
  font-weight: 680;
  font-variant-numeric: tabular-nums;
}

.year-header span {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.timeline-month {
  position: relative;
  padding-left: 24px;
}

.timeline-month + .timeline-month {
  margin-top: 28px;
}

.timeline-month::before {
  content: '';
  position: absolute;
  top: 8px;
  bottom: -30px;
  left: 4px;
  width: 1px;
  background: var(--color-border);
}

.timeline-month:last-child::before {
  bottom: 0;
}

.month-header {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}

.month-dot {
  position: absolute;
  top: 7px;
  left: -24px;
  width: 9px;
  height: 9px;
  border: 2px solid var(--color-surface);
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
}

.month-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 650;
}

.month-header > span:last-child {
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.article-list {
  display: flex;
  flex-direction: column;
}

.article-item {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto 20px;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 7px 10px;
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  text-decoration: none;
  transition:
    background-color var(--motion-duration-fast) var(--motion-ease-standard),
    color var(--motion-duration-fast) var(--motion-ease-standard);
}

.article-item:hover {
  background: var(--color-surface-muted);
  color: var(--color-accent-strong);
}

.article-item:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.article-date {
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.article-title-text {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 520;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-tags {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 5px;
}

.article-tag {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: var(--radius-pill);
  font-size: 10px;
  white-space: nowrap;
}

.article-arrow {
  color: var(--color-text-tertiary);
  font-size: 15px;
  transition: transform var(--motion-duration-fast) var(--motion-ease-entrance);
}

.article-item:hover .article-arrow {
  transform: translateX(2px);
  color: var(--color-accent-strong);
}

@media (max-width: 768px) {
  .archive-page {
    padding-top: 14px;
    padding-bottom: 34px;
  }

  .article-timeline {
    padding: 22px 18px;
  }

  .timeline-year + .timeline-year {
    margin-top: 34px;
  }

  .timeline-month {
    padding-left: 20px;
  }

  .month-dot {
    left: -20px;
  }

  .article-item {
    grid-template-columns: 42px minmax(0, 1fr) 18px;
    gap: 8px;
    padding: 9px 6px;
  }

  .article-tags {
    grid-column: 2 / -1;
    justify-content: flex-start;
  }

  .article-arrow {
    grid-column: 3;
    grid-row: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .article-item,
  .article-arrow {
    transition: none;
  }
}
</style>
