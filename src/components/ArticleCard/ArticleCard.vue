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
      <template v-if="isProfileLayout">
        <div class="profile-meta-row">
          <div class="article-meta article-meta--profile">
            <el-icon class="meta-date-icon"><Calendar /></el-icon>
            <span>{{ formatDate(article.publishTime ?? article.createTime ?? '') }}</span>
            <template v-if="authorName">
              <span class="meta-sep">·</span>
              <el-icon class="author-icon"><User /></el-icon>
              <router-link
                v-if="authorProfileUrl"
                :to="authorProfileUrl"
                class="author-name author-name--link"
                @click.stop
              >{{ authorName }}</router-link>
              <span v-else class="author-name">{{ authorName }}</span>
            </template>
          </div>

          <div class="profile-meta-extra">
            <router-link
              v-if="mode !== 'manage' && article.category"
              :to="`/category/${article.category.id}`"
              class="meta-pill meta-pill--link"
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
            <span v-else-if="article.category" class="meta-pill">
              <Icon
                class="category-icon-iconify"
                :icon="resolveCategoryIcon(article.category.icon)"
                width="14"
                height="14"
              />
              {{ article.category.name }}
            </span>
            <span v-if="mode === 'manage'" class="meta-pill" :class="`status-pill status-pill--${article.status ?? 'other'}`">
              {{ article.status === 0 ? '草稿' : article.status === 1 ? '已发布' : '其他' }}
            </span>
          </div>
        </div>

        <h3 class="article-title article-title--profile">
          <router-link v-if="mode !== 'manage'" :to="articleDetailUrl" @click.stop>
            {{ article.title }}
          </router-link>
          <span v-else>{{ article.title }}</span>
        </h3>

        <p class="article-summary article-summary--profile">{{ article.summary || '暂无摘要' }}</p>

        <div class="profile-bottom-row">
          <div class="article-tags article-tags--profile" v-if="article.tags && article.tags.length > 0">
            <span
              v-for="tag in article.tags"
              :key="tag.id"
              class="tag jp-chip"
            >
              {{ tag.name }}
            </span>
          </div>

          <div class="article-stats article-stats--profile">
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
          </div>
        </div>

        <div class="article-action article-action--profile">
          <div v-if="mode === 'manage'" class="profile-manage-actions">
            <el-button
              v-if="article.canEdit"
              text
              class="action-link action-link--edit"
              @click.stop="$emit('edit', article.id)"
            >
              编辑
            </el-button>
            <el-button
              v-if="article.canDelete"
              text
              class="action-link action-link--delete"
              @click.stop="$emit('delete', article.id)"
            >
              删除
            </el-button>
          </div>
          <router-link :to="articleDetailUrl" class="read-more read-more--profile" @click.stop>
            <span>阅读详情</span>
            <el-icon><ArrowRight /></el-icon>
          </router-link>
        </div>
      </template>

      <template v-else>
        <!-- 日期与作者 -->
        <div class="article-meta">
          <el-icon class="meta-date-icon"><Calendar /></el-icon>
          <span>{{ formatDate(article.publishTime ?? article.createTime ?? '') }}</span>
          <template v-if="authorName">
            <span class="meta-sep">·</span>
            <el-icon class="author-icon"><User /></el-icon>
            <router-link
              v-if="authorProfileUrl"
              :to="authorProfileUrl"
              class="author-name author-name--link"
              @click.stop
            >{{ authorName }}</router-link>
            <span v-else class="author-name">{{ authorName }}</span>
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
      </template>
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
const isProfileLayout = computed(() => props.mode === 'manage' || props.profileFeed);

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

const authorProfileUrl = computed(() => {
  const id = props.article.author?.id ?? props.article.authorId;
  return id != null ? `/user/${id}` : '';
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
  width: min(100%, 820px);
  min-height: 300px;
  overflow: hidden;
  margin-left: auto;
  margin-right: auto;
  box-shadow:
    0 20px 44px rgba(15, 23, 42, 0.09),
    0 8px 22px rgba(251, 114, 153, 0.1);
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease;

  &:hover {
    transform: translateY(-6px);
    box-shadow:
      0 24px 54px rgba(15, 23, 42, 0.14),
      0 10px 28px rgba(251, 114, 153, 0.14);
  }

  .card-content {
    max-width: none;
    min-height: 100%;
    padding: 30px 34px;
  }

  .card-image {
    width: 100%;
    min-width: 0;
    min-height: 100%;
    height: 100%;
    aspect-ratio: 16 / 10;
    border-radius: 0;

    .image-link,
    img {
      width: 100%;
      height: 100%;
    }

    img {
      object-fit: cover;
      object-position: center;
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
    padding: 14px 18px;
  }

  .article-meta {
    font-size: 11px;
    margin-bottom: 6px;
  }

  .article-title {
    font-size: 15px;
    margin-bottom: 8px;
  }

  .article-stats {
    gap: 10px;
    margin-bottom: 8px;
    font-size: 11px;
  }

  .article-summary {
    font-size: 12px;
    margin-bottom: 8px;
    -webkit-line-clamp: 2;
  }

  .article-tags {
    gap: 5px;
    margin-bottom: 8px;
  }

  .tag {
    padding: 2px 7px;
    font-size: 10px;
  }

  .read-more,
  .article-action .el-button {
    font-size: 12px;
  }

  .card-image {
    width: 220px;
  }
}

.article-card.compact.manage-mode,
.article-card.compact.profile-feed {
  width: min(100%, 560px);
  margin-left: auto;
  margin-right: auto;
  align-items: stretch;
  min-height: 180px;
  border: 1px solid rgba(245, 155, 188, 0.12);
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 252, 254, 0.96)),
    linear-gradient(135deg, rgba(255, 243, 248, 0.36), rgba(247, 244, 255, 0.24));
  box-shadow:
    0 12px 24px rgba(15, 23, 42, 0.05),
    0 5px 14px rgba(245, 155, 188, 0.07);
  overflow: hidden;
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease,
    border-color 0.28s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(245, 155, 188, 0.18);
    box-shadow:
      0 16px 28px rgba(15, 23, 42, 0.07),
      0 7px 18px rgba(245, 155, 188, 0.1);
  }

  .card-content {
    padding: 16px 18px 12px;
  }

  .profile-meta-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }

  .article-meta--profile {
    margin-bottom: 0;
    color: #8f93a8;
    font-size: 11px;
  }

  .profile-meta-extra {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 5px;
    align-items: center;
  }

  .meta-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 26px;
    padding: 0 10px;
    border-radius: 999px;
    background: rgba(255, 244, 248, 0.92);
    color: #7c8198;
    font-size: 11px;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.22s ease, color 0.22s ease, transform 0.22s ease;
  }

  .meta-pill--link:hover {
    background: rgba(255, 235, 243, 0.98);
    color: #f59bbc;
    transform: translateY(-1px);
  }

  .status-pill--0 {
    background: rgba(244, 240, 255, 0.95);
    color: #8879b8;
  }

  .status-pill--1 {
    background: rgba(238, 250, 238, 0.95);
    color: #7aa36e;
  }

  .status-pill--other {
    background: rgba(255, 246, 233, 0.95);
    color: #c28c58;
  }

  .article-title--profile {
    font-size: 17px;
    font-weight: 700;
    line-height: 1.4;
    margin-bottom: 8px;
    color: #4e5065;
    width: 100%;
  }

  .article-title--profile a,
  .article-title--profile span {
    color: #4e5065;
    text-decoration: none;
    transition: color 0.22s ease;
  }

  .article-title--profile a:hover {
    color: #f59bbc;
  }

  .article-summary--profile {
    font-size: 12px;
    line-height: 1.6;
    color: #8f93a8;
    width: 100%;
    margin-bottom: 10px;
    -webkit-line-clamp: 2;
  }

  .profile-bottom-row {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-top: auto;
    margin-bottom: 0;
    width: 100%;
    align-items: flex-start;
  }

  .article-tags--profile {
    gap: 7px;
    margin-bottom: 0;
  }

  .article-tags--profile .tag {
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(244, 241, 248, 0.9);
    color: #7c8198;
    font-size: 10px;
  }

  .article-stats--profile {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 7px 12px;
    margin-bottom: 0;
    margin-top: 0;
    padding-left: 2px;
    font-size: 11px;
    color: #7f8499;
    width: 100%;
  }

  .article-stats--profile .stat-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 18px;
    line-height: 1;
  }

  .article-stats--profile .stat-item .el-icon,
  .article-stats--profile .stat-item .stat-iconify {
    width: 13px;
    height: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .article-action--profile {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 30px;
    margin-top: 0;
    padding-top: 7px;
    border-top: 1px dashed rgba(245, 155, 188, 0.16);
    width: 100%;
  }

  .profile-manage-actions {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    justify-content: flex-start;
  }

  .action-link {
    min-height: 28px;
    padding: 0 10px;
    margin: 0;
    border-radius: 999px;
    background: transparent;
    color: #8185a0;
    font-size: 12px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition:
      color 0.22s ease,
      background-color 0.22s ease,
      box-shadow 0.22s ease,
      transform 0.22s ease;
  }

  .action-link + .action-link {
    margin-left: 0;
  }

  .action-link:hover,
  .action-link:focus-visible,
  .action-link--edit:hover,
  .action-link--edit:focus-visible {
    background: rgba(255, 241, 246, 0.82);
    color: #f59bbc;
    transform: translateY(-1px);
    box-shadow: 0 10px 18px rgba(245, 155, 188, 0.12);
  }

  .action-link--delete:hover,
  .action-link--delete:focus-visible {
    background: rgba(255, 240, 244, 0.92);
    color: #eb7f96;
    box-shadow: 0 10px 18px rgba(235, 127, 150, 0.12);
  }

  .read-more--profile {
    margin-left: auto;
    color: #8185a0;
    font-size: 12px;
    font-weight: 600;
  }

  .read-more--profile:hover {
    color: #f59bbc;
  }

  .card-image {
    flex: 0 0 168px;
    width: 168px;
    min-width: 168px;
    height: 118px;
    min-height: 118px;
    margin: 12px 12px 12px 0;
    align-self: center;
    border-radius: 16px;
    overflow: hidden;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0)),
      var(--bg-hover);
    box-shadow:
      0 8px 18px rgba(15, 23, 42, 0.075),
      0 4px 10px rgba(245, 155, 188, 0.075);
    aspect-ratio: 16 / 10;
    transition: transform 0.32s ease, box-shadow 0.32s ease;

    .image-link {
      display: flex;
      height: 100%;
      width: 100%;
    }

    img {
      display: block;
      height: 100%;
      width: 100%;
      object-fit: cover;
      object-position: center;
      transition: transform 0.38s ease;
    }
  }

  &:hover .card-image {
    box-shadow:
      0 12px 24px rgba(15, 23, 42, 0.09),
      0 5px 12px rgba(245, 155, 188, 0.1);
  }

  &:hover .card-image img {
    transform: scale(1.04);
  }
}

.article-card.compact.manage-mode,
.article-card.compact.profile-feed {
  border: none;
  border-radius: 22px;
  background: transparent;
  box-shadow: inset 0 0 0 1px rgba(214, 206, 229, 0.08);
  overflow: visible;
  isolation: isolate;
  transition:
    transform 0.24s ease,
    filter 0.24s ease,
    box-shadow 0.24s ease,
    border-color 0.24s ease;

  &::before,
  &::after {
    content: '';
    position: absolute;
    pointer-events: none;
    width: 88px;
    height: 64px;
    opacity: 0.92;
    transition:
      opacity 0.22s ease,
      transform 0.22s ease,
      box-shadow 0.22s ease;
  }

  &::before {
    top: 0;
    left: 0;
    border-top: 2px solid rgba(245, 155, 188, 0.48);
    border-left: 2px solid rgba(245, 155, 188, 0.48);
    border-top-left-radius: 20px;
    box-shadow: -2px -2px 16px rgba(245, 155, 188, 0.1);
  }

  &::after {
    right: 0;
    bottom: 0;
    border-right: 2px solid rgba(245, 155, 188, 0.48);
    border-bottom: 2px solid rgba(245, 155, 188, 0.48);
    border-bottom-right-radius: 20px;
    box-shadow: 2px 2px 16px rgba(245, 155, 188, 0.1);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow:
      inset 0 0 0 1px rgba(245, 155, 188, 0.5),
      0 16px 34px rgba(209, 186, 225, 0.16),
      0 8px 24px rgba(245, 155, 188, 0.12);
    filter: saturate(1.02);

    &::before,
    &::after {
      opacity: 0;
    }

    &::before {
      transform: translate(-3px, -3px);
    }

    &::after {
      transform: translate(3px, 3px);
    }
  }

  .card-content {
    position: relative;
    padding: 18px 20px 14px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
    transition: background 0.24s ease;
  }

  .article-action--profile {
    border-top-color: rgba(245, 155, 188, 0.1);
  }

  .card-image {
    margin: 16px 0 16px 0;
    box-shadow:
      0 10px 24px rgba(15, 23, 42, 0.06),
      0 4px 10px rgba(245, 155, 188, 0.06);
  }

  &:hover .card-content {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0.14));
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

  .author-name--link {
    text-decoration: none;

    &:hover {
      color: var(--primary);
      text-decoration: underline;
      text-underline-offset: 2px;
    }
  }
}

.article-title {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
  margin: 0 0 14px;

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
  margin-bottom: 14px;
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
  line-height: 1.72;
  color: var(--text-secondary);
  margin: 0 0 14px;
  flex: 1;

  // 多行截断
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-card.article-card--home-balanced .article-summary {
  -webkit-line-clamp: 4;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
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
    min-height: auto;

    .profile-meta-row {
      flex-direction: column;
      align-items: flex-start;
    }

    .profile-meta-extra {
      justify-content: flex-start;
    }

    .card-image {
      width: 100%;
      min-width: 100%;
      height: 180px;
      min-height: 180px;
      margin: 0;
      aspect-ratio: auto;
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

  .article-card.compact.manage-mode,
  .article-card.compact.profile-feed {
    .card-content {
      padding: 16px 16px 18px;
    }

    .article-title--profile {
      font-size: 17px;
    }

    .profile-bottom-row {
      gap: 8px;
    }

    .article-action--profile {
      padding-top: 10px;
    }
  }
}
</style>
