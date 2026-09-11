<template>
  <article class="mobile-article-card" :class="{ 'is-featured': featured, 'has-cover': showCover }">
    <RouterLink v-if="featured && showCover" :to="detailUrl" class="mobile-article-card__hero" tabindex="-1" aria-hidden="true">
      <img :src="article.coverImage" alt="" :loading="priority ? 'eager' : 'lazy'" @error="coverFailed = true" />
    </RouterLink>
    <div class="mobile-article-card__body">
      <div class="mobile-article-card__content">
        <h3><RouterLink :to="detailUrl">{{ article.title }}</RouterLink></h3>
        <p class="mobile-article-card__summary" v-if="article.summary">{{ article.summary }}</p>
        <div class="mobile-article-card__meta">
          <template v-if="featured && article.author">
            <RouterLink :to="`/user/${article.author.id}`" class="mobile-article-card__author">
              <UiAvatar :src="article.author.avatar" :size="22">{{ authorName.slice(0, 1) }}</UiAvatar><span>{{ authorName }}</span>
            </RouterLink>
            <span>{{ shortDate }} · {{ formatNumber(article.viewCount || 0) }} 阅读</span>
          </template>
          <template v-else>
            <RouterLink v-if="article.category" :to="`/category/${article.category.id}`">{{ article.category.name }}</RouterLink>
            <span v-if="article.category">·</span><time>{{ shortDate }}</time>
            <span v-if="manage" class="mobile-article-card__status">{{ article.status === 0 ? '草稿' : '已发布' }}</span>
          </template>
        </div>
      </div>
      <RouterLink v-if="!featured && showCover" :to="detailUrl" class="mobile-article-card__thumbnail" tabindex="-1" aria-hidden="true">
        <img :src="article.coverImage" alt="" :loading="priority ? 'eager' : 'lazy'" @error="coverFailed = true" />
      </RouterLink>
    </div>
    <div v-if="manage && (article.canEdit || article.canDelete)" class="mobile-article-card__actions">
      <UiButton v-if="article.canEdit" variant="text" icon="edit" @click="emit('edit', article.id)">编辑</UiButton>
      <UiButton v-if="article.canDelete" variant="text" icon="delete" @click="emit('delete', article.id)">删除</UiButton>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ArticleListItem } from '@/types';
import { UiAvatar, UiButton } from '@/components/ui';
import { formatNumber } from '@/utils/format';
const props = withDefaults(defineProps<{ article: ArticleListItem; featured?: boolean; manage?: boolean; priority?: boolean }>(), { featured: false, manage: false, priority: false });
const emit = defineEmits<{ (e: 'edit', id: number | string): void; (e: 'delete', id: number | string): void }>();
const coverFailed = ref(false);
const showCover = computed(() => Boolean(props.article.coverImage && !coverFailed.value));
const detailUrl = computed(() => `/article/${props.article.id}`);
const authorName = computed(() => props.article.author?.nickname || props.article.author?.username || '');
const shortDate = computed(() => (props.article.publishTime || props.article.createTime || '').slice(5, 10));
watch(() => props.article.coverImage, () => { coverFailed.value = false; });
</script>

<style scoped lang="scss">
.mobile-article-card { background: var(--color-surface); color: var(--color-text-primary); border-radius: var(--mobile-card-radius); overflow: hidden; }
.mobile-article-card__body { display: flex; align-items: center; gap: 16px; padding: 16px; }
.mobile-article-card__content { flex: 1; min-width: 0; }
h3 { font-size: 17px; line-height: 1.5; font-weight: 600; }
h3 a { color: inherit; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.mobile-article-card__summary { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 6px; font-size: 13px; line-height: 1.75; color: var(--color-text-secondary); overflow-wrap: anywhere; }
.mobile-article-card__meta { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 10px; color: var(--color-text-secondary); font-size: 12px; }
.mobile-article-card__meta a { color: inherit; }
.mobile-article-card__thumbnail { width: 80px; height: 80px; flex-shrink: 0; border-radius: 12px; overflow: hidden; }
img { width: 100%; height: 100%; object-fit: cover; display: block; }
.mobile-article-card__hero { display: block; width: 100%; aspect-ratio: 2.9; overflow: hidden; }
.is-featured .mobile-article-card__body { padding: 20px 16px 16px; }
.is-featured h3 { font-size: 20px; }
.is-featured .mobile-article-card__summary { font-size: 15px; }
.is-featured .mobile-article-card__meta { justify-content: space-between; margin-top: 16px; }
.mobile-article-card__author { display: flex; align-items: center; gap: 6px; min-height: 28px; }
.mobile-article-card__actions { display: flex; gap: 12px; justify-content: flex-end; padding: 0 12px 8px; }
.mobile-article-card__status { margin-left: auto; color: var(--color-accent-readable); }
</style>
