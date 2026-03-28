<template>
  <DefaultLayout>
    <div class="article-detail-page">
      <el-skeleton :rows="10" animated v-if="loading" />

      <div class="article-content-wrapper" v-else-if="article">
        <!-- 文章头部 -->
        <div class="article-header">
          <div class="header-actions">
            <el-button text @click="$router.back()" class="back-btn">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <el-button
              v-if="article.canEdit"
              text
              type="primary"
              @click="router.push(`/article/edit/${article.id}`)"
              class="edit-btn"
            >
              编辑文章
            </el-button>
          </div>

          <h1 class="article-title">{{ renderedArticleTitle }}</h1>

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

          <div class="article-interactions">
            <button
              type="button"
              class="interaction-btn like-btn"
              :class="{ active: article.liked }"
              :disabled="likeLoading"
              @click="handleArticleLike"
            >
              <span class="heart-icon" aria-hidden="true">♥</span>
              <span>{{ article.likeCount ?? 0 }}</span>
            </button>
            <button
              v-if="userStore.isLoggedIn"
              type="button"
              class="interaction-btn fav-btn"
              :class="{ active: article.favorited }"
              :disabled="favLoading"
              @click="handleArticleFavorite"
            >
              <el-icon><StarFilled v-if="article.favorited" /><Star v-else /></el-icon>
              <span>{{ article.favorited ? '已收藏' : '收藏' }}</span>
            </button>
            <button
              v-else
              type="button"
              class="interaction-btn fav-btn"
              @click="promptLoginForFavorite"
            >
              <el-icon><Star /></el-icon>
              <span>收藏</span>
            </button>
          </div>
        </div>

        <!-- 文章内容：优先后端 contentHtml，否则用 MdPreview 渲染 Markdown -->
        <div class="article-body">
          <div v-if="article.contentHtml" class="markdown-content" v-html="renderedContentHtml"></div>
          <MdPreview v-else :model-value="renderedMarkdownContent" :theme="previewTheme" class="markdown-preview" />
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

        <!-- 评论区 -->
        <CommentSection
          :article-id="article.id"
          :can-comment="article.canComment ?? false"
          :comment-policy="article.commentPolicy ?? 0"
        />
      </div>

      <!-- 文章不存在 -->
      <div v-else class="article-not-found">
        <p>{{ errorMessage }}</p>
        <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Calendar, View, ChatDotRound, Star, StarFilled } from '@element-plus/icons-vue';
import { MdPreview } from 'md-editor-v3';
import 'md-editor-v3/lib/preview.css';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import CommentSection from '@/components/Comment/CommentSection.vue';
import type { Article } from '@/types';
import { formatDate } from '@/utils/format';
import { getArticleById, getArticleNeighbors, likeArticle, toggleArticleFavorite } from '@/api/article';
import { renderArticleText } from '@/emoji/renderers/articleRenderer';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const loading = ref(true);
const likeLoading = ref(false);
const favLoading = ref(false);
const article = ref<Article | null>(null);
const prevArticle = ref<{ id: number | string; title: string } | null>(null);
const nextArticle = ref<{ id: number | string; title: string } | null>(null);
const errorMessage = ref('文章不存在或已被删除');

const previewTheme = computed(() => {
  return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
});

const renderedArticleTitle = computed(() => {
  return renderArticleText(article.value?.title ?? '');
});

const renderedMarkdownContent = computed(() => {
  return renderArticleText(article.value?.content ?? '');
});

const renderedContentHtml = computed(() => {
  return renderArticleText(article.value?.contentHtml ?? '');
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
    const status = (err as any)?.response?.status;
    errorMessage.value = status === 403 ? '当前文章仅对特定用户开放' : '文章不存在或已被删除';
    article.value = null;
    prevArticle.value = null;
    nextArticle.value = null;
  } finally {
    loading.value = false;
  }
};

const handleArticleLike = async () => {
  if (!article.value || likeLoading.value) return;
  likeLoading.value = true;
  try {
    const res = await likeArticle(article.value.id);
    article.value.likeCount = res.likes;
    if (typeof res.liked === 'boolean') {
      article.value.liked = res.liked;
    }
  } catch {
    // 错误提示由 axios 拦截器统一展示（避免与拦截器各弹一次）
  } finally {
    likeLoading.value = false;
  }
};

const handleArticleFavorite = async () => {
  if (!article.value || favLoading.value || !userStore.isLoggedIn) return;
  favLoading.value = true;
  try {
    const res = await toggleArticleFavorite(article.value.id);
    article.value.favorited = res.favorited;
  } catch {
    ElMessage.error('收藏失败，请确认已登录');
  } finally {
    favLoading.value = false;
  }
};

const promptLoginForFavorite = () => {
  ElMessage.info('请先登录后再收藏');
  router.push({ path: '/login', query: { redirect: route.fullPath } });
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

.header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.back-btn {
  padding: 0;
  color: var(--text-secondary);

  &:hover {
    color: var(--primary);
  }
}

.edit-btn {
  padding: 0;
}

.article-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 16px 0;
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

.article-interactions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.interaction-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: color-mix(in srgb, var(--bg-primary) 88%, transparent);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;

  &:hover:not(:disabled) {
    border-color: rgba(251, 114, 153, 0.45);
    color: var(--primary);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  &.like-btn.active {
    color: var(--primary);
    border-color: rgba(251, 114, 153, 0.5);
    background: rgba(251, 114, 153, 0.08);
  }

  &.fav-btn.active {
    color: var(--primary);
    border-color: rgba(251, 114, 153, 0.5);
  }

  .heart-icon {
    font-size: 16px;
    line-height: 1;
  }
}

.article-body {
  margin-bottom: 32px;
}

.markdown-content {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);

  :deep(img) {
    max-width: min(100%, 720px);
    height: auto;
    display: block;
    margin: 24px auto;
    border-radius: 12px;
  }

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

  :deep(img) {
    max-width: min(100%, 720px);
    height: auto;
    display: block;
    margin: 24px auto;
    border-radius: 12px;
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
