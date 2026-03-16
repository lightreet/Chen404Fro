<template>
  <DefaultLayout>
    <div class="article-detail-page">
      <el-skeleton :rows="10" animated v-if="loading" />

      <div class="article-content-wrapper" v-else>
        <!-- 文章头部 -->
        <div class="article-header">
          <el-button text @click="$router.back()" class="back-btn">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>

          <h1 class="article-title">{{ article?.title || '文章标题' }}</h1>

          <div class="article-meta">
            <span class="meta-item">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(article?.publishTime) }}
            </span>
            <span class="meta-item">
              <el-icon><View /></el-icon>
              {{ article?.viewCount || 0 }} 阅读
            </span>
            <span class="meta-item">
              <el-icon><ChatDotRound /></el-icon>
              {{ article?.commentCount || 0 }} 评论
            </span>
          </div>
        </div>

        <!-- 文章内容 -->
        <div class="article-body">
          <div class="markdown-content" v-html="renderedContent"></div>
        </div>

        <!-- 文章标签 -->
        <div class="article-tags" v-if="article?.tags?.length">
          <span
            v-for="tag in article.tags"
            :key="tag.id"
            class="tag"
            :style="{ backgroundColor: tag.color + '20', color: tag.color }"
          >
            {{ tag.name }}
          </span>
        </div>

        <!-- 上一篇/下一篇 -->
        <div class="article-nav">
          <div class="nav-item prev" v-if="prevArticle">
            <span class="nav-label">上一篇</span>
            <router-link :to="`/article/${prevArticle.id}`">{{ prevArticle.title }}</router-link>
          </div>
          <div class="nav-item next" v-if="nextArticle">
            <span class="nav-label">下一篇</span>
            <router-link :to="`/article/${nextArticle.id}`">{{ nextArticle.title }}</router-link>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft, Calendar, View, ChatDotRound } from '@element-plus/icons-vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import type { Article } from '@/types';
import { formatDate } from '@/utils/format';
import { generateMockArticles } from '@/utils/mock';

const route = useRoute();
const loading = ref(true);
const article = ref<Article | null>(null);
const prevArticle = ref<{ id: number; title: string } | null>(null);
const nextArticle = ref<{ id: number; title: string } | null>(null);

// 模拟渲染的 Markdown 内容
const renderedContent = computed(() => {
  return `
    <p>这是一篇示例文章内容。在实际项目中，这里将显示 Markdown 渲染后的 HTML 内容。</p>
    <h2>文章正文</h2>
    <p>文章内容会在这里展示，包括代码块、图片、列表等各种 Markdown 元素。</p>
    <pre><code class="language-typescript">const greeting = "Hello, Chen404!";
console.log(greeting);</code></pre>
    <p>更多内容...</p>
  `;
});

// 加载文章
const loadArticle = async () => {
  loading.value = true;

  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const id = parseInt(route.params.id as string);
    const articles = generateMockArticles(1, 10);
    article.value = articles.find(a => a.id === id) || articles[0];

    // 模拟上一篇/下一篇
    prevArticle.value = { id: id - 1, title: '上一篇文章的标题示例' };
    nextArticle.value = { id: id + 1, title: '下一篇文章的标题示例' };
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadArticle();
});
</script>

<style scoped lang="scss">
.article-detail-page {
  padding-top: 24px;
}

.article-content-wrapper {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 32px;
}

.article-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.back-btn {
  margin-bottom: 16px;
  padding: 0;
  color: var(--text-secondary);

  &:hover {
    color: var(--primary);
  }
}

.article-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.article-body {
  margin-bottom: 32px;
}

.markdown-content {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);

  :deep(h2) {
    font-size: 24px;
    margin: 32px 0 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--primary);
  }

  :deep(p) {
    margin: 16px 0;
  }

  :deep(pre) {
    background: #282c34;
    border-radius: var(--radius-md);
    padding: 16px;
    overflow-x: auto;

    code {
      color: #abb2bf;
      font-family: var(--font-mono);
    }
  }
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--border-color);
}

.tag {
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    opacity: 0.8;
    transform: translateY(-1px);
  }
}

.article-nav {
  display: flex;
  justify-content: space-between;
  gap: 24px;
}

.nav-item {
  flex: 1;

  &.next {
    text-align: right;
  }
}

.nav-label {
  display: block;
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
}

.nav-item a {
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 500;

  &:hover {
    color: var(--primary);
  }
}

@media (max-width: 768px) {
  .article-content-wrapper {
    padding: 20px;
  }

  .article-title {
    font-size: 22px;
  }

  .article-meta {
    flex-wrap: wrap;
    gap: 12px;
  }

  .article-nav {
    flex-direction: column;

    .nav-item.next {
      text-align: left;
    }
  }
}
</style>
