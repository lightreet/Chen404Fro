<template>
  <DefaultLayout>
    <template #hero>
      <PageHero
        title="分类"
        eyebrow="Category"
        subtitle="按主题浏览内容，把零散文章组织成更清晰的知识地图。"
        :bg-image="heroBgImage"
        bg-position="center 40%"
        min-height="320px"
        :overlay-opacity="0.5"
        compact
      >
        <template #meta>
          <div class="hero-meta">
            <span class="hero-stat">{{ categories.length }} 个分类</span>
          </div>
        </template>
      </PageHero>
    </template>

    <div class="category-page">
      <!-- 加载中 -->
      <div v-if="loading" class="loading-state">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中…</p>
      </div>

      <!-- 分类网格：首屏 9 个，加载更多每次 +9 -->
      <template v-else>
        <div class="categories-grid">
          <div
            v-for="category in displayedCategories"
            :key="category.id"
            class="category-card jp-card jp-card-hover"
          >
            <router-link :to="`/category/${category.id}`">
              <div class="category-icon">
                <Icon
                  :icon="resolveCategoryIcon(category.icon || 'mdi:folder-open')"
                  width="28"
                  height="28"
                />
              </div>
              <h3 class="category-name">{{ category.name }}</h3>
              <p class="category-desc">{{ category.description || '暂无描述' }}</p>
              <span class="category-count">{{ (category.articleCount ?? 0) }} 篇文章</span>
            </router-link>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="categories.length === 0" class="empty-state">
          <p>暂无分类</p>
        </div>

        <!-- 加载更多 -->
        <div v-else-if="hasMore" class="load-more">
          <el-button class="jp-btn-primary !border-0" @click="loadMore">
            加载更多
          </el-button>
        </div>

        <!-- 没有更多了 -->
        <div v-else-if="categories.length > 0" class="no-more">
          <el-divider>
            <span class="no-more-text">已经到底啦 ~</span>
          </el-divider>
        </div>
      </template>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { resolveCategoryIcon } from '@/utils/categoryIcon';
import { Icon } from '@iconify/vue';
import { Loading } from '@element-plus/icons-vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import PageHero from '@/components/PageHero/PageHero.vue';
import { useSiteConfig } from '@/composables/useSiteConfig';
import type { Category } from '@/types';
import { getCategories } from '@/api/article';

const pageSize = 9;
const DEFAULT_CATEGORY_HERO =
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1920&q=80';

const categories = ref<Category[]>([]);
const displayCount = ref(pageSize);
const loading = ref(true);
const heroBgImage = ref(DEFAULT_CATEGORY_HERO);
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
  try {
    const list = await getCategories(true);
    categories.value = list ?? [];
  } catch (err) {
    console.error('加载分类失败', err);
    ElMessage.error('加载分类失败，请稍后重试');
    categories.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  void loadSiteConfig(true).then((config) => {
    heroBgImage.value = config.heroImages?.category || DEFAULT_CATEGORY_HERO;
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
    animation: spin 1s linear infinite;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-tertiary);
  font-size: 15px;
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
</style>
