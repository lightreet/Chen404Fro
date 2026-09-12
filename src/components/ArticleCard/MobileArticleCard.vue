<template>
  <article class="mobile-article-card" :data-article-id="String(article.id)" :class="{ 'has-cover': showCover, 'has-actions': hasActions }">
    <div class="mobile-article-card__body">
      <div class="mobile-article-card__content">
        <h3><RouterLink :to="detailUrl" :title="article.title">{{ article.title }}</RouterLink></h3>
        <p class="mobile-article-card__summary">{{ article.summary }}</p>
        <div class="mobile-article-card__meta">
          <RouterLink v-if="article.category" :to="`/category/${article.category.id}`">{{ article.category.name }}</RouterLink>
          <span v-if="article.category" aria-hidden="true">·</span><time>{{ shortDate }}</time>
          <span v-if="manage" class="mobile-article-card__status">{{ article.status === 0 ? '草稿' : '已发布' }}</span>
        </div>
      </div>
      <RouterLink v-if="showCover" :to="detailUrl" class="mobile-article-card__thumbnail" tabindex="-1" aria-hidden="true">
        <img :src="article.coverImage" alt="" :loading="priority ? 'eager' : 'lazy'" @error="coverFailed = true" />
      </RouterLink>
    </div>
    <UiDropdown v-if="hasActions" class="mobile-article-card__actions" trigger="click" @command="handleAction">
      <button type="button" class="app-mobile-icon" :aria-label="`文章操作：${article.title}`"><UiIcon name="more" :size="22" /></button>
      <template #dropdown>
        <UiDropdownMenu>
          <UiDropdownItem v-if="article.canEdit" command="edit">编辑文章</UiDropdownItem>
          <UiDropdownItem v-if="article.canDelete" command="delete">删除文章</UiDropdownItem>
        </UiDropdownMenu>
      </template>
    </UiDropdown>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ArticleListItem } from '@/types';
import { UiDropdown, UiDropdownItem, UiDropdownMenu, UiIcon } from '@/components/ui';
const props = withDefaults(defineProps<{ article: ArticleListItem; manage?: boolean; priority?: boolean }>(), { manage: false, priority: false });
const emit = defineEmits<{ (e: 'edit', id: number | string): void; (e: 'delete', id: number | string): void }>();
const coverFailed = ref(false);
const showCover = computed(() => Boolean(props.article.coverImage && !coverFailed.value));
const hasActions = computed(() => props.manage && (props.article.canEdit || props.article.canDelete));
const detailUrl = computed(() => `/article/${props.article.id}`);
const shortDate = computed(() => (props.article.publishTime || props.article.createTime || '').slice(5, 10));
watch(() => props.article.coverImage, () => { coverFailed.value = false; });

function handleAction(command: string | number | object) {
  if (command === 'edit' && props.article.canEdit) emit('edit', props.article.id);
  if (command === 'delete' && props.article.canDelete) emit('delete', props.article.id);
}
</script>

<style scoped lang="scss">
.mobile-article-card { position: relative; width: 100%; min-width: 0; flex-shrink: 0; margin: 0; background: var(--color-surface); color: var(--color-text-primary); border-radius: var(--mobile-card-radius); overflow: hidden; }
.mobile-article-card__body { display: flex; align-items: flex-start; height: 154px; gap: 16px; padding: 16px; }
.mobile-article-card__content { display: flex; flex-direction: column; flex: 1; min-width: 0; height: 100%; }
// 内容区高度统一；标题和摘要各最多两行，剩余留白留在元信息上方。
h3 { flex-shrink: 0; max-height: 48px; margin: 0; font-size: 17px; line-height: 24px; font-weight: 600; }
h3 a { color: inherit; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.mobile-article-card__summary { display: -webkit-box; flex-shrink: 0; max-height: 40px; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 6px 0 0; font-size: 13px; line-height: 20px; color: var(--color-text-secondary); overflow-wrap: anywhere; }
.mobile-article-card__meta { display: flex; flex-shrink: 0; align-items: center; height: 20px; gap: 6px; margin-top: auto; color: var(--color-text-secondary); font-size: 12px; line-height: 20px; white-space: nowrap; }
.mobile-article-card__meta a { min-width: 0; overflow: hidden; text-overflow: ellipsis; color: inherit; }
.mobile-article-card__meta time, .mobile-article-card__meta > span { flex-shrink: 0; }
.mobile-article-card__thumbnail { width: 80px; height: 80px; flex-shrink: 0; border-radius: 12px; overflow: hidden; }
img { width: 100%; height: 100%; object-fit: cover; display: block; }
.mobile-article-card__actions { position: absolute; right: 34px; bottom: 4px; }
.mobile-article-card__actions .app-mobile-icon { color: var(--color-text-secondary); }
.has-actions:not(.has-cover) .mobile-article-card__meta { padding-right: 44px; }
.has-actions:not(.has-cover) .mobile-article-card__actions { right: 12px; }
.mobile-article-card__status { margin-left: auto; color: var(--color-accent-readable); }
.mobile-article-card a:focus-visible { outline: 2px solid var(--color-accent-readable); outline-offset: 2px; }
.mobile-article-card { border: var(--content-card-border, none); }
</style>
