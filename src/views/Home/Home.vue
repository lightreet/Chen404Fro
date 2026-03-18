<template>
  <DefaultLayout>
    <!-- 全宽 Hero：背景图 + 遮罩 + 居中标语 + 底部波浪 -->
    <template #hero>
      <section ref="heroRef" id="hero-sakura" class="home-hero" data-hero>
        <div class="hero-bg" />
        <div class="hero-overlay" />
        <div class="hero-content">
          <h1 class="hero-title">
            Hi，<span class="hero-accent">Chen404</span> 的小站
          </h1>
          <p class="hero-slogan">「 记录技术、生活与想法，欢迎来玩 ~ 」</p>
        </div>
        <div class="hero-wave" aria-hidden="true">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="var(--bg-primary)"/>
          </svg>
        </div>
        <a href="#discovery" class="hero-scroll-hint" aria-label="向下滚动">
          <span class="hero-scroll-chevron">↓</span>
        </a>
      </section>
    </template>

    <div class="home-page">
      <!-- Discovery 标题 -->
      <div id="discovery" class="jp-section-title section-header">
        <el-icon class="jp-section-icon"><Compass /></el-icon>
        <h2 class="!m-0">Discovery</h2>
      </div>

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
        <p>暂无文章，快去写一篇吧 ~</p>
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
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Compass } from '@element-plus/icons-vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import ArticleCard from '@/components/ArticleCard/ArticleCard.vue';
import type { Article } from '@/types';
import { getArticles } from '@/api/article';

const pageSize = 6;
const heroRef = ref<HTMLElement | null>(null);
let sakuraInstance: { stop: (graceful?: boolean) => void } | null = null;
let sakuraLink: HTMLLinkElement | null = null;
let sakuraScript: HTMLScriptElement | null = null;

// 文章列表
const articleList = ref<Article[]>([]);
const currentPage = ref(1);
const total = ref(0);
const loading = ref(false);
const hasMore = ref(true);

// 加载文章列表（仅已发布文章，对接后端 GET /api/articles）
const loadArticles = async (page: number = 1) => {
  loading.value = true;
  try {
    const res = await getArticles({
      page,
      size: pageSize,
      status: 1, // 仅已发布
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

// 加载更多
const loadMore = () => {
  if (loading.value || !hasMore.value) return;
  currentPage.value++;
  loadArticles(currentPage.value);
};

onMounted(() => {
  loadArticles();
  // 樱花飘落特效：动态加载 sakura-js（仅 Hero 区域），样式与主题粉一致
  if (!document.getElementById('hero-sakura')) return;
  sakuraLink = document.createElement('link');
  sakuraLink.rel = 'stylesheet';
  sakuraLink.href = '/sakura.min.css';
  document.head.appendChild(sakuraLink);
  sakuraScript = document.createElement('script');
  sakuraScript.src = '/sakura.min.js';
  sakuraScript.async = true;
  sakuraScript.onload = () => {
    const Sakura = (window as unknown as { Sakura: new (s: string, o?: object) => { stop: (g?: boolean) => void } }).Sakura;
    if (typeof Sakura !== 'function') return;
    sakuraInstance = new Sakura('#hero-sakura', {
      fallSpeed: 1.5,
      minSize: 8,
      maxSize: 16,
      delay: 200,
      colors: [
        { gradientColorStart: 'rgba(255, 183, 197, 0.85)', gradientColorEnd: 'rgba(255, 197, 208, 0.85)', gradientColorDegree: 120 },
        { gradientColorStart: 'rgba(255, 189, 189, 0.9)', gradientColorEnd: 'rgba(227, 170, 181, 0.9)', gradientColorDegree: 120 },
      ],
    });
  };
  document.body.appendChild(sakuraScript);
});

onUnmounted(() => {
  if (sakuraInstance) {
    sakuraInstance.stop(true);
    sakuraInstance = null;
  }
  if (sakuraLink?.parentNode) sakuraLink.parentNode.removeChild(sakuraLink);
  sakuraLink = null;
  if (sakuraScript?.parentNode) sakuraScript.parentNode.removeChild(sakuraScript);
  sakuraScript = null;
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
  height: 60px;
  z-index: 1;
  line-height: 0;

  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
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

/* 樱花花瓣在标语和波浪之下，避免遮挡文字 */
.home-hero :deep(.sakura) {
  z-index: 0;
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

// 区块标题（UnoCSS jp-section-title 已提供基础样式，此处仅保留下划线与间距）
.section-header {
  margin-bottom: 24px;
  padding: 0 4px;

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

  .section-header {
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
