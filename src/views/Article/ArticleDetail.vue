<template>
  <DefaultLayout>
    <div class="article-detail-page">
      <el-skeleton :rows="10" animated v-if="loading" />

      <div class="article-content-wrapper" v-else-if="article">
        <!-- 文章头部 -->
        <div class="article-header">
          <el-button text @click="$router.back()" class="back-btn">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>

          <h1 class="article-title">{{ article.title }}</h1>

          <div class="article-meta">
            <span class="meta-item">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(article.publishTime ?? article.createTime ?? '') }}
            </span>
            <span class="meta-item">
              <el-icon><View /></el-icon>
              {{ article.viewCount ?? 0 }} 阅读
            </span>
            <span class="meta-item">
              <el-icon><ChatDotRound /></el-icon>
              {{ article.commentCount ?? 0 }} 评论
            </span>
          </div>
        </div>

        <!-- 文章内容：优先后端 contentHtml，否则用 MdPreview 渲染 Markdown -->
        <div class="article-body">
          <div v-if="article.contentHtml" class="markdown-content" v-html="article.contentHtml"></div>
          <MdPreview v-else :model-value="article.content ?? ''" :theme="previewTheme" class="markdown-preview" />
        </div>

        <!-- 文章标签 -->
        <div class="article-tags" v-if="article.tags?.length">
          <span
            v-for="tag in article.tags"
            :key="tag.id"
            class="tag"
            :style="{ backgroundColor: (tag.color || '#fb7299') + '20', color: tag.color || '#fb7299' }"
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

      <!-- 文章不存在 -->
      <div v-else class="article-not-found">
        <p>文章不存在或已被删除</p>
        <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft, Calendar, View, ChatDotRound } from '@element-plus/icons-vue';
import { MdPreview } from 'md-editor-v3';
import 'md-editor-v3/lib/preview.css';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import type { Article } from '@/types';
import { formatDate } from '@/utils/format';
import { getArticleById, getArticleNeighbors } from '@/api/article';

const route = useRoute();
const loading = ref(true);
const article = ref<Article | null>(null);
const prevArticle = ref<{ id: number | string; title: string } | null>(null);
const nextArticle = ref<{ id: number | string; title: string } | null>(null);

const previewTheme = computed(() => {
  return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
});

// 加载文章详情与上一篇/下一篇（对接 GET /api/articles/:id 与 GET /api/articles/:id/neighbors）
// id 使用 string 传递，避免后端 Long 在 JSON 中超出 JS 安全整数导致精度丢失
const loadArticle = async () => {
  const id = route.params.id as string;
  if (!id) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const [articleRes, neighborsRes] = await Promise.all([
      getArticleById(id, true),
      getArticleNeighbors(id),
    ]);
    article.value = articleRes ?? null;
    if (neighborsRes?.prev) {
      prevArticle.value = { id: neighborsRes.prev.id, title: neighborsRes.prev.title };
    } else {
      prevArticle.value = null;
    }
    if (neighborsRes?.next) {
      nextArticle.value = { id: neighborsRes.next.id, title: neighborsRes.next.title };
    } else {
      nextArticle.value = null;
    }
  } catch (err) {
    console.error('加载文章失败', err);
    article.value = null;
    prevArticle.value = null;
    nextArticle.value = null;
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
  padding-top: 40px;
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

.article-not-found {
  text-align: center;
  padding: 64px 24px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);

  p {
    color: var(--text-secondary);
    margin: 0 0 20px;
    font-size: 16px;
  }
}

.markdown-preview {
  :deep(.md-editor-preview-wrapper) {
    padding: 0;
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
