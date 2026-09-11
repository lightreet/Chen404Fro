<template>
  <div class="app-topic-navigation">
    <slot name="search">
      <RouterLink to="/search" class="app-topic-navigation__search">
        <UiIcon name="search" :size="20" />
        <span>搜索主题或文章</span>
      </RouterLink>
    </slot>
    <nav class="app-topic-navigation__tabs" aria-label="主题浏览方式">
      <RouterLink
        v-for="item in sections"
        :key="item.key"
        :to="item.to"
        :aria-current="active === item.key ? 'page' : undefined"
        :class="{ 'is-active': active === item.key }"
      >{{ item.label }}</RouterLink>
    </nav>
    <h1 class="app-topic-navigation__heading">{{ heading }}</h1>
  </div>
</template>

<script setup lang="ts">
import { UiIcon } from '@/components/ui';

defineProps<{ active: 'category' | 'tag'; heading: string }>();
const sections = [
  { key: 'category', to: '/category', label: '分类' },
  { key: 'tag', to: '/tag', label: '标签' },
] as const;
</script>

<style scoped lang="scss">
.app-topic-navigation { margin-bottom: 16px; }
.app-topic-navigation__search {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 0 16px;
  border-radius: var(--mobile-control-radius);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 14px;
  text-decoration: none;
}
.app-topic-navigation__tabs {
  display: flex;
  gap: 8px;
  margin-top: 10px;

  a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0 16px;
    border-radius: var(--radius-pill);
    background: var(--color-surface);
    color: var(--color-text-secondary);
    font-size: 14px;
    text-decoration: none;
  }

  .is-active {
    background: var(--color-text-primary);
    color: var(--color-canvas);
    font-weight: 600;
  }
}
.app-topic-navigation__heading {
  margin: 12px 0 0;
  font-size: 18px;
  line-height: 1.5;
  font-weight: 600;
  color: var(--color-text-primary);
}
.app-topic-navigation a:focus-visible {
  outline: 2px solid var(--color-accent-readable);
  outline-offset: 3px;
}
</style>
