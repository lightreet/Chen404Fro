<template>
  <DefaultLayout>
    <template #hero>
      <PageHero
        title="分类"
        eyebrow="Category"
        subtitle="按主题浏览内容，把零散文章组织成更清晰的知识地图。"
        :bg-image="heroBgImage"
        :bg-position="heroBgPosition"
        min-height="64vh"
        compact
        scroll-target="#category-content"
      >
        <template #meta>
          <div class="hero-meta">
            <span class="hero-stat">{{ categories.length }} 个分类</span>
          </div>
        </template>
      </PageHero>
    </template>

    <div id="category-content" class="category-page">
      <AppTopicNavigation v-if="isMobile" active="category" heading="按主题开始阅读" />

      <div v-if="loading" class="loading-state" role="status">
        <UiIcon class="loading-icon" name="Loading" spin />
        <p>加载中…</p>
      </div>

      <UiEmpty v-else-if="loadFailed" title="分类加载失败" description="请检查网络后重试。">
        <template #action>
          <UiButton @click="fetchCategories">重新加载</UiButton>
        </template>
      </UiEmpty>

      <!-- 分类网格：首屏 9 个，加载更多每次 +9 -->
      <template v-else>
        <div class="categories-grid">
          <div
            v-for="category in displayedCategories"
            :key="category.id"
            class="category-card"
            :class="{ 'jp-card jp-card-hover': !isMobile }"
          >
            <router-link
              :to="`/category/${category.id}`"
              :aria-label="`${category.name}，${category.articleCount ?? 0} 篇文章`"
            >
              <div class="category-icon">
                <CategoryIcon :icon="category.icon" width="28" height="28" />
              </div>
              <div class="category-copy">
                <h2 class="category-name">{{ category.name }}</h2>
                <p class="category-desc">{{ category.description || '暂无描述' }}</p>
                <span class="category-count">{{ (category.articleCount ?? 0) }} 篇文章</span>
              </div>
              <UiIcon v-if="isMobile" class="category-arrow" name="arrow-right" :size="20" />
            </router-link>
          </div>
        </div>

        <!-- 空状态 -->
        <UiEmpty v-if="categories.length === 0" title="暂无分类" description="可以通过搜索查找感兴趣的文章。" />

        <!-- 加载更多 -->
        <div v-else-if="hasMore" class="load-more">
          <UiButton variant="primary" :class="{ 'jp-btn-primary !border-0': !isMobile }" @click="loadMore">
            加载更多
          </UiButton>
        </div>

        <!-- 没有更多了 -->
        <div v-else-if="categories.length > 0" class="no-more">
          <UiDivider>
            <span class="no-more-text">已经到底啦 ~</span>
          </UiDivider>
        </div>
      </template>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { notify } from '@/lib/feedback';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import CategoryIcon from '@/components/CategoryIcon/CategoryIcon.vue';
import PageHero from '@/components/PageHero/PageHero.vue';
import AppTopicNavigation from '@/components/app/AppTopicNavigation/AppTopicNavigation.vue';
import { UiButton, UiDivider, UiEmpty, UiIcon } from '@/components/ui'
import { useSiteConfig } from '@/composables/useSiteConfig';
import { useMobileViewport } from '@/composables/useMobileViewport';
import type { Category } from '@/types';
import { resolveHeroImagePosition } from '@/utils/siteConfig';
import { getCategories } from '@/api/article';

const pageSize = 9;
const DEFAULT_CATEGORY_HERO =
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1920&q=80';
const DEFAULT_CATEGORY_HERO_POSITION = '50% 40%';

const categories = ref<Category[]>([]);
const displayCount = ref(pageSize);
const loading = ref(true);
const loadFailed = ref(false);
const { isMobile } = useMobileViewport();
const heroBgImage = ref(DEFAULT_CATEGORY_HERO);
const heroBgPosition = ref(DEFAULT_CATEGORY_HERO_POSITION);
const { loadSiteConfig } = useSiteConfig();

const displayedCategories = computed(() =>
  categories.value.slice(0, displayCount.value)
);

const hasMore = computed(
  () => categories.value.length > displayCount.value
);

const loadMore = () => {
  displayCount.value += pageSize;
};

const fetchCategories = async () => {
  loading.value = true;
  loadFailed.value = false;
  try {
    const list = await getCategories(true);
    categories.value = list ?? [];
  } catch (err) {
    console.error('加载分类失败', err);
    notify.error('加载分类失败，请稍后重试');
    categories.value = [];
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  void loadSiteConfig(true).then((config) => {
    heroBgImage.value = config.heroImages?.category || DEFAULT_CATEGORY_HERO;
    heroBgPosition.value = resolveHeroImagePosition(config, 'category', DEFAULT_CATEGORY_HERO_POSITION);
  });
  fetchCategories();
});
</script>

<style scoped lang="scss">
.category-page {
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

.loading-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-secondary);

  .loading-icon {
    font-size: 32px;
    margin-bottom: 12px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.load-more {
  text-align: center;
  padding: 24px 0;
}

.no-more {
  padding: 24px 0;

  .no-more-text {
    color: var(--text-tertiary);
    font-size: 14px;
  }
}

/* 每行 3 个，桌面端；平板 2 列，手机 1 列 */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

@media (max-width: 900px) {
  .categories-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
}

.category-card {
  padding: 28px;
  text-align: center;

  a {
    color: inherit;
    text-decoration: none;
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

  /* Iconify 图标继承父级白色 */
  :deep(svg) {
    color: currentColor;
  }
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

@media (max-width: 767px) {
  .category-page { padding-top: 10px; }
  .categories-grid { grid-template-columns: minmax(0, 1fr); gap: 14px; margin-bottom: 0; }
  .category-card {
    padding: 0;
    text-align: left;
    background: var(--color-surface);
    border-radius: var(--mobile-card-radius);

    a {
      display: grid;
      grid-template-columns: 52px minmax(0, 1fr) 20px;
      align-items: center;
      gap: 16px;
      min-height: 95px;
      padding: 16px;
      border-radius: inherit;
    }

    a:focus-visible { outline: 2px solid var(--color-accent-readable); outline-offset: 3px; }
  }
  .category-icon {
    width: 52px;
    height: 52px;
    margin: 0;
    border-radius: var(--mobile-control-radius);
    background: var(--color-accent-soft);
    color: var(--color-accent-readable);
  }
  .category-card:nth-child(4n + 2) .category-icon { background: var(--color-info-soft); }
  .category-card:nth-child(4n + 3) .category-icon { background: var(--color-success-soft); }
  .category-card:nth-child(4n + 4) .category-icon { background: var(--color-warning-soft); }
  .category-copy { min-width: 0; }
  .category-name { margin: 0; line-height: 1.5; overflow-wrap: anywhere; }
  .category-desc {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    overflow-wrap: anywhere;
    min-height: 0;
    margin: 6px 0 0;
    font-size: 13px;
    line-height: 1.5;
  }
  .category-count { display: none; }
  .category-arrow { color: var(--color-text-secondary); }
}
</style>
