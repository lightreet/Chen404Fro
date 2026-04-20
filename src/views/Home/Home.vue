<template>
  <DefaultLayout>
    <template #hero>
      <PageHero
        title="Hi，Chen404 的小站"
        highlight-text="Chen404"
        subtitle="「 记录技术、生活与想法，欢迎来玩 ~ 」"
        :bg-image="heroBgImage"
        min-height="80vh"
        scroll-target="#discovery"
      />
    </template>

    <div class="home-page">
      <!-- Discovery 标题与搜索同一行 -->
      <div id="discovery" class="discovery-head">
        <div class="jp-section-title section-header discovery-head__title">
          <el-icon class="jp-section-icon"><Compass /></el-icon>
          <h2 class="!m-0">Discovery</h2>
        </div>
        <HomeDiscoverySearch
          :model-value="searchDraft"
          :expanded="searchExpanded"
          @update:model-value="searchDraft = $event"
          @update:expanded="searchExpanded = $event"
          @search="handleSearchSubmit"
        />
      </div>

      <p v-if="activeKeyword" class="search-active-hint">
        <span>标题包含「{{ activeKeyword }}」</span>
        <button type="button" class="search-clear" @click="clearTitleSearch">清除</button>
      </p>

      <!-- 文章列表（滚动时视口垂直中心附近的卡片会「漂浮」高亮） -->
      <div ref="articleListRef" class="article-list">
        <ArticleCard
          v-for="(article, index) in articleList"
          :key="article.id"
          :article="article"
          :index="index"
          :cover-priority="index < 2"
          :disable-hover-lift="true"
          :scroll-float-strength="scrollFloatById[String(article.id)] ?? 0"
          :scroll-wheel-phase="scrollWheelPhaseById[String(article.id)] ?? 0"
        />
      </div>

      <div
        v-if="articleList.length > 0 && hasMore"
        ref="loadTriggerRef"
        class="infinite-trigger"
        aria-hidden="true"
      />

      <!-- 空状态 -->
      <div class="empty-state" v-if="!loading && articleList.length === 0">
        <p>{{ activeKeyword ? '没有找到匹配标题的文章 ~' : '暂无文章，快去写一篇吧 ~' }}</p>
      </div>

      <!-- 加载更多 -->
      <div class="load-more" v-if="false && hasMore">
        <el-button
          type="primary"
          :loading="loading"
          @click="loadMore"
          class="jp-btn-primary !border-0"
        >
          {{ loading ? '加载中...' : '加载更多' }}
        </el-button>
      </div>

      <!-- 没有更多了 -->
      <div class="loading-state" v-else-if="loading && articleList.length > 0">
        <span>加载中...</span>
      </div>

      <div class="no-more" v-else-if="articleList.length > 0">
        <el-divider>
          <span class="no-more-text">已经到底啦 ~</span>
        </el-divider>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Compass } from '@element-plus/icons-vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import ArticleCard from '@/components/ArticleCard/ArticleCard.vue';
import HomeDiscoverySearch from '@/components/HomeDiscoverySearch/HomeDiscoverySearch.vue';
import PageHero from '@/components/PageHero/PageHero.vue';
import { useSiteConfig } from '@/composables/useSiteConfig';
import type { Article } from '@/types';
import { getArticles } from '@/api/article';

const pageSize = 6;
const DEFAULT_HOME_HERO =
  'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1920&q=80';

// 文章列表
const articleList = ref<Article[]>([]);
const currentPage = ref(1);
const total = ref(0);
const loading = ref(false);
const hasMore = ref(true);

/** 标题搜索：已生效的关键词（回车后提交） */
const activeKeyword = ref('');
const searchDraft = ref('');
const searchExpanded = ref(false);
const heroBgImage = ref(DEFAULT_HOME_HERO);
const { loadSiteConfig } = useSiteConfig();

/**
 * 首页「摩天轮」滚动：strength 距中心衰减；phase = (cardMidY - midY) / R，上负下正。
 * key 与 data-article-id 一致（String(article.id)）
 */
const scrollFloatById = ref<Record<string, number>>({});
const scrollWheelPhaseById = ref<Record<string, number>>({});
const articleListRef = ref<HTMLElement | null>(null);
const loadTriggerRef = ref<HTMLElement | null>(null);
let scrollRaf = 0;
let loadObserver: IntersectionObserver | null = null;

/** 略收紧半径，相邻卡片 strength 对比更强 */
const SCROLL_FLOAT_R_VH = 0.52;
/** 远处更快「落地」，中心更突出 */
const SCROLL_FLOAT_CURVE = 0.68;

function computeScrollWheelState(): {
  strengths: Record<string, number>;
  phases: Record<string, number>;
} {
  const root = articleListRef.value;
  if (!root) {
    return { strengths: {}, phases: {} };
  }
  const cards = root.querySelectorAll<HTMLElement>('[data-article-id]');
  if (!cards.length) {
    return { strengths: {}, phases: {} };
  }

  const vh = window.innerHeight;
  const midY = vh * 0.5;
  const R = Math.max(240, vh * SCROLL_FLOAT_R_VH);

  const raw = new Map<string, { s: number; phase: number }>();
  let minDist = Infinity;
  let minId: string | null = null;

  cards.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const id = el.dataset.articleId;
    if (id == null || id === '') return;
    const cardMidY = r.top + r.height / 2;
    const d = Math.abs(cardMidY - midY);
    const s = Math.max(0, 1 - d / R);
    const phase = Math.max(-1, Math.min(1, (cardMidY - midY) / R));
    raw.set(id, { s, phase });
    if (d < minDist) {
      minDist = d;
      minId = id;
    }
  });

  if (minId != null) {
    const row = raw.get(minId);
    if (row) row.s = 1;
  }

  const strengths: Record<string, number> = {};
  const phases: Record<string, number> = {};
  raw.forEach((row, id) => {
    const curved = Math.pow(Math.min(1, Math.max(0, row.s)), SCROLL_FLOAT_CURVE);
    strengths[id] = Math.round(curved * 1000) / 1000;
    phases[id] = Math.round(row.phase * 1000) / 1000;
  });
  return { strengths, phases };
}

function scheduleCenterUpdate() {
  if (scrollRaf) cancelAnimationFrame(scrollRaf);
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0;
    const { strengths, phases } = computeScrollWheelState();
    scrollFloatById.value = strengths;
    scrollWheelPhaseById.value = phases;
  });
}

// 加载文章列表（仅已发布文章，对接后端 GET /api/articles；keyword 仅匹配标题）
const loadArticles = async (page: number = 1) => {
  currentPage.value = page;
  loading.value = true;
  try {
    const kw = activeKeyword.value.trim();
    const res = await getArticles({
      page,
      size: pageSize,
      status: 1, // 仅已发布
      ...(kw ? { keyword: kw } : {}),
    });
    const list = res?.list ?? [];
    const totalCount = res?.total ?? 0;

    if (page === 1) {
      articleList.value = list;
    } else {
      articleList.value.push(...list);
    }
    total.value = totalCount;
    hasMore.value = articleList.value.length < totalCount;
  } catch (err) {
    console.error('加载文章列表失败', err);
    ElMessage.error('加载文章列表失败，请稍后重试');
    if (currentPage.value === 1) {
      hasMore.value = false;
    }
  } finally {
    loading.value = false;
    void nextTick(() => scheduleCenterUpdate());
  }
};

function handleSearchSubmit(raw: string) {
  const q = raw.trim();
  activeKeyword.value = q;
  searchExpanded.value = false;
  currentPage.value = 1;
  void loadArticles(1);
}

function clearTitleSearch() {
  activeKeyword.value = '';
  searchDraft.value = '';
  searchExpanded.value = false;
  currentPage.value = 1;
  void loadArticles(1);
}

// 加载更多
const loadMore = () => {
  if (loading.value || !hasMore.value) return;
  void loadArticles(currentPage.value + 1);
};

function teardownLoadObserver() {
  if (!loadObserver) return;
  loadObserver.disconnect();
  loadObserver = null;
}

function setupLoadObserver() {
  teardownLoadObserver();
  if (!loadTriggerRef.value) return;

  loadObserver = new IntersectionObserver(
    (entries) => {
      if (!entries[0]?.isIntersecting) return;
      loadMore();
    },
    {
      root: null,
      rootMargin: '0px 0px 320px 0px',
      threshold: 0,
    }
  );

  loadObserver.observe(loadTriggerRef.value);
}

onMounted(() => {
  void loadSiteConfig(true).then((config) => {
    heroBgImage.value = config.heroImages?.home || DEFAULT_HOME_HERO;
  });
  void loadArticles(1);
  window.addEventListener('scroll', scheduleCenterUpdate, { passive: true });
  window.addEventListener('resize', scheduleCenterUpdate, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', scheduleCenterUpdate);
  window.removeEventListener('resize', scheduleCenterUpdate);
  if (scrollRaf) cancelAnimationFrame(scrollRaf);
  teardownLoadObserver();
});

watch(
  () => articleList.value.length,
  () => {
    void nextTick(() => scheduleCenterUpdate());
  }
);

watch(loading, (v) => {
  if (!v) void nextTick(() => scheduleCenterUpdate());
});

watch(
  () => [articleList.value.length, hasMore.value, loading.value],
  () => {
    void nextTick(() => {
      if (articleList.value.length > 0 && hasMore.value) {
        setupLoadObserver();
      } else {
        teardownLoadObserver();
      }
    });
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
/* ========== 首页正文 ========== */
.home-page {
  padding-top: 24px;
}

.discovery-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  width: min(100%, 860px);
  margin: 0 auto 18px;
  padding: 0 8px;
}

.discovery-head__title.section-header {
  margin-bottom: 0;
  flex: 1;
  min-width: 200px;

  h2 {
    position: relative;
  }

  h2::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 40px;
    height: 3px;
    background: linear-gradient(90deg, var(--primary), var(--primary-light));
    border-radius: 2px;
  }
}

.search-active-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  width: min(100%, 860px);
  margin: -2px auto 16px;
  padding: 0 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.search-clear {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: var(--primary);
  font-size: 13px;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    opacity: 0.85;
  }
}

// 文章列表：perspective 增强纵深感；padding 减少阴影裁切
.article-list {
  display: flex;
  flex-direction: column;
  gap: 44px;
  width: min(100%, 860px);
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 32px;
  position: relative;
  padding-top: 8px;
  padding-bottom: 12px;
  perspective: 1500px;
  perspective-origin: 50% 42%;

  > .article-card {
    margin-bottom: 0;
  }
}

.empty-state {
  width: min(100%, 860px);
  margin: 0 auto;
  text-align: center;
  padding: 48px 24px;
  color: var(--text-tertiary);
  font-size: 15px;
}

// 加载更多
.load-more {
  text-align: center;
  padding: 24px 0;
}

/* 加载更多按钮使用 UnoCSS jp-btn-primary */

// 没有更多了
.no-more {
  padding: 24px 0;

  .no-more-text {
    color: var(--text-tertiary);
    font-size: 14px;
  }
}

// 响应式
@media (max-width: 768px) {
  .home-page {
    padding-top: 16px;
  }

  .discovery-head {
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 20px;
  }
}

@media (max-width: 1024px) {
  .home-page {
    padding-top: 16px;
  }
}
.loading-state {
  width: min(100%, 860px);
  margin: 0 auto;
  text-align: center;
  padding: 24px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.infinite-trigger {
  width: 100%;
  height: 1px;
}
</style>
