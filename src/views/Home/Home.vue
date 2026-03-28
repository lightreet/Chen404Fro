<template>
  <DefaultLayout>
    <!-- 全宽 Hero：背景图 + 遮罩 + 居中标语 + 底部波浪 -->
    <template #hero>
      <section class="home-hero" data-hero>
        <div class="hero-bg" />
        <div class="hero-overlay" />
        <div class="hero-fade" aria-hidden="true" />
        <div class="hero-content">
          <h1 class="hero-title">
            Hi，<span class="hero-accent">Chen404</span> 的小站
          </h1>
          <p class="hero-slogan">「 记录技术、生活与想法，欢迎来玩 ~ 」</p>
        </div>
        <div class="hero-wave" aria-hidden="true">
          <HeroWave color="white" :height="92" :intensity="1.08" />
        </div>
        <a href="#discovery" class="hero-scroll-hint" aria-label="向下滚动">
          <span class="hero-scroll-chevron">↓</span>
        </a>
      </section>
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

      <!-- 文章列表 -->
      <div class="article-list">
        <ArticleCard
          v-for="(article, index) in articleList"
          :key="article.id"
          :article="article"
          :index="index"
        />
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-if="!loading && articleList.length === 0">
        <p>{{ activeKeyword ? '没有找到匹配标题的文章 ~' : '暂无文章，快去写一篇吧 ~' }}</p>
      </div>

      <!-- 加载更多 -->
      <div class="load-more" v-if="hasMore">
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
      <div class="no-more" v-else-if="articleList.length > 0">
        <el-divider>
          <span class="no-more-text">已经到底啦 ~</span>
        </el-divider>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Compass } from '@element-plus/icons-vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import ArticleCard from '@/components/ArticleCard/ArticleCard.vue';
import HeroWave from '@/components/HeroWave/HeroWave.vue';
import HomeDiscoverySearch from '@/components/HomeDiscoverySearch/HomeDiscoverySearch.vue';
import type { Article } from '@/types';
import { getArticles } from '@/api/article';

const pageSize = 6;

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

// 加载文章列表（仅已发布文章，对接后端 GET /api/articles；keyword 仅匹配标题）
const loadArticles = async (page: number = 1) => {
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
  currentPage.value++;
  loadArticles(currentPage.value);
};

onMounted(() => {
  loadArticles();
});
</script>

<style scoped lang="scss">
/* ========== 全宽 Hero：背景图 + 遮罩 + 标语 + 波浪 ========== */
.home-hero {
  /* 默认使用 Unsplash 樱花粉风格图（可替换为本地 public/hero-bg.jpg 或其它 URL） */
  --hero-bg-image: url('https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1920&q=80');
  position: relative;
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  padding: calc(64px + 2rem) 1.5rem 5rem;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background-image: var(--hero-bg-image), linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* 可选：点阵纹理叠加（参考图效果） */
.hero-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.55) 100%);
  pointer-events: none;
}

.hero-fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 228px;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0) 20%,
    var(--bg-primary) 100%
  );
  filter: blur(0.2px);
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 720px;
}

.hero-title {
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.75rem;
  letter-spacing: 0.02em;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
}

.hero-accent {
  color: #ff9eb3;
  font-weight: 700;
}

.hero-slogan {
  font-size: clamp(0.95rem, 2.5vw, 1.15rem);
  color: rgba(255, 255, 255, 0.92);
  margin: 0;
  line-height: 1.6;
  font-weight: 400;
}

.hero-wave {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 92px;
  z-index: 1;
  line-height: 0;
}

.hero-scroll-hint {
  position: absolute;
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 1.25rem;
  transition: transform 0.2s;

  &:hover {
    color: #fff;
    transform: translateX(-50%) translateY(4px);
  }
}

.hero-scroll-chevron {
  display: block;
  animation: hero-bounce 2s ease-in-out infinite;
}

@keyframes hero-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}

@media (max-width: 768px) {
  .home-hero {
    min-height: 60vh;
    padding: calc(64px + 1.5rem) 1rem 4rem;
  }
}

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
  margin-bottom: 24px;
  padding: 0 4px;
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
  margin: -8px 4px 16px;
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

// 文章列表
.article-list {
  margin-bottom: 32px;
}

.empty-state {
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
</style>
