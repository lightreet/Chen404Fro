<template>
  <article
    class="article-card jp-card jp-card-hover"
    :class="[
      { 'image-left': isImageLeft, 'image-right': !isImageLeft },
      { compact },
      { 'manage-mode': mode === 'manage', 'has-cover': !!article.coverImage, 'no-cover': !article.coverImage },
    ]"
  >
    <div
      class="card-content"
      :class="{ 'is-clickable': mode !== 'manage' }"
      @click="mode !== 'manage' ? goToDetail() : undefined"
    >
      <!-- 日期与作者 -->
      <div class="article-meta">
        <el-icon class="meta-date-icon"><Calendar /></el-icon>
        <span>{{ formatDate(article.publishTime ?? article.createTime ?? '') }}</span>
        <template v-if="authorName">
          <span class="meta-sep">·</span>
          <el-icon class="author-icon"><User /></el-icon>
          <span class="author-name">{{ authorName }}</span>
        </template>
      </div>

      <!-- 标题 -->
      <h3 class="article-title">
        <router-link v-if="mode !== 'manage'" :to="articleDetailUrl" @click.stop>
          {{ article.title }}
        </router-link>
        <span v-else>{{ article.title }}</span>
      </h3>

      <!-- 统计信息 -->
      <div class="article-stats">
        <span class="stat-item">
          <el-icon><View /></el-icon>
          {{ formatNumber(article.viewCount ?? 0) }}
        </span>
        <span class="stat-item">
          <el-icon><ChatDotRound /></el-icon>
          {{ article.commentCount ?? 0 }}
        </span>
        <span class="stat-item category-tag" v-if="article.category">
          <Icon
            class="category-icon-iconify"
            :icon="article.category.icon || 'mdi:folder'"
            width="14"
            height="14"
          />
          {{ article.category.name }}
        </span>
        <template v-if="mode === 'manage'">
          <el-tag v-if="article.status === 0" type="info" size="small">草稿</el-tag>
          <el-tag v-else-if="article.status === 1" type="success" size="small">已发布</el-tag>
          <el-tag v-else type="warning" size="small">其他</el-tag>
        </template>
      </div>

      <!-- 摘要 -->
      <p class="article-summary">{{ article.summary || '暂无摘要' }}</p>

      <!-- 标签：统一 jp-chip 灰色系 -->
      <div class="article-tags" v-if="article.tags && article.tags.length > 0">
        <span
          v-for="tag in article.tags"
          :key="tag.id"
          class="tag jp-chip"
        >
          {{ tag.name }}
        </span>
      </div>

      <!-- 阅读详情 / 管理操作 -->
      <div class="article-action">
        <template v-if="mode === 'manage'">
          <el-button text type="primary" @click="$emit('edit', article.id)">编辑</el-button>
          <el-button text type="danger" @click="$emit('delete', article.id)">删除</el-button>
        </template>
        <router-link v-else :to="articleDetailUrl" class="read-more" @click.stop>
          <span>阅读详情</span>
          <el-icon><ArrowRight /></el-icon>
        </router-link>
      </div>
    </div>

    <!-- 封面图 -->
    <div class="card-image" v-if="article.coverImage">
      <router-link v-if="mode !== 'manage'" :to="`/article/${article.id}`" class="image-link">
        <img :src="article.coverImage" :alt="article.title" loading="lazy" />
        <div class="image-overlay"></div>
      </router-link>
      <div v-else class="image-link">
        <img :src="article.coverImage" :alt="article.title" loading="lazy" />
        <div class="image-overlay"></div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { Calendar, View, ChatDotRound, ArrowRight, User } from '@element-plus/icons-vue';
import type { Article } from '@/types';
import { formatDate, formatNumber } from '@/utils/format';

const router = useRouter();

defineEmits<{
  (e: 'edit', id: number | string): void;
  (e: 'delete', id: number | string): void;
}>();

interface Props {
  article: Article;
  index?: number;
  /** 管理态：显示状态与编辑/删除，否则显示阅读更多 */
  mode?: 'home' | 'manage';
  /** 紧凑态：缩小内边距与字号（用于个人中心列表） */
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  index: 0,
  mode: 'home',
  compact: false,
});

// 根据索引决定图片位置（奇数左，偶数右）
const isImageLeft = computed(() => props.index % 2 === 1);

// 文章详情页路径（首页/列表点击卡片或「阅读详情」跳转）
const articleDetailUrl = computed(() => `/article/${props.article.id}`);

const goToDetail = () => {
  router.push(articleDetailUrl.value);
};

// 作者名称：优先昵称，其次用户名
const authorName = computed(() => {
  const a = props.article.author;
  if (!a) return '';
  return (a.nickname && a.nickname.trim()) ? a.nickname.trim() : (a.username || '');
});
</script>

<style scoped lang="scss">
.article-card {
  display: flex;
  margin-bottom: 24px;
  /* 卡片视觉由 UnoCSS jp-card / jp-card-hover 提供 */

  // 图片在左
  &.image-left {
    flex-direction: row-reverse;

    .card-image {
      border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
    }
  }

  // 图片在右
  &.image-right {
    .card-image {
      border-radius: var(--radius-lg) 0 0 var(--radius-lg);
    }
  }
}

.article-card.manage-mode {
  align-items: stretch;
  overflow: hidden;

  &.image-left,
  &.image-right {
    flex-direction: row;
  }

  &.no-cover {
    .card-content {
      min-height: 210px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.92));
    }
  }
}

// 内容区（首页模式下整块可点击跳转详情）
.card-content {
  flex: 1;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  min-width: 0;

  &.is-clickable {
    cursor: pointer;
  }
}

// 紧凑态（个人中心等）
.article-card.compact {
  margin-bottom: 0;

  .card-content {
    padding: 18px 22px;
  }

  .article-meta {
    font-size: 12px;
    margin-bottom: 8px;
  }

  .article-title {
    font-size: 17px;
    margin-bottom: 10px;
  }

  .article-stats {
    gap: 12px;
    margin-bottom: 10px;
    font-size: 12px;
  }

  .article-summary {
    font-size: 13px;
    margin-bottom: 10px;
    -webkit-line-clamp: 2;
  }

  .article-tags {
    gap: 6px;
    margin-bottom: 10px;
  }

  .tag {
    padding: 2px 8px;
    font-size: 11px;
  }

  .read-more,
  .article-action .el-button {
    font-size: 13px;
  }

  .card-image {
    width: 280px;
  }
}

.article-card.compact.manage-mode {
  border: 1px solid rgba(226, 232, 240, 0.85);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);

  .card-content {
    padding: 22px 24px;
  }

  .article-meta {
    gap: 8px;
    margin-bottom: 10px;
  }

  .article-title {
    font-size: 20px;
    margin-bottom: 12px;
  }

  .article-stats {
    gap: 10px 14px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .article-summary {
    font-size: 14px;
    line-height: 1.75;
    margin-bottom: 14px;
    -webkit-line-clamp: 3;
  }

  .article-tags {
    margin-bottom: 14px;
  }

  .article-action {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-top: 12px;
    border-top: 1px dashed var(--border-light);
  }

  .article-action .el-button + .el-button {
    margin-left: 0;
  }

  .card-image {
    width: 250px;
    min-height: 210px;
    border-radius: 0;
    background: var(--bg-hover);

    .image-link,
    img {
      height: 100%;
    }
  }
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-tertiary);
  font-size: 13px;
  margin-bottom: 12px;

  .el-icon {
    font-size: 14px;
  }

  .meta-sep {
    margin: 0 2px;
    opacity: 0.7;
  }

  .meta-date-icon,
  .author-icon {
    color: var(--primary);
  }

  .author-icon {
    font-size: 14px;
    margin-right: 4px;
    vertical-align: middle;
  }

  .author-name {
    color: var(--text-secondary);
    font-weight: 500;
  }
}

.article-title {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
  margin: 0 0 16px;

  a {
    color: var(--text-primary);
    text-decoration: none;
    transition: color 0.3s;

    &:hover {
      color: var(--primary);
    }
  }
}

.article-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;

  .el-icon {
    font-size: 14px;
  }

  &.category-tag {
    /* 与评论等统计项统一为次要文字色 */
    color: inherit;
    cursor: pointer;

    .category-icon-iconify {
      flex-shrink: 0;
      vertical-align: middle;
    }

    &:hover {
      text-decoration: underline;
    }
  }
}

.article-summary {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-secondary);
  margin: 0 0 16px;
  flex: 1;

  // 多行截断
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.tag {
  transition: opacity 0.2s;
  cursor: pointer;
  /* 基础样式由 jp-chip 提供 */
  &:hover {
    opacity: 0.85;
  }
}

.article-action {
  margin-top: auto;
}

.read-more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--primary);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s;

  .el-icon {
    transition: transform 0.3s;
  }

  &:hover {
    color: var(--primary-dark);

    .el-icon {
      transform: translateX(4px);
    }
  }
}

// 图片区
.card-image {
  width: 360px;
  flex-shrink: 0;
  overflow: hidden;

  .image-link {
    display: block;
    width: 100%;
    height: 100%;
    position: relative;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        to right,
        rgba(0, 0, 0, 0.05),
        transparent 20%,
        transparent 80%,
        rgba(0, 0, 0, 0.05)
      );
      opacity: 0;
      transition: opacity 0.3s;
    }

    &:hover {
      img {
        transform: scale(1.05);
      }

      .image-overlay {
        opacity: 1;
      }
    }
  }
}

// 响应式
@media (max-width: 1024px) {
  .article-card {
    flex-direction: column !important;

    .card-image {
      width: 100%;
      height: 200px;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0 !important;
    }

    .card-content {
      padding: 20px 24px;
    }
  }

  .article-card.compact.manage-mode {
    .card-image {
      width: 100%;
      min-height: 190px;
      border-radius: 0 !important;
    }
  }
}

@media (max-width: 640px) {
  .article-card {
    .card-content {
      padding: 16px 20px;
    }

    .article-title {
      font-size: 18px;
    }

    .article-stats {
      flex-wrap: wrap;
      gap: 12px;
    }

    .card-image {
      height: 180px;
    }
  }
}
</style>
