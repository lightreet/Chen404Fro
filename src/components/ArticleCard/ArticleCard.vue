<template>
  <article
    class="article-card jp-card"
    :data-article-id="String(article.id)"
    :class="[
      { 'jp-card-hover': !disableHoverLift },
      { 'image-left': isImageLeft, 'image-right': !isImageLeft },
      { compact },
      {
        'manage-mode': mode === 'manage',
        'profile-feed': profileFeed,
        'has-cover': showCover,
        'no-cover': !showCover,
        'article-card--home-balanced': disableHoverLift,
        'article-card--has-scroll-float': hasScrollFloat,
      },
    ]"
    :style="scrollFloatStyles"
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
          <Icon class="stat-iconify" icon="mdi:heart-outline" width="14" height="14" aria-hidden="true" />
          {{ formatNumber(article.likeCount ?? 0) }}
        </span>
        <span class="stat-item">
          <el-icon><ChatDotRound /></el-icon>
          {{ article.commentCount ?? 0 }}
        </span>
        <router-link
          v-if="mode !== 'manage' && article.category"
          :to="`/category/${article.category.id}`"
          class="stat-item category-tag"
          @click.stop
        >
          <Icon
            class="category-icon-iconify"
            :icon="resolveCategoryIcon(article.category.icon)"
            width="14"
            height="14"
          />
          {{ article.category.name }}
        </router-link>
        <span v-else-if="article.category" class="stat-item category-tag">
          <Icon
            class="category-icon-iconify"
            :icon="resolveCategoryIcon(article.category.icon)"
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
          <el-button v-if="article.canEdit" text type="primary" @click="$emit('edit', article.id)">编辑</el-button>
          <el-button v-if="article.canDelete" text type="danger" @click="$emit('delete', article.id)">删除</el-button>
        </template>
        <router-link v-else :to="articleDetailUrl" class="read-more" @click.stop>
          <span>阅读详情</span>
          <el-icon><ArrowRight /></el-icon>
        </router-link>
      </div>
    </div>

    <!-- 封面图（加载失败时收起，避免大块空白） -->
    <div class="card-image" v-if="showCover">
      <router-link v-if="mode !== 'manage'" :to="`/article/${article.id}`" class="image-link">
        <img
          :src="article.coverImage"
          :alt="article.title"
          :loading="coverPriority ? 'eager' : 'lazy'"
          :fetchpriority="coverPriority ? 'high' : undefined"
          decoding="async"
          @error="onCoverError"
        />
        <div class="image-overlay" aria-hidden="true"></div>
      </router-link>
      <div v-else class="image-link">
        <img
          :src="article.coverImage"
          :alt="article.title"
          :loading="coverPriority ? 'eager' : 'lazy'"
          :fetchpriority="coverPriority ? 'high' : undefined"
          decoding="async"
          @error="onCoverError"
        />
        <div class="image-overlay" aria-hidden="true"></div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { Calendar, View, ChatDotRound, ArrowRight, User } from '@element-plus/icons-vue';
import type { Article } from '@/types';
import { formatDate, formatNumber } from '@/utils/format';
import { resolveCategoryIcon } from '@/utils/categoryIcon';

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
  /** 个人中心「点赞/收藏」等与「我的文章」同规格：固定左文右图、封面宽度与 manage 紧凑态一致 */
  profileFeed?: boolean;
  /** 首屏条目可设为 true：eager + fetchpriority=high */
  coverPriority?: boolean;
  disableHoverLift?: boolean;
  /**
   * 首页滚动：距视口垂直中心的悬浮强度 0~1（由 Home 按距离衰减计算；中心为 1）
   */
  scrollFloatStrength?: number;
  /**
   * 首页摩天轮相位：(cardMidY - midY) / R，约 -1~1；视口上方为负、下方为正
   */
  scrollWheelPhase?: number;
}

const props = withDefaults(defineProps<Props>(), {
  index: 0,
  mode: 'home',
  compact: false,
  profileFeed: false,
  coverPriority: false,
  disableHoverLift: false,
  scrollFloatStrength: 0,
  scrollWheelPhase: 0,
});

const hasScrollFloat = computed(() => !props.disableHoverLift && props.scrollFloatStrength > 0.002);

/**
 * CSS 变量驱动 translateZ / translateY / scale / rotateX；rotateX 在脚本中算好角度避免 calc 与 deg 嵌套问题。
 * 覆盖 jp-card-hover 的 hover:translateY：在 SCSS 里对 :hover 写完整 transform。
 */
const scrollFloatStyles = computed((): Record<string, string | number> => {
  if (props.disableHoverLift) return {};
  const s = Math.min(1, Math.max(0, props.scrollFloatStrength));
  if (s <= 0.002) return {};
  const ph = Math.min(1, Math.max(-1, props.scrollWheelPhase));
  const rotateXDeg = -ph * (10 - 6 * s);
  return {
    '--scroll-float': String(s),
    '--scroll-wheel-phase': String(ph),
    '--scroll-rotate-x': `${rotateXDeg}deg`,
    zIndex: Math.round(2 + 10 * s),
  };
});

const coverLoadFailed = ref(false);

watch(
  () => [props.article.id, props.article.coverImage] as const,
  () => {
    coverLoadFailed.value = false;
  }
);

const showCover = computed(() => !!(props.article.coverImage && !coverLoadFailed.value));

function onCoverError() {
  coverLoadFailed.value = true;
}

// 根据索引决定图片位置（奇数左，偶数右）；个人中心 profile-feed 与 manage 一致，始终左文右图
const isImageLeft = computed(() => {
  if (props.mode === 'manage' || props.profileFeed) return false;
  return props.index % 2 === 1;
});

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
  position: relative;
  z-index: 0;
  /* 卡片视觉由 UnoCSS jp-card / jp-card-hover 提供 */
  transition:
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.45s cubic-bezier(0.22, 1, 0.36, 1);

  // 首页摩天轮：translateZ + 强 scale + phase*rotateX；与 jp-card-hover 的 hover 位移合并到下方 :hover
  &.article-card--has-scroll-float {
    /*
     * translateZ 会把命中盒拉向相机，未抬升的卡片区域仍占原布局盒，易出现「点了阅读详情却点到上一张卡」或看似无响应。
     * 外壳不接收事件，仅正文区与封面链接可点（与内部 router-link / 整块 goToDetail 一致）。
     */
    pointer-events: none;
    .card-content,
    .card-image .image-link {
      pointer-events: auto;
    }

    transform-style: preserve-3d;
    backface-visibility: hidden;
    transform:
      translateZ(calc(60px * var(--scroll-float, 0)))
      translateY(calc(-4px - 22px * var(--scroll-float, 0)))
      scale(calc(0.9 + 0.12 * var(--scroll-float, 0)))
      rotateX(var(--scroll-rotate-x, 0deg));
    box-shadow:
      0 calc(10px + 28px * var(--scroll-float, 0)) calc(28px + 52px * var(--scroll-float, 0))
        rgba(15, 23, 42, 0.14),
      0 calc(4px + 12px * var(--scroll-float, 0)) calc(16px + 28px * var(--scroll-float, 0))
        rgba(251, 114, 153, 0.14),
      0 0 0 calc(1px * var(--scroll-float, 0)) rgba(251, 114, 153, 0.16);

    // 等价于 Uno `hover:-translate-y-1`（4px），避免覆盖整条 transform
    &:hover {
      transform:
        translateZ(calc(60px * var(--scroll-float, 0)))
        translateY(calc(-8px - 22px * var(--scroll-float, 0)))
        scale(calc(0.9 + 0.12 * var(--scroll-float, 0)))
        rotateX(var(--scroll-rotate-x, 0deg));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &.article-card--has-scroll-float {
      transform: none;
      &:hover {
        transform: none;
      }
      box-shadow:
        0 8px 24px rgba(15, 23, 42, 0.08),
        0 0 0 1px rgba(251, 114, 153, 0.1);
    }
  }

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

.article-card.manage-mode,
.article-card.profile-feed {
  align-items: stretch;
  overflow: hidden;

  &.image-left,
  &.image-right {
    flex-direction: row;
  }

  &.no-cover {
    .card-content {
      min-height: 150px;
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

.article-card.article-card--home-balanced {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: stretch;
  width: min(100%, 735px);
  min-height: 300px;
  overflow: hidden;
  margin-left: auto;
  margin-right: auto;
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease;

  &:hover {
    transform: translateY(-6px);
    box-shadow:
      0 18px 40px rgba(15, 23, 42, 0.12),
      0 6px 20px rgba(251, 114, 153, 0.12);
  }

  .card-content {
    max-width: none;
    min-height: 100%;
    padding: 30px 36px;
  }

  .card-image {
    width: 100%;
    min-width: 0;
    min-height: 100%;
    border-radius: 0;

    .image-link,
    img {
      width: 100%;
      height: 100%;
    }
  }

  &.image-left {
    .card-content {
      order: 2;
    }

    .card-image {
      order: 1;
    }
  }

  &.image-right {
    .card-content {
      order: 1;
    }

    .card-image {
      order: 2;
    }
  }

  &.no-cover {
    display: block;

    .card-content {
      min-height: 300px;
    }
  }

  .image-link:hover {
    img {
      transform: scale(1.08) rotate(1.8deg);
    }

    .image-overlay {
      opacity: 1;
    }
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

.article-card.compact.manage-mode,
.article-card.compact.profile-feed {
  border: 1px solid rgba(226, 232, 240, 0.85);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);

  .card-content {
    padding: 12px 14px;
  }

  .article-meta {
    gap: 6px;
    margin-bottom: 6px;
  }

  .article-title {
    font-size: 15px;
    margin-bottom: 5px;
  }

  .article-stats {
    gap: 6px 10px;
    flex-wrap: wrap;
    margin-bottom: 5px;
  }

  .article-summary {
    font-size: 13px;
    line-height: 1.65;
    margin-bottom: 7px;
    -webkit-line-clamp: 2;
  }

  .article-tags {
    margin-bottom: 7px;
  }

  .article-action {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-top: 6px;
    border-top: 1px dashed var(--border-light);
  }

  .article-action .el-button + .el-button {
    margin-left: 0;
  }

  .card-image {
    width: 180px;
    min-height: 150px;
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

  .stat-iconify {
    flex-shrink: 0;
    color: var(--text-secondary);
    vertical-align: middle;
  }

  &.category-tag {
    /* 与评论等统计项统一为次要文字色；链接态与清单页 /category/:id 一致 */
    color: inherit;
    cursor: pointer;
    text-decoration: none;

    .category-icon-iconify {
      flex-shrink: 0;
      vertical-align: middle;
    }

    &:hover {
      color: var(--primary);
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
      pointer-events: none;
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
@media (max-width: 900px) {
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

  .article-card.article-card--home-balanced {
    display: flex;

    .card-content {
      flex: 1 1 auto;
      min-height: auto;
      padding: 20px 24px;
    }

    .card-image {
      width: 100%;
      min-height: 220px;
    }
  }

  .article-card.compact.manage-mode,
  .article-card.compact.profile-feed {
    .card-image {
      width: 100%;
      min-height: 150px;
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
